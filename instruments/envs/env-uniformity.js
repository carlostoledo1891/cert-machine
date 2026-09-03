/* ENVS — env-uniformity.js: the uniformity gym as a MODEL environment.  MIT, clean-room.

   Wraps uniformity.js in the harness interface: monotone rungs, one prompt for every model, a strict
   parser, and planted forgeries that must fail before any model is called.

   THE EVIDENCE FORMAT PROBLEM, AND ITS FIX.  A verified tiling can run to thousands of cells; no
   model is going to emit that, so a naive port of the format makes the environment untestable rather
   than hard.  The fix is a COMPRESSED address: "01:6" means the complete subtree under 01 taken to a
   further depth of 6.  This is compression of the evidence, not weakening of it — the grader expands
   it and verifies every single leaf, and a total expansion above EXPAND_CAP is refused outright.
   Note what this does NOT buy the submitter: "":12 is the uniform depth-12 grid, a perfectly valid
   tiling that passes the combinatorial check and then fails on the one cell holding the needle.  The
   cheap answer is expressible, and still wrong.  That is the design.

   RUNGS are monotone in the two axes that actually cost: needle width (how fine a grid is needed to
   see the failure at all) and global margin (how fine a grid is needed to VERIFY success anywhere).
   The second axis is the one people forget, and it is the real one on this bench — EMBER's band
   certified at a worst margin of 2.5e-4, #1038's forcing at 7.5e-7.                                */
'use strict';
const path = require('path');
const U = require(path.join(__dirname, 'uniformity.js'));

const EXPAND_CAP = 200000;

/* ------------------------------------------------------------------ rungs */
const RUNGS = [
  { id: 'r0', label: 'warm-up', note: '1-D · fat needle 1e-2 · margin 0.3 — decidable with a few cells',
    dim: 1, margin: 0.3, widths: [1e-2], needles: 1 },
  { id: 'r1', label: 'needle', note: '1-D · needle 1e-3…1e-4 · margin 0.3 — a 1000-point grid steps over it',
    dim: 1, margin: 0.3, widths: [1e-3, 1e-4], needles: 1 },
  { id: 'r2', label: 'needle + thin margin', note: '1-D · needle 1e-5…1e-6 · margin 1e-2 — success now needs fine cells EVERYWHERE',
    dim: 1, margin: 1e-2, widths: [1e-5, 1e-6], needles: 2 },
  { id: 'r3', label: 'two dimensions', note: '2-D · needle 1e-4…1e-5 · margin 1e-2 — boxes, not intervals',
    dim: 2, margin: 1e-2, widths: [1e-4, 1e-5], needles: 1 },
];

function rng(seed) { let s = (seed >>> 0) || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

function makeTask(rungId, seed) {
  const R = RUNGS.find(r => r.id === rungId);
  for (let attempt = 0; attempt < 40; attempt++) {
    const g = rng(seed + attempt * 104729);
    const a1 = 0.15 + 0.25 * g(), a2 = 0.05 + 0.15 * g(), a3 = 0.05 + 0.15 * g();
    const n = R.needles === 2 && g() < 0.35 ? 2 : 1;
    const needles = [];
    for (let k = 0; k < n; k++) {
      const w = R.widths[Math.floor(g() * R.widths.length)];
      const boundary = g() < 0.15;
      const c = [];
      for (let d = 0; d < R.dim; d++) c.push(boundary && d === 0 ? (g() < 0.5 ? 2 * w : 1 - 2 * w) : 0.08 + 0.84 * g());
      // rel > 1 makes the notch bite through the base; rel < 1 leaves the claim true
      needles.push({ c, w, rel: g() < 0.5 ? 1.2 + 0.5 * g() : 0.3 + 0.4 * g() });
    }
    const inst = U.buildInstance({ dim: R.dim, a1, a2, a3, margin: R.margin, needles });
    if (inst) return { rungId, seed, inst };
  }
  throw new Error(`could not build a decidable ${rungId} instance from seed ${seed}`);
}

/* ------------------------------------------------------------------ prompt */
function renderPrompt(task) {
  const { inst } = task, P = inst.P, d = P.dim;
  const vars = d === 1 ? 't' : 's, t';
  const dom = d === 1 ? '[0,1]' : '[0,1]^2';
  const nd = P.needles.map(n =>
    `      depth ${n.depth.toPrecision(12)} / (1 + ${d === 1 ? `((t - ${n.c[0]})/${n.w})^2`
      : `((s - ${n.c[0]})/${n.w})^2 + ((t - ${n.c[1]})/${n.w})^2`})`).join('\n');
  const base = d === 1
    ? `1 + ${P.a1} cos(2 pi t) + ${P.a2} cos(4 pi t) - ${P.shift}`
    : `1 + ${P.a1} cos(2 pi s) + ${P.a2} cos(2 pi t) + ${P.a3} cos(2 pi (s + t)) - ${P.shift}`;
  return `Decide whether f > 0 holds at EVERY point of ${dom}, and support your answer.

  f(${vars}) = base(${vars}) - notch(${vars})

  base(${vars}) = ${base}

  notch(${vars}) =
${nd}

Answer with one fenced json block and nothing else:

  {"verdict":"FAILS","witness":[${d === 1 ? '0.123456789' : '0.123456789, 0.987654321'}]}
  {"verdict":"HOLDS","covering":["00","01:6","1"]}
  {"verdict":"UNDECIDED"}

Rules.
- FAILS must carry a witness where f is strictly negative. It is checked in interval arithmetic.
- HOLDS must carry a COVERING: a list of dyadic addresses that TILE the domain. Address "011" means
  take the left half, then the right half, then the right half, bisecting along axis (depth mod ${d}).
  The addresses must form a complete prefix-free set - every node is a submitted leaf or is split in
  two. "01:6" is shorthand for the whole subtree under 01 taken 6 levels deeper. Every leaf is
  verified: if f is not provably positive on even one of them, the covering is rejected.
- Total expanded cells must not exceed ${EXPAND_CAP}.
- UNDECIDED is a real answer and scores above a wrong one. Use it if you cannot support a verdict.
- A verdict with no evidence scores zero, however correct it happens to be.`;
}

/* ------------------------------------------------------------------ parser */
/* Strict, and its refusals are reported separately from wrong answers: an unreadable submission is
   not a false one, and an eval that conflates them reports models as wrong when they were merely
   badly formatted. */
function parse(text) {
  if (typeof text !== 'string' || !text.trim()) return { ok: false, why: 'empty response' };
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fence ? fence[1] : text).trim();
  const start = raw.indexOf('{'), end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) return { ok: false, why: 'no json object found' };
  let o;
  try { o = JSON.parse(raw.slice(start, end + 1)); } catch (e) { return { ok: false, why: `json parse: ${e.message}` }; }
  const v = o.verdict;
  if (!['HOLDS', 'FAILS', 'UNDECIDED'].includes(v)) return { ok: false, why: `verdict must be HOLDS, FAILS or UNDECIDED (got ${JSON.stringify(v)})` };
  if (v === 'UNDECIDED') return { ok: true, submission: { verdict: v } };
  if (v === 'FAILS') {
    if (!Array.isArray(o.witness) || !o.witness.every(x => typeof x === 'number' && isFinite(x)))
      return { ok: false, why: 'FAILS needs "witness": an array of finite numbers' };
    return { ok: true, submission: { verdict: v, witness: o.witness } };
  }
  /* A bare HOLDS is READABLE, just unsupported — so it parses and the grader scores it zero.
     Calling it a parse error would hide the most interesting row in the table: the model that got
     the verdict right and had nothing to back it with. REFUSED means "could not read", never
     "read it and it was empty". */
  if (o.covering === undefined) return { ok: true, submission: { verdict: v } };
  if (!Array.isArray(o.covering) || !o.covering.length) return { ok: false, why: 'covering must be a non-empty array when present' };
  const out = [];
  for (const a of o.covering) {
    if (typeof a !== 'string') return { ok: false, why: 'covering entries must be strings' };
    const m = a.match(/^([01]*)(?::(\d+))?$/);
    if (!m) return { ok: false, why: `bad address ${JSON.stringify(a)}` };
    const base = m[1], extra = m[2] ? Number(m[2]) : 0;
    if (extra > 40) return { ok: false, why: `expansion depth ${extra} is absurd` };
    if (out.length + 2 ** extra > EXPAND_CAP) return { ok: false, why: `covering expands past the ${EXPAND_CAP}-cell cap` };
    if (!extra) out.push(base);
    else { const rec = p => { if (p.length === base.length + extra) { out.push(p); return; } rec(p + '0'); rec(p + '1'); }; rec(base); }
  }
  return { ok: true, submission: { verdict: v, covering: out } };
}

/* ------------------------------------------------------------------ grade */
function grade(task, submission) {
  const g = U.grade(task.inst, submission);
  const verdict = g.score >= 1 ? 'SOLVED'
    : g.score === 0.25 ? 'UNDECIDED'
      : g.score < 0 ? 'WRONG' : 'UNSUPPORTED';
  return { score: g.score, verdict, note: g.note };
}

/* ------------------------------------------------------------------ forgeries */
/* Planted attacks on the grader itself. Each MUST fail. If any is graded as solved the grader is
   unsound and the sweep aborts before a single model call. */
function forgeries(rungId) {
  const out = [];
  const t = makeTask(rungId, 424242);
  const d = t.inst.P.dim;
  // 1. a bare verdict with no evidence at all
  out.push({ task: t, submission: { verdict: 'HOLDS', covering: [] }, why: 'HOLDS with an empty covering' });
  // 2. a covering with a hole: drop one leaf from a complete grid
  const grid = [];
  const rec = p => { if (p.length === 6) { grid.push(p); return; } rec(p + '0'); rec(p + '1'); };
  rec('');
  out.push({ task: t, submission: { verdict: 'HOLDS', covering: grid.slice(1) }, why: 'covering with one leaf removed (a hole)' });
  // 3. overlapping addresses: a leaf and its own child
  out.push({ task: t, submission: { verdict: 'HOLDS', covering: ['0', '00', '1'] }, why: 'covering that is not prefix-free' });
  // 4. a witness that is not actually negative
  out.push({ task: t, submission: { verdict: 'FAILS', witness: new Array(d).fill(0.5) }, why: 'FAILS with an unverified witness' });
  return out;
}

module.exports = { name: 'uniformity', rungs: RUNGS, makeTask, renderPrompt, parse, grade, forgeries, EXPAND_CAP };
