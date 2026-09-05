/**
 * reds.mjs — the red team as graph operations, against a LIVE instrument.
 *
 * certkit's battery mutates witnesses. This mutates the INPUTS OF A RUNNING
 * NODE and asserts the direction the verdict is allowed to move. Nothing here
 * is a recorded number: every row re-runs `lib/eqcert`'s radii polynomial.
 *
 * The last case is included on purpose and is expected to FAIL. A battery that
 * cannot fail is decoration, and this bench has already shipped one red that
 * was ill-founded — it asserted an ordering that was not a theorem and duly
 * reported a violation that meant nothing.
 *
 * node reds.mjs
 */
import { createRequire } from 'node:module';
import { CERTIFIED, REFUSED, graph } from './graph.mjs';
import { hyp, ivl } from './port.mjs';
import { MONOTONE, radiiNode } from './nodes.mjs';

const require = createRequire(import.meta.url);
const BAND = require('../../playground/plates/data/band-sigma-0.0008-0.008.json');
const base = BAND.cells.find(c => c.ok);
const H = hyp({ instrument: 'TERRA congestion MFG', N: BAND.N, sigma: base.sig });

/** run the live instrument and return {port, r} */
function run(Y0, Z1, Z2) {
  const g = graph('probe').add(radiiNode({ id: 'p' }));
  g.push('p', 'Y0', ivl(Y0, Y0, H));
  g.push('p', 'Z1', ivl(Z1, Z1, H));
  const o = g.push('p', 'Z2', ivl(Z2, Z2, H)).fired[0];
  return { port: o.port, r: o.port === CERTIFIED ? o.value.datum.lo : null, note: o.note };
}

/** a perturbation names the direction the verdict may move, and is then run */
const CASES = [
  { name: 'defect x10', mutate: (c) => [c.Y0 * 10, c.Z1, c.Z2], dir: MONOTONE.LOOSEN,
    why: 'a larger defect needs a larger radius to absorb it' },
  { name: 'defect /10', mutate: (c) => [c.Y0 / 10, c.Z1, c.Z2], dir: MONOTONE.TIGHTEN,
    why: 'a smaller defect closes sooner' },
  { name: 'contraction 0.776 -> 0.95', mutate: (c) => [c.Y0, 0.95, c.Z2], dir: MONOTONE.LOOSEN,
    why: 'a weaker contraction buys less per step' },
  { name: 'curvature x100', mutate: (c) => [c.Y0, c.Z1, c.Z2 * 100], dir: MONOTONE.LOOSEN,
    why: 'more curvature shrinks the window the contraction has to work in' },
  { name: 'defect x0 (exact solution)', mutate: (c) => [0, c.Z1, c.Z2], dir: MONOTONE.TIGHTEN,
    why: 'a zero defect should close immediately' },
  { name: 'ILL-FOUNDED: curvature x100 must TIGHTEN', mutate: (c) => [c.Y0, c.Z1, c.Z2 * 100], dir: MONOTONE.TIGHTEN,
    why: 'asserted without a theorem behind it — this is the control, and it must fail',
    expectFail: true },
];

const b = run(base.Y0, base.Z1, base.Z2);
console.log(`live instrument: lib/eqcert radii polynomial`);
console.log(`baseline at sigma ${base.sig[0]}: ${b.port}, r = ${b.r.toExponential(4)}\n`);

let held = 0, broke = 0, surprises = 0;
for (const c of CASES) {
  const [Y0, Z1, Z2] = c.mutate(base);
  const out = run(Y0, Z1, Z2);
  let ok, detail;
  if (out.port === REFUSED) { ok = null; detail = out.note; }
  else {
    const grew = out.r >= b.r * 0.99, shrank = out.r <= b.r * 1.01;
    ok = c.dir === MONOTONE.LOOSEN ? grew : c.dir === MONOTONE.TIGHTEN ? shrank : Math.abs(out.r - b.r) < 1e-30 * Math.max(b.r, 1);
    detail = `${b.r.toExponential(3)} -> ${out.r.toExponential(3)}`;
  }
  const expected = c.expectFail ? ok === false : ok === true;
  if (expected) held++; else if (ok === null) { surprises++; } else broke++;
  const tag = ok === null ? 'REFUSED' : ok ? 'held' : 'VIOLATED';
  const mark = expected ? 'PASS' : '**FAIL**';
  console.log(`  ${mark}  ${c.name.padEnd(44)} ${c.dir.padEnd(16)} ${tag.padEnd(9)} ${detail}`);
  if (!expected) console.log(`         ${c.why}`);
  else if (c.expectFail) console.log(`         the control fired as designed: ${c.why}`);
}
console.log(`\n${held}/${CASES.length} behaved as declared (${broke} unexpected violations, ${surprises} unexpected refusals)`);
process.exit(held === CASES.length ? 0 : 1);
