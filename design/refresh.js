/* refresh.js — what a committed page picks up on its way to site/, in one function.
   design/ · cert-machine · 2026-10-16

   WHY. Eighty-three report pages are built by seventy-six builders and committed; the site sync copies them.
   Three things on every page are the SITE's, not the page's — the title registry, the navigation and the
   footer line — and each changed today. A change to the nav label, re-baked into 83 pages only as each builder
   happens to re-run, is 83 pages of drift for weeks. So the three are applied to the rendered page by this one
   function, called from two places: design/template.js render() for a fresh page and tools/build-site.js for
   a committed one. Idempotent, so the two agree byte for byte. The nav and footer markup replaced here are the
   elements nav.js and footer.js emit, matched whole; a page without them passes through untouched. */
'use strict';

const NAVJS = require('./nav.js');
const FOOT = require('./footer.js');
const TITLES = require('./titles.js');

function rootOf(p) {
  const depth = String(p || '/').replace(/^\/|[^/]*$/g, '').split('/').filter(Boolean).length;
  return '../'.repeat(depth);
}
function sectionOf(p) {
  const m = /^\/(reports|instruments|machine|grammar|about)\b/.exec(p || '');
  return m ? m[1] : '';
}

function refresh(html, pagePath) {
  let out = TITLES.retitle(html, pagePath);
  if (!pagePath) return out;
  const root = rootOf(pagePath);
  /* the nav, whole — nav.js's element is the only <nav class="topnav"> on a page */
  const nav = NAVJS.navHtml({ here: sectionOf(pagePath), root });
  out = out.replace(/<nav class="topnav">[\s\S]*?<\/nav>/, () => nav);
  /* the footer's site line (byline · home · papers · source · doi); the builder's own paragraphs above it stay */
  const line = FOOT.footerHtml({ innerRaw: '', root }).replace(/^[\s\S]*?(<div class="foot-line">)/, '$1');
  out = out.replace(/<div class="foot-line">[\s\S]*?<\/div><\/div><\/footer>/, () => line);
  /* the stylesheet's site part and the utility layer (design/sheet.js markers, 2026-10-29); a page built before the
     markers passes through, and picks them up when its builder next runs */
  const rb = require('./sheet.js').rebake(out);
  if (rb.rebaked) refresh.rebaked = (refresh.rebaked || 0) + 1;
  /* a standing legend with no \`from\` is derived from the page's own marks (R20, 2026-10-30) */
  /* a value's reason that only a tooltip carried is said once at its section's end (R22, 2026-10-30, design/reasons.js) */
  return require('./reasons.js').deriveReasons(require('../playground/warrant.js').deriveLegends(rb.html));
}

module.exports = { refresh, rootOf, sectionOf };
