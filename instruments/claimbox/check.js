#!/usr/bin/env node
/* instruments/claimbox/check.js — the SECOND checker of declared claims (version 3, 2026-10-20; format 4, 2026-10-30), in JavaScript, sharing no
   code with instruments/claimbox/check.py: the same specification (SCHEMA.md), the same refusal kinds, the same decisions
   from the object — exact rationals on BigInt here, Python's Fraction there — so that the battery can hold the two
   to each other on every object. The words are read from instruments/verdict.js and the kernel vocabulary from
   certs/kernel-arb-audit.json, as in the Python. JSON is parsed by a reader of its own that keeps every number's text,
   so that a JSON number in an object is refused as a double and an integer datum beyond 2^53 is still exact. Format 4
   (SCHEMA.md): the readings and standings per input (WARRANT's four read from playground/warrant.js), the canonical form and
   its digest, the int64 reading, the Lean object decided by its kernel lane's record — written here again from the schema.

   usage: node instruments/claimbox/check.js <object.json>...     one line per object; exit 1 if any REFUSED
   MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const ARB = path.join(ROOT, 'certs', 'kernel-arb-audit.json');
const VERDICT_JS = path.join(ROOT, 'instruments', 'verdict.js');
const WARRANT_JS = path.join(ROOT, 'playground', 'warrant.js');
const ADMITTED = 'ADMITTED', REFUSED_WORD = 'REFUSED';

const VOCAB = { Add: [2, 'add'], Subtract: [2, 'sub'], Multiply: [2, 'mul'], Divide: [2, 'div'], Abs: [1, 'abs'], Square: [1, 'sqr'], Power: [2, 'pow'],
  Exp: [1, 'exp'], Ln: [1, 'log'], Sin: [1, 'sin'], Cos: [1, 'cos'], Tanh: [1, 'tanh'], LogGamma: [1, 'lgamma'], Digamma: [1, 'digamma'],
  Trigamma: [1, 'trigamma'], GammaP: [2, 'gammaP'], Phi: [1, 'Phi'] };
const EXACT_EXTRA = { Min: 2, Max: 2, Kronecker: 2 };
const QUANT = ['Sum', 'Product', 'MaxOver', 'MinOver'];
const EXACT_HEADS = new Set(['Add', 'Subtract', 'Multiply', 'Divide', 'Abs', 'Square', 'Power', 'Min', 'Max', 'Kronecker', 'Index', ...QUANT]);
const RELS = ['le', 'lt', 'ge', 'gt', 'eq', 'in', 'holds'];
const READINGS = ['universal', 'epistemic'];
const TOP = ['id', 'text', 'source', 'reading', 'domain', 'predicate', 'reference', 'hypotheses', 'falsifier'];
const TOP_OPTIONAL = ['record', 'repair', 'notes'];
const ELEMENTS = ['doubles', 'decimals', 'integers', 'rationals'];
const READINGS4 = ['decimals', 'doubles', 'integers', 'rationals', 'int64', 'table', 'text', 'bytes', 'lean'];
const ELEMENTS4 = ELEMENTS.concat(['int64']);
const I64_LO = -(2n ** 63n), I64_HI = 2n ** 63n - 1n;
const ROLES = ['source', 'domain', 'resolution', 'record'];
const LANE_KERNELS = ['Lean default kernel accepts', 'nanoda kernel accepts'];
const KINDS = ['schema', 'json-number', 'decimal-literal', 'rational', 'box-order', 'unbounded', 'pin-unresolved', 'pin-mismatch', 'quote-not-verbatim',
  'printed-not-in-quote', 'printed-mismatch', 'vocabulary', 'arity', 'symbol', 'named', 'reading', 'falsifier', 'reference', 'data', 'index', 'empty-range',
  'division-by-zero', 'record-missing', 'record-row-missing', 'record-verdict-word', 'record-value', 'record-bar-mismatch', 'record-pin-mismatch', 'record-decision-mismatch',
  'record-value-mismatch', 'repair', 'resolution', 'record-predicate', 'readings', 'standing', 'canonical', 'lean'];

class Refuse extends Error { constructor(kind, msg) { super(msg); if (!KINDS.includes(kind)) throw new Error('unknown kind ' + kind); this.kind = kind; this.msg = msg; } }
const die = (m) => { process.stderr.write('CLAIMBOX CHECKER (JS) REFUSED TO RUN: ' + m + '\n'); process.exit(2); };

/* ---- the words and the vocabulary, read ---------------------------------------------------------------------- */
let WORDS = null;
let STANDINGS = null; // WARRANT's four, weakest first, read from playground/warrant.js
function loadVocab(arbPath = ARB, verdictPath = VERDICT_JS, warrantPath = WARRANT_JS) {
  if (!fs.existsSync(arbPath)) die('the kernel audit is missing; the vocabulary is read from it');
  const byOp = JSON.parse(fs.readFileSync(arbPath, 'utf8')).byOp || {};
  for (const h of Object.keys(VOCAB)) if (!(VOCAB[h][1] in byOp)) die('the vocabulary names ' + h + ' -> kernel ' + VOCAB[h][1] + ', which the Arb audit does not hold');
  if (!fs.existsSync(verdictPath)) die('instruments/verdict.js is missing; the three words are read from it');
  const src = fs.readFileSync(verdictPath, 'utf8');
  const words = [...src.matchAll(/^const (?:CERTIFIED|REFUTED|REFUSED) = '([A-Z]+)';/gm)].map((m) => m[1]);
  if (words.slice().sort().join() !== 'CERTIFIED,REFUSED,REFUTED') die('verdict.js does not declare the three words where this checker reads them');
  if (!fs.existsSync(warrantPath)) die('playground/warrant.js is missing; the four standings are read from it');
  const nm = /^const NAME = \[([^\]]*)\];/m.exec(fs.readFileSync(warrantPath, 'utf8'));
  const names = nm ? [...nm[1].matchAll(/'([A-Z]+)'/g)].map((x) => x[1]) : [];
  if (names.length !== 4 || new Set(names).size !== 4) die('playground/warrant.js does not declare the four standings where this checker reads them');
  STANDINGS = names;
  return words; // [CERTIFIED, REFUTED, REFUSED] in file order
}

/* ---- a JSON reader that keeps number text ------------------------------------------------------------------------ */
class Num { constructor(text) { this.text = text; } }
function parseJSON(text) {
  let i = 0;
  const ws = () => { while (i < text.length && ' \t\r\n'.includes(text[i])) i++; };
  const err = (m) => { throw new SyntaxError('JSON: ' + m + ' at ' + i); };
  function value() {
    ws();
    const c = text[i];
    if (c === '{') {
      i++; const o = {}; ws();
      if (text[i] === '}') { i++; return o; }
      for (;;) { ws(); if (text[i] !== '"') err('key'); const k = string(); ws(); if (text[i] !== ':') err(':'); i++; o[k] = value(); ws(); if (text[i] === ',') { i++; continue; } if (text[i] === '}') { i++; return o; } err(', or }'); }
    }
    if (c === '[') {
      i++; const a = []; ws();
      if (text[i] === ']') { i++; return a; }
      for (;;) { a.push(value()); ws(); if (text[i] === ',') { i++; continue; } if (text[i] === ']') { i++; return a; } err(', or ]'); }
    }
    if (c === '"') return string();
    if (text.startsWith('true', i)) { i += 4; return true; }
    if (text.startsWith('false', i)) { i += 5; return false; }
    if (text.startsWith('null', i)) { i += 4; return null; }
    const m = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(text.slice(i, i + 400));
    if (!m) err('value');
    i += m[0].length;
    return new Num(m[0]);
  }
  function string() {
    i++; let out = '';
    for (;;) {
      const c = text[i++];
      if (c === undefined) err('unterminated string');
      if (c === '"') return out;
      if (c === '\\') {
        const e = text[i++];
        if (e === 'u') { out += String.fromCharCode(parseInt(text.slice(i, i + 4), 16)); i += 4; }
        else out += { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' }[e];
      } else out += c;
    }
  }
  const v = value(); ws();
  if (i !== text.length) err('trailing');
  return v;
}

/* ---- exact rationals on BigInt ------------------------------------------------------------------------------------ */
const babs = (a) => (a < 0n ? -a : a);
function gcd(a, b) { a = babs(a); b = babs(b); while (b) { [a, b] = [b, a % b]; } return a; }
class Q {
  constructor(n, d = 1n) { if (d === 0n) throw new Refuse('division-by-zero', 'rational'); if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d) || 1n; this.n = n / g; this.d = d / g; }
  static fromString(s) { const m = /^(-?\d+)(?:\/([1-9]\d*))?$/.exec(s); if (!m) throw new Error('not a rational ' + s); return new Q(BigInt(m[1]), m[2] ? BigInt(m[2]) : 1n); }
  static fromDecimal(s) { // the digits as printed, with an optional exponent, as the exact rational they mean
    const m = /^(-?)(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/.exec(s); if (!m) throw new Error('not a decimal ' + s);
    const frac = m[3] || '', e = m[4] ? parseInt(m[4], 10) : 0;
    let n = BigInt((m[1] || '') + m[2] + frac), d = 10n ** BigInt(frac.length);
    if (e > 0) n *= 10n ** BigInt(e); else if (e < 0) d *= 10n ** BigInt(-e);
    return new Q(n, d); }
  static fromDouble(x) { // exact: a finite double is m · 2^e
    if (!Number.isFinite(x)) throw new Refuse('data', 'not a finite double');
    let k = 0; let y = x;
    while (!Number.isInteger(y)) { y *= 2; k++; }
    return new Q(BigInt(y), 2n ** BigInt(k));
  }
  add(o) { return new Q(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { return new Q(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { return new Q(this.n * o.n, this.d * o.d); }
  div(o) { if (o.n === 0n) throw new Refuse('division-by-zero', 'Divide'); return new Q(this.n * o.d, this.d * o.n); }
  abs() { return new Q(babs(this.n), this.d); }
  neg() { return new Q(-this.n, this.d); }
  cmp(o) { const l = this.n * o.d, r = o.n * this.d; return l < r ? -1 : l > r ? 1 : 0; }
  eq(o) { return this.n === o.n && this.d === o.d; }
  isInt() { return this.d === 1n; }
  toInt() { if (!this.isInt()) throw new Refuse('index', String(this) + ' is not an integer'); return Number(this.n); }
  pow(n) { if (n === 0) return new Q(1n); const b = n < 0 ? new Q(this.d, this.n) : this; let r = new Q(1n); for (let i = 0; i < Math.abs(n); i++) r = r.mul(b); return r; }
  toString() { return this.d === 1n ? String(this.n) : String(this.n) + '/' + String(this.d); }
}
const Z = (k) => new Q(BigInt(k));

/* ---- small readers ------------------------------------------------------------------------------------------------ */
const RAT = /^-?\d+(?:\/[1-9]\d*)?$/, DEC = /^-?\d+\.\d+$/, INT = /^-?\d+$/, SYM = /^[A-Za-z_][A-Za-z0-9_]*$/;
const isNum = (v) => v instanceof Num;
const isStr = (v) => typeof v === 'string';
function rational(s, where) {
  if (isNum(s) || typeof s === 'number' || typeof s === 'boolean') throw new Refuse('json-number', where + ': ' + (isNum(s) ? s.text : String(s)));
  if (!isStr(s)) throw new Refuse('schema', where + ' must be a string');
  if (DEC.test(s)) throw new Refuse('decimal-literal', where + ': ' + s);
  if (!RAT.test(s)) throw new Refuse('rational', where + ': ' + s);
  return Q.fromString(s);
}
function printedRational(s, where) {
  if (!isStr(s) || !(DEC.test(s) || INT.test(s))) throw new Refuse('schema', where + ' (printed) must be the digits as printed');
  return Q.fromDecimal(s);
}
function printedBox(s) { const d = s.includes('.') ? s.split('.')[1].length : 0; const half = new Q(5n, 10n ** BigInt(d + 1)); const p = Q.fromDecimal(s); return [p.sub(half), p.add(half)]; }
/* a JSON number literal as text (1e-10, 0.0001, 0) → the exact rational it denotes */
const NUMLIT = '-?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?';
function fromLiteral(t) {
  const m = /^(-?)(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/.exec(t);
  if (!m) throw new Refuse('resolution', 'not a number literal: ' + t);
  const frac = m[3] || '', k = Number(m[4] || 0) - frac.length;
  const n = BigInt(m[2] + frac) * (m[1] ? -1n : 1n);
  return k >= 0 ? new Q(n * 10n ** BigInt(k), 1n) : new Q(n, 10n ** BigInt(-k));
}
/* the platform's declared resolution: the box is printed ± halfWidth, halfWidth the rational of the number the pinned, quoted
   source prints after the named key — or, when that prints 0, 10^-12 · max(1, |printed|), stated as the block's rule */
function resolutionBox(p, box, root, where) {
  need(box, ['kind', 'key', 'halfWidth', 'source'], ['rule'], where);
  if (box.kind !== 'resolution') throw new Refuse('resolution', where + ': kind must be "resolution"');
  if (!isStr(box.key) || !box.key.trim()) throw new Refuse('resolution', where + ': key must name the field the source prints the resolution under');
  const hw = rational(box.halfWidth, where + '.halfWidth');
  if (hw.cmp(Z(0)) <= 0) throw new Refuse('resolution', where + ': halfWidth must be positive');
  const src = box.source;
  need(src, ['path', 'sha256', 'quote'], [], where + '.source');
  const spath = pinned({ path: src.path, sha256: src.sha256 }, where + '.source', root);
  if (!isStr(src.quote) || !src.quote.trim()) throw new Refuse('schema', where + '.source.quote must be a non-empty string');
  if (!fs.readFileSync(spath, 'utf8').includes(src.quote)) throw new Refuse('quote-not-verbatim', where + '.source: ' + src.path);
  const re = new RegExp('"' + box.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"\\s*:\\s*(' + NUMLIT + ')', 'g');
  const found = []; let mm; while ((mm = re.exec(src.quote)) !== null) found.push(mm[1]);
  if (found.length !== 1) throw new Refuse('resolution', where + ': the quote must print "' + box.key + '": <number> exactly once (' + found.length + ' found)');
  const q = fromLiteral(found[0]);
  if (q.cmp(Z(0)) < 0) throw new Refuse('resolution', where + ': the quoted resolution is negative');
  let info;
  if (q.cmp(Z(0)) > 0) {
    if ('rule' in box) throw new Refuse('resolution', where + ': rule is stated only when the quoted resolution is 0');
    if (!hw.eq(q)) throw new Refuse('resolution', where + ': halfWidth ' + box.halfWidth + ' is not the quoted resolution ' + found[0]);
    info = 'the quoted ' + box.key + ' ' + found[0];
  } else {
    if (box.rule !== '1e-12-relative') throw new Refuse('resolution', where + ': the quoted resolution is 0, so the block must state rule "1e-12-relative"');
    const ap = p.cmp(Z(0)) < 0 ? Z(0).sub(p) : p;
    const want = new Q(1n, 10n ** 12n).mul(ap.cmp(Z(1)) > 0 ? ap : Z(1));
    if (!hw.eq(want)) throw new Refuse('resolution', where + ': halfWidth ' + box.halfWidth + ' is not 10^-12 · max(1, |printed|) = ' + want.toString());
    info = 'the quoted ' + box.key + ' is 0: 10^-12 relative';
  }
  return [p.sub(hw), p.add(hw), info];
}
const sha256 = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function pinned(pin, where, root) {
  if (!pin || typeof pin !== 'object' || Array.isArray(pin) || Object.keys(pin).sort().join() !== 'path,sha256') throw new Refuse('schema', where + ' must be {path, sha256}');
  const p = path.join(root, pin.path);
  if (!fs.existsSync(p) || !fs.statSync(p).isFile()) throw new Refuse('pin-unresolved', where + ': ' + pin.path);
  if (sha256(p) !== pin.sha256) throw new Refuse('pin-mismatch', where + ': ' + pin.path);
  return p;
}
function need(obj, keys, optional, where) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Refuse('schema', where + ' must be an object');
  const missing = keys.filter((k) => !(k in obj)), unknown = Object.keys(obj).filter((k) => !keys.includes(k) && !optional.includes(k));
  if (missing.length) throw new Refuse('schema', where + ' is missing ' + missing.join(', '));
  if (unknown.length) throw new Refuse('schema', where + ' has unknown field(s) ' + unknown.join(', '));
}
function strList(xs, where, allowEmpty) {
  if (!Array.isArray(xs) || (!xs.length && !allowEmpty) || xs.some((x) => !isStr(x) || !x.trim()))
    throw new Refuse(where === 'falsifier' ? 'falsifier' : 'schema', where + ' must be a list of non-empty strings' + (allowEmpty ? '' : ', not empty'));
}
const countOf = (v, where) => { if (!isNum(v) || !/^[1-9]\d*$/.test(v.text)) throw new Refuse('schema', where + ' must be a positive integer'); return Number(v.text); };

/* ---- expressions: well-formedness ---------------------------------------------------------------------------------- */
function walk(e, symbols, where, root, dataSym, bound) {
  if (isNum(e) || typeof e === 'number' || typeof e === 'boolean') throw new Refuse('json-number', where + ': ' + (isNum(e) ? e.text : String(e)));
  if (isStr(e)) {
    if (RAT.test(e)) return true;
    if (DEC.test(e)) throw new Refuse('decimal-literal', where + ': ' + e);
    if (SYM.test(e)) { if (symbols.has(e) || bound.includes(e)) return true; throw new Refuse('symbol', where + ': ' + e + ' is not declared by the domain'); }
    throw new Refuse('schema', where + ': unreadable token ' + JSON.stringify(e));
  }
  if (Array.isArray(e)) {
    if (!e.length || !isStr(e[0])) throw new Refuse('schema', where + ': an expression list starts with its head');
    const head = e[0];
    if (QUANT.includes(head)) {
      if (e.length !== 5) throw new Refuse('arity', where + ': ' + head + ' takes var, lo, hi, body');
      const v = e[1];
      if (!isStr(v) || !SYM.test(v) || symbols.has(v) || bound.includes(v)) throw new Refuse('schema', where + ': ' + head + ' binds a fresh symbol');
      const a = walk(e[2], symbols, where + '.' + head + '.lo', root, dataSym, bound), b = walk(e[3], symbols, where + '.' + head + '.hi', root, dataSym, bound);
      const c = walk(e[4], symbols, where + '.' + head + '.body', root, dataSym, bound.concat([v]));
      return a && b && c;
    }
    if (head === 'Index') {
      if (dataSym === null) throw new Refuse('vocabulary', where + ': Index needs a typed data block in the domain');
      if (!(e.length === 3 || e.length === 4) || e[1] !== dataSym) throw new Refuse('arity', where + ': Index takes the data symbol and one or two indices');
      let ok = true;
      e.slice(2).forEach((a, i) => { ok = walk(a, symbols, where + '.Index[' + i + ']', root, dataSym, bound) && ok; });
      return ok;
    }
    let arity;
    if (head in EXACT_EXTRA) arity = EXACT_EXTRA[head]; else if (head in VOCAB) arity = VOCAB[head][0]; else throw new Refuse('vocabulary', where + ': ' + head);
    if (e.length - 1 !== arity) throw new Refuse('arity', where + ': ' + head + ' takes ' + arity + ', given ' + (e.length - 1));
    let ok = EXACT_HEADS.has(head);
    e.slice(1).forEach((a, i) => { ok = walk(a, symbols, where + '.' + head + '[' + i + ']', root, dataSym, bound) && ok; });
    return ok;
  }
  if (e && typeof e === 'object') {
    need(e, ['named', 'where', 'args'], [], where + ' (named)');
    if (!isStr(e.named) || !e.named.trim()) throw new Refuse('schema', where + ': named must be a non-empty string');
    if (!isStr(e.where) || !fs.existsSync(path.join(root, e.where))) throw new Refuse('named', where + ': ' + String(e.where));
    if (!Array.isArray(e.args)) throw new Refuse('schema', where + ': args must be a list');
    e.args.forEach((a, i) => walk(a, symbols, where + '.args[' + i + ']', root, dataSym, bound));
    return false;
  }
  throw new Refuse('schema', where + ': unreadable expression');
}

/* ---- expressions: exact evaluation --------------------------------------------------------------------------------- */
/* format 4, int64 reading: lim set → every value an operation produces, and every partial sum or product, must be an integer
   in int64, or Wrap is thrown and the predicate is left undecided (exact arithmetic is int64 arithmetic only while nothing wraps) */
class Wrap extends Error {}
function ev(e, env, data, where, lim) {
  const held = (v, at) => {
    if (lim && (!v.isInt() || v.n < I64_LO || v.n > I64_HI)) { const t = v.toString(); throw new Wrap(where + ': ' + at + ' gives ' + (t.length < 40 ? t : t.slice(0, 40) + '…') + ', which int64 arithmetic does not hold'); }
    return v;
  };
  if (isStr(e)) return RAT.test(e) ? held(Q.fromString(e), 'the literal ' + e) : env.get(e);
  const head = e[0];
  if (head === 'Index') {
    let cur = data;
    for (const a of e.slice(2)) {
      const i = ev(a, env, data, where, lim).toInt();
      if (!Array.isArray(cur) || i < 0 || i >= cur.length) throw new Refuse('index', where + ': Index ' + i + ' out of range');
      cur = cur[i];
    }
    if (Array.isArray(cur)) throw new Refuse('index', where + ': Index does not reach a scalar');
    return cur;
  }
  if (QUANT.includes(head)) {
    const v = e[1], lo = ev(e[2], env, data, where, lim).toInt(), hi = ev(e[3], env, data, where, lim).toInt();
    if ((head === 'MaxOver' || head === 'MinOver') && hi < lo) throw new Refuse('empty-range', where + ': ' + head + ' over ' + lo + '..' + hi);
    let acc = head === 'Sum' ? Z(0) : head === 'Product' ? Z(1) : null;
    const env2 = new Map(env);
    for (let k = lo; k <= hi; k++) {
      env2.set(v, Z(k));
      const x = ev(e[4], env2, data, where, lim);
      if (head === 'Sum') acc = held(acc.add(x), 'a partial Sum'); else if (head === 'Product') acc = held(acc.mul(x), 'a partial Product');
      else if (head === 'MaxOver') acc = acc === null || x.cmp(acc) > 0 ? x : acc; else acc = acc === null || x.cmp(acc) < 0 ? x : acc;
    }
    return acc;
  }
  const a = e.slice(1).map((x) => ev(x, env, data, where, lim));
  switch (head) {
    case 'Add': return held(a[0].add(a[1]), 'Add');
    case 'Subtract': return held(a[0].sub(a[1]), 'Subtract');
    case 'Multiply': return held(a[0].mul(a[1]), 'Multiply');
    case 'Divide': if (a[1].n === 0n) throw new Refuse('division-by-zero', where); return held(a[0].div(a[1]), 'Divide');
    case 'Abs': return held(a[0].abs(), 'Abs');
    case 'Square': return held(a[0].mul(a[0]), 'Square');
    case 'Power': { const n = a[1].toInt(); if (a[0].n === 0n && n < 0) throw new Refuse('division-by-zero', where + '.Power'); return held(a[0].pow(n), 'Power'); }
    case 'Min': return a[0].cmp(a[1]) <= 0 ? a[0] : a[1];
    case 'Max': return a[0].cmp(a[1]) >= 0 ? a[0] : a[1];
    case 'Kronecker': return Z(a[0].eq(a[1]) ? 1 : 0);
    default: throw new Error('not exact: ' + head);
  }
}

/* ---- typed data ------------------------------------------------------------------------------------------------------ */
function decodeData(spec, p, where, elements = ELEMENTS) {
  need(spec, ['select', 'elements', 'shape'], [], where);
  if (!elements.includes(spec.elements)) throw new Refuse('data', where + ': elements must be one of ' + elements.join(', ') + (ELEMENTS4.includes(spec.elements) ? ' (' + spec.elements + ' is a format-4 reading)' : ''));
  if (!Array.isArray(spec.shape) || !spec.shape.length || spec.shape.some((s) => !isStr(s) || !SYM.test(s)) || new Set(spec.shape).size !== spec.shape.length)
    throw new Refuse('data', where + ': shape must be a list of distinct symbols, one per dimension');
  let doc;
  try { doc = parseJSON(fs.readFileSync(p, 'utf8')); } catch (e) { throw new Refuse('data', where + ': the pinned bytes are not JSON (' + String(e.message).slice(0, 60) + ')'); }
  let cur = doc;
  for (const k of String(spec.select).split('.')) {
    if (Array.isArray(cur) && INT.test(k)) { const i = Number(k); if (i < 0 || i >= cur.length) throw new Refuse('data', where + ': select index out of range'); cur = cur[i]; }
    else if (cur && typeof cur === 'object' && !Array.isArray(cur) && k in cur) cur = cur[k];
    else throw new Refuse('data', where + ': select ' + spec.select + ' does not resolve');
  }
  const sizes = {};
  const conv = (x, depth, w) => {
    if (depth === spec.shape.length) {
      if (spec.elements === 'doubles') { if (!isNum(x)) throw new Refuse('data', w + ': not a JSON number'); return Q.fromDouble(Number(x.text)); }
      if (spec.elements === 'decimals') { if (!isNum(x)) throw new Refuse('data', w + ': not a JSON number'); return Q.fromDecimal(x.text); }
      if (spec.elements === 'integers') { if (!isNum(x) || !INT.test(x.text)) throw new Refuse('data', w + ': not a JSON integer'); return new Q(BigInt(x.text)); }
      if (spec.elements === 'int64') { if (!isNum(x) || !INT.test(x.text)) throw new Refuse('data', w + ': not a JSON integer'); const b = BigInt(x.text); if (b < I64_LO || b > I64_HI) throw new Refuse('data', w + ': ' + x.text + ' is outside int64'); return new Q(b); }
      if (!isStr(x) || !RAT.test(x)) throw new Refuse('data', w + ': not a rational string'); return Q.fromString(x);
    }
    if (!Array.isArray(x)) throw new Refuse('data', w + ': expected a list at depth ' + depth);
    const name = spec.shape[depth];
    if (name in sizes && sizes[name] !== x.length) throw new Refuse('data', w + ': ' + name + ' is ' + sizes[name] + ' elsewhere, ' + x.length + ' here (not rectangular)');
    sizes[name] = x.length;
    return x.map((y, i) => conv(y, depth + 1, w + '[' + i + ']'));
  };
  return [conv(cur, 0, where), sizes];
}

/* ---- the record -------------------------------------------------------------------------------------------------------- */
const getPath = (o, dotted) => { let cur = o; for (const k of dotted.split('.')) { if (!cur || typeof cur !== 'object' || !(k in cur)) return undefined; cur = cur[k]; } return cur; };
function recordValue(v, where) {
  if (isStr(v) && RAT.test(v)) return ['exact', Q.fromString(v)];
  if (Array.isArray(v) && v.length === 2 && v.every(isNum)) { const lo = Q.fromDouble(Number(v[0].text)), hi = Q.fromDouble(Number(v[1].text)); if (lo.cmp(hi) > 0) throw new Refuse('record-value', where + ': enclosure with lo > hi'); return ['enclosure', [lo, hi]]; }
  throw new Refuse('record-value', where + ': ' + JSON.stringify(v === undefined ? null : (isNum(v) ? v.text : v)).slice(0, 80));
}
const BAR_IN_CLAIM = /-?\d+\.\d+/, REL_IN_CLAIM = /(<=|>=|≤|≥|<|>|=)/;
const REL_WORD = { '<=': 'le', '≤': 'le', '>=': 'ge', '≥': 'ge', '<': 'lt', '>': 'gt', '=': 'eq' };

function decide(value, rel, c) {
  const [C, R, F] = WORDS;
  const [kind, v] = value;
  const [lo, hi] = kind === 'exact' ? [v, v] : v;
  if (rel === 'in') { const [blo, bhi] = c; if (blo.cmp(lo) <= 0 && hi.cmp(bhi) <= 0) return C; if (hi.cmp(blo) < 0 || lo.cmp(bhi) > 0) return R; return F; }
  if (rel === 'eq') { if (kind === 'exact') return v.eq(c) ? C : R; return (hi.cmp(c) < 0 || lo.cmp(c) > 0) ? R : F; }
  if (rel === 'lt') return hi.cmp(c) < 0 ? C : lo.cmp(c) >= 0 ? R : F;
  if (rel === 'le') return hi.cmp(c) <= 0 ? C : lo.cmp(c) > 0 ? R : F;
  if (rel === 'gt') return lo.cmp(c) > 0 ? C : hi.cmp(c) <= 0 ? R : F;
  if (rel === 'ge') return lo.cmp(c) >= 0 ? C : hi.cmp(c) < 0 ? R : F;
  throw new Error(rel);
}
function compose(words) { const [C, R, F] = WORDS; if (words.includes(R)) return R; if (words.includes(F)) return F; return C; }

function decideFromObject(p, env0, data, where, lim) {
  const [C, R] = WORDS;
  if (!p.forall.length) { const v = ev(p.g, env0, data, where, lim); return { word: decide(['exact', v], p.rel, p.c), witness: null, violations: null, value: v.toString() }; }
  let violations = 0, witness = null;
  const env = new Map(env0);
  const loop = (k) => {
    if (k === p.forall.length) {
      const v = ev(p.g, env, data, where, lim);
      if (decide(['exact', v], p.rel, p.c) !== C) { violations++; if (!witness) { const at = {}; for (const [vr] of p.forall) at[vr] = env.get(vr).toInt(); witness = { at, value: v.toString() }; } }
      return;
    }
    const [vr, loE, hiE] = p.forall[k];
    const lo = ev(loE, env, data, where + '.forall', lim).toInt(), hi = ev(hiE, env, data, where + '.forall', lim).toInt();
    for (let i = lo; i <= hi; i++) { env.set(vr, Z(i)); loop(k + 1); }
    env.delete(vr);
  };
  loop(0);
  return { word: violations ? R : C, witness, violations, value: null };
}

/* ---- format 4: the canonical form, the readings, the standings, the certificate's inputs ---------------------------------- */
const reEsc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wholeCount = (printed, quote) => (quote.match(new RegExp('(?<![0-9.])' + reEsc(printed) + '(?![0-9]|\\.[0-9])', 'g')) || []).length;
/* the canonical encoding: keys sorted, no whitespace, strings as JSON writes them (the same bytes as Python's json.dumps with
   sort_keys, compact separators and ensure_ascii off) */
function enc(v) {
  if (v === null || v === undefined) return 'null';
  if (isNum(v)) return v.text;
  if (isStr(v)) return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(enc).join(',') + ']';
  return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + enc(v[k])).join(',') + '}';
}
function canonicalForm(o) {
  const d = o.domain;
  const dom = d.kind === 'finite' ? { kind: 'finite', sha256: d.pin.sha256, count: d.count.text, variable: d.variable, data: 'data' in d ? d.data : null }
    : d.kind === 'box' ? { kind: 'box', sides: d.sides.map((x) => ({ name: x.name, lo: x.lo, hi: x.hi })) }
      : { kind: 'lean', repository: d.repository, commit: d.commit };
  const preds = o.predicate.map((p) => ({ g: p.g, rel: p.rel, c: 'c' in p ? p.c : null, forall: 'forall' in p ? p.forall : null, halfWidth: 'box' in p ? p.box.halfWidth : null }))
    .map((p) => [enc(p), p]).sort((x, y) => (x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : 0)).map((x) => x[1]);
  return { format: '4', reading: o.reading, readings: o.readings, domain: dom, predicates: preds };
}
const canonicalDigest = (o) => crypto.createHash('sha256').update(Buffer.from(enc(canonicalForm(o)), 'utf8')).digest('hex');
function onePerBar(o) {
  const seen = new Map();
  for (const p of o.predicate) if ('printed' in p) seen.set(p.printed, (seen.get(p.printed) || 0) + 1);
  for (const [pr, n] of seen) { const k = wholeCount(pr, o.source.quote); if (n > k) throw new Refuse('canonical', 'the bar ' + pr + ' carries ' + n + ' inequalities; the quote prints it ' + k + ' time(s) as a whole number'); }
}
function fourth(o, d, rv, value, recSha, laneWord, out) {
  const s = o.source;
  const inputs = [{ role: 'source', path: s.path, sha256: s.sha256 }];
  if (d.kind === 'finite') inputs.push({ role: 'domain', path: d.pin.path, sha256: d.pin.sha256 });
  else if (d.kind === 'lean') inputs.push({ role: 'domain', path: d.repository + '@' + d.commit, sha256: null });
  for (const p of o.predicate) if ('box' in p) inputs.push({ role: 'resolution', path: p.box.source.path, sha256: p.box.source.sha256 });
  if ('record' in o) inputs.push({ role: 'record', path: o.record.path, sha256: recSha });
  const roles = ROLES.filter((x) => inputs.some((i) => i.role === x));
  for (const [field, kind] of [['readings', 'readings'], ['standing', 'standing']]) {
    const decl = o[field];
    if (!decl || typeof decl !== 'object' || Array.isArray(decl) || isNum(decl)) throw new Refuse(kind, field + ' must map each input role to its word');
    const missing = roles.filter((x) => !(x in decl)), extra = Object.keys(decl).filter((x) => !roles.includes(x));
    if (missing.length) throw new Refuse(kind, field + ' has no word for ' + missing.join(', ') + ' (no ' + (kind === 'readings' ? 'reading' : 'standing') + ' is a default)');
    if (extra.length) throw new Refuse(kind, field + ' names ' + extra.join(', ') + ', which this object does not have as an input');
    const vocab = kind === 'readings' ? READINGS4 : STANDINGS;
    for (const x of roles) if (!isStr(decl[x]) || !vocab.includes(decl[x])) throw new Refuse(kind, field + '.' + x + ' is ' + (isNum(decl[x]) ? decl[x].text : JSON.stringify(decl[x])) + ', not one of ' + vocab.join(', '));
  }
  const rd = o.readings;
  const want = { source: 'text', resolution: 'decimals' };
  if (d.kind === 'lean') want.domain = 'lean'; else if (d.kind === 'finite' && 'data' in d) want.domain = d.data.elements;
  if ('record' in o) want.record = value === null ? 'text' : value[0] === 'exact' ? 'rationals' : 'doubles';
  for (const x of roles) if (x in want && rd[x] !== want[x]) throw new Refuse('readings', 'readings.' + x + ' is ' + rd[x] + '; the ' + x + ' is read as ' + want[x]);
  if (d.kind === 'finite' && !('data' in d) && rd.domain === 'lean') throw new Refuse('readings', 'readings.domain is lean; the domain is pinned bytes');
  const st = o.standing, top = STANDINGS[STANDINGS.length - 1];
  if ('record' in o && st.record === top && rv === WORDS[2]) throw new Refuse('standing', 'standing.record is ' + top + ', but the record\'s word is ' + rv);
  if (d.kind === 'lean' && st.domain === top && laneWord === WORDS[2]) throw new Refuse('standing', 'standing.domain is ' + top + ', but the kernel lane decided nothing (' + laneWord + ')');
  for (const i of inputs) { i.reading = rd[i.role]; i.standing = st[i.role]; }
  out.inputs = inputs;
  out.meet = roles.map((x) => st[x]).reduce((a, b) => (STANDINGS.indexOf(b) < STANDINGS.indexOf(a) ? b : a));
  out.canonical = canonicalDigest(o);
}

/* ---- the check ---------------------------------------------------------------------------------------------------------- */
function checkObj(o, root = ROOT) {
  const out = { word: REFUSED_WORD, kind: null, msg: '', id: o && typeof o === 'object' ? o.id : null, decided: [], fromObject: [], notes: [], seconds: 0 };
  const t0 = Date.now();
  try {
    const v4 = !!o && typeof o === 'object' && !Array.isArray(o) && 'format' in o;
    if (v4) {
      if (!isNum(o.format) || o.format.text !== '4') throw new Refuse('schema', 'format must be 4 (an object without "format" is a version-3 object), got ' + (isNum(o.format) ? o.format.text : JSON.stringify(o.format)));
      if (!('readings' in o)) throw new Refuse('readings', 'a format-4 object declares the reading of each input: no reading is a default');
      if (!('standing' in o)) throw new Refuse('standing', 'a format-4 object declares the standing of each input');
      need(o, TOP.concat(['format', 'readings', 'standing']), TOP_OPTIONAL, 'the object');
    } else need(o, TOP, TOP_OPTIONAL, 'the object');
    if (!isStr(o.id) || !o.id.trim()) throw new Refuse('schema', 'id must be a non-empty string');
    if (!isStr(o.text) || !o.text.trim()) throw new Refuse('schema', 'text must be a non-empty string');
    if (!READINGS.includes(o.reading)) throw new Refuse('reading', JSON.stringify(o.reading));
    if (!isStr(o.reference) || !o.reference.trim()) throw new Refuse('reference', 'reference is empty');
    strList(o.hypotheses, 'hypotheses', true);
    strList(o.falsifier, 'falsifier', false);
    if ('notes' in o) strList(o.notes, 'notes', true);

    const s = o.source;
    need(s, ['what', 'path', 'sha256', 'quote'], [], 'source');
    const srcPath = pinned({ path: s.path, sha256: s.sha256 }, 'source', root);
    if (!isStr(s.quote) || !s.quote.trim()) throw new Refuse('schema', 'source.quote must be a non-empty string');
    if (!fs.readFileSync(srcPath, 'utf8').includes(s.quote)) throw new Refuse('quote-not-verbatim', s.path);

    const d = o.domain;
    if (!d || typeof d !== 'object' || !(v4 ? ['finite', 'box', 'lean'] : ['finite', 'box']).includes(d.kind)) throw new Refuse('schema', 'domain.kind must be finite or box' + (v4 ? ' or lean' : ''));
    const symbols = new Set();
    const boxSymbols = new Set();
    const env0 = new Map();
    let data = null, dataSym = null, lim = false;
    if (d.kind === 'lean') {
      need(d, ['kind', 'repository', 'commit', 'lane'], [], 'domain');
      if (!isStr(d.repository) || !d.repository.trim()) throw new Refuse('schema', 'domain.repository must name the Lean project');
      if (!isStr(d.commit) || !/^[0-9a-f]{40}$/.test(d.commit)) throw new Refuse('schema', 'domain.commit must be the 40-hex commit the lane built');
      if (!isStr(d.lane) || !fs.existsSync(path.join(root, d.lane)) || !fs.statSync(path.join(root, d.lane)).isFile()) throw new Refuse('lean', 'domain.lane must be the kernel lane\'s workflow on disk: ' + JSON.stringify(d.lane === undefined ? null : d.lane));
    } else if (d.kind === 'finite') {
      need(d, ['kind', 'pin', 'decoder', 'count', 'variable'], ['data'], 'domain');
      const dpath = pinned(d.pin, 'domain.pin', root);
      const count = countOf(d.count, 'domain.count');
      if (!isStr(d.decoder) || !d.decoder.trim()) throw new Refuse('schema', 'domain.decoder must say how the bytes are read');
      if (!isStr(d.variable) || !SYM.test(d.variable)) throw new Refuse('schema', 'domain.variable must be a symbol');
      symbols.add(d.variable);
      if ('data' in d) {
        const [dd, sizes] = decodeData(d.data, dpath, 'domain.data', v4 ? ELEMENTS4 : ELEMENTS);
        if (d.data.elements === 'int64') lim = true;
        data = dd; dataSym = d.variable;
        const first = d.data.shape[0];
        if (sizes[first] !== count) throw new Refuse('data', 'domain.count is ' + count + ', the decoded ' + first + ' is ' + sizes[first]);
        for (const name of Object.keys(sizes)) { if (symbols.has(name)) throw new Refuse('data', 'shape symbol ' + name + ' collides'); symbols.add(name); env0.set(name, Z(sizes[name])); }
      }
    } else {
      need(d, ['kind', 'sides'], [], 'domain');
      if (!Array.isArray(d.sides) || !d.sides.length) throw new Refuse('schema', 'domain.sides must be a non-empty list');
      d.sides.forEach((side, i) => {
        const w = 'domain.sides[' + i + ']';
        need(side, ['name', 'lo', 'hi', 'source'], [], w);
        if (!isStr(side.name) || !SYM.test(side.name) || symbols.has(side.name)) throw new Refuse('schema', w + ': name must be a fresh symbol');
        if (['inf', '-inf'].includes(side.lo) || ['inf', '-inf'].includes(side.hi)) throw new Refuse('unbounded', w);
        const lo = rational(side.lo, w + '.lo'), hi = rational(side.hi, w + '.hi');
        if (lo.cmp(hi) > 0) throw new Refuse('box-order', w + ': ' + side.lo + ' > ' + side.hi);
        if (!isStr(side.source) || !side.source.trim()) throw new Refuse('schema', w + ': every side carries the source of its bounds');
        symbols.add(side.name); boxSymbols.add(side.name);
      });
    }

    const P = o.predicate;
    if (!Array.isArray(P) || !P.length) throw new Refuse('schema', 'predicate must be a non-empty list');
    const preds = [];
    P.forEach((p, i) => {
      const w = 'predicate[' + i + ']';
      need(p, ['g', 'rel'], ['printed', 'c', 'note', 'forall', 'box'], w);
      if ('box' in p && p.rel !== 'in') throw new Refuse('schema', w + ': box belongs to an "in" predicate');
      if (!RELS.includes(p.rel)) throw new Refuse('schema', w + ': rel must be one of ' + RELS.join(', '));
      let bound = [];
      const forall = [];
      if ('forall' in p) {
        if (!Array.isArray(p.forall) || !p.forall.length) throw new Refuse('schema', w + ': forall is a non-empty list of [var, lo, hi]');
        for (const q of p.forall) {
          if (!Array.isArray(q) || q.length !== 3 || !isStr(q[0]) || !SYM.test(q[0]) || symbols.has(q[0]) || bound.includes(q[0])) throw new Refuse('schema', w + ': each forall entry is [a fresh symbol, lo, hi]');
          walk(q[1], symbols, w + '.forall.lo', root, dataSym, bound); walk(q[2], symbols, w + '.forall.hi', root, dataSym, bound);
          bound = bound.concat([q[0]]); forall.push([q[0], q[1], q[2]]);
        }
      }
      const exact = walk(p.g, symbols, w + '.g', root, dataSym, bound);
      if (p.rel === 'holds') {
        if (Array.isArray(p.g) || isStr(p.g) || 'printed' in p || 'c' in p || forall.length) throw new Refuse('schema', w + ': "holds" takes a named exact predicate and no bar');
        preds.push({ rel: 'holds', exact: false, forall: [], g: p.g, printed: null }); return;
      }
      if (!('c' in p)) throw new Refuse('schema', w + ': an inequality carries c');
      let pr;
      if ('printed' in p) { pr = printedRational(p.printed, w); if (!s.quote.includes(p.printed)) throw new Refuse('printed-not-in-quote', w + ': ' + p.printed); }
      else if (p.c !== '0' || p.rel === 'in') throw new Refuse('schema', w + ': a bar the claimant printed must carry printed; only the zero of a structural inequality may omit it');
      else pr = Z(0);
      if (p.rel === 'in') {
        if (!Array.isArray(p.c) || p.c.length !== 2) throw new Refuse('schema', w + ': "in" takes c = [lo, hi]');
        const lo = rational(p.c[0], w + '.c[0]'), hi = rational(p.c[1], w + '.c[1]');
        if (lo.cmp(hi) > 0) throw new Refuse('box-order', w + '.c');
        if ('box' in p) {
          const [blo, bhi, binfo] = resolutionBox(pr, p.box, root, w + '.box');
          if (!lo.eq(blo) || !hi.eq(bhi)) throw new Refuse('printed-mismatch', w + ': c is not ' + p.printed + ' ± the declared resolution (' + binfo + ')');
          out.notes.push(w + ': the box is the printed value ± the platform\'s declared resolution, ' + binfo);
        } else {
          const [blo, bhi] = printedBox(p.printed);
          if (!lo.eq(blo) || !hi.eq(bhi)) throw new Refuse('printed-mismatch', w + ': c is not the box the digits of ' + p.printed + ' allow');
        }
        preds.push({ rel: 'in', c: [lo, hi], printed: p.printed, exact, forall, g: p.g });
      } else {
        const c = rational(p.c, w + '.c');
        if (!c.eq(pr)) throw new Refuse('printed-mismatch', w + ': c = ' + p.c + ' is not the rational of ' + String(p.printed));
        preds.push({ rel: p.rel, c, printed: 'printed' in p ? p.printed : null, exact, forall, g: p.g });
      }
    });

    const uses = (e, names) => isStr(e) ? names.has(e) : Array.isArray(e) ? e.slice(1).some((x) => uses(x, names)) : (e && typeof e === 'object' && Array.isArray(e.args)) ? e.args.some((x) => uses(x, names)) : false;
    if (v4) onePerBar(o);
    if (d.kind === 'lean') {
      if (preds.length !== 1 || preds[0].rel !== 'holds' || preds[0].g.where !== d.lane || !Array.isArray(preds[0].g.args) || preds[0].g.args.length !== 0)
        throw new Refuse('lean', 'a Lean object states one "holds" over its kernel lane (where = domain.lane, no args): the kernels decide it, nothing else');
      if (!('record' in o)) throw new Refuse('lean', 'a Lean object is decided by its lane\'s record; nothing builds Lean here');
    }
    const fromObject = preds.map((p, i) => {
      if (p.rel === 'holds' || !p.exact || uses(p.g, boxSymbols)) { if (p.rel !== 'holds') out.notes.push('predicate[' + i + '] not decided from the object: ' + (p.exact && uses(p.g, boxSymbols) ? 'a box variable (the interval decider\'s)' : 'a transcendental or named head')); return null; }
      try { return decideFromObject(p, env0, data, 'predicate[' + i + '].g', lim); } catch (e) {
        if (e instanceof Wrap) { out.notes.push('predicate[' + i + '] not decided from the object under the int64 reading: ' + e.message); return null; }
        throw e;
      }
    });
    out.fromObject = fromObject;

    let rv = null, recSha = null, value = null, laneWord = null;
    if ('record' in o) {
      const r = o.record;
      need(r, ['path', 'row', 'value', 'verdict'], v4 ? ['predicate', 'key'] : ['predicate'], 'record');
      const rkey = 'key' in r ? r.key : 'id';
      if (!isStr(rkey) || !SYM.test(rkey)) throw new Refuse('schema', 'record.key must name the field that identifies the row');
      let rix = null;
      if ('predicate' in r) {
        const t = isNum(r.predicate) ? r.predicate.text : null;
        if (t === null || !/^\d+$/.test(t) || Number(t) >= preds.length) throw new Refuse('record-predicate', 'record.predicate must index one of the ' + preds.length + ' predicates, got ' + (t === null ? JSON.stringify(r.predicate) : t));
        rix = Number(t);
      }
      const rp = path.join(root, r.path);
      if (!fs.existsSync(rp)) throw new Refuse('record-missing', r.path);
      const rec = parseJSON(fs.readFileSync(rp, 'utf8'));
      recSha = sha256(rp);
      let row;
      if (r.row === null) row = rec;
      else { row = (Array.isArray(rec.rows) ? rec.rows : []).find((x) => x && typeof x === 'object' && !Array.isArray(x) && Object.prototype.hasOwnProperty.call(x, rkey) && x[rkey] === r.row); if (!row) throw new Refuse('record-row-missing', r.path + ' row ' + String(r.row)); }
      rv = d.kind === 'lean' ? ('word' in row ? row.word : row.verdict) : row.verdict;
      if (!WORDS.includes(rv)) throw new Refuse('record-verdict-word', 'the record says ' + JSON.stringify(rv));
      if (r.verdict !== rv) throw new Refuse('record-verdict-word', 'the object declares ' + JSON.stringify(r.verdict) + ', the record says ' + rv);
      const rsha = row.sha256;
      if (isStr(rsha) && /^[0-9a-f]{64}$/.test(rsha) && d.kind === 'finite' && rsha !== d.pin.sha256) throw new Refuse('record-pin-mismatch', 'the record decided ' + rsha.slice(0, 12) + '…, the object pins ' + d.pin.sha256.slice(0, 12) + '…');
      if (d.kind === 'lean') {
        if (r.value !== null) throw new Refuse('lean', 'a Lean object\'s record carries no value: the kernels\' words are the decision');
        let commit = row.commit;
        for (const blk of ['release', 'source']) if (!isStr(commit) && rec[blk] && typeof rec[blk] === 'object' && !Array.isArray(rec[blk])) commit = rec[blk].commit;
        if (!isStr(commit) && isStr(rec.commit)) commit = rec.commit;
        if (!isStr(commit)) throw new Refuse('lean', 'the lane record names no commit: nothing binds its kernels to the object\'s project');
        if (commit !== d.commit) throw new Refuse('record-pin-mismatch', 'the lane built ' + commit.slice(0, 12) + '…, the object names ' + d.commit.slice(0, 12) + '…');
        let kernels = row.kernels;
        if (!Array.isArray(kernels)) { const runs = Array.isArray(row.runs) ? row.runs : []; const last = runs.length ? runs[runs.length - 1] : null; kernels = (last && typeof last === 'object' && Array.isArray(last.kernels)) ? last.kernels : []; }
        kernels = kernels.filter(isStr);
        laneWord = LANE_KERNELS.every((want) => kernels.some((k) => k.startsWith(want))) ? WORDS[0] : kernels.some((k) => k.includes(' rejects')) ? WORDS[1] : WORDS[2];
        if (laneWord !== rv) throw new Refuse('record-decision-mismatch', 'the lane row says ' + rv + ', its kernels give ' + laneWord + ' (' + (kernels.join(' · ') || 'no kernel printed') + ')');
      }
      value = r.value === null ? null : recordValue(getPath(row, r.value), 'record.value ' + String(r.value));
      const claimStr = String(row.claim || '');
      const m = BAR_IN_CLAIM.exec(claimStr), mr = REL_IN_CLAIM.exec(claimStr);
      const recBar = m ? Q.fromDecimal(m[0]) : null, recRel = mr ? REL_WORD[mr[0]] : null;
      if (rix !== null && preds[rix].rel === 'holds' && value !== null) throw new Refuse('record-predicate', 'record.predicate ' + rix + ' is a "holds" predicate, but the record carries a value');
      const decided = [];
      preds.forEach((p, i) => {
        if (rix !== null && i !== rix) {
          if (p.rel === 'holds') decided.push(rv);
          else if (!fromObject[i]) throw new Refuse('record-predicate', 'predicate[' + i + '] stands beside the record\'s predicate ' + rix + ' and is not decidable from the object');
          else decided.push(fromObject[i].word);
          return;
        }
        if (p.rel === 'holds') { decided.push(rv); return; }
        if (p.rel !== 'in' && p.printed !== null && recBar && !recBar.eq(p.c)) throw new Refuse('record-bar-mismatch', 'the record decided ' + m[0] + ', the object states ' + p.printed);
        if (p.rel !== 'in' && p.printed !== null && recRel && recRel !== p.rel) out.notes.push('the record\'s claim prints the relation ' + mr[0] + ', the object states ' + p.rel + '; the decision below is under the object\'s');
        const fo = fromObject[i];
        if (value !== null) {
          const dv = decide(value, p.rel, p.c);
          if (fo && fo.value !== null && value[0] === 'exact' && !Q.fromString(fo.value).eq(value[1])) throw new Refuse('record-value-mismatch', 'the object gives ' + fo.value.slice(0, 40) + '…, the record holds ' + value[1].toString().slice(0, 40) + '…');
          if (fo && fo.word !== dv) throw new Refuse('record-decision-mismatch', 'from the object ' + fo.word + ', from the record\'s value ' + dv);
          decided.push(dv);
        } else if (fo) decided.push(fo.word); else decided.push(rv);
      });
      const composed = compose(decided);
      if (composed !== rv) throw new Refuse('record-decision-mismatch', 'the re-decision gives ' + composed + ', the record says ' + rv);
      out.decided = decided;
      if ('repair' in o) {
        const rep = o.repair;
        need(rep, ['printed', 'c', 'verdict', 'how'], [], 'repair');
        const ineq = rix !== null ? [preds[rix]] : preds.filter((p) => p.rel !== 'holds' && p.rel !== 'in');
        if (ineq.length !== 1 || ineq[0].rel === 'holds' || ineq[0].rel === 'in') throw new Refuse('repair', 'a repair needs exactly one inequality predicate (the record\'s, when it names one)');
        if (!WORDS.includes(rep.verdict)) throw new Refuse('repair', 'verdict ' + JSON.stringify(rep.verdict));
        const pr = printedRational(rep.printed, 'repair'), c = rational(rep.c, 'repair.c');
        if (!c.eq(pr)) throw new Refuse('repair', 'c is not the rational of ' + rep.printed);
        const rrep = row.repair && typeof row.repair === 'object' ? row.repair : null;
        if (!rrep || !String(rrep.claim || '').includes(rep.printed)) throw new Refuse('repair', 'the record holds no repair printing ' + rep.printed);
        const idx = preds.indexOf(ineq[0]);
        const srcValue = value !== null ? value : (fromObject[idx] && fromObject[idx].value ? ['exact', Q.fromString(fromObject[idx].value)] : null);
        if (!srcValue) throw new Refuse('repair', 'no value to re-decide the repair against');
        const dv = decide(srcValue, ineq[0].rel, c);
        if (dv !== rep.verdict) throw new Refuse('repair', 'the value re-decided against the repaired bar gives ' + dv + ', the object says ' + rep.verdict);
        out.decided.push('repair:' + dv);
      }
    } else if ('repair' in o) throw new Refuse('repair', 'a repair needs a record');
    else out.notes.push('no record attached' + (fromObject.some(Boolean) ? '' : ': a proposal, undecided'));

    if (v4) fourth(o, d, rv, value, recSha, laneWord, out);

    out.word = ADMITTED;
    return out;
  } catch (e) {
    if (e instanceof Refuse) { out.kind = e.kind; out.msg = e.msg; return out; }
    throw e;
  } finally {
    out.seconds = Math.round((Date.now() - t0)) / 1000;
  }
}

function check(p, root = ROOT) {
  const o = parseJSON(fs.readFileSync(p, 'utf8'));
  const res = checkObj(o, root);
  if (res.word === ADMITTED && res.id !== path.basename(p, '.json')) res.notes.push('the file name is not the id');
  return res;
}

function main(argv) {
  WORDS = loadVocab();
  const paths = argv.filter((a) => !a.startsWith('--'));
  if (!paths.length) { console.log('usage: node instruments/claimbox/check.js <object.json>...'); return 2; }
  let bad = 0;
  for (const p of paths) {
    const res = check(p);
    if (res.word === ADMITTED) {
      const fo = res.fromObject.filter(Boolean);
      const fos = fo.map((x) => x.word + (x.witness ? ' (witness ' + JSON.stringify(x.witness.at) + ', ' + x.violations + ' violating)' : '') + (x.value ? ' value ' + x.value.slice(0, 30) + (x.value.length > 30 ? '…' : '') : '')).join(' · ');
      const v4s = 'canonical' in res ? '  inputs: ' + res.inputs.map((i) => i.role + ' ' + i.reading + ' ' + i.standing).join(' · ') + ' (meet ' + res.meet + ')  canonical ' + res.canonical.slice(0, 16) : '';
      console.log('ADMITTED  ' + res.id + '  [' + res.decided.join(' · ') + ']' + (fos ? '  from the object: ' + fos : '') + v4s + '  ' + res.seconds + ' s' + res.notes.map((n) => '  note: ' + n).join(''));
    } else { bad++; console.log('REFUSED   ' + res.id + '  ' + res.kind + ': ' + res.msg); }
  }
  return bad ? 1 : 0;
}

module.exports = { check, checkObj, parseJSON, Q, loadVocab, setWords: (w) => { WORDS = w; } };
if (require.main === module) process.exit(main(process.argv.slice(2)));
