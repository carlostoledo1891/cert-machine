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

/* the ledger is re-derived before a word is written; when nothing but its wall-clock moved, the committed bytes are put
   back, so a page build never churns the record the method paper reads (its seconds are quoted there) */
const LEDGER = path.join(ROOT, 'certs', 'optq-ledger.json'), was = fs.readFileSync(LEDGER);
const untimed = (b) => JSON.stringify(JSON.parse(b), (k, v) => (k === 'seconds' || k === 'generated' ? undefined : v));
try { py(['tools/run-optq-ledger.py']); } catch (e) { fs.writeFileSync(LEDGER, was); die('the ledger does not re-derive: ' + (e.stdout || e.message)); }
if (untimed(fs.readFileSync(LEDGER)) === untimed(was)) fs.writeFileSync(LEDGER, was);
else console.log('optq ledger CHANGED beyond its timings — the new record stays; commit it and regenerate what reads it');
let bat = ''; try { bat = py(['instruments/optq/battery.py']); } catch (e) { die('the battery did not pass: ' + (e.stdout || e.message)); }
const bm = /optq battery: (\d+) pass, 0 fail, (\d+)\/(\d+) red controls fired/.exec(bat);
if (!bm || bm[2] !== bm[3]) die('the battery did not pass whole');
const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'optq-ledger.json'), 'utf8'));
const rows = L.rows, R = (id) => rows.find((r) => r.id === id);
const r1a = R('optq-225-1a'), r1b = R('optq-225-1b'), r3c = R('optq-221-3c'), r20a = R('optq-226-20a'), r20c = R('optq-226-20c'), r23b = R('optq-226-23b'), r217 = R('optq-217-28a'), r210 = R('optq-210-lambda');
const r16a = R('optq-226-16a'), r70a = R('optq-226-70a');
if ([r1a, r1b, r3c, r20a, r20c, r217, r16a, r70a].some((r) => !r || r.verdict !== 'CERTIFIED') || r210.verdict !== 'REFUSED' || L.counts.REFUSED !== 1) die('the record is not what the page describes — rewrite it');
const enc = (r, d) => '[' + C.esc(r.values.enclosure[0].slice(0, d)) + ', ' + C.esc(r.values.enclosure[1].slice(0, d)) + ']';
const tag = (v) => C.tag(v, v === 'CERTIFIED' ? 'held' : v === 'REFUTED' ? 'fail' : 'dep');
const inv = r210.inventory;

const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · audit · the optimization-constants PR queue',
  title: 'Five pull requests to the constants registry, decided where decidable',
  deck: 'On 2026-10-15 Tao\'s optimization-constants registry had fifteen open pull requests, most of them machine-assisted, none reviewed since September. Five are read here from their submissions: two exact step functions '
    + 'that tighten the autocorrelation and minimum-overlap constants, a two-law entropy certificate for C₃c, five one-line bounds, OpenAI\'s nine-dimensional Borsuk counterexample, and a '
    + '"certified record package" for the de Bruijn–Newman constant at 0.1595. Every finite object decides and holds; the proofs read hold; and the package, 104 files whose scorer compares rationals '
    + 'and hashes while its analysis cites a bank outside the bundle, is refused — not wrong, undecidable from what was submitted.'
}));
B.push(C.scope('teorth/optimizationproblems at 2c1968cd (main; unchanged since 2026-09-26) and its open PRs #210, #217, #221, #225, #226 as fetched 2026-10-15, with the constructions they link (Atris records @ 1fa857a0, '
  + 'Zenodo 23289305, Mosaic\'s fork @ cc810785, OpenAI\'s BorsukNine through this repository\'s own kernel record), every byte pinned by sha256 in corpus/optconst-queue/PINS.json; the claimants\' scorers kept as text and never run. '
  + 'Definitions are the registry\'s constants/*.md. Pre-registered in corpus/optconst-queue/preregistration.json. Two of #226\'s five bounds (16a, 70a) were refused on 2026-10-15 as not attempted and decided on 2026-10-16, after the claimant pointed to his derivations (pinned as text with his scripts; nothing of his runs here).'));
B.push(C.tldr({
  findingRaw: '<b>Decided and holding:</b> C₁a ≤ ' + C.esc(r1a.valueDecimal.slice(0, 20)) + '… and C₁b ≤ ' + C.esc(r1b.valueDecimal.slice(0, 20)) + '… — the exact values of the two step functions (' + r1a.n.toLocaleString('en-US') + ' and ' + r1b.n.toLocaleString('en-US')
    + ' steps), equal to the claimants\' printed fractions digit for digit, below the registry\'s 1.502862 and 0.380868; C₃c ≥ 1.674894211307116 from the two-law certificate, ρ enclosed in [' + C.esc(r3c.rho[0][0].slice(0, 22)) + ', ' + C.esc(r3c.rho[0][1].slice(0, 22)) + '] at ' + r3c.precisionBits + ' bits (the registry holds 1.67473389*); '
    + 'C₂₀a ≥ 8 and C₂₀c ≥ √3 by exact moments; C₂₈a ≤ 9 by the Lean development this repository rebuilt and kernel-checked on 10-10. <b>Read and holding:</b> C₂₃b ≤ ½, five sentences of standard inequalities. <b>Refused:</b> Λ ≤ 0.1595 — '
    + 'the package\'s scorer and checkers (' + inv.scripts.length + ' scripts; the two mathematical ones on python-flint and mpmath) evaluate auxiliary inequalities on ' + inv.frozenFiles + ' frozen coefficient tables and compare rationals, hashes and box covers; nothing in them evaluates ζ, H_t or the Dirichlet polynomial, and the derivations of the frozen numbers cite banks '
    + C.esc(inv.bankCitations.join(', ')) + ' that are not in the bundle. The anchor Λ ≤ 3/16 is the claimant\'s own earlier merged row. <b>Decided 2026-10-16, holding:</b> C₁₆a ≥ 2.156224 — the truncated BDZ2013 extremal\'s bound enclosed in ' + enc(r16a, 14) + ' (width ' + C.esc(r16a.values.width) + '); '
    + 'C₇₀a ≥ 1.201927 — the cube-and-ball Steiner sum at n = 300,000 enclosed in ' + enc(r70a, 14) + '; both in the standard library, their derivations read.',
  mechanismRaw: 'Step functions: heights as integers over one denominator, the autoconvolution or the correlation with 1 − h as one exact integer product (Kronecker substitution), the maximum over every grid shift, the bound as a fraction. Entropy certificate: exact pushforwards per law, directed-rounding interval entropies '
    + '(instruments/sumdiff + bigfloat), rational mixture, injectivity of the digit map checked (max |L| = ' + r3c.maxAbsForm + ' ≤ 27). Moments: E[Eᵏ] = k! and arithmetic in Q(√3) through squares. 16a: the three lattice sums as fixed-point floors and ceilings over ' + r16a.values.latticePoints.toLocaleString('en-US') + ' points, π by Machin in integers, ln correctly rounded. '
    + '70a: κ_m, the binomials and tʲ by outward-rounded decimal recurrences, the n-th root through ln and exp. The Borsuk row cites the kernel record. The package: read file by file.',
  checkRaw: C.m('python3 -I tools/run-optq-ledger.py') + ' · ' + C.m('python3 -I instruments/optq/battery.py') + ' — ' + bm[1] + ' checks, ' + bm[3] + ' red controls.'
}));
/* what the registry did with the queue, read from its pinned bytes (tools/read-optconst-registry.js) — never from memory */
{
  const RG = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'optconst-queue', 'registry-2026-10-18', 'record.json'), 'utf8')).facts;
  const RG2 = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'optconst-queue', 'registry-2026-10-18b', 'record.json'), 'utf8')).facts;
  const S = RG2.secondReplay, P = RG2.stepFunctions;
  if (!(RG.queue[221].merged && RG.queue[221].asteriskKept && RG.queue[210].merged && S.merged && !S.rowJ2026.star && S.citesT2026b && P.merged && P.rowA2026['1a'].star && P.rowA2026['1b'].star && !P.citesUs['1a'] && P.asteriskCommit.reason && RG2.open[226] === 'open'))
    die('the registry snapshots no longer say what the afterwards note says — rewrite it');
  const hrs = ((Date.parse(S.mergedAt) - Date.parse(S.createdAt)) / 3600000).toFixed(1);
  B.push('<div class="col">' + C.note({ lab: 'afterwards · ' + S.mergedAt.slice(0, 10), bodyRaw: C.pRaw('The maintainer merged three of the five pull requests. '
    + '<b>#221</b>\'s two-law certificate went in with its asterisk; the replay on this page, offered as <a href="https://github.com/teorth/optimizationproblems/pull/230">PR #230</a>, was merged '
    + hrs + ' hours after it was filed (commit ' + C.esc(S.mergeCommit.slice(0, 8)) + '), the asterisk removed and the C₃c page citing it as [T2026b]. <b>#225</b>\'s step functions were merged and then marked with the asterisk by the maintainer, as \u201c'
    + C.esc(P.asteriskCommit.reason.replace(/\s+/g, ' ')) + '\u201d (commit ' + C.esc(P.asteriskCommit.sha.slice(0, 8)) + '); the exact decision above was posted as a comment on that pull request and is not cited there. '
    + '<b>#210</b>\'s package went in asterisked. #217 and #226 are open. The registry\'s bytes after each round are pinned in ' + C.m('corpus/optconst-queue/registry-2026-10-18/') + ' and ' + C.m('registry-2026-10-18b/') + '.') }) + '</div>');
}
B.push(C.stats([
  { k: 'decided', v: String(L.counts.CERTIFIED), n: L.counts.REFUTED + ' refuted · ' + L.counts.REFUSED + ' refused (evidence not submitted). 16a and 70a joined the decided on 10-16.' },
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
/* the replay of the four C_1a/C_1b rows for the registry (certs/stepfun-replay.json, tools/replay-stepfun.js): written
   only while the record is of the code on disk, both implementations agree and every red control fired */
const SR = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'stepfun-replay.json'), 'utf8'));
const shaOf = (rel) => require('crypto').createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');
if (SR.deciders.js !== shaOf('tools/replay-stepfun.js') || SR.deciders.jsModule !== shaOf('instruments/optq/stepfun-exact.js') || SR.deciders.py !== shaOf('instruments/optq/stepfun.py')) die('certs/stepfun-replay.json was written by other deciders — re-run tools/replay-stepfun.js');
if (!SR.rows.every((r) => r.agree && r.verdict === 'CERTIFIED') || !SR.redControls.every((r) => r.fired)) die('the step-function replay is not four agreeing CERTIFIED rows with every red control fired');
const sup = (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d], sci = (x) => { const [m, e] = x.toExponential(2).split('e'); return m + ' × 10' + (e[0] === '-' ? '⁻' : '') + e.replace(/^[-+]/, '').split('').map(sup).join(''); };
const cdx = SR.rows.find((r) => r.id === '1b-codexprolong'), cdxRed = SR.redControls.find((r) => r.id === 'codexprolong-as-published');
const replayRaw = C.pRaw('<b>Replayed for the registry, 2026-10-18.</b> When the maintainer merged #225 he marked its two rows and the two EinsteinArena rows beside them with the asterisk, as replayed only by the submitting team\'s own checker. All four are decided here by two implementations that share no code with each other or with the claimants — '
    + C.m('instruments/optq/stepfun.py') + ' (Python, Fraction and int) and ' + C.m('instruments/optq/stepfun-exact.js') + ' (JavaScript BigInt), run by ' + C.m('tools/replay-stepfun.js') + ' — from the pinned bytes, against the bounds the registry prints, read from its pinned pages: every one CERTIFIED, with the same fraction in both. '
    + 'CodexProLong\'s heights are refused as published (Σh − n/2 = ' + sci(Number(/= ([0-9.]+)/.exec(cdxRed.jsWhy)[1])) + ', not 0); scaled down to Σh = n/2 exactly, the repair the platform\'s own verifier makes in floating point, they certify the bound. The EinsteinArena heights are read as the doubles the JSON numbers denote, as the platform parses them; an earlier record here read the same text as exact decimals and got '
    + C.esc(cdx.otherReading.bound) + ', which certifies the bound too. Five red controls come out wrong in both implementations: a bound 10⁻¹⁵ below the exact value and a doubled height are REFUTED; a negative height, a height above one and CodexProLong\'s heights as published are REFUSED.')
  + C.plainList(SR.rows.map((r) => ({ b: (r.constant === 'C_1a' ? 'C₁a' : 'C₁b') + ' · ' + r.producer.split(' (')[0] + ' [' + r.ref + ']',
    raw: r.n.toLocaleString('en-US') + ' steps' + (r.rescaled ? ', scaled to Σh = n/2' : '') + ': the registry prints ' + C.esc(r.claim.replace(/^C_1[ab] <= /, '≤ ')) + '; the exact value is ' + C.m(r.js.decimal.slice(0, 22) + '…') + ' — ' + tag(r.verdict) })));
B.push(C.section({
  lab: '§2 · the step functions', title: '#225: two constants tightened, exactly', id: 'step-functions',
  bodyRaw: C.pRaw('The registry\'s C₁a is the largest constant with max (f∗f) ≥ C (∫f)² over non-negative f on [−¼, ¼]; any explicit f is an upper bound. Atris\'s f has ' + r1a.n.toLocaleString('en-US') + ' equal steps with 13-digit rational heights; for a step function the autoconvolution is piecewise linear with its breakpoints on the grid, so its supremum is a grid value — '
    + 'computed here as one exact integer product (the heights packed into a big integer, multiplied, unpacked) and maximised over every shift: ' + C.esc(r1a.value.length > 90 ? r1a.valueDecimal : r1a.value) + ' = ' + C.esc(r1a.valueDecimal) + '…, the claimant\'s own fraction to the last digit, below 1.5027435 by ' + sci(Number(String(r1a.slack).split('/').map(BigInt).reduce((p, q) => (p * 10n ** 30n) / q)) / 1e30) + '. '
    + 'C₁b likewise: h on 114,688 steps with Σh = n/2 exactly and 0 ≤ h ≤ 1, correlated with 1 − h: ' + C.esc(r1b.valueDecimal) + '…, below 0.38085856. The registry\'s entries were 1.502862 and 0.380868.')
    + replayRaw
}));
B.push(C.section({
  lab: '§3 · the entropy certificate', title: '#221: two laws, one bound',
  bodyRaw: C.pRaw('A single law μ on Z² gives C₃c ≥ H(X−Y)/max(H(X), H(Y), H(X+Y), H(X+2Y)); this certificate mixes two laws across the digits of a base-55 expansion, 39041372760532870645 digits from a 51-point law and 60958627239467129355 from a 47-point law. The entropies add digit by digit only if the map from digit values to L(X,Y) is injective, '
    + 'which holds when every |L(x,y)| on both supports is at most (55−1)/2 = 27 — checked: the maximum is ' + r3c.maxAbsForm + '. Each per-law entropy is an interval with directed rounding at ' + r3c.precisionBits + ' bits (no code of the claimant\'s; the single-law instrument that decided C₃b and C₃c in September, with the mixture by rational weights on top); '
    + 'ρ ∈ [' + C.esc(r3c.rho[0][0]) + ', ' + C.esc(r3c.rho[0][1]) + '], above 1.674894211307116. The claimant\'s flint and PARI checkers print the same 16 digits.'
    + (r3c.rhoPython ? ' A second implementation, ' + C.m('tools/verify_twolaw.py') + ' — the Python standard library alone, decimal at 120 digits, sharing no code with the first — decides it again: ρ ∈ [' + C.esc(r3c.rhoPython[0].slice(0, 34)) + '…, ' + C.esc(r3c.rhoPython[1].slice(0, 34)) + '…], and its three red controls fire (the smallest 30-digit claim above ρ is REFUTED; base 53, where (53−1)/2 < 27, is REFUSED for injectivity; a weight one unit off is REFUSED).' : ''))
}));
B.push(C.section({
  lab: '§4 · one-line bounds', title: '#226 and #217: what a sentence can certify',
  bodyRaw: C.plainList([
    { b: 'C₂₀a ≥ 8 (CERTIFIED).', text: 'X = E − 1 with E standard exponential: E[Eᵏ] = k!, so E[(E−1)⁴] = 9, E[(E−1)²] = 1, mean 0, and Var(X²) = 8; independent copies add variances, giving Var(|X|²) = 8n in every dimension against the registry\'s bound C n. The density e^{−t} is log-linear, hence log-concave. The registry held 2.' },
    { b: 'C₂₀c ≥ √3 (CERTIFIED).', text: 'The uniform law on [−√3, √3] has variance 1 and is log-concave; the half-line A = (−∞, 0] has μ(A) = ½ and boundary measure 1/(2√3), so its inverse Cheeger ratio is √3 — computed in Q(√3) through squares (1/3 and 3). The registry held √(π/2).' },
    { b: 'C₂₃b ≤ ½ (CERTIFIED by reading).', text: r23b.scope.replace(/^BY READING, not computed: /, '') },
    { b: 'C₂₈a ≤ 9 (CERTIFIED, by the earlier record).', text: 'OpenAI\'s BorsukNine is the Lean development this repository rebuilt and checked under two kernels on 2026-10-10 (certs/openai-math-kernel.json; the statement read MATCHES against the paper\'s claim). The PR adds nothing to decide and its wording agrees with the theorem.' },
    { b: 'C₁₆a ≥ 2.156224 (CERTIFIED 2026-10-16; refused as not attempted the day before).', text: 'The registry\'s L is max over δ ≥ 1 of 4πΘ(δ) − ln δ − ln(1 + ln δ), with Θ(δ) the largest |u(0)|² over zero-mean u on the torus with ‖∇u‖² = 1 and ‖Δu‖² = δ; the torus is 2π × 2π, fixed by BDZ2013 (2.4) and (3.14), whose numerical 2.15627 is the registry\'s own row. '
      + 'The PR\'s u is the truncated BDZ conditional extremal, c_k = 1/(|k|²(|k|² + 41/5)) over 0 < |k|² ≤ 4000², a real zero-mean trigonometric polynomial, so Parseval gives ‖∇u‖² = 4π² S₁, ‖Δu‖² = 4π² S₂, u(0) = S₀, and after normalising, L ≥ S₀²/(π S₁) − ln δ − ln(1 + ln δ) with δ = S₂/S₁ — provided δ ≥ 1. '
      + 'Every sum is finite (no tail). Computed here with no code of the claimant\'s: r₂(n) from a sieve over the octant (' + r16a.values.latticePoints.toLocaleString('en-US') + ' points, equal to Gauss\'s circle count), each term\'s floor and ceiling at scale 2²⁰⁰, π by Machin in integers, the logarithms from the decimal module\'s correctly rounded ln widened one unit each way. '
      + 'δ ∈ ' + enc({ values: { enclosure: r16a.values.delta } }, 12) + ' ≥ 1; the bound ∈ ' + enc(r16a, 22) + ', width ' + C.esc(r16a.values.width) + ' — above 2.156224 (the claimant prints 2.1562247…). The registry held (β + π)/π ≈ 1.82283. One note for the claimant: his cutoff-50 figure (2.15174) is not what μ = 41/5 gives here (2.151390); his 200, 800 and 4000 figures agree.' },
    { b: 'C₇₀a ≥ 1.201927 (CERTIFIED 2026-10-16; refused as not attempted the day before).', text: 'The registry\'s C₇₀ is the least C such that every pair of centrally symmetric convex bodies in every dimension has a linear u with |det u| = 1 and |u(B₁) + B₂|^{1/n} ≤ C(|B₁|^{1/n} + |B₂|^{1/n}); a pair that no such u improves below c is a lower bound. '
      + 'The PR\'s pair is the cube of side a and the ball of radius r. Read and holding: u(B₁) is a parallelotope of volume aⁿ; Steiner\'s formula writes |u(B₁) + rB| through its intrinsic volumes; for a zonotope V_j is the sum of its j-face parallelotope volumes; Szász\'s inequality on the Gram matrix bounds the product of those volumes below by a^{n·C(n−1, j−1)}; AM–GM over the C(n, j) faces gives V_j ≥ C(n, j) aʲ. '
      + 'So the cube is already in its worst position and C₇₀ ≥ (Σ_j C(n, j) aʲ κ_{n−j} r^{n−j})^{1/n}/(a + κ_n^{1/n} r). The number at n = 300,000, a/r = 13/1000 computed here by outward-rounded decimal recurrences (κ_m = κ_{m−2}·2π/m from κ₀ = 1, κ₁ = 2; the binomials and tʲ step by step; the n-th roots through correctly rounded ln and exp): '
      + enc(r70a, 22) + ', width ' + C.esc(r70a.values.width) + ' — above 1.201927. At n = 2 the same code equals the closed form √(t² + 4t + π)/(t + √π). The registry held the trivial 1.' }
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
    { b: 'The two reading rows.', text: '23b is a proof read, not a computation; 28a rests on the earlier kernel record. Both are marked so. 16a and 70a are each a computation plus a reading: the number is enclosed, the derivation (Parseval; Steiner, Shephard\'s zonotope formula, Szász, AM–GM) is read, not re-proved.' },
    { b: 'Mosaic\'s mathematics.', text: 'Refusal is a verdict on the evidence submitted, not on Λ; Mosaic\'s three earlier certificates (C₃b, C₃c, C₇₁) were all true when decided here in September.' },
    { b: 'Same-author second implementation.', text: 'The Kronecker product is checked against schoolbook multiplication on random sequences and on closed-form functions (the constant function gives exactly 2; the half-step exactly 1); the claimants\' printed values are the outside check.' }
  ])
}));
/* §7 (2026-10-18): the registry's C_1c and C_1d, replayed (certs/autocorr-replay.json, tools/replay-autocorr.js) — appended
   so the section numbers the registry already cites (§2, §3) stay where they are */
{
  const AR = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'autocorr-replay.json'), 'utf8'));
  if (AR.deciders.js !== shaOf('tools/replay-autocorr.js') || AR.deciders.jsModule !== shaOf('instruments/optq/stepfun-exact.js') || AR.deciders.py !== shaOf('instruments/optq/autocorr.py')) die('certs/autocorr-replay.json was written by other deciders — re-run tools/replay-autocorr.js');
  const c = AR.rows.find((r) => r.id === '1c-rozetyp'), c0 = AR.rows.find((r) => r.id === '1c-rozetyp-k3072'), d = AR.rows.find((r) => r.id === '1d-cert2026');
  if (!AR.rows.every((r) => r.agree) || c.verdict !== 'CERTIFIED' || c0.verdict !== 'CERTIFIED' || d.verdict !== 'REFUTED' || !d.repair || d.repair.js !== 'CERTIFIED' || d.repair.py !== 'CERTIFIED' || !AR.redControls.every((r) => r.fired) || !c.stated.fractionMatches || c.stated.decimalMatches || !d.stated.fractionMatches)
    die('the C_1c/C_1d replay is not what §7 says — rewrite it');
  B.push(C.section({
    lab: '§7 · C₁c and C₁d', title: 'Two more step functions, and one bound printed below its own certificate', id: 'autocorr',
    bodyRaw: C.pRaw('<b>Decided 2026-10-18.</b> Two family-1 constants entered the registry with asterisked bounds from step functions. Both are decided here from the pinned bytes, against the bounds the registry prints, by two implementations that share no code with each other or with the claimants\' verifiers (kept as text, never run): '
      + C.m('instruments/optq/autocorr.py') + ' (Python, every lag summed term by term) and ' + C.m('instruments/optq/stepfun-exact.js') + ' (JavaScript BigInt, Kronecker products). Each gives the same fraction in both, and it is the claimant\'s own fraction.')
      + C.plainList([
        { b: 'C₁c ≥ ' + c.claim.split('>= ')[1] + ' — ' + 'CERTIFIED.', raw: 'Barnard–Steinerberger\'s constant is the smallest C with min over t ∈ [0, 1] of ∫f(x)f(x+t)dx ≤ C(∫f)²; rozetyp\'s step function (K = 6,144, ' + c.n.toLocaleString('en-US') + ' integer weights) has its autocorrelation linear between multiples of 1/K, so the minimum is a grid value: '
          + C.m(c.js.decimal.slice(0, 22) + '…') + ', the stated fraction exactly. <b>A misprint:</b> the page and the claimant\'s README give its decimal as ' + C.esc(c.stated.decimal) + '…; it is ' + C.esc(c.js.decimal.slice(0, 13)) + '…. The bound column is right. The earlier K = 3,072 certificate holds too: ' + C.m(c0.js.decimal.slice(0, 14) + '…') + ' ≥ ' + C.esc(c0.claim.split('>= ')[1]) + '.' },
        { b: 'C₁d ≤ ' + d.claim.split('<= ')[1] + ' — REFUTED as printed; C₁d ≤ ' + d.repair.claim.split('<= ')[1] + ' CERTIFIED.', raw: 'The signed third autocorrelation constant; the certificate is a 300-cell signed function given in the body of pull request 224 (its digest matches the bytes only with CRLF line endings, as pinned). Its exact ratio is '
          + C.m(d.js.decimal.slice(0, 24) + '…') + ', the stated fraction exactly — and that is <b>above</b> the bound printed in the table and the README, ' + C.esc(d.claim.split('<= ')[1]) + '. An upper bound must round up: the certificate shows ' + C.esc(d.repair.claim.replace('<=', '≤').replace('C_1d', 'C₁d')) + ', not the printed number. What is refuted is that this certificate gives the printed bound; nothing here says the constant is above it.' }
      ])
      + C.pRaw('Red controls, which must come out wrong in both implementations: a C₁c bound 2·10⁻¹⁵ above the exact value and a C₁d bound 10⁻¹⁵ below it are REFUTED; a negative weight and a C₁d function changed to integral zero are REFUSED. Record ' + C.m('certs/autocorr-replay.json') + '; re-derive with ' + C.m('node tools/replay-autocorr.js') + ' (both, about two minutes) or ' + C.m('--check') + '.')
  }));
}
/* §8 (2026-10-19): the registry's C_86 certificate, replayed (certs/c86-replay.json, tools/replay-c86.js) — appended after §7 */
{
  const CR = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'c86-replay.json'), 'utf8'));
  if (CR.deciders.js !== shaOf('tools/replay-c86.js') || CR.deciders.py !== shaOf('instruments/optq/c86.py')) die('certs/c86-replay.json was written by other deciders — re-run tools/replay-c86.js');
  if (CR.verdict !== 'CERTIFIED' || !CR.agree || CR.js.verdict !== 'CERTIFIED' || CR.py.verdict !== 'CERTIFIED' || !CR.redControls.every((r) => r.fired) || !CR.bound.lePrinted) die('the C_86 replay is not what §8 says — rewrite it');
  const e5j = CR.js.E5, e5p = CR.py.E5, e4 = CR.js.E4.rows, e3 = CR.js.E3;
  const minE4 = Math.min(...e4.map((r) => r.integral[0]));
  B.push(C.section({
    lab: '§8 · C₈₆', title: 'A measure, eleven polynomials, six conditions: the trace-constant certificate replayed', id: 'c86',
    bodyRaw: C.pRaw('<b>Decided 2026-10-19.</b> The registry\'s newest asterisk: ' + C.m('C₈₆ ≤ ' + CR.claim.split('<= ')[1]) + ' (R. Pinho, pull request 227, merged 2026-10-18), the Schur–Siegel–Smyth trace constant, '
      + 'from a 629-cell step measure on [1/20, 1037/200] and eleven integer polynomials with rational weights — the construction of Talebizadeh Sardari–Orloski with seven more polynomials. '
      + 'The claimant states six finite conditions, the hypotheses of Smith\'s sufficiency criterion [Smi24] and the arithmetic of the bound; the published chain (the minimum principle, Smith\'s theorem) turns them into the bound. '
      + 'The six are decided here from the pinned bytes by two implementations that share no code with each other or with the claimant\'s checker (kept as text, never run): '
      + C.m('instruments/optq/c86.py') + ' (Python: Fraction, and its own float-series logarithm rounded outward) and ' + C.m('tools/replay-c86.js') + ' (JavaScript: eqcert\'s BigInt rationals and interval library). <b>CERTIFIED in both.</b>')
      + C.plainList([
        { b: 'Exact (E1, E2, E3, E6).', raw: 'Densities non-negative, edges increasing, the support inside [1/20, 1037/200]; each polynomial primitive, irreducible over ℤ (no integer root, no monic integer quadratic factor within the Mignotte bound — enough for degree ≤ 5) and totally real (a Sturm count equal to the degree); '
          + 'Σ b<sub>Q</sub> deg Q = ' + C.esc(e3.ratio.toFixed(5)) + ' m &lt; m; and ∫x dμ / m = ' + C.m(CR.bound.exact) + ' = ' + C.m(CR.bound.decimal.slice(0, 20) + '…') + ', the certificate\'s own fraction, below the printed ' + C.esc(CR.claim.split('<= ')[1]) + '.' },
        { b: 'Enclosed (E4).', raw: '∫ log|Q| dμ for each of the eleven Q as a closed form in g(u) = u ln|u| − u at the edges, the roots enclosed to 2<sup>−80</sup> by Sturm bisection: every integral is positive, the smallest lower end ' + C.esc(minE4.toExponential(3)) + ' (the claimant reports ≈ 10⁻⁴ each).' },
        { b: 'Enclosed (E5).', raw: 'f = U<sub>μ</sub> − Σ b<sub>Q</sub> log|Q| ≥ 0 on every cell of the support, by adaptive bisection: on each box the two cell-edge terms (an infinite slope at the edge) and any −b ln|Q| with Q vanishing on the box are bounded by their exact monotone ranges, the smooth rest by a second-order Taylor form at the midpoint. '
          + 'Proved on ' + e5j.provedBoxes.toLocaleString('en-US') + ' boxes (JavaScript) and ' + e5p.proved_boxes.toLocaleString('en-US') + ' (Python), depth ≤ ' + e5j.maxDepth + ', the smallest certified lower bound ' + C.esc(e5j.minCertifiedLowerBound.toExponential(3)) + ' and ' + C.esc(e5p.min_certified_lower_bound.toExponential(3)) + ' (the claimant\'s arb bisection: 6,218 subintervals, 7.4 × 10⁻⁸).' },
        { b: 'Not decided.', raw: 'The extension of E5 from the support to ℂ (the minimum principle), the resultant argument that makes μ/m arithmetic, and Smith\'s theorem itself [Smi24] — published mathematics, read and cited by the claimant and here. The replay is of the certificate\'s finite conditions, which is what the asterisk is about.' }
      ])
      + C.pRaw('Red controls, which must come out wrong in both implementations: densities scaled by 0.98 (f dips below zero: REFUTED by a box with f &lt; 0), weights scaled by 1.3 (E3), extra mass in the first cell of the support (E4 and E6), the bound lowered by 10⁻¹² (E6), x² − 3x + 1 replaced by (x − 1)(x − 2) and by x² + 1 (E2). '
        + 'Pins: the certificate at commit ' + C.esc(CR.certificateCommit.slice(0, 7)) + ' (sha256 ' + C.esc(CR.sha256.slice(0, 12)) + '…), the registry\'s 86a page and README at ' + C.esc(CR.registryCommit.slice(0, 8)) + '. Record ' + C.m('certs/c86-replay.json') + '; re-derive with ' + C.m('node tools/replay-c86.js') + ' (both, about ten minutes) or ' + C.m('--check') + ' (the JavaScript decider and the red controls, about two minutes).')
  }));
}
const foot = '<p>' + C.esc('Generated by tools/build-report-optq.js from certs/optq-ledger.json (' + L.generated + ', ' + L.seconds + ' s), re-derived at build; battery ' + bm[1] + ' checks, ' + bm[3] + ' red controls; @ git ' + git + '.') + '</p>';
fs.writeFileSync(path.join(ROOT, 'reports', 'optconst-queue.html'), TPL.render({
  title: 'Five pull requests to the constants registry, decided where decidable · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot,
  desc: 'The open PR queue of Tao\'s optimization-constants registry: two exact step functions, a two-law entropy certificate, five one-line bounds, OpenAI\'s Borsuk counterexample and a de Bruijn–Newman "certified record package" — decided where a finite object exists, refused where the evidence is not in the submission.',
  path: '/reports/optconst-queue.html'
}));
console.log('reports/optconst-queue.html written: ' + rows.length + ' rows, ' + L.counts.CERTIFIED + ' certified, ' + L.counts.REFUSED + ' refused @ git ' + git);
