#!/usr/bin/env node
/* build-report-zeta-hankel.js — reports/zeta-hankel.html: the method that proved ζ(5)
   irrational, measured on ζ(7) and Catalan's constant.

   Fauzan (Zenodo 22826419, 2026-09-17) proved ζ(5) irrational with integer polynomials
   built from Hankel determinants of a positive moment functional; Calegari reconstructed
   the argument a week later. The bench (frontier-apps/experiments/zeta-hankel) computed
   those polynomials EXACTLY for ~300 families, stripped every common factor, and measured
   the true margin log P(ξ)/h². It is ported to instruments/zetahankel and certs/zeta-hankel.

   EVERY NUMBER ON THE PAGE IS READ FROM certs/zeta-hankel-ledger.json, which
   instruments/zetahankel/rerun.py writes from a re-run of the lifted engine on this
   machine, and from the lifted run records it names. This builder runs the instrument's
   battery and refuses unless it passes clean with every red control fired, refuses a
   ledger whose verdict is not AGREE, and never computes a scientific quantity itself.

   usage: node tools/build-report-zeta-hankel.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('ZETA-HANKEL REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const fmt = (n) => Number(n).toLocaleString('en-US');
const sg = (v, d) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(d === undefined ? 2 : d);

/* ---- gates ------------------------------------------------------------------ */
const bat = cp.spawnSync('python3', [path.join(ROOT, 'instruments', 'zetahankel', 'battery.py')], { cwd: ROOT });
const bout = String(bat.stdout) + String(bat.stderr);
const bm = /zetahankel battery: (\d+) pass, 0 fail, (\d+)\/(\d+) red controls fired/.exec(bout);
if (bat.status !== 0 || !bm || bm[2] !== bm[3]) die('the zetahankel battery did not pass clean:\n' + bout.slice(-800));
const nChecks = Number(bm[1]), nReds = Number(bm[2]);

const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'zeta-hankel-ledger.json'), 'utf8'));
if (L.verdict !== 'AGREE') die('the ledger verdict is ' + L.verdict + ' — a disagreement is a finding, and it goes on a page written for it, not this one');
if (L.classReading.status !== 'extrapolation') die('the class reading must be labelled an extrapolation');
if (L.raceContext.status !== 'unverified') die('the race context must be labelled unverified');
const H = Object.fromEntries(L.headline.map((h) => [h.key, h]));
for (const k of ['zeta3', 'zeta5', 'zeta7', 'catalan']) if (!H[k]) die('the ledger has no headline row ' + k);
if (!(H.zeta3.margin_hi < 0 && H.zeta5.margin_hi < 0 && H.zeta7.margin_lo > 0 && H.catalan.margin_lo > 0)) die('the headline signs moved — rewrite the page, do not rebuild it');
const CR = L.classReading, PAD = L.padic, PUB = L.published, X = L.crosscheck, T2 = L.test2;
const cal5 = L.calegari.calegari5, cal7 = L.calegari.calegari7;
const cal5top = cal5.rows.reduce((m, r) => (!m || r.h > m.h ? r : m), null);
const cal7top = cal7.rows.reduce((m, r) => (!m || r.h > m.h ? r : m), null);
const roomF = cal5top.margin / PUB.fauzan.perH2, roomC = cal5top.margin / PUB.calegari.perH2;
const struct5 = CR.struct.filter((s) => s.k === 5), struct7 = CR.struct.filter((s) => s.k === 7);
const s5lo = Math.min(...struct5.map((s) => s.margin)), s5hi = Math.max(...struct5.map((s) => s.margin));
const s7lo = Math.min(...struct7.map((s) => s.margin)), s7hi = Math.max(...struct7.map((s) => s.margin));
const famName = (s) => {
  const [w, k, typ, a, b, r] = s;
  return (w === 'Z' ? 'Z' : 'E') + ' · ' + (typ === 'half' ? 'half-integer' : typ === 'grid' ? 'mixed' : 'integer') + ' poles · K = ' + a + 'm, N = ' + (b === 1 ? '' : b) + 'm, r = ' + r;
};
const nameToSpec = (n) => { const m = /^([ZE])_k(\d+)_(int|half|grid)_a(\d+)_b(\d+)_r(\d+)$/.exec(n); return m ? [m[1], +m[2], m[3], +m[4], +m[5], +m[6]] : null; };
const label = { zeta3: 'ζ(3)', zeta5: 'ζ(5)', zeta7: 'ζ(7)', catalan: 'Catalan G' };
/* from the lifted records: the largest h any family reached */
const RUNS = path.join(ROOT, 'certs', 'zeta-hankel', 'runs');
const maxHLifted = Math.max(...['scan3', 'struct', 'scan1'].flatMap((d) => fs.readdirSync(path.join(RUNS, d)).filter((f) => f.endsWith('.jsonl'))
  .flatMap((f) => fs.readFileSync(path.join(RUNS, d, f), 'utf8').trim().split('\n').map((l) => JSON.parse(l).h))));
/* from the re-run rows: the h from which each headline family keeps the sign of its top row */
const signFrom = (rows) => { const s = Math.sign(rows.reduce((m, r) => (r.h > m.h ? r : m)).margin); let h0 = 0;
  for (const r of rows.slice().sort((a, b) => a.h - b.h)) if (Math.sign(r.margin) !== s) h0 = r.h; return rows.filter((r) => r.h > h0).reduce((m, r) => Math.min(m, r.h), Infinity); };
const signSettled = Math.max(...['zeta3', 'zeta5', 'zeta7', 'catalan'].map((k) => signFrom(L.families[k].rows)));
const flips = ['zeta3', 'zeta5', 'zeta7', 'catalan'].filter((k) => signFrom(L.families[k].rows) > Math.min(...L.families[k].rows.map((r) => r.h)));
const pm = (lo, hi) => '± ' + ((hi - lo) / 2).toExponential(1);

/* ---- the figure: margin against h, re-run here, the four headline families ------ */
const series = ['zeta3', 'zeta5', 'zeta7', 'catalan'].map((k, i) => ({
  name: label[k], token: i < 3 ? CH.CAT[i] : CH.CTX,
  pts: L.families[k].rows.map((r) => [r.h, r.margin])
}));
const allY = series.flatMap((s) => s.pts.map((p) => p[1]));
const yLo = Math.floor(Math.min(...allY) * 2) / 2, yHi = Math.ceil(Math.max(...allY) * 2) / 2;
const yT = []; for (let v = yLo; v <= yHi + 1e-9; v += 0.5) yT.push({ v, t: v === 0 ? '0' : sg(v, 1) });
const xMax = Math.max(...series.flatMap((s) => s.pts.map((p) => p[0])));
const FIG = CH.lines({
  w: 900, h: 380, x0: 0, x1: Math.ceil(xMax / 5) * 5, y0: yLo, y1: yHi,
  xTicks: [0, 10, 20, 30, 40].filter((v) => v <= Math.ceil(xMax / 5) * 5).map((v) => ({ v, t: String(v) })),
  yTicks: yT, xLabel: 'h, the size of the Hankel matrix', yLabel: 'log P(ξ) / h²',
  rules: [{ v: 0, t: 'zero: below it the family proves ξ irrational' }],
  series,
  keys: series.map((s) => ({ token: s.token, t: s.name + ' · ' + famName(L.families[Object.keys(label).find((k) => label[k] === s.name)].spec), kind: 'line' })),
  xOf: (x) => 'h = ' + x, vOf: (v) => 'log P/h² = ' + sg(v, 4),
  alt: 'The margin log P of xi over h squared against h for four families, every point re-run on this machine. ζ(3) sits near '
    + sg(H.zeta3.margin) + ' across the range; ζ(5) falls from about ' + sg(L.families.zeta5.rows[0].margin) + ' toward ' + sg(H.zeta5.margin)
    + ', still below zero; ζ(7) rises to ' + sg(H.zeta7.margin) + ' and Catalan G to ' + sg(H.catalan.margin) + ', both above zero.'
});

/* ---- the page ---------------------------------------------------------------- */
const O = [];
O.push(C.header({
  eyebrow: 'cert-machine · report · ζ(5) → ζ(7)? · generated from the ledger',
  title: 'The method that proved ζ(5) irrational stops at ζ(5): measured',
  deck: 'On 17 September 2026 ζ(5) was proved irrational with integer polynomials built from Hankel determinants of a '
    + 'positive moment functional. The obvious next targets are ζ(7) and Catalan\'s constant, and two claimed proofs of '
    + 'them are already in circulation. We computed the method\'s polynomials exactly, divided out every common factor, '
    + 'and measured how fast they shrink at the constant: the true margin, not a provable bound on it. ζ(3) and ζ(5) '
    + 'clear zero; ζ(7) and Catalan\'s G do not, in any of the ' + fmt(CR.counts.families) + ' families tried. Every '
    + 'headline number was re-run on this machine from the lifted engine and agrees with the bench to the last bit.'
}));

O.push(C.tldr({
  findingRaw: 'The best margin log P(ξ)/h² at h ≈ 35 is ' + C.m(sg(H.zeta3.margin)) + ' for ζ(3), ' + C.m(sg(H.zeta5.margin))
    + ' for ζ(5), ' + C.m(sg(H.zeta7.margin)) + ' for ζ(7) and ' + C.m(sg(H.catalan.margin)) + ' for Catalan\'s G — negative '
    + 'proves irrationality. Across the families scanned the margin grows by about ' + CR.linearInK.slopePerUnitK.toFixed(2)
    + '·h² per unit of k and crosses zero near k ≈ ' + CR.linearInK.zeroCrossingFit.toFixed(1) + ': the class, as far as it was '
    + 'searched, stops between ζ(5) and ζ(7). That last sentence is a measurement, not a theorem.',
  mechanismRaw: 'The decay of the determinant itself hardly depends on k; the cost is arithmetic. Going from ζ(5) to ζ(7) '
    + 'adds two powers of p to the harmonic sums at every node j ≥ p, and the exact content shows that price is paid almost '
    + 'in full: ' + Math.round(100 * PAD.derived.ratio) + '% of the naive total for p > √K, plus ' + Math.round(PAD.derived.smallPrimesExtra)
    + ' more (in log) from the primes 2, 3, 5, 7.',
  checkRaw: C.m('instruments/zetahankel/.venv/bin/python instruments/zetahankel/rerun.py') + ' re-runs every row (python-flint 0.9.0; '
    + Math.round(L.timings.totalSecs / 60) + ' minutes here, most of it ζ(5) and ζ(7) at h = 99); ' + C.m('python3 instruments/zetahankel/battery.py')
    + ' re-checks the pins, re-runs the small rows and plants ' + nReds + ' forgeries in about a second.'
}));

O.push(C.stats([
  { k: 'ζ(3)', v: sg(H.zeta3.margin), n: 'log P/h² at h = ' + H.zeta3.h + ' · negative: the family clears zero' },
  { k: 'ζ(5)', v: sg(H.zeta5.margin), n: 'log P/h² at h = ' + H.zeta5.h + ' · negative: clears zero, with room to spare' },
  { k: 'ζ(7)', v: sg(H.zeta7.margin), n: 'log P/h² at h = ' + H.zeta7.h + ' · positive: the family does not clear zero' },
  { k: 'Catalan G', v: sg(H.catalan.margin), n: 'log P/h² at h = ' + H.catalan.h + ' · positive and rising' },
  { k: 'rows re-run here', v: L.counts.agree + ' / ' + L.counts.rowsRerun, n: 'agree with the bench; ' + L.counts.bitIdentical + ' bit-identical · h up to ' + L.counts.maxHRerun }
]));

O.push(C.scope('Local working document, machine-derived, not peer-reviewed. Per instance the margins are exact and ball-certified: '
  + 'P is an exact integer polynomial, its content an exact rational, log P(ξ) an interval, and every headline row was re-run '
  + 'here. The wall — no family reaches ζ(7) — is a measurement across ' + fmt(CR.counts.families) + ' families at h ≤ ' + maxHLifted + ', '
  + 'extrapolated in h and in k; it is not a theorem and excludes nothing outside the families scanned. The claimed proofs '
  + 'for ζ(7) and Catalan\'s constant, and the reported problems with them, are race context we have not verified.'));

/* §1 */
O.push(C.section({
  lab: '§1 · what is measured', title: 'The smallest integer polynomial the proof can use',
  bodyRaw: C.pRaw('For an integer k ≥ 2 the functional μ<sub>k,X</sub> acts on rational functions with simple poles at −j² '
    + '(Calegari\'s normalisation of Fauzan): on monomials through Bernoulli numbers, on poles through the harmonic sums '
    + 'H<sub>j</sub><sup>(k)</sup> = Σ<sub>v≤j</sub> v<sup>−k</sup>:')
    + C.eq('μ(t<sup>e</sup>) = (−1)<sup>e</sup> B<sub>2e+2</sub> (2e+k)! / ((k−1)! (2e+2)!), &nbsp;&nbsp; μ(1/(t+j²)) = j<sup>k−1</sup>(X − H<sub>j</sub><sup>(k)</sup>) − 1/(k−1) + 1/(2j)')
    + C.pRaw('At X = ζ(k) it is integration against a positive weight, so the Hankel matrix G(X) = [μ<sub>X</sub>(W t<sup>i+l</sup>)], '
      + 'W = D<sub>N</sub><sup>r</sup>/D<sub>K</sub> with D<sub>m</sub>(t) = Π<sub>j≤m</sub>(t + j²), is a Gram matrix there and '
      + 'Δ(X) = det G(X) = det(A + XB) is positive at ζ(k). Δ is computed exactly in ℚ[X] and divided by its content; what is '
      + 'left, P, is the smallest integer polynomial the irrationality lemma can use. If log P(ξ) ≤ −c·h² along a family, the '
      + 'family proves ξ irrational once its arithmetic is established, so ' + C.m('log P(ξ)/h²') + ' is the family\'s true margin. '
      + 'Papers prove upper bounds on the denominators; this is the exact content. A second weight, 1/sinh(πy), with half-integer '
      + 'poles gives X = β(k), and β(2) is Catalan\'s G.')
}));

/* §2 */
{
  const rows = ['zeta3', 'zeta5', 'zeta7', 'catalan'].map((k) => {
    const h = H[k];
    return [label[k], famName(L.families[k].spec), String(h.h), { raw: '<strong>' + sg(h.margin, 4) + '</strong>' },
      pm(h.margin_lo, h.margin_hi), sg(h.liftedMargin, 4),
      { raw: h.bitIdentical ? C.tag('agree · bit-identical', 'cert') : h.agree ? C.tag('agree', 'cert') : C.tag('disagree', 'open') },
      { raw: h.sign === 'negative' ? C.tag('clears zero', 'held') : C.tag('above zero', 'open') }];
  });
  O.push(C.section({
    lab: '§2 · the four margins', title: 'ζ(3) and ζ(5) clear zero; ζ(7) and G do not', wide: true,
    bodyRaw: '<div class="col">' + C.pRaw('Each family below is the one the bench\'s notes name for its constant, and each was re-run here '
      + 'at every h the bench recorded, ' + L.counts.rowsRerun + ' instances in all with Calegari\'s K = 12n family. From h = ' + signSettled + ' on '
      + 'every one keeps its sign' + (flips.length ? ' (' + flips.map((k) => label[k]).join(', ') + ' starts on the other side at the smallest h)' : '') + '. '
      + 'The ± is the margin\'s ball: P(ξ) evaluated in arb until its radius is below 2<sup>−60</sup> of its value, the logarithm taken '
      + 'in arb, the endpoints rounded outward; the bench\'s own value is good to about 10<sup>−9</sup>, which is the width of the comparison.') + '</div>'
      + C.figure({ svgRaw: FIG, caption: 'log P(ξ)/h² against h for the four headline families, every point re-run on this machine. Below the zero line the family proves ξ irrational. Hover a point for its value.' })
      + C.table({
        cols: [{ h: 'constant' }, { h: 'family' }, { h: 'h', cls: 'n' }, { h: 'margin, re-run here', cls: 'n' }, { h: 'ball (±)', cls: 'n' }, { h: 'bench', cls: 'n' }, { h: 'agreement' }, { h: 'verdict' }],
        rows
      })
  }));
}

/* §3 */
{
  const mn = (v) => String(v).replace('-', '−');
  const rows = PAD.derived.rows.map((r) => [String(r.p), mn(r.v5), mn(r.v7), mn(r.extra), mn(r.naive)]);
  const r5 = PAD.here['5'].res, r7 = PAD.here['7'].res;
  O.push(C.section({
    lab: '§3 · why ζ(7) fails', title: 'The extra arithmetic cost is paid almost in full', wide: true,
    bodyRaw: '<div class="col">' + C.pRaw('Take one family, K = ' + PAD.derived.K + ', N = 5, r = 6 (h = ' + r5.h + '), and compare k = 5 with '
      + 'k = 7. The decay of Δ itself barely moves: log Δ(ξ) is ' + sg(r5.log_delta_at_X, 0) + ' at k = 5 and ' + sg(r7.log_delta_at_X, 0)
      + ' at k = 7. What moves is the content. Going from 5 to 7 adds two powers of p to H<sub>j</sub><sup>(k)</sup> at every '
      + 'node j ≥ p, a naive price of 2(K − p) per prime. Prime by prime the measured cost scatters around that price — above it for '
      + 'p = ' + PAD.derived.rows.filter((r) => r.extra > r.naive).map((r) => r.p).join(', ') + ', below it for p = '
      + PAD.derived.rows.filter((r) => r.extra < r.naive).map((r) => r.p).join(', ') + ', equal for p = '
      + PAD.derived.rows.filter((r) => r.extra === r.naive).map((r) => r.p).join(', ') + ' — and weighted by log p over p &gt; √K it totals '
      + PAD.derived.extraLogWeighted.toFixed(0) + ' against a naive ' + PAD.derived.naiveLogWeighted.toFixed(0) + ', '
      + Math.round(100 * PAD.derived.ratio) + '%. The primes 2, 3, 5, 7 add ' + PAD.derived.smallPrimesExtra.toFixed(0) + ' more, '
      + 'because they lose common factors ζ(5) keeps. So log P(ξ) goes from ' + sg(r5.logP_at_X, 0) + ' to ' + sg(r7.logP_at_X, 0) + '.') + '</div>'
      + C.table({ cols: [{ h: 'p', cls: 'n' }, { h: 'v_p(content), ζ(5)', cls: 'n' }, { h: 'v_p(content), ζ(7)', cls: 'n' }, { h: 'extra cost', cls: 'n' }, { h: 'naive 2(K − p)', cls: 'n' }], rows })
      + '<div class="col">' + C.pRaw('Both profiles were recomputed here from the lifted ' + C.m('padic.py') + ' and are equal to the bench\'s, '
        + 'prime by prime. The valuations are exact integers; the percentage is their log-weighted ratio.') + '</div>'
  }));
}

/* §4 */
{
  const rowsK = [3, 5, 7].map((k) => {
    const z = CR.bestZ[String(k)], e = CR.bestE[String(k)];
    return ['ζ(' + k + ')', famName(nameToSpec(z.family)) + ' · h = ' + z.h, { raw: '<strong>' + sg(z.margin) + '</strong>' }, String(z.families),
      sg(e.margin), { raw: z.margin < 0 ? C.tag('clears zero', 'held') : C.tag('above zero', 'open') }];
  });
  rowsK.push(['Catalan G', famName(nameToSpec(CR.bestCatalan.family)) + ' · h = ' + CR.bestCatalan.h, { raw: '<strong>' + sg(CR.bestCatalan.margin) + '</strong>' },
    String(CR.bestCatalan.families), '—', { raw: C.tag('above zero', 'open') }]);
  O.push(C.section({
    lab: '§4 · the wall, across the families', title: fmt(CR.counts.families) + ' families, and none reaches ζ(7)', wide: true,
    bodyRaw: '<div class="col">' + C.pRaw('The bench scanned the shape (K = am, N = bm) and the zero multiplicity r for both weights and both '
      + 'pole lattices: ' + CR.counts.scan3 + ' families in the main scan, ' + CR.counts.scan1 + ' in a first scan at larger r, and ' + CR.counts.struct
      + ' structural variants — ' + fmt(CR.counts.records) + ' exact determinants, ' + CR.counts.errors + ' errors. The best margin at the largest h '
      + 'computed (h ≥ 30) is below, with the alternating weight beside it; that weight is worse at every k.') + '</div>'
      + C.table({ cols: [{ h: 'constant' }, { h: 'best family (weight Z, or E for G)' }, { h: 'margin', cls: 'n' }, { h: 'families', cls: 'n' }, { h: 'best with weight E', cls: 'n' }, { h: 'verdict' }], rows: rowsK })
      + '<div class="col">' + C.pRaw('The structural variants — zeros above the poles, odd poles only, staircase multiplicities, zeros '
        + 'interleaved with the poles, integer and half-integer poles mixed, a window of zeros inside the poles — are all worse than '
        + 'Fauzan\'s shape (a contiguous block of poles, integer zeros below it): ' + sg(s5lo) + ' to ' + sg(s5hi) + ' for ζ(5), '
        + sg(s7lo) + ' to ' + sg(s7hi) + ' for ζ(7), every one of them positive.')
        + C.note({ lab: 'an extrapolation, labelled', bodyRaw: C.pRaw('Read across k, the best margins sit on a line: '
          + CR.linearInK.slopePerUnitK.toFixed(2) + '·h² per unit of k, crossing zero at k ≈ ' + CR.linearInK.zeroCrossingFit.toFixed(2)
          + ' (least squares through k = 3, 5, 7; the bench\'s notes round this to "k ≈ 6"). That is what "the class stops near ζ(5)" '
          + 'means here: a measurement over these families at h ≤ ' + maxHLifted + ', extrapolated. It proves nothing about a family outside them, '
          + 'and no limit in h is proved. ζ(7) by this route needs a structurally new idea — more decay, or arithmetic savings that '
          + 'grow with k — not tuning.') }) + '</div>'
  }));
}

/* §5 */
O.push(C.section({
  lab: '§5 · a side result', title: 'ζ(5) has ' + Math.round(roomF) + ' to ' + Math.round(roomC) + ' times the room the proofs use',
  bodyRaw: C.pRaw('Calegari\'s reconstruction uses K = 12n, N = n, r = 6, h = 11n and proves P(ζ(5)) ≤ e<sup>−3n²/2</sup>, which is '
    + sg(PUB.calegari.perH2, 4) + '·h². Fauzan\'s abstract states degree 37n and exp(−139n²/5), ' + sg(PUB.fauzan.perH2, 4) + '·h². '
    + 'The true margin of Calegari\'s own family, re-run here to h = ' + cal5top.h + ', is ' + C.m(sg(cal5top.margin, 3) + '·h²') + ' — '
    + roomC.toFixed(0) + ' times what his normalisation proves and ' + roomF.toFixed(0) + ' times Fauzan\'s rate. The same family at k = 7 '
    + 'sits at ' + sg(cal7top.margin, 3) + '·h². So a much better irrationality exponent for ζ(5) than Fauzan\'s 260 exists in principle; '
    + 'claiming it needs the arithmetic proved for the better normalisation, which nothing here does.')
    + C.pRaw('Both published rates are read from the sources as fetched and pinned on 2026-10-05; that is a comparison of their stated '
      + 'exponents with our exact computation, not a check of their proofs.')
}));

/* §6 */
{
  const xc3 = X.rows.filter((r) => r.zeta3Enclosure);
  O.push(C.section({
    lab: '§6 · what is verified, and what is not', title: 'Re-run, cross-checked, and the rest named',
    bodyRaw: C.plainList([
      { b: 'Re-run here.', raw: 'The four headline families at every h the bench recorded, ζ(5) at r = 4 as well, Calegari\'s family for k = 5 and 7 up to h = '
        + L.counts.maxHRerun + ', and the two p-adic profiles: ' + L.counts.rowsRerun + ' instances, every one inside its ball, '
        + L.counts.bitIdentical + ' with the engine\'s output equal to the bench\'s to the last bit. Python ' + L.env.python + ', python-flint ' + L.env.flint + '.' },
      { b: 'The formulas.', raw: C.m('test2.py') + ' re-run here: ' + T2.checks + ' moment and node formulas against numerical integration '
        + '(k = 2, 3, 5, 7, both weights), largest relative error ' + T2.maxRelErr.toExponential(1) + ', and the two engines give the identical '
        + 'P on Fauzan\'s ζ(5) data. This is numerical, at 30 digits; it checks the formulas the exact engine is built on.' },
      { b: 'A second route.', raw: C.m('crosscheck.py') + ' is standard-library Python written from the definitions, sharing no code with the '
        + 'engine: its own Bernoulli numbers, schoolbook partial fractions, Δ from Fraction determinants at h + 1 points and Lagrange '
        + 'interpolation instead of a characteristic polynomial, and ζ(3) enclosed by exact rationals from Apéry\'s series instead of arb. '
        + 'On ' + X.rows.length + ' instances (ζ(3) at h = ' + xc3.map((r) => r.h).join(', ') + '; ζ(5), ζ(7) and G at h = 7) it returns the '
        + 'engine\'s P coefficient by coefficient and its content exactly, and for ζ(3) its rational enclosure of P(ζ(3)) meets the engine\'s ball. '
        + 'For ζ(5), ζ(7) and G it checks the polynomial only.' },
      { b: 'Not re-run.', raw: 'The ' + fmt(CR.counts.records) + '-determinant scan behind §4 (about an hour of one core on the bench). It enters as the '
        + 'bench\'s records, pinned by sha256, and the class reading built on it is labelled an extrapolation in the ledger itself.' },
      { b: 'The battery.', raw: nChecks + ' checks and ' + nReds + ' planted forgeries at this build — a flipped bit in a lifted file, a tampered '
        + 'ledger margin, a bench value that is not the record\'s, a moment off by one part in a million, a node constant off by one part in '
        + 'a million, the extrapolation relabelled a theorem — every one refused.' }
    ])
  }));
}

/* the ζ(7) audit, if it exists, supersedes "checked neither" for Anand's claim (the record decides, not this text) */
const Z7P = path.join(ROOT, 'certs', 'zeta7-anand-audit.json');
const Z7J = fs.existsSync(Z7P) ? JSON.parse(fs.readFileSync(Z7P, 'utf8')) : null;
const Z7r2 = Z7J && Z7J.margins.scenarios.find((x) => x.key === 'R2|printed|printed');
const Z7 = !!(Z7J && Z7J.verdict === 'REFUTED' && Z7r2 && Z7r2.negative118 === false);

/* §7 */
O.push(C.section({
  lab: '§7 · context', title: Z7 ? 'The race: one claim audited here since, the rest as reported' : 'The race, as reported — not verified here',
  bodyRaw: C.pRaw(Z7
      ? 'Two proofs past ζ(5) were circulating when this page was first built, and neither had been checked here. One has since been '
        + 'audited: <a href="/reports/zeta7-anand.html">Anand\'s ζ(7) proof</a> fails at the inequality it rests on (A₂₀₀ + U, which must be '
        + 'negative, is +' + Number(Z7r2.A200plusU).toFixed(2) + ' from the paper\'s own formulas; the route is refuted, ζ(7)\'s irrationality untouched). '
        + 'The rest below is as reported, not a finding of this machine; the sources are pinned in the corpus as fetched on 2026-10-05.'
      : 'Two proofs past ζ(5) are circulating. We have checked neither, and nothing below is a finding of this machine; '
        + 'the sources are pinned in the corpus as fetched on 2026-10-05.')
    + C.plainList(L.raceContext.items.map((it) => ({ b: it.claim + '.', text: it.status + (Z7 && /Anand/.test(it.claim) ? '. Audited here since: the route is refuted (/reports/zeta7-anand.html)' : '') + '.' })))
    + C.pRaw('What this page adds is narrower and checkable: within the class of Hankel families measured, the margin at k = 7 is positive, '
      + 'and the reason is arithmetic. A proof of ζ(7) by this method has to leave the class, and a reader of one can ask where it does.')
    + C.note({ lab: 'the records', bodyRaw: C.pRaw('<a href="/certs/zeta-hankel-ledger.json">The ledger</a> (every re-run row with its ball, '
      + 'the bench value beside it, the fingerprint of P, the cross-check, the class reading and its label) · the engine and its '
      + 'provenance in ' + C.m('instruments/zetahankel/') + ' · the bench\'s runs in ' + C.m('certs/zeta-hankel/runs/') + ' · the sibling lane, '
      + '<a href="/reports/zeta3-audit.html">the ζ(3) sheet, decided</a>, where the Ramanujan Machine\'s ζ(3) conjectures are re-decided with certificates.') })
}));

const foot = '<p>' + C.esc('Generated by tools/build-report-zeta-hankel.js from certs/zeta-hankel-ledger.json — written by instruments/zetahankel/rerun.py from a re-run of the lifted engine on this machine — after instruments/zetahankel/battery.py passed with every planted forgery refused; the build fails if any of it does not hold.') + '</p>'
  + '<p>' + C.esc('git ' + git + ' · cert-machine · Carlos Toledo') + '</p>';

fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'reports', 'zeta-hankel.html'),
  TPL.render({ title: 'Past ζ(5): the Hankel method, measured · cert-machine', bodyRaw: O.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/zeta-hankel.html',
    desc: 'The Hankel-determinant method that proved ζ(5) irrational, measured exactly on ζ(7) and Catalan\'s constant: margins '
      + sg(H.zeta3.margin) + ', ' + sg(H.zeta5.margin) + ', ' + sg(H.zeta7.margin) + ', ' + sg(H.catalan.margin) + ' (ζ(3), ζ(5), ζ(7), G), every one re-run here; the wall across '
      + fmt(CR.counts.families) + ' families is a measurement, not a theorem.' }));
console.log('reports/zeta-hankel.html written — margins ζ(3) ' + sg(H.zeta3.margin, 3) + ', ζ(5) ' + sg(H.zeta5.margin, 3) + ', ζ(7) ' + sg(H.zeta7.margin, 3)
  + ', G ' + sg(H.catalan.margin, 3) + '; ' + L.counts.agree + '/' + L.counts.rowsRerun + ' rows agree; battery ' + nChecks + ' checks, ' + nReds + ' reds');
