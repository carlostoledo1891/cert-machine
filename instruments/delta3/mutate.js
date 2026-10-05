#!/usr/bin/env node
/* mutate.js — the mutation pass over the clean-room delta3 verifier: copy the verifier into a
   temporary directory, apply ONE edit (two where marked), run the genuine set and the battery
   (fail-fast) against the copy, and record whether the edit was caught. The repository files
   are never touched. A mutant that survives is either a missing control (add one) or provably
   equivalent (say why, in the row).

   Writes certs/delta3-mutations.json. Not part of the battery (about two minutes).
   usage: node instruments/delta3/mutate.js                                              MIT */
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto'), { spawnSync } = require('child_process');
const REPO = path.resolve(__dirname, '..', '..');
const SCR = fs.mkdtempSync(path.join(os.tmpdir(), 'delta3-mut-'));
const SRC = ['model.js', 'psd.js', 'verify.js', 'lemmas.js', 'battery.js'];
/* why the one survivor is harmless: the edge-membership rule is enforced twice — the per-cell
   straddle check refuses a cell that contains an edge of phi* in its interior — so M19 alone
   changes nothing; M19b removes both and is caught */
const EQUIVALENT = { M19: 'the grid rule is enforced twice: the per-cell straddle check still refuses a cell containing an edge (M19b removes both and is caught)' };
const MUTS = [
  ['M1', 'h sign flipped (h = +φ*g*)', [['model.js', 'return Q.mul(r(-(sL !== null ? sL : sR)), g);', 'return Q.mul(r((sL !== null ? sL : sR)), g);']]],
  ['M2', 'φ* altered (blocks 28,6 → 29,5)', [['model.js', 'const BLOCKS = [28, 6, 28,', 'const BLOCKS = [29, 5, 28,']]],
  ['M3a', 'R mirrored in the trapezoid areas only', [['verify.js', 'const A4 = M.area4(G[i], G[i + 1], G[j], G[j + 1], Ub);', 'const A4 = M.area4(G[j], G[j + 1], G[i], G[i + 1], Ub);']]],
  ['M3b', 'R mirrored in BOTH area routines (2-line edit)', [['verify.js', 'const A4 = M.area4(G[i], G[i + 1], G[j], G[j + 1], Ub);', 'const A4 = M.area4(G[j], G[j + 1], G[i], G[i + 1], Ub);'], ['verify.js', 'const clip = M.area4Clip(G[i], G[i + 1], G[j], G[j + 1], Ub);', 'const clip = M.area4Clip(G[j], G[j + 1], G[i], G[i + 1], Ub);']]],
  ['M4', 'ε dropped from the bound (bound = B)', [['verify.js', 'const bound = Q.sub(B, Q.mul(eps, r(1 + n)));', 'const bound = B;']]],
  ['M5', 'ε dropped from the matrix (S, not S + εI)', [['verify.js', 'const S = slabMatrix(p, eps);', 'const S = slabMatrix(p, ZERO);']]],
  ['M6', 'ε(1+n) → ε·n', [['verify.js', 'const bound = Q.sub(B, Q.mul(eps, r(1 + n)));', 'const bound = Q.sub(B, Q.mul(eps, r(n)));']]],
  ['M7', 'optimistic cut bound (s=+1: drop −A_out)', [['verify.js', 'return [{ k: ZERO, q: ZERO }, { k: Q.neg(c.Aout), q: c.ww }];', 'return [{ k: ZERO, q: ZERO }, { k: ZERO, q: c.ww }];']]],
  ['M8', 'cut pairs ≥ half inside classified full', [['verify.js', 'if (A4 === F4) { full.push(', 'if (2n * A4 >= F4) { full.push(']]],
  ['M9', 'bathtub curvature ×2', [['model.js', 'const b = M === null ? r(0) : Q.div(Q.mul(w, w), Q.mul(r(2), M));', 'const b = M === null ? r(0) : Q.div(Q.mul(w, w), M);']]],
  ['M10', 'bathtub slope from max h', [['model.js', 'for (let x = p; x <= q; x++) if (Q.cmp(hn[x], min) < 0) min = hn[x];', 'for (let x = p; x <= q; x++) if (Q.cmp(hn[x], min) > 0) min = hn[x];']]],
  ['M11', 'bathtub max m′ over single pieces (not summed)', [['model.js', 'mp = Q.add(mp, pc.inv);', 'mp = Q.cmp(pc.inv, mp) > 0 ? pc.inv : mp;']]],
  ['M12', 'm² expanded without the factor 2 on cross terms', [['verify.js', 'r(k === l ? 1 : 2)', 'r(1)']]],
  ['M13', 'tri sign rule skipped', [['verify.js', "if (s[0] * s[1] * s[2] !== 1) refuse(", "if (false) refuse("]]],
  ['M14', 'tri distinct-index rule skipped', [['verify.js', "if (i === j || j === k || i === k) refuse(", "if (false) refuse("]]],
  ['M15', 'multiplier sign check skipped', [['verify.js', "const nonneg = (q, what) => { if (Q.sign(q) < 0) refuse(", "const nonneg = (q, what) => { if (false) refuse("]]],
  ['M16', 'θ range check skipped', [['verify.js', "if (Q.sign(v) < 0 || Q.cmp(v, ONE) > 0) refuse('theta:", "if (false) refuse('theta:"]]],
  ['M17', 'inner linear identity (c_i = leftover) skipped', [['verify.js', 'if (badLin >= 0) refuse(', 'if (false) refuse(']]],
  ['M18', 'cover accepts a gap', [['verify.js', 'if (Q.cmp(lo, reach) > 0) { gap = [reach, lo]; break; }', 'if (false) { gap = [reach, lo]; break; }']]],
  ['M19', 'grid edge-membership check skipped', [['verify.js', "for (const e of M.EDGES) if (!set.has(e)) refuse(", "for (const e of M.EDGES) if (false) refuse("]]],
  ['M19b', 'grid edge-membership AND per-cell straddle checks skipped (2-line edit)', [['verify.js', "for (const e of M.EDGES) if (!set.has(e)) refuse(", "for (const e of M.EDGES) if (false) refuse("], ['verify.js', "if (blk < 0) refuse('grid: cell '", "if (false) refuse('grid: cell '"]]],
  ['M20', 'PSD: float Cholesky trusted (exact remainder check skipped)', [['psd.js', 'if (Q.sign(margin) >= 0) {', 'if (true) {']]],
  ['M21', 'PSD: Bareiss accepts a zero leading minor', [['psd.js', "if (bz.minorSign > 0) return { verdict: 'PSD'", "if (bz.minorSign >= 0) return { verdict: 'PSD'"]]],
  ['M22', 'PSD: Bareiss pivot test accepts zero (piv < 0 instead of ≤ 0)', [['psd.js', 'if (piv <= 0n) return', 'if (piv < 0n) return']]],
];
const rows = [];
for (const [id, desc, edits] of MUTS) {
  const dir = path.join(SCR, id, 'instruments');
  fs.rmSync(path.join(SCR, id), { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, 'delta3'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'interval'), { recursive: true });
  for (const f of SRC) fs.copyFileSync(path.join(REPO, 'instruments/delta3', f), path.join(dir, 'delta3', f));
  fs.copyFileSync(path.join(REPO, 'instruments/interval/rational.js'), path.join(dir, 'interval/rational.js'));
  for (const [f, find, rep] of edits) {
    const p = path.join(dir, 'delta3', f), s = fs.readFileSync(p, 'utf8');
    const cnt = s.split(find).length - 1;
    if (cnt !== 1) throw new Error(id + ': pattern occurs ' + cnt + ' times in ' + f);
    fs.writeFileSync(p, s.replace(find, rep));
  }
  const env = Object.assign({}, process.env, { DELTA3_ROOT: REPO, BATTERY_FAILFAST: '1' });
  const t0 = Date.now();
  const g = spawnSync('node', [path.join(dir, 'delta3/verify.js')], { env, encoding: 'utf8', timeout: 600000 });
  const b = spawnSync('node', [path.join(dir, 'delta3/battery.js')], { env, encoding: 'utf8', timeout: 900000 });
  const gLines = (g.stdout + g.stderr).split('\n');
  const genuine = g.status === 0 ? 'passes' : 'REFUSES (' + (gLines.find(l => /REFUSED/.test(l)) || gLines.find(l => /Error/.test(l)) || '').trim().slice(0, 120) + ')';
  const bOut = (b.stdout + b.stderr).split('\n');
  const firstFail = bOut.find(l => l.startsWith('FAIL')) || (b.status !== 0 ? (bOut.find(l => /Error/.test(l)) || 'crash') : null);
  const row = { id, desc, genuineSet: genuine, battery: b.status === 0 ? 'GREEN (SURVIVED)' : 'caught', firstFail: firstFail ? firstFail.slice(0, 200) : null, seconds: (Date.now() - t0) / 1000 };
  rows.push(row);
  console.log(JSON.stringify(row));
  fs.rmSync(path.join(SCR, id), { recursive: true, force: true });
}
fs.rmSync(SCR, { recursive: true, force: true });
for (const r of rows) if (r.battery !== 'caught' && !r.genuineSet.startsWith('REFUSES')) r.equivalent = EQUIVALENT[r.id] || null;
const caught = rows.filter((r) => r.battery === 'caught' || r.genuineSet.startsWith('REFUSES')).length;
const unexplained = rows.filter((r) => r.equivalent === null);
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(path.join(REPO, 'instruments', 'delta3', f))).digest('hex');
fs.writeFileSync(path.join(REPO, 'certs', 'delta3-mutations.json'), JSON.stringify({
  what: 'The mutation pass over instruments/delta3: one-line edits of the clean-room verifier, each run against the genuine certificates and the battery. A row is caught when the genuine set is refused or the battery fails; a survivor must be explained as equivalent.',
  decidedOn: new Date().toISOString().slice(0, 10), node: process.version,
  verifierFiles: Object.fromEntries(SRC.map((f) => ['instruments/delta3/' + f, sha(f)])),
  counts: { mutants: rows.length, caught, survivedEquivalent: rows.length - caught - unexplained.length, survivedUnexplained: unexplained.length },
  rows }, null, 1) + '\n');
console.log('mutants ' + rows.length + ', caught ' + caught + ', equivalent ' + (rows.length - caught - unexplained.length) + ', unexplained ' + unexplained.length);
if (unexplained.length) process.exit(1);
