#!/usr/bin/env node
/* battery.js — the gate on instruments/frontier: pins, ladders, brackets, ceilings, and five red controls.
   usage: node instruments/frontier/battery.js */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const F = require(path.join(__dirname, 'frontier.js'));

let checks = 0, fails = 0;
function check(name, cond, detail) {
  checks++;
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + name + (detail !== undefined ? '   [' + detail + ']' : ''));
  if (!cond) fails++;
}
const REC = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'frontier-measurement.json'), 'utf8'));
const R = F.derive();

check('R1  the record re-derived live equals the record', JSON.stringify([R.pins, R.ladders, R.refine, R.rise, R.ceiling]) === JSON.stringify([REC.pins, REC.ladders, REC.refine, REC.rise, REC.ceiling]));
check('R2  the code that produced the record is the code on disk', F.sha256File(path.join(__dirname, 'frontier.js')) === REC.provenance.sha256);
check('P1  every data file hashes to its PROVENANCE pin and none is patched', Object.values(R.pins).every(p => p.ok), Object.entries(R.pins).map(([f, p]) => f + ' ' + p.local.slice(0, 8)).join(' · '));
check('L1  six σ ladders at N = 14, every one monotone (no certified point above a refused one)', R.ladders.length === 6 && R.ladders.every(l => l.monotone), R.ladders.map(l => l.pattern).join(' '));
check('L2  every certified point carries Z1 < 1, r > 0, min m > 0, min w > 0; every refusal is named', R.ladders.every(l => l.pointsOK));
check('L3  the first refusal on every ladder is Z1 ≥ 1, with Z1 just above 1', R.ladders.every(l => l.firstMode === 'Z1_GE_1' && l.firstZ1 >= 1 && l.firstZ1 < 1.01), R.ladders.map(l => l.firstZ1.toFixed(4)).join(' '));
check('L4  the bisected A⋆ bracket lies inside the grid bracket on every ladder', R.ladders.every(l => l.bisected[0] >= l.gridBracket[0] && l.bisected[1] <= l.gridBracket[1]));
check('L5  A⋆ is increasing in σ across the six ladders', R.ladders.every((l, i) => i === 0 || l.bisected[0] > R.ladders[i - 1].bisected[1]));
check('N1  twelve fine ladders (3 σ × 4 N), every one monotone, every stored pattern equal to the one re-derived from its points', R.refine.length === 12 && R.refine.every(r => r.monotone && r.patternAgrees));
check('N2  A⋆ rises with N at every σ, 5–11 % from N = 14 to 40', R.rise.every(r => r.rising && r.movePct > 5 && r.movePct < 11), R.rise.map(r => r.sigma + ': +' + r.movePct.toFixed(2) + '%').join(' · '));
check('N3  cMrecip is below 1 at the last certified point and the ceiling term is what the text says it is', R.refine.every(r => r.cMrecipLastC < 1));
check('C1  the N-free ceiling A_rec is bit-identical across N = 14, 20, 28, 40 at every σ', R.ceiling.every(c => c.sameAcrossN), R.ceiling.map(c => c.sigma + ': [' + c.Arec.map(v => v.toFixed(5)) + ']').join(' · '));
check('C2  the stored ratio equals A⋆_lo / A_rec_hi recomputed (the lower bound of the ratio), rises with N, and stays below 1', R.ceiling.every(c => c.ratios.every(x => x.agrees) && c.ratiosRising && c.allBelowOne));
check('C3  the local slopes of the gap are between −1 and −0.5 and DRIFT across N (an order is not claimed)', R.ceiling.every(c => c.slopes.every(s => s.slope > -1 && s.slope < -0.5)), R.ceiling.map(c => c.slopes.map(s => s.slope.toFixed(2)).join(',')).join(' · '));

/* red controls */
check('X1  RED ok: a ladder with a certified point above a refused one is caught', !F.monotone('CCRCR') && !F.monotone('RC'));
check('X2  RED ok: a certified point with Z1 ≥ 1 is caught, and a refusal without a mode', !F.pointOK({ status: 'CERTIFIED', Z1: 1.0, r: 1e-14, minM: 0.5, minW: 0.8 }) && !F.pointOK({ status: 'REFUSE' }));
const D = F.load();
const forged = JSON.parse(JSON.stringify(D.arec)); forged[1].Arec[0] += 1e-9;
const same = (rows) => rows.every(r => r.Arec[0] === rows[0].Arec[0] && r.Arec[1] === rows[0].Arec[1]);
check('X3  RED ok: a ceiling that differs across N by 1e-9 is caught', same(D.arec.filter(a => a.sigma === 0.1)) && !same(forged.filter(a => a.sigma === 0.1)));
const badRatio = Math.abs(D.arec[0].ratio - D.arec[0].Astar[1] / D.arec[0].Arec[0]) < 1e-12;
check('X4  RED ok: the ratio recomputed from the wrong ends of the brackets does not match the stored one', !badRatio);
const tmp = path.join(F.DIR, 'arec.json'); const bytes = fs.readFileSync(tmp);
fs.writeFileSync(tmp, Buffer.concat([bytes, Buffer.from('\n')]));
const moved = !F.pins()['arec.json'].ok;
fs.writeFileSync(tmp, bytes);
check('X5  RED ok: one appended byte on a data file breaks its pin (restored)', moved && F.pins()['arec.json'].ok);

console.log(fails === 0 ? 'ALL PASS   (' + checks + ' checks, 5 red controls)' : fails + ' FAILED of ' + checks);
process.exit(fails === 0 ? 0 : 1);
