#!/usr/bin/env node
/* shot.js — look at the page. A dev tool for /instruments and nothing more.
   node playground/shot.js site/instruments/index.html out.png [w] [h]

   Raw-socket CDP through design/cdp.js, because Node's WebSocket sends an
   Origin header the endpoint refuses. Real waits, not a virtual-time budget: a
   budget races the fonts and then lies about it. Device-metrics emulation
   rather than --window-size, because headless clamps windows to 500px and a
   narrow screenshot taken that way is fiction.

   (The transport was written out in full here, in design/paper.js and in
   tools/build-og.js — three identical copies. It is one module now.)
*/
'use strict';
const fs = require('fs');
const path = require('path');
const { withChrome, settle } = require(path.resolve(__dirname, '..', 'design', 'cdp.js'));

async function shot(file, out, w = 1440, h = 900, wait = 3000) {
  await withChrome(async (send) => {
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: w < 700 });
    await send('Page.navigate', { url: 'file://' + path.resolve(file) });
    await settle(wait);
    const img = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    if (!img || !img.data) throw new Error('captureScreenshot returned nothing');
    fs.writeFileSync(out, Buffer.from(img.data, 'base64'));
  }, { port: 9331 + (process.pid % 200), args: ['--force-device-scale-factor=2'] });
  return out;
}

if (require.main === module) {
  const [file, out, w, h, wait] = process.argv.slice(2);
  if (!file || !out) { console.error('usage: node playground/shot.js <html> <out.png> [w] [h] [waitms]'); process.exit(1); }
  shot(file, out, Number(w) || 1440, Number(h) || 900, Number(wait) || 3000)
    .then(o => console.log('wrote ' + o + '  ' + (fs.statSync(o).size / 1024).toFixed(0) + ' KB'))
    .catch(e => { console.error('shot failed: ' + e.message); process.exit(1); });
}
module.exports = { shot };
