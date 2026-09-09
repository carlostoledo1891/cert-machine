#!/usr/bin/env node
/* scene.js — playground/navier-stokes/out/scene.json, the record the instrument reads.
   node playground/navier-stokes/scene.js

   The page draws a CONSTRUCTION, not a fluid. Everything it states about that
   construction is either
     · DECIDED   — an exact rational inequality in h, re-decided in the reader's tab
                   in integer arithmetic (no floats anywhere near the verdict), or
     · COMPUTED  — a quadrature or an ODE integration, with its residual on the page, or
     · DRAWN     — a shape chosen to be legible, obeying the paper's scalings and
                   incompressibility exactly, and claiming nothing else.
   This file fixes the first kind and carries the provenance for the rest. It reads the
   audit's own records so the instrument and the report cannot drift apart.

   THE EXPONENTS, from the paper's §2–3 with τ = 1 − t, A = 1/2 + h, D = 1/2 − h. Each is
   stored as a rational a + b·h with integer numerators over a common denominator, so the
   browser can decide every inequality below with BigInt and never with a float. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const HERE = __dirname;
const ROOT = path.join(HERE, '..', '..');
const C = path.join(ROOT, 'corpus', 'navier-stokes');
const J = (f) => JSON.parse(fs.readFileSync(path.join(C, f), 'utf8'));

/* a rational exponent  (n0 + n1·h)/d  — the pair the browser gets */
const E = (n0, n1, d) => ({ n0, n1, d });

/* ---- the scaling table: every exponent of τ the construction fixes -------- */
const EXPONENTS = [
  { id: 'lr',   sym: 'ℓr',            what: 'radial extent of the core',          e: E(1, 0, 2),   note: 'the parabolic scale; the one exponent h does not touch' },
  { id: 'lz',   sym: 'ℓz',            what: 'axial extent of the core',           e: E(1, -2, 2),  note: 'τ^{1/2−h}: longer than it is wide, and the ratio diverges' },
  { id: 'ratio',sym: 'ℓz/ℓr',         what: 'the core’s aspect ratio',            e: E(0, -2, 2),  note: 'τ^{−h} → ∞ — the spaghetti' },
  { id: 'uth',  sym: '|uθ|, |uz|',    what: 'the tangential speeds',              e: E(-1, -2, 2), note: 'τ^{−1/2−h} = τ^{−A}' },
  { id: 'ur',   sym: '|ur|',          what: 'the radial speed',                   e: E(-1, 0, 2),  note: 'O(τ^{−1/2}) — smaller than the tangential ones by τ^h' },
  { id: 'p',    sym: 'p',             what: 'the pressure',                       e: E(-2, -4, 2), note: 'τ^{−2A}' },
  { id: 'vort', sym: '|ω|',           what: 'the vorticity',                      e: E(-2, -2, 2), note: 'speed over the radial scale' },
  { id: 'vol',  sym: 'ℓr²ℓz',         what: 'the volume of the core',             e: E(3, -2, 2),  note: 'it vanishes' },
  { id: 'en',   sym: '∫|u|²',         what: 'the kinetic energy in the core',     e: E(1, -6, 2),  note: 'τ^{1/2−3h} → 0: the energy leaves the core as it forms' },
  { id: 'diss', sym: '∫|∇u|²',        what: 'the dissipation rate',               e: E(-1, -6, 2), note: 'τ^{−1/2−3h}: a rate, integrable only while 3h < 1/2' },
  { id: 'gam',  sym: 'Γ = r·uθ',      what: 'the swirl',                          e: E(0, -2, 2),  note: 'τ^{−h} — the quantity the maximum principle bounds' },
  { id: 'l3',   sym: '‖u‖_{L³}',      what: 'the critical norm',                  e: E(0, -8, 6),  note: 'τ^{−4h/3}: it diverges, but only just' },
  { id: 'gradu2', sym: '‖∇u‖₂',       what: 'the enstrophy norm',                 e: E(-1, -6, 4), note: 'the square root of the dissipation rate' },
];

/* ---- the criteria: each one an exact inequality in h ---------------------- */
/* `rule` is read by the browser: {kind, lhs, cmp, rhs} with lhs/rhs rationals in h.
   Nothing here is evaluated in floating point, in this file or in the tab. */
const CRITERIA = [
  { id: 'serrin', name: 'Serrin–Prodi–Ladyzhenskaya', needs: 'a singularity requires ∫₀ᵀ‖u‖_∞² dt = ∞',
    here: '‖u‖_∞² ≍ τ^{−1−2h}, so the integral diverges iff the exponent is ≤ −1',
    rule: { lhs: E(-2, -4, 2), cmp: '<=', rhs: E(-1, 0, 1) }, met: 'MET', fails: 'VIOLATED' },
  { id: 'bkm', name: 'Beale–Kato–Majda', needs: '∫₀ᵀ‖ω‖_∞ dt = ∞',
    here: '‖ω‖_∞ ≍ τ^{−1−h}',
    rule: { lhs: E(-2, -2, 2), cmp: '<=', rhs: E(-1, 0, 1) }, met: 'MET', fails: 'VIOLATED' },
  { id: 'ess', name: 'Escauriaza–Seregin–Šverák', needs: '‖u(t)‖_{L³} → ∞',
    here: '‖u‖_{L³} ≍ τ^{−4h/3}, which diverges iff h > 0',
    rule: { lhs: E(0, -8, 6), cmp: '<', rhs: E(0, 0, 1) }, met: 'MET', fails: 'VIOLATED' },
  { id: 'leray-u', name: 'Leray’s lower bound on the speed', needs: '‖u‖_∞ ≥ c(T−t)^{−1/2}',
    here: 'τ^{−1/2−h}',
    rule: { lhs: E(-1, -2, 2), cmp: '<=', rhs: E(-1, 0, 2) }, met: 'MET', fails: 'VIOLATED' },
  { id: 'leray-g', name: 'Leray’s lower bound on the gradient', needs: '‖∇u‖₂ ≥ c(T−t)^{−1/4}',
    here: 'τ^{−1/4−3h/2}',
    rule: { lhs: E(-1, -6, 4), cmp: '<=', rhs: E(-1, 0, 4) }, met: 'MET', fails: 'VIOLATED' },
  { id: 'energy', name: 'finite energy', needs: 'a Leray solution has sup‖u‖₂ < ∞',
    here: 'the core’s energy is τ^{1/2−3h}, which tends to zero iff h < 1/6',
    rule: { lhs: E(1, -6, 2), cmp: '>', rhs: E(0, 0, 1) }, met: 'MET', fails: 'VIOLATED' },
  { id: 'diss', name: 'finite dissipation', needs: '∫₀ᵀ‖∇u‖₂² dt < ∞',
    here: 'the rate is τ^{−1/2−3h}; the integral converges iff the exponent exceeds −1, i.e. h < 1/6',
    rule: { lhs: E(-1, -6, 2), cmp: '>', rhs: E(-1, 0, 1) }, met: 'MET', fails: 'VIOLATED' },
  { id: 'typeI', name: 'type-I exclusion, axisymmetric (Koch–Nadirashvili–Seregin–Šverák; Chen–Strain–Yau–Tsai)',
    needs: 'an axisymmetric solution with |u| ≤ C(T−t)^{−1/2} does not blow up',
    here: '|u| ≍ τ^{−1/2−h}: type I exactly when h = 0',
    rule: { lhs: E(-1, -2, 2), cmp: '<', rhs: E(-1, 0, 2) }, met: 'EVADED (type II)', fails: 'EXCLUDED (type I)' },
  { id: 'swirl', name: 'the swirl maximum principle, axisymmetric',
    needs: 'Γ = r·uθ obeys ∂ₜΓ + u_r∂_rΓ + u_z∂_zΓ = Γ_rr − Γ_r/r + Γ_zz + r·f_θ — no zeroth-order term — so from rest with a bounded compactly supported force, sup|Γ| ≤ ∫₀ᵗ sup|r f_θ| for every t',
    here: 'the leading field has Γ ≍ τ^{−h}, which is bounded iff h ≤ 0',
    rule: { lhs: E(0, -2, 2), cmp: '>=', rhs: E(0, 0, 1) }, met: 'CONSISTENT', fails: 'IMPOSSIBLE if axisymmetric' },
];

/* ---- the dichotomy this instrument exists to draw ------------------------ */
const DICHOTOMY = {
  claim: 'For this scaling family there is NO h at which an axisymmetric forced blowup from rest can work.',
  atZero: 'At h = 0 the swirl is bounded and the flow is consistent with the maximum principle — and it is exactly type I, which the axisymmetric Liouville theorems exclude.',
  above: 'At h > 0 the flow is type II and escapes those theorems — and the swirl Γ ≍ τ^{−h} diverges, which the maximum principle forbids for an axisymmetric flow driven from rest by a bounded force.',
  so: 'The two constraints close on h = 0 from opposite sides. The construction survives only by leaving the axisymmetric class: its pulses carry nonzero integer angular frequencies (p. 12), and their Reynolds flux is what breaks the maximum principle for the angular mean of Γ. The paper never says this. The Lean proves the angular mode is nonzero (angularMode_ne_zero, ActualInitialization.lean:52).',
  hypotheses: 'The maximum-principle half needs r·f_θ bounded (it is: f ∈ C_c^∞) and the flow axisymmetric. The type-I half is the hypothesis of the cited Liouville theorems, which are stated for axisymmetric solutions. Neither half is a theorem proved here; both are classical results applied to the exponents the paper states.',
};

/* ---- what backs each panel ---------------------------------------------- */
const BACKING = {
  criteria: { kind: 'DECIDED', how: 'every row is a rational inequality in h with integer numerators; the tab decides it with BigInt, and the boundary cases (h = 0, h = 1/6) are decided as equalities rather than approached' },
  core: { kind: 'DRAWN', how: 'the exponents and incompressibility are the paper’s and are exact; the radial profile shapes are chosen to be legible and claim nothing. No fluid is integrated anywhere on this page' },
  exterior: { kind: 'COMPUTED', how: 'H(Z) = Γ(1+h)⁻¹∫₀^∞ e^{−v} v^h (1+Zv)^{−h} dv by Simpson in the tab; the residual of its differential equation (A.37) is printed beside it, and the battery checks the same integral to 25 digits' },
  pulse: { kind: 'COMPUTED', how: 'the WKB amplitude equation integrated by fourth-order Runge–Kutta in the tab: the wavevector is carried by the background shear, the amplitude grows on the shear and is damped by ν|ξ|², and the shortening radial wavelength is what ends the growth' },
  profile: { kind: 'COMPUTED', how: 'the axis initial-value problem (4.13)+(4.7) of Appendix B, solved by instruments/navierstokes/probes/axis_profile.py at representative data and read from its record' },
};

/* ---- provenance: read, never retyped ------------------------------------ */
const M = J('MANIFEST.json');
const P = J('probes.json');
const B = (() => { try { return J('build.json'); } catch (e) { return null; } })();
const AX = J('axis-profile.json');
const paper = M.files.find((f) => f.path === 'papers/openai-navier-stokes.pdf');
const thin = (a, n) => { const out = []; const step = Math.max(1, Math.floor(a.length / n)); for (let i = 0; i < a.length; i += step) out.push(Number(a[i].toFixed ? a[i].toFixed(6) : a[i])); return out; };

const scene = {
  what: 'The record behind /instruments/navier-stokes: the exponents of OpenAI’s blowup construction as exact rationals in h, the classical criteria as exact inequalities, the dichotomy that forces the construction out of the axisymmetric class, and the curves the page draws.',
  generatedBy: 'node playground/navier-stokes/scene.js',
  paper: { title: 'Finite time blowup for Navier–Stokes', author: 'OpenAI', date: '2026-09-08', pages: 166, sha256: paper.sha256 },
  report: '/reports/navier-stokes.html',
  exponents: EXPONENTS, criteria: CRITERIA, dichotomy: DICHOTOMY, backing: BACKING,
  hPaper: { n: 1, d: 100, note: 'the paper prints 0 < h < 1/100; the operative bound is nowhere numeric, in the paper or in the Lean (h is Classical.choice there, constrained by 2h < lam < 1/10 and h ≤ 1/1000)' },
  hWindow: { loExclusive: { n: 0, d: 1 }, hiExclusive: { n: 1, d: 6 }, why: 'below and at 0 the axisymmetric type-I theorems exclude it; at and above 1/6 the dissipation stops being integrable and it is no longer a Leray solution' },
  axisProfile: { Y: thin(AX.Y, 120), Phi: thin(AX.Phi_eta0, 120), f0: thin(AX.f0_eta0, 120), data: AX.data },
  probes: { verdict: P.verdict, scripts: P.checks.length, reds: P.checks.reduce((n, c) => n + (c.redsFired || 0), 0) },
  build: B ? { verdict: B.verdict, modules: B.jobsBuilt, minutes: Math.round(B.buildSeconds / 60), axioms: B.standardAxioms, comparator: B.comparator && B.comparator.ran ? B.comparator.exits.length : 0 } : null,
  recorded: new Date().toISOString().slice(0, 10),
};

fs.mkdirSync(path.join(HERE, 'out'), { recursive: true });
const out = path.join(HERE, 'out', 'scene.json');
const txt = JSON.stringify(scene, null, 1) + '\n';
const prev = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '';
const same = prev && JSON.parse(prev).recorded && JSON.stringify({ ...JSON.parse(prev), recorded: 0 }) === JSON.stringify({ ...scene, recorded: 0 });
if (!same) fs.writeFileSync(out, txt);
console.log('scene.json: ' + EXPONENTS.length + ' exponents, ' + CRITERIA.length + ' criteria, '
  + scene.axisProfile.Y.length + ' profile samples, paper ' + paper.sha256.slice(0, 8) + (same ? ' (unchanged)' : ''));
module.exports = { scene };
