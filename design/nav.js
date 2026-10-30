/* nav.js — THE top navigation, once: the links, the markup and the CSS.
   design/ · cert-machine · 2026-09-05

   WHY. The site had TWO navigations. Every report, the landing, /machine and
   /about carried the real one — brand, four links, a GitHub button, a CSS-only
   burger drawer. /instruments carried a different one: the word "instruments/"
   and a single link back. A reader who arrived on an instrument page could not
   get to the reports, the machine or the about page without going home first,
   and the section holding the most hireable material on the site was the one
   with no way out of it.

   The link list also lived inline in design/template.js's render(), which made
   it a list one file knew about — and the order in it was Reports, Machine,
   Instruments, About, which is neither the order of the site's argument nor
   the order anybody asked for.

   So: one module. The order is REPORTS · INSTRUMENTS · MACHINE · ABOUT —
   the audits first, the things you can touch second, the engine third, the
   person last. (2026-10-29: GRAMMAR joins after the method — how to read the
   marks the method makes.)

   THE CSS IS HERE TOO, and that is the point. A shared markup with a
   per-shell stylesheet is the same defect one level down; playground/design/
   shell.js emits navCss() and the report template interpolates it, so there
   is one nav and one description of it.                                     */
'use strict';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => esc(s).replace(/"/g, '&quot;');

const BRAND = 'Carlos Toledo';
const GITHUB = 'https://github.com/carlostoledo1891/cert-machine';

/* the order, and it is the site's argument: what was decided, what you can
   turn, what does the deciding, who did it */
const LINKS = [
  { t: 'Reports', to: 'reports/', here: 'reports' },
  { t: 'Instruments', to: 'instruments/', here: 'instruments' },
  { t: 'Method', to: 'machine/', here: 'machine' },   /* 2026-10-16: /machine/ is the method; the control page is /machine/log.html */
  { t: 'Grammar', to: 'grammar/', here: 'grammar' }, /* 2026-10-29: the visual grammar, how to read every mark, beside the method */
  { t: 'About', to: 'about/', here: 'about' },
];

const GH_ICON = '<svg width="17" height="17" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">'
  + '<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 '
  + '0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 '
  + '1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 '
  + '0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c'
  + '1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 '
  + '1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>';

/* THE THEME SWITCH (2026-10-30, the operator's word: the /grammar/ trial on every page). Three pieces, emitted with
   the nav so design/refresh.js re-bakes them into every committed page with it: the stored choice applied as the
   nav's first child, before anything on the page paints; the pill (a group of two buttons) right after the nav; the
   few lines that wire it. Dark is the default; the choice lives in localStorage "warrant-theme". The light values are
   design/tokens.js's (LIGHT_THEME); a page in its DARK_ONLY_PAGES takes none of the three and stays dark. A click
   dispatches the event "warrant-theme" on document (detail: "light" | "dark"): a canvas listens and repaints from the
   tokens (the operator, 2026-10-30: "redraw at once"); SVG and CSS follow the tokens by themselves. */
const THEME_KEY = 'warrant-theme';
const THEME_PRE = '<script>try{if(localStorage.getItem("' + THEME_KEY + '")==="light")document.documentElement.setAttribute("data-theme","light")}catch(e){}</script>';
const THEME_PILL = '<div class="theme-pill" role="group" aria-label="Colour theme"><button type="button" data-t="dark">Dark</button><button type="button" data-t="light">Light</button></div>';
const THEME_JS = '<script>(function(){var r=document.documentElement,bs=document.querySelectorAll(".theme-pill button");'
  + 'function set(t,keep){if(t==="light")r.setAttribute("data-theme","light");else r.removeAttribute("data-theme");'
  + 'for(var i=0;i<bs.length;i++)bs[i].setAttribute("aria-pressed",String(bs[i].getAttribute("data-t")===t));'
  + 'if(keep){try{localStorage.setItem("' + THEME_KEY + '",t)}catch(e){}document.dispatchEvent(new CustomEvent("' + THEME_KEY + '",{detail:t}))}}'
  + 'set(r.getAttribute("data-theme")==="light"?"light":"dark",false);'
  + 'for(var i=0;i<bs.length;i++)bs[i].addEventListener("click",function(){set(this.getAttribute("data-t"),true)})})();</script>';
/* the pill's rules, once: navCss() emits them under the report nav, design/app-shell.js under the app's top bar (the
   apps took the switch on 2026-10-30, the operator: "the apps take the light theme too"). The one parameter is the
   offset from the top: under the report nav it is the nav's height; in an app's bar, where --nav-h is not defined,
   the pill sits in the bar's own flow and takes none. */
const themeCss = (top) => `/* the theme pill: under the bar, its right edge at the gutter; on a phone it stays at the top of the page and scrolls
   away with it, never over the text (the /grammar/ trial's rules, 2026-10-30) */
.theme-pill{position:fixed;top:${top};right:var(--gutter);z-index:40;display:flex;padding:var(--s-1);gap:var(--s-1);
  background:var(--paper);border:1px solid var(--rule-strong);border-radius:var(--radius-pill)}
.theme-pill button{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);text-transform:uppercase;
  color:var(--ink-3);background:none;border:0;border-radius:var(--radius-pill);padding:var(--s-1) var(--s-3);cursor:pointer}
.theme-pill button[aria-pressed="true"]{background:var(--ink);color:var(--paper)}
.theme-pill button:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
@media (max-width:680px){.theme-pill{position:absolute}.page > header{margin-top:var(--s-7)}}
@media print{.theme-pill{display:none}}
`;
const THEME_CSS = themeCss('calc(var(--nav-h) + var(--s-3))');
/* the whole of what navHtml emits, for design/refresh.js to replace in one match */
const NAV_RE = /<nav class="topnav">[\s\S]*?<\/nav>(?:<div class="theme-pill"[^>]*>[\s\S]*?<\/div><script>[\s\S]*?<\/script>)?/;
const darkOnly = (pagePath) => !!pagePath && Object.prototype.hasOwnProperty.call(require('./tokens.js').DARK_ONLY_PAGES, pagePath);

/* `here` marks the current section so the nav says where you are. `root` is
   the relative prefix from this page back to the site root — '' at the top,
   '../' one level down — so the nav resolves BOTH on the served site and in a
   file:// preview. It used to be absolute, which is correct on the domain and
   dead on disk, and the site is reviewed on disk before it is pushed.

   A directory link needs its index.html spelled out for file://; a served host
   would add it. Harmless on the domain, load-bearing off it. `path` is the
   served path, read only to keep a dark-only page dark. */
function navHtml({ here = '', root = '', path: pagePath = '' } = {}) {
  const at = (k) => (k && k === here ? ' aria-current="page"' : '');
  const themed = !darkOnly(pagePath);
  return '<nav class="topnav">'
    + (themed ? THEME_PRE : '')
    + '<input type="checkbox" id="navdrawer" class="nav-ck">'
    + '<div class="topnav-in">'
    + '<a class="brand" href="' + escAttr(root + 'index.html') + '">' + esc(BRAND) + '</a>'
    + '<label class="nav-burger" for="navdrawer" aria-label="Toggle navigation"><span class="nb"></span></label>'
    + '<div class="navlinks">'
    + LINKS.map((l) => '<a href="' + escAttr(root + l.to + 'index.html')
      + '"' + at(l.here) + '>' + esc(l.t) + '</a>').join('')
    + '<a class="ghbtn" href="' + escAttr(GITHUB) + '" aria-label="GitHub">' + GH_ICON + '<span class="gh-t">GitHub</span></a>'
    + '</div></div></nav>'
    + (themed ? THEME_PILL + THEME_JS : '');
}

/* `gutter` is the page's horizontal padding token — the two shells spell it
   differently (a SCALE value on the reports, var(--gutter) on /instruments),
   and that is the only thing this function is parameterised on. */
const NAV_H = '60px';

function navCss(gutter) {
  const g = gutter || 'var(--gutter)';
  return `
/* THE BAR'S HEIGHT, ONCE (2026-09-15). It was written in three places — here,
   playground/design/shell.css's body padding and design/template.js's .page
   padding — so a taller bar would have needed three edits and got one. The
   body clears it in design/base.js; a viewport page sets it to 0. */
:root{--nav-h:${NAV_H}}
/* OPAQUE, AND THE REASON IS THE DARK LOCK (2026-09-05). This was frosted
   glass: 82% paper plus a 14px backdrop blur. Frosted glass assumes a light
   ground — the blur mixes toward white and reads as frost. This site's ground
   is near-black and what scrolls under the bar is high-contrast white line art,
   so the 18% that came through rendered a white stroke at a value which
   is 1.6:1 against the bar: a grey smear, not glass. It was worst on
   /instruments, where card art passes under it continuously.

   With the site locked to one dark theme there is no future light ground that
   would ever make the effect read correctly, so it goes rather than gets
   tuned. The hairline border still separates the bar from the page. */
.topnav{position:fixed;top:0;left:0;right:0;z-index:50;background:var(--paper);
  border-bottom:1px solid var(--rule)}
.topnav-in{padding:0 ${g};height:var(--nav-h);
  display:flex;align-items:center;justify-content:space-between;gap:24px}
.topnav .brand{font-family:var(--f-mono);font-weight:600;font-size:.8125rem;letter-spacing:.22em;
  text-transform:uppercase;color:var(--ink);text-decoration:none;border:none}
.navlinks{display:flex;align-items:center;gap:24px;flex-wrap:wrap}
.navlinks a{font-family:var(--f-mono);font-size:.6875rem;letter-spacing:.12em;text-transform:uppercase;
  color:var(--ink-4);text-decoration:none;border:none;transition:color .16s}
.navlinks a:hover{color:var(--ink)}
.navlinks a[aria-current="page"]{color:var(--ink)}
.navlinks .ghbtn{border:1px solid var(--rule);border-radius:var(--radius-pill);width:34px;height:34px;
  display:inline-flex;align-items:center;justify-content:center;
  color:var(--ink-3);background:var(--surface);transition:color .16s,border-color .16s}
.navlinks .ghbtn:hover{border-color:var(--rule-strong);color:var(--ink)}
/* THE MARK OWNS ITS SIZE (2026-09-05). It shipped with width/height attributes
   only, and an attribute loses to any stylesheet rule: five /instruments pages
   carry a page-wide svg{width:100%;height:auto} for their figures, so on those
   pages the mark drew at 32px on desktop and 292px tall inside the open phone
   drawer — the same nav, three sizes, and no screenshot of a closed nav could
   see the third. */
.navlinks .ghbtn svg{display:block;width:17px;height:17px;flex:none}
.gh-t{display:none}

/* the drawer: pure CSS state — a checkbox the burger label toggles */
.nav-ck{position:absolute;opacity:0;width:1px;height:1px;margin:0;pointer-events:none}
.nav-burger{display:none;width:40px;height:40px;align-items:center;justify-content:center;
  cursor:pointer;margin-right:-8px;border-radius:var(--radius-s)}
.nav-burger .nb{position:relative;display:block;width:18px;height:2px;background:var(--ink);
  border-radius:1px;transition:transform .18s ease}
.nav-burger .nb::before,.nav-burger .nb::after{content:'';position:absolute;left:0;width:18px;height:2px;
  background:var(--ink);border-radius:1px;transition:transform .18s ease,opacity .18s ease}
.nav-burger .nb::before{top:-6px}
.nav-burger .nb::after{top:6px}
.nav-ck:focus-visible ~ .topnav-in .nav-burger{outline:2px solid var(--ink);outline-offset:2px}
@media (max-width:680px){
  .nav-burger{display:flex}
  .navlinks{display:none;position:absolute;top:var(--nav-h);left:0;right:0;
    flex-direction:column;align-items:stretch;gap:0;
    background:var(--paper);border-bottom:1px solid var(--rule);padding:6px ${g} 16px}
  .navlinks a{padding:13px 0;border-bottom:1px solid var(--rule-soft)}
  .navlinks a:last-child{border-bottom:none}
  .navlinks .ghbtn{width:auto;height:auto;border:none;border-radius:0;background:none;
    justify-content:flex-start;gap:10px;border-bottom:1px solid var(--rule-soft)}
  .gh-t{display:inline}
  .nav-ck:checked ~ .topnav-in .navlinks{display:flex}
  .nav-ck:checked ~ .topnav-in .nav-burger .nb{transform:rotate(45deg)}
  .nav-ck:checked ~ .topnav-in .nav-burger .nb::before{transform:rotate(90deg) translateX(6px)}
  .nav-ck:checked ~ .topnav-in .nav-burger .nb::after{opacity:0}
}
[id]{scroll-margin-top:84px}
${THEME_CSS}`;
}

module.exports = { navHtml, navCss, NAV_H, NAV_RE, THEME_KEY, THEME_PRE, THEME_PILL, THEME_JS, THEME_CSS, themeCss, LINKS, BRAND, GITHUB, GH_ICON };
