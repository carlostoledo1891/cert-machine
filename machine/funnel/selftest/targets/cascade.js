/* selftest/targets/cascade.js — synthetic with a TWO-STAGE screen cascade.
   ENGINE SELFTEST — ships nowhere, mints nothing, claims nothing.
   Stage 'coarse' prunes |a*b-36| > 14; stage 'tight' prunes > 12 — so the
   tight stage has a real, nonzero reject population of its own (products at
   distance 13..14: e.g. [2,11]=22, [7,7]=49, [5,10]=50), and the cascade's
   conservation identity has two stages to hold across. Planted hits pass
   both stages (distance 0). */
'use strict';
const S = require('./synthetic.js');

module.exports = Object.assign({}, S, {
  screen: undefined,
  screens: [
    {
      name: 'coarse',
      screen(c) {
        const [a, b] = c.v.map(Number);
        const d = Math.abs(a * b - 36);
        return d <= 14 ? { pass: true, why: 'coarse d=' + d } : { pass: false, why: 'coarse d=' + d + ' > 14' };
      }
    },
    {
      name: 'tight',
      screen(c) {
        const [a, b] = c.v.map(Number);
        const d = Math.abs(a * b - 36);
        return d <= 12 ? { pass: true, why: 'tight d=' + d } : { pass: false, why: 'tight d=' + d + ' > 12' };
      }
    }
  ]
});
