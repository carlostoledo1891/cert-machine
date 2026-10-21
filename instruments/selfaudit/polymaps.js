/* instruments/selfaudit/polymaps.js — the self-audit of cert-machine, Phase 3: the POLYMAPS family (9 register rows: the 8
   rows of certs/polymaps-ledger.json — Gao's Keller counterexamples G, F4, F5, the rebuilt F6 and F7, the Markus–Yamabe
   fields X14 and X-hat18, the cubic Phi — and the Station's Jacobian construction of certs/mc100-station-v2.json, decided
   by the same decider). Classes written under the rule (the pre-registration's "Phase-3 families"):

     FALSE   one coefficient + 1 (the first term of the first component): det JF is no longer the printed constant, or
             (JX + I) is no longer nilpotent — witness: det JF, or (JX(p) + I)^n, at one rational point, exactly, by a
             standard-library program that shares no code with instruments/polymaps (its own partial derivatives and
             Gaussian elimination in Fractions) · one witness point moved (the first coordinate of the first collision
             point or zero + 1): the printed points no longer have one image, or the point is no longer a zero — witness:
             the images, exactly (F7: this class only, since its determinant rests on the paper's lemma)
     TRUE    the map translated: F'(x) = F(x + e₁) − F(e₁) (a field: X'(x) = X(x + e₁)), the witness points moved by −e₁ —
             det JF, nilpotency, degrees and the collision are invariant (G, F4, F5, Phi, X14, X-hat18, the Station's map;
             F6 and F7 are too large to expand: for them the witness points listed in the other order, an invariance too)
     MALFORMED  the first term's exponent tuple short by one entry

   THE OBJECT is the map as corpus/polymaps/maps.json holds it (sparse: [exponent tuple, rational coefficient] per term;
   F6 and F7 as instruments/polymaps rebuilds them from the printed recipe, serialised the same way; the Station's map from
   its construction.json) with the witness points of corpus/polymaps/witnesses.json. THE DECIDER UNDER TEST:
   instruments/polymaps/decide.py — keller (det JF expanded symbolically over Q, the degrees, the collision evaluated),
   my_field (the nilpotency identity (JX + I)^k = 0, the zeros evaluated), composed as decide() composes them (every check
   ok → CERTIFIED, else REFUTED; F7: PARTIAL with the determinant resting on the lemma) — the path of
   tools/run-polymaps-ledger.py and tools/run-mc100-station.py; run as those tools run it (python3 -I). THE WITNESS is
   instruments/selfaudit/witness_polymaps.py; the float check instruments/selfaudit/floatcheck_polymaps.py.          MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const os = require('os');
const ROOT = path.resolve(__dirname, '..', '..');
const LEDGER = 'certs/polymaps-ledger.json', STATION = 'certs/mc100-station-v2.json';
const PY_DIR = path.join(ROOT, 'instruments', 'polymaps');

/* a Python harness: the decider's own functions, run as the ledgers run them */
const runPy = (code, input) => {
  const tmp = path.join(os.tmpdir(), 'selfaudit-polymaps-' + process.pid + '-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.json');
  fs.writeFileSync(tmp, JSON.stringify(input));
  const r = cp.spawnSync('python3', ['-I', '-c', code, PY_DIR, tmp], { encoding: 'utf8', maxBuffer: 1 << 30 });
  fs.unlinkSync(tmp);
  if (r.status !== 0) throw new Error(String(r.stderr).slice(-400));
  return JSON.parse(r.stdout);
};
const REBUILD = 'import json, sys\nsys.path.insert(0, sys.argv[1])\nimport decide as D\npr = D.f6_parts(); F6 = D.gao_build(**pr)[0]\npr7, _ = D.f7_parts(); F7 = D.gao_build(**pr7)[0]\nser = lambda F: [[[list(e), str(c)] for e, c in f.t.items()] for f in F]\nprint(json.dumps({"F6": ser(F6), "F7": ser(F7)}))\n';
const DECIDE = 'import json, sys\nsys.path.insert(0, sys.argv[1])\nfrom fractions import Fraction as Fr\nimport decide as D\nfrom poly import P\no = json.load(open(sys.argv[2]))\nn = o["n"]\nF = [P(n, {tuple(e): Fr(c) for e, c in comp}) for comp in o["comps"]]\nif o["kind"] == "field":\n    ch, k = D.my_field(F, n, o["points"], "mutant")\n    verdict = "CERTIFIED" if all(c["ok"] for c in ch) else "REFUTED"\nelif o["kind"] == "keller-partial":\n    pts = [D.pt(p) for p in o["points"]]\n    imgs = [D.ev(F, p) for p in pts]\n    ch = [{"name": "2 distinct rational points with one image", "ok": len(set(pts)) == 2 and imgs[0] == imgs[1]}, {"name": "det J constant: rests on the paper\'s lemma", "ok": None}]\n    verdict = "PARTIAL" if all(c["ok"] for c in ch if c["ok"] is not None) else "REFUTED"\nelse:\n    if o["kind"] == "phi":\n        Dt = D.det(D.jac(F, n)); us = [D.pt(u) for u in o["points"]]; im = [D.ev(F, u) for u in us]\n        ch = [{"name": "det J is identically " + o["det"], "ok": Dt.const_value() == Fr(o["det"])}, {"name": "three distinct points with one image", "ok": len(set(us)) == 3 and im[0] == im[1] == im[2]}]\n    else:\n        ch = D.keller(F, n, o["det"], o["degs"], o["points"], "mutant")\n    verdict = "CERTIFIED" if all(c["ok"] for c in ch) else "REFUTED"\nprint(json.dumps({"verdict": verdict, "checks": [{"name": c["name"], "ok": c["ok"]} for c in ch]}))\n';

let REBUILT = null;
const rebuilt = () => { if (!REBUILT) REBUILT = runPy(REBUILD, {}); return REBUILT; };

function rows(register, J) {
  const M = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'polymaps', 'maps.json'), 'utf8'));
  const W = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'polymaps', 'witnesses.json'), 'utf8'));
  const L = J(LEDGER);
  const reg = (id) => { const r = register.rows.find((x) => x.id === id); if (!r) throw new Error('polymaps: no register row ' + id); return r; };
  const out = [];
  const TABLE = { G: ['2', [4, 11, 12]], F4: ['-44/9', [4, 11, 12, 21]], F5: ['160/29', [3, 12, 14, 16]] };
  for (const key of ['G', 'F4', 'F5']) {
    const id = 'polymaps-gao-' + key.toLowerCase();
    out.push({ rowId: id, record: LEDGER, entryId: 'gao-' + key.toLowerCase(), verdict: reg(id).verdict, entry: { kind: 'keller', key, n: M[key].vars.length, comps: M[key].comps, det: TABLE[key][0], degs: TABLE[key][1], points: W.collisions[key], source: 'corpus/polymaps/maps.json ' + key } });
  }
  const RB = rebuilt();
  const f6 = L.rows.find((r) => r.id === 'gao-f6'), f7 = L.rows.find((r) => r.id === 'gao-f7');
  out.push({ rowId: 'polymaps-gao-f6', record: LEDGER, entryId: 'gao-f6', verdict: reg('polymaps-gao-f6').verdict, entry: { kind: 'keller', key: 'F6', n: 5, comps: RB.F6, det: '-290', degs: RB.F6.map((c) => Math.max(...c.map(([e]) => e.reduce((a, b) => a + b, 0)))), points: W.collisions.F6, source: 'rebuilt by instruments/polymaps from the printed recipe (' + f6.terms.join('/') + ' terms)', large: true } });
  out.push({ rowId: 'polymaps-gao-f7', record: LEDGER, entryId: 'gao-f7', verdict: reg('polymaps-gao-f7').verdict, entry: { kind: 'keller-partial', key: 'F7', n: 5, comps: RB.F7, det: '119377', degs: null, points: W.collisions.F7, source: 'rebuilt by instruments/polymaps from the printed recipe (' + f7.terms.join('/') + ' terms); its determinant rests on the paper\'s lemma', large: true } });
  out.push({ rowId: 'polymaps-chv-x14', record: LEDGER, entryId: 'chv-x14', verdict: reg('polymaps-chv-x14').verdict, entry: { kind: 'field', key: 'X14', n: 14, comps: M.X14.comps, det: null, degs: null, points: W.zeros.X14, source: 'corpus/polymaps/maps.json X14' } });
  out.push({ rowId: 'polymaps-chv-phi', record: LEDGER, entryId: 'chv-phi', verdict: reg('polymaps-chv-phi').verdict, entry: { kind: 'phi', key: 'Phi', n: 11, comps: M.Phi.comps, det: '-2', degs: null, points: W.zeros.Phi_points, source: 'corpus/polymaps/maps.json Phi' } });
  out.push({ rowId: 'polymaps-chv-xhat18', record: LEDGER, entryId: 'chv-xhat18', verdict: reg('polymaps-chv-xhat18').verdict, entry: { kind: 'field', key: 'Xhat18', n: 18, comps: M.Xhat18.comps, det: null, degs: null, points: W.zeros.Xhat18, source: 'corpus/polymaps/maps.json Xhat18' } });
  const C = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'station-v2', 'jacobian', 'construction.json'), 'utf8'));
  const rm = C.reconstructed_map;
  out.push({ rowId: 'mc100-st-jacobian', record: STATION, entryId: 'st-jacobian', verdict: reg('mc100-st-jacobian').verdict, entry: { kind: 'keller', key: 'station', n: rm.variables.length, comps: rm.polynomials.map((poly) => poly.map((t) => [t.powers, String(t.coefficient)])), det: String(rm.expected.jacobian_determinant), degs: rm.expected.component_degrees, points: rm.witnesses.map((w) => w.point), source: 'corpus/station-v2/jacobian/construction.json reconstructed_map' } });
  return out;
}

const claimOf = (e) => ({ kind: e.kind, n: e.n, comps: e.comps, det: e.det, degs: e.degs, points: e.points });
const describe = (e) => e.key + ': ' + (e.kind === 'field' ? 'a polynomial field on R^' + e.n : 'a polynomial map of Q^' + e.n + (e.det ? ' with det J = ' + e.det : '')) + ', ' + e.comps.reduce((s, c) => s + c.length, 0) + ' terms, ' + e.points.length + ' witness points (' + e.source + ')';
const clone = (x) => JSON.parse(JSON.stringify(x));

/* exact rationals as [num, den] BigInt pairs, for the translation */
const Q = (s) => { const [a, b] = String(s).split('/'); return [BigInt(a), b ? BigInt(b) : 1n]; };
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
const norm = ([a, b]) => { if (b < 0n) { a = -a; b = -b; } const g = gcd(a, b) || 1n; return [a / g, b / g]; };
const qadd = (x, y) => norm([x[0] * y[1] + y[0] * x[1], x[1] * y[1]]);
const qmul = (x, y) => norm([x[0] * y[0], x[1] * y[1]]);
const qstr = ([a, b]) => (b === 1n ? a.toString() : a + '/' + b);
const binom = (n, k) => { let r = 1n; for (let i = 1n; i <= BigInt(k); i++) r = r * (BigInt(n) - i + 1n) / i; return r; };
/* F'(x) = F(x + e₁): expand x₁^k = Σ_j C(k, j) x₁^j */
function translateComp(comp) {
  const acc = new Map();
  for (const [e, c] of comp) {
    const k = e[0];
    for (let j = 0; j <= k; j++) {
      const e2 = e.slice(); e2[0] = j;
      const key = e2.join(',');
      const term = qmul(Q(c), [binom(k, k - j), 1n]);
      acc.set(key, acc.has(key) ? qadd(acc.get(key), term) : term);
    }
  }
  return [...acc.entries()].filter(([, v]) => v[0] !== 0n).map(([k, v]) => [k.split(',').map(Number), qstr(v)]);
}
const shiftPoint = (p) => p.map((x, i) => (i === 0 ? qstr(qadd(Q(x), [-1n, 1n])) : String(x)));
/* F'(x) = F(x + e₁) − F(e₁) for a map (so the degrees and det are kept and the collision moves to p − e₁); a field keeps its
   value (X'(x) = X(x + e₁)), its zeros move to z − e₁ */
function translate(c, isField) {
  const comps = c.comps.map(translateComp);
  if (!isField) {
    for (const comp of comps) {
      const zero = comp.findIndex(([e]) => e.every((x) => x === 0));
      if (zero >= 0) comp.splice(zero, 1);   /* F(e₁) is the constant term of F(x + e₁); dropping it subtracts F(e₁) */
    }
  }
  c.comps = comps;
  c.points = c.points.map(shiftPoint);
}

function mutants(e) {
  const base = claimOf(e), out = [];
  const isField = e.kind === 'field';
  if (e.kind !== 'keller-partial') {
    const c = clone(base); c.comps[0][0][1] = qstr(qadd(Q(c.comps[0][0][1]), [1n, 1n]));
    out.push({ class: 'coefficient-plus-one', truth: 'FALSE', transformation: 'the first term of component 0 (' + base.comps[0][0][1] + ' x^(' + base.comps[0][0][0].join(',') + ')) + 1: ' + (isField ? '(JX + I) is no longer nilpotent' : 'det JF is no longer the constant ' + base.det), claim: c });
  } else out.push({ class: 'coefficient-plus-one', excluded: 'F7\'s determinant rests on the paper\'s lemma (the row is PARTIAL): a coefficient moved changes nothing the decider decides but the collision, which the witness-point class covers' });
  { const c = clone(base); c.points[0] = c.points[0].map((x, i) => (i === 0 ? qstr(qadd(Q(x), [1n, 1n])) : String(x)));
    out.push({ class: 'witness-point-moved', truth: 'FALSE', transformation: 'the first coordinate of witness point 0 + 1: ' + (isField ? 'the point is no longer a zero of X' : 'the printed points no longer have one image'), claim: c }); }
  if (e.large) { const c = clone(base); c.points = c.points.slice().reverse(); out.push({ class: 'witness-order-swapped', truth: 'TRUE', preservesOriginal: true, transformation: 'the witness points listed in the other order (the map is too large to translate and expand here)', claim: c }); }
  else { const c = clone(base); translate(c, isField); out.push({ class: 'translated', truth: 'TRUE', preservesOriginal: true, transformation: (isField ? 'X\'(x) = X(x + e₁): nilpotency kept, the zeros moved to z − e₁' : 'F\'(x) = F(x + e₁) − F(e₁): det JF, the degrees and the collision kept, the points moved to p − e₁'), claim: c }); }
  { const c = clone(base); c.comps[0][0][0] = c.comps[0][0][0].slice(0, -1); out.push({ class: 'exponent-missing', truth: 'MALFORMED', transformation: 'the first term\'s exponent tuple short by one entry', claim: c }); }
  return out;
}

function decide(id, claim) {
  const t0 = process.hrtime.bigint();
  let verdict, why;
  try { const r = runPy(DECIDE, claim); verdict = r.verdict; why = r.checks.map((c) => c.name.slice(0, 60) + ': ' + (c.ok === null ? 'rests on the lemma' : c.ok ? 'ok' : 'FAILED')).join(' · '); }
  catch (e) { verdict = 'REFUSED'; why = 'the decider threw: ' + String(e.message || e).slice(-220); }
  return { verdict, why: String(why).slice(0, 300), ms: Math.round(Number(process.hrtime.bigint() - t0) / 1e5) / 10 };
}

module.exports = {
  family: 'polymaps',
  records: [LEDGER, STATION],
  decider: 'instruments/polymaps/decide.py — keller (det JF expanded symbolically over Q, the degrees, the collision evaluated) and my_field (the nilpotency identity, the zeros evaluated), composed as decide() composes them, run as tools/run-polymaps-ledger.py and tools/run-mc100-station.py run it (python3 -I); F7 as the ledger decides it, the determinant resting on the lemma',
  witness: 'instruments/selfaudit/witness_polymaps.py',
  floatcheck: 'instruments/selfaudit/floatcheck_polymaps.py',
  redControl: 'witness-point-moved',
  classes: { FALSE: ['coefficient-plus-one', 'witness-point-moved'], TRUE: ['translated', 'witness-order-swapped'], MALFORMED: ['exponent-missing'] },
  rows, claimOf, mutants, decide, describe
};
