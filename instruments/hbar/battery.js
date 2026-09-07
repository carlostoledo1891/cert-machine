#!/usr/bin/env node
/* battery.js — the gate on instruments/hbar: the record, the enclosures against closed forms and a
   geometrically convergent float rule, the band's structure, the paper's numbers, five red controls.
   usage: node instruments/hbar/battery.js */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const E = require(path.join(__dirname, 'exact.js'));
const DV = require(path.join(__dirname, 'derive.js'));
const I = require(path.join(__dirname, '..', 'interval', 'interval.js'));
const { iv } = I;

let checks = 0, fails = 0;
function check(name, cond, detail) {
  checks++;
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + name + (detail !== undefined ? '   [' + detail + ']' : ''));
  if (!cond) fails++;
}
const REC = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'hbar-band.json'), 'utf8'));
const t0 = Date.now();
const R = DV.derive();
const ms = Date.now() - t0;

check('R1  the record re-derived live equals the record (' + (ms / 1000).toFixed(1) + ' s)', JSON.stringify([R.p0, R.band, R.table1, R.table2, R.mather, R.counts]) === JSON.stringify([REC.p0, REC.band, REC.table1, REC.table2, REC.mather, REC.counts]));
check('R2  the code that produced the record is the code on disk', DV.sha(path.join(__dirname, 'exact.js')) === REC.provenance.sha256 && DV.sha(path.join(__dirname, 'derive.js')) === REC.provenance.deriveSha256);

/* ---- the enclosures against closed forms and floats ---- */
check('E1  P₀ = ∫√(2(1 − V)) encloses 4/π for all three potentials (2(1 − sin 2πx) = 4 sin²(πx − π/4), so the closed form is exact) to 1e−5', Object.values(R.p0).every(p => p.contains4overPi && p.width < 1e-5), Object.values(R.p0).map(p => p.width.toExponential(1)).join(' '));
/* the trapezoid rule on a periodic analytic integrand converges geometrically: a float reference to ~1e−12 away from the degeneracy */
const trap = (f, n) => { let s = 0; for (let i = 0; i < n; i++) s += f(i / n); return s / n; };
const Qf = (c, V, n) => trap(x => Math.sqrt(2 * (c - V(x))), n);
const cF = (P, V) => { let lo = 1, hi = P * P / 2 + 2; for (let i = 0; i < 100; i++) { const m = 0.5 * (lo + hi); if (Qf(m, V, 20000) < P) lo = m; else hi = m; } return 0.5 * (lo + hi); };
const sinV = x => Math.sin(2 * Math.PI * x), cosV = x => Math.cos(2 * Math.PI * x);
check('E2  every ROTATING bracket contains the float value from a 20 000-point trapezoid rule (geometric convergence), and Q is enclosed around a float Q at c = 1.5', R.band.filter(b => b.regime === 'ROTATING').every(b => { const c = cF(b.P, sinV); return c >= b.value[0] && c <= b.value[1]; }) && (() => { const q = E.Q(iv(1.5), E.POTS.sin, 1024); return q.ok && I.contains(q.value, Qf(1.5, sinV, 20000)); })());
check('E3  Q(c) is enclosed strictly increasing: Q(1.2) < Q(1.21) < Q(1.5) as disjoint ordered intervals', (() => { const a = E.Q(iv(1.2), E.POTS.sin, 1024), b = E.Q(iv(1.21), E.POTS.sin, 1024), c = E.Q(iv(1.5), E.POTS.sin, 1024); return a.value[1] < b.value[0] && b.value[1] < c.value[0]; })());
check('E4  the Mather density at P = 1.5 and P = 2 integrates to 1 within 1e−5 (Simpson on the enclosure midpoints) and its period T(c) encloses the float period', R.mather.every(m => { if (m.refused) return false; const n = m.xs.length - 1; let s = 0; for (let j = 0; j <= n; j++) { const w = (j === 0 || j === n) ? 1 : (j % 2 ? 4 : 2); s += w * 0.5 * (m.density[j][0] + m.density[j][1]); } s /= 3 * n; const b = R.band.find(b => b.P === m.P); const Tf = trap(x => 1 / Math.sqrt(2 * (0.5 * (b.value[0] + b.value[1]) - sinV(x))), 20000); return Math.abs(s - 1) < 1e-5 && Tf >= m.T[0] - 1e-9 && Tf <= m.T[1] + 1e-9; }), R.mather.map(m => m.refused ? 'refused' : 'T ∈ [' + m.T.map(v => v.toFixed(7)) + ']').join(' · '));

/* ---- the band ---- */
check('B1  the band is FLAT up to P₀\'s lower end, UNDECIDED at P = 4/π, ROTATING beyond P₀\'s upper end; no REFUSED point', R.band.every(b => (Math.abs(b.P) <= R.p0.sin.value[0]) === (b.regime === 'FLAT') && (Math.abs(b.P) >= R.p0.sin.value[1]) === (b.regime === 'ROTATING') && b.regime !== 'REFUSED') && R.counts.undecided === 1, JSON.stringify(R.counts));
check('B2  every FLAT value is exactly 1 (max V) and every ROTATING lower end exceeds 1: H̄ is continuous and non-decreasing across the sampled P as intervals', R.band.filter(b => b.regime === 'FLAT').every(b => b.value[0] === 1 && b.value[1] === 1) && (() => { const r = R.band.filter(b => b.regime !== 'UNDECIDED'); return r.every((b, i) => i === 0 || b.value[1] >= r[i - 1].value[0]) && r.filter(b => b.regime === 'ROTATING').every(b => b.value[0] > 1); })());
check('B3  H̄ is convex on the sampled P as intervals: for every interior triple the midpoint\'s lower end is at most the neighbours\' average upper end', (() => { const r = R.band.filter(b => b.regime !== 'UNDECIDED' && b.P >= 0); return r.every((b, i) => i === 0 || i === r.length - 1 || b.value[0] <= (r[i - 1].value[1] * (r[i + 1].P - b.P) + r[i + 1].value[1] * (b.P - r[i - 1].P)) / (r[i + 1].P - r[i - 1].P) + 1e-12); })());
check('B4  every ROTATING bracket is below 1e−5 after the mean-value tightening, and every one was tightened (bisection alone stalls at the quadrature\'s width)', R.band.filter(b => b.regime === 'ROTATING').every(b => b.width < 1e-5 && b.tightened), 'widest ' + R.widest.width.toExponential(1) + ' at P = ' + R.widest.P);

/* ---- the paper's numbers ---- */
check('T1  Table 1: the Gomes–Oberman value 4.4099660 the paper quotes lies ABOVE the enclosure of H̄(1.5, 2.5) (its seventh digit is not the value\'s), and every Newton value of the paper lies BELOW it, as the entropy-penalized H̄^k must', R.table1.citedPlace === 'ABOVE' && R.table1.NM.every(x => x.place === 'BELOW') && R.table1.HRF.every(x => x.place === 'BELOW'), 'enclosure [' + R.table1.sum.map(v => v.toFixed(9)) + '], gap ' + R.table1.citedGap.toExponential(1));
check('T2  Table 1: the enclosure is narrower than 1e−6 and the paper\'s k = 10⁴ value agrees with it to the five printed digits', R.table1.width < 1e-6 && Math.abs(R.table1.NM[3].v - R.table1.sum[0]) < 1e-5, R.table1.width.toExponential(1));
check('T3  Table 2: P = 0.5 on −sin 2πx is FLAT, H̄ = 1 exactly, and every printed H̄◇ at k = 100 sits 0.035–0.036 below it', R.table2.regime === 'FLAT' && R.table2.Hdiamond.every(x => x.gap > 0.035 && x.gap < 0.036), R.table2.Hdiamond.map(x => x.gap.toFixed(6)).join(' '));

/* ---- red controls ---- */
check('X1  RED ok: Q at c = 0.999 (below max V) is refused by name', !E.Q(iv(0.999), E.POTS.sin, 256).ok);
check('X2  RED ok: H̄ at P = 4/π is UNDECIDED (inside the P₀ enclosure), not silently assigned a side', E.hbar(4 / Math.PI, E.POTS.sin, { K: 256 }).regime === 'UNDECIDED');
{ const shift = R.table1.citedGap + R.table1.width / 2;
  check('X3  RED ok: the cited value moved down by ' + shift.toExponential(2) + ' (its gap plus half the enclosure, below 1e−6) falls INSIDE the enclosure — the verdict lives in the seventh digit', shift < 1e-6 && DV.place(R.printed.table1.cited - shift, R.table1.sum) === 'INSIDE'); }
check('X4  RED ok: a Mather density normalised by the wrong period (T doubled) integrates to ½, not 1', (() => { const m = R.mather[0]; const n = m.xs.length - 1; let s = 0; for (let j = 0; j <= n; j++) { const w = (j === 0 || j === n) ? 1 : (j % 2 ? 4 : 2); s += w * 0.5 * (m.density[j][0] + m.density[j][1]) / 2; } s /= 3 * n; return Math.abs(s - 0.5) < 1e-5; })());
check('X5  RED ok: the bisection at K = 64 cells stalls with a bracket wider than at K = 1024 — the band\'s width is the quadrature\'s, and says so', (() => { const a = E.cOf(1.3, E.POTS.sin, { K: 64 }), b = E.cOf(1.3, E.POTS.sin, { K: 1024 }); return a.ok && b.ok && a.width > b.width; })());

console.log(fails === 0 ? 'ALL PASS   (' + checks + ' checks, 5 red controls)' : fails + ' FAILED of ' + checks);
process.exit(fails === 0 ? 0 : 1);
