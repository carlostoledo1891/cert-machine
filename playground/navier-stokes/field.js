/* field.js — the drawn core of /instruments/navier-stokes, as one module for the tab and the build.
   playground/navier-stokes/ · cert-machine · 2026-10-28

   Inlined before app.js by build.js (it sets window.NSFIELD) and required by build.js in node, which checks the
   identity below before it writes the page — so the sentence "the drawn flow is divergence-free" is a gate, not a
   comment.

   WARRANT v2 (2026-10-28): THE PICK WAS NOT A MEMBER. The page draws one core out of the many with the paper's
   scalings — profile shapes picked to be legible, so the drawing is CHOSEN — and said the pick obeyed "the paper's
   scalings and exact incompressibility". It did neither. app.js solved continuity in the profile coordinates as if
   (√(2X), η) were (r, z), i.e. as if q = τ/(1 − η²) did not depend on z, and scaled the radial speed with the axial
   exponent τ^{−1/2−h}. Measured in physical (r, z) by central differences, |div u| came out about 1.2 times the larger
   of its two terms at every h and τ tried: not a small error, a field that is not incompressible at all. And the
   page's own exponent table gives |u_r| = O(τ^{−1/2}), smaller than u_z by τ^h.

   THE FIX IS CONTINUITY SOLVED WHERE IT HOLDS. With u_z = q^{−A} U(X, η), X = r²/(2q), η = z q^{−D}, A = ½ + h,
   D = ½ − h, and q(z, τ) the root of q − z² q^{2h} = τ (so q depends on z alone at fixed τ),
       (1/r) ∂r(r u_r) = −∂z u_z,   r dr = q dX,   q' = dq/dz = 2 q^A η / (1 − 2hη²),
   and integrating at fixed z from the axis gives, exactly,
       u_r = q^{−1/2} G(X, η),   G = [ V + 2η/(1 − 2hη²) · W ] / √(2X),
       V = −∫₀^X U_η dX',        W = ∫₀^X ( A U + X' U_X + D η U_η ) dX'.
   For the drawn U = 2.4 e^{−X} η (1 − η²) on |η| < 1 both integrals are closed forms, written out below. So the radial
   speed scales as τ^{−1/2}, as the table says; the streamlines are the same curves in (√X, η) at every τ, which is
   what lets app.js integrate them once; and the field is divergence-free as a formula, evaluated in float. */
(function (root) {
  'use strict';
  /* the two profiles the drawing CHOSE: an axial jet odd in η, and a swirl rising then falling in X */
  const U = (X, eta) => 2.4 * Math.exp(-X) * eta * Math.max(0, 1 - eta * eta);
  const E = (X, h) => Math.sqrt(2 * X) / Math.pow(1 + X, 1 + h);
  /* the radial profile, solved from continuity: closed forms of V and W for this U */
  function G(X, eta, h) {
    if (!(Math.abs(eta) < 1) || !(X > 0)) return 0;
    const A = 0.5 + h, D = 0.5 - h, e = Math.exp(-X);
    const c = 2.4 * eta * (1 - eta * eta), b = 2.4 * (1 - 3 * eta * eta);   /* U = c e^{−X},  U_η = b e^{−X} */
    const V = -b * (1 - e);
    const W = c * ((A - 1) * (1 - e) + X * e) + D * eta * b * (1 - e);
    return (V + (2 * eta / (1 - 2 * h * eta * eta)) * W) / Math.sqrt(2 * X);
  }
  /* q(z, τ): the root of q − z² q^{2h} = τ, by bisection (the build's check; the tab keeps its three Newton steps) */
  function q(z, t, h) {
    let lo = t, hi = t + z * z + 1;
    while (hi - z * z * Math.pow(hi, 2 * h) - t <= 0) hi *= 2;
    for (let k = 0; k < 200; k++) { const m = (lo + hi) / 2; if (m - z * z * Math.pow(m, 2 * h) - t > 0) hi = m; else lo = m; }
    return (lo + hi) / 2;
  }
  /* the physical meridional velocity at (r, z, τ) */
  function velocity(r, z, t, h) {
    const Q = q(z, t, h), X = r * r / (2 * Q), eta = z / Math.pow(Q, 0.5 - h);
    return { ur: Math.pow(Q, -0.5) * G(X, eta, h), uz: Math.pow(Q, -0.5 - h) * U(X, eta) };
  }
  /* |div u| over the larger of its two terms, by central differences in physical (r, z), at a point given in the
     profile's own coordinates — the build gates the worst of these. `vel` defaults to the drawn velocity; the build
     passes a planted wrong one to show the check can fail */
  function divergence(X0, eta0, t, h, vel = velocity) {
    const Q = t / (1 - eta0 * eta0), r = Math.sqrt(2 * Q * X0), z = Math.pow(Q, 0.5 - h) * eta0;
    const dr = r * 1e-5, dz = Math.abs(z) * 1e-5;
    const rur = (rr) => rr * vel(rr, z, t, h).ur;
    const t1 = (rur(r + dr) - rur(r - dr)) / (2 * dr) / r;
    const t2 = (vel(r, z + dz, t, h).uz - vel(r, z - dz, t, h).uz) / (2 * dz);
    return Math.abs(t1 + t2) / Math.max(Math.abs(t1), Math.abs(t2));
  }
  const api = { U, E, G, q, velocity, divergence };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NSFIELD = api;
})(this);
