#!/usr/bin/env node
/* run-lemniscate.js — the Erdős #1038 INFIMUM program: run every certificate
   and consolidate them into certs/erdos1038-inf.json.

   Four theorems, all decided in outward-rounded interval arithmetic over
   instruments/interval (the same certifier the ember and terra programs use):

     T1  upper.js    inf ≤ 1.8344304971959906, from an explicit measure
     T2  duals.js    the thread's three posted dual measures certified
     T3  family.js   Tao's Problem 4.1 answered YES for every ε ∈ (0, 0.1]
         + sliver.js (the family on [1e-12, 0.1]; the sliver closes (0, 1e-12])
     T4  forcing.js  inf ≥ 1.828 — pure forcing, no tail, no minimizer

   T4 is expensive (~1.5 h at cap 1.828) and is NOT re-run here: its record is
   read from certs/ and re-checked structurally by verify-forcing.js, which
   shares no code with the certifier and also hunts counterexamples in doubles.
   Run it yourself with:
     node instruments/lemniscate/forcing.js 1.828 certs/erdos1038-forcing-1.828.json

   THE FENCE (non-negotiable, gated in the page builder): three AI-assisted
   FULL PROOFS of this problem are claimed on the erdosproblems forum — Darvas
   /Peng/Tao, Shouqiao Wang, Cristian Budala — all landing on the same constant
   D = 1.83443047576266171109…, and the forum states plainly that appearing
   there "is no guarantee of proof correctness, and does not mean that anyone
   associated with this site has examined any part of the proof." Nothing here
   assumes any of them. This program reports what holds unconditionally.

   usage: node tools/run-lemniscate.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const INS = path.join(ROOT, 'instruments', 'lemniscate');
const die = (m) => { console.error('LEMNISCATE REFUSED: ' + m); process.exit(1); };

const run = (script, args = []) => {
  const r = cp.spawnSync('node', [path.join(INS, script), ...args], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 });
  const out = String(r.stdout) + String(r.stderr);
  if (r.status !== 0) die(script + ' failed:\n' + out.slice(-800));
  if (/\bFAIL\b/.test(out)) die(script + ' reported a FAIL line:\n' + out.slice(-800));
  return out;
};
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

console.log('T1  upper bound (explicit measure)');
run('upper.js');
const t1 = readJson(path.join(INS, 'cert-min.json'));
console.log('    inf ≤ ' + t1.lenUp);

console.log('T2  the thread\'s three dual measures');
run('duals.js');
const t2 = readJson(path.join(INS, 'cert-eps.json'));
console.log('    ' + t2.results.length + ' measures, min certified margin '
  + Math.min(...t2.results.map((r) => r.certifiedMin)).toExponential(3));

console.log('T3  the ε-family (Tao Problem 4.1)');
run('family.js', ['1e-12', '0.1']);
run('sliver.js');
const t3 = readJson(path.join(INS, 'cert-eps-family.json'));
const t3s = readJson(path.join(INS, 'cert-eps-sliver.json'));
console.log('    ' + t3.chunks.toLocaleString('en-US') + ' chunks on [1e-12, 0.1] + the sliver on (0, 1e-12]');

/* ---- T4: read the pinned record, then RE-CHECK it with the independent verifier ---- */
const FORCE = path.join(ROOT, 'certs', 'erdos1038-forcing-1.828.json');
let t4 = null, t4verify = null;
if (fs.existsSync(FORCE)) {
  const f = readJson(FORCE);
  const v = cp.spawnSync('node', [path.join(INS, 'verify-forcing.js'), FORCE, '12', '4000'],
    { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 });
  const vout = String(v.stdout) + String(v.stderr);
  if (v.status !== 0 || /\bFAIL\b/.test(vout)) die('the independent forcing verifier rejected the record:\n' + vout.slice(-800));
  const sm = /smallest[^0-9-]*([0-9.eE+-]+)/.exec(vout);
  const s = f.summary || {};
  t4 = { cap: s.cap, a0Boxes: Array.isArray(f.boxes) ? f.boxes.length : undefined,
    bBoxes: s.bBoxes, worstMargin: s.worstCertifiedMargin, lpCalls: s.lpCalls,
    secs: s.secs, fullRange: s.fullRange, aRange: s.aRange };
  t4verify = { ok: true, smallestDoubleU: sm ? Number(sm[1]) : null };
  if (!(t4.cap > 0)) die('the forcing record carries no cap in its summary');
  console.log('T4  forcing lower bound: inf ≥ ' + t4.cap + ' — independently re-verified ('
    + t4.a0Boxes + ' a₀-boxes, ' + t4.secs + ' s)');
} else {
  console.log('T4  forcing record not present yet (run instruments/lemniscate/forcing.js) — recorded as PENDING');
}

const out = {
  what: 'Erdős #1038 (Erdős–Herzog–Piranian 1958), the INFIMUM side. For nonconstant monic '
    + 'polynomials f with all roots in [-1,1], equivalently probability measures μ on [-1,1] with '
    + 'U_μ(x) = ∫log(1/|x-t|)dμ(t), this program brackets inf |{U_μ < 0}| = inf |{|f| < 1}| in '
    + 'certified interval arithmetic, and answers Tao\'s model Problem 4.1 affirmatively for every ε.',
  scope: 'The infimum side only. The supremum side (Tao\'s #179 conjecture, sup = 2√2) is a separate '
    + 'program of this repository: reports/erdos1038-sup.html.',
  independence: 'Nothing here assumes any claimed proof of this problem. Three AI-assisted full proofs '
    + 'are claimed on the erdosproblems forum (Darvas–Peng–Tao 2026-07-15; Shouqiao Wang; Cristian Budala '
    + '2026-08-24), all reporting D = 1.83443047576266171109…; the forum states that appearing there is no '
    + 'guarantee of correctness and that nobody associated with the site has examined any part of them. '
    + 'This repository separately CONFIRMED the computational appendix of the Darvas–Peng–Tao manuscript '
    + '(reports/claim-lemniscate.html) and did not audit its analytic core.',
  bracket: { lower: t4 ? t4.cap : null, upper: t1.lenUp,
    note: 'both ends unconditional; the lower end needs no tail and no minimizer' },
  theorems: {
    T1_upper: t1,
    T2_thread_duals: t2,
    T3_family: { range: 'ε ∈ (0, 0.1]', onChunks: t3, sliver: t3s,
      answers: 'Tao Problem 4.1, affirmatively, for the whole range' },
    T4_forcing: t4 ? { record: 'certs/erdos1038-forcing-1.828.json', summary: t4, independentVerify: t4verify }
      : 'PENDING — run instruments/lemniscate/forcing.js 1.828 certs/erdos1038-forcing-1.828.json',
  },
  provenance: readJson(path.join(INS, 'PROVENANCE.json')),
  corpus: readJson(path.join(ROOT, 'corpus', 'lemniscate', 'PINS.json')),
  generated: new Date().toISOString(),
  git: (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })(),
};
fs.writeFileSync(path.join(ROOT, 'certs', 'erdos1038-inf.json'), JSON.stringify(out, null, 1) + '\n');
console.log('wrote certs/erdos1038-inf.json — bracket ['
  + (t4 ? t4.cap : '?') + ', ' + t1.lenUp + ']');
