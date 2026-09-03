/* ERDOS-1038 — verify-force.js: INDEPENDENT check of a cert-force.js certificate.
   (1) structure: a₀-boxes tile [−cap, −√2]; b-boxes tile [0, R_box]; R_box ≥ cap + a⁺; a_eff ≤ max(a⁻, b⁻ − cap);
       tooth spacing > R_box; lowest tooth image clears the heavy image; weights finite and ≥ 0.
   (2) falsification: with the frozen weights of every b-box, evaluate U in doubles at random (a₀, b) in the box
       (a₀ ∈ [a_eff, a⁺], b ∈ [b⁻,b⁺]) on a fine x-grid of [0,1] plus x = −1 and golden-polish the dips; report the
       smallest value found. A negative value would mean the certificate is wrong (this is a bug-finder, not a proof;
       the proof is the interval certificate itself).
   Usage: node verify-force.js cert-force-<cap>.json [samples per b-box = 12] [NX = 4000]                    MIT. */
'use strict';
const fs = require('fs');
const J = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const NS = Number(process.argv[3] || 12), NX = Number(process.argv[4] || 4000);
const cap = J.summary.cap, SQRT2 = Math.SQRT2;
let problems = 0;
const bad = msg => { problems++; if (problems <= 30) console.log('PROBLEM: ' + msg); };

// ---- (1) structure
const boxes = J.boxes.slice().sort((p, q) => p.a[0] - q.a[0]);
if (!(boxes[0].a[0] <= -cap)) bad(`a-range starts at ${boxes[0].a[0]} > −cap`);
if (!(boxes[boxes.length - 1].a[1] >= -SQRT2)) bad(`a-range ends at ${boxes[boxes.length - 1].a[1]} < −√2`);
for (let i = 0; i + 1 < boxes.length; i++) if (!(boxes[i].a[1] >= boxes[i + 1].a[0])) bad(`a-gap between ${boxes[i].a[1]} and ${boxes[i + 1].a[0]}`);
let nbb = 0;
for (const B of boxes) {
  const [aLo, aHi] = B.a;
  if (!(B.Rbox >= cap + aHi)) bad(`R_box ${B.Rbox} < cap + a⁺ ${cap + aHi}`);
  const t = B.teeth;
  if (!(t.length >= 1)) bad(`no teeth in a-box ${aLo}`);
  for (let j = 0; j + 1 < t.length; j++) if (!(t[j] - t[j + 1] > B.Rbox)) bad(`tooth spacing ${t[j] - t[j + 1]} ≤ R_box in a-box ${aLo}`);
  if (!(t[t.length - 1] - B.Rbox > B.Rbox)) bad(`lowest tooth image overlaps heavy image in a-box ${aLo}`);
  const bb = B.bboxes.slice().sort((p, q) => p.b[0] - q.b[0]);
  if (!(bb[0].b[0] <= 0)) bad(`b-range starts at ${bb[0].b[0]} in a-box ${aLo}`);
  if (!(bb[bb.length - 1].b[1] >= B.Rbox)) bad(`b-range ends at ${bb[bb.length - 1].b[1]} < R_box in a-box ${aLo}`);
  for (let i = 0; i + 1 < bb.length; i++) if (!(bb[i].b[1] >= bb[i + 1].b[0])) bad(`b-gap in a-box ${aLo}`);
  for (const o of bb) {
    nbb++;
    if (!(o.aEff <= Math.max(aLo, o.b[0] - cap))) bad(`a_eff ${o.aEff} too large for b⁻ ${o.b[0]} in a-box ${aLo}`);
    if (o.w.length !== t.length + 1) bad(`weight count in a-box ${aLo}`);
    if (!o.w.every(x => Number.isFinite(x) && x >= 0)) bad(`bad weight in a-box ${aLo}`);
    if (!(o.min > 0)) bad(`non-positive certified min in a-box ${aLo}`);
  }
}
console.log(`structure: ${boxes.length} a₀-boxes, ${nbb} b-boxes, ${problems} problems`);

// ---- (2) falsification in doubles
function U(a0, P, w, x) { let v = -Math.log(Math.abs(x - a0)); for (let i = 0; i < P.length; i++) if (w[i] > 0) v -= w[i] * Math.log(Math.abs(x - P[i])); return v; }
function minS(a0, P, w) {
  const f = x => U(a0, P, w, x);
  let best = f(-1), bx = -1;
  const h = 1 / NX, vals = new Float64Array(NX + 1);
  for (let i = 0; i <= NX; i++) vals[i] = f(i * h);
  const g = (Math.sqrt(5) - 1) / 2;
  for (let i = 0; i <= NX; i++) {
    if (!((i === 0 || vals[i] <= vals[i - 1]) && (i === NX || vals[i] <= vals[i + 1]))) continue;
    let l = Math.max(0, (i - 1) * h), r = Math.min(1, (i + 1) * h);
    let x1 = r - g * (r - l), x2 = l + g * (r - l), f1 = f(x1), f2 = f(x2);
    for (let it = 0; it < 40; it++) {
      if (f1 < f2) { r = x2; x2 = x1; f2 = f1; x1 = r - g * (r - l); f1 = f(x1); }
      else { l = x1; x1 = x2; f1 = f2; x2 = l + g * (r - l); f2 = f(x2); }
    }
    const vc = Math.min(f((l + r) / 2), vals[i], f1, f2);
    if (vc < best) { best = vc; bx = (l + r) / 2; }
  }
  return { m: best, x: bx };
}
let seed = 12345; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
let worst = { m: Infinity };
for (const B of boxes) for (const o of B.bboxes) {
  for (let k = 0; k < NS; k++) {
    // corners and edges first, then random interior points
    const ta = k === 0 ? 0 : k === 1 ? 1 : rnd(), tb = k === 0 ? 1 : k === 1 ? 1 : k === 2 ? 0 : rnd();
    const a0 = o.aEff + (B.a[1] - o.aEff) * ta, b = o.b[0] + (o.b[1] - o.b[0]) * tb;
    const P = [b, ...B.teeth.map(s => s - b)];
    const r = minS(a0, P, o.w);
    if (r.m < worst.m) worst = { m: r.m, a0, b, x: r.x, aBox: B.a, bBox: o.b, certified: o.min };
  }
}
console.log(`falsification: smallest U found = ${worst.m.toExponential(4)} at a₀ ${worst.a0}, b ${worst.b}, x ${worst.x} (a-box ${worst.aBox}, b-box ${worst.bBox}, certified min there ${worst.certified.toExponential(3)})`);
if (worst.m <= 0) { problems++; console.log('PROBLEM: negative U inside a certified box — the certificate is WRONG'); }
console.log(problems === 0 ? `VERIFIED: structure sound, no counterexample found (cap ${cap}, full range ${J.summary.fullRange})` : `FAILED: ${problems} problems`);
process.exit(problems === 0 ? 0 : 1);
