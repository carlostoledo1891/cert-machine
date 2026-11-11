#!/usr/bin/env node
/* check-home.js — the home page's controls move nothing: its layout shift, measured in Chrome.
   tools/ · cert-machine · 2026-11-11

   THE RULE (the operator, 2026-11-11): "No layout shift, anywhere, when a control changes a chart." design/home.js
   reserves the size of every element whose content changes; this file is the measurement that holds it to that. It
   drives site/index.html in headless Chrome (design/cdp.js, real waits) at 1440 and at 390 wide (device-metrics
   emulation: a headless window is never narrower than 500 px) and reads the browser's own Layout Instability entries
   (PerformanceObserver "layout-shift"), every one of them, whether or not the browser would excuse it as following an
   input:

     load        from navigation until the fonts are in and the page has settled; REPORTED, and refused above LOAD_MAX
     autoplay    the zoom playing by itself from ×1 to its end                                       must be exactly 0
     zoom        the slider driven through its own input path, 0 to its maximum and back, in 124 steps          0
     replay      the Replay button, pressed, and its run                                                         0
     hover       the pointer moved over 24 register cells                                                        0
     keys        the arrow keys moved through 24 cells from the focused one                                      0
     theme       the theme pill switched to light and back (the canvas repaints)                                 0

   It also checks that the controls did what they claim while it measured (the zoom reached its end and the sentence
   changed; the readout changed under the pointer and under the keys), so a control that silently did nothing cannot
   pass as "no shift".

   THE STILL (2026-11-11). The hero's finding used to be on the page only once the autoplay had run, and never for a
   reader who asked for no motion. The still under the figure carries it from the first paint, and this file holds it
   there:

     bytes       the built page's markup holds one still inside the hero figure: an SVG with a text alternative that
                 states the finding, its edges, the witness × and a label in words; and no script on the page names it
                 (so it is there with scripts off, and nothing can move it)
     first       its box when the document has just been parsed, before the fonts, the autoplay or any control: the
                 size the stylesheet reserves, inside the figure
     after       its box after the fonts and after every control above: the same size, at the same place in the figure
     label       the zoom its label names is the word the zoom control itself shows at the slider's end
     reduced     the page loaded again with prefers-reduced-motion: nothing plays, the still is there, 0 shift

   RED CONTROLS: a planted page whose button grows a paragraph above a block must measure a shift above zero by the same
   probe, and the still's probe must find no still on it; the page's own bytes with the still's alternative stripped,
   and with a script that names it, must be refused; and the still's readings with one of them a pixel lower must be
   refused. Or the run fails.

     node tools/check-home.js            gate; exit 1 on any interaction shift, a load shift above LOAD_MAX, a dead control,
                                         or a still that is missing, late, moved or mislabelled
     node tools/check-home.js --json     the same, and the measurements as one JSON line                          MIT */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { withChrome, settle } = require(path.join(ROOT, 'design', 'cdp.js'));
const PAGE = path.join(ROOT, 'site', 'index.html');
const LOAD_MAX = 0.01;   /* a tenth of the "good" bound browsers use for a whole page (0.1); the measured value is printed */
const VIEWS = [{ w: 1440, h: 900, mobile: false }, { w: 390, h: 844, mobile: true }];

/* THE STILL'S BOX, as the page measures it: its size, its place inside the hero figure, the height of its row, whether it
   is shown, whether its edges and its × have an extent, and its words. One expression, asked at the first moment, after
   the fonts and after every control, on the page and on the red control (where it must find nothing). */
const STILL_BOX = 'function(){var s=document.querySelector(".hm-still"),f=document.querySelector("figure[data-hero]");if(!s||!f||!f.contains(s))return null;'
  + 'var v=s.querySelector("svg");if(!v)return null;var r=v.getBoundingClientRect(),b=s.getBoundingClientRect(),o=f.getBoundingClientRect(),c=getComputedStyle(v),'
  + 'n=function(q){var e=v.querySelector(q);return e&&e.getBBox?e.getBBox().width:0};'
  + 'return{w:r.width,h:r.height,dx:r.left-o.left,dy:r.top-o.top,row:b.height,shown:c.display!=="none"&&c.visibility==="visible"&&+c.opacity===1&&getComputedStyle(s).display!=="none",'
  + 'edges:n(".hm-still-l"),cross:n(".w-wx"),alt:v.getAttribute("aria-label")||"",label:(s.querySelector(".lab")||{}).textContent||""}}';
const stillNow = async (ev) => JSON.parse(await ev('JSON.stringify((' + STILL_BOX + ')())'));

/* the still in the page's bytes: one, inside the hero figure, with its alternative, its marks and its label, and named
   by no script (it is markup: there with scripts off, and nothing on the page can move or redraw it) */
function stillBytes(html) {
  const out = [];
  const fig = (/<figure\b[^>]*\bdata-hero[\s>][\s\S]*?<\/figure>/.exec(html) || [''])[0];
  const stills = fig.match(/<div class="hm-still">[\s\S]*?<\/svg>[\s\S]*?<\/div>/g) || [];
  if (stills.length !== 1 || (html.match(/class="hm-still"/g) || []).length !== 1) return ['the hero figure holds ' + stills.length + ' stills, and it holds one'];
  const st = stills[0], svg = (/<svg\b[^>]*>/.exec(st) || [''])[0], alt = (/\baria-label="([^"]*)"/.exec(svg) || ['', ''])[1];
  if (!/\brole="img"/.test(svg) || alt.length < 40 || !/overlap/.test(alt)) out.push('the still has no text alternative that states the finding');
  if (!/class="hm-still-l"/.test(st) || !/class="hm-still-o"/.test(st)) out.push('the still draws no edges or no overlap');
  if ((st.match(/class="w-wx"/g) || []).length !== 1) out.push('the still does not carry one witness ×');
  if (!/<span class="lab">At ×[\d.]+( thousand| million)?<\/span><span>[^<]+<\/span>/.test(st)) out.push('the still has no label in words');
  const scripts = (html.match(/<script(?![^>]*application\/(?:ld\+)?json)[^>]*>[\s\S]*?<\/script>/g) || []).join('\n');
  if (/hm-still/.test(scripts)) out.push('a script on the page names the still, so it is no longer markup alone');
  return out;
}

/* installed before any page script: every layout-shift entry, kept with its time */
const OBSERVE = 'window.__ls=[];try{new PerformanceObserver(function(l){l.getEntries().forEach(function(e){window.__ls.push({t:e.startTime,v:e.value,i:e.hadRecentInput})})}).observe({type:"layout-shift",buffered:true})}catch(e){window.__lsErr=String(e)}'
  /* and the still's box at the first moment there is a document to ask: parsed, nothing loaded, nothing played */
  + ';document.addEventListener("DOMContentLoaded",function(){window.__still0=(' + STILL_BOX + ')()})';

async function drive(send, url, view, plan) {
  await send('Emulation.setDeviceMetricsOverride', { width: view.w, height: view.h, deviceScaleFactor: 1, mobile: view.mobile });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: view.reduce ? 'reduce' : 'no-preference' }] });
  await send('Page.navigate', { url: 'about:blank' });
  await settle(120);
  await send('Page.navigate', { url });
  const ev = async (expression, awaitPromise) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: !!awaitPromise }, 60000);
    if (r.exceptionDetails) throw new Error('the page threw: ' + (r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text));
    return r.result.value;
  };
  const sum = async (from) => { const a = JSON.parse(await ev('JSON.stringify(window.__ls||[])')); const x = a.filter((e) => e.t >= from); return { n: x.length, v: x.reduce((s, e) => s + e.v, 0) }; };
  const now = () => ev('performance.now()');
  return plan({ ev, sum, now, send });
}

async function home(send, view) {
  return drive(send, 'file://' + PAGE, view, async ({ ev, sum, now }) => {
    const out = {}, alive = {}, still = {};
    /* load: the fonts, then a beat; the autoplay starts 900 ms after the script ran, so the load window ends before it */
    await ev('document.fonts.ready.then(function(){return 1})', true);
    await settle(500);
    if (await ev('window.__lsErr||""')) throw new Error('this Chrome has no layout-shift entries: ' + await ev('window.__lsErr'));
    let t = await now();
    out.load = await sum(0);
    /* the still: as the parsed document had it, and now that the fonts are in; nothing has played yet */
    still.first = JSON.parse(await ev('JSON.stringify(window.__still0||null)'));
    still.loaded = await stillNow(ev);
    still.before = Number(await ev('document.getElementById("hm-zoom").value'));
    /* autoplay: wait for the zoom to reach its end */
    const say0 = await ev('document.querySelector("#hm-say .on").textContent');
    for (let k = 0; k < 40 && Number(await ev('document.getElementById("hm-zoom").value')) < 6; k++) await settle(300);
    await settle(400);
    alive.autoplay = Number(await ev('document.getElementById("hm-zoom").value')) >= 6 && (await ev('document.querySelector("#hm-say .on").textContent')) !== say0
      && !(await ev('document.getElementById("hm-twist").classList.contains("off")')) && (await ev('document.getElementById("hm-wx").getAttribute("class")')).includes(' on');
    out.autoplay = await sum(t); t = await now();
    /* the slider, through its own input event, down to 0 and back up, one step per frame */
    const seen = await ev('new Promise(function(done){var z=document.getElementById("hm-zoom"),max=parseFloat(z.max),i=0,N=62,seen={};'
      + 'function step(){var u=i<=N?1-i/N:(i-N)/N;z.value=(max*u).toFixed(2);z.dispatchEvent(new Event("input",{bubbles:true}));'
      + 'seen[document.querySelector("#hm-say .on").textContent]=1;seen[document.getElementById("hm-zl").textContent]=1;'
      + 'if(++i<=2*N)requestAnimationFrame(step);else requestAnimationFrame(function(){done(Object.keys(seen).length)})}step()})', true);
    alive.zoom = seen >= 40;   /* five sentences and dozens of zoom words went by */
    await settle(300);
    /* the slider stands at its end: the word the control shows there is the word the still's label must carry */
    still.word = (await ev('document.getElementById("hm-zoom").value===document.getElementById("hm-zoom").max')) ? await ev('document.getElementById("hm-zl").textContent') : '';
    out.zoom = await sum(t); t = await now();
    /* Replay */
    await ev('document.getElementById("hm-zoom").value=0,document.getElementById("hm-zoom").dispatchEvent(new Event("input",{bubbles:true})),0');
    await settle(200); t = await now();
    await ev('document.getElementById("hm-replay").click(),0');
    for (let k = 0; k < 40 && Number(await ev('document.getElementById("hm-zoom").value')) < 6; k++) await settle(300);
    await settle(300);
    alive.replay = Number(await ev('document.getElementById("hm-zoom").value')) >= 6;
    out.replay = await sum(t);
    /* the register: bring it into view (a scroll is not a shift), then the pointer over 24 cells */
    await ev('document.getElementById("hm-months").scrollIntoView({block:"center"}),0');
    await settle(400); t = await now();
    const cells = JSON.parse(await ev('JSON.stringify([].slice.call(document.querySelectorAll("#hm-months .hm-cell")).map(function(b){var r=b.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2,r.top>=60&&r.bottom<=innerHeight]}))'));
    const pick = cells.map((c, i) => ({ c, i })).filter((x) => x.c[2]).filter((x, k, a) => k % Math.max(1, Math.floor(a.length / 24)) === 0).slice(0, 24);
    const texts = new Set();
    for (const p of pick) {
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.c[0], y: p.c[1] });
      await settle(40);
      texts.add(await ev('document.getElementById("hm-readout").textContent'));
    }
    alive.hover = pick.length >= 20 && texts.size >= 12;
    out.hover = await sum(t); out.hoverCells = pick.length; t = await now();
    /* the keys: focus the first cell, then 24 arrows */
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 2, y: 2 });
    await ev('document.querySelector("#hm-months .hm-cell").focus(),0');
    await settle(100);
    const ktexts = new Set();
    for (let k = 0; k < 24; k++) {
      const key = k % 6 === 5 ? 'ArrowDown' : 'ArrowRight';
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key, windowsVirtualKeyCode: key === 'ArrowDown' ? 40 : 39 });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key, windowsVirtualKeyCode: key === 'ArrowDown' ? 40 : 39 });
      await settle(30);
      ktexts.add(await ev('document.getElementById("hm-readout").textContent'));
    }
    alive.keys = ktexts.size >= 12 && (await ev('document.activeElement.getAttribute("data-i")')) === '24';
    out.keys = await sum(t); t = await now();
    /* the theme, there and back */
    await ev('document.querySelector(".theme-pill [data-t=light]").click(),0'); await settle(300);
    alive.theme = (await ev('document.documentElement.getAttribute("data-theme")')) === 'light';
    await ev('document.querySelector(".theme-pill [data-t=dark]").click(),0'); await settle(300);
    out.theme = await sum(t);
    out.overflow = await ev('document.documentElement.scrollWidth-document.documentElement.clientWidth');
    still.after = await stillNow(ev);
    return { out, alive, still };
  });
}

/* the same page for a reader who asked for no motion: nothing plays, and the still is what carries the finding */
async function reduced(send, view) {
  return drive(send, 'file://' + PAGE, Object.assign({}, view, { reduce: true }), async ({ ev, sum, now }) => {
    await ev('document.fonts.ready.then(function(){return 1})', true);
    await settle(500);
    const t = await now();
    await settle(2200);   /* with motion, the autoplay starts 900 ms after the script ran and would be well under way */
    return { asked: await ev('matchMedia("(prefers-reduced-motion: reduce)").matches'), zoom: Number(await ev('document.getElementById("hm-zoom").value')),
      still: await stillNow(ev), shift: await sum(t), load: await sum(0) };
  });
}

/* what the still must be, from its three readings in one view */
function stillOffences(s) {
  const out = [], f = s.first, l = s.loaded, a = s.after, same = (p, q) => p.w === q.w && p.h === q.h && p.dx === q.dx && p.dy === q.dy && p.row === q.row;
  if (!f) return ['the still is not in the parsed document'];
  if (!l || !a) return ['the still left the page'];
  if (!(f.w > 0 && f.w === f.h && f.row === f.h)) out.push('at the first moment the still is ' + f.w + ' × ' + f.h + ' in a row of ' + f.row + ': not a square in a row of its own height');
  if (!f.shown || !(f.edges > 0) || !(f.cross > 0)) out.push('at the first moment the still is hidden, or its edges or its × have no extent');
  if (!same(f, l)) out.push('the still moved while the page loaded: ' + JSON.stringify([f.w, f.h, f.dx, f.dy]) + ' then ' + JSON.stringify([l.w, l.h, l.dx, l.dy]));
  if (!same(l, a)) out.push('the still moved under a control: ' + JSON.stringify([l.w, l.h, l.dx, l.dy]) + ' then ' + JSON.stringify([a.w, a.h, a.dx, a.dy]));
  if (!a.shown) out.push('the still is hidden after the controls');
  if (s.before !== 0) out.push('the zoom had already moved when the still was read, so the reading is not the first paint\'s');
  if (!s.word || f.label !== 'At ' + s.word) out.push('the still\'s label says "' + f.label + '", and the zoom control at its end says "' + s.word + '"');
  return out;
}

async function main() {
  const json = process.argv.includes('--json');
  if (!fs.existsSync(PAGE)) { console.error('check-home: no site/index.html — run the sync first'); return 2; }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-home-'));
  const red = path.join(dir, 'red.html');
  fs.writeFileSync(red, '<!doctype html><body><p id="p">a</p><div style="height:200px;background:#333"></div><button id="b" onclick="document.getElementById(\'p\').innerHTML=\'a<br>b<br>c<br>d\'">grow</button></body>');
  const res = {}, low = {}; let redV = 0, redStill = 'unread';
  const html = fs.readFileSync(PAGE, 'utf8');
  try {
    await withChrome(async (send) => {
      await send('Page.enable'); await send('Runtime.enable');
      await send('Page.addScriptToEvaluateOnNewDocument', { source: OBSERVE });
      redV = await drive(send, 'file://' + red, VIEWS[0], async ({ ev, sum, now }) => { await settle(300); redStill = await stillNow(ev); const t = await now(); await ev('document.getElementById("b").click(),0'); await settle(400); return (await sum(t)).v; });
      for (const v of VIEWS) res[v.w] = await home(send, v);
      for (const v of VIEWS) low[v.w] = await reduced(send, v);
    }, { port: 9417 });
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  let bad = 0;
  const f = (x) => (x === 0 ? '0' : x.toFixed(5));
  const ZK_WORD = (v) => (v === 0 ? 'at rest' : 'moved to ' + v);
  console.log('home battery — site/index.html, the Layout Instability entries of every control');
  if (redV > 0) console.log('       RED ok    a planted control that grows a paragraph measures a shift (' + f(redV) + ')');
  else { bad++; console.log('       RED FAIL  the planted shift measured 0: the probe cannot see a shift'); }
  /* the still's red controls: a page without one, and this page with its alternative stripped, then named by a script */
  const reds = [
    ['a page with no still is read as having none', redStill === null],
    ['a still whose text alternative is stripped is refused', stillBytes(html.replace(/(<div class="hm-still"><svg\b[^>]*?)\saria-label="[^"]*"/, '$1')).length > 0],
    ['a still one pixel lower after the controls is refused', (() => { const s = res[VIEWS[0].w].still;
      return !!(s.first && s.after) && stillOffences(Object.assign({}, s, { after: Object.assign({}, s.after, { dy: s.after.dy + 1 }) })).length === stillOffences(s).length + 1; })()],
    ['a still that a script names is refused',stillBytes(html.replace('</body>', '<script>document.querySelector(".hm-still").hidden=true</script></body>')).length > 0]
  ];
  for (const [name, fired] of reds) { if (fired) console.log('       RED ok    ' + name); else { bad++; console.log('       RED FAIL  ' + name); } }
  const bytes = stillBytes(html);
  for (const b of bytes) { bad++; console.log('  FAIL  the still, in the page\'s bytes: ' + b); }
  for (const v of VIEWS) {
    const { out, alive, still } = res[v.w], lo = low[v.w];
    const so = stillOffences(still);
    if (!lo.asked) so.push('the reduced-motion pass did not ask for reduced motion');
    else {
      if (lo.zoom !== 0) so.push('with reduced motion the zoom played by itself, to ' + lo.zoom);
      if (!lo.still || !lo.still.shown || !(lo.still.edges > 0) || !still.loaded || lo.still.w !== still.loaded.w || lo.still.h !== still.loaded.h) so.push('with reduced motion the still is missing, hidden or another size');
      if (lo.shift.v > 0) so.push('with reduced motion the layout shifted by ' + f(lo.shift.v) + ' after the load');
      if (lo.load.v > LOAD_MAX) so.push('with reduced motion the load shifted by ' + f(lo.load.v) + ', above ' + LOAD_MAX);
    }
    for (const o of so) { bad++; console.log('  FAIL  @' + v.w + '  the still: ' + o); }
    const parts = ['autoplay', 'zoom', 'replay', 'hover', 'keys', 'theme'];
    const inter = parts.reduce((a, k) => a + out[k].v, 0);
    for (const k of parts) {
      if (!alive[k]) { bad++; console.log('  FAIL  @' + v.w + '  ' + k + ': the control did not do what it claims while it was measured'); }
      if (out[k].v > 0) { bad++; console.log('  FAIL  @' + v.w + '  ' + k + ': layout shift ' + f(out[k].v) + ' in ' + out[k].n + ' entr' + (out[k].n === 1 ? 'y' : 'ies')); }
    }
    if (out.load.v > LOAD_MAX) { bad++; console.log('  FAIL  @' + v.w + '  load: layout shift ' + f(out.load.v) + ', above ' + LOAD_MAX); }
    if (out.overflow > 0) { bad++; console.log('  FAIL  @' + v.w + '  the page scrolls sideways by ' + out.overflow + ' px'); }
    console.log('  ' + (inter === 0 && parts.every((k) => alive[k]) && !so.length ? 'ok  ' : 'FAIL') + '  @' + v.w + '  load ' + f(out.load.v) + ' (' + out.load.n + ' entries) · interactions ' + f(inter)
      + '  [' + parts.map((k) => k + ' ' + f(out[k].v)).join(' · ') + ']  · ' + out.hoverCells + ' cells under the pointer, 24 under the keys'
      + (still.first ? ' · the still ' + still.first.w + ' × ' + still.first.h + ' px at the first moment' + (so.length ? '' : ', unmoved by the load and by every control, labelled "' + still.first.label + '"') : ' · no still')
      + ' · reduced motion: zoom ' + ZK_WORD(lo.zoom) + ', shift ' + f(lo.shift.v) + ' (load ' + f(lo.load.v) + ')');
  }
  if (json) console.log(JSON.stringify({ red: redV, views: Object.fromEntries(VIEWS.map((v) => [v.w, Object.assign({}, res[v.w].out, { still: res[v.w].still, reduced: low[v.w] })])) }));
  console.log(bad ? 'check-home: FAIL — ' + bad + ' refusal(s)' : 'check-home: PASS — no control moves the layout at 1440 or 390; the still is on the page from the first moment, with motion and without; ' + (1 + reds.length) + '/' + (1 + reds.length) + ' red controls fired');
  return bad ? 1 : 0;
}

main().then((c) => process.exit(c)).catch((e) => { console.error('check-home REFUSED: ' + e.message); process.exit(1); });
