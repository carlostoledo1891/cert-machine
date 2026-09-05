/* make-refutations.mjs — the subgraphs as a file, for the page builder.
   node make-refutations.mjs                                                  */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { build } from './refutation.mjs';

const SRC = new URL('../wiring/eval/refutations.json', import.meta.url);
const R = JSON.parse(readFileSync(SRC, 'utf8'));
const TITLE = {
  wrong_verdict: 'a verdict the arithmetic refutes',
  straddle_called_definite: 'a claim the stated quantities do not determine',
  confident_on_missing: 'a verdict with nothing wired to a deciding port',
  reference_slip: 'the right answer, from the wrong quantity',
};
const out = R.map((r) => Object.assign({ title: TITLE[r.kind] || r.kind, kind: r.kind, model: r.model,
  said: r.said, truth: r.truth, rung: r.rung }, build(r)));
mkdirSync(new URL('./out/', import.meta.url), { recursive: true });
writeFileSync(new URL('./out/refutations.json', import.meta.url), JSON.stringify(out));
console.log(`out/refutations.json — ${out.length} subgraphs`);
