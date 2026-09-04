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
const envsTol = envsRec.graders.find((g) => /absolute/.test(g.name));
const envsSound = envsRec.graders.find((g) => /enclosure/.test(g.name));
if (!envsTol || !envsSound || envsSound.falseAccept !== 0) fail('the envs record no longer shows a sound certificate grader — no card may quote it');
const claimsLedger = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'claims-ledger.json'), 'utf8'));
const outreach = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'outreach.json'), 'utf8'));
if (!outreach.rows.length) fail('the outreach record is empty — the about page would claim nothing has left the building');
for (const r of outreach.rows) if (!r.status || !r.sent || !outreach.statusWords[r.status])
  fail('an outreach row carries a status word that is not defined in the record: ' + r.id);
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
if (emberT.verdict !== 'VERIFIED') fail('the ember theorem record is not VERIFIED — the card claims a theorem');
const emberMu1 = emberT.mu1.map(Number);
if (!(emberMu1[0] > 12.02 && emberMu1[1] < 12.03)) fail('ember μ1 enclosure moved — update the card deliberately');
const terraBT = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'terra-bracket-table.json'), 'utf8'));
if (terraBT.verdict !== 'VERIFIED') fail('the terra bracket table is not VERIFIED — the card claims theorems');
if (!kellerNew) fail('the keller certificate holds no counterexample generated here — the landing card claims some');

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
  { g: 'erdos', f: 'erdos1038-inf.html', k: 'erdős #1038 · the infimum, bracketed',
    title: 'A certified bracket for the Erdős–Herzog–Piranian infimum',
    desc: 'How small can the set where a monic polynomial stays below 1 be? The infimum is bracketed here in certified interval arithmetic, both ends unconditional — the lower end by a forcing argument needing no tail estimate and no assumed minimizer — and Tao’s model Problem 4.1 is answered affirmatively for every ε. Three AI-assisted proofs of the exact value are currently claimed and none independently examined, so nothing here assumes any of them.',
    n: '1.828 ≤ inf ≤ 1.83443 · both ends certified here' },
  { g: 'ai', f: 'kissing.html', k: 'audit · the AI-held record',
    title: 'The kissing ledger: dimension eleven, decided',
    desc: 'K(11)’s record moved three times in eighteen months — every mover an AI, each validated by its producer’s own verifier. The whole ladder (AlphaEvolve 593, EinsteinArena 594, the Station’s three exact 604s) re-decided here in exact Z[√2] arithmetic from published bytes; the one claim with no public bytes measured as NEEDS DATA.',
    n: 'K(11) ≥ 604 · certified from the claimants’ own bytes' },
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
  { g: 'ai', f: 'gym.html', k: 'an environment · no answer key',
    title: 'Break the grader, or prove it cannot be broken',
    desc: 'A reinforcement-learning environment whose adversarial examples are GENERATED from certified '
      + 'enclosures rather than authored: every negative carries a proof, the set is infinite because the '
      + 'parameter space is continuous, and difficulty is one number with a closed form — the band a tolerance '
      + 'grader leaves open, which vanishes exactly when the tolerance drops under half the certificate width. '
      + 'Zero dependencies, and both standing answers lose somewhere so only checking wins.',
    n: 'shipped as a wheel · forgery battery is the test suite' },
  { g: 'ai', f: 'claims.html', k: 'the claims desk',
    title: 'Send us a claim',
    desc: 'A mathematical claim that comes down to finitely many exact arithmetic facts is decided here — '
      + 'certified with a certificate that re-runs without this engine, refuted with the falsifying witness '
      + 'printed, or honestly refused. Every row of the ledger is derived from the record that decided it, the '
      + 'queue is open and its submitted count is published even while it is zero, and the claimant\'s code is '
      + 'never in the trust path.',
    n: fmt(claimsLedger.decided) + ' claims decided · ' + claimsLedger.submitted + ' submitted so far' },
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
    title: 'None by reading code',
    desc: 'Every real bug this machine has found — ten, cataloged — was caught by a red control, a calibration, an impossible number, or a byte pin. How to build verifiers that catch their own defects, stated as engineering.',
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
  /* group 'applied': the new fronts — certified applications with live
     external stakes (aerospace, energy) */
  { g: 'applied', f: 'skyaudit.html', k: 'aerospace · the app, cited',
    title: 'SkyAudit: the helicopter day, decided',
    desc: 'One pinned day of New York helicopter traffic, re-flown on paper by four eVTOLs’ own published numbers under the FAA reserve rule — every flight decided: E-FLYABLE, BEYOND RANGE with an exact witness, or NEEDS DATA where public specs cannot say. The citable methodology behind the live app.',
    n: 'every certificate row recounted at the page’s own build' },
  { g: 'applied', f: 'harbor-proof.html', k: 'maritime · FuelEU, first live year',
    title: 'HarborProof: the fleet, re-sailed under the rule',
    desc: 'Every ship in the official EU-MRV 2025 registry — the first year FuelEU Maritime penalties exist — re-fueled on paper under the regulation’s own published penalty formula, in exact rationals over boxes constrained by each ship’s own reported numbers: penalty floors in EUR, exact zero-WtW blend fractions that flip each verdict, NEEDS DATA where the record’s opacity leaves it open.',
    n: 'the whole registry recomputed at the page’s own build' },
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

/* ---- the certificates, described -----------------------------------------
   Same rule as the shelf: the build refuses if certs/ holds a file this
   table cannot describe.

   The re-verify column ships exactly two kinds of link and one honest
   absence, and each link NAMES the repo file it is copied from so the build
   can refuse a link that would 404. It shipped two once: /verify/ holds ONLY
   the detached .py verifiers, and two rows pointed single-file JS/HTML
   artifacts at it. Those artifacts live under /reports/. */
const PY = (f) => ({ href: 'verify/' + f, label: f, src: path.join(ROOT, 'tools', f) });
const INPAGE = (f) => ({ href: 'reports/' + f, label: f, src: path.join(ROOT, 'reports', f) });
const NOVERIFIER = (f) => ({ tag: 'battery-gated', href: 'reports/' + f, label: 'the report', src: path.join(ROOT, 'reports', f) });
const CERTS = [
  ['erdos852-certificate.json', 'Both Erdős #852 constants as exact data: the c0 window re-decidable at 130 digits, the C∗ refutation as strict integer inequalities with no tail bound.', PY('verify_erdos852.py')],
  ['erdos852-h-records.json', 'Every record run of pairwise-distinct consecutive prime gaps the scan has closed \u2014 index, opening prime and length. The head reproduces OEIS A078515/A079889 term for term; the tail passes them. Each record beyond the published terms is re-proved at build by an independent Miller\u2013Rabin verifier.', null],
  ['ai-claims-summary.json', 'The six-lane AI-claim audit as the build recorded it: every lane\u2019s verdict, scope, check count and mutation-control count, written by the report builder from a live run of all six verifiers. Not a certificate \u2014 a record of what the verifiers said, so the shelf card and the page cannot quote different numbers.', null],
  ['keller-certificate.json', 'The Jacobian/Hessian counterexample corpus — every polynomial as explicit exact rational monomials; determinants and collisions re-derivable from the file alone.', PY('verify_keller.py')],
  ['erdos1038-inf.json', 'Erdős #1038, the INFIMUM side: the certified bracket 1.828 ≤ inf ≤ 1.8344304971959906 with both ends unconditional, Tao’s model Problem 4.1 answered affirmatively for every ε ∈ (0, 0.1] (624,275 chunks + a sliver lemma), and the thread’s three posted dual measures certified. Rebuilt live at every report build; the record carries the claim fence naming all three claimed proofs.', null],
  ['erdos1038-forcing-1.828.json', 'The forcing certificate behind inf ≥ 1.828 — every a₀-box with its comb, per-b-box frozen LP weights and certified margins. Re-checked by instruments/lemniscate/verify-forcing.js, which shares no code with the certifier and also hunts counterexamples in doubles.', null],
  ['ember-band.json', 'THE EMBER BAND: the hot-spots theorem extended from one trapezoid to every c in [0.845, 0.85] — 17 chunks tiling the interval with shared endpoints, 738 σ-cells inside them, μ₁ ≥ 11.85157 and μ₂ ≥ 13.90774 uniformly. An AUDIT record, not a re-derivation: the chain ran on the bench, and instruments/emberband/verify-band.js re-derives both covering ladders and every band-wide value from per-cell data, sharing no code with the producer.', null],
  ['kissing-ledger.json', 'The kissing ledger: every public record configuration for K(11) — AlphaEvolve’s 593, the EinsteinArena rung winner’s 594, the Station’s three exact 604s, the classical 582 shell and the D₁₂ lift — re-decided in exact Z[√2] BigInt arithmetic from sha-pinned claimant bytes, shared-nothing with every producer’s own verifier; contact counts exact, the byteless EinsteinArena 604 measured as NEEDS DATA. Rebuilt by tools/run-kissing-ledger.js at every report build.', null],
  ['strassen-certificate.json', strassenN + ' fast matrix-multiplication algorithms as exact tensor identities over Q and F2 — including AlphaTensor’s rank-47, decided both ways.', PY('verify_strassen.py')],
  ['bilinear-certificate.json', bilinearN + ' bilinear algorithms for POLYNOMIAL multiplication over F2 — full, truncated and cyclic products — each found by the generation front’s free flip-graph walk and decided by instruments/bilinear, which rebuilds the target tensor from its name rather than trusting the scheme handed to it. Every entry stores its scheme in full, so any reader can re-decide it; the published bounds each one is measured against live in corpus/bilinear-bounds.json and are not results of this repository.', NOVERIFIER('polynomial-multiplication.html')],
  ['lambda4-audit.json', 'The adversarial audit of the lambda(4) proof: an independent clause walk sharing no code with the engine — inner products by direct trigonometric summation, family and subfamily membership by plain integer arithmetic, thresholds read from the campaign record, finite-clause sets re-certified fresh by the calibrated instrument. Every gcd-reduced 4-set in the box must be reached by an explicit clause of the proof (generic, family dot, closure, finite, delegated, or the definitional witness); a set with no clause is a hole and aborts. Also carries the full theorem sweep of the box: zero refuters.', null],
  ['claims-ledger.json', 'The claims desk ledger: every externally published mathematical claim this machine has decided, one row per claim, each DERIVED from the record that decided it — a claim with no record gets no row. Origin is tracked separately from verdict, because everything decided so far was self-initiated and the submitted count stays published even while it is zero.', null],
  ['grader-pilot.json', 'The environment run against real models, and the reference policies run on the SAME seeds so the columns are the same tasks rather than a comparable sample: 360 calls at $1.92 of a $4.00 cap, worst case reserved before every one. Every row is scored by the shipped Python package \u2014 tools/run-grader-pilot.js picks tasks and pays for calls and decides nothing. Truncations and model refusals are recorded and excluded from the rates, because a harness artifact is not a model outcome.', null],
  ['gym-record.json', 'The shipped environment, measured by RUNNING it: the difficulty dial (band size against the tolerance multiple, with the point below which no representable double fits), the corpus it draws on, the mix of a 2,000-task sample, and the two standing answers with how much of the ladder each one loses. Produced by tools/run-gym-record.js, which executes the Python package the way a buyer would rather than describing it.', null],
  ['envs-record.json', 'The environments record: the fact corpus (every entry read out of a record in certs/ and sha256-pinned to it, because a canary asserts \u201cprovably wrong\u201d and that may not rest on a re-typed decimal), the grader QA measurement across four reference grader shapes and three tolerances, the uniformity gym\u2019s solver table, and the attacker ladder with the rungs that cannot be broken. Written by running the environments offline \u2014 no model is called and the harness refuses the network unless explicitly switched on.', null],
  ['envs-ledger.jsonl', 'The append-only environments ledger: one row per (environment, rung, model, k) cell with pass rate, Wilson interval, wrong/refused split and the forgery-gate result for the run. Rows so far are reference and stub solvers only; a row produced by a real model is a decision, not a default.', null],
  ['lambda5-audit.json', 'The independent audit of the lambda(5) theorem: a second walk sharing no code with the symbolic engine — inner products by direct trigonometric summation, condition membership by plain integer arithmetic on the record\u2019s own condition vectors, and every set the float screen prunes sampled and re-certified exactly, so the screen is audited rather than trusted. It decides three things and says so: the THEOREM (every gcd-reduced 5-set in the box dips strictly below L(1,2,4,5,6), except the extremizer, which attains it \u2014 a set that did not would be a refuter and aborts), the FIRST LEVEL of the reduction (the engine\u2019s symbolic model says an inner product is its base plus the deltas of the active conditions, and direct summation must agree at every set in the box; every set the generic argument does not close must satisfy one of the eight recorded family conditions), and the OBSTRUCTION by its mechanism rather than by search (on the double-sum core the cosines cancel identically on S(e, pi), so no nonnegative weight can start, and the comb closes every core point where no positive condition is active). It does NOT walk the interior of the eight closure trees; the lambda(4) audit does that for lambda(4).', null],
  ['lambda4-campaign.json', 'The lambda(4) campaign record. Phase 0: Mercer\'s Section-5 strategy (INTEGERS 19 (2019) #A4) executed mechanically — lambda(2) and the whole lambda(3) proof re-derived with exception families discovered and thresholds derived, not transcribed; the lambda(4) generic case with its 14 exception conditions discovered and matched against the paper\'s hand-written list; the measured reduction: five of the fourteen carry strictly negative delta, so NINE families remain. Phase 1, in progress: each family closed so far carries its full derivation here — second-level dot theorem, subfamily cones, derived thresholds, decided finite parts. d = 2c is CLOSED. Re-derived symbolically at every build by the lambda4 battery; finite parts pinned here and sampled at every run.', null],
  ['sublevel-tao179.json', 'The Tao #179 sublevel campaign (Erdős #1038, supremum side): rational-weight discrete measures on [-1,1] are monic root-constrained polynomials via |q| < 1, and this record holds certified sublevel measures — the 2√2 witness, grid champions including the interior cubic champion near 2.7542 and the quintic transition peak near 2.8011 — plus per-degree branch-and-bound THEOREMS: odd degrees strictly below 2.82 < 2√2, even degrees localized to [2√2, 2.82845] with (x²−1)^{N/2} attaining the left end. Every measure an outward enclosure from BigInt Sturm isolation; the box bound calibrated to equal the measure on thin boxes.', null],
  ['mercer-mu5.json', 'The mu(5) ladder, mu(5) ≤ 1 + π/m rung by rung to m = ' + topM + ' — every exceptional tuple closed by one exact rational evaluation.', null],
  ['mu-table.json', 'The Newman min-modulus table: every set in the named boxes exhausted, champions certified, orbits classified, conservation per row.', null],
  ['mu-table-40.json', 'The wider-box extension of the mu table — billions of sets exhausted, the narrow-box crowding artifacts corrected.', null],
  ['lambda-table.json', 'The lambda table: the source lab’s rows reproduced exactly, plus rows that lab’s record does not hold and no table this lab has read holds — a claim about the certificates, not about priority.', null],
  ['census-high-periods.json', 'The Hénon high-period census, p = 13..16: every period point of the classical map found and counted exactly, the plane exhausted box by box, each row re-checked with zero unmatched — the proving ground the interval instruments were calibrated on.', null],
  ['entropy-henon.json', 'The certified entropy lower bound for the classical Hénon map: h-sets, covering relations, and the exact spectral argument.', null],
  ['erdos290-tail-ext.json', 'The Erdős #290 sweep extension: degrees closed beyond the cited page, the constant’s enclosure tightened degree by degree.', null],
  ['mfg2p-regime-map.json', 'The TWO-population regime map: every cell of the coupling plane with its verdict and its exact witness — the symmetric cross-coupling s against the attack-defense asymmetry d, two disjoint enclosures where uniqueness provably fails, the Lasry-Lions monotone strip where it does not, and the refusal reason everywhere else. There is no single-file certifier for this map: it is decided by labs/mfg2p/box2p.js and re-gated by that lab’s battery at every build of its report.', NOVERIFIER('mfg-two-population.html')],
  ['mfg-regime-map.json', 'The mean-field-game regime map: every cell of the coupling–potential plane with its verdict and its exact witness — two disjoint enclosures where uniqueness provably fails, the monotone enclosure where it does not, and the refusal reason everywhere else.', INPAGE('mfg-certify.js')],
  ['matmul-eval-ledger.jsonl', 'The matmul eval’s append-only ledger — every campaign row, every verdict, every tag; the leaderboard is built from this file.', null],
  ['chowla-records.json', 'Certified Chowla merits c(A) = -min_x sum cos(ax) / sqrt|A|, one row per set size n, each an exact UPPER bound proved by instruments/trigmin for the set stored beside it. THIS FILE MAKES NO CLAIM ABOUT CHOWLA’S COSINE PROBLEM. Chowla’s question is asymptotic — whether c can be driven to 0 as n grows — and a low c at one n is a fact about that n. The measured trend here RISES with n (0.6558 at n=10 to 0.8205 at n=30), which is consistent with Chowla’s conjecture that the order is sharp, i.e. evidence against the direction, not for it. Explicit sets with small c are occupied literature (Mercer, INTEGERS 2019; Bedert, arXiv:2509.05260); these rows beat only the classical families recomputed here beside them.', null],
  ['matmul-eval-corrections.json', 'Corrections to rows already written in the matmul eval ledger. The ledger is append-only and is never rewritten, so a row that turns out to be MISLABELLED is corrected here and the correction is applied when the report displays it — currently one: 90 rows tagged v4-effort-low ran at the API’s DEFAULT effort, because the harness dropped its --effort argument in campaign mode. A correction naming a tag no row carries, or claiming a row count the ledger does not hold, refuses the report build.', null],
  ['matmul-loop-ledger.jsonl', 'The verifier-in-the-loop ledger — every trajectory round with its verdict and the exact feedback sent; the loop report is built from this file.', null],
  ['skyaudit-forecast-ledger.jsonl', 'The prediction ledger — interval FORECASTS committed before their target day (sha-pinned, append-only) and scored after in exact rationals; coverage claims are conformal counting theorems, never model faith. Wrong forecasts stay forever.', null],
  ['forecast-gym-ledger.jsonl', 'The Forecast Gym’s append-only ledger — every proposer’s forecast sha-committed before its outcome exists, every score an exact Winkler rational; the gym report and its admission board are built from this file.', null],
  ['lambda56-campaign.json', 'The lambda(5)/lambda(6) campaign record (Chowla’s cosine dip, the non-monotonicity program): lambda(5) = −L(1,2,4,5,6) closed in full — the generic case certified, all eight exception families closed with derived thresholds, 1725 finite sets decided, the extremizer walled — and lambda(6) in progress with nine of its ten families closed in this record. The double-sum-core obstruction theorem (no classical weight works on b+c = a+d = e) and the Fejér–Riesz comb weight that beats it are re-proved by the battery at every run.', null],
  ['terra-sigmastar.json', 'The exact crossover of the MFG splitting program: σ* = 1/(8π²), discount-free, DECIDED IN EXACT RATIONALS — the crossover polynomial factors, the γ-coefficient is identically zero (checked k = 2..12), the band-pass identity and both harmonic windows are exact, π enters only as a Machin bracket of width 1.3e-44.', NOVERIFIER('terra.html')],
  ['terra-bracket-table.json', 'The bracket table under the splitting theorems: seven certified rows straddling both predicted thresholds — negatives below the amplitude threshold and past the crossover, replications, and the threshold pin r_c ∈ [0.13, 0.14] with the exact-rational prediction landing inside. Honest counting lives here: two theorems plus a table, never eight.', NOVERIFIER('terra.html')],
  ['mfg-cap-multiplicity.json', 'Certified multiplicity for the ergodic quadratic MFG past its pitchfork: at each of six couplings, at least THREE distinct exact solutions enclosed in pairwise disjoint uniqueness balls with certified positive density — exactly where Lasry–Lions monotonicity is silent. The c = −9.5 monotone-regime boundary, where the branch collapses and no claim is made, is recorded too.', NOVERIFIER('terra.html')],
  ['attnflow-theorems.json', 'The attention-wing theorems: a rational-kernel token flow chosen so equilibrium and stability are DECIDABLE in exact ℚ — the consensus spectrum proved β- and p-free by exact dual-number expansion, the two-cluster cross-weights identically zero with the honest p = 1 boundary, the reduced flow’s double zero decided by exact division (every pitchfork claim refuted), and the phantom-bifurcation taxonomy with its live artifact.', NOVERIFIER('terra.html')],
  ['facelaw-theorem.json', 'The face-dimension law k = |shared| − cons + z, decided against the exact ℚ null space on two seeded 4,000-network ensembles; every instance where the natural shortcut fails (precisely the z > 0 cases) is ENUMERATED here so any reader can re-run any one.', NOVERIFIER('terra.html')],
];
/* the terra enclosure + peak-count records, one pair per instance */
for (const t of ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8']) {
  const T = t.toUpperCase();
  CERTS.push([
    'terra-recert-' + t + '.json',
    'The ' + T + ' enclosure of the congestion-MFG splitting program: a radii-polynomial certificate around the stored candidate — exact instance parameters, certified ℓ¹_ν ball radius, contraction bound Z₁, closure margin, and density floor — re-certified here against the frozen published verifier extended with the data terms; nine falsifiers fire per instance at every battery run.',
    NOVERIFIER('terra.html')]);
  CERTS.push([
    'terra-peakcount-' + t + '.json',
    'The certified peak count for ' + T + ': the exact number of strict maxima of EVERY density in the ' + T + ' enclosure ball, derived from CERTIFIED region signs only (instruments/critcount) — outward coefficient products, ball Lipschitz folded into the cell pad, never a float sign.',
    NOVERIFIER('terra.html')]);
}
/* the mfg-cap census, one record per truncation level */
for (const N of [2, 3, 4, 5]) {
  CERTS.push([
    'mfg-cap-census-N' + N + '-c-12.json',
    'The Krawczyk exhaustion census at Galerkin level N = ' + N + ': every subbox of the printed box eliminated by interval residual or Krawczyk exclusion, each survivor isolated by K(X) ⊂ int(X) — EXACTLY three solutions of the truncated even system at c = −12, matched one-to-one to the candidates. Box-bounded, truncation-level; the PDE-level count is the stated open problem.',
    NOVERIFIER('terra.html')]);
}
/* the ember chain, one record per stage */
{
  const E = {
    spectrum: 'Stage 1 of the hot-spots chain: two-sided spectrum localization for the trapezoid — interval Galerkin Rayleigh–Ritz uppers (floats only pick the subspace), exact-rational Crouzeix–Raviart assembly with interval LDLᵀ inertia counts and Liu’s framework for the lowers; the certified gap makes μ₁ SIMPLE. The rectangle regression encloses π² at every run.',
    defect: 'Stage 2: the frozen Helmholtz trial’s boundary defect — order-2 interval Taylor jets along every edge with Bessel-ODE closure, a certified midpoint-Taylor cell rule, value AND derivative bridges against an independent float evaluation, and the exact trial coefficients frozen for every downstream stage.',
    eigenpair: 'Stage 3: the eigenpair certificate — the boundary-residual identity with the rational star-shaped trace constant and the CR localization tightens μ₁ by a factor of ~105 and encloses the eigenfunction in L²; also the H¹ error and the δλ bound the pointwise machinery consumes.',
    pointwise: 'Stage 4: the solid-mean pointwise machinery — kernel norm I₀ = 5/48 DERIVED in exact rationals, witness balls decided inside Ω in exact rationals, and every CORE cell of the 1/100 grid (corner-min depth ≥ 3/40, exact by concavity) killed on both sides with zero survivors.',
    collar: 'Stage 5: the collar sweep — every sub-core cell killed by the value argument with REFLECTED pointwise bounds across its nearest open edge (the single layer bounded by the certified per-edge flux sups), kill-or-refine to 1/800, ZERO residual cells.',
    corner: 'Stage 6: the four corner-tip certificates — Bessel–Fourier coefficients certified by annulus L² extraction AND re-extracted at a second annulus (the enclosures must intersect — a condition of entry), value kills at B/C/D, radial monotonicity at A, and the ladder-identity wedge bound at C where the boundary minimum lives.',
    cross: 'The independent cross-derivations: I₀ = 5/48 in exact rationals, the trace constant re-derived on directed dyadic big-floats from the exact-rational star geometry, μ₁ bounded above on an independent conforming P1 basis, and the two-annulus corner condition re-asserted.',
    theorem: 'The assembled hot-spots theorem: cross-record chain consistency (every stage’s inputs equal the upstream outputs), the interior partition RE-DECIDED IN EXACT RATIONALS, every sweep and tip verdict re-checked, the honest framing with its fence list, and the sha256 of every input record.',
  };
  for (const [st, d] of Object.entries(E)) CERTS.push(['ember-' + st + '.json', d, NOVERIFIER('ember.html')]);
}
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
const B = [];
B.push(C.header({
  eyebrow: 'Carlos Toledo · cert-machine',
  title: 'The machine proves it — or breaks it',
  deck: 'AI produces mathematical claims faster than anyone can read them, and the graders that check those claims '
    + 'mostly compare decimals. This machine decides claims — other people\'s and its own — in exact arithmetic, '
    + 'without ever running the claimant\'s code. It refuted a published constant at its twelfth digit, measured '
    + 'what an ordinary tolerance grader actually accepts ('
    + (100 * envsTol.falseAccept).toFixed(1) + '% of submissions that are provably wrong), and settled two values '
    + 'of a sequence conjectured open since 2019. Every verdict is a re-runnable certificate: proved, disproved, or '
    + 'honestly refused — never a probability argument.'
}));
B.push(C.scope('No probability arguments and no digit-matching. A claim is admitted only by exact arithmetic on whole '
  + 'numbers, and an instrument that cannot decide refuses instead of guessing. When a page here says REFUTED, that '
  + 'is a proof, and the falsifying witness is printed beside it.'));

/* the four results a stranger should meet first — two theorems, then the two
   strongest audits (2026-09-02: the theorems earned the front). Files are
   gated against the shelf below, so a lead card can never point at a report
   that is not catalogued — and the descriptions are written for someone who
   is smart and is not a number theorist, which is a different job from the
   shelf's. */
const LEAD = [
  /* THE PORTFOLIO LEAD, set 2026-09-03. Under the position — independent exact certification, with
     refusal as a verdict — the audits lead and one theorem calibrates them. ember.html and
     lambda4.html moved back to the shelf the same day: they are not weaker, they are older, and the
     lead has four slots. Both stay fully ranked in REPORTS and rejoin shelfHead automatically. */
  { f: 'envs.html', k: 'the measurement · adversaries with a proof',
    title: 'We graded the graders',
    desc: 'Almost every mathematical grader compares a number to a stored decimal within a tolerance. '
      + 'Against ' + fmt(envsRec.provablyWrong) + ' submissions that are PROVABLY wrong — each one outside a '
      + 'certified enclosure — that grader accepts ' + (100 * envsTol.falseAccept).toFixed(1) + '% of them, and '
      + 'a grader that compares against the certificate instead accepts none. The adversarial set is not written '
      + 'by hand: a certified enclosure mints it without limit, which is why the certificates had to exist first. '
      + 'One of the canaries is not synthetic — it is a number a real problem thread published.',
    n: fmt(envsRec.corpus.length) + ' facts, each sha-pinned to its certificate · measured offline' },
  { f: 'erdos852.html', k: 'a refutation · erdős #852',
    title: 'The constant that was a rounding error',
    desc: 'A constant for an open Erdős problem, published with frontier-model help, quoted to ' + csPubDigits
      + ' decimal places, with no error bound. It is wrong from digit ' + csWrongAt + ' — and the wrong digits are exactly '
      + 'what an ordinary floating-point loop prints. The constant was not near-right with unlucky endings. It was the '
      + 'bug, published. The corrected value is certified here and the correction is now public in the problem’s own thread.',
    n: 'refuted at digit ' + csWrongAt + ' · correction certified and public' },
  { f: 'ai-claims-audit.html', k: 'six theorems · re-verified',
    title: 'We checked the AI’s homework',
    desc: 'Six mathematical results produced with frontier-model help — among them a counterexample to a bound of '
      + 'Maxwell’s and an Erdős problem open since 1958 — re-verified here from the manuscripts, by code that never ran '
      + 'a line of the authors’. ' + aiClaims.confirmed + ' held, ' + aiClaims.partial + ' came back partial, '
      + (aiClaims.refuted === 0 ? 'none was refuted' : aiClaims.refuted + ' were refuted')
      + '. The finding is not the tally: in all ' + aiClaims.lanes + ', the part a machine '
      + 'can check held, and the part that carries the theorem stayed out of reach.',
    n: aiClaims.checks + ' checks · ' + aiClaims.mutations + ' deliberate forgeries, every one rejected' },
  { f: 'lambda5.html', k: 'a theorem · erdős #510',
    title: 'A sequence that was climbing turns down',
    desc: 'Mercer proved the first two values of Chowla’s cosine dip in 2019 and conjectured the rest. This machine '
      + 'proved the third, and then the fourth: λ(5) = −L(1,2,4,5,6), an algebraic number of degree exactly five, '
      + 'with the minimal polynomial exhibited. One family in the reduction admits no classical weight at all — a '
      + 'structural obstruction the page proves fresh at every build. And a consequence needs nothing further: '
      + 'λ(6) < λ(5), so the sequence that had been climbing turns down.',
    n: 'audited over ' + fmt(l5audit.setsWalked) + ' sets, 0 refuters · not peer-reviewed' },
];
/* LEAD ORDER, set 2026-09-03: the CATCHES lead and the theorems follow.
   Theorems earn respect; catches earn attention, and a theorem read first
   makes this look like a prover's site rather than an auditor's. The order
   below is the ranking the landing draws. */
/* The array order above IS the ranking; this only guards against editing one and not the other. */
if (LEAD.length !== 4) fail('the lead has ' + LEAD.length + ' cards — the landing is built for four');

/* keller and tensor-rank-bounds moved from the lead back to the shelf on
   2026-09-02 — the theorems took their places; both remain fully ranked in
   REPORTS and rejoin shelfHead automatically. */
{
  const shelved = new Set(REPORTS.map((r) => r.f));
  for (const l of LEAD) if (!shelved.has(l.f)) fail('the landing leads with ' + l.f + ', which is not on the shelf — that link would 404');
}
B.push(C.section({
  lab: 'start here', title: 'The audits lead. The theorem is the calibration.', wide: true,
  bodyRaw: C.pRaw('<strong>Only a machine that can prove a theorem should be trusted to refuse one.</strong> The '
    + 'audits are what the instruments are for; the theorems below them are the evidence that the instruments are '
    + 'strong enough for their refusals to count.')
    + C.cards(LEAD.map((l) => ({ href: 'reports/' + l.f, k: l.k, title: l.title, desc: l.desc, n: l.n })))
}));

B.push(C.section({
  lab: 'the theorem, in full', title: 'How a trapezoid got a theorem',
  bodyRaw: [
    C.p('The domain is deliberately inconvenient: a convex trapezoid with side slopes 6 and 18/5, no symmetry '
      + 'axis, nothing any existing proof technique can grab. The machine proves its second Neumann eigenvalue is '
      + 'simple by certifying a spectral gap — upper bounds from an interval Galerkin method, lower bounds from '
      + 'exact-rational finite elements with eigenvalue counts by interval inertia. It then builds a trial '
      + 'function that solves the eigenvalue equation EXACTLY — a sum of Bessel fans anchored at the four corners '
      + '— and certifies that its boundary defect is a hundred-thousandth, which pins the true eigenfunction '
      + 'within an explicit distance of the trial.'),
    C.p('Then the geography: every interior point is assigned, in exact rational arithmetic, to a deep core, a '
      + 'boundary collar, or a corner sector — and each region is killed by its own argument. Core and collar '
      + 'cells die by comparison against certified interior witnesses; the corner sectors die by certified '
      + 'series expansions, where the delicate corner needs a Bessel ladder identity to tame a divergent second '
      + 'derivative whose singular part arrives, provably, with the helpful sign. Zero cells survive. The '
      + 'extremes are on the boundary, the hottest point is vertex A and nowhere else, and the whole chain — '
      + 'eight records, every red control firing — re-runs from one command in about two minutes. '
      + 'The full account: '),
    C.pRaw('<a href="reports/ember.html">the report</a> · <a href="https://doi.org/10.5281/zenodo.22225860">the archived release</a>.'),
  ].join('\n')
}));

B.push(C.section({
  lab: 'the refutation, in full', title: 'How a floating-point bug became a published constant',
  bodyRaw: [
    C.p('Erdős problem #852 has a constant attached to it. In 2026 a value for that constant appeared, produced with '
      + 'frontier-model help and quoted to ' + csPubDigits + ' decimal places. This machine enclosed the same constant in '
      + 'exact arithmetic. The two agree for a while and then they do not.'),
    C.code(csDigitBlock),
    C.p('The interesting part is which wrong digits. The obvious way to compute this constant is a loop: take a few '
      + 'million prime numbers, turn each into a factor slightly larger than one, and multiply them together in ordinary '
      + 'floating point. Past a certain size those factors are so close to one that rounding makes them exactly one, and '
      + 'they stop contributing anything at all. The running product goes still. Going still is what convergence looks '
      + 'like, so the loop appears to have settled, and it prints.'),
    C.pull('<b>The published constant is what that loop prints, digit for digit.</b> It was not approximately right with '
      + 'unlucky endings. It was the bug.'),
    C.p('That is why one wrong constant is worth a whole page. Every ordinary defence fails against this. Rerunning it '
      + 'reproduces the same wrong digits, because two independent floating-point implementations agree with each other '
      + 'rather than with the truth. Spending more compute changes nothing, because the loop is already ignoring almost '
      + 'every factor you would be adding. Checking the digits against a reference value fails whenever the reference '
      + 'came out of the same kind of pipeline — which is how a bad number gets into an answer key and stays there.'),
    C.p('What settles it is arithmetic that never rounds. The refutation here is a strict inequality between two whole '
      + 'numbers, with a denominator millions of digits long and no approximation anywhere in it. The corrected value is '
      + 'trapped between two exact fractions that agree for ' + csSettled + ' decimal places, so the true constant cannot '
      + 'be anywhere near the published one.'),
    C.pRaw('The correction has been public in the problem’s own thread on erdosproblems.com since '
      + C.esc(longDate(e852Public.date)) + '. <a href="reports/erdos852.html">The full audit →</a> — the refutation as '
      + 'integers, the certified correction, and a catalogue of the other ways a mathematical answer key goes wrong '
      + 'without anyone noticing.')
  ].join('\n')
}));

/* ---- the reports -------------------------------------------------------- */
/* the head of the RANKING minus the four already led with, so the shelf never
   shows a stranger the same card twice */
const shelfHead = REPORTS.filter((r) => !LEAD.some((l) => l.f === r.f)).slice(0, 6);
B.push(C.section({
  lab: 'the shelf', title: 'The record, ordered by weight', wide: true,
  bodyRaw: '<div id="reports"></div>'
    + reportCards(shelfHead, 'reports/')
    + '<div class="col after-fig">'
    + C.pRaw('<a href="reports/">All ' + REPORTS.length + ' reports →</a> — the AI-verification shelf, the Erdős '
      + 'problems, the applied fronts in aerospace and energy, and the classical ground the instruments were proven '
      + 'on first. Every number on every page is recomputed from the certificates and records at build time, and a '
      + 'build that drifts refuses to ship.')
    + '</div>'
}));

B.push(C.section({
  lab: 'why you can trust this', title: 'One rule, and what it costs',
  bodyRaw: [
    C.p('Everything here rests on a single rule, and most of the engineering is the cost of keeping it.'),
    C.plainList([
      { b: 'A fast check may only rule things out.', text: 'Floating-point screens run first and discard candidates by '
        + 'the million. They are never allowed to let one through. Nothing reaches a verdict without exact arithmetic '
        + 'behind it, so a rounding error can cost time and can never cost truth.' },
      { b: 'Both verdicts are theorems.', text: 'CERTIFIED means the statement was re-derived from whole numbers. '
        + 'REFUTED means a falsifying witness exists, and it is printed. Neither one is a confidence level.' },
      { b: 'An instrument that cannot decide says so.', raw: 'REFUSED is a real verdict here and it gets used: on '
        + 'the eval board it is ' + evalRefusalRate + ' of ' + fmt(evalClaims) + ' submitted claims, and every '
        + 'other refusal in the lab is counted by kind — with its own denominator, never merged into one number — '
        + 'on <a href="reports/refusals.html">the refusals page</a>. A number that cannot be proved does not get '
        + 'published as though it were.' },
      { b: 'Every battery carries forgeries that must fail.', text: 'Fake inputs are planted in each run, including one '
        + 'wrong by a billionth — invisible to any floating-point check. If a forgery ever passes, the run aborts before '
        + 'it grades anything real. Every genuine bug this project has found was caught that way; none by reading code.' }
    ])
  ].join('\n')
}));

/* ---- the machine, drawn ------------------------------------------------- */
/* The COMPACT drawing (operator instruction 2026-08-31: the full schematic is
   too big for the homepage — it stays on the control page, which links from
   here). The battery count comes from batteries.json, the record the control
   build measured and wrote. make site runs make control first, so it is
   never stale. */
const { machineFlowCompact } = require(path.join(__dirname, 'machine-figure.js'));
const gates = (() => {
  const p = path.join(ROOT, 'batteries.json');
  if (!fs.existsSync(p)) fail('batteries.json missing — run make control (make site does) so the gates count is measured, not remembered');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
})();
B.push(C.section({
  lab: 'the machine', title: 'How a claim becomes a certificate', wide: true,
  bodyRaw: machineFlowCompact(ledger, { gates })
    + '<div class="col after-fig">' + C.pRaw('The <a href="machine/">control page</a> carries the full drawing, live: every '
      + 'family, every instrument, every battery executed at its build (never remembered), the full ledger '
      + 'decomposition, drift status. If you have a claim you want put through it, '
      + '<a href="reports/claims.html">the claims desk</a> takes one: certified, refuted, or honestly refused, '
      + 'published whichever way it falls — ' + fmt(claimsLedger.decided) + ' decided so far, '
      + claimsLedger.submitted + ' of them sent by somebody else.') + '</div>'
}));

/* ---- the tally ----------------------------------------------------------
   the stat strip, which used to open the page. It is evidence of scale, not
   a reason to care, so it sits after the reason. */
B.push(C.section({
  lab: 'the tally', title: 'What it has decided so far', wide: true,
  bodyRaw: C.stats([
    { k: 'theorem programs', v: '3', role: 'held',
      n: 'Chowla\'s cosine dip — λ(4) and λ(5) both exact, and with λ(5) the sequence provably turns down at 6; '
        + 'the hot-spots trapezoid with its vertex-A corollary; the MFG splitting pair with its bracket table — '
        + 'every one re-proved or re-walked at build' },
    { k: 'published claims decided', v: fmt(claimsLedger.decided), role: 'warn',
      n: Object.entries(claimsLedger.byVerdict).filter(([k]) => k !== 'QUEUED').map(([k, v]) => v + ' ' + k).join(' · ')
        + ' — every row derived from the record that decided it; ' + claimsLedger.pending + ' queued and not counted, '
        + 'and ' + claimsLedger.submitted + ' submitted by somebody else. The ' + aiClaims.lanes
        + ' AI-claimed theorems in the next tile are ' + aiClaims.lanes + ' of these rows, not a separate total.' },
    { k: 'AI-claimed theorems re-verified', v: fmt(aiClaims.lanes),
      n: aiClaims.confirmed + ' held, ' + aiClaims.partial + ' partial, ' + (aiClaims.refuted === 0 ? 'none refuted' : aiClaims.refuted + ' refuted') + ' — checked from the '
        + 'manuscripts, never from the authors’ code' },
    { k: 'AI-discovered algorithms re-decided', v: fmt(strassenN), role: 'held',
      n: 'at every build, from commit-pinned bytes — AlphaEvolve’s rank-48 ⟨4,4,4⟩ certified over Z[i]; '
        + 'AlphaTensor’s rank-47 verified over F2 and refuted over Q' },
    { k: 'model proposals graded', v: fmt(evalReal.length),
      n: evalCert + ' certified, each an exact theorem · ' + (evalRefuted === 0 ? 'none subtly wrong — nothing false has ever been graded correct' : evalRefuted + ' subtly wrong') },
    { k: 'closed forms disproved', v: fmt(T.closedFormRefuted + T.closedFormRefutedExact), role: 'held',
      n: 'each one an exact proof, out of ' + fmt(T.closedFormTested) + ' tested — and zero discoveries claimed' },
    { k: 'Hénon points, counted exactly', v: 'EXACTLY ' + fmt(census16.points), role: 'held',
      n: 'period 16, with a proof that there are no others anywhere in the plane — ' + fmt(census16.boxes)
        + ' boxes exhausted. The classical case the instruments were calibrated on before they were pointed at anything new.' }
  ])
}));

/* ---- the app ------------------------------------------------------------ */
const skySummary = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps/skyaudit/data/day-2026-08-26/nyc.audit-summary.json'), 'utf8'));
const skyRefly = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps/skyaudit/data/day-2026-08-26/nyc.refly.json'), 'utf8'));
const skyBeta = skySummary.bySpecRule['beta-alia|faa-sfar-vfr'];
const skyFleet = skyRefly.keys['beta-alia|faa-sfar-vfr'].fleetMin;
B.push(C.section({
  lab: 'the same instrument, pointed at the world', title: 'SkyAudit — one real day over New York, every flight decided',
  bodyRaw: [
    C.p('A real, hash-pinned day of New York helicopter traffic — ' + skySummary.uniqueAircraft + ' aircraft, '
      + skySummary.flights + ' flights — replayed on a map. Every trail is coloured by a verdict rather than by '
      + 'telemetry: each flight is re-flown on paper by an electric aircraft, using that manufacturer’s own published '
      + 'numbers, under the FAA’s energy-reserve rule, and decided.'),
    C.p('Beta’s ALIA can certifiably cover ' + skyBeta.CERTIFIED + ' of the ' + skySummary.flights + ' flights and '
      + 'needs exactly ' + skyFleet + ' aircraft to do it — the lower half proved by pigeonhole, the upper half by an '
      + 'actual schedule. Joby, Archer and Eve publish too little to certify a single fleet, and the app says NEEDS DATA '
      + 'rather than guessing, with the exact number that would flip it printed beside the verdict.'),
    C.pRaw('<a href="apps/skyaudit/">Open SkyAudit →</a> — the replay, the certificate panel, the fleet frontier and the '
      + 'what-if sliders, live. Data © adsb.lol (ODbL). Also live: <a href="apps/skyaudit/sp/">the São Paulo pack</a> '
      + '— the world’s busiest urban helicopter market, decided under Brazil’s own reserve rule.')
  ].join('')
}));

B.push(C.section({
  lab: 'for people building evals', title: 'A grader that cannot be fooled',
  bodyRaw: [
    C.p('The instrument that audits a published claim also grades a model’s output, and that is turning out to be the '
      + 'more useful job. A model proposes an exact object; the grader re-derives it from whole numbers and answers '
      + 'CERTIFIED or REFUTED. There is no judge model, no rubric, and no stored answer key — so there is nothing to '
      + 'leak into a training set and nothing to game. The gap between \u201cgraded correct\u201d and \u201cis correct\u201d that a policy '
      + 'would learn to exploit does not exist, because the grade is the proof.'),
    C.p('That is measured, not asserted. Every campaign opens with deliberate forgeries — including one wrong by a '
      + 'billionth, invisible to any floating-point check — and if a single forgery grades as correct the run aborts '
      + 'before it touches real work. Across every real-model campaign so far, ' + fmt(evalReal.length) + ' proposals, '
      + (evalRefuted === 0
        ? 'nothing false has ever been graded correct and no certified row has ever turned out to be wrong.'
        : evalRefuted + ' well-formed proposals were refuted exactly and none of them certified.')),
    C.p('The honest limit: this works for claims that come down to finitely many exact arithmetic facts — exhibit a '
      + 'witness, verify an identity, bound a quantity. It does not work for mathematics at large, and nothing here '
      + 'pretends otherwise. Inside that boundary the same grader can sit unchanged inside a training loop, with the '
      + 'verifier strictly stronger than the thing it is grading.'),
    C.pRaw('<strong>And the grader itself is now measured, not assumed.</strong> Point a suite of provably-wrong '
      + 'submissions — minted from certified enclosures, so each one is outside a certificate by construction — at '
      + 'the four grader shapes, and an absolute-tolerance grader accepts ' + (100 * envsTol.falseAccept).toFixed(1)
      + '% of them while a grader that compares against the certificate accepts none. '
      + '<a href="reports/envs.html">We graded the graders →</a>'),
    C.pRaw('<a href="oracle/">The oracle, packaged →</a> — one curl, no dependencies, running on your laptop in under a '
      + 'minute: the claim schema, the tool definition a model calls mid-generation, the paste box, the paper draft, '
      + 'the ledgers.')
  ].join('\n')
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
    rows: CERTS.map(([f, what, v]) => [
      { raw: '<a href="certs/' + f + '"><span class="m">' + C.esc(f) + '</span></a>' },
      what,
      { raw: !v ? C.tag('battery-gated', 'dep')
        : v.tag ? C.tag(v.tag, 'dep') + ' <a href="' + v.href + '">' + C.esc(v.label) + '</a>'
          : '<a href="' + v.href + '"><span class="m">' + C.esc(v.label) + '</span></a>' }
    ])
  })
    + '<div class="col">' + C.pRaw('Code, corpus, and full provenance: <a href="' + GITHUB + '">'
      + C.esc(GITHUB.replace('https://', '')) + '</a> — MIT, no dependencies. Instruments lifted from a private '
      + 'source lab are hash-pinned in PROVENANCE.json; patches are declared so they can never be mistaken for drift.') + '</div>'
}));

B.push(C.section({
  lab: 'the limits', title: 'What this is not',
  bodyRaw: [
    C.p('This is one machine and one operator. The trust base is stated rather than hidden: V8’s big-integer '
      + 'arithmetic and IEEE-754 correct rounding are assumed correct, and a handful of named external theorems are '
      + 'consumed and cross-checked rather than machine-proved. Nothing here is a formal proof in the sense of Lean or '
      + 'Coq, and no page claims to be.'),
    C.p('What it does meet is the working standard of the computer-assisted-proof tradition — Tucker on the Lorenz '
      + 'attractor, Galias on the Hénon censuses, whose published counts this machine reproduces independently. That '
      + 'is one rung below a formal proof and several rungs above a decimal that looked convincing.'),
    C.pRaw('<strong>What independence means here, exactly.</strong> Independence from the CLAIMANT: when this '
      + 'machine decides someone else\'s claim, it does not run their code and their code is never in the trust '
      + 'path. It does not mean every checker is a clean-room rewrite of every producer. Two instruments reuse code '
      + 'across the producer/checker line, both times this lab\'s own and both deliberately: '
      + C.m('instruments/mfgcap') + ' IMPORTS the frozen verifier published with the congestion result rather than '
      + 'editing it — freezing those bytes is the point, and they are re-extracted from the sent page at every '
      + 'build — and ' + C.m('instruments/lemniscate') + ' was crossed from this lab\'s own bench with its '
      + 'require paths repointed at the certifier that bench already used. Where a page claims clean-room '
      + 'independence — the λ(4) clause walk, the #1038 forcing re-check, the band verifier — it says so on that '
      + 'page, and it means it.')
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
    lab: 'the shelf', title: 'Verification — the audits, the environments, the desk', wide: true,
    bodyRaw: reportCards(AI_REPORTS, '')
  }),
  C.section({
    lab: 'the open list', title: 'Erdős problems, audited', wide: true,
    bodyRaw: reportCards(ERDOS_REPORTS, '')
      + '<div class="col after-fig">'
      + C.pRaw('Erdős’s list is a public register of open questions, which makes it the sharpest available test '
        + 'of whether a verdict produced here survives contact with the people who own the problem. Each page '
        + 'decides a finite, exact fragment and says exactly which one: a published constant refuted at its '
        + 'twelfth significant digit with its correction certified, certified extremal tables for Chowla’s '
        + 'cosine problem, a square-discriminant law re-proved as integer identities, and an independent '
        + 'verification of a claimed proof’s computational appendix. What has been filed with each problem, '
        + 'and what has come back, is on <a href="/about/">the about page</a>, in status words meant exactly.')
      + '</div>'
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
      /* names only what this lane still holds: two of the old examples (the
         Newman boxes, the Apéry ladder) are catalogued in other lanes now */
      + C.pRaw('These are where the verifiers earned calibration before deciding anything a model produced: a '
        + 'published Wardrop table reproduced within its own rounding and then proved outright, mean-field '
        + 'equilibria enclosed in disjoint balls where uniqueness theory is silent and REFUSED at the '
        + 'bifurcation, an entropy bound calibrated at the full horseshoe. The audits above — and the Erdős '
        + 'pages, whose exhaustive box sweeps are these same instruments — stand on this ground.')
      + '</div>'
  })
].join('\n\n');
const reportsIndexFoot = '<footer class="col"><p>Generated by tools/build-site.js @ git ' + git + '. '
  + 'MIT. <a href="' + GITHUB + '">Source</a>.</p></footer>';

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
        + '<a href="/reports/methods-note.html">None by reading code</a> — the red-control discipline as '
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
        + 'someone else\'s. The registry of independent reruns lives on this page and is empty until it isn\'t: '
        + '<span class="m">' + reruns.length + ' recorded</span> at this build, read from '
        + '<span class="m">corpus/external-reruns.json</span>. To be in it: clone '
        + '<a href="https://github.com/carlostoledo1891/cert-machine">the repo</a>, run any detached verifier or '
        + '<span class="m">oracle/battery.py</span>, and send the printed sha256 with your name and date to '
        + '<a href="mailto:carlos@carlostoledo.co"><span class="m">carlos@carlostoledo.co</span></a> — name, '
        + 'date and hash get recorded here and on <a href="/machine/">the control page</a>.')
    ].join('\n')
      + (reruns.length ? C.table({
        cols: [{ h: 'who' }, { h: 'date' }, { h: 'what was rerun' }, { h: 'hash printed' }],
        rows: reruns.map((r) => [r.who, r.date, r.what, { raw: '<span class="m">' + r.hash + '</span>' }])
      }) : '')
  })
];
const oracleFoot = '<footer class="col"><p>Generated by tools/build-site.js @ git ' + git + '. Gates at this '
  + 'build: oracle/battery.py (' + oracleChecks + ' checks, ' + oracleReds + ' reds fired), the paste-box '
  + 'widget\'s known answers, the ladder recount from the eval ledger (a certified impossible-rank row refuses '
  + 'the build), the loop recount, and the rerun registry — the page refuses to build on any deviation. '
  + 'cert-machine · Carlos Toledo.</p></footer>';

/* ---- /about/ ------------------------------------------------------------
   Adapted from the source lab's about page — the content and the standard,
   never the styles (operator ruling, 2026-08-27). Statuses below are the
   operator's own record; a status word is meant exactly. */
const aboutBody = [
  C.header({
    eyebrow: 'Carlos Toledo · about',
    title: 'Not correct. Checkable.',
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
      C.plainList(outreach.rows.map((r) => ({
        b: r.status.charAt(0).toUpperCase() + r.status.slice(1) + ' — sent ' + longDate(r.sent) + '.',
        raw: C.esc(r.what) + ' <em>(' + (r.url ? '<a href="' + C.escAttr(r.url) + '">' + C.esc(r.where) + '</a>' : C.esc(r.where)) + ')</em>.'
          + (r.note ? ' ' + C.esc(r.note) : '')
      }))),
      C.pRaw('Status words mean exactly what they say and nothing more: '
        + Object.entries(outreach.statusWords).map(([k, v]) => '<em>' + C.esc(k) + '</em> — ' + C.esc(v)).join(' · ')
        + '. Last checked ' + C.esc(longDate(outreach.lastChecked)) + '.'),
      C.pRaw('<strong>Filed is not accepted; posted is not replied.</strong> No result on this site has yet been '
        + 'reproduced by anyone else, and none has been peer-reviewed. That is the plain state of it, and it is '
        + 'why the pages ship their own falsifiers rather than asking for trust.'),
      C.pRaw('Traffic in the other direction has somewhere to go now: <a href="/reports/claims.html">the claims '
        + 'desk</a> takes a claim and answers it in public, whichever way it falls. '
        + fmt(claimsLedger.decided) + ' have been decided so far and ' + claimsLedger.submitted + ' of those was '
        + 'sent by somebody else — a number this site publishes while it is still zero.')
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
{
  /* the landing's own claim gate: any "first ..." on this page must travel
     with its qualifier (the fence lists live on the report pages) */
  const joined = B.join('\n\n');
  if (/\bfirst (certified |validated[- ])?[a-z-]* ?(hot-spots|enclosure|domain)/i.test(joined) && !/to\s+our knowledge/i.test(joined)) {
    fail('a priority claim reached the landing without its qualifier');
  }
}
put('index.html', Buffer.from(TPL.render({ title: 'cert-machine · independent exact certification', bodyRaw: B.join('\n\n'), footRaw: foot, path: '/',
  desc: 'Independent exact certification of machine-generated mathematics — exact arithmetic, no code shared with the claimant, refusal as a verdict. Certified audits of published AI-generated mathematics, evals whose ground truth is a proof, and the theorems that calibrate the instruments.' })));
put('reports/index.html', Buffer.from(TPL.render({ title: 'Reports · cert-machine', bodyRaw: reportsIndexBody, footRaw: reportsIndexFoot, path: '/reports/',
  desc: 'The reports shelf: certified audits of AI-generated mathematics, evals whose ground truth is a proof, a verified reward channel — and the instruments, proven on hard classical ground. Every page recomputes its numbers at build.' })));
put('about/index.html', Buffer.from(TPL.render({ title: 'About · Carlos Toledo', bodyRaw: aboutBody, footRaw: aboutFoot, path: '/about/',
  desc: 'Not correct — checkable. Computer-assisted proof and validated numerics: what every page here owes you, the record of what has left the building, and how these pages are made.' })));
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
put('robots.txt', Buffer.from('User-agent: *\nAllow: /\nSitemap: https://carlostoledo.co/sitemap.xml\n'));
put('machine/index.html', fs.readFileSync(path.join(ROOT, 'index.html')));
for (const f of fs.readdirSync(path.join(ROOT, 'reports'))) {
  if (f.endsWith('.html') || f.endsWith('.py') || f.endsWith('.js')) put('reports/' + f, fs.readFileSync(path.join(ROOT, 'reports', f)));
}
for (const f of fs.readdirSync(path.join(ROOT, 'certs'))) {
  if (WORKING.test(f)) continue;          /* the one pattern, not a second copy */
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
/* sitemap: every PAGE in the desired map (the landing, section indexes,
   the reports) plus the app-zone pages the app builds emit. Raw citation
   files, certificates and verifiers are crawlable but are not pages. */
{
  const urls = ['/', '/apps/skyaudit/', '/apps/skyaudit/sp/'];
  for (const rel of desired.keys()) {
    if (rel === 'index.html') continue;
    if (rel.endsWith('/index.html') && !rel.startsWith('research/')) urls.push('/' + rel.slice(0, -'index.html'.length));
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
