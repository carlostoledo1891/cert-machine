/* model.js — monochromatic 4-term progressions of block colourings, exactly.
   instruments/delta4 · cert-machine

   F(φ) = lim #mono 4-APs / n² for the colouring a ↦ φ(a/n). With x = a/n, t = d/n,
   Δ = {x ≥ 0, t ≥ 0, x + 3t ≤ 1} (|Δ| = 1/6), and 1[x₁=…=x₄] = (1 + Σ_{i<j} xᵢxⱼ + x₁x₂x₃x₄)/8,

     F(φ) = 1/48 + (1/8) Σ_{i<j} ∬_Δ φ(x+it)φ(x+jt) + (1/8) ∬_Δ φ(x)φ(x+t)φ(x+2t)φ(x+3t).

   A colouring here is { W, classes: [{ E, c }, …] }: class r ∈ Z_m colours a ≡ r (mod m) by the
   blocks E[0]=0 < E[1] < … < E[K]=W (units 1/W), block k coloured c[k] = ±1. m = 1 is an
   ordinary block colouring; m > 1 lets a colouring depend on a mod m, which F of a single
   φ cannot see (the 4-AP with residue ρ and common difference δ puts point i in class
   ρ + iδ, and the limit averages over (ρ, δ) ∈ Z_m²).

   ONE sweep does every integral. Positions are scaled by 6 (P = 6Wx, τ = 6Wt) so that every
   kink of the section length L(τ) = |{P : integrand ≠ 0}| — where two lines P = 6E − iτ
   cross, τ = 6(E − E′)/g, g ∈ {1,2,3} — is an integer. L is linear between kinks, so the
   trapezoid rule on the kink list is exact. The same code runs on BigInt (exact: every
   number below is an integer until the one final division) or on Number (a float proposal).

   MIT licensed. Part of cert-machine. */
'use strict';

const Q = require('../interval/rational.js');

/* Butler–Costello–Graham 2010, Appendix: the locally optimal 36-block pattern for 4-APs
   and the coefficient they print for it (Experiment. Math. 19 (2010) 399–411, p. 15). */
const BCG_BLOCKS = `566124189415440472939626834822903743300467940483 115903533761943477398551818347715476722877927241
568011813340950665677009286694526323061781532322 472083073090028493914605548954507028673457587863
174690683867336844297305424871758992360029965453 98464537567500111285074159909918993309405119848
737681146409933099806596775369238915383890216793 881071132072892536672404740128385947619685842609
387204684955306822603896642766296540832568256888 340852889156784985628080980878507258595675472221
1398355239284691808801098670395696996980804292522 2015438904391090234472652819593929714355629836078
354924006068259988552316716495705798216298952575 917029329994691011286378833655488533756529343857
1246774229265384930907724953794401373314144038191 543203071437439856124749368271693956037186323582
2179716742907087903057122171392866104311765026441 2172387005301046067153961748343296914044366107569
546203621232713973260465876924982631234637232779 1296607046453245562932414262768745367411919249702
848633230480614872785768439513578746631939174778 332362434790023921274974476865878572983006589230
2079963873190082657423397539748746717308015584742 1352139932444260494597496699603210730948918467199
339606780510267312616862401149984633870549046619 373718051493152648659948917556716014372715915533
786614601718483336599780069288734659594156639775 660138925526725209837882202781409057453701881412
51505717888223458966003645016452574647172214751 208563593370975774208121482104389596165334050300
660659764939424259451601477074423264167731648445 458220356230536594713018106829384942175966684332
25106402444485772567927008361180285102508619312 396852300398188165681981456085190506968094545183
59492524857712314099066167971046557078820629622 398049321798723913182570904641775780071858799086`
  .split(/\s+/).map(BigInt);
const BCG_PRINTED = Q.R(1793962930221810091247020524013365938030467437975n, 104177418768222598213753754515890676996254443021344n);

const isBig = x => typeof x === 'bigint';
const T_ = proto => (isBig(proto) ? BigInt : Number);

/* blocks (BigInt or Number lengths), alternating colours starting with +1 */
function blocksCol(blocks, first) {
  const T = T_(blocks[0]);
  const E = [T(0)];
  for (const b of blocks) E.push(E[E.length - 1] + b);
  const c = blocks.map((_, k) => ((k % 2 === 0) === (first !== -1) ? 1 : -1));
  return { W: E[E.length - 1], classes: [{ E, c }] };
}
/* class-dependent: one { E, c } per residue, all with the same W */
function classCol(list) {
  const W = list[0].E[list[0].E.length - 1];
  for (const k of list) if (k.E[k.E.length - 1] !== W) throw new Error('classCol: classes must share W');
  return { W, classes: list };
}

/* ---- the sweep ---------------------------------------------------------------
   f(idx, cls, col) → weight (same number type) for the 4-AP whose point i lies in block
   idx[i] of class cls[i]. Returns 2·m²·36W²·∬_Δ (average over (ρ,δ) of f) — an integer in
   exact mode — together with that denominator. */
function kinksOf(col) {
  const T = T_(col.W), tmax = T(2) * col.W;
  const vals = new Set();
  const pts = [];
  for (const k of col.classes) for (const e of k.E) { const s = String(e); if (!vals.has(s)) { vals.add(s); pts.push(T(6) * e); } }
  pts.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const ks = [T(0), tmax];
  for (let a = 0; a < pts.length; a++) for (let b = 0; b < a; b++) {
    const d = pts[a] - pts[b];
    for (const g of [1, 2, 3]) { const t = d / T(g); if (t > T(0) && t < tmax) ks.push(t); }
  }
  ks.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const out = [ks[0]];
  for (const t of ks) if (t !== out[out.length - 1]) out.push(t);
  return out;
}

function sectionLength(col, tau, f) {
  const T = T_(col.W), m = col.classes.length, W6 = T(6) * col.W;
  const Pmax = W6 - T(3) * tau;
  if (Pmax <= T(0)) return T(0);
  let total = T(0);
  const idx = [0, 0, 0, 0], cls = [0, 0, 0, 0], lists = [[], [], [], []], ptr = [0, 0, 0, 0];
  for (let rho = 0; rho < m; rho++) for (let del = 0; del < m; del++) {
    for (let i = 0; i < 4; i++) {
      const r = (rho + i * del) % m, E = col.classes[r].E, it = T(i) * tau;
      cls[i] = r;
      let k = 0;
      while (k + 1 < E.length - 1 && T(6) * E[k + 1] <= it) k++;
      idx[i] = k;
      const L = [];
      for (let q = k + 1; q < E.length - 1; q++) { const P = T(6) * E[q] - it; if (P >= Pmax) break; L.push(P); }
      lists[i] = L; ptr[i] = 0;
    }
    let cur = T(0);
    for (;;) {
      let best = -1, bp = null;
      for (let i = 0; i < 4; i++) if (ptr[i] < lists[i].length && (best < 0 || lists[i][ptr[i]] < bp)) { best = i; bp = lists[i][ptr[i]]; }
      const end = best < 0 ? Pmax : bp;
      if (end > cur) { const w = f(idx, cls, col); if (w) total += w * (end - cur); cur = end; }
      if (best < 0) break;
      idx[best]++; ptr[best]++;
    }
  }
  return total;
}

function sweep(col, f, kinks) {
  const T = T_(col.W), m = col.classes.length;
  const ks = kinks || kinksOf(col);
  let acc = T(0), prevT = null, prevL = null;
  for (const t of ks) {
    const L = sectionLength(col, t, f);
    if (prevT !== null) acc += (prevL + L) * (t - prevT);
    prevT = t; prevL = L;
  }
  const den = T(2 * m * m * 36) * col.W * col.W;
  return isBig(acc) ? Q.R(acc, den) : acc / den;
}

/* integrands */
const colourOf = (idx, cls, col, i) => col.classes[cls[i]].c[idx[i]];
const I_ONE = (idx, cls, col) => (isBig(col.W) ? 1n : 1);
const I_MONO = (idx, cls, col) => {
  const a = colourOf(idx, cls, col, 0);
  const mono = colourOf(idx, cls, col, 1) === a && colourOf(idx, cls, col, 2) === a && colourOf(idx, cls, col, 3) === a;
  return isBig(col.W) ? (mono ? 1n : 0n) : (mono ? 1 : 0);
};
const I_PAIR = (i, j) => (idx, cls, col) => { const v = colourOf(idx, cls, col, i) * colourOf(idx, cls, col, j); return isBig(col.W) ? BigInt(v) : v; };
const I_QUART = (idx, cls, col) => { let v = 1; for (let i = 0; i < 4; i++) v *= colourOf(idx, cls, col, i); return isBig(col.W) ? BigInt(v) : v; };

const F = (col, kinks) => sweep(col, I_MONO, kinks);

/* the decomposition F = (1/8)(|Δ| + Σ P_ij + T4), each term its own sweep */
const PAIRS = [[0, 1], [1, 2], [2, 3], [0, 2], [1, 3], [0, 3]];
function decompose(col) {
  const ks = kinksOf(col);
  const out = { area: sweep(col, I_ONE, ks), pairs: {}, quart: sweep(col, I_QUART, ks), F: sweep(col, I_MONO, ks) };
  for (const [i, j] of PAIRS) out.pairs[`${i}${j}`] = sweep(col, I_PAIR(i, j), ks);
  return out;
}

/* ---- the first variation h₄ (single class) -------------------------------------
   h₄(a) = lim (F(φ with [a, a+ε] flipped) − F(φ))/ε
         = Σ_i ∫ dt [1(the other three points all of the colour opposite to a's)
                    − 1(the other three all of a's colour)]
   over the t for which the 4-AP with point i at a lies in [0,1]. Positions are scaled by
   60 (A = 60W·a) and t by 360W (τ₆ = 6·60W·t); then every t-breakpoint 6(60E − A)/d is
   an integer and h₄(a) = acc/(360W) with acc an integer. h₄ is linear in a between the
   candidates A = (d·P′ − d′·P)/(d − d′) (P, P′ ∈ 60·edges, d ≠ d′ ∈ ±{1,2,3}): those are
   the only places two breakpoints, or a breakpoint and an end of the t-range, can meet. */
function h4Acc(col, A, side) {
  if (col.classes.length !== 1) throw new Error('h4: single-class colourings only');
  const T = T_(col.W), { E, c } = col.classes[0], W60 = T(60) * col.W, K = E.length - 1;
  const E60 = E.map(e => T(60) * e);
  /* the block of a: side +1 → (A, A+), side −1 → (A−, A) */
  const blockAt = (x, s) => { let k = 0; if (s > 0) { while (k + 1 < K && E60[k + 1] <= x) k++; } else { while (k + 1 < K && E60[k + 1] < x) k++; } return k; };
  const ca = c[blockAt(A, side)];
  let acc = T(0);
  for (let i = 0; i < 4; i++) {
    let tmax = null;
    if (i > 0) tmax = T(6) * A / T(i);
    if (i < 3) { const u = T(6) * (W60 - A) / T(3 - i); tmax = tmax === null || u < tmax ? u : tmax; }
    if (tmax <= T(0)) continue;
    const others = [];
    for (let j = 0; j < 4; j++) if (j !== i) {
      const d = j - i, k0 = blockAt(A, d > 0 ? 1 : -1), bps = [];
      if (d > 0) { for (let q = k0 + 1; q < K; q++) { const t = T(6) * (E60[q] - A) / T(d); if (t >= tmax) break; bps.push(t); } }
      else { for (let q = k0; q >= 1; q--) { const t = T(6) * (A - E60[q]) / T(-d); if (t >= tmax) break; bps.push(t); } }
      others.push({ k: k0, step: d > 0 ? 1 : -1, bps, p: 0 });
    }
    let cur = T(0);
    for (;;) {
      let best = -1, bp = null;
      for (let o = 0; o < 3; o++) { const ob = others[o]; if (ob.p < ob.bps.length && (best < 0 || ob.bps[ob.p] < bp)) { best = o; bp = ob.bps[ob.p]; } }
      const end = best < 0 ? tmax : bp;
      if (end > cur) {
        const c0 = c[others[0].k], c1 = c[others[1].k], c2 = c[others[2].k];
        if (c0 === c1 && c1 === c2) acc += c0 === ca ? -(end - cur) : (end - cur);
        cur = end;
      }
      if (best < 0) break;
      others[best].k += others[best].step; others[best].p++;
    }
  }
  return acc;
}

function h4Candidates(col) {
  const T = T_(col.W), W60 = T(60) * col.W;
  const P = col.classes[0].E.map(e => T(60) * e);
  const D = [-3, -2, -1, 1, 2, 3];
  const seen = new Set(), out = [];
  const add = a => { if (a >= T(0) && a <= W60) { const s = String(a); if (!seen.has(s)) { seen.add(s); out.push(a); } } };
  for (const p of P) add(p);
  for (const p of P) for (const q of P) for (const d of D) for (const e of D) if (d !== e) {
    const num = T(d) * q - T(e) * p, den = T(d - e);
    if (isBig(num)) { if (num % den === 0n) add(num / den); else throw new Error('h4Candidates: non-integral candidate'); }
    else add(num / den);
  }
  out.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return out;
}

/* the whole table: at each candidate, the left and right values (they differ only at
   an edge, where a's own colour changes). acc units: h₄ = acc/(360W), A units 1/(60W). */
function h4Table(col) {
  const T = T_(col.W), E60 = new Set(col.classes[0].E.map(e => String(T(60) * e)));
  const A = h4Candidates(col), rows = [];
  for (const a of A) {
    const isEdge = E60.has(String(a));
    const L = a > T(0) ? h4Acc(col, a, -1) : null;
    const R = a < T(60) * col.W ? (isEdge ? h4Acc(col, a, 1) : L) : null;
    rows.push({ A: a, L: L === null ? R : L, R: R === null ? L : R, edge: isEdge });
  }
  return rows;
}

/* facts about h₄ from the table, exactly */
function h4Facts(col, rows) {
  const T = T_(col.W), W = col.W, zero = T(0);
  let minAcc = null, minAt = null;
  const zeros = [], negatives = [];
  for (const r of rows) for (const v of [r.L, r.R]) {
    if (minAcc === null || v < minAcc) { minAcc = v; minAt = r.A; }
    if (v < zero) negatives.push(r.A);
  }
  for (const r of rows) if (r.L === zero || r.R === zero) zeros.push({ A: r.A, edge: r.edge, L: r.L, R: r.R });
  /* ∫h₄ (trapezoid on each linear piece; one-sided values at the ends of each piece) */
  let twice = zero;
  for (let k = 0; k + 1 < rows.length; k++) twice += (rows[k].R + rows[k + 1].L) * (rows[k + 1].A - rows[k].A);
  const integral = Q.R(twice, 2n * 360n * 60n * W * W);
  /* one-sided slopes at interior edges, true units: dh/da = Δacc/(6·ΔA) */
  const slopes = [];
  for (let k = 1; k + 1 < rows.length; k++) if (rows[k].edge) {
    const right = Q.R(rows[k + 1].R - rows[k].R, 6n * (rows[k + 1].A - rows[k].A));
    const left = Q.R(rows[k - 1].L - rows[k].L, 6n * (rows[k].A - rows[k - 1].A));
    slopes.push({ A: rows[k].A, jump: rows[k].R - rows[k].L, kappaPlus: right, kappaMinus: left });
  }
  return { minAcc, minAt, min: Q.R(minAcc, 360n * W), zeros, negatives, integral, slopes };
}

/* ---- the edge-shift Hessian -------------------------------------------------------
   Shift interior edge j by ε_j (> 0: the block to its right shrinks). To second order
     ΔF = Σ_j (½κ_j^{sgn}ε_j² + U^{sgn}ε_j²) + Σ_{j<j′} X_{jj′} ε_j ε_{j′}
   — the first-order term ∫h₄σ over the slivers (h₄ grows like κ|a − e| away from an edge
   where it vanishes), the local self-interaction U of a sliver with itself (all four
   points within O(ε) of one edge: universal, computed in the local model below), and
   the cross-interaction of two slivers at distinct edges, which only the pair term
   Q₂(σ) = ∬_Δ Σ_{i<i′} s_i s_{i′} 1[s_k = s_l] σ(x+it)σ(x+i′t) can see (three slivers in one
   4-AP cost O(ε³)). For points at (u, v) = (e_j, e_j′), u < v, in the region of the pair
   (i, i′) with gap g = i′ − i, the term is (1/g) c_j c_{j′} 1[s_k = s_l] ε_j ε_{j′}, c_j the
   colour of the block right of e_j. X splits by gap: X = X¹ + X² + X³. */
function crossByGap(col) {
  const { E, c } = col.classes[0], K = E.length - 1, W = col.W;
  const n = K - 1;                                           /* interior edges 1..K−1 */
  const X = { 1: [], 2: [], 3: [] };
  for (const g of [1, 2, 3]) for (let a = 0; a < n; a++) X[g].push(new Array(n).fill(null).map(() => Q.R(0n)));
  let degenerate = 0;
  const colourAt = num => {                                  /* num/(den) position as rational {n,d} */
    for (let k = 0; k < K; k++) {
      const lo = Q.R(E[k], W), hi = Q.R(E[k + 1], W);
      if (Q.cmp(num, lo) > 0 && Q.cmp(num, hi) < 0) return c[k];
      if (Q.cmp(num, lo) === 0 || Q.cmp(num, hi) === 0) return 0;
    }
    return null;
  };
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) {
    const u = Q.R(E[a + 1], W), v = Q.R(E[b + 1], W);
    for (let i = 0; i < 4; i++) for (let i2 = i + 1; i2 < 4; i2++) {
      const g = i2 - i, t = Q.div(Q.sub(v, u), Q.R(BigInt(g)));
      const x = Q.sub(u, Q.mul(Q.R(BigInt(i)), t));
      const top = Q.add(x, Q.mul(Q.R(3n), t));
      const sx = Q.sign(x), st = Q.cmp(top, Q.R(1n));
      if (sx < 0 || st > 0) continue;
      if (sx === 0 || st === 0) { degenerate++; continue; }
      const [k, l] = [0, 1, 2, 3].filter(z => z !== i && z !== i2);
      const sk = colourAt(Q.add(x, Q.mul(Q.R(BigInt(k)), t))), sl = colourAt(Q.add(x, Q.mul(Q.R(BigInt(l)), t)));
      if (sk === 0 || sl === 0) { degenerate++; continue; }
      if (sk !== sl) continue;
      const w = Q.R(BigInt(c[a + 1] * c[b + 1]), BigInt(g));
      X[g][a][b] = Q.add(X[g][a][b], w);
      X[g][b][a] = Q.add(X[g][b][a], w);
    }
  }
  return { X, degenerate };
}

/* The local model: one edge at 0, colour +1 left, −1 right; classes r ∈ Z_m have their
   edge moved to ε_r (integers, a common scale). U = the exact change of the local count
   carried by 4-APs with at least two points in the slivers, i.e. the Q₂ + C₃ + Q₄ part of
   the expansion E(σ) = ∫h₄σ + Q₂ + C₃ + Q₄, with σ_i = 1 on point i's own sliver:
     Q₂ = Σ_{i<i′} s_i s_{i′} 1[s_k = s_l] σ_i σ_{i′},  C₃ = −S Σ_{i<i′<i″} σσσ,  Q₄ = 2S σ₀σ₁σ₂σ₃,
   S = s₀s₁s₂s₃ (the base colours). Built on the general sweep: the classes become block
   lists [0, O+min(0,ε), O+max(0,ε), 2O] (O an offset that keeps every contributing 4-AP
   inside [0, 2O]); returned in units of ε-scale², i.e. ∬ dX dT. */
function localU(eps, part) {
  const use = k => !part || part === k;
  const m = eps.length, M = eps.reduce((s, e) => (Math.abs(e) > s ? Math.abs(e) : s), 0);
  const O = BigInt(8 * M + 8);
  const classes = eps.map(e => {
    const lo = O + BigInt(Math.min(0, e)), hi = O + BigInt(Math.max(0, e));
    const E = [0n]; if (lo > 0n) E.push(lo); if (hi > lo) E.push(hi); E.push(2n * O);
    /* blocks: left (base +1), sliver (if any), right (base −1); record which is which */
    const kinds = [];
    if (lo > 0n) kinds.push('L'); if (hi > lo) kinds.push(e > 0 ? 'SR' : 'SL'); kinds.push('R');
    return { E, c: kinds.map(k => (k === 'L' || k === 'SL' ? 1 : -1)), kinds };
  });
  const col = { W: 2n * O, classes };
  const f = (idx, cls) => {
    const s = [], sg = [];
    for (let i = 0; i < 4; i++) { const kd = classes[cls[i]].kinds[idx[i]]; s.push(kd === 'L' || kd === 'SL' ? 1 : -1); sg.push(kd === 'SL' || kd === 'SR' ? 1 : 0); }
    const S = s[0] * s[1] * s[2] * s[3];
    let v = 0;
    if (use('Q2')) for (const [i, j] of PAIRS) if (sg[i] && sg[j]) { const [k, l] = [0, 1, 2, 3].filter(z => z !== i && z !== j); if (s[k] === s[l]) v += s[i] * s[j]; }
    if (use('C3')) for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) for (let k = j + 1; k < 4; k++) if (sg[i] && sg[j] && sg[k]) v -= S;
    if (use('Q4') && sg[0] && sg[1] && sg[2] && sg[3]) v += 2 * S;
    return BigInt(v);
  };
  const r = sweep(col, f);                                   /* = (1/(2O)²)·∬ dX dT in O-units */
  return Q.mul(r, Q.R(4n * O * O));
}

/* ---- the circle (the F_p analogue) ---------------------------------------------------
   For a block colouring φ of T = R/Z (E[0]=0 < … < E[K]=N, units 1/N) and p → ∞,
   #{(a, d) ∈ Z_p² : a, a+d, a+2d, a+3d monochromatic under a ↦ φ(a/p)}/p² → ∬_{T²} f.
   Every pair term is (∫φ)² on the circle (the map (x,t) ↦ (x+it, x+jt) preserves Haar
   measure), so the circle value is (1/8)(1 + 6μ² + Λ₄(φ)). Same scaling as the line:
   P, τ ∈ [0, 6N); kinks where (j−i)τ ≡ 6(E′ − E) (mod 6N). */
function circleSweep(col, f) {
  const T = T_(col.W), N = col.W, N6 = T(6) * N, { E } = col.classes[0], K = E.length - 1;
  const ks = [T(0), N6];
  for (let q = 0; q < K; q++) for (let q2 = 0; q2 < K; q2++) for (const g of [1, 2, 3]) for (let z = -3; z <= 3; z++) {
    const num = T(6) * (E[q2] - E[q]) + T(z) * N6;
    const t = num / T(g);
    if (t > T(0) && t < N6) ks.push(t);
  }
  ks.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const kinks = [ks[0]]; for (const t of ks) if (t !== kinks[kinks.length - 1]) kinks.push(t);
  const idx = [0, 0, 0, 0], cls = [0, 0, 0, 0];
  const section = tau => {
    const lists = [];
    for (let i = 0; i < 4; i++) {
      let s = (T(i) * tau) % N6; if (s < T(0)) s += N6;
      let k = 0; while (k + 1 < K && T(6) * E[k + 1] <= s) k++;
      idx[i] = k;
      const L = [];
      for (let q = k + 1; q < K; q++) L.push(T(6) * E[q] - s);
      for (let q = 0; q <= k; q++) { const P = T(6) * E[q] + N6 - s; if (P < N6) L.push(P); }
      lists.push(L);
    }
    const ptr = [0, 0, 0, 0];
    let cur = T(0), total = T(0);
    for (;;) {
      let best = -1, bp = null;
      for (let i = 0; i < 4; i++) if (ptr[i] < lists[i].length && (best < 0 || lists[i][ptr[i]] < bp)) { best = i; bp = lists[i][ptr[i]]; }
      const end = best < 0 ? N6 : bp;
      if (end > cur) { const w = f(idx, cls, col); if (w) total += w * (end - cur); cur = end; }
      if (best < 0) break;
      idx[best] = (idx[best] + 1) % K; ptr[best]++;
    }
    return total;
  };
  let acc = T(0), pt = null, pl = null;
  for (const t of kinks) { const L = section(t); if (pt !== null) acc += (pl + L) * (t - pt); pt = t; pl = L; }
  const den = T(2) * N6 * N6;
  return isBig(acc) ? Q.R(acc, den) : acc / den;
}
/* ---- the discrete count, for the brute-force checks --------------------------------
   chi: Int8Array, chi[a] for a = 0..n−1 (the integer a+1). Returns exact integer sums. */
function countDiscrete(chi) {
  const n = chi.length;
  let mono = 0, quart = 0, total = 0;
  const pair = { '01': 0, '12': 0, '23': 0, '02': 0, '13': 0, '03': 0 };
  for (let d = 1; 3 * d < n; d++) for (let a = 0; a + 3 * d < n; a++) {
    const x0 = chi[a], x1 = chi[a + d], x2 = chi[a + 2 * d], x3 = chi[a + 3 * d];
    total++;
    if (x0 === x1 && x1 === x2 && x2 === x3) mono++;
    quart += x0 * x1 * x2 * x3;
    pair['01'] += x0 * x1; pair['12'] += x1 * x2; pair['23'] += x2 * x3; pair['02'] += x0 * x2; pair['13'] += x1 * x3; pair['03'] += x0 * x3;
  }
  return { n, total, mono, quart, pair };
}
/* change in #mono 4-APs of chi if chi[a] is flipped (the discrete first variation) */
function flipDelta(chi, a) {
  const n = chi.length, s = chi[a];
  let delta = 0;
  for (let i = 0; i < 4; i++) {
    const dmax = Math.min(i > 0 ? Math.floor(a / i) : Infinity, i < 3 ? Math.floor((n - 1 - a) / (3 - i)) : Infinity);
    for (let d = 1; d <= dmax; d++) {
      let same = 0;
      for (let j = 0; j < 4; j++) if (j !== i && chi[a + (j - i) * d] === s) same++;
      if (same === 3) delta--; else if (same === 0) delta++;
    }
  }
  return delta;
}
/* the colouring of [n] a block colouring induces: a (1-based) gets the block containing
   (a − ½)/n, so a block [E_k, E_{k+1}]/W holds the integers with E_k·n/W < a − ½ < … */
function discretise(col, n) {
  const m = col.classes.length, chi = new Int8Array(n), W = Number(col.W);
  for (let a = 1; a <= n; a++) {
    const { E, c } = col.classes[a % m];
    const x = (a - 0.5) / n * W;
    let k = 0; while (k + 1 < E.length - 1 && Number(E[k + 1]) <= x) k++;
    chi[a - 1] = c[k];
  }
  return chi;
}

/* ---- arithmetic colourings (residues mod m) ---------------------------------------
   A colouring of [n] that depends only on a mod m is the class colouring with every
   class one solid block; its F is (1/6)·#{(r, δ) ∈ Z_m² : r, r+δ, r+2δ, r+3δ mono}/m².
   Lu–Peng's colouring unrolls the quadratic-residue colouring of Z_11: a gets the colour
   of the first nonzero base-11 digit of a (residue → +1, non-residue → −1). */
const QR11 = [1, 3, 4, 5, 9];
const residueCol = chi => classCol(chi.map(c => ({ E: [0n, 1n], c: [c] })));
function unrolledColour(a, m, white) { let x = a; while (x % m === 0) x /= m; return white.includes(x % m) ? 1 : -1; }
/* #{(r, δ) ∈ Z_m² : r, r+δ, r+2δ, r+3δ monochromatic}, trivial and degenerate included */
function zmMono(chi) {
  const m = chi.length; let c = 0;
  for (let d = 0; d < m; d++) for (let a = 0; a < m; a++) { const v = chi[a]; if (chi[(a + d) % m] === v && chi[(a + 2 * d) % m] === v && chi[(a + 3 * d) % m] === v) c++; }
  return c;
}
/* every 2-colouring of Z_m (χ(0) = +1) with no monochromatic 4-AP on four distinct
   residues, by backtracking (exhaustive: the search space is closed under nothing) */
function zmAvoiders(m, limit) {
  const byMax = Array.from({ length: m }, () => []);
  for (let d = 1; d < m; d++) for (let a = 0; a < m; a++) {
    const s = [a, (a + d) % m, (a + 2 * d) % m, (a + 3 * d) % m];
    if (new Set(s).size === 4) byMax[Math.max(...s)].push(s);
  }
  const chi = new Int8Array(m), sols = [];
  (function rec(i) {
    if (sols.length >= limit) return;
    if (i === m) { sols.push(Array.from(chi)); return; }
    for (const c of (i === 0 ? [1] : [1, -1])) {
      chi[i] = c;
      if (byMax[i].every(s => !(chi[s[1]] === chi[s[0]] && chi[s[2]] === chi[s[0]] && chi[s[3]] === chi[s[0]]))) rec(i + 1);
    }
    chi[i] = 0;
  })(0);
  return sols;
}

/* ---- small linear algebra -------------------------------------------------------- */
/* exact LDLᵀ: all pivots > 0 ⇔ positive definite (Sylvester). Rational matrix in, the
   pivot signs and the first non-positive pivot out. */
function ldlPivots(A) {
  const n = A.length, M = A.map(r => r.slice());
  const piv = [];
  for (let k = 0; k < n; k++) {
    const p = M[k][k]; piv.push(p);
    if (Q.sign(p) <= 0) return { pd: false, at: k, pivots: piv };
    for (let i = k + 1; i < n; i++) {
      if (Q.isZero(M[i][k])) continue;
      const f = Q.div(M[i][k], p);
      for (let j = k + 1; j < n; j++) if (!Q.isZero(M[k][j])) M[i][j] = Q.sub(M[i][j], Q.mul(f, M[k][j]));
    }
  }
  return { pd: true, pivots: piv };
}
/* float symmetric eigenvalues (cyclic Jacobi) — a proposal, never a decision */
function eigSym(A) {
  const n = A.length, a = A.map(r => r.slice()), V = a.map((_, i) => a.map((__, j) => (i === j ? 1 : 0)));
  for (let sweepN = 0; sweepN < 100; sweepN++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += a[p][q] * a[p][q];
    if (off < 1e-30) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(a[p][q]) < 1e-300) continue;
      const th = (a[q][q] - a[p][p]) / (2 * a[p][q]);
      const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1));
      const cs = 1 / Math.sqrt(t * t + 1), sn = t * cs;
      for (let k = 0; k < n; k++) { const x = a[k][p], y = a[k][q]; a[k][p] = cs * x - sn * y; a[k][q] = sn * x + cs * y; }
      for (let k = 0; k < n; k++) { const x = a[p][k], y = a[q][k]; a[p][k] = cs * x - sn * y; a[q][k] = sn * x + cs * y; }
      for (let k = 0; k < n; k++) { const x = V[k][p], y = V[k][q]; V[k][p] = cs * x - sn * y; V[k][q] = sn * x + cs * y; }
    }
  }
  const vals = a.map((r, i) => r[i]);
  const order = vals.map((v, i) => i).sort((i, j) => vals[i] - vals[j]);
  return { values: order.map(i => vals[i]), vectors: order.map(i => V.map(r => r[i])) };
}

module.exports = {
  BCG_BLOCKS, BCG_PRINTED, PAIRS, blocksCol, classCol, kinksOf, sectionLength, sweep, F, decompose,
  I_ONE, I_MONO, I_PAIR, I_QUART, circleSweep, h4Acc, h4Candidates, h4Table, h4Facts, crossByGap, localU,
  countDiscrete, flipDelta, discretise, QR11, residueCol, unrolledColour, zmMono, zmAvoiders, ldlPivots, eigSym,
};
