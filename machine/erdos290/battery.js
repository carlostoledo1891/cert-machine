#!/usr/bin/env node
/* battery.js — the tail-constraint layer's gate.

   This module decides what an undetermined degree COSTS, so every number in
   the #290 bracket passes through it. Three things have to hold, and a red
   control for each:

     it reduces to the status quo   with nothing assumed, the bracket must be
       the one the report publishes — the extraction from the report builder
       is only safe because this is checked
     it is monotone                 a narrower assumption can never produce a
       wider bracket; if it does, the arithmetic has a sign error
     it refuses false lemmas        a constraint contradicting a density this
       project has already pinned is REFUTED, not priced */
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const LEG = path.join(ROOT, 'legacy', 'research', 'challenges', 'erdos290');
const T = require('./tail.js');

let pass = 0, fail = 0, reds = 0;
const ok = (c, m) => { if (c) { pass++; console.log('PASS  ' + m); } else { fail++; console.log('FAIL  ' + m); } };

const I = T.loadInputs(ROOT, LEG);
const Q = I.Q, C = T.constraints(Q), bracket = T.makeBracket(I);
const ONE = Q.R(1n, 1n);
const w = (b) => Q.toDouble(Q.sub(b.hi, b.lo));

/* ---- 1. the limit is enclosed, exactly ---------------------------------- */
{
  const L = C.limit, lo = Q.toDouble(L.lo), hi = Q.toDouble(L.hi);
  const truth = 1 - Math.exp(-0.5);
  ok(lo <= truth && truth <= hi && (hi - lo) < 1e-30,
    'the limit 1 - e^(-1/2) = ' + truth.toFixed(15) + ' is enclosed to width '
    + (hi - lo).toExponential(2) + ' by an alternating-series bound, no float in the derivation');
}

/* ---- 2. nothing assumed reproduces the published bracket ----------------- */
{
  const b = bracket(I.Lmax, C.full);
  const lo = Q.toDouble(b.lo), hi = Q.toDouble(b.hi);
  ok(Math.abs(lo - 0.830416407911) < 1e-11 && Math.abs(hi - 0.831220912621) < 1e-11,
    'with nothing assumed the bracket is the published one, [' + lo.toFixed(12) + ', ' + hi.toFixed(12)
    + '] — which is what makes the extraction out of the report builder safe');
}

/* ---- 3. monotone in the strength of the assumption ----------------------- */
{
  const ladder = [C.full, C.window(5, 10), C.window(1, 10), C.window(1, 1000), C.hyperoct];
  let monotone = true, prev = Infinity;
  for (const c of ladder) { const x = w(bracket(I.Lmax, c)); if (x > prev + 1e-18) monotone = false; prev = x; }
  ok(monotone, 'a stronger assumption never widens the bracket (' + ladder.length + ' rungs, '
    + w(bracket(I.Lmax, C.full)).toExponential(2) + ' down to ' + w(bracket(I.Lmax, C.hyperoct)).toExponential(2) + ')');
}

/* ---- 4. the pricing is linear in the width of the claim ------------------ */
{
  const a = w(bracket(I.Lmax, C.window(1, 10)));      /* width 0.1  */
  const b = w(bracket(I.Lmax, C.window(1, 100)));     /* width 0.01 */
  ok(Math.abs(a / b - 10) < 0.01,
    'ten times narrower a claim buys ten times narrower a bracket (' + (a / b).toFixed(3)
    + 'x) — the tail is a sum of widths and nothing else');
}

/* ---- 5. RED: lemmas the data already refutes ----------------------------- */
{
  const bad = [
    [C.floor(1, 2), 'δ ≥ 1/2'],
    [C.ceiling(3, 10), 'δ ≤ 3/10'],
    [C.floor(4, 10), 'δ ≥ 4/10'],
  ];
  let caught = 0;
  for (const [c, name] of bad) {
    const r = T.consistentWithPinned(Q, c, I.EXACT, 31);
    if (!r.ok) { caught++; console.log('       RED ok  ' + name + ' is REFUTED by the pinned density at d = ' + r.d); }
  }
  reds += caught;
  ok(caught === bad.length, 'RED: every false lemma is refuted by a density already on file, before it is priced');
}
{
  const r = T.consistentWithPinned(Q, C.window(1, 10), I.EXACT, 31);
  ok(r.ok && r.checked > 250, 'and a TRUE lemma survives the same check against ' + r.checked + ' pinned densities — '
    + 'the check has content in both directions');
  if (r.ok) reds += 0;
}

console.log('erdos290 tail battery: ' + pass + ' pass, ' + fail + ' fail, ' + reds + ' red controls fired');
process.exit(fail ? 1 : 0);
