/* theme.js — the full-viewport instruments in either theme, ONCE.
   playground/design/ · cert-machine · 2026-10-30

   WHY (the operator, 2026-10-30: "redraw in tokens", and a canvas "repaints at once" when the reader flips the
   pill). CSS and SVG follow the tokens by themselves; a canvas holds pixels, so it has to READ the tokens and paint
   again. Four pages draw on a canvas (/instruments/navier-stokes, interferometer, pqc, contours) and four float a
   panel over the stage (navier-stokes, interferometer, pqc, rewire). The token reading, the listener and the
   panel's surface are written here once, because a rule defined twice diverges.

   CLIENT — inlined before a page's own script; it defines window.WTHEME:
     rgba(name, a)  the token's colour at alpha a, written exactly as the literals it replaces were
                    ('rgba(246,246,248,0.5)' for --ink in dark), so dark paints the same bytes as before
     rgb(name)      [r, g, b] of the token (every palette token is a #rrggbb in both themes)
     tok(name)      the token's computed value, as written
     light()        whether the reader chose light
     on(fn)         fn() runs when the reader flips the pill (design/nav.js dispatches "warrant-theme" on document),
                    after the cache is cleared. A repaint repaints from the state the page already holds: nothing a
                    page decided is recomputed, and a simulation in motion keeps running.

   CSS — appended after a page's base sheet (playground/design/overlay.css, or design/frontier-ref/instrument.css,
   which stays the reference copy it is): the floating panel and the about sheet take the surface tokens with the
   alpha they had. Dark is unchanged: color-mix(in srgb, #101014 86%, transparent) IS rgba(16,16,20,.86). */
'use strict';

const CLIENT = `(function () {
  'use strict';
  if (window.WTHEME) return;
  var R = document.documentElement, fns = [], cache = {};
  function tok(n) { return getComputedStyle(R).getPropertyValue(n).trim(); }
  function trip(n) {
    if (cache[n]) return cache[n];
    var m = /^#([0-9a-f]{6})$/i.exec(tok(n));
    if (!m) throw new Error('theme.js: ' + n + ' is not a #rrggbb token');
    return (cache[n] = [0, 2, 4].map(function (i) { return parseInt(m[1].substr(i, 2), 16); }));
  }
  document.addEventListener('warrant-theme', function () { cache = {}; for (var i = 0; i < fns.length; i++) fns[i](); });
  window.WTHEME = {
    tok: tok,
    rgb: function (n) { return trip(n).slice(); },
    rgba: function (n, a) { return 'rgba(' + trip(n).join(',') + ',' + a + ')'; },
    light: function () { return R.getAttribute('data-theme') === 'light'; },
    on: function (f) { fns.push(f); }
  };
})();`;

const CSS = `
/* the floating surfaces in the surface tokens, at the alpha they had (playground/design/theme.js) */
.ov-panel, .panel { background: color-mix(in srgb, var(--bg-raised) 86%, transparent); }
.sheet { background: color-mix(in srgb, var(--bg) 96%, transparent); }
/* the theme pill (design/nav.js) sits under the nav at the top right: the panel's first control starts below it, and on
   a phone the title does too, as a document page's header does (body: above any page's own panel padding) */
body .ov-panel, body .panel { padding-top: calc(var(--nav-h) + var(--s-3) + var(--s-7)); }
@media (max-width: 680px) { body .ov-title { top: calc(var(--nav-h) + var(--s-3) + var(--s-7)); } }`;

module.exports = { CLIENT, CSS };
