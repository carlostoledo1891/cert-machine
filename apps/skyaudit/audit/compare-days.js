/* compare-days.js — day-stability: the same audit, two pinned days, the
   deltas stated honestly. apps/skyaudit · cert-machine

   Reads the committed audit summaries (and refly records where present)
   of a RECORD day and a CONTRAST day and writes the comparison as a
   record into the contrast day's directory. Pure derivation — every
   number here is recomputable from the two summaries, and the companion
   report re-derives it at build and refuses on drift.

   usage: node compare-days.js <city> <recordDayDir> <contrastDayDir>     */
'use strict';

const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '../data');
const J = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

function derive(city, dayA, dayB) {
  const A = J(path.join(DATA, dayA, city + '.audit-summary.json'));
  const B = J(path.join(DATA, dayB, city + '.audit-summary.json'));
  const reflyP = (d) => path.join(DATA, d, city + '.refly.json');
  const RA = fs.existsSync(reflyP(dayA)) ? J(reflyP(dayA)) : null;
  const RB = fs.existsSync(reflyP(dayB)) ? J(reflyP(dayB)) : null;
  const BETA = 'beta-alia|faa-sfar-vfr';

  const keys = [...new Set([...Object.keys(A.bySpecRule), ...Object.keys(B.bySpecRule)])].sort();
  const bySpecRule = {};
  for (const k of keys) {
    const a = A.bySpecRule[k] || {}, b = B.bySpecRule[k] || {};
    bySpecRule[k] = {};
    for (const v of ['CERTIFIED', 'REFUTED', 'REFUSED']) bySpecRule[k][v] = { record: a[v] || 0, contrast: b[v] || 0 };
  }
  const pct = (s) => Math.round((s.bySpecRule[BETA] ? s.bySpecRule[BETA].CERTIFIED : 0) / s.flights * 1000) / 10;
  return {
    what: 'day-stability comparison — derived only from the two committed audit summaries (+ refly records); rerun: node apps/skyaudit/audit/compare-days.js',
    city, record: dayA, contrast: dayB,
    summary: {
      uniqueAircraft: { record: A.uniqueAircraft, contrast: B.uniqueAircraft },
      audited: { record: A.aircraft, contrast: B.aircraft },
      flights: { record: A.flights, contrast: B.flights },
      rows: { record: A.rows, contrast: B.rows },
      totalPathKm: { record: A.flightStats.totalPathKm, contrast: B.flightStats.totalPathKm },
    },
    bySpecRule,
    eflyable: {
      record: A.bySpecRule[BETA].CERTIFIED, contrast: B.bySpecRule[BETA].CERTIFIED,
      pct: { record: pct(A), contrast: pct(B) },
    },
    fleet: RA && RB ? {
      fleetMin: { record: RA.keys[BETA].fleetMin, contrast: RB.keys[BETA].fleetMin },
      certifiedLegs: { record: RA.keys[BETA].certifiedLegs, contrast: RB.keys[BETA].certifiedLegs },
    } : null,
  };
}

module.exports = { derive };

if (require.main === module) {
  const [city, dayA, dayB] = process.argv.slice(2);
  if (!city || !dayA || !dayB) { console.error('usage: node compare-days.js <city> <recordDayDir> <contrastDayDir>'); process.exit(2); }
  const out = derive(city, dayA, dayB);
  const p = path.join(DATA, dayB, city + '.compare.json');
  fs.writeFileSync(p, JSON.stringify(out, null, 1) + '\n');
  console.log('compare: ' + city + ' ' + dayA + ' vs ' + dayB
    + ' — E-FLYABLE ' + out.eflyable.record + ' (' + out.eflyable.pct.record + '%) vs '
    + out.eflyable.contrast + ' (' + out.eflyable.pct.contrast + '%)'
    + (out.fleet ? ' · fleet ' + out.fleet.fleetMin.record + ' vs ' + out.fleet.fleetMin.contrast : '')
    + ' -> ' + p);
}
