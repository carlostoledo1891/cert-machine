#!/usr/bin/env node
/* dev-serve.js — the built site on localhost, the way its pages expect it: site/ at /, and corpus/ww3-grid/ at
   /corpus/ww3-grid/ — one origin, so a development build of the return-level atlas whose cell files are served from
   here needs no CORS. DEV_SITE=<dir> serves /instruments/return-level-atlas/ from a development build instead
   (ATLAS_DEV=1 ATLAS_DEV_SERVED=http://127.0.0.1:<port>/corpus/ww3-grid/ with build() pointed at <dir>/instruments;
   the builder refuses to write a development build into site/). The layout ruler loads pages as file://, where a
   page's own data never arrive; this is for driving pages the way a reader meets them.
   usage: node tools/dev-serve.js [port]        (default 8765) */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), port = Number(process.argv[2] || 8765), DEV = process.env.DEV_SITE || '';
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.i16': 'application/octet-stream', '.pdf': 'application/pdf', '.pmtiles': 'application/octet-stream' };
http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  if (u.includes('..')) { res.writeHead(400); res.end(); return; }
  let f = u.startsWith('/corpus/ww3-grid/') ? path.join(ROOT, u) : DEV && u.startsWith('/instruments/return-level-atlas/') ? path.join(DEV, u) : path.join(ROOT, 'site', u);
  try { if (fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); } catch (e) { /* a 404 below */ }
  fs.readFile(f, (err, b) => {
    if (err) { res.writeHead(404); res.end('404'); return; }
    const type = TYPES[path.extname(f)] || 'application/octet-stream';
    /* byte ranges: a .pmtiles basemap is read by Range requests (Swell's island tiles); a server without them
       returns the whole 9 MB file to every tile request, or the protocol refuses it */
    const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (m && (m[1] || m[2])) {
      const a = m[1] ? Number(m[1]) : Math.max(0, b.length - Number(m[2])), z = m[1] && m[2] ? Math.min(Number(m[2]), b.length - 1) : b.length - 1;
      if (a > z || a >= b.length) { res.writeHead(416, { 'Content-Range': 'bytes */' + b.length }); res.end(); return; }
      res.writeHead(206, { 'Content-Type': type, 'Content-Length': z - a + 1, 'Content-Range': 'bytes ' + a + '-' + z + '/' + b.length, 'Accept-Ranges': 'bytes' });
      res.end(b.subarray(a, z + 1)); return;
    }
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': b.length, 'Accept-Ranges': 'bytes' });
    res.end(b);
  });
}).listen(port, '127.0.0.1', () => console.log('dev-serve: site/ on http://127.0.0.1:' + port + '/' + (DEV ? ' (the atlas from ' + DEV + ')' : '')));
