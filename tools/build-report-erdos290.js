#!/usr/bin/env node
/* build-report-erdos290.js — generate reports/erdos290.html: the engine rebuild
   of the cited Erdős #290 page (the 4k(k+1) discriminant theorem + the
   certified bracket for c), with this repository's tail extension folded in.

   Nothing on the page is remembered:
     - theorem.js (lifted, byte-identical to the cited page's) is RE-RUN in a
       scratch copy; the build dies unless every check passes and every
       planted falsifier fires;
     - narrowing.js is re-run the same way and its output must reproduce the
       lifted narrowing.json BYTE-IDENTICALLY (the cross-check of the whole
       enclosure pipeline);
     - the bracket is re-assembled here in exact rationals from the lifted
       kernel and CALIBRATED against the reproduced K=60 point (die on any
       digit); the extension deltas (certs/erdos290-tail-ext.json, produced
       by the same lifted squeeze instrument) then tighten it;
     - the conditional 34-digit enclosure is re-derived from kernel.js and
       compared against the record.

   The cited page is byte-preserved in legacy/ (repository provenance);
   every historical citation path 301s here.

   usage: node tools/build-report-erdos290.js */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const os = require('os');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const LEG = path.join(ROOT, 'legacy', 'research', 'challenges', 'erdos290');
const K = require(path.join(LEG, 'kernel.js'));
const Q = require(path.join(LEG, 'rational.js'));
const TAIL = require(path.join(ROOT, 'machine', 'erdos290', 'tail.js'));

const sh = (c, cwd) => cp.execSync(c, { cwd: cwd || ROOT, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
const die = (m) => { console.error('ERDOS290 REPORT REFUSED: ' + m); process.exit(1); };
/* WARRANT v2.2 (design/WARRANT.md), 2026-10-28: every number on this page is exact rational arithmetic unless it is
   marked; the squeeze's line between exact knots is a picture of them (CHOSEN, dotted); the headline names what it rests
   on, each premise graded from what this build actually ran (rule 11). A printed end of a bracket moves OUTWARD
   (design/outward.js, the kernel's floor/ceil): until this pass the stat strip printed both brackets' LOWER ends at nine
   decimals rounded up (0.829113768 for 0.829113767875, 0.830416408 for 0.830416407911). */
const WR = require(path.join(ROOT, 'playground', 'warrant.js'));
const OUT = require(path.join(ROOT, 'design', 'outward.js'));

/* ---- 0 · the sources the page's framing rests on, re-hashed --------------
   corpus/sources/erdos290 (PINS.json): the abstract of arXiv:2609.00104, a note
   pinning both van Doorn PDFs by sha256 with the lines the page leans on
   (Theorem 1 of 2609.00104; the proof of Lemma 32 of 2411.03073), and the
   #164 thread. The page says "no assumption about the tail; the Lemma 32
   computation taken as given" — the build refuses unless the pinned bytes
   still say both halves of that. */
const SRCDIR = path.join(ROOT, 'corpus', 'sources');
const PINS = JSON.parse(fs.readFileSync(path.join(SRCDIR, 'PINS.json'), 'utf8'));
const pinnedSrc = (rel) => {
  const want = PINS[rel]; if (!want) die('no pin for corpus/sources/' + rel);
  const b = fs.readFileSync(path.join(SRCDIR, rel));
  if (crypto.createHash('sha256').update(b).digest('hex') !== want) die('corpus/sources/' + rel + ' does not hash to its pin');
  return b.toString('utf8');
};
const SRC_ABS = 'erdos290/arxiv-2609.00104-abs_2026-10-06.html';
const ABS = pinnedSrc(SRC_ABS);
if (!ABS.includes('The shortest harmonic sums with decreasing denominator') || !ABS.includes('Here we find its exact value.'))
  die('the pinned abstract of arXiv:2609.00104 no longer says what the page cites it for');
pinnedSrc('erdos290/arxiv-2411.03073-abs_2026-10-06.html');
const PAPERS = pinnedSrc('erdos290/arxiv-papers-pin.txt');
for (const needle of ['Theorem 1. We have liminf_{a→∞} (b(a) − a)/log a = 1/(1+c).', 'G_d is isomorphic to S_l^+ for all', 'even d ≤ 60, except for d = 8, 24, 48.'])
  if (!PAPERS.includes(needle)) die('the papers pin no longer quotes: ' + needle);
const THREAD = JSON.parse(pinnedSrc('erdos290/teorth-erdosproblems-164-comments_2026-10-06.json'));
if (!THREAD.some((c) => c.user.login === 'Woett' && c.body.includes('proves that the liminf is actually equal to 1/(1+c)')))
  die('the pinned #164 thread no longer holds Woett\'s comment on arXiv:2609.00104');
if (!THREAD.some((c) => c.created_at.startsWith('2026-08-04') && c.body.replace(/\s+/g, ' ').includes('takes Lemma 32\'s Magma determination that G_d = S_l^+ for even d <= 60 outside {8, 24, 48} as given')))
  die('the pinned #164 thread no longer holds our 2026-08-04 statement of the Lemma 32 dependency');
/* the one input the bracket takes as given, in the words the page uses for it everywhere */
const LEMMA32 = 'the Magma computation in the proof of van Doorn\'s Lemma 32 (arXiv:2411.03073: G_d ≅ S_l⁺ for every even d ≤ 60 except 8, 24, 48)';
const gitrev = (() => { try { return sh('git rev-parse --short HEAD').trim(); } catch (e) { return 'unknown'; } })();

/* ---- 1 · the theorem, re-proved in a scratch copy ------------------------- */
const SCR = fs.mkdtempSync(path.join(os.tmpdir(), 'erdos290-build-'));
fs.cpSync(LEG, SCR, { recursive: true });
let theoremOut;
const theoremT0 = Date.now();
try { theoremOut = sh('node theorem.js', SCR); } catch (e) { die('theorem.js failed:\n' + (e.stdout || e.message)); }
const theoremSecs = Math.round((Date.now() - theoremT0) / 1000);   /* timed, not remembered */
if (!/ALL PASS/.test(theoremOut)) die('theorem.js did not reach ALL PASS');
const falsifiers = (theoremOut.match(/ok\s+FALSIFIER/g) || []).length;
if (falsifiers < 3) die('expected the planted falsifiers to fire, saw ' + falsifiers);
/* how far theorem.js checks the proof's lines as exact integer identities, read off its own output (§1's premise) */
const thmEvenMax = Number((/at every even d <= (\d+)/.exec(theoremOut) || die('theorem.js no longer says up to which even d it checks the lines'))[1]);

/* ---- 1b · the closed-form class sums, gated against the enumeration ---------
   The page's mechanism line says the closed forms replace an enumeration; the battery that checks them is RUN here
   (0.5 s), so "checked equal for every l <= 12" is this build's fact and not a remembered one. Until 2026-10-28 the line
   said "proved equal to it on every degree both can reach", which the battery does not check: it checks l <= 12. */
let lbat = ''; try { lbat = sh('node tools/erdos290-lean-battery.js'); } catch (e) { die('tools/erdos290-lean-battery.js did not pass:\n' + (e.stdout || e.message)); }
const lbm = /(\d+) pass, 0 fail/.exec(lbat), lbEnum = /closed form == enumerated, all five candidates, l = 1\.\.(\d+) \(exact rationals\)/.exec(lbat);
if (!lbm || !lbEnum || !/^ok\s+RED: the broken signed EGF/m.test(lbat)) die('the closed-form battery did not pass whole, or no longer checks against the enumeration');
const enumMax = Number(lbEnum[1]);
/* p(87), the partition count of the enumeration the closed forms replaced (tools/galois-exceptions-lean.js: the array that
   ran out of heap), by Euler's pentagonal recurrence in BigInt */
const P87 = (() => { const p = [1n]; for (let n = 1; n <= 87; n++) { let s = 0n; for (let k = 1; ; k++) { const g1 = k * (3 * k - 1) / 2, g2 = k * (3 * k + 1) / 2; if (g1 > n) break; const sg = (k % 2) ? 1n : -1n; s += sg * p[n - g1]; if (g2 <= n) s += sg * p[n - g2]; } p.push(s); } return p[87]; })();
if (P87 !== 38887673n) die('p(87) is not 38,887,673');

/* ---- 2 · the narrowing record, reproduced byte-identically ---------------- */
try { sh('node narrowing.js', SCR); } catch (e) { die('narrowing.js failed:\n' + (e.stdout || e.message)); }
const reproduced = fs.readFileSync(path.join(SCR, 'narrowing.json'));
const lifted = fs.readFileSync(path.join(LEG, 'narrowing.json'));
if (!reproduced.equals(lifted)) die('narrowing.json did not reproduce byte-identically');
const NARROW = JSON.parse(lifted.toString());
fs.rmSync(SCR, { recursive: true, force: true });

/* ---- 3 · the bracket, re-assembled exactly, calibrated, then extended ----- */
const R = Q.R, add = Q.add, sub = Q.sub, mul = Q.mul, div = Q.div;
const ZERO = R(0n, 1n), ONE = R(1n, 1n);
const W = (l) => R(1n, BigInt(2 * l) * BigInt(2 * l + 1));
const EXC = new Set([4, 12, 24]);
/* ln 2 enclosure and base terms — the same arithmetic narrowing.js hoists */
const L2 = (() => { /* 2 sum 1/(m 3^m), m odd — kernel/narrowing's series */
  let s = ZERO;
  for (let k = 0; k < 40; k++) { const m = 2 * k + 1; s = add(s, R(2n, BigInt(m) * 3n ** BigInt(m))); }
  const m = 81;
  return { lo: s, hi: add(s, mul(R(2n, BigInt(m) * 3n ** BigInt(m)), R(9n, 8n))) };
})();
const EXACT = new Map(K.EXACT_DELTAS);
for (const [l, v] of Object.entries(JSON.parse(fs.readFileSync(path.join(LEG, 'tail-deltas.json'), 'utf8')).deltas))
  EXACT.set(Number(l), R(BigInt(v.n), BigInt(v.d)));
const EXT = fs.existsSync(path.join(ROOT, 'certs', 'erdos290-tail-ext.json'))
  ? JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'erdos290-tail-ext.json'), 'utf8')) : { deltas: {}, open: [] };
for (const [l, v] of Object.entries(EXT.deltas)) EXACT.set(Number(l), R(BigInt(v.n), BigInt(v.d)));
const extLs = Object.keys(EXT.deltas).map(Number).sort((a, b) => a - b);
const Lmax = extLs.length ? extLs[extLs.length - 1] : 60;

/* ---- what the RECORDS say, read at build — never a remembered literal ------
   The cited page's own horizon comes out of the narrowing record that this build
   has just reproduced byte-identically, so every "the cited page stops here" on
   the page is that record talking, not a number typed once and left behind. */
const P60 = NARROW.points[NARROW.points.length - 1];
const citedL = P60.K, citedD = P60.d;
if (!(citedL > 0 && citedD === 2 * citedL)) die('the narrowing record\'s last point is not a (K, d = 2K) horizon');

/* The extension is a HORIZON only where it is contiguous: a hole below the last
   closed degree still costs its full weight, so "pinned through l = X" must stop
   at the first gap. Measured, so a mid-campaign merge can never overstate it. */
const Lpin = (() => { let L = citedL; while (EXT.deltas[L + 1]) L++; return L; })();
const extAbovePin = extLs.filter((l) => l > Lpin).length;

/* Exceptional degrees are d = 4k(k+1) ⇔ l = 2k(k+1) — enumerated from the law of
   §1, never listed by hand, and split by which record closes each one. */
const excAll = [];
for (let k = 1; 2 * k * (k + 1) <= Lmax; k++) excAll.push({ k, l: 2 * k * (k + 1), d: 4 * k * (k + 1) });
const excCited = excAll.filter((e) => e.l <= citedL).map((e) => e.d);
const excExt = excAll.filter((e) => e.l > citedL);
const excClosed = excExt.filter((e) => EXT.deltas[e.l]);
const excStillOpen = excExt.filter((e) => !EXT.deltas[e.l]);
const excNames = [...new Set(excClosed.map((e) => EXT.deltas[e.l].name))];
const excDList = (xs) => xs.map((e) => e.d + ' (k = ' + e.k + ')').join(', ');
const andList = (xs) => (xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1]);

/* The squeeze's own run parameters, parsed out of the record's method string. */
const extPrimes = (String(EXT.method || '').match(/nPrimes[:= ]\s*(\d+)/) || [])[1] || null;

/* THE BRACKET NOW LIVES IN ONE PLACE: machine/erdos290/tail.js. It was
   inline here, and the moment a second consumer needed it — the lemma-value
   tool, which re-assembles the same bracket under hypothetical constraints —
   an inline copy would have become the third rule in this repository to be
   written twice and diverge. Called with no constraint it charges every
   undetermined degree the full δ ∈ [0,1], exactly as this function always
   did; the calibration gate below re-assembles the CITED horizon and refuses
   unless it reproduces the published record to every displayed digit, so a
   faithless extraction fails this build rather than shipping. */
const bracket = TAIL.makeBracket({ Q, K, L2, EXACT, EXC, W });
const dec = (a, kd, up) => { const sc = 10n ** BigInt(kd);
  let q = a.n * sc / a.d; if (up && a.n * sc % a.d !== 0n) q += 1n; return Number(q) / Number(sc); };

/* calibration: with the extension IGNORED, this assembly must reproduce the
   record's own last point (K = citedL) to every displayed digit */
{
  const saveExt = extLs.map((l) => [l, EXACT.get(l)]);
  for (const l of extLs) EXACT.delete(l);
  const b60 = bracket(citedL);
  if (dec(b60.lo, 12, false) !== P60.lo || dec(b60.hi, 12, true) !== P60.hi) {
    die('bracket assembly does not reproduce the K=' + citedL + ' record point: [' + dec(b60.lo, 12, false) + ', ' + dec(b60.hi, 12, true) + '] vs [' + P60.lo + ', ' + P60.hi + ']');
  }
  for (const [l, v] of saveExt) EXACT.set(l, v);
}
const B60 = { lo: P60.lo, hi: P60.hi, width: P60.width };
const BX = bracket(Lmax);
const bxLo = dec(BX.lo, 12, false), bxHi = dec(BX.hi, 12, true);
const bxWidth = Q.toDouble(sub(BX.hi, BX.lo));
/* the brackets at nine decimals, OUTWARD: the cited one from its record's twelve-decimal ends (themselves outward), this
   build's from the exact rationals; a width prints UP (the bracket is at most that wide) */
const b60_9 = '[' + OUT.down(P60.lo, 9) + ', ' + OUT.up(P60.hi, 9) + ']';
const bx_9 = '[' + K.decimals(BX.lo, 9, 'floor') + ', ' + K.decimals(BX.hi, 9, 'ceil') + ']';
const widthUp = (rat, d) => OUT.sci(K.decimals(rat, 40, 'ceil'), d, true);
const bxW2 = widthUp(sub(BX.hi, BX.lo), 2), bxW3 = widthUp(sub(BX.hi, BX.lo), 3);
/* "N% tighter" floors: the claim is that the bracket shrank by at least that much */
const tighterPct = (a, b) => Math.floor(100 * (1 - a / b)) + '%';

/* ---- 1/(1+c): the value the sequencing question actually asks for --------
   c is the object the sum defines; 1/(1+c) is what an OEIS entry would carry,
   and it is what the #290 issue asked for by name. It is derived HERE by exact
   rational division of the bracket's own endpoints — never by dividing the
   printed decimals — and 1/(1+x) is decreasing, so the endpoints swap.

   `agreed` counts the leading decimal digits the two endpoints SHARE. That is
   the honest meaning of "digits known with no tail assumption": digits both ends of a
   proved interval agree on cannot be moved by anything inside it. The count is
   computed, so the page cannot claim a digit the bracket does not hold. */
const invOf = (b) => ({ lo: div(ONE, add(ONE, b.hi)), hi: div(ONE, add(ONE, b.lo)) });
const agreedDigits = (lo, hi, kd) => {
  const a = dec(lo, kd, false).toFixed(kd), b = dec(hi, kd, true).toFixed(kd);
  let n = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) break;
    if (a[i] >= '0' && a[i] <= '9' && i > 1) n++;   /* skip the leading "0." */
  }
  return n;
};
const INV = invOf(BX);
const uncLo = dec(INV.lo, 12, false), uncHi = dec(INV.hi, 12, true);
const invAgreed = agreedDigits(INV.lo, INV.hi, 12);
/* the same quantity at the CITED horizon, so "was N digits, now M" is derived */
const INV60 = invOf({ lo: R(BigInt(Math.round(B60.lo * 1e12)), 10n ** 12n),
                      hi: R(BigInt(Math.round(B60.hi * 1e12)), 10n ** 12n) });
const inv60Agreed = agreedDigits(INV60.lo, INV60.hi, 12);
const invPrefix = uncLo.toFixed(12).slice(0, 2 + invAgreed);
if (invAgreed <= inv60Agreed) die('the extension did not add a digit to 1/(1+c) (no tail assumption) — '
  + 'the page\'s headline is derived from this comparison and must not be written when it is false');
if (bxWidth > B60.width + 1e-15) die('the extended bracket is wider than the recorded K=60 bracket — impossible');

/* ---- 1/(2c): the OTHER endpoint of van Doorn's Theorem 8 ------------------
   Theorem 8 is TWO-SIDED — 1/(1+c) ≤ liminf (b(a)−a)/log a ≤ 1/(2c), Lemma 31
   below and Lemma 30 above — and BOTH published constants, 0.54 and 0.61, are
   those two expressions at two decimals under Lemma 32's 0.82 < c < 0.85.
   Everything above sharpens the lower one. This sharpens the upper one, from
   the same record and at no extra cost: 1/(2c) DECREASES in c, so it is fed by
   the bracket's certified LOWER endpoint — and a lower endpoint charges the
   unpinned tail zero, so no tail lemma and no further degree enters it.
   Rounded OUTWARD (up), so the printed number is a valid upper bound. Derived
   at the cited horizon too, so "was, now" is computed rather than claimed. */
const TWO = R(2n, 1n);
const upperOf = (clo) => div(ONE, mul(TWO, clo));
const twoCHi = dec(upperOf(BX.lo), 12, true);
const twoC60Hi = dec(upperOf(R(BigInt(Math.round(B60.lo * 1e12)), 10n ** 12n)), 12, true);
/* van Doorn's published pair, QUOTED from Theorem 8 — never derived here. */
const VD = { lo: 0.54, hi: 0.61 };
if (!(twoCHi < VD.hi)) die('the derived upper endpoint 1/(2c) = ' + twoCHi + ' does not improve the published '
  + VD.hi + ' — the section claiming it must not be written when it is false');
if (!(uncLo > VD.lo)) die('the derived lower endpoint 1/(1+c) = ' + uncLo + ' does not improve the published ' + VD.lo);
const vdWidth = VD.hi - VD.lo, newWidth = twoCHi - uncLo;

/* ---- 4 · the conditional enclosure, re-derived ---------------------------- */
const CS = K.conditionalCStar(120, 80);
/* the published precision is the RECORD's, read off the record's own string */
const condDigits = NARROW.conditionalEnclosure34.lo.length - 2;
const cond34 = { lo: K.decimals(CS.lo, condDigits, 'floor'), hi: K.decimals(CS.hi, condDigits, 'ceil') };
if (cond34.lo !== NARROW.conditionalEnclosure34.lo || cond34.hi !== NARROW.conditionalEnclosure34.hi)
  die('conditional ' + condDigits + '-digit enclosure moved: ' + cond34.lo);
/* 1/(1+c) from the conditional enclosure, exact */
const inv = (x) => R(x.d, x.n);
const invLo = inv(add(ONE, CS.hi)), invHi = inv(add(ONE, CS.lo));
const inv18 = { lo: K.decimals(invLo, 18, 'floor'), hi: K.decimals(invHi, 18, 'ceil') };
/* the page prints inv18.lo with a trailing "…" as the value's leading digits: true only if both ends floor alike */
if (K.decimals(invHi, 18, 'floor') !== inv18.lo || cond34.lo.slice(0, 16) !== cond34.hi.slice(0, 16)) die('1/(1+c*) or c* no longer agrees across its enclosure in the digits the page prints');

/* WHICH degrees that enclosure assumes is read off the enclosure itself. Its entire
   width is the sum of the index-2 allowances 1/(2^l·l!) times their weights over the
   degrees it does NOT certify exactly, so the first assumed degree is the smallest l
   whose tail of allowances still fits inside the width. Detected, never remembered:
   this page asserted the assumption began at d = 122 while the lifted kernel begins
   it at the first degree IT cannot certify — a claim strictly stronger than the
   computation behind it, which is the one kind of error this repository must not make. */
const allowW = (l) => { let f = 1n; for (let i = 2; i <= l; i++) f *= BigInt(i);
  return mul(R(1n, 2n ** BigInt(l) * f), W(l)); };
const condFirstL = (() => {
  const wid = sub(CS.hi, CS.lo);
  let acc = ZERO;
  for (let l = 120; l >= 1; l--) {
    if (EXC.has(l)) continue;                             /* exceptional δ are exact: no width */
    const nxt = add(acc, allowW(l));
    if (Q.cmp(nxt, wid) > 0) return l + 1;
    acc = nxt;
  }
  return null;
})();
if (!(condFirstL > 1 && condFirstL <= 120))
  die('could not locate the conditional enclosure\'s first assumed degree from its width');
const condAllow = Q.toDouble(allowW(condFirstL));
/* how many decimals that width actually pins, whatever the record chooses to publish */
const condCap = Math.floor(-Math.log10(Q.toDouble(sub(CS.hi, CS.lo))));
const condExactD = [...new Map(K.EXACT_DELTAS).keys()].sort((a, b) => a - b).map((l) => 2 * l);

/* ---- what the page types, gated (WARRANT rule 8) ----------------------------
   log 2's share of c, floored from BOTH ends of the bracket (the two floors must agree); the survivors §3 and §4 lean
   on; and which squeeze implementation closed which degrees, read off the runners themselves: the extension record's
   own method line names only the lifted file, while both runners require the lean fork (from l = 87, where the lifted
   enumeration ran out of heap) */
const log2Share = (() => {
  const lo = Math.floor(Q.toDouble(div(mul(R(100n, 1n), L2.lo), BX.hi))), hi = Math.floor(Q.toDouble(div(mul(R(100n, 1n), L2.hi), BX.lo)));
  if (lo !== hi) die('log 2\'s share of c is not one whole percent across the bracket: ' + lo + '..' + hi);
  return lo;
})();
const survivors = new Set(Object.values(EXT.deltas).map((v) => v.name));
if ([...survivors].some((n) => n !== 'B' && n !== 'ES0')) die('a closed degree survived as something other than S_l⁺ (B) or its even-weight subgroup (ES0): ' + [...survivors].join(', '));
const LEAN_FROM = 87;
const TAILD = JSON.parse(fs.readFileSync(path.join(LEG, 'tail-deltas.json'), 'utf8'));
const citedTailFrom = Math.min(...Object.keys(TAILD.deltas).map(Number));
if (!(Math.max(...Object.keys(TAILD.deltas).map(Number)) === citedL && TAILD.open.length === 0 && /five-candidate squeeze/.test(TAILD.method)
  && JSON.stringify(K.EXACT_DELTAS.map((x) => x[0])) === '[4,12,24]')) die('the cited page\'s squeezed degrees or exceptional densities moved — rewrite the premise chain');
for (const r of ['tools/run-erdos290-tail-ext.js', 'tools/run-erdos290-tail-shard.js'])
  if (!/require\(path\.join\(ROOT, 'tools', 'galois-exceptions-lean\.js'\)\)/.test(fs.readFileSync(path.join(ROOT, r), 'utf8'))) die(r + ' no longer runs the lean fork — rewrite §3\'s sentence on which squeeze closed which degree');
if (!/p\(87\) = 38\.9M did not/.test(fs.readFileSync(path.join(ROOT, 'tools', 'galois-exceptions-lean.js'), 'utf8'))) die('the lean fork no longer records that the lifted enumeration stopped at l = ' + (LEAN_FROM - 1));

/* WHAT THE HEADLINE RESTS ON (WARRANT v2.1, rule 11): each premise graded from what this build ran. A result read and
   not run here is assumed (2026-10-28: a reading gets no rung); the closed forms are verified, against an exact
   enumeration, by the battery this build runs. */
const PREMISES = C.pRaw('<b>What the headline rests on</b>, in the order the number travels through it; every step between these is exact rational arithmetic — the bracket re-assembled at this build, the squeeze\'s closed degrees read from their record:')
  + WR.premisesHtml([
    { grade: WR.ASSUMED, label: 'The Galois groups at every even d ≤ 60 but 8, 24 and 48', evidence: 'van Doorn\'s Lemma 32, a Magma computation (arXiv:2411.03073, pinned by sha256): cited, not re-run; this build re-certifies its irreducibility half, not its group half' },
    { grade: WR.ASSUMED, label: 'The reduction to five candidate groups, at each degree the squeeze closed (l = 12, 24 and ' + citedTailFrom + '..' + Lmax + ')', evidence: 'the group theory in galois-exceptions.js\'s header (the S_l-submodules of F₂^l, Jordan\'s theorem, Frobenius cycle types): read; every certificate it then asks for, a discriminant, a kernel vector, a p-cycle, was decided when its degree closed (the cited page\'s tail-deltas.json to l = ' + citedL + ', ' + C.m('certs/erdos290-tail-ext.json') + ' past it; not re-run here)' },
    { grade: WR.VERIFIED, label: 'The candidate densities from the cycle-index closed forms, used from l = ' + LEAN_FROM, evidence: 'checked equal to an independent enumeration for every l ≤ ' + enumMax + ' at this build (' + C.m('tools/erdos290-lean-battery.js') + ', ' + lbm[1] + ' checks, its broken-EGF red control fired)' },
    { grade: WR.ASSUMED, label: 'liminf (b(a) − a)/log a = 1/(1+c)', evidence: 'van Doorn\'s Theorem 1 (arXiv:2609.00104, pinned): read, not machine-checked; without it the bracket is a bracket for c alone' }
  ], { meetLine: 'The bracket is exact rational arithmetic over these premises; the weakest is <b>assumed</b>: two published results and one reduction are read here, and no machine here checked them.' });

/* ---- the page ------------------------------------------------------------- */
const O = [];

O.push(C.header({
  eyebrow: 'cert-machine · report · every number recomputed at build',
  title: 'A digit that was a guess is now a theorem',
  deck: 'Someone asked, in an open GitHub issue, what number to put in the OEIS for Erdős problem #290 — and '
    + 'guessed its third digit. That digit is now PROVED. The constant is ' + C.esc(invPrefix) + '…, with no '
    + 'assumption about the tail — the one input taken as given is ' + LEMMA32 + ' — where every previous horizon could pin only ' + C.esc(dec(INV60.lo, 12, false).toFixed(12).slice(0, 2 + inv60Agreed))
    + '…. It took closing ' + (Lmax - citedL) + ' consecutive degrees of a computation nobody had run past '
    + 'd = ' + citedD + '.'
}));

/* The tl;dr states the SAME three numbers §2b and §3 state, from the same variables —
   it used to carry its own literals ("a third", "l ≤ 90") and they had gone stale against
   the body of the page. A number that appears twice must be computed once. */
O.push(C.tldr({
  findingRaw: '<strong>1/(1+c) = ' + C.esc(invPrefix) + '…, with no assumption about the tail.</strong> Three digits of the '
    + 'constant an OEIS entry would carry, proved — not estimated, not sampled. The one input taken as given is '
    + C.esc(LEMMA32) + '; this build re-certifies its irreducibility half, not its group half. The previous horizon held only ' + C.esc(dec(INV60.lo, 12, false).toFixed(12).slice(0, 2 + inv60Agreed))
    + '…, so the third digit is new here, and it is the digit the #290 issue guessed. Underneath it: the '
    + '4k(k+1) square-discriminant law, every line of its proof checked as an exact integer identity at each even d ≤ ' + thmEvenMax + ' (<i>given the published composition law</i>, §1), the bracket for c tightened to width '
    + bxW2 + ' — ' + tighterPct(bxWidth, B60.width) + ' tighter than the cited page — and every '
    + 'even degree pinned exactly through l = ' + Lpin + ' (d = ' + 2 * Lpin + ')'
    + (excClosed.length
      ? ', the ' + excClosed.length + ' exceptional degrees past the cited horizon (d = ' + andList(excClosed.map((e) => String(e.d))) + ') among them.'
      : '.')
    + ' Since 2026-08-31 the liminf is a THEOREM, not an interval: van Doorn (<a href="https://arxiv.org/abs/2609.00104">arXiv:2609.00104</a>, Theorem 1) proved it equals '
    + '1/(1+c) exactly, so this bracket is now the certified numeric value of that constant rather than one end '
    + 'of a range — and the two-sided reading below (1/(2c) ≤ ' + OUT.up(twoCHi, 6) + ') is superseded, §3b. What the headline rests on, and how far each premise was checked, is listed in §2.',
  mechanismRaw: 'Closed-form Galois class sums from the cycle-index EGF replace an enumeration of every partition of l, '
    + (Number(P87) / 1e6).toFixed(1) + ' million objects at l = 87, where it ran out of memory; the two are checked equal exactly for every l ≤ ' + enumMax
    + ' at this build. Planted falsifiers must fire at every build.',
  checkRaw: C.m('node tools/erdos290-lean-battery.js') + ' — closed forms equal enumeration exactly for l ≤ ' + enumMax + ', '
    + 'the broken-EGF red control must fire (' + lbm[1] + ' checks, run at this build).'
}));

O.push(C.stats([
  { k: '1/(1+c), no tail assumption', v: C.esc(invPrefix) + '…', role: 'held', n: 'the liminf itself (arXiv:2609.00104, Theorem 1), proved with no assumption about the tail; ' + LEMMA32 + ' taken as given — [' + uncLo.toFixed(12) + ', ' + uncHi.toFixed(12) + '], derived by exact rational division of the bracket. ' + invAgreed + ' digits agreed, against ' + inv60Agreed + ' at the cited horizon' },
  { k: 'the 4k(k+1) law', v: 'RE-PROVED', role: 'held', n: 'every line of the proof an exact integer identity at each even d ≤ ' + thmEvenMax + ', given the published composition law (§1); ' + falsifiers + ' planted falsifiers fired during this build' },
  { k: 'cited bracket (K=' + citedL + ')', v: b60_9, sm: true, n: 'reproduced byte-identically from the lifted narrowing pipeline; printed outward' },
  { k: 'this build\'s bracket', v: bx_9, sm: true, role: 'held', n: 'width ' + bxW2 + ' — ' + tighterPct(bxWidth, B60.width) + ' tighter; densities pinned through l = ' + Lpin + '; printed outward' },
  { k: 'degrees pinned', v: 'l ≤ ' + Lpin, n: (extLs.length ? extLs.length + ' new degrees closed by the five-candidate squeeze (l = ' + (citedL + 1) + '..' + Lmax + ')' + (EXT.open.length ? '; ' + EXT.open.length + ' left honestly open' : ', none left open') : 'the cited page\'s horizon') },
  { k: 'exceptional degrees', v: excClosed.length + ' closed', role: excStillOpen.length ? null : 'held', n: (excClosed.length ? 'd = 4k(k+1) past the cited d ≤ ' + citedD + ': ' + excDList(excClosed) + (excStillOpen.length ? '; still open: ' + excDList(excStillOpen) : ' — every one in range') : 'none past the cited horizon yet') },
  { k: 'conditional c*', v: cond34.lo.slice(0, 16) + '…', sm: true, n: condDigits + ' certified digits under ONE labeled group-theory assumption — re-derived this build' },
  { k: '1/(1+c*)', v: inv18.lo.slice(0, 16) + '…', sm: true, n: 'the OEIS-shaped constant, exact rational division of the conditional enclosure' }
]));
/* the marks, said once (WARRANT rule 9); the legend sits beside the figure (§2b) */
O.push('<div class="col">' + C.note({ lab: 'how to read the marks', bodyRaw: C.pRaw('Every number on this page is exact rational arithmetic, and every printed end of an interval is rounded outward. '
  + 'The one mark is in §2b: a dotted line joins the squeeze\'s exact widths, because between two of them nothing was computed. '
  + 'Where a number rests on a published result read here, or on a hypothesis, the page says so in italic, and §2 and §4 list each premise with how far it was checked.') }) + '</div>');

O.push(C.section({
  lab: '§1 · the theorem', title: 'disc(f_d) is a square exactly at d = 4k(k+1)',
  bodyRaw: '<div class="col">'
    + C.pRaw('Take P(x) = ∏_{j=0}^{d}(x−j) and f_d = P′, degree d. For EVEN d = 2l, recentring at d/2 makes f_d '
      + 'even: f_d(x + l) = h(x²) for a degree-l polynomial h. Four exact facts finish it: '
      + 'h(0) = (−1)^l (l!)²; the published composition law disc(h(x²)) = (−1)^l 2^{2l} · lead(h) · h(0) · disc(h)² '
      + '(the non-monic composition law — Cullinan, <em>The discriminant of a composition</em>, which carries the leading coefficients explicitly; its hypotheses hold here since Res(h, x²) = h(0)² = (l!)⁴ ≠ 0); lead(f_d) = d+1; and '
      + 'disc(h) ≠ 0 by Rolle. Substituting:')
    + C.eq(C.esc('disc(f_d) = (d+1) · ( 2^l · l! · disc(h) )²'))
    + C.pRaw('so disc(f_d) is a perfect square exactly when d+1 is — that is, exactly at d = 4k(k+1). '
      + '(Odd d are out of scope and need to be: there d/2 is a rational root, δ = 1, and that is where the log 2 '
      + 'that carries ' + log2Share + '% of c comes from.) '
      + '<i>Given the published composition law</i>, cited and not machine-checked for every d, the build re-checks every line as an exact integer identity at each even d ≤ ' + thmEvenMax + ' and '
      + 'requires the planted falsifiers — an index-from-1 misdefinition, a dropped non-monic factor — to FAIL. '
      + 'Until 2026-08-03 the source lab stated this law as a conjecture with 24 controls; it is a theorem.')
    + '</div>'
}));

O.push(C.section({
  lab: '§2 · the enclosure', title: 'What the bracket for c is made of',
  bodyRaw: '<div class="col">'
    + C.pRaw('c = Σ_d δ(f_d)/(d(d+1)), where δ(f_d) is the density of primes p for which f_d has a root mod p. '
      + 'Odd d contribute exactly log 2 (proved). Each even d = 2l contributes δ · 1/(2l(2l+1)) with δ pinned '
      + 'EXACTLY where the Galois group is determined — hyperoctahedral at all even d ≤ ' + citedD + ' except '
      + '{' + excCited.join(', ') + '} (the exceptional d = 4k(k+1) in that range, each settled individually) — '
      + 'and the honest interval [0,1] everywhere else. '
      + 'Nothing is estimated: every pinned δ is an exact rational, every unpinned δ costs the full width of '
      + 'its weight, and the bracket can therefore only shrink as knowledge grows (the build asserts the '
      + 'recorded narrowing is monotone).')
    + C.pRaw('This build first REPRODUCES the cited page\'s pipeline byte-for-byte: the lifted narrowing program '
      + 'is re-run and must emit the identical record (it did: same bytes, sha-checked), landing on the cited '
      + '[' + B60.lo.toFixed(12).replace(/0+$/, '') + ', ' + B60.hi.toFixed(12).replace(/0+$/, '') + '] at knowledge horizon l = ' + citedL + '.')
    + PREMISES
    + '</div>'
}));

/* ---- the squeeze, drawn -------------------------------------------------
   The width of the certified bracket as knowledge advances one degree at a
   time. Every point is bracket(L) recomputed HERE in exact rationals, so the
   curve is the certificate's own history, not a sketch of it. */
const SQ_X0 = 20;
const SQUEEZE = (() => {
  /* the sampling step follows the horizon, so a campaign that keeps extending it cannot quietly turn this build into a
     long one. Each knot is a width decided in exact rationals; between knots nothing is computed (WARRANT: the line
     between two decided knots is a pick, drawn dotted), so knots are kept few enough to read as knots */
  const step = Math.max(10, 10 * Math.round((Lmax - SQ_X0) / 300));
  const pts = [];
  const at = (L) => { const b = bracket(L), wq = sub(b.hi, b.lo); return [L, Q.toDouble(wq), wq]; };
  for (let L = SQ_X0; L <= Lmax; L += step) pts.push(at(L));
  if (!pts.some((p) => p[0] === citedL)) die('the squeeze no longer samples the cited horizon l = ' + citedL);
  if (pts[pts.length - 1][0] !== Lmax) pts.push(at(Lmax));
  for (let i = 1; i < pts.length; i++) if (!(Q.cmp(pts[i][2], pts[i - 1][2]) < 0)) die('the certified width did not fall from l = ' + pts[i - 1][0] + ' to ' + pts[i][0]);
  return pts;
})();
{
  const K0 = SQUEEZE[0], K1 = SQUEEZE[SQUEEZE.length - 1], at60 = SQUEEZE.find((p) => p[0] === citedL);
  const w0 = K0[1], w1 = K1[1];
  const xt = [SQ_X0, citedL, Lmax];
  for (let i = 1; i <= 3; i++) xt.push(Math.round((citedL + (i / 4) * (Lmax - citedL)) / 10) * 10);
  const wTxt = (p) => widthUp(p[2], 2);
  /* drawn here rather than by charts.lines, which has no stroke for a pick: the knots are solid dots (decided), the
     line through them is WR.attrs(CHOSEN), and the cited page's horizon keeps its shaded band */
  const o = { w: 900, h: 300, x0: SQ_X0, x1: Lmax, y0: w1 * 0.75, y1: w0 * 1.15, logY: true, padB: 28 + 22,
    xTicks: [...new Set(xt)].filter((v) => v >= SQ_X0 && v <= Lmax).sort((a, b) => a - b).map(v => ({ v, t: String(v) })),
    yTicks: CH.decades(w1 * 0.75, w0 * 1.15, 6),
    xLabel: 'knowledge horizon  l  (densities pinned exactly for every even d = 2l up to here)',
    yLabel: 'certified width of c' };
  const f = CH.frame(o);
  const fig = [CH.open({ w: f.w, h: f.h, alt: 'The certified width of the constant c, one dot per sampled horizon, falls from ' + wTxt(K0) + ' at l = ' + SQ_X0 + ' to '
      + wTxt(K1) + ' at l = ' + Lmax + ' on a logarithmic scale; each dot is decided exactly, and a dotted line joins them. '
      + 'The region left of l = ' + citedL + ', where the cited page stops, is shaded.' }),
    CH.axes(f, o),
    '    <rect x="' + f.px(SQ_X0).toFixed(1) + '" y="' + f.T + '" width="' + (f.px(citedL) - f.px(SQ_X0)).toFixed(1) + '" height="' + f.ph + '" fill="var(--c-grid)"/>',
    /* the caption sits just right of the band, as charts.lines sets a caption that does not fit inside it */
    CH.txt(f.px(citedL) + 7, f.T + 13, '← the cited page stops here', 't-note', 'start'),
    '    <path d="' + SQUEEZE.map((p, i) => (i ? 'L' : 'M') + f.px(p[0]).toFixed(2) + ' ' + f.py(p[1]).toFixed(2)).join(' ') + '" ' + WR.attrs(WR.CHOSEN, { width: 2 }) + ' stroke-linejoin="round"/>']
    .concat(SQUEEZE.map((p) => '    <circle ' + CH.hit('cx="' + f.px(p[0]).toFixed(2) + '" cy="' + f.py(p[1]).toFixed(2) + '" r="3.5" fill="var(--c-1)" stroke="' + CH.SURFACE + '" stroke-width="1.5"',
      'l = ' + p[0], 'width ≤ ' + widthUp(p[2], 3) + ', exact') + '/>'))
    .concat([CH.txt(f.px(Lmax) - 10, f.py(w1) - 12, wTxt(K1), 't-lab', 'end'), CH.close]).join('\n');
  O.push(C.section({
    lab: '§2b · the squeeze', title: 'The interval, closing',
    wide: true,
    bodyRaw: '<div class="col">'
      + C.pRaw('Each pinned degree removes its own weight from the unknown tail, so the bracket can only '
        + 'shrink — and this is what that looks like when every point is recomputed in exact rationals at '
        + 'build time. Left of the shaded edge is the cited page\'s horizon; everything right of it is this '
        + 'repository running the same instrument further (§3 says which bytes ran where).')
      + '</div>'
      + C.figure({ svgRaw: fig, caption: 'Certified width of the bracket for c against the knowledge horizon l, '
        + 'log scale, every ' + (SQUEEZE[1][0] - SQUEEZE[0][0]) + ' degrees: each dot is a width decided in exact rationals at this build; the dotted line between dots is drawn, not decided. '
        + wTxt(K0) + ' at l = ' + SQ_X0 + ' · ' + wTxt(at60) + ' at the cited l = ' + citedL + ' · '
        + wTxt(K1) + ' at l = ' + Lmax + ', a factor of more than ' + Math.floor(w0 / w1) + ' across the sweep and '
        + tighterPct(w1, at60[1]) + ' tighter than the cited page. The dots fall smoothly because the width is the '
        + 'unpinned tail Σ 1/(2l(2l+1)) and nothing else: no estimate enters, so no point can move up.' })
      + '<div class="col">' + WR.legendHtml({ compact: true }) + '</div>'
  }));
}

O.push(C.section({
  lab: '§3 · the continuation', title: 'Past the horizon: l = ' + (citedL + 1) + '..' + Lmax + ', same instrument, tighter interval',
  bodyRaw: '<div class="col">'
    + C.pRaw('The entire remaining width at l = ' + citedL + ' is the unpinned tail Σ_{l>' + citedL + '} 1/(2l(2l+1)). '
      + 'This repository ran the cited page\'s own five-candidate squeeze — the lifted galois-exceptions.js, '
      + 'byte-identical through l = ' + (LEAN_FROM - 1) + ' and, from l = ' + LEAN_FROM + ' on, with its candidate densities replaced by the closed forms of the tl;dr (tools/galois-exceptions-lean.js: the lifted bytes otherwise, refused unless they hash to the lift)' + (extPrimes ? ', nPrimes = ' + extPrimes : '') + ', early exit — over '
      + (extLs.length ? 'l = ' + (citedL + 1) + '..' + Lmax : 'nothing yet') + '. '
      + (extLs.length
        ? extLs.length + ' degrees closed to a unique certified survivor' + (EXT.open.length ? '; ' + EXT.open.length + ' did not close and keep their honest [0,1]' : ' — none refused')
          + (extAbovePin ? '; the run is contiguous to l = ' + Lpin + ', with ' + extAbovePin + ' further degrees already closed above the first gap' : '')
          + '. Result:'
        : 'Run tools/run-erdos290-tail-ext.js to extend.'))
    + C.eq(C.esc('c ∈ [' + bxLo.toFixed(12) + ', ' + bxHi.toFixed(12) + ']   (width ≤ ' + bxW3 + ', ' + tighterPct(bxWidth, B60.width) + ' tighter than the cited page)'))
    + C.pRaw('Each closed degree also extends the evidence base of §4\'s assumption: every one is a new even '
      + 'degree at which the group is verified to be one of the two allowed candidates. The extension record '
      + 'is <a href="/certs/erdos290-tail-ext.json"><span class="m">certs/erdos290-tail-ext.json</span></a>; '
      + 'a degree absent from it contributed nothing but honest width.')
    /* The EXCEPTIONAL degrees, enumerated from the law and looked up in the record —
       this paragraph used to name d = 168 alone and call it "the last exceptional
       density in range" while the same record already closed d = 224 as well. */
    + (excExt.length ? C.pRaw('Some closures deserve their own sentence. The EXCEPTIONAL degrees past the cited '
        + 'horizon — d = 4k(k+1), square discriminant by the theorem of §1, the degrees the cited page could not '
        + 'reach and left with their Galois group undetermined — are ' + excDList(excExt) + '. '
        + (excClosed.length === excExt.length
          ? 'The squeeze closed EVERY one of them (survivor ' + andList(excNames) + '), so every exceptional '
            + 'density through l = ' + Lmax + ' is now an exact rational.'
          : (excClosed.length
              ? 'Closed: ' + excDList(excClosed) + ' (survivor ' + andList(excNames) + '). '
              : '')
            + 'Still open, still costing full width: ' + excDList(excStillOpen) + '.')) : '')
    + '</div>'
}));

/* Added after reading Theorem 8 at the source rather than from the abstract:
   the theorem has two constants and this repository had only ever spoken about
   one of them. Nothing new is computed here — it is the same bracket, divided
   the other way. */
O.push(C.section({
  lab: '§3b · superseded, and why it is kept', title: 'The liminf became exact — so this bracket is now its value',
  bodyRaw: '<div class="col">'
    + C.pRaw('<strong>Read this section as history.</strong> On 2026-08-31 van Doorn posted '
      + '<a href="https://arxiv.org/abs/2609.00104">arXiv:2609.00104</a>, whose Theorem 1 proves that '
      + C.m('liminf (b(a)−a)/log a = 1/(1+c)') + ' EXACTLY — a human write-up of a proof discovered with ChatGPT '
      + '5.6-Sol Pro (the abstract is pinned at ' + C.m('corpus/sources/' + SRC_ABS) + ', the PDF by sha256 beside it). '
      + 'The 1/(2c) endpoint is superseded by that theorem: Theorem 8 is no longer a two-sided interval, and the upper-endpoint sharpening '
      + 'this section describes no longer improves anything. What survives is better: the certified bracket on c '
      + 'above is now the numeric value of a constant that is known exactly, and to our knowledge it remains the '
      + 'sharpest published enclosure of it — the new paper states only "approximately 0.546" and makes no effort '
      + 'to compute it precisely. The reasoning below is left standing because it was correct when posted and '
      + 'because the lower endpoint 1/(1+c) is exactly what the new theorem singles out.')
    + C.pRaw('The bound this page set out to sharpen was one half of a pair. Van Doorn\'s Theorem 8 read '
      + C.m('0.54 < liminf (b(a)−a)/log a < 0.61') + ', with Lemma 31 supplying the lower endpoint 1/(1+c), '
      + 'Lemma 30 the upper endpoint 1/(2c), and Lemma 32 supplying 0.82 &lt; c &lt; 0.85. Both published constants '
      + 'are those two expressions rounded to two decimals — so the same constant c governs both, and a certified '
      + 'bracket for c moves both ends of the published interval, not one.')
    + C.pRaw('The upper endpoint costs nothing extra. 1/(2c) DECREASES in c, so it is fed by the bracket\'s '
      + 'certified LOWER endpoint — and the lower endpoint charges the unpinned tail zero, so no tail lemma, no '
      + 'assumption about the groups above the horizon, and no further degree enters it at all. Dividing the same '
      + 'bracket the other way, with outward rounding:')
    + C.eq(C.esc('liminf (b(a)−a)/log a ≤ 1/(2c) ≤ ' + twoCHi.toFixed(12) + '   (published: ' + VD.hi + ')'))
    + C.pRaw('Setting the two together, Theorem 8 becomes ' + C.m(uncLo.toFixed(12) + ' < liminf < ' + twoCHi.toFixed(12))
      + ' — the published interval narrowing from width ' + vdWidth.toFixed(2) + ' to at most ' + OUT.up(newWidth, 4) + '. '
      + 'Honesty about where that comes from: most of the upper-endpoint gain was already available at the cited '
      + 'horizon, which gives ' + twoC60Hi.toFixed(12) + '; the continuation of §3 moves it the rest of the way. '
      + 'The published 0.61 is conservative mainly because 0.82 is a conservative reading of c, not because the '
      + 'horizon was short. Both numbers above carry the same Lemma 32 dependency as everything else on this page, '
      + 'and neither carries the §4 assumption.')
    + '</div>'
}));

O.push(C.section({
  lab: '§4 · the conditional value', title: 'c to ' + condDigits + ' digits — under one labeled assumption',
  bodyRaw: '<div class="col">'
    + C.pRaw('Below d = ' + 2 * condFirstL + ' the lifted kernel needs no assumption: it carries the paper\'s '
      + 'hyperoctahedral range and the exceptional densities at d = ' + andList(condExactD.map(String)) + ' as exact '
      + 'rationals. Under one assumption about everything above it — <i>given that for every even d ≥ ' + 2 * condFirstL + ', '
      + 'Gal(f_d) is either S_l⁺ or its index-2 subgroup</i>, which is true at every degree where the group has been '
      + 'determined — the tail telescopes with two explicitly-carried error terms (the index-2 allowance '
      + '1/(2^l l!) and the alternating-series deviation), and c is pinned to ' + condDigits + ' digits, '
      + 're-derived during this build:')
    + C.eq(C.m('c* ∈ [' + cond34.lo + ', ' + cond34.hi + ']'))
    + C.pRaw('That boundary is not asserted here, it is READ OFF the enclosure: the whole width of the interval '
      + 'above is the sum of the carried allowances, largest at l = ' + condFirstL + ' where one term costs '
      + condAllow.toExponential(2) + ' — which caps this enclosure at ' + condCap + ' decimals no matter how large '
      + 'the cutoff, of which the record publishes ' + condDigits + '. The derived constant 1/(1+c*) = ' + inv18.lo + '… (exact rational division '
      + 'of the enclosure) is the OEIS-shaped output. The assumption subsumes irreducibility of f_d for those '
      + 'degrees; it is certified only through the pinned horizon. The statement with no assumption about the tail '
      + 'remains the bracket of §3, which takes as given only ' + LEMMA32 + ', as everywhere on this page — the two '
      + 'are never conflated.')
    /* WHAT c* RESTS ON (WARRANT rule 11): the hypothesis, graded, with the evidence the extension record holds for it */
    + (() => {
      const nm = (n) => Object.values(EXT.deltas).filter((v) => v.name === n).length;
      return C.pRaw('<b>What c* rests on</b>, beyond the premises of §2:') + WR.premisesHtml([
        { grade: WR.ASSUMED, label: 'For every even d ≥ ' + 2 * condFirstL + ', Gal(f_d) is S_l⁺ or its index-2 subgroup', evidence: 'a hypothesis, adopted: it holds at each of the ' + extLs.length + ' degrees the squeeze closed past the cited horizon (S_l⁺ at ' + nm('B') + ', the even-weight subgroup at ' + nm('ES0') + ', ' + C.m('certs/erdos290-tail-ext.json') + ') and is checked nowhere beyond l = ' + Lmax }
      ], { meetLine: 'The ' + condDigits + ' digits are exact given it; the hypothesis is the weakest premise, <b>assumed</b>, and no finite computation can check it.' });
    })()
    + C.pRaw('The same telescoping run against THIS build\'s horizon instead of the cited kernel\'s — '
      + C.m('node tools/erdos290-cstar-precision.js') + ' — starts its assumption at d = ' + (2 * Lpin + 2)
      + ' rather than d = ' + 2 * condFirstL + ', and the enclosure lengthens accordingly; that tool carries its '
      + 'own calibration against the kernel at the old horizon and writes the OEIS b-files.')
    + '</div>'
}));

O.push(C.section({
  lab: '§5 · provenance', title: 'The cited page, byte-preserved — and how to re-run all of it',
  bodyRaw: '<div class="col">'
    + C.pRaw('This page supersedes the one cited in the erdosproblems #290 comment (posted 2026-08-04); that page '
      + 'and its programs are preserved BYTE-IDENTICALLY, hash-pinned through this repository\'s lift provenance, '
      + 'in <a href="https://github.com/carlostoledo1891/cert-machine/blob/main/legacy/research/challenges/erdos290.html">the repository</a> (the citation paths 301 here). Its self-contained programs — the theorem checker with its '
      + 'planted falsifiers, the narrowing pipeline, the five-candidate squeeze, the vendored exact-rational '
      + 'arithmetic — live beside it in the repository. This build re-runs the theorem checker and the narrowing pipeline; the squeeze\'s '
      + extLs.length + ' closed degrees are read from their record, ' + C.m('certs/erdos290-tail-ext.json') + ', and are not re-run here. To repeat it yourself: '
      + '<span class="m">node theorem.js</span> (the proof), '
      + '<span class="m">node narrowing.js</span> '
      + '(the bracket), <span class="m">node tools/run-erdos290-tail-ext.js</span> or, sharded across cores, '
      + '<span class="m">node tools/run-erdos290-tail-shard.js</span> (the continuation past l = ' + citedL + ') from '
      + '<a href="https://github.com/carlostoledo1891/cert-machine">the repository</a>.')
    + '</div>'
}));

const foot = ''
  + '<p>' + C.esc('Generated by tools/build-report-erdos290.js @ git ' + gitrev + ' — the theorem re-proved (falsifiers required to fire), the narrowing record reproduced byte-identically, the bracket re-assembled in exact rationals and calibrated against the record, the conditional enclosure re-derived. The build refuses if any of it moves.') + '</p>'
  + '<p>' + C.esc('cert-machine · Carlos Toledo') + '</p>'
  + '';

fs.writeFileSync(path.join(ROOT, 'reports', 'erdos290.html'),
  TPL.render({ title: 'Erdős #290: the 4k(k+1) theorem · cert-machine', bodyRaw: O.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/erdos290.html',
    desc: 'Erdős #290: the 4k(k+1) square-discriminant law proved as exact integer identities, and a certified bracket for the Galois-density constant c — and so for the liminf, which arXiv:2609.00104 proves equals 1/(1+c) (the 1/(2c) endpoint superseded) — with no tail assumption, tightened past the cited page, every number recomputed at build.' }));
console.log('reports/erdos290.html written: theorem RE-PROVED (' + falsifiers + ' falsifiers), narrowing reproduced, bracket ['
  + bxLo.toFixed(12) + ', ' + bxHi.toFixed(12) + '] (' + tighterPct(bxWidth, B60.width) + ' tighter, l <= ' + Lmax + ') @ git ' + gitrev);
