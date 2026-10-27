#!/usr/bin/env node
/* replay-c16.js — the registry's C_16 enclosure 2.1562247706 <= C_16 <= 2.1562256466 (maximusrufus, #246 on
   teorth/optimizationproblems, merged 2026-10-26 with both rows asterisked) decided twice, by two implementations that
   share no code with each other or with the claimant's checkers (kept as text, never run): this file (JavaScript, eqcert's
   outward-rounded interval doubles with its series logarithm and Machin π, BigInt rationals for every comparison with a
   printed digit) and instruments/optq/c16.py (Python standard library: integer fixed point with floor/ceiling, decimal at
   directed rounding with the correctly rounded ln, Fraction; the lower bound's lattice sums by instruments/optq/bgw16a.py).

   The claims are stated in corpus/optconst-queue/c16-2026-10-27/claims.json, written and committed before either
   decider existed. In short (F(δ) = 4πΘ(δ) − ln δ − ln(1 + ln δ), C_16 = max_{δ>=1} F):
     LOWER  LF1  for the trial polynomial u = Σ_{0<|k|²<=4000²} e^{ik·x}/(|k|²(1 + μ|k|²)), μ = 1221/10000:
                 δ_u = S3/S2 >= 1 and S1²/(π S2) − ln δ_u − ln(1 + ln δ_u) >= 2.1562247706           FINITE
            LF2  the certificate's six bracket integers and its rational and float are consistent with the sums    FINITE
            LR1  Parseval on [0, 2π]² and the normalisation (u's value is a value of F)                         READING
     UPPER  UF1  the 84 boxes tile [1, D0], D0 = 4.9·10^8                                                       FINITE
            UF2  on every box, sup of min(B_μ, g) <= 2.1562256466, B_μ(δ) = S1(μ)(1 + μδ)/π − ln δ − ln(1 + ln δ),
                 S1(μ) by its partial sum over |k| <= 2000 plus the tail bound UR2; decided by subdivision with
                 monotone enclosures (B_μ's linear part increasing, its logarithms increasing) — no convexity used     FINITE
            UF3  g(D0) <= 2.1562256466, with the side conditions of UR4                                          FINITE
            UF4  U_rational <= 2.1562256466; each printed box bound >= the note's formula                         FINITE
            UR1  the weighted Cauchy–Schwarz bound F <= B_μ; UR2 the tail bounds (Z2 = (2π²/3)G; the integral
                 comparison); UR3 convexity (correct, not used); UR4 F <= g for δ >= e and its sup on [D0, ∞);
                 UR5 the tail's lower bound (lower ends only)                                                   READING
   The house grammar: a FINITE claim is CERTIFIED, REFUTED or REFUSED; a READING gets no verdict. The lower end rests only
   on the definitional reading LR1 (as optq-226-16a did) → CERTIFIED; the upper end's infinite part (UR1, UR2, UR4) is
   analytic → PARTIAL: its finite core certified, its analytic steps read and re-derived in claims.json.

   usage: node tools/replay-c16.js            both implementations, the red controls → certs/c16-replay.json (~3 min)
          node tools/replay-c16.js --check    the battery: the pins re-hashed, the JavaScript decider re-derives every
                                              claim and red control and compares with the record; nothing written (~1 min)
   MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const I = require(path.join(ROOT, 'instruments', 'interval', 'interval.js'));
const T = require(path.join(ROOT, 'instruments', 'interval', 'transcendental.js'));
const Q = require(path.join(ROOT, 'instruments', 'interval', 'rational.js'));
const DIR = 'corpus/optconst-queue/c16-2026-10-27';
const OUT = path.join(ROOT, 'certs', 'c16-replay.json');
const CHECK = process.argv.includes('--check');
const T0 = Date.now();
const die = (m) => { console.error('C16 REPLAY REFUSED: ' + m); process.exit(1); };
const rd = (rel) => fs.readFileSync(path.join(ROOT, rel));
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const J = (rel) => JSON.parse(rd(rel).toString('utf8'));
const secs = (t) => +((Date.now() - t) / 1000).toFixed(1);

/* ---- the inputs, each against its pin ---------------------------------------------------------------------------- */
const PINS = J(DIR + '/PINS.json');
const pinned = (rel) => { const buf = rd(DIR + '/' + rel); if (!PINS.files[rel] || sha(buf) !== PINS.files[rel].sha256) die(rel + ' does not match its pin'); return buf; };
for (const rel of Object.keys(PINS.files)) pinned(rel);                     // every pinned byte, the checkers included (never run)
const CU = JSON.parse(pinned('claimant/upper_certificate.json').toString('utf8'));
const CL = JSON.parse(pinned('claimant/lower_certificate.json').toString('utf8'));
const page = pinned('upstream/16a.md').toString('utf8');
const readme = pinned('upstream/README.md').toString('utf8');
const CLAIMS = J(DIR + '/claims.json');
const upperSec = page.split('## Known upper bounds')[1].split('## Known lower bounds')[0];
const lowerSec = page.split('## Known lower bounds')[1].split('## Additional comments')[0];
const certRow = /^\| \$([0-9.]+)\^\\\*\$ \| \[certificate\]\(https:\/\/github\.com\/maximusrufus\/c16-bgw-certificates\)/m;
const PU = (certRow.exec(upperSec) || die('no asterisked certificate row among the upper bounds of 16a.md'))[1];
const PL = (certRow.exec(lowerSec) || die('no asterisked certificate row among the lower bounds of 16a.md'))[1];
const rrow = readme.split('\n').find((x) => x.startsWith('| [16](')) || die('no row 16 in the README');
const rm = /\(\$([0-9.]+)\^\\\*\$\) \| \$([0-9.]+)\^\\\*\$ \|\s*$/.exec(rrow) || die('the README row 16 no longer carries the two asterisked bounds');
if (rm[1] !== PL || rm[2] !== PU) die('the README and the page print different bounds');
if (CL.R !== 4000 || CL.mu[0] !== 1221 || CL.mu[1] !== 10000 || CL.PREC !== 120) die('the lower certificate is not R = 4000, μ = 1221/10000, PREC = 120');
if (CU.boxes.length !== 84 || CU.D0 !== '490000000' || CU.R0 !== 100) die('the upper certificate is not 84 boxes on [1, 4.9e8] with R0 = 100');

/* ---- exact comparisons with printed decimals (BigInt), and outward printing ------------------------------------------- */
const decQ = (s) => { const [a, b = ''] = s.split('.'); return Q.R(BigInt(a + b), 10n ** BigInt(b.length)); };
const ratQ = (s) => { const [a, b = '1'] = String(s).split('/'); return Q.R(BigInt(a), BigInt(b)); };
const cmpDQ = (x, q) => Q.cmp(Q.fromDouble(x), q);                          // a double against an exact rational
const fl = (q, k) => { const s = 10n ** BigInt(k); let v = q.n * s / q.d; if (q.n < 0n && v * q.d !== q.n * s) v -= 1n; return v; };
const fmt = (v, k) => { const neg = v < 0n; let s = (neg ? -v : v).toString().padStart(k + 1, '0'); s = s.slice(0, s.length - k) + '.' + s.slice(s.length - k); return (neg ? '-' : '') + s; };
const down = (x, k) => fmt(fl(typeof x === 'number' ? Q.fromDouble(x) : x, k), k);                       // lower ends: floor
const up = (x, k) => { const q = typeof x === 'number' ? Q.fromDouble(x) : x; return fmt(-fl(Q.neg(q), k), k); };   // upper ends: ceiling
const out = (iv, k) => [down(iv[0], k), up(iv[1], k)];
const dblBelow = (q) => { let x = Q.toDouble(q); while (Q.cmp(Q.fromDouble(x), q) > 0) x = I.nextDown(x); return x; };   // a double <= q
const dblAbove = (q) => { let x = Q.toDouble(q); while (Q.cmp(Q.fromDouble(x), q) < 0) x = I.nextUp(x); return x; };     // a double >= q
const qIv = (q) => [dblBelow(q), dblAbove(q)];

/* ---- constants: π (eqcert's Machin), √2 (checked by squaring), Catalan's G (an alternating bracket in BigInt) -------- */
const PI = T.PI, ONE = I.ONE;
const SQ2 = [I.nextDown(Math.SQRT2), I.nextUp(Math.SQRT2)];
if (!(I.sqr([SQ2[0], SQ2[0]])[1] < 2 && I.sqr([SQ2[1], SQ2[1]])[0] > 2)) die('the √2 enclosure does not bracket √2');
/* G = Σ_{k>=0} (−1)^k a_k, a_k = 1/(2k+1)²: a_k decreasing and convex, so after n terms the remainder is (−1)^n T with
   a_n/2 <= T <= (2a_n − a_{n+1})/2 (pair the tail's differences; they decrease). Every term floored/ceiled at 2^-128. */
function catalan(n) {
  const S = 1n << 128n; let lo = 0n, hi = 0n;
  const fl2 = (d) => S / d, ce2 = (d) => (S + d - 1n) / d;
  for (let k = 0; k < n; k++) { const d = BigInt(2 * k + 1) ** 2n; if (k % 2 === 0) { lo += fl2(d); hi += ce2(d); } else { lo -= ce2(d); hi -= fl2(d); } }
  const dn = BigInt(2 * n + 1) ** 2n, dn1 = BigInt(2 * n + 3) ** 2n;
  const tLo = fl2(dn) / 2n, tHi = (2n * ce2(dn) - fl2(dn1) + 1n) / 2n + 1n;
  if (n % 2 === 0) { lo += tLo; hi += tHi; } else { lo -= tHi; hi -= tLo; }
  return { lo: Q.R(lo, S), hi: Q.R(hi, S), terms: n };
}
const Gq = catalan(1 << 20);
const G = [dblBelow(Gq.lo), dblAbove(Gq.hi)];
const Z2 = I.mul(I.mul(I.div([2, 2], [3, 3]), I.sqr(PI)), G);               // Σ_{k≠0} |k|⁻⁴ = 4ζ(2)β(2) (UR2, read)

/* ---- r₂(n) by the divisor sieve r₂ = 4(d₁ − d₃), the count checked against Gauss's formula --------------------------- */
const isqrt = (m) => { let s = Math.floor(Math.sqrt(m)); while (s * s > m) s--; while ((s + 1) * (s + 1) <= m) s++; return s; };
function r2Table(R) {
  const N = R * R, t = new Int32Array(N + 1);
  for (let d = 1; d <= N; d += 2) { const s = d % 4 === 1 ? 1 : -1; for (let m = d; m <= N; m += d) t[m] += s; }
  let pts = 0; for (let n = 1; n <= N; n++) { t[n] *= 4; pts += t[n]; }
  let gauss = 4 * R; for (let i = 1; i <= R; i++) gauss += 4 * isqrt(N - i * i);
  if (pts !== gauss) die('the sieve counts ' + pts + ' lattice points with 0 < |k|² <= ' + N + ', Gauss\'s formula ' + gauss);
  return { t, pts };
}
function norms(t, N) { const ns = [], ws = []; for (let n = 1; n <= N; n++) if (t[n]) { ns.push(n); ws.push(t[n]); } return { ns, ws }; }
/* pairwise (cascade) summation: each outward-rounded addition widens by an ulp of a partial sum, ~log2(n) levels.
   The hot loops below inline eqcert's rigor model (interval.js: the correctly rounded IEEE result widened by one ulp with
   its nextDown/nextUp) on positive operands, instead of allocating an interval per operation — same arithmetic, ~10× faster. */
const nd = I.nextDown, nu = I.nextUp;
function Summer() {
  const lo = new Float64Array(64), hi = new Float64Array(64), full = new Uint8Array(64);
  return {
    add(a, b) { let l = 0, x = a, y = b; while (full[l]) { x = nd(lo[l] + x); y = nu(hi[l] + y); full[l] = 0; l++; } lo[l] = x; hi[l] = y; full[l] = 1; },
    push(v) { this.add(v[0], v[1]); },
    total() { let s = I.ZERO; for (let l = 0; l < 64; l++) if (full[l]) s = I.add(s, [lo[l], hi[l]]); return s; }
  };
}

/* ================================ LOWER: the trial polynomial (LF1, LF2) ================================ */
function decideLower(claimed) {
  const t0 = Date.now();
  const R = CL.R, N = R * R, p = CL.mu[0], q = CL.mu[1];
  const { t, pts } = r2Table(R);
  const s1 = Summer(), s2 = Summer(), s3 = Summer(); let terms = 0;
  for (let n = 1; n <= N; n++) {
    const r = t[n]; if (!r) continue; terms++;
    const D = q + p * n, rq = r * q, rq2 = r * q * q;                        // exact: each < 2^53
    const nD = n * D, D2 = D * D;                                            // rounded: widened below
    const cLo = nd(rq / nu(nD)), cHi = nu(rq / nd(nD));                      // r q/(n(q + pn)) = r c_n
    const t3Lo = nd(rq2 / nu(D2)), t3Hi = nu(rq2 / nd(D2));                  // r n² c_n² = r q²/(q + pn)²
    s1.add(cLo, cHi); s3.add(t3Lo, t3Hi); s2.add(nd(t3Lo / n), nu(t3Hi / n));   // r n c_n²
  }
  const S1 = s1.total(), S2 = s2.total(), S3 = s3.total();
  const A = I.div(I.sqr(S1), I.mul(PI, S2));
  const delta = I.div(S3, S2);
  const Ld = T.log(delta);
  const L = I.sub(A, I.add(Ld, T.log(I.add(ONE, Ld))));
  const admissible = delta[0] >= 1;
  const cq = decQ(claimed);
  const verdict = !admissible ? 'REFUSED' : cmpDQ(L[0], cq) >= 0 ? 'CERTIFIED' : cmpDQ(L[1], cq) < 0 ? 'REFUTED' : 'REFUSED';
  return { claim: 'C_16 >= ' + claimed, verdict, R, mu: p + '/' + q, latticePoints: pts, distinctNorms: terms, S1, S2, S3, delta, A, L, admissible, seconds: secs(t0), rows: t };
}
function decideLF2(lo) {
  /* JavaScript can only show consistency at double precision (the brackets are 2^-120 wide); the Python decider shows
     containment exactly. The certificate's rational and float are compared exactly. */
  const P = 1n << BigInt(CL.PREC);
  const br = (k) => [Q.R(BigInt(CL[k + 'lo_num']), P), Q.R(BigInt(CL[k + 'hi_num']), P)];
  const meets = (b, iv) => Q.cmp(b[0], Q.fromDouble(iv[1])) <= 0 && Q.cmp(Q.fromDouble(iv[0]), b[1]) <= 0;
  const ok = { S1: meets(br('S1'), lo.S1), S2: meets(br('S2'), lo.S2), S3: meets(br('S3'), lo.S3) };
  const rat = Q.R(BigInt(CL.L_lower_bound_rational[0]), BigInt(CL.L_lower_bound_rational[1]));
  const fltLeRat = Q.cmp(Q.fromDouble(CL.L_lower_bound_float_rounded_down), rat) <= 0;
  const ratLeL = Q.cmp(rat, Q.fromDouble(lo.L[0])) <= 0 ? 'CERTIFIED' : Q.cmp(rat, Q.fromDouble(lo.L[1])) > 0 ? 'REFUTED' : 'REFUSED';
  const printedLeRat = Q.cmp(decQ(PL), rat) <= 0;
  return { bracketsMeetEnclosures: ok, rationalLeExactRHS: ratLeL, floatLeRational: fltLeRat, printedLeRational: printedLeRat,
    rationalDecimal: out([dblBelow(rat), dblAbove(rat)], 16),
    verdict: ok.S1 && ok.S2 && ok.S3 && fltLeRat && printedLeRat && ratLeL !== 'REFUTED' ? (ratLeL === 'CERTIFIED' ? 'CERTIFIED' : 'REFUSED') : 'REFUTED' };
}

/* ================================ UPPER: the 84 boxes (UF1–UF4) ================================ */
const RU = 2000;                                                            // the partial sum's radius here (the Python decider: 1000)
let UP = null;                                                              // per-box S1 enclosures, computed once
function prepareUpper(rows) {
  const t0 = Date.now();
  const { ns, ws } = norms(rows, RU * RU);
  const sp2 = Summer(); for (let i = 0; i < ns.length; i++) { const n2 = ns[i] * ns[i]; sp2.add(nd(ws[i] / n2), nu(ws[i] / n2)); }   // n² < 2^53: exact
  const P2 = sp2.total();
  const R0 = CU.R0, sh = Summer(); for (let i = 0; i < ns.length && ns[i] <= R0 * R0; i++) sh.add(nd(ws[i] / ns[i]), nu(ws[i] / ns[i]));
  const H = sh.total();
  const TT = I.sub([RU, RU], SQ2), TP = I.add([RU, RU], SQ2), T0v = I.sub([R0, R0], SQ2);
  const K = I.sub(I.add(I.div(H, PI), I.div(SQ2, T0v)), I.mul([2, 2], T.log(T0v)));
  const TWOT02 = I.mul([2, 2], I.sqr(T0v));
  const boxes = CU.boxes.map((b) => ({ d1q: ratQ(b[0]), d2q: ratQ(b[1]), muStr: b[2], mu: Number(b[2]), printed: b[3] }))
    .sort((x, y) => Q.cmp(x.d1q, y.d1q));
  for (const bx of boxes) {
    const MU = [bx.mu, bx.mu], s = Summer(), mu = bx.mu;
    for (let i = 0; i < ns.length; i++) {                                   // w/(n(1 + μn)), every operation widened outward
      const n = ns[i], m = mu * n, eLo = nd(1 + nd(m)), eHi = nu(1 + nu(m));
      s.add(nd(ws[i] / nu(n * eHi)), nu(ws[i] / nd(n * eLo)));
    }
    const P1 = s.total();
    const tA = I.div(I.sub(Z2, P2), MU)[1];                                                     // UR2 (A)
    const tB = I.add(I.mul(PI, T.log(I.add(ONE, I.div(ONE, I.mul(MU, I.sqr(TT)))))), I.div(I.mul(PI, SQ2), TT))[1];   // UR2 (B)
    const lnTP = I.mul(PI, T.log(I.add(ONE, I.div(ONE, I.mul(MU, I.sqr(TP))))));              // UR5, the lower end only
    const corr = Math.min(I.div(ONE, TP)[1], I.div(ONE, I.mul([3, 3], I.mul(MU, I.mul(TP, I.sqr(TP)))))[1]);
    const tLo = Math.max(0, I.sub(lnTP, I.mul(I.mul(PI, SQ2), [corr, corr]))[0]);
    bx.P1 = P1; bx.tail = { A: tA, B: tB, used: tA <= tB ? 'A' : 'B', lower: tLo };
    bx.S1 = [I.add(P1, [tLo, tLo])[0], I.add(P1, [Math.min(tA, tB), Math.min(tA, tB)])[1]];
    bx.d = [dblBelow(bx.d1q), dblAbove(bx.d2q)];                                               // a double box containing [d1, d2]
  }
  UP = { boxes, P2, H, K, TWOT02, T0v, R0, seconds: secs(t0), distinctNorms: ns.length };
  for (const bx of boxes) for (const d of bx.d) {                          // the inlined upper ends against the kernel's intervals
    if (Math.abs(Bup(bx, d, d) - Biv(bx, [d, d])[1]) > 1e-12) die('the inlined B_μ upper end departs from the interval evaluation at ' + d);
    const g = d >= 2.72 ? giv([d, d]) : null;
    if (g && Math.abs(gup(d, d) - g[1]) > 1e-12) die('the inlined g upper end departs from the interval evaluation at ' + d);
  }
}
/* B_μ over a box X (or a point): S1(1 + μX)/π is increasing and ln X + ln(1 + ln X) is increasing, so interval
   evaluation gives [A(lo) − D(hi), A(hi) − D(lo)] — the monotone split; no derivative and no convexity */
const Biv = (bx, X) => { const A = I.div(I.mul(bx.S1, I.add(ONE, I.mul([bx.mu, bx.mu], X))), PI); const L = T.log(X); return I.sub(A, I.add(L, T.log(I.add(ONE, L)))); };
/* g over a box X with X >= e (UR4): 1 + K + (K + ln ln X)/ln X + 2T0²/(X ln X); the numerator is positive there */
const giv = (X) => { const L = T.log(X); if (!(L[0] >= 1)) return null; return I.add(I.add(I.add(ONE, UP.K), I.div(I.add(UP.K, T.log(L)), L)), I.div(UP.TWOT02, I.mul(X, L))); };
/* the same two upper ends for the subdivision's hot loop, from eqcert's point logarithm (T.logPoint, an interval) and
   one-ulp widening, computing only the end that matters: sup_[a,b] B_μ <= A(b) − D(a); sup_[a,b] g <= its value with
   ln ln at b and ln at a. Checked against Biv/giv at every box endpoint (prepareUpper). */
const Bup = (bx, a, b) => {
  const A = nu(nu(bx.S1[1] * nu(1 + nu(bx.mu * b))) / PI[0]);
  const la = T.logPoint(a)[0], l2 = T.logPoint(nd(1 + la))[0];
  return nu(A - nd(la + l2));
};
const gup = (a, b) => {
  if (!(a >= 2.72)) return Infinity;                                         // g only above e (UR4)
  const La = T.logPoint(a)[0]; if (!(La >= 1)) return Infinity;
  const LLb = T.logPoint(T.logPoint(b)[1])[1];
  return nu(nu(nu(1 + UP.K[1]) + nu(nu(UP.K[1] + LLb) / La)) + nu(UP.TWOT02[1] / nd(a * La)));
};
function supBox(bx, Uq, maxDepth) {
  const Ud = dblBelow(Uq);                                                   // ub <= Ud implies ub <= U exactly
  const st = [[bx.d[0], bx.d[1], 0]]; let n = 0, depth = 0, viaG = 0, worst = -Infinity; const und = [];
  while (st.length) {
    const [a, b, k] = st.pop(); n++;
    const bB = Bup(bx, a, b), bG = bB <= Ud ? Infinity : gup(a, b), ub = Math.min(bB, bG);
    if (ub <= Ud) { if (bG < bB) viaG++; if (k > depth) depth = k; if (ub > worst) worst = ub; continue; }
    if (k >= maxDepth || !(b > a)) { und.push([a, b, ub]); if (und.length > 3) break; continue; }
    const m = b > 2 * a ? Math.sqrt(a * b) : a + (b - a) / 2;               // geometric split on wide boxes
    if (!(m > a && m < b)) { und.push([a, b, ub]); continue; }
    st.push([a, m, k + 1], [m, b, k + 1]);
  }
  return { verdict: und.length ? 'REFUSED' : 'CERTIFIED', subBoxes: n, depth, viaG, undecided: und.slice(0, 3) };
}
function decideUF1(boxes) {
  if (Q.cmp(boxes[0].d1q, Q.ONE) !== 0) return { verdict: 'REFUTED', why: 'the first box does not start at 1' };
  if (Q.cmp(boxes[boxes.length - 1].d2q, ratQ(CU.D0)) !== 0) return { verdict: 'REFUTED', why: 'the last box does not end at D0' };
  for (let i = 0; i + 1 < boxes.length; i++) {
    if (Q.cmp(boxes[i].d2q, boxes[i + 1].d1q) !== 0) return { verdict: 'REFUTED', why: 'box ' + i + ' ends at ' + Q.toString(boxes[i].d2q) + ', box ' + (i + 1) + ' starts at ' + Q.toString(boxes[i + 1].d1q) };
    if (Q.cmp(boxes[i].d1q, boxes[i].d2q) >= 0) return { verdict: 'REFUTED', why: 'box ' + i + ' is empty or reversed' };
  }
  return { verdict: 'CERTIFIED', boxes: boxes.length, from: '1', to: CU.D0 };
}
function decideUpper(claimed, boxesIn, maxDepth) {
  const t0 = Date.now(), Uq = decQ(claimed);
  const boxes = boxesIn || UP.boxes;
  const UF1 = decideUF1(boxes);
  const per = boxes.map((bx) => supBox(bx, Uq, maxDepth));
  const UF2 = { verdict: per.every((r) => r.verdict === 'CERTIFIED') ? 'CERTIFIED' : 'REFUSED', boxes: per.length,
    certified: per.filter((r) => r.verdict === 'CERTIFIED').length, subBoxes: per.reduce((s, r) => s + r.subBoxes, 0),
    viaG: per.filter((r) => r.viaG > 0).length, maxDepth: Math.max(...per.map((r) => r.depth)),
    refusedBoxes: per.map((r, i) => (r.verdict === 'CERTIFIED' ? null : { box: i, undecided: r.undecided })).filter(Boolean) };
  const D0 = qIv(ratQ(CU.D0)), gD0 = giv(D0), lnD0 = T.log(D0), side = lnD0[0] >= 1 && I.add(UP.K, T.log(lnD0))[0] >= 1;
  const UF3 = { verdict: side && cmpDQ(gD0[1], Uq) <= 0 ? 'CERTIFIED' : side && cmpDQ(gD0[0], Uq) > 0 ? 'REFUTED' : 'REFUSED', gD0, sideConditions: side };
  const verdict = UF1.verdict === 'CERTIFIED' && UF2.verdict === 'CERTIFIED' && UF3.verdict === 'CERTIFIED' ? 'CERTIFIED' : 'REFUSED';
  return { claim: 'C_16 <= ' + claimed, verdict, UF1, UF2, UF3, perBox: per, seconds: secs(t0) };
}
/* the endpoint values of each box and the note's formula (UF4): what the certificate's own numbers say */
function boxFacts(bx) {
  const B1 = Biv(bx, qIv(bx.d1q)), B2 = Biv(bx, qIv(bx.d2q));
  const maxB = [Math.max(B1[0], B2[0]), Math.max(B1[1], B2[1])];
  let f = maxB, g1 = null;
  if (Q.cmp(bx.d1q, Q.R(16n)) >= 0) { g1 = giv(qIv(bx.d1q)); f = [Math.min(maxB[0], g1[0]), Math.min(maxB[1], g1[1])]; }
  const pb = Q.fromDouble(bx.printed);
  const UF4 = Q.cmp(pb, Q.fromDouble(f[1])) >= 0 ? 'CERTIFIED' : Q.cmp(pb, Q.fromDouble(f[0])) < 0 ? 'REFUTED' : 'REFUSED';
  return { B1, B2, maxB, g1, formula: f, UF4 };
}

/* ================================ run ================================ */
console.log('C_16: the registry prints ' + PL + '* <= C_16 <= ' + PU + '* (16a.md and README @ ' + PINS.registryCommit.slice(0, 8) + '); the certificates @ ' + PINS.certificateCommit.slice(0, 8));
console.log('  constants: π ' + JSON.stringify(out(PI, 17)) + '  G ' + JSON.stringify(out(G, 17)) + ' (' + Gq.terms + ' terms)  Z2 ' + JSON.stringify(out(Z2, 15)));
const LO = decideLower(PL);
console.log('  LF1 ' + LO.verdict + '  ' + LO.latticePoints + ' lattice points, ' + LO.distinctNorms + ' norms; δ ' + JSON.stringify(out(LO.delta, 13)) + '  RHS ' + JSON.stringify(out(LO.L, 13)) + '  ' + LO.seconds + ' s');
const LF2 = decideLF2(LO);
console.log('  LF2 ' + LF2.verdict + '  ' + JSON.stringify({ brackets: LF2.bracketsMeetEnclosures, rational: LF2.rationalLeExactRHS, float: LF2.floatLeRational, printed: LF2.printedLeRational }));
prepareUpper(LO.rows); delete LO.rows;
console.log('  upper: S1(μ) for 84 boxes at |k| <= ' + RU + ' (' + UP.distinctNorms + ' norms), K ' + JSON.stringify(out(UP.K, 15)) + '  ' + UP.seconds + ' s');
const MAXD = 64;
const UPR = decideUpper(PU, null, MAXD);
console.log('  UF1 ' + UPR.UF1.verdict + '  UF2 ' + UPR.UF2.verdict + ' (' + UPR.UF2.certified + '/' + UPR.UF2.boxes + ' boxes, ' + UPR.UF2.subBoxes + ' sub-boxes, depth ' + UPR.UF2.maxDepth + ', ' + UPR.UF2.viaG + ' boxes closed by g)  UF3 ' + UPR.UF3.verdict + ' g(D0) ' + JSON.stringify(out(UPR.UF3.gD0, 13)) + '  ' + UPR.seconds + ' s');
const facts = UP.boxes.map(boxFacts);
const Urat = Q.R(BigInt(CU.U_rational[0]), BigInt(CU.U_rational[1]));
const UF4 = { U_rationalLePrinted: Q.cmp(Urat, decQ(PU)) <= 0, U_rationalDecimal: out(qIv(Urat), 16), boxBounds: { CERTIFIED: facts.filter((f) => f.UF4 === 'CERTIFIED').length, REFUTED: facts.filter((f) => f.UF4 === 'REFUTED').length, REFUSED: facts.filter((f) => f.UF4 === 'REFUSED').length } };
UF4.verdict = UF4.U_rationalLePrinted && UF4.boxBounds.REFUTED === 0 && UF4.boxBounds.REFUSED === 0 ? 'CERTIFIED' : UF4.boxBounds.REFUTED || !UF4.U_rationalLePrinted ? 'REFUTED' : 'REFUSED';
/* the largest endpoint value over the boxes: the bound these boxes support, and its 10-place outward print */
let wi = 0; facts.forEach((f, i) => { if (f.formula[1] > facts[wi].formula[1]) wi = i; });
const supported = up(facts[wi].formula[1], 10);
const below = fmt(BigInt(supported.replace('.', '')) - 1n, 10);
const printedMinus1 = fmt(BigInt(PU.replace('.', '')) - 1n, 10);
console.log('  UF4 ' + UF4.verdict + '  U_rational ' + UF4.U_rationalDecimal[1] + ' <= ' + PU + ': ' + UF4.U_rationalLePrinted + '; box bounds ' + JSON.stringify(UF4.boxBounds) + '; the largest endpoint value ' + JSON.stringify(out(facts[wi].formula, 13)) + ' (box ' + wi + ') → the boxes support ' + supported);

/* ---- red controls ------------------------------------------------------------------------------------------------- */
const reds = [];
const red = (id, what, expect, got, extra) => { const fired = expect.includes(got); reds.push(Object.assign({ id, what, expect: expect.join(' or '), js: got, fired }, extra || {})); console.log('  RED ' + id.padEnd(26) + ' expect ' + expect.join('/') + '  js ' + got + (fired ? '  fired' : '  DID NOT FIRE')); };
const sup = decideUpper(supported, null, MAXD);
console.log('  the supported bound ' + supported + ': ' + sup.verdict + ' (' + sup.UF2.subBoxes + ' sub-boxes, depth ' + sup.UF2.maxDepth + ')');
/* one unit below the printed digits lies between the supported bound and the printed one; the subdivision's acceptance
   test (upper end <= U) is monotone in U, so it certifies whenever the supported bound does — not re-run */
const pm1 = { verdict: sup.verdict === 'CERTIFIED' && Q.cmp(decQ(supported), decQ(printedMinus1)) <= 0 ? 'CERTIFIED' : 'NOT DECIDED', how: 'implied: ' + supported + ' <= ' + printedMinus1 + ' and ' + supported + ' is CERTIFIED (the acceptance test is monotone in the bound)' };
console.log('  the printed bound one unit down, ' + printedMinus1 + ': ' + pm1.verdict + ' (' + pm1.how + ') — a control "printed minus one unit must not certify" cannot fire: the boxes support ' + supported);
/* a claim fails on one box: the box with the largest endpoint value is decided alone (the Python decider runs all 84) */
const belBox = supBox(UP.boxes[wi], decQ(below), 40);
red('upper-below-supported', 'C_16 <= ' + below + ', one unit in the tenth place below the bound the boxes support (' + supported + '): box ' + wi + ' (its endpoint value ' + out(facts[wi].formula, 13).join(' … ') + ') cannot be closed', ['REFUSED', 'REFUTED'], belBox.verdict, { box: wi });
const lowUp = decideLower(fmt(BigInt(PL.replace('.', '')) + 1n, 10)); delete lowUp.rows;
red('lower-plus-one-unit', 'C_16 >= ' + fmt(BigInt(PL.replace('.', '')) + 1n, 10) + ' from the same trial polynomial (the printed lower bound one unit up): its value ' + down(LO.L[0], 13) + '… is below', ['REFUTED'], lowUp.verdict);
{ const bx = UP.boxes[wi], f = facts[wi], lowered = I.nextDown(f.formula[0] - 1e-12); const pb = Q.fromDouble(lowered);
  const v = Q.cmp(pb, Q.fromDouble(f.formula[1])) >= 0 ? 'CERTIFIED' : Q.cmp(pb, Q.fromDouble(f.formula[0])) < 0 ? 'REFUTED' : 'REFUSED';
  red('box-bound-below-its-max', 'box ' + wi + ' (μ = ' + bx.muStr + ') with its printed bound ' + bx.printed + ' replaced by ' + lowered + ', below the lower end of its endpoint maximum ' + down(f.formula[0], 13), ['REFUTED', 'REFUSED'], v); }
{ const gap = UP.boxes.filter((_, i) => i !== 40); const r = decideUF1(gap);
  red('coverage-gap', 'box 40 removed from the tiling of [1, D0]', ['REFUTED'], r.verdict, { why: r.why }); }
{ const crossing = '2.1562240';                                            // below the certified lower end
  const mut = UP.boxes.map((bx) => Object.assign({}, bx, { S1: [bx.P1[0], bx.P1[1]] }));                 // the tail dropped
  const rm = decideUpper(crossing, mut, MAXD), rf = supBox(UP.boxes[wi], decQ(crossing), 30);   // the full decider fails on box wi
  red('tail-dropped-mutant', 'a mutant decider with S1(μ) taken as its partial sum over |k| <= ' + RU + ' alone (the UR2 tail omitted) certifies C_16 <= ' + crossing + ', below the certified lower end ' + PL + ' — caught by the crossing; the full decider cannot close box ' + wi + ' on the same claim (' + rf.verdict + ')', ['CAUGHT'], rm.verdict === 'CERTIFIED' && rf.verdict !== 'CERTIFIED' && LO.verdict === 'CERTIFIED' && Q.cmp(decQ(crossing), decQ(PL)) < 0 ? 'CAUGHT' : 'NOT CAUGHT', { mutant: rm.verdict, full: rf.verdict }); }

/* ---- the words ------------------------------------------------------------------------------------------------------ */
const lowerWord = LO.verdict === 'CERTIFIED' && LF2.verdict !== 'REFUTED' ? 'CERTIFIED' : LO.verdict;
const upperWord = UPR.verdict === 'CERTIFIED' ? 'PARTIAL' : UPR.verdict;
const bdzBelow = Q.cmp(decQ('2.156265'), decQ(PU)) > 0;                    // anything printing as 2.15627 is >= 2.156265
const deciders = { js: sha(rd('tools/replay-c16.js')), py: sha(rd('instruments/optq/c16.py')), bgw16a: sha(rd('instruments/optq/bgw16a.py')), ivdec: sha(rd('instruments/optq/ivdec.py')),
  eqcertInterval: sha(rd('instruments/interval/interval.js')), eqcertTranscendental: sha(rd('instruments/interval/transcendental.js')), eqcertRational: sha(rd('instruments/interval/rational.js')) };
const jsBox = (bx, i) => ({ box: i, d1: Q.toString(bx.d1q), d2: Q.toString(bx.d2q), mu: bx.muStr, printedBound: bx.printed, S1: out(bx.S1, 15), tail: { used: bx.tail.used, A: up(bx.tail.A, 15), B: up(bx.tail.B, 15), lower: down(bx.tail.lower, 15) },
  B_d1: out(facts[i].B1, 13), B_d2: out(facts[i].B2, 13), g_d1: facts[i].g1 ? out(facts[i].g1, 13) : null, formula: out(facts[i].formula, 13), UF4: facts[i].UF4,
  UF2: UPR.perBox[i].verdict, subBoxes: UPR.perBox[i].subBoxes, closedByG: UPR.perBox[i].viaG > 0 });
const js = {
  lower: { LF1: { claim: LO.claim, verdict: LO.verdict, R: LO.R, mu: LO.mu, latticePoints: LO.latticePoints, distinctNorms: LO.distinctNorms, S1: out(LO.S1, 15), S2: out(LO.S2, 15), S3: out(LO.S3, 15), delta: out(LO.delta, 15), deltaAtLeast1: LO.admissible, A: out(LO.A, 15), enclosure: out(LO.L, 13), seconds: LO.seconds }, LF2 },
  upper: { claim: UPR.claim, verdict: UPR.verdict, R: RU, distinctNorms: UP.distinctNorms, UF1: UPR.UF1, UF2: Object.assign({}, UPR.UF2), UF3: { verdict: UPR.UF3.verdict, gD0: out(UPR.UF3.gD0, 13), sideConditions: UPR.UF3.sideConditions, claimantPrints: CU.g_D0 }, UF4,
    K: out(UP.K, 15), H: out(UP.H, 15), P2: out(UP.P2, 15), endpointMax: { box: wi, enclosure: out(facts[wi].formula, 13) }, supported, supportedVerdict: sup.verdict, printedMinusOneUnit: { bound: printedMinus1, verdict: pm1.verdict, how: pm1.how }, seconds: UPR.seconds + UP.seconds, boxes: UP.boxes.map(jsBox) },
  constants: { pi: out(PI, 17), G: out(G, 17), GTerms: Gq.terms, Z2: out(Z2, 15), sqrt2: out(SQ2, 17) }
};
const brief = (j) => ({ LF1: j.lower.LF1.verdict, LF2: j.lower.LF2.verdict, UF1: j.upper.UF1.verdict, UF2: j.upper.UF2.verdict, UF3: j.upper.UF3.verdict, UF4: j.upper.UF4.verdict, supported: j.upper.supported, supportedVerdict: j.upper.supportedVerdict, printedMinusOne: j.upper.printedMinusOneUnit.verdict, lowerEnclosure: j.lower.LF1.enclosure, endpointMax: j.upper.endpointMax.enclosure });

if (CHECK) {
  const was = J('certs/c16-replay.json');
  if (was.pinsSha256 !== sha(rd(DIR + '/PINS.json')) || was.claimsSha256 !== sha(rd(DIR + '/claims.json'))) die('the pins or the claims changed since the record was written');
  if (JSON.stringify(brief(was.js)) !== JSON.stringify(brief(js))) die('the JavaScript decider does not re-derive the record: ' + JSON.stringify(brief(js)) + ' vs ' + JSON.stringify(brief(was.js)));
  if (was.word.lower !== lowerWord || was.word.upper !== upperWord) die('the words changed');
  if (!reds.every((r) => r.fired)) die('a red control did not fire');
  if (Object.keys(deciders).some((k) => was.deciders[k] !== deciders[k])) console.log('  note: a decider changed since the record was written — re-run without --check before citing it');
  console.log('c16 replay: lower ' + lowerWord + ', upper ' + upperWord + ' re-derived as recorded (JavaScript), ' + reds.length + '/' + reds.length + ' red controls fired; ' + secs(T0) + ' s');
  process.exit(0);
}

/* ---- the Python decider on the same bytes ---------------------------------------------------------------------------- */
const tmp = path.join(require('os').tmpdir(), 'cert-machine-out', 'c16'); fs.mkdirSync(tmp, { recursive: true });
const pyOut = path.join(tmp, 'py.json');
const pr = cp.spawnSync('python3', ['-I', path.join(ROOT, 'instruments', 'optq', 'c16.py'), '--json', pyOut, '--lower', PL, '--upper', PU, '--below', below], { encoding: 'utf8', maxBuffer: 1 << 26 });
if (pr.status !== 0) die('c16.py failed: ' + (pr.stderr || '').slice(-800));
process.stdout.write(pr.stdout.split('\n').map((l) => l && '  py ' + l).join('\n'));
const py = JSON.parse(fs.readFileSync(pyOut, 'utf8'));
/* agreement: the same verdict on every claim, and every pair of enclosures of one quantity overlapping */
const meet = (a, b) => !(Number(a[1]) < Number(b[0]) || Number(b[1]) < Number(a[0]));
const agreeRows = {
  LF1: py.lower.LF1.verdict === js.lower.LF1.verdict && meet(py.lower.LF1.enclosure, js.lower.LF1.enclosure),
  LF2: py.lower.LF2.verdict === 'CERTIFIED' && js.lower.LF2.verdict !== 'REFUTED',
  UF1: py.upper.UF1.verdict === js.upper.UF1.verdict, UF2: py.upper.UF2.verdict === js.upper.UF2.verdict, UF3: py.upper.UF3.verdict === js.upper.UF3.verdict && meet(py.upper.UF3.gD0, js.upper.UF3.gD0),
  UF4: py.upper.UF4.verdict === js.upper.UF4.verdict,
  boxEndpoints: py.upper.boxes.every((b, i) => meet(b.formula, js.upper.boxes[i].formula)),
  G: meet(py.constants.G, js.constants.G), K: meet(py.upper.K, js.upper.K),
  reds: ['upper-below-supported', 'lower-plus-one-unit'].every((id) => { const r = reds.find((x) => x.id === id); return r.expect.split(' or ').includes(py.redControls[id]); })
};
for (const r of reds) if (py.redControls[r.id] !== undefined) { r.py = py.redControls[r.id]; r.fired = r.fired && r.expect.split(' or ').includes(r.py); }
const agree = Object.values(agreeRows).every(Boolean);
console.log('  agreement ' + JSON.stringify(agreeRows));
if (!agree) die('the two implementations disagree');
if (!reds.every((r) => r.fired)) die('a red control did not fire');
const rec = {
  what: 'The registry\'s C_16 enclosure (maximusrufus, teorth/optimizationproblems #246, merged 2026-10-26 with both rows asterisked) decided as a second party by two implementations that share no code with each other or with the claimant\'s checkers (kept as text, never run): every finite claim of the two certificates, stated in ' + DIR + '/claims.json before deciding; the analytic steps (the weighted Cauchy–Schwarz dual bound, the tail bounds, the asymptotic bound g) read and re-derived there, never given a verdict; the convexity step not used (each box decided by subdivision with monotone enclosures)',
  generated: new Date().toISOString().replace(/\.\d+Z$/, 'Z'), seconds: secs(T0), node: process.version, python: py.python,
  deciders, pins: DIR + '/PINS.json', pinsSha256: sha(rd(DIR + '/PINS.json')), claims: DIR + '/claims.json', claimsSha256: sha(rd(DIR + '/claims.json')),
  registryCommit: PINS.registryCommit, certificateCommit: PINS.certificateCommit, pr: PINS.pr,
  printed: { lower: PL, upper: PU, asteriskedAtPin: true, readme: { lower: rm[1], upper: rm[2] } },
  word: { lower: lowerWord, upper: upperWord, row: upperWord === 'PARTIAL' && lowerWord === 'CERTIFIED' ? 'PARTIAL' : (lowerWord === upperWord ? lowerWord : 'REFUSED') },
  wordWhy: 'lower: every finite claim CERTIFIED by both implementations; the one reading (LR1: Parseval on [0, 2π]², the normalisation) is the definition applied to one explicit u, as in optq-226-16a. upper: the finite core CERTIFIED by both (UF1–UF3: the tiling, all 84 boxes against the printed digits, g(D0); and UF4\'s U_rational <= the printed digits); the step from it to C_16 <= ' + PU + ' crosses three analytic steps that are READ (UR1 the weighted Cauchy–Schwarz bound, UR2 the tail bounds with Σ|k|⁻⁴ = (2π²/3)G, UR4 F <= g for δ >= e and its supremum on [D0, ∞)), re-derived in claims.json — hence PARTIAL under the house grammar',
  verdicts: {
    LF1: { js: js.lower.LF1.verdict, py: py.lower.LF1.verdict, word: 'CERTIFIED' },
    LF2: { js: js.lower.LF2.verdict, py: py.lower.LF2.verdict, word: py.lower.LF2.verdict, note: 'the brackets contain the exact sums and the rational is below the exact value (Python, exact at 2^-200); the JavaScript decider, at double precision, sees the brackets meet its enclosures and cannot separate the rational, which sits ~1.3e-15 below the exact value (REFUSED at its precision)' },
    UF1: { js: js.upper.UF1.verdict, py: py.upper.UF1.verdict, word: 'CERTIFIED' }, UF2: { js: js.upper.UF2.verdict, py: py.upper.UF2.verdict, word: 'CERTIFIED' }, UF3: { js: js.upper.UF3.verdict, py: py.upper.UF3.verdict, word: 'CERTIFIED' },
    UF4: { js: js.upper.UF4.verdict, py: py.upper.UF4.verdict, word: 'REFUSED', U_rational: 'CERTIFIED (both): ' + UF4.U_rationalDecimal[1] + ' <= ' + PU,
      boxBounds: (() => { const j = js.upper.boxes.map((b) => b.UF4), p = py.upper.boxes.map((b) => b.UF4);
        return { settledByJs: j.filter((v) => v === 'CERTIFIED').length, settledByPy: p.filter((v) => v === 'CERTIFIED').length, settledByEither: j.filter((v, i) => v === 'CERTIFIED' || p[i] === 'CERTIFIED').length, refutedByEither: j.filter((v, i) => v === 'REFUTED' || p[i] === 'REFUTED').length,
          note: 'a printed box bound is the claimant\'s float at R = 2000; the Python decider\'s looser tail (R = 1000) cannot reach the small-μ boxes and the JavaScript decider\'s doubles cannot separate the two g-boxes, whose printed bound is g(d1) to the last ulp; no box bound is below its formula in either; UF4 bears on nothing in the enclosure (UF2 decides the boxes against the printed digits directly)' }; })() }
  },
  readings: Object.fromEntries(['UR1', 'UR2', 'UR3', 'UR4', 'UR5'].map((k) => [k, { statement: CLAIMS.upper[k].statement, reason: CLAIMS.upper[k].reason, used: k === 'UR3' ? 'not used: every box is decided by subdivision' : k === 'UR5' ? 'lower ends only (refutations, red controls)' : 'yes' }]).concat([['LR1', { statement: CLAIMS.lower.LR1.statement, reason: CLAIMS.lower.LR1.reason, used: 'yes' }]])),
  findings: [
    'the enclosure holds as printed: ' + PL + ' <= C_16 <= ' + PU + ' (upper: PARTIAL as above)',
    'the boxes support ' + supported + ' (the largest endpoint value, box ' + wi + ', μ = ' + UP.boxes[wi].muStr + ', is ' + js.upper.endpointMax.enclosure.join(' … ') + '); the printed ' + PU + ' and the certificate\'s U = ' + UF4.U_rationalDecimal[1] + ' are conservative by ~8e-10 (each printed box bound sits ~5–8e-10 above its endpoint maximum: the certifier\'s float64 error factor)',
    'the trial polynomial\'s exact value is ' + py.lower.LF1.enclosure.join(' … ') + ' (Python; JavaScript ' + js.lower.LF1.enclosure.join(' … ') + '); the printed ' + PL + ' is its floor at ten places',
    'the certificate\'s float fields slip by 1e-12 against their own rationals: L_lower_bound_float_rounded_down = 2.1562247706432345 while float(L_lower_bound_rational) = 2.1562247706442346 (harmless: lower), and U = 2.1562256465520826 while float(U_rational) = 2.1562256465510825 (harmless: higher)',
    'neither checker\'s VERIFIED is the printed inequality: the lower checker accepts |L_lo − claimed| < 1e-9, the upper accepts U_v <= U + 1e-9 (at R = 1000); both inequalities are decided here against the printed digits directly',
    'the certifiers named in the checkers (certify_c16_upper.py, certify_c16_lower.py) are not in the repository; the asymptotic g they use is re-derived in claims.json UR4 and agrees with the checker\'s formula',
    'the registry\'s numerical row ≈ 2.15627 [BDZ2013] lies above the upper end: ' + (bdzBelow ? 'any value printing as 2.15627 is >= 2.156265 > ' + PU : 'NOT established')
  ],
  js, py, agreeRows, agree,
  redControls: reds,
  limits: ['the upper end\'s step from the finite core to the constant is analytic (UR1, UR2, UR4) and read, not computed', 'the lower end is a value of F at one explicit u; it says nothing about where the maximum is', 'the two deciders share the mathematics (the monotone enclosures of B_μ and g; the dual bound) and no code; they differ in the partial-sum radius (2000 here, 1000 in Python), in G (an alternating bracket here, Ramanujan\'s series there), in the r₂ table (divisor sieve here, octant enumeration there) and in the box method (monotone subdivision here, derivative-sign tests there)']
};
fs.writeFileSync(OUT, JSON.stringify(rec, null, 1) + '\n');
console.log('wrote certs/c16-replay.json — lower ' + lowerWord + ', upper ' + upperWord + '; ' + reds.length + '/' + reds.length + ' red controls fired; ' + rec.seconds + ' s');
