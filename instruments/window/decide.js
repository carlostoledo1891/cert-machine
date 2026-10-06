/* decide.js — a published limit, a forecast band, a window: one verdict.
   instruments/window · cert-machine

   A rule is a set of limits as printed by whoever owns them (a Capitania's
   NPCP, a DNV table, an operator's own procedure): "operate only if Hs < 2.0 m
   and sustained wind < 22 kn". A forecast enters as a PROPOSER: at each of its
   own time steps, for each variable, a band [lo, hi] at a stated coverage —
   never a bare point. The verdict is decided over the WHOLE band, exactly:

     VETADA     (BLOCKED)    some limit fails even at the band's favourable
                             edge, at some step of the window — the witness
                             is that step and that variable;
     LIBERADA   (CLEARED)    every limit holds at the band's unfavourable edge,
                             at every step of the window;
     SEM DADOS  (NEEDS DATA) what the feed forecasts clears, but the rule also
                             limits something the feed does not forecast
                             (current, visibility...) — named, never assumed;
     INDEFINIDA (UNDECIDED)  the band straddles a limit: the flip threshold
                             says how far the unfavourable edge must move.

   What the verdict is about: the band, at the forecast's own steps, at the
   forecast node. It is NOT a statement about the sea between steps, nor at a
   berth the node does not represent, nor a probability: the band's coverage is
   the proposer's claim, graded elsewhere (instruments/forecast admission).

   Vessel attributes printed beside a sea-state limit (draft, LOA, speed) are
   the operator's to check and are listed, never decided here.

   MIT licensed. Part of cert-machine.                                    */
'use strict';

const Q = require('./q.js');

const SEA = new Set(['hs', 'tp', 'wind_sustained', 'wind_gust', 'current', 'visibility']);
const VESSEL = new Set(['draft', 'loa', 'beam', 'speed', 'dwt']);

/* does value v satisfy "v op limit"? */
function holds(v, op, limit) {
  const c = Q.cmp(v, limit);
  switch (op) {
    case '<': return c < 0;
    case '<=': return c <= 0;
    case '>': return c > 0;
    case '>=': return c >= 0;
    default: throw new Error('REFUSED: unknown operator ' + op);
  }
}
/* the band's unfavourable and favourable edges for a limit of this direction */
const upper = (op) => op === '<' || op === '<=';
const worst = (b, op) => (upper(op) ? b.hi : b.lo);
const best = (b, op) => (upper(op) ? b.lo : b.hi);

/* decide(rule, forecast, window)
   rule:     { id, limits: [{var, op, value, unit}] }
   forecast: { unit: {var: unit}, steps: [{t, vars: {var: {lo, hi}}}], coverage, proposer }
   window:   [t0, t1] ISO strings, inclusive */
function decide(rule, forecast, window) {
  const [t0, t1] = window;
  const steps = forecast.steps.filter((s) => s.t >= t0 && s.t <= t1);
  const sea = rule.limits.filter((l) => SEA.has(l.var));
  const vessel = rule.limits.filter((l) => VESSEL.has(l.var));
  const unknown = rule.limits.filter((l) => !SEA.has(l.var) && !VESSEL.has(l.var));
  if (unknown.length) throw new Error('REFUSED: rule ' + rule.id + ' limits an unknown variable: ' + unknown.map((l) => l.var).join(', '));
  if (!steps.length) return { verdict: 'RECUSADA', en: 'REFUSED', why: 'no forecast step inside the window ' + t0 + ' .. ' + t1 };
  const missing = [], decided = [];
  for (const l of sea) {
    const fu = forecast.unit && forecast.unit[l.var];
    const have = steps.every((s) => s.vars[l.var]);
    if (!have) { missing.push(l); continue; }
    if (fu !== l.unit) throw new Error('REFUSED: ' + l.var + ' is forecast in ' + fu + ' but limited in ' + l.unit + ' — convert at the source');
    decided.push(l);
  }
  const base = { rule: rule.id, window, steps: steps.length, coverage: forecast.coverage || null, proposer: forecast.proposer || null,
    decidedOn: decided.map((l) => l.var), notForecast: missing.map((l) => l.var), vesselLimits: vessel.map((l) => l.var + ' ' + l.op + ' ' + l.value + ' ' + l.unit) };

  /* 1. a refutation anywhere wins: the favourable edge already fails */
  for (const s of steps) {
    for (const l of decided) {
      const b = s.vars[l.var], lim = Q.parse(l.value);
      const fav = Q.parse(best(b, l.op));
      if (!holds(fav, l.op, lim)) {
        return { ...base, verdict: 'VETADA', en: 'BLOCKED',
          witness: { t: s.t, var: l.var, edge: Q.str(fav), limit: l.op + ' ' + l.value + ' ' + l.unit,
            why: 'even the band\'s favourable edge (' + Q.dec(fav, 2) + ' ' + l.unit + ') breaks ' + l.var + ' ' + l.op + ' ' + l.value } };
      }
    }
  }
  /* 2. straddles: the unfavourable edge breaks a limit somewhere */
  const straddles = [];
  for (const s of steps) {
    for (const l of decided) {
      const b = s.vars[l.var], lim = Q.parse(l.value);
      const unf = Q.parse(worst(b, l.op));
      if (!holds(unf, l.op, lim)) straddles.push({ t: s.t, var: l.var, op: l.op, unit: l.unit, edge: unf, limit: lim,
        gap: upper(l.op) ? Q.sub(unf, lim) : Q.sub(lim, unf) });
    }
  }
  if (straddles.length) {
    /* the flip threshold: per variable, the largest distance the unfavourable edge must move */
    const flips = {};
    for (const x of straddles) {
      const f = flips[x.var];
      if (!f || Q.cmp(x.gap, f.gapQ) > 0) flips[x.var] = { var: x.var, t: x.t, gapQ: x.gap, gap: Q.str(x.gap), gapDec: Q.dec(x.gap, 2, 'up'),
        unit: x.unit, edge: Q.str(x.edge), limit: x.op + ' ' + Q.str(x.limit) };
    }
    const fl = Object.values(flips).map(({ gapQ, ...rest }) => rest);
    return { ...base, verdict: 'INDEFINIDA', en: 'UNDECIDED', straddles: straddles.length,
      flip: fl, why: 'the band straddles ' + fl.map((f) => f.var + ' ' + f.limit + ' ' + f.unit + ' (unfavourable edge ' + f.gapDec + ' ' + f.unit + ' beyond, at ' + f.t + ')').join('; ') };
  }
  /* 3. everything forecast clears; is anything limited that is not forecast? */
  if (missing.length) {
    if (!decided.length) {
      return { ...base, verdict: 'SEM DADOS', en: 'NEEDS DATA',
        why: 'nothing this rule limits has a measured forecast band here: ' + missing.map((l) => l.var + ' ' + l.op + ' ' + l.value + ' ' + l.unit).join(', ') };
    }
    return { ...base, verdict: 'SEM DADOS', en: 'NEEDS DATA',
      why: 'clears on ' + base.decidedOn.join(' and ') + ' over the whole band; the rule also limits ' + missing.map((l) => l.var + ' ' + l.op + ' ' + l.value + ' ' + l.unit).join(', ') + ', which the feed does not forecast' };
  }
  return { ...base, verdict: 'LIBERADA', en: 'CLEARED', why: 'every limit holds at the band\'s unfavourable edge at all ' + steps.length + ' steps' };
}

module.exports = { decide, holds, SEA, VESSEL };
