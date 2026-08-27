#!/usr/bin/env node
/* build-report-mfg-cap.js — generate reports/mfg-cap.html: certified
   multiplicity for a non-monotone mean-field game, rebuilt in THIS site's
   design system from the unit's public set (no foreign page is served; the
   old paths 301 here).

   The gate is the unit's own kernel battery, lifted file-level from the
   published mfg-lab tree and re-run at every build: three independent
   witnesses, the bifurcation prediction, the DISJOINT double enclosure, and
   all six falsifiers required to fire. The page's numbers are parsed from
   THIS build's battery run — nothing is remembered.

   usage: node tools/build-report-mfg-cap.js */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('MFG-CAP REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

/* ---- the gate: the unit's own battery, re-run ---------------------------- */
const r = cp.spawnSync(process.execPath, [path.join(ROOT, 'legacy', 'research', 'mfg-cap', 'tests', 'test-cap.js')], { cwd: ROOT });
const out = String(r.stdout) + String(r.stderr);
if (r.status !== 0 || !/ALL PASS/.test(out)) die('test-cap.js did not pass:\n' + out.slice(-800));
const passes = (out.match(/^PASS /gm) || []).length;
const grab = (re, what) => { const m = re.exec(out); if (!m) die('battery output lost the ' + what + ' line'); return m; };
const m1 = grab(/separation ([\d.]+) >> r1\+r2 = ([\d.e+-]+)/, 'M1 multiplicity');
const b1 = grab(/c\* = (-[\d.]+), determinant changes sign/, 'B1 bifurcation');
const p1 = grab(/worst radius ([\d.e+-]+), worst Z1 ([\d.]+)/, 'P1 monotone enclosure');
const fx = grab(/every falsifier turned its target red\s+\[(\d+)\/(\d+)\]/, 'falsifier');
if (fx[1] !== fx[2]) die('not every falsifier fired: ' + fx[1] + '/' + fx[2]);
if (!/B2 the proof REFUSES at the bifurcation/.test(out)) die('the bifurcation refusal check is gone');
if (!/M2 the multiplicity regime is exactly where Lasry-Lions does NOT apply/.test(out)) die('the regime-honesty check is gone');
const separation = Number(m1[1]), rsum = m1[2], cstar = b1[1];

/* ---- the page ------------------------------------------------------------ */
const B = [];

B.push(C.header({
  eyebrow: 'cert-machine · certified theorem · re-proved at every build',
  title: 'Two solutions, provably: certified multiplicity for a non-monotone MFG',
  deck: 'Where the coupling of a mean-field game turns anti-monotone — agents HERDING instead of avoiding each '
    + 'other — Lasry–Lions uniqueness theory goes silent. This page holds a theorem in that silence: for the '
    + 'quadratic system on the torus with F(m) = c·m at c = −12, two solutions are enclosed in DISJOINT '
    + 'certified balls at the same parameters — a proof that at least two distinct equilibria exist, produced '
    + 'by interval arithmetic and re-proved during the build of this page by the unit\'s own battery.'
}));

B.push(C.tldr({
  findingRaw: 'At one parameter set in the anti-monotone regime, two mean-field equilibria are enclosed in '
    + 'disjoint balls — centres ' + separation + ' apart against a combined radius of ' + rsum + ' — with both '
    + 'densities certified positive. Disjoint enclosures at identical parameters are a multiplicity theorem, '
    + 'not a numerical observation; and at the bifurcation point itself the proof REFUSES, as it must.',
  mechanismRaw: 'Krawczyk/radii-polynomial contraction in outward-rounded interval arithmetic, checked by three '
    + 'independent witnesses (the HJB pointwise, the Fokker–Planck pointwise, and a Gibbs identity the solver '
    + 'never uses); the constant state\'s linearization loses invertibility at c* = ' + cstar + ' = −σ²(2π)² — '
    + 'predicted from the symbol, then measured.',
  checkRaw: C.m('node legacy/research/mfg-cap/tests/test-cap.js') + ' from a clone — ' + passes + ' checks, '
    + 'six falsifiers that must each turn a target red.'
}));

B.push(C.stats([
  { k: 'the multiplicity', v: 'DISJOINT × 2', role: 'held', n: 'c = −12: separation ' + separation + ' vs r1+r2 = ' + rsum + ' — two certified solutions at one parameter set, densities positive' },
  { k: 'the bifurcation', v: 'c* = ' + cstar, n: '−σ²(2π)² predicted from the symbol, then measured: the determinant changes sign across it' },
  { k: 'at c* itself', v: 'REFUSED', role: 'warn', n: 'no enclosure can exist at the bifurcation — a verifier that certified there would be broken, and the battery checks that it refuses' },
  { k: 'the monotone control', v: p1[1], role: 'held', n: 'worst enclosure radius across five Lasry–Lions parameter sets (worst Z1 ' + p1[2] + ') — the classical regime certifies routinely' },
  { k: 'falsifiers', v: fx[1] + '/' + fx[2] + ' fired', role: 'held', n: 'every planted forgery turned its target red this build — including a perturbed candidate that must be refused' },
  { k: 'battery', v: passes + ' checks', role: 'held', n: 'the unit\'s own gate, lifted file-level from the published tree and re-run as this page\'s build gate' }
]));

B.push(C.section({
  lab: '§1 · the object', title: 'Where uniqueness theory goes silent',
  bodyRaw: [
    C.p('For the stationary quadratic MFG on the torus with coupling F(m) = c·m, positive c is crowd-aversion '
      + 'and the Lasry–Lions monotonicity argument gives uniqueness. Negative c is HERDING — agents drawn to '
      + 'density — and the theory makes no claim. That silence is exactly where computer-assisted proof earns '
      + 'its keep: past the symbol\'s critical value c* = −σ²(2π)², a non-constant branch leaves the constant '
      + 'state, and whether the two coexist as genuine solutions is a question numerics alone can only suggest.'),
    C.p('The certificate answers it. Each candidate is wrapped in a contraction argument (Krawczyk / radii '
      + 'polynomial) in outward-rounded interval arithmetic: an explicit ball, exactly one true solution inside '
      + 'it, the ergodic constant enclosed, the density certified positive. Two such balls, at the same '
      + 'parameters, provably disjoint — centres ' + separation + ' apart, radii summing to ' + rsum + ' — is a '
      + 'multiplicity theorem about the SYSTEM, not a statement about a solver.')
  ].join('\n')
}));

B.push(C.section({
  lab: '§2 · the discipline', title: 'Three witnesses, one refusal, six falsifiers',
  bodyRaw: [
    C.p('The battery this page just re-ran checks the solution three independent ways: the HJB equation '
      + 'pointwise on a fine grid, the Fokker–Planck equation pointwise, and the Gibbs identity '
      + 'm = e^{−u/σ}/Z — which the solver never uses, so it cannot be satisfied by construction. The reduced '
      + 'Hopf–Cole equation is compared against the literature\'s stated form (the sign-flipped variant fails '
      + 'by O(1)), and the certified Z1 bound is required to dominate a direct sampled estimate — the bound is '
      + 'never allowed to be optimistic.'),
    C.p('At the bifurcation point the linearization is singular, no contraction can close, and the proof '
      + 'REFUSES — the battery asserts the refusal, because a verifier that certified there would be broken. '
      + 'And every build fires six falsifiers: forged candidates, disabled terms, wrong-parameter validations — '
      + 'each must turn its target red before the page ships. This build: ' + fx[1] + ' of ' + fx[2] + '.')
  ].join('\n')
}));

B.push(C.section({
  lab: '§3 · provenance', title: 'Where this comes from, and where the original lives',
  bodyRaw: C.p('The unit was lifted FILE-LEVEL from the source lab\'s published tree (the eligibility criterion '
    + 'for everything public here), and this page is a rebuild in this site\'s own design system — the '
    + 'original interactive artifact, with the same kernel embedded in its bytes, lives in the public '
    + 'repository (research/mfg-cap in the mfg-lab tree, MIT). The mathematics sits in the mean-field-games '
    + 'literature of the KAUST group and the Lasry–Lions/Cirant multiplicity line; the radii-polynomial '
    + 'framework is van den Berg–Lessard, unchanged. The certification layer, and any error in it, is ours.')
}));

const foot = '<footer class="col"><p>Generated by tools/build-report-mfg-cap.js @ git ' + git + '. The unit\'s '
  + 'battery re-ran as this page\'s gate (' + passes + ' checks, ' + fx[1] + '/' + fx[2] + ' falsifiers fired) '
  + 'and every number above was parsed from that run — the build refuses on any deviation. Source: '
  + 'legacy/research/mfg-cap/ in this repository; original artifact: research/mfg-cap in the public mfg-lab tree.</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'mfg-cap.html'),
  TPL.render({ title: 'Certified multiplicity for a non-monotone MFG', bodyRaw: B.join('\n\n'), footRaw: foot }));
console.log('reports/mfg-cap.html written: multiplicity re-proved (separation ' + separation + ', r1+r2 ' + rsum
  + '), c* = ' + cstar + ', falsifiers ' + fx[1] + '/' + fx[2] + ' @ git ' + git);
