/* fits.js — just enough FITS to read a Kepler light curve, and nothing more.
 *
 * A Kepler light-curve file is a primary HDU with no data followed by a
 * BINTABLE extension. Everything here is the format's own arithmetic: 2880-byte
 * blocks, 80-character header cards, big-endian rows of TFORM-typed fields.
 *
 * This is a DATA LAYER, not a scientific quantity — it moves bytes and never
 * decides anything. Its correctness is checked the only way a reader can be:
 * the header's own NAXIS2 must equal the rows produced, TIME must come out
 * monotone, and the extracted depth must agree with the published one. Those
 * checks live in fits.test.js.
 */
'use strict';

const CARD = 80, BLOCK = 2880;

function parseHeader(buf, off) {
  const h = {}; const order = [];
  for (;;) {
    if (off + BLOCK > buf.length) throw new Error('FITS: header runs past end of file');
    for (let i = 0; i < BLOCK; i += CARD) {
      const card = buf.toString('ascii', off + i, off + i + CARD);
      const key = card.slice(0, 8).trim();
      if (key === 'END') return { h, order, next: off + BLOCK };
      if (!key || card[8] !== '=') continue;
      let v = card.slice(9, 80);
      const slash = (() => {                    /* a / inside a quoted string is not a comment */
        let q = false;
        for (let j = 0; j < v.length; j++) {
          if (v[j] === "'") q = !q;
          else if (v[j] === '/' && !q) return j;
        }
        return -1;
      })();
      if (slash >= 0) v = v.slice(0, slash);
      v = v.trim();
      if (v.startsWith("'")) v = v.slice(1, v.lastIndexOf("'")).trim();
      else if (v === 'T') v = true;
      else if (v === 'F') v = false;
      else if (v !== '' && Number.isFinite(Number(v))) v = Number(v);
      if (!(key in h)) order.push(key);
      h[key] = v;
    }
    off += BLOCK;
  }
}

/* TFORM -> {code, count, bytes}. Only the codes Kepler actually uses. */
const WIDTH = { L: 1, B: 1, I: 2, J: 4, K: 8, A: 1, E: 4, D: 8 };
function parseForm(tform) {
  const m = /^\s*(\d*)([LBIJKAED])/.exec(String(tform));
  if (!m) throw new Error(`FITS: unsupported TFORM ${tform}`);
  const count = m[1] === '' ? 1 : Number(m[1]);
  return { code: m[2], count, bytes: count * WIDTH[m[2]] };
}

function readField(buf, at, f) {
  switch (f.code) {
    case 'D': return buf.readDoubleBE(at);
    case 'E': return buf.readFloatBE(at);
    case 'J': return buf.readInt32BE(at);
    case 'I': return buf.readInt16BE(at);
    case 'K': return Number(buf.readBigInt64BE(at));
    case 'B': return buf.readUInt8(at);
    case 'L': return buf.toString('ascii', at, at + 1) === 'T';
    case 'A': return buf.toString('ascii', at, at + f.bytes).trim();
    default: throw new Error(`FITS: unsupported code ${f.code}`);
  }
}

/* Read the first BINTABLE in the file, returning only the named columns. */
function readTable(buf, want) {
  let off = 0;
  const primary = parseHeader(buf, 0);
  off = primary.next;
  if (primary.h.NAXIS > 0) {                    /* skip primary data if any */
    let n = Math.abs(primary.h.BITPIX) / 8;
    for (let i = 1; i <= primary.h.NAXIS; i++) n *= primary.h['NAXIS' + i];
    off += Math.ceil(n / BLOCK) * BLOCK;
  }
  const ext = parseHeader(buf, off);
  const H = ext.h;
  if (H.XTENSION !== 'BINTABLE') throw new Error(`FITS: expected BINTABLE, got ${H.XTENSION}`);
  const rowBytes = H.NAXIS1, nrows = H.NAXIS2, nf = H.TFIELDS;

  const fields = [];
  let at = 0;
  for (let i = 1; i <= nf; i++) {
    const f = parseForm(H['TFORM' + i]);
    f.name = String(H['TTYPE' + i] || '').trim();
    f.at = at;
    /* TSCAL/TZERO would silently corrupt values if present and ignored. */
    if (H['TSCAL' + i] !== undefined && H['TSCAL' + i] !== 1) throw new Error(`FITS: TSCAL on ${f.name}`);
    if (H['TZERO' + i] !== undefined && H['TZERO' + i] !== 0) throw new Error(`FITS: TZERO on ${f.name}`);
    at += f.bytes;
    fields.push(f);
  }
  if (at !== rowBytes) throw new Error(`FITS: row width ${at} != NAXIS1 ${rowBytes}`);

  const cols = {};
  const picked = fields.filter(f => !want || want.includes(f.name));
  for (const f of picked) cols[f.name] = new Array(nrows);
  const data = ext.next;
  for (let r = 0; r < nrows; r++) {
    const base = data + r * rowBytes;
    for (const f of picked) cols[f.name][r] = readField(buf, base + f.at, f);
  }
  return { header: H, nrows, columns: cols };
}

module.exports = { parseHeader, parseForm, readTable, CARD, BLOCK };
