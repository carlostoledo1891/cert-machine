/* og.js — /swell/'s link-preview card (site/swell/og.png, 1200 x 630): the app itself, as a reader meets it, so a
   link sent over WhatsApp or e-mail shows the island and the answer rather than the site's generic card.
   usage: node apps/swell/og.js        (after node apps/swell/build.js; takes the built page through a local server)
   apps/swell · cert-machine                                                                                  MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const ROOT = path.join(__dirname, '..', '..');
const SITE = path.join(ROOT, 'site');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.pmtiles': 'application/octet-stream' };

function serve() {
  return new Promise((res) => {
    const srv = http.createServer((req, rsp) => {
      let f = path.join(SITE, decodeURIComponent(req.url.split('?')[0]));
      if (!f.startsWith(SITE)) { rsp.writeHead(400); rsp.end(); return; }
      try { if (fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); } catch (e) { /* 404 below */ }
      fs.readFile(f, (err, b) => {
        if (err) { rsp.writeHead(404); rsp.end(); return; }
        const m = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || '');
        if (m) { const a = +m[1], z = m[2] ? Math.min(+m[2], b.length - 1) : b.length - 1; rsp.writeHead(206, { 'Content-Range': 'bytes ' + a + '-' + z + '/' + b.length, 'Content-Length': z - a + 1 }); rsp.end(b.subarray(a, z + 1)); return; }
        rsp.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); rsp.end(b);
      });
    }).listen(0, '127.0.0.1', () => res(srv));
  });
}

async function main() {
  const { withChrome, settle } = require(path.join(ROOT, 'design', 'cdp.js'));
  const srv = await serve();
  try {
    await withChrome(async (send) => {
      await send('Page.enable');
      await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
      await send('Page.navigate', { url: 'http://127.0.0.1:' + srv.address().port + '/swell/' });
      await settle(14000);
      const r = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(SITE, 'swell', 'og.png'), Buffer.from(r.data, 'base64'));
    });
  } finally { srv.close(); }
  console.log('site/swell/og.png written (1200 x 630)');
}
if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
