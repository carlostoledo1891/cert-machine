/* narrowing.js — emit narrowing.json: the certified bracket [c_lo, c_hi] as a function of
 * HOW MUCH IS KNOWN, so the page can show the mechanism of the contribution rather than
 * assert it. Every point is recomputed by the same exact-rational arithmetic the enclosure
 * uses; nothing here is illustrative.
 *
 * Knowledge level K = the largest l whose density δ_l this project has pinned exactly.
 *   K = 0   the state of the art before this work: van Doorn's Magma runs give δ_l for
 *           even d = 2l ≤ 60 EXCEPT the exceptional l ∈ {4,12,24}, which are unknown,
 *           and nothing at all is known for l ≥ 31.
 *   K ≥ 4   δ(f_8) pinned; K ≥ 12 adds δ(f_24); K ≥ 24 adds δ(f_48);
 *   K ≥ 31  the tail sweep pins l = 31…K one at a time.
 * Unknown δ contributes [0,1] × its weight 1/(2l(2l+1)) — the honest interval, not a guess.
 */
'use strict';
const fs = require('fs');
const path = require('path');
/* rational.js is VENDORED into this directory on purpose: the page promises a stranger can
   download these ten files and run them with no dependencies, and that promise was false
   while this line climbed three levels into eqcert/. The vendored copy is byte-identical to
   core/interval/rational.js and is checked as a declared fork by tools/check-duplication.js. */
const Q = require(path.join(__dirname, 'rational.js'));
const R = Q.R, add = Q.add, sub = Q.sub, mul = Q.mul, div = Q.div;
const ZERO = R(0n, 1n), ONE = R(1n, 1n);
/* kernel.js is the single home of the exceptional densities and of conditionalCStar. This
   file used to carry its OWN copies of the three exceptional literals AND a hand-typed copy
   of the 34-digit conditional constant — three homes for one number is how the retracted
   value stayed live in the figure for hours. Now both are DERIVED from the kernel. */
const K = require(path.join(__dirname, 'kernel.js'));

const EXC = new Set([4, 12, 24]);
const EXACT = new Map(K.EXACT_DELTAS);
for (const [l, v] of Object.entries(
  JSON.parse(fs.readFileSync(path.join(__dirname, 'tail-deltas.json'), 'utf8')).deltas))
  EXACT.set(Number(l), R(BigInt(v.n), BigInt(v.d)));

function log2Enclosure(n) {
  let s = ZERO;
  for (let k = 0; k < n; k++) { const m = 2 * k + 1; s = add(s, R(2n, BigInt(m) * 3n ** BigInt(m))); }
  const m = 2 * n + 1;
  return { lo: s, hi: add(s, mul(R(2n, BigInt(m) * 3n ** BigInt(m)), R(9n, 8n))) };
}
const W = l => R(1n, BigInt(2 * l) * BigInt(2 * l + 1));

/* Everything that does not depend on K is computed ONCE. (The first draft recomputed a
   5000-term sum with factorial-sized rationals at every point and did not finish; the
   structure below is the same arithmetic, hoisted.) */
const FIXED = (() => {
  const L = log2Enclosure(40);
  let base = L.lo, baseHi = L.hi;
  for (let l = 1; l <= 30; l++) {
    if (EXC.has(l)) continue;
    const d = mul(K.deltaHyperoct(l), W(l));
    base = add(base, d); baseHi = add(baseHi, d);
  }
  /* weight of everything past the sweep, EXACT by telescoping — the same closed form
     kernel.js uses: Σ_{l>60} 1/(2l(2l+1)) = (1 − log 2) − Σ_{l=1..60}. The 5000-term
     partial + 1/(4N) remainder this replaces gave the top of every bracket away by 7.5e-9. */
  let partial60 = ZERO;
  for (let l = 1; l <= 60; l++) partial60 = add(partial60, W(l));
  const beyond = sub(sub(ONE, L.lo), partial60);
  return { lo: base, hi: baseHi, beyond };
})();

function bracket(Klevel) {
  let lo = FIXED.lo, hi = add(FIXED.hi, FIXED.beyond);   /* beyond the sweep: δ ∈ [0,1] always */
  const pinnable = [4, 12, 24];
  for (let l = 31; l <= 60; l++) pinnable.push(l);
  for (const l of pinnable) {
    const w = W(l);
    if (EXACT.has(l) && l <= Klevel) { const d = mul(EXACT.get(l), w); lo = add(lo, d); hi = add(hi, d); }
    else hi = add(hi, w);                                /* unknown: only the top moves */
  }
  return { lo, hi };
}

function main() {
  const pts = [];
  const levels = [0];
  for (let k = 4; k <= 60; k++) levels.push(k);
  for (const k of levels) {
    const b = bracket(k);
    /* OUTWARD rounding at the displayed precision: nearest rounding can move an endpoint
       INWARD by half an ulp, and the figure's legend says "c is provably inside". */
    const dec = (a, kd, up) => { const sc = 10n ** BigInt(kd);
      let q = a.n * sc / a.d; if (up && a.n * sc % a.d !== 0n) q += 1n; return Number(q) / Number(sc); };
    pts.push({ K: k, d: 2 * k, lo: dec(b.lo, 12, false), hi: dec(b.hi, 12, true),
               width: Q.toDouble(sub(b.hi, b.lo)) });
  }
  const first = pts[0], last = pts[pts.length - 1];
  /* the conditional constant, DERIVED from kernel.js's conditionalCStar on every run —
     never typed. The double is what the figure draws; the 34-digit strings are the claim. */
  const CS = K.conditionalCStar(120, 80);
  const cond34 = { lo: K.decimals(CS.lo, 34, 'floor'), hi: K.decimals(CS.hi, 34, 'ceil') };
  const out = {
    generated: '2026-08-03',
    what: 'certified bracket for c as a function of how many densities are pinned exactly',
    paper: { lo: 0.82, hi: 0.85, source: 'van Doorn, arXiv:2411.03073 Lemma 32' },
    conditional: Number(cond34.lo),
    conditionalEnclosure34: cond34,
    points: pts,
  };
  fs.writeFileSync(path.join(__dirname, 'narrowing.json'), JSON.stringify(out));
  console.log('K=0   [' + first.lo.toFixed(9) + ', ' + first.hi.toFixed(9) + ']  width ' + first.width.toFixed(9));
  console.log('K=60  [' + last.lo.toFixed(9) + ', ' + last.hi.toFixed(9) + ']  width ' + last.width.toFixed(9));
  console.log('conditional c* ∈ [' + cond34.lo + ', ' + cond34.hi + ']');
  console.log('wrote narrowing.json · ' + pts.length + ' points');
  let bad = 0;
  /* the series must be monotone: knowing more can never widen a certified bracket */
  for (let i = 1; i < pts.length; i++) if (pts[i].width > pts[i - 1].width + 1e-15) bad++;
  console.log(bad === 0 ? 'ok   width is non-increasing in K (knowing more never widens)' : 'FAIL ' + bad + ' non-monotone step(s)');
  /* soundness: every bracket must contain the conditional value (the page's own on-load
     check draws from this data; if it could fail here it must fail HERE, with an exit code) */
  let sound = 0;
  for (const p of pts) if (!(p.lo <= out.conditional && out.conditional <= p.hi)) sound++;
  console.log(sound === 0 ? 'ok   every bracket contains the conditional value' : 'FAIL ' + sound + ' bracket(s) exclude the conditional value');
  bad += sound;

  /* paper.html hardcodes the SAME constant (`var COND`), the SAME 58-triple data array
     (`var D`) and the axis labels (`var LBL`) in its figure JS. On 2026-08-03 the retracted
     conditional value survived in the truncated COND copy for hours after the full-precision
     string was corrected everywhere else — both the dashed line and the figure's soundness
     check stayed green on it. So: every generated number that also exists as a page literal
     is checked against the generated one, and disagreeing is a FAILURE, not a note.
     A constant that exists in two places needs a check that they are the same one.
     The page ships OUTSIDE the program pack, so a missing paper.html is a SKIP (printed as
     one), never a crash — the shipped pack must run green from its own ten files alone. */
  let page = null;
  try { page = fs.readFileSync(path.join(__dirname, 'paper.html'), 'utf8'); }
  catch (e) { if (e.code !== 'ENOENT') throw e; }
  let condBad = 0;
  if (page === null) {
    console.log('skip paper.html not present beside this pack — the page-literal cross-checks run in the repository, where the page lives');
  } else {
    const m = page.match(/var\s+COND\s*=\s*([0-9.]+)/);
    if (!m) { condBad++; console.log('FAIL paper.html has no `var COND = …` to check'); }
    else if (Number(m[1]) !== out.conditional) {
      condBad++;
      console.log('FAIL paper.html COND = ' + m[1] + ' but narrowing.json conditional = ' + out.conditional);
    } else {
      console.log('ok   paper.html COND agrees with narrowing.json (' + m[1] + ')');
    }
    const md = page.match(/var\s+D\s*=\s*(\[\[[\s\S]*?\]\]);/);
    if (!md) { condBad++; console.log('FAIL paper.html has no `var D = [[…]];` to check'); }
    else {
      let pageD = null;
      try { pageD = JSON.parse(md[1]); } catch (e) { condBad++; console.log('FAIL paper.html D array does not parse: ' + e.message); }
      if (pageD) {
        let mism = pageD.length === pts.length ? 0 : 1;
        if (!mism) for (let i = 0; i < pts.length; i++) {
          const p = pts[i], row = pageD[i];
          if (!(row.length === 3 && row[0] === p.K && row[1] === p.lo && row[2] === p.hi)) mism++;
        }
        if (mism) { condBad++; console.log('FAIL paper.html D array disagrees with generated points (' + mism + ' mismatch(es)/length)'); }
        else console.log('ok   paper.html D array matches all ' + pts.length + ' generated points');
      }
    }
    const ml = page.match(/var\s+LBL\s*=\s*(\[\[[\s\S]*?\]\]);/);
    if (!ml) { condBad++; console.log('FAIL paper.html has no `var LBL = [[…]];` to check'); }
    else {
      let lbl = null;
      try { lbl = JSON.parse(ml[1].replace(/'/g, '"')); } catch (e) { condBad++; console.log('FAIL paper.html LBL does not parse: ' + e.message); }
      if (lbl) {
        /* each 'd=N' label must sit at the index whose data point IS degree N — three of
           five ticks pointed at the wrong degree (off by 2, 2 and 14) until 2026-08-03 */
        let lblBad = 0;
        for (const [idx, text] of lbl) {
          const dm = /^d=(\d+)$/.exec(text);
          if (!dm) continue;
          if (!(pts[idx] && pts[idx].d === Number(dm[1]))) { lblBad++;
            console.log('FAIL label "' + text + '" sits at index ' + idx + ' which is d=' + (pts[idx] ? pts[idx].d : '∅')); }
        }
        if (lblBad) condBad += lblBad;
        else console.log('ok   every d= axis label sits on the degree it names');
      }
    }
  }
  process.exit(bad === 0 && condBad === 0 ? 0 : 1);
}
main();
