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
const G = require(path.join(ROOT, 'design', 'grammar.js'));
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
if (!rm || rm.counts.certified !== 52 || rm.counts.hits !== 51 || rm.counts.refuted !== 1) {
  fail('ramanujan-audit counts moved (' + JSON.stringify(rm && rm.counts) + ') — update the landing story deliberately, not silently');
}
/* the 52-row corpus = the 51 PRINTED sheet rows + our certified correction of
   the refuted one. Public counts use the printed rows only — counting the
   correction as a 52nd decided row (or its survival as a 51st) would inflate
   the audit by our own row. */
const rmPrinted = rm.counts.certified - 1, rmSurvive = rm.counts.hits - 1;
const e852 = ledger.families.find((f) => f.name === 'erdos852-constants');
if (!e852 || e852.counts.refuted !== 1) fail('erdos852 counts moved');

/* the AI-audit flagships and the eval, gated like everything else */
if (!ledger.conjectures.some((c) => c.family === 'strassen-audit' && c.key === 'mm|alphaevolve-48-4x4x4'))
  fail('the AlphaEvolve rank-48 row is missing from the ledger');
if (!ledger.conjectures.some((c) => c.family === 'strassen-audit' && c.key === 'mm|alphatensor-f2-4x4x4'))
  fail('the AlphaTensor rank-47 F2 row is missing from the ledger');
const evalRows = fs.readFileSync(path.join(ROOT, 'certs', 'matmul-eval-ledger.jsonl'), 'utf8')
  .trim().split('\n').map((l) => JSON.parse(l));
const gymCommits = fs.readFileSync(path.join(ROOT, 'certs', 'forecast-gym-ledger.jsonl'), 'utf8')
  .trim().split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l)).filter((r) => r.type === 'commit').length;
if (!gymCommits) fail('the forecast-gym ledger holds no commits — the gym card assumes a live board');
const evalReal = evalRows.filter((r) => r.model !== 'fake');
if (!evalReal.length) fail('the eval ledger holds no real-model rows — the landing story assumes a live board');
const evalCert = evalReal.filter((r) => r.outcome === 'certified').length;
/* the grader's refusal rate on submitted claims: a reply carrying no parseable
   proposal is OUR refusal; a model declining and a reply cut off by our own
   output cap are not, and are excluded from the denominator as well as the
   numerator. The full breakdown by kind is /reports/refusals.html. */
const l5audit = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'lambda5-audit.json'), 'utf8'));
const envsRec = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'envs-record.json'), 'utf8'));
/* the Hub environment's own run: policies and models on the same seeds. Read,
   never retyped — the reports row and the lead sentence below both quote it. */
const gymPilot = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'grader-pilot.json'), 'utf8'));
const gymHub = JSON.parse(fs.readFileSync(path.join(ROOT, 'environments', 'break_the_grader', '.prime', '.env-metadata.json'), 'utf8'));
const gymBy = (id) => gymPilot.models.find((m) => m.id === id);
const gymPol = (name) => gymPilot.baseline.find((b) => b.policy === name);
const sgn = (x) => (x >= 0 ? '+' : '\u2212') + Math.abs(x).toFixed(3);
const envsTol = envsRec.graders.find((g) => /absolute/.test(g.name));
const envsSound = envsRec.graders.find((g) => /enclosure/.test(g.name));
if (!envsTol || !envsSound || envsSound.falseAccept !== 0) fail('the envs record no longer shows a sound certificate grader — no card may quote it');
const claimsLedger = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'claims-ledger.json'), 'utf8'));
const outreach = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'outreach.json'), 'utf8'));
if (!outreach.rows.length) fail('the outreach record is empty — the about page would claim nothing has left the building');
for (const r of outreach.rows) if (!r.status || !r.sent || !outreach.statusWords[r.status])
  fail('an outreach row carries a status word that is not defined in the record: ' + r.id);
/* what came back leads; the rest newest first (55 rows by 2026-10-17 — record order had stopped meaning anything) */
const outreachCameBack = (r) => r.status === 'answered' || r.status === 'merged';
const byNewest = (a, b) => (a.sent < b.sent ? 1 : a.sent > b.sent ? -1 : 0);
const outreachBack = outreach.rows.filter(outreachCameBack).sort(byNewest);
const outreachRest = outreach.rows.filter((r) => !outreachCameBack(r)).sort(byNewest);
const outreachItem = (r) => ({
  b: r.status.charAt(0).toUpperCase() + r.status.slice(1) + ' — sent ' + longDate(r.sent) + '.',
  raw: C.esc(r.what) + ' <em>(' + (r.url ? '<a href="' + C.escAttr(r.url) + '">' + C.esc(r.where) + '</a>' : C.esc(r.where)) + ')</em>.'
    + (r.note ? ' ' + C.esc(r.note) : '')
});
if (claimsLedger.rows.filter((r) => r.origin === 'submitted').length !== claimsLedger.submitted)
  fail('the claims ledger submitted count disagrees with its rows');
if (l5audit.refuters !== 0) fail('the lambda(5) audit records refuters — no card may call the theorem audited');
const evalMalformed = evalReal.filter((r) => r.outcome === 'malformed').length;
const evalClaims = evalReal.filter((r) => ['certified', 'rejected', 'refuted', 'malformed'].includes(r.outcome)).length;
if (!evalClaims) fail('the eval ledger holds no submitted claims — the refusal rate would have no denominator');
const evalRefusalRate = (100 * evalMalformed / evalClaims).toFixed(0) + '%';
const evalRefuted = evalReal.filter((r) => r.outcome === 'refuted').length;

const census16 = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'census-high-periods.json'), 'utf8')).find((r) => r.p === 16);
if (!census16 || !census16.ok || !census16.recheck.ok || census16.points !== 1696) fail('the period-16 census record moved');

const mercer = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'mercer-mu5.json'), 'utf8'));
const rungs = Object.keys(mercer.rows).map(Number).sort((a, b) => a - b);
for (const m of rungs) if (mercer.rows[m].verdict !== 'CERTIFIED') fail('mercer rung m=' + m + ' is not CERTIFIED');
const topM = rungs[rungs.length - 1];

const lambdaRows = Object.keys(JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'lambda-table.json'), 'utf8')).rows).length;
const muRows = Object.keys(JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'mu-table.json'), 'utf8')).rows).length;
if (lambdaRows < 23 || muRows < 9) fail('mu/lambda tables thinner than recorded (' + lambdaRows + ', ' + muRows + ')');

/* How many fast matmul algorithms this machine re-decides is READ from the
   detached certificate. It was typed by hand in three places once and three
   different numbers shipped (nine, ten, eleven, for one file of ten entries);
   a count that can drift is a count this builder computes. */
const strassenAlgos = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'strassen-certificate.json'), 'utf8')).entries;
const bilinearEntries = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'bilinear-certificate.json'), 'utf8')).entries;
const bilinearN = bilinearEntries.length;
if (!Array.isArray(strassenAlgos) || !strassenAlgos.length) fail('the strassen certificate holds no entries');
const strassenN = strassenAlgos.length;
const kellerMaps = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'keller-certificate.json'), 'utf8')).entries;
if (!Array.isArray(kellerMaps) || !kellerMaps.length) fail('the keller certificate holds no entries');
const kellerN = kellerMaps.length;

const h852 = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'erdos852-h-records.json'), 'utf8'));
const h852Max = Math.max.apply(null, h852.records.map((r) => r.len));
if (!(h852Max > 30)) fail('the #852 record file no longer passes the last published term (A079007 ends at a run of 30)');

const aiClaims = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'ai-claims-summary.json'), 'utf8'));
if (!aiClaims.lanes || !aiClaims.checks) fail('the ai-claims summary is empty — run make reports first');

/* The #852 correction is PUBLIC in the erdosproblems.com thread. The evidence
   is the thread snapshot pinned beside the original page bytes, and both the
   status word and its date are read from that pin — never typed. If the pin
   goes, the status claim on /about/ goes with it and the build refuses. */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];
const longDate = (iso) => { const [y, mo, d] = iso.split('-').map(Number); return d + ' ' + MONTHS[mo - 1] + ' ' + y; };
const e852Public = (() => {
  const dir = path.join(ROOT, 'corpus', 'sources');
  const pins = JSON.parse(fs.readFileSync(path.join(dir, 'PINS.json'), 'utf8'));
  const hit = Object.keys(pins).map((k) => /^(erdos852_thread_correction-public_(\d{4}-\d{2}-\d{2})\.html)$/.exec(k)).find(Boolean);
  if (!hit) fail('/about/ states the Erdős #852 correction is public in the thread; the evidence for that status is the '
    + 'pinned snapshot corpus/sources/erdos852_thread_correction-public_<date>.html, and PINS.json does not hold it');
  if (!fs.existsSync(path.join(dir, hit[1]))) fail('the pinned #852 thread snapshot ' + hit[1] + ' is in PINS.json but absent from corpus/sources');
  return { file: hit[1], date: hit[2] };
})();

/* ---- the lead story, derived from the certificate ------------------------
   The landing OPENS with the Erdős #852 refutation told in plain words, so
   every number that story quotes is read out of the detached certificate here
   — including the DIGIT at which the published value goes wrong, which is
   computed from the two decimal strings rather than counted by a human once
   and then repeated. */
const e852cert = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'erdos852-certificate.json'), 'utf8'));
const csPub = e852cert.cstar.published.value;
const csLo = e852cert.cstar.enclosure.lo, csHi = e852cert.cstar.enclosure.hi;
if (e852cert.cstar.published.verdict !== 'REFUTED')
  fail('the landing story says the published C* is refuted; the certificate says ' + e852cert.cstar.published.verdict);
const frac = (s) => { const i = String(s).indexOf('.'); if (i < 0) fail('not a decimal: ' + s); return String(s).slice(i + 1); };
const firstDiff = (a, b) => { for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return i + 1; return 0; };
const csWrongAt = firstDiff(frac(csPub), frac(csLo));
if (!csWrongAt) fail('the published C* agrees with the certified enclosure on every printed digit — the landing story is not true');
const csPubDigits = frac(csPub).length;
/* how much of the correction is settled: the digits the enclosure's two edges share */
const csSettled = firstDiff(frac(csLo), frac(csHi)) - 1;
if (csSettled < csWrongAt) fail('the enclosure settles ' + csSettled + ' digits, fewer than the ' + csWrongAt + ' the published value gets wrong');

/* the two numbers, digit-aligned, with the divergence marked — the whole
   refutation in one glance, and the only place on this page a reader has to
   look at a decimal expansion. Column arithmetic, not a hand-placed caret.
   The gutter and the marker text are kept short on purpose: this block sets
   the width of a <pre> that must still fit a 390px phone without scrolling. */
const csDigitBlock = (() => {
  const w = 'certified'.length + 2;
  const pad = (s) => s + ' '.repeat(w - s.length);
  const col = w + 2 + csWrongAt - 1;
  return pad('published') + csPub + '\n'
    + pad('certified') + csLo + '…\n'
    + ' '.repeat(col) + '↑ wrong from here';
})();

/* the Keller lane's own objects: counterexamples this machine generated that
   no paper carries. Counted from the certificate, never typed. */
const kellerNew = kellerMaps.filter((e) => /generated\+certified here/.test(String(e.source))).length;

/* the two ported theorem programs, gated like everything else */
const emberT = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'ember-theorem.json'), 'utf8'));
/* the return-level table: the card states the ledger's numbers, and refuses when they move */
const hsv = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'hseva-ledger.json'), 'utf8'));
const hsvNative = hsv.findings.buoys.native.map((q) => q.best);
if (hsvNative.join() !== 'expweibull,lognormal,gengamma') fail('the return-levels card: the hourly winners moved (' + hsvNative.join() + ')');
const hsvGG = hsv.findings.buoys.gengamma;
if (!(hsvGG.edge === 8 && hsvGG.certified + hsvGG.edge + hsvGG.refused === 12)) fail('the return-levels card: the generalized-gamma count moved');
const hsvA = hsv.printed.rows.filter((r) => r.buoy === 'A');
const hsvLo = Math.min(...hsvA.map((r) => Number(r.rl100.lo))), hsvHi = Math.max(...hsvA.map((r) => Number(r.rl100.hi)));
if (!hsv.printed.rows.some((r) => r.id === 'c8' && r.buoy === 'C' && r.reproducesTz)) fail('the return-levels card: the period row is no longer decided');
let hsvCert = 0, hsvAll = 0, hsvDec = 0, hsvRk = 0;
for (const b of Object.values(hsv.buoys)) for (const blk of Object.values(b.blocks)) { for (const f of Object.values(blk.fits)) { hsvAll++; if (f.certified) hsvCert++; } hsvRk++; if (blk.rankings.ad.verdict === 'DECIDED') hsvDec++; }
const hsvPts = hsv.ww3 ? Object.keys(hsv.ww3.points).length : 0;
if (emberT.verdict !== 'VERIFIED') fail('the ember theorem record is not VERIFIED — the card claims a theorem');
const emberMu1 = emberT.mu1.map(Number);
if (!(emberMu1[0] > 12.02 && emberMu1[1] < 12.03)) fail('ember μ1 enclosure moved — update the card deliberately');
const terraBT = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'terra-bracket-table.json'), 'utf8'));
if (terraBT.verdict !== 'VERIFIED') fail('the terra bracket table is not VERIFIED — the card claims theorems');
if (!kellerNew) fail('the keller certificate holds no counterexample generated here — the landing card claims some');

/* the Erdős #1 ledger: the card quotes it, so it is gated here — every quoted
   number is a verified-on-this-machine instance below Bohman, exactly decided */
const erdos1 = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'erdos1-ledger.json'), 'utf8'));
if (!(Number(erdos1.best.ratio6) < 0.22002) || !(Number(erdos1.smallest.ratio6) < 0.22002)) fail('the erdos1 headline is not below Bohman');
if (!erdos1.counts.verifiedBelowBohman || erdos1.best.n < erdos1.smallest.n) fail('the erdos1 ledger is shapeless');

/* the delta3 ledger: the card claims a verified theorem, so the ledger must say so */
const d3 = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'delta3-ledger.json'), 'utf8'));
if (!d3.theorem || d3.theorem.verdict !== 'VERIFIED' || d3.theorem.delta3LowerBound !== '117/2192' || !d3.cover.complete) fail('the delta3 ledger does not verify the theorem the card claims');
if (d3.certificates.some((c) => c.verdict !== 'VERIFIED')) fail('a delta3 certificate is not VERIFIED');

/* the zeta7-anand audit: the card quotes the recomputed outer integral and the two margins */
const z7 = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'zeta7-anand-audit.json'), 'utf8'));
if (z7.verdict !== 'REFUTED') fail('the zeta7-anand audit no longer refutes the proof route the card describes');
const z7r2 = z7.margins.scenarios.find((s) => s.key === 'R2|printed|printed');
if (!z7r2 || z7r2.negative118 !== false) fail('the zeta7-anand record lacks the decided R2 scenario the card quotes');

/* the zeta-hankel ledger: the card quotes its four margins and its agreement count */
const zh = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'zeta-hankel-ledger.json'), 'utf8'));
if (zh.verdict !== 'AGREE') fail('the zeta-hankel ledger does not agree with the bench');
const zhs = (v) => (v > 0 ? '+' : '−') + Math.abs(v).toFixed(2);

/* ---- the report shelf, ordered by weight ---------------------------------
   The order IS the ranking — the landing shows the head of this list, the
   /reports/ index shows all of it. Annotations stay qualitative or gated:
   a volatile number that this builder did not recompute does not go on a
   card. The build refuses if the shelf and reports/ on disk disagree, so a
   new report cannot ship uncatalogued.

   ARRAY ORDER is the ranking (the landing shows its head); the `g` field is
   the LANE a card sits in on /reports/, and the two are independent — the
   Erdős lane's flagship is ranked into the head of the shelf and therefore
   sits inside the ai block below. Lanes are drawn with filter(), which
   preserves this order, so a lane is always ranked like the shelf. */
/* PU Verificado (2026-10-16): the shelf card reads the ledger the page reads */
const PU = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'pu-ledger.json'), 'utf8'));
const REPORTS = [
  /* group 'ai': the AI-verification shelf — the audience-facing work */
  { g: 'ai', f: 'matmul-eval.html', k: 'the eval · live board',
    title: 'The matmul eval: ground truth is a proof',
    desc: 'Frontier models are asked for exact rank-R matmul tensor decompositions; every proposal is certified or refuted in exact rational arithmetic. No judge, no rubric, no answer key to contaminate — a proof either exists or it does not.',
    n: fmt(evalReal.length) + ' proposals graded · zero subtly-wrong survivors' },
  { g: 'ai', f: 'alphaevolve.html', k: 'audit · AI-discovered algorithms',
    title: 'The AI-discovered algorithms, certified',
    desc: 'AlphaEvolve’s rank-48 ⟨4,4,4⟩ certified over Z[i]; AlphaTensor’s rank-47 verified over F2 and REFUTED over Q — the speedup provably requires characteristic 2. Both decided from commit-pinned bytes at every build.',
    n: strassenN + ' algorithms re-decided each build' },
  { g: 'erdos', f: 'delta3.html', k: 'erdős #1186, k = 3 · a theorem',
    title: 'Graham’s $100 question: the twelve blocks are optimal',
    desc: 'How few monochromatic progressions a, a+d, a+2d can a red–blue colouring of 1, …, n have? Since 2008 the answer was known to lie between 0.05112·n² and 0.05338·n², the upper end a colouring in twelve blocks conjectured optimal. It is: δ₃ = 117/2192. Two pages of mathematics and five exact certificates, made in a sandbox and re-decided here by a second verifier that shares no code with the first. Not refereed, not formalised; k ≥ 4 untouched.',
    n: d3.certificates.length + ' certificates verified twice · smallest margin ' + Number(d3.certificates.filter((c) => c.kind === 'slab').reduce((m, c) => Math.min(m, Number(c.boundDecimal)), 1)).toExponential(2) + ' · ' + d3.cover.intervals.length + ' regions cover [0, ½]' },
  { g: 'erdos', f: 'erdos1.html', k: 'erdős #1 · the disproof made effective',
    title: 'The swarm proved the set exists. Here is the set.',
    desc: 'GPT-6 Astra disproved Erdős’s first problem in Lean — for every ε there are sum-distinct sets with N ≤ ε·2^n — but the proof is ineffective at one step and no set below Bohman’s 1998 record was known. That step made explicit (a Hermite basis, a chain perturbation, one computed buffer), the sets shipped with certificates, every one re-decided here in exact arithmetic; the base gadget shown not special, and the first explicit Siegel-lemma bounds above Bohman’s.',
    n: fmt(erdos1.smallest.n) + ' integers at N/2^n = ' + erdos1.smallest.ratio6 + ' · ' + fmt(erdos1.best.n) + ' at ' + erdos1.best.ratio6 + ', ' + erdos1.best.percentBelowBohman + '% below Bohman' },
  { g: 'erdos', f: 'erdos1038-inf.html', k: 'erdős #1038 · the infimum, bracketed',
    title: 'A certified bracket for the Erdős–Herzog–Piranian infimum',
    desc: 'How small can the set where a monic polynomial stays below 1 be? The infimum is bracketed here in certified interval arithmetic, both ends unconditional — the lower end by a forcing argument needing no tail estimate and no assumed minimizer — and Tao’s model Problem 4.1 is answered affirmatively for every ε. Three AI-assisted proofs of the exact value are currently claimed and none independently examined, so nothing here assumes any of them.',
    n: '1.828 ≤ inf ≤ 1.83443 · both ends certified here' },
  { g: 'ai', f: 'time-horizon.html', k: 'audit \u00b7 the time horizon',
    title: 'METR\u2019s time horizon, certified to the last bit',
    desc: 'The headline number of frontier-AI forecasting \u2014 the length of task a model completes half the time \u2014 is a logistic fit read at one half. Here every such fit on METR\u2019s own Time Horizon 1.1 evidence is proved to hold exactly one optimum in a box narrower than a trillionth, the horizon is an enclosure over that box, METR\u2019s printed coefficients are its rounding for 22 of 23 models, its point estimates sit within a solver\u2019s tolerance of it, and the post-2023 doubling time re-derives as 128.74 days to the printed digit. The instrument built to decide a time horizon on tasks with no judge in the loop, calibrated on the one that exists.' },
  { g: 'ai', f: 'gsm8k-audit.html', k: 'audit \u00b7 the answer key',
    title: 'GSM8K\u2019s answer key, re-decided to the last step',
    desc: 'The grade-school math benchmark every harness scores against a stored answer line: all 4,282 calculator annotations of the test set and 23,716 of the train set evaluated exactly from the expression they print, every readable prose equation with them, each item classed by whether its own arithmetic reaches its own answer, and the whole read against GSM8K-Platinum\u2019s human revision. The arithmetic is clean where the humans looked and slips where no model disagreed; the ten relabelled answers are readings, not sums.' },
  { g: 'ai', f: 'easota.html', k: 'audit · the SOTA table',
    title: 'Their table, re-decided to the last digit',
    desc: 'Together AI’s repository claims a new state of the art over AlphaEvolve on thirteen problems, each checked by the platform’s own float verifier with tolerances. Twenty published constructions re-decided here in exact and certified-interval arithmetic from their own bytes: sixteen exact witnesses, four witnesses only within tolerance and repaired, every improvement real, one printed digit that is the tolerance’s, and a grid maximum replaced by a certified supremum.',
    n: '20 constructions · 16 witnessed · 4 repaired · 8 of 8 improvements real' },
  { g: 'ai', f: 'navier-stokes.html', k: 'audit · the Millennium claim',
    title: 'Their theorem, read to the last hypothesis',
    desc: 'OpenAI’s 2026-09-08 proof that a smooth force drives a viscous fluid from rest to infinite speed in finite time — Clay’s breakdown alternatives (C) and (D) — audited without trust and without the priority dispute: the formal statement read against Clay’s wording and Mathlib’s definitions hypothesis by hypothesis, the Lean proof built on a laptop and its axioms asked of the kernel, the paper mapped onto the certificate, the writeup dissected by six readers, every printed identity re-run.',
    n: 'statement faithful · built here · one clause of Theorem 1.1 not formal' },
  { g: 'ai', f: 'kissing.html', k: 'audit · the AI-held record',
    title: 'The kissing ledger: dimension eleven, decided',
    desc: 'K(11)’s record moved three times in eighteen months — every mover an AI, each validated by its producer’s own verifier. The whole ladder (AlphaEvolve 593, EinsteinArena 594, the Station’s three exact 604s, and EinsteinArena’s headline 604 — NEEDS DATA until its coordinates were published on request, four days after the ledger asked) re-decided here in exact Z[√2] arithmetic from published bytes — and the two platforms’ 604s decided congruent, with a certificate. Since 2026-10-05 also the September wave in dimensions 18 and 25–31: every pair of every published configuration decided exactly.',
    n: 'two platforms’ 604s: one configuration, with a certificate' },
  /* lane 'erdos', ranked here: the theorem and the refutation head the shelf */
  { g: 'erdos', f: 'lambda5.html', k: 'erdős #510 · a theorem',
    title: 'λ(5), settled — and the sequence turns down',
    desc: 'The fourth exact value of Chowla\'s cosine dip, and the first whose optimiser is not an initial '
      + 'segment: λ(5) = −L(1,2,4,5,6), an algebraic number of degree exactly five, with its minimal polynomial '
      + 'exhibited. One family in the reduction admits no classical weight at all — a structural obstruction the '
      + 'page proves fresh at every build — and a Fejér–Riesz comb gets through it. A consequence needs nothing '
      + 'further: λ(6) < λ(5), so the sequence that had been climbing turns down.',
    n: 'theorem audited over ' + fmt(l5audit.setsWalked) + ' sets, 0 refuters · the closure trees not yet · not peer-reviewed' },
  { g: 'erdos', f: 'lambda4.html', k: 'erdős #510 · a theorem',
    title: 'λ(4), settled',
    desc: 'The third exact value of Chowla\'s cosine dip. Mercer proved λ(2) and λ(3) in 2019, conjectured λ(4), '
      + 'wrote that he did not know how to evaluate it, and left a strategy. The machine executed the strategy and '
      + 'finished it: all nine remaining families closed, thresholds derived rather than transcribed, every finite '
      + 'remainder decided in exact arithmetic. λ(4) = −L(1,2,3,4), the root of 512y³ − 1227y² + 600y + 125 near '
      + '1.51956 — machine-derived, re-proved at every build, and stated with its verification status beside it.',
    n: 'not peer-reviewed · the full record re-derives at build' },
  /* lane 'ground', ranked here: the two ported theorem programs */
  { g: 'ground', f: 'ember.html', k: 'certified theorem · hot spots',
    title: 'The hot spot stays on the boundary',
    desc: 'Not one domain but a continuum: for every c in [0.845, 0.85] the convex trapezoid A(0,0) B(1,0) C(c,9/10) D(1/4,9/10) has a simple second Neumann eigenvalue whose eigenfunction attains its extrema on the boundary only — to our knowledge the first certified hot-spots result for a positive-measure FAMILY, with the original specimen c = 17/20 as its right endpoint. The second Neumann eigenfunction of a convex trapezoid with no symmetry axis — to our knowledge the '
      + 'first certified hot-spots domain outside every analytically proven class (all triangles took Judge–Mondal '
      + 'an Annals paper; lip domains, L-tiled polygons and symmetric quadrangles are the other proven classes, '
      + 'while in high dimension convex sets can FAIL the conjecture, making the planar convex case the live one) '
      + '— attains its maximum and minimum on the boundary only. Corollary: the hot spot is AT vertex A, and only '
      + 'there. Eight machine-checked records, a cell partition decided in exact rationals, corner coefficients '
      + 'certified at two independent annuli, and red controls that fire. One domain, one theorem, one corollary; '
      + 'the quadrilateral conjecture itself stays open.',
    n: 'μ₁ ∈ [' + emberMu1[0].toFixed(7) + ', ' + (Math.ceil(emberMu1[1] * 1e7) / 1e7).toFixed(7) + '], simple · the chain re-runs in ~2 min' },
  { g: 'ground', f: 'terra.html', k: 'certified theorems · MFG splitting',
    title: 'The crowd splits — MFG beyond the uniqueness wall',
    desc: 'A congestion-averse crowd in a single-well cost landscape provably settles into TWO density peaks — or '
      + 'THREE. To our knowledge the first validated-numerics equilibrium enclosures for a mean-field game, and '
      + 'the first whose certified peak count strictly exceeds the potential\'s wells. Two computer-assisted '
      + 'theorems and a bracket table of certified instances whose enclosure balls fix the exact peak count of the '
      + 'exact solution; the discount-free crossover σ* = 1/(8π²) decided in exact rationals; certified '
      + 'multiplicity where uniqueness theory is silent; an EXACTLY-3 census; the 21,567-cell regime map.',
    n: 'two theorems + a bracket table · honest counting, every bound displayed' },
  { g: 'erdos', f: 'erdos1038-sup.html', k: 'erdős #1038 · the supremum side',
    title: 'How shallow can a lemniscate stay?',
    desc: 'Tao reformulated Erdős #1038 over discrete measures and conjectured the supremum of |{U<0}| is 2√2 — '
      + '"this may be hard to prove completely." For rational weights it is a per-degree polynomial question, and '
      + 'the machine decided the first seven degrees: odd degrees fall strictly below 2.82 < 2√2 (branch-and-bound '
      + 'certificates, 127 boxes for the cubic); even degrees localize the supremum to [2√2, 2.82845] with the '
      + 'two-atom witness within 2.3×10⁻⁵ of optimal. Plus the certified landscape: an interior cubic champion and '
      + 'a quintic cliff where the sublevel set changes topology.',
    n: 'per-degree theorems · the conjecture itself stays open · not peer-reviewed' },
  { g: 'erdos', f: 'erdos852.html', k: 'erdős #852 · refutation',
    title: 'The constant that was a rounding error',
    desc: 'A GPT-published constant on Erdős #852, refuted at its 12th significant digit and shown to BE the naive IEEE-754 float product, digit for digit — with the certified correction, and the failure taxonomy for eval builders.',
    n: 'refuted at digit 12 · correction certified' },
  { g: 'ai', f: 'verifier-loop.html', k: 'verified reward · demo',
    title: 'The verifier in the loop',
    desc: 'The reward channel in closed loop: a model proposes, the grader answers every failure with its own refutation mechanism — the exact violated equation, nothing more — and the model retries. Every trajectory rendered from the append-only ledger.',
    n: 'feedback template-locked · zero coaching' },
  { g: 'ai', f: 'forecast-gym.html', k: 'the eval · forecasting',
    title: 'The Forecast Gym: the test set that cannot leak',
    desc: 'Forecasts are sha-committed to an append-only ledger before their outcomes exist and scored afterward with a proper score in exact rationals — contamination impossible by construction, hedging and overconfidence both priced, admission prune-only with an exact binomial certificate.',
    n: fmt(gymCommits) + ' forecasts sha-pinned before their targets' },
  { g: 'ai', f: 'answer-key.html', k: 'note · for eval builders',
    title: 'When the answer key is wrong',
    desc: 'Three certified specimens of mathematical answer keys failing in ways reruns and digit cross-checks provably cannot catch — and the working design that removes the answer key altogether.',
    n: 'every specimen re-proved at build' },
  { g: 'ai', f: 'gym.html', k: 'an environment · published, and installable',
    title: 'Break the grader, or prove it cannot be broken',
    desc: 'A reinforcement-learning environment whose adversarial examples are GENERATED from certified '
      + 'enclosures rather than authored: every negative carries a proof, the set is infinite because the '
      + 'parameter space is continuous, and difficulty is one number with a closed form — the band a tolerance '
      + 'grader leaves open, which vanishes exactly when the tolerance drops under half the certificate width. '
      + 'It is on the Environments Hub as ' + gymHub.owner + '/' + gymHub.name + ', which makes it the one thing '
      + 'here a stranger can check in a single command instead of by reading. On the same ' + gymPilot.meta.n
      + ' tasks it separates three frontier models — ' + sgn(gymBy('claude-opus-5').mean) + ', '
      + sgn(gymBy('claude-sonnet-5').mean) + ', ' + sgn(gymBy('claude-haiku-4-5').mean)
      + ' — and the smallest scores below a one-line blind policy at ' + sgn(gymPol('always').mean)
      + ', because the blind policy makes no false claims and that model makes '
      + gymBy('claude-haiku-4-5').false_claims + '.',
    n: 'v' + gymHub.version + ' on the Hub · ' + gymPilot.meta.calls + ' model calls, $'
      + gymPilot.meta.spent.toFixed(2) + ' · the reference table needs no key' },
  { g: 'ai', f: 'mathbench.html', k: 'benchmark · pre-registered',
    title: 'Certified MathBench v0',
    desc: 'Three Claude models asked, once each, for 46 constructions in seven families — rulers, caps, codes, graphs, laws, sphere packings, bilinear '
      + 'algorithms — every answer decided exactly, no answer key and no judge, under a pre-registered ceiling.',
    n: (() => { const rows = fs.readFileSync(path.join(ROOT, 'certs', 'mathbench-ledger.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l)).filter((r) => r.tag === 'v0');
      const last = new Map(); for (const r of rows) last.set(r.model + '|' + r.family + '|' + r.target, r);
      const c = (m) => [...last.values()].filter((r) => r.model === m && r.outcome === 'certified').length;
      const usd = rows.reduce((a, r) => a + ((r.usage && r.usage.usd) || 0), 0);
      return 'certified: Haiku ' + c('claude-haiku-4-5-20251001') + ', Sonnet ' + c('claude-sonnet-5') + ', Opus ' + c('claude-opus-5') + ' of 46 · US$' + usd.toFixed(2); })() },
  { g: 'ai', f: 'polymaps.html', k: 'decided · polynomial maps',
    title: 'Gao\'s Keller maps and a Markus–Yamabe field, decided',
    desc: 'Five new counterexamples to the Jacobian conjecture written with Claude Fable 5\'s help, and a field on ℝ¹⁴ with every Jacobian eigenvalue −1 '
      + 'and three zeros: decided in exact rational arithmetic from the TeX the papers print, the largest map rebuilt from its construction.',
    n: (() => { const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'polymaps-ledger.json'), 'utf8')), c = (v) => L.rows.filter((r) => r.verdict === v).length;
      return L.rows.length + ' maps decided · ' + c('CERTIFIED') + ' whole, ' + c('PARTIAL') + ' partly, ' + c('REFUTED') + ' refuted'; })() },
  { g: 'ai', f: 'diagonal-ramsey.html', k: 'decided · diagonal Ramsey numbers',
    title: 'Diagonal Ramsey below 3.7992: 3.7823, then 3.7721',
    desc: 'Gupta, Ndiaye, Norin and Wei print one more round of their optimisation, proposed by ChatGPT 5.6 Sol, as preliminary and unverified. '
      + 'Decided on their own Theorem 14 by two independent programs: it holds (3.7823). Five further rounds, each in the region the last establishes, '
      + 'reach R(k, k) ≤ 3.7721^(k+o(k)).',
    n: (() => { const K = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'gnnw-chain-certificate.json'), 'utf8'));
      if (K.decided.verdict !== 'CERTIFIED' || !K.second.agrees) fail('the Ramsey card would say certified by both programs while the chain certificate says otherwise');
      return 'CERTIFIED · two programs · c = ' + K.decided.c[0].slice(0, 12) + '… after ' + K.decided.bases.length + ' rounds · one-file verifier'; })() },
  { g: 'ai', f: 'horizonmath.html', k: 'audit · a benchmark\'s discoveries',
    title: 'HorizonMath\'s discoveries, decided',
    desc: 'A benchmark of unsolved problems credits frontier models with six discoveries and prints three. The Kakeya area holds, exactly; the '
      + 'certificate for a better diagonal-Ramsey base does not satisfy the theorem it is applied to — its checker admits pairs the theorem\'s region '
      + 'cannot contain, and the certificate uses one where the constant is read.',
    n: (() => { const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'horizonmath-ledger.json'), 'utf8')), c = (v) => L.rows.filter((r) => r.verdict === v).length;
      return L.rows.length + ' credited results decided · ' + c('CERTIFIED') + ' certified, ' + c('REFUTED') + ' refuted, ' + c('NEEDS DATA') + ' needs data'; })() },
  { g: 'ai', f: 'openai-math.html', k: 'audit · OpenAI\'s math release',
    title: 'OpenAI\'s math release: what it claims beyond what it checks',
    desc: 'OpenAI\'s 719 machine-generated manuscripts and 416 Comparator challenges, audited three ways — a second kernel, every Lean statement read against its claim, every finite witness re-decided exactly — and the gaps between what is claimed and what is checked, ranked and pinned to file and line at the commit audited, found before any fix.',
    n: (() => { const G = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'openai-math', 'findings.json'), 'utf8')), S = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'openai-math-statements.json'), 'utf8'));
      return G.findings.length + ' gaps found ' + G.found + ' · ' + ((S.counts.words.DIFFERENT || 0) + (S.counts.words['NARROWER — UNDECLARED'] || 0)) + ' of ' + S.rows.length + ' formalized families short of their claim · nothing refuted'; })() },
  { g: 'ai', f: 'optconst-queue.html', k: 'audit · the constants registry\'s PR queue',
    title: 'Five pull requests to the constants registry, decided where decidable',
    desc: 'Tao\'s optimization-constants registry has fifteen open, mostly machine-assisted pull requests and no review since September. Five read from their submissions: two exact step functions tightening C₁a and C₁b, '
      + 'a two-law entropy certificate for C₃c, five one-line bounds, OpenAI\'s Borsuk counterexample, and a de Bruijn–Newman "certified record package" at 0.1595 whose scorer compares rationals and hashes while its analysis cites a bank outside the bundle — '
      + 'every finite object holds, the proofs read hold, the package is refused.',
    n: (() => { const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'optq-ledger.json'), 'utf8'));
      if (L.counts.REFUTED !== 0) fail('the PR-queue card would misstate the record');
      return L.counts.CERTIFIED + ' certified · ' + L.counts.REFUSED + ' refused · C₁a ≤ 1.5027435 · C₃c ≥ 1.674894 · Λ ≤ 0.1595 refused'; })() },
  { g: 'ai', f: 'wowii-counterexamples.html', k: 'audit · five Graffiti.pc conjectures',
    title: 'Written on the Wall II: five counterexamples, decided',
    desc: 'One account filed sixty Graffiti.pc conjectures with disproofs on formal-conjectures in a day. The five with explicit witness graphs — total domination in trees, 2-domination in bridged cliques — '
      + 'rebuilt from the author\'s own Lean tables and decided in exact arithmetic from the archive\'s definitions: all five refute their conjectures by the stated margins; two notes on the Lean statements; '
      + 'the cited fork commits vanished the same evening, the copies decided are pinned.',
    n: (() => { const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'wowii-ledger.json'), 'utf8'));
      if (L.counts.CERTIFIED !== 5) fail('the WOWII card would misstate the record');
      return '5 of 5 witnesses certified · trees of 25, 41, 150 vertices · clique graphs of 39 and 15'; })() },
  { g: 'ai', f: 'alphaproof-nexus.html', k: 'audit · a peer-reviewed release, replayed',
    title: 'AlphaProof Nexus: the proofs hold under two kernels; three OEIS conjectures were already proved, two statements are degenerate',
    desc: 'Google DeepMind’s AlphaProof Nexus (Science, October 2026) reports 9 of 353 open Erdős problems resolved and 44 OEIS conjectures proved, “correctly formalized and previously unproven”. '
      + 'Every published Erdős proof, and the corrected #741(i), checked by Comparator against formal-conjectures’ own statement and replayed through Lean’s kernel and nanoda: all hold. '
      + 'The nine are seven problems; 38 of the 44 OEIS proofs are published; three of those conjectures already had a proof on record, and two statements hold for a reason unrelated to their conjecture.',
    n: (() => { const K = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'apn-kernel.json'), 'utf8')), O = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'apn-oeis.json'), 'utf8'));
      if (K.rows.some((r) => r.word !== 'CERTIFIED') || O.counts.priorProofRows.length !== 3) fail('the AlphaProof Nexus card would misstate the record');
      return K.rows.length + ' proofs certified, two kernels · ' + O.published + ' of ' + O.claimed + ' OEIS proofs published · 3 already proved · 2 degenerate'; })() },
  { g: 'ai', f: 'curve-seeds.html', k: 'audit · the NIST curve seeds',
    title: 'NIST\u2019s ECDSA curve seeds: the timestamp-and-lrand48 origin, re-decided from the standards',
    desc: 'Anthropic\u2019s 16 October 2026 claim that the fourteen NIST and X9.62 curve seeds are lrand48 candidates seeded from 1997–98 Unix timestamps, and that six base points come from FreeLIP\u2019s generator, '
      + 're-decided the same evening from the POSIX, X9.62/FIPS 186-2 and FreeLIP specifications by two deciders sharing no code with each other or with the claimant: every checkable row holds, FIPS\u2019s own printed intermediates reproduced; '
      + 'the skipped candidates, the probabilities and "less plausible" listed as readings.',
    n: (() => { const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'curveseeds-ledger.json'), 'utf8'));
      if (L.counts.byVerdict.CERTIFIED !== L.rows.length) fail('the curve-seeds card would misstate the record');
      return L.rows.length + ' of ' + L.rows.length + ' checkable rows certified · 14 seeds, 14 derivations, 6 base points · ' + L.redControls.of + ' red controls · ' + L.readings.length + ' readings'; })() },
  { g: 'ai', f: 'alphaevolve-community.html', k: 'audit · a registry\'s unanswered claims',
    title: 'The AlphaEvolve repository\'s community certificates, decided',
    desc: 'Eight issues on DeepMind\'s repository of problems offer explicit objects beating its recorded bests — sphere-free grid sets to n = 40, two 58-point isosceles-free sets where the literature says 56 is optimal, '
      + 'ring loading at 47/42 and 9/8, a sum-difference set past Penman–Wells — most found by language-model searches, none answered. Every finite object decided here in integers from the notebooks\' definitions; '
      + 'the two claims with nothing finite to decide refused and named.',
    n: (() => { const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'aerp-ledger.json'), 'utf8'));
      if (L.counts.REFUTED !== 0) fail('the AlphaEvolve community card would misstate the record');
      return L.counts.CERTIFIED + ' claims certified · ' + L.counts.REFUSED + ' refused · C(40) ≥ ' + L.p60BestCertifiedPerN['40'] + ' · C(32) ≥ 58 · 9/8'; })() },
  { g: 'ai', f: 'bandeira.html', k: 'audit · a disproof of an open problem',
    title: 'Bandeira\'s Open Problem 0.2(a): the disproof, decided',
    desc: 'An autonomous research system published a disproof of Bandeira\'s matrix AM–GM problem at n = 5 — an exact rational Farkas certificate for Lai–Lim\'s semidefinite program and a Lean proof. '
      + 'The finite core re-decided here with a certificate of our own, in exact rationals; the claimant\'s certificate decides the program its code wrote, without the polynomial transposes that make the Gram form a sum of squares, '
      + 'and the two programs agree in floating point on every case — the conclusion stands, the gap sits exactly where the paper declares its boundary.',
    n: (() => { const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'bandeira-ledger.json'), 'utf8')); const o = L.decisions.ours.leftT, c = L.decisions.claimant;
      if (o.verdict !== 'CERTIFIED' || c.none.verdict !== 'CERTIFIED' || c.leftT.verdict === 'CERTIFIED') fail('the Bandeira card would misstate the record');
      return L.rows.filter((r) => r.verdict === 'CERTIFIED').length + ' of ' + L.rows.length + ' rows certified · our certificate: denominators ≤ ' + Number(o.maxDenominator).toLocaleString('en-US') + ' · the claimant\'s holds for its own program only'; })() },
  { g: 'ai', f: 'counterexample-machine.html', k: 'audit · AI-found counterexamples',
    title: 'The counterexample machine, decided',
    desc: 'Suvrit Sra\'s open library of counterexamples, most found by language models, decided case by case by programs that read the published '
      + 'certificate and never the authors\' checker: every case\'s mathematics holds where it can be decided, some rest partly on what no finite '
      + 'computation reaches, one holds under only one of the two definitions its own text gives — and none of the authors\' checkers reads the '
      + 'certificate it publishes.',
    n: (() => { const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'countex-ledger.json'), 'utf8')), c = (v) => L.rows.filter((r) => r.verdict === v).length;
      return L.rows.length + ' cases decided · ' + c('CERTIFIED') + ' whole, ' + c('PARTIAL') + ' partly, ' + c('REFUTED') + ' refuted'; })() },
  { g: 'ai', f: 'optimization-constants.html', k: 'audit · the registry\'s asterisks',
    title: 'Five asterisks, replayed',
    desc: 'The optimization-constants registry marks a bound with an asterisk when its verification is at minimal levels. Three hold as printed '
      + '(C3b, C3c, C71); C42 holds in its limiting inequality, the rest an argument in prose; C84b <= 1.999281 quotes a constant its source only suggests '
      + 'and cannot reach, and holds as 1.9993 — and the checker published with C3c prints OK for a false bound.',
    n: '3 certified · 1 partly · 1 repaired · 1 checker that compares in doubles' },
  { g: 'ai', f: 'chvatal-sankoff.html', k: 'audit · the registry\'s asterisks',
    title: 'Two asterisks on the Chvátal–Sankoff constant, replayed',
    desc: 'Lueker\'s 2009 automaton method for the binary Chvátal–Sankoff constant, run two history lengths past his paper by an outside claimant and merged '
      + 'asterisked. The automaton rebuilt here from the paper alone, in two implementations, calibrated on Lueker\'s own table for h = 2..8, run at h = 9 and 10 '
      + 'with our own witness vectors under directed rounding — and the printed bounds decided.',
    n: (() => { const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'lueker-replay.json'), 'utf8'));
      if (!L.rows.length || L.calibration.some((c) => !c.reproduced)) fail('the C31 card would misstate the record');
      return L.rows.map((r) => 'h = ' + r.h + ' ' + r.verdict).join(' · ') + ' · Lueker\'s table reproduced ' + L.calibration.length + '/7 · ' + L.redControlsFired + ' red controls'; })() },
  { g: 'ai', f: 'cryptids.html', k: 'audit · a producer\'s checker',
    title: 'The cryptids audit: a repository\'s finite layer, decided twice',
    desc: 'google-deepmind/cryptids publishes small Turing machines whose halting encodes Goldbach, ZF consistency and the Riemann Hypothesis, Lean proofs '
      + 'of the state reductions, and a checker of its own. The theorems are the kernel\'s; the finite layer underneath — tables, digests, counts, bootstraps, '
      + 'checkpoints, ratios — decided exactly from the bytes at one commit, by hand and through claimbox, the gaps of the producer\'s checker first.',
    n: (() => { const B = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'cryptids-benchmark.json'), 'utf8'));
      if (!B.M8.length || !B.M5.pairs) fail('the cryptids card would misstate the record');
      return B.M8.length + ' gaps · ' + B.M1.H.rows + ' claims by hand · ' + B.M1.C.written + ' through claimbox · ' + B.M5.agree + ' of ' + B.M5.pairs + ' paired claims agree'; })() },
  { g: 'ai', f: 'ramsey-graphs.html', k: 'audit · AlphaEvolve\'s Ramsey graphs',
    title: 'AlphaEvolve\'s Ramsey lower bounds, each graph decided',
    desc: 'Google released 18 graphs with AlphaEvolve, one per claimed lower bound R(s, t) ≥ m. Each is read as a simple graph and both of its properties '
      + '(no s-clique, no independent t-set) decided by an exhaustive search written from the definition, in two implementations held to each other root by root.',
    n: (() => { const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'ramsey-ledger.json'), 'utf8'));
      if (L.rows.length !== 18) fail('the Ramsey graphs card would misstate the record');
      return Object.entries(L.counts).map(([w, c]) => c + ' ' + w).join(' · ') + ' · 2 gaps in the release\'s check'; })() },
  { g: 'ai', f: 'selfaudit.html', k: 'the self-audit',
    title: 'The instrument, measured by its own rules',
    desc: 'A pre-registered self-measurement of this machine on its frozen register: planted false, true and malformed claims on every mutable row, '
      + 'each false one witnessed by code that shares nothing with the decider; the cost of every re-derivation under an enforced wall; two implementations '
      + 'compared wherever two decided a row; and what a double-precision check would have admitted on the same objects. Two defects found, fixed and kept.',
    n: (() => { const M = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'selfaudit-mutations.json'), 'utf8')), K = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'selfaudit-concord.json'), 'utf8'));
      return M.all.mutants + ' mutants · ' + M.all.falseCertifications + ' false certifications · ' + M.killSwitch.rowsWithWitnessedFalse + ' of ' + M.killSwitch.mutableRows + ' rows witnessed · ' + K.counts.comparisons + ' comparisons, ' + K.counts.disagreements.length + ' disagreements'; })() },
  { g: 'ai', f: 'rerun.html', k: 'the rerun kit',
    title: 'Re-run any decided claim',
    desc: 'For every record the claims register is derived from: the command that re-derives it, the standard-library verifier and '
      + 'the second implementation where they exist, the record\'s hash at this build — and the registry of who outside has re-run what, '
      + 'the one number that measures the independence this machine claims.',
    n: (() => { const K = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'rerun-kit.json'), 'utf8')), X = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'external-reruns.json'), 'utf8'));
      return K.entries.length + ' records · ' + K.entries.filter((e) => e.verifier).length + ' stdlib verifiers · ' + X.length + ' independent rerun' + (X.length === 1 ? '' : 's') + ' recorded'; })() },
  { g: 'ai', f: 'claims.html', k: 'the claims desk',
    title: 'Send us a claim',
    desc: 'A mathematical claim that comes down to finitely many exact arithmetic facts is decided here — '
      + 'certified with a certificate that re-runs without this engine, refuted with the falsifying witness '
      + 'printed, or honestly refused. Every row of the ledger is derived from the record that decided it, the '
      + 'queue is open and its submitted count is published even while it is zero, and the claimant\'s code is '
      + 'never in the trust path.',
    n: fmt(claimsLedger.decided) + ' claims decided · ' + claimsLedger.submitted + ' submitted so far' },
  ...(() => {                                                       /* the monthly ledger (D6): one page per month, newest first.
     The shelf must carry every month's page — it listed only the latest, and the first new month (October 2026) left
     September's page on disk with no shelf row, which the shelf gate refused. */
    const months = fs.readdirSync(path.join(ROOT, 'reports')).filter((f) => /^decided-\d{4}-\d{2}\.html$/.test(f)).sort().reverse();
    const NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months.map((f, i) => {
      const m = f.slice(8, 15), mm = NAMES[Number(m.slice(5)) - 1] + ' ' + m.slice(0, 4);
      const rows = claimsLedger.rows.filter((r) => r.recordedOn && r.recordedOn.slice(0, 7) === m && r.verdict !== 'QUEUED');
      return { g: 'ai', f, k: i === 0 ? 'the monthly ledger' : 'the monthly ledger · an earlier month',
        title: 'Decided, ' + mm,
        desc: 'Every published claim decided in ' + mm + ', read from the register: what held, what did not, and what went wrong, in one '
          + 'closed vocabulary — a dated diff of the records, nothing typed.',
        n: fmt(rows.length) + ' decided · ' + fmt(rows.filter((r) => r.kind !== 'none').length) + ' with something wrong' };
    });
  })(),
  { g: 'ai', f: 'envs.html', k: 'environments · the grader, graded',
    title: 'We graded the graders',
    desc: 'A grader that checks a number against a stored decimal within a tolerance accepts values that are '
      + 'provably wrong — and a certified enclosure mints those values without limit, so the adversarial set is '
      + 'generated from certificates rather than written by hand. Measured here against the four reference grader '
      + 'shapes, with three environments built on the same primitive: a grader QA suite, a gym where a verdict '
      + 'without evidence scores zero, and one that rewards BREAKING a grader rather than satisfying it.',
    n: 'measured offline · every canary traces to a sha-pinned certificate' },
  { g: 'ai', f: 'refusals.html', k: 'note · the third verdict',
    title: 'What the machine would not decide',
    desc: 'Every refusal on record, by kind, each with its own denominator: the grader\'s refusal rate on claims '
      + 'other people submitted, the generation loop\'s own refusals, NEEDS DATA where a claimant published no '
      + 'bytes to decide on, campaigns published as unfinished, and the undecided cells of two exhaustive sweeps. '
      + 'Deliberately no total — the kinds are not commensurable, and one big number would be a smaller fact.',
    n: 'no total on purpose · every row names its denominator' },
  { g: 'ai', f: 'methods-note.html', k: 'methods note',
    title: 'How the bugs were found',
    desc: 'Every real bug this machine has found, cataloged: ten caught by a red control, a calibration, an impossible number, or a byte pin, and six found on 2026-10-09 by an adversarial read of the code, counted apart. How to build verifiers that catch their own defects, stated as engineering.',
    n: 'every regression re-held by a battery at build' },
  { g: 'ai', f: 'rm-audit.html', k: 'audit · standing registry',
    title: 'The Ramanujan Machine, audited',
    desc: 'Every row of all seven published result sheets decided by rigorous enclosures and exact rational comparisons — the whole registry re-certified at every build.',
    n: rmPrinted + ' printed rows · ' + rmSurvive + ' survive · 1 refuted, correction certified' },
  /* catalogued 2026-08-30 the moment reports/keller.html landed on disk — the
     shelf gate refuses to ship a report it cannot describe, and it did */
  { g: 'erdos', f: 'tensor-rank-bounds.html', k: 'audit · both walls',
    title: 'The rank of 3x3 matrix multiplication, audited from both sides',
    desc: 'Laderman multiplied two 3x3 matrices in 23 multiplications in 1976 and nobody has beaten it since. The lower bound moved from 19 to 20 over F2 in March 2026, in a preprint whose proof is a machine-checkable certificate on a two-star repository. Both walls are re-verified here in exact arithmetic, by an instrument built to be able to contradict either.',
    n: 'first independent check of the new bound' },
  { g: 'erdos', f: 'matmul-additions.html', k: 'audit · the cost nobody quotes',
    title: 'Rank is not the cost: checking 55 additions for 3x3',
    desc: 'Everyone quotes Laderman\'s 23 multiplications. Almost nobody quotes the additions — and that is where the record has actually been moving, seven times in under a year: 62, 61, 60, 59, 58, 56, and in July 2026, 55. That preprint is a month old and its certificate sits on a repository with zero stars. Every number in it is re-derived here, by an instrument that decides both halves of the claim separately, because a circuit can be short and compute the wrong map or compute the right map and have been miscounted.',
    n: 'the claim held; 8 red controls fired' },
  { g: 'erdos', f: 'polynomial-multiplication.html', k: 'generation · polynomial multiplication over F2',
    title: 'A free search against forty-year-old multiplication bounds',
    desc: 'The best known ways to multiply polynomials over F2 are still hand constructions from 1983 and 2009, and every lower bound underneath them moved in March 2026. A free flip-graph walk was pointed at the gap and certified exactly. It reproduced three published upper bounds from scratch — including the cyclic convolution C7, where the two walls meet, so that rank is the exact answer — and beat none of them. The calibration is the result, and the prior-art check that narrowed the target is on the page.',
    n: 'a null result, with the ladder that makes it mean something' },
  { g: 'ai', f: 'ai-claims-audit.html', k: 'audit · six AI-claimed theorems',
    title: 'We checked the AI\'s homework',
    desc: 'Six mathematical results produced with frontier-model help — a counterexample to Maxwell\'s point-charge bound, a new lower bound for the Korenblum constant, an Erdős problem open since 1958 and three more — each re-verified here from the manuscript by verifiers that never ran a line of the authors\' code. ' + aiClaims.confirmed + ' held, ' + aiClaims.partial + ' came back PARTIAL, ' + aiClaims.refuted + ' were refuted; in all ' + aiClaims.lanes + ' the computational fragment certified and the analytic core was out of reach.',
    n: aiClaims.checks + ' checks · ' + aiClaims.mutations + ' mutation controls, all rejected' },
  { g: 'erdos', f: 'erdos852-h.html', k: 'erdos · conjecture vs data',
    title: 'A conjecture nobody had checked against the numbers',
    desc: 'Erdős #852 conjectures that the longest run of pairwise-distinct prime gaps grows like c₀·log x. This repository certified c₀ to 61 digits; the exact record data has been in the OEIS since 2002; nobody had compared them. Recomputed here in integer arithmetic and placed against the constant — under the reading the problem statement actually gives, they agree across every decade; under the other reading they do not.',
    n: 'reproduces every published term, then passes them \u2014 a run of ' + h852Max + ' pairwise-distinct gaps' },
  { g: 'ai', f: 'claim-maxwell.html', k: 'one of six · at ε = 1/6 only',
    title: 'Maxwell\'s point-charge bound — re-verified',
    desc: 'Five positive point charges in ℝ³ whose potential has at least 24 nondegenerate critical points — exceeding the conjectured bound of 16. Re-verified here from the manuscript: the verifier\'s full check ledger as it printed it at build time, the named falsifiers that prove it can fail, and the boundary the audit did not cross.',
    n: aiClaims.verdicts.find((v) => v.id === 'maxwell').verdict + ' · ' + aiClaims.verdicts.find((v) => v.id === 'maxwell').mutations + ' mutation controls, all rejected' },
  { g: 'ai', f: 'claim-korenblum.html', k: 'one of six · the numerical criterion',
    title: 'The Korenblum constant — re-verified',
    desc: 'c₂ ≥ 0.4263, via a moment-duality criterion and an explicit rational eight-atom measure (arXiv:2607.17748). Re-verified here from the manuscript: the verifier\'s full check ledger as it printed it at build time, the named falsifiers that prove it can fail, and the boundary the audit did not cross.',
    n: aiClaims.verdicts.find((v) => v.id === 'korenblum').verdict + ' · ' + aiClaims.verdicts.find((v) => v.id === 'korenblum').mutations + ' mutation controls, all rejected' },
  { g: 'ai', f: 'claim-lemniscate.html', k: 'one of six · the computational fragment',
    title: 'Erdős Problem #1038 — re-verified',
    desc: 'The infimum is exactly D = 1.834430475762661711090753635125…, in a July 2026 manuscript of Darvas, Peng and Tao. Re-verified here from the manuscript: the verifier\'s full check ledger as it printed it at build time, the named falsifiers that prove it can fail, and the boundary the audit did not cross.',
    n: aiClaims.verdicts.find((v) => v.id === 'lemniscate').verdict + ' · ' + aiClaims.verdicts.find((v) => v.id === 'lemniscate').mutations + ' mutation controls, all rejected' },
  { g: 'ai', f: 'claim-ranteng.html', k: 'one of six · machine-checkable fragment only',
    title: 'Ran–Teng Conjecture 20 — re-verified',
    desc: 'Resolved, in a preprint. Source status: "Human-checked mathematical proof; no formal proof assistant artifact located" (24 Feb 2026). Re-verified here from the manuscript: the verifier\'s full check ledger as it printed it at build time, the named falsifiers that prove it can fail, and the boundary the audit did not cross.',
    n: aiClaims.verdicts.find((v) => v.id === 'ranteng').verdict + ' · ' + aiClaims.verdicts.find((v) => v.id === 'ranteng').mutations + ' mutation controls, all rejected' },
  { g: 'ai', f: 'claim-mathieu.html', k: 'one of six · supporting identities only',
    title: 'The Mathieu property for Lie groups — re-verified',
    desc: 'Exactly the tori — a classification. Re-verified here from the manuscript: the verifier\'s full check ledger as it printed it at build time, the named falsifiers that prove it can fail, and the boundary the audit did not cross.',
    n: aiClaims.verdicts.find((v) => v.id === 'mathieu').verdict + ' · ' + aiClaims.verdicts.find((v) => v.id === 'mathieu').mutations + ' mutation controls, all rejected' },
  { g: 'ai', f: 'claim-poisson.html', k: 'one of six · the explicit counterexample',
    title: 'The rank-two Poisson conjecture — re-verified',
    desc: 'An explicit counterexample: polynomials R, T, D, S in ℚ[x,q,p,z] with prescribed bracket relations. Re-verified here from the manuscript: the verifier\'s full check ledger as it printed it at build time, the named falsifiers that prove it can fail, and the boundary the audit did not cross.',
    n: aiClaims.verdicts.find((v) => v.id === 'poisson').verdict + ' · ' + aiClaims.verdicts.find((v) => v.id === 'poisson').mutations + ' mutation controls, all rejected' },
  { g: 'ai', f: 'keller.html', k: 'audit · published counterexamples',
    title: 'The Jacobian conjecture, audited',
    desc: 'The July-2026 announcement that would refute a conjecture open since Keller 1939 — and the literature that followed it within days — decided in exact rational arithmetic: the Jacobian determinant expanded symbolically and compared coefficient by coefficient, every claimed collision re-evaluated as fractions, then the published witnesses thrown away and the collisions found again blind. Eight rows re-certify a sha-pinned published source; three are counterexamples this machine generated itself and no paper carries.',
    n: kellerN + ' certificates · 3 generated here, in no paper' },
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
  { g: 'ai', f: 'zeta7-anand.html', k: 'audit · a ζ(7) proof',
    title: 'A claimed proof that ζ(7) is irrational: the inequality it rests on fails',
    desc: 'Anand’s preprint audited in exact arithmetic: its outer integral, recomputed from its own formulas, is positive, so A₂₀₀ + U, which must be negative, is positive under every reading and every decided repair. The third-party report that found it is right on every point checked. The proof fails; ζ(7)’s irrationality is untouched.',
    n: 'I_out = +' + Number(z7.outer.formula.R2.value.dec).toFixed(4) + ' (printed −15.28) · A₂₀₀ + U = +' + Number(z7r2.A200plusU).toFixed(2) + ' where the proof needs < 0 (printed ' + Number(z7.margins.printedChain.A200plusU.dec).toFixed(2).replace('-', '−') + ')' },
  { g: 'ai', f: 'zeta-hankel.html', k: 'measured · ζ(5) → ζ(7)?',
    title: 'The method that proved ζ(5) irrational stops at ζ(5): measured',
    desc: 'The Hankel-determinant method behind the September 2026 proof that ζ(5) is irrational, computed exactly past it: every polynomial content-stripped to the smallest one the proof can use, its true margin ball-certified. ζ(3) and ζ(5) clear zero; ζ(7) and Catalan’s G do not in any of ' + zh.classReading.counts.families + ' families, and the exact p-adic content shows why. The wall is a measurement, not a theorem; the race claims are labelled unverified.',
    n: zh.headline.map((h) => h.constant + ' ' + zhs(h.margin)).join(' · ') + ' · ' + zh.counts.agree + '/' + zh.counts.rowsRerun + ' re-run rows agree' },
  /* group 'applied': the new fronts — certified applications with live
     external stakes (aerospace, energy) */
  { g: 'applied', f: 'pu-verificado.html', k: 'finance · Tesouro Direto, every price',
    title: 'PU Verificado',
    desc: 'Every fixed-rate Tesouro Direto price since ' + PU.scope.firstDate.slice(0, 4) + ' re-decided from the Treasury\u2019s own rule table in exact arithmetic — the settlement and rounding conventions measured, every OFF price listed with the exact value and the difference in centavos, a second decider sharing no code on every exception.',
    n: fmt(PU.scope.pairsDecided) + ' prices decided · ' + (100 * (PU.counts.byVerdict.REPRODUCED || 0) / PU.scope.pairsDecided).toFixed(2) + '% the rule\u2019s value to the centavo · ' + fmt(PU.counts.byVerdict.OFF || 0) + ' off' },
  { g: 'applied', f: 'skyaudit.html', k: 'aerospace · the app, cited',
    title: 'SkyAudit: the helicopter day, decided',
    desc: 'One pinned day of New York helicopter traffic, re-flown on paper by four eVTOLs’ own published numbers under the FAA reserve rule — every flight decided: E-FLYABLE, BEYOND RANGE with an exact witness, or NEEDS DATA where public specs cannot say. The citable methodology behind the live app.',
    n: 'every certificate row recounted at the page’s own build' },
  { g: 'applied', f: 'harbor-proof.html', k: 'maritime · FuelEU, first live year',
    title: 'HarborProof: the fleet, re-sailed under the rule',
    desc: 'Every ship in the official EU-MRV 2025 registry — the first year FuelEU Maritime penalties exist — re-fueled on paper under the regulation’s own published penalty formula, in exact rationals over boxes constrained by each ship’s own reported numbers: penalty floors in EUR, exact zero-WtW blend fractions that flip each verdict, NEEDS DATA where the record’s opacity leaves it open.',
    n: 'the whole registry recomputed at the page’s own build' },
  { g: 'applied', f: 'ec-benchmark.html', k: 'ocean engineering · the contour benchmark',
    title: 'Their contours, re-decided to the last point',
    desc: 'Nine groups submitted environmental contours — the curve an offshore designer reads a 50-year sea state off — for six metocean datasets, and the benchmark scored each by counting the hourly observations outside it with a float point-in-polygon test. Every submitted contour re-read here as the exact polygon its file denotes and 1.8 million hourly sea states classified inside, outside or on it exactly: 173 of 176 printed counts reproduced to the integer, two traced to a rewritten file, 30 contours that cross themselves, two observations exactly on a contour, and the paper\u2019s expected numbers certified.',
    n: '150 contours \u00b7 176 printed numbers \u00b7 173 exact' },
  { g: 'applied', f: 'return-levels.html', k: 'ocean engineering \u00b7 the return-level table',
    title: 'The return-level table as a certificate',
    desc: 'The extreme-value method of Reis, Guimar\u00e3es et al. (Ocean Eng. 2026) \u2014 six families fitted by maximum likelihood to significant wave height, four goodness-of-fit criteria, block maxima, 100- and 1000-year levels \u2014 repeated with every fit certified on three NDBC buoys' + (hsvPts ? ' and on the paper\u2019s own hindcast at ' + hsvPts + ' grid points' : '') + '. The exponentiated Weibull wins one hourly series of three; on ' + hsvGG.edge + ' series of 12 the generalized gamma\u2019s likelihood is proved to peak at its lognormal limit. And the Hs marginals the benchmark\u2019s teams printed for the same ten years of one buoy put the 100-year wave anywhere from ' + hsvLo.toFixed(1) + ' to ' + hsvHi.toFixed(1) + ' m \u2014 one printed row is the fit of the wave period.',
    n: hsvCert + ' of ' + hsvAll + ' fits certified \u00b7 ' + hsvDec + ' of ' + hsvRk + ' choices decided' },
  { g: 'applied', f: 'breaking-geometry.html', k: 'ocean engineering · sixteen thousand breakers',
    title: 'Sixteen thousand breaking waves, decided against the laboratory \u2014 and against the paper',
    desc: 'Guimar\u00e3es, Stringari, Filipot, Leckler, Benetazzo and Chapron (GRL, 16 September 2026) published the geometry of 16,369 breaking waves filmed in stereo on the Black Sea. Every number the paper prints read against its own table in exact arithmetic \u2014 the fitted laws and the 4 % self-similar tail reproduced to the digit, the \u03b8 range and the Hs column found to be other columns \u2014 and the sea-state stratification the paper leaves undone, done per record.',
    n: '16,369 events \u00b7 34.5% in the tank\u2019s band \u00b7 \u03c1 \u2264 0.41' },
  { g: 'applied', f: 'evtol-energy.html', k: 'aerospace · energy certificates',
    title: 'The reserve, provable',
    desc: 'Energy-feasibility certificates for eVTOL missions against the FAA reserve rule: CERTIFIED for every parameter point in the boxes, REFUTED with an exact falsifying witness, or honestly REFUSED — where the industry argues with Monte Carlo, this decides.',
    n: 'verdicts cross-proved by 256-corner exact sweeps' },
  { g: 'applied', f: 'glide-band.html', k: 'aerospace · the ring, decided',
    title: 'The glide ring is unfalsifiable',
    desc: 'Engine-out reach on a real pinned single-engine flight, recomputed as an enclosure over the same inputs\u2019 uncertainty: an inner boundary proved reachable, an outer boundary proved not, and the honest annulus between that no shipped product draws. While the panel\u2019s single line sits inside the envelope it cannot be proved wrong about anything \u2014 and 57% of what it claims cannot be proved right.',
    n: '650 airfields \u00d7 288 states, every verdict decided at the page\u2019s own build' },
  { g: 'applied', f: 'water-value.html', k: 'energy · certified theorem',
    title: 'The water value, certified',
    desc: 'The shadow price of stored water in a hydro-dominated grid is a martingale between stock-binding events — proved by LP duality on scenario trees, with the solver extracted from the published artifact’s own bytes and 120 random trees re-certified at every build.',
    n: 'duality gap ~1e-14 · continuum limit honestly OPEN' },
  /* group 'ground': the instruments, proven on hard classical ground */
  { g: 'ground', f: 'mfg-observatory.html', k: 'lab · the plane, decided',
    title: 'The MFG regime observatory',
    desc: 'The coupling–potential plane of a mean-field game partitioned into cells and decided — thousands carry two exact equilibria in provably disjoint balls valid for EVERY parameter in the cell, not merely at a sampled point. The certifier runs in the page, ships as one dependency-free file, and refuses at the bifurcation.',
    n: 'the partition’s area identity re-checked at build' },
  { g: 'ground', f: 'mfg-two-population.html', k: 'lab · two populations',
    title: 'The attack–defense regime map',
    desc: 'The coupling plane of a TWO-population mean-field game, decided cell by cell. The standard sufficient condition for a unique equilibrium turns out to be an order of magnitude conservative — and the attack–defense asymmetry it never mentions is the axis along which a solver stops being able to see the second equilibrium at all.',
    n: 'verdicts checked against the one-population lab at zero coupling' },
  { g: 'ground', f: 'mfg-cap.html', k: 'certified theorem · multiplicity',
    title: 'Two solutions, provably',
    desc: 'Certified multiplicity for a non-monotone mean-field game: two equilibria enclosed in disjoint interval-arithmetic balls at one parameter set, in the regime where uniqueness theory is silent — and a proof that REFUSES at the bifurcation.',
    n: 'the unit’s battery + six falsifiers re-run at build' },
  { g: 'ground', f: 'mfg-lab.html', k: 'certified reproduction · registry',
    title: 'The MFG laboratory, certified',
    desc: 'The single-file MFG laboratory’s certified claims: a published Wardrop table reproduced within its own rounding AND proved (Krawczyk box, exact rational solve), the discrete adjoint identity, and the non-unique split behind unique totals.',
    n: 'four of the lab’s own batteries re-run at build' },
  { g: 'erdos', f: 'mercer-program.html', k: 'erdős #510 · certified landscape',
    title: 'The Mercer program',
    desc: 'Chowla’s cosine dips — Erdős #510 — and Newman’s 0/1 minima certified as one landscape: exhaustive box sweeps, exact champions, a Sturm equality — every claim re-proved at build. The certified lambda table is the note filed on the #510 page.',
    n: 'mu(5) ≤ 1 + π/' + topM + ' · re-certified every build' },
  { g: 'erdos', f: 'erdos290.html', k: 'erdős #290 · theorem',
    title: 'Erdős #290: the 4k(k+1) theorem',
    desc: 'The square-discriminant law proved and re-proved as exact integer identities during the build, the enclosure sweep deepened past the cited page, every exceptional degree in range closed.',
    n: 'planted falsifiers must fire at build' },
  { g: 'ground', f: 'entropy.html', k: 'certified invariant',
    title: 'Entropy, with a certificate',
    desc: 'A certified lower bound on the topological entropy of the classical Hénon map — covering relations composed to an exact integer spectral argument, calibrated at the full horseshoe.',
    n: 'h_top ≥ 0.3017, a theorem' },
  { g: 'erdos', f: 'verify-lemniscate.html', k: 'erdős #1038 · verification',
    title: 'Erdős #1038: thirty decimals verified',
    desc: 'The computational fragment of the Darvas–Peng–Tao manuscript re-verified by an independent route — Krawczyk rather than bisection — with the 30th digit read correctly.',
    n: 'filed on the claiming authors’ repository' },
  { g: 'ground', f: 'frontier.html', k: 'validated numerics · the measurement',
    title: 'The concentration frontier, as a measurement',
    desc: 'Where the congestion mean-field-game certifier stops certifying as the crowd concentrates, at six viscosities and four truncation orders: the boundary of a fixed-order certificate moves with the order, and an N-free ceiling read off the code does not. A lower bound, said so.',
    n: 'pinned data re-derived at build' },
  { g: 'ground', f: 'price.html', k: 'exact arithmetic · the band',
    title: 'The clearing price, as a proved band',
    desc: 'The Gomes–Saúde electricity price closed in exact rationals: a forecast box on the supply becomes a price band that is a theorem — every path inside prices inside, both edges attained — and the source lab\'s own kernel is found clearing a market whose batteries do not fill.',
    n: 'record re-derived at build' },
  { g: 'ground', f: 'agtable.html', k: 'interval arithmetic · the replication',
    title: 'Their tables, re-decided',
    desc: 'The two error tables of the Ashrafyan–Gomes semi-Lagrangian scheme met by intervals: the analytic solutions enclosed, the scheme rewritten from the paper, every printed cell given a verdict — the price column reproduced to its digits, the tolerance found inside the finest number, and the printed density found not to be one.',
    n: 'record re-derived at build' },
  { g: 'ground', f: 'regatlas.html', k: 'validated numerics · the atlas',
    title: 'The regularization, measured',
    desc: 'Ferreira, Gomes and Üçer restore coercivity with a p-Laplacian to prove that first-order mean-field games have solutions. On the one-dimensional game every regularized equilibrium and the unregularized one are enclosed, cell by cell across an atlas, and the distance between them is decided: the regularization was for the proof; the equation was elliptic all along.',
    n: 'record re-derived at build' },
  { g: 'ground', f: 'hbar.html', k: 'interval arithmetic · the band',
    title: 'The effective Hamiltonian band',
    desc: 'The one-dimensional effective Hamiltonian of the cell problem enclosed as a band: flat exactly, rotating bracketed, the threshold enclosed and the point inside it left undecided, the Mather measure decided where it rotates; Gomes–Yang\'s tables held against it and the eight-digit value they quote found one digit too generous.',
    n: 'record re-derived at build' },
  { g: 'ground', f: 'maxval.html', k: 'validated numerics · the grammar',
    title: 'The maximal value function, drawn',
    desc: 'Gomes and Üçer prove that a first-order game’s value function is decided only where the density lives and is one of many where it does not. An explicit game with a vacuum, built here, shows it: the maximal solution enclosed cell by cell, the chosen one dotted beneath it, the gap between them proved.',
    n: 'record re-derived at build' },
  { g: 'ground', f: 'monoflow.html', k: 'validated numerics · the flow',
    title: 'Monotone, and provably not a gradient',
    desc: 'Two certificates on one MFG equilibrium: the Lasry–Lions form is c∫δm² + ∫m(δu′)² exactly, and the monotone flow of the Gomes school has a certified non-real eigenvalue there — not a gradient flow under any metric. Two instances honestly undecided.',
    n: 'record re-derived at build' },
  { g: 'ground', f: 'aag.html', k: 'validated numerics · the grammar',
    title: 'The empty region, painted by standing',
    desc: 'Alharbi, Ashrafyan and Gomes’s first-order game with an entry and an exit: the region where the density vanishes decided cell by cell, refused on the cells holding the free boundary, the two value functions enclosed, and contact without exit evaluated as an interval.',
    n: 'record re-derived at build' },
  { g: 'ground', f: 'afg.html', k: 'validated numerics · first order',
    title: 'A first-order mean-field game, enclosed by its current',
    desc: 'Almulla, Ferreira and Gomes say of their nonzero-drift case that no closed form is known. The game reduces through its constant current to two numbers, enclosed in a Krawczyk box with every integral rigorous; the paper’s own closed form is the control.',
    n: 'record re-derived at build' },
  { g: 'ground', f: 'mfg-congest.html', k: 'validated numerics',
    title: 'A congestion mean-field game, enclosed',
    desc: 'An equilibrium of a mean-field game with congestion enclosed by validated numerics: an exact solution within an explicit radius, locally unique in the full sequence space.',
    n: 'embedded verifier re-run at build' },
  { g: 'ground', f: 'wardrop-repro.html', k: 'certified reproduction',
    title: 'Wardrop, certified: exact, enclosed, refused',
    desc: 'The multi-population Wardrop equilibria of a published paper reproduced with certificates — exact where possible, enclosed where not, and refused where honesty demands it.',
    n: 'embedded verifier re-run at build' }
];
const LANES = ['ai', 'erdos', 'applied', 'ground'];
const AI_REPORTS = REPORTS.filter((r) => r.g === 'ai');
const ERDOS_REPORTS = REPORTS.filter((r) => r.g === 'erdos');
const APPLIED_REPORTS = REPORTS.filter((r) => r.g === 'applied');
const GROUND_REPORTS = REPORTS.filter((r) => r.g === 'ground');
{
  const onDisk = fs.readdirSync(path.join(ROOT, 'reports')).filter((f) => f.endsWith('.html')).sort();
  const shelf = REPORTS.map((r) => r.f).sort();
  if (onDisk.join(',') !== shelf.join(','))
    fail('the report shelf and reports/ disagree — disk [' + onDisk + '] vs shelf [' + shelf + ']');
  /* every card is drawn exactly once: a lane typo would silently drop a
     report off /reports/ while the disk check above still passed */
  const lanes = AI_REPORTS.length + ERDOS_REPORTS.length + APPLIED_REPORTS.length + GROUND_REPORTS.length;
  if (lanes !== REPORTS.length)
    fail('a report carries a lane that is not one of [' + LANES + '] — ' + lanes + ' of ' + REPORTS.length + ' cards would be drawn');
}
const reportCards = (rs, prefix) => C.cards(rs.map((r) => ({ href: prefix + r.f, k: r.k, title: r.title, desc: r.desc, n: r.n })));
/* the described certificate shelf — ONE definition, in tools/certs-shelf.js,
   because /machine carries the same list and a second copy of seventy-five
   descriptions that each have to agree with a file on disk would diverge. */
const CERTS = require(path.join(__dirname, 'certs-shelf.js'))(ROOT, { strassenN, bilinearN, topM });
/* WORKING — records that exist while a run is in flight and are NOT part of
   the published set. ONE pattern, used by BOTH the description gate and the
   publication loop below: a file excused from being described must also be
   excused from shipping, and when those two lists were written out separately
   they diverged the first time one was edited.

   `erdos290-tail-shard-N.json`  the detached campaign's per-shard files; the
                                 merge folds them into erdos290-tail-ext.json
   `wip-*`                       declared work in progress. A gate catches
                                 drift and forgery, never slows development
                                 (CLAUDE.md); requiring a published-record
                                 description for a ledger a generation run
                                 rewrites every few minutes is friction. The
                                 day it earns a page it takes a real name and
                                 a table row like everything else. */
const WORKING = /^(?:erdos290-tail-shard-\d+\.json|wip-.*)$/;
{
  /* In-progress campaign shards are WORKING records, not published ones: the
     detached #290 tail run writes one file per shard and `merge` folds them
     into erdos290-tail-ext.json, which is what this table describes. They are
     gitignored for the same reason certs/shard-logs/ is, and excluded here so a
     running campaign cannot block a site build.

     `wip-*` joins them for the same reason. A gate catches drift and forgery;
     it never slows development (CLAUDE.md). Requiring a table row for every
     file in certs/ is right for a PUBLISHED record and pure friction for a
     working ledger a generation run rewrites every few minutes. So `wip-*` is
     declared work in progress: nothing on the site may quote it, and the day
     it earns a page it takes a real name and a table row like everything
     else. The gate keeps every bit of its power over what actually ships. */
  /* WORKING is module-scope (see above): the SAME pattern gates description
     and publication, because a file excused from one must be excused from both. */
  const onDisk = fs.readdirSync(path.join(ROOT, 'certs')).filter((f) => (f.endsWith('.json') || f.endsWith('.jsonl')) && !WORKING.test(f)).sort();
  const listed = CERTS.map((c) => c[0]).sort();
  if (onDisk.join(',') !== listed.join(','))
    fail('the certificate table and certs/ disagree — disk [' + onDisk + '] vs table [' + listed + ']');
  /* and no re-verify link may 404: every one names its repo source, and the
     sync below copies exactly tools/verify_*.py -> verify/ and reports/* ->
     reports/. A link whose source is gone refuses the build. */
  for (const [f, , v] of CERTS) {
    if (!v) continue;
    if (!fs.existsSync(v.src)) fail('the re-verify link for ' + f + ' points at /' + v.href + ', whose source ' + path.relative(ROOT, v.src) + ' does not exist — that link would 404');
  }
}

/* ---- the landing page ----------------------------------------------------
   NARRATIVE ORDER, rebuilt 2026-08-30 on the operator's verdict that the page
   opened with machinery: a reason to care first, then the sharpest single case
   told in plain words, then the shelf, and only then the apparatus. This is
   CLAUDE.md's app doctrine applied to the front door — product words on the
   surface, the enclosure and the falsifier one click down. Nothing about the
   derivation discipline changed: every number below is still recomputed here
   and the build still refuses when one of them stops closing. What changed is
   which of them a stranger meets first.

   B is assembled AFTER the shelf and the certificate table so the opening can
   quote counts those tables gate (the number of reports, the Keller objects) —
   a landing that says "31 write-ups" while reports/ holds another number is
   exactly the drift the shelf gate exists to catch. */
/* ---- the instruments, read from the manifest playground/build.js wrote ------
   One engine, two faces. The manifest is the single source for every count
   and every plate about /instruments on this page and on the machine page;
   make site builds the instruments first so it is never stale. */
const INSTR = (() => {
  const p = path.join(ROOT, 'playground', 'out', 'manifest.json');
  if (!fs.existsSync(p)) fail('playground/out/manifest.json missing — run node playground/build.js (make site does, first)');
  const m = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (!m.cards || m.cards.length < 10 || !m.count) fail('the instruments manifest is short or shapeless');
  for (const c of m.cards) if (!fs.existsSync(path.join(ROOT, 'site', c.href))) fail('the instruments manifest lists ' + c.href + ', which is not built');
  return m;
})();
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
const NUMWORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const numword = (k) => NUMWORD[k] || String(k);
const gatesRec = (() => { const p = path.join(ROOT, 'batteries.json'); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null; })();

/* OpenAI's math release (reports/openai-math.html), featured on the landing on the operator's word 2026-10-12: the header
   and the lead card read these, and each refuses on a number that stops closing */
const oai = (() => {
  const R = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'openai-math', 'release.json'), 'utf8'));
  const K = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'openai-math-kernel.json'), 'utf8'));
  const S = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'openai-math-statements.json'), 'utf8'));
  const F = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'openai-math', 'findings.json'), 'utf8'));
  const w = K.counts.words;
  const out = { manuscripts: R.counted.manuscriptLinks, challenges: R.counted.challenges, decided: K.counts.decided,
    certified: w.CERTIFIED || 0, refused: w.REFUSED || 0, rejected: w.REJECTED || 0, gaps: F.findings.length,
    short: (S.counts.words.DIFFERENT || 0) + (S.counts.words['NARROWER — UNDECLARED'] || 0), families: S.rows.length };
  if (out.decided !== out.challenges || out.certified + out.refused + out.rejected !== out.challenges)
    fail('the OpenAI kernel record does not account for every challenge — the landing would misstate it');
  if (out.rejected) fail('the landing says no OpenAI challenge was rejected; the kernel record holds ' + out.rejected);
  return out;
})();
/* ---- THE LANDING (rebuilt 2026-10-16; notes/positioning-plan-2026-10-16.md §3.2) -----------------------
   Six blocks, under 900 words, under 25 links: the sentence visible as the H1; three proof numbers that are the
   method paper's own highlights; the three lines of work; the register's latest decisions; what came back from
   outside; the method in four sentences; who, and an address. Every number is read from the record that decided
   it, and each record gate below refuses the page when a record stops saying what the page says. The previous
   landing (4,550 words, fourteen sections, the engine as the headline) is in git before this date. */
const TITLES = require(path.join(ROOT, 'design', 'titles.js'));
const REFRESH = require(path.join(ROOT, 'design', 'refresh.js'));
const seriesCount = (id) => TITLES.entries().filter((r) => r.series === id).length;

/* the paper's first exercise: the Qiushi Engine's kissing bounds, every pair decided (certs/kissing-wave.json) */
const KW = (() => {
  const W = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'kissing-wave.json'), 'utf8'));
  const rows = W.rows.filter((r) => r.claimant === 'qiushi');
  if (!rows.length || !rows.every((r) => r.verdict === 'WITNESSED' && r.engine && r.engine.violations === 0 && r.engine.pairs === r.engine.n * (r.engine.n - 1) / 2))
    fail('the landing says every Qiushi bound is witnessed pair by pair; certs/kissing-wave.json disagrees');
  const atRequest = rows.filter((r) => /at our request/.test(r.detail || ''));
  const dims = atRequest.map((r) => r.dim).sort((a, b) => a - b);
  const ranges = dims.reduce((acc, d) => { const last = acc[acc.length - 1]; if (last && last[1] === d - 1) last[1] = d; else acc.push([d, d]); return acc; }, [])
    .map(([a, b]) => (a === b ? String(a) : a + '–' + b)).join(', ');
  return { rows: rows.length, pairs: rows.reduce((a, r) => a + r.engine.pairs, 0), atRequest, dims, ranges,
    source: atRequest.length ? atRequest[0].source : null, publishedOn: atRequest.length ? atRequest.map((r) => r.decidedAt.slice(0, 10)).sort()[0] : null };
})();
/* the second: the Navier–Stokes Lean certificate, partial at the announced commit and certified at the next */
const NS = (() => {
  const dir = path.join(ROOT, 'corpus', 'navier-stokes');
  const f = fs.readdirSync(dir).find((x) => /^upstream-[0-9a-f]+\.json$/.test(x));
  if (!f) fail('no corpus/navier-stokes/upstream-*.json — the landing cannot state the Navier–Stokes outcome');
  const U = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  if (!(U.decided && U.decided.atPin && U.decided.atPin.formal === false && U.decided.atHead && U.decided.atHead.formal === true))
    fail('the landing says the Navier–Stokes energy clause was formal only at the next commit; the upstream record disagrees');
  return U;
})();
/* the third: the graders (certs/envs-record.json, loaded above as envsRec) */
const gEnc = envsRec.graders.find((g) => /^enclosure/.test(g.name));
if (!gEnc || gEnc.falseAccept !== 0 || gEnc.falseReject !== 0) fail('the landing says the certificate grader admits no wrong answer and rejects no right one; the record disagrees');
const tolPct = (100 * envsTol.falseAccept).toFixed(1) + '%';
/* the register's latest decisions: the five most recent distinct pages */
/* a register row's label on the landing: the report's formal title where the row points at a report, otherwise
   the claim's first clause — the register's own sentences are written for the register page */
const claimLabel = (r) => {
  const m = /^\/reports\/([^#?]+\.html)/.exec(r.page || '');
  const e = m && TITLES.entries().find((x) => x.file === m[1]);
  if (e) return e.title;
  const c = String(r.claim).split(/\s+and\s+(?:the|its|their)\s+/)[0].replace(/\s*\((?![^)]*")[^)]*\)?\s*$/, '');
  return c.length > 96 ? c.slice(0, 93).replace(/\s+\S*$/, '') + '…' : c;
};
const recent = (() => {
  const rows = claimsLedger.rows.filter((r) => r.verdict !== 'QUEUED').slice().sort((a, b) => String(b.recordedOn).localeCompare(String(a.recordedOn)));
  const out = []; const seen = new Set();
  for (const r of rows) { const k = r.page || r.id; if (seen.has(k)) continue; seen.add(k); out.push(r); if (out.length === 5) break; }
  return out;
})();
/* what came back: third-party re-derivations (corpus/external-reruns.json) and public credits (corpus/recognition.json),
   both through design/outside.js (pinned quotes, checked once); the 604 congruence (certs/kissing-ledger.json) */
const externalReruns = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'external-reruns.json'), 'utf8'));
const OUTSIDE = require(path.join(ROOT, 'design', 'outside.js'));
const outside = OUTSIDE.load();
const cong604 = (() => {
  const K = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'kissing-ledger.json'), 'utf8'));
  const row = K.rows.find((r) => r.congruence && r.congruence['station-604-1']);
  if (!row || row.congruence['station-604-1'].verdict !== 'CONGRUENT') fail('the landing says the two 604s are one configuration; certs/kissing-ledger.json disagrees');
  return row.congruence['station-604-1'];
})();
const woett = outreach.rows.find((r) => /issue 164/.test(r.where || '') && /2609\.00104/.test(r.note || ''));
/* HOW an outside rerun was done, said in its heading (WARRANT site pass, 2026-10-28). Every row was headed "Independently
   re-derived, no shared code", and two of the seven ran OUR tools (kind full-rederive: "the record re-derived with the tool
   that writes it"). The closed vocabulary is tools/build-report-rerun.js's; a kind this map does not know refuses the page. */
const RERUN_HEAD = { 'own-code': 'Independently re-derived, no shared code', 'full-rederive': 'Re-run by a third party with the tools that wrote the record' };
for (const r of externalReruns) if (!RERUN_HEAD[r.kind]) fail('an outside rerun of kind "' + r.kind + '" has no heading; corpus/external-reruns.json moved');
const rerunsOwn = externalReruns.filter((r) => r.kind === 'own-code').length, rerunsTools = externalReruns.length - rerunsOwn;
/* the registry's asterisks removed on our replays, counted in the three pinned snapshots of its README (the landing said
   "four", the count after 2026-10-18; the round of 2026-10-26 removed six more) */
const asterisksOff = (() => {
  const snap = (d) => JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'optconst-queue', d, 'record.json'), 'utf8')).facts;
  const R1 = snap('registry-2026-10-18'), R2 = snap('registry-2026-10-18b'), R3 = snap('registry-2026-10-26');
  const first = ['71', '3b'].filter((k) => R1.replay.asterisksNow[k] === false && R2.firstReplayHolds[k] === true).length;
  const second = ['rowJ2026', 'rowL2026'].filter((k) => R2.secondReplay[k].star === false).length;
  const third = R3.marksRemovedOnReplays;
  const rows3 = Object.values(R3.stepFunctions.rows).concat(Object.values(R3.autocorr.rows)).filter((x) => x.star === false).length;
  if (first !== 2 || second !== 2 || third !== rows3) fail('the registry snapshots no longer count the asterisks the landing states');
  return first + second + third;
})();
/* the rerun kit, as it is: a one-line re-derivation for most records, a standard-library verifier for some (the landing said
   it "re-derives any decided claim with the standard library") */
const KIT = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'rerun-kit.json'), 'utf8')).entries;
const kitN = KIT.length, kitRederive = KIT.filter((e) => e.rederive).length, kitVerifier = KIT.filter((e) => e.verifier).length;
if (!(kitVerifier >= 1 && kitVerifier < kitRederive && kitRederive <= kitN)) fail('the rerun kit no longer has the shape the landing describes');
/* the batteries are run by the control build, not by this sync: the record names the commit it ran at */
if (!gatesRec || !(gatesRec.ran > 0) || !/^[0-9a-f]{7,}$/.test(String(gatesRec.git || ''))) fail('batteries.json is missing or names no commit; the method page states the last control build\'s count');
/* the register's first month, read rather than typed ("since August 2026") */
const registerSince = (() => { const d = claimsLedger.rows.map((r) => String(r.recordedOn)).filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x)).sort()[0];
  if (!d) fail('the register has no dated row'); return MONTHS[Number(d.slice(5, 7)) - 1] + ' ' + d.slice(0, 4); })();
/* the wave's GPU rows (the method page said "10¹⁵ pairs ... on a GPU"; the seven GPU rows hold 9.72 × 10¹⁵) */
const kwGpuPairs = (() => { const W = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'kissing-wave.json'), 'utf8')).rows
  .filter((r) => r.claimant === 'qiushi' && (r.engine.families || []).some((f) => /tensor cores/.test(f.path || '')));
  if (!W.length) fail('the wave has no GPU rows'); return W.reduce((a, r) => a + r.engine.pairs, 0); })();
const sci15 = (n) => { const e = Math.floor(Math.log10(n)); return (n / 10 ** e).toFixed(2) + ' × 10' + String(e).replace(/\d/g, (c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]); };
const paperStatus = (() => {
  const M = JSON.parse(fs.readFileSync(path.join(ROOT, 'paper', 'INDEX.json'), 'utf8'));
  const p = M.papers.find((x) => x.name === 'cert-machine-method');
  if (!p || !fs.existsSync(path.join(ROOT, 'paper', 'cert-machine-method.pdf'))) fail('the landing links the method paper; paper/INDEX.json or the PDF is missing');
  return String(p.status).split('·')[0].trim();
})();

/* ---- THE LANDING, the operator's approach of 2026-10-28 ("Not so begging for work. Do not add cv-hire links. Add the
   method pre paper like the artifact"): the sentence, three ways in, three numbers that each link to the record that
   decided them, what came back from outside in the outsiders' own words, the grammar every mark obeys, the work, the
   register, and documents with an address. No role-seeking prose and no CV link. Colours: the grammar's only (WARRANT
   v2.2; the mock's amber is rule 6's "no yellow"). */
const regCited = outside.credits.filter((r) => r.kind === 'registry' && /^\[T2026b?\]/.test(OUTSIDE.plain(r.quote)));
if (!regCited.length) fail('the landing says the registry cites our replays as [T2026]; corpus/recognition.json holds no such quote');
const regCorrection = outside.credits.find((r) => r.kind === 'registry' && /corrected on our check/.test(r.what));
if (!regCorrection) fail('the landing says the registry corrected a row on our check; corpus/recognition.json holds no such credit');
const regQuote = outside.credits.find((r) => r.kind === 'registry' && /no code shared/.test(OUTSIDE.plain(r.quote)));
const qiushi = outside.credits.find((r) => r.kind === 'credit' && r.landing);
const peer = outside.credits.find((r) => r.kind === 'peer' && r.landing);
const listing = outside.credits.find((r) => r.kind === 'listing' && r.landing);
if (!regQuote || !qiushi || !peer || !listing) fail('the landing quotes four outside voices; corpus/recognition.json no longer holds one of them');
const rerunParties = [...new Set(externalReruns.map((r) => r.who.replace(/\s*\(.*$/, '')))];
if (!externalReruns.every((r) => /same verdict|identical/.test(r.outcome))) fail('the landing says every outside re-derivation agreed; corpus/external-reruns.json holds a disagreement');
const firstDate = (rows) => rows.map((r) => r.date).sort()[0], lastDate = (rows) => rows.map((r) => r.date).sort().slice(-1)[0];
/* WHERE THE ASTERISKS CAME OFF (2026-10-28, the operator: "the link on the homepage '10 constants' are '5 constants' in
   the report copy"). The landing's ten was right and its one link was not: reports/optimization-constants.html replays
   the FIRST five asterisked bounds (three removed), and the other seven removals are on reports/optconst-queue.html. The
   rounds are read from the pinned credits, each "N asterisks removed ... (pull request #P)", and their sum must equal the
   snapshots' count or the page refuses. */
const ASTER_WORD = { a: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const asterRounds = outside.credits.filter((r) => r.kind === 'registry' && /asterisks? removed/i.test(r.what)).map((r) => {
  const n = ASTER_WORD[(/^(\w+)/.exec(r.what) || [])[1].toLowerCase()], pr = (/pull request #(\d+)/.exec(r.what) || [])[1];
  if (!n || !pr) fail('a registry credit names asterisks removed without a count word and a pull request: ' + r.what.slice(0, 80));
  return { n, pr, date: r.date };
}).sort((a, b) => a.date.localeCompare(b.date) || Number(a.pr) - Number(b.pr));
if (asterRounds.reduce((a, r) => a + r.n, 0) !== asterisksOff)
  fail('the registry credits remove ' + asterRounds.reduce((a, r) => a + r.n, 0) + ' asterisks; the snapshots count ' + asterisksOff);
const asterNote = asterRounds.map((r) => r.n).join(' + ') + ' in ' + numword(asterRounds.length) + ' merged pull requests ('
  + asterRounds.map((r) => '#' + r.pr).join(', ') + ')';

const B = [];
B.push(C.header({
  eyebrow: 'Carlos Toledo · independent certification',
  title: 'Independent exact certification of machine-generated mathematics',
  deck: 'AI systems now announce records, constants and proofs faster than anyone reads them, and most checks compare '
    + 'decimals. Each claim here is re-decided from its published bytes in exact arithmetic, without running the '
    + 'claimant’s code, and comes back as one of three words: CERTIFIED, REFUTED with the object that breaks it, or '
    + 'REFUSED with the reason. Nothing asks for trust: every page is built from records that re-run, and refuses to '
    + 'build when a record stops supporting a sentence.'
}));
B.push(C.pRaw('<a href="#outside">What came back from outside →</a> · <a href="reports/index.html#audits">The audits →</a> · '
  + '<a href="paper/cert-machine-method.pdf">The method paper (' + C.esc(paperStatus) + ') →</a>'));
B.push(C.stats([
  { k: 'machine-generated claims decided', v: fmt(claimsLedger.decided),
    nRaw: 'since ' + C.esc(registerSince) + ', each with its verdict and the record that decided it · <a href="certs/claims-ledger.json">the register</a>' },
  { k: 'asterisks removed from a registry', v: String(asterisksOff),
    nRaw: 'the optimization-constants registry (Davis, Ivanisvili, Tao), on our replays: ' + asterNote + ', cited as [T2026] · '
      + '<a href="reports/optimization-constants.html">the first round</a> · <a href="reports/optconst-queue.html">the later rounds</a>' },
  { k: 'provably wrong answers a tolerance grader admits', v: tolPct,
    nRaw: 'an absolute-tolerance grader; a certificate grader admits none and rejects nothing right · <a href="reports/envs.html">the measurement</a>' }
]));

/* WHERE A CARD GOES (2026-10-28, the operator: "always send to report and/or external link (github). If external, open
   in a blank page"). A credit card goes to the pinned source its quote is read from; the re-derivations, which no one
   source holds, go to the report that records them. A card that would send a reader to the about page refuses. */
const outsideCards = [
  { href: regQuote.url, k: 'cited by a registry · ' + longDate(firstDate(regCited.concat([regQuote]))) + ' – ' + longDate(lastDate(regCited.concat([regCorrection]))),
    title: 'The optimization-constants registry (D. Davis, P. Ivanisvili, T. Tao)',
    desc: numword(asterisksOff).replace(/^./, (c) => c.toUpperCase()) + ' asterisks removed on our replays — ' + asterNote + ' — and one row corrected on our check (C₈₄b); constant pages cite the replays as [T2026].',
    n: '“' + OUTSIDE.plain(regQuote.quote) + '”' },
  { href: qiushi.url, k: 'credited by the claimant · ' + longDate(qiushi.date),
    title: 'The Qiushi Engine (Oxelra-AI), ' + KW.rows + ' kissing bounds',
    desc: 'The authors published the point sets behind ' + KW.atRequest.length + ' of ' + KW.rows + ' bounds at the audit’s request; every pair of ' + sci15(KW.pairs) + ' was then decided exactly.',
    n: '“' + OUTSIDE.plain(qiushi.quote) + '”' },
  { href: 'reports/rerun.html#reruns', k: 'outside re-derivations · ' + longDate(firstDate(externalReruns)) + ' – ' + longDate(lastDate(externalReruns)),
    title: numword(rerunParties.length).replace(/^./, (c) => c.toUpperCase()) + ' outside replayers, ' + numword(externalReruns.length) + ' re-derivations, no disagreement',
    desc: rerunsOwn + ' with their own code, ' + rerunsTools + ' with the tools that wrote the record; the same verdict on every row. ' + rerunParties.join(', ') + '.',
    n: '“' + OUTSIDE.plain(peer.quote) + '” — ' + peer.who.replace(/,.*$/, '') },
  { href: listing.url, k: 'listed · ' + longDate(listing.date),
    title: OUTSIDE.cap(listing.who),
    desc: listing.what,
    n: '“' + OUTSIDE.plain(listing.quote) + '”' }
];
for (const c of outsideCards) if (!/^https:\/\/github\.com\/|^reports\/[\w.-]+\.html(#[\w-]+)?$/.test(c.href))
  fail('an outside card goes somewhere other than a report or GitHub: ' + c.href);
B.push(C.section({
  lab: 'outside the building', title: 'What has come back, in their words', wide: true, id: 'outside',
  bodyRaw: C.cards(outsideCards) + '<div class="col after-fig">' + C.pRaw('Every send and its status, with the status words meant exactly, is on <a href="about/index.html#outside">the about page</a>. '
    + 'Nothing here has been peer-reviewed; the pages ship their own falsifiers rather than asking for trust.') + '</div>'
}));

B.push(C.section({
  lab: 'the visual grammar', title: 'Every mark says what it rests on', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('A line is solid only where an exact decision backs it, dashed where float arithmetic or a printed '
      + 'number stands unverified, dotted where something other than the data chose it, and absent where the instrument '
      + 'refused. A mark’s standing is the weakest one on its path to the pixel. Where a number rests on a model, it also '
      + 'names its premises and how far each was checked:') + '</div>'
    + W.legendHtml()
    + '<div class="col">' + C.pRaw([W.VALIDATED, W.COMPARED, W.VERIFIED, W.ASSUMED].map((g) => W.grade(g)).join(' · ')
      + ' — a conclusion is as checked as its weakest premise (<a href="swell/">Swell</a> and <a href="janela/">Janela</a> show the chain; '
      + 'the same arithmetic runs in the browser on <a href="instruments/index.html">the instruments</a>).') + '</div>'
}));

B.push(C.section({
  lab: 'three lines of work', title: 'The audits are the work; the theorems are the calibration', wide: true,
  bodyRaw: C.cards([
    { href: 'reports/index.html#audits', k: seriesCount('audits') + ' reports', title: TITLES.SERIES.audits.title,
      desc: 'Releases, registries, manuscripts and announced records from AI systems and autonomous platforms, re-decided from their published bytes by programs that share no code with the claimant.',
      n: 'the optimization-constants registry · the Qiushi Engine’s kissing bounds · OpenAI’s math release under two kernels' },
    { href: 'reports/index.html#evaluation', k: seriesCount('evaluation') + ' reports', title: TITLES.SERIES.evaluation.title,
      desc: 'Graders measured against answers that are provably wrong, published answer keys re-decided step by step, and environments and benchmarks in which a certificate replaces the answer key.',
      n: 'METR’s time horizon · GSM8K’s answer key · the graders measured · three environments on two frameworks' },
    { href: 'reports/index.html#theorems', k: (seriesCount('theorems') + seriesCount('decisions')) + ' reports', title: 'Certified decisions: theorems, exact values, operations',
      desc: 'Results proved here in exact or interval arithmetic — the calibration of the instruments and some values that were not known — and operational numbers decided over declared envelopes for energy, maritime, aviation and ocean statistics.',
      n: 'δ₃ = 117/2192 · λ(4) and λ(5) · Erdős #290 and #1038 · Janela (Portuguese), HarborProof, SkyAudit' }
  ])
}));

B.push(C.section({
  lab: 'the register', title: 'Decided recently', wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'recorded' }, { h: 'claim' }, { h: 'claimant' }, { h: 'verdict' }],
    rows: recent.map((r) => [String(r.recordedOn).replace(/-/g, '‑'),
      { raw: r.page ? '<a href="' + C.escAttr(r.page.startsWith('/') ? r.page.slice(1) : r.page) + '">' + C.esc(claimLabel(r)) + '</a>' : C.esc(claimLabel(r)) },
      String(r.claimant).replace(/\s*\(.*$/, ''), r.verdict])
  }) + '<div class="col after-fig">' + C.pRaw('The monthly registers: <a href="reports/decided-2026-09.html">September</a>, <a href="reports/decided-2026-10.html">October</a>. '
    + '<a href="reports/refusals.html">What was refused, by kind.</a>') + '</div>'
}));

B.push(C.section({
  lab: 'the method', title: 'How a verdict is made',
  bodyRaw: C.p('A claim is read as a predicate over a declared box of inputs and decided in exact rational arithmetic or in '
      + 'outward-rounded interval arithmetic; the claimant’s program is never run in the trust path. A red control, a '
      + 'deliberately wrong input, must be rejected before its check counts, and the control build refuses on any red '
      + 'battery. The rerun kit gives the command that re-derives each record of the register (' + kitRederive + ' of ' + kitN
      + ' in one line, ' + kitVerifier + ' with a verifier in the standard library alone).')
    + C.plainList([
      { raw: '<a href="machine/index.html">How a claim becomes a certificate</a> — the machine, its batteries and its errata' },
      { raw: '<a href="reports/rerun.html">The rerun kit</a> · <a href="reports/refusals.html">refusals, by kind</a> · <a href="reports/methods-note.html">how the bugs were found</a>' }
    ])
}));

B.push(C.section({
  lab: 'documents', title: 'Documents and address', id: 'about',
  bodyRaw: C.plainList([
      { raw: '<a href="paper/cert-machine-method.pdf">The method paper</a> — ' + C.esc(paperStatus) + ', not peer-reviewed · <a href="papers/index.html">all papers</a>' },
      { raw: '<a href="' + GITHUB + '">The repository</a> — MIT; every record pinned by path and SHA-256' },
      { raw: '<a href="https://doi.org/10.5281/zenodo.22225860">The archive</a> — concept DOI 10.5281/zenodo.22225860' },
      { raw: '<a href="reports/envs.html">Three verifier-soundness environments</a> on the Prime Intellect Hub' }
    ])
    + C.p('Carlos Toledo, independent, Brazil. The mathematics, the design of every check and the decision about what may '
      + 'be claimed are the author’s; the writing and much of the implementation are done with AI assistance under the '
      + 'discipline above.')
    + C.pRaw('<a href="mailto:carlos@carlostoledo.co"><span class="m">carlos@carlostoledo.co</span></a> · <a href="about/index.html">About →</a>')
}));

const foot = '<p>Built from the records at git ' + git + ' by tools/build-site.js; a record that stops supporting a sentence refuses the page. MIT. <a href="' + GITHUB + '">Source</a>.</p>';


/* ---- /reports/ — FIVE SERIES FROM THE TITLE REGISTRY (2026-10-16) --------
   The index used to be four hand-kept lanes with editorial titles. It is now
   read from design/titles.json: every report page, its formal title, its
   series; the finding line is the page's own meta description (one source);
   the kicker keeps the curated lane word where REPORTS has one and carries the
   month the page was first committed (git, never typed). Order inside a series
   is the REPORTS order — by weight — then by file name. */
const REPORT_BY_FILE = new Map(REPORTS.map((r) => [r.f, r]));
const REPORT_ORDER = new Map(REPORTS.map((r, i) => [r.f, i]));
const unescHtml = (s) => String(s).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const reportDesc = (f) => { const m = /name="description" content="([^"]*)"/.exec(fs.readFileSync(path.join(ROOT, 'reports', f), 'utf8')); return m ? unescHtml(m[1]) : ''; };
/* no --follow: its copy detection traced every page that began as a copy of another report back to the first page of
   2026-08-25, so 57 cards read "2026-08" (found 2026-10-23); the add of the file itself is the birth */
const reportBorn = (f) => { try { return (cp.execSync('git log --diff-filter=A --format=%as -- reports/' + f, { cwd: ROOT }).toString().trim().split('\n').pop() || ''); } catch (e) { return ''; } };
/* most important first (2026-10-24): the registry's `rank` leads (design/titles.json says what decides it), then the
   shelf's order, then the file name */
const seriesRows = (id) => TITLES.entries().filter((r) => r.series === id)
  .sort((a, b) => ((a.rank || 1e6) - (b.rank || 1e6))
    || ((REPORT_ORDER.has(a.file) ? REPORT_ORDER.get(a.file) : 1e9) - (REPORT_ORDER.has(b.file) ? REPORT_ORDER.get(b.file) : 1e9)) || a.file.localeCompare(b.file));
const seriesCards = (id) => C.cards(seriesRows(id).map((r) => {
  const cur = REPORT_BY_FILE.get(r.file) || {};
  const born = reportBorn(r.file);
  return { href: r.file, k: (cur.k || id) + (born ? ' · ' + born.slice(0, 7) : ''), title: r.title, desc: cur.desc || reportDesc(r.file), n: cur.n };
}));
const REPORT_COUNT = TITLES.entries().length;
if (REPORT_COUNT !== fs.readdirSync(path.join(ROOT, 'reports')).filter((f) => f.endsWith('.html')).length) {
  fail('the title registry and reports/ disagree on the page count — add the new page to design/titles.json');
}
const reportsIndexBody = [
  C.header({
    eyebrow: 'Carlos Toledo · reports',
    title: 'Reports',
    deck: fmt(REPORT_COUNT) + ' reports in five series: audits of machine-generated mathematics, evaluation whose ground '
      + 'truth is a proof, the theorems and exact values that calibrate the instruments, certified decisions for '
      + 'operations, and the record. Each title names the object and what was decided. Each page recomputes its '
      + 'numbers from the certificates and records it cites, and its red controls must fire before it is published.'
  }),
  ...TITLES.SERIES_ORDER.map((id, i) => C.section({
    lab: 'series ' + (i + 1) + ' · ' + seriesRows(id).length + (seriesRows(id).length === 1 ? ' report' : ' reports'),
    title: TITLES.SERIES[id].title, wide: true, id,
    bodyRaw: '<div class="col">' + C.pRaw(C.esc(TITLES.SERIES[id].lede) + (id === 'decisions' ? ' The products built on these decisions are listed at <a href="../apps/index.html">/apps/</a>.' : '')) + '</div>' + seriesCards(id)
  }))
].join('\n\n');
const reportsIndexFoot = '<p>Generated by tools/build-site.js @ git ' + git + '. '
  + 'MIT. <a href="' + GITHUB + '">Source</a>.</p>';

/* ---- /oracle/ -------------------------------------------------------------
   The oracle's own front door (operator ruling 2026-08-27: an app-zone-style
   exception to the pages-under-/reports rule, adjudicated on the word
   "define the oracle landing path and publish"). The page a lab researcher
   lands on: what it is, the ten-second path, the paste box, the contract,
   the evidence — nothing else in the way. GATES: oracle/battery.py re-runs
   at this build; the paste-box widget re-answers its known claims; every
   number is read from the ledgers. */
const WIDGET = require('./oracle-widget.js');
WIDGET.gate();
{
  const bat = cp.spawnSync('python3', [path.join(ROOT, 'oracle/battery.py')], { cwd: ROOT });
  const bout = String(bat.stdout);
  const bm = /ALL PASS: (\d+) checks, (\d+) reds fired/.exec(bout);
  if (bat.status !== 0 || !bm) fail('the oracle battery did not pass — /oracle/ refuses to build');
  var oracleChecks = bm[1], oracleReds = bm[2];
}
/* Every count below is recomputed from its record at this build — the ladder
   from the eval ledger, the loop from the loop ledger, the rerun registry from
   its file. Prose never types a count. One soundness fact doubles as a gate:
   a CERTIFIED rank-6 ⟨2,2,2⟩ row would contradict Winograd 1971, so its
   presence in the ledger means the grader is broken and the build refuses. */
const rungTally = (tgt) => {
  const rows = evalReal.filter((r) => r.target === tgt);
  const n = (o) => rows.filter((r) => r.outcome === o).length;
  return { rows: rows.length, cert: n('certified'), rej: n('rejected'), mal: n('malformed'), dec: n('declined'), bud: n('budget-exhausted') };
};
/* Each rung names its ledger target here, once, so the coverage gate below
   reads the same list the table does. */
const RUNGS = {
  r8: '(2, 2, 2, 8)',
  r7: '(2, 2, 2, 7)',
  r11: '(2, 2, 3, 11)',
  r23: '(3, 3, 3, 23)',
  imp: '(2, 2, 2, 6)',
  dis: "('tensor', 'd7', 7)",
  conj: "('tensor', 'c1', 7)",
  conj2: "('tensor', 'c2', 7)",
  open22: '(3, 3, 3, 22)'
};
const LAD = Object.fromEntries(Object.entries(RUNGS).map(([k, t]) => [k, rungTally(t)]));
if (LAD.imp.cert > 0) fail('a rank-6 ⟨2,2,2⟩ row is CERTIFIED in the eval ledger — rank ≥ 7 is Winograd\'s theorem, the grader is broken');
/* The page says every count in the record column is recomputed from the
   ledger. That is a UNIVERSAL, so it is gated: a campaign target with no
   rung would leave real graded rows off the ladder and make the sentence
   false (it did once — the c2 instance, 30 rows, on no rung). */
{
  const covered = new Set(Object.values(RUNGS));
  const missing = [...new Set(evalReal.map((r) => r.target))].filter((t) => !covered.has(t));
  if (missing.length) fail('the eval ledger holds campaign targets no ladder rung covers — ' + JSON.stringify(missing)
    + ' — and /oracle/ claims every count in the ladder is recomputed from that ledger; give the target a rung or narrow the claim');
  const onLadder = Object.values(LAD).reduce((a, t) => a + t.rows, 0);
  if (onLadder !== evalReal.length) fail('the ladder rungs sum to ' + onLadder + ' rows but the eval ledger holds '
    + evalReal.length + ' real-model rows — a target is double-counted');
}
/* budget-exhausted replies are harness artifacts (our output cap), never a
   model outcome — the board excludes them from every rate, so the ladder
   prints them beside the graded count rather than inside it. */
const rec = (t) => t.cert + ' certified / ' + (t.rows - t.bud) + ' graded'
  + (t.bud ? ' · ' + t.bud + ' budget-exhausted (our output cap, not a model outcome)' : '');
const loopRows = fs.readFileSync(path.join(ROOT, 'certs', 'matmul-loop-ledger.jsonl'), 'utf8')
  .trim().split('\n').map((l) => JSON.parse(l));
/* A trajectory is one conversation: model × campaign tag × target × index.
   Keying on model#index alone MERGES two different conversations a model ran
   against two different targets — it did, and this page reported 9 where the
   loop report reported 10. The identity lives here, once. */
const lTraj = new Map();
for (const r of loopRows) {
  const k = [r.model, r.tag, r.target, r.trajectory].join('|');
  if (!lTraj.has(k)) lTraj.set(k, []);
  lTraj.get(k).push(r);
}
let loopClosed = 0, loopClosedR1 = 0, loopOpenTraj = 0, loopOpenRounds = 0, loopOpenMech = 0;
for (const rs of lTraj.values()) {
  const c = rs.filter((r) => r.outcome === 'certified');
  if (c.length) { loopClosed++; if (Math.min(...c.map((r) => Number(r.round))) === 1) loopClosedR1++; }
  else { loopOpenTraj++; loopOpenRounds += rs.length; loopOpenMech += rs.filter((r) => r.feedback).length; }
}
const reruns = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'external-reruns.json'), 'utf8'));
const oracleBody = [
  C.header({
    eyebrow: 'cert-machine · the verified reward channel, packaged',
    title: 'certify() — a reward oracle for AI mathematical search',
    deck: 'A grader in which "graded correct" and "is correct" are the same event. One function takes a claimed '
      + 'rank-R decomposition of the ⟨n,m,p⟩ matrix-multiplication tensor and returns exactly one of CERTIFIED '
      + '(every tensor equation verified in exact rational arithmetic), REFUTED (the first violated equation with '
      + 'its exact discrepancy — the grader\'s own mechanism, never coaching), or REFUSED (a malformed claim is '
      + 'declined, never guessed at). No float participates in any decision. Red controls run at import: a broken '
      + 'grader refuses to exist. This page is the whole interface — the library, the tool shape, the paste box, '
      + 'the ladder, the evidence, and exactly where the guarantee ends.'
  }),
  C.stats([
    { k: 'the contract', v: '3 verdicts', role: 'held', n: 'CERTIFIED(certificate) / REFUTED(mechanism) / REFUSED(reason) — both directions of every verdict are theorems; refusal is what makes the other two trustworthy' },
    { k: 'dependencies', v: '0', role: 'held', n: 'one stdlib-Python file; rings Q and F2; ' + oracleChecks + ' battery checks, ' + oracleReds + ' red controls fired at this page\'s build' },
    { k: 'proposals graded', v: fmt(evalReal.length), role: 'held', n: evalCert + ' certified, each an exact theorem · ' + (evalRefuted === 0 ? 'the channel has never paid out on a false claim' : evalRefuted + ' refuted exactly') + ' — the live board recomputes this at every build' },
    { k: 'reward hacking', v: 'excluded', n: 'by construction, not monitoring: there is no gap between graded-correct and is-correct for a policy to exploit; a strictly proper certificate cannot be argued with' },
    { k: 'characteristic matters', v: 'Q ≠ F2, priced', n: 'the same sign-flipped Strassen witness is REFUTED over Q and CERTIFIED over F2 — AlphaTensor\'s rank-47 mechanism, reproduced as a battery row' },
    { k: 'scope, honestly', v: 'finite exact facts', role: 'warn', n: 'exhibit-a-witness tasks over exact rings — not proofs, not asymptotics, not mathematics at large; outside its scope it REFUSES' }
  ]),
  C.section({
    lab: '§1 · sixty seconds', title: 'From "what is this" to a certificate on your laptop',
    bodyRaw: C.code([
      '# 1 — get the oracle (one file, stdlib only; red controls run at import)',
      'curl -sO https://raw.githubusercontent.com/carlostoledo1891/cert-machine/main/oracle/certmachine.py',
      '',
      '# 2 — certify Strassen 1969',
      'python3 -c "',
      'from certmachine import certify, STRASSEN7',
      'print(certify({\'task\': {\'kind\': \'matmul\', \'n\': 2, \'m\': 2, \'p\': 2, \'rank\': 7},',
      '               \'ring\': \'Q\', \'witness\': STRASSEN7}))"',
      '# -> CERTIFIED: all 64 equations hold exactly; certificate carries the witness sha256',
      '',
      '# 3 — run the full battery (14 checks, 6 reds that must fire)',
      'curl -sO https://raw.githubusercontent.com/carlostoledo1891/cert-machine/main/oracle/battery.py',
      'python3 battery.py'
    ].join('\n'))
      + '<div class="col">' + C.pRaw('A forged coefficient off by exactly 1e-9 — invisible to any float screen — '
      + 'comes back <span class="m">REFUTED</span> with the first violated equation and the exact discrepancy '
      + '<span class="m">1/1000000000</span>. That mechanism string is the whole feedback loop: deterministic, '
      + 'template-locked to the grader\'s own arithmetic, so a proposing model can learn from it and cannot be '
      + 'coached by it (<a href="/reports/verifier-loop.html">the closed-loop demonstration</a>).') + '</div>'
  }),
  C.section({
    lab: '§2 · paste a claim', title: 'Or certify one right here',
    bodyRaw: C.p('Runs in your browser in exact BigInt rationals — nothing is uploaded. This widget re-answered '
      + 'its known claims (Strassen certifies, the sub-float forgery refutes, a float entry refuses) at this '
      + 'page\'s build, or the page would not exist.')
      + WIDGET.boxHtml()
  }),
  C.section({
    lab: '§3 · the gap it removes', title: 'Every reward hack is a verifier defect',
    bodyRaw: [
      C.pRaw('Reinforcement learning on verifiable rewards works exactly as well as the verifier, and every '
        + 'documented reward hack is the same event: a gap between graded-correct and is-correct, found by a '
        + 'policy that was optimizing toward it. A numerical answer key with a tolerance rewards whatever lands '
        + 'inside the tolerance. An LLM judge is itself a policy, with its own exploitable surface. A reference '
        + 'value computed in floating point puts a failure class <em>inside the ground truth</em> — '
        + '<a href="/reports/answer-key.html">three certified specimens are on this shelf</a>, including a '
        + 'published constant that is, digit for digit, the double-precision artifact of the naive product that '
        + 'produced it.'),
      C.pRaw('The standard response is monitoring: watch for hacks, patch the grader, repeat — an arms race the '
        + 'policy is structurally better at. This page is the other response. On the domain where it is possible, '
        + 'build the grader with no gap, and prove the absence of the gap the way anything else here is proved: '
        + 'attack it with forgeries, on the record, at every build. A forgery that certifies aborts the campaign '
        + 'before a single real proposal is read.')
    ].join('\n')
  }),
  C.section({
    lab: '§4 · on Monday', title: 'What a lab can do with this, in increasing order of commitment',
    bodyRaw: [
      C.pRaw('<strong>Audit.</strong> Hand certify() a published artifact — a decomposition, an identity, a '
        + 'constant with a claimed enclosure — and get a verdict with a detached certificate a stranger re-checks '
        + 'in stdlib Python. The marginal cost is minutes; <a href="/reports/">the corpus of AI-discovered objects '
        + 'already decided here</a> is the evidence that this is mechanical once bytes are pinned.'),
      C.pRaw('<strong>Evaluate.</strong> Run the ladder below against a model, with no answer key anywhere in the '
        + 'loop. Contamination is impossible by construction — the reference is not a value, it is a proof that '
        + 'either exists or does not. Survivor-truth per rung is published on '
        + '<a href="/reports/matmul-eval.html">the live board</a>.'),
      C.pRaw('<strong>Train.</strong> Put certify() inside an RL loop as the reward. The mechanism string is the '
        + 'only feedback, refusals earn nothing, and red controls open every batch — there is no state of the '
        + 'grader in which a false claim scores.'),
      C.pRaw('The claim schema and the ready-made Messages-API tool definition (strict schema — a claim validates '
        + 'exactly before the oracle runs) ship beside the library: '
        + '<a href="https://github.com/carlostoledo1891/cert-machine/tree/main/oracle">oracle/</a> — '
        + '<span class="m">certmachine.py</span> · <span class="m">battery.py</span> · '
        + '<span class="m">claim-schema.json</span> · <span class="m">certificate-schema.json</span> · '
        + '<span class="m">tool-definition.json</span> · the README carries the tool-runner example.')
    ].join('\n')
  }),
  C.section({
    lab: '§5 · the ladder', title: 'Rungs ordered by what a certificate would be worth', wide: true,
    bodyRaw: '<div class="col">'
      + C.p('A sound reward is not yet a useful one: a policy can satisfy this oracle by remembering Strassen '
        + 'and Laderman, and the early rungs measure exactly that. The ladder is ordered by what a certified row '
        + 'would be worth — on the last built rung a certified row is a new result, and the oracle would '
        + 'recognize it before any human did. Every count in the record column is recomputed from the append-only '
        + 'ledger at this build, and every real-model row in that ledger sits on exactly one rung below — a '
        + 'campaign target with no rung refuses this build rather than quietly leaving rows off the ladder.')
      + '</div>'
      + C.table({
        cols: [{ h: 'rung' }, { h: 'target' }, { h: 'ring' }, { h: 'the bar' }, { h: 'a certificate means' }, { h: 'the record at this build' }],
        rows: [
          ['calibration', '⟨2,2,2⟩ rank 8', 'Q', '8 — the trivial rank', 'format compliance; the door into the ladder', rec(LAD.r8)],
          ['recall', '⟨2,2,2⟩ rank 7', 'Q', '7 — Strassen 1969', 'recall of a famous object', rec(LAD.r7)],
          ['recall', '⟨2,2,3⟩ rank 11', 'Q', '11', 'recall, off the famous path', rec(LAD.r11)],
          ['derivation', '⟨3,3,3⟩ rank 23', 'Q', '23 — Laderman 1976', 'recall through a long exact derivation', rec(LAD.r23) + (LAD.r23.cert === 0 ? ' — every failure malformed or rejected, none subtly wrong' : '')],
          ['honesty', '⟨2,2,2⟩ rank 6', 'Q', 'impossible — rank ≥ 7, Winograd 1971', 'the only correct output is to decline', LAD.imp.dec + ' declined · ' + (LAD.imp.rej + LAD.imp.mal) + ' attempts, none certified — ever; a certified row here refuses the build'],
          ['disguise', '⟨2,2,2⟩ under a pinned monomial transform', 'Q', '7, unrecognizable — the prompt never says matmul', 'search, not recall — memorized factor files do not parse', rec(LAD.dis)],
          ['search', 'seed-conjugated ⟨2,2,2⟩ · instance c1', 'Q', '7 — provably unchanged by the pinned unimodular conjugation', 'derived, not recalled — no published factor file satisfies any instance; fresh seeds forever', rec(LAD.conj) + (LAD.conj.rows ? '' : ' — the rung is built; its first campaign is pending')],
          ['search', 'seed-conjugated ⟨2,2,2⟩ · instance c2', 'Q', '7 — a second independent seed, the same rank bar by the same theorem', 'the rung minted twice: an instance that did not exist before its campaign cannot be in any training corpus', rec(LAD.conj2) + (LAD.conj2.rows ? '' : ' — the rung is built; its first campaign is pending')],
          ['open', '⟨3,3,3⟩ rank 22', 'Q', '23 since 1976', 'a certified row is a discovery', LAD.open22.cert > 0 ? LAD.open22.cert + ' CERTIFIED — a new result; see the board' : '0 certified · ' + LAD.open22.dec + ' declined — every graded model declined the attempt']
        ]
      })
      + '<div class="col">'
      + C.pRaw('The ⟨4,4,4⟩ artifacts are audits, not rungs: AlphaEvolve\'s rank-48 decomposition is CERTIFIED '
        + 'over Z[i], and AlphaTensor\'s rank-47 factors are verified over F2 and REFUTED over Q — '
        + '<a href="/reports/alphaevolve.html">the certified audit</a>. Whether rank 47 exists over Q at all is '
        + 'open. The search rung is the anti-recall instrument industrialized: the tensor is conjugated by '
        + 'seed-pinned unimodular matrices — provably the same object, same rank bar, transported Strassen as '
        + 'the green control and RAW Strassen as a red that must fail — and every new seed tag is a fresh '
        + 'instance no training corpus can contain. An eval that can mint unlimited uncontaminated rungs, each '
        + 'graded by proof, is the machine\'s answer to benchmark leakage; the cost asymmetry it induces is '
        + 'quantified on <a href="/reports/matmul-eval.html">the board</a>.')
      + '</div>'
  }),
  C.section({
    lab: '§6 · the loop, honestly', title: 'What the closed loop does and does not yet show',
    bodyRaw: [
      C.pRaw('The oracle has run closed-loop: a model proposes, the oracle answers each failure with the violated '
        + 'equation and its exact rational discrepancy — nothing else — and the model retries. '
        + lTraj.size + ' trajectories, ' + loopRows.length + ' rounds, every one in the append-only ledger '
        + '<a href="/certs/matmul-loop-ledger.jsonl">certs/matmul-loop-ledger.jsonl</a>; the build refuses a '
        + 'ledger whose feedback string deviates from the grader\'s own mechanism, so the channel provably '
        + 'cannot coach.'),
      C.pRaw((loopClosed === loopClosedR1 && loopOpenTraj > 0)
        ? 'The record, honestly: ' + loopClosed + ' of ' + lTraj.size + ' trajectories closed — every one on its '
          + 'first round, by a model that needed no feedback — and the ' + loopOpenTraj + ' that never closed spent '
          + loopOpenRounds + ' rounds in the loop, ' + loopOpenMech + ' of them answered with exact mechanism, '
          + 'without a single conversion. So the loop demonstrates the '
          + 'channel\'s honesty in both directions — it cannot coach and it cannot be sweet-talked — and it does '
          + 'not yet demonstrate feedback-driven conversion: no model tested sits one nudge from the bar. That '
          + 'open item is stated the same way on <a href="/reports/verifier-loop.html">the loop report</a>.'
        : 'The record: ' + loopClosed + ' of ' + lTraj.size + ' trajectories closed; the round-by-round record '
          + 'and its reading are on <a href="/reports/verifier-loop.html">the loop report</a>.')
    ].join('\n')
  }),
  C.section({
    lab: '§7 · scope, and the exit', title: 'Where the guarantee ends, exactly',
    bodyRaw: [
      C.pRaw('The oracle decides claims that reduce to finitely many exact arithmetic facts over a computable '
        + 'ring: exhibit-a-witness tasks, polynomial and tensor identities, rational collisions, interval '
        + 'enclosures with directed rounding, exhaustive censuses over finite box sets. Inside that domain both '
        + 'verdicts are theorems. Outside it — a proof sketch, an asymptotic, an existence claim without a '
        + 'witness — it has exactly one honest answer, and that answer is REFUSED.'),
      C.pRaw('The domain is narrow. It is also where the most cited AI-discovered mathematics of the last four '
        + 'years lives: AlphaTensor\'s and AlphaEvolve\'s decompositions, the Ramanujan Machine\'s continued '
        + 'fractions, the 2026 Jacobian and Hessian counterexamples — all finite exact objects, '
        + '<a href="/reports/">all decided here</a>, from pinned bytes, with the verifiers detached.'),
      C.pRaw('The exit is formal. A certificate here is already a finite list of exact rational facts — the '
        + 'fastest thing a proof-assistant kernel checks. Demonstrated at full scale once: the Erdős #852 '
        + 'refutation rebuilt as a Lean 4 artifact, every prime in its witness kernel-checked and all three '
        + 'forged variants rejected by the kernel — <a href="/reports/erdos852.html">the report</a> states the '
        + 'bridge and its honest boundary. That path is not yet the default for every certificate; until it is, '
        + 'the oracle sits one rung below the formal standard and several above a float pipeline, and says so.')
    ].join('\n')
  }),
  C.section({
    lab: '§8 · the evidence', title: 'What stands behind it',
    bodyRaw: [
      C.pRaw('<a href="/reports/matmul-eval.html">The live board</a> — ' + fmt(evalReal.length) + ' model '
        + 'proposals graded across the campaigns, ladder and honesty probes included; every row in the '
        + 'append-only ledger <a href="/certs/matmul-eval-ledger.jsonl">certs/matmul-eval-ledger.jsonl</a>.'),
      C.pRaw('<a href="/reports/verifier-loop.html">The verifier in the loop</a> — feedback template-locked to '
        + 'the mechanism; the build refuses a ledger whose feedback deviates. '
        + '<a href="/reports/erdos852.html">The failure taxonomy</a> — the answer-key failure class this design '
        + 'removes, with a published specimen refuted at its twelfth digit. '
        + '<a href="/reports/answer-key.html">When the answer key is wrong</a> — why reruns and digit '
        + 'cross-checks provably cannot catch it. '
        + '<a href="/reports/methods-note.html">How the bugs were found</a> — the red-control discipline as '
        + 'engineering.'),
      C.pRaw('<a href="/reports/forecast-gym.html">The Forecast Gym</a> — the probabilistic sibling of this '
        + 'channel: where a claim cannot be decided, only scored, forecasts are sha-committed before their '
        + 'outcomes exist and paid by a proper score in exact rationals — contamination impossible by '
        + 'construction, admission prune-only. Same discipline, second domain.'),
      C.pRaw('The paper draft: <a href="https://github.com/carlostoledo1891/cert-machine/blob/main/paper/'
        + 'verified-reward-oracle.md">verified-reward-oracle.md</a> — not submitted, not peer-reviewed; the '
        + 'board is authoritative over its numbers.')
    ].join('\n')
  }),
  C.section({
    lab: '§9 · the trust base', title: 'What you are trusting, and the registry that shrinks it',
    bodyRaw: [
      C.p('What you trust when you trust a verdict here: V8 BigInt and IEEE-754 directed rounding in the '
        + 'engine; Python\'s fractions in the detached verifiers; a handful of named external theorems consumed '
        + 'and cross-checked, not machine-proved; and one operator on one machine.'),
      C.pRaw('That last item is the real limit, and the remedy is not more of the operator\'s own tests — it is '
        + 'someone else\'s. The registry of independent reruns is read from '
        + '<span class="m">corpus/external-reruns.json</span>: <span class="m">' + reruns.length + ' recorded</span> at this build, '
        + reruns.filter((r) => r.kind === 'own-code').length + ' with no code of ours. To be in it: '
        + '<a href="/reports/rerun.html">the rerun kit</a> lists one line per record — a standard-library verifier, the tool that '
        + 'wrote the record, or your own code — and <a href="https://github.com/carlostoledo1891/cert-machine/issues/new?template=rerun.yml">'
        + 'the rerun report</a> takes the verdict you obtained and the sha256 printed; name, date, kind and hash are recorded here, on the kit '
        + 'and on <a href="/machine/">the control page</a>.')
    ].join('\n')
      + (reruns.length ? C.plainList(reruns.map((r) => ({
        b: r.who + ' · ' + r.date + ' · ' + r.kind + '.',
        raw: C.esc(r.what) + ' <a href="' + C.escAttr(r.where) + '">code</a>' + (r.hash ? ' · <span class="m">' + r.hash.slice(0, 16) + '…</span>' : '')
      }))) : '')
  })
];
const oracleFoot = '<p>Generated by tools/build-site.js @ git ' + git + '. Gates at this '
  + 'build: oracle/battery.py (' + oracleChecks + ' checks, ' + oracleReds + ' reds fired), the paste-box '
  + 'widget\'s known answers, the ladder recount from the eval ledger (a certified impossible-rank row refuses '
  + 'the build), the loop recount, and the rerun registry — the page refuses to build on any deviation. '
  + 'cert-machine · Carlos Toledo.</p>';

/* ---- /about/ ------------------------------------------------------------
   Adapted from the source lab's about page — the content and the standard,
   never the styles (operator ruling, 2026-08-27). Statuses below are the
   operator's own record; a status word is meant exactly. */
/* ---- the four artifacts a hiring process reads (the METR plan's deliverable 5, 2026-09-22), every number from
   a ledger. They were /portfolio/ until 2026-10-16; the page is folded into /about/#work (301 in vercel.json)
   because a hub nobody linked was a hub nobody found. The gates stay: a number that stops holding refuses /about/. */
const rj = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const HZ = rj('certs/horizon-ledger.json'), GK = rj('certs/gsm8k-ledger.json'), BSI = rj('certs/blind-spot-inspect-ledger.json');
const bsiRec = rj('corpus/blindspot/inspect-record.json'), batteriesRec = rj('batteries.json');
if (HZ.counts.certified !== HZ.counts.fits) fail('/about/#work would state every horizon fit is certified while the ledger says otherwise');
const hzLive = Object.values(HZ.agents).filter((a) => a.live && a.live.certified && a.site);
const hzRepro = hzLive.filter((a) => a.live.coefficientsVerdict === 'REPRODUCED').length;
const hzDbl = HZ.trend.certified.from_2023_on.doublingDays[0], hzPrinted = HZ.trend.printed.from_2023_on.point_estimate;
if (!(Math.abs(hzDbl - hzPrinted) / hzPrinted < 1e-4)) fail('/about/#work would state the doubling time re-derives to the printed digit');
if (GK.test.annotations.EXACT !== GK.test.annotationsTotal) fail('/about/#work would state every GSM8K test annotation is exact');
if (bsiRec.disagreements !== 0 || bsiRec.verdict !== 'PASS') fail('/about/#work would state the two blind-spot scorers agree');
/* the frontier ladder on blind-spot, read from the Inspect ledger: Sonnet 5 on the located rung across three efforts */
const bsiLadder = BSI.ladder || {};
const sl = ['low', 'medium', 'high'].map((e) => (bsiLadder['claude-sonnet-5@' + e] || {}).rungs || {});
if (!sl.every((r) => r.located)) fail('/about/#work would quote a Sonnet 5 effort ladder the ledger does not hold');
const ladderText = sl.map((r) => r.located.solved + '/' + r.located.n).join(' → ');
const bsiFrontier = (BSI.frontier && BSI.frontier.models_run) || [];
const bsiRollouts = (BSI.runs || []).filter((r) => !r.control).reduce((a, r) => a + r.concord.rollouts, 0);
const bsiDis = (BSI.runs || []).filter((r) => !r.control).reduce((a, r) => a + r.concord.disagreements, 0);
if (bsiFrontier.length !== 3 || bsiDis !== 0) fail('/about/#work would state three frontier models with zero disagreements');
const opusProfile = ((bsiLadder['claude-opus-5@low'] || {}).rungs || {}).profile;
if (!opusProfile || opusProfile.unreadable < 6) fail('/about/#work would state Opus declines the profile rung');

const workArtifacts = C.plainList([
  { b: 'METR’s time horizon, re-derived as certificates.', raw: HZ.counts.certified + ' of ' + HZ.counts.fits + ' fits with the optimum proved unique in a box below 10⁻¹⁰ on METR’s own files; the printed coefficients are the box’s rounding for ' + hzRepro + ' of ' + hzLive.length + ' models; the post-2023 doubling time re-derives as ' + hzDbl.toFixed(2) + ' days against the printed ' + hzPrinted + '. <a href="/reports/time-horizon.html">The page</a>.' },
  { b: 'blind-spot, an RTL mutation task under Inspect and verifiers.', raw: BSI.ladder.mutations + ' pooled mutants scored three ways with ' + bsiRec.disagreements + ' disagreements; ' + bsiFrontier.length + ' frontier models, ' + fmt(bsiRollouts) + ' rollouts, every one re-scored offline with ' + bsiDis + ' disagreements. <a href="/instruments/blind-spot">The instrument</a> · <a href="' + GITHUB + '/tree/main/environments/blind_spot/inspect">the Inspect task</a>.' },
  { b: 'GSM8K’s answer key, re-decided.', raw: fmt(GK.test.annotationsTotal) + ' test and ' + fmt(GK.train.annotationsTotal) + ' train calculator annotations evaluated from the expressions they print; ' + GK.findings.printedStepWrongTest + ' test and ' + GK.findings.printedStepWrongTrain + ' train keys print a step that does not hold as printed. <a href="/reports/gsm8k-audit.html">The page</a>.' },
  { b: 'Three verifier-graded environments on the Prime Intellect hub.', raw: '<span class="m">blind-spot</span>, <span class="m">break-the-grader</span> and <span class="m">lattice-claims</span>, no answer key in any of them: a kill is simulated, a lattice claim is decided exactly, a grader is broken or is not. The repository runs ' + fmt(batteriesRec.ran) + ' batteries at every control build. <a href="/reports/gym.html">break-the-grader</a> · <a href="' + GITHUB + '">the repository</a>.' }
]);

const aboutBody = [
  C.header({
    eyebrow: 'Carlos Toledo · about',
    title: 'About',
    deck: 'Independent exact certification of machine-generated mathematics — exact arithmetic, no code shared '
      + 'with the claimant, refusal as a verdict. You can disagree with a result on this site by running '
      + 'something, and the disagreement is then about the mathematics rather than about which of us is more '
      + 'credible.'
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
    lab: 'three lines of work', title: 'What the reports decide', id: 'lines',
    bodyRaw: C.plainList([
      { b: TITLES.SERIES.audits.title + ' (' + seriesCount('audits') + ').', raw: C.esc(TITLES.SERIES.audits.lede) + ' <a href="/reports/#audits">The series</a>.' },
      { b: TITLES.SERIES.evaluation.title + ' (' + seriesCount('evaluation') + ').', raw: C.esc(TITLES.SERIES.evaluation.lede) + ' <a href="/reports/#evaluation">The series</a>.' },
      { b: TITLES.SERIES.theorems.title + ' (' + seriesCount('theorems') + ') and ' + TITLES.SERIES.decisions.title.toLowerCase() + ' (' + seriesCount('decisions') + ').', raw: C.esc(TITLES.SERIES.theorems.lede) + ' ' + C.esc(TITLES.SERIES.decisions.lede) + ' <a href="/reports/#theorems">Theorems</a> · <a href="/reports/#decisions">decisions</a>.' }
    ])
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
        + 'was caught by a control, a calibration, an impossible number — or, since 2026-10-09, by an adversarial read of the code, counted apart; the erratum of that date is on the machine page.' }
    ])
      + C.note({
        lab: 'what that does and does not buy',
        bodyRaw: C.pRaw('None of it makes the work correct. It makes it <em>checkable</em>, which is a weaker '
          + 'property and a more useful one.')
      })
  }),
  C.section({
    lab: 'outside the building', title: 'Where the work has gone, and what has come back', id: 'outside',
    bodyRaw: [
      C.p('Credited elsewhere: what registries, claimants and curated lists have published about this work, each quoted from a snapshot pinned by sha256 (corpus/recognition.json).'),
      C.plainList(OUTSIDE.items(C, { credits: outside.credits, reruns: [] })),
      C.plainList(externalReruns.map((r) => ({ b: RERUN_HEAD[r.kind] + ' — ' + longDate(r.date) + '.', raw: C.esc(r.who) + ': ' + C.esc(r.what) + ' Outcome: ' + C.esc(r.outcome) + ' (<a href="' + C.escAttr(r.where) + '">the audit</a> · <a href="' + C.escAttr(r.posted) + '">the thread</a>).' }))),
      C.p('Everything here is self-published and self-checked, so the honest question is what happens when it '
        + 'leaves. The record, with the status words meant exactly: first what has come back (' + outreachBack.length + ' of '
        + outreach.rows.length + '), then everything else, newest first.'),
      C.plainList(outreachBack.map(outreachItem)),
      C.plainList(outreachRest.map(outreachItem)),
      C.pRaw('Status words mean exactly what they say and nothing more: '
        + Object.entries(outreach.statusWords).map(([k, v]) => '<em>' + C.esc(k) + '</em> — ' + C.esc(v)).join(' · ')
        + '. Last checked ' + C.esc(longDate(outreach.lastChecked)) + '.'),
      C.pRaw('<strong>Filed is not accepted; posted is not replied.</strong> ' + (externalReruns.length === 1 ? 'One result' : externalReruns.length + ' results') + ' on this site '
        + (externalReruns.length === 1 ? 'has' : 'have') + ' been independently re-derived by a third party sharing no code (above); none has been peer-reviewed. '
        + 'That is the plain state of it, and it is why the pages ship their own falsifiers rather than asking for trust.'),
      C.pRaw('Traffic in the other direction has somewhere to go now: <a href="/reports/claims.html">the claims '
        + 'desk</a> takes a claim and answers it in public, whichever way it falls. '
        + fmt(claimsLedger.decided) + ' have been decided so far and ' + claimsLedger.submitted + ' of those was '
        + 'sent by somebody else — a number this site publishes while it is still zero.')
    ].join('\n')
  }),
  C.section({
    lab: 'working together', title: 'What a collaboration or a hiring process can check', id: 'work',
    bodyRaw: C.p('Open to collaboration — an independent audit of a release or a registry, a benchmark review, a certified '
        + 'decision product for an operation with a number to defend — and to roles in evaluation and verification. '
        + 'The four artifacts below were built to be re-run rather than read; every number in them is taken from a '
        + 'ledger at build time, and a number that stops holding refuses this page. The conventional CV is available on request.')
      + workArtifacts
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
    lab: 'contact', title: 'One address, for everything', id: 'contact',
    bodyRaw: C.pRaw('<a href="mailto:carlos@carlostoledo.co"><span class="m">carlos@carlostoledo.co</span></a> — '
      + 'corrections, questions about a step, collaboration, hiring. A message that names the page and the one step it '
      + 'doubts can be answered properly; a general introduction usually cannot. For a hiring process, <a href="#work">the section above</a> is the checkable half of a CV; the conventional one on request.')
  })
].join('\n\n');

const aboutFoot = '<p>Carlos Toledo · computer-assisted proof and validated numerics. '
  + 'These notes are self-published and not peer-reviewed. <a href="' + GITHUB + '">Source</a>.</p>';

/* ---- /machine/ — METHOD (2026-10-16; notes/positioning-plan-2026-10-16.md §3.5) -------------------------
   The method paper's §2 in about 1,200 words, with the paper's words defined once (the glossary), the errata
   dated, and the citation. The 22,000-word control page that lived at this address is the build log now,
   /machine/log.html: still generated at every control build, still the home of every battery and family —
   no longer the hub a first-time reader lands on. */
const erratum = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'erratum-2026-10-09.json'), 'utf8'));
const cite = (() => {
  const c = fs.readFileSync(path.join(ROOT, 'CITATION.cff'), 'utf8');
  const g = (k) => { const m = new RegExp('^' + k + ':\\s*"?([^"\\n]+)"?\\s*$', 'm').exec(c); return m ? m[1].trim() : null; };
  const out = { title: g('title'), version: g('version'), doi: g('doi'), date: g('date-released') };
  if (!out.title || !out.doi || !out.version) fail('CITATION.cff lost its title, version or DOI — the method page cannot print a citation');
  return out;
})();
const REGISTER_WORDS = [
  ['CERTIFIED', '—', 'a certificate with its falsifier; re-runs without the engine'],
  ['REFUTED', '—', 'the falsifying object, printed'],
  ['REFUSED', '—', 'the reason; for a split refusal, two witnesses and the thresholds'],
  ['PARTIAL', 'certified + refused', 'which fragment certified and which core was not reached'],
  ['NEEDS DATA', 'refused, cause with the claimant', 'the bytes that would decide the row, named'],
  ['MIXED', 'certified + refuted, one record', 'the counts of both, and the items refuted'],
  ['REPAIRED', 'refuted + certified', 'the object as printed refuted; the object beside it certified'],
  ['QUEUED', 'not a verdict', 'nothing; the row is not counted as decided']
];
const methodBody = [
  C.header({
    eyebrow: 'Carlos Toledo · method',
    title: 'How a claim becomes a certificate',
    deck: 'The method in the words of the method paper: what is read, how it is decided, which arithmetic secures the '
      + 'decision, which certifiers reduce an analytic question to finitely many exact ones, and the discipline, '
      + 'enforced by code that refuses, that guards the code. Every term used on this site is defined here once.'
  }),
  C.stats([
    { k: 'published claims decided', v: fmt(claimsLedger.decided), n: 'in the register, each with its verdict and the record that decided it' },
    { k: 'batteries at the last control build', v: gatesRec.green + ' of ' + gatesRec.ran, n: 'run at git ' + gatesRec.git + ', not remembered; a red one refuses the control build' },
    { k: 'third-party re-derivations', v: String(rerunsOwn), n: 'results re-derived by someone else with no code of ours' + (rerunsTools ? '; ' + numword(rerunsTools) + ' more re-ran our own tools' : '') },
    { k: 'reports', v: fmt(REPORT_COUNT), n: 'in five series, each recomputing its numbers from its records' }
  ]),
  C.section({
    lab: '§1 · materials', title: 'What is read',
    bodyRaw: C.p('The inputs are claims and the bytes they rest on: constants, constructions, bounds, formal statements, '
        + 'printed tables, operating numbers — each pinned by the digest of the file that states it. The claimant’s '
        + 'program is never run in the trust path. What finishes within a day runs on a laptop; the formal challenges of '
        + 'a release ran on hosted runners; the largest kissing configurations ran on one rented GPU whose kernel first '
        + 'had to reproduce the laptop’s answers on smaller cases. Every decision writes a record: the inputs by path '
        + 'and SHA-256, the verdict, the witness, the scope, the machine, the time, and the second implementation’s '
        + 'reading where one exists. Every number on this site and in the papers is read from such a record at build '
        + 'time, and a page refuses to build when a record stops supporting a sentence.')
  }),
  C.section({
    lab: '§2 · the decision grammar', title: 'Claims over boxes, three verdicts, witnesses',
    bodyRaw: C.p('A box is a product of closed intervals with rational endpoints; a printed number is the box its digits '
        + 'allow. A claim is a box B and a predicate φ whose functions have interval extensions — maps that provably '
        + 'contain the true range on every box. It is read in one of two ways: universally, as a mathematical statement '
        + 'that holds for every point of B; or epistemically, as an engineering number that holds at one unknown true '
        + 'input inside the declared envelope B.')
      + C.p('The claim is CERTIFIED when the enclosures show φ on every box of a finite cover of B; REFUTED when they '
        + 'show its negation — at one proved point under the universal reading, on all of B under the epistemic one — with '
        + 'the falsifying object printed; REFUSED otherwise, with the reason, and, where two points of B have been proved '
        + 'to satisfy and to violate φ, with both witnesses and the thresholds that would decide. The verdicts are '
        + 'sound under the inclusion property of the extensions. A refusal is terminal: never retried at lower rigour, '
        + 'never turned into a probability, never dropped from the record. The only path from REFUSED to CERTIFIED is a '
        + 'new exact argument or the bytes the claimant had not yet published.')
      + C.p('The register composes the three words into words that say what they are made of; none is a fourth verdict, '
        + 'and the kinds of refusal are never summed.')
      + C.table({ cols: [{ h: 'word' }, { h: 'composed of' }, { h: 'the witness the row carries' }], rows: REGISTER_WORDS })
  }),
  C.section({
    lab: '§3 · the arithmetic', title: 'What secures the inclusion property',
    bodyRaw: C.p('Exact rationals where a tie must be decided or the object is rational: reduced fractions of '
        + 'arbitrary-precision integers, doubles converted losslessly, linear systems solved by exact elimination that '
        + 'reports a singular matrix rather than a small pivot. Exact integers in floating-point hardware where the data '
        + 'are integer vectors: a product is exact as long as no partial sum can leave the range the format holds '
        + 'exactly, a bound checked against the data before anything runs and written into the record — which is what '
        + 'lets ' + sci15(kwGpuPairs) + ' pairs of integer points be decided exactly on one GPU.')
      + C.p('Outward-rounded intervals on doubles where the quantity is transcendental or the data are long: each '
        + 'computed endpoint is stepped one unit in the last place outward, so the true value lies inside, on the '
        + 'strength of the correctly rounded operations IEEE-754 mandates. No library function is trusted: elementary and '
        + 'special functions are truncated series with their remainders enclosed; long sums use compensated summation '
        + 'with an outward error bound; derivatives come from forward differentiation over the same arithmetic, so the '
        + 'derivative a proof uses is an extension of the function the proof is about. A malformed operand or an '
        + 'indeterminate result is refused by exception, never decided.')
  }),
  C.section({
    lab: '§4 · the certifiers', title: 'From an analytic question to finitely many exact ones',
    bodyRaw: C.p('None of the certifiers is new; the assembly is, with the rule that each refuses rather than guesses. '
        + 'The Krawczyk operator proves that a box holds exactly one zero of a system, or refuses with “no '
        + 'contraction”. A negative-definite Hessian on a box with one critical point proves a unique maximiser — a '
        + 'fitted distribution, a time-horizon estimate. The corners of a multilinear form decide an inequality over a '
        + 'whole box. Sturm chains count real roots exactly; exact LP duality and Farkas certificates decide feasibility; '
        + 'sums of squares in exact rationals certify positivity; covering relations composed to an exact spectral '
        + 'argument bound an entropy. Each certifier ends in decisions of the kind §2 covers, and each is calibrated on a '
        + 'case with a known answer before it decides anything new.')
  }),
  C.section({
    lab: '§5 · the verification discipline', title: 'Rules stated as code that refuses',
    bodyRaw: C.plainList([
      { b: 'Screens prune, never admit.', text: 'Floating point decides only what is worth certifying; a certifier is the only authority, and a screen that loses a planted known answer refuses the run.' },
      { b: 'Red controls must fire.', text: 'A red control is a deliberately wrong variant of a test that must be rejected; a battery whose red controls do not all fire fails, whatever its other checks say.' },
      { b: 'Calibrate before you decide.', text: 'A new machine, arithmetic or kernel decides nothing until it has reproduced a decision already made by an old one; a pre-registration states what a paid run will measure and at what cost it stops.' },
      { b: 'Pin the bytes.', text: 'Every claim is decided against a byte sequence named by path and SHA-256 and re-hashed at decision time; a page refuses to build when a pinned input, a verifier version or a battery has changed under it.' },
      { b: 'Independence from the claimant.', text: 'The decision is re-derived from the published statement and bytes. The precise form is that the system shares no code with the claimant: two of its own instruments reuse its own code across a producer–checker line, and the paper says which.' },
      { b: 'Second implementations.', text: 'Where a verdict is the product, a second program written from the specification in another language and arithmetic re-derives it. These are same-author checks and are counted apart from re-derivations by other parties.' },
      { b: 'Records re-run.', text: 'A record is re-derived, not believed: in the reader’s browser by the bytes that wrote it, and by the rerun kit from the standard library alone.' },
      { b: 'Honest counting.', text: 'A claim with no record gets no row; a correction added beside a refuted claim is never counted among the audited rows; a queued row is not decided; refusal kinds are never merged into one total.' }
    ])
  }),
  C.section({
    lab: 'glossary', title: 'The words, defined once', id: 'glossary',
    bodyRaw: C.plainList([
      { b: 'Certificate.', text: 'What a CERTIFIED verdict carries: the inputs pinned by digest, the cover, the enclosures, and a statement of what would make it fail. It re-runs without the engine.' },
      { b: 'Enclosure.', text: 'An interval proved to contain the true value, by exact arithmetic or outward rounding; never a point and never an estimate.' },
      { b: 'Verdict.', text: 'One of three words — CERTIFIED, REFUTED, REFUSED — each with its witness; the register’s composed words (PARTIAL, NEEDS DATA, MIXED, REPAIRED) say what they are made of.' },
      { b: 'Witness.', text: 'The object that justifies a verdict: a certificate, a falsifying point or equation, the two points of a split refusal.' },
      { b: 'Red control.', text: 'A deliberately wrong input that a check must reject before the check counts.' },
      { b: 'Battery.', text: 'A program of checks with its red controls that exits non-zero when any fails; the control build runs every battery and refuses on a red one.' },
      { b: 'Register.', text: 'The public ledger of published claims decided here, one row per claim, each derived from a record.' },
      { b: 'Pinned bytes.', text: 'A file named by path and SHA-256 at decision time; a changed digest refuses the page that cites it.' },
      { b: 'Refusal.', text: 'A verdict, not an absence of one: the instrument did not reach a decision, and says why. NEEDS DATA is the refusal whose cause lies with the claimant.' },
      { b: 'Independent.', text: 'From the claimant: no code shared with the party whose claim is decided, and every certificate re-runnable with no engine present.' },
      /* the house grammar's two axes, defined here once because this page says every term used on the site is (WARRANT v2
         and v2.1, design/WARRANT.md; the words and glyphs are warrant.js's own, so the definition cannot drift from the marks) */
      { b: 'Standing.', raw: 'What a mark in a figure, or a number in text, rests on, drawn in its stroke or its underline: '
          + W.value('decided', W.DECIDED) + ' (an exact decision backs it; solid, or plain in text), ' + W.value('computed', W.COMPUTED)
          + ' (float, a fit, a forecast, a number someone printed; dashed), ' + W.value('chosen', W.CHOSEN) + ' (one member of a set the '
          + 'data admit, picked by something that is not the data; dotted), and refused (no mark at all: ' + W.value('the void', W.REFUSED)
          + '). A mark takes the weakest standing on its path. Standing is not a verdict: a refutation proved here is drawn solid.'
          + W.legendHtml({ compact: true }) },
      { b: 'Premise grade.', raw: 'Where the checking of a model that a number rests on stopped, strongest first. '
          + [W.VALIDATED, W.COMPARED, W.VERIFIED, W.ASSUMED].map((g) => W.grade(g) + ' ' + C.esc(W.GRADE_GLOSS[g]) + '.').join(' ')
          + ' A conclusion is as checked as its weakest premise, and the page that states it names that premise. A grade is never a probability.' }
    ])
  }),
  C.section({
    lab: 'errata', title: 'What was wrong, dated', id: 'errata',
    bodyRaw: C.plainList([
      { b: longDate(erratum.date) + '.', raw: C.esc(String(erratum.what).split('. ')[0]) + '. The numbers as published are pinned in '
          + '<span class="m">certs/erratum-2026-10-09.json</span> (closed forms then counted refuted: ' + fmt(erratum.before.totals.closedFormRefuted)
          + '; by the exact rule now: ' + fmt(ledger.totals.closedFormRefuted) + ', of which ' + fmt(ledger.totals.closedFormRefutedExact) + ' by exact arithmetic); '
          + 'the full account is <a href="log.html">in the build log</a>.' }
    ]) + C.pRaw('Earlier defects, every one caught by a red control, a calibration, an impossible number or a byte pin, are counted in '
      + '<a href="../reports/methods-note.html">how the bugs were found</a>; refusals of every kind, each with its own denominator, in '
      + '<a href="../reports/refusals.html">refusals on record</a>.')
  }),
  C.section({
    lab: 'the paper, the log, the kit', title: 'Where the detail is', id: 'links',
    bodyRaw: C.plainList([
      { raw: '<a href="../paper/cert-machine-method.pdf">The method paper</a> (' + C.esc(paperStatus) + '; not peer-reviewed) and <a href="../papers/index.html">the other papers</a>, every number a macro from a record.' },
      { raw: '<a href="log.html">The build log</a>: every family, instrument, battery and certificate at this commit — the record under this page.' },
      { raw: '<a href="../reports/rerun.html">The rerun kit</a>: the command that re-derives each record of the register, with the standard-library verifier where one exists.' },
      { raw: '<a href="../instruments/index.html">The instruments</a>: the same arithmetic in the browser, each page saying what decides its headline number.' },
      { raw: 'Cite: Toledo, C. (' + C.esc(String(cite.date).slice(0, 4)) + '). <em>' + C.esc(cite.title) + '</em>, ' + C.esc(cite.version)
          + '. <a href="https://doi.org/' + C.escAttr(cite.doi) + '">doi:' + C.esc(cite.doi) + '</a> (concept DOI <a href="https://doi.org/10.5281/zenodo.22225860">10.5281/zenodo.22225860</a>).' }
    ])
  })
].join('\n\n');
const methodFoot = '<p>Built from the records at git ' + git + ' by tools/build-site.js. MIT. <a href="' + GITHUB + '">Source</a>.</p>';

/* ---- /apps/ — the decision products, one index (2026-10-16) ---------------
   Each app is built by its own gated build into its own zone; this page only
   reads the heads those builds wrote (title, description, language) so the
   index cannot say what an app does not. A zone that is not built yet is
   skipped and logged, never invented. */
const APP_ZONES = [
  { dir: 'apps/skyaudit/', k: 'aviation · New York' }, { dir: 'apps/skyaudit/sp/', k: 'aviation · São Paulo' },
  { dir: 'janela/', k: 'offshore operations · Brazil' }, { dir: 'janela/metodo/', k: 'offshore operations · the method' },
  { dir: 'swell/', k: 'coastal · Florianópolis' },
  { dir: 'decidivel/', k: 'reservoir monitoring · 4D seismic' }, { dir: 'contraprova/', k: 'engineering numbers · independent verification' },
  { dir: 'abatimento/', k: 'emissions abatement · a registry' }
];
const LANG_WORD = { en: 'English', 'pt-BR': 'Portuguese', pt: 'Portuguese' };
const appCards = APP_ZONES.map((z) => {
  const f = path.join(SITE, z.dir, 'index.html');
  if (!fs.existsSync(f)) { console.log('  /apps/: ' + z.dir + ' not built in this tree — skipped'); return null; }
  const h = fs.readFileSync(f, 'utf8');
  const t = /<title>([^<]*)<\/title>/.exec(h), d = /name="description" content="([^"]*)"/.exec(h), l = /<html[^>]*lang="([^"]*)"/.exec(h);
  if (!t || !d) fail('/apps/: ' + z.dir + ' has no title or description to index');
  return { href: '../' + z.dir, k: z.k + ' · ' + (LANG_WORD[l ? l[1] : 'en'] || l[1]), title: unescHtml(t[1]).replace(/\s*[·—-]\s*Carlos Toledo\s*$/, ''), desc: unescHtml(d[1]) };
}).filter(Boolean);
const appsBody = [
  C.header({
    eyebrow: 'Carlos Toledo · apps',
    title: 'Decision products',
    deck: 'Operational questions answered with the same three-valued verdict as the reports: a window is open or it is '
      + 'not or the data cannot say; a flight is feasible under the rule, or not, or not decidable from what was '
      + 'published. Each app reads pinned public data, decides over a declared envelope, and shows the certificate one '
      + 'click below the answer. The Brazilian products are in Portuguese.'
  }),
  C.section({ lab: appCards.length + ' apps', title: 'Built on the certified decisions', wide: true, bodyRaw: C.cards(appCards) })
].join('\n\n');
const appsFoot = '<p>Built by tools/build-site.js from the heads the app builds wrote, at git ' + git + '. MIT. <a href="' + GITHUB + '">Source</a>.</p>';

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
{
  /* the landing's own claim gate: any "first ..." on this page must travel
     with its qualifier (the fence lists live on the report pages) */
  const joined = B.join('\n\n');
  if (/\bfirst (certified |validated[- ])?[a-z-]* ?(hot-spots|enclosure|domain)/i.test(joined) && !/to\s+our knowledge/i.test(joined)) {
    fail('a priority claim reached the landing without its qualifier');
  }
}
put('index.html', Buffer.from(TPL.render({ title: 'Carlos Toledo · independent exact certification of machine-generated mathematics', bodyRaw: B.join('\n\n'), footRaw: foot, path: '/',
  desc: 'Independent exact certification of machine-generated mathematics — exact arithmetic, no code shared with the claimant, refusal as a verdict. Certified audits of published AI-generated mathematics, evals whose ground truth is a proof, and the theorems that calibrate the instruments.' })));
put('reports/index.html', Buffer.from(TPL.render({ title: 'Reports', bodyRaw: reportsIndexBody, footRaw: reportsIndexFoot, path: '/reports/',
  desc: 'Every report in five series — audits of machine-generated mathematics, evaluation whose ground truth is a proof, theorems and exact values, certified decisions for operations, the record — each title naming the object and what was decided.' })));
put('about/index.html', Buffer.from(TPL.render({ title: 'About · Carlos Toledo', bodyRaw: aboutBody, footRaw: aboutFoot, path: '/about/',
  desc: 'Carlos Toledo: what is decided here and how, the three lines of work, what every page owes the reader, the record of what has left the building and what came back, the four artifacts a hiring process can re-run, and one address.' })));
put('oracle/index.html', Buffer.from(TPL.render({ title: 'certify() — the reward oracle · cert-machine', bodyRaw: oracleBody.join('\n\n'), footRaw: oracleFoot, path: '/oracle/',
  desc: 'certify() — a reward oracle for AI mathematical search: CERTIFIED, REFUTED with the exact violated equation, or REFUSED — never a guess. No float participates in any decision; red controls run at import; the ladder, the evidence, and exactly where the guarantee ends.' })));
/* discoverability assets + crawl surface — generated, like everything else */
put('favicon.svg', fs.readFileSync(path.join(ROOT, 'design', 'assets', 'favicon.svg')));
put('og.png', fs.readFileSync(path.join(ROOT, 'design', 'assets', 'og.png')));
/* the write-ups: papers are generated from the same certificates as their
   report pages, and are linked from outreach, so they are served here rather
   than left to the repository tree only. */
for (const f of fs.readdirSync(path.join(ROOT, 'paper'))) {
  if (f.endsWith('.pdf') || f.endsWith('.md')) put('paper/' + f, fs.readFileSync(path.join(ROOT, 'paper', f)));
}
/* the index of the pre-papers, for the reviewing group: rendered from paper/INDEX.json and the PDFs
   themselves (page counts and sizes read from the files); refuses when the shelf and the manifest differ */
put('papers/index.html', Buffer.from(require(path.join(__dirname, 'build-papers-index.js')).html()));
put('robots.txt', Buffer.from('User-agent: *\nAllow: /\nSitemap: https://carlostoledo.co/sitemap.xml\n'));
put('machine/index.html', Buffer.from(TPL.render({ title: 'Method', bodyRaw: methodBody, footRaw: methodFoot, path: '/machine/',
  desc: 'How a claim becomes a certificate: claims over boxes, the three verdicts and their witnesses, the exact and outward-rounded arithmetic, the certifiers, the verification discipline, the glossary, the errata and the citation.' })));
put('machine/log.html', Buffer.from(REFRESH.refresh(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), '/machine/log.html')));
put('apps/index.html', Buffer.from(TPL.render({ title: 'Apps', bodyRaw: appsBody, footRaw: appsFoot, path: '/apps/',
  desc: 'The decision products built on cert-machine: SkyAudit, Janela, Swell, Decidível, Contraprova and the Registro de Abatimento — pinned public data decided over a declared envelope, the certificate one click below the answer.' })));
for (const f of fs.readdirSync(path.join(ROOT, 'reports'))) {
  /* a committed report page passes through the title registry on its way to
     site/ — the same function a fresh render runs, so the two agree */
  if (f.endsWith('.html')) put('reports/' + f, Buffer.from(REFRESH.refresh(fs.readFileSync(path.join(ROOT, 'reports', f), 'utf8'), '/reports/' + f)));
  else if (f.endsWith('.py') || f.endsWith('.js')) put('reports/' + f, fs.readFileSync(path.join(ROOT, 'reports', f)));
}
for (const f of fs.readdirSync(path.join(ROOT, 'certs'))) {
  if (WORKING.test(f)) continue;          /* the one pattern, not a second copy */
  if (f.endsWith('.json') || f.endsWith('.jsonl')) put('certs/' + f, fs.readFileSync(path.join(ROOT, 'certs', f)));
}
for (const f of fs.readdirSync(path.join(ROOT, 'tools'))) {
  if (/^verify_.*\.py$/.test(f)) put('verify/' + f, fs.readFileSync(path.join(ROOT, 'tools', f)));
}
/* the Erdős #1 certificates: every file under 20 MB (the two 2,197-dimensional
   ones are 46 MB gzipped and stay in the repository; the page says so) */
for (const f of fs.readdirSync(path.join(ROOT, 'certs', 'erdos1'))) {
  const abs = path.join(ROOT, 'certs', 'erdos1', f);
  if (!fs.statSync(abs).isFile() || fs.statSync(abs).size > 20 * 1024 * 1024) continue;
  put('certs/erdos1/' + f, fs.readFileSync(abs));
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
   batteries and drift gates. site/contraprova/ and site/decidivel/ are the same
   arrangement at top-level paths (apps/contraprova/build.js,
   apps/decidivel/build.js; the URLs chosen by the operator, 2026-09-29/30), and so is
   site/janela/ (apps/janela/build.js, 2026-10-06), and site/explained/ (apps/explained/build.js, 2026-10-23: the easy read) and site/uirapuru/ (apps/uirapuru/build.js, 2026-10-23: the story).
   The site sync neither generates nor prunes under them — two builders
   writing one tree is how files get eaten. */
/* site/machinidae/ is a FOREIGN ZONE (2026-10-23 as site/clade-code/; renamed 2026-10-27): a byte copy of another repository's build
   (~/Projects/machinidae/web/, built there by `make web`), which this file never writes or prunes and the page gates
   never measure. The foreign zones are listed once, in design/zones.js. */
/* site/instruments/ is the same arrangement for the opposite reason. It is
   emitted by playground/build.js, which is not wired into this file and to
   which none of this file's gates apply, because nothing under /instruments
   makes a claim that needs gating. This build neither writes nor prunes there.
   The one thing it does do is list its pages in the sitemap below, because a
   page nobody can find is not free, it is hidden. */
/* sitemap: every PAGE in the desired map (the landing, section indexes,
   the reports) plus the app-zone pages the app builds emit. Raw citation
   files, certificates and verifiers are crawlable but are not pages. */
{
  const urls = ['/', '/apps/skyaudit/', '/apps/skyaudit/sp/', '/contraprova/', '/decidivel/', '/abatimento/', '/janela/', '/janela/metodo/'];   /* /explained/ and /uirapuru/ are built but not yet listed: the operator decides whether to link them (2026-10-23) */
  for (const e of (() => { try { return fs.readdirSync(path.join(SITE, 'instruments'), { recursive: true }); } catch (e) { return []; } })()) {
    const rel = String(e).split(path.sep).join('/');
    if (rel.endsWith('index.html')) urls.push('/instruments/' + rel.slice(0, -'index.html'.length));
  }
  /* a foreign zone the operator listed (design/zones.js `sitemap: true`): its pages, read from the zone's published copy,
     never written here; listed, linked from no page (2026-10-28) */
  for (const z of require(path.join(ROOT, 'design', 'zones.js')).FOREIGN.filter((x) => x.sitemap)) {
    const zdir = path.join(SITE, z.dir);
    for (const f of (() => { try { return fs.readdirSync(zdir, { recursive: true }); } catch (e) { return []; } })()) {
      const rel = String(f).split(path.sep).join('/');
      if (!rel.endsWith('.html')) continue;
      urls.push('/' + z.dir + (rel === 'index.html' ? '' : rel.endsWith('/index.html') ? rel.slice(0, -'index.html'.length) : rel));
    }
  }
  for (const rel of desired.keys()) {
    if (rel === 'index.html') continue;
    if (rel.endsWith('/index.html') && !rel.startsWith('research/')) urls.push('/' + rel.slice(0, -'index.html'.length));
    else if (rel === 'machine/log.html') urls.push('/' + rel);
    else if (rel.startsWith('reports/') && rel.endsWith('.html')) urls.push('/' + rel);
  }
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + urls.sort().map((u) => '  <url><loc>https://carlostoledo.co' + u + '</loc></url>').join('\n')
    + '\n</urlset>\n';
  put('sitemap.xml', Buffer.from(xml));
}
/* meta gate: every served page carries its OWN description — a page that
   falls back to the template default, or two pages sharing one description,
   is the corpus.js divergence in SEO form and refuses the build. */
{
  const seen = new Map();
  for (const [rel, buf] of desired) {
    if (!rel.endsWith('.html')) continue;
    const m = String(buf).match(/name="description" content="([^"]*)"/);
    if (!m || !m[1]) fail('meta gate: ' + rel + ' has no meta description');
    const d = m[1];
    if (d === require(path.join(ROOT, 'design', 'template.js')).DEFAULT_DESC) {
      fail('meta gate: ' + rel + ' ships the default description — give it its own');
    }
    if (seen.has(d)) fail('meta gate: ' + rel + ' and ' + seen.get(d) + ' share one description');
    seen.set(d, rel);
  }
}
fs.mkdirSync(SITE, { recursive: true });
const { isForeign } = require(path.join(ROOT, 'design', 'zones.js'));
for (const rel of desired.keys()) if (isForeign(rel)) fail('a foreign zone is written by its own repository, never by this build: ' + rel);
let wrote = 0, pruned = 0, kept = 0;
for (const e of fs.readdirSync(SITE, { recursive: true })) {
  const rel = String(e).split(path.sep).join('/');
  const abs = path.join(SITE, String(e));
  /* swell/ joined the app zones 2026-10-08 and was missing from this list: a bare `node tools/build-site.js`
     pruned the Swell app that `make site` then rebuilt after it — invisible in the make, nine files gone
     when run alone (found 2026-10-16) */
  if (rel.startsWith('apps/') || rel.startsWith('instruments/') || rel.startsWith('contraprova/') || rel.startsWith('decidivel/') || rel.startsWith('abatimento/') || rel.startsWith('janela/') || rel.startsWith('swell/') || rel.startsWith('explained/') || rel.startsWith('eleicoes2026/') || rel.startsWith('uirapuru/') || rel.startsWith('eth/')) continue;
  if (isForeign(rel)) continue;   /* machinidae/: owned by Machinidae's page engine (design/zones.js) */
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
