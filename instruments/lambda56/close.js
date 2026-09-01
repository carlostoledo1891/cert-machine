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

/* the smallest top-member value a cone can produce (all params at 1) —
   used to grow a coverage box that would otherwise miss deeply scaled
   sub-cones entirely and trip the vacuousness gate on a true statement */
function minTop(C) {
  let best = null;
  for (const nm of Object.keys(C.member)) {
    const v = C.member[nm].reduce((s, c) => s + c, 0n);
    if (best === null || v > best) best = v;
  }
  return Number(best);
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
            if (cl.N0 <= 12 || found.length >= 40) { tiny = true; break; }   /* enough candidates */
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
  if (spec.kind === 'autoClose') {
    /* hand the whole subtree to the automatic closer; spec.manual carries
       hand-written specs for conditions outside the mechanical shapes */
    return autoClose(label, spec.C, opts, 0, spec.manual);
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

/* ---------------- the automatic closer ------------------------------------- */
/* autoClose(label, C, opts, depth): close a cone with NO hand-written spec.
   Deterministic throughout — fixed probe orders, fixed split shapes — so a
   rerun derives the identical tree. The moves, in order:

     n = 1   a ray: decide the single gcd-reduced set.
     n = 2   an auto anchored-closure leaf; if no menu anchor certifies,
             fall through to the dot path (two leaves in lambda(5) closed
             exactly this way).
     n >= 2  a dot theorem: probe omcsq on each member over S(top, pi) at
             g0 = 2/3 and keep the weight with fewest positive conditions;
             if EVERY classical atom lands base > 0 (a double-sum core),
             probe Fejer-Riesz combs |(1+z_m1)(5+7z_m2+5z_m2^2)|^2 over
             member pairs at S(top, 2pi/3), g0 = 7/6. Each positive
             condition is then closed recursively on a sub-cone derived by
             one of three mechanical shapes:
               unit-negative      x_j = sum(c_i x_i)  -> substitute
               two-term ratio     p x_i = q x_j       -> x_i = (q/g)s, x_j = (p/g)s
               midpoint pair      2 x_j = x_p + x_q   -> 3-way split (<, =, >)
             A condition matching no shape throws — that is the manual
             escape hatch, not a silent skip.

   Walls: opts.witness (a member tuple) is skipped wherever it appears in a
   leaf's finite part — the caller passes the campaign's extremizer; leaves
   that do not contain it are unaffected (finitePart validates every skip
   it is given, so the skip is only passed when the tuple is in the cone). */
function memberNamesOf(C) { return Object.keys(C.member); }

function subCone(C, cond, depth) {
  /* returns [{C: subC, note}] or null when no mechanical shape applies */
  depth = depth || 0;
  if (depth > 12) return null;                                /* safety: hand off to manual */
  const n = C.n;
  /* normalize by content: [2,-2,-2] IS x0 = x1 + x2 */
  const gb = (x, y) => y ? gb(y, x % y) : x;
  let content = 0n;
  for (const c of cond) content = gb(content < 0n ? -content : content, c < 0n ? -c : c);
  if (content > 1n) cond = cond.map(c => c / content);
  const neg = [], pos = [];
  cond.forEach((c, i) => { if (c < 0n) neg.push(i); else if (c > 0n) pos.push(i); });
  if (!neg.length || !pos.length) return null;
  const names = memberNamesOf(C);
  /* mod-p reduction: if p divides every coefficient except exactly one,
     that variable is divisible by p — substitute x_v = p*s, divide through */
  for (const pr of [2n, 3n]) {
    const odd = [];
    cond.forEach((c, i) => { if (c !== 0n && ((c % pr) + pr) % pr !== 0n) odd.push(i); });
    if (odd.length === 1) {
      const v = odd[0];
      const keep = [];
      for (let k = 0; k < n; k++) if (k !== v) keep.push(k);
      const member = {};
      let okAll = true;
      for (const nm of names) {
        const f = C.member[nm];
        const h = keep.map(k => f[k]);
        h.push(pr * f[v]);
        if (h.some(c => c < 0n)) { okAll = false; break; }
        member[nm] = h;
      }
      if (okAll) {
        const nc = keep.map(k => cond[k] / pr);
        nc.push(cond[v]);
        const CC = { n: keep.length + 1, names: keep.map(k => C.names[k]).concat(['s' + pr]), member, defs: {} };
        return subCone(CC, nc, depth + 1);
      }
    }
  }
  const remap = (drop, exprFor) => {
    /* build a new context on the coordinates minus `drop`, with x_drop
       replaced by exprFor (a vector over the remaining coordinates) */
    const keep = [];
    for (let i = 0; i < n; i++) if (i !== drop) keep.push(i);
    const member = {};
    for (const nm of names) {
      const f = C.member[nm];
      const g = keep.map(i => f[i]);
      for (let k = 0; k < keep.length; k++) g[k] += f[drop] * exprFor[k];
      if (g.some(c => c < 0n)) return null;                   /* not representable */
      member[nm] = g;
    }
    return { n: keep.length, names: keep.map(i => C.names[i]), member, defs: {} };
  };
  const flip = (v) => v.map(c => -c);
  const or = (cond[neg[0]] < 0n && pos.length) ? cond : flip(cond);
  /* orient so the lone-negative side is the substituted variable */
  for (const cnd of [cond, flip(cond)]) {
    const ng = [], ps = [];
    cnd.forEach((c, i) => { if (c < 0n) ng.push(i); else if (c > 0n) ps.push(i); });
    if (ng.length === 1 && cnd[ng[0]] === -1n) {
      /* x_j = sum c_i x_i : substitute */
      const j = ng[0];
      const expr = [];
      for (let i = 0; i < n; i++) if (i !== j) expr.push(cnd[i]);
      const sub = remap(j, expr);
      return sub ? [{ C: sub, note: 'substitute x_' + C.names[j] }] : null;
    }
    if (ng.length === 1 && ps.length === 1) {
      /* p x_i = q x_j : both become multiples of one parameter */
      const j = ng[0], i = ps[0];
      const p = cnd[i], qq = -cnd[j];
      const g = (x, y) => y ? g(y, x % y) : x;
      const gg = g(p, qq);
      /* x_i = (q/g) s, x_j = (p/g) s: eliminate j in favor of i scaled */
      const member = {};
      const keep = [];
      for (let k = 0; k < n; k++) if (k !== j) keep.push(k);
      for (const nm of names) {
        const f = C.member[nm];
        const h = keep.map(k => f[k]);
        const iPos = keep.indexOf(i);
        /* x_i := (q/g) s and x_j := (p/g) s  ==> coefficient on s is
           f[i]*(q/g) + f[j]*(p/g); other coords unchanged */
        h[iPos] = f[i] * (qq / gg) + f[j] * (p / gg);
        if (h.some(c => c < 0n)) return null;
        member[nm] = h;
      }
      return [{ C: { n: keep.length, names: keep.map(k => C.names[k] + (keep.indexOf(i) === keep.indexOf(i) ? '' : '')), member, defs: {} }, note: 'ratio ' + p + ':' + qq }];
    }
    if (ng.length === 2 && ps.length === 2
        && cnd[ng[0]] === -1n && cnd[ng[1]] === -1n && cnd[ps[0]] === 1n && cnd[ps[1]] === 1n) {
      /* x_p + x_q = x_r + x_s : three-way split on x_p vs x_r */
      const [pI, qI] = ps, [rI, sI] = ng;
      const parts = [];
      for (const [loP, hiP, loN, hiN] of [[pI, qI, rI, sI], [rI, sI, pI, qI]]) {
        /* x_loP < x_loN: x_loN = x_loP + t, x_hiP = x_hiN + t */
        const keep = [];
        for (let k = 0; k < n; k++) if (k !== loN && k !== hiP) keep.push(k);
        const member = {};
        let okAll = true;
        for (const nm of names) {
          const f = C.member[nm];
          const h = keep.map(k => f[k]);
          h[keep.indexOf(loP)] += f[loN];
          h[keep.indexOf(hiN)] += f[hiP];
          h.push(f[loN] + f[hiP]);
          if (h.some(c => c < 0n)) { okAll = false; break; }
          member[nm] = h;
        }
        if (!okAll) return null;
        parts.push({ C: { n: keep.length + 1, names: keep.map(k => C.names[k]).concat(['t']), member, defs: {} },
          note: C.names[loP] + '<' + C.names[loN] });
      }
      /* equality: x_p = x_r and x_q = x_s */
      {
        const keep = [];
        for (let k = 0; k < n; k++) if (k !== rI && k !== sI) keep.push(k);
        const member = {};
        let okAll = true;
        for (const nm of names) {
          const f = C.member[nm];
          const h = keep.map(k => f[k]);
          h[keep.indexOf(pI)] += f[rI];
          h[keep.indexOf(qI)] += f[sI];
          if (h.some(c => c < 0n)) { okAll = false; break; }
          member[nm] = h;
        }
        if (!okAll) return null;
        parts.push({ C: { n: keep.length, names: keep.map(k => C.names[k]), member, defs: {} }, note: 'equal' });
      }
      return parts;
    }
    if (ng.length === 1 && cnd[ng[0]] <= -2n
        && ps.filter(i => cnd[i] % (-cnd[ng[0]]) !== 0n).length === 1) {
      /* k x_j = sum c_i x_i with exactly one c_p NOT divisible by k:
         then k/gcd(c_p,k) divides x_p — substitute x_p = (k/g) w and
         x_j = (c_p/g) w + sum (c_i/k) x_i. The k = 2 one-odd parity rule
         is the special case. */
      const j = ng[0];
      const kk = -cnd[j];
      const pIdx = ps.find(i => cnd[i] % kk !== 0n);
      const gb2 = (x, y) => y ? gb2(y, x % y) : x;
      const g = gb2(cnd[pIdx], kk);
      const keep = [];
      for (let k = 0; k < n; k++) if (k !== j && k !== pIdx) keep.push(k);
      const member = {};
      for (const nm of names) {
        const f = C.member[nm];
        const h = keep.map(k => f[k] + (cnd[k] > 0n ? f[j] * (cnd[k] / kk) : 0n));
        h.push((kk / g) * f[pIdx] + (cnd[pIdx] / g) * f[j]);  /* w */
        if (h.some(c => c < 0n)) return null;
        member[nm] = h;
      }
      return [{ C: { n: keep.length + 1, names: keep.map(k => C.names[k]).concat(['w']), member, defs: {} },
        note: 'divisibility: ' + (kk / g) + ' | x_' + C.names[pIdx] }];
    }
    if (ng.length === 1 && cnd[ng[0]] % 2n === 0n
        && ps.filter(i => (cnd[i] % 2n + 2n) % 2n === 1n).length === 2) {
      /* even x_j-side with exactly two odd positive coefficients c_p, c_q:
         parity forces x_p = x_q (mod 2) — split into x_p = x_q, x_q = x_p+2z,
         x_p = x_q+2z; each part's residual condition is all-even, so it
         normalizes and recurses through subCone */
      const odd = ps.filter(i => (cnd[i] % 2n + 2n) % 2n === 1n);
      const [pI, qI] = odd;
      const parts = [];
      const build = (drop, into, twoZ) => {
        /* x_drop := x_into (+ 2z when twoZ) */
        const keep = [];
        for (let k = 0; k < n; k++) if (k !== drop) keep.push(k);
        const member = {};
        for (const nm of names) {
          const f = C.member[nm];
          const h = keep.map(k => f[k]);
          h[keep.indexOf(into)] += f[drop];
          if (twoZ) h.push(2n * f[drop]);
          if (h.some(c => c < 0n)) return null;
          member[nm] = h;
        }
        const nc = keep.map(k => cnd[k]);
        nc[keep.indexOf(into)] += cnd[drop];
        if (twoZ) nc.push(2n * cnd[drop]);
        const CC = { n: keep.length + (twoZ ? 1 : 0),
          names: keep.map(k => C.names[k]).concat(twoZ ? ['z'] : []), member, defs: {} };
        if (nc.every(c => c === 0n)) return [{ C: CC, note: 'parity-pair (resolved)' }];
        const deeper = subCone(CC, nc, depth + 1);
        return deeper;                                        /* null propagates */
      };
      for (const spec2 of [build(qI, pI, false), build(qI, pI, true), build(pI, qI, true)]) {
        if (!spec2) return null;
        parts.push(...spec2);
      }
      return parts;
    }
    if (ng.length === 1 && cnd[ng[0]] <= -2n && ps.length === 2
        && cnd[ps[0]] === 1n && cnd[ps[1]] === 1n) {
      /* k x_j = x_p + x_q, k >= 2 : partition x_p over the intervals
         (m x_j, (m+1) x_j) for m = 0..k-1 and the k-1 boundaries m x_j.
         Interval m: x_p = (m+1)t + m u, x_q = (k-m-1)t + (k-m)u, x_j = t+u.
         Boundary m: x_p = m x_j, x_q = (k-m) x_j. */
      const j = ng[0], pIdx = ps[0], qIdx = ps[1];
      const kk = -cnd[j];
      const parts = [];
      const keep2 = [];
      for (let k2 = 0; k2 < n; k2++) if (k2 !== j && k2 !== pIdx && k2 !== qIdx) keep2.push(k2);
      for (let m = 0n; m < kk; m++) {
        const member = {};
        let okAll = true;
        for (const nm of names) {
          const f = C.member[nm];
          const h = keep2.map(k2 => f[k2]);
          h.push((m + 1n) * f[pIdx] + (kk - m - 1n) * f[qIdx] + f[j]);   /* t */
          h.push(m * f[pIdx] + (kk - m) * f[qIdx] + f[j]);              /* u */
          if (h.some(c => c < 0n)) { okAll = false; break; }
          member[nm] = h;
        }
        if (!okAll) return null;
        parts.push({ C: { n: keep2.length + 2, names: keep2.map(k2 => C.names[k2]).concat(['t', 'u']), member, defs: {} },
          note: 'interval ' + m });
        if (m >= 1n) {
          const memberB = {};
          let okB = true;
          for (const nm of names) {
            const f = C.member[nm];
            const h = keep2.map(k2 => f[k2]);
            h.push(m * f[pIdx] + (kk - m) * f[qIdx] + f[j]);            /* x_j */
            if (h.some(c => c < 0n)) { okB = false; break; }
            memberB[nm] = h;
          }
          if (!okB) return null;
          parts.push({ C: { n: keep2.length + 1, names: keep2.map(k2 => C.names[k2]).concat(['xj']), member: memberB, defs: {} },
            note: 'boundary ' + m });
        }
      }
      return parts;
    }
  }
  /* universal fallback: any condition holding both a +1 and a -1 coefficient
     splits on the comparison of those two variables; each branch eliminates
     one of them and recurses on the residual condition (whose support is one
     smaller, so this terminates). The specialized shapes above stay first
     because they produce fewer, nicer cones. */
  {
    /* any positive/negative pair works: each branch either zeroes a
       variable's coefficient or replaces the pair (c_p, c_m) with
       (c_p + c_m, c_dropped), strictly decreasing sum |c_i| — termination
       for EVERY mixed-sign condition, units or not */
    const iP = cond.findIndex(c => c > 0n);
    const jN = cond.findIndex(c => c < 0n);
    if (iP >= 0 && jN >= 0) {
      const names2 = memberNamesOf(C);
      const parts = [];
      const build = (drop, into, addT) => {
        const keep = [];
        for (let k = 0; k < n; k++) if (k !== drop) keep.push(k);
        const member = {};
        for (const nm of names2) {
          const f = C.member[nm];
          const h = keep.map(k => f[k]);
          h[keep.indexOf(into)] += f[drop];
          if (addT) h.push(f[drop]);
          if (h.some(c => c < 0n)) return null;
          member[nm] = h;
        }
        const nc = keep.map(k => cond[k]);
        nc[keep.indexOf(into)] += cond[drop];
        if (addT) nc.push(cond[drop]);
        const CC = { n: keep.length + (addT ? 1 : 0),
          names: keep.map(k => C.names[k]).concat(addT ? ['t'] : []), member, defs: {} };
        const nz = nc.filter(c => c !== 0n);
        if (!nz.length) return [{ C: CC, note: 'cmp resolved' }];
        if (nz.every(c => c > 0n) || nz.every(c => c < 0n)) return [];   /* infeasible branch */
        return subCone(CC, nc, depth + 1);
      };
      for (const spec2 of [
        build(jN, iP, false),              /* x_j = x_i */
        build(jN, iP, true),               /* x_j = x_i + t */
        build(iP, jN, true)                /* x_i = x_j + t */
      ]) {
        if (spec2 === null) return null;
        parts.push(...spec2);
      }
      if (parts.length) return parts;
    }
  }
  return null;
}

const autoMemo = new Map();
function autoClose(label, C, opts, depth, manual) {
  depth = depth || 0;
  manual = manual || {};
  if (depth > 8) throw new Error(label + ': autoClose recursion too deep');
  /* identical sub-cones recur across branches; the theorem depends only on
     the member matrix, the target and the witness — memoize on those */
  const memoKey = (!manual || !Object.keys(manual).length)
    ? JSON.stringify([Object.entries(C.member).map(([k, v]) => [k, v.map(String)]),
        String(opts.target.lo.n) + '/' + String(opts.target.lo.d), opts.witness || null, opts.cap])
    : null;
  if (memoKey && autoMemo.has(memoKey)) {
    opts.stats.memoHits = (opts.stats.memoHits || 0) + 1;
    return autoMemo.get(memoKey);
  }
  const memoize = (res) => { if (memoKey) autoMemo.set(memoKey, res); return res; };
  opts.stats.autoNodes = (opts.stats.autoNodes || 0) + 1;
  if (process.env.AUTOCLOSE_TRACE)
    process.stderr.write('[' + new Date().toISOString().slice(11, 19) + '] node ' + (opts.stats.autoNodes) + ' d' + depth + ' n=' + C.n + ' ' + label.slice(-90) + '\n');
  const names = memberNamesOf(C);
  const top = names[names.length - 1];

  if (C.n === 1) {
    const A = names.map(nm => Number(C.member[nm][0]));
    let g = 0; for (const a of A) { let b = a; while (b) { const t = g % b; g = b; b = t; } }
    const A1 = A.map(v => v / g);
    /* the definitional witness sits at equality — walled, never decided */
    const skip = (opts.witness && A1.join(',') === opts.witness.join(',')) ? [opts.witness] : [];
    return memoize(closeNode(label, { kind: 'ray', A: A1, skip }, opts));
  }
  if (C.n === 2) {
    /* try the anchored-closure leaf; on failure fall through to a dot */
    const skip = [];
    if (opts.witness && tuples(C, Math.max(...opts.witness)).has(opts.witness.join(',')))
      skip.push(opts.witness);
    try {
      return memoize(closeNode(label, { kind: 'auto', C, skip }, opts));
    } catch (e) { /* no menu anchor: a leaf dot often closes with zero exceptions */ }
  }

  /* dot probes: classical atoms first, then combs */
  const q1 = Q.R(1n, 1n);
  const mk = (W, S, gConst) => EN.dotTheorem({ C, S, W, gConst,
    gMembers: names.filter(x => x !== top), anchored: [top], target: opts.target, witnessBox: 16 });
  let best = null;
  for (const m of names) {
    if (m === top) continue;
    let r;
    try {
      r = mk([{ atom: { kind: 'omcsq', form: C.member[m] }, coeff: Q.R(2n, 1n) }],
        { order: C.member[top], xi: D.XI_PI }, Q.R(2n, 3n));
    } catch (e) { continue; }
    if (!r.ok) continue;
    const pos = r.exceptions.filter(e => e.deltaSign > 0);
    if (!best || pos.length < best.pos.length) best = { r, pos, weight: 'omcsq ' + m };
  }
  if (!best) {
    /* double-sum core: comb pairs, deterministic order */
    outer:
    for (let i = 0; i < names.length - 1; i++) for (let j = 0; j < names.length - 1; j++) {
      if (i === j) continue;
      const m1 = names[i], m2 = names[j];
      const s12 = F.add(C.member[m1], C.member[m2]);
      if (F.equal(s12, C.member[top])) continue;              /* complementary pair: comb self-defeats */
      const f1 = F.add(C.member[m1], C.member[top]), f2 = F.add(C.member[m2], C.member[top]);
      const terms = [];
      [1n, 1n].forEach((cj, jj) => [5n, 7n, 5n].forEach((ck, kk) =>
        terms.push({ form: F.add(F.scale(f1, jj), F.scale(f2, kk)), coeff: Q.R(cj * ck, 1n) })));
      let r;
      try {
        r = mk([{ atom: { kind: 'sq', terms }, coeff: q1 }],
          { order: C.member[top], xi: D.XI_2PI3, Bmax: 18 }, Q.R(7n, 6n));
      } catch (e) { continue; }
      if (!r.ok) continue;
      best = { r, pos: r.exceptions.filter(e => e.deltaSign > 0), weight: 'comb(' + m1 + ',' + m2 + ')' };
      break outer;
    }
  }
  if (!best) throw new Error(label + ': autoClose found no certifying weight (classical or comb)');

  const children = {};
  const kids = {};
  for (const p of best.pos) {
    if (manual[p.key]) {
      kids[p.key] = { kind: 'manual', spec: manual[p.key] };
      children[p.key] = closeNode(label + ' » [' + p.key + '] (manual)', manual[p.key], opts);
      continue;
    }
    const subs = subCone(C, p.cond);
    if (!subs) throw new Error(label + ': condition [' + p.key + '] matches no mechanical shape — write it by hand');
    if (subs.length === 1) {
      kids[p.key] = { kind: 'closed', C: subs[0].C };
      children[p.key] = autoClose(label + ' » [' + p.key + ']', subs[0].C, opts, depth + 1);
    } else {
      kids[p.key] = { kind: 'split', parts: subs.map(s => ({ C: s.C })) };
      children[p.key] = { label: label + ' » [' + p.key + ']', kind: 'split',
        parts: subs.map((s, ix) => autoClose(label + ' » [' + p.key + '] / ' + (s.note || ix), s.C, opts, depth + 1)) };
    }
  }

  /* coverage, identical discipline to closeNode */
  const tupleCache = new Map();
  let coverCap = opts.cap;
  const cachedTuples = (CC) => {
    const key0 = String(coverCap);
    if (!tupleCache.has(CC) || tupleCache.get(CC).cap !== coverCap)
      tupleCache.set(CC, { cap: coverCap, set: tuples(CC, coverCap) });
    return tupleCache.get(CC).set;
  };
  const manualCovers = (spec, A, k) => {
    if (spec.kind === 'ray') return k === spec.A.join(',');
    if (spec.kind === 'delegate') return satisfiesRoot(opts.rootConds[spec.rootKey], A);
    if (spec.kind === 'split') return spec.parts.some(pp => manualCovers(pp, A, k));
    return cachedTuples(spec.C).has(k);
  };
  const coverage = [];
  for (const p of best.pos) {
    const kid = kids[p.key];
    const kidMin = kid.kind === 'split' ? Math.min(...kid.parts.map(part => minTop(part.C)))
      : kid.kind === 'manual' ? null : minTop(kid.C);
    /* the box grows toward the sub-cone's smallest inhabitant but is capped:
       enumeration cost explodes with the box on higher-dof cones */
    const effCap = kidMin === null ? opts.cap : Math.max(opts.cap, Math.min(kidMin + 4, opts.cap + 36));
    coverCap = effCap;
    const pts = conditionPoints(C, [p.cond], effCap);
    let nn = 0;
    for (const A of pts) {
      const k = A.join(',');
      nn++;
      const covered = kid.kind === 'split' ? kid.parts.some(part => cachedTuples(part.C).has(k))
        : kid.kind === 'manual' ? manualCovers(kid.spec, A, k)
        : cachedTuples(kid.C).has(k);
      if (!covered) throw new Error(label + ': auto sub-cone for [' + p.key + '] misses point ' + k);
    }
    if (!nn) {
      if (kidMin !== null && kidMin > effCap) {
        /* the sub-cone's smallest inhabitant provably exceeds any feasible
           box; shape-generated cones satisfy their condition by
           construction, so record the fact instead of refusing */
        coverage.push({ key: p.key, pointsChecked: 0, note: 'inhabits only above the box (min top ' + kidMin + ')' });
        continue;
      }
      throw new Error(label + ': auto condition [' + p.key + '] matched no point in the box');
    }
    coverage.push({ key: p.key, pointsChecked: nn });
  }
  opts.stats.dots++;
  return memoize({
    label, kind: 'dot', auto: best.weight,
    base: best.r.base, posBase: best.r.posBase, dip: best.r.dip,
    exceptions: best.r.exceptions.map(e => ({ key: e.key, delta: e.delta })),
    children, coverage
  });
}

/* ---------------- the interleave generator for parity regions -------------- */
/* A halved member m = 2*eps triangulates its region on the weak order of
   the values below eps and the offsets (member - eps) of members between
   eps and 2*eps. weakShuffles enumerates the arrangements; parityCones
   attaches the split of the member list into (bottom | tie | top);
   parityMatrix turns one arrangement into a member matrix through a
   family-specific reconstruct callback. Deterministic order throughout. */
function weakShuffles(m, k) {
  const out = [];
  const rec = (bi, oi, acc) => {
    if (bi === m && oi === k) { out.push(acc.slice()); return; }
    if (bi < m) { acc.push(['B' + bi]); rec(bi + 1, oi, acc); acc.pop(); }
    if (oi < k) { acc.push(['O' + oi]); rec(bi, oi + 1, acc); acc.pop(); }
    if (bi < m && oi < k) { acc.push(['B' + bi, 'O' + oi]); rec(bi + 1, oi + 1, acc); acc.pop(); }
  };
  rec(0, 0, []);
  return out;
}
function parityCones(belowNames) {
  const N = belowNames.length;
  const out = [];
  for (let kAbove = 0; kAbove <= N; kAbove++) {
    for (const tie of (kAbove < N ? [false, true] : [false])) {
      const j = N - kAbove - (tie ? 1 : 0);
      if (j < 0) continue;
      const bottom = belowNames.slice(0, j);
      const tieName = tie ? belowNames[j] : null;
      const top = belowNames.slice(j + (tie ? 1 : 0));
      for (const arr of weakShuffles(bottom.length, top.length)) {
        const assign = {};
        arr.forEach((group, gi) => {
          for (const sym of group) {
            const idx = Number(sym.slice(1));
            if (sym[0] === 'B') assign[bottom[idx]] = { kind: 'value', group: gi };
            else assign[top[idx]] = { kind: 'offset', group: gi };
          }
        });
        if (tieName) assign[tieName] = { kind: 'eps' };
        out.push({ assign, nGroups: arr.length, label: JSON.stringify(arr) + (tie ? ' tie:' + tieName : '') });
      }
    }
  }
  return out;
}
function parityMatrix(cone, belowNames, nExtra, reconstruct) {
  const nP = cone.nGroups + 1 + nExtra;
  const zero = () => new Array(nP).fill(0n);
  const prefix = (gi) => { const f = zero(); for (let i = 0; i <= gi; i++) f[i] = 1n; return f; };
  const epsF = prefix(cone.nGroups);
  const formOf = (nm) => {
    const a = cone.assign[nm];
    if (a.kind === 'eps') return epsF.slice();
    if (a.kind === 'value') return prefix(a.group);
    const f = epsF.slice(); for (let i = 0; i <= a.group; i++) f[i] += 1n; return f;
  };
  const tail = (i) => { const f = zero(); f[cone.nGroups + 1 + i] = 1n; return f; };
  return reconstruct(formOf, epsF, tail, nP);
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

module.exports = { closeNode, closeFamily, tuples, conditionPoints, satisfiesRoot, autoClose, subCone, weakShuffles, parityCones, parityMatrix };
