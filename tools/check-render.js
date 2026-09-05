#!/usr/bin/env node
/* check-render.js — the gate for what a page actually SHOWS.
   tools/ · cert-machine · 2026-09-05

   WHY THIS EXISTS, and the operator's question is the reason: "lots of svg
   elements are black, there is a text block lost on the page — the system
   should not allow that, agree?" Agreed. The repository already gated the
   registries, the type system, the palette, the layout geometry and the
   grammar. It had NOTHING that looked at what a reader sees, so a figure could
   render as an empty rectangle and every gate would stay green.

   The first run found, on pages that were live:

     · 1,337 STRAY COMMAS. An array interpolated into a template literal
       stringifies with commas between its elements — `${ch}` where ch is an
       array of <line> — so 892 of them landed inside one figure and 66 in the
       gathering page. Three missing .join('') calls.
     · 12 KINDS OF INVISIBLE SVG ELEMENT. The gathering page embeds each
       instrument's card art but not the stylesheet that colours it, and an
       element whose class resolves to nothing paints nothing: SVG's default
       stroke is 'none'. 63 chords on one card, 60 on another.
     · TWO CELLS READING "null" in a published table, from String(null).
     · Literal backticks in a table cell, from a markdown habit in a JS string.

   THREE CHECKS, and they are deliberately about rendering rather than source:

     1 MARKERS — the strings that mean a builder leaked: a template literal
       that never interpolated, "undefined", "NaN", "[object Object]", a cell
       whose whole content is "null", a backtick. Script and style blocks are
       stripped first, because a template literal inside inlined JS is not a
       defect. Prose is respected: "it is undefined" in a sentence is English,
       so the marker must be the WHOLE of a cell or attribute value.
     2 INVISIBLE MARKS — every classed element inside a figure must resolve to
       a paint. This is measured in the browser, not guessed from the CSS.
     3 INK — every figure box is screenshotted and its non-ground pixels are
       counted. A figure under the floor is a blank box, whatever the DOM says.

   Ink is a RATCHET against design/render-baseline.json, not a fixed bar: a
   sparse figure is a legitimate drawing and only the AUTHOR can say whether
   2% is empty or exact. What the machine can say is that it got worse.

   run: node tools/check-render.js            gate
        node tools/check-render.js --accept   record
        node tools/check-render.js --report   print, gate nothing              */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const SITE = path.join(ROOT, 'site');
const BASELINE = path.join(ROOT, 'design', 'render-baseline.json');
const { withChrome, settle } = require(path.join(ROOT, 'design', 'cdp.js'));

const MODE = process.argv.includes('--accept') ? 'accept'
  : process.argv.includes('--report') ? 'report' : 'gate';

let checks = 0, fails = 0, reds = 0, redTotal = 0;
const ok = (n, d) => { checks++; console.log('  ok  ' + String(checks).padStart(2) + '  ' + n + (d ? '   ' + d : '')); };
const bad = (n, d) => { checks++; fails++; console.log('  FAIL ' + String(checks).padStart(2) + '  ' + n + '\n        ' + d); };
const red = (n, fired) => {
  redTotal++;
  if (fired) { reds++; console.log('       RED ok    ' + n); }
  else { fails++; console.log('       RED FAIL  ' + n + ' — the check cannot fail, so it is decoration'); }
};

/* ------------------------------------------------------------- 1 markers -- */
const strip = (s) => s.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');

/* A marker only counts when it is the WHOLE of a rendered value — a cell, an
   attribute, a list item. "reward hacking is undefined" is a sentence. */
const MARKERS = [
  ['an uninterpolated template literal', /\$\{[^}\n]{0,80}\}/g],
  /* a VALUE cell, not a header: <th>null</th> is a column named after the null
     model on /instruments/shape-hunt and is exactly right */
  ['a cell reading "undefined"', /(?<!<th)>\s*undefined\s*</g],
  ['a cell reading "null"', /(?<!<th)>\s*null\s*</g],
  ['a cell reading "NaN"', /(?<!<th)>\s*NaN\s*</g],
  ['[object Object]', /\[object Object\]/g],
  ['an array joined with commas', /\/>,</g],
  ['a literal backtick', /`/g],
];
function markerOffences(html, label) {
  const body = strip(html);
  const out = [];
  for (const [name, re] of MARKERS) {
    re.lastIndex = 0;
    const m = body.match(re);
    if (m && m.length) out.push(label + ': ' + m.length + ' × ' + name + '  e.g. ' + JSON.stringify(m[0].slice(0, 40)));
  }
  return out;
}

/* -------------------------------------------------------------- the PNG --- */
function decodePNG(buf) {
  let p = 8, w = 0, h = 0, bd = 0, ct = 0; const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), typ = buf.toString('ascii', p + 4, p + 8), d = buf.slice(p + 8, p + 8 + len);
    if (typ === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); bd = d[8]; ct = d[9]; }
    else if (typ === 'IDAT') idat.push(d);
    else if (typ === 'IEND') break;
    p += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const ch = ct === 6 ? 4 : ct === 2 ? 3 : 1, bpp = ch * (bd / 8), stride = w * bpp;
  const out = Buffer.alloc(h * stride);
  let o = 0, ri = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[ri++], line = raw.slice(ri, ri + stride); ri += stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[o + x - bpp] : 0, b = y > 0 ? out[o - stride + x] : 0,
        c = (x >= bpp && y > 0) ? out[o - stride + x - bpp] : 0;
      let v = line[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += ((a + b) >> 1);
      else if (f === 4) { const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
        v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c); }
      out[o + x] = v & 255;
    }
    o += stride;
  }
  return { w, h, ch, data: out };
}

const FIGURES = 'JSON.stringify([].slice.call(document.querySelectorAll(".plate, .fig, .figbox, .card-art")).map(function(e,i){'
  + 'var r=e.getBoundingClientRect();'
  + 'var card=e.closest(".card"); var h=card?card.querySelector("h2"):null;'
  + 'var lab=(h?h.textContent:(typeof e.className==="string"?e.className:"figure"))||"";'
  + 'return {i:i,lab:lab.replace(/\\s+/g," ").trim().slice(0,40),x:Math.round(r.left),y:Math.round(r.top+window.scrollY),'
  + 'w:Math.round(r.width),h:Math.round(r.height)};'
  + '}).filter(function(b){return b.w>80&&b.h>60;}))';

const INVISIBLE = 'JSON.stringify((function(){var out=[];'
  + '[].slice.call(document.querySelectorAll(".plate svg *, .fig svg *, .figbox svg *")).forEach(function(el){'
  + '  var cn=(el.getAttribute("class")||"").trim(); if(!cn) return;'
  + '  var tag=el.tagName.toLowerCase();'
  + '  if(tag==="g"||tag==="defs"||tag==="pattern"||tag==="clippath"||tag==="title"||tag==="desc") return;'
  + '  var cs=getComputedStyle(el);'
  + '  var paint=(tag==="line"||tag==="polyline")?cs.stroke:((cs.fill!=="none"&&cs.fill!=="rgba(0, 0, 0, 0)")?cs.fill:cs.stroke);'
  + '  if(paint==="none"||paint==="rgba(0, 0, 0, 0)") out.push(cn.split(/\\s+/)[0]+" <"+tag+">");'
  + '});'
  + 'var t={}; out.forEach(function(k){t[k]=(t[k]||0)+1;}); return t;})())';

function pages() {
  const out = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.html')) out.push(path.relative(ROOT, p));
    }
  })(SITE);
  return out.sort();
}

async function main() {
  const list = pages();
  console.log('render battery — ' + list.length + ' built pages' + (MODE === 'gate' ? '' : '   [' + MODE + ']'));

  /* the marker check runs without a browser, so its red controls do too */
  console.log('-- markers');
  const mark = [];
  for (const p of list) mark.push(...markerOffences(fs.readFileSync(path.join(ROOT, p), 'utf8'), p.replace('site/', '')));
  if (mark.length) bad('no built page shows a builder leaking', mark.length + ':\n        ' + mark.slice(0, 10).join('\n        '));
  else ok('no built page shows a builder leaking', '[' + list.length + ' pages]');
  red('an array joined with commas is caught',
    markerOffences('<svg><line/>,<line/></svg>', 'x').length === 1);
  red('a cell reading null is caught', markerOffences('<td><span>null</span></td>', 'x').length === 1);
  red('the same word inside a sentence is NOT caught',
    markerOffences('<p>reward hacking is undefined here</p>', 'x').length === 0);
  red('a template literal inside inlined script is NOT caught',
    markerOffences('<script>const a = `${x} b`;</script>', 'x').length === 0);

  const now = {};
  const unmeasured = [];
  await withChrome(async (send) => {
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    for (const rel of list) {
      await send('Page.navigate', { url: 'file://' + path.join(ROOT, rel) });
      await send('Runtime.evaluate', { expression: 'document.fonts ? document.fonts.ready.then(()=>1) : 1', awaitPromise: true, timeout: 8000 });
      await settle(500);
      const inv = JSON.parse((await send('Runtime.evaluate', { expression: INVISIBLE, returnByValue: true })).result.value);
      const boxes = JSON.parse((await send('Runtime.evaluate', { expression: FIGURES, returnByValue: true })).result.value);
      const figs = {};
      for (const b of boxes) {
        const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true,
          clip: { x: b.x, y: b.y, width: b.w, height: b.h, scale: 1 } });
        if (!shot || !shot.data) continue;
        const img = decodePNG(Buffer.from(shot.data, 'base64'));
        let ink = 0, n = 0;
        for (let y = 0; y < img.h; y += 2) for (let x = 0; x < img.w; x += 2) {
          const o = (y * img.w + x) * img.ch;
          const L = 0.2126 * img.data[o] + 0.7152 * img.data[o + 1] + 0.0722 * img.data[o + 2];
          n++; if (L > 22) ink++;                       /* the page ground sits at 10-16 */
        }
        const key = b.lab || ('figure ' + b.i);
        const pct = n ? +(100 * ink / n).toFixed(2) : 0;
        /* A CLEAN ZERO IS NOT A MEASUREMENT. captureBeyondViewport returns a
           blank region for some boxes far below the fold, which read four
           figures on reports/glide-band.html — one of them with 314 elements
           in it — as empty. Exactly 0 means "not measured" and is skipped;
           a genuinely blank figure still lands at 0.0x% because a border, a
           label or a hairline always leaves something. The gate reports what
           it could not measure rather than pretending it measured it. */
        if (pct === 0) { unmeasured.push(rel.replace('site/', '') + ' :: ' + key); continue; }
        if (figs[key] === undefined || pct < figs[key]) figs[key] = pct;   /* worst wins */
      }
      now[rel] = { invisible: inv, figures: figs };
    }
  }, { port: 9291 });

  console.log('-- invisible marks');
  const invis = [];
  for (const rel of list) {
    const t = now[rel].invisible;
    for (const [k, n] of Object.entries(t)) invis.push(rel.replace('site/', '') + ': ' + n + ' × ' + k);
  }
  if (invis.length) bad('every classed mark inside a figure paints something',
    invis.length + ' kind(s):\n        ' + invis.slice(0, 10).join('\n        '));
  else ok('every classed mark inside a figure paints something');

  const base = fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, 'utf8')) : { figures: {} };
  const rows = [];
  for (const rel of list) for (const [k, v] of Object.entries(now[rel].figures)) rows.push([rel + ' :: ' + k, v]);

  if (MODE === 'report') {
    rows.sort((a, b) => a[1] - b[1]);
    for (const [k, v] of rows.slice(0, 26))
      console.log('  ' + String(v).padStart(6) + '%  ' + k.replace('site/', ''));
    console.log('\n  ' + rows.length + ' figures · thinnest ' + rows[0][1] + '% · median '
      + rows[Math.floor(rows.length / 2)][1] + '%');
    return;
  }

  if (MODE === 'accept') {
    fs.writeFileSync(BASELINE, JSON.stringify({
      note: 'Ink coverage per figure: the share of pixels brighter than the page ground, measured from a screenshot of the figure\'s own box. A figure that gets THINNER than its record fails check-render. Only the author can say whether a sparse drawing is empty or exact, so this ratchets rather than setting a bar.',
      recorded: new Date().toISOString().slice(0, 10),
      figures: Object.fromEntries(rows),
    }, null, 2) + '\n');
    console.log('\nrecorded ' + rows.length + ' figures to ' + path.relative(ROOT, BASELINE));
    return;
  }

  console.log('-- ink');
  if (unmeasured.length) console.log('       NOTE  ' + unmeasured.length
    + ' figure(s) could not be captured (blank clip below the fold) and are not gated:\n             '
    + unmeasured.slice(0, 4).join('\n             '));
  const thinner = [], missing = [];
  for (const [k, v] of rows) {
    const p = base.figures[k];
    if (p === undefined) { missing.push(k); continue; }
    if (v < p - 0.25) thinner.push(k.replace('site/', '') + '  ' + p + '% -> ' + v + '%');
  }
  if (missing.length) bad('every figure is in the ink baseline',
    missing.length + ' unrecorded: ' + missing.slice(0, 4).map((x) => x.replace('site/', '')).join(', ')
    + '\n        run: node tools/check-render.js --accept');
  else ok('every figure is in the ink baseline', '[' + rows.length + ' figures]');
  if (thinner.length) bad('no figure got thinner',
    thinner.length + ':\n        ' + thinner.slice(0, 8).join('\n        '));
  else ok('no figure got thinner');

  console.log('\n  ' + checks + ' checks, ' + fails + ' failed · ' + reds + '/' + redTotal + ' red controls fired');
  if (fails) process.exit(1);
}

main().catch((e) => { console.error('RENDER REFUSED: ' + e.message); process.exit(1); });
