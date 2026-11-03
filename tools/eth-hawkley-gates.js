#!/usr/bin/env node
/* eth-hawkley-gates.js — the statement checks of the Hawkley bridge replay (github.com/thinkthoughts/math @ d6b79b7d1, a
   fork of openai/math; the theorem OAI.Bridges.AnthropicETH.not_positiveRateETH_implies_ethIsFalse :
   ¬ OAI.ParityWL.Complexity.PositiveRateETH → MainResults.ETHIsFalse, built inside OpenAI's lean/ project). ONE module,
   three consumers: .github/workflows/eth-hawkley.yml runs it on the fresh clone before anything is built,
   tools/record-eth-hawkley.js runs it again on the desk before it writes certs/eth-hawkley-bridge.json, and the battery
   runs its red controls. The verdict is not here: the rule lives in tools/record-eth-hawkley.js. Nothing of the
   claimant's is run: his scripts/check_rpi378_challenge.py is bytes under the census, and the slice check below is
   written from OpenAI's pinned files, not from his script.

   sources [<dir>] [--clone] [--base <base-dir>]   (no network; dir defaults to corpus/eth-refutation/hawkley/src, the
                                                     verified copy of the delta; base-dir to corpus/eth-refutation/hawkley/base)
     tree         every file of the delta has the sha256 corpus/eth-refutation/hawkley/pins.json pins; none missing; none
                  extra on the desk copy (with --clone the other files are OpenAI's base, which the workflow checks by git:
                  HEAD at the pin, a clean tree, the diff against the base commit naming exactly the delta)
     cloneBase    (--clone only) the clone's three ParityLifts sources and LICENSE carry the base's pinned sha256
     mainResults  both copies of Anthropic's eth/MainResults.lean (lean/Vendor/Anthropic/, the challenge's) have the sha256
                  corpus/eth-refutation/pins.json pins for anthropics/formal-math @ 16a5ce41
     slices       the challenge's ParityLifts.lean is EXACTLY a fixed header, lines 5–69 of OpenAI's Machines.lean, a blank
                  line, lines 5–35 of SAT.lean, a blank line, "namespace ParityWL.Complexity", a blank line, lines 24–35 of
                  SATChoice.lean, "end ParityWL.Complexity", a blank line, "end OAI" — the three sources read from base-dir
                  (openai/math @ 7ef5c0cc, pinned), nothing else between them
     challenge    the challenge .lean, comments removed, is exactly the two imports and the one theorem with sorry
     config       the Comparator config names that challenge, the solution module OAI.Bridges.AnthropicETH.Main, that one
                  theorem, no definition holes, only the three standard axioms, and enable_nanoda FALSE as shipped (a fact:
                  the replay turns it on, its one declared change); no other key
     census       no .lean file of the delta holds, outside comments, sorry (except the challenge's one hole), admit,
                  native_decide, an axiom declaration, implemented_by, extern, unsafe or debug.skipKernelTC; the mentions
                  inside comments are listed as facts
     lakefile     the fork's lean/lakefile.lean is OpenAI's pinned one with exactly the six-line MainResults block inserted
                  after line 111, as pinned, and nothing else
     closure      the import closure of OAI.Bridges.AnthropicETH.Main walked through the delta's files: it reaches no module
                  under OAI.Algorithms, OAI.Bridges.ETH, Solution, Challenge, Sat3, WidthThree, Groundwork, ToTuring or
                  Bridge (the claimant's own independence claim, checked at the import level; constants are Comparator's);
                  the OpenAI modules it reaches are all OAI.Combinatorics.ParityLifts.*; MainResults is the vendored copy
   controls [<dir>]
     the red controls: the clean copy passes, and every tampered copy (one per check) is refused
   --check
     the battery: sources on the desk copy, then every control

   exit 0 when every gate passes; 1 with the reasons otherwise. */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const ETH = path.join(ROOT, 'corpus', 'eth-refutation');
const HAWKLEY = path.join(ETH, 'hawkley');
const SRC = path.join(HAWKLEY, 'src');
const BASE_DIR = path.join(HAWKLEY, 'base');
const STANDARD = ['propext', 'Classical.choice', 'Quot.sound'];
const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');
const readJSON = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const pins = () => readJSON(path.join(ETH, 'pins.json'));
const hPins = () => readJSON(path.join(HAWKLEY, 'pins.json'));

const THEOREM = 'OAI.Bridges.AnthropicETH.not_positiveRateETH_implies_ethIsFalse';
const SOLUTION = 'OAI.Bridges.AnthropicETH.Main';
const CHALLENGE_MODULE = 'ComparatorChallenges.AnthropicETHCrossFormalization';
const CHALLENGE_FILE = 'lean/ComparatorChallenges/AnthropicETHCrossFormalization.lean';
const PARITY_FILE = 'lean/ComparatorChallenges/AnthropicETHCrossFormalization/ParityLifts.lean';
const MR_FILES = ['lean/Vendor/Anthropic/MainResults.lean', 'lean/ComparatorChallenges/AnthropicETHCrossFormalization/MainResults.lean'];
const CONFIG_FILE = 'lean/ComparatorChallenges/AnthropicETHCrossFormalization.json';
const LAKEFILE = 'lean/lakefile.lean';
const LICENSE = 'LICENSE';
const SLICES = [
  ['lean/OAI/Combinatorics/ParityLifts/Machines.lean', 5, 69],
  ['lean/OAI/Combinatorics/ParityLifts/SAT.lean', 5, 35],
  ['lean/OAI/Combinatorics/ParityLifts/SATChoice.lean', 24, 35],
];
const PARITY_HEADER = '/-\nRPI-378.3d trusted definitions: byte-for-byte slices of OpenAI ParityLifts at\nthinkthoughts/math 81ec97cd23d21675cee4ee76768fffba33a61e17 (see the challenge file).\n-/\nimport Mathlib\n\nnamespace OAI\n\n';
const CHALLENGE_TEXT = 'import ' + CHALLENGE_MODULE + '.ParityLifts import ' + CHALLENGE_MODULE + '.MainResults theorem ' + THEOREM +
  ' : ¬ OAI.ParityWL.Complexity.PositiveRateETH → MainResults.ETHIsFalse := by sorry';
const CONFIG = { challenge_module: CHALLENGE_MODULE, solution_module: SOLUTION, theorem_names: [THEOREM], definition_names: [], enable_nanoda: false };
/* the six lines the fork inserts into OpenAI's lakefile, after line 111 */
const LAKE_BLOCK = ['-- RPI-378.3a: Anthropic\'s trusted statement file, copied byte for byte from',
  '-- anthropics/formal-math@16a5ce41304fcdaea4e0be7c132e1c361dc26da5:eth/MainResults.lean',
  '-- (SHA-256 47f78a9550d95b37d8718dd1ee16ae824da893a5e17c319f737e6d0a5ed24944).',
  'lean_lib MainResults where', '  srcDir := "Vendor/Anthropic"', '  roots := #[`MainResults]'];
const LAKE_AFTER = 111;
const FORBIDDEN_MODULES = ['OAI.Algorithms', 'OAI.Bridges.ETH', 'Solution', 'Challenge', 'Sat3', 'WidthThree', 'Groundwork', 'ToTuring', 'Bridge', 'PaddedDescent'];
const FORBIDDEN = [
  [/\bsorry\b/g, 'sorry'], [/\badmit\b/g, 'admit'], [/\bnative_decide\b/g, 'native_decide'],
  [/^\s*(?:@\[[^\]]*\]\s*)?(?:(?:private|protected|noncomputable|unsafe)\s+)*axiom\s/gm, 'an axiom declaration'],
  [/implemented_by/g, 'implemented_by'], [/@\[\s*extern/g, 'extern'], [/\bunsafe\b/g, 'unsafe'], [/skipKernelTC/g, 'debug.skipKernelTC'],
];

/* Lean source with every comment (line, block, doc, nested) and string literal blanked, newlines kept */
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
const importsOf = (text) => [...stripComments(text).matchAll(/^\s*(?:public\s+|meta\s+|private\s+)*import\s+(?:all\s+)?([A-Za-z0-9_.«»']+)/gm)].map((m) => m[1]);

function walk(dir, rel = '', out = []) {
  for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    if (e.name === '.git' || e.name === '.lake') continue;
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) walk(dir, r, out); else if (e.isFile()) out.push(r);
  }
  return out.sort();
}
const rd = (dir, rel) => fs.readFileSync(path.join(dir, rel));
const has = (dir, rel) => fs.existsSync(path.join(dir, rel));
const deltaFiles = () => hPins().hawkley.files;

function checkTree(dir, o, fails, facts) {
  const want = deltaFiles();
  const got = {};
  const missing = [];
  for (const f of Object.keys(want)) { if (has(dir, f)) got[f] = sha256(rd(dir, f)); else missing.push(f); }
  const differ = Object.keys(got).filter((f) => got[f] !== want[f]);
  let extra = [];
  if (!o.clone) extra = walk(dir).filter((f) => !(f in want));
  if (missing.length) fails.push('tree: missing ' + missing.join(', '));
  if (extra.length) fails.push('tree: unpinned ' + extra.join(', '));
  if (differ.length) fails.push('tree: sha256 differs for ' + differ.join(', '));
  facts.tree = { files: Object.keys(got).length, pinned: Object.keys(want).length, clone: Boolean(o.clone), ok: !missing.length && !extra.length && !differ.length };
}
function checkCloneBase(dir, o, fails, facts) {
  if (!o.clone) return;
  const base = hPins().base;
  const out = {};
  for (const [f, b] of Object.entries(base)) {
    if (f === LAKEFILE) continue;   // the fork's lakefile is the modified one: the lakefile check
    const got = has(dir, f) ? sha256(rd(dir, f)) : null;
    out[f] = { pinned: b.sha256, got };
    if (got !== b.sha256) fails.push('cloneBase: ' + f + ' in the clone has sha256 ' + got + ', the base pin is ' + b.sha256);
  }
  facts.cloneBase = out;
}
function checkMainResults(dir, o, fails, facts) {
  const want = pins().claims.anthropic.files['eth/MainResults.lean'];
  facts.mainResults = { pinned: want, copies: {} };
  for (const f of MR_FILES) {
    const got = has(dir, f) ? sha256(rd(dir, f)) : null;
    facts.mainResults.copies[f] = got;
    if (got !== want) fails.push('mainResults: ' + f + ' has sha256 ' + got + ', the pin is ' + want);
  }
}
function expectedParity(baseDir) {
  const slice = (f, a, b) => { const L = fs.readFileSync(path.join(baseDir, f), 'utf8').split('\n'); if (L.length < b) throw new Error(f + ' has fewer than ' + b + ' lines'); return L.slice(a - 1, b).join('\n') + '\n'; };
  const [m, s, c] = SLICES.map(([f, a, b]) => slice(f, a, b));
  return PARITY_HEADER + m + '\n' + s + '\n' + 'namespace ParityWL.Complexity\n\n' + c + 'end ParityWL.Complexity\n\nend OAI\n';
}
function checkSlices(dir, o, fails, facts) {
  try {
    const want = expectedParity(o.baseDir);
    const got = has(dir, PARITY_FILE) ? fs.readFileSync(path.join(dir, PARITY_FILE), 'utf8') : null;
    const baseShas = {};
    for (const [f] of SLICES) baseShas[f] = sha256(fs.readFileSync(path.join(o.baseDir, f)));
    facts.slices = { file: PARITY_FILE, expectedSha256: sha256(Buffer.from(want, 'utf8')), gotSha256: got == null ? null : sha256(Buffer.from(got, 'utf8')), slices: SLICES.map(([f, a, b]) => ({ file: f, lines: a + '-' + b, baseSha256: baseShas[f] })), ok: got === want };
    if (got !== want) fails.push('slices: ' + PARITY_FILE + ' is not exactly the three pinned slices inside the fixed skeleton');
  } catch (e) { fails.push('slices: ' + e.message); }
}
function checkChallenge(dir, o, fails, facts) {
  const raw = has(dir, CHALLENGE_FILE) ? fs.readFileSync(path.join(dir, CHALLENGE_FILE), 'utf8') : '';
  const text = stripComments(raw).replace(/\s+/g, ' ').trim();
  facts.challenge = { file: CHALLENGE_FILE, text, expected: CHALLENGE_TEXT, ok: text === CHALLENGE_TEXT };
  if (text !== CHALLENGE_TEXT) fails.push('challenge: ' + CHALLENGE_FILE + ', comments removed, reads "' + text + '", not "' + CHALLENGE_TEXT + '"');
}
function checkConfig(dir, o, fails, facts) {
  let cfg;
  try { cfg = readJSON(path.join(dir, CONFIG_FILE)); } catch (e) { fails.push('config: ' + e.message); return; }
  facts.config = cfg;
  for (const [k, v] of Object.entries(CONFIG)) if (JSON.stringify(cfg[k]) !== JSON.stringify(v)) fails.push('config: ' + k + ' is ' + JSON.stringify(cfg[k]) + ', not ' + JSON.stringify(v));
  const ax = cfg.permitted_axioms || [];
  if (!ax.length || ax.some((a) => !STANDARD.includes(a))) fails.push('config: permitted_axioms ' + JSON.stringify(ax) + ' is not a subset of the three standard axioms');
  const extraKeys = Object.keys(cfg).filter((k) => !(k in CONFIG) && k !== 'permitted_axioms');
  if (extraKeys.length) fails.push('config: unexpected keys ' + extraKeys.join(', '));
}
function checkCensus(dir, o, fails, facts) {
  // the Lean files of the delta; lean/lakefile.lean is OpenAI's build file (its `unsafe` is OpenAI's), gated by the
  // lakefile check, not by the census
  const files = Object.keys(deltaFiles()).filter((f) => f.endsWith('.lean') && f !== LAKEFILE && has(dir, f)).sort();
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
  const hole = found.filter((x) => x.file === CHALLENGE_FILE && x.what === 'sorry');
  const bad = found.filter((x) => !(x.file === CHALLENGE_FILE && x.what === 'sorry'));
  if (hole.length !== 1) fails.push('census: ' + CHALLENGE_FILE + ' has ' + hole.length + ' sorry, not the one hole');
  for (const b of bad) fails.push('census: ' + b.file + ':' + b.line + ' contains ' + b.what);
  const imports = {};
  for (const f of files) imports[f] = importsOf(fs.readFileSync(path.join(dir, f), 'utf8'));
  facts.census = { leanFiles: files, forbidden: bad, challengeHole: hole, mentionsInComments: inComments, imports };
}
function checkLakefile(dir, o, fails, facts) {
  try {
    const baseText = fs.readFileSync(path.join(o.baseDir, LAKEFILE), 'utf8');
    const basePin = pins().claims.openai.files[LAKEFILE];
    const baseGot = sha256(Buffer.from(baseText, 'utf8'));
    if (baseGot !== basePin) throw new Error('the base lakefile in ' + o.baseDir + ' has sha256 ' + baseGot + ', the OpenAI pin is ' + basePin);
    const L = baseText.split('\n');
    const want = [...L.slice(0, LAKE_AFTER), ...LAKE_BLOCK, ...L.slice(LAKE_AFTER)].join('\n');
    const got = has(dir, LAKEFILE) ? fs.readFileSync(path.join(dir, LAKEFILE), 'utf8') : null;
    const p = hPins().hawkley.lakefile;
    facts.lakefile = { basePinned: basePin, forkSha256: got == null ? null : sha256(Buffer.from(got, 'utf8')), insertedAfterLine: LAKE_AFTER, block: LAKE_BLOCK, pinnedBlockAgrees: p.insertedAfterLine === LAKE_AFTER && JSON.stringify(p.insertedLines) === JSON.stringify(LAKE_BLOCK), ok: got === want };
    if (got !== want) fails.push('lakefile: ' + LAKEFILE + ' is not OpenAI\'s pinned lakefile with the six-line MainResults block inserted after line ' + LAKE_AFTER);
    if (!facts.lakefile.pinnedBlockAgrees) fails.push('lakefile: the block pins.json recorded is not the one this gate states');
  } catch (e) { fails.push('lakefile: ' + e.message); }
}
/* the import closure of the solution module, walked through the delta's files; the vendored MainResults resolves by
   the inserted lean_lib (srcDir Vendor/Anthropic, root MainResults); every other module outside the delta is external */
function closure(dir) {
  const files = new Set(Object.keys(deltaFiles()).filter((f) => f.endsWith('.lean')));
  const locate = (mod) => {
    if (mod === 'MainResults') return 'lean/Vendor/Anthropic/MainResults.lean';
    const rel = 'lean/' + mod.split('.').join('/') + '.lean';
    return files.has(rel) ? rel : null;
  };
  const seen = new Map();
  const todo = [SOLUTION];
  while (todo.length) {
    const m = todo.pop();
    if (seen.has(m)) continue;
    const f = locate(m);
    seen.set(m, f);
    if (f && has(dir, f)) for (const i of importsOf(fs.readFileSync(path.join(dir, f), 'utf8'))) todo.push(i);
  }
  const internal = [...seen].filter(([, f]) => f).map(([m, f]) => ({ module: m, file: f })).sort((a, b) => a.module.localeCompare(b.module));
  const external = [...seen].filter(([, f]) => !f).map(([m]) => m).sort();
  return { internal, external };
}
function checkClosure(dir, o, fails, facts) {
  const c = closure(dir);
  const forbidden = [...c.external, ...c.internal.map((x) => x.module)].filter((m) => FORBIDDEN_MODULES.some((p) => m === p || m.startsWith(p + '.')));
  const openai = c.external.filter((m) => m.startsWith('OAI.'));
  const notParity = openai.filter((m) => !m.startsWith('OAI.Combinatorics.ParityLifts.'));
  const roots = [...new Set(c.external.map((m) => m.split('.')[0]))].sort();
  facts.closure = { solution: SOLUTION, internalModules: c.internal.map((x) => x.module), internalCount: c.internal.length, external: c.external, externalRoots: roots, openaiModules: openai, forbidden, vendoredMainResults: c.internal.some((x) => x.module === 'MainResults') };
  if (forbidden.length) fails.push('closure: the solution reaches ' + forbidden.join(', '));
  if (notParity.length) fails.push('closure: the solution reaches OpenAI modules outside ParityLifts: ' + notParity.join(', '));
  if (!facts.closure.vendoredMainResults) fails.push('closure: the solution does not reach the vendored MainResults');
}

const CHECKS = { tree: checkTree, cloneBase: checkCloneBase, mainResults: checkMainResults, slices: checkSlices, challenge: checkChallenge, config: checkConfig, census: checkCensus, lakefile: checkLakefile, closure: checkClosure };
/* every check, or (for a red control) only the one named, so that a control proves THAT check refuses */
function checkSources(dir = SRC, opts = {}, only = null) {
  const o = Object.assign({ clone: false, baseDir: BASE_DIR }, opts);
  const fails = [];
  const facts = {};
  for (const [name, run] of Object.entries(CHECKS)) if (!only || only === name) { try { run(dir, o, fails, facts); } catch (e) { fails.push(name + ': threw ' + e.message); } }
  return { ok: fails.length === 0, fails, facts };
}

/* the red controls: one tampered copy per check, each must be refused; the clean copy must pass */
function controls(dir = SRC) {
  const results = [];
  const clean = checkSources(dir);
  results.push({ control: 'clean copy', wantRefused: false, refused: !clean.ok, fails: clean.fails });
  const edit = (rel, fn) => (d) => { const p = path.join(d, rel); fs.writeFileSync(p, fn(fs.readFileSync(p, 'utf8'))); };
  const C = CHALLENGE_FILE;
  const MAIN = 'lean/OAI/Bridges/AnthropicETH/Main.lean';
  const RED = 'lean/OAI/Bridges/AnthropicETH/Reduction.lean';
  const cases = [
    ['a file changed by one byte', 'tree', 'sha256 differs', edit('docs/RPI-378.3d_REPORT.md', (t) => t + ' ')],
    ['an unpinned file added', 'tree', 'unpinned', (d) => fs.writeFileSync(path.join(d, 'lean/OAI/Bridges/AnthropicETH/Extra.lean'), 'theorem x : True := trivial\n')],
    ['a pinned file removed', 'tree', 'missing', (d) => fs.rmSync(path.join(d, 'docs/RPI-378.3a_REPORT.md'))],
    ['one byte of the vendored MainResults.lean', 'mainResults', 'the pin is', edit(MR_FILES[0], (t) => t + '\n')],
    ['one byte of the challenge\'s MainResults.lean', 'mainResults', 'the pin is', edit(MR_FILES[1], (t) => t.replace('def ETH : Prop := 0 < s 3', 'def ETH : Prop := 0 ≤ s 3'))],
    ['the slice with 0 < δ changed to 0 ≤ δ', 'slices', 'not exactly', edit(PARITY_FILE, (t) => t.replace('∃ δ : ℝ, 0 < δ ∧', '∃ δ : ℝ, 0 ≤ δ ∧'))],
    ['a definition added between the slices', 'slices', 'not exactly', edit(PARITY_FILE, (t) => t.replace('namespace ParityWL.Complexity\n', 'namespace ParityWL.Complexity\ndef extra : Nat := 0\n'))],
    ['a third import in the challenge', 'challenge', 'reads', edit(C, (t) => t.replace('import ' + CHALLENGE_MODULE + '.MainResults', 'import ' + CHALLENGE_MODULE + '.MainResults\nimport ' + SOLUTION))],
    ['the conclusion weakened to True', 'challenge', 'reads', edit(C, (t) => t.replace('MainResults.ETHIsFalse := by', 'True := by'))],
    ['the hypothesis negated away', 'challenge', 'reads', edit(C, (t) => t.replace('¬ OAI.ParityWL.Complexity.PositiveRateETH →', 'OAI.ParityWL.Complexity.PositiveRateETH →'))],
    ['the hole filled by another proof', 'challenge', 'reads', edit(C, (t) => t.replace('  sorry', '  exact OAI.Bridges.AnthropicETH.cheat'))],
    ['another solution module', 'config', 'solution_module', edit(CONFIG_FILE, (t) => t.replace('"' + SOLUTION + '"', '"OAI.Bridges.AnthropicETH.Audit"'))],
    ['an extra permitted axiom', 'config', 'permitted_axioms', edit(CONFIG_FILE, (t) => t.replace('"Classical.choice"', '"Classical.choice",\n    "sorryAx"'))],
    ['nanoda turned on in the shipped config', 'config', 'enable_nanoda', edit(CONFIG_FILE, (t) => t.replace('"enable_nanoda": false', '"enable_nanoda": true'))],
    ['an external kernel added', 'config', 'unexpected keys', edit(CONFIG_FILE, (t) => t.replace('"enable_nanoda": false', '"enable_nanoda": false, "external_kernels": {"k": ["true"]}'))],
    ['a sorry in Main.lean', 'census', 'contains sorry', edit(MAIN, (t) => t.replace('ethIsFalse_of_not_positiveRateETH simulationHypothesis_proved converterHypothesis_proved', 'by sorry'))],
    ['an axiom declaration', 'census', 'an axiom declaration', edit(RED, (t) => t.replace('namespace OAI.Bridges.AnthropicETH', 'namespace OAI.Bridges.AnthropicETH\naxiom cheat : False'))],
    ['admit', 'census', 'contains admit', edit(RED, (t) => t.replace('namespace OAI.Bridges.AnthropicETH', 'namespace OAI.Bridges.AnthropicETH\ntheorem t0 : False := by admit'))],
    ['native_decide', 'census', 'native_decide', edit(RED, (t) => t.replace('namespace OAI.Bridges.AnthropicETH', 'namespace OAI.Bridges.AnthropicETH\ntheorem two : 1 + 1 = 2 := by native_decide'))],
    ['implemented_by', 'census', 'implemented_by', edit(RED, (t) => t.replace('namespace OAI.Bridges.AnthropicETH', 'namespace OAI.Bridges.AnthropicETH\n@[implemented_by id] def f (n : Nat) : Nat := n'))],
    ['extern', 'census', 'extern', edit(RED, (t) => t.replace('namespace OAI.Bridges.AnthropicETH', 'namespace OAI.Bridges.AnthropicETH\n@[extern "c_f"] def g (n : Nat) : Nat := n'))],
    ['unsafe', 'census', 'unsafe', edit(RED, (t) => t.replace('namespace OAI.Bridges.AnthropicETH', 'namespace OAI.Bridges.AnthropicETH\nunsafe def h0 : Nat := 0'))],
    ['debug.skipKernelTC', 'census', 'skipKernelTC', edit(RED, (t) => t.replace('namespace OAI.Bridges.AnthropicETH', 'set_option debug.skipKernelTC true in\nnamespace OAI.Bridges.AnthropicETH'))],
    ['a second sorry in the challenge', 'census', 'not the one hole', edit(C, (t) => t + '\ntheorem extra : False := by sorry\n')],
    ['one more line after the lakefile block', 'lakefile', 'not OpenAI', edit(LAKEFILE, (t) => t.replace('  roots := #[`MainResults]\n', '  roots := #[`MainResults]\n  globs := #[`MainResults.+]\n'))],
    ['the lakefile block pointing elsewhere', 'lakefile', 'not OpenAI', edit(LAKEFILE, (t) => t.replace('srcDir := "Vendor/Anthropic"', 'srcDir := "Vendor/Other"'))],
    ['a line of OpenAI\'s part of the lakefile changed', 'lakefile', 'not OpenAI', edit(LAKEFILE, (t) => t.replace('leanOptions := #[⟨`autoImplicit, false⟩]', 'leanOptions := #[⟨`autoImplicit, true⟩]'))],
    ['an import of OpenAI\'s SAT theorem in Main.lean', 'closure', 'reaches OAI.Algorithms', edit(MAIN, (t) => 'import OAI.Algorithms.SubexponentialSAT.SqrtLogSpace.Final\n' + t)],
    ['an import of the earlier bridge in Reduction.lean', 'closure', 'OAI.Bridges.ETH.FinalImplication', edit(RED, (t) => 'import OAI.Bridges.ETH.FinalImplication\n' + t)],
  ];
  for (const [name, check, why, mutate] of cases) {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'eth-hawkley-control-'));
    fs.cpSync(dir, tmp, { recursive: true });
    let r;
    try { mutate(tmp); r = checkSources(tmp, {}, check); } catch (e) { r = { ok: false, fails: ['threw: ' + e.message] }; }
    finally { fs.rmSync(tmp, { recursive: true, force: true }); }
    const hit = r.fails.find((f) => f.startsWith(check + ':') && f.includes(why));
    results.push({ control: check + ': ' + name, wantRefused: true, refused: Boolean(hit), fails: hit ? [hit] : r.fails.slice(0, 3) });
  }
  // the base: a tampered base lakefile, or one byte inside a sliced range of a base source, must refuse the lakefile /
  // slices checks (a byte outside the sliced lines is rightly invisible to the slice check)
  for (const [check, file, why, mutate] of [
    ['lakefile', LAKEFILE, 'the OpenAI pin is', (t) => t + '\n'],
    ['slices', SLICES[2][0], 'not exactly', (t) => t.replace('∃ δ : ℝ, 0 < δ ∧', '∃ δ : ℝ, 0 ≤ δ ∧')],
  ]) {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'eth-hawkley-base-'));
    fs.cpSync(BASE_DIR, tmp, { recursive: true });
    fs.writeFileSync(path.join(tmp, file), mutate(fs.readFileSync(path.join(tmp, file), 'utf8')));
    const r = checkSources(dir, { baseDir: tmp }, check);
    fs.rmSync(tmp, { recursive: true, force: true });
    const hit = r.fails.find((f) => f.startsWith(check + ':') && f.includes(why));
    results.push({ control: check + ': one byte appended to the base ' + file, wantRefused: true, refused: Boolean(hit), fails: hit ? [hit] : r.fails.slice(0, 3) });
  }
  const ok = results.every((r) => r.refused === r.wantRefused);
  return { ok, results };
}

module.exports = { checkSources, controls, closure, stripComments, STANDARD, SRC, BASE_DIR, CONFIG, THEOREM, SOLUTION, CHALLENGE_MODULE, CHALLENGE_TEXT, CONFIG_FILE, LAKEFILE, LAKE_BLOCK, MR_FILES, SLICES };

if (require.main === module) {
  const argv = process.argv.slice(2);
  const mode = argv[0];
  const flags = new Set(argv.filter((a) => a.startsWith('--')));
  const baseIdx = argv.indexOf('--base');
  const baseDir = baseIdx >= 0 ? path.resolve(argv[baseIdx + 1]) : BASE_DIR;
  const positional = argv.slice(1).filter((a, i, arr) => !a.startsWith('--') && arr[i - 1] !== '--base');
  if (mode === 'sources') {
    const r = checkSources(positional[0] ? path.resolve(positional[0]) : SRC, { clone: flags.has('--clone'), baseDir });
    const f = r.facts;
    if (f.tree) console.log('tree: ' + f.tree.files + ' of ' + f.tree.pinned + ' pinned files present' + (f.tree.ok ? ', every sha256 equal' : '') + (f.tree.clone ? ' (a clone: the base is git\'s)' : ''));
    if (f.cloneBase) console.log('cloneBase: ' + Object.values(f.cloneBase).filter((x) => x.got === x.pinned).length + ' of ' + Object.keys(f.cloneBase).length + ' base files at their pins');
    if (f.mainResults) console.log('MainResults.lean: ' + Object.values(f.mainResults.copies).filter((s) => s === f.mainResults.pinned).length + ' of 2 copies carry the Anthropic pin ' + f.mainResults.pinned.slice(0, 12));
    if (f.slices) console.log('slices: ' + (f.slices.ok ? 'exactly' : 'NOT') + ' the three pinned slices (expected sha256 ' + f.slices.expectedSha256.slice(0, 12) + ')');
    if (f.challenge) console.log('challenge: ' + (f.challenge.ok ? 'exactly' : 'NOT') + ' "' + CHALLENGE_TEXT + '"');
    if (f.config) console.log('config: ' + JSON.stringify(f.config));
    if (f.census) console.log('census: ' + f.census.leanFiles.length + ' .lean files; forbidden outside comments: ' + (f.census.forbidden.length ? JSON.stringify(f.census.forbidden) : 'none') + '; the challenge hole: ' + f.census.challengeHole.length + '; mentions inside comments: ' + JSON.stringify(f.census.mentionsInComments));
    if (f.lakefile) console.log('lakefile: ' + (f.lakefile.ok ? 'OpenAI\'s pinned lakefile + the six-line block after line ' + f.lakefile.insertedAfterLine : 'NOT as pinned'));
    if (f.closure) console.log('closure: ' + f.closure.internalCount + ' modules of the delta; external: ' + f.closure.external.length + ' (roots ' + f.closure.externalRoots.join(', ') + '); OpenAI modules reached: ' + f.closure.openaiModules.length + '; forbidden: ' + (f.closure.forbidden.length ? f.closure.forbidden.join(', ') : 'none'));
    if (process.env.ETH_HAWKLEY_FACTS) fs.writeFileSync(process.env.ETH_HAWKLEY_FACTS, JSON.stringify(r, null, 1) + '\n');
    if (!r.ok) { console.error('REFUSED:\n  ' + r.fails.join('\n  ')); process.exit(1); }
    console.log('all statement checks pass');
  } else if (mode === 'controls') {
    const r = controls(positional[0] ? path.resolve(positional[0]) : SRC);
    for (const x of r.results) console.log((x.refused === x.wantRefused ? 'ok   ' : 'FAIL ') + (x.wantRefused ? 'refused  ' : 'accepted ') + x.control + (x.wantRefused && x.refused ? '  <- ' + x.fails[0] : (x.fails.length ? '  ' + x.fails.join(' | ') : '')));
    if (!r.ok) { console.error('a red control did not behave'); process.exit(1); }
    console.log('every red control refused; the clean copy passes');
  } else if (mode === '--check') {
    const s = checkSources(SRC);
    const r = controls(SRC);
    for (const x of r.results) if (x.refused !== x.wantRefused) console.error('control misbehaved: ' + x.control);
    if (!s.ok) console.error('REFUSED:\n  ' + s.fails.join('\n  '));
    console.log('statement checks ' + (s.ok ? 'pass' : 'REFUSE') + '; ' + r.results.length + ' controls, ' + (r.ok ? 'all as wanted' : 'one misbehaved'));
    process.exit(s.ok && r.ok ? 0 : 1);
  } else {
    console.error('usage: eth-hawkley-gates.js sources [<dir>] [--clone] [--base <base-dir>] | controls [<dir>] | --check');
    process.exit(2);
  }
}
