/**
 * bundle.mjs — interop with Unit, without depending on it.
 *
 * Unit serialises a program as a BundleSpec: { spec: GraphSpec, specs }, where a
 * GraphSpec carries `units` (each with a class id and pin defaults) and `merges`
 * (each merge is a set of pins that are joined). Emitting that shape means any
 * graph built here opens in the real editor at unit.land — and means Unit never
 * has to be inside our artifact for the artifact to be a graph.
 *
 * The direction of the dependency is the point. Unit is the editor we do not
 * want to write; it is not the runtime we already have, and it is a beta
 * library with one maintainer, which is fine for a canvas and wrong for
 * anything a claim rests on.
 *
 * What travels with the graph and does NOT exist in Unit's own spec: the
 * hypothesis rail. It rides in `metadata` so a graph that is opened elsewhere
 * still says what it is conditional on, even where nothing enforces it.
 */

import { VERDICT_PORTS } from './graph.mjs';

const classId = (n) => `certkit/${n.instrument ? 'instrument' : 'transform'}/${n.title.replace(/\s+/g, '-')}`;

export function toBundleSpec(g, { rail = null, author = 'frontier bench' } = {}) {
  const units = {};
  for (const n of g.nodes.values()) {
    units[n.id] = {
      id: classId(n),
      input: Object.fromEntries(n.inputs.map((p) => [p, {}])),
      output: Object.fromEntries(n.outputs.map((p) => [p, {}])),
      metadata: {
        title: n.title,
        emits: n.emits,
        deciding: [...n.deciding],
        /* the two rules that are wiring constraints here and only comments there */
        rules: [
          n.emits === 'float' ? 'float: no path to a deciding input' : null,
          n.instrument ? 'all three verdict ports drawn, fired or not' : null,
        ].filter(Boolean),
      },
    };
  }
  const merges = {};
  g.wires.forEach((w, i) => {
    merges[`m${i}`] = {
      [w.fromId]: { output: { [w.fromPort]: true } },
      [w.toId]: { input: { [w.toPort]: true } },
    };
  });
  return {
    spec: {
      name: g.name,
      units,
      merges,
      metadata: {
        description: 'a certificate that is a machine',
        /* not part of Unit's spec, and the most important field here */
        hypotheses: rail ? rail.toJSON() : null,
        danglingVerdicts: g.topology().danglingVerdicts,
        trustBase: [
          'JavaScript BigInt and outward-rounded interval arithmetic (lib/eqcert)',
          'no Number on the deciding path; implicit conversion throws',
          'values may only meet when their hypothesis stamps agree',
        ],
      },
    },
    specs: {},
    metadata: { author },
  };
}

/** A static SVG of the same graph, for when the editor is not loaded — or fails. */
export function toSVG(g, { w = 900, rowH = 96 } = {}) {
  const ns = [...g.nodes.values()];
  const x = (i) => 40 + i * ((w - 220) / Math.max(1, ns.length - 1));
  const pos = new Map(ns.map((n, i) => [n.id, { x: x(i), y: 60 + (i % 2) * rowH }]));
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const parts = [];
  for (const wr of g.wires) {
    const a = pos.get(wr.fromId), b = pos.get(wr.toId);
    parts.push(`<path d="M${a.x + 150} ${a.y + 24} C${a.x + 210} ${a.y + 24}, ${b.x - 60} ${b.y + 24}, ${b.x} ${b.y + 24}" fill="none" stroke="#6e6e7a" stroke-width="1"/>`);
  }
  for (const n of ns) {
    const p = pos.get(n.id);
    parts.push(`<rect x="${p.x}" y="${p.y}" width="150" height="${28 + 14 * n.outputs.length}" rx="6" fill="#141419" stroke="#32323c"/>`);
    parts.push(`<text x="${p.x + 10}" y="${p.y + 18}" fill="#f6f6f8" font-family="ui-monospace,monospace" font-size="11">${esc(n.title)}</text>`);
    n.outputs.forEach((o, k) => {
      const dangling = VERDICT_PORTS.includes(o) && !g.wires.some(z => z.fromId === n.id && z.fromPort === o);
      parts.push(`<text x="${p.x + 10}" y="${p.y + 32 + k * 14}" fill="${dangling ? '#4a4a55' : '#9a9aa6'}" font-family="ui-monospace,monospace" font-size="9">${dangling ? '○' : '●'} ${esc(o)}</text>`);
    });
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${60 + 2 * rowH}" width="${w}"><rect width="100%" height="100%" fill="#0a0a0c"/>${parts.join('')}</svg>`;
}
