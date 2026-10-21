/* instruments/selfaudit/tensor.js — the self-audit of cert-machine, Phase 3: the TENSOR family (45 register rows:
   certs/strassen-certificate.json 10, the three mc100 tensor pools 35). The pre-registration's class table
   (notes/selfaudit-preregistration-2026-10-20.md, "Mutation classes per record"), implemented as it is written:

     FALSE   one coefficient +1 · one coefficient × (1 + 10⁻⁹) written as the exact decimal it means (the factor
             matrix scaled by 10⁹ and the identity's scale with it, so the claim stays an integer identity — the only
             way a rational coefficient can be stated to the decider; over F₂ the class has no meaning and is EXCLUDED)
             · one rank-1 term dropped (the rank claim lowered with it) · one term duplicated (the rank claim raised)
             · an F₂ decomposition asserted over Q (F₂ rows only; FALSE only when the witness finds a violated entry
             over Z, else DISCARDED by the rule)
     TRUE    the three factor matrices' columns permuted by one permutation · one term's (u, v) signs flipped together
             (over F₂, −1 = 1: the mutant equals the original, an invariance that is trivially one)
     MALFORMED  a factor matrix with a short row

   THE DECIDER UNDER TEST is the row's own re-derive path with the mutant in place of the pinned factors:
   families/strassen-audit.js certify (→ instruments/strassen/tensor.js audit / auditZi, both C-layouts tried, the
   F₂ rows also audited over Q, rank < naive required) — the function tools/export-strassen-certificate.js calls for
   the strassen rows and the same tensor.js audit tools/run-mc100-tensors.js's decide calls for the mc100 rows; that
   tool's BigInt cross-check (auditBig / auditZiBig) is run beside it here too and its agreement recorded.

   THE WITNESS for every FALSE class is instruments/selfaudit/witness_tensor.py — Python standard library, exact
   integers, written against the tensor identity as the certificate states it (and in neither of this repository's
   JavaScript deciders' terms): it prints the first violated equation under each C-layout, exact over the declared
   ring. The float check is instruments/selfaudit/floatcheck_tensor.py.                                              MIT */
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const FAM = require(path.join(ROOT, 'families', 'strassen-audit.js'));
const T = require(path.join(ROOT, 'instruments', 'strassen', 'tensor.js'));

const RECORDS = {
  'certs/strassen-certificate.json': (entryId) => 'mm-' + entryId,
  'certs/mc100-alphatensor-q.json': (entryId) => 'mc100-' + entryId,
  'certs/mc100-alphatensor-f2.json': (entryId) => 'mc100-' + entryId,
  'certs/mc100-alphaevolve-nb-matmul.json': (entryId) => 'mc100-' + entryId
};

/* the register rows of this family, each with the record entry it was decided from */
function rows(register, J) {
  const out = [];
  for (const [rec, idOf] of Object.entries(RECORDS)) {
    const d = J(rec);
    for (const e of d.entries) {
      const id = idOf(e.id);
      const r = register.rows.find((x) => x.id === id);
      if (!r) throw new Error('tensor: no register row ' + id + ' for entry ' + e.id + ' of ' + rec);
      out.push({ rowId: id, record: rec, entryId: e.id, verdict: r.verdict, entry: e });
    }
  }
  return out;
}

const claimOf = (e) => ({ dims: e.dims, rank: e.rank, U: e.U, V: e.V, W: e.W, ring: e.ring, ...(e.scale ? { scale: e.scale } : {}) });
const isZi = (e) => e.ring === 'Zi';
const clone = (x) => JSON.parse(JSON.stringify(x));
const firstNonzero = (U, zi) => { for (let i = 0; i < U.length; i++) for (let t = 0; t < U[i].length; t++) { const x = U[i][t]; if (zi ? (x[0] !== 0 || x[1] !== 0) : x !== 0) return [i, t]; } return null; };
const describe = (e) => '<' + e.dims.join(',') + '> rank ' + e.rank + ' over ' + e.ring + (e.scale ? ' (scale ' + e.scale + ')' : '');

/* the mutants of one entry: { class, truth, transformation, claim } — or { class, excluded } when the class has no
   meaning for this entry (recorded, never faked) */
function mutants(e) {
  const zi = isZi(e), r = e.rank, out = [];
  const base = claimOf(e);
  const nz = firstNonzero(e.U, zi);
  const tm = r >> 1;
  /* FALSE 1: one coefficient + 1 (the first nonzero entry of U; over Z[i] its real part) */
  { const c = clone(base); const [i, t] = nz; if (zi) c.U[i][t][0] += 1; else c.U[i][t] += 1;
    out.push({ class: 'coefficient-plus-one', truth: 'FALSE', transformation: 'U[' + i + '][' + t + ']' + (zi ? '.re' : '') + ' += 1', claim: c }); }
  /* FALSE 2: one coefficient × (1 + 10⁻⁹) as the exact decimal it means */
  if (e.ring === 'F2') out.push({ class: 'coefficient-times-one-plus-1e-9', excluded: 'no meaning over F₂: 1 + 10⁻⁹ is not an element of the field; the class is stated for Q and Z[i]' });
  else {
    const c = clone(base); const [i, t] = nz; const S = 1000000000, S1 = 1000000001;
    for (let a = 0; a < c.U.length; a++) for (let b = 0; b < c.U[a].length; b++) {
      const f = a === i && b === t ? S1 : S;
      if (zi) { c.U[a][b][0] *= f; c.U[a][b][1] *= f; } else c.U[a][b] *= f;
    }
    c.scale = (base.scale || 1) * S;
    out.push({ class: 'coefficient-times-one-plus-1e-9', truth: 'FALSE', transformation: 'U[' + i + '][' + t + '] × 1.000000001 exactly: U scaled by 10⁹ with that entry × 1000000001, the identity\'s scale × 10⁹ (scale ' + c.scale + ')', claim: c });
  }
  /* FALSE 3: one rank-1 term dropped */
  { const c = clone(base); for (const M of ['U', 'V', 'W']) c[M] = c[M].map((row) => row.filter((_, t) => t !== tm)); c.rank = r - 1;
    out.push({ class: 'term-dropped', truth: 'FALSE', transformation: 'column ' + tm + ' removed from U, V and W; rank claimed ' + (r - 1), claim: c }); }
  /* FALSE 4: one term duplicated */
  { const c = clone(base); for (const M of ['U', 'V', 'W']) c[M] = c[M].map((row) => row.concat([clone(row[tm])])); c.rank = r + 1;
    out.push({ class: 'term-duplicated', truth: 'FALSE', transformation: 'column ' + tm + ' of U, V and W appended again; rank claimed ' + (r + 1), claim: c }); }
  /* FALSE 5: an F₂ decomposition asserted over Q */
  if (e.ring === 'F2') { const c = clone(base); c.ring = 'Q';
    out.push({ class: 'f2-asserted-over-q', truth: 'FALSE', transformation: 'ring F2 → Q, the factors unchanged (FALSE only when the witness finds a violated entry over Z, else DISCARDED)', claim: c }); }
  /* TRUE 1: the columns permuted together (a rotation by one) */
  { const c = clone(base); const perm = Array.from({ length: r }, (_, t) => (t + 1) % r); for (const M of ['U', 'V', 'W']) c[M] = c[M].map((row) => perm.map((t) => row[t]));
    out.push({ class: 'columns-permuted', truth: 'TRUE', transformation: 'columns of U, V and W permuted by t → t+1 mod ' + r, claim: c }); }
  /* TRUE 2: one term's (u, v) signs flipped together */
  { const c = clone(base); for (const M of ['U', 'V']) c[M] = c[M].map((row) => row.map((x, t) => (t !== tm ? x : zi ? [-x[0], -x[1]] : -x)));
    out.push({ class: 'uv-signs-flipped', truth: 'TRUE', transformation: 'column ' + tm + ' of U and of V negated (the product u·v·w unchanged)' + (e.ring === 'F2' ? '; over F₂ this is the identity, the mutant equals the original' : ''), claim: c }); }
  /* MALFORMED: a short row */
  { const c = clone(base); c.U[0] = c.U[0].slice(0, r - 1);
    out.push({ class: 'short-row', truth: 'MALFORMED', transformation: 'U[0] shortened to ' + (r - 1) + ' entries', claim: c }); }
  return out;
}

/* the decider under test, as the register's own tools call it; the BigInt cross-check beside it */
function decide(id, claim) {
  const t0 = process.hrtime.bigint();
  let c;
  try { c = FAM.certify({ id, claim }); } catch (e) { c = { verdict: 'REFUSED', why: 'the decider threw: ' + (e.message || e) }; }
  const ms = Math.round(Number(process.hrtime.bigint() - t0) / 1e5) / 10;
  let big = null;
  try {
    const a = claim.ring === 'Zi' ? T.auditZi(claim) : T.audit(claim);
    if (a.verdict !== 'REFUSED') { const b = claim.ring === 'Zi' ? T.auditZiBig(claim) : T.auditBig(claim); big = { verdict: b.verdict, agrees: (a.verdict === 'VERIFIED') === (b.verdict === 'VERIFIED') }; }
    else big = { verdict: 'not run (the exact-double audit refused)', agrees: null };
  } catch (e) { big = { verdict: 'threw: ' + (e.message || e), agrees: null }; }
  return { verdict: c.verdict, why: (c.why || c.text || '').slice(0, 300), ms, bigInt: big };
}

module.exports = {
  family: 'tensor',
  records: Object.keys(RECORDS),
  decider: 'families/strassen-audit.js certify → instruments/strassen/tensor.js audit/auditZi (both layouts; F₂ rows also over Q; rank < naive), the path of tools/export-strassen-certificate.js and the audit tools/run-mc100-tensors.js decide calls; its BigInt cross-check recorded beside it',
  witness: 'instruments/selfaudit/witness_tensor.py',
  floatcheck: 'instruments/selfaudit/floatcheck_tensor.py',
  redControl: 'coefficient-plus-one',
  classes: { FALSE: ['coefficient-plus-one', 'coefficient-times-one-plus-1e-9', 'term-dropped', 'term-duplicated', 'f2-asserted-over-q'], TRUE: ['columns-permuted', 'uv-signs-flipped'], MALFORMED: ['short-row'] },
  rows, claimOf, mutants, decide, describe
};
