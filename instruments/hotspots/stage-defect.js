/* stage-defect.js — CERTIFIED boundary defect of the frozen MPS trial.
   instruments/hotspots · cert-machine (ember port, 2026-09-02)

   Port of cert-defect.js (pinned in frontier-ref/). The trial u = Σ aᵢψᵢ
   satisfies −Δu = λ̃u EXACTLY; each fan's conormal vanishes analytically on
   its own corner's edges; only far-corner fans flux on each edge. Along an
   edge relative to a far corner: s(τ) = s0+τ, d constant, r² = s²+d²,
   θ' = +d/r² (the sign the bench's derivative bridge caught); the flux
   closes under τ-differentiation via the Bessel ODE, so ORDER-2 INTERVAL
   TAYLOR JETS give (f, f', f'') with one hand formula (g''' = d/dx g'').
   Certified cell rule: f|cell ⊆ f(m) + f'(m)δ ± mag(f''(cell))h²/8;
   ∫cell f² ≤ h·f² + f'²h³/12 + 2R(h|f| + h²|f'|/4) + R²h.
   Bridges: 12 value bridges + 4 derivative bridges against the independent
   float MPS evaluation (a passing VALUE bridge does not test a jet —
   bridge every derivative order used; the bench's lesson 5).
   The record carries the frozen trial coefficients EXACTLY — downstream
   stages regenerate and compare element-exact. MIT. */
'use strict';

const I = require('../interval/interval.js');
const T = require('../interval/transcendental.js');
const S = require('../ivspecial/ivspecial.js');
const SP = require('./specimen.js');
const UE = require('./ueval.js');
const TRIAL = require('./trial.js');

const { iv, add, sub, mul, div, neg } = I;
const { V, VF, CORN, K_FAN, LAM } = SP;
const sqlamIv = UE.sqlamIv;

/* ---------- order-2 interval jets ---------- */
const jconst = v => [v, I.ZERO, I.ZERO];
const jvar = v => [v, I.ONE, I.ZERO];
const jadd = (a, b) => [add(a[0], b[0]), add(a[1], b[1]), add(a[2], b[2])];
const jmul = (a, b) => [mul(a[0], b[0]),
  add(mul(a[0], b[1]), mul(a[1], b[0])),
  add(add(mul(a[0], b[2]), mul(a[2], b[0])), mul(iv(2), mul(a[1], b[1])))];
const jscale = (c, a) => [mul(c, a[0]), mul(c, a[1]), mul(c, a[2])];
function jdiv(a, b) {
  const q0 = div(a[0], b[0]);
  const q1 = div(sub(a[1], mul(q0, b[1])), b[0]);
  const q2 = div(sub(sub(a[2], mul(q0, b[2])), mul(iv(2), mul(q1, b[1]))), b[0]);
  return [q0, q1, q2];
}
function jsqrt(a) {
  const v = S.sqrtIv(a[0]);
  const d1 = div(a[1], mul(iv(2), v));
  const d2 = div(sub(a[2], mul(iv(2), mul(d1, d1))), mul(iv(2), v));
  return [v, d1, d2];
}
function jcos(a) {
  const c = T.cos(a[0]), s = T.sin(a[0]);
  return [c, neg(mul(s, a[1])), neg(add(mul(c, mul(a[1], a[1])), mul(s, a[2])))];
}
function jsin(a) {
  const c = T.cos(a[0]), s = T.sin(a[0]);
  return [s, mul(c, a[1]), sub(mul(c, a[2]), mul(s, mul(a[1], a[1])))];
}

/* Bessel jets through an x-jet: ODE closure J'' = (ν²/x²−1)J − J'/x */
function besselJets(nu, xj) {
  const x = xj[0];
  const g0 = S.besselJIv(nu, x);
  const g1 = S.besselJdIv(nu, x);
  const nu2x2 = div(mul(nu, nu), mul(x, x));
  const g2 = sub(mul(sub(nu2x2, I.ONE), g0), div(g1, x));
  const g3 = add(sub(sub(mul(sub(nu2x2, I.ONE), g1), div(mul(iv(2), mul(mul(nu, nu), g0)), mul(x, mul(x, x)))), div(g2, x)), div(g1, mul(x, x)));
  const J0 = [g0, mul(g1, xj[1]), add(mul(g2, mul(xj[1], xj[1])), mul(g1, xj[2]))];
  const J1 = [g1, mul(g2, xj[1]), add(mul(g3, mul(xj[1], xj[1])), mul(g2, xj[2]))];
  return { J0, J1 };
}

/* ---------- edge data + flux jet ---------- */
function edgeData(e) {
  const A = V[e], B = V[(e + 1) % 4];
  const ex = sub(B[0], A[0]), ey = sub(B[1], A[1]);
  const L = S.sqrtIv(add(mul(ex, ex), mul(ey, ey)));
  const ux = div(ex, L), uy = div(ey, L);
  const nx = uy, ny = neg(ux);
  const far = [(e + 2) % 4, (e + 3) % 4];
  return { A, ux, uy, nx, ny, L, far };
}

function fluxJet(coef, ed, tauJ) {
  let f = [I.ZERO, I.ZERO, I.ZERO];
  for (const c of ed.far) {
    const C = CORN[c];
    const ax = sub(ed.A[0], C.V[0]), ay = sub(ed.A[1], C.V[1]);
    const s0 = add(mul(ax, ed.ux), mul(ay, ed.uy));
    const d = add(mul(ax, ed.nx), mul(ay, ed.ny));
    if (!(d[0] > 0)) throw new Error('far corner not strictly inside edge normal side');
    const sJ = jadd(jconst(s0), tauJ);
    const r2J = jadd(jmul(sJ, sJ), jconst(mul(d, d)));
    const rJ = jsqrt(r2J);
    const xJ = jscale(sqlamIv, rJ);
    const px = jadd(jconst(sub(ed.A[0], C.V[0])), jscale(ed.ux, tauJ));
    const py = jadd(jconst(sub(ed.A[1], C.V[1])), jscale(ed.uy, tauJ));
    const phi = SP.angleOfIv(px[0], py[0]);
    let th = sub(phi, C.a1);
    if (th[1] < 0) th = add(th, T.TWO_PI);
    if (!(th[1] > -0.01 && th[0] < C.om[1] + 0.01)) throw new Error('theta out of corner sector');
    // θ' = +d/r² (checked by the derivative bridges; the −d/r² forgery is a battery red)
    const thd1 = div(d, r2J[0]);
    const thd2 = neg(div(mul(d, r2J[1]), mul(r2J[0], r2J[0])));
    const thJ = [th, thd1, thd2];
    for (let k = 0; k < K_FAN; k++) {
      const a = coef[c * K_FAN + k];
      if (a === 0) continue;
      const nu = mul(iv(k), C.nub);
      const angJ = k === 0 ? [I.ZERO, I.ZERO, I.ZERO] : jscale(nu, thJ);
      const cosJ = k === 0 ? [I.ONE, I.ZERO, I.ZERO] : jcos(angJ);
      const sinJ = k === 0 ? [I.ZERO, I.ZERO, I.ZERO] : jsin(angJ);
      const { J0, J1 } = besselJets(k === 0 ? I.ZERO : nu, xJ);
      let term = jscale(mul(sqlamIv, d), jdiv(jmul(J1, cosJ), rJ));
      if (k > 0) term = jadd(term, jscale(nu, jdiv(jmul(jmul(sJ, J0), sinJ), r2J)));
      f = jadd(f, jscale(iv(a), term));
    }
  }
  return f;
}

/* independent float flux (bridge reference) */
function floatFlux(coef, e, tFrac) {
  const A = VF[e], B = VF[(e + 1) % 4];
  const ex = B[0] - A[0], ey = B[1] - A[1], len = Math.hypot(ex, ey);
  const n = [ey / len, -ex / len];
  const x = A[0] + ex * tFrac, y = A[1] + ey * tFrac;
  const csF = TRIAL.corners();
  const bv = TRIAL.basisEval(csF, K_FAN, Math.sqrt(LAM), x, y, true);
  let fl = 0;
  for (let i = 0; i < coef.length; i++) fl += coef[i] * (bv.gx[i] * n[0] + bv.gy[i] * n[1]);
  return fl;
}

/* certified edge quadrature */
function certifyEdge(coef, e, M) {
  const ed = edgeData(e);
  const Lup = ed.L[1];
  const h = Lup / M;
  let total = I.ZERO;
  let supF = 0;
  for (let m = 0; m < M; m++) {
    const t0 = m * h, t1 = Math.min((m + 1) * h, Lup);
    const tm = (t0 + t1) / 2, hh = t1 - t0;
    const fm = fluxJet(coef, ed, jvar(iv(tm)));
    const fc = fluxJet(coef, ed, jvar(iv(t0, t1)));
    const R = I.nextUp(I.mag(fc[2]) * hh * hh / 8);
    const af = I.mag(fm[0]), ad = I.mag(fm[1]);
    supF = Math.max(supF, I.nextUp(af + ad * hh / 2 + R));
    const main = I.nextUp(hh * af * af + ad * ad * hh * hh * hh / 12);
    const crossR = I.nextUp(2 * R * (hh * af + ad * hh * hh / 4) + R * R * hh);
    total = add(total, iv(0, I.nextUp(main + crossR)));
  }
  return { total, supF };
}

function run() {
  const checks = [];
  const t0 = Date.now();
  const { coef, floatDefect } = UE.trialCoef();

  /* bridges: values at 12 points, derivatives on all 4 edges */
  for (const e of [0, 1, 2, 3]) {
    for (const tf of [0.31, 0.5, 0.77]) {
      const ed = edgeData(e);
      const tau = mul(iv(tf), ed.L);
      const fj = fluxJet(coef, ed, jvar(tau));
      const ff = floatFlux(coef, e, tf);
      checks.push({
        name: `bridge edge${e} t=${tf}`,
        ok: ff >= fj[0][0] - 1e-9 && ff <= fj[0][1] + 1e-9,
        detail: `float=${ff.toExponential(3)} iv=[${fj[0][0].toExponential(3)},${fj[0][1].toExponential(3)}]`,
      });
    }
    const ed = edgeData(e);
    const Lm = (ed.L[0] + ed.L[1]) / 2;
    const hf = 1e-6;
    const dnum = (floatFlux(coef, e, 0.5 + hf) - floatFlux(coef, e, 0.5 - hf)) / (2 * hf * Lm);
    const fj = fluxJet(coef, ed, jvar(mul(iv(0.5), ed.L)));
    checks.push({
      name: `bridge d/dτ edge${e}`,
      ok: dnum >= fj[1][0] - 1e-6 && dnum <= fj[1][1] + 1e-6,
      detail: `num=${dnum.toExponential(3)} iv=[${fj[1][0].toExponential(3)},${fj[1][1].toExponential(3)}]`,
    });
  }

  /* certified quadrature */
  const CELLS = 700;
  let defect2 = I.ZERO;
  const perEdge = [];
  for (const e of [0, 1, 2, 3]) {
    const de = certifyEdge(coef, e, CELLS);
    perEdge.push({ edge: e, fluxSq: de.total[1], supFlux: de.supF });
    defect2 = add(defect2, de.total);
  }
  const defectUp = I.nextUp(Math.sqrt(defect2[1]));
  checks.push({
    name: 'certified defect within sane factor of float (sanity)',
    ok: defectUp < 100 * 2e-5 + 1e-3 && defectUp > floatDefect / 10,
    detail: `certified ${defectUp.toExponential(4)} vs float ${floatDefect.toExponential(3)}`,
  });

  const ok = checks.every(c => c.ok);
  return {
    verdict: ok ? 'VERIFIED' : 'REFUSED',
    statement: '‖∂νu‖_{L²(∂Ω)} ≤ defectUpper for the frozen exact-Helmholtz trial (order-2 interval Taylor jets along each edge, Bessel-ODE closure, certified midpoint-Taylor cell rule; per-edge pointwise sup|∂νu| certified from the same jets).',
    trial: {
      lambdaTilde: LAM,
      K: K_FAN,
      nbasis: coef.length,
      coefficients: coef,
      floatDefect,
      note: 'coefficients are frozen exact doubles from the deterministic float MPS proposer (trial.js); downstream stages regenerate and compare element-exact',
    },
    cells: CELLS,
    defectUpper: defectUp,
    perEdge,
    supFluxPerEdge: perEdge.map(p => p.supFlux),
    checks,
    secs: +((Date.now() - t0) / 1000).toFixed(1),
  };
}

module.exports = { run, edgeData, fluxJet, jvar, jconst, besselJets, certifyEdge };
