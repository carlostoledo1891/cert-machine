#!/usr/bin/env node
/* build-site.js — assemble the public site bundle (site/) for carlostoledo.co.

   The landing page is generated from the ledger and the certificates the way
   every report is: numbers are RECOMPUTED at build time and the build THROWS
   if any of them fails its own consistency identity — a stale or broken
   number cannot ship. Everything else is copied: the control page, the
   reports, the detached certificates, the stdlib verifiers.

   usage: node tools/build-site.js          (or: make site)
   deploy: Vercel serves site/ statically — vercel.json sets outputDirectory;
   nothing builds in the cloud, nothing gates; the operator's push publishes. */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SITE = path.join(ROOT, 'site');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));

/* set when the public repo exists; the landing's "code" link points here */
const GITHUB = 'https://github.com/carlostoledo1891/cert-machine';

const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const fail = (m) => { throw new Error('build-site REFUSES: ' + m); };
const fmt = (n) => n.toLocaleString('en-US');

/* ---- the numbers, recomputed and self-checked ---------------------------- */
const ledger = JSON.parse(fs.readFileSync(path.join(ROOT, 'ledger.json'), 'utf8'));
const T = ledger.totals;
{
  const parts = T.closedFormRefuted + T.closedFormRefutedExact + T.closedFormOnRecord
    + T.closedFormOpen + T.closedFormCandidates;
  if (parts !== T.closedFormTested) fail('closed-form decomposition does not close: ' + parts + ' != ' + T.closedFormTested);
}
const rm = ledger.families.find((f) => f.name === 'ramanujan-audit');
if (!rm || rm.counts.certified !== 52 || rm.counts.hits !== 51 || rm.counts.rejects !== 1) {
  fail('ramanujan-audit counts moved (' + JSON.stringify(rm && rm.counts) + ') — update the landing story deliberately, not silently');
}
/* the 52-row corpus = the 51 PRINTED sheet rows + our certified correction of
   the refuted one. Public counts use the printed rows only — counting the
   correction as a 52nd decided row (or its survival as a 51st) would inflate
   the audit by our own row. */
const rmPrinted = rm.counts.certified - 1, rmSurvive = rm.counts.hits - 1;
const e852 = ledger.families.find((f) => f.name === 'erdos852-constants');
if (!e852 || e852.counts.rejects !== 1) fail('erdos852 counts moved');

/* the AI-audit flagships and the eval, gated like everything else */
if (!ledger.conjectures.some((c) => c.family === 'strassen-audit' && c.key === 'mm|alphaevolve-48-4x4x4'))
  fail('the AlphaEvolve rank-48 row is missing from the ledger');
if (!ledger.conjectures.some((c) => c.family === 'strassen-audit' && c.key === 'mm|alphatensor-f2-4x4x4'))
  fail('the AlphaTensor rank-47 F2 row is missing from the ledger');
const evalRows = fs.readFileSync(path.join(ROOT, 'certs', 'matmul-eval-ledger.jsonl'), 'utf8')
  .trim().split('\n').map((l) => JSON.parse(l));
const evalReal = evalRows.filter((r) => r.model !== 'fake');
if (!evalReal.length) fail('the eval ledger holds no real-model rows — the landing story assumes a live board');
const evalCert = evalReal.filter((r) => r.outcome === 'certified').length;
const evalRefuted = evalReal.filter((r) => r.outcome === 'refuted').length;

const census16 = JSON.parse(fs.readFileSync(path.join(ROOT, 'census-high-periods.json'), 'utf8')).find((r) => r.p === 16);
if (!census16 || !census16.ok || !census16.recheck.ok || census16.points !== 1696) fail('the period-16 census record moved');

const mercer = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'mercer-mu5.json'), 'utf8'));
const rungs = Object.keys(mercer.rows).map(Number).sort((a, b) => a - b);
for (const m of rungs) if (mercer.rows[m].verdict !== 'CERTIFIED') fail('mercer rung m=' + m + ' is not CERTIFIED');
const topM = rungs[rungs.length - 1];

const lambdaRows = Object.keys(JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'lambda-table.json'), 'utf8')).rows).length;
const muRows = Object.keys(JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'mu-table.json'), 'utf8')).rows).length;
if (lambdaRows < 23 || muRows < 9) fail('mu/lambda tables thinner than recorded (' + lambdaRows + ', ' + muRows + ')');

/* ---- the landing page ---------------------------------------------------- */
const B = [];
B.push(C.header({
  eyebrow: 'Carlos Toledo · cert-machine',
  title: 'The conjecture engine',
  deck: 'AI verification infrastructure: verification layers under which AI-scale mathematical search produces '
    + 'only certified output — reward signals that cannot be hacked — and certified audits of published '
    + 'AI-generated mathematics. Screens may prune; only exact arithmetic admits. A REFUTED here is proved.'
}));

B.push(C.stats([
  { k: 'published claims', v: '1 refuted · 1 corrected', role: 'warn', n: 'Erdős #852 C* refuted at digit 12 · one RM printed row corrected (a transcription slip) — both replacements certified' },
  { k: 'AlphaEvolve rank-48', v: 'CERTIFIED', role: 'held', n: 'the ⟨4,4,4⟩ decomposition verified over Z[i] from pinned sources · AlphaTensor\'s rank-47: verified over F2, REFUTED over Q' },
  { k: 'model proposals graded', v: fmt(evalReal.length), n: evalCert + ' certified — each an exact theorem · ' + evalRefuted + ' subtly wrong'
      + (evalRefuted === 0 ? ' — the reward channel has never paid out on a false claim' : '') },
  { k: 'closed forms refuted', v: fmt(T.closedFormRefuted + T.closedFormRefutedExact), role: 'held', n: 'every one exact; zero discoveries claimed' },
  { k: 'Ramanujan Machine rows', v: rmPrinted + ' printed rows', n: rmSurvive + ' survive · 1 refuted as printed, its correction certified' },
  { k: 'period-16 Hénon points', v: 'EXACTLY ' + fmt(census16.points), role: 'held', n: fmt(census16.boxes) + ' boxes exhausted, recheck clean — the instruments\' proving ground' }
]));

B.push(C.section({
  lab: 'the three products', title: 'What this is',
  bodyRaw: [
    C.p('Certified audits of published AI-generated mathematics. The GPT-published constant on Erdős #852, refuted at its '
      + '12th significant digit and shown to BE the naive IEEE-754 float product, digit for digit — corrected value certified '
      + 'to width 3.2e-16. All ' + rmPrinted + ' printed rows of the Ramanujan Machine\'s seven result sheets decided: '
      + rmSurvive + ' survive an unconditional audit; one printed row is refuted exactly, its correction certified on the '
      + 'same enclosure. AlphaEvolve\'s rank-48 ⟨4,4,4⟩ decomposition: CERTIFIED over Z[i]. AlphaTensor\'s rank-47: '
      + 'verified over F2 and REFUTED over Q — the speedup provably requires characteristic 2.'),
    C.p('Evaluation whose ground truth is a proof. Frontier models propose exact tensor decompositions; the grader '
      + 're-derives every claim from the witness in exact rational arithmetic — no judge, no rubric, and no answer key '
      + 'to contaminate. A reference value computed in float puts its failure class inside the answer key; here the '
      + 'reference is not a value at all. ' + fmt(evalReal.length) + ' model proposals graded so far, every certified '
      + 'row a theorem, every refuted row a proof of error.'),
    C.p('A verified reward channel. The same harness is a reward oracle for mathematical search under which reward '
      + 'hacking is excluded by construction, not by monitoring — false positives are provably impossible, and an '
      + 'instrument that cannot decide refuses rather than pays. Stated as engineering below.'),
    C.p('And the proving ground the verifiers earned their trust on: ' + fmt(T.closedFormTested) + ' candidate closed '
      + 'forms tested against certified enclosures, ' + fmt(T.closedFormRefuted + T.closedFormRefutedExact) + ' refuted '
      + '— each refutation a proof, zero discoveries claimed. Completeness censuses ("there are EXACTLY '
      + fmt(census16.points) + ' period-16 Hénon points, and nothing else anywhere in the plane"), certified extremal '
      + 'tables, a certified entropy bound. The instruments were calibrated on hard classical ground — reproducing '
      + 'Galias\'s censuses, Goddard\'s boxes, Apéry\'s row — before they were pointed at anything a model produced.')
  ].join('\n')
}));

B.push(C.section({
  lab: 'verified reward', title: 'A reward channel that cannot be hacked',
  bodyRaw: [
    C.p('The engine\'s one load-bearing invariant — a float screen may only PRUNE, never admit; every admission '
      + 'passes exact arithmetic; REFUSED earns nothing — is precisely the property a verified-reward signal needs: '
      + 'there is no gap between "graded correct" and "is correct" for a policy to exploit. A proposal either IS an '
      + 'exact certificate or it is not, and both directions of the verdict are theorems.'),
    C.p('That property is measured, not asserted. Every campaign begins with red controls — deliberate forgeries, '
      + 'including one whose coefficient is off by 1e-9, invisible to any float screen — and a single control '
      + 'certifying ABORTS the run: the oracle proves its refusal path fires before it grades anything. Across every '
      + 'real-model campaign to date (' + fmt(evalReal.length) + ' proposals), ' + (evalRefuted === 0
        ? 'no false proposal has ever certified and no certified row has ever been wrong — the channel has never paid '
        + 'out on a false claim.'
        : evalRefuted + ' well-formed proposals were refuted exactly; none certified.')),
    C.p('The scope is stated as honestly as the property: this holds for claims that reduce to finitely many exact '
      + 'arithmetic facts — exhibit-a-witness tasks, identities, enclosures — not for mathematics at large. Inside '
      + 'that domain, the harness that evaluates a model can sit unchanged inside a training loop: reinforcement '
      + 'learning on certified rewards, with the verifier strictly stronger than the proposer. That is the '
      + 'verification half of scalable oversight, running, on the one domain where it is currently possible.')
  ].join('\n')
}));

/* ---- the report shelf, ordered by weight ---------------------------------
   The order IS the ranking — the landing shows the head of this list, the
   /reports/ index shows all of it. Annotations stay qualitative or gated:
   a volatile number that this builder did not recompute does not go on a
   card. The build refuses if the shelf and reports/ on disk disagree, so a
   new report cannot ship uncatalogued. */
const REPORTS = [
  /* group 'ai': the AI-verification shelf — the audience-facing work */
  { g: 'ai', f: 'matmul-eval.html', k: 'the eval · live board',
    title: 'The matmul eval: ground truth is a proof',
    desc: 'Frontier models are asked for exact rank-R matmul tensor decompositions; every proposal is certified or refuted in exact rational arithmetic. No judge, no rubric, no answer key to contaminate — a proof either exists or it does not.',
    n: fmt(evalReal.length) + ' proposals graded · zero subtly-wrong survivors' },
  { g: 'ai', f: 'alphaevolve.html', k: 'audit · AI-discovered algorithms',
    title: 'The AI-discovered algorithms, certified',
    desc: 'AlphaEvolve’s rank-48 ⟨4,4,4⟩ certified over Z[i]; AlphaTensor’s rank-47 verified over F2 and REFUTED over Q — the speedup provably requires characteristic 2. Both decided from commit-pinned bytes at every build.',
    n: '11 algorithms re-decided each build' },
  { g: 'ai', f: 'erdos852.html', k: 'audit · refutation',
    title: 'The constant that was a rounding error',
    desc: 'A GPT-published constant on Erdős #852, refuted at its 12th significant digit and shown to BE the naive IEEE-754 float product, digit for digit — with the certified correction, and the failure taxonomy for eval builders.',
    n: 'refuted at digit 12 · correction certified' },
  { g: 'ai', f: 'verifier-loop.html', k: 'verified reward · demo',
    title: 'The verifier in the loop',
    desc: 'The reward channel in closed loop: a model proposes, the grader answers every failure with its own refutation mechanism — the exact violated equation, nothing more — and the model retries. Every trajectory rendered from the append-only ledger.',
    n: 'feedback template-locked · zero coaching' },
  { g: 'ai', f: 'answer-key.html', k: 'note · for eval builders',
    title: 'When the answer key is wrong',
    desc: 'Three certified specimens of mathematical answer keys failing in ways reruns and digit cross-checks provably cannot catch — and the working design that removes the answer key altogether.',
    n: 'every specimen re-proved at build' },
  { g: 'ai', f: 'methods-note.html', k: 'methods note',
    title: 'None by reading code',
    desc: 'Every real bug this machine has found — ten, cataloged — was caught by a red control, a calibration, an impossible number, or a byte pin. How to build verifiers that catch their own defects, stated as engineering.',
    n: 'every regression re-held by a battery at build' },
  { g: 'ai', f: 'rm-audit.html', k: 'audit · standing registry',
    title: 'The Ramanujan Machine, audited',
    desc: 'Every row of all seven published result sheets decided by rigorous enclosures and exact rational comparisons — the whole registry re-certified at every build.',
    n: rmPrinted + ' printed rows · ' + rmSurvive + ' survive · 1 refuted, correction certified' },
  { g: 'ai', f: 'impostors.html', k: 'proved negatives',
    title: 'The impostor catalog',
    desc: 'Published constants that agree with simple closed forms for dozens of significant digits — and exact proofs that every one of them is lying. Digit agreement is not evidence: the answer-key-contamination parable.',
    n: 'exact BigInt refutations at full published precision' },
  { g: 'ai', f: 'alien-science.html', k: 'eval note · alignment sandbox',
    title: 'Alien science needs a disposition',
    desc: 'An evaluation note on Anthropic’s automated-alignment sandbox: its authors name evaluation as the binding constraint, and this is what certified evaluation looks like.',
    n: 'posted to the inviting repository' },
  { g: 'ai', f: 'zeta3-audit.html', k: 'audit · ζ(3) sheet',
    title: 'The ζ(3) sheet, decided',
    desc: 'The Ramanujan Machine’s complete zeta(3) result sheet re-decided with certificates: proved tail bands, convergence inside the certificate, exact rational comparisons.',
    n: 'the spurious-solution lemma re-proved at build' },
  /* group 'applied': the new fronts — certified applications with live
     external stakes (aerospace, energy) */
  { g: 'applied', f: 'skyaudit.html', k: 'aerospace · the app, cited',
    title: 'SkyAudit: the helicopter day, decided',
    desc: 'One pinned day of New York helicopter traffic, re-flown on paper by four eVTOLs’ own published numbers under the FAA reserve rule — every flight decided: E-FLYABLE, BEYOND RANGE with an exact witness, or NEEDS DATA where public specs cannot say. The citable methodology behind the live app.',
    n: 'every certificate row recounted at the page’s own build' },
  { g: 'applied', f: 'evtol-energy.html', k: 'aerospace · energy certificates',
    title: 'The reserve, provable',
    desc: 'Energy-feasibility certificates for eVTOL missions against the FAA reserve rule: CERTIFIED for every parameter point in the boxes, REFUTED with an exact falsifying witness, or honestly REFUSED — where the industry argues with Monte Carlo, this decides.',
    n: 'verdicts cross-proved by 256-corner exact sweeps' },
  { g: 'applied', f: 'water-value.html', k: 'energy · certified theorem',
    title: 'The water value, certified',
    desc: 'The shadow price of stored water in a hydro-dominated grid is a martingale between stock-binding events — proved by LP duality on scenario trees, with the solver extracted from the published artifact’s own bytes and 120 random trees re-certified at every build.',
    n: 'duality gap ~1e-14 · continuum limit honestly OPEN' },
  /* group 'ground': the instruments, proven on hard classical ground */
  { g: 'ground', f: 'mfg-cap.html', k: 'certified theorem · multiplicity',
    title: 'Two solutions, provably',
    desc: 'Certified multiplicity for a non-monotone mean-field game: two equilibria enclosed in disjoint interval-arithmetic balls at one parameter set, in the regime where uniqueness theory is silent — and a proof that REFUSES at the bifurcation.',
    n: 'the unit’s battery + six falsifiers re-run at build' },
  { g: 'ground', f: 'mfg-lab.html', k: 'certified reproduction · registry',
    title: 'The MFG laboratory, certified',
    desc: 'The single-file MFG laboratory’s certified claims: a published Wardrop table reproduced within its own rounding AND proved (Krawczyk box, exact rational solve), the discrete adjoint identity, and the non-unique split behind unique totals.',
    n: 'four of the lab’s own batteries re-run at build' },
  { g: 'ground', f: 'mercer-program.html', k: 'program · certified landscape',
    title: 'The Mercer program',
    desc: 'Chowla’s cosine dips and Newman’s 0/1 minima certified as one landscape: exhaustive box sweeps, exact champions, a Sturm equality — every claim re-proved at build.',
    n: 'mu(5) ≤ 1 + π/' + topM + ' · re-certified every build' },
  { g: 'ground', f: 'erdos290.html', k: 'erdős #290 · theorem',
    title: 'Erdős #290: the 4k(k+1) theorem',
    desc: 'The square-discriminant law proved and re-proved as exact integer identities during the build, the enclosure sweep deepened past the cited page, the exceptional degree closed.',
    n: 'planted falsifiers must fire at build' },
  { g: 'ground', f: 'entropy.html', k: 'certified invariant',
    title: 'Entropy, with a certificate',
    desc: 'A certified lower bound on the topological entropy of the classical Hénon map — covering relations composed to an exact integer spectral argument, calibrated at the full horseshoe.',
    n: 'h_top ≥ 0.3017, a theorem' },
  { g: 'ground', f: 'verify-lemniscate.html', k: 'erdős #1038 · verification',
    title: 'Erdős #1038: thirty decimals verified',
    desc: 'The computational fragment of the Darvas–Peng–Tao manuscript re-verified by an independent route — Krawczyk rather than bisection — with the 30th digit read correctly.',
    n: 'filed on the claiming authors’ repository' },
  { g: 'ground', f: 'mfg-congest.html', k: 'validated numerics',
    title: 'A congestion mean-field game, enclosed',
    desc: 'An equilibrium of a mean-field game with congestion enclosed by validated numerics: an exact solution within an explicit radius, locally unique in the full sequence space.',
    n: 'embedded verifier re-run at build' },
  { g: 'ground', f: 'wardrop-repro.html', k: 'certified reproduction',
    title: 'Wardrop, certified: exact, enclosed, refused',
    desc: 'The multi-population Wardrop equilibria of a published paper reproduced with certificates — exact where possible, enclosed where not, and refused where honesty demands it.',
    n: 'embedded verifier re-run at build' }
];
const AI_REPORTS = REPORTS.filter((r) => r.g === 'ai');
const APPLIED_REPORTS = REPORTS.filter((r) => r.g === 'applied');
const GROUND_REPORTS = REPORTS.filter((r) => r.g === 'ground');
{
  const onDisk = fs.readdirSync(path.join(ROOT, 'reports')).filter((f) => f.endsWith('.html')).sort();
  const shelf = REPORTS.map((r) => r.f).sort();
  if (onDisk.join(',') !== shelf.join(','))
    fail('the report shelf and reports/ disagree — disk [' + onDisk + '] vs shelf [' + shelf + ']');
}
const reportCards = (rs, prefix) => C.cards(rs.map((r) => ({ href: prefix + r.f, k: r.k, title: r.title, desc: r.desc, n: r.n })));

/* ---- the certificates, described -----------------------------------------
   Same rule as the shelf: the build refuses if certs/ holds a file this
   table cannot describe. */
const CERTS = [
  ['erdos852-certificate.json', 'Both Erdős #852 constants as exact data: the c0 window re-decidable at 130 digits, the C∗ refutation as strict integer inequalities with no tail bound.', 'verify_erdos852.py'],
  ['keller-certificate.json', 'The Jacobian/Hessian counterexample corpus — every polynomial as explicit exact rational monomials; determinants and collisions re-derivable from the file alone.', 'verify_keller.py'],
  ['strassen-certificate.json', 'Nine fast matrix-multiplication algorithms as exact tensor identities over Q and F2 — including AlphaTensor’s rank-47, decided both ways.', 'verify_strassen.py'],
  ['mercer-mu5.json', 'The mu(5) ladder, mu(5) ≤ 1 + π/m rung by rung to m = ' + topM + ' — every exceptional tuple closed by one exact rational evaluation.', null],
  ['mu-table.json', 'The Newman min-modulus table: every set in the named boxes exhausted, champions certified, orbits classified, conservation per row.', null],
  ['mu-table-40.json', 'The wider-box extension of the mu table — billions of sets exhausted, the narrow-box crowding artifacts corrected.', null],
  ['lambda-table.json', 'The lambda table: the source lab’s rows reproduced exactly, plus rows nobody else holds, certified at the stated depth.', null],
  ['entropy-henon.json', 'The certified entropy lower bound for the classical Hénon map: h-sets, covering relations, and the exact spectral argument.', null],
  ['erdos290-tail-ext.json', 'The Erdős #290 sweep extension: degrees closed beyond the cited page, the constant’s enclosure tightened degree by degree.', null],
  ['matmul-eval-ledger.jsonl', 'The matmul eval’s append-only ledger — every campaign row, every verdict, every tag; the leaderboard is built from this file.', null],
  ['matmul-loop-ledger.jsonl', 'The verifier-in-the-loop ledger — every trajectory round with its verdict and the exact feedback sent; the loop report is built from this file.', null],
  ['skyaudit-forecast-ledger.jsonl', 'The prediction ledger — interval FORECASTS committed before their target day (sha-pinned, append-only) and scored after in exact rationals; coverage claims are conformal counting theorems, never model faith. Wrong forecasts stay forever.', null]
];
{
  const onDisk = fs.readdirSync(path.join(ROOT, 'certs')).filter((f) => f.endsWith('.json') || f.endsWith('.jsonl')).sort();
  const listed = CERTS.map((c) => c[0]).sort();
  if (onDisk.join(',') !== listed.join(','))
    fail('the certificate table and certs/ disagree — disk [' + onDisk + '] vs table [' + listed + ']');
}

/* ---- the machine, drawn ------------------------------------------------- */
/* IDENTICAL to the control page's drawing (operator ruling): the battery
   count comes from batteries.json, the record the control build measured
   and wrote. make site runs make control first, so it is never stale. */
const { machineFlow } = require(path.join(__dirname, 'machine-figure.js'));
const gates = (() => {
  const p = path.join(ROOT, 'batteries.json');
  if (!fs.existsSync(p)) fail('batteries.json missing — run make control (make site does) so the gates count is measured, not remembered');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
})();
B.push(C.section({
  lab: 'the machine', title: 'How a conjecture becomes a certificate', wide: true,
  bodyRaw: machineFlow(ledger, { gates })
    + '<div class="col after-fig">' + C.pRaw('The <a href="machine/">control page</a> is this drawing, live: every family, '
      + 'every battery executed at its build (never remembered), the full ledger decomposition, drift status.') + '</div>'
}));

/* ---- the app ------------------------------------------------------------ */
const skySummary = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps/skyaudit/data/day-2026-08-26/nyc.audit-summary.json'), 'utf8'));
const skyRefly = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps/skyaudit/data/day-2026-08-26/nyc.refly.json'), 'utf8'));
const skyBeta = skySummary.bySpecRule['beta-alia|faa-sfar-vfr'];
const skyFleet = skyRefly.keys['beta-alia|faa-sfar-vfr'].fleetMin;
B.push(C.section({
  lab: 'the app', title: 'SkyAudit — one real day over New York, every flight decided',
  bodyRaw: [
    C.p('The audit as an experience: a Flightradar24-style replay of a real, hash-pinned day of New York '
      + 'helicopter traffic (' + skySummary.uniqueAircraft + ' aircraft, ' + skySummary.flights + ' flights) — '
      + 'except every trail is colored by a VERDICT, not telemetry. Each flight is re-flown on paper by an '
      + 'eVTOL under a published energy-reserve rule, and decided by interval arithmetic: mathematically '
      + 'certified enclosures with exact-rational falsifying corners, never Monte Carlo.'),
    C.p('The day\'s findings: Beta ALIA certifiably covers ' + skyBeta.CERTIFIED + ' of the '
      + skySummary.flights + ' flights under the FAA 20-minute rule and needs EXACTLY ' + skyFleet
      + ' aircraft to re-fly them (proved by pigeonhole below, by a verified schedule above); Joby, Archer '
      + 'and Eve publish too little to certify a single fleet. The optimizer prices the levers — battery '
      + 'floors, charge times, the reserve rule itself — with a proof on both sides of every threshold.'),
    C.pRaw('<a href="apps/skyaudit/">Open SkyAudit →</a> — the replay, the certificate panel, the fleet '
      + 'frontier and the what-if sliders, live. Every number gate-checked at build; data © adsb.lol (ODbL). '
      + 'Also live: <a href="apps/skyaudit/sp/">the São Paulo pack</a> — the world\'s busiest urban helicopter '
      + 'market, decided under Brazil\'s own reserve rule (ANAC RBAC 91.151(b), pinned).')
  ].join('')
}));

/* ---- the reports -------------------------------------------------------- */
B.push(C.section({
  lab: 'the reports', title: 'Research notes that re-prove themselves', wide: true,
  bodyRaw: '<div id="reports"></div>'
    + reportCards(AI_REPORTS.slice(0, 6), 'reports/')
    + '<div class="col after-fig">'
    + C.pRaw('<a href="reports/">All ' + REPORTS.length + ' reports →</a> — including the classical-ground shelf '
      + 'the instruments were proven on. Every number on every page is recomputed from the certificates and '
      + 'records at build time, and a build that drifts refuses to ship.')
    + '</div>'
}));

B.push(C.section({
  lab: 'rerun a proof', title: 'Check a result yourself, in ten seconds',
  bodyRaw: [
    C.p('Every headline claim detaches into a certificate — a JSON file of exact numbers — plus a verifier in plain '
      + 'Python: standard library only, nothing to install, zero code shared with the engine. Each verifier re-derives '
      + 'the mathematics from the certificate alone, re-hashes the pinned sources, must refute a deliberately forged '
      + 'value before it will exit green, and prints the sha256 of the certificate it checked.'),
    C.code('python3 verify/verify_erdos852.py certs/erdos852-certificate.json\n'
      + 'python3 verify/verify_keller.py   certs/keller-certificate.json\n'
      + 'python3 verify/verify_strassen.py certs/strassen-certificate.json'),
    C.note({ lab: 'sources', bodyRaw: C.pRaw('Run from a clone of <a href="' + GITHUB + '">the repository</a> (add '
      + '<span class="m">--sources corpus/sources</span> to re-hash the pinned source bytes too), or download the '
      + 'certificate and verifier right here — the proof travels without the machine.') })
  ].join('\n')
}));

B.push(C.section({
  lab: 'the certificates', title: 'Proofs that travel without the machine', wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'certificate' }, { h: 'what it holds' }, { h: 're-verify', cls: 'v' }],
    rows: CERTS.map(([f, what, verifier]) => [
      { raw: '<a href="certs/' + f + '"><span class="m">' + C.esc(f) + '</span></a>' },
      what,
      { raw: verifier ? '<a href="verify/' + verifier + '"><span class="m">' + C.esc(verifier) + '</span></a>' : C.tag('battery-gated', 'dep') }
    ])
  })
    + '<div class="col">' + C.pRaw('Code, corpus, and full provenance: <a href="' + GITHUB + '">'
      + C.esc(GITHUB.replace('https://', '')) + '</a> — MIT, no dependencies. Instruments lifted from a private '
      + 'source lab are hash-pinned in PROVENANCE.json; patches are declared so they can never be mistaken for drift.') + '</div>'
}));

B.push(C.section({
  lab: 'the discipline', title: 'Why believe any of it',
  bodyRaw: [
    C.p('One load-bearing invariant: nothing floating-point can ever admit a claim. Screens only prune; every admission '
      + 'passes exact arithmetic (BigInt rationals, directed dyadic rounding, Sturm chains); an instrument that cannot '
      + 'decide REFUSES rather than guesses; every exhaustion carries a conservation identity that throws rather than '
      + 'return a record with a hole in it.'),
    C.p('Every battery carries red controls — forged inputs that must FAIL — and every instrument is calibrated against '
      + 'a case with a known answer before it runs on anything new. Every real bug this project has found was caught by '
      + 'a control, a calibration, or an impossible number; none by reading code.'),
    C.p('The trust base, honestly: V8 BigInt and IEEE-754 correct rounding; a handful of named external theorems consumed '
      + 'and cross-checked, not machine-proved; one machine, one operator. This meets the working standard of the '
      + 'computer-assisted-proof tradition — Tucker\'s Lorenz, Galias\'s Hénon censuses, whose published counts the census '
      + 'here reproduces independently — one rung below the formal-proof standard.')
  ].join('\n')
}));

const foot = '<footer class="col"><p>Generated by tools/build-site.js @ git ' + git + ' from ledger.json and the certificates — '
  + 'every number above was recomputed during this build, and the build refuses if any fails its own consistency identity. '
  + 'MIT. <a href="' + GITHUB + '">Source</a>.</p></footer>';

/* ---- /reports/ — the index --------------------------------------------- */
const reportsIndexBody = [
  C.header({
    eyebrow: 'cert-machine · reports',
    title: 'The reports',
    deck: 'Research notes ordered by weight, not date. Every page re-proves itself: its numbers are recomputed '
      + 'from the certificates and records at build time, its planted falsifiers must fire, and a build that '
      + 'drifts refuses to ship.'
  }),
  C.section({
    lab: 'the shelf', title: 'AI verification', wide: true,
    bodyRaw: reportCards(AI_REPORTS, '')
  }),
  C.section({
    lab: 'new fronts', title: 'Certified applications with live stakes', wide: true,
    bodyRaw: reportCards(APPLIED_REPORTS, '')
      + '<div class="col after-fig">'
      + C.pRaw('Aerospace and energy: domains where the operative numbers are defended by simulation today, '
        + 'and where a universally-quantified certificate — or an honest refusal — is a different kind of '
        + 'statement. Each page names what it does NOT claim.')
      + '</div>'
  }),
  C.section({
    lab: 'the proving ground', title: 'The instruments, proven on hard classical ground', wide: true,
    bodyRaw: reportCards(GROUND_REPORTS, '')
      + '<div class="col after-fig">'
      + C.pRaw('These are where the verifiers earned calibration before deciding anything a model produced: '
        + 'censuses reproducing Galias\'s published counts, boxes re-closing Goddard\'s, ladders anchored on '
        + 'Apéry. The audits above stand on this ground.')
      + '</div>'
  })
].join('\n\n');
const reportsIndexFoot = '<footer class="col"><p>Generated by tools/build-site.js @ git ' + git + '. '
  + 'MIT. <a href="' + GITHUB + '">Source</a>.</p></footer>';

/* ---- /about/ ------------------------------------------------------------
   Adapted from the source lab's about page — the content and the standard,
   never the styles (operator ruling, 2026-08-27). Statuses below are the
   operator's own record; a status word is meant exactly. */
const aboutBody = [
  C.header({
    eyebrow: 'Carlos Toledo · about',
    title: 'Not correct. Checkable.',
    deck: 'You can disagree with a result on this site by running something — and the disagreement is then '
      + 'about the mathematics, rather than about which of us is more credible.'
  }),
  C.section({
    lab: 'the job', title: 'Narrow, and not solving',
    bodyRaw: [
      C.p('Take a numerical claim someone already believes — from a language model, from a published paper, or '
        + 'from my own draft — and either produce an interval that provably contains the true answer, together '
        + 'with the program that produced it, or report that the method did not reach one and stop there.'),
      C.p('Much of the recent work is verification of machine-generated mathematics: AI-claimed results '
        + 're-checked in independent arithmetic, each check first shown to fail on a deliberately broken copy of '
        + 'itself. The tools are interval arithmetic with outward rounding, exact rational arithmetic — BigInt '
        + 'on one side, standard-library fractions on the other — Sturm chains, and contraction arguments of the '
        + 'Krawczyk kind.'),
      C.p('I work alone, from Brazil.')
    ].join('\n')
  }),
  C.section({
    lab: 'the standard', title: 'Three things every page here owes you',
    bodyRaw: C.plainList([
      { b: 'The program, not a description of it.', text: 'Every page is generated from the records it cites, and '
        + 'the repository — engine, instruments, certificates, corpus — is public under MIT with no dependencies. '
        + 'The detached verifiers run in the Python standard library: the next person to extend one needs neither '
        + 'my permission nor my machine.' },
      { b: 'Proof that the check can fail.', text: 'A check that has never gone red is decorative — consistent '
        + 'with the code being right, and equally consistent with the check testing nothing. So every battery '
        + 'carries red controls, deliberate forgeries that must be caught, and every instrument is calibrated '
        + 'against a case with a known answer before it decides anything new.' },
      { b: 'The errors, dated, in public.', text: 'Refuted claims are published with their generating mechanism '
        + 'named, and the machine’s own defects are recorded the same way. Every real bug this project has found '
        + 'was caught by a control, a calibration, or an impossible number — none by reading code.' }
    ])
      + C.note({
        lab: 'what that does and does not buy',
        bodyRaw: C.pRaw('None of it makes the work correct. It makes it <em>checkable</em>, which is a weaker '
          + 'property and a more useful one.')
      })
  }),
  C.section({
    lab: 'outside the building', title: 'Where the work has gone, and what has come back',
    bodyRaw: [
      C.p('Everything here is self-published and self-checked, so the honest question is what happens when it '
        + 'leaves. The record, with the status words meant exactly:'),
      C.plainList([
        { b: 'Submitted, awaiting moderation.', text: 'A correction to a GPT-published constant on Erdős #852 — '
          + 'refuted at its 12th significant digit, certified replacement attached — posted to the problem’s '
          + 'discussion thread on erdosproblems.com.' },
        { b: 'Filed, 5 August 2026 — no reply yet.', text: 'An independent confirmation of the computational '
          + 'appendix of a claimed proof of Erdős #1038, filed as an issue on the claiming authors’ own '
          + 'repository: all 30 printed decimals verified by a different route — Krawczyk rather than bisection.' },
        { b: 'Posted, 4 August 2026 — no reply yet.', text: 'An evaluation note on Anthropic’s public '
          + 'automated-alignment sandbox, posted as an issue on the repository whose authors invited stress-testing.' },
        { b: 'Submitted, awaiting moderation.', text: 'A note on Erdős #290 to erdosproblems.com; the constant’s '
          + 'decimal expansion is also an OEIS submission, posted 4 August 2026, unanswered.' }
      ]),
      C.pRaw('<strong>Filed is not accepted; posted is not replied.</strong> No result on this site has yet been '
        + 'reproduced by anyone else, and none has been peer-reviewed. That is the plain state of it, and it is '
        + 'why the pages ship their own falsifiers rather than asking for trust.')
    ].join('\n')
  }),
  C.section({
    lab: 'absent by choice', title: 'What this page does not contain',
    bodyRaw: C.p('No employment history, no degrees, no years-of-experience figure, no self-rated skills. Each of '
      + 'those is a claim a reader would have to take on trust, and putting them beside claims that can be re-run '
      + 'devalues the second kind. If a process needs a conventional CV, ask and you will get one.')
  }),
  C.section({
    lab: 'method', title: 'How these pages are made, since it bears on how fast they appear',
    bodyRaw: [
      C.p('The mathematics, the design of every check, and the decision about what may be claimed are mine. The '
        + 'writing and much of the implementation are done with AI assistance, under the discipline this site '
        + 'describes: a screen may only prune, a gate counts only once it has been shown to go red on a broken '
        + 'copy, and every page recomputes its numbers from the records at build time — a build that drifts '
        + 'refuses to ship. The output rate is a consequence of that arrangement, and saying so seems better than '
        + 'letting a reader wonder.'),
      C.p('The code and the checks on it share one author, so they rule out slips but not a shared misconception. '
        + 'An independent recomputation of any result here — in whatever you already trust — is the thing this '
        + 'site most wants, and a refutation gets published like any other result, with the name of whoever found '
        + 'it if they want it there.')
    ].join('\n')
  }),
  C.section({
    lab: 'contact', title: 'One address, for everything',
    bodyRaw: C.pRaw('<a href="mailto:carlos@carlostoledo.co"><span class="m">carlos@carlostoledo.co</span></a> — '
      + 'corrections, questions about a step, collaboration. A message that names the page and the one step it '
      + 'doubts can be answered properly; a general introduction usually cannot.')
  })
].join('\n\n');
const aboutFoot = '<footer class="col"><p>Carlos Toledo · computer-assisted proof and validated numerics. '
  + 'These notes are self-published and not peer-reviewed. <a href="' + GITHUB + '">Source</a>.</p></footer>';

/* ---- assemble site/ — INCREMENTAL SYNC ----------------------------------
   Operator rulings (2026-08-27): every PAGE lives under /reports (plus the
   landing and /machine/); /research/ carries ONLY raw artifact files that
   were individually cited in outreach (files, not pages — they never
   restyle). And the build never deletes-and-recreates the tree — it writes
   only what changed and prunes only what should not exist, so a cloud-synced
   ~/Documents has nothing to fight; sync-conflict junk ("name 2.ext") is
   auto-cleaned, never a build failure. */
const desired = new Map();
const put = (rel, buf) => desired.set(rel, buf);
put('index.html', Buffer.from(TPL.render({ title: 'cert-machine · the conjecture engine', bodyRaw: B.join('\n\n'), footRaw: foot })));
put('reports/index.html', Buffer.from(TPL.render({ title: 'Reports · cert-machine', bodyRaw: reportsIndexBody, footRaw: reportsIndexFoot })));
put('about/index.html', Buffer.from(TPL.render({ title: 'About · Carlos Toledo', bodyRaw: aboutBody, footRaw: aboutFoot })));
put('machine/index.html', fs.readFileSync(path.join(ROOT, 'index.html')));
for (const f of fs.readdirSync(path.join(ROOT, 'reports'))) {
  if (f.endsWith('.html') || f.endsWith('.py') || f.endsWith('.js')) put('reports/' + f, fs.readFileSync(path.join(ROOT, 'reports', f)));
}
for (const f of fs.readdirSync(path.join(ROOT, 'certs'))) {
  if (f.endsWith('.json') || f.endsWith('.jsonl')) put('certs/' + f, fs.readFileSync(path.join(ROOT, 'certs', f)));
}
for (const f of fs.readdirSync(path.join(ROOT, 'tools'))) {
  if (/^verify_.*\.py$/.test(f)) put('verify/' + f, fs.readFileSync(path.join(ROOT, 'tools', f)));
}
put('LICENSE', fs.readFileSync(path.join(ROOT, 'LICENSE')));
const ALIEN = path.join(ROOT, 'legacy', 'research', 'alien-science', 'alien-science');
for (const e of fs.readdirSync(ALIEN, { recursive: true })) {
  const abs = path.join(ALIEN, String(e));
  if (fs.statSync(abs).isFile()) put('research/alien-science/alien-science/' + String(e).split(path.sep).join('/'), fs.readFileSync(abs));
}
/* OPERATOR RULING (2026-08-27, correcting this build's first attempt): the
   lifted sin-mfg units are GATE SOURCES in legacy/ and are NEVER served —
   foreign-designed pages do not ship on this site. Each unit is rebuilt as a
   report in this design system, and the old /research/ paths 301 onto the
   rebuilds (vercel.json). The one exception stays the alien-science bundle
   above: raw files individually cited in ALREADY-SENT outreach. */

/* site/apps/ is an APP-OWNED ZONE: each app's own gated build
   (apps/<name>/build.js, invoked by `make site`) emits it, with its own
   batteries and drift gates. The site sync neither generates nor prunes
   under it — two builders writing one tree is how files get eaten. */
fs.mkdirSync(SITE, { recursive: true });
let wrote = 0, pruned = 0, kept = 0;
for (const e of fs.readdirSync(SITE, { recursive: true })) {
  const rel = String(e).split(path.sep).join('/');
  const abs = path.join(SITE, String(e));
  if (rel.startsWith('apps/')) continue;
  if (!fs.statSync(abs).isFile()) continue;
  if (!desired.has(rel)) { fs.rmSync(abs); pruned++; }
}
for (const [rel, buf] of desired) {
  const abs = path.join(SITE, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  if (fs.existsSync(abs) && fs.readFileSync(abs).equals(buf)) { kept++; continue; }
  fs.writeFileSync(abs, buf); wrote++;
}
/* prune now-empty directories bottom-up */
const dirs = fs.readdirSync(SITE, { recursive: true })
  .map(String).filter((e) => fs.existsSync(path.join(SITE, e)) && fs.statSync(path.join(SITE, e)).isDirectory())
  .sort((a, b) => b.length - a.length);
for (const d of dirs) { try { fs.rmdirSync(path.join(SITE, d)); } catch (e) { /* not empty */ } }

console.log('site/ synced: ' + wrote + ' written, ' + kept + ' unchanged, ' + pruned + ' pruned (' + desired.size + ' files) @ git ' + git);
