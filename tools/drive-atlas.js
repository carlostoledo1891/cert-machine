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
       cells, its certificate carrying the file's sha256 and never the data;
     · a fit someone printed, decided in the cell's tab by THE decision (playground/return-level-check/printed.js): the
       Campos cell found from a typed place, the certified monthly Weibull printed to four decimals REPRODUCED, its scale
       2% off OFF THE MAXIMUM, the digits kept out of the address; a printed design table's site opened from the method
       tab and a row decided in the tab as the ledger decided it; on the own site too; and the return-level check
       deciding a printed fit with the same module.
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
  /* a fit someone printed: typed for a place, decided against the nearest cell by printed.js in the tab's worker */
  const printedRun = async (f, blk, vals) => {
    const set = (id, v) => ev('(() => { const x = document.getElementById("' + id + '"); x.value = ' + JSON.stringify(v) + '; x.dispatchEvent(new Event("change")); })()');
    await set('ra-pr-f', f); await settle(200); await set('ra-pr-b', blk);
    const ks = await ev('Array.from(document.querySelectorAll(".ra-pr-ps input")).map((x) => x.id)');
    for (let i = 0; i < vals.length; i++) await set(ks[i], vals[i]);
    await ev('document.getElementById("ra-pr-go").click()');
    let o = ''; for (let i = 0; i < 120; i++) { await settle(700); o = await ev('(document.getElementById("ra-pr-out") || {}).innerText || ""'); if (o && !/^(certifying|fetching)/.test(o)) break; }
    return o;
  };
  await go(URL0, 1440, 900, false);
  await ev('window.__atlas.setTab("cell")'); await settle(400);
  await ev('(() => { const x = document.getElementById("ra-find"); x.value = "-22.4, -40.1"; x.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" })); })()'); await settle(2500);
  await ev('document.getElementById("ra-pr-open").click()'); await settle(300);
  const pr1 = await printedRun('weibull', 'monthly', ['5.6479', '3.6360']);
  check(/REPRODUCED/.test(pr1) && /15 km from 22\.4° S 40\.1° W/.test(pr1) && /the certificate the ledger records/.test(pr1), 'a printed fit typed for a place 15 km from the Campos node: the certified monthly Weibull printed to four decimals is REPRODUCED (' + pr1.split('\n').find((l) => /REPRODUCED/.test(l) || /^[A-Z ]{8,} —/.test(l)).slice(0, 50) + ')');
  const pr2 = await printedRun('weibull', 'monthly', ['5.6479', '3.7088']);
  check(/OFF THE MAXIMUM/.test(pr2) && /statistical/.test(pr2), 'its scale 2% off is OFF THE MAXIMUM, the decided family\'s statistical interval beside it');
  const pr3 = await printedRun('gev', 'annual', ['4.5', '0.4', '0.1']);
  check(/annual block is not one of the paper/.test(pr3) && /GEV/.test(pr3) && /(REPRODUCED|CONSISTENT|OFF THE MAXIMUM|NOT THE CERTIFIED FIT|OUTSIDE ITS SUPPORT|NOT DECIDED)/.test(pr3), 'a printed GEV of the annual maxima, certified here only, decided (' + ((pr3.match(/(REPRODUCED|CONSISTENT|OFF THE MAXIMUM|NOT THE CERTIFIED FIT|OUTSIDE ITS SUPPORT|NOT DECIDED)/) || ['—'])[0]) + ')');
  check(!/5\.6479|3\.7088|4\.5/.test(await ev('location.href')) && !(await ev('window.__errs.length')), 'the printed digits stay out of the address, no page error');
  await ev('document.getElementById("ra-pr-open").scrollIntoView()'); await settle(300); await shot('1440-printed');
  /* the printed design table: its site opened from the method tab's words, a row decided in the tab, the ledger's verdict beside */
  await ev('window.__atlas.setTab("method")'); await settle(400);
  await ev('Array.from(document.querySelectorAll("[data-cell]")).find((b) => /LA13/.test(b.innerText)).click()'); await settle(2500);
  const t13 = await ev('JSON.stringify({ cell: (document.querySelector("#ra-cellbox h3") || {}).innerText, tab: window.__atlas.state.tab, presets: document.querySelectorAll("[data-pr]").length })');
  await ev(`document.querySelector("[data-pr='13:0:gevML']").click()`);
  let p13 = ''; for (let i = 0; i < 60; i++) { await settle(700); p13 = await ev('(document.getElementById("ra-pr-out") || {}).innerText || ""'); if (p13 && !/^(certifying|fetching)/.test(p13)) break; }
  check(/22° S · 41° W/.test(t13) && /"tab":"cell"/.test(t13) && /OFF THE MAXIMUM/.test(p13) && /holds the same verdict for LA13/.test(p13) && /k = −ξ/.test(p13), 'a printed design table: LA13 Projeto Açu opened from the method tab, its GEV decided in the tab OFF THE MAXIMUM, the ledger\'s verdict the same (' + t13 + ')');
  await ev('document.getElementById("ra-pr-out").scrollIntoView()'); await settle(300); await shot('1440-printed-table');
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
    await ev('document.getElementById("ra-pr-open").click()'); await settle(300);
    const ps = await printedRun('lognormal', 'weekly', ['1.3', '0.2']);
    check(/Your site's/.test(ps) && /(REPRODUCED|CONSISTENT|OFF THE MAXIMUM|NOT THE CERTIFIED FIT|NOT DECIDED)/.test(ps), 'a printed fit decided on the own site\'s weekly maxima (' + ((ps.match(/(REPRODUCED|CONSISTENT|OFF THE MAXIMUM|NOT THE CERTIFIED FIT|NOT DECIDED)/) || ['—'])[0]) + ')');
  }
  /* the return-level check decides a printed fit with the same module: the Campos preset, monthly, the Weibull */
  {
    const CHECK = new URL('../return-level-check/', URL0).href;
    await go(CHECK, 1440, 900, false);
    await ev('document.getElementById("rc-preset").click()'); await settle(1500);
    await ev('(() => { const b = document.getElementById("rc-block"); b.value = "monthly"; b.dispatchEvent(new Event("change")); ["normal", "lognormal", "expweibull", "gengamma", "gumbel"].forEach((f) => { document.getElementById("rc-f-" + f).checked = false; }); document.getElementById("rc-run").click(); })()');
    let r = ''; for (let i = 0; i < 60; i++) { await settle(1000); r = await ev('document.getElementById("rc-progress").innerText'); if (/done|REFUSED/.test(r)) break; }
    const out = await ev(`(() => { const s = document.getElementById("rc-cf"); s.value = "weibull"; s.dispatchEvent(new Event("change"));
      document.getElementById("rc-p-k").value = "9"; document.getElementById("rc-p-lambda").value = "-1"; document.getElementById("rc-check").click(); return document.getElementById("rc-check-out").innerText; })()`);
    check(/done/.test(r) && /NOT A MEMBER OF THE FAMILY/.test(out) && /printed\.js/.test(await ev('document.body.innerText')), 'the return-level check decides a printed fit by the same module (a negative scale: NOT A MEMBER OF THE FAMILY), printed.js named in its code');
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
