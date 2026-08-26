#!/usr/bin/env node
/* verify.js — independent re-verification (Lane B, claim 4) of the machine-checkable
   fragment of the Ran–Teng Conjecture 20 resolution.

   CLAIM AT SOURCE (aimath.robertj1.com, entry id "ran-teng-20", 24 Feb 2026, Matrix
   analysis, system GPT-5.2 Thinking, verification "Human-checked mathematical proof"):
   "The exact nonreal spectral region is determined for a four-cycle family of
   row-stochastic nonnegative matrices, resolving Conjecture 20 of Ran and Teng."
   The entry's only artifact is the manuscript arXiv:2602.18918 (local pinned copy:
   src/eprint/ranteng_vibe_18918.tex); the polished companion proof is arXiv:2605.06743
   (src/eprint/spectral_region_06743.tex). There is NO author code and NO machine
   certificate anywhere in the claim chain — every definition below is extracted from
   the papers' own equations, cited by label.

   THE THEOREM (2602.18918, appendix Version 3; identical statement in 2605.06743
   Thm. \label{thm:main}). For the 4-cycle row-stochastic family
       A(α,β,γ,δ) = [[α,1−α,0,0],[0,β,1−β,0],[0,0,γ,1−γ],[1−δ,0,0,δ]],
   parameters in [0,1)  (\label{eq:matrix-family}), every nonreal eigenvalue
   λ = a+ib, b_+ = |b|, satisfies
       (1) 0 ≤ a ≤ 1,   (2) a + b_+ ≤ 1,   (3) G(a,b_+) ≥ 0,
   G(a,b) := (b²+a²+a)² + 2a² − b², and conversely every point of the open region is
   attained; the boundary curves C_R (λ = 1−x+ix, diagonal family) and C_L (G = 0,
   family A_L(α) = A(α,0,0,0)) are attained. Conjecture 20 itself (Ran & Teng, ELA 40
   (2024) 506–537, p. 535, matrix (22), region R) is the necessity direction.

   WHAT THIS SCRIPT PROVES, layer by layer — my own implementation throughout; exact
   BigInt rationals (core/interval/rational.js) where the question is an identity or a
   tie, outward-rounded intervals (core/interval/interval.js) + the Krawczyk operator
   (core/interval/radii.js) where it is a root enclosure:

   [1] EXACT: det(λI − A(α,β,γ,δ)) = Π(λ−params) − Π(1−params) as a polynomial
       identity in Q[λ,α,β,γ,δ] (own Laplace determinant). This is \eqref{eq:multconstraint}:
       for nonreal λ the eigenvalue condition IS the product constraint.
   [2] EXACT: the quadratic-in-s=b² bookkeeping for G (2605.06743 eq. at line "G(a,b)=
       s²+s(2a²+2a−1)+(a²+a)²+2a²") and the discriminant claim Δ = 1−4a−12a² =
       (2a+1)(1−6a) = −12(a−1/6)(a+1/2), i.e. Δ ≥ 0 ⇔ −1/2 ≤ a ≤ 1/6
       (2602.18918 §3.4 "The Iterations", obligation (i)).
   [3] EXACT: the load-bearing factorization |λ|⁶ − N(a,b) = |λ−1|² G(a,b) with
       N(a,b) := 4a³−3a²−4ab²+b² (\eqref{eq:Ndef-v2}; Version 3 part 11.2 Step 6;
       2605.06743 line "|λ|⁶ − N(a,b) = ((a−1)²+b²) G(a,b)"), in both the (a,b) form
       and the paper's r = a²+b² form G = r²+(2a−1)r+4a².
   [4] EXACT: the complete algebra chain of Lemma 4 (tight-regime lemma, Version 3):
       every expansion, cross-multiplication and squaring the proof performs —
       including the two closing margins 32a³+64a⁴ (\eqref{eq:sminusGT3a2}) and
       256a⁶ (\eqref{eq:squareCompare}) — re-derived and checked identically over Q.
   [5] EXACT, boundary families: (i) C_R: (λ−c)⁴ − (1−c)⁴ = Π_k (λ − (c+(1−c)i^k))
       in Q[c][i], so the diagonal family's nonreal eigenvalues are c ± (1−c)i with
       a + b_+ = 1 EXACTLY (condition (2) is tight — an equality no interval can
       decide, only exact arithmetic; this powers mutation M3). (ii) C_L: the chain
       p_L(λ) = λ⁴−αλ³−(1−α) = (λ−1)(λ³+(1−α)(λ²+λ+1)) = (λ³−1)(λ−α) + (λ−1) and
       Im[(1−λ⁴)(1−conj(λ)³)] = b(|λ|⁶ − N(a,b)) = b|λ−1|²G(a,b), which together
       prove EXACTLY: every nonreal eigenvalue of A_L(α), α real, lies ON G = 0.
       (For nonreal λ: λ³ = 1 is excluded since p_L then equals λ−1 ≠ 0; hence
       α = (1−λ⁴)/(1−λ³), and α ∈ R forces Im[(1−λ⁴)(1−conj(λ)³)] = 0, so
       b|λ−1|²G = 0 with b ≠ 0, λ ≠ 1.) Plus the endpoint i at α = 0 and the
       companion paper's exact curve point (1/6, √11/6) with G = 0.
   [6] CERTIFIED SWEEP (falsification-grade, not a proof of necessity): for ~270
       deterministic parameter tuples (grid, seeded LCG, near-A_L down to ε = 1e−4,
       near-diagonal, near-corner), all four eigenvalues of the EXACT rational
       quartic are enclosed by the 2-D Krawczyk operator (F = (Re p, Im p)) in
       pairwise-disjoint boxes — so no eigenvalue is unaccounted — and every
       certified-nonreal box passes (1),(2),(3) with certified sign. One certified
       violation here would REFUTE the theorem.
   [7] CERTIFIED: the A_L family traces G = 0 (interval G straddles 0 at width
       < 1e−9 on certified roots — the numerical shadow of the exact result [5ii]).
   [8] CERTIFIED ATTAINMENT WITNESSES (converse direction, sampled): for 10 exact
       rational interior targets λ = a+ib (membership checked exactly), Krawczyk
       certifies real (t,s) ∈ (0,1)² with (z+t)³(z+s) = t³s, z = λ−1 — by [1] this
       makes λ EXACTLY an eigenvalue of A(1−t,1−t,1−t,1−s), parameters in (0,1).

   NOT CHECKED (the analytic superstructure — prose, not machine-checkable here):
   the argument parametrization and Lemma "Exact equivalence" (Version 3 part 5),
   the convexity/Jensen/Karamata optimization that proves necessity for ALL
   parameters, the Arg/arctan branch bookkeeping, the tightness lemma, the
   continuity/IVT argument for full interior attainment, and every conjecture-level
   interpretation (Karpelevich region K₄ membership, irreducibility framing).
   See VERDICT.md.

   MUTATION CONTROLS (all must be REJECTED — teeth): M1 wrong matrix entry,
   M2 sign flip in G, M3 strengthened bound a+b_+ < 1 strict (killed by the exact
   tie), M4 fake eigenvalue 1e−3 off the C_L curve (killed by certified sup G < 0),
   M5 Krawczyk refusal on a rootless box.

   Runtime target < 30 s. Node >= 16. Usage: node verify.js */
'use strict';

const t0wall = Date.now();
const path = require('path');
/* WHERE THE TOOLKIT IS, and why this is not `path.join(__dirname, '..', '..', '..')`.
   This verifier ships, and it runs from two trees whose depths have not always agreed. It counted
   `..` three times, which was right in exactly one of them; on 2026-08-08 the pages moved to their
   routes and it became right in the other one instead; on 2026-08-21 the two converged. That is
   the whole argument — THE DEPTH KEPT CHANGING AND THE MARKER NEVER DID. A depth is a fact about a
   layout; a MARKER is a fact about the toolkit. Find the root by looking for
   core/interval/interval.js above this file, and the verifier survives any move of either tree.
   Bounded, and it names the failure rather than throwing a module-resolution stack trace at a
   reader who just downloaded a certificate pack.
   THIS COMMENT DELIBERATELY NAMES NO CURRENT LOCATION (2026-08-21). The file is sha-pinned by its
   claim record, so a layout fact written HERE costs a re-verification every time the tree moves —
   and this block had already gone stale twice, the second time incoherently, still contrasting two
   depths after they became the same. C51 and C52 are the same lesson seen from two ends. */
const fs = require('fs');
function eqcertSrc(from) {
  let d = from;
  for (let i = 0; i < 8; i++) {
    const cand = path.join(d, 'core', 'interval');
    if (fs.existsSync(path.join(cand, 'interval.js'))) return cand;
    const up = path.dirname(d);
    if (up === d) break;
    d = up;
  }
  throw new Error('verify.js: eqcert/src was not found above ' + from +
    ' — this verifier needs the interval toolkit it was published beside.');
}
const EQSRC = eqcertSrc(__dirname);
const EQ = EQSRC;
const IV = require(path.join(EQ, 'interval.js'));
const Q = require(path.join(EQ, 'rational.js'));
const { krawczyk } = require(path.join(EQ, 'radii.js'));
const { iv, nextUp, nextDown } = IV;

let checks = 0, failures = 0;
const say = (ok, msg) => { checks++; console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${msg}`); if (!ok) failures++; };

/* ================= exact layer: sparse polynomials over Q =================
   My own layer, coefficients are eqcert rationals ({n,d} BigInt fractions from
   rational.js — never a second rational implementation). Up to 5 variables;
   a monomial is the key "e0,e1,e2,e3,e4". */
const KZ = '0,0,0,0,0';
function pnew() { return new Map(); }
function paddInto(m, key, c) {
  const cur = m.get(key);
  const s = cur ? Q.add(cur, c) : c;
  if (Q.isZero(s)) m.delete(key); else m.set(key, s);
}
function pconst(n, d) { const m = pnew(); paddInto(m, KZ, Q.R(n, d === undefined ? 1n : d)); return m; }
function pvar(i) { const e = [0, 0, 0, 0, 0]; e[i] = 1; const m = pnew(); m.set(e.join(','), Q.R(1n)); return m; }
function padd(a, b) { const m = new Map(a); for (const [k, c] of b) paddInto(m, k, c); return m; }
function pneg(a) { const m = pnew(); for (const [k, c] of a) m.set(k, Q.neg(c)); return m; }
function psub(a, b) { return padd(a, pneg(b)); }
function pmul(a, b) {
  const m = pnew();
  for (const [ka, ca] of a) {
    const ea = ka.split(',').map(Number);
    for (const [kb, cb] of b) {
      const eb = kb.split(',').map(Number);
      paddInto(m, ea.map((e, i) => e + eb[i]).join(','), Q.mul(ca, cb));
    }
  }
  return m;
}
function pscale(a, n, d) { const s = Q.R(n, d === undefined ? 1n : d); const m = pnew(); for (const [k, c] of a) { const t = Q.mul(c, s); if (!Q.isZero(t)) m.set(k, t); } return m; }
function ppow(a, n) { let r = pconst(1n); for (let i = 0; i < n; i++) r = pmul(r, a); return r; }
const pIsZero = a => a.size === 0;
const pEq = (a, b) => pIsZero(psub(a, b));
function peval(a, pt) { /* pt: array of 5 rationals */
  let tot = Q.R(0n);
  for (const [k, c] of a) {
    const e = k.split(',').map(Number);
    let t = c;
    for (let i = 0; i < 5; i++) for (let j = 0; j < e[i]; j++) t = Q.mul(t, pt[i]);
    tot = Q.add(tot, t);
  }
  return tot;
}
/* complex polynomials: pairs {re, im} of polys (i adjoined formally) */
const cP = (re, im) => ({ re, im });
const cpadd = (u, v) => cP(padd(u.re, v.re), padd(u.im, v.im));
const cpsub = (u, v) => cP(psub(u.re, v.re), psub(u.im, v.im));
const cpmul = (u, v) => cP(psub(pmul(u.re, v.re), pmul(u.im, v.im)),
                           padd(pmul(u.re, v.im), pmul(u.im, v.re)));
const cpIsZero = u => pIsZero(u.re) && pIsZero(u.im);

/* ================= shared exact objects ================= */
/* G and N in Q[a,b] (vars 0,1). flipG is mutation hook M2. */
function Gpoly(flipG) {
  const a = pvar(0), b = pvar(1);
  const q = padd(padd(ppow(b, 2), ppow(a, 2)), a);               /* b²+a²+a */
  const core = padd(ppow(q, 2), pscale(ppow(a, 2), 2n));         /* (…)² + 2a² */
  return flipG ? padd(core, ppow(b, 2)) : psub(core, ppow(b, 2));
}
function Npoly() {
  const a = pvar(0), b = pvar(1);
  return padd(psub(psub(pscale(ppow(a, 3), 4n), pscale(ppow(a, 2), 3n)),
                   pscale(pmul(a, ppow(b, 2)), 4n)), ppow(b, 2));
}

/* ================= [1] characteristic polynomial identity ================= */
console.log('Lane B verifier — Ran–Teng Conjecture 20 (arXiv:2602.18918 + companion 2605.06743)');
console.log('\n[1] Exact: det(lambda*I - A) = prod(lambda-params) - prod(1-params) in Q[l,a,b,g,d]');
function det4(M) { /* own Laplace expansion along the first row (recursive minors) */
  function det(rows, cols) {
    if (cols.length === 1) return M[rows[0]][cols[0]];
    let r = pnew(); const row = rows[0];
    cols.forEach((c, j) => {
      const sub = det(rows.slice(1), cols.filter(x => x !== c));
      const t = pmul(M[row][c], sub);
      r = (j % 2 === 0) ? padd(r, t) : psub(r, t);
    });
    return r;
  }
  return det([0, 1, 2, 3], [0, 1, 2, 3]);
}
function charPolyIdentity(mutateEntry) {
  const L = pvar(0), al = pvar(1), be = pvar(2), ga = pvar(3), de = pvar(4);
  const one = pconst(1n), zero = pconst(0n);
  const m1 = x => psub(one, x);                                   /* 1 − x */
  /* λI − A; mutation M1 plants δ where 1−δ belongs (bottom-left) */
  const bl = mutateEntry ? pneg(de) : pneg(m1(de));
  const M = [
    [psub(L, al), pneg(m1(al)), zero, zero],
    [zero, psub(L, be), pneg(m1(be)), zero],
    [zero, zero, psub(L, ga), pneg(m1(ga))],
    [bl, zero, zero, psub(L, de)]];
  const lhs = det4(M);
  const rhs = psub(pmul(pmul(psub(L, al), psub(L, be)), pmul(psub(L, ga), psub(L, de))),
                   pmul(pmul(m1(al), m1(be)), pmul(m1(ga), m1(de))));
  return pEq(lhs, rhs);
}
say(charPolyIdentity(false), 'det(lI-A) = (l-a)(l-b)(l-g)(l-d) - (1-a)(1-b)(1-g)(1-d)  [eq:multconstraint basis]');

/* ================= [2] G as a quadratic in s = b², discriminant ================= */
console.log('\n[2] Exact: quadratic-in-s bookkeeping and discriminant of G');
{
  const a = pvar(0), s = pvar(1), one = pconst(1n);
  const Gs = psub(padd(ppow(padd(s, padd(ppow(a, 2), a)), 2), pscale(ppow(a, 2), 2n)), s);
  const B = psub(padd(pscale(ppow(a, 2), 2n), pscale(a, 2n)), one);        /* 2a²+2a−1 */
  const Cc = padd(ppow(padd(ppow(a, 2), a), 2), pscale(ppow(a, 2), 2n));   /* (a²+a)²+2a² */
  say(pEq(Gs, padd(padd(ppow(s, 2), pmul(B, s)), Cc)),
    'G = s² + (2a²+2a-1)s + (a²+a)² + 2a²   [2605.06743, quadratic-in-s form]');
  const Delta = psub(ppow(B, 2), pscale(Cc, 4n));
  const target = psub(psub(one, pscale(a, 4n)), pscale(ppow(a, 2), 12n));  /* 1−4a−12a² */
  say(pEq(Delta, target), 'discriminant = 1 - 4a - 12a²');
  say(pEq(target, pmul(padd(pscale(a, 2n), one), psub(one, pscale(a, 6n)))),
    '1 - 4a - 12a² = (2a+1)(1-6a)');
  say(pEq(target, pscale(pmul(psub(a, pconst(1n, 6n)), padd(a, pconst(1n, 2n))), -12n)),
    '1 - 4a - 12a² = -12(a - 1/6)(a + 1/2)  =>  Delta >= 0 iff -1/2 <= a <= 1/6  [obligation (i)]');
  /* completed square: G = (s − u)² − Δ/4, u = (1−2a−2a²)/2 */
  const u = pscale(psub(psub(one, pscale(a, 2n)), pscale(ppow(a, 2), 2n)), 1n, 2n);
  say(pEq(Gs, psub(ppow(psub(s, u), 2), pscale(Delta, 1n, 4n))),
    'G = (s - (1-2a-2a²)/2)² - Delta/4   (root formula for s_± is exactly this square)');
}

/* ================= [3] the factorization |λ|⁶ − N = |λ−1|² G ================= */
console.log('\n[3] Exact: |lambda|^6 - N(a,b) = |lambda-1|^2 G(a,b)   [Version 3, 11.2 Step 6]');
{
  const a = pvar(0), b = pvar(1), one = pconst(1n);
  const G = Gpoly(false), N = Npoly();
  say(pEq(N, padd(pmul(psub(one, pscale(a, 4n)), ppow(b, 2)),
                  pmul(ppow(a, 2), psub(pscale(a, 4n), pconst(3n))))),
    'N = (1-4a)b² + a²(4a-3)   [eq:Ndef-v2]');
  const r2 = padd(ppow(a, 2), ppow(b, 2));                       /* |λ|² */
  const lm1 = padd(ppow(psub(a, one), 2), ppow(b, 2));           /* |λ−1|² */
  say(pEq(psub(ppow(r2, 3), N), pmul(lm1, G)),
    '(a²+b²)³ - N(a,b) = ((a-1)²+b²) · G(a,b)');
  /* the paper's r-substitution forms (vars a, r) */
  const r = pvar(1);            /* reuse slot 1 as r; b² = r − a² */
  const bsq = psub(r, ppow(a, 2));
  const Gr = psub(padd(ppow(padd(bsq, padd(ppow(a, 2), a)), 2), pscale(ppow(a, 2), 2n)), bsq);
  const GrTarget = padd(padd(ppow(r, 2), pmul(psub(pscale(a, 2n), one), r)), pscale(ppow(a, 2), 4n));
  say(pEq(Gr, GrTarget), 'G(b²=r-a²) = r² + (2a-1)r + 4a²');
  const Nr = padd(pmul(psub(one, pscale(a, 4n)), bsq),
                  psub(pscale(ppow(a, 3), 4n), pscale(ppow(a, 2), 3n)));
  say(pEq(psub(ppow(r, 3), Nr), pmul(padd(psub(r, pscale(a, 2n)), one), GrTarget)),
    'r³ - N = (r + 1 - 2a) (r² + (2a-1)r + 4a²)');
}

/* ================= [4] Lemma 4 algebra chain ================= */
console.log('\n[4] Exact: every expansion in Lemma 4 (tight-regime lemma, Version 3)');
{
  const a = pvar(0), b = pvar(1), one = pconst(1n);
  const N = Npoly();
  const P = (...terms) => terms.reduce(padd, pnew());            /* sum helper */
  const t = (n, k) => pscale(ppow(a, k), n);                     /* n·a^k */
  say(pEq(ppow(psub(psub(one, t(2n, 1)), t(8n, 2)), 2),
          P(one, t(-4n, 1), t(-12n, 2), t(32n, 3), t(64n, 4))),
    '(1-2a-8a²)² = 1 - 4a - 12a² + 32a³ + 64a⁴');
  say(pEq(psub(ppow(psub(psub(one, t(2n, 1)), t(8n, 2)), 2),
               pmul(padd(t(2n, 1), one), psub(one, t(6n, 1)))),
          P(t(32n, 3), t(64n, 4))),
    '(1-2a-8a²)² - (2a+1)(1-6a) = 32a³ + 64a⁴  > 0 for a > 0   [eq:sminusGT3a2 => b² > 3a²]');
  say(pEq(pmul(psub(one, t(4n, 1)), psub(psub(one, t(2n, 1)), t(2n, 2))),
          P(one, t(-6n, 1), t(6n, 2), t(8n, 3))),
    '(1-4a)(1-2a-2a²) = 1 - 6a + 6a² + 8a³');
  say(pEq(pmul(ppow(psub(one, t(4n, 1)), 2), P(one, t(-4n, 1), t(-12n, 2))),
          P(one, t(-12n, 1), t(36n, 2), t(32n, 3), t(-192n, 4))),
    '(1-4a)²(1-4a-12a²) = 1 - 12a + 36a² + 32a³ - 192a⁴');
  say(pEq(psub(ppow(P(one, t(-6n, 1), t(16n, 3)), 2),
               pmul(ppow(psub(one, t(4n, 1)), 2), pmul(padd(t(2n, 1), one), psub(one, t(6n, 1))))),
          t(256n, 6)),
    '(1-6a+16a³)² - (1-4a)²(2a+1)(1-6a) = 256a⁶  > 0 for a > 0   [eq:squareCompare]');
  say(pEq(psub(pmul(psub(one, a), psub(ppow(b, 2), t(3n, 2))),
               pmul(a, psub(pscale(ppow(b, 2), 3n), ppow(a, 2)))), N),
    '(1-a)(b²-3a²) - a(3b²-a²) = N(a,b)   [Step 5 cross-multiplication]');
  const r2 = padd(ppow(a, 2), ppow(b, 2));
  say(pEq(psub(pscale(pmul(b, r2), 3n), pscale(ppow(b, 3), 4n)), pmul(b, psub(t(3n, 2), ppow(b, 2)))),
    '3b(a²+b²) - 4b³ = b(3a²-b²)   [sin 3m numerator, eq:cscUcotU]');
  say(pEq(psub(t(4n, 3), pscale(pmul(a, r2), 3n)), pmul(a, psub(ppow(a, 2), pscale(ppow(b, 2), 3n)))),
    '4a³ - 3a(a²+b²) = a(a²-3b²)   [cos 3m numerator, eq:cscUcotU]');
  say(pEq(padd(pneg(pmul(a, psub(ppow(a, 2), pscale(ppow(b, 2), 3n)))),
               pmul(psub(one, a), psub(t(3n, 2), ppow(b, 2)))), pneg(N)),
    '-a(a²-3b²) + (1-a)(3a²-b²) = -N(a,b)   [11.2 Step 5 denominator]');
  say(pEq(pmul(ppow(a, 2), psub(pconst(3n), pscale(a, 4n))), psub(t(3n, 2), t(4n, 3))),
    'a²(3-4a) = 3a² - 4a³   [eq:s0def numerator]');
}

/* ================= [5] boundary families, exactly ================= */
console.log('\n[5] Exact: boundary attainment families C_R and C_L');
{
  /* C_R: diagonal family. Q[c][λ], complex pairs; roots c + (1−c)i^k. */
  const c = pvar(0), L = pvar(1), one = pconst(1n), zero = pnew();
  const cc = cP(c, zero), Lc = cP(L, zero), onec = cP(one, zero);
  const omc = psub(one, c);                                       /* 1−c */
  const rootsCR = [cP(padd(c, omc), zero), cP(c, omc), cP(psub(c, omc), zero), cP(c, pneg(omc))];
  let prod = onec;
  for (const rt of rootsCR) prod = cpmul(prod, cpsub(Lc, rt));
  const charDiag = psub(ppow(psub(L, c), 4), ppow(omc, 4));       /* (λ−c)⁴ − (1−c)⁴ */
  say(cpIsZero(cpsub(prod, cP(charDiag, zero))),
    '(l-c)⁴ - (1-c)⁴ = prod_k (l - (c+(1-c)i^k))  => diagonal spectrum is exactly {c+(1-c)i^k}');
  /* the tie: nonreal eigenvalue c+(1−c)i has a + b_+ − 1 = 0 IDENTICALLY */
  const tie = psub(padd(c, omc), one);
  say(pIsZero(tie), 'C_R: a + b_+ = c + (1-c) = 1 exactly — condition (2) holds with EQUALITY (a tie only exact arithmetic decides)');
  /* λ = 1−x+ix kills (λ−(1−x))⁴ − x⁴: (ix)⁴ = x⁴ */
  const x = pvar(0);
  const ix4 = cpmul(cpmul(cP(pnew(), x), cP(pnew(), x)), cpmul(cP(pnew(), x), cP(pnew(), x)));
  say(cpIsZero(cpsub(ix4, cP(ppow(x, 4), pnew()))), 'C_R: (ix)⁴ - x⁴ = 0, so λ = 1-x+ix is an eigenvalue of A(1-x,1-x,1-x,1-x)');

  /* C_L: A_L(α) chain in Q[λ,α] (vars 0=λ, 1=α) */
  const l = pvar(0), al = pvar(1);
  const pL = psub(psub(ppow(l, 4), pmul(al, ppow(l, 3))), psub(one, al));
  say(pEq(pmul(psub(l, al), ppow(l, 3)), padd(pL, psub(one, al))) &&
      pEq(psub(pmul(psub(l, al), ppow(l, 3)), psub(one, al)), pL),
    'p_L(l) = (l-al) l³ - (1-al) = l⁴ - al·l³ - (1-al)   [char poly of A_L, via [1] at be=ga=de=0]');
  const cubic = padd(ppow(l, 3), pmul(psub(one, al), padd(padd(ppow(l, 2), l), one)));
  say(pEq(pL, pmul(psub(l, one), cubic)), 'p_L = (l-1)(l³ + (1-al)(l²+l+1))  — 1 is always an eigenvalue');
  say(pEq(pL, padd(pmul(psub(ppow(l, 3), one), psub(l, al)), psub(l, one))),
    'p_L = (l³-1)(l-al) + (l-1)  — a nonreal root never has l³ = 1');
  /* elimination identity: Im[(1−λ⁴)(1−conj(λ)³)] = b((a²+b²)³ − N) */
  const a = pvar(0), b = pvar(1);
  const lam = cP(a, b), lamBar = cP(a, pneg(b)), oneC = cP(one, pnew());
  const l4 = cpmul(cpmul(lam, lam), cpmul(lam, lam));
  const lb3 = cpmul(cpmul(lamBar, lamBar), lamBar);
  const W = cpmul(cpsub(oneC, l4), cpsub(oneC, lb3));
  const r2ab = padd(ppow(a, 2), ppow(b, 2));
  say(pEq(W.im, pmul(b, psub(ppow(r2ab, 3), Npoly()))),
    'Im[(1-l⁴)(1-conj(l)³)] = b((a²+b²)³ - N) = b|l-1|²G   [with [3]: real al forces G(a,b)=0]');
  /* endpoint and companion spot point */
  const i1 = [Q.R(0n), Q.R(1n), Q.R(0n), Q.R(0n), Q.R(0n)];       /* (a,b) = (0,1) */
  say(Q.isZero(peval(Gpoly(false), i1)), 'G(0,1) = 0 exactly — the endpoint i (attained by A_L(0): i³+i²+i+1 = 0)');
  /* cubic at α=0 is λ³+λ²+λ+1; evaluate at λ=i with exact complex rationals */
  const iC = cP(pconst(0n), pconst(1n));
  const cub0 = cpadd(cpadd(cpmul(cpmul(iC, iC), iC), cpmul(iC, iC)), cpadd(iC, cP(pconst(1n), pnew())));
  say(cpIsZero(cub0), 'l³+l²+l+1 vanishes at l = i exactly');
  const spot = [Q.R(1n, 6n), Q.R(0n), Q.R(0n), Q.R(0n), Q.R(0n)];
  /* G(1/6, b) with b² = 11/36: evaluate the s-form G = s²+(2a²+2a−1)s+(a²+a)²+2a² at s = 11/36 */
  {
    const aa = Q.R(1n, 6n), s = Q.R(11n, 36n);
    const B = Q.sub(Q.add(Q.mul(Q.R(2n), Q.mul(aa, aa)), Q.mul(Q.R(2n), aa)), Q.R(1n));
    const Cc = Q.add(Q.mul(Q.add(Q.mul(aa, aa), aa), Q.add(Q.mul(aa, aa), aa)), Q.mul(Q.R(2n), Q.mul(aa, aa)));
    const g = Q.add(Q.add(Q.mul(s, s), Q.mul(B, s)), Cc);
    say(Q.isZero(g), 'G(1/6, sqrt(11)/6) = 0 exactly   [2605.06743\'s own curve point]');
    void spot;
  }
}

/* ================= interval / Krawczyk layer ================= */
/* rational -> outward double interval: Number(BigInt) and double division are
   correctly rounded (≤ 1/2 ulp each), so two outward steps enclose. */
function ratToIv(r) {
  const v = Number(r.n) / Number(r.d);
  if (!Number.isFinite(v)) throw new Error('ratToIv: height too large');
  return [nextDown(nextDown(v)), nextUp(nextUp(v))];
}
const ratToF = r => Number(r.n) / Number(r.d);

/* complex float helpers (root finding only — never load-bearing) */
const C = (re, im) => ({ re, im });
const cAddF = (u, v) => C(u.re + v.re, u.im + v.im);
const cSubF = (u, v) => C(u.re - v.re, u.im - v.im);
const cMulF = (u, v) => C(u.re * v.re - u.im * v.im, u.re * v.im + u.im * v.re);
function cDivF(u, v) { const den = v.re * v.re + v.im * v.im; return C((u.re * v.re + u.im * v.im) / den, (u.im * v.re - u.re * v.im) / den); }
const cAbsF = u => Math.hypot(u.re, u.im);
function polyEvalF(coef, z) { let acc = C(0, 0); for (const c of coef) acc = cAddF(cMulF(acc, z), C(c, 0)); return acc; }
function durandKerner(coef) {
  const n = coef.length - 1, mon = coef.map(c => c / coef[0]);
  let r = [];
  for (let i = 0; i < n; i++) { const th = 2 * Math.PI * i / n + 0.7; r.push(C(0.4 * Math.cos(th) + 0.3, 0.9 * Math.sin(th) + 0.05)); }
  for (let it = 0; it < 400; it++) {
    let moved = 0;
    for (let i = 0; i < n; i++) {
      let d = C(1, 0);
      for (let j = 0; j < n; j++) if (j !== i) d = cMulF(d, cSubF(r[i], r[j]));
      const step = cDivF(polyEvalF(mon, r[i]), d);
      r[i] = cSubF(r[i], step); moved = Math.max(moved, cAbsF(step));
    }
    if (moved < 1e-15) break;
  }
  return r;
}
/* Newton polish so Krawczyk starts from a sharp candidate */
function newtonPolish(coef, dcoef, z) {
  for (let k = 0; k < 5; k++) {
    const d = polyEvalF(dcoef, z);
    if (cAbsF(d) === 0) break;
    z = cSubF(z, cDivF(polyEvalF(coef, z), d));
  }
  return z;
}

/* complex interval ops on {re, im} pairs of intervals */
const cI = (re, im) => ({ re, im });
const cAddI = (u, v) => cI(IV.add(u.re, v.re), IV.add(u.im, v.im));
const cMulI = (u, v) => cI(IV.sub(IV.mul(u.re, v.re), IV.mul(u.im, v.im)),
                           IV.add(IV.mul(u.re, v.im), IV.mul(u.im, v.re)));
function cHorner(coefIv, X) { /* real interval coefficients, complex box X = cI */
  let acc = cI(iv(0), iv(0));
  for (const c of coefIv) acc = cAddI(cMulI(acc, X), cI(c, iv(0)));
  return acc;
}
/* certify one root of the exact real-coefficient polynomial via 2-D Krawczyk */
function certifyRoot(coefIv, dcoefIv, coefF, dcoefF, z0, opts) {
  const F = X => { const p = cHorner(coefIv, cI(X[0], X[1])); return [p.re, p.im]; };
  const DF = X => { const dp = cHorner(dcoefIv, cI(X[0], X[1])); return [[dp.re, IV.neg(dp.im)], [dp.im, dp.re]]; };
  const d0 = polyEvalF(dcoefF, z0);
  const det = d0.re * d0.re + d0.im * d0.im;
  if (det === 0) return { ok: false, why: 'derivative vanished at candidate' };
  const A = [[d0.re / det, d0.im / det], [-d0.im / det, d0.re / det]]; /* inverse of [[re,-im],[im,re]] */
  return krawczyk(F, DF, [z0.re, z0.im], A, opts || { radCap: 1e-2 });
}
const boxesDisjoint = (p, q) => p.box[0][1] < q.box[0][0] || q.box[0][1] < p.box[0][0] ||
                                p.box[1][1] < q.box[1][0] || q.box[1][1] < p.box[1][0];
/* interval G(a, b) — even in b, so a ±b box works via sqr */
function Giv(xb, yb, flipG) {
  const q = IV.add(IV.add(IV.sqr(yb), IV.sqr(xb)), xb);
  const core = IV.add(IV.sqr(q), IV.mul(iv(2), IV.sqr(xb)));
  return flipG ? IV.add(core, IV.sqr(yb)) : IV.sub(core, IV.sqr(yb));
}

/* exact quartic coefficients for parameters (each an eqcert rational) */
function quarticRat(al, be, ga, de) {
  const xs = [al, be, ga, de];
  const one = Q.R(1n);
  let e1 = Q.R(0n), e2 = Q.R(0n), e3 = Q.R(0n), e4 = Q.R(1n), Pt = Q.R(1n);
  for (const x of xs) Pt = Q.mul(Pt, Q.sub(one, x));
  e1 = xs.reduce((s, x) => Q.add(s, x), Q.R(0n));
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) e2 = Q.add(e2, Q.mul(xs[i], xs[j]));
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) for (let k = j + 1; k < 4; k++) e3 = Q.add(e3, Q.mul(Q.mul(xs[i], xs[j]), xs[k]));
  e4 = xs.reduce((s, x) => Q.mul(s, x), Q.R(1n));
  return [Q.R(1n), Q.neg(e1), e2, Q.neg(e3), Q.sub(e4, Pt)];
}
function derivRat(coef) { /* degree = coef.length−1, high→low */
  const n = coef.length - 1, out = [];
  for (let k = 0; k < n; k++) out.push(Q.mul(coef[k], Q.R(BigInt(n - k))));
  return out;
}

/* ================= [6] certified necessity sweep ================= */
console.log('\n[6] Certified sweep: all eigenvalues of ~270 exact 4-cycle matrices enclosed (Krawczyk),');
console.log('    every certified-nonreal one checked against (1) 0<=a<=1, (2) a+|b|<=1, (3) G>=0:');
{
  const tuples = [];
  const g3 = [Q.R(1n, 8n), Q.R(1n, 2n), Q.R(7n, 8n)];
  for (const a of g3) for (const b of g3) for (const c of g3) for (const d of g3) {
    if (Q.cmp(a, b) === 0 && Q.cmp(b, c) === 0 && Q.cmp(c, d) === 0) continue; /* exact diagonal: handled EXACTLY in [5] (a+b=1 tie) */
    tuples.push([a, b, c, d]);
  }
  let st = 987654321;
  const lcg = () => { st = (1103515245 * st + 12345) % 2147483648; return st; };
  for (let k = 0; k < 150; k++) {
    const t = [];
    for (let j = 0; j < 4; j++) t.push(Q.R(BigInt(lcg() % 9967 + 20), 10007n));
    tuples.push(t);
  }
  for (let i = 1; i <= 9; i++) for (const eps of [Q.R(1n, 100n), Q.R(1n, 1000n), Q.R(1n, 10000n)])
    tuples.push([Q.R(BigInt(i), 10n), eps, eps, eps]);              /* near-A_L */
  for (const c of [Q.R(1n, 4n), Q.R(1n, 2n), Q.R(3n, 4n)]) {        /* near-diagonal */
    const e = Q.R(1n, 1000n);
    tuples.push([Q.add(c, e), Q.sub(c, e), Q.add(c, Q.mul(e, Q.R(2n))), Q.sub(c, Q.mul(e, Q.R(2n)))]);
  }
  const lo = Q.R(1n, 1000n), hi = Q.R(999n, 1000n);                 /* near-corner */
  for (const a of [lo, hi]) for (const b of [lo, hi]) for (const c of [lo, hi]) for (const d of [lo, hi]) {
    if (Q.cmp(a, b) === 0 && Q.cmp(b, c) === 0 && Q.cmp(c, d) === 0) continue;
    tuples.push([a, b, c, d]);
  }

  let nCert = 0, nNonreal = 0, nPossiblyReal = 0, certFail = 0, disjointFail = 0;
  let undecided = 0, violations = 0;
  let minA = Infinity, minSlack = Infinity, minG = Infinity;
  const t6 = Date.now();
  for (const [al, be, ga, de] of tuples) {
    const coefRat = quarticRat(al, be, ga, de), dcoefRat = derivRat(coefRat);
    const coefIv = coefRat.map(ratToIv), dcoefIv = dcoefRat.map(ratToIv);
    const coefF = coefRat.map(ratToF), dcoefF = dcoefRat.map(ratToF);
    const approx = durandKerner(coefF).map(z => newtonPolish(coefF, dcoefF, z));
    const certified = [];
    for (const z of approx) {
      const kr = certifyRoot(coefIv, dcoefIv, coefF, dcoefF, z);
      if (kr.ok) certified.push(kr); else certFail++;
    }
    nCert += certified.length;
    let disjoint = certified.length === 4;
    for (let i = 0; i < certified.length && disjoint; i++)
      for (let j = i + 1; j < certified.length; j++)
        if (!boxesDisjoint(certified[i], certified[j])) { disjoint = false; break; }
    if (!disjoint) disjointFail++;
    for (const kr of certified) {
      const xb = kr.box[0], yb = kr.box[1];
      if (yb[0] <= 0 && yb[1] >= 0) { nPossiblyReal++; continue; }   /* real (or undecidably close) — necessity is about nonreal λ */
      nNonreal++;
      const bb = IV.abs(yb);
      /* (1) 0 <= a <= 1 */
      if (xb[1] < 0 || xb[0] > 1) { violations++; console.log(`  CERTIFIED VIOLATION of 0<=a<=1 at params ${[al, be, ga, de].map(Q.toString)}`); }
      else if (!(xb[0] >= 0 && xb[1] <= 1)) undecided++;
      minA = Math.min(minA, xb[0]);
      /* (2) a + |b| <= 1 */
      const sAB = IV.add(xb, bb);
      if (sAB[0] > 1) { violations++; console.log(`  CERTIFIED VIOLATION of a+|b|<=1 at params ${[al, be, ga, de].map(Q.toString)}`); }
      else if (!(sAB[1] <= 1)) undecided++;
      minSlack = Math.min(minSlack, 1 - sAB[1]);
      /* (3) G >= 0 */
      const g = Giv(xb, bb, false);
      if (g[1] < 0) { violations++; console.log(`  CERTIFIED VIOLATION of G>=0 at params ${[al, be, ga, de].map(Q.toString)}`); }
      else if (!(g[0] >= 0)) undecided++;
      minG = Math.min(minG, g[0]);
    }
  }
  say(certFail === 0, `all ${nCert} Krawczyk certifications succeeded (${tuples.length} matrices x 4 roots)`);
  say(disjointFail === 0, 'every matrix: 4 pairwise-disjoint certified boxes — every eigenvalue is accounted for');
  say(violations === 0, `zero certified violations (a violation here would REFUTE the theorem)`);
  say(undecided === 0, `zero undecided condition checks (${nNonreal} certified-nonreal eigenvalues, ${nPossiblyReal} real)`);
  say(minG > 0 && minG < 1e-3, `min certified G lower bound = ${minG.toExponential(3)} (near-A_L eps=1e-4 probes the boundary; still strictly positive)`);
  console.log(`  min certified a = ${minA.toExponential(3)}, min certified 1-(a+|b|) = ${minSlack.toExponential(3)}  (${Date.now() - t6} ms)`);
}

/* ================= [7] A_L traces G = 0 ================= */
console.log('\n[7] Certified: A_L(alpha) nonreal eigenvalues sit on G = 0 (shadow of the exact result [5]):');
{
  let all = true, maxW = 0;
  const alphas = [Q.R(0n), Q.R(1n, 8n), Q.R(1n, 4n), Q.R(3n, 8n), Q.R(1n, 2n), Q.R(5n, 8n), Q.R(3n, 4n), Q.R(7n, 8n), Q.R(19n, 20n)];
  const trace = [];
  for (const al of alphas) {
    /* cubic factor l³ + (1−α)(l²+l+1) — the paper's p_L/(λ−1), see [5] */
    const c = Q.sub(Q.R(1n), al);
    const coefRat = [Q.R(1n), c, c, c], dcoefRat = derivRat(coefRat);
    const coefIv = coefRat.map(ratToIv), dcoefIv = dcoefRat.map(ratToIv);
    const coefF = coefRat.map(ratToF), dcoefF = dcoefRat.map(ratToF);
    const approx = durandKerner(coefF).map(z => newtonPolish(coefF, dcoefF, z));
    const up = approx.filter(z => z.im > 1e-6);
    if (up.length !== 1) { all = false; continue; }
    const kr = certifyRoot(coefIv, dcoefIv, coefF, dcoefF, up[0]);
    if (!kr.ok) { all = false; continue; }
    const g = Giv(kr.box[0], IV.abs(kr.box[1]), false);
    if (!(g[0] <= 0 && g[1] >= 0 && IV.width(g) < 1e-9)) all = false;
    maxW = Math.max(maxW, IV.width(g));
    trace.push(`a=${((kr.box[0][0] + kr.box[0][1]) / 2).toFixed(4)} b=${((kr.box[1][0] + kr.box[1][1]) / 2).toFixed(4)}`);
  }
  say(all, `9 alphas in [0,1): certified nonreal root has interval G straddling 0, max width ${maxW.toExponential(2)}`);
  console.log(`  trace i -> 0:  ${trace.join('  ')}`);
}

/* ================= [8] certified attainment witnesses ================= */
console.log('\n[8] Certified converse witnesses: interior targets lambda = a+ib attained EXACTLY');
console.log('    by A(1-t,1-t,1-t,1-s) with Krawczyk-certified (t,s) in (0,1)²  [via identity [1]]:');
{
  const targets = [
    [Q.R(1n, 2n), Q.R(1n, 4n)], [Q.R(1n, 4n), Q.R(1n, 2n)], [Q.R(3n, 4n), Q.R(1n, 8n)],
    [Q.R(2n, 5n), Q.R(2n, 5n)], [Q.R(3n, 5n), Q.R(3n, 10n)], [Q.R(1n, 5n), Q.R(7n, 10n)],
    [Q.R(9n, 10n), Q.R(1n, 20n)], [Q.R(3n, 10n), Q.R(3n, 5n)], [Q.R(7n, 10n), Q.R(1n, 5n)],
    [Q.R(1n, 2n), Q.R(3n, 8n)]];
  let okAll = true, memAll = true;
  for (const [aR, bR] of targets) {
    /* exact interior membership: b>0, a>=0, a+b<1, G>0 (s-form, exact) */
    const s = Q.mul(bR, bR);
    const B = Q.sub(Q.add(Q.mul(Q.R(2n), Q.mul(aR, aR)), Q.mul(Q.R(2n), aR)), Q.R(1n));
    const Cc = Q.add(Q.mul(Q.add(Q.mul(aR, aR), aR), Q.add(Q.mul(aR, aR), aR)), Q.mul(Q.R(2n), Q.mul(aR, aR)));
    const gEx = Q.add(Q.add(Q.mul(s, s), Q.mul(B, s)), Cc);
    const member = Q.sign(bR) > 0 && Q.sign(aR) >= 0 && Q.cmp(Q.add(aR, bR), Q.R(1n)) < 0 && Q.sign(gEx) > 0;
    if (!member) memAll = false;
    /* float multi-start Newton on F(t,s) = ((z+t)³(z+s) − t³s) with z = λ−1 */
    const zF = C(ratToF(aR) - 1, ratToF(bR));
    const Ff = (t, u) => {
      const zt = cAddF(zF, C(t, 0)), zu = cAddF(zF, C(u, 0));
      const phi = cMulF(cMulF(cMulF(zt, zt), zt), zu);
      return [phi.re - t * t * t * u, phi.im];
    };
    const Jf = (t, u) => {
      const zt = cAddF(zF, C(t, 0)), zu = cAddF(zF, C(u, 0));
      const zt2 = cMulF(zt, zt), zt3 = cMulF(zt2, zt);
      const d1 = cMulF(C(3, 0), cMulF(zt2, zu));
      return [[d1.re - 3 * t * t * u, zt3.re - t * t * t], [d1.im, zt3.im]];
    };
    let sol = null;
    outer:
    for (let ti = 1; ti <= 9; ti++) for (let ui = 1; ui <= 9; ui++) {
      let t = ti / 10, u = ui / 10;
      for (let it = 0; it < 80; it++) {
        const f = Ff(t, u), J = Jf(t, u);
        const det = J[0][0] * J[1][1] - J[0][1] * J[1][0];
        if (!isFinite(det) || Math.abs(det) < 1e-18) break;
        const dt = (J[1][1] * f[0] - J[0][1] * f[1]) / det, du = (-J[1][0] * f[0] + J[0][0] * f[1]) / det;
        t -= dt; u -= du;
        if (!isFinite(t) || !isFinite(u)) break;
        if (Math.hypot(dt, du) < 1e-14) {
          const g = Ff(t, u);
          if (Math.hypot(g[0], g[1]) < 1e-11 && t > 1e-4 && t < 1 - 1e-4 && u > 1e-4 && u < 1 - 1e-4) { sol = { t, u }; break outer; }
          break;
        }
      }
    }
    if (!sol) { okAll = false; console.log(`  no float witness for target (${Q.toString(aR)}, ${Q.toString(bR)})`); continue; }
    /* Krawczyk certification of the witness with exact-rational z */
    const zRe = ratToIv(Q.sub(aR, Q.R(1n))), zIm = ratToIv(bR);
    const Fi = X => {
      const zt = cI(IV.add(zRe, X[0]), zIm), zu = cI(IV.add(zRe, X[1]), zIm);
      const phi = cMulI(cMulI(cMulI(zt, zt), zt), zu);
      return [IV.sub(phi.re, IV.mul(IV.pow(X[0], 3), X[1])), phi.im];
    };
    const DFi = X => {
      const zt = cI(IV.add(zRe, X[0]), zIm), zu = cI(IV.add(zRe, X[1]), zIm);
      const zt2 = cMulI(zt, zt), zt3 = cMulI(zt2, zt);
      const d1 = cMulI(cI(iv(3), iv(0)), cMulI(zt2, zu));
      return [[IV.sub(d1.re, IV.mul(iv(3), IV.mul(IV.sqr(X[0]), X[1]))), IV.sub(zt3.re, IV.pow(X[0], 3))],
              [d1.im, zt3.im]];
    };
    const J0 = Jf(sol.t, sol.u);
    const det0 = J0[0][0] * J0[1][1] - J0[0][1] * J0[1][0];
    const A0 = [[J0[1][1] / det0, -J0[0][1] / det0], [-J0[1][0] / det0, J0[0][0] / det0]];
    const kr = krawczyk(Fi, DFi, [sol.t, sol.u], A0, { radCap: 1e-2 });
    const inOpen = kr.ok && kr.box[0][0] > 0 && kr.box[0][1] < 1 && kr.box[1][0] > 0 && kr.box[1][1] < 1;
    if (!inOpen) okAll = false;
    console.log(`  target (${Q.toString(aR)}, ${Q.toString(bR)}): ${inOpen ? 'certified' : 'FAILED'} t in [${kr.ok ? kr.box[0][0].toFixed(8) + ', ' + kr.box[0][1].toFixed(8) : '—'}], s in [${kr.ok ? kr.box[1][0].toFixed(8) + ', ' + kr.box[1][1].toFixed(8) : '—'}]`);
  }
  say(memAll, 'all 10 targets are exact-rational interior points (b>0, a>=0, a+b<1, G>0 — checked in exact arithmetic)');
  say(okAll, 'all 10 targets: Krawczyk-certified real (t,s) in (0,1)² with (z+t)³(z+s) = t³s  => lambda is EXACTLY an eigenvalue');
}

/* ================= [9] mutation controls ================= */
console.log('\n[9] Mutation controls (each MUST be rejected):');
{
  /* M1: wrong matrix — bottom-left entry δ instead of 1−δ */
  say(!charPolyIdentity(true), 'M1 (matrix entry 1-d -> d): characteristic-polynomial identity REJECTED');

  /* M2: sign flip in G — exact factorization breaks AND the A_L numeric check breaks */
  const a = pvar(0), b = pvar(1), one = pconst(1n);
  const r2 = padd(ppow(a, 2), ppow(b, 2));
  const lm1 = padd(ppow(psub(a, one), 2), ppow(b, 2));
  const exactBroken = !pEq(psub(ppow(r2, 3), Npoly()), pmul(lm1, Gpoly(true)));
  /* numeric: certified A_L(1/2) root, flipped G must NOT contain 0 */
  const c = Q.R(1n, 2n);
  const coefRat = [Q.R(1n), c, c, c], dcoefRat = derivRat(coefRat);
  const coefF = coefRat.map(ratToF), dcoefF = dcoefRat.map(ratToF);
  const up = durandKerner(coefF).map(z => newtonPolish(coefF, dcoefF, z)).filter(z => z.im > 1e-6)[0];
  const kr = certifyRoot(coefRat.map(ratToIv), dcoefRat.map(ratToIv), coefF, dcoefF, up);
  const gFlip = Giv(kr.box[0], IV.abs(kr.box[1]), true);
  say(exactBroken && kr.ok && gFlip[0] > 0,
    `M2 (G sign flip, -b² -> +b²): factorization identity REJECTED and flipped G on A_L root = [${gFlip[0].toFixed(6)}, ${gFlip[1].toFixed(6)}] no longer straddles 0`);

  /* M3: strengthened claim "a + b_+ < 1 STRICTLY for every nonreal eigenvalue".
     The diagonal family's nonreal eigenvalue c + (1−c)i gives a + b_+ − 1 = 0
     EXACTLY (see [5]) — the exact layer detects the tie and kills the strict claim.
     No interval could ever decide this; this is rational.js's reason to exist. */
  const cD = Q.R(1n, 3n);
  const tieSign = Q.sign(Q.sub(Q.add(cD, Q.sub(Q.R(1n), cD)), Q.R(1n)));
  say(tieSign === 0, 'M3 (claim a+b_+ < 1 strict): REJECTED — diagonal family gives a+b_+ = 1 exactly (tie, sign = 0)');

  /* M4: fake eigenvalue — shift the certified A_L(1/2) root by −1e−3 in b.
     The necessity checker must certify G < 0 there (sup < 0): numeric teeth. */
  const yShift = IV.sub(IV.abs(kr.box[1]), iv(1e-3));
  const gFake = Giv(kr.box[0], yShift, false);
  say(gFake[1] < 0, `M4 (fake eigenvalue, b -= 1e-3 off the C_L curve): certified G <= ${gFake[1].toExponential(3)} < 0 — REJECTED`);

  /* M5: Krawczyk must refuse a box with no root in reach */
  const krBad = certifyRoot(coefRat.map(ratToIv), dcoefRat.map(ratToIv), coefF, dcoefF,
    C(up.re + 0.05, up.im + 0.05), { radCap: 0.02 });
  say(!krBad.ok, 'M5 (candidate 0.07 away from any root, radius cap 0.02): Krawczyk REFUSES to certify');
}

/* ================= verdict ================= */
console.log(`\n${checks} checks, ${failures} failures. Total wall time: ${Date.now() - t0wall} ms`);
if (failures === 0) {
  console.log('VERDICT: machine-checkable fragment CONFIRMED — every load-bearing polynomial');
  console.log('identity of the proof holds exactly; both boundary families are re-proved exactly;');
  console.log('certified eigenvalue enclosures find zero counterexamples to necessity and');
  console.log('certify attainment at 10 interior points. The analytic superstructure (the');
  console.log('universal necessity argument) is prose and was NOT audited — see VERDICT.md.');
  process.exit(0);
} else {
  console.log('VERDICT: NOT CONFIRMED — see failures above.');
  process.exit(1);
}
