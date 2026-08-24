/* selftest/targets/miscalibrated-screen.js — SCREEN CALIBRATION, half one.
   A screen that rejects HALF the planted hits: it adds the bogus condition
   a % 4 === 2, which keeps [2,18] (a=2) and [6,6] (a=6) but rejects [3,12]
   and [4,9]. The RECALL control must catch this at run start — planted hits
   must survive the screen every run — and the run must REFUSE to start. */
'use strict';
const base = require('./synthetic.js');

module.exports = Object.assign({}, base, {
  screen(c) {
    const v = (c && c.v) || [0, 0];
    const a = Number(v[0]), b = Number(v[1]);
    const dist = Math.abs(a * b - 36);
    const pass = dist <= 12 && a % 4 === 2;
    return { pass, why: pass ? 'passed miscalibrated screen' : ('rejected: |a*b-36|=' + dist + ' or a%4=' + (a % 4) + ' !== 2') };
  }
});
