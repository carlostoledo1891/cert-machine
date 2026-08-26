#!/usr/bin/env node
'use strict';
/*
 * em-channel.js — PATH 09 P1 second micro-kernel.
 *
 * Formal fragment from Anthropic AAR "EM Posterior" idea (Alignment Science
 * Blog 2026-04-14): weak labels as noisy observations of a latent true label;
 * Bayes update under a binary channel × prior, then (in their pipeline) temper
 * and EM. We certify only the algebraic Bayes step:
 *
 *   For prior π = P(y=1), channel α = P(w=1|y=1), β = P(w=1|y=0), weak bit w:
 *     q*(w=1) = α π / (α π + β (1−π))
 *     q*(w=0) = (1−α) π / ((1−α) π + (1−β)(1−π))
 *   Residual r = |q_claimed − q*|.
 *
 * CERTIFIED iff every residual ≤ ε (default 0). No GPU. Exact BigInt rationals
 * via eqcert. Asserts NOTHING about PGR or their full EM loop / finetune.
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
    throw new Error('em-channel: probability outside [0,1]: ' + Q.toString(r));
  }
  return r;
}

function qBit(w) {
  if (w === 0 || w === 1) return w;
  if (w === '0' || w === '1') return Number(w);
  throw new Error('em-channel: weak bit must be 0 or 1');
}

/**
 * Exact Bayes posterior P(y=1 | w) under binary channel (α,β) and prior π.
 */
function bayesExact(pi, alpha, beta, weak) {
  const p = qProb(pi);
  const a = qProb(alpha);
  const b = qProb(beta);
  const w = qBit(weak);
  const oneMinusP = Q.sub(Q.ONE, p);
  if (w === 1) {
    const num = Q.mul(a, p);
    const den = Q.add(num, Q.mul(b, oneMinusP));
    if (Q.cmp(den, Q.ZERO) === 0) throw new Error('em-channel: singular channel (w=1)');
    return Q.div(num, den);
  }
  const oneMinusA = Q.sub(Q.ONE, a);
  const oneMinusB = Q.sub(Q.ONE, b);
  const num = Q.mul(oneMinusA, p);
  const den = Q.add(num, Q.mul(oneMinusB, oneMinusP));
  if (Q.cmp(den, Q.ZERO) === 0) throw new Error('em-channel: singular channel (w=0)');
  return Q.div(num, den);
}

/** Exact residual |q_claimed − Bayes(π,α,β,w)|. */
function residualExact(row) {
  const qStar = bayesExact(row.pi, row.alpha, row.beta, row.weak);
  const q = qProb(row.q);
  return Q.abs(Q.sub(q, qStar));
}

function rowPayload(row, r) {
  return {
    pi: typeof row.pi === 'object' ? Q.toString(row.pi) : String(row.pi),
    alpha: typeof row.alpha === 'object' ? Q.toString(row.alpha) : String(row.alpha),
    beta: typeof row.beta === 'object' ? Q.toString(row.beta) : String(row.beta),
    weak: qBit(row.weak),
    q: typeof row.q === 'object' ? Q.toString(row.q) : String(row.q),
    residual: Q.toString(r)
  };
}

/**
 * Dispose a finite sample of {pi, alpha, beta, weak, q} rows.
 * CERTIFIED iff every |q − Bayes| ≤ eps.
 */
function disposeSample(rows, eps) {
  const bound = eps === undefined ? Q.ZERO : qProb(eps);
  const residuals = [];
  const detail = [];
  let maxR = Q.ZERO;
  for (let i = 0; i < rows.length; i++) {
    const r = residualExact(rows[i]);
    residuals.push(Q.toString(r));
    detail.push(rowPayload(rows[i], r));
    if (Q.cmp(r, maxR) > 0) maxR = r;
  }
  const closes = Q.cmp(maxR, bound) <= 0;
  const claim = {
    statement: 'EM-channel Bayes residual |q − P(y=1|w; π,α,β)| ≤ ε on the stated finite sample',
    formalism: 'q*(w=1)=απ/(απ+β(1−π)); q*(w=0)=(1−α)π/((1−α)π+(1−β)(1−π))',
    scope: 'finite sample; algebraic Bayes step only — not PGR, not their full EM / finetune loop'
  };
  const witness = {
    kind: 'exact-residual',
    kernel: 'em-channel.js',
    payload: {
      n: rows.length,
      eps: Q.toString(bound),
      max_residual: Q.toString(maxR),
      residuals,
      rows: detail
    }
  };
  if (closes) {
    return {
      schema: 'disposition/v0',
      verdict: 'CERTIFIED',
      hack_class: null,
      refuse_reason: null,
      ground_truth_role: 'unknown',
      claim,
      witness,
      notes: 'pre-update residual; q equals exact Bayes on every row'
    };
  }
  return {
    schema: 'disposition/v0',
    verdict: 'REFUSED',
    hack_class: null,
    refuse_reason: 'max residual ' + Q.toString(maxR) + ' exceeds ε=' + Q.toString(bound),
    ground_truth_role: 'unknown',
    claim,
    witness,
    notes: 'honest stall — claimed soft labels are not Bayes under the stated channel'
  };
}

/** Build rows where q is exactly Bayes(π,α,β,w). */
function consistentSample(specs) {
  return specs.map(s => {
    const pi = qProb(s.pi);
    const alpha = qProb(s.alpha);
    const beta = qProb(s.beta);
    const weak = qBit(s.weak);
    const q = bayesExact(pi, alpha, beta, weak);
    return { pi, alpha, beta, weak, q };
  });
}

/** Default informative-channel grid used by batteries and the disagree story. */
function defaultSpecs() {
  return [
    { pi: '1/2', alpha: '4/5', beta: '1/5', weak: 1 },
    { pi: '1/2', alpha: '4/5', beta: '1/5', weak: 0 },
    { pi: '1/3', alpha: '9/10', beta: '1/10', weak: 1 },
    { pi: '1/3', alpha: '9/10', beta: '1/10', weak: 0 },
    { pi: '2/5', alpha: '3/4', beta: '1/4', weak: 1 },
    { pi: '3/5', alpha: '5/6', beta: '1/6', weak: 0 }
  ];
}

/** Plant a mutant: shift one claimed q so residual is strictly positive. */
function plantMutant(rows, index, delta) {
  const out = rows.map(r => Object.assign({}, r));
  const i = index === undefined ? 0 : index;
  const d = delta === undefined ? Q.R(1n, 10n) : qProb(delta);
  const row = out[i];
  let badQ = Q.add(qProb(row.q), d);
  if (Q.cmp(badQ, Q.ONE) > 0) badQ = Q.sub(qProb(row.q), d);
  if (Q.cmp(badQ, Q.ZERO) < 0) badQ = Q.ZERO;
  if (Q.cmp(badQ, Q.ONE) > 0) badQ = Q.ONE;
  if (Q.cmp(residualExact(Object.assign({}, row, { q: badQ })), Q.ZERO) === 0) {
    badQ = Q.cmp(qProb(row.q), Q.R(1n, 2n)) <= 0 ? Q.ONE : Q.ZERO;
  }
  out[i] = Object.assign({}, row, { q: badQ });
  return out;
}

module.exports = {
  bayesExact,
  residualExact,
  disposeSample,
  consistentSample,
  defaultSpecs,
  plantMutant,
  Q
};

if (require.main === module) {
  const sample = consistentSample(defaultSpecs());
  const ok = disposeSample(sample, Q.ZERO);
  console.log(JSON.stringify({ verdict: ok.verdict, max: ok.witness.payload.max_residual }, null, 2));
  const bad = disposeSample(plantMutant(sample), Q.ZERO);
  console.log(JSON.stringify({ verdict: bad.verdict, reason: bad.refuse_reason }, null, 2));
  process.exit(ok.verdict === 'CERTIFIED' && bad.verdict === 'REFUSED' ? 0 : 1);
}
