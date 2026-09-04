#!/usr/bin/env node
/* shot.js — look at the page. A dev tool for /playground and nothing more.
   node playground/shot.js site/playground/index.html out.png [w] [h]

   Raw-socket CDP, the same client design/paper.js uses, because Node's
   WebSocket sends an Origin header the endpoint refuses. Real waits, not a
   virtual-time budget: a budget races the fonts and then lies about it.
   Device-metrics emulation rather than --window-size, because headless clamps
   windows to 500px and a narrow screenshot taken that way is fiction.
*/
'use strict';
const fs = require('fs'); const path = require('path'); const net = require('net');
const http = require('http'); const cp = require('child_process'); const crypto = require('crypto');
const os = require('os');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function frame(payload) {
  const data = Buffer.from(payload); const mask = crypto.randomBytes(4); let head;
  if (data.length < 126) head = Buffer.from([0x81, 0x80 | data.length]);
  else if (data.length < 65536) { head = Buffer.alloc(4); head[0] = 0x81; head[1] = 0xFE; head.writeUInt16BE(data.length, 2); }
  else { head = Buffer.alloc(10); head[0] = 0x81; head[1] = 0xFF; head.writeBigUInt64BE(BigInt(data.length), 2); }
  for (let j = 0; j < data.length; j++) data[j] ^= mask[j & 3];
  return Buffer.concat([head, mask, data]);
}
const getJson = (p, port) => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port, path: p }, r => { let b = ''; r.on('data', c => b += c); r.on('end', () => res(JSON.parse(b))); }).on('error', rej);
});

async function shot(file, out, w = 1440, h = 900, wait = 3000) {
  const port = 9331 + (process.pid % 200);
  const chrome = cp.spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + port, '--hide-scrollbars',
    '--force-device-scale-factor=2', '--user-data-dir=' + fs.mkdtempSync(path.join(os.tmpdir(), 'pg-shot-'))], { stdio: 'ignore' });
  try {
    for (let t = 0; t < 60; t++) { try { await getJson('/json', port); break; } catch (e) { await new Promise(r => setTimeout(r, 500)); } }
    const tg = (await getJson('/json', port)).find(x => x.type === 'page');
    const wsUrl = new URL(tg.webSocketDebuggerUrl);
    const sock = net.connect(port, '127.0.0.1');
    let buf = Buffer.alloc(0), handshaken = false, idc = 0; const pending = {};
    let onHs = null; const hs = new Promise(res => { onHs = res; });
    const send = (method, params) => new Promise(res => { const id = ++idc; pending[id] = res; sock.write(frame(JSON.stringify({ id, method, params: params || {} }))); });
    sock.on('data', c => {
      buf = Buffer.concat([buf, c]);
      if (!handshaken) { const i = buf.indexOf('\r\n\r\n'); if (i < 0) return; handshaken = true; buf = buf.slice(i + 4); onHs(); }
      for (;;) {
        if (buf.length < 2) return;
        let len = buf[1] & 0x7f, off = 2;
        if (len === 126) { if (buf.length < 4) return; len = buf.readUInt16BE(2); off = 4; }
        else if (len === 127) { if (buf.length < 10) return; len = Number(buf.readBigUInt64BE(2)); off = 10; }
        if (buf.length < off + len) return;
        const p = buf.slice(off, off + len).toString(); buf = buf.slice(off + len);
        try { const m = JSON.parse(p); if (m.id && pending[m.id]) { pending[m.id](m.result); delete pending[m.id]; } } catch (e) { /* event */ }
      }
    });
    await new Promise(res => sock.on('connect', () => {
      sock.write('GET ' + wsUrl.pathname + ' HTTP/1.1\r\nHost: 127.0.0.1:' + port + '\r\nUpgrade: websocket\r\n'
        + 'Connection: Upgrade\r\nSec-WebSocket-Key: ' + crypto.randomBytes(16).toString('base64')
        + '\r\nSec-WebSocket-Version: 13\r\n\r\n');
      res();
    }));
    await hs;
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: w < 700 });
    await send('Page.navigate', { url: 'file://' + path.resolve(file) });
    await new Promise(r => setTimeout(r, wait));
    const img = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(out, Buffer.from(img.data, 'base64'));
    sock.destroy();
  } finally { chrome.kill(); }
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
