/* build-sentiment.js — render site/ai-sentiment/index.html
   node experiments/neural-geometry/probe-mood.js --live
   node experiments/neural-geometry/decide-mood.js
   node tools/build-sentiment.js                                              */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
/* PATCH (declared in PROVENANCE.json): the bench shell is replaced by build.js
   in this repository's design system. */
const { plate } = require(path.join(__dirname, 'plate.js'));
const { circumplex, tether, deformation } = require(path.join(__dirname, 'sentiment-plate.js'));
const M = JSON.parse(fs.readFileSync(path.join(__dirname, 'out', 'mood-geometry.json'), 'utf8'));

const MODELS = M.models, AF = M.affect;
const pct = (x, d = 0) => `${(100 * x).toFixed(d)}%`;
const cell = (mood, sub, m) => M.cells[`${mood}|${sub}|${m.id}`];
const cx = (mood, m) => M.circumplex[`${mood}|${m.id}`];
const ranMoods = [...new Set(Object.keys(M.cells).map(k => k.split('|')[0]))];
const pending = M.moods.filter(x => !ranMoods.includes(x.id));
const nCalls = ranMoods.length * M.subjects.reduce((t, S) => t + S.items.length * (S.items.length - 1), 0) * MODELS.length
  + ranMoods.length * 2 * AF.length * MODELS.length
  + (M.ladder ? M.ladder.items.length * (M.ladder.items.length - 1) * MODELS.length : 0);
const floorOf = (m) => (M.floor || {})[m.id];
const meanGap = (subId, m) => {
  const v = M.moods.filter(x => x.prefix).map(x => (M.effects[`${x.id}|${subId}|${m.id}`] || {}).gap).filter(x => x != null);
  return v.length ? v.reduce((t, x) => t + x, 0) / v.length : null;
};
/* "real" means: larger than what the same question does to itself between two
   sessions. 2.5x the floor, fixed before the numbers were looked at. */
const REAL = (subId, m) => { const g = meanGap(subId, m), f = floorOf(m); return g != null && f != null && g > 2.5 * f; };
const allExact = MODELS.every(m => cx('neutral', m).order.exact);

const CSS = `
.trip { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:var(--s-4); }
@media (max-width:900px){ .trip{ grid-template-columns:1fr; } }
figure { margin:0; }
.art { background:var(--bg-raised); border:1px solid var(--border); border-radius:var(--radius-m); padding:var(--s-2); }
figcaption { display:flex; justify-content:space-between; gap:var(--s-3); margin-top:6px; font-family:var(--font-mono); font-size:9px; letter-spacing:.1em; text-transform:uppercase; }
.mname { color:var(--ink-2); } .fit { color:var(--ink-5); text-transform:none; letter-spacing:.04em; }
svg.pl { width:100%; height:auto; display:block; border-radius:var(--radius-s); }
svg.pl .ch { stroke:#f6f6f8; }
svg.pl .ord { fill:none; stroke:#f6f6f8; stroke-opacity:.78; stroke-width:1.5; }
svg.pl .clo { fill:none; stroke:#f6f6f8; stroke-opacity:.9; stroke-width:1.5; stroke-dasharray:5 4; }
svg.pl .mst { fill:none; stroke:#f6f6f8; stroke-opacity:.55; stroke-width:1.2; }
svg.pl .pt { fill:#0a0a0c; stroke:#f6f6f8; stroke-width:1.2; }
svg.pl .pt.first { fill:#f6f6f8; }
svg.pl .ptb { fill:#f6f6f8; }
svg.pl .lb { fill:#8e8e9a; font-family:var(--font-mono); font-size:8.5px; }
svg.pl .lb.first { fill:#f6f6f8; }
svg.pl .ax line { stroke:#f6f6f8; stroke-opacity:.13; }
svg.pl .ax text { fill:#5a5a66; font-family:var(--font-mono); font-size:7.5px; letter-spacing:.08em; }
svg.pl .tie { stroke:#f6f6f8; stroke-opacity:.42; stroke-width:1; }
svg.pl .ghost { fill:none; stroke:#f6f6f8; stroke-opacity:.22; stroke-width:1; }
svg.pl .arr { stroke:#f6f6f8; stroke-opacity:.8; stroke-width:1.1; }
.grid-t { display:grid; gap:1px; background:var(--border); border:1px solid var(--border); border-radius:var(--radius-m); overflow:hidden; margin-top:var(--s-5); }
.grid-t > div { background:var(--bg-raised); padding:6px var(--s-4); font-family:var(--font-mono); font-size:10px; color:var(--ink-2); font-variant-numeric:tabular-nums; }
.grid-t .h { color:var(--ink-5); font-size:9px; letter-spacing:.1em; text-transform:uppercase; }
.grid-t .hit { color:var(--ink); }
.note { font-family:var(--font-mono); font-size:var(--text-eyebrow); line-height:1.75; color:var(--ink-4); background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-s); padding:var(--s-4); margin-top:var(--s-4); }
.note b { color:var(--ink-2); font-weight:500; }
.moods { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:var(--s-4); margin-top:var(--s-5); }
@media (max-width:820px){ .moods{ grid-template-columns:1fr; } }
.mood { border:1px solid var(--border); border-radius:var(--radius-m); background:var(--bg-raised); padding:var(--s-4); }
.mood .mk { font-family:var(--font-mono); font-size:9px; letter-spacing:.14em; text-transform:uppercase; color:var(--ink-3); }
.mood .mq { font-size:var(--text-small); color:var(--ink-2); line-height:1.6; margin-top:8px; font-style:italic; }
.mood .mv { font-family:var(--font-mono); font-size:9px; color:var(--ink-5); margin-top:9px; }
.pend { opacity:.62; }
.wall { display:grid; gap:1px; background:var(--border); border:1px solid var(--border); border-radius:var(--radius-m); overflow:hidden; }
.wh,.wl,.wc { background:var(--bg-raised); padding:var(--s-3); }
.wh,.wl { font-family:var(--font-mono); font-size:9px; letter-spacing:.1em; text-transform:uppercase; color:var(--ink-5); display:flex; align-items:center; }
.wl { color:var(--ink-3); }
.wc .art { padding:0; border:0; background:none; }
.wv { font-family:var(--font-mono); font-size:8.5px; color:var(--ink-5); margin-top:5px; text-align:center; }
@media (max-width:900px){ .wall { grid-template-columns:1fr !important; } .wh { display:none; } }
.bars { display:grid; gap:var(--s-4); }
.bg { border:1px solid var(--border); border-radius:var(--radius-m); background:var(--bg-raised); padding:var(--s-4); }
.bl { font-family:var(--font-mono); font-size:9px; letter-spacing:.12em; text-transform:uppercase; color:var(--ink-4); margin-bottom:var(--s-3); }
.brow { display:grid; gap:var(--s-3); align-items:center; font-family:var(--font-mono); font-size:9.5px; color:var(--ink-5); margin-top:6px; }
.bm { color:var(--ink-2); } .bt { color:#5a5a66; font-size:8.5px; letter-spacing:.08em; text-transform:uppercase; }
.bcell { display:grid; grid-template-columns:1fr 38px; gap:6px; align-items:center; }
.btr { position:relative; height:5px; background:#1a1a1f; border-radius:2px; }
.btr i { display:block; height:100%; background:#f6f6f8; opacity:.72; border-radius:2px; }
.btr b { position:absolute; top:-2px; bottom:-2px; width:1px; background:#f6f6f8; opacity:.9; }
.bv { color:var(--ink-3); text-align:right; font-variant-numeric:tabular-nums; }`;

/* the affect map, three models */
const maps = `<div class="trip">${MODELS.map(m => {
  const c = cell('neutral', 'affect', m), o = cx('neutral', m);
  return `<figure><div class="art">${circumplex(c, AF, { size: 340 })}</div>
  <figcaption><span class="mname">${m.label}</span><span class="fit">${o.order.exact ? 'order exact' : `${o.order.outOfPlace} of ${o.order.n} out of place`} · cycle ${pct(c.fits.cycle.resid)}</span></figcaption></figure>`;
}).join('')}</div>`;

const tethers = `<div class="trip">${MODELS.map(m => {
  const o = cx('neutral', m);
  return `<figure><div class="art">${tether(o, AF, { size: 340 })}</div>
  <figcaption><span class="mname">${m.label}</span><span class="fit">r = ${o.rx.toFixed(2)} / ${o.ry.toFixed(2)} · residual ${pct(o.resid)}</span></figcaption></figure>`;
}).join('')}</div>`;

const controls = `<div class="trip">${MODELS.map(m => {
  const c = cell('neutral', 'clock', m);
  return `<figure><div class="art">${plate(Object.assign({}, c, { items: M.subjects.find(s => s.id === 'clock').items.map(x => String(x).replace(/\s*o[’']clock$/, '')) }), { size: 300 })}</div>
  <figcaption><span class="mname">${m.label}</span><span class="fit">cycle ${pct(c.fits.cycle.resid)}</span></figcaption></figure>`;
}).join('')}</div>`;

const table = (rows, cols, head) => `<div class="grid-t" style="grid-template-columns:${head};">
  <div class="h"></div>${cols.map(c => `<div class="h">${c}</div>`).join('')}
  ${rows.map(([k, vals]) => `<div class="h">${k}</div>${vals.map(v => `<div${/^exact/.test(String(v)) ? ' class="hit"' : ''}>${v}</div>`).join('')}`).join('')}</div>`;

const ratings = `<div class="grid-t" style="grid-template-columns:110px repeat(${AF.length},minmax(0,1fr));">
  <div class="h"></div>${AF.map(a => `<div class="h">${a.slice(0, 5)}</div>`).join('')}
  ${MODELS.flatMap(m => M.scalars.map(x => [`${m.short} · ${x.label}`, cx('neutral', m)[x.id === 'pleasant' ? 'pleasant' : 'activated']]))
    .map(([k, v]) => `<div class="h">${k}</div>${v.map(n => `<div>${n}</div>`).join('')}`).join('')}</div>`;

/* ---- the treatment ------------------------------------------------------ */
const moodsRun = M.moods.filter(x => ranMoods.includes(x.id) && x.prefix);

/* every model against every mood, one subject. Arrows run from where an item sat
   under neutral to where it sits under the mood, after the rotation, reflection
   and scale a distance table leaves free — that is, after removing everything
   that could move for nothing. */
const deformWall = (subId) => `<div class="wall" style="grid-template-columns:80px repeat(${moodsRun.length},minmax(0,1fr));">
  <div class="wh"></div>${moodsRun.map(x => `<div class="wh">${x.label}</div>`).join('')}
  ${MODELS.map(m => `<div class="wl">${m.label}</div>` + moodsRun.map(x => {
    const e = M.effects[`${x.id}|${subId}|${m.id}`];
    if (!e) return '<div class="wc"></div>';
    return `<div class="wc"><div class="art">${deformation(e.from, e.to, M.subjects.find(s => s.id === subId).items, { size: 210 })}</div>
      <div class="wv">gap ${pct(e.gap)} &middot; swell ${e.swell.toFixed(2)}&times;</div></div>`;
  }).join('')).join('')}</div>`;

const gapBars = () => {
  const all = [];
  for (const S of M.subjects) for (const m of MODELS) for (const x of moodsRun) {
    const e = M.effects[`${x.id}|${S.id}|${m.id}`]; if (e) all.push(e.gap);
  }
  const top = Math.max(...all, 0.01);
  return `<div class="bars">${M.subjects.map(S => `<div class="bg">
    <div class="bl">${S.id === 'clock' ? 'the control — twelve hours, which have no business moving' : 'the affect map'}</div>
    ${MODELS.map(m => `<div class="brow" style="grid-template-columns:82px repeat(${moodsRun.length},minmax(0,1fr));">
      <span class="bm">${m.label}</span>
      ${moodsRun.map(x => { const e = M.effects[`${x.id}|${S.id}|${m.id}`], f = floorOf(m);
        return `<span class="bcell"><span class="btr"><i style="width:${e ? (100 * e.gap / top).toFixed(1) : 0}%"></i>${f != null ? `<b style="left:${(100 * f / top).toFixed(1)}%"></b>` : ''}</span><span class="bv">${e ? pct(e.gap) : '—'}</span></span>`; }).join('')}
    </div>`).join('')}
    <div class="brow" style="grid-template-columns:82px repeat(${moodsRun.length},minmax(0,1fr));">
      <span class="bt"></span>${moodsRun.map(x => `<span class="bt">${x.label}</span>`).join('')}
    </div>
  </div>`).join('')}</div>`;
};

const verdictTable = () => `<div class="grid-t" style="grid-template-columns:260px repeat(3,minmax(0,1fr));">
  <div class="h"></div>${MODELS.map(m => `<div class="h">${m.label}</div>`).join('')}
  <div class="h">noise floor — two sessions, same question</div>${MODELS.map(m => `<div>${pct(floorOf(m), 1)}</div>`).join('')}
  <div class="h">the control, mean over five moods</div>${MODELS.map(m => `<div>${pct(meanGap('clock', m), 1)}</div>`).join('')}
  <div class="h">the affect map, mean over five moods</div>${MODELS.map(m => `<div>${pct(meanGap('affect', m), 1)}</div>`).join('')}
  <div class="h">anything above the floor</div>${MODELS.map(m => `<div${REAL('affect', m) ? ' class="hit"' : ''}>${REAL('affect', m) ? 'the feelings, yes' : 'no — its own noise is larger'}</div>`).join('')}</div>`;

const salienceTable = () => `<div class="grid-t" style="grid-template-columns:200px repeat(3,minmax(0,1fr));">
  <div class="h"></div>${MODELS.map(m => `<div class="h">${m.label}</div>`).join('')}
  ${moodsRun.map(x => `<div class="h">${x.label} &rarr; <em>${x.near}</em></div>` + MODELS.map(m => {
    const t = M.salience[`${x.id}|${m.id}`];
    if (!t) return '<div>—</div>';
    return `<div${t.rank === 1 || t.rank === t.n ? ' class="hit"' : ''}>rank ${t.rank} of ${t.n} &middot; z = ${t.z.toFixed(1)}</div>`;
  }).join('')).join('')}</div>`;

const quiet = MODELS.filter(m => REAL('affect', m));
const allRank1 = MODELS.every(m => (M.salience[`urgent|${m.id}`] || {}).rank === 1);
const angryHits = MODELS.filter(m => (M.salience[`angry|${m.id}`] || {}).rank === 1);

const treatmentSections = moodsRun.length ? `
<section class="section">
  <div class="container">
    <div class="section-head reveal"><h2 class="t1">What a mood moved</h2><span class="eyebrow">the control first</span></div>
    <div class="prose reveal" style="max-width:70ch;">
      <p>Twelve hours, asked by six different people. Each arrow runs from where an hour sat when the question was put flatly to where it sits when the same question follows one sentence of ordinary feeling &mdash; after removing the rotation, reflection and scale a table of distances leaves undetermined, which is to say after removing everything that could move for nothing. The faint ring behind is the neutral position.</p>
    </div>
    <div class="reveal" style="margin-top:var(--s-5);">${deformWall('clock')}</div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head reveal"><h2 class="t1">How much is nothing happening</h2><span class="eyebrow">the measurement that decides every other one</span></div>
    <div class="prose reveal" style="max-width:70ch;">
      <p>Those arrows are not zero, and for one model they are enormous. Before any of it can be called an effect, one number is needed: <strong>how far does a geometry move between two runs of the same condition?</strong></p>
      <p>That number was already on disk. The neutral clock on <a href="../neural-geometry/index.html">the previous page</a> is the same model, the same twelve hours, the same question, asked in an independent session on a different day. Aligning those two neutral runs gives each model its own floor, and a mood effect smaller than that floor is not an effect.</p>
    </div>
    <div class="reveal">${verdictTable()}</div>
    <div class="note reveal" style="max-width:80ch;">
<b>the control</b> does not move. For every model the clock's mean shift under mood sits inside that model's own run-to-run noise &mdash; ${MODELS.map(m => `${m.short} ${pct(meanGap('clock', m), 1)} against ${pct(floorOf(m), 1)}`).join(', ')}. A questioner's mood does not bend a geometry that has nothing to do with feeling, in any of the three.
<b>and Haiku</b>  is why the floor had to be measured rather than assumed. Its clock appears to move ${pct(meanGap('clock', MODELS[2]), 0)} under mood, which read as the largest effect on the page until the floor came back at ${pct(floorOf(MODELS[2]), 0)}. It is not responding to the mood. It does not reproduce its own answers.
<b>so</b>         only ${quiet.map(m => m.label).join(' and ') || 'no model'} ${quiet.length === 1 ? 'is' : 'are'} quiet enough for the question to be asked at all &mdash; ${pct(floorOf(MODELS[0]), 1)} between two sessions on different days.
<b>and there</b>  a mood moves the feelings ${(meanGap('affect', MODELS[0]) / floorOf(MODELS[0])).toFixed(0)}&times; the floor while leaving the clock at ${pct(meanGap('clock', MODELS[0]), 1)}. The one measurable effect on this page is confined to the subject a mood could legitimately touch.
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head reveal"><h2 class="t1">And the feelings</h2><span class="eyebrow">the same treatment, the subject it might legitimately touch</span></div>
    <div class="reveal" style="margin-top:var(--s-5);">${deformWall('affect')}</div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head reveal"><h2 class="t1">How much, side by side</h2><span class="eyebrow">shape gap, with each model&rsquo;s noise floor marked</span></div>
    <div class="prose reveal" style="max-width:70ch;">
      <p>One bar per mood per model, on a scale shared between the two subjects so the control can be read directly against the affect map. The tick on each bar is that model&rsquo;s floor. A bar that does not clear its own tick is not showing you anything.</p>
    </div>
    <div class="reveal" style="margin-top:var(--s-5);">${gapBars()}</div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head reveal"><h2 class="t1">${allRank1 ? 'One effect names itself' : 'Did a mood single out its own feeling'}</h2><span class="eyebrow">against the other eleven</span></div>
    <div class="prose reveal" style="max-width:70ch;">
      <p>The shape gap says a map moved. It does not say <em>what</em> moved, and it cannot be computed without an embedding. This last measurement needs neither: for each mood, take the feeling nearest to how the questioner sounds, and ask whether its mean distance to everything else changed more than the other eleven feelings&rsquo; did. The other eleven are the null, and no prompt ever names any of them.</p>
    </div>
    <div class="reveal">${salienceTable()}</div>
    <div class="note reveal" style="max-width:80ch;">
${allRank1 ? `<b>one holds</b>   under time pressure &mdash; <em>&ldquo;${M.moods.find(x => x.id === 'urgent').prefix.trim()}&rdquo;</em> &mdash; <b>tense</b> moves closer to every other feeling than any of the other eleven does, ranking first of twelve in all three models independently. Three models landing on rank one is about a one-in-1,700 coincidence.
<b>including</b>  the model that cannot reproduce its own clock. This is the one measurement on the page where Haiku agrees with the other two.
<b>the rest</b>   do not hold: ${angryHits.length ? `anger singles out <em>angry</em> in ${angryHits.map(m => m.label).join(' and ')} and nowhere else` : 'no other mood singles out its own feeling in more than one model'}, and the remaining moods leave their own feeling in the middle of the pack. Four of five doing nothing is what one real effect looks like from the outside.
<b>direction</b>  the sign is negative. Under pressure the model does not make tension stand out &mdash; it makes it <em>less</em> distinguishable from everything else in the set.` : `<b>read</b>       rank 1 or rank 12 of 12 would mean the mood singled out its own feeling. Anything between means it did not.`}
    </div>
  </div>
</section>` : '';

const body = `
<header class="hero">
  <div class="container">
    <div class="eyebrow reveal">experiments · sentiment as a shape</div>
    <h1 class="display reveal" style="margin-top:var(--s-5); max-width:19ch;">The geometry of feeling</h1>
    <p class="lede reveal" style="margin-top:var(--s-6); max-width:64ch;">Psychology has held for forty years that affect is a plane: feelings sit on a circle whose axes are how pleasant something is and how much energy it takes. This asks three models where twelve feelings sit relative to each other, one isolated pair at a time, in questions that never mention pleasantness, energy, a circle, or a dimension &mdash; and then checks the plane that comes out against a second set of questions that never mention another feeling.</p>
    <div class="hero-meta reveal">
      <span class="item"><span class="k">models</span><span class="v">${MODELS.length}</span></span>
      <span class="item"><span class="k">calls</span><span class="v">${nCalls.toLocaleString()}</span></span>
      <span class="item"><span class="k">circumplex order</span><span class="v">${allExact ? 'exact, all three' : 'see below'}</span></span>
      <span class="item"><span class="k">decisions</span><span class="v">exact rationals</span></span>
    </div>
  </div>
</header>

<section class="section">
  <div class="container narrow">
    <div class="prose reveal">
      <h2 class="t2">Two question sets that share no words</h2>
      <p><strong>The pairwise set.</strong> &ldquo;How far apart are <em>happy</em> and <em>sad</em> as feelings?&rdquo; &mdash; every ordered pair of twelve, both directions, ${AF.length * (AF.length - 1)} calls per model that never see one another. Nothing in it mentions pleasantness, energy, a circle, or how many dimensions anything has. The two directions are added into an integer table, and every decision after that is exact arithmetic on integers, as on <a href="../neural-geometry/index.html">the previous page</a>.</p>
      <p><strong>The scalar set.</strong> &ldquo;How pleasant is it to feel <em>angry</em>?&rdquo; and &ldquo;How much energy does it take to feel <em>angry</em>?&rdquo; &mdash; one feeling at a time, ${2 * AF.length} calls per model. Nothing in it mentions another feeling or any notion of distance.</p>
      <p>Neither set can produce this page's result on its own. The first gives a shape with no labelled directions; the second gives two directions with no shape. Whether they agree is not a thing either was asked.</p>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head reveal"><h2 class="t1">Where the feelings fell</h2><span class="eyebrow">from the pairwise answers alone</span></div>
    <div class="prose reveal" style="max-width:70ch;">
      <p>Twelve feelings, placed by classical scaling on the integer table and nothing else. The frame is shared: every map is rotated so that pleasantness runs to the right and activation upward. Rotation and reflection are exactly the freedoms a table of distances leaves undetermined, so spending them costs nothing &mdash; and the directions come from the scalar answers, which the pairwise questions never saw. <strong>Where each point lands is still entirely the pairwise table's doing.</strong> Only which way is up came from elsewhere.</p>
    </div>
    <div class="reveal" style="margin-top:var(--s-5);">${maps}</div>
    <div class="note reveal" style="max-width:80ch;">
<b>the order</b>   ${allExact ? `all three models place the twelve feelings in exactly the circumplex order — 0 of 12 out of place, and none of the three reflected.` : MODELS.map(m => `${m.label} ${cx('neutral', m).order.outOfPlace}/12`).join(', ')}
<b>the test</b>    that statistic is the angular order of the embedded points against the order the words were written in, up to the rotation and reflection a circle cannot fix. A scrambled control scores 6 of 12.
<b>the spacing</b> is another matter: the cycle fit leaves ${MODELS.map(m => pct(cell('neutral', 'affect', m).fits.cycle.resid)).join(', ')} residual, against ${pct(cell('neutral', 'clock', MODELS[0]).fits.cycle.resid)} for the same model on the clock. Right order, uneven steps — the feelings are not spread evenly round the ring.
<b>and a line</b> fits far worse for every model (${MODELS.map(m => pct(cell('neutral', 'affect', m).fits.line.resid)).join(', ')}), so the ring is not a ladder being drawn bent.
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head reveal"><h2 class="t1">The check neither set could pass alone</h2><span class="eyebrow">${AF.length * (AF.length - 1)} pairwise answers against ${2 * AF.length} scalar ones</span></div>
    <div class="prose reveal" style="max-width:70ch;">
      <p>Each feeling is drawn twice. The open circle is where the pairwise table put it; the small dot is where its two scalar ratings put it, standardised and aligned onto the same frame by rotation, reflection and scale &mdash; no stretching, no per-axis fitting. The tether between them is the disagreement.</p>
    </div>
    <div class="reveal" style="margin-top:var(--s-5);">${tethers}</div>
    ${table(
  [['pleasantness axis, r', MODELS.map(m => cx('neutral', m).rx.toFixed(2))],
  ['activation axis, r', MODELS.map(m => cx('neutral', m).ry.toFixed(2))],
  ['residual after alignment', MODELS.map(m => pct(cx('neutral', m).resid))],
  ['effective rank of the table', MODELS.map(m => cell('neutral', 'affect', m).spectrum.effRank)],
  ['negative mass', MODELS.map(m => pct(cell('neutral', 'affect', m).spectrum.negMass, 1))],
  ['triples breaking the triangle', MODELS.map(m => { const g = cell('neutral', 'affect', m).gate; return `${pct(g.badTriples / g.totTriples, 1)}`; })]],
  MODELS.map(m => m.label), '220px repeat(3,minmax(0,1fr))')}
    <div class="note reveal" style="max-width:80ch;">
<b>the axes</b>    line up at r = ${MODELS.map(m => cx('neutral', m).rx.toFixed(2)).join(', ')} for pleasantness and ${MODELS.map(m => cx('neutral', m).ry.toFixed(2)).join(', ')} for activation. Two question sets with no words in common, agreeing about where twelve feelings are.
<b>and further</b> pleasantness does not merely appear in the pairwise plane — it lands on that plane's <em>leading</em> principal axis, ${MODELS.map(m => `${Math.abs(cx('neutral', m).leadingAxisAngle).toFixed(0)}°`).join(', ')} off it, for all three models independently. That axis was fixed by the pairwise table alone, before any scalar answer was read. The first thing a model's affect geometry is organised by is whether the feeling is nice.
<b>but a plane</b> it is not. The tables carry effective rank ${MODELS.map(m => cell('neutral', 'affect', m).spectrum.effRank).join(', ')} and ${MODELS.map(m => pct(cell('neutral', 'affect', m).spectrum.negMass, 0)).join(', ')} negative mass, which is the exact statement that no arrangement of points in any Euclidean space has these distances. The circumplex is the dominant structure here, not the whole of it, and a page that drew only the two-dimensional picture would have hidden that.
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head reveal"><h2 class="t1">What the models actually said</h2><span class="eyebrow">the scalar answers, unprocessed</span></div>
    <div class="reveal">${ratings}</div>
    <p class="reveal" style="margin-top:var(--s-4); color:var(--ink-4); font-size:var(--text-small); max-width:70ch;">Every number above is one call. They are shown because the alignment above is only as good as these are, and because the disagreements are legible: the three models differ most on how much energy <em>miserable</em> takes &mdash; ${MODELS.map(m => `${m.short} ${cx('neutral', m).activated[AF.indexOf('miserable')]}`).join(', ')} &mdash; which is a genuine disagreement about whether misery is an agitated state or a flat one.</p>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head reveal"><h2 class="t1">The control</h2><span class="eyebrow">a geometry with no feeling in it</span></div>
    <div class="prose reveal" style="max-width:70ch;">
      <p>The twelve hours of a clock, asked the same way in the same run. They are here for the experiment that follows, but they also do something immediately: this is an independent re-run of a measurement made earlier on <a href="../neural-geometry/index.html">the previous page</a>, from fresh calls on a different day.</p>
    </div>
    <div class="reveal" style="margin-top:var(--s-5);">${controls}</div>
    <p class="reveal" style="margin-top:var(--s-4); color:var(--ink-4); font-size:var(--text-small); max-width:70ch;">Cycle residuals then: 1%, 13%, 29%. Now: ${MODELS.map(m => pct(cell('neutral', 'clock', m).fits.cycle.resid)).join(', ')}. Nothing was carried over between the two runs but the question.</p>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head reveal"><h2 class="t1">The treatment${pending.length ? ', not yet run' : ''}</h2><span class="eyebrow">${pending.length ? 'designed, coded, blocked' : 'six ways to be the person asking'}</span></div>
    <div class="prose reveal" style="max-width:70ch;">
      <p>Everything above was asked flatly. The other half of this experiment asks the identical questions &mdash; same pairs, same scale, same demand for a bare integer &mdash; behind one sentence of ordinary emotional register, and measures what moves.</p>
      <p>The mood belongs to the <em>questioner</em>. Nothing instructs a model to feel anything or to play a part, because a model told &ldquo;answer as though furious&rdquo; is being tested on role-play compliance, which is a different and much smaller question than whether an ordinary human register in a prompt bends a structure that has nothing to do with it. That is what the clock is for: twelve hours have no business moving.</p>
    </div>
    <div class="moods reveal${pending.length ? ' pend' : ''}">${M.moods.filter(x => x.prefix).map(x => `<div class="mood">
      <div class="mk">${x.label}</div>
      <div class="mq">&ldquo;${x.prefix.trim()}&rdquo;</div>
      <div class="mv">valence ${x.valence > 0 ? '+' : x.valence < 0 ? '−' : '0'} · arousal ${x.arousal > 0 ? '+' : x.arousal < 0 ? '−' : '0'}${x.near ? ` · nearest feeling in the set: ${x.near}` : ''}</div>
    </div>`).join('')}</div>
    <div class="note reveal" style="max-width:80ch;">
<b>swell</b>      mean distance under the mood over mean distance under neutral. Does an emotional register push everything further apart? Computed on the integer tables, so no embedding freedom can hide it.
<b>salience</b>   for the feeling nearest the mood — the change in its mean distance to everything else. Positive means the mood made its own feeling more distinct from the rest. No prompt ever names it.
<b>shape gap</b>  the Procrustes residual against the same model's own neutral run: the part of the change that rotation, reflection and scale cannot explain away.
<b>the design</b> the five moods tile the same valence–activation plane the feelings are meant to lie in, so the deformations can be asked something no single mood could answer — whether the direction a geometry moves tracks where the mood sits.
${pending.length ? `<b>status</b>     the ${ranMoods.join(', ')} condition${ranMoods.length > 1 ? 's are' : ' is'} complete; ${pending.length} stopped mid-run when the API credit balance ran out.` : `<b>the run</b>    all ${M.moods.length} conditions, ${nCalls.toLocaleString()} calls, in one sitting — neutral included, re-asked here so that every condition in every comparison below comes from the same session.`}
    </div>
  </div>
</section>

${treatmentSections}

<section class="section">
  <div class="container narrow">
    <div class="prose reveal">
      <h2 class="t2">What this can and cannot say</h2>
      <p>It cannot say a model &ldquo;has&rdquo; feelings, or that anything here is evidence about what a model experiences. The subject of every measurement on this page is a table of integers a model produced when asked about words, and a shape in that table is a fact about the answers.</p>
      <p>What it can say is that the fact lives in no single answer. ${(() => {
        const i = AF.indexOf('tense'), j = AF.indexOf('bored');
        return `&ldquo;<em>${AF[i]}</em> and <em>${AF[j]}</em> are ${cell('neutral', 'affect', MODELS[0]).raw[i][j]} apart&rdquo;`;
      })()} — one real answer, quoted as given — carries no information about a circle, a valence axis, or a plane. The circumplex exists only in ${AF.length * (AF.length - 1)} answers at once; it survived being cut into ${AF.length * (AF.length - 1)} independent questions and reassembled by arithmetic no model saw; and it then agreed, at r = ${Math.min(...MODELS.map(m => cx('neutral', m).ry)).toFixed(2)}&ndash;${Math.max(...MODELS.map(m => cx('neutral', m).rx)).toFixed(2)}, with ${2 * AF.length} further answers that shared none of its words. Three models did this separately and produced nearly the same map.</p>
      <p>The honest caveat is the rank. These tables are not two-dimensional and not Euclidean, and the ring is the leading structure rather than the whole of it. The exact signature and the negative mass are printed above for that reason: a page showing only the plane would have been prettier and would have been claiming something the arithmetic does not support.</p>
      <h2 class="t2" style="margin-top:var(--s-7);">Reproduce</h2>
      <p class="mono" style="font-size:var(--text-eyebrow); color:var(--ink-4); line-height:2;">node experiments/neural-geometry/probe-mood.js --live<br>node experiments/neural-geometry/decide-mood.js<br>node tools/build-sentiment.js</p>
      <p>Without <span class="mono">--live</span> the probe touches no network and prints the prompts it would send, mood by mood.</p>
    </div>
  </div>
</section>`;

/* PATCH (declared): export the body instead of writing the bench's page. */
module.exports = { body, CSS, M };
