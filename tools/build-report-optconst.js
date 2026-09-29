#!/usr/bin/env node
/* build-report-optconst.js — reports/optimization-constants.html: the optimization-constants registry's
   asterisked bounds, decided. Every number comes from certs/sumdiff-ledger.json (tools/run-sumdiff-ledger.js),
   which is re-derived here (--check) before a word is written, and the battery's own count of red controls.

   usage: node tools/build-report-optconst.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('OPTCONST REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const run = (args) => cp.execFileSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8' });

try { run(['tools/run-sumdiff-ledger.js', '--check']); } catch (e) { die('the ledger does not re-derive: ' + (e.stdout || e.message)); }
const bat = run(['instruments/sumdiff/battery.js']);
const bm = /sumdiff battery: (\d+) pass, 0 fail, (\d+)\/(\d+) red controls fired/.exec(bat);
if (!bm || bm[2] !== bm[3]) die('the battery did not pass whole: ' + bat.trim().split('\n').pop());
let py = null; try { py = cp.execFileSync('python3', ['tools/verify_sumdiff.py'], { cwd: ROOT, encoding: 'utf8' }); } catch (e) { die('tools/verify_sumdiff.py did not pass: ' + (e.stdout || e.message)); }
const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'sumdiff-ledger.json'), 'utf8'));
let fb = ''; try { cp.execFileSync('python3', ['tools/run-fei-ledger.py', '--check'], { cwd: ROOT, encoding: 'utf8' }); fb = cp.execFileSync('python3', ['instruments/fei/battery.py'], { cwd: ROOT, encoding: 'utf8' }); } catch (e) { die('the C71 ledger or battery did not pass: ' + (e.stdout || e.message)); }
const fm = /fei battery: (\d+) pass, 0 fail, (\d+)\/(\d+) red controls fired/.exec(fb);
if (!fm || fm[2] !== fm[3]) die('the C71 battery did not pass whole');
const FE = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'fei-ledger.json'), 'utf8')).rows[0];
if (FE.verdict !== 'CERTIFIED') die('C71 is not certified');
let sb = ''; try { cp.execFileSync('python3', ['tools/run-sumproduct-ledger.py', '--check'], { cwd: ROOT, encoding: 'utf8' }); sb = cp.execFileSync('python3', ['instruments/sumproduct/battery.py'], { cwd: ROOT, encoding: 'utf8' }); } catch (e) { die('the C84b ledger or battery did not pass: ' + (e.stdout || e.message)); }
const sm = /sumproduct battery: (\d+) pass, 0 fail, (\d+)\/(\d+) red controls fired/.exec(sb);
if (!sm || sm[2] !== sm[3]) die('the C84b battery did not pass whole');
const SP = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'sumproduct-ledger.json'), 'utf8')).rows[0];
if (SP.verdict !== 'REPAIRED') die('C84b is not the repaired row this page describes');
const reg = L.rows.filter((r) => r.registry), sup = L.rows.filter((r) => !r.registry);
if (reg.length !== 2 || reg.some((r) => r.verdict !== 'CERTIFIED')) die('the two registry rows are not both certified');
if ((py.match(/^CERTIFIED/gm) || []).length !== 4 || !/fired\s+RED control/.test(py)) die('the stdlib verifier does not agree');
const R = (id) => L.rows.find((r) => r.id === id), A = (claim) => L.also.find((a) => a.claim === claim);
const falseClaim = L.also.find((a) => /FALSE/.test(a.what));
const shortRho = (r, k) => r.rho[0].slice(0, k) + '…';

const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · the registry\'s asterisks',
  title: 'Four asterisks, replayed',
  deck: 'The optimization-constants registry marks a bound with an asterisk when its verification is "at minimal levels". Four of its '
    + 'bounds rest on arithmetic small enough to decide exactly. Three hold as printed — two entropy laws and one Boolean function on 18 variables. '
    + 'The fourth, an upper bound on the sum–product exponent, quotes a constant its own source calls only "suggested", and the source\'s calculation '
    + 'cannot reach it; what that source proves holds. One of the checkers published with the entropy laws would also have accepted a false bound.'
}));
B.push(C.scope('Decided: that the law each cited certificate writes down gives the ratio the registry prints — a lower bound on the constant, '
  + 'never its value. Not decided: the upper bounds, the constants themselves, and the registry\'s other asterisked rows. The asterisk is the '
  + 'maintainers\' to keep or remove; this page is evidence, and nothing has been sent to them.'));
B.push(C.tldr({
  findingRaw: '<b>Three hold as printed; one is repaired.</b> C71 &gt; 6.521845710923046575 is CERTIFIED from its truth table (§3); C84b &le; 1.999281 holds only as '
    + '1.9993, what its source proves (§4). And C3b &ge; ' + R('3b').claim.split('>= ')[1] + ' and C3c &ge; ' + R('3c').claim.split('>= ')[1] + ' are CERTIFIED from the '
    + 'certificates the registry cites: the ratios are ' + C.m(shortRho(R('3b'), 24)) + ' and ' + C.m(shortRho(R('3c'), 24)) + ', each enclosed to 40 digits. '
    + 'The 147-point certificate\'s own 60-digit bound holds, so does the 95-point bound it superseded, and the improvement the registry prints, '
    + '2.06 &times; 10<sup>&minus;11</sup>, is the rounding of the certified gap. <b>And the checker published with the 147-point certificate prints OK for '
    + C.m('C3c >= ' + falseClaim.claim) + ', which is false</b>: it encloses the ratio at 100 digits, then compares in doubles.',
  mechanismRaw: 'A law on Z&sup2; with rational weights gives C &ge; H(X&minus;Y) / max of the entropies of the other forms. The pushforwards are exact; each '
    + 'entropy term is an interval whose logarithm is rounded outward. Two implementations share no code with each other or with the claimants: '
    + 'instruments/sumdiff (JavaScript, BigInt and dyadic intervals at 128–1024 bits) and tools/verify_sumdiff.py (the Python standard library, '
    + 'decimal at 120 digits).',
  checkRaw: C.m('python3 tools/verify_sumdiff.py') + ' — standard library only, four CERTIFIED and one red control. '
    + C.m('node instruments/sumdiff/battery.js') + ' — ' + bm[1] + ' checks, ' + bm[3] + ' red controls.'
}));
B.push(C.stats([
  { k: 'asterisked bounds decided', v: String(reg.length + 2), n: 'C3b, C3c and C71 CERTIFIED; C84b REPAIRED. The registry\'s table is pinned at commit ' + L.registry.commit.slice(0, 8) + '.' },
  { k: 'digits of each ratio', v: '40', n: 'Enclosed, not estimated; the 60-digit bound the 147-point certificate prints is decided at ' + A('1.674733895041405870063135756722213999136383713818148696811828').bits + ' bits.' },
  { k: 'implementations', v: '2', n: 'JavaScript over BigInt and dyadic intervals; Python over the standard library. They agree to every digit shown.' },
  { k: 'false bounds the checker accepts', v: String(L.observed.runs.filter((r) => /REFUTED/.test(r.truth)).length), n: 'Observed, run on the pinned script: its last comparison is at 53 bits. Both are refuted here.' }
]));
B.push(C.section({
  lab: '§1 · the claims', title: 'What the registry prints, and what the certificates give', wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'claim' }, { h: 'by' }, { h: 'certificate' }, { h: 'verdict' }, { h: 'the ratio, enclosed' }],
    rows: L.rows.map((r) => [
      { raw: C.esc(r.claim) + (r.registry ? ' <span title="the registry marks it unverified">*</span>' : ' <span class="n">(superseded)</span>') },
      { raw: C.esc(r.claimant) },
      { raw: C.esc(r.certificate.points + ' points, denominator of ' + r.certificate.denominatorDigits + ' digits') + '<br><span class="mono">' + C.esc(r.certificate.sha256.slice(0, 12)) + '…</span>' },
      { raw: C.tag(r.verdict, 'held') },
      { raw: '<span class="mono">' + C.esc(r.rho[0].slice(0, 42)) + '<br>' + C.esc(r.rho[1].slice(0, 42)) + '</span>' }
    ])
  }) + C.pRaw('Also decided from the same certificates: the 13-point certificate\'s printed "true value" ' + C.m(A('1.778988841420693549').claim) + ' is a truncation of the ratio '
    + '(it is CERTIFIED and the next value up is REFUTED); the 95-point certificate\'s 39-digit bound and the 147-point certificate\'s 60-digit bound are CERTIFIED; '
    + 'the 147-point ratio exceeds the 95-point one by ' + C.m(Number(L.improvement.enclosure[0]).toExponential(6).replace('e-', ' × 10^-') + '…') + ', which rounds to the 2.06 &times; 10<sup>&minus;11</sup> the registry prints.')
}));
B.push(C.section({
  lab: '§2 · the checker', title: 'What a checker\'s last line proves',
  bodyRaw: [
    C.pRaw('The 147-point certificate ships a checker (check_cert.py, pinned here by sha256 and not copied). It computes the ratio in interval '
      + 'arithmetic at 100 digits, which is right, and then decides the claim with ' + C.m('mpmath.mpf(verified) >= mpmath.mpf(claimed)') + ' in mpmath\'s default '
      + 'context — 53 bits, a double. Every decimal within a double of the true bound compares equal to it. Run on the pinned script with claims written here:'),
    C.table({
      cols: [{ h: 'claimed' }, { h: 'the checker printed' }, { h: 'decided here' }],
      rows: L.observed.runs.map((r) => [{ raw: '<span class="mono">' + C.esc(r.claimed) + '</span>' }, { raw: C.esc(r.printed) }, { raw: C.esc(r.truth) }])
    }),
    C.pRaw('The bound the registry prints is true, and it is decided above without that checker. The point is the checker: ' + C.m('C3c >= 1.6747338950414059') + ' is false '
      + 'at the seventeenth significant digit, is the same double as the true 60-digit bound, and prints OK. A verifier\'s last comparison has to be as exact as its '
      + 'enclosure, or the enclosure proves nothing the output line says. The Mosaic Intelligence checkers set the working precision to 80 digits before comparing '
      + 'and do not have this weakness. And one of our own two implementations had its mirror image while this page was built: Python\'s unary minus on a Decimal '
      + 'rounds to the default context\'s 28 digits, which moved the first draft\'s ratio at the 28th digit until the two implementations were compared.')
  ].join('\n')
}));
B.push(C.section({
  lab: '§3 · the third asterisk', title: 'C71: a Boolean function on 18 variables',
  bodyRaw: [
    C.pRaw('The Fourier entropy–influence constant is the least C with H[f] ≤ C·I[f] for every Boolean f, where H is the entropy of the Fourier weights (base 2) and '
      + 'I the total influence. For a balanced g the amplification rule of O\'Donnell–Tan (2013) and Hod (2017, Prop. 1.2), cited and not re-proved here, gives '
      + 'C71 ≥ H[g]/(I[g] − 1). The registry\'s asterisked ' + C.m('C71 > 6.521845710923046575') + ' cites a truth table on 18 variables published by ' + C.esc(FE.claimant) + '.'),
    C.plainList([
      { b: 'Decided.', text: 'The table read from its hex and bound by its published sha256; the integer Walsh–Hadamard transform of all 262,144 entries; balance, Parseval, I = ' + FE.I + ' exactly; H from ' + FE.distinctWeights + ' distinct weight sizes over ' + FE.nonzero.toLocaleString('en-US') + ' nonzero coefficients, each logarithm in an outward-rounded Decimal interval. The ratio is ' + FE.ratio[0].slice(0, 30) + '…, above the registry\'s number, and above the record it replaced. The function is also logic-monotone, as claimed.' },
      { b: 'Not decided.', text: 'The amplification rule itself, which is a published theorem; the claimant\'s checker (mpmath intervals), pinned and not run.' }
    ])
  ].join('\n')
}));
B.push(C.section({
  lab: '§4 · the fourth asterisk', title: 'C84b: a suggested constant, quoted as a bound',
  bodyRaw: [
    C.pRaw('The registry\'s asterisked row for the real sum–product exponent reads ' + C.m('C84b ≤ 1.999281') + ': "a ChatGPT 5.5 long-thinking optimization of the explicit '
      + 'constant of [BSSZ2026, §5] giving c ≥ 0.000719. Unverified." The note it cites states its theorem with 0.0007 and adds: "The optimized value suggested by '
      + 'the same calculation is about 0.000719, but 0.0007 is the safer quoted constant."'),
    C.plainList([
      { b: 'What the note proves holds.', text: 'Its chain, decided in intervals: the regulator estimate at s = 1.371966384 is ' + (SP.checks[0].detail || '').slice(1, 13) + '… ≤ 103; at Y = 1415 and X = ⌊e¹⁴²³⌋ the product factor 515/Y < 0.364, the additive factor ' + (SP.checks[2].detail || '') + '… < 0.136, log|A|/d < 1432, and −log 0.364 > 0.0007 · 1432. So C84b ≤ 1.9993, given BSSZ2026 §5, the note\'s lattice-doubling lemma and the regulator bound.' },
      { b: 'What the registry quotes is out of its reach.', text: 'For every s > 1 and every X and Y the same chain gives c ≤ ' + SP.ceiling + ': the regulator estimate is at least 101.9 for every s (a sweep of s with ζ by Euler–Maclaurin and Γ by Stirling, each with its remainder), the additive factor forces log X > Y + log M₁ − 2 log Y, and the product factor caps the gain at log(Y/5R). 0.000719 is not reached; at the note\'s own choice the chain gives ' + SP.cAtNoteChoice[0] + '…' },
      { b: 'Verdict: REPAIRED.', text: 'The row holds as C84b ≤ 1.9993, which is what its source proves.' }
    ])
  ].join('\n')
}));
B.push(C.section({
  lab: '§5 · how', title: 'How it is decided',
  bodyRaw: C.plainList([
    { b: 'The formulation.', text: 'The registry states both constants in their entropy form (Green–Ruzsa 2019): C3b is the least C with H(X−Y) ≤ C·max(H(X), H(Y), H(X+Y)); C3c adds H(X+2Y) to the maximum. One law gives a lower bound.' },
    { b: 'The door.', text: 'Weights must be positive integers over the common denominator and sum to it exactly; a point may not repeat. The 320-digit numerators are read as integers — a reader that parses them as doubles is refused, a red control.' },
    { b: 'The arithmetic.', text: 'Pushforwards exact; each −p ln p an interval; the maximum taken end by end; the ratio by interval division; precision doubled from 128 bits while a verdict straddles. An exact equality is refused at every precision, never certified.' },
    { b: 'The pins.', text: 'The registry at commit ' + L.registry.commit.slice(0, 8) + ' (Apache-2.0), the Zenodo archive (CC BY 4.0) with its own manifest checked, the gist at revision ' + L.rows.find((r) => r.id === '3c').source.split('@ ')[1].slice(0, 8) + '. corpus/optimization-constants/meta.json holds every sha256.' }
  ])
}));
const foot = '<p>' + C.esc('Generated by tools/build-report-optconst.js from certs/sumdiff-ledger.json (' + L.generated + '), re-derived at build; battery ' + bm[1] + ' checks, ' + bm[3] + ' red controls; tools/verify_sumdiff.py re-run at build; certs/fei-ledger.json and certs/sumproduct-ledger.json re-derived, their batteries ' + fm[1] + ' + ' + sm[1] + ' checks, ' + fm[3] + ' + ' + sm[3] + ' red controls.') + '</p><p>' + C.esc('git ' + git) + '</p>';
fs.writeFileSync(path.join(ROOT, 'reports', 'optimization-constants.html'), TPL.render({
  title: 'Four asterisks, replayed · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot,
  desc: 'The optimization-constants registry\'s asterisked bounds C3b >= 1.77898884, C3c >= 1.6747338950414058 and C71 > 6.521845710923046575 hold as printed; C84b <= 1.999281 quotes a constant its source only suggests and cannot reach, and holds as 1.9993 — and the checker published with C3c prints OK for a false bound.',
  path: '/reports/optimization-constants.html'
}));
console.log('reports/optimization-constants.html written: ' + reg.length + ' asterisked bounds CERTIFIED, battery ' + bm[1] + '/' + bm[3] + ' reds @ git ' + git);
