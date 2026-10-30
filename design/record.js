/* record.js — a printed number is READ from a record through a pointer, and printed by one rule.
   design/ · cert-machine · 2026-10-29 (D10)

   WHY. WARRANT rule 8 says every number on a page comes from a record and is gated by its builder. Until today that
   was true per builder, by hand: `W.value(text, standing, { title })` took a string the author had already formatted
   from a value the author had already read, and no gate could tell which record cell a printed "22,560" came from.
   Here the page carries the address. `W.val({ rec: { path, ptr }, standing, fmt })` reads the datum THROUGH THIS FILE,
   prints it by one of the formats below, and writes the address and the format into the span (data-rec, data-fmt);
   tools/check-marks.js reads the built page, follows every address back into the record, prints the datum again by
   the same rule, and refuses a page whose text differs. The record is the source; the page is its projection; the
   gate decides the projection is sound.

   THE POINTER is RFC 6901 (`/rows/3/ms`) with one addition: `/rows[id=ea-604]/ms` selects the element of an array
   whose field equals the value, so a row keeps its address when the array is reordered.

   THE FORMATS (data-fmt):
     raw        the datum as a string, byte for byte (a word, an id, a decimal string as the record holds it)
     int        an integer with thousands separators (refused unless the datum is an integer)
     fixed:n    a float to n decimals, NEAREST — allowed for a COMPUTED or CHOSEN value (a float printed as a float);
                refused for a DECIDED value whose exact decimal has more than n decimals (a decided value cut short
                is a bound, and a bound carries an end: use lo:n or hi:n)
     sig:n      n significant digits, nearest; the same rule as fixed:n
     lo:n       a LOWER end to n decimals, rounded toward −∞ (design/outward.js)
     hi:n       an UPPER end to n decimals, rounded toward +∞
   A prefix or a unit goes OUTSIDE the span; the span's text is exactly the printed datum.                      MIT */
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OUT = require('./outward.js');

const cache = new Map();
function load(file) {
  const abs = path.isAbsolute(file) ? file : path.join(ROOT, file);
  if (!cache.has(abs)) {
    if (!fs.existsSync(abs)) throw new Error('record: no file ' + file);
    cache.set(abs, JSON.parse(fs.readFileSync(abs, 'utf8')));
  }
  return cache.get(abs);
}

/* '/a/b[id=x]/c' → the value; throws when a step does not resolve */
function resolve(root, ptr) {
  if (typeof ptr !== 'string' || !ptr.startsWith('/')) throw new Error('record: a pointer starts with /: ' + ptr);
  let cur = root;
  const steps = ptr.slice(1).split('/').map((s) => s.replace(/~1/g, '/').replace(/~0/g, '~'));
  for (const step of steps) {
    if (step === '' && steps.length === 1) return cur;
    const sel = /^([^[\]]*)\[([^=\]]+)=([^\]]*)\]$/.exec(step);
    if (sel) {
      const arr = sel[1] === '' ? cur : cur[sel[1]];
      if (!Array.isArray(arr)) throw new Error('record: ' + ptr + ': ' + (sel[1] || '(here)') + ' is not an array');
      const hit = arr.filter((e) => e && String(e[sel[2]]) === sel[3]);
      if (hit.length !== 1) throw new Error('record: ' + ptr + ': [' + sel[2] + '=' + sel[3] + '] matches ' + hit.length + ' elements');
      cur = hit[0];
      continue;
    }
    if (cur === null || typeof cur !== 'object') throw new Error('record: ' + ptr + ': cannot step into ' + step);
    if (Array.isArray(cur)) {
      if (!/^\d+$/.test(step) || Number(step) >= cur.length) throw new Error('record: ' + ptr + ': index ' + step + ' out of range');
      cur = cur[Number(step)];
    } else {
      if (!Object.prototype.hasOwnProperty.call(cur, step)) throw new Error('record: ' + ptr + ': no field ' + step);
      cur = cur[step];
    }
  }
  return cur;
}

function read(file, ptr) { return resolve(load(file), ptr); }

/* the exact decimal digits after the point of a finite number or decimal string */
function decimalsOf(x) { const e = OUT.exact(x); const i = e.indexOf('.'); return i < 0 ? 0 : e.length - i - 1; }

const FMT = /^(raw|int|fixed:\d+|sig:\d+|lo:\d+|hi:\d+)$/;
/* print a datum by a format; `standing` is the word (decided · computed · chosen · refused) for the nearest rule */
function print(datum, fmt, standing) {
  if (!FMT.test(String(fmt))) throw new Error('record: not a format: ' + fmt);
  const [kind, nStr] = String(fmt).split(':'), n = Number(nStr);
  if (kind === 'raw') {
    if (datum === null || datum === undefined || typeof datum === 'object') throw new Error('record: raw needs a scalar');
    return String(datum);
  }
  const num = typeof datum === 'string' && /^-?\d+(\.\d+)?$/.test(datum.trim()) ? datum.trim() : datum;
  if (typeof num !== 'number' && typeof num !== 'string') throw new Error('record: ' + fmt + ' needs a number, got ' + typeof datum);
  if (kind === 'int') {
    const e = OUT.exact(num);
    if (e.includes('.')) throw new Error('record: int printed from a non-integer ' + e);
    return BigInt(e).toLocaleString('en-US');
  }
  if (kind === 'lo') return OUT.fixed(num, n, false);
  if (kind === 'hi') return OUT.fixed(num, n, true);
  /* fixed:n and sig:n — NEAREST, a float printed as a float; a decided value cut short is a bound and is refused */
  if (standing === 'decided') {
    const d = decimalsOf(num);
    if (kind === 'fixed' && d > n) throw new Error('record: a DECIDED value with ' + d + ' decimals printed to nearest at ' + n + ' — a bound: use lo:' + n + ' or hi:' + n);
    if (kind === 'sig') {
      const digits = OUT.exact(num).replace(/^-/, '').replace('.', '').replace(/^0+/, '').replace(/0+$/, '').length;
      if (digits > n) throw new Error('record: a DECIDED value with ' + digits + ' significant digits printed to nearest at ' + n + ' — a bound');
    }
  }
  const v = Number(num);
  if (!Number.isFinite(v)) throw new Error('record: not finite: ' + num);
  return kind === 'fixed' ? v.toFixed(n) : v.toPrecision(n);
}

/* a map key as one pointer step (RFC 6901: ~ → ~0, / → ~1) */
const key = (s) => String(s).replace(/~/g, '~0').replace(/\//g, '~1');

module.exports = { resolve, read, print, load, key, FMT, ROOT };
