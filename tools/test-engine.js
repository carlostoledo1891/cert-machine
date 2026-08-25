#!/usr/bin/env node
/* test-engine.js — the engine's gate. Red controls only where a wrong answer
   would be invisible: a screen that admits, a certifier that can be forged, a
   refutation that cannot fail. Nothing else is gated. */
'use strict';
const path = require('path'); const ROOT = path.resolve(__dirname, '..');
const { run, relations } = require(path.join(ROOT, 'machine/engine.js'));
const NEW = require(path.join(ROOT, 'families/newman.js'));
const COS = require(path.join(ROOT, 'families/cosine.js'));
const N = require(path.join(ROOT, 'instruments/trigmin/newman.js'));

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('PASS  ' + m); } else { fail++; console.log('FAIL  ' + m); } };

/* the screen may prune, never admit: everything it prunes must really fail */
{
  let checked = 0, leaked = 0;
  for (let i = 0; i < 4000 && checked < 60; i++) {
    const A = NEW.enumerate(i); const v = NEW.value(A);
    if (NEW.interesting(A, v)) continue;
    checked++;
    if (NEW.certify(A).verdict === 'HIT') leaked++;
  }
  ok(checked > 0 && leaked === 0, 'newman screen: ' + checked + ' pruned candidates, ' + leaked + ' would have certified HIT (must be 0)');
}
/* the certifier reproduces the literature */
{
  const c = N.certifyNewman([0,1,2,6,9], { bar: 0 });
  ok(c.modSq[0] === 1 && c.modSq[1] === 1, 'M(0,1,2,6,9) certified as exactly [1,1] (Mercer 2019)');
  const b = N.certifyNewman([0,1,2,3,4,7,8,10,12], { bar: 0 });
  ok(Math.abs(b.modulus[0] - 1.362373178133324) < 1e-14, 'Boyd degree-12 witness reproduces at 1.36237 (' + b.modulus[0].toFixed(12) + ')');
}
/* RED: a forged certificate must be refused by the independent recompute */
{
  const A = [0,6,9,10,17,24];
  const c = N.certifyNewman(A, { bar: 0 });
  ok(N.recheckNewman(A, c) === true, 'RED control: the honest certificate passes the recompute');
  const forged = JSON.parse(JSON.stringify(c)); forged.modSq = [9, 9.001];
  ok(N.recheckNewman(A, forged) === false, 'RED: a certificate with its floor forged to 9 is REFUSED');
  const sab = N.certifyNewman(A, { bar: 0, sabotage: 'narrow' });
  ok(N.recheckNewman(A, sab) === false, 'RED: an enclosure narrowed to its own midpoint is REFUSED (only dense sampling catches this)');
}
/* RED: a refutation must be able to fail — a form INSIDE the enclosure survives */
{
  const r = relations([0.4999999, 0.5000001], { maxDen: 8 });
  const half = r.candidates.find(x => x.label === '1/2');
  ok(!!half, 'RED control: 1/2 inside a wide enclosure SURVIVES as a candidate (the test can fail to refute)');
  const tight = relations([0.5100000000001, 0.5100000000002], { maxDen: 8 });
  ok(tight.candidates.length === 0 && tight.refuted > 0, 'RED: against a tight enclosure at 0.51, all ' + tight.refuted + ' forms are refuted exactly');
}
/* the engine loop itself */
{
  const r = run(COS, { limit: 3000, maxCertify: 8 });
  ok(r.counts.generated === 3000, 'engine generated every index it was given');
  ok(r.counts.certified <= 8, 'engine honoured the certify cap (' + r.counts.certified + ')');
  ok(r.counts.screened >= r.counts.certified, 'nothing was certified that the screen did not pass');
  const r2 = run(COS, { limit: 3000, maxCertify: 8 });
  ok(JSON.stringify(r.hits.map(h => h.key)) === JSON.stringify(r2.hits.map(h => h.key)), 'two runs at the same limit give identical hits — the enumeration is deterministic');
}
/* CALIBRATION against ground truth. This is not decoration: its first run
   caught the engine REFUTING sqrt(2) as a closed form for the decimal expansion
   of sqrt(2), because the enclosure was built narrower than a double can
   represent and excluded the true value. A refutation engine that can refute a
   truth is worse than no engine. Zero false refutations is the bar. */
{
  const OE = require(path.join(ROOT, 'families/oeis-closedform.js'));
  /* expected form as a REGEX, not a substring: the vocabulary can spell the same
     number more than one way (sqrt2 and sqrt(2/1) are the same form), and a
     substring test went stale the moment the vocabulary widened — reporting a
     false refutation that was really a stale expectation. */
  const truth = [['A000796',/pi/],['A001113',/(^|[^a-z])e[\^)]/],['A002193',/sqrt\(2\/1\)|sqrt2/],
                 ['A001622',/phi|sqrt5/],['A002162',/ln2/],['A002194',/sqrt\(3\/1\)|sqrt3/],
                 ['A003881',/pi/],['A019692',/pi/]];
  const byId = {};
  for (let i = 0; ; i++) { const e = OE.enumerate(i); if (!e) break;
    if (!OE.interesting(e)) continue; const c = OE.certify(e);
    if (c.extra && c.extra.survivors) byId[c.extra.id] = c.extra.survivors.map(s => s.label); }
  let falseRefutations = 0, checked = 0;
  for (const [id, form] of truth) {
    if (!byId[id]) continue;
    checked++;
    if (!byId[id].some(l => form.test(l))) falseRefutations++;
  }
  ok(checked >= 6, 'calibration reached ' + checked + ' ground-truth constants in the corpus');
  ok(falseRefutations === 0, 'ZERO false refutations: every constant whose closed form we know keeps it (' + falseRefutations + ' failures)');

  /* RED: the check must be able to fail — a deliberately over-narrow enclosure
     must refute a truth, which is exactly the bug it was written for. */
  const { relations } = require(path.join(ROOT, 'machine/engine.js'));
  const thin = relations([Math.SQRT2 * (1 + 1e-15), Math.SQRT2 * (1 + 1.1e-15)], { maxDen: 8 });
  const kept = thin.candidates.some(c => c.label.includes('sqrt'));
  ok(!kept && thin.refuted > 0, 'RED: an enclosure shifted off sqrt(2) refutes it — the calibration can fail');

  /* the vocabulary counts each VALUE once: an enclosure around 2e must yield
     exactly one ·e candidate, not (2/1)(4/2)(6/3)(8/4) — the duplicate
     inflation a reviewer caught in under a minute */
  const twoE = relations([2 * Math.E - 1e-9, 2 * Math.E + 1e-9], { maxDen: 8 });
  const eForms = twoE.candidates.filter(c => c.label.endsWith('·e'));
  ok(eForms.length === 1 && eForms[0].label === '(2/1)·e',
    'reduced fractions only: 2e survives as ONE candidate, not four (' + eForms.map(c => c.label).join(', ') + ')');

  /* A019762 is literally NAMED "Decimal expansion of 2*e" and was once
     certified as a discovery because the name regex missed the asterisk. It
     must never be a HIT again, and no HIT may carry a form already on record. */
  const a19762 = OE.certify(CORPUS_BY_ID('A019762'));
  ok(a19762 && a19762.verdict === 'REJECT',
    'A019762 ("2*e" in the name) is REJECT — a screen escape, not a discovery');
  let badHits = 0, hitCount = 0;
  for (let i = 0; ; i++) {
    const e = OE.enumerate(i); if (!e) break;
    if (!OE.interesting(e)) continue;
    const c = OE.certify(e);
    if (c.verdict !== 'HIT') continue;
    hitCount++;
    if (c.extra.nameStatesForm || c.extra.formOnRecord !== false) badHits++;
  }
  ok(badHits === 0, 'every OEIS HIT has its FULL record fetched and silent (' + hitCount + ' hits, ' + badHits + ' with a form on record)');

  function CORPUS_BY_ID(id) {
    for (let i = 0; ; i++) { const e = OE.enumerate(i); if (!e) return null; if (e.id === id) return e; }
  }
}

/* Krawczyk: calibrate against the ONE case with a closed form, and prove the
   certifier can refuse. The Henon map's fixed points solve a quadratic, so the
   certified box must contain the exact root — if it does not, the whole family
   is producing confident nonsense. */
{
  const HEN = require(path.join(ROOT, 'families/henon-orbits.js'));
  const a = 1.4, b = 0.3, disc = Math.sqrt((1 - b) * (1 - b) + 4 * a);
  const exact = [((b - 1) + disc) / (2 * a), ((b - 1) - disc) / (2 * a)];

  const certs = [];
  for (let i = 0; ; i++) {
    const o = HEN.enumerate(i); if (!o) break;
    if (!HEN.interesting(o, HEN.value(o))) continue;
    if (o.a !== a || o.p !== 1) continue;
    const c = HEN.certify(o);
    if (c.verdict === 'HIT') certs.push(c.extra);
  }
  ok(certs.length >= 2, 'both Henon fixed points at a=1.4 certify (' + certs.length + ' found)');
  let contained = 0;
  for (const root of exact) {
    const m = certs.find(c => Math.abs(c.orbit[0] - root) < 1e-9);
    if (m && root >= m.box[0][0] && root <= m.box[0][1]) contained++;
  }
  ok(contained === exact.length, 'every certified box CONTAINS the closed-form root it claims (' + contained + '/' + exact.length + ')');

  /* RED: the certifier must refuse where NO solution exists.

     Displacing a start point is not that test — Krawczyk certifies "a unique
     root lies in this box", so a displaced start that still reaches the same
     root is correct behaviour, and the first version of this control failed for
     that reason. The decisive case is a parameter where the equation has no
     real solution at all: the Henon fixed points solve
     a x^2 + (1-b) x - 1 = 0, whose discriminant (1-b)^2 + 4a is negative for
     a < -(1-b)^2/4 = -0.1225 at b = 0.3. At a = -0.5 there is nothing to find,
     and a certifier that finds something there is broken. */
  const good = certs[0];
  let falseCert = 0, tried = 0;
  for (let sd = 0; sd < 8; sd++) {
    const o = { a: -0.5, b, p: 1, s: sd, v: [-1.5 + 0.4 * sd] };
    tried++;
    if (HEN.certify(o).verdict === 'HIT') falseCert++;
  }
  ok(falseCert === 0, 'RED: at a=-0.5 the fixed-point equation has negative discriminant and NOTHING certifies (' + falseCert + '/' + tried + ' false certificates)');

  /* and the control on the control: the same starts at a real parameter DO certify,
     so the refusal above is about the mathematics and not about the starts. */
  let realCert = 0;
  for (let sd = 0; sd < 8; sd++) {
    const o = { a: 1.4, b, p: 1, s: sd, v: [-1.5 + 0.4 * sd] };
    if (HEN.certify(o).verdict === 'HIT') realCert++;
  }
  ok(realCert > 0, 'RED control: the same start vectors at a=1.4 DO certify (' + realCert + '/8) — the refusal is mathematical, not procedural');

  /* RED: uniqueness is strict-interior, not containment. A zero-radius box
     cannot satisfy strict interior containment. */
  const degenerate = HEN.certify({ a, b, p: 1, s: 0, v: [good.orbit[0]] });
  ok(degenerate.verdict === 'HIT' && degenerate.extra.maxRad > 0,
    'a certified box has POSITIVE radius — strict interior containment, not a point claim');
}

/* The census family: completeness must agree with everything else we certify.
   The orbit family's counts are lower bounds by construction; every orbit it
   certified must reappear as a census record, and the census must never emit
   a wrong count under a starved budget — it refuses instead. */
{
  const CEN = require(path.join(ROOT, 'families/henon-census.js'));
  const HEN = require(path.join(ROOT, 'families/henon-orbits.js'));
  const { census } = require(path.join(ROOT, 'instruments/census/henon-census.js'));
  const a = 1.4, b = 0.3;

  const c1 = CEN.certify({ a, b, p: 1 });
  ok(c1.verdict === 'HIT' && c1.enclosure[0] === 2 && c1.enclosure[1] === 2,
    'census family: EXACTLY 2 fixed points at a=1.4, enclosure [2,2]');

  const starved = CEN.certify({ a, b, p: 8, _opts: { maxBoxes: 50 } });
  ok(starved.verdict === 'REFUSED',
    'census family: a starved box budget REFUSES — it can never return a wrong count');

  /* cross-instrument: every period-7 orbit Krawczyk certified from float
     starts must be one of the census's records, and the census count (4
     orbits, matching Galias) must dominate the orbit family's lower bound */
  const c7 = census(a, b, 7);
  const found = new Set();
  for (let i = 0; ; i++) {
    const o = HEN.enumerate(i); if (!o) break;
    if (o.a !== a || o.p !== 7) continue;
    if (!HEN.interesting(o, HEN.value(o))) continue;
    const c = HEN.certify(o);
    if (c.verdict !== 'HIT') continue;
    found.add(HEN.key(o));
    const matched = c7.ok && c7.records.some(r => c.extra.orbit.every((x, n) => Math.abs(x - r.z[n]) < 1e-8));
    ok(matched, 'orbit-family period-7 hit is a census record (' + HEN.key(o).slice(0, 24) + '…)');
  }
  ok(c7.ok && c7.byMinimalPeriod['7'] === 4 && found.size <= 4,
    'census p=7: EXACTLY 4 orbits (Galias count); the orbit family reached ' + found.size + ' — a lower bound, as documented');
}

console.log('');
console.log('engine battery: ' + pass + ' pass, ' + fail + ' fail');
if (fail) process.exit(1);
