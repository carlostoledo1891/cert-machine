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
/* WARRANT v2.1 (design/WARRANT.md), 2026-10-28. Every verdict here is an exact decision (DECIDED, plain). What the
   page types that is NOT decided here is marked: g as a float (the decision is the integer inequality g > 1.163, not
   its digits), and the numbers the literature or the repository printed (56, 1.12594, 1.12194, 1.6269) — claims
   someone made, COMPUTED, underlined dashed. A verdict that holds under one reading of the problem names the reading in
   italic (rule 6): ring loading's k-range. No red ×, and when in doubt ink (rule 5): the 58-point sets meet a claim
   about another record (PatternBoost's 56), and the strong-form set is the claimant's own exhibit, certified here
   rather than exhibited by this page. */
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
const said = (s, title) => W.value(C.esc(String(s)), W.COMPUTED, { title: title || 'printed by someone else — a claim, not decided here' });
const gFloat = (x, d) => W.value(x.toFixed(d), W.COMPUTED, { title: 'g in float, log(|A+A|/|A|) / log(|A−A|/|A|); what is decided is that g exceeds 1.163, an integer inequality' });
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
/* ---- gates on the facts the prose states (2026-10-28: each was typed by hand until then) ---- */
const WORD = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const word = (n) => WORD[n] || fmt(n), Word = (n) => { const w = word(n); return w.charAt(0).toUpperCase() + w.slice(1); };
if (cnt.REFUTED !== 0 || rows.some((r) => r.verdict !== 'CERTIFIED' && r.verdict !== 'REFUSED')) die('the page says none fails; the ledger now has a row that does');
if (L.controls.some((c) => c.verdict && c.verdict !== 'CERTIFIED')) die('a control of the repository\'s own constructions does not decide as its notebook reports');
const who = (r) => r.where.replace(/^#\d+ (comment, )?/, '').split(/[ ,(]/)[0];
const p60Who = new Set(p60.map(who)), certWho = new Set(rows.filter((r) => r.verdict === 'CERTIFIED').map(who));
const problemsCert = new Set(rows.filter((r) => r.verdict === 'CERTIFIED').map((r) => r.id.split('-')[1])).size;
const issuesHeld = fs.readdirSync(path.join(ROOT, 'corpus', 'aerp', 'sources', 'issues')).filter((f) => /^issue-\d+\.json$/.test(f)).length;
if (hk.length + mm.length + ot.length + 1 !== p60.length || p60Who.size !== 4) die('the sphere sets are not hashkanna\'s, milesandmistakes\', 0thernet\'s and #4\'s one');
const nKeys = Object.keys(best).map(Number), nLo = Math.min(...nKeys), nHi = Math.max(...nKeys);
const repoKeys = Object.keys(repo).map(Number), repoN = Math.max(...repoKeys), repoSize = repo[repoN];
const first60 = p60.find((r) => r.id === 'aerp-p60-c13-36');
if (!first60 || first60.n !== nLo || first60.size !== best[String(nLo)]) die('the thread\'s first set is not the 36-point n = 13 set');
if (p59.length !== 2 || p59.some((r) => r.n !== 32 || r.size !== p59[0].size || r.maximal !== true)) die('the two isosceles-free sets are not both maximal ' + p59[0].size + '-point sets at n = 32');
const w5 = p60.filter((r) => /every 5-subset/.test(r.how)), w5max = Math.max(...w5.map((r) => r.size));
const dets = new Set(w5.map((r) => (r.how.match(/min \|det\| (\d+)/) || [])[1]));
if (dets.size !== 1 || !dets.has('2') || p60.some((r) => !/every 5-subset/.test(r.how) && r.size <= w5max)) die('the 5-subset cross-check is not "every set of at most ' + w5max + ' points, min |det| 2"');
const nb60 = fs.readFileSync(path.join(ROOT, 'corpus', 'aerp', 'sources', 'notebooks', 'no_5_on_a_sphere.ipynb'), 'utf8');
if (!nb60.includes('np.linalg.det(matrix)') || !nb60.includes('isclose(det, 0)')) die('the repository\'s verifier is no longer np.linalg.det with isclose');
const c64 = L.controls.find((c) => c.id === 'p59-notebook-sol_64'), c100 = L.controls.find((c) => c.id === 'p59-notebook-sol_100'), c42 = L.controls.find((c) => c.id === 'p42-notebook-best_list');
if (!c64 || !c100 || !c42 || c64.size !== 112 || c100.size !== 164) die('the notebook\'s own isosceles constructions moved');
if (!/Penman--Wells 2013 give 1\.12594, the repository 1\.12194/.test(far.where) || Math.abs(c42.g - 1.12194) > 5e-6) die('the literature values the prose quotes are not in the record');
if (!/arXiv:2411\.00566 §4\.1/.test(p59[0].where) || !/the published value is 56/.test(p59[0].where)) die('PatternBoost\'s 56 is not in the record');
const ref1 = rows.find((r) => r.id === 'aerp-p42-c-ge-1.6269');
if (!ref1 || ref1.verdict !== 'REFUSED') die('the 1.6269 instance is not REFUSED');

const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · audit · a registry\'s unanswered claims',
  title: 'The AlphaEvolve repository\'s community certificates, decided',
  deck: 'Since June, ' + word(issuesHeld) + ' issues on DeepMind\'s repository of problems have offered explicit objects that beat its recorded bests — grid sets with no five points on a '
    + 'sphere up to n = ' + nHi + ', ' + word(p59.length) + ' ' + p59[0].size + '-point isosceles-free sets where the literature says 56 is optimal, rational ring-loading instances at 47/42 and 9/8, a sum-difference set past '
    + 'the published bound — most of them found by language-model searches, none answered by the repository. Every finite object among them is decided here in exact '
    + 'arithmetic from the notebooks\' own definitions: ' + cnt.CERTIFIED + ' hold, none fails, and ' + cnt.REFUSED + ' claims are refused because there is nothing finite to decide — '
    + 'a floating-point sofa and an 86-digit modulus.'
}));
B.push(C.scope('The claims: issues #4–#12 of github.com/google-deepmind/alphaevolve_repository_of_problems (the repository itself pinned at 8f447457, 2026-07-11, Apache-2.0), their inline '
  + 'objects and the certificate files they link (hashkanna/mendel-evolve, milesandmistakes/no-five-sphere-grid-certificates v1.1.1, hraness/algal-lab, two attachment zips), every '
  + 'byte pinned by sha256 in corpus/aerp/PINS.json and read as data — no claimant code runs. The definitions are the pinned notebooks\' (prompt text and verification cells). '
  + 'Pre-registered in corpus/aerp/preregistration.json. Optimality is nowhere claimed or decided: a certified row says "at least".'));
B.push(C.tldr({
  findingRaw: '<b>Every finite claim holds.</b> No five on a sphere: ' + p60.length + ' point sets from ' + word(p60Who.size) + ' contributors, n = ' + nLo + ' to ' + nHi + ', ' + fmt(quads) + ' quadruples keyed by their exact hyperplane and '
    + 'no two alike — the best certified sizes run from ' + best[String(nLo)] + ' at n = ' + nLo + ' to ' + best[String(nHi)] + ' at n = ' + nHi + ' where the repository stops at n = ' + repoN + ' with ' + repoSize + '. No isosceles triangles: both ' + p59[0].size + '-point sets '
    + 'at n = 32 are clean over all ' + fmt(p59[0].triples) + ' triples and maximal, so under the notebook\'s definition the literature\'s "f(32) = ' + said(56, 'printed by PatternBoost (arXiv:2411.00566 §4.1) and repeated by the AlphaEvolve paper — a claim, not decided here') + ', SAT-optimal" (PatternBoost) is not the maximum; whether the SAT work used another definition is the open question (§2). Ring loading: '
    + '47/42 holds under either reading of the problem; <b>9/8 holds <em>given the thread\'s reading, k = 1..m</em>, and <em>given the notebook\'s, k = 1..m−1</em>, only once padded with two zero pairs '
    + 'or in the m = 17 instance of the zip</b> — the notebook\'s own text and its code agree with each other and differ from the thread\'s. Sums and differences: the far-block set rebuilt from its '
    + 'rule has g = ' + gFloat(far.g, 5) + ' > 1.163, above Penman–Wells\' ' + said('1.12594') + ' and the repository\'s ' + said('1.12194', 'the repository\'s best_list in float; its sums and differences are re-counted exactly here') + '; the ' + fmt(strong.size) + '-integer set violates the strong inequality by exactly ' + strong.slack + '.',
  mechanismRaw: 'Integers only: squared distances for triangles; for spheres, the 4-subset hyperplane key (a primitive integer 5-vector) whose duplicates are exactly the zero 5 × 5 determinants, '
    + 'cross-checked against every 5-subset\'s determinant on the smaller sets; for ring loading every 2ᵐ sign pattern on lcm-scaled integers; for sumsets a bitset, with g > 1.163 decided as an '
    + 'integer inequality. The repository\'s own constructions decide as its notebooks report (' + L.controls.length + ' controls).',
  checkRaw: C.m('python3 -I tools/run-aerp-ledger.py') + ' · ' + C.m('python3 -I instruments/aerp/battery.py') + ' — ' + bm[1] + ' checks, ' + bm[3] + ' red controls.'
}));
B.push(C.stats([
  { k: 'claims decided', v: String(cnt.CERTIFIED), n: cnt.REFUTED + ' refuted · ' + cnt.REFUSED + ' refused (no finite object). ' + Word(problemsCert) + ' problems, ' + word(issuesHeld) + ' issues, ' + word(certWho.size) + ' contributors behind the certified objects.' },
  { k: 'C(' + nHi + ') ≥', v: String(best[String(nHi)]), n: 'No five on a sphere, ' + nHi + ' × ' + nHi + ' × ' + nHi + '; the repository records ' + repoSize + ' at n = ' + repoN + ' and nothing beyond.' },
  { k: 'C(32) ≥ ' + p59[0].size, v: word(p59.length) + ' sets', nRaw: 'No isosceles triangles; under the notebook\'s definition PatternBoost\'s "' + said(56, 'printed by PatternBoost (arXiv:2411.00566 §4.1) — a claim, not decided here') + ', SAT-optimal" (§4.1) is not the maximum.' },
  { k: 'ring loading', v: '9/8', n: 'Under k = 1..m; under the notebook\'s k = 1..m−1 the same bound needs the padded or the m = 17 instance.' }
]));
B.push('<div class="col">' + C.pRaw('Every verdict below is an exact decision and is printed plain. A number the page did not decide — g in floating point, or a value the literature or the repository printed — is underlined dashed; a verdict that holds only under one reading of a problem names the reading in italic.')
  + W.legendHtml({ compact: true }) + '</div>');
B.push(C.section({
  lab: '§1 · no five on a sphere', title: 'Problem 60: the frontier, n = ' + nLo + ' to ' + nHi, wide: true,
  bodyRaw: C.pRaw('The repository\'s notebook stops at n = ' + repoN + ' (' + repoSize + ' points) and its verifier is floating point (np.linalg.det with isclose). The thread grew from one ' + first60.size + '-point set at n = ' + first60.n + ' to '
    + word(p60Who.size) + ' contributors leapfrogging each other; the best certified size per n, every one decided here exactly:')
    + C.table({
      cols: [{ h: 'n' }, { h: 'best certified' }, { h: 'by' }, { h: 'repository' }],
      rows: Object.keys(best).map((n) => { const r = p60.filter((x) => x.n === Number(n) && x.size === best[n])[0];
        return [{ raw: n }, { raw: String(best[n]) }, { raw: C.esc(r.where.split(',')[0].replace(/^#\d+ /, '')) }, { raw: repo[n] ? String(repo[n]) : '—' }]; })
    })
    + C.pRaw('All ' + p60.length + ' sets (' + hk.length + ' of hashkanna\'s files including the stepping stones, ' + mm.length + ' of milesandmistakes\' RECORD files, ' + ot.length + ' of 0thernet\'s, #4\'s one) are CERTIFIED: '
      + 'in the grid, distinct, no dependent quadruple, no two quadruples on one sphere or plane. Where the 5-subset determinant was also run (sets of at most ' + w5max + ' points) the smallest |det| is 2 throughout — '
      + 'the claimants\' own figure: every one of those sets comes within |det| = 2 of a degenerate five, which the repository\'s float verifier decides by a tolerance and this page decides in integers.')
}));
B.push(C.section({
  lab: '§2 · no isosceles triangles', title: 'Problem 59: ' + p59[0].size + ' where 56 was called optimal',
  bodyRaw: C.pRaw('hashkanna\'s two 58-point subsets of the 32 × 32 grid (#10) contain no three points with two equal distances, the collinear midpoint case included: ' + fmt(p59[0].triples)
    + ' triples each, zero isosceles, and neither admits another grid point (maximal). The external certificate file equals set_a byte for byte in content' + (p59[0].externalFileEqualsSetA ? '' : ' — NO') + '. '
    + 'PatternBoost (arXiv:2411.00566 §4.1) captions "f(32) = ' + said(56, 'printed by PatternBoost — a claim, not decided here') + '" and says SAT solvers prove optimality up to n ≈ 32; the AlphaEvolve paper repeats the figure. An explicit ' + p59[0].size + '-point object under the '
    + 'notebook\'s definition means one of three things — a different definition in the SAT work, a slip in the caption, or an error here — and this page can only rule out the third: the decider '
    + 'reproduces the notebook\'s own ' + c64.size + '-point n = ' + c64.n + ' and ' + c100.size + '-point n = ' + c100.n + ' constructions as admissible and catches a planted midpoint.')
}));
B.push(C.section({
  lab: '§3 · ring loading', title: 'Problem 61: which k the problem ranges over', wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'instance' }, { h: 'm' }, { h: 'α, k = 1..m−1 (the notebook)' }, { h: 'α, k = 1..m (the thread)' }, { h: 'padded, notebook' }, { h: 'verdict' }],
    rows: p61.map((r) => [{ raw: C.esc(r.where.split(' (')[0]) + (r.file ? ' · ' + C.esc(path.basename(r.file)) : '') }, { raw: String(r.m) }, { raw: C.esc(r.alphaNotebook) }, { raw: C.esc(r.alphaFull) }, { raw: C.esc(r.alphaPaddedNotebook) }, { raw: tag(r.verdict) }])
  }) + C.pRaw('The notebook\'s prompt and its compute_alpha_exact both range k over 1..m−1; #12 ranges over 1..m, where the extra term is |Σzᵢ|, and says so. The two readings agree on padded instances, '
    + 'so C ≥ 9/8 holds <em>given the notebook\'s reading</em> too (m = 16 padded, or the m = 17 instance at denominator 560 without padding) — the bound stands, and which m attains it is a matter of convention. '
    + 'Under the strict notebook reading the m = 14 table gives 3/4. The thread\'s karldaeubel instance (12 pairs, two identical blocks) attains 9/8 likewise.')
}));
B.push(C.section({
  lab: '§4 · sums and differences', title: 'Problem 42: the finite parts of a large claim',
  bodyRaw: C.pRaw('#5 offers much — C = 2, a 1.6269 instance, a ceiling theorem, a conjecture — and asks to be torn apart; its author then found Lin–Li (arXiv:2607.27199) had settled C = 2 two days earlier. '
    + 'Two parts are finite objects and are decided: the far-block set its certificate script defines (rebuilt here from the rule, |A| = ' + fmt(far.size) + ', |A+A| = ' + fmt(far.sumset) + ', |A−A| = ' + fmt(far.differenceSet)
    + ') has g = ' + gFloat(far.g, 6) + ', and g > 1.163 is decided as |A+A|¹⁰⁰⁰|A|¹⁶³ > |A−A|¹¹⁶³ in integers — above Penman–Wells\' explicit ' + said('1.12594') + ' and the repository\'s ' + said('1.12194', 'the repository\'s best_list in float; its sums and differences are re-counted exactly here') + ' (its ' + c42.size + '-element list re-counted: ' + fmt(c42.sumset) + ' sums, ' + fmt(c42.differenceSet) + ' differences). '
    + 'The explicit ' + fmt(strong.size) + '-integer set of its §5 has |A+A| = ' + fmt(strong.sumset) + ', |A−A| = ' + fmt(strong.differenceSet) + ', diameter ' + fmt(strong.diameter) + ': |A+A| + |A| exceeds |A−A| + diam + 1 by ' + strong.slack + ', as stated. '
    + 'The ' + said('1.6269', 'the claimant\'s printed value; REFUSED here — nothing finite to decide') + ' instance (an 86-digit modulus) is REFUSED: nothing enumerable, and its count rests on an argument its authors call machine-generated and unreviewed.')
}));
B.push(C.section({
  lab: '§5 · refused', title: 'What has no finite object to decide',
  bodyRaw: C.table({ cols: [{ h: 'claim' }, { h: 'why refused' }], rows: refused.map((r) => [{ raw: C.esc(r.claim) }, { raw: C.esc(r.how) }]) })
    + C.pRaw('A refusal is a verdict about the evidence, not the mathematics: the sofa may well have volume ' + said('1.8558', 'the claimant\'s printed volume; REFUSED here — a float cube count, nothing exact to decide') + ', but a cube count under a 0.05° tolerance is a measurement, and the page says so rather than lending it a certificate.')
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
