/* build.js — site/playground/affect/index.html.

   Crossed from the bench (see PROVENANCE.json), page rebuilt here.

   Twelve feelings, placed by pairwise questions alone. Then the circumplex axes
   — pleasantness and activation — recovered from a SECOND question set with no
   words in common with the first, and landing on the pairwise plane's own
   leading principal axis for all three models independently. Then the same
   twelve asked again under six moods, with twelve clock hours carried through
   the identical pipeline as a control that has no business moving.

   The control is the page. A mood effect that also moves the clock is not a
   mood effect, and one model's clock moves by 69 to 85 per cent.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const HERE = __dirname;
const PG = path.join(HERE, '..');
const { page } = require(path.join(PG, 'design', 'shell.js'));
const GR = require(path.join(PG, '..', 'design', 'grammar.js'));    /* the ink-* classes the tied trees wear */
const { mstUnique } = require(path.join(PG, 'mst.js'));            /* one uniqueness test for every tree drawn */
/* WARRANT v2 rule 3 (2026-10-28) — THE TREES. The record's cells carry no order, so the lifted plate draws the clock
   control's minimum spanning tree; decide-mood.js builds it with a strict "<", and where two edges tie a tie-break
   picked it: one of several, CHOSEN, dotted. plate.js is crossed byte for byte (PROVENANCE.json), so plate() is
   wrapped here BEFORE page.js reads it (it destructures it at load); the wrapper only adds a class to the tree it was
   handed, and the counts are gated against the record below. */
const PLATE = require('./plate.js');
const trees = { drawn: 0, tied: 0, cls: GR.pick(1.2) === GR.PICK ? 'ink-chosen' : 'ink-chosen-sm' };   /* .mst is 1.2 px (page.js) */
{
  const plate0 = PLATE.plate;
  PLATE.plate = (rec, opts) => {
    const svg = plate0(rec, opts);
    if (!(rec && rec.pts && !rec.order && rec.mst)) return svg;
    trees.drawn++;
    if (mstUnique(rec.D, rec.mst)) return svg;
    trees.tied++;
    if (svg.split('class="mst"').length !== 2) throw new Error('affect: the lifted plate no longer draws one class="mst" path; re-read plate.js');
    return svg.replace('class="mst"', `class="mst ${trees.cls}"`);
  };
}
const A = require('./page.js');
const PROV = JSON.parse(fs.readFileSync(path.join(HERE, 'PROVENANCE.json'), 'utf8'));
const BENCHCSS = fs.readFileSync(path.join(PG, 'design', 'bench.css'), 'utf8');
const M = A.M;
const spend = (M.spend || []).reduce((a, x) => a + x.usd, 0);
const moods = (M.moods || []).map((m) => m.id || m);

const head = `
<header class="hero"><div class="container">
  <div class="eyebrow">instruments · affect · ${moods.length} moods × ${M.models.length} models · $${spend.toFixed(2)}, already spent</div>
  <h1 class="display mt4">The geometry of feeling</h1>
  <p class="lede mt6">Twelve feelings, placed by asking only how different each pair is. Then the two axes psychology has used for fifty years — <b>pleasantness and activation</b> — asked separately, in a question set with no words in common with the first, and checked against the plane the pairwise table already fixed. Then the whole thing again under six moods, with twelve clock hours carried through the identical pipeline as a control that has no business moving.</p>
  <div class="hero-meta">
    <span class="item"><span class="k">moods</span><span class="v">${moods.join(' · ')}</span></span>
    <span class="item"><span class="k">models</span><span class="v">${M.models.map((m) => m.label).join(' · ')}</span></span>
    <span class="item"><span class="k">the control</span><span class="v">twelve hours of a clock</span></span>
  </div>
</div></header>`;

/* ===================================================================== WARRANT v2 (2026-10-28) ===============
   page.js is LIFTED (PROVENANCE.json pins it), so nothing below edits it: the shell takes its body and rewrites
   named passages, each through patch(), which refuses unless its anchor occurs exactly once — so a re-lift that
   moves a sentence stops the build instead of leaving a stale correction or a double one. What the shell found,
   reading the lifted page against its own record:

   1. A HIDDEN MARGIN. The verdict row ("anything above the floor") is page.js's REAL(): mean gap > 2.5 × the
      floor, fixed before the numbers were read — a CHOSEN input the page never printed. Its prose reads the bar as
      the floor itself ("a mood effect smaller than that floor is not an effect"; the bars' tick is drawn at 1×), and
      at 1× two of its sentences were false: the clock's mean shift is ABOVE every model's floor (O 0.48% against
      0.42%, S 11.4% against 11.0%, H 77.0% against 54.0%), not "inside" it; and Sonnet's cell said "its own noise
      is larger" of a 13.0% shift against an 11.0% floor. Both verdicts hold given 2.5×, so they now say so.
   2. FLOAT CALLED EXACT. "Every decision after that is exact arithmetic on integers": the two exact decisions are
      the triangle gate and the signature (decide.js); every map, order, axis, fit, gap, floor, rank and z on the
      page is float. And "effective rank 9, 9, 10 and 11%, 9%, 23% negative mass … is the exact statement" — those
      are the float spectrum; the exact statement is the signature, which the closing paragraph said was "printed
      above" and was printed nowhere. It is printed now, as a row of the table.
   3. A TYPED BASELINE. "A scrambled control scores 6 of 12" has no record here; a random order scores 8.6 on
      average under the same statistic (computed below, from one seed), and 6 or fewer about one time in seventy.
   4. A READING PICKED AFTER LOOKING. "about a one-in-1,700 coincidence" is 12³: this mood, this end of the
      ranking. The page's own test is either end, over five moods; that reading is about one in 170.
   Nothing here is red: the one refutation on the page — "a plane it is not" — is reached by a signature, with no
   single object to point at, and the circumplex it answers is a claim about human affect, another record.     */
const W = require(path.join(PG, 'warrant.js'));
const CH = (t) => W.value(t, W.CHOSEN);   /* the margin page.js's REAL() fixes in its code: no record holds it */
/* D10, R23, R30 (2026-10-30). Every printed value carries the address of the record cell it is, or of the cells it is
   computed from, in the record page.js reads (out/mood-geometry.json, pinned in PROVENANCE.json); every figure names
   that record and the check below that would stop it. A cell printed as the record holds it is W.val (tools/check-marks.js
   re-reads it); a number computed from cells (a fraction printed as a percentage, a mean, a count) is derived: [its cells]. */
const RD = require(path.join(PG, '..', 'design', 'record.js'));
const DC = require(path.join(PG, '..', 'design', 'components.js'));
/* REDRAWN IN TOKENS (2026-10-30, the operator: the instruments take the light theme). page.js is lifted and keeps its
   literal screen inks (#f6f6f8 strokes, a #0a0a0c hollow point); the page, its sheet and its card go out through
   playground/design/inks.js, which re-points each at the token holding that very value: the same pixels in the dark,
   ink on paper in the light. */
const INK = require(path.join(PG, 'design', 'inks.js'));
const REC = 'playground/affect/out/mood-geometry.json';
const K = RD.key, at = (ptr) => `${REC}#${ptr}`;
const cellP = (mood, sub, m, rest) => `/cells/${K(`${mood}|${sub}|${m.id}`)}/${rest}`;
const cxP = (m, rest) => `/circumplex/${K(`neutral|${m.id}`)}/${rest}`;
const effP = (mood, sub, m, rest) => `/effects/${K(`${mood}|${sub}|${m.id}`)}/${rest}`;
const salP = (mood, m, rest) => `/salience/${K(`${mood}|${m.id}`)}/${rest}`;
const floorP = (m) => `/floor/${K(m.id)}`;
/* a record cell printed by a record.js format; `was` is the text page.js printed, which must be what the record prints */
function V(was, ptr, fmt, standing = W.COMPUTED, why) {
  const now = RD.print(RD.read(REC, ptr), fmt, W.NAME[standing].toLowerCase());
  if (was !== undefined && was !== now) throw new Error(`affect: page.js printed ${JSON.stringify(was)} where ${ptr} prints ${JSON.stringify(now)} (${fmt})`);
  return W.val({ rec: { path: REC, ptr }, standing, fmt, why });
}
/* a value computed from cells: the text, the cells it is computed from, and the text page.js printed (must agree) */
function DV(was, text, ptrs, standing = W.COMPUTED, title) {
  if (was !== undefined && was !== text) throw new Error(`affect: page.js printed ${JSON.stringify(was)} where the record gives ${JSON.stringify(text)}`);
  return W.value(text, standing, { derived: ptrs.map(at), title });
}
const MODELS = M.models, AF = M.affect;
const pct = (x, d = 0) => `${(100 * x).toFixed(d)}%`;
const moodsRun = M.moods.filter((x) => x.prefix && Object.keys(M.cells).some((k) => k.startsWith(x.id + '|')));
const floorOf = (m) => M.floor[m.id];
const gapsOf = (sub, m) => moodsRun.map((x) => M.effects[`${x.id}|${sub}|${m.id}`].gap);
const meanGap = (sub, m) => { const v = gapsOf(sub, m); return v.reduce((a, b) => a + b, 0) / v.length; };
/* the margin page.js's REAL() applies; gated below against the words it rendered, so the two cannot disagree */
const MARGIN = 2.5;
const WORD = (n) => ['none', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'][n] || String(n);

function patch(s, from, to, what) {
  const i = s.indexOf(from);
  if (i < 0 || s.indexOf(from, i + from.length) >= 0) throw new Error(`affect: ${what} — the lifted passage moved in page.js (found ${i < 0 ? 'none' : 'twice'}); re-read it before patching`);
  return s.slice(0, i) + (typeof to === 'function' ? to(from) : to) + s.slice(i + from.length);
}
/* one kind of readout, in page.js's order: the k-th match must be exactly list[k].from, which is what page.js prints from
   the record, and becomes list[k].to, the same text with every number marked and addressed; the count is gated */
function seq(s, re, list, what) {
  let k = 0;
  const out = s.replace(re, (whole) => {
    const it = list[k++];
    if (!it || whole !== it.from) throw new Error(`affect: ${what} #${k} reads ${JSON.stringify(whole)}, the record gives ${it ? JSON.stringify(it.from) : 'nothing more'}; re-read page.js`);
    return it.to;
  });
  if (k !== list.length) throw new Error(`affect: expected ${list.length} ${what}, found ${k}`);
  return out;
}
/* one row of a grid-t table: its label and one cell per model, each cell rewritten */
function row(s, label, fn) {
  const re = new RegExp(`<div class="h">${label.replace(/[()]/g, '\\$&')}</div>` + MODELS.map(() => '<div( class="hit")?>([^<]*)</div>').join(''));
  const m = s.match(re);
  if (!m || s.indexOf(m[0], m.index + 1) >= 0) throw new Error(`affect: the "${label}" row moved in page.js`);
  const cells = MODELS.map((_, i) => m[2 + 2 * i]);
  return s.replace(m[0], fn(cells, m[0]));
}

/* ---- the facts each rewritten sentence rests on, gated ---------------------------------------------------- */
const sig = MODELS.map((m) => M.cells[`neutral|affect|${m.id}`].signature);
const gate = MODELS.map((m) => M.cells[`neutral|affect|${m.id}`].gate);
if (!sig.every((g) => g.q > 0) || !gate.every((g) => g.badTriples > 0)) throw new Error('affect: a table is Euclidean or metric now; rewrite "but a plane"');
const clockIn = MODELS.every((m) => meanGap('clock', m) < MARGIN * floorOf(m));
const clockAbove = MODELS.filter((m) => meanGap('clock', m) > floorOf(m));
if (!clockIn || clockAbove.length !== MODELS.length) throw new Error('affect: the control is no longer inside the margin and above the floor in every model; rewrite the control note');
const real = MODELS.map((m) => meanGap('affect', m) > MARGIN * floorOf(m));
const nearReal = MODELS.filter((m, i) => !real[i] && meanGap('affect', m) > floorOf(m));
if (!nearReal.length) throw new Error('affect: no model sits between the floor and the margin; the Sonnet correction is moot');
const tickBars = MODELS.flatMap((m) => gapsOf('clock', m).map((g) => [g, floorOf(m)]));
const clearTick = tickBars.filter(([g, f]) => g > f).length, clearMargin = tickBars.filter(([g, f]) => g > MARGIN * f).length;
/* the scrambled baseline, page.js's own statistic (decide-mood.js cyclicOrder) on random orders from ONE seed — an
   estimate among the estimates other seeds give, so CHOSEN, and drawn dotted */
const scrambled = (() => {
  const n = AF.length, T = 20000; let s = 20261028 >>> 0, tot = 0, le6 = 0;
  const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  for (let t = 0; t < T; t++) {
    const p = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
    let best = n;
    for (const q of [p, p.slice().reverse()]) for (let sh = 0; sh < n; sh++) { let w = 0; for (let k = 0; k < n; k++) if (q[(sh + k) % n] !== k) w++; if (w < best) best = w; }
    tot += best; if (best <= 6) le6++;
  }
  return { T, mean: tot / T, le6: le6 / T };
})();
if (!(scrambled.mean > 6 && MODELS.every((m) => M.circumplex[`neutral|${m.id}`].order.outOfPlace === 0))) throw new Error('affect: the scrambled baseline or the order moved; rewrite "the test"');
/* the tether plates (R30, 2026-10-30): page.js's axes note reads "two question sets with no words in common, agreeing
   about where twelve feelings are", which holds while both axes line up; at r below 0.8 on either it stops */
const R_MIN = 0.8;
for (const m of MODELS) {
  const o = M.circumplex[`neutral|${m.id}`];
  if (!(o.rx >= R_MIN && o.ry >= R_MIN)) throw new Error(`affect: ${m.label}'s axes line up with its pairwise map at r = ${o.rx.toFixed(2)} / ${o.ry.toFixed(2)}, below ${R_MIN}; rewrite "the axes"`);
}
const ranks = MODELS.map((m) => M.salience[`urgent|${m.id}`].rank), nItems = M.salience[`urgent|${MODELS[0].id}`].n;
const sig2 = (x) => Number(x.toPrecision(2)).toLocaleString('en-US');
const oneIn = nItems ** MODELS.length, eitherEnd = 1 / (1 - (1 - 2 / oneIn) ** moodsRun.length);
if (!ranks.every((r) => r === 1) || sig2(oneIn) !== '1,700') throw new Error('affect: the salience ranks or the 1-in-1,700 moved; rewrite the salience note');

let sections = (() => { const i = A.body.indexOf('<section class="section'); return i < 0 ? A.body : A.body.slice(i); })();

/* 2: what is exact on this page, and what is float — said once, where the integer table is introduced */
sections = patch(sections, 'every decision after that is exact arithmetic on integers, as on <a href="../neural-geometry/index.html">the previous page</a>.',
  'two decisions about that table are exact arithmetic on integers, as on <a href="../neural-geometry/index.html">the previous page</a>: whether it is a distance at all, triple by triple, and its signature. Everything placed, fitted or aligned after that &mdash; every map, order, axis, gap, floor and rank below &mdash; is floating point: computed, not decided, and underlined dashed where the tables and captions print it. Each integer is also one sampled answer, so what a table says about a model rests on that sample; the noise floor further down is the page&rsquo;s own measure of how far a second sample moves.',
  'the exact-arithmetic sentence');
sections = patch(sections, 'Whether they agree is not a thing either was asked.</p>',
  (f) => f + W.legendHtml({ compact: true }), 'the legend anchor');

/* the readouts: every float in them COMPUTED, each with its address. The nine plate captions, in page.js's order: the
   affect maps, the tethers, the control plates. "order exact" is a verdict word read off float angles (decide-mood.js
   cyclicOrder on the eigensolver's view): exactly the circumplex order, computed rather than decided, and on a page
   about exact rationals the word needs the dash to say which "exact" it is */
const gapPs = (sub, m) => moodsRun.map((x) => effP(x.id, sub, m, 'gap'));
sections = seq(sections, /<span class="fit">.*?<\/span>/g, [
  ...MODELS.map((m) => {
    const r = M.cells[`neutral|affect|${m.id}`].fits.cycle.resid;
    return { from: `<span class="fit">order exact · cycle ${pct(r)}</span>`,
      to: `<span class="fit">${DV(undefined, 'order exact', [cxP(m, 'order/exact')])} · cycle ${DV(undefined, pct(r), [cellP('neutral', 'affect', m, 'fits/cycle/resid')])}</span>` };
  }),
  ...MODELS.map((m) => {
    const o = M.circumplex[`neutral|${m.id}`];
    return { from: `<span class="fit">r = ${o.rx.toFixed(2)} / ${o.ry.toFixed(2)} · residual ${pct(o.resid)}</span>`,
      to: `<span class="fit">r = ${V(o.rx.toFixed(2), cxP(m, 'rx'), 'fixed:2')} / ${V(o.ry.toFixed(2), cxP(m, 'ry'), 'fixed:2')} · residual ${DV(undefined, pct(o.resid), [cxP(m, 'resid')])}</span>` };
  }),
  ...MODELS.map((m) => {
    const r = M.cells[`neutral|clock|${m.id}`].fits.cycle.resid;
    return { from: `<span class="fit">cycle ${pct(r)}</span>`, to: `<span class="fit">cycle ${DV(undefined, pct(r), [cellP('neutral', 'clock', m, 'fits/cycle/resid')])}</span>` };
  }),
], 'figure captions');
/* the two deformation walls (the clock first, then the affect map), model by model, mood by mood; swell is the cell
   itself, printed to two places, its × outside the value */
sections = seq(sections, /<div class="wv">.*?<\/div>/g, ['clock', 'affect'].flatMap((sub) => MODELS.flatMap((m) => moodsRun.map((x) => {
  const e = M.effects[`${x.id}|${sub}|${m.id}`];
  return { from: `<div class="wv">gap ${pct(e.gap)} &middot; swell ${e.swell.toFixed(2)}&times;</div>`,
    to: `<div class="wv">gap ${DV(undefined, pct(e.gap), [effP(x.id, sub, m, 'gap')])} &middot; swell ${V(e.swell.toFixed(2), effP(x.id, sub, m, 'swell'), 'fixed:2')}&times;</div>` };
}))), 'deformation readouts');
sections = seq(sections, /<span class="bv">.*?<\/span>/g, M.subjects.flatMap((S) => MODELS.flatMap((m) => moodsRun.map((x) => {
  const e = M.effects[`${x.id}|${S.id}|${m.id}`];
  return { from: `<span class="bv">${pct(e.gap)}</span>`, to: `<span class="bv">${DV(undefined, pct(e.gap), [effP(x.id, S.id, m, 'gap')])}</span>` };
}))), 'bar values');
sections = seq(sections, /rank \d+ of \d+ &middot; z = -?\d+\.\d/g, moodsRun.flatMap((x) => MODELS.map((m) => {
  const t = M.salience[`${x.id}|${m.id}`];
  return { from: `rank ${t.rank} of ${t.n} &middot; z = ${t.z.toFixed(1)}`,
    to: `${DV(undefined, `rank ${t.rank} of ${t.n}`, [salP(x.id, m, 'rank'), salP(x.id, m, 'n')])} &middot; z = ${V(t.z.toFixed(1), salP(x.id, m, 'z'), 'fixed:1')}` };
})), 'salience cells');

/* the axis table: float rows COMPUTED, the triangle count decided, and the signature the page promised */
const AXIS = {
  'pleasantness axis, r': (m, c) => V(c, cxP(m, 'rx'), 'fixed:2'),
  'activation axis, r': (m, c) => V(c, cxP(m, 'ry'), 'fixed:2'),
  'residual after alignment': (m, c) => DV(c, pct(M.circumplex[`neutral|${m.id}`].resid), [cxP(m, 'resid')]),
  'effective rank of the table': (m, c) => V(c, cellP('neutral', 'affect', m, 'spectrum/effRank'), 'int'),
  'negative mass': (m, c) => DV(c, pct(M.cells[`neutral|affect|${m.id}`].spectrum.negMass, 1), [cellP('neutral', 'affect', m, 'spectrum/negMass')]),
};
for (const [L, f] of Object.entries(AXIS))
  sections = row(sections, L, (cells) => `<div class="h">${L}</div>` + cells.map((c, i) => `<div>${f(MODELS[i], c)}</div>`).join(''));
sections = row(sections, 'triples breaking the triangle', (cells, all) => all
  + `<div class="h">exact signature (p, q, z)</div>` + sig.map((g) => `<div>(${g.p}, ${g.q}, ${g.z})</div>`).join(''));

/* 1: the verdict table — numbers COMPUTED, the margin named, Sonnet's cell true */
const VERDICT = {
  'noise floor — two sessions, same question': (m, c) => DV(c, pct(floorOf(m), 1), [floorP(m)]),
  'the control, mean over five moods': (m, c) => DV(c, pct(meanGap('clock', m), 1), gapPs('clock', m)),
  'the affect map, mean over five moods': (m, c) => DV(c, pct(meanGap('affect', m), 1), gapPs('affect', m)),
};
for (const [L, f] of Object.entries(VERDICT))
  sections = row(sections, L, (cells) => `<div class="h">${L}</div>` + cells.map((c, i) => `<div>${f(MODELS[i], c)}</div>`).join(''));
sections = row(sections, 'anything above the floor', (cells) => {
  const was = MODELS.map((m, i) => (real[i] ? 'the feelings, yes' : 'no — its own noise is larger'));
  if (cells.join('|') !== was.join('|')) throw new Error('affect: page.js\'s verdict row no longer matches a ' + MARGIN + '× margin');
  return `<div class="h">above the floor, <em>given</em> a ${CH(MARGIN + '×')} margin</div>` + MODELS.map((m, i) => {
    const g = meanGap('affect', m), f = floorOf(m);
    return real[i] ? '<div class="hit">the feelings, yes</div>'
      : g > f ? `<div>no &mdash; ${DV(undefined, (g / f).toFixed(1) + '×', [...gapPs('affect', m), floorP(m)])} its floor</div>` : '<div>no &mdash; its own noise is larger</div>';
  }).join('');
});
const vs = (m, sub) => `${m.short} ${DV(undefined, pct(meanGap(sub, m), 1), gapPs(sub, m))} against ${DV(undefined, pct(floorOf(m), 1), [floorP(m)])}`;
sections = patch(sections, `<b>the control</b> does not move. For every model the clock's mean shift under mood sits inside that model's own run-to-run noise &mdash; ${MODELS.map((m) => `${m.short} ${pct(meanGap('clock', m), 1)} against ${pct(floorOf(m), 1)}`).join(', ')}.`,
  `<b>the control</b> does not move, <em>given the margin the verdict row names: ${CH(MARGIN + '×')} the floor, fixed before the numbers were read</em>. For every model the clock's mean shift under mood is inside ${MARGIN}&times; that model's own run-to-run noise &mdash; ${MODELS.map((m) => vs(m, 'clock')).join(', ')} &mdash; and above the noise itself in all ${WORD(MODELS.length)}, so read against the floor alone, as the bars below draw it, this sentence would be false.`,
  'the control note');
const tickPs = [...MODELS.flatMap((m) => gapPs('clock', m)), ...MODELS.map(floorP)];
sections = patch(sections, 'It is not responding to the mood.', '<em>Given that margin</em>, it is not responding to the mood.', 'the Haiku note');
sections = patch(sections, 'A bar that does not clear its own tick is not showing you anything.</p>',
  `A bar that does not clear its own tick is not showing you anything &mdash; and clearing it is not enough: ${DV(undefined, String(clearTick), tickPs)} of the ${tickBars.length} control bars clear their tick, and ${clearMargin ? DV(undefined, String(clearMargin), tickPs) + (clearMargin === 1 ? ' clears' : ' clear') : 'none clears'} ${MARGIN}&times; it, the margin the verdicts use.</p>`,
  'the bars caption');

/* 2: the signature is the exact statement; the spectrum measures how far */
sections = patch(sections, `The tables carry effective rank ${MODELS.map((m) => M.cells[`neutral|affect|${m.id}`].spectrum.effRank).join(', ')} and ${MODELS.map((m) => pct(M.cells[`neutral|affect|${m.id}`].spectrum.negMass, 0)).join(', ')} negative mass, which is the exact statement that no arrangement of points in any Euclidean space has these distances.`,
  `The exact statement is the signature, decided by exact symmetric congruence &mdash; ${sig.map((g) => `(${g.p}, ${g.q}, ${g.z})`).join(', ')}: ${sig.map((g) => g.q).join(', ')} directions of negative inertia, so no arrangement of points in any Euclidean space has these distances &mdash; and the triangle count says more: ${gate.map((g) => g.badTriples).join(', ')} of ${gate[0].totTriples.toLocaleString('en-US')} ordered triples break it, so no metric space has them either. The effective rank ${MODELS.map((m) => V(undefined, cellP('neutral', 'affect', m, 'spectrum/effRank'), 'int')).join(', ')} and the ${MODELS.map((m) => DV(undefined, pct(M.cells[`neutral|affect|${m.id}`].spectrum.negMass, 0), [cellP('neutral', 'affect', m, 'spectrum/negMass')])).join(', ')} negative mass are the float spectrum&rsquo;s measure of how far from a plane: computed, not decided.`,
  'the "but a plane" note');

/* 3: the scrambled baseline, computed rather than quoted */
sections = patch(sections, 'A scrambled control scores 6 of 12.',
  `A scrambled order scores ${DV(undefined, scrambled.mean.toFixed(1), ['/affect'], W.CHOSEN)} of ${AF.length} on average and 6 or fewer ${DV(undefined, pct(scrambled.le6, 1), ['/affect'], W.CHOSEN)} of the time (${scrambled.T.toLocaleString('en-US')} random orders from one seed, so dotted); the &ldquo;6 of 12&rdquo; the bench quoted for its scrambled control has no record here.`,
  'the scrambled control');

/* 4: the coincidence, in the reading picked and in the page's own */
sections = patch(sections, 'Three models landing on rank one is about a one-in-1,700 coincidence.',
  `Three models landing on rank one is about a ${DV(undefined, 'one-in-1,700', MODELS.map((m) => salP('urgent', m, 'n')), W.CHOSEN)} coincidence &mdash; for this mood, at this end of the ranking, a reading picked after looking. The page&rsquo;s own test is either end, and ${WORD(moodsRun.length)} moods were asked: the chance that some mood lands all ${WORD(MODELS.length)} models at one end is about one in ${sig2(eitherEnd)}.`,
  'the salience note');

/* 5: the trees (rule 3). The control plates are the only plates here that draw a tree, one per model; each tied
   tree is dotted by the wrapper above and its caption says "one of several", and the counts are gated against the
   record so a re-run that breaks or creates a tie re-words the page or stops the build. */
{
  const clockCells = MODELS.map((m) => M.cells[`neutral|clock|${m.id}`]);
  const tied = MODELS.filter((m, i) => !mstUnique(clockCells[i].D, clockCells[i].mst));
  if (trees.drawn !== MODELS.length || trees.tied !== tied.length) throw new Error(`affect: ${MODELS.length} control trees and ${tied.length} ties in the record, but the plates drew ${trees.drawn} and dotted ${trees.tied}`);
  /* addressed to the distances and the tree of each tied plate it names: the tie is read off those two cells */
  const ONE = (ms) => DV(undefined, 'one of several', ms.flatMap((m) => [cellP('neutral', 'clock', m, 'D'), cellP('neutral', 'clock', m, 'mst')]), W.CHOSEN,
    'chosen — two edges tie, and a tie-break picked this tree among the minimum spanning trees the numbers admit; drawn dotted');
  for (const m of MODELS) {
    const re = new RegExp(`(<span class="mname">${m.label.replace(/[.]/g, '\\.')}</span><span class="fit">cycle <span class="w-val w-computed"[^>]*>[^<]*</span>)(</span>)`, 'g');
    const k = (sections.match(re) || []).length;
    if (k !== 1) throw new Error(`affect: expected one control caption for ${m.label}, found ${k}`);
    sections = sections.replace(re, (_, a, b) => `${a} · tree ${tied.includes(m) ? ONE([m]) : 'unique'}${b}`);
  }
  const both = tied.length === MODELS.length ? 'every one' : tied.length ? `${WORD(tied.length)} of the ${WORD(MODELS.length)}, ${tied.map((m) => m.label).join(' and ')}` : 'none';
  sections = patch(sections, 'Nothing was carried over between the two runs but the question.</p>',
    `Nothing was carried over between the two runs but the question. The line on each plate is the cheapest tree the model&rsquo;s own numbers admit, its minimum spanning tree; where two of its edges tie, a tie-break picked it and it is ${ONE(tied.length ? tied : MODELS)}, drawn dotted &mdash; ${both} here.</p>`,
    'the control trees');
}

/* 6: R23, R30 — each of the nine plates names its record and the check above that would stop it. The record line comes
   from design/components.js figure() itself, so its shape and its sha are the house's own. */
{
  const tail = (stop) => {
    const m = /<figcaption([^>]*)>([\s\S]*)<\/figcaption>/.exec(DC.figure({ svgRaw: '', captionRaw: '', record: REC, stop, wide: false }));
    if (!m) throw new Error('affect: components.figure() no longer writes a figcaption; re-read it');
    return { attr: m[1], html: m[2] };
  };
  const figs = [
    ...MODELS.map((m) => ({ m, lead: 'order exact', stop: `one of ${m.label}'s twelve feelings is out of its circumplex place` })),
    ...MODELS.map((m) => ({ m, lead: 'r = ', stop: `${m.label}'s pleasantness or activation axis lines up with its pairwise map at r below ${R_MIN}` })),
    ...MODELS.map((m) => ({ m, lead: 'cycle ', stop: 'the three control plates do not draw three trees, or dot a different number of them than the record holds tied' })),
  ];
  let k = 0;
  sections = sections.replace(/<figcaption>(<span class="mname">([^<]*)<\/span><span class="fit">[\s\S]*?)<\/figcaption>/g, (whole, inner, label) => {
    const f = figs[k++];
    if (!f || f.m.label !== label || !inner.replace(/<[^>]+>/g, '').slice(label.length).startsWith(f.lead)) throw new Error(`affect: plate ${k} (${label}) is not the one its record line was written for; re-read page.js`);
    const t = tail(f.stop);
    return `<figcaption${t.attr}>${inner}${t.html}</figcaption>`;
  });
  if (k !== figs.length) throw new Error(`affect: expected ${figs.length} plates, found ${k}`);
}
/* the record line and the stop sentence each on a line of their own under a plate's caption: design/template.js's rule,
   which this page's own sheet does not carry; page.js sets its figcaption as one flex row, so a captioned one wraps */
const FIGREC = 'figcaption[data-record] { flex-wrap:wrap; }\nfigcaption .fig-rec, figcaption .fig-stop { display:block; flex-basis:100%; margin-top:var(--s-2); font-size:var(--text-eyebrow); color:var(--ink-4); text-transform:none; letter-spacing:normal; }';

function build(OUT) {
  const foot = `<p><a href="../answer-shape/index.html">the same instrument, seven other subjects</a> · <a href="../exact-geometry/index.html">the control it is judged against</a> · crossed from the bench ${PROV.liftedOn}</p>`;
  const html = page({
    foot,
    title: 'The geometry of feeling · instruments',
    desc: 'Twelve feelings placed by pairwise questions, the circumplex axes recovered from a question set with no words in common, and the same twelve asked again under six moods — with twelve clock hours as the control that has no business moving.',
    /* the foot line rode in the body as well as in the page foot until 2026-10-28, so it printed twice */
    path: '/instruments/affect/', body: INK.assertNoLiterals(INK.tokenInks(head + sections), 'affect'),
    css: INK.assertNoLiterals(INK.tokenInks(`${BENCHCSS}\n${A.CSS}\n${GR.css()}\n${FIGREC}`), 'affect\'s sheet'),
  });
  const dir = path.join(OUT, 'affect');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { bytes: html.length, moods: moods.length, models: M.models.length, spend };
}
/* the first affect map, by its class: since 2026-10-28 the standing legend's swatches are the first <svg> in the body,
   and the old "first long <svg>" match spanned from a swatch into the legend's HTML */
function cardArt() { const m = sections.match(/<svg viewBox="[^"]*" class="pl">[\s\S]*?<\/svg>/); if (!m || !/class="ord"/.test(m[0])) throw new Error('affect: no affect map for the card'); return INK.assertNoLiterals(INK.tokenInks(m[0]), 'the affect card'); }
module.exports = { build, cardArt, M, spend, PROV };
