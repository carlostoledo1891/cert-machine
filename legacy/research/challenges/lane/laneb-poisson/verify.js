#!/usr/bin/env node
// Independent re-verification (Lane B) of the rank-two Poisson counterexample
// claim in octonion/mathematics/poisson (commit 85cd90f).
// Own implementation: sparse multivariate polynomials over Q in (x,q,p,z),
// exact BigInt rational coefficients. NOT derived from the author's Python.
//
// Manuscript convention (eq:canonical-bracket-n, vars x,q,p,z; pairs (x,p),(q,z)):
//   {f,g} = f_p g_x - f_x g_p + f_z g_q - f_q g_z   (so {p,x}=1, {z,q}=1)
// Claims checked:
//   {D,R}=1, {S,T}=1, {R,S}={R,T}={D,S}={D,T}=0, det J(R,T,D,S)=1,
//   fiber over (0,1/8,0,0) contains the three claimed points exactly.
"use strict";

// ---------- exact rationals ----------
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { [a, b] = [b, a % b]; } return a; };
function frac(n, d = 1n) {
  n = BigInt(n); d = BigInt(d);
  if (d === 0n) throw new Error("div0");
  if (d < 0n) { n = -n; d = -d; }
  const g = gcd(n, d) || 1n;
  return [n / g, d / g];
}
const fadd = (a, b) => frac(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
const fmul = (a, b) => frac(a[0] * b[0], a[1] * b[1]);
const fneg = a => [-a[0], a[1]];
const fzero = a => a[0] === 0n;
const feq = (a, b) => a[0] === b[0] && a[1] === b[1];

// ---------- sparse polynomials: Map key "e0,e1,e2,e3" -> frac ----------
const P = terms => terms; // Map
function pnew() { return new Map(); }
function pset(m, key, c) { if (fzero(c)) m.delete(key); else m.set(key, c); }
function paddInto(m, key, c) { const cur = m.get(key); pset(m, key, cur ? fadd(cur, c) : c); }
function pconst(n, d = 1n) { const m = pnew(); paddInto(m, "0,0,0,0", frac(n, d)); return m; }
function pvar(i) { const e = [0, 0, 0, 0]; e[i] = 1; const m = pnew(); m.set(e.join(","), frac(1n)); return m; }
function padd(a, b) { const m = new Map(a); for (const [k, c] of b) paddInto(m, k, c); return m; }
function pneg(a) { const m = pnew(); for (const [k, c] of a) m.set(k, fneg(c)); return m; }
function psub(a, b) { return padd(a, pneg(b)); }
function pmul(a, b) {
  const m = pnew();
  for (const [ka, ca] of a) { const ea = ka.split(",").map(Number);
    for (const [kb, cb] of b) { const eb = kb.split(",").map(Number);
      paddInto(m, ea.map((e, i) => e + eb[i]).join(","), fmul(ca, cb)); } }
  return m;
}
function pscale(a, n, d = 1n) { const s = frac(n, d); const m = pnew(); for (const [k, c] of a) pset(m, k, fmul(c, s)); return m; }
function ppow(a, n) { let r = pconst(1n); for (let i = 0; i < n; i++) r = pmul(r, a); return r; }
function pdiff(a, i) {
  const m = pnew();
  for (const [k, c] of a) { const e = k.split(",").map(Number);
    if (e[i] > 0) { const cc = fmul(c, frac(BigInt(e[i]))); e[i] -= 1; paddInto(m, e.join(","), cc); } }
  return m;
}
function pIsConst(a, n, d = 1n) {
  const t = frac(n, d);
  if (fzero(t)) return a.size === 0;
  return a.size === 1 && a.has("0,0,0,0") && feq(a.get("0,0,0,0"), t);
}
function peval(a, pt) { // pt: array of fracs
  let tot = frac(0n);
  for (const [k, c] of a) {
    const e = k.split(",").map(Number);
    let t = c;
    for (let i = 0; i < 4; i++) for (let j = 0; j < e[i]; j++) t = fmul(t, pt[i]);
    tot = fadd(tot, t);
  }
  return tot;
}

// ---------- bracket (manuscript convention) & determinant ----------
// vars: 0=x, 1=q, 2=p, 3=z ; pairs (x,p) and (q,z)
function bracket(f, g, sign = 1n) {
  let r = psub(pmul(pdiff(f, 2), pdiff(g, 0)), pmul(pdiff(f, 0), pdiff(g, 2)));
  r = padd(r, psub(pmul(pdiff(f, 3), pdiff(g, 1)), pmul(pdiff(f, 1), pdiff(g, 3))));
  return sign === 1n ? r : pneg(r);
}
function det4(M) { // Laplace expansion along first row
  function det(rows, cols) {
    if (cols.length === 1) return M[rows[0]][cols[0]];
    let r = pnew(); const row = rows[0];
    cols.forEach((c, j) => {
      const sub = det(rows.slice(1), cols.filter(x => x !== c));
      const t = pmul(M[row][c], sub);
      r = (j % 2 === 0) ? padd(r, t) : psub(r, t);
    });
    return r;
  }
  return det([0, 1, 2, 3], [0, 1, 2, 3]);
}

// ---------- build the polynomials exactly as in the TeX (eqs a-B-beta .. D-def) ----------
function build({ perturbR = false } = {}) {
  const x = pvar(0), q = pvar(1), p = pvar(2), z = pvar(3);
  const a = psub(pconst(1n), pscale(pmul(x, q), 3n));            // a = 1 - 3xq
  const B = padd(pscale(pmul(ppow(x, 2), p), 3n), pscale(pmul(a, z), 2n)); // B = 3x^2 p + 2az
  const beta = psub(B, pscale(ppow(q, 2), 9n));                  // beta = B - 9q^2
  const y = psub(q, pscale(pmul(x, beta), 1n, 3n));              // y = q - x beta/3
  const u = pmul(x, y);
  const one = pconst(1n);
  const R0 = psub(psub(pscale(x, 2n), pscale(pmul(ppow(x, 2), y), 3n)), pmul(ppow(x, 3), beta));
  const R = perturbR ? padd(R0, pconst(1n, 7n)) : R0;            // mutation hook
  const S = padd(padd(y, pscale(pmul(pmul(x, ppow(padd(one, u), 2)), beta), 3n)),
                 pscale(pmul(pmul(x, ppow(y, 2)), padd(pconst(4n), pscale(u, 3n))), 3n));
  const T = pscale(padd(pmul(ppow(padd(one, u), 3), beta),
                        pmul(pmul(ppow(y, 2), padd(one, u)), padd(pconst(4n), pscale(u, 3n)))), -1n, 2n);
  const D0 = psub(pscale(pmul(padd(one, pscale(pmul(x, q), 3n)), p), 1n, 2n),
                  pscale(pmul(ppow(q, 2), z), 3n));              // (1+3xq)p/2 - 3q^2 z
  const H = padd(padd(
      pscale(pmul(ppow(y, 4), padd(padd(pscale(ppow(u, 2), 18n), pscale(u, 78n)), pconst(125n))), 1n, 20n),
      pscale(pmul(pmul(beta, ppow(y, 2)),
        padd(padd(padd(ppow(u, 3), pscale(ppow(u, 2), 5n)), pscale(u, 10n)), pconst(-5n))), 3n, 10n)),
    padd(pscale(pmul(ppow(beta, 2), padd(pscale(u, 9n), pconst(2n))), -1n, 6n),
         pscale(pmul(ppow(x, 2), ppow(beta, 3)), -1n, 6n)));
  const D = padd(D0, H);
  return { R, S, T, D };
}

// ---------- run checks ----------
function runChecks({ perturbR = false, bracketSign = 1n } = {}) {
  const { R, S, T, D } = build({ perturbR });
  const failures = [];
  const chk = (poly, n, d, label) => { if (!pIsConst(poly, n, d)) failures.push(`${label} (residual: ${poly.size} terms)`); };
  const br = (f, g) => bracket(f, g, bracketSign);
  chk(br(D, R), 1n, 1n, "{D,R}=1");
  chk(br(S, T), 1n, 1n, "{S,T}=1");
  chk(br(R, S), 0n, 1n, "{R,S}=0");
  chk(br(R, T), 0n, 1n, "{R,T}=0");
  chk(br(D, S), 0n, 1n, "{D,S}=0");
  chk(br(D, T), 0n, 1n, "{D,T}=0");
  const J = [R, T, D, S].map(f => [0, 1, 2, 3].map(j => pdiff(f, j)));
  chk(det4(J), 1n, 1n, "det J(R,T,D,S)=1");
  // fiber: three claimed points map to (0,1/8,0,0) under (R,T,D,S)
  const pts = [
    [frac(0n), frac(0n), frac(1n, 24n), frac(-1n, 8n)],
    [frac(1n), frac(2n, 3n), frac(247n, 96n), frac(-89n, 64n)],
    [frac(-1n), frac(-2n, 3n), frac(247n, 96n), frac(-89n, 64n)],
  ];
  const target = [frac(0n), frac(1n, 8n), frac(0n), frac(0n)];
  pts.forEach((pt, i) => {
    const img = [R, T, D, S].map(f => peval(f, pt));
    if (!img.every((v, j) => feq(v, target[j])))
      failures.push(`point ${i + 1} image = ${img.map(v => v[0] + "/" + v[1]).join(", ")}`);
  });
  return failures;
}

const t0 = Date.now();
const main = runChecks();
if (main.length) { console.log("REFUTED:"); main.forEach(f => console.log("  FAIL " + f)); process.exit(1); }
console.log("All claimed identities hold exactly (bracket relations, det J = 1, three-point fiber).");

// mutation controls: checker must reject
const mut1 = runChecks({ perturbR: true });
if (mut1.length === 0) { console.log("MUTATION CONTROL 1 FAILED TO REJECT (R+1/7)"); process.exit(1); }
console.log(`Mutation control 1 (R -> R + 1/7): rejected, ${mut1.length} failing checks. OK`);
const mut2 = runChecks({ bracketSign: -1n });
if (mut2.length === 0) { console.log("MUTATION CONTROL 2 FAILED TO REJECT (bracket sign swap)"); process.exit(1); }
console.log(`Mutation control 2 (bracket sign swapped): rejected, ${mut2.length} failing checks. OK`);
console.log(`Elapsed: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
console.log("VERDICT: CONFIRMED");
