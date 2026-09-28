/* app.js — the return-level check, in the tab.
   playground/return-level-check/ · cert-machine

   Reads a series the reader drops (or the embedded hindcast preset), runs the
   ledger's own code on it in a Web Worker (worker.js after the bundle), shows
   every fit certified or refused and every criterion and level as an
   enclosure, and writes the certificate the reader can download. The second
   panel decides a fit someone printed, against the same series and block.
   The file is read here and sent nowhere: there is no request in this file.

   parse() below is THE parse rule. This file's sha256 goes into every
   certificate beside the ledger modules', so a checker reads the same bytes
   into the same series. A certificate is written only from the series its run
   was given: loading another file or changing the field stops the run. */
(function () {
  'use strict';
  const S = JSON.parse(document.getElementById('rc-spec').textContent);
  const BUNDLE = document.getElementById('rc-bundle').textContent;
  const WORKER = document.getElementById('rc-worker').textContent;
  const WURL = URL.createObjectURL(new Blob([BUNDLE + '\n' + WORKER], { type: 'text/javascript' }));
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = (x) => Number(x).toLocaleString('en-US');
  const plural = (n, one, many) => fmt(n) + ' ' + (n === 1 ? one : many);
  const FAMW = { normal: 'normal', lognormal: 'lognormal', weibull: 'Weibull', expweibull: 'exp. Weibull', gengamma: 'gen. gamma', gumbel: 'Gumbel' };
  const BLK = { native: 'the series itself', daily: 'daily maxima', weekly: 'weekly maxima (ISO)', monthly: 'monthly maxima', annual: 'annual maxima' };
  const CRN = { ad: 'Anderson–Darling', ks: 'Kolmogorov–Smirnov', mse: 'MSE', chi2: 'χ²' };
  const SYM = { mu: 'μ', sigma: 'σ', k: 'k', lambda: 'λ', alpha: 'α', c: 'c', beta: 'β', q: 'Q' };
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

  let loaded = null, series = null, last = null, worker = null, loadTok = 0;

  /* ---- reading a series: THE parse rule ----
     A line opens with its timestamp: YYYY-MM-DD, then an hour after 'T', '-' or
     '_' (2004-03-01T06, 2004-03-01-06), or after a space, comma or semicolon only
     when a colon follows it (2004-03-01 06:00) — so "2004-03-01 3.549" is a date
     and a value, never hour 3. Minutes and seconds are optional; a zone after the
     time (Z, UTC, +03:00, -0300, -03) is applied, so every time is UTC. A
     timestamp that runs into other characters skips the line. The rest of the
     line is split into fields at spaces, tabs, commas, semicolons and bars; Hs is
     field `col`, a decimal (an exponent allowed). Dropped and counted: a field
     that is not a number, NDBC's missing marks 99, 999 and 9999 (any decimals),
     and a value not above zero. The lines are put in time order; a time given
     twice with the same value is kept once, and with two values refuses the file.
     The exact denominator is 10^d, d the most decimals any kept value carries. */
  const TS = /^\s*(\d{4})-(\d{2})-(\d{2})(?:(?:[T_-]|[\s,;]+(?=\d{1,2}:))(\d{1,2})(?::(\d{2})(?::(\d{2})(?:\.\d+)?)?)?(Z|[+-]\d{2}(?::?\d{2})?|\s*(?:UTC|GMT)\b)?)?/;
  const SEP = /[\s,;|]+/;
  const NUM = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?$/;
  const FILL = /^\+?9{2,4}(?:\.0*)?$/;
  function decimalsOf(tok) {
    const m = /^[^eE]*?\.(\d+)/.exec(tok), e = /[eE]([-+]?\d+)$/.exec(tok);
    return Math.max(0, (m ? m[1].length : 0) - (e ? Number(e[1]) : 0));
  }
  function parse(text, col) {
    const c = { skipped: 0, unreadable: 0, notNumber: 0, fill: 0, notPositive: 0, repeated: 0, zoned: 0 };
    const rows = []; let first = null;
    for (const line of text.split(/\r\n|\r|\n/)) {
      const m = TS.exec(line);
      if (!m) { if (line.trim()) c.skipped++; continue; }
      const after = line.charAt(m[0].length);
      if (after && !/[\s,;|]/.test(after)) { c.unreadable++; continue; }
      const y = +m[1], mo = +m[2], d = +m[3], hh = m[4] ? +m[4] : 0, mi = m[5] ? +m[5] : 0, ss = m[6] ? +m[6] : 0;
      let ms = Date.UTC(y, mo - 1, d, hh, mi, ss);
      const D = new Date(ms);
      if (D.getUTCFullYear() !== y || D.getUTCMonth() !== mo - 1 || D.getUTCDate() !== d || D.getUTCHours() !== hh || mi > 59 || ss > 59) { c.unreadable++; continue; }
      const z = m[7] ? m[7].trim() : '';
      if (z && z !== 'Z' && z !== 'UTC' && z !== 'GMT') {
        const zm = /^([+-])(\d{2}):?(\d{2})?$/.exec(z);
        const off = (zm[1] === '-' ? -1 : 1) * (Number(zm[2]) * 60 + Number(zm[3] || 0));
        if (off) { ms -= off * 60000; c.zoned++; }
      }
      const fields = line.slice(m[0].length).split(SEP).filter(Boolean);
      const tok = fields[col - 1];
      if (!first) first = { ts: m[0].trim(), fields: fields.slice(0, 12).map((f) => f.slice(0, 16)), more: fields.length > 12, pick: tok === undefined ? null : tok.slice(0, 16) };
      if (tok === undefined || !NUM.test(tok)) { c.notNumber++; continue; }
      if (FILL.test(tok)) { c.fill++; continue; }
      const v = Number(tok);
      if (!(v > 0) || !Number.isFinite(v)) { c.notPositive++; continue; }
      rows.push({ ms, v, dec: decimalsOf(tok) });
    }
    if (!first) throw new Error('no line opens with a timestamp YYYY-MM-DD');
    if (rows.length < 20) throw new Error('fewer than twenty lines hold a timestamp and a positive number in field ' + col + ' (' + fmt(rows.length) + ' do)');
    let reordered = false;
    for (let i = 1; i < rows.length; i++) if (rows[i].ms < rows[i - 1].ms) { reordered = true; break; }
    if (reordered) rows.sort((a, b) => a.ms - b.ms);
    const t = [], h = [], ms = []; let clashes = 0, clash = null, decimals = 0;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (i && r.ms === rows[i - 1].ms) { if (r.v === rows[i - 1].v) c.repeated++; else { clashes++; if (clash === null) clash = r.ms; } continue; }
      t.push(new Date(r.ms).toISOString().slice(0, 19)); h.push(r.v); ms.push(r.ms); decimals = Math.max(decimals, r.dec);
    }
    if (clashes) throw new Error(plural(clashes, 'time is', 'times are') + ' given twice with different values (the first at ' + new Date(clash).toISOString().slice(0, 16).replace('T', ' ') + ' UTC): is the hour in a field of its own?');
    if (h.every((v) => v === h[0])) throw new Error('every value in field ' + col + ' is ' + h[0] + ': is Hs in another field?');
    /* the native step: the most common gap, in hours */
    const gaps = new Map();
    for (let i = 1; i < ms.length; i++) { const g = (ms[i] - ms[i - 1]) / 3600000; gaps.set(g, (gaps.get(g) || 0) + 1); }
    let step = null, best = 0; for (const [g, k] of gaps) if (k > best) { best = k; step = g; }
    return { t, h, n: h.length, den: Number('1e' + decimals), decimals, step, counts: c, reordered, first, col };
  }
  async function digest(bytes) {
    try { const d = await crypto.subtle.digest('SHA-256', bytes); return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, '0')).join(''); }
    catch (e) { return null; }
  }

  /* ---- the series on screen ---- */
  function describe() {
    const s = series, C = s.counts || {};
    const drops = [], skips = [], notes = [];
    if (C.notNumber) drops.push(plural(C.notNumber, 'line', 'lines') + ' whose field ' + s.col + ' is not a number');
    if (C.fill) drops.push(plural(C.fill, 'missing mark', 'missing marks') + ' (99, 999, 9999)');
    if (C.notPositive) drops.push(plural(C.notPositive, 'value', 'values') + ' not above zero');
    if (C.repeated) drops.push(plural(C.repeated, 'repeated line', 'repeated lines'));
    if (C.skipped) skips.push(plural(C.skipped, 'line', 'lines') + ' without a timestamp');
    if (C.unreadable) skips.push(plural(C.unreadable, 'line', 'lines') + ' whose timestamp runs into other characters or names no real time');
    if (C.zoned) notes.push(plural(C.zoned, 'time', 'times') + ' moved to UTC from the zone written with them');
    if (s.reordered) notes.push('the lines put in time order');
    let html = '<div class="k">the series</div><div class="v">' + esc(s.name) + '</div><div class="n">'
      + fmt(s.n) + ' values, ' + esc(s.t[0].slice(0, 16).replace('T', ' ')) + ' to ' + esc(s.t[s.n - 1].slice(0, 16).replace('T', ' ')) + ' UTC, every ' + s.step + ' h; '
      + (s.preset ? 'exact multiples of 1/500 m' : s.decimals ? s.decimals + ' decimals' : 'whole numbers') + '.';
    if (drops.length) html += ' Dropped: ' + drops.join('; ') + '.';
    if (skips.length) html += ' Skipped: ' + skips.join('; ') + '.';
    if (notes.length) html += ' Also: ' + notes.join('; ') + '.';
    if (s.first) {
      const F = s.first;
      html += '<br>Hs is field ' + s.col + ' after the timestamp. The first line: <span class="mono">' + esc(F.ts) + '</span> &rarr; '
        + F.fields.map((f, i) => (i === s.col - 1 ? '<b class="mono">' + esc(f) + '</b>' : '<span class="mono">' + esc(f) + '</span>')).join(' &middot; ')
        + (F.more ? ' &hellip;' : '') + (s.col > 12 && F.pick !== null ? ' field ' + s.col + ': <b class="mono">' + esc(F.pick) + '</b>' : '');
    }
    html += '<br>sha256 ' + (s.sha256 ? '<span class="mono">' + s.sha256.slice(0, 16) + '…</span>' : 'unavailable in this context') + ' — the certificate carries this digest, never the data.</div>';
    $('rc-data').innerHTML = html;
  }
  function endRun() { if (worker) { worker.terminate(); worker = null; } $('rc-run').disabled = !series; }
  function clearResults() { $('rc-results').innerHTML = ''; $('rc-verdict').innerHTML = ''; $('rc-download').disabled = true; $('rc-check-out').innerHTML = ''; }
  function setSeries(s) {
    const stopped = !!worker;
    series = s; last = null; endRun(); clearResults(); describe();
    $('rc-progress').textContent = stopped ? 'The run in progress was stopped: the series changed.' : '';
  }
  function refuse(msg, name) {
    const stopped = !!worker;
    series = null; last = null; endRun(); clearResults();
    $('rc-data').innerHTML = '<div class="k">the series</div>' + (name ? '<div class="v">' + esc(name) + '</div>' : '') + '<div class="n">REFUSED: ' + esc(msg) + '</div>';
    $('rc-progress').textContent = stopped ? 'The run in progress was stopped: the series changed.' : '';
  }
  async function readFile(file) {
    const tok = ++loadTok;
    let buf; try { buf = await file.arrayBuffer(); } catch (e) { if (tok === loadTok) refuse('the file could not be read', file.name); return; }
    const sha256 = await digest(buf);
    if (tok !== loadTok) return;                          /* a later file or the preset has taken its place */
    loaded = { kind: 'file', name: file.name, text: new TextDecoder().decode(buf), sha256 };
    reparse();
  }
  function reparse() {
    if (!loaded || loaded.kind !== 'file') return;
    const col = Number($('rc-col').value) || 1;
    try { setSeries(Object.assign(parse(loaded.text, col), { name: loaded.name, sha256: loaded.sha256, source: 'a file read by this browser' })); }
    catch (e) { refuse(e.message, loaded.name); }
  }
  async function usePreset() {
    const P = S.preset; if (!P) return;
    const tok = ++loadTok;
    const raw = Uint8Array.from(atob(P.b64), (ch) => ch.charCodeAt(0));
    const v = new Int16Array(raw.buffer);
    const t0 = Date.parse(P.start + ':00Z'), t = [], h = [];
    for (let i = 0; i < v.length; i++) { t.push(new Date(t0 + i * P.step * 3600000).toISOString().slice(0, 16)); h.push(v[i] / 500); }
    const sha256 = await digest(raw);
    if (tok !== loadTok) return;
    loaded = { kind: 'preset' };
    setSeries({ t, h, n: h.length, den: 500, decimals: 3, step: P.step, counts: {}, name: P.name, sha256, source: P.source, preset: true });
  }

  /* ---- the run, off the thread ---- */
  const g = (a, d) => (a ? Number(a[1]).toPrecision(d || 6) : '—');
  const title = (a) => (a ? 'enclosure [' + a[0] + ', ' + a[1] + ']' : '');
  const halfWidth = (box) => Math.max.apply(null, box.map((b) => (b[1] - b[0]) / 2));
  const lengthWords = (m) => (m < 0.001 ? (m * 1000).toPrecision(2) + ' mm' : m.toPrecision(2) + ' m');
  function run() {
    if (!series || worker) return;
    const s = series, block = $('rc-block').value;
    const families = S.families.filter((f) => $('rc-f-' + f).checked);
    if (!families.length) { $('rc-progress').textContent = 'Choose at least one family.'; return; }
    clearResults();
    const w = worker = new Worker(WURL);
    $('rc-run').disabled = true;
    const t0 = Date.now();
    w.onmessage = (ev) => {
      if (w !== worker) return;                           /* a run the series has since replaced */
      const m = ev.data;
      if (m.kind === 'progress') { $('rc-progress').textContent = 'certifying ' + FAMW[m.family] + ' (' + (m.i + 1) + ' of ' + m.of + ') on ' + fmt(m.n) + ' ' + BLK[block] + ' …'; return; }
      endRun();
      if (m.kind === 'error') { $('rc-progress').textContent = 'REFUSED: ' + m.message; return; }
      $('rc-progress').textContent = 'done in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s';
      last = Object.assign({ series: s, block, families, when: new Date().toISOString() }, m);
      render();
    };
    w.onerror = (e) => { if (w !== worker) return; endRun(); $('rc-progress').textContent = 'The run failed in the worker: ' + ((e && e.message) || 'no message'); };
    w.postMessage({ t: s.t, h: s.h, den: s.den, step: s.step, block, families, T: S.T });
  }
  function render() {
    const R = last, rows = [], ncol = 6 + S.T.length;
    for (const f of R.families) {
      const F = R.fits[f];
      if (!F.certified) { rows.push('<tr><td>' + FAMW[f] + '</td><td colspan="' + (ncol - 1) + '" title="' + esc(F.why) + '">' + (F.edge ? 'at its lognormal limit, left out — ' : 'REFUSED — ') + esc(F.why) + '</td></tr>'); continue; }
      const c = F.criteria, chi = c.chi2.value ? g(c.chi2.value) : (c.chi2.refused ? 'REFUSED' : 'not defined');
      const fin = (v) => v && v.every((x) => Number.isFinite(x) && x !== 0), own = F.names.map((nm) => SYM[nm] || nm).join(', ') + ' = ' + F.theta.map((x) => x.toPrecision(8)).join(', ');
      const par = F.stacy ? (fin(F.stacy) ? 'α, c, λ = ' + F.stacy.map((x) => x.toPrecision(8)).join(', ') + ' (certified in Prentice\'s ' + F.names.map((nm) => SYM[nm] || nm).join(', ') + ')' : own + ' (Prentice\'s coordinates; in α, c, λ it lies past the doubles)')
        : F.ew ? (fin(F.ew) ? 'α, k, λ = ' + F.ew.map((x) => x.toPrecision(8)).join(', ') + ' (certified in the Gumbel coordinates k, θ = λ^k, β = θ ln α)' : own + ' (the Gumbel coordinates; α or λ lies past the doubles)') : own;
      rows.push('<tr><td>' + FAMW[f] + '</td><td class="n" title="' + esc(par) + '">' + halfWidth(F.box).toExponential(1) + '</td>'
        + '<td class="n" title="' + title(c.ad) + '">' + g(c.ad) + '</td><td class="n" title="' + title(c.ks) + '">' + g(c.ks, 5) + '</td><td class="n" title="' + title(c.mse) + '">' + g(c.mse, 5) + '</td><td class="n" title="' + esc(c.chi2.value ? title(c.chi2.value) : (c.chi2.why || '')) + '">' + chi + '</td>'
        + S.T.map((T) => '<td class="n" title="' + title(F.returnLevel[T]) + '">' + (F.returnLevel[T] ? Number(F.returnLevel[T][1]).toFixed(2) : '—') + '</td>').join('') + '</tr>');
    }
    $('rc-results').innerHTML = '<div class="tw"><table><thead><tr><th>family</th><th>box half-width</th><th>A²</th><th>KS</th><th>MSE</th><th>χ²</th>' + S.T.map((T) => '<th>' + T + '-yr Hs, m</th>').join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'
      + '<p class="rc-note">' + fmt(R.n) + ' values (' + BLK[R.block] + ', b = ' + R.hours + ' h); the largest ' + R.max + ' m. Each number is the upper end of its enclosure; hover for the enclosure, and on the half-width for the parameters. A level is F⁻¹(1 − b/(T·8766)).</p>';
    const lines = ['ad', 'ks', 'mse', 'chi2'].map((k) => {
      const r = R.rankings[k];
      return '<div><span class="k">' + CRN[k] + '</span> ' + (r.verdict === 'DECIDED' ? '<b>DECIDED</b> — ' + FAMW[r.best] : '<b>REFUSED</b> — ' + esc(r.why || '')) + (r.excluded ? ' <span class="n">(left out: ' + r.excluded.map((f) => FAMW[f]).join(', ') + ', proved to peak at its lognormal limit, which the lognormal stands for)</span>' : '') + '</div>';
    });
    const ad = R.rankings.ad, best = ad.verdict === 'DECIDED' ? R.fits[ad.best] : null;
    let head;
    if (best) {
      const widest = Math.max.apply(null, S.T.map((T) => (best.returnLevel[T] ? best.returnLevel[T][1] - best.returnLevel[T][0] : 0)));
      head = '<div class="word">' + FAMW[ad.best] + ': ' + S.T.map((T) => (best.returnLevel[T] ? Number(best.returnLevel[T][1]).toFixed(2) + ' m at ' + T + ' years' : '')).filter(Boolean).join(', ') + '</div>'
        + '<div class="why">The family Anderson–Darling decides, as the paper selects. Its levels are enclosures no wider than ' + lengthWords(widest) + ', printed at their upper end. The sampling uncertainty of a long return level is statistical and is not in them.</div>';
    } else head = '<div class="word">no decided choice</div><div class="why">Anderson–Darling does not decide a family on this block: ' + esc(ad.why || '') + '. No level is named.</div>';
    $('rc-verdict').innerHTML = head + lines.join('');
    $('rc-download').disabled = false;
  }
  function certificate() {
    const R = last, s = R.series;
    return {
      what: 'A certificate of maximum-likelihood marginal fits, written by /instruments/return-level-check/ in the reader\'s browser. Each certified fit is a box the Krawczyk operator proved to hold exactly one zero of the score, over which the log-likelihood\'s Hessian is proved negative definite, so that zero is the likelihood\'s one maximum in the box; every criterion and return level is an enclosure over that box. A generalized gamma refused at its lognormal limit (edge) carries the proof that its likelihood falls as Q grows from 0 next to the lognormal fit (boundary); any other refusal blocks the rankings. Each ranking is DECIDED or REFUSED by the rule in fit.js. Check it by reading the file with the named sha256 by the named parse rule (app.js) and re-running the named code.',
      data: { name: s.name, source: s.source, sha256: s.sha256, field: s.col || null, n: s.n, first: s.t[0], last: s.t[s.n - 1], stepHours: s.step, exactDenominator: s.den, reordered: !!s.reordered, counts: s.counts || {} },
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
  const DEC = /^-?\d+(\.\d+)?$/;
  function fillParams() {
    const f = $('rc-cf').value;
    $('rc-cp').innerHTML = PARAMS[f].map(([k, lab]) => '<div><label for="rc-p-' + k + '">' + esc(lab) + '</label><input id="rc-p-' + k + '" type="text" inputmode="decimal" placeholder="as printed"></div>').join('')
      + (f === 'normal' || f === 'gumbel' ? '' : '<div><label for="rc-p-loc">location (blank: none)</label><input id="rc-p-loc" type="text" inputmode="decimal" placeholder="as printed"></div>');
  }
  /* each printed coordinate against the certified box: the box inside the printed digits'
     (they are its rounding), the digits inside the box (they agree as far as it resolves),
     the two apart, or straddling a rounding boundary */
  function relation(P, C) {
    if (C[1] < P[0] || P[1] < C[0]) return 'apart';
    if (P[0] <= C[0] && C[1] <= P[1]) return 'rounds';
    if (C[0] <= P[0] && P[1] <= C[1]) return 'within';
    return 'straddles';
  }
  function check() {
    const out = $('rc-check-out');
    if (!series) { out.innerHTML = 'Choose a series first.'; return; }
    if (!self.HSEVA) { out.innerHTML = 'The code is still loading.'; return; }
    const FT = self.HSEVA.FT, BR = self.HSEVA.BR, FAMILIES = self.HSEVA.FAM.FAMILIES;
    const f = $('rc-cf').value, block = $('rc-block').value, s = series;
    try {
      const strs = PARAMS[f].map(([k]) => $('rc-p-' + k).value.trim());
      if (strs.some((x) => !DEC.test(x))) throw new Error('type every parameter as a plain decimal, as printed');
      const theta = strs.map(FT.printedBox);
      const signed = FAMILIES[f].signed || ['mu'];
      const outside = PARAMS[f].filter(([k], i) => !signed.includes(k) && !(theta[i][0] > 0)).map(([k]) => SYM[k] || k);
      if (outside.length) { out.innerHTML = '<div><b>NOT A MEMBER OF THE FAMILY</b> — ' + outside.join(' and ') + ' must be positive, and the printed digits allow ' + (outside.length > 1 ? 'values' : 'a value') + ' at or below zero. There is no ' + FAMW[f] + ' distribution to decide.</div>'; return; }
      const locStr = $('rc-p-loc') ? $('rc-p-loc').value.trim() : '';
      if (locStr && !DEC.test(locStr)) throw new Error('type the location as a plain decimal');
      const loc = locStr && Number(locStr) !== 0 ? FT.printedBox(locStr) : null;
      const BM = BR.blockMaxima({ n: s.n, t: s.t, h: s.h, step: s.step }, block);
      const { Di } = FT.prepare(BM.x);
      const lines = [];
      const below = loc ? [BM.x.filter((x) => x < loc[0]).length, BM.x.filter((x) => x < loc[1]).length] : [0, 0];
      let ll = null, llWhy = null, verdict = null;
      if (below[0] > 0) verdict = '<b>OUTSIDE ITS SUPPORT</b> — ' + fmt(below[0]) + ' of the ' + fmt(BM.n) + ' values lie below the printed location: the fitted density is zero there, the log-likelihood minus infinity.';
      else if (below[1] > 0) verdict = '<b>UNDECIDED AT THE PRINTED PRECISION</b> — the location may lie above the smallest value; the digits cannot say.';
      else { try { ll = FT.llAt(f, theta, loc, Di); } catch (e) { llWhy = e.message; } if (!ll && !llWhy) llWhy = 'a value sits at the printed location'; }
      const R = last && last.series === s && last.block === block ? last : null;
      const F = R ? R.fits[f] : null, cert = F && F.certified ? F : null;
      const gap = (a, b) => (a - b).toPrecision(4);
      if (!verdict) {
        if (!R) verdict = 'Certify this series on this block first (step 3): the printed fit is decided against that certificate.';
        else if (!F) verdict = FAMW[f] + ' was not among the families certified on this block.';
        else if (!cert && F.edge && !loc && ll && R.fits.lognormal && R.fits.lognormal.certified && R.fits.lognormal.ll && ll[1] < R.fits.lognormal.ll[0]) verdict = '<b>BELOW ITS LIMIT</b> — on these values the family\'s likelihood is proved to peak at its lognormal limit, and the printed point is at least ' + gap(R.fits.lognormal.ll[0], ll[1]) + ' log-likelihood units below the lognormal\'s certified maximum, which the family approaches: it is not the family\'s best, only a point on the way.';
        else if (!cert) verdict = F.edge ? 'No maximum inside the family to compare with: on these values its likelihood is proved to peak at the lognormal limit (' + esc(F.why) + ')' + (R.fits.lognormal && R.fits.lognormal.certified ? '.' : '; certify the lognormal too, to compare the printed point with that limit.') : 'No maximum to compare with: the certificate refused ' + FAMW[f] + ' on this block (' + esc(F.why) + ').';
        else if (!loc) {
          /* a Prentice or a Gumbel-coordinate certificate, carried back to the printed coordinates — or null, where that box lies past the doubles */
          const cbox = cert.coords ? cert.stacyBox || cert.ewBox || null : cert.box;
          const rel = cbox ? theta.map((P, i) => relation(P, cbox[i])) : null;
          if (ll && cert.ll && ll[1] < cert.ll[0]) verdict = '<b>OFF THE MAXIMUM</b> — its log-likelihood is at least ' + gap(cert.ll[0], ll[1]) + ' below the certified maximum of the same family on the same values.';
          else if (!rel) verdict = '<b>NOT DECIDED</b> — the certified maximum is a box in ' + (cert.coords === 'gengammaP' ? 'Prentice\'s coordinates (μ, σ, Q)' : 'the Gumbel coordinates (k, θ = λᵏ, β = θ ln α)') + ', and carried back to the printed coordinates it lies past the largest or smallest double: the printed digits cannot be compared with it, and their likelihood is not separated from the maximum\'s.';
          else if (rel.includes('apart')) verdict = '<b>NOT THE CERTIFIED FIT</b> — the certified maximum lies outside every value the printed digits allow (in ' + PARAMS[f].filter((p, i) => rel[i] === 'apart').map(([k]) => SYM[k] || k).join(', ') + ')' + (ll ? ', though the digits are too few to separate their likelihood from the maximum\'s.' : '.');
          else if (rel.every((r) => r === 'rounds')) verdict = '<b>REPRODUCED</b> — the printed digits are the rounding of the certified maximum-likelihood fit.';
          else if (rel.every((r) => r === 'rounds' || r === 'within')) verdict = '<b>CONSISTENT</b> — the printed digits lie inside the certified box: they agree with the maximum-likelihood fit to every digit the certificate resolves.';
          else verdict = '<b>NOT DECIDED</b> — the certified box straddles a rounding boundary of the printed digits (in ' + PARAMS[f].filter((p, i) => rel[i] === 'straddles').map(([k]) => SYM[k] || k).join(', ') + '): the maximum may or may not round to them.';
        } else if (ll && cert.ll && ll[1] < cert.ll[0]) verdict = '<b>BELOW A MEMBER OF ITS OWN FAMILY</b> — the fit with the location at zero, certified on the same values, is at least ' + gap(cert.ll[0], ll[1]) + ' log-likelihood units more likely: the printed point is not the family\'s most likely member.';
        else if (ll && cert.ll && ll[0] > cert.ll[1]) verdict = '<b>A DIFFERENT MODEL</b> — the printed location raises the log-likelihood by at least ' + gap(ll[0], cert.ll[1]) + ' over the certified fit at location zero. With a free location the likelihood has no maximum to certify (it is unbounded), so this page decides the printed point only against that fit.';
        else verdict = '<b>NOT DECIDED</b> — with a location the printed fit is a different model from the one certified here (location zero), and the printed digits do not separate the two likelihoods.';
      }
      lines.push(verdict);
      for (const T of S.T) {
        try {
          const L = FT.levelAt(f, theta, loc, T, BM.hours);
          lines.push(T + '-year level over every value the printed digits allow: [' + L[0].toFixed(3) + ', ' + L[1].toFixed(3) + '] m' + (cert && cert.returnLevel[T] ? '; the certified fit\'s' + (loc ? ' (the family at location zero)' : '') + ': ' + Number(cert.returnLevel[T][1]).toFixed(3) + ' m' : '') + '.');
        } catch (e) { /* a level the box cannot enclose is left out */ }
      }
      if (ll) lines.push('log-likelihood over the printed box: [' + ll[0].toFixed(3) + ', ' + ll[1].toFixed(3) + ']' + (cert && cert.ll ? '; the certified maximum: [' + cert.ll[0].toFixed(3) + ', ' + cert.ll[1].toFixed(3) + ']' : '') + '.');
      else if (llWhy && !below[1]) lines.push('The log-likelihood cannot be enclosed over the printed box: ' + esc(llWhy) + '.');
      out.innerHTML = lines.map((l) => '<div>' + l + '</div>').join('');
    } catch (e) { out.innerHTML = 'REFUSED: ' + esc(e.message); }
  }

  /* ---- wiring ---- */
  $('rc-file').addEventListener('change', (e) => { const file = e.target.files[0]; e.target.value = ''; if (file) readFile(file); });
  const drop = $('rc-drop');
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); if (e.dataTransfer.files[0]) readFile(e.dataTransfer.files[0]); });
  if ($('rc-preset')) $('rc-preset').addEventListener('click', usePreset);
  $('rc-col').addEventListener('change', reparse);
  $('rc-run').addEventListener('click', run);
  $('rc-download').addEventListener('click', download);
  $('rc-cf').addEventListener('change', fillParams);
  $('rc-check').addEventListener('click', check);
  fillParams();
})();
