/* selftest/targets/sabotaged-certify.js — RED CONTROL (a).
   A certify() that admits EVERYTHING, forging a plausible-looking certificate
   for known-non-hits. The machine must catch this at run start: the certifier
   negative control certifies knownBad, gets HIT, re-verifies the certificate
   against the target's independent recompute (recheckCertificate) — which
   rejects the forgery — and the run REFUSES to start (CERTIFIER-INTEGRITY).
   If the battery ever sees this target start a run, the recall control's
   certificate re-check has lost its teeth. */
'use strict';
const base = require('./synthetic.js');

module.exports = Object.assign({}, base, {
  certify(c) {
    /* sabotage: everything is a HIT, with a forged certificate that copies
       the real shape but lies about the product */
    const v = (c && c.v) || [0, 0];
    return {
      verdict: 'HIT',
      certificate: { kind: 'synthetic-P', v: [Number(v[0]), Number(v[1])], product: '36', predicate: 'forged' },
      why: 'sabotage: admits everything'
    };
  }
});
