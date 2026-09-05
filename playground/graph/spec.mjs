/* spec.mjs — the graph this page is about, defined ONCE.
   playground/graph/ · cert-machine · 2026-09-05

   The builder draws it in Node and the browser lets you rewire it, and both
   read this file, so the picture on the page and the thing under the cursor
   cannot be different graphs. Nothing here has a run() — the page is about
   WIRING, not about running, and a node with no body still has to obey the two
   rules, which is the point.

   The catalogue is small on purpose: a larger one measures reading
   comprehension, this one measures whether you know which instrument may
   decide. It is the same shape as the Python grader's CATALOGUE in
   instruments/wiring/lattice_claims/wiring.py, and concord.mjs checks the two
   engines refuse the same wiring in the same words. */
import { node } from '../../instruments/cert-unit/graph.mjs';
import { FLOAT, INTERVAL } from '../../instruments/cert-unit/port.mjs';

export const NODES = () => [
  node({ id: 'band', title: 'the sigma band', inputs: [], outputs: ['Y0', 'Z1', 'Z2'],
    emits: INTERVAL }),
  node({ id: 'screen', title: 'float screen', inputs: ['Y0'], outputs: ['shortlist'],
    emits: FLOAT }),
  node({ id: 'radii', title: 'radii polynomial', instrument: true,
    inputs: ['Y0', 'Z1', 'Z2'], deciding: ['Y0', 'Z1', 'Z2'], emits: INTERVAL }),
];

/* the legal wiring: the band's exact intervals reach the instrument that
   decides, and the float screen hangs off the side where it can only prune */
export const WIRES = [
  ['band', 'Y0', 'radii', 'Y0'],
  ['band', 'Z1', 'radii', 'Z1'],
  ['band', 'Z2', 'radii', 'Z2'],
  ['band', 'Y0', 'screen', 'Y0'],
];

/* the wire a reader is invited to try, and the reason they cannot draw it */
export const FORBIDDEN = ['screen', 'shortlist', 'radii', 'Y0'];
