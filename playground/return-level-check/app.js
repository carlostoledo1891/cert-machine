/* app.js — the return-level check, in the tab.
   playground/return-level-check/ · cert-machine

   Reads a series the reader drops (or the embedded hindcast preset), runs the
   ledger's own code on it in a Web Worker (worker.js after the bundle), shows
   every fit certified or refused and every criterion and level as an
   enclosure, and writes the certificate the reader can download. The second
   panel decides a fit someone printed, against the same series and block.
   Nothing is sent anywhere: there is no request in this file. */
(function () {
  'use strict';
  const S = JSON.parse(document.getElementById('rc-spec').textContent);
  const BUNDLE = document.getElementById('rc-bundle').textContent;
  const WORKER = document.getElementById('rc-worker').textContent;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = (x) => Number(x).toLocaleString('en-US');
  const FAMW = { normal: 'normal', lognormal: 'lognormal', weibull: 'Weibull', expweibull: 'exp. Weibull', gengamma: 'gen. gamma', gumbel: 'Gumbel' };
  const BLK = { native: 'the series itself', daily: 'daily maxima', weekly: 'weekly maxima (ISO)', monthly: 'monthly maxima', annual: 'annual maxima' };
  const CRN = { ad: 'Anderson–Darling', ks: 'Kolmogorov–Smirnov', mse: 'MSE', chi2: 'χ²' };
  const PARAMS = {
    normal: [['mu', 'μ, the mean'], ['sigma', 'σ, the standard deviation']],
    lognormal: [['mu', 'μ, the mean of ln x (scipy: ln scale)'], ['sigma', 'σ (scipy: s)']],
    weibull: [['k', 'k, the shape (scipy: c)'], ['lambda', 'λ, the scale']],
    expweibull: [['alpha', 'α, the exponent (scipy: a)'], ['k', 'k, the shape (scipy: c)'], ['lambda', 'λ, the scale']],
    gengamma: [['alpha', 'α, the gamma shape (scipy: a)'], ['c', 'c, the power (scipy: c)'], ['lambda', 'λ, the scale']],
    gumbel: [['mu', 'μ, the location'], ['beta', 'β, the scale']],
  };
  /* the bundle on this thread too, for the printed-fit check */
  const main = document.createElement('script');
  main.src = URL.createObjectURL(new Blob([BUNDLE], { type: 'text/javascript' }));
  document.head.appendChild(main);

  let series = null, last = null, busy = false;

  /* ---- reading a series: a timestamp at the start of each line, the value the n-th number after it ---- */
  const TS = /^\s*(\d{4})-(\d{2})-(\d{2})(?:[T\s\-_]+(\d{1,2})(?::(\d{2})(?::\d{2}(?:\.\d+)?)?)?)?(?:Z|[+-]\d{2}:?\d{2})?/;
  const NUM = /-?\d+(?:\.(\d+))?/g;
  function parse(text, col) {
    const t = [], h = []; let dropped = 0, skipped = 0, decimals = 0;
    for (const line of text.split(/\r?\n/)) {
      const m = TS.exec(line);
      if (!m) { if (line.trim()) skipped++; continue; }
      const rest = line.slice(m[0].length);
      NUM.lastIndex = 0; let hit = null;
      for (let k = 0; k < col; k++) { hit = NUM.exec(rest); if (!hit) break; }
      if (!hit || /^[eE]/.test(rest.slice(NUM.lastIndex))) { dropped++; continue; }
      const v = Number(hit[0]);
      if (!(v > 0)) { dropped++; continue; }
      decimals = Math.max(decimals, hit[1] ? hit[1].length : 0);
      t.push(m[1] + '-' + m[2] + '-' + m[3] + 'T' + (m[4] ? m[4].padStart(2, '0') : '00') + ':' + (m[5] || '00'));
      h.push(v);
    }
    if (t.length < 20) throw new Error('fewer than twenty lines read as a timestamp and a positive value');
    /* the native step: the most common gap, in hours */
    const gaps = new Map();
    for (let i = 1; i < t.length; i++) { const g = (Date.parse(t[i] + 'Z') - Date.parse(t[i - 1] + 'Z')) / 3600000; if (g > 0) gaps.set(g, (gaps.get(g) || 0) + 1); }
    let step = null, best = 0; for (const [g, c] of gaps) if (c > best) { best = c; step = g; }
    if (!(step > 0)) throw new Error('the timestamps do not advance');
    return { t, h, n: h.length, den: Math.pow(10, decimals), decimals, step, dropped, skipped };
  }
  async function digest(bytes) {
    try { const d = await crypto.subtle.digest('SHA-256', bytes); return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, '0')).join(''); }
    catch (e) { return null; }
  }
  function describe() {
    const s = series;
    $('rc-data').innerHTML = '<div class="k">the series</div><div class="v">' + esc(s.name) + '</div>'
      + '<div class="n">' + fmt(s.n) + ' values, ' + esc(s.t[0].replace('T', ' ')) + ' to ' + esc(s.t[s.n - 1].replace('T', ' ')) + ' UTC, every ' + s.step + ' h; '
      + (s.den === 500 ? 'exact multiples of 1/500 m' : s.decimals + ' decimals') + (s.dropped ? '; ' + fmt(s.dropped) + (s.dropped === 1 ? ' line' : ' lines') + ' without a positive value dropped' : '')
      + (s.skipped ? '; ' + fmt(s.skipped) + (s.skipped === 1 ? ' line' : ' lines') + ' without a timestamp skipped' : '') + '.<br>sha256 ' + (s.sha256 ? '<span class="mono">' + s.sha256.slice(0, 16) + '…</span>' : 'unavailable in this context') + ' — the certificate carries this digest, never the data.</div>';
    $('rc-run').disabled = false;
  }
  async function readFile(file) {
    const buf = await file.arrayBuffer();
    const text = new TextDecoder().decode(buf);
    try {
      const s = parse(text, Number($('rc-col').value) || 1);
      s.name = file.name; s.sha256 = await digest(buf); s.source = 'a file read by this browser';
      series = s; last = null; describe(); clearResults();
    } catch (e) { $('rc-data').innerHTML = '<div class="k">the series</div><div class="n">REFUSED: ' + esc(e.message) + '</div>'; }
  }
  async function usePreset() {
    const P = S.preset; if (!P) return;
    const raw = Uint8Array.from(atob(P.b64), (ch) => ch.charCodeAt(0));
    const v = new Int16Array(raw.buffer);
    const t0 = Date.parse(P.start + ':00Z'), t = [], h = [];
    for (let i = 0; i < v.length; i++) { const d = new Date(t0 + i * P.step * 3600000).toISOString(); t.push(d.slice(0, 16)); h.push(v[i] / 500); }
    series = { t, h, n: h.length, den: 500, decimals: 3, step: P.step, dropped: 0, skipped: 0, name: P.name, sha256: await digest(raw), source: P.source };
    last = null; describe(); clearResults();
  }
  function clearResults() { $('rc-results').innerHTML = ''; $('rc-verdict').innerHTML = ''; $('rc-download').disabled = true; $('rc-check-out').innerHTML = ''; }

  /* ---- the run, off the thread ---- */
  const g = (a, d) => (a ? Number(a[1]).toPrecision(d || 6) : '—');
  const title = (a) => (a ? 'enclosure [' + a[0] + ', ' + a[1] + ']' : '');
  function run() {
    if (!series || busy) return;
    busy = true; $('rc-run').disabled = true; clearResults();
    const block = $('rc-block').value;
    const families = S.families.filter((f) => $('rc-f-' + f).checked);
    const w = new Worker(URL.createObjectURL(new Blob([BUNDLE + '\n' + WORKER], { type: 'text/javascript' })));
    const t0 = Date.now();
    w.onmessage = (ev) => {
      const m = ev.data;
      if (m.kind === 'progress') { $('rc-progress').textContent = 'certifying ' + FAMW[m.family] + ' (' + (m.i + 1) + ' of ' + m.of + ') on ' + fmt(m.n) + ' ' + BLK[block] + ' …'; return; }
      w.terminate(); busy = false; $('rc-run').disabled = false;
      if (m.kind === 'error') { $('rc-progress').textContent = 'REFUSED: ' + m.message; return; }
      $('rc-progress').textContent = 'done in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s';
      last = Object.assign({ block, families, when: new Date().toISOString() }, m);
      render();
    };
    w.postMessage({ t: series.t, h: series.h, den: series.den, step: series.step, block, families, T: S.T });
  }
  function render() {
    const R = last, rows = [];
    for (const f of R.families) {
      const F = R.fits[f];
      if (!F.certified) { rows.push('<tr><td>' + FAMW[f] + '</td><td colspan="8" title="' + esc(F.why) + '">' + (F.edge ? 'no maximum — ' : 'REFUSED — ') + esc(F.why) + '</td></tr>'); continue; }
      const c = F.criteria, chi = c.chi2.value ? g(c.chi2.value) : (c.chi2.refused ? 'REFUSED' : 'undefined');
      rows.push('<tr><td>' + FAMW[f] + '</td><td class="n" title="' + esc(F.names.join(', ') + ' = ' + F.theta.map((x) => x.toPrecision(8)).join(', ')) + '">' + F.maxRad.toExponential(1) + '</td>'
        + '<td class="n" title="' + title(c.ad) + '">' + g(c.ad) + '</td><td class="n" title="' + title(c.ks) + '">' + g(c.ks, 5) + '</td><td class="n" title="' + title(c.mse) + '">' + g(c.mse, 5) + '</td><td class="n" title="' + esc(c.chi2.value ? title(c.chi2.value) : (c.chi2.why || '')) + '">' + chi + '</td>'
        + S.T.map((T) => '<td class="n" title="' + title(F.returnLevel[T]) + '">' + (F.returnLevel[T] ? Number(F.returnLevel[T][1]).toFixed(2) : '—') + '</td>').join('') + '</tr>');
    }
    $('rc-results').innerHTML = '<div class="tw"><table><thead><tr><th>family</th><th>box half-width</th><th>A²</th><th>KS</th><th>MSE</th><th>χ²</th>' + S.T.map((T) => '<th>' + T + '-yr Hs, m</th>').join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'
      + '<p class="rc-note">' + fmt(R.n) + ' values (' + BLK[R.block] + ', b = ' + R.hours + ' h); the largest ' + R.max + ' m. Each number is the upper end of its enclosure; hover for the enclosure. A level is F⁻¹(1 − b/(T·8766)).</p>';
    const lines = ['ad', 'ks', 'mse', 'chi2'].map((k) => {
      const r = R.rankings[k];
      return '<div><span class="k">' + CRN[k] + '</span> ' + (r.verdict === 'DECIDED' ? '<b>DECIDED</b> — ' + FAMW[r.best] : '<b>REFUSED</b> — ' + esc(r.why || '')) + (r.excluded ? ' <span class="n">(no maximum, left out: ' + r.excluded.map((f) => FAMW[f]).join(', ') + ')</span>' : '') + '</div>';
    });
    const ad = R.rankings.ad, best = ad.verdict === 'DECIDED' ? R.fits[ad.best] : null;
    $('rc-verdict').innerHTML = (best ? '<div class="word">' + FAMW[ad.best] + ': ' + S.T.map((T) => (best.returnLevel[T] ? Number(best.returnLevel[T][1]).toFixed(2) + ' m at ' + T + ' years' : '')).filter(Boolean).join(', ') + '</div>' : '<div class="word">no decided choice</div>')
      + '<div class="why">the family Anderson–Darling decides, as the paper selects; its levels are enclosures narrower than a millimetre, printed at their upper end. The sampling uncertainty of a long return level is statistical and is not in them.</div>' + lines.join('');
    $('rc-download').disabled = false;
  }
  function certificate() {
    const R = last, s = series;
    return {
      what: 'A certificate of maximum-likelihood marginal fits, written by /instruments/return-level-check/ in the reader\'s browser. Each certified fit is a box the Krawczyk operator proved to hold exactly one zero of the score; every criterion and return level is an enclosure over that box; each ranking is DECIDED or REFUSED by the rule in fit.js. Check it by re-running the named code on data with the named sha256.',
      data: { name: s.name, source: s.source, sha256: s.sha256, n: s.n, first: s.t[0], last: s.t[s.n - 1], stepHours: s.step, exactDenominator: s.den, dropped: s.dropped },
      method: { families: R.families, block: R.block, blockHours: R.hours, blockValues: R.n, criteria: ['ad', 'ks', 'mse', 'chi2'], selection: 'ad', returnPeriods: S.T, hoursPerYear: 8766, location: 'fixed at zero (the families as Reis, Guimarães et al. 2026 print them)' },
      code: S.modules, fits: R.fits, rankings: R.rankings, generated: R.when,
    };
  }
  function download() {
    if (!last) return;
    const blob = new Blob([JSON.stringify(certificate(), null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'return-level-certificate-' + last.block + '.json'; document.body.appendChild(a); a.click(); a.remove();
  }

  /* ---- a fit someone printed, decided against the same series and block ---- */
  function fillParams() {
    const f = $('rc-cf').value;
    $('rc-cp').innerHTML = PARAMS[f].map(([k, lab]) => '<div><label for="rc-p-' + k + '">' + esc(lab) + '</label><input id="rc-p-' + k + '" type="text" inputmode="decimal" placeholder="as printed"></div>').join('')
      + (f === 'normal' || f === 'gumbel' ? '' : '<div><label for="rc-p-loc">location (blank: none)</label><input id="rc-p-loc" type="text" inputmode="decimal" placeholder="as printed"></div>');
  }
  function check() {
    const out = $('rc-check-out');
    if (!series) { out.innerHTML = 'Choose a series first.'; return; }
    if (!self.HSEVA) { out.innerHTML = 'The code is still loading.'; return; }
    const FT = self.HSEVA.FT, BR = self.HSEVA.BR;
    const f = $('rc-cf').value, block = $('rc-block').value;
    try {
      const strs = PARAMS[f].map(([k]) => $('rc-p-' + k).value.trim());
      if (strs.some((x) => !/^-?\d+(\.\d+)?$/.test(x))) throw new Error('type every parameter as a plain decimal, as printed');
      const theta = strs.map(FT.printedBox);
      const locStr = $('rc-p-loc') ? $('rc-p-loc').value.trim() : '';
      if (locStr && !/^-?\d+(\.\d+)?$/.test(locStr)) throw new Error('type the location as a plain decimal');
      const loc = locStr && Number(locStr) !== 0 ? FT.printedBox(locStr) : null;
      const BM = BR.blockMaxima({ n: series.n, t: series.t, h: series.h, step: series.step }, block);
      const { Di } = FT.prepare(BM.x);
      const lines = [];
      const below = loc ? [BM.x.filter((x) => x < loc[0]).length, BM.x.filter((x) => x < loc[1]).length] : [0, 0];
      let ll = null;
      if (below[0] > 0) lines.push('<b>OUTSIDE ITS SUPPORT</b> — ' + fmt(below[0]) + ' of the ' + fmt(BM.n) + ' values lie below the printed location: the fitted density is zero there, the log-likelihood minus infinity.');
      else if (below[1] > 0) lines.push('<b>UNDECIDED AT THE PRINTED PRECISION</b> — the location may lie above the smallest value; the digits cannot say.');
      else { try { ll = FT.llAt(f, theta, loc, Di); } catch (e) { lines.push('the log-likelihood cannot be enclosed over the printed box: ' + esc(e.message)); } }
      const cert = last && last.block === block && last.fits[f] && last.fits[f].certified ? last.fits[f] : null;
      if (cert && !loc) {
        const cbox = f === 'gengamma' && cert.stacyBox ? cert.stacyBox : cert.box;     /* a Prentice certificate, carried back to (α, c, λ) */
        const inside = cbox.every((b, i) => theta[i][0] <= b[0] && b[1] <= theta[i][1]);
        if (inside) lines.push('<b>REPRODUCED</b> — the printed digits are the rounding of the certified maximum-likelihood fit.');
        else if (ll && ll[1] < cert.ll[0]) lines.push('<b>OFF THE MAXIMUM</b> — its log-likelihood is at least ' + (cert.ll[0] - ll[1]).toPrecision(4) + ' below the certified maximum of the same family on the same values.');
        else lines.push('<b>NOT DECIDED</b> — not the rounding of the certified fit, and the printed digits are too few to separate its likelihood from the maximum\'s.');
      } else if (cert && loc && ll && ll[1] < cert.ll[0]) lines.push('<b>BELOW A MEMBER OF ITS OWN FAMILY</b> — the fit with the location at zero is at least ' + (cert.ll[0] - ll[1]).toPrecision(4) + ' more likely, so the printed point is not a maximum of anything.');
      else if (!cert) lines.push(last && last.block === block ? 'Run the certificate first: ' + FAMW[f] + ' has no certified fit on this block (' + esc((last.fits[f] && last.fits[f].why) || 'not run') + ').' : 'Run the certificate on this block to compare against the maximum.');
      for (const T of S.T) { try { const L = FT.levelAt(f, theta, loc, T, BM.hours); lines.push(T + '-year level over every value the printed digits allow: [' + L[0].toFixed(3) + ', ' + L[1].toFixed(3) + '] m' + (cert && cert.returnLevel[T] ? '; the certified fit\'s' + (loc ? ' (the family at location zero)' : '') + ': ' + Number(cert.returnLevel[T][1]).toFixed(3) + ' m' : '') + '.'); } catch (e) { /* a level the box cannot enclose is left out */ } }
      if (ll) lines.push('log-likelihood over the printed box: [' + ll[0].toFixed(3) + ', ' + ll[1].toFixed(3) + ']' + (cert ? '; the certified maximum: [' + cert.ll[0].toFixed(3) + ', ' + cert.ll[1].toFixed(3) + ']' : '') + '.');
      out.innerHTML = lines.map((l) => '<div>' + l + '</div>').join('');
    } catch (e) { out.innerHTML = 'REFUSED: ' + esc(e.message); }
  }

  /* ---- wiring ---- */
  $('rc-file').addEventListener('change', (e) => { if (e.target.files[0]) readFile(e.target.files[0]); });
  const drop = $('rc-drop');
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); if (e.dataTransfer.files[0]) readFile(e.dataTransfer.files[0]); });
  if ($('rc-preset')) $('rc-preset').addEventListener('click', usePreset);
  $('rc-run').addEventListener('click', run);
  $('rc-download').addEventListener('click', download);
  $('rc-cf').addEventListener('change', fillParams);
  $('rc-check').addEventListener('click', check);
  fillParams();
})();
