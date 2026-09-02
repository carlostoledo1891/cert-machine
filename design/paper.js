/* paper.js — THE print engine: record-driven markdown → journal-article PDF.
   design/ · cert-machine (2026-09-02)

   The papers' look is the frontier bench's LaTeX article (11pt, amsthm,
   booktabs, microtype — see frontier-apps/experiments/ember/paper/
   ember-paper.tex), reproduced here in print CSS because this machine
   carries no TeX toolchain and the papers must rebuild from certificates
   on any clone: STIX Two Text (a Times-class math face with full unicode
   math coverage) set justified at 11pt, a centered title block, an
   abstract environment, run-in bold theorem labels with italic bodies
   (amsthm "plain" style), booktabs tables (rules horizontal, never
   vertical), display equations centered and unboxed, shell blocks in
   mono, page numbers centered in the footer.

   ONE module: the markdown-subset parser and the raw-socket CDP client
   used to live duplicated in build-terra-pdf.js and build-ember-pdf.js —
   a rule defined twice WILL diverge. Both builders are thin wrappers now,
   and tools/build-paper-pdf.js prints any paper/*.md.

   The CDP gotchas, learned the hard way and preserved: Node's global
   WebSocket sends an Origin header the CDP endpoint refuses, and a frame
   sent before the 101 handshake makes Chrome drop the socket silently —
   hence the raw net socket and the handshake gate.  MIT. */
'use strict';

const fs = require('fs');
const path = require('path');
const net = require('net');
const http = require('http');
const cp = require('child_process');
const crypto = require('crypto');
const os = require('os');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/* ---------------- the markdown subset our writeup builders emit ---------- */
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function inline(s) {
  return esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\\\\\[/g, '[').replace(/\\\\\]/g, ']');
}
/* an indented block is SHELL if any line starts with a command word or
   carries a `#` comment column; otherwise it is display mathematics */
function isShellBlock(lines) {
  return lines.some(l => /^\s*(node|python3?|git|make|pip|curl)\b/.test(l) || /\s#\s/.test(l));
}
const THM = /^<strong>(Theorem|Corollary|Lemma|Proposition|Definition|Conjecture)\b/;

function mdToArticle(md) {
  const out = [];
  const lines = md.split('\n');
  let i = 0, para = [], list = null, olist = null, titleDone = false, metaRun = false;
  const flush = () => {
    if (para.length) {
      const html = inline(para.join(' '));
      if (titleDone && metaRun) {
        /* meta lines directly under the title (draft line, [OPERATOR] line) */
        out.push('<p class="meta">' + html + '</p>');
      } else if (THM.test(html)) {
        out.push('<p class="thm">' + html + '</p>');
      } else {
        out.push('<p>' + html + '</p>');
      }
      para = [];
    }
    if (list) { out.push('<ul>' + list.map(x => '<li>' + inline(x) + '</li>').join('') + '</ul>'); list = null; }
    if (olist) { out.push('<ol>' + olist.map(x => '<li>' + inline(x) + '</li>').join('') + '</ol>'); olist = null; }
  };
  while (i < lines.length) {
    const L = lines[i];
    if (/^\s*$/.test(L)) { flush(); i++; continue; }
    if (/^---\s*$/.test(L)) { flush(); out.push('<div class="rule"></div>'); metaRun = false; i++; continue; }
    const h = /^(#{1,3})\s+(.*)$/.exec(L);
    if (h) {
      flush();
      const n = h[1].length;
      if (n === 1 && !titleDone) {
        out.push('<h1 class="title">' + inline(h[2]) + '</h1>');
        titleDone = true; metaRun = true;
      } else if (n === 2 && /^abstract$/i.test(h[2].trim())) {
        out.push('<div class="abs-head">Abstract</div>');
        out.push('<div class="abs-mark"></div>');
      } else {
        out.push('<h' + n + '>' + inline(h[2]) + '</h' + n + '>');
        metaRun = false;
      }
      i++; continue;
    }
    if (/^\s{4,}\S/.test(L) && !para.length && !list && !olist) {
      const block = [];
      while (i < lines.length && (/^\s{4,}\S/.test(lines[i]) || /^\s*$/.test(lines[i]))) {
        if (/^\s*$/.test(lines[i]) && !(/^\s{4,}\S/.test(lines[i + 1] || ''))) break;
        block.push(lines[i].replace(/^\s{4}/, '')); i++;
      }
      const body = block.join('\n').trim();
      out.push(isShellBlock(block)
        ? '<pre class="shell">' + esc(body) + '</pre>'
        : '<div class="dmath">' + esc(body).split('\n').map(l => '<div>' + l + '</div>').join('') + '</div>');
      continue;
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
    if (li) { if (para.length || olist) flush(); list = list || []; list.push(li[1]); i++; continue; }
    const oli = /^(\d+)\.\s+(.*)$/.exec(L);
    if (oli && !para.length) { if (list) flush(); olist = olist || []; olist.push(oli[2]); i++; continue; }
    if ((list || olist) && /^\s+\S/.test(L)) {
      const tgt = list || olist;
      tgt[tgt.length - 1] += ' ' + L.trim(); i++; continue;
    }
    para.push(L.trim()); i++;
  }
  flush();
  /* wrap everything between the abstract marker and the next h2 as the
     abstract environment */
  let html = out.join('\n');
  html = html.replace(/<div class="abs-mark"><\/div>\n([\s\S]*?)(?=\n<div class="rule">|\n<h2>)/,
    (m, body) => '<div class="abstract">\n' + body + '\n</div>');
  return html;
}

/* ---------------- the article print CSS (the frontier look) -------------- */
const ARTICLE_CSS = `
body { font-family: 'STIX Two Text', 'Times New Roman', serif; font-size: 11pt;
  line-height: 1.42; color: #000; margin: 0; text-align: justify; hyphens: auto;
  font-variant-numeric: oldstyle-nums; }
h1.title { font-size: 17pt; line-height: 1.25; text-align: center; font-weight: 700;
  margin: 0 0 10pt; hyphens: none; }
p.meta { text-align: center; font-size: 9.5pt; color: #333; margin: 0 0 4pt;
  line-height: 1.5; }
.rule { border-top: 0.5pt solid #999; margin: 14pt auto; width: 30%; }
.abs-head { text-align: center; font-weight: 700; font-size: 10.5pt; margin: 16pt 0 6pt; }
.abstract { margin: 0 26pt 6pt; font-size: 10pt; line-height: 1.4; }
.abstract p { margin: 0 0 6pt; }
h2 { font-size: 12.5pt; font-weight: 700; margin: 16pt 0 6pt; text-align: left; hyphens: none;
  page-break-after: avoid; }
h3 { font-size: 11pt; font-weight: 700; font-style: italic; margin: 11pt 0 4pt; text-align: left;
  page-break-after: avoid; }
p { margin: 0 0 7pt; }
p.thm { font-style: italic; }
p.thm strong { font-style: normal; }
strong { font-weight: 700; }
em { font-style: italic; }
code { font-family: 'JetBrains Mono', 'SF Mono', monospace; font-size: 8.6pt; }
.dmath { text-align: center; margin: 9pt 0 10pt; font-size: 10.5pt; line-height: 1.55;
  page-break-inside: avoid; hyphens: none; }
pre.shell { font-family: 'JetBrains Mono', monospace; font-size: 8.4pt; line-height: 1.55;
  background: #f6f6f6; border: 0.5pt solid #ccc; border-radius: 2pt; padding: 6pt 9pt;
  margin: 8pt 0 10pt; white-space: pre-wrap; page-break-inside: avoid; text-align: left; }
table { border-collapse: collapse; margin: 10pt auto 12pt; font-size: 9pt; line-height: 1.35;
  page-break-inside: avoid; font-variant-numeric: tabular-nums lining-nums; }
thead th { border-top: 1pt solid #000; border-bottom: 0.5pt solid #000;
  font-weight: 700; text-align: left; padding: 3.5pt 8pt; hyphens: none; }
td { padding: 3pt 8pt; text-align: left; }
tbody tr:last-child td { border-bottom: 1pt solid #000; }
ul, ol { margin: 0 0 8pt; padding-left: 18pt; }
li { margin-bottom: 3pt; }
a { color: #000; text-decoration: none; }
`;

function articleHtml(md, name) {
  return '<!doctype html><html><meta charset="utf-8"><title>' + esc(name) + '</title>'
    + '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=STIX+Two+Text:ital,wght@0,400;0,600;0,700;1,400;1,600&family=JetBrains+Mono:wght@400;600&display=swap">'
    + '<style>' + ARTICLE_CSS + '</style><body>' + mdToArticle(md) + '</body></html>';
}

/* ---------------- minimal raw-socket CDP client ---------------- */
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

async function printPdf(html, outPath, opts) {
  const port = (opts && opts.port) || 9224;
  const tmp = path.join(os.tmpdir(), 'paper-print-' + process.pid + '-' + Date.now() + '.html');
  fs.writeFileSync(tmp, html);
  const chrome = cp.spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + port, '--hide-scrollbars',
    '--user-data-dir=' + fs.mkdtempSync(path.join(os.tmpdir(), 'paper-pdf-'))], { stdio: 'ignore' });
  try {
    for (let t = 0; t < 60; t++) {
      try { await getJson('/json', port); break; } catch (e) { await new Promise(r => setTimeout(r, 500)); }
    }
    const targets = await getJson('/json', port);
    const tg = targets.find(x => x.type === 'page');
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
    await hs;                                                      /* gate every send on the 101 */
    await send('Page.enable');
    await send('Page.navigate', { url: 'file://' + tmp });
    await new Promise(r => setTimeout(r, 2800));                   /* real wait: fonts */
    const pdf = await send('Page.printToPDF', {
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: '<div style="font-size:9px;width:100%;text-align:center;'
        + 'font-family:\'Times New Roman\',serif;color:#000;"><span class="pageNumber"></span></div>',
      marginTop: 0.95, marginBottom: 0.95, marginLeft: 1.1, marginRight: 1.1,
      preferCSSPageSize: false,
    });
    fs.writeFileSync(outPath, Buffer.from(pdf.data, 'base64'));
    sock.destroy();
  } finally {
    chrome.kill();
    fs.unlinkSync(tmp);
  }
  return outPath;
}

/* print one paper/*.md to its sibling .pdf */
async function printPaper(mdPath, outPath, opts) {
  const md = fs.readFileSync(mdPath, 'utf8');
  const name = path.basename(mdPath, '.md');
  return printPdf(articleHtml(md, name), outPath || mdPath.replace(/\.md$/, '.pdf'), opts);
}

module.exports = { mdToArticle, articleHtml, printPdf, printPaper, ARTICLE_CSS };
