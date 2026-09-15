/* footer.js — THE page footer, once: the markup and the CSS.
   design/ · cert-machine · 2026-09-15

   WHY. Ninety built pages carried TWENTY-FIVE distinct footer markups: the
   report side wrote `<footer class="col">` in 59 builders (two wrote a bare
   `<footer>`), nine of them appended a byline paragraph with an inline style,
   /instruments carried a `footer.foot` from its own shell plus five private
   variants, and one page had no footer at all. Same as the nav on 2026-09-05:
   a shared component with a per-shell copy is the same defect one level down.

   So: one function returns the footer, one function returns its rules, and
   both shells emit it. A builder passes only what is ITS OWN — the paragraphs
   that say how the page was generated and what gates it — and the site line
   (the byline, the source, the DOI) is the component's.                    */
'use strict';

const { GITHUB } = require('./nav.js');
const CONCEPT_DOI = 'https://doi.org/10.5281/zenodo.22225860';

/* `innerRaw` is markup the builder generated (paragraphs); `root` is the
   relative prefix back to the site root, as for the nav. */
function footerHtml({ innerRaw = '', root = '' } = {}) {
  return '<footer class="foot"><div class="foot-in">'
    + (innerRaw ? '<div class="foot-body">' + innerRaw + '</div>' : '')
    + '<div class="foot-line">'
    + '<span>Carlos Toledo · cert-machine</span>'
    + '<a href="' + root + 'index.html">home</a>'
    + '<a href="' + GITHUB + '">source</a>'
    + '<a href="' + CONCEPT_DOI + '">doi 10.5281/zenodo.22225860</a>'
    + '</div></div></footer>';
}

/* The look is the report footer's — mono, eyebrow-size, uppercase, ink-5 —
   which was the majority form. The container is the footer's own, so it sits
   on the page's left edge on both shells without a wrapper from the caller. */
function footerCss() {
  return `
.foot{margin-top:var(--section-pad);border-top:1px solid var(--rule);padding:var(--s-6) 0 var(--s-8);
  color:var(--ink-5);font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);
  line-height:var(--leading-loose);text-transform:uppercase}
.foot-in{max-width:var(--container);margin:0 auto;padding:0 var(--gutter)}
.foot-body p{margin:0 0 var(--s-3)}
.foot-line{display:flex;flex-wrap:wrap;gap:var(--s-2) var(--s-5);margin-top:var(--s-4)}
.foot a{color:var(--ink-3);border-bottom:1px solid var(--rule-strong);text-transform:none;letter-spacing:var(--track-slight);text-decoration:none}
.foot a:hover{color:var(--ink);border-bottom-color:var(--ink)}
`;
}

module.exports = { footerHtml, footerCss, CONCEPT_DOI };
