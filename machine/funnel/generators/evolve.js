/* generators/evolve.js — mutate/crossover the leaderboard's best, seeded.
   Runs INSIDE the write-fence (bare vm context: no require/fs/process); its
   only output is its return value. Interface: next(state, rng) -> {candidate,
   state, hypothesis}. Deterministic given (seed rng, leaderboard sequence).

   The runner injects state.leaderboard (top certified HITs, [{candidate,
   score}], deep-copied — mutating it here mutates a copy) and state.recent
   before every call. Supports the house candidate shape: one integer-vector
   field described by candidateSchema as
     {type:'object', properties:{<name>:{type:'array', items:{type:'integer',
      minimum, maximum}, minItems, maxItems}}, required:[<name>]}
   Other shapes need an instance-local generator (README: the interface is the
   contract, not this file). */
'use strict';

function vectorField(schema) {
  var props = (schema && schema.properties) || {};
  var names = [];
  for (var k in props) names.push(k);
  if (names.length !== 1) throw new Error('evolve: expected exactly one candidate field, got ' + names.length);
  var name = names[0];
  var f = props[name];
  if (!f || f.type !== 'array' || !f.items || f.items.type !== 'integer') {
    throw new Error('evolve: expected an integer-array candidate field; write an instance-local generator for other shapes');
  }
  var len = f.minItems !== undefined ? f.minItems : (f.maxItems !== undefined ? f.maxItems : 2);
  return {
    name: name,
    len: len,
    lo: f.items.minimum !== undefined ? f.items.minimum : 0,
    hi: f.items.maximum !== undefined ? f.items.maximum : 100
  };
}

function clamp(x, lo, hi) { return x < lo ? lo : (x > hi ? hi : x); }

function randVector(field, rng) {
  var v = new Array(field.len);
  for (var i = 0; i < field.len; i++) {
    v[i] = field.lo + Math.floor(rng() * (field.hi - field.lo + 1));
  }
  return v;
}

module.exports = {
  name: 'evolve',

  init: function (ctx) {
    if (!ctx || !ctx.schema) throw new Error('evolve: init needs ctx.schema (the candidateSchema)');
    vectorField(ctx.schema); /* validate shape now, fail loudly at start */
    return { schema: ctx.schema, draws: 0 };
  },

  next: function (state, rng) {
    var field = vectorField(state.schema);
    var lb = state.leaderboard || [];
    var candidate = {};
    var hypothesis;

    if (lb.length === 0 || rng() < 0.2) {
      candidate[field.name] = randVector(field, rng);
      hypothesis = '[evolve] uniform draw (' + (lb.length === 0 ? 'empty leaderboard' : 'exploration') + ')';
    } else {
      var pi = Math.floor(rng() * lb.length);
      var parent = lb[pi].candidate[field.name].slice();
      var tag;
      if (lb.length > 1 && rng() < 0.3) {
        var qi = Math.floor(rng() * lb.length);
        if (qi === pi) qi = (qi + 1) % lb.length;
        var other = lb[qi].candidate[field.name];
        for (var i = 0; i < parent.length; i++) {
          if (rng() < 0.5) parent[i] = other[i];
        }
        tag = 'crossover parents #' + pi + 'x#' + qi;
      } else {
        tag = 'mutate parent #' + pi;
      }
      var deltas = [];
      for (var j = 0; j < parent.length; j++) {
        if (rng() < 0.6) {
          var d = (1 + Math.floor(rng() * 3)) * (rng() < 0.5 ? -1 : 1);
          parent[j] = clamp(parent[j] + d, field.lo, field.hi);
          deltas.push(j + ':' + (d > 0 ? '+' : '') + d);
        }
      }
      candidate[field.name] = parent;
      hypothesis = '[evolve] ' + tag + (deltas.length ? ' deltas ' + deltas.join(',') : ' (no deltas)');
    }

    return {
      candidate: candidate,
      state: { schema: state.schema, draws: state.draws + 1 },
      hypothesis: hypothesis
    };
  }
};
