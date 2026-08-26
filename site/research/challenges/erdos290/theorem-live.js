/* theorem-live.js — the interactive half of theorem.js: the five proof lines and the three
 * falsifiers of the 4k(k+1) law, packaged as PURE FUNCTIONS so one implementation serves two
 * runtimes. In Node it requires galois-exceptions.js beside it; in the browser it receives the
 * SAME bytes of galois-exceptions.js, spliced verbatim into the page by build-page.js and
 * exposed as a module table — there is no second implementation of any arithmetic anywhere
 * (C50; the page battery asserts the spliced bytes equal this tree's bytes).
 *
 * The mathematics is theorem.js's, line for line — see its header for the proof and the
 * published theorem it rests on (Altmann et al. 2020, Thm 2.4; Chen–Chin–Tan arXiv:2210.10257,
 * Prop. 2.8). theorem.js stays the SCRIPT (it runs the exhaustive even-d ≤ 80 sweep and is
 * pinned by the preprint's deposit manifest); this module is the per-degree interactive form.
 * The small helpers (isSquare, fact, compose, fdCoeffsOffByOne) are carried from theorem.js;
 * the identity expressions are the same exact-integer identities at one degree d.
 *
 * Timing, measured 2026-08-12 (Node, M2): the full five-line check at d = 40 costs ~95 ms +
 * one extra discExact for line (2)'s composition — the page's d-slider cap of EVEN d ≤ 40
 * keeps every press under ~1 s with margin. All arithmetic is BigInt; no floats exist here.
 */
'use strict';
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const path = require('path');
    module.exports = factory(require(path.join(__dirname, 'galois-exceptions.js')));
  } else {
    root.THEOREM_LIVE = factory(root.__ERDOS_MODULES['galois-exceptions.js']);
  }
}(typeof self !== 'undefined' ? self : this, function (G) {
  const { fdCoeffs, discExact, pairPoly } = G;

  function isSquare(n) {
    if (n < 0n) return false;
    if (n < 2n) return true;
    let x = n, y = (x + 1n) / 2n;
    while (y < x) { x = y; y = (x + n / x) / 2n; }
    return x * x === n;
  }
  function fact(n) { let f = 1n; for (let i = 2n; i <= BigInt(n); i++) f *= i; return f; }
  function compose(h) {                        /* h(x^2) */
    const out = new Array(2 * (h.length - 1) + 1).fill(0n);
    for (let i = 0; i < h.length; i++) out[2 * i] = h[i];
    return out;
  }
  /* f_d with the index running from 1 — the WRONG polynomial, kept as a pressable mistake
     (falsifier F3), exactly as theorem.js keeps it as a tested control. */
  function fdCoeffsOffByOne(d) {
    let P = [1n];
    for (let j = 1; j <= d; j++) {
      const nx = new Array(P.length + 1).fill(0n);
      for (let k = 0; k < P.length; k++) { nx[k + 1] += P[k]; nx[k] -= BigInt(j) * P[k]; }
      P = nx;
    }
    const out = new Array(d).fill(0n);
    for (let i = 1; i <= d; i++) {
      const q = new Array(d).fill(0n); let carry = 0n;
      for (let k = d; k >= 1; k--) { q[k - 1] = P[k] + carry; carry = BigInt(i) * q[k - 1]; }
      for (let k = 0; k < d; k++) out[k] += q[k];
    }
    return out;
  }

  /* The five lines of the proof at ONE even degree d, each an exact integer identity.
     Returns [{ id, name, ok, detail }] in proof order. Throws only on odd/invalid d. */
  function checkLines(d) {
    if (d % 2 !== 0 || d < 2) throw new Error('checkLines: even d >= 2 required');
    const l = d / 2;
    const f = fdCoeffs(d);
    const h = pairPoly(f, l);
    const df = discExact(f), dh = discExact(h);
    const sign = (l % 2 === 0 ? 1n : -1n);

    const h0want = sign * fact(l) * fact(l);
    const line1 = h[0] === h0want;

    const lhs2 = discExact(compose(h));
    const rhs2 = sign * (2n ** BigInt(2 * l)) * h[l] * h[0] * dh * dh;
    const line2 = lhs2 === rhs2 && h[l] === BigInt(d + 1);

    const rhs3 = BigInt(d + 1) * ((2n ** BigInt(l)) * fact(l) * dh) ** 2n;
    const line3 = df === rhs3;

    const sd1 = isSquare(BigInt(d + 1)), sdf = isSquare(df);
    const line4 = dh !== 0n && sd1 === sdf;

    const r = intSqrt(BigInt(d + 1));
    const isLaw = sd1 && r % 2n === 1n;
    const k = isLaw ? (r - 1n) / 2n : null;
    const line5 = sd1 ? (isLaw && BigInt(d) === 4n * k * (k + 1n)) : true;

    return [
      { id: 'L1', name: 'h(0) = (−1)^l (l!)²', ok: line1,
        detail: 'h(0) has ' + String(h[0]).length + ' digits' },
      { id: 'L2', name: 'disc(h(x²)) = (−1)^l 2^{2l} lead(h) h(0) disc(h)², lead(h) = d+1',
        ok: line2, detail: 'both sides recomputed exactly' },
      { id: 'L3', name: 'disc(f_d) = (d+1)(2^l · l! · disc h)²', ok: line3,
        detail: 'disc(f_d) has ' + String(df).length + ' digits' },
      { id: 'L4', name: 'disc(h) ≠ 0 and: disc(f_d) square ⇔ d+1 square', ok: line4,
        detail: 'd+1 ' + (sd1 ? 'IS' : 'is NOT') + ' a square; disc(f_d) ' + (sdf ? 'IS' : 'is NOT') },
      { id: 'L5', name: sd1 ? ('d+1 = ' + r + '² so d = 4k(k+1) with k = ' + k) : 'd+1 not square: degree excluded',
        ok: line5, detail: sd1 ? 'the law’s member at k = ' + k : 'no drop possible at d = ' + d },
    ];
  }

  function intSqrt(n) {
    if (n < 2n) return n;
    let x = n, y = (x + 1n) / 2n;
    while (y < x) { x = y; y = (x + n / x) / 2n; }
    return x;
  }

  /* The three falsifiers of theorem.js at one degree: each mutation must BREAK its line.
     Returns { which, broken, diedAt, explain } — broken === true is the healthy outcome. */
  function falsify(d, which) {
    if (d % 2 !== 0 || d < 2) throw new Error('falsify: even d >= 2 required');
    const l = d / 2;
    const f = fdCoeffs(d);
    const h = pairPoly(f, l);
    const df = discExact(f), dh = discExact(h);
    if (which === 'F1') {
      const holds = df === BigInt(d + 1) * ((2n ** BigInt(l)) * fact(l) * (dh + 1n)) ** 2n;
      return { which, broken: !holds, diedAt: 'line (3)',
        explain: 'disc h ↦ disc h + 1: the exact identity misses on the spot — one unit in a ' +
                 String(df).length + '-digit integer is not survivable' };
    }
    if (which === 'F2') {
      const holds = df === BigInt(d + 2) * ((2n ** BigInt(l)) * fact(l) * dh) ** 2n;
      return { which, broken: !holds, diedAt: 'line (3)',
        explain: '(d+1) ↦ (d+2): the leading-coefficient factor is load-bearing, not decoration' };
    }
    if (which === 'F3') {
      const w = fdCoeffsOffByOne(8);
      let evenOk = false;
      try { pairPoly(w, 4); evenOk = true; } catch (e) { evenOk = false; }
      const broken = (w.length - 1 === 7) && !evenOk && !isSquare(discExact(w));
      return { which, broken, diedAt: 'the setup itself',
        explain: 'index from 1: degree drops to 7, f(x+4) is not even, disc(f) is not square — ' +
                 'the mistake that was briefly in a submission text, kept pressable. This control ' +
                 'runs at d = 8, the degree theorem.js pins — the slider does not govern it' };
    }
    throw new Error('falsify: unknown falsifier ' + which);
  }

  /* The exceptional-degrees table: even d ≤ dMax, the 4k(k+1) membership test evaluated
     exactly (isSquare(d+1) + odd root), no discriminants — instant at dMax = 120. */
  function lawTable(dMax) {
    const rows = [];
    for (let d = 2; d <= dMax; d += 2) {
      const r = intSqrt(BigInt(d + 1));
      const member = r * r === BigInt(d + 1) && r % 2n === 1n;
      rows.push({ d, member, k: member ? Number((r - 1n) / 2n) : null });
    }
    return rows;
  }

  /* ---- the narrowing figure's two live checks, as pure functions over the page's own
     committed D literal (rows [K, lo, hi]) and COND — the same assertions narrowing.js makes
     at generation time, now runnable on a button press. No arithmetic beyond comparisons:
     the rows are certified data, the checks are their claimed properties. */
  function bracketChecks(rows, cond) {
    let widen = null, escape = null;
    for (let i = 0; i < rows.length; i++) {
      const w = rows[i][2] - rows[i][1];
      if (i > 0 && w > rows[i - 1][2] - rows[i - 1][1] + 1e-15) { widen = i; break; }
    }
    for (let i = 0; i < rows.length; i++) {
      if (!(rows[i][1] <= cond && cond <= rows[i][2])) { escape = i; break; }
    }
    return {
      monotone: { ok: widen === null,
        detail: widen === null ? 'width never increases across ' + rows.length + ' brackets'
                               : 'bracket ' + widen + ' is WIDER than its predecessor' },
      containment: { ok: escape === null,
        detail: escape === null ? 'every bracket contains the conditional value'
                                : 'bracket ' + escape + ' [' + rows[escape][1] + ', ' + rows[escape][2] +
                                  '] does NOT contain ' + cond },
    };
  }

  /* One perturbed copy: row idx's upper end raised by 2^-exp — a bracket that quietly
     WIDENED by one part in 2^exp. Containment cannot see a lie this small (the margins are
     ~10^-3); the monotone check can, because consecutive certified widths are frequently
     EQUAL, so any positive widening breaks "knowing more never widens". That asymmetry —
     which check catches the small lie — is itself worth showing on the page. */
  function perturbRow(rows, idx, exp) {
    const out = rows.map(r => r.slice());
    out[idx][2] = out[idx][2] + Math.pow(2, -exp);
    return out;
  }

  return { checkLines, falsify, lawTable, bracketChecks, perturbRow,
           isSquare, fact, compose, fdCoeffsOffByOne };
}));
