#!/usr/bin/env node
/* build-pdf.js — outreach/primeintellect/resume.md -> resume.pdf, through the repo's one
   headless-Chrome client (design/cdp.js).

   The source is a small markdown subset with a resume's grammar:
     # Name                         the name (anything from " — resume" on is dropped)
     _tagline_                      the line under the name
     a · b · c   (header lines)     contact rows; emails, phones and bare domains become links
     > Label: x · Label: y          the availability strip, one cell per item
     **Lead.** text                 the opening paragraph
     ## Section | aside             a section, with an optional note on the right
     ### Org — role | dates         an entry, dates on the right; one paragraph follows it
     - **Title** rest               an item with a title line; "- **Label:** text" is a labelled line
       - detail                     its details, dashed
   plus **bold**, `code` and [links](url). The "Notes for the sender" block after the last `---`
   stays out of the PDF.

   PERSONAL LINES NEVER ENTER THE TRACKED FILE. resume.md carries [OPERATOR FILLS name] marks;
   resume.private.md (git-ignored) holds "@@ name" blocks that replace them. A mark with no
   block prints on a yellow highlight, so a draft can never be mistaken for the finished page.

   Set in the site's faces (Inter, JetBrains Mono — design/tokens.js) and its grays. Inter comes
   as the STATIC cuts of the 4.1 release: Chrome embeds a variable font as Type 3 outlines, which
   some viewers render soft. The build REFUSES if Inter has not loaded, rather than ship the
   fallback face.

   usage: node outreach/primeintellect/build-pdf.js            -> resume.pdf beside this file */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { withChrome, settle } = require('../../design/cdp.js');

const HERE = __dirname;
let md = fs.readFileSync(path.join(HERE, 'resume.md'), 'utf8');
const cut = md.lastIndexOf('\n---\n');
if (cut > 0) md = md.slice(0, cut);

const fills = {};
const priv = path.join(HERE, 'resume.private.md');
if (fs.existsSync(priv)) {
  let name = null;
  for (const line of fs.readFileSync(priv, 'utf8').split('\n')) {
    const m = /^@@\s+(\w+)\s*$/.exec(line);
    if (m) { name = m[1]; fills[name] = []; } else if (name) fills[name].push(line);
  }
}
md = md.replace(/\[OPERATOR FILLS (\w+)[^\]]*\]/g, (all, k) => (fills[k] ? fills[k].join('\n').trim() : all));

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Typographic quotes outside `code`: ' -> ’ and "x" -> “x”.
const curly = (s) => s.split(/(`[^`]*`)/).map((part, k) => (k % 2 ? part
  : part.replace(/(^|[\s(])"/g, '$1“').replace(/"/g, '”').replace(/'/g, '’'))).join('');
const inline = (s) => esc(curly(s))
  .replace(/\[(OPERATOR[^\]]*)\]/g, '<mark>[$1]</mark>')
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/`([^`]+)`/g, '<code>$1</code>');
const autolink = (item) => {
  const t = item.trim();
  if (/^[^\s@]+@[^\s@]+\.\w+$/.test(t)) return `<a href="mailto:${t}">${esc(t)}</a>`;
  if (/^\+[\d\s()-]{8,}$/.test(t)) return `<a href="tel:${t.replace(/[^\d+]/g, '')}">${esc(t)}</a>`;
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(t)) return `<a href="https://${t}">${esc(t)}</a>`;
  return inline(t);
};
const marked = (s) => s.includes('[OPERATOR');

// ---- blocks
const blocks = [];
let para = null, list = null;
const endPara = () => { if (para) { blocks.push({ k: 'p', lines: para }); para = null; } };
const endList = () => { if (list) { blocks.push({ k: 'ul', items: list }); list = null; } };
for (const raw of md.split('\n')) {
  const line = raw.replace(/\s+$/, '');
  let m;
  if (!line.trim()) { endPara(); endList(); continue; }
  if ((m = /^(#{1,3}) (.*)$/.exec(line))) {
    endPara(); endList();
    const [t, aside] = m[2].split(' | ');
    blocks.push({ k: 'h' + m[1].length, t, aside });
    continue;
  }
  if ((m = /^> (.*)$/.exec(line))) { endPara(); endList(); blocks.push({ k: 'quote', t: m[1] }); continue; }
  if ((m = /^(\s*)- (.*)$/.exec(line))) { endPara(); (list = list || []).push({ d: m[1].length >= 2 ? 2 : 1, t: m[2] }); continue; }
  if (list && /^\s{2,}\S/.test(line)) { list[list.length - 1].t += ' ' + line.trim(); continue; }
  endList();
  (para = para || []).push(line.trim());
}
endPara(); endList();

// ---- header: everything before the first section
const head = { name: '', tag: '', contact: [], avail: '', lead: '' };
let i = 0;
for (; i < blocks.length && blocks[i].k !== 'h2'; i++) {
  const b = blocks[i], text = b.lines ? b.lines.join(' ') : '';
  if (b.k === 'h1') head.name = b.t.replace(/\s*—\s*resume.*$/i, '');
  else if (b.k === 'quote') head.avail = b.t;
  else if (b.k === 'p' && /^_.*_$/.test(text)) head.tag = text.slice(1, -1);
  else if (b.k === 'p' && text.startsWith('**')) head.lead = text;
  else if (b.k === 'p') head.contact.push(...b.lines);
}
// "Role · focus" sets the role on its own line above the focus.
const [role0, ...focus] = head.tag.split(' · ');
const tagline = `<span class="role-t">${inline(role0)}</span>` + inline(focus.join(' · '));
const contact = head.contact.map((l) => '<div>' + (marked(l) && !l.includes(' · ') ? inline(l)
  : l.split(' · ').map(autolink).join('<span class="sep">·</span>')) + '</div>').join('');
const avail = !head.avail ? '' : marked(head.avail) ? `<div>${inline(head.avail)}</div>`
  : head.avail.split(' · ').map((c) => {
    const m = /^([^:]{2,24}):\s+(.*)$/.exec(c);
    return m ? `<div><span class="lab">${esc(m[1])}</span>${inline(m[2])}</div>` : `<div>${inline(c)}</div>`;
  }).join('');

// ---- body
const renderList = (items) => {
  const tree = [];
  for (const it of items) {
    if (it.d === 1 || !tree.length) tree.push({ t: it.t, kids: [] }); else tree[tree.length - 1].kids.push(it.t);
  }
  return '<ul class="list">' + tree.map((n) => {
    const kids = n.kids.length ? '<ul class="detail">' + n.kids.map((k) => `<li>${inline(k)}</li>`).join('') + '</ul>' : '';
    const lead = /^\*\*([^*]+)\*\*/.exec(n.t);
    if (lead && /:$/.test(lead[1])) return `<li class="kv">${inline(n.t)}${kids}</li>`;
    if (lead) return `<li class="item"><div class="t">${inline(n.t)}</div>${kids}</li>`;
    return `<li>${inline(n.t)}${kids}</li>`;
  }).join('') + '</ul>';
};
const body = [];
let inSec = false, fresh = false, entryParas = -1;   // fresh: nothing yet in this section; -1: not in an entry
const endEntry = () => { if (entryParas >= 0) { body.push('</div>'); entryParas = -1; } };
const endSec = () => { endEntry(); if (inSec) { body.push('</section>'); inSec = false; } };
for (; i < blocks.length; i++) {
  const b = blocks[i];
  if (b.k === 'h2') {
    endSec();
    body.push(`<section><div class="eyebrow"><h2>${inline(b.t)}</h2><i></i>${b.aside ? `<span>${inline(b.aside)}</span>` : ''}</div>`);
    inSec = true; fresh = true;
    continue;
  }
  if (b.k === 'h3') {
    endEntry();
    const [org, ...role] = b.t.split(' — ');
    body.push(`<div class="entry"><div class="eh"><h3><b>${inline(org)}</b>${role.length ? `<span class="role">${inline(role.join(' — '))}</span>` : ''}</h3>`
      + (b.aside ? `<span class="date">${esc(b.aside)}</span>` : '') + '</div>');
    entryParas = 0;
  } else if (b.k === 'p') {
    const text = b.lines.join(' ');
    if (entryParas === 0 && !marked(text)) { body.push(`<p class="ep">${inline(text)}</p>`); entryParas = 1; continue; }
    endEntry();
    // A section's opening paragraph is body text; a paragraph after its entries is a note.
    body.push(`<p class="${marked(text) ? '' : fresh ? 'sp' : 'note'}">${inline(text)}</p>`);
  } else if (b.k === 'ul') {
    endEntry();
    body.push(renderList(b.items));
  }
  fresh = false;
}
endSec();

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(head.name)} — resume</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500&display=block">
<style>
${[['Inter', 400, 'Inter-Regular'], ['Inter', 500, 'Inter-Medium'], ['Inter', 600, 'Inter-SemiBold'],
    ['Inter Display', 600, 'InterDisplay-SemiBold']].map(([f, w, file]) => `  @font-face { font-family: "${f}"; font-weight: ${w};
    font-display: block; src: url(https://cdn.jsdelivr.net/gh/rsms/inter@v4.1/docs/font-files/${file}.woff2) format("woff2"); }`).join('\n')}
  @page { size: Letter; margin: 0.6in 0.7in 0.72in; }
  :root { --ink:#0e0e12; --ink-2:#2d2d35; --ink-3:#5d5d69; --ink-4:#8c8c98; --rule:#dcdce3; --wash:#f3f3f6; }
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; font: 400 9pt/1.44 Inter, "Helvetica Neue", Helvetica, Arial, sans-serif; color: var(--ink-2);
         -webkit-font-smoothing: antialiased; }
  a { color: inherit; text-decoration: underline; text-decoration-color: #c4c4cc; text-decoration-thickness: 0.5pt;
      text-underline-offset: 1.6pt; }
  strong, b { font-weight: 600; color: var(--ink); }
  code { font: 500 0.84em/1 "JetBrains Mono", "SF Mono", Menlo, monospace; color: var(--ink); background: var(--wash);
         border: 0.5pt solid #e5e5eb; border-radius: 2.5pt; padding: 0.5pt 2.3pt; }
  mark { background: #ffe066; color: var(--ink); padding: 0 2pt; border-radius: 2pt; }
  p { margin: 0 0 6pt; }
  ul { list-style: none; margin: 0; padding: 0; }

  header { display: grid; grid-template-columns: 1fr auto; align-items: end; gap: 24pt; padding-bottom: 12pt;
           border-bottom: 1.2pt solid var(--ink); }
  h1 { margin: 0 0 7pt; font: 600 27pt/1 "Inter Display", Inter, sans-serif; letter-spacing: -0.02em; color: var(--ink); }
  .tag { margin: 0; font-size: 10.2pt; line-height: 1.42; color: var(--ink-3); letter-spacing: -0.006em; }
  .role-t { display: block; color: var(--ink-2); font-weight: 500; }
  .contact { text-align: right; font-size: 8.4pt; line-height: 1.64; color: var(--ink-3); }
  .contact a { color: var(--ink-2); text-decoration: none; }
  .sep { color: #b9b9c3; padding: 0 4.5pt; }
  .avail { display: grid; grid-template-columns: 1fr 1.25fr 1.25fr; gap: 16pt; padding: 8pt 0 9pt;
           border-bottom: 0.5pt solid var(--rule); font-size: 8.4pt; line-height: 1.42; }
  .lab { display: block; margin-bottom: 1.5pt; font-size: 6.5pt; font-weight: 600; letter-spacing: 0.08em;
         text-transform: uppercase; color: var(--ink-4); }
  .lead { margin: 12pt 0 0; font-size: 10.6pt; line-height: 1.5; color: var(--ink); letter-spacing: -0.004em; }

  section { margin-top: 13pt; }
  .eyebrow { display: flex; align-items: center; gap: 9pt; margin-bottom: 7pt; break-after: avoid; }
  .eyebrow h2 { margin: 0; font-size: 7.3pt; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
                color: var(--ink); white-space: nowrap; }
  .eyebrow i { flex: 1; border-top: 0.5pt solid var(--rule); }
  .eyebrow span { font-size: 7.4pt; color: var(--ink-4); white-space: nowrap; }

  .list > li { margin: 0 0 7.5pt; break-inside: avoid; }
  .list > li.kv { margin-bottom: 3pt; }
  .item > .t { color: var(--ink-3); }
  .item > .t strong { font-size: 9.7pt; letter-spacing: -0.006em; }
  .detail { margin-top: 2.5pt; }
  .detail li { position: relative; padding-left: 12pt; margin: 0 0 2pt; }
  .detail li::before { content: ""; position: absolute; left: 1.5pt; top: 0.72em; width: 5pt;
                       border-top: 0.7pt solid var(--ink-4); }

  .entry { margin: 0 0 7pt; break-inside: avoid; }
  .eh { display: flex; justify-content: space-between; align-items: baseline; gap: 14pt; }
  .eh h3 { margin: 0; font-size: 9.6pt; font-weight: 400; color: var(--ink-3); letter-spacing: -0.004em; }
  .role::before { content: "—"; color: #b9b9c3; margin: 0 5pt; }
  .date { font-size: 8.3pt; color: var(--ink-4); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .ep { margin: 1.5pt 0 0; }
  .note { margin-top: 2pt; font-size: 8.5pt; color: var(--ink-3); }
  .sp { margin-bottom: 7pt; }
</style></head><body>
<header><div><h1>${inline(head.name)}</h1>${head.tag ? `<p class="tag">${tagline}</p>` : ''}</div>
<div class="contact">${contact}</div></header>
${avail ? `<div class="avail">${avail}</div>` : ''}
${head.lead ? `<p class="lead">${inline(head.lead)}</p>` : ''}
${body.join('\n')}
</body></html>`;

const footer = `<div style="width:100%;padding:0 0.7in;display:flex;justify-content:space-between;
  font:6.6pt -apple-system,'Helvetica Neue',Helvetica,Arial,sans-serif;letter-spacing:0.02em;color:#8c8c98;">
  <span>${esc(head.name)} · resume</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;

const tmp = path.join(os.tmpdir(), 'resume-' + process.pid + '.html');
fs.writeFileSync(tmp, html);
const outPath = path.join(HERE, 'resume.pdf');
(async () => {
  let pages = 0;
  try {
    await withChrome(async (send) => {
      await send('Page.enable');
      await send('Runtime.enable');
      await send('Page.navigate', { url: 'file://' + tmp });
      await settle(1500);
      const r = await send('Runtime.evaluate', {
        expression: `document.fonts.ready.then(() => [...document.fonts].filter((f) => f.status === 'loaded')
          .map((f) => f.family.replace(/"/g, '')).join(','))`, awaitPromise: true, returnByValue: true }, 30000);
      const loaded = (r && r.result && r.result.value) || '';
      if (!/(^|,)Inter(,|$)/.test(loaded) || !/Inter Display/.test(loaded)) throw new Error('build-pdf REFUSES: Inter did not load (loaded: "' + loaded + '")');
      const pdf = await send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true,
        displayHeaderFooter: true, headerTemplate: '<span></span>', footerTemplate: footer });
      const buf = Buffer.from(pdf.data, 'base64');
      pages = (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
      fs.writeFileSync(outPath, buf);
    }, { port: 9231 });
  } finally {
    fs.unlinkSync(tmp);
  }
  const left = (md.match(/\[OPERATOR[^\]]*\]/g) || []).length;
  console.log(outPath + ' written, ' + pages + ' page(s)' + (left ? ` — ${left} placeholder(s) still marked in yellow` : ' — no placeholders left'));
})().catch((e) => { console.error(e.message || e); process.exit(1); });
