#!/usr/bin/env node
/* replay-graphon.js — the registry's C_89b and C_89c certificates (the Ramsey-multiplicity constants of K5 and K6, J. SK,
   pull requests 277 and 279 to teorth/optimizationproblems) decided twice, by two implementations that share no code
   with each other or with the claimant's evaluators (kept as text, never run): instruments/optq/graphon_k5.py and
   graphon_k6.py (Python, Fraction: the trace identity on the common support; the row-class/S4 reduction) and
   instruments/optq/graphon-second.js (JavaScript: modular counting lifted by the Chinese remainder theorem; the same
   reduction derived again, in BigInt).

   What the certificates are: for K5, a step graphon with 192 blocks of equal measure and red value R_ij/D (D = 2^20)
   on each block pair, the diagonal included; for K6, a step graphon on Z_2^10 (1024 blocks) whose red value between
   x and y is n[|x ⊕ y|]/D for eleven integers n. What is decided — the registry's definition (constants/89b.md, 89c.md,
   pinned from the pull-request branches): the monochromatic density t(K,W) + t(K,1−W) of the graphon, an exact
   rational, compared with the bound the page prints; a step graphon's density is an upper bound on the constant by
   the standard argument (colour K_n by blocks and independent coin flips), read and not re-derived.

   usage: node tools/replay-graphon.js            both implementations, the controls → certs/graphon-replay.json (~30 min:
                                                  the K5 count is minutes in each language)
          node tools/replay-graphon.js --check    the battery: the pins re-hashed; the K6 value and its controls re-derived
                                                  by the JavaScript implementation; the K5 integers re-combined; the printed
                                                  bounds re-compared; nothing written (~1 min)
   MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const zlib = require('zlib');
const os = require('os');
const ROOT = path.resolve(__dirname, '..');
const G = require(path.join(ROOT, 'instruments', 'optq', 'graphon-second.js'));
const DIR = 'corpus/optconst-queue/c89-2026-10-27';
const OUT = path.join(ROOT, 'certs', 'graphon-replay.json');
const CHECK = process.argv.includes('--check');
const T0 = Date.now();
const die = (m) => { console.error('GRAPHON REPLAY REFUSED: ' + m); process.exit(1); };
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const rd = (rel) => fs.readFileSync(path.join(ROOT, rel));
const J = (rel) => JSON.parse(rd(rel).toString('utf8'));
const PINS = J(DIR + '/PINS.json');
const pinned = (rel) => { const buf = rd(DIR + '/' + rel); if (!PINS.files[rel] || sha(buf) !== PINS.files[rel].sha256) die(rel + ' does not match its pin'); return buf; };
const secs = () => ((Date.now() - T0) / 1000).toFixed(0) + ' s';
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

/* ---- the inputs, from the pinned bytes ----------------------------------------------------------------------------- */
const K5 = JSON.parse(zlib.gunzipSync(pinned('c89b/c89b_stepgraphon_m192_D20.json.gz')).toString('utf8'));
const K6 = JSON.parse(pinned('c89c/construction.json').toString('utf8'));
if (K5.schema !== 'rational-step-graphon-v1' || K6.schema !== 'z2^10-weight-class-step-graphon-v1') die('an unexpected schema');
const R = K5.red_probability_numerators, D5 = K5.edge_probability_denominator, m = R.length;
if (!K5.block_weights.every((w) => w === 1) || K5.block_weights.length !== m) die('the K5 blocks are not of equal measure');
const nK6 = (typeof K6.n === 'string' ? JSON.parse(K6.n) : K6.n).map((v) => BigInt(v)), D6 = BigInt(K6.D);
/* the bounds the registry prints, and the exact fractions its pages state, read from the pinned pages */
const page = { '89b': pinned('upstream/constants/89b.md').toString('utf8'), '89c': pinned('upstream/constants/89c.md').toString('utf8') };
const rowK5 = /^\| \$([0-9.]+)\$\* \| \[SK2026\] \| Exact value \$(\d+)\/(\d+) = /m.exec(page['89b']) || die('the 89b page has no asterisked [SK2026] row with its exact value');
const rowK6 = /^\| \$([0-9.]+) \\cdot 2\^\{-14\}\$\* \| \[SK2026\] \| Exact value \$(\d+)\/(\d+) = /m.exec(page['89c']) || die('the 89c page has no asterisked [SK2026] row with its exact value');
const PRINTED = { k5: rowK5[1], k6: rowK6[1] };
const STATED = { k5: { num: BigInt(rowK5[2]), den: BigInt(rowK5[3]) }, k6: { num: BigInt(rowK6[2]), den: BigInt(rowK6[3]) } };

/* ---- arithmetic on the printed decimals ----------------------------------------------------------------------------- */
const decFrac = (s) => { const [a, b = ''] = s.split('.'); return { num: BigInt(a + b), den: 10n ** BigInt(b.length) }; };
const le = (x, y) => x.num * y.den <= y.num * x.den;                 // x <= y
const eq = (x, y) => x.num * y.den === y.num * x.den;
const printedIs = (value, printed, scale) => {                       // how `printed` (× scale) relates to value at its places
  const k = (printed.split('.')[1] || '').length, q = 10n ** BigInt(k);
  const v = { num: value.num * scale.num, den: value.den * scale.den };     // value / scale, as a fraction to compare at k places
  const floor = (v.num * q) / v.den, ceil = ((v.num * q) + v.den - 1n) / v.den, near = ((v.num * q) * 2n + v.den) / (2n * v.den);
  const p = BigInt(printed.replace('.', ''));
  return [['up', ceil], ['nearest', near], ['truncated', floor]].filter(([, x]) => x === p).map(([w]) => w);
};
const SCALE = { k5: { num: 1n, den: 1n }, k6: { num: 16384n, den: 1n } };   // the K6 page prints value × 2^14

/* ---- the Python implementation, run on a file ---------------------------------------------------------------------- */
function pyK5(jsonPath, label) {
  const t = Date.now();
  const r = cp.spawnSync('python3', ['-I', path.join(ROOT, 'instruments', 'optq', 'graphon_k5.py'), jsonPath, 'A'], { encoding: 'utf8', maxBuffer: 64 << 20 });
  if (r.status !== 0) die('graphon_k5.py failed on ' + label + ': ' + (r.stderr || '').slice(-400));
  const v = /^value = (\d+)\/(\d+)$/m.exec(r.stdout) || die('graphon_k5.py printed no fraction on ' + label);
  return { num: BigInt(v[1]), den: BigInt(v[2]), seconds: Math.round((Date.now() - t) / 100) / 10 };
}
function pyK6(jsonPath, label) {
  const t = Date.now();
  const r = cp.spawnSync('python3', ['-I', path.join(ROOT, 'instruments', 'optq', 'graphon_k6.py'), '--workers=' + Math.max(1, Math.min(4, os.cpus().length - 1)), jsonPath], { encoding: 'utf8', maxBuffer: 64 << 20 });
  if (r.status !== 0) die('graphon_k6.py failed on ' + label + ': ' + (r.stderr || '').slice(-400));
  const v = /^value = (\d+)\/(\d+)$/m.exec(r.stdout) || die('graphon_k6.py printed no fraction on ' + label);
  return { num: BigInt(v[1]), den: BigInt(v[2]), seconds: Math.round((Date.now() - t) / 100) / 10 };
}
const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'graphon-'));
const tmpK5 = (Rp, name) => { const p = path.join(tmpdir, name + '.json.gz'); fs.writeFileSync(p, zlib.gzipSync(JSON.stringify({ schema: K5.schema, edge_probability_denominator: D5, block_weights: K5.block_weights, red_probability_numerators: Rp }))); return p; };
const tmpK6 = (nn, name) => { const p = path.join(tmpdir, name + '.json'); fs.writeFileSync(p, JSON.stringify({ schema: K6.schema, description: K6.description, D: K6.D, n: nn.map((v) => v.toString()) })); return p; };

/* ---- the JavaScript implementation --------------------------------------------------------------------------------- */
const jsK5 = (Rp) => { const t = Date.now(); const v = G.k5Value(Rp, D5); return { num: v.num, den: v.den, Nred: v.Nred, Nblue: v.Nblue, seconds: Math.round((Date.now() - t) / 100) / 10 }; };
const jsK6 = (nn) => { const t = Date.now(); const v = G.k6Value(nn, D6); return { num: v.num, den: v.den, Nred: v.Nred, Nblue: v.Nblue, seconds: Math.round((Date.now() - t) / 100) / 10 }; };
const str = (v) => ({ num: v.num.toString(), den: v.den.toString(), decimal: G.decimals(v.num, v.den, 40) + '…', seconds: v.seconds, ...(v.Nred !== undefined ? { Nred: v.Nred.toString(), Nblue: v.Nblue.toString() } : {}) });
const perturbK5 = () => { const Rp = R.map((row) => row.slice()); Rp[0][1] += 1; Rp[1][0] += 1; return Rp; };
const perturbK6 = () => { const nn = nK6.slice(); nn[1] += 1n; return nn; };

const deciders = { js: sha(rd('instruments/optq/graphon-second.js')), pyK5: sha(rd('instruments/optq/graphon_k5.py')), pyK6: sha(rd('instruments/optq/graphon_k6.py')) };
const ppss = G.decodeGraph6(pinned('ppss/c5.graph6.txt').toString('utf8'));
const PPSS_PUBLISHED = { num: 2320651n, den: 1358954496n };          // Parczyk, Pokutta, Spiegel, Szabó: the K5 value of their 192-vertex graph

/* ---- CHECK: the record on disk against the pins, the fast re-derivations and the arithmetic ------------------------- */
if (CHECK) {
  if (!fs.existsSync(OUT)) die('no record on disk: run without --check first');
  const was = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  if (was.pins !== DIR + '/PINS.json' || was.certificateCommit !== PINS.certificateCommit) die('the record names other pins');
  const k5 = was.rows.find((r) => r.id === 'c89b-k5'), k6 = was.rows.find((r) => r.id === 'c89c-k6');
  /* the K5 integers re-combined and compared with the stated fraction and the printed bound */
  for (const [row, D] of [[k5, BigInt(D5)], [k6, D6]]) for (const side of ['js', 'py']) {
    if (side === 'js') { const v = row.js, num = BigInt(v.Nred) + BigInt(v.Nblue), den = row.id === 'c89b-k5' ? BigInt(m) ** 5n * D ** 10n : (1n << 60n) * D ** 15n; if (!eq({ num, den }, { num: BigInt(v.num), den: BigInt(v.den) })) die(row.id + ': the recorded integers do not give the recorded fraction'); }
    const v = { num: BigInt(row[side].num), den: BigInt(row[side].den) };
    if (!eq(v, STATED[row.id === 'c89b-k5' ? 'k5' : 'k6'])) die(row.id + ': the ' + side + ' value is not the fraction the page states');
    const bound = row.id === 'c89b-k5' ? decFrac(PRINTED.k5) : (() => { const d = decFrac(PRINTED.k6); return { num: d.num, den: d.den * 16384n }; })();   // the K6 page prints value × 2^14
    if (!le(v, bound)) die(row.id + ': the ' + side + ' value is above the printed bound');
  }
  if (!(k5.lePrinted && k6.lePrinted && k5.verdict === 'CERTIFIED' && k6.verdict === 'CERTIFIED' && k5.agree && k6.agree)) die('the record is not two agreeing CERTIFIED rows below their printed bounds');
  /* re-derived now: the K6 value, its perturbation control, the half-graphon controls, the PPSS control, the printed-below control */
  const k6now = jsK6(nK6); if (!eq(k6now, { num: BigInt(k6.js.num), den: BigInt(k6.js.den) })) die('the K6 value re-derived now differs from the record');
  const k6red = jsK6(perturbK6()); if (eq(k6red, k6now)) die('the K6 perturbation control did not fire');
  const half6 = G.k6Value(Array.from({ length: 11 }, () => D6 / 2n), D6); if (half6.num * 16384n !== half6.den) die('the K6 half-graphon control is not 2^-14');
  const half5 = G.k5Value([[524288, 524288, 524288], [524288, 524288, 524288], [524288, 524288, 524288]], 1048576); if (half5.num * 512n !== half5.den) die('the K5 half-graphon control is not 2^-9');
  const pp = G.k5Value(ppss, 1); if (!eq(pp, PPSS_PUBLISHED)) die('the PPSS control does not reproduce the published 2320651/1358954496');
  const below = (PRINTED.k5.slice(0, -1) + String(Number(PRINTED.k5.slice(-1)) - 1)); if (le(STATED.k5, decFrac(below))) die('the printed-below control did not fire');
  if (Object.keys(deciders).some((k) => was.deciders[k] !== deciders[k])) console.log('  note: a decider changed since the record was written — re-run without --check to refresh it');
  console.log('graphon replay holds: C_89b ≤ ' + PRINTED.k5 + ' and C_89c ≤ ' + PRINTED.k6 + '·2^-14 CERTIFIED by both implementations (the K6 value, its perturbation, the two half-graphon, the PPSS and the printed-below controls re-derived now; the K5 integers re-combined; ' + Object.keys(PINS.files).length + ' pins) · ' + secs());
  process.exit(0);
}

/* ---- FULL: both implementations on both certificates, then the controls ---------------------------------------------- */
console.log('K5: the registry prints C_89b ≤ ' + PRINTED.k5 + '* (pull request 277); the page states ' + rowK5[2].slice(0, 12) + '…/' + rowK5[3].slice(0, 12) + '…');
const k5js = jsK5(R); console.log('  js  ' + k5js.num.toString().slice(0, 20) + '…/… ' + G.decimals(k5js.num, k5js.den, 22) + '… (' + k5js.seconds + ' s)');
const k5py = pyK5(path.join(ROOT, DIR, 'c89b/c89b_stepgraphon_m192_D20.json.gz'), 'the K5 certificate'); console.log('  py  ' + G.decimals(k5py.num, k5py.den, 22) + '… (' + k5py.seconds + ' s)');
console.log('K6: the registry prints C_89c ≤ ' + PRINTED.k6 + '·2^-14* (pull request 279)');
const k6js = jsK6(nK6); console.log('  js  ' + G.decimals(k6js.num * 16384n, k6js.den, 22) + '… ×2^-14 (' + k6js.seconds + ' s)');
const k6py = pyK6(path.join(ROOT, DIR, 'c89c/construction.json'), 'the K6 certificate'); console.log('  py  ' + G.decimals(k6py.num * 16384n, k6py.den, 22) + '… ×2^-14 (' + k6py.seconds + ' s)');
const row = (id, constant, pr, printed, scale, js, py, stated, source) => {
  const agree = eq(js, py), equalsStated = eq(js, stated), lePrinted = le(js, { num: decFrac(printed).num * scale.den, den: decFrac(printed).den * scale.num });
  const how = printedIs(js, printed, scale);
  return { id, constant, claim: constant + ' <= ' + printed + (scale.num === 16384n ? ' * 2^-14' : ''), pr, source, sha256: PINS.files[source].sha256,
    js: str(js), py: str(py), agree, equalsStated, lePrinted, printedIs: how, verdict: agree && lePrinted ? 'CERTIFIED' : 'REFUSED' };
};
const rows = [
  row('c89b-k5', 'C_89b', 277, PRINTED.k5, SCALE.k5, k5js, k5py, STATED.k5, 'c89b/c89b_stepgraphon_m192_D20.json.gz'),
  row('c89c-k6', 'C_89c', 279, PRINTED.k6, SCALE.k6, k6js, k6py, STATED.k6, 'c89c/construction.json')
];
console.log('controls:');
const controls = [];
{ const a = jsK5(perturbK5()), b = pyK5(tmpK5(perturbK5(), 'k5-perturbed'), 'the perturbed K5'); controls.push({ id: 'k5-perturb', kind: 'red', what: 'R[0][1] and R[1][0] raised by one unit of 2^-20: the value must move in both implementations', js: str(a), py: str(b), fired: !eq(a, k5js) && !eq(b, k5py) && eq(a, b) }); console.log('  k5-perturb fired ' + controls[0].fired + ' (' + secs() + ')'); }
{ const a = jsK6(perturbK6()), b = pyK6(tmpK6(perturbK6(), 'k6-perturbed'), 'the perturbed K6'); controls.push({ id: 'k6-perturb', kind: 'red', what: 'n[1] raised by one unit of 2^-20: the value must move in both implementations', js: str(a), py: str(b), fired: !eq(a, k6js) && !eq(b, k6py) && eq(a, b) }); console.log('  k6-perturb fired ' + controls[1].fired); }
{ const below = PRINTED.k5.slice(0, -1) + String(Number(PRINTED.k5.slice(-1)) - 1); controls.push({ id: 'k5-printed-below', kind: 'red', what: 'a printed bound one unit below the exact value at its last place (' + below + ') must not hold', fired: !le(k5js, decFrac(below)) }); console.log('  k5-printed-below fired ' + controls[2].fired); }
{ const h5 = G.k5Value([[524288, 524288, 524288], [524288, 524288, 524288], [524288, 524288, 524288]], 1048576), h6 = G.k6Value(Array.from({ length: 11 }, () => D6 / 2n), D6); controls.push({ id: 'half-graphons', kind: 'positive', what: 'W ≡ 1/2 gives 2·2^-10 (K5) and 2·2^-15 (K6) exactly', held: h5.num * 512n === h5.den && h6.num * 16384n === h6.den }); console.log('  half-graphons held ' + controls[3].held); }
{ const pp = G.k5Value(ppss, 1); controls.push({ id: 'ppss-published', kind: 'positive', what: 'the PPSS 192-vertex 99-regular graph (Zenodo 6602512, pinned) as a 0/1 graphon gives its published K5 value 2320651/1358954496', value: str(pp), held: eq(pp, PPSS_PUBLISHED) }); console.log('  ppss-published held ' + controls[4].held); }
if (!controls.every((c) => c.kind === 'red' ? c.fired : c.held)) die('a control did not come out as it must — the record is not written');
const rec = {
  what: 'The registry\'s C_89b (K5) and C_89c (K6) Ramsey-multiplicity upper bounds (J. SK, pull requests 277 and 279) decided twice from the pinned certificates: the monochromatic density of each step graphon as an exact rational, by instruments/optq/graphon_k5.py + graphon_k6.py (Python, Fraction; an AI agent\'s implementation from the definition) and instruments/optq/graphon-second.js (JavaScript: modular counting + CRT; the reduction in BigInt), sharing no code with each other or with the claimant\'s evaluators (kept as text). CERTIFIED when both agree and the value is at or below the printed bound; the step from a graphon\'s density to the constant is the standard argument, read.',
  generated: new Date().toISOString(), git, deciders, pins: DIR + '/PINS.json', certificateCommit: PINS.certificateCommit, c89bCitedCommit: PINS.c89bCitedCommit, registryBranch: PINS.registryBranch,
  definitions: { k5: 'constants/89b.md (the PR branch): C_89b = min over 2-edge-coloured graphons of t(K5,W) + t(K5,1−W); a step graphon with m equal blocks and red value R_ij/D: t(K5,W) = m^-5 Σ over ordered 5-tuples of blocks of the product of the ten pair values, the diagonal included', k6: 'constants/89c.md (the PR branch): the same for K6 on a Z_2^10 step graphon with red value n[|x ⊕ y|]/D; the page prints the value × 2^14' },
  rows, controls, seconds: Math.round((Date.now() - T0) / 1000),
  limits: ['the densities are decided exactly; that a step graphon\'s monochromatic density bounds the constant from above is the standard random-colouring argument, read and not re-derived', 'the claimant\'s evaluators (exact5.py, k5.py, c6.c, check6.c, certify6.py, opt11.py) are pinned as text and never run', 'the 89b and 89c pages are pinned from the pull-request branches; they are not on the registry\'s main branch on 2026-10-27']
};
fs.writeFileSync(OUT, JSON.stringify(rec, null, 1) + '\n');
console.log('certs/graphon-replay.json written: ' + rows.map((r) => r.id + ' ' + r.verdict + (r.agree ? ' (both agree)' : '') + (r.equalsStated ? ', the stated fraction exactly' : '') + ', printed ' + r.printedIs.join('/')).join('; ') + ' · ' + secs());
