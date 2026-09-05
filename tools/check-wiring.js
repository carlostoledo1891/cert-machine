#!/usr/bin/env node
/* check-wiring.js — the gate for the registries nobody was checking.
   tools/ · cert-machine

   WHY THIS EXISTS. Three defects were found by eye on 2026-08-31, and not one
   of them was a code-quality problem. Each was a LIST SOMEBODY HAS TO
   REMEMBER TO UPDATE:

     · `make reports` was missing build-report-glide-band.js, so a site-wide
       restyle would have left the newest page as the only serif one.
     · design/app-shell.js restated its own font stack instead of deriving it,
       so the site ran two type systems and tokens.js governed one.
     · seven batteries ran in `make test` and NOT in build-control's list,
       while the control build reported "batteries 29/29 green" — a
       completeness claim over an incomplete set.

   A registry that is only maintained by memory will diverge; the house rule
   already says so ("a rule defined twice WILL diverge — the corpus.js
   lesson"). This file turns each of those into a check that fails the build.

   Every check ships a RED CONTROL: a planted violation the check must catch.
   A check that cannot fail is decoration, which is the other lesson of that
   day.

   run: node tools/check-wiring.js                                          */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const T = require(path.join(ROOT, 'design', 'tokens.js'));

let checks = 0, fails = 0, reds = 0, redTotal = 0;
const ok = (name, detail) => { checks++; console.log('  ok  ' + String(checks).padStart(2) + '  ' + name + (detail ? '   ' + detail : '')); };
const bad = (name, detail) => { checks++; fails++; console.log('  FAIL ' + String(checks).padStart(2) + '  ' + name + '\n        ' + detail); };
const red = (name, fired) => {
  redTotal++;
  if (fired) { reds++; console.log('       RED ok    ' + name); }
  else { fails++; console.log('       RED FAIL  ' + name + ' — the check cannot fail, so it is decoration'); }
};

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const MAKE = read('Makefile');
const CONTROL = read('tools/build-control.js');

console.log('wiring battery');

/* ---------------------------------------------------------------- 1 -----
   Every report builder is invoked by `make reports`. Without this, a builder
   can exist, be committed, produce a page — and be skipped by the one target
   that rebuilds the site.                                                 */
console.log('-- registries');

const reportsTarget = (() => {
  const m = /\nreports:\n((?:\t.*\n)+)/.exec(MAKE);
  return m ? m[1] : '';
})();
const builders = fs.readdirSync(path.join(ROOT, 'tools'))
  .filter((f) => /^build-report-.*\.js$/.test(f)).sort();
const missingFromTarget = builders.filter((b) => !reportsTarget.includes(b));
if (!reportsTarget) bad('`make reports` target found', 'could not locate a reports: target in the Makefile');
else if (missingFromTarget.length) bad('every report builder is in `make reports`',
  missingFromTarget.length + ' not invoked: ' + missingFromTarget.join(', '));
else ok('every report builder is in `make reports`', '[' + builders.length + ' builders]');

red('a builder missing from `make reports` is caught',
  ['tools/build-report-planted.js'].filter((b) => !reportsTarget.includes(b)).length === 1);

/* ---------------------------------------------------------------- 2 -----
   The two battery registries agree. `make test` and build-control each hold
   their own list; the control build prints a green count over ITS list, so a
   battery present in one and absent from the other makes that count a claim
   about a set the reader does not have.                                   */
const batteriesIn = (text) => {
  const out = new Set();
  const re = /([A-Za-z0-9/_.-]*(?:battery|selftest|test-engine)[A-Za-z0-9/_.-]*\.js)/g;
  let m;
  while ((m = re.exec(text))) out.add(m[1].replace(/^\.\//, ''));
  return out;
};
const inMake = batteriesIn(MAKE), inControl = batteriesIn(CONTROL);
const onlyMake = [...inMake].filter((b) => !inControl.has(b)).sort();
const onlyControl = [...inControl].filter((b) => !inMake.has(b)).sort();
if (onlyMake.length || onlyControl.length) {
  bad('`make test` and build-control run the same batteries',
    (onlyMake.length ? 'in make test only: ' + onlyMake.join(', ') : '')
    + (onlyMake.length && onlyControl.length ? '\n        ' : '')
    + (onlyControl.length ? 'in build-control only: ' + onlyControl.join(', ') : ''));
} else ok('`make test` and build-control run the same batteries', '[' + inMake.size + ' each]');

red('a battery in one registry and not the other is caught',
  [...batteriesIn('$(NODE) instruments/planted/battery.js')].filter((b) => !inControl.has(b)).length === 1);

/* ---------------------------------------------------------------- 3 -----
   This file is itself registered in both places. A wiring check that nothing
   runs is the defect it was written to prevent.

   GENERALISED 2026-09-04. Checking only THIS file left a hole the size of the
   defect: check 2's pattern matches files named battery/selftest/test-engine,
   and the gates in tools/ are named check-*.js, so tools/check-stale-claims.js
   ran in `make test` and nowhere else — build-control printed a green count
   over a set that did not include it. The rule is now the same rule check 2
   applies to batteries: every gate in tools/ is registered in BOTH places, and
   the list is FOUND on disk rather than written down.                       */
const gates = fs.readdirSync(path.join(ROOT, 'tools'))
  .filter((f) => /^check-.*\.js$/.test(f)).sort();
const unregistered = gates.filter((g) => !(MAKE.includes(g) && CONTROL.includes(g)));
if (unregistered.length) bad('every tools/check-*.js gate is in both `make test` and build-control',
  unregistered.map((g) => g + ' — make test: ' + (MAKE.includes(g) ? 'yes' : 'NO')
    + ' · build-control: ' + (CONTROL.includes(g) ? 'yes' : 'NO')).join('\n        '));
else ok('every tools/check-*.js gate is in both `make test` and build-control', '[' + gates.length + ' gates]');

red('a gate registered in only one place is caught',
  ['check-planted.js'].filter((g) => !(MAKE.includes(g) && CONTROL.includes(g))).length === 1);

/* ---------------------------------------------------------------- 4 -----
   No built page declares a literal font stack outside the :root block.
   design/tokens.js emits --f-display/--f-sans/--f-mono once, for both page
   shells; everything else must reference them. This is what makes "the site
   has one type system" a fact the build can check rather than a claim.   */
console.log('-- the type system');

const STACKS = new Set([T.TYPE.display, T.TYPE.body, T.TYPE.mono].map((s) => s.replace(/'/g, '"')));
const GENERIC = /^(inherit|initial|unset|revert|sans-serif|serif|monospace|ui-monospace,monospace)$/;

function fontOffences(html, label) {
  /* strip the :root blocks — that is the ONE place a literal stack belongs */
  const body = html.replace(/:root(?:\[[^\]]*\])?\s*\{[^}]*\}/g, '');
  const out = [];
  /* a font stack is a comma-separated list of quoted names, bare idents or a
     var() reference — matched explicitly so the value stops at the closing
     quote of a style="..." attribute instead of swallowing the markup after it */
  const item = '(?:"[^"]*"|\'[^\']*\'|var\\([^)]*\\)|[A-Za-z0-9_-]+(?:[ \\t][A-Za-z0-9_-]+)*)';
  const re = new RegExp('font-family:\\s*(' + item + '(?:\\s*,\\s*' + item + ')*)', 'g');
  let m;
  while ((m = re.exec(body))) {
    const v = m[1].trim().replace(/'/g, '"').replace(/\s*,\s*/g, ',');
    if (!v) continue;
    if (/^var\(--f-(display|sans|mono)\)$/.test(v)) continue;
    if (GENERIC.test(v)) continue;
    if (STACKS.has(v)) continue;                      /* a token stack, verbatim */
    out.push(label + ': ' + v.slice(0, 72));
  }
  return out;
}

/* WHICH FILES TO SCAN, and it matters. The first version walked site/, which
   made this check fail inside `make control` for a reason that had nothing to
   do with fonts: control runs its batteries BEFORE build-site syncs, so the
   check was reading the previous build's output. Scan what is current at that
   moment instead — the report builds themselves, the control page, and the
   app pages, which their own builder writes straight into site/apps. site/ is
   a byte copy of these, so nothing is lost by checking the originals. */
const pages = [];
const walk = (dir) => {
  if (!fs.existsSync(path.join(ROOT, dir))) return;
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = dir + '/' + e.name;
    if (e.isDirectory()) { if (!/vendor|node_modules/.test(e.name)) walk(rel); }
    else if (e.name.endsWith('.html')) pages.push(rel);
  }
};
walk('reports');
walk('site/apps');
if (fs.existsSync(path.join(ROOT, 'index.html'))) pages.push('index.html');
/* the four standing sections were in no walk, so the palette and shape checks
   below were running over an incomplete set — the same defect this file exists
   to name, and the same one it caught in make test on 2026-09-05. */
for (const d of ['site/about', 'site/machine', 'site/oracle']) {
  if (fs.existsSync(path.join(ROOT, d))) walk(d);
}
if (fs.existsSync(path.join(ROOT, 'site/index.html'))) pages.push('site/index.html');

const offences = [];
for (const p of pages) offences.push(...fontOffences(read(p), p));
if (offences.length) bad('no built page declares a font outside the token block',
  offences.length + ' literal stack(s):\n        ' + offences.slice(0, 6).join('\n        '));
else ok('no built page declares a font outside the token block', '[' + pages.length + ' pages]');

red('a literal font stack outside :root is caught',
  fontOffences('<style>:root{--f-sans:"IBM Plex Sans"}\n.x{font-family:"Comic Sans MS",cursive}</style>', 'planted').length === 1);
red('a stack INSIDE :root is not flagged (or the check would be unusable)',
  fontOffences('<style>:root{--f-sans:"IBM Plex Sans","Helvetica Neue",Helvetica,Arial,sans-serif}</style>', 'planted').length === 0);

/* ---------------------------------------------------------------- 5 -----
   No built page PAINTS with a colour no token names. The sibling of check 4,
   and it found what check 4's shape predicted it would: /instruments/affect
   and /instruments/answer-shape were filling labels with #8e8e9a, #5a5a66 and
   #1a1a1f — one and two hex digits off --ink-3, --ink-4 and --surface-2, which
   is precisely why nobody saw them. One of the three was reached through
   `var(--ink-6, #5a5a66)`, a fallback to a token this repository has never
   declared, so the literal won every time.

   ALPHA IS FREE, AND THAT IS THE WHOLE DESIGN OF THIS CHECK. A wash is a token
   at an opacity: /instruments/plates paints 4,051 marks as rgba(246,246,248,a)
   over hundreds of values of a, and every one of them is --ink. Demanding a
   named token per opacity step would be a gate refusing a direction rather
   than measuring a fact, and CLAUDE.md says to delete those. So the check is
   on the RGB, and the RGB must be one some token declares.                 */
console.log('-- the palette');

const rgbOf = (c) => {
  c = String(c).trim().toLowerCase();
  let m = /^#([0-9a-f]{3})$/.exec(c);
  if (m) return [0, 1, 2].map((i) => parseInt(m[1][i] + m[1][i], 16)).join(',');
  m = /^#([0-9a-f]{6})$/.exec(c);
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].substr(i, 2), 16)).join(',');
  m = /^rgba?\(([^)]+)\)$/.exec(c);
  if (m) return m[1].split(/[,\/ ]+/).filter(Boolean).slice(0, 3).map(Number).join(',');
  return null;
};
const COLOUR = /#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b|rgba?\([0-9 ,.%\/]+\)/g;
/* the declared palette: this file's tokens plus the app shell's verdict
   colours, which are a real product palette and are declared in ITS block */
const APP = require(path.join(ROOT, 'design', 'app-shell.js'));
const declared = new Set();
for (const src of [T.DARKONLY, APP.APP_DARK, { s: T.SHADOW }])
  for (const v of Object.values(src)) for (const c of String(v).match(COLOUR) || []) {
    const r = rgbOf(c); if (r) declared.add(r);
  }

function colourOffences(html, label) {
  const clean = String(html).replace(/data:[a-z/+;=-]*base64,[A-Za-z0-9+/=]+/g, '');
  /* a page may also declare its own tokens; those blocks are the one place a
     literal belongs, exactly as :root is for a font stack */
  const own = new Set();
  for (const m of clean.matchAll(/:root(?:\[[^\]]*\])?(?::not\([^)]*\))?\s*\{([^}]*)\}/g))
    for (const c of m[1].match(COLOUR) || []) { const r = rgbOf(c); if (r) own.add(r); }
  const body = clean.replace(/:root(?:\[[^\]]*\])?(?::not\([^)]*\))?\s*\{[^}]*\}/g, '');
  /* look ONLY where a colour can be. "Erdos #290" is prose, not a colour. */
  const ctx = [/<style[^>]*>([\s\S]*?)<\/style>/g, /style="([^"]*)"/g,
    /(?:fill|stroke|stop-color|flood-color|color)="([^"]*)"/g];
  const out = [];
  for (const re of ctx) { re.lastIndex = 0; let m;
    while ((m = re.exec(body))) for (const c of m[1].match(COLOUR) || []) {
      const r = rgbOf(c);
      if (r && !declared.has(r) && !own.has(r)) out.push(label + ': ' + c);
    } }
  return out;
}

walk('site/instruments');
const paint = [];
for (const p of pages) paint.push(...colourOffences(read(p), p));
const uniq = [...new Set(paint)];
if (paint.length) bad('no built page paints with a colour outside the palette',
  paint.length + ' use(s) of ' + uniq.length + ' colour(s):\n        ' + uniq.slice(0, 8).join('\n        '));
else ok('no built page paints with a colour outside the palette', '[' + pages.length + ' pages]');

/* ------------------------------------------------- the shape scale --------
   THE SIBLING OF THE PALETTE CHECK, 2026-09-05. design/tokens.js offers four
   radii — s 6, m 10, l 16, pill 999 — and the site was shipping SEVEN distinct
   container values against them, because the tokens existed and almost nobody
   referenced them: 378 literal 10px (the token's own value, written by hand),
   plus 8px, 9px and 12px that are on no scale at all. A token nobody uses is
   not a design system, it is a suggestion.

   MARKS ARE NOT CONTAINERS and keep their literals. A 4px-tall progress bar, a
   scrollbar thumb, a 2px focus ring: their radius is a shape detail of the mark,
   not container geometry, and forcing them onto a container scale would be the
   gate refusing a direction rather than measuring a fact. The ceiling is stated
   here and it is the whole rule: at or below 5px is a mark, above it is a
   container and comes from a token. Vendored stylesheets are somebody else's. */
const MARK_RADIUS_MAX = 5;
const radiusOffences = (body, label) => {
  const out = [];
  const re = /border-radius:\s*(\d+)px/g;
  let m;
  while ((m = re.exec(body))) {
    const px = Number(m[1]);
    if (px > MARK_RADIUS_MAX) out.push(label + ': ' + px + 'px');
  }
  return out;
};
const shape = [];
for (const p of pages) { if (!/\/vendor\//.test(p)) shape.push(...radiusOffences(read(p), p)); }
const shapeUniq = [...new Set(shape)];
if (shape.length) bad('no built page sets a container radius outside the shape scale',
  shape.length + ' use(s):\n        ' + shapeUniq.slice(0, 8).join('\n        ')
  + '\n        the scale is design/tokens.js SHAPE; at or below '
  + MARK_RADIUS_MAX + 'px is a mark and keeps its literal');
else ok('no built page sets a container radius outside the shape scale',
  '[' + pages.length + ' pages, marks at or below ' + MARK_RADIUS_MAX + 'px exempt]');

red('a container radius off the scale is caught',
  radiusOffences('<style>.x{border-radius:12px}</style>', 'planted').length === 1);
red('a mark radius at or below the ceiling is NOT flagged',
  radiusOffences('<style>.bar{border-radius:3px}</style>', 'planted').length === 0);
red('a tokenised radius is NOT flagged',
  radiusOffences('<style>.card{border-radius:var(--radius-m)}</style>', 'planted').length === 0);

red('a colour no token names is caught',
  colourOffences('<style>.x{color:#8e8e9a}</style>', 'planted').length === 1);
red('a palette colour at any opacity is NOT flagged (a wash is a token)',
  colourOffences('<style>.x{fill:rgba(246,246,248,0.037)}</style>', 'planted').length === 0);
red('a colour the page itself declares is not flagged',
  colourOffences('<style>:root{--x:#123456}\n.y{color:#123456}</style>', 'planted').length === 0);

/* ---------------------------------------------------------------- 6 -----
   A PAGE THAT DRAWS THE GRAMMAR PRINTS THE GRAMMAR. warrant.js has said from
   its first line that "a grammar nobody is told about is a decoration" — and
   said it in a comment, which is exactly the kind of rule that holds until
   somebody is in a hurry. It is a check now.

   The marks are what count, not the stylesheet: every page inlines the shared
   component layer, so the CSS rule `.w-computed { stroke: … }` is on all of
   them. What makes a page a CONSUMER of the grammar is a mark that carries the
   class — class="w-decided", a w-val span — and any page with one of those
   must also carry a w-legend saying what the patterns mean.                */
console.log('-- the grammar');

const MARK = /class="[^"]*\bw-(?:decided|computed|chosen|void|val)\b/;
const LEG = /class="[^"]*\bw-legend\b/;
function grammarOffences(html, label) {
  return MARK.test(html) && !LEG.test(html) ? [label] : [];
}
const undeclared = [];
for (const p of pages) undeclared.push(...grammarOffences(read(p), p));
const drawing = pages.filter((p) => MARK.test(read(p)));
if (undeclared.length) bad('every page that draws the grammar prints its legend',
  undeclared.length + ' draw it silently:\n        ' + undeclared.join('\n        '));
else ok('every page that draws the grammar prints its legend',
  '[' + drawing.length + ' of ' + pages.length + ' pages draw it]');

red('a page drawing a grammar mark with no legend is caught',
  grammarOffences('<svg><line class="w-computed"/></svg>', 'planted').length === 1);
red('a page that only DECLARES the CSS is not flagged',
  grammarOffences('<style>.w-computed { stroke: var(--ink-3); }</style>', 'planted').length === 0);

/* ---------------------------------------------------------------- 7 -----
   THE ARCHIVE AND THE CITATION AGREE, and the one description is one.

   CITATION.cff named version v2026.09.1 and carried the DOI of v2026.09 —
   10.5281/zenodo.22257596 instead of 10.5281/zenodo.22285003 — for a day and a
   half. Nothing caught it because the version string and the DOI were two
   facts nobody had written down together. corpus/zenodo.json writes them down
   together; this check reads it.

   And CLAUDE.md's D1 adopted ONE description for a year, to appear in the site
   title, the README, CITATION.cff and .zenodo.json and to be paraphrased
   nowhere. A decision like that is a list somebody has to remember, which is
   the one thing this file exists to replace.                               */
console.log('-- the archive');

const Z = JSON.parse(read('corpus/zenodo.json'));
const CFF = read('CITATION.cff');
const ZEN = JSON.parse(read('.zenodo.json'));
const cffField = (k) => { const m = new RegExp('^' + k + ':\\s*"?([^"\\n]+)"?', 'm').exec(CFF); return m ? m[1].trim() : null; };

const cffVer = cffField('version'), cffDoi = cffField('doi');
const dep = Z.versions.find((v) => v.version === cffVer);
if (!dep) bad('CITATION.cff names a version corpus/zenodo.json records',
  'CITATION.cff version "' + cffVer + '" is not in the deposit record');
else if (dep.doi !== cffDoi) bad('CITATION.cff cites the DOI of the version it names',
  'names ' + cffVer + ' but cites ' + cffDoi + '; that version is ' + dep.doi);
else ok('CITATION.cff cites the DOI of the version it names', '[' + cffVer + ' = ' + cffDoi + ']');

if (Z.latest !== cffVer) bad('CITATION.cff cites the LATEST deposit',
  'record latest is ' + Z.latest + ', CITATION.cff names ' + cffVer);
else ok('CITATION.cff cites the LATEST deposit');

/* the one description, in the four places D1 named */
const ONE = Z.titleLag.shouldBe;
const tail = ONE.replace(/^cert-machine:\s*/i, '');
const places = [['CITATION.cff', cffField('title')], ['.zenodo.json', ZEN.title]];
const wrong = places.filter(([, v]) => (v || '').toLowerCase() !== ONE.toLowerCase());
const prose = [['CLAUDE.md', read('CLAUDE.md')], ['README.md', read('README.md')]]
  .filter(([, v]) => !new RegExp(tail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(v));
if (wrong.length || prose.length) bad('the one description is one, in all four places',
  [...wrong.map(([f, v]) => f + ': "' + String(v).slice(0, 60) + '…"'),
    ...prose.map(([f]) => f + ': does not carry it')].join('\n        '));
else ok('the one description is one, in all four places', '[CLAUDE.md · README.md · CITATION.cff · .zenodo.json]');

/* the lag is REPORTED, not failed: only the depositor's account can close it */
if (Z.titleLag.state.startsWith('OPEN')) {
  console.log('       NOTE  ' + Z.titleLag.liveTitleOn.length + ' published Zenodo record(s) still carry the retired title.');
  console.log('             Operator action, owed since 2026-09-03 — see corpus/zenodo.json titleLag.howToClose.');
}

red('a CITATION.cff citing another version\'s DOI is caught', (() => {
  const other = Z.versions.find((v) => v.version !== Z.latest);
  return other && other.doi !== cffDoi;
})());
red('a paraphrase of the one description is caught',
  !new RegExp(tail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test('cert-machine: verification layers for AI-scale mathematical search'));

/* ------------------------------------------------------------------------ */
console.log('    every falsifier turned its target red   [' + reds + '/' + redTotal + ']');
console.log('\n' + (fails === 0 ? 'ALL PASS' : fails + ' FAILED')
  + '   (' + checks + ' checks, ' + reds + '/' + redTotal + ' falsifiers)');
process.exit(fails === 0 ? 0 : 1);
