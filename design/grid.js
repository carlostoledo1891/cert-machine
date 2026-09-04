/* grid.js — THE balanced grid, once.
   design/ · cert-machine

   Given n items, lay them out in rows that are as equal as possible, and emit
   the CSS that does it. Four per row at most; 7 becomes 4+3 rather than 3+3+1;
   the column count is the LCM of the row sizes so every row can span cleanly
   inside one grid.

   WHY IT IS A MODULE. It was written for the report pages' `.stats` strip and
   lived inside design/template.js, where the /instruments legend could not
   reach it — so that legend declared its column count by hand, on four pages,
   as 3, 3, 3 and 4, while holding 3, 3, 4, 5 and 7 items. Plates laid seven out
   as 3+3+1. Phase 2 tried to fix it with `auto-fit` and the layout ruler
   REFUSED the change: auto-fit gave seven items five columns (5+2), four more
   distinct left edges than the ragged layout it replaced. The count has to be
   derived from n, not from the available width, and that arithmetic already
   existed one directory away.

   The consumer marks the container with data-n and the rules do the rest, so
   a component cannot disagree with its own item count:

     <div class="stats" data-n="7"> … seven cells …
     balancedGrid('.stats', '.stat')   ->   the rules for n = 1..12

   design/battery.js refuses any built page whose data-n does not match the
   number of children actually emitted.                                       */
'use strict';

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const lcm = (a, b) => a * b / gcd(a, b);

/* the row split for n items: ceil(n/perRow) rows, sizes as equal as possible,
   the larger rows first. Exported because the battery re-derives it rather
   than trusting the CSS. */
function rows(n, perRow) {
  const k = Math.ceil(n / (perRow || 4));
  const base = Math.floor(n / k), extra = n - base * k;
  const out = [];
  for (let r = 0; r < k; r++) out.push(r < extra ? base + 1 : base);
  return out;
}

/* `sel` is the container's selector, `child` the item's. Emits one
   grid-template-columns rule and one span rule per run of equal-size rows. */
function balancedGrid(sel, child, { max = 12, perRow = 4 } = {}) {
  const out = [];
  for (let n = 1; n <= max; n++) {
    const rs = rows(n, perRow);
    const B = rs.reduce((a, s) => lcm(a, s), 1);
    out.push(`${sel}[data-n="${n}"]{grid-template-columns:repeat(${B},minmax(0,1fr))}`);
    /* an explicit span per run of equal-size rows — always emitted, so these
       (0,4,0)-specificity rules beat any mobile odd-last guard at desktop */
    let idx = 1;
    for (let r = 0; r < rs.length;) {
      let r2 = r;
      while (r2 + 1 < rs.length && rs[r2 + 1] === rs[r]) r2++;
      const from = idx, count = rs.slice(r, r2 + 1).reduce((a, s) => a + s, 0);
      const span = B / rs[r];
      out.push(`${sel}[data-n="${n}"] ${child}:nth-child(n+${from}):nth-child(-n+${from + count - 1}){grid-column:span ${span}}`);
      idx += count; r = r2 + 1;
    }
  }
  return out.join('\n');
}

module.exports = { balancedGrid, rows };
