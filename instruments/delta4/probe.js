#!/usr/bin/env node
/* probe.js — does the δ₃ centring method carry over to δ₄? Every number with a verdict
   attached is exact (BigInt / rationals); floats are labelled "float" and decide nothing.
   instruments/delta4 · cert-machine

     node instruments/delta4/probe.js [--record] [--search DIR]

   --record writes certs/delta4-probe.json; --search DIR folds in the float basin-hopping
   summaries search.js wrote there (search-*.json).

   MIT licensed. Part of cert-machine. */
'use strict';

const fs = require('fs'), path = require('path'), crypto = require('crypto');
const Q = require('../interval/rational.js');
const M = require('./model.js');

const S = Q.toString, D = Q.toDouble, R = (n, d) => Q.R(BigInt(n), BigInt(d === undefined ? 1 : d));
const timings = {};
const timed = (name, fn) => { const t0 = Date.now(); const v = fn(); timings[name] = (Date.now() - t0) / 1000; return v; };

function run(opts) {
  const rec = { schema: 'cert-machine/delta4-probe/1', date: '2026-10-05' };
  const bcg = M.blocksCol(M.BCG_BLOCKS);
  const W = bcg.W, E = bcg.classes[0].E, nE = E.length - 2;

  /* ---- 1. the functional ---------------------------------------------------------- */
  rec.functional = timed('functional', () => {
    const one = M.blocksCol([1n]), dec = M.decompose(bcg);
    const sumP = Object.values(dec.pairs).reduce((s, v) => Q.add(s, v), R(0));
    const recomposed = Q.mul(R(1, 8), Q.add(Q.add(dec.area, sumP), dec.quart));
    return {
      statement: 'F(φ) = lim #mono increasing 4-APs/n² for a ↦ φ(a/n); Δ = {x,t ≥ 0, x+3t ≤ 1}; 1[x₁=x₂=x₃=x₄] = (1 + Σ_{i<j} xᵢxⱼ + x₁x₂x₃x₄)/8',
      formula: 'F = 1/48 + (1/8)[∬_{R01}φφ + ∬_{R12}φφ + ∬_{R23}φφ + ½∬_{R02}φφ + ½∬_{R13}φφ + ⅙(∫φ)²] + (1/8)∬_Δ φ(x)φ(x+t)φ(x+2t)φ(x+3t)',
      pairRegions: [
        { pair: '01', gap: 1, weight: '1', region: '0 ≤ u ≤ v, 3v − 2u ≤ 1', vertices: '(0,0) (0,1/3) (1,1)', area: '1/6' },
        { pair: '12', gap: 1, weight: '1', region: 'u ≤ v ≤ 2u, 2v − u ≤ 1', vertices: '(0,0) (1/3,2/3) (1,1)', area: '1/6' },
        { pair: '23', gap: 1, weight: '1', region: 'u ≤ v ≤ 1, 2v ≤ 3u', vertices: '(0,0) (2/3,1) (1,1)', area: '1/6' },
        { pair: '02', gap: 2, weight: '1/2', region: '0 ≤ u ≤ v, 3v − u ≤ 2', vertices: '(0,0) (0,2/3) (1,1)', area: '1/3' },
        { pair: '13', gap: 2, weight: '1/2', region: 'u ≤ v ≤ 1, v ≤ 3u', vertices: '(0,0) (1/3,1) (1,1)', area: '1/3' },
        { pair: '03', gap: 3, weight: '1/3', region: '0 ≤ u ≤ v ≤ 1', vertices: '(0,0) (0,1) (1,1)', area: '1/2', note: '= (1/6)(∫φ)²' },
      ],
      areaCheck: 'pair (i,j) term = (1/g)∬_{R_ij}φ(u)φ(v), (u,v) = (x+it, x+jt), Jacobian g = j−i; area(R_ij) = g·|Δ| = g/6',
      constantColouring: S(M.F(one)),
      bcgTerms: { area: S(dec.area), pairs: Object.fromEntries(Object.entries(dec.pairs).map(([k, v]) => [k, { exact: S(v), float: D(v) }])), quartic: { exact: S(dec.quart), float: D(dec.quart) } },
      identityHoldsExactly: Q.cmp(recomposed, dec.F) === 0,
      exactOn: 'block colourings (macroscopic ±1 step functions): F is lim count/n² term by term (brute force below)',
    };
  });

  /* brute force: block colourings agree to O(1/n); arithmetic ones do not */
  rec.bruteForce = timed('bruteForce', () => {
    const out = { bcgRounded: [], randomBlocks: null, parityColouring: null, quadraticPhase: null };
    const Fb = D(M.F(bcg));
    for (const n of [2000, 8000, 16000]) { const c = M.countDiscrete(M.discretise(bcg, n)); out.bcgRounded.push({ n, mono: c.mono, nTimesGap: +(n * (c.mono / n / n - Fb)).toFixed(4) }); }
    const blocks = [5n, 3n, 5n, 7n, 5n, 5n, 2n, 7n, 5n], rc = M.blocksCol(blocks), dec = M.decompose(rc), rows = [];
    for (const k of [50, 200, 400]) {
      const n = k * Number(rc.W), c = M.countDiscrete(M.discretise(rc, n));
      rows.push({ n, nTimesGapMono: +(n * (c.mono / n / n - D(dec.F))).toFixed(4), nTimesGapQuartic: +(n * (c.quart / n / n - D(dec.quart))).toFixed(4), nTimesGapPairs: Object.fromEntries(Object.entries(c.pair).map(([key, v]) => [key, +(n * (v / n / n - D(dec.pairs[key]))).toFixed(4)])) });
    }
    out.randomBlocks = { blocks: blocks.map(String), F: S(dec.F), rows, reading: 'every term within O(1/n) (the gap ×n tends to −1/2): F is exact on block colourings' };
    const n = 12000, par = new Int8Array(n); for (let a = 0; a < n; a++) par[a] = (a + 1) % 2 ? -1 : 1;
    const cp = M.countDiscrete(par), step = M.decompose(M.blocksCol(new Array(60).fill(1n)));
    out.parityColouring = {
      colouring: 'a ↦ (−1)^a', n, discrete: { monoOverN2: cp.mono / n / n, limit: '1/12', gap2PairOverN2: cp.pair['02'] / n / n, quartOverN2: cp.quart / n / n },
      continuumOfItsStepFunction: { F: S(step.F), P02: S(step.pairs['02']), T4: S(step.quart), note: 'exact, 60 cells (same for 24, 120)' },
      reading: 'gap-1 pair sums agree (0); the gap-2 pair term (1/6 vs 0) and the quartic (1/6 vs 1/18) do not: the count is not a functional of the step function',
    };
    const q = new Int8Array(n); for (let a = 1; a <= n; a++) q[a - 1] = Math.cos(2 * Math.PI * ((Math.SQRT2 * a * a) % 1)) >= 0 ? 1 : -1;
    const cq = M.countDiscrete(q);
    out.quadraticPhase = {
      colouring: 'a ↦ sign cos(2π√2 a²)', n, float: true, monoOverN2: cq.mono / n / n, quartOverN2: cq.quart / n / n,
      pairsOverN2: Object.fromEntries(Object.entries(cq.pair).map(([k, v]) => [k, +(v / n / n).toFixed(5)])),
      predictedLimit: { mono: '7/324 = (1/48)(1 + 1/27)', quartic: '1/162 = |Δ|·∫A(u)A(3u)du, A the autocorrelation of the square wave' },
      reading: 'every pair term → 0 (as for a random colouring; the continuum F of its step function → 1/48) but the quartic does not: U³ (quadratic-phase) structure is invisible to local densities',
    };
    return out;
  });

  /* ---- the reduction --------------------------------------------------------------- */
  rec.reduction = timed('reduction', () => {
    let mu = 0n; for (let k = 0; k <= nE; k++) mu += BigInt(bcg.classes[0].c[k]) * (E[k + 1] - E[k]);
    const muR = Q.R(mu, W);
    /* the pointwise relaxation: the law uniform on the 8 odd tuples of {±1}⁴ */
    const odd = []; for (let m = 0; m < 16; m++) { const x = [0, 1, 2, 3].map(i => ((m >> i) & 1 ? -1 : 1)); if (x[0] * x[1] * x[2] * x[3] === -1) odd.push(x); }
    const mom1 = [0, 1, 2, 3].map(i => odd.reduce((s, x) => s + x[i], 0));
    const mom2 = M.PAIRS.map(([i, j]) => odd.reduce((s, x) => s + x[i] * x[j], 0));
    const monoMass = odd.filter(x => x.every(v => v === x[0])).length;
    return {
      gap1: 'exact for EVERY colouring: an ordered pair (u,v) is consecutive in exactly one 4-AP at each position, so these three terms are quadratic forms of the scale-1/n step function (as N⁺ was for k = 3)',
      gap3: 'Σ_{4-APs} χ(a)χ(a+3d) = ½[Σ_{c mod 3}(Σ_{a≡c}χ)² − n] ≥ −n/2: a sum of squares over residue classes mod 3 — the exact analogue of PRS\'s T ≤ n²/8, droppable in a lower bound',
      gap3Cost: { muOfBCG: { exact: S(muR), float: D(muR) }, termAtBCG: S(Q.mul(R(1, 48), Q.mul(muR, muR))), reading: 'BCG\'s colouring is NOT balanced (it is not antisymmetric), so dropping the term loses first-order information at φ*: keep it, in mod-3-class form' },
      gap2: 'exact only per parity class: a form in (φ_even, φ_odd) on R02 ∪ R13, kernel not PSD (the regions are not the full triangle) — must be kept with two functions',
      quartic: 'no reduction. Σχ(a)χ(a+d)χ(a+2d)χ(a+3d) is not determined by any local density data (parity and quadratic-phase colourings above), and it is not weakly continuous',
      pointwiseRelaxationIsZero: {
        law: 'uniform on the 8 tuples of {±1}⁴ with x₁x₂x₃x₄ = −1', firstMoments: mom1, secondMoments: mom2, monochromaticTuples: monoMass,
        reading: 'with every singleton and pair statistic 0 (what a balanced, pair-random colouring presents locally) a 4-point law can have NO monochromatic tuple; so the relaxation "min over local 4-point laws with the exact pair moments" — the only reduction that keeps the quartic — evaluates to 0. For k = 3 the indicator has no cubic term and this relaxation is exact; for k = 4 it is vacuous.',
      },
      noQuadraticMinorantTightToFirstOrder: 'at an odd tuple x* (S4 = −1) no quadratic p ≤ x₁x₂x₃x₄ on {±1}⁴ equals it at x* and at all four neighbours x*⊕eᵢ (gauge to x* = 1: p(1) = −1, p(1⊕eₖ) = 1 forces Σ_{j≠k} c_kj = −1 while p ≤ −∏ at the double flips forces every c_kj ≤ −1). 54.3% of Δ carries odd tuples of φ* (below), so any fixed-multiplier quadratic minorant of the quartic loses first-order information there.',
    };
  });

  /* ---- 2. the candidate ------------------------------------------------------------- */
  rec.candidate = timed('candidate', () => {
    const Fb = M.F(bcg);
    const pat = pred => M.sweep(bcg, (idx, cls, col) => { const c = [0, 1, 2, 3].map(i => col.classes[cls[i]].c[idx[i]]); return pred(c.reduce((a, b) => a + b, 0)) ? 1n : 0n; });
    const pert = M.BCG_BLOCKS.slice(); pert[17] += 1n;
    return {
      source: 'Butler–Costello–Graham, Experiment. Math. 19 (2010) 399–411, Appendix (36 blocks, transcribed from the publisher PDF in corpus/sources/delta3/.cache, git-ignored)',
      blocksSha256: crypto.createHash('sha256').update(M.BCG_BLOCKS.join(',')).digest('hex'),
      W: W.toString(), F: S(Fb), Ffloat: D(Fb), printed: S(M.BCG_PRINTED), equalsPrinted: Q.cmp(Fb, M.BCG_PRINTED) === 0,
      denominatorIs4W: Fb.d === 4n * W || (4n * W) % Fb.d === 0n,
      oneBlockLengthPlusOne: { block: 18, F: S(M.F(M.blocksCol(pert))), equalsPrinted: Q.cmp(M.F(M.blocksCol(pert)), M.BCG_PRINTED) === 0 },
      versusRandom: D(Q.div(Fb, R(1, 48))),
      tuplePatternAreaFractions: { mono: D(pat(s => Math.abs(s) === 4)) * 6, oddThreeOne: D(pat(s => Math.abs(s) === 2)) * 6, twoTwo: D(pat(s => s === 0)) * 6 },
    };
  });

  /* ---- 3. first order: h₄ ------------------------------------------------------------ */
  const rows = timed('h4table', () => M.h4Table(bcg));
  const facts = M.h4Facts(bcg, rows);
  rec.h4 = timed('h4facts', () => {
    const dec = M.decompose(bcg);
    const sumP = Object.values(dec.pairs).reduce((s, v) => Q.add(s, v), R(0));
    const pred = Q.mul(R(-1, 2), Q.add(sumP, Q.mul(R(2), dec.quart)));
    /* linearity between candidates: the midpoint value equals the chord, exactly */
    let linBad = 0, linChecked = 0;
    for (let k = 0; k + 1 < rows.length; k += 7) {
      const a = rows[k].A, b = rows[k + 1].A; if ((a + b) % 2n) continue;
      const mid = M.h4Acc(bcg, (a + b) / 2n, 1); linChecked++;
      if (2n * mid !== rows[k].R + rows[k + 1].L) linBad++;
    }
    /* h₄ against an exact finite difference of F: flip [a, a+ε] */
    const fd = [];
    const F0 = M.F(bcg), eps = W / 10n ** 12n;
    for (const frac of [[1n, 7n], [1n, 2n], [5n, 6n]]) {
      const a = W * frac[0] / frac[1];
      let k = 0; while (E[k + 1] <= a) k++;
      const Enew = [...E.slice(0, k + 1), a, a + eps, ...E.slice(k + 1)];
      const cnew = [...bcg.classes[0].c.slice(0, k + 1), -bcg.classes[0].c[k], bcg.classes[0].c[k], ...bcg.classes[0].c.slice(k + 1)];
      const dF = Q.div(Q.sub(M.F({ W, classes: [{ E: Enew, c: cnew }] }), F0), Q.R(eps, W));
      fd.push({ a: S(Q.R(a, W)), finiteDifference: D(dF), h4: D(Q.R(M.h4Acc(bcg, 60n * a, 1), 360n * W)) });
    }
    const edgeZeros = facts.zeros.filter(z => z.edge).map(z => z.A);
    const edges60 = E.slice(1, -1).map(e => 60n * e);
    return {
      definition: 'h₄(a) = Σ_i ∫dt [1(other three opposite to a) − 1(other three = a)]; F(φ*(1−2σ)) − F(φ*) = ∫h₄σ + Q₂ + C₃ + Q₄ exactly, Q₂ = ∬Σ_{i<j} s_is_j 1[s_k=s_l] σσ, C₃ = −∬S₄Σσσσ, Q₄ = 2∬S₄σσσσ, s = φ*, S₄ = s₀s₁s₂s₃',
      piecewiseLinear: 'yes, continuous; linear between the candidates a = (dE′ − d′E)/(d − d′), d ≠ d′ ∈ ±{1,2,3}, E, E′ ∈ edges ∪ {0,1} — denominators dividing 6W',
      candidates: rows.length, linearityChecks: { checked: linChecked, failed: linBad },
      min: S(facts.min), negativeCandidates: facts.negatives.length,
      zeros: facts.zeros.length, zerosAtEdges: edgeZeros.length,
      zerosExactlyTheEdges: edgeZeros.length === 35 && facts.zeros.length === 35 && edges60.every((e, i) => e === edgeZeros[i]),
      jumpsAtEdges: facts.slopes.filter(s => s.jump !== 0n).length,
      oneSidedSlopesEqual: facts.slopes.every(s => Q.cmp(s.kappaPlus, s.kappaMinus) === 0),
      slopes: facts.slopes.map(s => S(s.kappaPlus)), slopeMin: S(facts.slopes.reduce((m, s) => (Q.cmp(s.kappaPlus, m) < 0 ? s.kappaPlus : m), facts.slopes[0].kappaPlus)),
      integral: S(facts.integral), integralFloat: D(facts.integral), integralEqualsMinusHalfPplus2T4: Q.cmp(pred, facts.integral) === 0,
      finiteDifferenceSpotChecks: fd,
      reading: 'φ* is first-order optimal among fractional perturbations: h₄ ≥ 0, vanishing exactly at the 35 edges, linearly (no zero of h₄ off the edges, no flat zero piece) — as for δ₃',
    };
  });

  /* ---- the edge-shift Hessian ---------------------------------------------------------- */
  rec.hessian = timed('hessian', () => {
    const { X, degenerate } = M.crossByGap(bcg);
    const u = { trivial: M.localU([1]), parity: M.localU([1, -1]), mod3: Q.mul(R(1, 2), M.localU([2, -1, -1])), order4: Q.mul(R(2), M.localU([1, 0, -1, 0])), order6: Q.mul(R(1, 2), M.localU([2, 1, -1, -2, -1, 1])) };
    const parts = ['Q2', 'C3', 'Q4'].map(p => [p, S(M.localU([1], p))]);
    const build = (uu, gaps) => { const H = []; for (let a = 0; a < nE; a++) { H.push([]); for (let b = 0; b < nE; b++) { if (a === b) H[a].push(Q.add(facts.slopes[a].kappaPlus, Q.mul(R(2), uu))); else { let s = R(0); for (const g of gaps) s = Q.add(s, X[g][a][b]); H[a].push(s); } } } return H; };
    const shift = moves => { const En = E.slice(); for (const [a, e] of moves) En[a + 1] += e; return { W, classes: [{ E: En, c: bcg.classes[0].c }] }; };
    const H = build(u.trivial, [1, 2, 3]);
    /* exact finite differences of F against the model, at ε = W·10⁻¹⁴ (F is exactly quadratic there) */
    const F0 = M.F(bcg), eps = W / 10n ** 14n, eR = Q.R(eps, W), e2 = Q.mul(eR, eR);
    const fdChecks = [];
    for (const [a, b] of [[0, 0], [17, 17], [34, 34], [0, 1], [3, 10], [20, 21], [5, 30]]) {
      let est;
      if (a === b) est = Q.div(Q.sub(Q.add(M.F(shift([[a, eps]])), M.F(shift([[a, -eps]]))), Q.mul(R(2), F0)), e2);
      else est = Q.div(Q.add(Q.sub(Q.sub(M.F(shift([[a, eps], [b, eps]])), M.F(shift([[a, eps]]))), M.F(shift([[b, eps]]))), F0), e2);
      fdChecks.push({ entry: [a, b], model: S(H[a][b]), finiteDifference: S(est), equal: Q.cmp(est, H[a][b]) === 0 });
    }
    const ev = M.eigSym(H.map(r => r.map(D)));
    const lo = R(822, 10000), hi = R(823, 10000);
    const shiftI = (A, s) => A.map((r, i) => r.map((v, j) => (i === j ? Q.sub(v, s) : v)));
    const split = {};
    for (const [name, uu, gaps] of [['parity (order 2)', u.parity, [2]], ['mod 3 (order 3)', u.mod3, [3]], ['order ≥ 4 with u = 0 (u_q > 0 computed for q = 4, 6)', R(0), []]]) {
      const Hs = build(uu, gaps), e = M.eigSym(Hs.map(r => r.map(D)));
      split[name] = { cross: gaps.length ? 'X^' + gaps.join('+X^') : 'none', u: S(uu), pdExact: M.ldlPivots(Hs).pd, lambdaMinFloat: e.values[0] };
    }
    /* the split model against exact multi-class F */
    const twoClass = [];
    for (const v of [[[0, 1]], [[4, 1], [7, -2], [20, 1]]]) {
      const vec = new Array(nE).fill(0); for (const [a, x] of v) vec[a] = x;
      const mk = vs => M.classCol(vs.map(w => { const En = E.slice(); for (let a = 0; a < nE; a++) if (w[a]) En[a + 1] += BigInt(w[a]) * (W / 10n ** 13n); return { E: En, c: bcg.classes[0].c }; }));
      const e13 = Q.R(W / 10n ** 13n, W), q = Hs => { let s = R(0); for (let a = 0; a < nE; a++) for (let b = 0; b < nE; b++) if (vec[a] && vec[b]) s = Q.add(s, Q.mul(Hs[a][b], R(vec[a] * vec[b]))); return s; };
      const dF2 = Q.sub(M.F(mk([vec, vec.map(x => -x)])), F0), pred2 = Q.mul(Q.mul(R(1, 2), Q.mul(e13, e13)), q(build(u.parity, [2])));
      const dF3 = Q.sub(M.F(mk([vec.map(x => 2 * x), vec.map(x => -x), vec.map(x => -x)])), F0), pred3 = Q.mul(Q.mul(e13, e13), q(build(u.mod3, [3])));
      twoClass.push({ shifts: v, parityEqual: Q.cmp(dF2, pred2) === 0, mod3Equal: Q.cmp(dF3, pred3) === 0 });
    }
    return {
      model: 'ΔF = ½εᵀHε + O(ε³), H_jj = κ_j + 2U (κ the slope of h₄ at e_j, U the local self-interaction of a sliver: 4-APs with all points within O(ε) of one edge), H_jk = Σ_g X^g_jk (pairs of slivers at distinct edges seen by gap-g point pairs; three slivers in one 4-AP cost O(ε³))',
      U: S(u.trivial), Uparts: Object.fromEntries(parts), UpartsReading: 'the cubic and quartic local terms enter at the SAME order as the Hessian along edge shifts (7/4 − 2/3 + 1/3): a certificate that drops or crudely bounds C₃, Q₄ near the edges changes the inner Hessian',
      degeneratePlacements: degenerate, diag: H.map((r, i) => S(r[i])),
      crossNonzero: { gap1: X[1].flat().filter(v => !Q.isZero(v)).length / 2, gap2: X[2].flat().filter(v => !Q.isZero(v)).length / 2, gap3: X[3].flat().filter(v => !Q.isZero(v)).length / 2 },
      H: H.map(r => r.map(S)),
      finiteDifferenceChecks: fdChecks,
      pdExact: M.ldlPivots(H).pd,
      lambdaMin: { float: ev.values[0], next: ev.values.slice(1, 4), max: ev.values[nE - 1], exactBracket: { lo: S(lo), hi: S(hi), HminusLoPD: M.ldlPivots(shiftI(H, lo)).pd, HminusHiPD: M.ldlPivots(shiftI(H, hi)).pd } },
      deltaThreeComparison: 'δ₃\'s breakpoint Hessian: λ_min ≈ 0.1266 (claimant\'s float)',
      residueClassSplits: {
        why: 'a colouring may depend on a mod m (class r edges e_j + ε_{j,r}); a pair at gap g sees classes (r, r′) with probability P_g(r,r′) = #{δ ∈ Z_m : gδ ≡ r′ − r}/m², a circulant, so the second-order form is block-diagonal by characters of Z_m: a character of order q couples the pair terms of gap g only when q | g (order 2: gap 2; order 3: gap 3; order ≥ 4: none)',
        localU: { order1: S(u.trivial), order2: S(u.parity), order3: S(u.mod3), order4: S(u.order4), order6: S(u.order6), normalisation: '(1/m)Σ_r v_r² = 1; checked additive across characters on random integer vectors, exactly, for m = 2, 3' },
        hessians: split, exactMultiClassChecks: twoClass,
        reading: 'φ* is a strict local minimiser to second order in edge directions also against parity and mod-3 splits (exact), and against order-q splits for every q whose local u_q > −7/12 (κ_min = 7/6) (u_4 = 1/12, u_6 = 11/108 exact; other q not computed). Irrational-phase modulation has product pair correlations, so only its local u changes; not computed.',
      },
    };
  });

  /* ---- the record that matters: arithmetic colourings ----------------------------------- */
  rec.arithmetic = timed('arithmetic', () => {
    const chi11 = Array.from({ length: 11 }, (_, r) => (r === 0 || M.QR11.includes(r) ? 1 : -1));
    const chi121 = Array.from({ length: 121 }, (_, r) => (r === 0 ? 1 : M.unrolledColour(r, 11, M.QR11)));
    const F11 = M.F(M.residueCol(chi11)), F121 = M.F(M.residueCol(chi121));
    const n = 16000, lp = new Int8Array(n); for (let a = 1; a <= n; a++) lp[a - 1] = M.unrolledColour(a, 11, M.QR11);
    const c = M.countDiscrete(lp);
    const samples = []; for (const x of [0.01, 0.25, 0.5, 0.75, 0.99]) for (const r of [1, 2, 0]) { let a = Math.round(x * n); while (a % 11 !== r || (r === 0 && a % 121 === 0)) a++; samples.push({ x, residue: r, firstVariation: M.flipDelta(lp, a - 1) / n }); }
    const zm = []; for (let m = 5; m <= 40; m++) { const sols = M.zmAvoiders(m, 1e6); let best = null; for (const s of sols) { const k = M.zmMono(s); if (best === null || k < best) best = k; } zm.push({ m, avoiders: sols.length, bestMono: best, residueF: best === null ? null : S(R(best, 6 * m * m)) }); }
    const B20 = [1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0].map(b => (b ? 1 : -1));
    const B22 = [1, 1, 1, 0, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 0, 0].map(b => (b ? 1 : -1));
    return {
      literature: {
        luPeng: 'L. Lu, X. Peng, Monochromatic 4-term arithmetic progressions in 2-colorings of Z_n, arXiv:1107.2888 (JCTA 2012): c₄ ≤ 1/72 ≈ 0.0138889 (their eq. (12)); 7/96 ≤ m₄(Z_p) ≤ 17/150 (Theorem 1, ordered (a,d) ∈ Z_p², d = 0 included); Conjecture 1: inf{m₄(Z_n): 4 ∤ n} = 1/12; Conjecture 2: lim m_k([n]) = lim m_k(Z_n) for k ≥ 4',
        butlerGrahamLu: 'S. Butler, R. Graham, L. Lu, Unrolling residues to avoid progressions, arXiv:1209.2687: restate 1/72 as the best known for k = 4, "far superior to the block coloring"; the rule: colour ℓ by its first nonzero base-11 digit (residue / non-residue)',
        erdosproblems1186: 'the snapshot of 2026-10-05 lists δ₃, the general random bound δ_k ≤ 1/((k−1)2^k) (1/48 at k = 4) and the F_p bounds 7/192 ≤ δ̃₄ ≤ 17/300, but no [n] bound for k = 4 below the random one (neither BCG nor Lu–Peng)',
      },
      residueZ11: { F: S(F11), theorem6: '1/(2·11·3) = 1/66', equal: Q.cmp(F11, R(1, 66)) === 0 },
      twoLevelUnrolling: { F: S(F121), formula: '(1/121)(10/6 + 1/66) = 37/2662', equal: Q.cmp(F121, R(37, 2662)) === 0 },
      fullUnrolling: { limit: '1/72', bruteForce: { n, mono: c.mono, monoOverN2: c.mono / n / n, nTimesGap: +(n * (c.mono / n / n - 1 / 72)).toFixed(4) } },
      versusBCG: { ratio: (1 / 72) / D(M.BCG_PRINTED), lowerBy: 1 - (1 / 72) / D(M.BCG_PRINTED) },
      lpFirstVariationSamples: { float: true, n, samples, reading: 'every sampled single flip raises the count: first-order stable under local flips' },
      zmAvoidersTable: { note: 'exhaustive backtracking, χ(0) = +1; reproduces W_c(4,2) = 34 (Irawan, arXiv:2509.14595): avoiders exist for m ∈ {5,…,12,14,15,18,21,22,33} and none for 13, 16, 17, 19, 20, 23–32, 34–40', table: zm },
      luPengZn: { B20: { mono: M.zmMono(B20), over: 400, printed: '9/100' }, B22: { mono: M.zmMono(B22), over: 484, printed: '42/484 = 21/242' } },
      reading: 'the best known δ₄ upper bound is an arithmetic colouring: on each residue class it is solid, and a 4-AP with d ≢ 0 (mod 11) is never monochromatic. A functional of local densities sees it as φ ≡ 0 with every pair statistic 0 — the case where the pointwise relaxation is 0. BCG\'s 36 blocks are 24.0% above it.',
    };
  });

  /* ---- the F_p analogue ------------------------------------------------------------------ */
  rec.fp = timed('fp', () => {
    const circ = (blocks, cols) => ({ W: blocks.reduce((s, b) => s + b, 0n), classes: [{ E: blocks.reduce((Ee, b) => { Ee.push(Ee[Ee.length - 1] + b); return Ee; }, [0n]), c: cols }] });
    const cols11 = Array.from({ length: 11 }, (_, r) => (r === 0 || M.QR11.includes(r) ? 1 : -1));
    const c11 = circ(new Array(11).fill(1n), cols11);
    const p = 3001, chi = new Int8Array(p); for (let a = 0; a < p; a++) chi[a] = cols11[Math.floor(11 * a / p)];
    let mono = 0; for (let d = 0; d < p; d++) for (let a = 0; a < p; a++) { const v = chi[a]; if (chi[(a + d) % p] === v && chi[(a + 2 * d) % p] === v && chi[(a + 3 * d) % p] === v) mono++; }
    const B20 = [1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0].map(b => (b ? 1 : -1));
    const q = 4001, chiq = new Int8Array(q); for (let a = 0; a < q; a++) chiq[a] = a < 20 * Math.floor(q / 20) ? B20[a % 20] : 1;
    let mq = 0; for (let d = 0; d < q; d++) for (let a = 0; a < q; a++) { const v = chiq[a]; if (chiq[(a + d) % q] === v && chiq[(a + 2 * d) % q] === v && chiq[(a + 3 * d) % q] === v) mq++; }
    return {
      functional: 'exactly, for EVERY colouring of Z_p (p prime): #mono (a,d)/p² = (1/8)(1 + 6μ² + Λ₄(χ)), because (a,d) ↦ (a+id, a+jd) is a bijection of Z_p² — every pair term is μ². The quartic Λ₄ is the whole problem; there is no position variable to centre a block expansion in.',
      normalisation: 'Lu–Peng m₄(Z_p): ordered (a,d), d = 0 included, random 1/8; erdosproblems δ̃₄ = m₄/2 (random 1/16): 7/192 ≤ δ̃₄ ≤ 17/300',
      circleBlocks: { colouring: '11 equal circle blocks, quadratic-residue pattern', exact: S(M.circleSweep(c11, M.I_MONO)), Lambda4: S(M.circleSweep(c11, M.I_QUART)), bruteForceZ3001: mono / p / p, reading: 'only 0.8% below random: on the circle the QR pattern does nothing; its power on [n] is arithmetic, not positional' },
      luPengB20: { construction: 'B20 repeated, remainder arbitrary (their Theorem 3, odd n)', p: q, monoOverP2: mq / q / q, float: true, printed: '17/150 ≈ 0.113333' },
      sameThreeQuestions: {
        functional: 'μ² pair terms + the quartic; no reduction (the pointwise relaxation is 0 here too)',
        candidate: 'Lu–Peng\'s B20-periodic colouring, verified numerically above; it is periodic, not a circle block colouring',
        firstOrder: 'not set up: with no position variable the δ₃ expansion has nothing to expand in; the natural analogue (perturbing the periodic word) is a finite search, and the lower-bound side is Fourier/U³ counting (Wolf, Lu–Peng), not a local functional',
      },
    };
  });

  /* ---- 4. certificate feasibility (sizes; the cell count is float bookkeeping) ------------ */
  rec.feasibility = timed('feasibility', () => {
    const Wn = Number(W), pts = new Set(E.map(e => Number(e) / Wn)); for (let k = 0; k <= 128; k++) pts.add(k / 128);
    const Eg = [...pts].sort((a, b) => a - b), cells = Eg.length - 1, seen = new Set();
    M.sweep({ W: 1, classes: [{ E: Eg, c: new Array(cells).fill(1) }] }, idx => { seen.add(((idx[0] * 1024 + idx[1]) * 1024 + idx[2]) * 1024 + idx[3]); return 0; });
    const binom = (n, k) => { let r = 1; for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1); return Math.round(r); };
    return {
      grid: 'uniform 1/128 plus the 35 edges', cells, cellFourTuplesWithQuarticMass: seen.size,
      degree2: { momentMatrix: cells + 1, note: 'δ₃ size; but L(y) cannot be degree 2 here: ∬σσσσ over a cell 4-tuple region is not a function of cell averages' },
      degree4dense: { momentMatrix: binom(cells + 2, 2), moments: binom(cells + 4, 4) },
      blockOnlyInner: 'the inner zero-gap step needs h₄ (✓ exact) and a PD edge Hessian (✓ exact, λ_min ≈ 0.0822) — but the local C₃ + Q₄ (−2/3 + 1/3 of U = 17/12) enter at Hessian order, so the inner certificate must carry cubic/quartic sliver geometry at edge resolution; and the [−1,1] relaxation of F is not the weak-* closure of ±1 colourings (the quartic is not weakly continuous), so even the block-only theorem needs a different relaxation',
    };
  });

  /* ---- 2b. the float search for a better block colouring ---------------------------------- */
  if (opts.search) {
    const runs = [];
    for (const f of fs.readdirSync(opts.search).filter(f => /^search-.*\.json$/.test(f)).sort()) {
      const r = JSON.parse(fs.readFileSync(path.join(opts.search, f), 'utf8'));
      runs.push({ mode: r.mode, seed: r.seed, hops: r.hops, blocks: r.blocks, F: r.F, minusBCG: r.minusBCG, seconds: r.seconds });
    }
    rec.search = { float: true, method: 'search.js: basin hopping (merge / split / jiggle, Newton polish on F); modes: bcg = start at BCG\'s edges, basin = random 20–49-block start', noiseFloor: 1e-12, runs, belowBCG: runs.filter(r => r.minusBCG < -1e-12).length, reading: 'the BCG starts accepted no move in 80 hops (their −1e−17 is float noise); random starts end 3–6% above BCG' };
  }

  rec.verdict = {
    target: 'delta4-centring-transfer',
    verdict: 'BLOCKED',
    by: [
      'the candidate: BCG\'s 36 blocks (F exactly their printed 0.0172203) are not the δ₄ record — Lu–Peng 2011 give c₄ ≤ 1/72 ≈ 0.0138889 by an arithmetic (residue-unrolling) colouring, re-verified here; a block-density functional cannot represent it',
      'the reduction: k = 4 has no PRS-type reduction — gap-3 drops (a sum of squares), but the quartic term is not a functional of local densities, and the pointwise relaxation that keeps it evaluates to 0',
    ],
    whatDoesTransfer: 'within block colourings BCG\'s φ* passes every local test exactly: h₄ ≥ 0 with zeros exactly at the 35 edges, edge Hessian PD (λ_min ∈ [0.0822, 0.0823]), PD also against residue-class splits — "BCG optimal among block colourings" is a well-posed, open, much weaker question, with degree-4-type certificates',
  };
  rec.timingsSeconds = timings;
  return rec;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const opts = { record: args.includes('--record'), search: args.includes('--search') ? args[args.indexOf('--search') + 1] : null };
  const t0 = Date.now();
  const rec = run(opts);
  rec.timingsSeconds.total = (Date.now() - t0) / 1000;
  const out = JSON.stringify(rec, null, 1);
  if (opts.record) { const p = path.join(__dirname, '..', '..', 'certs', 'delta4-probe.json'); fs.writeFileSync(p, out + '\n'); console.log('wrote', p); }
  console.log('F(BCG) = printed:', rec.candidate.equalsPrinted, '| h4 >= 0, zeros = edges:', rec.h4.negativeCandidates === 0 && rec.h4.zerosExactlyTheEdges, '| H PD:', rec.hessian.pdExact, 'lambda_min', rec.hessian.lambdaMin.float.toFixed(5), '| 1/66, 37/2662 exact:', rec.arithmetic.residueZ11.equal, rec.arithmetic.twoLevelUnrolling.equal, '| verdict', rec.verdict.verdict, '|', rec.timingsSeconds.total, 's');
}

module.exports = { run };
