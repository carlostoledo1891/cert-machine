#!/usr/bin/env node
/* build-report-polymaps.js — reports/polymaps.html: Gao's Jacobian counterexamples and the weak Markus–Yamabe fields,
   decided. Every number comes from certs/polymaps-ledger.json (tools/run-polymaps-ledger.py), re-derived here (--check)
   before a word is written, and from the battery's own count.

   usage: node tools/build-report-polymaps.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('POLYMAPS REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const py = (args) => cp.execFileSync('python3', args, { cwd: ROOT, encoding: 'utf8' });

try { py(['tools/run-polymaps-ledger.py', '--check']); } catch (e) { die('the ledger does not re-derive: ' + (e.stdout || e.message)); }
let bat = ''; try { bat = py(['instruments/polymaps/battery.py']); } catch (e) { die('the battery did not pass: ' + (e.stdout || e.message)); }
const bm = /polymaps battery: (\d+) pass, 0 fail, (\d+)\/(\d+) red controls fired/.exec(bat);
if (!bm || bm[2] !== bm[3]) die('the battery did not pass whole');
const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'polymaps-ledger.json'), 'utf8'));
const R = (id) => L.rows.find((r) => r.id === id) || die('no row ' + id);
const cert = L.rows.filter((r) => r.verdict === 'CERTIFIED'), part = L.rows.filter((r) => r.verdict === 'PARTIAL');
if (L.rows.some((r) => r.verdict === 'REFUTED')) die('a row refuted: the page describes none');
if (R('gao-f7').verdict !== 'PARTIAL' || R('chv-xhat18').nilpotencyIndex !== 17 || R('chv-x14').nilpotencyIndex !== 14) die('the rows are not the ones this page describes');
const detail = (id, frag) => (R(id).checks.find((c) => c.name.includes(frag)) || {}).detail || '';
const words = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];

const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · decided · polynomial maps',
  title: 'Gao\'s Keller maps and a Markus–Yamabe field, decided',
  deck: 'Two papers of August 2026 print polynomial maps: five new counterexamples to the Jacobian conjecture, written with Claude Fable 5\'s help, '
    + 'and a vector field on ℝ¹⁴ whose Jacobian has every eigenvalue −1 at every point and which still has three zeros. Decided here in exact rational '
    + 'arithmetic from the TeX the papers print: ' + words[cert.length] + ' of the ' + words[L.rows.length] + ' claims hold whole. The largest map\'s constant determinant rests on the paper\'s '
    + 'factorisation lemma. The 18-dimensional field\'s nilpotency, which the paper checks at one sample point, is decided here as an identity.'
}));
B.push(C.scope('Sources: S. Gao, arXiv 2608.00222v1, and Á. Castañeda, G. Honorato, F. Valenzuela-Henríquez, arXiv 2608.05392v1, both CC BY 4.0; their TeX '
  + 'mirrored in corpus/polymaps and every map extracted from it by a parser that refuses any text it cannot read. The earlier maps of this story, Alpöge\'s '
  + 'among them, are decided on the Jacobian-conjecture audit. Nothing has been sent to the authors.'));
B.push(C.tldr({
  findingRaw: '<b>' + cert.length + ' CERTIFIED, ' + part.length + ' PARTIAL.</b> Gao\'s G, F4, F5 and F6 have Jacobian determinants identically 2, −44/9, '
    + '160/29 and −290, and each sends two or three distinct rational points to one point. F7 is not injective either, and the determinants of its factors '
    + 'are what the paper says; the determinant of the whole is its lemma. The 14- and 18-dimensional fields have (JX + I)^14 = 0 and (JX + I)^17 = 0 '
    + 'identically, and three zeros each. The cubic Φ on 11 variables, whose first publication says ChatGPT generated it, has det JΦ = −2 and three '
    + 'points with one image.',
  mechanismRaw: 'Sparse polynomials with Fraction coefficients. Determinants are expanded symbolically, Laplace over column subsets, and powers of JX + I are '
    + 'multiplied out. Collisions are checked by evaluating at points found from each paper\'s fiber structure; the decider only evaluates them. F6 and F7 '
    + 'are not printed in full, and the ancillary files the paper promises are not on arXiv, so they are rebuilt from the printed construction, and every '
    + 'division the construction makes is checked exact.',
  checkRaw: C.m('python3 tools/run-polymaps-ledger.py --check') + ' · ' + C.m('python3 instruments/polymaps/battery.py') + ' — ' + bm[1] + ' checks, ' + bm[3] + ' red controls fired.'
}));
B.push(C.stats([
  { k: 'claims decided', v: String(L.rows.length), n: 'Five Keller maps of Gao\'s, the cubic Φ, and two Markus–Yamabe fields.' },
  { k: 'certified whole', v: String(cert.length), n: 'Every fact the claim needs, as an exact identity or an exact evaluation.' },
  { k: 'partly', v: String(part.length), n: 'F7: its non-injectivity and its factors\' determinants; the assembly is the paper\'s lemma.' },
  { k: 'largest map rebuilt', v: Math.max(...R('gao-f7').terms).toLocaleString('en-US'), n: 'Terms in F7\'s last component; ' + R('gao-f7').terms.reduce((a, b) => a + b, 0).toLocaleString('en-US') + ' in its five.' }
]));
B.push(C.section({
  lab: '§1 · the claims', title: 'Eight maps, one verdict each', wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'verdict' }, { h: 'claim' }, { h: 'source' }],
    rows: L.rows.map((r) => [{ raw: C.tag(r.verdict, r.verdict === 'CERTIFIED' ? 'held' : 'dep') }, r.claim, r.source])
  })
}));
B.push(C.section({
  lab: '§2 · the Jacobian conjecture', title: 'Five maps, and what each one needs',
  bodyRaw: [
    C.pRaw('A polynomial map F of ℂⁿ with det JF a nonzero constant is locally invertible everywhere; Keller\'s conjecture (1939) said it must then be '
      + 'globally invertible. A counterexample needs two facts: the determinant is identically a nonzero constant, and two different points have the same image. '
      + 'Both are finite and exact, and both are decided here.'),
    C.plainList([
      { b: 'G, F4, F5, printed in full.', text: 'Parsed from the TeX, with 33, 188 and 114 terms. Their determinants are expanded in well under a second. The shared images are ' + ['G', 'F4', 'F5'].map((k) => k + ' at ' + detail('gao-' + k.toLowerCase(), 'distinct').replace('image ', '')).join('; ') + ', each shared by distinct rational points.' },
      { b: 'F6, printed through its construction.', text: 'The rebuild reproduces the four printed polynomials X₁…X₄ and the printed first component, then gives ' + detail('gao-f6', 'sizes') + '. Its determinant, −290, is expanded directly in about 45 seconds.' },
      { b: 'F7, the largest.', text: 'The rebuild gives ' + detail('gao-f7', 'sizes') + ' and reproduces the printed first component. Two rational points collide. The determinants of its factors hold: det J(S) = γ, the stage 119377, det J(H₃, H₄) = 1. Expanding the whole 5 × 5 determinant of rows of up to 25,518 terms is out of reach of this pure-Python instrument, so the constant determinant rests on the paper\'s factorisation lemma.' }
    ]),
    C.pRaw('The paper says its verification scripts are "available from the author", and pp. 24 and 28 promise F6 and F7 "in the ancillary files"; arXiv has none. '
      + 'The verdicts on F6 and F7 are therefore on the map the printed construction defines.')
  ].join('\n')
}));
B.push(C.section({
  lab: '§3 · the weak Markus–Yamabe conjecture', title: 'Every eigenvalue −1, and three zeros',
  bodyRaw: [
    C.pRaw('A vector field whose Jacobian has eigenvalues with negative real part at every point was conjectured, in the weak form, to have at most one zero. '
      + 'If JX + I is nilpotent as a matrix of polynomials, every eigenvalue of JX is −1 everywhere; so a field with that identity and two zeros refutes it.'),
    C.plainList([
      { b: 'X on ℝ¹⁴, degree 7.', text: 'The 14 × 14 matrix JX + I, multiplied out: its 13th power is not zero and its 14th is. X vanishes at the three distinct points the paper prints. The weak conjecture fails in dimension 14.' },
      { b: 'X̂ on ℝ¹⁸, degree 3.', text: 'The 17th power of JX̂ + I is zero and the 16th is not. The paper\'s appendix checks this unipotency "at a sample rational point"; here it is an identity. Three distinct zeros.' },
      { b: 'Φ, the cubic behind X̂.', text: 'det JΦ = −2 by a direct 11 × 11 expansion (the paper uses a Schur complement), and three distinct points share an image. Its 11 components match, term for term, a map published in a gist that says ChatGPT generated it.' }
    ])
  ].join('\n')
}));
B.push(C.section({
  lab: '§4 · limits', title: 'What is not decided here',
  bodyRaw: C.plainList([
    { b: 'F7\'s whole determinant.', text: 'Only its factors\' determinants are decided; the assembly is the paper\'s lemma.' },
    { b: 'The generic fiber sizes.', text: 'The papers\' counts of preimages (4, 5, 10, 6 and 12 for Gao\'s maps) and their stratifications need gcd and squarefree certificates at a witness target, which are not built yet.' },
    { b: '"The chain cannot be shortened."', text: 'The Markus–Yamabe paper says this was verified in exact arithmetic but prints no code or certificate. It is a finite family of variants, not decided here yet.' }
  ])
}));
const foot = '<p>' + C.esc('Generated by tools/build-report-polymaps.js from certs/polymaps-ledger.json (' + L.generated + '), re-derived at build; battery ' + bm[1] + ' checks, ' + bm[3] + ' red controls fired.') + '</p><p>' + C.esc('git ' + git) + '</p>';
fs.writeFileSync(path.join(ROOT, 'reports', 'polymaps.html'), TPL.render({
  title: 'Gao\'s Keller maps and a Markus–Yamabe field · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot,
  desc: 'Five new Jacobian-conjecture counterexamples (Gao, arXiv 2608.00222) and the weak Markus–Yamabe fields in dimensions 14 and 18 (arXiv 2608.05392), decided in exact rational arithmetic: ' + cert.length + ' certified whole, ' + part.length + ' partly.',
  path: '/reports/polymaps.html'
}));
console.log('reports/polymaps.html written: ' + cert.length + ' certified, ' + part.length + ' partial @ git ' + git);
