#!/usr/bin/env node
/* battery.js — instruments/critcount: green calibrations on closed-form
   two/three-harmonic layouts, the record walk, and the FOUR red controls
   TERRA-PORT.md names as conditions of entry.  A counter that cannot refuse
   is a fake theorem generator.                                             */
'use strict';

const fs = require('fs');
const path = require('path');
const CC = require('./critcount.js');

const ROOT = path.resolve(__dirname, '..', '..');
let checks = 0, fails = 0;
const ok = (c, m) => { checks++; if (!c) fails++; console.log((c ? '  ok    ' : '  FAIL  ') + m); };
const red = (c, m) => { checks++; if (!c) fails++; console.log((c ? '  RED ok  ' : '  RED FAIL  ') + m); };
const thin = { d1: 0, d2: 0, d3: 0 };

/* ---- green: closed-form calibrations (counts derivable by hand) ---- */
// pure first harmonic: one max (x=0), one min (x=1/2)
let r1 = CC.certifiedCount([0, 0.5], thin, 'cos');
ok(!r1.refused && r1.maxima === 1 && r1.minima === 1, 'pure cosine: exactly 1 max / 1 min');
ok(r1.curv.join('') === '-+', 'pure cosine: certified chain is max at 0, min at 1/2');

// two harmonics below the 1/4 threshold: still single-well (4 A2 < A1)
let r2 = CC.certifiedCount([0, 0.5, 0.1], thin, 'r=0.2');
ok(!r2.refused && r2.maxima === 1 && r2.minima === 1, 'r = 0.2 < 1/4: exactly 1 max / 1 min');

// two harmonics above the threshold: the split (4 A2 > A1)
let r3 = CC.certifiedCount([0, 0.5, 0.15], thin, 'r=0.3');
ok(!r3.refused && r3.maxima === 2 && r3.minima === 2, 'r = 0.3 > 1/4: exactly 2 maxima / 2 minima');
ok(r3.assertions && r3.assertions.countFrom === 'certified region signs only',
  'count derives from certified region signs, not float signs');

// third harmonic above ITS threshold (r3 > 1/3, the Chebyshev U_2 law): three peaks
let r4 = CC.certifiedCount([0, 0.5, 0, 0.2], thin, 'r3=0.4');
ok(!r4.refused && r4.maxima === 3 && r4.minima === 3, 'r3 = 0.4 > 1/3: exactly 3 maxima / 3 minima');

// ball pads are rigorous and monotone in the radius
const pA = CC.ballPads(1e-13, 1.02), pB = CC.ballPads(1e-12, 1.02);
ok(pA.d1 > 0 && pA.d2 > pA.d1 && pA.d3 > pA.d2, 'ball pads positive and increasing in derivative order');
ok(pB.d2 > 9 * pA.d2 && pB.d2 < 11 * pA.d2, 'ball pads scale linearly with the radius');

/* ---- green: the record walk (the terra counts, re-proved here) ---- */
for (const [tag, peaks, wells] of [['t1', 2, 1], ['t6', 3, 1]]) {
  const p = path.join(ROOT, 'certs', `terra-peakcount-${tag}.json`);
  ok(fs.existsSync(p), `certs/terra-peakcount-${tag}.json exists`);
  if (!fs.existsSync(p)) continue;
  const c = JSON.parse(fs.readFileSync(p, 'utf8'));
  ok(c.verdict === 'VERIFIED' && c.peaks === peaks && c.wells === wells,
    `${tag}: EXACTLY ${peaks} peaks over ${wells} well, VERIFIED`);
  ok(c.peaksExceedWells === true, `${tag}: peaks exceed wells at this instance`);
  ok(!/invent/.test(c.statement) || /does not "invent structure"/.test(c.statement),
    `${tag}: statement carries the honest re-weighting framing, not the overclaim`);
  ok(c.m.assertions && c.m.assertions.curvatureAlternates && c.m.assertions.slopeMatchesChain,
    `${tag}: chain assertions recorded on the density count`);
  ok(c.source && /terra-recert/.test(c.source.cert) && c.source.verdict === 'VERIFIED',
    `${tag}: count consumed OUR VERIFIED enclosure certificate, not a terra record`);
}

/* ---- the four red controls TERRA-PORT requires to FIRE ---- */
// R1: mutated region boundary — a slope region stretched across a critical point
const probe = CC.certifiedCount([0, 0.5, 0.15], thin, 'probe');
const Rb1 = probe.regions.filter((x) => x.kind === 'slope').map((x) => x.lo);
const Lb1 = probe.regions.filter((x) => x.kind === 'slope').map((x) => x.hi);
const LbBad = Lb1.slice(); LbBad[0] = probe.chain[1] + 0.6 * (probe.chain[2] - probe.chain[1]);
const m1 = CC.certifiedCount([0, 0.5, 0.15], thin, 'mut-boundary', { _regionOverride: { Rb: Rb1, Lb: LbBad } });
red(!!m1.refused, `mutated region boundary refuses (${m1.refused || 'DID NOT REFUSE'})`);

// R2: zeroed ball pad — the pad must be load-bearing, not decorative.
// A wide ball (r = 0.05) around the near-threshold split: with true pads the
// second-harmonic sign regions cannot be certified; with pads forged to zero
// the same chain sails through.  Both directions asserted.
const padsWide = CC.ballPads(0.05, 1.02);
const m2true = CC.certifiedCount([0, 0.5, 0.130], padsWide, 'wide-ball');
const m2forged = CC.certifiedCount([0, 0.5, 0.130], thin, 'wide-ball-forged');
red(!!m2true.refused && !m2forged.refused,
  `zeroed ball pad is caught as load-bearing (true pads: ${m2true.refused ? 'refuse' : 'pass'}, forged: ${m2forged.refused ? 'refuse' : 'pass'})`);

// R3: degenerate f'' = 0 at a critical point (b1 = -4, b2 = 1 makes f''(0) = 0)
const m3 = CC.certifiedCount([0, -4, 1], thin, 'degenerate');
red(!!m3.refused && /degenerate/.test(m3.refused), `degenerate curvature refuses (${m3.refused})`);

// R4: two critical points in one curvature region — the first curvature region
// stretched past the next critical point; f'' changes sign inside, cannot certify
const RbBad = Rb1.slice(); RbBad[0] = probe.chain[1] + 0.6 * (probe.chain[2] - probe.chain[1]);
const m4 = CC.certifiedCount([0, 0.5, 0.15], thin, 'two-in-one', { _regionOverride: { Rb: RbBad, Lb: Lb1 } });
red(!!m4.refused, `two critical points in one curvature region refuses (${m4.refused || 'DID NOT REFUSE'})`);

console.log(`critcount battery: ${checks} checks, ${fails} failures`);
process.exit(fails ? 1 : 0);
