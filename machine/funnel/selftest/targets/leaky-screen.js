/* selftest/targets/leaky-screen.js — SCREEN CALIBRATION, half two.
   A screen built to LEAK: it adds the condition a >= 4, which keeps both
   declared planted hits ([4,9], [6,6] — so the recall control passes and the
   run starts) but silently rejects the two UNDECLARED true hits [2,18] and
   [3,12]. With rejectAuditRate = 1.0 the REJECT AUDIT certifies every
   screen-reject and must measure a false-negative count of exactly 2 — the
   battery asserts it is nonzero, proving the audit's teeth. */
'use strict';
const base = require('./synthetic.js');

module.exports = Object.assign({}, base, {
  /* only two of the four true hits are declared planted */
  plantedHits: [[4, 9], [6, 6]].map(v => ({
    candidate: { v: v.slice() },
    certificate: base.makeCertificate({ v: v.slice() })
  })),
  screen(c) {
    const v = (c && c.v) || [0, 0];
    const a = Number(v[0]), b = Number(v[1]);
    const dist = Math.abs(a * b - 36);
    const pass = dist <= 12 && a >= 4;
    return { pass, why: pass ? 'passed leaky screen' : ('rejected: |a*b-36|=' + dist + ' or a=' + a + ' < 4') };
  }
});
