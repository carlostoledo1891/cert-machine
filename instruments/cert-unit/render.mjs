/**
 * render.mjs — the graph, drawn. No dependency, no framework, no canvas.
 *
 * THE ONE RULE: the renderer never decides how to draw a wire. It reads what
 * the value carries and derives the ink.
 *
 *     DECIDING kind (interval, rational)  ->  solid
 *     FLOAT                               ->  dashed
 *
 * That is the whole of "provenance at the port". An author cannot draw a float
 * as if it were decided, because nothing here takes a style argument. The same
 * rule that refuses the wire at build time chooses its ink at draw time, so the
 * picture and the guarantee cannot drift apart.
 *
 * A deciding input port is drawn as a filled square rather than a circle: it is
 * a socket a float may not enter, and that refusal is visible before anyone
 * tries.
 */

import { DECIDING, FLOAT } from './port.mjs';
import { VERDICT_PORTS } from './graph.mjs';

export const GEOM = { PAD: 18, NW: 112, ROW: 13, HEAD: 21, GAPX: 62, GAPY: 22 };
const { PAD, NW, ROW, HEAD, GAPX, GAPY } = GEOM;

/* longest-path layering, so a wire always points right */
export function layout(g) {
  const depth = new Map([...g.nodes.keys()].map((id) => [id, 0]));
  for (let pass = 0; pass < g.nodes.size + 1; pass++) {
    for (const w of g.wires) {
      const d = depth.get(w.fromId) + 1;
      if (d > depth.get(w.toId)) depth.set(w.toId, d);
    }
  }
  const cols = new Map();
  for (const [id, d] of depth) (cols.get(d) || cols.set(d, []).get(d)).push(id);
  const place = new Map();
  let x = PAD;
  for (const d of [...cols.keys()].sort((a, b) => a - b)) {
    let y = PAD;
    for (const id of cols.get(d)) {
      const n = g.nodes.get(id);
      const h = HEAD + Math.max(n.inputs.length, n.outputs.length) * ROW + 8;
      place.set(id, { x, y, w: NW, h });
      y += h + GAPY;
    }
    x += NW + GAPX;
  }
  return place;
}

export const portY = (box, i) => box.y + HEAD + 7 + i * ROW;
export const inAt = (box, n, p) => ({ x: box.x, y: portY(box, n.inputs.indexOf(p)) });
export const outAt = (box, n, p) => ({ x: box.x + box.w, y: portY(box, n.outputs.indexOf(p)) });
export const boxOf = (n) => ({ w: NW, h: HEAD + Math.max(n.inputs.length, n.outputs.length) * ROW + 8 });
/* the one rule, in one place: a wire's ink is READ off what its source emits */
export const inkOf = (n) => (n.emits ? (DECIDING.has(n.emits) ? 'solid' : 'dashed') : 'solid');

export function toSVG(g, { fired = new Map(), title = g.name, minWidth = 0 } = {}) {
  const P = layout(g);
  /* `minWidth` keeps a set of subgraphs at one scale when each is drawn into a
     cell of the same width; without it the smallest graph is magnified most and
     the set reads as if the type were inconsistent. */
  const W = Math.max(minWidth, Math.max(...[...P.values()].map((b) => b.x + b.w)) + PAD);
  const H = Math.max(...[...P.values()].map((b) => b.y + b.h)) + PAD + 26;
  const parts = [];

  for (const w of g.wires) {
    const f = g.nodes.get(w.fromId), t = g.nodes.get(w.toId);
    const a = outAt(P.get(w.fromId), f, w.fromPort), b = inAt(P.get(w.toId), t, w.toPort);
    const dx = Math.max(30, (b.x - a.x) * 0.45);
    // the ink is READ, never chosen
    parts.push(`<path d="M${a.x},${a.y} C${a.x + dx},${a.y} ${b.x - dx},${b.y} ${b.x},${b.y}" `
      + `class="w ${inkOf(f)}"/>`);
  }

  for (const [id, box] of P) {
    const n = g.nodes.get(id);
    parts.push(`<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="4" class="nd${n.instrument ? ' inst' : ''}"/>`);
    parts.push(`<text x="${box.x + 8}" y="${box.y + 14}" class="nt">${n.title}</text>`);
    parts.push(`<line x1="${box.x}" y1="${box.y + HEAD - 6}" x2="${box.x + box.w}" y2="${box.y + HEAD - 6}" class="sep"/>`);

    n.inputs.forEach((p, i) => {
      const y = portY(box, i), dec = n.deciding.has(p);
      parts.push(dec
        ? `<rect x="${box.x - 2.6}" y="${y - 2.6}" width="5.2" height="5.2" class="pt dec"/>`
        : `<circle cx="${box.x}" cy="${y}" r="2.4" class="pt"/>`);
      parts.push(`<text x="${box.x + 8}" y="${y + 2.6}" class="pl">${p}</text>`);
    });

    n.outputs.forEach((p, i) => {
      const y = portY(box, i);
      const isVerdict = VERDICT_PORTS.includes(p);
      const hit = fired.get(id) === p;
      parts.push(`<circle cx="${box.x + box.w}" cy="${y}" r="${hit ? 3.4 : 2.4}" class="pt${hit ? ' fired' : isVerdict ? ' idle' : ''}"/>`);
      parts.push(`<text x="${box.x + box.w - 8}" y="${y + 2.6}" class="pl${hit ? ' fired' : ''}" text-anchor="end">${p}</text>`);
    });
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="ug">
<style>${CSS}</style><rect width="${W}" height="${H}" class="bg"/>
<text x="${PAD}" y="${H - 10}" class="cap">${title}</text>
${parts.join('\n')}</svg>`;
}

export const CSS = `
.ug .bg { fill:#0a0a0c; }
.ug .nd { fill:#111114; stroke:#f6f6f8; stroke-opacity:.22; }
.ug .nd.inst { stroke-opacity:.45; }
.ug .sep { stroke:#f6f6f8; stroke-opacity:.14; }
.ug .nt { fill:#e8e8ee; font-family:ui-monospace,Menlo,monospace; font-size:8px; }
.ug .pl { fill:#83838f; font-family:ui-monospace,Menlo,monospace; font-size:6.5px; }
.ug .pl.fired { fill:#f6f6f8; }
.ug .cap { fill:#6e6e7a; font-family:ui-monospace,Menlo,monospace; font-size:7px; letter-spacing:.12em; }
.ug .pt { fill:#0a0a0c; stroke:#f6f6f8; stroke-opacity:.6; stroke-width:1.2; }
.ug .pt.dec { fill:#f6f6f8; fill-opacity:.75; stroke:none; }
.ug .pt.idle { stroke-opacity:.28; }
.ug .pt.fired { fill:#f6f6f8; stroke:#f6f6f8; }
.ug .w { fill:none; stroke:#f6f6f8; stroke-width:1.2; }
.ug .w.solid { stroke-opacity:.75; }
.ug .w.dashed { stroke-opacity:.42; stroke-dasharray:5 4; }   /* grammar.js CLAIM */`;
