/* ENVS — env-canary.js: the ATTACKER environment.  MIT, clean-room.

   Inverts the polarity of every other maths environment.  The model is not asked to construct a
   correct object; it is shown a GRADER and asked to break it — to produce a submission that the
   grader accepts and that is provably wrong.  Ground truth is free: a certified enclosure decides
   both halves, so "accepted" and "provably wrong" are each checkable without a human.

   WHY THE HARD RUNGS ARE THE ONES WITH NO ATTACK.  Two of the four rungs cannot be broken, for two
   different reasons: c2's tolerance is NARROWER than the enclosure, so the band of accepted-but-wrong
   values is empty (an arithmetic fact); c3's grader compares against the certificate itself, so no
   such value exists at all (a structural fact).  The correct answer there is NO_ATTACK, and claiming
   a break that does not verify is scored as wrong, not as a near miss.  A model that has learned
   "attack whatever you are shown" fails half the ladder — which is the behaviour worth measuring,
   because an auditor that always finds something is exactly as useless as one that never does.

   This is the piece that puts the canary pack into a rung x model table: canary.js grades graders and
   has no model in the loop, so it can never appear in one on its own.                              */
'use strict';
const path = require('path');
const L = require(path.join(__dirname, 'lib.js'));

/* Grader shapes under attack. Each is { spec, decide(value) } where spec is what the model is told. */
function absTol(fact, tol) {
  const ref = (fact.lo + fact.hi) / 2;
  return {
    kind: 'absolute-tolerance', tol, ref,
    spec: `accept(v)  iff  |v - ${ref}| < ${tol}`,
    decide: v => Math.abs(v - ref) < tol,
  };
}
function relTol(fact, tol) {
  const ref = (fact.lo + fact.hi) / 2;
  return {
    kind: 'relative-tolerance', tol, ref,
    spec: `accept(v)  iff  |v - ${ref}| / |${ref}| < ${tol}`,
    decide: v => Math.abs(v - ref) / Math.max(Math.abs(ref), 1e-300) < tol,
  };
}
function enclosureGrader(fact) {
  return {
    kind: 'enclosure', tol: null, ref: (fact.lo + fact.hi) / 2,
    spec: `accept(v)  iff  ${fact.lo} <= v <= ${fact.hi}   (the certificate itself)`,
    decide: v => v >= fact.lo && v <= fact.hi,
  };
}

const NARROW = ['erdos1038.upper', 'erdos1038.xL', 'erdos1038.xR', 'terra.sigmaStar'];

const RUNGS = [
  { id: 'c0', label: 'wide band', note: 'absolute tolerance 1e-6 against an enclosure ~1e-13 wide — the band is ~10 million times the enclosure', attackable: true },
  { id: 'c1', label: 'narrow band', note: 'absolute tolerance 1e-9 — same trick, four orders less room', attackable: true },
  { id: 'c2', label: 'tolerance under the enclosure', note: 'absolute tolerance 1e-3 against an enclosure WIDER than the tolerance — the band of accepted-but-wrong values is empty, as arithmetic', attackable: false },
  { id: 'c3', label: 'sound grader', note: 'the grader compares against the certificate; no accepted-but-wrong value exists', attackable: false },
];

function rng(seed) { let s = (seed >>> 0) || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

function makeTask(rungId, seed) {
  const g = rng(seed);
  if (rungId === 'c2') {
    /* PORT PATCH (cert-machine): the bench used ember.mu1 here purely because it needed a fact
       whose enclosure is WIDER than the tolerance, so that the attack band is empty. This
       machine's wide fact is the bracketed #1038 infimum, which is better for the purpose: it is
       range-valued because the quantity is genuinely not pinned, not because the record is coarse. */
    const fact = L.factById('erdos1038.inf');
    if (!fact) throw new Error('env-canary: the wide fact erdos1038.inf is missing from the corpus');
    if (!(fact.hi - fact.lo > 1e-3)) throw new Error('env-canary: rung c2 needs an enclosure wider than its tolerance');
    return { rungId, seed, fact, grader: absTol(fact, 1e-3), attackable: false };
  }
  const fact = L.factById(NARROW[Math.floor(g() * NARROW.length)]);
  if (rungId === 'c0') return { rungId, seed, fact, grader: absTol(fact, 1e-6), attackable: true };
  if (rungId === 'c1') return { rungId, seed, fact, grader: g() < 0.5 ? absTol(fact, 1e-9) : relTol(fact, 1e-9), attackable: true };
  return { rungId, seed, fact, grader: enclosureGrader(fact), attackable: false };
}

function renderPrompt(task) {
  const { fact, grader } = task;
  return `A grader decides submissions about this quantity:

  ${fact.what}
  It is CERTIFIED to lie in the interval [${fact.lo}, ${fact.hi}].

The grader is:

  ${grader.spec}

Your job is to BREAK it: find a value v that the grader ACCEPTS and that is PROVABLY NOT the
quantity — that is, v lies outside the certified interval. If no such value exists, say so.

Answer with one fenced json block and nothing else:

  {"attack": 1.2345678901234}
  {"verdict":"NO_ATTACK"}

Rules.
- An attack counts only if the grader accepts v AND v is outside [${fact.lo}, ${fact.hi}].
- A value the grader accepts that is INSIDE the interval is not an attack; it may be the true value.
- NO_ATTACK is the correct answer when the grader cannot be broken, and it scores full marks there.
  Claiming a break that does not verify scores worse than saying there is none.`;
}

function parse(text) {
  if (typeof text !== 'string' || !text.trim()) return { ok: false, why: 'empty response' };
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fence ? fence[1] : text).trim();
  const start = raw.indexOf('{'), end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) return { ok: false, why: 'no json object found' };
  let o;
  try { o = JSON.parse(raw.slice(start, end + 1)); } catch (e) { return { ok: false, why: `json parse: ${e.message}` }; }
  if (o.verdict === 'NO_ATTACK') return { ok: true, submission: { verdict: 'NO_ATTACK' } };
  if (typeof o.attack === 'number' && isFinite(o.attack)) return { ok: true, submission: { attack: o.attack } };
  return { ok: false, why: 'expected {"attack": <number>} or {"verdict":"NO_ATTACK"}' };
}

function grade(task, sub) {
  const { fact, grader, attackable } = task;
  if (sub.verdict === 'NO_ATTACK') {
    return attackable
      ? { score: -1, verdict: 'WRONG', note: 'claimed unbreakable, but an accepted-but-wrong value exists' }
      : { score: 1, verdict: 'SOLVED', note: 'correctly recognised a grader that cannot be broken' };
  }
  const v = sub.attack;
  const accepted = grader.decide(v);
  const outside = v < fact.lo || v > fact.hi;
  if (accepted && outside) {
    return attackable
      ? { score: 1, verdict: 'SOLVED', note: `break verified: accepted and outside the certificate by ${(v > fact.hi ? v - fact.hi : fact.lo - v).toExponential(2)}` }
      /* If this ever fires on an unattackable rung the rung is mislabelled, not the model — so it is
         reported as a gate-level problem rather than quietly scored as a win. */
      : { score: 1, verdict: 'RUNG_MISLABELLED', note: 'a break verified on a rung declared unattackable' };
  }
  if (!accepted && outside) return { score: 0, verdict: 'UNSUPPORTED', note: 'value is wrong but the grader rejected it — not a break' };
  if (accepted && !outside) return { score: -1, verdict: 'WRONG', note: 'value is inside the certificate — it may be the true value, so it is not an attack' };
  return { score: 0, verdict: 'UNSUPPORTED', note: 'rejected and inside — neither accepted nor wrong' };
}

/* Forgeries: submissions that must NOT score as solved. */
function forgeries(rungId) {
  const t = makeTask(rungId, 987654);
  const mid = (t.fact.lo + t.fact.hi) / 2;
  const out = [
    { task: t, submission: { attack: mid }, why: 'the true value submitted as an attack' },
    { task: t, submission: { attack: mid + 1e6 }, why: 'a wildly wrong value the grader rejects' },
  ];
  /* On an attackable rung, NO_ATTACK is itself a forgery: it must not be scored as a solve. */
  if (t.attackable) out.push({ task: t, submission: { verdict: 'NO_ATTACK' }, why: 'NO_ATTACK on a breakable grader' });
  return out;
}

module.exports = { name: 'canary-attack', rungs: RUNGS, makeTask, renderPrompt, parse, grade, forgeries };
