/* sets.js — the objects we ask about, and what each one is predicted to be.

   REFERENCE, AND THE INVERSION. cert-machine's neural-geometry playground asks a
   language model for pairwise dissimilarities and decides what shape its answers
   have. The structure here is the same — a set of items, an integer distance
   matrix, exact decisions, one plate each — and the subject is the opposite.

   That model probe cannot run on this bench: a model call sends prompts off the
   machine and the send is held. So instead of asking something what it believes,
   these ask objects whose geometry is a FACT: an array of telescopes, a certified
   band, a proof's own subdivision, a regular hexagon. Every set carries a
   `predict` written before the arithmetic, and the page reports whether the
   decision agreed.

   That is the elevation and it is not a flourish. Where the reference's controls
   are there to FAIL — a tidy circle among nonsense words would mean the method
   is drawing its own assumptions — several of these are there to be EXACTLY
   RIGHT. A hexagon's Gram matrix has rank 2 and no negative directions, and if
   the decision says otherwise the decision is broken. The method is on trial
   here, not the subject.

   EVERY DISTANCE IS AN INTEGER, by a stated rule. Floats are quantised at a
   declared scale and the scale is printed. That is what makes the decisions
   arithmetic rather than thresholds.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const UAS = 4.84813681109536e-12;

const load = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

/* ---- helpers: build an integer matrix from a rule ------------------------ */
const intMatrix = (n, f, scale) => {
  const D = [];
  for (let i = 0; i < n; i++) { D.push([]); for (let j = 0; j < n; j++) D[i][j] = i === j ? 0 : Math.round(scale * f(i, j)); }
  for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) { const m = Math.round((D[i][j] + D[j][i]) / 2); D[i][j] = D[j][i] = m; }
  return D;
};

/* ---- 1 & 2: one array, two instants ------------------------------------- */
/* A baseline is the projection of the vector between two dishes onto the plane
   facing the source, so at ONE instant every station is a point in ONE plane and
   the eight of them are eight points in R^2 — exactly, by construction. Fixing a
   reference station at the origin recovers those points from the baselines
   themselves: p_a = u_{a,ref}. The gauge is free, since a common translation
   cancels out of every distance.
   The first attempt at these two sets took the shortest and longest projection
   each pair reached across the whole night, which mixes instants and is not a
   metric at all — both were REFUSED at the gate, correctly, and the gate is the
   only reason that did not become a plate with a confident number under it. */
function ehtSets() {
  const IFM = load('playground/interferometer/out/page-data.json');
  const names = IFM.meta.stations;
  /* the shipped page-data carries the snapshots already merged, so rebuild them
     from the source rows, where the timestamp is still present */
  const V = require(path.join(ROOT, 'playground/interferometer/vis.js'));
  const day = Object.keys(V.DAYS).find(k => V.DAYS[k] === IFM.meta.date);
  const file = V.loadFile(day, IFM.meta.band, IFM.meta.pipe);
  const kept = file.rows.filter(r => Math.hypot(r.u, r.v) >= IFM.meta.bcut * 1e9);
  const byT = new Map();
  for (const r of kept) { const k = r.t.toFixed(6); if (!byT.has(k)) byT.set(k, []); byT.get(k).push(r); }
  /* CHOOSE THE STATIONS FIRST, THEN THE INSTANTS. Picking the two fullest
     snapshots gave two that were one minute apart and 0.14% different — a
     "paired experiment" comparing a picture with itself. The pair only means
     something if the Earth has had time to turn, so: take the station set that
     appears complete most often, then the two instants furthest apart at which
     every one of its pairs was measured. */
  const count = new Map();
  const snapsOf = (t, rows) => {
    const st = [...new Set(rows.flatMap(r => [r.t1, r.t2]))].sort();
    const edge = new Map(rows.map(r => [[r.t1, r.t2].sort().join('|'), r]));
    return { t: +t, st, edge };
  };
  const all = [...byT.entries()].map(([t, rows]) => snapsOf(t, rows));
  for (const c of all) {
    for (let m = 1; m < (1 << c.st.length); m++) {
      const S = c.st.filter((_, i) => m & (1 << i));
      if (S.length < 4) continue;
      let full = true;
      for (let i = 0; i < S.length && full; i++) for (let j = i + 1; j < S.length && full; j++)
        if (!c.edge.has([S[i], S[j]].sort().join('|'))) full = false;
      if (full) { const k = S.join(','); count.set(k, (count.get(k) || 0) + 1); }
    }
  }
  /* prefer the largest station set that still occurs at well-separated times */
  let chosen = null;
  for (const [k, nOcc] of [...count.entries()].sort((x, y) => y[0].split(',').length - x[0].split(',').length || y[1] - x[1])) {
    const S = k.split(',');
    const when = all.filter(c => S.every((a2, i) => S.every((b2, j) => i >= j || c.edge.has([a2, b2].sort().join('|')))));
    if (when.length < 2) continue;
    const span = when[when.length - 1].t - when[0].t;
    if (span >= 2) { chosen = { S, when, nOcc }; break; }
  }
  if (!chosen) return [];
  const best = { st: chosen.S, edge: chosen.when[0].edge, t: chosen.when[0].t };
  const last = chosen.when[chosen.when.length - 1];
  const far = { st: chosen.S, edge: last.edge, t: last.t };

  const build = (c) => {
    const ref = c.st[0], p = [[0, 0]];
    for (let a = 1; a < c.st.length; a++) {
      const r = c.edge.get([c.st[a], ref].sort().join('|'));
      const sgn = r.t1 === c.st[a] ? 1 : -1;
      p.push([sgn * r.u / 1e9, sgn * r.v / 1e9]);
    }
    return intMatrix(c.st.length, (i, j) => Math.hypot(p[i][0] - p[j][0], p[i][1] - p[j][1]), 1000);
  };
  /* the time column runs past 24 when a track crosses midnight — wrap it, and
     say which day, rather than printing "28h52 UT" as if that were a time */
  const hh = (t) => {
    const d = Math.floor(t / 24), w = t - 24 * d;
    return `${String(Math.floor(w)).padStart(2, '0')}h${String(Math.round((w % 1) * 60)).padStart(2, '0')} UT${d ? ' (+' + d + 'd)' : ''}`;
  };
  return [
    { id: 'array-a', title: `the array at ${hh(best.t)}`, shape: 'plane', order: false,
      predict: 'exactly a plane — effective rank 2 and no negative mass',
      why: 'At one instant every baseline is a projection onto the same plane, so these stations are points in ℝ² by construction and there is no room for argument. This is the positive control for the whole page: if the effective rank does not come back 2 with nothing negative, the arithmetic below is broken and every other number on the page is worthless. The exact triple will NOT be (2,0,·) — quantising the projections to integers guarantees that — which is exactly why the spectrum is printed beside it.',
      items: best.st, D: build(best), scale: '1000 × projected separation in Gλ, one instant, reference station at the origin' },
    { id: 'array-b', title: `the same ${far.st.length} dishes, ${(far.t - best.t).toFixed(1)} hours later`, shape: 'plane', order: false,
      predict: 'a plane again — but a different one, and a different shape in it',
      why: `THE PAIRED EXPERIMENT, and the pair is a rotation rather than a reframing. ${(far.t - best.t).toFixed(1)} hours later the Earth has turned and the same rigid arrangement of dishes casts its shadow on a different plane. The rank must be 2 again — it is still one projection — but the shape inside that plane is not the same shape: not one of the ten distances survives unchanged. Two flat pictures of one solid object, and the fact that neither is three-dimensional is the whole reason interferometry needs a whole night rather than an instant.`,
      items: far.st, D: build(far), scale: '1000 × projected separation in Gλ, one instant, reference station at the origin' },
  ];
}

/* ---- 3 & 4: a hexagon, two ways ---------------------------------------- */
function hexSets() {
  const items = ['0', '1', '2', '3', '4', '5'];
  /* squared chord distances on a regular hexagon are 0,1,3,4,3,1 — integers,
     which is exactly why the hexagon and not the twelve-tone circle: a regular
     12-gon has 2 − √3 in its table and there is no honest integer for that. */
  const chord2 = [0, 1, 3, 4, 3, 1];
  const Dchord = intMatrix(6, (i, j) => Math.sqrt(chord2[Math.abs(i - j) % 6]), 1000);
  const Dcycle = intMatrix(6, (i, j) => Math.min((i - j + 6) % 6, (j - i + 6) % 6), 1000);
  return [
    { id: 'hex-chord', title: 'six points on a circle, measured through the circle', shape: 'cycle', order: true,
      predict: 'a circle, and exactly Euclidean: rank 2, no negative directions',
      why: 'A regular hexagon in the plane. Straight-line distances between its vertices, which is the only cycle on this page whose squared distances are integers — the twelve-tone version has 2 − √3 in its table and there is no honest integer for that. The closing step is one more side, so the ratio is one. This is the positive control: if it does not come back exactly rank 2 with nothing negative, the arithmetic below is wrong.',
      items, D: Dchord, scale: '1000 × chord length, unit circumradius' },
    { id: 'hex-cycle', title: 'the same six points, measured around the circle', shape: 'cycle', order: true,
      predict: 'still a cycle — but NOT Euclidean: negative directions must appear',
      why: 'THE POINT OF THE PAIR. Same six items, same cyclic order, same closing step of one — and a different fact. Walking round the rim instead of cutting across it gives the graph metric of a 6-cycle, and a cycle metric is famously not Euclidean: no set of points in any ℝᵈ has these distances. The closure ratio cannot tell the two apart, because both close in one step. Only the signature can. A page that reported "circle" for both would be hiding the more interesting half of what happened.',
      items, D: Dcycle, scale: '1000 × steps around the rim' },
  ];
}

/* ---- 5: a certified band, as a curve ----------------------------------- */
function bandSet() {
  const B = load('playground/plates/data/band-sigma-0.0008-0.008.json');
  const all = B.cells.filter(c => c.ok);
  const step = Math.max(1, Math.floor(all.length / 12));
  const cells = all.filter((_, i) => i % step === 0).slice(0, 12);
  const f = (c) => [Math.log10(c.Y0), c.Z1, Math.log10(c.Z2)];
  const V = cells.map(f);
  const lo = [0, 1, 2].map(k => Math.min(...V.map(v => v[k])));
  const hi = [0, 1, 2].map(k => Math.max(...V.map(v => v[k])));
  const nz = V.map(v => v.map((x, k) => (x - lo[k]) / ((hi[k] - lo[k]) || 1)));
  const D = intMatrix(cells.length, (i, j) => Math.hypot(...nz[i].map((x, k) => x - nz[j][k])), 1000);
  return {
    id: 'band-curve', title: 'a certified band, in the coordinates of its own certificate', shape: 'line', order: true,
    predict: 'a line — one parameter, so one dimension',
    why: 'Every cell of this theorem was closed by the same three numbers: a defect, a contraction and a curvature. Those three are the certificate’s own coordinates, and the cells are indexed by a single physical parameter, so they should trace a CURVE through that space and nothing more — rank one, and a closing step that is the whole journey home. If a circle appeared here it would mean the certificate returns to a state it has already been in, which nobody claimed and nobody wants.',
    items: cells.map(c => c.sig[0].toFixed(5)), D, scale: '1000 × Euclidean distance in normalised (log Y₀, Z₁, log Z₂)',
  };
}

/* ---- 6: a proof's own subdivision --------------------------------------- */
function proofSet() {
  const F = load('certs/erdos1038-forcing-1.828.json');
  const step = Math.max(1, Math.floor(F.boxes.length / 12));
  const bx = F.boxes.filter((_, i) => i % step === 0).slice(0, 12);
  const f = (A) => {
    const mins = A.bboxes.map(b => b.min), ws = A.bboxes.map(b => b.w.length);
    return [Math.log10(Math.min(...mins)), Math.log10(A.Rbox), ws.reduce((s, x) => s + x, 0) / ws.length / 61];
  };
  const V = bx.map(f);
  const lo = [0, 1, 2].map(k => Math.min(...V.map(v => v[k])));
  const hi = [0, 1, 2].map(k => Math.max(...V.map(v => v[k])));
  const nz = V.map(v => v.map((x, k) => (x - lo[k]) / ((hi[k] - lo[k]) || 1)));
  const D = intMatrix(bx.length, (i, j) => Math.hypot(...nz[i].map((x, k) => x - nz[j][k])), 1000);
  return {
    id: 'proof-walk', title: 'a proof, walked from one end of its covering to the other', shape: 'line', order: true,
    predict: 'a line, but a rougher one than the band',
    why: 'The same question asked of a proof rather than a theorem. Each of these is a slab of the covering that forced an Erdős bound, described by how much margin its tightest box had, how wide it is, and how many teeth its linear programme reached for. A subdivision driven by one sweeping parameter should also be a curve — but a proof changes strategy where the difficulty changes, and a strategy change is a kink. The quantity to watch is not the closure ratio, it is the hyperbolicity: a curve that bends sharply is still a curve, and the four-point condition can tell that from a tree.',
    items: bx.map(A => A.a[0].toFixed(3)), D, scale: '1000 × Euclidean distance in normalised (log worst margin, log width, mean teeth used)',
  };
}

/* ---- 7 & 8: the floor --------------------------------------------------- */
function controlSets() {
  let s = 20260904;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  const P = Array.from({ length: 9 }, () => Array.from({ length: 7 }, () => rnd() * 2 - 1));
  const Drand = intMatrix(9, (i, j) => Math.hypot(...P[i].map((x, k) => x - P[j][k])), 1000);
  const Dbad = intMatrix(7, (i, j) => (Math.abs(i - j) === 1 ? 1000 : 40), 1);
  return [
    { id: 'random', title: 'nine points thrown into seven dimensions', shape: 'none', order: false,
      predict: 'no low dimension and no cycle — effective rank near the ceiling',
      why: 'The floor everything else has to clear. These points have no structure beyond being points, so their distances should need every dimension available and no shape should survive. A method that finds a tidy circle here is drawing its own assumptions, which is the reference instruments shelf’s warning and it applies unchanged.',
      items: Array.from({ length: 9 }, (_, i) => 'p' + (i + 1)), D: Drand, scale: '1000 × Euclidean distance in ℝ⁷, fixed seed' },
    { id: 'nonmetric', title: 'a table that is not a distance at all', shape: 'none', order: true,
      predict: 'refused — the triangle inequality fails, so nothing downstream is meaningful',
      why: 'THE HARDEST CONTROL, and the one the reference does not have. Neighbours are far apart and everything else is close, which no arrangement of points in any space can produce: d(1,3) = 40 while d(1,2) + d(2,3) = 2000 is fine, but d(1,2) = 1000 against d(1,3) + d(3,2) = 80 is not. A signature will still come back — the arithmetic does not care — and a plate will still draw. The decision has to catch it BEFORE either, or every number on this page is decoration.',
      items: Array.from({ length: 7 }, (_, i) => 'x' + (i + 1)), D: Dbad, scale: 'exact by construction' },
  ];
}

module.exports = [...ehtSets(), ...hexSets(), bandSet(), proofSet(), ...controlSets()];
