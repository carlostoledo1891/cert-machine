#!/usr/bin/env node
/* checker-web.build.js — instruments/claimbox/check.js as ONE script a browser can run, generated, never rewritten.
   playground/textbook-machine/ · cert-machine · 2026-11-12

   WHY. The textbook machine is to get a second page where real claims are decided in the visitor's tab by the JavaScript
   claim checker, with no server. check.js is a Node program: it asks for fs, path and crypto, uses process, Buffer and
   __dirname, requires the ledger's word module, and reads its vocabulary, its words and every pinned file from disk. This
   file is only that blocker: the port. The page is not built here.

   ONE MODULE. The bundle holds the BYTES of check.js between two marks (its first line, a shebang, behind "//", which is
   the only thing added inside the marks), inside a function whose parameters are the things Node would have handed it. No
   line of its logic is retyped. The sha256 of the wrapped file is written in the opening mark, and checker-web.battery.js
   refuses a bundle whose mark, whose bytes between the marks, or whose file on disk disagree. A module check.js requires
   (the ledger's words) is carried the same way, between marks of its own.

   THE FILES. Which files a claim needs is MEASURED: the real check.js is run in this process on each object with a spy on
   fs.existsSync, fs.statSync, fs.readFileSync and on the module loader, and everything it touched under the repository is
   embedded, path -> bytes, from the file on disk. Bytes that are valid UTF-8 are carried as a string, anything else as
   base64, so every file round-trips exactly; the same bytes under two paths are carried once.

   THE SHIMS, and nothing beyond what check.js calls (a use this file has no shim for is a refusal here, uses() below):
     fs       existsSync, statSync().isFile, readFileSync with and without 'utf8', over the embedded map
     path     resolve, join, normalize, relative, basename, sep, posix — POSIX semantics
     crypto   createHash('sha256').update(bytes or string).digest('hex'), synchronous, in plain JavaScript
     Buffer   from(string, 'utf8')
     process  stderr.write, exit, argv        console  log        require  fs, path, crypto and the embedded modules
   The round constants of SHA-256 are computed here in exact integer arithmetic and printed into the bundle.

   WHAT THE BUNDLE EXPOSES: one global, ClaimChecker.
     decide(objectText[, fileName]) -> { word, kind, id, notes, line, exit, stderr, error, result }
        line is the line `node instruments/claimbox/check.js <object>` prints (it carries the seconds the run took, so
        that one field is the tab's own); word is the checker's ADMITTED or REFUSED and kind its refusal kind; result is
        what check() returned, whole (decided, fromObject, inputs, meet, canonical). fileName defaults to <id>.json.
     decideFile(path)      the same for an object the bundle carries
     objects, manifest     what is embedded: every path with its sha256 and size
     text(path), sha256(path), verify()     an embedded file's text, its sha256 by the bundle's own hash, and all of them
   The bundle's world is the embedded map: a path it does not carry does not exist, whatever is on the builder's disk.

     node playground/textbook-machine/checker-web.build.js            build in memory, say whether out/ is current (exit 1 if not)
     node playground/textbook-machine/checker-web.build.js --write    write the mutants, the bundle and its manifest
     node playground/textbook-machine/checker-web.build.js [--write] --out <bundle.js> <object.json>...     another set
   MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Module = require('module');

const HERE = __dirname;
const ROOT = path.resolve(HERE, '..', '..');
const SELF = 'playground/textbook-machine/checker-web.build.js';
const CHECK_REL = 'instruments/claimbox/check.js';
const OUT_BUNDLE = 'playground/textbook-machine/out/claim-checker.js';
const VROOT = '/cert-machine';
const die = (m) => { throw new Error('checker-web build REFUSED: ' + m); };
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const posix = (p) => p.split(path.sep).join('/');
const manifestPathOf = (bundleRel) => bundleRel.replace(/\.js$/, '') + '.manifest.json';

/* ---- the first claim set: the operator's four shapes, from the objects that exist --------------------------------------
   Up to two a shape, the small ones first, so that the page shows the three words. A shape's second slot is left empty
   where no second small object exists; nothing is invented to fill it. */
const SET = [
  { shape: 'number facts', path: 'instruments/claimbox/v4/v4-int64-sum-integers.json' },
  { shape: 'number facts', path: 'playground/textbook-machine/mutants/tm-mutant-json-number.json' },
  { shape: 'interval bounds', path: 'instruments/claimbox/claims/optq-82-epi.json' },
  { shape: 'interval bounds', path: 'instruments/claimbox/claims/optq-82-pinho.json' },
  { shape: 'finite counterexamples', path: 'instruments/claimbox/v4/v4-ea-542-circle-packing.json' },
  { shape: 'register replays', path: 'instruments/claimbox/claims/optq-1d-cert2026.json' },
  { shape: 'register replays', path: 'instruments/claimbox/claims/optq-1c-rozetyp-k3072.json' }
];

/* ---- mutants: a copy of an existing object with declared edits, each of which must match exactly once. They live here,
   never under instruments/. The first is in the set (a claim REFUSED for a named reason). The two fixtures are the
   battery's alone: no existing object reads a ledger, so nothing else would make check.js require its word module. */
const MUTANTS = [
  { path: 'playground/textbook-machine/mutants/tm-mutant-json-number.json', from: 'instruments/claimbox/v4/v4-int64-sum-integers.json', kind: 'json-number',
    edits: [['"id": "v4-int64-sum-integers"', '"id": "tm-mutant-json-number"'],
      ['"c": "9223372036854775808"', '"c": 9223372036854775808'],
      ['"a synthetic calibration object: the same bytes as v4-int64-sum-int64, read as exact integers, decided CERTIFIED from the object"',
        '"a mutated copy of v4-int64-sum-integers: its bar c is written as a JSON number, which the checker refuses to read as a double"']] },
  { path: 'playground/textbook-machine/mutants/tm-fixture-ledger-witnessed.json', from: 'instruments/claimbox/claims/optq-82-epi.json', kind: 'record-pin-mismatch', fixture: true,   /* the ledger's word is read (WITNESSED -> CERTIFIED), then the row's sha256 is not the object's pin */
    edits: [['"id": "optq-82-epi"', '"id": "tm-fixture-ledger-witnessed"'], ['"path": "certs/c82-replay.json"', '"path": "certs/easota-ledger.json"'], ['"row": "epi26"', '"row": "hexagons/ours_2026"']] },
  { path: 'playground/textbook-machine/mutants/tm-fixture-ledger-repaired.json', from: 'instruments/claimbox/claims/optq-82-epi.json', kind: 'record-verdict-word', fixture: true,   /* the refusal prints what the required module answered: REPAIRED is not one of the three */
    edits: [['"id": "optq-82-epi"', '"id": "tm-fixture-ledger-repaired"'], ['"path": "certs/c82-replay.json"', '"path": "certs/easota-ledger.json"'], ['"row": "epi26"', '"row": "circles/ours_2026"']] }
];
const FIXTURES = MUTANTS.filter((m) => m.fixture).map((m) => m.path);
function deriveMutant(m) {
  let t = fs.readFileSync(path.join(ROOT, m.from), 'utf8');
  for (const [find, put] of m.edits) {
    if (t.split(find).length !== 2) die('the mutant ' + m.path + ' edits ' + JSON.stringify(find.slice(0, 50)) + ', which ' + m.from + ' holds ' + (t.split(find).length - 1) + ' times, not once');
    t = t.replace(find, () => put);
  }
  return t;
}

/* ---- the spy: the real checker, run here, and every file it touched ---------------------------------------------------- */
function spyOn(objectRels) {
  const CHECK_ABS = path.join(ROOT, CHECK_REL);
  const orig = { existsSync: fs.existsSync, statSync: fs.statSync, readFileSync: fs.readFileSync, load: Module._load };
  const builtins = new Set(), lazily = new Set();          /* lazily: the modules check.js required while deciding */
  let seen = null;
  const note = (set, p) => { if (seen && (typeof p === 'string' || Buffer.isBuffer(p))) seen[set].add(path.resolve(String(p))); };
  fs.existsSync = function (p) { note('probe', p); return orig.existsSync.apply(this, arguments); };
  fs.statSync = function (p) { note('probe', p); return orig.statSync.apply(this, arguments); };
  fs.readFileSync = function (p) { note('read', p); return orig.readFileSync.apply(this, arguments); };
  Module._load = function (request, parent) {
    if (Module.isBuiltin(request)) builtins.add(request.replace(/^node:/, ''));
    else if (seen) { try { const f = Module._resolveFilename(request, parent); seen.mod.add(f); lazily.add(f); } catch (e) { /* the loader will say so itself */ } }
    return orig.load.apply(this, arguments);
  };
  const out = { per: {}, builtins };
  try {
    delete require.cache[CHECK_ABS];
    const CHECK = require(CHECK_ABS);                     /* its top-level requires (fs, path, crypto) are noted above */
    for (const rel of objectRels) {
      for (const k of lazily) delete require.cache[k];     /* so that each object's own requires are seen, not a cached one */
      seen = { probe: new Set(), read: new Set(), mod: new Set() };
      let res;
      try { CHECK.setWords(CHECK.loadVocab()); res = CHECK.check(path.join(ROOT, rel)); }
      catch (e) { seen = null; die('check.js threw on ' + rel + ' (' + String(e && e.message).slice(0, 120) + '): an object in the set is decided or refused by name'); }
      const s = seen; seen = null;
      const files = {}, dirs = new Set();
      for (const abs of new Set([...s.probe, ...s.read, ...s.mod])) {
        if (abs !== ROOT && !abs.startsWith(ROOT + path.sep)) die(rel + ' makes check.js touch ' + abs + ', outside the repository: it cannot be embedded');
        const r = posix(path.relative(ROOT, abs));
        let st = null; try { st = orig.statSync(abs); } catch (e) { st = null; }
        if (!st) continue;                                   /* missing on disk stays missing in the bundle */
        if (st.isDirectory()) { if (r) dirs.add(r); continue; }
        files[r] = s.mod.has(abs) ? 'module' : s.read.has(abs) ? 'read' : 'probed';
      }
      files[rel] = 'object';
      out.per[rel] = { files, dirs: [...dirs].sort(), word: res.word, kind: res.kind, id: res.id };
    }
  } finally {
    fs.existsSync = orig.existsSync; fs.statSync = orig.statSync; fs.readFileSync = orig.readFileSync; Module._load = orig.load;
    delete require.cache[CHECK_ABS];
  }
  return out;
}

/* ---- the tripwire: what check.js (and a module it requires) asks of Node, read off its text ----------------------------- */
const HELD = { fs: ['existsSync', 'statSync', 'readFileSync'], path: ['resolve', 'join', 'normalize', 'relative', 'basename', 'sep', 'posix'], crypto: ['createHash'],
  Buffer: ['from'], process: ['stderr', 'exit', 'argv'], console: ['log'] };
function uses(src, label) {
  for (const obj of Object.keys(HELD)) {
    const got = new Set([...src.matchAll(new RegExp('(?<![A-Za-z0-9_$.])' + obj + '\\.(?:posix\\.)?([A-Za-z_]+)', 'g'))].map((m) => m[1]));
    const extra = [...got].filter((k) => !HELD[obj].includes(k));
    if (extra.length) die(label + ' uses ' + obj + '.' + extra.join(', ' + obj + '.') + ', which the bundle has no shim for');
  }
  for (const m of src.matchAll(/(?<![A-Za-z0-9_$.])require\(\s*'([^']+)'\s*\)/g)) if (!(m[1] in HELD) && !/^[./]/.test(m[1])) die(label + ' requires ' + m[1] + ', which the bundle has no shim for');
  for (const bad of ['</script', '<!--', '@@CHECK-JS-', '@@MODULE-']) if (src.toLowerCase().includes(bad.toLowerCase())) die(label + ' contains ' + bad + ', which cannot be carried between the marks');
}

/* ---- the round constants of SHA-256, exactly: the first 32 bits of the fractional parts of the cube roots (K) and the
   square roots (H) of the first primes, by integer roots of p·2^96 and p·2^64 ---- */
function shaConstants() {
  const primes = []; for (let n = 2; primes.length < 64; n++) if (primes.every((p) => n % p)) primes.push(n);
  const iroot = (x, k) => { let lo = 0n, hi = 1n << 48n; while (lo < hi) { const mid = (lo + hi + 1n) >> 1n; if (mid ** k <= x) lo = mid; else hi = mid - 1n; } return lo; };
  const K = primes.map((p) => Number(iroot(BigInt(p) << 96n, 3n) & 0xffffffffn));
  const H = primes.slice(0, 8).map((p) => Number(iroot(BigInt(p) << 64n, 2n) & 0xffffffffn));
  if (K[0] !== 0x428a2f98 || K[63] !== 0xc67178f2 || H[0] !== 0x6a09e667 || H[7] !== 0x5be0cd19) die('the SHA-256 constants did not come out as FIPS 180-4 prints them');
  return { K, H };
}

/* ---- the runtime: this function's own text is printed into the bundle, so it may use nothing but its arguments --------- */
/* eslint-disable */
function RUNTIME(VROOT, MANIFEST, SHA, BLOBS, MODULES, CHECKER) {
  var has = function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); };

  /* ---- bytes and text: UTF-8 both ways as Node does it (WHATWG: one U+FFFD per ill-formed run, a lone surrogate written
     as EF BF BD), base64, SHA-256 (FIPS 180-4) ---- */
  function utf8enc(s) {
    var n = s.length, len = 0, i, c, d;
    for (i = 0; i < n; i++) {
      c = s.charCodeAt(i);
      if (c < 0x80) len += 1; else if (c < 0x800) len += 2;
      else if (c >= 0xD800 && c <= 0xDBFF && i + 1 < n && (d = s.charCodeAt(i + 1)) >= 0xDC00 && d <= 0xDFFF) { len += 4; i++; }
      else len += 3;
    }
    var out = new Uint8Array(len), o = 0;
    for (i = 0; i < n; i++) {
      c = s.charCodeAt(i);
      if (c < 0x80) { out[o++] = c; continue; }
      if (c < 0x800) { out[o++] = 0xC0 | (c >> 6); out[o++] = 0x80 | (c & 0x3F); continue; }
      if (c >= 0xD800 && c <= 0xDFFF) {
        if (c <= 0xDBFF && i + 1 < n && (d = s.charCodeAt(i + 1)) >= 0xDC00 && d <= 0xDFFF) {
          c = 0x10000 + ((c - 0xD800) << 10) + (d - 0xDC00); i++;
          out[o++] = 0xF0 | (c >> 18); out[o++] = 0x80 | ((c >> 12) & 0x3F); out[o++] = 0x80 | ((c >> 6) & 0x3F); out[o++] = 0x80 | (c & 0x3F);
          continue;
        }
        c = 0xFFFD;
      }
      out[o++] = 0xE0 | (c >> 12); out[o++] = 0x80 | ((c >> 6) & 0x3F); out[o++] = 0x80 | (c & 0x3F);
    }
    return out;
  }
  function utf8dec(b) {
    var parts = [], buf = [], n = b.length, i, x, cp = 0, need = 0, seen = 0, lo = 0x80, hi = 0xBF;
    var push = function (c) {
      if (c > 0xFFFF) { c -= 0x10000; buf.push(0xD800 + (c >> 10), 0xDC00 + (c & 0x3FF)); } else buf.push(c);
      if (buf.length >= 8192) { parts.push(String.fromCharCode.apply(null, buf)); buf = []; }
    };
    for (i = 0; i < n; i++) {
      x = b[i];
      if (need === 0) {
        if (x <= 0x7F) push(x);
        else if (x >= 0xC2 && x <= 0xDF) { need = 1; cp = x & 0x1F; }
        else if (x >= 0xE0 && x <= 0xEF) { if (x === 0xE0) lo = 0xA0; if (x === 0xED) hi = 0x9F; need = 2; cp = x & 0xF; }
        else if (x >= 0xF0 && x <= 0xF4) { if (x === 0xF0) lo = 0x90; if (x === 0xF4) hi = 0x8F; need = 3; cp = x & 0x7; }
        else push(0xFFFD);
        continue;
      }
      if (x < lo || x > hi) { cp = need = seen = 0; lo = 0x80; hi = 0xBF; i--; push(0xFFFD); continue; }
      lo = 0x80; hi = 0xBF; cp = (cp << 6) | (x & 0x3F);
      if (++seen === need) { push(cp); cp = need = seen = 0; }
    }
    if (need) push(0xFFFD);
    parts.push(String.fromCharCode.apply(null, buf));
    return parts.join('');
  }
  var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/', B64V = null;
  function b64dec(s) {
    var i;
    if (!B64V) { B64V = {}; for (i = 0; i < 64; i++) B64V[B64.charAt(i)] = i; }
    var n = s.length, pad = n && s.charAt(n - 1) === '=' ? (s.charAt(n - 2) === '=' ? 2 : 1) : 0;
    if (n % 4) throw new Error('claim-checker: base64 of a length that is not a multiple of 4');
    var out = new Uint8Array(n / 4 * 3 - pad), o = 0, v;
    for (i = 0; i < n; i += 4) {
      v = (B64V[s.charAt(i)] << 18) | (B64V[s.charAt(i + 1)] << 12) | ((B64V[s.charAt(i + 2)] || 0) << 6) | (B64V[s.charAt(i + 3)] || 0);
      if (o < out.length) out[o++] = (v >> 16) & 255;
      if (o < out.length) out[o++] = (v >> 8) & 255;
      if (o < out.length) out[o++] = v & 255;
    }
    return out;
  }
  function hex(b) { var s = '', i; for (i = 0; i < b.length; i++) s += (b[i] < 16 ? '0' : '') + b[i].toString(16); return s; }
  function sha256hex(m) {
    var K = SHA.K, H = SHA.H.slice(), l = m.length, n = (((l + 9 + 63) / 64) | 0) * 64, p = new Uint8Array(n), w = new Int32Array(64);
    var hiBits = Math.floor(l / 0x20000000), loBits = (l << 3) >>> 0, off, i, j, a, b, c, d, e, f, g, h, s0, s1, t1, t2, x, s = '';
    p.set(m); p[l] = 0x80;
    p[n - 8] = hiBits >>> 24; p[n - 7] = (hiBits >>> 16) & 255; p[n - 6] = (hiBits >>> 8) & 255; p[n - 5] = hiBits & 255;
    p[n - 4] = loBits >>> 24; p[n - 3] = (loBits >>> 16) & 255; p[n - 2] = (loBits >>> 8) & 255; p[n - 1] = loBits & 255;
    for (off = 0; off < n; off += 64) {
      for (i = 0; i < 16; i++) { j = off + i * 4; w[i] = (p[j] << 24) | (p[j + 1] << 16) | (p[j + 2] << 8) | p[j + 3]; }
      for (i = 16; i < 64; i++) {
        x = w[i - 15]; s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
        x = w[i - 2]; s1 = ((x >>> 17) | (x << 15)) ^ ((x >>> 19) | (x << 13)) ^ (x >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      a = H[0]; b = H[1]; c = H[2]; d = H[3]; e = H[4]; f = H[5]; g = H[6]; h = H[7];
      for (i = 0; i < 64; i++) {
        s1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        t1 = (h + s1 + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
        s0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        t2 = (s0 + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    for (i = 0; i < 8; i++) s += ('0000000' + (H[i] >>> 0).toString(16)).slice(-8);
    return s;
  }

  /* ---- path, POSIX; the working directory is the repository's root, as it is when the checker is run by hand ---- */
  function str(x, what) { if (typeof x !== 'string') { var e = new TypeError('The "' + what + '" argument must be of type string'); e.code = 'ERR_INVALID_ARG_TYPE'; throw e; } return x; }
  function normalize(p) {
    str(p, 'path'); if (p === '') return '.';
    var abs = p.charAt(0) === '/', trail = p.charAt(p.length - 1) === '/', segs = p.split('/'), out = [], i, s, r;
    for (i = 0; i < segs.length; i++) {
      s = segs[i];
      if (s === '' || s === '.') continue;
      if (s === '..') { if (out.length && out[out.length - 1] !== '..') out.pop(); else if (!abs) out.push('..'); } else out.push(s);
    }
    r = out.join('/');
    if (!r && !abs) r = '.';
    if (r && trail) r += '/';
    return abs ? '/' + r : r;
  }
  function join() { var parts = [], i; for (i = 0; i < arguments.length; i++) { str(arguments[i], 'path'); if (arguments[i].length) parts.push(arguments[i]); } return parts.length ? normalize(parts.join('/')) : '.'; }
  function resolve() {
    var r = '', abs = false, i, a, n;
    for (i = arguments.length - 1; i >= -1 && !abs; i--) { a = i >= 0 ? str(arguments[i], 'paths[' + i + ']') : VROOT; if (!a.length) continue; r = a + '/' + r; abs = a.charAt(0) === '/'; }
    n = normalize('/' + r);
    return n.length > 1 && n.charAt(n.length - 1) === '/' ? n.slice(0, -1) : n;
  }
  function relative(from, to) {
    from = resolve(str(from, 'from')); to = resolve(str(to, 'to'));
    if (from === to) return '';
    var f = from === '/' ? [] : from.slice(1).split('/'), t = to === '/' ? [] : to.slice(1).split('/'), i = 0, out = [], j;
    while (i < f.length && i < t.length && f[i] === t[i]) i++;
    for (j = i; j < f.length; j++) out.push('..');
    return out.concat(t.slice(i)).join('/');
  }
  function basename(p, ext) {
    str(p, 'path'); if (ext !== undefined) str(ext, 'suffix');
    if (ext !== undefined && ext.length && ext === p) return '';
    var e = p.length, s, b;
    while (e > 0 && p.charAt(e - 1) === '/') e--;
    s = e > 0 ? p.lastIndexOf('/', e - 1) + 1 : 0; b = p.slice(s, e);
    if (ext !== undefined && ext.length && b.length > ext.length && b.slice(b.length - ext.length) === ext) b = b.slice(0, b.length - ext.length);
    return b;
  }
  var PATH = { resolve: resolve, join: join, normalize: normalize, relative: relative, basename: basename, sep: '/' };
  PATH.posix = PATH;

  /* ---- fs over the embedded map: a path the bundle does not carry does not exist ---- */
  var FILES = MANIFEST.files, DIRS = { '': true }, OVERLAY = null;
  (function () {
    var k, i, parts;
    for (k in FILES) if (has(FILES, k)) { parts = k.split('/'); for (i = 1; i < parts.length; i++) DIRS[parts.slice(0, i).join('/')] = true; }
    for (i = 0; i < MANIFEST.dirs.length; i++) DIRS[MANIFEST.dirs[i]] = true;
  })();
  function entry(p) {
    if (typeof p !== 'string' || p.indexOf('\u0000') >= 0) return null;
    var abs = resolve(p), trail = p.length > 1 && p.charAt(p.length - 1) === '/', rel;
    if (abs === VROOT) rel = ''; else if (abs.indexOf(VROOT + '/') === 0) rel = abs.slice(VROOT.length + 1); else return null;
    if (OVERLAY && has(OVERLAY, rel)) return trail ? null : { file: rel, overlay: true };
    if (has(FILES, rel)) return trail ? null : { file: rel };
    if (has(DIRS, rel)) return { dir: rel };
    return null;
  }
  function bytesOf(rel) { var b = BLOBS[FILES[rel][0]]; if (!b.bytes) b.bytes = b[0] === 'u' ? utf8enc(b[1]) : b64dec(b[1]); return b.bytes; }
  function textOf(rel) { var b = BLOBS[FILES[rel][0]]; if (b.text === undefined) b.text = b[0] === 'u' ? b[1] : utf8dec(bytesOf(rel)); return b.text; }
  function fsError(code, text, op, p) { var e = new Error(code + ': ' + text + ', ' + op + (p === undefined ? '' : " '" + p + "'")); e.code = code; return e; }
  var FS = {
    existsSync: function (p) { return entry(p) !== null; },
    statSync: function (p) {
      var en = entry(str(p, 'path')); if (!en) throw fsError('ENOENT', 'no such file or directory', 'stat', p);
      var isF = en.file !== undefined;
      return { isFile: function () { return isF; }, isDirectory: function () { return !isF; }, size: isF ? (en.overlay ? utf8enc(OVERLAY[en.file]).length : FILES[en.file][2]) : 0 };
    },
    readFileSync: function (p, enc) {
      var en = entry(str(p, 'path')), encoding = enc && typeof enc === 'object' ? enc.encoding : enc;
      if (!en) throw fsError('ENOENT', 'no such file or directory', 'open', p);
      if (en.file === undefined) throw fsError('EISDIR', 'illegal operation on a directory', 'read');   /* Node names no path here: the read fails on the open descriptor */
      if (encoding === 'utf8' || encoding === 'utf-8') return en.overlay ? OVERLAY[en.file] : textOf(en.file);
      if (encoding === undefined || encoding === null) return en.overlay ? utf8enc(OVERLAY[en.file]) : new Uint8Array(bytesOf(en.file));
      throw new Error('claim-checker: the fs shim reads bytes or utf8, asked for ' + String(encoding));
    }
  };

  /* ---- crypto, Buffer, process, console ---- */
  var CRYPTO = { createHash: function (alg) {
    if (alg !== 'sha256') throw new Error('claim-checker: the crypto shim holds sha256, asked for ' + String(alg));
    var parts = [], h = {
      update: function (d) { if (typeof d === 'string') d = utf8enc(d); else if (!(d instanceof Uint8Array)) throw new TypeError('claim-checker: update takes bytes or a string'); parts.push(d); return h; },
      digest: function (enc) {
        if (enc !== 'hex') throw new Error('claim-checker: the crypto shim digests to hex, asked for ' + String(enc));
        var n = 0, i, o = 0, all; for (i = 0; i < parts.length; i++) n += parts[i].length;
        all = new Uint8Array(n); for (i = 0; i < parts.length; i++) { all.set(parts[i], o); o += parts[i].length; }
        return sha256hex(all);
      } };
    return h;
  } };
  var BUFFER = { from: function (s, enc) { if (typeof s !== 'string' || (enc !== undefined && enc !== 'utf8' && enc !== 'utf-8')) throw new TypeError('claim-checker: the Buffer shim holds from(string, "utf8")'); return utf8enc(s); } };
  function Exit(code) { this.code = code; }
  var CUR = null;
  var PROCESS = { argv: ['node', VROOT + '/' + MANIFEST.checker.path],
    stderr: { write: function (s) { if (CUR) CUR.err.push(String(s)); return true; } },
    exit: function (c) { throw new Exit(c === undefined ? 0 : c); } };
  var CONSOLE = { log: function () { if (CUR) CUR.out.push(Array.prototype.join.call(arguments, ' ')); } };

  /* ---- require: the three shims, and a module the bundle carries between its own marks ---- */
  var LOADED = {};
  function dirOf(abs) { return abs.slice(0, abs.lastIndexOf('/')); }
  function load(rel) {
    if (has(LOADED, rel)) return LOADED[rel].exports;
    var m = { exports: {} }, abs = VROOT + '/' + rel;
    LOADED[rel] = m;
    MODULES[rel].call(m.exports, makeRequire(dirOf(abs)), m, m.exports, dirOf(abs), abs, PROCESS, BUFFER, CONSOLE);
    return m.exports;
  }
  function makeRequire(dir) {
    var req = function (id) {
      if (id === 'fs') return FS;
      if (id === 'path') return PATH;
      if (id === 'crypto') return CRYPTO;
      if (typeof id === 'string' && (id.charAt(0) === '/' || id.charAt(0) === '.')) {
        var abs = resolve(dir, id), rel = abs.indexOf(VROOT + '/') === 0 ? abs.slice(VROOT.length + 1) : null;
        if (rel !== null && has(MODULES, rel)) return load(rel);
        if (rel !== null && has(MODULES, rel + '.js')) return load(rel + '.js');
      }
      var e = new Error("Cannot find module '" + String(id) + "'"); e.code = 'MODULE_NOT_FOUND'; throw e;
    };
    req.main = undefined;   /* so that check.js does not run its own command line when it is loaded */
    return req;
  }

  /* ---- the checker, loaded once, and one object through its own main() ---- */
  var API = null;
  function api() {
    if (!API) {
      var m = { exports: {} }, abs = VROOT + '/' + MANIFEST.checker.path;
      API = CHECKER.call(m.exports, makeRequire(dirOf(abs)), m, m.exports, dirOf(abs), abs, PROCESS, BUFFER, CONSOLE, function (r) { if (CUR) CUR.res = r; });
    }
    return API;
  }
  function run(p) {
    var a = api(), cap = { out: [], err: [], res: null }, code = null, error = null, r;
    CUR = cap;
    try { code = a.main([p]); }
    catch (e) {
      if (e instanceof Exit) code = e.code;
      else { code = 1; error = (e && e.name ? e.name + ': ' : '') + (e && e.message !== undefined ? e.message : String(e)); }
    } finally { CUR = null; }
    r = cap.res;
    return { word: r ? r.word : null, kind: r ? r.kind : null, id: r ? r.id : null, notes: r ? r.notes : [], line: cap.out.length ? cap.out.join('\n') : null,
      exit: code, stderr: cap.err.join(''), error: error, result: r };
  }
  var INBOX = '.claim-checker-inbox';
  function nameOf(text) {
    var o = null;
    try { o = api().parseJSON(text); } catch (e) { o = null; }
    return o && typeof o === 'object' && typeof o.id === 'string' && /^[A-Za-z0-9._-]+$/.test(o.id) && o.id !== '.' && o.id !== '..' ? o.id + '.json' : 'object.json';
  }
  function decide(text, fileName) {
    if (typeof text !== 'string') throw new TypeError('ClaimChecker.decide takes the text of a claim object');
    var name = fileName === undefined ? nameOf(text) : basename(String(fileName));
    if (!name || name === '.' || name === '..') name = 'object.json';
    OVERLAY = {}; OVERLAY[INBOX + '/' + name] = text;
    try { return run(INBOX + '/' + name); } finally { OVERLAY = null; }
  }
  function known(p) { if (typeof p !== 'string' || !has(FILES, p)) throw new Error('ClaimChecker: the bundle does not carry ' + String(p)); return p; }
  function decideFile(p) { return run(known(p)); }
  function verify() {
    var bad = [], n = 0, k;
    for (k in FILES) if (has(FILES, k)) { n++; if (sha256hex(bytesOf(k)) !== FILES[k][1] || bytesOf(k).length !== FILES[k][2]) bad.push(k); }
    return { files: n, ok: bad.length === 0, bad: bad };
  }
  return { decide: decide, decideFile: decideFile, objects: MANIFEST.objects, manifest: MANIFEST,
    text: function (p) { return textOf(known(p)); }, sha256: function (p) { return sha256hex(bytesOf(known(p))); }, verify: verify,
    _shims: { utf8enc: utf8enc, utf8dec: utf8dec, b64dec: b64dec, hex: hex, sha256hex: sha256hex, path: PATH, fs: FS } };
}
/* eslint-enable */

/* ---- the bundle ----------------------------------------------------------------------------------------------------------- */
const LS = String.fromCharCode(0x2028), PS = String.fromCharCode(0x2029);   /* the two line separators, never typed */
const lit = (s) => JSON.stringify(s).split("<").join("\\u003c").split(LS).join("\\u2028").split(PS).join("\\u2029");
function between(kind, rel, buf) {
  const src = buf.toString('utf8');
  if (!Buffer.from(src, 'utf8').equals(buf)) die(rel + ' is not valid UTF-8: its bytes cannot be carried as code');
  uses(src, rel);
  const prefix = src.startsWith('#!') ? '//' : '';
  return '/*@@' + kind + '-BEGIN path=' + rel + ' sha256=' + sha(buf) + ' prefix=' + prefix.length + '@@*/\n' + prefix + src + '\n/*@@' + kind + '-END@@*/\n';
}
/* what a bundle's text says it wraps: [{ kind, path, sha256 (recorded), inner (the bytes between the marks, prefix off) }] */
function marks(bundleText) {
  const out = [];
  for (const m of bundleText.matchAll(/\/\*@@(CHECK-JS|MODULE)-BEGIN path=(\S+) sha256=([0-9a-f]{64}) prefix=(\d)@@\*\/\n([\s\S]*?)\n\/\*@@\1-END@@\*\/\n/g))
    out.push({ kind: m[1], path: m[2], sha256: m[3], inner: Buffer.from(m[5].slice(Number(m[4])), 'utf8') });
  return out;
}

/* build(objects, opts) -> { bundle (text), manifest (object), manifestText }
   objects   [{ path, shape? }] or [path], repository-relative
   opts.out      the bundle's own repository-relative path, for the manifest (default OUT_BUNDLE)
   opts.overlay  { path: Buffer } — THE BATTERY'S ALONE: embed these bytes in place of the file on disk, to build the red
                 controls. A bundle built with one says so in its manifest (overlay: [...]) and the command line never sets it. */
function build(objects, opts) {
  const o = opts || {};
  const list = objects.map((x) => (typeof x === 'string' ? { path: x } : x));
  const outRel = o.out || OUT_BUNDLE;
  for (const m of MUTANTS) {
    const p = path.join(ROOT, m.path);
    if (list.some((x) => x.path === m.path) && (!fs.existsSync(p) || fs.readFileSync(p, 'utf8') !== deriveMutant(m))) die(m.path + ' is not its declared derivation from ' + m.from + ': node ' + SELF + ' --write');
  }
  for (const x of list) if (!fs.existsSync(path.join(ROOT, x.path))) die('no object at ' + x.path);
  const spy = spyOn(list.map((x) => x.path));
  for (const b of spy.builtins) if (!(b in HELD)) die('check.js requires ' + b + ', which the bundle has no shim for');
  const overlay = o.overlay || {};
  const read = (rel) => (rel in overlay ? overlay[rel] : fs.readFileSync(path.join(ROOT, rel)));

  const use = {}, dirs = new Set(), rank = { object: 4, module: 3, read: 2, probed: 1 };
  for (const x of list) { const s = spy.per[x.path]; for (const [f, u] of Object.entries(s.files)) if (!(f in use) || rank[u] > rank[use[f]]) use[f] = u; s.dirs.forEach((d) => dirs.add(d)); }
  const checkBuf = fs.readFileSync(path.join(ROOT, CHECK_REL));
  const blobs = [], blobOf = {}, files = {}, fileRows = [];
  for (const rel of Object.keys(use).sort()) {
    const buf = read(rel), h = sha(buf), s = buf.toString('utf8'), utf8 = Buffer.from(s, 'utf8').equals(buf);
    if (!(h in blobOf)) { blobOf[h] = blobs.length; blobs.push(utf8 ? ['u', s] : ['b', buf.toString('base64')]); }
    files[rel] = [blobOf[h], h, buf.length, use[rel]];
    fileRows.push({ path: rel, sha256: h, bytes: buf.length, use: use[rel], encoding: utf8 ? 'utf8' : 'base64', blob: blobOf[h] });
  }
  const modules = Object.keys(use).filter((f) => use[f] === 'module').sort();
  const inner = {
    generator: SELF, vroot: VROOT,
    checker: { path: CHECK_REL, sha256: sha(checkBuf), bytes: checkBuf.length },
    modules: modules.map((f) => ({ path: f, sha256: files[f][1], bytes: files[f][2] })),
    objects: list.map((x) => ({ path: x.path, shape: x.shape || null, sha256: files[x.path][1], bytes: files[x.path][2], needs: Object.keys(spy.per[x.path].files).filter((f) => f !== x.path).sort() })),
    files, dirs: [...dirs].sort()
  };
  const K = shaConstants();
  const head = '/* claim-checker.js — GENERATED by ' + SELF + '. Do not edit: rebuild.\n'
    + '   The claim checker ' + CHECK_REL + ', byte for byte between the two CHECK-JS marks below (its first line, a shebang,\n'
    + '   behind "//"), wrapped in a function that hands it shims of fs, path, crypto, Buffer, process and console over the\n'
    + '   files embedded here. Nothing is fetched and no text is evaluated. One global: ClaimChecker.\n'
    + '   checker  ' + CHECK_REL + '  sha256 ' + inner.checker.sha256 + '  ' + checkBuf.length + ' bytes\n'
    + '   files    ' + fileRows.length + ' embedded, ' + fileRows.reduce((a, r) => a + r.bytes, 0) + ' bytes; ' + list.length + ' claim objects\n'
    + '   MIT (the code); each embedded corpus file stays under the license of its source */\n';
  const bundle = head
    + '(function (GLOBAL) {\n\'use strict\';\n'
    + 'var VROOT = ' + lit(VROOT) + ';\n'
    + 'var MANIFEST = ' + JSON.stringify(inner, null, 1).replace(/</g, '\\u003c') + ';\n'
    + 'var SHA = { K: [' + K.K.map((k) => '0x' + k.toString(16).padStart(8, '0')).join(', ') + '],\n  H: [' + K.H.map((k) => '0x' + k.toString(16).padStart(8, '0')).join(', ') + '] };\n'
    + 'var BLOBS = [\n' + blobs.map((b) => '[' + lit(b[0]) + ', ' + lit(b[1]) + ']').join(',\n') + '\n];\n'
    + 'var MODULES = {};\n'
    + modules.map((f) => 'MODULES[' + lit(f) + '] = function (require, module, exports, __dirname, __filename, process, Buffer, console) {\n' + between('MODULE', f, read(f)) + '};\n').join('')
    + 'function CHECKER(require, module, exports, __dirname, __filename, process, Buffer, console, __tap) {\n'
    + between('CHECK-JS', CHECK_REL, checkBuf)
    + '/* after the checker\'s own bytes, in its scope: main() goes on calling check(), which now also hands what it returned to\n'
    + '   the caller of this bundle, unchanged; and main and parseJSON are handed out */\n'
    + ';check = (function (inner) { return function () { var r = inner.apply(this, arguments); __tap(r); return r; }; })(check);\n'
    + 'return { main: main, parseJSON: parseJSON };\n}\n'
    + 'var RUNTIME = ' + RUNTIME.toString() + ';\n'
    + 'GLOBAL.ClaimChecker = RUNTIME(VROOT, MANIFEST, SHA, BLOBS, MODULES, CHECKER);\n'
    + '})(typeof globalThis !== \'undefined\' ? globalThis : typeof self !== \'undefined\' ? self : this);\n';
  const bytesBy = {}; for (const r of fileRows) bytesBy[r.use] = (bytesBy[r.use] || 0) + r.bytes;
  const uniq = {}; for (const r of fileRows) uniq[r.sha256] = r.bytes;
  const manifest = {
    what: 'The browser bundle of the claim checker: ' + CHECK_REL + ' wrapped byte for byte, with the files the listed claim objects make it read, each embedded from the file on disk. Written by ' + SELF + '; held to Node by playground/textbook-machine/checker-web.battery.js.',
    bundle: { path: outRel, sha256: sha(Buffer.from(bundle, 'utf8')), bytes: Buffer.byteLength(bundle, 'utf8') },
    checker: inner.checker, modules: inner.modules,
    objects: inner.objects.map((x) => Object.assign({}, x, { node: { word: spy.per[x.path].word, kind: spy.per[x.path].kind } })),
    files: fileRows, dirs: inner.dirs,
    totals: { files: fileRows.length, embeddedBytes: fileRows.reduce((a, r) => a + r.bytes, 0), carriedOnceBytes: Object.values(uniq).reduce((a, b) => a + b, 0), bytesByUse: bytesBy,
      base64Files: fileRows.filter((r) => r.encoding === 'base64').length, bundleBytes: Buffer.byteLength(bundle, 'utf8') }
  };
  if (Object.keys(overlay).length) manifest.overlay = Object.keys(overlay).sort();
  return { bundle, manifest, manifestText: JSON.stringify(manifest, null, 1) + '\n' };
}

if (require.main === module) {
  try {
    const argv = process.argv.slice(2), write = argv.includes('--write');
    const oi = argv.indexOf('--out');
    const outRel = oi >= 0 ? posix(path.relative(ROOT, path.resolve(argv[oi + 1]))) : OUT_BUNDLE;
    const given = argv.filter((a, i) => !a.startsWith('--') && (oi < 0 || i !== oi + 1)).map((a) => posix(path.relative(ROOT, path.resolve(a))));
    if (given.length && oi < 0) die('another set is written to its own file: --out <bundle.js> (the default path holds the first claim set)');
    if (write) for (const m of MUTANTS) { const p = path.join(ROOT, m.path), t = deriveMutant(m); fs.mkdirSync(path.dirname(p), { recursive: true }); if (!fs.existsSync(p) || fs.readFileSync(p, 'utf8') !== t) { fs.writeFileSync(p, t); console.log('wrote ' + m.path); } }
    const B = build(given.length ? given : SET, { out: outRel });
    const bp = path.join(ROOT, outRel), mp = path.join(ROOT, manifestPathOf(outRel));
    const M = B.manifest;
    for (const x of M.objects) console.log('  ' + (x.shape || 'object').padEnd(23) + x.path + '  ' + x.node.word + (x.node.kind ? ' ' + x.node.kind : '') + '  needs ' + x.needs.length + ' files');
    for (const r of M.files) console.log('  ' + String(r.bytes).padStart(8) + '  ' + r.use.padEnd(7) + r.encoding.padEnd(7) + r.path);
    console.log('  ' + M.totals.files + ' files, ' + M.totals.embeddedBytes + ' bytes (' + M.totals.carriedOnceBytes + ' carried once); bundle ' + M.bundle.bytes + ' bytes, sha256 ' + M.bundle.sha256.slice(0, 16) + '…');
    if (write) {
      fs.mkdirSync(path.dirname(bp), { recursive: true });
      fs.writeFileSync(bp, B.bundle); fs.writeFileSync(mp, B.manifestText);
      console.log('wrote ' + outRel + ' and ' + manifestPathOf(outRel));
    } else {
      const cur = fs.existsSync(bp) && fs.readFileSync(bp, 'utf8') === B.bundle && fs.existsSync(mp) && fs.readFileSync(mp, 'utf8') === B.manifestText;
      console.log(cur ? outRel + ' is current' : outRel + ' is NOT what this build gives: node ' + SELF + ' --write');
      process.exit(cur ? 0 : 1);
    }
  } catch (e) { console.error(e.message); process.exit(2); }
}
module.exports = { build, marks, deriveMutant, manifestPathOf, SET, MUTANTS, FIXTURES, CHECK_REL, OUT_BUNDLE, ROOT, VROOT, HELD };
