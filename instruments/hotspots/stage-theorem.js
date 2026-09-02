/* stage-theorem.js — the assembled hot-spots theorem record.
   instruments/hotspots · cert-machine (ember port, 2026-09-02)

   Reads every stage record, re-verifies the cross-record chain (each
   stage's declared inputs equal the upstream outputs — no hand-copied
   constants anywhere), RE-DECIDES THE PARTITION IN EXACT RATIONALS
   (every 1/100 cell meeting Ω is exactly one of: entirely-in-tip [R1],
   core [corner-min depth ≥ 3/40], collar — counts must equal the sweep
   records), re-runs the assembly inequalities, and writes the theorem.

   THE ASSEMBLY. Suppose x* ∈ Ω interior attains max φ̂. Then φ̂(x*) ≥
   φ̂(w₊). But x* lies in a core cell (killed: sup + e < φ̂(w₊)), a collar
   cell (killed likewise with reflected e-bounds), or within RTIP of a
   vertex — where by convexity x* is in that vertex's sector, and the tip
   arguments run on the full sector r ≤ RTIP: B, C, D by value; A because
   an interior max forces ∇φ̂ = 0, contradicting ∂rφ̂ < 0. The minimum
   argument is symmetric with w₋′ (tips A, B, D by value; C by the
   min-form sector + the monotone wedge). ∎ */
'use strict';

const SP = require('./specimen.js');
const REC = require('./record.js');
const path = require('path');

function run() {
  const checks = [];
  const t0 = Date.now();

  const spec = REC.read('spectrum');
  const dfct = REC.read('defect');
  const eig = REC.read('eigenpair');
  const pw = REC.read('pointwise');
  const col = REC.read('collar');
  const cor = REC.read('corner');
  const crx = REC.read('cross');

  /* ---------- cross-record chain consistency ---------- */
  checks.push({ name: 'eigenpair inputs = spectrum + defect outputs', ok: eig.inputs.defectUpper === dfct.defectUpper && eig.inputs.mu1CR[0] === spec.mu1[0] && eig.inputs.mu1CR[1] === spec.mu1[1] && eig.inputs.mu2lo === spec.mu2lo });
  checks.push({ name: 'pointwise inputs = eigenpair outputs', ok: pw.inputs.E_L2 === eig.eigenfunctionL2Error && pw.inputs.deltaLambda === eig.deltaLambda && pw.inputs.mu1up === eig.mu1[1] });
  checks.push({ name: 'collar inputs = eigenpair + defect + pointwise outputs', ok: col.inputs.E_L2 === eig.eigenfunctionL2Error && col.inputs.witnessMax === pw.witnesses.max.value && col.inputs.witnessMinDeep === pw.witnesses.minDeep.value && JSON.stringify(col.inputs.supFluxPerEdge) === JSON.stringify(dfct.supFluxPerEdge) });
  checks.push({ name: 'corner inputs = eigenpair + pointwise outputs', ok: cor.inputs.E_L2 === eig.eigenfunctionL2Error && cor.inputs.mu1[0] === eig.mu1[0] && cor.inputs.mu1[1] === eig.mu1[1] && cor.inputs.witnessMax === pw.witnesses.max.value && cor.inputs.witnessMinDeep === pw.witnesses.minDeep.value });
  checks.push({ name: 'μ1 (eigenpair) ⊆ μ1 (spectrum CR)', ok: eig.mu1[0] >= spec.mu1[0] && eig.mu1[1] <= spec.mu1[1] });
  checks.push({ name: 'spectral gap: μ2 lower > μ1 upper ⇒ μ1 SIMPLE', ok: spec.mu2lo > spec.mu1[1] && spec.simple === true });

  /* ---------- the partition, RE-DECIDED IN EXACT RATIONALS ---------- */
  let tipCells = 0, coreCells = 0, collarCells = 0, exterior = 0;
  const D = 100;
  for (let ix = 0; ix < D; ix++) {
    for (let iy = 0; iy < 90; iy++) {
      const x0r = SP.rat(ix, D), y0r = SP.rat(iy, D), hr = SP.rat(1, D);
      const x1r = SP.radd(x0r, hr), y1r = SP.radd(y0r, hr);
      const corners = SP.cellCorners(x0r, x1r, y0r, y1r);
      if (SP.cellInTipQ(corners)) { tipCells++; continue; }
      if (!SP.cellTouchesSubCoreQ(corners)) { coreCells++; continue; }
      if (SP.cellMeetsDomainQ(x0r, x1r, y0r, y1r)) { collarCells++; continue; }
      exterior++;
    }
  }
  checks.push({
    name: 'PARTITION (rational re-decision): core cell count = pointwise record',
    ok: coreCells === pw.core.cells.coreCells,
    detail: `re-decided ${coreCells} vs record ${pw.core.cells.coreCells}`,
  });
  checks.push({
    name: 'PARTITION (rational re-decision): collar cell count = collar record',
    ok: collarCells === col.sweep.collarCells,
    detail: `re-decided ${collarCells} vs record ${col.sweep.collarCells}`,
  });
  checks.push({
    name: 'PARTITION: every grid cell classified exactly once (tip/core/collar/exterior)',
    ok: tipCells + coreCells + collarCells + exterior === D * 90,
    detail: `tip ${tipCells} + core ${coreCells} + collar ${collarCells} + exterior ${exterior} = ${D * 90}`,
  });
  /* the tip disks cover every R1 cell by construction (R1 = entirely inside
     one disk); the sector arguments cover every interior point within RTIP
     of a vertex by convexity — record the convexity fact explicitly */
  {
    // convexity: all cross products of consecutive edges positive, exact
    let convex = true;
    for (let e = 0; e < 4; e++) {
      const A = SP.VQR[e], B = SP.VQR[(e + 1) % 4], C = SP.VQR[(e + 2) % 4];
      const e1x = SP.rsub(B[0], A[0]), e1y = SP.rsub(B[1], A[1]);
      const e2x = SP.rsub(C[0], B[0]), e2y = SP.rsub(C[1], B[1]);
      const cr = SP.rsub(SP.rmul(e1x, e2y), SP.rmul(e1y, e2x));
      if (SP.rsign(cr) <= 0n) convex = false;
    }
    checks.push({ name: 'Ω convex (exact rational cross products)', ok: convex });
  }

  /* ---------- sweep verdicts ---------- */
  checks.push({ name: 'core sweep: zero survivors', ok: pw.core.cells.survivors === 0 });
  checks.push({ name: 'collar sweep: zero survivors', ok: col.sweep.survivors === 0 });
  checks.push({ name: 'core margins positive (both sides)', ok: pw.core.marginMax > 0 && pw.core.marginMin > 0, detail: `max ${pw.core.marginMax.toExponential(2)}, min ${pw.core.marginMin.toExponential(2)}` });
  checks.push({ name: 'collar kills strict (both sides)', ok: col.sweep.worstP < pw.witnesses.max.value && col.sweep.worstM < pw.witnesses.minDeep.value });

  /* ---------- tip verdicts (re-asserted from the corner record) ---------- */
  const WP = pw.witnesses.max.value, WM = pw.witnesses.minDeep.value;
  checks.push({ name: 'tip A: max side by ∂rφ̂ < 0; min side by value', ok: cor.tips.A.radialWorst < 0 && cor.tips.A.innerDisk < 0 && -cor.tips.A.valueRange[0] < WM });
  checks.push({ name: 'tip B: value kill both sides', ok: cor.tips.B.valueRange[1] < WP && -cor.tips.B.valueRange[0] < WM });
  checks.push({ name: 'tip D: value kill both sides', ok: cor.tips.D.valueRange[1] < WP && -cor.tips.D.valueRange[0] < WM });
  checks.push({ name: 'tip C: max side by value; min side by min-form + wedge', ok: cor.tips.C.valueRange[1] < WP && cor.tips.C.minFormWorst > 0 && cor.tips.C.wedgeWorstC2 > 0 && cor.tips.C.wedgeInnerC2 > 0 && cor.tips.C.b1[1] < 0 });

  /* ---------- COROLLARY: the hot spot is AT vertex A, and only there ------
     Derived entirely from the stage records (no new computation):
     (i)   w₊ lies inside tip A's sector (exact rational disk decision);
     (ii)  ∂rφ̂ < 0 on the whole punctured sector (cells + factored inner
           disk), so φ̂ strictly decreases along every ray from A — hence
           φ̂(A) > φ̂(w₊) ≥ WIT_P, and every other tip-A point is < φ̂(A);
     (iii) every point outside tip A is certified < WIT_P: core cells
           (sup + solid-mean bound), collar cells (reflected bounds), and
           the value ranges of tips B, C, D.
     At the vertex the expansion collapses to φ̂(A) = b₀(A) (J_{kν}(0) = 0
     for kν > 0), giving the two-sided value enclosure. The minimum's
     location is NOT decided: φ̂(C) = b₀(C) overlaps the observed boundary
     minimum, so vertex-vs-edge-interior is an open question of enclosure
     width, recorded as such. */
  const dbl2rat = (x) => { let e2 = 0, y = x; while (!Number.isInteger(y)) { y *= 2; e2++; } return SP.rat(BigInt(y), 1n << BigInt(e2)); };
  const wplus = pw.witnesses.max;
  const WPv = wplus.value;
  checks.push({
    name: 'COROLLARY (i): w₊ lies inside tip A\'s sector (exact rational)',
    ok: SP.distLeQ([dbl2rat(wplus.x), dbl2rat(wplus.y)], 0, SP.RTIP),
  });
  checks.push({
    name: 'COROLLARY (ii): φ̂ strictly radially decreasing on all of tip A',
    ok: cor.tips.A.radialWorst < 0 && cor.tips.A.innerDisk < 0,
    detail: `cells worst ${cor.tips.A.radialWorst.toExponential(2)}, inner disk ${cor.tips.A.innerDisk.toFixed(2)}`,
  });
  const outsideTipA = Math.max(
    pw.core.supPlus + pw.core.eBoundCore,
    col.sweep.worstP,
    cor.tips.B.valueRange[1], cor.tips.C.valueRange[1], cor.tips.D.valueRange[1]);
  checks.push({
    name: 'COROLLARY (iii): everything outside tip A is certified below φ̂(w₊)',
    ok: outsideTipA < WPv,
    detail: `${outsideTipA.toFixed(6)} < ${WPv.toFixed(6)}`,
  });
  const phiAtA = [Math.max(WPv, cor.tips.A.b0[0]), cor.tips.A.b0[1]];
  checks.push({ name: 'COROLLARY: φ̂(A) enclosure coherent (witness chain meets b₀(A))', ok: phiAtA[0] <= phiAtA[1], detail: `[${phiAtA[0].toFixed(6)}, ${phiAtA[1].toFixed(6)}]` });
  const corollary = {
    statement: 'The maximum of φ̂ over the closure is attained AT VERTEX A AND ONLY THERE, with φ̂(A) ∈ [' + phiAtA[0] + ', ' + phiAtA[1] + '] (= b₀(A) exactly, intersected with the witness chain). For triangles, extrema only at vertices is Judge–Mondal\'s refinement; for this quadrilateral the maximum-side analogue is now certified.',
    maxAtVertex: 'A',
    phiAtA,
    minimumLocation: 'OPEN — φ̂(C) = b₀(C) ∈ [' + cor.tips.C.b0[0] + ', ' + cor.tips.C.b0[1] + '] overlaps the observed boundary minimum (float −1.9998 at distance 0.0195 from C along the top edge); whether the cold spot is at vertex C or strictly inside the edge is undecided at current enclosure widths — a tighter corner extraction would decide it, and an off-vertex answer would contrast with the triangle behaviour.',
  };

  /* ---------- cross-derivations present and verified ---------- */
  checks.push({ name: 'cross-derivations record VERIFIED (I₀, C_tr bigfloat, P1 upper, two-annulus)', ok: crx.verdict === 'VERIFIED' });

  const ok = checks.every(c => c.ok);
  const recShas = {};
  for (const st of ['spectrum', 'defect', 'eigenpair', 'pointwise', 'collar', 'corner', 'cross']) {
    recShas['ember-' + st + '.json'] = REC.sha256(path.join(REC.CERTS, 'ember-' + st + '.json'));
  }

  return {
    verdict: ok ? 'VERIFIED' : 'REFUSED',
    statement: 'THEOREM. Let Ω be the trapezoid with vertices A=(0,0), B=(1,0), C=(17/20,9/10), D=(1/4,9/10) — convex, side slopes 6 and 18/5, no axis of symmetry, not a lip domain; to our knowledge outside every class for which the hot spots conjecture was previously proven. The second Neumann eigenvalue μ1 is SIMPLE, with μ1 ∈ [' + eig.mu1[0] + ', ' + eig.mu1[1] + '], and the second Neumann eigenfunction attains its maximum and its minimum on ∂Ω ONLY. COROLLARY: the maximum is attained at vertex A and only there.',
    corollary,
    honestFraming: {
      claim: 'to our knowledge the first certified hot-spots domain outside every analytically proven class — ONE domain, ONE theorem; the quadrilateral census is future work and is not counted',
      fences: [
        'Judge–Mondal: all triangles (Annals of Mathematics, 2020; and the 2022 erratum); earlier partial acute-triangle results (Siudeja, arXiv:1308.3005)',
        'lip domains (Atar–Burdzy)',
        'certain non-convex polygons: L-tiled domains (Hatcher, arXiv:2405.19508)',
        'symmetric quadrangle subcases (Deng–Gui–Jiang–Yang–Yao, arXiv:2604.19003, Apr 2026)',
        'THE OTHER DIRECTION: in sufficiently high dimension the conjecture is FALSE for convex sets (de Dios Pont, arXiv:2412.06344, "Convex sets can have interior hot spots") — the planar convex case is exactly where the conjecture remains expected, and this domain sits there',
        'computational antecedent, cited not fenced: the Polymath7 project developed a validated-numerics route to acute triangles (numerics by Nigam) before the analytic triangle proof',
      ],
      raceWatch: 'arXiv weekly for quadrilateral hot-spots claims',
      status: 'machine-derived, not peer-reviewed, not independently rerun',
    },
    mu1: eig.mu1,
    simple: true,
    chain: {
      spectrum: { mu1CR: spec.mu1, mu2lo: spec.mu2lo },
      defect: { defectUpper: dfct.defectUpper },
      eigenpair: { mu1: eig.mu1, E_L2: eig.eigenfunctionL2Error, Ctr: eig.trace.Ctr },
      pointwise: { witnesses: { max: pw.witnesses.max.value, minDeep: pw.witnesses.minDeep.value }, coreSup: [pw.core.supPlus, pw.core.supMinus] },
      collar: { cells: col.sweep.collarCells, survivors: col.sweep.survivors },
      corner: { valueRanges: { A: cor.tips.A.valueRange, B: cor.tips.B.valueRange, C: cor.tips.C.valueRange, D: cor.tips.D.valueRange } },
      cross: { CtrBigfloat: crx.Ctr.bigfloat, p1Upper: crx.p1Upper.upper },
    },
    partition: { grid: '1/100', tipCells, coreCells, collarCells, exterior, rules: 'R1 entirely-in-tip (exact); core = corner-min depth ≥ 3/40 (exact, concavity); collar = the rest meeting Ω (exact SAT)' },
    records: recShas,
    checks,
    secs: +((Date.now() - t0) / 1000).toFixed(1),
  };
}

module.exports = { run };
