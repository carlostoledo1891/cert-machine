/**
 * trace.mjs — the bracket, fed by a solver that is actually running.
 *
 * Chambolle-Pock produces both sides at once: the ceiling from the multipliers
 * it is optimising and the witness from the dual variable it is already
 * carrying. So the bracket node has two inputs arriving from one process, round
 * by round, and the gap is a live number that closes while you watch rather
 * than a ratio quoted at the end.
 *
 * The compute stays here in node — this is seconds, not milliseconds, and a
 * visual graph is the wrong place for it. The page replays the trace.
 *
 * Two traces, and the second is the honest one:
 *   --rounds   the cutting-plane rounds. Barely moves, because nearly all the
 *              work happens inside round one.
 *   --budget   the same bracket against the ITERATION BUDGET given to the
 *              solver. This is the one that shows the gap closing, and it is
 *              the one that says the looseness was never the mathematics.
 *
 * node trace.mjs [r0=12] [--budget|--rounds]
 */
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { CERTIFIED, graph } from './graph.mjs';
import { hyp, ivl } from './port.mjs';
import { bracket } from './nodes.mjs';

const require = createRequire(import.meta.url);
const CP = require('../../playground/interferometer/cert-cp.js');

const r0 = +(process.argv[2] || 12);
const o = CP.opts([`iters=${process.argv[3] || 1500}`, `rounds=${process.argv[4] || 5}`,
  'sub=16', 'N=36', 'Nf=384', 'cuts=200']);
const ds = CP.dataset(o);

const RAIL = hyp({
  instrument: 'interferometer', dataset: 'EHT 2024-D01-01 M87 2018-04-21 b3 hops',
  rows_dual: ds.K, rows_witness: ds.Kall, bcut_Gl: o.bcut, fov_uas: o.fov, F_Jy: o.F,
  nsig: o.nsig, gain: 'per-station amplitude-loss allowance, divided not added', r0_uas: r0,
});
console.log(`bracket on flux within ${r0} uas — dual sees ${ds.K} rows, the witness faces all ${ds.Kall}`);
console.log(`hypothesis stamp ${RAIL.stamp}\n`);

const BUDGET = !process.argv.includes('--rounds');
const trace = [];

/** one bracket, from one solve, at one budget */
function braq(rep, tag) {
  const g = graph(String(tag)).add(bracket({ id: 'b', label: `flux r<=${r0}uas` }));
  g.push('b', 'witness', ivl(rep.witness, rep.witness, RAIL));
  const out = g.push('b', 'ceiling', ivl(rep.ceiling, rep.ceiling, RAIL)).fired[0];
  return { ...rep, tag, gap: rep.ceiling / Math.max(rep.witness, 1e-30), port: out.port };
}

if (BUDGET) {
  const budgets = [40, 120, 400, 1200, 4000, 12000];
  const t00 = Date.now();
  for (const it of budgets) {
    const oo = CP.opts([`iters=${it}`, 'rounds=1', 'sub=16', 'N=36', 'Nf=384', 'cuts=200']);
    const t1 = Date.now();
    const rep = CP.ceiling(ds, r0, oo, false);
    const row = braq(rep, it);
    row.secs = (Date.now() - t1) / 1000;
    trace.push(row);
    console.log(`  ${String(it).padStart(6)} iterations  witness ${rep.witness.toFixed(4)}  ceiling ${rep.ceiling.toFixed(4)}  gap ${row.gap.toFixed(2)}x  ${row.secs.toFixed(1)}s`);
  }
  const first = trace[0], last = trace[trace.length - 1];
  console.log(`\nthe gap closed ${first.gap.toFixed(2)}x -> ${last.gap.toFixed(2)}x across ${budgets[0]} to ${budgets[budgets.length-1]} iterations, ${((Date.now()-t00)/1000).toFixed(0)} s total`);
  mkdirSync(new URL('./out/', import.meta.url), { recursive: true });
  writeFileSync(new URL('./out/cp-trace.json', import.meta.url), JSON.stringify({
    mode: 'budget', hyp: RAIL.toJSON(), r0, rowsDual: ds.K, rowsWitness: ds.Kall, trace }, null, 2));
  console.log('written out/cp-trace.json');
  process.exit(0);
}

o.onRound = (rep) => {
  /* a FRESH graph each round: the bracket is a comparator, not an accumulator */
  const g = graph(`round ${rep.round}`).add(bracket({ id: 'b', label: `flux r<=${r0}uas` }));
  g.push('b', 'witness', ivl(rep.witness, rep.witness, RAIL));
  const out = g.push('b', 'ceiling', ivl(rep.ceiling, rep.ceiling, RAIL)).fired[0];
  const gap = rep.ceiling / Math.max(rep.witness, 1e-30);
  trace.push({ round: rep.round, witness: rep.witness, ceiling: rep.ceiling, gap, port: out.port });
  console.log(`  round ${rep.round}  witness ${rep.witness.toFixed(4)}  ceiling ${rep.ceiling.toFixed(4)}  gap ${gap.toFixed(2)}x  ${out.port}`);
};
const t0 = Date.now();
const res = CP.ceiling(ds, r0, o, false);
const secs = (Date.now() - t0) / 1000;

const first = trace[0], last = trace[trace.length - 1];
console.log(`\nthe gap closed ${first.gap.toFixed(2)}x -> ${last.gap.toFixed(2)}x in ${secs.toFixed(0)} s`);
mkdirSync(new URL('./out/', import.meta.url), { recursive: true });
writeFileSync(new URL('./out/cp-trace.json', import.meta.url), JSON.stringify({
  hyp: RAIL.toJSON(), r0, opts: { iters: o.iters, rounds: o.rounds, sub: o.sub, N: o.N, Nf: o.Nf },
  rowsDual: ds.K, rowsWitness: ds.Kall, secs, trace,
}, null, 2));
console.log('written out/cp-trace.json');
