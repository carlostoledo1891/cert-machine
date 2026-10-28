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

/* A DESCRIPTION SAYS ONLY WHAT ITS MANUSCRIPT PRINTS (WARRANT rule 8, 2026-10-28). The manuscripts' numbers are macros
   from the records; the one-paragraph descriptions on this page were typed into paper/INDEX.json, and seven of their
   numbers were not in the PDF they describe: a version the PDF had left ("v0.8" beside "draft v0.9"), two ratios
   rounded to three places (0.218, 0.137 for 0.217967, 0.136855), an upper bound rounded (1.8344305 for
   1.8344304971959906), a claimant's constant rounded where the paper prints 3.6960…, 8.9·10⁻⁷ for the 8.85·10⁻⁷ the
   paper prints, and 204 for 204.0. So every number in a description must be a number its PDF prints, token for token
   (thousands separators aside; identifiers after "Erdős", "issue", "#", "Theorem" and the like are names, not
   quantities), and a version it names must be the status line's. The PDF's text is read by poppler's pdftotext. */
const numTokens = (s) => String(s).normalize('NFKC').replace(/(\d)[,    ](?=\d{3}(?!\d))/g, '$1');
const NUM_RE = /(?<![\w.])\d+(?:\.\d+)?(?![\w])/g;
const IDENT = /(Erdős|Erdos|problem|Problem|issue|#|arXiv:?|Theorem|Section|Remark|Table|Appendix|Lemma|Proposition|Corollary|Definition|Figure|PR|pull request)\s*$/;
function descNumbersInPdf(p, file) {
  const r = cp.spawnSync('pdftotext', ['-q', file, '-']);
  if (r.status !== 0) die('pdftotext (poppler) is needed to read ' + path.basename(file) + ': ' + String(r.stderr || r.error || '').slice(0, 200));
  const printed = new Set(numTokens(r.stdout).match(NUM_RE) || []);
  const d = numTokens(p.desc), bad = [];
  for (const m of d.matchAll(NUM_RE)) if (!IDENT.test(d.slice(0, m.index)) && !printed.has(m[0])) bad.push(m[0]);
  const v = /\bv(\d+\.\d+)\b/.exec(p.desc);
  if (v && !String(p.status).includes('v' + v[1])) bad.push('v' + v[1] + ' (the status says ' + p.status.split('·')[0].trim() + ')');
  if (bad.length) die(p.name + ': its description in paper/INDEX.json states ' + bad.join(', ') + ', which ' + path.basename(file) + ' does not print');
}

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
    descNumbersInPdf(p, file);
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
  /* "submitted: 0" was typed; it is read now from the status lines the manifest gives, and a status that says a paper went
     to a venue, is under review or was accepted makes it move. The deck said EACH manuscript's numbers are interpolated:
     the markdown drafts below are kept as written, so the sentence names the PDFs. */
  const submitted = M.papers.filter((p) => /\b(submitted to|under review|accepted (by|at|in))\b/i.test(p.status) || (/\bsubmitted\b/i.test(p.status) && !/\bnot submitted\b/i.test(p.status))).length;
  const md = M.papers.length - withPdf.length;
  B.push(C.header({
    eyebrow: 'Carlos Toledo · papers',
    title: 'Papers',
    deck: 'Review drafts, built from the records: each number in each PDF manuscript is interpolated at build time from a certificate or ledger in the public repository, and the build refuses when a record no longer supports a sentence'
      + (md ? '; the ' + (md === 2 ? 'two' : md) + ' earlier markdown draft' + (md === 1 ? ' is' : 's are') + ' kept as written' : '') + '. Author lists and roles are to be agreed with the reviewing group; '
      + (submitted ? submitted + ' of these ha' + (submitted === 1 ? 's' : 've') + ' been submitted.' : 'nothing on this shelf has been submitted anywhere.')
  }));
  B.push(C.stats([
    { k: 'papers', v: String(withPdf.length), n: 'PDFs served beside this page; ' + md + ' earlier markdown drafts listed below' },
    { k: 'pages', v: pages.toLocaleString('en-US'), n: 'counted from the PDF files at this build' },
    { k: 'records cited', v: String(records.size), n: 'certificates and ledgers the manuscripts read their numbers from' },
    { k: 'submitted', v: String(submitted), n: submitted ? 'read from the status lines below' : 'every manuscript is a draft; authors to be agreed; no status line below says a paper went to a venue' }
  ]));
  B.push(C.section({
    lab: 'how to read this page', title: 'What a draft is here, and what it is not',
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
    B.push(C.section({ lab: g.lab, title: g.title, wide: true, bodyRaw: '<div class="col">' + C.p(g.note) + '</div>' + C.table({ cols: [{ h: 'paper' }, { h: 'status · links', cls: 'meta' }], rows }) }));
  }
  B.push(C.note({ lab: 'for the reviewers', bodyRaw: C.pRaw('Read the PDF; where a number looks wrong, open the record it names — the manuscript cannot say what the record does not. Comments on prose, framing, missing literature and venue are what these drafts need most. The repository is <a href="' + GITHUB + '">public</a>; the drafts are rebuilt with <span class="m">make papers</span>.') }));
  const foot = '<p>Generated by tools/build-papers-index.js from paper/INDEX.json and the PDFs in paper/ @ git ' + git + '. Every status line is the manifest\'s; every page count and size is the file\'s.</p>';
  return TPL.render({ cssRaw: '.tw td.meta,.tw th.meta{width:27%}', title: 'Papers', bodyRaw: B.join('\n\n'), footRaw: foot, path: '/papers/',
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
