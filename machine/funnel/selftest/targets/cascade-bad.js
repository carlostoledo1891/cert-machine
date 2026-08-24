/* selftest/targets/cascade-bad.js — a cascade whose SECOND stage wrongly
   rejects a planted hit ([3,12]): the recall control must refuse the run and
   NAME the guilty stage. ENGINE SELFTEST — ships nowhere. */
'use strict';
const S = require('./synthetic.js');

module.exports = Object.assign({}, S, {
  screen: undefined,
  screens: [
    {
      name: 'coarse',
      screen(c) {
        const [a, b] = c.v.map(Number);
        return Math.abs(a * b - 36) <= 14 ? { pass: true, why: 'ok' } : { pass: false, why: 'far' };
      }
    },
    {
      name: 'tight',
      screen(c) {
        const [a, b] = c.v.map(Number);
        if (a === 3) return { pass: false, why: 'miscalibrated: rejects every v[0]=3' };
        return Math.abs(a * b - 36) <= 12 ? { pass: true, why: 'ok' } : { pass: false, why: 'far' };
      }
    }
  ]
});
