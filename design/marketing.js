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
  /* the home page (2026-11-11). The operator's decisions for the new home page reached its builder through the session
     that briefed it; the sentence below is that brief's, relaying him, and waits for his own words. */
  'index.html': {
    url: '/',
    ruled: '2026-11-11',
    quote: 'The homepage is marketing in the sense of /verify/: no visible pins, hashes or stop lines on it; no commit links typed into the copy.',
    relayed: 'the session brief of 2026-11-11, relaying the operator\'s decisions for the home page',
  },
  /* the live R(3,10) page (2026-11-23, unlisted until the control room publishes it). Its rigor is one click down, in
     its "why you can trust this" layer, where every record and hash is listed; the sentence is the brief's, relaying him */
  'r310/index.html': {
    url: '/r310/',
    ruled: '2026-11-23',
    quote: 'Rigor one click down (the "why you can trust this" layer); no commit links on the page; block heights are fine, hashes only one click down.',
    relayed: 'the control room\'s brief of 2026-11-23 for the live R(3,10) page, relaying the operator\'s decisions',
  },
  /* the live VP ≠ VNP audit page (2026-11-23, public and listed). Its rigor is one click down, in its "why you can
     trust this" layer, where every record, seal and script is listed with its hash; the operator chose the option in
     the control room's dialog */
  'vp-vnp/index.html': {
    url: '/vp-vnp/',
    ruled: '2026-11-23',
    quote: 'Public and listed (Recommended)',
    relayed: 'the operator\'s choice in the control room\'s dialog of 2026-11-23 ("How should the new /vp-vnp/ page go up tonight?"), with the brief\'s rule: rigor one click down, no hashes or commit links on the surface',
  },
  /* the live ω = 9/4 audit page (2026-11-25, public and listed). Its rigor is one click down, in its "why you can trust
     this" layer, where every record, seal, source and script is listed with its hash; the operator's words reached the
     builder through the control room's brief */
  'omega/index.html': {
    url: '/omega/',
    ruled: '2026-11-25',
    quote: 'We need to build the live page as soon as we can. And keep updating. We must put the flag first.',
    relayed: 'the control room\'s brief of 2026-11-25 for the live ω = 9/4 page, relaying the operator, with the template\'s rule: no hashes on the surface, rigor one click down in "Why you can trust this"',
  },
  /* the live δ₃-in-HOL4 page (2026-11-25, public and listed): the checker and its blind proving benchmark. Its rigor is
     one click down, in its "why you can trust this" layer, where every record and source is listed with its hash; the
     operator's words (quoted in part) reached the builder through the control room's brief */
  'delta3-hol4/index.html': {
    url: '/delta3-hol4/',
    ruled: '2026-11-25',
    quote: 'Let\'s start building and publish live already so we gain time.',
    relayed: 'the control room\'s brief of 2026-11-25 for the live δ₃-in-HOL4 page (hol4/delta3/LIVE-PAGE-BRIEF.md), relaying the operator, with its rules: no commit hashes or commit links on the page, rigor one click down in "Why you can trust this"',
  },
  'extremos/index.html': {
    url: '/extremos/',
    ruled: '2026-11-04',
    quote: 'Build an unlisted pt-br page showing what are the solutions we can offer. Highly visual, examples on page. Do not talk about project structure, we are offering tools and solutions.',
  },
};

/* `rel`: a built page's path relative to site/ ("verify/index.html"), either separator */
const isMarketing = (rel) => Object.prototype.hasOwnProperty.call(PAGES, String(rel).split('\\').join('/').replace(/^\/+/, ''));
const byUrl = (url) => Object.keys(PAGES).find((k) => PAGES[k].url === url) || null;

module.exports = { PAGES, isMarketing, byUrl };
