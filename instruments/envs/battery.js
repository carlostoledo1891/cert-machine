#!/usr/bin/env node
/* battery.js — the gates on the three environments.
   instruments/envs · cert-machine

   WHAT THIS PROTECTS. The canary generator asserts that a submitted value is PROVABLY WRONG.
   That assertion is the product, so every gate here is aimed at it: the facts must still match
   the records they were read from (drift refuses), no minted canary may land inside its own
   enclosure, and the honesty rule — mint only from certified facts — must throw rather than
   degrade. Then the environments themselves: sampling must miss the needles, a bluffed tiling
   must score worse than abstaining, and an attacker that always attacks must fail the rungs
   that cannot be broken.

   RED CONTROLS are the ways this suite could lie, demonstrated failing: a grader that accepts
   everything and one that rejects everything must both score zero soundness (without the
   controls, "reject everything" would look perfect); a canary minted from a non-certified fact
   must throw; a bluffed tiling must be caught; an unverifiable attack must be scored wrong
   rather than as a near miss.

   usage: node instruments/envs/battery.js */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');
const L = require('./lib.js');
const C = require('./canary.js');
const U = require('./uniformity.js');
const EC = require('./env-canary.js');
const EU = require('./env-uniformity.js');
const H = require('./harness.js');

let pass = 0, fail = 0, reds = 0;
const check = (n, ok, note) => {
  if (ok) { pass++; console.log('PASS  ' + n + (note ? '   [' + note + ']' : '')); }
  else { fail++; console.log('FAIL  ' + n + (note ? '   [' + note + ']' : '')); }
};
const red = (n, fn) => {
  let fired = false, msg = '';
  try { const r = fn(); fired = r === true; msg = String(r); }
  catch (e) { fired = true; msg = e.message.slice(0, 78); }
  if (fired) { reds++; console.log('   RED ok  ' + n + '   [' + msg + ']'); }
  else { fail++; console.log('   RED DID NOT FIRE  ' + n); }
};

/* ---- the corpus ------------------------------------------------------------- */
{
  const bad = L.FACTS.filter(f => !f.certified || !(f.lo <= f.hi) || !Number.isFinite(f.lo) || !Number.isFinite(f.hi));
  check('E1 every fact is certified and carries a real enclosure', bad.length === 0 && L.FACTS.length >= 8,
    L.FACTS.length + ' facts');

  /* DRIFT: each fact naming a record must still match that record's bytes */
  const pinned = L.FACTS.filter(f => f.sha256 && f.record);
  let drifted = [];
  for (const f of pinned) {
    const p = path.join(ROOT, 'certs', f.record);
    const now = crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
    if (now !== f.sha256) drifted.push(f.record);
  }
  check('E2 every fact still matches the record it was read from (drift refuses)',
    pinned.length >= 4 && drifted.length === 0, pinned.length + ' pinned, ' + drifted.length + ' drifted');
}

/* ---- the generator ---------------------------------------------------------- */
{
  const subs = C.buildSuite();
  const wrong = subs.filter(s => s.truth === false);
  const right = subs.filter(s => s.truth !== false);
  check('E3 the suite mints both halves', wrong.length > 60 && right.length > 20,
    wrong.length + ' provably wrong, ' + right.length + ' provably right');

  /* NO canary may land inside its own certified enclosure — that would make the suite a liar */
  let inside = 0;
  for (const s of wrong) {
    const f = L.factById(s.factId);
    if (!f) continue;
    if (s.value >= f.lo && s.value <= f.hi) inside++;
  }
  check('E4 no "provably wrong" submission lies inside its own enclosure', inside === 0, inside + ' inside');

  const enc = C.score(C.GRADERS.enclosure, subs);
  check('E5 the enclosure grader is sound on the whole suite', enc.faRate === 0 && enc.frRate === 0,
    'FA ' + (100 * enc.faRate).toFixed(1) + '% · FR ' + (100 * enc.frRate).toFixed(1) + '%');

  const abs = C.score(C.GRADERS.absoluteTolerance, subs);
  check('E6 the suite actually breaks tolerance checking (or it measures nothing)', abs.faRate > 0.5,
    'absolute-tolerance false-accept ' + (100 * abs.faRate).toFixed(1) + '%');

  /* the one family that is a reproduction rather than a construction */
  const pub = wrong.filter(s => s.family === 'published-wrong');
  const f852 = L.factById('erdos852.cstar');
  const v = f852 && f852.publishedWrong;
  check('E7 the published #852 value is outside the certificate AND inside an ordinary tolerance',
    pub.length > 0 && v !== undefined && (v < f852.lo || v > f852.hi) && Math.abs(v - (f852.lo + f852.hi) / 2) < 1e-9,
    'off by ' + (f852.lo - v).toExponential(2) + ', tolerance 1e-9');
}

/* ---- the uniformity gym ------------------------------------------------------ */
{
  const suite = U.makeSuite(12, 20260903);
  const sound = U.run(suite, 'interval', i => U.solveInterval(i));
  const samp = U.run(suite, 'sampling', i => U.solveSampling(i, 1000));
  const bluff = U.run(suite, 'bluff', i => U.solveBluff(i, 1000, i.dim === 1 ? 10 : 12));
  check('E8 the sound interval solver is never wrong', sound.wrong === 0 && sound.total > 0,
    'score ' + sound.total.toFixed(2) + ', ' + sound.correct + ' correct, ' + sound.abstain + ' abstained');
  check('E9 sampling misses needles the interval solver catches', samp.missed > 0 && sound.missed === 0,
    'sampling missed ' + samp.missed + ', interval missed 0');
  check('E10 a bluffed tiling scores WORSE than abstaining', bluff.total < 0,
    'bluff score ' + bluff.total.toFixed(2) + ' with ' + bluff.wrong + ' wrong');
}

/* ---- the attacker environment ------------------------------------------------ */
/* The ladder's design claim: BOTH standing answers are wrong somewhere. "Always attack" cannot
   solve the rungs that have no attack; "never attack" cannot solve the rungs that do. Only a
   model that checks scores on all four, which is the behaviour the environment exists to reward. */
{
  const tasks = EC.rungs.map(r => EC.makeTask(r.id, 7));
  const noAttack = tasks.map(t => EC.grade(t, { verdict: 'NO_ATTACK' }));
  const solvedByNoAttack = tasks.filter((t, i) => noAttack[i].score >= 1).length;
  const unattackable = tasks.filter(t => !t.attackable).length;
  check('E11 "no attack" solves exactly the rungs that cannot be broken, and loses on the rest',
    solvedByNoAttack === unattackable && unattackable > 0
    && tasks.every((t, i) => (t.attackable ? noAttack[i].score < 0 : noAttack[i].score >= 1)),
    solvedByNoAttack + ' of ' + tasks.length + ' rungs unbreakable');

  /* a REAL attack, minted the way the environment intends */
  let solvedByAttack = 0, mislabelled = 0;
  for (const t of tasks) {
    const tol = t.grader.tol;
    const c = tol ? L.toleranceInterior(t.fact, tol, 1) : null;
    const v = c ? c.value : (t.fact.lo + t.fact.hi) / 2;      /* no attack exists: the naive move */
    const g = EC.grade(t, { attack: v });
    if (g.verdict === 'RUNG_MISLABELLED') mislabelled++;
    if (g.score >= 1) solvedByAttack++;
  }
  check('E12 a minted attack solves exactly the breakable rungs, and no rung is mislabelled',
    solvedByAttack === tasks.length - unattackable && mislabelled === 0,
    solvedByAttack + ' broken of ' + (tasks.length - unattackable) + ' breakable');
}

/* ---- the forgery gate on every environment ----------------------------------- */
{
  let planted = 0, leaked = 0;
  for (const env of [EU, EC]) {
    for (const r of env.rungs) {
      for (const f of env.forgeries(r.id)) {
        planted++;
        const g = env.grade(f.task, f.submission);
        if (g.score >= 1) leaked++;
      }
    }
  }
  check('E13 every planted forgery is caught by its own environment', planted > 0 && leaked === 0,
    planted + ' planted, ' + leaked + ' leaked');
}

/* ---- red controls ------------------------------------------------------------ */
red('R1 minting from a non-certified fact must throw', () => {
  L.mintCanaries({ id: 'fake', lo: 0, hi: 1, certified: false }, 1e-9);
  return 'a canary was minted from an uncertified fact';
});
red('R2 a grader that accepts everything must score zero soundness', () => {
  const subs = C.buildSuite();
  const r = C.score({ name: 'accept-all', decide: () => true }, subs);
  return r.faRate < 1 ? 'accept-all was not measured at 100% false-accept' : true;
});
red('R3 a grader that rejects everything must score zero soundness', () => {
  const subs = C.buildSuite();
  const r = C.score({ name: 'reject-all', decide: () => false }, subs);
  return r.frRate < 1 ? 'reject-all escaped the controls — the false-reject half is not load-bearing' : true;
});
red('R4 a bluffed tiling must be refused on a needled instance', () => {
  const suite = U.makeSuite(12, 20260903);
  const bluff = U.run(suite, 'bluff', i => U.solveBluff(i, 1000, i.dim === 1 ? 10 : 12));
  return bluff.wrong > 0 ? true : 'the bluff solver was never caught';
});
red('R5 an attack that does not verify must be scored wrong, not a near miss', () => {
  const t = EC.makeTask(EC.rungs[EC.rungs.length - 1].id, 3);
  const p = EC.parse(JSON.stringify({ attack: true, value: (t.spec && t.spec.reference !== undefined ? t.spec.reference : 1) }));
  if (!p.ok) return true;
  const g = EC.grade(t, p.submission);
  return g.score < 0 ? true : 'an unverifiable attack scored ' + g.score;
});

console.log('\n' + pass + ' pass, ' + fail + ' fail, ' + reds + ' red controls fired');
process.exit(fail ? 1 : 0);
