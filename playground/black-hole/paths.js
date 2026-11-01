/* paths.js — the black-hole viewer's overlay paths, ONCE: required by build.js for the page as written, inlined in the page
   for the tab. playground/black-hole/ · cert-machine · 2026-10-31 (Phase 2)

   The overlay is a 512 × 512 user space, one unit per map pixel: α = −20 + x·40/512, β = 20 − y·40/512 (Bardeen's image
   plane in M, the spin axis up).
     curvePath(points)   the DECIDED shadow edge: the scene record's polyline through the centres of its cover boxes
                         (playground/black-hole/scene.js), closed; the stroke width the page gives it is the record's
                         strokeM in these units, so the true curve lies inside the drawn line
     jetPath(deg, sign)  the jet, an ASSUMED sketch: the edges of a funnel ±1.5·√z about the spin axis (z in M along it,
                         3 to 80 M), projected at the view's inclination, cut where it leaves the field and inside the
                         shadow's box; sign +1 the jet toward us (the one the page draws), −1 the counter-jet.
                         Chosen to be legible: no jet image is drawn, and nothing about its shape is measured here. */
(function (root) {
  'use strict';
  var N = 512, HALF = 20;
  var px = function (al) { return ((al + HALF) * N / (2 * HALF)).toFixed(2); };
  var py = function (be) { return ((HALF - be) * N / (2 * HALF)).toFixed(2); };
  function curvePath(points) {
    var d = '';
    for (var i = 0; i < points.length; i += 2) d += (i ? 'L' : 'M') + px(points[i]) + ' ' + py(points[i + 1]);
    return d + 'Z';
  }
  function jetPath(deg, sign) {
    var si = Math.sin(Number(deg) * Math.PI / 180), d = '';
    [-1, 1].forEach(function (side) {
      var first = true;
      for (var z = 3; z <= 80; z += 1) {
        var x = side * 1.5 * Math.sqrt(z), y = sign * z * si;
        if (Math.abs(y) > 19.5 || Math.abs(x) > 19.5) break;
        if (Math.abs(y) < 5.6 && Math.abs(x) < 5.6) continue;
        d += (first ? 'M' : 'L') + px(x) + ' ' + py(y);
        first = false;
      }
    });
    return d;
  }
  var api = { N: N, HALF: HALF, curvePath: curvePath, jetPath: jetPath, unitsPerM: N / (2 * HALF) };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.BHPATHS = api;
})(this);
