#!/usr/bin/env node
/* drive-grammar-eps.js — the ε handle under /grammar/'s hero, driven in Chrome the way a reader meets it (the operator's
   ruling of 2026-10-30; D14's handle grammar and its gate, playground/return-level-check/drive.js, applied to the hero).
   tools/ · cert-machine

     · with scripts off, the handle's block is hidden and the hero is the static figure;
     · with scripts on, at ε = 0 the hero is that same figure byte for byte (the two DOMs serialised and compared);
     · ε dragged with the pointer, stepped from the keyboard and typed: after every move no decided mark of the hero or
       of the ruler has moved by a hundredth of a pixel, the chosen line and the knob sit at ε, and the word, the ×'s
       place and its three lines are tools/grammar-hero.js's decide() at that ε;
     · the word changes exactly at the printed flip: HOLDS at it, REFUTED one step below; at every step of the ruler;
     · back at ε = 0 the hero is the static figure again, byte for byte;
     · no sideways scroll at 1440 or at 390, and screenshots at two values of ε at each width.
   A red control: a decided mark of the hero moved by hand between two readings IS caught by the same comparison.

   usage: node tools/drive-grammar-eps.js [url] [outdir]
          default url: the built page as a file (site/grammar/index.html)
   Prints "grammar ε drive: N pass, 0 fail, R/R red controls fired" and exits 1 on a failure.                     MIT */
'use strict';
const fs = require('fs'), os = require('os'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { withChrome, settle } = require(path.join(ROOT, 'design', 'cdp.js'));
const HERO = require(path.join(__dirname, 'grammar-hero.js'));
const URL0 = process.argv[2] || 'file://' + path.join(ROOT, 'site', 'grammar', 'index.html');
const OUT = process.argv[3] || path.join(os.tmpdir(), 'grammar-eps-drive');
fs.mkdirSync(OUT, { recursive: true });

let pass = 0, fail = 0, reds = 0, redsFired = 0;
const ok = (cond, name) => { if (cond) pass++; else { fail++; console.error('FAIL ' + name); } };
const red = (fired, name) => { reds++; if (fired) { redsFired++; pass++; } else { fail++; console.error('RED DID NOT FIRE ' + name); } };

/* everything the page shows about the handle, read in one evaluation */
const READ = `(() => {
  const vis = (e) => e && e.getBoundingClientRect().width > 0;
  const r = (e) => { const b = e.getBoundingClientRect(); return [b.left + scrollX, b.top + scrollY, b.width, b.height].map((v) => Math.round(v * 100) / 100); };
  const at = (e) => ['d', 'cx', 'cy', 'r', 'x1', 'y1', 'x2', 'y2', 'points', 'transform'].map((a) => e.getAttribute(a));
  const hero = document.querySelector('[data-hero] .figbox');
  /* every decided mark: the hero's (solid enclosure, knots) and the ruler's flip tick */
  const dec = [...document.querySelectorAll('[data-hero] .w-decided, #gx-eps-r .w-decided')].map((e) => [at(e), vis(e) ? r(e) : null]);
  const panes = [...document.querySelectorAll('[data-hero] .gx-wx')].map((g) => ({ shown: vis(g.closest('svg')), display: g.getAttribute('display'),
    transform: g.querySelector('path.w-wx').getAttribute('transform'), lead: [g.querySelector('line').getAttribute('x1'), g.querySelector('line').getAttribute('y1')],
    words: [...g.querySelectorAll('text')].map((t) => t.textContent) }));
  const kn = [...document.querySelectorAll('#gx-eps-r .gx-knob')].map((k) => ({ cx: k.getAttribute('cx'), now: +k.getAttribute('aria-valuenow'), text: k.getAttribute('aria-valuetext'), shown: vis(k) }));
  const hl = [...document.querySelectorAll('#gx-eps-r .gx-eps-hl')].map((l) => [l.getAttribute('x1'), l.getAttribute('x2')]);
  const box = document.getElementById('gx-eps');
  return JSON.stringify({ hero: hero.innerHTML, dec, panes, kn, hl, bands: document.querySelectorAll('[data-hero] [data-eps="band"]').length,
    dv: (document.getElementById('gx-eps-dv') || {}).textContent || '', input: (document.getElementById('gx-eps-in') || {}).value,
    hidden: !box || box.hidden || !vis(box), sw: document.documentElement.scrollWidth, iw: window.innerWidth });
})()`;

(async () => {
  await withChrome(async (send) => {
    await send('Page.enable'); await send('Runtime.enable');
    const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + JSON.stringify(r.exceptionDetails.exception && r.exceptionDetails.exception.description)); return r.result.value; };
    const read = async () => JSON.parse(await ev(READ));
    const load = async (w, h, scripts) => {
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: w < 500 ? 2 : 1, mobile: w < 500 });
      await send('Emulation.setScriptExecutionDisabled', { value: !scripts });
      await send('Page.navigate', { url: URL0 });
      await settle(1500);
      await ev('document.fonts.ready.then(() => 1)');
      await settle(200);
    };
    const wordOf = (t) => (/^(HOLDS|REFUTED)/.exec(t.dv.trim()) || [])[1];
    /* the page agrees with decide(k): the word, the knob, the line, the ×'s place and its words, in every drawing */
    const agrees = (t, k) => {
      const d = HERO.decide(k), shown = t.kn.filter((x) => x.shown);
      const knobs = t.kn.every((x) => x.now === k) && shown.length === 1 && t.hl.every((l, i) => l[0] === t.kn[i].cx && l[1] === t.kn[i].cx);
      const wx = t.panes.every((p) => (d.verdict === 'HOLDS' ? p.display === 'none'
        : p.display === null && JSON.stringify(p.words) === JSON.stringify(d.lines) && (HERO.feq(d.x, HERO.WX) ? p.transform === null : /^translate\(/.test(p.transform || ''))));
      return wordOf(t) === d.verdict && knobs && wx && t.bands === (k === 0 ? 0 : t.panes.length);
    };

    for (const [W, Hh] of [[1440, 900], [390, 844]]) {
      /* scripts off: the hero as built, and no handle */
      await load(W, Hh, false);
      const off = await read();
      ok(off.hidden, W + ': with scripts off the handle is hidden');
      /* scripts on: the same hero, byte for byte, at ε = 0 */
      await load(W, Hh, true);
      const s0 = await read();
      ok(!s0.hidden && s0.hero === off.hero, W + ': with scripts on, at ε = 0 the hero is the static figure byte for byte');
      ok(agrees(s0, 0), W + ': at ε = 0 the word, the knob and the × are decide(0)\'s');
      const base = JSON.stringify(s0.dec);
      const still = (t) => JSON.stringify(t.dec) === base;
      ok(s0.dec.filter((x) => x[1]).length >= 5, W + ': the decided marks are read (' + s0.dec.filter((x) => x[1]).length + ' showing)');

      /* dragged with the pointer: to two values of ε, a screenshot at each */
      /* the ruler scrolled into the window (a pointer lands in the viewport) */
      await ev("(() => { const e = document.getElementById('gx-eps-r'); window.scrollTo(0, e.getBoundingClientRect().top + scrollY - innerHeight / 2); return 1; })()");
      await settle(250);
      const R = JSON.parse(await ev(`JSON.stringify((() => { const s = [...document.querySelectorAll('#gx-eps-r svg')].find((e) => e.getBoundingClientRect().width > 0), b = s.getBoundingClientRect(), vb = s.viewBox.baseVal;
        const cfg = JSON.parse(document.getElementById('gx-eps-cfg').textContent).rulers[s.classList.contains('gx-eps-w') ? 'w' : 'n'];
        return { left: b.left, top: b.top, width: b.width, height: b.height, vbw: vb.width, L: cfg.L, R: cfg.R }; })())`));
      const xOf = (k) => R.left + (R.L + k / HERO.KMAX * (R.vbw - R.L - R.R)) * (R.width / R.vbw);
      const y = R.top + R.height / 2;
      const drag = async (from, to) => {
        await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: xOf(from), y, button: 'left', clickCount: 1 });
        const seen = [];
        for (let i = 1; i <= 4; i++) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: xOf(from + (to - from) * i / 4), y, button: 'left', buttons: 1 }); await settle(60); seen.push(await read()); }
        await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: xOf(to), y, button: 'left', clickCount: 1 });
        await settle(80);
        return seen;
      };
      /* a screenshot of the hero and its handle: the window made tall enough to hold both under the fixed nav, then put back */
      const shot = async (name) => {
        const sy = await ev('scrollY');
        const g = JSON.parse(await ev(`JSON.stringify((() => { const a = document.querySelector('[data-hero] .figbox').getBoundingClientRect(), b = document.getElementById('gx-eps').getBoundingClientRect(); return { top: a.top + scrollY, h: b.bottom - a.top }; })())`));
        await send('Emulation.setDeviceMetricsOverride', { width: W, height: Math.max(Hh, Math.ceil(g.h) + 120), deviceScaleFactor: W < 500 ? 2 : 1, mobile: W < 500 });
        await ev('window.scrollTo(0, ' + (g.top - 90) + '), 1'); await settle(300);
        const top = await ev(`document.querySelector('[data-hero] .figbox').getBoundingClientRect().top`);
        const p = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: top - 12 + (await ev('scrollY')), width: W, height: Math.ceil(g.h) + 24, scale: 1 } });
        fs.writeFileSync(path.join(OUT, name), Buffer.from(p.data, 'base64'));
        await send('Emulation.setDeviceMetricsOverride', { width: W, height: Hh, deviceScaleFactor: W < 500 ? 2 : 1, mobile: W < 500 });
        await ev('window.scrollTo(0, ' + sy + '), 1'); await settle(300);
      };
      const K1 = HERO.KFLIP / 2, K2 = HERO.KFLIP + HERO.KFLIP / 2;
      const d1 = await drag(0, K1), t1 = await read();
      ok(t1.kn[0].now === K1 && agrees(t1, K1), W + ': dragged to ε = ' + HERO.fstr(HERO.eps(K1)) + ': ' + wordOf(t1) + ', and the page is decide()\'s');
      ok(d1.concat([t1]).every(still), W + ': dragged: no decided mark moved, at any of ' + (d1.length + 1) + ' readings');
      await shot('eps-' + W + '-k' + K1 + '.png');
      const d2 = await drag(K1, K2), t2 = await read();
      ok(t2.kn[0].now === K2 && agrees(t2, K2), W + ': dragged to ε = ' + HERO.fstr(HERO.eps(K2)) + ': ' + wordOf(t2) + ', the × gone');
      ok(d2.concat([t2]).every(still), W + ': dragged on: no decided mark moved');
      await shot('eps-' + W + '-k' + K2 + '.png');

      /* stepped from the keyboard, across the whole ruler: the word flips exactly at the printed flip */
      await ev("document.querySelector('#gx-eps-r svg:not([style*=none]) .gx-knob') && [...document.querySelectorAll('#gx-eps-r .gx-knob')].find((k) => k.getBoundingClientRect().width > 0).focus(), 1");
      const key = async (k, code) => { await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: k, code: k, windowsVirtualKeyCode: code }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code: k, windowsVirtualKeyCode: code }); };
      await key('Home', 36);
      const h0 = await read();
      ok(h0.hero === off.hero && agrees(h0, 0), W + ': Home: back at ε = 0 the hero is the static figure byte for byte');
      const flipPrinted = /holds from (\d+)\/(\d+)/.exec(await ev("document.querySelector('#gx-eps-r text.t-note').textContent"));
      const kFlipPrinted = flipPrinted ? Number(flipPrinted[1]) * Number(HERO.Q) / Number(flipPrinted[2]) : -1;
      let stepsOk = true, stillOk = true;
      for (let k = 1; k <= HERO.KMAX; k++) {
        await key('ArrowRight', 39);
        const t = await read();
        if (!(agrees(t, k) && (wordOf(t) === 'HOLDS') === (k >= kFlipPrinted))) { stepsOk = false; console.error('  at k = ' + k + ': ' + t.dv); }
        if (!still(t)) stillOk = false;
      }
      ok(stepsOk && kFlipPrinted === HERO.KFLIP, W + ': ArrowRight across all ' + HERO.KMAX + ' steps: every step is decide()\'s, and HOLDS exactly from the printed flip ' + (flipPrinted ? flipPrinted[1] + '/' + flipPrinted[2] : '?'));
      ok(stillOk, W + ': keyboard: no decided mark moved');

      /* typed: at the flip HOLDS, one step below REFUTED; a value off the ruler's steps is not taken */
      const type = async (v) => { await ev("(() => { const i = document.getElementById('gx-eps-in'); i.value = '" + v + "'; i.dispatchEvent(new Event('input')); return 1; })()"); await settle(60); return read(); };
      const at = await type(HERO.fstr(HERO.FLIP)), below = await type(HERO.fstr(HERO.eps(HERO.KFLIP - 1))), odd = await type('1/3');
      ok(agrees(at, HERO.KFLIP) && wordOf(at) === 'HOLDS' && agrees(below, HERO.KFLIP - 1) && wordOf(below) === 'REFUTED' && odd.kn[0].now === HERO.KFLIP - 1,
        W + ': typed: HOLDS at ' + HERO.fstr(HERO.FLIP) + ', REFUTED at ' + HERO.fstr(HERO.eps(HERO.KFLIP - 1)) + ', 1/3 not taken');
      ok([at, below, odd].every(still), W + ': typed: no decided mark moved');

      const t = await read();
      ok(t.sw <= t.iw, W + ': the page scrolls no wider than the window (' + t.sw + ' ≤ ' + t.iw + ')');

      /* the red control: a decided mark moved by hand is caught by the comparison every move above passed */
      if (W === 1440) {
        await ev("(() => { const e = document.querySelector('[data-hero] .hv-w path.w-decided, [data-hero] .hv-w .w-decided'); e.setAttribute('transform', 'translate(0,0.5)'); return 1; })()");
        red(!still(await read()), 'a decided mark of the hero moved by hand IS caught');
      }
    }
  }, { port: 9248 });
  console.log('grammar ε drive: ' + pass + ' pass, ' + fail + ' fail, ' + redsFired + '/' + reds + ' red controls fired   (screenshots in ' + OUT + ')');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('DRIVE REFUSED: ' + e.message); process.exit(1); });
