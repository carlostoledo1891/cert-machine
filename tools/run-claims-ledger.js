#!/usr/bin/env node
/* run-claims-ledger.js — derive certs/claims-ledger.json from the records.
   tools/ · cert-machine

   THE LEDGER IS DERIVED, NEVER TYPED. Every row is read out of a record that already decides the
   claim; a claim with no record does not get a row. That is the difference between a ledger and a
   list of things we remember doing.

   ORIGIN is tracked because it is the honest part: everything here so far is SELF-INITIATED — we
   chose the claim. The submitted column is what an intake queue fills, and it is empty until
   someone sends something. Publishing a decided-claims page while pretending the queue is busy
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
    origin: 'self-initiated', verdict: c.rejects ? 'MIXED' : 'CERTIFIED',
    scope: c.hits + ' rows survive their certified enclosure, ' + c.rejects + ' refuted exactly',
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
    if (r.verdict !== 'WITNESSED' && r.verdict !== 'REPAIRED') die('an easota row is neither witnessed nor repaired: ' + r.id);
    rows.push({
      id: 'ea-' + r.id.replace(/\//g, '-'), claim: r.claim, claimant: r.claimant.replace(/,\s*this repository$/, ' (the EinsteinArena repository)'), source: r.file + ' (sha256 ' + r.sha256.slice(0, 12) + '…)',
      origin: 'self-initiated', verdict: r.verdict === 'WITNESSED' ? 'CERTIFIED' : 'REPAIRED',
      scope: r.verdict === 'WITNESSED' ? 'the construction as published, in exact arithmetic' : 'as published, a witness only within a verifier\'s tolerance (whose, and when — the platform\'s or the repository notebook\'s — in the easota ledger\'s platformRule); a repaired construction next to it is certified',
      kind: r.verdict === 'WITNESSED' ? 'none' : 'tolerance-witness', key: r.id, decidedFrom: 'certs/easota-ledger.json', page: '/reports/easota.html'
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

/* the defect kind and the day the record first held each row (rows 1–4 predate the register: their kinds are read here) */
for (const r of rows) {
  if (!r.kind) r.kind = r.verdict === 'REFUTED' ? (r.id === 'erdos852-cstar' ? 'float-printed-as-exact' : null) : r.verdict === 'PARTIAL' ? 'narrower-scope' : r.verdict === 'NEEDS DATA' ? 'data-not-public' : 'none';
  if (r.id === 'rm-registry') { const c = J('ledger.json').families.find((x) => x.name === 'ramanujan-audit').counts; r.kinds = kindCount(Array(c.hits).fill('none').concat(Array(c.rejects).fill('sign-slip'))); }
  if (r.kinds) { const d = Object.entries(r.kinds).filter(([k]) => k !== 'none').sort((a, b) => b[1] - a[1]); r.kind = d.length ? d[0][0] : 'none'; }
  if (!r.kind || !KINDS[r.kind]) die('row ' + r.id + ' has no kind from the closed vocabulary');
  const key = r.key || (r.id.startsWith('ai-') ? r.id.slice(3) : r.id.startsWith('kiss-') ? r.id.slice(5) : r.id === 'erdos852-cstar' ? 'cstar' : r.id === 'rm-registry' ? 'ramanujan-audit' : r.id);
  r.recordedOn = firstSeen(r.decidedFrom.split(' ')[0], key);
  delete r.key;
}

const byVerdict = {};
for (const r of rows) byVerdict[r.verdict] = (byVerdict[r.verdict] || 0) + 1;
const byOrigin = {};
for (const r of rows) byOrigin[r.origin] = (byOrigin[r.origin] || 0) + 1;
if (byOrigin.submitted) die('a submitted row appeared but the intake queue has no record to derive it from');

const out = {
  what: 'Externally published mathematical claims this machine has decided, one row per claim, each '
    + 'derived from the record that decided it. The verdicts are the instrument\'s, not a summary: '
    + 'CERTIFIED and REFUTED are theorems, PARTIAL names the fragment that was reached, NEEDS DATA '
    + 'measures the claimant rather than the claim, MIXED means the row is an aggregate whose '
    + 'record holds both, and REPAIRED means the claim as printed is refuted and an object next to it is '
    + 'certified. Each row names its defect kind from one closed vocabulary (kindsDefined); an aggregate '
    + 'row counts them. recordedOn is the first commit whose deciding record held the row.',
  honestCounting: 'Every row is DERIVED from a record; a claim with no record gets no row. ORIGIN is '
    + 'tracked separately: everything here is self-initiated — we chose the claim. Nothing has been '
    + 'submitted yet, and the submitted count stays zero until it is not.',
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
  submitted: 0,
  /* the hundred pre-registered machine claims decided so far: rows of their own, plus those whose object the register already held */
  preregistered: { corpus: 'corpus/machine-claims-100.json', of: 100, decided: rows.filter((r) => r.preregistered).length,
    ownRows: rows.filter((r) => r.preregistered && r.id.startsWith('mc100-')).length, alreadyInRegister: mc100Same.map(({ r }) => r.id + ' = ' + r.sameClaimAs) },
  meta: { date: new Date().toISOString().slice(0, 10), git }
};
fs.writeFileSync(path.join(ROOT, 'certs', 'claims-ledger.json'), JSON.stringify(out, null, 1) + '\n');
console.log('certs/claims-ledger.json written · ' + out.decided + ' decided (+' + out.pending + ' queued) · '
  + Object.entries(byVerdict).map(([k, v]) => k + ' ' + v).join(', ') + ' · submitted ' + out.submitted + ' @ git ' + git);
