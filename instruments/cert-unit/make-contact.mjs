/* make-contact.mjs — the contact sheet as a file, so the page builder stays a
   builder. node make-contact.mjs                                             */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { contactSheet } from './contact.mjs';

const SRC = new URL('../../environments/lattice-claims/eval/results.json', import.meta.url);
const R = JSON.parse(readFileSync(SRC, 'utf8'));
const PORTS = ['ADMISSIBLE', 'REFUSED', 'STRADDLES', 'NEEDS_DATA', 'no answer'];
const MODELS = ['Opus 5', 'Sonnet 5', 'Haiku 4.5'];
const RUNGS = ['declared', 'printed', 'underspecified'];

const rows = [];
for (const m of MODELS) for (const rg of RUNGS) {
  rows.push({
    label: (rg === RUNGS[0] ? m + '  ' : '') + rg,
    cells: R.filter((x) => x.model === m && x.rung === rg)
      .map((x) => ({ fired: x.verdict || 'no answer', truth: x.truth, wellFormed: x.wf === 1 })),
  });
}
const svg = contactSheet(rows, PORTS, {
  note: 'fill inside a ring = right   fill alone = wrong   ring alone = the answer it missed   dashed underline = the reference slipped',
});
mkdirSync(new URL('./out/', import.meta.url), { recursive: true });
writeFileSync(new URL('./out/contact.svg', import.meta.url), svg);
const miss = R.filter((x) => x.cert === 0).length, slip = R.filter((x) => x.wf === 0 && x.rung !== 'underspecified').length;
console.log(`out/contact.svg — ${R.length} rollouts, ${rows.length} rows, ${miss} missed, ${slip} reference slips`);
