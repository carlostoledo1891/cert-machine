#!/usr/bin/env node
/* battery.js — the SLP instrument's gate.

   The instrument decides a two-part claim: that a straight-line program
   computes the linear map it is supposed to, and that it uses as many gates
   as it says. Both halves need forgeries that fire, and they are different
   forgeries — a circuit can be short and compute the wrong map, or compute
   the right map and have been miscounted, and a checker that only catches one
   of those is not checking the claim.

   Calibration is on a hand-verifiable circuit first, then on the audited
   certificate itself. Red controls: a flipped gate sign, a deleted gate, a
   forged gate count, a forged total, a gate reading a slot before it exists,
   a gate written out of order, a perturbed factor coefficient, and a
   coefficient of 2 (which voids the any-associative-ring claim). */
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const S = require('./slp.js');
const T = require(path.join(ROOT, 'instruments', 'strassen', 'tensor.js'));

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('PASS  ' + m); } else { fail++; console.log('FAIL  ' + m); } };
const clone = (x) => JSON.parse(JSON.stringify(x));

/* ---- 1. calibration on a circuit small enough to check by hand ----------- */
{
  const c = { input_count: 3, gate_count: 2, gates: [
    { slot: 3, left: 0, left_sign: 1, right: 1, right_sign: 1 },
    { slot: 4, left: 3, left_sign: 1, right: 2, right_sign: -1 }
  ], outputs: [{ slot: 4, sign: 1 }, { slot: 0, sign: -1 }] };
  const ev = S.evaluate(c);
  ok(JSON.stringify(ev.rows) === JSON.stringify([[1, 1, -1], [-1, 0, 0]]),
    'CALIBRATION: (x0+x1)-x2 and -x0 evaluate to exactly those coefficient vectors');
  ok(S.realizes(c, [[1, 1, -1], [-1, 0, 0]]).ok, 'the circuit realizes the matrix it computes');
  ok(!S.realizes(c, [[1, 1, 1], [-1, 0, 0]]).ok, 'and does NOT realize a matrix differing in one sign');
  ok(S.naiveAdditions([[1, 1, -1], [-1, 0, 0]]) === 2,
    'the no-sharing cost of that matrix is 2 additions (3 nonzeros - 1, then 1 nonzero - 1 = 0)');
}

/* ---- 2. the audited certificate ------------------------------------------ */
const CERT = path.join(ROOT, 'corpus', 'sources', 'add55-certificate.json');
const cert = JSON.parse(fs.readFileSync(CERT, 'utf8'));
{
  const a = S.audit(cert, T);
  ok(a.verdict === 'VERIFIED' && a.counted === 55 && a.declared === 55,
    'the 55-addition certificate: ' + a.counted + ' gates counted here, ' + a.declared + ' declared, '
    + a.parts.map(p => p.job + ' ' + p.actual).join(' / '));
  ok(a.brent && a.brent.verdict === 'VERIFIED' && a.brent.equations === 729,
    'its factor matrices multiply 3x3 matrices: all ' + (a.brent ? a.brent.equations : 0)
    + ' Brent equations hold exactly over Q (layout ' + (a.brent ? a.brent.layout : '-') + ')');
  ok(a.ternary, 'every coefficient is in {-1,0,1} — which is what lets the scheme claim any associative ring');
  ok(a.naive === 122 && a.scalarOps === 78,
    'the same three maps with no sharing cost ' + a.naive + ' additions; the circuit uses ' + a.counted
    + ', for ' + a.scalarOps + ' scalar operations including the ' + a.rank + ' multiplications');
}

/* ---- 3. RED: the circuit half -------------------------------------------- */
{
  const bad = clone(cert);
  bad.circuits.U_input_9_to_23.gates[0].left_sign *= -1;
  const a = S.audit(bad, T);
  ok(a.verdict === 'REFUTED' && /U_input/.test(a.why || ''),
    'RED: one flipped gate SIGN is REFUTED — the circuit still has 55 gates and no longer computes the factors ('
    + (a.why || '').slice(0, 52) + '…)');
}
{
  const bad = clone(cert);
  bad.circuits.V_input_9_to_23.gates.pop();
  bad.circuits.V_input_9_to_23.gate_count = 13;
  bad.total_additions = 54;
  const a = S.audit(bad, T);
  ok(a.verdict === 'REFUTED',
    'RED: deleting a gate and consistently renumbering to a CHEAPER total is still REFUTED — the map breaks');
}
{
  const bad = clone(cert);
  bad.circuits.W_output_task_23_to_9.gate_count = 20;
  const a = S.audit(bad, T);
  ok(a.verdict === 'REFUTED' && /declares 20 gates and lists 28/.test(a.why || ''),
    'RED: a forged per-circuit gate count is REFUTED — the declared field is never taken on trust');
}
{
  const bad = clone(cert);
  bad.total_additions = 51;
  const a = S.audit(bad, T);
  ok(a.verdict === 'REFUTED' && /count to 55/.test(a.why || ''),
    'RED: a forged TOTAL is REFUTED — the headline number is re-derived from the gate lists');
}
{
  const bad = clone(cert);
  bad.circuits.U_input_9_to_23.gates[0].left = 99;
  const a = S.audit(bad, T);
  ok(a.verdict === 'REFUTED' && /before it is written|does not exist/.test(a.why || ''),
    'RED: a gate reading a slot that does not exist is REFUTED, not silently skipped');
}
{
  const bad = clone(cert);
  bad.circuits.U_input_9_to_23.gates[5].slot = 40;
  const a = S.audit(bad, T);
  ok(a.verdict === 'REFUTED' && /writes slot 40/.test(a.why || ''),
    'RED: a gate written out of order is REFUTED — a program that is not straight-line has no honest gate count');
}

/* ---- 4. RED: the bilinear half ------------------------------------------- */
{
  const bad = clone(cert);
  bad.factor_coefficients.gamma_task_9x23[0][0] += 1;
  const a = S.audit(bad, T);
  ok(a.verdict === 'REFUTED',
    'RED: one perturbed factor coefficient is REFUTED — caught by the circuit, the tensor, or both');
}
{
  const bad = clone(cert);
  bad.factor_coefficients.alpha_U_23x9[0] = bad.factor_coefficients.alpha_U_23x9[0].map((x, i) => (i === 0 ? 2 : x));
  const a = S.audit(bad, T);
  ok(!a.ternary || a.verdict === 'REFUTED',
    'RED: a coefficient of 2 is caught — it would void the any-associative-ring claim even if the tensor held');
}

console.log('slp battery: ' + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
