/* target.js — the problem adapter for a certified-funnel instance.
   Copy this skeleton into research/probes/<slug>/, fill every TODO, and run
     node research/_engine/funnel/funnel.js research/probes/<slug> --seed <s>

   THE CONTRACT (funnel.js loads exactly these exports):

     candidateSchema      declarative validation for candidates (subset of
                          JSON Schema: object/array/integer/number/string/
                          boolean/enum with min/max bounds)
     score(c) -> number   float, STEERING ONLY — orders the leaderboard and
                          feeds evolve/llm; it has no path to admit anything
     screen(c) -> {pass, why}
                          cheap float prune — may prune, never admit; its
                          rejections are sampled and certified by the reject
                          audit every run
     certify(c) -> {verdict: 'HIT'|'REJECT'|'REFUSED', certificate?, why}
                          the ONLY authority. Ride the house instruments
                          (core/interval, exact BigInt/rational decisions) —
                          never floats. REFUSED is the honest third verdict
                          when the instrument cannot decide.
     recheckCertificate(c, cert) -> boolean
                          INDEPENDENT recompute of the certificate. Without
                          it certify() is single-sourced and a sabotaged
                          certifier cannot be caught — declare one.
     plantedHits          [{candidate, certificate?}] known-certified
                          candidates. The recall control refuses to start any
                          run in which one fails screen or certify.
     knownBad             a candidate that must NOT certify HIT and must
                          score strictly below every planted hit
     scaleInflate(c) -> c'
                          the target's declared scale transform; the score
                          battery refuses any score it can raise
     enumSpec             {type:'intGrid', name, ranges:[[lo,hi],...]} — the
                          enumerable box. Required for the enum generator and
                          therefore for the MANDATORY dumb-baseline control
                          of every non-enum run.
     emptyBox (optional)  {box, exhaust(box) -> {exhausted, checked,
                          certificate}} for certified-empty-box RECORDs */
'use strict';

/* TODO: require house instruments as needed, e.g.
   const IV = require('#instruments/interval/interval.js'); */

const candidateSchema = {
  type: 'object',
  required: ['v'],
  properties: {
    v: { type: 'array', minItems: 2, maxItems: 2, items: { type: 'integer', minimum: 0, maximum: 100 } } /* TODO */
  }
};

const enumSpec = { type: 'intGrid', name: 'v', ranges: [[0, 100], [0, 100]] }; /* TODO */

function score(c) {
  /* TODO: float closeness-to-interesting. Must be total (defined on every
     schema-valid candidate AND on scaleInflate of any probe point). */
  throw new Error('TODO: implement score');
}

function screen(c) {
  /* TODO: cheap float prune. Return {pass:boolean, why:string}. */
  throw new Error('TODO: implement screen');
}

function certify(c) {
  /* TODO: exact decision. HIT requires a certificate object. */
  throw new Error('TODO: implement certify');
}

function recheckCertificate(c, cert) {
  /* TODO: recompute the certified property from c INDEPENDENTLY of certify()
     and cross-check cert's own fields. Return boolean. */
  throw new Error('TODO: implement recheckCertificate');
}

const plantedHits = [
  /* TODO: at least one known-certified candidate, e.g.
     { candidate: { v: [/ * ... * /] }, certificate: { / * ... * / } } */
];

const knownBad = { v: [0, 0] }; /* TODO */

function scaleInflate(c) {
  /* TODO: the scale/amplitude transform your score must not reward */
  return { v: c.v.map(x => x * 2) };
}

/* OPTIONAL — delete if the instance has no provably empty sub-box */
const emptyBox = {
  box: { name: 'TODO: name the sub-box in plain words', ranges: [[0, 0], [0, 0]] },
  exhaust(box) {
    /* TODO: enumerate EVERY element of the box, certify each, return
       {exhausted:true, checked:N, certificate:{...}} only if all REJECT */
    throw new Error('TODO: implement exhaust');
  }
};

module.exports = {
  candidateSchema, enumSpec,
  score, screen, certify, recheckCertificate,
  plantedHits, knownBad, scaleInflate,
  emptyBox
};
