/* make-figures.mjs — the page's figures and numbers as FILES, so the builder
   stays a builder. The pipeline computes; the builder only reads.
   node playground/graph/make-figures.mjs                                     */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { graph } from '../../instruments/cert-unit/graph.mjs';
import { toSVG } from '../../instruments/cert-unit/render.mjs';
import { NODES, WIRES, FORBIDDEN } from './spec.mjs';

const OUT = new URL('./out/', import.meta.url);
mkdirSync(OUT, { recursive: true });

/* ---- the legal graph, drawn ------------------------------------------- */
const g = graph('one certified cell');
for (const n of NODES()) g.add(n);
for (const w of WIRES) g.wire(...w);
writeFileSync(new URL('./legal.svg', OUT), toSVG(g, { title: 'the wiring that builds', minWidth: 560 }));

/* ---- the refusal, taken from the engine rather than written down ------- */
let refusal = null;
try { g.wire(...FORBIDDEN); refusal = null; }
catch (e) { refusal = e.message; }
if (!refusal) throw new Error('make-figures: the forbidden wire was ACCEPTED — the page would be a lie');

/* ---- the numbers, re-derived here rather than quoted ------------------- */
const replay = execFileSync('node', ['instruments/cert-unit/replay.mjs'],
  { cwd: new URL('../../', import.meta.url).pathname, encoding: 'utf8' });
const cells = /re-derived (\d+) cells identically, (\d+) disagreed, (\d+) refused/.exec(replay);
const worst = /worst relative difference: (\S+)/.exec(replay);
const onDisk = /(\d+) cells on disk, (\d+) certified/.exec(replay);
if (!cells || !worst || !onDisk) throw new Error('make-figures: replay output did not parse');

const facts = {
  builtFrom: 'instruments/cert-unit/replay.mjs, run at build time',
  cellsOnDisk: +onDisk[1], cellsCertified: +onDisk[2],
  reDerivedIdentically: +cells[1], disagreed: +cells[2], refusedOnReplay: +cells[3],
  worstRelativeDifference: worst[1],
  refusal,
  ports: ['certified', 'refuted', 'refused'],
};
writeFileSync(new URL('./facts.json', OUT), JSON.stringify(facts, null, 2) + '\n');

/* the spec the BROWSER rebuilds from, serialised from the same node objects the
   figure was drawn from — so the picture and the thing under the cursor cannot
   drift into being two different graphs */
const spec = {
  nodes: NODES().map((n) => ({
    id: n.id, title: n.title, inputs: n.inputs, outputs: n.outputs,
    deciding: [...n.deciding], instrument: n.instrument, emits: n.emits,
  })),
  wires: WIRES, forbidden: FORBIDDEN,
};
writeFileSync(new URL('./spec.json', OUT), JSON.stringify(spec) + '\n');
console.log(`out/legal.svg + out/facts.json — ${facts.reDerivedIdentically}/${facts.cellsCertified} re-derived, `
  + `worst ${facts.worstRelativeDifference}, refusal captured (${refusal.split('\n')[0].slice(0, 46)}…)`);
