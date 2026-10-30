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
const cp = require('child_process');
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

/* ---------------------------------------------------------------- 0 -----
   THE WORKING TREE IS ON DISK (2026-09-05). This repository lives under
   ~/Documents, which is iCloud Drive, and "Optimize Mac Storage" EVICTS files
   it has not seen opened for a while: the directory entry stays, `ls` and
   `stat` still report the full size, git sees no change — and a read returns
   ZERO BYTES. Found when playground/build.js died on JSON.parse of a record
   that had been there since yesterday, and shasum reported the hash of the
   empty string for a 9,894-byte TeX file. 365 tracked files were evicted at
   the time. A gate that reads an evicted page counts nothing on it and
   passes; the dash census went from 150 conforming uses to 115 and said "the
   ratchet holds". So this runs FIRST: every tracked file that has a size must
   read that size. If one does not, nothing else here is believed, and
   `make materialize` is the fix (reading through the tree pulls it back). */
{
  const list = cp.execSync('git ls-files -z', { cwd: ROOT, maxBuffer: 1 << 26 }).toString().split('\0').filter(Boolean);
  const evicted = [];
  for (const f of list) {
    const p = path.join(ROOT, f);
    let st; try { st = fs.statSync(p); } catch (e) { continue; }
    if (!st.isFile() || st.size === 0) continue;
    if (fs.readFileSync(p).length !== st.size) evicted.push(f);
  }
  /* AND THE IGNORED CORPORA (later the same day): apps/skyaudit/data holds
     2 GB of gitignored day files that its battery reads, and one of them was
     evicted an hour after the tracked tree had been pulled back — 'sp union
     corpus count' went RED with nothing in git to show for it. Ignored files
     are not read through here (2 GB a run); they are checked by the flag
     APFS sets on an evicted file, which clears once the file is back. Only
     the trees a battery reads: apps/, certs/, corpus/, site/apps/. */
  try {
    const ign = cp.execSync('git ls-files -o --ignored --exclude-standard -z -- apps certs corpus site/apps', { cwd: ROOT, maxBuffer: 1 << 26 })
      .toString().split('\0').filter((f) => f && !/node_modules|__pycache__|\.pytest_cache/.test(f));
    if (ign.length) {
      const flags = cp.execSync('xargs -0 stat -f "%f %N"', { cwd: ROOT, input: ign.join('\0') + '\0', maxBuffer: 1 << 26 }).toString().split('\n');
      for (const line of flags) { const m = /^(\d+) (.*)$/.exec(line); if (m && (Number(m[1]) & 0x40000000)) evicted.push(m[2] + '  (ignored, evicted)'); }
    }
  } catch (e) { /* no ignored files, or no stat: nothing to check */ }
  if (evicted.length) {
    bad('every tracked file reads the size it has on disk',
      evicted.length + ' file(s) read EMPTY — iCloud has evicted them. Run `make materialize`, then re-run.\n        '
      + evicted.slice(0, 8).join('\n        ') + (evicted.length > 8 ? '\n        …' : ''));
    console.log('\nREFUSED: the working tree is not on disk; no other check below is meaningful.');
    process.exit(1);
  } else ok('every tracked file reads the size it has on disk, and no corpus a battery reads is evicted', '[' + list.length + ' files]');
}


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
/* EVERY SCRIPT, NOT ONLY THE ONES NAMED battery (2026-09-05). The pattern used
   to match files named battery/selftest/test-engine and nothing else, so the
   cert-unit suite (test.mjs, reds.mjs, editor.test.mjs, replay.mjs), one
   interval test and two Python verifiers ran in `make test` and never on the
   control page while this check printed "the same batteries" — and the one
   row that WAS registered on both sides, concord.mjs, sat in build-control's
   Python list and was handed to python3, which nothing here could see either.
   Now: every $(NODE)/$(PY)/python3 script in the Makefile's test target (for-
   loops expanded, `cd dir && pytest file` resolved) against every script path
   in build-control's two registries. */
const batteriesIn = (text) => {
  const out = new Set();
  /* one-level for-loop expansion: `for t in a b c; do ... $$t ... done` */
  let expanded = text;
  const loop = /for (\w+) in ([^;]+); do([\s\S]*?)done/g;
  let l;
  while ((l = loop.exec(text))) for (const it of l[2].trim().split(/\s+/)) expanded += '\n' + l[3].split('$$' + l[1]).join(it);
  const add = (p) => { if (p && !p.includes('$$')) out.add(p.replace(/^\.\//, '')); };
  let m;
  /* `cd dir && python3 -m pytest file` names the file relative to dir: resolve
     it first, and take the form out of the text so it is not read twice */
  expanded = expanded.replace(/cd\s+([A-Za-z0-9/_.-]+)\s*&&\s*python3\s+-m\s+pytest\s+([A-Za-z0-9/_.-]+\.py)/g,
    (_, d, f) => { add(d + '/' + f); return ''; });
  const run = /(?:\$\((?:NODE|PY)\)|(?<![\w/])python3|(?<![\w/])node)\s+(?:-m\s+pytest\s+)?([A-Za-z0-9/_.$-]+\.(?:m?js|py))/g;
  while ((m = run.exec(expanded))) add(m[1]);
  return out;
};
/* build-control's registries: the script path inside each entry's argv array,
   and nothing from its note — a note that says "node test.mjs" is prose */
const controlScripts = (text) => {
  const out = new Set();
  const entry = /\[\s*'(?:[^'\\]|\\.)*',\s*\[([^\]]*)\]/g;   /* the name may carry an escaped quote */
  let e;
  while ((e = entry.exec(text))) {
    const m = /'((?:[A-Za-z0-9_./-]+\/)?[A-Za-z0-9_.-]+\.(?:m?js|py))'/.exec(e[1]);
    if (m) out.add(m[1].replace(/^\.\//, ''));
  }
  return out;
};
const testTarget = (() => { const i = MAKE.indexOf('\ntest:'); const rest = MAKE.slice(i + 1); const j = rest.search(/\n[a-z-]+:/); return j < 0 ? rest : rest.slice(0, j); })();
const registries = (() => { const a = CONTROL.indexOf('const BATTERIES'); const b = CONTROL.indexOf('function bat('); return CONTROL.slice(a, b); })();
const inMake = batteriesIn(testTarget), inControl = controlScripts(registries);
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
    /* both spellings of the two faces: the house --f-* and the frontier
       --font-* that /instruments was written in; tokens.js emits both */
    if (/^var\(--(f-(display|sans|mono)|font-(sans|mono))\)$/.test(v)) continue;
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
for (const d of ['site/about', 'site/machine', 'site/oracle', 'site/grammar']) {
  if (fs.existsSync(path.join(ROOT, d))) walk(d);
}
if (fs.existsSync(path.join(ROOT, 'site/index.html'))) pages.push('site/index.html');
/* THE STORY PAGES (2026-10-28, the WARRANT site pass). The easy read and the Uirapuru story draw the grammar — a station's
   outline, a dotted window, the toy's dotted numbers, a hatched toy — and were in no walk, so their legend and palette
   were checked by nobody. The round-one easy read (site/explained/v1/) is kept in its own palette beside them for
   comparison, a second language on purpose, and is not walked. */
for (const f of ['site/explained/index.html', 'site/uirapuru/index.html']) if (fs.existsSync(path.join(ROOT, f))) pages.push(f);
/* AND THE PAGES WHOSE BUILDERS WRITE STRAIGHT INTO site/ (2026-10-29, walked on the operator's word): /eth/, /papers/, /eleicoes2026/, and the two apps /janela/ (with /janela/metodo/) and /swell/. Each
   builder writes its page in place, so what is read here is current when the batteries run. /cv/ is not a page — the
   URL redirects to site/cv/carlos-toledo-cv.pdf — so there is nothing of it to walk. */
for (const d of ['site/eth', 'site/papers', 'site/eleicoes2026', 'site/janela', 'site/swell']) walk(d);
/* AND /instruments (2026-09-15). The walk below used to be added only after
   check 4 had run, so the type check covered 69 pages and the palette check
   90 — and four instruments pages carried a literal ui-monospace stack in
   their card art for ten days with this check green. One list, every page. */
walk('site/instruments');

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
for (const src of [T.DARKONLY, APP.APP_DARK, APP.APP_LIGHT, { s: T.SHADOW }])
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

/* THE LEGEND IS DERIVED, NEVER DECLARED (R20, built 2026-10-30). No builder tells a legend what to leave out (the
   `exclude:` lists are gone, and playground/warrant.js refuses one), and on every page a legend item names a standing
   the page draws: derived from the page or from the figure's markup, or — for a figure drawn at runtime, data-from —
   from the standings its data draws. A legend from before the rule (no data-s on its items) is not read. */
const Wr = require(path.join(ROOT, 'playground', 'warrant.js'));
const LABEL_S = Object.fromEntries(Wr.LEGEND.map((L) => [L.label, L.s]));
function legendOffences(html, label) {
  /* the derivation's own reading: decided is the site's default voice and is never shown absent; data-plus adds what
     the page's script draws */
  const have = Wr.standingsIn(html), out = [];
  have.add(Wr.DECIDED);
  for (const m of String(html).matchAll(/<div class="w-legend[^"]*"([^>]*)>([\s\S]*?)(?=<div class="w-legend|$)/g)) {
    if (/data-from="(data|markup)"/.test(m[1])) continue;   /* derived at build from its own figure or its data */
    const plus = (/data-plus="([a-z ]+)"/.exec(m[1]) || [null, '']) [1].split(' ').filter(Boolean).map((w) => LABEL_S[w]);
    for (const it of m[2].matchAll(/<div class="item" data-s="(\w+)">/g)) if (it[1] in LABEL_S && !have.has(LABEL_S[it[1]]) && !plus.includes(LABEL_S[it[1]])) out.push(label + ': ' + it[1]);
  }
  return out;
}
const srcExcludes = [];
for (const d of ['tools', 'apps', 'playground', 'design']) (function w(dir) {
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = dir + '/' + e.name;
    if (e.isDirectory()) { if (!/node_modules|vendor|\.venv|\/out$/.test(rel)) w(rel); }
    else if (e.name.endsWith('.js') && !['tools/check-wiring.js', 'playground/warrant.js'].includes(rel) && /legend\w*\(\{[^}]*exclude/.test(read(rel))) srcExcludes.push(rel);
  }
})(d);
const legendBad = srcExcludes.map((f) => f + ': an exclude: list').concat(pages.flatMap((p) => legendOffences(read(p), p)));
if (legendBad.length) bad('every legend is derived: no exclude list, and no item for a standing its page does not draw',
  legendBad.length + ':\n        ' + legendBad.slice(0, 8).join('\n        '));
else ok('every legend is derived: no exclude list, and no item for a standing its page does not draw', '[' + pages.length + ' pages, the builders]');
red('a legend item for a standing the page does not draw is caught',
  legendOffences('<span class="w-val w-computed">1</span><div class="w-legend" data-n="2"><div class="item" data-s="computed"></div><div class="item" data-s="chosen"></div></div>', 'planted').length === 1);
red('a derived legend drops the item its page does not draw',
  !/data-s="chosen"/.test(Wr.deriveLegends('<span class="w-val w-computed">1</span>' + Wr.legendHtml({ compact: true }))));
red('a hand-written exclude list is refused by the module', (() => { try { Wr.legendHtml({ exclude: [Wr.CHOSEN] }); return false; } catch (e) { return true; } })());

/* A MARK'S REASON IS VISIBLE TEXT (R22, built 2026-10-30): no value on a page keeps its reason only in a tooltip.
   design/reasons.js says each such reason once, at its section's end (or the page's), and this reads the result. */
const RS = require(path.join(ROOT, 'design', 'reasons.js'));
function reasonOffences(html, label) {
  const vis = RS.visibleText(html), out = [];
  for (const m of String(html).replace(/<script[\s\S]*?<\/script>/g, '').matchAll(/<span\b[^>]*\bclass="[^"]*\bw-val\b[^"]*"[^>]*\btitle="([^"]+)"/g)) {
    const t = RS.reasonOf(m[1]).split(/ — |: /).pop().trim().slice(0, 40);
    if (t && !vis.includes(t)) out.push(label + ': ' + t);
  }
  return out;
}
const reasonBad = pages.flatMap((p) => reasonOffences(read(p), p));
if (reasonBad.length) bad('no value keeps its reason only in a tooltip', reasonBad.length + ':\n        ' + reasonBad.slice(0, 6).join('\n        '));
else ok('no value keeps its reason only in a tooltip', '[' + pages.length + ' pages]');
red('a value whose reason is only its tooltip is caught', reasonOffences('<section><span class="w-val w-computed" title="computed — measured on one machine">3</span></section>', 'planted').length === 1);
red('the reasons pass says it in words', reasonOffences(RS.deriveReasons('<section><span class="w-val w-computed" title="computed — measured on one machine">3</span></section>'), 'planted').length === 0);

/* A VOID HAS A SIZE (R28, built 2026-10-30): the chart kit never bridges a refused value. A null point breaks its line
   and its gap is drawn as a hatched void across the plot; a null bar keeps the row's full width as the void, with ∅. */
const CHk = require(path.join(ROOT, 'design', 'charts.js'));
red('a refused point in a line is drawn as a void, never bridged', (() => {
  const l = CHk.lines({ w: 400, h: 200, x0: 0, x1: 4, y0: 0, y1: 4, alt: 'planted', series: [{ name: 'a', pts: [[0, 1], [1, 2], [2, null], [3, 3]] }] });
  return /class="w-void"/.test(l) && (/<path d="(M[^"]*)"[^>]*stroke-linejoin/.exec(l) || ['', ''])[1].split('M').length === 3; })());
red('a refused bar keeps its row as a void with its word', /class="w-void"[^>]*width="[0-9.]+"/.test(CHk.bars({ w: 400, max: 10, alt: 'planted', rows: [{ k: 'a', v: 3 }, { k: 'b', v: null }] })));

/* THE HERO AND ITS WITNESS (D12, ruled 2026-10-29). One figure per page may be the hero
   (design/components.js figure({ hero: true })), and on a page that has one, a witness is an event before it is a
   word: the first × a reader meets is the hero's own mark (W.witnessMark, class w-wx), drawn no thinner than the
   hero's decided line, before any inline glyph. A page with no × passes; a page with no hero is not read here. */
function heroOffences(html, label) {
  const tags = [...html.matchAll(/<[a-z]+\s[^>]*\bdata-hero[\s>]/g)];
  if (tags.length > 1) return [label + ': ' + tags.length + ' heroes, and a page has one'];
  if (!tags.length) return [];
  const start = tags[0].index, end = html.indexOf('</figure>', start);
  const first = /class="(?:wx|w-wx)"/.exec(html);
  if (!first) return [];
  if (!(first.index > start && first.index < end && first[0] === 'class="w-wx"')) return [label + ': the first × a reader meets is not drawn in the hero'];
  const hero = html.slice(start, end);
  const width = (tag) => Number((/stroke-width="([\d.]+)"/.exec(tag) || [0, 0])[1]);
  const wx = width(/<path class="w-wx"[^>]*>/.exec(hero)[0]);
  const line = Math.max(0, ...[...hero.matchAll(/<[a-z]+\s[^>]*class="[^"]*\bw-decided\b[^>]*>/g)].map((m) => width(m[0])));
  return wx >= line ? [] : [label + ': the hero\'s × is drawn at ' + wx + ', thinner than its decided line at ' + line];
}
const heroBad = [];
for (const p of pages) heroBad.push(...heroOffences(read(p), p));
const heroed = pages.filter((p) => /<[a-z]+\s[^>]*\bdata-hero[\s>]/.test(read(p)));
if (heroBad.length) bad('one hero per page, and its × is the first a reader meets', heroBad.join('\n        '));
else ok('one hero per page, and its × is the first a reader meets', '[' + heroed.length + ' pages declare a hero]');

const HFIG = (inner) => '<div class="wide hero" data-hero><figure><div class="figbox"><svg>' + inner + '</svg></div><figcaption>c</figcaption></figure></div>';
const HX = (w) => '<path class="w-wx" d="M0,0L1,1" fill="none" stroke-width="' + w + '"/>';
red('a second hero on a page is caught', heroOffences(HFIG('') + HFIG(''), 'planted').length === 1);
red('an inline × before the hero\'s own is caught',
  heroOffences('<p><span class="wx">&times;</span></p>' + HFIG(HX(3)), 'planted').length === 1);
red('a hero × thinner than its decided line is caught',
  heroOffences(HFIG('<circle class="w-decided" stroke-width="3"/>' + HX(2)), 'planted').length === 1);
red('a hero whose × comes first, at weight, is NOT flagged',
  heroOffences(HFIG('<circle class="w-decided" stroke-width="1.5"/>' + HX(3)) + '<p><span class="wx">&times;</span></p>', 'planted').length === 0);

/* THE TIER 1 HEROES (D12 batch 1, 2026-10-29). WARRANT.md's site pass names the Tier 1 pages, and each one either
   declares a hero in its HTML, or design/heroes.json says why it has none, or, for an app only, why it waits for batch
   2. The list is read from WARRANT.md's own Tier 1 line, so a page added there and not in the registry refuses; a row
   that says hero over a page that lost it, or none over a page that grew one, is stale and refuses. An app is the
   landing or a page built by apps/<name>/build.js: a fact of the tree, never a word in the registry. */
function tier1Names(md) {
  const m = /\*\*Tier 1, the pages people land on:\*\*([\s\S]*?)\n- \*\*/.exec(md);
  if (!m) return null;
  const t = m[1].replace(/\s+/g, ' ').trim();
  const par = /\(([^)]*)\)/.exec(t);
  const reports = par ? par[1].split(/,\s*/).map((s) => s.trim()).filter(Boolean) : [];
  const groups = (par ? t.slice(0, par.index) : t).split(';').map((g) => g.trim()).filter((g) => g && !/\breports\b/.test(g));
  return groups.flatMap((g) => g.split(/,\s*|\s+and\s+/)).map((s) => s.replace(/^and\s+/, '').trim()).filter(Boolean).concat(reports);
}
const isApp = (key) => key === 'index.html' || fs.existsSync(path.join(ROOT, 'apps', key.split('/')[0], 'build.js'));
const HERO_TAG = /<[a-z]+\s[^>]*\bdata-hero[\s>]/;
function tierOffences(names, reg, htmlOf, appOf) {
  if (!names || !names.length) return ['design/WARRANT.md: no Tier 1 line to read'];
  const out = [], rows = Object.entries((reg && reg.pages) || {});
  for (const n of names) if (!rows.some(([, r]) => r.name === n)) out.push(n + ': a Tier 1 page in WARRANT.md with no row in design/heroes.json');
  for (const [key, r] of rows) {
    if (!names.includes(r.name)) out.push(key + ': registered as "' + r.name + '", which WARRANT.md\'s Tier 1 line does not name');
    const kinds = ['hero', 'none', 'pending'].filter((k) => r[k] !== undefined);
    if (kinds.length !== 1) { out.push(key + ': declares ' + (kinds.join(' and ') || 'nothing') + '; a row is exactly one of hero, none, pending'); continue; }
    const html = htmlOf(key);
    if (html === null) { out.push(key + ': no built page at this path'); continue; }
    const has = HERO_TAG.test(html);
    if (kinds[0] === 'hero') { if (r.hero !== true || !has) out.push(key + ': the registry says hero, and the page declares none'); continue; }
    if (typeof r[kinds[0]] !== 'string' || r[kinds[0]].trim().length < 12) out.push(key + ': ' + kinds[0] + ' with no reason given');
    if (has) out.push(key + ': the page declares a hero, and the registry still says ' + kinds[0]);
    if (kinds[0] === 'pending' && !appOf(key)) out.push(key + ': pending is for an app (batch 2), and this page is not one');
  }
  return out;
}
{
  const HEROES = JSON.parse(read('design/heroes.json'));
  const t1 = tier1Names(read('design/WARRANT.md'));
  /* a report is read where its builder writes it (the control build runs this before the sync); the rest from site/ */
  const htmlOf = (k) => { const p = k.startsWith('reports/') ? k : 'site/' + k; return fs.existsSync(path.join(ROOT, p)) ? read(p) : null; };
  const tierBad = tierOffences(t1, HEROES, htmlOf, isApp);
  const count = (k) => Object.values(HEROES.pages).filter((r) => r[k] !== undefined).length;
  if (tierBad.length) bad('every Tier 1 page declares a hero, or the registry says why not', tierBad.join('\n        '));
  else ok('every Tier 1 page declares a hero, or the registry says why not', '[' + t1.length + ' Tier 1 pages: '
    + count('hero') + ' heroes, ' + count('none') + ' with none and a reason, ' + count('pending') + ' apps pending]');

  const NAMES = ['the home page', 'Method', 'gsm8k-audit'];
  const REG = { pages: { 'index.html': { name: 'the home page', pending: 'an app: batch 2 of D12' },
    'machine/index.html': { name: 'Method', none: 'no figure: prose and one table' }, 'reports/gsm8k-audit.html': { name: 'gsm8k-audit', hero: true } } };
  const HTML = { 'index.html': '<p>the landing</p>', 'machine/index.html': '<p>the method</p>', 'reports/gsm8k-audit.html': HFIG('') };
  const at = (over) => (k) => (over && k in over ? over[k] : k in HTML ? HTML[k] : null);
  const app = (k) => k === 'index.html';
  const edit = (f) => { const r = JSON.parse(JSON.stringify(REG)); f(r.pages); return r; };
  red('a Tier 1 registry that holds is NOT flagged', tierOffences(NAMES, REG, at(), app).length === 0);
  red('a page added to WARRANT.md\'s Tier 1 line is read from it',
    (tier1Names('- **Tier 1, the pages people land on:** the home page and Method; and the two reports (gsm8k-audit, new-one).\n- **Tier 2:** x') || []).join() === 'the home page,Method,gsm8k-audit,new-one');
  red('a Tier 1 page with no registry row is caught', tierOffences(NAMES.concat(['new-one']), REG, at(), app).length === 1);
  red('a page with no hero and no reason is caught', tierOffences(NAMES, edit((p) => { p['machine/index.html'].none = ''; }), at(), app).length === 1);
  red('pending on a page that is not an app is caught',
    tierOffences(NAMES, edit((p) => { delete p['machine/index.html'].none; p['machine/index.html'].pending = 'batch 2 of D12, later'; }), at(), app).length === 1);
  red('a hero row over a page with no hero is caught', tierOffences(NAMES, REG, at({ 'reports/gsm8k-audit.html': '<p>no figure</p>' }), app).length === 1);
  red('a none row over a page that declares a hero is caught', tierOffences(NAMES, REG, at({ 'machine/index.html': HFIG('') }), app).length === 1);
}

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
