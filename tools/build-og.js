#!/usr/bin/env node
/* build-og.js — the one OG card: a real dark-mode screenshot of the landing,
   1200x630, written to design/assets/og.png (make site serves it at /og.png).

   Captured the house way: raw-socket CDP (design/cdp.js — Node's global
   WebSocket sends an Origin header the CDP endpoint refuses), REAL waits
   (virtual-time budgets race cold font CDNs and lie), and
   Emulation.setDeviceMetricsOverride because headless Chrome clamps bare
   windows. Rendered at 2x and downscaled by sips for crisp type.

   The transport used to live here in full; it lived in design/paper.js and
   playground/shot.js in full as well, byte for byte. It is one module now.

   usage: node tools/build-og.js [--url https://carlostoledo.co/]
   default source is the LOCAL build (site/index.html) so the card always
   matches what the next push ships. */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'design', 'assets', 'og.png');
const { withChrome, settle } = require(path.join(ROOT, 'design', 'cdp.js'));
const SRC = process.argv.includes('--url')
  ? process.argv[process.argv.indexOf('--url') + 1]
  : 'file://' + path.join(ROOT, 'site', 'index.html');

async function main() {
  await withChrome(async (send) => {
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 2, mobile: false });
    await send('Page.navigate', { url: SRC });
    await settle(5000);                                            /* real wait: fonts + entry animation */
    /* the 630px crop lands mid-paragraph; fade the last lines into the page
       ground so the card reads as composed, not truncated */
    await send('Runtime.evaluate', { expression:
      `(() => { const ov = document.createElement('div');
        ov.style.cssText = 'position:fixed;left:0;right:0;bottom:0;height:150px;z-index:9999;pointer-events:none;'
          + 'background:linear-gradient(to bottom, rgba(10,10,12,0) 0%, #0a0a0c 82%)';
        document.body.appendChild(ov); })()` });
    await settle(300);
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    if (!shot || !shot.data) throw new Error('captureScreenshot returned nothing');
    fs.writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
  }, { port: 9226 });

  cp.execFileSync('/usr/bin/sips', ['-z', '630', '1200', OUT], { stdio: 'ignore' });  /* 2x -> declared 1200x630 */
  const px = cp.execFileSync('/usr/bin/sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', OUT]).toString();
  if (!/pixelWidth: 1200/.test(px) || !/pixelHeight: 630/.test(px)) throw new Error('og.png is not 1200x630:\n' + px);
  console.log('wrote ' + path.relative(ROOT, OUT) + ' (' + (fs.statSync(OUT).size / 1024).toFixed(0) + ' KB, 1200x630, from ' + SRC + ')');
}
main().catch(e => { console.error('OG REFUSED: ' + e.message); process.exit(1); });
