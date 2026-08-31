#!/usr/bin/env node
/* build-report-bilinear.js — reports/polynomial-multiplication.html.

   The generation front was built against matrix multiplication. This page is
   what happened when it was pointed at POLYNOMIAL multiplication over F2 —
   a family whose upper bounds are still 1980s CRT hand constructions, and
   whose lower bounds all moved in 2026.

   THE PAGE DOES NOT DECIDE WHAT IT CLAIMS. Every headline number below is
   computed from certs/bilinear-certificate.json at build time, and the
   standing of each row against the literature (BEAT / MATCH / above) is
   derived, never typed. If the search only ever matches, this page says the
   search only ever matched — a null result is publishable here and the deck
   is written from the data rather than around it.

   Gates, all of which refuse the build:
     - instruments/bilinear/battery.js re-runs and must pass
     - EVERY certified scheme is re-decided here, from its stored bitmasks,
       by the instrument. A certificate that has rotted refuses the page.
     - a rank certifying below a published LOWER bound refuses the build and
       says why: that is a bug report against this repository, not a find.

   usage: node tools/build-report-bilinear.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const B = require(path.join(ROOT, 'instruments', 'bilinear', 'tensor.js'));
const F = require(path.join(ROOT, 'machine', 'generate', 'f2scheme.js'));
const G = require(path.join(ROOT, 'machine', 'generate', 'targets.js'));
const die = (m) => { console.error('BILINEAR REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

/* ---- gate 1: the battery, re-run ----------------------------------------- */
const bat = cp.spawnSync(process.execPath, [path.join(ROOT, 'instruments', 'bilinear', 'battery.js')], { cwd: ROOT });
const bout = String(bat.stdout) + String(bat.stderr);
const bm = /bilinear battery: (\d+) pass, (\d+) fail/.exec(bout);
if (bat.status !== 0 || !bm || Number(bm[2]) !== 0) die('the bilinear battery did not pass:\n' + bout.slice(-800));
const nChecks = Number(bm[1]);
const nReds = (bout.match(/PASS  RED:/g) || []).length;
const nLadder = (bout.match(/PASS  LADDER/g) || []).length;

/* ---- gate 2: every certified scheme is re-decided, here ------------------- */
const CERTDOC = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'bilinear-certificate.json'), 'utf8'));
const BOUNDS = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'bilinear-bounds.json'), 'utf8'));

let equations = 0;
const rows = CERTDOC.entries.map((e) => {
  const target = G.parse(e.target);
  const a = B.audit(F.toClaim(e.scheme, target, e.target));
  if (a.verdict !== 'VERIFIED') die('the stored scheme for ' + e.target + ' no longer certifies: ' + a.verdict + ' — ' + a.why);
  if (a.rank !== e.rank) die('the stored scheme for ' + e.target + ' has ' + a.rank + ' terms, the record says ' + e.rank);
  equations += a.equations;
  const lit = BOUNDS.rows.find(r => r.target === e.target) || null;
  let standing = 'unpublished';
  if (lit) {
    if (e.rank < lit.lower) die('the certified rank ' + e.rank + ' for ' + e.target + ' is BELOW the published '
      + 'lower bound ' + lit.lower + '. Either a published theorem is false or this repository is wrong, and the '
      + 'second is far likelier — stop and check it independently before any page says a word about it.');
    standing = e.rank < lit.upper ? 'BEAT' : (e.rank === lit.upper ? 'MATCH' : 'above');
  }
  return { ...e, lit, standing, equations: a.equations };
});

const beat = rows.filter(r => r.standing === 'BEAT');
const match = rows.filter(r => r.standing === 'MATCH');
const above = rows.filter(r => r.standing === 'above');
const open = rows.filter(r => r.lit);
const tight = rows.filter(r => r.lit && r.lit.lower === r.lit.upper);
const totalSecs = rows.reduce((s, r) => s + (r.search ? r.search.seconds : 0), 0);
/* published targets this campaign never got to. Computed, so the page cannot
   quietly present a partial sweep as a complete one. */
const untouched = BOUNDS.rows.filter(b => !rows.some(r => r.target === b.target)).map(b => b.target);

/* ---- the deck is written FROM the result, not around it ------------------- */
const deck = beat.length
  ? 'The free search returned ' + beat.length + ' rank' + (beat.length > 1 ? 's' : '') + ' below the best '
    + 'published upper bound' + (beat.length > 1 ? 's' : '') + ' — ' + beat.map(r => r.target + ' at ' + r.rank
    + ' against ' + r.lit.upper).join(', ') + '. Every one is a certified witness stored in full on this page.'
  : 'The free search did not beat a single published upper bound. It reproduced ' + match.length + ' of them '
    + 'from scratch at no cost, which is the honest result and is why the calibration below is worth more than '
    + 'the headline would have been.';

const B_ = [];
B_.push(C.header({
  eyebrow: 'cert-machine · the generation front · polynomial multiplication over F2',
  title: 'A free search against forty-year-old multiplication bounds',
  deck: 'How many multiplications does it take to multiply two polynomials over F2? For the truncated and '
    + 'cyclic products the best known answers are still hand constructions from the 1980s and 2009, and in '
    + 'March 2026 every lower bound underneath them moved. Modern search has been pointed at exactly one of '
    + 'them, once, in a footnote — and it won. ' + deck
}));

B_.push(C.tldr({
  findingRaw: (beat.length
    ? '<strong>' + beat.length + ' new upper bound' + (beat.length > 1 ? 's' : '') + '</strong> over F2: '
      + beat.map(r => C.m(r.target) + ' at rank <strong>' + r.rank + '</strong> against a published '
        + r.lit.upper).join('; ') + '. '
    : 'No published upper bound was beaten. ')
    + 'The search reproduced <strong>' + match.length + ' published upper bounds from scratch</strong>'
    + (tight.length ? ', including ' + tight.map(r => C.m(r.target)).join(' and ') + ', where the published '
      + 'upper and lower bounds meet — so that rank is the exact answer, not an estimate' : '')
    + '. Total cost: <strong>$0.0000</strong>, in ' + Math.round(totalSecs) + ' seconds of one laptop core. '
    + 'The lower bounds it is measured against were computed on 192-core cloud instances at a few dollars each.',
  mechanismRaw: 'A flip-graph random walk proposes; an exact instrument decides. The walk is free — no model, '
    + 'no API call, no tokens — and it is deliberately the honest baseline every paid proposer has to beat. '
    + 'Correctness is never the walk\'s job: a flip is an identity over F2, so every scheme it reaches '
    + 'decomposes the same tensor by construction, and the walk only ever screens by RANK. The certifier '
    + 'rebuilds the target tensor from the target\'s NAME, by literal polynomial arithmetic, and never takes '
    + 'the claimant\'s word for which tensor is being decomposed — any scheme decomposes something.',
  checkRaw: C.m('node instruments/bilinear/battery.js') + ' — ' + nChecks + ' checks including ' + nReds
    + ' red controls and a ' + nLadder + '-rung calibration ladder of published ranks the walk must still reach. '
    + 'This page re-decides all ' + rows.length + ' stored schemes at every build (' + equations.toLocaleString('en-US')
    + ' tensor equations); one that stopped closing would refuse it. Reproduce with '
    + C.m('node tools/run-bilinear-front.js --targets T8,C8') + '.'
}));

B_.push(C.stats([
  { k: 'targets certified', v: String(rows.length), role: 'held', n: 'each an explicit scheme stored in full in certs/bilinear-certificate.json and re-decided at every build' },
  { k: 'published bounds beaten', v: String(beat.length), role: beat.length ? 'held' : 'open', n: beat.length ? beat.map(r => r.target + ': ' + r.rank + ' < ' + r.lit.upper).join('; ') : 'none — the search matched the literature but did not get under it' },
  { k: 'published bounds reproduced', v: String(match.length), role: 'held', n: 'hand constructions from 1983-2009, re-derived from the naive algorithm by a random walk that was told nothing about them' },
  { k: 'exact ranks confirmed', v: String(tight.length), role: 'held', n: 'targets where the published lower and upper bounds meet, so the walk reaching that rank is reaching the true minimum' },
  { k: 'still above the literature', v: String(above.length), role: 'open', n: 'the search did not reach the published bound. Listed, not dropped' },
  { k: 'published targets not attempted', v: String(untouched.length), role: 'open', n: untouched.length ? untouched.join(', ') + ' — the campaign was stopped, not exhausted' : 'none' },
  { k: 'cost', v: '$0.0000', role: 'held', n: Math.round(totalSecs) + ' s of one core, nice-10, on a laptop that was busy with another campaign at the time' },
]));

/* ---- §1 the table -------------------------------------------------------- */
const badge = (s) => s === 'BEAT' ? C.tag('cert', 'BEAT') : s === 'MATCH' ? C.tag('held', 'MATCH')
  : s === 'above' ? C.tag('open', 'above') : C.tag('dep', '—');
const fam = { P: 'full product', T: 'truncated product', C: 'cyclic product' };
B_.push(C.section({
  lab: '§1 · the result', title: 'Every target, against what is published',
  bodyRaw: C.table({
    cols: [{ h: 'target' }, { h: 'what it is' }, { h: 'naive', cls: 'n' }, { h: 'published', cls: 'n' },
           { h: 'ours', cls: 'n' }, { h: 'standing' }, { h: 'upper bound is due to' }],
    rows: rows.map(r => [
      { raw: C.m(r.target) },
      fam[r.target[0]] + ', ' + r.target.slice(1) + ' coefficients each',
      String(r.naive),
      r.lit ? r.lit.lower + '..' + r.lit.upper : '—',
      { raw: '<strong>' + r.rank + '</strong>' },
      { raw: badge(r.standing) },
      r.lit ? (r.lit.upperRef.map(k => BOUNDS.refs[k].replace(/^([^,]+,[^,]+),.*?(\d{4})$/, '$1 $2')).join('; ')) : '—'
    ])
  }) + '<div class="col">' + C.pRaw('The <em>naive</em> column is the definition itself run as an algorithm — one '
    + 'multiplication per non-zero of the target tensor. That is where every walk starts, and it is told nothing '
    + 'else: no construction, no published scheme, no hint. <em>Published</em> is the interval the literature '
    + 'leaves open, lower bound from Wang\'s 2026 preprint, upper bound from the hand constructions named in the '
    + 'last column.') + '</div>'
}));

/* ---- §2 the calibration -------------------------------------------------- */
B_.push(C.section({
  lab: '§2 · why believe the open rows', title: 'The ladder that has to hold first',
  bodyRaw: '<div class="col">' + C.pRaw('A search that reports a number on an open problem is worth exactly as '
    + 'much as its behaviour on the problems whose answers are already known. So the instrument\'s battery '
    + 'carries a ladder of PUBLISHED ranks the free walk has to keep reaching, at a fixed seed and a fixed '
    + 'budget — a deterministic gate, not a coin flip.')
  + C.pRaw('The sharpest rung is ' + C.m('C7') + '. Wagh and Morgera gave a rank-13 cyclic convolution over F2 '
    + 'in 1983; Wang proved in 2026 that 13 is also a lower bound. The two walls meet, so 13 is the exact rank — '
    + 'and the walk finds it from the naive rank-49 algorithm, in seconds, having been told nothing.')
  + C.pRaw('The ladder is also what caught this search being broken. Without a rank-INCREASING move the walk '
    + 'matched the literature on the small full products and then quietly sat above it from P5 on — which looks '
    + 'exactly like success if nobody checks the top of the ladder. Adding the plus transition moved P6 from 21 '
    + 'to 18. That is the whole argument for calibrating against published numbers rather than against nothing.')
  + '</div>'
}));

/* ---- §3 the prior art ---------------------------------------------------- */
B_.push(C.section({
  lab: '§3 · what was already done', title: 'The prior art, checked before the search was written',
  bodyRaw: C.table({
    cols: [{ h: 'who' }, { h: 'what they searched' }, { h: 'what it means for this page' }],
    rows: [
      ['Barbulescu, Detrey, Estibals & Zimmermann 2012; Covanov 2017',
        'exhaustive search for OPTIMAL bilinear formulae',
        'reaches degree 5 — the short product modulo X⁵ and the circulant modulo X⁵−1. Every target on this page is beyond it.'],
      ['Chen & Kauers, arXiv:2502.06264, Feb 2025',
        'flip graphs for the FULL product over Z₂, a 10×10 table',
        'the full product is theirs, and their squares land exactly ON the Montgomery bounds, never below. Their table is used here as the calibration ladder, not as a target. The words cyclic, truncated and negacyclic do not appear in their paper.'],
      ['Wang, arXiv:2603.07280, Mar 2026',
        '18 new LOWER bounds; and, in one footnote, a flip-graph search over F2 for T₉',
        'the lower walls on this page are his. His footnote also improves T₉ from 27 to 26 by exactly this method — so the one truncated case modern search has touched, it beat. That is the reason to expect the others to move.'],
    ]
  }) + '<div class="col">' + C.pRaw('This table is the correction. The task that produced this page was written '
    + 'around the claim that flip-graph search had never been pointed at polynomial multiplication. That is false, '
    + 'and finding out cost half an hour: Chen and Kauers had already done the full product, so attacking it '
    + 'would have been redoing their run. What survived the check is smaller and real — the cyclic and truncated '
    + 'families, which nobody has swept. An item whose appeal rests on "nobody has tried this" is resting on a '
    + 'negative that was never checked.') + '</div>'
}));

/* ---- §4 the instrument --------------------------------------------------- */
B_.push(C.section({
  lab: '§4 · the certifier', title: 'A scheme decomposes something — the question is what',
  bodyRaw: '<div class="col">' + C.pRaw('The failure mode for this kind of search is not an arithmetic slip, it is '
    + 'certifying the wrong tensor. Any set of rank-one terms decomposes SOME tensor; a certifier that accepts the '
    + 'target alongside the scheme is checking a tautology. So ' + C.m('instruments/bilinear') + ' takes only the '
    + 'target\'s NAME and rebuilds the tensor itself, by literal polynomial arithmetic — an actual convolution, an '
    + 'actual reduction modulo X&#8319;&#8722;1 — never by the index formula the search uses. The two derivations '
    + 'are asserted equal in the battery, entry by entry, for every family and size.')
  + C.pRaw('The red controls are what make that more than a claim. A correct ' + C.m('C7') + ' scheme audited as '
    + C.m('T7') + ' is REFUTED. Strassen\'s rank 7, handed over in the other C-index layout, is REFUTED — the '
    + 'target name pins the tensor and the instrument will not shop for a convention that makes a claim pass. And '
    + 'the one case this instrument shares with the older ' + C.m('instruments/strassen') + ' is put through both, '
    + 'which is worth more than either alone.')
  + C.pRaw('One more refusal is wired in and has never fired: a scheme that certifies BELOW a published lower '
    + 'bound refuses this build outright. It would mean a 2026 theorem is false, and it is far likelier that this '
    + 'repository is wrong — so it is treated as a bug report against us until an independent check says otherwise, '
    + 'rather than as the headline it would be.') + '</div>'
}));

B_.push(C.note({
  lab: 'what this page does NOT claim',
  bodyRaw: C.pRaw((beat.length
    ? 'The ' + beat.length + ' improved bound' + (beat.length > 1 ? 's are' : ' is') + ' an upper bound '
      + 'improvement and nothing more: it says a cheaper algorithm exists, it says nothing about optimality, and '
      + 'the gap to the lower bound stays open. '
    : 'Nothing here is new mathematics. The search matched the literature and did not get under it, on the '
      + 'budget it was given, and that is reported as the result rather than buried. ')
    + 'These are F2 statements; a scheme over F2 need not lift to Z or to any other field, and no lifting was '
    + 'attempted. ' + (above.length ? 'The ' + above.length + ' row' + (above.length > 1 ? 's are' : ' is')
      + ' still above the literature, listed rather than dropped. ' : '')
    + (untouched.length ? 'And this is not a complete sweep: ' + untouched.map(t => C.m(t)).join(', ')
      + ' carry published bounds and were never attempted here — the campaign was stopped, not exhausted. ' : '')
    + 'Published, not peer-reviewed, not independently rerun — which is exactly the status this machine exists to '
    + 'stop being true of other people\'s work, and it applies to ours the same way.')
}));

const foot = '<footer class="col"><p>Generated by tools/build-report-bilinear.js @ git ' + git + '. Gates at this '
  + 'build: the bilinear battery (' + nChecks + ' checks, ' + nReds + ' red controls, ' + nLadder + ' calibration '
  + 'rungs), and all ' + rows.length + ' stored schemes re-decided here from their bitmasks — '
  + equations.toLocaleString('en-US') + ' tensor equations over F2. A scheme that stopped closing, or one '
  + 'certifying below a published lower bound, would refuse this page.</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'polynomial-multiplication.html'),
  TPL.render({ title: 'A free search against forty-year-old multiplication bounds',
    bodyRaw: B_.join('\n\n'), footRaw: foot, path: '/reports/polynomial-multiplication.html',
    desc: 'The best known ways to multiply polynomials over F2 are hand constructions from the 1980s. Every lower bound under them moved in 2026. A free flip-graph walk, certified exactly, against the gap.' }));
console.log('reports/polynomial-multiplication.html written: ' + rows.length + ' targets, ' + beat.length
  + ' beaten, ' + match.length + ' matched, ' + above.length + ' above; battery ' + nChecks + ' checks @ git ' + git);
