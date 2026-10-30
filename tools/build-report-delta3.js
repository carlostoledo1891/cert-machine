#!/usr/bin/env node
/* build-report-delta3.js — reports/delta3.html: Graham's $100 question, δ₃ = 117/2192.

   The claim came from frontier-apps (session 35, 2026-10-05): a computer-assisted proof that
   the twelve-block colouring of Parrilo–Robertson–Saracino is optimal, closed by five exact
   certificates and checked there by a verifier written in the same session as the generators.
   Here the certificates are re-decided by instruments/delta3/verify.js, a second verifier in a
   second language written under a clean-room rule (it read the mathematics and the file format,
   never the claimant's code). This page is that verifier's record and nothing else.

   EVERY NUMBER ON THE PAGE IS READ FROM certs/delta3-ledger.json (the verifier's --record),
   certs/delta3-lemmas.json (the lemma tests and the upper-bound counts) or the claimant's
   lifted logs (the superseded ladder, labelled as theirs). The builder refuses unless the
   ledger's certificate hashes match the files on disk, the ledger was written by the verifier
   files now in the tree, the theorem line says VERIFIED, and the battery passes with every
   planted forgery refused. It never computes a scientific quantity itself.

   usage: node tools/build-report-delta3.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
/* WARRANT (design/WARRANT.md): what this page decided prints plain and draws solid; a number someone else printed — the
   claimant's ladder, the 2008 bound — and a measured runtime are COMPUTED (dashed); a line joining knots that were each
   computed at one L is a picture between them, CHOSEN (dotted) */
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
const OW = require(path.join(ROOT, 'design', 'outward.js'));
const measured = (t) => W.value(t, W.COMPUTED, { title: 'measured wall clock on the machine that wrote the record; not decided' });
const printedBy = (t, who) => W.value(t, W.COMPUTED, { title: 'printed by ' + who + '; read here, not re-decided' });
/* a positive exact rational p/q as a plain decimal string rounded DOWN at k places, for a lower bound to be printed outward */
const ratDown = (s, k) => { const [p, q = '1'] = String(s).split('/'); const t = (BigInt(p) * 10n ** BigInt(k)) / BigInt(q);
  if (BigInt(p) < 0n) throw new Error('ratDown: a positive rational only'); const u = t.toString().padStart(k + 1, '0'); return u.slice(0, -k) + '.' + u.slice(-k); };
const boundSci = (c, d) => OW.sci(ratDown(c.bound, 40), d, false);   /* a certified lower bound, printed DOWN at d mantissa digits */
const die = (m) => { console.error('DELTA3 REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const J = (rel) => { const f = path.join(ROOT, rel); if (!fs.existsSync(f)) die('missing record ' + rel); return JSON.parse(fs.readFileSync(f, 'utf8')); };
const sha = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');
const fmt = (n) => Number(n).toLocaleString('en-US');

/* ---- gates ------------------------------------------------------------------ */
const L = J('certs/delta3-ledger.json');
const LM = J('certs/delta3-lemmas.json');
if (!L.theorem || L.theorem.verdict !== 'VERIFIED') die('the ledger\'s theorem line is not VERIFIED');
if (L.theorem.delta3LowerBound !== '117/2192' || L.theorem.Qstar !== '-5/137') die('the ledger states a different theorem');
if (!L.cover || !L.cover.complete) die('the ledger\'s cover is not complete');
for (const c of L.certificates) {
  if (c.verdict !== 'VERIFIED') die(c.file + ' is not VERIFIED in the ledger');
  if (sha(c.file) !== c.sha256) die(c.file + ' has changed since the ledger was written');
}
for (const [f, h] of Object.entries(L.verifier.files)) {
  if (!fs.existsSync(path.join(ROOT, f)) || sha(f) !== h) die('the ledger was written by a different ' + f + ' — re-run node instruments/delta3/verify.js --record');
}
const bat = cp.spawnSync('node', [path.join(ROOT, 'instruments', 'delta3', 'battery.js')], { cwd: ROOT, maxBuffer: 64 << 20 });
const bout = String(bat.stdout) + String(bat.stderr);
if (bat.status !== 0) die('the delta3 battery did not pass:\n' + bout.slice(-1200));
const nPass = (bout.match(/^PASS\b/gm) || []).length;
const nRed = (bout.match(/^PASS {2}RED\b/gm) || []).length;
const bm = /BATTERY GREEN\s+(\d+) pass, 0 fail/.exec(bout);
if (!bm || Number(bm[1]) !== nPass || !nRed || /^FAIL\b/m.test(bout)) die('the battery did not end GREEN with every line a PASS:\n' + bout.slice(-800));

/* the lemma tests and the mutation pass: records of their own, each required clean */
if (!LM.allPass || LM.identity.identityHolds !== LM.identity.cases || LM.discretisation.holds !== LM.discretisation.cases) die('the lemma record is not all-pass');
const MU = J('certs/delta3-mutations.json');
if (MU.counts.survivedUnexplained !== 0) die('a verifier mutation survived unexplained');
for (const [f, h] of Object.entries(MU.verifierFiles)) if (sha(f) !== h) die('the mutation pass ran against a different ' + f + ' — re-run node instruments/delta3/mutate.js');
/* the claimant's own verifier, re-run here from the pinned bytes (an exhibit: it enters no verdict) */
const RERUN = fs.readFileSync(path.join(ROOT, 'certs', 'delta3', 'claimant-vcheck-rerun.log'), 'utf8');
const rr = /THEOREM VERIFIED[\s\S]*# exit 0 · (\d+) s/.exec(RERUN);
if (!rr) die('the claimant verifier\'s re-run log does not end THEOREM VERIFIED with exit 0');

/* ---- the record, read ------------------------------------------------------- */
const num = (s) => { const [p, q] = String(s).split('/'); return Number(p) / (q ? Number(q) : 1); };
const certs = L.certificates.slice().sort((a, b) => num(a.region.lo) - num(b.region.lo));
const inner = certs.find((c) => c.kind === 'inner');
const slabs = certs.filter((c) => c.kind === 'slab');
const minSlab = slabs.reduce((m, c) => (m === null || Number(c.boundDecimal) < Number(m.boundDecimal) ? c : m), null);
const frac = (s) => { const [p, q] = String(s).split('/'); return q ? p + '/' + q : p; };
const secs = (x) => Number(x).toFixed(1);

/* the superseded ladder: the claimant's own verifier logs and its float ceilings, labelled as theirs */
const LADDER = [32, 64, 128, 192, 256].map((Lc) => {
  const log = fs.readFileSync(path.join(ROOT, 'certs', 'delta3', 'frontier', 's34', 'verify-L' + Lc + '.log'), 'utf8');
  const m = /VERIFIED\s+Q\* >= (-?[\d.]+)\s+delta_3 >= ([\d.]+)(?:\s+\(exact (\d+)\/(\d+)\))?/.exec(log);
  if (!m) die('the claimant\'s L = ' + Lc + ' log does not carry a VERIFIED line');
  /* the log prints its bound rounded to nearest; a lower bound is printed here rounded DOWN from the exact fraction the
     log carries (an outside audit, 2026-10-20: 0.05324921 is above the exact 0.0532492058…), and the log's print is kept */
  const lowerDown = m[3] ? floor8(BigInt(m[3]), BigInt(m[4])) : null;
  return { L: Lc, lower: lowerDown !== null ? Number(lowerDown) : Number(m[2]), logPrint: m[2], exact: m[3] ? m[3] + '/' + m[4] : null, lowerDown };
});
function floor8(n, d) { const s = (n * 100000000n) / d; const t = s.toString().padStart(9, '0'); return t.slice(0, -8) + '.' + t.slice(-8); }
const CEIL = J('certs/delta3/frontier/s34/ceilings.json');
for (const r of LADDER) { if (!CEIL[r.L]) die('no ceiling for L = ' + r.L); r.ceil = CEIL[r.L].delta; }
const TRUE = 117 / 2192;
/* typed numbers, gated (WARRANT rule 8): the title's factor, §1's two roundings, §6's matrix sizes, the paper's version */
if ((TRUE / (1675 / 32768)).toFixed(3) !== '1.044' || TRUE.toFixed(6) !== '0.053376' || (1675 / 32768).toFixed(6) !== '0.051117' || !String(TRUE).startsWith('0.0533759'))
  die('a typed rounding of 117/2192, 1675/32768 or their ratio no longer holds');
{
  const dims = L.certificates.filter((c) => c.kind === 'slab').map((c) => c.n + 1);   /* v = (1, y): the residual matrix is (n + 1)-square */
  if (Math.min(...dims) !== 131 || Math.max(...dims) !== 147) die('§6\'s "131- to 147-dimensional" no longer matches the slabs: ' + dims.join(', '));
  const P = J('paper/INDEX.json'); const pd = (P.papers || P).find((x) => x.name === 'delta3');
  if (!pd || !/^draft v0\.2\b/.test(pd.status)) die('§6 names the paper "draft v0.2"; paper/INDEX.json says ' + (pd && pd.status));
}
/* the archive that holds these files: the deposit record's latest version */
const ZEN = J('corpus/zenodo.json');
const DEP = ZEN.versions.find((v) => v.version === ZEN.latest);
if (!DEP || !/^10\.5281\/zenodo\.\d+$/.test(DEP.doi)) die('the deposit record has no DOI for its latest version');

/* ---- figure: h, the first-order term, from the verifier's own model ----------
   The instrument computes h (1097 exact node values); the page only plots them. The
   shaded bands are the blocks where φ* = +1. */
const MODEL = require(path.join(ROOT, 'instruments', 'delta3', 'model.js'));
const RAT = require(path.join(ROOT, 'instruments', 'interval', 'rational.js'));
const HN = MODEL.hNodes().map((v, k) => [k / MODEL.U, RAT.toDouble(v)]);
const plusBands = [];
for (let b = 0; b + 1 < MODEL.EDGES.length; b++) if (MODEL.SIGNS[b] > 0) plusBands.push({ x0: MODEL.EDGES[b] / MODEL.U, x1: MODEL.EDGES[b + 1] / MODEL.U });
const FIG_H = CH.lines({
  w: 900, h: 300, x0: 0, x1: 1, y0: 0, y1: 0.11,
  xTicks: [0, 0.25, 0.5, 0.75, 1].map((v) => ({ v, t: String(v) })),
  yTicks: [0, 0.025, 0.05, 0.075, 0.1].map((v) => ({ v, t: String(v) })),
  xLabel: 'a ∈ [0, 1]; shaded: the blocks where φ* = +1', yLabel: 'h(a)', hover: false,
  bands: plusBands,
  series: [{ name: 'h = −φ*·Kφ*, exact at every multiple of 1/1096 (the second verifier\'s model)', pts: HN }],
  alt: 'A nonnegative zigzag over the unit interval, rising to about 0.10 inside the long middle blocks and touching zero exactly at the eleven block edges, symmetric about one half. Shaded bands mark the six blocks coloured +1.'
});

/* ---- figure: the ladder against the answer ----------------------------------
   WARRANT (2026-10-28). Until now the claimant's certified bounds were drawn as a SOLID line, the grammar's mark for what
   is decided here, though this page never re-decided them (§5 says so); and both series joined their five knots with a
   continuous line, though nothing was computed between two values of L. Now each knot is a dot, the joins are dotted
   (a picture between knots, chosen), and the standings are the legend's: 117/2192 solid (decided here), the 2008 bound
   and every knot computed (printed by someone else). */
const lastL = LADDER[LADDER.length - 1];
const lowerOf = (r) => (r.lowerDown !== null ? r.lowerDown : String(r.lower));
const FIG_LADDER = CH.scatter({
  w: 900, h: 330, x0: 0, x1: 270, y0: 0.0498, y1: 0.0538,
  xTicks: [32, 64, 128, 192, 256].map((v) => ({ v, t: String(v) })),
  yTicks: [0.050, 0.051, 0.052, 0.053].map((v) => ({ v, t: v.toFixed(3) })),
  xLabel: 'L, the number of equal cells', yLabel: 'δ₃ ≥ …',
  hlines: [{ y: TRUE, token: 'var(--ink)', t: '117/2192 = 0.0533759…, the answer (proved, §2)' }, { y: 1675 / 32768, t: 'PRS 2008: 1675/32768', dashed: true }],
  curves: [{ pts: LADDER.map((r) => [r.L, r.ceil]), standing: W.CHOSEN }, { pts: LADDER.map((r) => [r.L, r.lower]), standing: W.CHOSEN }],
  pts: LADDER.map((r) => ({ x: r.L, y: r.ceil, token: 'var(--c-ctx)', k: 'L = ' + r.L + ' · the model\'s minimum by local search', v: r.ceil.toFixed(5) + ' (float, the claimant\'s; an upper bound on what the model can certify)' }))
    .concat(LADDER.map((r) => ({ x: r.L, y: r.lower, token: 'var(--c-1)', k: 'L = ' + r.L + ' · certified lower bound in the model', v: 'δ₃ ≥ ' + lowerOf(r) + ' (the claimant\'s verifier' + (r.exact ? ', ' + r.exact + ' rounded down' : '') + '; not re-decided here)' }))),
  keys: [{ token: 'var(--c-1)', t: 'certified lower bound in the L-cell model (the claimant\'s verifier)' }, { token: 'var(--c-ctx)', t: 'the model\'s own minimum, by local search (float)' }],
  alt: 'Two rows of five dots against the number of cells from 32 to 256, each joined by a dotted line. The certified lower bounds climb from ' + OW.down(LADDER[0].lower, 4) + ' to ' + OW.down(lowerOf(lastL), 5) + '; the model minima climb from ' + LADDER[0].ceil.toFixed(4) + ' to ' + lastL.ceil.toFixed(5) + '. Both stay below the solid horizontal line at 117/2192 = 0.05338; the dashed line marks the 2008 bound, 1675/32768: refining the grid cannot reach the answer.'
});
if (!LADDER.every((r) => r.ceil < TRUE && r.lower < TRUE && r.lower <= r.ceil)) die('the ladder no longer stays below the answer, or a certified bound sits above its model\'s minimum');

/* ---- the page ---------------------------------------------------------------- */
const O = [];
O.push(C.header({
  eyebrow: 'cert-machine · report · erdős #1186, the case k = 3 · a theorem, machine-verified twice',
  title: 'Graham\'s $100 question: the twelve blocks are optimal',
  deck: 'Colour 1, …, n red and blue; how few monochromatic progressions a, a+d, a+2d can there be? A random colouring '
    + 'gives about n²/16. In 2008 Parrilo, Robertson and Saracino found a colouring in twelve blocks that does better, '
    + '117/2192·n², proved nothing can go below 1675/32768·n², and conjectured their colouring optimal — the value Graham had '
    + 'offered $100 for in 1999. The conjecture is true: δ₃ = 117/2192. The proof is two pages of mathematics and five exact '
    + 'certificates; the certificates were made and checked in a sandbox, and are re-decided here by a second program written '
    + 'from the mathematics alone, sharing no code with the first. Not refereed, not formalised — what that leaves open is '
    + 'stated below, in full.'
}));

O.push(C.tldr({
  findingRaw: 'The least number of monochromatic three-term progressions in a two-colouring of {1, …, n} is '
    + C.m('(117/2192 + o(1))·n²') + ' — the twelve-block colouring is optimal, and among all fractional colourings it and its '
    + 'negative are the only minimisers. This settles δ₃, the case k = 3 of Erdős problem #1186, and the 2008 conjecture; '
    + 'it says nothing about longer progressions.',
  mechanismRaw: 'Expand the problem around the twelve-block colouring. The first-order term becomes an explicit function '
    + 'h ≥ 0 that vanishes exactly at the eleven block edges; a discretisation built on h loses nothing to first order, which is '
    + 'what every earlier relaxation could not avoid. The space is then cut into five regions by the distance from the optimum, '
    + 'and each is closed by an exact rational certificate: zero gap near the optimum, a margin of at least '
    + boundSci(minSlab, 7) + ' away from it.',
  checkRaw: C.m('node instruments/delta3/verify.js') + ' — ' + measured(secs(L.seconds) + ' s') + ', Node only, no dependencies. It derives '
    + 'the colouring, h, every cell area and every bathtub constant from the mathematics, rebuilds each certificate\'s residual '
    + 'matrix exactly, proves it semidefinite exactly, and checks the cover. The battery\'s ' + nRed + ' planted forgeries are '
    + 'all refused (' + nPass + ' checks green).'
}));

O.push(C.stats([
  { k: 'δ₃', v: '117/2192', n: '= 0.0533759… · was known to lie in [' + OW.down(ratDown('1675/32768', 20), 5) + ', ' + OW.up(117 / 2192, 5) + '] since 2008' },
  { k: 'certificates', v: String(certs.length), n: 'one inner (zero gap) and four slabs, each accepted by two verifiers that share no code' },
  { k: 'smallest margin', v: boundSci(minSlab, 2), n: 'on E = (Q − Q*)/4, slab [' + frac(minSlab.region.lo) + ', ' + frac(minSlab.region.hi) + ']; exact value in the ledger' },
  { k: 'forgeries refused', v: nRed + ' / ' + nRed, n: 'mutated certificates, each refused by the rule it breaks · ' + MU.counts.caught + ' of ' + MU.counts.mutants + ' verifier mutations caught' },
  { k: 'status', v: 'proved', sm: true, n: 'machine-verified twice · read line by line by the author · not refereed · not formalised' }
]));

O.push(C.scope('A computer-assisted proof. The mathematics (§2) is short and elementary; it has been checked by machine, by AI '
  + 'reading, and line by line by the author (5 October 2026), not by a referee; the certificates are finite exact computations, accepted by the claimant\'s verifier '
  + 'and by this repository\'s, which were written independently. Nothing here is a Lean proof. The claim was produced in the '
  + 'operator\'s own sandbox (frontier-apps); this repository is its judge, with the same rules it applies to anyone\'s claim.'));

/* §1 */
O.push(C.section({
  lab: '§1 · the question', title: 'Twenty-seven years, a factor of 1.044',
  bodyRaw: C.pRaw('Let V(n) be the least number of monochromatic progressions {a, a+d, a+2d}, d ≥ 1, over all two-colourings of '
    + '{1, …, n}. Graham proposed determining β in V(n) = βn²(1 + o(1)) as a $100 problem at the Erdős conference in Budapest '
    + 'in 1999. Parrilo, Robertson and Saracino (2008) disproved the folklore guess β = 1/16 with a colouring in twelve blocks of '
    + 'relative lengths')
    + C.eq('28, 6, 28, 37, 59, 116, 116, 59, 37, 28, 6, 28 &nbsp; (out of 548), alternating in colour,')
    + C.pRaw('which gives 117/2192 ≈ 0.053376, and proved β ≥ ' + printedBy('1675/32768 ≈ 0.051117', 'Parrilo, Robertson and Saracino (2008), proved there') + ' by a semidefinite relaxation. Butler, Costello '
      + 'and Graham (2010) recovered the twelve blocks by experiment, crediting the 2008 paper; Greenwood, Kariv and Williams (2023) '
      + 'proved them optimal among antisymmetric colourings with at most twelve blocks. On erdosproblems.com the question is '
      + 'problem #1186, for every k — open as of the snapshot pinned here (5 October 2026).')
    + C.note({ lab: 'scope', bodyRaw: C.pRaw('This settles <strong>δ₃</strong>: Graham\'s question and the 2008 conjecture. '
      + '“Solves #1186” would overstate it — the problem asks about δ<sub>k</sub> for every k, and nothing here touches k ≥ 4.') })
}));

/* §2 */
O.push(C.section({
  lab: '§2 · the proof, in four steps', title: 'Expand around the answer, and the first order stops leaking',
  bodyRaw: C.pRaw('<strong>1 · Reduction.</strong> Counting each non-monochromatic progression by its two bichromatic pairs gives, '
    + 'uniformly over colourings, V(n)/n² ≥ 1/16 + Q*/4 − O(1/n), where Q* is the infimum over measurable φ : [0,1] → [−1,1] of')
    + C.eq('Q(φ) = ∬<sub>R</sub> φ(a)φ(b) da db, &nbsp;&nbsp; R = {(a, b) : a/2 ≤ b ≤ (1 + a)/2}.')
    + C.pRaw('The twelve-block function φ* has Q(φ*) = ' + L.phiStar.Q + ', and 1/16 − 5/548 = 117/2192; so everything rests on '
      + 'Q ≥ −5/137. <strong>2 · Expansion.</strong> Write φ = φ*(1 − 2σ) with σ ∈ [0, 1] the part flipped against φ*. Exactly, for '
      + 'every φ,')
    + C.eq('E(σ) = (Q(φ) − Q(φ*))/4 = ∫ h σ + Q(φ*σ), &nbsp;&nbsp; h = −φ* · Kφ* ≥ 0,')
    + C.pRaw('and h is piecewise linear on the 1/1096 grid, zero exactly at the eleven edges, with ∫h = ' + L.phiStar.hIntegral
      + '. <strong>3 · Discretisation without first-order loss.</strong> On cells whose ends include every edge, the bathtub '
      + 'principle bounds ∫hσ cell by cell with no loss at σ = 0, and pairs of cells cut by the boundary of R are bounded from '
      + '0 ≤ σ ≤ 1 alone; the resulting quadratic L(y) in the cell averages satisfies E ≥ L. <strong>4 · Cover.</strong> By the '
      + 'symmetry φ → −φ it suffices to take m = ∫σ ≤ ½; five regions in m each carry an exact certificate that L is ≥ 0 '
      + '(the region nearest the optimum) or strictly positive (the other four).')
    + C.pRaw('Step 3 is the whole idea. Discretising φ itself, as every relaxation since 2008 did, gives away a first-order amount '
      + 'at every cell pair the boundary of R crosses — and that loss caps the bound below the answer however fine the grid (§5). '
      + 'In σ the first-order term is ∫hσ; the bathtub gives a lower bound L with E ≥ L and L(0) = 0, and that is all the proof uses.')
    + C.pRaw('<strong>Correction (2026-10-20, from an outside audit).</strong> An earlier version of the sentence above said the bathtub bounds the '
      + 'first-order term <em>exactly</em>, with only a second-order loss. That is false as a statement about every direction σ: for σ = t on '
      + '[0, 16/1096] and zero elsewhere, 0 &lt; t ≤ ½, the exact functional is E = (9t + 3t²)/18769 while the certificate\'s minorant on the '
      + 'g24·4·8 grid is L = (7t + 2t²)/18769, so E − L = (2t + t²)/18769 carries a linear term (re-derived here with the instrument\'s own exact '
      + 'functions, lemmas.js and verify.js, on 2026-10-20; on the g8·4·0 grid L = (8t + 3t²)/18769). The bathtub is exact only along its own '
      + 'minimiser, the sublevel set {h &lt; v}. The theorem never used the stronger sentence: the certificates prove L ≥ 0 (or &gt; 0) over '
      + 'each region, and E ≥ L with L(0) = 0 is the lemma tested in lemmas.js. No verdict moved.')
    + C.figure({ svgRaw: FIG_H, caption: 'The first-order term h. Flipping the colouring on a set costs ∫h over it to first order; h vanishes exactly at the eleven edges, where moving an edge is free to first order and the certificates must see the second-order cost. Its ' + HN.length + ' node values are exact, and h is linear between nodes, so the line drawn is h itself: solid, decided.' })
}));

/* §3 */
{
  const rows = certs.map((c) => [
    '[' + frac(c.region.lo) + ', ' + frac(c.region.hi) + ']', c.kind === 'inner' ? 'inner · zero gap' : 'slab',
    String(c.n), fmt(c.counts.forms), c.counts.triangles ? fmt(c.counts.triangles) : '—',
    { raw: c.kind === 'inner' ? 'E ≥ 0, equality only at σ = 0' : '<strong>E ≥ ' + boundSci(c, 6) + '</strong>' },
    { raw: measured(secs(c.seconds) + ' s') }, { raw: C.tag('verified', 'held') }
  ]);
  O.push(C.section({
    lab: '§3 · the certificates', title: 'Five regions, five exact identities', wide: true,
    bodyRaw: '<div class="col">' + C.pRaw('Each slab lo ≤ m ≤ hi carries an identity L<sub>θ</sub>(y) − B = vᵀSv + Σ μ<sub>f</sub> f(y) '
      + 'in v = (1, y), with every multiplier μ ≥ 0, every form f nonnegative on the region (products of y<sub>i</sub>, 1 − y<sub>i</sub>, '
      + 'm − lo, hi − m, and triangle inequalities), and S + εI semidefinite; so L ≥ B − ε(1 + n) there. The inner region m ≤ '
      + frac(inner.region.hi) + ' carries one in which every term vanishes at y = 0 — the certificate is exact at the optimum itself. '
      + 'The multipliers came from floating-point semidefinite programs; nothing here trusts them: the residual matrix is rebuilt '
      + 'from the mathematics in exact rationals and its semidefiniteness is proved exactly (' + C.esc(L.verifier.method.psd) + ').') + '</div>'
      + C.table({
        cols: [{ h: 'region m = ∫σ' }, { h: 'kind' }, { h: 'cells', cls: 'n' }, { h: 'forms', cls: 'n' }, { h: 'triangles', cls: 'n' }, { h: 'certified bound (exact in the ledger)' }, { h: 'time here', cls: 'n' }, { h: 'verdict here' }],
        rows
      })
      + '<div class="col">' + C.pRaw('Together the regions cover m ∈ [0, ½], so E ≥ 0 for every σ and Q ≥ −5/137 for every φ. '
        + 'A corollary worth stating: φ* minimises Q on the whole L¹-ball of radius ' + frac(inner.region.hi) + ' × 2 around it, '
        + 'fractional colourings included, and anything at least that far from both ±φ* has Q ≥ −5/137 + 4 × '
        + boundSci(minSlab, 2) + '. Every printed bound here is rounded down from the exact fraction in the ledger.') + '</div>'
  }));
}

/* §4 */
{
  const vrows = LM.counts.map((r) => [fmt(r.n), fmt(r.mono), r.ratioDecimal, r.timesN]);
  const sp = LM.bathtub.singlePieceReading;
  O.push(C.section({
    lab: '§4 · why you can trust this', title: 'Two verifiers, one clean-room rule, and forgeries that must fail',
    bodyRaw: C.pRaw('<strong>The claimant\'s check.</strong> The generators and a verifier were written in the sandbox in one '
      + 'session, by one AI agent, separately from each other. That verifier, kept here as an exhibit and re-run from the pinned bytes, '
      + 'accepts the five files (' + measured(rr[1] + ' s') + ' on this machine). It leaves the gap the claimant named itself: a misreading shared by '
      + 'generator and verifier would not be caught.')
      + C.pRaw('<strong>The second verifier.</strong> ' + C.m('instruments/delta3/verify.js') + ' was written afterwards, in JavaScript, '
        + 'by an agent given the mathematics and a field-by-field description of the files — not the generators, not the claimant\'s '
        + 'verifier, not its logs; the claimant\'s code entered this repository only after it was finished. It derives everything with '
        + 'proof force itself, in BigInt rationals: the colouring, h and its zeros, every cell area by two exact routes that must agree '
        + 'pair by pair (the trapezoid rule on the section length, and polygon clipping), the bathtub constants, the cut bounds, the '
        + 'residual matrices. It refuses any form it cannot show nonnegative and any multiplier of the wrong sign, and proves '
        + 'semidefiniteness exactly or refuses. It accepts all five in ' + measured(secs(L.seconds) + ' s') + ', and its exact bounds equal the files\' claims.')
      + C.note({ lab: 'what the second reading found', bodyRaw: C.plainList([
        { b: 'the bathtub constant', text: 'The proof text writes b = (w²/2)/max m′ without saying that m′ sums over every piece of h at a level. Read as the largest single piece, b is too large and the inequality is false — ' + fmt(sp.violations) + ' exact violations in ' + fmt(sp.cases) + ' tests. The certificates were built with the summed reading and verify under it; the paper now says so.' },
        { b: 'ε is load-bearing', text: 'In every slab the residual S alone is not semidefinite (exact negative witnesses); S + εI is, and the bound B − ε(1 + n) accounts for it. Correct, and worth stating.' },
        { b: 'triangles need distinct indices', text: 'Nonnegativity of 1 + s₁z_iz_j + s₂z_jz_k + s₃z_iz_k on the cube rests on multilinearity, which a repeated index breaks. Every triangle in the files has distinct indices; the verifier refuses one that does not.' },
        { b: 'small omissions, harmless', text: 'The kink list omits a = ½ and the edges themselves (both on the lattice); N need only be entrywise nonnegative; the κ term relies on m ≥ 0. None changes a verdict.' }
      ]) })
      + C.pRaw('<strong>Forgeries.</strong> ' + C.m('node instruments/delta3/battery.js') + ' mutates genuine certificates and requires '
        + 'each mutation refused, by the rule it breaks: raised bounds (by 10⁻³ and by 10⁻⁶ — the certificates are that tight), dropped '
        + 'triangle forms, every θ set to 1 or to 0, widened slabs, ε set to 0 or inflated with B, a grid missing an edge of φ*, a doubled '
        + 'inner radius, an overspent linear budget, dropped inner multipliers, missing regions, and planted single entries off by 2⁻¹⁰⁰ — a '
        + 'negative multiplier, a sign-violating or repeated-index triangle, θ outside [0, 1], an unknown form. ' + nRed + ' of ' + nRed
        + ' refused at this build, ' + nPass + ' checks green. Then the verifier itself is mutated: ' + MU.counts.mutants + ' one-line edits '
        + '(flip h, mirror R, drop ε, an optimistic cut bound, skip a sign check, trust the float Cholesky, accept a zero pivot …), '
        + MU.counts.caught + ' caught by the genuine set or a forgery; the one survivor removes a rule that is enforced twice.')
      + C.pRaw('<strong>The two lemmas, tested.</strong> The expansion identity and the discretisation lemma are proved on paper; they '
        + 'are also tested exactly on step functions finer than the grids, adversarial ones included: ' + fmt(LM.identity.cases)
        + ' cases of the identity, all equal; ' + fmt(LM.discretisation.cases) + ' cases of the lemma, all satisfied, the gap exactly 0 '
        + 'on breakpoint flips and single cells — the bound is sharp there. Tests, not proofs.')
      + C.pRaw('<b>What the theorem rests on</b>, in the order the proof travels through it. The five certificates and their cover of '
        + 'm ∈ [0, ½] are decided exactly, twice; these are the steps between them and δ₃, each with the rung its checking reached:')
      + W.premisesHtml([
        { grade: W.ASSUMED, label: 'The reduction: V(n)/n² ≥ 1/16 + Q*/4 − O(1/n), uniformly over colourings', evidence: 'proved on paper (§2, step 1) and read line by line by the author on 5 October 2026; no machine checked it, and nothing tests it' },
        { grade: W.ASSUMED, label: 'The expansion: E(σ) = ∫hσ + Q(φ*σ) for every σ', evidence: 'proved on paper; tested exactly on ' + fmt(LM.identity.cases) + ' step functions, all equal (certs/delta3-lemmas.json) — tests on finitely many σ, not a proof for every σ' },
        { grade: W.ASSUMED, label: 'The discretisation: E ≥ L with L(0) = 0, the bathtub constant summed over every piece of h at a level', evidence: 'proved on paper; tested exactly on ' + fmt(LM.discretisation.cases) + ' cases, all satisfied. Read with the largest single piece instead, it is false (' + fmt(sp.violations) + ' exact violations in ' + fmt(sp.cases) + ' tests); the certificates use the summed reading' },
      ], { meetLine: 'Every finite step is decided; the weakest premise is <b>assumed</b>: three steps proved on paper and read, which no machine here checked. So δ₃ = 117/2192 holds <i>given the reduction and the two lemmas, read</i> — the status line at the top says the same in words, and a formal proof of the analytic part (§6) is what would lift them.' })
      + C.pRaw('<strong>The upper bound, counted.</strong> The exact number of monochromatic progressions of the twelve-block colouring '
        + 'itself. For n a multiple of 1096 it is exactly 117n²/2192 − n/2:')
      + C.table({ cols: [{ h: 'n', cls: 'n' }, { h: 'monochromatic progressions', cls: 'n' }, { h: 'V/n²', cls: 'n' }, { h: 'n·(V/n² − 117/2192)', cls: 'n' }], rows: vrows })
  }));
}

/* §5 */
O.push(C.section({
  lab: '§5 · the measurement that led here', title: 'Why the obvious discretisation cannot reach the answer',
  bodyRaw: C.pRaw('A day earlier the same sandbox certified lower bounds the classical way — φ discretised on L equal cells, '
    + 'a Shor relaxation with triangle cuts, exact rational multipliers. Its verifier accepted δ₃ ≥ '
    + printedBy(lowerOf(lastL), 'the claimant\'s verifier (rounded down here from its exact fraction)') + ' at L = 256 — the exact fraction '
    + (lastL.exact || '').replace('/', ' / ') + ', printed here rounded down; the claimant\'s log prints it as ' + printedBy(lastL.logPrint, 'the claimant\'s log, rounded to nearest')
    + ', rounded to nearest, which an outside audit noted on 2026-10-20 (these were not re-decided here; the logs are kept as the claimant\'s; the certificate itself is certs/delta3/frontier/s34/cert-L256.json). '
    + 'But the model\'s own minimum, found by local search, also stays below the answer at every L: every cell pair the boundary '
    + 'crosses gives away a first-order amount, so no grid refinement closes the gap. That measurement is what moved the proof '
    + 'into the coordinates σ.')
    + C.figure({ svgRaw: FIG_LADDER, caption: 'The superseded ladder. Darker dots: certified lower bounds in the L-cell model (exact, by the claimant\'s verifier; not re-decided here, so computed on this page). Lighter dots: the model\'s minimum by local search (floating point, an upper bound on what the model can certify). Each series was computed at five values of L only; the dotted joins are a picture between them. Solid: 117/2192, decided here. Dashed: the 2008 bound, proved by its authors and read here. Both series flatten under 117/2192.' })
    + '<div class="col">' + W.legendHtml({ compact: true }) + '</div>'
}));

/* §6 */
O.push(C.section({
  lab: '§6 · what is not established', title: 'What a referee would still ask for',
  bodyRaw: C.plainList([
    { b: 'a referee', text: 'The mathematics is two pages (the reduction, the expansion, the bathtub and discretisation lemmas). The author read it line by line on 5 October 2026, after both verifiers had accepted the certificates — the condition the erdosproblems forum sets before an AI-assisted solution is posted. No referee has read it.' },
    { b: 'Lean', text: 'Nothing is formalised. The finite part (five rational identities, semidefiniteness of 131- to 147-dimensional rational matrices) is plausible with a verified checker; the analytic part (the reduction, the bathtub rearrangement, the discretisation) is real measure-theory work — weeks, not days.' },
    { b: 'independence', text: 'Both verifiers and the generators were written by AI agents. The clean-room rule removes shared code, not a shared misreading of the mathematics both were given; §2 is where a reader should look.' },
    { b: 'reproducibility of generation', text: 'The multipliers came from a nondeterministic solver, so regeneration gives different files. The five files are the record, pinned by sha256; their force does not depend on regenerating them.' }
  ])
    + C.note({ lab: 'the records', bodyRaw: C.pRaw('<a href="/certs/delta3-ledger.json">The ledger</a> (each certificate\'s sha256, region, '
      + 'exact bound and verdict; the verifier files\' hashes) · <a href="/certs/delta3-lemmas.json">the lemma tests and the counts</a> · '
      + '<a href="/paper/delta3.pdf">the paper</a> (draft v0.2, numbers interpolated from these records). The certificates, both verifiers '
      + 'and the claimant\'s generators are in the repository under certs/delta3/ and instruments/delta3/; the sources (the 2008 and 2010 '
      + 'papers, the problem page, the forum) are pinned by sha256. Archived at Zenodo as ' + ZEN.latest + ', <a href="https://doi.org/' + DEP.doi + '">doi:' + DEP.doi + '</a>. '
      + 'Listed on erdosproblems.com as a <a href="https://www.erdosproblems.com/forum/thread/1186/proof-claims">partial proof claim for #1186</a> (submitted 2026-10-05, shown 2026-10-06; the page snapshot is pinned).') })
}));

/* what has come back from outside: re-runs and credits, from design/outside.js (one record, pinned quotes) */
{ const OUT = require(path.join(ROOT, 'design', 'outside.js')).section(C, 'reports/delta3.html'); if (OUT) O.push(OUT); }

const foot = '<p>' + C.esc('Generated by tools/build-report-delta3.js from certs/delta3-ledger.json and certs/delta3-lemmas.json — the certificate hashes and the verifier hashes checked against the tree, the battery run with every planted forgery refused; the build fails if any of it does not hold.') + '</p>'
  + '<p>' + C.esc('git ' + git + ' · cert-machine · Carlos Toledo') + '</p>';

fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'reports', 'delta3.html'),
  TPL.render({ title: 'δ₃ = 117/2192: the twelve blocks are optimal · cert-machine', bodyRaw: O.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/delta3.html',
    desc: 'Graham\'s $100 question answered: the least number of monochromatic three-term progressions in a two-colouring of {1,…,n} is (117/2192 + o(1))n². A computer-assisted proof whose five exact certificates are re-decided by a second verifier sharing no code with the first. Not refereed, not formalised.' }));
console.log('reports/delta3.html written — ' + certs.length + ' certificates verified, min slab margin ' + minSlab.boundDecimal + ', battery ' + nPass + ' green, ' + nRed + ' forgeries refused');
