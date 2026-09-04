/* build.js — site/playground/shape-hunt/index.html from out/shapes.json.
   Static. The finding is a negative one and a slider would not help it. */
'use strict';
const fs = require('fs');
const path = require('path');
const HERE = __dirname;
const PG = path.join(HERE, '..');
const { page } = require(path.join(PG, 'design', 'shell.js'));
const { shapePlate, symPlate } = require('./plate.js');
const { ladderChart } = require('./chart.js');
const LAD = require('./ladder.js');

const S = JSON.parse(fs.readFileSync(path.join(HERE, 'out', 'shapes.json'), 'utf8'));
const ST = JSON.parse(fs.readFileSync(path.join(HERE, 'out', 'studies.json'), 'utf8'));
const CSS = fs.readFileSync(path.join(HERE, 'page.css'), 'utf8');
const SHELLCSS = fs.readFileSync(path.join(PG, 'design', 'shell.css'), 'utf8');
const n = (x, d = 4) => (x === null || x === undefined ? '—' : Number(x).toFixed(d));
const short = (id) => id.replace('claude-', '').replace('-4-5', ' 4.5').replace('-5', ' 5');
const fmt = (x) => Number(x).toLocaleString('en-US');

const rows = S.rows;
const real = rows.filter((r) => !r.synthetic);
const gon = rows.find((r) => r.set === 'a perfect 12-gon');
const noise = rows.find((r) => r.set === 'pure noise');
const beats = (k) => real.filter((r) => (k === 'r4' || k === 'r5' ? (r.found.rings[k[1]] || {}).beats : r.found[k].beats)).length;
/* the ratio is against the MATCHED null — best of the same number of random
   permutations — because that is the bar the dihedral candidates actually have
   to clear. The old one compared a minimum against a typical value. */
/* THE RATIO IS AGAINST THE HARDER OF THE TWO NULLS, because a finding here has
   to clear both and the weaker one is not what it survived. */
const ratio = (r) => Math.min(r.symmetry.nullMatched, r.symmetry.nullConfig) / Math.max(r.symmetry.best.defect, 1e-9);
const ratioM = (r) => r.symmetry.nullMatched / Math.max(r.symmetry.best.defect, 1e-9);
const holdsSym = (r) => r.symmetry.beatsBoth;
const cat = (r) => r.nearest;
const catMargin = (r) => r.nearest.nullP05 / r.nearest.best.d;
const catHolds = (r) => catMargin(r) > 1;
const FAM = (name) => (/-gon$/.test(name) && !/bipyramid/.test(name) ? 'cycle'
  : /on a line/.test(name) ? 'line' : /grid/.test(name) ? 'grid'
  : /equidistant/.test(name) ? 'none' : 'solid');
const NG = JSON.parse(fs.readFileSync(path.join(PG, 'neural-geometry', 'out', 'geometry.json'), 'utf8'));
const wanted = Object.fromEntries(NG.sets.map((x) => [x.id, x.shape]));
const famHits = real.filter((r) => wanted[r.set] === FAM(r.nearest.best.name)).length;
const topSym = real.slice().sort((a, b) => ratio(b) - ratio(a));
const ctl = real.filter((r) => r.shape === 'none');
const ptol = (r) => (100 * r.ptolemy.violations) / r.ptolemy.of;
const byPtol = real.slice().sort((a, b) => ptol(b) - ptol(a));

/* ---- the five studies, keyed the way the hunt keyed its own rows ---------- */
const K = (r) => r.set + '\u00b7' + r.model;
const NM = Object.fromEntries(ST.naming.rows.map((r) => [K(r), r]));
const CMR = Object.fromEntries(ST.cm.rows.map((r) => [K(r), r]));
const AU = Object.fromEntries(ST.autos.rows.map((r) => [K(r), r]));
const RT = Object.fromEntries(ST.ratios.rows.map((r) => [K(r), r]));
const nmReal = ST.naming.rows.filter((r) => !r.synthetic);
const cmReal = ST.cm.rows.filter((r) => !r.synthetic);
const auReal = ST.autos.rows.filter((r) => !r.synthetic);
const rtReal = ST.ratios.rows.filter((r) => !r.synthetic && r.found);
const pct = (a, b) => ((100 * a) / b).toFixed(0);

/* 1 · naming */
const lineRows = nmReal.filter((r) => r.shape === 'line');
const cycleRows = nmReal.filter((r) => r.shape === 'cycle');
const revWins = lineRows.filter((r) => r.best.canon === 'reverse');
const revLabels = [...new Set(revWins.map((r) => r.best.kind))];
const revAll = nmReal.filter((r) => r.best.canon === 'reverse');
const predLine = lineRows.filter((r) => r.predicted);
const predLineHits = predLine.filter((r) => r.predicted.beats);
const predCycle = cycleRows.filter((r) => r.predicted);
const predCycleHits = predCycle.filter((r) => r.predicted.beats);
const ctlNm = nmReal.filter((r) => r.shape === 'none');
const floorsRows = real.filter((r) => r.set === 'floors');
const canonRank = Object.entries(ST.naming.canonCount).sort((a, b) => b[1] - a[1]);

/* 2 · the obstruction */
const refuted = cmReal.filter((r) => r.refuted);
const euclid = cmReal.filter((r) => r.euclidean);
const gonCM = CMR['a perfect 12-gon\u00b7not a model'];
const noiseCM = CMR['pure noise\u00b7not a model'];
/* THE CERTIFICATE SHOWN IS THE STRONGEST ONE WHOSE ITEMS ARE WORDS, because a
   witness written +0 +1 -2 -8 over a set whose items are the digits reads as
   arithmetic rather than as a claim about four answers. The strongest overall is
   named in the same breath, so the choice is a typographic one and is admitted. */
const certPool = refuted.filter((r) => r.witness.support === 4).sort((a, b) => b.witness.s - a.witness.s);
const certTop = certPool[0] || refuted.sort((a, b) => b.witness.s - a.witness.s)[0];
const cert = certPool.find((r) => r.witness.items.every((it) => !/^[\d.\s]+$/.test(it.item))) || certTop;
const certRow = real.find((r) => r.set === cert.set && r.model === cert.model);
const certWords = cert.witness.items.map((it) => `<span class="${it.w > 0 ? 'pos' : 'neg'}">${it.w > 0 ? '+' : '\u2212'}${Math.abs(it.w) === 1 ? '' : Math.abs(it.w) + '\u00b7'}\u2009${it.item}</span>`).join('&nbsp; ');
const euclidCtl = euclid.filter((r) => r.shape === 'none');
const euclidOther = euclid.filter((r) => r.shape !== 'none');
const undecided = cmReal.filter((r) => !r.euclidean && !r.refuted);
const undecidedSets = [...new Set(undecided.map((r) => r.set))];
const cmDisagree = cmReal.filter((r) => r.cm.negative !== r.quad.impossible).length;

/* 3 · the ladder */
const L12 = ST.ladder.points['12'].rows;
const LD12 = ST.ladder.distances.rows;
const brk = (rows, k) => LAD.breakingPoint(rows, k);
const BRK = { symmetry: brk(L12, 'symmetry'), catalogue: brk(L12, 'catalogue'), ring5: brk(L12, 'ring5'),
  ring4: brk(L12, 'ring4'), concyclic: brk(L12, 'concyclic'), euclidean: brk(LD12, 'euclidean') };
const LMAX = 100 * ST.ladder.points['12'].levels[ST.ladder.points['12'].levels.length - 1];
const brkPct = (v) => (v === Infinity ? '> ' + LMAX.toFixed(0) + '%' : v === 0 ? 'never' : (100 * v).toFixed(0) + '%');
const placed = ST.ladder.placements.filter((p) => p.symNoise !== null && p.symNoise > 0)
  .sort((a, b) => b.symNoise - a.symNoise);
const placedTop = placed[0];

/* 4 · every permutation */
const auBeats = auReal.filter((r) => r.beats);
const auShuf = auReal.filter((r) => r.beatsShuffled).length;
const auCfg = auReal.filter((r) => r.beatsConfig).length;
const auNonDih = auBeats.filter((r) => !r.best.dihedral);
const auCtl = auReal.filter((r) => r.shape === 'none');
const auCtlBeats = auCtl.filter((r) => r.beats).length;
const auCtlShuf = auCtl.filter((r) => r.beatsShuffled).length;
const auBest = auBeats.slice().sort((a, b) => b.ratio - a.ratio)[0];
const auGroups = auBeats.filter((r) => r.closed === true).length;
const auPermTotal = ST.meta.permTests;
const auByShape = ['line', 'cycle', 'grid', 'tree', 'none'].map((sh) => {
  const g = auReal.filter((r) => r.shape === sh);
  return { shape: sh, of: g.length, beats: g.filter((r) => r.beats).length,
           med: g.length ? g.map((r) => r.ratio).sort((a, b) => a - b)[Math.floor(g.length / 2)] : null };
}).filter((g) => g.of);
const auLine = auByShape.find((g) => g.shape === 'line');
const auNone = auByShape.find((g) => g.shape === 'none');
const auStruct = auByShape.filter((g) => g.shape !== 'none');
const auStructBeats = auStruct.reduce((a, g) => a + g.beats, 0);
const auStructOf = auStruct.reduce((a, g) => a + g.of, 0);
/* the same double bar, applied to the small predicted search on the same sets */
const dihBeats = real.filter(holdsSym).length;
const dihCtl = ctl.filter(holdsSym).length;

/* 5 · the numerology control */
const phiOf = (r) => r.found.find((f) => /golden/.test(f.name));
const rtBest = rtReal.slice().sort((a, b) => phiOf(a).err - phiOf(b).err)[0];
const rtNoise = RT['pure noise\u00b7not a model'];
const rtGon = RT['a perfect 12-gon\u00b7not a model'];
const phiPct = rtReal.map((r) => phiOf(r).percentile).sort((a, b) => a - b);
const phiMed = phiPct[Math.floor(phiPct.length / 2)];
const rtBeatsNoise = phiOf(rtBest).err.toPrecision(3) === phiOf(rtNoise).err.toPrecision(3);
/* TWO COUNTS, NOT ONE SUM. The exhaustive relabelling search tries billions of
   permutations and would swamp everything else if the two were added together —
   a headline number carried by one study is a worse number than two honest
   ones. Shape tests and permutations tried are different objects and are
   reported as different objects. */
const SHAPETESTS = S.meta.totalTests + ST.meta.shapeTests;
const PERMTESTS = ST.meta.permTests;

const fig = (title, sub, svg, note) =>
  `<div class="fig"><div class="cap"><span class="t">${title}</span><span class="s">${sub}</span></div>${svg}<p class="note">${note}</p></div>`;

const tbl = real.slice().sort((a, b) => ratio(b) - ratio(a)).map((r) => {
  const r4 = r.found.rings['4'] || {}, r5 = r.found.rings['5'] || {};
  return `<tr><td>${r.set}</td><td>${short(r.model)}</td>`
    + `<td class="${r.found.concyclic.beats ? 'hit' : 'dim'}">${n(r.found.concyclic.exact)}</td><td class="dim">${n(r.found.concyclic.null)}</td>`
    + `<td class="${r4.beats ? 'hit' : 'dim'}">${n(r4.exact)}</td>`
    + `<td class="${r5.beats ? 'hit' : 'dim'}">${n(r5.exact)}</td>`
    + `<td class="${holdsSym(r) ? 'hit' : 'dim'}">${n(r.symmetry.best.defect)}</td><td class="dim">${n(r.symmetry.nullMatched)}</td><td class="dim">${n(r.symmetry.nullConfig)}</td>`
    + `<td class="${holdsSym(r) ? 'hit' : 'dim'}">${holdsSym(r) ? ratio(r).toFixed(1) + '×' : '—'}</td><td>${NM[K(r)].best.canon}</td>`
    + `<td class="${NM[K(r)].predicted && NM[K(r)].predicted.beats ? 'hit' : 'dim'}">${NM[K(r)].predicted ? (NM[K(r)].predicted.beats ? NM[K(r)].predicted.ratio.toFixed(1) + '×' : '—') : ''}</td>`
    + `<td class="${CMR[K(r)].refuted ? 'hit' : 'dim'}">${CMR[K(r)].refuted ? 'refuted ' + (CMR[K(r)].witness.s / CMR[K(r)].floor).toFixed(0) + '×' : (CMR[K(r)].euclidean ? 'euclidean, dim ' + CMR[K(r)].dim : 'undecided')}</td>`
    + `<td class="${CMR[K(r)].quad.impossible ? 'hit' : 'dim'}">${CMR[K(r)].quad.impossible}/${CMR[K(r)].quad.of}</td>`
    + `<td class="${ptol(r) > 30 ? 'hit' : 'dim'}">${ptol(r).toFixed(0)}%</td>`
    + `<td class="${AU[K(r)] ? (AU[K(r)].beats ? 'hit' : 'dim') : 'dim'}">${AU[K(r)] ? (AU[K(r)].beats ? AU[K(r)].ratio.toFixed(1) + '×' : '—') : '12! too big'}</td>`
    + `<td class="dim">${r.nearest.best.name}</td><td class="${catHolds(r) ? 'hit' : 'dim'}">${catMargin(r).toFixed(2)}×</td></tr>`;
}).join('');

const body = `
<header class="hero"><div class="wrap">
  <div class="eyebrow">instruments · shape hunt · exact arithmetic, no model calls</div>
  <h1>Nothing here is a perfect circle. Some things are closer than luck.</h1>
  <p class="lede">The elicited geometries look like they contain shapes — a pentagon here, four points that fall on a circle there. So this looks, exhaustively: every triple, every quadruple, every five-subset, of every set, from every model, and then every relabelling of the small ones, up to ${fmt(Math.max(...auReal.map((r) => r.perms)))} apiece. <b>${fmt(SHAPETESTS)} shape tests and ${fmt(PERMTESTS)} permutations.</b> At that volume something will be perfect, so nothing counts until it beats the same hunt run on the same numbers with the geometry shuffled out of them — and for ${refuted.length} of the ${cmReal.length} cases the verdict is not a margin at all but <b>a certificate in whole numbers that no such points exist</b>.</p>
</div></header>

<section class="sec"><div class="wrap">
  <div class="eyebrow">first, does the hunter work</div>
  <h2>Two shapes with known answers</h2>
  <p class="why">Before any result about a model, two matrices that are not answers. One is a <b>perfect regular 12-gon</b>, its exact chords rounded onto the same 0–100 integer grid the models reply on. The other is <b>pure noise</b> on that grid. A hunter that cannot find the ring in the first, or that finds one in the second, has nothing to say about anything in between.</p>
  <div class="two">
    ${fig('a perfect 12-gon', 'symmetry ' + n(gon.symmetry.best.defect) + ' vs null ' + n(gon.symmetry.nullP05, 3),
      symPlate(gon.pts, gon.items, gon.symmetry.best.perm, { label: 'A perfect 12-gon with the rotation the hunt recovered drawn as chords.' }),
      `<b>Found, exactly.</b> The best symmetry is <b>${gon.symmetry.best.kind}</b> at a defect of ${n(gon.symmetry.best.defect)} against a random-permutation null of ${n(gon.symmetry.nullP05, 3)}. The chords fan because a rotation moves every point the same way round. Its best quadruple is concyclic to ${n(gon.found.concyclic.exact)} — which it should be, since on a 12-gon every quadruple is.`)}
    ${fig('pure noise', 'symmetry ' + n(noise.symmetry.best.defect) + ' vs null ' + n(noise.symmetry.nullP05, 3),
      shapePlate(noise.pts, noise.items, (noise.found.rings['5'] || {}).sub, { label: 'Pure noise with the most pentagon-like five points the hunt could find in it.' }),
      `<b>And here is the trap.</b> That is the roundest pentagon in ${fmt(noise.tests)} tests on random numbers, and it looks like a pentagon. Its defect is ${n((noise.found.rings['5'] || {}).exact)} against a shuffled null of ${n((noise.found.rings['5'] || {}).null)} — <b>no better than chance</b>. Every shape below is one of these until it proves otherwise.`)}
  </div>
</div></section>

<section class="sec"><div class="wrap">
  <div class="eyebrow">the result nobody wants</div>
  <h2>The polygons are not there.</h2>
  <div class="grid3">
    <div><h3><span class="big">${beats('collinear')} of ${real.length}</span>collinear triples</h3><p>Not one set, in any model, contains three items whose distances add up better than shuffling the same distances would produce.</p></div>
    <div><h3><span class="big">${beats('concyclic')} of ${real.length}</span>concyclic quadruples</h3><p>Ptolemy's equality, exactly. Four survivors out of fifty-four cases, and none of them dramatic.</p></div>
    <div><h3><span class="big">${beats('r5')} of ${real.length}</span>regular pentagons</h3><p>Squares fare a little better at ${beats('r4')}. Equilateral triangles: ${beats('equilateral')}. This is what ${fmt(SHAPETESTS)} shape tests buys.</p></div>
  </div>
  <p class="why" style="margin-top:var(--s-7)"><b>That is the honest headline and it took the whole apparatus to earn.</b> Every one of those hunts finds <em>something</em> — a best quadruple always exists — and every one of them looks convincing drawn. What kills them is the null: run the identical search on the same distances with their geometry shuffled away, and the shuffled version does just as well. The shapes were in the looking.</p>
  <p class="why" style="margin-top:var(--s-4)">Five further studies were run on this data after that headline was written, and they are below in the order they were ranked before any of them was built: <b>name the element</b> (which turned three results into one), <b>the exact obstruction</b> (a certificate instead of a percentage), <b>the noise ladder</b> (every defect here in one unit), <b>every permutation</b> (the search the page could not afford, which found nothing and sent a third null back up to the section above), and <b>ratio hunting</b> (the control that is supposed to fail, and does).</p>
</div></section>

<section class="sec"><div class="wrap">
  <div class="eyebrow">what survives</div>
  <h2>Not the polygons. The groups.</h2>
  <p class="why">One test is different in kind. Instead of searching hundreds of subsets for a shape, it asks whether the <em>whole</em> configuration is preserved by a symmetry: a permutation π with D[π(i)][π(j)] = D[i][j]. Only the 2<em>n</em> − 1 rotations and reflections are tried — ${[...new Set(real.map((r) => r.symmetry.candidates))].sort((a, b) => a - b).join(', ')} candidates depending on the size of the set — so there is almost nothing to overfit, and the answer is a named group element rather than a lucky subset.</p>
  <p class="why" style="margin-top:var(--s-4)"><b>Two nulls were thrown away here before one held, and both replacements are on the page because each change moved the answer.</b> The first compared the BEST of those dihedral permutations against the 5th percentile of single random draws — a minimum against a typical value, which is not a fair fight, and all ${real.length} cases cleared it. The matched null takes the same number of random permutations, takes <em>its</em> minimum, and repeats; under that bar ${real.filter((r) => r.symmetry.beatsMatched).length} survive.</p>
  <p class="why" style="margin-top:var(--s-4)"><b>Then the exhaustive search two sections down showed what a shuffle cannot catch, and a third null was added of the opposite bias.</b> A shuffled matrix has this matrix's numbers and is the distance matrix of nothing at all — no triangle inequality, no embedding — so a matrix that behaves like a real one can beat it for reasons that have nothing to do with symmetry. The configuration null is the mirror: ${fmt(real[0].symmetry.configTrials)} random genuine configurations of the same size, points uniform in a ball of two to six dimensions rounded onto the same grid, given the identical dihedral test. Neither is the harder bar and they are harder in opposite places: on the <em>controls</em> the shuffle is brutal and the configuration null is not — ${ctl.filter((r) => r.symmetry.beatsMatched).length} of ${ctl.length} clear the shuffle against ${ctl.filter((r) => r.symmetry.beatsConfig).length} that clear the configurations — while on the model sets it is the other way round, ${real.filter((r) => r.symmetry.beatsMatched).length} against ${real.filter((r) => r.symmetry.beatsConfig).length}. <b>So a finding has to clear both, ${real.filter(holdsSym).length} of ${real.length} do, and no control is among them.</b> The perfect 12-gon clears both; pure noise clears neither.</p>
  <div class="three">
    ${topSym.slice(0, 3).map((r) => fig(r.set + ' · ' + short(r.model), NM[K(r)].best.canon,
      symPlate(r.pts, r.items, r.symmetry.best.perm, { label: r.set + ' with the recovered symmetry drawn as chords.' }),
      `Defect <b>${n(r.symmetry.best.defect)}</b> against ${n(r.symmetry.nullMatched, 3)} shuffled and ${n(r.symmetry.nullConfig, 3)} configured — <b>${ratio(r).toFixed(1)}× better than the harder of the two</b>.`)).join('')}
  </div>
  <p class="why" style="margin-top:var(--s-6)">
    <b>The compass one is worth stopping on.</b> The element recovered there is <em>rotation by four</em> on eight points — the antipodal map, north↔south and east↔west. Nobody asked about opposites; the model was asked how different each direction is from each other one, one row at a time, and the answers turn out to be invariant under swapping every direction for its opposite.
  </p>
</div></section>

<section class="sec"><div class="wrap">
  <div class="eyebrow">study 1 · the cheapest one, and it was hiding a result</div>
  <h2>Say what the element is.</h2>
  <p class="why">The table above names the winner by its index in a generated list: <b>reflection 9</b> on ten items, <b>reflection 11</b> on twelve, <b>reflection 7</b> on eight. Those are ${revLabels.length} labels and one fact. On ten ordered items <em>i</em> ↦ 9 − <em>i</em>; on twelve, <em>i</em> ↦ 11 − <em>i</em>; on eight, <em>i</em> ↦ 7 − <em>i</em>. Every one of them is <b>reverse the sequence</b> — which is the only symmetry an ordered list has — and the index hid it, so one result found ${revWins.length} times read as ${revLabels.length} different results.</p>
  <div class="grid3">
    <div><h3><span class="big">${revWins.length} of ${lineRows.length}</span>ordered sets reverse</h3><p>Every set whose items have an order — ${[...new Set(lineRows.map((r) => r.set))].join(', ')} — and the element that wins is reversal in ${revWins.length} of the ${lineRows.length} model answers, under ${revLabels.length} different index labels: ${revLabels.join(', ')}.</p></div>
    <div><h3><span class="big">${predLineHits.length} of ${predLine.length}</span>and it was predicted</h3><p>Reversal is not a search result for these sets, it is a <em>prediction</em>: an ordered list has exactly one non-trivial symmetry and you can name it before looking. Named in advance it clears a single-draw null in ${predLineHits.length} of ${predLine.length} cases — ${pct(predLineHits.length, predLine.length)}%.</p></div>
    <div><h3><span class="big">${pct(predCycleHits.length, predCycle.length)}%</span>the cyclic prediction is weaker</h3><p>The matching prediction for a ring is the successor map, rotate-by-one, and it holds in ${predCycleHits.length} of ${predCycle.length} — against ${pct(predLineHits.length, predLine.length)}% for reversal on ordered sets. Models put the months in order more reliably than they close December back onto January, and that gap is now a number about a named group element rather than an impression.</p></div>
  </div>
  <p class="why" style="margin-top:var(--s-7)"><b>The bar has to change when the prediction does, and this is the whole methodological point.</b> A search over 2<em>n</em> − 1 candidates must be judged against the best of 2<em>n</em> − 1 random permutations, because it had that many chances. A prediction had one chance and must be judged against one random draw. Using the search bar on a prediction throws away the entire advantage of having predicted; using the prediction bar on a search is how a page ends up reporting shapes that are not there. Both bars are in the record and every row below says which one it is being held to.</p>
  <div class="three">
    ${floorsRows.map((r) => fig('floors · ' + short(r.model), NM[K(r)].best.canon,
      symPlate(r.pts, r.items, r.symmetry.best.perm, { label: 'The reversal symmetry recovered from ' + short(r.model) + '\u2019s answers about floors of a building.' }),
      `<b>${NM[K(r)].best.words}</b> Defect ${n(r.symmetry.best.defect)} against a single-draw null of ${n(r.symmetry.nullP05, 3)}. The rungs cross an axis because a reflection swaps across one; a rotation would fan.`)).join('')}
  </div>
  <p class="why" style="margin-top:var(--s-6)"><b>All three models, the same element, on the same set.</b> Ground floor with the top floor, one with eight, two with seven. Nobody asked whether the building was symmetric — the models were asked, one pair at a time, how far apart two floors are, and the answers came back invariant under turning the building upside down.</p>
  <div class="words">
    ${canonRank.map(([c, k]) => {
      const ex = nmReal.filter((r) => r.best.canon === c).sort((a, b) => a.best.defect - b.best.defect)[0];
      return `<div class="w"><div class="wk"><b>${c}</b><br>${k} of ${nmReal.length} cases</div><div class="wv">${ex.best.words}<br><span style="color:var(--ink-5)">strongest on ${ex.set} · ${short(ex.model)} at a defect of ${n(ex.best.defect)}, where the generated label is <em>${ex.best.kind}</em></span></div></div>`;
    }).join('')}
  </div>
</div></section>

<section class="sec"><div class="wrap">
  <div class="eyebrow">and the polyhedra</div>
  <h2>Which known shape is this, actually?</h2>
  <p class="why">Several of these sets fit two dimensions poorly, which means real structure in a third — so: a catalogue of shapes with known answers, matched by <b>distance spectrum</b>, which does not care how the vertices are labelled and so can test an icosahedron against twelve items without trying 479 million labellings. The catalogue holds the flat shapes and the degenerate ones beside the solids, because scoring a genuine ring only against polyhedra would report it as a poor icosahedron when the honest answer is that it is an excellent ${gon.n}-gon.</p>
  <p class="why" style="margin-top:var(--s-4)"><b>This null had to be rebuilt too, and thrown away first.</b> Shuffling the distances into new positions is the right null everywhere else here and is worthless for a spectrum: a spectrum <em>is</em> the multiset of distances, so shuffling leaves it identical. It scored the perfect 12-gon at ${n(gon.nearest.best.d)} against a null of ${n(gon.nearest.best.d)} — the same number twice, a test that could never pass or fail. What the question needs is other <em>configurations</em>, not other labellings: how near does a random cloud of the same size get to the closest catalogue member?</p>
  <div class="grid3" style="margin-top:var(--s-7)">
    <div><h3><span class="big">${catMargin(gon).toFixed(0)}×</span>the instrument works</h3><p>The perfect 12-gon is nearest to <b>${gon.nearest.best.name}</b> at ${n(gon.nearest.best.d)}, clearing a random-configuration null of ${n(gon.nearest.nullP05)} by ${catMargin(gon).toFixed(0)} times. Pure noise clears nothing.</p></div>
    <div><h3><span class="big">${Math.max(...real.map(catMargin)).toFixed(2)}×</span>the best a model manages</h3><p>${real.slice().sort((a, b) => catMargin(b) - catMargin(a))[0].set} · ${short(real.slice().sort((a, b) => catMargin(b) - catMargin(a))[0].model)}, nearest to <b>${real.slice().sort((a, b) => catMargin(b) - catMargin(a))[0].nearest.best.name}</b>. Forty-seven times against one and a third: that is the whole answer.</p></div>
    <div><h3><span class="big">${famHits} of ${real.length}</span>even the family is wrong</h3><p>Setting the null aside entirely and asking only whether the nearest catalogue entry is the right <em>kind</em> — a ring for a cycle, a line for a line — it is right ${((100 * famHits) / real.length).toFixed(0)}% of the time. Four families; chance is 25%.</p></div>
  </div>
  <p class="why" style="margin-top:var(--s-7)"><b>So: no polyhedra.</b> ${real.filter(catHolds).length} of the ${real.length} cases clear a 5% bar where ${(0.05 * real.length).toFixed(1)} are expected by chance — and <b>${real.filter((r) => r.shape === 'none' && catHolds(r)).length} of the ${ctl.length} controls clear it too</b>, which settles it. The models' geometries are not Platonic solids, not antiprisms, not grids, and not regular polygons either — not at any margin worth the word. The instrument can find a shape when one is there, by a factor of ${catMargin(gon).toFixed(0)}. There is not one here.</p>
</div></section>

<section class="sec"><div class="wrap">
  <div class="eyebrow">study 2 · a certificate, not a score</div>
  <h2>These answers came from no arrangement of points anywhere.</h2>
  <p class="why">The page used to report that some percentage of quadruples violated Ptolemy's inequality. That is a score, and a score invites the question of how big it has to be. Here is the same question answered instead. For any points at all, in any Euclidean space of any dimension, and any weights <code>v</code> that <b>sum to zero</b>,</p>
  <pre style="margin-top:var(--s-4)">&Sigma;&#8202;<sub>ij</sub> v&#8202;<sub>i</sub> v&#8202;<sub>j</sub> |p&#8202;<sub>i</sub> &minus; p&#8202;<sub>j</sub>|&sup2;  =  &minus;2 |&Sigma;&#8202;<sub>i</sub> v&#8202;<sub>i</sub> p&#8202;<sub>i</sub>|&sup2;  &le;  0</pre>
  <p class="why" style="margin-top:var(--s-4)">— one line of algebra, and it is an <em>identity</em>, so it holds whatever the points are. A single vector of whole numbers summing to zero that makes that sum <b>positive</b> therefore refutes every embedding into every Euclidean space at once. Not a near-miss to be scored against a null: a refutation, checkable with a pencil.</p>

  <div class="cert">
    <div class="ct">certificate of impossibility &middot; ${cert.set} &middot; ${short(cert.model)}</div>
    <div class="cw">v&#8202; = &#8202;${certWords}<br>&Sigma;&#8202;v&#8202;<sub>i</sub> = 0 &nbsp;&nbsp;and&nbsp;&nbsp; &Sigma;&#8202;<sub>ij</sub> v&#8202;<sub>i</sub> v&#8202;<sub>j</sub> d&#8202;<sub>ij</sub>&sup2; = <b>+${fmt(Math.round(Number(cert.witness.Q) / 4))}</b> &gt; 0</div>
    <p class="cq">Written out, that is <code>d(${cert.witness.items.filter((i) => i.w > 0).map((i) => i.item).join(', ')})&sup2; + d(${cert.witness.items.filter((i) => i.w < 0).map((i) => i.item).join(', ')})&sup2;</code> exceeding the sum of the four squared distances that cross between the two pairs — the model has put each pair further apart than the crossings allow. Take those ${cert.witness.support} of the ${cert.n} items, add the squared distances inside each signed group and subtract the ones across, and the answer comes out positive. In any Euclidean arrangement it cannot. <b>So there is no such arrangement</b> — not in the plane, not in three dimensions, not in ten. The model was asked ${fmt((cert.n * (cert.n - 1)) / 2)} separate questions about ${cert.set} and never saw more than two items at a time; ${cert.witness.support} of the answers are jointly impossible.</p>
  </div>

  <p class="why" style="margin-top:var(--s-7)"><b>And this floor is proved rather than measured, which is new on this page.</b> Everywhere else the instrument's floor is sampled: run the test on a shape that is right by construction and refuse to count anything shallower than its own rounding. Here it can be derived. The answers arrive on a grid of step ${cert.gridStep === 1 ? 'one' : 'a half'}, so each is within ${cert.gridStep === 1 ? 'a half' : 'a quarter'} of whatever real number it stands for, which moves that sum by a bounded amount — and any set of answers whose normalised strength exceeds <code>(4h&middot;diam + h&sup2;) / 4&middot;diam&sup2;</code> cannot be the rounding of <em>any</em> Euclidean configuration. No sampling, no percentile, no null. The certificate above sits ${(cert.witness.s / cert.floor).toFixed(0)}× above that bound${cert !== certTop ? `, and it is not the strongest — ${certTop.set} · ${short(certTop.model)} is refuted ${(certTop.witness.s / certTop.floor).toFixed(0)}× over, on four of the ten digits, and was passed over here only because a witness written over numerals reads as arithmetic instead of as a claim` : ''}.</p>

  <div class="grid3" style="margin-top:var(--s-7)">
    <div><h3><span class="big">${refuted.length} of ${cmReal.length}</span>are provably not distances</h3><p>Refuted above the proved floor, with a witness in whole numbers for each. Not "curved", not "noisy": no points exist, in any dimension, whose distances are these.</p></div>
    <div><h3><span class="big">${euclid.length} of ${cmReal.length}</span>are exactly Euclidean</h3><p>${euclidCtl.length} of them are the ${ctl.length} controls — every one of the unrelated nouns and the nonsense strings, in every model, embeds exactly${euclidCtl.length ? ' in ' + [...new Set(euclidCtl.map((r) => r.dim))].join(' and ') + ' dimensions' : ''}. <b>Structure is what breaks the geometry</b>, and now that sentence has a proof under it rather than a percentage.${euclidOther.length ? ' The remaining ' + euclidOther.length + ': ' + euclidOther.map((r) => r.set + ' · ' + short(r.model)).join(', ') + '.' : ''}</p></div>
    <div><h3><span class="big">${gonCM.cm.negative} of ${gonCM.cm.of}</span>the fourth null thrown away</h3><p>The classical Cayley&ndash;Menger determinant, computed exactly in integers, calls that many quadruples of a <em>perfect 12-gon</em> impossible. All of it is rounding. Under the proved floor the same shape reports ${gonCM.quad.impossible}.</p></div>
  </div>

  <p class="why" style="margin-top:var(--s-7)"><b>Three nulls were thrown away building the sections above. This is the fourth, and it is an instrument rather than a null.</b> Menger's theorem says four distances are realisable exactly when the four triangle inequalities hold and the Cayley&ndash;Menger determinant is non-negative — necessary <em>and</em> sufficient, which is strictly more than Ptolemy gives. So it went in, in exact integer arithmetic, and on the perfect 12-gon it declared ${gonCM.cm.negative} of ${gonCM.cm.of} quadruples impossible in a shape that is Euclidean by construction. The determinant was right and the reading was wrong: on a ring every quadruple sits exactly at the degenerate boundary, where a half-unit of rounding decides the sign. The fix is the proved floor, and with it the same instrument reports ${gonCM.quad.impossible} on the 12-gon and ${noiseCM.quad.impossible} of ${noiseCM.quad.of} on pure noise. <b>An exact computation is not the same thing as a correct verdict.</b></p>

  <p class="why" style="margin-top:var(--s-5)"><b>Ptolemy went through the same correction first, and is kept as the older reading.</b> Ptolemy's inequality is one necessary condition on four points, and the first version of that count was worthless for the same reason: on a perfect 12-gon every quadruple sits exactly at equality, so rounding pushed <b>240 of 495</b> a hair below zero in a shape that is Euclidean by construction. The floor there was measured — the worst dip a perfect 12-gon produces on this grid is ${n(S.meta.eps, 5)}, all of it rounding — and with it the 12-gon reports 0 of 495. The percentages in the last column of the table below are that measurement. The certificate above is what replaced it.</p>

  <p class="why" style="margin-top:var(--s-7)"><b>The verdict is three-valued, and the third value is the interesting one.</b> ${refuted.length} refuted, ${euclid.length} exactly Euclidean, and <b>${undecided.length} undecided</b> — sets with exactly one negative direction whose witness is real but sits below the proved floor, so they could still be the rounding of a Euclidean configuration and this instrument will not say either way. They are ${undecidedSets.join(', ')}: the sets whose items carry a strong one-dimensional order, sizes and orbits and a taxonomy. The wheels are refuted, the nonsense embeds exactly, and the ordered magnitudes sit in between and are not decided. Refusing to decide is a verdict, and it is the one that says where to look next.</p>

  <p class="why" style="margin-top:var(--s-5)"><b>What this does not say.</b> Pure noise is refuted too, and hard — ${noiseCM.witness.s.toFixed(3)} against a floor of ${noiseCM.floor.toFixed(4)}. Being non-Euclidean is not evidence of structure; it is evidence of not being a distance matrix, which random numbers also manage. The finding is the <em>split</em>: the sets with structure in them are refuted and the nonsense controls are not, which is the opposite of what a story about models fabricating geometry would predict.</p>
</div></section>

<section class="sec"><div class="wrap">
  <div class="eyebrow">study 3 · one ruler for six tests</div>
  <h2>Every defect on this page, read in percent noise.</h2>
  <p class="why">A symmetry ${ratio(topSym[0]).toFixed(0)}× better than its null and a catalogue match ${catMargin(gon).toFixed(0)}× better than its null are both honest numbers and they are not comparable, because each test has its own null and its own units. So: take the shape whose answer is known and <b>pour noise into it</b>. Every point of the perfect 12-gon is displaced by a uniform draw from a disc of radius <em>&epsilon;</em> times the circle's radius, the distances are recomputed and rounded back onto the same 0&ndash;100 grid, and every test is run again with its own null, ${ST.ladder.points['12'].trials} times at each of ${ST.ladder.points['12'].levels.length} levels. Each test then has a <b>breaking point</b>: the noise at which it loses a shape that is, by construction, still there.</p>
  ${ladderChart(L12, [{ key: 'symmetry', label: 'symmetry' }, { key: 'catalogue', label: 'nearest shape' }, { key: 'ring5', label: 'pentagon' }])}
  <p class="note" style="max-width:70ch;margin-top:var(--s-3);font-size:var(--text-small);color:var(--ink-5)">Median over ${ST.ladder.points['12'].trials} trials at each level, log scale, clipped at 10,000×. The symmetry line begins <em>above</em> the top of the chart: an unperturbed 12-gon has a defect of exactly zero, so its margin over any null is unbounded, and the first plotted point is where the clip is rather than where the value is.</p>
  <div class="grid3" style="margin-top:var(--s-6)">
    <div><h3><span class="big">${brkPct(BRK.symmetry)}</span>the symmetry test</h3><p>It survives the most damage of anything here — the whole configuration has to be wrecked before a rotation stops beating a matched null. That is what testing one global structure instead of searching hundreds of subsets buys.</p></div>
    <div><h3><span class="big">${brkPct(BRK.catalogue)}</span>the shape catalogue</h3><p>Sharper than the symmetry test and it fails sooner, which is the trade every instrument on this page makes. The distance spectrum notices a ring being destroyed well before the group does.</p></div>
    <div><h3><span class="big">${brkPct(BRK.ring5)}</span>the pentagon hunt</h3><p>${BRK.ring5 === 0 ? 'It never sees the ring at all — not even at zero noise, in a shape made of nothing but regular pentagons. Searching 792 five-subsets for the roundest one finds one in the null just as easily, so the margin starts below 1 and stays there.' : 'It loses the ring almost at once. A best-of-792 search is beaten by a best-of-792 search on shuffled numbers as soon as anything is disturbed.'} That is the same negative result the top of this page reports, in units you can feel.</p></div>
  </div>
  <p class="why" style="margin-top:var(--s-7)"><b>Now every result on the page can be quoted in one unit.</b> ${placedTop ? placedTop.set + ' · ' + short(placedTop.model) + '\u2019s symmetry is as strong as a perfect 12-gon with <b>' + (100 * placedTop.symNoise).toFixed(0) + '% noise</b> poured into it' : ''}${placed.length > 1 ? ', and ' + placed[1].set + ' · ' + short(placed[1].model) + '\u2019s is a 12-gon at ' + (100 * placed[1].symNoise).toFixed(0) + '%' : ''}. ${placed.length} of the ${ST.ladder.placements.length} cases with a ladder of their own size land anywhere on it at all; the rest are already past the far end, which is the same statement as "no better than chance" with a number attached.</p>
  <p class="why" style="margin-top:var(--s-4)"><b>The noise goes into the POINTS, not the distances</b>, so a perturbed 12-gon is still a Euclidean configuration and this ladder measures how the shape tests degrade without also breaking the metric under them. The exactness test needs the other kind of damage, so it gets its own ladder where the distances are jittered directly: it holds until <b>${brkPct(BRK.euclidean)}</b>, and every model set that is refuted above is refuted harder than that.</p>
</div></section>

<section class="sec"><div class="wrap">
  <div class="eyebrow">study 4 · ${fmt(auPermTotal)} permutations tried</div>
  <h2>Every permutation, not the twenty-three.</h2>
  <p class="why">The symmetry test tries the 2<em>n</em> − 1 rotations and reflections and nothing else, which is a strength — there is almost nothing to overfit — and a limit: it can only find what it was told to look for. On the ${auReal.length} sets small enough that the whole symmetric group fits in a loop, every permutation is tried instead: <b>${Object.keys(ST.meta.nullsFor).join(', ')} items, so ${Object.keys(ST.meta.nullsFor).map((k) => fmt(Object.values(ST.meta.nullsFor).length && auReal.find((r) => String(r.n) === k) ? auReal.find((r) => String(r.n) === k).perms : 0)).join(', ')} relabellings a search</b> — ${fmt(auPermTotal)} permutations in all once the nulls are counted.</p>
  <p class="why" style="margin-top:var(--s-4)"><b>And this study needed two nulls, for a reason the earlier ones did not raise.</b> Shuffling the distances into new positions is the null used everywhere else here; it destroys the geometry, and it also destroys the <em>metric</em> — a shuffled matrix is not the distance matrix of anything, so a matrix that behaves like one can beat it for reasons having nothing to do with symmetry. So the exhaustive search is also run against random genuine configurations of the same size, points uniform in a ball of two to six dimensions rounded onto the same grid, which carry every constraint a real distance matrix carries and no reason at all to be symmetric. <b>A case counts as surviving only if it clears both.</b> ${auShuf} clear the shuffle, ${auCfg} clear the configurations, ${auBeats.length} clear both.</p>
  <div class="grid3">
    <div><h3><span class="big">${auBeats.length} of ${auReal.length}</span>survive both bars</h3><p>At tens of thousands to millions of tries per search the null gets very much better, and almost nothing clears it. ${auShuf} clear the shuffle alone — the count you would publish if you stopped at one null, and ${auCtlShuf} of those are the nonsense controls.</p></div>
    <div><h3><span class="big">${auNone ? pct(auNone.beats, auNone.of) : '—'}%</span>and the controls do best</h3><p>${auByShape.map((g) => g.shape + ' ' + g.beats + '/' + g.of).join(' · ')}. The strings that are not words survive an exhaustive search at a <em>higher</em> rate than any set with structure in it — ${auStructBeats} of ${auStructOf} against ${auNone ? auNone.beats + ' of ' + auNone.of : ''}. <b>This study found nothing, and that is its result.</b></p></div>
    <div><h3><span class="big">${dihBeats} vs ${auBeats.length}</span>more search, less knowledge</h3><p>The small predicted search separates the sets cleanly on the same data and the same two nulls: ${dihBeats} of ${real.length} survive with ${dihCtl} of ${ctl.length} controls among them. Widen it to every relabelling and the separation is gone. The constraint was doing the work.</p></div>
  </div>
  <p class="why" style="margin-top:var(--s-7)"><b>The winner is usually not a rotation or a reflection, and that is arithmetic, not a discovery.</b> ${auNonDih.length} of the ${auBeats.length} surviving searches are won by a permutation outside the dihedral list — which is what tens of thousands of candidates against a couple of dozen would predict on its own, before any structure is involved. Nothing here is a symmetry nobody predicted; it is a best-of-many, and the null that was given the same many says so.</p>
  <p class="why" style="margin-top:var(--s-5)"><b>The study earned its place by breaking something else.</b> Running it is what showed that a shuffled null is beatable by any matrix that behaves like a real one, which sent the configuration null back up to the symmetry section above and cut its surviving count from ${real.filter((r) => r.symmetry.beatsMatched).length} to ${dihBeats}. A study whose own answer is "nothing" can still be the most useful thing on a page, if what it breaks is a number the page was about to publish. Twelve items were left out on purpose: 12! is 479 million permutations per search and each null needs thousands of searches. That is the exact reason the shape catalogue two sections up matches by distance <em>spectrum</em>, which does not care about labelling at all.</p>
</div></section>

<section class="sec"><div class="wrap">
  <div class="eyebrow">study 5 · the control that is supposed to fail</div>
  <h2>Is anything here the golden ratio? No, and that is a theorem.</h2>
  <p class="why">The question people actually ask of a picture like this is whether the parts are perfectly sized — whether some ratio in it is &phi;, or &radic;2, or &pi;. It is the purest form of the failure mode this page is about, so it belongs here, run properly so that it fails properly.</p>
  <p class="why" style="margin-top:var(--s-4)"><b>One half of the answer needs no search at all.</b> Every distance here is a whole number, or a half, on a 0&ndash;100 grid &mdash; so every ratio of two of them is <em>rational</em>. &phi; is irrational. Therefore no ratio in this data is &phi; — not approximately, not as a matter of measurement, but never: not in any set, from any model, and not in any data of this kind that will ever be collected on a grid of rationals. The only thing a hunt can return is a near-miss, and the size of a near-miss is a fact about how thickly small-denominator rationals lie near the target. It is not a fact about the data.</p>
  <div class="cert" style="border-left-color:var(--ink-5)">
    <div class="ct">the same discovery, twice</div>
    <div class="cw">${rtBest.set} &middot; ${short(rtBest.model)} &nbsp;&nbsp; ${phiOf(rtBest).num}&#8202;/&#8202;${phiOf(rtBest).den} = ${(phiOf(rtBest).r).toFixed(6)} &nbsp;&nbsp; &phi; to <b>${(100 * phiOf(rtBest).err).toFixed(4)}%</b><br>pure noise &nbsp;&nbsp; ${phiOf(rtNoise).num}&#8202;/&#8202;${phiOf(rtNoise).den} = ${(phiOf(rtNoise).r).toFixed(6)} &nbsp;&nbsp; &phi; to <b>${(100 * phiOf(rtNoise).err).toFixed(4)}%</b></div>
    <p class="cq">The best golden-ratio hit anywhere in the elicited data is ${phiOf(rtBest).num}/${phiOf(rtBest).den}${phiOf(rtBest).num === 89 && phiOf(rtBest).den === 55 ? ' — consecutive Fibonacci numbers, which is exactly why it is close' : ''}. <b>The matrix of random numbers contains ${rtBeatsNoise ? 'the identical ratio to the identical accuracy' : 'one just as good'}.</b> Both matrices happen to contain the values ${phiOf(rtBest).num} and ${phiOf(rtBest).den}, and on a 0&ndash;100 grid most matrices do.</p>
  </div>
  <div class="grid3" style="margin-top:var(--s-7)">
    <div><h3><span class="big">${(100 * phiMed).toFixed(0)}%</span>&phi; against arbitrary targets</h3><p>The matched null for a constant is other targets. Draw ${fmt(rtBest.nullTargets)} arbitrary numbers from the same range and hunt each one the same way: &phi;'s near-miss lands at the ${(100 * phiMed).toFixed(0)}th percentile of that pile, across the ${rtReal.length} model cases. It is an ordinary target.</p></div>
    <div><h3><span class="big">${fmt(Math.round(rtReal.reduce((a, r) => a + r.count, 0) / rtReal.length))}</span>ratios per set</h3><p>With that many ratios packed into a range of six, the nearest one to <em>any</em> chosen number is close by spacing alone. The local gap around &phi; in ${rtBest.set} is ${(100 * phiOf(rtBest).localGap).toFixed(3)}% — which is the near-miss, near enough, and it was forced.</p></div>
    <div><h3><span class="big">${rtGon ? (100 * phiOf(rtGon).err).toFixed(2) + '%' : '—'}</span>and the perfect ring is worse</h3><p>The shape that genuinely has structure in it is <em>further</em> from &phi; than the noise is, because its distances are chords of one circle and cannot take arbitrary values. Numerology rewards disorder.</p></div>
  </div>
  <p class="why" style="margin-top:var(--s-7)"><b>This section is on the page because it is the failure mode with the best public relations.</b> Every ingredient of a convincing result is present — an exact ratio of two answers, a famous constant, agreement to one part in ${fmt(Math.round(1 / phiOf(rtBest).err))} — and it is worth nothing, which can be demonstrated in one line beside a matrix of random numbers. The tests above it survive that treatment. That is the only difference between them, and it is the whole page.</p>
</div></section>

<section class="sec"><div class="wrap">
  <div class="eyebrow">the method</div>
  <h2 style="margin-top:var(--s-3)">Screen in floats, decide in rationals</h2>
  <p class="why">The 2D pictures on these pages are a float shadow of something living in four to ten dimensions, so a pentagon spotted in a drawing may not be in the data at all. Every test here is a statement about the distance matrix, which arrived as whole numbers and halves: three points are collinear when the longest side equals the sum of the other two; four are concyclic exactly when Ptolemy's inequality is tight; a subset is a regular k-gon when its distances depend only on how far apart the two items sit around the ring.</p>
  <p class="why" style="margin-top:var(--s-4)">Floats enumerate the candidates — hundreds of subsets per set, fast, and allowed only to <em>prune</em>. Every survivor is then recomputed in exact rationals, and it is the exact number that is printed. That is the same screen-then-certify split the rest of this repository runs on, applied to a question about shapes.</p>
  <p class="why" style="margin-top:var(--s-4)"><b>And the method has a name and an author, which this page did not know when it built it.</b> Hiding the real plot among plots generated under a null and asking whether anyone can pick it out is the <em>lineup protocol</em> — Buja, Cook, Hofmann, Lawrence, Lee, Swayne and Wickham, <em>Statistical inference for exploratory data analysis and model diagnostics</em> (2009), and Wickham, Cook, Hofmann and Buja, <em>Graphical Inference for Infovis</em> (2010), shipped as the R package <code>nullabor</code>. Plots are the test statistics and human cognition is the test. This page reinvented it without the name, and saying so costs nothing.</p>
  <p class="why" style="margin-top:var(--s-4)">What is ours survives the citation and is worth stating precisely: <b>the observer is a machine rather than a human panel</b>, so the comparison is a number instead of a judgement; <b>the statistic is decided in exact rationals</b> rather than judged by eye; and <b>the nulls are matched to the size of the search</b> — best-of-many against best-of-the-same-many — which is the correction that took the symmetry count from 40 of 54 to 24. An automated lineup with an exact test statistic is a defensible thing to have built. Inventing null-controlled visual inference is not.</p>

  <p class="why" style="margin-top:var(--s-4)"><b>What this is not.</b> It is not a claim that models have no geometry — the pages next door measure plenty. It is a claim about a specific and seductive kind of finding: that a beautiful subset picked out of five hundred is not evidence, and that the way to tell is to run the identical search on the same numbers with the structure removed. Most of what looked like a shape here did not survive that, and the page leads with the count of what did.</p>

  <div class="tw"><table><thead><tr><th>set</th><th>model</th><th>concyclic</th><th>null</th><th>4-gon</th><th>5-gon</th><th>symmetry</th><th>shuffled null</th><th>configured null</th><th>ratio, both</th><th>element</th><th>predicted</th><th>exact verdict</th><th>impossible 4s</th><th>ptolemy</th><th>all n!</th><th>nearest shape</th><th>margin</th></tr></thead><tbody>${tbl}</tbody></table></div>

  <pre>node playground/shape-hunt/run.js            # ${fmt(S.meta.totalTests)} tests, no network
node playground/shape-hunt/run-studies.js   # the five studies, ${fmt(ST.meta.tests)} more, ${ST.meta.seconds} s
node playground/build.js</pre>
</div></section>

<footer class="foot"><div class="wrap"><div class="line">
  <span>cert-machine / instruments</span>
  <a href="../index.html">all nine instruments</a>
  <a href="../neural-geometry/index.html">where the geometries came from</a>
  <span>hunted ${S.meta.date} · studies ${ST.meta.date}</span>
</div></div></footer>`;

function build(OUT) {
  const html = page({
    title: 'Nothing here is a perfect circle · instruments',
    desc: 'Exhaustive exact tests for hidden polygons in geometries elicited from language models — the nulls that had to be rebuilt, the group elements named in words, and a whole-number certificate that some of the answers came from no arrangement of points anywhere.',
    root: '../', here: 'shape-hunt', body,
    script: `<style>${SHELLCSS}\n${CSS}</style>`,
  });
  const dir = path.join(OUT, 'shape-hunt');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { bytes: html.length, cases: rows.length, tests: SHAPETESTS, perms: PERMTESTS };
}

function cardArt() {
  const r = topSym[0];
  return symPlate(r.pts, r.items, r.symmetry.best.perm, { size: 560, pad: 96, label: 'The symmetry recovered from a model’s own answers, drawn as the chords it moves each item along.' });
}

module.exports = { build, cardArt, S, ST, topSym, real, beats, ratio, SHAPETESTS, PERMTESTS };
