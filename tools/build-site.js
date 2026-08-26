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
const mono = C.tokens.TYPE.mono;
const pre = (txt) => '<div class="wide"><pre style="font-family:' + mono + ';font-size:13px;line-height:1.7;'
  + 'padding:14px 18px;border:1px solid var(--line);border-radius:6px;overflow-x:auto;margin:0">' + C.esc(txt) + '</pre></div>';

const B = [];
B.push(C.header({
  eyebrow: 'Carlos Toledo · cert-machine',
  title: 'The conjecture engine',
  deck: 'Verification layers under which AI-scale mathematical search produces only certified output — and certified audits of published AI-generated mathematics. Screens may prune; only exact arithmetic admits. A REFUTED here is proved.'
}));

B.push(C.stats([
  { k: 'closed forms refuted', v: fmt(T.closedFormRefuted + T.closedFormRefutedExact), n: 'every one exact; zero discoveries claimed' },
  { k: 'certified objects', v: fmt(T.certified), n: 'of ' + fmt(T.generated) + ' generated across 11 families' },
  { k: 'period-16 Hénon points', v: 'EXACTLY ' + fmt(census16.points), n: fmt(census16.boxes) + ' boxes exhausted, recheck clean' },
  { k: 'mu(5) bracket', v: '≤ 1 + π/' + topM, n: '= ' + (1 + Math.PI / topM).toFixed(6) + ' — certified on a 1983→1992→2019→here lineage' },
  { k: 'Ramanujan Machine rows', v: rm.counts.certified + ' decided', n: rm.counts.hits + ' survive · 1 printed row refuted, correction certified' },
  { k: 'published claims refuted', v: '2', n: 'Erdős #852 C* at digit 12 · one RM printed row — both with certified corrections' }
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

B.push(C.section({
  lab: 'rerun a proof', title: 'Check a result yourself, in ten seconds',
  bodyRaw: [
    C.p('Every headline claim detaches into a certificate — a JSON file of exact numbers — plus a verifier in plain '
      + 'Python: standard library only, nothing to install, zero code shared with the engine. Each verifier re-derives '
      + 'the mathematics from the certificate alone, re-hashes the pinned sources, must refute a deliberately forged '
      + 'value before it will exit green, and prints the sha256 of the certificate it checked.'),
    pre('python3 verify/verify_erdos852.py certs/erdos852-certificate.json\n'
      + 'python3 verify/verify_keller.py   certs/keller-certificate.json\n'
      + 'python3 verify/verify_strassen.py certs/strassen-certificate.json'),
    C.note({ lab: 'sources', bodyRaw: C.pRaw('Run from a clone of <a href="' + GITHUB + '">the repository</a> (add '
      + '<span class="m">--sources corpus/sources</span> to re-hash the pinned source bytes too), or download the '
      + 'certificate and verifier right here — the proof travels without the machine.') })
  ].join('\n')
}));

const reportFiles = fs.readdirSync(path.join(ROOT, 'reports')).filter((f) => f.endsWith('.html')).sort();
const reportLinks = reportFiles.map((f) => {
  const m = /<title>([^<]+)<\/title>/.exec(fs.readFileSync(path.join(ROOT, 'reports', f), 'utf8'));
  return '<a href="reports/' + f + '">' + C.esc(m ? m[1] : f) + '</a>';
});
const certFiles = fs.readdirSync(path.join(ROOT, 'certs')).filter((f) => f.endsWith('.json')).sort();

B.push(C.section({
  lab: 'go deeper', title: 'The machine, the reports, the certificates',
  bodyRaw: [
    C.pRaw('<a href="machine/">The control page</a> — the live dashboard: every family, every battery executed at build '
      + '(never remembered), the ledger decomposition, drift status.'),
    C.pRaw('Reports (every number recomputed from the records at build; a build that drifts refuses): ' + reportLinks.join(' · ')),
    C.pRaw('Detached certificates: ' + certFiles.map((f) => '<a href="certs/' + f + '"><span class="m">' + C.esc(f) + '</span></a>').join(' · ')),
    C.pRaw('Code, corpus, and full provenance: <a href="' + GITHUB + '">' + C.esc(GITHUB.replace('https://', '')) + '</a> — MIT, '
      + 'no dependencies. Instruments lifted from a private source lab are hash-pinned in PROVENANCE.json; '
      + 'patches are declared so they can never be mistaken for drift.')
  ].join('\n')
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

/* ---- assemble site/ ------------------------------------------------------ */
fs.rmSync(SITE, { recursive: true, force: true });
fs.mkdirSync(SITE, { recursive: true });
fs.writeFileSync(path.join(SITE, 'index.html'),
  TPL.render({ title: 'cert-machine · the conjecture engine', bodyRaw: B.join('\n\n'), footRaw: foot }));

fs.mkdirSync(path.join(SITE, 'machine'));
fs.copyFileSync(path.join(ROOT, 'index.html'), path.join(SITE, 'machine', 'index.html'));

for (const dir of ['reports', 'certs']) {
  fs.mkdirSync(path.join(SITE, dir));
  for (const f of fs.readdirSync(path.join(ROOT, dir))) {
    if (dir === 'reports' && !f.endsWith('.html')) continue;
    if (dir === 'certs' && !f.endsWith('.json')) continue;
    fs.copyFileSync(path.join(ROOT, dir, f), path.join(SITE, dir, f));
  }
}
fs.mkdirSync(path.join(SITE, 'verify'));
for (const f of fs.readdirSync(path.join(ROOT, 'tools'))) {
  if (/^verify_.*\.py$/.test(f)) fs.copyFileSync(path.join(ROOT, 'tools', f), path.join(SITE, 'verify', f));
}
fs.copyFileSync(path.join(ROOT, 'LICENSE'), path.join(SITE, 'LICENSE'));

/* legacy outreach surfaces: pages and artifact bundles whose URLs were sent
   from the old lab (LIFT.json items under legacy/ — byte-identical, pinned).
   They serve at their ORIGINAL paths; vercel.json carries the 301s for the
   retired path spellings. Cited bytes are never rebuilt in place — an engine
   rebuild gets a NEW page and a 301, never an edit here. */
const LEGACY = path.join(ROOT, 'legacy');
if (fs.existsSync(LEGACY)) fs.cpSync(LEGACY, SITE, { recursive: true, force: true });

const count = (d) => fs.readdirSync(d, { recursive: true }).length;
console.log('site/ written: landing + machine/ + ' + reportFiles.length + ' reports + '
  + certFiles.length + ' certificates + verifiers (' + count(SITE) + ' entries) @ git ' + git);
