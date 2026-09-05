/* test.mjs — the five things the sandbox has to get right, three of which are
   failures this bench actually made. Run: node test.mjs */
import { CERTIFIED, REFUSED, REFUTED, WiringRefused, graph } from './graph.mjs';
import { FLOAT, HypothesisMismatch, INTERVAL, KindRefused, Val, flt, hyp, ivl } from './port.mjs';
import { assertMonotone, bracket, concord, floatScreen, intervalEval, IV, MONOTONE, naiveGrader } from './nodes.mjs';

const IVsqr = (x) => IV.sqr(x);

let pass = 0, fail = 0;
const check = (name, fn) => {
  try { fn(); console.log(`  PASS  ${name}`); pass++; }
  catch (e) { console.log(`  **FAIL**  ${name}\n        ${e.message.split('\n')[0]}`); fail++; }
};
const expectThrow = (Type, fn, what) => {
  try { fn(); } catch (e) { if (e instanceof Type) return e; throw new Error(`${what}: wrong error ${e.constructor.name}: ${e.message}`); }
  throw new Error(`${what}: nothing was refused`);
};

/* the two constraint sets from the interferometer session that must not meet */
const H_THIN = hyp({ instrument: 'interferometer', rows: 838, fov_uas: 40, F_Jy: 2, gain: 'flat-5%' });
const H_FULL = hyp({ instrument: 'interferometer', rows: 6677, fov_uas: 40, F_Jy: 2, gain: 'flat-5%' });

console.log('1 — a Number may not enter an exact port');
check('Val(0.1, INTERVAL) is refused at ingest', () => {
  const e = expectThrow(KindRefused, () => new Val(0.1, INTERVAL), 'number into interval');
  if (!/already lost the value/.test(e.message)) throw new Error('unhelpful message');
});
check('an exact value refuses implicit conversion', () => {
  expectThrow(KindRefused, () => 1 + ivl(0.1, 0.2, H_FULL), 'implicit arithmetic');
});

console.log('2 — the float firebreak is a wire the editor will not draw');
check('a float screen has no path to a verdict', () => {
  const g = graph('firebreak')
    .add(floatScreen({ id: 'screen', f: (x) => x > 0 }))
    .add(bracket({ id: 'verdict' }));
  const e = expectThrow(WiringRefused, () => g.wire('screen', 'pass', 'verdict', 'witness'), 'float to verdict');
  if (!/FIREBREAK/.test(e.message)) throw new Error('did not name the rule');
});

console.log('3 — THE BUG FROM THIS SESSION: a witness and a ceiling about different problems');
check('witness on 838 rows may not join a ceiling on 6677', () => {
  const g = graph('bracket').add(bracket({ id: 'b', label: 'flux in r<=6uas' }));
  g.push('b', 'witness', ivl(0.1772, 0.1772, H_THIN));
  const e = expectThrow(HypothesisMismatch, () => g.push('b', 'ceiling', ivl(0.1898, 0.1898, H_FULL)), 'mismatched rows');
  if (!/rows: 838 vs 6677/.test(e.message)) throw new Error(`did not name the difference: ${e.message}`);
});
check('the same two sides, both on 6677 rows, certify with the honest gap', () => {
  const g = graph('bracket').add(bracket({ id: 'b', label: 'flux in r<=6uas' }));
  g.push('b', 'witness', ivl(0.1391, 0.1391, H_FULL));
  const r = g.push('b', 'ceiling', ivl(0.2425, 0.2425, H_FULL));
  const fired = r.fired[0];
  if (fired.port !== CERTIFIED) throw new Error(`fired ${fired.port}`);
  if (!/gap 1\.74x/.test(fired.note)) throw new Error(`wrong gap: ${fired.note}`);
});
check('a witness above its ceiling is REFUTED, not quietly accepted', () => {
  const g = graph('bracket').add(bracket({ id: 'b' }));
  g.push('b', 'witness', ivl(0.9, 0.9, H_FULL));
  const r = g.push('b', 'ceiling', ivl(0.2, 0.2, H_FULL));
  if (r.fired[0].port !== REFUTED) throw new Error(`fired ${r.fired[0].port}`);
});

console.log('4 — instruments compute for real, and abstain visibly');
check('eqcert interval arithmetic runs inside a node', () => {
  const g = graph('iv').add(intervalEval({ id: 'sq', f: IVsqr }));
  const r = g.push('sq', 'x', ivl(-2, 3, H_FULL));
  const d = r.fired[0].value.datum;
  if (!(d.lo <= 0 && d.hi >= 9)) throw new Error(`sqr([-2,3]) = [${d.lo},${d.hi}] does not contain [0,9]`);
});
check('a wrong kind is REFUSED, and the refusal port is drawn', () => {
  const g = graph('iv').add(intervalEval({ id: 'sq', f: (x) => x }));
  const r = g.push('sq', 'x', flt(1.5, H_FULL));
  if (r.fired[0].port !== REFUSED) throw new Error('did not abstain');
  const t = g.topology();
  if (!t.danglingVerdicts.includes('sq.refused')) throw new Error('refusal sink not drawn');
});

console.log('5 — the canary, and the reds as graph operations');
check('a tolerance grader certifies what exact arithmetic refutes', () => {
  const g = graph('canary').add(naiveGrader({ id: 'naive', tol: 1e-9 }));
  g.push('naive', 'claimed', flt(1, H_FULL));
  const r = g.push('naive', 'actual', flt(1 + 1e-10, H_FULL));
  if (r.fired[0].port !== CERTIFIED) throw new Error('the canary did not sing');
});
check('dropping a telescope may only loosen the ceiling', () => {
  const r = assertMonotone({ name: 'drop GLT', before: 0.2995, after: 0.4324, direction: MONOTONE.LOOSEN });
  if (!r.held) throw new Error('monotonicity violated');
});
check('translating the region AND the field may not move the ceiling', () => {
  const r = assertMonotone({ name: 'translate both', before: 0.2995, after: 0.2995, direction: MONOTONE.INVARIANT });
  if (!r.held) throw new Error('invariance violated');
});
check('translating only the region MAY move it — and the naive red fails here', () => {
  const r = assertMonotone({ name: 'translate region only', before: 0.2995, after: 0.3711, direction: MONOTONE.INVARIANT });
  if (r.held) throw new Error('the ill-founded red should not hold; that was the false alarm');
});

console.log(`\n${fail === 0 ? 'ALL GREEN' : fail + ' FAILED'} — ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
