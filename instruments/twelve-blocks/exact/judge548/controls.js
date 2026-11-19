#!/usr/bin/env node
/* controls.js — planted wrong versions that the judge must refuse.

     node controls.js            the six named controls, then three sweeps
     node controls.js --quick    the six named controls only

   Each control runs the whole judge with one planted change and prints the status of the
   nine items and the first item that refuses. A control is CAUGHT when the verdict is
   REFUSED, and MISSED when the judge still prints CERTIFIED. The exit code is nonzero if
   the clean run is not CERTIFIED or any named control is missed. */
'use strict';
const fs = require('fs');
const J = require('./judge.js');

const quick = process.argv.includes('--quick');
const data = JSON.parse(fs.readFileSync(J.TANGENT_FILE, 'utf8'));
const largest = v => { let k = 0; v.forEach((e, i) => { if (Math.abs(e[1]) > Math.abs(v[k][1])) k = i; }); return k; };

function line(res) { return [1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => k + ':' + (res.status[k] === 'PASS' ? 'pass' : 'FAIL')).join(' '); }
let missed = 0;
/* expect: 'certified' (the clean run), 'refused' (a planted error), or 'report' (a planted
   change that need not be an error: the outcome is printed and not scored) */
function control(name, plant, expect, note) {
  const res = J.runJudge(plant, { quiet: true });
  const refused = res.verdict === 'REFUSED';
  console.log(name);
  console.log('    verdict ' + res.verdict + (res.first ? ', first refusal at item ' + res.first : '') + '   [' + line(res) + ']   ' + res.seconds.toFixed(1) + ' s');
  for (let k = 1; k <= 9; k++) if (res.status[k] === 'FAIL' && !/^item \d is not established$/.test(res.detail[k]) && !/^needs /.test(res.detail[k])) console.log('    item ' + k + ': ' + res.detail[k].slice(0, 700));
  if (expect === 'certified') { if (refused) { missed++; console.log('    THE CLEAN RUN IS NOT CERTIFIED'); } else console.log('    as expected: CERTIFIED'); }
  else if (expect === 'refused') { if (refused) console.log('    CAUGHT'); else { missed++; console.log('    MISSED: the judge still certifies'); } }
  else console.log('    ' + (refused ? 'REFUSED' : 'NOT REFUSED') + (note ? ': ' + note : ''));
  console.log('');
  return res;
}

const clean = control('control 0  the clean run', {}, 'certified');
control('control 1  the strengthening constant 947 instead of 948', { C: 947 }, 'refused');
const e0 = largest(data.steps[0].vectors[0]);
control('control 2  one tangent entry doubled (operation 0, vector 0, entry ' + e0 + ': cell ' + data.steps[0].vectors[0][e0][0] + ', value ' + data.steps[0].vectors[0][e0][1] + ')', { tangentPerturb: { step: 0, vec: 0, entry: e0 } }, 'report',
  'every rational v gives a true tangent inequality, so a perturbed file is a wrong certificate only if its replay no longer closes; this one still closes, and certifying it is sound (see sweep A for all 201 vectors)');
const e1 = largest(data.steps[1].vectors[0]);
control('control 2b one tangent entry doubled (operation 1, vector 0, entry ' + e1 + ': cell ' + data.steps[1].vectors[0][e1][0] + ', value ' + data.steps[1].vectors[0][e1][1] + ')', { tangentPerturb: { step: 1, vec: 0, entry: e1 } }, 'refused');
control('control 3  one operation dropped (operation 1: ' + JSON.stringify({ action: data.steps[1].action, cell: data.steps[1].cell, lower: data.steps[1].lower }) + ')', { dropStep: 1 }, 'refused');
control('control 3b one operation dropped (operation 3: ' + JSON.stringify({ action: data.steps[3].action, cell: data.steps[3].cell, lower: data.steps[3].lower }) + ')', { dropStep: 3 }, 'refused');
control('control 4  the charging weights g set to 0 on the exterior cells', { gZeroExterior: true }, 'refused');
control('control 5  F1 with b_i doubled on one cell (inner grid, cell 0, sites 1..8)', { f1DoubleB: { grid: 0, cell: 0 } }, 'refused');
control('control 6  the baseline changed at one site far from every boundary (site 200)', { baselineFlip: 200 }, 'refused');

if (!quick && clean.verdict === 'CERTIFIED') {
  const base = clean.ctx;
  /* sweep A: every one of the 201 tangent vectors, its largest entry doubled, one at a time.
     Any rational v gives a true tangent inequality, so a perturbed file is still a valid
     certificate whenever its replay closes; the sweep counts how often it no longer does. */
  {
    let lost = 0, total = 0; const still = [];
    data.steps.forEach((st, si) => st.vectors.forEach((v, vi) => {
      total++;
      const r = J.replayOnly(base, { tangentPerturb: { step: si, vec: vi, entry: largest(v) } });
      if (!r.reached) lost++; else still.push(si + '.' + vi);
    }));
    console.log('sweep A  each tangent vector in turn, its largest entry doubled: the replay no longer reaches the conclusion in ' + lost + ' of ' + total + ' cases' + (still.length ? '; it still reaches it for (operation.vector) ' + still.join(' ') : ''));
  }
  /* sweep A2: the same with every entry of the vector doubled (v replaced by 2v) */
  {
    let lost = 0, total = 0;
    data.steps.forEach((st, si) => st.vectors.forEach((v, vi) => {
      total++;
      const r = J.replayOnly(base, { tangentScale: { step: si, vec: vi, factor: 2 } });
      if (!r.reached) lost++;
    }));
    console.log('sweep A2 each tangent vector in turn replaced by twice itself: the replay no longer reaches the conclusion in ' + lost + ' of ' + total + ' cases');
  }
  /* sweep B: every one of the 120 operations dropped, one at a time */
  {
    const lostList = []; let kept = 0;
    data.steps.forEach((st, si) => { const r = J.replayOnly(base, { dropStep: si }); if (!r.reached) lostList.push(si); else kept++; });
    console.log('sweep B  each operation in turn dropped: the replay no longer reaches the conclusion in ' + lostList.length + ' of ' + data.steps.length + ' cases (operations ' + lostList.join(' ') + '); in the other ' + kept + ' it still reaches it, and the judge then refuses only because the file no longer holds 120 operations and 201 vectors');
  }
  /* sweep C: F1 with b_i doubled, every cell of both grids, one at a time */
  {
    let caught = 0, total = 0; const miss = [];
    base.model.grids.forEach((g, gi) => g.cells.forEach((c, ci) => {
      total++;
      const r = J.rerunItem(base, 4, { f1DoubleB: { grid: gi, cell: ci } });
      if (!r.ok) caught++; else miss.push('g' + gi + ':' + ci + '[' + c.lo + '..' + c.hi + ']');
    }));
    console.log('sweep C  F1 with b_i doubled, each cell in turn: item 4 refuses ' + caught + ' of ' + total + (miss.length ? '; NOT refused (grid:cell[sites]): ' + miss.join(' ') : ''));
  }
  /* sweep D: the baseline changed at one site, 12 sites far from every boundary */
  {
    const sites = [10, 48, 80, 128, 200, 216, 330, 420, 468, 500, 534, 540];
    const out = sites.map(p => { const r = J.runJudge({ baselineFlip: p }, { quiet: true }); return p + ':' + (r.verdict === 'REFUSED' ? 'refused at item ' + r.first : 'MISSED'); });
    console.log('sweep D  the baseline changed at one site: ' + out.join(', '));
  }
}
console.log('');
console.log(missed === 0 ? 'controls: the clean run is CERTIFIED and every scored control (1, 2b, 3, 3b, 4, 5, 6) is CAUGHT; control 2 is reported, not scored' : 'controls: ' + missed + ' scored control(s) not as expected');
process.exit(missed === 0 ? 0 : 1);
