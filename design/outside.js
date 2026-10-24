/* outside.js — what has come back from outside, for any page: the independent re-runs of our claims
   (corpus/external-reruns.json) and the public credits (corpus/recognition.json), read once, checked once.

   WHY ONE MODULE (2026-10-24). The landing, the about page and every report that was re-run or credited show the
   same facts; written per page they would diverge (the corpus.js lesson). And a credit is a claim about what someone
   else wrote, so it is held like any other: each row quotes its source VERBATIM, the source is a snapshot pinned in
   corpus/sources/PINS.json, and load() refuses a row whose quote is not in the pinned bytes, whose pin has drifted, or
   whose page does not exist. A re-run belongs to a page through its register rows (certs/claims-ledger.json gives the
   page) or an explicit `pages` list.

   MIT licensed. Part of cert-machine. */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PIN = require(path.join(ROOT, 'instruments', 'pin.js'));
const KINDS = { registry: 'Cited by a registry', credit: 'Credited by the claimant', peer: 'Noted by an independent replayer', listing: 'Listed' };

let cached = null;

function load() {
  if (cached) return cached;
  const J = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  const REC = J('corpus/recognition.json');
  const EXT = J('corpus/external-reruns.json');
  const REG = J('certs/claims-ledger.json');
  const pageOf = new Map(REG.rows.map((r) => [r.id, String(r.page || '').replace(/^\//, '').replace(/#.*$/, '')]));
  const isPage = (p) => /^reports\/[\w.-]+\.html$/.test(p) && fs.existsSync(path.join(ROOT, p));
  const credits = REC.rows.map((r) => {
    for (const k of ['id', 'date', 'kind', 'who', 'what', 'quote', 'source', 'url']) if (!r[k]) throw new Error('outside.js: credit ' + (r.id || '?') + ' lacks ' + k);
    if (!KINDS[r.kind]) throw new Error('outside.js: credit ' + r.id + ' has a kind outside ' + Object.keys(KINDS).join('/'));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date)) throw new Error('outside.js: credit ' + r.id + ' date is not ISO');
    const v = PIN.verify(r.source);
    if (!v.ok) throw new Error('outside.js: credit ' + r.id + ': ' + v.why);
    if (!fs.readFileSync(path.join(ROOT, 'corpus', 'sources', r.source), 'utf8').includes(r.quote)) throw new Error('outside.js: credit ' + r.id + ': the quote is not in its pinned source');
    for (const p of r.pages || []) if (!isPage(p)) throw new Error('outside.js: credit ' + r.id + ' names a page that does not exist: ' + p);
    return r;
  });
  const reruns = EXT.map((x) => {
    const pages = new Set(x.pages || []);
    for (const id of x.rows || []) { const p = pageOf.get(id); if (p) pages.add(p); }
    for (const p of pages) if (!isPage(p)) throw new Error('outside.js: re-run by ' + x.who + ' names a page that does not exist: ' + p);
    return Object.assign({}, x, { pages: [...pages] });
  });
  cached = { credits, reruns, KINDS };
  return cached;
}

/* a quote as a reader sees it: markdown links to their text, emphasis and heading marks dropped */
const plain = (q) => q.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*/g, '').replace(/^#\s*/, '').replace(/\s+/g, ' ').trim();
/* a party named at the start of a line */
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function forPage(file) {
  const L = load();
  return { credits: L.credits.filter((r) => (r.pages || []).includes(file)), reruns: L.reruns.filter((x) => x.pages.includes(file)) };
}

/* the items a page lists: re-runs first (they re-derived a verdict), then credits; C is design/components.js */
function items(C, { credits, reruns }) {
  return [
    ...reruns.map((x) => ({ b: 'Re-run independently, ' + x.date + '.', raw: C.esc(x.who) + ': ' + C.esc(x.what) + ' Outcome: ' + C.esc(x.outcome) + '. '
      + '(<a href="' + C.escAttr(x.where) + '">their code</a>' + (x.posted && x.posted !== x.where ? ' · <a href="' + C.escAttr(x.posted) + '">the report</a>' : '') + ')' })),
    ...credits.map((r) => ({ b: KINDS[r.kind] + ', ' + r.date + '.', raw: C.esc(cap(r.who)) + ': ' + C.esc(r.what) + ' In their words: “' + C.esc(plain(r.quote)) + '” '
      + '(<a href="' + C.escAttr(r.url) + '">the source</a>, pinned)' }))
  ];
}

/* a report's section, or '' when nothing has come back for it */
function section(C, file, { lab = 'outside', title = 'What has come back from outside' } = {}) {
  const f = forPage(file);
  if (!f.credits.length && !f.reruns.length) return '';
  return C.section({ lab, title, bodyRaw: C.plainList(items(C, f))
    + C.pRaw('Each credit is quoted from a snapshot pinned by sha256 (corpus/recognition.json); each re-run is a row of corpus/external-reruns.json. Neither is a peer review.') });
}

module.exports = { load, forPage, items, section, plain, cap, KINDS };
