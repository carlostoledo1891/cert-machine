/* planner.js — the certified flight planner: every heliport pair, routed
   over the corridor graph, decided by the same instrument as everything
   else. apps/skyaudit/sim · cert-machine

   For each of the 21 origin-destination pairs: Dijkstra over the city
   pack's corridor graph (haversine edge lengths), then the route's
   distance box (same pads as observed missions) x every spec x both
   rules -> the full three-valued verdict with margins, plus cruise-time
   and charge-after boxes. 100% precomputed and gate-checked: the client
   only looks up. A planning aid, never navigation.

   Usage: node planner.js [city] -> data/<day>/<city>.planner.json        */
'use strict';

const fs = require('fs');
const path = require('path');
const M = require('../audit/mission.js');
const { havKm } = require('../audit/flights.js');

function loadCity(id) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '../scenario/cities', id + '.json'), 'utf8'));
}

function nodePos(city, id) { return city.heliports[id] || city.waypoints[id]; }

function dijkstra(city, from, to) {
  const nodes = [...Object.keys(city.heliports), ...Object.keys(city.waypoints)];
  const adj = new Map(nodes.map((n) => [n, []]));
  for (const [a, b, band] of city.edges) {
    const d = havKm(nodePos(city, a).lat, nodePos(city, a).lon, nodePos(city, b).lat, nodePos(city, b).lon);
    adj.get(a).push({ to: b, d, band });
    adj.get(b).push({ to: a, d, band });
  }
  const dist = new Map(nodes.map((n) => [n, Infinity]));
  const prev = new Map();
  dist.set(from, 0);
  const open = new Set(nodes);
  while (open.size) {
    let u = null;
    for (const n of open) if (u === null || dist.get(n) < dist.get(u)) u = n;
    open.delete(u);
    if (u === to || dist.get(u) === Infinity) break;
    for (const e of adj.get(u)) {
      const nd = dist.get(u) + e.d;
      if (nd < dist.get(e.to)) { dist.set(e.to, nd); prev.set(e.to, { from: u, band: e.band }); }
    }
  }
  if (!prev.has(to) && from !== to) return null;
  const pathIds = [to];
  const bands = [];
  let cur = to;
  while (cur !== from) { const p = prev.get(cur); bands.unshift(p.band); cur = p.from; pathIds.unshift(cur); }
  return { km: dist.get(to), pathIds, bands };
}

function run(cityId, dayDir) {
  dayDir = dayDir || 'day-2026-08-26';
  const city = loadCity(cityId);
  const phys = M.loadPhysics('kasliwal-2019');
  const specs = ['joby-s4', 'archer-midnight', 'beta-alia', 'eve-100'].map(M.loadSpec);
  const rules = ['faa-sfar-vfr', 'easa-final-reserve'].map(M.loadRule);
  const H = Object.keys(city.heliports);
  const routes = [];
  for (let i = 0; i < H.length; i++) for (let j = i + 1; j < H.length; j++) {
    const r = dijkstra(city, H[i], H[j]);
    if (!r) continue;
    const coords = r.pathIds.map((id) => { const p = nodePos(city, id); return [+p.lon.toFixed(5), +p.lat.toFixed(5)]; });
    const bandSet = [...new Set(r.bands)];
    const flight = { pathKm: r.km, gcKm: havKm(nodePos(city, H[i]).lat, nodePos(city, H[i]).lon, nodePos(city, H[j]).lat, nodePos(city, H[j]).lon) };
    const verdicts = {};
    for (const s of specs) for (const ru of rules) {
      const row = M.auditFlight(flight, s, ru, phys);
      const vBox = s.boxes.v_cruise_kmh.v;
      const tMin = [r.km / vBox[1] * 60, r.km / vBox[0] * 60].map((x) => Math.round(x));
      const chg = s.boxes.charge_minutes_full.v;
      const depth = Math.min(1, row.used_kwh[1] / (s.boxes.battery_kwh.v[0] * phys.boxes.usable_frac.v[0]));
      verdicts[s.id + '|' + ru.id] = { v: row.verdict[0] === 'C' ? 'C' : row.verdict[0] === 'R' && row.verdict === 'REFUTED' ? 'R' : 'F',
        m: typeof row.margin_kwh === 'number' ? +row.margin_kwh.toFixed(1)
          : { w: +row.margin_kwh.worst.toFixed(1), b: +row.margin_kwh.best.toFixed(1) },
        t_min: tMin, charge_after_min: Math.ceil(chg[1] * depth) };
    }
    routes.push({ from: H[i], to: H[j], km: +r.km.toFixed(1), coords, bands: bandSet, verdicts });
  }
  return { city: cityId, dayDir, heliports: city.heliports, bandsLegend: city.bands,
    honesty: city.honesty + ' - GO/NO-GO here means the ENERGY question only, decided as a mathematically certified enclosure; it is not an operational clearance.',
    routes };
}

module.exports = { run, dijkstra, loadCity };

if (require.main === module) {
  const res = run(process.argv[2] || 'nyc', process.argv[3]);
  const out = path.join(__dirname, '../data', res.dayDir, res.city + '.planner.json');
  fs.writeFileSync(out, JSON.stringify(res, null, 1));
  for (const r of res.routes) {
    console.log(r.from + '→' + r.to, String(r.km).padStart(5), 'km ',
      Object.entries(r.verdicts).filter(([k]) => k.endsWith('faa-sfar-vfr')).map(([k, v]) => k.split('|')[0].split('-')[0] + ':' + v.v).join(' '));
  }
}
