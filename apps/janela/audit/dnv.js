/* dnv.js — DNV's alpha factor read from the one table file, exactly.
   apps/janela/audit · cert-machine

   alpha(table, designHs, TPOP) -> [num, den] or null
     table     '4-1' .. '4-5' (apps/janela/scenario/rules/dnv-alpha.json)
     designHs  metres, decimal string or [num, den]
     TPOP      hours; the row is the first 'TPOP <= x' that holds (rows are
               steps, DNV states no interpolation between them)
   Columns are interpolated linearly, as the standard says, in exact rationals.
   Below 1 m (Note 3: case by case) and beyond the table's last row: null —
   the caller must REFUSE, not extrapolate.

   MIT licensed. Part of cert-machine.                                    */
'use strict';

const path = require('path');
const Q = require('../../../instruments/window/q.js');
const J = require(path.join(__dirname, '..', 'scenario', 'rules', 'dnv-alpha.json'));

function alpha(table, designHs, TPOP) {
  const t = J.waveTables[table];
  if (!t) throw new Error('REFUSED: no DNV table ' + table);
  const rows = Object.keys(t.rows).map(Number).sort((a, b) => a - b);
  const row = rows.find((r) => TPOP <= r);
  if (row === undefined) return null;
  const ys = t.rows[String(row)].map((v) => Q.parse(String(v)));
  const xs = J.waveColumns.map((c) => Q.parse(String(c)));
  const h = Q.parse(designHs);
  if (Q.cmp(h, xs[0]) < 0) return null;
  if (Q.cmp(h, xs[xs.length - 1]) >= 0) return ys[ys.length - 1];
  for (let k = 0; k + 1 < xs.length; k++) {
    if (Q.cmp(xs[k], h) <= 0 && Q.cmp(h, xs[k + 1]) <= 0) {
      const w = Q.div(Q.sub(h, xs[k]), Q.sub(xs[k + 1], xs[k]));
      return Q.add(ys[k], Q.mul(Q.sub(ys[k + 1], ys[k]), w));
    }
  }
  return null;
}

module.exports = { alpha, TABLES: J };
