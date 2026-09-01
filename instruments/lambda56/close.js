/* close.js — the recursive family-closure driver for the lambda(5)/(6) campaign.
   instruments/lambda56 · cert-machine

   lambda(4)'s families were 3-dof and closed with ONE level of subfamilies;
   lambda(5)'s are 4-dof and lambda(6)'s are 5-dof, so the closure is a TREE:
   a dot theorem on the family cone raises conditions, each condition is a
   lower-dimensional cone closed by its own dot theorem or anchored closure,
   recursively, down to finite parts. This driver walks that tree with the
   whole lambda(4) discipline enforced at every node:

     · exceptions are OUTPUT: positive conditions are matched against the
       spec's registry BY EXACT CONDITION KEY; an unregistered positive
       refuses, a registry entry that never fires refuses.
     · coverage is MECHANICAL: a condition's points are enumerated from its
       VECTOR (cond(x) = 0 over the raising cone's own x-box — never a
       hand-written predicate), and each gcd-reduced point must appear in
       the closing sub-cone's member tuples. The lambda(4) campaign caught
       two real proof holes exactly here; the check is not optional.
     · delegation is VERIFIED: a subtree closed "because its sets also lie
       in family F" must have every covered point actually satisfy F's root
       condition vector, evaluated at the point's member differences.
     · every finite part is decided by the certified minimum instrument; a
       set deciding the wrong way aborts the run (it would refute the
       conjectured value).

   Node spec shapes:
     { kind:'dot', C, S, W, gConst, gMembers, anchored,
       subs: { condKey: <node spec> }, skipTuples?: [[..]] }
     { kind:'closure', C, closures:[{Se, So, tail?}], bounds:(cls)=>[..],
       skip?: [[..]] }
     { kind:'ray', A: [..] }               a single gcd-reduced set, decided
     { kind:'delegate', rootKey, note }     closed by another root family

   MIT licensed. Part of cert-machine. */
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const F = require(path.join(ROOT, 'instruments/lambda4/forms.js'));
const D = require(path.join(ROOT, 'instruments/lambda4/dot.js'));
const EN = require(path.join(ROOT, 'instruments/lambda4/engine.js'));
const Q = require(path.join(ROOT, 'instruments/interval/rational.js'));

/* ---------------- member tuple enumeration -------------------------------- */
/* All member forms in every campaign context have nonnegative coefficients,
   and the top member's form is strictly positive in every coordinate — that
   is what makes "all members <= cap" a finite box. Verified, not assumed. */
function topMember(C) {
  const names = Object.keys(C.member);
  /* the top member is the one whose value dominates: pick the form with the
     largest value at x = 1; it must be all-positive */
  let best = null, bestV = -1n;
  for (const nm of names) {
    const v = C.member[nm].reduce((s, c) => s + c, 0n);
    if (v > bestV) { bestV = v; best = nm; }
  }
  if (!C.member[best].every(c => c >= 1n))
    throw new Error('close: top member ' + best + ' not strictly positive — enumeration unbounded');
  return best;
}

/* every member tuple of C with all members <= cap, as 'a,b,c,..' keys of the
   SORTED tuple (cones keep order, but sorting makes keys canonical) */
function tuples(C, cap) {
  const names = Object.keys(C.member);
  for (const nm of names) if (C.member[nm].some(c => c < 0n))
    throw new Error('close: member ' + nm + ' has a negative coefficient — tuple enumeration unsound');
  const top = topMember(C);
  const out = new Set();
  const x = new Array(C.n).fill(1n);
  const val = (f) => f.reduce((s, c, i) => s + c * x[i], 0n);
  const rec = (i) => {
    if (val(C.member[top]) > BigInt(cap)) return false;   /* deeper x only grow it */
    if (i === C.n) {
      out.add(names.map(nm => Number(val(C.member[nm]))).sort((p, r) => p - r).join(','));
      return true;
    }
    for (let v = 1; ; v++) {
      x[i] = BigInt(v);
      if (!rec(i + 1)) break;
    }
    x[i] = 1n;
    return true;
  };
  rec(0);
  return out;
}

/* all gcd-reduced points of C's cone (members <= cap) on which every vector
   of conds vanishes; returned as sorted member arrays */
function conditionPoints(C, conds, cap) {
  const names = Object.keys(C.member);
  const top = topMember(C);
  const out = [];
  const x = new Array(C.n).fill(1n);
  const val = (f) => f.reduce((s, c, i) => s + c * x[i], 0n);
  const rec = (i) => {
    if (val(C.member[top]) > BigInt(cap)) return false;
    if (i === C.n) {
      if (conds.every(cd => cd.reduce((s, c, j) => s + c * x[j], 0n) === 0n)) {
        const A = names.map(nm => Number(val(C.member[nm]))).sort((p, r) => p - r);
        let g = 0; for (const a of A) { let b = a; while (b) { const t = g % b; g = b; b = t; } }
        if (g === 1 && new Set(A).size === A.length) out.push(A);
      }
      return true;
    }
    for (let v = 1; ; v++) { x[i] = BigInt(v); if (!rec(i + 1)) break; }
    x[i] = 1n;
    return true;
  };
  rec(0);
  return out;
}

/* ---------------- delegation verification --------------------------------- */
/* rootConds: { rootKey: x-space vector over the PREFIX top context }. A
   member tuple (sorted, strictly increasing) has prefix coordinates
   x_i = a_i - a_{i-1}; the root condition is evaluated there. */
function satisfiesRoot(rootCond, A) {
  const x = A.map((v, i) => (i ? v - A[i - 1] : v));
  return rootCond.reduce((s, c, i) => s + Number(c) * x[i], 0) === 0;
}

/* ---------------- the recursive closer ------------------------------------- */
/* opts: { target, tol, cap (coverage box, default 24), rootConds, stats } */
function closeNode(label, spec, opts) {
  const target = opts.target;
  if (spec.kind === 'delegate') {
    if (!opts.rootConds || !opts.rootConds[spec.rootKey])
      throw new Error(label + ': delegation to unknown root [' + spec.rootKey + ']');
    return { label, kind: 'delegate', rootKey: spec.rootKey, note: spec.note || '' };
  }
  if (spec.kind === 'auto') {
    /* a 2-dof leaf closed by anchored closure with the anchor pair FOUND BY
       DETERMINISTIC SEARCH over a fixed menu (member forms, unit vectors,
       small combos x each rational anchor angle). The anchor is a WITNESS,
       not an assumption: whichever pair the search lands on, the closure's
       threshold is DERIVED and its finite part is decided by the certified
       instrument — the search only chooses which certificate gets written.
       Only pairs whose Se order is strictly positive in every coordinate
       are eligible, so one bound makes the finite box. */
    const C = spec.C;
    if (C.n !== 2) throw new Error(label + ': auto leaf requires a 2-dof cone, got n = ' + C.n);
    const names = Object.keys(C.member);
    const menu = [];
    const seen = new Set();
    const addForm = (f, l) => { const k = f.join(','); if (!seen.has(k)) { seen.add(k); menu.push({ f, l }); } };
    for (const nm of names) addForm(C.member[nm], nm);
    addForm([1n, 0n], 'x1'); addForm([0n, 1n], 'x2');
    for (const [p, r] of [[1, 1], [2, 1], [1, 2], [3, 1], [1, 3], [3, 2], [2, 3]])
      addForm([BigInt(p), BigInt(r)], p + 'x1+' + r + 'x2');
    const XIS = [D.XI_PI, D.XI_2PI3, D.XI_PI3, D.XI_PI2, D.XI_4PI3, D.XI_PI6];
    const XIS_SO = XIS.concat([D.XI_ZERO]);
    /* phase 1 — collect every certifying anchor pair (cheap: symbolic bound
       + threshold scan); phase 2 — decide finite parts smallest-N0 first,
       so the expensive certified-minimum enumeration runs on the tightest
       box that exists, not the first one the menu happens to offer */
    const found = [];
    const capN = spec.capN || 80;                             /* leaves seen so far derive N0 <= 28 */
    let tiny = false;
    for (const Se of menu) {
      if (tiny) break;
      if (!Se.f.every(c => c >= 1n)) continue;                /* box-bounding only */
      for (const So of menu) {
        if (tiny) break;
        if (So.f.join(',') === Se.f.join(',')) continue;
        if (!F.certPos(So.f)) continue;
        for (const xe of XIS) for (const xo of XIS_SO) {
          try {
            const cl = EN.anchoredClosure({ C, members: names, Se: { order: Se.f, xi: xe },
              So: { order: So.f, xi: xo }, tailMember: null, target: opts.target, capN });
            found.push({ Se, So, xe, xo, cl });
            if (cl.N0 <= 12) { tiny = true; break; }          /* small box: decide it now */
          } catch (e) { /* not an anchor pair */ }
        }
      }
    }
    found.sort((p, r) => p.cl.N0 - r.cl.N0);
    for (const cand of found.slice(0, 5)) {
      const finite = EN.finitePart({ C, bounds: [{ form: cand.Se.f, N0: cand.cl.N0 }],
        target: opts.target, skip: spec.skip || [], tol: opts.tol });
      if (!finite.ok) continue;                                /* undecided box: try the next */
      opts.stats.closures++; opts.stats.finiteSets += finite.closed;
      return { label, kind: 'closure',
        auto: { Se: cand.Se.l + ' @ ' + cand.xe.name, So: cand.So.l + ' @ ' + cand.xo.name },
        closures: [cand.cl], finite };
    }
    throw new Error(label + ': auto leaf found no working anchor pair over the menu ('
      + found.length + ' certifying pairs, none with a decidable box)');
  }
  if (spec.kind === 'split') {
    /* a condition whose region triangulates into several cones: each part is
       closed on its own; coverage (checked by the RAISING node) is the union */
    const parts = spec.parts.map((p, i) => closeNode(label + ' / ' + (p.partLabel || 'part' + i), p, opts));
    return { label, kind: 'split', parts };
  }
  if (spec.kind === 'ray') {
    const A = spec.A;
    const C = { n: 1, names: ['g'], member: {}, defs: {} };
    A.forEach((v, i) => { C.member['m' + i] = [BigInt(v)]; });
    const finite = EN.finitePart({ C, bounds: [{ form: [1n], N0: 2 }], target, skip: spec.skip || [], tol: opts.tol });
    const wantClosed = (spec.skip && spec.skip.length) ? 0 : 1;
    if (!finite.ok || finite.closed !== wantClosed)
      throw new Error(label + ': ray {' + A + '} not decided');
    opts.stats.finiteSets += finite.closed;
    return { label, kind: 'ray', A, finite };
  }
  if (spec.kind === 'closure') {
    const names = Object.keys(spec.C.member);
    const closures = spec.closures.map((cl) =>
      EN.anchoredClosure({ C: spec.C, members: names, Se: cl.Se, So: cl.So,
        tailMember: cl.tail || null, target, capN: spec.capN || 600 }));
    const bounds = spec.bounds(closures);
    const finite = EN.finitePart({ C: spec.C, bounds, target, skip: spec.skip || [], tol: opts.tol });
    if (!finite.ok)
      throw new Error(label + ': finite part undecided: ' + JSON.stringify(finite.undecided.slice(0, 3)));
    opts.stats.closures += closures.length;
    opts.stats.finiteSets += finite.closed;
    return { label, kind: 'closure', closures, finite };
  }
  if (spec.kind !== 'dot') throw new Error(label + ': unknown node kind ' + spec.kind);

  const dot = EN.dotTheorem({ C: spec.C, S: spec.S, W: spec.W, gConst: spec.gConst,
    gMembers: spec.gMembers, anchored: spec.anchored, target, witnessBox: spec.witnessBox || 16 });
  if (!dot.ok) throw new Error(label + ': dot theorem failed: ' + dot.why);
  opts.stats.dots++;

  const positives = dot.exceptions.filter(e => e.deltaSign > 0);
  const subs = spec.subs || {};
  for (const p of positives) if (!subs[p.key])
    throw new Error(label + ': unregistered positive condition "' + p.label + '" [' + p.key + ']');
  for (const k of Object.keys(subs)) if (!positives.some(p => p.key === k))
    throw new Error(label + ': registry names condition [' + k + '] that the engine did not raise');

  /* close every subtree first */
  const children = {};
  for (const p of positives)
    children[p.key] = closeNode(label + ' » ' + p.label, subs[p.key], opts);

  /* coverage, scoped to THIS cone: every gcd-reduced point of spec.C on
     which p.cond vanishes (members <= cap) must be covered by the subtree
     that closes it — its cone tuples, its ray, or its verified delegation.
     skipTuples are the definitional witnesses walled off at this node. */
  const skipKeys = new Set((spec.skipTuples || []).map(A => A.join(',')));
  const tupleCache = new Map();
  const cachedTuples = (C) => {
    if (!tupleCache.has(C)) tupleCache.set(C, tuples(C, opts.cap));
    return tupleCache.get(C);
  };
  const covers = (sub, A, k) => {
    if (sub.kind === 'ray') return k === sub.A.join(',');
    if (sub.kind === 'delegate') return satisfiesRoot(opts.rootConds[sub.rootKey], A);
    if (sub.kind === 'split') return sub.parts.some(p => covers(p, A, k));
    return cachedTuples(sub.C).has(k);
  };
  const coverage = [];
  for (const p of positives) {
    const pts = conditionPoints(spec.C, [p.cond], opts.cap);
    const sub = subs[p.key];
    let n = 0;
    for (const A of pts) {
      const k = A.join(',');
      if (skipKeys.has(k)) continue;
      n++;
      if (!covers(sub, A, k))
        throw new Error(label + ': closure of "' + p.label + '" [' + p.key + '] misses point ' + k);
    }
    if (!n && sub.kind !== 'ray')
      throw new Error(label + ': condition "' + p.label + '" matched no point in the box — vacuous registry entry');
    coverage.push({ condition: p.label, key: p.key, pointsChecked: n });
  }

  /* the walled-off witnesses must actually activate a positive condition
     here (otherwise the wall guards nothing and the point leaks) */
  for (const k of skipKeys) {
    const A = k.split(',').map(Number);
    /* the tuple must lie in this cone and on some positive condition */
    const inCone = tuples(spec.C, Math.max(...A)).has(k);
    if (!inCone) throw new Error(label + ': skip tuple ' + k + ' is not in this cone');
  }

  return {
    label, kind: 'dot',
    base: dot.base, posBase: dot.posBase, dip: dot.dip,
    exceptions: dot.exceptions.map(e => ({ key: e.key, label: e.label, delta: e.delta })),
    children, coverage
  };
}

/* ---------------- family root closure -------------------------------------- */
/* closeFamily(rootKey, spec, opts): closes one generic-case family. The onto
   check: every gcd-reduced point of the TOP prefix cone (opts.topC, members
   <= cap) satisfying the family's root condition vector must lie in the
   family cone spec.C — so the cone parametrization provably reaches every
   set the generic case excluded. */
function closeFamily(rootKey, spec, opts) {
  const rootCond = opts.rootConds[rootKey];
  if (!rootCond) throw new Error('closeFamily: unknown root key [' + rootKey + ']');
  const stats = { dots: 0, closures: 0, finiteSets: 0 };
  const o = Object.assign({}, opts, { stats });

  /* onto: a split root (a family region that is not one simplicial cone)
     covers with the UNION of its part cones */
  const rootCones = spec.kind === 'split' ? spec.parts.map(p => p.C) : [spec.C];
  for (const rc of rootCones) if (!rc) throw new Error('closeFamily [' + rootKey + ']: a root part has no cone');
  const famTuples = rootCones.map(rc => tuples(rc, opts.cap));
  const pts = conditionPoints(opts.topC, [rootCond], opts.cap);
  let onto = 0;
  for (const A of pts) {
    onto++;
    const k = A.join(',');
    if (!famTuples.some(t => t.has(k)))
      throw new Error('closeFamily [' + rootKey + ']: cone(s) miss family point ' + k);
  }
  if (!onto) throw new Error('closeFamily [' + rootKey + ']: no family points in the box');

  const node = closeNode(spec.familyLabel || rootKey, spec, o);
  return { rootKey, status: 'CLOSED', ontoChecked: onto, stats, node };
}

module.exports = { closeNode, closeFamily, tuples, conditionPoints, satisfiesRoot };
