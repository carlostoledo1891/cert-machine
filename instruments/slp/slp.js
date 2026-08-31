/* slp.js — exact audits of straight-line programs that realize linear maps.

   WHAT A CLAIM OF THIS SHAPE ASSERTS. A bilinear algorithm's cost is not its
   rank alone. A rank-23 scheme for 3x3 matrix multiplication still has to
   FORM the 23 left factors from the 9 entries of A, form 23 right factors
   from B, and combine the 23 products into the 9 entries of C. Each of those
   three jobs is a linear map, and each is realized by a straight-line program
   of two-input add/subtract gates. The headline "55 additions" is the total
   gate count of those three programs.

   So a claim like that has TWO halves, and they fail differently:

     THE TENSOR   do the factor matrices multiply 3x3 matrices at all?
                  That is Brent's equations, and instruments/strassen already
                  decides them exactly. This file does not re-implement it.
     THE CIRCUIT  does the straight-line program actually COMPUTE those factor
                  matrices, and does it really use as many gates as claimed?

   The second half is where a number like 55 lives, and it is the half a
   tensor checker cannot see. A circuit can be short and compute the wrong
   map; a circuit can compute the right map and have been miscounted. This
   file evaluates the program symbolically over the exact integers and
   compares what it computes, row by row, with the matrix it is supposed to
   realize — then counts the gates itself.

   NOTHING HERE TRUSTS A DECLARED FIELD. gate_count, total_additions and the
   factor matrices are all re-derived and compared with what the claim says.
   A certificate whose declared count disagrees with its own gate list is
   REFUTED, not corrected.

   MIT. Part of cert-machine. */
'use strict';

/* ---- evaluating a straight-line program -----------------------------------
   A circuit is { input_count, gates, outputs, gate_count }. Slots 0..n-1 are
   the inputs; every gate writes a new slot equal to

       left_sign * slot[left]  +  right_sign * slot[right]

   with the signs in {-1,+1}. Evaluating it on the standard basis gives, for
   every slot, the exact integer coefficient vector it computes. Integers
   here are tiny (the alphabet is {-1,0,1} and the depth is small), but the
   arithmetic is plain integer addition and is exact regardless. */
function evaluate(circuit) {
  const n = circuit.input_count;
  if (!Number.isInteger(n) || n < 1) throw new Error('input_count is not a positive integer');
  const slot = [];
  for (let i = 0; i < n; i++) {
    const v = new Array(n).fill(0); v[i] = 1; slot.push(v);
  }
  const gates = circuit.gates || [];
  for (let g = 0; g < gates.length; g++) {
    const t = gates[g];
    for (const s of [t.left_sign, t.right_sign]) {
      if (s !== 1 && s !== -1) throw new Error('gate ' + g + ' has sign ' + s + ', not in {-1,+1}');
    }
    /* a gate may only read slots that already exist — otherwise the "program"
       is not straight-line and the count means nothing */
    if (!(t.left >= 0 && t.left < slot.length) || !(t.right >= 0 && t.right < slot.length)) {
      throw new Error('gate ' + g + ' reads slot ' + t.left + '/' + t.right + ' before it is written');
    }
    if (t.slot !== slot.length) {
      throw new Error('gate ' + g + ' writes slot ' + t.slot + ', but the next free slot is ' + slot.length);
    }
    const L = slot[t.left], R = slot[t.right];
    const out = new Array(n);
    for (let i = 0; i < n; i++) out[i] = t.left_sign * L[i] + t.right_sign * R[i];
    slot.push(out);
  }
  const outs = (circuit.outputs || []).map((o, j) => {
    if (o.sign !== 1 && o.sign !== -1) throw new Error('output ' + j + ' has sign ' + o.sign);
    if (!(o.slot >= 0 && o.slot < slot.length)) throw new Error('output ' + j + ' reads slot ' + o.slot + ', which does not exist');
    return slot[o.slot].map((x) => o.sign * x);
  });
  return { rows: outs, slots: slot.length, gates: gates.length };
}

/** does `circuit` compute exactly the rows of `matrix`? */
function realizes(circuit, matrix) {
  let ev;
  try { ev = evaluate(circuit); }
  catch (e) { return { ok: false, why: e.message }; }
  if (ev.rows.length !== matrix.length) {
    return { ok: false, why: 'the circuit has ' + ev.rows.length + ' outputs, the matrix has ' + matrix.length + ' rows' };
  }
  for (let r = 0; r < matrix.length; r++) {
    if (matrix[r].length !== ev.rows[r].length) {
      return { ok: false, why: 'row ' + r + ' has ' + matrix[r].length + ' entries, the circuit computes ' + ev.rows[r].length };
    }
    for (let c = 0; c < matrix[r].length; c++) {
      if (ev.rows[r][c] !== matrix[r][c]) {
        return { ok: false, why: 'row ' + r + ' differs at column ' + c + ': the circuit computes '
          + ev.rows[r][c] + ', the factor matrix says ' + matrix[r][c] };
      }
    }
  }
  return { ok: true, gates: ev.gates };
}

/** the cost of forming `matrix` with no sharing at all — the number a circuit
    has to beat to be worth writing down. sum over rows of (nonzeros - 1). */
function naiveAdditions(matrix) {
  let t = 0;
  for (const row of matrix) t += Math.max(0, row.filter((x) => x !== 0).length - 1);
  return t;
}

/** every coefficient is in {-1,0,1} — what lets a scheme claim it works over
    any associative ring, commutative or not. A 2 anywhere voids that claim. */
function ternary(matrix) {
  for (const row of matrix) for (const x of row) if (x !== -1 && x !== 0 && x !== 1) return false;
  return true;
}

const transpose = (M) => M[0].map((_, j) => M.map((r) => r[j]));

/* ---- the whole claim, decided at once -------------------------------------
   `audit(cert, brent)` takes a certificate in the additive-SLP format and the
   tensor authority to use for the bilinear half, and returns one verdict over
   both halves. The three jobs are named by the certificate itself; this file
   fixes which circuit is checked against which factor matrix, because that
   pairing is the claim and letting the certificate choose it would be
   letting the claimant grade itself. */
const JOBS = [
  { job: 'U_input', circuit: 'U_input_9_to_23', factor: 'alpha_U_23x9', role: 'form the 23 left factors from the 9 entries of A' },
  { job: 'V_input', circuit: 'V_input_9_to_23', factor: 'beta_V_23x9', role: 'form the 23 right factors from the 9 entries of B' },
  { job: 'W_output', circuit: 'W_output_task_23_to_9', factor: 'gamma_task_9x23', role: 'combine the 23 products into the 9 entries of C' }
];

function audit(cert, brent) {
  const out = { verdict: 'VERIFIED', why: null, parts: [], counted: 0, declared: cert.total_additions,
    rank: cert.rank, ternary: true, naive: 0 };
  const fc = cert.factor_coefficients || {}, cir = cert.circuits || {};

  for (const j of JOBS) {
    const M = fc[j.factor], c = cir[j.circuit];
    if (!M || !c) { out.verdict = 'REFUSED'; out.why = 'the certificate has no ' + (M ? j.circuit : j.factor); return out; }
    const r = realizes(c, M);
    const actual = (c.gates || []).length;
    const part = { job: j.job, role: j.role, realizes: r.ok, why: r.why || null,
      declared: c.gate_count, actual, naive: naiveAdditions(M), ternary: ternary(M) };
    out.parts.push(part);
    out.counted += actual;
    out.naive += part.naive;
    if (!part.ternary) out.ternary = false;
    if (!r.ok) { out.verdict = 'REFUTED'; out.why = j.job + ': ' + r.why; }
    else if (c.gate_count !== actual && out.verdict === 'VERIFIED') {
      out.verdict = 'REFUTED';
      out.why = j.job + ' declares ' + c.gate_count + ' gates and lists ' + actual;
    }
  }
  if (out.verdict === 'VERIFIED' && out.counted !== cert.total_additions) {
    out.verdict = 'REFUTED';
    out.why = 'the gates count to ' + out.counted + ', the certificate declares ' + cert.total_additions;
  }

  /* the bilinear half — decided by the tensor authority, not re-implemented */
  if (brent) {
    const U = transpose(fc.alpha_U_23x9), V = transpose(fc.beta_V_23x9), W = fc.gamma_task_9x23;
    const b = brent.audit({ id: 'slp-under-audit', dims: cert.dimensions, ring: 'Q', rank: cert.rank, U, V, W });
    out.brent = { verdict: b.verdict, equations: b.equations, layout: b.layout, why: b.why || null };
    if (b.verdict !== 'VERIFIED' && out.verdict === 'VERIFIED') {
      out.verdict = 'REFUTED';
      out.why = 'the factor matrices do not multiply matrices: ' + (b.why || b.verdict);
    }
  }
  out.scalarOps = out.counted + cert.rank;
  return out;
}

module.exports = { evaluate, realizes, naiveAdditions, ternary, transpose, audit, JOBS };
