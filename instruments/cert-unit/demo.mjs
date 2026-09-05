/* demo.mjs — the interferometer's own result, as a graph that refuses the bug.
   node demo.mjs           print the graph, run it, emit the Unit bundle
   node demo.mjs --svg     write out/graph.svg                                */
import { writeFileSync, mkdirSync } from 'node:fs';
import { graph } from './graph.mjs';
import { hyp, ivl } from './port.mjs';
import { bracket, floatScreen } from './nodes.mjs';
import { toBundleSpec, toSVG } from './bundle.mjs';

const RAIL = hyp({
  instrument: 'interferometer', dataset: 'EHT 2024-D01-01 M87 2018-04-21 b3 hops',
  rows: 6677, bcut_Gl: 0.4, fov_uas: 40, F_Jy: 2, nsig: 3,
  gain: 'per-station amplitude-loss allowance, divided not added',
});

const g = graph('flux that can hide within r of any point')
  .add(floatScreen({ id: 'screen', title: 'float search (lab-*)', f: (x) => x > 0 }))
  .add(bracket({ id: 'r6', title: 'bracket r<=6uas', label: 'flux' }));

const r1 = g.push('r6', 'witness', ivl(0.1391, 0.1391, RAIL));
const r2 = g.push('r6', 'ceiling', ivl(0.2425, 0.2425, RAIL));
console.log('verdict:', r2.fired[0].port, '—', r2.fired[0].note);

const thin = RAIL.relax('rows', 838);
const g2 = graph('the bug').add(bracket({ id: 'b' }));
g2.push('b', 'witness', ivl(0.1772, 0.1772, thin));
try { g2.push('b', 'ceiling', ivl(0.1898, 0.1898, RAIL)); console.log('NOT REFUSED — that is the bug'); }
catch (e) { console.log('\nrefused at wire time:\n  ' + e.message.split('\n').slice(0, 2).join('\n  ')); }

const bundle = toBundleSpec(g, { rail: RAIL });
mkdirSync(new URL('./out/', import.meta.url), { recursive: true });
writeFileSync(new URL('./out/graph.bundle.json', import.meta.url), JSON.stringify(bundle, null, 2));
writeFileSync(new URL('./out/graph.svg', import.meta.url), toSVG(g));
console.log('\nunits:', Object.keys(bundle.spec.units).join(', '));
console.log('dangling verdict ports (drawn, did not fire):', bundle.spec.metadata.danglingVerdicts.join(', '));
console.log('written out/graph.bundle.json and out/graph.svg');
