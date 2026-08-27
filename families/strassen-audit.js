/* strassen-audit.js — fast matrix-multiplication algorithms, decided.

   A rank-r algorithm for n×m by m×p matrix multiplication IS a finite
   exact object: three integer factor matrices whose defining tensor
   identity — nm·mp·np equations, each an exact sum of r products — either
   holds over the claimed ring or provably does not. This family audits
   the published record the way keller-audit audits Jacobian claims:
   Strassen's 1969 rank-7 (the textbook calibration), the recursive
   Strassen⊗Strassen rank-49 baseline GENERATED here and re-decided from
   scratch, and DeepMind's AlphaTensor factorizations (Nature 610, 2022)
   converted mechanically from the pinned npz sources — including the
   rank-47 4×4×4 over F2, the first algorithm to beat Strassen-squared,
   whose certificate also records that the same factors are REFUTED over
   Q: the improvement genuinely needs characteristic 2.

   A REFUTED here would be a discovery: a published algorithm that does
   not multiply matrices. The C-index layout (row-major or transposed) is
   a publishing convention; the audit detects it and the certificate
   states it — nothing about the identity is assumed.

   The naive rank-nmp algorithm certifies as correct and is REJECTED:
   correct is not fast, and a hit here asserts r < nmp. */
'use strict';

const fs = require('fs');
const path = require('path');
const T = require('#instruments/strassen/tensor.js');
const PIN = require('#instruments/pin.js');

const CORPUS = (() => {
  const out = [];
  out.push({ id: 'strassen-1969', claim: T.strassen(),
    source: 'Strassen, Numer. Math. 13 (1969) — the textbook transcription; the audit is the check',
    note: 'calibration: the oldest fast algorithm, rank 7 < 8' });
  out.push({ id: 'strassen-squared-4x4x4', claim: T.compose(T.strassen(), T.strassen()),
    generated: true,
    source: 'generated here: Strassen ⊗ Strassen by exact Kronecker composition, re-decided from scratch',
    note: 'the rank-49 recursive baseline that 47 (AlphaTensor, mod 2) and 48 (AlphaEvolve) beat' });
  out.push({ id: 'naive-2x2x2', claim: T.naive(2, 2, 2),
    source: 'generated here: the definition itself as a rank-8 decomposition',
    note: 'correct but not fast — the REJECT that keeps HIT meaning something' });
  try {
    const C = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'corpus', 'strassen-corpus.json'), 'utf8'));
    for (const e of C.entries) {
      out.push({ id: e.id,
        claim: { dims: e.dims, rank: e.rank, U: e.U, V: e.V, W: e.W, ring: e.ring },
        source: 'AlphaTensor (DeepMind, Nature 610, 2022), key ' + e.npzKey + ' of ' + e.source,
        pin: e.source,
        transcription: 'npz member "' + e.npzKey + '.npy" of ' + e.source + ' (sha256 ' + e.sourceSha256.slice(0, 16)
          + '…), factors (3, ' + e.dims[0] * e.dims[1] + ', ' + e.rank + ') converted by tools/convert_alphatensor.py' });
    }
  } catch (e) { /* corpus not converted — the built-in entries still audit */ }
  try {
    const C = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'corpus', 'alphaevolve-corpus.json'), 'utf8'));
    for (const e of C.entries) {
      out.push({ id: e.id,
        claim: { dims: e.dims, rank: e.rank, U: e.U, V: e.V, W: e.W, ring: 'Zi', scale: e.scale },
        source: e.source, pin: e.pinKey, transcription: e.transcription, note: e.note });
    }
  } catch (e) { /* corpus not converted — the built-in entries still audit */ }
  return out;
})();

module.exports = {
  name: 'strassen-audit',
  statement: 'a claimed fast matrix-multiplication algorithm — a rank-r decomposition of the (n,m,p) tensor — whose defining identity (nm·mp·np exact equations) is VERIFIED over the claimed ring with r strictly below the naive nmp; the C-layout convention is detected and recorded, never assumed',
  enumerate: (i) => (i < CORPUS.length ? CORPUS[i] : null),
  /* float screen: run the algorithm on one deterministic integer sample and
     compare against direct multiplication — broken data prunes here */
  value(o) {
    const { dims, U, V, W } = o.claim;
    const [n, m, p] = dims;
    const r = T.rankOf(U);
    if (o.claim.ring === 'Zi') {
      /* the same deterministic sample, in Gaussian arithmetic: the algorithm
         must produce scale*direct with zero imaginary part */
      const scale = o.claim.scale || 1;
      const A = Array.from({ length: n * m }, (_, i) => ((i * 7 + 3) % 10) - 4);
      const B = Array.from({ length: m * p }, (_, i) => ((i * 5 + 1) % 9) - 4);
      const L = [], Rr = [];
      for (let t = 0; t < r; t++) {
        let lre = 0, lim = 0, rre = 0, rim = 0;
        for (let i = 0; i < n * m; i++) { lre += U[i][t][0] * A[i]; lim += U[i][t][1] * A[i]; }
        for (let j = 0; j < m * p; j++) { rre += V[j][t][0] * B[j]; rim += V[j][t][1] * B[j]; }
        L.push([lre, lim]); Rr.push([rre, rim]);
      }
      let worst = 0;
      for (let a = 0; a < n; a++) for (let c = 0; c < p; c++) {
        let direct = 0;
        for (let b = 0; b < m; b++) direct += A[a * m + b] * B[b * p + c];
        let bestErr = Infinity;
        for (const k of [a * p + c, c * n + a]) {
          let gre = 0, gim = 0;
          for (let t = 0; t < r; t++) {
            const pre = L[t][0] * Rr[t][0] - L[t][1] * Rr[t][1];
            const pim = L[t][0] * Rr[t][1] + L[t][1] * Rr[t][0];
            gre += W[k][t][0] * pre - W[k][t][1] * pim;
            gim += W[k][t][0] * pim + W[k][t][1] * pre;
          }
          bestErr = Math.min(bestErr, Math.max(Math.abs(gre - scale * direct), Math.abs(gim)));
        }
        worst = Math.max(worst, bestErr);
      }
      return worst;
    }
    const mod = o.claim.ring === 'F2' ? 2 : 0;
    const A = Array.from({ length: n * m }, (_, i) => ((i * 7 + 3) % 10) - 4);
    const B = Array.from({ length: m * p }, (_, i) => ((i * 5 + 1) % 9) - 4);
    const L = [], R = [];
    for (let t = 0; t < r; t++) {
      let l = 0, rr = 0;
      for (let i = 0; i < n * m; i++) l += U[i][t] * A[i];
      for (let j = 0; j < m * p; j++) rr += V[j][t] * B[j];
      L.push(l); R.push(rr);
    }
    let worst = 0;
    for (let a = 0; a < n; a++) for (let c = 0; c < p; c++) {
      let direct = 0;
      for (let b = 0; b < m; b++) direct += A[a * m + b] * B[b * p + c];
      /* try both layouts — the screen prunes only when NEITHER matches */
      let bestErr = Infinity;
      for (const k of [a * p + c, c * n + a]) {
        let got = 0;
        for (let t = 0; t < r; t++) got += W[k][t] * L[t] * R[t];
        const err = mod ? Math.abs(((got - direct) % mod + mod) % mod) : Math.abs(got - direct);
        bestErr = Math.min(bestErr, err);
      }
      worst = Math.max(worst, bestErr);
    }
    return worst;
  },
  interesting: (o, v) => v === 0,
  key: (o) => 'mm|' + o.id,
  certify(o) {
    let sourcePin = null;
    if (o.pin) {
      const pv = PIN.verify(o.pin);
      if (!pv.ok) return { verdict: 'REFUSED', why: 'source pin failed for ' + o.pin + ': ' + pv.why };
      sourcePin = { file: pv.file, sha256: pv.sha256 };
    }
    const a = o.claim.ring === 'Zi' ? T.auditZi(o.claim) : T.audit(o.claim);
    if (a.verdict === 'REFUTED') {
      return { verdict: 'REJECT', enclosure: [0, 0],
        text: 'DISCOVERY-CLASS REFUTATION: ' + o.id + ' does NOT multiply matrices — ' + a.why,
        extra: { id: o.id, source: o.source, why: a.why, ...(sourcePin ? { sourcePin } : {}) } };
    }
    if (a.verdict === 'REFUSED') return { verdict: 'REFUSED', why: a.why };
    const [n, m, p] = o.claim.dims;
    if (a.rank >= a.naive) {
      return { verdict: 'REJECT', enclosure: [a.rank, a.rank],
        text: o.id + ': the identity HOLDS (rank ' + a.rank + ', layout ' + a.layout + ') but rank is not below the naive '
          + a.naive + ' — certified correct, certified NOT fast',
        extra: { id: o.id, rank: a.rank, naive: a.naive, layout: a.layout } };
    }
    /* the characteristic story, decided rather than quoted: an F2 algorithm
       is also audited over Q so the certificate states whether the speedup
       survives lifting to characteristic 0 */
    let overQ = null;
    if (o.claim.ring === 'F2') {
      const q = T.audit({ ...o.claim, ring: 'Q' });
      overQ = q.verdict === 'VERIFIED' ? 'also VERIFIED over Q' : 'REFUTED over Q — the algorithm genuinely requires characteristic 2';
    }
    return {
      verdict: 'HIT',
      enclosure: [a.rank, a.rank],
      text: o.id + ': ' + n + 'x' + m + ' times ' + m + 'x' + p + ' in ' + a.rank + ' multiplications VERIFIED over '
        + (o.claim.ring === 'Zi' ? 'Z[i] (doubled half-Gaussian factors; identity = ' + a.scale + '*T, denominators cleared)' : (o.claim.ring || 'Q'))
        + ' — all ' + a.equations + ' tensor-identity equations hold exactly (layout ' + a.layout
        + '); rank ' + a.rank + ' < ' + a.naive + ' naive'
        + (overQ ? '; ' + overQ : '')
        + (o.generated ? ' — generated AND decided here' : ''),
      extra: { id: o.id, source: o.source, dims: o.claim.dims, rank: a.rank, naive: a.naive,
        ring: o.claim.ring || 'Q', layout: a.layout, equations: a.equations,
        ...(o.claim.ring === 'Zi' ? { scale: a.scale } : {}),
        ...(overQ ? { overQ } : {}),
        ...(o.transcription ? { transcription: o.transcription } : {}),
        ...(sourcePin ? { sourcePin } : {}),
        ...(o.note ? { note: o.note } : {}) }
    };
  }
};
