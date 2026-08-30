#!/usr/bin/env node
/* build-report-entropy.js — generate reports/entropy.html: a certified lower
   bound for the topological entropy of the Hénon map, and the census cycle
   counts it is chasing.

   Everything is recomputed or re-read from records at build time: the
   detached certificate is re-verified edge by edge (the same full re-proof
   the battery runs), the calibration horseshoe is re-certified at ln 2, and
   the growth-rate table is read off certs/census-high-periods.json — certified
   completeness records, not samples. Any failure aborts the build.

   usage: node tools/build-report-entropy.js */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const E = require(path.join(ROOT, 'instruments', 'entropy', 'covering.js'));

const sh = (c) => { try { return cp.execSync(c, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) { return null; } };
const die = (m) => { console.error('ENTROPY REPORT REFUSED: ' + m); process.exit(1); };

/* ---- re-verify the certificate, in full ----------------------------------- */
const cert = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'entropy-henon.json'), 'utf8'));
const map = E.henonSpec(cert.a, cert.b);
const g = E.certifyGraphMixed(map, cert.boxes, cert.edges, { cells: 8000, Kmax: 40 });
if (!g.ok || g.certified.length !== cert.edges.length || g.hLB < cert.hLB - 1e-12)
  die('the detached certificate did not re-verify: ' + (g.ok ? g.certified.length + '/' + cert.edges.length + ' edges, h ' + g.hLB : g.why));

/* the calibration, re-run */
const map6 = E.henonSpec(6, 0.3);
const H = 0.6, w = 0.17, x0 = 0.38, kap = 0.3 * H / (12 * x0);
const cal = E.certifyGraph(map6,
  [{ c: [x0, 0], A: [[w, kap], [0, H]] }, { c: [-x0, 0], A: [[w, -kap], [0, H]] }],
  [[0, 0], [0, 1], [1, 0], [1, 1]], { cells: 60000 });
if (!cal.ok || Math.abs(cal.hLB - Math.log(2)) > 1e-12) die('calibration horseshoe failed');

/* ---- the census growth table, read off the certified records -------------- */
const census = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'census-high-periods.json'), 'utf8'))
  .filter(r => r.ok).map(r => ({ p: r.p, points: r.points, rate: Math.log(r.points) / r.p }));
if (!census.length) die('no census records');
const ceiling = Math.max(...census.map(r => r.rate));

/* ---- the page ------------------------------------------------------------- */
const B = [];

B.push(C.header({
  eyebrow: 'cert-machine · report · generated from the records',
  title: 'Entropy, with a certificate',
  deck: 'The census counts periodic points and proves completeness; those counts encode the growth rate that '
    + 'IS topological entropy. This page turns boxes into the invariant: a certified lower bound '
    + 'h ≥ ' + cert.hLB.toFixed(4) + ' for the Hénon map at the classical parameters — every covering relation '
    + 'a strict interval inequality, the spectral bound exact, the whole certificate re-proved while this page '
    + 'was built — and the certified cycle counts that name the ceiling it is climbing toward.'
}));

B.push(C.tldr({
  findingRaw: 'h_top(Hénon, a = 1.4, b = 0.3) ≥ ' + cert.hLB.toFixed(4) + ' is a theorem — covering relations '
    + 'composed to an exact integer spectral bound, re-proved during this build.',
  mechanismRaw: 'Every covering relation is a strict outward-rounded interval inequality; the census\'s certified '
    + 'cycle counts name the ceiling the bound climbs toward, and the instrument first reproduces ln 2 at the '
    + 'full horseshoe before any new bound counts.',
  checkRaw: C.m('node instruments/entropy/battery.js') + ' — the ln 2 calibration and four red controls run '
    + 'first.'
}));

B.push(C.stats([
  { k: 'certified lower bound', v: cert.hLB.toFixed(4), role: 'held', n: 'h_top ≥ ln sp(B_K)/' + cert.composedTo + ' from ' + cert.edges.length + ' covering relations over ' + cert.boxes.length + ' disjoint h-sets, re-proved this build.' },
  { k: 'the census ceiling', v: ceiling.toFixed(4), n: 'max ln(N_p)/p over the certified counts — the rate the literature pins at ≈ 0.4651.' },
  { k: 'calibration', v: 'ln 2 exact', role: 'held', n: 'Deep in the Devaney–Nitecki regime (a = 6) the instrument certifies the full 2-shift.' },
  { k: 'red controls', v: '4', n: 'No-stretch, lid violation, wrong target, overlapping h-sets — each must refuse, every build.' }
]));

B.push(C.scope('Local working document. The bound is a theorem modulo one consumed external result '
  + '(covering relations imply semi-conjugacy to the subshift — Zgliczyński–Gidea), used the way Krawczyk\'s '
  + 'theorem is consumed elsewhere in this lab. Parameters are the exact doubles nearest 1.4 and 0.3, the same '
  + 'objects the census certifies.'));

{
  /* ---- what is proved, what is only suggested ------------------------------
   Three numbers on one line, and the distance between them IS the open
   problem. Everything left of the frontier is a theorem; the band beyond it is
   where cycle counts point and nothing is proved. */
{
  const LN2 = Math.log(2);
  const fig = CH.segments({
    w: 900, rowH: 58, x0: 0, x1: LN2 * 1.12, padL: 150,
    xTicks: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7].filter(v => v <= LN2 * 1.12)
      .map(v => ({ v, t: v.toFixed(1) })),
    xLabel: 'topological entropy  h_top  (nats per iterate)',
    rows: [{
      k: 'h_top(1.4, 0.3)',
      segs: [
        { x0: 0, x1: cert.hLB, token: 'var(--c-2)',
          k: 'PROVED', v: 'h_top >= ' + cert.hLB.toFixed(6) + ' — a theorem, re-proved at this build' },
        { x0: cert.hLB, x1: ceiling, token: 'var(--c-3)', hatch: true,
          k: 'NOT DECIDED', v: 'between the certified bound and where certified cycle counts point' }
      ],
      marks: [{ x: cert.hLB, t: 'certified ' + cert.hLB.toFixed(4) },
              { x: ceiling, t: 'cycle counts reach ' + ceiling.toFixed(4), token: 'var(--c-3)', row: 1 },
              { x: LN2, t: 'ln 2 — the full horseshoe', token: 'var(--c-ctx)', row: 2, anchor: 'end' }]
    }],
    keys: [{ token: 'var(--c-2)', t: 'proved: h_top is at least this' },
           { token: 'var(--c-3)', t: 'open: cycle counts point higher, nothing is proved there', kind: 'hatch' }],
    alt: 'A number line of topological entropy from zero to about 0.78. A solid green bar runs from zero to the '
      + 'certified lower bound ' + cert.hLB.toFixed(4) + '. A hatched band continues to ' + ceiling.toFixed(4)
      + ', where certified cycle counts point but nothing is proved. A separate mark sits at ln 2 = 0.6931, the '
      + 'entropy of the full horseshoe, where the instrument is calibrated.'
  });
  B.push(C.section({
    lab: '§0 · the gap', title: 'What is proved, and how much room is left',
    wide: true,
    bodyRaw: '<div class="col">'
      + C.pRaw('An entropy bound is only interesting next to the thing it is climbing toward. The green bar is '
        + 'the theorem; the hatched band is the room the certified cycle counts leave for it; ln 2 is the '
        + 'horseshoe the instrument reproduces before any new bound is allowed to count.')
      + '</div>'
      + C.figure({ svgRaw: fig, caption: 'h_top ≥ ' + cert.hLB.toFixed(6) + ' is proved — ' + cert.edges.length
        + ' covering relations over ' + cert.boxes.length + ' disjoint h-sets, composed to F^' + cert.composedTo
        + ' and closed by an exact integer spectral bound. The hatched band runs to ' + ceiling.toFixed(4)
        + ', the growth rate named by the certified cycle census; that number is a COUNT, not a bound, so '
        + 'nothing in the band is claimed. The gap is the honest state of the problem, drawn to scale.' })
  }));
}

B.push(C.section({
    lab: '§1 · the theorem', title: 'What is certified, exactly',
    bodyRaw: '<div class="col">'
      + C.pRaw('There are ' + C.m(String(cert.boxes.length)) + ' parallelograms (h-sets) in the plane, proved '
        + 'pairwise disjoint by separating axes with outward rounding. For ' + C.m(String(cert.edges.length))
        + ' ordered pairs and durations k = 1..6, the iterate ' + C.m('F^k') + ' provably STRETCHES the first '
        + 'parallelogram across the second: the two exit edges land strictly beyond the target on opposite '
        + 'sides, and the image avoids the target\'s side SLABS — finitely many strict interval inequalities, '
        + 'checked by adaptive bisection. Relations COMPOSE, so all durations reduce to one uniform iterate: '
        + C.m('B_K[i][j] = 1') + ' iff some duration-exactly-K composition exists (binary — one relation per '
        + 'pair, never a path count), and')
      + C.eq(C.esc('h_top(F) = h_top(F^' + cert.composedTo + ')/' + cert.composedTo + ' ≥ ln sp(B_' + cert.composedTo + ')/' + cert.composedTo + ' ≥ ' + cert.hLB.toFixed(6)))
      + C.pRaw('with the spectral bound exact (min positive row sum of powers, integer arithmetic, '
        + 'overflow-guarded, iteratively trimmed). The certifier can refuse an edge — and did, for most '
        + 'candidates; it cannot certify a false one. Dropping edges only ever lowers the bound, which is the '
        + 'safe direction. TWO soundness bugs were found by impossible numbers, and each now has a red '
        + 'control: counting mixed-duration paths as distinct itineraries once yielded h ≥ 0.61 on a map whose '
        + 'true entropy is ≈ 0.465 (a duration-2 relation constrains nothing at its intermediate time), and a '
        + 'lids-only image condition once certified a golden-mean graph converging to ln φ = 0.4812 — also '
        + 'past the truth. The battery now demands the exact-ln 2 horseshoe stays at ln 2 under mixed '
        + 'durations, and the slab condition replaced the lid condition.')
      + C.pRaw('The float layer that PROPOSED the boxes — a long orbit, binned; tangents by local PCA; stable '
        + 'directions by backward-Jacobian iteration — is believed about nothing: every box and every edge is '
        + 're-derived from the interval conditions alone, and the battery re-proves the whole certificate '
        + '(' + C.m(cert.edges.length + '/' + cert.edges.length) + ' edges) on every build.')
      + '</div>'
  }));
}

{
  const rows = census.map(r => [
    { raw: C.m('p = ' + r.p) },
    { raw: C.m(String(r.points)) },
    { raw: C.m(r.rate.toFixed(4)) },
    { raw: C.esc('completeness: EXACTLY this many, plane exhausted') }
  ]);
  B.push(C.section({
    lab: '§2 · the ceiling', title: 'What the census already knows', wide: true,
    bodyRaw: C.table({
      cols: [{ h: 'period' }, { h: 'points, certified exact', cls: 'v' }, { h: 'ln(N_p)/p', cls: 'v' }, { h: 'status' }],
      rows
    })
      + '<div class="col">' + C.pRaw('The growth rate of certified cycle counts climbs to '
        + C.m(ceiling.toFixed(4)) + ' by p = 16 — squarely at the literature value h ≈ 0.4651 for these '
        + 'parameters. But counts alone are NOT a lower bound for entropy (that implication runs the other way); '
        + 'the covering graph is what converts counted orbits into certified entropy, and today it certifies '
        + C.m(cert.hLB.toFixed(4)) + ' — ' + C.m(Math.round(100 * cert.hLB / ceiling) + '%') + ' of the ceiling. '
        + 'The gap is structure the current graph does not resolve: uniform box sizes and a single global '
        + 'iterate. Per-edge durations with Bowen-weighted spectral bounds, and boxes sized to local expansion, '
        + 'are the recorded next step.') + '</div>'
  }));
}

{
  B.push(C.section({
    lab: '§3 · check it', title: 'What a skeptic runs',
    bodyRaw: '<div class="col">'
      + C.pRaw(C.m('make test') + ' re-proves everything: the ln 2 calibration at the full horseshoe, four red '
        + 'controls (a covering that does not hold must refuse three different ways; overlapping h-sets must '
        + 'refuse the graph), exactness of the spectral bound on hand matrices, and the detached certificate '
        + C.m('certs/entropy-henon.json') + ' — every h-set re-proved disjoint, every covering relation '
        + 're-derived, the bound recomputed. The certificate itself is finite data: parallelogram matrices, an '
        + 'edge list, one integer matrix power.')
      + '</div>'
  }));
}

const foot = '<footer class="col">'
  + '<p>' + C.esc('Generated by tools/build-report-entropy.js — the certificate re-verified and the calibration re-run during this build; the build fails otherwise.') + '</p>'
  + '<p>' + C.esc('git ' + (sh('git rev-parse --short HEAD') || '—') + ' · cert-machine · Carlos Toledo') + '</p>'
  + '</footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'entropy.html'),
  TPL.render({ title: 'Entropy, with a certificate · cert-machine', bodyRaw: B.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/entropy.html' }));

console.log('reports/entropy.html written');
console.log('  h_top(' + cert.a + ', ' + cert.b + ') >= ' + cert.hLB.toFixed(6) + ' re-proved ('
  + cert.edges.length + ' edges, ' + cert.boxes.length + ' h-sets, composed to F^' + cert.composedTo + ') · ceiling ' + ceiling.toFixed(4));
