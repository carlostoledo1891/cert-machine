/* grammar-eps.js — the ε handle under /grammar/'s hero, in the browser (inlined by tools/build-grammar.js after
   tools/grammar-hero.js, whose decide() is the only rule it calls).
   tools/ · cert-machine · 2026-10-30 (D14's handle grammar: a chosen input in italic that types, drags and steps)

   It moves only what a choice of ε can move: ε's dotted line and knob on the ruler, the segments raised by ε in the
   hero (a dotted line, absent at ε = 0), the witness group (its × translated to the point decide() names, its leader's
   near end, its three lines of words; hidden when the claim holds) and the words under the ruler. The enclosure, the
   knots, the float curve, the segments and the flip tick are never touched. At ε = 0 every attribute it writes is
   the value the build wrote, so the hero is the static figure, byte for byte (tools/drive-grammar-eps.js compares it
   with the page loaded with scripts off).                                                                        MIT */
(function () {
  'use strict';
  var H = window.GX_HERO, box = document.getElementById('gx-eps');
  if (!H || !box) return;
  var CFG = JSON.parse(document.getElementById('gx-eps-cfg').textContent);
  var NS = 'http://www.w3.org/2000/svg', f1 = function (v) { return (+v).toFixed(1); };
  var fnum = H.fnum, fstr = H.fstr, WX = H.WX, WY = H.segAt(H.WX);
  var state = { k: 0 };

  /* the hero's two drawings (wide and phone), each with its frame and its witness group */
  var panels = ['w', 'n'].map(function (key) {
    var g = document.querySelector('[data-hero] .hv-' + key + ' .gx-wx');
    if (!g) return null;
    var F = CFG.frames[key];
    var px = function (x) { return F.L + (x - F.x0) / (F.x1 - F.x0) * F.pw; };
    var py = function (y) { return F.T + F.ph - (y - F.y0) / (F.y1 - F.y0) * F.ph; };
    return { g: g, F: F, px: px, py: py, lead: g.querySelector('line'), mark: g.querySelector('path.w-wx'), words: g.querySelectorAll('text'), band: null };
  }).filter(Boolean);

  /* the segments raised by ε, in data units, stopped where they reach the frame's `top` (under the enclosure's label) */
  function bandPath(P, e) {
    var pts = H.inView.concat([[H.HX1, H.exitY]]).map(function (q) { return [fnum(q[0]), fnum(q[1]) + e]; });
    var out = [pts[0]];
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i];
      if (b[1] <= P.F.top) { out.push(b); continue; }
      if (a[1] < P.F.top) out.push([a[0] + (P.F.top - a[1]) / (b[1] - a[1]) * (b[0] - a[0]), P.F.top]);
      break;
    }
    return 'M' + out.map(function (q) { return f1(P.px(q[0])) + ',' + f1(P.py(q[1])); }).join('L');
  }

  function drawHero(d) {
    panels.forEach(function (P) {
      /* the band: a chosen mark, drawn only for ε > 0 */
      if (d.k === 0) { if (P.band) { P.band.remove(); P.band = null; } }
      else {
        if (!P.band) {
          P.band = document.createElementNS(NS, 'path');
          Object.keys(CFG.band).forEach(function (a) { P.band.setAttribute(a, CFG.band[a]); });
          P.band.setAttribute('data-eps', 'band');
          P.g.parentNode.insertBefore(P.band, P.g);
        }
        P.band.setAttribute('d', bandPath(P, fnum(d.e)));
      }
      /* the witness: where decide() puts it, or gone when the claim holds */
      if (d.verdict === 'HOLDS') { P.g.setAttribute('display', 'none'); return; }
      P.g.removeAttribute('display');
      var x = fnum(d.x), y = fnum(d.y);
      if (H.feq(d.x, WX)) P.mark.removeAttribute('transform');
      else P.mark.setAttribute('transform', 'translate(' + f1(P.px(x) - P.px(fnum(WX))) + ',' + f1(P.py(y) - P.py(fnum(WY))) + ')');
      P.lead.setAttribute('x1', (P.px(x) + 8).toFixed(1));
      P.lead.setAttribute('y1', (P.py(y) + 8).toFixed(1));
      for (var i = 0; i < P.words.length; i++) P.words[i].textContent = d.lines[i];
    });
  }

  /* the ruler: ε's line and knob, in both drawings */
  var ruler = document.getElementById('gx-eps-r');
  var rulers = ['w', 'n'].map(function (key) {
    var s = ruler.querySelector('.gx-eps-' + key), R = CFG.rulers[key];
    return { s: s, R: R, X: function (k) { return R.L + k / H.KMAX * (R.w - R.L - R.R); }, hl: s.querySelector('.gx-eps-hl'), kn: s.querySelector('.gx-knob') };
  });
  var input = document.getElementById('gx-eps-in'), dv = document.getElementById('gx-eps-dv');
  var epsText = function (d) { return d.k === 0 ? '0' : fstr(d.e); };

  function set(k, typed) {
    k = Math.max(0, Math.min(H.KMAX, Math.round(k)));
    var d = H.decide(k);
    state.k = k;
    rulers.forEach(function (r) {
      var x = f1(r.X(k));
      r.hl.setAttribute('x1', x); r.hl.setAttribute('x2', x);
      r.kn.setAttribute('cx', x); r.kn.setAttribute('aria-valuenow', String(k)); r.kn.setAttribute('aria-valuetext', 'ε = ' + epsText(d));
    });
    if (typed !== false) input.value = epsText(d);
    input.removeAttribute('aria-invalid');
    var given = '<i>given ε = ' + epsText(d) + '</i>';
    dv.innerHTML = d.verdict === 'HOLDS'
      ? CFG.chips.HOLDS + ' ' + given + ': no point of [0, ' + fstr(H.HX1) + '] has √x more than ε above its segment.'
      : CFG.chips.REFUTED + ' ' + given + ': at x = ' + fstr(d.x) + ' the segment reads ' + fstr(d.y) + ', and ' + d.lines[2]
        + (d.k === 0 ? ': the segment is not √x there.' : ': √x is more than ε above the segment there.');
    drawHero(d);
  }

  /* typed: a fraction p/q (or 0) that is a whole number of 1/Q-ths inside the ruler; anything else is not taken */
  input.addEventListener('input', function () {
    var m = /^\s*(\d{1,4})\s*(?:\/\s*(\d{1,4}))?\s*$/.exec(input.value);
    if (!m) { input.setAttribute('aria-invalid', 'true'); return; }
    var p = BigInt(m[1]), q = BigInt(m[2] || '1');
    if (q === 0n || (p * H.Q) % q !== 0n || p * H.Q / q > BigInt(H.KMAX)) { input.setAttribute('aria-invalid', 'true'); return; }
    set(Number(p * H.Q / q), false);
  });
  input.addEventListener('change', function () { set(state.k, true); });

  /* dragged: anywhere along the ruler that is showing */
  var shown = function () { for (var i = 0; i < rulers.length; i++) { var b = rulers[i].s.getBoundingClientRect(); if (b.width > 0) return { r: rulers[i], b: b }; } return null; };
  var fromX = function (ev) { var v = shown(); if (!v) return state.k; var x = (ev.clientX - v.b.left) * (v.r.R.w / v.b.width); return (x - v.r.R.L) / (v.r.R.w - v.r.R.L - v.r.R.R) * H.KMAX; };
  ruler.addEventListener('pointerdown', function (ev) { ruler.setPointerCapture(ev.pointerId); ruler.classList.add('drag'); set(fromX(ev)); ev.preventDefault(); });
  ruler.addEventListener('pointermove', function (ev) { if (ruler.classList.contains('drag')) set(fromX(ev)); });
  var endDrag = function () { ruler.classList.remove('drag'); };
  ruler.addEventListener('pointerup', endDrag); ruler.addEventListener('pointercancel', endDrag);
  /* stepped: from the keyboard, on the knob */
  ruler.addEventListener('keydown', function (ev) {
    if (!ev.target.classList || !ev.target.classList.contains('gx-knob')) return;
    var st = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 4, PageDown: -4 }[ev.key];
    if (st) { set(state.k + st); ev.preventDefault(); }
    else if (ev.key === 'Home') { set(0); ev.preventDefault(); } else if (ev.key === 'End') { set(H.KMAX); ev.preventDefault(); }
  });

  box.hidden = false;
  set(0);
})();
