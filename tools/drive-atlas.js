#!/usr/bin/env node
/* drive-atlas.js — the return-level atlas driven in Chrome the way a reader meets it, and its facts printed:
     · the document exactly the window at 1440×900, 1280×720, 768×1024 and 390×844 (scrollWidth = innerWidth,
       scrollHeight = innerHeight), no page error;
     · the paper's ten claims decided again in the tab and equal to the build's;
     · a reader's own claim, typed, reproducing the paper's DOES NOT HOLD south of South America;
     · a cell certified in the tab and IDENTICAL to the ledger's record, at 1440 and at 390;
     · the phone's sheet stepping on a tap and a swipe, a claim lowering it, a cell raising it;
     · a link reopening the same cell, tab, chart and block.
   Screenshots go to <tmp>/atlas-drive/. Written 2026-09-28 from the twenty-second session's own drives.
   usage: node tools/dev-serve.js &   then   node tools/drive-atlas.js [url]
          (default http://127.0.0.1:8765/instruments/return-level-atlas/; the live page works too) */
'use strict';
const fs = require('fs'), os = require('os'), path = require('path');
const { withChrome, settle } = require(path.join(__dirname, '..', 'design', 'cdp.js'));
const URL0 = process.argv[2] || 'http://127.0.0.1:8765/instruments/return-level-atlas/';
const OUT = path.join(os.tmpdir(), 'atlas-drive'); fs.mkdirSync(OUT, { recursive: true });
let bad = 0;
const check = (ok, what) => { console.log((ok ? '  ok    ' : '  FAIL  ') + what); if (!ok) bad++; };
withChrome(async (send) => {
  await send('Page.enable'); await send('Runtime.enable');
  const ev = async (e) => { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }, 300000); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 300)); return r.result.value; };
  const shot = async (n) => { const img = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(OUT, n + '.png'), Buffer.from(img.data, 'base64')); };
  const go = async (url, w, h, mobile) => {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile });
    await send('Page.navigate', { url }); await settle(6500);
    await ev('window.__errs = []; window.addEventListener("error", (e) => window.__errs.push(String(e.message)));');
  };
  const geom = async () => JSON.parse(await ev('JSON.stringify({ sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, iw: innerWidth, ih: innerHeight, errs: window.__errs })'));
  const certify = async () => {
    await ev('document.getElementById("ra-cert").click()');
    let p = ''; for (let i = 0; i < 120; i++) { await settle(1000); p = await ev('(document.getElementById("ra-prog") || {}).innerText || ""'); if (/certified here|REFUSED|failed|Not the/.test(p)) break; }
    return p;
  };
  for (const [w, h, m] of [[1440, 900, false], [1280, 720, false], [768, 1024, true], [390, 844, true]]) {
    await go(URL0, w, h, m); const g = await geom();
    check(g.sw === g.iw && g.sh === g.ih && !g.errs.length, w + '×' + h + ': the document is the window (' + g.sw + '×' + g.sh + '), ' + g.errs.length + ' page errors');
    await shot(w + 'x' + h);
  }
  await go(URL0, 1440, 900, false);
  check(/all 10 verdicts and their counts are the build/.test(await ev('document.getElementById("ra-recheck").innerText')), 'the paper\'s ten, decided again in the tab, equal the build\'s');
  await ev(`(() => { const set = (id, v) => { const x = document.getElementById(id); x.value = v; x.dispatchEvent(new Event('change')); };
    set('ra-b-s', -58); set('ra-b-n', -40); set('ra-b-w', -80); set('ra-b-e', -56); set('ra-m-cells', 'g4'); set('ra-m-rule', 'plurality');
    set('ra-m-fam', 'gengamma'); set('ra-m-blk', 'daily'); set('ra-m-crit', 'ad'); document.getElementById('ra-decide').click(); })()`);
  await settle(2500);
  const mine = await ev('document.getElementById("ra-m-out").innerText');
  check(/^DOES NOT HOLD/.test(mine) && /exp\. Weib\. 12, gen\. gamma 9/.test(mine), 'a typed claim reproduces the paper\'s DOES NOT HOLD south of South America');
  await ev('window.__atlas.select("-22.5_-40")'); await settle(2500);
  const p1 = await certify();
  check(/Identical to the ledger/.test(p1), '1440: the Campos cell certified in the tab, identical to the ledger (' + p1.slice(0, 60) + ')');
  await ev('document.querySelector("#ra-cviews button[data-v=\\"qq\\"]").click()'); await settle(500);
  await ev('document.querySelector("#ra-block button[data-v=\\"monthly\\"]").click()'); await settle(900);
  await shot('1440-cell');
  const link = await ev('location.href');
  await go(link, 1440, 900, false); await settle(2500);
  const st = JSON.parse(await ev('JSON.stringify({ cell: (document.querySelector("#ra-cellbox h3") || {}).innerText, tab: window.__atlas.state.tab, chart: window.__atlas.state.chart, block: window.__atlas.state.block })'));
  check(/22\.5° S/.test(st.cell) && st.tab === 'cell' && st.chart === 'qq' && st.block === 'monthly', 'a link reopens the same cell, tab, chart and block (' + JSON.stringify(st) + ')');
  await go(URL0, 390, 844, true);
  await ev('document.getElementById("ra-grip").dispatchEvent(new PointerEvent("pointerdown", { clientY: 600, bubbles: true })); document.getElementById("ra-grip").dispatchEvent(new PointerEvent("pointerup", { clientY: 600, bubbles: true }))'); await settle(900);
  const s1 = await ev('document.getElementById("ra-app").dataset.sheet');
  await ev('document.getElementById("ra-grip").dispatchEvent(new PointerEvent("pointerdown", { clientY: 600, bubbles: true })); document.getElementById("ra-grip").dispatchEvent(new PointerEvent("pointerup", { clientY: 300, bubbles: true }))'); await settle(900);
  const s2 = await ev('document.getElementById("ra-app").dataset.sheet');
  await ev('document.querySelector("#ra-claims .ra-claim").click()'); await settle(2000);
  const s3 = await ev('document.getElementById("ra-app").dataset.sheet');
  await ev('window.__atlas.select("15_62")'); await settle(1200);
  const s4 = await ev('document.getElementById("ra-app").dataset.sheet');
  check(s1 === 'half' && s2 === 'full' && s3 === 'peek' && s4 === 'half', '390: the sheet steps on a tap and a swipe, a claim lowers it, a cell raises it (' + [s1, s2, s3, s4].join(' → ') + ')');
  const p2 = await certify();
  check(/Identical to the ledger/.test(p2), '390: the Arabian Sea cell certified in the tab, identical to the ledger');
  await ev('window.__atlas.setSheet("full")'); await settle(900); await shot('390-cell');
  const g = await geom();
  check(g.sw === g.iw && g.sh === g.ih && !g.errs.length, '390 at the end: the document is still the window, ' + g.errs.length + ' page errors');
  console.log('drive-atlas: ' + (bad ? bad + ' FAILED' : 'every check passed') + ' · screenshots in ' + OUT);
}, { port: 9400 + (process.pid % 100), callTimeout: 60000 }).then(() => process.exit(bad ? 1 : 0)).catch((e) => { console.error('drive-atlas: ' + e.message); process.exit(1); });
