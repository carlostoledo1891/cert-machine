/* worker.js — the atlas's re-certification of one cell, off the page's thread.
   playground/return-level-atlas/ · cert-machine

   Concatenated after the bundle, so self.HSEVA.AT is instruments/hseva/atlas.js,
   the same bytes that wrote certs/hseva-atlas.json (and after the return-level
   check's printed.js, THE decision of a printed fit: see printed() below). Takes the cell's
   daily maxima (int16, raw units, one per UTC day from the corpus's first day),
   answers with the record — progress per block — and the page compares it with
   the ledger's, as JSON. Beside the record, and never inside it, the return-level
   plot: for each block the maxima at their plotting positions and each certified
   family's quantile over return periods from two blocks to 10,000 years, every
   point an enclosure from the certified box (fit.js returnLevel); and, on the bins
   and plotting positions the page sends, what each fit expects in a histogram and
   at each point of a QQ plot. And, STATISTICAL and labelled so on the page, the
   delta method's 95% interval (fit.js deltaLevel) along each certified family's
   curve and at its design-life level — asserted from the fit's sampling, never
   an enclosure, never in the record. The seventh family (the GEV) comes through
   the same watch as the six. */
/* THE PROFILE LIKELIHOOD of a return level, on demand — STATISTICAL, never an enclosure, never in the record. For the
   family's own coordinates, one parameter is eliminated so that the T-year level is x (the forms below, each the
   family's quantile solved for its location or scale); ℓp(x) is the likelihood maximised over the rest (Nelder–Mead in
   floats, warm-started along x); the 95% interval is where 2(ℓ̂ − ℓp(x)) ≤ 3.8415 (χ²₁), found by stepping out from the
   fitted level and bisecting. Asymptotic, blocks independent, the family right — and said so on the page. */
var CHI95 = 3.841458820694124;
function eliminate(FAM, name, p) {
  var o = self.HSEVA.FT.floatOps, z, v = -Math.log(-Math.log(p));
  switch (name) {
    case 'normal': z = o.PhiInv(p); return { free: [1], full: function (x, r) { return [x - r[0] * z, r[0]]; } };
    case 'lognormal': z = o.PhiInv(p); return { free: [1], full: function (x, r) { return [Math.log(x) - r[0] * z, r[0]]; } };
    case 'weibull': return { free: [0], full: function (x, r) { return [r[0], x / Math.pow(-Math.log1p(-p), 1 / r[0])]; } };
    case 'expweibull': return { free: [0, 1], full: function (x, r) { return [r[0], r[1], x / Math.pow(-Math.log1p(-Math.pow(p, 1 / r[0])), 1 / r[1])]; } };
    case 'expweibullG': return { free: [0, 1], full: function (x, r) {
      var k = r[0], T = r[1], u = Math.pow(x, k), lp = Math.log(p), be = u + T * Math.log(-lp);
      for (var i = 0; i < 40; i++) { var a = lp * Math.exp(-be / T), sv = Math.abs(a) < 1e-8 ? 1 + a / 2 : Math.expm1(a) / a, nb = u + T * (Math.log(-lp) + Math.log(sv)); if (Math.abs(nb - be) <= 1e-13 * Math.max(1, Math.abs(be))) { be = nb; break; } be = nb; }
      return [k, T, be]; } };
    case 'gengamma': return { free: [0, 1], full: function (x, r) { return [r[0], r[1], x / Math.pow(o.gammaPinv(r[0], p), 1 / r[1])]; } };
    case 'gengammaP': return { free: [1, 2], full: function (x, r) { var a = 1 / (r[1] * r[1]); return [Math.log(x) - r[0] * Math.log(o.gammaPinv(a, p) / a) / r[1], r[0], r[1]]; } };
    case 'gumbel': return { free: [1], full: function (x, r) { return [x + r[0] * Math.log(-Math.log(p)), r[0]]; } };
    case 'gev': return { free: [1, 2], full: function (x, r) { return [x - r[0] * v * FAM.gev.Ept(o, r[1] * v), r[0], r[1]]; } };
  }
  return null;
}
function profile(q) {
  var FT = self.HSEVA.FT, FAMS = self.HSEVA.FAM.FAMILIES, fam = FAMS[q.fam], o = FT.floatOps;
  var D = FT.prepare(q.x).Df, p = 1 - q.hours / (q.T * 8766), E = eliminate(FAMS, q.fam, p);
  if (!E || !(p > 0)) throw new Error('no profile for this family here');
  var signed = fam.signed || ['mu'], pos = E.free.map(function (i) { return signed.indexOf(fam.names[i]) < 0; });
  var ll = function (th) { var v; try { v = fam.loglik(o, th, D); } catch (e) { v = NaN; } return isFinite(v) ? v : -Infinity; };
  var th0 = q.theta.slice(), l0 = ll(th0), x0 = fam.quantile(o, th0, p);
  var enc = function (r) { return r.map(function (v, i) { return pos[i] ? Math.log(v) : v; }); }, dec = function (u) { return u.map(function (v, i) { return pos[i] ? Math.exp(v) : v; }); };
  var best = E.free.map(function (i) { return th0[i]; });
  /* ℓp at x: Nelder–Mead over the free parameters from the last optimum */
  function lp(x) {
    var f = function (u) { var th = E.full(x, dec(u)); return th.every(isFinite) ? -ll(th) : Infinity; };
    var n = best.length, S = [enc(best)]; for (var i = 0; i < n; i++) { var s0 = enc(best).slice(); s0[i] += 0.05; S.push(s0); }
    var V = S.map(f);
    for (var it = 0; it < 400; it++) {
      var ord = V.map(function (v, i) { return i; }).sort(function (a, b) { return V[a] - V[b]; }); S = ord.map(function (i) { return S[i]; }); V = ord.map(function (i) { return V[i]; });
      if (Math.abs(V[n] - V[0]) < 1e-10 * Math.max(1, Math.abs(V[0])) && it > 20) break;
      var c = []; for (var j = 0; j < n; j++) { var t = 0; for (var k = 0; k < n; k++) t += S[k][j]; c.push(t / n); }
      var R = c.map(function (cj, j) { return cj + (cj - S[n][j]); }), fr = f(R);
      if (fr < V[0]) { var X = c.map(function (cj, j) { return cj + 2 * (cj - S[n][j]); }), fx = f(X); if (fx < fr) { S[n] = X; V[n] = fx; } else { S[n] = R; V[n] = fr; } continue; }
      if (fr < V[n - 1]) { S[n] = R; V[n] = fr; continue; }
      var K = c.map(function (cj, j) { return cj + 0.5 * (S[n][j] - cj); }), fk = f(K);
      if (fk < V[n]) { S[n] = K; V[n] = fk; continue; }
      for (var i2 = 1; i2 <= n; i2++) { S[i2] = S[i2].map(function (v, j) { return S[0][j] + 0.5 * (v - S[0][j]); }); V[i2] = f(S[i2]); }
    }
    if (isFinite(V[0])) best = dec(S[0]);
    return -V[0];
  }
  var dev = function (x) { return 2 * (l0 - lp(x)); };
  var h0 = q.se && isFinite(q.se) && q.se > 0 ? q.se : 0.05 * x0, ends = [], saved = best.slice();
  for (var side = -1; side <= 1; side += 2) {
    best = saved.slice();
    var a = x0, b = null, h = h0, steps = 0;
    while (steps < 40) {
      var x = a + side * h; if (!(x > 0)) { x = a / 2; }
      var d = dev(x); steps++;
      self.postMessage({ kind: 'pstep', side: side, x: x, d: d });
      if (d >= CHI95) { b = x; break; }
      a = x; if (d < 0.5) h *= 2;
    }
    if (b === null) { ends.push(null); continue; }
    var lo = Math.min(a, b), hi = Math.max(a, b);
    for (var it2 = 0; it2 < 30 && hi - lo > 1e-4 * x0; it2++) { var mid = (lo + hi) / 2, dm = dev(mid); if ((dm >= CHI95) === (side > 0)) hi = mid; else lo = mid; }
    ends.push(side > 0 ? hi : lo);
  }
  return { x0: x0, lo: ends[0], hi: ends[1], chi: CHI95 };
}
/* the daily maxima the page sends: a cell's pinned int16 file, or a reader's own site cut to days on the page */
function seriesOf(q) {
  if (q.site) return { n: q.site.h.length, t: q.site.t, h: q.site.h, den: q.site.den, step: 24 };   /* by THE block rule, on the page */
  var v = new Int16Array(q.raw), t = new Array(v.length), h = new Array(v.length);
  var d0 = Date.parse(q.first + 'T00:00:00Z');
  for (var i = 0; i < v.length; i++) {
    if (!(v[i] > 0)) throw new Error('day ' + i + ' is not a positive value');
    t[i] = new Date(d0 + i * 86400000).toISOString().slice(0, 10); h[i] = v[i] / 500;
  }
  return { n: v.length, t: t, h: h, den: 500, step: 24 };
}
/* A FIT SOMEONE PRINTED for this place, decided by THE decision of the return-level check (printed.js, concatenated
   before this file): the printed family certified by fit.js certify() on the printed block of the same daily maxima —
   for the daily, weekly and monthly blocks the certificate the ledger records, for the annual block (not one of the
   paper's) certified here only — the lognormal beside the generalized gamma (its limit), and the printed digits decided
   against it. Digits that are not a member of the family are decided before anything is certified. Nothing is kept. */
function printed(q) {
  var H = self.HSEVA, P = self.HS_PRINTED, FT = H.FT, S = seriesOf(q), BM = H.BR.blockMaxima(S, q.block), T = [100, 1000];
  if (BM.n < 5) throw new Error('only ' + BM.n + ' blocks: too few to fit');
  var mx = -Infinity; for (var i = 0; i < BM.x.length; i++) if (BM.x[i] > mx) mx = BM.x[i];
  var base = { f: q.f, strs: q.strs, loc: q.loc, x: BM.x, hours: BM.hours, T: T };
  var pre = P.decide(H, Object.assign({ pending: 'certifying' }, base));
  if (pre.code === 'NOT A MEMBER OF THE FAMILY') return { code: pre.code, lines: pre.lines, n: BM.n, hours: BM.hours, max: mx, fit: null };
  var prepared = FT.prepare(BM.x);
  var fit = P.recordOf(H, FT.certify(q.f, BM.x, { prepared: prepared }), T, BM.hours);
  var ln = q.f === 'gengamma' ? P.recordOf(H, FT.certify('lognormal', BM.x, { prepared: prepared }), T, BM.hours) : null;
  var D = P.decide(H, Object.assign({ fit: fit, lognormal: ln }, base));
  return { code: D.code, lines: D.lines, n: BM.n, hours: BM.hours, max: mx, fit: fit.certified ? { theta: fit.theta, l100: fit.returnLevel[100], l1000: fit.returnLevel[1000] } : { why: fit.why, edge: fit.edge } };
}
self.onmessage = function (ev) {
  var q = ev.data;
  if (q && q.kind === 'profile') {
    try { self.postMessage({ kind: 'profile', result: profile(q) }); } catch (e) { self.postMessage({ kind: 'error', message: String((e && e.message) || e) }); }
    return;
  }
  if (q && q.kind === 'printed') {
    try { self.postMessage({ kind: 'printed', result: printed(q) }); } catch (e) { self.postMessage({ kind: 'error', message: String((e && e.message) || e) }); }
    return;
  }
  try {
    var S = seriesOf(q);
    var plot = {}, keep = {}, FT = self.HSEVA.FT;
    var onFit = function (blk, f, c, BM) {
      var P = plot[blk];
      if (!P) {
        var xs = Array.from(BM.x).sort(function (a, b) { return b - a; }), pts = [], n = xs.length;
        for (var k = 0; k < n; k++) if (k < 160 || k % Math.ceil(n / 240) === 0) pts.push([(n + 1) / (k + 1) * BM.hours / 8766, xs[k]]);
        P = plot[blk] = { hours: BM.hours, n: n, pts: pts, fam: {}, dll: {}, dllStat: {}, band: {} };
      }
      if (!c.ok) return;
      P.th = P.th || {}; P.th[f] = { fam: c.fam.name, theta: Array.from(c.theta) };
      (keep[blk] = keep[blk] || {})[f] = { c: c, hours: BM.hours };
      /* the design-life level (Rootzén & Katz 2013) in a climate that does not change: the level a structure standing L = 25 years
         meets with probability 10%, blocks independent — the return level at T = b / (8766 (1 − 0.9^(b / 8766L))) */
      var qd = -Math.expm1(Math.log(0.9) * BM.hours / (8766 * 25)), Td = BM.hours / (8766 * qd);
      try { P.dll[f] = FT.returnLevel(c, Td, BM.hours); } catch (e) { P.dll[f] = null; }
      var t0 = Math.log10(2 * BM.hours / 8766), L = [];
      for (var j = 0; j <= 32; j++) {
        var T = Math.pow(10, t0 + j * (4 - t0) / 32), v = null;
        try { v = FT.returnLevel(c, T, BM.hours); } catch (e) { v = null; }
        if (v && isFinite(v[0]) && isFinite(v[1])) L.push([T, v[0], v[1]]);
      }
      P.fam[f] = L;
      /* the histogram and the QQ plot, on the bins and plotting positions the page chose for the same maxima: what each
         certified fit expects — drawn from the certified point, its box being far narrower than any line */
      var ed = q.bins && q.bins[blk], pp = q.qqp && q.qqp[blk], nb = BM.n;
      if (ed) {
        var F = function (x) {
          try {
            if (!(x > 0)) { var z = c.fam.cdf(FT.floatOps, c.theta, 0); return isFinite(z) ? z : 0; }   /* the normal and the Gumbel put some mass below zero: it belongs to no bin */
            if (c.coords === 'expweibullG') {                     /* F = exp(−exp(β/θ + ln(−ln(1 − t)))), t = e^(−x^k/θ): finite for any α */
              var th = c.theta, t = Math.exp(-Math.pow(x, th[0]) / th[1]);
              return Math.exp(-Math.exp(th[2] / th[1] + Math.log(-Math.log1p(-t))));
            }
            var v = c.fam.cdf(FT.floatOps, c.theta, x); return isFinite(v) ? v : NaN;
          } catch (e) { return NaN; }
        };
        var ex = [], prev = F(ed[0]);
        for (var j = 1; j < ed.length; j++) { var cur = F(ed[j]); ex.push(nb * (cur - prev)); prev = cur; }
        P.hist = P.hist || { exp: {} }; P.hist.exp[f] = ex;
      }
      if (pp) {
        P.qq = P.qq || { q: {} };
        P.qq.q[f] = pp.map(function (p) { try { var v = c.fam.quantile(FT.floatOps, c.theta, p); return isFinite(v) ? v : null; } catch (e) { return null; } });
      }
    };
    /* atlas.js is left exactly as it wrote the ledger: the plot watches fit.js certify() from outside, returning every result untouched */
    var AT = self.HSEVA.AT, BR = self.HSEVA.BR, k = 0, BMs = {}, certify0 = FT.certify, rec;
    FT.certify = function (f, x, o) {
      var c = certify0(f, x, o), blk = AT.BLOCKS[k];
      try { if (!BMs[blk]) BMs[blk] = BR.blockMaxima(S, blk); if (BMs[blk].x.length === x.length) onFit(blk, f, c, BMs[blk]); } catch (e) { /* the plot is beside the record, never in it */ }
      return c;
    };
    try { rec = AT.cellRecord(q.id, S, function (blk) { k++; self.postMessage({ kind: 'progress', block: blk }); }); }
    finally { FT.certify = certify0; }
    /* STATISTICAL, beside the record: for the family Anderson–Darling decides and for the GEV, the delta method's 95%
       interval at twelve return periods (the plot's dashed band) and at the design-life level */
    AT.BLOCKS.forEach(function (blk) {
      var P = plot[blk], K = keep[blk] || {}, R = rec.blocks[blk];
      if (!P) return;
      [R.rank.ad, 'gev'].forEach(function (f) {
        var q2 = K[f]; if (!q2) return;
        var c = q2.c, h = q2.hours, t0 = Math.log10(2 * h / 8766), Bd = [];
        for (var jb = 0; jb <= 11; jb++) {
          var Tb = Math.pow(10, t0 + jb * (4 - t0) / 11), db = null;
          try { db = FT.deltaLevel(c, Tb, h); } catch (e) { db = null; }
          if (db && isFinite(db.lo) && isFinite(db.hi)) Bd.push([Tb, db.lo, db.hi]);
        }
        P.band[f] = Bd;
        var qd = -Math.expm1(Math.log(0.9) * h / (8766 * 25)), ds = null;
        try { ds = FT.deltaLevel(c, h / (8766 * qd), h); } catch (e) { ds = null; }
        P.dllStat[f] = ds ? [ds.lo, ds.hi] : null;
        if (f === R.rank.ad) [100, 1000].forEach(function (T) { var d = null; try { d = FT.deltaLevel(c, T, h); } catch (e) { d = null; } P['s' + T] = d ? [d.lo, d.hi] : null; });
        if (f === 'gev') { var dx = null; try { dx = FT.deltaParam(c, 2); } catch (e) { dx = null; } P.xiCI = dx ? [dx.lo, dx.hi] : null; }
      });
    });
    self.postMessage({ kind: 'done', record: rec, plot: plot, codes: AT.BLOCKS.map(function (b) { return AT.codes(rec.blocks[b]); }), ei: AT.extremalIndex ? AT.extremalIndex(S.h) : null });   /* the map's states, by the map's own rule */
  } catch (e) {
    self.postMessage({ kind: 'error', message: String((e && e.message) || e) });
  }
};
