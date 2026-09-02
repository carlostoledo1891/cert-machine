#!/usr/bin/env node
/* build-og.js — the one OG card: a real dark-mode screenshot of the landing,
   1200x630, written to design/assets/og.png (make site serves it at /og.png).

   Captured the house way: raw-socket CDP (design/paper.js's client — Node's
   global WebSocket sends an Origin header the CDP endpoint refuses), REAL
   waits (virtual-time budgets race cold font CDNs and lie), and
   Emulation.setDeviceMetricsOverride because headless Chrome clamps bare
   windows. Rendered at 2x and downscaled by sips for crisp type.

   usage: node tools/build-og.js [--url https://carlostoledo.co/]
   default source is the LOCAL build (site/index.html) so the card always
   matches what the next push ships. */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const net = require('net');
const http = require('http');
const cp = require('child_process');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'design', 'assets', 'og.png');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SRC = process.argv.includes('--url')
  ? process.argv[process.argv.indexOf('--url') + 1]
  : 'file://' + path.join(ROOT, 'site', 'index.html');

function frame(payload) {
  const data = Buffer.from(payload);
  const mask = crypto.randomBytes(4);
  let head;
  if (data.length < 126) head = Buffer.from([0x81, 0x80 | data.length]);
  else if (data.length < 65536) { head = Buffer.alloc(4); head[0] = 0x81; head[1] = 0xFE; head.writeUInt16BE(data.length, 2); }
  else { head = Buffer.alloc(10); head[0] = 0x81; head[1] = 0xFF; head.writeBigUInt64BE(BigInt(data.length), 2); }
  for (let j = 0; j < data.length; j++) data[j] ^= mask[j & 3];
  return Buffer.concat([head, mask, data]);
}
const getJson = (p, port) => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port, path: p }, r => {
    let b = ''; r.on('data', c => b += c); r.on('end', () => res(JSON.parse(b)));
  }).on('error', rej);
});

async function main() {
  const port = 9226;
  const chrome = cp.spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + port, '--hide-scrollbars',
    '--user-data-dir=' + fs.mkdtempSync(path.join(os.tmpdir(), 'og-'))], { stdio: 'ignore' });
  try {
    for (let t = 0; t < 60; t++) {
      try { await getJson('/json', port); break; } catch (e) { await new Promise(r => setTimeout(r, 500)); }
    }
    const tg = (await getJson('/json', port)).find(x => x.type === 'page');
    const wsUrl = new URL(tg.webSocketDebuggerUrl);
    const sock = net.connect(port, '127.0.0.1');
    let buf = Buffer.alloc(0), handshaken = false, idc = 0;
    const pending = {};
    let onHs = null;
    const hs = new Promise(res => { onHs = res; });
    const send = (method, params) => new Promise((res) => {
      const id = ++idc; pending[id] = res;
      sock.write(frame(JSON.stringify({ id, method, params: params || {} })));
    });
    sock.on('data', (c) => {
      buf = Buffer.concat([buf, c]);
      if (!handshaken) {
        const i = buf.indexOf('\r\n\r\n');
        if (i < 0) return;
        handshaken = true; buf = buf.slice(i + 4); onHs();
      }
      for (;;) {
        if (buf.length < 2) return;
        let len = buf[1] & 0x7f, off = 2;
        if (len === 126) { if (buf.length < 4) return; len = buf.readUInt16BE(2); off = 4; }
        else if (len === 127) { if (buf.length < 10) return; len = Number(buf.readBigUInt64BE(2)); off = 10; }
        if (buf.length < off + len) return;
        const payload = buf.slice(off, off + len).toString();
        buf = buf.slice(off + len);
        try { const m = JSON.parse(payload); if (m.id && pending[m.id]) { pending[m.id](m.result); delete pending[m.id]; } } catch (e) { /* event */ }
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
    await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 2, mobile: false });
    await send('Page.navigate', { url: SRC });
    await new Promise(r => setTimeout(r, 5000));                   /* real wait: fonts + entry animation */
    /* the 630px crop lands mid-paragraph; fade the last lines into the page
       ground so the card reads as composed, not truncated */
    await send('Runtime.evaluate', { expression:
      `(() => { const ov = document.createElement('div');
        ov.style.cssText = 'position:fixed;left:0;right:0;bottom:0;height:150px;z-index:9999;pointer-events:none;'
          + 'background:linear-gradient(to bottom, rgba(10,10,12,0) 0%, #0a0a0c 82%)';
        document.body.appendChild(ov); })()` });
    await new Promise(r => setTimeout(r, 300));
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    if (!shot || !shot.data) throw new Error('captureScreenshot returned nothing');
    fs.writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
    sock.destroy();
  } finally {
    chrome.kill();
  }
  cp.execFileSync('/usr/bin/sips', ['-z', '630', '1200', OUT], { stdio: 'ignore' });  /* 2x -> declared 1200x630 */
  const px = cp.execFileSync('/usr/bin/sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', OUT]).toString();
  if (!/pixelWidth: 1200/.test(px) || !/pixelHeight: 630/.test(px)) throw new Error('og.png is not 1200x630:\n' + px);
  console.log('wrote ' + path.relative(ROOT, OUT) + ' (' + (fs.statSync(OUT).size / 1024).toFixed(0) + ' KB, 1200x630, from ' + SRC + ')');
}
main().catch(e => { console.error('OG REFUSED: ' + e.message); process.exit(1); });
