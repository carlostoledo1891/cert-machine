/* make-figure.mjs — the rewire graph as a FILE, for the gathering page's card.
   The same five nodes and seven wires the page mounts, drawn server-side by
   the same renderer, with the exact predicate on the verdict socket — the
   state the page opens in. node playground/rewire/make-figure.mjs           */
import { writeFileSync, mkdirSync } from 'node:fs';
import { graph, node } from '../../instruments/cert-unit/graph.mjs';
import { FLOAT, INTERVAL, RATIONAL } from '../../instruments/cert-unit/port.mjs';
import { toSVG } from '../../instruments/cert-unit/render.mjs';

const g = graph('does this certifier deserve the verdict port?');
g.add(node({ id: 'src', title: 'instances', inputs: ['seed'], outputs: ['q', 'norm'],
  emits: INTERVAL, run: () => ({ port: 'q', value: null }) }));
g.add(node({ id: 'exact', title: 'exact predicate', instrument: true, inputs: ['q', 'norm'],
  deciding: ['q', 'norm'], emits: RATIONAL, run: () => ({ port: 'certified', value: null }) }));
g.add(node({ id: 'tol', title: 'tolerance grader', inputs: ['q', 'norm'], outputs: ['verdict'],
  deciding: [], emits: FLOAT, run: () => ({ port: 'verdict', value: null }) }));
g.add(node({ id: 'careful', title: 'careful float', inputs: ['q', 'norm'], outputs: ['verdict'],
  deciding: [], emits: FLOAT, run: () => ({ port: 'verdict', value: null }) }));
g.add(node({ id: 'tally', title: 'admitted', inputs: ['verdict', 'report'], outputs: ['count'],
  deciding: ['verdict'], emits: RATIONAL, run: () => ({ port: 'count', value: null }) }));
g.wire('src', 'q', 'exact', 'q'); g.wire('src', 'norm', 'exact', 'norm');
g.wire('src', 'q', 'tol', 'q'); g.wire('src', 'norm', 'tol', 'norm');
g.wire('src', 'q', 'careful', 'q'); g.wire('src', 'norm', 'careful', 'norm');
g.wire('exact', 'certified', 'tally', 'verdict');

/* the forbidden wire must still be forbidden, or the card would draw a lie */
let refused = null;
try { g.wire('tol', 'verdict', 'tally', 'verdict'); } catch (e) { refused = e.message; }
if (!refused) throw new Error('make-figure: the float grader reached the verdict socket — refusing to draw');

const OUT = new URL('./out/', import.meta.url);
mkdirSync(OUT, { recursive: true });
writeFileSync(new URL('./graph.svg', OUT), toSVG(g, { fired: new Map([['exact', 'certified']]), title: '', minWidth: 560 }));
console.log('out/graph.svg — 5 nodes, 7 wires, the float grader refused: ' + refused.split('\n')[0].slice(0, 60) + '…');
