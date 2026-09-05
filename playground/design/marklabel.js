/* marklabel.js — placing text beside a point on a plate, once.
   playground/design/ · cert-machine · 2026-09-05

   WHY IT IS HERE. This was byte-identical in playground/affect/plate.js and
   playground/answer-shape/plate.js — two copies, one sha. CLAUDE.md's rule is
   that a definition used by two consumers lives in ONE module, because a rule
   defined twice WILL diverge, and these two had not diverged only because
   nobody had touched them yet.

   THREE THINGS WENT WRONG WITH LABELS ON THE AFFECT CARD, and they were three
   different bugs wearing one appearance:

   1 THE CLAMP HELD THE ANCHOR, NOT THE TEXT.  `x = clamp(5, size - 5, x)`
     pins the anchor inside the viewBox, but with text-anchor="start" the
     glyphs run RIGHT from it and with "end" they run LEFT, so a label pinned
     at an edge leaves the box entirely. SVG does not error, it cuts — the
     gotcha design/CONTRACT.md records as "text drawn inside an SVG viewBox
     sized for the boxes is SILENTLY CLIPPED". The clamp now knows which way
     the text runs and how far.

   2 THE SHARED `.lb` RULE HAD NO FONT-SIZE.  Fixed in components.js, not here,
     but it is the reason 1 was catastrophic rather than cosmetic: the
     gathering page inlines no page stylesheet, so embedded card art fell back
     to the browser default 16px in viewBox units.

   3 TWO LABELS CAN LAND ON THE SAME LINE.  The alternating radius separates
     angular neighbours, but nothing separated labels that merely ENDED UP
     overlapping — so "astonished" and "excited" printed through each other.
     resolve() below is the pass that was missing.

   NOT A GENERALISED MARK. design/CONTRACT.md says the marks are deliberately
   not shared and generalising them early makes them worse. This is not a mark;
   it is where a string goes so it stays inside the picture and off its
   neighbour. The plates go on drawing whatever they draw. */
'use strict';

/* Advance width of the mono face as a fraction of font-size. JetBrains Mono is
   0.6 em per glyph. Measuring text properly needs a browser; this is a bound,
   and a bound is what the clamp needs — erring wide costs a few px of margin,
   erring narrow costs a cut word. */
const ADVANCE = 0.6;
const LINE = 1.15;                    /* line box as a multiple of font-size */

/* where a label wants to sit, before anyone else is considered */
function spec(X, Y, p, size, i, text, cls, base, { fontSize = 8.5, edge = 5 } = {}) {
  const a = Math.atan2(Y(p) - size / 2, X(p) - size / 2);
  const anchor = Math.cos(a) > 0.34 ? 'start' : Math.cos(a) < -0.34 ? 'end' : 'middle';
  const rad = (base || 13) + (i % 2) * 9;
  let x = X(p) + Math.cos(a) * rad;
  let y = Y(p) + Math.sin(a) * rad + 3.6;
  if (Math.abs(Math.sin(a)) < 0.34) y += (i % 2 ? 9 : -6);          // split a flat run

  const w = String(text).length * fontSize * ADVANCE;
  const reachL = anchor === 'start' ? 0 : anchor === 'end' ? w : w / 2;
  const reachR = anchor === 'start' ? w : anchor === 'end' ? 0 : w / 2;
  const lo = edge + reachL, hi = size - edge - reachR;
  /* a label wider than the box cannot be placed legally: centre it, so it is
     cut evenly rather than losing one whole end */
  x = hi >= lo ? Math.max(lo, Math.min(hi, x)) : size / 2;

  return { x, y, w, reachL, reachR, anchor, text, cls, fontSize, size, edge };
}

/* Push apart any two labels that share a line and overlap horizontally. A few
   relaxation passes, smallest move first, and the one nearer the top goes up —
   so a pair separates symmetrically instead of one sliding across the plate.
   Deterministic: same input, same output, because these are built pages. */
function resolve(specs, passes = 4) {
  const L = (s) => s.x - s.reachL, R = (s) => s.x + s.reachR;
  for (let pass = 0; pass < passes; pass++) {
    let moved = false;
    for (let i = 0; i < specs.length; i++) {
      for (let j = i + 1; j < specs.length; j++) {
        const a = specs[i], b = specs[j];
        const gap = a.fontSize * LINE;
        const dy = Math.abs(a.y - b.y);
        if (dy >= gap) continue;
        if (R(a) <= L(b) || R(b) <= L(a)) continue;      /* no horizontal overlap */
        const push = (gap - dy) / 2 + 0.1;
        const aUp = a.y <= b.y;
        a.y += aUp ? -push : push;
        b.y += aUp ? push : -push;
        moved = true;
      }
    }
    if (!moved) break;
  }
  /* keep everything inside the box after the pushing */
  for (const s of specs) {
    s.y = Math.max(s.edge + s.fontSize, Math.min(s.size - s.edge, s.y));
  }
  return specs;
}

const render = (s) => `<text x="${s.x.toFixed(1)}" y="${s.y.toFixed(1)}"`
  + ` class="${s.cls}" text-anchor="${s.anchor}">${s.text}</text>`;

/* the one-shot form, for a caller with a single label and nothing to collide with */
const label = (...a) => render(spec(...a));

/* the form a plate wants: hand it every label, get back the SVG with the
   collisions already resolved */
const labels = (list) => resolve(list).map(render).join('');

module.exports = { label, spec, resolve, render, labels, ADVANCE, LINE };
