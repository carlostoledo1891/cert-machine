#!/usr/bin/env node
/* battery.js — the gate for labs/mfg.

   Structure, in the order a sceptic should read it:

     G  the box certifier AGREES with the lifted point kernel at zero width
     C  it certifies what it should, and the certificate is checked against
        independently re-solved corners of its own cell
     R  it refutes, with an exact witness
     X  falsifiers — each must turn its own target red

   The G block is the important one. This lab runs a SECOND implementation of
   the radii-polynomial argument (box.js, uniform over a parameter rectangle)
   beside the lifted single-point one (legacy/core/mfg/validate.js). A rule
   defined twice will diverge; the only defence is a check that fires when it
   does. G1 and G2 demand bit-for-bit equality on the reference instances.

   usage: node labs/mfg/battery.js          (exit 0 and "ALL PASS" or nothing)
   MIT licensed. Part of cert-machine (labs/mfg). */
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const I = require(path.join(ROOT, 'legacy', 'core', 'interval', 'interval.js'));
const M = require(path.join(ROOT, 'legacy', 'core', 'mfg', 'mfg1d.js'));
const V = require(path.join(ROOT, 'legacy', 'core', 'mfg', 'validate.js'));
const B = require(path.join(__dirname, 'box.js'));
const W = require(path.join(__dirname, 'widget.js'));

let fails = 0, checks = 0, PRED = null;
function check(name, cond, detail) {
  checks++;
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + name + (detail !== undefined ? '   [' + detail + ']' : ''));
  if (!cond) fails++;
}
const SG = 0.5, N = 16, NU = 1.02;
const mk = (c, A, n) => M.makeProblem({ sigma: SG, c, A, N: n || N });
const thin = (sigma, c, A, n) => ({ sigma: [sigma, sigma], c: [c, c], A: [A, A], N: n || N });

/* the reference instances are the ones validate.js records in its own comment
   header, so a divergence here is visible against a number in the source. */
const REF = [[0.5, 1, 1, 16, 1.05], [0.3, 2, 1.5, 20, 1.05], [0.5, 1, 0.5, 16, 1.02],
             [0.5, 1, 1.5, 16, 1.05], [0.5, -12, 0, 16, 1.02], [0.5, -16, 0, 16, 1.02],
             [0.5, -24, 0, 16, 1.02]];

/* ================= G · agreement with the lifted point kernel ============ */
{
  let same = 0, pos = 0;
  for (const [sigma, c, A, n, nu] of REF) {
    const P = M.makeProblem({ sigma, c, A, N: n });
    const s = M.solve(P);
    const ref = V.validate(s.x, P, { nu });
    const got = B.validateBox(s.x, { sigma: [sigma, sigma], c: [c, c], A: [A, A], N: n }, { nu });
    if (ref.ok === got.ok && ref.Y0 === got.Y0 && ref.Z1 === got.Z1 && ref.Z2 === got.Z2
        && ref.r === got.r && ref.kappa === got.kappa) same++;
    const un = M.unpack(s.x, n);
    const bI = [[1, 1]];
    for (let k = 1; k <= n; k++) bI.push([un.b[k], un.b[k]]);
    const pr = V.certifyPositivity(s.x, P, ref.r), pb = B.boxPositivity(bI, n, ref.r);
    if (pr.minM === pb.minM && pr.minMbar === pb.minMbar && pr.L === pb.L && pr.G === pb.G) pos++;
  }
  check('G1 at zero width the box certifier reproduces validate.js BIT FOR BIT (Y0, Z1, Z2, r, kappa)',
    same === REF.length, same + '/' + REF.length + ' reference instances identical');
  check('G2 at zero width boxPositivity reproduces certifyPositivity bit for bit (minM, minMbar, L, G)',
    pos === REF.length, pos + '/' + REF.length + ' identical');
}
{
  /* the kappa column validate.js records in its own header, recomputed here */
  const P = M.makeProblem({ sigma: 0.5, c: -24, A: 0, N: 16 });
  const s = M.solve(P);
  const g = B.validateBox(s.x, thin(0.5, -24, 0), { nu: 1.02 });
  check('G3 the contraction factor at (0.5, -24, 0) is the 0.4494 the kernel header records',
    g.ok && Math.abs(g.kappa - 0.4494) < 5e-5, 'kappa = ' + g.kappa.toFixed(6));
}

/* ================= C · it certifies, and the cell is checked at its corners = */
let CELL = null;
check('C1 a cell of positive width certifies UNIFORMLY, and every corner solution lies inside the ball', (() => {
  const c0 = -16, a0 = 0.3, dc = 0.0625, da = 0.025;
  const box = { sigma: [SG, SG], c: [c0 - dc / 2, c0 + dc / 2], A: [a0 - da / 2, a0 + da / 2], N };
  const s = M.solve(mk(c0, a0), { maxIter: 400 });
  const cert = B.validateBox(s.x, box, { nu: NU });
  if (!cert.ok) return false;
  /* the claim is "for every s in the cell": test it at all four corners by
     re-solving there and measuring the distance to the PREDICTED centre. */
  let worst = 0;
  for (const cc of [box.c[0], box.c[1]]) for (const aa of [box.A[0], box.A[1]]) {
    const r = M.solve(mk(cc, aa), { x0: s.x, maxIter: 400 });
    if (!(r.resNorm < 1e-11)) return false;
    /* predictor at this corner, in (rho, p, b) */
    const un = M.unpack(s.x, N), uc = M.unpack(r.x, N);
    const t = { c: cc - c0, A: aa - a0 };
    let d = Math.abs(un.rho + (cert.tangents.c ? t.c * cert.tangents.c.rho : 0)
                             + (cert.tangents.A ? t.A * cert.tangents.A.rho : 0) - uc.rho);
    let nk = 1;
    for (let k = 1; k <= N; k++) {
      nk *= NU;
      const pp = 2 * Math.PI * k * un.a[k] + (cert.tangents.c ? t.c * cert.tangents.c.p[k] : 0)
                                           + (cert.tangents.A ? t.A * cert.tangents.A.p[k] : 0);
      const bb = un.b[k] + (cert.tangents.c ? t.c * cert.tangents.c.b[k] : 0)
                         + (cert.tangents.A ? t.A * cert.tangents.A.b[k] : 0);
      d += 2 * nk * Math.abs(pp - 2 * Math.PI * k * uc.a[k]);
      d += 2 * nk * Math.abs(bb - uc.b[k]);
    }
    if (d > worst) worst = d;
  }
  CELL = { cert, worst };
  return worst < cert.r;
})(), CELL ? ('r = ' + CELL.cert.r.toExponential(3) + ', worst corner distance ' + CELL.worst.toExponential(3)) : 'see above');

let MULT = null;
check('C2 the mfg-cap multiplicity survives the upgrade to a CELL: two disjoint balls over a rectangle', (() => {
  const cm = -16, am = 0.3, dc = 0.0625, da = 0.025;
  const box = { sigma: [SG, SG], c: [cm - dc / 2, cm + dc / 2], A: [am - da / 2, am + da / 2], N };
  const P = mk(cm, am);
  const t = new Float64Array(2 * N + 1); t[0] = cm;
  const sT = M.solve(P, { x0: t, maxIter: 400 });
  const seed = new Float64Array(2 * N + 1);
  seed[0] = -10.12; seed[1] = -SG * 0.35; seed[N + 1] = 0.35;
  const st = M.solve(mk(-10.12, 0), { x0: seed, maxIter: 400 });
  const br = M.continueBranch(c => mk(c, 0), -10.12, cm, 40, st.x);
  if (!br.ok) return false;
  const sH = M.solve(P, { x0: br.x, maxIter: 400 });
  if (!(sT.resNorm < 1e-11 && sH.resNorm < 1e-11)) return false;
  const cT = B.validateBox(sT.x, box, { nu: NU }), cH = B.validateBox(sH.x, box, { nu: NU });
  if (!cT.ok || !cH.ok) return false;
  const sep = B.separationBox(cT.predictor, cH.predictor, N, NU);
  const pT = B.boxPositivity(cT.predictor.b, N, cT.r), pH = B.boxPositivity(cH.predictor.b, N, cH.r);
  MULT = { sep, rsum: cT.r + cH.r, minM: Math.min(pT.minM, pH.minM), dc, da };
  return sep > cT.r + cH.r && pT.positive && pH.positive;
})(), MULT ? ('cell ' + MULT.dc + ' x ' + MULT.da + ': separation ' + MULT.sep.toFixed(3) + ' >> r1+r2 = '
  + MULT.rsum.toExponential(2) + ', both densities >= ' + MULT.minM.toFixed(4)) : 'see above');

check('C3 the monotone control certifies routinely across the Lasry-Lions half-plane', (() => {
  for (const [c, A] of [[0.5, 0.4], [1, 1], [2, 0.2], [4, 1.2]]) {
    const s = M.solve(mk(c, A), { maxIter: 400 });
    const cert = B.validateBox(s.x, { sigma: [SG, SG], c: [c - 0.05, c + 0.05], A: [A - 0.02, A + 0.02], N }, { nu: 1.05 });
    if (!cert.ok) return false;
  }
  return true;
})(), 'four cells in c > 0, all certified uniformly');

/* ================= A · the seeding must not be able to change an answer === */
check('A1 an atlas warm start and a from-scratch search give the SAME verdict on every sample cell', (() => {
  const R = require(path.join(ROOT, 'labs', 'mfg', 'regime.js'));
  const cfg = JSON.parse(JSON.stringify(R.CONFIG));
  cfg.cRange = [-17, -10]; cfg.aRange = [0, 0.4];
  const atlas = R.buildAtlas(cfg);
  for (const [c, a] of [[-16, 0.3], [-12, 0.05], [-14, 0.2], [-10.5, 0.1], [-11.5, 0.35]]) {
    const box = { sigma: [SG, SG], c: [c - 0.015625, c + 0.015625],
                  A: [Math.max(0, a - 0.00625), a + 0.00625], N };
    const warm = B.decideCell(box, { nu: NU, seedT: atlas.seedT(c, a), seedH: atlas.seedH(c, a) });
    const cold = B.decideCell(box, { nu: NU });
    if (warm.verdict !== cold.verdict) return false;
  }
  return true;
})(), 'a seed is a starting point, never evidence — five cells, both seedings, same verdicts');

/* ================= R · refutation, with a witness ======================== */
let REF1 = null;
check('R1 a candidate 5e-2 off the true equilibrium is REFUTED at delta = 1e-3, with the equation named', (() => {
  const s = M.solve(mk(1, 1), { maxIter: 400 });
  const bad = Float64Array.from(s.x); bad[N + 1] += 0.05;
  const r = B.refuteCandidate(bad, thin(SG, 1, 1), 1e-3, { nu: 1.05 });
  REF1 = r;
  return r.verdict === 'REFUTED' && r.mechanism.margin > 0;
})(), REF1 && REF1.mechanism ? (REF1.mechanism.equation + ': |Phi| >= ' + REF1.mechanism.residual.toExponential(3)
  + ' vs the ball\'s reach ' + (REF1.mechanism.rowBound * 1e-3).toExponential(3)) : 'see above');

check('R2 the TRUE equilibrium is never refuted — the refuter refuses instead of over-claiming', (() => {
  const s = M.solve(mk(1, 1), { maxIter: 400 });
  return B.refuteCandidate(s.x, thin(SG, 1, 1), 1e-6, { nu: 1.05 }).verdict === 'REFUSED';
})(), 'a residual near zero is evidence, not a verdict — the instrument says so');

/* ================= X · falsifiers ======================================== */
console.log('\n    executing falsifiers');
let reds = 0; const redTotal = 6;
{
  /* X1 the bifurcation: at c* = -sigma^2 (2 pi)^2 the linearisation of the
     constant state is singular and NO enclosure can exist. A cell straddling it
     must refuse — a verifier that certified there would be broken. */
  const cStar = -(SG * SG) * (2 * Math.PI) * (2 * Math.PI);
  const x = new Float64Array(2 * N + 1); x[0] = cStar;
  const r = B.validateBox(x, { sigma: [SG, SG], c: [cStar - 0.02, cStar + 0.02], A: [0, 0], N }, { nu: NU });
  if (!r.ok) { reds++; console.log('       RED ok  X1 a cell straddling c* = ' + cStar.toFixed(6) + ' REFUSES (' + r.why.slice(0, 44) + ')'); }
  else console.log('       RED FAIL  X1 the certifier certified AT the bifurcation');
}
{
  /* X2 the tangent predictor is load-bearing, not decoration. Freeze it —
     opts.freezePredictor, which is exactly the fixed-candidate bound the
     single-point argument gives when pointed at a box — and the widest cell
     that still closes on the herding branch collapses. Both thresholds are
     MEASURED here on the same ladder, so the ratio quoted anywhere else in
     this repository comes from this run. */
  const cm = -12;
  const seed = new Float64Array(2 * N + 1);
  seed[0] = -10.12; seed[1] = -SG * 0.35; seed[N + 1] = 0.35;
  const st = M.solve(mk(-10.12, 0), { x0: seed, maxIter: 400 });
  const br = M.continueBranch(c => mk(c, 0), -10.12, cm, 40, st.x);
  const widest = (frozen) => {
    let best = 0;
    for (const w of [0.001, 0.002, 0.003, 0.004, 0.005, 0.008, 0.0125, 0.02, 0.03, 0.05, 0.0625, 0.08, 0.1]) {
      const r = B.validateBox(br.x, { sigma: [SG, SG], c: [cm - w / 2, cm + w / 2], A: [0, 0], N },
                              { nu: NU, freezePredictor: frozen });
      if (r.ok) best = w; else break;
    }
    return best;
  };
  const wLive = widest(false), wFrozen = widest(true);
  PRED = { live: wLive, frozen: wFrozen, ratio: wFrozen > 0 ? wLive / wFrozen : Infinity };
  if (br.ok && wLive > 0 && wFrozen > 0 && wLive >= 4 * wFrozen) {
    reds++;
    console.log('       RED ok  X2 freezing the tangent collapses the widest closing cell from ' + wLive
      + ' to ' + wFrozen + ' in c (' + PRED.ratio.toFixed(1) + 'x) — the predictor is load-bearing');
  } else console.log('       RED FAIL  X2 the tangent predictor is not load-bearing here');
}
{
  /* X3 two candidates on the SAME branch must not be sold as multiplicity */
  const s = M.solve(mk(-16, 0.3), { maxIter: 400 });
  const box = { sigma: [SG, SG], c: [-16.03, -15.97], A: [0.29, 0.31], N };
  const c1 = B.validateBox(s.x, box, { nu: NU });
  const sep = c1.ok ? B.separationBox(c1.predictor, c1.predictor, N, NU) : 1;
  if (c1.ok && !(sep > 2 * c1.r)) { reds++; console.log('       RED ok  X3 a branch against ITSELF gives separation ' + sep + ' — no multiplicity'); }
  else console.log('       RED FAIL  X3 a candidate was found disjoint from itself');
}
{
  /* X4 the sigma-box price is real: A is built at the midpoint sigma, so a wide
     sigma box carries a tail defect |1 - sigma/sigma0| that does not decay.
     Delete that term and a 60%-wide sigma box would certify; it must not. */
  const s = M.solve(mk(1, 1), { maxIter: 400 });
  const r = B.validateBox(s.x, { sigma: [0.2, 0.8], c: [1, 1], A: [1, 1], N }, { nu: 1.05 });
  if (!r.ok && r.Z1 >= 0.6) { reds++; console.log('       RED ok  X4 a sigma box of relative half-width 0.6 refuses with Z1 = ' + r.Z1.toFixed(3) + ' >= 0.6'); }
  else console.log('       RED FAIL  X4 the tail diagonal defect is not being charged');
}
{
  /* X5 a nonsense box must be refused at the door, not silently accepted */
  const s = M.solve(mk(1, 1), { maxIter: 400 });
  const r = B.validateBox(s.x, { sigma: [-1, 1], c: [1, 1], A: [1, 1], N }, { nu: 1.05 });
  if (!r.ok && /sigma box must be strictly positive/.test(r.why)) { reds++; console.log('       RED ok  X5 a sigma box straddling zero is refused at the door'); }
  else console.log('       RED FAIL  X5 an ill-posed box was accepted');
}
{
  /* X6 the browser bundle must answer exactly what the Node path answers —
     the whole point of assembling it from these files instead of retyping it. */
  try { W.gate(); reds++; console.log('       RED ok  X6 the assembled browser bundle reproduces the Node verdicts (a divergence throws)'); }
  catch (e) { console.log('       RED FAIL  X6 ' + e.message); }
}
console.log('    every falsifier turned its target red   [' + reds + '/' + redTotal + ']');
if (reds !== redTotal) fails++;

console.log('\n' + (fails === 0 ? 'ALL PASS' : fails + ' FAILED') + '   (' + checks + ' checks, ' + reds + '/' + redTotal + ' falsifiers)');
process.exit(fails === 0 ? 0 : 1);
