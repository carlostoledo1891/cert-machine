#!/usr/bin/env node
/* battery.js — the gate of the hundred pre-registered machine claims' deciding runs (phase 4b).
   instruments/mc100 · cert-machine

   Each run writes its own ledger (certs/mc100-<pool>.json) and the register reads it through
   tools/run-claims-ledger.js. This battery holds every ledger to the manifest — every row the pool's rule named,
   once, decided from bytes that hash to the pin — re-decides the certified objects from the ledger's own bytes,
   re-reads one object per pool LIVE from the pinned source and compares, and fires the red controls each run
   needs: a forged object must flip its verdict, a reader must refuse what it cannot read, and the second
   implementation must refuse a forged certificate.

   usage: node instruments/mc100/battery.js        exit 0 iff every check passes and every red control fires */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const os = require('os');
const ROOT = path.resolve(__dirname, '..', '..');
const T = require(path.join(ROOT, 'instruments', 'strassen', 'tensor.js'));
const CA = require(path.join(ROOT, 'tools', 'convert_alphaevolve.js'));
const RUN = require(path.join(ROOT, 'tools', 'run-mc100-tensors.js'));
const J = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

let pass = 0, fail = 0, reds = 0, redsFired = 0;
const ok = (c, m) => { if (c) { pass++; console.log('PASS  ' + m); } else { fail++; console.log('FAIL  ' + m); } };
const red = (fired, m) => { reds++; if (fired) redsFired++; ok(fired, 'RED   ' + m); };
const M = J('corpus/machine-claims-100.json');
const clone = (x) => JSON.parse(JSON.stringify(x));

/* ---- every ledger against the manifest ---------------------------------------- */
function holdsManifest(file) {
  const L = J(file);
  const pool = L.pool, want = M.rows.filter((r) => r.pool === pool);
  const ids = L.rows.map((r) => r.id);
  ok(L.rows.length === want.length && want.length === M.caps[pool] && new Set(ids).size === ids.length && want.every((w) => ids.includes(w.id)),
    file + ': every one of the ' + want.length + ' rows the ' + pool + ' rule named, once, nothing else');
  ok(L.rows.every((r) => { const m = want.find((w) => w.id === r.id); return m && r.sha256 === m.sha256; }),
    file + ': every row decided from bytes that hash to the manifest\'s pin');
  ok(L.rows.every((r) => r.verdict && r.kind && r.scope && typeof r.ms === 'number'), file + ': every row carries a verdict, a kind, a scope and its time');
  return L;
}

/* ================================================================================
   THE TENSOR POOLS — tools/run-mc100-tensors.js
   ================================================================================ */
console.log('-- the tensor pools (alphatensor-q, alphatensor-f2, alphaevolve-nb-matmul)');
const TL = {};
for (const pool of RUN.POOLS) {
  const file = 'certs/mc100-' + pool + '.json';
  if (!fs.existsSync(path.join(ROOT, file))) { ok(false, file + ' exists'); continue; }
  const L = TL[pool] = holdsManifest(file);
  /* every CERTIFIED row has a detached entry, and the entry re-decides from the ledger's bytes */
  const cert = L.rows.filter((r) => r.verdict === 'CERTIFIED');
  const allRedecide = cert.every((r) => {
    const e = L.entries.find((x) => x.id === r.id);
    if (!e) return false;
    const c = { dims: e.dims, rank: e.rank, ring: e.ring, scale: e.scale, U: e.U, V: e.V, W: e.W };
    const a = e.ring === 'Zi' ? T.auditZi(c) : T.audit(c);
    return a.verdict === 'VERIFIED' && a.layout === e.layout;
  });
  ok(cert.length === L.entries.length && allRedecide, file + ': the ' + cert.length + ' CERTIFIED rows re-decide from the ledger\'s own entries');
  /* the second implementation: stdlib Python, no code from this repository, the pins re-hashed, its own red control */
  const v = cp.spawnSync('python3', [path.join(ROOT, 'tools', 'verify_strassen.py'), file, '--sources', 'corpus/sources'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
  ok(v.status === 0 && new RegExp(cert.length + ' entries checked, 0 failures').test(v.stdout) && /PASS\s+RED control/.test(v.stdout),
    file + ': tools/verify_strassen.py re-derives all ' + cert.length + ' in stdlib Python, pins re-hashed, its red control fired');
}

/* LIVE: one key per AlphaTensor pool re-read from the npz and compared with the ledger */
for (const [pool, file, key] of [['alphatensor-q', 'alphatensor_r.npz', '2,4,5'], ['alphatensor-f2', 'alphatensor_f2.npz', '3,3,4']]) {
  if (!TL[pool]) continue;
  const out = cp.spawnSync('python3', [path.join(ROOT, 'tools', 'convert_alphatensor.py'), '--emit', file, key], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
  const E = out.status === 0 ? JSON.parse(out.stdout).entries[0] : null;
  const id = (pool === 'alphatensor-q' ? 'at-q-' : 'at-f2-') + key.replace(/,/g, 'x');
  const e = TL[pool].entries.find((x) => x.id === id);
  ok(E && e && JSON.stringify([E.U, E.V, E.W]) === JSON.stringify([e.U, e.V, e.W]), 'LIVE: ' + id + ' re-read from ' + file + ' equals the ledger\'s factors');
}

/* RED: a forged coefficient in a certified AlphaTensor scheme is REFUTED, by the instrument and by the stdlib verifier */
if (TL['alphatensor-q']) {
  const e = clone(TL['alphatensor-q'].entries.find((x) => x.id === 'at-q-2x4x5'));
  e.U[3][7] += 1;
  const a = T.audit({ dims: e.dims, rank: e.rank, ring: 'Q', U: e.U, V: e.V, W: e.W });
  red(a.verdict === 'REFUTED', 'one coefficient of AlphaTensor\'s <2,4,5> moved by 1 is REFUTED (' + (a.why || '').slice(0, 60) + '…)');
  const tmp = path.join(os.tmpdir(), 'mc100-forged-' + process.pid + '.json');
  const L = clone(TL['alphatensor-q']); L.entries = [L.entries[0], e];
  fs.writeFileSync(tmp, JSON.stringify(L));
  const v = cp.spawnSync('python3', [path.join(ROOT, 'tools', 'verify_strassen.py'), tmp], { encoding: 'utf8' });
  fs.unlinkSync(tmp);
  red(v.status !== 0 && /FAIL\s+at-q-2x4x5/.test(v.stdout), 'tools/verify_strassen.py (stdlib) refuses a ledger carrying the forged scheme');
}
/* RED: an F2 scheme read over Q must fail — the over-Q column is decided, not assumed */
if (TL['alphatensor-f2']) {
  const e = TL['alphatensor-f2'].entries.find((x) => x.id === 'at-f2-2x2x3');
  const q = T.audit({ dims: e.dims, rank: e.rank, ring: 'Q', U: e.U, V: e.V, W: e.W });
  red(q.verdict === 'REFUTED' && /REFUTED over Q/.test(TL['alphatensor-f2'].rows.find((r) => r.id === 'at-f2-2x2x3').decision.overQ),
    'AlphaTensor\'s F2 <2,2,3> over Q is REFUTED, and the ledger says so');
}

/* the notebook: the converter learned the three rings; the old converter's refusal is the red control */
{
  const { sha256: nbSha, sections } = CA.convertPartA();
  ok(sections.length === 16 && sections.filter((s) => s.printed && !s.refused).length === 15 && sections.filter((s) => !s.printed).length === 1,
    'the notebook\'s part A reads as 16 sections: 15 printed and decided by the reader, one (<4,4,8>) printed only as prose');
  ok(['Z', '0.5*Z', '0.5*C'].every((ring) => sections.some((s) => s.ring === ring && s.claim)), 'all three rings the headings name (Z, 0.5*Z, 0.5*C) are read');
  /* the already-decided row is unmoved: the new reader writes corpus/alphaevolve-corpus.json byte for byte */
  const { out } = CA.write444();
  ok(JSON.stringify(out) + '\n' === fs.readFileSync(path.join(ROOT, 'corpus', 'alphaevolve-corpus.json'), 'utf8'),
    'the rank-48 <4,4,4> (already in the register) is written byte-identically by the new reader — the decided row does not move');
  /* the old converter, verbatim in logic (tools/convert_alphaevolve.js at a3004ba): complex literals only, every doubled component in {-1,0,1}, 16 x 48 */
  const legacy = (src, rows, cols) => {
    const blocks = src.split('np.array(').slice(1);
    if (blocks.length !== 3) return { refused: 'expected exactly 3 np.array blocks, found ' + blocks.length };
    const C = /([+-]?\s*\d+\.?\d*)\s*([+-]\s*\d+\.?\d*)j/g;
    const factors = [];
    for (const b of blocks) {
      const vals = [];
      for (const m of b.split('dtype=')[0].matchAll(C)) {
        const re = 2 * parseFloat(m[1].replace(/\s+/g, '')), im = 2 * parseFloat(m[2].replace(/\s+/g, ''));
        if (!Number.isInteger(re) || !Number.isInteger(im) || Math.abs(re) > 1 || Math.abs(im) > 1) return { refused: 'doubled coefficient not in {-1,0,1}+{-1,0,1}i: ' + m[0] };
        vals.push([re, im]);
      }
      if (vals.length !== rows * cols) return { refused: 'parsed ' + vals.length + ' entries, expected ' + rows * cols };
      factors.push(vals);
    }
    return { factors };
  };
  const nb = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'sources', 'alphaevolve_mathematical_results.ipynb'), 'utf8'));
  const cellOf = (v) => nb.cells.find((c) => c.cell_type === 'code' && c.source.join('').includes(v + ' = (')).source.join('');
  const L444 = legacy(cellOf('decomposition_444'), 16, 48);
  const s444 = sections.find((s) => s.variable === 'decomposition_444');
  ok(L444.factors && JSON.stringify(L444.factors) === JSON.stringify([s444.claim.U, s444.claim.V, s444.claim.W].map((F) => [].concat(...F))),
    'CALIBRATION: on the one cell the old converter knew (<4,4,4>), old and new readers give the same doubled factors');
  const L347 = legacy(cellOf('decomposition_347'), 12, 63);
  const s347 = sections.find((s) => s.variable === 'decomposition_347');
  const d347 = RUN.decide(s347.claim);
  red(!!L347.refused && d347.verdict === 'VERIFIED',
    'the OLD converter refuses the second 0.5*C decomposition, <3,4,7> rank 63 ("' + (L347.refused || '').slice(0, 54) + '…"); the new one reads it and the instrument VERIFIES it');
  const L245 = legacy(cellOf('decomposition_245'), 8, 32);
  red(!!L245.refused, 'the OLD converter cannot read a real array at all (<2,4,5> over 0.5*Z: "' + (L245.refused || '').slice(0, 40) + '")');
  /* the new reader refuses what is not in the ring its heading names */
  const src245 = cellOf('decomposition_245');
  const forgedQuarter = src245.replace(/-0\.5/, '-0.25');
  let r1 = null; try { CA.toClaim(CA.readCell(forgedQuarter), [2, 4, 5], 32, '0.5*Z'); } catch (e) { r1 = e.message; }
  red(!!r1 && /not in \(1\/2\)Z/.test(r1), 'a 0.5*Z entry forged to -0.25 is refused by the reader (' + (r1 || '').slice(0, 50) + ')');
  let r2 = null; try { CA.toClaim(CA.readCell(src245), [2, 4, 5], 32, 'Z'); } catch (e) { r2 = e.message; }
  red(!!r2 && /denominator 2/.test(r2), 'half-integer entries under a heading that names Z are refused (' + (r2 || '').slice(0, 50) + ')');
  let r3 = null; try { CA.toClaim(CA.readCell(cellOf('decomposition_347')), [3, 4, 7], 63, '0.5*Z'); } catch (e) { r3 = e.message; }
  red(!!r3 && /imaginary/.test(r3), 'a complex decomposition under a heading that names 0.5*Z is refused');
  /* the doubling recipe: the rebuild verifies; a rebuild with one block's products crossed is REFUTED */
  const base = s444.claim, bd = RUN.decide(base);
  const rb = RUN.doubleAlongP(base, bd.layout), rbd = RUN.decide(rb);
  ok(rbd.verdict === 'VERIFIED' && rb.rank === 96 && rb.dims.join() === '4,4,8', 'the notebook\'s recipe for <4,4,8> (two copies of the rank-48, one per column block of B) rebuilds and VERIFIES at rank 96');
  const crossed = clone(rb); crossed.W = crossed.W.map((row) => row.slice(48).concat(row.slice(0, 48)));
  red(RUN.decide(crossed).verdict === 'REFUTED', 'the same rebuild with the two blocks\' outputs crossed is REFUTED');
  /* the ledger's <4,4,8> row says it was rebuilt; the pin is the notebook's */
  const r448 = TL['alphaevolve-nb-matmul'] && TL['alphaevolve-nb-matmul'].rows.find((r) => r.id === 'ae-nb-4x4x8-r96');
  ok(r448 && /rebuilt/.test(r448.scope) && r448.decision.rebuilt && r448.sha256 === nbSha, 'the <4,4,8> row says it was rebuilt from the printed recipe, and names the notebook\'s pin');
}

/* ================================================================================
   THE EINSTEINARENA ROWS, WAVE 1 — tools/run-mc100-einstein.js
   ================================================================================ */
console.log('-- the einstein-arena pool, wave 1 (kissing + the easota shapes)');
const EA = require(path.join(ROOT, 'tools', 'run-mc100-einstein.js'));
const EAL = fs.existsSync(path.join(ROOT, 'certs', 'mc100-einstein-arena.json')) ? J('certs/mc100-einstein-arena.json') : null;
ok(!!EAL, 'certs/mc100-einstein-arena.json exists');
if (EAL) {
  const want = M.rows.filter((r) => r.pool === 'einstein-arena');
  const ids = EAL.rows.map((r) => r.id), und = EAL.undecided.map((u) => u.id);
  ok(ids.length + und.length === want.length && want.every((w) => ids.includes(w.id) !== und.includes(w.id)) && new Set(ids.concat(und)).size === want.length,
    'every one of the pool\'s ' + want.length + ' rows is either decided (' + ids.length + ') or listed undecided with a reason (' + und.length + '), never both, nothing else');
  ok(EAL.rows.every((r) => { const m = want.find((w) => w.id === r.id); return m && r.sha256 === m.sha256; }), 'every decided row was read from bytes that hash to the manifest\'s pin');
  ok(EAL.undecided.every((u) => u.needs && u.needs.length > 10), 'every undecided row says what it needs');
  ok(EAL.literalReading.literals > 100000 && EAL.literalReading.notShortestForm === 0, 'all ' + EAL.literalReading.literals.toLocaleString('en-US') + ' number literals read as text; every one is the shortest form of its double');
  const byId = (id) => EAL.rows.find((r) => r.id === id);
  /* LIVE: the cheap rows re-decided from the pinned bytes and compared with the ledger */
  const P = J('corpus/einstein-arena/problems.json');
  const live = (id) => {
    const mr = M.rows.find((r) => r.id === id), slug = id.replace(/^ea-best-/, '');
    const B = EA.parseJsonExact(fs.readFileSync(path.join(ROOT, mr.source.split(' ')[0]), 'utf8'));
    const prob = P.find((p) => p.slug === slug);
    return { B, prob, mr, res: /kissing/.test(slug) ? EA.kissingRow(mr, B, prob) : EA.easotaRow(mr, B, prob) };
  };
  for (const id of ['ea-best-kissing-number-d11', 'ea-best-kissing-number-d12', 'ea-best-kissing-number-d11-605', 'ea-best-kissing-number-d12-842', 'ea-best-min-distance-ratio-2d', 'ea-best-circles-rectangle', 'ea-best-erdos-min-overlap', 'ea-best-flat-polynomials']) {
    const { res } = live(id), r = byId(id);
    const same = res.verdict === r.verdict && res.kind === r.kind && JSON.stringify(res.decision) === JSON.stringify(r.decision);
    ok(same, 'LIVE: ' + id + ' re-decided from the pinned bytes — ' + res.verdict + ', the decision identical to the ledger\'s');
  }
  /* CROSS-CHECK: the open rungs as the kissing ledger measured them on 2026-09-08 (K.measure, another code path, the same solutions) */
  const KL = J('certs/kissing-ledger.json');
  for (const [slug, id] of [['kissing-number-d11-605', 'ea-best-kissing-number-d11-605'], ['kissing-number-d12', 'ea-best-kissing-number-d12'], ['kissing-number-d12-842', 'ea-best-kissing-number-d12-842']]) {
    const o = KL.openRungs.find((x) => x.slug === slug), r = byId(id);
    const agree = o && r && o.best.id === r.solution && o.measured.violations === r.decision.violations && o.measured.coincident === r.decision.coincident
      && o.measured.worst.i === r.decision.worst.i && o.measured.worst.j === r.decision.worst.j && Math.abs(o.measured.worstAngleDeg - r.decision.worst.angleDegApprox) < 1e-9;
    ok(agree, 'CROSS-CHECK: ' + slug + ' — ' + (r ? r.decision.violations.toLocaleString('en-US') + ' violating pairs, worst (' + r.decision.worst.i + ', ' + r.decision.worst.j + ')' : '?') + ', as the kissing ledger measured the same solution by another code path');
  }
  const r605 = byId('ea-best-kissing-number-d11-605'), r842 = byId('ea-best-kissing-number-d12-842');
  ok(r605 && /NOT a kissing configuration/.test(r605.scope) && r605.decision.agreement.agrees && r842 && r842.decision.agreement.agrees,
    'the 605 and 842 rungs decided NOT solutions, and the platform\'s penalty reproduced to every printed digit (' + (r605 ? r605.decision.penaltyEnclosure[0].slice(0, 20) : '') + '…, ' + (r842 ? r842.decision.penaltyEnclosure[0].slice(0, 20) : '') + '…)');
  ok(byId('ea-best-kissing-number-d11').sameClaimAs === 'kiss-ea-594-winner' && byId('ea-best-min-distance-ratio-2d').sameClaimAs === 'ea-mindist-ours_2026',
    'the two objects the register already held (the 594 and the min-distance 16 points) are named, not counted twice');
  /* RED controls */
  {
    const { B, prob, mr } = live('ea-best-kissing-number-d11');
    const F = clone(B); F.data.vectors[1] = clone(F.data.vectors[0]);
    const res = EA.kissingRow(mr, F, prob);
    red(res.verdict === 'REFUTED' && res.decision && res.decision.coincident === 1, 'the 594 with vector 1 overwritten by vector 0: no longer a kissing configuration, and its printed score 0 is no longer reproduced — REFUTED');
  }
  {
    const { B, prob, mr } = live('ea-best-kissing-number-d11-605');
    const F = clone(B); F.score = { lit: '1.7102381876401676' };
    red(EA.kissingRow(mr, F, prob).verdict === 'REFUTED', 'the 605 with its printed score moved by 1e-11 (above the 1e-12 resolution) is REFUTED — the score is reproduced, not assumed');
  }
  {
    const { B, prob, mr } = live('ea-best-circles-rectangle');
    const F = clone(B); const c = F.data.circles[10]; c[2] = { lit: String(Number(c[2].lit) + 1e-9) };
    const res = EA.easotaRow(mr, F, prob);
    red(res.verdict !== 'CERTIFIED', 'a circle\'s radius grown by 1e-9: the bytes no longer give the printed Σr nor an exact witness — ' + res.verdict + ', not CERTIFIED');
  }
  {
    const { B, prob, mr } = live('ea-best-erdos-min-overlap');
    const F = clone(B); F.data.values[100] = { lit: '1.0000001' };
    red(EA.easotaRow(mr, F, prob).verdict === 'REFUTED', 'a minimum-overlap value set to 1.0000001 (outside [0, 1]) is REFUTED');
  }
  {
    const x = EA.parseJsonExact('{"x":[0.1000000000000000055511151231257827]}').x[0].lit;
    red(x === '0.1000000000000000055511151231257827' && JSON.parse('[0.1000000000000000055511151231257827]')[0] === 0.1, 'the reader keeps a literal JSON.parse would round (0.1000000000000000055511151231257827 stays itself, not 0.1)');
  }
}

/* ---- the register reads the ledgers ------------------------------------------- */
{
  const R = J('certs/claims-ledger.json');
  const mine = Object.values(TL).reduce((n, L) => n + L.rows.length, 0);
  ok(R.preregistered && R.rows.filter((r) => r.preregistered && /^certs\/mc100-(alphatensor|alphaevolve-nb)/.test(r.decidedFrom)).length === mine,
    'the register holds the ' + mine + ' tensor rows, each derived from its pool\'s ledger');
  if (EAL) {
    const own = EAL.rows.filter((r) => !r.sameClaimAs), twins = EAL.rows.filter((r) => r.sameClaimAs);
    ok(own.every((r) => R.rows.some((x) => x.id === 'mc100-' + r.id && x.verdict === r.verdict && x.kind === r.kind))
      && twins.every((r) => { const x = R.rows.find((y) => y.id === r.sameClaimAs); return x && x.preregistered && x.preregistered.id === r.id && x.verdict === r.verdict; })
      && !R.rows.some((x) => twins.some((r) => x.id === 'mc100-' + r.id)),
      'the register holds the ' + own.length + ' new EinsteinArena rows and annotates the ' + twins.length + ' it already held (counted once)');
  }
}

console.log('\nmc100 battery: ' + pass + ' pass, ' + fail + ' fail · red controls ' + redsFired + '/' + reds + ' fired');
process.exit(fail || redsFired !== reds ? 1 : 0);
