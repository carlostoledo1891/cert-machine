/* instruments/hseva/atlas-claims.js — the regional claims of Reis, Guimarães et
   al. (Ocean Engineering 2026, §3), read from its full text, as BOXES the
   return-level atlas decides. The one place they live: the atlas page states
   their verdicts and instruments/hseva/battery.js re-derives them.

   A claim is a region (a latitude/longitude box, or the global 4° lattice), the
   blocks it speaks of, and a rule over the atlas's certified cells there. Each
   cell counts for a family only where fit.js rankRule DECIDED that family; a
   cell whose choice is REFUSED counts for nobody and could count for anybody.
   So every claim gets one of three verdicts, and the counts behind it:
     HOLDS         true however the refused cells were to fall;
     DOES NOT HOLD false however they were to fall;
     UNDECIDED     the refused cells could make it either.
   Sea-ice cells (some steps missing) are not certified and are not counted.
   The atlas holds daily, weekly and monthly blocks; a claim about the
   unfiltered 3-hourly data is out of its reach and is not listed. */
'use strict';
const SIX = ['normal', 'lognormal', 'weibull', 'expweibull', 'gengamma', 'gumbel'];

const inBox = (c, b) => {
  if (c.lat < b.lat[0] || c.lat > b.lat[1]) return false;
  if (!b.lon) return true;
  return b.lon[0] <= b.lon[1] ? c.lon >= b.lon[0] && c.lon <= b.lon[1] : c.lon >= b.lon[0] || c.lon <= b.lon[1];   /* across the antimeridian */
};

const CLAIMS = [
  { id: 'weibull-rises', where: 'the global 4° lattice', box: { lat: [-90, 90] }, set: 'global4', blocks: ['daily', 'weekly', 'monthly'],
    quote: 'as the block size increased from daily to weekly and monthly, there was a marked reduction in the number of points classified as Exponentiated Weibull – the distribution that previously dominated – and a corresponding increase in the standard Weibull distribution',
    cite: '§3.1, Fig. 2', rule: 'the exponentiated Weibull decided at fewer cells, and the Weibull at more, at each step daily → weekly → monthly (Anderson–Darling)',
    decide: (S) => risesAndFalls(S, 'weibull', 'expweibull', ['daily', 'weekly', 'monthly']) },
  { id: 'gg-south-america-daily', where: 'south of South America (40–58° S, 80–56° W)', box: { lat: [-58, -40], lon: [-80, -56] }, set: 'global4', blocks: ['daily'],
    quote: 'In the daily block, … the Generalized Gamma gains prominence along the coastal region south of South America',
    cite: '§3.2', rule: 'the generalized gamma the most frequent decided choice in the box, daily maxima (Anderson–Darling)',
    decide: (S) => plurality(S, 'gengamma', 'daily') },
  { id: 'gg-expands-weekly', where: 'the Southern Ocean (40–65° S)', box: { lat: [-65, -40] }, set: 'global4', blocks: ['daily', 'weekly'],
    quote: 'In the weekly block, the distinction between the northern, central, and southern ACC sectors weakens substantially, with the Generalized Gamma expanding its spatial influence',
    cite: '§3.2', rule: 'the generalized gamma decided at more cells in the weekly block than in the daily (Anderson–Darling)',
    decide: (S) => monotone(S, 'gengamma', ['daily', 'weekly'], +1) },
  { id: 'ew-southern-ocean-monthly', where: 'the Southern Ocean (40–65° S)', box: { lat: [-65, -40] }, set: 'global4', blocks: ['monthly'],
    quote: 'By the monthly block, this diversity nearly disappears: the Exponentiated Weibull dominates most of the Southern Ocean, with only small residual areas of Gumbel',
    cite: '§3.2', rule: 'the exponentiated Weibull the decided choice at more than half the certified cells, monthly maxima (Anderson–Darling)',
    decide: (S) => majority(S, 'expweibull', 'monthly') },
  { id: 'monsoon-weibull', where: 'the monsoon Indian Ocean (0–25° N, 45–80° E)', box: { lat: [0, 25], lon: [45, 80] }, set: 'global4', blocks: ['daily', 'monthly'],
    quote: 'as the block size increases, a transition toward the standard Weibull distribution occurs',
    cite: '§3.2 (Indian Ocean)', rule: 'the Weibull decided at more cells in the monthly block than in the daily (Anderson–Darling)',
    decide: (S) => monotone(S, 'weibull', ['daily', 'monthly'], +1) },
  { id: 'japan-ew-monthly', where: 'the western Pacific south of Japan (24–36° N, 124–148° E)', box: { lat: [24, 36], lon: [124, 148] }, set: 'global4', blocks: ['weekly', 'monthly'],
    quote: 'in the monthly block, the Exponentiated Weibull again becomes dominant',
    cite: '§3.2 (western Pacific)', rule: 'the exponentiated Weibull the decided choice at more than half the certified cells, monthly maxima (Anderson–Darling)',
    decide: (S) => majority(S, 'expweibull', 'monthly') },
  { id: 'levels-fall-north-atlantic', where: 'the North Atlantic (40–64° N, 60° W–0°)', box: { lat: [40, 64], lon: [-60, 0] }, set: 'global4', blocks: ['daily', 'monthly'],
    quote: 'Across most mid- and high-latitude ocean basins, including the North Atlantic, North Pacific, and Arabian Sea, a systematic reduction in estimated Hs values is observed as the block size increases',
    cite: '§3.3', rule: 'at more than half the certified cells, the 100-year level of the monthly block\'s decided family lies wholly below the daily block\'s',
    decide: (S) => levelShift(S, 'l100', 'daily', 'monthly', -1) },
  { id: 'levels-fall-north-pacific', where: 'the North Pacific (40–60° N, 140° E–130° W)', box: { lat: [40, 60], lon: [140, -130] }, set: 'global4', blocks: ['daily', 'monthly'],
    quote: 'Across most mid- and high-latitude ocean basins, including the North Atlantic, North Pacific, and Arabian Sea, a systematic reduction in estimated Hs values is observed as the block size increases',
    cite: '§3.3', rule: 'at more than half the certified cells, the 100-year level of the monthly block\'s decided family lies wholly below the daily block\'s',
    decide: (S) => levelShift(S, 'l100', 'daily', 'monthly', -1) },
  { id: 'levels-fall-arabian-sea', where: 'the Arabian Sea (5–25° N, 50–75° E)', box: { lat: [5, 25], lon: [50, 75] }, set: 'global4', blocks: ['daily', 'monthly'],
    quote: 'The Arabian Sea displays a marked reduction in projected extremes as block size increases',
    cite: '§3.3', rule: 'at more than half the certified cells, the 100-year level of the monthly block\'s decided family lies wholly below the daily block\'s',
    decide: (S) => levelShift(S, 'l100', 'daily', 'monthly', -1) },
  { id: 'levels-rise-japan', where: 'the western Pacific south of Japan (24–36° N, 124–148° E)', box: { lat: [24, 36], lon: [124, 148] }, set: 'global4', blocks: ['daily', 'monthly'],
    quote: 'In the western Pacific south of Japan, return levels increase for longer block sizes, particularly for the 1000-year period',
    cite: '§3.3', rule: 'at more than half the certified cells, the 1000-year level of the monthly block\'s decided family lies wholly above the daily block\'s',
    decide: (S) => levelShift(S, 'l1000', 'daily', 'monthly', +1) },
];

/* S: { cells: [{ blocks: { <blk>: { rank: { ad }, fits } } }] } restricted to the claim's region */
function counts(S, blk) {
  const by = {}; let refused = 0;
  for (const c of S.cells) { const r = c.blocks[blk].rank.ad; if (r === 'R') refused++; else by[r] = (by[r] || 0) + 1; }
  return { by, refused, n: S.cells.length };
}
const V = { H: 'HOLDS', F: 'DOES NOT HOLD', U: 'UNDECIDED' };
/* The refused cells of different blocks fall independently (a cell's family at one block does not fix it at
   another), and within a block each could be any family. So a claim HOLDS when it holds in its worst case at every
   step, and DOES NOT HOLD only when no assignment at all makes it true — decided jointly over every block, never step
   by step (1 < c < 2 has no whole number in it). instruments/hseva/battery.js checks both against brute force. */
function monotone(S, fam, blocks, dir) {
  const cs = blocks.map((b) => counts(S, b)), m = blocks.length;
  const lo = cs.map((c) => c.by[fam] || 0), hi = cs.map((c, k) => lo[k] + c.refused);
  const holds = blocks.every((b, k) => k === 0 || (dir > 0 ? lo[k] > hi[k - 1] : hi[k] < lo[k - 1]));
  /* possible: the least count at each step that keeps the chain strict, from the end the chain rises away from */
  let possible = true;
  if (dir > 0) { let c = lo[0]; for (let k = 1; k < m && possible; k++) { c = Math.max(lo[k], c + 1); if (c > hi[k]) possible = false; } }
  else { let c = lo[m - 1]; for (let k = m - 2; k >= 0 && possible; k--) { c = Math.max(lo[k], c + 1); if (c > hi[k]) possible = false; } }
  return { verdict: holds ? V.H : possible ? V.U : V.F, counts: cs.map((c, k) => ({ block: blocks[k], family: fam, decided: lo[k], refused: c.refused, n: c.n })) };
}
/* `up` decided at strictly more cells at each step and `down` at strictly fewer, the two sharing each block's refused
   cells. Possible: from the last block back, `down` as few as the chain allows and `up` as many as the refused cells
   left over allow — each choice the best the earlier blocks could ask of it, so the greedy is exact. */
function risesAndFalls(S, up, down, blocks) {
  const cs = blocks.map((b) => counts(S, b)), m = blocks.length;
  const lU = cs.map((c) => c.by[up] || 0), lD = cs.map((c) => c.by[down] || 0), r = cs.map((c) => c.refused);
  const holds = blocks.every((b, k) => k === 0 || (lU[k] > lU[k - 1] + r[k - 1] && lD[k] + r[k] < lD[k - 1]));
  let possible = true, u = lU[m - 1] + r[m - 1], d = lD[m - 1];
  for (let k = m - 2; k >= 0 && possible; k--) {
    const dk = Math.max(lD[k], d + 1);
    const uk = Math.min(lU[k] + r[k] - (dk - lD[k]), u - 1);
    if (dk > lD[k] + r[k] || uk < lU[k]) possible = false;
    d = dk; u = uk;
  }
  const row = (fam, l) => cs.map((c, k) => ({ block: blocks[k], family: fam, decided: l[k], refused: c.refused, n: c.n }));
  return { verdict: holds ? V.H : possible ? V.U : V.F, counts: row(down, lD).concat(row(up, lU)) };
}
function majority(S, fam, blk) {
  const c = counts(S, blk), lo = c.by[fam] || 0, hi = lo + c.refused;
  return { verdict: lo > c.n / 2 ? V.H : hi <= c.n / 2 ? V.F : V.U, counts: [{ block: blk, decided: lo, refused: c.refused, n: c.n, by: c.by }] };
}
function plurality(S, fam, blk) {
  const c = counts(S, blk), lo = c.by[fam] || 0, hi = lo + c.refused;
  const others = SIX.filter((f) => f !== fam);                    /* a family decided nowhere could still take every refused cell */
  const holds = others.every((f) => lo > (c.by[f] || 0) + c.refused);
  const fails = others.some((f) => (c.by[f] || 0) >= hi);
  return { verdict: holds ? V.H : fails ? V.F : V.U, counts: [{ block: blk, decided: lo, refused: c.refused, n: c.n, by: c.by }] };
}
/* the decided family's level at block b against block a, per cell: lower, higher, or not decided. A level whose
   enclosure is missing or has an end that is not a finite number (JSON writes ±∞ as null) is not decided. */
const finite2 = (q) => Array.isArray(q) && q.length === 2 && q.every((x) => typeof x === 'number' && Number.isFinite(x));
function levelShift(S, lv, a, b, dir) {
  let yes = 0, no = 0, open = 0;
  for (const c of S.cells) {
    const A = c.blocks[a], B = c.blocks[b];
    const fa = A.rank.ad, fb = B.rank.ad;
    const la = fa !== 'R' && finite2(A.fits[fa][lv]) ? A.fits[fa][lv] : null, lb = fb !== 'R' && finite2(B.fits[fb][lv]) ? B.fits[fb][lv] : null;
    if (!la || !lb) { open++; continue; }
    if (dir < 0 ? lb[1] < la[0] : lb[0] > la[1]) yes++;
    else if (dir < 0 ? lb[0] >= la[1] : lb[1] <= la[0]) no++;
    else open++;                                          /* the two enclosures overlap: not ordered */
  }
  const n = S.cells.length;
  return { verdict: yes > n / 2 ? V.H : yes + open <= n / 2 ? V.F : V.U, counts: [{ block: a + ' → ' + b, relation: dir < 0 ? 'lower' : 'higher', level: lv, decided: yes, against: no, refused: open, n }] };
}

/* cells: the atlas ledger's cells joined with the corpus's lat, lon, sets */
function evaluate(cells) {
  return CLAIMS.map((K) => {
    const S = { cells: cells.filter((c) => c.sets.includes(K.set) && inBox(c, K.box)) };
    const r = S.cells.length ? K.decide(S) : { verdict: V.U, counts: [] };
    return Object.assign({ id: K.id, where: K.where, quote: K.quote, cite: K.cite, rule: K.rule, blocks: K.blocks, box: K.box, cells: S.cells.length }, r);
  });
}

if (typeof module !== 'undefined') module.exports = { CLAIMS, evaluate, inBox, VERDICTS: V, rules: { counts, monotone, risesAndFalls, majority, plurality, levelShift } };
