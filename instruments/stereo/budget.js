/* instruments/stereo/budget.js — the error budget of a stereo-video wave rig,
   as enclosures.

   THE OBJECT. Two cameras a baseline B apart, at height Hc above the mean
   water level, both aimed at the surface point at horizontal range R; a
   rectified pinhole pair with focal length f and pixel pitch p. A surface point
   is recovered from its disparity d (the horizontal pixel offset between the
   two images) and its vertical image coordinate v:
       Z = f·B/d        (range along the optical axis)
       Y = Z·v/f        (offset along the image's down direction)
   and, with the axis pitched down by θ (tan θ = Hc/R),
       η = Hc − Z·sin θ − Y·cos θ = Hc − (B/d)·(f·sin θ + v·cos θ)   elevation
       r =      Z·cos θ − Y·sin θ =      (B/d)·(f·cos θ − v·sin θ)   horizontal range
   [STANDARD: rectified stereo triangulation; the pitch is a rotation of the
   camera frame. Benetazzo 2006, Bergamasco et al. 2017 give the same model
   for WASS-type rigs. Nothing here is a new formula.]

   WHAT IS DECIDED. Every measured pixel quantity is known only to a box: the
   disparity to ±δd pixels (quantization plus matching), the vertical image
   coordinate to ±½ pixel. Each variable appears ONCE in η and once in r, so
   the natural interval extension of the two expressions over the box is
   TIGHT: the enclosure is exactly the set of elevations and ranges the
   measurement cannot tell apart — the quantization cell — and it is computed
   in outward-rounded interval arithmetic (instruments/interval/interval.js)
   over inputs that may themselves be boxes (a pixel pitch a paper does not
   state). Three more terms are bounds, not cells:
     · a synchronisation lag δt lets the surface texture the matcher
       correlates move by s = (ω·H/2 + u_tex)·δt between the two exposures —
       the water's own orbital speed plus a texture speed for the ripples and
       glitter riding on it, which is a CHOICE the page exposes; in the worst
       orientation that is a disparity error of f·s/Z, added to δd. (The swell
       SHAPE travels at the phase speed c, but the matcher does not track the
       shape; it tracks texture, and the shape's motion is the velocity term
       below.)
     · over the same δt the surface itself rises or falls by at most
       ω·(H/2)·δt for a wave of height H and period T (ω = 2π/T);
     · a horizontal misplacement of e_r reads the elevation at the wrong place
       on a slope of at most k·(H/2), k = 2π/λ: an error of k·(H/2)·e_r.
   Deep water is assumed for c = gT/2π and λ = gT²/2π; the page says so.

   RIGOR MODEL. Inputs are decimal literals enclosed by their neighbouring
   doubles; π enters as a certified enclosure (instruments/interval/
   transcendental.js at build); every operation widens outward. A total is an
   interval whose UPPER end is what the reach test uses: "within tolerance" is
   asserted only when the upper end clears it.

   ONE SOURCE, TWO HOSTS: this file has no require() so the instrument page
   inlines it. It takes the interval module as an argument. */
'use strict';
function makeBudget(IV) {
  const { iv, add, sub, mul, div, sqr, width, nextDown, nextUp } = IV;
  const sqrtIv = (a) => { if (!(a[0] >= 0)) throw new Error('sqrt of an interval below zero'); return [nextDown(Math.sqrt(a[0])), nextUp(Math.sqrt(a[1]))]; };
  const pos = (a, name) => { if (!(a[0] > 0)) throw new Error(name + ' must be strictly positive (got [' + a[0] + ', ' + a[1] + '])'); return a; };
  const nonneg = (a, name) => { if (!(a[0] >= 0)) throw new Error(name + ' must be non-negative (got [' + a[0] + ', ' + a[1] + '])'); return a; };
  /* a decimal literal -> the two doubles around it */
  const lit = (s) => {
    const x = Number(String(s).trim()); if (!Number.isFinite(x)) throw new Error('not a number: ' + s);
    if (Number.isInteger(x) && Math.abs(x) < 2 ** 53) return [x, x];       /* an integer is its own double */
    return [nextDown(x), nextUp(x)];                                        /* a decimal fraction is enclosed */
  };
  const box = (lo, hi) => { const a = lit(lo), b = lit(hi); if (!(a[0] <= b[1])) throw new Error('a box must have lo ≤ hi'); return [a[0], b[1]]; };

  /* the cell at one range. inp: { B, Hc, f, p, dd, dt, T, H, g, PI } as intervals; R an interval */
  function cell(inp, R) {
    const B = pos(inp.B, 'baseline'), Hc = pos(inp.Hc, 'camera height'), f = pos(inp.f, 'focal length'), p = pos(inp.p, 'pixel pitch');
    const dd = nonneg(inp.dd, 'disparity precision'), dt = nonneg(inp.dt, 'sync lag'), T = pos(inp.T, 'wave period'), H = nonneg(inp.H, 'wave height'), g = pos(inp.g, 'g'), PI = inp.PI;
    pos(R, 'range');
    const D = sqrtIv(add(sqr(Hc), sqr(R)));                   /* slant range: the axis is aimed at the point */
    const sin = div(Hc, D), cos = div(R, D);
    const Z = D;                                              /* Y = 0 at the aimed point */
    const d = div(mul(f, B), Z);                              /* true disparity, metres on the sensor */
    const half = mul(iv(0.5), p);
    /* deep-water wave: phase speed, wavenumber, amplitude */
    const twoPi = mul(iv(2), PI);
    const c = div(mul(g, T), twoPi);                          /* gT/2π */
    const k = div(mul(iv(4), sqr(PI)), mul(g, sqr(T)));       /* 2π/λ = 4π²/(gT²) */
    const a = mul(iv(0.5), H);
    const omega = div(twoPi, T);
    /* disparity uncertainty: quantization + matching, then the sync lag's worst-case texture shift */
    const eQuant = mul(dd, p);
    const uTex = nonneg(inp.utex || iv(0), 'texture speed');
    const s = mul(add(mul(omega, a), uTex), dt);              /* texture displacement during the lag: orbital speed + ripple speed */
    const eSync = div(mul(f, s), Z);
    const cellAt = (e) => {
      const dBox = [nextDown(d[0] - e[1]), nextUp(d[1] + e[1])];
      if (!(dBox[0] > 0)) return null;                       /* the box reaches d ≤ 0: the far side is unbounded — REFUSED */
      const vBox = [-half[1], half[1]];
      const eta = sub(Hc, mul(div(B, dBox), add(mul(f, sin), mul(vBox, cos))));
      const r = mul(div(B, dBox), sub(mul(f, cos), mul(vBox, sin)));
      return { eta, r, vert: width(eta), horiz: width(r) };
    };
    const q = cellAt(eQuant);
    const qs = cellAt(add(eQuant, eSync));
    const velocity = mul(mul(omega, a), dt);                  /* the surface's own motion over the lag */
    const slope = qs ? mul(mul(k, a), iv(qs.horiz)) : null;   /* misplacement on the steepest slope */
    const total = qs ? add(add(iv(qs.vert), slope), velocity) : null;
    return {
      R, slant: D, sin, cos, disparityPx: div(d, p),
      quantization: q, withSync: qs,
      terms: q && qs ? { cell: q.vert, cellWithSync: qs.vert, slope: slope[1], velocity: velocity[1] } : null,
      total, refused: !qs ? 'the disparity box reaches zero: at this range the rig cannot bound the far side' : null,
      wave: { c, k, lambda: div(twoPi, k), orbital: mul(omega, a), textureShift: s },
    };
  }
  /* the reach: the largest grid range at which the total's UPPER end is within tol × H,
     scanning outward and stopping at the first failure (so the answer is a prefix of the grid) */
  function reach(inp, tol, grid) {
    const limit = mul(tol, inp.H);
    let last = null, first = null, rows = [];
    for (const R of grid) {
      const c = cell(inp, R);
      const ok = !!(c.total && c.total[1] <= limit[0]);
      rows.push({ R: R[0], ok, total: c.total ? c.total[1] : null });
      if (!ok) { first = R[0]; break; }
      last = R[0];
    }
    return { reach: last, firstFailure: first, limit, rows };
  }
  return { cell, reach, lit, box, sqrtIv };
}
if (typeof module !== 'undefined' && module.exports) module.exports = { makeBudget };
else if (typeof window !== 'undefined') window.makeBudget = makeBudget;
