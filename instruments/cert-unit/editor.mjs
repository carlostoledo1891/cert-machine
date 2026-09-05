/**
 * editor.mjs — the same picture, with the wires in the reader's hands.
 *
 * The point of letting anyone drag a wire is that they find out what is
 * refused. `graph.wire()` already carries both rules — the float firebreak and
 * the hypothesis stamp — and it explains itself in a sentence. So the editor
 * does not implement validity at all. It attempts the wire and shows whatever
 * came back, which means the page can never disagree with the engine about what
 * is legal: there is one implementation and the UI is downstream of it.
 *
 * The interaction logic is pure and lives in `tryWire` and `hitTest` so it can
 * be tested in node. Only `mount` touches the DOM, and it is thin on purpose.
 */

import { DECIDING } from './port.mjs';
import { VERDICT_PORTS } from './graph.mjs';
import { CSS, GEOM, boxOf, inAt, inkOf, layout, outAt, portY } from './render.mjs';

const NS = 'http://www.w3.org/2000/svg';
/* NOT destructured: render.mjs already binds these names, and both files are
   concatenated into one module script when a page inlines them. */
const G = GEOM;

/** Attempt a connection. Never decides legality itself. */
export function tryWire(g, from, to) {
  if (!from || !to) return { ok: false, why: null };
  if (from.nodeId === to.nodeId) return { ok: false, why: 'a node may not wire to itself' };
  const dup = g.wires.some((w) => w.fromId === from.nodeId && w.fromPort === from.port
    && w.toId === to.nodeId && w.toPort === to.port);
  if (dup) return { ok: false, why: 'that wire already exists' };
  try {
    g.wire(from.nodeId, from.port, to.nodeId, to.port);
    return { ok: true, why: null };
  } catch (e) {
    return { ok: false, why: e.message };          // the engine's words, verbatim
  }
}

/** Which port, if any, is under a point. Pure; the DOM only supplies x,y. */
export function hitTest(g, pos, x, y, r = 9) {
  for (const [id, box] of pos) {
    const n = g.nodes.get(id);
    for (const [side, ports] of [['in', n.inputs], ['out', n.outputs]]) {
      for (let i = 0; i < ports.length; i++) {
        const px = side === 'in' ? box.x : box.x + box.w;
        const py = portY(box, i);
        if ((x - px) ** 2 + (y - py) ** 2 <= r * r) {
          return { nodeId: id, port: ports[i], side, x: px, y: py };
        }
      }
    }
    if (x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + G.HEAD - 6) {
      return { nodeId: id, side: 'head', x, y };
    }
  }
  return null;
}

const el = (name, attrs = {}) => {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
};
const curve = (a, b) => {
  const dx = Math.max(30, Math.abs(b.x - a.x) * 0.45);
  return `M${a.x},${a.y} C${a.x + dx},${a.y} ${b.x - dx},${b.y} ${b.x},${b.y}`;
};

export function mount(host, g, { fired = new Map(), onChange = null, pad = 26,
  minSpan = 620, offsetX = 0, offsetY = 0, positions = null } = {}) {
  /* `positions` lets a caller hand back the boxes from a previous mount, so a
     redraw does not undo where the reader dragged things. */
  const pos = positions || layout(g);
  if (!positions && (offsetX || offsetY)) for (const b of pos.values()) { b.x += offsetX; b.y += offsetY; }
  const svg = el('svg', { class: 'ug ed' });
  const style = document.createElementNS(NS, 'style');
  style.textContent = CSS + EXTRA;
  svg.appendChild(style);
  const gWires = el('g'), gNodes = el('g'), gGhost = el('g');
  svg.append(gWires, gNodes, gGhost);
  host.innerHTML = '';
  host.appendChild(svg);

  const say = (msg, bad) => { if (onChange) onChange(msg, bad); };
  /* `fired` may be a function so that a repaint picks up new state. A caller
     that re-mounts on every status message destroys the element mid-drag —
     which is exactly what happened the first time this was driven. */
  const firedNow = () => (typeof fired === 'function' ? fired() : fired);
  let drag = null, pending = null;

  function frame() {
    let W = 0, H = 0;
    for (const b of pos.values()) { W = Math.max(W, b.x + b.w); H = Math.max(H, b.y + b.h); }
    /* a floor on the viewBox, or a three-node graph is magnified to fill a
       1400px page and the nodes look enormous */
    svg.setAttribute('viewBox', `0 0 ${Math.max(minSpan, W + pad)} ${H + pad}`);
  }

  function paint() {
    gWires.innerHTML = ''; gNodes.innerHTML = '';
    for (const w of g.wires) {
      const f = g.nodes.get(w.fromId), t = g.nodes.get(w.toId);
      const a = outAt(pos.get(w.fromId), f, w.fromPort), b = inAt(pos.get(w.toId), t, w.toPort);
      gWires.appendChild(el('path', { d: curve(a, b), class: `w ${inkOf(f)}` }));
    }
    for (const [id, box] of pos) {
      const n = g.nodes.get(id);
      const grp = el('g', { class: 'node', 'data-id': id });
      grp.appendChild(el('rect', { x: box.x, y: box.y, width: box.w, height: box.h, rx: 3, class: 'nd' + (n.instrument ? ' inst' : '') }));
      const t = el('text', { x: box.x + 8, y: box.y + 14, class: 'nt' }); t.textContent = n.title;
      grp.appendChild(t);
      grp.appendChild(el('line', { x1: box.x, y1: box.y + G.HEAD - 6, x2: box.x + box.w, y2: box.y + G.HEAD - 6, class: 'sep' }));
      n.inputs.forEach((p, i) => {
        const y = portY(box, i), dec = n.deciding.has(p);
        grp.appendChild(dec
          ? el('rect', { x: box.x - 2.6, y: y - 2.6, width: 5.2, height: 5.2, class: 'pt dec' })
          : el('circle', { cx: box.x, cy: y, r: 2.4, class: 'pt' }));
        const lb = el('text', { x: box.x + 8, y: y + 2.6, class: 'pl' }); lb.textContent = p;
        grp.appendChild(lb);
      });
      const F = firedNow();
      n.outputs.forEach((p, i) => {
        const y = portY(box, i), hit = F.get(id) === p;
        grp.appendChild(el('circle', { cx: box.x + box.w, cy: y, r: hit ? 3.4 : 2.4, class: 'pt' + (hit ? ' fired' : VERDICT_PORTS.includes(p) ? ' idle' : '') }));
        const lb = el('text', { x: box.x + box.w - 8, y: y + 2.6, class: 'pl' + (hit ? ' fired' : ''), 'text-anchor': 'end' });
        lb.textContent = p; grp.appendChild(lb);
      });
      gNodes.appendChild(grp);
    }
    frame();
  }

  const at = (ev) => {
    const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY;
    const m = svg.getScreenCTM().inverse();
    const q = p.matrixTransform(m); return { x: q.x, y: q.y };
  };

  svg.addEventListener('pointerdown', (ev) => {
    const { x, y } = at(ev);
    const h = hitTest(g, pos, x, y);
    if (!h) return;
    svg.setPointerCapture(ev.pointerId);
    if (h.side === 'head') { const b = pos.get(h.nodeId); drag = { id: h.nodeId, dx: x - b.x, dy: y - b.y }; }
    else if (h.side === 'out') { pending = h; say('drag to an input port', false); }
    else { pending = h; say('drag to an output port', false); }
  });

  svg.addEventListener('pointermove', (ev) => {
    const { x, y } = at(ev);
    if (drag) { const b = pos.get(drag.id); b.x = x - drag.dx; b.y = y - drag.dy; paint(); return; }
    if (pending) {
      gGhost.innerHTML = '';
      const src = g.nodes.get(pending.nodeId);
      const a = { x: pending.x, y: pending.y }, b = { x, y };
      /* even the ghost reads its ink rather than choosing it */
      gGhost.appendChild(el('path', {
        d: pending.side === 'out' ? curve(a, b) : curve(b, a),
        class: `w ghost ${inkOf(src)}`,
      }));
    }
  });

  svg.addEventListener('pointerup', (ev) => {
    const { x, y } = at(ev);
    if (drag) { drag = null; return; }
    if (!pending) return;
    gGhost.innerHTML = '';
    const h = hitTest(g, pos, x, y);
    const from = pending.side === 'out' ? pending : h;
    const to = pending.side === 'out' ? h : pending;
    pending = null;
    if (!h || h.side === 'head' || (from && to && from.side === to.side)) { say('', false); return; }
    const r = tryWire(g, from, to);
    paint();
    say(r.ok ? `wired ${from.nodeId}.${from.port} → ${to.nodeId}.${to.port}` : r.why, !r.ok);
  });

  paint();
  return { svg, pos, repaint: paint, graph: g };
}

const EXTRA = `
.ug.ed { width:100%; height:100%; display:block; touch-action:none; }
.ug.ed .node { cursor:grab; }
.ug.ed .pt { cursor:crosshair; }
.ug .w.ghost { stroke-opacity:.9; }
`;
