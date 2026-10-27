#!/usr/bin/env node
/* replay-graphon-k4.js — the registry's C_89 (K4) Ramsey-multiplicity bound C_89 <= 0.0301388794* ([SK2026], J. SK,
   teorth/optimizationproblems #255, merged asterisked; constants/89a.md) decided twice from the pinned certificate (a step
   graphon with 3840 equal blocks and red values in 2^-20 Z), by two implementations that share no code with each other
   or with the claimant's evaluators (exact_eval.py, float_eval.py, refine.py: pinned as text, never run):

     1. instruments/optq/graphon_k4.c — C, every block, NO symmetry: f(i) = sum_{j,k} Y_jk Q_jk on the support of row i,
        modulo nine primes below 2^21 (exact doubles in its own blocked kernel), run on a RunPod CPU pod
        (tools/runpod-graphon-k4.sh) and imported verbatim into certs/graphon-k4-blocks.txt; summed and lifted here by the
        Chinese remainder theorem over eight primes, the ninth a check.
     2. instruments/optq/graphon-k4-second.js — JavaScript, EXACT integers (split doubles + BigInt, no modulus), by a
        different decomposition: N = sum over ordered pairs of X_ij g(i,j), one g per orbit of ordered pairs under the
        block permutations in certs/graphon-k4-automorphisms.json (proposed by instruments/optq/graphon_k4_aut.py and
        verified exactly here; 128 block orbits).

   Agreement is required on the two integers N_red, N_blue AND on every block: the C residues of f(i), for all 3840 blocks
   and nine primes, against the second implementation's exact f(i). What is decided — the registry's definition
   (89a.md): the monochromatic K4 density t(K4,W) + t(K4,1-W) of the step graphon, an exact rational, compared with the
   fraction the page states and the bound it prints (the printed decimal as the exact rational of its digits); that a
   step graphon's density bounds the constant from above is the standard random-colouring argument, read.

   usage: node tools/replay-graphon-k4.js           the second implementation on the certificate (~10–30 min), the C
                                                    residues recombined, the controls (the C kernel compiled here with cc:
                                                    the perturbation, W = 1/2, the PPSS graph) → certs/graphon-k4.json
          node tools/replay-graphon-k4.js --check   the battery (~1 min): the pins and the C residue file re-hashed; the
                                                    automorphisms re-verified; the C residues re-summed and re-lifted; block 0
                                                    re-derived without symmetry and its perturbation re-derived (second
                                                    implementation) against the C residues; the stated fraction, the printed
                                                    bound and the printed-below control re-compared; nothing written
   MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const os = require('os');
const ROOT = path.resolve(__dirname, '..');
const S = require(path.join(ROOT, 'instruments', 'optq', 'graphon-k4-second.js'));
const DIR = 'corpus/optconst-queue/c89a-k4-2026-10-27';
const OUT = path.join(ROOT, 'certs', 'graphon-k4.json');
const BLOCKS = 'certs/graphon-k4-blocks.txt', POD = 'certs/graphon-k4-pod.json', AUT = 'certs/graphon-k4-automorphisms.json';
const CHECK = process.argv.includes('--check');
const T0 = Date.now();
const die = (m) => { console.error('GRAPHON K4 REPLAY REFUSED: ' + m); process.exit(1); };
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const rd = (rel) => fs.readFileSync(path.join(ROOT, rel));
const PINS = JSON.parse(rd(DIR + '/PINS.json').toString('utf8'));
const pinned = (rel) => { const buf = rd(DIR + '/' + rel); if (!PINS.files[rel] || sha(buf) !== PINS.files[rel].sha256) die(rel + ' does not match its pin'); return buf; };
for (const rel of Object.keys(PINS.files)) pinned(rel);
const secs = () => ((Date.now() - T0) / 1000).toFixed(0) + ' s';
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

/* ---- the certificate, the page's row, the claimant's printed residues ----------------------------------------------- */
const CERT = 'c89-k4/c89_stepgraphon_D20.json.gz';
const G = S.parseStepGraphon(pinned(CERT));
const { m, D } = G;
const page = pinned('upstream/constants/89a.md').toString('utf8');
const row = /^\| \$([0-9.]+)\$\* \| \[SK2026\] \| Exact value \$(\d+)\/(\d+) = ([0-9.]+)\\ldots\$/m.exec(page) || die('the 89a page has no asterisked [SK2026] row with its exact value');
const PRINTED = row[1], STATED = { num: BigInt(row[2]), den: BigInt(row[3]) }, STATED_DEC = row[4];
const theirs = [...pinned('c89-k4/results/candidate_exact.txt').toString('utf8').matchAll(/p=(\d+): residue (\d+)/g)].map((x) => ({ p: BigInt(x[1]), r: BigInt(x[2]) }));
const theirEnclosure = /lies in \[([0-9.]+), ([0-9.]+)\]/.exec(pinned('c89-k4/results/candidate_exact.txt').toString('utf8'));
if (theirs.length !== 10 || !theirEnclosure) die('the claimant\'s result file does not have its ten residues and its enclosure');
const DEN = BigInt(m) ** 4n * BigInt(D) ** 6n;

/* ---- arithmetic -------------------------------------------------------------------------------------------------- */
const decFrac = (s) => { const [a, b = ''] = s.split('.'); return { num: BigInt(a + b), den: 10n ** BigInt(b.length) }; };
const le = (x, y) => x.num * y.den <= y.num * x.den;
const eq = (x, y) => x.num * y.den === y.num * x.den;
const printedIs = (v, printed) => {
  const k = (printed.split('.')[1] || '').length, q = 10n ** BigInt(k), p = BigInt(printed.replace('.', ''));
  const floor = (v.num * q) / v.den, ceil = (v.num * q + v.den - 1n) / v.den, near = (v.num * q * 2n + v.den) / (2n * v.den);
  return [['up', ceil], ['nearest', near], ['truncated', floor]].filter(([, x]) => x === p).map(([w]) => w);
};
const below = (s) => { const d = decFrac(s); return { num: d.num - 1n, den: d.den, text: (() => { const t = (d.num - 1n).toString().padStart(s.length - 1, '0'); const k = (s.split('.')[1] || '').length; return t.slice(0, t.length - k) + '.' + t.slice(-k); })() }; };
const modinv = (a, p) => { let [r0, r1, s0, s1] = [((a % p) + p) % p, p, 1n, 0n]; while (r1) { const q = r0 / r1; [r0, r1] = [r1, r0 - q * r1]; [s0, s1] = [s1, s0 - q * s1]; } if (r0 !== 1n) die('modinv'); return ((s0 % p) + p) % p; };
function crt(res, ps) { let x = 0n, M = 1n; for (let k = 0; k < ps.length; k++) { const t = (((res[k] - x) % ps[k]) + ps[k]) % ps[k] * modinv(M, ps[k]) % ps[k]; x += M * t; M *= ps[k]; } return { x, M }; }
function fingerprint(Gx) {                        // what graphon_k4.c prints on its M line: sum R_ij and sum R_ij (i m + j + 1) mod 2^64
  let sum = 0n, fp = 0n;
  for (let i = 0; i < Gx.m; i++) { let s = 0, sj = 0; for (let j = 0; j < Gx.m; j++) { const v = Gx.R[i * Gx.m + j]; s += v; sj += v * j; } sum += BigInt(s); fp += BigInt(i * Gx.m + 1) * BigInt(s) + BigInt(sj); }
  return { sum, fp: fp % (1n << 64n) };
}

/* ---- the first implementation's output: per-block residues → N mod p → CRT ----------------------------------------- */
function readC(text, Gx, label) {
  const lines = text.split('\n').filter(Boolean);
  const M = lines.find((l) => l[0] === 'M'), P = lines.find((l) => l[0] === 'P');
  if (!M || !P) die(label + ': no M or P line');
  const [, mm, DD, sum, fp] = M.split(' ');
  const f = fingerprint(Gx);
  if (Number(mm) !== Gx.m || Number(DD) !== Gx.D || BigInt(sum) !== f.sum || BigInt(fp) !== f.fp) die(label + ': the C kernel read another matrix (fingerprint)');
  const ps = P.split(' ').slice(1).map(BigInt);
  const blocks = new Map();
  for (const l of lines.filter((x) => x[0] === 'B')) { const t = l.split(' '); const i = Number(t[1]); if (blocks.has(i)) die(label + ': block ' + i + ' twice'); const v = t.slice(2).map(BigInt); if (v.length !== 2 * ps.length) die(label + ': a short line'); blocks.set(i, { red: ps.map((_, k) => v[2 * k]), blue: ps.map((_, k) => v[2 * k + 1]) }); }
  const seconds = lines.filter((l) => l[0] === 'T').reduce((a, l) => a + Number(l.split(' ')[1]), 0);
  return { ps, blocks, seconds };
}
function liftC(C, Gx, label, all = true) {
  const den = BigInt(Gx.m) ** 4n * BigInt(Gx.D) ** 6n;
  if (all) for (let i = 0; i < Gx.m; i++) if (!C.blocks.has(i)) die(label + ': block ' + i + ' missing');
  const out = {};
  for (const c of ['red', 'blue']) {
    const res = C.ps.map((p, k) => { let s = 0n; for (const b of C.blocks.values()) s += b[c][k]; return s % p; });
    const ps = C.ps.slice(0, -1), chk = C.ps[C.ps.length - 1];
    const { x, M } = crt(res.slice(0, -1), ps);
    if (M <= den) die(label + ': the CRT primes do not exceed m^4 D^6');
    if (x % chk !== res[res.length - 1]) die(label + ': the check prime ' + chk + ' disagrees with the CRT lift (' + c + ')');
    out[c] = x;
  }
  const r = S.reduce(out.red + out.blue, den);
  return { Nred: out.red, Nblue: out.blue, num: r.num, den: r.den, crtPrimes: C.ps.length - 1, checkPrime: C.ps[C.ps.length - 1].toString() };
}
const C = readC(rd(BLOCKS).toString('utf8'), G, 'the pod run');
const cv = liftC(C, G, 'the pod run');
const deciders = { c: sha(rd('instruments/optq/graphon_k4.c')), js: sha(rd('instruments/optq/graphon-k4-second.js')), proposer: sha(rd('instruments/optq/graphon_k4_aut.py')) };
const AUTS = JSON.parse(rd(AUT).toString('utf8'));
if (AUTS.source_sha256 !== PINS.files[CERT].sha256) die('the automorphism file names another certificate');
const PERTURB = (() => { for (let j = 1; j < m; j++) { const v = G.R[j]; if (v > 0 && v < D) return { i: 0, j, from: v, to: v + 1 }; } die('no fractional entry in row 0'); })();
const perturbed = () => { const R = Int32Array.from(G.R); R[PERTURB.i * m + PERTURB.j] = PERTURB.to; R[PERTURB.j * m + PERTURB.i] = PERTURB.to; return { m, D, R }; };
const DIRECT_BLOCKS = [0, m - 1];
const val = (n, d) => ({ num: n.toString(), den: d.toString(), lower: S.decimals(n, d, 16, 'down'), upper: S.decimals(n, d, 16, 'up') });
const mods = (x, ps) => ps.map((p) => x % p);
const sameMods = (x, res, ps) => ps.every((p, k) => x % p === res[k]);

/* ---- CHECK -------------------------------------------------------------------------------------------------------- */
if (CHECK) {
  if (!fs.existsSync(OUT)) die('no record on disk: run without --check first');
  const was = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  const r = was.rows[0];
  if (was.pins !== DIR + '/PINS.json' || was.blocksFile.sha256 !== sha(rd(BLOCKS)) || was.automorphisms.sha256 !== sha(rd(AUT))) die('the record names other pins, another C residue file or other automorphisms');
  S.verifyAutomorphisms(G, AUTS.generators);
  if (cv.Nred !== BigInt(r.c.Nred) || cv.Nblue !== BigInt(r.c.Nblue)) die('the C residues no longer lift to the recorded integers');
  if (cv.Nred !== BigInt(r.js.Nred) || cv.Nblue !== BigInt(r.js.Nblue)) die('the two implementations\' recorded integers differ');
  const v = { num: cv.num, den: cv.den };
  if (!eq(v, STATED)) die('the value is not the fraction the page states');
  if (!le(v, decFrac(PRINTED))) die('the value is above the printed bound');
  if (le(v, below(PRINTED))) die('the printed-below control did not fire');
  if (!theirs.every(({ p, r: rr }) => (cv.Nred + cv.Nblue) % p === rr)) die('the claimant\'s printed residues are not those of the exact numerator');
  for (const blue of [false, true]) {                                   // block 0 again, with no symmetry, against the C residues
    const f = S.fDirect(G, 0, blue), b = C.blocks.get(0)[blue ? 'blue' : 'red'];
    if (!sameMods(f, b, C.ps) || f.toString() !== r.js.f0[blue ? 'blue' : 'red']) die('block 0 (' + (blue ? 'blue' : 'red') + ') re-derived without symmetry differs from the C residues or the record');
  }
  const fp = S.fDirect(perturbed(), 0, false), ctl = was.controls.find((c) => c.id === 'perturb');
  if (fp.toString() === r.js.f0.red || !ctl.fired || !sameMods(fp, ctl.c.red.map(BigInt), C.ps)) die('the perturbation control did not re-derive');
  const half = S.valueDirect({ m: 6, D: 2, R: new Int32Array(36).fill(1) }); if (half.num * 32n !== half.den) die('the W = 1/2 control is not 2^-5');
  if (r.verdict !== 'CERTIFIED' || !was.controls.every((c) => c.kind === 'red' ? c.fired : c.held)) die('the record is not CERTIFIED with every control as it must be');
  if (Object.keys(deciders).some((k) => was.deciders[k] !== deciders[k])) console.log('  note: a decider changed since the record was written — re-run without --check to refresh it');
  console.log('graphon K4 replay holds: C_89 ≤ ' + PRINTED + ' CERTIFIED, value ' + S.decimals(cv.num, cv.den, 15, 'down') + '…, the stated fraction exactly (the C residues of ' + m + ' blocks re-lifted; ' + AUTS.generators.length + ' automorphisms re-verified; block 0 and its perturbation re-derived without symmetry; ' + Object.keys(PINS.files).length + ' pins) · ' + secs());
  process.exit(0);
}

/* ---- FULL --------------------------------------------------------------------------------------------------------- */
(async () => {
console.log('C_89: the registry prints ≤ ' + PRINTED + '* ([SK2026], #255); the page states ' + row[2].slice(0, 12) + '…/' + row[3].slice(0, 12) + '…');
console.log('  C   (pod run, ' + C.blocks.size + ' blocks, ' + C.ps.length + ' primes): ' + S.decimals(cv.num, cv.den, 20, 'down') + '… (' + C.seconds.toFixed(0) + ' s kernel)');
const tj = Date.now();
const WORKERS = Math.max(1, Math.min(6, os.cpus().length - 2));
let lastLog = 0;
const jv = await S.valueByOrbits(G, AUTS.generators, { workers: WORKERS, log: (s) => { if (Date.now() - lastLog > 60000 || / evaluated$/.test(s)) { lastLog = Date.now(); console.log('  js  ' + s + ' (' + secs() + ')'); } } });
const jsSeconds = Math.round((Date.now() - tj) / 100) / 10;
console.log('  js  (exact, ' + jv.pairOrbits + ' pair orbits, ' + jv.blockOrbits + ' block orbits): ' + S.decimals(jv.num, jv.den, 20, 'down') + '… (' + jsSeconds + ' s)');
/* every block: the C residues of f(i) against the exact f(i) of the second implementation */
let blockMismatch = 0;
for (let i = 0; i < m; i++) { const b = C.blocks.get(i); if (!sameMods(jv.red.fOfBlock(i), b.red, C.ps) || !sameMods(jv.blue.fOfBlock(i), b.blue, C.ps)) blockMismatch++; }
console.log('  per block: ' + (m - blockMismatch) + ' of ' + m + ' blocks agree at all ' + C.ps.length + ' primes, both colours');
const value = { num: cv.num, den: cv.den };
const agree = cv.Nred === jv.Nred && cv.Nblue === jv.Nblue && blockMismatch === 0;
const equalsStated = eq(value, STATED), lePrinted = le(value, decFrac(PRINTED)), how = printedIs(value, PRINTED);
const theirResidues = theirs.every(({ p, r }) => (cv.Nred + cv.Nblue) % p === r);
const encl = { lo: decFrac(theirEnclosure[1]), hi: decFrac(theirEnclosure[2]) };
const theirEnclosureHolds = le(encl.lo, value) && le(value, encl.hi);
const f0 = { red: jv.red.fOfBlock(0), blue: jv.blue.fOfBlock(0) };

/* ---- controls ----------------------------------------------------------------------------------------------------- */
const bin = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'graphon-k4-')), 'graphon_k4');
{ const r = cp.spawnSync('cc', ['-O3', '-march=native', '-ffp-contract=fast', '-pthread', '-o', bin, path.join(ROOT, 'instruments/optq/graphon_k4.c'), '-lm'], { encoding: 'utf8' }); if (r.status !== 0) die('cc failed: ' + r.stderr); }
const runC = (json, args) => { const r = cp.spawnSync(bin, args, { input: json, encoding: 'utf8', maxBuffer: 1 << 28 }); if (r.status !== 0) die('graphon_k4 failed: ' + r.stderr); return r.stdout; };
const jsonOf = (Gx) => { const rows = []; for (let i = 0; i < Gx.m; i++) rows.push('[' + Array.from(Gx.R.subarray(i * Gx.m, (i + 1) * Gx.m)).join(',') + ']'); return '{"schema":"rational-step-graphon-v1","edge_probability_denominator":' + Gx.D + ',"block_weights":[' + new Array(Gx.m).fill(1).join(',') + '],"red_probability_numerators":[' + rows.join(',') + ']}'; };
const controls = [];
console.log('controls:');
{ const st = runC('', ['--selftest']); controls.push({ id: 'c-selftest', kind: 'positive', what: 'graphon_k4.c --selftest (here and on the pod): the kernel against a brute force over all ordered 4-tuples', text: st.trim(), held: /kernel = brute force/.test(st) }); }
{ const st = cp.spawnSync('node', [path.join(ROOT, 'instruments/optq/graphon-k4-second.js'), '--selftest'], { encoding: 'utf8' }); controls.push({ id: 'js-selftest', kind: 'positive', what: 'graphon-k4-second.js --selftest: brute force = the pair decomposition = the per-block sum = the orbit sum', text: st.stdout.trim(), held: st.status === 0 }); }
{ /* PRE-DECLARED: R[0][j*] += 1 at the first fractional entry of row 0; block 0 by both, without symmetry */
  const Gp = perturbed(), out = readC(runC(jsonOf(Gp), ['--threads=1', '--blocks=0:1']), Gp, 'the perturbed run');
  const jr = S.fDirect(Gp, 0, false), jb = S.fDirect(Gp, 0, true), cb = out.blocks.get(0);
  const moved = !sameMods(f0.red, cb.red, out.ps) && jr !== f0.red && jb !== f0.blue;
  const agreeP = sameMods(jr, cb.red, out.ps) && sameMods(jb, cb.blue, out.ps);
  controls.push({ id: 'perturb', kind: 'red', what: 'R[0][' + PERTURB.j + '] (and R[' + PERTURB.j + '][0]) raised by one unit of 2^-20 (' + PERTURB.from + ' → ' + PERTURB.to + ', the first fractional entry of row 0): f(0) must move in both implementations, and they must agree on the moved value', pair: PERTURB,
    c: { red: cb.red.map(String), blue: cb.blue.map(String), primes: out.ps.map(String) }, js: { red: jr.toString(), blue: jb.toString() }, fired: moved && agreeP });
  console.log('  perturb fired ' + controls[controls.length - 1].fired + ' (' + secs() + ')'); }
{ const b = below(PRINTED); controls.push({ id: 'printed-below', kind: 'red', what: 'a printed bound one unit below at its last place (' + b.text + ') must not hold', fired: !le(value, b) }); }
{ const Gh = { m: 6, D: 2, R: new Int32Array(36).fill(1) }, out = readC(runC(jsonOf(Gh), ['--threads=1']), Gh, 'the half graphon'), c = liftC(out, Gh, 'the half graphon'), j = S.valueDirect(Gh);
  controls.push({ id: 'half-graphon', kind: 'positive', what: 'W ≡ 1/2 (6 blocks, D = 2) gives 2·2^-6 = 1/32 exactly in both implementations', c: c.num + '/' + c.den, js: j.num + '/' + j.den, held: c.num * 32n === c.den && j.num * 32n === j.den }); }
{ /* the PPSS 768-vertex graph (Zenodo 6602512, c4.graph6): its blow-up limit, 0/1 graphon with an empty diagonal (red inside a block 0) */
  const Gq = S.decodeGraph6(pinned('ppss/c4.graph6.txt').toString('utf8'));
  const tq = Date.now(), out = readC(runC(jsonOf(Gq), ['--threads=' + Math.max(1, Math.min(6, os.cpus().length - 2))]), Gq, 'the PPSS graph'), c = liftC(out, Gq, 'the PPSS graph'), cs = (Date.now() - tq) / 1000;
  const tj2 = Date.now(), j = S.valueDirect(Gq), js2 = (Date.now() - tj2) / 1000;
  const PUB = { num: 4551721n, den: 16777216n * 9n };
  controls.push({ id: 'ppss-published', kind: 'positive', what: 'the PPSS 768-vertex Cayley graph (Zenodo 6602512, pinned c4.graph6) as a 0/1 step graphon gives the published 4551721·2^-24·3^-2 (PPSS 2024, Theorem 1.1) in both implementations (the second without symmetry)', m: Gq.m,
    c: c.num + '/' + c.den, js: j.num + '/' + j.den, seconds: { c: Math.round(cs), js: Math.round(js2) }, held: eq(c, PUB) && eq(j, PUB) });
  console.log('  ppss-published held ' + controls[controls.length - 1].held + ' (c ' + c.num + '/' + c.den + ', js ' + j.num + '/' + j.den + ')'); }
{ /* PRE-DECLARED: blocks 0 and m-1 by the second implementation WITHOUT the group, against its orbit value and the C residues */
  const res = DIRECT_BLOCKS.map((i) => { const r = S.fDirect(G, i, false), b = S.fDirect(G, i, true); return { block: i, red: r.toString(), blue: b.toString(), equalsOrbit: r === jv.red.fOfBlock(i) && b === jv.blue.fOfBlock(i), equalsC: sameMods(r, C.blocks.get(i).red, C.ps) && sameMods(b, C.blocks.get(i).blue, C.ps) }; });
  controls.push({ id: 'direct-blocks', kind: 'positive', what: 'blocks ' + DIRECT_BLOCKS.join(' and ') + ' by the second implementation with no symmetry equal its orbit value and the C residues', blocks: res, held: res.every((x) => x.equalsOrbit && x.equalsC) });
  console.log('  direct-blocks held ' + controls[controls.length - 1].held + ' (' + secs() + ')'); }
if (!controls.every((c) => c.kind === 'red' ? c.fired : c.held)) die('a control did not come out as it must — the record is not written: ' + JSON.stringify(controls.map((c) => [c.id, c.fired ?? c.held])));

const pod = fs.existsSync(path.join(ROOT, POD)) ? JSON.parse(rd(POD).toString('utf8')) : null;
const rowOut = {
  id: 'c89-k4', constant: 'C_89', claim: 'C_89 <= ' + PRINTED, pr: 255, reference: '[SK2026]', source: CERT, sha256: PINS.files[CERT].sha256,
  stated: { num: STATED.num.toString(), den: STATED.den.toString(), decimal: STATED_DEC + '…' },
  c: { Nred: cv.Nred.toString(), Nblue: cv.Nblue.toString(), ...val(cv.num, cv.den), primes: C.ps.map(String), crtPrimes: cv.crtPrimes, checkPrime: cv.checkPrime, kernelSeconds: Math.round(C.seconds), blocks: C.blocks.size, where: pod ? 'RunPod ' + pod.pod + ' (' + (pod.build.find((l) => /model name/.test(l)) || '').replace(/^model name\s*:\s*/, '') + ', ' + pod.threads + ' threads)' : 'unknown' },
  js: { Nred: jv.Nred.toString(), Nblue: jv.Nblue.toString(), ...val(jv.num, jv.den), seconds: jsSeconds, where: os.cpus()[0].model + ', ' + WORKERS + ' worker threads', pairOrbits: jv.pairOrbits, blockOrbits: jv.blockOrbits, pairOrbitsEvaluated: { red: jv.red.evaluated, blue: jv.blue.evaluated }, f0: { red: f0.red.toString(), blue: f0.blue.toString() } },
  perBlock: { blocks: m, primes: C.ps.length, mismatches: blockMismatch },
  agree, equalsStated, lePrinted, printedIs: how,
  theirResidues: { primes: theirs.length, consistent: theirResidues, what: 'the ten residues in their results/candidate_exact.txt (nine CRT primes and a check prime below 1.5e6) are those of the exact numerator N_red + N_blue' },
  theirEnclosure: { printed: '[' + theirEnclosure[1] + ', ' + theirEnclosure[2] + ']', holds: theirEnclosureHolds },
  verdict: agree && lePrinted ? 'CERTIFIED' : 'REFUSED'
};
const rec = {
  what: 'The registry\'s C_89 (K4) Ramsey-multiplicity upper bound 0.0301388794* ([SK2026], J. SK, pull request 255, merged asterisked) decided twice from the pinned certificate: the monochromatic K4 density of the 3840-block step graphon as an exact rational, by instruments/optq/graphon_k4.c (C; every block, no symmetry; nine primes below 2^21, CRT over eight and a check prime; run on a RunPod CPU pod) and instruments/optq/graphon-k4-second.js (JavaScript; exact integers; one g(i,j) per orbit of ordered block pairs under block permutations verified exactly), sharing no code with each other or with the claimant\'s evaluators (kept as text). CERTIFIED when the two integers agree, every block agrees, and the value is at or below the printed bound; the step from a graphon\'s density to the constant is the standard argument, read.',
  generated: new Date().toISOString(), git, deciders, pins: DIR + '/PINS.json', certificateCommit: PINS.certificateCommit, registryMain: PINS.registryMain, pr255: PINS.pr255,
  blocksFile: { path: BLOCKS, sha256: sha(rd(BLOCKS)) }, automorphisms: { path: AUT, sha256: sha(rd(AUT)), generators: AUTS.generators.length, blockOrbits: jv.blockOrbits, pairOrbits: jv.pairOrbits },
  pod,
  definition: 'constants/89a.md (registry main e95af44b): C_89 = min over 2-edge-coloured graphons of t(K4,W) + t(K4,1−W); a step graphon with m equal blocks and red value R_ij/D: t(K4,W) = m^-4 Σ over ordered 4-tuples of blocks of the product of the six pair values, the diagonal included; value = (N(R) + N(D−R)) / (m^4 D^6)',
  rows: [rowOut], controls, seconds: Math.round((Date.now() - T0) / 1000),
  gaps: ['registry README.md (main e95af44b) lists C_89\'s best asterisked upper bound as 0.0301388857* ([Kos2026], #264) while constants/89a.md carries the smaller 0.0301388794* ([SK2026], #255): the README cell does not show the page\'s best row'],
  limits: ['the density is decided exactly; that a step graphon\'s monochromatic density bounds the constant from above is the standard random-colouring argument, read and not re-derived', 'the claimant\'s evaluators (exact_eval.py, float_eval.py, refine.py) are pinned as text and never run', 'the second implementation uses the block permutations only after verifying each exactly; the first uses none', 'the first implementation ran on a rented pod: its output is imported verbatim (certs/graphon-k4-blocks.txt) and every block of it is compared with the second implementation']
};
fs.writeFileSync(OUT, JSON.stringify(rec, null, 1) + '\n');
console.log('certs/graphon-k4.json written: c89-k4 ' + rowOut.verdict + (agree ? ' (both agree, every block)' : '') + (equalsStated ? ', the stated fraction exactly' : '') + ', printed ' + how.join('/') + '; value in [' + rowOut.c.lower + ', ' + rowOut.c.upper + '] · ' + secs());
})().catch((e) => die(e.stack || String(e)));
