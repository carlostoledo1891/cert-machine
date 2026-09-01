#!/usr/bin/env node
/* run.js — count the critical points of the terra re-certified equilibria.
   instruments/critcount · cert-machine

   Consumes OUR enclosure certificates (certs/terra-recert-*.json — not terra's
   records: the chain of custody stays inside this repo), counts the certified
   critical points of the density over the WHOLE ball and of the potential
   (thin), and writes certs/terra-peakcount-*.json.  Refuses unless the input
   certificate is VERIFIED.

   usage: node instruments/critcount/run.js t1|t6                            */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const CC = require('./critcount.js');

const ROOT = path.resolve(__dirname, '..', '..');
const tag = process.argv[2] || 't1';
const die = (m) => { console.error('critcount REFUSED: ' + m); process.exit(1); };

const certPath = path.join(ROOT, 'certs', `terra-recert-${tag}.json`);
if (!fs.existsSync(certPath)) die(`missing ${certPath} — run instruments/mfgcap/run_recert.py first`);
const E = JSON.parse(fs.readFileSync(certPath, 'utf8'));
if (E.verdict !== 'VERIFIED') die(`input certificate verdict is ${E.verdict}, not VERIFIED`);

const { N, nu } = E.instance;
const A1 = E.instance.A1 || 0, A2 = E.instance.A2 || 0, A3 = E.instance.A3 || 0;
const r = E.bounds.r;
const mCoef = E.candidate.mCoef;

const pads = CC.ballPads(r, nu);
console.log(`critcount ${tag}: N=${N} nu=${nu} r=${r.toExponential(3)}`);
console.log(`  ball pads: |dm'| <= ${pads.d1.toExponential(3)}  |dm''| <= ${pads.d2.toExponential(3)}  |dm'''| <= ${pads.d3.toExponential(3)}`);

const mCount = CC.certifiedCount(mCoef, pads, 'density m*');
if (mCount.refused) die('density: ' + mCount.refused);
console.log(`  density: EXACTLY ${mCount.maxima} maxima / ${mCount.minima} minima on the torus (min margin ${mCount.minMargin.toExponential(2)})`);

const vCoefs = [0, A1 / 2, A2 / 2, A3 / 2];
const vCount = CC.certifiedCount(vCoefs, { d1: 0, d2: 0, d3: 0 }, 'potential V');
if (vCount.refused) die('potential: ' + vCount.refused);
console.log(`  potential: EXACTLY ${vCount.maxima} maxima / ${vCount.minima} minima (wells) on the torus`);

const excess = mCount.maxima > vCount.minima;
const out = {
  what: `certified critical-point count for the ${tag.toUpperCase()} equilibrium and its potential`,
  statement: `EVERY function in the certified enclosure ball (radius ${r.toExponential(3)}, `
    + `l1_nu with nu=${nu}) around the ${tag.toUpperCase()} candidate density has EXACTLY `
    + `${mCount.maxima} strict local maxima and ${mCount.minima} strict local minima on the torus; `
    + `the potential has exactly ${vCount.minima} well(s). `
    + (excess
      ? 'Peaks exceed wells: gain-weighted well-counting beats flat well-counting — the '
        + 'equilibrium re-weights a harmonic the potential already contains (it does not '
        + '"invent structure").'
      : 'The ceiling holds at this instance (peaks <= wells).'),
  verdict: 'VERIFIED',
  source: { cert: path.relative(ROOT, certPath), verdict: E.verdict, r, nu, N },
  instance: E.instance,
  ballPads: pads,
  m: mCount,
  V: vCount,
  peaks: mCount.maxima,
  wells: vCount.minima,
  peaksExceedWells: excess,
  rigor: {
    countFrom: 'certified region signs only (float is the proposer, never the authority)',
    coefficientProducts: 'outward interval arithmetic, 2pi enclosed, trig argument rounding chain bounded',
    cellPad: '(L + ballPadNextDeriv) * h/2 + ballPad — the ball Lipschitz is folded in',
  },
  meta: {
    date: new Date().toISOString().slice(0, 10),
    git: (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })(),
  },
};
const of = path.join(ROOT, 'certs', `terra-peakcount-${tag}.json`);
fs.writeFileSync(of, JSON.stringify(out, null, 1));
console.log(`  wrote ${path.relative(ROOT, of)}  (peaks ${out.peaks} / wells ${out.wells})`);
