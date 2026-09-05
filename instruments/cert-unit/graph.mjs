/**
 * graph.mjs — a minimal MIMO runtime, zero dependencies.
 *
 * Unit's own runtime would do this, and Unit's EDITOR is the thing worth a
 * dependency; the runtime is not. So this file is deliberately small and
 * self-contained, and bundle.mjs exports its graphs into Unit's BundleSpec so
 * they open in the real editor without Unit ever becoming load-bearing here.
 *
 * Two rules are enforced by the wiring rather than by convention:
 *
 *   1. A FLOAT output has no wire to a deciding input. "A fast screen may only
 *      prune" stops being a naming convention in lab-*.js versus cert-*.js and
 *      becomes a connection the editor refuses to draw.
 *   2. Values whose hypothesis stamps disagree may not meet. That is the rule
 *      that would have refused this bench's witness/ceiling bug at wire time.
 *
 * Every instrument declares three output ports and they are all drawn, whether
 * or not they fire. Abstention as visible topology.
 */

import { DECIDING, FLOAT, HypothesisMismatch, refuseJoin, Val } from './port.mjs';

export const CERTIFIED = 'certified';
export const REFUTED = 'refuted';
export const REFUSED = 'refused';
export const VERDICT_PORTS = [CERTIFIED, REFUTED, REFUSED];

export class WiringRefused extends TypeError {}

/**
 * node({ id, inputs, outputs, deciding, run })
 *   inputs   port names
 *   outputs  port names; an instrument's are exactly the three verdicts
 *   deciding input ports that a FLOAT may not reach (default: all of them for
 *            an instrument, none for a plain transform)
 *   run(ins) -> { port, value, note? }   fires exactly one output port
 */
export function node(spec) {
  const n = {
    id: spec.id,
    title: spec.title || spec.id,
    inputs: spec.inputs || [],
    outputs: spec.outputs || VERDICT_PORTS,
    deciding: new Set(spec.deciding || (spec.instrument ? spec.inputs || [] : [])),
    instrument: !!spec.instrument,
    emits: spec.emits || null,     // the kind this node's outputs carry
    run: spec.run,
  };
  return n;
}

export class Graph {
  constructor(name = 'graph') {
    this.name = name;
    this.nodes = new Map();
    this.wires = [];
    this.log = [];
    /* Port state lives on the GRAPH, not on a call. A node waits for all its
       inputs across separate pushes, which is the whole point of a two-sided
       instrument: the witness and the ceiling arrive from different routes and
       at different times, and the check happens where they MEET. */
    this.state = new Map();
  }
  add(n) {
    if (this.nodes.has(n.id)) throw new Error(`duplicate node ${n.id}`);
    this.nodes.set(n.id, n);
    return this;
  }
  /** wire('screen:out' -> 'verdict:in'), checked at DRAW time, not at run time. */
  wire(fromId, fromPort, toId, toPort) {
    const f = this.nodes.get(fromId), t = this.nodes.get(toId);
    if (!f) throw new WiringRefused(`no node ${fromId}`);
    if (!t) throw new WiringRefused(`no node ${toId}`);
    if (!f.outputs.includes(fromPort)) throw new WiringRefused(`${fromId} has no output ${fromPort}`);
    if (!t.inputs.includes(toPort)) throw new WiringRefused(`${toId} has no input ${toPort}`);
    if (f.emits === FLOAT && t.deciding.has(toPort)) {
      throw new WiringRefused(
        `THE FLOAT FIREBREAK: ${fromId}.${fromPort} carries floats and ${toId}.${toPort} decides.\n` +
        `  A fast screen may prune. It may never reach a verdict.`);
    }
    this.wires.push({ fromId, fromPort, toId, toPort });
    return this;
  }
  /** Push a value into a port and let it propagate. Returns every verdict fired. */
  push(nodeId, port, value, depth = 0) {
    if (!(value instanceof Val)) throw new TypeError('only Val travels a wire');
    if (depth > 64) throw new Error('wire cycle');
    const n = this.nodes.get(nodeId);
    if (!n) throw new Error(`no node ${nodeId}`);
    const bag = this.state.get(nodeId) || {};
    // the hypothesis check happens where two values MEET, which is here
    for (const [k, v] of Object.entries(bag)) {
      const bad = refuseJoin(v, value);
      if (bad) {
        this.log.push({ node: nodeId, refusedJoin: `${k} + ${port}`, why: bad.message });
        throw bad;
      }
    }
    bag[port] = value;
    this.state.set(nodeId, bag);
    if (n.inputs.some(p => bag[p] === undefined)) return { pending: nodeId, have: Object.keys(bag), fired: [] };
    const out = n.run(bag);
    this.log.push({ node: nodeId, fired: out.port, note: out.note });
    const fired = [{ node: nodeId, ...out }];
    for (const w of this.wires) {
      if (w.fromId !== nodeId || w.fromPort !== out.port) continue;
      const r = this.push(w.toId, w.toPort, out.value, depth + 1);
      if (r && r.fired) fired.push(...r.fired);
    }
    return { fired };
  }
  /** Every port drawn, including the refusal sinks that did not fire. */
  topology() {
    return {
      name: this.name,
      nodes: [...this.nodes.values()].map(n => ({
        id: n.id, title: n.title, inputs: n.inputs, outputs: n.outputs,
        instrument: n.instrument, emits: n.emits,
      })),
      wires: this.wires,
      danglingVerdicts: [...this.nodes.values()].flatMap(n =>
        n.outputs.filter(p => VERDICT_PORTS.includes(p) &&
          !this.wires.some(w => w.fromId === n.id && w.fromPort === p))
          .map(p => `${n.id}.${p}`)),
    };
  }
}

export const graph = (name) => new Graph(name);
