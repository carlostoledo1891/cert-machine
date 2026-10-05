#!/usr/bin/env node
/* build-pdf.js — outreach/primeintellect/resume.md -> resume.pdf, through the repo's one
   headless-Chrome client (design/cdp.js). A small markdown subset (headings, bullets two levels
   deep, paragraphs, **bold**, `code`, [links](url)); the "Notes for the sender" block after the
   last `---` stays out of the PDF; any [OPERATOR ...] placeholder still in the text is printed
   on a yellow mark so a draft can never be mistaken for the finished page.

   usage: node outreach/primeintellect/build-pdf.js            -> resume.pdf beside this file */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { withChrome, settle } = require('../../design/cdp.js');

const HERE = __dirname;
// The FILLED copy (phone, education, employment) is personal and git-ignored; the tracked
// resume.md keeps the placeholders. The PDF is built from the filled copy when it exists.
const filled = path.join(HERE, 'resume.filled.md');
const src = fs.existsSync(filled) ? filled : path.join(HERE, 'resume.md');
let md = fs.readFileSync(src, 'utf8');
const cut = md.lastIndexOf('\n---\n');
if (cut > 0) md = md.slice(0, cut);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) => esc(s)
  .replace(/\[(OPERATOR[^\]]*)\]/g, '<mark>[$1]</mark>')
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/`([^`]+)`/g, '<code>$1</code>');

// Bullets are gathered whole (continuation lines included) before inline markup runs, so a
// **bold** phrase that wraps onto the next line still closes.
const out = [];
let list = 0, para = [], item = null;
const flushItem = () => { if (item !== null) { out.push(inline(item)); item = null; } };
const flushPara = () => { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } };
const closeLists = (to) => { flushItem(); while (list > to) { out.push('</li></ul>'); list--; } };
for (const raw of md.split('\n')) {
  const line = raw.replace(/\s+$/, '');
  let m;
  if (!line.trim()) { flushPara(); flushItem(); continue; }
  if ((m = /^(#{1,3}) (.*)$/.exec(line))) {
    flushPara(); closeLists(0);
    let t = m[2];
    if (m[1] === '#') t = t.replace(/\s*—\s*resume.*$/i, '');
    out.push(`<h${m[1].length}>${inline(t)}</h${m[1].length}>`);
    continue;
  }
  if ((m = /^(\s*)- (.*)$/.exec(line))) {
    flushPara(); flushItem();
    const depth = m[1].length >= 2 ? 2 : 1;
    if (depth > list) { while (list < depth) { out.push('<ul><li>'); list++; } }
    else { closeLists(depth); out.push('</li><li>'); }
    item = m[2];
    continue;
  }
  if (item !== null && /^\s{2,}\S/.test(line)) { item += ' ' + line.trim(); continue; }
  closeLists(0);
  para.push(line.trim());
}
flushPara(); closeLists(0);

const html = `<!doctype html><html><head><meta charset="utf-8"><title>Carlos Toledo</title><style>
  @page { size: Letter; margin: 0.55in 0.6in; }
  body { font: 10.2pt/1.38 -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif; color: #111; margin: 0; }
  h1 { font-size: 19pt; margin: 0 0 2pt; letter-spacing: -0.2pt; }
  h2 { font-size: 11pt; text-transform: uppercase; letter-spacing: 0.6pt; color: #333; border-bottom: 0.6pt solid #999;
       padding-bottom: 2pt; margin: 12pt 0 5pt; }
  p { margin: 0 0 6pt; }
  ul { margin: 0 0 5pt 0; padding-left: 14pt; }
  li { margin: 0 0 3pt; }
  li ul { margin-top: 2pt; }
  code { font: 9pt/1 "SF Mono", Menlo, monospace; background: #f2f2f2; padding: 0 2pt; border-radius: 2pt; }
  a { color: #0b4fa8; text-decoration: none; }
  mark { background: #ffe066; padding: 0 2pt; }
  strong { font-weight: 650; }
</style></head><body>${out.join('\n')}</body></html>`;

const tmp = path.join(os.tmpdir(), 'resume-' + process.pid + '.html');
fs.writeFileSync(tmp, html);
const outPath = path.join(HERE, 'resume.pdf');
(async () => {
  try {
    await withChrome(async (send) => {
      await send('Page.enable');
      await send('Page.navigate', { url: 'file://' + tmp });
      await settle(1500);
      const pdf = await send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true });
      fs.writeFileSync(outPath, Buffer.from(pdf.data, 'base64'));
    }, { port: 9231 });
  } finally {
    fs.unlinkSync(tmp);
  }
  const left = (md.match(/\[OPERATOR[^\]]*\]/g) || []).length;
  console.log(outPath + ' written' + (left ? ` — ${left} placeholder(s) still marked in yellow` : ' — no placeholders left'));
})().catch((e) => { console.error(e); process.exit(1); });
