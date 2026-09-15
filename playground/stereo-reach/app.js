/* app.js — the stereo-reach instrument, in the tab.
   playground/stereo-reach/ · cert-machine

   Every number shown is computed here from the inputs in the panel by
   instruments/stereo/budget.js over instruments/interval/interval.js — the
   same bytes the battery ran — with π's certified enclosure handed in by the
   builder. A curve's standing is the weakest standing of any input it depends
   on: a literal from a paper is decided, a box is decided (the enclosure holds
   over the whole box), a scenario value or an edited value is chosen. */
(function () {
  'use strict';
  const S = JSON.parse(document.getElementById('sr-spec').textContent);
  const IV = window.IV, Bd = window.makeBudget(IV), PR = window.STEREO_PRESETS;
  const PI = S.PI;
  const $ = (id) => document.getElementById(id);
  const W = 900, H = 460, ML = 66, MR = 54, MT = 14, MB = 46, PW = W - ML - MR, PH = H - MT - MB;
  const FIELDS = ['B', 'Hc', 'f', 'p', 'dd', 'dt', 'utex', 'T', 'H'];
  const UNITS = { B: ['baseline B', 'm', 1], Hc: ['camera height Hc', 'm', 1], f: ['focal length f', 'mm', 1000], p: ['pixel pitch p', 'micron', 1e6], dd: ['disparity precision δd', 'px', 1], dt: ['sync lag δt', 'ms', 1000], utex: ['texture speed', 'm/s', 1], T: ['wave period T', 's', 1], H: ['wave height H', 'm', 1] };
  const CELL_DEPS = ['B', 'Hc', 'f', 'p', 'dd'], ALL_DEPS = FIELDS;
  let standing = {};      /* per field: 'paper' | 'box' | 'chosen' */
  let preset = 'leme2020';

  const fmtN = (x, d) => Number(x).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: 0 });
  const cm = (x) => (x >= 1 ? fmtN(x, 2) + ' m' : x >= 0.01 ? fmtN(x * 100, 1) + ' cm' : fmtN(x * 1000, 2) + ' mm');
  const getR = () => Math.pow(10, Number($('sr-R').value));
  const toUser = (k, v) => String(Number((Number(v) * UNITS[k][2]).toPrecision(12)));   /* the unit change is a display convenience; the literal the budget reads is what the box shows */
  const fromUser = (k, s) => String(Number(s) / UNITS[k][2]);

  function buildInputs() {
    const host = $('sr-inputs'); host.innerHTML = '';
    for (const k of FIELDS) {
      const spec = S.presets[preset][k];
      const isBox = spec.lo !== undefined;
      const f = document.createElement('div'); f.className = 'f' + (isBox ? ' wide' : '');
      f.innerHTML = '<label for="sr-' + k + '">' + UNITS[k][0] + ' (' + UNITS[k][1] + ')</label>'
        + (isBox ? '<div class="pair"><input id="sr-' + k + '" type="text" inputmode="decimal" value="' + toUser(k, spec.lo) + '"><input id="sr-' + k + '-hi" type="text" inputmode="decimal" value="' + toUser(k, spec.hi) + '"></div>' : '<input id="sr-' + k + '" type="text" inputmode="decimal" value="' + toUser(k, spec.v) + '">')
        + '<div class="st ' + spec.standing + '" id="sr-' + k + '-st" title="' + (spec.note || '').replace(/"/g, '&quot;') + '">' + (spec.standing === 'paper' ? 'from the paper' : spec.standing === 'box' ? 'not stated · a box' : 'chosen') + '</div>';
      host.appendChild(f);
      standing[k] = spec.standing;
      const inputs = f.querySelectorAll('input');
      for (const inp of inputs) inp.addEventListener('input', () => { standing[k] = 'chosen'; $('sr-' + k + '-st').textContent = 'chosen (edited)'; $('sr-' + k + '-st').className = 'st chosen'; render(); });
    }
  }
  function readInputs() {
    const o = { g: Bd.lit(S.presets[preset].g.v), PI: PI };
    for (const k of FIELDS) {
      const hi = $('sr-' + k + '-hi');
      o[k] = hi ? Bd.box(fromUser(k, $('sr-' + k).value), fromUser(k, hi.value)) : Bd.lit(fromUser(k, $('sr-' + k).value));
    }
    return o;
  }
  const standingOf = (deps) => (deps.some((k) => standing[k] === 'chosen') ? 'chosen' : 'decided');
  const attrs = (st) => S.marks[st];

  function render() {
    let inp;
    try { inp = readInputs(); } catch (e) { $('sr-verdict').innerHTML = '<div class="word">REFUSED</div><div class="why">' + e.message + '</div>'; return; }
    const P = S.presets[preset];
    const lo = Number(P.rangeLo), hi = Number(P.rangeHi);
    const x0 = lo / 2, x1 = hi * 2;
    const grid = []; for (let x = x0; x <= x1 * 1.0001; x *= 1.04) grid.push(x);
    const rows = [];
    for (const R of grid) { try { rows.push({ R, c: Bd.cell(inp, Bd.lit(String(R))) }); } catch (e) { rows.push({ R, c: null }); } }
    const tol = Number($('sr-tol').value) / 100;
    const limit = IV.mul(Bd.lit(String(tol)), inp.H);
    /* the reach on the same grid, from the near edge outward */
    const rr = Bd.reach(inp, Bd.lit(String(tol)), grid.filter((x) => x >= lo).map((x) => Bd.lit(String(x))));
    /* plot: log-log, y from 1 mm to 100 m */
    const ys = (v) => Math.log10(Math.max(v, 1e-3)), y0 = ys(1e-3), y1 = ys(100);
    const px = (R) => ML + (Math.log10(R) - Math.log10(x0)) / (Math.log10(x1) - Math.log10(x0)) * PW;
    const py = (v) => MT + PH - (ys(v) - y0) / (y1 - y0) * PH;
    const out = [];
    for (const v of [1e-3, 1e-2, 1e-1, 1, 10, 100]) { const y = py(v); out.push('<line class="sr-grid" x1="' + ML + '" y1="' + y + '" x2="' + (ML + PW) + '" y2="' + y + '"/>', '<text class="sr-tick" x="' + (ML - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + (v >= 1 ? v + ' m' : v >= 0.01 ? (v * 100) + ' cm' : '1 mm') + '</text>'); }
    const xt = []; for (let d = 1; d <= 10000; d *= 10) for (const m of [1, 2, 5]) if (d * m >= x0 && d * m <= x1) xt.push(d * m);
    for (const v of xt) { const x = px(v); out.push('<line class="sr-grid" x1="' + x + '" y1="' + MT + '" x2="' + x + '" y2="' + (MT + PH) + '"/>', '<text class="sr-tick" x="' + x + '" y="' + (MT + PH + 16) + '" text-anchor="middle">' + v + '</text>'); }
    out.push('<line class="sr-axis" x1="' + ML + '" y1="' + (MT + PH) + '" x2="' + (ML + PW) + '" y2="' + (MT + PH) + '"/>');
    out.push('<text class="sr-lab" x="' + (ML + PW / 2) + '" y="' + (H - 8) + '" text-anchor="middle">horizontal range to the surface point (m)</text>');
    out.push('<text class="sr-lab" transform="rotate(-90 14 ' + (MT + PH / 2) + ')" x="14" y="' + (MT + PH / 2) + '" text-anchor="middle">elevation error bound (upper end)</text>');
    /* the imaged range of the preset */
    out.push('<rect x="' + px(lo) + '" y="' + MT + '" width="' + (px(hi) - px(lo)) + '" height="' + PH + '" fill="var(--ink)" fill-opacity="0.04"/>');
    /* tolerance */
    out.push('<line class="sr-tol" x1="' + ML + '" y1="' + py(limit[0]) + '" x2="' + (ML + PW) + '" y2="' + py(limit[0]) + '"/>', '<text class="sr-lab" x="' + (ML + PW - 4) + '" y="' + (py(limit[0]) - 5) + '" text-anchor="end">tolerance ' + (tol * 100) + '% of H = ' + cm(limit[0]) + '</text>');
    const path = (pick) => rows.filter((r) => r.c && pick(r.c) !== null && pick(r.c) !== undefined).map((r, i) => (i ? 'L' : 'M') + px(r.R).toFixed(1) + ' ' + py(pick(r.c)).toFixed(1)).join(' ');
    const stCell = standingOf(CELL_DEPS), stAll = standingOf(ALL_DEPS);
    const thin = (st) => attrs(st).replace('class="', 'class="sr-thin ');   /* one class attribute, both names */
    out.push('<path ' + thin(stCell) + ' d="' + path((c) => c.terms && c.terms.cell) + '"/>');
    out.push('<path ' + thin(stAll) + ' d="' + path((c) => c.terms && c.terms.slope) + '"/>');
    out.push('<path ' + thin(stAll) + ' d="' + path((c) => c.terms && c.terms.cellWithSync) + '"/>');
    out.push('<path ' + attrs(stAll) + ' d="' + path((c) => c.total && c.total[1]) + '"/>');
    /* labels at the right end */
    const last = rows.filter((r) => r.c && r.c.total).slice(-1)[0];
    if (last) {
      /* labels at the right end, pushed apart when they would collide */
      const labs = [[last.c.total[1], 'total'], [last.c.terms.slope, 'slope'], [last.c.terms.cell, 'cell'], [last.c.terms.cellWithSync, '+sync']].map(([v, t]) => ({ y: py(v), t })).sort((a, b) => a.y - b.y);
      for (let i = 1; i < labs.length; i++) if (labs[i].y - labs[i - 1].y < 12) labs[i].y = labs[i - 1].y + 12;
      for (const l of labs) out.push('<text class="sr-lab" x="' + (px(last.R) + 4) + '" y="' + (l.y + 4) + '" text-anchor="start">' + l.t + '</text>');
    }
    /* the reach marker */
    if (rr.reach !== null) out.push('<line class="sr-axis" x1="' + px(rr.reach) + '" y1="' + MT + '" x2="' + px(rr.reach) + '" y2="' + (MT + PH) + '"/>', '<text class="sr-lab" x="' + (px(rr.reach) + 4) + '" y="' + (MT + 12) + '" text-anchor="start">reach ' + fmtN(rr.reach, 0) + ' m</text>');
    /* the chosen range */
    const R = getR();
    out.push('<line class="sr-tol" x1="' + px(R) + '" y1="' + MT + '" x2="' + px(R) + '" y2="' + (MT + PH) + '"/>');
    const cR = (() => { try { return Bd.cell(inp, Bd.lit(String(R))); } catch (e) { return null; } })();
    if (cR && cR.total) out.push('<circle class="sr-mark" cx="' + px(R) + '" cy="' + py(cR.total[1]) + '" r="4.5"/>');
    $('sr-svg').innerHTML = out.join('');
    /* readout */
    $('sr-Rv').textContent = fmtN(R, 0) + ' m';
    if (cR && cR.total) {
      const st = (deps) => 'v w-' + standingOf(deps);
      $('r-cell').textContent = cm(cR.terms.cell); $('r-cell').className = st(CELL_DEPS);
      $('r-cell-note').textContent = 'horizontal ' + cm(cR.quantization.horiz) + ' · disparity ' + fmtN(cR.disparityPx[0], 1) + (cR.disparityPx[1] - cR.disparityPx[0] > 0.05 ? '–' + fmtN(cR.disparityPx[1], 1) : '') + ' px';
      $('r-sync').textContent = cm(cR.terms.cellWithSync - cR.terms.cell); $('r-sync').className = st(ALL_DEPS);
      $('r-sync-note').textContent = 'texture moves ' + cm(cR.wave.textureShift[1]) + ' in the lag';
      $('r-slope').textContent = cm(cR.terms.slope); $('r-slope').className = st(ALL_DEPS);
      $('r-slope-note').textContent = 'a ' + cm(cR.withSync.horiz) + ' misplacement on a slope up to ' + fmtN(cR.wave.k[1] * Number(fromUser('H', $('sr-H').value)) / 2, 3);
      $('r-vel').textContent = cm(cR.terms.velocity); $('r-vel').className = st(ALL_DEPS);
      $('r-total').textContent = cm(cR.total[1]); $('r-total').className = st(ALL_DEPS);
      const ok = cR.total[1] <= limit[0];
      $('sr-verdict').innerHTML = '<div class="word ' + (standingOf(ALL_DEPS) === 'chosen' ? 'w-chosen' : 'w-decided') + '">' + (ok ? 'WITHIN TOLERANCE' : 'BEYOND TOLERANCE') + '</div><div class="why">At ' + fmtN(R, 0) + ' m the bound on the elevation error is ' + cm(cR.total[1]) + ' against ' + cm(limit[0]) + ' (' + (tol * 100) + '% of H). ' + (rr.reach !== null ? 'The reach at this tolerance is ' + fmtN(rr.reach, 0) + ' m: the last range on a 4% grid from the near edge before the bound first exceeds it' + (rr.firstFailure ? ' (it does at ' + fmtN(rr.firstFailure, 0) + ' m)' : '') + '.' : 'No range from the near edge is within tolerance.') + (standingOf(ALL_DEPS) === 'chosen' ? ' Dotted: at least one input is a choice, not a literal from a source.' : '') + '</div>';
    } else {
      $('sr-verdict').innerHTML = '<div class="word">REFUSED</div><div class="why">' + (cR && cR.refused ? cR.refused : 'no cell at this range') + '</div>';
      for (const id of ['r-cell', 'r-sync', 'r-slope', 'r-vel', 'r-total']) $(id).textContent = '—';
    }
  }
  function loadPreset() {
    preset = $('sr-preset').value;
    const P = S.presets[preset];
    buildInputs();
    const r = $('sr-R'); r.min = Math.log10(Number(P.rangeLo) / 2); r.max = Math.log10(Number(P.rangeHi) * 2); r.step = 0.01;
    r.value = Math.log10(P.gaugeRange ? Number(P.gaugeRange) : Math.sqrt(Number(P.rangeLo) * Number(P.rangeHi)));
    $('sr-source').textContent = P.source;
    render();
  }
  /* the range slider is logarithmic: its value is log10(R) */
  $('sr-tol').addEventListener('input', render);
  $('sr-R').addEventListener('input', render);
  $('sr-preset').addEventListener('change', loadPreset);
  loadPreset();
})();
