#!/usr/bin/env node
/* record-openai-hodge-statement.js — certs/openai-math-hodge-statement.json: what the sources of openai/math at 7ef5c0cc
   say about the two statements of its Hodge challenge (HodgeConjectureCMAbelianVarieties), READ — files fetched, parsed
   and hashed. Nothing is built, no Comparator is run, no kernel runs. The word is READ and it is not lane K's word: lane
   K's row for this challenge (certs/openai-math-kernel-7ef5c0cc.json) stays what its runs decided.

   WHAT IT READS. A blobless, sparse, depth-1 checkout of github.com/openai/math at the census pin
   (corpus/openai-math/release-7ef5c0cc.json), made by tools/sparse-at-pin.js in a temp directory outside this repository:
   the challenge directory (main.json, Challenge.lean, CM.lean, Solution.lean and the HodgeConjecture helper library),
   all of lean/OAI, lean/OAI.lean, lean/lakefile.lean and the family's scope note lean/docs/032.md; and Comparator's
   Compare.lean and Main.lean at lane K's pin (leanprover/comparator d03acab1). Every file the census or this repository
   already pins is checked against that pin, and the run refuses on any difference.

   WHAT IT DERIVES, by rules that live here only:
   - each side's theorem statement (the text from the theorem's name to its `:=`), and the constant every name in it
     resolves to — by the declarations found in the files of that side's import closure, under the statement file's
     namespace and `open` lines (an over-approximation of Lean's resolution; more than one candidate refuses). The
     `Hdg^` notation is resolved to the notation declaration that the file's opens activate, and its head constant;
   - the two import closures inside the release's own tree (modules named OAI.*, ComparatorChallenges.*,
     HodgeConjecture.*; the lakefile maps HodgeConjecture.* into the challenge directory), from each file's header,
     cross-checked against the census's closure counts; their intersection; and whether any .lean file of lean/OAI
     imports a module of the challenge's closure, or any ComparatorChallenges/HodgeConjecture module at all;
   - the constant pairs where the two statements differ, textually and after notation;
   - spot checks of the release's copies: each differing pair's two declarations, and the same-file declarations they
     use, compared token for token with comments dropped and every name cut to its last component — "differ only by
     namespace" means equal under that cut, and nothing more.

   --check re-derives the record from a fresh fetch and refuses on any difference from the record on disk; it writes
   nothing. --src <dir> reuses (or creates) the checkouts under <dir>/math and <dir>/comparator, still verified at their
   pins; --keep leaves the temp directory in place and prints it.

   usage: node tools/record-openai-hodge-statement.js [--check] [--src <dir>] [--keep] */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { writeStable, stable } = require('./stable-json.js');
const { sparseAtPin } = require('./sparse-at-pin.js');

const ROOT = path.resolve(__dirname, '..');
const OUT_REL = 'certs/openai-math-hodge-statement.json';
const OUT = path.join(ROOT, OUT_REL);
const die = (m) => { console.error('HODGE STATEMENT READING REFUSED: ' + m); process.exit(1); };
const J = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const shaBuf = (b) => crypto.createHash('sha256').update(b).digest('hex');
const shaOf = (abs) => shaBuf(fs.readFileSync(abs));

const argv = process.argv.slice(2);
const CHECK = argv.includes('--check');
const KEEP = argv.includes('--keep');
const srcAt = argv.indexOf('--src');
const SRC = srcAt >= 0 ? argv[srcAt + 1] : null;
if (srcAt >= 0 && !SRC) die('--src takes a directory');

/* ── what this repository already holds ─────────────────────────────────────── */
const CENSUS = 'corpus/openai-math/release-7ef5c0cc.json';
const K2_REL = 'certs/openai-math-kernel-7ef5c0cc.json';
const PRE_REL = 'corpus/openai-math/preregistration.json';
const R2 = J(CENSUS);
const K2 = J(K2_REL);
const P = J(PRE_REL);
const PIN = R2.commit;
const NAME = 'HodgeConjectureCMAbelianVarieties';
const CHAL = R2.challenges.find((c) => c.name === NAME) || die(NAME + ' is not in the census ' + CENSUS);
const ADDED = (R2.sincePin.added || []).find((a) => a.name === NAME) || die(NAME + ' is not among the census\'s added challenges');
if (CHAL.theoremNames.length !== 1) die('the census lists ' + CHAL.theoremNames.length + ' theorems for ' + NAME + '; this reading is written for one');
const THEOREM = CHAL.theoremNames[0];
const FAMILY = CHAL.families[0];
const NOTE = R2.scopeNotes.find((s) => s.family === FAMILY) || die('no scope note for family ' + FAMILY);
const LAKE = R2.copied.find((c) => c.path === 'lean/lakefile.lean') || die('the census copied no lakefile');
const CH_DIR = path.dirname(CHAL.config);                                   /* lean/ComparatorChallenges/<NAME> */
const modFile = (m) => 'lean/' + m.replace(/[«»]/g, '').replace(/\./g, '/') + '.lean';
const CHALLENGE_FILE = modFile(CHAL.challengeModule), SOLUTION_FILE = modFile(CHAL.solutionModule);
if (CHALLENGE_FILE !== CHAL.statement) die('the challenge module\'s file is not the census statement');
const CM_FILE = CH_DIR + '/CM.lean';

const COMP = { url: 'https://github.com/leanprover/comparator.git', repository: 'https://github.com/leanprover/comparator',
  commit: 'd03acab154d269c06e60e4de7e4cc85deebff94b',
  compare: { path: 'Comparator/Compare.lean', copy: 'corpus/openai-math/comparator/Comparator_Compare.lean' },
  main: { path: 'Main.lean', copy: 'corpus/openai-math/comparator/Main.lean' } };
if (!P.lanes.K.decider.includes('comparator d03acab1')) die('the pre-registration\'s lane K decider no longer names comparator d03acab1');

const K2ROW = K2.rows.find((r) => r.challenge === NAME) || die('lane K at ' + PIN.slice(0, 8) + ' holds no row for ' + NAME);

/* ── the fetch ──────────────────────────────────────────────────────────────── */
const WORK = SRC ? path.resolve(SRC) : fs.mkdtempSync(path.join(os.tmpdir(), 'oai-hodge-'));
const MATH = path.join(WORK, 'math'), CMP = path.join(WORK, 'comparator');
const t0 = Date.now();
try {
  sparseAtPin('https://github.com/openai/math.git', PIN, ['/' + CH_DIR + '/', '/lean/OAI/', '/lean/OAI.lean', '/lean/lakefile.lean', '/' + NOTE.path], MATH);
  sparseAtPin(COMP.url, COMP.commit, ['/' + COMP.compare.path, '/' + COMP.main.path], CMP);
} catch (e) { die(e.message); }
console.log('fetched ' + PIN.slice(0, 8) + ' and comparator ' + COMP.commit.slice(0, 8) + ' into ' + WORK + ' (' + Math.round((Date.now() - t0) / 1000) + ' s)');

const abs = (rel) => path.join(MATH, rel);
const exists = (rel) => fs.existsSync(abs(rel));
const rd = (rel) => fs.readFileSync(abs(rel), 'utf8');
const lineCount = (s) => s.split('\n').length - (s.endsWith('\n') ? 1 : 0);
const pinned = new Map();
const fileRec = (rel, pin, by) => {
  if (!exists(rel)) die(rel + ' is not in the checkout');
  const buf = fs.readFileSync(abs(rel)), h = shaBuf(buf);
  if (pin && h !== pin) die(rel + ' hashes to ' + h + ', not the pin ' + pin + ' (' + by + ')');
  const r = { path: rel, sha256: h, bytes: buf.length, lines: lineCount(buf.toString('utf8')), pinnedBy: pin ? by : 'first pinned by this record' };
  pinned.set(rel, r);
  return r;
};
const ev = (rel, lines) => { const f = pinned.get(rel) || fileRec(rel, null, null); return Object.assign({ repo: 'openai/math', path: rel, sha256: f.sha256 }, lines ? { lines: String(lines) } : {}); };

fileRec(CHAL.config, CHAL.configSha256, CENSUS + ' challenges[' + NAME + '].configSha256');
fileRec(CHALLENGE_FILE, CHAL.statementSha256, CENSUS + ' challenges[' + NAME + '].statementSha256');
fileRec(CM_FILE, null, null);
fileRec(SOLUTION_FILE, null, null);
fileRec(NOTE.path, NOTE.sha256, CENSUS + ' scopeNotes[' + FAMILY + '].sha256');
fileRec('lean/lakefile.lean', LAKE.sha256, CENSUS + ' copied[lean/lakefile.lean].sha256 (copy ' + LAKE.copy + ')');

/* the config: the comparison is of one theorem, with no definition hole */
const cfg = JSON.parse(rd(CHAL.config));
if (cfg.challenge_module !== CHAL.challengeModule || cfg.solution_module !== CHAL.solutionModule) die('main.json names other modules than the census');
if (JSON.stringify(cfg.theorem_names) !== JSON.stringify([THEOREM])) die('main.json names other theorems: ' + JSON.stringify(cfg.theorem_names));
if ((cfg.definition_names || []).length) die('main.json declares definition holes; this reading is written for none');

/* ── Lean, read as text ─────────────────────────────────────────────────────── */
/* comments (nested /- -/, and --) blanked to spaces, newlines kept, so line numbers survive; string literals kept */
function strip(src) {
  const out = src.split('');
  let i = 0; const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '"') { i++; while (i < n && src[i] !== '"') { if (src[i] === '\\') i++; i++; } i++; continue; }
    if (c === '-' && src[i + 1] === '-') { while (i < n && src[i] !== '\n') out[i++] = ' '; continue; }
    if (c === '/' && src[i + 1] === '-') {
      let d = 0;
      while (i < n) {
        if (src[i] === '/' && src[i + 1] === '-') { d++; out[i] = out[i + 1] = ' '; i += 2; continue; }
        if (src[i] === '-' && src[i + 1] === '/') { d--; out[i] = out[i + 1] = ' '; i += 2; if (!d) break; continue; }
        if (src[i] !== '\n') out[i] = ' ';
        i++;
      }
      continue;
    }
    i++;
  }
  return out.join('');
}
/* the header's imports: `module`, `prelude`, then `[public] [meta] import [all] M` until the first other token */
function headerImports(src) {
  let i = 0; const n = src.length; const imports = []; let mods = 0;
  const skip = () => {
    for (;;) {
      while (i < n && (src[i] === ' ' || src[i] === '\n' || src[i] === '\t' || src[i] === '\r')) i++;
      if (src[i] === '-' && src[i + 1] === '-') { const j = src.indexOf('\n', i); i = j < 0 ? n : j + 1; continue; }
      if (src[i] === '/' && src[i + 1] === '-') {
        let d = 0;
        while (i < n) { if (src[i] === '/' && src[i + 1] === '-') { d++; i += 2; } else if (src[i] === '-' && src[i + 1] === '/') { d--; i += 2; if (!d) break; } else i++; }
        continue;
      }
      return;
    }
  };
  const word = () => { skip(); const s = i; while (i < n && !/\s/.test(src[i])) i++; return src.slice(s, i); };
  for (;;) {
    const w = word();
    if (!w) break;
    if ((w === 'module' || w === 'prelude') && !mods) continue;
    if (w === 'public' || w === 'meta' || w === 'private') { mods++; continue; }
    if (w === 'import') { let m = word(); if (m === 'all') m = word(); if (!m) break; imports.push(m.replace(/[«»]/g, '')); mods = 0; continue; }
    break;
  }
  return imports;
}
const IN_TREE = /^(OAI|ComparatorChallenges|HodgeConjecture)\./;
/* the lakefile keeps the helper library under its original module names, rooted in the challenge directory */
const lakefile = rd('lean/lakefile.lean');
const lakeHodge = /^lean_lib HodgeConjecture where\n  srcDir := "ComparatorChallenges\/HodgeConjectureCMAbelianVarieties"\n  globs := #\[\.submodules `HodgeConjecture\]$/m.exec(lakefile)
  || die('lean/lakefile.lean no longer roots HodgeConjecture.* in the challenge directory');
const lakeLine = lakefile.slice(0, lakeHodge.index).split('\n').length;
const fileOfMod = (m) => (m.startsWith('HodgeConjecture.') ? CH_DIR + '/' + m.replace(/\./g, '/') + '.lean' : modFile(m));

const importsCache = new Map();
const importsOf = (rel) => {
  if (!importsCache.has(rel)) { if (!exists(rel)) die('a module of the release\'s tree is not in the checkout: ' + rel); importsCache.set(rel, headerImports(rd(rel))); }
  return importsCache.get(rel);
};
function closure(rootMod) {
  const seen = new Set([rootMod]); const stack = [rootMod];
  while (stack.length) for (const x of importsOf(fileOfMod(stack.pop())).filter((m) => IN_TREE.test(m))) if (!seen.has(x)) { seen.add(x); stack.push(x); }
  return seen;
}
const chClosure = closure(CHAL.challengeModule), solClosure = closure(CHAL.solutionModule);
const chFiles = new Set([...chClosure].map(fileOfMod)), solFiles = new Set([...solClosure].map(fileOfMod));
if (chFiles.size !== ADDED.statementClosureModules) die('the challenge closure is ' + chFiles.size + ' modules; the census says ' + ADDED.statementClosureModules);
if (solFiles.size !== ADDED.solutionClosureModules) die('the solution closure is ' + solFiles.size + ' modules; the census says ' + ADDED.solutionClosureModules);
const shared = [...chFiles].filter((f) => solFiles.has(f)).sort();
const outsideDir = [...chFiles].filter((f) => !f.startsWith(CH_DIR + '/'));
const solutionImports = importsOf(SOLUTION_FILE);

/* every .lean file of lean/OAI (and lean/OAI.lean): does any import the challenge side? */
const walk = (dir, acc) => { for (const e of fs.readdirSync(abs(dir), { withFileTypes: true })) { const p = dir + '/' + e.name; if (e.isDirectory()) walk(p, acc); else if (e.name.endsWith('.lean')) acc.push(p); } return acc; };
const oaiFiles = walk('lean/OAI', []);
if (oaiFiles.length !== R2.counted.leanFiles - 1) die('lean/OAI holds ' + oaiFiles.length + ' .lean files; the census counts ' + R2.counted.leanFiles + ' with lean/OAI.lean');
let oaiImportingClosure = [], oaiImportingChallengeTree = [];
for (const f of oaiFiles.concat(['lean/OAI.lean'])) {
  const imps = importsOf(f);
  if (imps.some((m) => chClosure.has(m))) oaiImportingClosure.push(f);
  if (imps.some((m) => /^(ComparatorChallenges|HodgeConjecture)(\.|$)/.test(m))) oaiImportingChallengeTree.push(f);
}

/* ── namespaces, opens, declarations, notations ─────────────────────────────── */
const DECL = /^[ \t]*(?:@\[[^\]]*\][ \t]*)*(?:(?:private|protected|public|noncomputable|partial|unsafe|nonrec|scoped|local)[ \t]+)*(def|abbrev|theorem|lemma|class(?:[ \t]+inductive)?|structure|inductive|instance|opaque|axiom)[ \t]+((?:_root_\.)?[A-Za-z_][A-Za-z0-9_'!?.]*)/;
const NOTATION = /^[ \t]*(?:@\[[^\]]*\][ \t]*)*(scoped[ \t]+|local[ \t]+)?notation(?::[A-Za-z0-9]+)?[ \t]+"([^"]+)"([^\n]*?)=>[ \t]*(.+)$/;
const prefixes = (ns) => { const p = ns ? ns.split('.') : []; const out = []; for (let k = p.length; k >= 0; k--) out.push(p.slice(0, k).join('.')); return out; };
const join = (a, b) => (a ? a + '.' + b : b);
const rootless = (x) => x.replace(/^_root_\./, '');
/* one pass over a stripped file: the scope at every line, and the declarations and notations it makes */
function scan(stripped) {
  const lines = stripped.split('\n');
  const stack = []; const at = []; const decls = []; const notations = [];
  const ns = () => stack.filter((s) => s.kind === 'ns').map((s) => s.name).join('.');
  for (let k = 0; k < lines.length; k++) {
    const L = lines[k]; let m;
    at[k] = { ns: ns(), opens: stack.flatMap((s) => s.opens) };
    if ((m = /^\s*namespace\s+(\S+)/.exec(L))) { stack.push({ kind: 'ns', name: rootless(m[1]), opens: [] }); continue; }
    if (/^\s*(?:@\[[^\]]*\]\s*)*(?:(?:public|private|noncomputable)\s+)*section\b/.test(L)) { stack.push({ kind: 'sec', opens: [] }); continue; }
    if (/^\s*mutual\s*$/.test(L)) { stack.push({ kind: 'mutual', opens: [] }); continue; }
    if (/^\s*end\b/.test(L)) { stack.pop(); continue; }
    if ((m = /^(\s*)open\s+(.*)$/.exec(L))) {
      let body = m[2];
      for (let j = k + 1; j < lines.length && /^\s+[A-Za-z_][\w.']*(\s+[A-Za-z_][\w.']*)*\s*$/.test(lines[j]) && lines[j].search(/\S/) > m[1].length; j++) body += ' ' + lines[j];
      if (/\bin\s*$/.test(body)) continue;                                          /* `open … in` scopes the next command only */
      const scoped = /^scoped\b/.test(body);
      const names = body.replace(/^scoped\b/, '').replace(/\([^)]*\)/g, ' ').split(/\s+/).filter(Boolean);
      const cut = names.findIndex((x) => x === 'hiding' || x === 'renaming');
      const target = stack.length ? stack[stack.length - 1] : (stack.push({ kind: 'file', opens: [] }), stack[0]);
      for (const x of (cut >= 0 ? names.slice(0, cut) : names)) target.opens.push({ name: x, scoped });
      continue;
    }
    if ((m = DECL.exec(L))) decls.push({ kw: m[1], full: /^_root_\./.test(m[2]) ? rootless(m[2]) : join(ns(), m[2]), line: k + 1, written: m[2] });
    if ((m = NOTATION.exec(L))) notations.push({ atom: m[2], scoped: !!m[1] && /scoped/.test(m[1]), lhs: m[3], rhs: m[4].trim(), line: k + 1, ns: ns() });
  }
  return { lines, at, decls, notations };
}
/* the namespaces a name may resolve against at a line, and the scopes whose scoped notations are active — an
   over-approximation of Lean's rules: every prefix of the current namespace, and each opened name read relative to
   those prefixes and to the namespaces opened before it */
function visibility(at) {
  const pre = prefixes(at.ns);
  const opened = [], active = new Set(pre);
  for (const o of at.opens) {
    const cands = /^_root_\./.test(o.name) ? [rootless(o.name)] : [...new Set(pre.map((p) => join(p, o.name)).concat(opened.map((v) => join(v, o.name))))];
    for (const c of cands) { active.add(c); if (!o.scoped) opened.push(c); }
  }
  return { names: [...new Set(pre.concat(opened))], scopes: active };
}

/* ── the two statements ─────────────────────────────────────────────────────── */
const IDENT = /[A-Za-z_][A-Za-z0-9_'!?₀-₉]*(?:\.[A-Za-z_][A-Za-z0-9_'!?₀-₉]*)*/y;
function tokens(text, atoms) {
  const out = []; let i = 0;
  while (i < text.length) {
    if (/\s/.test(text[i])) { i++; continue; }
    const atom = atoms.find((a) => text.startsWith(a, i));
    if (atom) { out.push({ t: atom, atom: true }); i += atom.length; continue; }
    IDENT.lastIndex = i; const m = IDENT.exec(text);
    if (m) { out.push({ t: m[0], ident: true }); i += m[0].length; continue; }
    out.push({ t: text[i] }); i++;
  }
  return out;
}
function statementOf(rel) {
  const src = rd(rel), s = strip(src), sc = scan(s);
  const short = THEOREM.split('.').pop();
  const m = new RegExp('^[ \\t]*theorem[ \\t]+' + short.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'm').exec(s) || die(rel + ' has no theorem ' + short);
  const from = s.slice(0, m.index).split('\n').length;
  const decl = sc.decls.find((d) => d.line === from) || die(rel + ': the theorem line was not read as a declaration');
  if (decl.full !== THEOREM) die(rel + ' declares ' + decl.full + ', not ' + THEOREM);
  let i = m.index + m[0].length, depth = 0;
  for (; i < s.length; i++) { const c = s[i]; if ('([{⟨'.includes(c)) depth++; else if (')]}⟩'.includes(c)) depth--; else if (!depth && s.startsWith(':=', i)) break; }
  if (i >= s.length) die(rel + ': no := after the theorem');
  const to = s.slice(0, i).split('\n').length;
  const text = s.slice(m.index + m[0].length, i).replace(/\s+/g, ' ').trim();
  const at = sc.at[from - 1];
  const binders = new Set([...text.matchAll(/[({[]\s*([A-Za-z_][\w']*(?:\s+[A-Za-z_][\w']*)*)\s*:/g)].flatMap((x) => x[1].split(/\s+/)));
  return { rel, from, to, text, at, binders, src };
}
const chSt = statementOf(CHALLENGE_FILE), solSt = statementOf(SOLUTION_FILE);

/* the declarations and notations of a closure that bear on the statement: every file holding one of the words is scanned */
function indexOf(files, words) {
  const decls = [], notations = [];
  for (const f of [...files].sort()) {
    const src = rd(f);
    if (!words.some((w) => src.includes(w))) continue;
    const sc = scan(strip(src));
    for (const d of sc.decls) if (words.includes(d.full.split('.').pop())) decls.push(Object.assign({ path: f }, d));
    for (const n of sc.notations) if (words.includes(n.atom)) notations.push(Object.assign({ path: f, at: sc.at[n.line - 1] }, n));
  }
  return { decls, notations };
}
const atomsIn = (text) => [...new Set([...text.matchAll(/[A-Za-z]+\^/g)].map((x) => x[0]))];   /* a notation's leading atom, e.g. Hdg^ */
const ATOMS = [...new Set(atomsIn(chSt.text).concat(atomsIn(solSt.text)))];
const tokCh = tokens(chSt.text, ATOMS), tokSol = tokens(solSt.text, ATOMS);
if (tokCh.length !== tokSol.length) die('the two statements do not align token for token (' + tokCh.length + ' vs ' + tokSol.length + ')');
const isLocal = (st, t) => st.binders.has(t.split('.')[0]);
const words = [...new Set(tokCh.concat(tokSol).filter((t) => t.ident).map((t) => t.t.split('.').pop()).concat(ATOMS))];
const chIdx = indexOf(chFiles, words), solIdx = indexOf(solFiles, words);

function resolveName(name, at, idx, where) {
  const vis = visibility(at).names;
  const want = new Set([rootless(name)].concat(/^_root_\./.test(name) ? [] : vis.map((v) => join(v, name))));
  const hits = idx.decls.filter((d) => want.has(d.full));
  const uniq = [...new Map(hits.map((d) => [d.full + '@' + d.path, d])).values()];
  if (uniq.length > 1) die(where + ': ' + name + ' could resolve to ' + uniq.map((d) => d.full + ' (' + d.path + ':' + d.line + ')').join(', '));
  return uniq[0] || null;
}
function resolveNotation(atom, st, idx, files, where) {
  const scopes = visibility(st.at).scopes;
  const active = idx.notations.filter((n) => n.atom === atom && (!n.scoped || scopes.has(n.ns)));
  if (active.length !== 1) die(where + ': ' + active.length + ' active notations for ' + atom + ' (of ' + idx.notations.filter((n) => n.atom === atom).length + ' in the closure)');
  const n = active[0];
  const vars = new Set([...n.lhs.matchAll(/[A-Za-z_][\w']*/g)].map((x) => x[0]));
  const head = ([...n.rhs.matchAll(/(?:_root_\.)?[A-Za-z_][A-Za-z0-9_'.]*/g)].map((x) => x[0]).find((x) => !vars.has(x))) || die(where + ': no head constant in the expansion of ' + atom);
  const d = resolveName(head, n.at, indexOf(files, [rootless(head).split('.').pop()]), where + ' (the expansion of ' + atom + ')') || die(where + ': the head of ' + atom + ', ' + head + ', is declared nowhere in the closure');
  return { atom, path: n.path, line: n.line, namespace: n.ns, scoped: n.scoped, expansion: n.rhs, head: d };
}
const declRef = (d) => ({ name: d.full, path: d.path, line: d.line, sha256: ev(d.path).sha256 });
function constantsOf(st, toks, idx, files, where) {
  return toks.map((t) => {
    if (t.atom) { const n = resolveNotation(t.t, st, idx, files, where); return { token: t.t, notation: n }; }
    if (!t.ident) return { token: t.t };
    if (isLocal(st, t.t)) return { token: t.t, local: true };
    const d = resolveName(t.t, st.at, idx, where);
    return { token: t.t, decl: d };
  });
}
const cCh = constantsOf(chSt, tokCh, chIdx, chFiles, 'the challenge'), cSol = constantsOf(solSt, tokSol, solIdx, solFiles, 'the solution');

const textual = [], pairs = [], sharedNames = new Set();
for (let k = 0; k < tokCh.length; k++) {
  const a = cCh[k], b = cSol[k];
  if (a.token !== b.token) textual.push({ challenge: a.token, solution: b.token });
  if (a.notation || b.notation) {
    if (!(a.notation && b.notation)) die('a notation on one side only: ' + a.token + ' / ' + b.token);
    if (a.notation.head.full !== b.notation.head.full) pairs.push({ via: 'notation ' + a.token, textual: a.token !== b.token, challenge: declRef(a.notation.head), solution: declRef(b.notation.head) });
    continue;
  }
  if (a.local || b.local) { if (a.token !== b.token) die('a bound name differs: ' + a.token + ' / ' + b.token); continue; }
  if (!('decl' in a)) { if (a.token !== b.token) die('a symbol differs: ' + a.token + ' / ' + b.token); continue; }
  const na = a.decl ? a.decl.full : null, nb = b.decl ? b.decl.full : null;
  if (!na && !nb) { if (a.token !== b.token) die('two names outside the release\'s tree differ: ' + a.token + ' / ' + b.token); sharedNames.add(a.token); continue; }
  if (!na || !nb) die('one side resolves ' + (na ? a.token : b.token) + ' in the release\'s tree and the other outside it');
  if (na !== nb) pairs.push({ via: 'name', textual: a.token !== b.token, challenge: declRef(a.decl), solution: declRef(b.decl) });
  else die('both sides resolve ' + a.token + ' to the same in-tree constant ' + na + ', which the disjoint closures forbid');
}
const uniqPairs = [...new Map(pairs.map((p) => [p.challenge.name + '|' + p.solution.name, p])).values()];
if (!uniqPairs.length) die('the two statements name the same constants: the consequence this reading records does not follow');
for (const p of uniqPairs) {
  if (!chFiles.has(p.challenge.path)) die(p.challenge.name + ' is declared outside the challenge closure');
  if (!solFiles.has(p.solution.path)) die(p.solution.name + ' is declared outside the solution closure');
  if (!p.solution.name.startsWith('OAI.')) die(p.solution.name + ' is not one of the release\'s OAI.* names');
}
const notationRec = (n) => ({ atom: n.atom, path: n.path, line: n.line, sha256: ev(n.path).sha256, namespace: n.namespace, scoped: n.scoped, expansion: n.expansion, head: n.head.full });
const chNotation = cCh.find((c) => c.notation).notation, solNotation = cSol.find((c) => c.notation).notation;

/* ── spot checks: the copies, read against the originals ────────────────────── */
function spanOf(rel, line) {
  const lines = strip(rd(rel)).split('\n');
  let end = line;
  for (let k = line; k < lines.length; k++) { if (lines[k].trim() && !/^\s/.test(lines[k])) break; if (lines[k].trim()) end = k + 1; }
  return { from: line, to: end, text: lines.slice(line - 1, end).join('\n') };
}
const cutTok = (t) => (t.ident ? rootless(t.t).split('.').pop() : t.t);
const IS_DEF = /^(def|abbrev|class|class inductive|structure|inductive|instance|opaque)$/;   /* a definition, not a lemma: what a statement can mean */
function fileDecls(rel) { return scan(strip(rd(rel))).decls; }
/* NAMESPACE: equal once every name is cut to its last component. RENAMED: the same tokens but for names whose last
   component differs too (listed). DIFFERS: the text differs beyond names (the first difference shown). */
const spot = [];
for (const p of uniqPairs) {
  const queue = [[p.challenge.path, p.challenge.name, p.solution.path, p.solution.name]];
  const done = new Set();
  while (queue.length) {
    const [cp, cn, sp, sn] = queue.shift();
    if (done.has(cn)) continue; done.add(cn);
    const cd = fileDecls(cp).find((d) => d.full === cn), sd = fileDecls(sp).find((d) => d.full === sn);
    if (!cd || !sd) die('spot check: ' + cn + ' or ' + sn + ' not found again');
    const a = spanOf(cp, cd.line), b = spanOf(sp, sd.line);
    const xa = tokens(a.text, []), xb = tokens(b.text, []);
    const ta = xa.map(cutTok), tb = xb.map(cutTok);
    const aligned = xa.length === xb.length && xa.every((t, k) => !!t.ident === !!xb[k].ident && (t.ident || t.t === xb[k].t));
    const diffs = (sel) => [...new Map(xa.map((t, k) => [t.t, xb[k].t]).filter(sel).map(([x, y]) => [x + '|' + y, { challenge: x, solution: y }])).values()];
    const renamed = aligned ? diffs(([x, y]) => cutTok({ ident: true, t: x }) !== cutTok({ ident: true, t: y })) : null;
    const reads = !aligned ? 'DIFFERS' : renamed.length ? 'RENAMED' : 'NAMESPACE';
    const k0 = ta.findIndex((x, j) => x !== tb[j]);
    spot.push({ challenge: { name: cn, kind: cd.kw, path: cp, lines: a.from + '-' + a.to, sha256: ev(cp).sha256 }, solution: { name: sn, kind: sd.kw, path: sp, lines: b.from + '-' + b.to, sha256: ev(sp).sha256 },
      tokens: ta.length, reads,
      qualifiedDifferently: aligned ? diffs(([x, y]) => x !== y && cutTok({ ident: true, t: x }) === cutTok({ ident: true, t: y })).length : undefined,
      renamed: reads === 'RENAMED' ? renamed : undefined,
      firstDifference: reads === 'DIFFERS' ? { token: k0, challenge: ta.slice(Math.max(0, k0 - 3), k0 + 5).join(' '), solution: tb.slice(Math.max(0, k0 - 3), k0 + 5).join(' ') } : undefined });
    /* the same-file definitions this one uses, paired by last component with the copy's file */
    const cDecls = fileDecls(cp), sDecls = fileDecls(sp);
    for (const w of new Set(ta)) {
      const c2 = cDecls.find((d) => d.full.split('.').pop() === w && d.line < cd.line && d.full !== cn && IS_DEF.test(d.kw));
      const s2 = sDecls.find((d) => d.full.split('.').pop() === w && d.line < sd.line && d.full !== sn && IS_DEF.test(d.kw));
      if (c2 && s2) queue.push([cp, c2.full, sp, s2.full]);
    }
  }
}

/* ── Comparator's rule, at lane K's pin ─────────────────────────────────────── */
const cmpRec = (which) => {
  const f = path.join(CMP, which.path);
  if (!fs.existsSync(f)) die('comparator ' + which.path + ' is not in the checkout');
  const h = shaOf(f), hc = shaOf(path.join(ROOT, which.copy));
  if (h !== hc) die('comparator ' + which.path + ' at ' + COMP.commit.slice(0, 8) + ' hashes to ' + h + ', the copy ' + which.copy + ' to ' + hc);
  return { text: fs.readFileSync(f, 'utf8').split('\n'), sha256: h };
};
const cmpC = cmpRec(COMP.compare), cmpM = cmpRec(COMP.main);
const L = (arr, a, b) => arr.slice(a - 1, b);
const findLine = (arr, re, what) => { const k = arr.findIndex((x) => re.test(x)); if (k < 0) die('comparator: ' + what + ' not found'); return k + 1; };
const lThrow = findLine(cmpC.text, /throw s!"Challenge and solution theorem statement do not match/, 'the statement-mismatch throw');
if (!/^\s*if challengeConst != solutionConst then\s*$/.test(cmpC.text[lThrow - 2])) die('comparator: the mismatch throw is not guarded by challengeConst != solutionConst');
const lVal = findLine(cmpC.text, /\| \.axiomInfo cc, \.axiomInfo sc => pure \(cc\.toConstantVal, sc\.toConstantVal\)/, 'the ConstantVal projection');
const lThm = findLine(cmpC.text, /\| \.thmInfo cc, \.thmInfo sc/, 'the theorem case');
const lCall = findLine(cmpM.text, /IO\.ofExcept <\| Comparator\.compareAt challenge solution targets/, 'the compareAt call');
const lAx = findLine(cmpM.text, /IO\.ofExcept <\| Comparator\.checkAxioms/, 'the axiom check');
const lKern = findLine(cmpM.text, /runExternalKernel kernelName kernelCommand solutionExport/, 'the external kernels');
const lBuiltin = findLine(cmpM.text, /result := result <\|> \(← runBuiltinKernel solution\)/, 'Lean\'s kernel');
const lBuildSol = findLine(cmpM.text, /safeLakeBuild solutionModule/, 'the solution build');
const lVerify = findLine(cmpM.text, /^\s*verifyMatch challengeExport solutionExport\s*$/, 'verifyMatch');
if (!(lCall < lAx && lAx < lKern && lKern < lBuiltin && lBuildSol < lVerify)) die('comparator: the order build → compare → axioms → kernels no longer holds');

/* ── the scope note ─────────────────────────────────────────────────────────── */
const note = rd(NOTE.path).split('\n');
const lHead = findLine(note, /^\| Result \| Comparator statement \|$/, 'the scope note\'s "Comparator statement" column');
const lRow = lHead + 2;
const challengeLink = '(../ComparatorChallenges/' + NAME + '/' + path.basename(CHALLENGE_FILE) + ')';
if (!note[lRow - 1].includes(challengeLink)) die('the scope note\'s Comparator-statement row does not link ' + challengeLink);
if (note.some((x) => x.includes('/' + path.basename(SOLUTION_FILE) + ')'))) die('the scope note now links the solution file; re-read it');

const spotCount = (w) => spot.filter((s) => s.reads === w).length;
const spotNames = (w) => spot.filter((s) => s.reads === w).map((s) => s.challenge.name.split('.').pop()).join(', ');
const spotRenamed = () => [...new Set(spot.flatMap((s) => s.renamed || []).map((r) => cutTok({ ident: true, t: r.challenge }) + ' → ' + cutTok({ ident: true, t: r.solution })))].join(', ');
if (spotCount('NAMESPACE') < 2) die('fewer than two spot-checked definitions differ only by namespace');

/* ── the record ─────────────────────────────────────────────────────────────── */
const lastRun = K2ROW.runs[K2ROW.runs.length - 1];
const short = (n) => n.split('.').pop();
const record = {
  what: 'A READING of github.com/openai/math at ' + PIN + ': the two theorem statements of the Comparator challenge ' + NAME + ' (family ' + FAMILY + '), their constants, their import closures, and the Comparator rule they meet. Written by tools/record-openai-hodge-statement.js from a sparse checkout at the pin; every file named carries its sha256.',
  word: 'READ',
  wordMeans: 'files fetched at the pin, parsed and hashed; no Lean was built, no Comparator was run, no kernel ran. A reading is a claim about the sources, not a certificate, and it is not lane K\'s word: lane K\'s row for this challenge is what its runs decided.',
  release: { repository: R2.repository, commit: PIN, census: CENSUS },
  challenge: NAME, family: FAMILY, theorem: THEOREM,
  files: [...pinned.values()].sort((a, b) => a.path.localeCompare(b.path)),
  config: { path: CHAL.config, theoremNames: cfg.theorem_names, definitionNames: cfg.definition_names || [], challengeModule: cfg.challenge_module, solutionModule: cfg.solution_module, enableNanoda: cfg.enable_nanoda },
  statements: {
    challenge: { path: CHALLENGE_FILE, lines: chSt.from + '-' + chSt.to, sha256: ev(CHALLENGE_FILE).sha256, namespace: chSt.at.ns, opens: chSt.at.opens, text: chSt.text },
    solution: { path: SOLUTION_FILE, lines: solSt.from + '-' + solSt.to, sha256: ev(SOLUTION_FILE).sha256, namespace: solSt.at.ns, opens: solSt.at.opens, text: solSt.text }
  },
  textualDifferences: textual,
  notation: { challenge: notationRec(chNotation), solution: notationRec(solNotation) },
  constantPairs: uniqPairs,
  sharedNames: { names: [...sharedNames].sort(), means: 'names neither closure declares under the namespaces the statement file can see: read as resolving outside the release\'s tree (Mathlib, Lean core) on both sides, the same package for both' },
  closures: {
    rule: 'modules named OAI.*, ComparatorChallenges.* or HodgeConjecture.* reached from the root through file headers ([public] [meta] import [all] M); HodgeConjecture.* resolves into ' + CH_DIR + ' by the lakefile; Mathlib and Lean core are outside the count. The census computed the same two counts with its own parser.',
    lakefile: ev('lean/lakefile.lean', lakeLine + '-' + (lakeLine + 2)),
    challenge: { root: CHAL.challengeModule, modules: chFiles.size, outsideChallengeDirectory: outsideDir.length },
    solution: { root: CHAL.solutionModule, modules: solFiles.size, rootImports: solutionImports },
    censusCounts: { challenge: ADDED.statementClosureModules, solution: ADDED.solutionClosureModules },
    sharedModules: shared.length,
    oaiScan: { files: oaiFiles.length + 1, of: 'lean/OAI.lean and every .lean file under lean/OAI (' + oaiFiles.length + ')', importingTheChallengeClosure: oaiImportingClosure.length, importingAnyComparatorChallengesOrHodgeConjectureModule: oaiImportingChallengeTree.length }
  },
  comparator: {
    repository: COMP.repository, commit: COMP.commit, laneKPin: 'corpus/openai-math/preregistration.json lanes.K.decider',
    compare: { path: COMP.compare.path, sha256: cmpC.sha256, copy: COMP.compare.copy,
      theoremCase: { lines: lThm + '-' + lVal, text: L(cmpC.text, lThm, lVal) },
      statementRule: { lines: (lThrow - 1) + '-' + lThrow, text: L(cmpC.text, lThrow - 1, lThrow) } },
    main: { path: COMP.main.path, sha256: cmpM.sha256, copy: COMP.main.copy,
      order: { buildSolution: lBuildSol, verifyMatch: lVerify, compareAt: lCall, checkAxioms: lAx, externalKernels: lKern, leanKernel: lBuiltin } },
    rule: 'For each theorem target, compareAt takes the challenge\'s and the solution\'s ConstantVal — name, universe parameters, type — (Compare.lean ' + lThm + '-' + lVal + ') and throws "Challenge and solution theorem statement do not match" when they differ (' + (lThrow - 1) + '-' + lThrow + '). Main.lean builds both modules, then calls compareAt (line ' + lCall + ') before the axiom check (' + lAx + ') and before any kernel (' + lKern + ', ' + lBuiltin + ').'
  },
  consequence: {
    statementComparisonCanPass: !(uniqPairs.length && !shared.length),
    why: 'The solution\'s statement names ' + uniqPairs.length + ' constants declared only in modules of its own closure (' + uniqPairs.map((p) => p.solution.name).join(', ') + '); the challenge\'s closure shares no module with it, so the challenge\'s statement cannot name them, and names its own instead (' + uniqPairs.map((p) => p.challenge.name).join(', ') + '). The two types differ, so the two ConstantVals differ, and Comparator throws at Compare.lean ' + lThrow + ' after building both sides and before any kernel runs.',
    scope: 'This is forced by the sources as read; no run here reached the comparison.'
  },
  scopeNote: { path: NOTE.path, sha256: NOTE.sha256, lines: lHead + '-' + lRow, header: note[lHead - 1], row: note[lRow - 1],
    reads: 'presents ' + path.basename(CHALLENGE_FILE) + ' as the "Comparator statement"; the solution\'s statement is a different one (the constant pairs above)' },
  laneK: { ledger: K2_REL, ledgerSha256: shaOf(path.join(ROOT, K2_REL)), word: K2ROW.word, run: lastRun.run, stage: lastRun.decided.stage, why: K2ROW.why },
  preregistration: { path: PRE_REL, sha256: shaOf(path.join(ROOT, PRE_REL)), REFUTED: P.lanes.K.words.REFUTED, REFUSED: P.lanes.K.words.REFUSED },
  spotChecks: { rule: 'each differing pair\'s two declarations, and the definitions (not lemmas) of the same file each uses, paired by last name with the copy\'s file, transitively; each compared from its declaration line to the next line at column 0, comments dropped. NAMESPACE: token for token equal once every name is cut to its last component. RENAMED: equal but for names whose last component differs as well (listed). DIFFERS: the text differs beyond names (the first difference shown).',
    counts: { NAMESPACE: spotCount('NAMESPACE'), RENAMED: spotCount('RENAMED'), DIFFERS: spotCount('DIFFERS'), of: spot.length },
    renamedNames: [...new Map(spot.flatMap((s) => s.renamed || []).map((r) => [cutTok({ ident: true, t: r.challenge }) + '|' + cutTok({ ident: true, t: r.solution }), { challenge: cutTok({ ident: true, t: r.challenge }), solution: cutTok({ ident: true, t: r.solution }) }])).values()],
    checks: spot },
  notChecked: [
    'Whether the release\'s copies are faithful to the challenge\'s definitions. Of the ' + spot.length + ' definitions spot-checked here (the four constants and the same-file definitions they use), ' + spotCount('NAMESPACE') + ' differ only by namespace (' + spotNames('NAMESPACE') + '), '
      + spotCount('RENAMED') + ' also by a renamed constant (' + spotRenamed() + ')' + (spotCount('DIFFERS') ? ', and ' + spotCount('DIFFERS') + ' in text beyond names (' + spotNames('DIFFERS') + ')' : '') + '. The constants they use from other files, and the rest of the ' + chFiles.size + '-module challenge library, were not compared, and equal text is not equal elaborated terms.',
    'That any run reached the comparison. Lane K\'s only job for this challenge at ' + PIN.slice(0, 8) + ' (run ' + lastRun.run + ', ' + K2_REL + ') is ' + K2ROW.word + ': ' + K2ROW.why + ' Under the pre-registration a statement mismatch is REFUTED only when Comparator rejects and a second run reproduces it.',
    'That the statements elaborate as read. Names and the ' + chNotation.atom + ' notation were resolved by declarations found in each side\'s closure under the file\'s namespace and opens, over-approximating Lean\'s rules; no Lean was built.',
    'That the shared names (' + [...sharedNames].sort().join(', ') + ') are the same constants on both sides: neither closure declares them under a visible namespace, so they were read as coming from outside the release\'s tree; Mathlib itself was not read.',
    'Whether OpenAI ran Comparator on this challenge and solution, and with what result: not looked for.',
    'The proof. Nothing here reads or checks the solution\'s proof.'
  ]
};

if (CHECK) {
  if (!fs.existsSync(OUT)) die(OUT_REL + ' does not exist; run without --check first');
  const prev = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  const a = JSON.stringify(stable(prev, [])), b = JSON.stringify(stable(record, []));
  if (a !== b) {
    const flat = (o, p, acc) => { if (o && typeof o === 'object') for (const k of Object.keys(o)) flat(o[k], p + '/' + k, acc); else acc[p] = o; return acc; };
    const fa = flat(JSON.parse(a), '', {}), fb = flat(JSON.parse(b), '', {});
    const keys = [...new Set(Object.keys(fa).concat(Object.keys(fb)))].filter((k) => fa[k] !== fb[k]).slice(0, 12);
    die(OUT_REL + ' differs from the re-derivation at ' + keys.length + (keys.length === 12 ? '+' : '') + ' place(s): ' + keys.map((k) => k + ' = ' + JSON.stringify(fa[k]) + ' → ' + JSON.stringify(fb[k])).join('; '));
  }
  console.log(OUT_REL + ' re-derived: the same record (' + uniqPairs.length + ' constant pairs, closures ' + chFiles.size + ' / ' + solFiles.size + ', ' + shared.length + ' shared)');
} else {
  const wrote = writeStable(OUT, record);
  console.log(OUT_REL + (wrote ? ' written' : ' (unchanged)') + ': READ; closures ' + chFiles.size + ' / ' + solFiles.size + ', ' + shared.length + ' shared; ' + oaiFiles.length + ' lean/OAI files, '
    + oaiImportingClosure.length + ' importing the challenge closure; ' + textual.length + ' textual differences, ' + uniqPairs.length + ' constant pairs (' + uniqPairs.map((p) => short(p.challenge.name)).join(', ') + '); '
    + 'spot checks ' + JSON.stringify({ NAMESPACE: spotCount('NAMESPACE'), RENAMED: spotCount('RENAMED'), DIFFERS: spotCount('DIFFERS') }));
}
if (!SRC && !KEEP) fs.rmSync(WORK, { recursive: true, force: true });
else console.log('the checkouts stay at ' + WORK);
