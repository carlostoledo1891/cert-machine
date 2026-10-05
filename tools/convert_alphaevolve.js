#!/usr/bin/env node
/* convert_alphaevolve.js — read AlphaEvolve's tensor decompositions out of
   the pinned DeepMind notebook, exactly.

   Source: corpus/sources/alphaevolve_mathematical_results.ipynb — the
   commit-pinned mathematical_results.ipynb of google-deepmind/
   alphaevolve_results (see notes/alphaevolve-48.md; sha256 re-checked here
   and again by pin.js at every certify).

   PART A of the notebook prints sixteen decompositions, each under a heading
   "Rank-r decomposition of <n,m,p> over RING" with RING one of Z, 0.5*Z and
   0.5*C (entries in Z, in (1/2)Z, and in (1/2)Z[i]). Every entry is read as
   the RATIONAL its decimal literal denotes (BigInt over a power of ten — no
   float participates), checked to lie in the ring its heading names, and
   each factor matrix is multiplied by its own least denominator d in {1, 2};
   the claim decided is then the integer identity
       sum_t (dU u)(dV v)(dW w) = dU*dV*dW * T
   — denominators cleared, nothing rounded (ring 'Q' for Z and 0.5*Z, ring
   'Zi' with [re, im] pairs for 0.5*C). The instrument (instruments/strassen)
   decides it; this file only transcribes.

   HISTORY. Until 2026-10-04 this converter knew ONE cell: decomposition_444,
   complex literals only, every doubled component required in {-1, 0, 1}. It
   could not read a real array at all and it refused the second 0.5*C
   decomposition (<3,4,7>, whose components reach +-1, doubled +-2). It now
   reads all three rings; the 4,4,4 output it always wrote,
   corpus/alphaevolve-corpus.json, is written byte-identically from the new
   reader (the battery holds that, and holds the old reader's refusal of
   <3,4,7> as a red control).

   usage: node tools/convert_alphaevolve.js            write corpus/alphaevolve-corpus.json (the rank-48 <4,4,4>)
          node tools/convert_alphaevolve.js --part-a   print every part-A section, transcribed, as JSON on stdout */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'corpus', 'sources', 'alphaevolve_mathematical_results.ipynb');
const PIN_KEY = 'alphaevolve_mathematical_results.ipynb';
const T = require(path.join(ROOT, 'instruments', 'strassen', 'tensor.js'));

class Refusal extends Error {}
const refuse = (m) => { throw new Refusal(m); };

/* the pinned bytes, re-hashed against corpus/sources/PINS.json */
function readNotebook() {
  const PINS = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'sources', 'PINS.json'), 'utf8'));
  const raw = fs.readFileSync(SRC);
  const sha = crypto.createHash('sha256').update(raw).digest('hex');
  if (!PINS[PIN_KEY]) refuse('no pin for ' + PIN_KEY + ' in PINS.json');
  if (sha !== PINS[PIN_KEY]) refuse('source sha256 ' + sha + ' != pin ' + PINS[PIN_KEY]);
  return { nb: JSON.parse(raw.toString('utf8')), sha };
}

/* ---- the exact reader ------------------------------------------------------ */
const DEC = /^([+-]?)(\d+)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/;
/* a decimal literal -> { n, k } meaning n / 10^k, exactly */
function decimal(s) {
  const m = DEC.exec(s.trim());
  if (!m) refuse('not a decimal literal: "' + s + '"');
  const frac = m[3] || '';
  let n = BigInt(m[2] + frac), k = frac.length;
  if (m[4]) { const e = Number(m[4]); if (e >= 0) n *= 10n ** BigInt(e); else k += -e; }
  return { n: m[1] === '-' ? -n : n, k };
}
/* one numpy entry: "0.5", "-0.", "0. -0.5j", "-0.5+0.5j", "1.j" -> [re, im] as {n, k} */
const CPLX = /^([+-]?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)?\s*(?:([+-])\s*(\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)j)$/;
function entry(tok) {
  const t = tok.trim();
  if (/j$/.test(t)) {
    const m = CPLX.exec(t);
    if (!m) refuse('not a complex literal: "' + tok + '"');
    const re = m[1] === undefined ? { n: 0n, k: 0 } : decimal(m[1]);
    const im = decimal(m[2] + m[3]);
    return [re, im];
  }
  return [decimal(t), { n: 0n, k: 0 }];
}
/* an exact {n, k} as the shortest decimal it equals ("-0.5", "1", "0") — display, and the value set */
function show(x) {
  let n = x.n, k = x.k;
  while (k > 0 && n % 10n === 0n) { n /= 10n; k--; }
  const neg = n < 0n, s = (neg ? -n : n).toString().padStart(k + 1, '0');
  return (neg ? '-' : '') + (k ? s.slice(0, s.length - k) + '.' + s.slice(s.length - k) : s);
}
/* the value times 2^e as an integer, or null when it is not one */
function timesPow2(x, e) {
  const D = 10n ** BigInt(x.k), num = x.n * (1n << BigInt(e));
  return num % D === 0n ? num / D : null;
}
/* the nested list after "np.array(" up to its matching "]", tokens split on commas only */
function arrayLiteral(src, at) {
  let i = src.indexOf('[', at);
  if (i < 0) refuse('no list literal after np.array(');
  const parse = () => {
    i++;                                          /* past '[' */
    const out = []; let tok = '';
    const flush = () => { if (tok.trim()) out.push(tok.trim()); tok = ''; };
    for (; i < src.length; i++) {
      const c = src[i];
      if (c === '[') { flush(); out.push(parse()); continue; }
      if (c === ']') { flush(); return out; }
      if (c === ',') { flush(); continue; }
      tok += c;
    }
    refuse('unbalanced brackets');
  };
  const v = parse();
  return { value: v, end: i + 1 };
}

/* the three factor matrices of one decomposition cell, as exact [re, im] entries */
function readCell(src) {
  const starts = [];
  for (let at = src.indexOf('np.array('); at >= 0; at = src.indexOf('np.array(', at + 1)) starts.push(at);
  if (starts.length !== 3) refuse('expected exactly 3 np.array blocks, found ' + starts.length);
  return starts.map((at, bi) => {
    const { value } = arrayLiteral(src, at);
    if (!Array.isArray(value) || !value.every(Array.isArray)) refuse('factor ' + bi + ' is not a matrix');
    const cols = value[0].length;
    if (!value.every((row) => row.length === cols && row.every((x) => typeof x === 'string'))) refuse('factor ' + bi + ' is ragged');
    return value.map((row) => row.map(entry));
  });
}

/* RINGS the headings name; a ring is the denominators allowed and whether an imaginary part may be nonzero */
const RINGS = { 'Z': { den: 0, complex: false }, '0.5*Z': { den: 1, complex: false }, '0.5*C': { den: 1, complex: true } };

/* exact entries -> a claim for the instrument: membership in the stated ring decided, denominators cleared per factor */
function toClaim(factors, dims, rank, ring) {
  const R = RINGS[ring];
  if (!R) refuse('unknown ring "' + ring + '"');
  const [n, m, p] = dims;
  const want = [n * m, m * p, p * n];
  factors.forEach((F, i) => {
    if (F.length !== want[i]) refuse('factor ' + (i + 1) + ' has ' + F.length + ' rows, <' + dims + '> needs ' + want[i]);
    if (F.some((row) => row.length !== rank)) refuse('factor ' + (i + 1) + ' does not have ' + rank + ' columns');
  });
  const outside = [];
  let anyImag = false;
  const dens = factors.map((F) => {
    let d = 0;                                   /* least e with 2^e * entry integral, over the factor */
    for (const row of F) for (const [re, im] of row) {
      if (im.n !== 0n) anyImag = true;
      for (const x of [re, im]) {
        if (timesPow2(x, 0) !== null) continue;
        if (timesPow2(x, 1) !== null) { d = 1; continue; }
        outside.push(x);
      }
    }
    return d;
  });
  if (outside.length) refuse(outside.length + ' entries are not in (1/2)Z[i], e.g. ' + outside[0].n + '/10^' + outside[0].k);
  const maxDen = Math.max(...dens);
  if (maxDen > R.den) refuse('entries with denominator 2 under a heading that names ' + ring);
  if (anyImag && !R.complex) refuse('a nonzero imaginary part under a heading that names ' + ring);
  const scale = dens.reduce((s, d) => s * (1 << d), 1);
  const clear = (F, d) => F.map((row) => row.map(([re, im]) => {
    const a = timesPow2(re, d), b = timesPow2(im, d);
    if (Math.abs(Number(a)) > 1e6 || Math.abs(Number(b)) > 1e6) refuse('a coefficient too large for the instrument');
    return R.complex ? [Number(a), Number(b)] : Number(a);
  }));
  const [U, V, W] = factors.map((F, i) => clear(F, dens[i]));
  const seen = new Set();
  for (const F of factors) for (const row of F) for (const [re, im] of row)
    seen.add(R.complex ? show(re) + (im.n < 0n ? '' : '+') + show(im) + 'i' : show(re));
  const values = [...seen].sort();
  return { dims, rank, ring: R.complex ? 'Zi' : 'Q', scale, U, V, W, claimedRing: ring, denominators: dens.map((d) => 1 << d), values };
}

/* ---- the sections of part A ----------------------------------------------- */
const HEAD = /Rank-(\d+) decomposition of <(\d+),\s*(\d+),\s*(\d+)> over (\S+)/;
function partA(nb) {
  const out = [];
  const cells = nb.cells;
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i];
    if (c.cell_type !== 'markdown') continue;
    const text = c.source.join('');
    if (/^#\s*B\.1\b/m.test(text)) break;       /* part B begins */
    const h = HEAD.exec(text);
    if (!h) continue;
    const sec = { heading: text.trim().replace(/^#+\s*/, ''), rank: Number(h[1]), dims: [Number(h[2]), Number(h[3]), Number(h[4])], ring: h[5], cell: i };
    /* the next data cell before the next heading; a section without one is printed only as prose */
    for (let j = i + 1; j < cells.length; j++) {
      const d = cells[j], s = d.source.join('');
      if (d.cell_type === 'markdown') { if (HEAD.test(s) || /^#\s/.test(s)) break; sec.prose = (sec.prose ? sec.prose + ' ' : '') + s.trim(); continue; }
      if (/decomposition_\d+\s*=\s*\(/.test(s)) { sec.dataCell = j; sec.variable = /(decomposition_\d+)\s*=/.exec(s)[1]; sec.src = s; break; }
    }
    out.push(sec);
  }
  return out;
}

/* every part-A section, transcribed; a section the reader refuses carries the refusal, never a guess */
function convertPartA() {
  const { nb, sha } = readNotebook();
  return { sha256: sha, sections: partA(nb).map((sec) => {
    const base = { heading: sec.heading, dims: sec.dims, rank: sec.rank, ring: sec.ring, markdownCell: sec.cell };
    if (sec.dataCell === undefined) return Object.assign(base, { printed: false, prose: sec.prose || null });
    try {
      return Object.assign(base, { printed: true, dataCell: sec.dataCell, variable: sec.variable, claim: toClaim(readCell(sec.src), sec.dims, sec.rank, sec.ring) });
    } catch (e) {
      if (!(e instanceof Refusal)) throw e;
      return Object.assign(base, { printed: true, dataCell: sec.dataCell, variable: sec.variable, refused: e.message });
    }
  }) };
}

/* ---- the original output: the rank-48 <4,4,4>, written exactly as before ---- */
function write444() {
  const { sha256: sha, sections } = convertPartA();
  const s = sections.find((x) => x.variable === 'decomposition_444');
  if (!s) refuse('no code cell containing decomposition_444');
  if (s.refused) refuse(s.refused);
  const c = s.claim;
  if (c.ring !== 'Zi' || c.scale !== 8 || c.rank !== 48) refuse('the <4,4,4> did not read as doubled half-Gaussian factors');
  for (const M of [c.U, c.V, c.W]) for (const row of M) for (const [re, im] of row)
    if (Math.abs(re) > 1 || Math.abs(im) > 1) refuse('doubled coefficient not in {-1,0,1}+{-1,0,1}i');
  const claim = { dims: [4, 4, 4], rank: 48, ring: 'Zi', scale: 8, U: c.U, V: c.V, W: c.W };
  const probe = T.auditZi(claim);
  if (probe.verdict !== 'VERIFIED') refuse('the parsed decomposition does not audit: ' + JSON.stringify(probe).slice(0, 300));
  const probeBig = T.auditZiBig(claim);
  if (probeBig.verdict !== 'VERIFIED' || probeBig.layout !== probe.layout) refuse('BigInt cross-check disagrees');
  const out = {
    what: 'AlphaEvolve rank-48 <4,4,4> decomposition over (1/2)Z[i], doubled to Z[i] with scale 8 - '
      + 'converted from the pinned DeepMind notebook by tools/convert_alphaevolve.js; the converter '
      + 'audits the claim before writing, so a mis-parse cannot land here.',
    entries: [{
      id: 'alphaevolve-48-4x4x4',
      dims: [4, 4, 4], rank: 48, ring: 'Zi', scale: 8,
      U: claim.U, V: claim.V, W: claim.W,
      layoutProbe: probe.layout,
      source: 'AlphaEvolve (DeepMind, 2025; arXiv:2506.13131), mathematical_results.ipynb of '
        + 'google-deepmind/alphaevolve_results @ commit 4226acb - the first-party byte source',
      pinKey: PIN_KEY,
      sourceSha256: sha,
      transcription: 'the code cell containing "decomposition_444 = (" parsed as three 16x48 complex '
        + 'factor matrices, every entry doubled from half-Gaussian to Z[i] (components verified in {-1,0,1})',
      note: '48 < 49 (Strassen-squared) for 4x4 over C - AlphaEvolve\'s headline; over Z[i] after doubling, '
        + 'as the exact identity sum (2u)(2v)(2w) = 8*T'
    }]
  };
  return { out, probe };
}

module.exports = { readNotebook, decimal, entry, readCell, toClaim, partA, convertPartA, write444, Refusal, RINGS };

if (require.main === module) {
  try {
    if (process.argv.includes('--part-a')) {
      process.stdout.write(JSON.stringify(convertPartA()) + '\n');
    } else {
      const { out, probe } = write444();
      fs.writeFileSync(path.join(ROOT, 'corpus', 'alphaevolve-corpus.json'), JSON.stringify(out) + '\n');
      console.log('corpus/alphaevolve-corpus.json written: rank-48 audited (' + probe.layout + ' layout, '
        + probe.equations + ' equations, scale 8) before landing');
    }
  } catch (e) {
    if (e instanceof Refusal) { console.error('convert_alphaevolve REFUSES: ' + e.message); process.exit(1); }
    throw e;
  }
}
