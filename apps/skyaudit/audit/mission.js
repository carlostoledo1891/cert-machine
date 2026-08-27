/* mission.js — the counterfactual bridge: a real observed flight, re-flown
   by an eVTOL spec under a reserve rule. apps/skyaudit · cert-machine

   THE COUNTERFACTUAL, precisely: "had a mission over THIS flight's route
   distance been flown by an aircraft with THESE published/assumed
   parameter boxes, under THIS reserve rule, would terminal energy clear
   the reserve floor at EVERY point of the boxes?" The eVTOL flies its own
   cruise-speed box over the observed DISTANCE box — never the
   helicopter's timing. Climb/descent fold into cruise (Kasliwal's own
   simplification, stated); hover covers takeoff + landing.

   Verdicts come from instruments/evtol/energy.js: CERTIFIED / REFUTED
   (exact-rational falsifying corner) / REFUSED (boxes straddle — with
   assumption-grade specs this is a MEASUREMENT of public knowledge).      */
'use strict';

const path = require('path');
const fs = require('fs');
const energy = require(path.join(__dirname, '../../../instruments/evtol/energy.js'));
const power = require('./power.js');

function loadJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
const SCEN = path.join(__dirname, '../scenario');
function loadSpec(id) { return loadJson(path.join(SCEN, 'specs', id + '.json')); }
function loadRule(id) { return loadJson(path.join(SCEN, 'rules', id + '.json')); }
function loadPhysics(id) { return loadJson(path.join(SCEN, 'physics', id + '.json')); }

/* distance box from an observed flight (pads are stated assumptions in
   the physics pack); floored at the great-circle distance */
function distanceBox(flight, phys) {
  const pads = phys.mission_distance_pads;
  const lo = Math.max(flight.gcKm, flight.pathKm * pads.lo_frac);
  const hi = flight.pathKm * pads.hi_frac;
  return [Math.min(lo, hi), hi];
}

function buildAudit(flight, spec, rule, phys) {
  const B = (k) => spec.boxes[k].v;
  const P = (k) => phys.boxes[k].v;
  const pHover = power.hoverKw({ m_kg: B('m_kg'), delta_nm2: B('delta_nm2'), eta_h: P('eta_h'), rho: P('rho') });
  const pCruise = power.cruiseKw({ m_kg: B('m_kg'), v_kmh: B('v_cruise_kmh'), ld: P('ld'), eta_c: P('eta_c') });
  const dist = distanceBox(flight, phys);

  /* methodology v2: cruise energy is V-FREE — at every parameter point
     t·P(V) = m·g·D/((L/D)η), so the segment carries the exact energy box
     as a 1-hour pseudo-segment (t/3600·p = E; corner semantics preserved).
     The reserve leg below still uses P(V): "normal cruising speed" is
     unpublished for every audited aircraft — there V is a real unknown. */
  const eCruise = power.cruiseEnergyKwh({ m_kg: B('m_kg'), dist_km: dist, ld: P('ld'), eta_c: P('eta_c') });

  const mission = { segments: [
    { name: 'hover (takeoff+landing)', t_s: P('hover_budget_s'), p_kw: pHover },
    { name: 'cruise ' + dist[0].toFixed(1) + '-' + dist[1].toFixed(1) + ' km (energy-exact, V cancels)',
      t_s: [3600, 3600], p_kw: eCruise },
  ] };
  const cap = B('battery_kwh'), uf = P('usable_frac');
  const usable = [cap[0] * uf[0], cap[1] * uf[1]];
  const reserveP = rule.reserve.power === 'hover' ? pHover : pCruise;
  const battery = {
    usable_kwh: usable, eta: P('eta_batt'),
    reserve: { t_s: rule.reserve.t_s, p_kw: reserveP },
  };
  return { mission, battery, dist, pHover, pCruise };
}

/* one audit row: flight x spec x rule -> certificate */
function auditFlight(flight, spec, rule, phys) {
  const { mission, battery, dist, pHover, pCruise } = buildAudit(flight, spec, rule, phys);
  const cert = energy.certify(mission, battery);
  return {
    spec: spec.id, rule: rule.id, verdict: cert.verdict,
    dist_km: dist, p_hover_kw: pHover, p_cruise_kw: pCruise,
    margin_kwh: cert.margin_kwh,
    used_kwh: cert.enclosure.used_kwh, reserve_kwh: cert.enclosure.reserve_kwh,
    usable_kwh: cert.enclosure.usable_kwh,
    witness: cert.witness ? { corner: cert.witness.corner, margin: cert.witness.margin_str } : undefined,
    text: cert.text,
  };
}

module.exports = { buildAudit, auditFlight, distanceBox, loadSpec, loadRule, loadPhysics };
