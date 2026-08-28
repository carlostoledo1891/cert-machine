/* penalty.js — FuelEU Maritime arithmetic, exact. instruments/fueleu · cert-machine

   Every constant below is transcribed from pinned official bytes:
   - Regulation (EU) 2023/1805, OJ L 234 22.9.2023 —
     corpus/sources/fueleu_reg-2023-1805_oj-l234_2023-09-22.pdf
     (sha256 492df4f79c9e98bfabf1e9b9e0760c9927caa8a9d786c7fcc875bbfe59eebb24):
     Art. 4(2): reference 91,16 gCO2eq/MJ, reductions -2% 2025 / -6% 2030 /
     -14,5% 2035 / -31% 2040 / -62% 2045 / -80% 2050.
     Annex IV A(a): CB [gCO2eq] = (GHGIEtarget - GHGIEactual) × energy [MJ].
     Annex IV B(a): FuelEU Penalty [EUR] = |CB| / (GHGIEactual × 41 000) × 2 400.
     Annex II defaults (fossil rows): LCV [MJ/g], WtT [gCO2eq/MJ], Cf CO2/CH4/N2O
     [g/gFuel]. Annex I: TtW CO2eq per gram fuel = Cf·GWP summed.
   - Directive (EU) 2018/2001 Annex V C(4) —
     corpus/sources/red2_dir-2018-2001_cellar-eng.html
     (sha256 397c92486129467cd3d26832b36124c3b17bbcbbab91dea280fc4fd6ee7cc062):
     GWP CO2 1 · CH4 25 · N2O 298.

   All decisions in exact BigInt rationals; no float ever participates in a
   verdict. The module DECIDES three things:
     targetFor(year)                the exact intensity limit
     decide(actual, year)          COMPLIANT(margin) | NON-COMPLIANT(deficit)
     penaltyEUR(actual, year, E)   the exact Annex IV penalty for energy E MJ
     blendFlip(fossil, alt, year)  the exact energy fraction of `alt` at which
                                   the blend turns compliant — the flip
                                   threshold the app doctrine requires
   and REFUSES what it cannot decide (unknown year, alt fuel no better than
   the target, negative energy). MIT. Part of cert-machine.                    */
'use strict';

/* ---- exact rationals over BigInt ---- */
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { [a, b] = [b, a % b]; } return a; };
const norm = ([n, d]) => { if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d) || 1n; return [n / g, d / g]; };
const R = (n, d) => norm([BigInt(n), BigInt(d === undefined ? 1 : d)]);
const add = (a, b) => norm([a[0] * b[1] + b[0] * a[1], a[1] * b[1]]);
const sub = (a, b) => norm([a[0] * b[1] - b[0] * a[1], a[1] * b[1]]);
const mul = (a, b) => norm([a[0] * b[0], a[1] * b[1]]);
const div = (a, b) => { if (b[0] === 0n) throw new Error('division by zero'); return norm([a[0] * b[1], a[1] * b[0]]); };
const cmp = (a, b) => { const d = a[0] * b[1] - b[0] * a[1]; return d < 0n ? -1 : d > 0n ? 1 : 0; };
const abs = (a) => a[0] < 0n ? [-a[0], a[1]] : a;
const str = (a) => a[1] === 1n ? String(a[0]) : String(a[0]) + '/' + String(a[1]);
/* exact rational from a printed decimal string — the registry's decimals are
   the record; "123.45" becomes exactly 12345/100, never a float */
const fromDec = (s) => {
  const m = /^(-?)(\d+)(?:\.(\d+))?$/.exec(String(s).trim());
  if (!m) throw new Error('REFUSED: not a plain decimal: ' + JSON.stringify(s));
  const sign = m[1] === '-' ? -1n : 1n;
  const frac = m[3] || '';
  return norm([sign * BigInt(m[2] + frac), 10n ** BigInt(frac.length)]);
};
/* decimal rendering for display only — never for a decision */
const dec = (a, places) => {
  const neg = a[0] < 0n; const n = neg ? -a[0] : a[0];
  const scale = 10n ** BigInt(places);
  const v = (n * scale) / a[1];
  const w = v / scale, f = (v % scale).toString().padStart(places, '0');
  return (neg ? '-' : '') + w + (places ? '.' + f : '');
};

/* ---- the pinned constants (transcribed; see header for source + sha) ---- */
const REFERENCE = R(9116, 100);                      /* 91,16 gCO2eq/MJ */
const REDUCTIONS = {                                  /* Art. 4(2) */
  2025: R(2, 100), 2030: R(6, 100), 2035: R(145, 1000),
  2040: R(31, 100), 2045: R(62, 100), 2050: R(80, 100)
};
const GWP = { co2: R(1), ch4: R(25), n2o: R(298) };  /* RED II Annex V C(4) */
const VLSFO_MJ_PER_T = R(41000);                      /* Annex IV: 41 000 MJ/t */
const EUR_PER_T = R(2400);                            /* Annex IV: 2 400 EUR/t */

/* Annex II fossil default rows (LCV MJ/g · WtT gCO2eq/MJ · Cf g/gFuel) */
const FUELS = {
  HFO: { lcv: R(405, 10000), wtt: R(135, 10), co2: R(3114, 1000), ch4: R(5, 100000), n2o: R(18, 100000),
    cite: 'Annex II "HFO ISO 8217 Grades RME to RMK"' },
  LFO: { lcv: R(410, 10000), wtt: R(132, 10), co2: R(3151, 1000), ch4: R(5, 100000), n2o: R(18, 100000),
    cite: 'Annex II "LFO ISO 8217 Grades RMA to RMD"' },
  MGO: { lcv: R(427, 10000), wtt: R(144, 10), co2: R(3206, 1000), ch4: R(5, 100000), n2o: R(18, 100000),
    cite: 'Annex II "MDO MGO ISO 8217 Grades DMX to DMB"' }
};

/* ---- the decisions ---- */
function targetFor(year) {
  /* Art. 4(2): each reduction applies "from 1 January" of its step year, so a
     compliance year uses the greatest step at or before it; before 2025 no
     limit exists and the instrument refuses. */
  if (!Number.isInteger(year) || year < 2025) {
    throw new Error('REFUSED: no intensity limit applies before 1 January 2025 (Art. 4(2))');
  }
  const step = Object.keys(REDUCTIONS).map(Number).filter((y) => y <= year).sort((a, b) => b - a)[0];
  return mul(REFERENCE, sub(R(1), REDUCTIONS[step]));
}

/* well-to-wake default intensity of a pinned fossil fuel, gCO2eq/MJ */
function wtwIntensity(fuelName) {
  const f = FUELS[fuelName];
  if (!f) throw new Error('REFUSED: no pinned Annex II default row for fuel ' + fuelName);
  const ttwPerGram = add(add(mul(f.co2, GWP.co2), mul(f.ch4, GWP.ch4)), mul(f.n2o, GWP.n2o));
  return add(f.wtt, div(ttwPerGram, f.lcv));
}

/* COMPLIANT iff actual <= target (Art. 4(2): "shall not exceed") */
function decide(actual, year) {
  const target = targetFor(year);
  const d = sub(target, actual);
  return cmp(actual, target) <= 0
    ? { verdict: 'COMPLIANT', marginStr: str(d), marginDec: dec(d, 4), targetStr: str(target) }
    : { verdict: 'NON-COMPLIANT', deficitStr: str(abs(d)), deficitDec: dec(abs(d), 4), targetStr: str(target) };
}

/* Annex IV: CB = (target - actual) × E; penalty = |CB| / (actual × 41 000) × 2 400 */
function penaltyEUR(actual, year, energyMJ) {
  if (cmp(energyMJ, R(0)) < 0) throw new Error('REFUSED: negative energy');
  if (cmp(actual, R(0)) <= 0) throw new Error('REFUSED: non-positive intensity');
  const cb = mul(sub(targetFor(year), actual), energyMJ);
  if (cmp(cb, R(0)) >= 0) return { penalty: R(0), penaltyStr: '0', cbStr: str(cb), due: false };
  const p = mul(div(abs(cb), mul(actual, VLSFO_MJ_PER_T)), EUR_PER_T);
  return { penalty: p, penaltyStr: str(p), penaltyDec: dec(p, 2), cbStr: str(cb), due: true };
}

/* ---- the intensity box for an observed CO2eq/fuel ratio -------------------
   A ship's registry row gives cf = reported CO2eq / reported fuel [g/g].
   Under the hypothesis that its fuel was a mass-mix of the pinned oil rows,
   the mix is CONSTRAINED: Σ w_f·cfg_f = cf, where cfg_f is the pinned row's
   own CO2eq per gram (Cf·GWP summed). WtW intensity over the constrained
   mix simplex is a ratio of linear functions of w, so its extremes sit at
   the vertices — the two-fuel blends (and pure fuels) that reproduce cf
   exactly. This box is exact and TIGHT: it contains every mix consistent
   with the observation and nothing else. cf outside [min cfg, max cfg] is
   infeasible under the hypothesis and REFUSED. */
function cfgPerGram(f) {
  return add(add(mul(f.co2, GWP.co2), mul(f.ch4, GWP.ch4)), mul(f.n2o, GWP.n2o));
}
function intensityBoxFromCf(cf) {
  const names = Object.keys(FUELS);
  const cand = [];                                   /* {i, lcv} at each feasible vertex */
  for (const a of names) {
    const fa = FUELS[a], ca = cfgPerGram(fa);
    if (cmp(ca, cf) === 0) cand.push({ i: add(fa.wtt, div(cf, fa.lcv)), lcv: fa.lcv });
    for (const b of names) {
      if (a === b) continue;
      const fb = FUELS[b], cb = cfgPerGram(fb);
      if (cmp(ca, cb) === 0) continue;
      const w = div(sub(cb, cf), sub(cb, ca));       /* mass fraction of a */
      if (cmp(w, R(0)) < 0 || cmp(w, R(1)) > 0) continue;
      const lcvMix = add(mul(w, fa.lcv), mul(sub(R(1), w), fb.lcv));
      const wttMix = div(add(mul(mul(w, fa.lcv), fa.wtt), mul(mul(sub(R(1), w), fb.lcv), fb.wtt)), lcvMix);
      cand.push({ i: add(wttMix, div(cf, lcvMix)), lcv: lcvMix });
    }
  }
  if (!cand.length) {
    return { verdict: 'REFUSED', why: 'cf ' + str(cf) + ' g/g is not reproducible by any mix of the pinned oil rows' };
  }
  let iLo = cand[0].i, iHi = cand[0].i, lcvLo = cand[0].lcv, lcvHi = cand[0].lcv;
  for (const c of cand) {
    if (cmp(c.i, iLo) < 0) iLo = c.i;
    if (cmp(c.i, iHi) > 0) iHi = c.i;
    if (cmp(c.lcv, lcvLo) < 0) lcvLo = c.lcv;
    if (cmp(c.lcv, lcvHi) > 0) lcvHi = c.lcv;
  }
  return { verdict: 'BOX', iLo, iHi, lcvLo, lcvHi };
}

/* the flip threshold: smallest energy fraction p of `alt` such that
   (1-p)·fossil + p·alt <= target  =>  p >= (fossil - target)/(fossil - alt) */
function blendFlip(fossilIntensity, altIntensity, year) {
  const target = targetFor(year);
  if (cmp(fossilIntensity, target) <= 0) {
    return { verdict: 'ALREADY-COMPLIANT', pStr: '0' };
  }
  if (cmp(altIntensity, target) >= 0) {
    return { verdict: 'REFUSED', why: 'the alternative fuel\'s intensity is not below the ' + year
      + ' limit — no blend fraction can flip the verdict' };
  }
  const p = div(sub(fossilIntensity, target), sub(fossilIntensity, altIntensity));
  return { verdict: 'FLIPS', p, pStr: str(p), pDec: dec(p, 6) };
}

module.exports = { R, add, sub, mul, div, cmp, abs, str, dec, fromDec,
  REFERENCE, REDUCTIONS, GWP, FUELS, targetFor, wtwIntensity, decide, penaltyEUR, blendFlip,
  cfgPerGram, intensityBoxFromCf };
