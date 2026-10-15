#!/usr/bin/env node
/* build-report-aerp.js — reports/alphaevolve-community.html: the community certificates filed against the AlphaEvolve
   repository of problems, decided one by one. Every number comes from certs/aerp-ledger.json (tools/run-aerp-ledger.py),
   re-derived here before a word is written, and from the battery's own count.

   usage: node tools/build-report-aerp.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('AERP REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const py = (args) => cp.execFileSync('python3', ['-I'].concat(args), { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });

try { py(['tools/run-aerp-ledger.py']); } catch (e) { die('the ledger does not re-derive: ' + (e.stdout || e.message)); }
let bat = ''; try { bat = py(['instruments/aerp/battery.py']); } catch (e) { die('the battery did not pass: ' + (e.stdout || e.message)); }
const bm = /aerp battery: (\d+) pass, 0 fail, (\d+)\/(\d+) red controls fired/.exec(bat);
if (!bm || bm[2] !== bm[3]) die('the battery did not pass whole');
const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'aerp-ledger.json'), 'utf8'));
const rows = L.rows;
const by = (p) => rows.filter((r) => r.id.startsWith(p));
const p59 = by('aerp-p59-'), p60 = by('aerp-p60-'), p61 = by('aerp-p61-'), p42 = by('aerp-p42-'), p64 = by('aerp-p64-');
const fmt = (x) => Number(x).toLocaleString('en-US');
const tag = (v) => C.tag(v, v === 'CERTIFIED' ? 'held' : v === 'REFUTED' ? 'fail' : 'dep');
const cnt = L.counts;
if (p59.some((r) => r.verdict !== 'CERTIFIED') || p60.some((r) => r.verdict !== 'CERTIFIED')) die('a grid claim is not CERTIFIED — the page\'s prose assumes they all hold; rewrite it');
const r4742 = p61.find((r) => r.id === 'aerp-p61-47-42'), r98 = p61.find((r) => r.id === 'aerp-p61-9-8-m14'), r17 = p61.find((r) => r.id === 'aerp-p61-9-8-m17');
if (!r4742 || !r98 || !r17 || r98.alphaNotebook !== '3/4' || r98.alphaFull !== '9/8' || r17.alphaNotebook !== '9/8') die('the ring-loading convention finding moved');
const far = p42.find((r) => r.id === 'aerp-p42-far-block-1163'), strong = p42.find((r) => r.id === 'aerp-p42-strong-form-counterexample');
const refused = rows.filter((r) => r.verdict === 'REFUSED');
const best = L.p60BestCertifiedPerN, repo = L.p60RepositoryBest;
const hk = p60.filter((r) => r.id.includes('hashkanna')), mm = p60.filter((r) => r.id.includes('-mm-')), ot = p60.filter((r) => r.id.includes('0thernet'));
const quads = p60.reduce((a, r) => a + (r.how.match(/every 4-subset \(([\d,]+)\)/) ? Number(r.how.match(/every 4-subset \(([\d,]+)\)/)[1].replace(/,/g, '')) : 0), 0);

const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · audit · a registry\'s unanswered claims',
  title: 'The AlphaEvolve repository\'s community certificates, decided',
  deck: 'Since June, eight issues on DeepMind\'s repository of problems have offered explicit objects that beat its recorded bests — grid sets with no five points on a '
    + 'sphere up to n = 40, two 58-point isosceles-free sets where the literature says 56 is optimal, rational ring-loading instances at 47/42 and 9/8, a sum-difference set past '
    + 'the published bound — most of them found by language-model searches, none answered by the repository. Every finite object among them is decided here in exact '
    + 'arithmetic from the notebooks\' own definitions: ' + cnt.CERTIFIED + ' hold, none fails, and ' + cnt.REFUSED + ' claims are refused because there is nothing finite to decide — '
    + 'a floating-point sofa and an 86-digit modulus.'
}));
B.push(C.scope('The claims: issues #4–#12 of github.com/google-deepmind/alphaevolve_repository_of_problems (the repository itself pinned at 8f447457, 2026-07-11, Apache-2.0), their inline '
  + 'objects and the certificate files they link (hashkanna/mendel-evolve, milesandmistakes/no-five-sphere-grid-certificates v1.1.1, hraness/algal-lab, two attachment zips), every '
  + 'byte pinned by sha256 in corpus/aerp/PINS.json and read as data — no claimant code runs. The definitions are the pinned notebooks\' (prompt text and verification cells). '
  + 'Pre-registered in corpus/aerp/preregistration.json. Optimality is nowhere claimed or decided: a certified row says "at least".'));
B.push(C.tldr({
  findingRaw: '<b>Every finite claim holds.</b> No five on a sphere: ' + p60.length + ' point sets from four contributors, n = 13 to 40, ' + fmt(quads) + ' quadruples keyed by their exact hyperplane and '
    + 'no two alike — the best certified sizes run from ' + best['13'] + ' at n = 13 to ' + best['40'] + ' at n = 40 where the repository stops at n = 12 with 33. No isosceles triangles: both 58-point sets '
    + 'at n = 32 are clean over all ' + fmt(p59[0].triples) + ' triples and maximal; the literature\'s "f(32) = 56, SAT-optimal" (PatternBoost) is contradicted by an explicit object. Ring loading: '
    + '47/42 holds under either reading of the problem; <b>9/8 holds under the thread\'s reading (k = 1..m) and, as the notebook writes the problem (k = 1..m−1), only once padded with two zero pairs '
    + 'or in the m = 17 instance of the zip</b> — the notebook\'s own text and its code agree with each other and differ from the thread\'s. Sums and differences: the far-block set rebuilt from its '
    + 'rule has g = ' + far.g.toFixed(5) + ' > 1.163, above Penman–Wells\' 1.12594 and the repository\'s 1.12194; the 23,646-integer set violates the strong inequality by exactly 89.',
  mechanismRaw: 'Integers only: squared distances for triangles; for spheres, the 4-subset hyperplane key (a primitive integer 5-vector) whose duplicates are exactly the zero 5 × 5 determinants, '
    + 'cross-checked against every 5-subset\'s determinant on the smaller sets; for ring loading every 2ᵐ sign pattern on lcm-scaled integers; for sumsets a bitset, with g > 1.163 decided as an '
    + 'integer inequality. The repository\'s own constructions decide as its notebooks report (' + L.controls.length + ' controls).',
  checkRaw: C.m('python3 -I tools/run-aerp-ledger.py') + ' · ' + C.m('python3 -I instruments/aerp/battery.py') + ' — ' + bm[1] + ' checks, ' + bm[3] + ' red controls.'
}));
B.push(C.stats([
  { k: 'claims decided', v: String(cnt.CERTIFIED), n: cnt.REFUTED + ' refuted · ' + cnt.REFUSED + ' refused (no finite object). Four problems, eight issues, five contributors.' },
  { k: 'C(40) ≥', v: String(best['40']), n: 'No five on a sphere, 40 × 40 × 40; the repository records 33 at n = 12 and nothing beyond.' },
  { k: 'C(32) ≥ 58', v: 'two sets', n: 'No isosceles triangles; "56, SAT-optimal" in PatternBoost §4.1 — an explicit contradiction.' },
  { k: 'ring loading', v: '9/8', n: 'Under k = 1..m; under the notebook\'s k = 1..m−1 the same bound needs the padded or the m = 17 instance.' }
]));
B.push(C.section({
  lab: '§1 · no five on a sphere', title: 'Problem 60: the frontier, n = 13 to 40', wide: true,
  bodyRaw: C.pRaw('The repository\'s notebook stops at n = 12 (33 points) and its verifier is floating point (np.linalg.det with isclose). The thread grew from one 36-point set at n = 13 to '
    + 'four contributors leapfrogging each other; the best certified size per n, every one decided here exactly:')
    + C.table({
      cols: [{ h: 'n' }, { h: 'best certified' }, { h: 'by' }, { h: 'repository' }],
      rows: Object.keys(best).map((n) => { const r = p60.filter((x) => x.n === Number(n) && x.size === best[n])[0];
        return [{ raw: n }, { raw: String(best[n]) }, { raw: C.esc(r.where.split(',')[0].replace(/^#\d+ /, '')) }, { raw: repo[n] ? String(repo[n]) : '—' }]; })
    })
    + C.pRaw('All ' + p60.length + ' sets (' + hk.length + ' of hashkanna\'s files including the stepping stones, ' + mm.length + ' of milesandmistakes\' RECORD files, ' + ot.length + ' of 0thernet\'s, #4\'s one) are CERTIFIED: '
      + 'in the grid, distinct, no dependent quadruple, no two quadruples on one sphere or plane. Where the 5-subset determinant was also run (sets of at most 45 points) the smallest |det| is 2 throughout — '
      + 'the claimants\' own figure, and the margin at which a float verifier is one rounding from wrong.')
}));
B.push(C.section({
  lab: '§2 · no isosceles triangles', title: 'Problem 59: 58 where 56 was called optimal',
  bodyRaw: C.pRaw('hashkanna\'s two 58-point subsets of the 32 × 32 grid (#10) contain no three points with two equal distances, the collinear midpoint case included: ' + fmt(p59[0].triples)
    + ' triples each, zero isosceles, and neither admits another grid point (maximal). The external certificate file equals set_a byte for byte in content' + (p59[0].externalFileEqualsSetA ? '' : ' — NO') + '. '
    + 'PatternBoost (arXiv:2411.00566 §4.1) captions "f(32) = 56" and says SAT solvers prove optimality up to n ≈ 32; the AlphaEvolve paper repeats the figure. An explicit 58-point object under the '
    + 'notebook\'s definition means one of three things — a different definition in the SAT work, a slip in the caption, or an error here — and this page can only rule out the third: the decider '
    + 'reproduces the notebook\'s own 112-point n = 64 and 164-point n = 100 constructions as admissible and catches a planted midpoint.')
}));
B.push(C.section({
  lab: '§3 · ring loading', title: 'Problem 61: which k the problem ranges over', wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'instance' }, { h: 'm' }, { h: 'α, k = 1..m−1 (the notebook)' }, { h: 'α, k = 1..m (the thread)' }, { h: 'padded, notebook' }, { h: 'verdict' }],
    rows: p61.map((r) => [{ raw: C.esc(r.where.split(' (')[0]) + (r.file ? ' · ' + C.esc(path.basename(r.file)) : '') }, { raw: String(r.m) }, { raw: C.esc(r.alphaNotebook) }, { raw: C.esc(r.alphaFull) }, { raw: C.esc(r.alphaPaddedNotebook) }, { raw: tag(r.verdict) }])
  }) + C.pRaw('The notebook\'s prompt and its compute_alpha_exact both range k over 1..m−1; #12 ranges over 1..m, where the extra term is |Σzᵢ|, and says so. The two readings agree on padded instances, '
    + 'so C ≥ 9/8 holds under the notebook\'s reading too (m = 16 padded, or the m = 17 instance at denominator 560 without padding) — the bound stands, and which m attains it is a matter of convention. '
    + 'Under the strict notebook reading the m = 14 table gives 3/4. The thread\'s karldaeubel instance (12 pairs, two identical blocks) attains 9/8 likewise.')
}));
B.push(C.section({
  lab: '§4 · sums and differences', title: 'Problem 42: the finite parts of a large claim',
  bodyRaw: C.pRaw('#5 offers much — C = 2, a 1.6269 instance, a ceiling theorem, a conjecture — and asks to be torn apart; its author then found Lin–Li (arXiv:2607.27199) had settled C = 2 two days earlier. '
    + 'Two parts are finite objects and are decided: the far-block set its certificate script defines (rebuilt here from the rule, |A| = ' + fmt(far.size) + ', |A+A| = ' + fmt(far.sumset) + ', |A−A| = ' + fmt(far.differenceSet)
    + ') has g = ' + far.g.toFixed(6) + ', and g > 1.163 is decided as |A+A|¹⁰⁰⁰|A|¹⁶³ > |A−A|¹¹⁶³ in integers — above Penman–Wells\' explicit 1.12594 and the repository\'s 1.12194 (its 309-element list re-counted: 1,367 sums, 1,163 differences). '
    + 'The explicit 23,646-integer set of its §5 has |A+A| = ' + fmt(strong.sumset) + ', |A−A| = ' + fmt(strong.differenceSet) + ', diameter ' + fmt(strong.diameter) + ': |A+A| + |A| exceeds |A−A| + diam + 1 by ' + strong.slack + ', as stated. '
    + 'The 1.6269 instance (an 86-digit modulus) is REFUSED: nothing enumerable, and its count rests on an argument its authors call machine-generated and unreviewed.')
}));
B.push(C.section({
  lab: '§5 · refused', title: 'What has no finite object to decide',
  bodyRaw: C.table({ cols: [{ h: 'claim' }, { h: 'why refused' }], rows: refused.map((r) => [{ raw: C.esc(r.claim) }, { raw: C.esc(r.how) }]) })
    + C.pRaw('A refusal is a verdict about the evidence, not the mathematics: the sofa may well have volume 1.8558, but a cube count under a 0.05° tolerance is a measurement, and the page says so rather than lending it a certificate.')
}));
B.push(C.section({
  lab: '§6 · limits', title: 'What is not decided here',
  bodyRaw: C.plainList([
    { b: 'Optimality.', text: 'Every certified row is a lower bound; no upper bound is decided, and the thread\'s own optimality remarks (an MILP at m = 4, 5; "SAT-optimal 56") are not re-run.' },
    { b: 'Priority.', text: 'Who found what first (Demonstrandum\'s n = 16 42-set, the stepping stones, the corrective release) is read from the thread and not adjudicated; the rows name the file decided.' },
    { b: 'The definition of ring loading.', text: 'The notebook\'s k-range is taken as the problem\'s; whether the original ring-loading constant wants k = 1..m is a question for the problem\'s source, not decided here.' },
    { b: 'Same-author second implementation.', text: 'The two sphere deciders were written by the same author from the same definition; they catch a slip in one arithmetic, not a shared misreading. The repository\'s own constructions are the outside control.' }
  ])
}));
const foot = '<p>' + C.esc('Generated by tools/build-report-aerp.js from certs/aerp-ledger.json (' + L.generated + ', ' + L.seconds + ' s' + (L.numpy ? ', numpy' : ', pure Python') + '), re-derived at build; battery ' + bm[1] + ' checks, ' + bm[3] + ' red controls; @ git ' + git + '.') + '</p>';
fs.writeFileSync(path.join(ROOT, 'reports', 'alphaevolve-community.html'), TPL.render({
  title: 'The AlphaEvolve repository\'s community certificates, decided · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot,
  desc: 'Eight unanswered issues on DeepMind\'s AlphaEvolve repository of problems — sphere-free grids to n = 40, 58-point isosceles-free sets, ring loading at 9/8, a sum-difference set past the literature — decided in exact arithmetic from the notebooks\' definitions.',
  path: '/reports/alphaevolve-community.html'
}));
console.log('reports/alphaevolve-community.html written: ' + rows.length + ' rows, ' + cnt.CERTIFIED + ' certified, ' + cnt.REFUSED + ' refused @ git ' + git);
