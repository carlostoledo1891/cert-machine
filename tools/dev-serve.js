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
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.i16': 'application/octet-stream', '.pdf': 'application/pdf' };
http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  if (u.includes('..')) { res.writeHead(400); res.end(); return; }
  let f = u.startsWith('/corpus/ww3-grid/') ? path.join(ROOT, u) : DEV && u.startsWith('/instruments/return-level-atlas/') ? path.join(DEV, u) : path.join(ROOT, 'site', u);
  try { if (fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); } catch (e) { /* a 404 below */ }
  fs.readFile(f, (err, b) => {
    if (err) { res.writeHead(404); res.end('404'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Content-Length': b.length });
    res.end(b);
  });
}).listen(port, '127.0.0.1', () => console.log('dev-serve: site/ on http://127.0.0.1:' + port + '/' + (DEV ? ' (the atlas from ' + DEV + ')' : '')));
