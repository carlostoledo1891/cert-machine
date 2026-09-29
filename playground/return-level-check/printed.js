/* printed.js — THE decision of a fit someone printed, one module for every page that decides one: the return-level
   check (against the reader's series) and the return-level atlas (against a cell of the paper's hindcast, or a reader's
   own site, in its worker). Moved here from the check's app.js on 2026-09-29, its words unchanged; the GEV added, whose
   printed support is decided as a location's is. Loaded as a plain script (self.HS_PRINTED — a page, or a worker after
   the bundle) or required by Node; it holds no arithmetic of its own: fit.js printedBox, llAt and levelAt do the work.

   usage: HS_PRINTED.decide(HSEVA, q) -> { code, verdict, lines } (HTML), or throws on digits that are not plain decimals
     HSEVA  the bundle's { FT, FAM }, or { FT: require('fit.js'), FAM: require('families.js') }
     q = { f, strs: the parameters as printed, in PARAMS[f]'s order; loc: the location as printed, '' for none;
           x: the block maxima the fit is decided on; hours: the block's length;
           fit: the family's certified record on those values ({ certified, edge, why, coords, box, stacyBox, ewBox, ll,
                returnLevel: { T: [lo, hi] } }), or null when it was not among the families certified there;
           lognormal: the lognormal's record there (the generalized gamma's limit), or null;
           pending: the page's words when nothing is certified yet (then fit is ignored); T: [100, 1000] } */
(function (root) {
  'use strict';
  const fmt = (x) => Number(x).toLocaleString('en-US');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const FAMW = { normal: 'normal', lognormal: 'lognormal', weibull: 'Weibull', expweibull: 'exp. Weibull', gengamma: 'gen. gamma', gumbel: 'Gumbel', gev: 'GEV' };
  const SYM = { mu: 'μ', sigma: 'σ', k: 'k', lambda: 'λ', alpha: 'α', c: 'c', beta: 'β', q: 'Q', xi: 'ξ' };
  const PARAMS = {
    normal: [['mu', 'μ, the mean'], ['sigma', 'σ, the standard deviation']],
    lognormal: [['mu', 'μ, the mean of ln x (scipy: ln scale)'], ['sigma', 'σ (scipy: s)']],
    weibull: [['k', 'k, the shape (scipy: c)'], ['lambda', 'λ, the scale']],
    expweibull: [['alpha', 'α, the exponent (scipy: a)'], ['k', 'k, the shape (scipy: c)'], ['lambda', 'λ, the scale']],
    gengamma: [['alpha', 'α, the gamma shape (scipy: a)'], ['c', 'c, the power (scipy: c)'], ['lambda', 'λ, the scale']],
    gumbel: [['mu', 'μ, the location'], ['beta', 'β, the scale']],
    gev: [['mu', 'μ, the location'], ['sigma', 'σ, the scale'], ['xi', 'ξ, the shape (scipy: c = −ξ)']],
  };
  /* the families a location can be printed for: the normal, the Gumbel and the GEV carry their own */
  const LOCATED = (f) => !(f === 'normal' || f === 'gumbel' || f === 'gev');
  const DEC = /^-?\d+(\.\d+)?$/;
  /* each printed coordinate against the certified box: the box inside the printed digits'
     (they are its rounding), the digits inside the box (they agree as far as it resolves),
     the two apart, or straddling a rounding boundary */
  function relation(P, C) {
    if (C[1] < P[0] || P[1] < C[0]) return 'apart';
    if (P[0] <= C[0] && C[1] <= P[1]) return 'rounds';
    if (C[0] <= P[0] && P[1] <= C[1]) return 'within';
    return 'straddles';
  }
  /* the values the printed GEV leaves outside its support, 1 + ξ(x − μ)/σ > 0: [certainly, possibly], over the digits' box */
  function gevOutside(o, theta, x) {
    let certain = 0, possible = 0;
    for (const v of x) {
      const t = o.add(o.c(1), o.mul(theta[2], o.div(o.sub(o.c(v), theta[0]), theta[1])));
      if (t[1] <= 0) certain++;
      if (t[0] <= 0) possible++;
    }
    return [certain, possible];
  }
  function decide(H, q) {
    const FT = H.FT, FAMILIES = H.FAM.FAMILIES, f = q.f, P = PARAMS[f];
    if (!P) throw new Error('no printed form for the family ' + f);
    const strs = q.strs.map((s) => String(s).trim());
    if (strs.length !== P.length || strs.some((x) => !DEC.test(x))) throw new Error('type every parameter as a plain decimal, as printed');
    const theta = strs.map(FT.printedBox);
    const signed = FAMILIES[f].signed || ['mu'];
    const outside = P.filter(([k], i) => !signed.includes(k) && !(theta[i][0] > 0)).map(([k]) => SYM[k] || k);
    if (outside.length) {
      const v = '<b>NOT A MEMBER OF THE FAMILY</b> — ' + outside.join(' and ') + ' must be positive, and the printed digits allow ' + (outside.length > 1 ? 'values' : 'a value') + ' at or below zero. There is no ' + FAMW[f] + ' distribution to decide.';
      return { code: 'NOT A MEMBER OF THE FAMILY', verdict: v, lines: [v] };
    }
    const locStr = LOCATED(f) ? String(q.loc || '').trim() : '';
    if (locStr && !DEC.test(locStr)) throw new Error('type the location as a plain decimal');
    const loc = locStr && Number(locStr) !== 0 ? FT.printedBox(locStr) : null;
    const x = q.x, n = x.length;
    const { Di } = FT.prepare(x);
    const lines = [];
    const below = loc ? [x.filter((v) => v < loc[0]).length, x.filter((v) => v < loc[1]).length] : f === 'gev' ? gevOutside(FT.intervalOps, theta, x) : [0, 0];
    let ll = null, llWhy = null, verdict = null, code = null;
    if (below[0] > 0) { code = 'OUTSIDE ITS SUPPORT'; verdict = '<b>OUTSIDE ITS SUPPORT</b> — ' + fmt(below[0]) + ' of the ' + fmt(n) + ' values lie ' + (loc ? 'below the printed location' : 'beyond the printed GEV\'s end, where 1 + ξ(x − μ)/σ ≤ 0') + ': the fitted density is zero there, the log-likelihood minus infinity.'; }
    else if (below[1] > 0) { code = 'UNDECIDED AT THE PRINTED PRECISION'; verdict = '<b>UNDECIDED AT THE PRINTED PRECISION</b> — ' + (loc ? 'the location may lie above the smallest value' : 'the printed GEV\'s end may fall inside the values') + '; the digits cannot say.'; }
    else { try { ll = FT.llAt(f, theta, loc, Di); } catch (e) { llWhy = e.message; } if (!ll && !llWhy) llWhy = 'a value sits at the printed location'; }
    const F = q.pending ? null : q.fit, cert = F && F.certified ? F : null, LN = q.lognormal;
    const gap = (a, b) => (a - b).toPrecision(4);
    const reg = f === 'gev' ? ' (its regular maximum, ξ > −0.5: the GEV\'s likelihood has no global one)' : '';
    if (!verdict) {
      if (q.pending) verdict = q.pending;
      else if (!F) verdict = FAMW[f] + ' was not among the families certified on this block.';
      else if (!cert && F.edge && !loc && ll && LN && LN.certified && LN.ll && ll[1] < LN.ll[0]) { code = 'BELOW ITS LIMIT'; verdict = '<b>BELOW ITS LIMIT</b> — on these values the family\'s likelihood is proved to peak at its lognormal limit, and the printed point is at least ' + gap(LN.ll[0], ll[1]) + ' log-likelihood units below the lognormal\'s certified maximum, which the family approaches: it is not the family\'s best, only a point on the way.'; }
      else if (!cert) verdict = F.edge ? 'No maximum inside the family to compare with: on these values its likelihood is proved to peak at the lognormal limit (' + esc(F.why) + ')' + (LN && LN.certified ? '.' : '; certify the lognormal too, to compare the printed point with that limit.') : 'No maximum to compare with: the certificate refused ' + FAMW[f] + ' on this block (' + esc(F.why) + ').';
      else if (!loc) {
        /* a Prentice or a Gumbel-coordinate certificate, carried back to the printed coordinates — or null, where that box lies past the doubles */
        const cbox = cert.coords ? cert.stacyBox || cert.ewBox || null : cert.box;
        const rel = cbox ? theta.map((Pb, i) => relation(Pb, cbox[i])) : null;
        if (ll && cert.ll && ll[1] < cert.ll[0]) { code = 'OFF THE MAXIMUM'; verdict = '<b>OFF THE MAXIMUM</b> — its log-likelihood is at least ' + gap(cert.ll[0], ll[1]) + ' below the certified maximum of the same family on the same values' + reg + '.'; }
        else if (!rel) { code = 'NOT DECIDED'; verdict = '<b>NOT DECIDED</b> — the certified maximum is a box in ' + (cert.coords === 'gengammaP' ? 'Prentice\'s coordinates (μ, σ, Q)' : 'the Gumbel coordinates (k, θ = λᵏ, β = θ ln α)') + ', and carried back to the printed coordinates it lies past the largest or smallest double: the printed digits cannot be compared with it, and their likelihood is not separated from the maximum\'s.'; }
        else if (rel.includes('apart')) { code = 'NOT THE CERTIFIED FIT'; verdict = '<b>NOT THE CERTIFIED FIT</b> — the certified maximum' + reg + ' lies outside every value the printed digits allow (in ' + P.filter((p, i) => rel[i] === 'apart').map(([k]) => SYM[k] || k).join(', ') + ')' + (ll ? ', though the digits are too few to separate their likelihood from the maximum\'s.' : '.'); }
        else if (rel.every((r) => r === 'rounds')) { code = 'REPRODUCED'; verdict = '<b>REPRODUCED</b> — the printed digits are the rounding of the certified maximum-likelihood fit' + reg + '.'; }
        else if (rel.every((r) => r === 'rounds' || r === 'within')) { code = 'CONSISTENT'; verdict = '<b>CONSISTENT</b> — the printed digits lie inside the certified box: they agree with the maximum-likelihood fit' + reg + ' to every digit the certificate resolves.'; }
        else { code = 'NOT DECIDED'; verdict = '<b>NOT DECIDED</b> — the certified box straddles a rounding boundary of the printed digits (in ' + P.filter((p, i) => rel[i] === 'straddles').map(([k]) => SYM[k] || k).join(', ') + '): the maximum may or may not round to them.'; }
      } else if (ll && cert.ll && ll[1] < cert.ll[0]) { code = 'BELOW A MEMBER OF ITS OWN FAMILY'; verdict = '<b>BELOW A MEMBER OF ITS OWN FAMILY</b> — the fit with the location at zero, certified on the same values, is at least ' + gap(cert.ll[0], ll[1]) + ' log-likelihood units more likely: the printed point is not the family\'s most likely member.'; }
      else if (ll && cert.ll && ll[0] > cert.ll[1]) { code = 'A DIFFERENT MODEL'; verdict = '<b>A DIFFERENT MODEL</b> — the printed location raises the log-likelihood by at least ' + gap(ll[0], cert.ll[1]) + ' over the certified fit at location zero. With a free location the likelihood has no maximum to certify (it is unbounded), so this page decides the printed point only against that fit.'; }
      else { code = 'NOT DECIDED'; verdict = '<b>NOT DECIDED</b> — with a location the printed fit is a different model from the one certified here (location zero), and the printed digits do not separate the two likelihoods.'; }
    }
    lines.push(verdict);
    for (const T of q.T || [100, 1000]) {
      try {
        const L = FT.levelAt(f, theta, loc, T, q.hours);
        lines.push(T + '-year level over every value the printed digits allow: [' + L[0].toFixed(3) + ', ' + L[1].toFixed(3) + '] m' + (cert && cert.returnLevel && cert.returnLevel[T] ? '; the certified fit\'s' + (loc ? ' (the family at location zero)' : '') + ': ' + Number(cert.returnLevel[T][1]).toFixed(3) + ' m' : '') + '.');
      } catch (e) { /* a level the box cannot enclose is left out */ }
    }
    if (ll) lines.push('log-likelihood over the printed box: [' + ll[0].toFixed(3) + ', ' + ll[1].toFixed(3) + ']' + (cert && cert.ll ? '; the certified maximum: [' + cert.ll[0].toFixed(3) + ', ' + cert.ll[1].toFixed(3) + ']' : '') + '.');
    else if (llWhy && !below[1]) lines.push('The log-likelihood cannot be enclosed over the printed box: ' + esc(llWhy) + '.');
    return { code, verdict, lines };
  }
  /* a certificate as the decision reads it, from fit.js certify()'s result (the lognormal's too) — for a worker that
     certifies and decides in one place; ll over the certified box when the certificate did not carry it */
  function recordOf(H, c, T, hours) {
    if (!c.ok) return { certified: false, edge: !!c.edge, why: c.why };
    let ll = c.ll || null;
    if (!ll) try { ll = c.fam.loglik(H.FT.intervalOps, c.box, c.Di); } catch (e) { ll = null; }
    const rl = {};
    for (const t of T || [100, 1000]) { try { rl[t] = H.FT.returnLevel(c, t, hours); } catch (e) { rl[t] = null; } }
    return { certified: true, coords: c.coords || null, box: c.box, stacyBox: c.stacyBox || null, ewBox: c.ewBox || null, ll, returnLevel: rl, theta: Array.from(c.theta) };
  }
  const API = { decide, recordOf, relation, PARAMS, SYM, FAMW, LOCATED, DEC };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.HS_PRINTED = API;
})(typeof self !== 'undefined' ? self : this);
