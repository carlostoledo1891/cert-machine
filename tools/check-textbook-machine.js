#!/usr/bin/env node
/* check-textbook-machine.js — the textbook machine's controls move nothing: its layout shift, measured in Chrome.
   tools/ · cert-machine · 2026-11-12

   THE RULE (the operator, 2026-11-11, for the home page and for this instrument): no layout shift when a control
   changes what is shown. playground/textbook-machine/page.css reserves the size of every element whose content changes;
   this file holds it to that. It drives site/instruments/textbook-machine/index.html in headless Chrome (design/cdp.js,
   real waits) at 1440 and at 390 wide (device-metrics emulation) and reads the browser's own Layout Instability entries
   under each control, whether or not the browser would excuse one as following an input:

     load      from navigation until the fonts are in and the page has settled; refused above LOAD_MAX
     ladder    each of the five machines picked, three steps fired, then played to its end at full speed (the counter
               for a second, then paused), and back to the first                                       must be exactly 0
     inputs    the palindrome's word typed (empty, one letter, abab, sixteen letters), the lock checker's setting typed,
               the finder's switches taken to 10 and down to 1                                                       0
     chart     the pointer over the ten columns, then the arrow keys through them                                 0
     beaver    the four champions run in the tab, the five-state one to its 47 million steps                          0
     claims    the five claims decided; each "watch it" pressed (it scrolls, and a scroll is not a shift)            0
     theme     the theme pill to light and back                                                                     0

   It checks that each control did what it claims while it was measured (the machine's description changed, the runs
   ended, the readout followed the pointer and the keys, the champions stopped at their recorded counts, the claims came
   back CERTIFIED, REFUTED, CERTIFIED, CERTIFIED, REFUSED), so a control that silently did nothing cannot pass. And the
   page must not scroll sideways at either width.
   RED CONTROL: a planted page whose button grows a paragraph above a block must measure a shift above zero by the same
   probe, or the run fails.

     node tools/check-textbook-machine.js        gate; exit 1 on any interaction shift, a load shift above LOAD_MAX, a
                                                 dead control or a sideways scroll                                    MIT */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { withChrome, settle } = require(path.join(ROOT, 'design', 'cdp.js'));
const PAGE = process.env.TM_PAGE || path.join(ROOT, 'site', 'instruments', 'textbook-machine', 'index.html');
const LOAD_MAX = 0.01;
const VIEWS = [{ w: 1440, h: 900, mobile: false }, { w: 390, h: 844, mobile: true }];
const OBSERVE = 'window.__ls=[];try{new PerformanceObserver(function(l){l.getEntries().forEach(function(e){window.__ls.push({t:e.startTime,v:e.value})})}).observe({type:"layout-shift",buffered:true})}catch(e){window.__lsErr=String(e)}';

async function drive(send, url, view, plan) {
  await send('Emulation.setDeviceMetricsOverride', { width: view.w, height: view.h, deviceScaleFactor: 1, mobile: view.mobile });
  await send('Page.navigate', { url: 'about:blank' });
  await settle(120);
  await send('Page.navigate', { url });
  const ev = async (expression, awaitPromise) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: !!awaitPromise }, 120000);
    if (r.exceptionDetails) throw new Error('the page threw: ' + (r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text));
    return r.result.value;
  };
  const sum = async (from) => { const a = JSON.parse(await ev('JSON.stringify(window.__ls||[])')); const x = a.filter((e) => e.t >= from); return { n: x.length, v: x.reduce((s, e) => s + e.v, 0) }; };
  const now = () => ev('performance.now()');
  return plan({ ev, sum, now, send });
}

/* one function the page runs: pick a machine, fire three steps, play it to its end at full speed (or a second, for the
   counter), report what it saw */
const RUN_ALL = 'new Promise(function(done){var ks=["count","palindrome","check","find","beaver","count"],seen=[],i=0,raf=function(f){requestAnimationFrame(function(){requestAnimationFrame(f)})};'
  + 'var sp=document.getElementById("tm-speedr");sp.value=100;'
  + 'function next(){if(i>=ks.length)return done(JSON.stringify(seen));var k=ks[i++];document.querySelector(".tm-step[data-k="+k+"]").click();'
  + 'raf(function(){var w=document.getElementById("tm-what").textContent;for(var j=0;j<3;j++)document.getElementById("tm-stepb").click();'
  + 'raf(function(){var p=document.getElementById("tm-play");p.click();var t0=performance.now();'
  + '(function wait(){var st=document.getElementById("tm-state").textContent,ended=/^(stopped|answered)/.test(st);'
  + 'if(ended||performance.now()-t0>(k==="count"?1000:20000)){if(!ended)p.click();seen.push({k:k,what:w,state:st,steps:document.getElementById("tm-steps").textContent,say:document.getElementById("tm-say").textContent});raf(next)}else setTimeout(wait,60)})()})})}next()})';
const INPUTS = 'new Promise(function(done){var raf=function(f){requestAnimationFrame(function(){requestAnimationFrame(f)})},out=[];'
  + 'function type(v){var i=document.getElementById("tm-word");i.value=v;i.dispatchEvent(new Event("input",{bubbles:true}));out.push(document.getElementById("tm-say").textContent.slice(0,8)+"|"+i.value)}'
  + 'document.querySelector(".tm-step[data-k=palindrome]").click();raf(function(){["","a","abab","abbaabbaabbaabba"].forEach(type);'
  + 'document.querySelector(".tm-step[data-k=check]").click();raf(function(){["0","1101","111111111111",""].forEach(type);'
  + 'document.querySelector(".tm-step[data-k=find]").click();raf(function(){var b=document.querySelectorAll("#tm-inp button"),k;for(k=0;k<12;k++)document.querySelectorAll("#tm-inp button")[1].click();'
  + 'var hi=document.getElementById("tm-n").textContent;for(k=0;k<12;k++)document.querySelectorAll("#tm-inp button")[0].click();out.push("n "+hi+" "+document.getElementById("tm-n").textContent);raf(function(){done(JSON.stringify(out))})})})})})';

async function machine(send, view) {
  return drive(send, 'file://' + PAGE, view, async ({ ev, sum, now }) => {
    const out = {}, alive = {};
    await ev('document.fonts.ready.then(function(){return 1})', true);
    await settle(1500);   /* the autoplay starts 900 ms after the script ran and runs on: the load window includes it */
    if (await ev('window.__lsErr||""')) throw new Error('this Chrome has no layout-shift entries: ' + await ev('window.__lsErr'));
    out.load = await sum(0);
    await ev('document.getElementById("machine").scrollIntoView({block:"start"}),0'); await settle(300);
    let t = await now();
    const seen = JSON.parse(await ev(RUN_ALL, true));
    alive.ladder = seen.length === 6 && new Set(seen.map((s) => s.what)).size === 5 && seen.slice(1, 5).every((s) => /^(stopped|answered)/.test(s.state))
      && seen.find((s) => s.k === 'beaver').steps === '107' && seen.every((s) => /^Step [\d,]+\./.test(s.say));
    out.ladderSeen = seen.map((s) => s.k + ' ' + s.state + ' ' + s.steps);
    await settle(300); out.ladder = await sum(t); t = await now();
    const typed = JSON.parse(await ev(INPUTS, true));
    alive.inputs = typed.length === 9 && typed[8] === 'n 10 1' && typed[3].endsWith('|abbaabbaabbaabba');
    await settle(300); out.inputs = await sum(t);
    /* the chart: the pointer over every column, then the keys */
    await ev('document.querySelector(".tm-chart").scrollIntoView({block:"center"}),0'); await settle(400); t = await now();
    const cols = JSON.parse(await ev('JSON.stringify([].slice.call(document.querySelectorAll(".tm-col .tm-hit")).map(function(r){var b=r.getBoundingClientRect();return [b.left+b.width/2,b.top+b.height/2]}))'));
    const ro = new Set();
    for (const c of cols) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: c[0], y: c[1] }); await settle(40); ro.add(await ev('document.getElementById("tm-ro").textContent')); }
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 2, y: 2 });
    await ev('document.querySelector(".tm-col[data-i=\'0\']").focus(),0'); await settle(60);
    const kro = new Set();
    for (let k = 0; k < 9; k++) {
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
      await settle(40); kro.add(await ev('document.getElementById("tm-ro").textContent'));
    }
    alive.chart = cols.length === 10 && ro.size === 10 && kro.size === 9;
    await settle(200); out.chart = await sum(t);
    /* the champions */
    await ev('document.querySelector(".tm-bb").scrollIntoView({block:"center"}),0'); await settle(400); t = await now();
    const bb = JSON.parse(await ev('new Promise(function(done){[2,3,4,5].forEach(function(k){document.querySelector("[data-bb=\'"+k+"\']").click()});var t0=performance.now();'
      + '(function wait(){var o=[2,3,4,5].map(function(k){return document.getElementById("tm-bb"+k).textContent});if(o.every(function(x){return /^stopped/.test(x)})||performance.now()-t0>30000)done(JSON.stringify(o));else setTimeout(wait,100)})()})', true));
    alive.beaver = /^stopped after 6 steps/.test(bb[0]) && /^stopped after 21 steps/.test(bb[1]) && /^stopped after 107 steps, 13 ones/.test(bb[2]) && /^stopped after 47,176,870 steps, 4,098 ones/.test(bb[3]);
    out.beaverSeen = bb;
    await settle(300); out.beaver = await sum(t);
    /* the claims, decided, then each watched */
    await ev('document.getElementById("claims").scrollIntoView({block:"start"}),0'); await settle(400); t = await now();
    const verdicts = JSON.parse(await ev('JSON.stringify([].slice.call(document.querySelectorAll("[data-decide]")).map(function(b){b.click();return (document.getElementById("tm-c-"+b.getAttribute("data-decide")).querySelector(".tag")||{}).textContent||""}))'));
    alive.claims = verdicts.join(' ') === 'Certified Refuted Certified Certified Refused';
    const watched = JSON.parse(await ev('new Promise(function(done){var w=[].slice.call(document.querySelectorAll("[data-watch]")),o=[],i=0;(function n(){if(i>=w.length)return done(JSON.stringify(o));w[i++].click();setTimeout(function(){o.push(document.querySelector(".tm-step[aria-selected=true]").getAttribute("data-k"));n()},250)})()})', true));
    alive.claims = alive.claims && watched.join(' ') === 'palindrome palindrome find beaver count';
    await settle(300); out.claims = await sum(t); t = await now();
    await ev('document.querySelector(".theme-pill [data-t=light]").click(),0'); await settle(300);
    alive.theme = (await ev('document.documentElement.getAttribute("data-theme")')) === 'light';
    await ev('document.querySelector(".theme-pill [data-t=dark]").click(),0'); await settle(300);
    out.theme = await sum(t);
    out.overflow = await ev('document.documentElement.scrollWidth-document.documentElement.clientWidth');
    return { out, alive };
  });
}

async function main() {
  if (!fs.existsSync(PAGE)) { console.error('check-textbook-machine: no ' + path.relative(ROOT, PAGE) + ' (build /instruments and sync first)'); return 2; }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-tm-'));
  const red = path.join(dir, 'red.html');
  fs.writeFileSync(red, '<!doctype html><body><p id="p">a</p><div style="height:200px;background:#333"></div><button id="b" onclick="document.getElementById(\'p\').innerHTML=\'a<br>b<br>c<br>d\'">grow</button></body>');
  const res = {}; let redV = 0;
  try {
    await withChrome(async (send) => {
      await send('Page.enable'); await send('Runtime.enable');
      await send('Page.addScriptToEvaluateOnNewDocument', { source: OBSERVE });
      redV = await drive(send, 'file://' + red, VIEWS[0], async ({ ev, sum, now }) => { await settle(300); const t = await now(); await ev('document.getElementById("b").click(),0'); await settle(400); return (await sum(t)).v; });
      for (const v of VIEWS) res[v.w] = await machine(send, v);
    }, { port: 9419 });
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  let bad = 0;
  const f = (x) => (x === 0 ? '0' : x.toFixed(5));
  console.log('textbook machine — ' + path.relative(ROOT, PAGE) + ', the Layout Instability entries of every control');
  if (redV > 0) console.log('       RED ok    a planted control that grows a paragraph measures a shift (' + f(redV) + ')');
  else { bad++; console.log('       RED FAIL  the planted shift measured 0: the probe cannot see a shift'); }
  const parts = ['ladder', 'inputs', 'chart', 'beaver', 'claims', 'theme'];
  for (const v of VIEWS) {
    const { out, alive } = res[v.w];
    for (const k of parts) {
      if (!alive[k]) { bad++; console.log('  FAIL  @' + v.w + '  ' + k + ': the control did not do what it claims while it was measured' + (k === 'ladder' ? ' ' + JSON.stringify(out.ladderSeen) : k === 'beaver' ? ' ' + JSON.stringify(out.beaverSeen) : '')); }
      if (out[k].v > 0) { bad++; console.log('  FAIL  @' + v.w + '  ' + k + ': layout shift ' + f(out[k].v) + ' in ' + out[k].n + ' entr' + (out[k].n === 1 ? 'y' : 'ies')); }
    }
    if (out.load.v > LOAD_MAX) { bad++; console.log('  FAIL  @' + v.w + '  load: layout shift ' + f(out.load.v) + ', above ' + LOAD_MAX); }
    if (out.overflow > 0) { bad++; console.log('  FAIL  @' + v.w + '  the page scrolls sideways by ' + out.overflow + ' px'); }
    const inter = parts.reduce((a, k) => a + out[k].v, 0);
    console.log('  ' + (inter === 0 && parts.every((k) => alive[k]) ? 'ok  ' : 'FAIL') + '  @' + v.w + '  load ' + f(out.load.v) + ' (' + out.load.n + ' entries) · interactions ' + f(inter)
      + '  [' + parts.map((k) => k + ' ' + f(out[k].v)).join(' · ') + '] · ' + out.ladderSeen.slice(1, 5).join(', '));
  }
  console.log(bad ? 'check-textbook-machine: FAIL — ' + bad + ' refusal(s)' : 'check-textbook-machine: PASS — no control moves the layout at 1440 or 390, every control did what it claims, the red control fired');
  return bad ? 1 : 0;
}

main().then((c) => process.exit(c)).catch((e) => { console.error('check-textbook-machine REFUSED: ' + e.message); process.exit(1); });
