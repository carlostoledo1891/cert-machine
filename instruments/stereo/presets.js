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
  caparica2021: {
    name: 'Costa da Caparica, Portugal — Vieira, Guedes Soares, Guimarães, Bergamasco, Campos (Coastal Engineering 197, 2025)',
    short: 'Caparica 2021 (two GoPros)',
    source: 'Vieira, Guedes Soares, Guimarães, Bergamasco, Campos, Nearshore space-time ocean wave observation using low-cost video cameras, Coastal Eng. 197 (2025) 104694, doi:10.1016/j.coastaleng.2024.104694, §4, §5.3, Tables 1 and 2 — record CC I-1',
    B: { v: '0.96', standing: 'paper', note: 'Table 1: baseline 960 mm (campaign CC I); 1,330 mm in CC II' },
    Hc: { v: '4.0', standing: 'paper', note: 'Table 1: camera altitude above mean water level, 4.0 m (CC I-1); 2.5–4.0 m across the records' },
    f: { v: '0.0048', standing: 'box', note: 'the paper gives "27 mm in a narrow field of view" — a 35 mm-equivalent; divided by the 1/2.3″ crop factor 5.62 it is 4.8 mm. Only f/p enters the cell, and that pair is set so 1,920 pixels span the 67° field a 27 mm-equivalent lens has' },
    p: { lo: '0.0000030', hi: '0.0000037', standing: 'box', note: 'not stated: 1,920 px in narrow FoV over a 1/2.3″ sensor; 3.0–3.7 µm brackets a 62°–72° field' },
    dd: { lo: '0.25', hi: '1', standing: 'box', note: 'matching precision not stated (H.264 video, CRF 18–23 tested); a quarter to a whole pixel' },
    dt: { v: '0.0208333', standing: 'chosen', note: 'audio synchronisation to the frame at 24 fps: at most half a frame, 1/48 s' },
    utex: { v: '1', standing: 'chosen', note: 'texture speed of ripples and foam in the surf, 1 m/s' },
    T: { v: '8', standing: 'chosen', note: 'peak period not printed for the records; 8 s, an Atlantic swell in the surf zone. The budget\'s deep-water dispersion is an assumption here: kp·h is 0.27–0.64 in Table 2' },
    H: { v: '0.30', standing: 'paper', note: 'Table 2, CC I-1: Hs at the point, 0.30 m (0.30–0.52 across the six records)' },
    g: { v: '9.80665', standing: 'chosen', note: 'standard gravity' },
    rangeLo: '20', rangeHi: '40', gaugeRange: '30',
    best: { p: '0.0000030', dd: '0.25' }, worst: { p: '0.0000037', dd: '1' },
    observed: { hsRmse: 0.09, tpRmse: 1.2, note: '§5.2: RMSE of Hs and Tp between the stereo virtual gauge and the pressure gauge, 0.09 m and 1.2 s' },
    quoted: { zQuantization: 0.0021, xyQuantization: [0.0019, 0.0175], note: '§5.3: "estimated root mean square quantisation errors were 1.9 mm, 17.5 mm, and 2.1 mm for the x, y and z-axes" — for record CC I, the range not stated' },
    /* Table 2: the point and the area Hs of the same stereo record, metres */
    table2: [
      { id: 'CC I-1', point: '0.30', area: '0.38', pct: '27' }, { id: 'CC I-2', point: '0.30', area: '0.41', pct: '37' }, { id: 'CC I-3', point: '0.34', area: '0.45', pct: '32' },
      { id: 'CC I-4', point: '0.52', area: '0.66', pct: '27' }, { id: 'CC II-1', point: '0.36', area: '0.51', pct: '42' }, { id: 'CC II-2', point: '0.31', area: '0.48', pct: '55' },
    ],
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
/* the facts the page states about Caparica 2021: the certified cell across the imaged range, and what
   Table 2's spatial-minus-point Hs excess would need as independent per-point noise.
   Hs = 4·σ, so an area estimate exceeding the point estimate by pure per-point noise of standard
   deviation σn satisfies Hs_area² = Hs_point² + 16·σn², i.e. σn = √(Hs_area² − Hs_point²)/4; and a
   value known only to a cell of height c, uniformly, has standard deviation c/√12 [STANDARD]. Both are
   evaluated in outward-rounded interval arithmetic on the printed literals. */
function caparicaFacts(Bd, PI, IV) {
  const P = PRESETS.caparica2021;
  const inp = toIntervals(P, Bd, PI);
  const best = Object.assign({}, inp, { p: Bd.lit(P.best.p), dd: Bd.lit(P.best.dd), dt: Bd.lit('0') });
  const worst = Object.assign({}, inp, { p: Bd.lit(P.worst.p), dd: Bd.lit(P.worst.dd) });
  const at = (i, R) => Bd.cell(i, Bd.lit(R));
  const sqrt12 = Bd.sqrtIv(IV.iv(12));
  const rows = P.table2.map((r) => {
    const a = Bd.lit(r.area), q = Bd.lit(r.point);
    const diff = IV.sub(IV.sqr(a), IV.sqr(q));
    const sn = IV.div(Bd.sqrtIv(diff), IV.iv(4));
    return { id: r.id, point: r.point, area: r.area, pct: r.pct, noise: sn };
  });
  const cellStd = (c) => IV.div(IV.iv(c), sqrt12);           /* the std of a value uniform in a cell of height c */
  const bestFar = at(best, P.rangeHi).terms.cell, worstFar = at(worst, P.rangeHi).total[1], bestNear = at(best, P.rangeLo).terms.cell, worstNear = at(worst, P.rangeLo).total[1];
  return {
    bestAtGauge: at(best, P.gaugeRange).total[1], worstAtGauge: at(worst, P.gaugeRange).total[1],
    bestCellNear: bestNear, bestCellFar: bestFar, worstNear, worstFar,
    disparityAtGauge: at(inp, P.gaugeRange).disparityPx,
    noise: rows, noiseMin: Math.min(...rows.map((r) => r.noise[0])), noiseMax: Math.max(...rows.map((r) => r.noise[1])),
    bestCellStdFar: cellStd(bestFar)[1], worstStdFar: cellStd(worstFar)[1], worstStdNear: cellStd(worstNear)[1],
  };
}
const API = { PRESETS, toIntervals, lemeFacts, caparicaFacts, leme2020: PRESETS.leme2020, caparica2021: PRESETS.caparica2021, nazare: PRESETS.nazare };
if (typeof module !== 'undefined' && module.exports) module.exports = API;
else if (typeof window !== 'undefined') window.STEREO_PRESETS = API;
