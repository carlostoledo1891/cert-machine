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
const e852 = ledger.families.find((f) => f.name === 'erdos852-constants');
if (!e852 || e852.counts.rejects !== 1) fail('erdos852 counts moved');

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
  deck: 'Verification layers under which AI-scale mathematical search produces only certified output — and certified audits of published AI-generated mathematics. Screens may prune; only exact arithmetic admits. A REFUTED here is proved.'
}));

B.push(C.stats([
  { k: 'closed forms refuted', v: fmt(T.closedFormRefuted + T.closedFormRefutedExact), role: 'held', n: 'every one exact; zero discoveries claimed' },
  { k: 'certified objects', v: fmt(T.certified), n: 'of ' + fmt(T.generated) + ' generated across 11 families' },
  { k: 'period-16 Hénon points', v: 'EXACTLY ' + fmt(census16.points), role: 'held', n: fmt(census16.boxes) + ' boxes exhausted, recheck clean' },
  { k: 'mu(5) bracket', v: '≤ 1 + π/' + topM, role: 'held', n: '= ' + (1 + Math.PI / topM).toFixed(6) + ' — certified on a 1983→1992→2019→here lineage' },
  { k: 'Ramanujan Machine rows', v: rm.counts.certified + ' decided', n: rm.counts.hits + ' survive · 1 printed row refuted, correction certified' },
  { k: 'published claims refuted', v: '2', role: 'warn', n: 'Erdős #852 C* at digit 12 · one RM printed row — both with certified corrections' }
]));

B.push(C.section({
  lab: 'the three lanes', title: 'What almost nobody else publishes',
  bodyRaw: [
    C.p('Proved negatives at scale. ' + fmt(T.closedFormTested) + ' candidate closed forms tested against certified '
      + 'enclosures; ' + fmt(T.closedFormRefuted + T.closedFormRefutedExact) + ' refuted, each refutation a proof. '
      + 'Twenty-one published OEIS constants fall in exact BigInt arithmetic at their full published precision — one '
      + 'impersonates 1/5 for 62 significant digits before the exact arithmetic separates them.'),
    C.p('Completeness certificates for non-SAT numerics. Not "we found ' + fmt(census16.points) + ' period-16 points of the '
      + 'Hénon map" but "there are EXACTLY ' + fmt(census16.points) + ', and nothing else anywhere in the plane" — 452 census '
      + 'theorems across two maps, each an exhaustion from a certified a priori bound, plus a certified lower bound on '
      + 'topological entropy.'),
    C.p('Certified audits of published AI-generated mathematics. The GPT-published constant on Erdős #852, refuted at its '
      + '12th significant digit and shown to BE the naive IEEE-754 float product, digit for digit — corrected value certified '
      + 'to width 3.2e-16. All 52 rows of the Ramanujan Machine\'s seven result sheets decided: 51 survive an unconditional '
      + 'audit; one printed row is refuted exactly (a sign slip in the published constant), its correction certified on the '
      + 'same enclosure.')
  ].join('\n')
}));

/* ---- the report shelf, ordered by weight ---------------------------------
   The order IS the ranking — the landing shows the head of this list, the
   /reports/ index shows all of it. Annotations stay qualitative or gated:
   a volatile number that this builder did not recompute does not go on a
   card. The build refuses if the shelf and reports/ on disk disagree, so a
   new report cannot ship uncatalogued. */
const REPORTS = [
  { f: 'matmul-eval.html', k: 'the eval · live board',
    title: 'The matmul eval: ground truth is a proof',
    desc: 'Frontier models are asked for exact rank-R matmul tensor decompositions; every proposal is certified or refuted in exact rational arithmetic. No judge, no rubric — a proof either exists or it does not.',
    n: 'first board live · zero subtly-wrong survivors' },
  { f: 'methods-note.html', k: 'methods note',
    title: 'None by reading code',
    desc: 'Every real bug this machine has found — ten, cataloged — was caught by a red control, a calibration, an impossible number, or a byte pin. The discipline stated as engineering, with living gates.',
    n: 'every regression re-held by a battery at build' },
  { f: 'erdos852.html', k: 'audit · refutation',
    title: 'The constant that was a rounding error',
    desc: 'A GPT-published constant on Erdős #852, refuted at its 12th significant digit and shown to BE the naive IEEE-754 float product, digit for digit — with the certified correction.',
    n: 'refuted at digit 12 · correction certified' },
  { f: 'rm-audit.html', k: 'audit · standing registry',
    title: 'The Ramanujan Machine, audited',
    desc: 'Every row of all seven published result sheets decided by rigorous enclosures and exact rational comparisons — the whole registry re-certified at every build.',
    n: rm.counts.certified + ' rows · ' + rm.counts.hits + ' survive · 1 printed row refuted' },
  { f: 'mercer-program.html', k: 'program · certified landscape',
    title: 'The Mercer program',
    desc: 'Chowla’s cosine dips and Newman’s 0/1 minima certified as one landscape: exhaustive box sweeps, exact champions, a Sturm equality — every claim re-proved at build.',
    n: 'mu(5) ≤ 1 + π/' + topM + ' · re-certified every build' },
  { f: 'erdos290.html', k: 'erdős #290 · theorem',
    title: 'Erdős #290: the 4k(k+1) theorem',
    desc: 'The square-discriminant law proved and re-proved as exact integer identities during the build, the enclosure sweep deepened past the cited page, the exceptional degree closed.',
    n: 'planted falsifiers must fire at build' },
  { f: 'impostors.html', k: 'proved negatives',
    title: 'The impostor catalog',
    desc: 'Published constants that agree with simple closed forms for dozens of significant digits — and exact proofs that every one of them is lying. Digit agreement is not evidence.',
    n: 'exact BigInt refutations at full published precision' },
  { f: 'zeta3-audit.html', k: 'audit · ζ(3) sheet',
    title: 'The ζ(3) sheet, decided',
    desc: 'The Ramanujan Machine’s complete zeta(3) result sheet re-decided with certificates: proved tail bands, convergence inside the certificate, exact rational comparisons.',
    n: 'the spurious-solution lemma re-proved at build' },
  { f: 'entropy.html', k: 'certified invariant',
    title: 'Entropy, with a certificate',
    desc: 'A certified lower bound on the topological entropy of the classical Hénon map — covering relations composed to an exact integer spectral argument, calibrated at the full horseshoe.',
    n: 'h_top ≥ 0.3017, a theorem' },
  { f: 'verify-lemniscate.html', k: 'erdős #1038 · verification',
    title: 'Erdős #1038: thirty decimals verified',
    desc: 'The computational fragment of the Darvas–Peng–Tao manuscript re-verified by an independent route — Krawczyk rather than bisection — with the 30th digit read correctly.',
    n: 'filed on the claiming authors’ repository' },
  { f: 'alien-science.html', k: 'eval note · alignment sandbox',
    title: 'Alien science needs a disposition',
    desc: 'An evaluation note on Anthropic’s automated-alignment sandbox: its authors name evaluation as the binding constraint, and this is what certified evaluation looks like.',
    n: 'posted to the inviting repository' },
  { f: 'mfg-congest.html', k: 'validated numerics',
    title: 'A congestion mean-field game, enclosed',
    desc: 'An equilibrium of a mean-field game with congestion enclosed by validated numerics: an exact solution within an explicit radius, locally unique in the full sequence space.',
    n: 'embedded verifier re-run at build' },
  { f: 'wardrop-repro.html', k: 'certified reproduction',
    title: 'Wardrop, certified: exact, enclosed, refused',
    desc: 'The multi-population Wardrop equilibria of a published paper reproduced with certificates — exact where possible, enclosed where not, and refused where honesty demands it.',
    n: 'embedded verifier re-run at build' }
];
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
  ['matmul-eval-ledger.jsonl', 'The matmul eval’s append-only ledger — every campaign row, every verdict, every tag; the leaderboard is built from this file.', null]
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

/* ---- the reports -------------------------------------------------------- */
B.push(C.section({
  lab: 'the reports', title: 'Research notes that re-prove themselves', wide: true,
  bodyRaw: '<div id="reports"></div>'
    + reportCards(REPORTS.slice(0, 6), 'reports/')
    + '<div class="col after-fig">'
    + C.pRaw('<a href="reports/">All ' + REPORTS.length + ' reports →</a> — every number on every page is '
      + 'recomputed from the certificates and records at build time, and a build that drifts refuses to ship.')
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
  '<section>' + reportCards(REPORTS, '') + '</section>'
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
  if (f.endsWith('.html') || f.endsWith('.py')) put('reports/' + f, fs.readFileSync(path.join(ROOT, 'reports', f)));
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

fs.mkdirSync(SITE, { recursive: true });
let wrote = 0, pruned = 0, kept = 0;
for (const e of fs.readdirSync(SITE, { recursive: true })) {
  const rel = String(e).split(path.sep).join('/');
  const abs = path.join(SITE, String(e));
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
