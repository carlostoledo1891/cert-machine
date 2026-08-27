/* power.js — eVTOL power BOXES from spec + physics packs.
   apps/skyaudit · cert-machine

   Kasliwal et al. 2019 (Nat. Commun. 10:1555, Methods) forms:
     hover  P = (m·g/η_h)·sqrt(δ/(2ρ))          [Eq. 7]
     cruise P = m·g·V/((L/D)·η_c)               [Eq. 13]
   Both are monotone in every parameter (increasing in m, δ, V; decreasing
   in η, L/D, ρ for hover), so box endpoints evaluate at parameter corners;
   results are padded outward by 4 ulp-scale steps so float evaluation
   never narrows the true enclosure. Calibration (battery): the paper's
   worked examples — 250.6 kW hover, 59.7 kW cruise — must fall inside the
   degenerate-box result.

   METHODOLOGY V2 (2026-08-27): cruise ENERGY is evaluated V-FREE via
   cruiseEnergyKwh — at any fixed parameter point, t·P(V) = m·g·D/((L/D)η)
   and V cancels EXACTLY, so enclosing the product through independent
   t and P(V) boxes (the v1 treatment, kept documented below) widened the
   true range by up to v_hi/v_lo (34% for the widest cruise box). The v2
   enclosure is the true per-point range — a tightness theorem, not a
   relaxed assumption. Reserve energy still uses P(V) over the cruise box:
   the SFAR's "normal cruising speed" is unpublished for every audited
   aircraft, so there V is a genuine unknown, not a cancellable one.       */
'use strict';

const G = 9.80665;
const PAD = 1e-12;
const padLo = (x) => x * (1 - PAD) - Number.MIN_VALUE;
const padHi = (x) => x * (1 + PAD) + Number.MIN_VALUE;

function chk(b, name) {
  if (!Array.isArray(b) || b.length !== 2 || !isFinite(b[0]) || !isFinite(b[1]) ||
      b[0] > b[1] || b[0] <= 0) throw new Error('power: bad box ' + name + ': ' + JSON.stringify(b));
  return b;
}

/* hover power box, kW: m [kg], delta [N/m^2], etaH (0,1], rho [kg/m^3] */
function hoverKw({ m_kg, delta_nm2, eta_h, rho }) {
  chk(m_kg, 'm_kg'); chk(delta_nm2, 'delta_nm2'); chk(eta_h, 'eta_h'); chk(rho, 'rho');
  const lo = (m_kg[0] * G / eta_h[1]) * Math.sqrt(delta_nm2[0] / (2 * rho[1])) / 1000;
  const hi = (m_kg[1] * G / eta_h[0]) * Math.sqrt(delta_nm2[1] / (2 * rho[0])) / 1000;
  return [padLo(lo), padHi(hi)];
}

/* cruise power box, kW: m [kg], v [km/h], ld (L/D), etaC (0,1] */
function cruiseKw({ m_kg, v_kmh, ld, eta_c }) {
  chk(m_kg, 'm_kg'); chk(v_kmh, 'v_kmh'); chk(ld, 'ld'); chk(eta_c, 'eta_c');
  const vLo = v_kmh[0] / 3.6, vHi = v_kmh[1] / 3.6;
  const lo = (m_kg[0] * G * vLo) / (ld[1] * eta_c[1]) / 1000;
  const hi = (m_kg[1] * G * vHi) / (ld[0] * eta_c[0]) / 1000;
  return [padLo(lo), padHi(hi)];
}

/* cruise time box, s, from a distance box [km] and speed box [km/h] */
function cruiseTimeS(dist_km, v_kmh) {
  chk(dist_km, 'dist_km'); chk(v_kmh, 'v_kmh');
  return [padLo((dist_km[0] / v_kmh[1]) * 3600), padHi((dist_km[1] / v_kmh[0]) * 3600)];
}

/* cruise ENERGY box, kWh, V-free (methodology v2): E = m·g·D/((L/D)·η_c).
   m [kg], d [km], ld (L/D), etaC (0,1]. Monotone in every parameter, so
   corners evaluate the true range; padded outward like every box here.
   1000 J/km per (kg·m/s^2) and 3.6e6 J/kWh give the 1/3600 factor. */
function cruiseEnergyKwh({ m_kg, dist_km, ld, eta_c }) {
  chk(m_kg, 'm_kg'); chk(dist_km, 'dist_km'); chk(ld, 'ld'); chk(eta_c, 'eta_c');
  const lo = (m_kg[0] * G * dist_km[0]) / (3600 * ld[1] * eta_c[1]);
  const hi = (m_kg[1] * G * dist_km[1]) / (3600 * ld[0] * eta_c[0]);
  return [padLo(lo), padHi(hi)];
}

module.exports = { hoverKw, cruiseKw, cruiseTimeS, cruiseEnergyKwh, G };
