#!/usr/bin/env node
/* battery.js — the gate on instruments/hotspots (the ember chain).

   The chain itself (~2 min) runs via tools/run-ember-chain.js and writes
   one record per stage. This battery re-proves the CHEAP stages live at
   every run, walks the records (cross-stage inputs must equal upstream
   outputs; every inequality of the assembly re-checked from record
   numbers), re-decides the partition IN EXACT RATIONALS, and fires the
   red controls EMBER-PORT.md demands:
     R1 a mutated vertex is refused (convexity, in rationals)
     R2 an inflated defect breaks the eigenpair tightening
     R3 a forged kernel norm I₀ ≠ 5/48 is refused in exact rationals
     R4 an inflated boundary-flux sup refuses a collar kill — the
        reflection single-layer term is load-bearing, not decorative
     R5 a sign-flipped ladder identity breaks the wedge
     R6 a witness moved into the core breaks the assembly
     R7 the BENCH'S original tip-skip rule (min-corner distance) is shown
        to leave cells uncovered — the port's R1 rule sweeps them */
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const I = require('#instruments/interval/interval.js');
const Q = require('#instruments/interval/rational.js');
const SP = require('#instruments/hotspots/specimen.js');
const UE = require('#instruments/hotspots/ueval.js');
const PW = require('#instruments/hotspots/stage-pointwise.js');
const EP = require('#instruments/hotspots/stage-eigenpair.js');
const COL = require('#instruments/hotspots/stage-collar.js');
const COR = require('#instruments/hotspots/stage-corner.js');

const { iv } = I;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('PASS  ' + m); } else { fail++; console.log('FAIL  ' + m); } };

/* ---------- 0 · pins ---------- */
{
  const pins = {
    'THEOREM.md': '5bbfc2793485525619cb5a21f3c0ecca69ffdef942789271e2271a20d06ff602',
    'cert-assemble.js': '02a411ffaa35bf16e3963b20bc08d4088aac5c73dd829e4867844298f435ea70',
    'cert-collar.js': 'f82dd0b98278e5a0678b417c95b6319a5bce9f6dc51bdd43d280ed67b4b4c402',
    'cert-corner.js': '54df0cea8deb596699e4931ad2cae76ce15c1ca68eea2b6d228cf7a3567cb679',
    'cert-defect.js': '6211c70157fb22fd6120fd45fc30cc669820f51ecf91c074ba74ed081562a73c',
    'cert-pointwise.js': '4b906495ff9cd5b560c24fb266d5012f24388f602f1cbda457f02790fe285149',
    'run-p2a.js': '989a6d87d6dccce287761c6a0cef08bec514de99d7e9ab8cb5c47b741b044fbf',
    'run-p2a2.js': '78bafa19f2add27ae7a60b5a2beb0578dd158731b06fbd99b8d4cb82673bcfe6',
    'run-p2b-mps.js': 'e5a45c2a60a6515665fd2bc8cfeae789fb846d48114f8c0ec0594730e79b4031',
  };
  let all = true;
  for (const [f, want] of Object.entries(pins)) {
    const got = crypto.createHash('sha256')
      .update(fs.readFileSync(path.join(__dirname, 'frontier-ref', f))).digest('hex');
    if (got !== want) all = false;
  }
  ok(all, 'pin: 9 frontier-ref sources re-hashed unchanged');
}

/* ---------- 1 · the records ---------- */
const CERTS = path.join(__dirname, '..', '..', 'certs');
const rec = {};
{
  let all = true, verdicts = true;
  for (const st of ['spectrum', 'defect', 'eigenpair', 'pointwise', 'collar', 'corner', 'cross', 'theorem']) {
    const f = path.join(CERTS, 'ember-' + st + '.json');
    if (!fs.existsSync(f)) { all = false; continue; }
    rec[st] = JSON.parse(fs.readFileSync(f, 'utf8'));
    if (rec[st].verdict !== 'VERIFIED') verdicts = false;
  }
  ok(all, 'all 8 ember records present');
  ok(verdicts, 'all 8 verdicts VERIFIED');
  if (!all || !verdicts) { console.log('\nhotspots battery: ' + pass + ' pass, ' + (fail) + ' fail'); process.exit(1); }
}
{
  const wantV = ['(0, 0)', '(1, 0)', '(17/20, 9/10)', '(1/4, 9/10)'];
  ok(Object.values(rec).every(r => JSON.stringify(r.specimen.vertices) === JSON.stringify(wantV)),
    'every record names the EXACT RATIONAL vertices');
  ok(Object.values(rec).every(r => r.trustBase.some(t => /arXiv:1808\.08148/.test(t))),
    'every record names the Liu literature inputs in its trust base');
  const pin = require('#instruments/pin.js').verify('liu2018_arxiv-1808-08148.pdf');
  ok(pin.ok, 'Liu arXiv:1808.08148 pinned source re-hashed unchanged');
  const forged = require('#instruments/pin.js').verify('liu2018_arxiv-1808-08148.pdf',
    { pins: { 'liu2018_arxiv-1808-08148.pdf': '0'.repeat(64) } });
  ok(!forged.ok, 'RED: a forged Liu pin is REFUSED at re-hash');
}

/* ---------- 2 · the assembly, re-walked from record numbers ---------- */
{
  const s = rec.spectrum, e = rec.eigenpair, p = rec.pointwise, c = rec.collar, k = rec.corner;
  ok(s.mu2lo > s.mu1[1], 'gap: μ2 lower > μ1 upper (μ1 simple), from the record');
  ok(e.mu1[0] >= s.mu1[0] && e.mu1[1] <= s.mu1[1], 'eigenpair μ1 nested in CR μ1');
  ok(e.inputs.defectUpper === rec.defect.defectUpper, 'eigenpair consumed the defect record, not a hand copy');
  ok(p.core.cells.survivors === 0 && c.sweep.survivors === 0, 'both sweeps: zero survivors');
  ok(p.core.marginMax > 0 && p.core.marginMin > 0, 'core margins positive');
  ok(c.sweep.worstP < p.witnesses.max.value && c.sweep.worstM < p.witnesses.minDeep.value, 'collar kills strict vs witnesses');
  const WP = p.witnesses.max.value, WM = p.witnesses.minDeep.value;
  ok(k.tips.B.valueRange[1] < WP && -k.tips.B.valueRange[0] < WM &&
     k.tips.D.valueRange[1] < WP && -k.tips.D.valueRange[0] < WM &&
     k.tips.C.valueRange[1] < WP && -k.tips.A.valueRange[0] < WM,
    'tip value kills re-checked from the record');
  ok(k.tips.A.radialWorst < 0 && k.tips.A.innerDisk < 0, 'tip A radial monotonicity re-checked');
  ok(k.tips.C.b1[1] < 0 && k.tips.C.minFormWorst > 0 && k.tips.C.wedgeWorstC2 > 0 && k.tips.C.wedgeInnerC2 > 0,
    'tip C min-form + wedge re-checked');
  let annOk = true;
  for (const t of Object.values(k.tips))
    for (const kk of ['b0', 'b1', 'b2'])
      if (t[kk][1] < t.secondAnnulus[kk][0] || t[kk][0] > t.secondAnnulus[kk][1]) annOk = false;
  ok(annOk, 'two-annulus corner extraction intersects (condition of entry)');
  /* the vertex-A corollary, re-walked from the numbers it rests on */
  const cy = rec.theorem.corollary;
  const outsideA = Math.max(p.core.supPlus + p.core.eBoundCore, c.sweep.worstP,
    k.tips.B.valueRange[1], k.tips.C.valueRange[1], k.tips.D.valueRange[1]);
  ok(cy && cy.maxAtVertex === 'A'
    && k.tips.A.radialWorst < 0 && k.tips.A.innerDisk < 0
    && outsideA < p.witnesses.max.value
    && cy.phiAtA[0] >= p.witnesses.max.value && cy.phiAtA[1] <= k.tips.A.b0[1],
    'COROLLARY re-walked: the hot spot is at vertex A and only there');
}

/* ---------- 3 · live re-proofs (cheap) ---------- */
ok(Q.isZero(Q.sub(PW.I0Exact(), Q.R(5n, 48n))), 'LIVE: I₀ = 5/48 re-derived in exact rationals');
{
  const TC = EP.traceConstant();
  ok(Math.abs(TC.Ctr[1] - rec.eigenpair.trace.Ctr) < 1e-12, 'LIVE: C_tr re-derived, matches the record');
}
{
  /* convexity + the rational partition census vs both sweep records */
  let convex = true;
  for (let e = 0; e < 4; e++) {
    const A = SP.VQR[e], B = SP.VQR[(e + 1) % 4], C = SP.VQR[(e + 2) % 4];
    const cr = SP.rsub(SP.rmul(SP.rsub(B[0], A[0]), SP.rsub(C[1], B[1])), SP.rmul(SP.rsub(B[1], A[1]), SP.rsub(C[0], B[0])));
    if (SP.rsign(cr) <= 0n) convex = false;
  }
  ok(convex, 'LIVE: Ω convex in exact rationals');
  let core = 0, collar = 0;
  for (let ix = 0; ix < 100; ix++) for (let iy = 0; iy < 90; iy++) {
    const x0 = SP.rat(ix, 100), y0 = SP.rat(iy, 100), h = SP.rat(1, 100);
    const x1 = SP.radd(x0, h), y1 = SP.radd(y0, h);
    const cs = SP.cellCorners(x0, x1, y0, y1);
    if (SP.cellInTipQ(cs)) continue;
    if (!SP.cellTouchesSubCoreQ(cs)) { core++; continue; }
    if (SP.cellMeetsDomainQ(x0, x1, y0, y1)) collar++;
  }
  ok(core === rec.pointwise.core.cells.coreCells && collar === rec.collar.sweep.collarCells,
    `LIVE: partition re-decided in rationals — core ${core}, collar ${collar} match the sweep records`);
}
{
  /* witnesses live inside tip disks (so the tip lemmas own their cells) */
  const dbl2rat = (x) => { let e = 0, y = x; while (!Number.isInteger(y)) { y *= 2; e++; } return SP.rat(BigInt(y), 1n << BigInt(e)); };
  const inTip = (w) => [0, 1, 2, 3].some(v => SP.distLeQ([dbl2rat(w.x), dbl2rat(w.y)], v, SP.RTIP));
  ok(inTip(rec.pointwise.witnesses.max) && inTip(rec.pointwise.witnesses.min) && inTip(rec.pointwise.witnesses.minDeep),
    'LIVE: all three witnesses sit inside tip disks (exact) — no self-defeating sweep cell');
}
{
  /* one representative collar cell killed live with the true inputs */
  const inputs = {
    E_L2: rec.eigenpair.eigenfunctionL2Error, DLAM: rec.eigenpair.deltaLambda,
    MU1_UP: rec.eigenpair.mu1[1], NU_UP: rec.pointwise.NuUpGlobal,
    SUPD: rec.defect.supFluxPerEdge,
    WIT_P: rec.pointwise.witnesses.max.value, WIT_M_DEEP: rec.pointwise.witnesses.minDeep.value,
  };
  const K1 = COL.makeKiller(inputs);
  const killed = K1.killCollar(SP.rat(72, 100), SP.rat(89, 100), SP.rat(1, 100), 0);
  ok(killed && K1.stats.survivors === 0, 'LIVE: a top-edge collar cell near the min basin is killed with the true inputs');

  /* R4: inflate the flux sup — the reflection layer must refuse the kill */
  const K2 = COL.makeKiller({ ...inputs, SUPD: inputs.SUPD.map(s => s * 1e5) });
  K2.killCollar(SP.rat(72, 100), SP.rat(89, 100), SP.rat(1, 100), 3);
  ok(K2.stats.survivors > 0, 'RED: flux sup ×1e5 REFUSES the same kill — the single-layer term is load-bearing');
}
{
  /* R5: the ladder identity, correct then sign-flipped via a forged b1 */
  const MC = COR.makeMachinery(rec.eigenpair.eigenfunctionL2Error, rec.eigenpair.mu1);
  const X = rec.corner.tips.C;
  const rI = iv(1e-4, 2e-4), thI = iv(0, 0.35);
  let c2true = I.ZERO, c2flip = I.ZERO;
  for (const [bk, kk] of [[X.b0, 0], [X.b1, 1], [X.b2, 2]]) {
    c2true = I.add(c2true, MC.ladderTT(2, bk, kk, rI, thI));
    const bkF = kk === 1 ? [-bk[1], -bk[0]] : bk;
    c2flip = I.add(c2flip, MC.ladderTT(2, bkF, kk, rI, thI));
  }
  const mu1up = rec.eigenpair.mu1[1];
  const phiUp = 0; // φ̂ ≤ 0 near the min corner; −μφ̂ ≥ 0 — drop it on both sides
  ok(-mu1up * phiUp - c2true[1] > 0, 'LIVE: wedge c₂ > 0 at a small-r band with the certified b₁ < 0');
  ok(!(-mu1up * phiUp - c2flip[1] > 0), 'RED: sign-flipping the singular ladder term (b₁ forged positive) BREAKS the wedge');
}

/* ---------- 4 · the remaining reds ---------- */
{
  /* R1: a mutated vertex is refused by the convexity decider */
  const VQR2 = SP.VQR.map(p => p.map(r => ({ ...r })));
  VQR2[2][0] = SP.rat(1, 5); // C moved left of D — non-convex ordering
  let convex = true;
  for (let e = 0; e < 4; e++) {
    const A = VQR2[e], B = VQR2[(e + 1) % 4], C = VQR2[(e + 2) % 4];
    const cr = SP.rsub(SP.rmul(SP.rsub(B[0], A[0]), SP.rsub(C[1], B[1])), SP.rmul(SP.rsub(B[1], A[1]), SP.rsub(C[0], B[0])));
    if (SP.rsign(cr) <= 0n) convex = false;
  }
  ok(!convex, 'RED: vertex C mutated to (1/5, 9/10) is REFUSED by the rational convexity decider');
}
{
  /* R2: an inflated defect breaks the eigenpair tightening */
  const e = rec.eigenpair, s = rec.spectrum;
  const D100 = rec.defect.defectUpper * 100;
  const eps = D100 * e.trace.Ctr;
  const muBound = eps * Math.sqrt(1 + s.mu1[1]) / Math.sqrt(Math.max(1e-12, e.normLower * e.normLower - eps * eps * e.F));
  const width = Math.min(s.mu1[1], 12.021687243 + muBound) - Math.max(s.mu1[0], 12.021687243 - muBound);
  ok(!(width < (s.mu1[1] - s.mu1[0]) / 50), 'RED: defect ×100 FAILS the μ1-tightening criterion (window ' + width.toExponential(2) + ')');
}
{
  /* R3: forged I₀ */
  ok(!Q.isZero(Q.sub(PW.I0Exact(), Q.R(7n, 48n))), 'RED: I₀ forged to 7/48 is REFUSED by the exact derivation');
}
{
  /* R6: a witness moved into the core breaks the assembly */
  const p = rec.pointwise;
  const centroid = { x: 0.525, y: 0.45 };
  const ctr = UE.uEval(iv(centroid.x), iv(centroid.y), false).val;
  const forgedWitness = ctr[0] - p.core.eBoundCore; // an honest bound at a core point
  ok(!(forgedWitness > p.core.supPlus + p.core.eBoundCore),
    'RED: a witness moved to the centroid (a core point) CANNOT beat the core sup — the assembly refuses');
}
{
  /* R7: the bench's original skip rule leaves cells uncovered; R1 does not */
  let uncovered = 0;
  for (let ix = 0; ix < 100; ix++) for (let iy = 0; iy < 90; iy++) {
    const x0 = SP.rat(ix, 100), y0 = SP.rat(iy, 100), h = SP.rat(1, 100);
    const x1 = SP.radd(x0, h), y1 = SP.radd(y0, h);
    const cs = SP.cellCorners(x0, x1, y0, y1);
    if (!SP.cellMeetsDomainQ(x0, x1, y0, y1)) continue;
    // bench rule: skipped from the sweep if ANY corner within 0.11 of ANY vertex
    const benchSkipped = cs.some(pnt => [0, 1, 2, 3].some(v => SP.distLeQ(pnt, v, SP.RTIP)));
    if (!benchSkipped) continue;
    // ...but NOT entirely inside one disk ⇒ contains points beyond every tip
    if (!SP.cellInTipQ(cs)) uncovered++;
  }
  ok(uncovered > 0, `RED: the bench skip rule leaves ${uncovered} cells outside both its collar sweep and every tip disk (only their depth ≥ 0.075 fraction could have reached its core cover) — the port's R1 rule sweeps them whole`);
}

console.log('');
console.log('hotspots battery: ' + pass + ' pass, ' + fail + ' fail');
if (fail) process.exit(1);
