/* certify-min.js — certified global minimum of P_A = sum_{a in A} T_a on [-1,1].
   PROBE — research/probes/chowla-cosine · ships nowhere · claimless.

   Input: a finite set A of positive integers. Output: an ENCLOSURE
   [minLo, minHi] with the true min_x f_A(x) = min_{y in [-1,1]} P_A(y)
   guaranteed inside, argument enclosures for every candidate minimizer, and
   the normalized c = -min / sqrt(|A|) as an enclosure, outward-rounded.

   Method, end to end exact until the final outward double conversion:
     1. P_A and P_A' as BigInt monomial polynomials (cheb.js).
     2. Sturm chain of the square-free part of P_A' over BigInt polynomials —
        a primitive pseudo-remainder sequence with the sign of the implied
        lc-power factor tracked, so every element is a POSITIVE multiple of the
        canonical Sturm element (sign-variation counts are invariant under
        positive scaling). WHY NOT rational.js fractions for the chain itself:
        the reduced fractions of the monic Euclidean sequence are quotients of
        subresultants, and dragging a gcd-reduction through every intermediate
        op is strictly slower than one integer content-strip per row; the
        rational library still does what only it can do — exact evaluation,
        comparison, and the tie-deciding signs (Q.gcd is the one gcd used).
     3. Root isolation of P_A' on an interval slightly wider than [-1,1]:
        fast path = sign changes of the square-free part on a dyadic grid,
        CERTIFIED complete by comparing the count against the Sturm total
        V(a)-V(b) (two chain evaluations); any zero-sign grid point or count
        mismatch falls back to full Sturm bisection. Both paths are rigorous;
        the result records which one ran.
     4. Interval-Newton refinement of each isolating interval, in exact
        rational arithmetic: N = m - sf(m) / [sf'(m) ± B·w/2], where B bounds
        |sf''| on [-1,1] (V. Markov for Chebyshev sums, coefficient-sum bound
        otherwise); dyadic outward rounding after every Newton step caps
        coefficient heights; bisection on exact signs whenever Newton does not
        contract. An exact sign 0 at any probe point is a THIN root — the tie
        the rational library exists to decide.
     5. Certified value enclosure per candidate from the degree-2 Taylor bound
        P(t) in P(m) ± (|P'(m)|·w/2 + L2·w²/8) on the isolating interval,
        L2 >= max|P''| on [-1,1] (V. Markov: |T_a''| <= a²(a²-1)/3, exact
        integer). Endpoints y = ±1 enter as exact thin candidates.
     6. min over candidates, outward to doubles via nextDown/nextUp; c through
        interval division by an enclosure of sqrt(|A|). Every rounding at this
        stage is OUTWARD, so the reported enclosure is a true one.

   Nothing in here reimplements interval or rational arithmetic — both come
   from core/interval (the single source). */
'use strict';
const path = require('path');
const C = require('./cheb.js');
const IV = require('#instruments/interval/interval.js');
const Q = require('#instruments/interval/rational.js');

const { trim, deg, isZeroPoly, polyForSet, polyDeriv, evalHom, evalExact, evalSign } = C;

/* ---------------- integer polynomial helpers (BigInt, exact) ---------------- */

function absB(x) { return x < 0n ? -x : x; }

/* content = positive gcd of the coefficients; early exit at 1. */
function content(c) {
  let g = 0n;
  for (const x of c) {
    if (x === 0n) continue;
    g = Q.gcd(g, x);
    if (g === 1n) return 1n;
  }
  return g === 0n ? 1n : g;
}

function primitive(c) {
  const ct = content(c);
  return ct === 1n ? c.slice() : c.map(x => x / ct);
}

/* Pseudo-division: f·lc(g)^steps = q·g + r exactly. */
function pseudoDiv(f, g) {
  const dg = deg(g), lg = g[dg];
  let r = f.slice(), steps = 0;
  let qt = new Array(Math.max(1, f.length - dg)).fill(0n);
  while (!isZeroPoly(r) && deg(r) >= dg) {
    const dr = deg(r), cTop = r[dr];
    for (let i = 0; i < qt.length; i++) qt[i] *= lg;
    qt[dr - dg] += cTop;
    const nr = new Array(dr).fill(0n);
    for (let i = 0; i < dr; i++) nr[i] = r[i] * lg;
    for (let i = 0; i < dg; i++) nr[i + dr - dg] -= cTop * g[i];
    r = trim(nr); steps++;
  }
  return { q: trim(qt), r, steps };
}

/* Next Sturm element: a positive multiple of -(f mod g), primitive.
   prem = (f mod g)·lc(g)^steps, so the sign of lc(g)^steps must be undone
   before negating — a silently wrong sign here would corrupt every
   variation count downstream. */
function sturmNext(f, g) {
  const dg = deg(g), lg = g[dg];
  let r = f.slice(), steps = 0;
  while (!isZeroPoly(r) && deg(r) >= dg) {
    const dr = deg(r), cTop = r[dr];
    const nr = new Array(dr).fill(0n);
    for (let i = 0; i < dr; i++) nr[i] = r[i] * lg;
    for (let i = 0; i < dg; i++) nr[i + dr - dg] -= cTop * g[i];
    r = trim(nr); steps++;
  }
  if (isZeroPoly(r)) return { poly: r, zero: true };
  const flip = (lg < 0n && steps % 2 === 1) ? 1n : -1n;   /* -(prem / lc^steps) up to >0 */
  return { poly: primitive(r.map(x => flip * x)), zero: false };
}

/* Sturm chain of p (primitive parts, each a positive multiple of canonical). */
function sturmChain(p) {
  const p0 = primitive(trim(p));
  const chain = [p0];
  if (deg(p0) === 0) return chain;
  chain.push(primitive(polyDeriv(p0)));
  for (;;) {
    const g = chain[chain.length - 1];
    if (isZeroPoly(g) || deg(g) === 0) break;
    const nx = sturmNext(chain[chain.length - 2], g);
    if (nx.zero) break;
    chain.push(nx.poly);
  }
  return chain;
}

/* Square-free part: p / gcd(p, p'), primitive. Same real roots, all simple. */
function squarefreePart(p) {
  const p0 = primitive(trim(p));
  if (deg(p0) <= 1) return p0;
  const chain = sturmChain(p0);
  const last = chain[chain.length - 1];
  if (isZeroPoly(last) || deg(last) === 0) return p0;      /* gcd constant: already square-free */
  const { q, r } = pseudoDiv(p0, last);
  if (!isZeroPoly(r)) throw new Error('squarefreePart: trailing PRS element does not divide p — chain is corrupt');
  return primitive(q);
}

function signVarAt(chain, r) {
  let prev = 0, v = 0;
  for (const p of chain) {
    const s = evalSign(p, r);
    if (s === 0) continue;
    if (prev !== 0 && s !== prev) v++;
    prev = s;
  }
  return v;
}

/* ---------------- rational interval helpers (dyadic bookkeeping) ------------ */

function floorDivB(a, b) {           /* b > 0 */
  const q = a / b;
  return (a % b !== 0n && a < 0n) ? q - 1n : q;
}
function dyadicDown(x, bits) {
  const s = 1n << BigInt(bits);
  return Q.R(floorDivB(x.n * s, x.d), s);
}
function dyadicUp(x, bits) {
  const s = 1n << BigInt(bits);
  const t = x.n * s, q = floorDivB(t, x.d);
  return Q.R(q * x.d === t ? q : q + 1n, s);
}
function mid(l, r) { return Q.div(Q.add(l, r), Q.R(2n)); }
const HALF = Q.R(1n, 2n);

/* Certified outward rational→double conversion. Q.toDouble is documented "for
   reporting only" — it is NOT promised correctly rounded — so the outwardness
   is VERIFIED here with exact arithmetic (fromDouble is lossless, cmp exact)
   and repaired by ulp steps until it holds. Exactly-representable values stay
   exact; nothing is trusted on assertion. */
function outDown(v) {
  let x = Q.toDouble(v), g = 0;
  while (Q.cmp(Q.fromDouble(x), v) > 0) { x = IV.nextDown(x); if (++g > 100) throw new Error('outDown: did not converge'); }
  return x;
}
function outUp(v) {
  let x = Q.toDouble(v), g = 0;
  while (Q.cmp(Q.fromDouble(x), v) < 0) { x = IV.nextUp(x); if (++g > 100) throw new Error('outUp: did not converge'); }
  return x;
}

/* ---------------- root isolation --------------------------------------------
   Returns { intervals: [[l,r],...], path } — each [l,r] holds EXACTLY ONE root
   of sf (thin [t,t] when the root is hit exactly), certified either by Sturm
   counts on every interval (slow path) or by grid sign changes whose total
   matches the Sturm count over the whole range (fast path: each sign-change
   segment holds >= 1 root, the segments are disjoint, and their number equals
   the total, so each holds exactly one and none escaped). */
function isolateAll(sf, a, b) {
  const chain = sturmChain(sf);
  const total = signVarAt(chain, a) - signVarAt(chain, b);
  if (total === 0) return { intervals: [], path: 'grid+sturm-total', total };

  /* fast path: dyadic grid, sf-only evaluations */
  const dsf = deg(sf);
  for (let round = 0; round < 5; round++) {
    const G = (2 * dsf + 16) * (1 << round);          /* even, so 0 lands on the grid */
    const step = Q.div(Q.sub(b, a), Q.R(BigInt(G)));
    const pts = [], sgn = [];
    let zeroHit = false;
    for (let j = 0; j <= G; j++) {
      const t = j === G ? b : Q.add(a, Q.mul(step, Q.R(BigInt(j))));
      const s = evalSign(sf, t);
      if (s === 0 && j > 0 && j < G) { zeroHit = true; break; }
      if (s === 0) { zeroHit = true; break; }         /* endpoint roots also go slow */
      pts.push(t); sgn.push(s);
    }
    if (zeroHit) break;                                /* exact grid root: slow path decides */
    const segs = [];
    for (let j = 1; j < pts.length; j++) if (sgn[j] !== sgn[j - 1]) segs.push([pts[j - 1], pts[j]]);
    if (segs.length === total) return { intervals: segs, path: 'grid+sturm-total', total };
  }

  /* slow path: Sturm bisection (nudges any zero-sign split point) */
  const out = [];
  const rec = (l, r, vl, vr, depth) => {
    const k = vl - vr;
    if (k <= 0) return;
    if (k === 1) { out.push([l, r]); return; }
    if (depth > 220) throw new Error('isolateAll: bisection depth exhausted');
    let m = mid(l, r), guard = 0;
    while (evalSign(sf, m) === 0 && guard < 80) { m = mid(l, m); guard++; }
    if (evalSign(sf, m) === 0) throw new Error('isolateAll: no non-root split point found');
    const vm = signVarAt(chain, m);
    rec(l, m, vl, vm, depth + 1);
    rec(m, r, vm, vr, depth + 1);
  };
  rec(a, b, signVarAt(chain, a), signVarAt(chain, b), 0);
  if (out.length !== total) throw new Error('isolateAll: bisection count mismatch — ' + out.length + ' vs ' + total);
  return { intervals: out, path: 'sturm-bisection', total };
}

/* ---------------- capped-precision ball evaluation --------------------------
   The Newton loop must not drag exact rationals of ten-kilobit height through
   Q.div — every Q op gcd-reduces, and that gcd on giant pairs was measured at
   ~0.5 s PER ROOT. Instead: evaluate exactly with one homogeneous Horner
   (BigInt, no rounding), then round the single quotient hom/den OUTWARD to a
   PREC-bit dyadic ball. The ball CONTAINS the exact value, so every Newton
   step below is a rigorous interval extension; heights stay capped and every
   Q op stays cheap. floorDivB needs no gcd. */
const PREC = 192;
function roundOutRat(num, den, prec) {          /* den > 0; [lo,hi] ∋ num/den */
  const s = 1n << BigInt(prec);
  const t = num * s, q = floorDivB(t, den);
  const lo = Q.R(q, s);
  return [lo, q * den === t ? lo : Q.R(q + 1n, s)];
}
/* one Horner, three answers: exact sign, and a PREC-bit ball around the value */
function evalBall(c, r, prec) {
  const hom = evalHom(c, r.n, r.d);
  const sign = hom < 0n ? -1 : hom > 0n ? 1 : 0;
  const ball = roundOutRat(hom, r.d ** BigInt(c.length - 1), prec);
  return { sign, lo: ball[0], hi: ball[1] };
}

/* ---------------- refinement ------------------------------------------------
   sf square-free, [l,r] isolates one simple root, sign change at the ends.
   Bsfpp: rational bound on |sf''| over [-1,1], or null to force bisection.
   wStop: rational target width. Newton evaluations are PREC-bit balls around
   the exact values (containment preserved); Newton results are rounded OUTWARD
   to 256-bit dyadics so coefficient heights stay capped. Signs are exact. */
function refineRoot(sf, sfd, Bsfpp, l, r, wStop, sabotageWidth) {
  const stopAt = sabotageWidth || wStop;
  let sl = evalSign(sf, l);
  const sr0 = evalSign(sf, r);
  if (sl === 0) return [l, l];
  if (sr0 === 0) return [r, r];
  if (sl === sr0) throw new Error('refineRoot: no sign change on an isolating interval');
  for (let it = 0; it < 500; it++) {
    const w = Q.sub(r, l);
    if (Q.cmp(w, stopAt) <= 0) break;
    let stepped = false;
    if (Bsfpp && !sabotageWidth) {
      const m = mid(l, r);
      const f = evalBall(sf, m, PREC);
      if (f.sign === 0) return [m, m];
      const d = evalBall(sfd, m, PREC);
      /* sf'(ξ) for ξ in [l,r] lies in d ± B·w/2 (mean value from the midpoint) */
      const rad = Q.mul(Bsfpp, Q.mul(w, HALF));
      const dlo = Q.sub(d.lo, rad), dhi = Q.add(d.hi, rad);
      if (Q.sign(dlo) > 0 || Q.sign(dhi) < 0) {
        /* t* ∈ m − [f]/[d]: extremes at the corners since 0 ∉ [dlo,dhi] */
        const qs = [Q.div(f.lo, dlo), Q.div(f.lo, dhi), Q.div(f.hi, dlo), Q.div(f.hi, dhi)];
        let qmin = qs[0], qmax = qs[0];
        for (const qv of qs) {
          if (Q.cmp(qv, qmin) < 0) qmin = qv;
          if (Q.cmp(qv, qmax) > 0) qmax = qv;
        }
        let nl = dyadicDown(Q.sub(m, qmax), 256);
        let nr = dyadicUp(Q.sub(m, qmin), 256);
        if (Q.cmp(nl, l) < 0) nl = l;
        if (Q.cmp(nr, r) > 0) nr = r;
        if (Q.cmp(nl, nr) <= 0 && Q.cmp(Q.sub(nr, nl), Q.mul(w, Q.R(3n, 4n))) < 0) {
          const snl = evalSign(sf, nl), snr = evalSign(sf, nr);
          if (snl === 0) return [nl, nl];
          if (snr === 0) return [nr, nr];
          if (snl !== snr) { l = nl; r = nr; sl = snl; stepped = true; }
        }
      }
    }
    if (!stepped) {
      const m = mid(l, r);
      const sm = evalSign(sf, m);
      if (sm === 0) return [m, m];
      if (sm === sl) l = m; else r = m;
    }
  }
  return [l, r];
}

/* ---------------- the instrument -------------------------------------------- */

const R1 = Q.R(1n), Rm1 = Q.R(-1n);

/* Certified enclosure of {P(t) : t in [l,r] ⊆ [-1,1]} from the Taylor bound
   P(t) ∈ P(m) ± (|P'(m)|·w/2 + L2·w²/8), m the midpoint, evaluated as PREC-bit
   balls around the exact values (containment preserved, heights capped). Thin
   intervals get the exact value. */
function valueEnclosure(P, Pd, L2, l, r) {
  if (Q.cmp(l, r) === 0) {
    const v = evalExact(P, l);
    return { lo: v, hi: v, yl: l, yr: r };
  }
  const m = mid(l, r), w = Q.sub(r, l);
  const p = evalBall(P, m, PREC);
  const d = evalBall(Pd, m, PREC);
  const absD = Q.cmp(Q.abs(d.lo), Q.abs(d.hi)) >= 0 ? Q.abs(d.lo) : Q.abs(d.hi);
  const E = Q.add(Q.mul(absD, Q.mul(w, HALF)),
                  Q.div(Q.mul(L2, Q.mul(w, w)), Q.R(8n)));
  return { lo: Q.sub(p.lo, E), hi: Q.add(p.hi, E), yl: l, yr: r };
}

function coeffAbsSum(c) { let s = 0n; for (const x of c) s += absB(x); return s; }

/* certifyPoly: the polynomial-level engine. opts:
     n         |A| for cNormalized (null → no c reported)
     L2        rational bound on |P''| over [-1,1] (default: coefficient sum)
     L3        rational bound on |P'''| over [-1,1] (default: coefficient sum)
     tol       target width of the min enclosure (default 1e-9)
     sabotage  'narrow' — RED-CONTROL ONLY: stops refinement at width 1/4 and
               reports the bare midpoint value as a THIN enclosure, i.e. the
               outward Taylor rounding deliberately narrowed to nothing. Exists
               so the battery can prove the sampling cross-check has teeth. */
function certifyPoly(P0, opts) {
  const o = opts || {};
  const t0 = Date.now();
  const P = trim(P0.map(BigInt));
  const n = o.n === undefined ? null : o.n;
  const tol = o.tol === undefined ? 1e-9 : o.tol;
  const sab = o.sabotage === 'narrow';
  const Pd = polyDeriv(P);
  const L2 = o.L2 || Q.R(coeffAbsSum(polyDeriv(Pd)));
  const L3 = o.L3 || Q.R(coeffAbsSum(polyDeriv(polyDeriv(Pd))));

  const candidates = [];
  /* endpoints, exact and thin */
  candidates.push({ ...valueEnclosure(P, Pd, L2, Rm1, Rm1), kind: 'endpoint y=-1' });
  candidates.push({ ...valueEnclosure(P, Pd, L2, R1, R1), kind: 'endpoint y=+1' });

  let isolation = 'none-needed', nCrit = 0, sfDeg = 0;
  const tSturm0 = Date.now();
  let tIso = 0, tRef = 0;
  if (deg(Pd) >= 1) {
    /* square-free part; Newton bound |sf''| <= min(L3/ct, coeff-sum of sf'') */
    const ct = content(Pd);
    const sf = squarefreePart(Pd);
    sfDeg = deg(sf);
    const sfd = polyDeriv(sf);
    const sfIsPrimPd = sf.length === Pd.length;   /* gcd(P',P'') constant ⇔ same degree */
    const BsfMarkov = sfIsPrimPd ? Q.div(L3, Q.R(ct)) : null;
    const BsfCs = Q.R(coeffAbsSum(polyDeriv(sfd)));
    let Bsfpp = BsfCs;
    if (BsfMarkov && Q.cmp(BsfMarkov, BsfCs) < 0) Bsfpp = BsfMarkov;

    /* isolate on a hair more than [-1,1]; nudge endpoints off any root of sf */
    let a = Q.R(-1025n, 1024n), b = Q.R(1025n, 1024n);
    let g = 0;
    while (evalSign(sf, a) === 0 && g++ < 60) a = Q.sub(a, Q.R(1n, 1n << BigInt(10 + g)));
    g = 0;
    while (evalSign(sf, b) === 0 && g++ < 60) b = Q.add(b, Q.R(1n, 1n << BigInt(10 + g)));

    const tI0 = Date.now();
    const iso = isolateAll(sf, a, b);
    tIso = Date.now() - tI0;
    isolation = iso.path;
    nCrit = iso.intervals.length;

    /* stop width from the value-width target: near a root of P', |P'(m)| <= L2·w,
       so the Taylor width is <= L2·w²; aim w ~ sqrt(tol/L2) with margin 2^-4. */
    const L2f = Math.max(1, Q.toDouble(L2));
    const wBits = Math.min(500, Math.max(20, Math.ceil(-Math.log2(Math.sqrt(tol / L2f))) + 4));
    const wStop = Q.R(1n, 1n << BigInt(wBits));
    const sabW = sab ? Q.R(1n, 4n) : null;

    const tR0 = Date.now();
    /* clip to [-1,1] for the VALUE bound only — refinement always continues on
       the unclipped segment, where the sign-change invariant is guaranteed */
    const clip = (s) => {
      if (Q.cmp(s[1], Rm1) < 0 || Q.cmp(s[0], R1) > 0) return null;
      return [Q.cmp(s[0], Rm1) < 0 ? Rm1 : s[0], Q.cmp(s[1], R1) > 0 ? R1 : s[1]];
    };
    for (const [il, ir] of iso.intervals) {
      let seg = refineRoot(sf, sfd, Bsfpp, il, ir, wStop, sabW);
      let cl = clip(seg);
      if (!cl) continue;                     /* root certified outside [-1,1] */
      let v = valueEnclosure(P, Pd, L2, cl[0], cl[1]);
      if (sab) { const pm = evalExact(P, mid(cl[0], cl[1])); v = { lo: pm, hi: pm, yl: cl[0], yr: cl[1] }; }
      else if (Q.toDouble(Q.sub(v.hi, v.lo)) > tol) {
        /* one adaptive push: 10 more dyadic bits */
        seg = refineRoot(sf, sfd, Bsfpp, seg[0], seg[1], Q.R(1n, 1n << BigInt(Math.min(520, wBits + 10))), null);
        cl = clip(seg);
        if (!cl) continue;
        v = valueEnclosure(P, Pd, L2, cl[0], cl[1]);
      }
      candidates.push({ ...v, kind: 'critical' });
    }
    tRef = Date.now() - tR0;
  }
  const tSturm = Date.now() - tSturm0 - tIso - tRef;

  /* global min enclosure: [min lo_i, min hi_i], exact comparisons */
  let glo = candidates[0].lo, ghi = candidates[0].hi;
  for (const cd of candidates) {
    if (Q.cmp(cd.lo, glo) < 0) glo = cd.lo;
    if (Q.cmp(cd.hi, ghi) < 0) ghi = cd.hi;
  }
  /* outward to doubles, outwardness VERIFIED exactly (see outDown/outUp) */
  const minLo = outDown(glo);
  const minHi = outUp(ghi);

  /* candidates that can still attain the min (lo <= global hi) */
  const argEnclosures = candidates
    .filter(cd => Q.cmp(cd.lo, ghi) <= 0)
    .map(cd => ({
      kind: cd.kind,
      y: [outDown(cd.yl), outUp(cd.yr)],
      value: [outDown(cd.lo), outUp(cd.hi)]
    }));

  let cNormalized = null;
  if (n) {
    /* c = -min/sqrt(n); Math.sqrt is correctly rounded, encloseFloat pads it */
    cNormalized = IV.div(IV.neg([minLo, minHi]), IV.encloseFloat(Math.sqrt(n)));
  }
  return {
    n, degree: deg(P),
    minEnclosure: [minLo, minHi],
    width: minHi - minLo,
    argEnclosures,
    cNormalized,
    method: 'chebyshev reduction → sturm isolation (' + isolation + ') → interval-newton/bisection refinement → exact taylor value enclosures, outward-rounded'
      + (sab ? ' [SABOTAGED: narrow]' : ''),
    counts: { degree: deg(P), sfDeg, nCrit, nCandidates: candidates.length, isolation },
    timings: { sturmMs: tSturm, isolateMs: tIso, refineMs: tRef, totalMs: Date.now() - t0 }
  };
}

/* certify: the set-level instrument. V. Markov bounds, exact integers:
   |T_a''| <= a²(a²-1)/3, |T_a'''| <= a²(a²-1)(a²-4)/15 on [-1,1]. */
function certify(A, opts) {
  const t0 = Date.now();
  const P = polyForSet(A);
  let l2 = 0n, l3 = 0n;
  for (const a of A) {
    const ab = BigInt(a), s = ab * ab;
    l2 += s * (s - 1n) / 3n;
    l3 += s * (s - 1n) * (s - 4n) / 15n;
  }
  const res = certifyPoly(P, {
    ...(opts || {}), n: A.length,
    L2: Q.R(l2), L3: Q.R(l3 < 0n ? 0n : l3)
  });
  res.A = A.slice().sort((x, y) => x - y);
  res.timings.buildMs = Date.now() - t0 - res.timings.totalMs;
  res.timings.totalMs = Date.now() - t0;
  return res;
}

/* ---------------- dense sampling cross-check (float, NOT certified) ----------
   f_A is even and 2π-periodic, so min over R = min over [0, π]. On a grid of
   K+1 points the sampled min obeys
       true min  <=  sampled min  <=  true min + Lx·h/2 + float slop,
   Lx = sum(A) a Lipschitz bound for f_A in x. The battery asserts the sampled
   min lands INSIDE [lo, hi + Lx·h/2] up to float slop — a certified enclosure
   that a dense sample escapes is wrong, and that is exactly what the 'narrow'
   sabotage must trigger. */
function sampleMin(A, K) {
  const k = K || 200000;
  let best = Infinity, bestX = 0;
  for (let j = 0; j <= k; j++) {
    const x = Math.PI * j / k;
    let s = 0;
    for (const a of A) s += Math.cos(a * x);
    if (s < best) { best = s; bestX = x; }
  }
  return { sampledMin: best, atX: bestX, K: k, h: Math.PI / k };
}

function crossCheck(A, enclosure, K) {
  const s = sampleMin(A, K);
  const Lx = A.reduce((t, a) => t + a, 0);
  const slackAbove = Lx * s.h / 2;
  const fpad = 1e-11 * A.length * (1 + Lx);      /* float summation/argument slop */
  const [lo, hi] = enclosure;
  let violation = null;
  if (s.sampledMin < lo - fpad) violation = 'below-lo';
  else if (s.sampledMin > hi + slackAbove + fpad) violation = 'above-hi';
  return { ok: violation === null, violation, sampledMin: s.sampledMin, atX: s.atX, lo, hi, slackAbove, fpad, K: s.K };
}

module.exports = {
  certify, certifyPoly, sampleMin, crossCheck,
  /* internals, exported for the battery */
  content, primitive, pseudoDiv, sturmNext, sturmChain, squarefreePart,
  signVarAt, isolateAll, refineRoot, valueEnclosure, dyadicDown, dyadicUp,
  outDown, outUp, IV, Q, C
};
