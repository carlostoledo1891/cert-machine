#!/usr/bin/env node
/* instruments/hseva/battery.js — the certified return-level fits calibrated
   on cases with known answers, red controls that must fire, and the shipped
   ledger walked and partly re-derived (the daily, monthly and annual blocks
   live; the hourly blocks — 175,320 points a buoy, a minute each — trusted to
   the ledger and its --check).

   Prints: "hseva battery: N pass, 0 fail, R/R red controls fired". */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..');
const IV = require(path.join(ROOT, 'instruments', 'interval', 'interval.js'));
const { FAMILIES } = require('./families.js');
const FT = require('./fit.js');
const BL = require('./blocks.js');

let pass = 0, fail = 0, reds = 0, redsFired = 0;
const ok = (cond, name) => { if (cond) pass++; else { fail++; console.error('FAIL ' + name); } };
const red = (fired, name) => { reds++; if (fired) { redsFired++; pass++; } else { fail++; console.error('RED DID NOT FIRE ' + name); } };
const within = (a, x) => a[0] <= x && x <= a[1];
const o = FT.floatOps, oi = FT.intervalOps;

/* ---- Φ ---- */
ok(within(oi.Phi(IV.iv(0)), 0.5) && IV.width(oi.Phi(IV.iv(0))) < 1e-15, 'Φ(0) encloses ½ tightly');
ok(within(oi.Phi(IV.iv(1.959963984540054)), 0.975) && within(oi.Phi(IV.iv(-1.959963984540054)), 0.025), 'Φ(±1.96) enclose 0.975 and 0.025');
ok(within(oi.Phi(IV.iv(3)), 0.9986501019683699) && within(oi.Phi(IV.iv(-4)), 3.167124183311986e-5) && within(oi.Phi(IV.iv(6)), 1 - 9.865876450376946e-10), 'Φ at 3, −4 and 6 (the continued-fraction pieces) enclose the tabulated values');
ok(IV.width(oi.Phi(IV.iv(1.2))) < 1e-14 && IV.width(oi.Phi(IV.iv(4))) < 1e-15, 'the enclosures are tight in both pieces');
{ const z = oi.PhiInv(IV.iv(0.975)); ok(within(z, 1.959963984540054) && IV.width(z) < 1e-9, 'Φ⁻¹(0.975) encloses 1.96 to 1e-9'); }
{ const z = oi.PhiInv(IV.iv(1 - 1 / 8766)); ok(z[0] > 3.68 && z[1] < 3.69, 'Φ⁻¹(1 − 1/8766), the hourly one-year quantile, is 3.686'); }
red(!within(oi.Phi(IV.iv(1)), 0.85), 'Φ(1) does not enclose 0.85 (it is 0.8413)');

/* ---- derivatives: every family\'s score is the gradient of its log-likelihood, its Hessian the Jacobian of the score ---- */
{
  const xs = [0.8, 1.2, 2.5, 0.4, 3.1, 1.7, 0.9, 2.2, 1.1, 0.6, 4.0, 1.4];
  const { Df } = FT.prepare(xs);
  const h = 1e-6;
  for (const [name, th] of [['weibull', [1.7, 1.5]], ['expweibull', [2.3, 0.9, 1.4]], ['normal', [1.5, 1.1]], ['lognormal', [0.3, 0.7]], ['exponential', [1.6]]]) {
    const F = FAMILIES[name];
    const g = F.score(o, th, Df), H = F.hess(o, th, Df);
    const gn = th.map((v, i) => { const a = th.slice(), b = th.slice(); a[i] += h; b[i] -= h; return (F.loglik(o, a, Df) - F.loglik(o, b, Df)) / (2 * h); });
    const Hn = th.map((v, i) => th.map((w, j) => { const a = th.slice(), b = th.slice(); a[j] += h; b[j] -= h; return (F.score(o, a, Df)[i] - F.score(o, b, Df)[i]) / (2 * h); }));
    ok(g.every((v, i) => Math.abs(v - gn[i]) < 1e-5 * Math.max(1, Math.abs(v))), name + ': the score is the gradient of the log-likelihood (finite differences)');
    ok(H.every((r, i) => r.every((v, j) => Math.abs(v - Hn[i][j]) < 1e-4 * Math.max(1, Math.abs(v)))), name + ': the Hessian is the Jacobian of the score, and symmetric');
  }
  /* the exponentiated Weibull at α = 1 is the Weibull */
  const w = FAMILIES.weibull, e = FAMILIES.expweibull;
  ok(Math.abs(w.loglik(o, [1.7, 1.5], Df) - e.loglik(o, [1, 1.7, 1.5], Df)) < 1e-9 && Math.abs(w.cdf(o, [1.7, 1.5], 2.0) - e.cdf(o, [1, 1.7, 1.5], 2.0)) < 1e-12, 'the exponentiated Weibull at α = 1 has the Weibull\'s likelihood and CDF');
  ok(Math.abs(w.quantile(o, [1.7, 1.5], w.cdf(o, [1.7, 1.5], 2.0)) - 2.0) < 1e-9 && Math.abs(e.quantile(o, [2.3, 0.9, 1.4], e.cdf(o, [2.3, 0.9, 1.4], 2.0)) - 2.0) < 1e-9 && Math.abs(FAMILIES.lognormal.quantile(o, [0.3, 0.7], FAMILIES.lognormal.cdf(o, [0.3, 0.7], 2.0)) - 2.0) < 1e-9, 'quantile ∘ cdf is the identity (Weibull, exponentiated Weibull, lognormal)');
}
/* ---- certification on data with a known answer ---- */
{
  /* an exact exponential sample: the MLE is the mean, 2 */
  const c = FT.certify('exponential', [1, 2, 3, 2, 1, 3]);
  ok(c.ok && within(c.box[0], 2) && c.maxRad < 1e-13, 'the exponential MLE of 1,2,3,2,1,3 is certified around its mean 2');
  const n = FT.certify('normal', [1, 2, 3, 4, 5]);
  ok(n.ok && within(n.box[0], 3) && within(n.box[1], Math.sqrt(2)), 'the normal MLE of 1..5 is certified around μ = 3, σ = √2');
  /* a Weibull sample drawn once with a fixed seed, k = 2, λ = 3: the certified box must contain the float MLE and be narrow */
  let s = 12345; const rnd = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  const xs = Array.from({ length: 400 }, () => 3 * Math.pow(-Math.log(1 - rnd()), 0.5));
  const w = FT.certify('weibull', xs);
  ok(w.ok && w.box[0][0] > 1.6 && w.box[0][1] < 2.4 && w.maxRad < 1e-10, 'a 400-point Weibull(2, 3) sample: the shape is certified within [1.6, 2.4] with a box narrower than 1e-10');
  const ew = FT.certify('expweibull', xs);
  ok(ew.ok, 'the exponentiated Weibull certifies on the same sample (' + (ew.ok ? 'α ' + ew.theta[0].toFixed(3) : ew.why) + ')');
  const ad = FT.andersonDarling(w);
  ok(ad[0] > 0 && ad[1] < 3 && IV.width(ad) < 1e-6, 'its Anderson–Darling statistic is enclosed, positive, small (' + ad[0].toFixed(4) + ') and tight');
  const rl = FT.returnLevel(w, 50, 24);
  ok(rl && rl[0] > 6 && rl[1] < 12 && IV.width(rl) < 1e-8, 'the 50-year daily return level is enclosed (' + rl[0].toFixed(3) + ' m) and tight');
  ok(FT.returnLevel(w, 1, 8766) === null, 'a one-year return level on annual blocks is refused, not printed as a number');
  red((() => { const r = FT.rank([{ family: 'a', ad: [1, 2] }, { family: 'b', ad: [1.5, 3] }]); return r.verdict === 'REFUSED' && r.tied[0] === 'b'; })(), 'overlapping A² enclosures REFUSE the ranking and name the tie');
  ok(FT.rank([{ family: 'a', ad: [1, 2] }, { family: 'b', ad: [2.5, 3] }]).verdict === 'DECIDED', 'separated enclosures decide it');
  red(!FT.certify('weibull', [1, 1, 1, 1]).ok, 'a constant sample has no Weibull MLE and is refused');
}
/* ---- blocks ---- */
{
  const S = { n: 5, t: ['2000-01-01-00', '2000-01-01-01', '2000-01-02-00', '2000-02-01-00', '2001-01-01-00'], h: [1, 3, 2, 5, 4] };
  const d = BL.blockMaxima(S, 'daily'), m = BL.blockMaxima(S, 'monthly'), a = BL.blockMaxima(S, 'annual');
  ok(d.n === 4 && d.x.join(',') === '3,2,5,4' && m.n === 3 && m.x.join(',') === '3,5,4' && a.n === 2 && a.x.join(',') === '5,4', 'daily, monthly and annual maxima are the largest value in each calendar block');
  red(d.keys[0] === '2000-01-01' && a.keys[1] === '2001', 'the block keys are the calendar parts of the timestamps');
}
/* ---- the shipped ledger ---- */
{
  const led = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'hseva-ledger.json'), 'utf8'));
  ok(Object.keys(led.buoys).length === 3 && led.blocks.length === 4 && led.families.length === 5, 'three buoys, four block sizes, five families');
  let certified = 0, refused = 0, decided = 0, refusedRank = 0;
  for (const b of Object.values(led.buoys)) for (const blk of Object.values(b.blocks)) {
    for (const f of Object.values(blk.fits)) { if (f.certified) { certified++; ok(Number(f.ad.lo) <= Number(f.ad.hi) && Number(f.maxRad) < 1e-4, 'a certified fit has an ordered A² enclosure and a box narrower than 1e-4'); } else refused++; }
    if (blk.ranking.verdict === 'DECIDED') decided++; else refusedRank++;
    const best = blk.ranking.best; if (best) ok(Object.entries(blk.fits).filter(([k, v]) => v.certified && k !== best).every(([, v]) => Number(v.ad.lo) > Number(blk.fits[best].ad.hi) || blk.ranking.verdict === 'REFUSED'), 'a DECIDED ranking has the best A² wholly below every other');
  }
  ok(certified >= 50 && refused <= 6, certified + ' fits certified, ' + refused + ' refused across the ledger');
  ok(decided + refusedRank === 12, decided + ' rankings decided and ' + refusedRank + ' refused, of 12');
  /* live: the quick blocks re-derived by the ledger runner */
  const r = cp.spawnSync('node', [path.join(ROOT, 'tools', 'run-hseva-ledger.js'), '--check', '--quick'], { cwd: ROOT });
  ok(r.status === 0, 'the daily, monthly and annual blocks re-derive identically (' + String(r.stdout).trim().split('\n').pop() + ')');
  /* the ordering the paper states: the exponentiated Weibull at the highest frequency */
  const hourlyBest = ['A', 'B', 'C'].map((b) => led.buoys[b].blocks.hourly.ranking.best);
  ok(hourlyBest.filter((v) => v === 'expweibull').length === 2 && hourlyBest[1] === 'lognormal', 'the exponentiated Weibull is the decided best on the hourly series of A and C; the lognormal on B (' + hourlyBest.join(', ') + ')');
  ok(['A', 'B', 'C'].every((b) => led.buoys[b].blocks.annual.ranking.best === 'lognormal') && !Object.values(led.buoys).some((b) => Object.values(b.blocks).some((blk) => blk.ranking.best === 'weibull')), 'the lognormal wins every annual series and the Weibull wins nothing');
}

console.log('hseva battery: ' + pass + ' pass, ' + fail + ' fail, ' + redsFired + '/' + reds + ' red controls fired');
process.exit(fail ? 1 : 0);
