/* grammar-hero.js — THE rule of /grammar/'s hero, y = √x drawn twice: its exact knots, the straight segments chosen
   between them, and the claim those segments make, decided for a tolerance ε the reader chooses.
   tools/ · cert-machine · 2026-10-30 (the operator's ruling: a live ε handle on the √x hero)

   ONE RULE, TWO PLACES. tools/build-grammar.js requires this file and draws the static hero from it (the knots, the
   segment's value at x = 1/2, the three lines beside the ×); the page carries this same file, inlined, and its handle
   calls it on every move. There is no second copy of the rule to fall out of step.

   THE CLAIM, for ε = k / Q (Q = 64, the enclosure's own denominator; k a whole number):
     every straight segment between the exact knots is within ε of √x on the hero's window [0, 5/4].
   √ is concave, so a chord lies below it: on the segment from a² to b², √x − s(x) = −(√x − a)(√x − b)/(a + b) ≥ 0, at
   most (b − a)² / (4(a + b)), reached at x = ((a + b)/2)². The knots sit at squares, so that point and that gap are
   rationals, and the claim's FLIP — the least ε at which it holds — is a rational decided here, not a float.
     HOLDS      ε ≥ the flip: no point of the window has √x more than ε above its segment
     REFUTED    ε below it, with a witness: a rational x where (s(x) + ε)² < x, i.e. √x lies more than ε above s(x)
   The witness is the hero's own x = 1/2 while it still refutes (so ε = 0 draws today's figure, byte for byte), then
   the point of the largest gap. Every comparison is in BigInt rationals.

   Loaded as a plain script (window.GX_HERO) or required by Node. No colour, no drawing, no request.            MIT */
(function (root) {
  'use strict';
  const B = (x) => BigInt(x);
  const gcd = (x, y) => { x = x < 0n ? -x : x; y = y < 0n ? -y : y; while (y) [x, y] = [y, x % y]; return x; };
  const fr = (n, d = 1n) => { n = B(n); d = B(d); if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d) || 1n; return [n / g, d / g]; };
  const fsub = (p, q) => fr(p[0] * q[1] - q[0] * p[1], p[1] * q[1]);
  const fadd = (p, q) => fr(p[0] * q[1] + q[0] * p[1], p[1] * q[1]);
  const fmul = (p, q) => fr(p[0] * q[0], p[1] * q[1]);
  const fdiv = (p, q) => fr(p[0] * q[1], p[1] * q[0]);
  const feq = (p, q) => p[0] * q[1] === q[0] * p[1];
  const flt = (p, q) => p[0] * q[1] < q[0] * p[1];
  const fnum = (p) => Number(p[0]) / Number(p[1]);
  const fstr = (p) => (p[1] === 1n ? String(p[0]) : p[0] + '/' + p[1]);

  /* the enclosure's denominator, and so the step of ε */
  const Q = 64n;
  /* the meet: five knots where √x is exact, (a², a) */
  const KNOTS = [[fr(0), fr(0)], [fr(1, 4), fr(1, 2)], [fr(1), fr(1)], [fr(9, 4), fr(3, 2)], [fr(4), fr(2)]];
  /* the hero's window, x in [0, 5/4], and its witness of the bare claim (ε = 0), x = 1/2 */
  const HX1 = fr(5, 4), WX = fr(1, 2);

  /* the segment's value at x (x on the knots' span), and the segment it lies on */
  const segOf = (x) => { for (let i = 0; i + 1 < KNOTS.length; i++) if (!flt(x, KNOTS[i][0]) && !flt(KNOTS[i + 1][0], x)) return i; return -1; };
  const segAt = (x) => { const i = segOf(x), [x0, y0] = KNOTS[i], [x1, y1] = KNOTS[i + 1];
    return fadd(y0, fmul(fdiv(fsub(y1, y0), fsub(x1, x0)), fsub(x, x0))); };

  /* the knots in the window and the point where the last segment in view leaves it */
  const inView = KNOTS.filter(([x]) => !flt(HX1, x));
  const exitY = segAt(HX1);

  /* each segment that meets the window: its largest gap and where, exactly */
  const SEGS = [];
  for (let i = 0; i + 1 < KNOTS.length && flt(KNOTS[i][0], HX1); i++) {
    const a = KNOTS[i][1], b = KNOTS[i + 1][1], m = fdiv(fadd(a, b), fr(2)), at = fmul(m, m);
    SEGS.push({ i, at, root: m, gap: fdiv(fmul(fsub(b, a), fsub(b, a)), fmul(fr(4), fadd(a, b))), inWindow: !flt(HX1, at) });
  }
  /* the flip: the largest gap reached inside the window. A segment whose peak lies past the window's edge has its gap
     in the window below its peak; the flip is decided only while every such peak is no larger (else this refuses). */
  const peaks = SEGS.filter((s) => s.inWindow).map((s) => s.gap);
  const FLIP = peaks.reduce((p, q) => (flt(p, q) ? q : p));
  if (SEGS.some((s) => !s.inWindow && flt(FLIP, s.gap))) throw new Error('grammar-hero: a segment cut by the window may peak above the flip; the flip is not decided');
  /* ε moves in whole Q-ths from 0 to twice the flip, so the flip sits at the ruler's middle */
  const KMAX = Number(fmul(fmul(FLIP, fr(2)), fr(Q))[0]);
  if (!feq(fmul(fmul(FLIP, fr(2)), fr(Q)), fr(KMAX))) throw new Error('grammar-hero: twice the flip is not a whole number of 1/' + Q + 'ths');
  const KFLIP = KMAX / 2;

  const eps = (k) => { if (!Number.isInteger(k) || k < 0) throw new Error('grammar-hero: ε moves in whole 1/' + Q + 'ths'); return fr(k, Q); };
  /* x refutes "s is within ε of √x" exactly when (s(x) + ε)² < x (s(x) + ε ≥ 0 on the window) */
  const refutes = (x, e) => flt(fmul(fadd(segAt(x), e), fadd(segAt(x), e)), x);
  /* the witnesses, in order: the hero's own x = 1/2, then each segment's peak in the window, the largest gap first */
  const CAND = [WX].concat(SEGS.filter((s) => s.inWindow).sort((p, q) => (flt(p.gap, q.gap) ? 1 : flt(q.gap, p.gap) ? -1 : 0)).map((s) => s.at));

  /* the claim at ε = k / Q, decided: { verdict, e, x, y, lines } (x, y, lines only when REFUTED) */
  function decide(k) {
    const e = eps(k), x = CAND.find((c) => refutes(c, e));
    /* the two must agree: a witness exists exactly below the flip */
    if (flt(e, FLIP) !== !!x) throw new Error('grammar-hero: the witness and the flip disagree at ε = ' + fstr(e));
    if (!x) return { verdict: 'HOLDS', k, e };
    const y = segAt(x), s = fstr(y);
    const lines = ['the segment at x = ' + fstr(x), 'reads ' + s + ', and',
      k === 0 ? '(' + s + ')² = ' + fstr(fmul(y, y)) + ', not ' + fstr(x) : '(' + s + ' + ' + fstr(e) + ')² < ' + fstr(x)];
    return { verdict: 'REFUTED', k, e, x, y, lines };
  }

  const API = { Q, KNOTS, HX1, WX, inView, exitY, SEGS, FLIP, KFLIP, KMAX, segAt, refutes, decide, eps,
    fr, fsub, fadd, fmul, fdiv, feq, flt, fnum, fstr };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.GX_HERO = API;
})(typeof self !== 'undefined' ? self : this);
