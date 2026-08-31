/* targets.js — the bilinear target tensors, in ONE place.

   The generation front grades a proposal by how far it is from a target
   tensor. Until now that target was hard-wired to matrix multiplication.
   It never needed to be: `residual` only ever asked "which (a,b,c) does the
   target set to 1", so a target is nothing more than a triple of dimensions
   and a list of ones.

   This file is that list, for every family the front can attack, and it is
   the ONLY definition of it in the search path. (The certifier in
   instruments/bilinear derives the same tensors a SECOND time, by literal
   polynomial arithmetic instead of an index formula — that is deliberate
   and is cross-checked in its battery. Two independent derivations asserted
   equal is evidence; one rule copied into two files is the divergence bug
   CLAUDE.md warns about. The difference is that here the copy is CHECKED.)

   THE FAMILIES, in Wang's naming (arXiv:2603.07280), where the operands each
   carry n coefficients, i.e. degree n-1:

     matmul <n,m,p>   C = A·B
     P_n              full product, 2n-1 coefficients out
     T_n              truncated (short) product: the low n coefficients only
     C_n              cyclic product, modulo X^n - 1
     C_n^-            negacyclic product, modulo X^n + 1

   OVER F2 THE NEGACYCLIC PRODUCT IS THE CYCLIC PRODUCT. X^n + 1 = X^n - 1
   in characteristic 2, so C_n^- and C_n are the same tensor and there is
   nothing separate to search. That is why Wang lists C_9^- over F3 and never
   over F2, and this file states it rather than leaving a reader to wonder.

   MIT. Part of cert-machine. */
'use strict';

function make(name, statement, na, nb, nc, triples) {
  return { name, statement, na, nb, nc, triples };
}

/* ---- matrix multiplication ------------------------------------------------
   the layout convention, stated rather than assumed:
     a = i*m + j,  b = j*p + k,  c = k*n + i   (the transposed C layout) */
function matmul(n, m, p) {
  const triples = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) for (let k = 0; k < p; k++) {
    triples.push([i * m + j, j * p + k, k * n + i]);
  }
  return make('<' + n + ',' + m + ',' + p + '>',
    'a rank-r decomposition of the <' + n + ',' + m + ',' + p + '> matrix multiplication tensor over F2',
    n * m, m * p, p * n, triples);
}

/* ---- polynomial products --------------------------------------------------
   operands A = sum_{i<n} a_i X^i and B = sum_{j<n} b_j X^j. The product term
   a_i b_j lands on X^{i+j}; each family then says what happens to it. */

/** P_n: the full product, nothing folded away */
function polyFull(n) {
  const triples = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) triples.push([i, j, i + j]);
  return make('P' + n, 'a rank-r bilinear algorithm for the full product of two degree-' + (n - 1)
    + ' polynomials over F2', n, n, 2 * n - 1, triples);
}

/** T_n: the truncated (short) product — coefficients n and above are discarded */
function polyTrunc(n) {
  const triples = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i + j < n) triples.push([i, j, i + j]);
  return make('T' + n, 'a rank-r bilinear algorithm for the truncated product of two degree-' + (n - 1)
    + ' polynomials over F2 (the low ' + n + ' coefficients)', n, n, n, triples);
}

/** C_n: the cyclic product, modulo X^n - 1 — coefficients wrap */
function polyCyclic(n) {
  const triples = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) triples.push([i, j, (i + j) % n]);
  return make('C' + n, 'a rank-r bilinear algorithm for the cyclic product of two degree-' + (n - 1)
    + ' polynomials over F2, modulo X^' + n + ' - 1', n, n, n, triples);
}

/** C_n^-: negacyclic. Over F2 this IS C_n; the alias exists so a caller who
    asks for it gets the right tensor and is told why it is not a new one. */
function polyNega(n) {
  const t = polyCyclic(n);
  return make('C' + n + '-', t.statement + ' (negacyclic; over F2, X^' + n + ' + 1 = X^' + n
    + ' - 1, so this is the cyclic tensor)', t.na, t.nb, t.nc, t.triples);
}

/* ---- parsing a target from the command line ------------------------------- */
const FAMILIES = { P: polyFull, T: polyTrunc, C: polyCyclic };

/**
 * parse('3,3,3') / parse('<3,3,3>')  -> matmul <3,3,3>
 * parse('T8')     -> truncated product of two 8-coefficient polynomials
 * parse('C10') / parse('P6') / parse('C9-')
 */
function parse(spec) {
  /* '<n,m,p>' is how a target NAMES itself, 'n,m,p' is how a command line
     spells it — both parse, so a name that came back out of a claim can be
     handed straight back in. */
  const s = String(spec).trim().replace(/^<(.+)>$/, '$1');
  if (/^\d+(,\d+){2}$/.test(s)) return matmul(...s.split(',').map(Number));
  const m = /^([PTC])(\d+)(-?)$/i.exec(s);
  if (!m) throw new Error('unrecognised target "' + spec + '" — use n,m,p or P<n>, T<n>, C<n>, C<n>-');
  const n = Number(m[2]);
  if (n < 1) throw new Error('target size must be at least 1');
  if (m[3]) {
    if (m[1].toUpperCase() !== 'C') throw new Error('only the cyclic family has a negacyclic variant');
    return polyNega(n);
  }
  return FAMILIES[m[1].toUpperCase()](n);
}

/** is this target a matrix multiplication tensor? (chooses the certifier) */
const isMatmul = (t) => /^<\d+,\d+,\d+>$/.test(t.name);
/** the dimensions of a matmul target, for the instruments that need them */
const matmulDims = (t) => t.name.slice(1, -1).split(',').map(Number);

module.exports = { make, matmul, polyFull, polyTrunc, polyCyclic, polyNega, parse, isMatmul, matmulDims };
