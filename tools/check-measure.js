#!/usr/bin/env node
/* check-measure.js — THE RULER. The layout of every built page, measured.
   tools/ · cert-machine

   WHY THIS EXISTS. On 2026-09-04 the operator sent screenshots of tables
   sliced mid-character and paragraphs that did not share a left edge with the
   figure under them. Every previous answer to that had been an opinion. This
   file replaces the opinion with a measurement: it drives headless Chrome over
   all 66 built pages at two viewports and records four geometric facts per
   page. Nothing here is a matter of taste, and nothing here refuses a design
   direction — it refuses DRIFT, which is the only thing a gate is for
   (CLAUDE.md: "when a check refuses a direction rather than measuring a fact,
   remove it").

   THE FOUR FACTS, per page per viewport:

     spines        how many distinct left edges the page's content sits on.
                   Measured on the CONTENT box (border-box left + padding-left),
                   because a padded wrapper's own edge is invisible and counting
                   it would be noise. Full-bleed elements are excluded — an
                   element as wide as the viewport is not ON the spine, it IS
                   the ground. THIS IS THE DRIFT NUMBER: one page had 25.
     pageOverflow  how many pixels the document scrolls sideways. Anything but
                   zero is a page the reader has to drag. Two /instruments pages
                   do this on a phone today.
     escapes       blocks whose box leaves the viewport and that are NOT inside
                   a horizontal scroller — content nobody can reach at all. The
                   scroller exemption is deliberate: a table that scrolls inside
                   its own box is a decision, a table that runs off the page is
                   a defect, and the two must not be counted together.
     clipped       elements whose content is wider than their box. Each one is a
                   place where columns are hidden from the reader. A legitimate
                   scroll table is one of these; so was the sliced table in the
                   screenshots. The count going DOWN is the goal either way.

   HOW IT DECIDES. design/measure-baseline.json holds what every page measured
   when it was last accepted. The gate FAILS if any number got WORSE. That is
   the ratchet: the restyle lowers the numbers phase by phase, and any commit
   that raises one is refused the same run it lands.

     node tools/check-measure.js            measure and gate
     node tools/check-measure.js --accept   record the current numbers
     node tools/check-measure.js --report    print the table, gate nothing

   `--accept` REFUSES TO RECORD A WORSE NUMBER unless --accept-worse is passed
   in as well, so the ratchet cannot be quietly unwound by the tool that
   maintains it. A built page missing from the baseline is a FAIL, and so is a
   baseline row with no page behind it — the registry is complete by
   construction rather than by memory, which is the whole lesson of
   check-wiring.js.

   RED CONTROLS. Five fixtures are written to a temp dir and measured by the
   SAME probe: three pages that each break the layout a different real way and
   must be caught, one page that scrolls a table inside its own box and must be
   caught as clipped WITHOUT being called an escape, and one clean page that
   must come back at one spine and zero of everything else. A check that cannot
   fail is decoration; a check that cannot pass is worse.

   ONE HONEST LIMIT. The two viewports are measured in one navigation, by
   overriding device metrics and re-measuring. Chrome fires resize, so CSS
   relayouts correctly; a page whose JavaScript reads the viewport once at load
   and never listens would be measured at its load-time layout. No page here
   does that today, and if one ever does, this comment is where to look.       */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = path.join(ROOT, 'site');
const BASELINE = path.join(ROOT, 'design', 'measure-baseline.json');
const { withChrome, settle } = require(path.join(ROOT, 'design', 'cdp.js'));

/* 768 ADDED 2026-09-05, and it earned its place the same day. The ruler drove
   1440 and 390 and nothing between, so the whole tablet range was unmeasured —
   and a breakpoint sitting in the middle of that gap (min-width:681px) put six
   stat tiles in three columns at 768, about 235px of cell for a headline
   number, which broke "604 <= K(11) <= 868" across two lines in the middle of
   the relation. Two widths do not bracket a layout; they bracket its ends. */
const VIEWPORTS = [1440, 768, 390];
const METRICS = ['spines', 'pageOverflow', 'escapes', 'clipped'];

const MODE = process.argv.includes('--accept') ? 'accept'
  : process.argv.includes('--report') ? 'report' : 'gate';
const ACCEPT_WORSE = process.argv.includes('--accept-worse');

let checks = 0, fails = 0, reds = 0, redTotal = 0;
const ok = (name, detail) => { checks++; console.log('  ok  ' + String(checks).padStart(2) + '  ' + name + (detail ? '   ' + detail : '')); };
const bad = (name, detail) => { checks++; fails++; console.log('  FAIL ' + String(checks).padStart(2) + '  ' + name + '\n        ' + detail); };
const red = (name, fired) => {
  redTotal++;
  if (fired) { reds++; console.log('       RED ok    ' + name); }
  else { fails++; console.log('       RED FAIL  ' + name + ' — the check cannot fail, so it is decoration'); }
};

/* ------------------------------------------------------------- the probe --
   Runs in the page. Returns the four facts. Kept as one expression string so
   there is exactly one definition of what "a spine" means, shared by the real
   pages and by the red controls — a probe written twice would let a fixture
   pass under rules the site never faces.                                    */
const PROBE = `(() => {
  const vw = window.innerWidth;
  const lefts = new Set();
  let escapes = 0, clipped = 0;
  const scrolls = (el) => {
    for (let n = el.parentElement; n; n = n.parentElement) {
      const ox = getComputedStyle(n).overflowX;
      if (ox === 'auto' || ox === 'scroll' || ox === 'hidden') return true;
    }
    return false;
  };
  for (const el of document.querySelectorAll('*')) {
    const tag = el.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'HEAD' || tag === 'META'
        || tag === 'LINK' || tag === 'TITLE' || tag === 'BR' || tag === 'HTML') continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.display === 'inline' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.height < 4) continue;
    if (r.width < 280) continue;
    /* 8px, not 1px: a hairline of sub-pixel overflow on an inline-block is
       text-metric noise that flips between runs and would make the ratchet
       flap. 8px is a hidden character, which is the thing worth counting.

       AND NOT INSIDE SVG. scrollWidth on an SVG element does not mean what it
       means on an HTML one — an <svg><text> 300px wide reports a scrollWidth
       of 700 with nothing clipped and nothing scrollable. Phase 2 widened the
       figure track from 900px to the container, which pushed a handful of axis
       labels past the 280px floor and turned three pages "worse" for a reason
       that was entirely this probe's. Corrected 2026-09-04. */
    if (el.ownerSVGElement || el.tagName.toLowerCase() === 'svg') continue;
    if (el.scrollWidth - el.clientWidth >= 8) clipped++;
    if ((r.left < -1 || r.right > vw + 1) && !scrolls(el)) escapes++;
    if (r.width >= vw - 1) continue;                 /* full-bleed is the ground, not the spine */
    lefts.add(Math.round(r.left + parseFloat(cs.paddingLeft || 0)));
  }
  return JSON.stringify({
    spines: lefts.size,
    pageOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
    escapes, clipped,
    edges: [...lefts].sort((a, b) => a - b)
  });
})()`;

/* every built page, found rather than listed */
function pages() {
  const out = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.html')) out.push(path.relative(ROOT, p));
    }
  })(SITE);
  return out.sort();
}

async function measure(send, url) {
  await send('Page.navigate', { url });
  await send('Runtime.evaluate', {                       /* real wait: the page's own fonts */
    expression: 'document.fonts ? document.fonts.ready.then(()=>1) : 1', awaitPromise: true, timeout: 8000,
  });
  await settle(180);
  const per = {};
  for (const vw of VIEWPORTS) {
    await send('Emulation.setDeviceMetricsOverride',
      { width: vw, height: 900, deviceScaleFactor: 1, mobile: vw < 700 });
    await settle(220);                                   /* relayout after the resize event */
    const r = await send('Runtime.evaluate', { expression: PROBE, returnByValue: true });
    per[vw] = JSON.parse(r.result.value);
  }
  return per;
}

/* ------------------------------------------------------- the red controls --
   Five fixtures, written to a temp dir, measured by the same probe.        */
const FIXTURES = {
  'red-spread.html':
    '<style>body{margin:0}div{margin:0 auto;height:200px;background:#222}'
    + '.a{max-width:1200px}.b{max-width:900px}.c{max-width:600px}</style>'
    + '<div class="a">a</div><div class="b">b</div><div class="c">c</div>',
  'red-overflow.html':
    '<style>body{margin:0}div{width:900px;height:200px;background:#222}</style><div>wide</div>',
  'red-escape.html':
    '<style>body{margin:0;overflow-x:clip}main{max-width:1200px;margin:0 auto}'
    + '.out{position:relative;left:50%;transform:translateX(-50%);width:1900px;height:200px;background:#222}</style>'
    + '<main><div class="out">breakout</div></main>',
  'red-clip.html':
    '<style>body{margin:0}main{max-width:1200px;margin:0 auto}'
    + '.box{overflow-x:auto}.box div{width:1900px;height:200px;background:#222}</style>'
    + '<main><div class="box"><div>scrolls</div></div></main>',
  'green.html':
    '<style>body{margin:0}main{max-width:1200px;margin:0 auto;padding:0 20px}'
    + 'p,h1,table{margin:0;width:100%}table{display:block;height:200px;background:#222}</style>'
    + '<main><h1>one</h1><p>spine</p><table>t</table></main>',
};

/* ------------------------------------------------------------ the ratchet --
   Pulled out as a pure function so the comparison itself can be red-controlled
   without touching site/. The three ways a ratchet fails silently are: a number
   grows and nobody looks, a new page is never recorded, and a recorded page
   quietly disappears. All three are decided here.                           */
function diff(list, now, base) {
  const worse = [], better = [], missing = [], stale = [];
  for (const rel of list) {
    if (!base[rel]) { missing.push(rel); continue; }
    for (const vw of VIEWPORTS) {
      const b = base[rel][vw] || {};
      for (const m of METRICS) {
        const c = now[rel][vw][m], p = b[m];
        if (p === undefined) { missing.push(rel + ' @' + vw + '.' + m); continue; }
        if (c > p) worse.push(rel + ' @' + vw + '  ' + m + ' ' + p + ' -> ' + c);
        else if (c < p) better.push(rel + ' @' + vw + '  ' + m + ' ' + p + ' -> ' + c);
      }
    }
  }
  for (const rel of Object.keys(base)) if (!list.includes(rel)) stale.push(rel);
  return { worse, better, missing, stale };
}

/* the ratchet's own red controls: synthetic pages, no browser, no site/ */
function redRatchet() {
  const cell = (v) => Object.fromEntries(METRICS.map((m) => [m, v]));
  const page = (v) => Object.fromEntries(VIEWPORTS.map((w) => [w, cell(v)]));
  const clean = { 'a.html': page(3) };
  console.log('-- red controls (the ratchet, on synthetic pages)');
  red('a number that grew is caught',
    diff(['a.html'], { 'a.html': page(4) }, clean).worse.length === METRICS.length * VIEWPORTS.length);
  red('a built page missing from the baseline is caught',
    diff(['a.html', 'b.html'], { 'a.html': page(3), 'b.html': page(3) }, clean).missing.length === 1);
  red('a baseline row with no page behind it is caught',
    diff([], {}, clean).stale.length === 1);
  const same = diff(['a.html'], { 'a.html': page(3) }, clean);
  if (!same.worse.length && !same.missing.length && !same.stale.length) ok('an unchanged page passes the ratchet');
  else bad('an unchanged page passes the ratchet', JSON.stringify(same));
}

async function runReds(send, dir) {
  const got = {};
  for (const [name, html] of Object.entries(FIXTURES)) {
    /* the viewport meta is not decoration here: without it Chrome lays a
       "mobile" page out at its 980px fallback and scales, so a fixture that
       overflows a phone would come back clean and the control would not fire.
       Every real page carries it, so every fixture must. */
    fs.writeFileSync(path.join(dir, name),
      '<!doctype html><meta charset="utf-8">'
      + '<meta name="viewport" content="width=device-width, initial-scale=1">' + html);
    got[name] = await measure(send, 'file://' + path.join(dir, name));
  }
  console.log('-- red controls (the probe, run against planted layouts)');
  red('three centred widths read as three spines', got['red-spread.html'][1440].spines >= 3);
  red('a block wider than a phone scrolls the page', got['red-overflow.html'][390].pageOverflow > 0);
  red('a viewport breakout is an escape', got['red-escape.html'][1440].escapes >= 1);
  red('a table scrolling inside its own box is clipped, not an escape',
    got['red-clip.html'][1440].clipped >= 1 && got['red-clip.html'][1440].escapes === 0);

  const g = got['green.html'][1440];
  if (g.spines === 1 && g.pageOverflow === 0 && g.escapes === 0 && g.clipped === 0) {
    ok('the clean fixture measures 1 spine and zero of everything else');
  } else {
    bad('the clean fixture measures 1 spine and zero of everything else',
      'got ' + JSON.stringify(g) + ' — the probe cannot pass, which makes every FAIL below meaningless');
  }
}

/* ------------------------------------------------------------------ main -- */
async function main() {
  const list = pages();
  console.log('measure battery — ' + list.length + ' built pages at ' + VIEWPORTS.join(' / ') + 'px'
    + (MODE === 'gate' ? '' : '   [' + MODE + ']'));

  redRatchet();
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'measure-red-'));
  const now = {};
  await withChrome(async (send) => {
    await send('Page.enable');
    await runReds(send, tmp);
    console.log('-- the site');
    for (const rel of list) now[rel] = await measure(send, 'file://' + path.join(ROOT, rel));
  }, { port: 9233 });
  for (const f of fs.readdirSync(tmp)) fs.unlinkSync(path.join(tmp, f));
  fs.rmdirSync(tmp);

  const base = fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, 'utf8')) : { pages: {} };
  const { worse, better, missing, stale } = diff(list, now, base.pages);

  if (MODE === 'report') {
    const rows = list.map((r) => [r, now[r][1440], now[r][390]])
      .sort((a, b) => b[1].spines - a[1].spines);
    for (const [r, a, m] of rows) {
      console.log('  ' + r.replace(/^site\//, '').padEnd(42)
        + ' spines ' + String(a.spines).padStart(3)
        + ' · escapes ' + String(a.escapes).padStart(2)
        + ' · clipped ' + String(a.clipped).padStart(2)
        + '   |  390: overflow ' + String(m.pageOverflow).padStart(4)
        + ' · spines ' + String(m.spines).padStart(2)
        + ' · clipped ' + String(m.clipped).padStart(2));
    }
    const tot = (m, vw) => list.reduce((s, r) => s + now[r][vw][m], 0);
    console.log('\n  TOTALS  @1440 spines ' + tot('spines', 1440) + ' · escapes ' + tot('escapes', 1440)
      + ' · clipped ' + tot('clipped', 1440)
      + '   @390 overflow ' + tot('pageOverflow', 390) + 'px · clipped ' + tot('clipped', 390));
    return;
  }

  if (MODE === 'accept') {
    /* A PAGE THAT MEASURED AS NOTHING IS NOT A MEASUREMENT, 2026-09-05 — the
       same lesson check-render already carries about a clean zero, learned here
       the expensive way. A built page always sits on at least a container edge
       and a text edge, so `spines: 1` at BOTH viewports means the page did not
       render before it was read: on 2026-09-05 the 1 MB plates page timed out
       under Chrome contention and was recorded as 1/1/0/0/0. That row is worse
       than useless — it is a FALSE GREEN, because a page recorded at one spine
       passes every future run whatever it does. Refuse to write it, and say
       which page, rather than quietly baking a blind spot into the ratchet. */
    const blind = list.filter((r) => VIEWPORTS.every((v) => now[r][v].spines <= 1));
    if (blind.length) {
      console.log('\nREFUSED to record ' + blind.length + ' page(s) that measured as NOTHING'
        + ' (one spine at every viewport — the page did not render):\n  '
        + blind.slice(0, 8).join('\n  ')
        + '\n  Re-run when the machine is quiet. A row like this passes forever and gates nothing.');
      process.exit(1);
    }
    if (worse.length && !ACCEPT_WORSE) {
      console.log('\nREFUSED to record ' + worse.length + ' worse number(s). The ratchet only turns one way.\n  '
        + worse.slice(0, 8).join('\n  ') + (worse.length > 8 ? '\n  …' : '')
        + '\n  Fix them, or pass --accept-worse and say why in the commit.');
      process.exit(1);
    }
    const out = {
      note: 'Recorded layout geometry per built page. tools/check-measure.js refuses any number that grows. '
        + 'Lower these by fixing the page, never by editing this file.',
      recorded: new Date().toISOString().slice(0, 10),
      viewports: VIEWPORTS, metrics: METRICS,
      pages: Object.fromEntries(list.map((r) => [r, Object.fromEntries(VIEWPORTS.map((v) =>
        [v, Object.fromEntries(METRICS.map((m) => [m, now[r][v][m]]))]))])),
    };
    fs.writeFileSync(BASELINE, JSON.stringify(out, null, 2) + '\n');
    console.log('\nrecorded ' + list.length + ' pages to ' + path.relative(ROOT, BASELINE)
      + (better.length ? '  (' + better.length + ' number(s) improved)' : ''));
    return;
  }

  console.log('-- the ratchet');
  if (missing.length) bad('every built page is in the baseline',
    missing.length + ' unrecorded: ' + missing.slice(0, 6).join(', ') + (missing.length > 6 ? ' …' : '')
    + '\n        run: node tools/check-measure.js --accept');
  else ok('every built page is in the baseline', '[' + list.length + ' pages]');

  if (stale.length) bad('every baseline row has a page behind it',
    stale.length + ' with no page: ' + stale.slice(0, 6).join(', '));
  else ok('every baseline row has a page behind it');

  if (worse.length) bad('no page got wider, looser or more clipped',
    worse.length + ' regression(s):\n        ' + worse.slice(0, 12).join('\n        ')
    + (worse.length > 12 ? '\n        …' : ''));
  else ok('no page got wider, looser or more clipped', '[' + (list.length * VIEWPORTS.length * METRICS.length) + ' numbers]');

  if (better.length) console.log('       ' + better.length + ' number(s) IMPROVED — `--accept` to lock them in:\n         '
    + better.slice(0, 8).join('\n         ') + (better.length > 8 ? '\n         …' : ''));

  const debt = (m, vw) => list.reduce((s, r) => s + now[r][vw][m], 0);
  console.log('\n  outstanding debt   @1440 spines ' + debt('spines', 1440)
    + ' · escapes ' + debt('escapes', 1440) + ' · clipped ' + debt('clipped', 1440)
    + '   @390 page-overflow ' + debt('pageOverflow', 390) + 'px');
  console.log('  ' + checks + ' checks, ' + fails + ' failed · ' + reds + '/' + redTotal + ' red controls fired');
  if (fails) process.exit(1);
}

main().catch((e) => { console.error('MEASURE REFUSED: ' + e.message); process.exit(1); });
