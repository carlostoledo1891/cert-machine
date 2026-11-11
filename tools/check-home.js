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
   pass as "no shift". RED CONTROL: a planted page whose button grows a paragraph above a block must measure a shift
   above zero by the same probe, or the run fails.

     node tools/check-home.js            gate; exit 1 on any interaction shift, a load shift above LOAD_MAX, or a dead control
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

/* installed before any page script: every layout-shift entry, kept with its time */
const OBSERVE = 'window.__ls=[];try{new PerformanceObserver(function(l){l.getEntries().forEach(function(e){window.__ls.push({t:e.startTime,v:e.value,i:e.hadRecentInput})})}).observe({type:"layout-shift",buffered:true})}catch(e){window.__lsErr=String(e)}';

async function drive(send, url, view, plan) {
  await send('Emulation.setDeviceMetricsOverride', { width: view.w, height: view.h, deviceScaleFactor: 1, mobile: view.mobile });
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
    const out = {}, alive = {};
    /* load: the fonts, then a beat; the autoplay starts 900 ms after the script ran, so the load window ends before it */
    await ev('document.fonts.ready.then(function(){return 1})', true);
    await settle(500);
    if (await ev('window.__lsErr||""')) throw new Error('this Chrome has no layout-shift entries: ' + await ev('window.__lsErr'));
    let t = await now();
    out.load = await sum(0);
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
    return { out, alive };
  });
}

async function main() {
  const json = process.argv.includes('--json');
  if (!fs.existsSync(PAGE)) { console.error('check-home: no site/index.html — run the sync first'); return 2; }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-home-'));
  const red = path.join(dir, 'red.html');
  fs.writeFileSync(red, '<!doctype html><body><p id="p">a</p><div style="height:200px;background:#333"></div><button id="b" onclick="document.getElementById(\'p\').innerHTML=\'a<br>b<br>c<br>d\'">grow</button></body>');
  const res = {}; let redV = 0;
  try {
    await withChrome(async (send) => {
      await send('Page.enable'); await send('Runtime.enable');
      await send('Page.addScriptToEvaluateOnNewDocument', { source: OBSERVE });
      redV = await drive(send, 'file://' + red, VIEWS[0], async ({ ev, sum, now }) => { await settle(300); const t = await now(); await ev('document.getElementById("b").click(),0'); await settle(400); return (await sum(t)).v; });
      for (const v of VIEWS) res[v.w] = await home(send, v);
    }, { port: 9417 });
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  let bad = 0;
  const f = (x) => (x === 0 ? '0' : x.toFixed(5));
  console.log('home battery — site/index.html, the Layout Instability entries of every control');
  if (redV > 0) console.log('       RED ok    a planted control that grows a paragraph measures a shift (' + f(redV) + ')');
  else { bad++; console.log('       RED FAIL  the planted shift measured 0: the probe cannot see a shift'); }
  for (const v of VIEWS) {
    const { out, alive } = res[v.w];
    const parts = ['autoplay', 'zoom', 'replay', 'hover', 'keys', 'theme'];
    const inter = parts.reduce((a, k) => a + out[k].v, 0);
    for (const k of parts) {
      if (!alive[k]) { bad++; console.log('  FAIL  @' + v.w + '  ' + k + ': the control did not do what it claims while it was measured'); }
      if (out[k].v > 0) { bad++; console.log('  FAIL  @' + v.w + '  ' + k + ': layout shift ' + f(out[k].v) + ' in ' + out[k].n + ' entr' + (out[k].n === 1 ? 'y' : 'ies')); }
    }
    if (out.load.v > LOAD_MAX) { bad++; console.log('  FAIL  @' + v.w + '  load: layout shift ' + f(out.load.v) + ', above ' + LOAD_MAX); }
    if (out.overflow > 0) { bad++; console.log('  FAIL  @' + v.w + '  the page scrolls sideways by ' + out.overflow + ' px'); }
    console.log('  ' + (inter === 0 && parts.every((k) => alive[k]) ? 'ok  ' : 'FAIL') + '  @' + v.w + '  load ' + f(out.load.v) + ' (' + out.load.n + ' entries) · interactions ' + f(inter)
      + '  [' + parts.map((k) => k + ' ' + f(out[k].v)).join(' · ') + ']  · ' + out.hoverCells + ' cells under the pointer, 24 under the keys');
  }
  if (json) console.log(JSON.stringify({ red: redV, views: Object.fromEntries(VIEWS.map((v) => [v.w, res[v.w].out])) }));
  console.log(bad ? 'check-home: FAIL — ' + bad + ' refusal(s)' : 'check-home: PASS — no control moves the layout at 1440 or 390; 1/1 red control fired');
  return bad ? 1 : 0;
}

main().then((c) => process.exit(c)).catch((e) => { console.error('check-home REFUSED: ' + e.message); process.exit(1); });
