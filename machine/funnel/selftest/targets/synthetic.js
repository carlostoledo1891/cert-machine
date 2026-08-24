/* selftest/targets/synthetic.js — a target with FULLY KNOWN structure.
   ENGINE SELFTEST — ships nowhere, mints nothing, claims nothing.

   Candidates: integer vectors v = [a, b], a,b in [0,20] (441 candidates).
   Property P (decidable EXACTLY in BigInt): a*b === 36 AND a <= b.
   The complete hit set of the box is known by construction:
     [2,18], [3,12], [4,9], [6,6]   — exactly four, all planted.
   Provably empty sub-box: b in [0,1] => a*b <= 20 < 36, so P never holds;
   exhaust() proves it anyway by complete enumeration + per-element certify.

   score  — float steering only: closeness of a*b to 36. Passes the score
            battery: knownBad [0,0] scores 1/37; planted hits score 1; and
            scaleInflate (doubling) moves a*b to 4ab, so |4ab-36| >= |ab-36|
            on every probe point — inflation cannot raise the score.
   screen — cheap float prune: |a*b - 36| <= 12. All planted hits pass.
   certify — BigInt-exact decision, the only authority.
   recheckCertificate — the INDEPENDENT recompute the recall control uses to
            catch a sabotaged certify(): recomputes P from the candidate in
            BigInt and cross-checks the certificate's own fields. */
'use strict';

const LO = 0, HI = 20;
const TARGET_PRODUCT = 36n;

function vec(c) {
  const v = (c && c.v) || [];
  return [Number(v[0]), Number(v[1])];
}

function decideP(c) {
  const [a, b] = vec(c);
  if (!Number.isInteger(a) || !Number.isInteger(b)) return false;
  return a <= b && BigInt(a) * BigInt(b) === TARGET_PRODUCT;
}

function makeCertificate(c) {
  const [a, b] = vec(c);
  return {
    kind: 'synthetic-P',
    v: [a, b],
    product: (BigInt(a) * BigInt(b)).toString(),
    predicate: 'v[0]*v[1] === 36 and v[0] <= v[1], decided in BigInt'
  };
}

const candidateSchema = {
  type: 'object',
  required: ['v'],
  properties: {
    v: {
      type: 'array',
      minItems: 2,
      maxItems: 2,
      items: { type: 'integer', minimum: LO, maximum: HI }
    }
  }
};

const enumSpec = { type: 'intGrid', name: 'v', ranges: [[LO, HI], [LO, HI]] };

function score(c) {
  const [a, b] = vec(c);
  const p = a * b;
  return 1 / (1 + Math.abs(p - 36));
}

function screen(c) {
  const [a, b] = vec(c);
  const dist = Math.abs(a * b - 36);
  return dist <= 12
    ? { pass: true, why: '|a*b-36|=' + dist + ' <= 12' }
    : { pass: false, why: '|a*b-36|=' + dist + ' > 12' };
}

function certify(c) {
  if (decideP(c)) {
    return { verdict: 'HIT', certificate: makeCertificate(c), why: 'P holds (BigInt exact)' };
  }
  const [a, b] = vec(c);
  return { verdict: 'REJECT', why: 'P fails: ' + a + '*' + b + '=' + (a * b) + (a > b ? ' and a > b' : ' !== 36') };
}

function recheckCertificate(c, cert) {
  if (!cert || cert.kind !== 'synthetic-P' || !Array.isArray(cert.v)) return false;
  const [a, b] = vec(c);
  if (cert.v.length !== 2 || Number(cert.v[0]) !== a || Number(cert.v[1]) !== b) return false;
  /* independent recompute, sharing nothing with certify()'s return */
  if (!Number.isInteger(a) || !Number.isInteger(b)) return false;
  if (!(a <= b)) return false;
  if (BigInt(a) * BigInt(b) !== 36n) return false;
  return cert.product === '36';
}

const PLANTED = [[2, 18], [3, 12], [4, 9], [6, 6]];
const plantedHits = PLANTED.map(v => ({ candidate: { v: v.slice() }, certificate: makeCertificate({ v: v.slice() }) }));

const knownBad = { v: [0, 0] };

function scaleInflate(c) {
  return { v: vec(c).map(x => x * 2) };
}

/* provably empty sub-box + certified exhaustion */
const emptyBox = {
  box: { name: 'v[0] in [0,20], v[1] in [0,1] (a*b <= 20 < 36 everywhere)', ranges: [[LO, HI], [0, 1]] },
  exhaust(box) {
    let checked = 0;
    for (let a = box.ranges[0][0]; a <= box.ranges[0][1]; a++) {
      for (let b = box.ranges[1][0]; b <= box.ranges[1][1]; b++) {
        const v = certify({ v: [a, b] });
        checked++;
        if (v.verdict !== 'REJECT') {
          return { exhausted: false, checked, why: 'candidate [' + a + ',' + b + '] certified ' + v.verdict + ' inside the supposedly empty box' };
        }
      }
    }
    return {
      exhausted: true,
      checked,
      certificate: {
        kind: 'exhaustion-by-complete-enumeration',
        box: box.name,
        cardinality: checked,
        allRejected: true,
        method: 'every element of the box enumerated and certified REJECT by the exact BigInt decision'
      }
    };
  }
};

module.exports = {
  candidateSchema, enumSpec,
  score, screen, certify, recheckCertificate,
  plantedHits, knownBad, scaleInflate,
  emptyBox,
  /* selftest helpers */
  decideP, makeCertificate
};
