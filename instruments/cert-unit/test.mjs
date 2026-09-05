/* test.mjs — the five things the sandbox has to get right, three of which are
   failures this bench actually made. Run: node test.mjs */
import { CERTIFIED, REFUSED, REFUTED, WiringRefused, graph } from './graph.mjs';
import { FLOAT, HypothesisMismatch, INTERVAL, KindRefused, Val, flt, hyp, ivl } from './port.mjs';
import { assertMonotone, bracket, concord, floatScreen, intervalEval, IV, MONOTONE, naiveGrader } from './nodes.mjs';
import { contactSheet } from './contact.mjs';
import { build as refute } from './refutation.mjs';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

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

/* ---- the two read-only renderers, against the record they were ported for ----
   contact.mjs and refutation.mjs arrived without eval/results.json and sat
   unused. The record lives at instruments/wiring/eval now, pinned by sha256
   because frontier-apps has no git; these checks read the pin, the record and
   the renderers together, so a record that drifts or a renderer that stops
   drawing every rollout fails here rather than on a page. */
const EVAL = new URL('../wiring/eval/', import.meta.url);
const sha = (u) => createHash('sha256').update(readFileSync(u)).digest('hex');
const PROV = JSON.parse(readFileSync(new URL('../wiring/PROVENANCE.json', import.meta.url), 'utf8'));
check('the lattice-claims eval record matches its provenance pin', () => {
  for (const f of PROV.files.filter((x) => /^eval\/(results|refutations)\.json$/.test(x.file))) {
    const got = sha(new URL('../wiring/' + f.file, import.meta.url));
    if (got !== f.sha256) throw new Error(`${f.file}: sha256 ${got.slice(0, 12)}… but PROVENANCE pins ${f.sha256.slice(0, 12)}…`);
  }
});
const RESULTS = JSON.parse(readFileSync(new URL('results.json', EVAL), 'utf8'));
const REFUTATIONS = JSON.parse(readFileSync(new URL('refutations.json', EVAL), 'utf8'));
check('the contact sheet draws every rollout: one fill, one ring, one reference mark each', () => {
  const PORTS = ['ADMISSIBLE', 'REFUSED', 'STRADDLES', 'NEEDS_DATA', 'no answer'];
  const rows = [];
  for (const m of ['Opus 5', 'Sonnet 5', 'Haiku 4.5']) for (const rg of ['declared', 'printed', 'underspecified'])
    rows.push({ label: `${m} ${rg}`, cells: RESULTS.filter((x) => x.model === m && x.rung === rg)
      .map((x) => ({ fired: x.verdict || 'no answer', truth: x.truth, wellFormed: x.wf === 1 })) });
  const n = rows.reduce((a, r) => a + r.cells.length, 0);
  if (n !== RESULTS.length) throw new Error(`${n} cells drawn for ${RESULTS.length} rollouts — a model or rung name drifted`);
  const svg = contactSheet(rows, PORTS);
  const count = (re) => (svg.match(re) || []).length;
  const fills = count(/class="cs fired"/g), rings = count(/class="ck"/g), solid = count(/class="cr solid"/g), dashed = count(/class="cr dashed"/g);
  if (fills !== n) throw new Error(`${fills} fills for ${n} rollouts`);
  if (rings !== n) throw new Error(`${rings} truth rings for ${n} rollouts`);
  const slipped = RESULTS.filter((x) => x.wf !== 1).length;
  if (dashed !== slipped || solid !== n - slipped) throw new Error(`${dashed} dashed / ${solid} solid marks for ${slipped} slipped references`);
});
check('every recorded refutation builds as a subgraph that names its own facts', () => {
  const kinds = new Set(REFUTATIONS.map((r) => r.kind));
  for (const k of ['wrong_verdict', 'straddle_called_definite', 'confident_on_missing', 'reference_slip'])
    if (!kinds.has(k)) throw new Error(`the record has no ${k} failure`);
  for (const r of REFUTATIONS) {
    const { svg, caption } = refute(r);
    if (!/<svg/.test(svg)) throw new Error(`${r.kind}: no drawing`);
    if (!caption.includes(r.said)) throw new Error(`${r.kind}: the caption does not say what the model answered (${r.said})`);
    if (!svg.includes(`it answered ${r.said}`) && r.kind !== 'reference_slip') throw new Error(`${r.kind}: the claim node is missing`);
  }
  /* the third shape's finding is a deciding port with no wire: the port must be drawn */
  const missing = REFUTATIONS.find((r) => r.kind === 'confident_on_missing');
  const port = String(missing.facts.missing).split('.').pop();
  if (!refute(missing).svg.includes(`>${port}<`)) throw new Error(`the unwired port "${port}" is not drawn, so the finding is invisible`);
});

console.log(`\n${fail === 0 ? 'ALL GREEN' : fail + ' FAILED'} — ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
