/**
 * refutation.mjs — a failed rollout, drawn as the smallest graph that refutes it.
 *
 * A line of text saying "verdict ADMISSIBLE, decided REFUSED" is a fact without
 * a reason. The subgraph carries the reason, and it carries it in the grammar:
 * what was DERIVED arrives on a solid wire because its source emits an exact
 * kind, and what was merely ASSERTED arrives dashed because the claim node
 * emits FLOAT. Nobody chooses those inks here either.
 *
 * Four shapes, one per way a claim fails, and each is built from a real rollout.
 */

import { graph, node } from './graph.mjs';
import { FLOAT, INTERVAL, RATIONAL } from './port.mjs';
import { toSVG } from './render.mjs';

const V = { ADMISSIBLE: 'certified', REFUSED: 'refuted', STRADDLES: 'refused', NEEDS_DATA: 'refused' };
const src = (id, title, outputs, emits = INTERVAL) =>
  node({ id, title, inputs: [], outputs, emits, run: () => ({ port: outputs[0], value: null }) });
const inst = (id, title, inputs) =>
  node({ id, title, inputs, instrument: true, deciding: inputs, emits: RATIONAL, run: () => ({ port: 'certified', value: null }) });
/* the model's answer is an ASSERTION, so it emits FLOAT and its wire is dashed */
const claim = (said) => node({ id: 'claim', title: `it answered ${said}`, inputs: [], outputs: ['answer'],
  emits: FLOAT, run: () => ({ port: 'answer', value: null }) });
const clash = (id = 'clash', title = 'contradiction') => node({
  id, title, inputs: ['decided', 'asserted'], deciding: ['decided'], instrument: true,
  emits: RATIONAL, run: () => ({ port: 'refuted', value: null }) });

const fmt = (n) => (n === undefined || n === null) ? '?' : String(n);

export function build(r, { minWidth = 560 } = {}) {
  const f = r.facts, g = graph('');
  const fired = new Map();
  let caption = '';

  if (r.kind === 'wrong_verdict') {
    g.add(src('norm', `‖v‖² = ${fmt(f.normSq)}`, ['value']))
      .add(src('pi', 'π bracket, 60 places', ['bracket']))
      .add(inst('gh', `GH predicate, n = ${fmt(f.n)}`, ['norm', 'pi']))
      .add(claim(r.said)).add(clash());
    g.wire('norm', 'value', 'gh', 'norm');
    g.wire('pi', 'bracket', 'gh', 'pi');
    g.wire('gh', V[r.truth], 'clash', 'decided');
    g.wire('claim', 'answer', 'clash', 'asserted');
    fired.set('gh', V[r.truth]); fired.set('clash', 'refuted');
    caption = `every quantity was stated; the predicate decides ${r.truth} and the answer was ${r.said}`;

  } else if (r.kind === 'straddle_called_definite') {
    g.add(src('N', `printed norm ${fmt(f.printed)}`, ['lo', 'hi']))
      .add(inst('lo', `GH at N − ½`, ['norm']))
      .add(inst('hi', `GH at N + ½`, ['norm']))
      .add(clash('clash', 'the two disagree'))
      .add(claim(r.said));
    g.wire('N', 'lo', 'lo', 'norm');
    g.wire('N', 'hi', 'hi', 'norm');
    g.wire('lo', V[f.loVerdict], 'clash', 'decided');
    g.wire('claim', 'answer', 'clash', 'asserted');
    fired.set('lo', V[f.loVerdict]); fired.set('hi', V[f.hiVerdict]); fired.set('clash', 'refuted');
    caption = `a norm printed as a whole number is ${f.loVerdict} at N − ½ and ${f.hiVerdict} at N + ½ `
      + `(${f.loRatio} … ${f.hiRatio}); the stated quantities do not determine it, and the answer was ${r.said}`;

  } else if (r.kind === 'confident_on_missing') {
    /* the finding IS the wire that is not there: a deciding port with nothing
       arriving at it, beside a verdict that fired anyway */
    g.add(src('have', 'what the task stated', ['known']))
      .add(inst('gh', `GH predicate, n = ${fmt(f.n)}`, ['known', fmt(f.missing).split('.').pop()]))
      .add(claim(r.said)).add(clash());
    g.wire('have', 'known', 'gh', 'known');
    g.wire('claim', 'answer', 'clash', 'asserted');
    fired.set('clash', 'refuted');
    caption = `the deciding port “${fmt(f.missing).split('.').pop()}” has nothing wired to it — `
      + `${fmt(f.missing)} was absent from the task — and a verdict of ${r.said} was returned anyway`;

  } else {
    g.add(src('task', `the task states ‖v‖² = ${fmt(f.normSq)}`, ['value']))
      .add(node({ id: 'used', title: `it decided against ${fmt(f.roundedNormSq)}`, inputs: [], outputs: ['value'],
        emits: FLOAT, run: () => ({ port: 'value', value: null }) }))
      .add(inst('gh', `GH predicate, n = ${fmt(f.n)}`, ['norm']));
    g.wire('task', 'value', 'gh', 'norm');
    g.wires.push({ fromId: 'used', fromPort: 'value', toId: 'gh', toPort: 'norm' });
    fired.set('gh', V[r.truth]);
    caption = `the verdict, ${r.said}, happened to be right; it was reached against the norm rounded to a whole number, `
      + `which is a different quantity from the one the task stated`;
  }
  return { svg: toSVG(g, { fired, title: '', minWidth }), caption };
}
