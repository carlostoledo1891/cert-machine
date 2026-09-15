/* instruments/breaking/lib.js — the exact reader for the breaking-wave table.

   corpus/blacksea-breaking/blacksea_data.csv holds one row per event; every
   numeric cell is the shortest decimal that round-trips to the double the
   record holds, and is read here as the rational those digits denote — the
   literal in the file is the number, never its float image. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Q = require(path.join(__dirname, '..', 'interval', 'rational.js'));

const ROOT = path.resolve(__dirname, '..', '..');
const CORPUS = path.join(ROOT, 'corpus', 'blacksea-breaking');

const DEC_RE = /^([+-]?)(\d+)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/;
function parseDecimal(s) {
  s = String(s).trim();
  const m = DEC_RE.exec(s);
  if (!m) throw new Error('not a decimal literal: "' + s + '"');
  const neg = m[1] === '-', frac = m[3] || '';
  let num = BigInt(m[2] + frac), k = BigInt(frac.length);
  if (m[4]) { const e = BigInt(m[4]); if (e >= 0n) num *= 10n ** e; else k += -e; }
  return Q.R(neg ? -num : num, 10n ** k);
}
const sha256 = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(CORPUS, rel))).digest('hex');

/* the table: numeric columns as exact rationals, Rec as a string, ev as an integer */
function readTable(rel) {
  const txt = fs.readFileSync(path.join(CORPUS, rel || 'blacksea_data.csv'), 'utf8');
  const lines = txt.split('\n').filter((l) => l.length);
  const cols = lines[0].split(',');
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',');
    if (cells.length !== cols.length) throw new Error('row ' + i + ' has ' + cells.length + ' cells');
    const row = {};
    for (let j = 0; j < cols.length; j++) {
      const c = cols[j], v = cells[j];
      if (c === 'Rec') row[c] = v;
      else if (c === 'ev') row[c] = Number(v);
      else row[c] = parseDecimal(v);
    }
    rows.push(row);
  }
  return { cols, rows, sha256: sha256(rel || 'blacksea_data.csv') };
}
/* a rational as a fixed decimal, truncated toward zero to d places */
function dec(q, d) {
  const neg = Q.sign(q) < 0; const a = Q.abs(q);
  const scale = 10n ** BigInt(d); const t = (a.n * scale) / a.d;
  const s = t.toString().padStart(d + 1, '0');
  return (neg ? '-' : '') + s.slice(0, -d) + (d ? '.' + s.slice(-d) : '');
}

module.exports = { ROOT, CORPUS, Q, parseDecimal, readTable, sha256, dec };
