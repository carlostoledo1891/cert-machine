#!/usr/bin/env node
/* battery.js — the δ₄ probe's gates. PASS/FAIL per line; nonzero exit on any FAIL.
   instruments/delta4 · cert-machine

   GREEN: the functional against itself (decomposition identity) and against exact
   discrete counts; BCG's coefficient; h₄'s sign, zeros, continuity, integral and
   linearity; the edge Hessian against exact finite differences of F, PD, and its λ_min
   bracket; the class-split model against exact multi-class F; the residue colourings
   (1/66, 37/2662) and the Z_m search; the vacuous pointwise relaxation; the circle.

   RED: each control plants one wrong thing and the gate written for it must refuse it —
   a block length +1, a planted negative h₄ value, a genuinely non-stationary colouring, a
   sign-flipped Hessian entry, the local term without its cubic and quartic parts, a
   swapped residue, a wrong-gap pair integrand. A red that is not refused FAILs.

   MIT licensed. Part of cert-machine. */
'use strict';

const Q = require('../interval/rational.js');
const M = require('./model.js');

let fails = 0, n = 0;
const line = (ok, name, extra) => { n++; if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); };
const green = (name, fn) => { let ok, extra; try { const r = fn(); ok = r === true || (r && r.ok); extra = r && r.note; } catch (e) { ok = false; extra = 'threw: ' + e.message; } line(ok, name, extra); };
const red = (name, gate, forged) => { let refused, why; try { const r = gate(forged()); refused = !r.ok; why = r.reason; } catch (e) { refused = true; why = 'threw: ' + e.message; } line(refused, 'RED ' + name, refused ? 'refused: ' + why : 'NOT refused'); };
const R = (a, b) => Q.R(BigInt(a), BigInt(b === undefined ? 1 : b));

const bcg = M.blocksCol(M.BCG_BLOCKS), W = bcg.W, E = bcg.classes[0].E, nE = E.length - 2;

/* ---- gates (each returns { ok, reason }) ---------------------------------------------- */
const gateCoefficient = col => { const F = M.F(col); return Q.cmp(F, M.BCG_PRINTED) === 0 ? { ok: true } : { ok: false, reason: 'F = ' + Q.toDouble(F) + ' ≠ printed ' + Q.toDouble(M.BCG_PRINTED) }; };
/* h₄ ≥ 0, continuous at every edge, zero exactly at the interior edges and nowhere else */
function gateH4({ col, rows }) {
  const f = M.h4Facts(col, rows), edges = new Set(col.classes[0].E.slice(1, -1).map(e => String(60n * e)));
  if (f.negatives.length) return { ok: false, reason: f.negatives.length + ' candidate(s) with h₄ < 0' };
  if (f.slopes.some(s => s.jump !== 0n)) return { ok: false, reason: 'h₄ jumps at an edge (not stationary)' };
  const z = f.zeros.map(x => String(x.A));
  if (z.length !== edges.size || z.some(a => !edges.has(a))) return { ok: false, reason: 'zeros ≠ edges' };
  return { ok: true };
}
const F0 = M.F(bcg), eps = W / 10n ** 14n, e2 = Q.mul(Q.R(eps, W), Q.R(eps, W));
const shift = moves => { const En = E.slice(); for (const [a, e] of moves) En[a + 1] += e; return { W, classes: [{ E: En, c: bcg.classes[0].c }] }; };
const fdEntry = (a, b) => (a === b
  ? Q.div(Q.sub(Q.add(M.F(shift([[a, eps]])), M.F(shift([[a, -eps]]))), Q.mul(R(2), F0)), e2)
  : Q.div(Q.add(Q.sub(Q.sub(M.F(shift([[a, eps], [b, eps]])), M.F(shift([[a, eps]]))), M.F(shift([[b, eps]]))), F0), e2));
/* a Hessian model must agree with the exact second differences of F on probed entries */
function gateHessian({ H, entries }) {
  for (const [a, b] of entries) { const fd = fdEntry(a, b); if (Q.cmp(fd, H[a][b]) !== 0) return { ok: false, reason: `H[${a}][${b}] = ${Q.toString(H[a][b])} but F says ${Q.toString(fd)}` }; }
  return { ok: true };
}
const gateResidue = ({ chi, F }) => { const got = M.F(M.residueCol(chi)); return Q.cmp(got, F) === 0 ? { ok: true } : { ok: false, reason: 'F = ' + Q.toString(got) + ' ≠ ' + Q.toString(F) }; };
function gateIdentity({ col, pairIntegrand }) {
  const ks = M.kinksOf(col);
  let s = Q.add(M.sweep(col, M.I_ONE, ks), M.sweep(col, M.I_QUART, ks));
  for (const [i, j] of M.PAIRS) s = Q.add(s, M.sweep(col, pairIntegrand(i, j), ks));
  const F = M.sweep(col, M.I_MONO, ks);
  return Q.cmp(Q.mul(R(1, 8), s), F) === 0 ? { ok: true } : { ok: false, reason: '(|Δ| + ΣP + T₄)/8 ≠ F' };
}

/* ---- shared exact objects ----------------------------------------------------------------- */
const rows = M.h4Table(bcg), facts = M.h4Facts(bcg, rows);
const { X } = M.crossByGap(bcg);
const buildH = (u, gaps) => { const H = []; for (let a = 0; a < nE; a++) { H.push([]); for (let b = 0; b < nE; b++) { if (a === b) H[a].push(Q.add(facts.slopes[a].kappaPlus, Q.mul(R(2), u))); else { let s = R(0); for (const g of gaps) s = Q.add(s, X[g][a][b]); H[a].push(s); } } } return H; };
const U = M.localU([1]), H = buildH(U, [1, 2, 3]);
const ENTRIES = [[0, 0], [11, 11], [0, 1], [20, 21], [5, 30]];
const chi11 = Array.from({ length: 11 }, (_, r) => (r === 0 || M.QR11.includes(r) ? 1 : -1));

/* ---- GREEN ----------------------------------------------------------------------------------- */
green('F(constant colouring) = |Δ| = 1/6', () => Q.cmp(M.F(M.blocksCol([3n])), R(1, 6)) === 0);
green('decomposition F = (|Δ| + Σ P_ij + T₄)/8, exactly, on BCG', () => gateIdentity({ col: bcg, pairIntegrand: M.I_PAIR }));
green('decomposition, exactly, on a random 9-block colouring', () => gateIdentity({ col: M.blocksCol([5n, 3n, 5n, 7n, 5n, 5n, 2n, 7n, 5n]), pairIntegrand: M.I_PAIR }));
green('brute force: |n·(count/n² − F)| < 1 for every term, 9-block colouring at n = 100·W', () => {
  const col = M.blocksCol([5n, 3n, 5n, 7n, 5n, 5n, 2n, 7n, 5n]), d = M.decompose(col), nn = 100 * Number(col.W), c = M.countDiscrete(M.discretise(col, nn));
  const g = v => Math.abs(nn * (v[0] / nn / nn - Q.toDouble(v[1])));
  const gaps = [g([c.mono, d.F]), g([c.quart, d.quart]), ...Object.keys(c.pair).map(k => g([c.pair[k], d.pairs[k]]))];
  return { ok: gaps.every(x => x < 1), note: 'max ' + Math.max(...gaps).toFixed(3) };
});
green('the parity colouring breaks it: discrete 1/12 vs F(step function) = 1/36', () => {
  const nn = 3000, chi = new Int8Array(nn); for (let a = 0; a < nn; a++) chi[a] = a % 2 ? 1 : -1;
  const c = M.countDiscrete(chi), Fs = M.F(M.blocksCol(new Array(24).fill(1n)));
  return Math.abs(c.mono / nn / nn - 1 / 12) < 1e-3 && Q.cmp(Fs, R(1, 36)) === 0;
});
green('F(BCG 36 blocks) = BCG\'s printed coefficient, exactly', () => gateCoefficient(bcg));
green('h₄ ≥ 0, continuous, zero exactly at the 35 edges', () => gateH4({ col: bcg, rows }));
green('∫h₄ = −(ΣP + 2T₄)/2, exactly', () => { const d = M.decompose(bcg); const P = Object.values(d.pairs).reduce((s, v) => Q.add(s, v), R(0)); return Q.cmp(facts.integral, Q.mul(R(-1, 2), Q.add(P, Q.mul(R(2), d.quart)))) === 0; });
green('h₄ linear between candidates (exact midpoints, 1 in 23 intervals)', () => { for (let k = 0; k + 1 < rows.length; k += 23) { const a = rows[k].A, b = rows[k + 1].A; if ((a + b) % 2n) continue; if (2n * M.h4Acc(bcg, (a + b) / 2n, 1) !== rows[k].R + rows[k + 1].L) return false; } return true; });
green('h₄(1/2) against an exact finite difference of F (flip [1/2, 1/2 + 10⁻¹²])', () => {
  const a = W / 2n, e = W / 10n ** 12n; let k = 0; while (E[k + 1] <= a) k++;
  const col = { W, classes: [{ E: [...E.slice(0, k + 1), a, a + e, ...E.slice(k + 1)], c: [...bcg.classes[0].c.slice(0, k + 1), -bcg.classes[0].c[k], bcg.classes[0].c[k], ...bcg.classes[0].c.slice(k + 1)] }] };
  const fd = Q.toDouble(Q.div(Q.sub(M.F(col), F0), Q.R(e, W))), h = Q.toDouble(Q.R(M.h4Acc(bcg, 60n * a, 1), 360n * W));
  return { ok: Math.abs(fd - h) < 1e-9, note: `fd ${fd.toExponential(10)} h₄ ${h.toExponential(10)}` };
});
green('edge Hessian model = exact second differences of F (5 entries)', () => gateHessian({ H, entries: ENTRIES }));
green('edge Hessian PD (exact LDLᵀ), λ_min ∈ [411/5000, 823/10000]', () => {
  const sh = s => H.map((r, i) => r.map((v, j) => (i === j ? Q.sub(v, s) : v)));
  return M.ldlPivots(H).pd && M.ldlPivots(sh(R(411, 5000))).pd && !M.ldlPivots(sh(R(823, 10000))).pd;
});
green('local term U = 17/12 = 7/4 − 2/3 + 1/3 (Q₂ + C₃ + Q₄)', () => ['Q2', 'C3', 'Q4'].map(p => Q.toString(M.localU([1], p))).join(' ') === '7/4 -2/3 1/3' && Q.cmp(U, R(17, 12)) === 0);
green('parity and mod-3 split Hessians PD (exact)', () => M.ldlPivots(buildH(M.localU([1, -1]), [2])).pd && M.ldlPivots(buildH(Q.mul(R(1, 2), M.localU([2, -1, -1])), [3])).pd);
green('parity split model = exact two-class F (edge 4 +1, edge 7 −2, edge 20 +1)', () => {
  const v = new Array(nE).fill(0); v[4] = 1; v[7] = -2; v[20] = 1;
  const step = W / 10n ** 13n, mk = vs => M.classCol(vs.map(w => { const En = E.slice(); for (let a = 0; a < nE; a++) if (w[a]) En[a + 1] += BigInt(w[a]) * step; return { E: En, c: bcg.classes[0].c }; }));
  const Hp = buildH(M.localU([1, -1]), [2]); let q = R(0); for (let a = 0; a < nE; a++) for (let b = 0; b < nE; b++) if (v[a] && v[b]) q = Q.add(q, Q.mul(Hp[a][b], R(v[a] * v[b])));
  const sR = Q.R(step, W);
  return Q.cmp(Q.sub(M.F(mk([v, v.map(x => -x)])), F0), Q.mul(Q.mul(R(1, 2), Q.mul(sR, sR)), q)) === 0;
});
green('Z₁₁ quadratic-residue colouring, solid classes: F = 1/66', () => gateResidue({ chi: chi11, F: R(1, 66) }));
green('two-level unrolling mod 121: F = 37/2662', () => gateResidue({ chi: Array.from({ length: 121 }, (_, r) => (r === 0 ? 1 : M.unrolledColour(r, 11, M.QR11))), F: R(37, 2662) }));
green('Lu–Peng unrolled colouring, n = 6000: count/n² within 1/n of 1/72', () => { const nn = 6000, chi = new Int8Array(nn); for (let a = 1; a <= nn; a++) chi[a - 1] = M.unrolledColour(a, 11, M.QR11); const c = M.countDiscrete(chi).mono; return { ok: Math.abs(c / nn / nn - 1 / 72) < 1 / nn, note: (c / nn / nn).toFixed(6) }; });
green('Z_m avoiders: 22 at m = 11, none at 13, 88 at 33, none at 34', () => M.zmAvoiders(11, 1e6).length === 22 && M.zmAvoiders(13, 1e6).length === 0 && M.zmAvoiders(33, 1e6).length === 88 && M.zmAvoiders(34, 1e6).length === 0);
green('pointwise relaxation is vacuous: odd-tuple law has zero 1st/2nd moments and no mono tuple', () => {
  const odd = []; for (let m = 0; m < 16; m++) { const x = [0, 1, 2, 3].map(i => ((m >> i) & 1 ? -1 : 1)); if (x[0] * x[1] * x[2] * x[3] === -1) odd.push(x); }
  return odd.length === 8 && [0, 1, 2, 3].every(i => odd.reduce((s, x) => s + x[i], 0) === 0) && M.PAIRS.every(([i, j]) => odd.reduce((s, x) => s + x[i] * x[j], 0) === 0) && odd.every(x => !x.every(v => v === x[0]));
});
green('circle: 11 equal QR blocks give 15/121 = (1 + 6μ² + Λ₄)/8', () => {
  const col = { W: 11n, classes: [{ E: Array.from({ length: 12 }, (_, k) => BigInt(k)), c: chi11 }] };
  const mono = M.circleSweep(col, M.I_MONO), L4 = M.circleSweep(col, M.I_QUART);
  return Q.cmp(mono, R(15, 121)) === 0 && Q.cmp(mono, Q.mul(R(1, 8), Q.add(Q.add(R(1), Q.mul(R(6), R(1, 121))), L4))) === 0;
});
green('flipDelta = brute-force count difference (200 random small colourings)', () => { let s = 7; const rnd = () => (s = (s * 48271) % 2147483647) / 2147483647; for (let t = 0; t < 200; t++) { const nn = 12 + (t % 30), chi = new Int8Array(nn); for (let a = 0; a < nn; a++) chi[a] = rnd() < 0.5 ? 1 : -1; const a = Math.floor(rnd() * nn), c0 = M.countDiscrete(chi).mono, d = M.flipDelta(chi, a); chi[a] = -chi[a]; if (M.countDiscrete(chi).mono - c0 !== d) return false; } return true; });

/* ---- RED ------------------------------------------------------------------------------------- */
red('one BCG block length +1 breaks the coefficient match', gateCoefficient, () => { const b = M.BCG_BLOCKS.slice(); b[17] += 1n; return M.blocksCol(b); });
red('a planted negative h₄ value (one candidate, −1 unit)', gateH4, () => { const r2 = rows.map(r => ({ ...r })); let k = Math.floor(r2.length / 3); while (r2[k].edge) k++; r2[k] = { ...r2[k], L: -1n, R: -1n }; return { col: bcg, rows: r2 }; });
red('a genuinely non-stationary colouring (edge 18 moved by W/1000) — h₄ jumps and goes negative', gateH4, () => { const col = shift([[17, W / 1000n]]); return { col, rows: M.h4Table(col) }; });
red('a Hessian with one cross entry sign-flipped', gateHessian, () => { const H2 = H.map(r => r.slice()); H2[20][21] = Q.neg(H2[20][21]); H2[21][20] = Q.neg(H2[21][20]); return { H: H2, entries: ENTRIES }; });
red('the local term without its cubic and quartic parts (U = 7/4)', gateHessian, () => ({ H: buildH(M.localU([1], 'Q2'), [1, 2, 3]), entries: [[11, 11]] }));
red('a residue colouring with one residue and one non-residue swapped', gateResidue, () => { const c = chi11.slice(); [c[1], c[2]] = [c[2], c[1]]; return { chi: c, F: R(1, 66) }; });
red('a pair integrand at the wrong gap (P_02 computed as P_01)', gateIdentity, () => ({ col: bcg, pairIntegrand: (i, j) => (i === 0 && j === 2 ? M.I_PAIR(0, 1) : M.I_PAIR(i, j)) }));

console.log(`\n${n - fails}/${n} PASS${fails ? `, ${fails} FAIL` : ''}`);
process.exit(fails ? 1 : 0);
