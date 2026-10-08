/* battery.js — Swell's gate: the lifted data is the pinned data, the island model's beaches are sound, the breaking
   height is continuous and monotone in the sea (so the band maps exactly), the refusals refuse, the rules are one
   table, the day re-derives from its written bytes, and the reds that must fire, fire.
   Run: node apps/swell/battery.js      (exit != 0 on any failure)
   apps/swell · cert-machine                                                                                  MIT */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const S = require('./model/surf.js');

const ROOT = path.join(__dirname, '..', '..');
const B = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'beaches.json'), 'utf8'));
const PINS = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'PINS.json'), 'utf8'));
const SCEN = JSON.parse(fs.readFileSync(path.join(__dirname, 'scenario', 'beaches.json'), 'utf8'));
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

let n = 0, reds = 0;
const ok = (name, fn) => { fn(); n++; console.log('PASS ' + name); };
const red = (name, fn) => { fn(); reds++; console.log('PASS ' + name + ' (RED ok)'); };
const byName = (nm) => B.beaches.find((b) => b.name === nm);

/* ---- the data is the pinned data ---- */
function checkPins(files, dir) {
  for (const [rel, p] of Object.entries(files)) {
    const b = fs.readFileSync(path.join(dir, rel));
    if (sha(b) !== p.sha256) throw new Error('REFUSED: ' + rel + ' does not hash to its pin');
  }
}
ok('data: every file of apps/swell/data hashes to data/PINS.json (' + Object.keys(PINS.files).length + ' files)', () => checkPins(PINS.files, path.join(__dirname, 'data')));
red('RED: a texture one byte off its pin is refused', () => {
  const k = Object.keys(PINS.files).find((x) => x.endsWith('.png'));
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'swell-'));
  fs.mkdirSync(path.join(tmp, 'island'));
  const b = Buffer.from(fs.readFileSync(path.join(__dirname, 'data', k))); b[b.length - 1] ^= 1;
  fs.writeFileSync(path.join(tmp, k), b);
  assert.throws(() => checkPins({ [k]: PINS.files[k] }, tmp), /does not hash/);
});

/* ---- the beaches: one definition, all placed, the model's tables complete ---- */
ok('beaches: the 34 of scenario/beaches.json, in order, each placed; 16 directions x 4 periods of K at every probe', () => {
  assert.deepStrictEqual(B.beaches.map((b) => b.name), SCEN.beaches.map((b) => b.name));
  assert.strictEqual(B.dirs.length, 16); assert.deepStrictEqual(B.periods, [6, 9, 12, 15]);
  for (const b of B.beaches) {
    if (b.kind === 'lagoon') continue;
    assert.ok(b.probes.length >= 2, b.name + ' has probes');
    for (let k = 1; k < b.probes.length; k++) assert.ok(b.probes[k].h >= b.probes[k - 1].h, b.name + ' probes sorted by depth');
    assert.strictEqual(Object.keys(b.K).length, 64, b.name);
    for (const v of Object.values(b.K)) { assert.strictEqual(v.length, b.probes.length); v.forEach((x) => assert.ok(x >= 0 && x < 4, b.name + ' K in [0, 4)')); }
  }
});
ok('the port\'s fix, measured: every ocean beach has a probe at 8.8 m or deeper (frontier: 14 of 21 stopped at 4.5 m or less)', () => {
  const oc = B.beaches.filter((b) => b.kind === 'ocean');
  assert.strictEqual(oc.length, 21);
  for (const b of oc) assert.ok(b.probes[b.probes.length - 1].h >= 8.8, b.name + ' deepest ' + b.probes[b.probes.length - 1].h);
});

/* ---- the breaking height: continuous, non-decreasing in the sea's size, at every beach, for several seas ---- */
const SEAS = [[{ h: 1, p: 10, d: 135 }], [{ h: 1, p: 13, d: 180 }, { h: 0.6, p: 7, d: 90 }], [{ h: 0.5, p: 4, d: 45 }, { h: 1, p: 15, d: 157.5 }], [{ h: 1, p: 6, d: 22.5 }]];
function sweep(b, parts, fn) {
  fn = fn || S.breakHeight;
  const unit = S.probeEnergy(B, b, parts), tot = Math.sqrt(parts.reduce((s, P) => s + P.h * P.h, 0));
  let prev = null, jump = 0;
  for (let k = 1; k <= 1200; k++) {
    const H = k * 0.005;                       // 5 mm steps to 6 m
    const hb = fn(b, unit.map((x) => x * H / tot)).hb;
    if (prev != null && hb < prev - 1e-12) throw new Error('REFUSED: ' + b.name + ' Hb decreases at H = ' + H.toFixed(3));
    if (prev != null) jump = Math.max(jump, hb - prev);
    prev = hb;
  }
  return jump;
}
/* NOT continuous everywhere, and it need not be: where a deeper probe saturates before a shallower one (a bay whose
   outer probe sees the open sea), the breaking point jumps seaward and Hb jumps UP. What the band needs is monotone. */
let JUMPS = 0;
ok('breaking: non-decreasing in the sea\'s size at every beach (4 seas x 33 beaches x 1,200 steps of 5 mm) — the band maps exactly', () => {
  for (const b of B.beaches) if (b.kind !== 'lagoon') for (const parts of SEAS) { if (sweep(b, parts) > 0.05) JUMPS++; }
});
ok('breaking: the upward jumps are counted, not hidden (' + JUMPS + ' of 132 beach x sea sweeps jump > 5 cm in one 5 mm step)', () => { assert.ok(JUMPS < 132); });
red('RED: a wrong index (a saturated deepest probe read as the SHALLOWEST probe\'s depth) makes Hb fall, and the sweep catches it', () => {
  const bad = (b, H) => { const n = b.probes.length; return H[n - 1] >= S.C.GAMMA * b.probes[n - 1].h ? { hb: S.C.GAMMA * b.probes[0].h } : S.breakHeight(b, H); };
  assert.throws(() => { for (const parts of SEAS) sweep(byName('Joaquina'), parts, bad); }, /decreases/);
});
ok('breaking: on a planar beach (K = 1 everywhere) the waves break where H = 0.55 h, and a saturated deepest probe caps Hb at 0.55 x its depth', () => {
  const b = { kind: 'ocean', probes: [1, 2, 3, 4.5, 6.5, 8.8].map((h) => ({ h })) };
  assert.ok(Math.abs(S.breakHeight(b, b.probes.map(() => 2)).hb - 2) < 1e-12);          // 2 m: crossing at 3.636 m depth
  assert.ok(Math.abs(S.breakHeight(b, b.probes.map(() => 0.3)).hb - 0.3) < 1e-12);      // under 0.55 m: inner probe
  const cap = S.breakHeight(b, b.probes.map(() => 6));                                   // saturated at the deepest probe
  assert.ok(cap.capped && Math.abs(cap.hb - 0.55 * 8.8) < 1e-12);
});

/* ---- refusals ---- */
ok('refusal: Guarda do Embaú (0.57 km from the south edge) is refused, Pinheira (6.9 km) is not', () => {
  assert.ok(/^edge:S/.test(S.refused(byName('Guarda do Embaú'))));
  assert.strictEqual(S.refused(byName('Pinheira')), null);
  const w = S.wavesAt(B, byName('Guarda do Embaú'), { size: 1, lo: 0.8, hi: 1.3, parts: [{ h: 1, p: 10, d: 135 }] }, { U: 0, dir: 0 });
  assert.ok(w.refused);
});
red('RED: moved 4 km from an edge, a beach is refused', () => {
  const b = Object.assign({}, byName('Pinheira'), { edges: { N: 60, S: 4, W: null } });
  assert.ok(/^edge:S 4 km/.test(S.refused(b)));
});
ok('the lagoon: chop only, never a measured band, so its wave limit is SEM DADOS, never decided', () => {
  const lg = byName('Lagoa da Conceição');
  const w = S.wavesAt(B, lg, { size: 1, lo: 0.8, hi: 1.3, parts: [{ h: 1, p: 10, d: 135 }] }, { U: 8, dir: 0 });
  assert.ok(w.only === 'chop' && w.lo == null && w.c > 0);
  assert.strictEqual(S.decideLimit(S.RULES.sup.decided[0], null).letter, 'S');
});

/* ---- decisions over the band: decide.js, exact ---- */
ok('decisions: band over the limit -> VETADA with a witness; straddling -> INDEFINIDA with the flip gap; under -> LIBERADA', () => {
  const L = S.RULES.swim.decided[0];                                                // hb <= 1.40
  const v = S.decideLimit(L, { lo: 141, hi: 180 }); assert.strictEqual(v.letter, 'V'); assert.ok(v.witness);
  const i = S.decideLimit(L, { lo: 120, hi: 150 }); assert.strictEqual(i.letter, 'I'); assert.strictEqual(i.flip[0].gapDec, '0.10');
  assert.strictEqual(S.decideLimit(L, { lo: 100, hi: 140 }).letter, 'L');        // the limit itself is under (<=)
});
red('RED: a band one centimetre over the limit at its LOW edge is decided PERIGO, not left undecided', () => {
  assert.strictEqual(S.decideLimit(S.RULES.swim.decided[0], { lo: 141, hi: 141 }).letter, 'V');
});

/* ---- the rules: one table, its words printed from it ---- */
ok('rules: six activities, each with spots, a score, a pt and en text; every decided limit is a decimal the text names', () => {
  assert.deepStrictEqual(S.ACT_ORDER, ['surf', 'kite', 'sup', 'swim', 'fish', 'boat']);
  for (const a of S.ACT_ORDER) {
    const R = S.RULES[a];
    assert.ok(R.spots.length && typeof R.score === 'function' && R.text.pt && R.text.en);
    for (const L of R.decided) {
      assert.ok(/^\d+\.\d{2}$/.test(L.value), a + ' limit ' + L.value);
      const pt = L.value.replace(/0$/, '').replace('.', ','), en = L.value.replace(/0$/, '');
      assert.ok(R.text.pt.includes(pt + ' m'), a + ' pt text names ' + pt + ' m');
      assert.ok(R.text.en.includes(en + ' m'), a + ' en text names ' + en + ' m');
    }
  }
});

/* ---- the day: written bytes re-derive their digest; the modules the tab runs are the ones pinned ---- */
const DD = path.join(ROOT, 'site', 'swell', 'data', 'today.json');
if (fs.existsSync(DD)) {
  const day = JSON.parse(fs.readFileSync(DD, 'utf8'));
  ok('the day on disk (' + day.run + '): surf.js over its written bytes reproduces its digest, and its module pins are the files', () => {
    const all = S.computeAll(B, day);
    assert.strictEqual(sha(S.canon(all, day).join('\n')), day.digest);
    for (const m of Object.values(day.modules)) assert.strictEqual(sha(fs.readFileSync(path.join(ROOT, m.rel))), m.sha, m.rel);
  });
  red('RED: one breaking height changed by a centimetre changes the digest', () => {
    const all = S.computeAll(B, day);
    const k = all.beaches.findIndex((x) => x.rows[0].c.waves.c != null);
    all.beaches[k].rows[0].c.waves.c += 1;
    assert.notStrictEqual(sha(S.canon(all, day).join('\n')), day.digest);
  });
  red('RED: the open sea\'s band edited in the published day changes the decisions\' digest', () => {
    const d2 = JSON.parse(JSON.stringify(day));
    const i = d2.sea.findIndex((s) => s.lo != null); d2.sea[i].hi = d2.sea[i].hi + 1;
    assert.notStrictEqual(sha(S.canon(S.computeAll(B, d2), d2).join('\n')), day.digest);
  });
}

console.log('swell battery: ' + n + ' pass, 0 fail, ' + reds + '/' + reds + ' red controls fired');
