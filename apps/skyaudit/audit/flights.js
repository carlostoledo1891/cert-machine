/* flights.js — certified flight segmentation over readsb day traces.
   apps/skyaudit · cert-machine

   Deterministic rules, stated: a trace's timestamps must be non-decreasing
   (a scrambled trace THROWS — battery red); the trace splits at gaps
   > 900 s; inside a segment a FLIGHT is a maximal airborne run, where
   ground contact shorter than 60 s (a hover-taxi blip) does not end the
   flight but a longer one does. A flight is kept when it spans >= 120 s,
   has >= 8 airborne points, and covers >= 1 km of path. Every flight
   carries honesty flags: truncatedStart/End (no ground contact observed
   at that end — coverage, not physics) and gap counts (airborne dt > 60 s
   — path under those gaps is unobserved).                                 */
'use strict';

const GAP_SPLIT_S = 900;
const GROUND_END_S = 60;
const MIN_SPAN_S = 120;
const MIN_POINTS = 8;
const MIN_PATH_KM = 1;

const R_EARTH_KM = 6371.0088;
function havKm(lat1, lon1, lat2, lon2) {
  const d = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * d) / 2) ** 2 +
    Math.cos(lat1 * d) * Math.cos(lat2 * d) * Math.sin(((lon2 - lon1) * d) / 2) ** 2;
  return 2 * R_EARTH_KM * Math.asin(Math.sqrt(a));
}

/* readsb trace entry: [t_off, lat, lon, alt_baro|"ground", gs_kt, ...] */
function parsePoints(obj) {
  const base = obj.timestamp || 0;
  const pts = [];
  let prev = -Infinity;
  for (const e of obj.trace || []) {
    if (!Array.isArray(e) || typeof e[0] !== 'number') continue;
    if (typeof e[1] !== 'number' || typeof e[2] !== 'number') continue;
    const t = base + e[0];
    if (t < prev) throw new Error('flights: non-monotonic timestamps (scrambled trace) at offset ' + e[0]);
    if (t === prev) continue;                       /* exact duplicate instant: drop */
    prev = t;
    pts.push({ t, lat: e[1], lon: e[2], ground: e[3] === 'ground',
      alt: typeof e[3] === 'number' ? e[3] : 0, gs: typeof e[4] === 'number' ? e[4] : null });
  }
  return pts;
}

function metrics(run) {
  let pathKm = 0, gapCount = 0, gapMaxS = 0, dwellS = 0, maxAlt = 0;
  const gss = [];
  for (let i = 1; i < run.length; i++) {
    const a = run[i - 1], b = run[i];
    const dt = b.t - a.t;
    pathKm += havKm(a.lat, a.lon, b.lat, b.lon);
    if (dt > 60) { gapCount++; gapMaxS = Math.max(gapMaxS, dt); }
    if (a.gs !== null && a.gs < 10) dwellS += dt;
  }
  for (const p of run) { if (p.alt > maxAlt) maxAlt = p.alt; if (p.gs !== null) gss.push(p.gs); }
  gss.sort((x, y) => x - y);
  const s = run[0], e = run[run.length - 1];
  return {
    tStart: s.t, tEnd: e.t, durationS: e.t - s.t, points: run.length,
    pathKm, gcKm: havKm(s.lat, s.lon, e.lat, e.lon),
    start: { lat: s.lat, lon: s.lon }, end: { lat: e.lat, lon: e.lon },
    maxAltFt: maxAlt, medianGsKt: gss.length ? gss[(gss.length - 1) >> 1] : null,
    dwellS, gapCount, gapMaxS,
  };
}

function segmentTrace(obj) {
  const pts = parsePoints(obj);
  const flights = [];
  /* split at long gaps */
  const segs = [];
  let cur = [];
  for (const p of pts) {
    if (cur.length && p.t - cur[cur.length - 1].t > GAP_SPLIT_S) { segs.push(cur); cur = []; }
    cur.push(p);
  }
  if (cur.length) segs.push(cur);

  for (const seg of segs) {
    let run = [];              /* current airborne run */
    let groundSince = null;    /* time ground contact began, while a run is open */
    let sawGroundBefore = false;
    const close = (truncatedEnd) => {
      if (run.length >= MIN_POINTS) {
        const m = metrics(run);
        if (m.durationS >= MIN_SPAN_S && m.pathKm >= MIN_PATH_KM) {
          m.truncatedStart = !sawGroundBefore;
          m.truncatedEnd = truncatedEnd;
          flights.push(m);
        }
      }
      run = []; groundSince = null;
    };
    for (const p of seg) {
      if (p.ground) {
        if (run.length) {
          if (groundSince === null) groundSince = p.t;
          if (p.t - groundSince >= GROUND_END_S) { close(false); sawGroundBefore = true; }
        } else sawGroundBefore = true;
      } else {
        groundSince = null;
        run.push(p);
      }
    }
    close(true);               /* segment ended airborne: truncated end */
  }
  return flights;
}

module.exports = { segmentTrace, parsePoints, havKm,
  GAP_SPLIT_S, GROUND_END_S, MIN_SPAN_S, MIN_POINTS, MIN_PATH_KM };
