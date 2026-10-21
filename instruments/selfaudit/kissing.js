/* instruments/selfaudit/kissing.js — the self-audit of cert-machine, Phase 3: the KISSING family (the 11 register
   rows of certs/kissing-ledger.json). The pre-registration's classes are the seven planted classes of
   certs/method-eval.json, applied to the register's own configurations instead of E8 and D4:

     FALSE   a row duplicated · a row doubled (parallel to itself) · the sum of two exact contact vectors added (at
             less than 60° from each; a configuration with no exact contact has no such mutant — EXCLUDED, recorded)
             · the zero vector added
     TRUE    the configuration negated · the coordinates permuted (a rotation by one, a permutation in every dimension)
     MALFORMED  rows of different dimension (one row short by a coordinate)

   THE OBJECT. Every configuration is taken exactly as the ledger reads it — integer vectors, decimal literals cleared
   per vector, (a + b√2) pairs, the flat sqrt2 encoding — into the instrument's own exact form: coordinate k of a row
   is P[k] + Q[k]·√2 with integers P, Q (the angle condition is scale-invariant per vector). A mutant is a list of
   such rows, serialised as decimal strings; the QUEUED row (ganzhinov-592, no bytes) has no object and is listed with
   the reason.

   THE DECIDER UNDER TEST is instruments/kissing/kissing.js certify, called as tools/run-kissing-ledger.js calls it for
   the row (the uniformNorm option where the ledger passes one); a throw of the instrument (ragged dimensions, an
   empty configuration) is the refusal the method-eval reads it as. THE WITNESS is instruments/selfaudit/
   witness_kissing.py — standard library, exact in Z[√2] (sign by the classical two-case test), the violating pair and
   its exact inner product printed. The float check is instruments/selfaudit/floatcheck_kissing.py.             MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const K = require(path.join(ROOT, 'instruments', 'kissing', 'kissing.js'));
const corpus = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'kissing', f), 'utf8'));

const RECORD = 'certs/kissing-ledger.json';
const neutral = (vectors) => vectors.map((v) => v.P.map((p, k) => [p.toString(), v.Q[k].toString()]));
const toK = (rows) => rows.map((r) => ({ P: r.map((e) => BigInt(e[0])), Q: r.map((e) => BigInt(e[1])) }));

/* the register rows of this family, each with its exact object and the ledger's options */
function rows(register, J) {
  const led = J(RECORD);
  const st = corpus('station-d11-604.json');
  const eaMeta = corpus('ea-d11-604.meta.json');
  const ea6 = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'kissing', eaMeta.file), 'utf8'));
  const SRC = {
    'cal-d4-24': () => ({ vectors: K.d4(), source: 'generated: instruments/kissing/kissing.js d4()' }),
    'cal-e8-240': () => ({ vectors: K.e8(), source: 'generated: instruments/kissing/kissing.js e8()' }),
    'alphaevolve-593': () => ({ vectors: K.fromIntegers(corpus('alphaevolve-d11-593.json').vectors), source: 'corpus/kissing/alphaevolve-d11-593.json' }),
    'ea-594-winner': () => ({ vectors: K.fromDecimals(corpus('ea-d11-594-winner.json').vectors), source: 'corpus/kissing/ea-d11-594-winner.json' }),
    'station-604-1': () => ({ vectors: K.fromSqrt2Pairs(st.configs[0]), opts: { uniformNorm: [144, 0] }, source: 'corpus/kissing/station-d11-604.json configs[0]' }),
    'station-604-2': () => ({ vectors: K.fromSqrt2Pairs(st.configs[1]), opts: { uniformNorm: [144, 0] }, source: 'corpus/kissing/station-d11-604.json configs[1]' }),
    'station-604-3': () => ({ vectors: K.fromSqrt2Pairs(st.configs[2]), opts: { uniformNorm: [144, 0] }, source: 'corpus/kissing/station-d11-604.json configs[2]' }),
    'station-shell-582': () => ({ vectors: K.fromIntegers(st.shell_582), source: 'corpus/kissing/station-d11-604.json shell_582' }),
    'station-d12-lift': () => ({ vectors: K.fromIntegers(st.d12_lift_3), source: 'corpus/kissing/station-d11-604.json d12_lift_3' }),
    'ea-604': () => ({ vectors: K.fromSqrt2Flat(ea6.vectors), opts: { uniformNorm: [36, 0] }, source: 'corpus/kissing/' + eaMeta.file }),
    'ganzhinov-592': () => null
  };
  const out = [];
  for (const lr of led.rows) {
    const id = 'kiss-' + lr.id;
    const r = register.rows.find((x) => x.id === id);
    if (!r) throw new Error('kissing: no register row ' + id);
    if (!(lr.id in SRC)) throw new Error('kissing: no source for ledger row ' + lr.id);
    const s = SRC[lr.id]();
    if (!s) { out.push({ rowId: id, record: RECORD, entryId: lr.id, verdict: r.verdict, entry: null, noObject: 'the row is ' + r.verdict + ': no bytes (' + (lr.source || 'not yet pulled') + ')' }); continue; }
    const rowsN = neutral(s.vectors);
    out.push({ rowId: id, record: RECORD, entryId: lr.id, verdict: r.verdict, entry: { n: rowsN.length, dim: rowsN[0].length, rows: rowsN, opts: s.opts || null, source: s.source, form: lr.form || 'generated' } });
  }
  return out;
}

const claimOf = (e) => ({ n: e.n, dim: e.dim, rows: e.rows, ...(e.opts ? { uniformNorm: e.opts.uniformNorm } : {}) });
const describe = (e) => e.n + ' vectors in R^' + e.dim + ' (' + e.form + ')';
const clone = (x) => JSON.parse(JSON.stringify(x));

/* Z[√2] on BigInt, for the contact search only (the decider's own arithmetic is not used here, the witness's neither) */
const Zm = (u, v) => [u[0] * v[0] + 2n * u[1] * v[1], u[0] * v[1] + u[1] * v[0]];
const Za = (u, v) => [u[0] + v[0], u[1] + v[1]];
const Zs = (u, v) => [u[0] - v[0], u[1] - v[1]];
const Zsign = ([a, b]) => { if (a === 0n && b === 0n) return 0; if (a >= 0n && b >= 0n) return 1; if (a <= 0n && b <= 0n) return -1; const t = a * a - 2n * b * b; if (t === 0n) throw new Error('a^2 = 2b^2'); return (a > 0n) === (t > 0n) ? 1 : -1; };
const dot = (x, y) => { let acc = [0n, 0n]; for (let k = 0; k < x.length; k++) acc = Za(acc, Zm([BigInt(x[k][0]), BigInt(x[k][1])], [BigInt(y[k][0]), BigInt(y[k][1])])); return acc; };
const firstContact = (rows) => {
  const norms = rows.map((r) => dot(r, r));
  for (let i = 0; i < rows.length; i++) for (let j = i + 1; j < rows.length; j++) {
    const s = dot(rows[i], rows[j]);
    if (Zsign(s) <= 0) continue;
    if (Zsign(Zs(Zm(norms[i], norms[j]), Zm([4n, 0n], Zm(s, s)))) === 0) return [i, j];
  }
  return null;
};

function mutants(e) {
  const base = claimOf(e), n = e.n, dim = e.dim, out = [];
  const i7 = Math.min(7, n - 1), i3 = Math.min(3, n - 1);
  { const c = clone(base); c.rows.push(clone(c.rows[i7])); c.n = n + 1;
    out.push({ class: 'row-duplicated', truth: 'FALSE', transformation: 'row ' + i7 + ' appended again', claim: c }); }
  { const c = clone(base); c.rows[n - 1] = c.rows[i3].map(([p, q]) => [(2n * BigInt(p)).toString(), (2n * BigInt(q)).toString()]);
    out.push({ class: 'row-doubled', truth: 'FALSE', transformation: 'the last row replaced by 2 × row ' + i3 + ' (parallel to row ' + i3 + ')', claim: c }); }
  const ct = firstContact(base.rows);
  if (!ct) out.push({ class: 'contact-sum', excluded: 'the configuration has no exact contact pair (no two rows at exactly 60°), so the sum of two contact vectors does not exist for it' });
  else { const c = clone(base); const [i, j] = ct; c.rows.push(c.rows[i].map(([p, q], k) => [(BigInt(p) + BigInt(c.rows[j][k][0])).toString(), (BigInt(q) + BigInt(c.rows[j][k][1])).toString()])); c.n = n + 1;
    out.push({ class: 'contact-sum', truth: 'FALSE', transformation: 'row ' + i + ' + row ' + j + ' appended (an exact contact pair; the sum is at less than 60° from each)', claim: c }); }
  { const c = clone(base); c.rows.push(Array.from({ length: dim }, () => ['0', '0'])); c.n = n + 1;
    out.push({ class: 'zero-vector', truth: 'FALSE', transformation: 'the zero vector appended', claim: c }); }
  { const c = clone(base); c.rows = c.rows.map((r) => r.map(([p, q]) => [(-BigInt(p)).toString(), (-BigInt(q)).toString()]));
    out.push({ class: 'negated', truth: 'TRUE', transformation: 'every row negated', claim: c }); }
  { const c = clone(base); c.rows = c.rows.map((r) => r.map((_, k) => r[(k + 1) % dim]));
    out.push({ class: 'coordinates-permuted', truth: 'TRUE', transformation: 'coordinates rotated: k → k+1 mod ' + dim, claim: c }); }
  { const c = clone(base); c.rows[i3] = c.rows[i3].slice(0, dim - 1);
    out.push({ class: 'ragged-dimensions', truth: 'MALFORMED', transformation: 'row ' + i3 + ' shortened to ' + (dim - 1) + ' coordinates', claim: c }); }
  return out;
}

function decide(id, claim) {
  const t0 = process.hrtime.bigint();
  let verdict, why;
  try {
    const r = K.certify(toK(claim.rows), claim.uniformNorm ? { uniformNorm: claim.uniformNorm } : {});
    verdict = r.verdict;
    why = r.verdict === 'REFUTED' ? (r.reason ? r.reason + ' at row ' + r.row : 'pair (' + r.witness.i + ', ' + r.witness.j + '): <x,y> = ' + r.witness.dotRational + ' + ' + r.witness.dotSqrt2 + '√2, cos² ≈ ' + r.witness.cos2Approx) : r.contacts + ' exact contacts, ' + r.pairs + ' pairs';
  } catch (e) { verdict = 'REFUSED'; why = 'the instrument threw: ' + (e.message || e); }
  return { verdict, why: String(why).slice(0, 300), ms: Math.round(Number(process.hrtime.bigint() - t0) / 1e5) / 10 };
}

module.exports = {
  family: 'kissing',
  records: [RECORD],
  decider: 'instruments/kissing/kissing.js certify, as tools/run-kissing-ledger.js calls it for the row (uniformNorm where the ledger passes one); a throw is the refusal',
  witness: 'instruments/selfaudit/witness_kissing.py',
  floatcheck: 'instruments/selfaudit/floatcheck_kissing.py',
  redControl: 'row-duplicated',
  classes: { FALSE: ['row-duplicated', 'row-doubled', 'contact-sum', 'zero-vector'], TRUE: ['negated', 'coordinates-permuted'], MALFORMED: ['ragged-dimensions'] },
  rows, claimOf, mutants, decide, describe
};
