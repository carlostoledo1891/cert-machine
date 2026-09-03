/* ERDOS-1038 — CERTIFY natso26's dual measures λ^(ε) (chase item 1b).

   Each certificate is a PURE ATOMIC positive measure λ = Σ wᵢ δ_{sᵢ}
   (coordinates exact IEEE doubles, taken verbatim from the thread data).
   Convention (Tao's notes): U_λ(x) = Σ wᵢ log(1/|x−sᵢ|).
   CLAIM CERTIFIED HERE, per ε:  wᵢ > 0 ∀i,  and  U_λ(x) ≥ 0 for ALL
   x ∈ [−1,1]  (previously validated only by dense sampling — the thread
   was twice burned by sampling-based verifiers).
   Role: Tao's Problem 4.1 (model problem) — these λ exclude the
   two-interval scenario for {U_μ > 0} at ε = 0.002 / 0.001 / 0.0005.
   The support hull is REPORTED (it is the thread's, incl. the atom at 1
   from the ansatz pole — the reader applies the exclusion argument).

   METHOD (no quadrature anywhere; U is a finite sum of logs):
   U is CONVEX on every open gap between consecutive support points
   ((log 1/|x−s|)″ = 1/(x−s)² > 0 off the atom), and U → +∞ at any atom
   endpoint. Hence a tangent line T_p(x) = U(p) + U′(p)(x−p) at ANY
   interior point p lower-bounds U on the ENTIRE gap — including
   arbitrarily close to the atoms, where U blows up above every line.
   Per (sub)segment [u,v] of a gap: bound = max over tangents (taken at
   u, v, nudged inward when the endpoint is an atom) of the tangent's
   certified min over [u,v] (linear ⇒ min at an endpoint). Split
   adaptively at the midpoint while the bound is negative. Every
   evaluation is outward-rounded interval arithmetic (lib/eqcert).

   Usage: node cert-eps.js data/lambda-eps0.002.json [more files...] */
'use strict';

const fs = require('fs');
const path = require('path');
const I = require(path.join(__dirname, '..', 'interval', 'interval.js'));
const T = require(path.join(__dirname, '..', 'interval', 'transcendental.js'));
const { iv, add, sub, mul, div, neg } = I;

let failures = 0;
function check(name, cond, detail) {
  console.log((cond ? 'ok   ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
  if (!cond) failures++;
}

function loadAtoms(file) {
  const j = JSON.parse(fs.readFileSync(file, 'utf8'));
  let atoms, eps;
  if (j.certificate && j.certificate.atoms) {
    eps = j.meta.eps;
    atoms = j.certificate.atoms.map(a => [a.s, a.w]);
  } else if (j.lambda_sparse) {
    eps = j.eps;
    atoms = j.lambda_sparse.idx.map((ix, k) => [j.atom_pos[ix], j.lambda_sparse.w[k]]);
  } else throw new Error('unknown format');
  // merge duplicate positions (exact double equality), sort
  const m = new Map();
  for (const [s, w] of atoms) m.set(s, (m.get(s) || 0) + w);
  const out = [...m.entries()].sort((a, b) => a[0] - b[0]);
  return { eps, atoms: out };
}

/* interval U and U' at interval x (their convention), optionally skipping atom k */
function Ueval(atoms, x, skip) {
  let u = I.ZERO, up = I.ZERO;
  for (let i = 0; i < atoms.length; i++) {
    if (i === skip) continue;
    const [s, w] = atoms[i];
    const d = sub(x, iv(s));
    const ad = I.abs(d);
    if (!(ad[0] > 0)) throw new Error('Ueval: x touches atom ' + i);
    u = sub(u, mul(iv(w), T.log(ad)));          // −w log|x−s|
    up = sub(up, div(iv(w), d));                // −w/(x−s)
  }
  return { u, up };
}

/* certified min-bound of U over [u,v] ⊂ an open gap, with tangents taken
   at pu, pv (interior eval points; equal to u/v unless that endpoint is
   an atom, in which case nudged inward). A tangent at ANY interior point
   of the gap bounds U on all of [u,v] by convexity. */
function tangentMin(atoms, p, u, v) {
  const e = Ueval(atoms, iv(p));
  // line U(p) + U'(p)(x−p): certified min over x ∈ [u,v] (at an endpoint)
  const du = sub(iv(u), iv(p)), dv = sub(iv(v), iv(p));
  const Tu = add(e.u, mul(e.up, du)), Tv = add(e.u, mul(e.up, dv));
  return Math.min(Tu[0], Tv[0]);
}
function gapBound(atoms, u, v, pu, pv, depth) {
  const bound = Math.max(tangentMin(atoms, pu, u, v), tangentMin(atoms, pv, u, v));
  if (bound >= 0 || depth >= 46) return { bound, worstAt: (u + v) / 2 };
  const mid = (u + v) / 2;
  if (mid === u || mid === v) return { bound, worstAt: mid };
  const L = gapBound(atoms, u, mid, pu, mid, depth + 1);
  const R = gapBound(atoms, mid, v, mid, pv, depth + 1);
  return L.bound < R.bound ? L : R;
}

const files = process.argv.slice(2).length ? process.argv.slice(2) : [
  path.join(__dirname, '..','..','corpus','lemniscate', 'lambda-eps0.002.json'),
  path.join(__dirname, '..','..','corpus','lemniscate', 'lambda-eps0.001.json'),
  path.join(__dirname, '..','..','corpus','lemniscate', 'lambda-eps0.0005.json'),
];
const results = [];
for (const file of files) {
  const { eps, atoms } = loadAtoms(file);
  console.log(`\n=== ${path.basename(file)} (ε = ${eps}, ${atoms.length} atoms) ===`);
  check('all weights > 0', atoms.every(([, w]) => w > 0),
    `min w = ${Math.min(...atoms.map(a => a[1])).toExponential(2)}`);
  const S = atoms.map(a => a[0]);
  console.log(`support hull: [${Math.min(...S)}, ${Math.max(...S)}]; atoms in (0.026..., 0.79): ${S.filter(s => s > 0.027 && s < 0.79).length}`);

  // gaps of [−1,1]: consecutive support points clipped to [−1,1]; atoms
  // AT a segment end get their tangent point nudged inward (the tangent
  // still bounds U up to the atom itself, where U = +∞)
  let worst = Infinity, worstAt = null, gapsOK = true;
  const inner = S.filter(s => s > -1 && s < 1);
  const pts = [-1, ...inner, 1];
  const isAtom = x => S.includes(x);
  for (let i = 0; i + 1 < pts.length; i++) {
    const u = pts[i], v = pts[i + 1];
    if (!(v > u)) continue;
    const nud = (v - u) * 1e-6;
    const pu = isAtom(u) ? u + nud : u;
    const pv = isAtom(v) ? v - nud : v;
    const r = gapBound(atoms, u, v, pu, pv, 0);
    if (r.bound < worst) { worst = r.bound; worstAt = r.worstAt; }
    if (!(r.bound >= 0)) { gapsOK = false; console.log(`  gap FAIL on [${u.toFixed(6)}, ${v.toFixed(6)}]: bound ${r.bound.toExponential(2)} near ${r.worstAt.toFixed(8)}`); }
  }
  check('U ≥ 0 on all of [−1,1] (per-gap convex tangent envelopes)', gapsOK,
    `certified min over atom-free x ≥ ${worst.toExponential(4)} (near x = ${worstAt && worstAt.toFixed(6)}); U = +∞ at atoms`);
  results.push({ file: path.basename(file), eps, nAtoms: atoms.length, weightsPositive: true, certifiedMin: worst, worstAt });
}

console.log(failures ? `\nFAILURES: ${failures}` : '\nALL PASS — U_λ ≥ 0 on [−1,1] CERTIFIED for every file');
if (!failures) fs.writeFileSync(path.join(__dirname, 'cert-eps.json'), JSON.stringify({
  statement: 'each atomic measure (exact double coordinates from the thread data) is positive and has U(x) = sum w log(1/|x-s|) >= certifiedMin >= 0 on all of [-1,1]',
  results, builtAt: new Date().toISOString(),
}, null, 1));
process.exit(failures ? 1 : 0);
