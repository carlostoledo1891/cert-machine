/* basis.js — read a challenge basis and PROVE its determinant, rather than
 * assuming the shape the documentation describes.
 *
 * A Goldstein–Mayer challenge basis is claimed to be
 *
 *     row 0 : [ q  0  0 … 0 ]
 *     row i : [ x_i  0 … 1 … 0 ]     with the 1 in column i
 *
 * which is lower-triangular-with-unit-diagonal after the first row, so
 * det = q. That is exactly the kind of "everyone knows" step this bench does not
 * take on trust: the structure is CHECKED entry by entry, and if a single entry
 * is not where it should be the determinant is refused rather than guessed.
 */
'use strict';

function parse(text) {
  const rows = text.trim().replace(/^\[/, '').replace(/\]\s*$/, '')
    .split(']').map(r => r.replace(/[\s\[]+/g, ' ').trim()).filter(Boolean)
    .map(r => r.split(/\s+/).map(BigInt));
  return rows;
}

/* returns { ok, n, q, why } — q only when the structure is verified */
function determinant(rows) {
  const n = rows.length;
  if (!n) return { ok: false, why: 'empty' };
  for (const r of rows) if (r.length !== n) return { ok: false, n, why: `row of length ${r.length}, expected ${n}` };
  const q = rows[0][0];
  if (q <= 0n) return { ok: false, n, why: 'q not positive' };
  for (let j = 1; j < n; j++) if (rows[0][j] !== 0n) return { ok: false, n, why: `row 0 col ${j} is not zero` };
  for (let i = 1; i < n; i++) {
    for (let j = 1; j < n; j++) {
      const want = (i === j) ? 1n : 0n;
      if (rows[i][j] !== want) return { ok: false, n, why: `row ${i} col ${j} is ${rows[i][j]}, expected ${want}` };
    }
  }
  /* row 0 is [q,0…0] and the rest are the identity in columns 1…n-1, so
     expanding along the first row gives det = q exactly. */
  return { ok: true, n, q, why: 'lower-triangular after row 0, unit diagonal' };
}

module.exports = { parse, determinant };
