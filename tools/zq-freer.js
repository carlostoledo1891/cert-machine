#!/usr/bin/env node
/* zq-freer.js — the finite facts of Cameron Freer's conditional quartic stack on elliotglazer/diophantine-z-q
   (#8 389 variables, #9 385, #11 385 with 682-digit coefficients, #12 383, #13 380 (and an order-47 383),
   #16 380 with 679 digits (and an order-47 383 with 644)), as a non-author review: T the tables, N a necessary condition
   for each to be a sum of squares, A the finite statements the proofs display, B the bindings of the published bytes to
   the pull requests, V13 #8's comparison rows. Writes certs/zq-freer-2026-11-08.json; `--check` re-derives it and
   refuses on any difference.

   THE THEOREM IS UNDECIDED HERE, and so is each pull request's conditional claim. The quadratic residuals whose squares
   are said to give each table are not published, so the sum of squares itself is not decided.

   Pre-registered in notes/zq-freer-preregistration-2026-11-08.md before this file ran (#13 and #16: amendment B).

   CLEAN ROOM: written from the PR texts, the proofs' displayed statements and the tables as they stand. None of the
   repository's .py or .cjs is run, read or ported. Their bytes stay outside cert-machine (unlicensed: nothing is copied
   here), in $ZQ_FREER_DIR, default ~/Projects/zq-scout/freer-2026-11-08: a bare clone (zq.git, refs/pull/N/head as
   prN), the fork's CI artifacts as downloaded (ci/), the API metadata of the runs and PRs (ci/meta, meta/). git reads
   blobs and trees by commit; every byte read is hashed into the record.

   usage: node tools/zq-freer.js [--check]                                                                        MIT */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync, spawnSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const DIR = process.env.ZQ_FREER_DIR || path.join(os.homedir(), 'Projects', 'zq-scout', 'freer-2026-11-08');
const GITDIR = path.join(DIR, 'zq.git');
const OUT = path.join(ROOT, 'certs', 'zq-freer-2026-11-08.json');
const die = (m) => { console.error('zq-freer: ' + m); process.exit(1); };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
if (!fs.existsSync(GITDIR)) die('no clone at ' + GITDIR + ' (set ZQ_FREER_DIR)');

/* ---- git, read-only ------------------------------------------------------------------------------------------------ */
const git = (args, opts = {}) => execFileSync('git', ['--git-dir', GITDIR, ...args], { maxBuffer: 1 << 28, ...opts });
const blob = (commit, p) => git(['cat-file', 'blob', commit + ':' + p]);
const treeId = (commit, p) => { try { return git(['rev-parse', commit + ':' + p]).toString().trim(); } catch (e) { return null; } };
const isAncestor = (a, b) => spawnSync('git', ['--git-dir', GITDIR, 'merge-base', '--is-ancestor', a, b]).status === 0;
const nameStatus = (a, b) => git(['diff', '--no-renames', '--name-status', a, b]).toString().split('\n').filter(Boolean).map((l) => { const [s, p] = l.split('\t'); return { s, p }; });
const numstat = (a, b) => new Map(git(['diff', '--no-renames', '--numstat', a, b]).toString().split('\n').filter(Boolean).map((l) => { const [ad, de, p] = l.split('\t'); return [p, { added: ad, deleted: de }]; }));
const filesUnder = (commit, dir) => git(['ls-tree', '-r', '--name-only', commit, dir]).toString().split('\n').filter(Boolean);

/* ---- the pins (pre-registration) ----------------------------------------------------------------------------------- */
const BASE = '9c0b3aba60d90fdcac82115f0582a6f52f1054f7';
const HEAD = { 8: 'ad7fc75610fb325313a1afd73b2bfbc4ba5a0d71', 9: '51111cc97d0f42d50338ae378268700c457497f9', 11: 'e8654b2ca24a424cead6b62f3f790136a170d953', 12: '772fe96a0e65bee76db500d8ef3a7a6b5e884d1f',
  13: '31563264ba3dfbc3f00b4b08c099e9380caacd42', 16: '59c59e5589d86036ee41994c82a2b900fce85c2d' };
const PRS = [8, 9, 11, 12, 13, 16];
const TWO = new Set([13, 16]);   /* the PRs with two tables: an order-45 default and an order-47 optional route */
const ORDERS = [45, 47];
const PREPROTOCOL = { 8: '490d14ef06d3369b7a68a07a5202e017d794549c', 9: '6fd131e7ca150d7a023bcb6ac4f1971912705fab', 11: 'e3444641dffc2d1cf5a9791111d584110e5dd111', 12: 'a1f9233049cc0f8aeb2a6ccd7e7b613cec3c1ec0' };
const PARENT = { 9: 8, 11: 9, 12: 11, 13: 12, 16: 13 };
const PKG8 = 'research/conditional-quartic-reduction';
const PACKET = { 8: PKG8, 9: 'research/factored-pole-reduction', 11: 'research/scalar-chain-reduction', 12: 'research/scalar-preparation-zero', 13: 'research/detector-cube-reuse', 16: 'research/height-consumer-refinement' };
const WORKFLOW = { 8: '.github/workflows/research-checks.yml', 9: '.github/workflows/research-checks.yml', 11: '.github/workflows/research-checks.yml', 12: '.github/workflows/scalar-preparation-zero.yml', 13: '.github/workflows/detector-cube-reuse.yml', 16: '.github/workflows/height-consumer-refinement.yml' };
const FORK_ORIGIN = 'bc51100fd3ada82df0dac55d6f1d235219430c74';   /* the fork commit #13's references/ORIGIN.json names */
const T9 = 'quartic-385/candidate385/quartic-385-balanced-decimal.txt', T11 = 'scalar-chain/factored/quartic-385-balanced-decimal.txt', T12 = 'factored/quartic-383-balanced-decimal.txt';
const T380 = 'quartic-380-balanced-decimal.txt', T383 = 'quartic-383-balanced-decimal.txt';
const CI = {   /* local folder -> [run id, head_sha, artifact id, API zip digest] */
  'pr9-42500725633': [42500725633, HEAD[9], 13625113430, 'sha256:08d5314b67e1e013f59508d8437ad3ec939b6bda3facec46074d3e14443669c7'],
  'pr9early-42440965320': [42440965320, PREPROTOCOL[9], 13600674808, 'sha256:e056ae060e79ca6a6eeb452b1b44fd0bf950f7101858eda3088fdf22dfaf78cd'],
  'pr11-42500730137': [42500730137, HEAD[11], 13624594135, 'sha256:3b2e816e3c7d9894761ccd3008f27fbc74bb8881e642b3d950e4b40ff359b24f'],
  'pr11b-42500725279': [42500725279, HEAD[11], 13624668724, 'sha256:ae7878303ae67c5972d2c4d0065f905554ff39c254d5e1eb7bc17d76e77433cb'],
  'pr11early-42446323061': [42446323061, PREPROTOCOL[11], 13604070400, 'sha256:5290a080aeaf94c8ad78ce1eb4ef041935e1c12081e51518b240e31a7a5b4e2a'],
  'pr12r-42500728544': [42500728544, HEAD[12], 13625203191, 'sha256:089a26e062565a5bb7fddd7312d5b9fc6ecf4eef72a674ac4b857ce12fdca413'],
  'pr12-42500725217': [42500725217, HEAD[12], 13625182045, 'sha256:96197cca2331fb602b91046d9f8fe5aca7ce82771ad2e1452488e8f70bb93bd3'],
  'pr12b-42500728630': [42500728630, HEAD[12], 13624639044, 'sha256:20053d2c73d9d044045ac722b847bde11d1b1cf788d097d28dda7ee2ee94a9b4'],
  'pr12early-42447547426': [42447547426, PREPROTOCOL[12], 13603872835, 'sha256:0f406ceec27e0ce221344f20430f13f7f4b1bf0261cc3b3a22b5ebfb6ca5f5f6'],
  'pr8-42500725092': [42500725092, HEAD[8], 13625392573, 'sha256:6c1f06c11e6e4453ba49a6182a6210547c86149f6381031d2adce527ece3832f'],
  /* amendment B: the tables of #13 and #16, and the parents' tables at #13's and #16's heads */
  'pr13-cube45-42501591301': [42501591301, HEAD[13], 13625523752, 'sha256:9449925e3eff12a86ced43243945f4b4f3c443e53acaf842281c8467bd5237e9'],
  'pr13-cube47-42501591301': [42501591301, HEAD[13], 13625249620, 'sha256:b64df95e105a65889d60f0d376f2c4ee5a0abf7f710afc6012d7c10898551816'],
  'pr13r-cube45-42502112522': [42502112522, HEAD[13], 13625698927, 'sha256:acf6d65cafe098544fab064075182c3458237c8d23db1920e833fa25a9026b41'],
  'pr13r-cube47-42502112522': [42502112522, HEAD[13], 13626330627, 'sha256:2d1b2e261c80159512721ab1f825b433142ea0916c86c3280d7108c02e4b08b9'],
  'pr16-cube45-42537804191': [42537804191, HEAD[16], 13639254217, 'sha256:f73294360d04abc7a54a41559f15f8df58b2f692d20bae741fa8c8bd32a8da7e'],
  'pr16-cube47-42537804191': [42537804191, HEAD[16], 13639793760, 'sha256:ad6b9f8fd697e24935d7c1e754edd70e2c04de38a802f0c911ee0c005be0bcac'],
  'pr16r-cube45-42537807736': [42537807736, HEAD[16], 13639747706, 'sha256:c00b3fb49aba45a97b705a6980011217c48c5005b299eae66590b3be533591b6'],
  'pr16r-cube47-42537807736': [42537807736, HEAD[16], 13639624776, 'sha256:28d6f63119736de3557b2f0f353c41fc3359c04c0f1c73afd541dff6d7d87681'],
  'pr16-height45-42537804182': [42537804182, HEAD[16], 13639782567, 'sha256:a55ef08ec41c3e5575d09de278d1439d78d42043d9b25cdcbd6229794688fed6'],
  'pr16-height47-42537804182': [42537804182, HEAD[16], 13640605459, 'sha256:010a219bee5a19d13b6f11b5c66a52d59eb7a05c8693cb6697470838af726461'],
  'pr16r-height45-42537807726': [42537807726, HEAD[16], 13640360615, 'sha256:c1694af9c6e57880985a02108c0f2bfabac88dfa207ded5895649a996fd92757'],
  'pr16r-height47-42537807726': [42537807726, HEAD[16], 13640171921, 'sha256:74d6212efb8e5777c0a4026e3e2ba5f9cb503b55bab48dddca696b129e874dc6'],
  'pr13-chain-42501591246': [42501591246, HEAD[13], 13626170175, 'sha256:5941f62a65b363ea6316ee020aa341c6226f1cd550ecfc9a4d70b4eb3a16309e'],
  'pr13r-chain-42502112489': [42502112489, HEAD[13], 13625971972, 'sha256:b110809d40cad152c149b8dec23f251eef0fd5a4f2d092785cf08f5ea7bab3e9'],
  'pr16-chain-42537804236': [42537804236, HEAD[16], 13640750036, 'sha256:e4ea3d0a82527c881be45b281e36f411b78b7f38924011b6c3ebe84868888929'],
  'pr16r-chain-42537807727': [42537807727, HEAD[16], 13640431221, 'sha256:0270b8268f0e9a1cc01d7132568d81e86f9caf58ccb5d9ecacd015356994b514'],
  'pr13-prep-42501591237': [42501591237, HEAD[13], 13625548867, 'sha256:0aac185245421fb4446346f7017d1984a5115066c29e44d4384c425cdef205aa'],
  'pr13r-prep-42502112560': [42502112560, HEAD[13], 13625812996, 'sha256:38f6185d62434257d8adb6799d5745b6fe6f1cc3969e0f383eb34b54198d2407'],
  'pr16-prep-42537804187': [42537804187, HEAD[16], 13639903235, 'sha256:7f5e8ca4f846771fd3285aaf8974b3291deba07c70c60b0ee33c8741b1a10906'],
  'pr16r-prep-42537807728': [42537807728, HEAD[16], 13640386140, 'sha256:cd0c40aee7f16a7648d8f2775693dcc55ea8f26568199eaa6741c90642695580'],
};
const CHAIN_AT_NEW = ['pr13-chain-42501591246', 'pr13r-chain-42502112489', 'pr16-chain-42537804236', 'pr16r-chain-42537807727'];
const PREP_AT_NEW = ['pr13-prep-42501591237', 'pr13r-prep-42502112560', 'pr16-prep-42537804187', 'pr16r-prep-42537807728'];
const P3 = (e) => 28902n * 3n ** e;
const VAR = (n, residuals, m, e, digits, bits, bytes, sha256, copies) => ({ n, residuals, m, max: P3(e), maxText: '28902*3^' + e, digits, bits, bytes, sha256, copies });
const CLAIM = {
  8: { n: 389, residuals: 357, m: 26295, max: P3(1576n), maxText: '28902*3^1576', digits: 757, bits: 2513, bytes: 1050826, sha256: '1c612d20915667dfd81a7895f8d93231d5efeaf86ecfaa15194408d298d35573',
    table: { commit: HEAD[8], path: PKG8 + '/tables/quartic-389-balanced-decimal.txt' } },
  9: { n: 385, residuals: 353, m: 26235, max: P3(1576n), maxText: '28902*3^1576', digits: 757, bits: 2513, bytes: 1048785, sha256: '47da004230ff7a20c7a0824738422eb9c29c4a6e6de92455e3d956e979161ecf',
    copies: [['pr9-42500725633', T9], ['pr9early-42440965320', T9], ['pr11-42500730137', T9], ['pr11b-42500725279', T9], ['pr11early-42446323061', T9], ['pr12r-42500728544', T9], ...CHAIN_AT_NEW.map((f) => [f, T9])] },
  11: { n: 385, residuals: 353, m: 26200, max: P3(1420n), maxText: '28902*3^1420', digits: 682, bits: 2266, bytes: 1038398, sha256: 'c9e3e65c64c360c1cbf22c44704776c000294a1a7028e6f3f80bbe500243bdfb',
    copies: [['pr11-42500730137', T11], ['pr11b-42500725279', T11], ['pr11early-42446323061', T11], ['pr12r-42500728544', T11], ...CHAIN_AT_NEW.map((f) => [f, T11])] },
  12: { n: 383, residuals: 352, m: 26019, max: P3(1420n), maxText: '28902*3^1420', digits: 682, bits: 2266, bytes: 1025272, sha256: '8faea54ef4a9d8cf155205a50c956df20d36e3eec4183b50b39b2c0b87183b0d',
    copies: [['pr12-42500725217', T12], ['pr12b-42500728630', T12], ['pr12early-42447547426', T12], ...PREP_AT_NEW.map((f) => [f, T12])] },
  13: { variants: {
    45: VAR(380, 349, 26025, 1420n, 682, 2266, 1025480, '373c624d3b1293809e521ab8113052ff473f1b14ea1cde2facb361979515f6e5', ['pr13-cube45-42501591301', 'pr13r-cube45-42502112522', 'pr16-cube45-42537804191', 'pr16r-cube45-42537807736'].map((f) => [f, T380])),
    47: VAR(383, 352, 26043, 1344n, 646, 2146, 1022041, '8ac84ab634f1636110d9c33df9613612110b44b6e9a044469873b51ef0e91ebc', ['pr13-cube47-42501591301', 'pr13r-cube47-42502112522', 'pr16-cube47-42537804191', 'pr16r-cube47-42537807736'].map((f) => [f, T383])) } },
  16: { variants: {
    45: VAR(380, 349, 26025, 1412n, 679, 2253, 1025094, 'a194dd94682d4e458d0e03407e39aea056a6626014210c384b3a9c80f19a43e6', ['pr16-height45-42537804182', 'pr16r-height45-42537807726'].map((f) => [f, T380])),
    47: VAR(383, 352, 26043, 1340n, 644, 2139, 1021849, 'd2e9856dcbd752a156548e37545f48ed8e1e8d263c5b374aad5a19f44f8eab6f', ['pr16-height47-42537804182', 'pr16r-height47-42537807726'].map((f) => [f, T383])) } },
};
const PROOF = {
  8: { commit: HEAD[8], path: PKG8 + '/proofs/arithmetic_round8.tex' }, deps8: { commit: HEAD[8], path: PKG8 + '/PR_DEPENDENCIES.md' },
  9: { commit: HEAD[9], path: PACKET[9] + '/PROOF.md' }, 11: { commit: HEAD[11], path: PACKET[11] + '/PROOF.md' }, 12: { commit: HEAD[12], path: PACKET[12] + '/PROOF.md' },
  13: { commit: HEAD[13], path: PACKET[13] + '/PROOF.md' }, ref13: { commit: HEAD[13], path: PACKET[13] + '/references/precision51_PROOF.md' },
  16: { commit: HEAD[16], path: PACKET[16] + '/PROOF.md' },
};
const PROOF_LABEL = { deps8: '#8 PR_DEPENDENCIES.md', ref13: '#13 retained order-47 proof (references/precision51_PROOF.md)' };
const V13 = {
  ordinary: { commit: BASE, path: 'docs/manuscript-revisions/version13/evidence/30d039965a0c90c2-quartic-411-ordinary-coefficients.txt', n: 411, m: 6388, bits: 3247, bytes: 214957 },
  symbolic: { commit: BASE, path: 'docs/manuscript-revisions/version13/evidence/652b594a94f6f7e8-quartic-394-symbolic-coefficients.txt', n: 394, m: 6338, maxC: 2, maxCoef: 16n },
};
const UNDECIDED = 'The theorem (Z is Diophantine in Q) is undecided here, and so is the conditional claim of each pull request (that the rational zero projection of its quartic is Z, given the inherited arithmetic inputs). This decides finite facts only: what the published coefficient tables are, a necessary condition for each to be a sum of squares, the finite integer inequalities and polynomial identities the proofs display, and how the published bytes are bound to the pull requests. The quadratic residuals whose squares are said to give each table (357, 353, 353 and 352 for #8, #9, #11 and #12; 349 and 352 for each of the two tables of #13 and of #16) are not among the published bytes, so that the table is their sum of squares, and that they are the compiled source system, is not decided.';
const NOT_DECIDED = [
  'the theorem, and each pull request\'s conditional claim that the rational zero projection of its quartic is Z',
  'the eleven inherited inputs of PR_DEPENDENCIES.md: G_curve, G_formal, G_quaternion, G_height_geometry, G_pole, G_one_place, G_product_height, G_prime_pattern, G_reductions, G_progression, G_lucas',
  'the local proofs (detector promotion, height reapplication, factored poles, scalar chain, preparation zero, cubic reuse, height-consumer refinement) beyond the finite statements in A; the application contracts and their nine obligations',
  'that the table is the sum of the squares of its quadratic residuals, that these are the compiled source system, that the compiler and the diagonal change preserve the input projection, that the source system expresses the arithmetic predicate: the residuals (balanced/integer-ir.json; for #13 and #16 also balanced/polynomial.json, final/integer-candidate-ir.json and raw-translated-ir.json, pinned by hash in EXPECTED.json) are neither committed nor uploaded',
  'for #13 and #16: the gate and raw-row comparisons, the cubic\'s presence as affine aliases in the actual builder, the omission of the two unused preparation slots, the four conic transports, the diagonal maps',
  'in #13\'s retained order-47 argument: the valuation, CRT, completeness and pole arguments beyond its displayed finite statements',
  'in #16: the projective-height transfer and the varying-anchor equivalence beyond the displayed finite statements, the monotonicity step of the Lucas endpoint test, the reevaluated private anchor gate and its conic witnesses',
  'the 391/392/393-variable variants of #8, and #17 (above #16)',
];

/* ---- exact arithmetic ---------------------------------------------------------------------------------------------- */
const babs = (a) => (a < 0n ? -a : a);
const bgcd = (a, b) => { a = babs(a); b = babs(b); while (b) [a, b] = [b, a % b]; return a; };
const bits = (a) => (a === 0n ? 0 : babs(a).toString(2).length);
const digits = (a) => babs(a).toString().length;
const fr = (n, d = 1n) => { if (d === 0n) throw new Error('zero denominator'); if (d < 0n) { n = -n; d = -d; } const g = bgcd(n, d) || 1n; return [n / g, d / g]; };
const fadd = (a, b) => fr(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
const fsub = (a, b) => fr(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
const fmul = (a, b) => fr(a[0] * b[0], a[1] * b[1]);
const fdiv = (a, b) => fr(a[0] * b[1], a[1] * b[0]);
const fsign = (a) => (a[0] > 0n ? 1 : a[0] < 0n ? -1 : 0);
const flt = (a, b) => a[0] * b[1] < b[0] * a[1];
const feq = (a, b) => a[0] === b[0] && a[1] === b[1];
const fpow = (a, e) => { let r = [1n, 1n]; for (let i = 0; i < e; i++) r = fmul(r, a); return r; };
const fshow = (a) => (a[1] === 1n ? String(a[0]) : a[0] + '/' + a[1]);

/* ---- T: the tables ------------------------------------------------------------------------------------------------- */
class Stop extends Error {}
const stop = (m) => { throw new Stop(m); };
/* a monomial: sorted [[index, exponent], ...]; its key 'i^e*j^f' */
const mkey = (mono) => mono.map(([i, e]) => i + '^' + e).join('*');
function parseFreer(buf, what) {
  const lines = buf.toString('utf8').split('\n'); if (lines[lines.length - 1] === '') lines.pop();
  const header = []; const P = new Map(); let rows = 0, repeated = 0, zeroRows = 0;
  for (let k = 0; k < lines.length; k++) {
    const l = lines[k];
    if (l.startsWith('#')) { if (rows) stop(what + ': a comment after the data, line ' + (k + 1)); header.push(l); continue; }
    const f = l.split('\t');
    if (f.length !== 2 || !/^-?(0|[1-9]\d*)$/.test(f[0])) stop(what + ': line ' + (k + 1) + ' is not "integer TAB monomial"');
    const ex = new Map();
    if (f[1] !== '1') for (const fac of f[1].split('*')) {
      const m = /^x(0|[1-9]\d*)(?:\^([1-9]\d*))?$/.exec(fac);
      if (!m) stop(what + ': line ' + (k + 1) + ' has a malformed factor ' + JSON.stringify(fac));
      const i = Number(m[1]), e = m[2] ? Number(m[2]) : 1; ex.set(i, (ex.get(i) || 0) + e);
    }
    const mono = [...ex.entries()].sort((a, b) => a[0] - b[0]); const key = mkey(mono); const c = BigInt(f[0]);
    rows++; if (c === 0n) zeroRows++;
    const o = P.get(key); if (o) { repeated++; o.c += c; if (o.c === 0n) P.delete(key); } else if (c !== 0n) P.set(key, { c, mono });
  }
  return { P, header, rows, repeated, zeroRows };
}
function decideT(buf, claim, what, { checkSha = true } = {}) {
  const differs = [];
  const h = sha(buf);
  if (checkSha && h !== claim.sha256) differs.push('sha256 ' + h + ' (stated ' + claim.sha256 + ')');
  if (checkSha && buf.length !== claim.bytes) differs.push('bytes ' + buf.length + ' (stated ' + claim.bytes + ')');
  const R = parseFreer(buf, what);
  const hm = /^# Variables: (\d+); input: x0; degree: (\d+); monomials: (\d+)\.$/.exec(R.header[1] || '');
  const used = new Set(); let deg = 0, maxAbs = 0n, content = 0n;
  for (const { c, mono } of R.P.values()) {
    let d = 0; for (const [i, e] of mono) { used.add(i); d += e; }
    deg = Math.max(deg, d); if (babs(c) > maxAbs) maxAbs = babs(c); content = bgcd(content, c);
  }
  const maxIndex = used.size ? Math.max(...used) : -1;
  const x04 = R.P.get('0^4'); const x04c = x04 ? x04.c : 0n;
  const n = { sha256: h, bytes: buf.length, dataRows: R.rows, repeatedMonomialRows: R.repeated, zeroCoefficientRows: R.zeroRows, monomials: R.P.size, degree: deg, variables: used.size, maxIndex, maxAbsCoefficientDigits: digits(maxAbs), maxAbsCoefficientBits: bits(maxAbs), maxEqualsStated: maxAbs === claim.max, content: String(content), x0FourthCoefficient: String(x04c), header: hm ? { variables: +hm[1], degree: +hm[2], monomials: +hm[3] } : null };
  if (!hm || +hm[1] !== claim.n || +hm[2] !== 4 || +hm[3] !== claim.m) differs.push('the header does not state ' + claim.n + ' variables, degree 4, ' + claim.m + ' monomials');
  if (n.monomials !== claim.m) differs.push('monomials ' + n.monomials + ' (stated ' + claim.m + ')');
  if (deg !== 4) differs.push('degree ' + deg);
  if (used.size !== claim.n || maxIndex !== claim.n - 1) differs.push('variables ' + used.size + ', largest index ' + maxIndex + ' (stated ' + claim.n + ', x0..x' + (claim.n - 1) + ')');
  if (maxAbs !== claim.max) differs.push('max |coefficient| is not ' + claim.maxText + ' (' + digits(maxAbs) + ' digits, ' + bits(maxAbs) + ' bits)');
  if (digits(claim.max) !== claim.digits || bits(claim.max) !== claim.bits) differs.push(claim.maxText + ' has ' + digits(claim.max) + ' digits and ' + bits(claim.max) + ' bits (stated ' + claim.digits + ', ' + claim.bits + ')');
  if (content !== 1n) differs.push('content ' + content);
  if (x04c !== 1n) differs.push('x0^4 coefficient ' + x04c);
  return { verdict: differs.length ? 'REFUTED' : 'CERTIFIED', differs, numbers: n, P: R.P };
}

/* ---- N: a necessary condition for a sum of squares ----------------------------------------------------------------- */
function evalAt(P, point) {   /* point: Map index -> rational; unlisted coordinates are 0 */
  let s = [0n, 1n];
  for (const { c, mono } of P.values()) {
    let t = [c, 1n], zero = false;
    for (const [i, e] of mono) { const x = point.get(i); if (!x || x[0] === 0n) { zero = true; break; } t = fmul(t, fpow(x, e)); }
    if (!zero) s = fadd(s, t);
  }
  return s;
}
/* a point where P < 0, along x_i from the base point y (whose leading coefficient in x_i is negative, or of odd degree) */
function negativeAlong(P, y, i) {
  for (let k = 0; k <= 900; k++) for (const sg of [1n, -1n]) {
    const pt = new Map(y); pt.set(i, [sg * 10n ** BigInt(k), 1n]);
    const v = evalAt(P, pt);
    if (v[0] < 0n) return { point: Object.fromEntries([...pt].map(([j, x]) => ['x' + j, fshow(x)])), valueSign: -1, valueDigits: digits(v[0]) - digits(v[1]) };
  }
  return null;
}
/* exact symmetric elimination: null when PSD, else a rational vector v with v^T M v < 0 */
function psdWitness(M) {
  const m = M.length; const A = M.map((r) => r.map((x) => x.slice()));
  const B = []; const track = (j) => { if (!B[j]) { B[j] = new Map([[j, [1n, 1n]]]); } return B[j]; };
  for (let j = 0; j < m; j++) track(j);
  const vecAdd = (u, w, f) => { const r = new Map(u); for (const [k, x] of w) { const s = fadd(r.get(k) || [0n, 1n], fmul(f, x)); if (s[0] === 0n) r.delete(k); else r.set(k, s); } return r; };
  for (let j = 0; j < m; j++) {
    const d = A[j][j];
    if (d[0] < 0n) return B[j];
    if (d[0] === 0n) {
      for (let l = j + 1; l < m; l++) if (A[j][l][0] !== 0n) {
        const g = A[j][l], e = A[l][l]; const s = fr(1n, babs(e[0]) / e[1] + 2n); const t = fmul([-g[0], g[1]], s);
        return vecAdd(B[j], B[l], t);
      }
      continue;
    }
    for (let l = j + 1; l < m; l++) {
      if (A[l][j][0] === 0n) continue;
      const f = fdiv(A[l][j], d);
      for (let k = j + 1; k < m; k++) if (A[j][k][0] !== 0n) A[l][k] = fsub(A[l][k], fmul(f, A[j][k]));
      A[l][j] = [0n, 1n];
      B[l] = vecAdd(B[l], B[j], [-f[0], f[1]]);
    }
    for (let k = j + 1; k < m; k++) A[j][k] = [0n, 1n];
  }
  return null;
}
const quadForm = (M, v) => { let s = [0n, 1n]; for (const [a, x] of v) for (const [b, y] of v) s = fadd(s, fmul(fmul(x, y), M[a][b])); return s; };
function decideN(P) {
  const byVar = new Map();
  for (const t of P.values()) for (const [i, e] of t.mono) { if (!byVar.has(i)) byVar.set(i, []); byVar.get(i).push([t, e]); }
  let deg4 = 0, deg2 = 0, largestGram = 0, gramDims = 0;
  const vars = [...byVar.keys()].sort((a, b) => a - b);
  for (const i of vars) {
    const occ = byVar.get(i); const d = Math.max(...occ.map(([, e]) => e));
    if (d === 1 || d === 3) {
      /* odd degree in x_i: find a base point where its leading coefficient is nonzero */
      const lead = occ.filter(([, e]) => e === d).map(([t]) => t);
      const others = [...new Set(lead.flatMap((t) => t.mono.map(([j]) => j).filter((j) => j !== i)))];
      const bases = [new Map(others.map((j) => [j, [1n, 1n]])), ...others.map((j) => new Map([[j, [1n, 1n]]])), new Map()];
      for (const y of bases) { const w = negativeAlong(P, y, i); if (w) return { verdict: 'REFUTED', failure: 'x' + i + ' has degree ' + d + ' (odd)', witness: w }; }
      return { verdict: 'REFUSED', failure: 'x' + i + ' has odd degree ' + d + ' but no negative point was found by this search' };
    }
    if (d === 4) {
      deg4++;
      const t = P.get(i + '^4');
      if (!t || t.c <= 0n) { const w = negativeAlong(P, new Map(), i); return w ? { verdict: 'REFUTED', failure: 'the x' + i + '^4 coefficient is ' + (t ? t.c : 0n), witness: w } : { verdict: 'REFUSED', failure: 'x' + i + '^4 coefficient not positive, no point found' }; }
      continue;
    }
    if (d !== 2) return { verdict: 'REFUTED', failure: 'x' + i + ' has degree ' + d + ' > 4' };
    deg2++;
    /* C_i = the coefficient of x_i^2, a polynomial of degree <= 2 in the others; M = 2·Gram over (1, y) */
    const C = occ.filter(([, e]) => e === 2).map(([t]) => ({ c: t.c, rest: t.mono.filter(([j]) => j !== i) }));
    const ys = [...new Set(C.flatMap((t) => t.rest.map(([j]) => j)))].sort((a, b) => a - b); const pos = new Map(ys.map((j, k) => [j, k + 1]));
    const m = ys.length + 1; const M = Array.from({ length: m }, () => Array.from({ length: m }, () => [0n, 1n]));
    const put = (a, b, x) => { M[a][b] = fadd(M[a][b], x); if (a !== b) M[b][a] = fadd(M[b][a], x); };
    for (const { c, rest } of C) {
      const flat = rest.flatMap(([j, e]) => Array(e).fill(pos.get(j)));
      if (flat.length === 0) put(0, 0, [2n * c, 1n]);
      else if (flat.length === 1) put(0, flat[0], [c, 1n]);
      else if (flat[0] === flat[1]) put(flat[0], flat[0], [2n * c, 1n]);
      else put(flat[0], flat[1], [c, 1n]);
    }
    largestGram = Math.max(largestGram, m); gramDims += m;
    const v = psdWitness(M);
    if (v) {
      if (!(fsign(quadForm(M, v)) < 0)) return { verdict: 'REFUSED', failure: 'x' + i + ': the elimination\'s vector is not a witness (a fault of ours)' };
      const v0 = v.get(0) || [0n, 1n];
      let y = null;
      if (v0[0] !== 0n) y = new Map([...v].filter(([k]) => k > 0).map(([k, x]) => [ys[k - 1], fdiv(x, v0)]));
      else for (let k = 0; k <= 400 && !y; k++) {
        const lam = [10n ** BigInt(k), 1n]; const yy = new Map([...v].filter(([q]) => q > 0).map(([q, x]) => [ys[q - 1], fmul(x, lam)]));
        const cv = quadForm(M, new Map([[0, [1n, 1n]], ...[...yy].map(([j, x]) => [pos.get(j), x])]));
        if (cv[0] < 0n) y = yy;
      }
      const w = y && negativeAlong(P, y, i);
      return w ? { verdict: 'REFUTED', failure: 'the coefficient of x' + i + '^2 is not positive semidefinite', witness: w } : { verdict: 'REFUSED', failure: 'x' + i + ': not PSD, but no negative point was found by this search' };
    }
  }
  return { verdict: 'CERTIFIED', numbers: { variables: vars.length, degree4Variables: deg4, degree2Variables: deg2, gramMatrices: deg2, largestGram, totalGramDimension: gramDims } };
}

/* ---- Laurent polynomials in named symbols, for the displayed identities ------------------------------------------- */
const L = {
  key: (m) => [...m.entries()].filter(([, e]) => e !== 0).sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([s, e]) => s + '^' + e).join('*'),
  parse: (k) => new Map(k === '' ? [] : k.split('*').map((f) => { const [s, e] = f.split('^'); return [s, Number(e)]; })),
  c: (x) => new Map(x === 0n ? [] : [['', [x, 1n]]]),
  v: (s) => new Map([[s + '^1', [1n, 1n]]]),
  add: (...ps) => { const r = new Map(); for (const p of ps) for (const [k, c] of p) { const s = fadd(r.get(k) || [0n, 1n], c); if (s[0] === 0n) r.delete(k); else r.set(k, s); } return r; },
  neg: (p) => new Map([...p].map(([k, c]) => [k, [-c[0], c[1]]])),
  mul2: (p, q) => { const r = new Map(); for (const [k1, c1] of p) for (const [k2, c2] of q) { const m = L.parse(k1); for (const [s, e] of L.parse(k2)) m.set(s, (m.get(s) || 0) + e); const k = L.key(m); const s = fadd(r.get(k) || [0n, 1n], fmul(c1, c2)); if (s[0] === 0n) r.delete(k); else r.set(k, s); } return r; },
  mul: (...ps) => ps.reduce((a, b) => L.mul2(a, b)),
  pow: (p, e) => { if (e < 0) { if (p.size !== 1) throw new Error('only a monomial has a negative power'); const [[k, c]] = [...p]; const m = L.parse(k); for (const [s, x] of m) m.set(s, -x); return L.pow(new Map([[L.key(m), fdiv([1n, 1n], c)]]), -e); } let r = L.c(1n); for (let i = 0; i < e; i++) r = L.mul2(r, p); return r; },   /* amendment A: a negative power is the inverse monomial raised to |e| */
  q: (f) => new Map(f[0] === 0n ? [] : [['', f]]),   /* a rational constant */
  subst: (p, env) => { let r = new Map(); for (const [k, c] of p) { let t = new Map([['', c]]); for (const [s, e] of L.parse(k)) t = L.mul2(t, env[s] ? L.pow(env[s], e) : new Map([[s + '^' + e, [1n, 1n]]])); r = L.add(r, t); } return r; },
  eq: (p, q) => L.add(p, L.neg(q)).size === 0,
};
const S = L.v, K = (n) => L.c(BigInt(n));

/* ---- A: the finite statements -------------------------------------------------------------------------------------- */
const H = 3n * 2n ** 106n * (2n ** 32n * 3n ** 9n) ** 6n * 46410n ** 18n + 128n;
const ALPHA = fr(577n, 32n);
const primesBelow = (n) => { const r = []; for (let p = 2; p < n; p++) { let ok = true; for (let q = 2; q * q <= p; q++) if (p % q === 0) { ok = false; break; } if (ok) r.push(p); } return r; };
const DISPLAYED_P = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
const beta = () => L.add(K(2401), L.mul(K(2754), L.pow(L.add(L.mul(K(2), S('X')), K(1)), 2)));
/* amendment B: the exact helpers the statements of #13 and #16 need */
/* ln x < p/q, through a rational lower bound EL < e: x^q < EL^p implies x^q < e^p. It can only confirm, never accept falsely. */
const EL = (() => { let s = [0n, 1n], f = 1n; for (let k = 0n; k <= 12n; k++) { if (k > 0n) f *= k; s = fadd(s, fr(1n, f)); } return s; })();
const lnLess = (x, p, q) => flt(fpow(fr(BigInt(x)), q), fpow(EL, p));
/* Q(sqrt 2): [a, b] = a + b·sqrt 2 with a, b exact rationals; the sign is decided by squares */
const Q2 = {
  sign: ([a, b]) => { const sa = fsign(a), sb = fsign(b); if ((sa >= 0 && sb >= 0) || (sa <= 0 && sb <= 0)) return sa || sb; const a2 = fmul(a, a), b2 = fmul(fr(2n), fmul(b, b)); const c = flt(b2, a2) ? 1 : flt(a2, b2) ? -1 : 0; return sa > 0 ? c : -c; },
  add: (x, y) => [fadd(x[0], y[0]), fadd(x[1], y[1])],
  neg: (x) => [[-x[0][0], x[0][1]], [-x[1][0], x[1][1]]],
  mul: (x, y) => [fadd(fmul(x[0], y[0]), fmul(fr(2n), fmul(x[1], y[1]))), fadd(fmul(x[0], y[1]), fmul(x[1], y[0]))],
  eq: (x, y) => feq(x[0], y[0]) && feq(x[1], y[1]),
};
Q2.abs = (x) => (Q2.sign(x) < 0 ? Q2.neg(x) : x);
const q2 = (a, b) => [fr(BigInt(a)), fr(BigInt(b))];
/* g(j+1) − g(j) ≥ 3 for every integer j ≥ from, where g(j) = 4j − c − floor((4j+1)/d): the step is periodic in j with
   period d/gcd(4, d) (4·period/d is an integer, so the floor shifts by exactly that integer), so a complete residue
   system decides it */
const stepsAtLeast3 = (g, d, from) => { const per = d / bgcd(4n, d); if ((4n * per) % d !== 0n) return false; for (let j = from; j < from + per; j++) if (g(j + 1n) - g(j) < 3n) return false; return true; };
const EXPECTED_JSON = {};
const expected = (pr) => EXPECTED_JSON[pr] || (EXPECTED_JSON[pr] = JSON.parse(blob(HEAD[pr], PACKET[pr] + '/EXPECTED.json').toString('utf8')));
const cstarE = (E) => 2n * 3n ** BigInt(E / 2 - 1);   /* #16: c* = 2·3^(E/2−1) */
const bstarE = (E) => cstarE(E) - 1n;                  /* #16: b* = c* − 1 */
const PB = (B) => 2n * B ** 4n + 6n * B ** 3n + 5n * B ** 2n + 1n;
const lucasEndpoint = (E, m) => { const b = bstarE(E), k = BigInt(32 * m); return (2n * (b * b - 6n)) ** k > (3n * H + 14n) ** k * PB(b) ** 577n; };
const scalar45 = (E) => cstarE(E) ** 415n > (4n * H) ** 992n;
const scalar47 = (E) => 8n ** 992n * cstarE(E) ** 415n > (25n * H) ** 992n;
function statementsFor(pr, o = {}) {   /* o: the controls' planted changes, so that they run through this same code */
  const H_ = H;
  const st = [];
  const add = (id, text, holds) => st.push({ id, text, holds: !!holds });
  const big = (b) => BigInt(b);
  if (pr === 8) {
    const Pr = DISPLAYED_P.map(big); const prod = (xs) => xs.reduce((a, b) => a * b, 1n);
    add('a1', 'the displayed list is exactly the primes below 53', JSON.stringify(primesBelow(53)) === JSON.stringify(DISPLAYED_P));
    add('a2', '(p+1)^192 > p^193 for each displayed p', Pr.every((p) => (p + 1n) ** 192n > p ** 193n));
    add('a3', '54^192 < 53^193', 54n ** 192n < 53n ** 193n);
    add('a4', '(9·Π(p+1))^192 < 32^192·(Πp)^193', (9n * prod(Pr.map((p) => p + 1n))) ** 192n < (o.a4 ? 9n : 32n) ** 192n * prod(Pr) ** (o.a4 ? 192n : 193n));
    add('a5', '13000000/6 + 2 < 2^22', flt(fadd(fr(13000000n, 6n), fr(2n)), fr(2n ** 22n)));
    add('a6', '2^32·46410 < 3^32', 2n ** 32n * 46410n < 3n ** 32n);
    add('a7', 'H = 3·2^106·C^6·46410^18 + 128 (C = 2^32·3^9) has bit length 665 and H < 3·2^663', bits(H_) === (o.Hbits || 665) && H_ < 3n * 2n ** 663n);
    add('a8', '247520·(H − 128) + 128 has bit length 683', bits(247520n * (H_ - 128n) + 128n) === 683);
    add('a9', '3^53 > 2^84', 3n ** 53n > 2n ** 84n);
    const a10 = fsub(fadd(fr(319n), fmul(fr(319n * 1181n - 896n), fr(84n, 53n))), fr(665n * 896n));
    add('a10', '319 + (319·1181 − 896)·84/53 − 665·896 = 8199/53 > 0', feq(a10, fr(8199n, 53n)) && fsign(a10) > 0);
    const cs = 2n * 3n ** 1181n, bs = cs - 1n, bsL = o.bStar8 || bs;
    add('a11', 'c*^319 > (4H)^896, c* = 2·3^1181', cs ** 319n > (4n * H_) ** 896n);
    const a12 = fsub(fmul(fr(143n * 1181n - 720n), fr(84n, 53n)), fr(666n * 360n));
    add('a12', '(143·1181 − 720)·84/53 − 666·360 = 1418412/53 > 0', feq(a12, fr(1418412n, 53n)) && fsign(a12) > 0);
    add('a13', 'b*^143 > (24H)^360, b* = c* − 1', bsL ** 143n > (24n * H_) ** 360n);
    add('a14', '24H < 9·2^666', 24n * H_ < 9n * 2n ** 666n);
    add('a15', '7H·2^(α/12) + 6 < 40H, α = 577/32 (as 2^577·(7H)^384 < (40H − 6)^384)', 40n * H_ - 6n > 0n && 2n ** 577n * (7n * H_) ** 384n < (40n * H_ - 6n) ** 384n);
    add('a16', '40H < 2^670 and 100·670 < b*', 40n * H_ < 2n ** 670n && 100n * 670n < bs);
    const t24 = fsub(fr(24n), ALPHA);
    add('a17', '12/(24 − α) < 12/5 and α/(24 − α) < 19/5', flt(fdiv(fr(12n), t24), fr(12n, 5n)) && flt(fdiv(ALPHA, t24), fr(19n, 5n)));
    add('a18', '(12/5)/100 + (19/5)/4 = 487/500 and (19/5)·(1/4) = 19/20', feq(fadd(fdiv(fr(12n, 5n), fr(100n)), fdiv(fr(19n, 5n), fr(4n))), fr(487n, 500n)) && feq(fmul(fr(19n, 5n), fr(1n, 4n)), fr(19n, 20n)));
    /* 487/500·a + 19/20 < a − 3 ⇔ a > (19/20 + 3)/(13/500); every a > 152 satisfies it iff that bound is ≤ 152 */
    add('a19', '487/500·a + 19/20 < a − 3 for every real a > 152', !flt(fr(152n), fdiv(fadd(fr(19n, 20n), fr(3n)), fsub(fr(1n), fr(487n, 500n)))) && bs > 152n);
    add('a20', 'α = 18 + 1/32 = 577/32; 1 − α/28 = 319/896; 2 − 4α/45 = 143/360', feq(fadd(fr(18n), fr(1n, 32n)), ALPHA) && feq(fsub(fr(1n), fdiv(ALPHA, fr(28n))), fr(319n, 896n)) && feq(fsub(fr(2n), fdiv(fmul(fr(4n), ALPHA), fr(45n))), fr(143n, 360n)));
    add('a21', '11016 = 2^3·3^4·17', 11016n === 8n * 81n * 17n);
    add('a22', '2401 + 2754(2X+1)^2 = 11016X^2 + 11016X + 5155', L.eq(beta(), L.add(L.mul(K(11016), L.pow(S('X'), 2)), L.mul(K(11016), S('X')), K(5155))));
    add('a23', '3^2364 = (3^394)^6', 3n ** 2364n === (3n ** 394n) ** 6n);
  }
  if (pr === 9) {
    const [b, E, T, s, v, Q, Q2, q, q2, s2, Hh, F] = ['b', 'E', 'T', 's', 'v', 'Q', 'Q2', 'q', 'q2', 's2', 'H', 'F'].map(S);
    const Cold = (c3 = o.c3 || 3) => L.add(L.mul(K(17), b, q2), L.mul(K(c3), L.pow(Hh, 2)), L.neg(L.mul(K(2), s2, Hh)), L.neg(L.pow(s2, 2)));
    const Cnew = L.add(L.mul(K(17), b, Q2), L.mul(K(3), L.pow(v, 2)), L.neg(L.mul(K(2), s, v)), L.neg(L.pow(s, 2)));
    const fwd = { H: L.mul(s, v), q: L.mul(s, Q), q2: L.mul(L.pow(s, 2), Q2), s2: L.pow(s, 2) };
    const ET = L.mul(E, L.add(K(17), L.neg(T)));
    add('p1', 'C_old(H=sv, q2=s²Q2, s2=s²) = s²·C_new', L.eq(L.subst(Cold(), fwd), L.mul(L.pow(s, 2), Cnew)));
    add('p2', '(q2 − q²)(q=sQ, q2=s²Q2) = s²(Q2 − Q²)', L.eq(L.subst(L.add(q2, L.neg(L.pow(q, 2))), fwd), L.mul(L.pow(s, 2), L.add(Q2, L.neg(L.pow(Q, 2))))));
    add('p3', '(s2 − s²)(s2=s²) = 0', L.subst(L.add(s2, L.neg(L.pow(s, 2))), fwd).size === 0);
    add('p4', '(H − E(17−T))(H=sv) = −(E(17−T) − sv)', L.eq(L.subst(L.add(Hh, L.neg(ET)), fwd), L.neg(L.add(ET, L.neg(L.mul(s, v))))));
    add('p5', 'C_old(s2=0, q2=q²) = 17bq² + 3H²', L.eq(L.subst(Cold(), { s2: K(0), q2: L.pow(q, 2) }), L.add(L.mul(K(17), b, L.pow(q, 2)), L.mul(K(3), L.pow(Hh, 2)))));
    add('p6', 'C_old(H=17F) = 17bq2 + 867F² − 34s2·F − s2² (the Version 13 normalization)', L.eq(L.subst(Cold(), { H: L.mul(K(17), F) }), L.add(L.mul(K(17), b, q2), L.mul(K(867), L.pow(F, 2)), L.neg(L.mul(K(34), s2, F)), L.neg(L.pow(s2, 2)))));
    st.Cold = Cold; st.Cnew = Cnew; st.fwd = fwd;
  }
  if (pr === 11) {
    const cs = 2n * 3n ** 1064n, bs = 3n ** 1064n;
    add('q1', 'c*^415 > (4H)^992, c* = 2·3^1064', cs ** 415n > (4n * H_) ** 992n);
    add('q2', 'b*^143 > (24H)^360, b* = 3^1064', bs ** 143n > (24n * H_) ** 360n);
    add('q3', '100·670 < b*, b* > 152, c* − 1 ≥ b*', 100n * 670n < bs && bs > 152n && cs - 1n >= bs);
    add('q4', '1 − α/31 = 415/992 and 2 − 4α/45 = 143/360', feq(fsub(fr(1n), fdiv(ALPHA, fr(31n))), fr(415n, 992n)) && feq(fsub(fr(2n), fdiv(fmul(fr(4n), ALPHA), fr(45n))), fr(143n, 360n)));
    add('q5', '963/32 = 30 + 3/32', feq(fr(963n, 32n), fadd(fr(30n), fr(3n, 32n))));
    add('q6', '40H < 2^670', 40n * H_ < 2n ** 670n);
    add('q7', '2130 = 6·355 and 3^2130 = (3^355)^6', 2130 === 6 * 355 && 3n ** 2130n === (3n ** 355n) ** 6n);
    const [A, J1, r] = ['A', 'J1', 'r'].map(S);
    add('q8', '(A² + r^−15·J1²)/r = A²/r + r^−16·J1²', L.eq(L.mul(L.add(L.pow(A, 2), L.mul(L.pow(r, -15), L.pow(J1, 2))), L.pow(r, -1)), L.add(L.mul(L.pow(A, 2), L.pow(r, -1)), L.mul(L.pow(r, -16), L.pow(J1, 2)))));
    add('q9', '2401 + 2754(2X+1)^2 = 11016X^2 + 11016X + 5155', L.eq(beta(), L.add(L.mul(K(11016), L.pow(S('X'), 2)), L.mul(K(11016), S('X')), K(5155))));
  }
  if (pr === 12) {
    const rho = (X) => { const be = 2401n + 2754n * (2n * X + 1n) ** 2n; return 42n * be * (be - 1n) * (32n * be + 343n) + (o.rhoShift || 0n); };
    const mod = (a, m) => ((a % m) + m) % m;
    const allRes = (m, want, f = rho) => { for (let X = 0n; X < m; X++) if (mod(f(X), m) !== want) return false; return true; };
    add('r1', 'ρ ≡ 4 (mod 32) for every integer X (X mod 32)', allRes(32n, 4n));
    add('r2', 'ρ ≡ 81 (mod 243) for every integer X (X mod 243)', allRes(243n, 81n));
    add('r3', 'ρ ≡ 13 (mod 17) for every integer X (X mod 17)', allRes(17n, 13n));
    const val = (a, p) => { let v = 0; while (a % p === 0n) { a /= p; v++; } return [v, a]; };
    let ok4 = allRes(32n, 4n) && allRes(243n, 81n);
    for (let X = 0n; X < 243n && ok4; X++) { const r = rho(X); const [v2, u2] = val(r, 2n), [v3, u3] = val(r, 3n); if (X < 32n && (v2 !== 2 || mod(u2, 8n) !== 1n)) ok4 = false; if (v3 !== 4 || mod(u3, 3n) !== 1n) ok4 = false; }
    add('r4', 'implied by r1 and r2, and confirmed on the representatives: v₂(ρ) = 2 with ρ/4 ≡ 1 (mod 8), v₃(ρ) = 4 with ρ/81 ≡ 1 (mod 3)', ok4);
    const root = o.root17 || 8n;
    add('r5', '13 ≡ 8² (mod 17)', (root * root) % 17n === 13n);
    st.rho = rho; st.allRes = allRes;
  }
  if (pr === 13) {
    /* PROOF.md: the affine cubic and the four-gate weight chain */
    const t = S('t'), t2 = S('t2'), t3 = S('t3');
    const F = L.mul(t, ...[[1n, 49n], [1n, 50n], [1n, 2450n], [32n, 1225n]].map(([a, b]) => L.add(t, L.q(fr(-a, b)))));
    const c = [0, 1, 2, 3, 4, 5].map((k) => F.get(k === 0 ? '' : 't^' + k) || [0n, 1n]);
    add('c1', 'F(t) = t(t−1/49)(t−1/50)(t−1/2450)(t−32/1225) is a monic quintic with c0 = 0', [...F.keys()].every((k) => k === '' || /^t\^[1-5]$/.test(k)) && feq(c[5], fr(1n)) && c[0][0] === 0n);
    st.F = { c4: fshow(c[4]), c3: fshow(c[3]), c2: fshow(c[2]), c1: fshow(c[1]), c0: fshow(c[0]) };
    const C = (k) => L.q(c[k]); const sq = { t2: L.pow(t, 2) };
    const M = L.add(L.mul(t2, L.add(t, C(4))), L.mul(C(3), t), C(2));
    const T3 = L.add(M, L.neg(L.mul(C(4), t2)), L.neg(L.mul(C(3), t)), L.neg(C(2)));
    add('c2', 'with t2 = t²: M = t2(t+c4) + c3·t + c2 = t³ + c4t² + c3t + c2 and t3 = M − c4·t2 − c3·t − c2 = t³ (F\'s coefficients)', L.eq(L.subst(M, sq), L.add(L.pow(t, 3), L.mul(C(4), L.pow(t, 2)), L.mul(C(3), t), C(2))) && L.eq(L.subst(T3, sq), L.pow(t, 3)));
    const delta3 = L.add(L.mul(L.c(98n ** 3n), t3), L.neg(L.mul(L.c(3n * 98n * 98n), t2)), L.mul(L.c((o.delta3Coef || 3n) * 98n), t), K(-1));
    add('c3', 'delta3 = 98³·t3 − 3·98²·t2 + 3·98·t − 1 = (98t − 1)³, with t3 the affine alias above and t2 = t²', L.eq(L.subst(L.subst(delta3, { t3: T3 }), sq), L.pow(L.add(L.mul(K(98), t), K(-1)), 3)));
    const e = S('e'), dl = S('delta'), q1 = L.mul(e, L.pow(dl, -1)), E = L.mul(q1, L.pow(dl, 2));
    const mixC = L.mul(L.pow(E, 3), L.pow(q1, 3)), mixD = L.pow(mixC, 2), q12o = L.mul(L.pow(mixD, 2), L.pow(E, -1));
    add('c4', 'old segment (q1 = e/delta, E = q1·delta²): E = e·delta, mixC = E³q1³ = e⁶, mixD = mixC² = e¹², q12 = mixD²/E = e²³/delta', L.eq(E, L.mul(e, dl)) && L.eq(mixC, L.pow(e, 6)) && L.eq(mixD, L.pow(e, 12)) && L.eq(q12o, L.mul(L.pow(e, 23), L.pow(dl, -1))));
    const q1cube = L.pow(q1, 3), e3 = L.mul(q1cube, L.pow(dl, 3)), e6 = L.pow(e3, 2), e12 = L.pow(e6, 2), q12n = L.mul(L.pow(e12, 2), L.pow(E, -1));
    add('c5', 'new segment (q1cube = q1³, delta3 = delta³): e3 = q1cube·delta3 = e³, e6 = e3² = e⁶, e12 = e6² = e¹², q12 = e12²/E, the same q12', L.eq(e3, L.pow(e, 3)) && L.eq(e6, L.pow(e, 6)) && L.eq(e12, L.pow(e, 12)) && L.eq(q12n, q12o));
    add('c6', 'the reverse map: the restored mixC = E³q1³ and mixD = mixC² equal e6 and e12', L.eq(mixC, e6) && L.eq(mixD, e12));
    const mh = (q) => L.pow(q, 2), q45 = (q) => L.mul(L.pow(mh(q), 2), L.pow(q1cube, -1)), q47 = (q) => L.mul(L.pow(L.mul(mh(q), E), 2), L.pow(q1, -1));
    add('c7', 'downstream, both chains: mixedHigh = q12², q45 = mixedHigh²/q1cube, and the optional highLift = mixedHigh·E, q47 = highLift²/q1 agree', L.eq(mh(q12o), mh(q12n)) && L.eq(q45(q12o), q45(q12n)) && L.eq(q47(q12o), q47(q12n)));
    const v45 = CLAIM[13].variants[45], v47 = CLAIM[13].variants[47];
    add('c8', 'the stated counts: 3 detectors × (4 old rows deleted, 3 added, 1 q12 row changed) = 12, 9, 3; 12 − 9 = 3 = 383 − 380 = 352 − 349 (#12 to #13\'s default); the reference\'s 386 − 3 = 383 and 355 − 3 = 352 (the optional)', 3 * 4 === 12 && 3 * 3 === 9 && 3 * 1 === 3 && 12 - 9 === 3 && CLAIM[12].n - v45.n === 3 && CLAIM[12].residuals - v45.residuals === 3 && 386 - 3 === v47.n && 355 - 3 === v47.residuals);
    const ex = expected(13);
    add('c9', 'EXPECTED.json\'s anchor and c exponents: 2130 = 6·355 (order 45), 2016 = 6·336 (order 47)', ex['45'].anchorExponent === 2130 && ex['45'].summary.cExponent === 355 && 2130 === 6 * 355 && ex['47'].anchorExponent === 2016 && ex['47'].summary.cExponent === 336 && 2016 === 6 * 336);
    /* references/precision51_PROOF.md: the retained order-47 argument */
    const a = [fr(1n), o.aFromJ1 ? fmul(fr(1n), fr(-1n, 5n)) : fr(-2n, 5n)];
    for (let j = 2; j <= 13; j++) a.push(fmul(a[j - 1], fr(BigInt(4 * j - 5), BigInt(4 * j + 1))));
    const a13 = a[13];
    add('d1', 'a0 = 1, a1 = −2/5, a_j/a_(j−1) = (4j−5)/(4j+1) for j ≥ 2: the reduced denominator of a13 is 5²·7·17·29·37·41·53', a13[1] === (o.den13 || 25n * 7n * 17n * 29n * 37n * 41n * 53n));
    st.a13 = fshow(a13);
    const fac = (n) => { const f = []; for (let p = 2n; p * p <= n; p++) { let k = 0; while (n % p === 0n) { n /= p; k++; } if (k) f.push([p, k]); } if (n > 1n) f.push([n, 1]); return f; };
    const EXC = [2n, 3n, 5n, 7n, 13n, 17n];
    add('d2', 'v_p(a13) ≥ −1 for every prime p outside {2,3,5,7,13,17}', fac(a13[1]).every(([p, k]) => k <= 1 || EXC.includes(p)));
    const f3 = (j) => 4n * j - 51n - (4n * j + 1n) / 10n;
    add('d3', 'for every integer j ≥ 14: 4j − 51 − ⌊(4j+1)/10⌋ ≥ 0, = 0 at j = 14, each step adding at least 3 (j mod 5)', f3(BigInt(o.base3 || 14)) === 0n && stepsAtLeast3(f3, 10n, 14n));
    let v53 = 0; { let [n, d] = a13; while (d % 53n === 0n) { d /= 53n; v53--; } while (n % 53n === 0n) { n /= 53n; v53++; } }
    const g4 = (j) => 4n * j - (4n * j + 1n) / 52n;
    add('d4', 'at p = 53: v(a13) = −1, so the j = 13 term has valuation 4·13 − 1 = 51; 4j − ⌊(4j+1)/52⌋ ≥ 55 for every j ≥ 14 (= 55 at 14; steps j mod 13)', v53 === -1 && 4 * 13 + v53 === 51 && g4(14n) === 55n && stepsAtLeast3(g4, 52n, 14n));
    const Q1 = S('q1'), D = S('delta'), EE = S('E'), toQ = (p) => L.subst(p, { E: L.mul(Q1, L.pow(D, 2)) });
    const q12r = L.mul(L.pow(EE, 11), L.pow(Q1, 12)), mhr = L.pow(q12r, 2);
    const q46r = L.mul(L.pow(L.mul(mhr, D), 2), L.pow(Q1, -1)), q47r = L.mul(L.pow(L.mul(mhr, EE), 2), L.pow(Q1, -1));
    const ee = L.mul(Q1, D), qm = (m) => L.mul(L.pow(EE, m - 1), L.pow(Q1, m)), em = (m) => L.mul(L.pow(ee, 2 * m - 1), L.pow(D, -1));
    add('d5', 'E = q1·delta²: mixedHigh = q12² = E²²q1²⁴ for q12 = E¹¹q1¹²; q46 = (mixedHigh·delta)²/q1 = E⁴⁵q1⁴⁶; q47 = (mixedHigh·E)²/q1 = E⁴⁶q1⁴⁷; E^(m−1)q1^m = e^(2m−1)/delta (e = q1·delta) for m = 12, 46, 47', L.eq(mhr, L.mul(L.pow(EE, 22), L.pow(Q1, 24))) && L.eq(toQ(q46r), toQ(qm(46))) && L.eq(q47r, qm(47)) && [12, 46, 47].every((m) => L.eq(toQ(qm(m)), em(m))));
    const c7 = 2n * 3n ** 1007n, b7 = 3n ** 1007n, M46 = [46, 47, 48, 49, 50, 51];
    add('d6', 'anchor 3^2016, c* = 2·3^1007, b* = 3^1007: c*^415 > (4H)^992; b*^(16m−577) > (24H)^(8m) for every 46 ≤ m ≤ 51; 40H < 2^670; b* > 67000; b* > 152', c7 ** 415n > (4n * H) ** 992n && M46.every((m) => b7 ** BigInt(16 * m - 577) > (24n * H) ** BigInt(8 * m)) && 40n * H < 2n ** 670n && b7 > 67000n && b7 > 152n);
    add('d7', 'for 46 ≤ m ≤ 51: α/m < 1/2, 2 − 4α/m = (16m−577)/(8m), and 7H·5^(α/m) + 6 < 24H (as 5^577·(7H)^(32m) < (24H − 6)^(32m))', M46.every((m) => { const mm = fr(BigInt(m)); return flt(fdiv(ALPHA, mm), fr(1n, 2n)) && feq(fsub(fr(2n), fdiv(fmul(fr(4n), ALPHA), mm)), fr(BigInt(16 * m - 577), BigInt(8 * m))) && 5n ** 577n * (7n * H) ** BigInt(32 * m) < (24n * H - 6n) ** BigInt(32 * m); }));
    add('d8', 'the stated failures: at anchor 2010 (c* = 2·3^1004) c*^415 ≤ (4H)^992; at anchor 2016 for order 45, (3^1007)^143 ≤ (24H)^360', !((2n * 3n ** 1004n) ** 415n > (4n * H) ** 992n) && !(b7 ** 143n > (24n * H) ** 360n));
  }
  if (pr === 16) {
    const X = S('X'), be = beta();
    add('h1', 'β − 2401 = 2754(2X+1)², so β ≥ 2401 for real X with equality only at X = −1/2; 2401 > 1 > 0 > −343/32', L.eq(L.add(be, K(-2401)), L.mul(K(2754), L.pow(L.add(L.mul(K(2), X), K(1)), 2))) && L.eq(L.subst(be, { X: L.q(fr(-1n, 2n)) }), K(2401)) && flt(fr(1n), fr(2401n)) && flt(fr(-343n, 32n), fr(0n)));
    const [C0, C1, rho] = ['C0', 'C1', 'rho'].map(S);
    add('h2', 'with U = C0 + C1: C0 + C1·ρ = (1 − ρ)C0 + ρU', L.eq(L.add(C0, L.mul(C1, rho)), L.add(L.mul(L.add(K(1), L.neg(rho)), C0), L.mul(rho, L.add(C0, C1)))));
    const bound = (r) => Q2.add(Q2.abs(Q2.add(q2(1, 0), Q2.neg(r))), Q2.abs(r));
    const atPlus = bound(q2(0, 1)), atMinus = bound(q2(0, -1)), claimPlus = o.sqrt2Claim || q2(-1, 2);
    add('h3', 'at ρ = √2 and ρ = −√2, |1 − ρ| + |ρ| = 2√2 − 1 and 2√2 + 1 (exact in Q(√2)), whose product is 7', Q2.eq(atPlus, claimPlus) && Q2.eq(atMinus, q2(1, 2)) && Q2.eq(Q2.mul(atPlus, atMinus), q2(7, 0)));
    const ln = o.logClaim || [50, 4, 1];
    add('h4', 'log 50 < 4, log 7 < 2 and log 2 < 1 (natural logarithms; as 50 < e⁴, 7 < e², 2 < e with Σ_{k≤12} 1/k! < e)', lnLess(ln[0], ln[1], ln[2]) && lnLess(7, 2, 1) && lnLess(2, 1, 1));
    const K0 = fr(3n * H + 14n, 2n);
    add('h5', 'K0 = (3H + 14)/2 < 7H, and (3/2)(H + 4) + 2/2 = (3H + 14)/2', flt(K0, fr(7n * H)) && feq(fadd(fmul(fr(3n, 2n), fr(H + 4n)), fr(1n)), K0));
    const ex = expected(16);
    add('h6', 'c* = 2·3^(E/2−1): 1058 (E = 2118), 1004 (2010), 1064 (2130), 1007 (2016); 1058 ≤ 1064 and 1004 ≤ 1007; EXPECTED.json: 2118 = 6·353, 2010 = 6·335', 2118 / 2 - 1 === 1058 && 2010 / 2 - 1 === 1004 && 2130 / 2 - 1 === 1064 && 2016 / 2 - 1 === 1007 && 1058 <= 1064 && 1004 <= 1007 && ex['45'].anchorExponent === 2118 && ex['45'].summary.cExponent === 353 && 2118 === 6 * 353 && ex['47'].anchorExponent === 2010 && ex['47'].summary.cExponent === 335 && 2010 === 6 * 335);
    const B = S('B'), P = L.add(L.mul(K(2), L.pow(B, 4)), L.mul(K(6), L.pow(B, 3)), L.mul(K(5), L.pow(B, 2)), K(1));
    add('h7', 'the triangle bound: B² + B(B+2)·B·B + (B+2)²B² + 1 = 2B⁴ + 6B³ + 5B² + 1 = P(B)', L.eq(L.add(L.pow(B, 2), L.mul(B, L.add(B, K(2)), B, B), L.mul(L.pow(L.add(B, K(2)), 2), L.pow(B, 2)), K(1)), P));
    add('h8', 'P(B) = B⁴(2 + 6/B + 5/B² + B⁻⁴), B² − 6 = B²(1 − 6/B²), 4·577 = 2308, 64m − 2308 > 0 (m = 45, 47), 32α = 577, 2K0 = 3H + 14, b*² > 6 at E = 2118, 2010',
      L.eq(P, L.mul(L.pow(B, 4), L.add(K(2), L.mul(K(6), L.pow(B, -1)), L.mul(K(5), L.pow(B, -2)), L.pow(B, -4)))) && L.eq(L.add(L.pow(B, 2), K(-6)), L.mul(L.pow(B, 2), L.add(K(1), L.mul(K(-6), L.pow(B, -2))))) && 4 * 577 === 2308 && [45, 47].every((m) => 64 * m - 2308 > 0) && feq(fmul(fr(32n), ALPHA), fr(577n)) && feq(fmul(fr(2n), K0), fr(3n * H + 14n)) && [2118, 2010].every((E2) => bstarE(E2) ** 2n > 6n));
    add('h9', 'the Lucas endpoint test [2(b*² − 6)]^(32m) > (3H + 14)^(32m)·P(b*)^577 at (E, m) = (2118, 45) and (2010, 47), b* = 2·3^(E/2−1) − 1', (o.lucasPairs || [[2118, 45], [2010, 47]]).every(([E2, m]) => lucasEndpoint(E2, m)));
    add('h10', 'order 45 at E = 2118: c*^415 > (4H)^992, 1 − α/31 = 415/992; order 47 at E = 2010: 8^992·c*^415 > (25H)^992; 1/4 < 8/25', scalar45(2118) && feq(fsub(fr(1n), fdiv(ALPHA, fr(31n))), fr(415n, 992n)) && scalar47(o.scalar47E || 2010) && flt(fr(1n, 4n), fr(8n, 25n)));
    const t24 = fsub(fr(24n), ALPHA), k1 = fr(4712n, 4775n), k0 = fr(4616n, 4775n);
    add('h11', 'the final input: 24 − α = 191/32, 12/(24−α) = 384/191, α/(24−α) = 577/191, α/12 < 2, 7H·2^(α/12) + 6 < 40H, 40H < 2^670, b* > 67000 (E = 2118, 2010), (384/191)/100 + (577/191)(8/25) = 4712/4775, (577/191)(8/25) = 4616/4775, (4712/4775)x + 4616/4775 < x − 3 for every real x ≥ 301, 301 ≤ b*',
      feq(t24, fr(191n, 32n)) && feq(fdiv(fr(12n), t24), fr(384n, 191n)) && feq(fdiv(ALPHA, t24), fr(577n, 191n)) && flt(fdiv(ALPHA, fr(12n)), fr(2n)) && 40n * H - 6n > 0n && 2n ** 577n * (7n * H) ** 384n < (40n * H - 6n) ** 384n && 40n * H < 2n ** 670n
      && [2118, 2010].every((E2) => bstarE(E2) > 67000n && bstarE(E2) >= 301n) && feq(fadd(fdiv(fr(384n, 191n), fr(100n)), fmul(fr(577n, 191n), fr(8n, 25n))), k1) && feq(fmul(fr(577n, 191n), fr(8n, 25n)), k0)
      && flt(k1, fr(1n)) && flt(fadd(fmul(k1, fr(301n)), k0), fr(298n)));   /* linear with slope 1 − 4712/4775 > 0 on the right: true at 301 means true for every x ≥ 301 */
    add('h12', '11016 = 2³·3⁴·17', 11016n === 8n * 81n * 17n);
    add('h13', 'the stated failures: the Lucas endpoint test fails at (E, m) = (2112, 45); the order-47 scalar test 8^992·c*^415 > (25H)^992 fails at E = 2004', !lucasEndpoint(2112, 45) && !scalar47(2004));
  }
  return st;
}
function decideA(pr) {
  const st = statementsFor(pr);
  const fail = st.find((x) => !x.holds);
  const r = { verdict: fail ? 'REFUTED' : 'CERTIFIED', failedFirst: fail ? fail.id + ': ' + fail.text : null, statements: st.map(({ id, text, holds }) => ({ id, text, holds })) };
  if (pr === 13) r.values = { F: st.F, a13: st.a13 };
  return r;
}

/* ---- B: the bindings ----------------------------------------------------------------------------------------------- */
const meta = (f) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
function ciCopy(folder, rel) {
  const p = path.join(DIR, 'ci', folder, rel);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p);
}
const copyRecords = (copies) => copies.map(([folder, rel]) => { const [run, headSha, art, digest] = CI[folder]; const b = ciCopy(folder, rel); const rm = meta('ci/meta/run-' + run + '.json'); const am = meta('ci/meta/artifacts-' + run + '.json').artifacts.find((a) => a.id === art); return { run, headSha: rm.head_sha, conclusion: rm.conclusion, event: rm.event, artifact: art, digest: am && am.digest, expires: am && am.expires_at, path: rel, sha256: b ? sha(b) : null, bindsHead: rm.head_sha === headSha && !!am && am.digest === digest }; });
const blobOrNull = (commit, p) => { try { return blob(commit, p); } catch (e) { return null; } };
function decideB(pr, claim, opts = {}) {
  const checks = []; const add = (id, text, holds, detail) => checks.push({ id, text, holds: !!holds, ...(detail === undefined ? {} : { detail }) });
  const head = HEAD[pr];
  const pm = meta('meta/pr-' + pr + '.json');
  if (TWO.has(pr)) {   /* amendment B: #13 and #16, two tables each, opened after the protocol merge */
    const statedV = (o) => (opts.statedV && opts.statedV[o]) || claim.variants[o].sha256;
    add('b0', 'the saved PR metadata names this head and base, and its body states both table sha256s', pm.headRefOid === head && pm.baseRefOid === BASE && ORDERS.every((o) => pm.body.includes(claim.variants[o].sha256)));
    const parent = HEAD[PARENT[pr]];
    add('b1', 'the parent PR #' + PARENT[pr] + '\'s head is an ancestor of the head', isAncestor(parent, head));
    const ns = nameStatus(opts.diffFrom || parent, opts.diffTo || head);
    const bad = ns.filter(({ s, p }) => !(p.startsWith(PACKET[pr] + '/') || p === WORKFLOW[pr]) || s !== 'A');
    add('b2', 'the diff parent..head only adds files, all under ' + PACKET[pr] + '/ or ' + WORKFLOW[pr], bad.length === 0, { paths: ns.length, outside: bad.slice(0, 5).map((x) => x.s + ' ' + x.p) });
    if (pr === 13) {
      const origin = JSON.parse(blob(head, PACKET[13] + '/references/ORIGIN.json').toString('utf8'));
      const kept = blob(head, PACKET[13] + '/references/precision51_PROOF.md');
      const at = blobOrNull(FORK_ORIGIN, origin.path);
      add('b3', 'references/precision51_PROOF.md has the sha256 references/ORIGIN.json states, and is byte-identical to ' + origin.path + ' at the fork commit ORIGIN.json names (' + FORK_ORIGIN.slice(0, 8) + ')',
        origin.commit === FORK_ORIGIN && sha(kept) === (opts.originSha || origin.sha256) && at !== null && Buffer.compare(at, kept) === 0, { sha256: sha(kept), bytes: kept.length });
    }
    const man = blob(head, PACKET[pr] + '/SOURCE_BINDINGS.json');
    const statedMan = blob(head, PACKET[pr] + '/SOURCE_BINDINGS_SHA256.txt').toString('utf8').trim().split(/\s+/)[0];
    const mj = JSON.parse(man.toString('utf8'));
    const mism = mj.files.filter((f) => { const b = blobOrNull(head, f.path); return !b || sha(b) !== f.sha256; }).map((f) => f.path);
    const bodyOk = pr !== 16 || (pm.body.includes(statedMan) && mj.files.length === 85);
    add('b3m', 'SOURCE_BINDINGS.json has the sha256 SOURCE_BINDINGS_SHA256.txt states' + (pr === 16 ? ' (and the PR body, with 85 files)' : '') + ', and every file it lists has its listed sha256 at the head',
      sha(man) === statedMan && bodyOk && mism.length === 0, { files: mj.files.length, sha256: sha(man), mismatched: mism.slice(0, 5) });
    const ex = expected(pr);
    add('b4', 'EXPECTED.json states, for orders 45 and 47, the PR body\'s table sha256s and the stated bytes, coordinates, residuals, monomials, digits and bits', ORDERS.every((o) => { const s = ex[o] && ex[o].summary, v = claim.variants[o]; return !!s && ex[o].order === o && s.tableSha256 === statedV(o) && s.tableBytes === v.bytes && s.coordinates === v.n && s.residuals === v.residuals && s.monomials === v.m && s.maximumCoefficientDigits === v.digits && s.maximumCoefficientBits === v.bits && s.degree === 4 && s.integerContent === 1 && s.inputFourthPowerCoefficient === '1'; }));
    const copies = ORDERS.flatMap((o) => copyRecords(claim.variants[o].copies).map((c) => ({ order: o, ...c })));
    add('b5', 'every CI copy of each table has exactly the stated bytes, its artifact the pinned digest, and its run\'s metadata names the listed commit with a success conclusion', copies.every((c) => c.sha256 === statedV(c.order) && c.bindsHead && c.conclusion === 'success'), { copies });
    const fail = checks.find((c) => !c.holds);
    return { verdict: fail ? 'REFUTED' : 'CERTIFIED', failedFirst: fail ? fail.id + ': ' + fail.text : null, checks };
  }
  add('b0', 'the saved PR metadata names this head and base, and its body states the table sha256', pm.headRefOid === head && pm.baseRefOid === BASE && pm.body.includes(claim.sha256));
  if (pr === 8) {
    add('b1', 'main 9c0b3aba is an ancestor of the head', isAncestor(BASE, head));
    const allowed = [PKG8 + '/', 'docs/reviews/quartic389-import/', 'docs/reviews/quartic-stack-2026-11-08/'];
    const ns = nameStatus(BASE, head), nm = numstat(BASE, head);
    const bad = ns.filter(({ s, p }) => !(allowed.some((a) => p.startsWith(a)) || p === WORKFLOW[8]) || !(s === 'A' || (s === 'M' && nm.get(p) && nm.get(p).deleted === '0')));
    add('b2', 'the diff main..head touches only the package, the two review folders and research-checks.yml, deleting no line', bad.length === 0, { paths: ns.length, outside: bad.slice(0, 5) });
    const files = filesUnder(head, PKG8);
    add('b3', 'the package holds exactly 156 files', files.length === 156, { files: files.length });
    add('b4', 'the package and docs/reviews/quartic389-import are identical at 490d14ef (before the protocol merge) and at the head', treeId(PREPROTOCOL[8], PKG8) === treeId(head, PKG8) && treeId(PREPROTOCOL[8], 'docs/reviews/quartic389-import') === treeId(head, 'docs/reviews/quartic389-import') && treeId(head, PKG8) !== null);
    const t = blob(claim.table.commit, claim.table.path);
    add('b5', 'the committed table has the stated sha256 and bytes', sha(t) === claim.sha256 && t.length === claim.bytes);
  } else {
    const parent = HEAD[PARENT[pr]];
    add('b1', 'the parent PR #' + PARENT[pr] + '\'s head is an ancestor of the head', (opts.ancestor || isAncestor)(parent, head));
    const ns = nameStatus(opts.diffFrom || parent, opts.diffTo || head);
    const bad = ns.filter(({ s, p }) => !(p.startsWith(PACKET[pr] + '/') || p === WORKFLOW[pr]) || !(s === 'A' || s === 'M'));
    add('b2', 'the diff parent..head touches only ' + PACKET[pr] + '/ and ' + WORKFLOW[pr], bad.length === 0, { paths: ns.length, outside: bad.slice(0, 5).map((x) => x.s + ' ' + x.p) });
    add('b3', 'the packet is identical at the pre-protocol commit ' + PREPROTOCOL[pr].slice(0, 8) + ' and at the head', treeId(PREPROTOCOL[pr], PACKET[pr]) === treeId(head, PACKET[pr]) && treeId(head, PACKET[pr]) !== null);
    const ex = JSON.parse(blob(head, PACKET[pr] + '/EXPECTED.json').toString('utf8'));
    add('b4', 'EXPECTED.json states the same table sha256 and bytes, ' + claim.n + ' coordinates, ' + claim.m + ' monomials', ex.summary.tableSha256 === (opts.stated || claim.sha256) && ex.summary.tableBytes === claim.bytes && ex.summary.coordinates === claim.n && ex.summary.monomials === claim.m && ex.summary.residuals === claim.residuals);
    const copies = copyRecords(claim.copies);
    add('b5', 'every CI copy of the table has exactly the stated bytes, and each run\'s metadata names the listed commit', copies.every((c) => c.sha256 === (opts.stated || claim.sha256) && c.bindsHead && c.conclusion === 'success'), { copies });
  }
  const fail = checks.find((c) => !c.holds);
  return { verdict: fail ? 'REFUTED' : 'CERTIFIED', failedFirst: fail ? fail.id + ': ' + fail.text : null, checks };
}

/* ---- V13: #8's comparison rows ------------------------------------------------------------------------------------- */
function decideV13() {
  const out = {};
  for (const [name, spec] of Object.entries(V13)) {
    const buf = blob(spec.commit, spec.path);
    const lines = buf.toString('utf8').split('\n').filter((l) => l.length);
    const P = new Map(); const used = new Set(); let bad = null;
    for (const l of lines) {
      if (l.startsWith('#')) continue;
      const f = l.split('|').map((x) => x.trim());
      if (f.length !== 3 || !/^-?\d+$/.test(f[0]) || !/^\d+$/.test(f[1]) || !/^(|[1-9]\d*(,[1-9]\d*)*)$/.test(f[2])) { bad = l.slice(0, 60); break; }
      const ix = f[2] === '' ? [] : f[2].split(',').map(Number).sort((a, b) => a - b); ix.forEach((i) => used.add(i));
      const k = ix.join(','); if (!P.has(k)) P.set(k, new Map()); const g = P.get(k); const e = Number(f[1]); const s = (g.get(e) || 0n) + BigInt(f[0]); if (s === 0n) g.delete(e); else g.set(e, s);
    }
    if (bad !== null) { out[name] = { verdict: 'REFUSED', reason: 'a row is not "coefficient | C exponent | indices": ' + bad }; continue; }
    for (const [k, g] of P) if (!g.size) P.delete(k);
    const maxIndex = Math.max(...used); const contiguous = used.size === spec.n && maxIndex === spec.n && !used.has(0);
    const numbers = { sha256: sha(buf), bytes: buf.length, monomials: P.size, variables: used.size, maxIndex };
    if (name === 'ordinary') {
      let maxAbs = 0n, allZeroC = true; for (const g of P.values()) for (const [e, c] of g) { if (e !== 0) allZeroC = false; if (babs(c) > maxAbs) maxAbs = babs(c); }
      Object.assign(numbers, { everyCExponentZero: allZeroC, maxAbsCoefficientBits: bits(maxAbs) });
      out[name] = { verdict: contiguous && P.size === spec.m && allZeroC && bits(maxAbs) === spec.bits && buf.length === spec.bytes ? 'CERTIFIED' : 'REFUTED', numbers };
    } else {
      /* |Σ c_e C^e| ordered lexicographically from the top exponent, sign-normalized: valid since every |c_e| << C = 3^(2^25) */
      let small = true; const vec = (g) => { const es = [...g.keys()].sort((a, b) => b - a); const sg = g.get(es[0]) < 0n ? -1n : 1n; return es.map((e) => [e, sg * g.get(e)]); };
      const cmp = (a, b) => { for (let j = 0; j < Math.max(a.length, b.length); j++) { const x = a[j], y = b[j]; if (!x) return y[1] > 0n ? -1 : 1; if (!y) return x[1] > 0n ? 1 : -1; if (x[0] !== y[0]) return x[0] > y[0] ? (x[1] > 0n ? 1 : -1) : (y[1] > 0n ? -1 : 1); if (x[1] !== y[1]) return x[1] > y[1] ? 1 : -1; } return 0; };
      let best = null, ties = 0;
      for (const g of P.values()) { for (const c of g.values()) if (bits(c) >= 1 << 24) small = false; const v = vec(g); const c = best ? cmp(v, best) : 1; if (c > 0) { best = v; ties = 1; } else if (c === 0) ties++; }
      const isClaim = best && best.length === 1 && best[0][0] === spec.maxC && best[0][1] === spec.maxCoef;
      Object.assign(numbers, { coefficientsFarBelowC: small, maxAbs: best ? best.map(([e, c]) => c + '·C^' + e).join(' + ') : null, monomialsAttainingMax: ties });
      out[name] = { verdict: contiguous && P.size === spec.m && small && isClaim ? 'CERTIFIED' : 'REFUTED', numbers };
    }
  }
  const verdict = Object.values(out).every((x) => x.verdict === 'CERTIFIED') ? 'CERTIFIED' : Object.values(out).some((x) => x.verdict === 'REFUTED') ? 'REFUTED' : 'REFUSED';
  return { verdict, tables: out, claim: '#8 body: Version 13 decimal 411 variables, 6,388 monomials, 3,247 bits (214,957 bytes); symbolic 394 variables, 6,338 monomials, 16*3^(2^26). 411 - 389 = 22 and 394 - 389 = 5.', savings: { versusDecimal: 411 - 389, versusSymbolic: 394 - 389 } };
}

/* ---- the controls -------------------------------------------------------------------------------------------------- */
function refusedBy(fn) { try { const r = fn(); return r === true ? null : (r || 'not refused'); } catch (e) { if (e instanceof Stop) return e.message; throw e; } }
function controls(buf8, P8, nb) {   /* nb: amendment B's inputs, { t13_45, t16_47, P13_45 } */
  const out = []; const push = (id, what, msg, ok = msg !== null) => out.push({ id, what, refused: msg !== null, refusal: msg, passed: ok });
  const claim = CLAIM[8]; const lines = buf8.toString('utf8').split('\n');
  const firstData = lines.findIndex((l) => l && !l.startsWith('#'));
  const T = (ls, checkSha) => { const r = decideT(Buffer.from(ls.join('\n')), claim, 'control', { checkSha }); return r.verdict === 'CERTIFIED' ? true : r.differs.join('; '); };
  const ls1 = lines.slice(); { const [c, m] = ls1[firstData].split('\t'); ls1[firstData] = String(BigInt(c) + 1n) + '\t' + m; }
  push('CT1', 'one coefficient changed by one (the sha256 refuses)', refusedBy(() => T(ls1, true)));
  const ls2 = lines.map((l) => (l.endsWith('\tx0^4') ? '2\tx0^4' : l));
  push('CT2', 'sha256 off: the x0^4 coefficient set to 2', refusedBy(() => T(ls2, false)));
  const ls3 = lines.map((l) => (l && !l.startsWith('#') ? String(2n * BigInt(l.split('\t')[0])) + '\t' + l.split('\t')[1] : l));
  push('CT3', 'sha256 off: every coefficient doubled', refusedBy(() => T(ls3, false)));
  const ls4 = lines.filter((l) => !(l && !l.startsWith('#') && babs(BigInt(l.split('\t')[0])) === claim.max));
  push('CT4', 'sha256 off: the row of the largest coefficient removed', refusedBy(() => T(ls4, false)));
  const ls5 = lines.slice(); ls5.splice(lines.length - 1, 0, '1\tx389');
  push('CT5', 'sha256 off: a row 1 TAB x389 added (a 390th variable)', refusedBy(() => T(ls5, false)));
  const ls6 = lines.slice(); ls6.splice(lines.length - 1, 0, '1\tx1^5');
  push('CT6', 'sha256 off: a row 1 TAB x1^5 added (degree 5)', refusedBy(() => T(ls6, false)));
  /* amendment B: near-identical tables offered for each other's claims (same variables and monomials) */
  const TT = (buf, cl) => { const r = decideT(buf, cl, 'control', { checkSha: false }); return r.verdict === 'CERTIFIED' ? true : r.differs.join('; '); };
  push('CT7', 'sha256 off: #13\'s order-45 table offered as #16\'s order-45 claim', refusedBy(() => TT(nb.t13_45, CLAIM[16].variants[45])));
  push('CT8', 'sha256 off: #16\'s order-47 table offered as #13\'s order-47 claim', refusedBy(() => TT(nb.t16_47, CLAIM[13].variants[47])));
  /* N, each refused with an exact negative point evaluated by the same code */
  const degs = (PP) => { const m = new Map(); for (const t of PP.values()) for (const [i, e] of t.mono) m.set(i, Math.max(m.get(i) || 0, e)); return m; };
  const byVar = degs(P8);
  const d4 = [...byVar].find(([, d]) => d === 4)[0], d2s = [...byVar].filter(([, d]) => d === 2).map(([i]) => i);
  const plantOn = (PB, fn) => { const P = new Map([...PB].map(([k, t]) => [k, { c: t.c, mono: t.mono }])); fn(P); const r = decideN(P); if (r.verdict !== 'REFUTED') return null; const pt = new Map(Object.entries(r.witness.point).map(([k, x]) => [Number(k.slice(1)), x.includes('/') ? fr(BigInt(x.split('/')[0]), BigInt(x.split('/')[1])) : [BigInt(x), 1n]])); return evalAt(P, pt)[0] < 0n ? r.failure + ' — P < 0 at ' + JSON.stringify(r.witness.point).slice(0, 120) : null; };
  const plant = (fn) => plantOn(P8, fn);
  const addMono = (P, mono, c) => { const k = mkey(mono); const o = P.get(k); if (o) { o.c += c; if (o.c === 0n) P.delete(k); } else P.set(k, { c, mono }); };
  push('CN1', 'the x' + d4 + '^4 coefficient negated', plant((P) => { P.get(d4 + '^4').c = -P.get(d4 + '^4').c; }));
  const i2 = d2s[0], j2 = [...byVar.keys()].find((j) => j !== i2);
  push('CN2', 'a term x' + i2 + '^3·x' + j2 + ' planted (x' + i2 + ' has degree 2)', plant((P) => addMono(P, [[i2, 3], [j2, 1]].sort((a, b) => a[0] - b[0]), 1n)));
  push('CN3', '−10^800·x' + i2 + '^2·x' + j2 + '^2 added', plant((P) => addMono(P, [[i2, 2], [j2, 2]].sort((a, b) => a[0] - b[0]), -(10n ** 800n))));
  { const bv = degs(nb.P13_45); const i3 = [...bv].filter(([, d]) => d === 2).map(([i]) => i)[0], j3 = [...bv.keys()].find((j) => j !== i3);
    push('CN4', 'on #13\'s order-45 table: −10^800·x' + i3 + '^2·x' + j3 + '^2 added (x' + i3 + ' has degree 2)', plantOn(nb.P13_45, (P) => addMono(P, [[i3, 2], [j3, 2]].sort((a, b) => a[0] - b[0]), -(10n ** 800n)))); }
  /* A, through statementsFor with the planted change */
  const planted = (pr, id, o) => { const st = statementsFor(pr, o); const x = st.find((y) => y.id === id); return x.holds ? null : 'refused: ' + id + ' (' + x.text + ') fails with the planted change'; };
  push('CA1', 'b* := 2 in #8\'s Lucas margin', planted(8, 'a13', { bStar8: 2n }));
  push('CA2', 'the bit length of H claimed to be 10', planted(8, 'a7', { Hbits: 10 }));
  push('CA3', '(9·Π(p+1))^192 < 9^192·(Πp)^192', planted(8, 'a4', { a4: true }));
  push('CA4', '#9\'s conic with 3H² replaced by 4H²', planted(9, 'p1', { c3: 4 }));
  push('CA5', 'ρ + 1 ≡ 4 (mod 32)', planted(12, 'r1', { rhoShift: 1n }));
  push('CA6', '13 ≡ 7² (mod 17)', planted(12, 'r5', { root17: 7n }));
  push('CA7', '#13\'s delta3 with 3·98 replaced by 2·98', planted(13, 'c3', { delta3Coef: 2n }));
  /* CA8 (a1 := −1/5) withdrawn by amendment C: it only halves a13, whose reduced denominator is odd; it is a reading check now */
  push('CA9', 'the j ≥ 14 base case moved to j = 13', planted(13, 'd3', { base3: 13 }));
  push('CA10', '#16\'s Lucas endpoint test offered as passing at (E, m) = (2112, 45)', planted(16, 'h9', { lucasPairs: [[2112, 45]] }));
  push('CA11', '#16\'s order-47 scalar test offered as passing at E = 2004', planted(16, 'h10', { scalar47E: 2004 }));
  push('CA12', 'log 50 < 3.9', planted(16, 'h4', { logClaim: [50, 39, 10] }));
  push('CA13', 'the Q(√2) operator bound at ρ = √2 offered as 2√2 + 1', planted(16, 'h3', { sqrt2Claim: q2(1, 2) }));
  push('CA14', 'the displayed denominator of a13 with the factor 53 dropped (5²·7·17·29·37·41)', planted(13, 'd1', { den13: 25n * 7n * 17n * 29n * 37n * 41n }));
  /* B */
  { const s = CLAIM[9].sha256; const wrong = (s[0] === 'f' ? '0' : 'f') + s.slice(1);
    const r = decideB(9, CLAIM[9], { stated: wrong }); push('CB1', 'one hex digit of #9\'s stated table sha256 changed', r.verdict === 'CERTIFIED' ? null : r.failedFirst); }
  push('CB2', '#12\'s head offered as an ancestor of #8\'s', isAncestor(HEAD[12], HEAD[8]) ? null : 'refused: ' + HEAD[12].slice(0, 8) + ' is not an ancestor of ' + HEAD[8].slice(0, 8));
  { const r = decideB(9, CLAIM[9], { diffFrom: HEAD[8], diffTo: HEAD[11] }); push('CB3', '#9\'s file rule applied to the diff #8..#11', r.verdict === 'CERTIFIED' ? null : r.failedFirst); }
  { const r = decideB(16, CLAIM[16], { statedV: { 47: CLAIM[13].variants[47].sha256 } }); push('CB4', '#16\'s order-47 copies checked against #13\'s stated order-47 sha256', r.verdict === 'CERTIFIED' ? null : r.failedFirst); }
  { const r = decideB(13, CLAIM[13], { diffFrom: HEAD[12], diffTo: HEAD[16] }); push('CB5', '#13\'s file rule applied to the diff #12..#16', r.verdict === 'CERTIFIED' ? null : r.failedFirst); }
  { const s = JSON.parse(blob(HEAD[13], PACKET[13] + '/references/ORIGIN.json').toString('utf8')).sha256; const wrong = (s[0] === 'f' ? '0' : 'f') + s.slice(1);
    const r = decideB(13, CLAIM[13], { originSha: wrong }); push('CB6', 'one hex digit of ORIGIN.json\'s sha256 changed', r.verdict === 'CERTIFIED' ? null : r.failedFirst); }
  /* CR: our arithmetic against a red list */
  const Mx = (rows) => rows.map((r) => r.map((x) => [BigInt(x), 1n]));
  const psdOk = psdWitness(Mx([[1, 0], [0, 1]])) === null && psdWitness(Mx([[1, 1], [1, 1]])) === null && psdWitness(Mx([[0, 0], [0, 1]])) === null && psdWitness(Mx([[2, -1, 0], [-1, 2, -1], [0, -1, 2]])) === null;
  const notPsd = [[[1, 2], [2, 1]], [[0, 1], [1, 0]], [[1, 1, 1], [1, 1, 1], [1, 1, 0]]].every((m) => { const v = psdWitness(Mx(m)); return v && quadForm(Mx(m), v)[0] < 0n; });
  const counts = digits(10n ** 100n) === 101 && bits(2n ** 100n) === 101 && bits(255n) === 8 && bgcd(bgcd(12n, 18n), 30n) === 6n;
  const ids = L.eq(L.pow(L.add(S('a'), S('b')), 2), L.add(L.pow(S('a'), 2), L.mul(K(2), S('a'), S('b')), L.pow(S('b'), 2))) && !L.eq(L.pow(L.add(S('a'), S('b')), 2), L.add(L.pow(S('a'), 2), L.pow(S('b'), 2))) && L.eq(L.mul(L.pow(S('r'), -3), L.pow(S('r'), 3)), K(1));
  /* amendment B: e-bounds, Q(√2) signs, a residue-system step on a known false case */
  const eb = lnLess(2, 1, 1) && lnLess(7, 2, 1) && !lnLess(21, 3, 1);
  const s2 = Q2.sign(q2(-1, 1)) === 1 && Q2.sign([fr(3n, 2n), fr(-1n)]) === 1 && Q2.sign([fr(7n, 5n), fr(-1n)]) === -1;
  const stepFalse = !stepsAtLeast3((j) => 4n * j - (4n * j + 1n) / 3n, 3n, 14n) && stepsAtLeast3((j) => 4n * j - (4n * j + 1n) / 10n, 10n, 14n);
  push('CR', 'our arithmetic: four PSD matrices accepted, three refused with a checked witness, digit/bit/gcd counts, identities and a planted non-identity; e-bounds (2 < e, 7 < e² accepted, 21 < e³ refused), Q(√2) signs (√2 − 1, 3/2 − √2 > 0 accepted, 7/5 − √2 > 0 refused), a false residue-system step refused', psdOk && notPsd && counts && ids && eb && s2 && stepFalse ? 'every planted fault was seen' : null);
  return out;
}

/* ---- the run ------------------------------------------------------------------------------------------------------- */
function build() {
  const t0 = Date.now();
  const inputs = {};
  const tables = {};
  const firstCopy = (copies, label) => { const [folder, rel] = copies[0]; const buf = ciCopy(folder, rel); if (!buf) die('missing CI copy ' + folder + '/' + rel); const [run, , art] = CI[folder]; inputs[label] = { run, artifact: art, path: rel, sha256: sha(buf) }; return buf; };
  for (const pr of PRS) {
    const c = CLAIM[pr];
    if (pr === 8) { const buf = blob(c.table.commit, c.table.path); inputs['#8 table'] = { commit: c.table.commit, path: c.table.path, sha256: sha(buf) }; tables[pr] = buf; }
    else if (TWO.has(pr)) { tables[pr] = {}; for (const o of ORDERS) tables[pr][o] = firstCopy(c.variants[o].copies, '#' + pr + ' table, order ' + o); }
    else tables[pr] = firstCopy(c.copies, '#' + pr + ' table');
  }
  for (const [k, p] of Object.entries(PROOF)) { const b = blob(p.commit, p.path); inputs[PROOF_LABEL[k] || '#' + k + ' proof'] = { commit: p.commit, path: p.path, sha256: sha(b) }; }
  /* the proofs state what A decides: each displayed statement's text is present (the claim this decides has not moved) */
  const txt = (k) => blob(PROOF[k].commit, PROOF[k].path).toString('utf8');
  const tex8 = txt(8), p9 = txt(9), p11 = txt(11), p12 = txt(12), p13 = txt(13), r13 = txt('ref13'), p16 = txt(16);
  for (const [t, s] of [[tex8, '(p+1)^{192}>p^{193}'], [tex8, '54^{192}<53^{193}'], [tex8, '\\frac{8199}{53}'], [tex8, '\\frac{1418412}{53}'], [tex8, 'bit length $665$'], [tex8, '3^{53}>2^{84}'], [tex8, 'H_7-128=247520(\\mathcal H-128)'], [tex8, '7\\mathcal H2^{\\alpha/12}+6<40\\mathcal H'], [tex8, '40\\mathcal H<2^{670}'],
    [p9, '17 b q2 + 3H^2 - 2s2 H - s2^2 = 0'], [p9, '17 b Q2 + 3v^2 - 2s v - s^2 = 0'], [p9, 'H = s v,     q = s Q,     q2 = s^2 Q2,     s2 = s^2.'], [p9, '17 b q^2 + 3H^2 = 0'],
    [p11, '(c*)^415 > (4 Hheight)^992,'], [p11, '(b*)^143 > (24 Hheight)^360,'], [p11, '1-alpha/31=415/992'], [p11, '2-4alpha/45=143/360'], [p11, 'Since 2130=6*355'],
    [p12, 'rho = 4 mod 32,   rho = 81 mod 243,   rho = 13 mod 17.'], [p12, '`13=8^2 mod 17`'],
    /* amendment B */
    [p13, 'F(t)=t(t-1/49)(t-1/50)(t-1/2450)(t-32/1225)'], [p13, 'M=t2*(t+c4)+c3*t+c2=t^3+c4*t^2+c3*t+c2'], [p13, 't3=M-c4*t2-c3*t-c2,'], [p13, 'delta3=98^3*t3-3*98^2*t2+3*98*t-1.'],
    [p13, 'mixA=E^2; mixB=E^3; mixC=E^3*q1^3=e^6;'], [p13, 'mixD=mixC^2=e^12; q12=mixD^2/E=e^23/delta.'], [p13, 'e3=q1cube*delta3=e^3;'], [p13, 'q12=e12^2/E=e^23/delta.'],
    [p13, '`q45=mixedHigh^2/q1cube` agree exactly'], [p13, '`highLift=mixedHigh*E`, `q47=highLift^2/q1`'], [p13, 'it deletes twelve old gate rows, adds nine'], [p13, 'reference\'s count 386 describes its source before this three-coordinate'],
    [p13, '| Default order 45, anchor 2130 | 380 | 349 | 26,025 | `28902*3^1420` (682 digits, 2266 bits) |'], [p13, '| Optional order 47, anchor 2016 | 383 | 352 | 26,043 | `28902*3^1344` (646 digits, 2146 bits) |'],
    [r13, '`a0=1`, `a1=-2/5` and `a_j/a_(j-1)=(4j-5)/(4j+1)`'], [r13, '5^2 * 7 * 17 * 29 * 37 * 41 * 53.'], [r13, 'v(a_j w^j) >= 4jr - floor((4j+1)/10) >= 51r.'], [r13, '`4j-51-floor((4j+1)/10)=0`'], [r13, '`4j-floor((4j+1)/52)>=55`'],
    [r13, 'q12=E^11 q1^12,  mixedHigh=q12^2=E^22 q1^24.'], [r13, 'Since `delta^2=E/q1`, this is `E^45 q1^46`.'], [r13, '`q47=V^2/q1=E^46 q1^47`'], [r13, '`q_m=e^(2m-1)/delta`, with `e=q1 delta`'],
    [r13, 'Put `c*=2*3^1007`, `b*=3^1007`.'], [r13, '(c*)^415 > (4H)^992,'], [r13, '(b*)^(16m-577) > (24H)^(8m)  for every 46<=m<=51,'], [r13, '40H < 2^670,  b*>67000,  b*>152.'], [r13, 'with `alpha/m<1/2`'], [r13, '`B^(2-4alpha/m)<7H*5^(alpha/m)+6<24H`'],
    [r13, 'anchor 2010 fails the scalar inequality. At 2016, order 45 fails the Lucas'], [r13, 'both alternatives have 386 coordinates and 355 residuals.'],
    [p16, 'Its domain is satisfied: beta>=2401; equality'], [p16, 'four exceptional finite parameters 0,1,2401,-343/32'], [p16, 'Now C=(1-rho)C0+rho U.'], [p16, 'are 2*sqrt(2)-1 and 2*sqrt(2)+1, whose product is 7.'], [p16, 'Since log(50)<4, log(7)<2'], [p16, 'K0=(3*H+14)/2 < 7*H.'],
    [p16, '0 != a-1 in 2*3^(E/2-1)*Z.'], [p16, 'Set c*=2*3^(E/2-1), b*=c*-1.'], [p16, 'The selected exponents give 3^1058 | a-1 or 3^1004 | a-1.'], [p16, 'impose respectively 3^1064 or 3^1007.'], [p16, '|F| <= P(B)=2*B^4+6*B^3+5*B^2+1.'],
    [p16, '[2*(b*^2-6)]^(32*m) > (3*H+14)^(32*m) * P(b*)^577.'], [p16, 'B^(64*m-2308) * (1-6/B^2)^(32*m)'], [p16, '(2+6/B+5/B^2+B^(-4))^577.'], [p16, 'at (E,m)=(2118,45) and (2010,47)'], [p16, 'The exact integer test is c*^415>(4H)^992, since'],
    [p16, '8^992 * c*^415 > (25*H)^992, hence h(beta)<8*c/25.'], [p16, '= (384/191)*log(40H) + (577/191)*h(beta).'], [p16, 'The source absorption remains valid: alpha/12<2 and'], [p16, 'The exact comparisons 40H<2^670 and b*>67000 give'],
    [p16, 'log B < (4712/4775)*|a| + 4616/4775 < |a|-3'], [p16, 'for |a|>=301'], [p16, '11016=2^3*3^4*17'], [p16, 'E=2112 fails the displayed Lucas test at order 45; E=2004 fails the chosen'],
    [p16, '| 45 | 2118 | 380 | 349 | 26025 | 28902*3^1412 (679 digits, 2253 bits) |'], [p16, '| 47 | 2010 | 383 | 352 | 26043 | 28902*3^1340 (644 digits, 2139 bits) |']])
    if (!t.includes(s)) die('a proof no longer states ' + JSON.stringify(s) + ' (the claim this decides moved)');
  const prs = {};
  let P8 = null, P13_45 = null;
  const combine = (vs) => (vs.every((x) => x === 'CERTIFIED') ? 'CERTIFIED' : vs.includes('REFUTED') ? 'REFUTED' : 'REFUSED');
  const readT = (buf, c, what) => { try { return decideT(buf, c, what); } catch (e) { if (!(e instanceof Stop)) throw e; return { verdict: 'REFUSED', differs: [e.message], numbers: null, P: null }; } };
  const claimOf = (c) => ({ variables: c.n, residuals: c.residuals, monomials: c.m, maxAbsCoefficient: c.maxText, digits: c.digits, bits: c.bits, tableBytes: c.bytes, tableSha256: c.sha256 });
  const TITLE = { 8: 'Add conditional 389-variable quartic research construction', 9: 'Reduce the conditional quartic to 385 variables (stacked on #8)', 11: 'Reduce conditional 385-variable quartic coefficients to 682 digits (above #9)', 12: 'Reduce the conditional quartic to 383 variables (above #11)',
    13: 'Reduce the conditional quartic to 380 variables (above #12)', 16: 'Sharpen conditional quartic coefficients to 679/644 digits (above #13)' };
  const CI_ONLY = 'CI artifacts only (fork cameronfreer/diophantine-z-q), not committed; they expire 2027-02-06';
  for (const pr of PRS) {
    const c = CLAIM[pr];
    let Trec, N, claim, residualsCount;
    if (TWO.has(pr)) {
      const Ts = {}, Ns = {};
      for (const o of ORDERS) {
        const T = readT(tables[pr][o], c.variants[o], '#' + pr + ' order ' + o);
        if (pr === 13 && o === 45) P13_45 = T.P;
        Ts['order ' + o] = { verdict: T.verdict, differs: T.differs, numbers: T.numbers };
        Ns['order ' + o] = T.P ? decideN(T.P) : { verdict: 'REFUSED', failure: 'the table was not read' };
      }
      Trec = { verdict: combine(Object.values(Ts).map((x) => x.verdict)), tables: Ts };
      N = { verdict: combine(Object.values(Ns).map((x) => x.verdict)), tables: Ns };
      claim = { variants: Object.fromEntries(ORDERS.map((o) => ['order ' + o + (o === 45 ? ' (default)' : ' (optional)'), claimOf(c.variants[o])])), tableLocation: CI_ONLY };
      residualsCount = 'not decided: the ' + ORDERS.map((o) => c.variants[o].residuals).join(' and ') + ' residuals are not published';
    } else {
      const T = readT(tables[pr], c, '#' + pr);
      if (pr === 8) P8 = T.P;
      Trec = { verdict: T.verdict, differs: T.differs, numbers: T.numbers };
      N = T.P ? decideN(T.P) : { verdict: 'REFUSED', failure: 'the table was not read' };
      claim = Object.assign(claimOf(c), { tableLocation: pr === 8 ? 'committed: ' + c.table.path : CI_ONLY });
      residualsCount = 'not decided: the ' + c.residuals + ' residuals are not published';
    }
    const A = decideA(pr);
    const B = decideB(pr, c);
    const v = { T: Trec.verdict, N: N.verdict, A: A.verdict, B: B.verdict };
    const rec = { title: TITLE[pr], head: HEAD[pr], parent: pr === 8 ? 'main ' + BASE : '#' + PARENT[pr] + ' ' + HEAD[PARENT[pr]], claim };
    if (pr === 8) { const V = decideV13(); v.V13 = V.verdict; rec.V13 = V; }
    Object.assign(rec, { verdicts: v, T: Trec, N, A, B });
    rec.decidedScope = combine(Object.values(v));
    rec.protocolOutcome = rec.decidedScope === 'REFUTED' ? 'Changes required (the finding named in the question that is REFUTED)' : 'Incomplete review: the finite scope below is decided; the proofs, the application contracts and the inherited inputs are not reviewed';
    rec.residualsCount = residualsCount;
    prs['#' + pr] = rec;
  }
  const ctl = controls(tables[8], P8, { t13_45: tables[13][45], t16_47: tables[16][47], P13_45 });
  const controlsOk = ctl.every((x) => x.passed);
  const scopes = Object.values(prs).map((r) => r.decidedScope);
  const verdict = !controlsOk ? 'REFUSED' : combine(scopes);
  const reason = !controlsOk ? 'a control did not come out as pre-registered: ' + ctl.filter((x) => !x.passed).map((x) => x.id).join(', ')
    : verdict === 'CERTIFIED' ? 'for each of #8, #9, #11, #12, #13 and #16: each table (two for #13 and for #16, an order-45 default and an order-47 optional route) is what the PR states (variables, degree, monomials, the exact largest coefficient, content, x0^4), it passes the necessary sum-of-squares condition for every variable, every finite statement its proof displays holds (for #13 also those of its retained order-47 argument; the four stated failures fail), and the published bytes are bound to the PR as stated; #8\'s Version 13 comparison rows hold; every control refused'
      : 'see the pull request whose scope is not CERTIFIED';
  return {
    rec: {
      what: 'The finite facts of Cameron Freer\'s conditional quartic stack on github.com/elliotglazer/diophantine-z-q (#8, #9, #11, #12, #13, #16), decided by a non-author reviewer with code of its own (Node, BigInt, exact rationals; none of the repository\'s .py or .cjs run, read or ported): T the tables, N a necessary condition for a sum of squares, A the finite statements the proofs display, B the bindings of the published bytes, V13 #8\'s comparison rows.',
      undecided: UNDECIDED,
      notDecided: NOT_DECIDED,
      generated: new Date().toISOString().slice(0, 10),
      preregistration: 'notes/zq-freer-preregistration-2026-11-08.md',
      reviewer: { name: 'Carlos Toledo', github: 'carlostoledo1891', with: 'Claude agents: Anthropic Claude Opus 5.5 (claude-opus-5-5) in Claude Code, one agent session', role: 'non-author review decision under PROTOCOL.md v1.2 (main 9c0b3aba); contributor-written, so it neither is nor authorizes the "Protocol / independent agent audit" App check that ruleset 26781429 requires' },
      repository: 'github.com/elliotglazer/diophantine-z-q', base: BASE,
      inputs,
      code: { 'tools/zq-freer.js': sha(fs.readFileSync(__filename)) },
      verdict, reason,
      prs,
      controls: ctl,
      readingChecks: [(() => { const s = statementsFor(13, { aFromJ1: true }); return { id: 'CA8 (withdrawn as a control by amendment C)', what: '#13\'s retained recurrence read from j = 1 (a1 := −1/5) instead of j ≥ 2', d1Holds: s.find((x) => x.id === 'd1').holds, a13: s.a13, note: 'a1 := −1/5 only halves a13, whose reduced denominator is odd; d1 (the denominator) holds under either reading, so its verdict does not depend on the reading' }; })()],
      readings: {
        T: 'the header\'s format: comment lines first; each data line a signed decimal integer, a TAB, a monomial ("1" or x<i>, x<i>^<e> joined by "*"); all data rows summed; numbers read from the sum.',
        N: 'if P = Σ R_j² with deg R_j ≤ 2 over Q, every occurring x_i has degree 2 or 4 in P; degree 4 forces a positive x_i^4 coefficient; degree 2 forces the coefficient of x_i² (Σ L_j², L_j affine) to have a PSD Gram matrix over (1, y). Necessary, not sufficient: CERTIFIED does not mean the table is a sum of squares.',
        A: 'each statement exactly as the proof displays it (arithmetic_round8.tex; PROOF.md of #9, #11, #12, #13, #16; #13\'s references/precision51_PROOF.md), checked by BigInt and exact rationals; the surrounding inferences are read, not decided. Amendment B: a stated failure is decided as the non-strict reverse inequality; log bounds through the rational lower bound Σ_{k≤12} 1/k! < e (they can only be confirmed); signs in Q(√2) by squares; the operator bound at a real embedding read as |1 − ρ| + |ρ| for C = (1 − ρ)C0 + ρU; statements over every integer j ≥ 14 by a base case and a complete residue system for the step; the a-recurrence of the order-47 argument read for j ≥ 2 (with a1 = −2/5 given).',
        B: 'git ancestry, name-status/numstat diffs and tree ids by commit; CI copies by sha256 against the stated value, with the saved run and artifact metadata (gh api) binding each copy to its commit. Amendment B: #13\'s retained proof against ORIGIN.json and the fork commit it names; each SOURCE_BINDINGS.json against its stated sha256 and every listed file against its blob at the head.',
      },
    },
    seconds: (Date.now() - t0) / 1000,
  };
}

const { rec: R, seconds } = build();
const strip = (x) => JSON.stringify(Object.assign({}, x, { generated: null }));
const line = (r) => Object.entries(r.prs).map(([k, p]) => k + ' ' + p.decidedScope + ' (' + Object.entries(p.verdicts).map(([q, v]) => q + ' ' + v).join(', ') + ')').join(' · ');
if (process.argv.includes('--check')) {
  if (!fs.existsSync(OUT)) die('no record to check');
  if (strip(JSON.parse(fs.readFileSync(OUT, 'utf8'))) !== strip(R)) die('certs/zq-freer-2026-11-08.json is not what the pinned inputs and this code give now');
  console.log('zq-freer: re-derived, identical · ' + R.verdict + ' · ' + line(R) + ' · ' + seconds.toFixed(1) + ' s');
} else {
  fs.writeFileSync(OUT, JSON.stringify(R, null, 1) + '\n');
  console.log('zq-freer: ' + R.verdict + ' · ' + line(R) + ' · controls ' + R.controls.filter((c) => c.passed).length + '/' + R.controls.length + ' · ' + seconds.toFixed(1) + ' s');
  for (const [k, p] of Object.entries(R.prs)) {
    for (const [w, t] of p.T.tables ? Object.entries(p.T.tables) : [['', p.T]]) if (t.differs && t.differs.length) console.log('  ' + k + ' T ' + w + ': ' + t.differs.join('; '));
    for (const [w, n] of p.N.tables ? Object.entries(p.N.tables) : [['', p.N]]) if (n.verdict !== 'CERTIFIED') console.log('  ' + k + ' N ' + w + ': ' + n.failure);
    if (p.A.failedFirst) console.log('  ' + k + ' A: ' + p.A.failedFirst);
    if (p.B.failedFirst) console.log('  ' + k + ' B: ' + p.B.failedFirst);
  }
  for (const c of R.controls.filter((x) => !x.passed)) console.log('  control ' + c.id + ' NOT as predicted: ' + c.refusal);
}
