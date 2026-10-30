/* build.js — site/playground/plates/index.html.

   plates.js is the bench's plate series, crossed byte-for-byte apart from the
   two patches declared in PROVENANCE.json: the record paths point at OUR
   records, and the page-writing tail is replaced by an export. This file is the
   shell — the part that was always going to be rebuilt here.

   PLATE V AND THE GRAMMAR. This header used to say that Plate V "already draws
   the grammar: solid for a bound that holds over every sky, dashed for one sky
   that was exhibited and checked", and the page built a section on it. Two
   things had moved under that sentence. On 2026-09-05 the witness's dash was
   taken off (plates.js plateEnclosure: a dash for KIND — every sky against one
   sky — is identity, and dash carries standing alone), so the caption's
   "dashed: a sky that exists" named a stroke the plate no longer drew; and the
   standing was never what the solid said. WARRANT v2 (2026-10-28): the ceiling
   on Plate V is the interferometer's lid — its pointwise inequality checked on a
   grid with a Lipschitz margin in floating point, "a float safeguard, not a
   proof", in that instrument's own words, and drawn dashed there — and the
   witness is checked against the ceilings the same way. Both curves are
   COMPUTED. plates.js is a lifted file and stays byte-for-byte, so the shell
   redraws them here: dashed by the grammar's CLAIM, the caption rewritten, and
   every edit COUNTED — if plates.js moves and a pattern stops matching exactly
   as often as it is written for, the build refuses rather than ship a plate that
   half-changed. The same pass dashes Plate III's threshold line (a float
   bisection) and stops Plate IV's prose calling its axis "the dashed line" on a
   page whose legend says dashed means computed.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const HERE = __dirname;
const PG = path.join(HERE, '..');
const ROOT = path.join(PG, '..');
const { page } = require(path.join(PG, 'design', 'shell.js'));
const W = require(path.join(PG, 'warrant.js'));
const G = require(path.join(ROOT, 'design', 'grammar.js'));
const P = require('./plates.js');
const PROV = JSON.parse(fs.readFileSync(path.join(HERE, 'PROVENANCE.json'), 'utf8'));
const CSS = fs.readFileSync(path.join(PG, 'design', 'bench.css'), 'utf8');
/* the record Plate V draws, read here too so the prose below cannot drift from the plate */
const SWEEP = JSON.parse(fs.readFileSync(path.join(PG, 'interferometer', 'out', 'cp-sweep.json'), 'utf8'));
const fmt = (x) => Number(x).toLocaleString('en-US');

/* ---- the shell's edits to the lifted plates (WARRANT v2, 2026-10-28) ----
   Each edit is made inside ONE plate's <svg> (or once in the body) and must
   match exactly the number of times it is written for; anything else throws. */
const once = (s, re, to, n, what) => {
  const m = s.match(re) || [];
  if (m.length !== n) throw new Error('plates: ' + what + ' matched ' + m.length + ' time(s), expected ' + n + ' — plates.js moved; re-read it before re-cutting');
  return s.replace(re, to);
};
const inPlate = (b, idx, edit) => {
  const at = b.indexOf('>' + idx + '</text>');
  const s = b.lastIndexOf('<svg', at), e = b.indexOf('</svg>', at);
  if (at < 0 || s < 0 || e < 0) throw new Error('plates: no svg for ' + idx);
  return b.slice(0, s) + edit(b.slice(s, e)) + b.slice(e);
};
const CLAIM = `stroke-width="1.5" stroke-dasharray="${G.claim(1.5)}"`;   /* COMPUTED, from the grammar's closed set */
let lifted = P.body;
lifted = inPlate(lifted, 'PLATE V', (s) => {
  /* the ceiling (opacity 0.85) and the witness (0.5): both COMPUTED; identity stays on opacity */
  s = once(s, /(<path d="[^"]*" fill="none" stroke="rgba\(246,246,248,0\.(?:85|5)\)") stroke-width="1\.4"\/>/g, `$1 ${CLAIM}/>`, 2, 'Plate V curves');
  return once(s, /solid: a bound on every sky\. {2}dashed: a sky that exists\./g,
    'both dashed: checked in floating point.  upper: a ceiling on every sky.  lower: one sky, exhibited.', 1, 'Plate V caption');
});
/* Plate III: the line between one maximum and two is placed by a float bisection of the linear model's threshold */
lifted = inPlate(lifted, 'PLATE III', (s) => once(s, /(<line [^>]*? stroke="rgba\(246,246,248,0\.55\)")\/>/g, `$1 ${CLAIM}/>`, 1, 'Plate III threshold line'));
/* Plate IV's zero line is a guide (design/grammar.js GUIDE); "dashed" on this page means computed */
lifted = once(lifted, /Where a curve dips under the dashed line/g, 'Where a curve dips under the zero line', 1, 'Plate IV prose');

/* the legend comes out of warrant.js, so the page cannot describe a grammar it
   is not using. REFUSED has no stroke and no plate here uses it; CHOSEN is said
   in words below, because the one chosen plate is a texture with no stroke to
   dot. Compact, so two entries read as one key rather than two new spines. */
const legend = W.legendHtml({ compact: true });

/* the numbers the section states, from the record Plate V draws */
const S6 = SWEEP.rows.find((r) => r.r0 === Math.min(...SWEEP.rows.map((x) => x.r0)));
const LOOSE = Math.max(...SWEEP.rows.map((r) => r.ratio));
const O = SWEEP.opts;
/* D10: a stated number is read from its cell of the sweep record */
const SW = (row, field) => ({ path: 'playground/interferometer/out/cp-sweep.json', ptr: '/rows[r0=' + row.r0 + ']/' + field });
const GIVEN = `${O.nsig}&sigma; amplitude ceilings ${O.perstation ? 'divided by per-station gains' : `plus ${(100 * O.gain).toFixed(0)}% gain`}, ${/^(8|11|18)/.test(String(2 * O.fov)) ? 'an' : 'a'} ${2 * O.fov} &micro;as field, ${O.F} Jy in it, and baselines above ${O.bcut} G&lambda;`;
if (!(S6 && S6.witness < S6.ceiling && LOOSE > 1)) throw new Error('plates: the Plate V bracket moved; rewrite the section');

const grammar = `
<section class="section">
  <div class="container">
    <div class="eyebrow">the grammar, on these plates</div>
    <h2 class="t2 mt3">Plate V drew a dash before the grammar did, for another reason.</h2>
    <div class="prose mt5">
      <p>Its caption used to read <em>solid: a bound on every sky. dashed: a sky that exists.</em> One curve is a statement about every brightness distribution consistent with ${fmt(P.counts.visibilities)} measurements; the other is one distribution, exhibited. That difference is real, but it is a difference of kind, every sky against one, and on this site a dash carries standing alone, never kind &mdash; so the dash came off and opacity tells the two apart.</p>
      <p>Standing is what a mark rests on, and both curves on Plate V rest on the same thing. The ceiling&rsquo;s pointwise inequality is checked on a grid with a Lipschitz margin, in floating point, and the witness is checked against the ceilings the same way; <a href="../interferometer/index.html">the instrument that produced them</a> says so in its own words and draws its lid dashed. So both are dashed here, computed: at r = ${S6.r0} &micro;as the bracket is [${W.val({ rec: SW(S6, 'witness'), standing: W.COMPUTED, fmt: 'fixed:4' })}, ${W.val({ rec: SW(S6, 'ceiling'), standing: W.COMPUTED, fmt: 'fixed:4' })}] Jy, and across the ${SWEEP.rows.length} radii the ceiling is at most ${W.val({ rec: SW(SWEEP.rows.find((r) => r.ratio === LOOSE), 'ratio'), standing: W.COMPUTED, fmt: 'fixed:2' })}&times; its witness, <em>given ${GIVEN}</em>.</p>
      <p>The other plates, in the same words. Plate III&rsquo;s threshold line is found in floating point &mdash; the rows compared, the &sigma; beside it bisected &mdash; so it is dashed. Its certified bar and the dots on Plate IV were decided in interval arithmetic: solid. The threads of Plate I, the rows of III and the parabolas of IV are a stated rule drawn at the plate&rsquo;s resolution and claim nothing past it. Plate VIII is chosen: any weights that clear the inequality would have served the proof, and each row averages the ones a linear programme happened to pick &mdash; a texture has no stroke to dot, so it is said here. Nothing on these plates is red; none of them exhibits an object against a claim made about it.</p>
    </div>
    ${legend}
    <div class="prose mt5">
      <p><b>Standing is not confidence.</b> A dashed curve here is not a vague one; it may well be right to every digit Plate V prints. What it lacks is a proof that its inequality holds between the samples, and the dash says exactly that. The band between the curves is not error either: it is the set of answers that survive, as far as floating point has checked.</p>
    </div>
  </div>
</section>`;

/* the grammar section goes in after Plate V, where the reader has just seen it */
const body = (() => {
  const b = lifted;
  const i = b.indexOf('PLATE VI');
  if (i < 0) return b + grammar;
  const cut = b.lastIndexOf('<section class="section plate', i);
  return cut < 0 ? b + grammar : b.slice(0, cut) + grammar + '\n' + b.slice(cut);
})();

const foot = `
`;

function build(OUT) {
  const foot = `<p><a href="../interferometer/index.html">the instrument behind plates II, V and VI</a> · <a href="../curveset/index.html">the same question, on a calibration</a> · crossed from the bench ${PROV.liftedOn}</p>`;
  const html = page({
    foot,
    title: 'Manifolds we are handed · instruments',
    desc: 'Eight plates. Interpretability pulls geometry out of a working model and asks what it means; these are stated as a rule and its parameters, then drawn — including two that are certificates rendered at their own resolution.',
    path: '/instruments/plates/',
    body: body + foot,
    css: `${CSS}\n${P.CSS}`,
  });
  const dir = path.join(OUT, 'plates');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { bytes: html.length, ...P.counts };
}

/* the card art is Plate I, the hinge plate: the one object that is read both
   ways, found inside a model and stated from a definition */
function cardArt() {
  /* MATCHED BY WIDTH, NOT BY EXACT SIZE (2026-09-05). This pinned the height at
     560, so the moment Plate I reserved a caption band and became 586 tall the
     regex stopped matching and the card art silently vanished — the gathering
     page shipped an empty plate with only its caption pill. A builder that
     selects a figure by its exact pixel dimensions breaks on any change to the
     figure, without erroring. Width is the stable part; the height is not. */
  const m = P.body.match(/<svg viewBox="0 0 980 \d+"[\s\S]*?<\/svg>/);
  return m ? m[0] : '';
}

module.exports = { build, cardArt, counts: P.counts, PROV };
