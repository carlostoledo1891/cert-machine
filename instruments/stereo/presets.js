/* instruments/stereo/presets.js — the rigs the instrument knows, with every
   number's standing written beside it.

   A value marked `paper` is a literal from the source named; a value marked
   `box` is one the source does not state, carried as an interval wide enough
   to contain any plausible reading; a value marked `chosen` is a scenario
   assumption and is drawn as such on the page. No require() here either. */
'use strict';
const PRESETS = {
  leme2020: {
    name: 'Leme, Rio de Janeiro — Vieira, Guimarães, Violante-Carvalho, Benetazzo, Bergamasco, Pereira (JMSE 2020)',
    short: 'Leme 2020 (two smartphones)',
    source: 'Vieira et al., A Low-Cost Stereo Video System for Measuring Directional Wind Waves, J. Mar. Sci. Eng. 8 (2020) 831, doi:10.3390/jmse8110831, §2.3, §3.3, §4 and Table 1',
    B: { v: '0.98', standing: 'paper', note: 'the smartphones were deployed 0.98 m apart' },
    Hc: { v: '3.5', standing: 'paper', note: 'approximately 3.5 m above sea level' },
    f: { v: '0.00371', standing: 'paper', note: 'focal length 3.71 mm (Samsung Galaxy J5 Pro)' },
    p: { lo: '0.00000112', hi: '0.00000245', standing: 'box', note: 'not stated: 1.12 µm at the 13-megapixel native pitch, 2.45 µm if 1920 × 1080 video samples the full 4.7 mm sensor width' },
    dd: { lo: '0.25', hi: '1', standing: 'box', note: 'matching precision not stated; calibration errors of 0.21–0.45 px are; a quarter to a whole pixel' },
    dt: { v: '0.0166667', standing: 'chosen', note: 'audio cross-correlation synchronises to the frame at 30 fps: at most half a frame, 1/60 s' },
    utex: { v: '1', standing: 'chosen', note: 'texture speed of ripples and glitter, 1 m/s' },
    T: { v: '12.8', standing: 'paper', note: 'Tp = 12.8 s on every record of Table 1' },
    H: { v: '0.35', standing: 'paper', note: 'Hs 0.29–0.35 m; the largest' },
    g: { v: '9.80665', standing: 'chosen', note: 'standard gravity' },
    rangeLo: '10', rangeHi: '35', gaugeRange: '34',
    best: { p: '0.00000112', dd: '0.25' }, worst: { p: '0.00000245', dd: '1' },
    observed: { rmse: [0.10, 0.12, 0.12, 0.10], bias: [-0.04, -0.05, -0.06, -0.01], note: 'Table 1: RMSE and bias of the surface elevation between the stereo system and the pressure gauge, four 19-minute records' },
    quoted: { zQuantization: 0.0011, xyQuantization: [0.0009, 0.0099], note: '§4: "estimated root mean square quantization errors were 0.9 mm, 9.9 mm, and 1.1 mm for the x, y and z-axes" — the range they hold at is not stated' },
  },
  nazare: {
    name: 'A Nazaré-class scenario — every number chosen',
    short: 'Nazaré scenario (chosen)',
    source: 'no source: a scenario in the shape of the Big Wave Tracker (labECO / Colab+Atlantic; cameras on the Forte de São Miguel headland, waves of ten metres and more, ranges of hundreds of metres). Every number below is an assumption to be replaced by the rig\'s own.',
    B: { v: '10', standing: 'chosen', note: 'a ten-metre baseline along the headland' },
    Hc: { v: '50', standing: 'chosen', note: 'fifty metres above the water' },
    f: { v: '0.05', standing: 'chosen', note: 'a 50 mm lens' },
    p: { v: '0.00000345', standing: 'chosen', note: '3.45 µm, a common machine-vision sensor' },
    dd: { v: '0.5', standing: 'chosen', note: 'half a pixel' },
    dt: { v: '0.001', standing: 'chosen', note: 'a hardware trigger: one millisecond' },
    utex: { v: '2', standing: 'chosen', note: 'texture speed in a breaking sea, 2 m/s' },
    T: { v: '16', standing: 'chosen', note: 'a 16-second swell' },
    H: { v: '15', standing: 'chosen', note: 'a fifteen-metre wave' },
    g: { v: '9.80665', standing: 'chosen', note: 'standard gravity' },
    rangeLo: '200', rangeHi: '2000', gaugeRange: null,
  },
};

/* the preset's numbers as intervals for the budget */
function toIntervals(P, Bd, PI) {
  const iv = (x) => (x.lo !== undefined ? Bd.box(x.lo, x.hi) : Bd.lit(x.v));
  return { B: iv(P.B), Hc: iv(P.Hc), f: iv(P.f), p: iv(P.p), dd: iv(P.dd), dt: iv(P.dt), utex: iv(P.utex), T: iv(P.T), H: iv(P.H), g: iv(P.g), PI };
}
/* the facts the page states about Leme 2020, computed once here so page and battery agree */
function lemeFacts(Bd, PI) {
  const P = PRESETS.leme2020;
  const inp = toIntervals(P, Bd, PI);
  const best = Object.assign({}, inp, { p: Bd.lit(P.best.p), dd: Bd.lit(P.best.dd), dt: Bd.lit('0') });
  const worst = Object.assign({}, inp, { p: Bd.lit(P.worst.p), dd: Bd.lit(P.worst.dd) });
  const at = (i, R) => Bd.cell(i, Bd.lit(R));
  return {
    bestAtGauge: at(best, P.gaugeRange).total[1], worstAtGauge: at(worst, P.gaugeRange).total[1], boxAtGauge: at(inp, P.gaugeRange).total[1],
    bestAtNear: at(best, P.rangeLo).total[1], worstAtNear: at(worst, P.rangeLo).total[1],
    bestCellAtGauge: at(best, P.gaugeRange).terms.cell, disparityAtGauge: at(inp, P.gaugeRange).disparityPx,
  };
}
const API = { PRESETS, toIntervals, lemeFacts, leme2020: PRESETS.leme2020, nazare: PRESETS.nazare };
if (typeof module !== 'undefined' && module.exports) module.exports = API;
else if (typeof window !== 'undefined') window.STEREO_PRESETS = API;
