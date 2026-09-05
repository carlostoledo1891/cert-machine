/* editor.test.mjs — node editor.test.mjs
   The editor must never decide legality itself; it must ask the engine and
   repeat the answer. These check that it does, and that the ink is read rather
   than chosen. */
import { graph, node } from './graph.mjs';
import { FLOAT, INTERVAL, RATIONAL } from './port.mjs';
import { hitTest, tryWire } from './editor.mjs';
import { inkOf, layout } from './render.mjs';

let fail = 0;
const ok = (name, cond, got) => { if (!cond) fail++; console.log(`  ${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : '   got ' + JSON.stringify(got)}`); };
const mk = (id, t, i, o = {}) => node({ id, title: t, inputs: i, instrument: o.inst, emits: o.emits, outputs: o.outputs, deciding: o.deciding, run: () => ({ port: 'certified', value: null }) });

const build = () => graph('t')
  .add(mk('basis', 'basis', ['f'], { emits: INTERVAL, outputs: ['q', 'xs'] }))
  .add(mk('screen', 'float screen', ['q'], { emits: FLOAT, outputs: ['short'] }))
  .add(mk('gh', 'GH predicate', ['q', 'norm'], { inst: true, emits: RATIONAL, deciding: ['q', 'norm'] }));

console.log('the editor asks the engine and repeats the answer:');
{
  const g = build();
  ok('a legal wire is made', tryWire(g, { nodeId: 'basis', port: 'q' }, { nodeId: 'gh', port: 'q' }).ok);
  ok('  and appears in the graph', g.wires.length === 1, g.wires.length);
}
{
  const g = build();
  const r = tryWire(g, { nodeId: 'screen', port: 'short' }, { nodeId: 'gh', port: 'q' });
  ok('float into a deciding port is refused', !r.ok);
  ok('  with the ENGINE\'s message, not the UI\'s',
    /FLOAT FIREBREAK/.test(r.why) && /may never reach a verdict/.test(r.why), r.why);
  ok('  and nothing is added to the graph', g.wires.length === 0, g.wires.length);
}
{
  const g = build();
  ok('a node may not wire to itself',
    !tryWire(g, { nodeId: 'gh', port: 'certified' }, { nodeId: 'gh', port: 'q' }).ok);
  tryWire(g, { nodeId: 'basis', port: 'q' }, { nodeId: 'gh', port: 'q' });
  ok('a duplicate wire is refused',
    !tryWire(g, { nodeId: 'basis', port: 'q' }, { nodeId: 'gh', port: 'q' }).ok);
  ok('  so the duplicate did not land', g.wires.length === 1, g.wires.length);
  ok('an unknown port is refused by the engine',
    !tryWire(g, { nodeId: 'basis', port: 'nope' }, { nodeId: 'gh', port: 'q' }).ok);
}

console.log('\nthe ink is read off the port type, never passed in:');
{
  const g = build();
  ok('an interval source draws solid', inkOf(g.nodes.get('basis')) === 'solid');
  ok('a rational source draws solid', inkOf(g.nodes.get('gh')) === 'solid');
  ok('a float source draws dashed', inkOf(g.nodes.get('screen')) === 'dashed');
}

console.log('\nhit testing is pure — the DOM only supplies a point:');
{
  const g = build();
  const pos = layout(g);
  const b = pos.get('basis');
  const out = hitTest(g, pos, b.x + b.w, b.y + 40);
  ok('an output port is found', out && out.side === 'out' && out.nodeId === 'basis', out);
  const head = hitTest(g, pos, b.x + 40, b.y + 8);
  ok('a title bar is found', head && head.side === 'head', head);
  ok('empty canvas finds nothing', hitTest(g, pos, 99999, 99999) === null);
  const gh = pos.get('gh');
  const inp = hitTest(g, pos, gh.x, gh.y + 40);
  ok('an input port is found', inp && inp.side === 'in', inp);
}

console.log(fail ? `\n${fail} FAILED` : '\nall green');
process.exit(fail ? 1 : 0);
