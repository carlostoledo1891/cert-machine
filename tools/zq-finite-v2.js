#!/usr/bin/env node
/* zq-finite-v2.js — lane 3's three REFUSED replays of the claim "Z is Diophantine in Q" (Glazer et al.), re-checked
   against the claimant's Issue 3 note (elliotglazer/diophantine-z-q at 036cebe4, docs/audit-history/issue3/README.md),
   plus the Version 4 final.rows_sha256 and his 28-file identity claim. Writes certs/zq-finite-v2.json; `--check`
   re-derives it and refuses on any difference.

   THE THEOREM IS UNDECIDED HERE. These suites check finite arithmetic facts the construction uses; nothing here
   decides the zero projection, the global height or restricted-converse inputs, or the source's arithmetic theorem.

   PRE-REGISTERED: notes/zq-preregistration-2026-11-06.md, Amendment A3 (commit 1a5ab1e9), committed before this file
   ran; Amendment A3.1 (985fcc56) after a first pass, before the recorded one. certs/zq-finite.json (2026-11-06, MIXED) is NOT rewritten: it stays as dated history.

   CLEAN ROOM: written from the note's prose (its README) and data (construction-checks.json, source-comparison.json),
   the definition JSON's own prose blocks, the spec (§§3-5) and the TeX. Never read or run: replay_row_hash.py, any
   verify-*.js, scripts/check_construction.py, verify_certificate.py, his CI, any of his code. Their bytes stay in
   their clones (no licence): $ZQ_NOTE_REPO (default ~/Projects/zq-scout/issue3-036cebe4), $ZQ_REPO (97cec7fd),
   $ZQ_V4_REPO (5cb2c199). Two functions are REUSED, not rewritten, from the files that decided the earlier records:
   makeEvaluator of tools/zq-finite.js and inputs/replay/decideV1/decideV3 of tools/zq-v4.js, each loaded from its pinned sha256 with
   its main block cut off (those files are not edited, because their records pin their own bytes).

   usage: node tools/zq-finite-v2.js [--check]                                                                    MIT */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const Module = require('module');
const { execFileSync } = require('child_process');
const { Q, Q0, Q1, K, curve, psiTable, iotaByPsi } = require('./zq-k0.js');

const ROOT = path.join(__dirname, '..');
const HOME = os.homedir();
const NOTE_REPO = process.env.ZQ_NOTE_REPO || path.join(HOME, 'Projects', 'zq-scout', 'issue3-036cebe4');
const OLD_REPO = process.env.ZQ_REPO || path.join(HOME, 'Projects', 'zq-scout', 'diophantine-z-q');
const V4_REPO = process.env.ZQ_V4_REPO || path.join(HOME, 'Projects', 'zq-scout', 'v4-5cb2c199');
const OUT = path.join(ROOT, 'certs', 'zq-finite-v2.json');
const die = (m) => { console.error('zq-finite-v2: ' + m); process.exit(1); };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const H = (s) => crypto.createHash('sha256').update(Buffer.from(s, 'utf8')).digest('hex');

const NOTE = 'docs/audit-history/issue3/';
const PIN = {
  repository: 'github.com/elliotglazer/diophantine-z-q',
  note: {
    commit: '036cebe4f1a4aa7ca89820a9b48f3629b4c364d6',
    files: {
      [NOTE + 'README.md']: 'fffbd11b15206875f116ff82acfb57d1bb41fddf191e13b4f934e6fbbd8fa402',
      [NOTE + 'construction-checks.json']: '4c608807700fe1eb21b2390998522ee18f39faaa12e11d0bc4bba6a0eb6eceb2',
      [NOTE + 'quartic-checks.json']: 'b7b2519d2af4f4780fc156f1a8dab4766397f6d4b81426732ba6c7feeff18089',
      [NOTE + 'source-comparison.json']: 'e4f054eacacbe29b36c50efd53d087565117cccb6049b58f29fb208999d60996',
    },
    hashedNeverRead: { [NOTE + 'replay_row_hash.py']: 'ad7fe0f985549d8e79b0fa840d651e0120c2a85dd4d18fbed8f09673200de52a' },
  },
  original: {
    commit: '97cec7fdd757d9a8e4f468151a47a6d3610fb2f2',
    definition: { path: 'construction/ordinary-integer-definition.json', sha256: '4d639d4c44e69ea360d36d4591b8fdc82269d68b9363af0157d1e5c1174c7af6' },
    spec: { path: 'construction/integer-compiler-spec.txt', sha256: '9a3a01fc78e922351cf4e6f47d1bc160c6f392d76279d71c9f0b9f2bc91d9eb1' },
    tex: { path: 'diophantine_zq.tex', sha256: 'cb1148cd6c7769d2af3f1636b60ff0ada4b40431978d1e98d0c339274b3d792b' },
  },
  version4: {
    commit: '5cb2c1997dde6e358f3c2fe9bbdb4b8f4c23bac6',
    candidateRows: { path: 'quartics/quartic-4973/candidate-rows.json.gz', sha256: '1399f9e16932863b4b46a8977061617ed2013ad0947f4b4b7742f07e8e30edd1' },
  },
};
const ROWS_SHA_CLAIMED = '758e6c9f9225109017d2d80ee663a266c92ccf51de91f308304a02147031c7ea';
const REUSED = {
  'tools/zq-finite.js': { sha256: 'b1ea1e751a2b98ee06e4a7290c64ed25edc1eeeeb351a07dbe2e5adfe61ca727', cut: 'const T0 = Date.now();\nconst Lrec = build();', exports: ['makeEvaluator', 'A_TEX', 'P0'], record: 'certs/zq-finite.json' },
  'tools/zq-v4.js': { sha256: '73bf562bcc51aa4acd2c2e056a342d239e7ed35e0eabb18dd3b61457b34b3b47', cut: 'const { rec: L, seconds } = build();', exports: ['inputs', 'replay', 'decideV1', 'decideV3', 'JP', 'PIN'], record: 'certs/zq-v4.json' },
};
const UNDECIDED = 'The theorem (Z is Diophantine in Q) is undecided here: the main Lean target is unproved (its proof is `sorry`) and nothing in this record decides it. This record re-checks three finite-suite replays and one serialization against the claimant\'s Issue 3 note; by his own README those suites do not establish the zero projection, the global height or restricted-converse inputs, or the natural precision polynomial\'s semantics.';

const git = (repo, ...a) => execFileSync('git', ['-C', repo, ...a], { encoding: 'utf8' }).trim();
const readAt = (repo, rel, want) => {
  const p = path.join(repo, rel);
  if (!fs.existsSync(p)) die('no ' + rel + ' in ' + repo + '; refusing');
  const b = fs.readFileSync(p);
  if (want && sha(b) !== want) die(rel + ' in ' + repo + ' is not the pinned bytes; REFUSED, nothing computed');
  return b;
};
/* a reused function: the pinned bytes of the file that decided an earlier record, main block cut off */
function loadReused(rel) {
  const R = REUSED[rel], file = path.join(ROOT, rel), src = fs.readFileSync(file, 'utf8');
  if (sha(src) !== R.sha256) die(rel + ' is not the bytes that decided ' + R.record + '; refusing');
  const recorded = JSON.parse(fs.readFileSync(path.join(ROOT, R.record), 'utf8')).code[rel];
  if (recorded !== R.sha256) die(R.record + ' does not pin ' + rel + ' at ' + R.sha256);
  const cut = src.indexOf(R.cut); if (cut < 0) die(rel + ': the main-block marker is not there');
  const m = new Module(file, module); m.filename = file; m.paths = Module._nodeModulePaths(path.dirname(file));
  m._compile(src.slice(0, cut) + '\nmodule.exports = { ' + R.exports.join(', ') + ' };\n', file);
  return m.exports;
}

/* ---- items, verdicts ---- */
function itemBook() {
  const items = [], controls = [];
  const item = (id, what, theirs, ours, verdict, extra) => { const r = Object.assign({ id, what, theirs, ours, verdict }, extra || {}); items.push(r); return r; };
  const control = (id, mutation, prediction, outcome, passed) => controls.push({ id, mutation, prediction, outcome: String(outcome), passed: !!passed });
  return { items, controls, item, control };
}
function suiteVerdict(B) {
  const bad = B.controls.filter((c) => !c.passed);
  if (bad.length) return { verdict: 'REFUSED', reason: 'a red control did not come out as pre-registered: ' + bad.map((c) => c.id).join(', ') };
  const v = B.items.map((i) => i.verdict);
  if (v.includes('REFUTED')) return { verdict: 'REFUTED', reason: 'a case he reports as passing fails our exact check: ' + B.items.filter((i) => i.verdict === 'REFUTED').map((i) => i.id).join(', ') };
  if (v.every((x) => x === 'CERTIFIED')) return { verdict: 'CERTIFIED', reason: 'every counted item rebuilt from the note and agreeing exactly (' + B.items.length + ' items; ' + B.controls.length + ' red controls as predicted)' };
  if (v.includes('CERTIFIED')) return { verdict: 'MIXED', reason: 'CERTIFIED: ' + B.items.filter((i) => i.verdict === 'CERTIFIED').map((i) => i.id).join(', ') + '; REFUSED: ' + B.items.filter((i) => i.verdict === 'REFUSED').map((i) => i.id).join(', ') };
  return { verdict: 'REFUSED', reason: 'no counted item is determined by the prose' };
}

/* ================================================================================================================
   SUITE 1: the integer compiler — the note's four counters, rebuilt as it states them (fresh code)
   ============================================================================================================== */
function suiteIC(theirs) {
  const B = itemBook();
  const pas = [[1n]]; for (let n = 1; n <= 130; n++) { const r = [1n]; for (let k = 1; k < n; k++) r.push(pas[n - 1][k - 1] + pas[n - 1][k]); r.push(1n); pas.push(r); }
  const C = (n, k) => (k < 0 || k > n ? 0n : pas[n][k]);
  const odd = (x) => (x & 1n) === 1n;
  /* digitCases: n ∈ [0,14], k ∈ [0,18], B = 2^(n+1), floor((B+1)^n / B^k) mod B = binomial(n,k) */
  const digit = (baseExp) => { const f = []; let n0 = 0; for (let n = 0; n <= 14; n++) for (let k = 0; k <= 18; k++) { n0++; const Bb = 2n ** BigInt(baseExp(n)); if (((Bb + 1n) ** BigInt(n) / Bb ** BigInt(k)) % Bb !== C(n, k)) f.push([n, k]); } return { cases: n0, f }; };
  const d = digit((n) => n + 1);
  B.item('IC-digit', 'digitCases: n ∈ [0,14], k ∈ [0,18], B = 2^(n+1): ⌊(B+1)^n / B^k⌋ mod B = binomial(n,k), 0 for k > n', theirs.digitCases, d.cases, d.cases === theirs.digitCases && !d.f.length ? 'CERTIFIED' : d.f.length ? 'REFUTED' : 'REFUSED', d.f.length ? { witness: d.f.slice(0, 3) } : null);
  const dg = digit((n) => n);
  B.control('ICR1', 'the digit base 2^n in place of 2^(n+1)', 'some digit case fails', dg.f.length + ' of ' + dg.cases + ' fail, first ' + JSON.stringify(dg.f[0]), dg.f.length > 0);
  /* bitCases: every ordered (a, b) ∈ [0,63]², the three assertions together as one case */
  const bits = (swap) => { const f = []; let n0 = 0; for (let a = 0; a < 64; a++) for (let b = 0; b < 64; b++) { n0++; const s1 = odd(swap ? C(a, b) : C(b, a)) === ((a & b) === a); const s2 = odd(C(a + b, a)) === ((a & b) === 0); const z = a & b, x = a - z, y = b - z; const s3 = (z & x) === 0 && (z & y) === 0 && (x & y) === 0; if (!(s1 && s2 && s3)) f.push([a, b]); } return { cases: n0, f }; };
  const bt = bits(false);
  B.item('IC-bit', 'bitCases: every ordered (a,b) ∈ [0,63]²; binomial(b,a) odd ⟺ a AND b = a; binomial(a+b,a) odd ⟺ a AND b = 0; z = a AND b, x = a−z, y = b−z give z AND x = z AND y = x AND y = 0', theirs.bitCases, bt.cases, bt.cases === theirs.bitCases && !bt.f.length ? 'CERTIFIED' : bt.f.length ? 'REFUTED' : 'REFUSED', bt.f.length ? { witness: bt.f.slice(0, 3) } : null);
  const bs = bits(true);
  B.control('ICR2', 'the subset test with the binomial\'s arguments swapped, binomial(a,b)', 'some pair fails', bs.f.length + ' of ' + bs.cases + ' fail', bs.f.length > 0);
  /* packedCases: six two-instruction programs, c ∈ {1,2}, q ∈ [0,3], every register and state sequence of length q+1 */
  const PROGRAMS = [
    { name: 'add→0', ins: ['add', 0] }, { name: 'add→1', ins: ['add', 1] },
    { name: 'sub(nz 0, z 0)', ins: ['sub', 0, 0] }, { name: 'sub(nz 0, z 1)', ins: ['sub', 0, 1] },
    { name: 'sub(nz 1, z 0)', ins: ['sub', 1, 0] }, { name: 'sub(nz 1, z 1)', ins: ['sub', 1, 1] },
  ];
  /* the direct history predicate: initial state 0, final state 1, final register 0, no earlier halt, the transition at every step */
  const direct = (pr, r, s, q, noEarlierHalt = true) => {
    if (s[0] !== 0 || s[q] !== 1 || r[q] !== 0) return false;
    for (let t = 0; t < q; t++) {
      if (s[t] === 1) { if (noEarlierHalt) return false; continue; }          /* the control's variant: a halt step imposes nothing */
      const [op, a1, a2] = pr.ins;
      if (op === 'add') { if (r[t + 1] !== r[t] + 1 || s[t + 1] !== a1) return false; }
      else if (r[t] > 0) { if (r[t + 1] !== r[t] - 1 || s[t + 1] !== a1) return false; }
      else if (r[t + 1] !== 0 || s[t + 1] !== a2) return false;                 /* a zero register stays zero on the zero branch */
    }
    return true;
  };
  /* the packed predicate of spec §5: m = 2 states (0 the instruction, 1 halt), one register, input a = r(0) */
  const packed = (pr, r, s, q, c, dropBC) => {
    const m = 2, Kk = 1n << BigInt(c), Bb = 4n * Kk, T = Bb ** BigInt(q), a = BigInt(r[0]);
    if (!(c > 0) || !(Bb > BigInt(m)) || !(a < Kk)) return false;
    let F = 0n; const Bp = []; for (let t = 0; t <= q; t++) { Bp.push(Bb ** BigInt(t)); F += Bp[t]; }
    const D = (Kk - 1n) * F;
    if (Bb * F + 1n !== F + Bb * T || D + F !== Kk * F) return false;
    let R = 0n; for (let t = 0; t <= q; t++) R += BigInt(r[t]) * Bp[t];
    if ((R & D) !== R || !(R < T)) return false;
    const S = [0n, 0n]; for (let t = 0; t <= q; t++) S[s[t]] += Bp[t];
    for (const Si of S) if ((Si & F) !== Si) return false;
    if (S[0] + S[1] !== F || S[1] !== T) return false;
    const KN = (R + D) & (Kk * F); if (KN % Kk !== 0n) return false; const N = KN / Kk;
    const [op, a1, a2] = pr.ins;
    let V = null, W = null;
    if (op === 'sub') { V = S[0] & N; W = S[0] - V; if (W < 0n) return false; }
    const Aj = op === 'add' ? S[0] : 0n, Cj = op === 'sub' ? V : 0n;
    if (R + (dropBC ? 0n : Bb * Cj) !== a + Bb * R + Bb * Aj) return false;
    for (let dd = 0; dd < m; dd++) {
      let I = 0n;
      if (op === 'add' && a1 === dd) I += S[0];
      if (op === 'sub') { if (a1 === dd) I += V; if (a2 === dd) I += W; }
      if (S[dd] !== (dd === 0 ? 1n : 0n) + Bb * I) return false;
    }
    return true;
  };
  const pk = (variant) => {
    let n0 = 0, valid = 0; const f = [];
    for (const pr of PROGRAMS) for (const c of [1, 2]) for (let q = 0; q <= 3; q++) {
      const Kk = 1 << c, L = q + 1;
      for (let rc = 0; rc < Kk ** L; rc++) {
        const r = []; let x = rc; for (let t = 0; t < L; t++) { r.push(x % Kk); x = Math.floor(x / Kk); }    /* least significant digit first */
        for (let sc = 0; sc < 2 ** L; sc++) {
          const s = []; for (let t = 0; t < L; t++) s.push((sc >> t) & 1);
          n0++;
          const dv = direct(pr, r, s, q, variant !== 'no-earlier-halt-dropped'), pv = packed(pr, r, s, q, c, variant === 'drop-BC');
          if (dv) valid++;
          if (dv !== pv) f.push([pr.name, c, q, r.join(''), s.join(''), dv, pv]);
        }
      }
    }
    return { cases: n0, valid, f };
  };
  const p = pk();
  B.item('IC-packed', 'packedCases: six two-instruction programs (instruction 0 on register 0, instruction 1 halt), c ∈ {1,2}, q ∈ [0,3], every register sequence over [0, 2^c−1] and state sequence over {0,1} of length q+1: the packed predicate of spec §5 (input a = r(0)) agrees with the direct history predicate on every sequence', theirs.packedCases, p.cases, p.cases === theirs.packedCases && !p.f.length ? 'CERTIFIED' : p.f.length ? 'REFUTED' : 'REFUSED', Object.assign({ validHistories: p.valid, countFormula: '6·Σ_{c=1,2} Σ_{q=0..3} (2^c)^(q+1)·2^(q+1)' }, p.f.length ? { witness: p.f.slice(0, 3) } : {}));
  const p1 = pk('drop-BC');
  B.control('ICR3', 'the register equation without its B·C_j term', 'packed and direct disagree on some sequence', p1.f.length + ' sequences disagree', p1.f.length > 0);
  const p2 = pk('no-earlier-halt-dropped');
  B.control('ICR4', 'the direct predicate without "no earlier halt" (a halt step imposing nothing); pre-registered as deciding nothing either way', 'recorded either way', p2.f.length + ' sequences disagree', true);
  /* backendCases: x, y ∈ [0,6], the first zero over d, then u, then v in [0, top] */
  const backend = (five, top) => {
    const f = []; let n0 = 0;
    for (let x = 0; x <= 6; x++) for (let y = 0; y <= 6; y++) {
      n0++; let found = null;
      search: for (let dd = 0; dd <= top; dd++) for (let u = 0; u <= top; u++) for (let v = 0; v <= top; v++) {
        const e1 = y - x - 1 - dd, e2 = x + 3 * u - y - 3 * v;
        if ((e1 * e1 + e2 * e2) * (x - five) === 0) { found = [dd, u, v]; break search; }
      }
      const formula = (x < y && (((x - y) % 3) + 3) % 3 === 0) || x === 5;
      if ((found !== null) !== formula) f.push([x, y, found, formula]);
    }
    return { cases: n0, f };
  };
  const be = backend(5, 7);
  B.item('IC-backend', 'backendCases: x, y ∈ [0,6]; the first zero of ((y−x−1−d)² + (x+3u−y−3v)²)·(x−5) over d, u, v ∈ [0,7] (d, then u, then v) exists exactly when (x < y ∧ x ≡ y mod 3) ∨ x = 5', theirs.backendCases, be.cases, be.cases === theirs.backendCases && !be.f.length ? 'CERTIFIED' : be.f.length ? 'REFUTED' : 'REFUSED', be.f.length ? { witness: be.f.slice(0, 3) } : null);
  const b1 = backend(6, 7), b2 = backend(5, 3);
  B.control('ICR5', 'the backend factor (x−6) in place of (x−5)', 'some (x, y) disagrees', b1.f.length + ' pairs disagree, first ' + JSON.stringify(b1.f[0]), b1.f.length > 0);
  B.control('ICR6', 'the backend search range [0,3] in place of [0,7]', 'some (x, y) disagrees', b2.f.length + ' pairs disagree, first ' + JSON.stringify(b2.f[0]), b2.f.length > 0);
  const v = suiteVerdict(B);
  return {
    suite: 'integer compiler', checker: 'verify-integer-compiler.js', before: 'REFUSED', after: v.verdict, reason: v.reason,
    source: 'note §"Integer compiler cases"; spec §§3-5 (97cec7fd)',
    gaps: ['The eleven uncounted smoke tests of the clear-register machine and its compiled circuit\'s structure (' + theirs.smokeCircuit.variables.toLocaleString('en-US') + ' variables, ' + theirs.smokeCircuit.nodes.toLocaleString('en-US') + ' nodes, ' + theirs.smokeCircuit.formulas.toLocaleString('en-US') + ' formulas, macro counts ' + JSON.stringify(theirs.smokeCircuit.macroCounts) + ') are his compiler\'s output; not replayed (the note says they are not an exhaustive test either).'],
    items: B.items, redControls: B.controls,
  };
}

/* ================================================================================================================
   SUITE 2: division polynomials — his 44 + 44 + 30 assignments, rebuilt from the note, decided against (i) the stated
   relation and (ii) for n ∈ [1,8] the saved template multiply.scalar (lane 3's evaluator, reused)
   ============================================================================================================== */
function suiteDP(spec, theirs, ev, F) {
  const B = itemBook();
  const A = F.A_TEX, E = curve(A);
  /* the note's curve and point, against the TeX/JSON ones lane 3 pinned */
  const A_note = K.parse('-11243', '7950'), P_note = { x: K.parse('1641/8', '-1160/8'), y: K.parse('-123720/32', '87483/32') };
  const sameCurve = K.eq(A_note, A) && K.eq(K.parse(...spec.definitions.quadraticField.A), A) && K.eq(P_note.x, F.P0.x) && K.eq(P_note.y, F.P0.y) && E.onCurve(P_note);
  const P = P_note;
  const NS = [0, 1, 2, 3, 4, 5, 6, 7, 8, -1, -4], KS = [-1, 0, 1, 2];
  const theirN = theirs.artifacts.map((a) => a.n);
  const codeEq = (a, b) => a.length === b.length && a.every((q, i) => Q.eq(q, b[i]));
  const isInf = (c) => Q.eq(c[0], Q1);
  /* (i) the stated relation: the output block is ι_n of the input block, by the ψ formulas at the input point */
  const rel = (inB, n, variant) => {
    if (n === 0 || isInf(inB)) return [Q1, Q0, Q0, Q0, Q0];
    return iotaByPsi(A, { x: [inB[1], inB[2]], y: [inB[3], inB[4]] }, n, variant);
  };
  const ms = ev.byName('multiply.scalar');
  const tmplRoot = (inB, outB, n) => { const e = ev.evaluate(ms, [...inB, ...outB], { cstar: n }); return { e, w: ev.witness(e) }; };
  const accepted = (w) => w.kind === 'one' || w.kind === 'any';
  const polyAt = (c, x) => { let r = Q0; for (let i = c.length - 1; i >= 0; i--) r = Q.add(Q.mul(r, x), Q.make(c[i])); return r; };
  const ex = [], cx = [], cy = [], tEx = [], tCx = [], tCy = [], wit = [], forced = [], ctl1 = [], ctl1t = [];
  let nEx = 0, nCx = 0, nCy = 0, nT = 0, nTy = 0, f4bad = 0;
  const cases = [];
  for (const n of NS) for (const k of KS) {
    const Qk = E.mul(k, P), Rk = E.mul(n * k, P), inB = E.code(Qk), outB = E.code(Rk);
    const bumpX = outB.map((q, i) => (i === 1 ? Q.add(q, Q1) : q));
    const negY = outB.map((q, i) => (i === 3 || i === 4 ? Q.neg(q) : q));
    const want = rel(inB, n);
    nEx++; if (!codeEq(outB, want)) ex.push([n, k]);
    nCx++; if (codeEq(bumpX, want)) cx.push([n, k]);
    const yCase = n !== 0 && k !== 0;
    if (yCase) { nCy++; if (codeEq(negY, want)) cy.push([n, k]); }
    if (codeEq(E.code(E.mul(n * k + 1, P)), rel(inB, n))) ctl1.push([n, k]);   /* the wrong multiple accepted */
    /* the witness: for n ≠ 0, k ≠ 0 the denominator ψ_n(Q) is nonzero; k = 0 takes witness 0 */
    let psiNorm = null;
    if (n !== 0 && k !== 0) { const g = psiTable(A, Qk.x, Qk.y).psi(Math.abs(n)); psiNorm = K.norm(g); if (K.isZero(g) || Q.isZero(psiNorm)) wit.push([n, k]); }
    /* (ii) the saved template at cstar = n, n ∈ [1,8] */
    let tmpl = null;
    if (n >= 1 && n <= 8) {
      nT++;
      const ok = tmplRoot(inB, outB, n), bx = tmplRoot(inB, bumpX, n), wrong = tmplRoot(inB, E.code(E.mul(n * k + 1, P)), n);
      if (!accepted(ok.w)) tEx.push([n, k]);
      if (accepted(bx.w)) tCx.push([n, k]);
      if (accepted(wrong.w)) ctl1t.push([n, k]);
      let by = null; if (yCase) { nTy++; by = tmplRoot(inB, negY, n); if (accepted(by.w)) tCy.push([n, k]); }
      /* informational: the template's forced witness, against 1/N(ψ_n(Q)^e) */
      let fw = null;
      const c = ok.e.poly;
      if (k === 0) fw = { atZero: c.length === 0 ? 'vanishes for every w' : Q.isZero(polyAt(c, Q0)) ? 'w = 0 is a root' : 'w = 0 is NOT a root' };
      else {
        /* A3.1: rational roots of a degree-1 or degree-2 witness polynomial */
        let roots = null;
        if (c.length === 2) roots = [Q.make(-c[0], c[1])];
        else if (c.length === 3) { const disc = c[1] * c[1] - 4n * c[2] * c[0]; if (disc >= 0n) { let r = BigInt(Math.floor(Math.sqrt(Number(disc)))); while (r * r > disc) r--; while ((r + 1n) * (r + 1n) <= disc) r++; if (r * r === disc) roots = [...new Set([Q.str(Q.make(-c[1] + r, 2n * c[2])), Q.str(Q.make(-c[1] - r, 2n * c[2]))])].map(Q.parse); } }
        const g = psiTable(A, Qk.x, Qk.y).psi(n); const inv = []; let gp = K.int(1); for (let e = 1; e <= 4; e++) { gp = K.mul(gp, g); inv.push(Q.inv(K.norm(gp))); }
        fw = roots ? { polyDegree: c.length - 1, rationalRoots: roots.length, rootEqualsInverseNormOfPsiPower: roots.map((rt) => inv.map((v, e) => (Q.eq(rt, v) ? e + 1 : 0)).filter(Boolean)) } : { polyDegree: c.length - 1, rationalRoots: 0 };
      }
      forced.push(Object.assign({ n, k }, fw));
      tmpl = { exact: ok.w.kind, changedX: bx.w.kind, changedY: by ? by.w.kind : null };
    }
    cases.push({ n, k, inputIsIdentity: isInf(inB), outputIsIdentity: isInf(outB), witnessSlots: n === 0 ? 0 : 1, witness: n === 0 ? null : k === 0 ? '0' : psiNorm ? 'reciprocal of a nonzero norm (≠ 0: ' + !Q.isZero(psiNorm) + ')' : null, template: tmpl });
  }
  for (let n = 1; n <= 8; n++) if (!codeEq(iotaByPsi(A, P, n, 'f4-without-2'), E.code(E.mul(n, P)))) f4bad++;
  const verdictOf = (count, want, fails) => (count === want && !fails.length ? 'CERTIFIED' : fails.length ? 'REFUTED' : 'REFUSED');
  B.item('DP-exact', 'exactCases: for n ∈ {0,…,8,−1,−4} and k ∈ {−1,0,1,2}, the input block code([k]P) and the output block code([nk]P) (affine double-and-add) satisfy the stated relation: the output is ι_n of the input by the ψ formulas of fixedPointCodes at the input point (∞ ↦ ∞, n = 0 ↦ ∞)', theirs.exactCases, nEx, verdictOf(nEx, theirs.exactCases, ex), ex.length ? { witness: ex.slice(0, 3) } : { savedTemplate: 'multiply.scalar at cstar = n accepts ' + (nT - tEx.length) + ' of the ' + nT + ' assignments with n ∈ [1,8]' });
  B.item('DP-changedX', 'changedXCases: the same 44 with 1 added to the output x0 coordinate are rejected by the stated relation', theirs.changedXCases, nCx, verdictOf(nCx, theirs.changedXCases, cx), cx.length ? { witness: cx.slice(0, 3) } : { savedTemplate: 'multiply.scalar rejects ' + (nT - tCx.length) + ' of ' + nT });
  B.item('DP-changedY', 'changedYCases: for n ≠ 0 and k ≠ 0 (30), the output y0 and y1 both negated are rejected by the stated relation', theirs.changedYCases, nCy, verdictOf(nCy, theirs.changedYCases, cy), cy.length ? { witness: cy.slice(0, 3) } : { savedTemplate: 'multiply.scalar rejects ' + (nTy - tCy.length) + ' of ' + nTy });
  const slotsOk = theirs.artifacts.every((a) => a.witnesses === (a.n === 0 ? 0 : 1)) && JSON.stringify(theirN) === JSON.stringify(NS);
  B.item('DP-witness', 'the inverse-norm witness: one per graph for n ≠ 0, none for n = 0 (his artifacts list); for k ≠ 0 the denominator ψ_n([k]P) is nonzero, so its reciprocal norm exists; 0 when k = 0', theirs.artifacts.map((a) => a.n + ':' + a.witnesses).join(' '), NS.map((n) => n + ':' + (n === 0 ? 0 : 1)).join(' '), slotsOk && !wit.length ? 'CERTIFIED' : wit.length ? 'REFUTED' : 'REFUSED', wit.length ? { witness: wit } : null);
  B.control('DPR1', 'an output [nk+1]P in place of [nk]P', 'rejected by (i) on all 44 and by (ii) on all ' + nT, 'accepted by (i) on ' + ctl1.length + ', by (ii) on ' + ctl1t.length, !ctl1.length && !ctl1t.length);
  B.control('DPR2', 'ψ with f_4 lacking its factor 2', 'disagrees with double-and-add for some n ∈ [1,8]', f4bad + ' of 8 values of n disagree (at P, k = 1)', f4bad > 0);
  const zero = NS.flatMap((n) => KS.map((k) => { const inB = E.code(E.mul(k, P)), outB = E.code(E.mul(n * k, P)); return codeEq(outB.map((q, i) => (i === 1 ? Q.add(q, Q0) : q)), rel(inB, n)); }));
  B.control('DPR3', 'a "corruption" of 0 added to x0', 'accepted on all 44 (the rejection test is not vacuous)', zero.filter(Boolean).length + ' of 44 accepted', zero.every(Boolean));
  if (tEx.length || tCx.length || tCy.length) B.control('DPR4', 'the saved template on his n ∈ [1,8] assignments', 'agrees with the stated outcomes', 'disagrees: exact ' + JSON.stringify(tEx) + ', changed-x ' + JSON.stringify(tCx) + ', changed-y ' + JSON.stringify(tCy), false);
  const v = suiteVerdict(B);
  return {
    suite: 'division polynomials', checker: 'verify-division-polynomials.js', before: 'REFUSED', after: v.verdict, reason: v.reason,
    scope: 'CERTIFIED here means his case set, rebuilt from the note, has his outcomes under the stated relation (i), with the saved template multiply.scalar (ii) agreeing for n ∈ [1,8]; it does NOT mean his eleven graphs were evaluated.',
    source: 'note §"Division-polynomial evaluation points"; TeX 206-263 and the JSON\'s psiNormalization, fixedPointCodes (97cec7fd)',
    curve: { noteCurveAndPointEqualPinned: sameCurve, A: '−11243 + 7950√2', P: '((1641−1160√2)/8, (−123720+87483√2)/32)' },
    gaps: ['His eleven graph polynomials (n ∈ {' + theirN.join(', ') + '}, ' + theirs.artifacts.map((a) => a.nodes).join('/') + ' nodes) are the output of elliptic-division-polynomials.js and are in neither the prose nor the data (the JSON\'s own constructor text defers the ψ expansion to that file): they are not evaluated here and their node counts are not reproduced. For n ∈ {0, −1, −4} no saved graph exists; for n ∈ [1,8] the saved template multiply.scalar stands in, which is not stated to be the same polynomial.', 'The exact witness value ("the reciprocal of the graph\'s denominator norm") depends on the graph\'s denominator, which is not stated; only its existence (a nonzero norm) is checked. The saved template\'s forced witness is reported in forcedWitness as information.'],
    items: B.items, redControls: B.controls, forcedWitness: forced, cases,
  };
}

/* ================================================================================================================
   SUITE 3: finite polynomial expressions — the eight recursive hashes, the variable counts, the four rejected mutations
   ============================================================================================================== */
const FIXED_OPS_BASE = ['literal', 'ref'];
function fixedOps(lib) { const s = new Set(FIXED_OPS_BASE); const walk = (e) => { if (!Array.isArray(e)) return; s.add(e[0]); if (e[0] !== 'literal' && e[0] !== 'ref') e.slice(1).forEach(walk); }; for (const v of Object.values(lib.fixedConstants)) walk(v); return s; }
function primorial(N) { let p = 1n; for (let n = 2; n <= N; n++) { let isP = true; for (let d = 2; d * d <= n; d++) if (n % d === 0) { isP = false; break; } if (isP) p *= BigInt(n); } return p; }
/* the clean-room validator of the four mutations: returns the refusals ([] = accepted) */
function validate(lib, OPS) {
  const out = [];
  const fc = lib.fixedConstants;
  const lit = (name) => (Array.isArray(fc[name]) && fc[name][0] === 'literal' ? BigInt(fc[name][1]) : null);
  const P0 = lit('P0'), W = lit('W'), Ps = primorial(324);
  if (P0 !== Ps) out.push('fixedConstants.P0 is not ∏_{p≤324} p (TeX 1271: P_s = ∏_{p≤324} p; the JSON\'s Ns = P0·Hproduct is TeX\'s N_s = P_s·H_cat)');
  if (W !== 4n * Ps) out.push('fixedConstants.W is not 4·∏_{p≤324} p (TeX 1271)');
  const fixedOk = (e, where) => {
    if (!Array.isArray(e) || !OPS.has(e[0])) { out.push(where + ': ' + JSON.stringify(e).slice(0, 40) + ' uses an operator outside the fixed-expression operators (a fixed integer expression has no quantified variable)'); return; }
    if (e[0] === 'literal') { if (!/^-?\d+$/.test(String(e[1]))) out.push(where + ': a malformed literal'); return; }
    if (e[0] === 'ref') { if (!Object.prototype.hasOwnProperty.call(fc, e[1])) out.push(where + ': a reference to no fixed constant'); return; }
    e.slice(1).forEach((x) => fixedOk(x, where));
  };
  for (const [k, v] of Object.entries(fc)) fixedOk(v, 'fixedConstants.' + k);
  lib.templates.forEach((t, ti) => t.nodes.forEach((nd, i) => {
    const where = 'template ' + ti + ' node ' + i + ' (' + nd.op + ')', a = nd.args;
    const ref = (j) => { if (!Number.isInteger(j) || j < 0 || j >= i) out.push(where + ': argument ' + JSON.stringify(j) + ' is not an earlier node (nodes are topologically ordered)'); };
    switch (nd.op) {
      case 'const': if (a.length !== 1 || !/^-?\d+$/.test(String(a[0]))) out.push(where + ': not a decimal integer'); break;
      case 'var': if (a.length !== 1 || !Number.isInteger(a[0]) || a[0] < 0 || a[0] >= t.variableCount) out.push(where + ': not a local variable index'); break;
      case 'add': case 'mul': if (a.length !== 2) out.push(where + ': not two operands'); a.forEach(ref); break;
      case 'call': if (a.length < 2 || !Number.isInteger(a[0]) || a[0] < 0 || a[0] >= lib.templates.length) out.push(where + ': not a template call'); a.slice(1, -1).forEach(ref); break;
      case 'fixed_integer': if (a.length !== 1) out.push(where + ': not one fixed expression'); fixedOk(a[0], where); break;
      case 'psi_component': if (a.length !== 6) out.push(where + ': not six arguments'); fixedOk(a[0], where); a.slice(1, 5).forEach(ref); if (a[5] !== 0 && a[5] !== 1) out.push(where + ': component ' + JSON.stringify(a[5]) + ' is not 0 or 1'); break;
      case 'finite_guard_product': if (a.length !== 16) out.push(where + ': not a cutoff and fifteen coordinates'); if (JSON.stringify(a[0]) !== JSON.stringify(['ref', 'T'])) out.push(where + ': the cutoff ' + JSON.stringify(a[0]) + ' is not the fixed constant T (finiteGuard.bound)'); else fixedOk(a[0], where); a.slice(1).forEach(ref); break;
      default: out.push(where + ': an unknown node kind');
    }
  }));
  return out;
}
/* the recursive expression hash of the note; `readings` names the two pre-registered single readings */
function exprHash(lib, ti, fixture) {
  const t = lib.templates[ti], h = [];
  const fixedValue = (e) => { if (e[0] === 'literal') return BigInt(e[1]); if (e[0] === 'ref' && Object.prototype.hasOwnProperty.call(fixture, e[1])) return BigInt(fixture[e[1]]); throw new Error('the fixed expression ' + JSON.stringify(e) + ' is not a fixture value'); };
  for (const nd of t.nodes) {
    const a = nd.args; let s;
    switch (nd.op) {
      case 'const': s = 'const:' + String(a[0]); break;
      case 'var': s = 'var:' + String(a[0]); break;
      case 'add': case 'mul': s = nd.op + ':' + a.map((j) => h[j]).join(':'); break;
      case 'call': s = 'call:' + String(a[0]) + ':' + String(a[a.length - 1]) + ':' + a.slice(1, -1).map((j) => h[j]).join(':'); break;
      case 'fixed_integer': s = 'const:' + String(fixedValue(a[0])); break;                      /* reading R1 */
      case 'finite_guard_product': { const T = fixedValue(a[0]); if (T !== 0n) return { refused: 'finite_guard_product at T = ' + T + ': its node-level expansion is defined by rational-model-assembly.js (the JSON\'s finitePolynomialConstructors), not in prose' }; s = 'const:1'; break; }   /* reading R2 */
      case 'psi_component': return { refused: 'psi_component: its node-level expansion is defined by the normalized recurrences "in elliptic-division-polynomials.js" (the JSON\'s finitePolynomialConstructors), not in prose' };
      default: throw new Error('an unknown node kind ' + nd.op);
    }
    h.push(H(s));
  }
  return { hash: h[t.root] };
}
function suiteFE(spec, theirs, lane1) {
  const B = itemBook();
  const lib = spec.library, OPS = fixedOps(lib);
  const NAMES = ['multiply.scalar', 'multiply.guard', 'multiply', 'natural'];
  const idOk = NAMES.every((nm, j) => lib.templates[9 + j].name === nm);
  if (!idOk) die('template ids 9-12 are not multiply.scalar, multiply.guard, multiply, natural');
  const readingOf = (ti, fixture) => {
    const ops = new Set(lib.templates[ti].nodes.map((n) => n.op));
    if (ops.has('psi_component')) return null;
    if (ops.has('finite_guard_product')) return String(fixture.T) === '0' ? 'R2: the empty guard product (T = 0) expands to one const node "1"' : null;
    if (ops.has('fixed_integer')) return 'R1: a fixed_integer expands to one const node, the decimal of its value';
    return 'none needed (const, var, add, mul, call only)';
  };
  const hashRows = [];
  for (const c of theirs.checks) {
    const ti = 9 + NAMES.indexOf(c.template), r = exprHash(lib, ti, c.fixture), reading = readingOf(ti, c.fixture);
    let verdict, note;
    if (r.refused) { verdict = 'REFUSED'; note = r.refused; }
    else if (r.hash === c.hash) { verdict = 'CERTIFIED'; note = 'reproduced' + (reading.startsWith('R') ? ' under reading ' + reading : ''); }
    else { verdict = 'REFUSED'; note = 'DIFFERS: ours ' + r.hash + (reading.startsWith('R') ? ' under reading ' + reading : ' (no reading needed: our code suspected first)'); }
    hashRows.push({ template: c.template, fixture: c.fixture, theirs: c.hash, ours: r.hash || null, verdict, note });
  }
  for (const r of hashRows) B.item('FE-hash ' + r.template + ' ' + JSON.stringify(r.fixture), 'the recursive expression hash at t.root of template ' + r.template + ' at fixture ' + JSON.stringify(r.fixture), r.theirs, r.ours, r.verdict, { note: r.note });
  /* the variable counts */
  const vc = NAMES.map((nm, j) => { const t = lib.templates[9 + j], l1 = lane1.templates.find((x) => x.name === nm); return { name: nm, parameters: t.parameterCount, witnesses: Number(l1.witnesses), nodes: t.nodes.length, calls: t.nodes.filter((n) => n.op === 'call').length }; });
  const vcBad = []; for (const s of theirs.variableCounts) { const o = vc.find((x) => x.name === s.name); for (const k of ['parameters', 'witnesses', 'nodes', 'calls']) if (o[k] !== s[k]) vcBad.push([s.name, k, s[k], o[k]]); }
  B.item('FE-counts', 'the parameter, witness (lane 1\'s derived counts), node and call counts of the templates his report lists (multiply, natural); multiply.scalar and multiply.guard have no stated value and are reported only', theirs.variableCounts, vc, vcBad.length ? 'REFUSED' : 'CERTIFIED', vcBad.length ? { note: 'DIFFERS: ' + JSON.stringify(vcBad) } : null);
  /* the four rejected mutations, on fresh copies */
  const fresh = () => JSON.parse(JSON.stringify(lib));
  const base = validate(lib, OPS);
  const firstIdx = (ti, op) => lib.templates[ti].nodes.findIndex((n) => n.op === op);
  const muts = [
    { id: 'M1', what: 'fixedConstants.P0 set to ["literal","1"]', make: (L) => { L.fixedConstants.P0 = ['literal', '1']; } },
    { id: 'M2', what: 'argument 1 of the psi_component node in template 9 set to 999999 (the first such node, ' + firstIdx(9, 'psi_component') + '; each of the eight placements tried)', make: null },
    { id: 'M3', what: 'argument 0 of the finite_guard_product node in template 10 set to ["literal","1"]', make: (L) => { L.templates[10].nodes[firstIdx(10, 'finite_guard_product')].args[0] = ['literal', '1']; } },
    { id: 'M4', what: 'argument 0 of the fixed_integer node in template 11 set to ["variable",0]', make: (L) => { L.templates[11].nodes[firstIdx(11, 'fixed_integer')].args[0] = ['variable', 0]; } },
  ];
  const mutRows = muts.map((m) => {
    if (m.id === 'M2') {
      const idxs = lib.templates[9].nodes.map((n, i) => (n.op === 'psi_component' ? i : -1)).filter((i) => i >= 0);
      const outs = idxs.map((i) => { const L = fresh(); L.templates[9].nodes[i].args[1] = 999999; return validate(L, OPS); });
      return { id: m.id, mutation: m.what, refused: outs.every((o) => o.length > 0), placements: idxs.length, refusal: outs[0][0] || null };
    }
    const L = fresh(); m.make(L); const o = validate(L, OPS);
    return { id: m.id, mutation: m.what, refused: o.length > 0, refusal: o[0] || null };
  });
  B.item('FE-rejections', 'his four mutated fresh copies of the symbolic library are refused by our clean-room validator, which accepts the pinned library', theirs.invalidBindingsRejected, mutRows.filter((r) => r.refused).length, !base.length && mutRows.every((r) => r.refused) && theirs.invalidBindingsRejected === 4 ? 'CERTIFIED' : 'REFUSED', { mutations: mutRows });
  /* red controls */
  const nat = 12, natHash = exprHash(lib, nat, { cstar: '4', ell: '12', T: '1' }).hash;
  const L1 = fresh(); const ai = L1.templates[nat].nodes.findIndex((n) => n.op === 'add'); L1.templates[nat].nodes[ai].args.reverse();
  const h1 = exprHash(L1, nat, {}).hash;
  B.control('FER1', 'natural with one add node\'s operands swapped (node ' + ai + ')', 'the hash differs (operand order is hashed)', h1 === natHash ? 'same hash' : 'differs', h1 !== natHash);
  /* A3.1: FER2 on the first const REACHABLE from multiply's root (hashed under R1); FER5 on natural's unreachable const */
  const reach = (t) => { const seen = new Set(), st = [t.root]; while (st.length) { const i = st.pop(); if (seen.has(i)) continue; seen.add(i); const nd = t.nodes[i]; if (nd.op === 'add' || nd.op === 'mul') nd.args.forEach((j) => st.push(j)); else if (nd.op === 'call') nd.args.slice(1, -1).forEach((j) => st.push(j)); else if (nd.op === 'psi_component') nd.args.slice(1, 5).forEach((j) => st.push(j)); else if (nd.op === 'finite_guard_product') nd.args.slice(1).forEach((j) => st.push(j)); } return seen; };
  const mul = 11, fx = { cstar: '4', ell: '12', T: '1' }, mulHash = exprHash(lib, mul, fx).hash, rm = reach(lib.templates[mul]);
  const L2 = fresh(); const ci = L2.templates[mul].nodes.findIndex((n, i) => n.op === 'const' && rm.has(i)); L2.templates[mul].nodes[ci].args[0] = String(BigInt(L2.templates[mul].nodes[ci].args[0]) + 1n);
  const h2 = exprHash(L2, mul, fx).hash;
  B.control('FER2', 'multiply (reading R1, fixture ' + JSON.stringify(fx) + ') with its first const reachable from the root changed by one (node ' + ci + ')', 'the hash differs', h2 === mulHash ? 'same hash' : 'differs', h2 !== mulHash);
  const rn = reach(lib.templates[nat]), dead = lib.templates[nat].nodes.map((n, i) => i).filter((i) => !rn.has(i));
  const L6 = fresh(); const di = L6.templates[nat].nodes.findIndex((n, i) => n.op === 'const' && !rn.has(i)); L6.templates[nat].nodes[di].args[0] = String(BigInt(L6.templates[nat].nodes[di].args[0]) + 1n);
  const h6 = exprHash(L6, nat, {}).hash;
  B.control('FER5', 'natural with a const UNREACHABLE from its root changed by one (node ' + di + '; natural\'s unreachable nodes: ' + dead.join(', ') + ' of ' + lib.templates[nat].nodes.length + ')', 'the hash is unchanged (the note: unrelated nodes are not appended)', h6 === natHash ? 'same hash' : 'differs', h6 === natHash);
  B.control('FER3', 'the pinned library, unmutated', 'accepted by the validator', base.length ? 'refused: ' + base[0] : 'accepted', !base.length);
  const L5 = fresh(); L5.templates[9].nodes[firstIdx(9, 'psi_component')].args[5] = 2; const o5 = validate(L5, OPS);
  B.control('FER4', 'a fifth mutation of ours: a psi_component asking for component 2', 'refused', o5.length ? 'refused: ' + o5[0] : 'accepted', o5.length > 0);
  const v = suiteVerdict(B);
  return {
    suite: 'finite polynomial expressions', checker: 'verify-finite-polynomial-expressions.js', before: 'REFUSED', after: v.verdict, reason: v.reason,
    source: 'note §"Finite-expression cases and hashes"; the JSON\'s scalarNodeEncoding, finitePolynomialConstructors, finiteGuard; TeX 1271 (97cec7fd)',
    readings: { R1: 'a fixed_integer expands to ONE const node whose string is the decimal of its value (multiply, template 11)', R2: 'the empty guard product (T = 0) expands to ONE const node "1" (multiply.guard)', rule: 'each tried once, never varied (A3)' },
    gaps: hashRows.filter((r) => r.verdict !== 'CERTIFIED').map((r) => 'The hash of ' + r.template + ' at ' + JSON.stringify(r.fixture) + ': ' + r.note + '.'),
    items: B.items, redControls: B.controls, hashes: hashRows,
  };
}

/* ================================================================================================================
   Version 4 final.rows_sha256: the terminal table of OUR replay (zq-v4.js's replay, reused), his serialization
   ============================================================================================================== */
function rowsHash(V4) {
  const I = V4.inputs();
  const v1 = V4.decideV1(I.txt, I.gz);
  let dec; try { dec = V4.decideV3(I.cert, I.source, I.entrySha, I.residuals, I.vmap, v1); } catch (e) { dec = { verdict: 'REFUSED', differs: [e.message] }; }
  const src = I.source.toString('utf8').split('\n').filter((l) => l.length).map(V4.JP);
  const r = V4.replay(I.cert, src.slice(1), src[0], I.entrySha, V4.PIN.source.sha256);
  const N = I.cert[0].rows.length;
  for (const id of r.sys.rows.keys()) if (!(id >= 0 && id < N)) die('a replayed row id outside the lift');
  const table = []; let nonInt = 0;
  for (let id = 0; id < N; id++) { const P = r.sys.rows.get(id); table.push(P ? [...P.entries()].map(([k, c]) => { if (c[1] !== 1n) nonInt++; return [c[0], k]; }) : []); }
  const enc = (tab, opts = {}) => {
    const rows = opts.dropEmpty ? tab.filter((x) => x.length) : tab;
    return '[' + rows.map((row) => '[' + row.map(([c, k]) => '[' + c.toString() + ',[' + k + ']]').join(',') + ']').join(',') + ']' + (opts.newline ? '\n' : '');
  };
  const ours = enc(table), oursSha = sha(Buffer.from(ours, 'ascii'));
  const empty = table.filter((x) => !x.length).length;
  const finalLine = I.cert[I.cert.length - 1];
  /* beside it: his saved candidate-rows.json.gz */
  const cand = zlib.gunzipSync(readAt(V4_REPO, PIN.version4.candidateRows.path, PIN.version4.candidateRows.sha256)).toString('ascii');
  const candRows = V4.JP(cand);
  const canon = (row) => row.map(([c, ix]) => String(c) + ':' + (Array.isArray(ix) ? ix.join(',') : ix)).sort().join(' ');
  let polyDiff = 0, orderDiff = 0;
  for (let id = 0; id < Math.max(N, candRows.length); id++) {
    const a = table[id] || [], b = (candRows[id] || []).map(([c, ix]) => [c, ix.join(',')]);
    if (canon(a) !== canon(b)) polyDiff++;
    else if (a.map(([c, k]) => c + ':' + k).join(' ') !== b.map(([c, k]) => c + ':' + k).join(' ')) orderDiff++;
  }
  /* red controls */
  const swapped = table.map((x) => x.slice()); const si = swapped.findIndex((x) => x.length >= 2); [swapped[si][0], swapped[si][1]] = [swapped[si][1], swapped[si][0]];
  const bumped = table.map((x) => x.slice()); const bi = bumped.findIndex((x) => x.length); bumped[bi][0] = [bumped[bi][0][0] + 1n, bumped[bi][0][1]];
  const ctl = [
    ['RHR1', 'a final newline', sha(Buffer.from(enc(table, { newline: true }), 'ascii'))],
    ['RHR2', 'the ' + empty + ' empty rows dropped', sha(Buffer.from(enc(table, { dropEmpty: true }), 'ascii'))],
    ['RHR3', 'the first two terms of row ' + si + ' swapped', sha(Buffer.from(enc(swapped), 'ascii'))],
    ['RHR4', 'one coefficient of row ' + bi + ' raised by one', sha(Buffer.from(enc(bumped), 'ascii'))],
  ].map(([id, m, h]) => ({ id, mutation: m, prediction: 'the hash changes', outcome: h === ROWS_SHA_CLAIMED ? 'the claimed hash' : 'changed', passed: h !== ROWS_SHA_CLAIMED && h !== oursSha }));
  const agrees = oursSha === ROWS_SHA_CLAIMED && finalLine.kind === 'final' && finalLine.rows_sha256 === ROWS_SHA_CLAIMED && N === 4879 && empty === 327 && !nonInt;
  const verdict = !ctl.every((c) => c.passed) || dec.verdict !== 'CERTIFIED' ? 'REFUSED' : agrees ? 'CERTIFIED' : 'REFUSED';
  return {
    verdict, before: 'not checked (certs/zq-v4.json: "its serialization is not stated")',
    what: 'final.rows_sha256 of the Version 4 certificate, recomputed under the note\'s serialization from the terminal table of OUR replay (tools/zq-v4.js\'s replay, reused from its pinned bytes, on the clone at 5cb2c199): rows 0 to N−1 in id order, empty rows as [], each term [bare signed integer, nondecreasing index list] in the order our replay holds it, compact ASCII JSON, no final newline',
    whatItChecks: 'Each terminal row is the certificate patch our replay adopted after checking its step (or the lifted row of line 0), with its terms in the patch\'s order: the rows and their term order are HIS DATA, checked step by step by our replay (V3 ' + dec.verdict + '). So this is a serialization check of a checked table, not an independent derivation of the term order.',
    v3Verdict: dec.verdict,
    claimed: ROWS_SHA_CLAIMED, certificateFinalLine: finalLine.rows_sha256, ours: oursSha,
    rows: N, emptyRows: empty, nonIntegerCoefficients: nonInt, bytes: ours.length,
    candidateRows: { path: PIN.version4.candidateRows.path, sha256: PIN.version4.candidateRows.sha256, decompressedBytesEqualOurs: cand === ours, decompressedSha256: sha(Buffer.from(cand, 'ascii')), rows: candRows.length, rowsDifferingAsPolynomials: polyDiff, rowsSamePolynomialOtherTermOrder: orderDiff },
    redControls: ctl,
  };
}

/* ================================================================================================================
   File identity: his 28 files (source-comparison.json) at 036cebe4 against our clones at 97cec7fd and 5cb2c199
   ============================================================================================================== */
function fileIdentity(cmp) {
  const heads = { [PIN.original.commit]: OLD_REPO, [PIN.version4.commit]: V4_REPO };
  for (const [c, repo] of Object.entries(heads)) if (git(repo, 'rev-parse', 'HEAD') !== c) die(repo + ' is not at ' + c);
  if (git(NOTE_REPO, 'rev-parse', 'HEAD') !== PIN.note.commit) die(NOTE_REPO + ' is not at ' + PIN.note.commit);
  const rows = cmp.files.map((f) => {
    const repo = heads[f.historical_commit]; if (!repo) die('a historical commit this tool has no clone of: ' + f.historical_commit);
    const now = sha(readAt(NOTE_REPO, f.path)), then = sha(readAt(repo, f.path));
    const blobNow = git(NOTE_REPO, 'rev-parse', 'HEAD:' + f.path), blobThen = git(repo, 'rev-parse', 'HEAD:' + f.path);
    return { path: f.path, historical: f.historical_commit.slice(0, 8), his: f.sha256, at036cebe4: now, atHistorical: then, gitBlobEqual: blobNow === blobThen, agrees: now === f.sha256 && then === f.sha256 && blobNow === blobThen && f.identical_to_historical === true };
  });
  const changedByNote = git(NOTE_REPO, 'diff', '--name-only', 'HEAD~1', 'HEAD').split('\n').filter(Boolean);
  const nConstr = rows.filter((r) => r.path.startsWith('construction/')).length, nV4 = rows.length - nConstr;
  return {
    verdict: rows.every((r) => r.agrees) && nConstr === 25 && nV4 === 3 ? 'CERTIFIED' : 'REFUSED',
    statement: 'his source-comparison.json: the 25 curated construction files equal 97cec7fd and the three Version 4 checker/data files equal 5cb2c199',
    comparedAt: PIN.note.commit + ' (his reviewed_current_commit is ' + cmp.reviewed_current_commit + ', the parent of 036cebe4; 036cebe4 itself changes only ' + changedByNote.join(', ') + ')',
    construction: nConstr, version4: nV4, agreeing: rows.filter((r) => r.agrees).length, differing: rows.filter((r) => !r.agrees).map((r) => r.path),
    files: rows,
  };
}

function build() {
  for (const [rel, want] of Object.entries(PIN.note.files)) readAt(NOTE_REPO, rel, want);
  for (const [rel, want] of Object.entries(PIN.note.hashedNeverRead)) { const b = readAt(NOTE_REPO, rel, want); void b; }   /* hashed, its contents never used */
  const checks = JSON.parse(readAt(NOTE_REPO, NOTE + 'construction-checks.json').toString('utf8'));
  const cmp = JSON.parse(readAt(NOTE_REPO, NOTE + 'source-comparison.json').toString('utf8'));
  const by = (name) => checks.checks.find((c) => c.check === name).result;
  readAt(OLD_REPO, PIN.original.spec.path, PIN.original.spec.sha256); readAt(OLD_REPO, PIN.original.tex.path, PIN.original.tex.sha256);
  const spec = JSON.parse(readAt(NOTE_REPO, PIN.original.definition.path, PIN.original.definition.sha256).toString('utf8'));
  const lane1 = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'zq-recount.json'), 'utf8'));
  if (lane1.verdict !== 'CERTIFIED' || lane1.pins.definition.sha256 !== PIN.original.definition.sha256) die('lane 1 is not CERTIFIED on the same bytes');
  const F = loadReused('tools/zq-finite.js'), V4 = loadReused('tools/zq-v4.js');
  const ev = F.makeEvaluator(spec);
  const suites = [suiteIC(by('verify-integer-compiler.js')), suiteDP(spec, by('verify-division-polynomials.js'), ev, F), suiteFE(spec, by('verify-finite-polynomial-expressions.js'), lane1)];
  const rh = rowsHash(V4), fi = fileIdentity(cmp);
  const words = [...suites.map((s) => s.after), rh.verdict, fi.verdict];
  const verdict = words.includes('REFUTED') ? 'REFUTED' : words.every((w) => w === 'CERTIFIED') ? 'CERTIFIED' : 'MIXED';
  /* every gap, ranked, dated at the pin, with what would close it (the per-suite text is the one source) */
  const at = PIN.note.commit.slice(0, 8) + ' (2026-11-07)';
  const [ic, dp, fe] = suites;
  const gaps = [
    ...fe.hashes.filter((h) => h.verdict !== 'CERTIFIED').map((h) => ({ rank: 1, suite: fe.suite, at, gap: 'The hash of ' + h.template + ' at ' + JSON.stringify(h.fixture) + ' is not determined by the prose (' + h.note + ').', closes: 'the node-level expansion of ' + (h.template === 'multiply.scalar' ? 'psi_component' : 'finite_guard_product') + ' stated in prose, or the expanded templates published as data' })),
    { rank: 2, suite: dp.suite, at, gap: dp.gaps[0], closes: 'the eleven graph polynomials published as data, or their construction stated node by node' },
    { rank: 3, suite: dp.suite, at, gap: dp.gaps[1], closes: 'the graph\'s denominator named in prose (the saved template\'s forced witness is 1/N(ψ_n(Q)), see forcedWitness)' },
    { rank: 4, suite: fe.suite, at, gap: 'Five of the eight hashes are reproduced, three of them under a reading of ours fixed before the run (R1 for multiply at both fixtures, R2 for multiply.guard at T = 0): the prose does not say that a fixed_integer, or an empty guard product, expands to one const node. The matching sha256 confirms the readings; the prose still omits them.', closes: 'one sentence in the note per constructor' },
    { rank: 5, suite: ic.suite, at, gap: ic.gaps[0], closes: 'not needed for the counted suite (uncounted by his own note)' },
    { rank: 6, suite: 'Version 4 final.rows_sha256', at, gap: rh.whatItChecks, closes: 'nothing in his release; a scope note on what our hash check is' },
    ...(fi.differing.length ? [{ rank: 0, suite: 'file identity', at, gap: 'differing: ' + fi.differing.join(', '), closes: '' }] : []),
  ];
  const old = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'zq-finite.json'), 'utf8'));
  return {
    what: 'Lane 3\'s three REFUSED replays of the claim "Z is Diophantine in Q" (Glazer et al.) re-checked against the claimant\'s Issue 3 note (036cebe4, docs/audit-history/issue3/), clean-room from its prose and data; plus the Version 4 final.rows_sha256 under his stated serialization and his 28-file identity claim. His code (replay_row_hash.py, verify-*.js, check_construction.py, verify_certificate.py, CI) not read or run.',
    undecided: UNDECIDED,
    gaps,
    generated: new Date().toISOString().slice(0, 10),
    preregistration: 'notes/zq-preregistration-2026-11-06.md, Amendment A3 (commit 1a5ab1e9, before any run) and A3.1 (commit 985fcc56, after a first pass, before the recorded pass: FER2 re-aimed, FER5 added, the forced-witness readout extended)',
    history: { record: 'certs/zq-finite.json', generated: old.generated, verdict: old.verdict, note: 'not rewritten; it stays as dated history. Its six-contact replay (CERTIFIED) and its statements verdicts (CERTIFIED, four suites) are not re-run here.' },
    pins: PIN,
    issue: { url: 'https://github.com/elliotglazer/diophantine-z-q/issues/3', closed: '2026-11-07T11:23:15Z', closingComment: '2026-11-07T11:23:14Z, elliotglazer' },
    code: {
      'tools/zq-finite-v2.js': sha(fs.readFileSync(__filename)),
      'tools/zq-k0.js': sha(fs.readFileSync(path.join(__dirname, 'zq-k0.js'))),
      'tools/zq-finite.js': REUSED['tools/zq-finite.js'].sha256 + ' (reused: makeEvaluator; main block not run)',
      'tools/zq-v4.js': REUSED['tools/zq-v4.js'].sha256 + ' (reused: inputs, replay, decideV1, decideV3; main block not run)',
    },
    verdict,
    verdictScope: 'per suite (replay of his case sets as the note now specifies them): ' + suites.map((s) => s.suite + ' ' + s.before + ' → ' + s.after).join('; ') + '; final.rows_sha256 ' + rh.verdict + '; file identity ' + fi.verdict,
    summary: suites.map((s) => ({ suite: s.suite, before: s.before, after: s.after, items: s.items.map((i) => i.id + ' ' + i.verdict), redControls: s.redControls.length })),
    suites, rowsHash: rh, fileIdentity: fi,
  };
}

const T0 = Date.now();
const REC = build();
const secs = ((Date.now() - T0) / 1000).toFixed(1);
const strip = (x) => JSON.stringify(Object.assign({}, x, { generated: null }), (k, v) => (typeof v === 'bigint' ? String(v) : v));
const line = REC.verdict + ' · ' + REC.summary.map((s) => s.suite + ' ' + s.before + ' → ' + s.after).join(' · ') + ' · rows hash ' + REC.rowsHash.verdict + ' · identity ' + REC.fileIdentity.verdict + ' · ' + secs + ' s';
if (process.argv.includes('--check')) {
  if (!fs.existsSync(OUT)) die('no record to check');
  if (strip(JSON.parse(fs.readFileSync(OUT, 'utf8'))) !== strip(REC)) die('certs/zq-finite-v2.json is not what the pinned files and this code give now');
  console.log('zq-finite-v2: re-derived, identical · ' + line);
} else {
  fs.writeFileSync(OUT, JSON.stringify(REC, (k, v) => (typeof v === 'bigint' ? String(v) : v), 1) + '\n');
  console.log('zq-finite-v2: ' + line);
}
