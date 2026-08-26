#!/usr/bin/env node
'use strict';
/*
 * swap-consistency.js — PATH 09 Phase-1 micro-kernel.
 *
 * Formal fragment from Anthropic AAR "CCS + Evolution Strategy Refinement"
 * pseudocode (chat PGR 0.93; their SOTA is CCS + Self-Distill — Alignment
 * Science Blog, April 2026): for binary preference probabilities under an
 * exact A/B swap,
 *
 *   p_sc = (p_orig + (1 - p_swap)) / 2
 *
 * is an algebraic consistency projector. The pre-update residual
 *
 *   r = |p_orig - (1 - p_swap)|
 *
 * is what we certify (house rule: pre-update residuals only). Exact swap of a
 * consistent pair gives r = 0; the projector is then the identity.
 *
 * No GPU. Exact BigInt rationals via eqcert (single source). Interval check is
 * a belt-and-suspenders enclosure of the same residual on float witnesses.
 *
 * This module asserts NOTHING about PGR. It only disposes the algebraic fragment.
 */
const path = require('path');
const fs = require('fs');
/** Monorepo: research/alien-science → ../../../eqcert. Public: technical-reports/alien-science → ../../eqcert. */
function requireEqcert(mod) {
  const cands = [
    path.join(__dirname, '..', '..', '..', 'core', 'interval', mod),
    path.join(__dirname, '..', '..', 'core', 'interval', mod)
  ];
  for (const p of cands) {
    if (fs.existsSync(p)) return require(p);
  }
  throw new Error('eqcert/' + mod + ' not found from ' + __dirname);
}
const Q = requireEqcert('rational.js');
const I = requireEqcert('interval.js');

function qProb(x) {
  let r;
  if (typeof x === 'object' && x && 'n' in x) {
    r = x;
  } else if (typeof x === 'string' && x.includes('/')) {
    const [ns, ds] = x.split('/');
    r = Q.R(BigInt(ns.trim()), BigInt(ds.trim()));
  } else if (typeof x === 'string' && /^-?\d+$/.test(x.trim())) {
    r = Q.R(BigInt(x.trim()));
  } else {
    r = Q.fromDouble(Number(x));
  }
  if (Q.cmp(r, Q.ZERO) < 0 || Q.cmp(r, Q.ONE) > 0) {
    throw new Error('swap-consistency: probability outside [0,1]: ' + Q.toString(r));
  }
  return r;
}

/** Exact residual |p_orig - (1 - p_swap)| as a rational. */
function residualExact(pOrig, pSwap) {
  const p = qProb(pOrig);
  const s = qProb(pSwap);
  const oneMinusSwap = Q.sub(Q.ONE, s);
  return Q.abs(Q.sub(p, oneMinusSwap));
}

/** Projector p_sc = (p_orig + (1 - p_swap)) / 2, exact. */
function projectExact(pOrig, pSwap) {
  const p = qProb(pOrig);
  const s = qProb(pSwap);
  const sum = Q.add(p, Q.sub(Q.ONE, s));
  return Q.div(sum, Q.R(2n));
}

/**
 * Dispose a finite sample of (p_orig, p_swap) pairs.
 * CERTIFIED iff every residual ≤ eps (exact rational comparison).
 * Default eps = 0 (exact consistency).
 */
function disposeSample(pairs, eps) {
  const bound = eps === undefined ? Q.ZERO : qProb(eps);
  const residuals = [];
  let maxR = Q.ZERO;
  for (let i = 0; i < pairs.length; i++) {
    const [po, ps] = pairs[i];
    const r = residualExact(po, ps);
    residuals.push(Q.toString(r));
    if (Q.cmp(r, maxR) > 0) maxR = r;
  }
  const closes = Q.cmp(maxR, bound) <= 0;
  if (closes) {
    return {
      schema: 'disposition/v0',
      verdict: 'CERTIFIED',
      hack_class: null,
      refuse_reason: null,
      ground_truth_role: 'unknown',
      claim: {
        statement: 'swap-consistency residual |p_orig-(1-p_swap)| ≤ ε on the stated finite sample',
        formalism: 'p_sc=(p_orig+(1-p_swap))/2',
        scope: 'finite sample; algebraic projector only — not a PGR claim'
      },
      witness: {
        kind: 'exact-residual',
        kernel: 'swap-consistency.js',
        payload: {
          n: pairs.length,
          eps: Q.toString(bound),
          max_residual: Q.toString(maxR),
          residuals
        }
      },
      notes: 'pre-update residual; projector is identity on exact-consistent pairs'
    };
  }
  return {
    schema: 'disposition/v0',
    verdict: 'REFUSED',
    hack_class: null,
    refuse_reason: 'max residual ' + Q.toString(maxR) + ' exceeds ε=' + Q.toString(bound),
    ground_truth_role: 'unknown',
    claim: {
      statement: 'swap-consistency residual |p_orig-(1-p_swap)| ≤ ε on the stated finite sample',
      formalism: 'p_sc=(p_orig+(1-p_swap))/2',
      scope: 'finite sample; algebraic projector only — not a PGR claim'
    },
    witness: {
      kind: 'exact-residual',
      kernel: 'swap-consistency.js',
      payload: {
        n: pairs.length,
        eps: Q.toString(bound),
        max_residual: Q.toString(maxR),
        residuals
      }
    },
    notes: 'honest stall — sample is not swap-consistent under stated ε'
  };
}

/** Interval enclosure of |p_orig - (1 - p_swap)| for float witnesses. */
function residualInterval(pOrig, pSwap) {
  const p = I.iv(Number(pOrig));
  const s = I.iv(Number(pSwap));
  const oneMinus = I.sub(I.ONE, s);
  return I.abs(I.sub(p, oneMinus));
}

function disposeSampleInterval(pairs, epsHi) {
  const eps = epsHi === undefined ? 0 : Number(epsHi);
  let maxHi = 0;
  const enclosures = [];
  for (const [po, ps] of pairs) {
    const iv = residualInterval(po, ps);
    enclosures.push([iv[0], iv[1]]);
    if (iv[1] > maxHi) maxHi = iv[1];
  }
  if (maxHi <= eps) {
    return { closes: true, max_hi: maxHi, enclosures };
  }
  return { closes: false, max_hi: maxHi, enclosures };
}

/** Build an exact-consistent sample: p_swap := 1 - p_orig. */
function consistentSample(probs) {
  return probs.map(p => {
    const r = qProb(p);
    return [r, Q.sub(Q.ONE, r)];
  });
}

/** Plant a mutant: shift one p_swap so residual is strictly positive. */
function plantMutant(pairs, index, delta) {
  const out = pairs.map(pr => pr.slice());
  const i = index === undefined ? 0 : index;
  const d = delta === undefined ? Q.R(1n, 10n) : qProb(delta);
  const [po, ps] = out[i];
  /* Prefer pushing swap toward 1; if already at 1, push toward 0. */
  let badSwap = Q.add(ps, d);
  if (Q.cmp(badSwap, Q.ONE) > 0) badSwap = Q.sub(ps, d);
  if (Q.cmp(badSwap, Q.ZERO) < 0) badSwap = Q.ZERO;
  if (Q.cmp(badSwap, Q.ONE) > 0) badSwap = Q.ONE;
  if (Q.cmp(residualExact(po, badSwap), Q.ZERO) === 0) {
    badSwap = Q.cmp(po, Q.R(1n, 2n)) <= 0 ? Q.ONE : Q.ZERO;
  }
  out[i] = [po, badSwap];
  return out;
}

module.exports = {
  residualExact,
  projectExact,
  disposeSample,
  residualInterval,
  disposeSampleInterval,
  consistentSample,
  plantMutant,
  Q
};

if (require.main === module) {
  const sample = consistentSample([0, 0.25, 0.5, 0.75, 1, 1 / 3, 2 / 7]);
  const ok = disposeSample(sample, Q.ZERO);
  console.log(JSON.stringify({ verdict: ok.verdict, max: ok.witness.payload.max_residual }, null, 2));
  const bad = disposeSample(plantMutant(sample), Q.ZERO);
  console.log(JSON.stringify({ verdict: bad.verdict, reason: bad.refuse_reason }, null, 2));
  process.exit(ok.verdict === 'CERTIFIED' && bad.verdict === 'REFUSED' ? 0 : 1);
}
