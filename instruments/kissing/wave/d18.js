/* instruments/kissing/wave/d18.js — Kravatsky's K(18) >= 8358, rebuilt from the pinned bytes.

   Source: github.com/alexlegeartis/KissingNumbers @ 86b7de1,
   verifications/improved/dim18-bent-hexagon — three JSON files (octads, three families of
   sixteen 6-sets, 960 sixteen-bit words) and the README's construction table. Their verify18.py
   is not read for the construction and never run; the table below is the README's, the bit
   order is the one tierB.json states about itself ("bit 15-i is coordinate i").

   The README's table, in norm-8 units, a point being (v, p), v in R^16, p in R^2, |v|^2+|p|^2 = 8:
       equator  |p|^2 = 0    v = (+-2, +-2, 0^14), and +-1 on each octad, odd number of minus signs
       tiers    |p|^2 = 2    p at 60k degrees; v = +-1 on a 6-set of family (k mod 3), odd minus count
       poles    |p|^2 = 8    p at 60k degrees; v = 0
       tier B   |p|^2 = 8/9  p at 30 + 60k degrees; v = (2/3)(-1)^c, c one of 160 words per angle
   Scaled by 6 every coordinate is an integer combination of 1, sqrt2, sqrt6: the R^16 part is an
   integer vector, and with p = r sqrt2 (cos t, sin t), r in {6 (tier), 12 (pole), 4 (tier B)},
   2 cos(30 m degrees) = alpha + beta sqrt3 gives r sqrt2 cos t = (r/2)(alpha sqrt2 + beta sqrt6).
   Every vector then has norm exactly 288 = 6^2 * 8, and compatibility is <x, y> <= 144. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const BS = require('../basis.js');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const PKG = 'verifications/improved/dim18-bent-hexagon/';
const META = path.join(ROOT, 'corpus', 'kissing', 'wave.meta.json');

/* 2 cos(30 m degrees) as [alpha, beta] meaning alpha + beta sqrt3 */
const TWO_COS = [[2, 0], [0, 1], [1, 0], [0, 0], [-1, 0], [0, -1], [-2, 0], [0, -1], [-1, 0], [0, 0], [1, 0], [0, 1]];
const twoCos = (m) => TWO_COS[((m % 12) + 12) % 12];

/* read a pinned file, refusing drift from the manifest */
function pinned(rel) {
  const meta = JSON.parse(fs.readFileSync(META, 'utf8'));
  const f = meta.sources.kravatsky.files[rel];
  if (!f) throw new Error('not pinned: ' + rel);
  const raw = fs.readFileSync(path.join(ROOT, 'corpus', 'kissing', 'wave', 'kravatsky', rel));
  const sha = crypto.createHash('sha256').update(raw).digest('hex');
  if (sha !== f.sha256) throw new Error('drift: ' + rel + ' hashes to ' + sha + ', pinned ' + f.sha256);
  return { raw, sha };
}

/* point(v16, r, m): v16 the 16 integer coordinates (already scaled by 6), p = r sqrt2 at angle 30m */
function point(v16, r, m) {
  const c1 = v16.concat([0, 0]), c2 = new Array(18).fill(0), c3 = new Array(18).fill(0), c6 = new Array(18).fill(0);
  if (r) {
    if (r % 2) throw new Error('odd radius coefficient');
    const [ca, cb] = twoCos(m), [sa, sb] = twoCos(m - 3); /* sin t = cos(t - 90) */
    c2[16] = (r / 2) * ca; c6[16] = (r / 2) * cb;
    c2[17] = (r / 2) * sa; c6[17] = (r / 2) * sb;
  }
  return BS.vec(c1, c2, c3, c6);
}

/* odd-sign patterns on a support S with magnitude mag: every sign vector with an odd number of minus signs */
function oddSigned(S, mag) {
  const out = [];
  for (let bits = 0; bits < (1 << S.length); bits++) {
    let minus = 0; for (let t = 0; t < S.length; t++) if (bits >> t & 1) minus++;
    if (minus % 2 === 0) continue;
    const v = new Array(16).fill(0);
    S.forEach((i, t) => { v[i] = (bits >> t & 1) ? -mag : mag; });
    out.push(v);
  }
  return out;
}

function build() {
  const oct = pinned(PKG + 'data/octads.json'), fam = pinned(PKG + 'data/families.json'), tb = pinned(PKG + 'data/tierB.json');
  const octads = JSON.parse(oct.raw.toString('utf8')).octads;
  const F = JSON.parse(fam.raw.toString('utf8'));
  const families = F.families_at_angles_0_60_120;
  const T = JSON.parse(tb.raw.toString('utf8'));
  /* the bytes are what the README says they are — checked, not assumed */
  const facts = [];
  const fact = (cond, what) => { if (!cond) throw new Error('d18 bytes: ' + what); facts.push(what); };
  fact(octads.length === 30 && octads.every((o) => o.length === 8 && new Set(o).size === 8 && o.every((i) => i >= 0 && i < 16)), '30 octads of 8 distinct coordinates in 0..15');
  fact(families.length === 3 && families.every((f) => f.length === 16 && f.every((S) => S.length === 6 && new Set(S).size === 6)), 'three families of sixteen 6-sets');
  fact(F.pattern_parity === 'odd', 'families.json declares odd sign patterns');
  fact(T.radius_squared_norm8_units === '8/9', 'tierB.json declares |p|^2 = 8/9');
  fact(/bit 15-i is coordinate i/.test(T.encoding) && /\(2\/3\)\(-1\)\^bit/.test(T.encoding), 'tierB.json declares its bit order: bit 15-i is coordinate i, v_i = (2/3)(-1)^bit');
  const slots = T.slots_deg_to_words;
  fact(JSON.stringify(Object.keys(slots).map(Number).sort((a, b) => a - b)) === '[30,90,150,210,270,330]', 'tier-B slots at 30, 90, ..., 330 degrees');
  fact(Object.values(slots).every((w) => w.length === 160 && w.every((x) => Number.isInteger(x) && x >= 0 && x < 65536)), '160 sixteen-bit words per slot');

  const V = [], kind = [];
  const add = (v, k) => { V.push(v); kind.push(k); };
  for (let i = 0; i < 16; i++) for (let j = i + 1; j < 16; j++) for (const si of [12, -12]) for (const sj of [12, -12]) {
    const v = new Array(16).fill(0); v[i] = si; v[j] = sj; add(point(v, 0, 0), 'equator (+-2,+-2,0^14)');
  }
  for (const o of octads) for (const v of oddSigned(o, 6)) add(point(v, 0, 0), 'equator octad');
  for (let k = 0; k < 6; k++) for (const S of families[k % 3]) for (const v of oddSigned(S, 6)) add(point(v, 6, 2 * k), 'tier');
  for (let k = 0; k < 6; k++) add(point(new Array(16).fill(0), 12, 2 * k), 'pole');
  for (const deg of Object.keys(slots).map(Number).sort((a, b) => a - b)) {
    for (const w of slots[String(deg)]) {
      const v = []; for (let i = 0; i < 16; i++) v.push((w >> (15 - i)) & 1 ? -4 : 4);
      add(point(v, 4, deg / 30), 'tier B');
    }
  }
  const counts = {}; for (const k of kind) counts[k] = (counts[k] || 0) + 1;
  return { vectors: V, kind, counts, facts, pins: { octads: oct.sha, families: fam.sha, tierB: tb.sha } };
}

module.exports = { build, point, twoCos, oddSigned, PKG };

if (require.main === module) {
  const b = build();
  console.log('built', b.vectors.length, JSON.stringify(b.counts));
  const r = BS.certify(b.vectors, { histogram: true });
  console.log(JSON.stringify(Object.assign({}, r, { histogram: r.histogram && r.histogram.slice(0, 40) }), null, 1));
}
