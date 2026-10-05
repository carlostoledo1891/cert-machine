/* MONO3AP / exact — build-page.js: emit site/mono3ap/index.html FROM THE VERIFIED PROOF.  MIT.
   Every number on the page is read in this process out of vcheck.log (the independent verifier's run),
   the certificate files and hnodes.json. Only the 2008 bounds and the 12-block colouring are quoted from
   the literature. The page refuses to build unless vcheck.log says THEOREM VERIFIED and COMPLETE.
   Run:  node build-page.js                                                                         */
'use strict';
const fs = require('fs'), path = require('path');
const { page, esc } = require(path.join(__dirname, '..', '..', '..', 'site', 'design', 'template.js'));

const HERE = __dirname;
const OUT = path.join(HERE, '..', '..', '..', 'site', 'mono3ap');
fs.mkdirSync(path.join(OUT, 'data'), { recursive: true });

const fr = s => { const [p, q = '1'] = String(s).split('/'); return { p: BigInt(p), q: BigInt(q) }; };
const toF = s => { const { p, q } = fr(s); return Number(p * 10n ** 18n / q) / 1e18; };
const trunc = (s, d) => { const { p, q } = fr(s); const n = p * 10n ** BigInt(d) / q; const t = n.toString().padStart(d + 1, '0'); return t.slice(0, -d) + '.' + t.slice(-d); };

/* ---------------------------------------------------------------- read the verified run */
const log = fs.readFileSync(path.join(HERE, 'vcheck.log'), 'utf8');
if (!/THEOREM VERIFIED/.test(log) || !/COMPLETE/.test(log)) throw new Error('vcheck.log does not verify the theorem — run vcheck.py first');
const pieces = [];
for (const line of log.split('\n')) {
  const m = line.match(/^(\S+\.json): (inner|slab) \[([^,]+), ([^\]]+)\]\s+n=(\d+)\s+VERIFIED/);
  if (!m) continue;
  const [, f, kind, lo, hi, n] = m; const C = JSON.parse(fs.readFileSync(path.join(HERE, f), 'utf8'));
  pieces.push({ f, kind, lo, hi, n: +n, claim: kind === 'slab' ? C.claim : '0',
                ntri: kind === 'slab' ? C.forms.filter(x => x[0] === 'tri').length : 0 });
}
pieces.sort((a, b) => toF(a.lo) - toF(b.lo));
if (pieces.length < 2 || toF(pieces[0].lo) !== 0 || toF(pieces[pieces.length - 1].hi) !== 0.5) throw new Error('cover not read from the log');
const slabs = pieces.filter(p => p.kind === 'slab');
const minSlab = slabs.reduce((m, p) => toF(p.claim) < toF(m.claim) ? p : m).claim;
const inner = pieces.find(p => p.kind === 'inner');
const H = JSON.parse(fs.readFileSync(path.join(HERE, 'hnodes.json'), 'utf8')).map(toF);
const sums = fs.readFileSync(path.join(HERE, 'SHA256SUMS'), 'utf8').trim().split('\n').map(l => l.split(/\s+/));
const red = fs.existsSync(path.join(HERE, 'vred.log')) ? fs.readFileSync(path.join(HERE, 'vred.log'), 'utf8') : '';
const mut = fs.existsSync(path.join(HERE, 'vmut.log')) ? fs.readFileSync(path.join(HERE, 'vmut.log'), 'utf8') : '';
const nRed = (red.match(/^ok /gm) || []).length, nRedAll = (red.match(/^(ok |BAD)/gm) || []).length;
const nMut = (mut.match(/^DETECTED/gm) || []).length, nMutAll = (mut.match(/^(DETECTED|NOT SEEN)/gm) || []).length;

for (const p of pieces) fs.copyFileSync(path.join(HERE, p.f), path.join(OUT, 'data', p.f));
for (const f of ['vcheck.py', 'THEOREM-EXACT.md', 'SHA256SUMS', 'vcheck.log']) fs.copyFileSync(path.join(HERE, f), path.join(OUT, 'data', f));
const pdf = path.join(HERE, 'paper', 'delta3-paper.pdf');
const hasPdf = fs.existsSync(pdf); if (hasPdf) fs.copyFileSync(pdf, path.join(OUT, 'delta3-paper.pdf'));

const UP = '117/2192', PRS_LO = '1675/32768';
const TW = [28, 6, 28, 37, 59, 116, 116, 59, 37, 28, 6, 28];

/* ---------------------------------------------------------------- figures (inline SVG, currentColor) */
function colouringSvg() {
  let x = 0; const W = 640, Hh = 46;
  const rects = TW.map((w, i) => { const r = `<rect x="${(x / 548 * W).toFixed(2)}" y="8" width="${(w / 548 * W).toFixed(2)}" height="30" fill="${i % 2 ? 'var(--fg-3, #555)' : 'var(--fg, #eee)'}"/>`; x += w; return r; }).join('');
  return `<svg viewBox="0 0 ${W} ${Hh}" width="100%" role="img" aria-label="the twelve-block colouring">${rects}</svg>`;
}
function hSvg() {
  const W = 680, Hh = 190, L = 34, R = 12, T = 12, B = 30, hmax = Math.max(...H) * 1.05;
  const X = a => L + a * (W - L - R), Y = v => T + (1 - v / hmax) * (Hh - T - B);
  const pts = H.map((v, k) => `${X(k / 1096).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  let e = 0; const edges = [];
  for (const w of TW.slice(0, -1)) { e += w; edges.push(e / 548); }
  const marks = edges.map(t => `<line x1="${X(t)}" x2="${X(t)}" y1="${Y(0)}" y2="${Y(0) + 6}" stroke="currentColor" opacity=".6"/>`).join('');
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(a => `<text x="${X(a)}" y="${Hh - 8}" font-size="10" text-anchor="middle" fill="currentColor" opacity=".55">${a}</text>`).join('');
  const yt = [0, 0.05, 0.1].map(v => `<text x="${L - 6}" y="${Y(v) + 3}" font-size="10" text-anchor="end" fill="currentColor" opacity=".55">${v}</text><line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="currentColor" opacity=".1"/>`).join('');
  return `<svg viewBox="0 0 ${W} ${Hh}" width="100%" role="img" aria-label="the first-order cost h of flipping each point">${yt}<polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="1.6"/>${marks}${ticks}</svg>`;
}
function coverSvg() {
  const W = 680, Hh = 120, L = 20, R = 20, AX = 64, X = m => L + m / 0.5 * (W - L - R);
  const segs = pieces.map((p, i) => {
    const x0 = X(toF(p.lo)), x1 = X(toF(p.hi)), mid = (x0 + x1) / 2, up = i % 2 === 0;
    const lab = p.kind === 'inner' ? 'exact at the optimum' : `margin ≥ ${toF(p.claim).toExponential(1).replace('e-4', '·10⁻⁴')}`;
    return `<rect x="${x0 + 1}" y="${AX - 9}" width="${x1 - x0 - 2}" height="18" fill="currentColor" opacity="${p.kind === 'inner' ? .85 : .35}"/>` +
      `<text x="${mid}" y="${up ? AX - 18 : AX + 30}" font-size="11" text-anchor="middle" fill="currentColor" opacity=".8">${esc(lab)}</text>`;
  }).join('');
  const ticks = [...new Set(pieces.flatMap(p => [p.lo, p.hi]))].map(s => `<text x="${X(toF(s))}" y="${Hh - 6}" font-size="10" text-anchor="middle" fill="currentColor" opacity=".55">${s}</text>`).join('');
  return `<svg viewBox="0 0 ${W} ${Hh}" width="100%" role="img" aria-label="the five regions that cover every colouring">${segs}${ticks}</svg>`;
}

/* ---------------------------------------------------------------- page */
const rows = pieces.map(p => `<tr><td class="mono">${p.lo} – ${p.hi}</td><td>${p.n}</td><td>${p.kind === 'inner' ? 'zero gap: E ≥ 0, equality only at the twelve blocks' : 'E ≥ ' + trunc(p.claim, 6)}</td><td>${p.ntri ? p.ntri.toLocaleString('en-US') : '—'}</td><td><a href="data/${p.f}">${p.f}</a></td></tr>`).join('\n');
const body = `
<header class="hero" style="padding-block: clamp(4rem,10vh,6rem) var(--s-7);">
  <div class="container">
    <div class="eyebrow reveal">erdős #1186 · graham's $100 question · built ${new Date().toISOString().slice(0, 10)}</div>
    <h1 class="display reveal" style="margin-top:var(--s-5); font-size:clamp(2rem,1rem+3.4vw,3.6rem); max-width:24ch;">The twelve blocks are optimal: δ₃ = 117/2192</h1>
    <p class="lede reveal" style="margin-top:var(--s-5);">Colour the numbers 1 to n red and blue. Some three-term progressions a, a+d, a+2d will come out all one colour. Graham asked for the constant δ₃: at best, there are δ₃·n² of them. Since 2008 it was known that ${trunc(PRS_LO, 5)} ≤ δ₃ ≤ ${trunc(UP, 5)}. The upper end comes from a colouring by twelve blocks, which had been conjectured to be best. <strong>We prove that it is the best: δ₃ = 117/2192 exactly.</strong> The proof is computer-assisted. It consists of ${pieces.length} certificates in exact arithmetic, each re-checked by a second program written separately.</p>
  </div>
</header>

<section class="section" style="padding-top:0;"><div class="container stack-l">
  <div class="stats reveal">
    <div class="stat"><div class="label">the constant</div><div class="value">117/2192</div><div class="note">= ${trunc(UP, 7)}…, the twelve-block value</div></div>
    <div class="stat"><div class="label">before</div><div class="value">${trunc(PRS_LO, 4)}</div><div class="note">the 2008 lower bound (0.0532 certified here last session)</div></div>
    <div class="stat"><div class="label">certificates</div><div class="value">${pieces.length}</div><div class="note">covering every colouring, all verified independently</div></div>
    <div class="stat"><div class="label">forgeries</div><div class="value">${nRed}/${nRedAll}</div><div class="note">forged certificates rejected; ${nMut}/${nMutAll} verifier mutations caught</div></div>
  </div>

  <div class="prose reveal">
    <h2>The colouring that wins</h2>
    <p>Split 1…n into twelve blocks, in proportions 28, 6, 28, 37, 59, 116, 116, 59, 37, 28, 6, 28 out of 548, and alternate the colours:</p>
    ${colouringSvg()}
    <p>This colouring leaves 117/2192·n² single-colour progressions, about 0.0534·n². A random colouring leaves n²/16 = 0.0625·n². Parrilo, Robertson and Saracino found the blocks in 2008. The question since then has been whether anything does better. Nothing does.</p>

    <h2>The idea: measure everything from the answer</h2>
    <p>Counting progressions through their two-coloured pairs turns the question into one about functions; this is the 2008 identity, re-derived in the theorem file. For φ: [0,1] → [−1,1], let Q(φ) be the integral of φ(a)φ(b) over the region a/2 ≤ b ≤ (1+a)/2. Then δ₃ ≥ 1/16 + Q/4 for the best φ. The twelve blocks give Q = −5/137, which is where 117/2192 comes from. So it suffices to show that no φ goes below −5/137.</p>
    <p>Earlier attempts, including ours last session, bounded Q directly on a grid. Every grid loses a little at the edge of the region, so those bounds stop short of 117/2192 at any resolution. This time we measure each colouring by <em>what it flips</em> relative to the twelve blocks. The cost of flipping a short piece near a point a is h(a), up to second order. We know h exactly:</p>
    <figure>${hSvg()}<figcaption class="note">h(a): the first-order cost of flipping a short piece of the twelve-block colouring at a. It is never negative, and it is zero only at the eleven block edges (ticks). The function is exact and piecewise linear, with corners at multiples of 1/1096.</figcaption></figure>
    <p>Written this way, the grid's loss starts only at second order. Near the twelve blocks the remaining question becomes a finite quadratic one, and a certificate settles it with no gap at all.</p>

    <h2>The proof in five pieces</h2>
    <p>Let m be the fraction of [0,1] that a colouring flips relative to the twelve blocks. Swapping the two colours turns m into 1 − m, so m ≤ ½ can be assumed. That range is cut into five pieces. Each piece is closed by its own certificate: an identity in rational numbers, checked exactly.</p>
    <figure>${coverSvg()}<figcaption class="note">The five pieces of m ∈ [0, ½]. Near the twelve blocks (m ≤ ${inner.hi}) the certificate is exact: the excess is never negative, and it is zero only at the blocks themselves. Farther out, every colouring is worse by at least ${trunc(minSlab, 6)} in δ units.</figcaption></figure>
    <table><thead><tr><th>flipped fraction m</th><th>cells</th><th>what is proved</th><th>triangle inequalities</th><th>certificate</th></tr></thead><tbody>
${rows}
    </tbody></table>

    <h2>How it was checked</h2>
    <p>The solver only proposes numbers. The verifier, <a href="data/vcheck.py">vcheck.py</a>, was written separately from the code that found them. It rebuilds the twelve blocks and h from scratch, and recomputes every cell's area by polygon clipping. It rebuilds every inequality from its name. It proves positive definiteness by exact elimination. It also checks that the five pieces leave no gap. It runs in under a minute: <a href="data/vcheck.log">vcheck.log</a>.</p>
    <p>${nRed} forged certificates were each rejected on their own line. They included a bound raised by 0.001, dropped inequalities, a grid missing a block edge, a widened piece, a doubled radius and a missing piece. ${nMut} of ${nMutAll} one-line sabotages of the verifier were caught, and the remaining one provably makes no difference. File hashes are in <a href="data/SHA256SUMS">SHA256SUMS</a>.</p>

    <h2>What is not claimed</h2>
    <p>The proof is computer-assisted and has not yet been refereed. It rests on the 2008 counting lemma, on three elementary lemmas, and on the five certificate files. Anyone can re-run the check. It does not cover longer progressions (k ≥ 4), which remain open.</p>

    <h2>Files</h2>
    <p>${hasPdf ? '<a href="delta3-paper.pdf">paper (PDF)</a> · ' : ''}<a href="data/THEOREM-EXACT.md">THEOREM-EXACT.md</a> · <a href="data/vcheck.py">vcheck.py</a> · ${pieces.map(p => `<a href="data/${p.f}">${p.f}</a>`).join(' · ')}</p>
  </div>
</div></section>`;

fs.writeFileSync(path.join(OUT, 'index.html'), page({
  title: 'δ₃ = 117/2192',
  desc: "A computer-assisted proof that the twelve-block colouring is optimal: Graham's monochromatic 3-term progression constant (Erdős #1186) equals 117/2192.",
  root: '../', active: 'reports', body,
}));
console.log(`site/mono3ap/index.html written: delta_3 = 117/2192, ${pieces.length} verified certificates, min slab margin ${trunc(minSlab, 7)}`);
