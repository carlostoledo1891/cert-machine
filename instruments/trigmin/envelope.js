/* envelope.js — what a Newman hit has to beat: the best certified min|f|
   reachable with FEWER terms.

   Two parts, both stored as witness exponent SETS and re-certified here at
   load, so no value is ever transcribed. ANCHORS come from the literature and
   the source lab; ADOPTED are objects this lab certified and then promoted in a
   dated edit naming the run that produced them. Frozen at load: the bar never
   moves under a running campaign. */
'use strict';
const N = require('./newman.js');

const ANCHORS = [
  { n: 3,  A: [0,1,3],                       src: 'Campbell-Ferguson-Forcade 1983' },
  { n: 4,  A: [0,1,2,4],                     src: 'Goddard 1992' },
  { n: 5,  A: [0,1,2,6,9],                   src: 'Mercer 2019, exactly 1' },
  { n: 6,  A: [0,6,9,10,17,24],              src: 'Goddard 1992; certified in sin-mfg' },
  { n: 7,  A: [0,3,7,8,10,16,22],            src: 'sin-mfg box maximum' },
  { n: 8,  A: [0,3,9,11,13,16,17,21],        src: 'sin-mfg box maximum' },
  { n: 9,  A: [0,1,2,3,4,7,8,10,12],         src: 'Boyd 1986' },
  { n: 19, A: [0,4,6,7,8,10,11,12,15,16,17,22,24,25,26,29,32,35,38], src: 'Hare-Jankauskas Eq. (2.1)' }
];

const ADOPTED = [
  { n: 17, A: [0,4,6,7,8,10,11,12,15,17,24,25,26,29,32,35,38],
    from: 'hj-subsets-1', src: 'HJ minus {16,22}; only one of 171 subsets clearing bar(17)' },
  /* 2026-08-25: the mu-table box30 champions (tools/run-mu-table.js ->
     certs/mu-table.json, battery-gated) — each the certified maximum of an
     EXHAUSTIVE sweep over {0} u (n-1 exponents <= 30), n = 9..17. The n=9
     row beats Boyd's anchor witness; n=17's box champion beats the adopted
     HJ subset. Values re-certified at load like every other row. */
  { n: 9,  A: [0,1,2,3,9,12,19,23,27],                        from: 'mu-table', src: 'box30 maximum' },
  { n: 10, A: [0,1,4,8,9,10,14,20,23,25],                     from: 'mu-table', src: 'box30 maximum' },
  { n: 11, A: [0,1,2,7,8,10,12,21,24,25,28],                  from: 'mu-table', src: 'box30 maximum' },
  { n: 12, A: [0,1,2,9,12,13,14,16,18,19,22,24],              from: 'mu-table', src: 'box30 maximum' },
  { n: 13, A: [0,1,2,4,6,7,8,13,16,17,20,25,28],              from: 'mu-table', src: 'box30 maximum' },
  { n: 14, A: [0,2,3,4,5,7,10,12,13,14,16,20,21,25],          from: 'mu-table', src: 'box30 maximum' },
  { n: 15, A: [0,1,2,3,4,5,9,10,14,17,20,22,24,26,28],        from: 'mu-table', src: 'box30 maximum' },
  { n: 16, A: [0,1,2,3,5,6,7,8,11,14,15,16,18,23,25,27],      from: 'mu-table', src: 'box30 maximum' },
  { n: 17, A: [0,1,2,3,8,11,13,14,16,17,18,20,22,23,26,27,30],from: 'mu-table', src: 'box30 maximum' }
];

const VALUE = new Map();
for (const a of ANCHORS.concat(ADOPTED)) {
  const c = N.certifyNewman(a.A, { bar: 0 });
  const prev = VALUE.get(a.n);
  if (prev === undefined || c.modSq[0] > prev) VALUE.set(a.n, c.modSq[0]);
}

function barSq(n) { let b = 0; for (const [k, v] of VALUE) if (k < n && v > b) b = v; return b; }

/* names any term count where a board holds more than the envelope knows */
function audit(entries) {
  const out = [];
  for (const e of (entries || [])) {
    const c = e && (e.extra || e.certificate);
    if (!c || typeof c.n !== 'number' || !c.modSq) continue;
    if (c.modSq[0] > barSq(c.n + 1)) out.push({ n: c.n, A: c.A, modSq: c.modSq, envelopeHas: barSq(c.n + 1) });
  }
  return out;
}

module.exports = { ANCHORS, ADOPTED, VALUE, barSq, audit };
