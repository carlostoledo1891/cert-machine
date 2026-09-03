#!/usr/bin/env node
/* the covering module's own battery: the module is now load-bearing for four
   theorems, so its failure modes are tested directly rather than only through
   its consumers. */
'use strict';
const { tileGaps, describe, tileArea2D } = require('./covering.js');
let pass = 0, fail = 0, reds = 0, fired = 0;
const ok = (c, n, d) => { if (c) { pass++; console.log('  ok   ' + n + (d ? ' — ' + d : '')); } else { fail++; console.error('  FAIL ' + n + (d ? ' — ' + d : '')); } };
const red = (f, n) => { reds++; if (f) { fired++; pass++; console.log('  RED ok  ' + n); } else { fail++; console.error('  RED DID NOT FIRE  ' + n); } };

ok(tileGaps([[0, 1], [1, 2], [2, 3]], 0, 3).ok, 'a contiguous tiling is accepted');
ok(tileGaps([[2, 3], [0, 1], [1, 2]], 0, 3).ok, 'order does not matter — pieces are sorted');
ok(tileGaps([[0, 1.5], [1, 3]], 0, 3).ok, 'an OVERLAPPING cover is accepted: overlap is not a hole');
ok(tileGaps([[0, 1.5], [1, 3]], 0, 3).overlaps.length === 1, 'the overlap is still reported');
/* geometric ladders span decades, so absolute epsilon is meaningless there */
ok(tileGaps([[1e-12, 1e-6], [1e-6, 0.1]], 1e-12, 0.1, { rel: true, eps: 1e-9 }).ok,
  'a decade-spanning ladder is accepted under relative comparison');

console.log('red controls');
red(!tileGaps([[0, 1], [1.0001, 3]], 0, 3).ok, 'X1 an interior gap is REFUSED');
red(!tileGaps([[0, 1], [1, 2]], 0, 3).ok, 'X2 a cover ending short of the region is REFUSED');
red(!tileGaps([[0.5, 1], [1, 3]], 0, 3).ok, 'X3 a cover starting inside the region is REFUSED');
red(!tileGaps([], 0, 3).ok, 'X4 an empty cover is REFUSED');
/* a zero-width piece is reported and excluded, not treated as a gap... */
ok(tileGaps([[0, 1], [2, 2], [1, 3]], 0, 3).ok, 'a zero-width piece inside a complete cover does NOT fail it');
ok(tileGaps([[0, 1], [2, 2], [1, 3]], 0, 3).degenerate === 1, 'the zero-width piece is still reported');
/* ...and crucially it must never bridge a real hole */
red(!tileGaps([[0, 1], [2, 2], [3, 4]], 0, 4).ok, 'X5 a zero-width piece CANNOT paper over a real gap');
red(!tileGaps([[0, 1], [3, 2], [1, 2]], 0, 3).ok, 'X6 an inverted piece cannot supply the missing 2..3');
red(!tileGaps([[1, 1], [2, 2]], 0, 3).ok, 'X6b a cover made only of empty pieces is REFUSED');
/* the subtle one: a tiny gap must not be swallowed by a loose tolerance */
red(!tileGaps([[1e-12, 1e-6], [1.000001e-6, 0.1]], 1e-12, 0.1, { rel: true, eps: 1e-12 }).ok,
  'X7 a 1e-6-relative gap is NOT absorbed by a 1e-12 relative tolerance');

/* ---- 2D area accounting ---- */
const REG = { x: [0, 1], y: [0, 1] };
const quad = [{x:[0,0.5],y:[0,0.5]},{x:[0.5,1],y:[0,0.5]},{x:[0,0.5],y:[0.5,1]},{x:[0.5,1],y:[0.5,1]}];
ok(tileArea2D(quad, REG).ok, '2D: a four-box partition accounts for the unit square');
ok(tileArea2D(quad.concat([{x:[0.2,0.2],y:[0,1]}]), REG).ok, '2D: a zero-area box does not break the accounting');
red(!tileArea2D(quad.slice(0, 3), REG).ok, 'X8 2D: a missing quadrant is REFUSED (area falls short)');
red(!tileArea2D(quad.concat([{x:[0,0.5],y:[0,0.5]}]), REG).ok, 'X9 2D: a duplicated box is REFUSED (area overshoots)');
red(!tileArea2D(quad.concat([{x:[1,1.5],y:[0,1]}]), REG).ok, 'X10 2D: a box outside the region is REFUSED');
red(!tileArea2D([], REG).ok, 'X11 2D: no boxes at all is REFUSED');

console.log(`covering battery: ${pass} pass, ${fail} fail, ${fired}/${reds} red controls fired`);
process.exit(fail ? 1 : 0);
