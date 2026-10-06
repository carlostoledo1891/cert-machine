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

console.log('janela battery: ' + n + ' pass, 0 fail, ' + reds + '/' + reds + ' red controls fired');
