/* cdp.js — THE headless-Chrome client, once.
   design/ · cert-machine

   WHY THIS EXISTS. On 2026-09-04 the layout gate needed to drive Chrome and
   found the client already written THREE times — design/paper.js (printToPDF),
   tools/build-og.js (captureScreenshot) and playground/shot.js (screenshots at
   2x). Byte for byte the same handshake, the same frame writer, the same
   dispatch loop; the only difference was what each did after the socket opened.
   A fourth copy is the corpus.js lesson with a websocket in it: "a rule defined
   twice WILL diverge". So the transport lives here and the callers keep only
   their own intent.

   THE THREE FACTS THIS FILE ENCODES, each learned by something failing:

     · RAW SOCKET, NOT `new WebSocket`. Node's global WebSocket sends an Origin
       header and the CDP endpoint refuses the upgrade. The 101 is done by hand.
     · EVERY SEND IS GATED ON THE HANDSHAKE. A frame written before the 101 is
       silently dropped and the promise never settles.
     · REAL WAITS. Virtual-time budgets race a cold font CDN and then lie about
       it, so callers wait on `document.fonts.ready` or on the clock, never on a
       budget. `settle()` below is the honest form.

   Headless Chrome also clamps bare windows to >= 500px, so a caller that wants a
   narrow viewport must use Emulation.setDeviceMetricsOverride rather than
   --window-size. That is the caller's call to make; this file does not make it.

   usage:
     const { withChrome, settle } = require('./cdp.js');
     await withChrome(async (send) => {
       await send('Page.enable');
       await send('Page.navigate', { url });
       await settle(2000);
       return await send('Page.captureScreenshot', { format: 'png' });
     }, { port: 9226 });                                                     */
'use strict';

const fs = require('fs');
const os = require('os');
const net = require('net');
const path = require('path');
const http = require('http');
const cp = require('child_process');
const crypto = require('crypto');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/* a masked client text frame — the only frame kind a CDP client ever sends */
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
  http.get({ host: '127.0.0.1', port, path: p }, (r) => {
    let b = ''; r.on('data', (c) => { b += c; }); r.on('end', () => res(JSON.parse(b)));
  }).on('error', rej);
});

/* the honest wait: the clock, or a promise the page itself resolves */
const settle = (ms) => new Promise((r) => setTimeout(r, ms));

/* Spawn Chrome, open the socket, hand `send` to the caller, and always clean
   up — the process is killed in a finally, so a throwing caller does not leave
   a headless Chrome running. Returns whatever the caller returns. */
async function withChrome(fn, opts) {
  const o = opts || {};
  const port = o.port || (9300 + (process.pid % 200));
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-'));
  const args = ['--headless=new', '--remote-debugging-port=' + port, '--hide-scrollbars',
    '--user-data-dir=' + profile].concat(o.args || []);
  const chrome = cp.spawn(o.chrome || CHROME, args, { stdio: 'ignore' });
  let sock = null;
  try {
    for (let t = 0; t < 60; t++) {
      try { await getJson('/json', port); break; } catch (e) { await settle(500); }
    }
    const tg = (await getJson('/json', port)).find((x) => x.type === 'page');
    if (!tg) throw new Error('no page target on port ' + port);
    const wsUrl = new URL(tg.webSocketDebuggerUrl);
    sock = net.connect(port, '127.0.0.1');
    let buf = Buffer.alloc(0), handshaken = false, idc = 0;
    const pending = {};
    let onHs = null;
    const hs = new Promise((res) => { onHs = res; });
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
        try {
          const m = JSON.parse(payload);
          if (m.id && pending[m.id]) { pending[m.id](m.result); delete pending[m.id]; }
        } catch (e) { /* an event, not a reply */ }
      }
    });
    await new Promise((res) => sock.on('connect', () => {
      sock.write('GET ' + wsUrl.pathname + ' HTTP/1.1\r\nHost: 127.0.0.1:' + port + '\r\nUpgrade: websocket\r\n'
        + 'Connection: Upgrade\r\nSec-WebSocket-Key: ' + crypto.randomBytes(16).toString('base64')
        + '\r\nSec-WebSocket-Version: 13\r\n\r\n');
      res();
    }));
    await hs;                                     /* gate every send on the 101 */
    return await fn(send);
  } finally {
    if (sock) sock.destroy();
    chrome.kill();
  }
}

module.exports = { withChrome, settle, frame, getJson, CHROME };
