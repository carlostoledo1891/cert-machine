/* surf.js — the sea at every beach of Florianópolis, step by step, and what it means for each way people use it.
   apps/swell/model · cert-machine

   ONE DEFINITION. The day's build (apps/swell/build-day.js) and the reader's tab run THIS file, byte for byte
   (its sha256 is in the day's data and the tab checks it), so the page never says one thing and the record another.

   THE CHAIN, for each beach and each forecast step:
     1. The open sea at the island box's eastern edge (-27.60, -48.15 → the models' sea node): its PARTITIONS
        (the wind sea and up to three swells: height, period, direction — NOAA WAVEWATCH III, GFS-Wave) and its
        total Hs from ECMWF with the MEASURED BAND around it (Janela's calibrated bands at this site, ECMWF ∪ NOAA,
        apps/janela/audit/today.js — the same definition Janela decides with). The partitions give the sea's
        SHAPE; the total sets its SIZE: central = ECMWF's deterministic Hs, band = [lo, hi].
     2. The island model (sim/island.py; data/beaches.json): K = Hs at a probe / Hs offshore, bilinear in
        direction (22.5° cases) and period (6, 9, 12, 15 s; outside that range read at the nearest end and FLAGGED).
        At each probe the partitions add as energy: H = sqrt(Σ (K_i H_i)²).
     3. BREAKING — the port's fix. Two readings, and the beach's breaking height Hb is the larger:
          (a) the CROSSING: marching in from the deepest probe (8.8 m or deeper at every ocean beach), the waves
              break where H first reaches GAMMA·h; between two probes the crossing is interpolated linearly and
              the height is GAMMA·h there; if they never reach it, the shallowest probe's H (they break closer
              in); if the deepest probe is already saturated, GAMMA·h_deepest, FLAGGED as capped;
          (b) the PEAK: the largest min(K H, GAMMA h) over the surf-zone probes (h <= 6.5 m) — frontier's reading,
              which sees a focusing spot on one part of a beach that the depth-ordered march walks past.
        frontier had only (b), with probes no deeper than 4.5-6.5 m, so 14 of 21 ocean beaches could never read
        more than 2.3-2.5 m whatever the sea did; (a) alone would miss a beach whose probes sit on differently
        sheltered parts of it. Both readings are non-decreasing in the sea's size (each probe's H scales
        linearly; in (a) the set of saturated probes only grows, so the deepest one can only move seaward and the
        crossing depth with it — where a deeper probe saturates before a shallower one, as at a bay whose outer
        probe sees the open sea, Hb jumps UP, never down), so their maximum is too, and the band maps to
        [Hb(lo), Hb(hi)] EXACTLY over the model — rounded outward to the centimetre (the battery sweeps it).
     4. The bays' own chop (fetch-limited, JONSWAP: Hs = 0.0016 U sqrt(F/g)) where the beach is a bay or the
        lagoon; ocean beaches already received the open sea's wind sea in step 1. The chop is the wind's FORECAST
        (unmeasured): in a bay it is added at its forecast value to both edges of the band (stated on the card);
        the lagoon, chop alone, has no measured band and nothing there is decided.
     5. REFUSAL. A beach within EDGE_KM of a side edge of the box that crosses the sea is refused: the model's
        side edges carry an unrefracted plane wave (frontier's review: K wrong by ±35% within ~5 km).
     6. The wind at the beach: ECMWF's 10 m wind bilinear on the 0.25° grid over the island, classed against the
        way the beach faces. FORECAST INK: its error at the beaches has not been measured.
     7. Each activity's rule (RULES below, printed on the page from this table): a score that ranks the beaches
        (forecast ink) and, where the rule limits the waves, a DECIDED verdict over the band by
        instruments/window/decide.js: VETADA → PERIGO (even the band's low edge is over the limit), INDEFINIDA →
        ATENÇÃO (the band straddles it; the flip says how far), LIBERADA → under the limit — never "safe".

   WHAT THIS DOES NOT CLAIM: the island model's own error at the shore (no measured shore truth yet — a buoy or
   camera would close it); rip currents beyond a rule of thumb; anything at night; navigation (the depths derive
   from a DHN chart: NOT FOR NAVIGATION).

   Determinism: the digest covers only what IEEE arithmetic fixes (+ − × ÷ √) — heights and letters; directions,
   currents and sun times use trigonometry and are shown, never digested.

   MIT licensed (code). Part of cert-machine.                                                                   */
'use strict';

const D = require('../../../instruments/window/decide.js');     // the tab's shim resolves it by file name

/* ------------------------------------------------------------------ constants, each once, each sourced */
const C = {
  G: 9.81,
  KN_PER_MS: 3600 / 1852,                 // exact by definition of the knot
  GAMMA: 0.55,                            // saturated surf zone Hs/h; Thornton & Guza (1982) measured Hrms ≈ 0.42 h,
                                          // i.e. Hs ≈ 0.59 h; frontier's 0.55 kept (the lower, so breaking starts deeper)
  GAMMA_IND: 0.78,                        // a single wave breaks at H ≈ 0.78 h (McCowan 1894): longshore geometry only
  EDGE_KM: 5,                             // side-edge refusal distance (frontier review 2026-10-06; targets row swell-port)
  CHOP_A: 0.0016,                         // JONSWAP fetch-limited growth, Hs = 0.0016 U sqrt(F / g)
  LAGOON_MAX: 0.6,                        // the lagoon's chop never exceeds 0.6 m (~13 km by 1.5 km, shallow)
  T_MIN: 6, T_MAX: 15,                    // the case library's periods (outside: read at the nearest end, flagged)
  PEAK_MAX_H: 6.5,                        // the surf-zone probes the PEAK reading looks at (frontier's deepest target)
  RIP_HB: 0.9, RIP_ANGLE: 20,             // rule of thumb: > 0.9 m arriving within 20° of square to a sandy beach
  WIND_CALM: 1.5,                         // m/s: below it, no wind class
};

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const angDiff = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
const cm = (x) => Math.round(x * 100);
const cmDown = (x) => Math.floor(x * 100 + 1e-9);
const cmUp = (x) => Math.ceil(x * 100 - 1e-9);
const dec2 = (c) => (c < 0 ? '-' : '') + Math.floor(Math.abs(c) / 100) + '.' + String(Math.abs(c) % 100).padStart(2, '0');

/* ------------------------------------------------------------------ the island model at a beach */
function kProbes(B, b, dir, T) {
  const Ds = B.dirs, Ps = B.periods, step = Ds[1] - Ds[0];
  const d = ((dir % 360) + 360) % 360, i0 = Math.floor(d / step) % Ds.length, i1 = (i0 + 1) % Ds.length, fd = d / step - Math.floor(d / step);
  const t = clamp(T, Ps[0], Ps[Ps.length - 1]);
  let j = 0; while (j < Ps.length - 2 && t > Ps[j + 1]) j++;
  const ft = (t - Ps[j]) / (Ps[j + 1] - Ps[j]);
  const at = (di, pj) => b.K[Ds[di] + '/' + Ps[pj]] || [];
  const a = at(i0, j), bb = at(i1, j), c = at(i0, j + 1), e = at(i1, j + 1);
  return b.probes.map((p, k) => (1 - ft) * ((1 - fd) * (a[k] || 0) + fd * (bb[k] || 0)) + ft * ((1 - fd) * (c[k] || 0) + fd * (e[k] || 0)));
}

/* the open sea's partitions at a probe set: per probe, sqrt(Σ (K H)²) at unit scale (the caller scales) */
function probeEnergy(B, b, parts) {
  const e2 = b.probes.map(() => 0);
  for (const P of parts) {
    const ks = kProbes(B, b, P.d, P.p);
    for (let k = 0; k < ks.length; k++) e2[k] += (ks[k] * P.h) * (ks[k] * P.h);
  }
  return e2.map(Math.sqrt);
}

/* the breaking height for the probes' heights H[k] (sorted by depth, shallow first) — see the header, step 3 */
function crossing(b, H) {
  const P = b.probes, n = P.length, g = C.GAMMA;
  if (H[n - 1] >= g * P[n - 1].h) return { hb: g * P[n - 1].h, h: P[n - 1].h, capped: true };
  for (let k = n - 2; k >= 0; k--) {
    const f1 = H[k + 1] - g * P[k + 1].h, f0 = H[k] - g * P[k].h;      // f1 < 0 by the loop's invariant
    if (f0 >= 0) {
      const w = f1 / (f1 - f0), h = P[k + 1].h + w * (P[k].h - P[k + 1].h);
      return { hb: g * h, h };
    }
  }
  return { hb: H[0], h: null, inner: true };
}
function peak(b, H) {
  let hb = 0;
  b.probes.forEach((p, k) => { if (p.h <= C.PEAK_MAX_H) hb = Math.max(hb, Math.min(H[k], C.GAMMA * p.h)); });
  return hb;
}
function breakHeight(b, H) {
  if (!b.probes.length) return null;
  const a = crossing(b, H), pk = peak(b, H);
  return pk > a.hb ? { hb: pk, by: 'peak' } : Object.assign(a, { by: 'crossing' });
}

/* fetch-limited chop for the wind at a beach (bays and the lagoon) */
function chopAt(b, w) {
  if (!w || !(w.U > 0)) return 0;
  if (b.kind === 'lagoon') {
    const F = 1000 + 5000 * Math.abs(Math.cos(w.dir * Math.PI / 180));
    return Math.min(C.CHOP_A * w.U * Math.sqrt(F / C.G), C.LAGOON_MAX);
  }
  if (b.kind !== 'bay' || !b.fetch) return 0;
  const F = b.fetch[Math.round(w.dir / 22.5) % 16];
  if (!(F > 0)) return 0;
  const cap = C.GAMMA * (b.probes[1] || b.probes[0] || { h: 1 }).h;
  return Math.min(C.CHOP_A * w.U * Math.sqrt(F / C.G), cap);
}

/* the waves at a beach: central and band, outward to the centimetre; null with a reason when refused */
function wavesAt(B, b, sea, w) {
  if (refused(b)) return { refused: refused(b) };
  const chop = chopAt(b, w);
  const join = (x) => Math.sqrt(x * x + chop * chop);
  /* the lagoon has only its own chop, a forecast of the wind: no measured band, so nothing there is decided */
  if (b.kind === 'lagoon') { const c = cm(chop); return { c, chop: c, only: 'chop' }; }
  if (!sea || !sea.parts || !sea.parts.length || !(sea.size > 0)) return { refused: 'nodata' };
  const unit = probeEnergy(B, b, sea.parts);
  const tot = Math.sqrt(sea.parts.reduce((s, P) => s + P.h * P.h, 0));
  if (!(tot > 0)) return { refused: 'nodata' };
  const at = (H) => breakHeight(b, unit.map((x) => x * H / tot));
  const c = at(sea.size), out = { c: cm(join(c.hb)), chop: cm(chop) };
  if (c.capped) out.capped = true;
  if (sea.lo != null && sea.hi != null) {
    const lo = at(sea.lo), hi = at(sea.hi);
    out.lo = cmDown(join(lo.hb)); out.hi = cmUp(join(hi.hb));
    if (hi.capped) out.capped = true;
  }
  const ext = sea.parts.filter((P) => P.p < C.T_MIN || P.p > C.T_MAX).map((P) => P.p);
  if (ext.length) out.ext = ext;
  return out;
}

function refused(b) {
  if (b.kind !== 'lagoon' && (!b.probes || !b.probes.length)) return 'noprobe';
  const e = b.edges || {};
  const near = ['N', 'S', 'W'].filter((k) => e[k] != null && e[k] < C.EDGE_KM);
  return near.length ? 'edge:' + near.map((k) => k + ' ' + e[k] + ' km').join(', ') : null;
}

/* ------------------------------------------------------------------ the open sea at a step */
/* day.sea[i] = { size (ECMWF det Hs, m), lo, hi (the measured band, m, or null), parts: [{k, h, p, d}] (NOAA),
   tp, mwd (ECMWF) }. Without partitions the sea is one partition from ECMWF's total, peak period and mean
   direction — flagged. */
function seaOf(day, i) {
  const s = day.sea[i];
  if (!s) return null;
  let parts = (s.parts || []).filter((P) => P.h > 0.05 && P.p > 0 && P.d != null);
  let flat = false;
  if (!parts.length && s.size > 0 && s.tp > 0 && s.mwd != null) { parts = [{ k: 'e', h: s.size, p: s.tp, d: s.mwd }]; flat = true; }
  return { size: s.size, lo: s.lo, hi: s.hi, parts, flat };
}

/* ------------------------------------------------------------------ the wind at a beach */
function windAt(day, i, lon, lat) {
  const W = day.wind; if (!W || !W.steps[i]) return null;
  const lats = W.lats, lons = W.lons, st = W.steps[i];
  const fy = clamp((lat - lats[0]) / (lats[lats.length - 1] - lats[0]) * (lats.length - 1), 0, lats.length - 1 - 1e-9);
  const fx = clamp((lon - lons[0]) / (lons[lons.length - 1] - lons[0]) * (lons.length - 1), 0, lons.length - 1 - 1e-9);
  const j0 = Math.floor(fy), i0 = Math.floor(fx), ty = fy - j0, tx = fx - i0;
  let u = 0, v = 0, U = 0, g = 0, t2 = 0, pr = 0;
  for (const [dj, di, wt] of [[0, 0, (1 - tx) * (1 - ty)], [0, 1, tx * (1 - ty)], [1, 0, (1 - tx) * ty], [1, 1, tx * ty]]) {
    const n = (j0 + dj) * lons.length + (i0 + di);
    u += wt * st.u[n]; v += wt * st.v[n]; U += wt * Math.sqrt(st.u[n] * st.u[n] + st.v[n] * st.v[n]);
    g += wt * st.g[n]; if (st.t2) t2 += wt * st.t2[n]; if (st.rain) pr += wt * st.rain[n];
  }
  const dir = ((Math.atan2(-u, -v) * 180 / Math.PI) + 360) % 360;
  return { U, dir, gust: Math.max(g, U), u, v, t2: st.t2 ? t2 : null, rain: st.rain ? pr : null };
}
function windClass(seaward, w) {
  if (seaward == null || !w || !(w.U > C.WIND_CALM)) return null;
  const d = angDiff(w.dir, seaward);           // 0 = from the sea (onshore), 180 = from the land (offshore)
  return d < 50 ? 'onshore' : d > 130 ? 'offshore' : d < 80 ? 'side-onshore' : d > 100 ? 'side-offshore' : 'cross-shore';
}
const offshoreish = (wc) => wc === 'offshore' || wc === 'side-offshore';

/* the longshore current (Komar 1979, mid surf zone) from the dominant partition's angle at the beach; shown only */
function currentAt(B, b, sea, hbM) {
  if (!sea || !sea.parts.length || b.seaward == null || b.angProbe == null) return null;
  let dom = null, best = -1;
  for (const P of sea.parts) { const k = Math.max(0, ...kProbes(B, b, P.d, P.p)); if (k * P.h > best) { best = k * P.h; dom = P; } }
  const Ds = B.dirs, Ps = B.periods, step = Ds[1] - Ds[0];
  const di = Math.round((((dom.d % 360) + 360) % 360) / step) % Ds.length;
  let pj = 0; for (let k = 1; k < Ps.length; k++) if (Math.abs(Ps[k] - dom.p) < Math.abs(Ps[pj] - dom.p)) pj = k;
  const travel = b.ang[Ds[di] + '/' + Ps[pj]];
  if (travel == null) return { dom };
  const shoreward = (b.seaward + 180) % 360;
  const a = ((travel - shoreward + 540) % 360) - 180;
  if (Math.abs(a) >= 80) return { dom, a };
  const hp = b.probes[b.angProbe].h, db = Math.max(0.3, hbM / C.GAMMA_IND);
  const ab = Math.asin(clamp(Math.sin(a * Math.PI / 180) * Math.sqrt(Math.min(1, db / hp)), -1, 1));
  const V = 1.17 * Math.sqrt(C.G * hbM) * Math.sin(ab) * Math.cos(ab);
  return { dom, a, V: Math.abs(V), toward: (shoreward + (V > 0 ? 90 : -90) + 360) % 360 };
}

/* ------------------------------------------------------------------ the activities: ONE table */
/* For each activity: where it is done, the score (forecast ink: it ranks), and its LIMITS. A limit on the waves
   (hb at the beach, or hs offshore) is DECIDED over the band by decide.js; a limit on the wind is a FORECAST
   warning (the wind's error at the beaches is not measured). `text` is printed on the page from these numbers. */
const RULES = {
  surf: {
    spots: ['ocean', 'bay'],
    decided: [{ id: 'surf-big', var: 'hb', op: '<=', value: '2.60', word: 'grande demais', en: 'too big' }],
    warn: [],
    score(c) {
      const size = smooth(0.3, 1.1, c.hb) * (1 - 0.6 * smooth(2.2, 3.2, c.hb));
      const period = 0.55 + 0.45 * smooth(6, 12, c.domT || 0);
      let wind = !c.wc || c.wind.U < 3 ? 1 : { offshore: 1, 'side-offshore': 0.95, 'cross-shore': 0.8, 'side-onshore': 0.6, onshore: 0.45 }[c.wc];
      if (c.wind.U > 8 && /onshore/.test(c.wc || '')) wind -= 0.2;
      return size * period * Math.max(0, wind);
    },
    flat: (c) => c.hb < 0.3,
    text: { pt: 'Ondas entre 0,3 e 2,6 m na arrebentação, melhor com período longo e vento terral; acima de 2,6 m: grande demais (decidido sobre a faixa).',
      en: 'Breaking waves between 0.3 and 2.6 m, best with a long period and an offshore wind; above 2.6 m: too big (decided over the band).' },
  },
  kite: {
    spots: ['ocean', 'bay', 'lagoon'],
    decided: [],
    warn: [{ id: 'kite-offshore', when: (c) => c.wind.U * C.KN_PER_MS >= 11 && offshoreish(c.wc), word: 'vento terral', en: 'offshore wind' }],
    score(c) {
      const kn = c.wind.U * C.KN_PER_MS, gk = c.wind.gust * C.KN_PER_MS;
      if (offshoreish(c.wc)) return 0.05;
      const speed = smooth(11, 15, kn) * (1 - smooth(28, 34, kn));
      const steady = 1 - 0.5 * smooth(1.45, 1.9, gk / Math.max(kn, 1));
      const dir = c.lagoon ? 1 : ({ 'cross-shore': 1, 'side-onshore': 0.95, onshore: 0.6 }[c.wc] ?? 0.8);
      return speed * steady * dir;
    },
    flat: (c) => c.wind.U * C.KN_PER_MS < 11,
    text: { pt: 'Vento de 11 a 34 nós, de lado ou do mar, sem rajadas muito acima da média; vento terral de 11 nós ou mais leva para o mar (aviso de previsão).',
      en: 'Wind from 11 to 34 knots, side- or onshore, without gusts far above the mean; an offshore wind of 11 knots or more blows you out to sea (forecast warning).' },
  },
  sup: {
    spots: ['ocean', 'bay', 'lagoon'],
    decided: [{ id: 'sup-waves', var: 'hb', op: '<=', value: '1.00', word: 'ondas fortes', en: 'heavy surf' }],
    warn: [{ id: 'sup-offshore', when: (c) => c.wind.U > 5 && offshoreish(c.wc), word: 'vento terral', en: 'offshore wind' }],
    score(c) {
      const waves = 1 - smooth(0.15, 0.5, c.hb), wind = 1 - smooth(3, 7, c.wind.U);
      return waves * wind * (offshoreish(c.wc) && c.wind.U > 4 ? 0.2 : 1);
    },
    text: { pt: 'Água lisa: ondas abaixo de 0,15–0,5 m e vento abaixo de 3–7 m/s; acima de 1,0 m na arrebentação: ondas fortes (decidido); vento terral acima de 18 km/h leva para o mar (aviso de previsão).',
      en: 'Flat water: waves under 0.15–0.5 m and wind under 3–7 m/s; above 1.0 m breaking: heavy surf (decided); an offshore wind above 18 km/h blows you out to sea (forecast warning).' },
  },
  swim: {
    spots: ['ocean', 'bay'],
    decided: [{ id: 'swim-waves', var: 'hb', op: '<=', value: '1.40', word: 'perigo', en: 'danger' }],
    warn: [{ id: 'swim-rip', when: (c) => c.rip, word: 'corrente de retorno provável', en: 'rip current likely' }],
    score(c) {
      const waves = 1 - smooth(0.35, 1.1, c.hb), wind = 1 - 0.5 * smooth(5, 10, c.wind.U);
      const cur = c.cur && c.cur.V ? 1 - smooth(0.3, 0.8, c.cur.V) : 1;
      return waves * wind * cur * (c.rip ? 0.4 : 1);
    },
    text: { pt: 'Ondas abaixo de 0,35–1,1 m, pouco vento e pouca corrente; acima de 1,4 m na arrebentação: perigo (decidido sobre a faixa); ondas acima de 0,9 m chegando de frente numa praia de areia: corrente de retorno provável (regra prática). Nade perto de um posto de guarda-vidas.',
      en: 'Waves under 0.35–1.1 m, little wind and little current; above 1.4 m breaking: danger (decided over the band); waves over 0.9 m arriving square to a sandy beach: rip current likely (rule of thumb). Swim near a lifeguard post.' },
  },
  fish: {
    spots: ['ocean', 'bay'],
    decided: [{ id: 'fish-waves', var: 'hb', op: '<=', value: '2.00', word: 'perigo nas pedras', en: 'danger on the rocks' }],
    warn: [],
    score(c) { return smooth(0.15, 0.4, c.hb) * (1 - smooth(1.2, 1.8, c.hb)) * (1 - smooth(6, 10, c.wind.U)); },
    text: { pt: 'Um pouco de mar (0,15–1,8 m) e vento abaixo de 6–10 m/s; acima de 2,0 m na arrebentação: perigo nas pedras (decidido sobre a faixa).',
      en: 'Some sea (0.15–1.8 m) and wind under 6–10 m/s; above 2.0 m breaking: danger on the rocks (decided over the band).' },
  },
  boat: {
    spots: ['ocean', 'bay'],
    decided: [{ id: 'boat-sea', var: 'hs', op: '<=', value: '2.50', word: 'mar grosso lá fora', en: 'rough sea offshore' }],
    warn: [{ id: 'boat-wind', when: (c) => c.wind.U > 13, word: 'vento forte', en: 'strong wind' }],
    score(c) {
      const sea = 1 - smooth(1.2, 2.2, c.off || 0), wind = 1 - smooth(7, 12, c.wind.U), launch = 1 - smooth(0.6, 1.2, c.hb);
      return sea * wind * launch;
    },
    text: { pt: 'Mar aberto abaixo de 1,2–2,2 m, vento abaixo de 7–12 m/s e pouca arrebentação para sair; mar aberto acima de 2,5 m: mar grosso (decidido sobre a faixa medida); vento acima de 13 m/s (25 nós): vento forte (aviso de previsão).',
      en: 'Open sea under 1.2–2.2 m, wind under 7–12 m/s and little surf to launch through; open sea above 2.5 m: rough (decided over the measured band); wind above 13 m/s (25 knots): strong wind (forecast warning).' },
  },
};
const ACT_ORDER = ['surf', 'kite', 'sup', 'swim', 'fish', 'boat'];
const QUALITY = (s) => (s >= 0.6 ? 'good' : s >= 0.33 ? 'fair' : 'poor');

/* a decided limit over one step's band: decide.js, the window instrument, over the published centimetres */
function decideLimit(L, band) {
  if (!band) return { verdict: 'SEM DADOS', letter: 'S' };
  const fc = { unit: { hs: 'm' }, coverage: '9/10 (conformal, the site and lead bin; the island model applied)', proposer: 'swell',
    steps: [{ t: 'x', vars: { hs: { lo: dec2(band.lo), hi: dec2(band.hi) } } }] };
  const v = D.decide({ id: L.id, limits: [{ var: 'hs', op: L.op, value: L.value, unit: 'm' }] }, fc, ['x', 'x']);
  const letter = { LIBERADA: 'L', VETADA: 'V', INDEFINIDA: 'I', 'SEM DADOS': 'S', RECUSADA: 'R' }[v.verdict] || '?';
  return { verdict: v.verdict, letter, flip: v.flip || null, witness: v.witness || null };
}

/* ------------------------------------------------------------------ everything at one beach and step */
function at(B, day, b, i) {
  const sea = seaOf(day, i), w = windAt(day, i, b.lon, b.lat) || { U: 0, dir: 0, gust: 0 };
  const wv = wavesAt(B, b, sea, w);
  const c = { i, wind: w, wc: windClass(b.seaward, w), lagoon: b.kind === 'lagoon', waves: wv, sea };
  c.hb = wv.refused ? null : wv.c / 100;
  c.off = sea ? sea.size : null;
  c.cur = c.hb != null && b.kind !== 'lagoon' ? currentAt(B, b, sea, c.hb) : null;
  c.domT = c.cur && c.cur.dom ? c.cur.dom.p : (sea && sea.parts[0] ? sea.parts[0].p : 0);
  c.rip = b.kind === 'ocean' && c.hb != null && c.hb > C.RIP_HB && c.cur && c.cur.a != null && Math.abs(c.cur.a) < C.RIP_ANGLE;
  return c;
}

/* an activity at a beach and step: score, quality word, decided limits, forecast warnings */
function judge(act, b, c, day, i) {
  const R = RULES[act];
  if (!R.spots.includes(b.kind)) return null;
  const waveRule = R.decided.some((L) => L.var === 'hb');
  if (c.hb == null && (waveRule || act === 'surf' || act === 'swim' || act === 'fish')) return { refused: c.waves.refused };
  const s = c.hb == null ? R.score(Object.assign({}, c, { hb: 0 })) : R.score(c);
  const dec = R.decided.map((L) => {
    const band = L.var === 'hb' ? (c.waves.lo != null ? { lo: c.waves.lo, hi: c.waves.hi } : null)
      : (day.sea[i] && day.sea[i].lo != null ? { lo: cmDown(day.sea[i].lo), hi: cmUp(day.sea[i].hi) } : null);
    return Object.assign({ id: L.id, word: L.word, en: L.en, limit: L.value, var: L.var }, decideLimit(L, band));
  });
  const warn = R.warn.filter((W) => W.when(c)).map((W) => ({ id: W.id, word: W.word, en: W.en }));
  const flat = R.flat ? R.flat(c) : false;
  return { s, q: QUALITY(s), flat, dec, warn, worst: dec.some((d) => d.letter === 'V') ? 'V' : dec.some((d) => d.letter === 'I') ? 'I' : dec.length ? 'L' : null };
}

/* ------------------------------------------------------------------ the sun (NOAA's solar equations; shown and used for daylight) */
function sunTimes(dateStr, lat, lon) {
  const [Y, M, Dd] = dateStr.split('-').map(Number);
  const jd = Date.UTC(Y, M - 1, Dd, 12) / 86400000 + 2440587.5, n = jd - 2451545.0 + 0.0008;
  const Js = n - lon / 360, Mdeg = (357.5291 + 0.98560028 * Js) % 360, Mr = Mdeg * Math.PI / 180;
  const Cc = 1.9148 * Math.sin(Mr) + 0.02 * Math.sin(2 * Mr) + 0.0003 * Math.sin(3 * Mr);
  const lam = ((Mdeg + Cc + 180 + 102.9372) % 360) * Math.PI / 180;
  const Jt = 2451545.0 + Js + 0.0053 * Math.sin(Mr) - 0.0069 * Math.sin(2 * lam);
  const dlt = Math.asin(Math.sin(lam) * Math.sin(23.4397 * Math.PI / 180)), phi = lat * Math.PI / 180;
  const cw = (Math.sin(-0.833 * Math.PI / 180) - Math.sin(phi) * Math.sin(dlt)) / (Math.cos(phi) * Math.cos(dlt));
  const w0 = Math.acos(clamp(cw, -1, 1)) * 180 / Math.PI;
  const toMs = (J) => (J - 2440587.5) * 86400000;
  return { rise: toMs(Jt - w0 / 360), set: toMs(Jt + w0 / 360) };
}

/* ------------------------------------------------------------------ the whole day */
const ISLAND = { lat: -27.6, lon: -48.5 };
function computeAll(B, day) {
  const out = { beaches: [], daylight: [] };
  for (const st of day.steps) {
    const ms = Date.parse(st.t + ':00:00Z'), local = new Date(ms - 3 * 3600e3).toISOString().slice(0, 10);
    const s = sunTimes(local, ISLAND.lat, ISLAND.lon);
    out.daylight.push(ms >= s.rise && ms <= s.set);
  }
  for (const b of B.beaches) {
    const rows = [];
    for (let i = 0; i < day.steps.length; i++) {
      const c = at(B, day, b, i);
      const acts = {};
      for (const a of ACT_ORDER) acts[a] = judge(a, b, c, day, i);
      rows.push({ c, acts });
    }
    out.beaches.push({ b, rows });
  }
  return out;
}

/* the canonical lines the digest is taken over: heights and decided letters only (IEEE-exact arithmetic) */
function canon(all, day) {
  const lines = ['swell-canon-1 ' + day.run];
  for (const { b, rows } of all.beaches) {
    rows.forEach((r, i) => {
      const w = r.c.waves;
      const hb = w.refused ? 'R:' + w.refused : [w.c, w.lo == null ? '-' : w.lo, w.hi == null ? '-' : w.hi, w.capped ? 'cap' : ''].join(',');
      const lets = ACT_ORDER.map((a) => { const j = r.acts[a]; return j ? (j.refused ? 'R' : j.dec.map((d) => d.letter).join('')) : 'n'; }).join('|');
      lines.push([b.name, day.steps[i].t, hb, lets].join(' '));
    });
  }
  return lines;
}

/* the best window of a day for a beach: the best daylight step and the run of good steps around it */
function bestOfDay(all, beachIdx, idx, act, fromStep) {
  const rows = all.beaches[beachIdx].rows;
  let best = null;
  for (const i of idx) {
    if (!all.daylight[i] || i < fromStep) continue;
    const j = rows[i].acts[act]; if (!j || j.refused) continue;
    if (!best || j.s > best.s + 1e-9) best = { i, s: j.s, j };
  }
  if (!best) return null;
  const ok = (i) => all.daylight[i] && i >= fromStep && rows[i].acts[act] && !rows[i].acts[act].refused && rows[i].acts[act].s >= Math.max(0.33, 0.8 * best.s);
  let a = best.i, z = best.i;
  while (idx.includes(a - 1) && ok(a - 1)) a--;
  while (idx.includes(z + 1) && ok(z + 1)) z++;
  return Object.assign(best, { from: a, to: z });
}

module.exports = { C, RULES, ACT_ORDER, QUALITY, kProbes, probeEnergy, crossing, peak, breakHeight, chopAt, wavesAt, refused, seaOf, windAt, windClass,
  currentAt, decideLimit, at, judge, sunTimes, computeAll, canon, bestOfDay, dec2, cmDown, cmUp };
