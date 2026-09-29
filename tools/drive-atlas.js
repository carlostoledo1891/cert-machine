#!/usr/bin/env node
/* drive-atlas.js — the return-level atlas driven in Chrome the way a reader meets it, and its facts printed:
     · the document exactly the window at 1440×900, 1280×720, 768×1024 and 390×844 (scrollWidth = innerWidth,
       scrollHeight = innerHeight), no page error;
     · the paper's ten claims decided again in the tab and equal to the build's;
     · a reader's own claim, typed, reproducing the paper's DOES NOT HOLD south of South America;
     · a cell certified in the tab and IDENTICAL to the ledger's record, at 1440 and at 390;
     · a report node showing the report's 3-hourly block first, and an ice report node its note and that block;
     · the seventh family's two views and the uncertainty view drawn with a key and no page error; the cell's
       table carrying the choice among seven, the GEV's ξ and the statistical interval; after certifying, the
       design-life sentence carrying its statistical interval and the return-level plot its band;
     · the phone's sheet stepping on a tap and a swipe, a claim lowering it, a cell raising it;
     · a link reopening the same cell, tab, chart and block;
     · a reader's own site (SITE_FILE, a record of Hs) read by THE parse rule, certified in the tab, pinned beside the nearest
       cells, its certificate carrying the file's sha256 and never the data.
   Screenshots go to <tmp>/atlas-drive/. Written 2026-09-28 from the twenty-second session's own drives.
   usage: node tools/dev-serve.js &   then   node tools/drive-atlas.js [url]
          (default http://127.0.0.1:8765/instruments/return-level-atlas/; the live page works too) */
'use strict';
const fs = require('fs'), os = require('os'), path = require('path');
const { withChrome, settle } = require(path.join(__dirname, '..', 'design', 'cdp.js'));
const URL0 = process.argv[2] || 'http://127.0.0.1:8765/instruments/return-level-atlas/';

const OUT = path.join(os.tmpdir(), 'atlas-drive'); fs.mkdirSync(OUT, { recursive: true });
/* a record of Hs for the own-site check: SITE_FILE, or ten years of the hindcast's Santos node written from corpus/ww3-points */
const SITE_FILE = process.env.SITE_FILE || (() => {
  const dir = path.join(__dirname, '..', 'corpus', 'ww3-points', 'months');
  if (!fs.existsSync(dir)) return null;
  const L = ['time,hs_m'];
  for (const f of fs.readdirSync(dir).filter((q) => /^20(1\d)\d{2}\.json$/.test(q)).sort()) { const r = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); for (let i = 0; i < r.steps; i++) L.push(r.times[i] + ':00Z,' + (r.points.santos[i] / 500).toFixed(3)); }
  const f = path.join(OUT, 'site-santos-2010-2019.csv'); fs.writeFileSync(f, L.join('\n') + '\n'); return f;
})();
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
  const n3 = JSON.parse(await ev('JSON.stringify((() => { const t = document.querySelector("#ra-cellbox table"); const a = t && t.querySelector("thead a"); return { head: t ? Array.from(t.querySelectorAll("thead th")).map((h) => h.innerText) : [], href: a ? a.getAttribute("href") : null, ad: t ? Array.from(t.querySelectorAll("tbody tr")[0].querySelectorAll("td")).map((d) => d.innerText) : [] }; })())'));
  check(n3.head.join('|') === '|3-hourly|daily|weekly|monthly' && n3.href === '/reports/return-levels.html' && n3.ad[0] === 'lognormal', 'a report node shows the report\'s 3-hourly block first, linked to the report (Campos: A² picks ' + n3.ad[0] + ')');
  await ev('window.__atlas.select("-57_-65")'); await settle(1200);
  const ice = await ev('document.getElementById("ra-cellbox").innerText');
  check(/shown and not certified/.test(ice) && /3-HOURLY BLOCK|3-hourly block/i.test(ice) && /ice\'s millimetres included/.test(ice), 'an ice report node (Drake) shows its ice note and the report\'s 3-hourly block');
  for (const [mode, re] of [['seven', /among seven/i], ['xi', /ξ/], ['unc', /statistical/i]]) {
    await ev('document.querySelector("#ra-mode button[data-v=\\"' + mode + '\\"]").click()'); await settle(900);
    const key = await ev('document.getElementById("ra-legend").innerText'), g = await geom();
    check(re.test(key) && !g.errs.length, 'the ' + mode + ' view draws with its key (' + key.split('\n')[0].slice(0, 70) + ')');
  }
  await ev('document.querySelector("#ra-mode button[data-v=\\"wave\\"]").click()'); await settle(500);
  await ev('window.__atlas.select("-22.5_-40")'); await settle(1500);
  const rows7 = await ev('Array.from(document.querySelectorAll("#ra-cellbox tbody th")).map((t) => t.innerText).join("|")');
  check(/among 7/.test(rows7) && /GEV ξ/.test(rows7) && /100-yr 95%/.test(rows7) && (await ev('document.querySelectorAll("#ra-cellbox .w-computed").length')) > 0, 'the cell\'s table carries the choice among seven, the GEV\'s ξ and the statistical interval, dash-underlined');
  const p1 = await certify();
  check(/Identical to the ledger/.test(p1), '1440: the Campos cell certified in the tab, identical to the ledger (' + p1.slice(0, 60) + ')');
  const life = await ev('document.getElementById("ra-life").innerText');
  check(/statistical/.test(life) && /asserted, not decided/.test(life), 'the design-life sentence carries its statistical interval, labelled (' + life.slice(0, 50) + '…)');
  await ev('document.querySelector("#ra-cviews button[data-v=\\"rl\\"]").click()'); await settle(600);
  check(/Dashed/.test(await ev('document.getElementById("ra-cap").innerText')), 'the return-level plot draws the decided family\'s statistical band, and its caption says what it is');
  await shot('1440-rl-band');
  await ev('document.querySelector("#ra-cviews button[data-v=\\"qq\\"]").click()'); await settle(500);
  await ev('document.querySelector("#ra-block button[data-v=\\"monthly\\"]").click()'); await settle(900);
  await shot('1440-cell');
  const link = await ev('location.href');
  await go(link, 1440, 900, false); await settle(2500);
  const st = JSON.parse(await ev('JSON.stringify({ cell: (document.querySelector("#ra-cellbox h3") || {}).innerText, tab: window.__atlas.state.tab, chart: window.__atlas.state.chart, block: window.__atlas.state.block })'));
  check(/22\.5° S/.test(st.cell) && st.tab === 'cell' && st.chart === 'qq' && st.block === 'monthly', 'a link reopens the same cell, tab, chart and block (' + JSON.stringify(st) + ')');
  if (SITE_FILE) {
    await go(URL0, 1440, 900, false);
    await ev('window.__atlas.setTab("cell")'); await settle(500);
    await ev('document.getElementById("ra-site-open").click()'); await settle(300);
    const doc = await send('DOM.getDocument', { depth: -1 }), q = await send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '#ra-site-file' });
    await send('DOM.setFileInputFiles', { nodeId: q.nodeId, files: [SITE_FILE] }); await settle(2500);
    await ev('(() => { const x = document.getElementById("ra-site-at"); x.value = "-25.5, -43"; x.dispatchEvent(new Event("input")); })()'); await settle(300);
    const msg = await ev('document.getElementById("ra-site-msg").innerText');
    check(/values in field 1/.test(msg) && !(await ev('document.getElementById("ra-site-go").disabled')), 'a reader\'s record read by THE parse rule (' + msg.slice(0, 70) + '…)');
    await ev('document.getElementById("ra-site-go").click()'); await settle(1500);
    await ev('document.getElementById("ra-cert").click()');
    let p = ''; for (let i = 0; i < 150; i++) { await settle(1000); p = await ev('(document.getElementById("ra-prog") || {}).innerText || ""'); if (/certified here|REFUSED|failed/.test(p)) break; }
    const near = await ev('(document.getElementById("ra-cellbox") || {}).innerText || ""');
    check(/certified here/.test(p) && /sha256/.test(p) && /the nearest cells of the atlas/i.test(near) && /your site/.test(near), 'the own site certified in the tab and read against the nearest cells (' + p.slice(0, 60) + ')');
    await shot('1440-site');
  }
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
