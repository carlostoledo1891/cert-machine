/* instruments/hseva/blockrule.js — THE block rule, the one place it lives: what
   a day, an ISO week, a month and a year are for a UTC timestamp, and a block
   maximum as the largest value in its block. No requires, so the same bytes run
   in Node (blocks.js, the ledger) and in the tab (/instruments/return-levels):
   a rule defined twice would drift. Timestamps are 'YYYY-MM-DD…' strings. */
'use strict';

/* ISO 8601 week of a 'YYYY-MM-DD…' timestamp: the Thursday of its week names the year */
function isoWeek(t) {
  const d = new Date(Date.UTC(Number(t.slice(0, 4)), Number(t.slice(5, 7)) - 1, Number(t.slice(8, 10))));
  const dow = (d.getUTCDay() + 6) % 7;                 /* Monday 0 … Sunday 6 */
  d.setUTCDate(d.getUTCDate() - dow + 3);              /* that week's Thursday */
  const y = d.getUTCFullYear(), jan4 = new Date(Date.UTC(y, 0, 4));
  const w = 1 + Math.round(((d - jan4) / 86400000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
  return y + '-W' + String(w).padStart(2, '0');
}
const BLOCKS = {
  native: { hours: null, key: null },
  daily: { hours: 24, key: (t) => t.slice(0, 10) },
  weekly: { hours: 168, key: isoWeek },
  monthly: { hours: 730.5, key: (t) => t.slice(0, 7) },
  annual: { hours: 8766, key: (t) => t.slice(0, 4) },
};
/* S = { n, t: timestamps, h: values, step: native hours } */
function blockMaxima(S, block) {
  const B = BLOCKS[block]; if (!B) throw new Error('unknown block ' + block);
  if (block === 'native') return { block, hours: S.step, n: S.n, x: S.h, keys: null };
  const m = new Map();
  for (let i = 0; i < S.n; i++) { const k = B.key(S.t[i]); const v = S.h[i]; if (!m.has(k) || v > m.get(k)) m.set(k, v); }
  const keys = [...m.keys()].sort();
  return { block, hours: B.hours, n: keys.length, x: keys.map((k) => m.get(k)), keys };
}

if (typeof module !== 'undefined') module.exports = { BLOCKS, blockMaxima, isoWeek };
