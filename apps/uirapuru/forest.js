/* apps/uirapuru/forest.js — the toy forest of the Uirapuru story: a seeded generator, THE ONE DEFINITION for the builder
   (which computes the notebook's and the stage's facts from it at build time) and for the page (which decides the claims a
   reader makes in the browser). Patch p with n trees is the same forest for everyone; the birds are invented. mulberry32. */
(function (root) {
  const mulberry = (seed) => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const forest = (patch, n, max) => { const r = mulberry(patch * 1000003 + n * 7919 + max); const out = []; for (let i = 0; i < n; i++) out.push(Math.floor(r() * (max + 1))); return out; };
  /* the ink in a tree's square for a bird of blueness b on the guide's 0 to 100: the instruments' drawing and the hero's */
  const shade = (b) => 0.06 + 0.9 * b / 100;
  root.FOREST = { forest, shade };
})(typeof module !== 'undefined' ? module.exports : window);
