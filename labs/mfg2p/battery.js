#!/usr/bin/env node
/* battery.js — the gate for labs/mfg2p.

   Structure, in the order a sceptic should read it:

     D  DECOUPLING. At zero cross-coupling the two-population model IS two
        independent copies of labs/mfg, so it must reproduce that lab's solver
        and that lab's VERDICTS. A generalisation that cannot recover the case
        it generalises is not a generalisation.
     G  the certifier agrees with itself and with the model (residual, Jacobian)
     C  it certifies what it should, checked against independently re-solved
        corners of the cell it claims
     R  it refuses what it should, with the reason kept
     X  falsifiers — each must turn its own target red

   The D block is the important one. Two implementations of one argument WILL
   diverge unless something fires when they do.

   MIT licensed. Part of cert-machine (labs/mfg2p). */
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const M2 = require('./mfg2p.js');
const B2 = require('./box2p.js');
const M1 = require(path.join(ROOT, 'legacy', 'core', 'mfg', 'mfg1d.js'));
const B1 = require(path.join(ROOT, 'labs', 'mfg', 'box.js'));

const checks = [];
const reds = [];
const ok = (name, cond, note) => checks.push({ name, pass: !!cond, note: note || '' });
const red = (name, cond, note) => reds.push({ name, pass: !!cond, note: note || '' });

const SIG = 0.5, NU = 1.02;
const mkBox = (cs, c12, c21, A, N, h) => ({
  sigma: [SIG, SIG],
  c: { c11: [cs, cs], c22: [cs, cs], c12: [c12 - (h || 0), c12 + (h || 0)], c21: [c21 - (h || 0), c21 + (h || 0)] },
  A: [[A, A], [A, A]], N
});

/* ---------- D · decoupling against labs/mfg ------------------------------ */
{
  let worst = 0;
  for (const [c1, c2, A1, A2, N] of [[1, 1, 1, 1, 10], [-12, 3, 1, 2, 14], [-8, -2, 1.5, 0.5, 12], [2, -5, 0.8, 1.2, 16]]) {
    const r2 = M2.solve(M2.makeProblem({ sigma: SIG, C: [c1, 0, 0, c2], A: [A1, A2], N }), { tol: 1e-15, maxIter: 300 });
    const s1 = M1.solve(M1.makeProblem({ sigma: SIG, c: c1, A: A1, N }), { tol: 1e-15, maxIter: 300 });
    const s2 = M1.solve(M1.makeProblem({ sigma: SIG, c: c2, A: A2, N }), { tol: 1e-15, maxIter: 300 });
    const st = M2.unpack(r2.x, N), u1 = M1.unpack(s1.x, N), u2 = M1.unpack(s2.x, N);
    let d = Math.max(Math.abs(st[0].rho - u1.rho), Math.abs(st[1].rho - u2.rho));
    for (let k = 1; k <= N; k++) d = Math.max(d, Math.abs(st[0].a[k] - u1.a[k]), Math.abs(st[0].b[k] - u1.b[k]),
                                                 Math.abs(st[1].a[k] - u2.a[k]), Math.abs(st[1].b[k] - u2.b[k]));
    worst = Math.max(worst, d);
  }
  ok('D1 decoupled solver reproduces mfg1d (4 parameter sets)', worst < 1e-13, 'worst coefficient gap ' + worst.toExponential(2));
}
{
  /* the VERDICTS must agree too, cell for cell, including the refusals */
  let agree = 0, dis = 0, first = '';
  const N = 12;
  for (const h of [0, 0.01, 0.03, 0.0625, 0.12, 0.25]) {
    for (const [c1, c2] of [[1, 1], [3, -2], [-6, 2], [-12, -4]]) {
      const b2 = mkBox(0, 0, 0, 1, N, 0);
      b2.c.c11 = [c1 - h, c1 + h]; b2.c.c22 = [c2 - h, c2 + h];
      const r2 = M2.solve(B2.midProblem(b2), { tol: 1e-15, maxIter: 300 });
      const v2 = r2.ok ? B2.validateBox(r2.x, b2, { nu: NU }) : { ok: false };
      const one = c => {
        const bx = { sigma: [SIG, SIG], c: [c - h, c + h], A: [1, 1], N };
        const s = M1.solve(M1.makeProblem({ sigma: SIG, c, A: 1, N }), { tol: 1e-15, maxIter: 300 });
        return s.ok ? B1.validateBox(s.x, bx, { nu: NU }) : { ok: false };
      };
      const both = one(c1).ok && one(c2).ok;
      if ((!!v2.ok) === both) agree++; else { dis++; if (!first) first = 'h=' + h + ' c=' + c1 + ',' + c2; }
    }
  }
  ok('D2 decoupled box VERDICTS agree with labs/mfg (24 cells)', dis === 0, agree + ' agree, ' + dis + ' disagree' + (first ? ' first at ' + first : ''));
}

/* ---------- G · the certifier against the model -------------------------- */
{
  const N = 16, box = mkBox(1, 5, 5, 1, N, 0);
  const r = M2.solve(B2.midProblem(box), { tol: 1e-15, maxIter: 400 });
  ok('G1 Newton reaches machine residual on a coupled problem', r.resNorm < 1e-13, 'residual ' + r.resNorm.toExponential(2));
  /* the analytic Jacobian against a central difference */
  const Pb = B2.midProblem(box), n = 2 * (2 * N + 1);
  const J = M2.jacobian(r.x, Pb);
  let worst = 0;
  for (const j of [0, 1, N + 1, 2 * N + 1, 2 * N + 3]) {
    const e = 1e-6;
    const xp = Float64Array.from(r.x), xm = Float64Array.from(r.x);
    xp[j] += e; xm[j] -= e;
    const rp = M2.residual(xp, Pb), rm = M2.residual(xm, Pb);
    for (let i = 0; i < n; i++) {
      const fd = (rp[i] - rm[i]) / (2 * e);
      const rel = Math.abs(fd - J[i * n + j]) / Math.max(1, Math.abs(fd));
      if (rel > worst) worst = rel;
    }
  }
  ok('G2 analytic Jacobian matches central differences', worst < 1e-6, 'worst relative gap ' + worst.toExponential(2));
  const v = B2.validateBox(r.x, box, { nu: NU });
  ok('G3 thin box certifies with a contraction', v.ok && v.kappa < 1, v.ok ? 'r ' + v.r.toExponential(2) + ' kappa ' + v.kappa.toFixed(4) : String(v.why));
}

/* ---------- C · certifies what it should, checked at the corners ---------- */
{
  const N = 16, h = 0.02, box = mkBox(1, 12, 12, 1, N, h);
  const n = 2 * (2 * N + 1);
  const seed = new Float64Array(n);
  for (let q = 0; q < 2; q++) { const o = q * (2 * N + 1), sg = q === 0 ? 1 : -1; seed[o] = 1; seed[o + 1] = -sg * 0.03; seed[o + N + 1] = sg * 0.3; }
  const r = M2.solve(B2.midProblem(box), { x0: seed, tol: 1e-15, maxIter: 800 });
  const v = B2.validateBox(r.x, box, { nu: NU });
  ok('C1 a segregated branch certifies over a genuine box', v.ok, v.ok ? 'r ' + v.r.toExponential(2) : String(v.why));
  if (v.ok) {
    /* the claim is UNIFORM over the cell, so independently re-solve the corners
       and require each to sit inside the certified enclosure. */
    let worstOut = 0, tried = 0;
    for (const s12 of [box.c.c12[0], box.c.c12[1]]) for (const s21 of [box.c.c21[0], box.c.c21[1]]) {
      const Pc = M2.makeProblem({ sigma: SIG, C: [1, s12, s21, 1], A: [1, 1], N });
      const rc = M2.solve(Pc, { x0: r.x, tol: 1e-15, maxIter: 600 });
      if (!(rc.resNorm < 1e-11)) continue;
      tried++;
      /* distance from the corner solution to the predictor interval, in nu-norm */
      const st = M2.unpack(rc.x, N);
      let dist = 0, nk = 1;
      for (let i = 0; i < 2; i++) {
        const pr = v.predictor[i];
        const dr = Math.max(0, Math.max(pr.rho[0] - st[i].rho, st[i].rho - pr.rho[1]));
        dist += dr;
      }
      for (let k = 1; k <= N; k++) {
        nk *= NU;
        for (let i = 0; i < 2; i++) {
          const pr = v.predictor[i];
          const pk = 2 * Math.PI * k * st[i].a[k], bk = st[i].b[k];
          dist += 2 * nk * Math.max(0, Math.max(pr.p[k][0] - pk, pk - pr.p[k][1]));
          dist += 2 * nk * Math.max(0, Math.max(pr.b[k][0] - bk, bk - pr.b[k][1]));
        }
      }
      worstOut = Math.max(worstOut, dist);
    }
    ok('C2 independently re-solved corners lie inside the certified enclosure', tried > 0 && worstOut <= v.r,
       tried + ' corners, worst excess over the predictor ' + worstOut.toExponential(2) + ' vs r ' + v.r.toExponential(2));
  } else ok('C2 independently re-solved corners lie inside the certified enclosure', false, 'C1 did not certify');
}
{
  const N = 16, box = mkBox(1, 12, 12, 1, N, 0.02);
  const dec = B2.decideCell(box, { nu: NU });
  ok('C3 the cell decision finds MULTIPLE where two branches coexist', dec.verdict === 'MULTIPLE',
     dec.verdict + (dec.ratio ? ' (separation / (r1+r2) = ' + dec.ratio.toFixed(1) + ')' : ' — ' + String(dec.reason).slice(0, 70)));
  const mono = B2.decideCell(mkBox(1, 0.4, 0.2, 1, 12, 0.02), { nu: NU });
  ok('C4 a monotone cell decides UNIQUE on the cited theorem', mono.verdict === 'UNIQUE',
     mono.verdict + ' — ' + String(mono.basis || mono.reason).slice(0, 70));
}

/* ---------- R · refuses what it should ----------------------------------- */
{
  const N = 16, box = mkBox(1, 12, 12, 1, N, 0.6);          /* far too wide */
  const r = M2.solve(B2.midProblem(box), { tol: 1e-15, maxIter: 400 });
  const v = B2.validateBox(r.x, box, { nu: NU });
  ok('R1 an over-wide cell is refused, with a reason', !v.ok && !!v.why, String(v.why || '').slice(0, 60));
}

/* ---------- X · falsifiers: each must turn its own target red ------------- */
{
  /* X1 — the tangent predictor is load-bearing and MEASURED: the same cell must
     fail when the predictor is frozen, which is exactly the fixed-candidate
     bound a single-point argument gives when pointed at a box. */
  const N = 16, box = mkBox(1, 12, 12, 1, N, 0.02);
  const n = 2 * (2 * N + 1);
  const seed = new Float64Array(n);
  for (let q = 0; q < 2; q++) { const o = q * (2 * N + 1), sg = q === 0 ? 1 : -1; seed[o] = 1; seed[o + 1] = -sg * 0.03; seed[o + N + 1] = sg * 0.3; }
  const r = M2.solve(B2.midProblem(box), { x0: seed, tol: 1e-15, maxIter: 800 });
  const withP = B2.validateBox(r.x, box, { nu: NU });
  const noP = B2.validateBox(r.x, box, { nu: NU, freezePredictor: true });
  red('X1 freezing the tangent predictor breaks the same cell', withP.ok && !noP.ok,
      'with predictor ' + (withP.ok ? 'CERT' : 'X') + ', frozen ' + (noP.ok ? 'CERT' : 'X') +
      (withP.ok && noP.Y0 ? ' — Y0 rises ' + (noP.Y0 / withP.Y0).toFixed(0) + 'x' : ''));
}
{
  /* X2 — the CROSS-COUPLING is really charged in the tail bound. A cell thin in
     c12 but carrying a large c21 must have a strictly larger Z1 than the same
     cell with c21 small: the b-column of the tail collects the whole COLUMN of
     C, and dropping the j != i terms would leave this test flat. */
  const N = 12;
  const small = B2.validateBox(M2.solve(B2.midProblem(mkBox(1, 1, 1, 1, N, 0)), { tol: 1e-15, maxIter: 300 }).x, mkBox(1, 1, 1, 1, N, 0), { nu: NU });
  const bigBox = mkBox(1, 1, 40, 1, N, 0);
  const big = B2.validateBox(M2.solve(B2.midProblem(bigBox), { tol: 1e-15, maxIter: 300 }).x, bigBox, { nu: NU });
  red('X2 a large off-diagonal c21 raises Z1 (the tail charges the whole column of C)',
      big.Z1 > small.Z1, 'Z1 ' + small.Z1.toExponential(3) + ' -> ' + big.Z1.toExponential(3));
}
{
  /* X3 — a forged candidate must not certify. Perturb a true solution well
     beyond its own radius and require refusal. */
  const N = 16, box = mkBox(1, 5, 5, 1, N, 0);
  const r = M2.solve(B2.midProblem(box), { tol: 1e-15, maxIter: 400 });
  const forged = Float64Array.from(r.x);
  forged[3] += 0.05;
  const v = B2.validateBox(forged, box, { nu: NU });
  red('X3 a forged candidate is refused', !v.ok, v.ok ? 'CERTIFIED a forgery' : String(v.why).slice(0, 50));
}
{
  /* X4 — the sigma-box defect is charged. A wide sigma box must raise Z1 by at
     least the diagonal defect |1 - sigma/sigma0|, which does NOT decay in k. */
  const N = 12;
  const thin = mkBox(1, 5, 5, 1, N, 0);
  const wide = JSON.parse(JSON.stringify(thin)); wide.sigma = [0.45, 0.55];
  const x = M2.solve(B2.midProblem(thin), { tol: 1e-15, maxIter: 300 }).x;
  const a = B2.validateBox(x, thin, { nu: NU }), b = B2.validateBox(x, wide, { nu: NU });
  const defect = 0.05 / 0.5;
  red('X4 a wide sigma box is charged the non-decaying tail defect', b.Z1 >= a.Z1 + defect * 0.5,
      'Z1 ' + a.Z1.toExponential(3) + ' -> ' + b.Z1.toExponential(3) + ' (defect ' + defect.toFixed(2) + ')');
}
{
  /* X5 — separation cannot be faked: the same branch against itself must give a
     separation of zero, so a cell can never be called MULTIPLE twice over one
     solution. */
  const N = 16, box = mkBox(1, 12, 12, 1, N, 0.02);
  const r = M2.solve(B2.midProblem(box), { tol: 1e-15, maxIter: 400 });
  const v = B2.validateBox(r.x, box, { nu: NU });
  const sep = v.ok ? B2.separationBox(B2.asIv(v.predictor), B2.asIv(v.predictor), N, NU) : -1;
  red('X5 a branch is not separated from itself', v.ok && sep === 0, 'separation ' + sep);
}
{
  /* X6 — the monotonicity test is not decorative: a coupling box whose
     symmetric part fails PSD must be reported non-monotone, and must therefore
     never be certified UNIQUE. */
  const bad = B2.lasryLionsBox(mkBox(1, 12, 12, 1, 12, 0.02));
  const good = B2.lasryLionsBox(mkBox(1, 0.4, 0.2, 1, 12, 0.02));
  red('X6 monotonicity is decided, not assumed', !bad.monotone && good.monotone,
      'det lower bounds: non-monotone cell ' + bad.detLo.toExponential(2) + ', monotone cell ' + good.detLo.toExponential(2));
}

/* ---------- U · the unfolding, which the report page asserts --------------
   At d = 0 the two populations are interchangeable and the second equilibrium
   arrives through a SYMMETRY-BREAKING pitchfork: somewhere along s the Jacobian
   is singular, and det(DPhi) changes sign. Switch d away from zero and that
   symmetry is gone, the pitchfork unfolds, and the primary branch becomes
   smooth — no singular Jacobian anywhere, nothing for a continuation to feel.
   The page says exactly this, so the page must not be able to say it unless it
   is true of the very slice the map was swept on.                            */
{
  const N = 16, n = 2 * (2 * N + 1), cs = 1, A = 1;
  const detSign = (J) => {
    const M = Float64Array.from(J); let sg = 1;
    for (let k = 0; k < n; k++) {
      let pr = k, mx = Math.abs(M[k * n + k]);
      for (let r = k + 1; r < n; r++) { const v = Math.abs(M[r * n + k]); if (v > mx) { mx = v; pr = r; } }
      if (mx === 0) return 0;
      if (pr !== k) { for (let c = 0; c < n; c++) { const t = M[k * n + c]; M[k * n + c] = M[pr * n + c]; M[pr * n + c] = t; } sg = -sg; }
      const d = M[k * n + k]; if (d < 0) sg = -sg;
      for (let r = k + 1; r < n; r++) { const f = M[r * n + k] / d; if (f === 0) continue; for (let c = k; c < n; c++) M[r * n + c] -= f * M[k * n + c]; }
    }
    return sg;
  };
  const scan = (d) => {
    let cur = null, prev = null;
    for (let i = 0; i <= 150; i++) {
      const s = 15 * i / 150;
      const P = M2.makeProblem({ sigma: SIG, C: [cs, s + d, s - d, cs], A: [A, A], N });
      const r = M2.solve(P, cur ? { x0: cur, tol: 1e-15, maxIter: 300 } : { tol: 1e-15, maxIter: 300 });
      if (!(r.resNorm < 1e-11)) return { lost: s };
      cur = r.x;
      const sg = detSign(M2.jacobian(cur, P));
      if (prev !== null && sg !== prev) return { flip: s };
      prev = sg;
    }
    return {};
  };
  const at0 = scan(0), at1 = scan(0.2);
  ok('U1 at d = 0 the primary branch meets a singular Jacobian (the pitchfork)',
     at0.flip !== undefined, at0.flip !== undefined ? 'det changes sign at s = ' + at0.flip.toFixed(2) : JSON.stringify(at0));
  red('U2 at d = 0.2 the pitchfork has unfolded — no singularity along the whole s range',
      at1.flip === undefined && at1.lost === undefined,
      at1.flip !== undefined ? 'still singular at s = ' + at1.flip.toFixed(2) : (at1.lost !== undefined ? 'branch lost at s = ' + at1.lost.toFixed(2) : 'smooth across s in [0, 15]'));
}

/* ---------- report ------------------------------------------------------- */
const allChecks = checks.every(c => c.pass);
const allReds = reds.every(r => r.pass);
for (const c of checks) console.log((c.pass ? 'PASS  ' : 'FAIL  ') + c.name + (c.note ? '   [' + c.note + ']' : ''));
for (const r of reds) console.log((r.pass ? 'RED-OK' : 'RED-X ') + ' ' + r.name + (r.note ? '   [' + r.note + ']' : ''));
/* ---- the regime map's COVERING and TALLY, via instruments/covering ----
   The page states counts over a partition of the coupling plane, which is only
   meaningful if the cells actually account for the plane: a missing patch
   silently shrinks the denominator, a duplicated cell silently inflates a
   verdict. Area accounting settles both, and the tally must sum to the cells. */
{
  const COV = require(path.join(ROOT, 'instruments', 'covering', 'covering.js'));
  const rec = JSON.parse(require('fs').readFileSync(path.join(ROOT, 'certs', 'mfg2p-regime-map.json'), 'utf8'));
  const boxes = rec.cells.map((c) => ({ x: c.s, y: c.d }));
  const xs = boxes.flatMap((b) => b.x), ys = boxes.flatMap((b) => b.y);
  const region = { x: [Math.min(...xs), Math.max(...xs)], y: [Math.min(...ys), Math.max(...ys)] };
  const cov = COV.tileArea2D(boxes, region, { tol: 1e-9 });
  ok('regime map: the cells account for the coupling plane exactly', cov.ok, COV.describe2D(cov));
  const tally = Object.values(rec.counts || {}).reduce((a, b) => a + b, 0);
  ok('regime map: the verdict tally sums to the cell count', tally === rec.cells.length, tally + ' vs ' + rec.cells.length);
  red('one missing cell breaks the regime-map area accounting',
    !COV.tileArea2D(boxes.slice(0, boxes.length - 1), region, { tol: 1e-9 }).ok);
}

console.log('labs/mfg2p battery: ' + checks.filter(c => c.pass).length + '/' + checks.length + ' checks, ' +
            reds.filter(r => r.pass).length + '/' + reds.length + ' falsifiers');
if (!allChecks || !allReds) process.exit(1);
