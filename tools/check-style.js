#!/usr/bin/env node
/* check-style.js — THE STYLESHEET GATE. What a page's CSS is made of, measured.
   tools/ · cert-machine · 2026-09-15

   WHY THIS EXISTS. On 2026-09-15 a review of the 90 built pages found, with
   every gate green:

     · every container radius on the report side computing to 0px for ten
       days — commit 02e5768 rewrote them as var(--radius-m) and nothing on
       that side ever DEFINED the name. check-wiring's radius check reads the
       token name and passed. 219 unresolved references on 71 pages.
     · three instruments referencing var(--mono) and var(--line), tokens this
       repository has never declared: a panel meant to be mono set in Inter,
       a hairline border painted in body ink.
     · 685 inline style attributes on 47 pages from 30 source files, a second
       stylesheet nobody can read.
     · four instruments carrying a literal ui-monospace stack that the type
       check could not see, because that check walked 69 pages and the
       palette check 90.

   Every one of those is a fact about bytes, and a fact about bytes is what a
   gate is for. FIVE FACTS, per built page:

     attrs       style="…" attributes, HTML or SVG.
     decls       those of them carrying a REAL declaration — anything but a
                 custom property. THIS is the number with a target of zero.
                 An inline `margin-top`, `max-width`, `font-family` or
                 `grid-template-columns` is a design decision written where no
                 stylesheet can see it, which is how a site grows a second
                 stylesheet nobody can read. A `style="--f:0.42"` is not that:
                 it is a DATUM, the one thing HTML has no other channel for,
                 and the rule that consumes it lives in the stylesheet like
                 every other rule. So: a style attribute may carry custom
                 properties and nothing else.
     unresolved  var(--x) references to a name the page cannot see — not in
                 its own <style> blocks, not in a stylesheet it links, not set
                 by any element. An unresolved token silently takes the
                 property's INITIAL value, which is how the corners went square.
     fallbacks   var(--x, literal). The fallback is the second copy that
                 drifts (the corpus.js lesson), and on a page that declares
                 the token it is dead; on one that does not it is the defect
                 above wearing a disguise.
     blocks      <style> elements beyond the first, and any <style> after the
                 body opens. ONE stylesheet per page, in the head — template.js
                 has said so since its first line.
     literals    declarations inside the stylesheet, outside :root, whose value
                 is a literal where a token exists: spacing in px/rem/em on
                 margin/padding/gap/inset, font-size, font-weight, line-height,
                 letter-spacing, a measure in ch, a duration, a cubic-bezier.
                 design/tokens.js names every one of those (SPACE, SCALE,
                 RHYTHM, LAYOUT, MOTION); a literal beside a name is a value
                 that will not move when the token does.

   HOW IT DECIDES. design/style-baseline.json records the five numbers per
   page as last accepted. The gate FAILS if any number grew — the ratchet the
   layout ruler and the render gate already use — so the debt recorded today
   can only shrink, and any commit that adds an inline style or an unresolved
   token is refused the run it lands. `--accept` records; `--accept-worse` is
   the only way to record a larger number, and the commit must say why.
   `--report` prints the census. A page missing from the baseline fails, and
   so does a baseline row with no page.

   WHAT IT DOES NOT MEASURE. SVG presentation attributes (font-size="12",
   stroke-width="1.5") are the mark's own geometry, read by the render gate,
   not styles. Vendored stylesheets (the apps' vendor folders) are somebody else's.
   A hairline (1px) is a mark, not spacing; 0 is not a literal.            */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = path.join(ROOT, 'site');
const BASELINE = path.join(ROOT, 'design', 'style-baseline.json');
const METRICS = ['attrs', 'decls', 'unresolved', 'fallbacks', 'blocks', 'literals'];

const argv = process.argv.slice(2);
const MODE = argv.includes('--accept') ? 'accept' : argv.includes('--report') ? 'report' : 'gate';
const ACCEPT_WORSE = argv.includes('--accept-worse');

let checks = 0, fails = 0, reds = 0, redTotal = 0;
const ok = (name, detail) => { checks++; console.log('  ok  ' + String(checks).padStart(2) + '  ' + name + (detail ? '   ' + detail : '')); };
const bad = (name, detail) => { checks++; fails++; console.log('  FAIL ' + String(checks).padStart(2) + '  ' + name + '\n        ' + detail); };
const red = (name, fired) => {
  redTotal++;
  if (fired) { reds++; console.log('       RED ok    ' + name); }
  else { fails++; console.log('       RED FAIL  ' + name + ' — the check cannot fail, so it is decoration'); }
};

/* ---------------------------------------------------------- the probes ---
   Pure functions of the page text, so the red controls run them on planted
   strings and the real pages go through the same definitions.            */

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const stripData = (s) => s.replace(/data:[a-z/+;=-]*base64,[A-Za-z0-9+/=]+/g, '');

/* every <style> body on the page, in order */
function styleBlocks(html) {
  return [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]);
}

/* the custom properties a page can see: its own declarations anywhere in the
   text (a :root block, a class rule, a style attribute, an SVG <style>) plus
   every LOCAL stylesheet it links, read from disk relative to the page */
function declaredNames(html, pageAbs) {
  const names = new Set();
  const collect = (t) => { for (const m of t.matchAll(/(--[A-Za-z0-9_-]+)\s*:/g)) names.add(m[1]); };
  collect(html);
  if (pageAbs) {
    for (const m of html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/gi)) {
      const href = m[1];
      if (/^(https?:)?\/\//.test(href)) continue;
      const abs = path.resolve(path.dirname(pageAbs), href);
      if (fs.existsSync(abs)) collect(fs.readFileSync(abs, 'utf8'));
    }
  }
  return names;
}

function probe(html, pageAbs) {
  const text = stripData(html);
  const declared = declaredNames(text, pageAbs);

  /* attrs: a style attribute on any element, outside <script> text.
     decls: those carrying anything but custom properties. */
  const noScript = text.replace(/<script[\s\S]*?<\/script>/gi, '');
  const styleAttrs = (noScript.match(/\sstyle="[^"]*"/g) || []).map((a) => a.slice(8, -1))
    .concat((noScript.match(/\sstyle='[^']*'/g) || []).map((a) => a.slice(8, -1)));
  const attrs = styleAttrs.length;
  const decls = styleAttrs.filter((v) => v.split(';').some((d) => d.trim() && !/^--[A-Za-z0-9_-]+\s*:/.test(d.trim()))).length;

  /* unresolved and fallbacks, over the whole page including inline scripts —
     a token a script will write at runtime has to exist too */
  const unresolvedNames = new Set(), fallbackNames = new Set();
  for (const m of text.matchAll(/var\(\s*(--[A-Za-z0-9_-]+)\s*(,[^)]*)?\)/g)) {
    if (!declared.has(m[1])) unresolvedNames.add(m[1]);
    if (m[2]) fallbackNames.add(m[1]);
  }

  /* blocks: beyond the first, and any inside the body — counted over the page
     with its SCRIPTS REMOVED. A <style> inside a <script> is TEXT, not an
     element: the HTML parser in script data only stops at </script. Two pages
     ship a renderer's source on the page for a reader to look at, and that
     source contains the string that builds an SVG's own style block; counting
     it made this gate report two stylesheets that do not exist. The same
     respect check-render pays to a sentence containing the word "null". */
  const all = styleBlocks(noScript);
  const bodyAt = noScript.search(/<body[\s>]/i);
  let inBody = 0;
  if (bodyAt >= 0) for (const m of noScript.matchAll(/<style[^>]*>/gi)) if (m.index > bodyAt) inBody++;
  const blocks = Math.max(0, (all.length - inBody) - 1) + inBody;   /* extra head blocks, plus every body block */

  /* literals: inside the stylesheet, outside :root and @font-face */
  let css = stripComments(all.join('\n'))
    .replace(/:root(?:\[[^\]]*\])?(?::not\([^)]*\))?\s*\{[^}]*\}/g, '')
    .replace(/@font-face\s*\{[^}]*\}/g, '');
  const literals = literalCount(css);

  return { attrs, decls, unresolved: unresolvedNames.size, fallbacks: fallbackNames.size, blocks, literals,
    detail: { unresolved: [...unresolvedNames], fallbacks: [...fallbackNames] } };
}

/* ONE definition of "a literal where a token exists", shared by the site and
   the red controls. Counts DECLARATIONS, not numbers: `margin:24px 0 8px` is
   one. */
const SPACING = /(?:^|[;{\s])(margin|padding|gap|row-gap|column-gap|inset|top|right|bottom|left|margin-(?:top|right|bottom|left|inline|block)|padding-(?:top|right|bottom|left|inline|block))\s*:\s*([^;}]+)/g;
function literalCount(css) {
  let n = 0;
  let m;
  SPACING.lastIndex = 0;
  while ((m = SPACING.exec(css))) {
    const v = m[2];
    /* a px value of 2 or more, or any rem/em value above zero: 1px is a
       hairline and a mark; 0 is not a value */
    if (/(?<![\d.])(?:[2-9]|\d{2,})(?:\.\d+)?px\b/.test(v) || /(?<![\d.])(?:0?\.\d+|[1-9]\d*(?:\.\d+)?)r?em\b/.test(v)) n++;
  }
  const simple = [
    [/(?:^|[;{\s])font-size\s*:\s*([^;}]+)/g, (v) => /\d(?:px|rem|em)\b/.test(v)],
    [/(?:^|[;{\s])font-weight\s*:\s*([^;}]+)/g, (v) => /\b\d{3}\b/.test(v)],
    [/(?:^|[;{\s])line-height\s*:\s*([^;}]+)/g, (v) => /^\s*\d*\.?\d+\s*$/.test(v)],
    [/(?:^|[;{\s])letter-spacing\s*:\s*([^;}]+)/g, (v) => /\d(?:em|px)\b/.test(v)],
    [/(?:^|[;{\s])max-width\s*:\s*([^;}]+)/g, (v) => /\d+ch\b/.test(v)],
    [/(?:^|[;{\s])(?:transition|animation|transition-duration|animation-duration|transition-timing-function|animation-timing-function)\s*:\s*([^;}]+)/g,
      (v) => /(?<![\w-])\d*\.?\d+m?s\b/.test(v) || /cubic-bezier\(/.test(v)],
  ];
  for (const [re, test] of simple) { re.lastIndex = 0; while ((m = re.exec(css))) if (test(m[1])) n++; }
  return n;
}

/* ------------------------------------------------------------ the ratchet -- */
function diff(list, now, base) {
  const worse = [], better = [], missing = [], stale = [];
  for (const rel of list) {
    if (!base[rel]) { missing.push(rel); continue; }
    for (const m of METRICS) {
      const c = now[rel][m], p = base[rel][m];
      if (p === undefined) { missing.push(rel + '.' + m); continue; }
      if (c > p) worse.push(rel + '  ' + m + ' ' + p + ' -> ' + c);
      else if (c < p) better.push(rel + '  ' + m + ' ' + p + ' -> ' + c);
    }
  }
  for (const rel of Object.keys(base)) if (!list.includes(rel)) stale.push(rel);
  return { worse, better, missing, stale };
}

/* every built page, found rather than listed; vendored sheets are not pages */
function pages() {
  const out = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (!/vendor|node_modules/.test(e.name)) walk(p); }
      else if (e.name.endsWith('.html')) out.push(path.relative(ROOT, p));
    }
  })(SITE);
  return out.sort();
}

/* ------------------------------------------------------------ red controls -- */
function redControls() {
  console.log('-- red controls (the probes, on planted pages)');
  const doc = (head, body) => '<!doctype html><html><head>' + head + '</head><body>' + body + '</body></html>';
  red('a style attribute is counted', probe(doc('', '<p style="margin-top:8px">x</p>')).attrs === 1);
  red('a style attribute inside an SVG is counted', probe(doc('', '<svg><rect style="opacity:0"/></svg>')).attrs === 1);
  red('a style attribute inside a script is NOT counted (it is text)',
    probe(doc('', '<script>el.innerHTML=\'<b style="x:1">\'</script>')).attrs === 0);
  red('a style attribute carrying a real declaration is a DECL',
    probe(doc('', '<p style="margin-top:8px">x</p>')).decls === 1);
  red('a style attribute carrying only custom properties is NOT a decl (it is a datum)',
    probe(doc('', '<div style="--f:0.42"></div>')).decls === 0);
  red('a datum beside a declaration is still a decl',
    probe(doc('', '<div style="--f:0.42;width:10%"></div>')).decls === 1);
  red('a var() the page never declares is caught',
    probe(doc('<style>.x{border-radius:var(--radius-m)}</style>', '')).unresolved === 1);
  red('a var() the page declares in :root resolves',
    probe(doc('<style>:root{--radius-m:10px}.x{border-radius:var(--radius-m)}</style>', '')).unresolved === 0);
  red('a var() set on an element resolves',
    probe(doc('<style>.bar{width:calc(var(--f)*100%)}</style>', '<div class="bar" style="--f:.4"></div>')).unresolved === 0);
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'style-red-'));
  fs.writeFileSync(path.join(tmp, 't.css'), ':root{--mono:x}');
  const linked = doc('<link rel="stylesheet" href="t.css"><style>.x{font-family:var(--mono)}</style>', '');
  red('a var() declared in a LINKED local stylesheet resolves', probe(linked, path.join(tmp, 'p.html')).unresolved === 0);
  fs.unlinkSync(path.join(tmp, 't.css')); fs.rmdirSync(tmp);
  red('a literal fallback is caught', probe(doc('<style>:root{--paper:#000}.x{fill:var(--paper,#0a0a0c)}</style>', '')).fallbacks === 1);
  red('a second <style> block is counted', probe(doc('<style>a{}</style><style>b{}</style>', '')).blocks === 1);
  red('a <style> inside the body is counted', probe(doc('<style>a{}</style>', '<svg><style>b{}</style></svg>')).blocks === 1);
  red('a <style> inside a <script> is NOT counted (it is text, not an element)',
    probe(doc('<style>a{}</style>', '<script>const s = "<style>x{}</style>";</script>')).blocks === 0);
  red('one <style> in the head is the clean state', probe(doc('<style>a{}</style>', '')).blocks === 0);
  red('a literal spacing value is caught', literalCount('.x{margin-top:24px}') === 1);
  red('a hairline and a zero are NOT literals', literalCount('.x{margin:0;padding:1px 0}') === 0);
  red('a tokenised spacing value is NOT a literal', literalCount('.x{margin-top:var(--s-5)}') === 0);
  red('a literal font-size, weight, leading, tracking, measure and duration are each one',
    literalCount('.x{font-size:13px;font-weight:530;line-height:1.55;letter-spacing:.16em;max-width:68ch;transition:color .16s}') === 6);
  red('a tokenised type rule is NOT a literal',
    literalCount('.x{font-size:var(--text-small);font-weight:var(--weight-title);transition:color var(--dur-fast) var(--ease-out)}') === 0);
  red('a literal inside :root is NOT counted', probe(doc('<style>:root{--s-4:1rem;--x:24px}</style>', '')).literals === 0);
  const clean = { 'a.html': Object.fromEntries(METRICS.map((m) => [m, 3])) };
  const grew = { 'a.html': Object.fromEntries(METRICS.map((m) => [m, 4])) };
  red('a number that grew is caught', diff(['a.html'], grew, clean).worse.length === METRICS.length);
  red('a built page missing from the baseline is caught', diff(['a.html', 'b.html'], { 'a.html': clean['a.html'], 'b.html': clean['a.html'] }, clean).missing.length === 1);
  red('a baseline row with no page behind it is caught', diff([], {}, clean).stale.length === 1);
  const same = diff(['a.html'], clean, clean);
  if (!same.worse.length && !same.missing.length && !same.stale.length) ok('an unchanged page passes the ratchet');
  else bad('an unchanged page passes the ratchet', JSON.stringify(same));
}

/* ------------------------------------------------------------------ main -- */
function main() {
  const list = pages();
  console.log('style battery — ' + list.length + ' built pages' + (MODE === 'gate' ? '' : '   [' + MODE + ']'));
  redControls();

  const now = {}, detail = {};
  for (const rel of list) {
    const r = probe(fs.readFileSync(path.join(ROOT, rel), 'utf8'), path.join(ROOT, rel));
    now[rel] = Object.fromEntries(METRICS.map((m) => [m, r[m]]));
    detail[rel] = r.detail;
  }
  const tot = (m) => list.reduce((s, r) => s + now[r][m], 0);
  const totals = Object.fromEntries(METRICS.map((m) => [m, tot(m)]));

  if (MODE === 'report') {
    const rows = list.slice().sort((a, b) => (now[b].decls + now[b].unresolved) - (now[a].decls + now[a].unresolved));
    for (const r of rows) {
      const n = now[r];
      console.log('  ' + r.replace(/^site\//, '').padEnd(44) + METRICS.map((m) => m + ' ' + String(n[m]).padStart(3)).join(' · ')
        + (n.unresolved ? '   ' + detail[r].unresolved.join(' ') : ''));
    }
    console.log('\n  TOTALS  ' + METRICS.map((m) => m + ' ' + totals[m]).join(' · '));
    return;
  }

  const base = fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, 'utf8')) : { pages: {} };
  const { worse, better, missing, stale } = diff(list, now, base.pages || {});

  if (MODE === 'accept') {
    if (worse.length && !ACCEPT_WORSE) {
      console.log('\nREFUSED to record ' + worse.length + ' worse number(s). The ratchet only turns one way.\n  '
        + worse.slice(0, 8).join('\n  ') + (worse.length > 8 ? '\n  …' : '')
        + '\n  Fix them, or pass --accept-worse and say why in the commit.');
      process.exit(1);
    }
    const out = {
      note: 'Recorded per built page: style attributes, unresolved var() names, literal fallbacks, extra <style> blocks, and literal '
        + 'values where a token exists — tools/check-style.js refuses any number that grows. Lower these by fixing the page, never by '
        + 'editing this file. The target for every column but the last is ZERO; the last shrinks as the stylesheets move onto the scale.',
      recorded: new Date().toISOString().slice(0, 10),
      metrics: METRICS, totals, pages: now,
    };
    fs.writeFileSync(BASELINE, JSON.stringify(out, null, 2) + '\n');
    console.log('\nrecorded ' + list.length + ' pages to ' + path.relative(ROOT, BASELINE)
      + '   ' + METRICS.map((m) => m + ' ' + totals[m]).join(' · ')
      + (better.length ? '  (' + better.length + ' number(s) improved)' : ''));
    return;
  }

  console.log('-- the ratchet');
  if (missing.length) bad('every built page is in the baseline',
    missing.length + ' unrecorded: ' + missing.slice(0, 6).join(', ') + (missing.length > 6 ? ' …' : '')
    + '\n        run: node tools/check-style.js --accept');
  else ok('every built page is in the baseline', '[' + list.length + ' pages]');
  if (stale.length) bad('every baseline row has a page behind it', stale.length + ' with no page: ' + stale.slice(0, 6).join(', '));
  else ok('every baseline row has a page behind it');
  if (worse.length) bad('no page gained an inline style, an unresolved token, a fallback, a stylesheet or a literal',
    worse.length + ' regression(s):\n        ' + worse.slice(0, 12).join('\n        ') + (worse.length > 12 ? '\n        …' : ''));
  else ok('no page gained an inline style, an unresolved token, a fallback, a stylesheet or a literal',
    '[' + (list.length * METRICS.length) + ' numbers]');
  if (better.length) console.log('       ' + better.length + ' number(s) IMPROVED — `--accept` to lock them in:\n         '
    + better.slice(0, 8).join('\n         ') + (better.length > 8 ? '\n         …' : ''));

  console.log('\n  outstanding debt   ' + METRICS.map((m) => m + ' ' + totals[m]).join(' · '));
  console.log('  ' + checks + ' checks, ' + fails + ' failed · ' + reds + '/' + redTotal + ' red controls fired');
  process.exit(fails === 0 ? 0 : 1);
}

main();
