#!/usr/bin/env node
/* run-claims-ledger.js — derive certs/claims-ledger.json from the records.
   tools/ · cert-machine

   THE LEDGER IS DERIVED, NEVER TYPED. Every row is read out of a record that already decides the
   claim; a claim with no record does not get a row. That is the difference between a ledger and a
   list of things we remember doing.

   ORIGIN is tracked because it is the honest part: everything here so far is SELF-INITIATED — we
   chose the claim. The submitted column is what an intake queue fills, and it was empty until
   someone sent something (2026-11-06: the first four, cert-machine #3–#6, decided 2026-11-08). Publishing a decided-claims page while pretending the queue is busy
   would be the exact failure this lab exists to catch.

   THE REGISTER (2026-09-29, notes/attack-plan-2026-09-29.md, A5): one schema over every published-claim
   audit on disk. Beside the verdict, each row carries its DEFECT KIND from one closed vocabulary (KINDS
   below — an aggregate row carries the count of each), and the date its deciding record first held it
   (git's pickaxe on the record: the first commit whose record contains the row's key), which is what the
   monthly ledger reads. REPAIRED joins the compositions: the claim as printed is refuted, and an object
   next to it is certified.

   usage: node tools/run-claims-ledger.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const die = (m) => { console.error('CLAIMS LEDGER REFUSED: ' + m); process.exit(1); };
const J = (p) => { const f = path.join(ROOT, p); if (!fs.existsSync(f)) die('missing record ' + p); return JSON.parse(fs.readFileSync(f, 'utf8')); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

const rows = [];

/* THE CLOSED VOCABULARY of what went wrong — a row names one, an aggregate counts them. Adding a kind is a
   decision about the world, made here and nowhere else. */
const KINDS = {
  'none': 'the claim holds as printed',
  'narrower-scope': 'decided only in a narrower scope than printed; the rest is out of reach, not wrong',
  'float-printed-as-exact': 'a floating-point result printed as the exact quantity',
  'sign-slip': 'a sign wrong in a printed constant',
  'arithmetic-slip': 'a printed arithmetic step that does not hold',
  'tolerance-witness': 'a witness only within a numerical tolerance; the printed value is the tolerance\'s',
  'not-the-optimum': 'printed as an optimum, but not the one the definition names (a stop short of it, or a local one)',
  'wrong-quantity': 'the printed number is a correct answer to a different question',
  'not-from-the-published-data': 'the printed number is not what the published data give, and the arithmetic is not why',
  'outside-support': 'the printed model gives observed data zero density',
  'clause-missing-from-formal-statement': 'a clause the prose claims is absent from the formal statement that is proved',
  'data-not-public': 'the data behind the claim are not public, so no one outside can decide it',
  'depends-on-reading': 'the claim holds under one of two definitions its own text gives, and not under the other',
  'checker-wider-than-definition': 'the checker that accepted the claim admits what the definition it encodes excludes',
};
const kindCount = (list) => { const o = {}; for (const k of list) { if (!KINDS[k]) die('unknown kind ' + k); o[k] = (o[k] || 0) + 1; } return o; };
/* the first commit whose record holds the key; today for a record not yet committed */
const today = new Date().toISOString().slice(0, 10);
function firstSeen(file, key) {
  try {
    const out = cp.execFileSync('git', ['log', '--format=%ad', '--date=short', '-S', key, '--', file], { cwd: ROOT, maxBuffer: 1 << 26 }).toString().trim().split('\n').filter(Boolean);
    return out.length ? out[out.length - 1] : today;
  } catch (e) { return today; }
}

/* 1 · the six-claim AI audit */
{
  const a = J('certs/ai-claims-summary.json');
  if (!a.verdicts || a.verdicts.length !== a.lanes) die('the ai-claims summary disagrees with itself');
  for (const v of a.verdicts) rows.push({
    id: 'ai-' + v.id, claim: v.short, claimant: 'a manuscript produced with frontier-model help',
    source: 'published manuscript', origin: 'self-initiated',
    verdict: v.verdict === 'CONFIRMED' ? 'CERTIFIED' : (v.verdict === 'PARTIAL' ? 'PARTIAL' : v.verdict),
    scope: v.scope, checks: v.namedChecks,
    decidedFrom: 'certs/ai-claims-summary.json', page: '/reports/ai-claims-audit.html'
  });
}

/* 2 · Erdos #852 — a published constant, refuted */
{
  const c = J('certs/erdos852-certificate.json');
  const pub = c.cstar.published;
  if (pub.verdict !== 'REFUTED') die('the #852 record no longer refutes the published value');
  rows.push({
    id: 'erdos852-cstar', claim: 'C* for Erdos #852, published as ' + pub.value + ' with no error bound',
    claimant: 'a problem thread post produced with frontier-model help',
    source: 'erdosproblems.com problem thread', origin: 'self-initiated',
    verdict: 'REFUTED', scope: 'the constant itself, to its printed digits',
    mechanism: 'outside a certified enclosure; the corrected value is certified and public in the thread',
    decidedFrom: 'certs/erdos852-certificate.json', page: '/reports/erdos852.html'
  });
}

/* 3 · the kissing ladder — other people's configurations, decided from their own bytes */
{
  const k = J('certs/kissing-ledger.json');
  const kr = k.rows || k.ledger || k.entries || [];
  if (!kr.length) die('the kissing ledger is empty');
  for (const r of kr) rows.push({
    id: 'kiss-' + r.id, claim: r.claim, claimant: r.claimant, source: r.source,
    origin: 'self-initiated', verdict: r.verdict,
    scope: r.verdict === 'NEEDS DATA' ? 'undecidable here: no public coordinates' : 'the configuration as published, in exact arithmetic',
    decidedFrom: 'certs/kissing-ledger.json', page: '/reports/kissing.html'
  });
}

/* 4 · the Ramanujan Machine registry, as one aggregate row (honest counting: it is one audit) */
{
  const l = J('ledger.json');
  const f = (l.families || []).find(x => x.name === 'ramanujan-audit');
  if (!f) die('the ledger holds no ramanujan-audit family');
  const c = f.counts;
  rows.push({
    id: 'rm-registry', claim: 'the published Ramanujan Machine result sheets, ' + c.certified + ' printed rows',
    claimant: 'the Ramanujan Machine project', source: 'published result sheets',
    origin: 'self-initiated', verdict: c.refuted ? 'MIXED' : 'CERTIFIED',
    scope: c.hits + ' rows survive their certified enclosure, ' + c.refuted + ' refuted exactly',
    decidedFrom: 'ledger.json (family ramanujan-audit)', page: '/reports/rm-audit.html'
  });
}

/* 5 · the fast-matrix-multiplication algorithms, decided from commit-pinned bytes */
{
  const c = J('certs/strassen-certificate.json');
  if (!c.entries || !c.entries.length) die('the strassen certificate holds no entries');
  for (const e of c.entries) {
    if (!/VERIFIED over/.test(e.statement)) die(e.id + ' is not verified in its record');
    const q = /REFUTED over Q/.test(e.statement);
    rows.push({
      id: 'mm-' + e.id, claim: e.dims.join('×') + ' matrix multiplication in ' + e.rank + ' multiplications over ' + (e.ring === 'Zi' ? 'Z[i]' : e.ring),
      claimant: e.source.split(',')[0].split(' (')[0], source: e.source, origin: 'self-initiated', verdict: 'CERTIFIED',
      scope: 'every tensor-identity equation, exactly, over ' + (e.ring === 'Zi' ? 'Z[i]' : e.ring) + (q ? '; the same scheme is refuted over Q — the claim is a characteristic-2 claim' : ''),
      kind: 'none', key: e.id, decidedFrom: 'certs/strassen-certificate.json', page: '/reports/alphaevolve.html'
    });
  }
}

/* 6 · the EinsteinArena table: every construction its repository publishes, decided from the bytes */
{
  const e = J('certs/easota-ledger.json');
  for (const r of e.rows) {
    if (r.verdict !== 'WITNESSED' && r.verdict !== 'REPAIRED' && r.verdict !== 'MISPRINTED') die('an easota row is neither witnessed, repaired nor misprinted: ' + r.id);
    rows.push({
      id: 'ea-' + r.id.replace(/\//g, '-'), claim: r.claim, claimant: r.claimant.replace(/,\s*this repository$/, ' (the EinsteinArena repository)'), source: r.file + ' (sha256 ' + r.sha256.slice(0, 12) + '…)',
      origin: 'self-initiated', verdict: r.verdict === 'WITNESSED' ? 'CERTIFIED' : r.verdict === 'MISPRINTED' ? 'REFUTED' : 'REPAIRED',
      scope: r.verdict === 'WITNESSED' ? 'the construction as published, in exact arithmetic' : r.verdict === 'MISPRINTED' ? 'the printed value is not the exact value of the bytes (the bytes witness a value the digits do not state); the exact value is certified in the easota ledger' : 'as published, a witness only within a verifier\'s tolerance (whose, and when — the platform\'s or the repository notebook\'s — in the easota ledger\'s platformRule); a repaired construction next to it is certified',
      kind: r.verdict === 'WITNESSED' ? 'none' : r.verdict === 'MISPRINTED' ? 'not-from-the-published-data' : 'tolerance-witness', key: r.id, decidedFrom: 'certs/easota-ledger.json', page: '/reports/easota.html'
    });
  }
}

/* 7 · the environmental-contour benchmark: the teams' contours and the exceedance counts they printed, one audit */
{
  const b = J('certs/ecbench-ledger.json'), S = b.summary;
  if (S.agree + S.disagree !== S.comparisons) die('the ecbench summary disagrees with itself');
  rows.push({
    id: 'ecbench-counts', claim: 'the exceedance counts printed for the environmental-contour benchmark\'s ' + S.contours + ' contours',
    claimant: 'the benchmark\'s contributing teams (Haselsteiner et al., Ocean Eng. 2021)', source: 'the benchmark repository, pinned by commit',
    origin: 'self-initiated', verdict: S.disagree ? 'MIXED' : 'CERTIFIED',
    scope: S.agree + ' of ' + S.comparisons + ' printed counts agree with the exact count (' + S.exactlyEqual + ' exactly), ' + S.disagree + ' do not; ' + S.notSimple + ' contours are not simple curves',
    kind: 'none', kinds: kindCount(Array(S.agree).fill('none').concat(Array(S.disagree).fill('not-from-the-published-data'))),
    key: '"summary"', decidedFrom: 'certs/ecbench-ledger.json', page: '/reports/ec-benchmark.html'
  });
}

/* 8 · GSM8K's answer key: one audit of 8,792 keys */
{
  const g = J('certs/gsm8k-ledger.json'), F = g.findings;
  const wrong = F.printedStepWrongTest + F.printedStepWrongTrain;
  rows.push({
    id: 'gsm8k-keys', claim: 'the worked solutions of GSM8K\'s ' + (g.test.items + g.train.items).toLocaleString('en-US') + ' test and train keys',
    claimant: 'GSM8K (Cobbe et al., 2021)', source: 'the dataset, pinned by commit', origin: 'self-initiated', verdict: wrong ? 'MIXED' : 'CERTIFIED',
    scope: 'every calculator annotation exact (' + (g.test.annotationsTotal + g.train.annotationsTotal).toLocaleString('en-US') + ', two train ones refused); ' + wrong + ' printed prose steps do not hold (' + F.printedStepWrongTest + ' test, ' + F.printedStepWrongTrain + ' train); equations that are not arithmetic are counted UNREAD, not decided',
    kind: 'none', kinds: kindCount(Array(wrong).fill('arithmetic-slip')),
    key: 'printedStepWrongTest', decidedFrom: 'certs/gsm8k-ledger.json', page: '/reports/gsm8k-audit.html'
  });
}

/* 9 · METR's time horizon: the printed coefficients and p50s against the certified optimum */
{
  const h = J('certs/horizon-ledger.json');
  const A = Object.values(h.agents), live = A.filter((a) => a.live && a.live.coefficientsVerdict), site = A.filter((a) => a.site && a.site.p50);
  const rep = live.filter((a) => a.live.coefficientsVerdict === 'REPRODUCED').length, inside = site.filter((a) => a.site.p50.inside).length;
  if (h.counts.certified !== h.counts.fits) die('a METR fit is not certified');
  rows.push({
    id: 'metr-horizon', claim: 'the time-horizon coefficients and 50% horizons METR prints for ' + live.length + ' models',
    claimant: 'METR (Time Horizon 1.1)', source: 'METR\'s runs and site files, pinned by commit', origin: 'self-initiated', verdict: 'MIXED',
    scope: h.counts.certified + ' of ' + h.counts.fits + ' fits certified; the printed coefficients are the rounding of the certified optimum for ' + rep + ' of ' + live.length + '; the printed 50% horizons lie inside the enclosure for ' + inside + ' of ' + site.length + ' (an optimiser\'s tolerance, all inside METR\'s own bootstrap interval)',
    kind: 'none', kinds: kindCount(Array(rep).fill('none').concat(Array(live.length - rep).fill('not-the-optimum'))),
    key: 'coefficientsVerdict', decidedFrom: 'certs/horizon-ledger.json', page: '/reports/time-horizon.html'
  });
}

/* 10 · the EC benchmark teams' printed Hs marginals, decided on the ten years they fitted */
{
  const P = J('certs/hseva-ledger.json').printed.rows;
  /* a fit printed with another estimator (least squares) that is not the likelihood's maximum is not a defect: it is simply not decided here */
  const mle = (r) => /MLE|maximum likelihood/i.test(r.estimator || '');
  const tz = P.filter((r) => r.reproducesTz), ok = P.filter((r) => r.reproduces === true && !r.reproducesTz);
  const off = P.filter((r) => r.reproduces === false && !r.reproducesTz && mle(r)), other = P.filter((r) => r.reproduces === false && !r.reproducesTz && !mle(r));
  const und = P.length - tz.length - off.length - ok.length - other.length;
  rows.push({
    id: 'ecbench-marginals', claim: 'the ' + P.length + ' Hs marginal fits the benchmark teams printed for buoys A, B and C',
    claimant: 'the environmental-contour benchmark\'s contributing teams', source: 'Appendix A of the benchmark paper, pinned by sha256', origin: 'self-initiated', verdict: 'MIXED',
    scope: ok.length + ' reproduce a certified maximum-likelihood fit; ' + tz.length + ' printed as Hs reproduce the certified fit of Tz; ' + off.length + ' stated as maximum likelihood are off its maximum; ' + other.length + ' use another estimator (least squares) and are not decided here; ' + und + ' are not decidable at the printed precision',
    kind: 'none', kinds: kindCount(Array(ok.length).fill('none').concat(Array(tz.length).fill('wrong-quantity'), Array(off.length).fill('not-the-optimum'))),
    key: '"printed"', decidedFrom: 'certs/hseva-ledger.json', page: '/reports/return-levels.html'
  });
}

/* 11 · a printed design table whose data are a commercial hindcast's */
{
  const d = J('certs/design-table-audit.json');
  rows.push({
    id: 'design-table-bhaskaran-2023', claim: 'the annual-maximum Hs fits of ' + d.summary.decided + ' printed rows for five South Atlantic lease areas',
    claimant: 'Bhaskaran et al. (Energies 16, 6935, 2023)', source: d.table.file + ' (the PDF pinned by sha256 ' + d.table.source.sha256.slice(0, 12) + '…)', origin: 'self-initiated', verdict: 'NEEDS DATA',
    scope: 'the fits are to a commercial hindcast nobody outside can re-run; against the nearest cells of the public one they are ' + Object.entries(d.summary.verdicts).map(([k, v]) => v + ' ' + k).join(', ') + ' — the distance between two records, not an error',
    kind: 'data-not-public', key: 'Bhaskaran', decidedFrom: 'certs/design-table-audit.json', page: '/instruments/return-level-atlas/'
  });
}

/* 12 · OpenAI's Navier–Stokes claim: the Lean certificate; the clause the announced commit did not carry, and
   the upstream commit that carries it. The 2026-09-09 verdict was about 8937a8f4, the commit the announcement
   shipped; upstream moved to f9e8bc5b on 2026-09-10 and this row did not know until 2026-10-05. The verdict now
   follows the upstream record: CERTIFIED only when f9e8bc5b was BUILT here with standard axioms AND its decider
   (red-controlled on the pin) calls the energy clause formal AND the audit holds a reading of Theorem 1.1's
   statement; otherwise it stays PARTIAL and names the upstream change. The pin's verdict is kept as history. */
{
  const b = J('corpus/navier-stokes/build.json'), a = J('corpus/navier-stokes/audit.json'), u = J('corpus/navier-stokes/upstream-f9e8bc5b.json');
  if (b.exitCode !== 0 || !b.onlyStandardAxioms) die('the Navier–Stokes build record no longer holds');
  if (!a.findings || !a.findings.energyAsymmetry) die('the Navier–Stokes audit record names no energy finding');
  if (u.pin !== b.commit) die('the Navier–Stokes upstream record is not relative to the audited pin');
  if (!u.decided.redControl.fired || u.decided.energyClauseFormalAtPin !== false) die('the upstream record\'s decider did not call the pin NOT formal — its HEAD answer means nothing');
  if (!a.upstream || a.upstream.commit !== u.head || !(a.upstream.theorem11Fidelity || []).length) die('the audit holds no reading of Theorem 1.1\'s statement at the upstream commit');
  if (!a.upstream.theorem11Fidelity.every((r) => /^(same|equivalent)/.test(r.direction))) die('a Theorem 1.1 fidelity row is not same/equivalent');
  const pin8 = b.commit.slice(0, 8), head8 = u.head.slice(0, 8), headDate = u.commits[u.commits.length - 1].authored.slice(0, 10);
  const pinScope = 'the Lean certificate holds for Clay\'s (C) and (D) — ' + b.jobsBuilt.toLocaleString('en-US') + ' modules built here, only the standard axioms, Comparator on both — and the finite-energy clause the paper\'s Theorem 1.1 states is not in the formal statement';
  const built = u.build.verdict === 'PASS' && u.onlyStandardAxioms === true && !!u.kernelType;
  const formal = u.decided.energyClauseFormalAtHead === true;
  const atPin = { at: pin8, verdict: 'PARTIAL', kind: 'clause-missing-from-formal-statement', scope: pinScope, decidedFrom: 'corpus/navier-stokes/audit.json', recordedOn: firstSeen('corpus/navier-stokes/audit.json', 'fidelityVerdict') };
  const certified = built && formal;
  rows.push({
    id: 'navier-stokes-openai-2026', claim: 'finite-time blowup for the 3D Navier–Stokes equations with finite energy (Clay alternatives C and D)',
    claimant: 'OpenAI (2026-09-08; the Lean amended ' + headDate + ')', source: 'github.com/openai/NavierStokesAndEuler @ ' + head8 + ' (announced at ' + pin8 + ') and the paper, pinned by sha256', origin: 'self-initiated',
    verdict: certified ? 'CERTIFIED' : 'PARTIAL',
    scope: certified
      ? 'at ' + head8 + ' (' + headDate + ') the Lean proves the paper\'s Theorem 1.1 as stated, finite energy included (theorem_1_1, its statement read here clause by clause), and derives Clay\'s (C) and (D) from it — ' + u.build.built + ' changed or dependent modules rebuilt here over the pin\'s build, only the standard axioms for all ' + Object.keys(u.axioms).length + ' declarations asked; at the announced commit ' + pin8 + ' the finite-energy clause was not formal (PARTIAL, kept as history). Comparator judged (C) and (D) at ' + pin8 + ' and was not re-run at ' + head8 + '; Theorem 1.1\'s statement is OpenAI\'s own, not Comparator-judged'
      : pinScope + '; at ' + head8 + ' (' + headDate + ') upstream proves Theorem 1.1 with the clause (' + u.locations.energySupplied + ', ' + u.locations.theorem_1_1 + '), ' + (u.build.verdict === 'NOT BUILT' ? 'read from source, not built here' : 'but its build here is ' + u.build.verdict),
    kind: certified ? 'none' : 'clause-missing-from-formal-statement',
    key: certified ? '"theorem11Fidelity"' : 'fidelityVerdict', decidedFrom: 'corpus/navier-stokes/audit.json', alsoDecidedFrom: 'corpus/navier-stokes/upstream-f9e8bc5b.json',
    history: certified ? [atPin] : undefined, page: '/reports/navier-stokes.html'
  });
}

/* 13 · the optimization-constants registry's asterisked sum–difference bounds, decided from their certificates */
{
  const d = J('certs/sumdiff-ledger.json');
  for (const r of d.rows) {
    if (r.verdict !== 'CERTIFIED') die('a sumdiff row is not certified: ' + r.id);
    rows.push({
      id: 'optconst-' + r.id, claim: r.claim + (r.registry ? ' (the registry\'s asterisked lower bound)' : ' (superseded in the registry)'), claimant: r.claimant, source: r.source,
      origin: 'self-initiated', verdict: 'CERTIFIED',
      scope: 'the entropy ratio of the cited ' + r.certificate.points + '-point certificate, enclosed to 40 digits: ' + r.rho[0].slice(0, 22) + '…',
      kind: 'none', key: '"id": "' + r.id + '"', decidedFrom: 'certs/sumdiff-ledger.json', page: '/reports/optimization-constants.html'
    });
  }
}

/* 13b · the registry's asterisked C71 (Fourier entropy–influence), decided from the cited truth table */
{
  const d = J('certs/fei-ledger.json');
  for (const r of d.rows) {
    if (r.verdict !== 'CERTIFIED') die('the C71 row is not certified');
    rows.push({
      id: 'optconst-71', claim: r.claim + ' (the registry\'s asterisked lower bound)', claimant: r.claimant, source: d.source.source + ' (CC BY 4.0), the n = 18 truth table',
      origin: 'self-initiated', verdict: 'CERTIFIED',
      scope: 'H/(I-1) for the balanced n = 18 function, I = ' + r.I + ' exact and H in outward-rounded intervals: ' + r.ratio[0].slice(0, 22) + '…; the amplification rule (O\'Donnell–Tan, Hod) is cited, not re-proved',
      kind: 'none', key: '"id": "71"', decidedFrom: 'certs/fei-ledger.json', page: '/reports/optimization-constants.html'
    });
  }
}

/* 13c · the registry's asterisked C84b (real sum–product exponent), decided from the note it cites */
{
  const d = J('certs/sumproduct-ledger.json');
  const r = d.rows[0];
  if (r.verdict !== 'REPAIRED') die('the C84b row is not repaired');
  rows.push({
    id: 'optconst-84b', claim: r.claim + ' (the registry\'s asterisked upper bound)', claimant: r.claimant, source: 'the note (' + d.note.tex + ', sha256 ' + d.note.texSha256.slice(0, 12) + '…), as registry/84b.md cites it',
    origin: 'self-initiated', verdict: 'REPAIRED',
    scope: 'holds as ' + r.repairedTo + '; for every choice of the chain\'s parameters c <= ' + r.ceiling + ' < 0.000719, so the quoted constant is out of reach of the calculation cited',
    kind: 'arithmetic-slip', key: '"id": "84b"', decidedFrom: 'certs/sumproduct-ledger.json', page: '/reports/optimization-constants.html'
  });
}

/* 13d · the registry's asterisked C42 (Turán's pure power-sum constant), decided from the certificate it cites */
{
  const d = J('certs/turan-ledger.json');
  for (const r of d.rows) {
    if (r.verdict !== 'PARTIAL') die('a C42 row is not partial: ' + r.id);
    const pr = r.id === '42a-pr184';
    rows.push({
      id: 'optconst-' + r.id, claim: r.claim + (pr ? '' : ' (the registry\'s asterisked upper bound)'), claimant: r.claimant,
      source: pr ? d.pr184.source.pr + ' (its certificate transcribed; note and checker pinned by sha256)' : d.source.repo + ' ' + d.source.tag + ' (the certificate pinned by sha256 ' + d.source.certificateSha256.slice(0, 12) + '…)',
      origin: 'self-initiated', verdict: 'PARTIAL', scope: r.scope, kind: 'narrower-scope', key: '"id": "' + r.id + '"', decidedFrom: 'certs/turan-ledger.json', page: '/reports/optimization-constants.html'
    });
  }
}

/* 14 · an AI counterexample library (S. Sra, arXiv 2608.29595), decided case by case from its published certificates */
{
  const d = J('certs/countex-ledger.json');
  for (const r of d.rows) {
    if (r.verdict !== 'CERTIFIED' && r.verdict !== 'PARTIAL') die('a countex row is neither certified nor partial: ' + r.id);
    rows.push({
      id: 'countex-' + r.id, claim: r.title, claimant: ([...new Set(r.foundBy.map((f) => f.by.replace(/^bugfixed by /, '')))].join(', ') || 'the library') + ' (S. Sra\'s counterexample library)',
      source: 'github.com/suvrit/count-ex-machina @ ' + d.source.commit.slice(0, 8), origin: 'self-initiated', verdict: r.verdict,
      scope: r.scope, kind: r.kind, key: '"id": "' + r.id + '"', decidedFrom: 'certs/countex-ledger.json', page: '/reports/counterexample-machine.html'
    });
  }
}

/* 15 · a benchmark's credited discoveries (HorizonMath, arXiv 2603.15617v2), decided from what its Appendix A prints */
{
  const d = J('certs/horizonmath-ledger.json');
  for (const r of d.rows) {
    rows.push({
      id: 'horizonmath-' + r.id, claim: r.claim, claimant: r.claimant,
      source: 'arXiv:2603.15617v2, Appendix A; github.com/ewang26/HorizonMath @ ' + d.source.commit.slice(0, 8), origin: 'self-initiated', verdict: r.verdict,
      scope: r.scope, kind: r.kind, key: '"id": "' + r.id + '"', decidedFrom: 'certs/horizonmath-ledger.json', page: '/reports/horizonmath.html'
    });
  }
}


/* 16 · a result a paper prints as "preliminary, unverified" (GNNW v2, proposed by ChatGPT 5.6 Sol), decided on the paper's own theorem */
{
  const z = J('certs/gnnw-certificate.json');
  if (z.decided.verdict !== 'CERTIFIED') die('the GNNW certificate is not certified');
  rows.push({
    id: 'gnnw-gai-3782', claim: 'R(k,k) <= 3.78233^(k+o(k)): Theorem 1 of Gupta–Ndiaye–Norin–Wei holds with G_AI (one more iteration of Theorem 14)',
    claimant: 'ChatGPT 5.6 Sol, printed by Gupta, Ndiaye, Norin and Wei as preliminary and unverified (arXiv 2407.19026v2)', source: 'arXiv:2407.19026v2, the remark after Remark 17 (the PDF pinned by sha256)',
    origin: 'self-initiated', verdict: 'CERTIFIED',
    scope: 'Theorem 14\'s inequality decided on all of (0, 1] in interval arithmetic for F = h + G_AI, with a continuous M chosen here and Y from Lemma 15 for the proved F_0.03, by two independent programs; the theorem, the lemma and Theorem 1 are the paper\'s. Base e^F(1) = ' + z.decided.c[0].slice(0, 16) + '…; the printed 3.78233 is ' + z.decided.printedIs,
    kind: 'none', key: '"verdict": "CERTIFIED"', decidedFrom: 'certs/gnnw-certificate.json', page: '/reports/diagonal-ramsey.html'
  });
}


/* 17 · polynomial maps two 2026 papers print (Gao's Keller maps; the weak Markus–Yamabe fields), decided from their TeX */
{
  const d = J('certs/polymaps-ledger.json');
  for (const r of d.rows) {
    if (r.verdict !== 'CERTIFIED' && r.verdict !== 'PARTIAL') die('a polymaps row is neither certified nor partial: ' + r.id);
    rows.push({
      id: 'polymaps-' + r.id, claim: r.claim, claimant: r.id.startsWith('gao') ? 'S. Gao, with Claude Fable 5 assisting (arXiv 2608.00222)' : (r.id === 'chv-phi' ? 'Castañeda, Honorato, Valenzuela-Henríquez (arXiv 2608.05392); the map first published in a gist that says ChatGPT generated it' : 'Castañeda, Honorato, Valenzuela-Henríquez (arXiv 2608.05392)'),
      source: r.source + ' (the TeX mirrored in corpus/polymaps, CC BY 4.0)', origin: 'self-initiated', verdict: r.verdict,
      scope: r.verdict === 'PARTIAL' ? 'non-injective and the factors\' determinants decided; the constant determinant of the whole rests on the paper\'s factorisation lemma (the full map is not printed; rebuilt from the printed construction)' : 'every fact the claim needs, as an exact identity or evaluation' + (r.id === 'gao-f6' ? ' (the full map is not printed; rebuilt from the printed construction)' : ''),
      kind: r.verdict === 'PARTIAL' ? 'narrower-scope' : 'none', key: '"id": "' + r.id + '"', decidedFrom: 'certs/polymaps-ledger.json', page: '/reports/polymaps.html'
    });
  }
}

/* 18 · THE HUNDRED PRE-REGISTERED MACHINE CLAIMS (corpus/machine-claims-100.json, named by rule 2026-10-02 before any
   was decided; phase 4b of the rerun program). Each pool's run writes its own ledger, certs/mc100-<pool>.json; this
   reads every one of them. A row reaches the register only if the manifest names it, in the same pool, decided from
   bytes that hash to the manifest's pin, and no two ledgers decide it. A row whose object the register ALREADY holds
   (the same object, decided earlier from another copy of its bytes) names that row in `sameClaimAs`: it is not
   counted twice — the earlier row is annotated with its corpus id instead, and must carry the same verdict. The
   hundred's own measurement (counts per pool, per verdict, per kind) is read from the ledgers, not from here. */
const MC100_VERDICTS = ['CERTIFIED', 'REFUTED', 'REFUSED', 'PARTIAL', 'MIXED', 'REPAIRED', 'NEEDS DATA'];
const mc100Same = [];
{
  const MC = J('corpus/machine-claims-100.json');
  const byId = new Map(MC.rows.map((r) => [r.id, r]));
  const files = fs.readdirSync(path.join(ROOT, 'certs')).filter((f) => /^mc100-[a-z0-9-]+\.json$/.test(f)).sort();
  const seen = new Set();
  for (const f of files) {
    const L = J('certs/' + f);
    const raw = fs.readFileSync(path.join(ROOT, 'certs', f), 'utf8');
    const idKey = (id) => (raw.includes('"id":"' + id + '"') ? '"id":"' + id + '"' : '"id": "' + id + '"');   /* the pickaxe needs the bytes the record carries */
    if (!Array.isArray(L.rows) || !L.rows.length) die('certs/' + f + ' holds no rows');
    for (const r of L.rows) {
      const m = byId.get(r.id);
      if (!m) die('certs/' + f + ' decides a row the manifest does not name: ' + r.id);
      if (seen.has(r.id)) die('the corpus row ' + r.id + ' is decided by two ledgers');
      seen.add(r.id);
      if (r.pool !== m.pool) die('the corpus row ' + r.id + ' is decided in pool ' + r.pool + ', the manifest says ' + m.pool);
      if (r.sha256 !== m.sha256) die('the corpus row ' + r.id + ' was decided from bytes that do not hash to the manifest\'s pin');
      if (!MC100_VERDICTS.includes(r.verdict)) die('the corpus row ' + r.id + ' has a verdict outside the vocabulary: ' + r.verdict);
      if (!r.scope) die('the corpus row ' + r.id + ' has no scope');
      if (r.sameClaimAs) { mc100Same.push({ r, f }); continue; }
      rows.push({
        id: 'mc100-' + r.id, claim: m.claim, claimant: m.claimant, source: m.source + ' (sha256 ' + m.sha256.slice(0, 12) + '…)',
        origin: 'self-initiated', verdict: r.verdict, scope: r.scope, kind: r.kind,
        preregistered: { corpus: 'corpus/machine-claims-100.json', id: r.id, pool: r.pool },
        key: idKey(r.id), decidedFrom: 'certs/' + f, page: 'https://github.com/carlostoledo1891/cert-machine/blob/main/certs/' + f
      });
    }
  }
}
for (const { r, f } of mc100Same) {
  const twin = rows.find((x) => x.id === r.sameClaimAs);
  if (!twin) die('the corpus row ' + r.id + ' names a register row that does not exist: ' + r.sameClaimAs);
  if (twin.verdict !== r.verdict) die('the corpus row ' + r.id + ' (' + r.verdict + ') and the register row it duplicates, ' + twin.id + ' (' + twin.verdict + '), disagree');
  twin.preregistered = { corpus: 'corpus/machine-claims-100.json', id: r.id, pool: r.pool, alsoDecidedFrom: 'certs/' + f };
}

/* 19 · THE ETH REFUTATION CLAIMS (campaign eth-refutation, 2026-10-28 →): two labs' Lean refutations of the Exponential
   Time Hypothesis, two third parties' bridges between them, a native re-proof, and the Anthropic chain joined in one
   Lean. Each row's verdict is the record's `word`/`verdict`; its scope is the record's own definition of what that
   word means and does not mean (the formal statement checks; that a Lean statement is the textbook hypothesis is a
   reading, never decided). The page is /eth/ unless the record has a report of its own.
   LEFT OUT ON PURPOSE: certs/eth-c1.json and certs/eth-c2.json (C1, C2) and certs/eth-bridge.json (our generic bridge)
   are OUR OWN claims, and this register holds externally published claims only — the census already lists them as our
   own, outside the count; certs/eth-seam.json and certs/eth-comparator.json are MEASUREMENTS of other rows (the version
   seam between two lanes; a Comparator challenge against a port), not claims anyone published. */
const ethWord = (file, w) => { if (w !== 'CERTIFIED' && w !== 'REFUTED' && w !== 'REFUSED') die(file + ' holds a word outside the vocabulary: ' + w); return w; };
const after = (text, mark, file) => { const i = text.indexOf(mark); if (i < 0) die(file + ' no longer says "' + mark + '"'); return text.slice(i); };
const sig = (what, theorem, file) => { const m = new RegExp(theorem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' : ([^(,]+?)(?: \\(|, )').exec(what); if (!m) die(file + ' does not state the signature of ' + theorem); return m[1]; };
/* How the two third-party bridges reached us is read from each record's `campaign` and carried on the row (arrivedBy).
   Their ORIGIN stays self-initiated: the register's `submitted` column is the intake queue's, which has no record, and
   the claims page says the queue is empty in its own copy — whether a contact-form arrival counts as a submission is
   the operator's decision, not this tool's. */
const arrivedBy = (campaign, file) => { const m = /the claim (arrived by [^;]+? on \d{4}-\d{2}-\d{2}|was posted on [^;]+? with a request for a check)/.exec(campaign); if (!m) die(file + ' no longer says how the claim arrived'); return m[1]; };
{
  const k = J('certs/eth-kernel.json');
  if (!k.rows || k.rows.length !== k.counts.of || k.counts.decided !== k.rows.filter((r) => r.word).length) die('the eth-kernel record disagrees with its counts');
  for (const r of k.rows) {
    for (const f of ['claim', 'label', 'repository', 'commit', 'theorems', 'word', 'why', 'toolchain', 'mathlib', 'pinnedFiles']) if (r[f] === undefined || r[f] === null) die('the eth-kernel row ' + r.claim + ' has no ' + f);
    if (!r.kernels || r.kernels.length !== 2 || !r.leanchecker || r.leanchecker.word !== 'REPLAYED') die('the eth-kernel row ' + r.claim + ' is not what its word says');
    const v = ethWord('certs/eth-kernel.json', r.word);
    rows.push({
      id: 'eth-' + (r.claim === 'openai' ? 'openai-378' : r.claim === 'anthropic' ? 'anthropic-formal-math' : r.claim),
      claim: 'the Exponential Time Hypothesis is false, in Lean: ' + r.label + ', the theorem' + (r.theorems.length > 1 ? 's ' : ' ') + r.theorems.join(' and ') + ' (' + r.toolchain + ', Mathlib ' + r.mathlib.slice(0, 8) + ')',
      claimant: r.label.split(',')[0], source: r.repository.replace(/^https?:\/\//, '') + ' @ ' + r.commit.slice(0, 8) + ' (' + r.pinnedFiles.toLocaleString('en-US') + ' files pinned)',
      origin: 'self-initiated', verdict: v,
      scope: 'the formal statement checks: ' + r.why + '. ' + after(k.what, 'It does NOT mean', 'certs/eth-kernel.json'),
      kind: v === 'CERTIFIED' ? 'none' : 'narrower-scope', key: '"claim": "' + r.claim + '"', decidedFrom: 'certs/eth-kernel.json', page: '/eth/'
    });
  }
}
{
  const t = J('certs/eth-tsavo-bridge.json');
  for (const f of ['word', 'why', 'what']) if (!t[f]) die('the TSavo record has no ' + f);
  for (const f of ['repository', 'commit', 'author', 'theorems']) if (!t.claim[f]) die('the TSavo record\'s claim has no ' + f);
  const v = ethWord('certs/eth-tsavo-bridge.json', t.word);
  rows.push({
    id: 'eth-tsavo-bridge', claim: 'a Lean bridge from OpenAI\'s claimed refutation of ETH to Anthropic\'s: ' + t.claim.theorems[0] + ' : ' + sig(t.what, t.claim.theorems[0], 'certs/eth-tsavo-bridge.json') + ' (OpenAI\'s challenge statement, as a proposition, implies Anthropic\'s ETHIsFalse)',
    claimant: t.claim.author, source: t.claim.repository.replace(/^https?:\/\//, '') + ' @ ' + t.claim.commit.slice(0, 8) + ', built inside ' + t.project.repository.replace(/^https?:\/\//, '') + ' @ ' + t.project.commit.slice(0, 8),
    origin: 'self-initiated', arrivedBy: arrivedBy(t.campaign, 'certs/eth-tsavo-bridge.json'), verdict: v, scope: after(t.what, 'CERTIFIED here means', 'certs/eth-tsavo-bridge.json'),
    kind: v === 'CERTIFIED' ? 'none' : 'narrower-scope', key: '"word": "' + t.word + '"', decidedFrom: 'certs/eth-tsavo-bridge.json', page: '/eth/'
  });
}
{
  const h = J('certs/eth-hawkley-bridge.json'), g = J('certs/eth-hawkley-heavy.json');
  for (const [f, n] of [[h, 'bridge'], [g, 'heavy']]) { for (const q of ['word', 'why', 'what', 'gaps']) if (!f[q]) die('the Hawkley ' + n + ' record has no ' + q); for (const q of ['repository', 'commit', 'author', 'theorem']) if (!f.claim[q]) die('the Hawkley ' + n + ' record\'s claim has no ' + q); }
  if (h.claim.commit !== g.claim.commit || !h.claim.author.startsWith(g.claim.author)) die('the two Hawkley records are not the same claimant at the same pin');
  const src = h.claim.repository.replace(/^https?:\/\//, '') + ' @ ' + h.claim.commit.slice(0, 8) + ' (a fork of ' + h.claim.forkOf.replace(/^https?:\/\//, '') + ' @ ' + h.project.commit.slice(0, 8) + ')';
  const vh = ethWord('certs/eth-hawkley-bridge.json', h.word), vg = ethWord('certs/eth-hawkley-heavy.json', g.word);
  rows.push({
    id: 'eth-hawkley-bridge', claim: 'a Lean bridge from OpenAI\'s claimed refutation of ETH to Anthropic\'s, the light theorem: ' + h.claim.theorem + ' : ' + sig(h.what, h.claim.theorem, 'certs/eth-hawkley-bridge.json') + ' (OpenAI ParityLifts\' ETH predicate, negated, implies Anthropic\'s ETHIsFalse)',
    claimant: h.claim.author, source: src, origin: 'self-initiated', arrivedBy: arrivedBy(h.campaign, 'certs/eth-hawkley-bridge.json'), verdict: vh, scope: after(h.what, 'CERTIFIED here means', 'certs/eth-hawkley-bridge.json'),
    kind: vh === 'CERTIFIED' ? 'none' : 'narrower-scope', key: '"word": "' + h.word + '"', decidedFrom: 'certs/eth-hawkley-bridge.json', page: '/eth/'
  });
  if (!g.facts || !g.facts.nanodaAccepts || !g.facts.controlRejectsOnAxiom || !g.facts.axiomsStandard) die('the Hawkley heavy record\'s facts do not carry its word');
  rows.push({
    id: 'eth-hawkley-heavy', claim: 'the heavy link of the same bridge: ' + g.claim.theorem + ' : ' + sig(g.what, g.claim.theorem, 'certs/eth-hawkley-heavy.json') + ', proved from OpenAI\'s ' + g.claim.upstream.split('.').pop() + ' (so OpenAI\'s accepted theorem reaches Anthropic\'s ETHIsFalse inside OpenAI\'s Lean)',
    claimant: h.claim.author, source: src, origin: 'self-initiated', arrivedBy: arrivedBy(h.campaign, 'certs/eth-hawkley-bridge.json'), verdict: vg,
    scope: 'CERTIFIED here means ' + g.words.CERTIFIED + '. ' + g.gaps[0],
    kind: vg === 'CERTIFIED' ? 'none' : 'narrower-scope', key: '"word": "' + g.word + '"', decidedFrom: 'certs/eth-hawkley-heavy.json', page: '/eth/'
  });
}
{
  const d = J('certs/eth-cslib-d1.json');
  for (const f of ['verdict', 'scope', 'what', 'reading', 'axioms']) if (!d[f]) die('the D1 record has no ' + f);
  for (const f of ['repo', 'commit', 'toolchain', 'authors']) if (!d.claim[f]) die('the D1 record\'s claim has no ' + f);
  if (d.fails && d.fails.length) die('the D1 record lists fails: ' + d.fails.join('; '));
  const v = ethWord('certs/eth-cslib-d1.json', d.verdict);
  const m = /: (.*?), built from source/.exec(d.what); if (!m) die('the D1 record no longer names what was built');
  const reading = d.reading.find((x) => /stays a reading/.test(x)), native = d.reading.find((x) => /native re-proof/.test(x));
  if (!reading || !native) die('the D1 record\'s reading no longer says what stays a reading');
  const headline = Object.keys(d.axioms)[0];
  rows.push({
    id: 'eth-cslib-d1', claim: 'the Exponential Time Hypothesis is false, natively in Lean on cslib\'s multitape Turing machine: ' + m[1] + ', the headline theorem ' + headline + ' (' + d.claim.toolchain + ')',
    claimant: d.claim.repo.replace(/^https?:\/\/github\.com\//, '') + ' — ' + d.claim.authors, source: d.claim.repo.replace(/^https?:\/\//, '') + ' @ ' + d.claim.commit.slice(0, 8),
    origin: 'self-initiated', verdict: v, scope: d.scope + ' ' + reading.split('. ').pop() + ' ' + native.split('. ').pop(),
    kind: v === 'CERTIFIED' ? 'none' : 'narrower-scope', key: '"verdict": "' + d.verdict + '"', decidedFrom: 'certs/eth-cslib-d1.json', page: '/eth/'
  });
}
{
  const c = J('certs/eth-chain.json');
  for (const f of ['verdict', 'scope', 'reading', 'judge', 'nanoda']) if (!c[f]) die('the chain record has no ' + f);
  for (const f of ['repo', 'commit', 'folder', 'theorem', 'builtOn', 'port', 'authors']) if (!c.claim[f]) die('the chain record\'s claim has no ' + f);
  if (c.fails && c.fails.length) die('the chain record lists fails: ' + c.fails.join('; '));
  if (!c.judge.claim.okay || !c.nanoda.claim.accepted || c.judge.planted.okay) die('the chain record\'s judge and kernels do not carry its verdict');
  const v = ethWord('certs/eth-chain.json', c.verdict);
  const parts = c.scope.split('. Decided: '); if (parts.length !== 2) die('the chain record\'s scope no longer separates the claim from what was decided');
  const port = c.reading.find((x) => /modified copy/.test(x)), operator = c.reading.find((x) => /not a second party/.test(x));
  if (!port || !operator) die('the chain record\'s reading no longer says the proof is a port, or who the operator is');
  rows.push({
    id: 'eth-anthropic-chain', claim: parts[0] + ' (' + c.claim.theorem + ')',
    claimant: 'Anthropic\'s proof (' + c.claim.port.of + '), ported and joined in claimbox: ' + c.claim.authors,
    source: c.claim.repo.replace(/^https?:\/\//, '') + ' @ ' + c.claim.commit.slice(0, 8) + ' ' + c.claim.folder + ', built on ' + c.claim.builtOn,
    origin: 'self-initiated', verdict: v, scope: 'Decided: ' + parts[1] + ' ' + port.split('. ')[0] + '. ' + operator,
    kind: v === 'CERTIFIED' ? 'none' : 'narrower-scope', key: '"verdict": "' + c.verdict + '"', decidedFrom: 'certs/eth-chain.json', page: '/reports/eth-chain.html'
  });
}

{
  const c = J('certs/eth-openai-chain.json');
  for (const f of ['verdict', 'scope', 'reading', 'judge', 'nanoda', 'p3']) if (!c[f]) die('the OpenAI chain record has no ' + f);
  for (const f of ['repo', 'commit', 'folder', 'theorem', 'builtOn', 'port', 'authors']) if (!c.claim[f]) die('the OpenAI chain record\'s claim has no ' + f);
  if (c.fails && c.fails.length) die('the OpenAI chain record lists fails: ' + c.fails.join('; '));
  // the amendment of 2026-11-05 12:55 UTC: the verdict reads the judge with named checkers; the shipped --paranoid run is kept beside it
  if (!c.judge.named || !c.judge.named.chain || !c.judge.named.chain.okay || !c.nanoda.claim.accepted || !c.judge.named.planted || !c.judge.named.planted.mismatch) die('the OpenAI chain record\'s judge and kernels do not carry its verdict');
  if (!c.judge.shipped || !c.judge.shipped.claim || !c.judge.shipped.claim.stops || Object.keys(c.judge.shipped.claim.stops).length !== 4) die('the OpenAI chain record no longer carries the four bundled stops of the judge as shipped');
  const v = ethWord('certs/eth-openai-chain.json', c.verdict);
  const parts = c.scope.split('. Decided: '); if (parts.length !== 2) die('the OpenAI chain record\'s scope no longer separates the claim from what was decided');
  const port = c.reading.find((x) => /modified copy/.test(x)), operator = c.reading.find((x) => /not a second party/.test(x)), judge = c.reading.find((x) => /did not finish on this export/.test(x));
  if (!port || !operator || !judge) die('the OpenAI chain record\'s reading no longer says the proof is a port, who the operator is, or how the judge was re-run');
  rows.push({
    id: 'eth-openai-chain', claim: parts[0] + ' (' + c.claim.theorem + ')',
    claimant: 'OpenAI\'s proof and Hawkley\'s bridges (' + c.claim.port.of + '), ported and joined in claimbox: ' + c.claim.authors,
    source: c.claim.repo.replace(/^https?:\/\//, '') + ' @ ' + c.claim.commit.slice(0, 8) + ' ' + c.claim.folder + ', built on ' + c.claim.builtOn,
    origin: 'self-initiated', verdict: v, scope: 'Decided: ' + parts[1] + ' ' + port.split('. ')[0] + '. ' + judge.split('. ').slice(-3).join('. ') + ' ' + operator,
    kind: v === 'CERTIFIED' ? 'none' : 'narrower-scope', key: '"verdict": "' + c.verdict + '"', decidedFrom: 'certs/eth-openai-chain.json', page: '/reports/eth-chain.html'
  });
}

/* 20 · the Weight-Space Programming claim (MIT CSAIL, 2026-11-02): one row for the authors' headline. The edit is decided
   from the two checkpoints' bytes (certs/wsp-weights.json), the printed accuracies re-summed and re-graded from the released
   flags (certs/wsp-regrade.json, a second grader in certs/wsp-grade-second.json), and the multiplier decided by the
   pre-registered baseline run (certs/wsp-baseline.json: the unedited model under its own card's settings). The verdict word
   follows the baseline record's pre-registered band: `holds` certifies the row; `overstated` and `mostly a settings effect`
   make it MIXED — the edit and the printed numbers hold, and the multiplier is a correct ratio to a different question
   (the edit over a looping baseline, not the edit over the model's own settings), the register's `wrong-quantity`. Any other
   band (no verdict on the multiplier) gets no row. */
{
  const B = J('certs/wsp-baseline.json'), R = J('certs/wsp-weights.json'), G = J('certs/wsp-regrade.json'), S2 = J('certs/wsp-grade-second.json');
  for (const f of ['reading', 'post_printed', 'conditions']) if (!B[f]) die('the WSP baseline record has no ' + f);
  if (!R.deciders_agree) die('the WSP weights deciders disagree: ' + (R.disagreements || []).join(', '));
  const edit = ['W1', 'W2', 'W5', 'W7'];
  for (const w of edit) if (R.verdicts[w] !== 'CERTIFIED') die('the WSP edit sub-claim ' + w + ' is ' + R.verdicts[w] + ', not CERTIFIED: the row\'s scope no longer holds');
  if (R.verdicts.W6 !== 'REFUSED') die('the WSP witness W6 is not REFUSED as the scope says');
  const UN = G.post_runs.post_unedited, ED = G.post_runs.post_edited_50_passes;
  for (const run of [UN, ED]) { if (run.acc_resummed_all_samples !== run.merged_printed.acc) die('a WSP printed accuracy does not re-sum'); if (run.tally.their_1_our_WRONG !== 0 || run.tally.their_0_our_CORRECT !== 0) die('the WSP exact grader disagrees with the claimants\' on a decided answer'); }
  if (S2.disagreements !== 0 || S2.agree !== S2.pairs) die('the two WSP graders disagree');
  if (B.post_printed.unedited_math500_printed !== UN.merged_printed.acc || B.post_printed.edited_50_passes_printed !== ED.merged_printed.acc) die('the WSP baseline and regrade records print different accuracies');
  const rd = B.reading;
  if (!rd.control_C1 || rd.control_C1.within_3_points !== true) die('the WSP control C1 does not reproduce the printed baseline: no verdict on the multiplier, no row');
  const band = String(rd.verdict).split(':')[0];
  const verdict = band === 'holds' ? 'CERTIFIED' : (band === 'overstated' || band === 'mostly a settings effect') ? 'MIXED' : die('the WSP baseline reading is not a band this row can carry: ' + rd.verdict);
  const who = /\(([^;]+), (\d{4}-\d{2}-\d{2}); the post ([^,]+),/.exec(R.claims.what); if (!who) die('the WSP weights record no longer names the authors, the date and the post');
  const pct = (x) => (x * 100).toFixed(1) + '%', un = UN.merged_printed.acc, ed = ED.merged_printed.acc;
  if (!rd.best_no_edit_arm || !rd.conditions[rd.best_no_edit_arm.arm]) die('the WSP baseline reading names no best no-edit arm');
  rows.push({
    id: 'wsp-math500', claim: 'Weight-Space Programming: an edit of ' + R.claims.changed_entries.post.toLocaleString('en-US') + ' weights (' + R.claims.printed_percent + '% of the model), written with no training, lifts Qwen3.5-0.8B\'s MATH-500 accuracy from ' + pct(un) + ' to ' + pct(ed) + ' (' + Math.round(ed / un) + '×)',
    claimant: who[1] + ' (the post of ' + who[2] + ')', source: 'the post ' + who[3] + '; the model card ' + R.claims.edited.repo + ' @ ' + R.claims.edited.revision.slice(0, 8) + '; the logs ' + G.sources.logs.repo + ' @ ' + G.sources.logs.commit.slice(0, 8) + '; the base ' + R.claims.base.repo + ' @ ' + R.claims.base.revision.slice(0, 8),
    origin: 'self-initiated', verdict,
    scope: 'the edit is real: ' + edit.join(', ') + ' of the seven sub-claims CERTIFIED by two implementations sharing no code (W3 and W4, the printed ' + R.claims.changed_entries.post.toLocaleString('en-US') + ' and ' + R.claims.printed_percent + '%, hold under one reading of the authors\' own text and not the other; W6, a one-direction witness, REFUSED as a limit of the search); the printed ' + pct(un) + ' and ' + pct(ed) + ' re-sum from the released flags, and the exact grader agrees with the claimants\' on every decided first-sample answer (' + S2.pairs.toLocaleString('en-US') + ' pairs graded twice, ' + S2.disagreements + ' disagreements); the control C1 reproduces the printed ' + pct(un) + ' (' + rd.control_C1.all_samples_floor_percent + '% floor); the multiplier is ' + rd.verdict + ' (the unedited model under its own card\'s settings), so ' + rd.target_percent + ' over the best no-edit arm (' + rd.best_no_edit_arm.arm + ') is ' + rd.best_no_edit_arm.multiplier_48_1_over_best + '×',
    kind: 'none', kinds: kindCount(Array(edit.length + 2).fill('none').concat(verdict === 'CERTIFIED' ? [] : ['wrong-quantity'])),
    key: '"verdict": "' + band, decidedFrom: 'certs/wsp-baseline.json', alsoDecidedFrom: 'certs/wsp-weights.json, certs/wsp-regrade.json, certs/wsp-grade-second.json', page: '/reports/weight-space-programming.html'
  });
}

/* THE INTAKE QUEUE (2026-11-08): the first claims anyone sent through the public claim form (.github/ISSUE_TEMPLATE/
   claim.yml), cert-machine issues #3–#6, filed 2026-11-06 and decided by certs/claims-intake-2026-11-08.json (two
   implementations sharing no code; a stock-Python certificate per claim). Their ORIGIN is submitted: the claimant chose the
   claim, not us. The kind of each row is read from what the record decided, in the closed vocabulary below. */
{
  const I = J('certs/claims-intake-2026-11-08.json');
  /* the register's scope column is read in a table, so each row's is composed short from the record's decision fields, every
     enclosure rounded OUTWARD (its low end down, its high end up) and every exact value printed as the record holds it; the
     record's full headline rides beside it in the row */
  const out10 = ([lo, hi], d) => { const f = (x, up) => { const [i, fr = ''] = String(x).split('.'); const keep = fr.slice(0, d), rest = fr.slice(d);
      if (!up || !/[1-9]/.test(rest)) return i + '.' + keep.padEnd(d, '0');
      const n = (BigInt(i + keep.padEnd(d, '0')) + 1n).toString().padStart(i.length + d, '0'); return n.slice(0, n.length - d) + '.' + n.slice(n.length - d); };
    return '[' + f(lo, false) + ', ' + f(hi, true) + ']'; };
  const shortScope = (n, c) => { const D = c.decision;
    if (n === '3') return 'no overlap and inside the square at zero tolerance (' + D.tangenciesExact + ' tangencies); the sum of radii is exactly ' + D.sumExact + ', which rounds to the printed ' + D.claim;
    if (n === '5') return 'holds at the source\'s ' + D.tolerance + ' tolerance; strictly, ' + D.strict.pairViolations + ' of ' + (D.n * (D.n - 1) / 2) + ' pairs overlap and ' + D.strict.sideViolations + ' circles cross a side; the sum of radii is exactly ' + D.sumExact + ', which rounds to the printed ' + D.claim;
    if (n === '4') return 'every one of the ' + D.n + ' values is non-negative; the exact ratio Q lies in ' + out10(D.Q30, 10) + ', below 0.9469' + (D['printed0.9469'].rounds ? '; the printed 0.9469 is Q rounded to four decimals' : '');
    if (n === '6') return 'after the platform\'s normalisation f(1) lies in ' + out10(D.f1, 10) + ', so F(x) = f(1) > 1 for 1 ≤ x < 2; outside the sampled range F lies in ' + out10(D.readingA.mirror.F, 3) + ' at an exhibited point; the platform\'s own check, made exhaustive over its range, ' + (D.readingB.holds ? 'passes' : 'fails') + '; the printed score agrees';
    die('no short scope for intake row #' + n); };
  const by = /\((?:issues #3–#6, )?([A-Za-z0-9_-]+), \d{4}-\d{2}-\d{2}\)/.exec(I.what);
  if (!by) die('the intake record no longer names who submitted the claims');
  if (I.allAgree !== true) die('the intake record\'s two implementations do not agree');
  for (const [n, c] of Object.entries(I.claims)) {
    if (I.verdicts[n] !== c.verdict || I.python[n] !== c.verdict || c.agree !== true) die('the intake record disagrees with itself on #' + n);
    const strictFails = /strictly it does not/.test(c.headline);
    const kind = c.verdict === 'CERTIFIED' ? (strictFails ? 'tolerance-witness' : 'none')
      /* a rounded printed value read as the bound: it rounds the exact quantity and is not at most it */
      : (c.decision['printed0.9469'] || {}).rounds === true && c.decision['printed0.9469'].atLeast === false ? 'float-printed-as-exact'
      /* the platform's checker, made exhaustive, passes while the definition it encodes is refuted */
      : (c.decision.readingB || {}).holds === true && (c.decision.readingA || {}).verdict === 'REFUTED' ? 'checker-wider-than-definition' : null;
    if (!kind) die('the intake row #' + n + ' has no kind this ledger can read from its record');
    rows.push({
      id: 'intake-' + n, claim: c.text,
      claimant: (c.solution ? 'EinsteinArena solution ' + c.solution : 'ThetaEvolve, entry "' + c.entry + '"') + '; submitted by ' + by[1],
      source: c.source, origin: 'submitted', submittedBy: by[1], issue: c.issue, verdict: c.verdict, scope: shortScope(n, c), headline: c.headline, kind,
      key: '"issue": "' + c.issue + '"', decidedFrom: 'certs/claims-intake-2026-11-08.json', page: c.issue
    });
  }
}

/* the defect kind and the day the record first held each row (rows 1–4 predate the register: their kinds are read here) */
for (const r of rows) {
  if (!r.kind) r.kind = r.verdict === 'REFUTED' ? (r.id === 'erdos852-cstar' ? 'float-printed-as-exact' : null) : r.verdict === 'PARTIAL' ? 'narrower-scope' : r.verdict === 'NEEDS DATA' ? 'data-not-public' : 'none';
  if (r.id === 'rm-registry') { const c = J('ledger.json').families.find((x) => x.name === 'ramanujan-audit').counts; r.kinds = kindCount(Array(c.hits).fill('none').concat(Array(c.refuted).fill('sign-slip'))); }
  if (r.kinds) { const d = Object.entries(r.kinds).filter(([k]) => k !== 'none').sort((a, b) => b[1] - a[1]); r.kind = d.length ? d[0][0] : 'none'; }
  if (!r.kind || !KINDS[r.kind]) die('row ' + r.id + ' has no kind from the closed vocabulary');
  const key = r.key || (r.id.startsWith('ai-') ? r.id.slice(3) : r.id.startsWith('kiss-') ? r.id.slice(5) : r.id === 'erdos852-cstar' ? 'cstar' : r.id === 'rm-registry' ? 'ramanujan-audit' : r.id);
  r.recordedOn = firstSeen(r.decidedFrom.split(' ')[0], key);
  delete r.key;
  /* a page the row points at must be built: a site path resolves under site/ (a folder to its index) */
  if (r.page.startsWith('/') && !fs.existsSync(path.join(ROOT, 'site', r.page.endsWith('/') ? r.page + 'index.html' : r.page))) die('row ' + r.id + ' points at a page that does not exist in site/: ' + r.page);
}
if (new Set(rows.map((r) => r.id)).size !== rows.length) die('two rows share an id');

const byVerdict = {};
for (const r of rows) byVerdict[r.verdict] = (byVerdict[r.verdict] || 0) + 1;
const byOrigin = {};
for (const r of rows) byOrigin[r.origin] = (byOrigin[r.origin] || 0) + 1;
if ((byOrigin.submitted || 0) !== rows.filter((r) => r.decidedFrom === 'certs/claims-intake-2026-11-08.json').length) die('a submitted row appeared that the intake record does not decide');

const out = {
  what: 'Externally published mathematical claims this machine has decided, one row per claim, each '
    + 'derived from the record that decided it. The verdicts are the instrument\'s, not a summary: '
    + 'CERTIFIED and REFUTED are theorems, PARTIAL names the fragment that was reached, NEEDS DATA '
    + 'measures the claimant rather than the claim, MIXED means the row is an aggregate whose '
    + 'record holds both, and REPAIRED means the claim as printed is refuted and an object next to it is '
    + 'certified. Each row names its defect kind from one closed vocabulary (kindsDefined); an aggregate '
    + 'row counts them. recordedOn is the first commit whose deciding record held the row.',
  honestCounting: 'Every row is DERIVED from a record; a claim with no record gets no row. ORIGIN is '
    + 'tracked separately: a self-initiated row is a claim we chose; a submitted row is one someone sent through '
    + 'the public claim form. The first submitted claims arrived on 2026-11-06 (cert-machine issues #3–#6) and '
    + 'are decided from their intake record; every other row is self-initiated.',
  scope: 'What can be decided here: claims that come down to finitely many exact arithmetic facts — '
    + 'exhibit a witness, verify an identity, bound a quantity, decide a constant. Everything else is '
    + 'REFUSED as out of scope rather than guessed at.',
  rows, count: rows.length,
  /* A QUEUED row is NOT a decided claim. Counting it as one would inflate the
     headline by exactly the amount this lab exists to catch, so it is split
     out here and the pages quote `decided`. */
  decided: rows.filter(r => r.verdict !== 'QUEUED').length,
  pending: rows.filter(r => r.verdict === 'QUEUED').length,
  byVerdict, byOrigin,
  kindsDefined: KINDS,
  /* rows by their kind (an aggregate by its most frequent defect); the items inside an aggregate are counted in its row only —
     a key, a contour and a construction are not units of one another */
  byKind: rows.reduce((o, r) => { o[r.kind] = (o[r.kind] || 0) + 1; return o; }, {}),
  byMonth: rows.reduce((o, r) => { const m = r.recordedOn.slice(0, 7); o[m] = (o[m] || 0) + 1; return o; }, {}),
  submitted: byOrigin.submitted || 0,
  /* the hundred pre-registered machine claims decided so far: rows of their own, plus those whose object the register already held */
  preregistered: { corpus: 'corpus/machine-claims-100.json', of: 100, decided: rows.filter((r) => r.preregistered).length,
    ownRows: rows.filter((r) => r.preregistered && r.id.startsWith('mc100-')).length, alreadyInRegister: mc100Same.map(({ r }) => r.id + ' = ' + r.sameClaimAs) },
  meta: { date: new Date().toISOString().slice(0, 10), git }
};
fs.writeFileSync(path.join(ROOT, 'certs', 'claims-ledger.json'), JSON.stringify(out, null, 1) + '\n');
console.log('certs/claims-ledger.json written · ' + out.decided + ' decided (+' + out.pending + ' queued) · '
  + Object.entries(byVerdict).map(([k, v]) => k + ' ' + v).join(', ') + ' · submitted ' + out.submitted + ' @ git ' + git);
