/* app.js — the return-level check, in the tab.
   playground/return-level-check/ · cert-machine

   Reads a series the reader drops (or the embedded hindcast preset), runs the
   ledger's own code on it in a Web Worker (worker.js after the bundle), shows
   every fit certified or refused and every criterion and level as an
   enclosure, and writes the certificate the reader can download. The second
   panel decides a fit someone printed, against the same series and block.
   The file is read here and sent nowhere: there is no request in this file.

   THE parse rule is parse.js beside this file (loaded first, as HS_PARSE);
   its sha256 and this file's go into every certificate beside the ledger
   modules', so a checker reads the same bytes into the same series. A certificate is written only from the series its run
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
  const SYM = window.HS_PRINTED.SYM;
  /* the bundle on this thread too, for the printed-fit check */
  const main = document.createElement('script');
  main.src = URL.createObjectURL(new Blob([BUNDLE], { type: 'text/javascript' }));
  document.head.appendChild(main);

  let loaded = null, series = null, last = null, worker = null, loadTok = 0;

  /* ---- reading a series: THE parse rule lives in parse.js (one module, the atlas's own-site pin loads the same bytes);
     its sha256 goes into every certificate beside this file's ---- */
  const { parse } = window.HS_PARSE;
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
  function clearResults() { $('rc-results').innerHTML = ''; $('rc-verdict').innerHTML = ''; $('rc-download').disabled = true; $('rc-check-out').innerHTML = ''; drawDesign(null); }
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
    drawDesign(R);
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

  /* ---- a fit someone printed, decided against the same series and block: THE decision is printed.js beside this
     file (loaded first, as HS_PRINTED), one module with the atlas, which decides the same way against a cell ---- */
  const { PARAMS, LOCATED } = window.HS_PRINTED;
  function fillParams() {
    const f = $('rc-cf').value;
    $('rc-cp').innerHTML = PARAMS[f].map(([k, lab]) => '<div><label for="rc-p-' + k + '">' + esc(lab) + '</label><input id="rc-p-' + k + '" type="text" inputmode="decimal" placeholder="as printed"></div>').join('')
      + (LOCATED(f) ? '<div><label for="rc-p-loc">location (blank: none)</label><input id="rc-p-loc" type="text" inputmode="decimal" placeholder="as printed"></div>' : '');
  }
  function check() {
    const out = $('rc-check-out');
    if (!series) { out.innerHTML = 'Choose a series first.'; return; }
    if (!self.HSEVA) { out.innerHTML = 'The code is still loading.'; return; }
    const f = $('rc-cf').value, block = $('rc-block').value, s = series;
    try {
      const BM = self.HSEVA.BR.blockMaxima({ n: s.n, t: s.t, h: s.h, step: s.step }, block);
      const R = last && last.series === s && last.block === block ? last : null;
      const D = window.HS_PRINTED.decide(self.HSEVA, {
        f, strs: PARAMS[f].map(([k]) => $('rc-p-' + k).value), loc: $('rc-p-loc') ? $('rc-p-loc').value : '',
        x: BM.x, hours: BM.hours, T: S.T,
        pending: R ? null : 'Certify this series on this block first (step 3): the printed fit is decided against that certificate.',
        fit: R ? R.fits[f] || null : null, lognormal: R ? R.fits.lognormal || null : null,
      });
      out.innerHTML = D.lines.map((l, i) => '<div>' + (i === 0 ? window.HS_EXHIBITED.mark(D.code, true) : '') + l + '</div>').join('');
    } catch (e) { out.innerHTML = 'REFUSED: ' + esc(e.message); }
  }
  /* WARRANT v2 (2026-10-28): a verdict that rests on an exhibited object carries the house's one accent, a red ×, in
     front of the decision's own words. Which ones is exhibited.js's, shared with the atlas; here the series is the one
     the fit was printed for, so the record's objects count too (printed.js stays byte-identical). */

  /* ---- a design height (D14, 2026-10-29; WARRANT's R26): the claim "the T-year wave is at most H", H the reader's
     choice, decided by design.js (window.HS_DESIGN) against each certified family's enclosure of the level. H is a
     handle: typed in its italic field or dragged on its own ruler, in whole centimetres. The ruler is drawn at the
     panel's own width once per run (and per T, per resize) with each family's flip value as a solid tick; a drag
     moves only the chosen line, the handle and the words, never a decided mark (drive.js beside this file asserts it
     in Chrome). Before a run the handle is hollow and the panel says NEEDS DATA. ---- */
  const DZ = window.HS_DESIGN, MK = S.marks;
  const DH = { R: null, T: S.T[0], cm: null, max: 10, rows: [], g: null };
  const DV = DZ.VERDICTS;
  function dGeom() {
    /* narrow (a phone): the name and the word share a line above each row's lane, so the ruler takes the full width */
    const w = Math.max(300, Math.round($('rc-ruler').clientWidth || 640)), narrow = w < 560;
    return narrow ? { w, L: 12, R: 12, top: 34, row: 50, narrow } : { w, L: 160, R: 150, top: 34, row: 30, narrow };
  }
  const dX = (m) => DH.g.L + (m / DH.max) * (DH.g.w - DH.g.L - DH.g.R);
  function drawDesign(R) {
    DH.R = R;
    const G = DH.g = dGeom(), T = DH.T;
    DH.rows = (R ? R.families : []).map((f) => {
      const F = R.fits[f], q = F && F.certified && F.returnLevel ? F.returnLevel[T] : null, fl = q ? DZ.flips(q) : null;
      return { f, q: fl ? q : null, fl };
    });
    const ends = DH.rows.filter((r) => r.fl).map((r) => r.q[1]);
    DH.max = ends.length ? Math.max(1, Math.ceil(Math.max.apply(null, ends) * 1.25)) : 10;
    DH.best = R && R.rankings.ad.verdict === 'DECIDED' ? R.rankings.ad.best : null;
    if (R && DH.cm === null) { const b = DH.rows.find((r) => r.f === DH.best && r.fl) || DH.rows.find((r) => r.fl); DH.cm = b ? b.fl.holdsFrom : null; }
    if (!R) DH.cm = null;
    const H = G.top + Math.max(1, DH.rows.length) * G.row + 16, x1 = G.w - G.R;
    const step = DH.max <= 6 ? 1 : DH.max <= 15 ? 2 : DH.max <= 40 ? 5 : 10;
    const o = ['<svg id="rc-rsvg" viewBox="0 0 ' + G.w + ' ' + H + '" role="group" aria-label="The design height H on a ruler of metres, with each certified family\'s flip value as a solid tick">'];
    o.push('<line x1="' + G.L + '" y1="' + (G.top - 12) + '" x2="' + x1 + '" y2="' + (G.top - 12) + '" class="rc-ax"/>');
    for (let m = 0; m <= DH.max; m += step) {
      const x = dX(m).toFixed(1);
      o.push('<line x1="' + x + '" y1="' + (G.top - 16) + '" x2="' + x + '" y2="' + (G.top - 8) + '" class="rc-ax"/><text x="' + x + '" y="' + (G.top - 20) + '" text-anchor="middle" class="rc-t">' + m + ' m</text>');
    }
    DH.rows.forEach((r, i) => {
      const y = G.top + i * G.row + (G.narrow ? 32 : G.row / 2), ty = G.narrow ? y - 16 : y + 4;
      o.push('<text x="' + (G.narrow ? G.L : G.L - 12) + '" y="' + ty + '"' + (G.narrow ? '' : ' text-anchor="end"') + ' class="rc-fl' + (r.f === DH.best ? ' best' : '') + '">' + esc(FAMW[r.f]) + (r.f === DH.best ? ' · A²' : '') + '</text>');
      if (!r.fl) { o.push('<text x="' + G.L + '" y="' + (G.narrow ? y + 4 : y + 4) + '" class="rc-t">∅ refused: no enclosure of this level</text>'); return; }
      /* the flip, decided: the enclosure's upper end (and its lower end, where the two are a pixel apart) */
      const xh = dX(r.q[1]), xl = dX(r.q[0]);
      if (xh - xl >= 1) o.push('<line x1="' + xl.toFixed(1) + '" y1="' + (y - 9) + '" x2="' + xl.toFixed(1) + '" y2="' + (y + 9) + '" ' + MK.decided + '/>');
      o.push('<line x1="' + xh.toFixed(1) + '" y1="' + (y - 9) + '" x2="' + xh.toFixed(1) + '" y2="' + (y + 9) + '" ' + MK.decided + '/>');
      o.push('<text x="' + (xh + 6).toFixed(1) + '" y="' + (y - 4) + '" class="rc-t" data-row="' + i + '" data-flip="' + r.fl.holdsFrom + '">' + DZ.cmText(r.fl.holdsFrom) + '</text>');
      o.push('<text x="' + (G.narrow ? x1 : x1 + 14) + '" y="' + ty + '"' + (G.narrow ? ' text-anchor="end"' : '') + ' class="rc-dw" data-row="' + i + '"></text>');
    });
    const hx = DH.cm === null ? dX(0) : dX(DH.cm / 100);
    o.push('<line id="rc-hl" x1="' + hx.toFixed(1) + '" y1="' + (G.top - 12) + '" x2="' + hx.toFixed(1) + '" y2="' + (H - 6) + '" ' + MK.chosen + '/>');
    o.push('<circle id="rc-hk" cx="' + hx.toFixed(1) + '" cy="' + (G.top - 12) + '" r="8" class="rc-knob' + (DH.cm === null ? ' hollow' : '') + '" tabindex="' + (DH.cm === null ? -1 : 0) + '" role="slider" aria-label="H, the design height, in centimetres" aria-valuemin="0" aria-valuemax="' + DH.max * 100 + '" aria-valuenow="' + (DH.cm || 0) + '"/>');
    o.push('</svg>');
    $('rc-ruler').innerHTML = o.join('');
    $('rc-h').disabled = DH.cm === null;
    dUpdate(true);
  }
  function dUpdate(typedToo) {
    const cm = DH.cm;
    if (cm === null) {
      $('rc-dv').innerHTML = '<b>NEEDS DATA</b> — certify a series above (step 3); each family that comes back certified puts its tick on this ruler.';
      return;
    }
    const x = dX(cm / 100).toFixed(1), hl = $('rc-hl'), hk = $('rc-hk');
    hl.setAttribute('x1', x); hl.setAttribute('x2', x); hk.setAttribute('cx', x); hk.setAttribute('aria-valuenow', cm);
    hk.setAttribute('aria-valuetext', DZ.cmText(cm) + ' m');
    if (typedToo) $('rc-h').value = DZ.cmText(cm);
    const words = DH.rows.map((r) => (r.fl ? DZ.verdict(cm, r.q) : null));
    document.querySelectorAll('#rc-ruler .rc-dw').forEach((t) => { t.textContent = words[+t.dataset.row]; });
    const n = (v) => words.filter((w) => w === v).length, cert = words.filter(Boolean).length;
    const giv = '<i>H = ' + DZ.cmText(cm) + ' m</i>';
    const across = 'Across the ' + plural(cert, 'certified family', 'certified families') + ': ' + [DV.H, DV.N, DV.U].filter((v) => n(v)).map((v) => v + ' under ' + n(v)).join(', ') + '.';
    const b = DH.rows.find((r) => r.f === DH.best && r.fl);
    $('rc-dv').innerHTML = b
      ? '<div class="word">' + DZ.verdict(cm, b.q) + '</div><div>Under the family Anderson–Darling decides, the ' + esc(FAMW[b.f]) + ', the claim that its ' + DH.T + '-year wave is at most ' + giv + ': it holds from <b>' + DZ.cmText(b.fl.holdsFrom) + ' m</b> up and does not hold at <b>' + DZ.cmText(b.fl.failsTo) + ' m</b> or below'
        + (b.fl.holdsFrom - b.fl.failsTo > 1 ? '; between them the enclosure decides neither' : '') + '. ' + across + '</div>'
      : '<div class="word">no decided family</div><div>Anderson–Darling decides no family on this block, so the claim at ' + giv + ' has no single answer. ' + across + '</div>';
  }
  function dSet(cm, typedToo) {
    if (DH.cm === null) return;
    DH.cm = Math.max(0, Math.min(DH.max * 100, Math.round(cm)));
    dUpdate(typedToo);
  }
  /* typed: read as a decimal string, never through a float times 100 */
  $('rc-h').addEventListener('input', () => {
    const m = /^\s*(\d{1,4})(?:[.,](\d{0,2}))?\s*$/.exec($('rc-h').value);
    if (m) dSet(Number(m[1]) * 100 + Number((m[2] || '').padEnd(2, '0')), false);
  });
  $('rc-h').addEventListener('change', () => dUpdate(true));
  $('rc-dT').addEventListener('change', () => { DH.T = Number($('rc-dT').value); drawDesign(DH.R); });
  /* dragged: on the ruler, anywhere along it */
  const ruler = $('rc-ruler');
  const fromX = (ev) => { const r = $('rc-rsvg').getBoundingClientRect(), x = (ev.clientX - r.left) * (DH.g.w / r.width); return (x - DH.g.L) / (DH.g.w - DH.g.L - DH.g.R) * DH.max * 100; };
  ruler.addEventListener('pointerdown', (ev) => { if (DH.cm === null || !$('rc-rsvg')) return; ruler.setPointerCapture(ev.pointerId); ruler.classList.add('drag'); dSet(fromX(ev), true); ev.preventDefault(); });
  ruler.addEventListener('pointermove', (ev) => { if (ruler.classList.contains('drag')) dSet(fromX(ev), true); });
  const endDrag = () => ruler.classList.remove('drag');
  ruler.addEventListener('pointerup', endDrag); ruler.addEventListener('pointercancel', endDrag);
  ruler.addEventListener('keydown', (ev) => {
    if (ev.target.id !== 'rc-hk' || DH.cm === null) return;
    const k = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 100, PageDown: -100 }[ev.key];
    if (k) { dSet(DH.cm + k * (ev.shiftKey && Math.abs(k) === 1 ? 10 : 1), true); ev.preventDefault(); }
    else if (ev.key === 'Home') { dSet(0, true); ev.preventDefault(); } else if (ev.key === 'End') { dSet(DH.max * 100, true); ev.preventDefault(); }
  });
  let rz = 0;
  window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if ($('rc-ruler').clientWidth && DH.g && Math.abs($('rc-ruler').clientWidth - DH.g.w) > 4) drawDesign(DH.R); }, 120); });

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
  drawDesign(null);
})();
