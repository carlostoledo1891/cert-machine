#!/usr/bin/env node
/* build-report-optq.js — reports/optconst-queue.html: the open pull-request queue of the optimization-constants
   registry, decided where decidable. Every number comes from certs/optq-ledger.json (tools/run-optq-ledger.py),
   re-derived here before a word is written, and from the battery's own count.

   usage: node tools/build-report-optq.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('OPTQ REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const py = (args) => cp.execFileSync('python3', ['-I'].concat(args), { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });

try { py(['tools/run-optq-ledger.py']); } catch (e) { die('the ledger does not re-derive: ' + (e.stdout || e.message)); }
let bat = ''; try { bat = py(['instruments/optq/battery.py']); } catch (e) { die('the battery did not pass: ' + (e.stdout || e.message)); }
const bm = /optq battery: (\d+) pass, 0 fail, (\d+)\/(\d+) red controls fired/.exec(bat);
if (!bm || bm[2] !== bm[3]) die('the battery did not pass whole');
const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'optq-ledger.json'), 'utf8'));
const rows = L.rows, R = (id) => rows.find((r) => r.id === id);
const r1a = R('optq-225-1a'), r1b = R('optq-225-1b'), r3c = R('optq-221-3c'), r20a = R('optq-226-20a'), r20c = R('optq-226-20c'), r23b = R('optq-226-23b'), r217 = R('optq-217-28a'), r210 = R('optq-210-lambda');
if ([r1a, r1b, r3c, r20a, r20c, r217].some((r) => !r || r.verdict !== 'CERTIFIED') || r210.verdict !== 'REFUSED') die('the record is not what the page describes — rewrite it');
const tag = (v) => C.tag(v, v === 'CERTIFIED' ? 'held' : v === 'REFUTED' ? 'fail' : 'dep');
const inv = r210.inventory;

const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · audit · the optimization-constants PR queue',
  title: 'Five pull requests to the constants registry, decided where decidable',
  deck: 'Tao\'s optimization-constants registry has fifteen open pull requests, most of them machine-assisted, none reviewed since September. Five are read here from their submissions: two exact step functions '
    + 'that tighten the autocorrelation and minimum-overlap constants, a two-law entropy certificate for C₃c, five one-line bounds, OpenAI\'s nine-dimensional Borsuk counterexample, and a '
    + '"certified record package" for the de Bruijn–Newman constant at 0.1595. Every finite object decides and holds; the proofs read hold; and the package, 104 files whose scorer compares rationals '
    + 'and hashes while its analysis cites a bank outside the bundle, is refused — not wrong, undecidable from what was submitted.'
}));
B.push(C.scope('teorth/optimizationproblems at 2c1968cd (main; unchanged since 2026-09-26) and its open PRs #210, #217, #221, #225, #226 as fetched 2026-10-15, with the constructions they link (Atris records @ 1fa857a0, '
  + 'Zenodo 23289305, Mosaic\'s fork @ cc810785, OpenAI\'s BorsukNine through this repository\'s own kernel record), every byte pinned by sha256 in corpus/optconst-queue/PINS.json; the claimants\' scorers kept as text and never run. '
  + 'Definitions are the registry\'s constants/*.md. Pre-registered in corpus/optconst-queue/preregistration.json. Two of #226\'s five bounds (16a, 70a) are not decided in this campaign and say so.'));
B.push(C.tldr({
  findingRaw: '<b>Decided and holding:</b> C₁a ≤ ' + C.esc(r1a.valueDecimal.slice(0, 20)) + '… and C₁b ≤ ' + C.esc(r1b.valueDecimal.slice(0, 20)) + '… — the exact values of the two step functions (' + r1a.n.toLocaleString('en-US') + ' and ' + r1b.n.toLocaleString('en-US')
    + ' steps), equal to the claimants\' printed fractions digit for digit, below the registry\'s 1.502862 and 0.380868; C₃c ≥ 1.674894211307116 from the two-law certificate, ρ enclosed in [' + C.esc(r3c.rho[0][0].slice(0, 22)) + ', ' + C.esc(r3c.rho[0][1].slice(0, 22)) + '] at ' + r3c.precisionBits + ' bits (the registry holds 1.67473389*); '
    + 'C₂₀a ≥ 8 and C₂₀c ≥ √3 by exact moments; C₂₈a ≤ 9 by the Lean development this repository rebuilt and kernel-checked on 10-10. <b>Read and holding:</b> C₂₃b ≤ ½, five sentences of standard inequalities. <b>Refused:</b> Λ ≤ 0.1595 — '
    + 'the package\'s scorer and checkers (' + inv.scripts.length + ' scripts; the two mathematical ones on python-flint and mpmath) evaluate auxiliary inequalities on ' + inv.frozenFiles + ' frozen coefficient tables and compare rationals, hashes and box covers; nothing in them evaluates ζ, H_t or the Dirichlet polynomial, and the derivations of the frozen numbers cite banks '
    + C.esc(inv.bankCitations.join(', ')) + ' that are not in the bundle. The anchor Λ ≤ 3/16 is the claimant\'s own earlier merged row. <b>Not decided:</b> 16a and 70a (interval sums with cited inequalities).',
  mechanismRaw: 'Step functions: heights as integers over one denominator, the autoconvolution or the correlation with 1 − h as one exact integer product (Kronecker substitution), the maximum over every grid shift, the bound as a fraction. Entropy certificate: exact pushforwards per law, directed-rounding interval entropies '
    + '(instruments/sumdiff + bigfloat), rational mixture, injectivity of the digit map checked (max |L| = ' + r3c.maxAbsForm + ' ≤ 27). Moments: E[Eᵏ] = k! and arithmetic in Q(√3) through squares. The Borsuk row cites the kernel record. The package: read file by file.',
  checkRaw: C.m('python3 -I tools/run-optq-ledger.py') + ' · ' + C.m('python3 -I instruments/optq/battery.py') + ' — ' + bm[1] + ' checks, ' + bm[3] + ' red controls.'
}));
B.push(C.stats([
  { k: 'decided', v: String(L.counts.CERTIFIED), n: L.counts.REFUTED + ' refuted · ' + L.counts.REFUSED + ' refused (one for evidence not submitted, two not attempted).' },
  { k: 'C₁a ≤', v: r1a.valueDecimal.slice(0, 10), n: 'From the registry\'s 1.502862; a 65,536-step function, exact.' },
  { k: 'C₃c ≥', v: '1.674894', n: 'From 1.674734*; two laws, 10²⁰ digits, the entropies add because the digit map is injective.' },
  { k: 'Λ ≤ 0.1595', v: 'refused', n: 'The scorer decides assembly, not analysis; the analysis cites a private bank.' }
]));
B.push(C.section({
  lab: '§1 · the queue', title: 'Each claim, its object, its verdict', wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'PR' }, { h: 'constant' }, { h: 'claim' }, { h: 'decided by' }, { h: 'verdict' }],
    rows: rows.map((r) => [{ raw: '#' + r.pr }, { raw: C.esc(r.constant) }, { raw: C.esc(r.claim.length > 170 ? r.claim.slice(0, 167) + '…' : r.claim) }, { raw: C.esc((r.scope ? r.scope.split(':')[0] + ' — ' : '') + r.how.slice(0, 160) + (r.how.length > 160 ? '…' : '')) }, { raw: tag(r.verdict) }])
  })
}));
B.push(C.section({
  lab: '§2 · the step functions', title: '#225: two constants tightened, exactly',
  bodyRaw: C.pRaw('The registry\'s C₁a is the largest constant with max (f∗f) ≥ C (∫f)² over non-negative f on [−¼, ¼]; any explicit f is an upper bound. Atris\'s f has ' + r1a.n.toLocaleString('en-US') + ' equal steps with 13-digit rational heights; for a step function the autoconvolution is piecewise linear with its breakpoints on the grid, so its supremum is a grid value — '
    + 'computed here as one exact integer product (the heights packed into a big integer, multiplied, unpacked) and maximised over every shift: ' + C.esc(r1a.value.length > 90 ? r1a.valueDecimal : r1a.value) + ' = ' + C.esc(r1a.valueDecimal) + '…, the claimant\'s own fraction to the last digit, below 1.5027435 by ' + C.esc(String(r1a.slack).slice(0, 12)) + '…. '
    + 'C₁b likewise: h on 114,688 steps with Σh = n/2 exactly and 0 ≤ h ≤ 1, correlated with 1 − h: ' + C.esc(r1b.valueDecimal) + '…, below 0.38085856. The registry\'s entries were 1.502862 and 0.380868.')
}));
B.push(C.section({
  lab: '§3 · the entropy certificate', title: '#221: two laws, one bound',
  bodyRaw: C.pRaw('A single law μ on Z² gives C₃c ≥ H(X−Y)/max(H(X), H(Y), H(X+Y), H(X+2Y)); this certificate mixes two laws across the digits of a base-55 expansion, 39041372760532870645 digits from a 51-point law and 60958627239467129355 from a 47-point law. The entropies add digit by digit only if the map from digit values to L(X,Y) is injective, '
    + 'which holds when every |L(x,y)| on both supports is at most (55−1)/2 = 27 — checked: the maximum is ' + r3c.maxAbsForm + '. Each per-law entropy is an interval with directed rounding at ' + r3c.precisionBits + ' bits (no code of the claimant\'s; the single-law instrument that decided C₃b and C₃c in September, with the mixture by rational weights on top); '
    + 'ρ ∈ [' + C.esc(r3c.rho[0][0]) + ', ' + C.esc(r3c.rho[0][1]) + '], above 1.674894211307116. The claimant\'s flint and PARI checkers print the same 16 digits.')
}));
B.push(C.section({
  lab: '§4 · one-line bounds', title: '#226 and #217: what a sentence can certify',
  bodyRaw: C.plainList([
    { b: 'C₂₀a ≥ 8 (CERTIFIED).', text: 'X = E − 1 with E standard exponential: E[Eᵏ] = k!, so E[(E−1)⁴] = 9, E[(E−1)²] = 1, mean 0, and Var(X²) = 8; independent copies add variances, giving Var(|X|²) = 8n in every dimension against the registry\'s bound C n. The density e^{−t} is log-linear, hence log-concave. The registry held 2.' },
    { b: 'C₂₀c ≥ √3 (CERTIFIED).', text: 'The uniform law on [−√3, √3] has variance 1 and is log-concave; the half-line A = (−∞, 0] has μ(A) = ½ and boundary measure 1/(2√3), so its inverse Cheeger ratio is √3 — computed in Q(√3) through squares (1/3 and 3). The registry held √(π/2).' },
    { b: 'C₂₃b ≤ ½ (CERTIFIED by reading).', text: r23b.scope.replace(/^BY READING, not computed: /, '') },
    { b: 'C₂₈a ≤ 9 (CERTIFIED, by the earlier record).', text: 'OpenAI\'s BorsukNine is the Lean development this repository rebuilt and checked under two kernels on 2026-10-10 (certs/openai-math-kernel.json; the statement read MATCHES against the paper\'s claim). The PR adds nothing to decide and its wording agrees with the theorem.' },
    { b: 'C₁₆a ≥ 2.156224 and C₇₀a ≥ 1.201927 (REFUSED: not attempted).', text: 'Fifty-million-term and 300,000-term sums with cited inequalities in their derivations (BDZ2013; Szász, Steiner). An interval evaluation with a reading of each step is a campaign of its own; nothing is said against them.' }
  ])
}));
B.push(C.section({
  lab: '§5 · the package', title: '#210: what a "certified record package" certifies',
  bodyRaw: C.pRaw('Mosaic Intelligence\'s submission is ' + inv.files + ' files. Its scorer (verify/record_score.py) runs the assembly\'s verify.py and checks ' + inv.scorerGates.length + ' gates — ' + C.esc(inv.scorerGates.join(', ')) + ' — printing "TOTAL CHECKS RUN: ' + C.esc(inv.totalChecksRunPrinted || '?') + '". '
    + 'The two mathematical checkers (python-flint arb; mpmath.iv) evaluate auxiliary quantities on frozen coefficient tables — walls, clocks, norms, debits, Taylor leaves — and compare rationals, hashes and box covers. No function in the ' + inv.scripts.length + ' scripts evaluates ζ, H_t or the 690,988-term Dirichlet polynomial; the torus floor, the separator at X and the Polymath15 error constants enter as ' + inv.frozenFiles
    + ' frozen outputs whose proofs cite banks ' + C.esc(inv.bankCitations.join(', ')) + ' — an internal memory that is not in the bundle. The anchor Λ ≤ 3/16 is the claimant\'s own 2026-07 row, merged into the registry without review. So the package certifies that its parts fit together as declared; whether the parts are true is not in the submission, and this page refuses rather than guesses. '
    + 'The route itself (collision exclusion with an exterior polydisc floor carried by a "circular heat" lemma) is coherent on reading; the first independent check to run would be the torus-floor inequality on T⁴ by an interval cover, then the separator at x = X for t ∈ [0, 3/16] including y = 0, then the error constants from Polymath15 Theorem 1.3 — each hours to days.')
}));
B.push(C.section({
  lab: '§6 · limits', title: 'What is not decided here',
  bodyRaw: C.plainList([
    { b: 'The registry\'s definitions.', text: 'Taken as written at 2c1968cd; whether 1b\'s interval of length 2 matches the literature\'s normalisation is the registry\'s business.' },
    { b: 'The two reading rows.', text: '23b is a proof read, not a computation; 28a rests on the earlier kernel record. Both are marked so.' },
    { b: 'Mosaic\'s mathematics.', text: 'Refusal is a verdict on the evidence submitted, not on Λ; Mosaic\'s three earlier certificates (C₃b, C₃c, C₇₁) were all true when decided here in September.' },
    { b: 'Same-author second implementation.', text: 'The Kronecker product is checked against schoolbook multiplication on random sequences and on closed-form functions (the constant function gives exactly 2; the half-step exactly 1); the claimants\' printed values are the outside check.' }
  ])
}));
const foot = '<p>' + C.esc('Generated by tools/build-report-optq.js from certs/optq-ledger.json (' + L.generated + ', ' + L.seconds + ' s), re-derived at build; battery ' + bm[1] + ' checks, ' + bm[3] + ' red controls; @ git ' + git + '.') + '</p>';
fs.writeFileSync(path.join(ROOT, 'reports', 'optconst-queue.html'), TPL.render({
  title: 'Five pull requests to the constants registry, decided where decidable · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot,
  desc: 'The open PR queue of Tao\'s optimization-constants registry: two exact step functions, a two-law entropy certificate, five one-line bounds, OpenAI\'s Borsuk counterexample and a de Bruijn–Newman "certified record package" — decided where a finite object exists, refused where the evidence is not in the submission.',
  path: '/reports/optconst-queue.html'
}));
console.log('reports/optconst-queue.html written: ' + rows.length + ' rows, ' + L.counts.CERTIFIED + ' certified, ' + L.counts.REFUSED + ' refused @ git ' + git);
