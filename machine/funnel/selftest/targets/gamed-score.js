/* selftest/targets/gamed-score.js — RED CONTROL (b).
   A score that rewards raw magnitude: score = a*b. scaleInflate (doubling)
   quadruples the product, so inflation RAISES the score — the exact defect
   the autoresearch audit documented (their NLS metric was gamed by amplitude
   until the harness normalized it). The SCORE BATTERY must catch this at run
   start and the run must REFUSE to start. */
'use strict';
const base = require('./synthetic.js');

module.exports = Object.assign({}, base, {
  score(c) {
    const v = (c && c.v) || [0, 0];
    return Number(v[0]) * Number(v[1]);   /* gameable: bigger is always better */
  }
});
