#!/usr/bin/env node
/* build-terra-pdf.js — render paper/ember-hotspots.md to paper/ember-hotspots.pdf.

   The write-up is generated from certificates by tools/build-ember-writeup.js;
   this tool gives it a portable PDF form: the markdown (a known, generated
   subset — headings, emphasis, code ticks, tables, lists, rules) is converted
   to print-styled HTML and printed through headless Chrome's Page.printToPDF
   over a raw-socket CDP client (Node's global WebSocket sends an Origin header
   the CDP endpoint refuses; and a frame sent before the 101 handshake makes
   Chrome drop the socket silently — both learned the hard way).

   The PDF is PRINT-styled (black on white, Inter + JetBrains Mono) — a paper
   is read on paper; the dark skin belongs to the site.

   usage: node tools/build-terra-pdf.js
   requires: tools/build-ember-writeup.js run first (it gates on the certs)  */
'use strict';

const fs = require('fs');
const path = require('path');
const net = require('net');
const http = require('http');
const cp = require('child_process');
const crypto = require('crypto');
const os = require('os');

const ROOT = path.resolve(__dirname, '..');
const MD = path.join(ROOT, 'paper', 'ember-hotspots.md');
const OUT = path.join(ROOT, 'paper', 'ember-hotspots.pdf');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const die = (m) => { console.error('EMBER PDF REFUSED: ' + m); process.exit(1); };
if (!fs.existsSync(MD)) die('paper/ember-hotspots.md missing — run tools/build-ember-writeup.js first');

/* ---- the markdown subset this generator emits, nothing more ---- */
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function inline(s) {
  return esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\\\\\[/g, '[').replace(/\\\\\]/g, ']');
}
function mdToHtml(md) {
  const out = [];
  const lines = md.split('\n');
  let i = 0, para = [], list = null;
  const flush = () => {
    if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; }
    if (list) { out.push('<ul>' + list.map(x => '<li>' + inline(x) + '</li>').join('') + '</ul>'); list = null; }
  };
  while (i < lines.length) {
    const L = lines[i];
    if (/^\s*$/.test(L)) { flush(); i++; continue; }
    if (/^---\s*$/.test(L)) { flush(); out.push('<hr>'); i++; continue; }
    const h = /^(#{1,3})\s+(.*)$/.exec(L);
    if (h) { flush(); const n = h[1].length; out.push('<h' + n + '>' + inline(h[2]) + '</h' + n + '>'); i++; continue; }
    if (/^\s{4,}\S/.test(L) && !para.length && !list) {          /* indented block = display equation */
      const block = [];
      while (i < lines.length && (/^\s{4,}\S/.test(lines[i]) || /^\s*$/.test(lines[i]))) {
        if (/^\s*$/.test(lines[i]) && !(/^\s{4,}\S/.test(lines[i + 1] || ''))) break;
        block.push(lines[i].replace(/^\s{4}/, '')); i++;
      }
      out.push('<pre class="eq">' + esc(block.join('\n').trim()) + '</pre>'); continue;
    }
    if (/^\|/.test(L)) {
      flush();
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) { rows.push(lines[i]); i++; }
      const cells = rows.filter(r => !/^\|[\s\-|]+\|$/.test(r))
        .map(r => r.replace(/^\||\|$/g, '').split('|').map(c => inline(c.trim())));
      out.push('<table><thead><tr>' + cells[0].map(c => '<th>' + c + '</th>').join('') + '</tr></thead><tbody>'
        + cells.slice(1).map(r => '<tr>' + r.map(c => '<td>' + c + '</td>').join('') + '</tr>').join('') + '</tbody></table>');
      continue;
    }
    const li = /^-\s+(.*)$/.exec(L);
    if (li) { if (para.length) flush(); list = list || []; list.push(li[1]); i++; continue; }
    if (list && /^\s+\S/.test(L)) { list[list.length - 1] += ' ' + L.trim(); i++; continue; }
    para.push(L.trim()); i++;
  }
  flush();
  return out.join('\n');
}

const PRINT_CSS = `
@page { size: A4; margin: 22mm 20mm; }
body { font-family: 'Inter', 'Helvetica Neue', sans-serif; font-size: 10pt; line-height: 1.55;
  color: #111; max-width: 100%; margin: 0; }
h1 { font-size: 19pt; line-height: 1.15; letter-spacing: -0.02em; margin: 0 0 4pt; }
h2 { font-size: 13pt; margin: 18pt 0 6pt; letter-spacing: -0.01em; }
h3 { font-size: 11pt; margin: 12pt 0 4pt; }
p { margin: 0 0 8pt; text-align: justify; hyphens: auto; }
strong { font-weight: 600; }
code { font-family: 'JetBrains Mono', 'SF Mono', monospace; font-size: 8.5pt;
  background: #f2f2f4; padding: 0.5pt 2.5pt; border-radius: 2pt; }
pre.eq { font-family: 'JetBrains Mono', monospace; font-size: 8.5pt; line-height: 1.6;
  background: #f7f7f9; border: 0.5pt solid #ddd; padding: 6pt 9pt; margin: 8pt 0;
  white-space: pre-wrap; page-break-inside: avoid; }
table { border-collapse: collapse; width: 100%; font-family: 'JetBrains Mono', monospace;
  font-size: 7.5pt; margin: 8pt 0; page-break-inside: avoid; }
th { text-align: left; font-weight: 600; border-bottom: 1pt solid #333; padding: 3pt 5pt; }
td { border-bottom: 0.5pt solid #ccc; padding: 3pt 5pt; }
ul { margin: 0 0 8pt; padding-left: 14pt; }
li { margin-bottom: 3pt; }
hr { border: none; border-top: 0.5pt solid #999; margin: 14pt 0; }
a { color: #111; }
`;

const html = '<!doctype html><html><meta charset="utf-8"><title>ember-hotspots</title>'
  + '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=JetBrains+Mono:wght@400;600&display=swap">'
  + '<style>' + PRINT_CSS + '</style><body>' + mdToHtml(fs.readFileSync(MD, 'utf8')) + '</body></html>';
const tmp = path.join(os.tmpdir(), 'ember-hotspots-print-' + process.pid + '.html');
fs.writeFileSync(tmp, html);

/* ---- minimal raw-socket CDP client ---- */
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
const getJson = (p) => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port: 9222, path: p }, r => {
    let b = ''; r.on('data', c => b += c); r.on('end', () => res(JSON.parse(b)));
  }).on('error', rej);
});

async function main() {
  const chrome = cp.spawn(CHROME, ['--headless=new', '--remote-debugging-port=9222', '--hide-scrollbars',
    '--user-data-dir=' + fs.mkdtempSync(path.join(os.tmpdir(), 'ember-pdf-'))], { stdio: 'ignore' });
  for (let t = 0; t < 60; t++) {
    try { await getJson('/json'); break; } catch (e) { await new Promise(r => setTimeout(r, 500)); }
  }
  const targets = await getJson('/json');
  const tg = targets.find(x => x.type === 'page');
  const wsUrl = new URL(tg.webSocketDebuggerUrl);
  const sock = net.connect(9222, '127.0.0.1');
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
    sock.write('GET ' + wsUrl.pathname + ' HTTP/1.1\r\nHost: 127.0.0.1:9222\r\nUpgrade: websocket\r\n'
      + 'Connection: Upgrade\r\nSec-WebSocket-Key: ' + crypto.randomBytes(16).toString('base64')
      + '\r\nSec-WebSocket-Version: 13\r\n\r\n');
    res();
  }));
  await hs;
  await send('Page.enable');
  await send('Page.navigate', { url: 'file://' + tmp });
  await new Promise(r => setTimeout(r, 2500));                    /* real wait: fonts */
  const pdf = await send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true });
  fs.writeFileSync(OUT, Buffer.from(pdf.data, 'base64'));
  chrome.kill();
  fs.unlinkSync(tmp);
  console.log('wrote paper/ember-hotspots.pdf (' + (fs.statSync(OUT).size / 1024).toFixed(0) + ' KB)');
}
main().catch(e => die(e.message));
