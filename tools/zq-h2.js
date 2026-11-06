#!/usr/bin/env node
/* zq-h2.js — the attempt to discharge lane 2's premise H2 on the claim "Z is Diophantine in Q" (Glazer et al.,
   2026-11-05). Pre-registered in notes/zq-preregistration-2026-11-06.md, Amendment A1 (commit 13c9e92e), before any
   of this ran. Writes certs/zq-h2.json; `--check` re-derives it and refuses on any difference.

   THE THEOREM IS UNDECIDED HERE, and so is H2: this record decides the FINITE ingredients of the manuscript's proof
   of H2 and says exactly why H2 itself is not a computation.

   H2 (TeX line 6347, the last sentence of the proof of prop:cutoff): M_0 ≤ N_s^10, where (TeX 239-245, S31; JSON
   definitions.coefficientAlgorithms.localMultiplier) M_0 is the least m ≥ 1 with 1/x([m]P_0) = (a + b√2)/c reduced,
   N_s^4 | a, N_s^4 | b, gcd(c, N_s) = 1; N_s = P_s·H_cat, the primorial of 324 times the product of the catalogue
   (the first 22 primes > 324 in each unit class mod W = 4·P_s).

   CLEAN ROOM: exact arithmetic of our own (tools/zq-k0.js and the finite-field code below, Numbers below 2^31 for
   the residue fields); read from the claimant: the TeX and the definition JSON only. No code of theirs is read.

   usage: node tools/zq-h2.js [--check] */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { Q, K, curve, gcdSelfTest } = require('./zq-k0.js');
const ROOT = path.join(__dirname, '..');
const REPO = process.env.ZQ_REPO || path.join(os.homedir(), 'Projects', 'zq-scout', 'diophantine-z-q');
const OUT = path.join(ROOT, 'certs', 'zq-h2.json');
const L2 = path.join(ROOT, 'certs', 'zq-tower.json');
const die = (m) => { console.error('zq-h2: ' + m); process.exit(1); };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const PIN = {
  repository: 'github.com/elliotglazer/diophantine-z-q', commit: '97cec7fdd757d9a8e4f468151a47a6d3610fb2f2',
  definition: { path: 'construction/ordinary-integer-definition.json', sha256: '4d639d4c44e69ea360d36d4591b8fdc82269d68b9363af0157d1e5c1174c7af6' },
  tex: { path: 'diophantine_zq.tex', sha256: 'cb1148cd6c7769d2af3f1636b60ff0ada4b40431978d1e98d0c339274b3d792b' },
};
const UNDECIDED = 'The theorem (Z is Diophantine in Q) is undecided here: the main Lean target lean/Frozen/BoundedIntegerPolynomial.lean is unproved (its proof is `sorry`) and nothing in this record decides it. Nor does this record decide H2 (M_0 ≤ N_s^10): it decides the finite ingredients of the manuscript\'s proof of H2 and records why H2 itself is not a computation.';
const readPinned = (rel, want) => { const p = path.join(REPO, rel); if (!fs.existsSync(p)) die('the claimant clone is not at ' + REPO + ' (set ZQ_REPO); refusing'); const b = fs.readFileSync(p); if (sha(b) !== want) die(rel + ' is not the pinned bytes; REFUSED, nothing computed'); return b; };

/* ---- the residue fields F_p and F_{p²} = F_p[s]/(s² − 2): elements [a, b] = a + b·s, Numbers in [0, p) ---- */
const mod = (a, p) => ((a % p) + p) % p;
const powmod = (b, e, p) => { let r = 1, x = mod(b, p); while (e > 0) { if (e & 1) r = (r * x) % p; x = (x * x) % p; e = Math.floor(e / 2); } return r; };
function field(p) {
  const add = (x, y) => [(x[0] + y[0]) % p, (x[1] + y[1]) % p];
  const sub = (x, y) => [mod(x[0] - y[0], p), mod(x[1] - y[1], p)];
  const mul = (x, y) => [(x[0] * y[0] + 2 * ((x[1] * y[1]) % p)) % p, (x[0] * y[1] + x[1] * y[0]) % p];
  const inv = (x) => { const n = mod(x[0] * x[0] - 2 * ((x[1] * x[1]) % p), p); if (n === 0) throw new Error('inverse of 0 mod ' + p); const ni = powmod(n, p - 2, p); return [(x[0] * ni) % p, mod(-x[1] * ni, p)]; };
  const eq = (x, y) => x[0] === y[0] && x[1] === y[1];
  const isZero = (x) => x[0] === 0 && x[1] === 0;
  const pow = (x, e) => { let r = [1, 0], b = x; while (e > 0) { if (e & 1) r = mul(r, b); b = mul(b, b); e = Math.floor(e / 2); } return r; };
  return { p, add, sub, mul, inv, eq, isZero, pow };
}
/* a place above an odd prime p: 'split' with √2 ↦ r (residue field F_p, elements kept as [v, 0]) or 'inert' (F_{p²}) */
function places(p) {
  const roots = []; for (let r = 0; r < p; r++) if ((r * r) % p === 2 % p) roots.push(r);
  return roots.length ? roots.map((r) => ({ p, kind: 'split', r, q: p })) : [{ p, kind: 'inert', r: null, q: p * p }];
}
/* reduce a + b√2 (a, b rationals with denominators prime to p) at a place */
const red = (pl, x) => {
  const r1 = (q) => { const n = Number(((q.n % BigInt(pl.p)) + BigInt(pl.p)) % BigInt(pl.p)), d = Number(q.d % BigInt(pl.p)); if (d === 0) throw new Error('a denominator divisible by ' + pl.p); return (n * powmod(d, pl.p - 2, pl.p)) % pl.p; };
  const a = r1(x[0]), b = r1(x[1]);
  return pl.kind === 'split' ? [(a + b * pl.r) % pl.p, 0] : [a, b];
};
/* the reduced curve y² = x³ + A·x over the residue field: group law on its nonsingular points */
function reducedCurve(F, A) {
  const onCurve = (P) => P === null || F.eq(F.mul(P[1], P[1]), F.add(F.mul(F.mul(P[0], P[0]), P[0]), F.mul(A, P[0])));
  const add = (P, R) => {
    if (P === null) return R; if (R === null) return P;
    let lam;
    if (F.eq(P[0], R[0])) {
      if (!F.eq(P[1], R[1]) || F.isZero(P[1])) return null;
      lam = F.mul(F.add(F.mul([3, 0], F.mul(P[0], P[0])), A), F.inv(F.mul([2, 0], P[1])));
    } else lam = F.mul(F.sub(R[1], P[1]), F.inv(F.sub(R[0], P[0])));
    const x3 = F.sub(F.sub(F.mul(lam, lam), P[0]), R[0]);
    return [x3, F.sub(F.mul(lam, F.sub(P[0], x3)), P[1])];
  };
  return { onCurve, add };
}
/* all elements of the residue field */
const elements = (pl) => { const out = []; if (pl.kind === 'split') for (let a = 0; a < pl.p; a++) out.push([a, 0]); else for (let a = 0; a < pl.p; a++) for (let b = 0; b < pl.p; b++) out.push([a, b]); return out; };
const vTwo = (n) => { if (n === 0n) return Infinity; let v = 0; n = n < 0n ? -n : n; while (n % 2n === 0n) { n /= 2n; v++; } return v; };
const v2Q = (q) => vTwo(q.n) - vTwo(q.d);
const primesUpTo = (n) => { const s = new Uint8Array(n + 1), out = []; for (let i = 2; i <= n; i++) if (!s[i]) { out.push(i); for (let j = i * i; j <= n; j += i) s[j] = 1; } return out; };
const BL = (x) => (x <= 0n ? 0 : x.toString(2).length);

function build() {
  const spec = JSON.parse(readPinned(PIN.definition.path, PIN.definition.sha256).toString('utf8'));
  readPinned(PIN.tex.path, PIN.tex.sha256);
  if (!fs.existsSync(L2)) die('no certs/zq-tower.json (lane 2)');
  const lane2 = JSON.parse(fs.readFileSync(L2, 'utf8'));
  const gst = gcdSelfTest(); if (gst.disagreements) die('the fast gcd disagrees with Euclid; refusing');
  const rows = [], controls = [];
  const row = (id, statement, source, holds, numbers) => { rows.push({ id, statement, source, verdict: holds ? 'CERTIFIED' : 'REFUTED', numbers: numbers || {} }); return holds; };
  const control = (id, mutation, prediction, outcome, passed, extra) => controls.push(Object.assign({ id, mutation, prediction, outcome: String(outcome), passed: !!passed }, extra || {}));

  /* the objects, typed from the TeX (lines 256-262) */
  const d = K.parse('75', '-53'), A = K.neg(K.mul(d, d));
  const P0 = { x: K.parse('1641/8', '-145'), y: K.parse('-15465/4', '87483/32') };
  const E = curve(A);
  const jsonA = K.parse(...spec.definitions.quadraticField.A), jsonP = spec.definitions.fixedPointCodes.P.map(Q.parse);
  const codeOk = E.code(P0).every((q, i) => Q.eq(q, jsonP[i]));
  /* F1 */
  const f1 = (P) => E.onCurve(P);
  row('F1', 'P_0 = ((1641 − 1160√2)/8, (−123720 + 87483√2)/32) lies on E: y² = x³ − d²x, d = 75 − 53√2; A = −d² = −11243 + 7950√2 is the JSON\'s quadraticField.A; the JSON\'s fixedPointCodes.P is the code of P_0', 'TeX 256-262; JSON definitions', f1(P0) && K.eq(A, jsonA) && codeOk, { A: K.str(A) });
  control('HC1', 'P_0 with its x moved by 1', 'F1 fails (off the curve)', f1({ x: K.add(P0.x, K.int(1)), y: P0.y }) ? 'on the curve' : 'off the curve', !f1({ x: K.add(P0.x, K.int(1)), y: P0.y }));
  /* F2 */
  const f2 = (dd) => {
    const AA = K.neg(K.mul(dd, dd)), Delta = K.scale(K.mul(K.mul(AA, AA), AA), Q.int(-64)), d6 = K.mul(K.mul(K.mul(dd, dd), K.mul(dd, dd)), K.mul(dd, dd));
    const nd = K.norm(dd), deltaOk = K.eq(Delta, K.scale(d6, Q.int(64)));
    const roots7 = places(7).map((pl) => pl.r);
    const dAt = roots7.map((r) => ({ r, dmod7: red({ p: 7, kind: 'split', r }, dd)[0] }));
    const ok = Q.eq(nd, Q.int(7)) && deltaOk && JSON.stringify(roots7) === '[3,4]' && dAt[0].dmod7 === 0 && dAt[1].dmod7 !== 0;
    return { ok, norm: Q.str(nd), deltaOk, dAt };
  };
  const F2 = f2(d);
  row('F2', 'Norm(d) = 7 and Δ(E) = −16·4A³ = 64·d⁶, so the odd places of bad reduction are the places dividing d: 7 splits (√2 ≡ 3, 4 mod 7), d ≡ 0 at √2 ≡ 3 and d ≢ 0 at √2 ≡ 4', 'TeX 6319-6321', F2.ok, { normD: F2.norm, dMod7: F2.dAt });
  const F2b = f2(K.parse('75', '-52'));
  control('HC4', 'd = 75 − 52√2 (norm 217 = 7·31)', 'F2 fails', F2b.ok ? 'holds' : 'fails (norm ' + F2b.norm + ')', !F2b.ok);
  /* F3 */
  const pow2 = (n) => n > 0n && (n & (n - 1n)) === 0n;
  row('F3', 'P_0 is integral at every odd place: the denominators of its four coordinates are powers of 2 (' + [P0.x[0], P0.x[1], P0.y[0], P0.y[1]].map((q) => String(q.d)).join(', ') + ')', 'TeX 262; used in TeX 6309-6315', [P0.x[0], P0.x[1], P0.y[0], P0.y[1]].every((q) => pow2(q.d)));
  /* F4 and F5: every place above every odd prime p ≤ 324 */
  const odd = primesUpTo(324).filter((p) => p > 2);
  const placeRows = [];
  let hasseOk = true, cubeOk = true, divOk = true, badOk = false;
  for (const p of odd) for (const pl of places(p)) {
    const F = field(p), Ar = red(pl, A), Pr = [red(pl, P0.x), red(pl, P0.y)], C = reducedCurve(F, Ar);
    const Dr = red(pl, K.scale(K.mul(K.mul(K.mul(d, d), K.mul(d, d)), K.mul(d, d)), Q.int(64)));
    const bad = F.isZero(Dr);
    if (!C.onCurve(Pr)) throw new Error('the reduction of P_0 is off the reduced curve at ' + p);
    /* count: affine solutions + ∞, minus the singular point (0,0) at a bad place */
    let count = 1; const half = (pl.q - 1) / 2;
    for (const x of elements(pl)) { const rhs = F.add(F.mul(F.mul(x, x), x), F.mul(Ar, x)); if (F.isZero(rhs)) count += 1; else if (F.eq(F.pow(rhs, half), [1, 0])) count += 2; }
    if (bad) count -= 1;
    let k = 1, R = Pr; while (R !== null) { R = C.add(R, Pr); k++; if (k > count + 1) throw new Error('order beyond the group size at ' + p); }
    const hasse = bad ? null : (pl.q + 1 - count) ** 2 <= 4 * pl.q;
    if (hasse === false) hasseOk = false;
    if (!(k < p ** 3)) cubeOk = false;
    if (count % k !== 0) divOk = false;
    if (bad) { badOk = p === 7 && pl.r === 3 && JSON.stringify(Pr) === '[[2,0],[6,0]]' && F.isZero(Ar) && count === 7 && k === 7 && !F.isZero(F.mul([2, 0], Pr[1])); }
    placeRows.push({ p, place: pl.kind === 'split' ? '√2≡' + pl.r : 'inert', q: pl.q, bad, points: count, order: k });
  }
  /* the bad place's minimality: v(Δ) = 6·v(d) = 6 there, d generating a prime of norm 7 */
  row('F4', 'at √2 ≡ 3 (mod 7) P_0 reduces to (2, 6) on y² = x³, nonsingular (2y ≢ 0); the nonsingular points there with ∞ number exactly 7 and P_0\'s order is 7; v(Δ) = 6·v(d) = 6 < 12, so the equation is minimal at that place', 'TeX 6319-6326', badOk && Q.eq(K.norm(d), Q.int(7)), { orderAtBadPlace: 7 });
  const nPlaces = placeRows.length, maxRatio = placeRows.reduce((m, r) => Math.max(m, r.order / r.p ** 2), 0);
  let m0 = 1n; for (const r of placeRows) m0 *= BigInt(r.order);
  const Ps = primesUpTo(324).reduce((a, p) => a * BigInt(p), 1n), Podd = Ps / 2n;
  const P0lit = BigInt(spec.library.fixedConstants.P0[1]);
  row('F5', 'at all ' + nPlaces + ' places above the ' + odd.length + ' odd primes p ≤ 324: the exact order of the reduction of P_0 divides the number of nonsingular points, every good place\'s count lies in Hasse\'s interval (q + 1 − #)² ≤ 4q, every order is < p³; their product m_0(P_s) < (P_s/2)^6', 'TeX 6309-6327; Silverman V.1.1 checked here at these places', hasseOk && cubeOk && divOk && m0 < Podd ** 6n && P0lit === Ps, { places: nPlaces, split: placeRows.filter((r) => r.place !== 'inert').length, inert: placeRows.filter((r) => r.place === 'inert').length, m0PsBits: BL(m0), boundBits: BL(Podd ** 6n), largestOrderOverPSquared: maxRatio.toFixed(4), placesWithOrderAtLeastPSquared: placeRows.filter((r) => r.order >= r.p ** 2).length });
  const hc3 = placeRows.filter((r) => !(r.order < r.p ** 2));
  const quarter = placeRows.filter((r) => !r.bad).every((r) => r.points % 4 === 0 && 4 * r.order <= r.points);
  control('HC3', 'the bound p² in place of p³', 'fails at some inert place (an order can reach (p+1)²); if it fails nowhere, a blind spot (A1)', hc3.length ? hc3.length + ' places fail, first p = ' + hc3[0].p : 'fails nowhere: a BLIND SPOT, for a structural reason the pre-registration did not foresee. E has full 2-torsion over K0 and P_0 ∈ 2E(K0), so its reduction lies in 2Ẽ(F_q), of order #Ẽ/4 ≤ (p+1)²/4 < p² (checked: at every good place 4 | #Ẽ and 4·order ≤ #Ẽ: ' + quarter + '; largest order/p² = ' + maxRatio.toFixed(4) + ')', hc3.length > 0 && hc3.every((r) => r.place === 'inert'), hc3.length ? {} : { blindSpot: true, foreseenByA1: true });
  const hc5 = placeRows.filter((r) => !(r.order < r.p));
  control('HC5', 'the bound p in place of p³ (added after the run, because HC3 was blind; not pre-registered)', 'fails at some place', hc5.length + ' places fail, first p = ' + (hc5[0] ? hc5[0].p + ' (' + hc5[0].place + ', order ' + hc5[0].order + ')' : 'none'), hc5.length > 0, { addedAfterRun: true });
  /* F6: (p+1)² < p³ for every integer p ≥ 3: at p = 3 + t, p³ − (p+1)² = t³ + 8t² + 19t + 11 */
  const pm = (a, b) => { const r = Array(a.length + b.length - 1).fill(0n); a.forEach((x, i) => b.forEach((y, j) => { r[i + j] += x * y; })); return r; };
  const cube = pm(pm([3n, 1n], [3n, 1n]), [3n, 1n]), sq = pm([4n, 1n], [4n, 1n]);
  const diff = cube.map((c, i) => c - (sq[i] || 0n));
  row('F6', '(p+1)² < p³ for every integer p ≥ 3: at p = 3 + t, p³ − (p+1)² = ' + diff.map((c, i) => c + (i ? 't' + (i > 1 ? '^' + i : '') : '')).reverse().join(' + ') + ', every coefficient positive', 'TeX 6324-6325', diff.every((c) => c > 0n), { coefficients: diff.map(String) });
  /* F7: the dyadic valuations, v_s(α) = v_2(Norm α) for the unique prime (√2) over 2 */
  const f7 = (P) => { const vx = v2Q(K.norm(P.x)), vy = v2Q(K.norm(P.y)), vz = vx - vy, v2 = v2Q(K.norm(K.int(2))); return { ok: vx === -6 && vy === -9 && vz === 3 && v2 === 2 && vz > v2, vx, vy, vz, v2 }; };
  const F7 = f7(P0);
  row('F7', 'at the dyadic place (v_s(√2) = 1): v_s(x(P_0)) = −6, v_s(y(P_0)) = −9, v_s(z) = 3 > 2 = v_s(2) for z = −x/y, the condition under which the formal logarithm is an isometry', 'TeX 6335-6338', F7.ok, { vx: F7.vx, vy: F7.vy, vz: F7.vz, v2: F7.v2 });
  const F7b = f7({ x: K.parse('1641/16', '-145/2'), y: P0.y });
  control('HC2', 'x(P_0) over 16 instead of 8', 'F7 fails (v_s(x) = −8)', F7b.ok ? 'holds' : 'fails, v_s(x) = ' + F7b.vx, !F7b.ok && F7b.vx === -8);
  /* F8: the valuation bookkeeping as exact integer arithmetic, with v_p(N_s) = 1 for every p | N_s */
  const k1 = 1;
  const oddPlace = 2 * (1 + 4 * k1), dyadic = 2 * (3 + 8 * k1);
  const f8 = oddPlace === 2 + 8 * k1 && oddPlace >= 4 * k1 && dyadic === 6 + 16 * k1 && Math.floor((dyadic - 2) / 2) >= 4 * k1 && Math.ceil((dyadic - 3) / 2) >= 4 * k1 && Ps % 4n !== 0n;
  row('F8', 'N_s is squarefree (P_s is, and the catalogue primes are distinct and > 324 by their definition, read), so v_p(N_s) = 1 for every p | N_s, 2 included (P_s ≡ 2 mod 4); at an odd place v(1/x) ≥ 2(1 + 4) = 10 ≥ 4; at the dyadic place v_s(1/x) ≥ 2(3 + 8) = 22, and extraction (division by 2 and 2√2) leaves v_2(a) ≥ 10 and v_2(b) ≥ ⌈19/2⌉ = 10, both ≥ 4', 'TeX 6328-6347', f8, { oddPlaceBound: oddPlace, dyadicBound: dyadic });
  /* F9: the exponent arithmetic */
  row('F9', 'at most two places above each prime (Q(√2) has degree 2), each order < p³, so m_0 < Π_{odd p | N_s} p⁶ = (N_s/2)⁶ < N_s⁶; and M_0 ≤ N_s⁴·m_0 < N_s^(4+6) = N_s^10', 'TeX 6326-6347', placeRows.every((r) => placeRows.filter((x) => x.p === r.p).length <= 2) && 4 + 6 === 10 && 2 * 3 === 6);

  const allF = rows.every((r) => r.verdict === 'CERTIFIED');
  /* a blind spot the pre-registration named as a possible outcome (HC3) is recorded, not counted as a failed control */
  const controlsOk = controls.every((c) => c.passed || (c.blindSpot && c.foreseenByA1));
  const h2 = {
    statement: 'M_0 ≤ N_s^10',
    label: 'no label of its own: the last sentence of the proof of prop:cutoff (TeX line 6347, proof lines 6297-6349); M_0 defined at TeX lines 239-245 (source S31) and in the JSON definitions.coefficientAlgorithms.localMultiplier; lane 2 uses it once, as log2 M ≤ 10·log2 N_s for the fixedConstant M = least_formal_multiple(Ns)',
    verdict: 'REFUSED',
    reason: 'H2 is finite in principle (one fixed integer, a bounded search) but no computation decides it. The direct route needs N_s, hence the whole catalogue: 22·φ(W) primes with φ(W) a 432-bit number (lane 2, row E6), and then a search over m ≤ N_s^10. The manuscript\'s route needs the reduction order of P_0 at every place above every catalogue prime, and its step from those orders to the valuation bounds uses three theorems at all of those places at once: the reduction filtration E_0/E_1 ≅ Ẽ_ns (Silverman VII.2.1), Hasse\'s bound (V.1.1), and the formal-group facts (multiplication by p raises v(z) at an odd place; the logarithm is an isometry at the dyadic place once v_s(z) > v_s(2)). Every finite fact the proof states is decided here (F1-F9); the theorems are not.',
    restsOn: ['Silverman VII.2.1 (E_0/E_1 ≅ Ẽ_ns(k)) at every place above N_s', 'Silverman V.1.1 (Hasse) at every place above a catalogue prime (checked here at the ' + nPlaces + ' places above p ≤ 324)', 'the formal-group facts: [p] raises v(z) by at least v(p) on the formal subgroup at an odd place; at the dyadic place the logarithm is an isometry for v_s(z) > v_s(2) = 2 (Silverman IV.6.4), so v_s(z([2]Q)) = v_s(z(Q)) + 2', 'the catalogue\'s definition: distinct primes > 324 (read, JSON coefficientAlgorithms.catalogue)'],
  };
  const lane2Reading = {
    asRecorded: { record: 'certs/zq-tower.json', verdict: lane2.verdict, conditionalOn: (lane2.conclusions.find((c) => c.claim === 'deg P_* < 2↑↑7') || {}).conditionalOn },
    ifH2Discharged: 'deg P_* < 2↑↑7 and |c| < 2↑↑8 CERTIFIED conditional on H1, M and L1, and L1 is itself CERTIFIED (certs/zq-recount.json): in effect conditional on H1 (the BMOR primes-in-progressions application) and M (the B^(8h) majorant lemma).',
    asItStands: 'unchanged: CERTIFIED conditional on H1, H2, M, L1. H2 can be narrowed to H2′ = the three cited theorems at the places above N_s plus the catalogue\'s definition, with every finite fact of the manuscript\'s proof of H2 decided by this record. Lane 2\'s file is not edited here; the operator decides.',
  };
  return {
    what: 'The attempt, pre-registered as Amendment A1, to discharge lane 2\'s premise H2 (M_0 ≤ N_s^10) on the claim "Z is Diophantine in Q" (Glazer et al., announced 2026-11-05): H2 REFUSED as not a computation, and the nine finite ingredients of the manuscript\'s proof of it decided by exact arithmetic in Q(√2) and in the residue fields above every odd prime ≤ 324.',
    undecided: UNDECIDED,
    generated: new Date().toISOString().slice(0, 10),
    preregistration: 'notes/zq-preregistration-2026-11-06.md, Amendment A1 (commit 13c9e92e, before any H2 computation)',
    pins: PIN, code: { 'tools/zq-h2.js': sha(fs.readFileSync(__filename)), 'tools/zq-k0.js': sha(fs.readFileSync(path.join(__dirname, 'zq-k0.js'))) },
    lane2: { record: 'certs/zq-tower.json', verdict: lane2.verdict, contentSha256: sha(JSON.stringify(Object.assign({}, lane2, { generated: null }))), note: 'sha256 of the record with its date nulled' },
    arithmeticSelfTest: { gcd: gst, note: 'the Lehmer gcd of tools/zq-k0.js against plain Euclid' },
    h2,
    verdict: controlsOk ? h2.verdict : 'REFUSED',
    verdictScope: 'H2 itself REFUSED (as predicted in A1); its finite ingredients F1-F9 ' + (allF ? 'all CERTIFIED' : 'NOT all CERTIFIED: ' + rows.filter((r) => r.verdict !== 'CERTIFIED').map((r) => r.id).join(', ')) + (controlsOk ? '' : '; a red control did not come out as predicted'),
    ingredients: rows,
    places: placeRows,
    redControls: controls,
    lane2Reading,
  };
}

const L = build();
const strip = (x) => JSON.stringify(Object.assign({}, x, { generated: null }));
if (process.argv.includes('--check')) {
  if (!fs.existsSync(OUT)) die('no record to check');
  if (strip(JSON.parse(fs.readFileSync(OUT, 'utf8'))) !== strip(L)) die('certs/zq-h2.json is not what the pinned files and this code give now');
  console.log('zq-h2: re-derived, identical · ' + L.verdict + ' (' + L.verdictScope + ')');
} else {
  fs.writeFileSync(OUT, JSON.stringify(L, null, 1) + '\n');
  console.log('zq-h2: H2 ' + L.h2.verdict + ' · ' + L.ingredients.map((r) => r.id + ' ' + (r.verdict === 'CERTIFIED' ? 'ok' : 'FAILS')).join(' ') + ' · controls ' + L.redControls.filter((c) => c.passed).length + '/' + L.redControls.length);
}
