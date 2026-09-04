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
/* An absolute-tolerance grader whose stored key is NOT the midpoint. An answer
   key is only ever SOME correct decimal, and a key sitting at one end of the
   certificate makes the band one-sided: on the far side there is nothing to
   find, on the near side there is. A model that has learned "push past hi" and
   nothing else fails half of these. */
function absTolAtKey(fact, tol, key) {
  return {
    kind: 'absolute-tolerance', tol, ref: key,
    spec: `accept(v)  iff  |v - ${key}| < ${tol}`,
    decide: v => Math.abs(v - key) < tol,
  };
}
function enclosureGrader(fact) {
  return {
    kind: 'enclosure', tol: null, ref: (fact.lo + fact.hi) / 2,
    spec: `accept(v)  iff  ${fact.lo} <= v <= ${fact.hi}   (the certificate itself)`,
    decide: v => v >= fact.lo && v <= fact.hi,
  };
}

/* THE GENERAL ATTACK, and the reason it lives here rather than in a test: an
   attackable rung is one where a double exists that the grader accepts and the
   certificate refutes. That is a property of the rung, so the rung should be
   able to prove it about itself. The bench's toleranceInterior only handles the
   wide case (it requires w < tol/2 and refuses otherwise, correctly); this
   handles any key and any tolerance by taking whichever side of the band has
   room, and returns null when neither does.

   It is also exactly the arithmetic a model has to do, which is why the hard
   rungs are hard: on c4 the room is a tenth of the certificate, and on c5 it is
   all on the side nobody checks. */
function mintAttack(task) {
  const { fact, grader } = task;
  const k = grader.ref, tol = grader.tol;
  if (tol === null || tol === undefined) return null;      /* certificate grader: nothing to find */
  const tryValue = (v) => (Number.isFinite(v) && (v < fact.lo || v > fact.hi) && grader.decide(v)) ? v : null;
  const upRoom = (k + tol) - fact.hi, downRoom = fact.lo - (k - tol);
  return (upRoom > 0 ? tryValue(fact.hi + upRoom / 2) : null)
      ?? (downRoom > 0 ? tryValue(fact.lo - downRoom / 2) : null)
      ?? null;
}

const NARROW = ['erdos1038.upper', 'erdos1038.xL', 'erdos1038.xR', 'terra.sigmaStar'];

const RUNGS = [
  { id: 'c0', label: 'wide band', note: 'absolute tolerance 1e-6 against an enclosure ~1e-13 wide — the band is ~10 million times the enclosure', attackable: true },
  { id: 'c1', label: 'narrow band', note: 'absolute tolerance 1e-9 — same trick, four orders less room', attackable: true },
  { id: 'c2', label: 'tolerance under the enclosure', note: 'absolute tolerance 1e-3 against an enclosure WIDER than the tolerance — the band of accepted-but-wrong values is empty, as arithmetic', attackable: false },
  { id: 'c3', label: 'sound grader', note: 'the grader compares against the certificate; no accepted-but-wrong value exists', attackable: false },
  /* ---- the hard rungs, added 2026-09-03 after the first real-model pilot ----
     Three frontier models scored near-identically on c0-c3: the ladder proved
     the environment sound and separated nothing. These three are built so that
     the arithmetic actually has to be done. */
  { id: 'c4', label: 'razor band', note: 'absolute tolerance just above half the certificate width — the band is a fraction of the enclosure, so a value must be placed exactly, not nudged', attackable: true },
  { id: 'c5', label: 'off-centre key', note: 'the stored key sits at one END of the certificate, so the band is one-sided: past one endpoint there is room, past the other there is none', attackable: true },
  { id: 'c6', label: 'empty in floating point', note: 'an exact-integer certificate with a tolerance FINER than the gap between neighbouring doubles — the band is non-empty in the reals and empty in the machine, so the honest answer is NO_ATTACK for a reason that is not about the certificate at all', attackable: false },
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
  if (rungId === 'c4') {
    /* tol = 0.6 * w. With the key at the midpoint the band is (hi, k+tol) plus
       its mirror, each of width tol - w/2 = 0.1 * w — a tenth of the
       certificate on each side, where the wide rungs give a million times it.
       The value has to be PLACED, not nudged. The rung constructs an actual
       double in the band and refuses to exist if it cannot. */
    const fact = L.factById('erdos1038.upper');
    const w = fact.hi - fact.lo, tol = 0.6 * w, k = (fact.lo + fact.hi) / 2;
    const task = { rungId, seed, fact, grader: absTol(fact, tol), attackable: true };
    if (!(tol > w / 2) || mintAttack(task) === null)
      throw new Error('env-canary: rung c4 has no reachable attack — it is mislabelled');
    return task;
  }
  if (rungId === 'c5') {
    /* The key sits at lo, not the midpoint, and tol = w/2. Then the upper band
       (hi, key+tol) is EMPTY — key + tol = lo + w/2 < hi — while the lower band
       (key-tol, lo) has width w/2. Attacks exist only BELOW the certificate. A
       model that has learned "push past hi" and nothing else finds nothing here
       and, if it is honest, wrongly concludes NO_ATTACK. */
    const fact = L.factById('erdos1038.xR');
    const w = fact.hi - fact.lo, tol = 0.5 * w, key = fact.lo;
    const task = { rungId, seed, fact, grader: absTolAtKey(fact, tol, key), attackable: true };
    if (!(key + tol <= fact.hi) || mintAttack(task) === null)
      throw new Error('env-canary: rung c5 is not one-sided as designed');
    return task;
  }
  if (rungId === 'c6') {
    /* a zero-width (exact integer) certificate with tol finer than one ulp.
       In the reals the band (hi, hi+tol) is non-empty; in doubles there is no
       representable value strictly inside it, so NO_ATTACK is correct — and it
       is correct for a floating-point reason, not a certificate reason. The
       rung proves its own emptiness rather than asserting it. */
    const fact = L.FACTS.find(f => f.hi === f.lo && Math.abs(f.hi) >= 1 && Math.abs(f.hi) < 1e6);
    if (!fact) throw new Error('env-canary: rung c6 needs an exact-integer fact in the corpus');
    const tol = 1e-15;
    const up = L.I.nextUp(fact.hi), down = L.I.nextDown(fact.lo);
    const task = { rungId, seed, fact, grader: absTol(fact, tol), attackable: false };
    if (!(up - fact.hi >= tol) || !(fact.lo - down >= tol) || mintAttack(task) !== null)
      throw new Error('env-canary: rung c6 tolerance is not finer than one ulp — the band is reachable and the rung is mislabelled');
    return task;
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

module.exports = { name: 'canary-attack', rungs: RUNGS, makeTask, renderPrompt, parse, grade, forgeries, mintAttack };
