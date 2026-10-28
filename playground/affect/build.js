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
const C = (t) => W.value(t, W.COMPUTED), CH = (t) => W.value(t, W.CHOSEN);
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
/* every float number inside one kind of readout, marked COMPUTED in place; the count is gated */
function markAll(s, re, n, what) {
  let k = 0;
  const out = s.replace(re, (whole, open, inner, close) => { k++; return open + inner.replace(/-?\d+(?:\.\d+)?(?:%|&times;)?/g, (t) => C(t)) + close; });
  if (k !== n) throw new Error(`affect: expected ${n} ${what}, found ${k}`);
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
  (f) => f + W.legendHtml({ exclude: [W.REFUSED], compact: true }), 'the legend anchor');

/* the readouts: every float in them COMPUTED */
sections = markAll(sections, /(<span class="fit">)(.*?)(<\/span>)/g, 9, 'figure captions');
/* "order exact" is a verdict word read off float angles (decide-mood.js cyclicOrder on the eigensolver's view):
   exactly the circumplex order, computed rather than decided, and on a page about exact rationals the word needs
   the dash to say which "exact" it is */
{
  const parts = sections.split('<span class="fit">order exact');
  if (parts.length - 1 !== MODELS.filter((m) => M.circumplex[`neutral|${m.id}`].order.exact).length) throw new Error('affect: the order captions moved');
  sections = parts.join('<span class="fit">' + C('order exact'));
}
sections = markAll(sections, /(<div class="wv">)(.*?)(<\/div>)/g, 2 * MODELS.length * moodsRun.length, 'deformation readouts');
sections = markAll(sections, /(<span class="bv">)(.*?)(<\/span>)/g, 2 * MODELS.length * moodsRun.length, 'bar values');
{
  let k = 0;
  sections = sections.replace(/rank (\d+) of (\d+) &middot; z = (-?\d+\.\d)/g, (_, r, n, z) => { k++; return `${C(`rank ${r} of ${n}`)} &middot; z = ${C(z)}`; });
  if (k !== MODELS.length * moodsRun.length) throw new Error('affect: the salience table moved');
}

/* the axis table: float rows COMPUTED, the triangle count decided, and the signature the page promised */
for (const L of ['pleasantness axis, r', 'activation axis, r', 'residual after alignment', 'effective rank of the table', 'negative mass'])
  sections = row(sections, L, (cells) => `<div class="h">${L}</div>` + cells.map((c) => `<div>${C(c)}</div>`).join(''));
sections = row(sections, 'triples breaking the triangle', (cells, all) => all
  + `<div class="h">exact signature (p, q, z)</div>` + sig.map((g) => `<div>(${g.p}, ${g.q}, ${g.z})</div>`).join(''));

/* 1: the verdict table — numbers COMPUTED, the margin named, Sonnet's cell true */
for (const L of ['noise floor — two sessions, same question', 'the control, mean over five moods', 'the affect map, mean over five moods'])
  sections = row(sections, L, (cells) => `<div class="h">${L}</div>` + cells.map((c) => `<div>${C(c)}</div>`).join(''));
sections = row(sections, 'anything above the floor', (cells) => {
  const was = MODELS.map((m, i) => (real[i] ? 'the feelings, yes' : 'no — its own noise is larger'));
  if (cells.join('|') !== was.join('|')) throw new Error('affect: page.js\'s verdict row no longer matches a ' + MARGIN + '× margin');
  return `<div class="h">above the floor, <em>given</em> a ${CH(MARGIN + '×')} margin</div>` + MODELS.map((m, i) => {
    const g = meanGap('affect', m), f = floorOf(m);
    return real[i] ? '<div class="hit">the feelings, yes</div>'
      : g > f ? `<div>no &mdash; ${C((g / f).toFixed(1) + '×')} its floor</div>` : '<div>no &mdash; its own noise is larger</div>';
  }).join('');
});
const vs = (m, sub) => `${m.short} ${C(pct(meanGap(sub, m), 1))} against ${C(pct(floorOf(m), 1))}`;
sections = patch(sections, `<b>the control</b> does not move. For every model the clock's mean shift under mood sits inside that model's own run-to-run noise &mdash; ${MODELS.map((m) => `${m.short} ${pct(meanGap('clock', m), 1)} against ${pct(floorOf(m), 1)}`).join(', ')}.`,
  `<b>the control</b> does not move, <em>given the margin the verdict row names: ${CH(MARGIN + '×')} the floor, fixed before the numbers were read</em>. For every model the clock's mean shift under mood is inside ${MARGIN}&times; that model's own run-to-run noise &mdash; ${MODELS.map((m) => vs(m, 'clock')).join(', ')} &mdash; and above the noise itself in all ${WORD(MODELS.length)}, so read against the floor alone, as the bars below draw it, this sentence would be false.`,
  'the control note');
sections = patch(sections, 'It is not responding to the mood.', '<em>Given that margin</em>, it is not responding to the mood.', 'the Haiku note');
sections = patch(sections, 'A bar that does not clear its own tick is not showing you anything.</p>',
  `A bar that does not clear its own tick is not showing you anything &mdash; and clearing it is not enough: ${C(String(clearTick))} of the ${tickBars.length} control bars clear their tick, and ${clearMargin ? C(String(clearMargin)) + (clearMargin === 1 ? ' clears' : ' clear') : 'none clears'} ${MARGIN}&times; it, the margin the verdicts use.</p>`,
  'the bars caption');

/* 2: the signature is the exact statement; the spectrum measures how far */
sections = patch(sections, `The tables carry effective rank ${MODELS.map((m) => M.cells[`neutral|affect|${m.id}`].spectrum.effRank).join(', ')} and ${MODELS.map((m) => pct(M.cells[`neutral|affect|${m.id}`].spectrum.negMass, 0)).join(', ')} negative mass, which is the exact statement that no arrangement of points in any Euclidean space has these distances.`,
  `The exact statement is the signature, decided by exact symmetric congruence &mdash; ${sig.map((g) => `(${g.p}, ${g.q}, ${g.z})`).join(', ')}: ${sig.map((g) => g.q).join(', ')} directions of negative inertia, so no arrangement of points in any Euclidean space has these distances &mdash; and the triangle count says more: ${gate.map((g) => g.badTriples).join(', ')} of ${gate[0].totTriples.toLocaleString('en-US')} ordered triples break it, so no metric space has them either. The effective rank ${MODELS.map((m) => C(String(M.cells[`neutral|affect|${m.id}`].spectrum.effRank))).join(', ')} and the ${MODELS.map((m) => C(pct(M.cells[`neutral|affect|${m.id}`].spectrum.negMass, 0))).join(', ')} negative mass are the float spectrum&rsquo;s measure of how far from a plane: computed, not decided.`,
  'the "but a plane" note');

/* 3: the scrambled baseline, computed rather than quoted */
sections = patch(sections, 'A scrambled control scores 6 of 12.',
  `A scrambled order scores ${CH(scrambled.mean.toFixed(1))} of ${AF.length} on average and 6 or fewer ${CH(pct(scrambled.le6, 1))} of the time (${scrambled.T.toLocaleString('en-US')} random orders from one seed, so dotted); the &ldquo;6 of 12&rdquo; the bench quoted for its scrambled control has no record here.`,
  'the scrambled control');

/* 4: the coincidence, in the reading picked and in the page's own */
sections = patch(sections, 'Three models landing on rank one is about a one-in-1,700 coincidence.',
  `Three models landing on rank one is about a ${CH('one-in-1,700')} coincidence &mdash; for this mood, at this end of the ranking, a reading picked after looking. The page&rsquo;s own test is either end, and ${WORD(moodsRun.length)} moods were asked: the chance that some mood lands all ${WORD(MODELS.length)} models at one end is about one in ${sig2(eitherEnd)}.`,
  'the salience note');

function build(OUT) {
  const foot = `<p><a href="../answer-shape/index.html">the same instrument, seven other subjects</a> · <a href="../exact-geometry/index.html">the control it is judged against</a> · crossed from the bench ${PROV.liftedOn}</p>`;
  const html = page({
    foot,
    title: 'The geometry of feeling · instruments',
    desc: 'Twelve feelings placed by pairwise questions, the circumplex axes recovered from a question set with no words in common, and the same twelve asked again under six moods — with twelve clock hours as the control that has no business moving.',
    /* the foot line rode in the body as well as in the page foot until 2026-10-28, so it printed twice */
    path: '/instruments/affect/', body: head + sections,
    css: `${BENCHCSS}\n${A.CSS}`,
  });
  const dir = path.join(OUT, 'affect');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { bytes: html.length, moods: moods.length, models: M.models.length, spend };
}
/* the first affect map, by its class: since 2026-10-28 the standing legend's swatches are the first <svg> in the body,
   and the old "first long <svg>" match spanned from a swatch into the legend's HTML */
function cardArt() { const m = sections.match(/<svg viewBox="[^"]*" class="pl">[\s\S]*?<\/svg>/); if (!m || !/class="ord"/.test(m[0])) throw new Error('affect: no affect map for the card'); return m[0]; }
module.exports = { build, cardArt, M, spend, PROV };
