/* re-decide the atlas's ten claims from the page's compact atlas.json, then under every nearby reading of each box */
const AC = require('/Users/carlostoledo/Projects/cert-machine/instruments/hseva/atlas-claims.js');
const A = require('/Users/carlostoledo/Projects/cert-machine/site/instruments/return-level-atlas/atlas.json');
const BLK = A.blocks || ['daily', 'weekly', 'monthly'], FAM = A.fam;
const cells = A.cells.filter(r => r[4] !== 1).map(r => {
  const blocks = {};
  BLK.forEach((b, k) => { const q = r[9 + k], fam = q[0] === 6 ? 'R' : FAM[q[0]]; const fits = {}; if (fam !== 'R') fits[fam] = { l100: [q[7], q[8]], l1000: [q[9], q[10]] }; blocks[b] = { rank: { ad: fam }, fits }; });
  return { id: r[0], lat: r[1], lon: r[2], sets: (r[3] & 1 ? ['global4'] : []), blocks };
});
const ev = (K, box) => { const S = { cells: cells.filter(c => c.sets.includes(K.set) && AC.inBox(c, box)) }; return S.cells.length ? Object.assign({ n: S.cells.length }, K.decide(S)) : { verdict: 'UNDECIDED', n: 0 }; };
let same = 0;
for (const K of AC.CLAIMS) {
  const rec = A.claims.find(c => c.id === K.id), mine = ev(K, K.box);
  const ok = rec.verdict === mine.verdict && JSON.stringify(rec.counts) === JSON.stringify(mine.counts) && rec.cells === mine.n;
  if (ok) same++; else console.log('MISMATCH', K.id, rec.verdict, mine.verdict, JSON.stringify(rec.counts).slice(0, 200), JSON.stringify(mine.counts).slice(0, 200));
  /* nearby readings: each edge moved one 4° cell in or out */
  const B = K.box, reads = [];
  const edges = B.lon ? [['lat', 0], ['lat', 1], ['lon', 0], ['lon', 1]] : B.lat[0] > -90 ? [['lat', 0], ['lat', 1]] : [];
  for (const [ax, i] of edges) for (const d of [-4, 4]) {
    const nb = JSON.parse(JSON.stringify(B)); nb[ax][i] += d;
    if (nb.lat[0] >= nb.lat[1]) continue;
    const r = ev(K, nb); reads.push({ edge: ax + i, d, verdict: r.verdict, n: r.n });
  }
  const tally = {}; reads.forEach(r => tally[r.verdict] = (tally[r.verdict] || 0) + 1);
  console.log(K.id.padEnd(28), mine.verdict.padEnd(14), 'n', mine.n, ' readings:', JSON.stringify(tally), reads.filter(r => r.verdict !== mine.verdict).map(r => r.edge + (r.d > 0 ? '+' : '') + r.d + '→' + r.verdict).join(' '));
}
console.log('reproduced', same, 'of', AC.CLAIMS.length);
