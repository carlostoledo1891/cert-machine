/* titles.js — THE TITLE REGISTRY, applied: one formal title per report page.
   design/ · cert-machine · 2026-10-16

   WHY. Eighty-three reports carried eighty-three editorial titles ("The
   constant that was a rounding error", "Five asterisks, replayed", "Their
   tables, re-decided") and three different <title> suffixes. Good standfirsts,
   bad titles: they named no object, did not survive a search result or a
   citation, and a reader scanning the index could not tell what was decided.
   The 2026-10-16 positioning plan (notes/positioning-plan-2026-10-16.md)
   ruled: title = object + what was decided; the editorial line is demoted to a
   standfirst under it; the suffix is the person, once; URLs never change.

   HOW. Seventy-six builders each write their own <h1>; editing them one by one
   is the corpus.js lesson waiting to happen. So the registry is applied to the
   RENDERED page in exactly one function, retitle(html, path), called from two
   places: design/template.js render() — every page born from the template —
   and tools/build-site.js when it copies the committed reports/*.html into
   site/. It is idempotent: a page already carrying its registry title passes
   through unchanged, so a builder re-run and a site sync agree byte for byte.

   THE GATE. `was` in design/titles.json is the H1 the builder writes. A page
   whose H1 is neither `was` nor `title` is a builder that changed its headline
   under the registry's feet, and the function refuses rather than guess. */
'use strict';

const fs = require('fs');
const path = require('path');

const REG = JSON.parse(fs.readFileSync(path.join(__dirname, 'titles.json'), 'utf8'));
const SUFFIX = ' · Carlos Toledo';
const OLD_SUFFIXES = [' · cert-machine', ' · Carlos Toledo', ' — cert-machine'];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => esc(s).replace(/"/g, '&quot;');
const unesc = (s) => String(s).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const textOf = (inner) => unesc(inner.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const stripSuffix = (t) => { let s = t; for (const x of OLD_SUFFIXES) if (s.endsWith(x)) s = s.slice(0, -x.length); return s.trim(); };
const same = (a, b) => a.replace(/\.$/, '').toLowerCase() === b.replace(/\.$/, '').toLowerCase();

function entryFor(pagePath) {
  if (!pagePath || !pagePath.startsWith('/reports/') || !pagePath.endsWith('.html')) return null;
  return REG.pages[pagePath.slice('/reports/'.length)] || null;
}

/* every title on the site, one suffix: the person. The root keeps the string
   its builder passes (the landing names itself). */
function fullTitle(bare, pagePath) {
  if (pagePath === '/') return bare;
  return stripSuffix(bare) + SUFFIX;
}

function retitle(html, pagePath) {
  const m = /<title>([^<]*)<\/title>/.exec(html);
  if (!m) return html;
  const oldFull = m[1];
  const e = entryFor(pagePath);
  const bare = e ? e.title : stripSuffix(unesc(oldFull));
  const newFull = fullTitle(bare, pagePath);
  let out = html;
  const swap = (from, to) => { if (from !== to) out = out.split(from).join(to); };
  swap('<title>' + oldFull + '</title>', '<title>' + esc(newFull) + '</title>');
  swap('property="og:title" content="' + escAttr(unesc(oldFull)) + '"', 'property="og:title" content="' + escAttr(newFull) + '"');
  swap('name="twitter:title" content="' + escAttr(unesc(oldFull)) + '"', 'name="twitter:title" content="' + escAttr(newFull) + '"');
  /* the JSON-LD headline is the bare title: a card's headline carries no site suffix */
  swap('"headline":' + JSON.stringify(unesc(oldFull)).replace(/</g, '\\u003c'), '"headline":' + JSON.stringify(bare).replace(/</g, '\\u003c'));
  if (!e) return out;
  const h = /<h1([^>]*)>([\s\S]*?)<\/h1>/.exec(out);
  if (!h) throw new Error('titles: ' + pagePath + ' has no <h1> to retitle');
  const text = textOf(h[2]);
  if (same(text, e.title)) return out;              /* already applied */
  if (!same(text, e.was)) {
    throw new Error('titles REFUSE: ' + pagePath + ' — its H1 is "' + text + '", the registry expects "' + e.was
      + '" (update design/titles.json `was` in the same commit as the builder)');
  }
  const sf = e.standfirst ? '\n<p class="standfirst">' + esc(e.standfirst) + '</p>' : '';
  out = out.slice(0, h.index) + '<h1' + h[1] + '>' + esc(e.title) + '</h1>' + sf + out.slice(h.index + h[0].length);
  if (sf && !out.includes('.standfirst{')) out = out.replace('</style>', STANDFIRST_CSS + '\n</style>');
  return out;
}

/* the registry for the index builders: [{file, title, standfirst, series, frozen}] */
function entries() {
  return Object.entries(REG.pages).map(([file, p]) => Object.assign({ file }, p));
}
const SERIES = REG._series;
const SERIES_ORDER = ['audits', 'evaluation', 'theorems', 'decisions', 'record'];

/* THE STANDFIRST'S RULE, ONCE. design/template.js css() interpolates it for
   every freshly rendered page; retitle() injects it into a committed page
   whose baked stylesheet predates it (the 83 reports were built before the
   registry existed), so a synced page and a re-rendered page style the line
   the same way. 1.125rem is tokens.js SCALE.deck; 82ch is LAYOUT.read. */
const STANDFIRST_CSS = '.standfirst{font-size:1.125rem;line-height:1.45;font-style:italic;color:var(--ink-4);margin:18px 0 0;'
  + 'max-width:82ch;text-wrap:pretty}';

module.exports = { retitle, entries, entryFor, fullTitle, SERIES, SERIES_ORDER, SUFFIX, STANDFIRST_CSS };
