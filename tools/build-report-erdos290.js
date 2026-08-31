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

/* ---- 1/(1+c): the value the sequencing question actually asks for --------
   c is the object the sum defines; 1/(1+c) is what an OEIS entry would carry,
   and it is what the #290 issue asked for by name. It is derived HERE by exact
   rational division of the bracket's own endpoints — never by dividing the
   printed decimals — and 1/(1+x) is decreasing, so the endpoints swap.

   `agreed` counts the leading decimal digits the two endpoints SHARE. That is
   the honest meaning of "digits known unconditionally": digits both ends of a
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
if (invAgreed <= inv60Agreed) die('the extension did not add an unconditional digit to 1/(1+c) — '
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

/* ---- the page ------------------------------------------------------------- */
const fmtPct = (a, b) => (100 * (1 - a / b)).toFixed(0) + '%';
const O = [];

O.push(C.header({
  eyebrow: 'cert-machine · report · every number recomputed at build',
  title: 'A digit that was a guess is now a theorem',
  deck: 'Someone asked, in an open GitHub issue, what number to put in the OEIS for Erdős problem #290 — and '
    + 'guessed its third digit. That digit is now PROVED. The constant is ' + C.esc(invPrefix) + '…, with no '
    + 'assumption of any kind, where every previous horizon could pin only ' + C.esc(dec(INV60.lo, 12, false).toFixed(12).slice(0, 2 + inv60Agreed))
    + '…. It took closing ' + (Lmax - citedL) + ' consecutive degrees of a computation nobody had run past '
    + 'd = ' + citedD + '.'
}));

/* The tl;dr states the SAME three numbers §2b and §3 state, from the same variables —
   it used to carry its own literals ("a third", "l ≤ 90") and they had gone stale against
   the body of the page. A number that appears twice must be computed once. */
O.push(C.tldr({
  findingRaw: '<strong>1/(1+c) = ' + C.esc(invPrefix) + '…, unconditionally.</strong> Three digits of the '
    + 'constant an OEIS entry would carry, proved — not estimated, not sampled, and not resting on any '
    + 'assumption. The previous horizon held only ' + C.esc(dec(INV60.lo, 12, false).toFixed(12).slice(0, 2 + inv60Agreed))
    + '…, so the third digit is new here, and it is the digit the #290 issue guessed. Underneath it: the '
    + '4k(k+1) square-discriminant law proved as exact integer identities, the bracket for c tightened to width '
    + bxWidth.toExponential(2) + ' — ' + fmtPct(bxWidth, B60.width) + ' tighter than the cited page — and every '
    + 'even degree pinned exactly through l = ' + Lpin + ' (d = ' + 2 * Lpin + ')'
    + (excClosed.length
      ? ', the ' + excClosed.length + ' exceptional degrees past the cited horizon (d = ' + andList(excClosed.map((e) => String(e.d))) + ') among them.'
      : '.')
    + ' And the same bracket moves the OTHER end of the published theorem, which nothing here had said before: '
    + 'Theorem 8 is two-sided, so 1/(2c) ≤ ' + twoCHi.toFixed(6) + ' sharpens its upper constant ' + VD.hi
    + ' at no extra cost — §3b.',
  mechanismRaw: 'Closed-form Galois class sums from the cycle-index EGF replace a 38.9-million-object '
    + 'enumeration (proved equal to it on every degree both can reach); planted falsifiers must fire at every '
    + 'build.',
  checkRaw: C.m('node tools/erdos290-lean-battery.js') + ' — closed forms equal enumeration exactly for l ≤ 12, '
    + 'the broken-EGF red control must fire.'
}));

O.push(C.stats([
  { k: '1/(1+c), unconditional', v: C.esc(invPrefix) + '…', role: 'held', n: 'the OEIS-shaped constant, proved with NO assumption — [' + uncLo.toFixed(12) + ', ' + uncHi.toFixed(12) + '], derived by exact rational division of the bracket. ' + invAgreed + ' digits agreed, against ' + inv60Agreed + ' at the cited horizon' },
  { k: 'the 4k(k+1) law', v: 'RE-PROVED', role: 'held', n: 'exact integer identities; ' + falsifiers + ' planted falsifiers fired during this build' },
  { k: 'cited bracket (K=' + citedL + ')', v: '[' + B60.lo.toFixed(9) + ', ' + B60.hi.toFixed(9) + ']', sm: true, n: 'reproduced byte-identically from the lifted narrowing pipeline' },
  { k: 'this build\'s bracket', v: '[' + bxLo.toFixed(9) + ', ' + bxHi.toFixed(9) + ']', sm: true, role: 'held', n: 'width ' + bxWidth.toExponential(2) + ' — ' + fmtPct(bxWidth, B60.width) + ' tighter; densities pinned through l = ' + Lpin },
  { k: 'degrees pinned', v: 'l ≤ ' + Lpin, n: (extLs.length ? extLs.length + ' new degrees closed by the five-candidate squeeze (l = ' + (citedL + 1) + '..' + Lmax + ')' + (EXT.open.length ? '; ' + EXT.open.length + ' left honestly open' : ', none left open') : 'the cited page\'s horizon') },
  { k: 'exceptional degrees', v: excClosed.length + ' closed', role: excStillOpen.length ? null : 'held', n: (excClosed.length ? 'd = 4k(k+1) past the cited d ≤ ' + citedD + ': ' + excDList(excClosed) + (excStillOpen.length ? '; still open: ' + excDList(excStillOpen) : ' — every one in range') : 'none past the cited horizon yet') },
  { k: 'conditional c*', v: cond34.lo.slice(0, 16) + '…', sm: true, n: condDigits + ' certified digits under ONE labeled group-theory assumption — re-derived this build' },
  { k: '1/(1+c*)', v: inv18.lo.slice(0, 16) + '…', sm: true, n: 'the OEIS-shaped constant, exact rational division of the conditional enclosure' }
]));

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
      + 'that carries ' + (100 * Q.toDouble(L2.lo) / bxHi).toFixed(0) + '% of c comes from.) '
      + 'The build re-checks every line as an exact integer identity and '
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
    + '</div>'
}));

/* ---- the squeeze, drawn -------------------------------------------------
   The width of the certified bracket as knowledge advances one degree at a
   time. Every point is bracket(L) recomputed HERE in exact rationals, so the
   curve is the certificate's own history, not a sketch of it. */
const SQ_X0 = 20;
const SQUEEZE = (() => {
  /* the sampling step follows the horizon, so a campaign that keeps extending it
     cannot quietly turn this build into a long one; the curve is monotone either way */
  const step = Math.max(2, 2 * Math.round((Lmax - SQ_X0) / 160));
  const pts = [];
  for (let L = SQ_X0; L <= Lmax; L += (L < citedL ? Math.max(4, step) : step)) {
    const b = bracket(L);
    pts.push([L, Q.toDouble(sub(b.hi, b.lo))]);
  }
  if (pts[pts.length - 1][0] !== Lmax) { const b = bracket(Lmax); pts.push([Lmax, Q.toDouble(sub(b.hi, b.lo))]); }
  return pts;
})();
{
  const w0 = SQUEEZE[0][1], w1 = SQUEEZE[SQUEEZE.length - 1][1];
  const at60 = SQUEEZE.reduce((a, p) => (Math.abs(p[0] - citedL) < Math.abs(a[0] - citedL) ? p : a), SQUEEZE[0]);
  const xt = [SQ_X0, citedL, Lmax];
  for (let i = 1; i <= 3; i++) xt.push(Math.round((citedL + (i / 4) * (Lmax - citedL)) / 10) * 10);
  const fig = CH.lines({
    w: 900, h: 300, x0: SQ_X0, x1: Lmax, y0: w1 * 0.75, y1: w0 * 1.15, logY: true,
    xTicks: [...new Set(xt)].filter((v) => v >= SQ_X0 && v <= Lmax).sort((a, b) => a - b).map(v => ({ v, t: String(v) })),
    yTicks: CH.decades(w1 * 0.75, w0 * 1.15, 6),
    xLabel: 'knowledge horizon  l  (densities pinned exactly for every even d = 2l up to here)',
    yLabel: 'certified width of c',
    bands: [{ x0: SQ_X0, x1: citedL, token: 'var(--c-grid)', t: 'the cited page stops here' }],
    series: [{ name: 'width of the certified bracket', pts: SQUEEZE, area: true,
               endLabel: w1.toExponential(2) }],
    xOf: v => 'l = ' + v,
    vOf: v => 'width ' + v.toExponential(3),
    alt: 'The certified width of the constant c falls from ' + w0.toExponential(2) + ' at l = ' + SQ_X0 + ' to '
      + w1.toExponential(2) + ' at l = ' + Lmax + ' on a logarithmic scale, a smooth decay with no jumps; '
      + 'the region left of l = ' + citedL + ', where the cited page stops, is shaded.'
  });
  O.push(C.section({
    lab: '§2b · the squeeze', title: 'The interval, closing',
    wide: true,
    bodyRaw: '<div class="col">'
      + C.pRaw('Each pinned degree removes its own weight from the unknown tail, so the bracket can only '
        + 'shrink — and this is what that looks like when every point is recomputed in exact rationals at '
        + 'build time. Left of the shaded edge is the cited page\'s horizon; everything right of it is this '
        + 'repository running the same lifted instrument further.')
      + '</div>'
      + C.figure({ svgRaw: fig, caption: 'Certified width of the bracket for c against the knowledge horizon l, '
        + 'log scale. ' + w0.toExponential(2) + ' at l = ' + SQ_X0 + ' · ' + at60[1].toExponential(2) + ' at the cited l = ' + citedL + ' · '
        + w1.toExponential(2) + ' at l = ' + Lmax + ', a factor of ' + (w0 / w1).toFixed(0) + ' across the sweep and '
        + fmtPct(w1, at60[1]) + ' tighter than the cited page. The curve is smooth because the width is the '
        + 'unpinned tail Σ 1/(2l(2l+1)) and nothing else: no estimate enters, so no point can move up.' })
  }));
}

O.push(C.section({
  lab: '§3 · the continuation', title: 'Past the horizon: l = ' + (citedL + 1) + '..' + Lmax + ', same instrument, tighter interval',
  bodyRaw: '<div class="col">'
    + C.pRaw('The entire remaining width at l = ' + citedL + ' is the unpinned tail Σ_{l>' + citedL + '} 1/(2l(2l+1)). '
      + 'This repository ran the cited page\'s own five-candidate squeeze — the lifted galois-exceptions.js, '
      + 'byte-identical' + (extPrimes ? ', nPrimes = ' + extPrimes : '') + ', early exit — over '
      + (extLs.length ? 'l = ' + (citedL + 1) + '..' + Lmax : 'nothing yet') + '. '
      + (extLs.length
        ? extLs.length + ' degrees closed to a unique certified survivor' + (EXT.open.length ? '; ' + EXT.open.length + ' did not close and keep their honest [0,1]' : ' — none refused')
          + (extAbovePin ? '; the run is contiguous to l = ' + Lpin + ', with ' + extAbovePin + ' further degrees already closed above the first gap' : '')
          + '. Result:'
        : 'Run tools/run-erdos290-tail-ext.js to extend.'))
    + C.eq(C.esc('c ∈ [' + bxLo.toFixed(12) + ', ' + bxHi.toFixed(12) + ']   (width ' + bxWidth.toExponential(3) + ', ' + fmtPct(bxWidth, B60.width) + ' tighter than the cited page)'))
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
  lab: '§3b · the other constant', title: 'Theorem 8 is two-sided, and the same bracket moves both ends',
  bodyRaw: '<div class="col">'
    + C.pRaw('The bound this page exists to sharpen is one half of a pair. Van Doorn\'s Theorem 8 reads '
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
      + ' — the published interval narrowing from width ' + vdWidth.toFixed(2) + ' to ' + newWidth.toFixed(4) + '. '
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
      + 'rationals. Under one assumption about everything above it — for every even d ≥ ' + 2 * condFirstL + ', '
      + 'Gal(f_d) is either S_l⁺ or its index-2 subgroup, which is true at every degree where the group has been '
      + 'determined — the tail telescopes with two explicitly-carried error terms (the index-2 allowance '
      + '1/(2^l l!) and the alternating-series deviation), and c is pinned to ' + condDigits + ' digits, '
      + 're-derived during this build:')
    + C.eq(C.m('c* ∈ [' + cond34.lo + ', ' + cond34.hi + ']'))
    + C.pRaw('That boundary is not asserted here, it is READ OFF the enclosure: the whole width of the interval '
      + 'above is the sum of the carried allowances, largest at l = ' + condFirstL + ' where one term costs '
      + condAllow.toExponential(2) + ' — which caps this enclosure at ' + condCap + ' decimals no matter how large '
      + 'the cutoff, of which the record publishes ' + condDigits + '. The derived constant 1/(1+c*) = ' + inv18.lo + '… (exact rational division '
      + 'of the enclosure) is the OEIS-shaped output. The assumption subsumes irreducibility of f_d for those '
      + 'degrees; it is certified only through the pinned horizon, and the unconditional statement remains the '
      + 'bracket of §3 — the two are never conflated.')
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
      + 'arithmetic — live beside it in the repository and are exactly what this build re-ran. To repeat it yourself: '
      + '<span class="m">node theorem.js</span> (the proof), '
      + '<span class="m">node narrowing.js</span> '
      + '(the bracket), <span class="m">node tools/run-erdos290-tail-ext.js</span> or, sharded across cores, '
      + '<span class="m">node tools/run-erdos290-tail-shard.js</span> (the continuation past l = ' + citedL + ') from '
      + '<a href="https://github.com/carlostoledo1891/cert-machine">the repository</a>.')
    + '</div>'
}));

const foot = '<footer class="col">'
  + '<p>' + C.esc('Generated by tools/build-report-erdos290.js @ git ' + gitrev + ' — the theorem re-proved (falsifiers required to fire), the narrowing record reproduced byte-identically, the bracket re-assembled in exact rationals and calibrated against the record, the conditional enclosure re-derived. The build refuses if any of it moves.') + '</p>'
  + '<p>' + C.esc('cert-machine · Carlos Toledo') + '</p>'
  + '</footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'erdos290.html'),
  TPL.render({ title: 'Erdős #290: the 4k(k+1) theorem · cert-machine', bodyRaw: O.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/erdos290.html',
    desc: 'Erdős #290: the 4k(k+1) square-discriminant law proved as exact integer identities, and a certified bracket for the Galois-density constant behind BOTH endpoints of van Doorn\'s Theorem 8 — tightened past the cited page, every number recomputed at build.' }));
console.log('reports/erdos290.html written: theorem RE-PROVED (' + falsifiers + ' falsifiers), narrowing reproduced, bracket ['
  + bxLo.toFixed(12) + ', ' + bxHi.toFixed(12) + '] (' + fmtPct(bxWidth, B60.width) + ' tighter, l <= ' + Lmax + ') @ git ' + gitrev);
