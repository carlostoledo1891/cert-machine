#!/usr/bin/env node
/* run-machine-claims.js — the pre-registered corpus of 100 machine claims (phase 4 of the rerun program).
   tools/ · cert-machine

   WHAT THIS IS. One hundred claims made by machines (AlphaTensor, AlphaEvolve, the EinsteinArena agents, the
   Station, FunSearch, the registry's AI-assisted entries, a GPT constant) NAMED BEFORE ANY IS DECIDED, each with
   the bytes that carry it pinned by sha256 and the rule that chose it written down. The register's defect rate on
   a corpus chosen this way is a measurement; on a corpus chosen row by row it is a selection. The manifest holds
   NO verdicts: those are written by the deciding runs into their own ledgers and reach the register through
   tools/run-claims-ledger.js like every other row. A claim whose bytes turn out not to be published is NEEDS
   DATA and stays in the hundred; nothing is dropped.

   THE POOLS AND THE RULES (the census is in corpus/targets.json, one row per pool):
     alphatensor-q    the 12 keys of alphatensor_r.npz with the smallest n·m·p not already in the register
     alphatensor-f2   the 8 keys of alphatensor_f2.npz with the smallest n·m·p not already in the register
     alphaevolve-nb-matmul  every decomposition in the results notebook's part A not already decided (15)
     alphaevolve-nb-b       every part-B section whose construction is not already decided (6)
     einstein-arena   the platform's current best for EVERY problem its API lists (29; pinned 2026-10-02)
     station-v2       ten exact constructions from the Station's artifacts (one per folder; three Kakeya sets)
     funsearch        every construction file the FunSearch repository publishes (6)
     optconst         the three asterisked registry entries a finite certificate could decide (1a, 3a, 84a)
     alphaevolve-repo the first ten of the repository's 19 "world record" problems, in its own numbering
     erdos-513        the one AI-attributed Erdős entry with a number and no object

   usage: node tools/run-machine-claims.js --write     build corpus/machine-claims-100.json from the pinned sources
          node tools/run-machine-claims.js             check it: 100 rows, unique ids, every pin re-hashed, no verdicts */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'corpus', 'machine-claims-100.json');
const die = (m) => { console.error('MACHINE CLAIMS REFUSED: ' + m); process.exit(1); };
const sha = (p) => { const f = path.join(ROOT, p); if (!fs.existsSync(f)) die('pinned file missing: ' + p); return crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'); };
const J = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

const CAPS = { 'alphatensor-q': 12, 'alphatensor-f2': 8, 'alphaevolve-nb-matmul': 15, 'alphaevolve-nb-b': 6, 'einstein-arena': 29,
  'station-v2': 10, 'funsearch': 6, 'optconst': 3, 'alphaevolve-repo': 10, 'erdos-513': 1 };

function build() {
  const rows = [];
  const add = (r) => rows.push(r);
  /* 1 · AlphaTensor, standard arithmetic: smallest n·m·p first, the register's five keys skipped */
  const npzQ = sha('corpus/sources/alphatensor_r.npz'), npzF = sha('corpus/sources/alphatensor_f2.npz');
  for (const k of ['2,2,3', '2,2,4', '2,3,3', '2,2,5', '2,2,6', '2,3,4', '2,2,7', '2,3,5', '2,2,8', '2,4,4', '3,3,4', '2,4,5'])
    add({ id: 'at-q-' + k.replace(/,/g, 'x'), pool: 'alphatensor-q', claimant: 'AlphaTensor (DeepMind, Nature 610, 2022)',
      claim: 'the factors stored under key ' + k + ' of alphatensor_r.npz are a decomposition of the ⟨' + k + '⟩ matrix-multiplication tensor of the rank the array\'s shape states, over the ring the paper names',
      object: 'three factor matrices', source: 'corpus/sources/alphatensor_r.npz key ' + k, sha256: npzQ, decider: 'instruments/strassen + tools/verify_strassen.py (exists)' });
  for (const k of ['2,2,3', '2,2,4', '2,3,3', '2,2,5', '2,3,4', '2,3,5', '2,4,4', '3,3,4'])
    add({ id: 'at-f2-' + k.replace(/,/g, 'x'), pool: 'alphatensor-f2', claimant: 'AlphaTensor (DeepMind, Nature 610, 2022)',
      claim: 'the factors stored under key ' + k + ' of alphatensor_f2.npz are a decomposition of the ⟨' + k + '⟩ tensor over F2 of the rank the array\'s shape states',
      object: 'three factor matrices over F2', source: 'corpus/sources/alphatensor_f2.npz key ' + k, sha256: npzF, decider: 'instruments/strassen + tools/verify_strassen.py (exists)' });
  /* 2 · the AlphaEvolve results notebook: part A (every decomposition but the decided 4,4,4) and six part-B constructions */
  const nb = sha('corpus/sources/alphaevolve_mathematical_results.ipynb');
  const A = [['2,4,5', 32, '0.5*Z'], ['2,4,7', 45, 'Z'], ['2,4,8', 51, 'Z'], ['2,5,6', 47, 'Z'], ['3,3,3', 23, 'Z'], ['3,4,6', 54, '0.5*Z'], ['3,4,7', 63, '0.5*C'],
    ['3,4,8', 74, 'Z'], ['3,5,6', 68, 'Z'], ['3,5,7', 80, 'Z'], ['4,4,8', 96, '0.5*C'], ['4,4,5', 61, 'Z'], ['4,4,7', 85, 'Z'], ['4,5,6', 90, 'Z'], ['5,5,5', 93, 'Z']];
  for (const [k, r, ring] of A)
    add({ id: 'ae-nb-' + k.replace(/,/g, 'x') + '-r' + r, pool: 'alphaevolve-nb-matmul', claimant: 'AlphaEvolve (DeepMind, 2025; arXiv:2506.13131)',
      claim: 'the notebook\'s "Rank-' + r + ' decomposition of <' + k + '> over ' + ring + '" is a decomposition of that tensor of rank ' + r + ' over that ring',
      object: 'three factor matrices', source: 'corpus/sources/alphaevolve_mathematical_results.ipynb (google-deepmind/alphaevolve_results @ 4226acb), section "Rank-' + r + ' decomposition of <' + k + '>"',
      sha256: nb, decider: 'tools/convert_alphaevolve.js + instruments/strassen (exists; the ring 0.5*C is new)' });
  const B = [['B.2', 'second-autocorrelation', 'the step function printed in B.2 attains the printed value of the second autocorrelation inequality\'s ratio'],
    ['B.3', 'third-autocorrelation', 'the step function printed in B.3 attains the printed value of the third autocorrelation inequality\'s ratio'],
    ['B.4', 'uncertainty', 'the function printed in B.4 attains the printed value of the uncertainty inequality\'s constant'],
    ['B.6', 'sums-differences', 'the finite set printed in B.6 attains the printed ratio for sums and differences of finite sets'],
    ['B.9', 'heilbronn-triangles', 'the point set printed in B.9 attains the printed minimum triangle area for the Heilbronn problem'],
    ['B.12', 'circles-unit-square', 'the circles printed in B.12 are disjoint, inside the unit square, and have the printed sum of radii']];
  for (const [sec, slug, claim] of B)
    add({ id: 'ae-nb-' + slug, pool: 'alphaevolve-nb-b', claimant: 'AlphaEvolve (DeepMind, 2025; arXiv:2506.13131)', claim, object: 'the construction as printed in the notebook',
      source: 'corpus/sources/alphaevolve_mathematical_results.ipynb section ' + sec, sha256: nb, decider: 'new (exact rational scoring of a printed construction; instruments/easota has the shape)' });
  /* 3 · EinsteinArena: the current best of every problem, as its API returned it on 2026-10-02 */
  const EA = J('corpus/einstein-arena/meta.json');
  for (const [file, m] of Object.entries(EA.files))
    add({ id: 'ea-best-' + m.slug, pool: 'einstein-arena', claimant: m.agent + ' (EinsteinArena, solution ' + m.solution_id + ', ' + String(m.createdAt).slice(0, 10) + ')',
      claim: 'the object is a feasible solution of "' + m.title + '" and the platform\'s score of it is ' + m.score + ' (' + m.scoring + ')',
      object: Object.entries(m.data).map(([k, v]) => k + '[' + v + ']').join(', '), source: 'corpus/einstein-arena/' + file + (m.gzip ? ' (gzip; sha256 of the JSON)' : ''),
      sha256: m.sha256, decider: 'per problem: exists for kissing, circles, heilbronn, min-distance, flat polynomials, edges-vs-triangles, overlap, autocorrelation (instruments/kissing, easota); new for the rest' });
  /* 4 · the Station's artifacts, one object per folder (three Kakeya sets) */
  const ST = 'github.com/dualverse-ai/station_data_v2 @ a4ae9192fa75 artifacts/';
  const stationRows = [
    ['st-kakeya-f3-d3-13', 'finite_kakeya/kakeya_F3_d3_13.npy', 'a 13-point Kakeya set in F3^3 (every direction is contained in a line inside the set)'],
    ['st-kakeya-f3-d4-27', 'finite_kakeya/kakeya_F3_d4_27.npy', 'a 27-point Kakeya set in F3^4'],
    ['st-kakeya-f3-d5-53', 'finite_kakeya/kakeya_F3_d5_53.npy', 'a 53-point Kakeya set in F3^5'],
    ['st-difference-basis-q89', 'difference_bases/difference_basis_q89.npy', 'a 360-mark difference basis for the group of order 89² (every nonzero element is a difference of two marks)'],
    ['st-jacobian', 'jacobian/construction.json', 'the polynomial map with the sparse rational coefficients given has the Jacobian property claimed and the collision witnesses listed collide'],
    ['st-kakeya-needle', 'kakeya_needle/kakeya_needle_offsets.npz', 'the discretized Kakeya needle construction with the given offsets attains the bound in construction_metadata.json'],
    ['st-flat-autoconvolution', 'flat_autoconvolution/autocorr_6-3_weights.npy', 'the nonnegative step function with these weights attains the autocorrelation bound the README states'],
    ['st-peak-autoconvolution', 'peak_autoconvolution/autocorr_6-2_weights.npy', 'the step function with these weights attains the peak bound the README states (its local-minimum certificate in local_minima_n14_certificate.json)'],
    ['st-min-overlap', 'erdos_minimum_overlap/autocorr_6_5_certificate_data.npz', 'the upper-bound step function in the archive attains the printed minimum-overlap bound, and the lower-bound certificate data decide the printed lower bound'],
    ['st-sign-uncertainty', 'sign_uncertainty/uncertainty_data.json.gz', 'the witness in the archive (exact coefficients and roots) attains the sign-uncertainty bound the README states']];
  for (const [id, f, claim] of stationRows) {
    const local = 'corpus/station-v2/' + f;
    const have = fs.existsSync(path.join(ROOT, local));
    add({ id, pool: 'station-v2', claimant: 'The Station agents (dualverse-ai; station_data_v2)', claim, object: 'the file as published',
      source: (have ? local : 'https://raw.githubusercontent.com/dualverse-ai/station_data_v2/a4ae9192fa75/artifacts/' + f + ' (hash only, 14.6 MB)') + ' — ' + ST + f,
      sha256: have ? sha(local) : '04440bb9d0239a68ed38b7d780462380c2b698fdf54f0917c628ff7df35b9826', hashOnly: !have, decider: id.startsWith('st-kakeya-f3') || id.startsWith('st-difference') ? 'new, finite (exact enumeration)' : id === 'st-jacobian' ? 'instruments/polymaps (exists)' : 'new (exact rational scoring)' });
  }
  /* 5 · FunSearch: every construction file the repository publishes */
  const FS = 'github.com/google-deepmind/funsearch @ cc53f274237d ';
  const fsRows = [['fs-capset-n8-512', 'cap_set/n8_size512.txt', 'the 512 points listed form a cap set in F3^8 (no three on a line)', null],
    ['fs-admissible-n12-w7-792', 'admissible_set/admissible_set_n12_w7_size792.txt', 'the 792 vectors listed form an admissible set with parameters n = 12, w = 7', null],
    ['fs-admissible-n15-w10-3003', 'admissible_set/admissible_set_n15_w10_size3003.txt', 'the 3003 vectors listed form an admissible set with n = 15, w = 10', null],
    ['fs-admissible-n21-w15-43596', 'admissible_set/admissible_set_n21_w15_size43596.txt', 'the 43,596 vectors listed form an admissible set with n = 21, w = 15', '9244c0bdbe325b9e9a086492968c40510a940c22aaa9bc71e37e2f3ee15d802d'],
    ['fs-admissible-n24-w17-237984', 'admissible_set/admissible_set_n24_w17_size237984.txt', 'the 237,984 vectors listed form an admissible set with n = 24, w = 17', '4ea8df561f46898c9069c0c87f00fa9aaa65cb731c66977302f585442812f86e'],
    ['fs-cyclic-nodes11-n4-754', 'cyclic_graphs/nodes11_n4_size754.txt', 'the 754 vertices listed form an independent set in the fourth strong power of the cyclic graph on 11 nodes', null]];
  for (const [id, f, claim, h] of fsRows)
    add({ id, pool: 'funsearch', claimant: 'FunSearch (DeepMind, Nature 625, 2023)', claim, object: 'the file as published',
      source: (h ? 'https://raw.githubusercontent.com/google-deepmind/funsearch/cc53f274237d/' + f + ' (hash only)' : 'corpus/funsearch/' + f) + ' — ' + FS + f,
      sha256: h || sha('corpus/funsearch/' + f), hashOnly: !!h, decider: 'new, finite (exact enumeration of the defining property)' });
  /* 6 · the registry's three decidable asterisks */
  const OC = [['oc-1a', '1a', 'Sidon autocorrelation constant C1a: the asterisked bound 1.292* holds for the published step function'],
    ['oc-3a', '3a', 'the Gyarmati–Hennecart–Ruzsa constant C3a: the asterisked bound 1.19519192* holds for the published (Lean-formalised) masked-digit constructions'],
    ['oc-84a', '84a', 'the Erdős unit-distance exponent C84a: the asterisked bound 1.03583* follows from the chain of rows the entry cites']];
  for (const [id, c, claim] of OC)
    add({ id, pool: 'optconst', claimant: 'teorth/optimizationproblems contributors (AI-assisted entries)', claim, object: 'the certificate the entry links',
      source: 'corpus/optimization-constants/registry/' + c + '.md (teorth/optimizationproblems @ 2c1968cd520b constants/' + c + '.md)', sha256: sha('corpus/optimization-constants/registry/' + c + '.md'),
      decider: id === 'oc-1a' ? 'new (a Bessel-kernel integral; the EinsteinArena autocorrelation instrument has the shape)' : 'new' });
  /* 7 · the AlphaEvolve repository of problems: its first ten "world record" problems */
  const AE = 'github.com/google-deepmind/alphaevolve_repository_of_problems @ 8f447457957d';
  const aeRows = [[1, 'finite_field_kakeya_problem / finite_field_nikodym_problem'], [2, 'autocorrelation_problems'], [4, '(experiment not named in the page)'], [5, 'autocorrelation_problems'],
    [7, 'difference_bases'], [8, '(experiment not named in the page)'], [9, 'kakeya_needle_2d'], [10, 'kakeya_needle_3d'], [30, 'arithmetic_kakeya_conjecture'], [32, 'spherical_t_designs']];
  for (const [n, exp] of aeRows)
    add({ id: 'ae-repo-' + n, pool: 'alphaevolve-repo', claimant: 'AlphaEvolve (Georgiev, Gómez-Serrano, Tao, Wagner; arXiv:2511.02864)',
      claim: 'problem ' + n + ' (status.json: world_record; experiments: ' + exp + '): the construction the repository publishes attains the record it states',
      object: 'whatever the experiments folder at the pinned commit holds — a construction file decides, a program alone is NEEDS DATA (claimant code is never run)',
      source: 'corpus/alphaevolve-problems/' + n + '.html — ' + AE + ' problems/' + n + '.html', sha256: sha('corpus/alphaevolve-problems/' + n + '.html'), decider: 'per problem; new unless the shape matches an existing instrument' });
  /* 8 · the one AI-attributed Erdős entry with a number */
  add({ id: 'erdos-513-gpt', pool: 'erdos-513', claimant: 'GPT (prompted by Sothanaphan), as erdosproblems.com/513 records it',
    claim: 'B > 0.5850788 for Erdős #513 (the liminf ratio of the maximal term to the maximum modulus of a transcendental entire function)',
    object: 'none published on the page — the extremal function would decide it', source: 'corpus/sources/erdosproblems-513_2026-10-02.html', sha256: sha('corpus/sources/erdosproblems-513_2026-10-02.html'), decider: 'NEEDS DATA unless the function is published' });
  return rows;
}

const WHAT = 'One hundred machine claims, named before any is decided (the rerun program\'s phase 4, pre-registered 2026-10-02): each row the bytes that carry the claim pinned by sha256, the pool whose rule chose it, the claimant and the decider expected. NO verdicts live here; the deciding runs write their own ledgers and the register derives its rows from them. A row whose object turns out not to be published is NEEDS DATA and stays; nothing is dropped. The rules per pool are in tools/run-machine-claims.js; the census per pool is in corpus/targets.json.';

if (process.argv.includes('--write')) {
  const rows = build();
  fs.writeFileSync(OUT, JSON.stringify({ what: WHAT, registered: '2026-10-02', count: rows.length, caps: CAPS, rows }, null, 1) + '\n');
  console.log('corpus/machine-claims-100.json written: ' + rows.length + ' rows');
}
/* the check */
if (!fs.existsSync(OUT)) die('corpus/machine-claims-100.json missing — run --write once');
const M = J('corpus/machine-claims-100.json');
if (M.count !== 100 || M.rows.length !== 100) die('the manifest does not hold 100 rows (' + M.rows.length + ')');
if (new Set(M.rows.map((r) => r.id)).size !== 100) die('duplicate ids');
const byPool = {};
for (const r of M.rows) byPool[r.pool] = (byPool[r.pool] || 0) + 1;
for (const [p, n] of Object.entries(M.caps)) if (byPool[p] !== n) die('pool ' + p + ' holds ' + byPool[p] + ' rows, declared ' + n);
if (Object.keys(byPool).some((p) => !(p in M.caps))) die('a row names an undeclared pool');
let rehashed = 0, hashOnly = 0;
for (const r of M.rows) {
  for (const k of ['id', 'pool', 'claimant', 'claim', 'object', 'source', 'sha256', 'decider']) if (!r[k]) die('row ' + r.id + ' lacks ' + k);
  if (r.verdict !== undefined) die('row ' + r.id + ' carries a verdict — the manifest is a pre-registration, verdicts live in the deciding ledgers');
  if (!/^[0-9a-f]{64}$/.test(r.sha256)) die('row ' + r.id + ' has no sha256');
  if (r.hashOnly) { hashOnly++; continue; }
  const f = r.source.split(' ')[0];
  if (!/^(?:corpus|certs)\//.test(f)) die('row ' + r.id + ' source names no local file: ' + r.source);
  const h = r.source.includes('(gzip') ? crypto.createHash('sha256').update(require('zlib').gunzipSync(fs.readFileSync(path.join(ROOT, f)))).digest('hex') : sha(f);
  if (h !== r.sha256) die('row ' + r.id + ': ' + f + ' no longer hashes to its pin');
  rehashed++;
}
/* the rebuilt manifest must equal the committed one: the rule, not a hand, chooses the rows */
const rebuilt = build();
if (JSON.stringify(rebuilt) !== JSON.stringify(M.rows)) die('the manifest on disk differs from what the rules build — run --write and say why in the commit');
console.log('machine-claims-100: 100 rows in ' + Object.keys(byPool).length + ' pools, ' + rehashed + ' pins re-hashed, ' + hashOnly + ' hash-only, 0 verdicts — the pre-registration holds');
