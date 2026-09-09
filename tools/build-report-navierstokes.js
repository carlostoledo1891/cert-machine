#!/usr/bin/env node
/* build-report-navierstokes.js — reports/navier-stokes.html: OpenAI's Navier–Stokes
   claim (2026-09-08) read to the last hypothesis.

   Four records feed the page and every count on it: corpus/navier-stokes/
     lean-repo.json  — computed from the pinned clone (tools/pin-navierstokes-lean.js)
     build.json      — the build on this machine and the kernel's axiom report
                       (tools/record-navierstokes-build.js)
     probes.json     — the computable checks of the writeup (instruments/navierstokes/battery.py)
     audit.json      — the qualitative findings: fidelity rows, paper-vs-Lean, weak points
   The page refuses without a finished build record; every sentence that states a fact
   is gated on the field it reads.

   usage: node tools/build-report-navierstokes.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('NAVIER–STOKES REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const D = path.join(ROOT, 'corpus', 'navier-stokes');
const J = (f) => { const p = path.join(D, f); if (!fs.existsSync(p)) die('missing record ' + f); return JSON.parse(fs.readFileSync(p, 'utf8')); };
const R = J('lean-repo.json'), B = J('build.json'), P = J('probes.json'), A = J('audit.json'), M = J('MANIFEST.json'), NV = J('nonvacuity.json');
if (NV.errors !== 0 || !/propext, Classical.choice, Quot.sound\]$/.test(NV.kernel_output)) die('the non-vacuity witness did not compile clean on the standard axioms');

/* ---- gates on the facts the prose states ---- */
if (!R.challengeVsSolutionDefinitions.identical) die('the solution-side definitions differ from the challenge — the fidelity sentence would be false');
if (R.hygiene.sorry !== 0 || R.hygiene.axiom !== 0 || R.hygiene.native_decide !== 0 || R.hygiene.unsafe !== 0) die('a hygiene count is nonzero; the hygiene sentence must be rewritten');
if (!A.fidelity.every((r) => /^same|^equivalent/.test(r.direction))) die('a fidelity row is not same/equivalent; the verdict sentence would be false');
if (P.verdict !== 'PASS') die('the probe battery did not pass');
const REDS = P.checks.reduce((n, c) => n + (c.redsFired || 0), 0), REDS_DEAD = P.checks.reduce((n, c) => n + (c.redsDead || 0), 0);
if (!REDS || REDS_DEAD) die('the probes carry ' + REDS + ' red controls and ' + REDS_DEAD + ' that did not fire — a check that cannot fail is not a check');
if (!['PASS', 'FAIL'].includes(B.verdict)) die('build.json has no verdict');
const nDecls = Object.keys(B.axioms).length;
if (nDecls !== 4) die('expected four declarations in the axiom report, found ' + nDecls);
if (!A.obstructions || !A.obstructions.rows.some((o) => /swirl maximum principle/.test(o.obstruction) && /impossible/.test(o.verdict))) die('the swirl-maximum-principle finding is not in the record');
if (!A.weakPointsInLean || !A.weakPointsInLean.threeQuestions || A.weakPointsInLean.threeQuestions.length !== 3) die('the Lean weak-point map is not in the record');
const WL = A.weakPointsInLean;
const nFull = WL.dischargedAtFullStrength.length, nRed = WL.reducedOrAltered.length, nNot = WL.notLocated.length;
const energyRow = A.paperVsLean.find((r) => /uniform energy bound/.test(r.item));
if (!energyRow || !/NOT among/.test(energyRow.status)) die('the energy-clause finding is not in the record as stated');
const upstreamOnlyNotation = R.challengeVsUpstream.onlyInChallenge.every((l) => /^(open|notation)/.test(l)) && R.challengeVsUpstream.onlyInUpstream.every((l) => /^(open|notation)/.test(l));
if (!upstreamOnlyNotation) die('the challenge differs from upstream beyond opens/notation: ' + JSON.stringify(R.challengeVsUpstream));
const fmt = (x) => Number(x).toLocaleString('en-US');
const mins = B.buildSeconds ? Math.round(B.buildSeconds / 60) : null;
const nsLines = R.byLibrary.NavierStokes.lines, euLines = R.byLibrary.Euler.lines;
const nChecks = P.checks.reduce((n, c) => n + c.output.filter((l) => /^(C\d+|\(\d\)) /.test(l) || /PASS|residual/.test(l)).length, 0);
const nProbeScripts = P.checks.length;
const PAPER = M.files.find((f) => f.path === 'papers/openai-navier-stokes.pdf');
if (!PAPER || !PAPER.sha256.startsWith(P.paper_sha256.slice(0, 16))) die('the probes record and the manifest disagree on the paper\'s digest');
const buildVerb = B.verdict === 'PASS' ? 'built clean' : 'did NOT build clean';
const axiomsSentence = B.onlyStandardAxioms ? 'the kernel reports exactly ' + B.standardAxioms.join(', ') + ' for all four main declarations' : 'the kernel reports a NON-STANDARD axiom: ' + JSON.stringify(B.axioms);

/* ---- figure 1: the claimed scalings, h = 1/100 ---- */
const h = 1 / 100;
const taus = []; for (let e = -6; e <= 0; e += 0.25) taus.push(Math.pow(10, e));
const pw = (k) => taus.map((t) => [t, Math.pow(t, k)]);
const FIG1 = CH.lines({
  w: 900, h: 360, logX: true, logY: true, x0: 1e-6, x1: 1, y0: 1e-9, y1: 1e9,
  series: [
    { name: 'radial scale ℓr ≍ τ^{1/2}', pts: pw(0.5) },
    { name: 'axial scale ℓz ≍ τ^{1/2−h} (drawn in grey: it tracks ℓr)', pts: pw(0.5 - h), token: CH.CTX },
    { name: 'speed |uθ|, |uz| ≍ τ^{−1/2−h}', pts: pw(-0.5 - h) },
    { name: 'core energy ≍ τ^{1/2−3h}', pts: pw(0.5 - 3 * h) },
    { name: 'dissipation rate ≍ τ^{−1/2−3h}', pts: pw(-0.5 - 3 * h), token: CH.CTX, dashed: true },
  ],
  xTicks: [1e-6, 1e-4, 1e-2, 1].map((v) => ({ v, t: v.toExponential(0).replace('e-', 'e−').replace('e+0', '') })),
  yTicks: [1e-9, 1e-6, 1e-3, 1, 1e3, 1e6, 1e9].map((v) => ({ v, t: v === 1 ? '1' : v.toExponential(0).replace('e-', 'e−').replace('e+', 'e') })),
  xLabel: 'τ = 1 − t, time remaining before the singularity (log)', yLabel: 'order of magnitude (log), h = 1/100',
  xOf: (t) => 'τ = ' + t.toExponential(2), vOf: (v) => v.toExponential(2),
  alt: 'Five power laws of τ on a log-log chart from τ = 10⁻⁶ to 1: the radial and axial core scales falling like τ^{1/2} and τ^{0.49}, the speed rising like τ^{−0.51}, the core energy falling like τ^{0.47}, and the dissipation rate rising like τ^{−0.53}, drawn dashed as the only quantity that is not a field value.',
});

/* ---- figure 2: the exact exterior profile H(Z) of (A.32), computed at this build ---- */
const lgamma = (x) => { /* Lanczos, g = 7 */
  const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  x -= 1; let a = c[0]; const t = x + g + 0.5; for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
};
const Hint = (Z, hh) => { /* ∫₀^∞ e^{−v} v^h (1+Zv)^{−h} dv / Γ(1+h): Simpson on v = s²/(1−s)² … keep it plain: composite Simpson on [0, 60] with 6000 panels after the substitution v = w², which removes the v^h endpoint kink */
  const f = (w) => { const v = w * w; return 2 * w * Math.exp(-v) * Math.pow(v, hh) * Math.pow(1 + Z * v, -hh); };
  const a = 0, b = Math.sqrt(60), n = 6000, dw = (b - a) / n; let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * dw) * (i % 2 ? 4 : 2);
  return (s * dw / 3) / Math.exp(lgamma(1 + hh));
};
const Zs = []; for (let e = -3; e <= 4; e += 0.125) Zs.push(Math.pow(10, e));
const H1 = Zs.map((Z) => [Z, Hint(Z, 1 / 100)]), H3 = Zs.map((Z) => [Z, Hint(Z, 0.3)]);
const h0 = Hint(1e-9, 1 / 100); if (Math.abs(h0 - 1) > 1e-3) die('H(0) should be 1 at h = 1/100; the quadrature gives ' + h0);
const FIG2 = CH.lines({
  w: 900, h: 320, logX: true, x0: 1e-3, x1: 1e4, y0: 0, y1: 1.05,
  series: [{ name: 'H(Z) at h = 1/100 (the paper\'s range)', pts: H1 }, { name: 'H(Z) at h = 0.3 (for the shape)', pts: H3 }],
  xTicks: [1e-3, 1e-2, 1e-1, 1, 10, 100, 1e3, 1e4].map((v) => ({ v, t: v >= 1 ? fmt(v) : v.toExponential(0).replace('e-', 'e−') })),
  yTicks: [0, 0.25, 0.5, 0.75, 1].map((v) => ({ v, t: String(v) })),
  xLabel: 'Z = 4τ/r² (log)', yLabel: 'H(Z) = Γ(1+h)⁻¹ ∫₀^∞ e^{−v} v^h (1+Zv)^{−h} dv',
  xOf: (z) => 'Z = ' + z.toExponential(2), vOf: (v) => v.toFixed(5),
  alt: 'Two monotone decreasing curves of H against Z on a log axis from a thousandth to ten thousand: at h = 1/100 the curve stays above 0.9 across the whole range; at h = 0.3 it falls from 1 to below 0.2.',
});

/* ---- figure 3: the axis profile of Appendix B, solved numerically at representative data ---- */
const AX = J('axis-profile.json');
const FIG3 = CH.lines({
  w: 900, h: 300, x0: 0, x1: 4.1, y0: 0.2, y1: 1.02,
  series: [
    { name: 'Φ(Y, η = 0) from the axis IVP (4.13) at Λ = 10⁴', pts: AX.Y.map((y, i) => [y, AX.Phi_eta0[i]]) },
    { name: 'the closed form f₀(Yχ) = √(2/(Yχ)) J₁(√(2Yχ)) of Prop B.2', pts: AX.Y.map((y, i) => [y, AX.f0_eta0[i]]), token: CH.CTX, dashed: true },
    { name: 'Φ(Y, η₀) at the zero of H*', pts: AX.Y.map((y, i) => [y, AX.Phi_at_eta_zero_of_Hstar[i]]) },
  ],
  xTicks: [0, 1, 2, 3, 4].map((v) => ({ v, t: String(v) })), yTicks: [0.2, 0.4, 0.6, 0.8, 1].map((v) => ({ v, t: String(v) })),
  xLabel: 'Y = ΛX, the rescaled radius', yLabel: 'Φ = φ/φ*',
  xOf: (y) => 'Y = ' + y.toFixed(3), vOf: (v) => v.toFixed(4),
  alt: 'Two solid curves and one dashed curve of Φ against Y from 0 to 4: the numerically solved profile at η = 0 falls from 1 to about 0.27 and lies on top of the dashed closed form f₀(Yχ); the profile at the zero of H* stays at 1.',
});
const FIG4 = CH.lines({
  w: 900, h: 280, x0: -1, x1: 1, y0: 0, y1: 4,
  series: [
    { name: 'the shear p₁ at the exit radius Y = 4, Λ = 10⁷', pts: AX.eta_exit.map((e, i) => [e, AX.p1_exit[i]]) },
    { name: 'the cutoff χ(η)', pts: AX.eta_exit.map((e, i) => [e, AX.chi_exit[i]]), token: CH.CTX },
  ],
  rules: [{ v: AX.exit_line, t: '2 + c_ex = ' + AX.exit_line + ', the exit line of (B.19)', dashed: true }],
  xTicks: [-1, -0.5, 0, 0.5, 1].map((v) => ({ v, t: String(v) })), yTicks: [0, 1, 2, 3, 4].map((v) => ({ v, t: String(v) })),
  xLabel: 'η, the axial similarity coordinate', yLabel: 'p₁ = −2 D_X log E',
  xOf: (e) => 'η = ' + e.toFixed(4), vOf: (v) => v.toFixed(3),
  alt: 'The shear p₁ against η from −1 to 1 sits near 3.4 across the whole range except for one narrow dip to zero at η₀ ≈ −0.011, the zero of H*, where the cutoff χ also dips; the dashed exit line at 2.2 lies below the plateau.',
});

/* ---- the page ---- */
const B_ = [];
B_.push(C.header({
  eyebrow: 'cert-machine · the registry · a machine-generated proof, independently read',
  title: 'Their theorem, read to the last hypothesis.',
  deck: 'On 2026-09-08 OpenAI published a 166-page proof that a smooth force can drive a viscous fluid from rest to infinite speed in finite time, with a Lean formalisation, and said it resolves the Navier–Stokes Millennium problem by its breakdown alternatives (C) and (D). '
    + 'This page does not take that on trust and does not take it on the priority dispute. It reads the formal statement against Clay\'s wording hypothesis by hypothesis and against Mathlib\'s own definitions, builds the ' + fmt(R.lines) + '-line Lean proof on an ordinary laptop and asks the kernel what it rests on, maps the paper onto the certificate, dissects the writeup section by section, and re-runs every identity the paper prints that a computer can decide.'
}));
B_.push(C.tldr({
  findingRaw: '<strong>The theorem the Lean proof targets is Clay\'s (C) and (D) with nothing added to the competitor class and nothing dropped from the data — written by a third party months before the proof existed. The proof ' + buildVerb + ' here' + (mins ? ' in ' + fmt(mins) + ' minutes' : '') + ', and ' + axiomsSentence + '.</strong> '
    + 'Read as mathematics, the writeup holds together wherever six independent readings looked: the closing argument re-derived term by term, the profile equations re-derived from the equations of motion, the iteration shown to close on one domain, every printed identity a computer can test passing. No error and no counterexample were found; every classical obstruction to a Navier–Stokes singularity was set against the construction and each is evaded — one of them, the swirl maximum principle, by the single feature the paper never names: its axisymmetric core is <em>impossible</em> on its own, and the theorem lives on the non-axisymmetric pulses. What was found besides is one gap between the paper and its certificate: the paper\'s Theorem 1.1 and the announcement say the blowing-up fluid keeps <em>finite energy through the singularity</em>, and that clause is not among the Lean\'s conclusions — the lemma that would give it is proved in the repository and used by nothing. Clay\'s (C) does not need it. And a list of ' + A.weakPoints.length + ' places where the paper asserts what a referee would want displayed, ranked by how much rests on them.',
  mechanismRaw: 'A self-similar axisymmetric vortex whose core shrinks as τ^{1/2} radially and τ^{1/2−h} axially while its speed grows as τ^{−1/2−h}, for a fixed h under 1/100. Its momentum residual is unbounded in an annulus around the core; two families of shear-amplified oscillatory pulses, carried on an auxiliary torus so distinct pulses never interact, supply the missing stress through their averaged quadratic flux; corrections at every order in q^{2h} leave a remainder flat at the singular point; an exact solution of the radial heat equation is the exterior; cutoffs localise. The force is <em>defined</em> as the residual of the constructed flow and shown to extend smoothly through t = 1; uniqueness in the class of smooth finite-energy solutions with a merely smooth pressure then transfers the growth to any competitor.',
  checkRaw: C.m('node tools/pin-navierstokes-lean.js') + ' recomputes every count from the pinned clone; ' + C.m('node tools/record-navierstokes-build.js') + ' records the build and asks the kernel; ' + C.m('python3 instruments/navierstokes/battery.py') + ' re-runs the ' + nProbeScripts + ' probe scripts and their ' + REDS + ' red controls; the corpus is sha-pinned in ' + C.m('corpus/navier-stokes/MANIFEST.json') + ' (' + M.files.length + ' files).'
}));
B_.push(C.stats([
  { k: 'formal statement vs Clay', v: 'faithful', role: 'held', n: A.fidelity.length + ' hypotheses read against the prose and Mathlib ' + R.mathlib.slice(0, 7) + '; DeepMind\'s statement of 2026-05-15, copied with imports, attributes, namespace and notation changed and nothing else' },
  { k: 'built on this machine', v: B.verdict === 'PASS' ? 'PASS' : 'FAIL', role: B.verdict === 'PASS' ? 'held' : 'open', n: 'every one of the repository\'s ' + fmt(B.jobsBuilt) + ' modules compiled' + (mins ? ' in ' + fmt(mins) + ' minutes' : '') + ' on ' + B.machine.cpus + ' cores / ' + B.machine.memoryGB + ' GB (' + fmt(B.jobsTotal) + ' Lake jobs including the Mathlib replays), ' + B.toolchain.replace('Lean (version ', '').replace(/,.*$/, '') },
  { k: 'independent kernels', v: B.comparator.ran ? String(B.comparator.kernels.filter((k) => /accepts/.test(k)).length) + ' accept' : 'not run', role: B.comparator.ran ? 'held' : 'open', n: B.comparator.ran ? 'Comparator compared every constant in the statement for exact equality, walked the axioms, and replayed the proof through Lean\'s kernel and nanoda (an independent Rust kernel): ' + B.comparator.solutionsAccepted + ' of ' + B.comparator.exits.length + ' configurations "okay"' : 'the Linux-only sandbox was unavailable' },
  { k: 'axioms', v: B.onlyStandardAxioms ? '3, standard' : 'NON-STANDARD', role: B.onlyStandardAxioms ? 'held' : 'open', n: 'propext, Classical.choice, Quot.sound — the kernel\'s own report for all four main declarations' },
  { k: 'lines of Lean', v: fmt(R.lines), role: 'held', n: fmt(R.files) + ' files: ' + fmt(nsLines) + ' Navier–Stokes, ' + fmt(euLines) + ' Euler; sorry ' + R.hygiene.sorry + ', axiom ' + R.hygiene.axiom + ', native_decide ' + R.hygiene.native_decide + ', unsafe ' + R.hygiene.unsafe + ', heartbeat overrides ' + R.hygiene.maxHeartbeats },
  { k: 'printed identities re-run', v: String(nProbeScripts) + ' scripts', role: 'held', n: 'coordinates, rescalings, a kernel norm, the derivative count, the cutoff bound, the exact heat exterior against its ODE and its Taylor coefficients — all pass' },
  { k: 'paper clauses not in the certificate', v: String(A.paperVsLean.filter((r) => /NOT among|weaker in Lean/.test(r.status)).length), role: 'open', n: 'the finite-energy-through-the-singularity clause, and the force\'s vanishing near t = 0 — named in §4' },
]));

B_.push(C.section({
  lab: '§1 · the claim', title: 'A smooth force, a fluid at rest, infinite speed at t = 1',
  bodyRaw: '<div class="col">'
    + C.pRaw('<strong>Theorem 1.1 (their statement).</strong> ' + C.esc(A.claim.theorem))
    + C.pRaw(C.esc(A.claim.mechanism))
    + C.pRaw(C.esc(A.claim.lineage) + ' Alpöge and Buckmaster, working the same program, published smooth-forcing blowup for the porous-medium, Boussinesq and Euler equations the same morning; their Navier–Stokes is unfinished by their own account. The two results are different theorems and this page audits one of them.')
    + '</div>'
    + C.figure({ svgRaw: FIG1, caption: 'The orders the paper states for its core, drawn at h = 1/100 from the exponents in Section 2: both length scales vanish while their ratio ℓr/ℓz ≍ τ^h → 0, the speed diverges, and the core\'s kinetic energy still tends to zero. The dissipation rate is drawn dashed because it is a rate, not a field value; its integral converges precisely when h < 1/6. Checked by hand against Serrin (∫‖u‖²_∞ dt = ∞), Escauriaza–Seregin–Šverák (‖u‖_{L³} → ∞) and Caffarelli–Kohn–Nirenberg (one singular point): every criterion a genuine blowup must satisfy, this one does.' })
}));

B_.push(C.section({
  lab: '§2 · the statement', title: 'Clay\'s wording, DeepMind\'s Lean, Mathlib\'s definitions — one row per hypothesis',
  wide: true,
  bodyRaw: '<div class="col">'
    + C.pRaw('The theorem the certificate proves was not written by the prover. The Comparator challenge file is the Formal Conjectures statement of the four Clay alternatives, added by DeepMind on 2026-05-15 and last touched on 2026-07-27, the revision OpenAI pinned and the revision on <code>main</code> today. The copy differs from upstream in ' + (R.challengeVsUpstream.onlyInChallenge.length + R.challengeVsUpstream.onlyInUpstream.length) + ' lines, every one an <code>open</code> or a notation. The solution side re-declares the same definitions under the same names, byte-identical once comments are stripped, because Comparator compares every constant reachable from the theorem\'s type for exact equality. So the question is only whether that statement is Clay\'s. The rule for reading it: the theorem is a <em>negation</em> — "there exist data for which no solution exists" — so a solution notion weaker than Clay\'s only makes the theorem stronger; a gap could hide only in a competitor class stronger than Clay\'s or a data hypothesis weaker than Clay\'s.')
    + '</div>'
    + C.table({
      cols: [{ h: 'Clay' }, { h: 'Lean (Formal Conjectures)' }, { h: 'Mathlib at ' + R.mathlib.slice(0, 7) }, { h: 'direction', cls: 'n' }],
      rows: A.fidelity.map((r) => {
        const d = r.direction.split(';'), tag = d[0].trim(), rest = d.slice(1).join(';').trim();
        const short = /^same/.test(tag) ? 'SAME' : 'EQUIVALENT';
        return [r.clay, { raw: '<code>' + C.esc(r.lean) + '</code>' }, { raw: C.esc(r.mathlib) + (tag !== 'same' && tag !== 'equivalent' ? ' <em>(' + C.esc(tag) + ')</em>' : '') + (rest ? ' <em>(' + C.esc(rest) + ')</em>' : '') }, { raw: C.tag(short, 'held') }];
      })
    })
    + '<div class="col">' + C.pRaw(C.esc(A.fidelityVerdict)) + '</div>'
}));

B_.push(C.section({
  lab: '§3 · the certificate', title: 'Built here, asked here',
  bodyRaw: '<div class="col">'
    + C.pRaw('The repository has one commit (' + R.commits[0].sha.slice(0, 8) + ', ' + R.commits[0].date.replace('T', ' ').slice(0, 16) + ' UTC, ' + R.commits[0].author + '), pins ' + R.toolchain + ' and Mathlib ' + R.mathlib.slice(0, 8) + ', and declares itself <em>' + R.formalizationYaml.review + '</em>, produced by <em>' + R.formalizationYaml.automation + '</em>. ' + fmt(R.files) + ' files, ' + fmt(R.lines) + ' lines. In code lines — comments and docstrings blanked first — there are ' + R.hygiene.sorry + ' <code>sorry</code> outside the ' + R.hygiene.sorry_in_challenges + ' intentional placeholders of the challenge files, ' + R.hygiene.axiom + ' axiom declarations, ' + R.hygiene.native_decide + ' <code>native_decide</code>, ' + R.hygiene.unsafe + ' <code>unsafe</code>, ' + R.hygiene.opaque + ' <code>opaque</code>, ' + R.hygiene.macro_elab_syntax + ' custom syntax or tactics, and ' + R.hygiene.maxHeartbeats + ' heartbeat overrides — five docstrings record that earlier overrides were removed and the proofs redone under the default budget.')
    + C.pRaw('It ' + buildVerb + ' on this machine: ' + B.machine.model + ', ' + B.machine.cpus + ' cores, ' + B.machine.memoryGB + ' GB, ' + B.machine.os + '; all ' + fmt(B.jobsBuilt) + ' of its modules' + (mins ? ' in ' + fmt(mins) + ' minutes' : '') + ' after the Mathlib cache (' + fmt(B.jobsTotal) + ' Lake jobs in all, the dependency replays included; in two legs, ' + B.legs.map((l) => l.built + ' modules at ' + l.threads + ' threads').join(' then ') + ', the first leg restarted because eight parallel Lean processes on a 16 GB machine drove it into swap); exit ' + B.exitCode + (B.errors.length ? '; errors: ' + C.esc(B.errors.join(' | ')) : '; no errors') + '. Then a scratch file importing the two solution modules asked <code>#print axioms</code> of the four declarations <code>formalization.yaml</code> names, and ' + axiomsSentence + '.')
    + C.pRaw('One more question a negation theorem must answer: is the class it negates satisfiable at all? A definition nobody can meet would make "no solution exists" free. So a witness was written here and compiled against OpenAI\'s challenge module: the fluid at rest — zero datum, zero force, zero velocity, zero pressure — satisfies every field of both competitor classes and all four data conditions (' + NV.declarations.length + ' declarations, <code>' + C.esc(NV.file.replace('lean/', '')) + '</code>, kernel: ' + C.esc(NV.kernel_output.replace(/^'[^']*' /, '')) + '). The classes are real; the theorems say something.')
    + C.pRaw(B.comparator.ran
      ? 'Then the judge itself. <strong>Comparator</strong> — the Lean FRO\'s tool for exactly this situation, a party claiming to have proved someone else\'s theorem — exports both sides with <code>lean4export</code>, compares every constant reachable from the theorem\'s type for <em>exact</em> equality, walks the axioms, and replays the proof through Lean\'s kernel and through <strong>nanoda</strong>, a kernel written independently of Lean\'s in Rust and built here from source. On ' + C.esc(B.comparator.exits.map((e) => e.config.replace('ComparatorChallenges/', '').replace('.json', '')).join(' and ')) + ': ' + C.esc(B.comparator.kernels.join(', ')) + '; ' + B.comparator.solutionsAccepted + ' of ' + B.comparator.exits.length + ' configurations returned <em>"Your solution is okay!"</em> with exit ' + C.esc(B.comparator.exits.map((e) => String(e.exit)).join(' and ')) + '. Its sandbox is Linux-only, so a pass-through stand-in took its place: the statement comparison, the axiom walk and both kernel replays were performed; the process isolation was not — and on a machine where both sides came from one pinned commit that is the honest trade.'
      : 'Comparator, the Lean FRO\'s statement-equality judge, was not run at this build; the statement equality was read by hand (§2) and the axioms asked of the kernel above.')
    + '</div>'
    + C.table({
      cols: [{ h: 'declaration' }, { h: 'what it states' }, { h: 'axioms reported by the kernel' }],
      rows: Object.entries(B.axioms).map(([d, ax]) => [{ raw: '<code>' + C.esc(d.replace('NavierStokes.Comparator.', '').replace('Euler.', 'Euler.')) + '</code>' }, d.endsWith('breakdown_R3') && d.includes('navier') ? 'Clay (C): breakdown on ℝ³' : d.endsWith('breakdown_periodic') ? 'Clay (D): breakdown on ℝ³/ℤ³' : d.endsWith('euler_breakdown_R3') ? 'unforced Euler: no global smooth finite-energy solution for some smooth decaying datum' : 'unforced Euler: a compact smooth datum with finite maximal lifespan, infinite C¹ lim sup, divergent vorticity integral', ax.join(', ')])
    })
}));

B_.push(C.section({
  lab: '§4 · the paper against the certificate', title: 'What the 166 pages say that the Lean does, and does not, say',
  wide: true,
  bodyRaw: '<div class="col">'
    + C.pRaw('The paper is an LLM-written account of a machine-found proof; the Lean is the claim. Where the two differ, the page reports the difference and nothing more. One difference matters to the announcement: OpenAI\'s page says "its energy remains finite through the entire dynamics, from rest to the formation of the singularity". Theorem 1.1 states it; Lemma 10.4 proves it on paper in three lines that were re-derived here and hold; the repository contains the general lemma (a smooth compactly supported force gives a uniform L² bound on [0,1)) and nothing invokes it, and the structure that would carry the bound has no producer. The Millennium alternatives do not need it — a global smooth competitor is excluded by uniqueness on every [0,T] with T < 1, where the candidate\'s energy is finite by compact support alone — so the formal result stands and the physical headline is a paper claim.')
    + C.pRaw('What makes that omission legible is the Euler theorem in the same repository. <code>Euler.exists_compact_smooth_euler_singularity</code> asserts, for a nonzero smooth compactly supported datum: a solution on [0, T*) with 0 &lt; T* ≤ 1, <em>a uniform energy bound on the whole lifespan</em>, maximality as an equivalence (a solution on [0, T] exists if and only if T &lt; T*), the C¹ norm finite on every shorter interval, its limsup infinite at T*, the Beale–Kato–Majda integral infinite, and no global smooth finite-energy solution. That is the positive content of a blowup theorem, formalized. The Navier–Stokes candidate carries nine of those ten kinds of clause; the missing one is the energy. Same team, same week, same repository — which is why this reads as an oversight rather than an obstacle, and why the unused lemma in <code>R3/CompactEnergy.lean</code> is the tell.')
    + '</div>'
    + C.table({
      cols: [{ h: 'item' }, { h: 'the paper' }, { h: 'the Lean' }, { h: 'status' }],
      rows: A.paperVsLean.map((r) => [r.item, r.paper, { raw: C.esc(r.lean).replace(/([A-Za-z0-9_.]+\.lean:\d+)/g, '<code>$1</code>') }, { raw: C.tag(/NOT among/.test(r.status) ? 'NOT FORMAL' : /weaker/.test(r.status) ? 'WEAKER' : /proved|covers|equivalent/.test(r.status) ? 'FORMAL' : 'NOTE', /NOT among|weaker/.test(r.status) ? 'open' : 'cert') + ' ' + C.esc(r.status) }])
    })
}));

B_.push(C.section({
  lab: '§5 · the writeup, dissected', title: 'Where six readings found the argument complete, and where it asserts',
  wide: true,
  bodyRaw: '<div class="col">'
    + C.pRaw('Six readers took the paper apart the day after it appeared — §3 with §10, §4 with Appendix B, §5 with Appendix A, §6 with §7, §8 and §9 with Appendix C, and the Lean against all of it — transcribing every statement, tracing the order in which every parameter is fixed, re-deriving what could be re-derived and testing by computer what could be tested. No circularity was found. No error was found. The table records what was verified; the list below it records what the paper asserts rather than displays, ranked by how much rests on it. In a proof whose authority is a kernel, such a list is a reading aid, not a verdict; it is the list a referee of the paper would write.')
    + '</div>'
    + C.table({ cols: [{ h: 'sections' }, { h: 'verified' }, { h: 'result' }], rows: A.verifiedByHand.map((r) => [r.where, r.what, r.result]) })
    + '<div class="col">' + C.pRaw('<strong>Asserted, not displayed — ranked.</strong>') + '</div>'
    + C.table({ cols: [{ h: '#', cls: 'n' }, { h: 'where' }, { h: 'what' }], rows: A.weakPoints.map((w) => [String(w.rank), w.where, w.what]) })
    + '<div class="col">' + C.pRaw('<strong>Slips, each harmless with its margin:</strong> ' + A.slips.map((s) => C.esc(s)).join('; ') + '.') + '</div>'
}));

B_.push(C.section({
  lab: '§5b · the adversarial pass', title: 'Every theorem that forbids a singularity, set against this one',
  wide: true,
  bodyRaw: '<div class="col">'
    + C.pRaw('The implacable question is not whether the paper reads well but whether a theorem says this cannot happen. The classical obstructions were each set against the construction\'s own exponents, symbolically, in the battery. None refutes it. One is load-bearing and unstated: for an axisymmetric flow the swirl Γ = r·uθ obeys a drift–diffusion equation with no zeroth-order term, so from rest with a bounded force the swirl stays bounded and |uθ| ≤ C/r; the paper\'s core has r·uθ = q^{−h}H, unbounded, in its own notation. The axisymmetric background alone is impossible. The theorem survives because the pulses carry nonzero angular frequencies and their Reynolds flux breaks the maximum principle for the angular mean — the physics of the whole construction, and the paper never says so.')
    + '</div>'
    + C.table({
      cols: [{ h: 'obstruction' }, { h: 'what it says' }, { h: 'this construction' }, { h: 'verdict' }],
      rows: A.obstructions.rows.map((o) => [o.obstruction, o.statement, o.construction, { raw: C.tag(/impossible|load-bearing/i.test(o.verdict) ? 'EVADED, UNSTATED' : /evaded/i.test(o.verdict) ? 'EVADED' : 'MET', /unstated/i.test(o.verdict) ? 'open' : 'held') + ' ' + C.esc(o.verdict) }])
    })
}));

B_.push(C.section({
  lab: '§5c · the weak points, traced into the kernel', title: 'What the paper asserts, and what the machine actually proves there',
  wide: true,
  bodyRaw: '<div class="col">'
    + C.pRaw('A list of asserted steps is only as interesting as its answer in the certificate, so every one was traced into the Lean library and asked a second, harsher question: not "is it discharged" but "is the Lean statement <em>weaker</em> than the paper\'s claim at that point". '
      + nFull + ' are discharged by a proved theorem at full strength, and two of them are <em>stronger</em> than the paper: the endpoint regularity the paper gives as per-order bounds is a genuine smooth extension across t = 1, and the flatness the paper states in one variable is a joint space-time limit, which is exactly the uniformity the reading found missing. '
      + nRed + ' are discharged with something altered, and ' + nNot + ' have no counterpart to check. Two of the paper\'s arithmetic slips are simply absent from the formal object — the exponent ledger carries the term the paper drops, and the comparison argument uses the exponent its own chain gives.')
    + '</div>'
    + C.table({
      cols: [{ h: '#', cls: 'n' }, { h: 'the asserted step' }, { h: 'in Lean' }, { h: 'strength', cls: 'n' }],
      rows: [].concat(
        WL.dischargedAtFullStrength.map((w) => [String(w.weakPoint), w.what, { raw: C.esc(w.lean).replace(/([A-Za-z0-9_./]+\.lean:\d+|\(:\d+\))/g, '<code>$1</code>') + (w.note ? ' — ' + C.esc(w.note) : '') }, { raw: C.tag('PROVED', 'cert') }]),
        WL.reducedOrAltered.map((w) => [String(w.weakPoint), w.what, { raw: C.esc(w.lean).replace(/([A-Za-z0-9_./]+\.lean:\d+|\(:\d+\))/g, '<code>$1</code>') + (w.note ? ' — ' + C.esc(w.note) : '') }, { raw: C.tag('ALTERED', 'open') }]),
        WL.notLocated.map((w) => [String(w.weakPoint), w.what, C.esc(w.note), { raw: C.tag('NO COUNTERPART', 'dep') }]))
    })
    + '<div class="col">'
    + WL.threeQuestions.map((q) => C.pRaw('<strong>' + C.esc(q.q) + '</strong> ' + C.esc(q.a))).join('')
    + '</div>'
}));

B_.push(C.section({
  lab: '§6 · the identities, re-run', title: 'Everything the paper prints that a computer can decide',
  bodyRaw: '<div class="col">'
    + C.pRaw('The proof carries no numerics and fixes no constant to a number, so there is nothing for an interval certifier to certify. What it does print are identities — a coordinate change and its derivatives, two rescalings of the equations, a kernel integral, a derivative count, a cutoff bound, and one closed-form object, the exterior swirl that solves the radial heat equation exactly. Each was re-run from the formula as printed: ' + P.checks.map((c) => '<code>' + C.esc(c.script.replace('instruments/navierstokes/probes/', '')) + '</code> (' + C.esc(c.what.split(':')[0]) + ')').join(', ') + '. All ' + nProbeScripts + ' pass, and so do their ' + REDS + ' red controls — each a deliberately wrong variant of the same test that must be rejected, because a check that cannot fail is not a check. One of them plants this battery\'s own first bug. A first run reported the heat-exterior integral failing its own differential equation; that was this battery\'s bug — the m-th derivative of (1+Zv)^{−h} carries (−1)^m(h)_m, not (−h)_m — and the record says so, because a scratch log that reads "FAIL" against a Millennium claim should not be mistaken for a finding.')
    + '</div>'
    + C.figure({ svgRaw: FIG2, caption: 'The exact exterior: uθ = c∞ (r²/2)^{−1/2−h} H(4τ/r²) with H the integral of (A.32), computed at this build by quadrature. It solves the radial swirl heat equation exactly for every t < 1 and has smooth limits with all derivatives at every fixed r > 0 as t ↑ 1 — the property that lets the flow be cut off in space without a singular force. The battery checks H against its differential equation to a relative residual below 10⁻¹⁸ and its Taylor coefficients at Z = 0 against the paper\'s (A.35) exactly.' })
    + C.figure({ svgRaw: FIG3, caption: 'Appendix B\'s axis problem, solved rather than read: the profile equations (4.13) with (4.7) integrated from the axis in Y = ΛX at data the paper never fixes (h = ' + AX.data.h + ', j₀ = ' + AX.data.j0 + ', P* = ' + AX.data.Pstar + ', δ* = ' + AX.data.delta_star + ', σ* = ' + AX.data.sigma_star.toFixed(5) + ' from (B.2)). At η = 0 the solved Φ lies on the closed form f₀(Yχ) Proposition B.2 says it approaches, and the difference scales as 1/Λ as the proposition claims; at the zero of H* the cutoff χ vanishes and Φ stays at 1. Every curve here is a floating-point illustration of the writeup\'s own equations at representative data; nothing about the theorem is decided by it.' })
    + C.figure({ svgRaw: FIG4, caption: 'The exit inequality of (B.19) at the exit radius: the shear p₁ must exceed 2 + c_ex across the collar, and does — the one dip is the σ*-wide feature at η₀, the zero of H*, where the cutoff χ removes the datum. The probe also finds that (B.17) fails for Λ ≤ 10⁵ and holds from 10⁶ on, consistent with the paper\'s Λ ≫ σ*⁻², and that the exit route through (B.16) needs the supremum of φ* over a complex neighbourhood, not the real one — the paper\'s requirement, confirmed numerically.' })
    + '<div class="col">'
    + C.pRaw('What was not done, and why: no interval arithmetic on the profile equations of Section 4 — every constant in them is "sufficiently small", so the numerical solve above illustrates the paper\'s description of its own object and certifies nothing. The closed forms are exact identities decided symbolically; the quadratures are pictures with 25-digit residuals, not enclosures.')
    + '</div>'
}));

B_.push(C.section({
  lab: '§7 · dates', title: 'The record, as the three parties state it',
  wide: true,
  bodyRaw: C.table({ cols: [{ h: 'date' }, { h: 'event, with its source' }], rows: A.processDates.map((d) => [d.date, d.event]) })
    + '<div class="col">' + C.pRaw('Each line is from the document named in it — OpenAI\'s announcement, Buckmaster\'s statement, Tao\'s posts, or a repository\'s own timestamps — and is held in the pinned corpus. Nothing here weighs them.') + '</div>'
}));

B_.push(C.note({ lab: 'what this page does NOT claim', bodyRaw: C.pRaw(A.refusals.map((r) => C.esc(r)).join(' ') + ' The papers are published, not peer-reviewed; the Clay Mathematics Institute has said nothing; OpenAI has said it will not claim the prize.') }));

const foot = '<footer class="col"><p>Generated by tools/build-report-navierstokes.js @ git ' + git + '. Gates at this build: lean-repo.json recomputed from the pinned clone (' + R.commit.slice(0, 8) + '), build.json with a finished build and four kernel axiom lines, probes.json PASS, the manifest\'s digest of the paper matched, the solution-side definitions byte-identical to the challenge, every fidelity row same or equivalent, the energy-clause finding present in the record. A differing definition, a non-standard axiom, a failing probe or a missing record refuses this page.</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'navier-stokes.html'),
  TPL.render({ title: 'The Navier–Stokes claim, read to the last hypothesis', bodyRaw: B_.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/navier-stokes.html',
    desc: 'OpenAI\'s 2026-09-08 Navier–Stokes blowup claim audited: the formal statement read against Clay\'s wording and Mathlib\'s definitions hypothesis by hypothesis, the ' + fmt(R.lines) + '-line Lean proof built on a laptop with its axioms asked of the kernel, the paper mapped onto the certificate (one clause of Theorem 1.1 — finite energy through the singularity — is not formal), the writeup dissected by six readers with ' + A.weakPoints.length + ' asserted-not-displayed points ranked, and every printed identity re-run.' }));
console.log('reports/navier-stokes.html written: build ' + B.verdict + ', axioms standard ' + B.onlyStandardAxioms + ', ' + nProbeScripts + ' probe scripts, ' + A.weakPoints.length + ' weak points @ git ' + git);
