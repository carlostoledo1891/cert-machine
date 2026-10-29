/* sheet.js — the SITE's part of a page's stylesheet, composed in one place and re-baked at sync.
   design/ · cert-machine · 2026-10-29

   WHY. design/refresh.js re-bakes the title, the nav and the footer into a committed page on its way to site/, because
   those three are the site's, not the page's, and a change to them re-applied only as each builder happened to re-run
   was weeks of drift. The stylesheet was the fourth site-owned thing on every page and was not re-baked: the chip
   border and the flow dot of 2026-10-29 needed every builder to re-run (about eighty), and the grammar's two D11 rules
   would have needed it again. So the site's part of the <style> block is now written between markers that name what
   it was composed from, and refresh() composes it again from today's modules and replaces it. A page built before the
   markers existed passes through untouched until its builder next runs.

     @site-css sheet=report grammar=1        (an opening marker, in a CSS comment) the tokens (design/tokens.js
                                             rootCss), the sheet (template.js css() for 'report', footer.js
                                             footerCss() for 'own'), the grammar's stylesheet (playground/warrant.js
                                             css()) when the page uses a w-* mark
     @/site-css                              (the closing marker)
     …the page's own cssRaw…
     @site-util … @/site-util                the utility layer, last on both sheets (components.js utilCss())

   `grammar` is decided at render from the body (W.usesGrammar) and recorded in the marker, so the re-bake never has
   to re-read the body to know whether the grammar sheet belongs on the page.                                    MIT */
'use strict';

const OPEN = (sheet, grammar) => `/* @site-css sheet=${sheet} grammar=${grammar ? 1 : 0} */`;
const CLOSE = '/* @/site-css */';
const UOPEN = '/* @site-util */', UCLOSE = '/* @/site-util */';

/* the site's part, composed from today's modules; the requires are lazy because template.js requires refresh.js
   which requires this file */
function siteCss(sheet, grammar) {
  const T = require('./tokens.js');
  const TPL = require('./template.js');
  const FOOT = require('./footer.js');
  const W = require('../playground/warrant.js');
  return T.rootCss() + '\n\n' + (sheet === 'report' ? TPL.css() : FOOT.footerCss()) + (grammar ? '\n' + W.css() : '');
}
const utilCss = () => require('../playground/design/components.js').utilCss();

/* the whole <style> body for a fresh render */
function compose({ sheet, grammar, cssRaw }) {
  return OPEN(sheet, grammar) + '\n' + siteCss(sheet, grammar) + '\n' + CLOSE
    + (cssRaw ? '\n' + cssRaw : '') + '\n' + UOPEN + '\n' + utilCss() + '\n' + UCLOSE;
}

/* the re-bake: a page carrying the markers gets today's site css and utility layer; any other page is returned as is.
   Returns { html, rebaked } so a sync can count. */
function rebake(html) {
  const m = /\/\* @site-css sheet=(report|own) grammar=([01]) \*\/[\s\S]*?\/\* @\/site-css \*\//.exec(html);
  if (!m) return { html, rebaked: false };
  let out = html.replace(m[0], () => OPEN(m[1], m[2] === '1') + '\n' + siteCss(m[1], m[2] === '1') + '\n' + CLOSE);
  const u = /\/\* @site-util \*\/[\s\S]*?\/\* @\/site-util \*\//.exec(out);
  if (u) out = out.replace(u[0], () => UOPEN + '\n' + utilCss() + '\n' + UCLOSE);
  return { html: out, rebaked: out !== html };
}

module.exports = { compose, rebake, siteCss, utilCss, OPEN, CLOSE, UOPEN, UCLOSE };

/* node design/sheet.js --selftest: a page rendered today, its site css tampered, must re-bake back byte for byte;
   a page without markers must come back untouched (a red control each way). */
if (require.main === module && process.argv.includes('--selftest')) {
  const TPL = require('./template.js');
  const page = TPL.render({ title: 'selftest', bodyRaw: '<p class="w-val w-computed">1</p>', footRaw: '<p>x</p>', desc: 'selftest', path: '/reports/selftest.html', cssRaw: '.mine{color:red}' });
  const m = /\/\* @site-css sheet=report grammar=1 \*\//.exec(page);
  if (!m) { console.log('FAIL  the rendered page carries no marker'); process.exit(1); }
  const tampered = page.replace(CLOSE, '.stale{border:1px dashed red}\n' + CLOSE).replace(UCLOSE, '.u{x:y}\n' + UCLOSE);
  const back = rebake(tampered);
  const ok1 = back.rebaked && back.html === page;
  const plain = '<html><head><style>.a{}</style></head><body></body></html>';
  const ok2 = !rebake(plain).rebaked && rebake(plain).html === plain;
  const ok3 = back.html.includes('.mine{color:red}');
  console.log((ok1 ? 'PASS' : 'FAIL') + '  a tampered site stylesheet re-bakes back to today\'s, byte for byte');
  console.log((ok3 ? 'PASS' : 'FAIL') + '  the page\'s own css survives the re-bake');
  console.log((ok2 ? 'PASS' : 'FAIL') + '  a page without markers is returned untouched (red control)');
  process.exit(ok1 && ok2 && ok3 ? 0 : 1);
}
