#!/usr/bin/env node
/* build-papers-index.js — /papers/: the index of the pre-papers, for the people
   reviewing them. Rendered from paper/INDEX.json (the manifest: title,
   description, status, form, the records each paper is interpolated from) and
   from the PDFs in paper/ (size and page count read from the file, never typed);
   a listed paper whose PDF is missing refuses the build, as does a PDF in
   paper/ that the manifest does not list, so the shelf and the index cannot
   drift apart. Served by tools/build-site.js at /papers/ beside the PDFs at
   /paper/<name>.pdf.
   usage: node tools/build-papers-index.js        writes site/papers/index.html
          require(...).html()                     the page, for the site build */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const esc = C.esc;
const GITHUB = 'https://github.com/carlostoledo1891/cert-machine';
const die = (m) => { throw new Error('PAPERS INDEX REFUSED: ' + m); };

function pdfPages(file) {
  /* tectonic writes compressed object streams, so the page count is read by poppler's pdfinfo (the same
     toolkit the layout gates use to rasterise pages); the build refuses rather than guess without it */
  const r = cp.spawnSync('pdfinfo', [file]);
  if (r.status !== 0) die('pdfinfo (poppler) is needed to count the pages of ' + path.basename(file) + ': ' + String(r.stderr || r.error || '').slice(0, 200));
  const m = /Pages:\s+(\d+)/.exec(String(r.stdout));
  return m ? Number(m[1]) : 0;
}
const kb = (n) => (n >= 1024 * 1024 ? (n / 1024 / 1024).toFixed(1) + ' MB' : Math.round(n / 1024) + ' KB');

function load() {
  const M = JSON.parse(fs.readFileSync(path.join(ROOT, 'paper', 'INDEX.json'), 'utf8'));
  const listed = new Set();
  for (const p of M.papers) {
    if (!M.groups.find((g) => g.id === p.group)) die(p.name + ' names a group the manifest does not define: ' + p.group);
    if (p.nopdf) { p.pdf = null; continue; }
    const file = path.join(ROOT, 'paper', p.name + '.pdf');
    if (!fs.existsSync(file)) die(p.name + ' is listed but paper/' + p.name + '.pdf does not exist');
    p.pdf = { href: '/paper/' + p.name + '.pdf', bytes: fs.statSync(file).size, pages: pdfPages(file), mtime: fs.statSync(file).mtime.toISOString().slice(0, 10) };
    if (!(p.pdf.pages > 0)) die(p.name + '.pdf has no readable page objects');
    listed.add(p.name + '.pdf');
  }
  for (const f of fs.readdirSync(path.join(ROOT, 'paper'))) if (f.endsWith('.pdf') && !listed.has(f)) die('paper/' + f + ' is on the shelf but not in paper/INDEX.json');
  return M;
}

function html() {
  const M = load();
  const git = (() => { try { return cp.execSync('git rev-parse --short=12 HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
  const withPdf = M.papers.filter((p) => p.pdf);
  const pages = withPdf.reduce((s, p) => s + p.pdf.pages, 0);
  const records = new Set(M.papers.flatMap((p) => p.records || []));
  const B = [];
  B.push(C.header({
    eyebrow: 'cert-machine · the pre-papers · for review',
    title: 'Every result that can stand as a paper, as a paper.',
    deck: 'Review drafts, built from the records: each number in each manuscript is interpolated at build time from a certificate or ledger in the public repository, and the build refuses when a record no longer supports a sentence. Author lists and roles are to be agreed with the reviewing group; nothing on this shelf has been submitted anywhere.'
  }));
  B.push(C.stats([
    { k: 'papers on the shelf', v: String(withPdf.length), n: 'PDFs served beside this page; ' + (M.papers.length - withPdf.length) + ' earlier markdown drafts listed below' },
    { k: 'pages', v: pages.toLocaleString('en-US'), n: 'counted from the PDF files at this build' },
    { k: 'records cited', v: String(records.size), n: 'certificates and ledgers the manuscripts read their numbers from' },
    { k: 'submitted', v: '0', n: 'drafts for review; every send waits on the authors' }
  ]));
  B.push(C.section({
    lab: 'how to read this shelf', title: 'What a draft is here, and what it is not',
    bodyRaw: C.pRaw('Each paper has a report page on this site where the same record is recomputed at every build, and a LaTeX source in the repository whose numbers are macros written by a tool from that record (<span class="m">tools/build-paper-numbers.js</span> and <span class="m">tools/paper-numbers/</span>). The prose is authored and should be reviewed like any other; the numbers cannot be typed. "Certified" is used in its mathematical sense only, defined once per paper; the published work of others is re-decided, never corrected. The forms: <em>Elsevier</em> drafts use the elsarticle preprint layout with highlights, keywords and the required declarations; <em>article</em> drafts use the house preamble with theorem environments. A status of "draft v0.1" means the first complete text; "outside audit" means a group with no shared code re-derived the record.')
  }));
  for (const g of M.groups) {
    const list = M.papers.filter((p) => p.group === g.id);
    if (!list.length) continue;
    const rows = list.map((p) => {
      const links = [];
      if (p.pdf) links.push('<a href="' + p.pdf.href + '">PDF</a>');
      if (p.report) links.push('<a href="' + esc(p.report) + '">report</a>');
      if (p.tex) links.push('<a href="' + GITHUB + '/blob/main/' + esc(p.tex) + '">source</a>');
      for (const r of p.records || []) links.push('<a href="' + GITHUB + '/blob/main/' + esc(r) + '">' + esc(path.basename(r)) + '</a>');
      const meta = [p.status, p.venue ? 'for ' + p.venue : null, p.pdf ? p.pdf.pages + ' pp · ' + kb(p.pdf.bytes) : 'markdown, no PDF'].filter(Boolean).join(' · ');
      return [
        { raw: '<b>' + esc(p.title) + '</b><br><span class="scope">' + esc(p.desc) + '</span>' },
        { raw: esc(meta) + '<br>' + links.join(' · ') }
      ];
    });
    B.push(C.section({ lab: g.lab, title: g.title, wide: true, bodyRaw: '<div class="col">' + C.p(g.note) + '</div>' + C.table({ cols: [{ h: 'paper' }, { h: 'status · links' }], rows }) }));
  }
  B.push(C.note({ lab: 'for the reviewers', bodyRaw: C.pRaw('Read the PDF; where a number looks wrong, open the record it names — the manuscript cannot say what the record does not. Comments on prose, framing, missing literature and venue are what these drafts need most. The repository is <a href="' + GITHUB + '">public</a>; the drafts are rebuilt with <span class="m">make papers</span>.') }));
  const foot = '<p>Generated by tools/build-papers-index.js from paper/INDEX.json and the PDFs in paper/ @ git ' + git + '. Every status line is the manifest\'s; every page count and size is the file\'s.</p>';
  return TPL.render({ title: 'The pre-papers · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot, path: '/papers/',
    desc: 'The pre-papers of cert-machine for review: certified return levels, the decision procedure, 4D detectability, the λ values, Erdős problems 1, 290, 852 and 1038, the kissing records, the Jacobian counterexamples, the mean-field-game theorems and more — each a draft whose every number is interpolated from a public record.' });
}

if (require.main === module) {
  const out = path.join(ROOT, 'site', 'papers', 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const h = html();
  fs.writeFileSync(out, h);
  console.log('site/papers/index.html written (' + Math.round(h.length / 1024) + ' KB)');
}
module.exports = { html, load };
