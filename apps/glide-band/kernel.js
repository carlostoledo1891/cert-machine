/* kernel.js — the certified glide band.
   apps/glide-band · cert-machine

   WORDING DISCIPLINE (aviation). "Certified" on this page and in this module
   ALWAYS means a mathematically certified enclosure — an interval proved to
   contain the true value. It carries NO airworthiness meaning, no design
   assurance, and no approval of any kind. Nothing here is for navigation.

   ── what is computed ────────────────────────────────────────────────────
   An engine-out glide from a state (position, altitude) toward a landing
   site at bearing θ and distance D. Every uncertain input is an INTERVAL,
   and interval arithmetic is outward-rounded, so the computed band
   [d_lo, d_hi] ENCLOSES the range of achievable glide distance over the
   whole envelope. That gives three decidable verdicts:

     REACHABLE    D <= d_lo   — then D <= min(range), so the site is
                                reachable for EVERY value in the envelope
     UNREACHABLE  D >  d_hi   — then D >  max(range), so it is reachable
                                for NO value in the envelope
     UNDECIDED    otherwise   — the envelope does not decide it, and the
                                page says which input would

   Both outer verdicts are conservative in the safe direction: the enclosure
   is a superset of the true range, so widening it can only move a verdict
   INTO undecided, never out of it into a wrong answer.

   ── the model ───────────────────────────────────────────────────────────
   Steady glide at best-glide true airspeed Va with glide ratio LD, so sink
   rate w = Va/LD and time aloft t = h·LD/Va for height h above the site.
   For a ground course θ into a wind of speed Ws FROM bearing φ, write
   Δ = θ − φ; the wind's along-course and cross-course components are

        along = −Ws·cos Δ        cross = Ws·sin Δ

   and the achievable ground speed on that course is

        Vg = sqrt(Va² − cross²) + along
        d  = t·Vg = (h·LD/Va)·( sqrt(Va² − cross²) + along )

   ── the hypotheses, stated rather than buried ───────────────────────────
   H1  TERRAIN IS NOT MODELLED. d is the glide distance over ground at the
       site's own elevation. Rising terrain between here and there can only
       REMOVE reach, so:
         · UNREACHABLE is unaffected by H1 — it stays proved.
         · REACHABLE carries H1: it means "reachable if the path is not
           obstructed". The page says so wherever it says REACHABLE.
   H2  Steady wind over the descent, and a steady-state glide: no transient
       for the pushover, no thermal or shear structure.
   H3  Great-circle geometry on a sphere whose radius is enclosed by
       [6356.752, 6378.137] km (polar to equatorial). Deliberately crude and
       deliberately conservative — it dominates double-precision error in the
       haversine by six orders of magnitude, so the geodesy needs no separate
       error argument.
   H4  The envelope itself is a STATED scenario, not manufacturer data. No
       published performance figure for any aircraft is asserted anywhere in
       this app. Move the envelope and every number moves with it.               */
'use strict';

const path = require('path');
const IV = require(path.join(__dirname, '..', '..', 'instruments', 'interval', 'interval.js'));
const { iv, add, sub, mul, div, neg, sqr, nextUp, nextDown } = IV;

/* ---------- units ---------------------------------------------------------- */
const FT = 0.3048;                 /* ft  -> m */
const KT = 0.5144444444444445;     /* kt  -> m/s */
const R_EARTH = [6356752.0, 6378137.0];   /* H3, metres */
const D2R = Math.PI / 180;

/* ---------- interval sqrt (monotone, so endpoints suffice) ----------------- */
function isqrt(x) {
  const lo = x[0] < 0 ? 0 : x[0];
  const hi = x[1] < 0 ? 0 : x[1];
  return [nextDown(Math.sqrt(lo)), nextUp(Math.sqrt(hi))];
}

/* ---------- sound cos/sin over an ANGLE INTERVAL --------------------------
   Endpoints plus the interior extrema: cos attains +1 at 2kπ and −1 at
   (2k+1)π; sin attains ±1 at (2k±1/2)π. Detected by counting whether such a
   point lies inside [a,b], which is exact in float for our magnitudes.      */
function hitsMultiple(a, b, period, offset) {
  const k0 = Math.ceil((a - offset) / period);
  return (k0 * period + offset) <= b;
}
function cosHull(a, b) {
  if (b - a >= 2 * Math.PI) return [-1, 1];
  const ca = IV.encloseCos(a), cb = IV.encloseCos(b);
  let lo = Math.min(ca[0], cb[0]), hi = Math.max(ca[1], cb[1]);
  if (hitsMultiple(a, b, 2 * Math.PI, 0)) hi = 1;
  if (hitsMultiple(a, b, 2 * Math.PI, Math.PI)) lo = -1;
  return [nextDown(lo), nextUp(hi)];
}
function sinHull(a, b) {
  if (b - a >= 2 * Math.PI) return [-1, 1];
  const sa = IV.encloseSin(a), sb = IV.encloseSin(b);
  let lo = Math.min(sa[0], sb[0]), hi = Math.max(sa[1], sb[1]);
  if (hitsMultiple(a, b, 2 * Math.PI, Math.PI / 2)) hi = 1;
  if (hitsMultiple(a, b, 2 * Math.PI, -Math.PI / 2)) lo = -1;
  return [nextDown(lo), nextUp(hi)];
}

/* ---------- geodesy (H3) --------------------------------------------------
   Haversine in double, then enclosed by the earth-radius interval and a
   relative pad of 1e-9 — six orders above the ~1e-15 relative error of the
   double-precision haversine, so the pad is the whole error argument.      */
const PAD = 1e-9;
function greatCircle(lat1, lon1, lat2, lon2) {
  const p1 = lat1 * D2R, p2 = lat2 * D2R;
  const dp = (lat2 - lat1) * D2R, dl = (lon2 - lon1) * D2R;
  const s = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  const lo = nextDown(R_EARTH[0] * c * (1 - PAD));
  const hi = nextUp(R_EARTH[1] * c * (1 + PAD));
  return { dist: [lo, hi], bearing: bearingOf(lat1, lon1, lat2, lon2) };
}
function bearingOf(lat1, lon1, lat2, lon2) {
  const p1 = lat1 * D2R, p2 = lat2 * D2R, dl = (lon2 - lon1) * D2R;
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return (Math.atan2(y, x) / D2R + 360) % 360;
}

/* ---------- the band ------------------------------------------------------
   env = { LD:[lo,hi], Va:[lo,hi] (m/s), Ws:[lo,hi] (m/s), Wdir:[lo,hi] (deg
   FROM) }, h = [lo,hi] metres above the site. Returns metres, plus a
   `degenerate` flag when the envelope admits a crosswind at or above the
   airspeed, where the steady-glide model has no solution on that course.  */
function bandRaw(bearingDeg, h, env) {
  const a = (bearingDeg - env.Wdir[1]) * D2R;
  const b = (bearingDeg - env.Wdir[0]) * D2R;
  const lo = Math.min(a, b), hi = Math.max(a, b);
  const cosD = cosHull(lo, hi), sinD = sinHull(lo, hi);

  const along = mul(neg(env.Ws), cosD);
  const cross = mul(env.Ws, sinD);
  const rad = sub(sqr(env.Va), sqr(cross));
  const degenerate = rad[0] <= 0;

  const Vg = add(isqrt(rad), along);
  const t = div(mul(h, env.LD), env.Va);
  const d = mul(t, Vg);
  return { lo: d[0], hi: d[1], degenerate };
}

/* MINCING. Va appears in both the time-aloft factor and the ground-speed
   factor, and Wdir enters through two trig hulls, so a single interval
   evaluation charges the answer for a dependency that does not exist in the
   physics — the band comes out far wider than the true range of the model.
   Splitting the box and taking the hull of the pieces is SOUND (the pieces
   cover the box) and removes most of that self-inflicted width. What remains
   is uncertainty about the aircraft and the air, which is the thing the page
   is actually about. NVA x NWD sub-boxes; the split counts are declared here
   so the page can quote them. */
const NVA = 24, NWD = 12;
function splitIv(r, n) {
  const out = [];
  for (let i = 0; i < n; i++) out.push([r[0] + (r[1] - r[0]) * i / n, r[0] + (r[1] - r[0]) * (i + 1) / n]);
  return out;
}
function band(bearingDeg, h, env) {
  let lo = Infinity, hi = -Infinity, degenerate = false;
  for (const Va of splitIv(env.Va, NVA)) {
    for (const Wdir of splitIv(env.Wdir, NWD)) {
      const r = bandRaw(bearingDeg, h, Object.assign({}, env, { Va, Wdir }));
      if (r.lo < lo) lo = r.lo;
      if (r.hi > hi) hi = r.hi;
      if (r.degenerate) degenerate = true;
    }
  }
  return { lo: Math.max(0, lo), hi: Math.max(0, hi), degenerate };
}

/* the single line every shipped product draws: one value per input */
function nominal(bearingDeg, h_m, nom) {
  const D = (bearingDeg - nom.Wdir) * D2R;
  const along = -nom.Ws * Math.cos(D);
  const cross = nom.Ws * Math.sin(D);
  const rad = nom.Va * nom.Va - cross * cross;
  if (rad <= 0) return 0;
  return Math.max(0, (h_m * nom.LD / nom.Va) * (Math.sqrt(rad) + along));
}

/* ---------- one site, one state ------------------------------------------- */
const REACHABLE = 'REACHABLE', UNREACHABLE = 'UNREACHABLE', UNDECIDED = 'UNDECIDED';

function decide(state, site, env, nom) {
  const g = greatCircle(state.lat, state.lon, site.lat, site.lon);
  const siteM = site.elev_ft * FT;
  const h = [state.alt_m[0] - siteM, state.alt_m[1] - siteM];
  if (h[1] <= 0) {
    return { verdict: UNREACHABLE, why: 'below site elevation', D: g.dist, bearing: g.bearing,
             lo: 0, hi: 0, nom: 0, shown: false };
  }
  const hPos = [Math.max(0, h[0]), h[1]];
  const bd = band(g.bearing, hPos, env);
  const dn = nominal(g.bearing, (state.alt_nom_m - siteM), nom);

  let verdict;
  if (bd.degenerate) verdict = UNDECIDED;
  else if (g.dist[1] <= bd.lo) verdict = REACHABLE;
  else if (g.dist[0] > bd.hi) verdict = UNREACHABLE;
  else verdict = UNDECIDED;

  return { verdict, D: g.dist, bearing: g.bearing, lo: bd.lo, hi: bd.hi,
           nom: dn, shown: g.dist[0] <= dn, degenerate: bd.degenerate };
}

/* ---------- the disclosure lever ------------------------------------------
   For an UNDECIDED site: the smallest glide ratio you would have to KNOW you
   have — i.e. the value the lower end of the LD envelope must be raised to —
   for the site to become provably reachable, every other input unchanged.
   That is the number the doctrine says to publish: it turns the verdict into
   a request for one specific disclosure ("prove L/D >= x and this field goes
   green"). Returns null when no ratio up to `cap` decides it.            */
function requiredLD(state, site, env, cap) {
  const top = cap || 40;
  const reach = (x) => {
    const e = Object.assign({}, env, { LD: [x, Math.max(x, env.LD[1])] });
    return decide(state, site, e, { LD: x, Va: env.Va[0], Ws: env.Ws[0], Wdir: env.Wdir[0] }).verdict === REACHABLE;
  };
  if (!reach(top)) return null;
  let lo = env.LD[0], hi = top;
  if (reach(lo)) return lo;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (reach(mid)) hi = mid; else lo = mid;
  }
  return hi;
}

module.exports = {
  FT, KT, R_EARTH, isqrt, cosHull, sinHull, greatCircle, bearingOf,
  band, bandRaw, nominal, decide, requiredLD, NVA, NWD,
  REACHABLE, UNREACHABLE, UNDECIDED
};
