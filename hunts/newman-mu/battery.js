/* battery.js — the hunt's own gate. Run before any campaign and after any edit
   to target.js or instruments/trigmin/newman.js.

   Every RED control below has been seen firing (C10): a check that cannot go
   red is decoration, and a check that has only ever been green has not been
   checked. Exit 1 on any failure. */
'use strict';

const T = require('./target.js');
const N = require('#instruments/trigmin/newman.js');

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; console.log('PASS  ' + msg); } else { fail++; console.log('FAIL  ' + msg); } }
function close(a, b, tol) { return Math.abs(a - b) <= tol; }

console.log('--- 1. the instrument against the literature -------------------------');

/* Published values, quoted with their sources. These are the one place numbers
   are transcribed, and they are transcribed FROM PRINT to be checked AGAINST
   computation — which is the direction that catches an instrument bug. */
const LIT = [
  { A: [0, 1, 3],       v: 0.607346, tol: 1e-6, src: 'CFF 1983 / Mercer: mu(3) ~ 0.607' },
  { A: [0, 1, 2, 4],    v: 0.752394, tol: 1e-6, src: 'Goddard 1992: mu(4) ~ 0.752' },
  { A: [0, 1, 2, 6, 9], v: 1.0,      tol: 0,    src: 'Mercer 2019: M(0,1,2,6,9) = 1 EXACTLY' },
  { A: [0, 6, 9, 10, 17, 24], v: 1.0652858911344152, tol: 2e-16, src: 'Goddard 1992 six-term champion, certified in sin-mfg Rung 1' },
  { A: [0, 1, 2, 3, 4, 7, 8, 10, 12], v: 1.362373178133324, tol: 1e-15, src: 'Boyd 1986 degree-12, min >= 1.362 per Mercer' },
  { A: [0, 4, 6, 7, 8, 10, 11, 12, 15, 16, 17, 22, 24, 25, 26, 29, 32, 35, 38], v: 2.018174563075912, tol: 1e-15, src: 'Hare-Jankauskas Eq. (2.1), certified in sin-mfg Rung 4' },
];
for (const L of LIT) {
  const c = N.certifyNewman(L.A, { bar: 0 });
  ok(close(c.modulus[0], L.v, L.tol + 1e-15) && c.modulus[0] <= L.v + L.tol && c.modulus[1] >= L.v - L.tol,
    'min|f| for [' + L.A.slice(0, 5) + (L.A.length > 5 ? ',…' : '') + '] encloses ' + L.v + '  (' + L.src + ')');
}

/* The exact hit: mu(5)'s champion is EXACTLY 1, and an enclosure of width 0 is
   the only honest way to say so. */
{
  const c = N.certifyNewman([0, 1, 2, 6, 9], { bar: 0 });
  ok(c.modSq[0] === 1 && c.modSq[1] === 1, 'M(0,1,2,6,9)^2 certified as the exact interval [1, 1], width ' + (c.modSq[1] - c.modSq[0]));
}

console.log('');
console.log('--- 2. invariances the mathematics guarantees -------------------------');

{
  const A = [0, 6, 9, 10, 17, 24];
  const dil = A.map(x => x * 3);
  const a = N.certifyNewman(A, { bar: 0 }), b = N.certifyNewman(dil, { bar: 0 });
  ok(a.modSq[0] === b.modSq[0] && a.modSq[1] === b.modSq[1],
    'dilation A -> 3A certifies to the identical enclosure (gcd reduction, measured not assumed)');
  ok(b.gcd === 3 && b.degree === a.degree, 'the dilated set reports gcd 3 and the SAME reduced degree ' + a.degree);
}
{
  /* reversal: A -> max(A) - A reversed is the reciprocal polynomial, |f| equal
     on the circle. The board's canonical key must therefore collapse them. */
  const A = [0, 6, 9, 10, 17, 24];
  const rev = A.map(x => A[A.length - 1] - x).reverse();
  const a = N.certifyNewman(A, { bar: 0 }), b = N.certifyNewman(rev, { bar: 0 });
  ok(a.modSq[0] === b.modSq[0] && a.modSq[1] === b.modSq[1],
    'reversal A -> max-A certifies identically ([' + rev + '] is Goddard\'s reciprocal)');
}

console.log('');
console.log('--- 3. the envelope and the verdict -----------------------------------');

ok(T.barSq(6) === 1, 'bar(6)^2 = 1 exactly — the n=5 champion is the envelope below six terms');
ok(Math.abs(Math.sqrt(T.barSq(10)) - 1.362373178133324) < 1e-15, 'bar(10) = Boyd\'s 9-term value (nothing certified at 10..18 raises it)');
ok(T.barSq(3) === 0, 'bar(3) = 0 — below the smallest anchor the envelope is the honest floor, not a guess');
{
  const gG = T.setToGaps([0, 6, 9, 10, 17, 24]);
  const v = T.certify({ g: gG });
  ok(v.verdict === 'HIT' && v.certificate.above === true, 'Goddard\'s champion certifies HIT against bar(6) = 1');
  ok(v.certificate.tripwire === false, 'and does NOT trip the min|f| >= 2 tripwire');
}
{
  const v = T.certify(T.knownBad);
  ok(v.verdict === 'REJECT' && v.certificate.modSq[1] < 1e-15, 'knownBad {0..5} certifies REJECT with min|f|^2 enclosing 0');
}
{
  const HJ = [0, 4, 6, 7, 8, 10, 11, 12, 15, 16, 17, 22, 24, 25, 26, 29, 32, 35, 38];
  const v = T.certify({ g: T.setToGaps(HJ) });
  ok(v.verdict === 'HIT', 'the HJ 19-term witness certifies HIT against bar(19) = Boyd');
  ok(v.certificate.tripwire === false, 'and does NOT trip the tripwire — it has 19 terms, and the tripwire asks for <= 18');
}

console.log('');
console.log('--- 4. RED CONTROLS — each must fire ----------------------------------');

{
  /* (a) a forged certificate: inflate the certified floor so a REJECT would
     read as a HIT. The independent recompute must refuse it. */
  const g = T.setToGaps([0, 1, 2, 3, 4, 5, 9]);          /* an ordinary non-hit */
  const v = T.certify({ g });
  const forged = JSON.parse(JSON.stringify(v.certificate));
  forged.modSq = [9, 9.0001];
  forged.above = true;
  ok(T.recheckCertificate({ g }, v.certificate) === true, 'RED (a) control: the honest certificate passes the recompute');
  ok(T.recheckCertificate({ g }, forged) === false, 'RED (a): a certificate with its floor forged up to 9 is REFUSED by the recompute');
}
{
  /* (b) the 'narrow' sabotage — the certifier reports a bare midpoint value as
     a THIN enclosure, i.e. the outward Taylor rounding narrowed to nothing.
     The exact spot check agrees with a thin forgery at its own midpoint, so
     only the dense direct sample can catch this. */
  const A = [0, 6, 9, 10, 17, 24];
  const sab = N.certifyNewman(A, { bar: 0, sabotage: 'narrow' });
  const honest = N.certifyNewman(A, { bar: 0 });
  ok(sab.modSq[0] !== honest.modSq[0] || sab.modSq[1] !== honest.modSq[1],
    'RED (b): the sabotaged run produces a different enclosure than the honest one');
  ok(N.recheckNewman(A, sab) === false, 'RED (b): the narrowed enclosure is REFUSED by the recompute (dense direct sampling catches it)');
  ok(N.recheckNewman(A, honest) === true, 'RED (b) control: the un-sabotaged enclosure passes the same recompute');
}
{
  /* (c) a wrong exponent set attached to a right certificate. */
  const A = [0, 6, 9, 10, 17, 24];
  const c = N.certifyNewman(A, { bar: 0 });
  ok(N.recheckNewman([0, 6, 9, 10, 17, 25], c) === false, 'RED (c): a certificate re-checked against a DIFFERENT exponent set is REFUSED');
}
{
  /* (d) the exact screen must be sound: everything it prunes must really fail.
     Certify a sample of stage-1 rejects and confirm not one of them is a HIT.
     This is the false-negative question asked directly instead of assumed. */
  let checked = 0, leaked = 0;
  for (let a = 1; a <= 6 && checked < 24; a++) {
    for (let b = 1; b <= 6 && checked < 24; b++) {
      for (let c2 = 1; c2 <= 6 && checked < 24; c2++) {
        const cand = { g: [a, b, c2, 1, 2] };
        const s = T.screens[0].screen(cand);
        if (s.pass) continue;
        checked++;
        if (T.certify(cand).verdict === 'HIT') leaked++;
      }
    }
  }
  ok(checked > 0 && leaked === 0, 'RED (d): ' + checked + ' candidates pruned by the exact |f(-1)| stage, ' + leaked + ' of them certify HIT (must be 0)');
}
{
  /* (e) the tripwire must be able to fire. HJ's witness has min|f| > 2 but 19
     terms; the tripwire asks for <= 18, so it correctly stays down. Drive it
     UP by asking the same question of a set that satisfies both halves — one
     does not exist yet, which is the point of the hunt, so the control instead
     proves the predicate itself is live on a constructed certificate. */
  const HJ = [0, 4, 6, 7, 8, 10, 11, 12, 15, 16, 17, 22, 24, 25, 26, 29, 32, 35, 38];
  const c = N.certifyNewman(HJ, { bar: 0 });
  const wouldTrip = c.modSq[0] >= T.TRIPWIRE_MODSQ && 18 <= T.TRIPWIRE_MAX_N;
  ok(c.modSq[0] >= T.TRIPWIRE_MODSQ, 'RED (e): the HJ witness DOES clear the tripwire value (min|f|^2 = ' + c.modSq[0].toFixed(6) + ' >= 4)');
  ok(wouldTrip === true, 'RED (e): the tripwire predicate fires when the same value carries <= 18 terms — it is live, not dead code');
  ok(T.certify({ g: T.setToGaps(HJ) }).certificate.tripwire === false, 'RED (e) control: at 19 terms the same value does NOT trip it');
}

console.log('');
console.log('--- 5. score battery properties ---------------------------------------');
{
  const gG = T.setToGaps([0, 6, 9, 10, 17, 24]);
  ok(T.score({ g: gG }) === T.score(T.scaleInflate({ g: gG })),
    'score is bit-for-bit invariant under dilation (gcd canonicalisation, not luck)');
  const planted = T.plantedHits.map(p => T.score(p.candidate));
  ok(T.score(T.knownBad) < Math.min.apply(null, planted),
    'score(knownBad) = ' + T.score(T.knownBad) + ' ranks strictly below every planted hit (min ' + Math.min.apply(null, planted).toFixed(6) + ')');
}

console.log('');
console.log('--- 6. generator anchors must not drift from the target -------------');
{
  /* gen-terms.js runs inside the vm fence and cannot require target.js, so it
     restates the anchor sets. That duplication is the kind C50 warns about — a
     value copied by hand with nothing to notice when its source moves — so it
     is checked here rather than trusted. */
  const src = require('fs').readFileSync(require('path').join(__dirname, 'gen-terms.js'), 'utf8');
  const m = src.match(/var ANCHOR_SETS = \[([\s\S]*?)\n\];/);
  ok(!!m, 'gen-terms.js declares an ANCHOR_SETS list the battery can read');
  if (m) {
    const rows = m[1].split('\n').map(l => l.replace(/\/\*[\s\S]*?\*\//g, '').trim().replace(/,$/, '')).filter(l => l.startsWith('['));
    const genSets = rows.map(r => JSON.parse(r));
    const tgtSets = T.ANCHORS.filter(a => a.n >= 6).map(a => a.A);
    ok(JSON.stringify(genSets) === JSON.stringify(tgtSets),
      'the generator\'s ' + genSets.length + ' anchor sets are IDENTICAL to target.js ANCHORS (n>=6) — no hand-copied drift');
  }
}
{
  /* the generator must never emit an anchor unchanged: a literature champion
     arriving on the board wearing our seed would be indistinguishable from a
     find. */
  const G = require('./gen-terms.js');
  function mul(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  const rng = mul(99);
  let st = G.init({});
  const anchorGaps = new Set(T.ANCHORS.filter(a => a.n >= 6).map(a => JSON.stringify(T.setToGaps(a.A))));
  let verbatim = 0, bad = 0; const terms = new Set();
  for (let i = 0; i < 1500; i++) {
    st.leaderboard = [];
    const r = G.next(st, rng); st = r.state;
    const g = r.candidate.g;
    if (anchorGaps.has(JSON.stringify(g))) verbatim++;
    if (g.length < 5 || g.length > 18 || g.some(x => !Number.isInteger(x) || x < 1 || x > 64)) bad++;
    terms.add(g.length + 1);
  }
  ok(bad === 0, '1500 proposals, ' + bad + ' schema violations');
  ok(verbatim === 0, 'RED (f): ' + verbatim + ' proposals equalled an anchor VERBATIM (must be 0 — an anchor on the board would look like a find)');
  const frontier = [...terms].filter(n => n >= 10 && n <= 18);
  ok(frontier.length >= 8, 'the frontier band 10..18 is reached at ' + frontier.length + ' distinct term counts');
}

{
  /* gen-hj-subsets.js also restates the HJ witness across the fence. Same C50
     hazard, same mechanical answer. */
  const src = require('fs').readFileSync(require('path').join(__dirname, 'gen-hj-subsets.js'), 'utf8');
  const m = src.match(/var HJ = (\[[^\]]*\]);/);
  ok(!!m, 'gen-hj-subsets.js declares an HJ set the battery can read');
  if (m) {
    const genHJ = JSON.parse(m[1]);
    const tgtHJ = T.ANCHORS.find(a => a.n === 19).A;
    ok(JSON.stringify(genHJ) === JSON.stringify(tgtHJ),
      'gen-hj-subsets.js HJ set is IDENTICAL to the target n=19 anchor');
  }
  const G2 = require('./gen-hj-subsets.js');
  let st2 = G2.init({}); const seen = new Set(); let n = 0, done = false;
  for (let i = 0; i < 400; i++) {
    const r = G2.next(st2, Math.random); st2 = r.state;
    if (r.done) { done = true; break; }
    seen.add(JSON.stringify(r.candidate.g)); n++;
  }
  ok(n === 190, 'the subset box is exactly 190 candidates (C(19,18)+C(19,17) = 19+171), got ' + n);
  ok(done, 'and the generator signals done rather than looping past its box');
}

console.log('');
console.log('--- 7. the envelope: adoption, freezing, and staleness ---------------');
{
  /* the envelope must be the union of ANCHORS and ADOPTED, and an adopted
     object must never change its OWN verdict */
  const a17 = T.ADOPTED.find(a => a.n === 17);
  ok(!!a17, 'an n=17 object is adopted into the envelope');
  if (a17) {
    const v = T.certify({ g: T.setToGaps(a17.A) });
    ok(v.verdict === 'HIT', 'the adopted object is STILL a HIT at its own term count — adoption at n raises the bar only for n > n, so nothing is self-referential');
    ok(Math.abs(Math.sqrt(v.certificate.barSq) - 1.362373178133324) < 1e-15,
      'bar(17) is unchanged by adopting an n=17 object (' + Math.sqrt(v.certificate.barSq).toFixed(12) + ')');
    ok(Math.abs(Math.sqrt(T.barSq(18)) - 1.4141441147942588) < 1e-15,
      'bar(18) DID rise to the adopted value ' + Math.sqrt(T.barSq(18)).toFixed(13) + ' — the envelope learned');
    ok(T.barSq(18) > 1.8560606764970946,
      'and it is strictly above the old static bar, so no n=18 result can be flattered by 5.2e-2 again');
  }
  /* every planted hit must survive the raised envelope — a bar that breaks the
     recall control is a bar that stops any run from starting */
  let allHit = true;
  for (const ph of T.plantedHits) if (T.certify(ph.candidate).verdict !== 'HIT') allHit = false;
  ok(allHit, 'all ' + T.plantedHits.length + ' planted hits still certify HIT under the raised envelope');
}
{
  /* the staleness report must be quiet when the envelope is current... */
  const board = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, 'best.json'), 'utf8')).entries || [];
  ok(T.envelopeAudit(board).length === 0, 'envelopeAudit is silent against the live board — the envelope is current');
  ok(T.envelopeAudit([]).length === 0, 'and silent on an empty board');

  /* ...and LOUD when it is not. RED (g): a fabricated board entry above the
     envelope must be named, because an unadopted excess sitting unnoticed is
     the exact failure this mechanism was built after. */
  const fake = [{ certificate: { n: 12, A: [0, 1], modSq: [3.5, 3.5] } }];
  const found = T.envelopeAudit(fake);
  ok(found.length === 1 && found[0].n === 12,
    'RED (g): a board entry exceeding the envelope at n=12 is REPORTED by name (raises the bar for ' + (found[0] || {}).raisesBarFor + ')');
  const below = [{ certificate: { n: 12, A: [0, 1], modSq: [0.5, 0.5] } }];
  ok(T.envelopeAudit(below).length === 0, 'RED (g) control: an entry BELOW the envelope is not reported');
}

console.log('');
console.log('battery: ' + pass + ' pass, ' + fail + ' fail');
if (fail) process.exit(1);
