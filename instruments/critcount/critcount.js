/* critcount.js — certified critical-point counts for even cosine series on the
   torus, over an enclosure ball.  instruments/critcount · cert-machine

   THE PORT (TERRA-PORT.md item 2).  terra's certify-peaks.js proved the T1-T8
   peak counts; a full audit found three latent rigor gaps, and this fresh
   implementation makes each a CONDITION OF ENTRY rather than a fix on top:

   (a) THE COUNT COMES FROM THE CERTIFIED ROWS, NOT FROM FLOAT SIGNS.  terra
       took the critical-point kinds from float curvature at float chain
       points; the certified regions existed but nothing derived the count
       from them.  Here the verdict is assembled ONLY from certified region
       signs, and the chain logic is ASSERTED on those signs: rows must
       alternate curv/slope covering [0,1/2] contiguously, each slope sign
       must equal the certified curvature sign before it and negate the one
       after it (that is what forces exactly one zero of f' per curvature
       region and none elsewhere).  Float appears only in the PROPOSER.

   (b) EVERY COEFFICIENT PRODUCT IS ENCLOSED OUTWARD.  terra built interval
       terms from thin float products (iv(-2*b*lam)).  Here 2pi is enclosed
       (encloseFloat(2*Math.PI) contains the real 2pi: Math.PI is correctly
       rounded), lambda = 2pi k and every product is interval arithmetic, the
       Lipschitz constants are interval sums taken at their upper bound, and
       the trig argument's own rounding chain is bounded and added to the
       enclosure (sin and cos are 1-Lipschitz).

   (c) THE BALL'S HIGHER DERIVATIVE IS FOLDED INTO THE CELL PAD.  A cell of
       width h is certified from its midpoint; the extension must use the
       Lipschitz constant of the BALL function, not of the candidate alone:
       cellPad = (L_d + ballPad_{d+1}) h/2 + ballPad_d.  (The candidate-only
       route is arguably sound by a pointwise argument; the ball-Lipschitz
       route is sound with no argument, and costs nothing.)

   THE ARGUMENT (per series, on [0,1/2]; evenness pins f'(0) = f'(1/2) = 0).
   A float scan proposes interior critical points and inflection gaps; the
   machine builds the alternating region chain
       [0,R0] f'' s0 · [R0,L1] f' t0 · [L1,R1] f'' s1 · ... · [Lk,1/2] f'' sK
   and certifies every region sign by adaptive interval evaluation with (b)
   and (c).  Certified chain + assertions (a) imply EXACTLY K+2 critical
   points on [0,1/2] with kinds = the certified curvature signs; torus counts
   follow by evenness (interior points mirror, endpoints do not).  Anything
   that cannot be certified REFUSES — nothing is claimed.

   BALL -> DERIVATIVE BOUNDS: ||dm||_nu <= r gives sup|dm^(j)| <= r (2pi)^j
   max_k k^j / nu^k, the max decided with an exact ratio guard.

   HONEST FRAMING (mandatory): a "violation" here means gain-weighted
   well-counting beats flat well-counting — the equilibrium re-weights
   harmonics the potential already contains.  Never "invents structure".

   SPDX-License-Identifier: MIT — Copyright (c) 2026 Carlos Toledo         */
'use strict';

const I = require('../interval/interval.js');
const { iv, add, mul, ZERO } = I;
const TWO_PI = 2 * Math.PI;                       /* float mirror, proposer only */
const TWO_PI_I = I.encloseFloat(2 * Math.PI);     /* contains the real 2pi */

/* ---- ball constants: sup over the r-ball of |d^pow (delta f)| / r ---------- */
function ballConst(pow, nu) {
  /* max_k k^pow / nu^k over integers, in interval arithmetic; the ratio guard
     proves the scanned prefix contains the max (terms decay geometrically). */
  const lim = Math.ceil(40 / Math.log(nu)) + 10;
  let best = 0;
  let nuk = iv(1);
  const nuI = I.encloseFloat(nu);
  for (let k = 1; k <= lim; k++) {
    nuk = mul(nuk, nuI);
    const val = I.div([Math.pow(k, pow), Math.pow(k, pow)], nuk);
    if (val[1] > best) best = val[1];
  }
  const ratio = I.div(I.pow(I.div(iv(lim + 1), iv(lim)), pow), nuI);
  if (!(ratio[1] < 1)) throw new Error('ball-constant scan failed its ratio guard');
  return best;
}

function ballPads(r, nu) {
  const rI = iv(r);
  const p = (j) => mul(mul(rI, I.pow(TWO_PI_I, j)), iv(ballConst(j, nu)))[1];
  return { d1: p(1), d2: p(2), d3: p(3) };
}

/* ---- the certified counter -------------------------------------------------
   coefs: stored b_k, series f(x) = b0 + sum 2 b_k cos(2pi k x).
   pads: {d1,d2,d3} from ballPads (thin series pass {d1:0,d2:0,d3:0}).
   opts._regionOverride: BATTERY-ONLY hook — replaces the proposed region
   boundaries so the assertion layer can be attacked; never set in runners.  */
function certifiedCount(coefs, pads, label, opts) {
  opts = opts || {};
  const n = coefs.length - 1;
  const refuse = (why) => ({ refused: why, label });

  /* float proposer */
  const fd1 = (t) => { let s = 0; for (let k = 1; k <= n; k++) s += -2 * coefs[k] * TWO_PI * k * Math.sin(TWO_PI * k * t); return s; };
  const fd2 = (t) => { let s = 0; for (let k = 1; k <= n; k++) s += -2 * coefs[k] * (TWO_PI * k) ** 2 * Math.cos(TWO_PI * k * t); return s; };

  /* (b) outward Lipschitz constants of the candidate: L_d >= sup |f^(d+1)| */
  let L1I = ZERO, L2I = ZERO;
  for (let k = 1; k <= n; k++) {
    const lamI = mul(TWO_PI_I, iv(k));
    const c2 = mul(iv(2), I.abs(iv(coefs[k])));
    L1I = add(L1I, mul(c2, I.pow(lamI, 2)));
    L2I = add(L2I, mul(c2, I.pow(lamI, 3)));
  }
  const L1 = L1I[1], L2 = L2I[1];

  /* (b) interval evaluation of f^(deriv) with the full rounding chain enclosed */
  const iEval = (deriv, t) => {
    let s = ZERO;
    for (let k = 1; k <= n; k++) {
      const lamI = mul(TWO_PI_I, iv(k));
      const angF = TWO_PI * k * t;
      const angI = mul(lamI, iv(t));
      const dev = I.nextUp(Math.max(Math.abs(angI[0] - angF), Math.abs(angI[1] - angF)));
      let trig = deriv === 1 ? I.encloseSin(angF) : I.encloseCos(angF);
      trig = [I.nextDown(trig[0] - dev), I.nextUp(trig[1] + dev)];   /* sin,cos 1-Lipschitz */
      const coefI = deriv === 1
        ? mul(iv(-2 * coefs[k]), lamI)
        : mul(iv(-2 * coefs[k]), I.pow(lamI, 2));
      s = add(s, mul(coefI, trig));
    }
    return s;
  };

  /* (c) certify a sign over [a,b] for EVERY function in the ball */
  function certifySign(a, b, deriv, wantPositive) {
    const L = deriv === 1 ? L1 : L2;
    const ballPad = deriv === 1 ? pads.d1 : pads.d2;
    const ballPadNext = deriv === 1 ? pads.d2 : pads.d3;
    let G = 256;
    for (;;) {
      const h = (b - a) / G;
      const cellPad = I.nextUp(I.nextUp(L + ballPadNext) * h / 2 + ballPad);
      let worst = Infinity;
      for (let g = 0; g < G; g++) {
        const v = iEval(deriv, a + (g + 0.5) * h);
        const m = wantPositive ? I.nextDown(v[0] - cellPad) : I.nextDown(-(v[1] + cellPad));
        if (m < worst) worst = m;
      }
      if (worst > 0) return { bound: worst, G };
      if (G >= 1 << 20) return null;
      G *= 4;
    }
  }

  const zeroOf = (f, lo, hi) => {
    let flo = f(lo);
    for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2, fm = f(m); if ((flo > 0) === (fm > 0)) { lo = m; flo = fm; } else hi = m; }
    return (lo + hi) / 2;
  };

  /* propose: interior critical points on (0, 1/2) */
  const GG = 100001, crit = [];
  for (let i = 1; i < GG / 2 - 1; i++) {
    const t0 = (i + 0.5) / GG, t1 = (i + 1.5) / GG;
    const d0 = fd1(t0), d1v = fd1(t1);
    if ((d0 > 0 && d1v < 0) || (d0 < 0 && d1v > 0)) crit.push(zeroOf(fd1, t0, t1));
  }
  const chain = [0, ...crit, 0.5];
  const curvF = chain.map((c) => fd2(c));
  for (let i = 0; i < chain.length; i++) {
    if (Math.abs(curvF[i]) < 1e-12) return refuse(`degenerate curvature at proposed critical point ${chain[i].toFixed(6)}`);
  }

  /* propose region boundaries from inflections, pulled 30% back */
  let Rb = [], Lb = [];
  for (let i = 0; i + 1 < chain.length; i++) {
    const a = chain[i], b = chain[i + 1];
    const M = 4000; let first = null, last = null;
    for (let j = 0; j < M; j++) {
      const t0 = a + (j + 0.25) * (b - a) / M, t1 = a + (j + 1.25) * (b - a) / M;
      if (t1 >= b) break;
      const c0 = fd2(t0), c1 = fd2(t1);
      if ((c0 > 0) !== (c1 > 0)) { const z = zeroOf(fd2, t0, t1); if (first === null) first = z; last = z; }
    }
    if (first === null) return refuse(`no inflection proposed between ${a.toFixed(6)} and ${b.toFixed(6)}`);
    Rb.push(chain[i] + 0.7 * (first - chain[i]));
    Lb.push(chain[i + 1] - 0.7 * (chain[i + 1] - last));
  }
  if (opts._regionOverride) { Rb = opts._regionOverride.Rb || Rb; Lb = opts._regionOverride.Lb || Lb; }

  /* certify the chain; (a) collect CERTIFIED signs only */
  const rows = [];
  const sCert = [];                                   /* certified curvature signs */
  const tCert = [];                                   /* certified slope signs */
  for (let i = 0; i < chain.length; i++) {
    const lo = i === 0 ? 0 : Lb[i - 1];
    const hi = i === chain.length - 1 ? 0.5 : Rb[i];
    if (!(lo < hi)) return refuse(`degenerate curvature region at index ${i}`);
    const want = curvF[i] > 0;                        /* proposer picks; certifier decides */
    const res = certifySign(lo, hi, 2, want);
    if (!res) return refuse(`f'' ${want ? '>' : '<'} 0 not certifiable on [${lo.toFixed(6)}, ${hi.toFixed(6)}]`);
    sCert.push(want ? 1 : -1);
    rows.push({ kind: 'curv', lo, hi, sign: want ? '+' : '-', margin: res.bound, grid: res.G });
    if (i + 1 < chain.length) {
      const mlo = Rb[i], mhi = Lb[i];
      if (!(mlo < mhi)) return refuse(`degenerate slope region in gap ${i}`);
      const wantP = fd1((mlo + mhi) / 2) > 0;
      const res1 = certifySign(mlo, mhi, 1, wantP);
      if (!res1) return refuse(`f' ${wantP ? '>' : '<'} 0 not certifiable on [${mlo.toFixed(6)}, ${mhi.toFixed(6)}]`);
      tCert.push(wantP ? 1 : -1);
      rows.push({ kind: 'slope', lo: mlo, hi: mhi, sign: wantP ? '+' : '-', margin: res1.bound, grid: res1.G });
    }
  }

  /* (a) THE ASSERTION LAYER — the count is a theorem about the certified rows.
     Contiguity: regions tile [0,1/2].  Alternation: t_i = s_i = -s_{i+1}.
     Together: f' has exactly one zero inside each curvature region (monotone
     there, endpoint regions use f'(0)=f'(1/2)=0) and none in slope regions. */
  let cursor = 0;
  for (const row of rows) {
    if (row.lo !== cursor) return refuse(`region chain not contiguous at ${row.lo} (expected ${cursor})`);
    cursor = row.hi;
  }
  if (cursor !== 0.5) return refuse('region chain does not reach 1/2');
  for (let i = 0; i + 1 < sCert.length; i++) {
    if (sCert[i + 1] !== -sCert[i]) return refuse(`certified curvature does not alternate at gap ${i}`);
    if (tCert[i] !== sCert[i]) return refuse(`certified slope sign in gap ${i} contradicts the curvature chain`);
  }

  /* torus counts from CERTIFIED curvature signs only */
  let maxima = 0, minima = 0;
  for (let i = 0; i < sCert.length; i++) {
    const mult = (i === 0 || i === sCert.length - 1) ? 1 : 2;
    if (sCert[i] < 0) maxima += mult; else minima += mult;
  }
  return {
    label, maxima, minima, chain,
    curv: sCert.map((s) => (s > 0 ? '+' : '-')),
    regions: rows,
    minMargin: Math.min(...rows.map((x) => x.margin)),
    assertions: { contiguous: true, curvatureAlternates: true, slopeMatchesChain: true,
                  countFrom: 'certified region signs only' },
  };
}

module.exports = { ballPads, ballConst, certifiedCount, TWO_PI_I };
