/* marketing.js — the pages that are marketing touchpoints, said once.
   design/ · cert-machine · 2026-10-31

   THE RULING. The operator, 2026-10-31, on /verify/: "No need to pin everything on Verify LP, this is a mkt touchpoint
   and the focus now is content and visuals." A page on this list shows no record line, no stop sentence and no reasons
   block: its numbers are still READ from their records by its builder, its builder's refusals still stop the build, and
   every value still carries its record address (data-rec / data-derived, re-read by tools/check-marks.js) and every
   figure its data-record attribute. Only the visible pins go.

   WHO READS IT. The page's builder (tools/verify-page.js refuses to build unpinned unless its page is here) and the one
   gate that requires a visible pin: tools/check-grammar.js's marks census skips the stop-sentence count (figNoStop,
   R23/R30) for these pages and nothing else. Every other check (colours, dash patterns, unpointed values, witness rules,
   overflow, the ruler) reads these pages like any other.

   A page is added here only by the operator's word, quoted with its date.                                        MIT */
'use strict';

const PAGES = {
  'verify/index.html': {
    url: '/verify/',
    ruled: '2026-10-31',
    quote: 'No need to pin everything on Verify LP, this is a mkt touchpoint and the focus now is content and visuals.',
  },
};

/* `rel`: a built page's path relative to site/ ("verify/index.html"), either separator */
const isMarketing = (rel) => Object.prototype.hasOwnProperty.call(PAGES, String(rel).split('\\').join('/').replace(/^\/+/, ''));
const byUrl = (url) => Object.keys(PAGES).find((k) => PAGES[k].url === url) || null;

module.exports = { PAGES, isMarketing, byUrl };
