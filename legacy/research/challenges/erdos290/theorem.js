/* theorem.js — for EVEN d, disc(f_d) is a perfect square exactly when d+1 is, so only
 * d = 4k(k+1) can drop into the even-weight subgroup. That is a proof, not a sweep — but
 * note the scope: the theorem decides WHICH even degrees have square discriminant, hence
 * which Gal(f_d) can drop into E ⊆ A_{2l}. Whether the group DOES drop at one of them, and
 * whether some other degree drops to a proper subgroup NOT inside A_{2l} (which a nonsquare
 * discriminant does not forbid), are per-degree questions, settled only for even d ≤ 120.
 * (Odd d are out of scope and need to be: d/2 is a rational root there, δ = 1, and the
 * even-only proof does not constrain their discriminants — disc(f_1) = 1 is a square.)
 *
 * Until 2026-08-03 this repository stated the 4k(k+1) law as a conjecture supported by six
 * members and 24 controls. It is a theorem, and the proof is five lines. This program checks
 * every line of it as an exact integer identity, and carries planted bugs that must break it.
 *
 * ---------------------------------------------------------------------------------------
 * SETUP.  f_d(x) = Σ_{i=0}^{d} Π_{0≤j≤d, j≠i} (x − j) = d/dx Π_{j=0}^{d}(x − j),  degree d.
 * (The index runs from 0, not 1. With i from 1 the polynomial has degree d−1 and none of what
 * follows is true of it — falsifier F3 below is exactly that mistake, and it must fail.)
 *
 * The roots 0,1,…,d are symmetric about d/2, so recentring at d/2 makes Π_{j}(x−j) even or
 * odd according to the parity of d, and f_d inherits the opposite parity:
 *
 *   d ODD  → d/2 is a half-integer, not a root of the product; the product is EVEN in
 *            y = x − d/2, so f_d is ODD in y and f_d(d/2) = 0. A RATIONAL ROOT: f_d then has
 *            a root mod every p, so δ(f_d) = 1 and the term contributes its full weight.
 *            Σ_{d odd} 1/(d(d+1)) = Σ_{k≥0} (1/(2k+1) − 1/(2k+2)) = log 2. That is where the
 *            log 2 in the enclosure comes from, and it is ~83% of c.
 *   d EVEN → d/2 IS one of the roots, the product is ODD in y, f_d is EVEN in y, and
 *            f_d(x + d/2) = h(x²) for a degree-l polynomial h, l = d/2. Only these are at issue.
 *
 * THE PROOF, for even d = 2l.
 *   (1)  h(0) = f_d(l) = Π_{j≠l}(l − j) = (−1)^l (l!)²
 *        — every other summand of f_d(l) carries the factor (l − l) = 0, so only i = l
 *          survives; the surviving product is (l)(l−1)…(1) · (−1)(−2)…(−l) = (−1)^l (l!)².
 *   (2)  disc(h(x²)) = (−1)^l · 2^{2l} · a · h(0) · disc(h)²,   a = lead(h).
 *        — For MONIC h this is a published theorem: Altmann–Awtrey–Cryan–Shannon–Touchette,
 *          "Galois groups of doubly even octic polynomials", J. Algebra Appl. 19 (2020)
 *          2050014, Thm 2.4 (restated as Chen–Chin–Tan, arXiv:2210.10257, Prop. 2.8, at
 *          k = 2, m = l). The non-monic factor a follows from disc(c·q) = c^{2 deg q − 2}
 *          disc(q) — and it is the entire content here: applied in its monic form the
 *          square criterion would read (−1)^l h(0) = (l!)², ALWAYS a square. Random
 *          non-monic h are tested below precisely so this factor cannot pass by accident.
 *   (3)  substituting (1) into (2), with a = lead(h) = lead(f_d) = d+1 — f_d is the
 *        derivative of a monic polynomial of degree d+1 — and using
 *        disc(f_d) = disc(f_d(x + d/2)) = disc(h(x²)):
 *
 *              disc(f_d) = (d+1) · ( 2^l · l! · disc(h) )²
 *
 *   (4)  the bracket is a perfect square and disc(h) ≠ 0 — not an assumption: P has d+1
 *        distinct real roots, so by Rolle f_d has d distinct real roots, none equal to l
 *        (f_d(l) = h(0) = ±(l!)² ≠ 0), i.e. f_d(x+l) has 2l distinct nonzero real roots
 *        ±ρ_1,…,±ρ_l, so h has the l distinct roots ρ_i² and is separable (checked below
 *        at every swept degree as well) — so
 *              disc(f_d) is a perfect square  ⟺  d + 1 is a perfect square.
 *   (5)  d even ⇒ d+1 odd ⇒ d+1 = (2k+1)² ⇒ d = (2k+1)² − 1 = 4k(k+1).   ∎
 *
 * What this does NOT prove: that Gal(f_d) IS the even-weight subgroup at those degrees. A
 * square discriminant gives containment only; the lower containment is the per-degree work in
 * galois-exceptions.js. The theorem settles which even degrees have square discriminant —
 * hence which CAN drop into E — not whether the group drops, and not what happens outside
 * A_{2l}. Keeping that line sharp is the whole discipline here.
 */
'use strict';
const path = require('path');
const G = require(path.join(__dirname, 'galois-exceptions.js'));
const { fdCoeffs, discExact, pairPoly } = G;

function isSquare(n) {
  if (n < 0n) return false;
  if (n < 2n) return true;
  let x = n, y = (x + 1n) / 2n;
  while (y < x) { x = y; y = (x + n / x) / 2n; }
  return x * x === n;
}
function fact(n) { let f = 1n; for (let i = 2n; i <= BigInt(n); i++) f *= i; return f; }

/* f_d with the index running from 1 instead of 0 — the WRONG polynomial, kept so the
   difference is a tested property rather than a convention nobody checks. */
function fdCoeffsOffByOne(d) {
  let P = [1n];
  for (let j = 1; j <= d; j++) {
    const nx = new Array(P.length + 1).fill(0n);
    for (let k = 0; k < P.length; k++) { nx[k + 1] += P[k]; nx[k] -= BigInt(j) * P[k]; }
    P = nx;
  }
  const out = new Array(d).fill(0n);
  for (let i = 1; i <= d; i++) {
    /* divide P by (x − i) exactly, then accumulate */
    const q = new Array(d).fill(0n); let carry = 0n;
    for (let k = d; k >= 1; k--) { q[k - 1] = P[k] + carry; carry = BigInt(i) * q[k - 1]; }
    for (let k = 0; k < d; k++) out[k] += q[k];
  }
  return out;
}

let fails = 0;
const check = (name, ok) => { console.log((ok ? '  ok   ' : '  FAIL ') + name); if (!ok) fails++; };

console.log('theorem.js — for even d, disc(f_d) is a perfect square exactly when d+1 is:');
console.log('            only d = 4k(k+1) can drop into the even-weight subgroup');
console.log('  disc(f_d) = (d+1) * (2^l * l! * disc h)^2   for even d = 2l\n');

/* ---------- line (1): h(0) = (-1)^l (l!)^2 ---------- */
/* EVERY even d <= 80, not a sample. The sampled list was chosen when discExact looked
   expensive; measured, the full sweep is 14 s, and "verified at every even d <= 80" is a
   claim the page and the posts already make. Cheaper to make the claim true than to weaken it. */
const EVEN = []; for (let d = 2; d <= 80; d += 2) EVEN.push(d);
let h0bad = 0;
for (const d of EVEN) {
  const l = d / 2;
  const h = pairPoly(fdCoeffs(d), l);
  const want = (l % 2 === 0 ? 1n : -1n) * fact(l) * fact(l);
  if (h[0] !== want) { h0bad++; console.log('    h(0) mismatch at d=' + d); }
}
check('line (1): h(0) = (-1)^l (l!)^2 at every even d <= 80', h0bad === 0);

/* ---------- line (2): the composition formula, ON ITS OWN ----------
 * Until this check existed, theorem.js verified lines (1) and (3) and took (2) on faith — so a
 * WRONG line (2) plus a compensating slip would still have printed ALL PASS while the written
 * proof had a hole. It is also the line where the leading coefficient hides: the "(d+1)" in the
 * final identity is lead(h), which for f_d happens to equal d+1 because f_d is the derivative
 * of a monic degree-(d+1) product. Random non-monic h are tested here precisely so that this
 * cannot pass by a coincidence of the f_d family. */
function compose(h) {                       /* h(x^2) */
  const out = new Array(2 * (h.length - 1) + 1).fill(0n);
  for (let i = 0; i < h.length; i++) out[2 * i] = h[i];
  return out;
}
{
  const RAND = [[1n, 2n, 3n], [5n, -3n, 2n, 7n], [2n, 0n, -1n, 4n, 3n],
                [-7n, 11n, 2n, 5n, -3n, 9n], [1n, 1n, 1n, 1n], [13n, -2n, 0n, 0n, 6n],
                [4n, 9n, -5n, 2n, 8n, -1n, 3n]];
  const fam = [8, 24, 48].map(d => pairPoly(fdCoeffs(d), d / 2));
  let bad = 0;
  for (const h of RAND.concat(fam)) {
    const l = h.length - 1, a = h[l];
    const lhs = discExact(compose(h));
    const rhs = (l % 2 === 0 ? 1n : -1n) * (2n ** BigInt(2 * l)) * a * h[0] * discExact(h) ** 2n;
    if (lhs !== rhs) { bad++; console.log('    composition formula fails at l=' + l); }
  }
  check('line (2): disc(h(x^2)) = (-1)^l 2^{2l} lead(h) h(0) disc(h)^2 — ' +
        RAND.length + ' random h (monic and not) + the 3 real ones', bad === 0);
  const leadOk = [8, 24, 48, 80].every(d => {
    const h = pairPoly(fdCoeffs(d), d / 2); return h[h.length - 1] === BigInt(d + 1); });
  check('lead(h) = d+1, so the (d+1) in the identity IS the leading coefficient', leadOk);
}

/* ---------- line (3): the identity itself, as exact integers ---------- */
console.log('\n   d     l   d+1 square?  disc(f_d) square?   identity');
let idBad = 0, equivBad = 0, zeroH = 0;
for (const d of EVEN) {
  const l = d / 2;
  const f = fdCoeffs(d);
  const h = pairPoly(f, l);
  const df = discExact(f), dh = discExact(h);
  if (dh === 0n) zeroH++;
  const rhs = BigInt(d + 1) * ((2n ** BigInt(l)) * fact(l) * dh) ** 2n;
  const ok = df === rhs;
  if (!ok) idBad++;
  const sd1 = isSquare(BigInt(d + 1)), sdf = isSquare(df);
  if (sd1 !== sdf) equivBad++;
  console.log('  ' + String(d).padStart(3) + '  ' + String(l).padStart(4) + '   ' +
    String(sd1).padEnd(12) + ' ' + String(sdf).padEnd(19) + (ok ? 'holds' : '** BROKEN **'));
}
check('line (3): disc(f_d) = (d+1)(2^l l! disc h)^2 exactly, all ' + EVEN.length + ' degrees', idBad === 0);
/* disc(h) = 0 is the ONE way "A·B² square iff A square" can fail (A·0² = 0 is a square for
 * every A). The Rolle argument in the header proves it never happens; this check makes the
 * hypothesis machine-visible at every swept degree as well as argued. */
check('line (4) hypothesis: disc(h) != 0 at every swept degree (Rolle argument, verified)', zeroH === 0);
check('line (4): disc(f_d) square <=> d+1 square, all ' + EVEN.length + ' degrees', equivBad === 0);

/* ---------- independent recomputation: two disc implementations must agree ----------
 * galois8.js carries a SECOND exact discriminant (Sylvester matrix + Bareiss, BigInt) that
 * shares no code with galois-exceptions.js's CRT + Hadamard route. Two algorithms, two
 * authorships of the arithmetic, one answer — the cheapest genuinely independent check in
 * the pack, and the whole theorem rests on discExact, so it runs here. */
{
  const G8 = require(path.join(__dirname, 'galois8.js'));
  let xBad = 0;
  for (let d = 2; d <= 20; d += 2) {
    const f = fdCoeffs(d);
    if (G8.discriminant(f) !== discExact(f)) xBad++;
    const h = pairPoly(f, d / 2);
    if (G8.discriminant(h) !== discExact(h)) xBad++;
  }
  check('discExact (CRT/Hadamard) agrees with galois8.js discriminant (Sylvester/Bareiss), f and h, even d <= 20', xBad === 0);
}

/* regression: the fixed-point integer-sqrt loop hung forever on inputs one less than a
 * perfect square — e.g. disc((x−1)²), whose Hadamard row-norm sum is 8 = 3²−1. Terminating
 * Newton (this file's isSquare form) replaced it in galois-exceptions.js on 2026-08-03. */
check('REGRESSION: discExact((x−1)²) = 0 — terminates and is exact', discExact([1n, -2n, 1n]) === 0n);

/* ---------- line (5): the arithmetic of the conclusion ---------- */
const pred = [];
for (let k = 1; k <= 12; k++) pred.push(4 * k * (k + 1));
const bySquare = [];
for (let d = 2; d <= 624; d += 2) if (isSquare(BigInt(d + 1))) bySquare.push(d);
check('line (5): {even d <= 624 : d+1 square} = {4k(k+1)} exactly',
  JSON.stringify(bySquare) === JSON.stringify(pred));
console.log('       ' + pred.slice(0, 8).join(', ') + ', …');

/* ---------- the odd-d half, which is why only even d are at issue ---------- */
let oddBad = 0;
for (let d = 3; d <= 21; d += 2) {
  /* f_d(d/2) = 0 <=> 2^d * f_d(d/2) = 0; evaluate with integer arithmetic on 2x = d */
  const f = fdCoeffs(d);
  let acc = 0n;
  for (let i = 0; i <= d; i++) acc += f[i] * (BigInt(d) ** BigInt(i)) * (2n ** BigInt(d - i));
  if (acc !== 0n) { oddBad++; console.log('    f_' + d + '(d/2) != 0'); }
}
check('odd d: d/2 is a rational root of f_d (so delta = 1), all odd d <= 21', oddBad === 0);

/* ---------- falsifiers: each must BREAK the identity ---------- */
console.log('');
{
  const d = 24, l = 12, f = fdCoeffs(d), h = pairPoly(f, l);
  const df = discExact(f), dh = discExact(h);

  const F1 = df === BigInt(d + 1) * ((2n ** BigInt(l)) * fact(l) * (dh + 1n)) ** 2n;
  check('FALSIFIER F1 (disc h + 1): identity must break', !F1);

  const F2 = df === BigInt(d + 2) * ((2n ** BigInt(l)) * fact(l) * dh) ** 2n;
  check('FALSIFIER F2 (d+1 -> d+2): identity must break', !F2);

  /* F3 is the definition error itself: with i running from 1 the polynomial has degree d-1,
     f(x+d/2) is not even, and disc is not a square at d = 8. This is a real mistake that was
     briefly in the submission text, so it is pinned as a control rather than trusted. */
  const w8 = fdCoeffsOffByOne(8);
  const degOk = w8.length - 1 === 7;
  let evenOk = false;
  try { pairPoly(w8, 4); evenOk = true; } catch (e) { evenOk = false; }
  check('FALSIFIER F3 (index from 1): wrong degree ' + (w8.length - 1) + ', f(x+4) not even, ' +
        'disc not square', degOk && !evenOk && !isSquare(discExact(w8)));
}

console.log('\n' + (fails === 0
  ? 'ALL PASS — the 4k(k+1) law is PROVED, not conjectured: for even d, disc(f_d) is a\n' +
    '           perfect square exactly when d+1 is — that is, exactly at d = 4k(k+1).'
  : fails + ' FAILED'));
process.exit(fails === 0 ? 0 : 1);
