#!/usr/bin/env node
/* paper-numbers/terra-peaks.js — every number the terra peak-splitting paper
   (paper/tex/terra-peaks.tex) quotes, read from the records that decided it and
   written as LaTeX macros to paper/tex/terra-peaks-numbers.tex:
     certs/terra-recert-t{1..8}.json      the eight radii-polynomial enclosures
     certs/terra-peakcount-t{1..8}.json   the eight certified critical-point counts
     certs/terra-sigmastar.json           sigma* = 1/(8 pi^2) and the windows, exact rationals
     certs/terra-bracket-table.json       the table under the two theorems + the threshold pin
     certs/mfg-cap-census-N{2..5}-c-12.json   EXACTLY-3 Krawczyk census (truncation level)
     certs/mfg-cap-multiplicity.json      >= 3 disjoint uniqueness balls per coupling
     instruments/mfgcap/records/terra-phasemap.json   the float phase map (sha-pinned; a guide)
     TERRA-PORT.md                        the size of the lab's own unreproduced float prior
   The paper \inputs the macro file, so it cannot quote a number the machine did
   not record; a record that no longer says what a sentence needs makes this
   refuse (need()), as tools/build-paper-numbers.js does for the Elsevier papers.
   ROUNDING IS OUTWARD: a lower bound is floored, an upper bound is ceiled, at
   the printed precision — a printed bound is never tighter than the record's.
   The decimal digits of sigma* and of r_c are derived here from the records'
   exact rational brackets in BigInt, never from their float renderings.
   usage: node tools/paper-numbers/terra-peaks.js                           MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'paper', 'tex', 'terra-peaks-numbers.tex');
const J = (rel) => { const p = path.join(ROOT, rel); if (!fs.existsSync(p)) die('missing ' + rel); return JSON.parse(fs.readFileSync(p, 'utf8')); };
const die = (m) => { console.error('TERRA PAPER NUMBERS REFUSED: ' + m); process.exit(1); };
const need = (c, m) => { if (!c) die(m); };
const git = (() => { try { return cp.execSync('git rev-parse --short=12 HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

/* ---------------------------------------------------------- formatting ---- */
const int = (x) => { need(Number.isInteger(Number(x)), 'not an integer: ' + x); return Math.round(Number(x)).toLocaleString('en-US').replace(/,/g, '{,}'); };
/* directed rounding on the decimal expansion of the double (toExponential/toFixed
   with many digits are correctly rounded by the language spec); dir +1 rounds away
   from zero, -1 toward zero — so lower bounds use UP=false and upper bounds UP=true */
function sciDir(x, d, up) {
  need(Number.isFinite(x) && x !== 0, 'sciDir on ' + x);
  const neg = x < 0;
  const s = Math.abs(x).toExponential(40);
  const [mant, ex] = s.split('e');
  let e = Number(ex);
  const digits = mant.replace('.', '');
  let n = BigInt(digits.slice(0, d + 1));
  const restNonZero = /[1-9]/.test(digits.slice(d + 1));
  if (restNonZero && up) n += 1n;
  let ks = n.toString();
  if (ks.length > d + 1) { ks = ks.slice(0, d + 1); e += 1; }
  return (neg ? '-' : '') + ks[0] + (d > 0 ? '.' + ks.slice(1) : '') + '\\times10^{' + e + '}';
}
function fixDir(x, d, up) {
  need(Number.isFinite(x), 'fixDir on ' + x);
  const neg = x < 0;
  const s = Math.abs(x).toFixed(40);
  const [ip, fp] = s.split('.');
  let n = BigInt(ip + fp.slice(0, d));
  const restNonZero = /[1-9]/.test(fp.slice(d));
  if (restNonZero && up) n += 1n;
  let ks = n.toString().padStart(d + 1, '0');
  const out = ks.slice(0, ks.length - d) + (d > 0 ? '.' + ks.slice(ks.length - d) : '');
  return (neg ? '-' : '') + out;
}
/* a positive quantity bounded ABOVE (radius, defect, contraction constant, pad): ceil */
const upSci = (x, d) => sciDir(x, d, true);
const upFix = (x, d) => fixDir(x, d, true);
/* a positive quantity bounded BELOW (density floor, margin): floor */
const loSci = (x, d) => sciDir(x, d, false);
const loFix = (x, d) => fixDir(x, d, false);
/* a float that is a guide, not a bound (a proposed critical point): nearest, shown with ≈ */
const near = (x, d) => Number(x).toFixed(d);
/* exact rational "p/q" (decimal strings) -> truncated decimal digits common to both ends of a bracket */
function bracketDigits(loStr, hiStr, places) {
  const frac = (s) => { const [p, q] = s.split('/'); return [BigInt(p), BigInt(q)]; };
  const [pl, ql] = frac(loStr), [ph, qh] = frac(hiStr);
  need(pl * qh <= ph * ql, 'rational bracket is reversed');
  const scale = 10n ** BigInt(places);
  const fl = (pl * scale) / ql, fh = (ph * scale) / qh;         /* floors (positive) */
  need(fl === fh, 'rational bracket does not pin ' + places + ' decimal places');
  const s = fl.toString().padStart(places + 1, '0');
  return s.slice(0, s.length - places) + '.' + s.slice(s.length - places);
}
const tex = (s) => String(s).replace(/([&%$#_{}])/g, '\\$1');
const ratio = (i) => (i.A3 ? Number((i.A3 / i.A1).toPrecision(3)) : Number((i.A2 / i.A1).toPrecision(3)));

/* ------------------------------------------------------------ records ---- */
const TAGS = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8'];
const RC = {}, PC = {};
for (const t of TAGS) {
  RC[t] = J('certs/terra-recert-' + t + '.json');
  PC[t] = J('certs/terra-peakcount-' + t + '.json');
  need(RC[t].verdict === 'VERIFIED', t + ' enclosure not VERIFIED');
  need(PC[t].verdict === 'VERIFIED', t + ' peak count not VERIFIED');
  need(Object.keys(RC[t].falsifiers).length === 9 && Object.values(RC[t].falsifiers).every(Boolean), t + ' does not have nine firing falsifiers');
  need(PC[t].source.cert === 'certs/terra-recert-' + t + '.json' && PC[t].source.r === RC[t].bounds.r, t + ' peak count is not about this enclosure');
  need(RC[t].bounds.Z1 < 1 && RC[t].positivity.minM > 0 && RC[t].bounds.minW > 0, t + ' bounds do not close');
  need(RC[t].bounds.Z1even === RC[t].bounds.Z1 && RC[t].bounds.Z1odd === RC[t].bounds.Z1, t + ' Z1 is not the max of its two blocks as recorded');
  need(PC[t].wells === 1 && PC[t].V.minima === 1, t + ' potential is not one-well');
  need(PC[t].m.maxima === PC[t].peaks && PC[t].m.assertions.contiguous && PC[t].m.assertions.curvatureAlternates && PC[t].m.assertions.slopeMatchesChain, t + ' chain assertions not all true');
  /* the radii polynomial the frozen verifier uses: p(r) = Z2 r^2 / 2 - (1 - Z1) r + Y0 */
  const b = RC[t].bounds, sq = Math.sqrt((1 - b.Z1) ** 2 - 2 * b.Z2 * b.Y0);
  need(Math.abs(2 * b.Y0 / ((1 - b.Z1) + sq) / b.rMin - 1) < 1e-9 && Math.abs(((1 - b.Z1) + sq) / b.Z2 / b.rMax - 1) < 1e-9, t + ' recorded roots are not those of p(r) = Z2 r^2/2 - (1-Z1) r + Y0');
  need(b.rMin < b.r && b.r < b.rMax, t + ' radius outside the admissible interval');
}
const want = { t1: 2, t2: 1, t3: 1, t4: 2, t5: 2, t6: 3, t7: 1, t8: 2 };
for (const t of TAGS) need(PC[t].peaks === want[t], t + ' peak count moved from ' + want[t]);
const SS = J('certs/terra-sigmastar.json');
need(SS.verdict === 'VERIFIED' && SS.P1_bandpass.identity && SS.P1_bandpass.gammaFree, 'sigmastar: band-pass identity not decided');
need(SS.P2_crossover.every((r) => r.identity && r.gammaFree && r.rootIsOneOverK && r.signBelowPositive && r.signAboveNegative), 'sigmastar: a crossover row failed');
need(SS.P2_crossover[0].k === 2 && SS.P2_crossover.every((r, i) => r.k === i + 2), 'sigmastar: crossover rows are not k = 2..');
need(SS.P3_windows.length === 2 && SS.P3_windows.every((w) => w.exact), 'sigmastar: windows not exact');
const BT = J('certs/terra-bracket-table.json');
need(BT.verdict === 'VERIFIED' && BT.table.length === TAGS.length, 'bracket table not VERIFIED with eight rows');
for (const row of BT.table) {
  const t = row.tag.toLowerCase(), r = RC[t], p = PC[t];
  need(r && p, 'bracket row ' + row.tag + ' has no record');
  need(row.r === r.bounds.r && row.Z1 === r.bounds.Z1 && row.minM === r.positivity.minM && row.peaks === p.peaks && row.wells === p.wells, 'bracket row ' + row.tag + ' disagrees with its records');
  need(row.sigma === r.instance.sigma && row.gamma === r.instance.gamma && row.A1 === r.instance.A1 && row.A2 === r.instance.A2 && row.A3 === r.instance.A3 && row.N === r.instance.N && row.nu === r.instance.nu, 'bracket row ' + row.tag + ' instance drifted');
}
need(BT.thresholdPin.linearResponsePrediction.insideCertifiedPin === true, 'the linear-response prediction is no longer inside the pin');
const CEN = [2, 3, 4, 5].map((N) => J('certs/mfg-cap-census-N' + N + '-c-12.json'));
CEN.forEach((c, i) => need(c.verdict === 'VERIFIED' && c.count === 3 && c.N === i + 2 && c.oneToOne && c.c === -12 && c.sigma === 0.5, 'census N=' + (i + 2) + ' moved'));
const MULT = J('certs/mfg-cap-multiplicity.json');
need(MULT.verdict === 'VERIFIED' && MULT.couplings.every((c) => c.claimed && Object.values(c.pairs).every((p) => p.disjoint && p.gap > 0) && Object.values(c.balls).every((b) => b.minM > 0 && b.Z1 < 1)), 'multiplicity: a coupling no longer claims three disjoint positive balls');
need(MULT.boundary.claimed === false && MULT.boundary.branchCollapsedToConstant, 'multiplicity: the honest boundary row moved');
need(MULT.sigma === 0.5 && Math.abs(MULT.cStar + Math.PI * Math.PI) < 1e-12, 'multiplicity: c* is not -sigma^2 (2 pi)^2 at sigma = 1/2');
/* the float phase map on the atlas page: a guide, pinned by sha256 to the pin the page holds */
const PM_SHA = '30b3cfe495142578bad807711158ba3f70f4fa51c6bf92476804fd8b1a8a23b9';
const pmBytes = fs.readFileSync(path.join(ROOT, 'instruments', 'mfgcap', 'records', 'terra-phasemap.json'));
need(crypto.createHash('sha256').update(pmBytes).digest('hex') === PM_SHA, 'phase-map data drifted from its pin');
const PM = JSON.parse(pmBytes.toString());
/* the lab's own prior: an unreproduced float campaign, its size recorded in the port plan */
const plan = fs.readFileSync(path.join(ROOT, 'TERRA-PORT.md'), 'utf8');
const prior = /unreproduced (\d+)-sample float campaign/.exec(plan);
need(prior, 'TERRA-PORT.md no longer records the size of the unreproduced float prior');

/* ------------------------------------------------------------- macros ---- */
const M = ['%% generated by tools/paper-numbers/terra-peaks.js from certs/terra-recert-t{1..8}.json, certs/terra-peakcount-t{1..8}.json, certs/terra-sigmastar.json, certs/terra-bracket-table.json, certs/mfg-cap-census-N{2..5}-c-12.json, certs/mfg-cap-multiplicity.json — do not edit (git ' + git + ')'];
const def = (name, val) => { if (!/^[A-Za-z]+$/.test(name)) die('bad macro name ' + name); M.push('\\newcommand{\\' + name + '}{' + val + '}'); };
const rows = (name, rr) => def(name, rr.map((r) => r.join(' & ') + ' \\\\').join('\n'));

def('RepoCommit', git);
def('RecDate', RC.t1.meta.date);
def('MultDate', MULT.meta.date);
def('NumInstances', String(TAGS.length));
def('NumBracketRows', String(TAGS.length - 2));
def('NumBracketRowsWord', ['', '', '', '', '', '', 'six', 'seven'][TAGS.length - 2]);
def('NumFalsifiers', String(Object.keys(RC.t1.falsifiers).length));
def('KMax', String(SS.P2_crossover[SS.P2_crossover.length - 1].k));
def('NumCouplings', String(MULT.couplings.length));
def('NumCouplingsWord', ['', '', '', '', '', '', 'six', 'seven'][MULT.couplings.length]);
def('CensusLevels', CEN.map((c) => c.N).join(', '));

/* ---- the instances, as exact binary64 ---- */
function instance(prefix, t) {
  const i = RC[t].instance, h = i.exactBinary64Hex;
  def(prefix + 'Sigma', String(i.sigma)); def(prefix + 'Gamma', String(i.gamma));
  def(prefix + 'AOne', String(i.A1)); def(prefix + 'ATwo', String(i.A2)); def(prefix + 'AThree', String(i.A3));
  def(prefix + 'N', String(i.N)); def(prefix + 'Nu', String(i.nu)); def(prefix + 'G', int(i.G));
  def(prefix + 'SigmaHex', h.sigma); def(prefix + 'GammaHex', h.gamma); def(prefix + 'AOneHex', h.A1); def(prefix + 'ATwoHex', h.A2); def(prefix + 'AThreeHex', h.A3);
  def(prefix + 'Ratio', String(ratio(i)));
}
instance('TOne', 't1'); instance('TSix', 't6');
need(RC.t1.instance.A1 > 4 * RC.t1.instance.A2 && RC.t1.instance.A3 === 0, 'T1 is not a one-well second-harmonic instance');
need(RC.t6.instance.A2 === 0 && 3 * RC.t6.instance.A3 < RC.t6.instance.A1, 'T6 is not a one-well third-harmonic instance');
need(RC.t6.instance.sigma === RC.t1.instance.sigma && RC.t6.instance.gamma === RC.t1.instance.gamma && RC.t6.instance.A1 === RC.t1.instance.A1 && RC.t6.instance.N === RC.t1.instance.N && RC.t6.instance.nu === RC.t1.instance.nu, 'T6 no longer shares sigma, gamma, A1, N, nu with T1');

/* ---- the enclosure bounds (upper bounds ceiled, floors floored) ---- */
function bounds(prefix, t) {
  const b = RC[t].bounds, p = RC[t].positivity, pc = PC[t];
  def(prefix + 'R', upSci(b.r, 3)); def(prefix + 'RShort', upSci(b.r, 2));
  def(prefix + 'RMin', upSci(b.rMin, 3)); def(prefix + 'RMax', loSci(b.rMax, 3));
  def(prefix + 'YZero', upSci(b.Y0, 3)); def(prefix + 'ZOne', upFix(b.Z1, 4)); def(prefix + 'ZTwo', upFix(b.Z2, 4));
  def(prefix + 'Closure', loSci(b.closureMargin, 3));
  def(prefix + 'MinM', loFix(p.minM, 4)); def(prefix + 'MinW', loFix(b.minW, 4));
  def(prefix + 'PadOne', upSci(pc.ballPads.d1, 3)); def(prefix + 'PadTwo', upSci(pc.ballPads.d2, 3)); def(prefix + 'PadThree', upSci(pc.ballPads.d3, 3));
  def(prefix + 'MinMargin', loSci(pc.m.minMargin, 3));
  def(prefix + 'VMinMargin', loSci(pc.V.minMargin, 3));
  def(prefix + 'Peaks', String(pc.peaks)); def(prefix + 'Minima', String(pc.m.minima)); def(prefix + 'Wells', String(pc.wells)); def(prefix + 'VMaxima', String(pc.V.maxima));
  def(prefix + 'Regions', String(pc.m.regions.length)); def(prefix + 'RegionGrid', String(pc.m.regions[0].grid));
  need(pc.m.regions.every((r) => r.grid === pc.m.regions[0].grid), t + ' regions use different grids');
  /* the margin-to-pad ratio the text quotes as "orders of magnitude" */
  const orders = Math.floor(Math.log10(pc.m.minMargin / Math.max(pc.ballPads.d1, pc.ballPads.d2)));
  def(prefix + 'MarginOrders', String(orders));
  /* the chain: proposed critical points (floats; the certified objects are the region signs) */
  const chain = pc.m.chain, curv = pc.m.curv;
  need(chain[0] === 0 && chain[chain.length - 1] === 0.5, t + ' chain does not run from 0 to 1/2');
  def(prefix + 'ChainInterior', chain.slice(1, -1).map((x) => near(x, 3)).join(', '));
  def(prefix + 'ChainKinds', curv.map((s) => (s === '-' ? 'max' : 'min')).join(', '));
  const regionRows = (regs) => regs.map((r) => [
    r.kind === 'curv' ? '$f\'\'$' : '$f\'$',
    '$[' + near(r.lo, 4) + ',\\ ' + near(r.hi, 4) + ']$',
    '$' + r.sign + '$',
    '$' + loSci(r.margin, 3) + '$',
  ]);
  rows(prefix + 'RegionRows', regionRows(pc.m.regions));
  rows(prefix + 'VRegionRows', regionRows(pc.V.regions));
  /* the certified curvature-negative region holding each interior maximum, rounded outward */
  const maxRegions = pc.m.regions.filter((r) => r.kind === 'curv' && r.sign === '-' && r.lo > 0 && r.hi < 0.5);
  need(maxRegions.length === pc.m.curv.slice(1, -1).filter((s) => s === '-').length, t + ' interior maxima and curvature-negative regions disagree');
  def(prefix + 'MaxRegions', maxRegions.map((r) => '[' + loFix(r.lo, 4) + ',\\ ' + upFix(r.hi, 4) + ']').join(' and '));
  /* torus critical points (float proposals): interior points mirror, endpoints do not */
  const pts = [];
  chain.forEach((x, j) => { const k = curv[j] === '-' ? 'max' : 'min'; pts.push([x, k]); if (j > 0 && j < chain.length - 1) pts.push([1 - x, k]); });
  const show = (x) => (x === 0 ? '0' : x === 0.5 ? '1/2' : near(x, 3));
  const list = (k) => pts.filter((e) => e[1] === k).map((e) => e[0]).sort((a, b) => a - b).map(show).join(', ');
  def(prefix + 'TorusMaxima', list('max')); def(prefix + 'TorusMinima', list('min'));
  need(pts.filter((e) => e[1] === 'max').length === pc.peaks && pts.filter((e) => e[1] === 'min').length === pc.m.minima, t + ' torus counts disagree with the record');
}
bounds('TOne', 't1'); bounds('TSix', 't6');
/* T1's radius step above the lower root, as the frozen verifier takes it */
need(Math.abs(RC.t1.bounds.r / RC.t1.bounds.rMin - 1.05) < 1e-6, 'T1 radius is no longer one 1.05 step above the lower root');
def('RStep', '1.05');
/* coefficient honesty: T1's A2 is the binary64 product 0.003 x 0.2, one ulp above the double nearest 0.0006 */
const ulpsAbove = (x, y) => { const b = new Float64Array(2); const u = new BigUint64Array(b.buffer); b[0] = x; b[1] = y; return (u[0] - u[1]).toString(); };
need(RC.t1.instance.A2 === 0.003 * 0.2 && ulpsAbove(RC.t1.instance.A2, 0.0006) === '1', 'T1 A2 is no longer fl(0.003 x 0.2), one ulp above fl(0.0006)');
def('ATwoUlps', ulpsAbove(RC.t1.instance.A2, 0.0006));
/* T1 cross-implementation agreement with the origin kernel */
const X = RC.t1.terraCrossCheck;
need(X.agree && X.agreement.r_ratio === 1 && X.agreement.Z1_diff === 0 && X.agreement.minW_diff === 0, 'T1 cross-implementation agreement lost');
def('TOneCrossMinMDiff', near(X.agreement.minM_diff, 5));
def('TOneCrossMinMOrigin', loFix(X.recordedMinM, 4));
def('TOneWitHjb', upSci(RC.t1.witnesses.hjbMax, 2)); def('TOneWitFp', upSci(RC.t1.witnesses.fpResMax, 2)); def('TOneWitRecip', upSci(RC.t1.witnesses.reciprocalMaw, 2));
def('FrozenVerifierSha', RC.t1.provenance.frozenVerifierSha256.slice(0, 12));
def('TOneRecordSha', RC.t1.provenance.recordSha256.slice(0, 12));

/* ---- linear response: exact rationals ---- */
const ssDigits = bracketDigits(SS.sigmaStar.bracketRational[0], SS.sigmaStar.bracketRational[1], 30);
def('SigmaStarDigits', ssDigits);
def('SigmaStarWidth', upSci(SS.sigmaStar.widthDecimal, 2));
def('SigmaStarShort', ssDigits.slice(0, 14));
need(ssDigits.startsWith('0.0126651479552922'), 'sigma* digits moved');
const w2 = SS.P3_windows.find((w) => w.k === 2), w3 = SS.P3_windows.find((w) => w.k === 3);
def('FlatThresholdTwo', w2.flatThreshold); def('FlatThresholdThree', w3.flatThreshold);
def('GainLimitTwo', w2.limitGainRatio); def('GainLimitThree', w3.limitGainRatio);
def('WindowTwoLo', w2.window[0]); def('WindowTwoHi', w2.window[1]); def('WindowThreeLo', w3.window[0]); def('WindowThreeHi', w3.window[1]);
need(w2.window[0] === '1/16' && w2.window[1] === '1/4' && w3.window[0] === '1/27' && w3.window[1] === '1/3', 'the splitting windows moved');
def('BandpassLhs', SS.P1_bandpass.lhs.replace(/\*/g, ' ').replace(/sigma/g, '\\sigma').replace(/kappa/g, '\\kappa').replace(/-1 /, '-'));
/* the crossover polynomials as the record prints them, k = 2..KMax: "-12*s^2 + 3" -> "3 - 12 s^2" */
const crossover = SS.P2_crossover.map((r) => {
  const m = /^-(\d+)\*s\^2 \+ (\d+)$/.exec(r.N);
  need(m, 'crossover polynomial for k=' + r.k + ' is not of the recorded shape: ' + r.N);
  need(Number(m[2]) === r.k * r.k - 1 && Number(m[1]) === (r.k * r.k - 1) * r.k * r.k, 'crossover polynomial for k=' + r.k + ' is not (k^2-1)(1-k^2 s^2)');
  return 'N_{' + r.k + '} = ' + m[2] + ' - ' + m[1] + '\\, s^2';
});
const lines = []; for (let i = 0; i < crossover.length; i += 4) lines.push(crossover.slice(i, i + 4).join(',\\quad '));
def('CrossoverList', lines.join(',\\\\\n'));

/* ---- the bracket table ---- */
const order = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'];
rows('BracketRows', order.map((tag) => {
  const row = BT.table.find((x) => x.tag === tag), t = tag.toLowerCase(), b = RC[t].bounds, i = RC[t].instance;
  return [
    tag,
    '$' + i.sigma + '$',
    (i.A3 ? '$r_3 = ' : '$r_2 = ') + ratio(i) + '$',
    '$' + i.N + '$',
    '$' + i.nu + '$',
    '$' + upSci(b.r, 3) + '$',
    '$' + upFix(b.Z1, 4) + '$',
    '$' + loSci(b.closureMargin, 3) + '$',
    '$' + loFix(RC[t].positivity.minM, 4) + '$',
    '$' + row.peaks + '\\,/\\,' + row.wells + '$',
  ];
}));
const pin = BT.thresholdPin.linearResponsePrediction;
def('PinLo', String(ratio(RC.t7.instance))); def('PinHi', String(ratio(RC.t8.instance)));
need(ratio(RC.t7.instance) === 0.13 && ratio(RC.t8.instance) === 0.14 && PC.t7.peaks === 1 && PC.t8.peaks === 2, 'the T7/T8 pin moved');
const rcDigits = bracketDigits(pin.bracketRational[0], pin.bracketRational[1], 12);
def('RcDigits', rcDigits);
need(Number(rcDigits) > 0.13 && Number(rcDigits) < 0.14, 'r_c digits outside the pin');
def('TTwoRatio', String(ratio(RC.t2.instance))); def('TThreeSigma', String(RC.t3.instance.sigma)); def('TFourRatio', String(ratio(RC.t4.instance)));
def('TFiveSigma', String(RC.t5.instance.sigma)); def('TFiveN', String(RC.t5.instance.N)); def('TFiveRatio', String(ratio(RC.t5.instance)));
need(RC.t3.instance.sigma > Number(ssDigits), 'T3 is no longer above sigma*');
need(ratio(RC.t2.instance) < Number(rcDigits) && ratio(RC.t4.instance) > Number(rcDigits), 'T2/T4 no longer sit on the predicted sides');
const rAll = TAGS.map((t) => RC[t].bounds.r);
def('RadiusMin', upSci(Math.min(...rAll), 2)); def('RadiusMax', upSci(Math.max(...rAll), 2));
def('MinMFloor', loFix(Math.min(...TAGS.map((t) => RC[t].positivity.minM)), 4));

/* ---- the census ---- */
rows('CensusRows', CEN.map((c) => ['$' + c.N + '$', '$' + (2 * c.N + 1) + '$', int(c.stats.processed), int(c.stats.dropRes), int(c.stats.dropK), '$' + near(c.stats.seconds, 1) + '$']));
def('CensusCount', String(CEN[0].count)); def('CensusC', String(CEN[0].c));
def('CensusNFiveBoxes', int(CEN[3].stats.processed)); def('CensusNFiveSeconds', near(CEN[3].stats.seconds, 0));

/* ---- multiplicity ---- */
rows('MultRows', MULT.couplings.map((c) => {
  const gaps = Object.values(c.pairs).map((p) => p.gap);
  return ['$' + c.c + '$', '$' + c.N + '$', '$' + upSci(c.balls.constant.r, 2) + '$', '$' + upSci(c.balls.branch.r, 2) + '$', '$' + upFix(Math.max(c.balls.constant.Z1, c.balls.branch.Z1, c.balls.mirror.Z1), 3) + '$', '$' + loSci(Math.min(c.balls.branch.minM, c.balls.mirror.minM), 3) + '$', '$' + loFix(Math.min(...gaps), 2) + '$'];
}));
def('MultCouplings', MULT.couplings.map((c) => '$' + c.c + '$').join(', '));
def('MultMinM', loSci(MULT.minMOverAllBalls, 3));
def('MultDeepestC', String(MULT.couplings.reduce((a, c) => (Math.min(c.balls.branch.minM, c.balls.mirror.minM) < Math.min(a.balls.branch.minM, a.balls.mirror.minM) ? c : a)).c));
def('MultCStar', near(MULT.cStar, 4)); def('MultBoundaryC', String(MULT.boundary.c)); def('MultSigma', '1/2'); def('MultNu', String(MULT.nu));

/* ---- the float map and the prior ---- */
def('PhaseMapSolves', int(PM.grid.length)); def('PhaseMapN', String(PM.N)); def('PhaseMapSha', PM_SHA.slice(0, 12));
need(PM.grid.every((c) => c.conv), 'the phase map has non-converged solves the text does not mention');
def('PriorSamples', int(prior[1]));

fs.writeFileSync(OUT, M.join('\n') + '\n');
console.log('wrote paper/tex/terra-peaks-numbers.tex (' + (M.length - 1) + ' macros) from ' + (TAGS.length * 2 + 2 + CEN.length + 1) + ' certificates @ git ' + git);
