#!/usr/bin/env node
/* drive.js — the return-level check's design-height handle, driven in Chrome the way a reader meets it (D14, 2026-10-29;
   WARRANT's R26: "under a drag only CHOSEN and COMPUTED marks may move; a solid mark that moves when a choice changes
   was never DECIDED").
   playground/return-level-check/ · cert-machine

   Before a run: the handle is hollow and the panel says NEEDS DATA. Then the Campos preset is certified on the monthly
   block in the tab, and:
     · the ruler carries one solid tick per certified family, at its enclosure's upper end;
     · H typed, H dragged with the pointer across the ruler, H stepped from the keyboard: after every move the decided
       marks sit where they were to the hundredth of a pixel, the chosen line and the handle sit at H;
     · every family's word equals design.js's verdict at that H, and the decided family's word changes exactly at its
       flip: HOLDS at holdsFrom, not at holdsFrom − 1 cm;
     · the 1000-year wave redraws the ticks (a choice of T is a new ruler, not a drag) and the words follow;
     · the page scrolls no wider than the window at 1440 and at 390; screenshots of both.
   A red control: a decided tick moved by hand between two readings IS caught by the same comparison.

   usage: node playground/return-level-check/drive.js [url] [outdir]
          default url: the built page as a file (site/instruments/return-level-check/index.html)
   Prints "design-height drive: N pass, 0 fail, R/R red controls fired" and exits 1 on a failure.            MIT */
'use strict';
const fs = require('fs'), os = require('os'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { withChrome, settle } = require(path.join(ROOT, 'design', 'cdp.js'));
const URL0 = process.argv[2] || 'file://' + path.join(ROOT, 'site', 'instruments', 'return-level-check', 'index.html');
const OUT = process.argv[3] || path.join(os.tmpdir(), 'rlc-drive');
fs.mkdirSync(OUT, { recursive: true });

let pass = 0, fail = 0, reds = 0, redsFired = 0;
const ok = (cond, name) => { if (cond) pass++; else { fail++; console.error('FAIL ' + name); } };
const red = (fired, name) => { reds++; if (fired) { redsFired++; pass++; } else { fail++; console.error('RED DID NOT FIRE ' + name); } };

/* everything the page shows about the handle, read in one evaluation */
const READ = `(() => {
  const o = document.getElementById('rc-rsvg'), ob = o ? o.getBoundingClientRect() : { left: 0, top: 0 };
  const r = (el) => { const b = el.getBoundingClientRect(); return [b.left - ob.left, b.top - ob.top, b.width, b.height].map((v) => Math.round(v * 100) / 100); };
  const dec = [...document.querySelectorAll('#rc-ruler .w-decided')].map((e) => [e.getAttribute('x1'), e.getAttribute('y1'), e.getAttribute('x2'), e.getAttribute('y2'), r(e)]);
  const hl = document.getElementById('rc-hl'), hk = document.getElementById('rc-hk');
  const D = window.HS_DESIGN, words = [...document.querySelectorAll('#rc-ruler .rc-dw')].map((t) => t.textContent);
  return JSON.stringify({ dec, hl: hl ? [hl.getAttribute('x1'), hl.getAttribute('x2')] : null, hk: hk ? { cx: hk.getAttribute('cx'), now: +hk.getAttribute('aria-valuenow'), hollow: hk.classList.contains('hollow') } : null,
    words, dv: document.getElementById('rc-dv').textContent, h: document.getElementById('rc-h').value, sw: document.documentElement.scrollWidth, iw: window.innerWidth });
})()`;

(async () => {
  await withChrome(async (send) => {
    await send('Page.enable'); await send('Runtime.enable');
    const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + JSON.stringify(r.exceptionDetails.exception && r.exceptionDetails.exception.description)); return r.result.value; };
    const read = async () => JSON.parse(await ev(READ));
    const until = async (expr, ms, what) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr)) return true; await settle(250); } throw new Error('timed out waiting for ' + what); };
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: URL0 });
    await settle(1500);
    await ev('document.fonts.ready.then(() => 1)');

    /* before a run */
    let s = await read();
    ok(s.hk && s.hk.hollow && /NEEDS DATA/.test(s.dv) && s.dec.length === 0, 'before a run: a hollow handle, no tick, and NEEDS DATA');

    /* the Campos preset, certified on the monthly block in the tab */
    await ev("document.getElementById('rc-preset').click(), 1");
    await until("!document.getElementById('rc-run').disabled", 60000, 'the preset to load');
    await ev("(() => { const b = document.getElementById('rc-block'); b.value = 'monthly'; b.dispatchEvent(new Event('change')); document.getElementById('rc-run').click(); return 1; })()");
    await until("!!document.querySelector('#rc-verdict .word')", 300000, 'the run to finish');
    await settle(300);
    s = await read();
    ok(s.hk && !s.hk.hollow && s.dec.length >= 1 && s.words.length >= 1 && s.words.every((w) => /^(HOLDS|DOES NOT HOLD|UNDECIDED)$/.test(w)),
      'after the run: a filled handle, ' + s.dec.length + ' decided tick(s), a word on every certified row');
    const base = JSON.stringify(s.dec);
    const still = (t) => JSON.stringify(t.dec) === base;

    /* the decided family and its flip, read from the page's own run through design.js */
    const best = JSON.parse(await ev(`JSON.stringify((() => {
      const m = /holds from ([0-9.]+) m up and does not hold at ([0-9.]+) m/.exec(document.getElementById('rc-dv').textContent);
      return m ? { from: Math.round(Number(m[1]) * 100), to: Math.round(Number(m[2]) * 100) } : null; })())`));
    ok(!!best, 'the panel names the decided family\'s flips');
    const typeH = async (cm) => { await ev("(() => { const i = document.getElementById('rc-h'); i.value = '" + (Math.floor(cm / 100) + '.' + String(cm % 100).padStart(2, '0')) + "'; i.dispatchEvent(new Event('input')); return 1; })()"); await settle(80); return read(); };
    const wordOf = (t) => (/^(HOLDS|DOES NOT HOLD|UNDECIDED)/.exec(t.dv) || [])[1];
    if (best) {
      const at = await typeH(best.from), below = await typeH(best.from - 1), under = await typeH(best.to);
      ok(wordOf(at) === 'HOLDS' && wordOf(below) !== 'HOLDS' && wordOf(under) === 'DOES NOT HOLD',
        'typed: the decided family\'s word is HOLDS at ' + best.from + ' cm, not at ' + (best.from - 1) + ' cm, DOES NOT HOLD at ' + best.to + ' cm');
      ok([at, below, under].every(still), 'typed: no decided mark moved');
      ok([at, below, under].every((t) => t.hl[0] === t.hk.cx && t.hl[0] === t.hl[1]), 'typed: the chosen line and the handle sit together at H');
    }

    /* dragged with the pointer, across the ruler (scrolled into the window first: a pointer lands in the viewport) */
    await ev("(() => { const e = document.getElementById('rc-design'); window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 80); return 1; })()");
    await settle(200);
    const box = JSON.parse(await ev("JSON.stringify((() => { const b = document.getElementById('rc-rsvg').getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; })())"));
    const y = box[1] + 12;
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: box[0] + box[2] * 0.3, y, button: 'left', clickCount: 1 });
    const drags = [];
    for (const f of [0.35, 0.45, 0.55, 0.62, 0.7]) {
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box[0] + box[2] * f, y, button: 'left', buttons: 1 });
      await settle(60);
      drags.push(await read());
    }
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box[0] + box[2] * 0.7, y, button: 'left', clickCount: 1 });
    ok(new Set(drags.map((t) => t.hk.now)).size === drags.length, 'dragged: H moved at every step (' + drags.map((t) => t.hk.now).join(' → ') + ' cm)');
    ok(drags.every(still), 'dragged: no decided mark moved, at any of ' + drags.length + ' steps');
    const rowsAgree = async () => JSON.parse(await ev(`JSON.stringify((() => { const cm = +document.getElementById('rc-hk').getAttribute('aria-valuenow'), flips = {};
      document.querySelectorAll('#rc-ruler [data-flip]').forEach((t) => { flips[t.dataset.row] = +t.dataset.flip; });
      return [...document.querySelectorAll('#rc-ruler .rc-dw')].map((t) => ({ w: t.textContent, holds: cm >= flips[t.dataset.row] })); })())`));
    const ra = await rowsAgree();
    ok(ra.length === s.words.length && ra.every((r) => (r.w === 'HOLDS') === r.holds), 'dragged: every row reads HOLDS exactly when H is at or past its printed flip');

    /* stepped from the keyboard */
    const k0 = (await read()).hk.now;
    await ev("document.getElementById('rc-hk').focus(), 1");
    for (let i = 0; i < 3; i++) { await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 }); }
    const k1 = await read();
    ok(k1.hk.now === k0 + 3 && still(k1), 'keyboard: three ArrowRight steps move H by 3 cm and no decided mark');

    const rk = await rowsAgree();
    ok(rk.every((r) => (r.w === 'HOLDS') === r.holds), 'keyboard: every row still reads HOLDS exactly at or past its flip');

    /* T = 1000: a new ruler (a choice of T redraws the decided ticks), the words follow */
    await ev("(() => { const t = document.getElementById('rc-dT'); t.value = '1000'; t.dispatchEvent(new Event('change')); return 1; })()");
    await settle(150);
    const t1000 = await read();
    ok(!still(t1000) && t1000.dec.length === s.dec.length && /1000-year/.test(t1000.dv), 'the 1000-year wave: the ruler redrawn with its own ticks, the claim names it');

    /* the red control: a decided tick moved by hand is caught by the same comparison */
    await ev("(() => { const t = document.getElementById('rc-dT'); t.value = '100'; t.dispatchEvent(new Event('change')); return 1; })()");
    await settle(150);
    const back = await read();
    ok(still(back), 'back at the 100-year wave: the ticks are where they were');
    await ev("(() => { const e = document.querySelector('#rc-ruler .w-decided'); e.setAttribute('x1', String(+e.getAttribute('x1') + 3)); e.setAttribute('x2', String(+e.getAttribute('x2') + 3)); return 1; })()");
    red(!still(await read()), 'a decided tick moved by hand IS caught by the comparison every move above passed');

    /* the page at 1440 and 390, and the screenshots */
    await ev("(() => { const t = document.getElementById('rc-dT'); t.dispatchEvent(new Event('change')); return 1; })()");
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: w < 500 ? 2 : 1, mobile: w < 500 });
      await settle(600);
      if (best) await typeH(best.from);
      const t = await read();
      ok(t.sw <= t.iw, 'at ' + w + ': the page scrolls no wider than the window (' + t.sw + ' ≤ ' + t.iw + ')');
      await ev("(() => { const e = document.getElementById('rc-design'); window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 80); return 1; })()");
      await settle(300);
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(OUT, 'design-' + w + '.png'), Buffer.from(shot.data, 'base64'));
    }
  }, { port: 9247 });
  console.log('design-height drive: ' + pass + ' pass, ' + fail + ' fail, ' + redsFired + '/' + reds + ' red controls fired   (screenshots in ' + OUT + ')');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('DRIVE REFUSED: ' + e.message); process.exit(1); });
