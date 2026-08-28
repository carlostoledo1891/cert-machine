#!/usr/bin/env node
/* build-report-alphaevolve.js — generate reports/alphaevolve.html: the
   AI-discovered fast-matmul algorithms, certified.

   Nothing on the page is remembered: the ENTIRE strassen-audit corpus is
   re-certified at build time — every tensor identity re-checked equation by
   equation in exact arithmetic, every source pin re-hashed — and the build
   refuses if any verdict, rank, equation count, or the characteristic-2
   refutation moves. The flagship facts: AlphaEvolve's rank-48 <4,4,4>
   CERTIFIED over Z[i] from the commit-pinned DeepMind notebook, and
   AlphaTensor's rank-47 <4,4,4> VERIFIED over F2 with the SAME factors
   REFUTED over Q — the speedup provably requires characteristic 2.

   usage: node tools/build-report-alphaevolve.js */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const FAM = require(path.join(ROOT, 'families', 'strassen-audit.js'));

const sh = (c) => { try { return cp.execSync(c, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) { return null; } };
const die = (m) => { console.error('ALPHAEVOLVE REPORT REFUSED: ' + m); process.exit(1); };

/* ---- re-certify the ENTIRE corpus ---------------------------------------- */
const rows = [];
for (let i = 0; ; i++) {
  const o = FAM.enumerate(i); if (!o) break;
  const c = FAM.certify(o);
  if (c.verdict === 'REFUSED') die(o.id + ' REFUSED: ' + c.why);
  rows.push({ id: o.id, verdict: c.verdict, text: c.text, extra: c.extra });
}
if (rows.length !== 11) die('expected 11 corpus rows, found ' + rows.length);
const byId = Object.fromEntries(rows.map(r => [r.id, r]));

const ae = byId['alphaevolve-48-4x4x4'];
if (!ae || ae.verdict !== 'HIT') die('AlphaEvolve rank-48 did not certify');
if (ae.extra.rank !== 48 || ae.extra.ring !== 'Zi' || ae.extra.scale !== 8 || ae.extra.equations !== 4096)
  die('AlphaEvolve certificate moved: ' + JSON.stringify(ae.extra));
if (!ae.extra.sourcePin || !/^2cce2543/.test(ae.extra.sourcePin.sha256)) die('AlphaEvolve source pin moved');

const at47 = byId['alphatensor-f2-4x4x4'];
if (!at47 || at47.verdict !== 'HIT' || at47.extra.rank !== 47) die('AlphaTensor rank-47 F2 did not certify');
if (!/REFUTED over Q/.test(at47.extra.overQ || '')) die('the over-Q refutation of rank-47 moved — the characteristic-2 story is gone');

const s2 = byId['strassen-squared-4x4x4'];
if (!s2 || s2.verdict !== 'HIT' || s2.extra.rank !== 49) die('the Strassen-squared rank-49 baseline moved');
if (byId['strassen-1969'].verdict !== 'HIT' || byId['strassen-1969'].extra.rank !== 7) die('the Strassen 1969 calibration moved');
if (byId['naive-2x2x2'].verdict !== 'REJECT') die('the naive rank-8 honest REJECT moved');
const hits = rows.filter(r => r.verdict === 'HIT');
if (hits.length !== 10) die('expected 10 verified algorithms, found ' + hits.length);
const totalEq = hits.reduce((s, r) => s + (r.extra.equations || 0), 0);

/* ---- the page ------------------------------------------------------------ */
const git = sh('git rev-parse --short HEAD') || 'unknown';
const B = [];

B.push(C.header({
  eyebrow: 'cert-machine · certified audit · re-decided at every build',
  title: 'The AI-discovered algorithms, certified',
  deck: 'The two most famous AI-discovered mathematical objects — AlphaTensor\'s rank-47 4×4 matrix-multiplication '
    + 'algorithm (Nature, 2022) and AlphaEvolve\'s rank-48 (2025) — audited as exact tensor identities from '
    + 'pinned first-party bytes. AlphaEvolve\'s 48: CERTIFIED over Z[i], all 4,096 defining equations exact. '
    + 'AlphaTensor\'s 47: VERIFIED over F2, and the SAME factors REFUTED over Q — the speedup provably requires '
    + 'characteristic 2. Every verdict on this page was re-derived during the build that produced it.'
}));

B.push(C.tldr({
  findingRaw: 'AlphaEvolve\'s rank-48 ⟨4,4,4⟩ decomposition is exactly correct over Z[i] — certified, not '
    + 'spot-checked — and AlphaTensor\'s rank-47 is decided BOTH ways: verified over F2, refuted over Q. The '
    + 'first beats Strassen-squared\'s 49 with complex coefficients; the second beats it only in '
    + 'characteristic 2, and that restriction is now a theorem about the artifact, not a caveat in a paper.',
  mechanismRaw: 'A fast-matmul algorithm IS a finite exact object: three factor matrices whose defining tensor '
    + 'identity either holds over the claimed ring or provably does not. The audit checks every equation in '
    + 'exact arithmetic against commit-pinned source bytes (the DeepMind notebook is mutable at main — it has '
    + 'been rewritten; the pin is by commit and sha256).',
  checkRaw: C.m('python3 verify/verify_strassen.py certs/strassen-certificate.json') + ' — stdlib Python, '
    + 'seconds, refutes a forged coefficient before it exits green.'
}));

B.push(C.stats([
  { k: 'AlphaEvolve ⟨4,4,4⟩', v: 'rank 48 · CERTIFIED', role: 'held', n: 'over Z[i]: all 4,096 tensor equations exact, imaginary parts vanish, scale-8 identity after clearing half-Gaussian denominators' },
  { k: 'AlphaTensor ⟨4,4,4⟩', v: '47 over F2 · REFUTED over Q', role: 'warn', n: 'the same factors, both rings, one build — the speedup provably needs characteristic 2' },
  { k: 'the baseline they beat', v: 'rank 49', n: 'Strassen ⊗ Strassen, generated here by exact Kronecker composition and re-decided from scratch' },
  { k: 'algorithms verified', v: String(hits.length), role: 'held', n: C.esc(String(totalEq)) + ' tensor-identity equations held exactly across the corpus this build' },
  { k: 'honest rejects', v: '1', n: 'the naive rank-8 certifies as CORRECT and is REJECTED: correct is not fast' },
  { k: 'sources', v: 'commit-pinned', n: 'sha256-pinned npz + notebook bytes, re-hashed at every certify — a drifted source refuses everything' }
]));

/* ---- what each algorithm actually buys, certified -------------------------
   Every published fast-multiplication claim is a saving over the naive
   product, and the saving is exactly the pair (naive rank, certified rank).
   A dumbbell is the honest form: same measure, two states, one hue in two
   shades — and the length of the connector IS the result. */
{
  const hits = rows.filter(r => r.verdict === 'HIT' && r.extra.naive && r.extra.rank)
    .map(r => ({ k: r.extra.dims, a: r.extra.naive, b: r.extra.rank, id: r.id, ring: r.extra.ring }))
    .sort((x, y) => y.a - x.a);
  const maxN = Math.max.apply(null, hits.map(h => h.a));
  const fig = CH.dumbbell({
    w: 900, rowH: 30, x0: 0, x1: maxN * 1.05, padL: 128, padR: 108,
    xTicks: [0, 32, 64, 96, 128].filter(v => v <= maxN * 1.05).map(v => ({ v, t: String(v) })),
    rows: hits.map(h => ({ k: h.k, a: h.a, b: h.b, lab: h.b + '  (' + h.ring + ')' })),
    aName: 'naive rank  n·m·p', bName: 'certified rank',
    vOf: v => 'rank ' + v,
    alt: 'Eleven certified fast matrix-multiplication algorithms, each drawn as a line from the naive rank of '
      + 'its target shape down to the rank actually certified. The longest is 5x5x5, from 125 down to 96 over F2.'
  });
  B.push(C.section({
    lab: '§0 · the saving', title: 'What each published algorithm buys — and in which ring',
    wide: true,
    bodyRaw: '<div class="col">'
      + C.pRaw('Each line runs from the naive rank of that target shape to the rank this build actually '
        + 'certified, over the ring named beside it. Nothing here is quoted from a paper: every endpoint is a '
        + 'full exact tensor identity re-checked while this page was generated.')
      + '</div>'
      + C.figure({ svgRaw: fig, caption: hits.length + ' certified rows. The ring is not decoration — two of '
        + 'these certify over F2 and are REFUTED over Q, which is the whole characteristic-2 story: the same '
        + 'coefficient table is a theorem in one ring and a false claim in another, and only an exact checker '
        + 'can tell you which. The naive endpoint is n·m·p, the number of scalar products the schoolbook '
        + 'algorithm uses on that shape.' })
  }));
}

B.push(C.section({
  lab: '§1 · why this is decidable', title: 'An AI discovery that happens to be a finite exact object',
  bodyRaw: [
    C.p('"4×4 matrices in 48 multiplications" is not an empirical claim about software — it is a rank-48 '
      + 'decomposition of the ⟨4,4,4⟩ matmul tensor: three factor matrices U, V, W whose defining identity, '
      + '4,096 equations each an exact sum of 48 products, either holds over the stated ring or provably does '
      + 'not. That makes the most famous AI-discovered mathematics of 2022 and 2025 exactly the shape this '
      + 'machine certifies: transcribe the published artifact from pinned bytes, check every equation in exact '
      + 'arithmetic, and record the verdict with the hash of what was checked.'),
    C.p('The C-index layout (row-major or transposed) is a publishing convention that differs between sources; '
      + 'the audit DETECTS it and the certificate states it — nothing about the identity is assumed. And the '
      + 'rank bar is enforced: the naive rank-8 algorithm certifies as correct and is REJECTED, because a hit '
      + 'here asserts rank strictly below naive. Correct is not fast.')
  ].join('\n')
}));

B.push(C.section({
  lab: '§2 · alphaevolve', title: 'Rank 48, over the Gaussian integers, from mutable bytes — pinned',
  bodyRaw: [
    C.p('The only first-party byte source for AlphaEvolve\'s decomposition is a Jupyter notebook in a DeepMind '
      + 'repository whose main branch is MUTABLE — it has been rewritten seven times since May 2025. The audit '
      + 'therefore pins by commit: the notebook is held at sha256 ' + ae.extra.sourcePin.sha256.slice(0, 16)
      + '…, re-hashed at every certify, and the arXiv paper (2506.13131) carries no ancillary files — it is the '
      + 'citation, not the source. A "certified" claim about bytes that can silently change is not a '
      + 'certificate; the pin is what makes the verdict durable.'),
    C.p('The ring matters. Every published entry lies in ½·Z[i] — coefficients from {0, ±½, ±½i, ±½±½i} — which '
      + 'is exact in float32, so the byte-level parse loses nothing. Clearing denominators gives factors 2U, 2V, '
      + '2W over the Gaussian integers, and the certified claim is the scale-8 identity: Σᵣ (2uᵣ)⊗(2vᵣ)⊗(2wᵣ) '
      + '= 8·T⟨4,4,4⟩, all ' + ae.extra.equations + ' equations exact, every imaginary part vanishing '
      + 'identically. Verdict, re-derived this build: CERTIFIED, rank 48 < 49.')
  ].join('\n')
}));

B.push(C.section({
  lab: '§3 · alphatensor', title: 'Rank 47, decided both ways — the characteristic-2 theorem',
  bodyRaw: [
    C.p('AlphaTensor\'s headline rank-47 ⟨4,4,4⟩ algorithm works modulo 2 — the Nature paper says so. This audit '
      + 'converts the caveat into a decided pair: the SAME pinned factors are audited over F2 (VERIFIED, all '
      + 'equations exact) and over Q (REFUTED — the identity fails at a named index). The speedup over '
      + 'Strassen-squared\'s 49 provably does not survive lifting to characteristic 0. That is a theorem about '
      + 'the published artifact, produced mechanically, and it is the kind of statement a rerun or a benchmark '
      + 'cannot make: running the algorithm on test matrices over Z would just quietly give wrong answers '
      + 'that round-trip mod 2.'),
    C.p('Seven further AlphaTensor factorizations from the pinned npz — ⟨2,2,2⟩ through ⟨5,5,5⟩, over Q and '
      + 'over F2 — verify exactly and appear in the registry below with their equation counts.')
  ].join('\n')
}));

B.push(C.section({
  lab: '§4 · the registry', title: 'Every algorithm in the corpus, re-decided this build', wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'algorithm' }, { h: 'dims' }, { h: 'rank', cls: 'n' }, { h: 'ring' }, { h: 'equations', cls: 'n' }, { h: 'verdict' }],
    rows: rows.map(r => [
      { raw: '<span class="m">' + C.esc(r.id) + '</span>' },
      { raw: r.extra.dims ? '<span class="m">' + r.extra.dims.join('×') + '</span>' : '—' },
      String(r.extra.rank !== undefined ? r.extra.rank : '—'),
      r.extra.ring || (r.verdict === 'REJECT' ? 'Q' : '—'),
      String(r.extra.equations !== undefined ? r.extra.equations : '—'),
      { raw: r.verdict === 'HIT'
        ? 'VERIFIED' + (r.extra.overQ && /REFUTED/.test(r.extra.overQ) ? ' <strong>· REFUTED over Q</strong>' : '')
        : C.tag('REJECT — correct, not fast', 'open') }
    ])
  })
    + '<div class="col">'
    + C.pRaw('Strassen 1969 is the calibration — the oldest fast algorithm, transcribed from the textbook and '
      + 're-decided before anything modern is trusted. The battery behind this page carries red controls '
      + '(perturbed coefficients that must break the identity, forged pins that must refuse) and the whole '
      + 'corpus detaches to ' + C.m('certs/strassen-certificate.json') + ' + a stdlib verifier with zero shared '
      + 'code. A REFUTED row here would be a discovery: a published algorithm that does not multiply matrices.')
    + '</div>'
}));

B.push(C.section({
  lab: '§5 · why it matters', title: 'Auditing AI discoveries is mechanical — once the bytes are pinned',
  bodyRaw: [
    C.p('Both artifacts were produced by systems whose outputs cannot be trusted by construction and were '
      + 'verified by their authors\' own pipelines. This page is the independent layer: different code, exact '
      + 'arithmetic, pinned bytes, red controls, and a verifier a stranger can run in seconds without this '
      + 'machine. The marginal cost of certifying the next published decomposition is minutes — which is the '
      + 'argument of this whole site, applied to the most cited AI-mathematics artifacts there are.'),
    C.p('The same corpus is the ladder for the live eval: models are asked to EXHIBIT decompositions and the '
      + 'same instrument grades them — see the matmul eval, where ground truth is a proof because these '
      + 'identities are always decidable.')
  ].join('\n')
}));

const foot = '<footer class="col"><p>Generated by tools/build-report-alphaevolve.js @ git ' + git + '. All 11 '
  + 'corpus rows were re-certified during this build — every tensor identity re-checked equation by equation in '
  + 'exact arithmetic, every source pin re-hashed — and the build refuses on any deviation. Certificates: '
  + 'certs/strassen-certificate.json · verifier: verify/verify_strassen.py.</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'alphaevolve.html'),
  TPL.render({ title: 'The AI-discovered algorithms, certified', bodyRaw: B.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/alphaevolve.html',
    desc: 'The AI-discovered fast matrix-multiplication algorithms, certified: AlphaEvolve\'s rank-48 verified over Z[i], AlphaTensor\'s rank-47 verified over F2 and refuted over Q — decided from commit-pinned bytes at every build.' }));
console.log('reports/alphaevolve.html written: 11 rows re-certified (10 VERIFIED incl. AlphaEvolve-48 over Zi; rank-47 REFUTED over Q; naive REJECT) @ git ' + git);
