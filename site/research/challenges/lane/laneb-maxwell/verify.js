#!/usr/bin/env node
/* verify.js — independent certified re-verification (Lane B, claim 6) of the
   counterexample instance in arXiv:2607.27197v1, P. Arathoon, G. Ball,
   M. D. Kvalheim, "The Maxwell Conjecture is False" (29 Jul 2026), at the
   CONCRETE parameter eps = 1/6 — the value the paper's own Figure 1 uses as
   numerical evidence. Source of every datum: src/arxiv_2607.27197.html.txt
   (sha256 760f78bdb828aa6d955ae8af97260ff13b646cbf32155768828d4ab8ae8b0570).

   CLAIM CERTIFIED. The electrostatic potential
       V(x) = sum_{i=1..5} q_i / |x - a_i|
   of the paper's Section 2 configuration
       a1 = (1,0,0), a2 = (-1/2, sqrt3/2, 0), a3 = (-1/2, -sqrt3/2, 0)   (q=1)
       a4 = (0,0,eps), a5 = (0,0,-eps)   with  q_eps = (3/4)eps^3 - (5/32)eps^5
   (paper §2 first display, second display, eq. (1)), at the FIXED RATIONAL
   eps = 1/6 (so q_eps = 859/248832 exactly), has AT LEAST 24 nondegenerate
   critical points: 24 pairwise-disjoint boxes, each carrying
     (a) a Krawczyk certificate (core/interval/radii.js) of existence AND local
         uniqueness of a zero of grad V in the box, and
     (b) an interval enclosure of det Hess V over the whole box excluding 0
         (nondegeneracy of that zero).
   Since 24 > 16 = (5-1)^2, Maxwell's conjectured bound fails at this explicit
   configuration. The paper's own verification is floating-point computer
   algebra (Mathematica/Maple, per its disclosure section); no concrete eps and
   no code ship with it. This script is a certificate at one pinned eps, in our
   own arithmetic, importing ONLY the eqcert stack of this monorepo.

   ARITHMETIC. core/interval/interval.js (outward-rounded double intervals),
   core/interval/transcendental.js (sound interval exp/log), core/interval/rational.js
   (exact BigInt rationals). The only non-rational operation is
   sqrt(X) = exp(log(X)/2), composed from the two sound eqcert enclosures and
   containment-tested in-code against exact rational squaring (section [1]).
   sqrt(3) enters as a 1-ulp interval PROVED to contain sqrt3 by exact rational
   squaring of its endpoints; eps and q_eps enter as intervals proved to contain
   the exact rationals via rational.js inClosed.

   CANDIDATES carry no evidentiary weight: they are float Newton polishes of
   seeds read off the paper's Lemma 2 (the 21 rescaled points, physical
   x = eps^2 X) plus the three persisting edge equilibria (paper §1/Figure 1a),
   closed under the exact D3 x Z2 symmetry of the configuration. Everything
   asserted rests on (a) and (b) alone. Float exploration: src/sweep.js.

   STRUCTURAL CROSS-CHECKS against the paper (not needed for the count, but
   they tie our 24 boxes to the paper's own description):
     - trace Hess V = 0 exactly (harmonicity) => every trace interval must
       contain 0 — real teeth against a wrong power of the distance;
     - det-sign / Morse-index pattern per orbit shell vs Lemma 2 signatures and
       Remark 2 (m1 = 10 index-1 + m2 = 14 index-2), indices certified via
       Sylvester leading-minor sign intervals;
     - the theta = pi ray carries exactly the 3 planar equilibria of Fig. 1(d).

   MUTATION CONTROLS (each must be REJECTED; all three are breaks of the
   mathematics, not the harness — they go through the identical claim gate):
     M1  q_eps -> (3/4)eps^3 + (5/32)eps^5 (sign of the eps^5 term flipped):
         the H2 coefficient of the paper's rescaled limit flips sign and the
         bifurcated family reorganizes — the certified points are simply not
         there any more.
     M2  one candidate replaced by a duplicate of another: 24 Krawczyk boxes
         still certify but they are not 24 DISTINCT points — the disjointness
         logic, on which the count rests, must refuse.
     M3  q_eps -> (3/4)eps^3 (the eps^5 term dropped): Hess V(0) becomes the
         EXACT zero matrix (the eps^5 term is precisely what makes the origin
         nondegenerate) — the origin box must refuse.

   NOT CHECKED (listed also in VERDICT.md): the paper's Theorem 1 as stated
   (existence of eps0 and the full range 0 < eps < eps0 — we certify eps = 1/6
   only), Lemma 1/Lemma 2 as theorems, the Morse-theoretic Remark 2, the
   perturbation/transversality step, Proposition 1 (the 3+2m iteration), and
   that 24 is exhaustive (we certify AT LEAST 24; the claim needs no more).

   Runtime target: seconds. Node >= 16. Usage: node verify.js */
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
const EQ = p => require(path.join(EQSRC, p));
const I = EQ('interval.js');
const T = EQ('transcendental.js');
const Q = EQ('rational.js');
const { krawczyk } = EQ('radii.js');
const { iv, add, sub, mul, div, neg, sqr, contains, nextUp, nextDown } = I;

let checks = 0, failures = 0;
function say(ok, msg) {
  checks++;
  if (!ok) failures++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${msg}`);
  return ok;
}

/* ================= [1] exact data layer + sqrt self-test ================= */
console.log('[1] Exact configuration data (paper §2 + eq. (1)) and sqrt soundness');

const EPS = Q.R(1n, 6n);                       /* the pinned rational epsilon */
const qpow = (a, n) => { let r = Q.ONE; for (let i = 0; i < n; i++) r = Q.mul(r, a); return r; };
const QEPS = Q.sub(Q.mul(Q.R(3n, 4n), qpow(EPS, 3)), Q.mul(Q.R(5n, 32n), qpow(EPS, 5)));
say(Q.cmp(QEPS, Q.R(859n, 248832n)) === 0,
  `q_eps = (3/4)(1/6)^3 - (5/32)(1/6)^5 = ${Q.toString(QEPS)} (paper eq. (1) at eps = 1/6)`);
say(Q.sign(QEPS) > 0, 'q_eps > 0 — all five charges positive (hypothesis of the construction)');
say(24 > (5 - 1) * (5 - 1) && (5 - 1) * (5 - 1) === 16,
  '24 > (n-1)^2 = 16 at n = 5 — the arithmetic of the refutation (exact integers)');

/* rational -> proved enclosing interval */
function ivFromQ(r) {
  let v = Q.toDouble(r), lo = nextDown(v), hi = nextUp(v);
  for (let k = 0; k < 4 && !Q.inClosed(r, lo, hi); k++) { lo = nextDown(lo); hi = nextUp(hi); }
  if (!Q.inClosed(r, lo, hi)) throw new Error('ivFromQ: containment not established');
  return [lo, hi];
}
const EPSIV = ivFromQ(EPS), QIV = ivFromQ(QEPS);
say(Q.inClosed(EPS, EPSIV[0], EPSIV[1]) && Q.inClosed(QEPS, QIV[0], QIV[1]),
  `eps and q_eps enclosed in proved intervals of width ${(QIV[1] - QIV[0]).toExponential(2)}`);

/* sqrt(3) as a proved 1-ulp interval: endpoint squares straddle 3 exactly */
const s3f = Math.sqrt(3);
const SQRT3 = [nextDown(s3f), nextUp(s3f)];
{
  const lo2 = Q.mul(Q.fromDouble(SQRT3[0]), Q.fromDouble(SQRT3[0]));
  const hi2 = Q.mul(Q.fromDouble(SQRT3[1]), Q.fromDouble(SQRT3[1]));
  say(Q.cmp(lo2, Q.R(3n)) < 0 && Q.cmp(hi2, Q.R(3n)) > 0,
    'sqrt(3) enclosure proved by exact rational squaring: lo^2 < 3 < hi^2');
}

/* sound interval sqrt from eqcert primitives: sqrt(X) = exp(log(X)/2) */
function sqrtIv(X) {
  if (!(X[0] > 0)) throw new Error('sqrtIv: needs a strictly positive interval');
  return T.exp(mul(iv(0.5), T.log(X)));
}
{ /* containment self-test against exact rational squaring */
  const samples = [Q.R(2n), Q.R(3n), Q.R(1n, 2n), Q.R(5n, 7n), Q.R(1n, 36n), QEPS, Q.R(10007n, 10009n)];
  let ok = true;
  for (const r of samples) {
    const s = sqrtIv(ivFromQ(r));
    const lo2 = Q.mul(Q.fromDouble(s[0]), Q.fromDouble(s[0]));
    const hi2 = Q.mul(Q.fromDouble(s[1]), Q.fromDouble(s[1]));
    if (!(Q.cmp(lo2, r) <= 0 && Q.cmp(r, hi2) <= 0)) ok = false;
  }
  say(ok, `sqrtIv = exp(log/2) containment verified on ${samples.length} rationals by exact squaring`);
}

/* ---------------- the configuration, interval and float ---------------- */
const HALF_S3 = div(SQRT3, iv(2));
function makeCfg(qRat) {
  const qI = ivFromQ(qRat), qF = Q.toDouble(qRat), eF = Q.toDouble(EPS);
  return {
    posIv: [
      [iv(1), iv(0), iv(0)],
      [iv(-0.5), HALF_S3, iv(0)],
      [iv(-0.5), neg(HALF_S3), iv(0)],
      [iv(0), iv(0), EPSIV],
      [iv(0), iv(0), neg(EPSIV)],
    ],
    qIv: [iv(1), iv(1), iv(1), qI, qI],
    posF: [[1, 0, 0], [-0.5, s3f / 2, 0], [-0.5, -s3f / 2, 0], [0, 0, eF], [0, 0, -eF]],
    qF: [1, 1, 1, qF, qF],
  };
}
const CFG = makeCfg(QEPS);

/* interval gradient and Hessian of V (paper §2: V = sum q_i/|x-a_i|) */
function gradIv(cfg, X) {
  const g = [iv(0), iv(0), iv(0)];
  for (let i = 0; i < 5; i++) {
    const v = [0, 1, 2].map(a => sub(X[a], cfg.posIv[i][a]));
    const d2 = add(add(sqr(v[0]), sqr(v[1])), sqr(v[2]));
    const d = sqrtIv(d2);
    const c = div(cfg.qIv[i], mul(d2, d));            /* q_i / d^3 */
    for (let a = 0; a < 3; a++) g[a] = sub(g[a], mul(c, v[a]));
  }
  return g;
}
function hessIv(cfg, X) {
  const H = [[iv(0), iv(0), iv(0)], [iv(0), iv(0), iv(0)], [iv(0), iv(0), iv(0)]];
  for (let i = 0; i < 5; i++) {
    const v = [0, 1, 2].map(a => sub(X[a], cfg.posIv[i][a]));
    const d2 = add(add(sqr(v[0]), sqr(v[1])), sqr(v[2]));
    const d = sqrtIv(d2);
    const w = div(cfg.qIv[i], mul(mul(d2, d2), d));   /* q_i / d^5 */
    for (let a = 0; a < 3; a++) for (let b = a; b < 3; b++) {
      const t = a === b ? sub(mul(iv(3), sqr(v[a])), d2) : mul(iv(3), mul(v[a], v[b]));
      const e = mul(w, t);
      H[a][b] = add(H[a][b], e);
      if (a !== b) H[b][a] = H[a][b];
    }
  }
  return H;
}
/* float twins (candidates + approximate inverse only — never evidence) */
function gradF(cfg, x) {
  const g = [0, 0, 0];
  for (let i = 0; i < 5; i++) {
    const v = [x[0] - cfg.posF[i][0], x[1] - cfg.posF[i][1], x[2] - cfg.posF[i][2]];
    const d2 = v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
    const c = cfg.qF[i] / (d2 * Math.sqrt(d2));
    for (let a = 0; a < 3; a++) g[a] -= c * v[a];
  }
  return g;
}
function hessF(cfg, x) {
  const H = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 5; i++) {
    const v = [x[0] - cfg.posF[i][0], x[1] - cfg.posF[i][1], x[2] - cfg.posF[i][2]];
    const d2 = v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
    const w = cfg.qF[i] / (d2 * d2 * Math.sqrt(d2));
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++)
      H[a][b] += w * (3 * v[a] * v[b] - (a === b ? d2 : 0));
  }
  return H;
}

const det3Iv = H => add(sub(
  mul(H[0][0], sub(mul(H[1][1], H[2][2]), mul(H[1][2], H[2][1]))),
  mul(H[0][1], sub(mul(H[1][0], H[2][2]), mul(H[1][2], H[2][0])))),
  mul(H[0][2], sub(mul(H[1][0], H[2][1]), mul(H[1][1], H[2][0]))));

/* float 3x3 helpers */
function inv3(H) {
  const c = [
    [H[1][1] * H[2][2] - H[1][2] * H[2][1], H[0][2] * H[2][1] - H[0][1] * H[2][2], H[0][1] * H[1][2] - H[0][2] * H[1][1]],
    [H[1][2] * H[2][0] - H[1][0] * H[2][2], H[0][0] * H[2][2] - H[0][2] * H[2][0], H[0][2] * H[1][0] - H[0][0] * H[1][2]],
    [H[1][0] * H[2][1] - H[1][1] * H[2][0], H[0][1] * H[2][0] - H[0][0] * H[2][1], H[0][0] * H[1][1] - H[0][1] * H[1][0]],
  ];
  const det = H[0][0] * c[0][0] + H[0][1] * c[1][0] + H[0][2] * c[2][0];
  if (!Number.isFinite(det) || det === 0) return null;
  return c.map(row => row.map(x => x / det));
}
function newton(cfg, x0) {
  let x = x0.slice();
  for (let it = 0; it < 200; it++) {
    const A = inv3(hessF(cfg, x));
    if (!A) return null;
    const g = gradF(cfg, x);
    const s = [0, 1, 2].map(a => -(A[a][0] * g[0] + A[a][1] * g[1] + A[a][2] * g[2]));
    x = [x[0] + s[0], x[1] + s[1], x[2] + s[2]];
    if (Math.hypot(...s) < 1e-13 * (1 + Math.hypot(...x))) break;
  }
  /* acceptance is by residual only — near a root Newton can bounce at ulp size */
  return Math.hypot(...gradF(cfg, x)) < 1e-10 ? x : null;
}

/* float self-test: gradF/hessF against central finite differences of V */
{
  const Vf = x => { let s = 0; for (let i = 0; i < 5; i++) s += CFG.qF[i] / Math.hypot(x[0] - CFG.posF[i][0], x[1] - CFG.posF[i][1], x[2] - CFG.posF[i][2]); return s; };
  const x = [0.31, 0.17, 0.23], h = 1e-6;
  const g = gradF(CFG, x), H = hessF(CFG, x);
  let worst = 0;
  for (let a = 0; a < 3; a++) {
    const xp = x.slice(), xm = x.slice(); xp[a] += h; xm[a] -= h;
    worst = Math.max(worst, Math.abs((Vf(xp) - Vf(xm)) / (2 * h) - g[a]));
    const gp = gradF(CFG, xp), gm = gradF(CFG, xm);
    for (let b = 0; b < 3; b++) worst = Math.max(worst, Math.abs((gp[b] - gm[b]) / (2 * h) - H[a][b]));
  }
  say(worst < 1e-6, `float grad/Hess agree with finite differences of V (worst dev ${worst.toExponential(1)})`);
}

/* ============ [2] candidates: Lemma 2 seeds + D3 x Z2 closure ============ */
console.log('\n[2] Candidates (float Newton from paper Lemma 2 seeds — no evidentiary weight)');

function candidates(cfg) {
  const e2 = 1 / 36;
  const rIn = (15 - Math.sqrt(205)) / 12, rOut = (15 + Math.sqrt(205)) / 12;
  const seeds = [                                      /* one per orbit */
    [0, 0, 0],                                         /* origin           */
    [0, 0, e2 * Math.sqrt(15) / 12],                   /* axial            */
    [e2 * rIn * 0.5, e2 * rIn * (s3f / 2), 0],         /* planar inner     */
    [-e2 * rOut, 0, 0],                                /* planar outer     */
    [e2 / 3, 0, e2 * Math.sqrt(39) / 12],              /* off-planar A     */
    [e2 / 6, 0, e2 * Math.sqrt(21) / 12],              /* off-planar B     */
    [-0.45, 0, 0],                                     /* edge equilibrium */
  ];
  const reps = seeds.map(s => newton(cfg, s));
  if (reps.some(r => r === null)) return null;
  /* exact-symmetry closure: rotations by 0/120/240 deg, y -> -y, z -> -z */
  const out = [];
  const c120 = -0.5, s120 = s3f / 2;
  for (const p of reps) for (const sy of [1, -1]) for (const sz of [1, -1]) for (const k of [0, 1, 2]) {
    let [x, y, z] = [p[0], sy * p[1], sz * p[2]];
    for (let j = 0; j < k; j++) [x, y] = [c120 * x - s120 * y, s120 * x + c120 * y];
    const q = newton(cfg, [x, y, z]);
    if (!q) continue;
    if (!out.some(u => Math.hypot(u[0] - q[0], u[1] - q[1], u[2] - q[2]) < 1e-7)) out.push(q);
  }
  out.sort((a, b) => Math.hypot(...a) - Math.hypot(...b));
  return out;
}
const CAND = candidates(CFG);
say(CAND !== null && CAND.length === 24, `24 distinct candidates found (got ${CAND ? CAND.length : 'seed failure'})`);
if (!CAND || CAND.length !== 24) { console.log('cannot continue'); process.exit(1); }

/* orbit shells by |x| (gaps between shells are > 1.4e-3; spread inside ~1e-12) */
function shellsOf(cand) {
  const sh = [];
  for (const p of cand) {
    const r = Math.hypot(...p);
    const s = sh.find(s0 => Math.abs(s0.r - r) < 5e-4);
    if (s) { s.pts.push(p); } else sh.push({ r, pts: [p] });
  }
  return sh;
}
const SHELLS = shellsOf(CAND);
const shellSizes = SHELLS.map(s => s.pts.length);
say(shellSizes.join(',') === '1,3,2,6,6,3,3',
  `orbit shells |x| = ${SHELLS.map(s => s.r.toExponential(2)).join(', ')} with sizes [${shellSizes}] ` +
  '(origin; 3 planar-in; 2 axial; 6+6 off-planar; 3 planar-out; 3 edge)');
{ /* Figure 1(d): exactly 3 of the 24 lie on the ray z=0, theta=pi (x<0) */
  const onRay = CAND.filter(p => p[0] < 0 && Math.abs(p[1]) < 1e-9 && Math.abs(p[2]) < 1e-9);
  say(onRay.length === 3, `theta=pi ray carries ${onRay.length} planar equilibria at x = ` +
    onRay.map(p => p[0].toExponential(3)).join(', ') + ' (paper Fig. 1d shows 3)');
}

/* ================= [3] Krawczyk + nondegeneracy certificates ================= */
console.log('\n[3] Certificates: Krawczyk existence+uniqueness box and interval Hessian per point');

function classifyIndex(H, det) {
  /* Morse index via Sylvester leading minors, decided in intervals.
     det > 0 => index 0 or 2: positive definite iff H00 > 0 and det2 > 0.
     det < 0 => index 1 or 3: negative definite iff H00 < 0 and det2 > 0. */
  const det2 = sub(mul(H[0][0], H[1][1]), mul(H[0][1], H[1][0]));
  const pos = X => X[0] > 0, negv = X => X[1] < 0;
  if (pos(det)) {
    if (pos(H[0][0]) && pos(det2)) return 0;
    if (negv(H[0][0]) || negv(det2)) return 2;
  } else if (negv(det)) {
    if (negv(H[0][0]) && pos(det2)) return 3;
    if (pos(H[0][0]) || negv(det2)) return 1;
  }
  return null; /* indecisive */
}

function certifyPoint(cfg, x0) {
  try {
    const A = inv3(hessF(cfg, x0));
    if (!A) return { ok: false, why: 'float Hessian singular — no approximate inverse' };
    const res = krawczyk(X => gradIv(cfg, X), X => hessIv(cfg, X), x0, A, { radCap: 1e-6 });
    if (!res.ok) return res;
    const H = hessIv(cfg, res.box);
    const det = det3Iv(H);
    const tr = add(add(H[0][0], H[1][1]), H[2][2]);
    return {
      ok: true, box: res.box, rounds: res.rounds,
      rad: Math.max(...res.box.map((b, i) => Math.max(b[1] - x0[i], x0[i] - b[0]))),
      det, detOk: !contains(det, 0), traceOk: contains(tr, 0),
      idx: classifyIndex(H, det),
    };
  } catch (e) {
    return { ok: false, why: 'interval refusal: ' + e.message };
  }
}

function disjoint(bA, bB) {
  for (let k = 0; k < 3; k++) if (bA[k][1] < bB[k][0] || bB[k][1] < bA[k][0]) return true;
  return false;
}

/* the single claim gate — the clean run and every mutation go through THIS */
function certifyAll(cfg, cand, quiet) {
  const results = cand.map(x0 => certifyPoint(cfg, x0));
  const okBoxes = results.filter(r => r.ok);
  let disjointOk = okBoxes.length === results.length;
  let minGap = Infinity;
  for (let i = 0; i < okBoxes.length && disjointOk; i++)
    for (let j = i + 1; j < okBoxes.length; j++) {
      if (!disjoint(okBoxes[i].box, okBoxes[j].box)) { disjointOk = false; break; }
      let g = -Infinity;
      for (let k = 0; k < 3; k++)
        g = Math.max(g, okBoxes[j].box[k][0] - okBoxes[i].box[k][1], okBoxes[i].box[k][0] - okBoxes[j].box[k][1]);
      minGap = Math.min(minGap, g);
    }
  const nOk = okBoxes.length;
  const nDet = results.filter(r => r.ok && r.detOk).length;
  const nTrace = results.filter(r => r.ok && r.traceOk).length;
  const holds = nOk === 24 && nDet === 24 && disjointOk && 24 > 16;
  if (!quiet) for (const [i, r] of results.entries()) {
    const x = cand[i];
    console.log(r.ok
      ? `    #${String(i + 1).padStart(2)}  x=(${x.map(v => v.toExponential(6)).join(', ')})  rad=${r.rad.toExponential(1)}  det=[${r.det[0].toExponential(2)},${r.det[1].toExponential(2)}]  ${r.detOk ? 'nondeg' : 'DEGENERATE?'}  idx=${r.idx === null ? '?' : r.idx}`
      : `    #${String(i + 1).padStart(2)}  x=(${x.map(v => v.toExponential(6)).join(', ')})  REFUSED: ${r.why}`);
  }
  return { results, nOk, nDet, nTrace, disjointOk, minGap, holds };
}

const CLEAN = certifyAll(CFG, CAND, false);
say(CLEAN.nOk === 24, `Krawczyk certifies existence + local uniqueness in all 24 boxes (got ${CLEAN.nOk})`);
say(CLEAN.nDet === 24, `interval det Hess excludes 0 on all 24 certified boxes (got ${CLEAN.nDet}) — nondegeneracy`);
say(CLEAN.nTrace === 24, `harmonicity witness: 0 in trace Hess interval on all 24 boxes (got ${CLEAN.nTrace})`);
say(CLEAN.disjointOk, `all ${24 * 23 / 2} box pairs disjoint; min coordinate gap ${CLEAN.minGap.toExponential(2)}`);
say(CLEAN.holds, 'CLAIM GATE: 24 disjoint certified nondegenerate critical points  =>  24 > 16 = (5-1)^2');

/* ============== [4] structure vs the paper's Lemma 2 / Remark 2 ============== */
console.log('\n[4] Structure against the paper (det signs and Morse indices per shell)');
{
  /* expected per shell, sorted by |x|:
     origin (++-) idx1 det<0 ; planar-inner (+--) idx2 det>0 ; axial (+--) idx2 ;
     off-B (1/6,rt21/12) (++-) idx1 ; off-A (1/3,rt39/12) (+--) idx2 ;
     planar-outer (++-) idx1 ; edge equilibria (Remark 2, index 2) det>0 */
  const wantIdx = [1, 2, 2, 1, 2, 1, 2];
  let allMatch = true, m = { 0: 0, 1: 0, 2: 0, 3: 0, null: 0 };
  SHELLS.forEach((s, si) => {
    for (const p of s.pts) {
      const r = CLEAN.results[CAND.indexOf(p)];
      if (!r.ok || r.idx !== wantIdx[si]) allMatch = false;
      m[r.ok ? r.idx : null]++;
    }
  });
  say(allMatch, `certified Morse index per shell = [${wantIdx}] — matches Lemma 2 signatures + Remark 2 edge index`);
  say(m[1] === 10 && m[2] === 14 && m[0] === 0 && m[3] === 0,
    `index totals {1: ${m[1]}, 2: ${m[2]}, 0: ${m[0]}, 3: ${m[3]}} — paper Remark 2: m1 = 10, m2 = 14; ` +
    'no index-0/3 (V is harmonic: no interior extrema)');
}

/* ===================== [5] mutation controls ===================== */
console.log('\n[5] Mutation controls (each MUST be rejected by the claim gate):');
{
  /* M1: flip the sign of the eps^5 term of eq. (1) */
  const q1 = Q.add(Q.mul(Q.R(3n, 4n), qpow(EPS, 3)), Q.mul(Q.R(5n, 32n), qpow(EPS, 5)));
  const r1 = certifyAll(makeCfg(q1), CAND, true);
  say(!r1.holds, `M1 (q_eps -> +eps^5 term) rejected: only ${r1.nOk}/24 boxes certify at the claimed points`);

  /* M2: duplicate one candidate — 24 boxes but not 24 distinct points */
  const dup = CAND.slice(); dup[7] = dup[5];
  const r2 = certifyAll(CFG, dup, true);
  say(!r2.holds && !r2.disjointOk,
    `M2 (candidate #8 replaced by a copy of #6) rejected: ${r2.nOk}/24 boxes certify but disjointness fails`);

  /* M3: drop the eps^5 term — Hess V(0) is exactly the zero matrix */
  const q3 = Q.mul(Q.R(3n, 4n), qpow(EPS, 3));
  const r3 = certifyAll(makeCfg(q3), CAND, true);
  const origin = r3.results[0];
  say(!r3.holds && !origin.ok,
    `M3 (q_eps -> (3/4)eps^3) rejected: origin box refuses (${origin.ok ? 'unexpected certify' : origin.why}); ${r3.nOk}/24 certify`);
}

/* ===================== verdict ===================== */
const secs = ((Date.now() - t0wall) / 1000).toFixed(1);
console.log(`\n${checks} checks, ${failures} failures. Wall time ${secs} s.`);
if (failures === 0) {
  console.log('VERDICT: CONFIRMED at eps = 1/6 — the paper\'s five-charge configuration, with');
  console.log('q_eps = 859/248832 exactly, has >= 24 pairwise-disjoint certified nondegenerate');
  console.log('critical points, exceeding Maxwell\'s conjectured bound (5-1)^2 = 16. Certified');
  console.log('at THIS epsilon only; the paper\'s asymptotic statement (all sufficiently small');
  console.log('eps) and its proofs are NOT audited here — see VERDICT.md.');
  process.exit(0);
} else {
  console.log('VERDICT: NOT CONFIRMED — see failures above.');
  process.exit(1);
}
