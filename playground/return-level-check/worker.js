/* worker.js — the return-level check's heavy half, run off the page's thread.
   playground/return-level-check/ · cert-machine

   Concatenated after the bundle (the ledger's own modules, byte for byte), so
   self.HSEVA is the code that certified certs/hseva-ledger.json. Takes a series
   and the declared method, answers with every fit certified or refused, every
   criterion and level as an enclosure, and the four rankings by THE rule
   (fit.js rankRule). Posts progress per family; posts plain data only. */
self.onmessage = function (ev) {
  var q = ev.data;
  var FT = self.HSEVA.FT, FAM = self.HSEVA.FAM, BR = self.HSEVA.BR;
  try {
    var BM = BR.blockMaxima({ n: q.t.length, t: q.t, h: q.h, step: q.step }, q.block);
    if (BM.n < 5) throw new Error('only ' + BM.n + ' blocks: too few to fit');
    var prepared = FT.prepare(BM.x);
    var fits = {}, entries = [];
    var mx = -Infinity; for (var i = 0; i < BM.x.length; i++) if (BM.x[i] > mx) mx = BM.x[i];
    q.families.forEach(function (f, i) {
      self.postMessage({ kind: 'progress', family: f, i: i, of: q.families.length, n: BM.n });
      var t0 = Date.now();
      var c = FT.certify(f, BM.x, { prepared: prepared });
      if (!c.ok) {
        fits[f] = { certified: false, edge: !!c.edge, why: c.why, stop: c.theta || null, seconds: (Date.now() - t0) / 1000 };
        entries.push({ family: f, refused: true, edge: !!c.edge });
        return;
      }
      var cr = FT.criteria(c, q.den);
      var ll = c.fam.loglik(FT.intervalOps, c.box, c.Di);   /* the certificate's own coordinates */
      var rl = {};
      q.T.forEach(function (T) { rl[T] = FT.returnLevel(c, T, BM.hours); });
      fits[f] = { certified: true, names: c.names, coords: c.coords || null, stacy: c.stacy || null, stacyBox: c.stacyBox || null, theta: c.theta, box: c.box, maxRad: c.maxRad, rounds: c.rounds, ll: ll,
        criteria: { ad: cr.ad, ks: cr.ks, mse: cr.mse, chi2: { value: cr.chi2.value, refused: !!cr.chi2.refused, why: cr.chi2.why || null, bins: cr.chi2.bins || null, kept: cr.chi2.kept || null } },
        returnLevel: rl, seconds: (Date.now() - t0) / 1000 };
      entries.push({ family: f, ad: cr.ad, ks: cr.ks, mse: cr.mse, chi2: cr.chi2.value, chi2Refused: !!cr.chi2.refused });
    });
    var rankings = {};
    ['ad', 'ks', 'mse', 'chi2'].forEach(function (k) { rankings[k] = FT.rankRule(entries, k); });
    self.postMessage({ kind: 'done', block: q.block, hours: BM.hours, n: BM.n, max: mx, fits: fits, rankings: rankings });
  } catch (e) {
    self.postMessage({ kind: 'error', message: String((e && e.message) || e) });
  }
};
