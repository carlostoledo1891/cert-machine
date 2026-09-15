/* base.js — THE foundation every page stands on, once.
   design/ · cert-machine · 2026-09-15

   WHY. The site ships two stylesheets — the reports' `template.css()` and
   /instruments' base layer — and they never meet on a page, so nobody saw
   that they described the SAME four things differently:

     `*`          box-sizing, declared in both (and in six page sheets before
                  2026-09-05, which is how one page shipped content-box and
                  sat 48px off the site's left edge).
     `body`       the ground, the ink, the face, the size, the leading. The
                  reports' copy carried literals (0.9375rem, 1.65) where the
                  instruments' used the scale tokens, and only the reports'
                  set text-rendering and the two smoothing properties.
     `.eyebrow`   one letter-spacing on one side and the token on the other.
     `.tw`        the scroll-affordance shadows exist on /instruments and NOT
                  on the reports — so a report table that hides a column says
                  nothing about it, which is the exact defect the affordance
                  was built for on 2026-09-04.

   A rule defined twice WILL diverge (the corpus.js lesson, in the house
   rules since August). This file is the one description; both sheets take it.

   THE NAV OFFSET LIVES WITH THE NAV. The bar is fixed at 60px, and that
   number was written in three places: `nav.js` (the bar itself), `shell.css`
   (`body{padding-top:60px}`) and `template.js` (`.page{padding-top:calc(pad +
   60px)}`). It is `--nav-h` now, emitted by nav.js beside the bar, and the
   body clears it once. A VIEWPORT page (an instrument that fills the window)
   sets `body{padding-top:0}` and means it.                                */
'use strict';

const T = require('./tokens.js');

/* the reset, the ground, the type, the selection colour, the table wrapper
   and the eyebrow — the things every page has whichever sheet it takes */
function baseCss() {
  return `
*,*::before,*::after{box-sizing:border-box}
html{color-scheme:dark;-webkit-text-size-adjust:100%}
body{margin:0;padding-top:var(--nav-h);background:var(--paper);color:var(--ink-2);
  font-family:var(--f-sans);font-size:var(--text-body);line-height:var(--leading-body);
  font-weight:var(--weight-body);
  -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility}
::selection{background:var(--ink);color:var(--paper)}
img{max-width:100%}

.eyebrow,.lab{font-family:var(--f-mono);font-size:var(--text-eyebrow);font-weight:var(--weight-mono);
  letter-spacing:var(--track-eyebrow);text-transform:uppercase;color:var(--ink-4)}

/* ---- THE TABLE RULE, once (2026-09-04, and shared 2026-09-15) ------------
   A table is allowed to be wider than the page. It is not allowed to take the
   page with it. AND IT SAYS THAT IT SCROLLS: the four layers are the standard
   scroll-shadow — two ground-coloured covers pinned to the CONTENT
   (background-attachment:local, so they slide away as you scroll) over two
   shadows pinned to the BOX, so a shadow shows exactly when there is
   something past that edge. A box that hides a column without saying so is
   the same defect as a number without its units. This shipped on
   /instruments on 2026-09-04 and NOT on the reports, for no reason anybody
   chose.                                                                  */
.tw{overflow-x:auto;-webkit-overflow-scrolling:touch;
  border:1px solid var(--rule);border-radius:var(--radius-m);margin:0 0 var(--s-5);
  background:
    linear-gradient(to right, var(--sunk) 40%, rgba(16,16,20,0)) left center / 44px 100% no-repeat local,
    linear-gradient(to left,  var(--sunk) 40%, rgba(16,16,20,0)) right center / 44px 100% no-repeat local,
    radial-gradient(farthest-side at 0 50%, rgba(246,246,248,0.13), rgba(246,246,248,0)) left center / 16px 100% no-repeat scroll,
    radial-gradient(farthest-side at 100% 50%, rgba(246,246,248,0.13), rgba(246,246,248,0)) right center / 16px 100% no-repeat scroll,
    var(--sunk)}
.tw > table{margin:0}
.tw th:first-child,.tw td:first-child{position:sticky;left:0;background:var(--sunk)}
`;
}

module.exports = { baseCss, T };
