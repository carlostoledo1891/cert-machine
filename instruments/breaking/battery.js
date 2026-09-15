#!/usr/bin/env node
/* instruments/breaking/battery.js — the exact statistics calibrated on cases
   with known answers, red controls that must fire, and the shipped ledger
   walked: pins re-hashed, invariants held, the whole table re-decided live
   (it takes two seconds).

   Prints: "breaking battery: N pass, 0 fail, R/R red controls fired". */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const L = require('./lib.js');
const D = require('./decide.js');
const TR = require(path.join(__dirname, '..', 'interval', 'transcendental.js'));
const Q = L.Q;
const ROOT = path.resolve(__dirname, '..', '..');

let pass = 0, fail = 0, reds = 0, redsFired = 0;
const ok = (cond, name) => { if (cond) pass++; else { fail++; console.error('FAIL ' + name); } };
const red = (fired, name) => { reds++; if (fired) { redsFired++; pass++; } else { fail++; console.error('RED DID NOT FIRE ' + name); } };
const throws = (f) => { try { f(); return false; } catch (e) { return true; } };
const r = (s) => L.parseDecimal(s);
const eq = (a, b) => Q.cmp(a, b) === 0;

/* ---- the reader ---- */
ok(eq(r('0.5'), Q.R(1n, 2n)) && eq(r('9.044e-14'), Q.R(9044n, 10n ** 17n)) && eq(r('-32.352046692339336'), Q.R(-32352046692339336n, 10n ** 15n)), 'literals, including the exponent form the CSV uses, read as exact rationals');
red(throws(() => r('nan')), 'a NaN is refused');
red(throws(() => r('1,5')), 'a comma decimal is refused');

/* ---- order statistics ---- */
{
  const xs = [5, 3, 1, 4, 2].map((x) => Q.R(BigInt(x)));
  const q = D.quantiles(xs);
  ok(eq(q.q['0.5'], Q.R(3n)) && eq(q.q['0.25'], Q.R(2n)) && eq(q.q['0.75'], Q.R(4n)) && eq(q.q['0.05'], Q.R(1n)) && eq(q.q['0.95'], Q.R(5n)), 'quantiles of 1..5 are the k-th smallest, k = ceil(p·n): 1, 2, 3, 4, 5');
  ok(eq(q.spreadIQ, Q.R(2n)) && eq(q.spread90, Q.R(5n)), 'spread factors q75/q25 = 2 and q95/q05 = 5');
  const four = [1, 2, 3, 4].map((x) => Q.R(BigInt(x)));
  ok(eq(D.quantiles(four).q['0.5'], Q.R(2n)), 'an even count takes the lower middle value (k = ceil(0.5·4) = 2), never an average of two');
  const iv = D.quantilesIv([[r('1'), r('1.1')], [r('3'), r('3.1')], [r('2'), r('2.1')]]);
  ok(eq(iv.q['0.5'][0], r('2')) && eq(iv.q['0.5'][1], r('2.1')), 'the median of enclosures is enclosed by the medians of the ends');
}
/* ---- ranks and correlations ---- */
{
  const x = [1, 2, 3, 4, 5].map((v) => Q.R(BigInt(v)));
  ok(D.doubledRanks(x).join(',') === '2,4,6,8,10', 'ranks of a sorted sequence, doubled');
  const t = [1, 2, 2, 4].map((v) => Q.R(BigInt(v)));
  ok(D.doubledRanks(t).join(',') === '2,5,5,8', 'tied values share the mean rank (2.5 → 5 doubled)');
  const up = D.pearsonInt([1n, 2n, 3n, 4n], [2n, 4n, 6n, 8n]);
  ok(eq(up.r2, Q.R(1n)) && Q.cmp(up.r[0], Q.R(1n)) <= 0 && Q.cmp(up.r[1], Q.R(1n)) >= 0, 'a perfect line has r² = 1 exactly and r enclosed around 1');
  const down = D.pearsonInt([1n, 2n, 3n], [3n, 2n, 1n]);
  red(down.sign < 0 && Q.cmp(down.r[1], Q.R(-1n)) >= 0 && Q.cmp(down.r[0], Q.R(-1n)) <= 0, 'a reversed line has r enclosed around −1, with the sign carried');
  const none = D.pearsonInt([1n, 2n, 3n, 4n], [1n, 4n, 1n, 4n]);
  ok(eq(none.r2, Q.R(1n, 5n)), 'x = 1,2,3,4 against 1,4,1,4 has r² = 1/5 exactly');
  const half = D.pearsonQ([r('0.5'), r('1.5'), r('2.5')], [r('1'), r('2'), r('3')]);
  ok(eq(half.r2, Q.R(1n)), 'Pearson on rationals with different denominators: a line is a line');
  ok(D.pearsonInt([1n, 1n, 1n], [1n, 2n, 3n]) === null, 'a constant series has no correlation and is refused, not zero');
  /* Spearman is invariant under a monotone transform; Pearson is not */
  const a = [1, 2, 3, 4, 5, 6].map((v) => Q.R(BigInt(v))), b = [1, 4, 9, 16, 25, 36].map((v) => Q.R(BigInt(v)));
  const sp = D.pearsonInt(D.doubledRanks(a), D.doubledRanks(b)), pe = D.pearsonQ(a, b);
  ok(eq(sp.r2, Q.R(1n)) && Q.cmp(pe.r2, Q.R(1n)) < 0, 'x against x²: Spearman r² = 1 exactly, Pearson r² < 1');
}
/* ---- square roots ---- */
{
  const s = D.sqrtEnclosure(Q.R(2n), false);
  ok(Q.cmp(Q.mul(s[0], s[0]), Q.R(2n)) <= 0 && Q.cmp(Q.mul(s[1], s[1]), Q.R(2n)) >= 0 && Q.cmp(Q.sub(s[1], s[0]), Q.R(1n, 10n ** 12n)) <= 0, '√2 is enclosed to 1e-12 with both ends verified by squaring');
  red(!(Q.cmp(Q.mul(s[0], s[0]), Q.R(2n)) > 0), 'the lower end squared does not exceed 2');
}

/* ---- the shipped ledger ---- */
{
  const meta = JSON.parse(fs.readFileSync(path.join(L.CORPUS, 'meta.json'), 'utf8'));
  const claims = JSON.parse(fs.readFileSync(path.join(L.CORPUS, 'claims.json'), 'utf8'));
  for (const [rel, m] of Object.entries(meta.files)) ok(crypto.createHash('sha256').update(fs.readFileSync(path.join(L.CORPUS, rel))).digest('hex') === m.sha256, 'pin ' + rel);
  const led = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'breaking-ledger.json'), 'utf8'));
  ok(led.n === 16369 && led.records.length === 20 && led.records.every((x) => x.constant), '16,369 events in 20 records, each record\'s wind, Hs and fp constant within it');
  ok(led.duncan.angle.inside + led.duncan.angle.on + led.duncan.angle.outside === led.n && led.duncan.angle.below + led.duncan.angle.above === led.duncan.angle.outside, 'the angle decisions partition the events');
  ok(led.duncan.aspect.above + led.duncan.aspect.equal + led.duncan.aspect.below === led.n, 'the aspect-ratio decisions partition the events');
  ok(led.duncan.aspect.within25pc <= led.duncan.aspect.within50pc, 'a tighter band holds fewer events');
  ok(Number(led.duncan.aspect.medianOverReference.dec) > 4 && Number(led.duncan.aspect.medianOverReference.dec) < 6, 'the median aspect ratio is several times the laboratory value (' + led.duncan.aspect.medianOverReference.dec + ')');
  ok(Number(led.duncan.angle.fractionInside.dec) > 0.3 && Number(led.duncan.angle.fractionInside.dec) < 0.4, 'about a third of the events fall in the laboratory angle band (' + led.duncan.angle.fractionInside.dec + ')');
  for (const k of ['a', 'b', 'c']) ok(Number(led.selfSimilarity[k].spreadIQ.dec) > 1.5 && Number(led.selfSimilarity[k].spread90.dec) > 4, 'ratio ' + k + ': the middle half spans more than 1.5× and the central 90% more than 4× (' + led.selfSimilarity[k].spreadIQ.dec + ', ' + led.selfSimilarity[k].spread90.dec + ')');
  const speed = Object.entries(led.correlations).filter(([k]) => k.startsWith('cm~')).map(([, v]) => Number(v.spearman.r.hi));
  const geo = Number(led.correlations['Ab_max~Lb'].spearman.r.lo);
  ok(Math.max(...speed) < 0.45 && geo > 0.9, 'every speed–geometry rank correlation is below 0.45 while area–length is above 0.9');
  ok(Number(led.cmOverCp.median.lo) > 0.25 && Number(led.cmOverCp.median.hi) < 0.32 && led.cmOverCp.fasterThanHalfCp < 200, 'the median breaker runs at about 0.28 of the peak phase speed, and fewer than 200 exceed half of it');
  /* live: the whole table re-decided against the ledger */
  const T = L.readTable();
  ok(T.sha256 === meta.files['blacksea_data.csv'].sha256, 'the CSV hashes to its pin');
  const R = D.decide(T, claims.references, TR.PI);
  ok(R.angle.inside === led.duncan.angle.inside && R.aspect.above === led.duncan.aspect.above && R.aspect.within25pc === led.duncan.aspect.within25pc, 'live re-decision reproduces the Duncan counts');
  ok(Q.toString(R.ratios.a.q['0.5']) === led.selfSimilarity.a.median.exact && Q.toString(R.ratios.b.spreadIQ) === led.selfSimilarity.b.spreadIQ.exact, 'live re-decision reproduces the exact medians and spreads');
  ok(L.dec(R.corr['cm~Lb'].spearman.r[0], 9) === led.correlations['cm~Lb'].spearman.r.lo && Q.toString(R.corr['Ab_max~Lb'].spearman.r2) === led.correlations['Ab_max~Lb'].spearman.r2.exact, 'live re-decision reproduces the rank correlations');
  /* red: one literal changed by a unit in the last place moves an exact statistic */
  const T2 = { rows: T.rows.map((row) => Object.assign({}, row)) };
  T2.rows[0].Ab_max = Q.add(T2.rows[0].Ab_max, Q.R(1n, 10n ** 17n));
  const R2 = D.decide(T2, claims.references, TR.PI);
  red(Q.toString(R2.corr['Ab_max~Lb'].pearson.r2) !== led.correlations['Ab_max~Lb'].pearson.r2.exact, 'one literal changed by 1e-17 changes the exact r² — nothing here is rounded');
}

console.log('breaking battery: ' + pass + ' pass, ' + fail + ' fail, ' + redsFired + '/' + reds + ' red controls fired');
process.exit(fail ? 1 : 0);
