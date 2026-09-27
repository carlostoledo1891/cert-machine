#!/usr/bin/env node
/* instruments/hseva/battery.js — the certified return-level fits calibrated on
   cases with known answers, red controls that must fire, and the shipped ledger
   walked and partly re-derived (the daily, weekly, monthly and annual blocks of
   the three buoys live; the hourly blocks, the hindcast points and the printed
   marginals trusted to the ledger and its --check).

   Prints: "hseva battery: N pass, 0 fail, R/R red controls fired". */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..');
const IV = require(path.join(ROOT, 'instruments', 'interval', 'interval.js'));
const { FAMILIES, PAPER_SIX } = require('./families.js');
const FT = require('./fit.js');
const BL = require('./blocks.js');

let pass = 0, fail = 0, reds = 0, redsFired = 0;
const ok = (cond, name) => { if (cond) pass++; else { fail++; console.error('FAIL ' + name); } };
const red = (fired, name) => { reds++; if (fired) { redsFired++; pass++; } else { fail++; console.error('RED DID NOT FIRE ' + name); } };
const within = (a, x) => a[0] <= x && x <= a[1];
const o = FT.floatOps, oi = FT.intervalOps;
const I = (x) => IV.iv(x);

/* ---- Φ ---- */
ok(within(oi.Phi(I(0)), 0.5) && IV.width(oi.Phi(I(0))) < 1e-15, 'Φ(0) encloses ½ tightly');
ok(within(oi.Phi(I(1.959963984540054)), 0.975) && within(oi.Phi(I(-1.959963984540054)), 0.025), 'Φ(±1.96) enclose 0.975 and 0.025');
ok(within(oi.Phi(I(3)), 0.9986501019683699) && within(oi.Phi(I(-4)), 3.167124183311986e-5) && within(oi.Phi(I(6)), 1 - 9.865876450376946e-10), 'Φ at 3, −4 and 6 (the continued-fraction pieces) enclose the tabulated values');
{ const z = oi.PhiInv(I(0.975)); ok(within(z, 1.959963984540054) && IV.width(z) < 1e-9, 'Φ⁻¹(0.975) encloses 1.96 to 1e-9'); }
red(!within(oi.Phi(I(1)), 0.85), 'Φ(1) does not enclose 0.85 (it is 0.8413)');

/* ---- the gamma family: identities with known closed forms ---- */
{
  const EG = 0.5772156649015329, PI2 = Math.PI * Math.PI;
  ok(within(oi.lgamma(I(1)), 0) && within(oi.lgamma(I(2)), 0) && within(oi.lgamma(I(0.5)), 0.5723649429247001) && within(oi.lgamma(I(10)), 12.801827480081469), 'lnΓ at 1, 2, ½ and 10 encloses 0, 0, ½ ln π and ln 9!');
  ok(within(oi.digamma(I(1)), -EG) && within(oi.digamma(I(0.5)), -EG - 2 * Math.LN2) && within(oi.digamma(I(2)), 1 - EG), 'ψ(1) = −γ, ψ(½) = −γ − 2 ln 2, ψ(2) = 1 − γ');
  ok(within(oi.trigamma(I(1)), PI2 / 6) && within(oi.trigamma(I(0.5)), PI2 / 2) && within(oi.trigamma(I(2)), PI2 / 6 - 1), 'ψ′(1) = π²/6, ψ′(½) = π²/2, ψ′(2) = π²/6 − 1');
  ok(IV.width(oi.digamma(I(3.7))) < 1e-13 && IV.width(oi.trigamma(I(3.7))) < 1e-13 && IV.width(oi.lgamma(I(3.7))) < 1e-11, 'the enclosures are tight (ψ, ψ′ below 1e-13; lnΓ below 1e-11)');
  ok([0.3, 1, 5, 20].every((z) => within(oi.gammaP(I(1), I(z)), 1 - Math.exp(-z))), 'P(1, z) = 1 − e^{−z}');
  ok([0.5, 3, 12, 35].every((z) => within(oi.gammaP(I(3), I(z)), 1 - Math.exp(-z) * (1 + z + z * z / 2))), 'P(3, z) = 1 − e^{−z}(1 + z + z²/2)');
  ok([0.2, 1.5, 4].every((z) => { const e = oi.sub(oi.mul(I(2), oi.Phi(oi.sqrt(I(2 * z)))), I(1)); const p = oi.gammaP(I(0.5), I(z)); return p[0] <= e[1] && e[0] <= p[1]; }), 'P(½, z) = erf(√z) = 2Φ(√(2z)) − 1: the gamma and the normal machinery agree');
  { const z = oi.gammaPinv(I(3), I(0.9)); const pl = oi.gammaP(I(3), I(z[0])), ph = oi.gammaP(I(3), I(z[1])); ok(pl[0] <= 0.9 && 0.9 <= ph[1] && IV.width(z) < 1e-9, 'P⁻¹(3, 0.9) brackets the root, width below 1e-9'); }
  ok(within(oi.gammaP([2.9, 3.1], I(3)), 0.5768099188731565) && oi.gammaP([2.9, 3.1], I(3))[1] - oi.gammaP([2.9, 3.1], I(3))[0] > 0.04, 'P over a box of shapes is the hull of its two corners (monotone in a)');
  red(!within(oi.gammaP(I(3), I(3)), 0.5), 'P(3, 3) does not enclose ½ (it is 0.5768)');
  /* the two gaps the Prentice Hessian needs, against 50-digit values (mpmath) */
  ok(within(oi.gap1(I(0.0854)), 1.0036510124916561) && within(oi.gap2(I(0.0854)), -2.6659744790614374e-5) && within(oi.gap1(I(0.15)), 1.0112921853647724) && within(oi.gap2(I(0.15)), -2.5502324535266089e-4), 'ln a + 1 − ψ(a) and 1/a − ψ′(a) at a = Q⁻² enclose their 50-digit values at Q = 0.0854 and 0.15');
  { const Qb = [0.0854 - 1e-9, 0.0854 + 1e-9], a = oi.div(I(1), oi.mul(Qb, Qb));
    const naive = oi.sub(oi.div(I(1), a), oi.trigamma(a)), series = oi.gap2(Qb);
    ok(IV.width(naive) > 100 * IV.width(series), 'over a 10⁻⁹ box of Q the naive 1/a − ψ′(a) is ' + (IV.width(naive) / IV.width(series)).toExponential(1) + '× wider than the series: the dependency the series removes'); }
  /* the Prentice polynomials at the lognormal, Q = 0 */
  ok(within(oi.prenticeC(I(0)), -0.5 * Math.log(2 * Math.PI)) && within(oi.prenticeC1(I(0)), 0) && within(oi.prenticeC2(I(0)), -1 / 6), 'C(0) = −½ ln 2π, C′(0) = 0, C″(0) = −1/6: the lognormal is an ordinary point of the Prentice likelihood');
  { const a = 1 / (0.15 * 0.15), direct = Math.log(0.15) + a * Math.log(a) - o.lgammaPoint(a) - a;
    ok(Math.abs(o.prenticeC(0.15) - direct) < 1e-11 && Math.abs(o.prenticeC1(0.15) - (1 / 0.15 - 2 * (o.gap1(0.15) - 1) / Math.pow(0.15, 3))) < 1e-9, 'C and C′ as polynomials are ln Q + a ln a − lnΓ(a) − a and 1/Q − 2(gap1 − 1)/Q³ at Q = 0.15 (' + direct.toFixed(6) + ')'); }
  /* the incomplete gamma where its series used to overflow or underflow, and its inverse's bracket */
  { let t1 = null, t2 = null; try { t1 = oi.gammaP(I(2400), I(4800)); } catch (e) { t1 = null; } try { t2 = oi.gammaP(I(480), I(4.8)); } catch (e) { t2 = null; }
    ok(t1 && t1[1] >= 1 - 1e-12 && t1[0] > 1 - 1e-9 && t2 && t2[0] === 0 && t2[1] < 1e-300, 'P(2400, 4800) ≈ 1 and P(480, 4.8) ≈ 0 enclosed without overflow or underflow'); }
  { const q = FAMILIES.gengamma.quantile(oi, [I(10), I(1), I(1)], I(0.99999999607354439));
    red(within(q, 39.9998294743), 'the gamma(10) quantile at p = 1 − 3.93·10⁻⁹ encloses its 50-digit value 39.99983 (a bracket end moves only on a certain sign)'); }
}

/* ---- the Prentice series form: the same likelihood, with nothing divided by Q ---- */
{
  let sd = 7; const rn = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
  const xs = Array.from({ length: 400 }, () => Math.exp(0.3 + 0.4 * (rn() + rn() + rn() - 1.5)));
  const { Df, Di } = FT.prepare(xs), P = FAMILIES.gengammaP;
  let worst = 0;
  for (const th of [[0.3, 0.4, 0.15], [0.3, 0.4, 0.19], [0.25, 0.35, 0.1]]) {
    const Dd = Object.assign({}, Df, { Lmin: -1e9, Lmax: 1e9 });            /* forces the direct form */
    const rel = (x, y) => Math.abs(x - y) / Math.max(1, Math.abs(y));
    const ga = P.score(o, th, Df), gb = P.score(o, th, Dd), Ha = P.hess(o, th, Df), Hb = P.hess(o, th, Dd);
    worst = Math.max(worst, rel(P.loglik(o, th, Df), P.loglik(o, th, Dd)), ...ga.map((v, i) => rel(v, gb[i])), ...Ha.flat().map((v, i) => rel(v, Hb.flat()[i])));
  }
  ok(worst < 1e-9, 'at Q = 0.1–0.19 the series form and the direct form agree: likelihood, score and Hessian to ' + worst.toExponential(1));
  const ln = FT.certify('lognormal', xs, { prepared: { Df, Di } });
  const l0 = P.loglik(oi, [ln.box[0], ln.box[1], [0, 0]], Di), lL = FAMILIES.lognormal.loglik(oi, ln.box, Di);
  ok(l0[0] <= lL[1] && lL[0] <= l0[1], 'at Q = 0 the series likelihood is the lognormal\'s');
  const w3 = xs.reduce((s, x) => s + Math.pow((Math.log(x) - ln.theta[0]) / ln.theta[1], 3), 0);
  const dq0 = P.score(o, [ln.theta[0], ln.theta[1], 0], Df)[2];
  ok(Math.abs(dq0 + w3 / 6) < 1e-9 * Math.max(1, Math.abs(w3)), '∂ℓ/∂Q at Q = 0 is −Σw³/6 (' + dq0.toFixed(4) + ')');
  const gi = P.score(oi, [I(0.3), I(0.4), [0.0199999, 0.0200001]], Di);
  ok(gi.every((q) => q[1] - q[0] < 1e-3), 'over a 2·10⁻⁷ box of Q next to the limit the interval score stays narrow (widths ' + gi.map((q) => (q[1] - q[0]).toExponential(0)).join(', ') + '): the cancellation is gone');
}

/* ---- the second order ---- */
{
  const m = FT.sylvester([[[-2, -2], [0.5, 0.5]], [[0.5, 0.5], [-1, -1]]]);
  ok(m.length === 2 && m.every((q) => q[0] > 0), 'Sylvester on −H of a negative definite 2×2: both minors positive');
  red(!FT.sylvester([[[-2, -2], [1.5, 1.5]], [[1.5, 1.5], [-1, -1]]]).every((q) => q[0] > 0), 'an indefinite Hessian (a saddle) is not proved a maximum');
}

/* ---- the ranking rule's refusals ---- */
{
  red(FT.rankRule([{ family: 'expweibull', refused: true, edge: false }, { family: 'lognormal', ad: [1, 2] }, { family: 'gumbel', ad: [3, 4] }], 'ad').verdict === 'REFUSED', 'a family stopped at its boundary, not proved, blocks the ranking');
  ok(FT.rankRule([{ family: 'gengamma', refused: true, edge: true }, { family: 'lognormal', ad: [1, 2] }, { family: 'gumbel', ad: [3, 4] }], 'ad').verdict === 'DECIDED', 'the generalized gamma refused at its proved lognormal limit is left out and the rest decide');
  red(FT.rankRule([{ family: 'normal', ad: [NaN, NaN] }, { family: 'lognormal', ad: [0.3, 0.31] }], 'ad').verdict === 'REFUSED', 'an enclosure that is not finite refuses the ranking instead of winning it');
  red(FT.rankRule([{ family: 'normal', ad: null, unstated: ['ad'] }, { family: 'lognormal', ad: [0.3, 0.31] }], 'ad').verdict === 'REFUSED', 'an A² the arithmetic could not enclose refuses the ranking instead of leaving the family out');
}

/* ---- derivatives: every family's score is the gradient of its log-likelihood, its Hessian the Jacobian of the score ---- */
{
  const xs = [0.8, 1.2, 2.5, 0.4, 3.1, 1.7, 0.9, 2.2, 1.1, 0.6, 4.0, 1.4];
  const { Df } = FT.prepare(xs);
  for (const [name, th, h] of [['weibull', [1.7, 1.5], 1e-6], ['expweibull', [2.3, 0.9, 1.4], 1e-6], ['normal', [1.5, 1.1], 1e-6], ['lognormal', [0.3, 0.7], 1e-6], ['exponential', [1.6], 1e-6], ['gengamma', [2.1, 1.3, 0.8], 1e-6], ['gumbel', [1.3, 0.8], 1e-6], ['lognormal3', [0.1, 0.8, 0.2], 1e-7], ['gengammaP', [0.3, 0.6, 0.4], 1e-6], ['gengammaP', [0.1, 0.5, 0.08], 1e-6]]) {
    const F = FAMILIES[name];
    const g = F.score(o, th, Df), H = F.hess(o, th, Df);
    const gn = th.map((v, i) => { const a = th.slice(), b = th.slice(); a[i] += h; b[i] -= h; return (F.loglik(o, a, Df) - F.loglik(o, b, Df)) / (2 * h); });
    const Hn = th.map((v, i) => th.map((w, j) => { const a = th.slice(), b = th.slice(); a[j] += h; b[j] -= h; return (F.score(o, a, Df)[i] - F.score(o, b, Df)[i]) / (2 * h); }));
    ok(g.every((v, i) => Math.abs(v - gn[i]) < 1e-5 * Math.max(1, Math.abs(v))), name + ': the score is the gradient of the log-likelihood (finite differences)');
    ok(H.every((r, i) => r.every((v, j) => Math.abs(v - Hn[i][j]) < 1e-4 * Math.max(1, Math.abs(v)) && Math.abs(v - H[j][i]) < 1e-9 * Math.max(1, Math.abs(v)))), name + ': the Hessian is the Jacobian of the score, and symmetric');
  }
  /* the families nest where they should */
  const w = FAMILIES.weibull, e = FAMILIES.expweibull, gg = FAMILIES.gengamma;
  ok(Math.abs(w.loglik(o, [1.7, 1.5], Df) - e.loglik(o, [1, 1.7, 1.5], Df)) < 1e-9 && Math.abs(w.cdf(o, [1.7, 1.5], 2.0) - e.cdf(o, [1, 1.7, 1.5], 2.0)) < 1e-12, 'the exponentiated Weibull at α = 1 is the Weibull (likelihood and CDF)');
  ok(Math.abs(w.loglik(o, [1.7, 1.5], Df) - gg.loglik(o, [1, 1.7, 1.5], Df)) < 1e-9 && Math.abs(w.cdf(o, [1.7, 1.5], 2.0) - gg.cdf(o, [1, 1.7, 1.5], 2.0)) < 1e-12, 'the generalized gamma at α = 1 is the Weibull (likelihood and CDF)');
  ok(Math.abs(gg.cdf(o, [3, 1, 0.5], 2.0) - (1 - Math.exp(-4) * (1 + 4 + 8))) < 1e-12, 'the generalized gamma at c = 1 is the gamma: F(2) = P(3, 4)');
  { /* the lognormal is the α → ∞ limit of the generalized gamma */
    const m = 0.2, s = 0.6, a = 1e4, c = 1 / (s * Math.sqrt(a)), l = Math.exp(m - Math.log(a) / c);
    ok(Math.abs(gg.loglik(o, [a, c, l], Df) - FAMILIES.lognormal.loglik(o, [m, s], Df)) < 0.05, 'at α = 10⁴ the generalized gamma\'s likelihood is the lognormal\'s to 0.05: the limit the edge refusals climb toward');
  }
  ok(Math.abs(FAMILIES.lognormal3.loglik(o, [0.3, 0.7, 0], Df) - FAMILIES.lognormal.loglik(o, [0.3, 0.7], Df)) < 1e-9, 'the three-parameter lognormal at γ = 0 is the lognormal');
  { /* Prentice's coordinates are the same distribution */
    const P = FAMILIES.gengammaP, ph = [0.2, 0.7, 0.3], st = P.toStacy(ph);
    ok(Math.abs(P.loglik(o, ph, Df) - gg.loglik(o, st, Df)) < 1e-9 && Math.abs(P.cdf(o, ph, 2.0) - gg.cdf(o, st, 2.0)) < 1e-12 && P.fromStacy(st).every((v, i) => Math.abs(v - ph[i]) < 1e-12), 'the Prentice form (μ, σ, Q) is the (α, c, λ) generalized gamma: likelihood, CDF and the round trip agree');
  }
  for (const [name, th] of [['weibull', [1.7, 1.5]], ['expweibull', [2.3, 0.9, 1.4]], ['lognormal', [0.3, 0.7]], ['gengamma', [2.1, 1.3, 0.8]], ['gumbel', [1.3, 0.8]], ['normal', [1.5, 1.1]]]) {
    ok(Math.abs(FAMILIES[name].quantile(o, th, FAMILIES[name].cdf(o, th, 2.0)) - 2.0) < 1e-7, name + ': quantile ∘ cdf is the identity');
    if (FAMILIES[name].sf) ok(Math.abs(FAMILIES[name].sf(o, th, 2.0) + FAMILIES[name].cdf(o, th, 2.0) - 1) < 1e-12, name + ': sf + cdf = 1');
  }
}

/* ---- certification on data with a known answer ---- */
{
  const c = FT.certify('exponential', [1, 2, 3, 2, 1, 3]);
  ok(c.ok && within(c.box[0], 2) && c.maxRad < 1e-13, 'the exponential MLE of 1,2,3,2,1,3 is certified around its mean 2');
  const n = FT.certify('normal', [1, 2, 3, 4, 5]);
  ok(n.ok && within(n.box[0], 3) && within(n.box[1], Math.sqrt(2)), 'the normal MLE of 1..5 is certified around μ = 3, σ = √2');
  /* the four criteria on the exponential fit, against an independent float computation */
  {
    const xs = [1, 2, 3, 2, 1, 3], cr = FT.criteria(c, 1);
    const F = (x) => 1 - Math.exp(-x / 2), srt = xs.slice().sort((a, b) => a - b), N = srt.length;
    let A = 0; for (let i = 0; i < N; i++) A += (2 * i + 1) * (Math.log(F(srt[i])) + Math.log(1 - F(srt[N - 1 - i])));
    const A2 = -N - A / N;
    let D = 0; for (let i = 0; i < N; i++) D = Math.max(D, (i + 1) / N - F(srt[i]), F(srt[i]) - i / N);
    const ecdf = (x) => srt.filter((q) => q <= x).length / N; let M = 0; for (const x of xs) M += (F(x) - ecdf(x)) ** 2; M /= N;
    ok(within(cr.ad, A2) && within(cr.ks, D) && within(cr.mse, M), 'A², D and MSE on a six-point exponential fit enclose the float values (' + A2.toFixed(4) + ', ' + D.toFixed(4) + ', ' + M.toFixed(5) + ')');
    ok(cr.chi2.value === null && cr.chi2.kept < 2, 'χ² on six points keeps fewer than two bins and is undefined, as the paper has it');
  }
  let s = 12345; const rnd = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  const xs = Array.from({ length: 400 }, () => 3 * Math.pow(-Math.log(1 - rnd()), 0.5));
  const w = FT.certify('weibull', xs);
  ok(w.ok && w.box[0][0] > 1.6 && w.box[0][1] < 2.4 && w.maxRad < 1e-10, 'a 400-point Weibull(2, 3) sample: the shape is certified within [1.6, 2.4] with a box narrower than 1e-10');
  const ew = FT.certify('expweibull', xs), gg = FT.certify('gengamma', xs), gu = FT.certify('gumbel', xs);
  ok(ew.ok && gg.ok && gu.ok, 'the exponentiated Weibull, the generalized gamma and the Gumbel certify on the same sample');
  const ad = FT.andersonDarling(w);
  ok(ad[0] > 0 && ad[1] < 3 && IV.width(ad) < 1e-6, 'its Anderson–Darling statistic is enclosed, positive, small (' + ad[0].toFixed(4) + ') and tight');
  const rl = FT.returnLevel(w, 50, 24);
  ok(rl && rl[0] > 6 && rl[1] < 12 && IV.width(rl) < 1e-8, 'the 50-year daily return level is enclosed (' + rl[0].toFixed(3) + ' m) and tight');
  ok(FT.returnLevel(w, 1, 8766) === null, 'a one-year return level on annual blocks is refused, not printed as a number');
  /* a gamma sample: the generalized gamma's certified c must contain 1 within its sampling reach, and its α be finite */
  const gx = Array.from({ length: 600 }, () => { let t = 0; for (let k = 0; k < 3; k++) t -= Math.log(1 - rnd()); return 0.7 * t; });
  const gc = FT.certify('gengamma', gx), gcS = gc.ok ? (gc.stacyBox || gc.box) : null;
  ok(gc.ok && gcS[1][0] > 0.6 && gcS[1][1] < 1.6, 'a 600-point gamma(3, 0.7) sample: the generalized gamma certifies with c near 1 (' + (gc.ok ? (gc.stacy || gc.theta)[1].toFixed(3) + (gc.coords ? ', certified in ' + gc.coords : '') : gc.why) + ')');
  /* a generalized gamma deep on its ridge (α = 150, Q = 0.082): certified, in whichever coordinates contract */
  const rg = () => { let t = 0; for (let k = 0; k < 150; k++) t -= Math.log(1 - rnd()); return t; };
  const deep = Array.from({ length: 400 }, () => 0.02 * Math.pow(rg(), 1 / 0.3));
  const dc = FT.certify('gengamma', deep);
  ok(dc.ok || dc.edge, 'a 400-point generalized gamma with α = 150 is certified or refused at its edge, never refused otherwise (' + (dc.ok ? (dc.coords || 'gengamma') + ', ' + dc.names.join(', ') : dc.why.slice(0, 50)) + ')');
  const dp = FT.certify('gengammaP', deep, { start: FAMILIES.gengammaP.fromStacy([150, 0.3, 0.02]) });
  ok(dp.ok || dp.edge, 'the Prentice form certifies it directly from the true point, or reaches its edge (' + (dp.ok ? 'Q ' + dp.theta[2].toFixed(4) : dp.why.slice(0, 50)) + ')');
  /* a lognormal sample: whether the generalized gamma has a maximum just inside the family or
     peaks at its lognormal limit is the sign of Σw³ in the sample, so either is right — never a
     refusal for any other reason */
  const gauss = () => { const u1 = rnd(), u2 = rnd(); return Math.sqrt(-2 * Math.log(1 - u1)) * Math.cos(2 * Math.PI * u2); };
  const lx = Array.from({ length: 800 }, () => Math.exp(0.2 + 0.5 * gauss()));
  const lr = FT.certify('gengamma', lx);
  ok(lr.ok ? lr.ll[0] > lr.limit.ll[1] : lr.edge === true, 'a lognormal sample: the generalized gamma is certified above its lognormal limit or refused at that limit with a proof, never refused otherwise (' + (lr.ok ? 'certified, Q ' + lr.theta[2].toPrecision(3) : lr.why.slice(0, 60)) + ')');
  /* logarithms skewed to the right (a gamma of the log): no member with Q > 0 comes near, and the
     boundary test must PROVE the likelihood's peak at the limit */
  const rx = Array.from({ length: 800 }, () => { let t = 0; for (let k = 0; k < 4; k++) t -= Math.log(1 - rnd()); return Math.exp(0.3 * t); });
  const rr = FT.certify('gengamma', rx);
  red(!rr.ok && rr.edge === true && rr.boundary && rr.boundary.dq[1] < 0, 'right-skewed logarithms: the generalized gamma is refused at its lognormal limit, with ∂ℓ/∂Q proved negative next to it (' + (rr.ok ? 'certified?!' : rr.why.slice(0, 70)) + ')');
  /* α = 900 (Q = 1/30), past the (α, c, λ) climb's α = 500 stop: the maximum sits next to the limit
     and must be found from the lognormal side and certified in Prentice's series form */
  {
    const gam = (a) => { const d = a - 1 / 3, cc = 1 / Math.sqrt(9 * d); for (;;) { const x = gauss(), v = Math.pow(1 + cc * x, 3); if (v > 0 && Math.log(1 - rnd()) < x * x / 2 + d - d * v + d * Math.log(v)) return d * v; } };
    const Q0 = 1 / 30, S0 = 0.3, A0 = 1 / (Q0 * Q0), C0 = Q0 / S0, L0 = Math.exp(1 - Math.log(A0) / C0);
    const nx = Array.from({ length: 40000 }, () => L0 * Math.pow(gam(A0), 1 / C0));
    const nc = FT.certify('gengamma', nx);
    red(nc.ok && nc.coords === 'gengammaP' && nc.ll[0] > nc.limit.ll[1] && nc.box[2][0] > 0.02 && nc.box[2][1] < 0.05, 'a 40,000-point generalized gamma with α = 900: certified inside the family (Q ' + (nc.ok ? nc.theta[2].toFixed(4) : '—') + '), above its lognormal limit — the maximum a stop at α = 500 misses (' + (nc.ok ? nc.secondOrder : nc.why.slice(0, 60)) + ')');
  }
  red((() => { const r = FT.rank([{ family: 'a', ad: [1, 2] }, { family: 'b', ad: [1.5, 3] }]); return r.verdict === 'REFUSED' && r.tied[0] === 'b'; })(), 'overlapping A² enclosures REFUSE the ranking and name the tie');
  ok(FT.rank([{ family: 'a', ad: [1, 2] }, { family: 'b', ad: [2.5, 3] }]).verdict === 'DECIDED', 'separated enclosures decide it');
  red(!FT.certify('weibull', [1, 1, 1, 1]).ok, 'a constant sample has no Weibull MLE and is refused');
  /* χ²: a bin whose expected count straddles 5 refuses the statistic. A CDF known only to ±0.02 (a
     uniform on [0, 10]) over fifty points gives every bin an expected count of 6.1 ± 2 */
  {
    const fuzzy = { cdf: (oo, th, x) => [Math.max(0, x[0] / 10 - 0.02), Math.min(1, x[1] / 10 + 0.02)] };
    const ys = Array.from({ length: 50 }, (_, i) => Math.round(1 + i * 1.96) / 10);
    const q = FT.criteria({ fam: fuzzy, box: [[0, 0]], Di: FT.prepare(ys).Di }, 10);
    red(q.chi2.value === null && q.chi2.refused === true, 'an expected count that straddles 5 over the box REFUSES χ² instead of choosing a side (' + (q.chi2.why || 'not refused') .slice(0, 50) + ')');
  }
}

/* ---- printed fits ---- */
{
  const b = FT.printedBox('0.0634');
  ok(within(b, 0.06335) && within(b, 0.06345) && !within(b, 0.0633) && !within(b, 0.0636), 'a printed 0.0634 allows [0.06335, 0.06345] and nothing beyond');
  ok(within(FT.printedBox('-0.0318'), -0.03175) && within(FT.printedBox('36.6'), 36.65) && !within(FT.printedBox('36.6'), 36.66), 'negative and one-decimal prints box correctly');
  red(FT.zeroDensity([0.1, 0.2, 0.5], [0.3, 0.3])[0] === 2, 'a location above two data leaves them outside the support, and the count says so');
}

/* ---- blocks ---- */
{
  const S = { n: 6, t: ['2000-01-01-00', '2000-01-01-01', '2000-01-02-00', '2000-02-01-00', '2001-01-01-00', '2001-01-04-00'], h: [1, 3, 2, 5, 4, 6], step: 1 };
  const d = BL.blockMaxima(S, 'daily'), m = BL.blockMaxima(S, 'monthly'), a = BL.blockMaxima(S, 'annual'), wk = BL.blockMaxima(S, 'weekly');
  ok(d.n === 5 && d.x.join(',') === '3,2,5,4,6' && m.n === 3 && m.x.join(',') === '3,5,6' && a.n === 2 && a.x.join(',') === '5,6', 'daily, monthly and annual maxima are the largest value in each calendar block');
  ok(BL.isoWeek('2000-01-01') === '1999-W52' && BL.isoWeek('2001-01-01') === '2001-W01' && BL.isoWeek('2001-01-04') === '2001-W01' && BL.isoWeek('2004-12-31') === '2004-W53' && BL.isoWeek('2021-01-03') === '2020-W53', 'ISO weeks: the Thursday names the year (1999-W52, 2001-W01, 2004-W53, 2020-W53)');
  ok(wk.n === 3 && wk.x.join(',') === '3,5,6' && wk.keys.join(',') === '1999-W52,2000-W05,2001-W01', 'weekly maxima group by ISO week across a year boundary (1 January 2000 is in 1999-W52)');
  red(d.keys[0] === '2000-01-01' && a.keys[1] === '2001', 'the block keys are the calendar parts of the timestamps');
}

/* ---- the shipped ledger ---- */
{
  const led = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'hseva-ledger.json'), 'utf8'));
  ok(Object.keys(led.buoys).length === 3 && led.buoyBlocks.length === 5 && led.families.join(',') === PAPER_SIX.join(',') && led.criteria.length === 4, 'three buoys, five block sizes, the paper\'s six families, four criteria');
  let certified = 0, edge = 0, other = 0, decided = 0, rankRef = 0;
  const walk = (label, blocks) => {
    for (const [blk, B] of Object.entries(blocks)) {
      for (const [f, F] of Object.entries(B.fits)) {
        if (F.certified) {
          certified++;
          ok(Number(F.criteria.ad.lo) <= Number(F.criteria.ad.hi) && Number(F.maxRad) < 1e-4 && Number(F.ll.lo) <= Number(F.ll.hi), label + ' ' + blk + ' ' + f + ': a certified fit has ordered enclosures and a narrow box');
          ok((F.secondOrder === 'box' || F.secondOrder === 'point') && F.minors.length === F.names.length && F.minors.every((m) => Number(m.lo) > 0), label + ' ' + blk + ' ' + f + ': the Hessian is proved negative definite over the box (every leading minor of −H above zero)');
        } else if (F.edge) { edge++; ok(f === 'gengamma' && F.boundary && Number(F.boundary.dqQ.hi) < 0 && F.boundary.q1 > 0, label + ' ' + blk + ' ' + f + ': a refusal at the edge is the generalized gamma\'s, with ∂ℓ/∂Q proved negative next to its limit'); }
        else other++;
      }
      for (const [k, r] of Object.entries(B.rankings)) {
        if (r.verdict === 'DECIDED') {
          decided++;
          const best = B.fits[r.best].criteria[k];
          ok(Object.entries(B.fits).filter(([g, v]) => g !== r.best && v.certified && v.criteria[k] && v.criteria[k].lo !== undefined).every(([, v]) => Number(v.criteria[k].lo) > Number(best.hi)), label + ' ' + blk + ' ' + k + ': a DECIDED ranking has its best wholly below every other');
          ok(Object.values(B.fits).every((v) => v.certified || v.edge), label + ' ' + blk + ' ' + k + ': nothing is ranked past a family refused for a reason other than its edge');
        } else rankRef++;
      }
    }
  };
  for (const [b, B] of Object.entries(led.buoys)) walk('buoy ' + b, B.blocks);
  if (led.ww3) for (const [p, P] of Object.entries(led.ww3.points)) walk(p, P.blocks);
  ok(certified > 300, certified + ' fits certified, ' + edge + ' refused at the generalized gamma\'s lognormal limit, ' + other + ' refused otherwise (each of those leaves its block\'s rankings REFUSED, checked above)');
  /* the findings the page states, re-derived here from the fits */
  const Fb = led.findings.buoys;
  const nat = ['A', 'B', 'C'].map((b) => led.buoys[b].blocks.native.rankings.ad);
  ok(nat.every((r, i) => r.verdict === Fb.native[i].verdict && (r.best || null) === Fb.native[i].best), 'the unfiltered-series verdicts in the findings are the rankings\' own');
  ok(Fb.weibullByBlock.native.decided + Fb.weibullByBlock.daily.decided + Fb.weibullByBlock.weekly.decided + Fb.weibullByBlock.monthly.decided === ['A', 'B', 'C'].reduce((s, b) => s + ['native', 'daily', 'weekly', 'monthly'].filter((blk) => led.buoys[b].blocks[blk].rankings.ad.best === 'weibull' && led.buoys[b].blocks[blk].rankings.ad.verdict === 'DECIDED').length, 0), 'the Weibull counts re-derive');
  ok(Fb.gengamma.certified + Fb.gengamma.edge + Fb.gengamma.refused === 12, 'the generalized gamma\'s twelve paper-block fits partition into certified, edge and refused');
  /* the printed marginals */
  if (led.printed) {
    const row = (id, b) => led.printed.rows.find((r) => r.id === id && r.buoy === b);
    ok(row('c8', 'A').reproduces === true && row('c8', 'B').reproduces === true, 'contribution 8\'s printed Weibull for A and B is the rounding of the certified MLE');
    ok(row('c8', 'C').reproduces === false && row('c8', 'C').reproducesTz === true, 'contribution 8\'s printed row C is the certified Weibull MLE of the zero-up-crossing period, not of Hs');
    ok(['A', 'B', 'C'].every((b) => row('c3', b).reproduces === true), 'contribution 3\'s printed three-parameter lognormal is, on every buoy, the rounding of a certified local maximum');
    ok(['A', 'B', 'C'].every((b) => row('c9', b).belowLocation[0] > 9000), 'contribution 9\'s printed locations leave more than 9,000 hours of each buoy below the support');
    ok(['A', 'B', 'C'].every((b) => row('c12', b).belowLocation[0] === 0 && row('c12', b).belowLocation[1] >= 1), 'the baseline\'s printed location is the smallest hour to its printed digits: undecided at that precision, and the ledger says so');
  }
  if (led.scipy) {
    let agrees = 0, off = 0;
    for (const B of Object.values(led.scipy.buoys)) for (const blk of Object.values(B)) for (const r of Object.values(blk)) {
      if (r.floc0 && r.floc0.verdict === 'AGREES') { agrees++; ok(Math.abs(Number(r.floc0.level100Shift)) < 0.005, 'scipy with floc=0 agrees with the certified 100-year level to half a centimetre where it AGREES'); }
      if (r.default && r.default.verdict === 'OUTSIDE_SUPPORT') { off++; ok(r.default.below > 0 && Number(r.default.loc) > Number(r.default.minDatum) - 1e-12, 'an OUTSIDE_SUPPORT verdict has its data below scipy\'s printed location'); }
    }
    ok(agrees > 20, agrees + ' scipy floc=0 fits agree with their certificates; ' + off + ' default fits leave data outside their support');
  }
  if (led.ww3) {
    const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'ww3-points', 'meta.json'), 'utf8'));
    const crypto = require('crypto');
    const bad = Object.entries(meta.files).filter(([rel, v]) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, 'corpus', 'ww3-points', rel))).digest('hex') !== v.sha256);
    ok(Object.keys(meta.files).length === 384 && bad.length === 0, 'the hindcast extraction: 384 monthly files, every one matching its pinned sha256');
  }
  /* live: the quick blocks re-derived by the ledger runner */
  const r = cp.spawnSync('node', [path.join(ROOT, 'tools', 'run-hseva-ledger.js'), '--quick'], { cwd: ROOT });
  ok(r.status === 0, 'the daily, weekly, monthly and annual blocks re-derive identically (' + String(r.stdout).trim().split('\n').pop() + ')');
}

console.log('hseva battery: ' + pass + ' pass, ' + fail + ' fail, ' + redsFired + '/' + reds + ' red controls fired');
process.exit(fail ? 1 : 0);
