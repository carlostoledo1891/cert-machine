/* certificate.js — what a certificate IS, made structural.

   This file is the reason the toolkit exists. Everything else here is
   arithmetic; this is the discipline.

   A certificate is not a number that came out small. It is a claim, the
   evidence for it, the assumptions it rests on, and — the part everyone
   skips — **the input that would make it fail**. A check whose honest answer
   to "what would make this go red?" is "nothing" is decoration, and this
   repository has shipped decoration before: eight passing assertions of which
   three were algebraic tautologies that would have passed on white noise.

   So the constructor REFUSES to build a certificate without a falsifier. You
   cannot forget, because the code will not let you. That is the single design
   decision in this library.

   Two further rules are enforced rather than documented:

     - A certificate whose verdict is PROVED must carry evidence. A bare
       assertion is not a proof.
     - ASSUMED facts are separated from CHECKED ones and printed differently.
       "m > 0 was verified over the enclosure" and "m > 0 was assumed" are
       different statements and must never render the same way.

   MIT licensed. Part of eqcert. */
'use strict';

const PROVED = 'PROVED';
const REFUSED = 'REFUSED';
const NOT_CHECKED = 'NOT_CHECKED';

function req(v, what) {
  if (v === undefined || v === null) throw new Error('Certificate: ' + what + ' is required');
  if (typeof v === 'string' && v.trim() === '') throw new Error('Certificate: ' + what + ' must not be empty');
  if (Array.isArray(v) && v.length === 0) throw new Error('Certificate: ' + what + ' must not be empty');
  return v;
}

class Certificate {
  /* opts:
       claim       string   — what is asserted, in words a reader can check
       verdict     PROVED | REFUSED | NOT_CHECKED
       falsifier   string|string[] — REQUIRED. what input would make this fail.
       evidence    object   — the numbers. required when verdict is PROVED.
       assumes     string[] — facts taken as hypotheses, NOT checked here
       provenance  object   — {file, sha256, ...} so the reader can find the code
       why         string   — required when verdict is REFUSED                */
  constructor(opts) {
    opts = opts || {};
    this.claim = req(opts.claim, 'claim');
    this.verdict = req(opts.verdict, 'verdict');
    if ([PROVED, REFUSED, NOT_CHECKED].indexOf(this.verdict) < 0)
      throw new Error('Certificate: unknown verdict ' + this.verdict);

    /* THE RULE THIS LIBRARY EXISTS FOR. */
    this.falsifier = req(opts.falsifier, 'falsifier — a certificate that cannot go red is decoration');
    if (typeof this.falsifier === 'string') this.falsifier = [this.falsifier];

    this.assumes = opts.assumes || [];
    this.provenance = opts.provenance || {};
    this.evidence = opts.evidence || {};
    this.why = opts.why || '';

    if (this.verdict === PROVED && Object.keys(this.evidence).length === 0)
      throw new Error('Certificate: a PROVED verdict must carry evidence');
    if (this.verdict === REFUSED && !this.why)
      throw new Error('Certificate: a REFUSED verdict must say why');
  }

  get proved() { return this.verdict === PROVED; }

  /* A one-line summary safe to put in a status bar. Never says "converged". */
  line() {
    if (this.verdict === PROVED) {
      const ev = Object.keys(this.evidence).map(k => k + ' ' + fmt(this.evidence[k])).join(' · ');
      return 'PROVED — ' + this.claim + (ev ? '  [' + ev + ']' : '');
    }
    if (this.verdict === REFUSED) return 'NOT PROVED — ' + this.why + ' (nothing is claimed)';
    return 'NOT CHECKED — ' + this.claim;
  }

  /* The full text. Assumptions and falsifiers are printed for PROVED
     certificates too — especially for those, since that is when a reader is
     most likely to stop reading. */
  report() {
    const L = [];
    L.push(this.verdict + ': ' + this.claim);
    const ek = Object.keys(this.evidence);
    if (ek.length) {
      L.push('  evidence');
      for (const k of ek) L.push('    ' + k.padEnd(22) + fmt(this.evidence[k]));
    }
    if (this.why) L.push('  reason        ' + this.why);
    if (this.assumes.length) {
      L.push('  ASSUMED (not checked here)');
      for (const a of this.assumes) L.push('    · ' + a);
    }
    L.push('  falsified by');
    for (const f of this.falsifier) L.push('    · ' + f);
    const pk = Object.keys(this.provenance);
    if (pk.length) {
      L.push('  provenance');
      for (const k of pk) L.push('    ' + k.padEnd(22) + this.provenance[k]);
    }
    return L.join('\n');
  }

  toJSON() {
    return {
      claim: this.claim, verdict: this.verdict, evidence: this.evidence,
      assumes: this.assumes, falsifier: this.falsifier,
      provenance: this.provenance, why: this.why
    };
  }
}

function fmt(v) {
  if (typeof v === 'number') {
    if (!isFinite(v)) return String(v);
    if (v === 0) return '0';
    const a = Math.abs(v);
    if (a < 1e-4 || a >= 1e6) return v.toExponential(3);
    return String(Number(v.toPrecision(10)));
  }
  if (Array.isArray(v) && v.length === 2 && typeof v[0] === 'number')
    return '[' + fmt(v[0]) + ', ' + fmt(v[1]) + ']';   /* an interval */
  return String(v);
}

const proved = o => new Certificate(Object.assign({}, o, { verdict: PROVED }));
const refused = o => new Certificate(Object.assign({}, o, { verdict: REFUSED }));
const notChecked = o => new Certificate(Object.assign({}, o, { verdict: NOT_CHECKED }));

module.exports = { Certificate, proved, refused, notChecked, PROVED, REFUSED, NOT_CHECKED, fmt };
