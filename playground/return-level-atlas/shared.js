/* shared.js — what the globe and the flat map of the return-level atlas both draw by, once.
   playground/return-level-atlas/ · cert-machine · 2026-10-29

   The flat map (map.js, /instruments/return-level-atlas/map/) is a second view of the same ledger, and every rule the
   two views share lives here and nowhere else (the corpus.js lesson: a rule defined twice WILL diverge):

     · decode      the page's compact row of a cell (build.js row()) read back into a cell;
     · square      the square a cell is drawn as, by its lattice (1°, 4°, or a report node's half degree);
     · levelCode   THE rule that refuses a cell in every level view: Anderson–Darling decides no family, or the decided
                   family's level has no enclosure;
     · WAVE_BR     the design wave's ramp, five steps of the order greys, and rampK, the step a level falls in;
     · cmOut       an enclosure rounded OUTWARD to the centimetre (WARRANT rule 8): the lower end down, the upper end
                   up, in whole centimetres. The map prints every level this way; the builder applies it.

   The globe inlines this file before app.js (window.RLA_SHARED); the map requires it as a module; both builders
   require it in Node. No colour, no word and no request here.                                                  MIT */
(function (root) {
  'use strict';
  const BLK = ['daily', 'weekly', 'monthly'];

  /* the compact row (build.js row()) back into a cell; nativeOf(name) gives a report node's 3-hourly block or null */
  function decode(r, nativeOf) {
    const nat = nativeOf || (() => null);
    if (r[4] === 1) return { id: r[0], lat: r[1], lon: r[2], sets: r[3], ice: true, report: r[5], iceSteps: r[6], iceMonths: r[7], iceMax: r[8], fillDays: r[9], fillSteps: r[10], native: nat(r[5]) };
    const blocks = {};
    /* after the paper's fields, the seventh family and the statistical layer (undefined in a ledger older than them) */
    BLK.forEach((b, k) => { const q = r[9 + k]; blocks[b] = { ad: q[0], ks: q[1], mse: q[2], chi2: q[3], naive: q[4], gg: q[5], ew: q[6], l100: [q[7], q[8]], l1000: [q[9], q[10]], below: q[11],
      seven: q[12], g7: q[13], xi: q[14], xiCI: [q[15], q[16]], g100: q[17], s100: [q[18], q[19]], s1000: [q[20], q[21]] }; });
    const ei = r[12] ? { theta: r[12][0], u: r[12][1], r: r[12][2] } : null;
    return { id: r[0], lat: r[1], lon: r[2], sets: r[3], ice: false, report: r[5], sha: r[6], recSha: r[7], max: r[8], blocks, native: nat(r[5]), ei };
  }

  /* a cell's drawn square: the 1° Brazilian lattice, the 4° globe, or a report node's half degree; 0.92 of the spacing,
     so neighbours stay apart */
  const sizeOf = (c) => ((c.sets & 2) ? 1 : (c.sets & 1) ? 4 : 0.5);
  function square(c) {
    const h = sizeOf(c) * 0.46;
    return [[[c.lon - h, c.lat - h], [c.lon + h, c.lat - h], [c.lon + h, c.lat + h], [c.lon - h, c.lat + h], [c.lon - h, c.lat - h]]];
  }

  /* THE REFUSAL OF A LEVEL: null where the T-year level of the family Anderson–Darling decides is enclosed; 'nofam' where
     no family is decided (6 in the compact row); 'nolevel' where one is, and its level could not be enclosed */
  function levelCode(b, T) {
    if (b.ad === 6) return 'nofam';
    const lv = b['l' + T];
    return !lv || lv[1] === null || lv[1] === undefined ? 'nolevel' : null;
  }

  /* the design wave's ramp: the order greys in five steps, by the level's upper end */
  const WAVE_BR = [0, 4, 8, 12, 16];
  const rampK = (v, br) => { let k = 0; while (k < br.length && v >= br[k]) k++; return Math.min(4, Math.max(0, k - 1)); };

  /* the design-wave view of a cell: I (sea ice, shown, not certified), R (refused, with its code), or D with the level's
     upper end and its ramp step */
  function waveLook(c, block, T) {
    if (c.ice) return { k: 'I' };
    const b = c.blocks[block], code = levelCode(b, T);
    if (code) return { k: 'R', code };
    const v = b['l' + T][1];
    return { k: 'D', v, K: rampK(v, WAVE_BR) };
  }

  /* an enclosure [lo, hi] in metres, rounded outward to whole centimetres: [⌊100 lo⌋, ⌈100 hi⌉], or null without two
     finite ends. A float product can only push an end further out, never in. */
  function cmOut(q) {
    if (!Array.isArray(q) || q.length !== 2 || !q.every((x) => typeof x === 'number' && Number.isFinite(x)) || q[0] > q[1]) return null;
    return [Math.floor(q[0] * 100), Math.ceil(q[1] * 100)];
  }

  const API = { BLK, decode, sizeOf, square, levelCode, WAVE_BR, rampK, waveLook, cmOut };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.RLA_SHARED = API;
})(typeof self !== 'undefined' ? self : this);
