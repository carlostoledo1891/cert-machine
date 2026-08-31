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
  /* lane 'erdos', ranked here: the refutation is the head of the whole shelf */
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
  ['strassen-certificate.json', strassenN + ' fast matrix-multiplication algorithms as exact tensor identities over Q and F2 — including AlphaTensor’s rank-47, decided both ways.', PY('verify_strassen.py')],
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
  ['matmul-loop-ledger.jsonl', 'The verifier-in-the-loop ledger — every trajectory round with its verdict and the exact feedback sent; the loop report is built from this file.', null],
  ['skyaudit-forecast-ledger.jsonl', 'The prediction ledger — interval FORECASTS committed before their target day (sha-pinned, append-only) and scored after in exact rationals; coverage claims are conformal counting theorems, never model faith. Wrong forecasts stay forever.', null],
  ['forecast-gym-ledger.jsonl', 'The Forecast Gym’s append-only ledger — every proposer’s forecast sha-committed before its outcome exists, every score an exact Winkler rational; the gym report and its admission board are built from this file.', null]
];
{
  /* In-progress campaign shards are WORKING records, not published ones: the
     detached #290 tail run writes one file per shard and `merge` folds them
     into erdos290-tail-ext.json, which is what this table describes. They are
     gitignored for the same reason certs/shard-logs/ is, and excluded here so a
     running campaign cannot block a site build. */
  const WORKING = /^erdos290-tail-shard-\d+\.json$/;
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
  title: 'We check the math that machines publish',
  deck: 'AI systems are producing mathematical results — new constants, new algorithms, new theorems — faster than '
    + 'anyone is reading them. This machine decides them one at a time and shows its work: proved, disproved, or '
    + 'honestly refused.'
}));
B.push(C.scope('No probability arguments and no digit-matching. A claim is admitted only by exact arithmetic on whole '
  + 'numbers, and an instrument that cannot decide refuses instead of guessing. When a page here says REFUTED, that '
  + 'is a proof, and the falsifying witness is printed beside it.'));

/* the four cases a stranger should meet first. Their files are gated against
   the shelf below, so a lead card can never point at a report that is not
   catalogued — and the descriptions are written for someone who is smart and
   is not a number theorist, which is a different job from the shelf's. */
const LEAD = [
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
  { f: 'keller.html', k: 'objects · not in any paper',
    title: 'Three counterexamples nobody has published',
    desc: 'A conjecture standing since 1939 was refuted in July 2026. This machine re-decided the published '
      + 'counterexamples in exact fractions, then threw the published answers away and found the collisions again '
      + 'blind. Along the way it generated ' + kellerNew + ' counterexamples of its own, on the same mechanism, that no '
      + 'paper carries.',
    n: kellerN + ' certificates · ' + kellerNew + ' generated here' },
  { f: 'tensor-rank-bounds.html', k: 'a null result, published anyway',
    title: 'We tried to break a new result and could not',
    desc: 'A lower bound on a fifty-year-old problem moved in March 2026, in a preprint whose proof is a '
      + 'machine-checkable file on a two-star repository. We rebuilt the check independently, with an instrument built '
      + 'to be able to contradict it. It did not. That is worth publishing: an audit that could only ever agree is not '
      + 'an audit.',
    n: 'the first independent check of the new bound' }
];
{
  const shelved = new Set(REPORTS.map((r) => r.f));
  for (const l of LEAD) if (!shelved.has(l.f)) fail('the landing leads with ' + l.f + ', which is not on the shelf — that link would 404');
}
B.push(C.section({
  lab: 'start here', title: 'Four cases, in plain words', wide: true,
  bodyRaw: C.cards(LEAD.map((l) => ({ href: 'reports/' + l.f, k: l.k, title: l.title, desc: l.desc, n: l.n })))
}));

B.push(C.section({
  lab: 'one of them, in full', title: 'How a floating-point bug became a published constant',
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
  lab: 'the shelf', title: 'Everything else it has decided', wide: true,
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
      { b: 'An instrument that cannot decide says so.', text: 'REFUSED is a real verdict here and it gets used. A '
        + 'number that cannot be proved does not get published as though it were.' },
      { b: 'Every battery carries forgeries that must fail.', text: 'Fake inputs are planted in each run, including one '
        + 'wrong by a billionth — invisible to any floating-point check. If a forgery ever passes, the run aborts before '
        + 'it grades anything real. Every genuine bug this project has found was caught that way; none by reading code.' }
    ])
  ].join('\n')
}));

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
  lab: 'the machine', title: 'How a claim becomes a certificate', wide: true,
  bodyRaw: machineFlow(ledger, { gates })
    + '<div class="col after-fig">' + C.pRaw('The <a href="machine/">control page</a> is this drawing, live: every family, '
      + 'every battery executed at its build (never remembered), the full ledger decomposition, drift status.') + '</div>'
}));

/* ---- the tally ----------------------------------------------------------
   the stat strip, which used to open the page. It is evidence of scale, not
   a reason to care, so it sits after the reason. */
B.push(C.section({
  lab: 'the tally', title: 'What it has decided so far', wide: true,
  bodyRaw: C.stats([
    { k: 'published claims decided', v: '1 refuted · 1 corrected', role: 'warn',
      n: 'a constant on Erdős #852, wrong from digit ' + csWrongAt + ' · one printed Ramanujan Machine row, a transcription '
        + 'slip — both replacements certified' },
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
      + 'is one rung below a formal proof and several rungs above a decimal that looked convincing.')
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
        { b: 'Public in the thread since ' + longDate(e852Public.date) + ' — no reply yet.', text: 'A correction to a '
          + 'GPT-published constant on Erdős #852 — refuted at its 12th significant digit, certified replacement '
          + 'attached — posted to the problem’s discussion thread on erdosproblems.com, where it cleared moderation '
          + 'and now stands visible. The thread as it stands is pinned in this repository as evidence bytes '
          + '(corpus/sources/' + e852Public.file + '). Visible is not endorsed: nobody has answered it, no author '
          + 'has amended anything, and a comment clearing a moderation queue is not peer review and not an '
          + 'independent rerun.' },
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
put('index.html', Buffer.from(TPL.render({ title: 'cert-machine · the conjecture engine', bodyRaw: B.join('\n\n'), footRaw: foot, path: '/' })));
put('reports/index.html', Buffer.from(TPL.render({ title: 'Reports · cert-machine', bodyRaw: reportsIndexBody, footRaw: reportsIndexFoot, path: '/reports/',
  desc: 'The reports shelf: certified audits of AI-generated mathematics, evals whose ground truth is a proof, a verified reward channel — and the instruments, proven on hard classical ground. Every page recomputes its numbers at build.' })));
put('about/index.html', Buffer.from(TPL.render({ title: 'About · Carlos Toledo', bodyRaw: aboutBody, footRaw: aboutFoot, path: '/about/',
  desc: 'Not correct — checkable. Computer-assisted proof and validated numerics: what every page here owes you, the record of what has left the building, and how these pages are made.' })));
put('oracle/index.html', Buffer.from(TPL.render({ title: 'certify() — the reward oracle · cert-machine', bodyRaw: oracleBody.join('\n\n'), footRaw: oracleFoot, path: '/oracle/',
  desc: 'certify() — a reward oracle for AI mathematical search: CERTIFIED, REFUTED with the exact violated equation, or REFUSED — never a guess. No float participates in any decision; red controls run at import; the ladder, the evidence, and exactly where the guarantee ends.' })));
/* discoverability assets + crawl surface — generated, like everything else */
put('favicon.svg', fs.readFileSync(path.join(ROOT, 'design', 'assets', 'favicon.svg')));
put('og.png', fs.readFileSync(path.join(ROOT, 'design', 'assets', 'og.png')));
put('robots.txt', Buffer.from('User-agent: *\nAllow: /\nSitemap: https://carlostoledo.co/sitemap.xml\n'));
put('machine/index.html', fs.readFileSync(path.join(ROOT, 'index.html')));
for (const f of fs.readdirSync(path.join(ROOT, 'reports'))) {
  if (f.endsWith('.html') || f.endsWith('.py') || f.endsWith('.js')) put('reports/' + f, fs.readFileSync(path.join(ROOT, 'reports', f)));
}
for (const f of fs.readdirSync(path.join(ROOT, 'certs'))) {
  /* same exclusion as the shelf check above: in-progress campaign shards are
     working records, and `merge` folds them into the published certificate */
  if (/^erdos290-tail-shard-\d+\.json$/.test(f)) continue;
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
