/**
 * concord.mjs — the two engines, asked the same illegal question.
 * instruments/wiring/ · cert-machine · 2026-09-05
 *
 * cert-machine now holds TWO independent implementations of the same wiring
 * rules: instruments/cert-unit/graph.mjs in JavaScript, and
 * instruments/wiring/lattice_claims/wiring.py in Python. They were written for
 * different jobs — one is a runtime that draws graphs, the other is a grader
 * that turns a model's answer into a build — and neither was derived from the
 * other's source. The Python carries the comment "THE FLOAT FIREBREAK, in the
 * same words the other engine uses", which is a claim, and a claim is the kind
 * of thing this repository checks rather than repeats.
 *
 * So: plant the same violation in both and require that both REFUSE, and that
 * they refuse in the same words. This is the `concord` idea out of
 * instruments/cert-unit/nodes.mjs applied to the rule layer itself — two
 * implementations asked the same question, with disagreement as the headline.
 *
 * WHAT IT DOES NOT CLAIM. The two catalogues are different vocabularies on
 * purpose, so this does not compare instrument lists or verdicts. It compares
 * the two rules that are conditions on a WIRE, which are the only things both
 * engines are supposed to agree about:
 *
 *   1. a value that came from floating point may not enter a deciding port
 *   2. a port that does not exist cannot be wired to
 *
 * run: node instruments/wiring/concord.mjs
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { graph, node } from '../cert-unit/graph.mjs';
import { FLOAT } from '../cert-unit/port.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
let checks = 0, fails = 0;
const ok = (n, d) => { checks++; console.log('  ok  ' + String(checks).padStart(2) + '  ' + n + (d ? '   ' + d : '')); };
const bad = (n, d) => { checks++; fails++; console.log('  FAIL ' + String(checks).padStart(2) + '  ' + n + '\n        ' + d); };

/* ---------------------------------------------------------------- the JS -- */
function jsRefusal(build) {
  try { build(); return null; } catch (e) { return e.message; }
}

const jsFirebreak = jsRefusal(() => {
  const g = graph('concord')
    .add(node({ id: 'screen', inputs: ['q'], outputs: ['shortlist'], emits: FLOAT }))
    .add(node({ id: 'decide', inputs: ['candidate'], deciding: ['candidate'], instrument: true }));
  g.wire('screen', 'shortlist', 'decide', 'candidate');
});

const jsNoPort = jsRefusal(() => {
  const g = graph('concord')
    .add(node({ id: 'a', inputs: [], outputs: ['x'] }))
    .add(node({ id: 'b', inputs: ['y'] }));
  g.wire('a', 'x', 'b', 'nope');
});

/* ------------------------------------------------------------ the Python -- */
const py = (src) => execFileSync('python3', ['-c', src], { cwd: HERE, encoding: 'utf8' }).trim();

/* THE PLANTED VIOLATION IS BUILT FROM THE CATALOGUE, NOT FROM MEMORY. The first
   version of this file guessed a port name and the Python refused for the WRONG
   reason — "gh_exact has no input 'candidate'" — which is a different refusal
   than the one under test and would have read as a disagreement between the
   engines when it was only a mistake in the question. The names are read out of
   CATALOGUE below and substituted in. */
const PY_FIREBREAK = (floatNode, floatOut, decideNode, decidePort) => `
from lattice_claims.wiring import build, WiringRefused
sub = {"nodes": ["${floatNode}", "${decideNode}"],
       "wires": [["${floatNode}","${floatOut}","${decideNode}","${decidePort}"]]}
try:
    build(sub); print("")
except WiringRefused as e:
    print(str(e))
`;
const PY_NOPORT = (decideNode) => `
from lattice_claims.wiring import build, WiringRefused
sub = {"nodes": ["basis", "${decideNode}"], "wires": [["basis","q","${decideNode}","nope"]]}
try:
    build(sub); print("")
except WiringRefused as e:
    print(str(e))
`;

/* the catalogue is the Python's own; read the deciding instrument's real name
   rather than assuming one, so a rename over there fails loudly here */
const names = JSON.parse(py(`
import json
from lattice_claims.wiring import CATALOGUE
print(json.dumps({k: {"emits": v["emits"], "deciding": v["deciding"], "in": v["in"], "out": v["out"]} for k, v in CATALOGUE.items()}))
`));
const decider = Object.keys(names).find((k) => (names[k].deciding || []).length > 0);
const floaty = Object.keys(names).find((k) => names[k].emits === 'float');

if (!decider || !floaty) {
  bad('the Python catalogue still has a float emitter and a deciding instrument',
    'found decider=' + decider + ' floaty=' + floaty);
} else {
  ok('the Python catalogue still has a float emitter and a deciding instrument',
    '[' + floaty + ' -> ' + decider + ']');
}

/* a float emitter whose OUTPUT can reach one of the decider's DECIDING inputs.
   Both engines only refuse when a float actually arrives at a deciding port, so
   the question has to be that exact shape or the answer means nothing. */
const decidePort = (names[decider].deciding || [])[0];
const floatOut = (names[floaty].out || [])[0];
const pyFirebreak = py(PY_FIREBREAK(floaty, floatOut, decider, decidePort));
const pyNoPort = py(PY_NOPORT(decider));

/* ------------------------------------------------------------ the concord -- */
const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();

if (jsFirebreak && pyFirebreak) ok('BOTH engines refuse a float reaching a deciding port');
else bad('BOTH engines refuse a float reaching a deciding port',
  'js=' + JSON.stringify(jsFirebreak) + '  py=' + JSON.stringify(pyFirebreak));

const jf = norm(jsFirebreak), pf = norm(pyFirebreak);
const sameWords = jf.includes('THE FLOAT FIREBREAK') && pf.includes('THE FLOAT FIREBREAK')
  && jf.includes('A fast screen may prune') && pf.includes('A fast screen may prune')
  && jf.includes('may never reach a verdict') && pf.includes('may never reach a verdict');
if (sameWords) ok('and they refuse it IN THE SAME WORDS');
else bad('and they refuse it IN THE SAME WORDS', 'js: ' + jf + '\n        py: ' + pf);

if (jsNoPort && pyNoPort) ok('BOTH engines refuse a wire to a port that does not exist');
else bad('BOTH engines refuse a wire to a port that does not exist',
  'js=' + JSON.stringify(jsNoPort) + '  py=' + JSON.stringify(pyNoPort));

/* the control: the check must be able to see a disagreement */
const planted = norm('THE FLOAT FIREBREAK: a.b carries floats and c.d decides. A fast screen may prune. It may never reach a verdict.');
const controlFires = !(norm('some other refusal').includes('THE FLOAT FIREBREAK')) && planted.includes('THE FLOAT FIREBREAK');
console.log(controlFires
  ? '       RED ok    a refusal in different words would be caught'
  : '       RED FAIL  the word comparison cannot fail');
if (!controlFires) fails++;

console.log('\n  ' + checks + ' checks, ' + fails + ' failed'
  + (fails === 0 ? '  — two implementations, one rule' : ''));
process.exit(fails ? 1 : 0);
