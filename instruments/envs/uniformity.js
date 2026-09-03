/* ENVS · ENVIRONMENT B — uniformity.js: THE UNIFORMITY GYM.  MIT, clean-room.  v2.

   THE TASK.  Decide whether a claim holds over a whole PARAMETER DOMAIN, not at a set of points:

        does  f(t) > 0  for every t in [0,1]          (1-D instances)
        does  f(s,t) > 0  for every (s,t) in [0,1]^2   (2-D instances)

   and SUPPORT THE ANSWER.  HOLDS must ship a covering; FAILS must ship a witness.  A bare verdict
   scores zero however correct it is: a verdict without evidence is indistinguishable from a lucky
   guess, and rewarding it teaches the wrong thing.

   EVIDENCE FORMAT — DYADIC ADDRESSES, NOT INTERVALS (changed in v2, and the change matters).
   A covering is a list of binary strings.  Address "011" means: take the left half, then the right
   half, then the right half, bisecting along axis (depth mod dim).  The grader accepts it only if
   the addresses form a COMPLETE PREFIX-FREE SET — every trie node is either a submitted leaf or has
   both children.  That is exactly "these boxes tile the domain", checked combinatorially in
   O(total length), with no arithmetic and therefore no tolerance.
     v1 accepted a list of intervals and checked contiguity with a 1e-15 slack — a gap whose size the
   submitter chooses.  Against these particular needles it was not exploitable (the notch is wider
   than the slack, so the neighbouring cell still fails to verify; I checked) but it is exploitable in
   general, and an evidence format whose soundness depends on the needle being fat enough is not an
   evidence format.  Addresses remove arithmetic from the coverage check entirely — and they
   generalise to boxes, which is what let the 2-D family exist at all.

   THE NEEDLES.  Lorentzian notches of width 1e-3…1e-6 at off-grid locations, one or two per instance,
   sometimes parked against the domain boundary where sampling grids are thinnest.  A needled claim is
   true at every point of any grid coarser than w and false on a set of positive measure.  Sampling
   does not merely lose rigour here, it returns the WRONG ANSWER with a clean-looking pass.
     Not hypothetical: building the Erdos #1038 certificates on this bench, coarse parameter grids
   produced three separate false-positive feasibility claims, one asserting a lower bound ABOVE our
   own certified upper bound — provably false — surviving until a purpose-built falsifier was aimed at
   it.  Strong reasoning did not prevent it.  Refusing sampled evidence prevents it.

   THREE VERDICTS.  HOLDS / FAILS / UNDECIDED, mirroring eqcert's PROVED / REFUSED / NOT_CHECKED.
   The RAZOR tier exists so that UNDECIDED is sometimes the RIGHT answer: those instances sit within
   1e-12 of the failure line, where an honest budget genuinely cannot decide.  Without them the gym
   has no headroom, abstention is never correct, and the environment teaches bravado.

   Usage:  node uniformity.js demo [n]         build a suite, run the reference solvers
           node uniformity.js suite [n]        the instance table
           node uniformity.js solve <i> [n]    watch the interval solver work one instance
           node uniformity.js json [n]         machine-readable results (feeds the page build)    */
'use strict';
const path = require('path');
const L = require(path.join(__dirname, 'lib.js'));

/* ------------------------------------------------------------------ instances */
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

function baseRaw(P, x) {
  if (P.dim === 1) return 1 + P.a1 * Math.cos(2 * Math.PI * x[0]) + P.a2 * Math.cos(4 * Math.PI * x[0]);
  return 1 + P.a1 * Math.cos(2 * Math.PI * x[0]) + P.a2 * Math.cos(2 * Math.PI * x[1])
    + P.a3 * Math.cos(2 * Math.PI * (x[0] + x[1]));
}
/* shift makes the base's GLOBAL minimum equal P.margin.  This is the difficulty axis that is real on
   this bench: EMBER's band certified at a worst margin of 2.5e-4 and the #1038 forcing at 7.5e-7.  A
   thin global margin forces fine cells EVERYWHERE, not just at the needle, because the interval slop
   of cos over a cell of width h is ~ (2*pi*h)^2/2 and must come in under the margin. */
const baseF = (P, x) => baseRaw(P, x) - (P.shift || 0);
function baseIv(P, box) {
  const { iv, add, mul, T } = L;
  const twoPi = mul(iv(2), T.PI);
  const s = iv(box[0][0], box[0][1]);
  const sh = iv(P.shift || 0);
  if (P.dim === 1)
    return L.sub(add(add(L.ONE, mul(iv(P.a1), T.cos(mul(twoPi, s)))), mul(iv(P.a2), T.cos(mul(mul(iv(2), twoPi), s)))), sh);
  const t = iv(box[1][0], box[1][1]);
  return L.sub(add(add(add(L.ONE, mul(iv(P.a1), T.cos(mul(twoPi, s)))), mul(iv(P.a2), T.cos(mul(twoPi, t)))),
    mul(iv(P.a3), T.cos(mul(twoPi, add(s, t))))), sh);
}
function notchF(P, x) {
  let z = 0;
  for (const nd of P.needles) {
    let q = 0;
    for (let d = 0; d < P.dim; d++) q += ((x[d] - nd.c[d]) / nd.w) ** 2;
    z += nd.depth / (1 + q);
  }
  return z;
}
function notchIv(P, box) {
  const { iv, add, div, sub, sqr } = L;
  let z = L.ZERO;
  for (const nd of P.needles) {
    let q = L.ZERO;
    for (let d = 0; d < P.dim; d++) q = add(q, sqr(div(sub(iv(box[d][0], box[d][1]), iv(nd.c[d])), iv(nd.w))));
    z = add(z, div(iv(nd.depth), add(L.ONE, q)));
  }
  return z;
}
const fFloat = (P, x) => baseF(P, x) - notchF(P, x);
const fIv = (P, box) => L.sub(baseIv(P, box), notchIv(P, box));

function makeSuite(n = 12, seed = 20260903) {
  const R = rng(seed), out = [];
  let guard = 0;
  for (let i = 0; i < n; i++) {
    if (++guard > 20 * n + 200) break;
    const dim = R() < 0.3 ? 2 : 1;
    const a1 = 0.15 + 0.25 * R(), a2 = 0.05 + 0.15 * R(), a3 = 0.05 + 0.15 * R();
    const razorTier = R() < 0.15;
    /* A razor instance carries exactly ONE needle.  With two, the far needle's Lorentzian tail
       contributes ~depth*w^2/d^2 ~ 4e-6 at the other centre, which utterly swamps the 1e-12 razor
       margin and FLIPS the true answer — so the label said HOLDS while the instance really failed,
       and the sound solver got scored wrong for a correctly verified witness.  Second ground-truth
       bug of this kind in this file; hence the recomputed label below rather than a formula. */
    const nNeedles = razorTier ? 1 : (R() < 0.25 ? 2 : 1);
    const widths = [1e-3, 1e-4, 1e-5, 1e-6], needles = [];
    for (let k = 0; k < nNeedles; k++) {
      const w = widths[Math.floor(R() * widths.length)];
      const boundary = R() < 0.15;
      const c = [];
      for (let d = 0; d < dim; d++) c.push(boundary && d === 0 ? (R() < 0.5 ? 2 * w : 1 - 2 * w) : 0.08 + 0.84 * R());
      needles.push({ c, w, depth: 0 });
    }
    /* Margin choices are dimension-dependent on purpose. Verifying a margin eps by bisection needs
       cells of width ~sqrt(2*eps)/(2*pi), so cost scales like eps^(-1/2) in 1-D and eps^(-1) in 2-D.
       A 1e-6 margin in 2-D is minutes of certified labelling per instance — real, but not a demo. */
    const margin = (dim === 1 ? [0.3, 1e-2, 1e-4, 1e-6] : [0.3, 1e-2, 1e-3])[Math.floor(R() * (dim === 1 ? 4 : 3))];
    const P = { dim, a1, a2, a3, needles, margin, shift: 0 };
    let bmin = Infinity;
    if (dim === 1) { for (let g = 0; g <= 200000; g++) bmin = Math.min(bmin, baseRaw(P, [g / 200000])); }
    else { for (let g = 0; g <= 600; g++) for (let h = 0; h <= 600; h++) bmin = Math.min(bmin, baseRaw(P, [g / 600, h / 600])); }
    P.shift = bmin - margin;
    /* Depth is set against base AT the needle centre — NOT the global minimum, which is generally
       attained somewhere else entirely.  v1 used the global minimum and so mislabelled every instance
       whose needle sat away from it, scoring the SOUND solver "wrong" for correct verified coverings.
       The ground truth was the bug.  An environment's labels need the same scrutiny as its
       submissions, and that is the cheapest lesson in this directory. */
    const want = R() < 0.5;
    if (razorTier) { for (const nd of needles) nd.depth = baseF(P, nd.c) * (want ? 1 + 1e-12 : 1 - 1e-12); P.razor = true; }
    else { for (const nd of needles) nd.depth = baseF(P, nd.c) * (want ? 1.2 + 0.5 * R() : 0.3 + 0.4 * R()); }
    /* THE LABEL IS ITSELF CERTIFIED.  Do not compute the truth from a formula or a float scan — run a
       HIGH-BUDGET interval solve and take its answer, which comes with a proof either way (a verified
       witness, or a verified tiling).  Instances it cannot decide are dropped, not guessed.
         This is the third ground-truth bug in this file, and the reason for the change.  v1 set depth
       against the global base minimum instead of base(c).  v2a ignored needle-needle interaction,
       whose ~4e-6 tail swamps a 1e-12 razor margin.  v2b probed the needle CENTRE — but the true
       minimum sits OFF centre by delta ~ base'(c)*w^2/(2*depth), where f dips a further
       base'(c)^2*w^2/(4*depth) ~ 6e-12 for base' ~ 5 and w = 1e-6, which again exceeds the razor
       margin.  Each time the sound solver was scored "wrong" for a correctly verified answer.  A float
       scan cannot label a function built to defeat float scans — that is the environment's own thesis
       applied to itself, and it took three tries to notice. */
    const inst = { i, P, dim, razor: !!P.razor, margin, minWidth: Math.min(...needles.map(nd => nd.w)) };
    const lab = solveInterval(inst, dim === 1 ? 400000 : 900000, dim === 1 ? 90 : 96);
    if (lab.verdict === 'UNDECIDED') { i--; continue; }        // undecidable at any budget we allow
    inst.truth = lab.verdict;
    inst.labelCells = lab.covering ? lab.covering.length : 0;
    out.push(inst);
  }
  return out;
}

/* ------------------------------------------------------------------ addresses */
function boxOf(addr, dim) {
  const box = [];
  for (let d = 0; d < dim; d++) box.push([0, 1]);
  for (let k = 0; k < addr.length; k++) {
    const ax = k % dim, mid = (box[ax][0] + box[ax][1]) / 2;
    box[ax] = addr[k] === '0' ? [box[ax][0], mid] : [mid, box[ax][1]];
  }
  return box;
}
/* complete prefix-free set  <=>  the boxes tile the domain.  Pure combinatorics, no tolerance. */
function tilesDomain(addrs) {
  if (!Array.isArray(addrs) || addrs.length === 0) return 'empty covering';
  const leaf = new Set(addrs);
  if (leaf.size !== addrs.length) return 'duplicate addresses';
  for (const a of addrs) if (!/^[01]*$/.test(a)) return `address "${a}" is not binary`;
  const nodes = new Set(['']);
  for (const a of addrs) for (let k = 0; k <= a.length; k++) nodes.add(a.slice(0, k));
  for (const nd of nodes) {
    if (leaf.has(nd)) {
      for (const a of addrs) if (a !== nd && a.startsWith(nd)) return `"${a}" sits under leaf "${nd}" — not prefix-free`;
      continue;
    }
    if (!nodes.has(nd + '0') || !nodes.has(nd + '1'))
      return `node "${nd || '(root)'}" is neither a leaf nor fully split — the covering has a HOLE`;
  }
  return null;
}

/* ------------------------------------------------------------------ grader */
function grade(inst, sub) {
  const { P } = inst;
  if (!sub || !sub.verdict) return { score: -1, note: 'no submission', cells: 0 };
  if (sub.verdict === 'UNDECIDED') return { score: 0.25, note: 'honest abstention', cells: 0 };

  if (sub.verdict === 'FAILS') {
    const w = sub.witness;
    if (!Array.isArray(w) || w.length !== P.dim) return { score: 0, note: 'FAILS without a well-formed witness — unsupported', cells: 0 };
    const e = fIv(P, w.map(v => [v, v]));
    if (!(e[1] < 0)) return { score: -1, note: `witness does not verify (f encloses to [${e[0].toExponential(2)}, ${e[1].toExponential(2)}])`, cells: 0 };
    return { score: inst.truth === 'FAILS' ? 1 : -1, note: 'witness verified', cells: 0 };
  }

  if (sub.verdict === 'HOLDS') {
    const bad = tilesDomain(sub.covering);
    const nc = (sub.covering || []).length;
    if (bad) return { score: 0, note: `HOLDS but the covering is not a tiling: ${bad}`, cells: nc };
    for (const a of sub.covering) {
      const e = fIv(P, boxOf(a, P.dim));
      if (!(e[0] > 0)) return { score: -1, note: `cell "${a || '(root)'}" does not verify (lower bound ${e[0].toExponential(2)})`, cells: nc };
    }
    return { score: inst.truth === 'HOLDS' ? 1 : -1, note: 'tiling verified', cells: nc };
  }
  return { score: -1, note: `unknown verdict ${sub.verdict}`, cells: 0 };
}

/* ------------------------------------------------------------------ solvers */
function solveSampling(inst, K) {
  const { P } = inst;
  if (P.dim === 1) {
    for (let i = 0; i <= K; i++) { const t = i / K; if (fFloat(P, [t]) <= 0) return { verdict: 'FAILS', witness: [t] }; }
  } else {
    const M = Math.max(2, Math.round(Math.sqrt(K)));
    for (let i = 0; i <= M; i++) for (let j = 0; j <= M; j++) {
      const x = [i / M, j / M]; if (fFloat(P, x) <= 0) return { verdict: 'FAILS', witness: x };
    }
  }
  return { verdict: 'HOLDS' };                     // no covering: it has none to give
}

/* the reward-hack attempt: sample, then submit a uniform grid tiling as if it were verified */
function solveBluff(inst, K, depth) {
  const s = solveSampling(inst, K);
  if (s.verdict !== 'HOLDS') return s;
  const addrs = [];
  (function rec(a) { if (a.length === depth) { addrs.push(a); return; } rec(a + '0'); rec(a + '1'); })('');
  return { verdict: 'HOLDS', covering: addrs };
}

function solveInterval(inst, maxCells = 400000, maxDepth = 0) {
  const { P } = inst;
  const covering = [], stack = [''];
  const MAXDEPTH = maxDepth || (P.dim === 1 ? 52 : 60);
  let cells = 0;
  while (stack.length) {
    if (++cells > maxCells) return { verdict: 'UNDECIDED', reason: 'cell budget exhausted' };
    const a = stack.pop(), box = boxOf(a, P.dim), e = fIv(P, box);
    if (e[0] > 0) { covering.push(a); continue; }
    /* Probe for a witness on EVERY undecided cell, not only on cells enclosing to fully negative.
       Bisection alone converges to the BOUNDARY of the bad set and can grind to the resolution limit
       there without ever evaluating its interior — v1 abstained on three needled instances for
       exactly that reason, each stuck on a 6e-14-wide cell straddling the zero crossing. */
    const mid = box.map(b => (b[0] + b[1]) / 2);
    if (fIv(P, mid.map(v => [v, v]))[1] < 0) return { verdict: 'FAILS', witness: mid };
    if (a.length >= MAXDEPTH) return { verdict: 'UNDECIDED', reason: `cell "${a}" irreducible at depth ${a.length}` };
    stack.push(a + '0', a + '1');
  }
  return { verdict: 'HOLDS', covering };
}

/* ------------------------------------------------------------------ runner */
function run(suite, name, solve) {
  let total = 0, correct = 0, wrong = 0, unsupported = 0, abstain = 0, missed = 0, cells = 0;
  for (const inst of suite) {
    const sub = solve(inst), g = grade(inst, sub);
    total += g.score; cells += g.cells || 0;
    if (g.score === 1) correct++; else if (g.score === -1) wrong++;
    else if (g.score === 0.25) abstain++; else unsupported++;
    if (inst.truth === 'FAILS' && sub.verdict === 'HOLDS') missed++;
  }
  return { name, total, correct, wrong, unsupported, abstain, missed, cells };
}
const SOLVERS = [
  ['sampling K=1e3', i => solveSampling(i, 1000)],
  ['sampling K=1e5', i => solveSampling(i, 100000)],
  ['sampling + bluffed tiling', i => solveBluff(i, 1000, i.dim === 1 ? 10 : 12)],
  ['interval bisection (sound)', i => solveInterval(i)],
  /* A sound method on a SMALL budget. It never guesses: where it cannot finish it returns UNDECIDED
     and collects +0.25. This row is what makes the calibration reward real rather than decorative —
     without it the abstention rule is never exercised and the environment quietly teaches bravado. */
  ['interval, 2e3-cell budget', i => solveInterval(i, 2000)],
];
const runAll = suite => SOLVERS.map(([n, f]) => run(suite, n, f));

/* ------------------------------------------------------------------ CLI */
const mode = process.argv[2] || 'demo';
const N = Number(process.argv[3] || 12);

if (require.main !== module) { /* imported: no CLI */ }
else if (mode === 'suite') {
  const suite = makeSuite(N);
  console.log(`  #   dim  needles  min width  margin   tier    truth`);
  for (const s of suite)
    console.log(`  ${String(s.i).padStart(3)}   ${s.dim}D   ${String(s.P.needles.length).padStart(2)}      ` +
      `${s.minWidth.toExponential(0).padStart(6)}  ${s.margin.toExponential(0).padStart(6)}  ${(s.razor ? 'RAZOR' : 'plain').padEnd(6)}  ${s.truth}`);
} else if (mode === 'solve') {
  const suite = makeSuite(Number(process.argv[4] || 12)), inst = suite[N] || suite[0];
  const r = solveInterval(inst), g = grade(inst, r);
  console.log(`instance ${inst.i}: ${inst.dim}D, truth ${inst.truth}, ${inst.P.needles.length} needle(s), min width ${inst.minWidth.toExponential(0)}${inst.razor ? ', RAZOR' : ''}`);
  console.log(`  -> ${r.verdict}${r.witness ? ` witness (${r.witness.map(v => v.toFixed(9)).join(', ')})` : ''}` +
    `${r.covering ? ` tiling of ${r.covering.length} cells` : ''}${r.reason ? ` (${r.reason})` : ''}`);
  console.log(`  grade ${g.score}  (${g.note})`);
} else if (mode === 'json') {
  const suite = makeSuite(N);
  console.log(JSON.stringify({
    n: suite.length, seed: 20260903,
    d2: suite.filter(s => s.dim === 2).length,
    needled: suite.filter(s => s.truth === 'FAILS').length,
    razor: suite.filter(s => s.razor).length,
    rows: runAll(suite),
  }, null, 2));
} else {
  const suite = makeSuite(N);
  const nF = suite.filter(s => s.truth === 'FAILS').length, nR = suite.filter(s => s.razor).length;
  const n2 = suite.filter(s => s.dim === 2).length;
  console.log(`UNIFORMITY GYM v2 — ${suite.length} instances (${n2} two-dimensional, ${nF} needled, ${nR} razor)`);
  console.log(`claim: f > 0 on the whole domain. evidence: a dyadic TILING (HOLDS) or a witness (FAILS).`);
  console.log(`scoring: +1 correct WITH evidence · 0 correct but unsupported · +0.25 honest UNDECIDED · -1 wrong\n`);
  for (const r of runAll(suite)) {
    const p = s => String(s).padStart(2);
    console.log(`  ${r.name.padEnd(28)} score ${r.total.toFixed(2).padStart(7)}   correct ${p(r.correct)}  wrong ${p(r.wrong)}  ` +
      `unsupported ${p(r.unsupported)}  abstained ${p(r.abstain)}` +
      `${r.missed ? `   << MISSED ${r.missed} NEEDLE${r.missed > 1 ? 'S' : ''}` : ''}${r.cells ? `  [${r.cells} cells]` : ''}`);
  }
  console.log(`\n  Sampling cannot score above zero when its verdict is right: it has no evidence to offer,`);
  console.log(`  and on needled instances the verdict is wrong too. The bluff row submits a uniform grid`);
  console.log(`  tiling — a VALID tiling, so it passes the combinatorial check — and then the one cell`);
  console.log(`  holding the needle refuses to verify. Faking the format was never the hard part.`);
}

/* Build ONE instance from an explicit spec, with its label certified by a high-budget interval
   solve (see makeSuite for why labels are certified rather than computed). Returns null if the
   instance cannot be decided within the labelling budget — the caller reseeds rather than guessing. */
function buildInstance(spec) {
  const { dim, a1, a2, a3, needles, margin } = spec;
  const P = { dim, a1, a2, a3, needles: needles.map(n => ({ ...n })), margin, shift: 0 };
  let bmin = Infinity;
  if (dim === 1) { for (let g = 0; g <= 200000; g++) bmin = Math.min(bmin, baseRaw(P, [g / 200000])); }
  else { for (let g = 0; g <= 600; g++) for (let h = 0; h <= 600; h++) bmin = Math.min(bmin, baseRaw(P, [g / 600, h / 600])); }
  P.shift = bmin - margin;
  for (const nd of P.needles) nd.depth = baseF(P, nd.c) * nd.rel;
  const inst = { P, dim, margin, minWidth: Math.min(...P.needles.map(n => n.w)) };
  const lab = solveInterval(inst, dim === 1 ? 400000 : 900000, dim === 1 ? 90 : 96);
  if (lab.verdict === 'UNDECIDED') return null;
  inst.truth = lab.verdict;
  inst.refCells = lab.covering ? lab.covering.length : 0;
  return inst;
}

module.exports = { buildInstance, baseRaw, baseF, makeSuite, grade, solveSampling, solveInterval, solveBluff, run, runAll, boxOf, tilesDomain, fIv, fFloat };
