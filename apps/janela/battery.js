/* battery.js — Janela's gate: the rule packs agree with the acts they cite,
   DNV's table is read exactly, the records re-derive from their inputs, and
   the reds that must fire, fire.
   Run: node apps/janela/battery.js      (exit != 0 on any failure)
   apps/janela · cert-machine                                             MIT */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Q = require('../../instruments/window/q.js');
const D = require('../../instruments/window/decide.js');
const W = require('../../instruments/window/workability.js');
const DNV = require('./audit/dnv.js');
const T = require('./audit/today.js');

const ROOT = path.join(__dirname, '..', '..');
const OPS = require('./scenario/operations.json').operations;
const NPCP = require('./scenario/rules/npcp.json');
const SITES = require('./scenario/sites.json').sites;
const RULES = Object.fromEntries(NPCP.rules.map((r) => [r.id, r]));

let n = 0, reds = 0;
const ok = (name, fn) => { fn(); n++; console.log('PASS ' + name); };
const red = (name, fn) => { fn(); reds++; console.log('PASS ' + name + ' (RED ok)'); };
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, p))).digest('hex');

/* ---- the sites: one definition, unique ids, every operation's site exists ---- */
ok('sites: unique ids; every operation names a known site', () => {
  const ids = SITES.map((s) => s.id);
  assert.strictEqual(new Set(ids).size, ids.length);
  for (const op of OPS) assert.ok(ids.includes(op.site), op.id + ' -> ' + op.site);
});

/* ---- the operations agree with the acts they cite ---- */
function checkOp(op) {
  const r = RULES[op.rule];
  if (!r) throw new Error('REFUSED: ' + op.id + ' cites no rule ' + op.rule);
  if (r.site !== op.site) throw new Error('REFUSED: ' + op.id + ' is at ' + op.site + ' but its rule is at ' + r.site);
  if (!NPCP.sources[r.source]) throw new Error('REFUSED: rule ' + r.id + ' cites no pinned source');
  /* every limit value Janela decides must be printed in the act's limits, for the same variable and unit */
  for (const l of op.limits) {
    const printed = r.limits.some((p) => p.var === l.var && p.unit === l.unit && Q.cmp(Q.parse(p.value), Q.parse(l.value)) === 0);
    if (!printed) throw new Error('REFUSED: ' + op.id + ' limits ' + l.var + ' ' + l.op + ' ' + l.value + ' ' + l.unit + ', which ' + r.id + ' does not print');
  }
}
ok('operations: each cites a pinned act, at its own site, and every value it decides is printed there', () => { OPS.forEach(checkOp); });
red('RED: an operation with a value the act does not print is REFUSED', () => {
  const bad = JSON.parse(JSON.stringify(OPS[0])); bad.limits[0].value = '2.1';
  assert.throws(() => checkOp(bad), /does not print/);
});
red('RED: an operation citing a rule that does not exist is REFUSED', () => {
  assert.throws(() => checkOp({ ...OPS[0], rule: 'no-such-rule' }), /cites no rule/);
});
ok('sources: every act in the pack carries a url and a sha256', () => {
  for (const [k, s] of Object.entries(NPCP.sources)) { assert.ok(/^https?:\/\//.test(s.url), k); assert.ok(/^[0-9a-f]{64}$/.test(s.sha256), k); }
});

/* ---- DNV's alpha, read exactly ---- */
ok('DNV Table 4-1 read exactly: 2 m / TPOP 24 h = 73/100; 3 m (between 2 and 4) / 24 h = 149/200; 8 m = the >= 6 m column', () => {
  assert.strictEqual(Q.str(DNV.alpha('4-1', '2', 24)), '73/100');
  assert.strictEqual(Q.str(DNV.alpha('4-1', '3.0', 24)), '149/200');      /* (0.73 + 0.76) / 2 */
  assert.strictEqual(Q.str(DNV.alpha('4-1', '8', 72)), '18/25');           /* 0.72 */
  assert.strictEqual(Q.str(DNV.alpha('4-1', '2.5', 13)), Q.str(Q.parse('0.7375')));  /* row 'TPOP <= 24' */
});
red('RED: below 1 m and beyond 72 h DNV gives no alpha — null, never an extrapolation', () => {
  assert.strictEqual(DNV.alpha('4-1', '0.8', 24), null);
  assert.strictEqual(DNV.alpha('4-1', '2', 96), null);
});

/* ---- the workability record re-derives from the pinned hindcast ---- */
const WREC = path.join(ROOT, 'certs', 'janela-workability.json');
ok('workability record: modules unchanged since it was written, and three cells re-derived equal to the record', () => {
  const rec = JSON.parse(fs.readFileSync(WREC, 'utf8'));
  for (const [p, h] of Object.entries(rec.modules)) assert.strictEqual(sha(p), h, p + ' changed since the record was written — rebuild it (node apps/janela/audit/climate.js)');
  const H = require('./audit/hindcast.js');
  for (const [sid, cell] of [['santos', '2.5m/48h'], ['campos', '1.5m/12h'], ['pelotas', '4.0m/72h']]) {
    const c = rec.sites[sid].cells[cell];
    const [lim, tr] = cell.split('m/');
    const s = H.load(rec.sites[sid].node);
    const a = W.workability(s, { limit: lim, TR: parseInt(tr, 10) });
    assert.deepStrictEqual(a.months.map((m) => [m.workable, m.starts, m.meanWaitH]).concat([[a.all.workable, a.all.starts, a.all.meanWaitH]]), c.oplim, sid + ' ' + cell);
    const b = W.workability(s, { limit: c.opwf, TR: parseInt(tr, 10) });
    assert.deepStrictEqual(b.all.workable, c.opwfCells[12][0]);
    assert.strictEqual(c.opwf, Q.str(Q.mul(DNV.alpha('4-1', lim, parseInt(tr, 10) / 2), Q.parse(lim))));
  }
});
red('RED: a record cell altered by one start is caught by re-derivation', () => {
  const rec = JSON.parse(fs.readFileSync(WREC, 'utf8'));
  const c = rec.sites.santos.cells['2.5m/48h'];
  const H = require('./audit/hindcast.js');
  const a = W.workability(H.load('santos'), { limit: '2.5', TR: 48 });
  assert.notStrictEqual(a.all.workable, c.oplim[12][0] + 1);
});

/* ---- the week: the speed enclosure, the berth rule, determinism ---- */
ok('speed enclosure: sqrt(25/4) = [5/2, 5/2] exactly; sqrt(2) enclosed within 1e-6', () => {
  const [lo, hi] = T.sqrtEnc([25n, 4n]);
  assert.strictEqual(Q.str(lo), '5/2'); assert.strictEqual(Q.str(hi), '5/2');
  const [a, b] = T.sqrtEnc([2n, 1n]);
  assert.ok(Q.cmp(Q.mul(a, a), [2n, 1n]) <= 0 && Q.cmp(Q.mul(b, b), [2n, 1n]) >= 0);
  assert.ok(Q.cmp(Q.sub(b, a), Q.parse('0.000001')) <= 0);
});
function weekFrom(bandsCell) {
  const feed = { run: '2026-10-06T00', madeAt: 'x', sites: { babitonga: { kind: 'terminal', node: [-26.25, -48.5], steps: [
    { t: '2026-10-07T00', lead: 24, hs: { det: '3' }, wind: { u: '3', v: '4' } }] } } };
  const bands = { binHours: 12, borrow: { babitonga: 'floripa' }, sites: { floripa: { bins: { 24: bandsCell } } } };
  return T.compute(feed, bands, OPS.filter((o) => o.site === 'babitonga'), SITES.filter((s) => s.id === 'babitonga'));
}
const CELL = { hs: { verdict: 'CERTIFIED-COVERAGE', lo: '9/10', hi: '11/10', n: 100, coverage: '90/101' }, windDiff: { verdict: 'CERTIFIED-COVERAGE', lo: '0', hi: '0', n: 100, coverage: '90/101' } };
ok('approach rule decided on the band: Hs 3 m x [0.9, 1.1] breaks "Hs < 2.0" at the favourable edge 2.7 -> VETADA', () => {
  const w = weekFrom(CELL);
  const op = w.operations.find((o) => o.id === 'sfs-barra');
  assert.strictEqual(op.steps[0].verdict, 'VETADA');
  assert.strictEqual(op.steps[0].witness.var, 'hs');
});
red('RED: a berth rule never decides on the open-sea Hs (the same 3 m sea leaves the TGS manoeuvre SEM DADOS, not VETADA)', () => {
  const w = weekFrom(CELL);
  const op = w.operations.find((o) => o.id === 'tgs-lngc');
  assert.strictEqual(op.steps[0].verdict, 'SEM DADOS');
  assert.ok(!op.steps[0].decidedOn.includes('hs'));
});
ok('additive wind band: forecast (u, v) = (3, 4) with d in [-1, +2] m/s -> [4, 7] m/s exactly, floored at 0 when d would go below', () => {
  const feed = { run: 'r', madeAt: 'x', sites: { babitonga: { kind: 'terminal', node: [-26.25, -48.5], steps: [{ t: '2026-10-07T00', lead: 24, wind: { u: '3', v: '4' } }] } } };
  const mk = (lo, hi) => T.compute(feed, { binHours: 12, borrow: { babitonga: 'floripa' }, sites: { floripa: { bins: { 24: { windDiff: { verdict: 'CERTIFIED-COVERAGE', lo, hi, n: 50, coverage: '45/51' } } } } } }, [], SITES.filter((s) => s.id === 'babitonga'));
  const w = mk('-1', '2').sites.babitonga.steps[0].wind;
  assert.strictEqual(w.lo, Q.str(Q.mul([4n, 1n], Q.norm(900n, 463n)))); assert.strictEqual(w.hi, Q.str(Q.mul([7n, 1n], Q.norm(900n, 463n))));
  assert.strictEqual(mk('-9', '1').sites.babitonga.steps[0].wind.lo, '0');
});
ok('wind 5 m/s exactly = 4500/463 kn, inside 16 kn: TGS stays SEM DADOS (current, visibility unforecast), not LIBERADA', () => {
  const w = weekFrom(CELL);
  const st = w.sites.babitonga.steps[0];
  assert.strictEqual(st.wind.lo, '4500/463'); assert.strictEqual(st.wind.hi, '4500/463');
  assert.deepStrictEqual(w.operations.find((o) => o.id === 'tgs-lngc').steps[0].notForecast.sort(), ['current', 'hs', 'visibility'].sort());
});
red('RED: a REFUSED band (too few pairs) leaves the variable unforecast — SEM DADOS, never a guess', () => {
  const w = weekFrom({ hs: { verdict: 'REFUSED', n: 3 }, windDiff: { verdict: 'REFUSED', n: 3 } });
  const op = w.operations.find((o) => o.id === 'sfs-barra');
  assert.strictEqual(op.steps[0].verdict, 'SEM DADOS');
  assert.strictEqual(w.sites.babitonga.steps[0].hs, null);
});

/* ---- the app's window: one operation, a window of TR hours, three criteria (audit/criteria.js) ---- */
const CR = require('./audit/criteria.js');
const MODEL = require('./app/model.js');
const wk = (rows) => rows.map((r, k) => Object.assign({ t: '2026-10-07T' + String(k * 6).padStart(2, '0'), lead: k * 6 }, r));
const OPX = { id: 'x', limits: [{ var: 'hs', op: '<=', value: '2.0', unit: 'm' }, { var: 'wind_sustained', op: '<=', value: '30', unit: 'kn' }] };
const CTX = { dnv: DNV, wind46: require('./scenario/rules/dnv-alpha.json').windTable['4-6'], site: null, why: 'sem α' };
const flat = (h, w) => ({ hb: h, wb: w, hd: [h[1], h[1]], wd: [w[1], w[1]] });
ok('window span: TR 12 h from lead 0 is the 3 steps 0, 6, 12; TR 10 h rounds UP to the 6 h grid (the same 3); the last start that fits', () => {
  const st = wk([{}, {}, {}, {}, {}]);
  assert.deepStrictEqual(CR.span(st, 0, 12), [0, 1, 2]);
  assert.deepStrictEqual(CR.span(st, 0, 10), [0, 1, 2]);
  assert.deepStrictEqual(CR.span(st, 2, 12), [2, 3, 4]);
  assert.deepStrictEqual(CR.span(st, 4, 0), [4]);
});
red('RED: a window that runs past the last forecast step is NOT decided (null), never LIBERADA', () => {
  const st = wk([flat(['1', '1'], ['5', '5']), flat(['1', '1'], ['5', '5']), flat(['1', '1'], ['5', '5'])]);
  assert.strictEqual(CR.decideWindow(OPX, st, 1, 12, 'band', CTX), null);
  assert.strictEqual(CR.week(OPX, st, 12, 'band', CTX).codes, 'L--');
});
ok('band over the window: clear at the start but straddling Hs <= 2.0 at the third step -> INDEFINIDA, the threshold at that step', () => {
  const st = wk([flat(['1.2', '1.6'], ['10', '14']), flat(['1.3', '1.8'], ['10', '14']), flat(['1.7', '2.3'], ['10', '14']), flat(['1', '1.2'], ['10', '14'])]);
  const r = CR.decideWindow(OPX, st, 0, 12, 'band', CTX);
  assert.strictEqual(r.verdict, 'INDEFINIDA');
  assert.strictEqual(r.flip[0].t, st[2].t); assert.strictEqual(r.flip[0].gap, '3/10');
  assert.strictEqual(CR.decideWindow(OPX, st, 0, 6, 'band', CTX).verdict, 'LIBERADA');     /* the shorter window ends before it */
  assert.strictEqual(CR.week(OPX, st, 6, 'band', CTX).codes, 'LII-');   /* start 2 is the straddling step itself */
});
ok('band over the window: a favourable edge above the limit at any step blocks the whole window -> VETADA, witness that step', () => {
  const st = wk([flat(['1', '1.2'], ['10', '12']), flat(['2.1', '2.6'], ['10', '12']), flat(['1', '1.2'], ['10', '12'])]);
  const r = CR.decideWindow(OPX, st, 0, 12, 'band', CTX);
  assert.strictEqual(r.verdict, 'VETADA'); assert.strictEqual(r.witness.t, st[1].t); assert.strictEqual(r.witness.var, 'hs');
});
ok('DNV Table 4-1 over the window: OPLIM 2.0 m, TR 48 h -> TPOP 24 h, alpha 73/100, OPWF 1.46 m; a deterministic 1.45 m clears, 1.47 m at one step blocks', () => {
  const op = { id: 'y', limits: [{ var: 'hs', op: '<=', value: '2.0', unit: 'm' }] };
  const st = wk(Array.from({ length: 9 }, () => ({ hd: ['1.45', '1.45'] })));
  const r = CR.decideWindow(op, st, 0, 48, 'table', CTX);
  assert.strictEqual(r.verdict, 'LIBERADA'); assert.strictEqual(r.alpha.hs, '73/100'); assert.strictEqual(r.opwf[0].value, '73/50');
  st[5].hd = ['1.47', '1.47'];
  const v = CR.decideWindow(op, st, 0, 48, 'table', CTX);
  assert.strictEqual(v.verdict, 'VETADA'); assert.strictEqual(v.witness.t, st[5].t);
  assert.strictEqual(CR.decideWindow(op, st, 0, 48, 'band', CTX).verdict, 'SEM DADOS');   /* no measured band: the band criterion says so */
});
ok('DNV wind: Table 4-6, the smaller column (the 10-year wind is not assessed): TPOP <= 24 h -> 0.8, a 30 kn limit decides at 24 kn', () => {
  const st = wk([{ hd: ['1', '1'], wd: ['23.99', '24'] }, { hd: ['1', '1'], wd: ['24', '24'] }, { hd: ['1', '1'], wd: ['24', '24.01'] }]);
  const r = CR.decideWindow(OPX, st, 0, 6, 'table', CTX);
  assert.strictEqual(r.alpha.wind, '4/5'); assert.strictEqual(r.verdict, 'LIBERADA');
  const s = CR.decideWindow(OPX, st, 1, 6, 'table', CTX);
  assert.strictEqual(s.verdict, 'INDEFINIDA');                                              /* the 0.01 kn interval straddles 24 */
});
ok('site alpha read in the standard\'s own shape: the interpolation equals dnv.js on Table 4-1 at 60 (design Hs, TPOP) pairs', () => {
  const J = require('./scenario/rules/dnv-alpha.json');
  for (const h of ['1', '1.5', '2', '2.5', '3', '3.5', '4', '5', '6', '8']) for (const T of [6, 12, 24, 36, 48, 72]) {
    assert.strictEqual(Q.str(CR.interp(J.waveTables['4-1'].rows, J.waveColumns, h, T)), Q.str(DNV.alpha('4-1', h, T)), h + ' m, ' + T + ' h');
  }
});
red('RED: the site alpha is never extrapolated: design Hs 3.5 m between an estimated 2 m and an unestimated 4 m column -> n/a, not the 2 m value', () => {
  const site = { columns: [1, 2, 4, 6], rows: { 12: ['0.80', '0.87', null, null] } };
  const op = { id: 'z', limits: [{ var: 'hs', op: '<=', value: '3.5', unit: 'm' }] };
  const st = wk([{ hd: ['1', '1'] }, { hd: ['1', '1'] }, { hd: ['1', '1'] }, { hd: ['1', '1'] }, { hd: ['1', '1'] }]);
  const r = CR.decideWindow(op, st, 0, 24, 'site', Object.assign({}, CTX, { site }));
  assert.strictEqual(r.verdict, 'n/a');
  const op15 = { id: 'w', limits: [{ var: 'hs', op: '<=', value: '1.5', unit: 'm' }] };
  assert.strictEqual(CR.decideWindow(op15, st, 0, 24, 'site', Object.assign({}, CTX, { site })).alpha.hs, '167/200');   /* (0.80 + 0.87) / 2 */
});
ok('the site alpha table takes the LOWER end of the 90% interval rounded DOWN to 0.01 (Santos, 2 m, TPOP 12 h: [0.876, 0.9122] -> 0.87)', () => {
  const T = MODEL.siteAlphaTables(require('../../certs/janela-alpha.json'));
  assert.strictEqual(T.santos.rows[12][T.santos.columns.indexOf(2)], '0.87');
  assert.strictEqual(T.santos.rows[12][T.santos.columns.indexOf(4)], null);                 /* REFUSED in the record: null here */
});
red('RED: a Capitania rule is a condition at the hour — the DNV criteria do not apply to it (n/a, never a verdict)', () => {
  const op = Object.assign({}, OPS.find((o) => o.id === 'tebig-leste'), { npcp: true });
  const st = wk([{ hd: ['1', '1'], hb: ['0.9', '1.1'], wd: ['5', '5'], wb: ['4', '6'] }]);
  assert.strictEqual(CR.decideWindow(op, st, 0, 0, 'table', CTX).verdict, 'n/a');
  assert.strictEqual(CR.decideWindow(op, st, 0, 0, 'band', CTX).verdict, 'LIBERADA');
});
red('RED: outward rounding is sound — an exact upper edge 2.0004 under "<= 2.0" stays INDEFINIDA rounded (2.001), and 1.9996 under a strict "< 2.0" rounds to 2.000 and becomes INDEFINIDA, never the reverse', () => {
  const up = (x) => Q.dec(Q.parse(x), 3, 'up');
  assert.strictEqual(up('2.0004'), '2.001'); assert.strictEqual(up('1.9996'), '2.000');
  const strict = { id: 's', limits: [{ var: 'hs', op: '<', value: '2.0', unit: 'm' }] };
  const st = wk([{ hb: ['1.5', up('1.9996')] }]);
  assert.strictEqual(CR.decideWindow(strict, st, 0, 0, 'band', CTX).verdict, 'INDEFINIDA');
  assert.strictEqual(CR.decideWindow(strict, wk([{ hb: ['1.5', '1.9996'] }]), 0, 0, 'band', CTX).verdict, 'LIBERADA');
});
ok('the presets: Alívio is the cited criterion, decided inclusive (Hs <= 3.5 m, wind <= 50 kn, 24 h); the others say they are examples', () => {
  const a = MODEL.PRESETS.find((p) => p.id === 'alivio');
  assert.deepStrictEqual(a.limits.map((l) => l.var + l.op + l.value), ['hs<=3.5', 'wind_sustained<=50']);
  assert.strictEqual(a.TR, 24); assert.strictEqual(a.kind, 'cited'); assert.ok(/OMAE2010-20147/.test(a.source));
  assert.ok(MODEL.PRESETS.filter((p) => p.id !== 'alivio').every((p) => p.kind === 'example'));
});

/* ---- the PLACAR's admission (audit/placar.js): one trial per target day, looks at 30·2^j, sticky ---- */
const PL = require('./audit/placar.js');
const synth = (days, perDay, coveredOf, alpha) => {
  const rows = [];
  for (let d = 0; d < days; d++) {
    const day = new Date(Date.UTC(2026, 9, 6) + d * 864e5).toISOString().slice(0, 10);
    for (let k = 0; k < perDay; k++) {
      const id = 'janela:s' + k + ':' + day + 'T00:+' + (6 * k) + 'h';
      rows.push({ type: 'commit', id, domain: 'p', targetTime: day + 'T12:00:00Z', forecast: { alpha: alpha || [1, 5] } });
      rows.push({ type: 'score', id, covered: coveredOf(d, k) });
    }
  }
  return rows;
};
ok('placar: 30 target days of three rows each are 30 trials; all covered -> ADMITTED at the first look, tail 1 > 1/40', () => {
  const r = PL.record(synth(30, 3, () => true)).p;
  assert.strictEqual(r.scored, 90); assert.strictEqual(r.admission.trials, 30);
  assert.strictEqual(r.admission.status, 'ADMITTED'); assert.strictEqual(r.admission.pending, false);
  assert.deepStrictEqual([r.admission.looks[0].m, r.admission.looks[0].tail, r.admission.looks[0].bar], [30, '1', '1/40']);
  assert.strictEqual(r.admission.next, 60);
});
red('placar: one bad overflight does not prune — two rows of one day both missed (the row count would: tail 1/25 <= 1/20) is one trial, pending', () => {
  const rows = synth(1, 2, () => false);
  const A = require('../../instruments/forecast/admission.js');
  assert.strictEqual(A.admit({ claim: [4, 5], scored: 2, covered: 0 }).status, 'DEADMITTED');
  const r = PL.record(rows).p.admission;
  assert.strictEqual(r.trials, 1); assert.strictEqual(r.pending, true); assert.strictEqual(r.status, 'ADMITTED');
});
red('placar: the lot never reads the outcome — every covered flag flipped, the same row decides every day', () => {
  const a = PL.trials(synth(40, 5, (d, k) => (d + k) % 3 === 0)).p.map((t) => t.id);
  const b = PL.trials(synth(40, 5, (d, k) => (d + k) % 3 !== 0)).p.map((t) => t.id);
  assert.deepStrictEqual(a, b);
  assert.ok(new Set(PL.trials(synth(40, 5, () => true)).p.map((t) => t.id.split(':')[1])).size > 1, 'the lot visits more than one row');
});
red('placar: pruning is sticky — 30 days missed prune at the first look; 1,000 covered days after do not bring the version back', () => {
  const r = PL.record(synth(30, 1, () => false)).p.admission;
  assert.strictEqual(r.status, 'DEADMITTED'); assert.strictEqual(r.prunedAt.m, 30);
  const r2 = PL.record(synth(1030, 1, (d) => d >= 30)).p.admission;
  assert.strictEqual(r2.status, 'DEADMITTED'); assert.strictEqual(r2.prunedAt.m, 30); assert.strictEqual(r2.next, null);
});
ok('placar: the bars of every look ever sum to less than 1/20 (exact)', () => {
  const L = PL.looks(30 * 2 ** 20);
  assert.strictEqual(L.length, 21);
  let num = 0n, den = 1n;
  for (const l of L) { const [a, b] = l.bar.map(BigInt); num = num * b + a * den; den *= b; }
  assert.ok(num * 20n < den, 'sum of bars ' + num + '/' + den + ' must be < 1/20');
});
red('placar: a proposer whose rows carry two claims is refused, never averaged', () => {
  const rows = synth(2, 1, () => true);
  rows[2].forecast.alpha = [1, 10];
  assert.throws(() => PL.record(rows), /two different claims/);
});
ok('placar: the real ledger reads through placar.js, and every proposer stays pending until its 30th trial day', () => {
  const LD = path.join(ROOT, 'certs', 'janela-ledger');
  const LEDGER = require('../../instruments/forecast/ledger.js');
  const rows = [].concat(...fs.readdirSync(LD).filter((f) => /^\d{6}\.jsonl$/.test(f)).map((f) => LEDGER.rows(path.join(LD, f))));
  for (const p of Object.values(PL.record(rows))) assert.strictEqual(p.admission.pending, p.admission.trials < 30, p.domain);
});

/* ---- the regions (scenario/regions.json + audit/bandset.js): added beside the records of 2026-10-06, never folded in ---- */
const BS = require('./audit/bandset.js');
ok('regions: every measured region carries exactly its own sites, and the merge keeps the 2026-10-06 record whole', () => {
  const main = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'janela-bands.json'), 'utf8'));
  const B = BS.bands();
  for (const r of BS.records().filter((x) => x.name !== 'main' && x.provider === 'ecmwf')) {
    const rec = JSON.parse(fs.readFileSync(path.join(ROOT, r.bands), 'utf8'));
    assert.deepStrictEqual(Object.keys(rec.sites).sort(), r.sites.slice().sort(), r.name);
    for (const sid of r.sites) assert.ok(SITES.some((s) => s.id === sid), sid + ' is not in sites.json');
  }
  for (const sid of Object.keys(main.sites)) assert.deepStrictEqual(B.sites[sid], main.sites[sid], sid);
  assert.strictEqual(B.records[0].file, 'certs/janela-bands.json');
});
red('regions: a site carried by two bands records is refused, never resolved by order', () => {
  const a = { file: 'a.json', rec: { sites: { x: 1 } } }, b = { file: 'b.json', rec: { sites: { x: 2 } } };
  assert.throws(() => BS.merge([a, b], 'bands'), /carried by two bands records/);
  assert.deepStrictEqual(BS.merge([a, { file: 'c.json', rec: { sites: { y: 3 } } }], 'bands'), { x: 1, y: 3 });
});

red('the prune reaches the product: a DEADMITTED calibrated proposer lends no band, and the day says which', () => {
  const B = BS.bands();
  const keep = BS.withoutPruned(B, [{ domain: 'janela/hs-altimeter/calibrated-v1', status: 'ADMITTED' }]);
  assert.strictEqual(keep.pruned.length, 0); assert.strictEqual(Object.keys(keep.bands.sites).length, Object.keys(B.sites).length);
  const cut = BS.withoutPruned(B, [{ domain: 'janela/hs-altimeter/calibrated-sergipe-v1', status: 'DEADMITTED', prunedAt: { through: '2026-11-08' } }]);
  assert.deepStrictEqual(cut.pruned.map((x) => x.proposer), ['janela/hs-altimeter/calibrated-sergipe-v1']);
  assert.ok(!cut.bands.sites.sergipe && cut.bands.sites.santos, 'sergipe withheld, santos kept');
  assert.ok(B.sites.sergipe, 'the record itself is untouched');
});

/* ---- providers-v1 in the product (audit/today.js): two calibrated bands decide on their union ---- */
const unionWeek = (detE, detN, cellN, noNoaa) => {
  /* TEBIG's eastern approach (Ilha Grande): Hs <= 2.0 m and wind <= 20 kn, nothing unforecast */
  const site = (det) => ({ 'ilha-grande': { kind: 'terminal', node: [-23.0, -44.25], steps: [{ t: '2026-10-07T00', lead: 24, hs: { det }, wind: { u: '3', v: '4' } }] } });
  const B = (cell) => ({ binHours: 12, borrow: { 'ilha-grande': 'santos' }, sites: { santos: { bins: { 24: cell } } } });
  return T.compute({ run: 'r', madeAt: 'x', sites: site(detE) }, B(CELL), OPS.filter((o) => o.id === 'tebig-leste'), SITES.filter((s) => s.id === 'ilha-grande'),
    noNoaa ? undefined : { feed: { sites: site(detN) }, bands: B(cellN || CELL) });
};
ok('the union: ECMWF 1.7 m x [0.9, 1.1] and NOAA 1.9 m x [0.9, 1.1] decide on [1.53, 2.09], and the band names both providers', () => {
  const st = unionWeek('17/10', '19/10').sites['ilha-grande'].steps[0];
  assert.deepStrictEqual([st.hs.lo, st.hs.hi], ['153/100', '209/100']);
  assert.deepStrictEqual(st.hs.from, ['ecmwf', 'noaa']);
});
red('the union never flips a verdict, only widens: LIBERADA under ECMWF alone ("Hs <= 2.0" at 1.87) becomes INDEFINIDA when NOAA\'s edge reaches 2.09 — never VETADA', () => {
  const v = (w) => w.operations.find((o) => o.id === 'tebig-leste').steps[0].verdict;
  assert.deepStrictEqual([v(unionWeek('17/10', null, null, true)), v(unionWeek('17/10', '19/10'))], ['LIBERADA', 'INDEFINIDA']);
});
red('a NOAA band inside ECMWF\'s leaves the decision band exactly ECMWF\'s; a REFUSED NOAA cell leaves ECMWF\'s alone (no "from")', () => {
  const inside = unionWeek('17/10', '17/10', { hs: { verdict: 'CERTIFIED-COVERAGE', lo: '19/20', hi: '21/20', n: 100, coverage: '90/101' }, windDiff: CELL.windDiff }).sites['ilha-grande'].steps[0].hs;
  assert.deepStrictEqual([inside.lo, inside.hi], ['153/100', '187/100']);
  const refused = unionWeek('17/10', '3', { hs: { verdict: 'REFUSED', n: 3 }, windDiff: { verdict: 'REFUSED', n: 3 } }).sites['ilha-grande'].steps[0].hs;
  assert.deepStrictEqual([refused.lo, refused.hi, refused.from], ['153/100', '187/100', undefined]);
});

/* ---- decision-level-v1 (audit/decisions.js): a published decision graded against the satellite ---- */
const DL = require('./audit/decisions.js');
const dlRec = (codeAt4, archivedAt) => {
  const t = Array.from({ length: 29 }, (_, k) => new Date(Date.UTC(2026, 9, 7) + k * 6 * 3600e3).toISOString().slice(0, 13));
  const one = Array(29).fill('-'); one[4] = codeAt4;
  return { run: '2026-10-07T00', archivedAt: archivedAt || '2026-10-07T10:00:00Z', t, lead: t.map((_, k) => 6 * k),
    presets: [{ id: 'lancamento', TR: 12, limits: [{ var: 'hs', op: '<=', value: '2.0', unit: 'm' }] }],
    sites: { santos: { dec: { lancamento: one.join('') + '-'.repeat(58) } } } };
};
/* observed days 10-07 and 10-08, with a pass at santos at 2026-10-08T05:00 (the window from 08-00 covers steps 00, 06, 12) */
const dlObs = (hs) => ({ '2026-10-07': { passes: {} }, '2026-10-08': { passes: hs === null ? {} : { santos: [{ tMid: '2026-10-08T05:00:00Z', hs }] } }, '2026-10-09': { passes: {} } });
ok('decisions: a LIBERADA window (lançamento, Hs <= 2.0, 12 h from 08/10 00h) whose observed pass reads 1.8 m HELD; the record names the rule', () => {
  const g = DL.grade([dlRec('L')], dlObs('9/5'));
  assert.deepStrictEqual([g.graded, g.byCrit.band.L.held, g.byCrit.band.L.broke], [1, 1, 0]);
  assert.ok(/decision-level-v1/.test(g.rule));
});
red('decisions: the same LIBERADA with the pass at 2.5 m BROKE, and is listed with the reading', () => {
  const g = DL.grade([dlRec('L')], dlObs('5/2'));
  assert.deepStrictEqual([g.byCrit.band.L.broke, g.broke[0].hs[0][1]], [1, '2.50']);
});
red('decisions: no pass within 3 h of any step is UNSEEN, never held; a day not yet observed WAITS; a window that opened before the decisions were kept (+1 h) is never graded', () => {
  assert.strictEqual(DL.grade([dlRec('L')], dlObs(null)).byCrit.band.L.unseen, 1);
  assert.strictEqual(DL.grade([dlRec('L')], { '2026-10-07': { passes: {} } }).byCrit.band.pending, 1);
  assert.strictEqual(DL.grade([dlRec('L', '2026-10-07T23:30:00Z')], dlObs('9/5')).graded, 0);
});
ok('decisions: a VETADA whose observed step breaks the limit is CONFIRMED; one whose observed step is within, with steps unseen, is UNSEEN (nothing said)', () => {
  assert.strictEqual(DL.grade([dlRec('V')], dlObs('5/2')).byCrit.band.V.confirmed, 1);
  assert.strictEqual(DL.grade([dlRec('V')], dlObs('9/5')).byCrit.band.V.unseen, 1);
});

/* ---- the second provider (audit/commit.js --noaa over audit/noaa.py's day): the ECMWF target, its own proposer ---- */
const CM = require('./audit/commit.js');
const noaaFeed = (over) => ({ run: '2026-10-07T00',
  ensemble: Object.assign({ source: 'GEFS-Wave', members: Array.from({ length: 31 }, (_, k) => (k ? 'p' + String(k).padStart(2, '0') : 'c00')), band: CM.NOAA.band, claim: '3/4' }, over || {}),
  sites: {
    santos: { kind: 'field', node: [-25.5, -43], steps: [
      { t: '2026-10-07T06', lead: 6, hs: { det: '3/2', lo: '7/5', p50: '3/2', hi: '8/5' } },
      { t: '2026-10-07T12', lead: 12, hs: { det: '3/2', lo: '7/5', p50: '3/2', hi: '8/5' } },
      { t: '2026-10-07T18', lead: 18, hs: { det: '3/2', m: Array(30).fill('3/2').concat([null]) } }] },
    'sao-sebastiao': { kind: 'terminal', node: [-24, -45.25], steps: [{ t: '2026-10-07T12', lead: 12, hs: { det: '1', lo: '9/10', p50: '1', hi: '11/10' } }] }
  } });
ok('noaa: one row per open-sea site and step with a band at least an hour ahead — its own proposer, claim 3/4, the ECMWF target, an id the ECMWF row cannot take', () => {
  const r = CM.noaaRows(noaaFeed(), 'f'.repeat(64), '20261007.json.gz', '2026-10-07T05:30:00Z');
  assert.strictEqual(r.past, 1, 'the +6 h target is 30 min ahead: skipped');
  assert.strictEqual(r.rows.length, 1, 'the +18 h step has a member missing: no band, no row; the terminal is never scored');
  const c = r.rows[0].c;
  assert.strictEqual(c.domain, 'janela/hs-altimeter/noaa-gefs-c25of31');
  assert.strictEqual(c.id, 'janela:santos:2026-10-07T00:+12h:noaa-gefs-c25of31');
  assert.strictEqual(c.target, 'santos · ' + CM.TARGET_ID);
  assert.deepStrictEqual([c.forecast.lo, c.forecast.hi, c.forecast.alpha], [['7', '5'], ['8', '5'], [1, 4]]);
  assert.strictEqual(r.rows[0].ledger, '202610.jsonl');
});
ok('noaa calibrated: GFS-Wave\'s deterministic Hs x NOAA\'s own ratio interval, committed even where the ensemble lost a member; claim 9/10', () => {
  const cal = { domain: 'janela/hs-altimeter/calibrated-noaa-v1', sha: 'a'.repeat(64),
    rec: { binHours: 12, sites: { santos: { bins: { 12: { hs: { verdict: 'CERTIFIED-COVERAGE', lo: '9/10', hi: '11/10', n: 100, coverage: '90/101' } } } } } } };
  const r = CM.noaaRows(noaaFeed(), 'f'.repeat(64), '20261007.json.gz', '2026-10-07T05:30:00Z', [cal]);
  const c = r.rows.map((x) => x.c).filter((x) => x.domain === cal.domain);
  assert.deepStrictEqual(c.map((x) => x.id), ['janela:santos:2026-10-07T00:+12h:calibrated-noaa-v1', 'janela:santos:2026-10-07T00:+18h:calibrated-noaa-v1']);
  assert.deepStrictEqual([c[0].forecast.lo, c[0].forecast.hi, c[0].forecast.alpha], [['27', '20'], ['33', '20'], [1, 10]]);
});
red('noaa: a feed whose band is not the definition\'s (order statistics 3 and 29) is refused whole, never committed under the name', () => {
  assert.throws(() => CM.noaaRows(noaaFeed({ band: 'order statistics 3 and 29 of 31 sorted members' }), 'f'.repeat(64), 'x', '2026-10-07T05:30:00Z'), /does not carry the band/);
});
red('noaa: a feed with a member file short (30 members) or another claim is refused whole', () => {
  assert.throws(() => CM.noaaRows(noaaFeed({ members: Array(30).fill('m') }), 'f'.repeat(64), 'x', '2026-10-07T05:30:00Z'), /does not carry the band/);
  assert.throws(() => CM.noaaRows(noaaFeed({ claim: '4/5' }), 'f'.repeat(64), 'x', '2026-10-07T05:30:00Z'), /does not carry the band/);
});
ok('noaa: the proposer and the providers rule are dated in DEFINITIONS.json, with the claim the rows carry', () => {
  const defs = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'janela-ledger', 'DEFINITIONS.json'), 'utf8'));
  const d = defs['noaa-gefs-c25of31 (apps/janela/audit/commit.js)'];
  assert.ok(d && d.domain === CM.NOAA.domain && d.claim === '3/4' && d.alpha === CM.NOAA.alpha.join('/'));
  assert.strictEqual(d.target, defs['altimeter-hs-v1 (apps/janela/audit/commit.js)'].target, 'the same target as ECMWF\'s');
  assert.ok(defs['providers-v1 (apps/janela/app)'], 'how two providers combine is dated before any NOAA band is shown');
  assert.ok(PL.NAMES_PT[CM.NOAA.domain], 'the PLACAR names it');
});

console.log('janela battery: ' + n + ' pass, 0 fail, ' + reds + '/' + reds + ' red controls fired');
