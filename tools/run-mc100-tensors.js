#!/usr/bin/env node
/* run-mc100-tensors.js — the hundred pre-registered machine claims, phase 4b wave 1: the three TENSOR pools.
   tools/ · cert-machine

   WHAT IT DECIDES. The rows of corpus/machine-claims-100.json in one pool (the manifest chose them by rule on
   2026-10-02, before any was decided; this run never adds, drops or re-chooses a row):
     alphatensor-q          12 keys of alphatensor_r.npz  — a decomposition over standard arithmetic of the stated rank
     alphatensor-f2          8 keys of alphatensor_f2.npz — the same over F2 (and, recorded beside it, whether it also holds over Q)
     alphaevolve-nb-matmul  15 part-A sections of the AlphaEvolve results notebook — a decomposition over the ring its heading names

   HOW. The bytes are re-hashed against the manifest's pin first; a row whose bytes do not hash is refused, not
   decided. The factors are transcribed by the existing readers (tools/convert_alphatensor.py --emit, stdlib, its
   pickle shim admitting only ndarray reconstruction; tools/convert_alphaevolve.js, every literal read as the
   rational it denotes, ring membership decided, denominators cleared per factor). instruments/strassen/tensor.js
   decides every one of the n·m·m·p·n·p tensor-identity equations exactly and the BigInt audit re-decides each in
   full; a disagreement refuses the run. Then tools/verify_strassen.py (Python standard library, no code from this
   repository) re-derives every CERTIFIED entry from this ledger's own `entries` and must see its red control fire;
   if it does not exit 0, the ledger is deleted and the run refuses. The claimant's code — the notebook's
   verify_tensor_decomposition — is never run.

   A SECTION PRINTED ONLY AS PROSE. The notebook's <4,4,8> rank 96 is not printed: "This decomposition can be
   obtained by doubling the rank-48 decomposition of <4,4,4> provided above." That is a construction, not a program,
   so it is rebuilt here from the printed rank-48 (one copy per 4-column block of B) and the rebuild is decided like
   any printed object; the row says it was rebuilt (the polymaps gao-f6 precedent).

   VERDICTS (the register's vocabulary): CERTIFIED (kind none) when the identity holds over the claimed ring;
   REFUTED when an equation fails (the failing equation printed); REFUSED when the instrument's exactness bound or a
   reader refuses the bytes; NEEDS DATA when the bytes are not published. Every row carries the sha256 of the bytes
   it read and the milliseconds it took.

   usage: node tools/run-mc100-tensors.js alphatensor-q|alphatensor-f2|alphaevolve-nb-matmul|all
   writes certs/mc100-<pool>.json; the register reads it through tools/run-claims-ledger.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const T = require(path.join(ROOT, 'instruments', 'strassen', 'tensor.js'));
const CA = require(path.join(ROOT, 'tools', 'convert_alphaevolve.js'));
const die = (m) => { console.error('MC100 TENSORS REFUSED: ' + m); process.exit(1); };
const J = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const ms = (t0) => Math.round(Number(process.hrtime.bigint() - t0) / 1e5) / 10;

const POOLS = ['alphatensor-q', 'alphatensor-f2', 'alphaevolve-nb-matmul'];
const M = J('corpus/machine-claims-100.json');

/* what the decided identity says, by the ring decided over and the scale the denominators were cleared with */
function ringWords(claim) {
  const s = claim.scale || 1;
  if (claim.ring === 'F2') return 'F2';
  if (claim.ring === 'Q') return s === 1 ? 'Z (an integer identity, so the scheme holds over every commutative ring)'
    : '(1/2)Z, decided as the integer identity ' + s + '·T after the factors were scaled by ' + claim.denominators.join('·') + ' (so the scheme holds over every commutative ring in which 2 is invertible)';
  return s === 1 ? 'Z[i]' : '(1/2)Z[i], decided as the Gaussian-integer identity ' + s + '·T after the factors were scaled by ' + claim.denominators.join('·') + ', imaginary part exactly 0';
}

/* decide one claim with the instrument, the BigInt audit re-deciding it in full */
function decide(claim) {
  const t0 = process.hrtime.bigint();
  const zi = claim.ring === 'Zi';
  const a = zi ? T.auditZi(claim) : T.audit(claim);
  const b = a.verdict === 'REFUSED' ? null : (zi ? T.auditZiBig(claim) : T.auditBig(claim));
  if (b && ((a.verdict === 'VERIFIED') !== (b.verdict === 'VERIFIED') || (a.verdict === 'VERIFIED' && a.layout !== b.layout)))
    die('the exact-double audit and the BigInt audit disagree on <' + claim.dims + '> rank ' + claim.rank + ': ' + a.verdict + ' vs ' + b.verdict);
  return Object.assign({}, a, { bigInt: b ? b.verdict + (b.layout ? ' (layout ' + b.layout + ')' : '') : 'not run (refused)', ms: ms(t0) });
}

/* the notebook's prose recipe for <4,4,8>: the printed rank-48 <4,4,4> once per 4-column block of B */
function doubleAlongP(c, layout) {
  const [n, m, p] = c.dims, r = c.rank, Z0 = c.ring === 'Zi' ? [0, 0] : 0;
  const zeros = () => new Array(r).fill(Z0);
  const U = c.U.map((row) => row.concat(row));
  const V = [], W = [];
  for (let b = 0; b < m; b++) for (let cc = 0; cc < 2 * p; cc++) {
    const src = c.V[b * p + (cc % p)];
    V.push(cc < p ? src.concat(zeros()) : zeros().concat(src));
  }
  const P2 = 2 * p;
  const kOf = (a, cc, pp) => (layout === 'AC' ? a * pp + cc : cc * n + a);
  for (let k = 0; k < n * P2; k++) W.push(null);
  for (let a = 0; a < n; a++) for (let cc = 0; cc < P2; cc++) {
    const src = c.W[kOf(a, cc % p, p)];
    W[kOf(a, cc, P2)] = cc < p ? src.concat(zeros()) : zeros().concat(src);
  }
  return { dims: [n, m, P2], rank: 2 * r, ring: c.ring, scale: c.scale, U, V, W };
}

function rowBase(mr, bytesSha) {
  if (bytesSha !== mr.sha256) die(mr.id + ': the bytes read hash to ' + bytesSha + ', the manifest pins ' + mr.sha256);
  return { id: mr.id, pool: mr.pool, claimant: mr.claimant, claim: mr.claim, source: mr.source, sha256: bytesSha };
}

function verdictOf(d) {
  if (d.verdict === 'VERIFIED') return { verdict: 'CERTIFIED', kind: 'none' };
  if (d.verdict === 'REFUSED') return { verdict: 'REFUSED', kind: 'none' };
  return { verdict: 'REFUTED', kind: 'arithmetic-slip' };
}

function scopeOf(d, claim, extra) {
  if (d.verdict !== 'VERIFIED') return d.why;
  return 'every one of the ' + d.equations.toLocaleString('en-US') + ' tensor-identity equations, exactly, over ' + ringWords(claim)
    + ' — C-layout ' + d.layout + '; rank ' + claim.rank + (claim.rank < d.naive ? ' < ' + d.naive + ' naive' : ' (not below the naive ' + d.naive + ')') + (extra ? '; ' + extra : '');
}

function entryOf(id, source, claim, d, pin) {
  return Object.assign({ id, source, dims: claim.dims, rank: claim.rank, naive: d.naive, ring: claim.ring, layout: d.layout },
    claim.scale && claim.scale !== 1 ? { scale: claim.scale } : {},
    { statement: id + ': ' + claim.dims[0] + 'x' + claim.dims[1] + ' times ' + claim.dims[1] + 'x' + claim.dims[2] + ' in ' + claim.rank + ' multiplications VERIFIED over ' + claim.ring + ' — all ' + d.equations + ' tensor-identity equations hold exactly (layout ' + d.layout + ')',
      U: claim.U, V: claim.V, W: claim.W, sourcePin: pin });
}

/* ---- the two AlphaTensor pools --------------------------------------------- */
function alphatensor(pool) {
  const file = pool === 'alphatensor-q' ? 'alphatensor_r.npz' : 'alphatensor_f2.npz';
  const ring = pool === 'alphatensor-q' ? 'Q' : 'F2';
  const mrows = M.rows.filter((r) => r.pool === pool);
  const keys = mrows.map((r) => { const k = / key (\d+,\d+,\d+)$/.exec(r.source); if (!k) die(r.id + ': no npz key in its source'); return k[1]; });
  const out = cp.spawnSync('python3', [path.join(ROOT, 'tools', 'convert_alphatensor.py'), '--emit', file].concat(keys), { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 });
  if (out.status !== 0) die('convert_alphatensor.py --emit failed: ' + out.stderr);
  const E = JSON.parse(out.stdout);
  const fileSha = sha256(fs.readFileSync(path.join(ROOT, 'corpus', 'sources', file)));
  if (E.sha256 !== fileSha) die('the transcriber read other bytes than the file on disk');
  const rows = [], entries = [];
  mrows.forEach((mr, i) => {
    const e = E.entries[i];
    const row = rowBase(mr, E.sha256);
    if (e.npzKey !== keys[i]) die('the transcriber returned keys out of order');
    if (e.missing) { rows.push(Object.assign(row, { verdict: 'NEEDS DATA', kind: 'data-not-public', scope: 'the key ' + keys[i] + ' is not in ' + file, ms: 0 })); return; }
    const dims = keys[i].split(',').map(Number);
    const claim = { dims, rank: e.shape[2], ring, U: e.U, V: e.V, W: e.W };
    const d = decide(claim);
    let extra = null, overQ = null;
    if (ring === 'F2' && d.verdict === 'VERIFIED') {
      const q = decide(Object.assign({}, claim, { ring: 'Q' }));
      overQ = q.verdict === 'VERIFIED' ? 'VERIFIED over Q as well (layout ' + q.layout + ') — the scheme does not need characteristic 2' : 'REFUTED over Q — the scheme needs characteristic 2 (' + q.why.slice(0, 120) + ')';
      extra = overQ.split(' — ')[0].replace('VERIFIED over Q as well', 'the same factors also hold over Q').replace('REFUTED over Q', 'the same factors are refuted over Q');
    }
    const v = verdictOf(d);
    const values = [...new Set([].concat(...[claim.U, claim.V, claim.W].map((F) => [].concat(...F))))].sort((a, b) => a - b);
    rows.push(Object.assign(row, v, { scope: scopeOf(d, claim, extra),
      decision: Object.assign({ npzKey: keys[i], dims, rank: claim.rank, naive: dims[0] * dims[1] * dims[2], ring, layout: d.layout || null, equations: d.equations || null, coefficients: values, bigInt: d.bigInt }, overQ ? { overQ } : {}, d.why ? { why: d.why } : {}),
      ms: d.ms }));
    if (d.verdict === 'VERIFIED') entries.push(entryOf(mr.id, mr.claimant + ', key ' + keys[i] + ' of ' + file, claim, d, { file, sha256: E.sha256 }));
  });
  return { rows, entries, sourcePins: { [file]: E.sha256 } };
}

/* ---- the notebook's part A --------------------------------------------------- */
function notebook(pool) {
  const t0 = process.hrtime.bigint();
  const { sha256: nbSha, sections } = CA.convertPartA();
  const readMs = ms(t0);
  const mrows = M.rows.filter((r) => r.pool === pool);
  const rows = [], entries = [];
  const s444 = sections.find((s) => s.variable === 'decomposition_444');
  for (const mr of mrows) {
    const k = /^ae-nb-(\d)x(\d)x(\d)-r(\d+)$/.exec(mr.id);
    if (!k) die('unexpected id ' + mr.id);
    const dims = [Number(k[1]), Number(k[2]), Number(k[3])], rank = Number(k[4]);
    const sec = sections.filter((s) => s.dims.join() === dims.join() && s.rank === rank);
    if (sec.length !== 1) die(mr.id + ': ' + sec.length + ' notebook sections match <' + dims + '> rank ' + rank);
    const s = sec[0];
    const row = rowBase(mr, nbSha);
    const fileRef = 'notebook cell ' + (s.printed ? s.dataCell + ' (' + s.variable + ')' : s.markdownCell + ' (prose only)');
    if (s.refused) { rows.push(Object.assign(row, { verdict: 'REFUSED', kind: 'none', scope: 'the reader refuses the printed bytes: ' + s.refused, decision: { heading: s.heading, cell: fileRef }, ms: readMs })); continue; }
    let claim, rebuilt = null;
    if (!s.printed) {
      /* the one section printed only as prose: rebuild it from the recipe it prints, then decide the rebuild */
      if (!/doubling the rank-48 decomposition of <4,4,4>/.test(s.prose || '') || dims.join() !== '4,4,8') {
        rows.push(Object.assign(row, { verdict: 'NEEDS DATA', kind: 'data-not-public', scope: 'the section prints no decomposition and no recipe this run can rebuild from: "' + (s.prose || '') + '"', decision: { heading: s.heading, cell: fileRef }, ms: readMs }));
        continue;
      }
      if (!s444 || s444.refused) die('the <4,4,8> recipe needs the printed <4,4,4>, which did not read');
      const base = s444.claim, bd = decide(base);
      if (bd.verdict !== 'VERIFIED') die('the printed rank-48 <4,4,4> no longer verifies');
      claim = Object.assign(doubleAlongP(base, bd.layout), { claimedRing: s.ring, denominators: base.denominators });
      rebuilt = 'not printed: the notebook says "' + s.prose + '" — rebuilt here from the printed rank-48 <4,4,4> (cell ' + s444.dataCell + '), one copy per 4-column block of B, and the rebuild decided';
    } else claim = s.claim;
    const d = decide(claim);
    const v = verdictOf(d);
    rows.push(Object.assign(row, v, { scope: scopeOf(d, claim, rebuilt ? 'the object is not printed; rebuilt here from the printed recipe and the printed <4,4,4>' : null),
      decision: Object.assign({ heading: s.heading, cell: fileRef, dims, rank, naive: dims[0] * dims[1] * dims[2], claimedRing: s.ring, decidedOver: claim.ring, scale: claim.scale, denominators: claim.denominators,
        layout: d.layout || null, equations: d.equations || null, coefficients: rebuilt ? s444.claim.values : claim.values, bigInt: d.bigInt }, rebuilt ? { rebuilt } : {}, d.why ? { why: d.why } : {}),
      ms: Math.round((d.ms + (rebuilt ? 0 : readMs / mrows.length)) * 10) / 10 }));
    if (d.verdict === 'VERIFIED') entries.push(entryOf(mr.id, mr.claimant + ', ' + s.heading + (rebuilt ? ' (rebuilt from the printed <4,4,4> by the notebook\'s doubling recipe)' : ''), claim, d, { file: 'alphaevolve_mathematical_results.ipynb', sha256: nbSha }));
  }
  return { rows, entries, sourcePins: { 'alphaevolve_mathematical_results.ipynb': nbSha }, readMs };
}

function run(pool) {
  const t0 = process.hrtime.bigint();
  const r = pool === 'alphaevolve-nb-matmul' ? notebook(pool) : alphatensor(pool);
  const expected = M.rows.filter((x) => x.pool === pool).length;
  if (r.rows.length !== expected || expected !== M.caps[pool]) die(pool + ': ' + r.rows.length + ' rows decided, the manifest holds ' + expected);
  const byVerdict = {}, byKind = {};
  for (const x of r.rows) { byVerdict[x.verdict] = (byVerdict[x.verdict] || 0) + 1; byKind[x.kind] = (byKind[x.kind] || 0) + 1; }
  const OUT = path.join('certs', 'mc100-' + pool + '.json');
  const ledger = {
    what: 'The ' + pool + ' pool of the hundred pre-registered machine claims (corpus/machine-claims-100.json, registered 2026-10-02 before any was decided), decided by tools/run-mc100-tensors.js: every row the manifest names, its bytes re-hashed against the pin, its factors transcribed exactly and every tensor-identity equation decided by instruments/strassen/tensor.js and re-decided in BigInt. `entries` is the detached certificate of every CERTIFIED row: python3 tools/verify_strassen.py ' + OUT + ' --sources corpus/sources re-derives each with the Python standard library alone. The claimant\'s code is never run.',
    pool, manifest: 'corpus/machine-claims-100.json', registered: M.registered,
    decider: 'instruments/strassen/tensor.js (audit, auditZi; BigInt cross-check in full) · second implementation: tools/verify_strassen.py on this file',
    transcriber: pool === 'alphaevolve-nb-matmul' ? 'tools/convert_alphaevolve.js (convertPartA)' : 'tools/convert_alphatensor.py --emit',
    rows: r.rows, count: r.rows.length, byVerdict, byKind,
    timing: { runMs: ms(t0), rowMsTotal: Math.round(r.rows.reduce((s, x) => s + x.ms, 0) * 10) / 10 },
    layoutNote: 'layout AC: k = a*p + c; layout CA: k = c*n + a.',
    sourcePins: r.sourcePins,
    entries: r.entries,
    generated: new Date().toISOString(), git, node: process.version
  };
  fs.writeFileSync(path.join(ROOT, OUT), JSON.stringify(ledger) + '\n');
  /* the second implementation, on the file just written: stdlib Python, its red control must fire */
  const v = cp.spawnSync('python3', [path.join(ROOT, 'tools', 'verify_strassen.py'), OUT, '--sources', 'corpus/sources'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
  const last = (v.stdout || '').trim().split('\n').pop();
  if (v.status !== 0) { fs.unlinkSync(path.join(ROOT, OUT)); die(pool + ': tools/verify_strassen.py does not re-derive the ledger (' + last + ') — ledger removed'); }
  console.log(OUT + ' · ' + r.rows.length + ' rows · ' + Object.entries(byVerdict).map(([k, n]) => n + ' ' + k).join(', ') + ' · ' + ledger.timing.runMs + ' ms · stdlib re-derivation: ' + last);
}

module.exports = { POOLS, decide, doubleAlongP, alphatensor, notebook, ringWords };

if (require.main === module) {
  const arg = process.argv[2];
  if (!arg || !(POOLS.includes(arg) || arg === 'all')) die('usage: node tools/run-mc100-tensors.js ' + POOLS.join('|') + '|all');
  for (const p of arg === 'all' ? POOLS : [arg]) run(p);
}
