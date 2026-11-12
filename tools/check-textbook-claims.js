#!/usr/bin/env node
/* check-textbook-claims.js — the claims page of the textbook machine, in Chrome: its controls move nothing, and every
   word it shows is the word Node gives.
   tools/ · cert-machine · 2026-11-12

   THE PAGE (site/instruments/textbook-machine/claims/index.html) decides published claims in the tab: nothing is baked
   into its HTML but the sentences and the declared changes. So this gate reads the page as a visitor's browser shows
   it, at 1440 and at 390 wide (device-metrics emulation, design/cdp.js, real waits), and holds two things at once:

   THE WORDS. For every claim as it stands and under every declared change, the word the tab shows (the chip's text
   and the claim's data-verdict) is the word Node gives: `node instruments/claimbox/check.js` on the same text, through
   the one rule playground/textbook-machine/claim-verdict.js. Reset must bring back the first word. One click down, the
   layer must print the checker's own line, the same line Node prints (the seconds apart), and the claim as decided.

   THE LAYOUT. The browser's own Layout Instability entries, whether or not it would excuse one as following an input:
     load      from navigation until the fonts are in and the claims are decided; refused above LOAD_MAX
     changes   every declared change of every claim pressed, then Reset                              must be exactly 0
     trust     "why you can trust this" opened and closed on every claim (a <dialog>, out of the flow)             0
     silent    the checker made to give no line: the claim says so in plain words and wears no verdict             0
     theme     the theme pill to light and back                                                                   0
   No reserved box may clip its text in any state it was put in, and the page must not scroll sideways.
   WITHOUT THE CHECKER: the page loaded with its bundle blocked (a browser that cannot run it) must say so in plain
   words on every claim and show no verdict.
   RED CONTROLS: a planted page whose button grows a paragraph must measure a shift above zero by the same probe; and
   Node's word for one changed claim, compared with the tab's word for the unchanged one, must differ (the comparison
   can fail).

     node tools/check-textbook-claims.js        exit 1 on any refusal                                              MIT */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { withChrome, settle } = require(path.join(ROOT, 'design', 'cdp.js'));
const SET = require(path.join(ROOT, 'playground', 'textbook-machine', 'claims.set.js'));
const CB = require(path.join(ROOT, 'playground', 'textbook-machine', 'claims.build.js'));
const PAGE = process.env.TMC_PAGE || path.join(ROOT, 'site', 'instruments', 'textbook-machine', 'claims', 'index.html');
const LOAD_MAX = 0.01;
const VIEWS = [{ w: 1440, h: 900, mobile: false }, { w: 390, h: 844, mobile: true }];
const OBSERVE = 'window.__ls=[];try{new PerformanceObserver(function(l){l.getEntries().forEach(function(e){window.__ls.push({t:e.startTime,v:e.value})})}).observe({type:"layout-shift",buffered:true})}catch(e){window.__lsErr=String(e)}';
const W = CB.W;

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

/* what the page shows for every claim, read in one go: the word on the chip, data-verdict, the sentence, the reason,
   the pressed change, whether Reset is live, and every reserved box that clips its text */
const READ = '(function(){var clip=[];[].forEach.call(document.querySelectorAll(".tc-say,.tc-why,.tc-word,.tc-status"),function(e){if(e.scrollHeight>e.clientHeight+1||e.scrollWidth>e.clientWidth+1)clip.push((e.id||e.className)+" "+e.scrollHeight+">"+e.clientHeight)});'
  + 'return JSON.stringify({clip:clip,claims:[].map.call(document.querySelectorAll("[data-claim]"),function(li){var id=li.getAttribute("data-claim"),t=li.querySelector(".tc-word .tag"),p=li.querySelector("[data-v][aria-pressed=true]");'
  + 'return {id:id,verdict:li.getAttribute("data-verdict"),chip:t?t.textContent:null,none:!!li.querySelector(".tc-word .tc-none"),say:document.getElementById("tc-say-"+id).textContent,why:document.getElementById("tc-why-"+id).textContent,pressed:p?+p.getAttribute("data-v"):null,reset:!li.querySelector("[data-reset]").disabled}})})})()';
const click = (id, sel) => 'document.querySelector(\'[data-claim="' + id + '"] ' + sel + '\').click(),0';

async function claimsPage(send, view, node) {
  return drive(send, 'file://' + PAGE, view, async ({ ev, sum, now }) => {
    const out = { bad: [] }, alive = {};
    const read = async (where) => { const x = JSON.parse(await ev(READ)); for (const c of x.clip) out.bad.push('a reserved box clips its text (' + where + '): ' + c); return x.claims; };
    await ev('document.fonts.ready.then(function(){return 1})', true);
    await settle(1200);
    if (await ev('window.__lsErr||""')) throw new Error('this Chrome has no layout-shift entries: ' + await ev('window.__lsErr'));
    out.load = await sum(0);
    /* the words as the page opens */
    const first = await read('as the page opens');
    out.words = first.map((c) => c.verdict);
    alive.load = first.length === node.length && /each one matches its pin/.test(await ev('document.getElementById("tc-status").textContent'));
    first.forEach((c, i) => { const n = node[i]; if (c.id !== n.id || c.verdict !== n.variants[0].verdict || c.chip !== n.variants[0].verdict || c.none || !c.why.trim() || !c.say.trim()) out.bad.push(n.id + ' as it stands: the tab shows ' + JSON.stringify(c.chip) + ', Node gives ' + n.variants[0].verdict); });
    /* every declared change, then Reset */
    let t = await now(), pressed = 0;
    for (const n of node) {
      await ev('document.querySelector(\'[data-claim="' + n.id + '"]\').scrollIntoView({block:"center"}),0'); await settle(120);
      const t0 = await now();
      for (let i = 1; i < n.variants.length; i++) {
        await ev(click(n.id, '[data-v="' + i + '"]')); await settle(80); pressed++;
        const c = (await read(n.id + ' "' + n.variants[i].label + '"')).find((x) => x.id === n.id);
        if (c.verdict !== n.variants[i].verdict || c.chip !== n.variants[i].verdict || c.pressed !== i || !c.reset || !c.why.trim())
          out.bad.push(n.id + ' "' + n.variants[i].label + '": the tab shows ' + JSON.stringify(c.chip) + ', Node gives ' + n.variants[i].verdict);
      }
      await ev(click(n.id, '[data-reset]')); await settle(80);
      const c = (await read(n.id + ' reset')).find((x) => x.id === n.id);
      if (c.verdict !== n.variants[0].verdict || c.pressed !== 0 || c.reset) out.bad.push(n.id + ': Reset did not bring back ' + n.variants[0].verdict + ' (' + JSON.stringify(c.chip) + ')');
      const s = await sum(t0); if (s.v > 0) out.bad.push(n.id + ': its changes shift the layout by ' + s.v.toFixed(5));
    }
    alive.changes = pressed === node.reduce((a, n) => a + n.variants.length - 1, 0) && pressed > 0;
    await settle(200); out.changes = await sum(t); t = await now();
    /* one click down, on every claim: the checker's own line is Node's, the claim as decided is the object */
    let opened = 0;
    for (const n of node) {
      await ev(click(n.id, '[data-trust]')); await settle(120);
      const d = JSON.parse(await ev('(function(){var d=document.getElementById("tc-dlg"),p=d.querySelectorAll(".tc-pre");return JSON.stringify({open:d.open,line:p[0]?p[0].textContent:null,obj:p[1]?p[1].textContent:null,chips:[].map.call(d.querySelectorAll(".tag"),function(x){return x.textContent}),files:d.querySelectorAll(".tc-files li").length})})()'));
      const want = n.variants[0];
      if (!d.open || CB.mask(d.line) !== want.line || d.obj !== n.text || d.chips[0] !== want.verdict || d.files !== n.needs
        || (want.cv.admitted && d.chips.slice(1, 1 + want.parts.length).join(' ') !== want.parts.join(' ')) || (want.repair !== null && d.chips[d.chips.length - 1] !== want.repair))
        out.bad.push(n.id + ': one click down does not show Node\'s line, the object, the word of each part and the ' + n.needs + ' files (' + JSON.stringify(d.line).slice(0, 90) + ', chips ' + d.chips.join(' ') + ', files ' + d.files + ')');
      else opened++;
      await ev('document.querySelector("#tc-dlg [data-close]").click(),0'); await settle(80);
      if (await ev('document.getElementById("tc-dlg").open')) out.bad.push(n.id + ': the layer did not close');
    }
    alive.trust = opened === node.length;
    await settle(200); out.trust = await sum(t); t = await now();
    /* the checker gives no line: plain words, no verdict */
    const id0 = node[0].id;
    await ev('window.__decide=ClaimChecker.decide,ClaimChecker.decide=function(){return {word:null,kind:null,id:null,notes:[],line:null,exit:2,stderr:"refused to run",error:null,result:null}},0');
    await ev(click(id0, '[data-v="1"]')); await settle(100);
    const silent = (await read('no line')).find((x) => x.id === id0);
    await ev('ClaimChecker.decide=function(){throw new Error("stopped")},0');
    await ev(click(id0, '[data-v="0"]')); await settle(100);
    const thrown = (await read('the checker threw')).find((x) => x.id === id0);
    await ev('ClaimChecker.decide=window.__decide,0');
    await ev(click(id0, '[data-reset]')); await ev(click(id0, '[data-v="0"]')); await settle(100);
    const back = (await read('after the silence')).find((x) => x.id === id0);
    alive.silent = silent.none && silent.chip === null && silent.verdict === '' && silent.why.trim().length > 20 && thrown.none && thrown.chip === null && thrown.why.trim().length > 20 && back.chip === node[0].variants[0].verdict;
    await settle(200); out.silent = await sum(t); t = await now();
    await ev('document.querySelector(".theme-pill [data-t=light]").click(),0'); await settle(300);
    alive.theme = (await ev('document.documentElement.getAttribute("data-theme")')) === 'light';
    await read('light theme');
    await ev('document.querySelector(".theme-pill [data-t=dark]").click(),0'); await settle(300);
    out.theme = await sum(t);
    out.overflow = await ev('document.documentElement.scrollWidth-document.documentElement.clientWidth');
    return { out, alive };
  });
}

async function main() {
  if (!fs.existsSync(PAGE)) { console.error('check-textbook-claims: no ' + path.relative(ROOT, PAGE) + ' (build /instruments first)'); return 2; }
  /* Node, the authority: every served claim and every declared change, through the one rule */
  const served = SET.served(), table = CB.nodeTable(served), M = CB.derive().manifest;
  const node = table.map((row, i) => Object.assign(row, { text: served[i].text, needs: M.objects.find((o) => o.path === row.path).needs.length }));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-tmc-'));
  const red = path.join(dir, 'red.html');
  fs.writeFileSync(red, '<!doctype html><body><p id="p">a</p><div style="height:200px;background:#333"></div><button id="b" onclick="document.getElementById(\'p\').innerHTML=\'a<br>b<br>c<br>d\'">grow</button></body>');
  const res = {}; let redV = 0, bare = null;
  try {
    await withChrome(async (send) => {
      await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
      await send('Page.addScriptToEvaluateOnNewDocument', { source: OBSERVE });
      redV = await drive(send, 'file://' + red, VIEWS[0], async ({ ev, sum, now }) => { await settle(300); const t = await now(); await ev('document.getElementById("b").click(),0'); await settle(400); return (await sum(t)).v; });
      for (const v of VIEWS) res[v.w] = await claimsPage(send, v, node);
      /* a browser that cannot run the checker: the bundle blocked */
      await send('Network.setBlockedURLs', { urls: ['*' + CB.SERVED_AS] });
      bare = await drive(send, 'file://' + PAGE, VIEWS[1], async ({ ev }) => { await settle(1200); return { has: await ev('typeof ClaimChecker'), status: await ev('document.getElementById("tc-status").textContent'), claims: JSON.parse(await ev(READ)) }; });
      await send('Network.setBlockedURLs', { urls: [] });
    }, { port: 9423 });
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }

  let bad = 0;
  const f = (x) => (x === 0 ? '0' : x.toFixed(5));
  console.log('textbook machine, claims — ' + path.relative(ROOT, PAGE) + ': the words against Node, and the Layout Instability entries of every control');
  if (redV > 0) console.log('       RED ok    a planted control that grows a paragraph measures a shift (' + f(redV) + ')');
  else { bad++; console.log('       RED FAIL  the planted shift measured 0: the probe cannot see a shift'); }
  const flip = node.find((n) => n.variants.some((v) => v.verdict !== n.variants[0].verdict));
  const other = flip && flip.variants.find((v) => v.verdict !== flip.variants[0].verdict);
  if (flip && res[1440].out.words[node.indexOf(flip)] !== other.verdict) console.log('       RED ok    Node\'s word for ' + flip.id + ' "' + other.label + '" (' + other.verdict + ') is not the tab\'s word for the claim as it stands (' + res[1440].out.words[node.indexOf(flip)] + '): the comparison can fail');
  else { bad++; console.log('       RED FAIL  no declared change turns a word: the comparison cannot fail'); }
  const bareOk = bare && bare.has === 'undefined' && bare.claims.claims.length === node.length && bare.claims.claims.every((c) => c.none && c.chip === null && /could not run the checker/.test(c.why)) && /could not run the checker/.test(bare.status) && !bare.claims.clip.length;
  if (bareOk) console.log('  ok    with the bundle blocked, every claim says in plain words that nothing is decided, and wears no verdict');
  else { bad++; console.log('  FAIL  with the bundle blocked the page does not say so on every claim: ' + JSON.stringify(bare).slice(0, 300)); }
  const parts = ['changes', 'trust', 'silent', 'theme'];
  for (const v of VIEWS) {
    const { out, alive } = res[v.w];
    for (const b of out.bad) { bad++; console.log('  FAIL  @' + v.w + '  ' + b); }
    for (const k of ['load'].concat(parts)) if (!alive[k]) { bad++; console.log('  FAIL  @' + v.w + '  ' + k + ': the control did not do what it claims while it was measured'); }
    for (const k of parts) if (out[k].v > 0) { bad++; console.log('  FAIL  @' + v.w + '  ' + k + ': layout shift ' + f(out[k].v) + ' in ' + out[k].n + ' entr' + (out[k].n === 1 ? 'y' : 'ies')); }
    if (out.load.v > LOAD_MAX) { bad++; console.log('  FAIL  @' + v.w + '  load: layout shift ' + f(out.load.v) + ', above ' + LOAD_MAX); }
    if (out.overflow > 0) { bad++; console.log('  FAIL  @' + v.w + '  the page scrolls sideways by ' + out.overflow + ' px'); }
    const inter = parts.reduce((a, k) => a + out[k].v, 0);
    console.log('  ' + (inter === 0 && !out.bad.length && parts.every((k) => alive[k]) ? 'ok  ' : 'FAIL') + '  @' + v.w + '  load ' + f(out.load.v) + ' (' + out.load.n + ' entries) · interactions ' + f(inter)
      + '  [' + parts.map((k) => k + ' ' + f(out[k].v)).join(' · ') + '] · live words ' + out.words.join(' ') + ' = Node\'s');
  }
  const nv = node.reduce((a, n) => a + n.variants.length, 0);
  console.log(bad ? 'check-textbook-claims: FAIL — ' + bad + ' refusal(s)' : 'check-textbook-claims: PASS — ' + node.length + ' claims and ' + (nv - node.length) + ' changes show Node\'s word in the tab at 1440 and 390, no control moves the layout, no reserved box clips, the red controls fired');
  return bad ? 1 : 0;
}

main().then((c) => process.exit(c)).catch((e) => { console.error('check-textbook-claims REFUSED: ' + e.message); process.exit(1); });
