#!/usr/bin/env node
/* zq-recount.js — Track A lane 1 on the claim "Z is Diophantine in Q" (Glazer et al., 2026-11-05):
   the ambient variable count and the root expression-height bound of their saved polynomial P_*, re-derived.
   Writes certs/zq-recount.json; `--check` re-derives it and refuses on any difference.

   THE THEOREM IS UNDECIDED HERE. The main Lean target is unproved (`sorry`); this tool decides two finite numbers
   about the artifact and nothing about its zero set.

   THE CLAIM: P_* in Z[X_0..X_292890231904] (292,890,231,905 ambient variables = the input t + 292,890,231,904
   rational witnesses) with root expression height 256, specified by construction/ordinary-integer-definition.json
   (sha256 4d639d4c…) at github.com/elliotglazer/diophantine-z-q @ 97cec7fd. Pre-registered in
   notes/zq-preregistration-2026-11-06.md before this file ran.

   CLEAN ROOM: written from the JSON's own `definitions` block and the manuscript's prose (TeX sec:syntax,
   sec:size, app:literal; construction/z-in-q-polynomial-size-bound-proof.txt §2). No line of their .js or .py is
   copied, ported or read. Every count is derived from STRUCTURE (which slots the nodes read, which blocks the calls
   claim, with block lengths from OUR derived counts of the callee); the declared counts are only compared.

   Their bytes stay in their clone (unlicensed material is never copied here): the clone is read from $ZQ_REPO,
   default ~/Projects/zq-scout/diophantine-z-q; without it, or with other bytes, the tool refuses.

   usage: node tools/zq-recount.js [--check] */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const REPO = process.env.ZQ_REPO || path.join(os.homedir(), 'Projects', 'zq-scout', 'diophantine-z-q');
const OUT = path.join(ROOT, 'certs', 'zq-recount.json');
const die = (m) => { console.error('zq-recount: ' + m); process.exit(1); };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

const PIN = {
  repository: 'github.com/elliotglazer/diophantine-z-q',
  commit: '97cec7fdd757d9a8e4f468151a47a6d3610fb2f2',
  definition: { path: 'construction/ordinary-integer-definition.json', sha256: '4d639d4c44e69ea360d36d4591b8fdc82269d68b9363af0157d1e5c1174c7af6' },
  bounds: { path: 'construction/ordinary-integer-polynomial-size-bounds.json', sha256: 'dfef3ff3da641814edf62f9992cb7a27aa0a770deccc95b084a65751289dbd9e' },
  frozenLean: { path: 'lean/Frozen/BoundedIntegerPolynomial.lean', sha256: '0889579ae56e75eca811af520eb4e18c9f697e163db408771b93fdbc651a95b9' },
  tex: { path: 'diophantine_zq.tex', sha256: 'cb1148cd6c7769d2af3f1636b60ff0ada4b40431978d1e98d0c339274b3d792b' },
  sizeBoundProof: { path: 'construction/z-in-q-polynomial-size-bound-proof.txt', sha256: '0ab03b116bab829cb9b8dbaea5ecd811d728ccf95345228a85a4fe37527b050e' },
};
const CLAIM = { ambient: 292890231905n, witnesses: 292890231904n, rootHeight: 256 };
const UNDECIDED = 'The theorem (Z is Diophantine in Q) is undecided here: the main Lean target lean/Frozen/BoundedIntegerPolynomial.lean is unproved (its proof is `sorry`) and nothing in this record decides it. This record decides two finite numbers about the saved artifact: its ambient variable count and its root expression-height bound.';

class Refuse extends Error {}
const refuse = (m) => { throw new Refuse(m); };
const isNat = (x) => Number.isSafeInteger(x) && x >= 0;
const nat = (x, what) => { if (!isNat(x)) refuse(what + ' is not a safe non-negative integer: ' + JSON.stringify(x)); return x; };
const asBig = (x) => (Number.isSafeInteger(x) ? BigInt(x) : null);   /* a declared count; absent or unsafe reads as null */
const bitlen = (s) => { let v = BigInt(s); if (v < 0n) v = -v; return v === 0n ? 0 : v.toString(2).length; };

/* ---------------------------------------------------------------------------------------------------------------
   THE READER. Semantics (their `definitions` block, quoted where load-bearing):
   - libraryCallBinding: "For a callee with p parameter variables, replace its variables 0,...,p-1 by the supplied
     scalar expressions; replace its variable p+j by the caller variable witnessStart+j."  So a call claims the
     private block [witnessStart, witnessStart + W(callee)), W = the callee's witness count, which WE derive.
   - expressionSemantics: "All calls mean literal polynomial substitution with disjoint witness blocks."
   - pointReferences: s >= 0 means variables s..s+4; -1 = (1,0,0,0,0); -2 = (0,g0,-145,g1,g2); -3 = (0,g0,-145,-g1,-g2).
   - heights (size-bound proof §2, TeX lines 6386-6425): var 0, const 1, add/mul/finite constructor 1 + max input,
     template call 1 + callee + max argument; composition calls are renamings (charge 0), sum of squares +2,
     product +1; model recipes charge a callee 1 + callee + 2 and their constraints sum of squares +2, with the
     generator equations and root differences at the stated safe bound 4.
   ------------------------------------------------------------------------------------------------------------- */
function derive(spec) {
  const lib = spec && spec.library;
  if (!lib || !Array.isArray(lib.templates) || !spec.recipes || typeof spec.recipes !== 'object') refuse('no library.templates or recipes');
  const templates = lib.templates, recipes = spec.recipes;
  const recipeOrder = Object.keys(recipes);
  const problems = [];               /* structural failures: any one makes the count undetermined → REFUSED */
  const mismatches = [];             /* declared field ≠ derived value (reported; a structural problem if it moves a block) */
  const T = [];                      /* per-template results, by index */
  const R = {};                      /* per-recipe results, by name */
  const inProgress = new Set();
  const constNodes = { total: 0, distinct: new Set(), reached: 0, maxBits: 0 };
  const constructorNodes = { total: 0, byOp: {}, reached: 0 };
  const fixedExpressions = { fixed_integer: [], psi_component: [], finite_guard_product: [] };

  /* exact tiling of [lo, ?) by intervals {start:Number, len:BigInt, what}; returns the end, records problems */
  function tile(owner, lo, intervals) {
    intervals.sort((a, b) => a.start - b.start || (a.len < b.len ? -1 : a.len > b.len ? 1 : 0));
    let cursor = BigInt(lo), overlaps = 0, gaps = 0, below = 0;
    const firstFew = [];
    for (const iv of intervals) {
      const s = BigInt(iv.start), e = s + iv.len;
      if (s < BigInt(lo)) { below++; if (firstFew.length < 3) firstFew.push('slot ' + s + ' (' + iv.what + ') is inside the parameters [0,' + lo + ')'); continue; }
      if (s < cursor) { overlaps++; if (firstFew.length < 3) firstFew.push('overlap at ' + s + ' (' + iv.what + ') before ' + cursor); }
      else if (s > cursor) { gaps++; if (firstFew.length < 3) firstFew.push('gap [' + cursor + ',' + s + ') before ' + iv.what); }
      if (e > cursor) cursor = e;
    }
    if (overlaps || gaps || below) problems.push({ object: owner, kind: overlaps ? 'overlap' : gaps ? 'gap' : 'parameter-slot', overlaps, gaps, insideParameters: below, first: firstFew });
    return cursor;
  }

  function template(ti) {
    if (T[ti]) return T[ti];
    if (!isNat(ti) || ti >= templates.length) refuse('call to a template that does not exist: ' + ti);
    if (inProgress.has('t' + ti)) refuse('template call cycle at ' + ti);
    inProgress.add('t' + ti);
    const t = templates[ti], name = t.name, pc = nat(t.parameterCount, name + '.parameterCount');
    const nodes = t.nodes;
    if (!Array.isArray(nodes) || !nodes.length) refuse(name + ' has no nodes');
    const root = nat(t.root, name + '.root');
    if (root >= nodes.length) refuse(name + '.root is out of range');
    const h = new Array(nodes.length);
    const ownSlots = new Set(), intervals = [], calls = [];
    const earlierOnly = { ok: true };
    for (let i = 0; i < nodes.length; i++) {
      const nd = nodes[i], a = nd.args;
      if (!Array.isArray(a)) refuse(name + ' node ' + i + ' has no args');
      const inp = (k) => { const j = nat(a[k], name + ' node ' + i + ' arg ' + k); if (j >= i) refuse(name + ' node ' + i + ' reads node ' + j + ', not an earlier one'); return j; };
      switch (nd.op) {
        case 'const':
          if (a.length !== 1 || typeof a[0] !== 'string' || !/^-?\d+$/.test(a[0])) refuse(name + ' node ' + i + ' const is not a decimal integer');
          h[i] = 1; constNodes.total++; constNodes.distinct.add(a[0]); constNodes.maxBits = Math.max(constNodes.maxBits, bitlen(a[0]));
          break;
        case 'var': {
          if (a.length !== 1) refuse(name + ' node ' + i + ' var arity');
          const v = nat(a[0], name + ' node ' + i + ' var index');
          if (v >= pc) ownSlots.add(v);
          h[i] = 0; break;
        }
        case 'add': case 'mul':
          if (a.length !== 2) refuse(name + ' node ' + i + ' ' + nd.op + ' arity');
          h[i] = 1 + Math.max(h[inp(0)], h[inp(1)]); break;
        case 'call': {
          if (a.length < 2) refuse(name + ' node ' + i + ' call arity');
          const ci = nat(a[0], name + ' node ' + i + ' callee');
          if (ci >= ti) earlierOnly.ok = false;
          const callee = template(ci);
          const params = a.slice(1, -1).map((_, k) => inp(k + 1));
          if (params.length !== callee.parameterCount) refuse(name + ' node ' + i + ' passes ' + params.length + ' arguments to ' + callee.name + ' (' + callee.parameterCount + ' parameters)');
          const ws = nat(a[a.length - 1], name + ' node ' + i + ' witnessStart');
          intervals.push({ start: ws, len: callee.W, what: 'call ' + callee.name + ' (node ' + i + ')' });
          calls.push({ node: i, callee: ci, start: ws, len: callee.W, params });
          h[i] = 1 + callee.height + (params.length ? Math.max(...params.map((j) => h[j])) : 0);
          break;
        }
        case 'fixed_integer':
          if (a.length !== 1) refuse(name + ' node ' + i + ' fixed_integer arity');
          fixedExpressions.fixed_integer.push(a[0]); constructorNodes.total++; constructorNodes.byOp[nd.op] = (constructorNodes.byOp[nd.op] || 0) + 1;
          h[i] = 1; break;
        case 'psi_component': {
          if (a.length !== 6 || (a[5] !== 0 && a[5] !== 1)) refuse(name + ' node ' + i + ' psi_component shape');
          fixedExpressions.psi_component.push(a[0]); constructorNodes.total++; constructorNodes.byOp[nd.op] = (constructorNodes.byOp[nd.op] || 0) + 1;
          h[i] = 1 + Math.max(...[1, 2, 3, 4].map((k) => h[inp(k)])); break;
        }
        case 'finite_guard_product': {
          if (a.length !== 16) refuse(name + ' node ' + i + ' finite_guard_product shape');
          fixedExpressions.finite_guard_product.push(a[0]); constructorNodes.total++; constructorNodes.byOp[nd.op] = (constructorNodes.byOp[nd.op] || 0) + 1;
          h[i] = 1 + Math.max(...Array.from({ length: 15 }, (_, k) => h[inp(k + 1)])); break;
        }
        default: refuse(name + ' node ' + i + ' has an operation this reader was not told about: ' + nd.op);
      }
    }
    for (const v of ownSlots) intervals.push({ start: v, len: 1n, what: 'own variable ' + v });
    const end = tile(name, pc, intervals);
    const need = end > BigInt(pc) ? end : BigInt(pc);
    /* syntactic reach from the root (informational) */
    const reached = new Uint8Array(nodes.length); reached[root] = 1;
    const readParams = new Uint8Array(pc); const readOwn = new Set(); let reachedW = 0n; let reachedNodes = 0;
    for (let i = nodes.length - 1; i >= 0; i--) {
      if (!reached[i]) continue;
      reachedNodes++;
      const nd = nodes[i], a = nd.args;
      if (nd.op === 'var') { if (a[0] < pc) readParams[a[0]] = 1; else readOwn.add(a[0]); }
      else if (nd.op === 'const') constNodes.reached++;
      else if (nd.op === 'add' || nd.op === 'mul') { reached[a[0]] = 1; reached[a[1]] = 1; }
      else if (nd.op === 'call') { const c = T[a[0]]; for (let k = 0; k < c.parameterCount; k++) if (c.readParams[k]) reached[a[k + 1]] = 1; reachedW += c.reachedW; }
      else if (nd.op === 'psi_component') { constructorNodes.reached++; for (const k of [1, 2, 3, 4]) reached[a[k]] = 1; }
      else if (nd.op === 'finite_guard_product') { constructorNodes.reached++; for (let k = 1; k <= 15; k++) reached[a[k]] = 1; }
      else if (nd.op === 'fixed_integer') constructorNodes.reached++;
    }
    reachedW += BigInt(readOwn.size);
    const r = { kind: 'template', index: ti, name, parameterCount: pc, need, W: need - BigInt(pc), own: BigInt(ownSlots.size), calls, height: h[root], heightStrict: h[root], nodes: nodes.length, reachedNodes, readParams, reachedW, callsEarlierOnly: earlierOnly.ok };
    if (asBig(t.variableCount) !== need) mismatches.push({ object: name, field: 'variableCount', declared: String(t.variableCount), derived: String(need) });
    if (asBig(t.witnessCount) !== r.W) mismatches.push({ object: name, field: 'witnessCount', declared: String(t.witnessCount), derived: String(r.W) });
    if (Array.isArray(t.witnessBlocks)) {
      const ours = calls.map((c) => c.start + ':' + c.len + ':' + c.callee).sort().join(' ');
      const theirs = t.witnessBlocks.map((b) => b.start + ':' + b.length + ':' + b.template).sort().join(' ');
      if (ours !== theirs) mismatches.push({ object: name, field: 'witnessBlocks', declared: theirs.slice(0, 200), derived: ours.slice(0, 200) });
    }
    T[ti] = r; inProgress.delete('t' + ti);
    return r;
  }

  const callee = (kind, target, from) => {
    if (kind === 'template') return template(target);
    if (kind === 'recipe') {
      if (!(target in recipes)) refuse(from + ' calls a recipe that does not exist: ' + target);
      if (recipeOrder.indexOf(target) >= recipeOrder.indexOf(from)) problems.push({ object: from, kind: 'order', first: ['calls ' + target + ', not an earlier recipe'] });
      return recipe(target);
    }
    refuse(from + ' has a call of unknown kind ' + kind);
  };

  function modelRecipe(name, rc) {
    const pc = nat(rc.parameterCount, name + '.parameterCount');
    if (pc % 5) refuse(name + ' parameters are not whole points');
    const ot = rc.operationTemplates || {};
    const nat0 = template(ot.natural), add = template(ot.addition), mul = template(ot.multiplication);
    const pow = ot.power == null ? null : callee('recipe', ot.power, name);
    for (const [c, k] of [[nat0, 5], [add, 15], [mul, 15]]) if (c.parameterCount !== k) refuse(name + ': ' + c.name + ' has ' + c.parameterCount + ' parameters, not ' + k);
    if (pow && pow.parameterCount !== 20) refuse(name + ': the power recipe has ' + pow.parameterCount + ' parameters, not 20');
    if (!Array.isArray(rc.generator) || rc.generator.length !== 3) refuse(name + ' generator is not three variables');
    const gen = rc.generator.map((g) => nat(g, name + '.generator'));
    const intervals = [], points = new Set();
    for (let s = 0; s < pc; s += 5) points.add(s);
    for (const g of gen) { if (g < pc) refuse(name + ' generator variable inside the parameters'); intervals.push({ start: g, len: 1n, what: 'generator ' + g }); }
    const alloc = (p, what) => { nat(p, name + ' ' + what + ' point'); if (p < pc) { if (p % 5) refuse(name + ' ' + what + ' point ' + p + ' is not a parameter point'); return; } intervals.push({ start: p, len: 5n, what: what + ' point ' + p }); points.add(p); ownAllocatedSlots += 5n; };
    const reads = [];                       /* [point, callee, param offset] for reach and validity */
    const calls = [];                       /* {callee, args:[points]} */
    let constraints = 3, ownAllocatedSlots = 3n;
    const svRows = rc.sourceVariables;
    if (!Array.isArray(svRows)) refuse(name + ' has no sourceVariables');
    for (const row of svRows) {
      if (!Array.isArray(row) || row.length !== 3) refuse(name + ' sourceVariables row shape');
      alloc(row[1], 'source variable ' + row[0]);
      if (row[2] !== null) { const ws = nat(row[2], name + ' natural start'); intervals.push({ start: ws, len: nat0.W, what: 'natural for source ' + row[0] }); calls.push({ c: nat0, args: [row[1]] }); constraints++; }
    }
    for (const cd of rc.constantDefinitions || []) {
      const c = template(cd.template);
      if (c.parameterCount !== 10) refuse(name + ' constant template ' + c.name + ' does not take P and a point');
      if (!spec.library.fixedConstants || !(cd.valueRef in spec.library.fixedConstants)) refuse(name + ' constant ' + cd.valueRef + ' is not a fixedConstant');
      alloc(cd.point, 'constant ' + cd.valueRef);
      intervals.push({ start: nat(cd.witnessStart, name + ' constant witnessStart'), len: c.W, what: 'constant ' + cd.valueRef });
      calls.push({ c, args: [-2, cd.point] }); constraints++;
    }
    for (const op of rc.operations || []) {
      if (!Array.isArray(op)) refuse(name + ' operation shape');
      let c, ins, out, ws;
      if (op[0] === 0 || op[0] === 1) { if (op.length !== 6) refuse(name + ' operation arity'); c = op[0] === 0 ? add : mul; ins = [op[2], op[3]]; out = op[4]; ws = op[5]; }
      else if (op[0] === 2) { if (op.length !== 7 || !pow) refuse(name + ' power operation without a power recipe'); c = pow; ins = [op[2], op[3], op[4]]; out = op[5]; ws = op[6]; }
      else refuse(name + ' operation of unknown kind ' + op[0]);
      alloc(out, 'operation output');
      intervals.push({ start: nat(ws, name + ' operation witnessStart'), len: c.W, what: 'operation ' + c.name + ' (source node ' + op[1] + ')' });
      calls.push({ c, args: [...ins, out] }); constraints++;
    }
    if (!Array.isArray(rc.rootEquality) || rc.rootEquality.length !== 2) refuse(name + ' rootEquality shape');
    constraints += 5;
    const end = tile(name, pc, intervals);
    const need = end > BigInt(pc) ? end : BigInt(pc);
    /* every point read must exist: a parameter point, an allocated point, or -1, -2, -3 */
    let badReads = 0; const firstBad = [];
    const check = (p) => { if (p === -1 || p === -2 || p === -3) return; if (!points.has(p)) { badReads++; if (firstBad.length < 3) firstBad.push(p); } };
    for (const cl of calls) cl.args.forEach(check);
    rc.rootEquality.forEach(check);
    if (badReads) problems.push({ object: name, kind: 'point-reference', count: badReads, first: firstBad.map(String) });
    /* heights. H-claim: callee + 3 (argument bound 2), constraints at 4, sum of squares +2. Actual: real argument heights. */
    const argH = (p) => (p >= 0 ? 0 : p === -3 ? 2 : 1);
    let hClaim = 4, hActual = 3; const top = { claim: null, actual: null };
    for (const cl of calls) {
      const hc = 1 + cl.c.height + 2, ha = 1 + cl.c.height + Math.max(...cl.args.map(argH));
      if (hc > hClaim) { hClaim = hc; top.claim = cl.c.name; }
      if (ha > hActual) { hActual = ha; top.actual = cl.c.name; }
    }
    /* a coordinate's own height: a variable 0, a constant 1, a negated generator variable mul(-1, g) 2 */
    const coordH = (p, k) => (p >= 0 ? 0 : p === -1 || k === 0 || k === 2 ? 1 : p === -3 && k >= 3 ? 2 : 0);
    /* a root difference a - b as add(a, mul(-1, b)) */
    const diffH = Math.max(...[0, 1, 2, 3, 4].map((k) => 1 + Math.max(coordH(rc.rootEquality[0], k), 1 + Math.max(1, coordH(rc.rootEquality[1], k)))));
    hActual = Math.max(hActual, diffH);
    /* reach: which slots the constraints read (informational) */
    const readParams = new Uint8Array(pc); let reachedW = 3n; const readPts = new Map();
    const mark = (p, k) => { if (p >= 0) { if (p < pc) readParams[p + k] = 1; else readPts.set(p, (readPts.get(p) || 0) | (1 << k)); } };
    for (const cl of calls) { cl.args.forEach((p, j) => { for (let k = 0; k < 5; k++) if (cl.c.readParams[5 * j + k]) mark(p, k); }); reachedW += cl.c.reachedW; }
    for (const p of rc.rootEquality) for (let k = 0; k < 5; k++) mark(p, k);
    for (const m of readPts.values()) for (let k = 0; k < 5; k++) if (m & (1 << k)) reachedW++;
    const multiplicity = new Map();
    for (const cl of calls) multiplicity.set(cl.c, (multiplicity.get(cl.c) || 0n) + 1n);
    return { kind: 'model', name, parameterCount: pc, need, W: need - BigInt(pc), own: ownAllocatedSlots, height: hClaim + 2, heightStrict: hClaim + 2, heightActualArgs: hActual + 2, heightSetBy: top.claim, constraints, readParams, reachedW, children: [...multiplicity].map(([c, n]) => ({ c, n })), sourceVariableRows: svRows.length, sourceVariableCount: rc.sourceVariableCount, operations: (rc.operations || []).length };
  }

  function compositionRecipe(name, rc) {
    const pc = nat(rc.parameterCount, name + '.parameterCount');
    const fmt = rc.format;
    if (fmt !== 'sum-of-squares-composition-v1' && fmt !== 'product-composition-v1') refuse(name + ' has a format this reader was not told about: ' + fmt);
    const intervals = [], explicit = [];
    let own = 0n;
    for (const er of rc.explicitWitnessRanges || []) { const s = nat(er[0], name + ' explicit range'), l = nat(er[1], name + ' explicit range'); intervals.push({ start: s, len: BigInt(l), what: 'explicit range ' + s }); explicit.push([s, s + l]); own += BigInt(l); }
    const inScope = (i) => i < pc || explicit.some(([s, e]) => i >= s && i < e);
    let hClaim = 0, hStrict = 0, top = null, badArgs = 0;
    const readParams = new Uint8Array(pc); const readOwn = new Set(); let reachedW = 0n;
    const multiplicity = new Map();
    if (!Array.isArray(rc.calls)) refuse(name + ' has no calls');
    for (const cl of rc.calls) {
      const c = callee(cl.kind, cl.target, name);
      if (!Array.isArray(cl.parameters) || cl.parameters.length !== c.parameterCount) refuse(name + ' passes ' + (cl.parameters || []).length + ' arguments to ' + c.name + ' (' + c.parameterCount + ' parameters)');
      cl.parameters.forEach((p, k) => {
        if (!Array.isArray(p) || p[0] !== 'var') refuse(name + ' argument is not [var,i]');
        const i = nat(p[1], name + ' argument');
        if (!inScope(i)) badArgs++;
        if (c.readParams[k]) { if (i < pc) readParams[i] = 1; else readOwn.add(i); }
      });
      const ws = nat(cl.witnessStart, name + ' witnessStart');
      intervals.push({ start: ws, len: c.W, what: 'call ' + c.name });
      if (cl.witnessCount !== undefined && asBig(cl.witnessCount) !== c.W) mismatches.push({ object: name, field: 'calls[' + c.name + '].witnessCount', declared: String(cl.witnessCount), derived: String(c.W) });
      reachedW += c.reachedW;
      multiplicity.set(c, (multiplicity.get(c) || 0n) + 1n);
      if (c.height > hClaim) { hClaim = c.height; top = c.name; }
      hStrict = Math.max(hStrict, 1 + c.heightStrict);
    }
    if (badArgs) problems.push({ object: name, kind: 'argument-scope', count: badArgs, first: ['a [var,i] argument outside the parameters and explicit ranges'] });
    reachedW += BigInt(readOwn.size);
    const end = tile(name, pc, intervals);
    const need = end > BigInt(pc) ? end : BigInt(pc);
    const add = fmt === 'product-composition-v1' ? 1 : 2;
    return { kind: 'composition', format: fmt, name, parameterCount: pc, need, W: need - BigInt(pc), own, height: hClaim + add, heightStrict: hStrict + add, heightSetBy: top, constraints: rc.calls.length, readParams, reachedW, children: [...multiplicity].map(([c, n]) => ({ c, n })) };
  }

  function recipe(name) {
    if (R[name]) return R[name];
    if (inProgress.has('r' + name)) refuse('recipe cycle at ' + name);
    inProgress.add('r' + name);
    const rc = recipes[name];
    const r = rc.format === 'model-evaluation-polynomial-recipe-v1' ? modelRecipe(name, rc) : compositionRecipe(name, rc);
    if (asBig(rc.variableCount) !== r.need) mismatches.push({ object: name, field: 'variableCount', declared: String(rc.variableCount), derived: String(r.need) });
    if (asBig(rc.witnessCount) !== r.W) mismatches.push({ object: name, field: 'witnessCount', declared: String(rc.witnessCount), derived: String(r.W) });
    R[name] = r; inProgress.delete('r' + name);
    return r;
  }

  for (let i = 0; i < templates.length; i++) template(i);
  for (const name of recipeOrder) recipe(name);
  const rootName = spec.rootRecipe;
  if (!(rootName in R)) refuse('rootRecipe ' + rootName + ' is not a recipe');
  const root = R[rootName];
  if (root.parameterCount !== 1 || !Array.isArray(spec.parameterNames) || spec.parameterNames.length !== 1) refuse('the root does not have exactly one free input');
  if (asBig(spec.witnessCount) !== root.W) mismatches.push({ object: '(top level)', field: 'witnessCount', declared: String(spec.witnessCount), derived: String(root.W) });

  /* second derivation of the count: multiplicities in the fully expanded call tree × each object's own slots */
  const mult = new Map(); const visit = (o, m) => { mult.set(o, (mult.get(o) || 0n) + m); if (o.kind === 'template') { const by = new Map(); for (const c of o.calls) by.set(T[c.callee], (by.get(T[c.callee]) || 0n) + 1n); for (const [c, n] of by) visit(c, m * n); } else for (const ch of o.children) visit(ch.c, m * ch.n); };
  visit(root, 1n);
  let viaMultiplicity = 0n; const share = [];
  for (const [o, m] of mult) { viaMultiplicity += m * o.own; share.push({ object: o.name, invocations: String(m), ownSlots: String(o.own), slots: String(m * o.own) }); }
  share.sort((a, b) => (BigInt(b.slots) > BigInt(a.slots) ? 1 : BigInt(b.slots) < BigInt(a.slots) ? -1 : 0));

  /* the critical height chain, root downwards */
  const chain = []; let cur = root;
  while (cur) {
    chain.push(cur.name + ' ' + cur.height);
    if (cur.kind === 'template') { let best = null, bh = -1; for (const c of cur.calls) if (T[c.callee].height > bh) { bh = T[c.callee].height; best = T[c.callee]; } cur = best; }
    else cur = cur.heightSetBy ? (R[cur.heightSetBy] || T.find((t) => t.name === cur.heightSetBy)) : null;
  }

  return {
    ambient: root.need, witnesses: root.W, rootHeight: root.height, rootHeightStrict: root.heightStrict,
    viaMultiplicity: viaMultiplicity + BigInt(root.parameterCount), share,
    reached: { witnesses: root.reachedW, inputRead: !!root.readParams[0] },
    problems, mismatches, chain,
    templates: T.map((t) => ({ name: t.name, parameters: t.parameterCount, witnesses: String(t.W), height: t.height, nodes: t.nodes, unreachedNodes: t.nodes - t.reachedNodes, reachedWitnesses: String(t.reachedW), callsEarlierOnly: t.callsEarlierOnly })),
    recipes: recipeOrder.map((n) => { const r = R[n]; const o = { name: n, kind: r.kind, parameters: r.parameterCount, witnesses: String(r.W), total: String(r.need), height: r.height, heightStrict: r.heightStrict, constraints: r.constraints, reachedWitnesses: String(r.reachedW) }; if (r.kind === 'model') Object.assign(o, { heightActualArguments: r.heightActualArgs, sourceVariableRows: r.sourceVariableRows, sourceVariableCount: r.sourceVariableCount, operations: r.operations }); return o; }),
    constNodes: { total: constNodes.total, distinct: constNodes.distinct.size, reached: constNodes.reached, maxBits: constNodes.maxBits },
    constructorNodes, fixedExpressions,
  };
}

/* the pinned bytes, or nothing */
function readPinned(rel, want) {
  const p = path.join(REPO, rel);
  if (!fs.existsSync(p)) die('the claimant clone is not at ' + REPO + ' (set ZQ_REPO); refusing to derive anything');
  const b = fs.readFileSync(p);
  const got = sha(b);
  if (got !== want) die(rel + ' is not the pinned bytes (sha256 ' + got + '); REFUSED, nothing computed');
  return b;
}

/* ---------------------------------------------------------------------------------------------------------------
   RED CONTROLS: mutated COPIES in a fresh temp dir, read back from disk and re-derived; predictions fixed in the
   pre-registration (RC0-RC8). A control that changes neither our numbers nor a check is a blind spot.
   ------------------------------------------------------------------------------------------------------------- */
function controls(raw, base) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zq-recount-'));
  const out = [];
  const W = (name) => BigInt(base.recipes.find((r) => r.name === name).witnesses);
  const tIndex = (name) => { const i = base.templates.findIndex((t) => t.name === name); if (i < 0) die('no template ' + name + ' for a control'); return i; };
  /* the leaf for RC2: a template with no call nodes that the count's chain reaches, preferring multiply.guard */
  const leafName = 'multiply.guard';
  /* the template that sets the root height: the first template on the critical chain */
  const critName = base.chain.map((s) => s.replace(/ \d+$/, '')).find((n) => base.templates.some((t) => t.name === n));
  const run = (id, mutation, prediction, mutate, judge) => {
    const file = path.join(dir, id + '.json');
    let bytes;
    if (typeof mutate === 'function') { const spec = JSON.parse(raw); mutate(spec); bytes = Buffer.from(JSON.stringify(spec)); }
    else bytes = mutate;
    fs.writeFileSync(file, bytes);
    const back = fs.readFileSync(file);
    const pinOk = sha(back) === PIN.definition.sha256;
    let d = null, refusedWith = null;
    try { d = derive(JSON.parse(back.toString('utf8'))); } catch (e) { if (e instanceof Refuse) refusedWith = e.message; else throw e; }
    const outcome = { pinCheck: pinOk ? 'pass' : 'refused (sha256 differs from the pin)', refusedWith,
      ambient: d ? String(d.ambient) : null, ambientViaMultiplicities: d ? String(d.viaMultiplicity) : null, rootHeight: d ? d.rootHeight : null,
      structuralProblems: d ? d.problems.map((p) => p.object + ': ' + p.kind) : null,
      declaredMismatches: d ? [...new Set(d.mismatches.map((m) => m.object + '.' + m.field))] : null };
    const passed = judge({ pinOk, d, refusedWith });
    /* what, beyond the pin, sees the mutation; the ambient number alone is blind where it does not move */
    const seenBy = [];
    if (id === 'RC0' && !pinOk) seenBy.push('pin check');
    if (refusedWith) seenBy.push('reference check (REFUSED)');
    if (d && d.ambient !== base.ambient) seenBy.push('ambient count');
    if (d && d.viaMultiplicity !== base.viaMultiplicity) seenBy.push('second derivation');
    if (d && d.rootHeight !== base.rootHeight) seenBy.push('root height');
    if (d && d.templates.some((t, i) => t.height !== base.templates[i].height)) seenBy.push('template height');
    if (d && d.problems.length) seenBy.push('tiling check');
    if (d && d.mismatches.length) seenBy.push('declared-versus-derived');
    out.push({ id, mutation, prediction, outcome, passed, seenBy, ambientNumberBlind: !!d && d.ambient === base.ambient, blindSpot: seenBy.length === 0 });
    fs.unlinkSync(file);
  };
  run('RC0', 'the pinned bytes with one byte (a newline) appended', 'the sha256 check refuses', Buffer.concat([Buffer.from(raw), Buffer.from('\n')]), (o) => !o.pinOk);
  run('RC1', 'integers.explicitWitnessRanges [1,5] -> [1,6] and its call witnessStart 6 -> 7 (one block one longer, the rest shifted)', 'count 292,890,231,906; integers flagged declared ≠ derived',
    (s) => { s.recipes.integers.explicitWitnessRanges[0][1] = 6; s.recipes.integers.calls[0].witnessStart = 7; },
    (o) => o.d && o.d.ambient === base.ambient + 1n && o.d.mismatches.some((m) => m.object === 'integers') && !o.d.problems.length);
  run('RC2', 'one extra witness variable in the leaf template ' + leafName + ' (a var node at index variableCount; its declared counts raised by one)', 'derived W of multiply changes by +1; the tiling refuses with an overlap in multiply\'s callers',
    (s) => { const t = s.library.templates[tIndex(leafName)]; t.nodes.push({ op: 'var', args: [t.variableCount] }); t.variableCount += 1; t.witnessCount += 1; },
    (o) => o.d && BigInt(o.d.templates.find((t) => t.name === 'multiply').witnesses) === BigInt(base.templates.find((t) => t.name === 'multiply').witnesses) + 1n && o.d.problems.some((p) => p.kind === 'overlap' && (p.object === 'precision' || p.object === 'power_value')));
  run('RC3', 'only the value call\'s own witnessCount field inside integers raised by one', 'count unchanged; the field flagged',
    (s) => { s.recipes.integers.calls[0].witnessCount += 1; },
    (o) => o.d && o.d.ambient === base.ambient && o.d.mismatches.some((m) => m.object === 'integers' && m.field.startsWith('calls[')) && !o.d.problems.length);
  run('RC4', 'recipe power_value deleted from recipes', 'REFUSED: a dangling reference',
    (s) => { delete s.recipes.power_value; },
    (o) => !!o.refusedWith && /does not exist/.test(o.refusedWith));
  run('RC5', 'a second call to close appended to main, its block at main\'s old end (variableCount)', 'count + W(close) = + ' + W('close').toLocaleString('en-US'),
    (s) => { const m = s.recipes.main; const c = JSON.parse(JSON.stringify(m.calls[0])); c.witnessStart = m.variableCount; m.calls.push(c); },
    (o) => o.d && o.d.ambient === base.ambient + W('close') && o.d.mismatches.some((m) => m.object === 'main') && !o.d.problems.length);
  run('RC6', 'the member call deleted from value (a block that is not last)', 'ambient count UNCHANGED (designed blindness of the count); the tiling refuses with a gap in value',
    (s) => { s.recipes.value.calls = s.recipes.value.calls.filter((c) => !(c.kind === 'template' && s.library.templates[c.target].name === 'member')); },
    (o) => o.d && o.d.ambient === base.ambient && o.d.problems.some((p) => p.object === 'value' && p.kind === 'gap'));
  run('RC7', 'the root of ' + critName + ' (the first template on the critical height chain) wrapped in mul(const 1, root)', 'root height 257',
    (s) => { const t = s.library.templates[tIndex(critName)]; t.nodes.push({ op: 'const', args: ['1'] }); t.nodes.push({ op: 'mul', args: [t.nodes.length - 1, t.root] }); t.root = t.nodes.length - 1; },
    (o) => o.d && o.d.rootHeight === base.rootHeight + 1 && o.d.ambient === base.ambient);
  run('RC8', 'the root of member (off the critical chain) wrapped in mul(const 1, root)', 'member 19, root unchanged',
    (s) => { const t = s.library.templates[tIndex('member')]; t.nodes.push({ op: 'const', args: ['1'] }); t.nodes.push({ op: 'mul', args: [t.nodes.length - 1, t.root] }); t.root = t.nodes.length - 1; },
    (o) => o.d && o.d.templates.find((t) => t.name === 'member').height === base.templates.find((t) => t.name === 'member').height + 1 && o.d.rootHeight === base.rootHeight);
  fs.rmdirSync(dir);
  return out;
}

function build() {
  const raw = readPinned(PIN.definition.path, PIN.definition.sha256).toString('utf8');
  const boundsBytes = readPinned(PIN.bounds.path, PIN.bounds.sha256);
  for (const k of ['frozenLean', 'tex', 'sizeBoundProof']) readPinned(PIN[k].path, PIN[k].sha256);
  const spec = JSON.parse(raw);
  let d;
  try { d = derive(spec); } catch (e) { if (e instanceof Refuse) die('REFUSED on the pinned artifact: ' + e.message); throw e; }
  const B = JSON.parse(boundsBytes.toString('utf8'));

  /* comparison with their bounds file, object by object */
  const cmp = [];
  const put = (what, theirs, ours) => cmp.push({ what, theirs: String(theirs), ours: String(ours), agree: String(theirs) === String(ours) });
  put('total_variables', B.total_variables, d.ambient);
  put('rational_witnesses', B.rational_witnesses, d.witnesses);
  put('root_height_bound', B.root_height_bound, d.rootHeight);
  for (const t of B.templates) { const o = d.templates.find((x) => x.name === t.name); put('template ' + t.name + ' height', t.height, o ? o.height : 'absent'); put('template ' + t.name + ' nodes', t.nodes, o ? o.nodes : 'absent'); }
  for (const [n, r] of Object.entries(B.recipes)) { const o = d.recipes.find((x) => x.name === n); put('recipe ' + n + ' height', r.height, o ? o.height : 'absent'); put('recipe ' + n + ' constraint_count', r.constraint_count, o ? o.constraints : 'absent'); }
  const fixedLiteralDigits = Math.max(...Object.values(spec.library.fixedConstants).filter((v) => v[0] === 'literal').map((v) => v[1].replace('-', '').length));
  const informational = [
    { what: 'explicit_constant_nodes', theirs: String(B.explicit_constant_nodes), ours: { total: d.constNodes.total, distinctValues: d.constNodes.distinct, reachedFromRoots: d.constNodes.reached } },
    { what: 'finite_constructor_nodes', theirs: String(B.finite_constructor_nodes), ours: { total: d.constructorNodes.total, byOp: d.constructorNodes.byOp, reachedFromRoots: d.constructorNodes.reached } },
    { what: 'max_fixed_literal_decimal_digits', theirs: String(B.max_fixed_literal_decimal_digits), ours: fixedLiteralDigits },
  ];
  const constraintCap = d.recipes.every((r) => r.constraints <= 2 ** 20);

  const structuralOk = d.problems.length === 0;
  const declaredOk = d.mismatches.length === 0;
  const countOk = d.ambient === CLAIM.ambient && d.witnesses === CLAIM.witnesses && d.viaMultiplicity === d.ambient;
  const heightOk = d.rootHeight <= CLAIM.rootHeight;
  const ctl = controls(raw, d);
  const controlsOk = ctl.every((c) => c.passed);
  let verdict, reason;
  if (!structuralOk) { verdict = 'REFUSED'; reason = 'a structural check failed, so the count is not determined by the stated semantics: ' + d.problems.map((p) => p.object + ' ' + p.kind).join('; '); }
  else if (!controlsOk) { verdict = 'REFUSED'; reason = 'a red control did not come out as predicted: ' + ctl.filter((c) => !c.passed).map((c) => c.id).join(', '); }
  else if (countOk && heightOk) { verdict = 'CERTIFIED'; reason = 'the structure tiles exactly, the ambient count is 292,890,231,905 by two derivations, the root height is ' + d.rootHeight + ' ≤ 256 under the stated rules, and every red control came out as predicted'; }
  else { verdict = 'REFUSED'; reason = 'a headline number differs and is not yet explained by a witness (pre-registered: re-check the reading twice before REFUTED)'; }

  const code = { 'tools/zq-recount.js': sha(fs.readFileSync(__filename)) };
  return {
    what: 'Track A lane 1 on the claim "Z is Diophantine in Q" (Glazer et al., announced 2026-11-05): the ambient variable count and the root expression-height bound of the saved polynomial P_*, re-derived from the pinned construction/ordinary-integer-definition.json by a clean-room reader (Node, BigInt, standard library; no code copied, ported or read from the claimant\'s .js or .py).',
    undecided: UNDECIDED,
    generated: new Date().toISOString().slice(0, 10),
    preregistration: 'notes/zq-preregistration-2026-11-06.md',
    pins: PIN, code,
    claim: { ambientVariables: String(CLAIM.ambient), witnesses: String(CLAIM.witnesses), rootHeightBound: CLAIM.rootHeight, sources: ['diophantine_zq.tex lines 43, 61-75 (thm:target)', 'README.md line 41', 'ordinary-integer-definition.json top-level witnessCount', 'ordinary-integer-polynomial-size-bounds.json lines 3, 154'] },
    verdict, reason,
    numbers: {
      ambientVariables: String(d.ambient), witnesses: String(d.witnesses),
      ambientViaMultiplicities: String(d.viaMultiplicity),
      rootHeight: d.rootHeight,
      rootHeightIfRenamingsCharged: d.rootHeightStrict,
      criticalHeightChain: d.chain,
      syntacticallyReachedWitnesses: String(d.reached.witnesses),
      inputReadByRoot: d.reached.inputRead,
      constraintsPerRecipeAtMost2to20: constraintCap,
    },
    readings: {
      ambient: 'need(integers): one more than the largest variable slot any node, block or allocated point of the root recipe uses, with every call block\'s length equal to OUR derived witness count of its callee; the slots must tile [parameterCount, need) exactly at every object (no overlap, no gap, nothing inside the parameters).',
      viaMultiplicities: 'second derivation: Σ over objects of (invocations in the fully expanded call tree) × (own slots: a template\'s own witness variables, a model recipe\'s generator and allocated point slots, a composition\'s explicit ranges), plus the input.',
      height: 'H-claim: the size-bound proof §2 and TeX lines 6386-6425 (renaming calls in compositions charge nothing; model-recipe callees charge 1 + 2; constraints at the safe bound 4; sum of squares +2, product +1). rootHeightIfRenamingsCharged is the looser reading the manuscript declines (TeX 6421-6427), reported only.',
      reached: 'informational, never a verdict input: witness slots read by some var node reachable from the root through calls whose callee reads that parameter. It bounds the occurring variables from above (cancellation is not seen; psi_component of odd index is counted as reading y).',
    },
    share: d.share.slice(0, 12),
    structuralProblems: d.problems,
    declaredVersusDerived: { agree: declaredOk, differences: d.mismatches },
    boundsFile: { agree: cmp.every((c) => c.agree), rows: cmp, informational },
    templates: d.templates, recipes: d.recipes,
    redControls: ctl,
    redControlsNote: 'Every mutant also fails the pin; seenBy lists what sees it BEYOND the pin. The ambient number (the largest slot) does not move under RC2 (a block one longer overlaps its neighbour), RC3 (a declared field only) or RC6 (a middle block removed leaves a gap): there the number alone is blind, and the reader sees the mutation through the tiling check, the declared-versus-derived comparison and the second derivation (Σ multiplicity × own slots), which moves by +' + (ctl.find((c) => c.id === 'RC2').outcome.ambientViaMultiplicities ? (BigInt(ctl.find((c) => c.id === 'RC2').outcome.ambientViaMultiplicities) - d.viaMultiplicity).toString() : '?') + ' under RC2 and ' + (BigInt(ctl.find((c) => c.id === 'RC6').outcome.ambientViaMultiplicities) - d.viaMultiplicity).toString() + ' under RC6. RC7 and RC8 change heights only, by design. No control was seen by nothing.',
  };
}

const L = build();
const strip = (x) => JSON.stringify(Object.assign({}, x, { generated: null }));
if (process.argv.includes('--check')) {
  if (!fs.existsSync(OUT)) die('no record to check');
  if (strip(JSON.parse(fs.readFileSync(OUT, 'utf8'))) !== strip(L)) die('certs/zq-recount.json is not what the pinned artifact and this code give now');
  console.log('zq-recount: re-derived, identical · ' + L.verdict + ' · ' + L.numbers.ambientVariables + ' ambient · root height ' + L.numbers.rootHeight);
} else {
  fs.writeFileSync(OUT, JSON.stringify(L, null, 1) + '\n');
  console.log('zq-recount: ' + L.verdict + ' · ambient ' + L.numbers.ambientVariables + ' (claimed ' + L.claim.ambientVariables + ') · root height ' + L.numbers.rootHeight + ' (claimed ≤ 256) · bounds file ' + (L.boundsFile.agree ? 'agrees' : 'DIFFERS') + ' · declared ' + (L.declaredVersusDerived.agree ? 'agree' : 'DIFFER') + ' · controls ' + L.redControls.filter((c) => c.passed).length + '/' + L.redControls.length);
}
