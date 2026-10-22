#!/usr/bin/env node
/* build-report-lueker.js — reports/chvatal-sankoff.html: the optimization-constants registry's two asterisked C_31 rows
   (γ₂ ≤ 0.825101 at h = 9, ≤ 0.824120 at h = 10; Lueker's 2009 method run two steps past his paper by L. Jack), replayed
   with an automaton rebuilt from Lueker's paper alone. Every number comes from certs/lueker-replay.json
   (tools/run-lueker.py), which is re-checked here (--check: the reference re-run at h ≤ 4, every decision re-derived from the
   record's own hex values, the pins) before a word is written.

   usage: node tools/build-report-lueker.js                                                                           MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('LUEKER PAGE REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const sha = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');
const GH = 'https://github.com/carlostoledo1891/cert-machine';

let chk = '';
try { chk = cp.execFileSync('python3', ['-I', 'tools/run-lueker.py', '--check'], { cwd: ROOT, encoding: 'utf8' }); } catch (e) { die('the record does not re-check: ' + (e.stdout || e.message)); }
const cm = /lueker replay: (\d+) checks, 0 fail, (\d+)\/(\d+) red controls fired/.exec(chk);
if (!cm || cm[2] !== cm[3]) die('the check did not pass whole: ' + chk.trim());
const R = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'lueker-replay.json'), 'utf8'));
if (!R.rows.length) die('no rows decided');
if (R.calibration.some((c) => !c.reproduced)) die('a calibration row does not reproduce Lueker');
const H8 = R.calibration.find((c) => c.h === 8); if (!H8 || !H8.acceptedAgrees) die('the h = 8 transition count does not agree with the claimant');

const m = (s) => '<span class="m">' + C.esc(s) + '</span>';
const short = (h) => String(h).slice(0, 12) + '…';
const num = (n) => Number(n).toLocaleString('en-US');
const secs = (s) => (s === null || s === undefined ? '—' : s < 90 ? Math.round(s * 10) / 10 + ' s' : s < 5400 ? Math.round(s / 6) / 10 + ' min' : Math.round(s / 360) / 10 + ' h');
const gib = (b) => (b >= 1 << 30 ? Math.round(b / (1 << 30) * 10) / 10 + ' GB' : Math.round(b / (1 << 20)) + ' MB');
const dec = (hex, k) => Number(parseFloat(hexToNum(hex))).toFixed(k);
function hexToNum(h) { /* 0x1.abcp-2 → number */ const mm = /^(-?)0x([0-9a-f]+)(?:\.([0-9a-f]*))?p([+-]?\d+)$/i.exec(h); if (!mm) die('bad hex ' + h); const int = parseInt(mm[2], 16); let frac = 0; const f = mm[3] || ''; for (let i = 0; i < f.length; i++) frac += parseInt(f[i], 16) / Math.pow(16, i + 1); return (mm[1] ? -1 : 1) * (int + frac) * Math.pow(2, parseInt(mm[4], 10)); }
const words = R.rows.map((r) => r.verdict);
const allCert = words.every((w) => w === 'CERTIFIED');
const row10 = R.rows.find((r) => r.h === 10), row9 = R.rows.find((r) => r.h === 9);
const machine = R.machine.model ? R.machine.model + ', ' + Math.round(R.machine.memoryBytes / (1 << 30)) + ' GB' : R.machine.platform;
const pr = R.sources.pr;

const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · the registry\'s asterisks',
  title: 'Two asterisks on the Chvátal–Sankoff constant, replayed',
  deck: 'On 2026-10-18 the optimization-constants registry merged PR #' + pr.number + ': Lueker\'s 2009 upper-bound method for the binary Chvátal–Sankoff constant, '
    + 'run two history lengths past his paper, giving γ₂ ≤ ' + (row9 ? row9.printed : '0.825101') + ' at h = 9 and γ₂ ≤ ' + (row10 ? row10.printed : '0.824120') + ' at h = 10, below the 0.826280 that had stood since 2009. '
    + 'Both rows carry the registry\'s asterisk: every check so far was the claimant\'s own. Here the automaton is rebuilt from Lueker\'s paper and nothing else, '
    + 'in two implementations, calibrated on his own table, run with witness vectors of our own, and the printed bounds decided.'
}));
B.push(C.scope('Published, not peer-reviewed. The claimant\'s code was neither read nor run: the automaton here is written from Lueker\'s Figure 7 and weights from his eq. (36); '
  + 'the claimant\'s commit supplies only the two printed bounds, the two values of z, and the state counts to compare against. Lueker\'s theorem and his proof that '
  + 'the automaton covers Σ* for every h are the paper\'s, peer-reviewed in 2009, and are used, not re-proved. The asterisk itself moves only by a pull request the maintainer merges.'));
B.push(C.tldr({
  findingRaw: '<b>' + (allCert ? 'Both rows CERTIFIED by an independent certificate' : words.join(', ')) + '.</b> '
    + R.rows.map((r) => 'h = ' + r.h + ': ' + num(r.states) + ' states (the claimant\'s ' + num(r.claimantStates) + '), our λ ≤ ' + r.lambdaCertUp + ' against the claimant\'s ' + r.claimant.lambdaDecimal + ', bound γ₂ ≤ ' + r.boundUp + ' against the printed ' + r.printed).join('; ') + '. '
    + 'The construction reproduces Lueker\'s Table II for h = 2..8 exactly — every state count, every λ to his nine digits, every bound to his six — and the h = 8 transition count the claimant publishes.',
  mechanismRaw: 'Lueker\'s Theorem 3.3: if the automaton covers Σ*, z ∈ (0, ½), λ ∈ (0, 1) and a positive vector v satisfies A_z v ≤ λ v, then γ₂ ≤ 2 log(2z)/log λ. '
    + 'Any positive v is a witness, so our own vector serves: λ is the largest ratio (A_z v)_s / v_s, computed with the rounding mode set upward in every thread and once more in round-to-nearest with an explicit inflation; '
    + 'the smallest ratio, rounded downward, is a certified lower bound on the spectral radius, below which no claimant\'s λ can lie.',
  checkRaw: m('python3 tools/run-lueker.py --check') + ' re-runs the reference at h ≤ 4, re-derives every decision from the record\'s own hex values and re-fires the red controls in seconds; '
    + m('python3 tools/run-lueker.py DATA_DIR') + ' rebuilds everything up to h = 8 from nothing (minutes) and re-certifies h = 9 and h = 10 from the stored vectors; '
    + 'the h = 10 table itself is ' + (row10 ? gib(row10.bytes.table) : 'tens of GB') + ' and regenerates deterministically with ' + m('mh build 10') + '.'
}));
B.push(C.stats([
  { k: 'rows decided', v: R.rows.length + ' · ' + Object.entries(R.counts).filter(([, n]) => n).map(([w, n]) => n + ' ' + w).join(', '), n: 'The registry\'s two asterisked C₃₁ rows, PR #' + pr.number + ', merged ' + pr.mergedAt.slice(0, 10) + '.' },
  { k: 'calibration', v: R.calibration.filter((c) => c.reproduced).length + ' of ' + R.calibration.length, n: 'Lueker\'s Table II, h = 2..8: states, λ to nine digits, bounds to six — reproduced from the paper alone.' },
  { k: 'states at h = 10', v: row10 ? num(row10.states) : '—', n: row10 ? 'The claimant\'s count ' + num(row10.claimantStates) + '; ' + num(row10.accepted) + ' accepted transitions.' : 'not yet run' },
  { k: 'reference agreement', v: R.reference.samples.reduce((a, s) => a + s.transitions, 0).toLocaleString('en-US') + ' sampled · 0 mismatches', n: 'Full tables identical at h ≤ 5; ' + R.reference.samples.map((s) => 'h = ' + s.h + ': ' + num(s.states) + ' states').join(', ') + ' re-derived by the Python reference.' },
  { k: 'red controls', v: R.redControlsFired, n: 'Wrong weights, a claim below the certificate, a λ below the spectral radius, z = ½, λ = 1, a zero in v, a short v, the all-ones v.' }
]));

/* §1 the claim */
B.push(C.section({
  lab: '§1 · the claim', title: 'What the registry prints, and what was checked before',
  bodyRaw: C.pRaw('The constant is the limit of E[LCS(x, y)]/n for two uniformly random binary strings of length n. Its value is unknown; simulations put it near 0.812. '
    + 'The best upper bound since 2009 was Lueker\'s 0.826280, from his automaton at history length h = 8. The claimant ran the same method at h = 9 and h = 10 and the registry merged both rows on '
    + C.esc(pr.mergedAt.slice(0, 10)) + ' with an asterisk, the mark it gives a bound replayed by nobody but its author. The claimant\'s own repository (' + C.esc(R.sources.claimantCommit) + ', pinned under '
    + m(R.sources.dir) + ') says what was checked: Lueker\'s unmodified Java agrees with the claimant\'s tables transition for transition at h ≤ 8 and on 200,000 random states at h = 9 and 10; the code reproduces Lueker\'s table; '
    + 'a second implementation of Figure 7, by the claimant in a later pass, re-derived every transition; the λ bound was also computed in a variant that does not depend on the rounding mode. '
    + 'A later commit corrects the README\'s "independent reviewer" to the claimant\'s own review pass, which is also what the e-mail asking for this replay said. What an outside replay adds is one thing only: another person\'s reading of Figure 7 and another arithmetic.')
    + C.table({ cols: [{ h: 'h' }, { h: 'printed bound' }, { h: 'claimant\'s states' }, { h: 'z (the double)' }, { h: 'claimant\'s certified λ' }, { h: 'asterisked at pin' }],
      rows: R.rows.map((r) => [String(r.h), 'γ₂ ≤ ' + r.printed, num(r.claimantStates), r.zDecimal, r.claimant.lambdaDecimal, r.asteriskedAtPin ? 'yes' : 'no']) })
}));

/* §2 the method */
B.push(C.section({
  lab: '§2 · the method', title: 'Lueker\'s theorem, and the automaton read from his figure',
  bodyRaw: C.pRaw('<b>The theorem.</b> ' + C.esc(R.method.theorem) + '. The paper was read in the author\'s extended version (' + C.esc(R.paper.readAs) + '; sha256 ' + m(short(R.paper.sha256)) + '), the journal article being closed and the author\'s page returning 403 since 2015.')
    + C.pRaw('<b>The automaton.</b> A state is (x, y, dx, dy): the last h characters of each string and the last h differences down the last column and along the last row of the dynamic-programming table. '
      + 'An input is a minimal match pair after Lueker\'s truncation μ: for a match character c, (c̄ᵃ c / c) with 0 ≤ a ≤ h−1 or (c / c̄ᵇ c) with 1 ≤ b ≤ h−1, 4h−2 inputs in all. '
      + 'The transition fills the new table entries with lower bounds (Figure 7, lines 7–13), backtracks canonically (lines 14–22) and rejects when the path misses the old corner. '
      + C.esc(R.method.weights) + '. ' + C.esc(R.method.automaton) + '. The reference implementation (' + m('instruments/lueker/mh.py') + ', standard library, exact where it can be) is the specification; '
      + 'the fast one (' + m('instruments/lueker/mh.c') + ') is held to it: identical full tables at h ≤ 5, sampled states re-derived at h = 8, 9 and 10, the complement symmetry checked on every state at h = 4.')
    + C.pRaw('<b>The certificate.</b> ' + C.esc(R.method.certificate) + '. The witness vector comes from power iteration, which only has to make it good; its quality shows in the spread between the largest and smallest ratio.')
}));

/* §3 calibration */
B.push(C.section({
  lab: '§3 · calibration', title: 'Lueker\'s Table II, reproduced from the paper alone',
  bodyRaw: C.pRaw('Before h = 9 and 10 were touched, the construction had to give Lueker\'s own numbers. It does: every orbit count, every λ to the nine digits he prints, every bound to his six. '
    + 'At h = 8 the number of accepted transitions, ' + num(H8.accepted) + ', is the number the claimant publishes for his table, so the two readings of Figure 7 agree transition for transition where both are counted.')
    + C.table({ cols: [{ h: 'h' }, { h: 'states (orbits)' }, { h: 'Lueker' }, { h: 'z' }, { h: 'our λ_cert' }, { h: 'Lueker\'s λ' }, { h: 'our bound ≤' }, { h: 'Lueker\'s' }, { h: 'power iterations' }],
      rows: R.calibration.map((c) => [String(c.h), num(c.states), num(c.luekerStates), dec(c.z, 4), c.lambdaCertUp, c.luekerLambda, c.boundUp, c.luekerBound, String(c.iters)]) })
    + C.pRaw('At h = 2..5 the Python reference also decides λ in exact rational arithmetic from its own vector: ' + R.reference.exact.map((e) => 'h = ' + e.h + ' λ = ' + e.lambdaExact.slice(0, 13) + '…').join(', ') + ', the same digits.')
}));

/* §4 the rows */
B.push(C.section({
  lab: '§4 · the rows', title: 'h = 9 and h = 10, with our own vectors',
  bodyRaw: C.pRaw('Each row: the automaton built here (' + C.esc(machine) + '), a vector from power iteration to a relative spread below 10⁻¹³, the certificate pass under directed rounding at the claimant\'s own z (the exact double nearest the decimal he prints), the bound evaluated outward, and the word.')
    + C.table({ cols: [{ h: 'h' }, { h: 'states' }, { h: 'accepted' }, { h: 'our λ_cert' }, { h: 'λ_free (nearest, inflated)' }, { h: 'ρ lower bound' }, { h: 'claimant\'s λ' }, { h: 'bound ≤' }, { h: 'printed' }, { h: 'verdict' }],
      rows: R.rows.map((r) => [String(r.h), num(r.states), r.accepted === null ? '—' : num(r.accepted), r.lambdaCertDecimal, r.lambdaFreeDecimal, r.rhoLowerDecimal, r.claimant.lambdaDecimal, r.boundUp, r.printed, { raw: '<b>' + C.esc(r.verdict) + '</b>' }]) })
    + C.plainList(R.rows.map((r) => ({ b: 'h = ' + r.h + '.', text: r.why + '. The claimant\'s λ sits ' + r.claimantLambdaMinusOurs + ' ' + (r.claimantLambdaMinusOurs.startsWith('-') ? 'below' : 'above') + ' ours and '
      + (r.claimantLambdaAboveOurLowerBound ? 'above' : 'BELOW') + ' our certified lower bound on the spectral radius: ' + (r.claimantLambdaAboveOurLowerBound ? 'a certificate a positive vector can reach' : 'impossible') + '. '
      + 'Power iteration: ' + r.iters + ' passes, ratio spread ' + (r.powerRatio[0] && r.powerRatio[1] ? ((Number(r.powerRatio[1]) - Number(r.powerRatio[0])) / Number(r.powerRatio[1])).toExponential(1) : '—') + '; '
      + 'build ' + secs(r.seconds.build) + ', iteration ' + secs(r.seconds.eigen) + ', certificate ' + secs(r.seconds.certify) + '. '
      + 'Files: table ' + gib(r.bytes.table) + ' (sha256 ' + short(r.files.table) + '), keys ' + gib(r.bytes.keys) + ' (' + short(r.files.keys) + '), vector ' + gib(r.bytes.v) + ' (' + short(r.files.v) + '); '
      + r.sample.states + ' random states (' + num(r.sample.transitions) + ' transitions) re-derived by the reference, ' + r.sample.mismatches + ' mismatches.' })))
}));

/* §5 red controls */
B.push(C.section({
  lab: '§5 · red controls', title: 'What must come out wrong, and does',
  bodyRaw: C.pRaw('Every control is re-fired by ' + m('--check') + ' except the three on the binary, which the record keeps with their messages.')
    + C.table({ cols: [{ h: 'control' }, { h: 'what' }, { h: 'expected' }, { h: 'got' }, { h: 'fired' }],
      rows: R.redControls.map((r) => [r.id, r.what, r.expect, r.got + (r.luekerLambda ? ' (Lueker ' + r.luekerLambda + ')' : ''), r.fired ? 'yes' : 'NO']) })
}));

/* §6 limits */
B.push(C.section({
  lab: '§6 · what is claimed, and what is not', title: 'The limits',
  bodyRaw: C.plainList([
    { b: 'Claimed.', text: 'For each row, a certificate of our own — our automaton, our vector, directed rounding, the bound outward — that reaches the printed bound; the construction calibrated on Lueker\'s published table; the claimant\'s λ consistent with our certified bracket on the spectral radius.' },
    { b: 'Used, not re-proved.', text: 'Lueker\'s Theorem 3.3 and his proof that M_h covers Σ* for every h (J. ACM 2009, peer-reviewed). A reader who doubts them doubts the 2009 bound too.' },
    { b: 'Not claimed.', text: 'That the claimant\'s own vectors satisfy his inequality under our matrix — his vectors were offered and would make that a one-pass check; that the printed λ is the spectral radius (ours and his are both upper bounds on it, and the gap between them is the vectors\' quality, not an error); anything about the lower bound rows of the same page.' },
    { b: 'Independence.', text: 'From the claimant, whose code was never opened; not from the operator (one). The second implementation here is a reference the fast one is held to, not a second person.' }
  ])
}));

const foot = '<p>' + C.esc('Generated by tools/build-report-lueker.js from certs/lueker-replay.json (' + R.generated + '), re-checked at build: ' + cm[1] + ' checks, ' + cm[3] + ' red controls; record sha256 ' + short(sha('certs/lueker-replay.json')) + '; mh.c ' + short(R.code['mh.c']) + ', mh.py ' + short(R.code['mh.py']) + '. Rebuild: node tools/build-report-lueker.js.') + '</p>'
  + '<p>' + C.esc('git ' + git) + '</p>';
fs.writeFileSync(path.join(ROOT, 'reports', 'chvatal-sankoff.html'), TPL.render({
  title: 'Two asterisks on the Chvátal–Sankoff constant, replayed · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot,
  desc: 'The optimization-constants registry\'s C31 upper bounds (Lueker\'s method at h = 9 and h = 10), replayed with an automaton rebuilt from the paper alone, calibrated on Lueker\'s table and certified with our own witness vectors: ' + R.rows.map((r) => 'h = ' + r.h + ' ' + r.verdict).join(', ') + '.',
  path: '/reports/chvatal-sankoff.html'
}));
console.log('reports/chvatal-sankoff.html written: ' + R.rows.map((r) => 'h=' + r.h + ' ' + r.verdict).join(', ') + '; calibration ' + R.calibration.length + '/7; red controls ' + R.redControlsFired + ' @ git ' + git);
