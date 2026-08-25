#!/usr/bin/env node
/* battery.js — the entropy instrument's gate.

   Calibration with a known answer: deep in the Devaney–Nitecki horseshoe
   regime (a = 6, b = 0.3) the certified graph must be the full 2-shift and
   the bound must be exactly ln 2. Red controls: a covering that does not
   hold must refuse (three different ways — no stretch, lid violation,
   wrong target), non-disjoint h-sets must refuse the whole graph, and the
   spectral bound must be exact on hand matrices. Finally the DETACHED
   certificate (certs/entropy-henon.json) is re-verified edge by edge from
   scratch — the battery re-derives the bound it ships. */
'use strict';

const fs = require('fs');
const path = require('path');
const E = require('#instruments/entropy/covering.js');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('PASS  ' + m); } else { fail++; console.log('FAIL  ' + m); } };

/* ---- calibration: the full horseshoe, h = ln 2 exactly ---- */
const map6 = E.henonSpec(6, 0.3);
const H = 0.6, w = 0.17, x0 = 0.38, kap = 0.3 * H / (12 * x0);
const Np = { c: [x0, 0], A: [[w, kap], [0, H]] };
const Nm = { c: [-x0, 0], A: [[w, -kap], [0, H]] };
{
  const g = E.certifyGraph(map6, [Np, Nm], [[0, 0], [0, 1], [1, 0], [1, 1]], { cells: 60000 });
  ok(g.ok && g.certified.length === 4 && Math.abs(g.hLB - Math.log(2)) < 1e-12,
    'CALIBRATION: Devaney–Nitecki regime (a=6) certifies the FULL 2-shift — h >= ln 2 exactly ('
    + (g.ok ? g.hLB.toFixed(12) : g.why) + ')');
}

/* ---- RED: coverings that do not hold must refuse ---- */
{
  const far = { c: [5, 5], A: [[0.1, 0], [0, 0.1]] };
  const c1 = E.covers(map6, Np, far);
  ok(!c1.ok, 'RED: a target the image never reaches is REFUSED (' + c1.why.slice(0, 44) + '…)');

  const fat = { c: [x0, 0], A: [[w * 40, kap], [0, H]] };      /* too wide to stretch across */
  const c2 = E.covers(map6, Nm, fat);
  ok(!c2.ok, 'RED: a target too wide for the stretch is REFUSED (' + c2.why.slice(0, 44) + '…)');

  const rot = { c: [x0, 0], A: [[kap, w], [H, 0]] };           /* u and s swapped: image hits the lids */
  const c3 = E.covers(map6, Np, rot);
  ok(!c3.ok, 'RED: a target rotated so the image crosses its s-lids is REFUSED (' + c3.why.slice(0, 44) + '…)');
}

/* ---- RED: overlapping h-sets refuse the whole graph ---- */
{
  const overlap = { c: [x0 + 0.01, 0], A: [[w, kap], [0, H]] };
  const g = E.certifyGraph(map6, [Np, overlap], [[0, 1]], {});
  ok(!g.ok && /disjoint/.test(g.why), 'RED: h-sets that are not provably disjoint refuse the graph');
}

/* ---- the spectral bound is exact on hand matrices ---- */
{
  const full = E.logSpectralLB([[1, 1], [1, 1]], 8);
  ok(Math.abs(full.logLB - Math.log(2)) < 1e-14, 'spectral: the full 2-graph gives ln 2 exactly at every power');
  const loop = E.logSpectralLB([[0, 1], [1, 0]], 8);
  ok(loop.logLB === 0, 'spectral: a single 2-cycle gives exactly 0 — one loop is no entropy');
  const none = E.logSpectralLB([[0, 1], [0, 0]], 8);
  ok(none.logLB === 0, 'spectral: an acyclic graph gives 0 — no strongly connected core, no bound');
}

/* ---- the detached certificate, re-verified from scratch ---- */
{
  const p = path.resolve(__dirname, '..', '..', 'certs', 'entropy-henon.json');
  const cert = JSON.parse(fs.readFileSync(p, 'utf8'));
  const mapC = E.henonSpec(cert.a, cert.b);
  const g = E.certifyGraph(mapC, cert.boxes, cert.edges, { cells: 8000, maxM: 64, steps: cert.steps });
  ok(g.ok, 'certificate: ' + cert.boxes.length + ' h-sets re-proved pairwise disjoint');
  ok(g.ok && g.certified.length === cert.edges.length,
    'certificate: every recorded covering relation re-certifies (' + (g.ok ? g.certified.length : 0) + '/' + cert.edges.length + ')');
  ok(g.ok && g.hLB >= cert.hLB - 1e-12,
    'certificate: the recomputed bound stands — h_top(' + cert.a + ', ' + cert.b + ') >= ' + cert.hLB.toFixed(6)
    + ' (recomputed ' + (g.ok ? g.hLB.toFixed(6) : '-') + ', every edge for the single iterate F^' + cert.steps + ')');
}

console.log('');
console.log('entropy battery: ' + pass + ' pass, ' + fail + ' fail');
if (fail) process.exit(1);
