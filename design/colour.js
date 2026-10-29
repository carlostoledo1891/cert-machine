/* colour.js — the colour maths, once: OKLab, the Machado 2009 CVD model, WCAG contrast.
   design/ · cert-machine (2026-10-29)

   These lines lived inside design/battery.js, which runs its checks and exits when it is required, so nothing else
   could call them. The print register (design/print/) needs the same validator WARRANT v2.2 cites — OKLab ΔE×100,
   the Machado-Oliveira-Fernandes 2009 simulation at severity 1.0, WCAG 2 relative-luminance contrast — and a second
   copy of it is the corpus.js lesson ("a rule defined twice WILL diverge"). So the code moved here byte for byte and
   battery.js requires it; the battery's output did not change. Every consumer of these numbers reads them from here.

   MIT licensed. Part of cert-machine. */
'use strict';

const MACHADO = {
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
  tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]]
};
const hex2srgb = h => { h = h.trim().replace(/^#/, ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255); };
const toLin = h => hex2srgb(h).map(v => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
function oklabFromLin([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
          1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
          0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
}
const oklch = h => { const [L, a, b] = oklabFromLin(toLin(h)); return [L, Math.hypot(a, b)]; };
const okhue = h => { const [, a, b] = oklabFromLin(toLin(h)); return ((Math.atan2(b, a) * 180 / Math.PI) % 360 + 360) % 360; };
function simulate(h, kind) {
  const [r, g, b] = toLin(h), M = MACHADO[kind], cl = c => Math.max(0, Math.min(1, c));
  return [cl(M[0][0] * r + M[0][1] * g + M[0][2] * b), cl(M[1][0] * r + M[1][1] * g + M[1][2] * b),
          cl(M[2][0] * r + M[2][1] * g + M[2][2] * b)];
}
function deltaE(h1, h2, kind) {
  const a = oklabFromLin(kind ? simulate(h1, kind) : toLin(h1));
  const b = oklabFromLin(kind ? simulate(h2, kind) : toLin(h2));
  return 100 * Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}
const relLum = h => { const [r, g, b] = toLin(h); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const [hi, lo] = [relLum(a), relLum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

module.exports = { MACHADO, hex2srgb, toLin, oklabFromLin, oklch, okhue, simulate, deltaE, relLum, contrast };
