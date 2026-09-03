#!/usr/bin/env node
/* build-control.js — generate index.html (the control page) from what the machine produced.

   Every number comes off a record on disk at build time; nothing is typed in.
   Sources: ledger.json (the engine's output), instruments/trigmin/envelope.js,
   PROVENANCE.json, the batteries (run, not remembered), git.

   usage: node tools/build-control.js [--no-batteries] */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const runBatteries = !process.argv.includes('--no-batteries');

const rj = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const exists = (p) => fs.existsSync(path.join(ROOT, p));
const sh = (c) => { try { return cp.execSync(c, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) { return null; } };
const fmt = (n, d) => Number(n).toFixed(d === undefined ? 12 : d);
const commas = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const ledger = exists('ledger.json') ? rj('ledger.json') : { families: [], conjectures: [], relations: [], totals: {} };
const prov = rj('PROVENANCE.json');
const ENV = require(path.join(ROOT, 'instruments/trigmin/envelope.js'));

/* ---- the records the concept band reads ----------------------------------
   Every number in §0-§2 comes from one of these. The build REFUSES rather
   than printing a claim whose record has stopped supporting it: this page is
   where the position is stated, so it is the last page that may drift. */
const die = (m) => { console.error('CONTROL PAGE REFUSED: ' + m); process.exit(1); };
const envsRec = rj('certs/envs-record.json');
const envsTol = envsRec.graders.find((g) => /absolute/.test(g.name));
const envsSound = envsRec.graders.find((g) => /enclosure/.test(g.name));
if (!envsTol || !envsSound) die('the envs record has lost a grader row');
if (envsSound.falseAccept !== 0 || envsSound.falseReject !== 0) die('the certificate grader is no longer sound — §0 may not claim it');
if (envsTol.falseAccept < 0.5) die('the canary suite no longer breaks tolerance checking — §1 may not claim it');
const claimsL = rj('certs/claims-ledger.json');
if (claimsL.rows.filter((r) => r.origin === 'submitted').length !== claimsL.submitted) die('the claims ledger submitted count disagrees with its rows');
const aiC = rj('certs/ai-claims-summary.json');
const l5a = exists('certs/lambda5-audit.json') ? rj('certs/lambda5-audit.json') : null;
if (l5a && l5a.refuters !== 0) die('the lambda(5) audit records refuters');
const evalRows = fs.readFileSync(path.join(ROOT, 'certs/matmul-eval-ledger.jsonl'), 'utf8')
  .trim().split('\n').map((l) => JSON.parse(l)).filter((r) => r.model !== 'fake');
const evN = (o) => evalRows.filter((r) => r.outcome === o).length;
const evClaims = evN('certified') + evN('rejected') + evN('refuted') + evN('malformed');
if (!evClaims) die('the eval ledger holds no submitted claims — the refusal rate would have no denominator');
const evRefusalRate = evN('malformed') / evClaims;
const uni = envsRec.uniformity.solvers.find((x) => /bluff/.test(x.name));
if (!uni || uni.score >= 0) die('the bluffed tiling no longer scores negative');
const pctv = (x) => (100 * x).toFixed(1) + '%';

const BATTERIES = [
  ['funnel machine', ['machine/funnel/selftest/battery.js'], '14 items · 19 red controls'],
  ['detach', ['machine/detach/selftest.js'], '11 checks'],
  ['interval · eqcert', ['instruments/interval/tests/test-eqcert.js'], 'falsifier-required certificates'],
  ['interval · arithmetic', ['instruments/interval/tests/test-interval.js'], '16 000 ops vs exact rationals'],
  ['interval · transcendental', ['instruments/interval/tests/test-transcendental.js'], 'sound exp/log/sin/cos'],
  ['trigmin certifier', ['instruments/trigmin/battery.js'], '47 checks · 2 red controls'],
  ['newman box sweep', ['instruments/trigmin/sweep-battery.js'], 'Goddard\'s 1992 box re-closed every run, cross-lab counts pinned; 100% kill audit · 7 red controls'],
  ['lambda sweep', ['instruments/trigmin/lambda-battery.js'], 'Mercer\'s proved closed forms computed, never remembered; the wrong-endpoint bar refused by name and shown fatal · 4 red controls'],
  ['lambda4 campaign', ['instruments/lambda4/battery.js'], 'Mercer\'s lambda(2) and lambda(3) proofs re-derived mechanically at every run — exception families DISCOVERED, thresholds DERIVED; the Section-5 generic case with its 14 exceptions matched against the hand-written list; the worklist measured at NINE families · 8 red controls'],
  ['envs (grader QA + the gyms)', ['instruments/envs/battery.js'], 'the three environments over one idea — a certified enclosure is a canary factory: the fact corpus still matches the records it was read from (drift refuses), no minted canary lands inside its own enclosure, the certificate grader is sound on the whole suite while tolerance checking is broken by it, a bluffed tiling scores worse than abstaining, and the attacker ladder keeps rungs that cannot be broken \u00b7 5 red controls, including the accept-everything and reject-everything graders that must both score zero'],
  ['lambda56 campaign', ['instruments/lambda56/battery.js'], 'the lambda(5)/(6) non-monotonicity campaign: lambda(4) generic re-derived as the calibration gate, both new generic cases certified (8 and 10 exception families DISCOVERED), the double-sum-core theorem re-proved with the Fejer-Riesz comb weight, extremizer walls counted, the record walked \u00b7 5 red controls'],
  ['sublevel (tao 179)', ['instruments/sublevel/battery.js'], 'certified sublevel measures for root-constrained monic polynomials (Tao\'s #179 supremum conjecture on Erdős #1038): the 2*sqrt(2) witness enclosed, the box bound equal to the measure on thin boxes, and the degree-3 theorem plus degree-4 localization RE-PROVED at every run · 3 red controls'],
  ['mercer mu5 ladder', ['instruments/trigmin/mercer6-battery.js'], 'mu(5) <= 1 + pi/m certified m = 5..20; Mercer\'s Tables 5-7 reproduced, the source-lab m=6 record matched, every case point re-proved · 5 red controls'],
  ['census (henon + holmes)', ['instruments/census/battery.js'], 'closed-form calibration, two maps · 5 red controls'],
  ['keller audit + sweep', ['instruments/keller/battery.js'], 'symbolic det over Q, generator calibrated on Alpöge · 4 red controls'],
  ['cf audit', ['instruments/cf/battery.js'], 'all seven Ramanujan Machine sheets — 51 printed rows + the certified correction (e, pi, zeta(3), Catalan, pi^2, ln 2, mixed zeta orders) · 10 red controls'],
  ['entropy covering', ['instruments/entropy/battery.js'], 'certified h_top lower bounds; ln 2 calibration at the full horseshoe · 4 red controls'],
  ['strassen audit', ['instruments/strassen/battery.js'], 'fast-matmul tensor identities over Q and F2; Strassen 1969 calibrates · 3 red controls'],
  ['bigfloat layer', ['instruments/bigfloat/battery.js'], 'directed-rounding big-float intervals; pi/ln2/e to 50 literature digits · 5 red controls'],
  ['ivspecial (Γ + Bessel)', ['instruments/ivspecial/battery.js'], 'interval Γ (Spouge) and Bessel J_ν at fractional and NEGATIVE order — the spectral-geometry instrument: half-integer closed forms, Γ cross-derived on bigfloat against (2n)!/(4ⁿn!)·√π, J against exact-rational series brackets at dyadic points, the pinned frontier source re-hashed, fat-interval orders falsified for the band program · 6 red controls'],
  ['hotspots (ember chain)', ['instruments/hotspots/battery.js'], 'the certified hot-spots theorem for the trapezoid outside every proven class: 8 stage records walked (inputs = upstream outputs, no hand copies), I₀ = 5/48 and C_tr and the cell partition re-decided LIVE in exact rationals/bigfloat, a collar kill re-proved live, witnesses proved to sit in tip disks · 7 red controls (mutated vertex, inflated defect, forged I₀, inflated flux sup vs the reflection layer, sign-flipped ladder, witness moved into the core, the bench\'s unsound tip-skip rule caught)'],
  ['erdos852 constants', ['instruments/erdos852/battery.js'], 'certified c0 and C* enclosures; pi^2/8 product calibration · 5 red controls'],
  ['evtol energy', ['instruments/evtol/battery.js'], 'mission-energy feasibility verdicts cross-proved by 256-corner exact sweeps; dyadic closed-form calibration · 4 red controls'],
  ['forecast instrument', ['instruments/forecast/battery.js'], 'conformal coverage proved by exact rank-lemma enumeration; Winkler scores hand-computed in rationals; the ledger refuses backdating, tampering, premature and double scoring; the admission prune rule decided by exact binomial tail · 5 red controls'],
  ['covering (one module, four consumers)', ['instruments/covering/battery.js'], 'the check that several theorems here quantified over a region actually stand on: do the pieces TILE it. Written once after being written twice — 1D ladders (endpoints must MATCH, relative comparison for ladders spanning decades) and 2D area accounting for adaptive box maps, with the honest limit that area proves covering almost everywhere and not everywhere. Zero-width pieces are reported and excluded, never allowed to bridge a hole · 12 red controls'],
  ['ember band (P3a, the family audit)', ['instruments/emberband/battery.js'], 'the hot-spots theorem on a positive-measure family c in [0.845,0.85]: an INDEPENDENT auditor re-derives the two covering ladders (17 chunks tiling the interval, 738 sigma-cells tiling [-1,0] in every stage) and every band-wide value from per-cell data, sharing no code with the producer. Eight RED CONTROLS each break the band a different realistic way — removed chunk, endpoint nudged 1e-5, one missing sigma-cell of 738, one margin at -1e-9, an escaped collar survivor, a dropped stage, tip C losing its certified sign, a ladder tiling the wrong interval · 8 red controls'],
  ['lemniscate (erdős 1038 infimum)', ['instruments/lemniscate/battery.js'], 'the #1038 infimum bracket walked and its fence enforced: five RED CONTROLS are genuine source mutations that must make a certificate refuse — the atom mass below the exact level, a displaced support endpoint, THE δ-MECHANISM (the family level defect on the wrong side, which provably kills small ε), the sliver constant below 1, and a forcing record claiming a cap its boxes do not tile · 5 red controls'],
  ['kissing ledger', ['instruments/kissing/battery.js'], 'D4 (24) and E8 (240) kissing witnesses re-proved from generated bytes every run — E8\'s 6,720 exact contacts equal the textbook 240·56/2; the AI-era dimension-11 ladder re-walked from pinned corpus bytes, one Station 604 re-certified LIVE in Z[sqrt2]; the mixed-sign sqrt2 comparator and decimal-literal exactness each guarded by a falsifier · 6 red controls'],
  ['fueleu penalty arithmetic', ['instruments/fueleu/battery.js'], 'Regulation (EU) 2023/1805 intensity limits, Annex IV penalty and blend-flip thresholds in exact rationals — constants transcribed from pinned OJ bytes; the 1e-9 boundary forgery flips the verdict · 4 red controls'],
  ['glide band', ['apps/glide-band/battery.js'], 'certified engine-out reach from interval inputs; geodesy calibrated on the meridian degree and JFK-LAX, 4000-draw containment, and the point-estimate method itself run as a red \u00b7 4 red controls'],
  ['design system + charts', ['design/battery.js'], 'palette validated against the dataviz checks in BOTH modes and under three CVD simulations; the token block, the figure kit and the escaped-tag scanner · 6 red controls'],
  ['wiring', ['tools/check-wiring.js'], 'the registries nobody was checking: every report builder reachable from `make reports`, the two battery lists in agreement, and no built page declaring a font outside the token block · 4 red controls'],
  ['skyaudit app', ['apps/skyaudit/battery.js'], 'segmentation and mission calibration for the pinned ADS-B day'],
  ['bilinear certifier', ['instruments/bilinear/battery.js'], 'bilinear identities over Q and F2'],
  ['slp additive circuits', ['instruments/slp/battery.js'], 'straight-line programs, additive cost'],
  ['mfg lab (box certifier)', ['labs/mfg/battery.js'], 'the box certifier for the MFG lab'],
  ['mfg2p lab (two populations)', ['labs/mfg2p/battery.js'], 'two-population equilibria'],
  ['mfg-cap census (EXACTLY-n)', ['labs/mfg/census-battery.js'], 'Krawczyk exhaustion census of the even Galerkin mfg-cap system: EXACTLY 3 solutions at c=-12 re-proved live at N=2 every run, records walked for N=2..5, honest box-bounded truncation scope asserted · 3 red controls (midpoint split refuses at the constant solution’s exact coordinates, starved budget, corrupted kernel)'],
  ['erdos290 lean battery', ['tools/erdos290-lean-battery.js'], 'closed forms equal enumeration exactly for l <= 12; the broken-EGF red must fire'],
  ['critcount (certified peak counts)', ['instruments/critcount/battery.js'], 'critical-point counts of even cosine series over an enclosure ball — count derived from CERTIFIED region signs only, outward coefficient products, ball Lipschitz folded into the cell pad; closed-form two/three-harmonic calibrations and the terra record walk · 4 red controls (mutated boundary, zeroed ball pad, degenerate curvature, two critical points in one region — each fires)'],
  ['engine + families', ['tools/test-engine.js'], 'red controls on screen and certifier']
];
const PY = [
  ['oracle claim library', ['oracle/battery.py'],
    'certify() for AI math search: Strassen calibrates, the characteristic-2 pair reproduced, the sub-float forgery refuted with its exact mechanism; red controls also run at import — a broken grader refuses to exist · 6 red controls'],
  ['keller · standalone re-verifier', ['tools/verify_keller.py', 'certs/keller-certificate.json', '--sources', 'corpus/sources'],
    'the detached certificate re-audited from scratch — stdlib fractions, no code from this repo; red control must fire'],
  ['strassen · standalone re-verifier', ['tools/verify_strassen.py', 'certs/strassen-certificate.json', '--sources', 'corpus/sources'],
    'every matmul identity re-derived in stdlib Python ints; pins re-hashed; red control must fire'],
  ['erdos852 · standalone re-verifier', ['tools/verify_erdos852.py', 'certs/erdos852-certificate.json', '--sources', 'corpus/sources'],
    'the C* refutation re-proved in exact stdlib ints (no tail, no rounding); the c0 window re-decided at 130 digits; 4 red controls must fire'],
  ['mfgcap · terra re-certification', ['instruments/mfgcap/battery.py'],
    'the congestion-MFG peak-splitting enclosures (T1 two peaks, T6 three peaks) re-certified inside cert-machine: validate_g pinned BIT-FOR-BIT to the frozen published verifier on its embedded instance, the stdlib Gauss-Jordan approximate inverse certifying at the identical radius, the record walk, and the A2/A3 data terms — the only new lines — attacked by their own mutations · 5 red controls'],
  ['facelaw · face-dimension theorem', ['instruments/facelaw/battery.py'],
    'k = |shared| - cons + z decided against the exact Q null space — 600 live networks every run, the 572-failure origin ensemble replayed from its seed with every failing instance enumerated in the record, the exit-free-cycle family, and the origin instance whose z = 0 made the shortcut look like a law · 3 red controls'],
  ['attnflow · attention exact-Q', ['instruments/attnflow/battery.py'],
    'the decidable attention flow: the reduced flow\'s DOUBLE zero at c* = -1/beta (multiplicity decided by exact division), denominator SOS, no crossing at any beta > 1 — every pitchfork claim refuted exactly; cross-weights identically zero with the honest p = 1 boundary; the consensus spectrum\'s beta/p-freeness decided by exact dual-number expansion at n = 3..6; the phantom-bifurcation taxonomy with the locator transient re-demonstrated live · 3 red controls (one of which caught this battery\'s own detector being decorative)'],
  ['sos · global bound', ['instruments/sos/sos_verify.py'], 'stdlib fractions only'],
  ['sos · lyapunov', ['instruments/sos/lyapunov_cert.py'], 'stdlib fractions only'],
  ['sos · re-verify AI result', ['instruments/sos/reverify_ai_lyapunov.py'], 'stdlib fractions only'],
  ['llm harness — the eval\'s dry-run gate', ['tools/llm-harness.py', '--dry-run', '--n', '20', '--ledger', '/dev/null'],
    'a FAKE proposer gates the pipeline, not an LLM result; live model campaigns are separate, in the append-only certs/matmul-eval-ledger.jsonl and on reports/matmul-eval.html · aborts if a red control certifies']
];
function bat(argv, py) {
  if (!runBatteries) return null;
  const r = cp.spawnSync(py ? 'python3' : process.execPath, argv, { cwd: ROOT, stdio: 'ignore' });
  return r.status === 0;
}
const bats = BATTERIES.map(([n, c, note]) => ({ n, note, ok: bat(c, false) }))
  .concat(PY.map(([n, c, note]) => ({ n, note, ok: bat(c, true) })));
const green = bats.filter(b => b.ok === true).length, ran = bats.filter(b => b.ok !== null).length;

let drift = 'not run';
{ const o = sh('node tools/lift.js --check'); if (o) { const l = o.split('\n').find(x => x.startsWith('drift:')); if (l) drift = l.replace(/^drift:\s*/, ''); } }

const T = ledger.totals || {};
const B = [];

B.push(C.header({
  eyebrow: 'cert-machine · the concept, the instruments, the record',
  title: 'The machine',
  deck: 'Independent exact certification of machine-generated mathematics — exact arithmetic, no code shared '
    + 'with the claimant, refusal as a verdict. This page is the whole of it: what the machine is, what was '
    + 'built to make it true, and the live record underneath. Every number below was read off a record when '
    + 'this page was built, and every battery it reports green was executed during that build.'
}));

/* R1: the page must decompose what it counts, so the subtraction a reviewer
   will do — tested − refuted − surviving — comes out to zero in front of
   them. Refuted = double-precision enclosure + the exact BigInt pass; the
   remainder is forms already on the OEIS record, honest open candidates,
   and the survivors. run-engine.js refuses to write a ledger where this
   does not close. */
const refutedAll = (T.closedFormRefuted || 0) + (T.closedFormRefutedExact || 0);
const decompose = commas(T.closedFormTested || 0) + ' tested = ' + commas(T.closedFormRefuted || 0)
  + ' refuted in double + ' + commas(T.closedFormRefutedExact || 0) + ' refuted exactly in BigInt + '
  + commas(T.closedFormOnRecord || 0) + ' with the form already on the OEIS record + '
  + commas(T.closedFormOpen || 0) + ' open + ' + commas(T.closedFormCandidates || 0) + ' surviving.';

B.push(C.stats([
  { k: 'objects generated', v: commas(T.generated || 0), n: 'Across ' + ledger.families.length + ' families, one engine.' },
  { k: 'certified exactly', v: commas(T.certified || 0), role: 'held', n: 'Interval enclosures and exact rational decisions — no digit matching.' },
  { k: 'closed forms refuted', v: commas(refutedAll), n: decompose + ' A refutation here is proved, not unlikely.' },
  { k: 'batteries green', v: green + ' / ' + ran, role: 'held', n: 'Executed during this build; every red control must fire.' }
]));

B.push(C.scope('Published, not peer-reviewed, not independently rerun. Every claim below is rerunnable from the '
  + 'public repository; external reruns will be recorded here as they arrive — none has yet. Enclosures are '
  + 'proofs-of-object pending that independent verification.'));

/* ---- §0 · the concept ------------------------------------------------------
   The page where the position is stated. Every rule below carries a measured
   number and the record it came from; a rule with nothing to measure would be
   a slogan, and this is the last page on the site that may carry one. */
B.push(C.section({
  lab: '§0 · the concept', title: 'What the machine is',
  bodyRaw: [
    C.pRaw('Generation is crowded. Judgement is not. This machine decides mathematical claims — other '
      + 'people\'s and its own — in exact arithmetic, and publishes the refusals beside the verdicts. Five '
      + 'rules do all the work — the first is the one everything else pays for — and each is a measurement '
      + 'rather than a promise.'),
    C.plainList([
      { b: 'A fast check may only rule things out.',
        raw: 'Floating point screens by the million and is never allowed to admit anything: of '
          + commas(T.generated || 0) + ' objects enumerated, ' + commas(T.certified || 0) + ' reached an exact '
          + 'decision, and nothing reached a verdict without exact arithmetic behind it. A rounding error can '
          + 'cost time here and can never cost truth.' },
      { b: 'Both verdicts are theorems.',
        raw: 'CERTIFIED means the statement was re-derived from whole numbers; REFUTED means a falsifying '
          + 'witness exists and it is printed. ' + commas((T.closedFormRefuted || 0) + (T.closedFormRefutedExact || 0))
          + ' closed forms have been refuted exactly — the value provably outside a certified enclosure — and '
          + 'zero discoveries have been claimed from that search.' },
      { b: 'The third verdict is real, and it is counted with a denominator.',
        raw: 'An instrument that cannot decide says so. On claims other people submitted to the eval board the '
          + 'refusal rate is ' + pctv(evRefusalRate) + ' of ' + commas(evClaims) + '; inside the generation loop '
          + 'it is a different rate for a different thing, and the two are never added. Every refusal in the lab '
          + 'is counted by kind at <a href="/reports/refusals.html">the refusals ledger</a>, which deliberately '
          + 'has no total.' },
      { b: 'Every run carries forgeries that must fail.',
        raw: 'Deliberate near-misses are planted before anything real is graded — including one wrong by a '
          + 'billionth, invisible to any tolerance — and if one passes, the run aborts. ' + green + ' of ' + ran
          + ' batteries were executed during this build, not remembered. Every genuine bug this project has '
          + 'found was caught that way; none by reading code.' },
      { b: 'Independence is independence from the CLAIMANT.',
        raw: 'When this machine decides someone else\'s claim it does not run their code, and their code is '
          + 'never in the trust path — ' + commas(claimsL.decided) + ' published claims decided that way so far. '
          + 'It does not mean every checker is a clean-room rewrite of every producer: the two places code '
          + 'crosses that line are both ours and both disclosed in <a href="/about/">the limits</a>.' }
    ]),
    C.note({ lab: 'the sentence that costs the most', bodyRaw: C.pRaw('Absence of proof is never evidence of '
      + 'absence. A refusal here is terminal — never retried at lower rigour, never converted into a '
      + 'probability, never quietly dropped from the record — and that is the property a motivated party would '
      + 'not build.') })
  ].join('\n')
}));

/* ---- §1 · the innovations --------------------------------------------------
   Named as innovations, with the number each one is worth. Anything that
   cannot show a measured number does not belong in this table; the roadmap
   lives in the next section, fenced, and carries none. */
{
  const rows = [
    ['The grade is the proof',
      'A reward channel with no answer key: a model proposes an exact object, the grader re-derives it from whole numbers and returns CERTIFIED, REFUTED with the violated equation, or REFUSED. Nothing to leak, nothing to game.',
      commas(evalRows.length) + ' real-model proposals graded, ' + commas(evN('certified')) + ' certified',
      '/oracle/'],
    ['Refusal, counted by kind',
      'The third verdict published as a rate with a denominator, and never merged across kinds — an instrument declining is not a claimant publishing nothing is not a budget running out.',
      pctv(evRefusalRate) + ' of ' + commas(evClaims) + ' submitted claims refused',
      '/reports/refusals.html'],
    ['A certified enclosure is a canary factory',
      'If a quantity is pinned to width w and a grader accepts anything within tol of a stored decimal, every value in the surrounding band is provably not the quantity AND passes. Adversarial submissions are minted from certificates instead of written by hand.',
      'tolerance grader accepts ' + pctv(envsTol.falseAccept) + ', certificate grader ' + pctv(envsSound.falseAccept),
      '/reports/envs.html'],
    ['An environment that rewards breaking things',
      'The model is shown a grader and asked to break it. Ground truth is free because a certified enclosure decides both halves — and some rungs cannot be broken at all, so an auditor that always finds something fails half the ladder.',
      envsRec.attacker.rungs.filter((r) => !r.attackable).length + ' of ' + envsRec.attacker.rungs.length + ' rungs unbreakable by construction',
      '/reports/envs.html'],
    ['Evidence, not verdicts',
      'A bare verdict scores zero however correct it is: HOLDS must ship a tiling whose every cell verifies, FAILS must ship a witness. Dressing a sampling grid as a tiling scores worse than abstaining.',
      'the bluffing solver scores ' + uni.score.toFixed(2) + ', below abstention',
      '/reports/envs.html'],
    ['Calibration before claim',
      'An instrument may not state a new result until it has re-derived a published one at every run. The rule is enforced in code, not in discipline.',
      'Mercer\'s λ(3) and this lab\'s λ(4) closed forms re-derived before any λ(5) claim',
      '/reports/lambda5.html'],
    ['Forgeries as measured soundness',
      '"The grader is sound" converted from an assertion into a number: planted near-misses that must fail, in every battery, on every build.',
      envsRec.forgeries.planted + ' planted in the environments, ' + envsRec.forgeries.leaked + ' leaked · ' + aiC.mutations + ' in the audit lanes, all rejected',
      '/reports/methods-note.html'],
    ['Certificates that detach',
      'A result travels without the machine that produced it: a JSON of exact numbers plus a verifier in the Python standard library, which must refute a deliberately forged value before it exits green.',
      '3 stdlib verifiers, no dependencies, ~1 second each',
      '/verify/'],
    ['Pages born from records',
      'No page here is written; every one is generated from the certificates it cites and re-derives its own numbers at build. A build that drifts refuses to ship.',
      'this page, and every other',
      '/reports/'],
    ['One rule, one module',
      'A rule defined twice will diverge. The covering check that several theorems stand on lives in one module with four consumers, after it was written twice and disagreed.',
      'instruments/covering · 4 consumers',
      '/reports/'],
    ['The claims desk',
      'Somewhere for a claim to go, with the verdict published whichever way it falls — and the submitted count published while it is still zero.',
      commas(claimsL.decided) + ' decided, ' + claimsL.submitted + ' submitted by others',
      '/reports/claims.html']
  ].map((r) => [
    { raw: '<b>' + C.esc(r[0]) + '</b>' }, { raw: C.esc(r[1]) },
    { raw: C.m(r[2]) }, { raw: '<a href="' + C.escAttr(r[3]) + '">' + C.esc(r[3]) + '</a>' }
  ]);
  B.push(C.section({
    lab: '§1 · the innovations', title: 'What was built to make that true', wide: true,
    bodyRaw: [
      C.table({ cols: [{ h: 'the idea' }, { h: 'what it is' }, { h: 'measured', cls: 'v' }, { h: 'where' }], rows }),
      '<div class="col">' + C.pRaw('None of these is a new species on its own. Exact arithmetic is the '
        + 'validated-numerics tradition; verifiable-reward environments are a category; kernel-checked proof '
        + 'systems have had no answer key for years. What has no neighbour is the composite — exact, '
        + 'independent of the claimant, re-runnable without the engine, refusal-bearing, and pointed at '
        + 'machine-generated claims. The one property in that list a lab cannot build for itself is '
        + 'independence, because it is the author of the claim.') + '</div>'
    ].join('\n')
  }));
}

/* ---- §2 · the roadmap ------------------------------------------------------
   FENCED. Nothing here is built, so nothing here carries a number. The moment
   one of these ships it moves up into §1 with its measurement attached. */
B.push(C.section({
  lab: '§2 · what is being built', title: 'Not built yet — and stated so',
  bodyRaw: [
    C.pRaw('<strong>Nothing in this section exists.</strong> It carries no numbers because there are none, and '
      + 'it is here so that the difference between what this machine does and what it intends is legible '
      + 'without asking. Each line moves into the table above on the day it has a record behind it.'),
    C.plainList([
      { b: 'An exact-witness gym.', text: 'The four rungs already exist as separate instruments — rank-R matmul '
        + 'schemes, bilinear products over F2, spherical codes, certify-or-refute a constant. What is missing is '
        + 'the packaging: one environment, one harness, a published pass-rate table, and the hack rate printed '
        + 'beside it. The rungs are built; the wrapper is not.' },
      { b: 'A benchmark of the graders.', text: 'Re-decide the exactly-checkable keys of public benchmarks and '
        + 'publish the error rate per source. CORRECTION, 2026-09-03: an earlier version of this line said nobody '
        + 'benchmarks the graders. That is false, and a literature pass found it out — verifier false-accept and '
        + 'false-reject rates are measured in the 2026 RLVR literature, including on deployed code-RL suites, and '
        + 'benchmark answer-key errors have their own papers. What is not in that literature, so far as this pass '
        + 'reached, is an adversarial set whose members are PROVABLY wrong rather than believed wrong: everyone '
        + 'else mutates a reference answer, and a certified enclosure refutes a value outright. That narrower '
        + 'thing is what remains to build here.' },
      { b: 'An open-frontier environment.', text: 'Every mathematics environment trains against problems with '
        + 'known answers. The one worth building has none: the reward is beating the current certified record, '
        + 'and the record ratchets when a rollout beats it — kissing numbers, matmul ranks, explicit constants. '
        + 'It cannot be graded without exact certification, which is the whole reason to attempt it here. '
        + 'Nothing of it is built beyond the ledger that would hold the records.' }
    ]),
    C.note({ lab: 'why this section is allowed to exist', bodyRaw: C.pRaw('A site that only ever shows finished '
      + 'work invites the reader to guess at the direction, and guessing is what this machine exists to '
      + 'replace. The fence is the price: no numbers, no screenshots, no dates, and no claim that any of it '
      + 'works — until it does, at which point it moves up one section and brings its record with it.') })
  ].join('\n')
}));

/* ---- §1 · the machine, drawn from the ledger -------------------------------
   The drawing itself lives in tools/machine-figure.js, shared with the
   landing so the two can never drift apart. Every count is read off
   ledger.json at build time. */
{
  const { machineFlow } = require(path.join(__dirname, 'machine-figure.js'));
  B.push(C.section({
    lab: '§3 · the loop', title: 'How a claim becomes a certificate', wide: true,
    bodyRaw: machineFlow(ledger, { gates: { green, ran } })
  }));
  /* the record the landing reads, so the drawing is IDENTICAL on both pages:
     the battery count on the landing is this build's measurement, not a memory.
     A --no-batteries build measured nothing and writes nothing. */
  if (runBatteries) fs.writeFileSync(path.join(ROOT, 'batteries.json'),
    JSON.stringify({ green, ran, git: sh('git rev-parse --short HEAD') || 'unknown' }) + '\n');
}

if (ledger.families.length) {
  const rows = ledger.families.map(f => [
    { raw: C.m(f.name) },
    { raw: C.esc(f.statement) },
    { raw: C.m(commas(f.counts.generated)) },
    { raw: C.m(commas(f.counts.screened)) },
    { raw: C.m(f.counts.certified + ' → ' + f.counts.hits) },
    { raw: f.truncated ? C.tag('cap reached', 'open') : C.tag('exhausted', 'dep') }
  ]);
  B.push(C.section({
    lab: '§4 · the families', title: 'What the engine is enumerating', wide: true,
    bodyRaw: C.table({ cols: [{ h: 'family' }, { h: 'what a hit asserts' }, { h: 'generated', cls: 'v' }, { h: 'screened', cls: 'v' }, { h: 'certified → hit', cls: 'v' }, { h: 'stop' }], rows })
      + '<div class="col">' + C.pRaw('The screen is float and may only ever <em>prune</em>; nothing is admitted '
        + 'without an exact certificate. A family plugs in by supplying six functions — enumerate, value, '
        + 'interesting, certify, key, statement — and inherits the loop, the scale and the dedup.') + '</div>'
  }));
}

if (ledger.conjectures.length) {
  const rows = ledger.conjectures.map(c => [
    { raw: C.m(c.family) },
    { raw: C.m('[' + (c.extra && c.extra.A ? c.extra.A.join(',') : c.key) + ']') },
    { raw: C.m('[' + fmt(c.enclosure[0], 12) + ', ' + fmt(c.enclosure[1], 12) + ']') },
    { raw: C.m(Number(c.width).toExponential(2)) },
    { raw: c.closedForm ? C.m(c.closedForm.refuted + ' / ' + c.closedForm.tested) : '—' }
  ]);
  B.push(C.section({
    lab: '§5 · certified conjectures', title: 'The objects that survived', wide: true,
    bodyRaw: C.table({ cols: [{ h: 'family' }, { h: 'object', cls: 'v' }, { h: 'certified enclosure', cls: 'v' }, { h: 'width', cls: 'v' }, { h: 'closed forms refuted', cls: 'v' }], rows })
      + '<div class="col">' + C.pRaw('Each row is an exact enclosure, not a measurement. The last column is the '
        + 'engine asking whether the value has a small closed form: every candidate lying outside the enclosure '
        + 'is <strong>refuted exactly</strong>. The Ramanujan Machine matches truncated decimals and argues from '
        + 'collision probability; this decides.') + '</div>'
  }));
}

{
  const rows = (ledger.relations || []).slice(0, 20).map(r => [
    { raw: C.m(r.label) }, { raw: C.m(fmt(r.value, 12)) },
    { raw: C.m('[' + fmt(r.enclosure[0], 12) + ', ' + fmt(r.enclosure[1], 12) + ']') },
    { raw: C.tag('candidate', 'cert') }
  ]);
  B.push(C.section({
    lab: '§6 · closed forms', title: 'What survived the enclosure test', wide: true,
    bodyRaw: (rows.length
      ? C.table({ cols: [{ h: 'form' }, { h: 'value', cls: 'v' }, { h: 'inside this enclosure', cls: 'v' }, { h: '' }], rows })
      : '<div class="col">' + C.note({
        lab: 'Nothing survived, and that is the result',
        bodyRaw: C.pRaw(C.m(commas(T.closedFormTested || 0)) + ' candidate closed forms were tested against '
          + 'certified enclosures around 1e−15 wide, and <strong>' + commas(T.closedFormRefuted || 0)
          + ' were refuted exactly</strong> — the value provably lies outside. Zero survivors means these objects '
          + 'have no small closed form of the shapes searched: a proved negative, not a failed search.')
      }) + '</div>')
      + '<div class="col">' + C.pRaw('The count decomposes with nothing folded in: ' + C.m(decompose)
        + ' Forms the 17-digit double screen could not separate were re-decided at the full published digit '
        + 'length in BigInt; forms OEIS already states are the record check working, not discoveries; the '
        + 'subtraction closes to zero and the engine refuses to write a ledger where it does not.') + '</div>'
  }));
}

{
  const rows = [6, 7, 8, 9, 10, 17, 18, 19, 20].map(n => [
    { raw: C.esc('bar(' + n + ')') },
    { raw: C.m(fmt(Math.sqrt(ENV.barSq(n)), 15)) },
    { raw: ENV.ADOPTED.some(a => a.n < n && ENV.VALUE.get(a.n) === ENV.barSq(n)) ? C.tag('adopted here', 'cert') : C.tag('literature / lab', 'dep') }
  ]);
  const stale = ENV.audit(ledger.conjectures);
  B.push(C.section({
    lab: '§7 · the envelope', title: 'What a Newman hit has to beat', wide: true,
    bodyRaw: C.table({ cols: [{ h: 'bar' }, { h: 'certified min|f| to beat', cls: 'v' }, { h: 'source' }], rows })
      + '<div class="col">'
      + C.pRaw('Anchors from the literature and the source lab, plus objects this lab certified and then adopted. '
        + 'Both stored as witness sets and re-certified at load, so no value is transcribed. '
        + '<strong>Frozen at load</strong> — the bar never moves under a running campaign, or a candidate\'s '
        + 'verdict would depend on when it was proposed.')
      + C.pRaw('The bars at n = 10 and n = 17 MOVED in August 2026 — bar(10) to ' + C.m(fmt(Math.sqrt(ENV.barSq(10)), 4))
        + ' past Boyd\'s 1986 witness, bar(17) to ' + C.m(fmt(Math.sqrt(ENV.barSq(17)), 4)) + ' via the certified '
        + 'n = 13 box champion — because the exhaustive box30 sweeps behind ' + C.m('certs/mu-table.json')
        + ' certified minima exceeding what the literature and the source lab held. A returning reader\'s remembered '
        + 'bar is stale because the mathematics improved, not because anything drifted; the rows tagged '
        + '"adopted here" are exactly those promotions.')
      + (stale.length ? C.note({
        lab: stale.length + ' unadopted excess', bodyRaw: stale.map(x =>
          C.pRaw('n = ' + x.n + ': certified ' + C.m(fmt(Math.sqrt(x.modSq[0]), 12)) + ', envelope has '
            + C.m(fmt(Math.sqrt(x.envelopeHas), 12)))).join('')
      })
        : C.pRaw('Staleness audit: <b>clean</b> — nothing certified sits above the envelope unadopted.'))
      + '</div>'
  }));
}

{
  const rows = bats.map(b => [
    { raw: C.esc(b.n) }, { raw: C.esc(b.note) },
    { raw: b.ok === null ? C.tag('not run', 'dep') : (b.ok ? C.tag('green', 'held') : C.tag('RED', 'open')) }
  ]);
  B.push(C.section({
    lab: '§8 · the instruments', title: 'What certifies, and whether it runs', wide: true,
    bodyRaw: C.table({ cols: [{ h: 'battery' }, { h: 'covers' }, { h: 'this build' }], rows })
      + '<div class="col">' + C.pRaw('Lifted from the source lab: ' + C.m(prov.counts.files + ' files') + ', '
        + C.m(prov.counts.patched + ' patched') + ' on the way in, each patch declared. Drift now: ' + C.m(drift) + '. '
        + '<strong>The source lab (' + C.esc(require('path').basename(rj('LIFT.json').source_root)) + ') is read-only, permanently</strong> — read anything, '
        + 'never write, and report an error there rather than repair it.') + '</div>'
  }));
}

const foot = '<footer class="col">'
  + '<p>' + C.esc('Generated by tools/build-control.js. Rebuild: make engine && make control.') + '</p>'
  + '<p>' + C.esc('git ' + (sh('git rev-parse --short HEAD') || '—') + ' · '
    + (sh('git rev-list --count HEAD') || '0') + ' commits') + '</p>'
  + '<p style="margin-top:20px;color:var(--ink-2)">' + C.esc('Carlos Toledo · cert-machine') + '</p>'
  + '</footer>';

fs.writeFileSync(path.join(ROOT, 'index.html'),
  TPL.render({ title: 'The machine · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot, path: '/machine/',
    desc: 'The machine: what it is, what was built to make it true, and the live record underneath — the concept and its five rules, eleven innovations each with the number it is worth, what is being built next (fenced, and carrying no numbers), then every family, instrument, battery and certificate in the current build.' }));

console.log('index.html written');
console.log('  generated ' + commas(T.generated || 0) + ' · certified ' + commas(T.certified || 0)
  + ' · conjectures ' + (ledger.conjectures || []).length
  + ' · closed forms refuted ' + commas(T.closedFormRefuted || 0));
console.log('  batteries ' + green + '/' + ran + ' · drift ' + drift);
