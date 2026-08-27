
/* water_value_tree.js — the STOCHASTIC water value on a scenario tree, solved
   exactly and certified: the discrete-time content of Proposition B1-stoch
   (SIN_MFG_Model_Spec_v0.3 §B) as a finished theorem.

   Problem: price-taking hydro on a finite scenario tree (node n, probability
   p_n, conditional child probs q_c), releasing h_n ∈ [0, h̄] against price ϖ_n,
   spilling s_n ≥ 0 (dams spill — without it, full-reservoir states with
   large inflow are infeasible; found by this file's own certificate going
   red on the first demo), stock R'_n = R^in_n + I_n − h_n − s_n ∈ [0, R̄]
   (R^in = parent's R'), linear salvage φ·R' at the leaves:

     max  Σ_n p_n ϖ_n h_n + Σ_leaves p_l φ R'_l.

   This is a finite LP; KKT holds with no constraint qualification. With w_n
   the (per-unit) multiplier of node n's balance:

     · stationarity in h_n :  the Hotelling trichotomy of ϖ_n against w_n;
     · stationarity in s_n :  w_n ≥ 0, and  s_n > 0 ⇒ w_n = 0  (marginal
       water at a spilling node is worthless — the floor-spill regime of
       Prop. A2, reappearing as a dual complementarity);
     · stationarity in R'_n:  w_n = E[w_child | n] + α̃_n − β̃_n,
       α̃ ⟂ R'_n ≥ 0,  β̃ ⟂ R'_n ≤ R̄  (leaves: E[w_child] ≔ φ).

   **THE THEOREM: the water value is a martingale between stock-binding
   events** — w_n = E[w_child | n] exactly at every node whose post-release
   stock is interior; it steps DOWN across full-reservoir events and UP
   across empty events, mirror of the deterministic jump directions
   (water_value_lp.js) with conditional expectation replacing time-stepping.
   This is the discrete-time lift of B1-stoch's dw = Z dB + dL⁰ − dL̄, proved
   by nothing deeper than LP duality. Lineage stated plainly: water values
   and their martingale behavior are classical in hydro scheduling
   (SDDP/Pereira–Pinto lineage) and commodity-storage economics; what is
   claimed here is the precise tree-LP statement, its one-page duality
   proof, and the machine-precision certificate below — inside the SIN-MFG
   model family where the same w is the price on hydro-marginal windows.

   Solver: EXACT dynamic programming with piecewise-linear concave value
   functions (payoffs linear, constraints boxes ⇒ V_n is PL concave; all
   breakpoints tracked exactly), forward pass with a declared tie-breaker
   (save water: largest optimal R'). Duals constructed backward from the
   salvage anchor. As always the solver is a guess and the CERTIFICATE is
   the proof: primal feasibility + trichotomy + wedge signs/comp-slack +
   ZERO DUALITY GAP prove optimality of the returned pair; the martingale
   identity is then read off the certified dual. Battery:
   sin-mfg/tests/test-water-value.js. */
'use strict';

const TOL = 1e-9;

/* ---- exact piecewise-linear concave functions on [0, Rbar] ---- */
function evalPL(f, x) {
  const { xs, vs } = f;
  if (x <= xs[0]) return vs[0];
  if (x >= xs[xs.length - 1]) return vs[vs.length - 1];
  let lo = 0, hi = xs.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; (xs[m] <= x ? lo = m : hi = m); }
  const t = (x - xs[lo]) / (xs[hi] - xs[lo]);
  return vs[lo] * (1 - t) + vs[hi] * t;
}
/* merge breakpoints closer than 1e-10 — near-duplicate candidates from
   different kink formulas otherwise create zero-width segments whose slopes
   are float garbage, poisoning every superdifferential downstream (found by
   the sweep going red at O(1) while the primal was exact to 9e-16) */
function dedupe(xs) {
  const out = [xs[0]];
  for (let i = 1; i < xs.length; i++) if (xs[i] - out[out.length - 1] > 1e-10) out.push(xs[i]);
  return out;
}
function mixPL(fs, qs) {                       // Σ q_i f_i, exact on merged breakpoints
  const set = new Set();
  fs.forEach(f => f.xs.forEach(x => set.add(x)));
  const xs = dedupe([...set].sort((a, b) => a - b));
  const vs = xs.map(x => fs.reduce((s, f, i) => s + qs[i] * evalPL(f, x), 0));
  return { xs, vs };
}
function argmaxPL(f) {                          // concave: plateau [xl, xr]
  let best = -Infinity, xl = f.xs[0], xr = f.xs[0];
  for (let i = 0; i < f.xs.length; i++) {
    if (f.vs[i] > best + 1e-13) { best = f.vs[i]; xl = xr = f.xs[i]; }
    else if (f.vs[i] > best - 1e-13) xr = f.xs[i];
  }
  return { xl, xr, best };
}
/* exact max of a PL function over a window [lo, hi] — the DECISION always
   maximizes over the feasible window directly. (A global argmax + clamp is
   WRONG here: the negative domain extension exists only for derivative
   extraction, and −ϖR' inflates Gm there into a spurious global peak —
   found by the sweep: forward passes releasing where storing was optimal.)
   Tie-break: largest x (save water). */
function maxOnWindow(f, lo, hi) {
  let bx = lo, bv = evalPL(f, lo);
  const consider = (x) => { const v = evalPL(f, x); if (v > bv + 1e-13 || (v > bv - 1e-13 && x > bx)) { bv = v; bx = x; } };
  for (const x of f.xs) if (x > lo && x < hi) consider(x);
  consider(hi);
  return { x: bx, v: bv };
}

/* ---- tree structure: nodes in an array, parent index, conditional prob q ---- */
function buildTree(depth, branching, gen) {
  const nodes = [{ id: 0, parent: -1, q: 1, p: 1, depth: 0, children: [] }];
  let frontier = [0];
  for (let d = 1; d < depth; d++) {
    const next = [];
    for (const pi of frontier) {
      for (let b = 0; b < branching; b++) {
        const id = nodes.length;
        const q = 1 / branching;
        nodes.push({ id, parent: pi, q, p: nodes[pi].p * q, depth: d, children: [] });
        nodes[pi].children.push(id);
        next.push(id);
      }
    }
    frontier = next;
  }
  for (const n of nodes) { const g = gen(n); n.price = g.price; n.inflow = g.inflow; }
  return nodes;
}

/* ---- exact solve + dual construction + certificates ---- */
function solveTree(nodes, { R0, Rbar, hbar, phi }) {
  const N = nodes.length;
  /* backward: exact PL value functions V_n(R^in) and stored continuation G_n */
  const V = new Array(N), G = new Array(N);
  const order = [...nodes].sort((a, b) => b.depth - a.depth);
  for (const n of order) {
    let g;                                       // continuation value of R' at n
    if (n.children.length === 0) g = { xs: [0, Rbar], vs: [0, phi * Rbar] };
    else g = mixPL(n.children.map(c => V[c]), n.children.map(c => nodes[c].q));
    G[n.id] = g;
    const Gm = { xs: g.xs, vs: g.vs.map((v, i) => v - n.price * g.xs[i]) };   // g(R')−ϖR'
    /* candidate R^in breakpoints where the window [lo,hi] interacts with Gm.
       Domain extends BEYOND R̄: parents at a full reservoir pass entry = R̄,
       and a value function truncated there has an artificially widened
       superdifferential at the edge (dR = −∞), admitting invalid duals —
       found by the sweep: distribution overshoot at atTop parents. V is an
       LP value function, perfectly defined past R̄ (the node spills/releases
       the excess), so build it on [0, R̄+0.6h̄] and R̄ becomes interior. */
    const Rext = Rbar + 0.6 * hbar;
    /* mirror fix at the BOTTOM: entry = 0 (empty-reservoir parents) needs a
       true left derivative, so extend slightly below 0 — the LP is feasible
       there whenever entry + I_n ≥ 0 */
    const lowX = -0.9 * Math.min(n.inflow, 0.5 * hbar);
    const cand = new Set(lowX < -1e-9 ? [lowX, 0, Rbar, Rext] : [0, Rbar, Rext]);
    const add = x => { if (x > lowX + 1e-12 && x < Rext - 1e-12) cand.add(x); };
    for (const b of g.xs) { add(b - n.inflow); add(b - n.inflow + hbar); }
    const xs = dedupe([...cand].sort((a, b) => a - b));
    const vs = xs.map(R => {
      /* with spill: R' ∈ [min(lo, hi), hi]; release min(h̄, R+I−R'), spill rest */
      const lo = Math.max(0, Math.min(R + n.inflow - hbar, Rbar)), hi = Math.min(Rbar, R + n.inflow);
      const m = maxOnWindow(Gm, Math.min(lo, hi), hi);
      return n.price * Math.min(hbar, R + n.inflow - m.x) + evalPL(g, m.x);
    });
    V[n.id] = { xs, vs };
  }
  /* forward: exact primal (tie-break: save water — largest optimal R') */
  const Rin = new Float64Array(N), Rp = new Float64Array(N), h = new Float64Array(N), spill = new Float64Array(N);
  Rin[0] = R0;
  const fwdOrder = [...nodes].sort((a, b) => a.depth - b.depth);
  for (const n of fwdOrder) {
    const g = G[n.id];
    const Gm = { xs: g.xs, vs: g.vs.map((v, i) => v - n.price * g.xs[i]) };
    const lo = Math.max(0, Math.min(Rin[n.id] + n.inflow - hbar, Rbar));
    const hi = Math.min(Rbar, Rin[n.id] + n.inflow);
    const rp = maxOnWindow(Gm, Math.min(lo, hi), hi).x;
    Rp[n.id] = rp;
    h[n.id] = Math.min(hbar, Rin[n.id] + n.inflow - rp);
    spill[n.id] = Rin[n.id] + n.inflow - rp - h[n.id];
    for (const c of n.children) Rin[c] = rp;
  }
  /* duals: exact superdifferential selection of the value functions, chosen
     TOP-DOWN. w_n must lie in ∂V_n(entry stock); LP duality guarantees a
     globally consistent selection exists, and per-node greedy choices do NOT
     reconcile (found the hard way: 44/120 sweep instances went red under a
     local chooser). The parent's wedge rule fixes the continuation target;
     water-filling distributes it over the children's superdifferential
     intervals. Every constraint is then re-VERIFIED by the certificate set —
     the selection is a candidate, never a proof. */
  function superDiff(f, x) {
    const { xs, vs } = f, n = xs.length, EPS = 1e-11;
    const slope = j => (vs[j + 1] - vs[j]) / (xs[j + 1] - xs[j]);
    let i = 0; while (i < n - 2 && xs[i + 1] < x - EPS) i++;
    let dL, dR;
    const atBP = Math.abs(x - xs[i]) < EPS ? i : (Math.abs(x - xs[i + 1]) < EPS ? i + 1 : -1);
    if (atBP === 0) { dL = 1e12; dR = slope(0); }
    else if (atBP === n - 1) { dL = slope(n - 2); dR = -1e12; }
    else if (atBP > 0) { dL = slope(atBP - 1); dR = slope(atBP); }
    else { dL = dR = slope(i); }
    return { lo: Math.max(dR, 0), hi: Math.max(dL, 0) };       // w ≥ 0 (spill dual)
  }
  const w = new Float64Array(N), cont = new Float64Array(N);
  { const I = superDiff(V[0], Rin[0]); w[0] = spill[0] > TOL ? 0 : I.lo; }
  for (const n of fwdOrder) {
    if (n.children.length === 0) continue;
    const Is = n.children.map(c => superDiff(V[c], Rp[n.id]));
    const sLo = n.children.reduce((s, c, i) => s + nodes[c].q * Is[i].lo, 0);
    const sHi = n.children.reduce((s, c, i) => s + nodes[c].q * Is[i].hi, 0);
    const atTop = Math.abs(Rp[n.id] - Rbar) < TOL, atBot = Math.abs(Rp[n.id]) < TOL;
    let target = w[n.id];
    if (atTop) target = Math.max(w[n.id], sLo);                // β̃ ≥ 0: cont ≥ w allowed
    else if (atBot) target = Math.min(w[n.id], sHi);           // α̃ ≥ 0: cont ≤ w allowed
    target = Math.min(Math.max(target, sLo), sHi);             // distributable (else certs go red)
    let deficit = target - sLo;
    n.children.forEach((c, i) => {
      const cap = Math.min(Is[i].hi - Is[i].lo, 1e15);
      const take = Math.max(0, Math.min(cap, deficit / nodes[c].q));
      w[c] = Is[i].lo + take;
      deficit -= take * nodes[c].q;
    });
  }
  for (const n of order) {
    cont[n.id] = n.children.length === 0 ? phi
      : n.children.reduce((s, c) => s + nodes[c].q * w[c], 0);
  }
  /* ---- certificates ---- */
  const cert = { dynErr: 0, boxErr: 0, tri: 0, wedgeSignErr: 0, compSlack: 0, martingaleRes: 0, bindingNodes: 0, spillNodes: 0, spillDualErr: 0 };
  for (const n of nodes) {
    cert.dynErr = Math.max(cert.dynErr, Math.abs(Rp[n.id] - (Rin[n.id] + n.inflow - h[n.id] - spill[n.id])));
    cert.boxErr = Math.max(cert.boxErr, -h[n.id], h[n.id] - hbar, -Rp[n.id], Rp[n.id] - Rbar, -spill[n.id], 0);
    if (spill[n.id] > TOL) { cert.spillNodes++; cert.spillDualErr = Math.max(cert.spillDualErr, Math.abs(w[n.id])); }
    cert.spillDualErr = Math.max(cert.spillDualErr, -w[n.id]);   // w ≥ 0 always (spill dual)
    if (n.price > w[n.id] + TOL && h[n.id] < hbar - TOL) cert.tri++;
    if (n.price < w[n.id] - TOL && h[n.id] > TOL) cert.tri++;
    const wedge = cont[n.id] - w[n.id];          // = β̃ − α̃
    const atTop = Math.abs(Rp[n.id] - Rbar) < TOL, atBot = Math.abs(Rp[n.id]) < TOL;
    if (atTop || atBot) cert.bindingNodes++;
    if (!atTop && !atBot) cert.martingaleRes = Math.max(cert.martingaleRes, Math.abs(wedge));
    if (wedge > TOL && !atTop) cert.wedgeSignErr = Math.max(cert.wedgeSignErr, wedge);
    if (wedge < -TOL && !atBot) cert.wedgeSignErr = Math.max(cert.wedgeSignErr, -wedge);
    if (Math.abs(wedge) > TOL && !atTop && !atBot) cert.compSlack = Math.max(cert.compSlack, Math.abs(wedge));
  }
  /* zero duality gap: D = w_root·R0 + Σ p_n [ w_n I_n + R̄·β̃_n + h̄·(ϖ_n−w_n)⁺ ] */
  let rev = 0, D = w[0] * R0;
  for (const n of nodes) {
    rev += n.p * n.price * h[n.id];
    if (n.children.length === 0) rev += n.p * phi * Rp[n.id];
    D += n.p * (w[n.id] * n.inflow
      + Rbar * Math.max(cont[n.id] - w[n.id], 0)
      + hbar * Math.max(n.price - w[n.id], 0));
  }
  cert.revenue = rev;
  cert.dual = D;
  /* THE GAP IS REPORTED SIGNED, AND THE SIGN IS THE WHOLE POINT.
     This is a MAXIMISATION LP, so weak duality gives D >= (primal optimum) >= rev for ANY
     dual-feasible w and ANY primal-feasible h — no optimality needed, it is an inequality
     about feasibility alone. So `signedGap = D - rev` is NON-NEGATIVE OR SOMETHING IS WRONG:
     a negative value cannot be a convergence artifact and cannot be tightened away. It means
     the dual objective D was assembled from a w that is not dual feasible, or the primal
     accounting double-counts — in either case a defect in this file, not a tolerance.

     Until 2026-07-29 this line read `Math.abs(rev - D)`, which maps that entire failure
     direction onto the same non-negative number as the benign one. A dual that undershot the
     primal by 1e-3 and a primal that undershot the dual by 1e-3 printed identically, and only
     one of them is possible. The absolute value did not make the check stronger; it deleted
     half of what the check could see. Same species as PLAN.md 1.2 — every check can go red —
     and it is why `signViolation` below is a SEPARATE field: a magnitude that happens to sit
     under tolerance must not launder a sign that is structurally impossible.

     `dualityGap` keeps the magnitude, so every existing consumer and tolerance is unchanged. */
  cert.signedGap = D - rev;
  cert.dualityGap = Math.abs(cert.signedGap);
  cert.gapRel = cert.dualityGap / Math.max(1, Math.abs(rev));
  cert.signViolation = Math.max(0, -cert.signedGap);   // > 0 ⇒ D < rev ⇒ weak duality violated
  return { nodes, Rin: [...Rin], Rp: [...Rp], h: [...h], spill: [...spill], w: [...w], cont: [...cont], cert, V, G };
}

module.exports = { buildTree, solveTree, evalPL, mixPL, argmaxPL, TOL };

if (require.main === module) {
  /* self-demo: depth-4 binary tree, seeded, engineered to bind */
  function mulberry32(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const rng = mulberry32(7);
  const nodes = buildTree(4, 2, n => ({
    price: 0.5 + 0.8 * rng() + (n.depth === 2 ? 0.5 : 0),
    inflow: 0.15 + 0.5 * rng(),
  }));
  const r = solveTree(nodes, { R0: 0.4, Rbar: 0.8, hbar: 0.35, phi: 0.55 });
  console.log('water_value_tree self-demo (15 nodes):');
  console.log('  duality gap     :', r.cert.gapRel.toExponential(2), '(zero ⇒ certified optimal)');
  console.log('  trichotomy      :', r.cert.tri, 'violations');
  console.log('  binding nodes   :', r.cert.bindingNodes, 'of', nodes.length);
  console.log('  martingale res  : max |w_n − E[w_child|n]| off-binding =', r.cert.martingaleRes.toExponential(2));
  console.log('certificates live in tests/test-water-value.js — run that, not this.');
}
