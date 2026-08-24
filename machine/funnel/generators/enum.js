/* generators/enum.js — grid/family enumeration from a declared spec.
   Runs INSIDE the write-fence (bare vm context: no require/fs/process); its
   only output is its return value. Interface: next(state, rng) -> {candidate,
   state, hypothesis} — {candidate: null, done: true} signals exhaustion.

   Reads target.enumSpec (pure data, injected via init ctx):
     { type: 'intGrid', name: '<field>', ranges: [[lo,hi], ...] }
   Enumerates the full integer grid in mixed-radix order, deterministically:
   index i decodes to coordinates with the LAST range varying fastest. The rng
   is unused — enumeration owes nothing to chance. */
'use strict';

module.exports = {
  name: 'enum',

  init: function (ctx) {
    var spec = ctx && ctx.enumSpec;
    if (!spec || spec.type !== 'intGrid' || !spec.name || !spec.ranges || !spec.ranges.length) {
      throw new Error('enum: target must declare enumSpec {type:"intGrid", name, ranges:[[lo,hi],...]} — the baseline generator needs an enumerable box');
    }
    var total = 1;
    for (var d = 0; d < spec.ranges.length; d++) {
      var lo = spec.ranges[d][0], hi = spec.ranges[d][1];
      if (hi < lo) throw new Error('enum: empty range at dim ' + d);
      total = total * (hi - lo + 1);
    }
    return { i: 0, total: total, spec: spec };
  },

  next: function (state, rng) {
    if (state.i >= state.total) {
      return { candidate: null, done: true, state: { i: state.i, total: state.total, spec: state.spec }, hypothesis: 'enum exhausted' };
    }
    var spec = state.spec;
    var idx = state.i;
    var coords = new Array(spec.ranges.length);
    for (var d = spec.ranges.length - 1; d >= 0; d--) {
      var lo = spec.ranges[d][0], hi = spec.ranges[d][1];
      var size = hi - lo + 1;
      coords[d] = lo + (idx % size);
      idx = (idx - (idx % size)) / size;
    }
    var candidate = {};
    candidate[spec.name] = coords;
    return {
      candidate: candidate,
      state: { i: state.i + 1, total: state.total, spec: spec },
      hypothesis: 'enum intGrid index ' + state.i + ' of ' + state.total
    };
  }
};
