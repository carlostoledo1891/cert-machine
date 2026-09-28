/* worker.js — the atlas's re-certification of one cell, off the page's thread.
   playground/return-level-atlas/ · cert-machine

   Concatenated after the bundle, so self.HSEVA.AT is instruments/hseva/atlas.js,
   the same bytes that wrote certs/hseva-atlas.json. Takes the cell's
   daily maxima (int16, raw units, one per UTC day from the corpus's first day),
   answers with the record — progress per block — and the page compares it with
   the ledger's, as JSON. Beside the record, and never inside it, the return-level
   plot: for each block the maxima at their plotting positions and each certified
   family's quantile over return periods from two blocks to 10,000 years, every
   point an enclosure from the certified box (fit.js returnLevel); and, on the bins
   and plotting positions the page sends, what each fit expects in a histogram and
   at each point of a QQ plot. */
self.onmessage = function (ev) {
  var q = ev.data;
  try {
    var v = new Int16Array(q.raw), t = new Array(v.length), h = new Array(v.length);
    var d0 = Date.parse(q.first + 'T00:00:00Z');
    for (var i = 0; i < v.length; i++) {
      if (!(v[i] > 0)) throw new Error('day ' + i + ' is not a positive value');
      t[i] = new Date(d0 + i * 86400000).toISOString().slice(0, 10); h[i] = v[i] / 500;
    }
    var S = { n: v.length, t: t, h: h, den: 500, step: 24 };
    var plot = {}, FT = self.HSEVA.FT;
    var onFit = function (blk, f, c, BM) {
      var P = plot[blk];
      if (!P) {
        var xs = Array.from(BM.x).sort(function (a, b) { return b - a; }), pts = [], n = xs.length;
        for (var k = 0; k < n; k++) if (k < 160 || k % Math.ceil(n / 240) === 0) pts.push([(n + 1) / (k + 1) * BM.hours / 8766, xs[k]]);
        P = plot[blk] = { hours: BM.hours, n: n, pts: pts, fam: {}, dll: {} };
      }
      if (!c.ok) return;
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
    self.postMessage({ kind: 'done', record: rec, plot: plot, codes: AT.BLOCKS.map(function (b) { return AT.codes(rec.blocks[b]); }) });   /* the map's states, by the map's own rule */
  } catch (e) {
    self.postMessage({ kind: 'error', message: String((e && e.message) || e) });
  }
};
