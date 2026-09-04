/* data.js — two real calibrations, at opposite ends of the same problem.
 *
 * Both are used the same way in practice: run the standards, fit a curve,
 * measure an unknown, read a number off the fit. They differ in the two things
 * that decide how much the fit is doing — how finely the ladder is spaced, and
 * how well the response repeats.
 */
'use strict';
const fs = require('fs');
const path = require('path');

/* ---------------------------------------------------------------- Pontius --
   NIST Statistical Reference Datasets, "Pontius": a load cell calibration by
   P. Pontius at NIST. Twenty loads, each applied twice, deflection recorded.
   NIST publishes certified regression coefficients for it — the dataset exists
   so that people can check whether their least-squares SOFTWARE is correct,
   which is a statement about arithmetic and not about the model. The certified
   quadratic is used here as "what gets reported", which is what it is.

   The error budget needs no assumption: the two runs give a measured pooled
   repeatability directly.                                                    */
function pontius() {
  const raw = fs.readFileSync(path.join(__dirname, 'data', 'Pontius.dat'), 'utf8')
    .split('\n').slice(60, 100).map(l => l.trim().split(/\s+/)).filter(a => a.length === 2);
  const obs = raw.map(a => ({ y: +a[0], x: +a[1] }));
  const loads = [...new Set(obs.map(o => o.x))].sort((a, b) => a - b);
  const reps = loads.map(L => obs.filter(o => o.x === L).map(o => o.y));
  const ybar = reps.map(v => v.reduce((t, x) => t + x, 0) / v.length);
  /* pooled within-load SD from duplicates: sqrt( mean( d^2 / 2 ) ) */
  const sPooled = Math.sqrt(reps.reduce((t, v) => t + (v[0] - v[1]) ** 2 / 2, 0) / loads.length);
  return {
    id: 'pontius',
    title: 'a load cell, calibrated at NIST',
    source: 'NIST Statistical Reference Datasets — Pontius. 40 observations, 20 loads applied twice.',
    xName: 'load', xUnit: 'lb', yName: 'deflection', yUnit: '',
    sense: 1, x: loads, y: ybar, reps, xScale: 'linear',
    /* the error budget is measured, not stated */
    errKind: 'measured', sPooled,
    err: (k) => loads.map(() => k * sPooled),
    reported: {
      kind: 'NIST certified quadratic',
      note: 'Certified by NIST to 15 digits — as arithmetic. The dataset exists to test regression software, and certifying a fit is not a claim that the model is right.',
      f: (x) => 0.673565789473684e-03 + 0.732059160401003e-06 * x - 0.316081871345029e-14 * x * x,
      residSD: 0.205177424076185e-03,
    },
    ask: 1.15,                       // a deflection to read backwards
    askLabel: 'a measured deflection of',
  };
}

/* ------------------------------------------------------------------ IL-6 ---
   A published seven-point standard curve for a rat IL-6 sandwich ELISA
   (Abbexa abx155737), absorbances as printed, with the zero standard.
   Two doublings per decade — the ordinary spacing of a dilution ladder, and
   about as coarse as calibrations get.

   Unlike the load cell there are no replicates, so the error budget cannot be
   measured from these numbers. It is therefore an ASSERTION by whoever reads
   the plate, and it stays a control on the page rather than a constant buried
   here. The default is an ordinary intra-assay CV with a plate-reader floor. */
function il6() {
  const x = [0, 1.56, 3.12, 6.25, 12.5, 25, 50, 100];
  const y = [0.115, 0.296, 0.372, 0.459, 0.684, 1.14, 1.917, 3.148];
  return {
    id: 'il6',
    title: 'a rat IL-6 assay, calibrated on a dilution ladder',
    source: 'Published example standard curve, rat IL-6 sandwich ELISA (Abbexa abx155737). Absorbance at 450 nm, zero standard included.',
    xName: 'concentration', xUnit: 'pg/mL', yName: 'absorbance', yUnit: 'OD',
    sense: 1, x, y, reps: null,
    /* A dilution ladder is a geometric series, and a sandwich ELISA is close to
       straight in log concentration through its working middle — which is why
       everyone plots it that way. Asserting smoothness in the coordinate the
       response is actually smooth in is not a trick; asserting it in the wrong
       one just makes the claim vacuous. The zero standard has no place on a log
       axis and is the blank, so it bounds the bottom of the ladder and is not
       part of the smoothness claim. */
    xScale: 'log',
    errKind: 'stated', cv: 0.08, floor: 0.01,
    err: (k, cv = 0.08, floor = 0.01) => y.map(v => k * Math.max(floor, cv * v)),
    reported: { kind: 'four-parameter logistic', note: 'The standard practice for a sandwich ELISA. Fitted here to the eight standards.', f: null, residSD: null },
    ask: 0.90,
    askLabel: 'a measured absorbance of',
  };
}

module.exports = { pontius, il6, all: () => [pontius(), il6()] };
