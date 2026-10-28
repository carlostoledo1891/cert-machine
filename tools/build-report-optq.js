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
/* WARRANT v2.1 (design/WARRANT.md), 2026-10-28: what each number stands on. A number typed on this page is decided by
   exact arithmetic unless it is marked: a claimant's printed digits, a timing and a reading are COMPUTED (a reading is a
   claim, not a decision), a refusal is ∅. A printed enclosure rounds outward (design/outward.js), never cut. */
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
const D = require(path.join(ROOT, 'design', 'outward.js'));
const READ = 'read, not machine-checked: a reading is a claim, not an exact decision';
const CLAIMANT = 'printed by the claimant or the registry; not decided here';
const TIMED = 'a wall-clock time: measured, not decided';
const read = (t) => W.value(t, W.COMPUTED, { title: READ });
const theirs = (t) => W.value(t, W.COMPUTED, { title: CLAIMANT });
const timed = (t) => W.value(t, W.COMPUTED, { title: TIMED });
/* the premise ladder's glosses in this page's words: a mathematical premise here is a theorem cited or a proof read, so the
   bottom rung says so (the four words and the ladder stay the grammar's, playground/warrant.js) */
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
const tag = (v) => C.tag(v, v === 'CERTIFIED' ? 'held' : v === 'REFUTED' ? 'fail' : 'dep');
const inv = r210.inventory;
/* THE TYPED NUMBERS (WARRANT rule 8, 2026-10-28). Each number the prose below types by hand is read here from the row
   that carries it, and the page refuses when the row stops saying it. */
{
  const typed = [
    [r1a.claim, /^C_1a <= 1\.5027435 \(.*65,536-step/], [r1b.claim, /^C_1b <= 0\.38085856 \(.*114,688-step/],
    [r3c.claim, /^C_3c >= 1\.674894211307116 from two laws on 51 and 47 points .* 39041372760532870645 : 60958627239467129355 of 10\^20 base-55 digits/],
    [r20a.claim, /^C_20a >= 8:/], [r20c.claim, /^C_20c >= sqrt\(3\):/], [r23b.claim, /^C_23b <= 1\/2:/], [r217.claim, /^C_28a <= 9:/],
    [r16a.values.claim, /^C_16a >= 2\.156224$/], [r70a.values.claim, /^C_70a >= 1\.201927$/], [r16a.claim, /c_k = 1\/\(\|k\|²\(\|k\|² \+ 41\/5\)\)/],
    [r210.claim, /^Λ <= 319\/2000 = 0\.1595 /], [r210.claim, /690,988-term Dir/],
    [r1a.registryBefore, /^1\.502862 \(upper\)$/], [r1b.registryBefore, /^0\.380868 \(upper\)$/], [r3c.registryBefore, /^1\.6747338950414058\* /],
    [r16a.registryBefore, /≈ 1\.82283 \(lower\)$/], [r20a.registryBefore, /^2 \(lower\)$/], [r20c.registryBefore, /^sqrt\(pi\/2\)/], [r70a.registryBefore, /^1 \(lower\)$/],
    [r16a.values.torus, /the registry's 2\.15627 row is BDZ's/], [r16a.claimantPrinted, /^2\.1562247…/],
  ];
  for (const [s, re] of typed) if (!re.test(String(s))) die('a number the prose types is no longer in its record: ' + re + ' against "' + String(s).slice(0, 90) + '"');
  if (r1a.n !== 65536 || r1b.n !== 114688 || String(r3c.laws) !== '51,47' || r70a.values.n !== 300000 || r70a.values['a/r'] !== '13/1000'
    || r16a.values.K !== 4000 || r16a.values.mu !== '41/5' || r16a.values.latticePoints !== r16a.values.latticePointsByGauss || r16a.values.scaleBits !== 200)
    die('a count or parameter the prose types moved in its row');
  if (39041372760532870645n + 60958627239467129355n !== 10n ** 20n) die('the two digit counts no longer make 10^20');
}
/* the claimant's convergence figures for 16a (PROOFS.md, pinned) against the same sums at each cutoff, computed here at
   build in double precision: a float check of printed digits, drawn COMPUTED, never an enclosure (the 4000 row is the
   ledger's enclosure). Before 2026-10-28 the page typed its "2.151390" with no record behind it. */
const cutoff16a = (() => {
  const proofs = fs.readFileSync(path.join(ROOT, 'corpus', 'optconst-queue', 'sources', 'vidigoat-39fb848', 'PROOFS.md'), 'utf8');
  if (!/\(cutoff 50: 2\.15174; 200: 2\.15592;\s+800: 2\.15621; 4000: 2\.156225\)/.test(proofs)) die('the claimant\'s cutoff figures in PROOFS.md moved');
  const F = (K) => {   /* L(u) for the truncated extremal, c = 1/(n(n + 41/5)), Kahan-summed over the lattice points */
    let s0 = 0, s1 = 0, s2 = 0, c0 = 0, c1 = 0, c2 = 0, pts = 0;
    const add = (s, c, v) => { const y = v - c, t = s + y; return [t, (t - s) - y]; };
    for (let a = -K; a <= K; a++) for (let b = -K; b <= K; b++) {
      const n = a * a + b * b; if (!n || n > K * K) continue; pts++;
      const ck = 1 / (n * (n + 41 / 5));
      [s0, c0] = add(s0, c0, ck); [s1, c1] = add(s1, c1, n * ck * ck); [s2, c2] = add(s2, c2, n * n * ck * ck);
    }
    const d = s2 / s1; return { v: s0 * s0 / (Math.PI * s1) - Math.log(d) - Math.log(1 + Math.log(d)), pts };
  };
  const f50 = F(50), f200 = F(200), f800 = F(800);
  if (f50.v.toFixed(6) !== '2.151390' || !(Math.abs(f50.v - 2.15174) > 1e-4) || f200.v.toFixed(5) !== '2.15592' || f800.v.toFixed(5) !== '2.15621'
    || D.up(r16a.values.enclosure[1], 6) !== '2.156225')
    die('the cutoff sentence of 16a no longer holds: 50 → ' + f50.v + ', 200 → ' + f200.v + ', 800 → ' + f800.v);
  return { v50: f50.v.toFixed(6), pts50: f50.pts };
})();

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
    + ' steps), equal to the claimants\' printed fractions digit for digit, below the registry\'s ' + C.esc(r1a.registryBefore.split(' ')[0]) + ' and ' + C.esc(r1b.registryBefore.split(' ')[0]) + '; C₃c ≥ ' + C.esc(r3c.claim.split(' ')[2]) + ' from the two-law certificate, ρ enclosed in ' + D.enc(r3c.rho[0], 20) + ' at ' + r3c.precisionBits + ' bits (the registry holds ' + D.down(r3c.registryBefore.split('*')[0], 8) + '*); '
    + 'C₂₀a ≥ 8 and C₂₀c ≥ √3 by exact moments; C₂₈a ≤ 9 by the Lean development this repository rebuilt and kernel-checked on 10-10. <b>Read and holding:</b> ' + read('C₂₃b ≤ ½') + ', five sentences of standard inequalities. <b>Refused:</b> Λ ≤ 0.1595 — '
    + 'the package\'s scorer and checkers (' + inv.scripts.length + ' scripts; the two mathematical ones on python-flint and mpmath) evaluate auxiliary inequalities on ' + inv.frozenFiles + ' frozen coefficient tables and compare rationals, hashes and box covers; ' + read('nothing in them evaluates ζ, H_t or the Dirichlet polynomial') + ', and the derivations of the frozen numbers cite banks '
    + C.esc(inv.bankCitations.join(', ')) + ' that are not in the bundle. The anchor Λ ≤ 3/16 is the claimant\'s own earlier merged row. <b>Decided 2026-10-16, holding:</b> C₁₆a ≥ 2.156224 — the truncated BDZ2013 extremal\'s bound enclosed in ' + D.enc(r16a.values.enclosure, 12) + ' (width ' + C.esc(r16a.values.width) + '); '
    + 'C₇₀a ≥ 1.201927 — the cube-and-ball Steiner sum at n = 300,000 enclosed in ' + D.enc(r70a.values.enclosure, 12) + '; both in the standard library, ' + read('their derivations read') + '.',
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
/* what the registry did next, 2026-10-26, read from the third snapshot (registry-2026-10-26): the rule changed and three replays merged */
{
  const RG3 = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'optconst-queue', 'registry-2026-10-26', 'record.json'), 'utf8')).facts;
  const M = RG3.merged, O = RG3.open;
  if (!(RG3.rule.secondParty && RG3.rule.routes.length === 4 && M[232].merged && M[243].merged && M[257].merged && RG3.marksRemovedOnReplays === 6 && RG3.sumProduct.asterisked
    && O[242].state === 'open' && O[249].state === 'open' && O[275].state === 'open' && RG3.stillAsterisked['31'] && RG3.stillAsterisked['82'] && RG3.stillAsterisked['86']))
    die('the third registry snapshot no longer says what the second afterwards note says — rewrite it');
  const hm = (iso) => iso.slice(11, 16) + ' UTC';
  B.push('<div class="col">' + C.note({ lab: 'afterwards · ' + M[232].mergedAt.slice(0, 10), bodyRaw: C.pRaw('The maintainer changed the rule, then merged three more. CONTRIBUTING now says that <b>removing an asterisk takes a second party</b>: a refereed paper, a registration with a service that checks the proof mechanically, a maintainer\'s sign-off, or someone independent confirming the replay on the thread — a replay by the requester alone is not enough, however documented. '
    + 'Minutes after stating it he merged <a href="https://github.com/teorth/optimizationproblems/pull/232">#232</a> (the four C₁a and C₁b rows of §2, ' + hm(M[232].mergedAt) + ', commit ' + C.esc(M[232].mergeCommit.slice(0, 8)) + ') and <a href="https://github.com/teorth/optimizationproblems/pull/243">#243</a> (C₁c and C₁d of §7, ' + hm(M[243].mergedAt) + '): six asterisks removed, the pages citing the replays as [T2026b] and [T2026], the C₁d bound printed rounded up'
    + (RG3.duplicate1dRow ? ' — the 1d page keeps the row as first printed beside the corrected one' : '') + '. <a href="https://github.com/teorth/optimizationproblems/pull/257">#257</a> (' + hm(M[257].mergedAt) + ') corrected C₈₄b to the note\'s theorem, ' + C.m('1.9993*') + ', still asterisked; its ceiling digit is <a href="https://github.com/teorth/optimizationproblems/pull/275">#275</a>, open. '
    + '<a href="https://github.com/teorth/optimizationproblems/pull/242">#242</a> (C₈₂ and C₈₆, §8 and §9) and <a href="https://github.com/teorth/optimizationproblems/pull/249">#249</a> (C₃₁) stay open under the new rule, waiting for a second party; their rows keep the asterisk. '
    + 'The registry\'s bytes after this round are pinned in ' + C.m('corpus/optconst-queue/registry-2026-10-26/') + '.') }) + '</div>');
}
B.push(C.stats([
  { k: 'decided', v: String(L.counts.CERTIFIED), n: L.counts.REFUTED + ' refuted · ' + L.counts.REFUSED + ' refused (evidence not submitted). 16a and 70a joined the decided on 10-16.' },
  /* an upper bound printed short rounds UP (it read "1.50274348" until 2026-10-28, below the value it bounds) */
  { k: 'C₁a ≤', v: D.up(r1a.valueDecimal, 8), n: 'From the registry\'s ' + r1a.registryBefore.split(' ')[0] + '; a ' + r1a.n.toLocaleString('en-US') + '-step function, exact.' },
  { k: 'C₃c ≥', v: D.down(r3c.claim.split(' ')[2], 6), n: 'From ' + D.down(r3c.registryBefore.split('*')[0], 8) + '*; two laws, 10²⁰ digits, the entropies add because the digit map is injective.' },
  { k: 'Λ ≤ 0.1595', vRaw: W.value('refused', W.REFUSED, { title: 'refused: the evidence is not in the submission' }), n: 'The scorer decides assembly, not analysis; the analysis cites a private bank.' }
]));
/* the marks, said once (WARRANT rule 9): this page's numbers are decided unless marked */
B.push('<div class="col">' + C.note({ lab: 'how to read the marks', bodyRaw: C.pRaw('Every number on this page is decided by exact arithmetic unless it is marked. '
  + 'Underlined dashed: nothing here decided it — a claimant\'s or the registry\'s printed digits, a timing, a float check, or a reading (a proof read, not machine-checked, is a claim and not a verdict). '
  + '∅: refused. A verdict that holds given a theorem read or cited names it in italic; where a bound rests on analysis read rather than computed, the steps are listed with how far each was checked (§11).')
  + W.legendHtml({ exclude: [W.CHOSEN], compact: true }) }) + '</div>');
B.push(C.section({
  lab: '§1 · the queue', title: 'Each claim, its object, its verdict', wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'PR' }, { h: 'constant' }, { h: 'claim' }, { h: 'decided by' }, { h: 'verdict' }],
    /* the record's scope word COMPUTED (16a, 70a) means "enclosed here, not only read"; on a page that draws WARRANT it would
       read as the grammar's COMPUTED (float, nothing decided it), so it is said in the page's words. A row resting on a
       reading carries the reading's mark beside its verdict: a reading is not a verdict (2026-10-28). */
    rows: rows.map((r) => {
      const how = r.scope ? r.scope.split(':')[0] : '', readRow = /^BY READING/.test(how), partRead = how === 'COMPUTED';
      return [{ raw: '#' + r.pr }, { raw: C.esc(r.constant) }, { raw: C.esc(r.claim.length > 170 ? r.claim.slice(0, 167) + '…' : r.claim) },
        { raw: C.esc((how ? (partRead ? 'ENCLOSED, the derivation READ' : how) + ' — ' : '') + r.how.slice(0, 160) + (r.how.length > 160 ? '…' : '')) },
        { raw: tag(r.verdict) + (readRow ? ' ' + read('by reading') : partRead ? ' ' + read('given a reading') : '') }];
    })
  })
}));
/* the replay of the four C_1a/C_1b rows for the registry (certs/stepfun-replay.json, tools/replay-stepfun.js): written
   only while the record is of the code on disk, both implementations agree and every red control fired */
const SR = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'stepfun-replay.json'), 'utf8'));
const shaOf = (rel) => require('crypto').createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');
if (SR.deciders.js !== shaOf('tools/replay-stepfun.js') || SR.deciders.jsModule !== shaOf('instruments/optq/stepfun-exact.js') || SR.deciders.py !== shaOf('instruments/optq/stepfun.py')) die('certs/stepfun-replay.json was written by other deciders — re-run tools/replay-stepfun.js');
if (!SR.rows.every((r) => r.agree && r.verdict === 'CERTIFIED') || !SR.redControls.every((r) => r.fired)) die('the step-function replay is not four agreeing CERTIFIED rows with every red control fired');
const sup = (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d], sci = (x) => { const [m, e] = x.toExponential(2).split('e'); return m + ' × 10' + (e[0] === '-' ? '⁻' : '') + e.replace(/^[-+]/, '').split('').map(sup).join(''); };
/* the margin below the claim, from the exact slack and rounded DOWN (a margin printed larger than it is overstates the
   bound's room; it read 1.33 × 10⁻⁸ for 1.3290… until 2026-10-28) */
const slack1a = (() => { const [p, q] = String(r1a.slack).split('/').map(BigInt), k = 40n, i = (p * 10n ** k) / q;
  return D.sci('0.' + i.toString().padStart(Number(k), '0'), 2, false); })();
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
    + 'computed here as one exact integer product (the heights packed into a big integer, multiplied, unpacked) and maximised over every shift: ' + C.esc(r1a.value.length > 90 ? r1a.valueDecimal : r1a.value) + ' = ' + C.esc(r1a.valueDecimal) + '…, the claimant\'s own fraction to the last digit, below ' + C.esc(r1a.claim.split(' ')[2]) + ' by ' + slack1a + '. '
    + 'C₁b likewise: h on ' + r1b.n.toLocaleString('en-US') + ' steps with Σh = n/2 exactly and 0 ≤ h ≤ 1, correlated with 1 − h: ' + C.esc(r1b.valueDecimal) + '…, below ' + C.esc(r1b.claim.split(' ')[2]) + '. The registry\'s entries were ' + C.esc(r1a.registryBefore.split(' ')[0]) + ' and ' + C.esc(r1b.registryBefore.split(' ')[0]) + '.')
    + replayRaw
}));
B.push(C.section({
  lab: '§3 · the entropy certificate', title: '#221: two laws, one bound',
  bodyRaw: C.pRaw('A single law μ on Z² gives C₃c ≥ H(X−Y)/max(H(X), H(Y), H(X+Y), H(X+2Y)); this certificate mixes two laws across the digits of a base-55 expansion, 39041372760532870645 digits from a 51-point law and 60958627239467129355 from a 47-point law. The entropies add digit by digit only if the map from digit values to L(X,Y) is injective, '
    + 'which holds when every |L(x,y)| on both supports is at most (55−1)/2 = 27 — checked: the maximum is ' + r3c.maxAbsForm + '. Each per-law entropy is an interval with directed rounding at ' + r3c.precisionBits + ' bits (no code of the claimant\'s; the single-law instrument that decided C₃b and C₃c in September, with the mixture by rational weights on top); '
    + 'ρ ∈ [' + C.esc(r3c.rho[0][0]) + ', ' + C.esc(r3c.rho[0][1]) + '], above ' + C.esc(r3c.claim.split(' ')[2]) + '. ' + 'The claimant\'s flint and PARI checkers print ' + theirs('the same 16 digits') + '.'
    + (r3c.rhoPython ? ' A second implementation, ' + C.m('tools/verify_twolaw.py') + ' — the Python standard library alone, decimal at 120 digits, sharing no code with the first — decides it again: ρ ∈ ' + D.enc(r3c.rhoPython, 32) + ', and its three red controls fire (the smallest 30-digit claim above ρ is REFUTED; base 53, where (53−1)/2 &lt; 27, is REFUSED for injectivity; a weight one unit off is REFUSED).' : ''))
}));
B.push(C.section({
  lab: '§4 · one-line bounds', title: '#226 and #217: what a sentence can certify',
  bodyRaw: C.plainList([
    { b: 'C₂₀a ≥ 8 (CERTIFIED).', text: 'X = E − 1 with E standard exponential: E[Eᵏ] = k!, so E[(E−1)⁴] = 9, E[(E−1)²] = 1, mean 0, and Var(X²) = 8; independent copies add variances, giving Var(|X|²) = 8n in every dimension against the registry\'s bound C n. The density e^{−t} is log-linear, hence log-concave. The registry held 2.' },
    { b: 'C₂₀c ≥ √3 (CERTIFIED).', text: 'The uniform law on [−√3, √3] has variance 1 and is log-concave; the half-line A = (−∞, 0] has μ(A) = ½ and boundary measure 1/(2√3), so its inverse Cheeger ratio is √3 — computed in Q(√3) through squares (1/3 and 3). The registry held √(π/2).' },
    { b: 'C₂₃b ≤ ½', raw: '<b>(CERTIFIED ' + read('by reading') + ').</b> ' + C.esc(r23b.scope.replace(/^BY READING, not computed: /, '')) },
    { b: 'C₂₈a ≤ 9 (CERTIFIED, by the earlier record).', raw: C.esc('OpenAI\'s BorsukNine is the Lean development this repository rebuilt and checked under two kernels on 2026-10-10 (certs/openai-math-kernel.json; ') + read('the statement read MATCHES against the paper\'s claim') + C.esc('). The PR adds nothing to decide and its wording agrees with the theorem.') },
    { b: 'C₁₆a ≥ ' + r16a.values.claim.split('>= ')[1], raw: '<b>(CERTIFIED 2026-10-16, <i>given the Parseval normalisation, read</i>; refused as not attempted the day before).</b> '
      + C.esc('The registry\'s L is max over δ ≥ 1 of 4πΘ(δ) − ln δ − ln(1 + ln δ), with Θ(δ) the largest |u(0)|² over zero-mean u on the torus with ‖∇u‖² = 1 and ‖Δu‖² = δ; the torus is 2π × 2π, fixed by BDZ2013 (2.4) and (3.14), whose numerical ') + theirs('2.15627') + C.esc(' is the registry\'s own row. ')
      + C.esc('The PR\'s u is the truncated BDZ conditional extremal, c_k = 1/(|k|²(|k|² + 41/5)) over 0 < |k|² ≤ ' + r16a.values.K + '², a real zero-mean trigonometric polynomial, so Parseval gives ‖∇u‖² = 4π² S₁, ‖Δu‖² = 4π² S₂, u(0) = S₀, and after normalising, L ≥ S₀²/(π S₁) − ln δ − ln(1 + ln δ) with δ = S₂/S₁ — provided δ ≥ 1. ')
      + C.esc('Every sum is finite (no tail). Computed here with no code of the claimant\'s: r₂(n) from a sieve over the octant (' + r16a.values.latticePoints.toLocaleString('en-US') + ' points, equal to Gauss\'s circle count), each term\'s floor and ceiling at scale 2²⁰⁰, π by Machin in integers, the logarithms from the decimal module\'s correctly rounded ln widened one unit each way. ')
      + 'δ ∈ ' + D.enc(r16a.values.delta, 10) + ' ≥ 1; the bound ∈ ' + D.enc(r16a.values.enclosure, 20) + ', width ' + C.esc(r16a.values.width) + ' — above ' + C.esc(r16a.values.claim.split('>= ')[1]) + ' (the claimant prints ' + theirs(C.esc(r16a.claimantPrinted.split(' ')[0])) + '). The registry held (β + π)/π ≈ ' + theirs(C.esc(r16a.registryBefore.split('≈ ')[1].split(' ')[0])) + '. '
      + 'One note for the claimant: his cutoff-50 figure (' + theirs('2.15174') + ') is not what μ = 41/5 gives here (' + W.value(cutoff16a.v50, W.COMPUTED, { title: 'the same three sums over the ' + cutoff16a.pts50.toLocaleString('en-US') + ' lattice points of |k|² ≤ 50², computed here at build in double precision: a float check of his printed digits, not an enclosure' }) + '); his 200, 800 and 4000 figures agree.' },
    { b: 'C₇₀a ≥ ' + r70a.values.claim.split('>= ')[1], raw: '<b>(CERTIFIED 2026-10-16, <i>given the four-step chain below, read</i>; refused as not attempted the day before).</b> '
      + C.esc('The registry\'s C₇₀ is the least C such that every pair of centrally symmetric convex bodies in every dimension has a linear u with |det u| = 1 and |u(B₁) + B₂|^{1/n} ≤ C(|B₁|^{1/n} + |B₂|^{1/n}); a pair that no such u improves below c is a lower bound. ')
      + C.esc('The PR\'s pair is the cube of side a and the ball of radius r. ') + read('Read and holding:') + C.esc(' u(B₁) is a parallelotope of volume aⁿ; Steiner\'s formula writes |u(B₁) + rB| through its intrinsic volumes; for a zonotope V_j is the sum of its j-face parallelotope volumes; Szász\'s inequality on the Gram matrix bounds the product of those volumes below by a^{n·C(n−1, j−1)}; AM–GM over the C(n, j) faces gives V_j ≥ C(n, j) aʲ. ')
      + C.esc('So the cube is already in its worst position and C₇₀ ≥ (Σ_j C(n, j) aʲ κ_{n−j} r^{n−j})^{1/n}/(a + κ_n^{1/n} r). The number at n = ' + r70a.values.n.toLocaleString('en-US') + ', a/r = ' + r70a.values['a/r'] + ' computed here by outward-rounded decimal recurrences (κ_m = κ_{m−2}·2π/m from κ₀ = 1, κ₁ = 2; the binomials and tʲ step by step; the n-th roots through correctly rounded ln and exp): ')
      + D.enc(r70a.values.enclosure, 20) + ', width ' + C.esc(r70a.values.width) + ' — above ' + C.esc(r70a.values.claim.split('>= ')[1]) + '. At n = 2 the same code equals the closed form √(t² + 4t + π)/(t + √π). The registry held the trivial 1.' }
  ])
}));
B.push(C.section({
  lab: '§5 · the package', title: '#210: what a "certified record package" certifies',
  bodyRaw: C.pRaw('Mosaic Intelligence\'s submission is ' + inv.files + ' files. Its scorer (verify/record_score.py) runs the assembly\'s verify.py and checks ' + inv.scorerGates.length + ' gates — ' + C.esc(inv.scorerGates.join(', ')) + ' — printing "TOTAL CHECKS RUN: ' + theirs(C.esc(inv.totalChecksRunPrinted || '?')) + '" (its own count; the scorer was never run here). '
    + 'The two mathematical checkers (python-flint arb; mpmath.iv) evaluate auxiliary quantities on frozen coefficient tables — walls, clocks, norms, debits, Taylor leaves — and compare rationals, hashes and box covers. ' + read('No function in the ' + inv.scripts.length + ' scripts evaluates ζ, H_t or the 690,988-term Dirichlet polynomial') + '; the torus floor, the separator at X and the Polymath15 error constants enter as ' + inv.frozenFiles
    + ' frozen outputs whose proofs cite banks ' + C.esc(inv.bankCitations.join(', ')) + ' — an internal memory that is not in the bundle. The anchor Λ ≤ 3/16 is the claimant\'s own 2026-07 row, merged into the registry without review. So the package certifies that its parts fit together as declared; whether the parts are true is not in the submission, and this page refuses rather than guesses. '
    + 'The route itself (collision exclusion with an exterior polydisc floor carried by a "circular heat" lemma) is ' + read('coherent on reading') + '; the first independent check to run would be the torus-floor inequality on T⁴ by an interval cover, then the separator at x = X for t ∈ [0, 3/16] including y = 0, then the error constants from Polymath15 Theorem 1.3 — each hours to days.')
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
  if (!/K = 6144$/.test(c.producer) || !/K = 3072$/.test(c0.producer) || d.n !== 300) die('a count §7 types (K = 6,144; K = 3,072; 300 cells) moved in certs/autocorr-replay.json');
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
  /* a LOWER end prints rounded down: toExponential(3) printed this one as 1.000e-4, above the 9.9999995e-5 it is (2026-10-28) */
  if (e4.length !== 11 || e5j.cells !== 629 || !/^\d+\/\d+$/.test(e3.sumBDeg) || !/^\d+\/\d+$/.test(e3.mass)) die('a count §8 types (eleven polynomials, 629 cells) or the E3 fractions moved');
  { const rd = fs.readFileSync(path.join(ROOT, 'corpus', 'optconst-queue', 'c86-2026-10-19', 'rpinho', 'README.md'), 'utf8');
    if (!/6,218 subintervals, worst certified lower bound 7\.4e-8/.test(rd) || !/all ≈ \+1\.0e-4/.test(rd)) die('the claimant\'s printed E4/E5 figures moved in the pinned README'); }
  B.push(C.section({
    lab: '§8 · C₈₆', title: 'A measure, eleven polynomials, six conditions: the trace-constant certificate replayed', id: 'c86',
    bodyRaw: C.pRaw('<b>Decided 2026-10-19.</b> The registry\'s newest asterisk: ' + C.m('C₈₆ ≤ ' + CR.claim.split('<= ')[1]) + ' (R. Pinho, pull request 227, merged 2026-10-18), the Schur–Siegel–Smyth trace constant, '
      + 'from a 629-cell step measure on [1/20, 1037/200] and eleven integer polynomials with rational weights — the construction of Talebizadeh Sardari–Orloski with seven more polynomials. '
      + 'The claimant states six finite conditions, the hypotheses of Smith\'s sufficiency criterion [Smi24] and the arithmetic of the bound; <i>given the published chain (the minimum principle, Smith\'s theorem), read and cited</i>, they give the bound. '
      + 'The six are decided here from the pinned bytes by two implementations that share no code with each other or with the claimant\'s checker (kept as text, never run): '
      + C.m('instruments/optq/c86.py') + ' (Python: Fraction, and its own float-series logarithm rounded outward) and ' + C.m('tools/replay-c86.js') + ' (JavaScript: eqcert\'s BigInt rationals and interval library). <b>CERTIFIED in both.</b>')
      + C.plainList([
        { b: 'Exact (E1, E2, E3, E6).', raw: 'Densities non-negative, edges increasing, the support inside [1/20, 1037/200]; each polynomial primitive, irreducible over ℤ (no integer root, no monic integer quadratic factor within the Mignotte bound — enough for degree ≤ 5) and totally real (a Sturm count equal to the degree); '
          + 'Σ b<sub>Q</sub> deg Q = ' + C.m(e3.sumBDeg) + ' &lt; m = ' + C.m(e3.mass) + '; and ∫x dμ / m = ' + C.m(CR.bound.exact) + ' = ' + C.m(CR.bound.decimal.slice(0, 20) + '…') + ', the certificate\'s own fraction, below the printed ' + C.esc(CR.claim.split('<= ')[1]) + '.' },
        { b: 'Enclosed (E4).', raw: '∫ log|Q| dμ for each of the eleven Q as a closed form in g(u) = u ln|u| − u at the edges, the roots enclosed to 2<sup>−80</sup> by Sturm bisection: every integral is positive, the smallest lower end ' + D.sci(minE4, 3, false) + ' (the claimant reports ' + theirs('≈ 10⁻⁴ each') + ').' },
        { b: 'Enclosed (E5).', raw: 'f = U<sub>μ</sub> − Σ b<sub>Q</sub> log|Q| ≥ 0 on every cell of the support, by adaptive bisection: on each box the two cell-edge terms (an infinite slope at the edge) and any −b ln|Q| with Q vanishing on the box are bounded by their exact monotone ranges, the smooth rest by a second-order Taylor form at the midpoint. '
          + 'Proved on ' + e5j.provedBoxes.toLocaleString('en-US') + ' boxes (JavaScript) and ' + e5p.proved_boxes.toLocaleString('en-US') + ' (Python), depth ≤ ' + e5j.maxDepth + ', the smallest certified lower bound ' + D.sci(e5j.minCertifiedLowerBound, 3, false) + ' and ' + D.sci(e5p.min_certified_lower_bound, 3, false) + ' (the claimant\'s arb bisection: ' + theirs('6,218 subintervals, 7.4 × 10⁻⁸') + ').' },
        { b: 'Not decided.', raw: 'The extension of E5 from the support to ℂ (the minimum principle), the resultant argument that makes μ/m arithmetic, and Smith\'s theorem itself [Smi24] — published mathematics, read and cited by the claimant and here. The replay is of the certificate\'s finite conditions, which is what the asterisk is about.' }
      ])
      + C.pRaw('Red controls, which must come out wrong in both implementations: densities scaled by 0.98 (f dips below zero: REFUTED by a box with f &lt; 0), weights scaled by 1.3 (E3), extra mass in the first cell of the support (E4 and E6), the bound lowered by 10⁻¹² (E6), x² − 3x + 1 replaced by (x − 1)(x − 2) and by x² + 1 (E2). '
        + 'Pins: the certificate at commit ' + C.esc(CR.certificateCommit.slice(0, 7)) + ' (sha256 ' + C.esc(CR.sha256.slice(0, 12)) + '…), the registry\'s 86a page and README at ' + C.esc(CR.registryCommit.slice(0, 8)) + '. Record ' + C.m('certs/c86-replay.json') + '; re-derive with ' + C.m('node tools/replay-c86.js') + ' (both, about ten minutes) or ' + C.m('--check') + ' (the JavaScript decider and the red controls, about two minutes).')
  }));
}
/* §9 (2026-10-19): the registry's two asterisked C_82 rows, replayed (certs/c82-replay.json, tools/replay-c82.js) */
{
  const CR = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'c82-replay.json'), 'utf8'));
  if (CR.deciders.js !== shaOf('tools/replay-c82.js') || CR.deciders.py !== shaOf('instruments/optq/c82.py')) die('certs/c82-replay.json was written by other deciders — re-run tools/replay-c82.js');
  const row = (id) => CR.rows.find((r) => r.id === id), cs = (id) => CR.cases.find((r) => r.id === id);
  const pin = row('pin26'), epi = row('epi26');
  if (!pin || !epi || [pin, epi].some((r) => r.verdict !== 'CERTIFIED' || !r.agree) || !CR.cases.every((c) => c.agree && c.jsAsExpected && c.pyAsExpected)) die('the C_82 replay is not what §9 says — rewrite it');
  /* thirteen significant digits, OUTWARD: toPrecision(13) rounded both ends to nearest, which printed Pinho's upper ends below
     the computed ones and the Python lower end above its own (2026-10-28) */
  const pc = cs('pin26'), ec = cs('epi26');
  const encl = (r, k) => D.sig(r.B[k][0], 13, false) + ', ' + D.sig(r.B[k][1], 13, true);
  const hiOf = (r) => Math.max(r.B.js[1], r.B.py[1]), gapBelow = (r) => Number(r.claim.split('<= ')[1]) - hiOf(r);
  /* the margins the prose rounds ("about 2 × 10⁻⁷", "about 5.5 × 10⁻⁶") and the claimant's value it quotes, from the record */
  if (Math.round(gapBelow(pin) * 1e7) !== 2 || (gapBelow(epi) * 1e6).toFixed(1) !== '5.5' || !CR.facts.claimantUpperInsideOurs
    || !/README 0\.25344468733/.test(CR.facts.claimantPrintedCertified) || !(0.25344468733 > Math.max(pin.B.js[0], pin.B.py[0]) && 0.25344468734 < Math.min(pin.B.js[1], pin.B.py[1]))
    || pc.js.checks.X1.denominators !== 7 || pc.js.checks.X1.numeratorsActive !== 31)
    die('a margin, a count or the claimant value §9 types moved in certs/c82-replay.json');
  const reds = CR.cases.filter((c) => c.kind === 'red'), ctl = CR.cases.filter((c) => c.kind === 'control');
  B.push(C.section({
    lab: '§9 · C₈₂', title: 'Seven denominators, thirty-one numerators, one integral: the Zhang–Zagier rows replayed', id: 'c82',
    bodyRaw: C.pRaw('<b>Decided 2026-10-19.</b> Two asterisked upper bounds for C₈₂, the essential minimum of the Zhang–Zagier height h(α) + h(1 − α): '
      + C.m('C₈₂ ≤ ' + pin.claim.split('<= ')[1]) + ' (R. Pinho, pull request 229) and ' + C.m('C₈₂ ≤ ' + epi.claim.split('<= ')[1]) + ' (Épi, September 2026). Both are Doche\'s limit-point construction [Doc01b]: integer polynomials R<sub>j</sub> with multiplicities and S<sub>i</sub> with rational exponents give, with T(z) = z(1 − z), '
      + C.m('B = (log M(Q∘T) + ∫₀¹ max(0, log|A∘T| − log|Q∘T|) dt) / deg Q') + ', and C₈₂ ≤ B. '
      + 'B is decided here from the pinned bytes by two implementations that share no code with each other or with the claimants\' checkers (kept as text, never run): ' + C.m('tools/replay-c82.js') + ' (JavaScript: Gaussian integers for the roots, eqcert\'s outward-rounded intervals) and ' + C.m('instruments/optq/c82.py') + ' (Python: integers, and doubles with a priori rounding-error bounds). <b>Both rows CERTIFIED in both</b>, <i>given Doche\'s theorem that B bounds C₈₂, read</i>.')
      + C.plainList([
        { b: 'Exact.', raw: 'Every factor has integer coefficients; every denominator is monic up to sign with a positive integer multiplicity; every exponent is a rational ≥ 0; deg A = Σ q<sub>i</sub> deg S<sub>i</sub> &lt; deg Q (' + C.esc(Number(pc.js.checks.X2.degQ).toLocaleString('en-US')) + ' for the certificate); every numerator is coprime to every denominator (gcd 1 modulo a prime that divides neither leading coefficient).' },
        { b: 'Roots, certified.', raw: 'Each composed factor P∘T (degree up to 84) has its ' + C.esc(pc.js.checks.X4.roots.toLocaleString('en-US')) + ' roots enclosed: approximations refined in Gaussian integers at 2<sup>−192</sup> (JavaScript) or 2<sup>−200</sup> (Python), then Gershgorin\'s theorem on the Weierstrass matrix with the corrections computed exactly — every disk isolated, the radius below ' + D.sci(pc.js.checks.X4.maxRadius, 1, true) + ' after rounding to doubles.' },
        { b: 'The integral.', raw: 'On [0, ½], doubled (the coefficients are real), on dyadic panels: a zeroth-order bound from |u(t) − u(t<sub>c</sub>)| ≤ πw, and where every root is away from the panel a second-order Taylor form with |g″| ≤ 4π² Σ |w<sub>k</sub>| |r<sub>k</sub>| / dist². '
          + C.esc(pc.js.checks.X6.panels.toLocaleString('en-US')) + ' panels for the certificate (JavaScript), ' + C.esc(pc.py.checks.Y6.panels.toLocaleString('en-US')) + ' (Python).' },
        { b: '[Pin26].', raw: 'B ∈ [' + C.esc(encl(pin, 'js')) + '] (JavaScript) and [' + C.esc(encl(pin, 'py')) + '] (Python), below the printed ' + C.esc(pin.claim.split('<= ')[1]) + ' by about 2 × 10⁻⁷. The claimant\'s own certified value ' + theirs('0.25344468733…') + ' lies inside both enclosures.' },
        { b: '[Epi26].', raw: 'B ∈ [' + C.esc(encl(epi, 'js')) + '] and [' + C.esc(encl(epi, 'py')) + ']: the construction gives 0.2535689…, about 5.5 × 10⁻⁶ below the printed ' + C.esc(epi.claim.split('<= ')[1]) + ' — the row is a valid but weaker bound than its own construction, the safe side, as the row\'s comment already notes. The claimant\'s copy of Épi\'s construction is byte-for-byte the same numbers' + (CR.facts.epiTranscribedExactly ? '' : ' (NOT — see the record)') + '.' },
        { b: 'Controls.', raw: ctl.map((c) => C.esc(c.id) + ' ' + C.esc(c.js.verdict) + (c.js.B ? ' (B ≈ ' + C.esc(c.js.B[1].toPrecision(8)) + ' against ' + C.esc(c.bound) + ')' : '')).join('; ') + ' — Doche\'s and Grinsztajn\'s constructions reproduce their published bounds, and the claimant\'s planted failure is refuted.' },
        { b: 'Not decided.', raw: 'Doche\'s theorem — that B bounds C₈₂ — is read, not re-derived; the claimant\'s README proves it directly (U<sup>n</sup> − W<sup>n</sup> over the primes, Jensen\'s formula, coprimality), and its hypotheses are the exact checks above.' }
      ])
      + C.pRaw('Red controls, which must come out wrong in both implementations: ' + reds.map((r) => C.esc(r.what) + ' (' + C.esc(r.js.verdict) + ')').join('; ') + '. '
        + 'Pins: the certificate at commit ' + C.esc(CR.certificateCommit.slice(0, 7)) + ' (sha256 ' + C.esc(pin.sha256.slice(0, 12)) + '…), Épi\'s construction at ' + C.esc(CR.epiCommit.slice(0, 8)) + ' (sha256 ' + C.esc(epi.sha256.slice(0, 12)) + '…, the digest its own result file names), the registry\'s 82a page and README at ' + C.esc(CR.registryCommit.slice(0, 8)) + '. Record ' + C.m('certs/c82-replay.json') + '; re-derive with ' + C.m('node tools/replay-c82.js') + ' (both, minutes) or ' + C.m('--check') + ' (the JavaScript decider, about a minute).')
  }));
}
/* what has come back from outside: re-runs and credits, from design/outside.js (one record, pinned quotes) */
/* §10 (2026-10-27): the registry's C_89b and C_89c graphon certificates, replayed (certs/graphon-replay.json, tools/replay-graphon.js) —
   the first replay of rows a second party's rule now asks someone else to confirm; the claimant is the second party on our C_31 */
{
  const Z = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'graphon-replay.json'), 'utf8'));
  if (Z.deciders.js !== shaOf('instruments/optq/graphon-second.js') || Z.deciders.pyK5 !== shaOf('instruments/optq/graphon_k5.py') || Z.deciders.pyK6 !== shaOf('instruments/optq/graphon_k6.py')) die('certs/graphon-replay.json was written by other deciders — re-run tools/replay-graphon.js');
  const k5 = Z.rows.find((r) => r.id === 'c89b-k5'), k6 = Z.rows.find((r) => r.id === 'c89c-k6');
  if (!(k5.verdict === 'CERTIFIED' && k6.verdict === 'CERTIFIED' && k5.agree && k6.agree && k5.equalsStated && k6.equalsStated && Z.controls.every((c) => c.kind === 'red' ? c.fired : c.held))) die('the graphon replay is not what §10 says — rewrite it');
  const dec = (r, k) => C.m(r.js.decimal.slice(0, k) + '…');
  /* the counts and values §10 types, from the record (2026-10-28) */
  const ppss = Z.controls.find((c) => c.id === 'ppss-published'), half = Z.controls.find((c) => c.id === 'half-graphons');
  if (!(/_m192_D20\./.test(k5.source) && /Z_2\^10/.test(Z.definitions.k6) && ppss && ppss.value.num === '2320651' && ppss.value.den === '1358954496'
    && half && /2·2\^-10 \(K5\) and 2·2\^-15 \(K6\)/.test(half.what) && Z.limits.some((l) => /random-colouring argument, read/.test(l))))
    die('a count or value §10 types (192 blocks, 2²⁰, Z₂¹⁰, 2⁻⁹ and 2⁻¹⁴, the PPSS value) or the reading it names moved in certs/graphon-replay.json');
  B.push(C.section({
    lab: '§10 · C₈₉b and C₈₉c', title: 'Two Ramsey-multiplicity graphons, their densities counted exactly', id: 'graphons',
    bodyRaw: C.pRaw('<b>Decided 2026-10-27.</b> The registry\'s rule since 2026-10-26 asks a second party to confirm a replay before a mark comes off; the contributor who confirmed ours on C₃₁ had filed two certificates of their own, for the Ramsey-multiplicity constants of K₅ (<a href="https://github.com/teorth/optimizationproblems/pull/277">#277</a>) and K₆ (<a href="https://github.com/teorth/optimizationproblems/pull/279">#279</a>), with no second party. '
      + 'Each is a step graphon — 192 blocks of equal measure with red values R<sub>ij</sub>/2²⁰ for K₅; the 1,024 blocks of Z₂¹⁰ with a red value depending only on the Hamming distance for K₆ — and the claim is its monochromatic density t(K,W) + t(K,1−W), an exact rational that bounds the constant from above by the standard random colouring. '
      + 'Both densities are decided here by two implementations that share no code with each other or with the claimant\'s evaluators (kept as text): ' + C.m('instruments/optq/graphon_k5.py') + ' and ' + C.m('graphon_k6.py') + ' (Python Fraction: the K₅ count as a trace on each pair\'s common support; the K₆ count by translation, the row classes of four vectors, binomials for the fifth and the S₄ quotient) and ' + C.m('instruments/optq/graphon-second.js') + ' (JavaScript: the K₅ count modulo ten 25-bit primes lifted by the Chinese remainder theorem; the K₆ reduction derived again in BigInt). <b>CERTIFIED, both</b>, <i>given the standard random-colouring argument that the density bounds the constant, read</i>.')
      + C.plainList([
        { b: 'C₈₉b ≤ ' + C.esc(k5.claim.split('<= ')[1]) + ' — CERTIFIED.', raw: 'The K₅ density is ' + dec(k5, 24) + ', the fraction the page states to the last digit (' + C.esc(k5.js.num.slice(0, 14)) + '…/' + C.esc(k5.js.den.slice(0, 14)) + '…, both implementations); the printed bound is that value rounded ' + C.esc(k5.printedIs.join(' and ')) + ' at ten places. ' + timed(C.esc(k5.js.seconds) + ' s') + ' in JavaScript, ' + timed(C.esc(k5.py.seconds) + ' s') + ' in Python.' },
        { b: 'C₈₉c ≤ ' + C.esc(k6.claim.split('<= ')[1]) + ' — CERTIFIED.', raw: 'The K₆ density × 2¹⁴ is ' + C.m(k6.js.decimal.slice(0, 0) + (() => { const n = BigInt(k6.js.num) * 16384n, d = BigInt(k6.js.den); const ip = n / d; let r = n % d, s = ip.toString() + '.'; for (let i = 0; i < 22; i++) { r *= 10n; s += (r / d).toString(); r %= d; } return s + '…'; })()) + ', the fraction the page states exactly; the printed bound is it rounded ' + C.esc(k6.printedIs.join(' and ')) + ' at ten places. ' + timed(C.esc(k6.js.seconds) + ' s') + ' in JavaScript, ' + timed(C.esc(k6.py.seconds) + ' s') + ' in Python.' }
      ])
      + C.pRaw('Controls: raising one block-pair value by 2⁻²⁰ moves each density in both implementations; a printed bound one unit below the K₅ value at its last place fails; the constant graphon W ≡ ½ gives 2⁻⁹ and 2⁻¹⁴ exactly; and the published 192-vertex graph of Parczyk, Pokutta, Spiegel and Szabó (Zenodo 6602512, pinned) read as a 0/1 graphon gives their published K₅ value 2320651/1358954496. '
        + 'Pins: the certificates at ' + C.esc(Z.certificateCommit.slice(0, 8)) + ' (the K₅ folder byte-identical to the ' + C.esc(Z.c89bCitedCommit.slice(0, 8)) + ' the page cites), the 89b and 89c pages from the pull-request branches (they are not on the registry\'s main branch). Record ' + C.m('certs/graphon-replay.json') + '; the battery re-derives the K₆ value and the five controls at every run and re-combines the K₅ integers.')
  }));
}
/* §11 (2026-10-27): maximusrufus's C_16 enclosure (#246, merged asterisked), replayed as the second party (certs/c16-replay.json,
   tools/replay-c16.js + instruments/optq/c16.py); their checkers read as text, never run */
{
  const Q = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'c16-replay.json'), 'utf8'));
  if (Q.deciders.js !== shaOf('tools/replay-c16.js') || Q.deciders.py !== shaOf('instruments/optq/c16.py')) die('certs/c16-replay.json was written by other deciders — re-run tools/replay-c16.js');
  if (!(Q.word.lower === 'CERTIFIED' && Q.word.upper === 'PARTIAL' && Q.word.row === 'PARTIAL' && Q.agree && Q.redControls.every((r) => r.fired))) die('the C_16 replay is not what §11 says — rewrite it');
  if (!Q.findings.some((f) => /support 2\.1562256458/.test(f)) || !Q.findings.some((f) => /BDZ2013\] lies above the upper end/.test(f)) || !Q.findings.some((f) => /neither checker's VERIFIED is the printed inequality/.test(f))) die('the C_16 findings moved — rewrite §11\'s gaps');
  /* the numbers §11 types, from the record (WARRANT rule 8, 2026-10-28) */
  const LJ = Q.js.lower.LF1, LP = Q.py.lower.LF1, UJ = Q.js.upper, UP = Q.py.upper;
  if (!(LJ.R === 4000 && LJ.mu === '1221/10000' && LJ.latticePoints === 50265328 && LP.latticePoints === 50265328 && /^2\.15622477064423579/.test(LP.enclosure[0])
    && UJ.UF1.boxes === 84 && UJ.UF1.from === '1' && UJ.UF1.to === '490000000' && UJ.UF2.certified === 84 && UP.UF2.certified === 84 && /^2\.05869178083391/.test(UP.UF3.gD0[0])
    && UJ.supported === '2.1562256458' && UJ.endpointMax.box === 31 && (BigInt(Q.printed.upper.replace('.', '')) - BigInt(UJ.supported.replace('.', ''))) === 8n
    && Q.findings.some((f) => /accepts \|L_lo − claimed\| < 1e-9/.test(f)) && Q.findings.some((f) => /slip by 1e-12/.test(f))))
    die('a number §11 types moved in certs/c16-replay.json — rewrite it');
  /* WHAT THE UPPER END RESTS ON (WARRANT v2.1, rule 11): the analytic steps the record lists as READ and used, in the order
     the bound travels through them, each graded from the record; the chain refuses to draw if the record's list moves */
  const C16_STEPS = { UR1: 'The weighted Cauchy–Schwarz bound F ≤ B_μ on each box', UR2: 'The tail of S₁ beyond the partial sum, through Catalan\'s constant', UR4: 'The asymptotic bound g beyond the last box' };
  const usedReads = Object.keys(Q.readings).filter((k) => /^UR/.test(k) && Q.readings[k].used === 'yes');
  if (usedReads.join(',') !== Object.keys(C16_STEPS).join(',')) die('the C_16 record\'s analytic steps moved (' + usedReads.join(', ') + ') — rewrite the premise chain');
  const c16chain = W.premisesHtml(usedReads.map((k) => ({ grade: W.ASSUMED, label: C.esc(C16_STEPS[k]),
    evidence: C.esc(Q.readings[k].reason.replace(/\.$/, '')) + '; no machine checked it (' + C.m('claims.json') + ', ' + k + ')' })),
  { meetLine: 'The finite core under them is exact, in two implementations; the weakest premise is <b>assumed</b>: on this ladder a proof read and re-derived by hand is where the checking stopped, since no machine checked it. That is why this end is PARTIAL, and why the lower end, which crosses none of these steps, is CERTIFIED.' });
  B.push(C.section({
    lab: '§11 · C₁₆', title: 'An enclosure from ' + UJ.UF1.boxes + ' boxes: the lower end certified, the upper end\'s finite core certified', id: 'c16',
    bodyRaw: C.pRaw('<b>Decided 2026-10-27, as the second party.</b> maximusrufus, who re-ran three of our records, filed the enclosure ' + C.m(Q.printed.lower + ' ≤ C₁₆ ≤ ' + Q.printed.upper) + ' (<a href="https://github.com/teorth/optimizationproblems/pull/246">#246</a>, merged asterisked on 2026-10-26): a lower certificate from one trial polynomial, and an upper certificate of ' + UJ.UF1.boxes + ' boxes in δ with a tail bound, a convexity argument and numpy checkers. Under the registry\'s rule a mark comes off only on a second party\'s confirmation; nothing of theirs had been re-decided by anyone.')
      + C.pRaw('<b>Gaps, at the pin.</b>')
      + C.plainList([
        { b: 'The checkers test a tolerance, not the printed inequality.', raw: 'The lower checker accepts |L − claimed| &lt; 10⁻⁹ and the upper accepts U ≤ claimed + 10⁻⁹; neither prints VERIFIED for the inequality against the printed digits. Both inequalities are decided here against the digits directly.' },
        { b: 'The certifiers are not in the repository.', raw: 'The checkers name ' + C.m('certify_c16_upper.py') + ' and ' + C.m('certify_c16_lower.py') + '; neither is published. The asymptotic bound g they use was ' + read('re-derived here by hand') + ' and agrees with the checker\'s formula.' },
        { b: 'Two float fields slip by 10⁻¹² against their own rationals.', raw: 'The rounded-down lower float sits 10⁻¹² below its rational and the upper float 10⁻¹² above; both slips fall on the safe side.' },
        /* "the proved upper end … that #246 proves" until 2026-10-28: the upper end is PARTIAL here, so the page says claims */
        { b: 'The registry\'s numerical row lies above the upper end.', raw: 'The page keeps a numerical value ' + theirs('≈ 2.15627') + ' [BDZ2013]; any value printing as 2.15627 is at least 2.156265, above the upper end ' + C.esc(Q.printed.upper) + ' that #246 claims (PARTIAL here, below).' }
      ])
      + C.pRaw('<b>What was decided.</b> Two implementations that share no code with each other or with the claimant — ' + C.m('tools/replay-c16.js') + ' (JavaScript, this repository\'s outward-rounded interval kernel) and ' + C.m('instruments/optq/c16.py') + ' (Python, exact rationals and directed decimal rounding) — decided every finite claim written down before either decider existed (' + C.m('corpus/optconst-queue/c16-2026-10-27/claims.json') + ').')
      + C.plainList([
        { b: 'C₁₆ ≥ ' + Q.printed.lower, raw: '<b>— CERTIFIED</b>, <i>given the Parseval normalisation for that explicit function, read</i>. The trial polynomial (|k|² ≤ ' + LJ.R + '², μ = ' + LJ.mu + ', ' + LJ.latticePoints.toLocaleString('en-US') + ' lattice points, checked against Gauss\'s count) gives exactly ' + C.m(LP.enclosure[0].slice(0, 19) + '…') + '; the printed bound is its floor at ten places.' },
        { b: 'C₁₆ ≤ ' + Q.printed.upper + ' — PARTIAL.', raw: 'The finite core is CERTIFIED by both: the ' + UJ.UF1.boxes + ' boxes tile [1, 4.9·10⁸] exactly, every box\'s supremum is at or below the printed digits, and the asymptotic bound at the last box\'s end is ' + C.m(UP.UF3.gD0[0].slice(0, 16) + '…') + '. The boxes in fact support ' + C.m(UJ.supported) + ' (box ' + UJ.endpointMax.box + '); the printed bound is conservative by about 8·10⁻¹⁰. The step from the finite boxes to the constant is analysis, ' + read('read and re-derived by hand in the claims file, not computed') + ', so the end is PARTIAL by this repository\'s rule.' }
      ])
      + C.pRaw('<b>What the upper end rests on</b>, in the order the bound travels through it:') + c16chain
      + C.pRaw('Red controls, which must come out wrong: ' + Q.redControls.map((r) => C.esc(r.what.split(':')[0])).join('; ') + '. Pins: the registry at ' + C.esc(Q.registryCommit.slice(0, 8)) + ', the certificates at ' + C.esc(Q.certificateCommit.slice(0, 8)) + '. Record ' + C.m('certs/c16-replay.json') + '; re-derive with ' + C.m('node tools/replay-c16.js') + ' (both, about four minutes) or ' + C.m('--check') + ' (the JavaScript decider, about a minute).')
  }));
}
/* §12 (2026-10-27): the registry's C_89 (K4) graphon (#255, merged asterisked), replayed as the second party
   (certs/graphon-k4.json, tools/replay-graphon-k4.js; the C kernel on a RunPod pod, the exact second implementation here) */
{
  const Q = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'graphon-k4.json'), 'utf8'));
  const r = Q.rows.find((x) => x.id === 'c89-k4');
  if (!(r && r.verdict === 'CERTIFIED' && r.agree && r.equalsStated && r.lePrinted && Q.controls.every((c) => c.kind === 'red' ? c.fired : c.held))) die('the K4 replay is not what §12 says — rewrite it');
  if (!Q.gaps.some((g) => /README/.test(g) && /0\.0301388857/.test(g))) die('the K4 README gap moved — rewrite §12');
  /* the numbers §12 types, from the record (2026-10-28) */
  if (!(r.claim === 'C_89 <= 0.0301388794' && r.c.blocks === 3840 && r.c.primes.length === 9 && Q.automorphisms.generators === 7 && /32 threads/.test(r.c.where)
    && /_D20\./.test(r.source) && Q.controls.some((c) => c.id === 'ppss-published' && /768-vertex/.test(c.what)))
    || !(r.js.seconds > 30 && r.js.seconds < 90)) die('a number §12 types (the bound, 3,840 blocks, nine primes, seven permutations, 32 threads, 2⁻²⁰, 768 vertices) moved in certs/graphon-k4.json');
  B.push(C.section({
    lab: '§12 · C₈₉', title: 'The K₄ graphon: ' + r.c.blocks.toLocaleString('en-US') + ' blocks, every one counted twice', id: 'graphon-k4',
    bodyRaw: C.pRaw('<b>Decided 2026-10-27, as the second party.</b> The same contributor\'s K₄ bound, ' + C.m('C₈₉ ≤ 0.0301388794') + ' (<a href="https://github.com/teorth/optimizationproblems/pull/255">#255</a>, merged asterisked), is a step graphon with 3,840 blocks of equal measure and red values in 2⁻²⁰ℤ; the claim is its monochromatic K₄ density, an exact rational.')
      + C.pRaw('<b>Gap, at the pin.</b> The registry\'s README lists C₈₉\'s best upper bound as 0.0301388857 ([Kos2026], #264), while the constant\'s own page carries the smaller 0.0301388794 ([SK2026], #255): the README cell does not show the page\'s best row.')
      + C.plainList([
        { b: 'C₈₉ ≤ 0.0301388794 — CERTIFIED.', raw: 'The density is ' + C.m(r.c.lower + '…') + ', the fraction the page states exactly (' + C.esc(r.c.num.slice(0, 12)) + '…/' + C.esc(r.c.den.slice(0, 12)) + '…); the printed bound is that value rounded ' + C.esc(r.printedIs.join(' and ')) + '. '
          + 'Two implementations that share no code with each other or with the claimant\'s evaluators (kept as text) agree on both integers and on every one of the ' + r.c.blocks.toLocaleString('en-US') + ' blocks at all nine primes: ' + C.m('instruments/optq/graphon_k4.c') + ' (C: every block, no symmetry, modular, threaded, on one rented 32-vCPU pod in ' + timed(Math.round(r.c.kernelSeconds / 60) + ' minutes') + ' of kernel time) and '
          + C.m('instruments/optq/graphon-k4-second.js') + ' (JavaScript: exact integers, one term per orbit of ordered block pairs under seven block permutations, each verified exactly before use; ' + timed('about a minute') + ' on the laptop).' }
      ])
      + C.pRaw('Controls: perturbing one block value moves the density; a printed bound one unit below at its last place fails; the constant graphon W ≡ ½ gives its known value; the published 768-vertex graph of Parczyk, Pokutta, Spiegel and Szabó read as a 0/1 graphon gives their published K₄ value; blocks 0 and m−1 re-derived without the symmetry agree. Record ' + C.m('certs/graphon-k4.json') + ' with the pod\'s residues verbatim in ' + C.m('certs/graphon-k4-blocks.txt') + '; ' + C.m('node tools/replay-graphon-k4.js --check') + ' re-lifts them and re-derives block 0 in seconds.')
  }));
}
{ const OUT = require(path.join(ROOT, 'design', 'outside.js')).section(C, 'reports/optconst-queue.html'); if (OUT) B.push(OUT); }

const foot = '<p>' + C.esc('Generated by tools/build-report-optq.js from certs/optq-ledger.json (' + L.generated + ', ' + L.seconds + ' s), re-derived at build; battery ' + bm[1] + ' checks, ' + bm[3] + ' red controls; @ git ' + git + '.') + '</p>';
fs.writeFileSync(path.join(ROOT, 'reports', 'optconst-queue.html'), TPL.render({
  title: 'Five pull requests to the constants registry, decided where decidable · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot,
  desc: 'The open PR queue of Tao\'s optimization-constants registry: two exact step functions, a two-law entropy certificate, five one-line bounds, OpenAI\'s Borsuk counterexample and a de Bruijn–Newman "certified record package" — decided where a finite object exists, refused where the evidence is not in the submission.',
  path: '/reports/optconst-queue.html'
}));
console.log('reports/optconst-queue.html written: ' + rows.length + ' rows, ' + L.counts.CERTIFIED + ' certified, ' + L.counts.REFUSED + ' refused @ git ' + git);
