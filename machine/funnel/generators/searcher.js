/* generators/searcher.js — evolve the SEARCHER, not the object (Phase 4).
   Runs INSIDE the write-fence (bare vm context: no require/fs/process); its
   only output is its return value.

   THE LEVER (scout read 2026-08-20): in the AlphaEvolve mathematics paper the
   decisive human move was switching from evolving constructions to evolving
   small PROGRAMS that build constructions — a few lines of code stood in for
   a 200,000-element witness and extrapolated across sizes. This generator is
   that mode for the house candidate shape, WITHOUT arbitrary code execution:
   the genome is a program in a tiny bounded DSL, interpreted here under a
   hard step budget and hard size caps — no eval, no Function constructor, no
   halting problem, and the vm fence stays exactly as strong as it was.

   DSL — a program is 1..8 ops, each op [code, a, b], interpreted over a
   vector being built (all values integers; every emitted element clamped to
   the schema's [lo,hi] at the end):
     ['range',  a, b]  v becomes [a, a+1, ..., b] (length capped at 64)
     ['append', x, _]  push x
     ['remove', i, _]  delete index (i mod length), only when length > 1
     ['add',    k, _]  add k to every element
     ['set',    i, x]  v[i mod length] = x
   After the ops run, the vector is coerced to the schema: elements clamped,
   length padded (with lo) or truncated to [minItems, maxItems]. A program IS
   a legible family — the hypothesis line carries its source, so a hit's
   record shows the generating law, not only the instance.

   CREDIT ASSIGNMENT: the runner injects state.recent, whose newest entry is
   this generator's own previous candidate with its measured outcome (score,
   certVerdict, why). That outcome funds the fitness of the program that
   emitted it (+1000 for a certified HIT, so hit-producing programs breed).
   Deterministic given (seed rng, leaderboard/recent sequence); state is pure
   JSON, so kill-and-resume reproduces byte-for-byte. */
'use strict';

var OPS = ['range', 'append', 'remove', 'add', 'set'];
var MAX_PROG = 8;
var MAX_LEN = 64;
var POP = 8;

function vectorField(schema) {
  var props = (schema && schema.properties) || {};
  var names = [];
  for (var k in props) names.push(k);
  if (names.length !== 1) throw new Error('searcher: expected exactly one candidate field, got ' + names.length);
  var name = names[0];
  var f = props[name];
  if (!f || f.type !== 'array' || !f.items || f.items.type !== 'integer') {
    throw new Error('searcher: expected an integer-array candidate field; write an instance-local generator for other shapes');
  }
  return {
    name: name,
    minLen: f.minItems !== undefined ? f.minItems : 1,
    maxLen: f.maxItems !== undefined ? f.maxItems : 8,
    lo: f.items.minimum !== undefined ? f.items.minimum : 0,
    hi: f.items.maximum !== undefined ? f.items.maximum : 100
  };
}

function clamp(x, lo, hi) { return x < lo ? lo : (x > hi ? hi : x); }

/* interpret a program: bounded steps, bounded lengths, never throws */
function interpret(prog, field) {
  var v = [];
  var steps = 0;
  for (var i = 0; i < prog.length && steps < 2 * MAX_PROG; i++) {
    steps++;
    var op = prog[i], code = op[0], a = op[1] | 0, b = op[2] | 0;
    if (code === 'range') {
      var lo = Math.min(a, b), hi = Math.max(a, b);
      if (hi - lo + 1 > MAX_LEN) hi = lo + MAX_LEN - 1;   /* hard size cap */
      v = [];
      for (var x = lo; x <= hi; x++) v.push(x);
    } else if (code === 'append') {
      if (v.length < MAX_LEN) v.push(a);
    } else if (code === 'remove') {
      if (v.length > 1) v.splice(((a % v.length) + v.length) % v.length, 1);
    } else if (code === 'add') {
      for (var j = 0; j < v.length; j++) v[j] += a;
    } else if (code === 'set') {
      if (v.length > 0) v[((a % v.length) + v.length) % v.length] = b;
    }
  }
  /* coerce to schema */
  while (v.length < field.minLen) v.push(field.lo);
  if (v.length > field.maxLen) v.length = field.maxLen;
  for (var m = 0; m < v.length; m++) v[m] = clamp(Math.round(v[m]), field.lo, field.hi);
  return v;
}

function progText(prog) {
  return prog.map(function (op) { return op[0] + '(' + op[1] + (op[0] === 'set' ? ',' + op[2] : '') + ')'; }).join('; ');
}

function randInt(rng, lo, hi) { return lo + Math.floor(rng() * (hi - lo + 1)); }

function randOp(rng, field) {
  var code = OPS[Math.floor(rng() * OPS.length)];
  if (code === 'range') {
    var a = randInt(rng, field.lo, field.hi);
    return ['range', a, clamp(a + randInt(rng, 0, field.maxLen - 1), field.lo, field.hi)];
  }
  if (code === 'set') return ['set', randInt(rng, 0, field.maxLen - 1), randInt(rng, field.lo, field.hi)];
  if (code === 'remove') return ['remove', randInt(rng, 0, field.maxLen - 1), 0];
  if (code === 'add') return ['add', randInt(rng, -3, 3), 0];
  return ['append', randInt(rng, field.lo, field.hi), 0];
}

function randProg(rng, field) {
  var n = 1 + Math.floor(rng() * 3);
  var p = [['range', field.lo, clamp(field.lo + field.minLen - 1, field.lo, field.hi)]];
  for (var i = 0; i < n; i++) p.push(randOp(rng, field));
  return p.slice(0, MAX_PROG);
}

function mutate(prog, rng, field) {
  var p = prog.map(function (op) { return op.slice(); });
  var r = rng();
  if (r < 0.3 && p.length < MAX_PROG) {
    p.splice(Math.floor(rng() * (p.length + 1)), 0, randOp(rng, field));
    return { prog: p, tag: 'insert-op' };
  }
  if (r < 0.5 && p.length > 1) {
    p.splice(Math.floor(rng() * p.length), 1);
    return { prog: p, tag: 'delete-op' };
  }
  var i = Math.floor(rng() * p.length);
  if (rng() < 0.5) {
    p[i] = randOp(rng, field);
    return { prog: p, tag: 'replace-op@' + i };
  }
  var slot = rng() < 0.5 ? 1 : 2;
  p[i][slot] = (p[i][slot] | 0) + randInt(rng, -2, 2);
  return { prog: p, tag: 'nudge-op@' + i };
}

module.exports = {
  name: 'searcher',

  init: function (ctx) {
    if (!ctx || !ctx.schema) throw new Error('searcher: init needs ctx.schema (the candidateSchema)');
    vectorField(ctx.schema); /* validate shape now, fail loudly at start */
    return { schema: ctx.schema, population: null, lastIdx: null, draws: 0 };
  },

  next: function (state, rng) {
    var field = vectorField(state.schema);
    var pop = state.population;
    if (!pop) {
      pop = [];
      for (var i = 0; i < POP; i++) pop.push({ prog: randProg(rng, field), fit: 0, tried: 0 });
    }

    /* credit assignment: the newest recent entry is our previous emission */
    if (state.lastIdx !== null && state.recent && state.recent.length) {
      var last = state.recent[state.recent.length - 1];
      var gain = (typeof last.score === 'number' ? last.score : 0) + (last.certVerdict === 'HIT' ? 1000 : 0);
      var slot = pop[state.lastIdx];
      slot.tried++;
      if (gain > slot.fit) slot.fit = gain;
    }

    /* selection: 2-tournament by fitness; then mutate, or fresh blood at 15% */
    var idx, tag;
    if (rng() < 0.15) {
      var worst = 0;
      for (var w = 1; w < pop.length; w++) if (pop[w].fit < pop[worst].fit) worst = w;
      pop[worst] = { prog: randProg(rng, field), fit: 0, tried: 0 };
      idx = worst; tag = 'fresh';
    } else {
      var a = Math.floor(rng() * pop.length);
      var b = Math.floor(rng() * pop.length);
      var winner = pop[a].fit >= pop[b].fit ? a : b;
      var loser = winner === a ? b : a;
      var m = mutate(pop[winner].prog, rng, field);
      pop[loser] = { prog: m.prog, fit: pop[winner].fit * 0.5, tried: 0 };
      idx = loser; tag = m.tag + ' of #' + winner;
    }

    var v = interpret(pop[idx].prog, field);
    var candidate = {};
    candidate[field.name] = v;
    return {
      candidate: candidate,
      hypothesis: '[searcher ' + tag + '] ' + progText(pop[idx].prog),
      state: { schema: state.schema, population: pop, lastIdx: idx, draws: state.draws + 1 }
    };
  }
};

/* exported for the battery (host-side require): the interpreter's caps are a
   safety property worth testing without a run around them */
module.exports.interpret = interpret;
module.exports.progText = progText;
