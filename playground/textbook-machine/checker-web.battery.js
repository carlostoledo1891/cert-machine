#!/usr/bin/env node
/* checker-web.battery.js — the browser bundle of the claim checker, held to Node.
   playground/textbook-machine/ · cert-machine · 2026-11-12

     node playground/textbook-machine/checker-web.battery.js            every check and every red control; exit 1 on any failure
     node playground/textbook-machine/checker-web.battery.js --chrome   the same, and the bundle once in real headless Chrome

   The bundle (out/claim-checker.js, written by checker-web.build.js) is instruments/claimbox/check.js wrapped byte for
   byte with shims of fs, path, crypto, Buffer, process and console over embedded files. This file is the proof that it
   decides as `node instruments/claimbox/check.js <object>` does.

   IT REFUSES FIRST: a bundle whose recorded check.js sha256 is not the file on disk, or whose bytes between the marks are
   not the recorded ones, is not tested at all.

   WHAT IT HOLDS, each against something that is not the bundle:
     the build          out/claim-checker.js and its manifest re-derive byte for byte; the mutants are their declared edits
     the sandbox        the bundle runs in a bare vm context: no require, process, Buffer, module, console, TextEncoder,
                        atob, fetch or timers, and code generation from strings switched off (an eval would throw)
     the shims          SHA-256 against Node's crypto on every embedded file and on byte strings of every length from 0
                        to 200; UTF-8 both ways against Buffer on ill-formed bytes and lone surrogates; base64; path
                        against path.posix; the embedded file map against the real file system
     the decisions      for every object of the set: the line (the seconds apart: that field is a stopwatch), the exit
                        code, the word, the refusal kind and everything check() returned, against the Node command line
                        and the Node module; the same for existing objects outside the set whose files the bundle carries,
                        for the two ledger fixtures (which make check.js require its word module) and for odd inputs
     the file list      Node, run in a temporary tree holding ONLY the embedded files, prints the same lines
   RED CONTROLS, each of which must fire as named: one byte changed in a pinned source, and in pinned domain bytes (set to
   0xFF, so the file is carried as base64) -> the pin-mismatch Node gives in a temporary copy of the tree with the same
   byte changed; an ill-formed source re-pinned -> the same line as Node; a JSON number planted -> json-number, on both
   sides; a verdict.js without its three words -> both refuse to run, exit 2; a record with its word moved -> the bundle no
   longer agrees with the repository (the comparison can fail); a stale recorded sha256, a byte changed between the marks
   and a changed check.js on disk -> each refused by the gate. The repository is never changed: every altered file lives
   in the system's temporary directory and is removed. */
'use strict';
const fs = require('fs');
const os = require('os');
const vm = require('vm');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');
const B = require('./checker-web.build.js');

const ROOT = B.ROOT;
const CHECK = path.join(ROOT, B.CHECK_REL);
const BUNDLE = path.join(ROOT, B.OUT_BUNDLE);
const MANIFEST = path.join(ROOT, B.manifestPathOf(B.OUT_BUNDLE));
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel));
const text = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/* the one field of a line that is not a decision: "  0.004 s", the wall time of that run */
const mask = (line) => (line === null ? null : line.replace(/  \d+(?:\.\d+)? s(?=  note: |$)/, '  # s'));

const TEMP = [];
const tempDir = () => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'claim-checker-')); TEMP.push(d); return d; };
const cleanup = () => { for (const d of TEMP.splice(0)) { try { fs.rmSync(d, { recursive: true, force: true }); } catch (e) { /* the OS empties its temp dir in time */ } } };

/* ---- Node, the authority: the command line (the line, the exit code) and the module (what check() returned) ----------- */
function cli(checkJs, objectPath) {
  const r = cp.spawnSync(process.execPath, [checkJs, objectPath], { cwd: path.resolve(path.dirname(checkJs), '..', '..'), encoding: 'utf8' });
  return { status: r.status, line: r.stdout === '' ? null : r.stdout.replace(/\n$/, ''), err: r.stderr };
}
const NODE = require(CHECK);
NODE.setWords(NODE.loadVocab());
const view = (r) => (r ? JSON.stringify({ word: r.word, kind: r.kind, msg: r.msg, id: r.id, decided: r.decided, fromObject: r.fromObject, notes: r.notes, inputs: r.inputs, meet: r.meet, canonical: r.canonical }) : null);

/* a temporary tree holding check.js and the listed files and nothing else, with some bytes replaced */
function tree(files, overlay) {
  const dir = tempDir();
  for (const rel of [B.CHECK_REL].concat(files)) {
    const p = path.join(dir, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, overlay && rel in overlay ? overlay[rel] : read(rel));
  }
  return dir;
}

/* ---- the bundle in a bare context ----------------------------------------------------------------------------------------- */
const HOST = ['require', 'process', 'Buffer', 'module', 'exports', '__dirname', '__filename', 'fs', 'console', 'TextEncoder', 'TextDecoder', 'atob', 'btoa', 'fetch',
  'XMLHttpRequest', 'WebSocket', 'importScripts', 'setTimeout', 'setInterval', 'queueMicrotask', 'crypto', 'window', 'document', 'self', 'global'];
function sandbox(bundleText) {
  const ctx = vm.createContext({}, { codeGeneration: { strings: false, wasm: false } });
  const run = (src) => vm.runInContext(src, ctx, { timeout: 120000 });
  run('delete globalThis.console');            /* V8 gives every context an inert console of its own; the sandbox has none */
  const names = () => JSON.parse(run('JSON.stringify(Object.getOwnPropertyNames(globalThis))'));
  const before = names();
  vm.runInContext(bundleText, ctx, { filename: 'claim-checker.js', timeout: 120000 });
  const call = (expr) => JSON.parse(run('JSON.stringify(' + expr + ')'));
  return {
    call,
    hostTypes: () => call('[' + HOST.map((h) => 'typeof ' + h).join(', ') + ']'),
    added: names().filter((n) => !before.includes(n)),
    evalThrows: () => call('[(function () { try { eval("1"); return "ran"; } catch (e) { return e.name; } })(), (function () { try { new Function("return 1")(); return "ran"; } catch (e) { return e.name; } })()]'),
    decideFile: (rel) => call('ClaimChecker.decideFile(' + JSON.stringify(rel) + ')'),
    decide: (t, name) => call('ClaimChecker.decide(' + JSON.stringify(t) + (name === undefined ? '' : ', ' + JSON.stringify(name)) + ')')
  };
}

/* the gate: what a bundle's text says it wraps, against the bytes between its marks and the file on disk; null, or why not */
function gate(bundleText, diskBytes) {
  const m = B.marks(bundleText).filter((x) => x.kind === 'CHECK-JS');
  if (m.length !== 1) return 'the bundle does not hold exactly one checker between its marks (' + m.length + ')';
  if (m[0].path !== B.CHECK_REL) return 'the bundle wraps ' + m[0].path + ', not ' + B.CHECK_REL;
  if (sha(m[0].inner) !== m[0].sha256) return 'the bytes between the marks hash to ' + sha(m[0].inner).slice(0, 12) + '…, not to the recorded ' + m[0].sha256.slice(0, 12) + '…';
  if (m[0].sha256 !== sha(diskBytes)) return 'the bundle records check.js ' + m[0].sha256.slice(0, 12) + '…, the file on disk is ' + sha(diskBytes).slice(0, 12) + '…: node ' + path.relative(ROOT, path.join(__dirname, 'checker-web.build.js')) + ' --write';
  return null;
}

/* one object, three ways: the Node command line, the Node module, the bundle. '' when they agree, else what differs */
function differs(nodeCli, nodeRes, got) {
  const out = [];
  if (mask(nodeCli.line) !== mask(got.line)) out.push('line: node ' + JSON.stringify(mask(nodeCli.line)).slice(0, 160) + ' / bundle ' + JSON.stringify(mask(got.line)).slice(0, 160));
  if (nodeCli.status !== got.exit) out.push('exit: node ' + nodeCli.status + ' / bundle ' + got.exit);
  if (nodeRes !== undefined) {
    if (view(nodeRes) !== view(got.result)) out.push('what check() returned differs');
    if (nodeRes && (nodeRes.word !== got.word || nodeRes.kind !== got.kind || JSON.stringify(nodeRes.id) !== JSON.stringify(got.id) || JSON.stringify(nodeRes.notes) !== JSON.stringify(got.notes))) out.push('word, kind, id or notes differ');
  }
  if (got.line === null) {                      /* Node died on an uncaught error or refused to run: no line; the same message */
    const msg = got.stderr || String(got.error || '').replace(/^[A-Za-z]*Error: /, '');
    if (!msg || !nodeCli.err.includes(msg.trim())) out.push('no line, and Node\'s stderr does not carry the bundle\'s message ' + JSON.stringify(msg).slice(0, 120));
  }
  return out.join('; ');
}

/* deterministic bytes */
function prng(seed) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s; }; }

async function main() {
  const ok = [], bad = [], red = [];
  const t = (name, cond, why) => { if (cond) ok.push(name); else bad.push(name + (why ? '\n          ' + why : '')); };
  const r = (name, fired, why) => { if (fired) red.push('RED ' + name); else bad.push('RED ' + name + (why ? '\n          ' + why : '')); };

  /* ---- the gate: refuse a stale bundle before anything else ---- */
  if (!fs.existsSync(BUNDLE) || !fs.existsSync(MANIFEST)) { console.log('claim checker in the browser: REFUSED, no ' + B.OUT_BUNDLE + ' (node playground/textbook-machine/checker-web.build.js --write)'); return 1; }
  const bundleText = fs.readFileSync(BUNDLE, 'utf8'), checkBytes = fs.readFileSync(CHECK);
  const refusal = gate(bundleText, checkBytes);
  if (refusal) { console.log('claim checker in the browser: REFUSED, ' + refusal); return 1; }
  ok.push('the bundle records check.js ' + sha(checkBytes).slice(0, 12) + '…, the bytes between its marks are that file, and so is the file on disk');

  /* ---- the build ---- */
  for (const m of B.MUTANTS) t('the mutant ' + path.basename(m.path) + ' is ' + m.edits.length + ' declared edits of ' + m.from, fs.existsSync(path.join(ROOT, m.path)) && text(m.path) === B.deriveMutant(m));
  const fresh = B.build(B.SET);
  t('out/claim-checker.js and its manifest re-derive byte for byte from the builder (' + fresh.manifest.bundle.bytes.toLocaleString('en-US') + ' bytes)',
    bundleText === fresh.bundle && fs.readFileSync(MANIFEST, 'utf8') === fresh.manifestText, 'node playground/textbook-machine/checker-web.build.js --write after a reviewed change');
  const M = fresh.manifest, FILES = M.files.map((f) => f.path);
  t('the manifest lists the bundle\'s own sha256 and size, and no overlay', M.bundle.sha256 === sha(Buffer.from(bundleText, 'utf8')) && M.bundle.bytes === Buffer.byteLength(bundleText) && !('overlay' in M));
  t('every embedded file (' + FILES.length + ') is the file on disk by sha256 and size', M.files.every((f) => sha(read(f.path)) === f.sha256 && read(f.path).length === f.bytes));

  /* ---- the sandbox ---- */
  const S = sandbox(bundleText);
  t('the sandbox is bare: ' + HOST.length + ' host names (require, process, Buffer, fs, console, TextEncoder, atob, fetch, timers …) are all undefined, before and after the checker ran',
    S.hostTypes().every((x) => x === 'undefined') && S.decideFile(B.SET[0].path).line !== null && S.hostTypes().every((x) => x === 'undefined'));
  t('the bundle adds one global, ClaimChecker', S.added.join() === 'ClaimChecker', S.added.join());
  t('the sandbox generates no code from strings (eval and new Function throw EvalError there), so the bundle evaluates no text', S.evalThrows().join() === 'EvalError,EvalError', S.evalThrows().join());
  t('the bundle\'s manifest names the same checker and files as the manifest beside it',
    JSON.stringify(S.call('ClaimChecker.manifest.checker')) === JSON.stringify(M.checker) && S.call('Object.keys(ClaimChecker.manifest.files)').join() === FILES.join());

  /* ---- the shims ---- */
  const inVm = S.call('(function () { var out = {}, F = ClaimChecker.manifest.files, k; for (k in F) out[k] = [ClaimChecker.sha256(k), ClaimChecker.text(k).length]; return out; })()');
  t('SHA-256 in the sandbox equals Node\'s crypto on every embedded file (' + FILES.length + '), and the text read is the file\'s',
    FILES.every((f) => inVm[f][0] === sha(read(f)) && inVm[f][1] === text(f).length) && FILES.every((f) => S.call('ClaimChecker.text(' + JSON.stringify(f) + ')') === text(f)) && S.call('ClaimChecker.verify().ok') === true);
  const rnd = prng(20261112), bytes = (n, hi) => { const b = Buffer.alloc(n); for (let i = 0; i < n; i++) b[i] = hi && rnd() % 3 ? 0x80 + (rnd() >>> 8) % 0x80 : (rnd() >>> 8) & 255; return b; };
  const lens = Array.from({ length: 201 }, (_, i) => i).concat([1000, 4095, 4096, 65543, 1000003]), samples = lens.map((n) => bytes(n, false));
  const hashes = S.call('(function (xs) { return xs.map(function (x) { return ClaimChecker._shims.sha256hex(ClaimChecker._shims.b64dec(x)); }); })(' + JSON.stringify(samples.map((b) => b.toString('base64'))) + ')');
  t('SHA-256 equals Node\'s crypto on ' + samples.length + ' byte strings, every length from 0 to 200 and up to 1,000,003', samples.every((b, i) => hashes[i] === sha(b)));
  const ill = [[0xff], [0xc0, 0x80], [0xe0, 0x80, 0x80], [0xed, 0xa0, 0x80], [0xf4, 0x90, 0x80, 0x80], [0xf0, 0x9f, 0x98], [0xe2, 0x82], [0xc2], [0xef, 0xbb, 0xbf, 0x41], [0xf8, 0x88, 0x80, 0x80, 0x80], [0x41, 0xe2, 0x28, 0xa1], [0xf0, 0x28, 0x8c, 0xbc], [0xf0, 0x9f, 0x98, 0x80]]
    .map((a) => Buffer.from(a)).concat(Array.from({ length: 600 }, () => bytes(1 + rnd() % 48, true)), [bytes(20000, true)]);
  const dec = S.call('(function (xs) { return xs.map(function (x) { return ClaimChecker._shims.utf8dec(ClaimChecker._shims.b64dec(x)); }); })(' + JSON.stringify(ill.map((b) => b.toString('base64'))) + ')');
  t('UTF-8 decoding equals Buffer\'s on ' + ill.length + ' byte strings, ill-formed ones among them (' + ill.filter((b) => !Buffer.from(b.toString('utf8'), 'utf8').equals(b)).length + ' are not valid UTF-8)',
    ill.every((b, i) => dec[i] === b.toString('utf8')));
  const cu = (...xs) => String.fromCharCode(...xs);   /* by code unit, so that no surrogate, BOM or control is typed in this file */
  const strs = ['', 'abc', cu(0xe9, 0x2264, 0x2026, 0x2014), cu(0xd83d, 0xde00), cu(0xd800), 'a' + cu(0xdc00) + 'b', cu(0xd800, 0xd800, 0xdc00), cu(0xdbff, 0xdfff), cu(0xfeff) + 'x', cu(0, 0x7f, 0x80, 0x7ff, 0x800, 0xffff, 0x2028, 0x2029)]
    .concat(Array.from({ length: 300 }, () => { let s = ''; const n = rnd() % 24; for (let i = 0; i < n; i++) s += String.fromCharCode(rnd() % 4 === 0 ? 0xd800 + rnd() % 0x800 : rnd() % 0x10000); return s; }));
  const enc = S.call('(function (xs) { return xs.map(function (x) { return ClaimChecker._shims.hex(ClaimChecker._shims.utf8enc(x)); }); })(' + JSON.stringify(strs) + ')');
  t('UTF-8 encoding equals Buffer.from(string, "utf8") on ' + strs.length + ' strings, lone surrogates among them', strs.every((s, i) => enc[i] === Buffer.from(s, 'utf8').toString('hex')));
  const P = path.posix, V = B.VROOT;
  const segs = ['', '.', '..', '/', 'a', 'a/', '/a', 'a/b', '../a', 'a/../b', './a', 'a//b', '/a/b/', 'a/./b/..', '../../x', 'certs/x.json', '/cert-machine/instruments/claimbox', 'x.json', '.json', 'a/.json', '///', 'a/b.json/'];
  const pathCases = [];
  for (const a of segs) {
    pathCases.push(['normalize', [a], P.normalize(a)], ['basename', [a], P.basename(a)], ['basename', [a, '.json'], P.basename(a, '.json')], ['resolve', [a], P.resolve(V, a)], ['join', [a], P.join(a)]);
    for (const b of segs) pathCases.push(['join', [a, b], P.join(a, b)], ['join', [V, a, b], P.join(V, a, b)], ['resolve', [a, b], P.resolve(V, a, b)], ['resolve', [V + '/instruments/claimbox', a, b], P.resolve(V + '/instruments/claimbox', a, b)], ['relative', [a, b], P.relative(P.resolve(V, a), P.resolve(V, b))]);
  }
  const pathGot = S.call('(function (cs) { var p = ClaimChecker._shims.path; return cs.map(function (c) { return p[c[0]].apply(p, c[1]); }); })(' + JSON.stringify(pathCases.map((c) => [c[0], c[1]])) + ')');
  const pathBad = pathCases.filter((c, i) => pathGot[i] !== c[2]);
  t('the path shim equals path.posix on ' + pathCases.length + ' calls of normalize, join, resolve, relative and basename; sep is "/" and posix is itself',
    !pathBad.length && S.call('[ClaimChecker._shims.path.sep, ClaimChecker._shims.path.posix === ClaimChecker._shims.path]').join() === '/,true', pathBad.slice(0, 3).map((c) => c[0] + JSON.stringify(c[1]) + ' should be ' + JSON.stringify(c[2])).join(' · '));
  const someFile = M.files.find((f) => f.use === 'read').path, someDir = path.posix.dirname(someFile);
  const fsCases = ['', '.', someFile, someFile + '/', someDir, someDir + '/', someDir + '/../' + someDir + '/' + path.posix.basename(someFile), './' + someFile, someFile + '/..', 'no/such/file.json', someFile + 'x', M.files.find((f) => f.use === 'probed').path];
  const fsGot = S.call('(function (ps) { var f = ClaimChecker._shims.fs, p = ClaimChecker._shims.path; return ps.map(function (x) { var a = p.join(' + JSON.stringify(V) + ', x), isF = null; try { isF = f.statSync(a).isFile(); } catch (e) { isF = e.code; } return [f.existsSync(a), isF]; }); })(' + JSON.stringify(fsCases) + ')');
  const fsWant = fsCases.map((c) => { const a = path.join(ROOT, c); let isF = null; try { isF = fs.statSync(a).isFile(); } catch (e) { isF = e.code === 'ENOTDIR' ? 'ENOENT' : e.code; } return [fs.existsSync(a), isF]; });
  t('the embedded file map answers existsSync and statSync().isFile as the file system does on ' + fsCases.length + ' paths (a file, a file with a trailing slash, a directory, a missing path, dots)',
    JSON.stringify(fsGot) === JSON.stringify(fsWant), JSON.stringify(fsGot) + ' / ' + JSON.stringify(fsWant));
  t('a path the bundle does not carry does not exist there, though it is on disk (' + B.CHECK_REL.replace('check.js', 'SCHEMA.md') + '): the bundle\'s world is its map',
    fs.existsSync(path.join(ROOT, 'instruments/claimbox/SCHEMA.md')) && S.call('ClaimChecker._shims.fs.existsSync(' + JSON.stringify(V + '/instruments/claimbox/SCHEMA.md') + ')') === false);

  /* ---- the decisions: the set ---- */
  const nodeOf = {}, lines = [];
  for (const x of B.SET) {
    const n = cli(CHECK, x.path), res = NODE.check(path.join(ROOT, x.path)), got = S.decideFile(x.path), got2 = S.decide(text(x.path), path.basename(x.path));
    nodeOf[x.path] = n;
    const d = differs(n, res, got) || differs(n, res, got2);
    lines.push('          ' + x.shape.padEnd(23) + mask(n.line));
    t('same line, exit code, word, kind and result as Node: ' + path.basename(x.path, '.json') + ' (' + x.shape + ') ' + res.word + (res.kind ? ' ' + res.kind : ' [' + res.decided.concat(res.fromObject.filter(Boolean).map((f) => f.word)).join(' · ') + ']'), !d, d);
  }
  const words = new Set(); for (const x of B.SET) for (const w of (mask(nodeOf[x.path].line).match(/CERTIFIED|REFUTED|REFUSED/g) || [])) words.add(w);
  t('the set shows the three words (CERTIFIED, REFUTED, REFUSED), and its mutant is refused for the reason it names',
    ['CERTIFIED', 'REFUTED', 'REFUSED'].every((w) => words.has(w)) && B.MUTANTS.filter((m) => !m.fixture).every((m) => nodeOf[m.path].line.includes('  ' + m.kind + ': ')));
  const idName = B.SET.find((x) => nodeOf[x.path].status === 0);
  t('decide(text) with no file name decides as the file <id>.json', mask(S.decide(text(idName.path)).line) === mask(nodeOf[idName.path].line));

  /* ---- the file list: Node in a tree that holds only what the bundle embeds ---- */
  const bare = tree(FILES, null);
  const treeBad = B.SET.filter((x) => { const n = cli(path.join(bare, B.CHECK_REL), path.join(bare, x.path)); return mask(n.line) !== mask(nodeOf[x.path].line) || n.status !== nodeOf[x.path].status; });
  t('Node, run in a temporary tree holding only check.js and the ' + FILES.length + ' embedded files, prints the same ' + B.SET.length + ' lines: the spy missed nothing', !treeBad.length, treeBad.map((x) => x.path).join(', '));

  /* ---- existing objects outside the set whose files the bundle happens to carry, by their text ---- */
  const others = ['instruments/claimbox/v4/v4-int64-sum-int64.json', 'instruments/claimbox/primitive/prim-ea-542-circle-packing.json', 'instruments/claimbox/v4/v4-mutant-two-on-one-bar.json',
    'instruments/claimbox/v4/v4-1d-cert2026.json', 'instruments/claimbox/primitive/prim-1d-cert2026.json'];
  for (const rel of others) {
    const n = cli(CHECK, rel), d = differs(n, NODE.check(path.join(ROOT, rel)), S.decide(text(rel), path.basename(rel)));
    t('same as Node, given as text: ' + path.basename(rel, '.json') + ' -> ' + mask(n.line).slice(0, 96) + (mask(n.line).length > 96 ? '…' : ''), !d, d);
  }

  /* ---- the ledger fixtures: a bundle built here, in memory, whose objects make check.js require its word module ---- */
  const T = B.build(B.SET.concat(B.FIXTURES.map((p) => ({ path: p, shape: 'fixture' }))));
  const ST = sandbox(T.bundle), mods = B.marks(T.bundle).filter((x) => x.kind === 'MODULE');
  t('the fixtures\' bundle carries the ledger\'s word module between marks, byte for byte the file on disk (' + mods.map((x) => x.path).join(', ') + ')',
    mods.length === 1 && T.manifest.modules.length === 1 && mods.every((x) => sha(x.inner) === x.sha256 && x.sha256 === sha(read(x.path))) && B.marks(bundleText).filter((x) => x.kind === 'MODULE').length === 0);
  for (const m of B.MUTANTS.filter((x) => x.fixture)) {
    const n = cli(CHECK, m.path), d = differs(n, NODE.check(path.join(ROOT, m.path)), ST.decideFile(m.path));
    t('same as Node through require(the ledger\'s words): ' + mask(n.line), !d && n.line.includes('  ' + m.kind + ': '), d || 'Node did not refuse as ' + m.kind);
  }
  t('the fixtures\' bundle ran in a bare sandbox too, and without the module the set\'s bundle refuses the same object as record-missing', ST.hostTypes().every((x) => x === 'undefined')
    && S.decide(text(B.FIXTURES[0]), path.basename(B.FIXTURES[0])).kind === 'record-missing');

  /* ---- odd inputs, by text: Node reads each from a temporary file ---- */
  const E = text('instruments/claimbox/claims/optq-82-epi.json'), I = text('instruments/claimbox/v4/v4-int64-sum-integers.json');
  const edit = (s, a, b) => { if (s.split(a).length !== 2) throw new Error('battery: the probe edits ' + a + ', which is not there once'); return s.replace(a, () => b); };
  const probes = [
    ['not JSON', 'this is not JSON'], ['a truncated object', E.slice(0, 300)], ['null', 'null'], ['an empty object', '{}'], ['a list', '[]'], ['a string', '"x"'], ['a number', '7'],
    ['an id that is a number', edit(E, '"id": "optq-82-epi"', '"id": 82')],
    ['a source path that is not there', edit(E, 'upstream/82a.md', 'upstream/82z.md')],
    ['a source path that leaves the repository', edit(E, '"path": "corpus/optconst-queue/c82-2026-10-19/upstream/82a.md"', '"path": "../../../../../../../../nowhere/82a.md"')],
    ['a source sha256 with one digit moved', edit(E, '46734d1a', '56734d1a')],
    ['a quote that is not in the source', edit(E, '| [Epi26] |', '| [Epi27] |')],
    ['a bar written as a decimal', edit(E, '"c": "2535744749068227/10000000000000000"', '"c": "0.2535744749068227"')],
    ['a bar that is not the printed one', edit(E, '"c": "2535744749068227/10000000000000000"', '"c": "2535744749068228/10000000000000000"')],
    ['a record path that is not there', edit(E, '"path": "certs/c82-replay.json"', '"path": "certs/c82-replay-2.json"')],
    ['a record path that is a directory', edit(E, '"path": "certs/c82-replay.json"', '"path": "certs"')],
    ['a record path that is a number', edit(E, '"path": "certs/c82-replay.json"', '"path": 7')],
    ['a record row that is not there', edit(E, '"row": "epi26"', '"row": "epi27"')],
    ['a declared verdict the record does not give', edit(E, '"verdict": "CERTIFIED"', '"verdict": "REFUTED"')],
    ['a named head whose file is not there', edit(E, '"where": "instruments/optq/c82.py"', '"where": "instruments/optq/c83.py"')],
    ['an unknown field', edit(E, '"reading": "universal"', '"reading": "universal", "extra": "x"')],
    ['format 5', edit(I, '"format": 4', '"format": 5')],
    ['a domain count that is not the data\'s', edit(I, '"count": 2', '"count": 3')],
    ['a standing that is not one of the four', edit(I, '"domain": "COMPUTED"', '"domain": "PROVED"')],
    ['a relation the value does not meet (REFUTED from the object)', edit(I, '"rel": "eq"', '"rel": "lt"')]
  ];
  const inbox = tempDir();
  const probeBad = [], probeSeen = {};
  probes.forEach(([label, body], i) => {
    const name = 'probe-' + String(i + 1).padStart(2, '0') + '.json', f = path.join(inbox, name);
    fs.writeFileSync(f, body);
    const n = cli(CHECK, f), got = S.decide(body, name), d = differs(n, undefined, got);
    const k = n.line === null ? 'no line (exit ' + n.status + ')' : n.line.startsWith('REFUSED') ? (/^REFUSED {3}.*? {2}([a-z0-9-]+): /.exec(n.line) || [0, '?'])[1] : 'ADMITTED';
    probeSeen[k] = (probeSeen[k] || 0) + 1;
    if (d) probeBad.push(label + ': ' + d);
  });
  t('same as Node on ' + probes.length + ' odd inputs given as text (' + Object.keys(probeSeen).sort().map((k) => k + ' ×' + probeSeen[k]).join(', ') + ')', !probeBad.length, probeBad.slice(0, 4).join('\n          '));

  /* ---- red controls ---- */
  const flip = (rel, at, to) => { const b = Buffer.from(read(rel)); b[at] = to === undefined ? b[at] ^ 1 : to; return b; };
  /* one byte changed in a pinned file: the bundle built over the changed bytes, Node in a temporary copy of the tree */
  const pinControl = (label, objRel, fileRel, at, to, where, wantBase64) => {
    const ov = {}; ov[fileRel] = flip(fileRel, at, to);
    const Bv = B.build(B.SET, { overlay: ov }), Sv = sandbox(Bv.bundle), dir = tree(FILES, ov);
    const n = cli(path.join(dir, B.CHECK_REL), path.join(dir, objRel)), got = Sv.decideFile(objRel), row = Bv.manifest.files.find((f) => f.path === fileRel);
    const want = 'REFUSED   ' + path.basename(objRel, '.json') + '  pin-mismatch: ' + where + ': ' + fileRel;
    r(label + ': Node in a temporary copy of the tree and the bundle both print "' + want.replace(/ {2,}/g, ' ') + '"',
      n.line === want && got.line === want && got.kind === 'pin-mismatch' && n.status === 1 && got.exit === 1 && nodeOf[objRel].status === 0 && sha(read(fileRel)) !== sha(ov[fileRel])
      && Sv.call('ClaimChecker.sha256(' + JSON.stringify(fileRel) + ')') === sha(ov[fileRel]) && row.encoding === (wantBase64 ? 'base64' : 'utf8') && Bv.manifest.overlay.join() === fileRel,
      'node ' + JSON.stringify(n.line) + ' / bundle ' + JSON.stringify(got.line) + ' / ' + row.encoding);
    return { ov, Sv, dir };
  };
  const eSrc = 'corpus/optconst-queue/c82-2026-10-19/upstream/82a.md', iDom = 'instruments/claimbox/v4/data/int64-accumulator.json', iSrc = 'instruments/claimbox/v4/data/int64-accumulator.md';
  pinControl('one byte changed in an embedded pinned source', 'instruments/claimbox/claims/optq-82-epi.json', eSrc, 100, undefined, 'source', false);
  pinControl('one byte of embedded pinned domain bytes set to 0xFF (carried as base64)', 'instruments/claimbox/v4/v4-int64-sum-integers.json', iDom, 5, 0xff, 'domain.pin', true);
  {
    const ov = {}; ov[iSrc] = flip(iSrc, 0, 0xff);
    const Bv = B.build(B.SET, { overlay: ov }), Sv = sandbox(Bv.bundle), dir = tree(FILES, ov);
    const repinned = edit(I, sha(read(iSrc)), sha(ov[iSrc])), objRel = 'instruments/claimbox/v4/v4-int64-sum-integers.json';
    fs.writeFileSync(path.join(dir, objRel), repinned);
    const n = cli(path.join(dir, B.CHECK_REL), path.join(dir, objRel)), got = Sv.decide(repinned, path.basename(objRel));
    r('a source that is not valid UTF-8, pinned as it is, is read as Node reads it: the same ADMITTED line, the quote found past the ill-formed byte',
      n.status === 0 && n.line.startsWith('ADMITTED') && mask(n.line) === mask(got.line) && Bv.manifest.files.find((f) => f.path === iSrc).encoding === 'base64' && Sv.call('ClaimChecker.text(' + JSON.stringify(iSrc) + ')') === ov[iSrc].toString('utf8'),
      'node ' + JSON.stringify(n.line) + ' / bundle ' + JSON.stringify(got.line));
  }
  /* a JSON number planted in each admitted object of the set: the bar c, unquoted */
  const plantBad = [], admitted = B.SET.filter((x) => nodeOf[x.path].status === 0);
  for (const x of admitted) {
    const src = text(x.path), m = /("printed": "[^"]*",\s*"c": (?:\[\s*)?)"(-?\d+)(?:\/\d+)?"/.exec(src);   /* the bar of a predicate that prints one; a list's first end for "in" */
    if (!m) { plantBad.push(x.path + ': no bar to plant in'); continue; }
    const planted = src.replace(m[0], () => m[1] + m[2]), name = path.basename(x.path), f = path.join(inbox, name);
    fs.writeFileSync(f, planted);
    const n = cli(CHECK, f), got = S.decide(planted, name);
    if (!(n.line === got.line && got.kind === 'json-number' && n.status === 1 && got.exit === 1 && /^REFUSED {3}\S+ {2}json-number: predicate\[\d+\]\.c/.test(n.line))) plantBad.push(x.path + ': node ' + JSON.stringify(n.line) + ' / bundle ' + JSON.stringify(got.line));
  }
  r('a JSON number planted as the bar of each of the ' + admitted.length + ' admitted objects is refused as json-number by Node and by the bundle, in the same words', !plantBad.length && admitted.length >= 4, plantBad.join('\n          '));
  {
    const ov = {}; ov['instruments/verdict.js'] = Buffer.from(edit(text('instruments/verdict.js'), 'const CERTIFIED = \'CERTIFIED\';', 'const CERTIFIED_ = \'CERTIFIED\';'), 'utf8');
    const Sv = sandbox(B.build(B.SET, { overlay: ov }).bundle), dir = tree(FILES, ov), objRel = B.SET[0].path;
    const n = cli(path.join(dir, B.CHECK_REL), path.join(dir, objRel)), got = Sv.decideFile(objRel);
    r('a verdict.js that no longer declares the three words: Node refuses to run (exit 2) and so does the bundle, with the same message and no line',
      n.status === 2 && got.exit === 2 && n.line === null && got.line === null && n.err === got.stderr && got.stderr.startsWith('CLAIMBOX CHECKER (JS) REFUSED TO RUN: verdict.js'), 'node ' + n.status + ' ' + JSON.stringify(n.err).slice(0, 120) + ' / bundle ' + got.exit + ' ' + JSON.stringify(got.stderr).slice(0, 120));
  }
  {
    const rec = 'certs/autocorr-replay.json', objRel = 'instruments/claimbox/claims/optq-1d-cert2026.json', ov = {};
    ov[rec] = Buffer.from(text(rec).split('"REFUTED"').join('"CERTIFIED"'), 'utf8');
    const Sv = sandbox(B.build(B.SET, { overlay: ov }).bundle), dir = tree(FILES, ov), got = Sv.decideFile(objRel), n = cli(path.join(dir, B.CHECK_REL), path.join(dir, objRel));
    r('a bundle built over a record whose word was moved no longer agrees with Node in the repository (the comparison can fail), and still agrees with Node over the same moved record: ' + got.kind,
      differs(nodeOf[objRel], NODE.check(path.join(ROOT, objRel)), got) !== '' && got.word === 'REFUSED' && mask(n.line) === mask(got.line) && n.status === got.exit, JSON.stringify(got.line));
  }
  const mark = B.marks(bundleText).find((x) => x.kind === 'CHECK-JS');
  const stale = bundleText.replace('sha256=' + mark.sha256 + ' prefix=', 'sha256=' + sha(Buffer.from('an older check.js')) + ' prefix=');
  r('a bundle whose recorded check.js sha256 is stale is refused by the gate', stale !== bundleText && /^the bytes between the marks/.test(gate(stale, checkBytes) || ''), String(gate(stale, checkBytes)));
  const at = bundleText.indexOf('function decide(value, rel, c)'), poked = bundleText.slice(0, at) + bundleText.slice(at).replace('hi.cmp(c) <= 0 ? C', 'hi.cmp(c) <  0 ? C');
  r('a bundle with one byte changed in the checker between its marks is refused by the gate', at > 0 && poked !== bundleText && poked.length === bundleText.length && /^the bytes between the marks/.test(gate(poked, checkBytes) || ''), String(gate(poked, checkBytes)));
  const newer = Buffer.concat([checkBytes, Buffer.from('\n')]);
  r('a check.js on disk that is one byte past the bundled one is refused by the gate, which names the rebuild', /the file on disk is .*checker-web\.build\.js --write$/.test(gate(bundleText, newer) || ''), String(gate(bundleText, newer)));

  /* ---- once in real headless Chrome, on request ---- */
  let chromeSaid = 'not run (pass --chrome)';
  if (process.argv.includes('--chrome')) {
    const { withChrome, settle } = require(path.join(ROOT, 'design', 'cdp.js'));
    const dir = tempDir();
    fs.writeFileSync(path.join(dir, 'claim-checker.js'), bundleText);
    fs.writeFileSync(path.join(dir, 'index.html'), '<!doctype html><html lang="en"><meta charset="utf-8"><title>claim checker</title><script src="claim-checker.js"></script></html>\n');
    const seen = await withChrome(async (send) => {
      await send('Page.enable');
      await send('Page.navigate', { url: 'file://' + path.join(dir, 'index.html') });
      const ev = async (expression) => { const x = await send('Runtime.evaluate', { expression, returnByValue: true }, 120000); if (x.exceptionDetails) throw new Error('the page threw: ' + (x.exceptionDetails.exception && x.exceptionDetails.exception.description || x.exceptionDetails.text)); return x.result.value; };
      for (let i = 0; i < 100 && (await ev('typeof ClaimChecker')) !== 'object'; i++) await settle(100);
      return JSON.parse(await ev('JSON.stringify({ ua: navigator.userAgent, host: [typeof require, typeof process, typeof Buffer], verify: ClaimChecker.verify(), got: ClaimChecker.objects.map(function (o) { return ClaimChecker.decideFile(o.path); }) })'));
    }, { port: 9347 });
    const cBad = B.SET.filter((x, i) => differs(nodeOf[x.path], NODE.check(path.join(ROOT, x.path)), seen.got[i]) !== '');
    chromeSaid = (/(?:Headless)?Chrome\/[\d.]+/.exec(seen.ua) || [seen.ua])[0];
    t('in real headless Chrome (' + chromeSaid + ', a page with no require, process or Buffer): the bundle hashes its ' + seen.verify.files + ' files to their pins and decides the ' + B.SET.length + ' objects as Node does',
      seen.host.every((x) => x === 'undefined') && seen.verify.ok && seen.got.length === B.SET.length && !cBad.length, cBad.map((x) => x.path).join(', '));
  }

  for (const s of ok) console.log('  ok    ' + s);
  for (const s of red) console.log('  ok    ' + s);
  for (const s of bad) console.log('  FAIL  ' + s);
  console.log('  the set, as Node prints it (seconds masked):');
  for (const l of lines) console.log(l);
  console.log(bad.length ? 'claim checker in the browser: FAIL, ' + bad.length + ' failure(s)'
    : 'claim checker in the browser: PASS, ' + ok.length + ' checks and ' + red.length + ' red controls; headless Chrome ' + chromeSaid);
  return bad.length ? 1 : 0;
}

if (require.main === module) main().then((c) => { cleanup(); process.exit(c); }).catch((e) => { cleanup(); console.error('claim checker in the browser: REFUSED, ' + (e && e.stack || e)); process.exit(1); });
module.exports = { gate, sandbox, mask };
