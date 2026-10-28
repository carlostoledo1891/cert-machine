#!/usr/bin/env node
/* eth-tsavo-gates.js — the statement checks of the TSavo bridge replay (github.com/TSavo/eth-bridge @ 34f9ca20, the
   theorem Bridge.ethIsFalse_of_claim : OAI…SqrtLogSpace.Claim → MainResults.ETHIsFalse, built inside Anthropic's eth
   project). ONE module, three consumers: .github/workflows/eth-tsavo.yml runs it on the fresh clones before anything is
   built, tools/record-eth-tsavo.js runs it again on the desk before it writes certs/eth-tsavo-bridge.json, and the
   battery runs its red controls. The verdict is not here: the rule lives in tools/record-eth-tsavo.js.

   sources [<tsavo-dir>] [<anthropic-eth-dir>]   (no network; tsavo-dir defaults to corpus/eth-refutation/tsavo/src)
     tree       every file of the TSavo tree has the sha256 corpus/eth-refutation/tsavo/pins.json pins; none missing,
                none extra
     statement  bridge/Bridge/OpenAIStatement.lean with the declared change undone (def ClaimAt (k : ℕ) : Prop := →
                theorem exact_count_and_sat (k : ℕ) (hk : 2 ≤ k) : … := by sorry; the appended def Claim removed) has
                the sha256 corpus/eth-refutation/pins.json pins for OpenAI's lean/ComparatorChallenges/
                SubexponentialSAT.lean; and its 23 statement lines never name hk and hold no tactic block, so dropping
                the binder changes nothing (the facts say so, the gate refuses otherwise)
     challenge  bridge/BridgeChallenge.lean, its comments removed, is exactly the two imports MainResults and
                Bridge.OpenAIStatement and the one theorem Bridge.ethIsFalse_of_claim (h : …SqrtLogSpace.Claim) :
                MainResults.ETHIsFalse := by sorry
     config     comparator_bridge.json names that challenge, the solution module Bridge.Main, that one theorem, no
                definition holes, only standard axioms, nanoda on, no external kernel
     census     no TSavo .lean file holds, outside comments, sorry (except the challenge's one hole), admit,
                native_decide, an axiom declaration, implemented_by, extern, unsafe or debug.skipKernelTC; the
                mentions inside comments are listed as facts
     mainResults / lakefile (when an Anthropic eth dir is given): MainResults.lean has the pinned sha256, lakefile.toml
                the pinned sha256 before the README's block is appended; the closure of Anthropic modules that
                Bridge.Main and Bridge.Joint import, walked through the project's own srcDirs
   lakefile <tsavo-dir> <anthropic-eth-dir> [--challenge-lib]
     checks the pinned lakefile, then appends the README's [[lean_lib]] Bridge block exactly; with --challenge-lib,
     on a lakefile that is already the README layout, it appends the ONE declared amendment: a [[lean_lib]] for the
     module BridgeChallenge, without which Lake cannot resolve the challenge module Comparator builds
   asbuilt <tsavo-dir> <lakefile.toml>
     which of the two lakefiles a run built with (README alone, or README + the declared amendment), or refused
   controls [<tsavo-dir>] [<as-built lakefile>]
     the red controls: the clean copy passes, and every tampered copy (one per check) is refused; given a run's
     as-built lakefile, it must classify, and three tampered lakefiles must not

   exit 0 when every gate passes; 1 with the reasons otherwise. */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const ETH = path.join(ROOT, 'corpus', 'eth-refutation');
const TSAVO_SRC = path.join(ETH, 'tsavo', 'src');
const STANDARD = ['propext', 'Classical.choice', 'Quot.sound'];
const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');
const readJSON = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const pins = () => readJSON(path.join(ETH, 'pins.json'));
const tsavoPins = () => readJSON(path.join(ETH, 'tsavo', 'pins.json'));

const OPENAI_FILE = 'lean/ComparatorChallenges/SubexponentialSAT.lean';
const MAINRESULTS_FILE = 'eth/MainResults.lean';
const LAKEFILE_FILE = 'eth/lakefile.toml';
/* the declared change, as TSavo's NOTICE states it: the sorry'd theorem becomes def ClaimAt, and def Claim is added */
const CHANGE = {
  theoremLine: 'theorem exact_count_and_sat (k : ℕ) (hk : 2 ≤ k) :',
  defLine: 'def ClaimAt (k : ℕ) : Prop :=',
  statementLines: 23,
  tail: ' := by',
  proofLine: '  sorry',
  // inserted after the blank line that follows the statement in the original, before `end`
  appended: ['/-- The full claim: `exact_count_and_sat` for every k ≥ 2. -/', 'def Claim : Prop := ∀ k : ℕ, 2 ≤ k → ClaimAt k', ''],
};
const CHALLENGE_TEXT = 'import MainResults import Bridge.OpenAIStatement theorem Bridge.ethIsFalse_of_claim ' +
  '(h : OAI.Algorithms.SubexponentialSAT.SqrtLogSpace.Claim) : MainResults.ETHIsFalse := by sorry';
const CONFIG = {
  challenge_module: 'BridgeChallenge', solution_module: 'Bridge.Main', theorem_names: ['Bridge.ethIsFalse_of_claim'],
  definition_names: [], enable_nanoda: true,
};
/* the ONE declared amendment (used only when Comparator, on the README's lakefile, cannot resolve BridgeChallenge) */
const CHALLENGE_LIB = '[[lean_lib]]\nname = "BridgeChallenge"\nsrcDir = "bridge"\n';
const FORBIDDEN = [
  [/\bsorry\b/g, 'sorry'], [/\badmit\b/g, 'admit'], [/\bnative_decide\b/g, 'native_decide'],
  [/^\s*(?:@\[[^\]]*\]\s*)?(?:(?:private|protected|noncomputable|unsafe)\s+)*axiom\s/gm, 'an axiom declaration'],
  [/implemented_by/g, 'implemented_by'], [/@\[\s*extern/g, 'extern'], [/\bunsafe\b/g, 'unsafe'], [/skipKernelTC/g, 'debug.skipKernelTC'],
];

/* Lean source with every comment (line, block, doc, nested) and string literal blanked, newlines kept so that line
   numbers survive */
function stripComments(t) {
  let out = '';
  let i = 0;
  let depth = 0;
  while (i < t.length) {
    if (depth > 0) {
      if (t.startsWith('/-', i)) { depth++; out += '  '; i += 2; continue; }
      if (t.startsWith('-/', i)) { depth--; out += '  '; i += 2; continue; }
      out += t[i] === '\n' ? '\n' : ' '; i++; continue;
    }
    if (t.startsWith('/-', i)) { depth = 1; out += '  '; i += 2; continue; }
    if (t.startsWith('--', i)) { while (i < t.length && t[i] !== '\n') { out += ' '; i++; } continue; }
    if (t[i] === '"') {
      out += '"'; i++;
      while (i < t.length && t[i] !== '"') { if (t[i] === '\\') { out += ' '; i++; } out += t[i] === '\n' ? '\n' : ' '; i++; }
      out += '"'; i++; continue;
    }
    out += t[i]; i++;
  }
  return out;
}
const lineOf = (t, idx) => t.slice(0, idx).split('\n').length;

function walk(dir, rel = '', out = []) {
  for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    if (e.name === '.git' || e.name === '.lake') continue;
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) walk(dir, r, out); else if (e.isFile()) out.push(r);
  }
  return out.sort();
}

/* the README's lakefile block, verbatim: the fenced block that follows the word "append" */
function readmeBlock(readme) {
  const m = /append\n```\n([\s\S]*?)\n```/.exec(readme);
  if (!m) throw new Error('README.md: no fenced block after "append"');
  return m[1];
}
const asBuilt = (original, block, withLib) => original + '\n' + block + '\n' + (withLib ? '\n' + CHALLENGE_LIB : '');

function checkTree(dir, fails, facts) {
  const want = tsavoPins().tsavo.files;
  const got = {};
  for (const f of walk(dir)) got[f] = sha256(fs.readFileSync(path.join(dir, f)));
  const missing = Object.keys(want).filter((f) => !(f in got));
  const extra = Object.keys(got).filter((f) => !(f in want));
  const differ = Object.keys(want).filter((f) => f in got && got[f] !== want[f]);
  if (missing.length) fails.push('tree: missing ' + missing.join(', '));
  if (extra.length) fails.push('tree: unpinned ' + extra.join(', '));
  if (differ.length) fails.push('tree: sha256 differs for ' + differ.join(', '));
  facts.tree = { files: Object.keys(got).length, pinned: Object.keys(want).length, ok: !missing.length && !extra.length && !differ.length };
}

function undoChange(text) {
  const L = text.split('\n');
  const at = L.indexOf(CHANGE.defLine);
  if (at < 0) throw new Error('OpenAIStatement.lean: the line "' + CHANGE.defLine + '" is not there');
  if (L.indexOf(CHANGE.defLine, at + 1) >= 0) throw new Error('OpenAIStatement.lean: the definition line occurs twice');
  const stmt = L.slice(at + 1, at + 1 + CHANGE.statementLines);
  if (stmt.length !== CHANGE.statementLines) throw new Error('OpenAIStatement.lean: the statement is cut short');
  const after = L.slice(at + 1 + CHANGE.statementLines, at + 1 + CHANGE.statementLines + 1 + CHANGE.appended.length);
  // after the statement: the blank line the original had before `end`, then the appended Claim (blank, doc, def)
  if (after[0] !== '' || CHANGE.appended.some((l, i) => after[1 + i] !== l)) throw new Error('OpenAIStatement.lean: the appended def Claim is not exactly the declared one');
  const rebuilt = [...L.slice(0, at), CHANGE.theoremLine, ...stmt.slice(0, -1), stmt[stmt.length - 1] + CHANGE.tail, CHANGE.proofLine, '',
    ...L.slice(at + 1 + CHANGE.statementLines + 1 + CHANGE.appended.length)].join('\n');
  return { rebuilt, stmt };
}

function checkStatement(dir, fails, facts) {
  const want = pins().claims.openai.files[OPENAI_FILE];
  try {
    const { rebuilt, stmt } = undoChange(fs.readFileSync(path.join(dir, 'bridge/Bridge/OpenAIStatement.lean'), 'utf8'));
    const got = sha256(Buffer.from(rebuilt, 'utf8'));
    const hkLines = stmt.map((l, i) => /\bhk\b/.test(l) ? i + 1 : 0).filter(Boolean);
    const tactic = stmt.some((l) => /\bby\b/.test(stripComments(l)));
    facts.statement = { pinned: want, rebuilt: got, statementLines: stmt.length, hkMentioned: hkLines.length > 0, hkLines, tacticBlockInStatement: tactic,
      reads: 'Claim = ∀ k : ℕ, 2 ≤ k → ClaimAt k, ClaimAt k = the 23 statement lines of exact_count_and_sat; ' +
        (hkLines.length ? 'the statement NAMES hk, so dropping the binder changes it' : 'the 23 lines never name hk, so ∀ (k) (hk : 2 ≤ k), S k and ∀ k, 2 ≤ k → ClaimAt k are the same proposition up to unfolding ClaimAt') };
    if (got !== want) fails.push('statement: the copy with the declared change undone has sha256 ' + got + ', the pin is ' + want);
    if (hkLines.length) fails.push('statement: the statement lines name hk (lines ' + hkLines.join(', ') + ' of the 23): dropping the binder changes the statement');
    if (tactic) fails.push('statement: a tactic block inside the statement could read hk from the context');
  } catch (e) { fails.push('statement: ' + e.message); }
}

function checkChallenge(dir, fails, facts) {
  const raw = fs.readFileSync(path.join(dir, 'bridge/BridgeChallenge.lean'), 'utf8');
  const text = stripComments(raw).replace(/\s+/g, ' ').trim();
  facts.challenge = { text, expected: CHALLENGE_TEXT, ok: text === CHALLENGE_TEXT };
  if (text !== CHALLENGE_TEXT) fails.push('challenge: BridgeChallenge.lean, comments removed, reads "' + text + '", not "' + CHALLENGE_TEXT + '"');
}

function checkConfig(dir, fails, facts) {
  const cfg = readJSON(path.join(dir, 'comparator_bridge.json'));
  facts.config = cfg;
  for (const [k, v] of Object.entries(CONFIG)) if (JSON.stringify(cfg[k]) !== JSON.stringify(v)) fails.push('config: ' + k + ' is ' + JSON.stringify(cfg[k]) + ', not ' + JSON.stringify(v));
  const ax = cfg.permitted_axioms || [];
  if (!ax.length || ax.some((a) => !STANDARD.includes(a))) fails.push('config: permitted_axioms ' + JSON.stringify(ax) + ' is not a subset of the three standard axioms');
  const extraKeys = Object.keys(cfg).filter((k) => !(k in CONFIG) && k !== 'permitted_axioms');
  if (extraKeys.length) fails.push('config: unexpected keys ' + extraKeys.join(', '));
}

function checkCensus(dir, fails, facts) {
  const files = walk(dir).filter((f) => f.endsWith('.lean'));
  const found = [];
  const inComments = [];
  for (const f of files) {
    const raw = fs.readFileSync(path.join(dir, f), 'utf8');
    const code = stripComments(raw);
    for (const [re, what] of FORBIDDEN) {
      for (const m of code.matchAll(re)) found.push({ file: f, line: lineOf(code, m.index), what });
      const inRaw = [...raw.matchAll(re)].length - [...code.matchAll(re)].length;
      if (inRaw > 0) inComments.push({ file: f, what, count: inRaw });
    }
  }
  // the one allowed: the hole of the challenge file (a Comparator challenge states its theorem with sorry)
  const hole = found.filter((x) => x.file === 'bridge/BridgeChallenge.lean' && x.what === 'sorry');
  const bad = found.filter((x) => !(x.file === 'bridge/BridgeChallenge.lean' && x.what === 'sorry'));
  if (hole.length !== 1) fails.push('census: BridgeChallenge.lean has ' + hole.length + ' sorry, not the one hole');
  for (const b of bad) fails.push('census: ' + b.file + ':' + b.line + ' contains ' + b.what);
  const imports = {};
  for (const f of files) imports[f] = importsOf(fs.readFileSync(path.join(dir, f), 'utf8'));
  facts.census = { leanFiles: files, forbidden: bad, challengeHole: hole, mentionsInComments: inComments, imports };
}

function importsOf(text) {
  return [...stripComments(text).matchAll(/^\s*(?:public\s+|meta\s+|private\s+)*import\s+(?:all\s+)?([A-Za-z0-9_.«»']+)/gm)].map((m) => m[1]);
}

/* the Anthropic modules Bridge.Main and Bridge.Joint reach, walked through the eth project's own srcDirs (the
   lakefile's srcDir lines, "." for libs without one, and TSavo's "bridge"); a module found in no srcDir is external
   (Mathlib and its dependencies) */
function anthropicClosure(tsavoDir, ethDir) {
  const lake = fs.readFileSync(path.join(ethDir, 'lakefile.toml'), 'utf8');
  const srcDirs = ['.', ...[...lake.matchAll(/^srcDir = "([^"]+)"/gm)].map((m) => m[1])];
  const locate = (mod) => {
    const rel = mod.split('.').join('/') + '.lean';
    if (mod.startsWith('Bridge.') && fs.existsSync(path.join(tsavoDir, 'bridge', rel))) return { owner: 'tsavo', file: 'bridge/' + rel, abs: path.join(tsavoDir, 'bridge', rel) };
    const hits = srcDirs.map((d) => path.join(d, rel)).filter((p) => fs.existsSync(path.join(ethDir, p)));
    if (hits.length > 1) throw new Error('module ' + mod + ' resolves to two files: ' + hits.join(', '));
    return hits.length ? { owner: 'anthropic', file: 'eth/' + path.normalize(hits[0]), abs: path.join(ethDir, hits[0]) } : null;
  };
  const per = {};
  for (const root of ['Bridge.Main', 'Bridge.Joint']) {
    const seen = new Map();
    const todo = [root];
    while (todo.length) {
      const m = todo.pop();
      if (seen.has(m)) continue;
      const loc = locate(m);
      seen.set(m, loc);
      if (loc) for (const i of importsOf(fs.readFileSync(loc.abs, 'utf8'))) todo.push(i);
    }
    const ant = [...seen].filter(([, l]) => l && l.owner === 'anthropic').map(([m, l]) => ({ module: m, file: l.file })).sort((a, b) => a.module.localeCompare(b.module));
    const external = [...new Set([...seen].filter(([, l]) => !l).map(([m]) => m.split('.')[0]))].sort();
    per[root] = { anthropicModules: ant, anthropicCount: ant.length, externalRoots: external, includesSolution: ant.some((x) => x.module === 'Solution') };
  }
  const direct = [...new Set(walk(tsavoDir).filter((f) => f.endsWith('.lean')).flatMap((f) => importsOf(fs.readFileSync(path.join(tsavoDir, f), 'utf8'))))]
    .filter((m) => !m.startsWith('Bridge.') && m !== 'Mathlib').sort();
  return { srcDirs, directAnthropicImports: direct, closure: per };
}

function checkMainResults(ethDir, fails, facts) {
  const want = pins().claims.anthropic.files[MAINRESULTS_FILE];
  const got = sha256(fs.readFileSync(path.join(ethDir, 'MainResults.lean')));
  facts.mainResults = { pinned: want, got };
  if (got !== want) fails.push('mainResults: eth/MainResults.lean has sha256 ' + got + ', the pin is ' + want);
}
function checkLakefilePin(ethDir, fails, facts) {
  const want = pins().claims.anthropic.files[LAKEFILE_FILE];
  const got = sha256(fs.readFileSync(path.join(ethDir, 'lakefile.toml')));
  facts.lakefile = { pinned: want, got };
  if (got !== want) fails.push('lakefile: eth/lakefile.toml has sha256 ' + got + ', the pin is ' + want + ' (checked before the README block is appended)');
}

const CHECKS = {
  tree: (t, e, f, x) => checkTree(t, f, x),
  statement: (t, e, f, x) => checkStatement(t, f, x),
  challenge: (t, e, f, x) => checkChallenge(t, f, x),
  config: (t, e, f, x) => checkConfig(t, f, x),
  census: (t, e, f, x) => checkCensus(t, f, x),
  mainResults: (t, e, f, x) => e && checkMainResults(e, f, x),
  lakefile: (t, e, f, x) => e && checkLakefilePin(e, f, x),
  closure: (t, e, f, x) => { if (e) try { x.anthropic = anthropicClosure(t, e); } catch (err) { f.push('closure: ' + err.message); } },
};
/* every check, or (for a red control) only the one named, so that a control proves THAT check refuses */
function checkSources(tsavoDir = TSAVO_SRC, ethDir = null, only = null) {
  const fails = [];
  const facts = {};
  for (const [name, run] of Object.entries(CHECKS)) if (!only || only === name) run(tsavoDir, ethDir, fails, facts);
  return { ok: fails.length === 0, fails, facts };
}

/* which lakefile a run built with: strip the appended suffix, the rest must be the pinned bytes */
function classifyLakefile(text, tsavoDir = TSAVO_SRC) {
  const block = readmeBlock(fs.readFileSync(path.join(tsavoDir, 'README.md'), 'utf8'));
  const pin = pins().claims.anthropic.files[LAKEFILE_FILE];
  for (const [layout, withLib] of [['readme', false], ['readme+challenge-lib', true]]) {
    const suffix = asBuilt('', block, withLib);
    if (text.endsWith(suffix) && sha256(Buffer.from(text.slice(0, text.length - suffix.length), 'utf8')) === pin) return { ok: true, layout, block, sha256: sha256(Buffer.from(text, 'utf8')) };
  }
  return { ok: false, why: 'the lakefile is neither the pinned bytes + the README block nor that + the declared challenge lib' };
}

/* the red controls: one tampered copy per check, each must be refused; the clean copy must pass */
function controls(tsavoDir = TSAVO_SRC, lakefile = null, ethDir = null) {
  const results = [];
  const clean = checkSources(tsavoDir);
  results.push({ control: 'clean copy', wantRefused: false, refused: !clean.ok, fails: clean.fails });
  const edit = (rel, fn) => (d) => { const p = path.join(d, rel); fs.writeFileSync(p, fn(fs.readFileSync(p, 'utf8'))); };
  const S = 'bridge/Bridge/OpenAIStatement.lean';
  const C = 'bridge/BridgeChallenge.lean';
  /* [name, the ONE check that must refuse it (run alone, so another check cannot mask it), a substring of its reason,
     the mutation] */
  const cases = [
    ['a file changed by one byte', 'tree', 'sha256 differs', edit('README.md', (t) => t + ' ')],
    ['an unpinned file added', 'tree', 'unpinned', (d) => fs.writeFileSync(path.join(d, 'bridge', 'Extra.lean'), 'theorem x : True := trivial\n')],
    ['a pinned file removed', 'tree', 'missing', (d) => fs.rmSync(path.join(d, 'POST.md'))],
    ['one character of the statement changed (0 < C becomes 0 ≤ C)', 'statement', 'the pin is', edit(S, (t) => t.replace('0 < C ∧ 0 < A', '0 ≤ C ∧ 0 < A'))],
    ['the statement names hk', 'statement', 'name hk', edit(S, (t) => t.replace('0 < C ∧ 0 < A ∧ 0 < S ∧ 0 < d ∧ 0 < e ∧', '0 < C ∧ 0 < A ∧ 0 < S ∧ 0 < d ∧ 0 < e ∧ hk = hk ∧'))],
    ['a tactic block inside the statement', 'statement', 'tactic block', edit(S, (t) => t.replace('(countWord (SAT.count F)).length ≤ n + 1 ∧', '(countWord (SAT.count F)).length ≤ n + (by exact 1) ∧'))],
    ['Claim quantifies k ≥ 3 instead of k ≥ 2', 'statement', 'appended def Claim', edit(S, (t) => t.replace('def Claim : Prop := ∀ k : ℕ, 2 ≤ k → ClaimAt k', 'def Claim : Prop := ∀ k : ℕ, 3 ≤ k → ClaimAt k'))],
    ['the definition line renamed', 'statement', 'is not there', edit(S, (t) => t.replace('def ClaimAt (k : ℕ) : Prop :=', 'abbrev ClaimAt (k : ℕ) : Prop :='))],
    ['a third import in the challenge', 'challenge', 'reads', edit(C, (t) => t.replace('import Bridge.OpenAIStatement', 'import Bridge.OpenAIStatement\nimport Bridge.Main'))],
    ['the conclusion weakened to True', 'challenge', 'reads', edit(C, (t) => t.replace('MainResults.ETHIsFalse := by', 'True := by'))],
    ['the hypothesis changed to ClaimAt 3', 'challenge', 'reads', edit(C, (t) => t.replace('SqrtLogSpace.Claim)', 'SqrtLogSpace.ClaimAt 3)'))],
    ['the hole filled by another proof', 'challenge', 'reads', edit(C, (t) => t.replace('  sorry', '  exact Bridge.cheat h'))],
    ['another solution module', 'config', 'solution_module', edit('comparator_bridge.json', (t) => t.replace('"Bridge.Main"', '"Bridge.Joint"'))],
    ['an extra permitted axiom', 'config', 'permitted_axioms', edit('comparator_bridge.json', (t) => t.replace('"Classical.choice"', '"Classical.choice", "sorryAx"'))],
    ['nanoda off', 'config', 'enable_nanoda', edit('comparator_bridge.json', (t) => t.replace('"enable_nanoda": true', '"enable_nanoda": false'))],
    ['an external kernel added', 'config', 'unexpected keys', edit('comparator_bridge.json', (t) => t.replace('"enable_nanoda": true', '"enable_nanoda": true, "external_kernels": {"k": ["true"]}'))],
    ['a sorry in Main.lean', 'census', 'contains sorry', edit('bridge/Bridge/Main.lean', (t) => t.replace('ethIsFalse_of_subexpTM (subexpTM_of_claimAt3 (h 3 (by norm_num)))', 'by sorry'))],
    ['an axiom declaration', 'census', 'an axiom declaration', edit('bridge/Bridge/BitLength.lean', (t) => t.replace('namespace Bridge', 'namespace Bridge\naxiom cheat : False'))],
    ['admit', 'census', 'contains admit', edit('bridge/Bridge/BitLength.lean', (t) => t.replace('namespace Bridge', 'namespace Bridge\ntheorem t0 : False := by admit'))],
    ['native_decide', 'census', 'native_decide', edit('bridge/Bridge/FrontEnd.lean', (t) => t.replace('namespace Bridge', 'namespace Bridge\ntheorem two : 1 + 1 = 2 := by native_decide'))],
    ['implemented_by', 'census', 'implemented_by', edit('bridge/Bridge/Joint.lean', (t) => t.replace('namespace Bridge', 'namespace Bridge\n@[implemented_by id] def f (n : Nat) : Nat := n'))],
    ['extern', 'census', 'extern', edit('bridge/Bridge/Joint.lean', (t) => t.replace('namespace Bridge', 'namespace Bridge\n@[extern "c_f"] def g (n : Nat) : Nat := n'))],
    ['unsafe', 'census', 'unsafe', edit('bridge/Bridge/Joint.lean', (t) => t.replace('namespace Bridge', 'namespace Bridge\nunsafe def h0 : Nat := 0'))],
    ['debug.skipKernelTC', 'census', 'skipKernelTC', edit('bridge/Bridge/Joint.lean', (t) => t.replace('namespace Bridge', 'set_option debug.skipKernelTC true in\nnamespace Bridge'))],
    ['a second sorry in the challenge', 'census', 'not the one hole', edit(C, (t) => t + '\ntheorem extra : False := by sorry\n')],
  ];
  for (const [name, check, why, mutate] of cases) {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'eth-tsavo-control-'));
    fs.cpSync(tsavoDir, tmp, { recursive: true });
    let r;
    try { mutate(tmp); r = checkSources(tmp, null, check); } catch (e) { r = { ok: false, fails: ['threw: ' + e.message] }; }
    finally { fs.rmSync(tmp, { recursive: true, force: true }); }
    const hit = r.fails.find((f) => f.startsWith(check + ':') && f.includes(why));
    results.push({ control: check + ': ' + name, wantRefused: true, refused: Boolean(hit), fails: hit ? [hit] : r.fails.slice(0, 3) });
  }
  // the Anthropic pins, when the project is at hand (the workflow, before the lakefile is patched)
  if (ethDir) {
    for (const [check, file] of [['mainResults', 'MainResults.lean'], ['lakefile', 'lakefile.toml']]) {
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'eth-tsavo-control-'));
      for (const f of ['MainResults.lean', 'lakefile.toml']) fs.copyFileSync(path.join(ethDir, f), path.join(tmp, f));
      const ok0 = checkSources(tsavoDir, tmp, check);
      fs.appendFileSync(path.join(tmp, file), '\n');
      const r = checkSources(tsavoDir, tmp, check);
      fs.rmSync(tmp, { recursive: true, force: true });
      results.push({ control: check + ': the pinned file as it is', wantRefused: false, refused: !ok0.ok, fails: ok0.fails });
      results.push({ control: check + ': one byte appended to ' + file, wantRefused: true, refused: !r.ok, fails: r.fails.slice(0, 1) });
    }
  }
  // the lakefile classifier, on a run's as-built lakefile when one is kept (the pinned original's bytes live there)
  if (lakefile && fs.existsSync(lakefile)) {
    const text = fs.readFileSync(lakefile, 'utf8');
    const c = classifyLakefile(text, tsavoDir);
    results.push({ control: 'the kept as-built lakefile (' + (c.layout || 'unclassified') + ')', wantRefused: false, refused: !c.ok, fails: c.ok ? [] : [c.why] });
    const lakeCases = [
      ['lakefile: one byte of Anthropic\'s part changed', text.replace('autoImplicit = false', 'autoImplicit = true ')],
      ['lakefile: one more line after the blocks', text + 'moreLeanArgs = ["-DmaxHeartbeats=0"]\n'],
      ['lakefile: the README block with another glob', text.replace('globs = ["Bridge.+"]', 'globs = ["Bridge.+", "Solution"]')],
    ];
    for (const [name, t] of lakeCases) { const r = classifyLakefile(t, tsavoDir); results.push({ control: name, wantRefused: true, refused: !r.ok, fails: r.ok ? [] : [r.why] }); }
  }
  const ok = results.every((r) => r.refused === r.wantRefused);
  return { ok, results };
}

module.exports = { checkSources, classifyLakefile, controls, readmeBlock, asBuilt, anthropicClosure, stripComments, CHALLENGE_LIB, STANDARD, TSAVO_SRC, CONFIG };

if (require.main === module) {
  const [mode, a, b] = process.argv.slice(2);
  if (mode === 'sources') {
    const r = checkSources(a ? path.resolve(a) : TSAVO_SRC, b ? path.resolve(b) : null);
    const f = r.facts;
    if (f.tree) console.log('tree: ' + f.tree.files + ' files, ' + f.tree.pinned + ' pinned' + (f.tree.ok ? ', every sha256 equal' : ''));
    if (f.statement) console.log('statement: rebuilt sha256 ' + f.statement.rebuilt + ' (pin ' + f.statement.pinned + '); hk named in the 23 statement lines: ' + (f.statement.hkMentioned ? 'YES (' + f.statement.hkLines.join(', ') + ')' : 'no') + '; tactic block in the statement: ' + (f.statement.tacticBlockInStatement ? 'yes' : 'no'));
    if (f.challenge) console.log('challenge: ' + (f.challenge.ok ? 'exactly' : 'NOT') + ' "' + CHALLENGE_TEXT + '"');
    if (f.config) console.log('config: ' + JSON.stringify(f.config));
    if (f.census) console.log('census: ' + f.census.leanFiles.length + ' .lean files; forbidden outside comments: ' + (f.census.forbidden.length ? JSON.stringify(f.census.forbidden) : 'none') + '; the challenge hole: ' + f.census.challengeHole.length + '; mentions inside comments: ' + JSON.stringify(f.census.mentionsInComments));
    if (f.mainResults) console.log('MainResults.lean sha256 ' + f.mainResults.got + ' (pin ' + f.mainResults.pinned + ')');
    if (f.lakefile) console.log('lakefile.toml sha256 ' + f.lakefile.got + ' (pin ' + f.lakefile.pinned + ')');
    if (f.anthropic) {
      console.log('Anthropic modules imported directly: ' + f.anthropic.directAnthropicImports.join(', '));
      for (const [root, c] of Object.entries(f.anthropic.closure)) console.log(root + ' reaches ' + c.anthropicCount + ' Anthropic modules' + (c.includesSolution ? ' (Solution among them)' : '') + '; external roots: ' + c.externalRoots.join(', '));
    }
    if (process.env.ETH_TSAVO_FACTS) fs.writeFileSync(process.env.ETH_TSAVO_FACTS, JSON.stringify(r, null, 1) + '\n');
    if (!r.ok) { console.error('REFUSED:\n  ' + r.fails.join('\n  ')); process.exit(1); }
    console.log('all statement checks pass');
  } else if (mode === 'lakefile' && a && b) {
    // lakefile <tsavo-dir> <anthropic-eth-dir> [--challenge-lib]
    const tsavoDir = path.resolve(a);
    const p = path.join(path.resolve(b), 'lakefile.toml');
    const text = fs.readFileSync(p, 'utf8');
    const amend = process.argv[5] === '--challenge-lib';
    const block = readmeBlock(fs.readFileSync(path.join(tsavoDir, 'README.md'), 'utf8'));
    if (!amend) {
      if (sha256(Buffer.from(text, 'utf8')) !== pins().claims.anthropic.files[LAKEFILE_FILE]) { console.error('REFUSED: lakefile.toml is not the pinned bytes'); process.exit(1); }
      fs.writeFileSync(p, asBuilt(text, block, false));
      console.log('appended the README block:\n' + block);
    } else {
      const c = classifyLakefile(text, tsavoDir);
      if (!c.ok || c.layout !== 'readme') { console.error('REFUSED: the declared amendment goes only on the README layout'); process.exit(1); }
      fs.writeFileSync(p, text + '\n' + CHALLENGE_LIB);
      console.log('appended the declared amendment:\n' + CHALLENGE_LIB);
    }
  } else if (mode === 'asbuilt' && a && b) {
    // asbuilt <tsavo-dir> <lakefile.toml>
    const c = classifyLakefile(fs.readFileSync(path.resolve(b), 'utf8'), path.resolve(a));
    console.log(JSON.stringify(c));
    process.exit(c.ok ? 0 : 1);
  } else if (mode === '--check') {
    // the battery: the statement checks on the kept copy, then every red control (with the newest kept run's
    // as-built lakefile, when a run is kept)
    const s = checkSources(TSAVO_SRC);
    const runs = path.join(ETH, 'tsavo', 'runs');
    const kept = fs.existsSync(runs) ? fs.readdirSync(runs).filter((d) => /^\d+$/.test(d)).sort((x, y) => Number(y) - Number(x)) : [];
    const lake = kept.length ? path.join(runs, kept[0], 'lakefile.toml') : null;
    const r = controls(TSAVO_SRC, lake);
    for (const x of r.results) if (x.refused !== x.wantRefused) console.error('control misbehaved: ' + x.control);
    if (!s.ok) console.error('REFUSED:\n  ' + s.fails.join('\n  '));
    console.log('statement checks ' + (s.ok ? 'pass' : 'REFUSE') + '; ' + r.results.length + ' controls, ' + (r.ok ? 'all as wanted' : 'one misbehaved'));
    process.exit(s.ok && r.ok ? 0 : 1);
  } else if (mode === 'controls') {
    const c = process.argv[5];
    const r = controls(a && a !== '-' ? path.resolve(a) : TSAVO_SRC, b && b !== '-' ? path.resolve(b) : null, c ? path.resolve(c) : null);
    for (const x of r.results) console.log((x.refused === x.wantRefused ? 'ok   ' : 'FAIL ') + (x.wantRefused ? 'refused  ' : 'accepted ') + x.control + (x.wantRefused && x.refused ? '  <- ' + x.fails[0] : ''));
    if (!r.ok) { console.error('a red control did not behave'); process.exit(1); }
    console.log('every red control refused; the clean copy passes');
  } else {
    console.error('usage: eth-tsavo-gates.js sources [<tsavo-dir>] [<anthropic-eth-dir>] | lakefile <tsavo-dir> <anthropic-eth-dir> [--challenge-lib] | asbuilt <tsavo-dir> <lakefile> | controls [<tsavo-dir>] [<as-built lakefile>]');
    process.exit(2);
  }
}
