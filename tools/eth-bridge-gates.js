#!/usr/bin/env node
/* eth-bridge-gates.js — the gates of the ETH bridge (corpus/eth-refutation/bridge). ONE module, two
   consumers: the workflow .github/workflows/eth-bridge.yml runs it before and after the build, and
   tools/record-eth-bridge.js runs it again on the downloaded logs before it writes certs/eth-bridge.json.

   sources (before any build; no network):
     · the generic file ETHBridge/Generic.lean is byte-identical in openai/ and anthropic/;
     · anthropic/MainResults.lean, its header comment removed, has the sha256 that
       corpus/eth-refutation/pins.json pins for eth/MainResults.lean (the bytes, unchanged);
     · openai/ETHBridge/OpenAIChallenge.lean, its header comment removed and the ONE declared change undone
       (OPENAI_CHANGE below), has the sha256 pinned for lean/ComparatorChallenges/SubexponentialSAT.lean;
     · no Lean file of either project contains sorry, admit, native_decide, an axiom declaration,
       implemented_by, extern, unsafe or debug.skipKernelTC;
     · each project's Axioms.lean prints the axioms of exactly the theorems its ETHBridge/*.lean declare.
   logs <project> <dir> (after the build, on the files the workflow wrote):
     · build-exit.txt and axioms-exit.txt say 0, and neither log says "declaration uses 'sorry'" or "error:";
     · every theorem of the sources gate has one #print axioms line, and its axioms are among
       propext, Classical.choice, Quot.sound (or none).
   challenge <project> <project-dir> (the kernel job, before Comparator runs; writes files):
     · writes <project-dir>/BridgeChallenge.lean: the project's two bridge files (Generic.lean, then the
       instantiation) as ONE module, every theorem's proof replaced by `sorry` and nothing else changed except
       the imports of the two inlined files; Comparator checks the solution ETHBridge against it;
     · appends to <project-dir>/lakefile.toml the ONE declared block CHALLENGE_LIB ([[lean_lib]] BridgeChallenge);
     · writes the Comparator config (CONFIG_FILE) next to them: every theorem of the sources gate, the three
       standard axioms, nanoda on.
   kernels <project> <dir> (after Comparator, on the files the kernel job wrote):
     · the challenge, the config and the lakefile the run used are exactly what `challenge` builds from the
       checkout, and the run's other sources have the checkout's sha256;
     · Comparator exit 0, "Your solution is okay!", "Lean default kernel accepts the solution" and
       "nanoda kernel accepts the solution", no kernel rejection, no "declaration uses 'sorry'" after
       "Building ETHBridge", and every theorem named in the export of the solution.

   usage: node tools/eth-bridge-gates.js sources
          node tools/eth-bridge-gates.js logs <openai|anthropic> <dir>
          node tools/eth-bridge-gates.js challenge <openai|anthropic> <project-dir>
          node tools/eth-bridge-gates.js kernels <openai|anthropic> <dir>
   exit 0 when every gate passes; 1 with the reasons otherwise. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
// ETH_BRIDGE_DIR: a tampered copy for the red controls (never the real folder)
const BRIDGE = process.env.ETH_BRIDGE_DIR || path.join(ROOT, 'corpus', 'eth-refutation', 'bridge');
const PINS = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'eth-refutation', 'pins.json'), 'utf8'));
const STANDARD = ['propext', 'Classical.choice', 'Quot.sound'];
const PROJECTS = {
  openai: { toolchain: 'leanprover/lean4:v4.34.1', mathlib: PINS.claims.openai.mathlib, bridge: 'ETHBridge/OpenAI.lean' },
  anthropic: { toolchain: 'leanprover/lean4:v4.33.1', mathlib: PINS.claims.anthropic.mathlib, bridge: 'ETHBridge/Anthropic.lean' },
};
/* the kernel replay (Comparator): the challenge module, the solution module, the ONE lakefile block, the config */
const CHALLENGE_MODULE = 'BridgeChallenge';
const CHALLENGE_FILE = CHALLENGE_MODULE + '.lean';
const SOLUTION_MODULE = 'ETHBridge';
const CHALLENGE_LIB = '\n[[lean_lib]]\nname = "' + CHALLENGE_MODULE + '"\n';
const CONFIG_FILE = 'comparator-bridge.json';
const PERMITTED = ['propext', 'Quot.sound', 'Classical.choice'];
/* the #ETH definitions of the generic file, recorded verbatim */
const SHARP_DEFS = ['CountModel', 'numSat', 'CountsKSat', 'CountInTime', 'sharpS', 'SharpETH'];
/* the ONE change to OpenAI's challenge: its last theorem, whose proof the challenge leaves open, is restated as the
   definition of the proposition it states. Undoing it must give the pinned bytes back. */
const OPENAI_CHANGE = {
  theoremLine: 'theorem exact_count_and_sat (k : ℕ) (hk : 2 ≤ k) :',
  defLines: ['def OpenAIClaim : Prop :=', '  ∀ (k : ℕ) (hk : 2 ≤ k),'],
  openProofLine: '  sorry',
  tail: ' := by',
  statementLines: 23,
};
const FORBIDDEN = [
  [/\bsorry\b/, 'sorry'], [/\badmit\b/, 'admit'], [/\bnative_decide\b/, 'native_decide'],
  [/^\s*(?:@\[[^\]]*\]\s*)?(?:(?:private|protected|noncomputable|unsafe)\s+)*axiom\s/m, 'an axiom declaration'],
  [/implemented_by/, 'implemented_by'], [/@\[\s*extern/, 'extern'], [/\bunsafe\b/, 'unsafe'], [/skipKernelTC/, 'debug.skipKernelTC'],
];

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const read = (p) => fs.readFileSync(p, 'utf8');

/* a copy is OUR header comment, then the copied bytes: the header ends at the first line "-/" */
function stripHeader(text, file) {
  if (!text.startsWith('/- cert-machine copy')) throw new Error(file + ': no cert-machine header comment');
  const end = text.indexOf('\n-/\n');
  if (end < 0) throw new Error(file + ': the header comment does not end');
  return text.slice(end + 4);
}

function undoOpenAIChange(body) {
  const L = body.split('\n');
  const at = L.indexOf(OPENAI_CHANGE.defLines[0]);
  if (at < 0 || L[at + 1] !== OPENAI_CHANGE.defLines[1]) throw new Error('OpenAIChallenge.lean: the declared definition lines are not there');
  if (L.indexOf(OPENAI_CHANGE.defLines[0], at + 1) >= 0) throw new Error('OpenAIChallenge.lean: the definition line occurs twice');
  const stmt = L.slice(at + 2, at + 2 + OPENAI_CHANGE.statementLines);
  if (stmt.length !== OPENAI_CHANGE.statementLines) throw new Error('OpenAIChallenge.lean: the statement is cut short');
  stmt[stmt.length - 1] += OPENAI_CHANGE.tail;
  return [...L.slice(0, at), OPENAI_CHANGE.theoremLine, ...stmt, OPENAI_CHANGE.openProofLine,
    ...L.slice(at + 2 + OPENAI_CHANGE.statementLines)].join('\n');
}

/* every .lean file of a project, .lake excluded, relative paths sorted */
function leanFiles(project) {
  const base = path.join(BRIDGE, project);
  const out = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === '.lake') continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.lean')) out.push(path.relative(base, p));
    }
  })(base);
  return out.sort();
}

/* the theorems a file declares, with their full names (namespace blocks followed line by line), their docstrings
   and their statements verbatim (from "theorem" to the ":=" or the first "|" that begins the proof) */
function theorems(file) {
  const text = read(file);
  const lines = text.split('\n');
  const ns = [];
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    let m;
    if ((m = /^namespace\s+(\S+)/.exec(l))) ns.push(m[1]);
    else if ((m = /^end\s+(\S+)/.exec(l)) && ns.length && ns[ns.length - 1] === m[1]) ns.pop();
    else if ((m = /^theorem\s+(\S+)/.exec(l))) {
      let stmt = lines.slice(i).join('\n');
      stmt = stmt.slice(0, statementEnd(stmt)).replace(/\s+$/, '');
      let doc = null;
      if (i > 0 && /-\/\s*$/.test(lines[i - 1])) {
        let j = i - 1;
        while (j >= 0 && !/^\/--/.test(lines[j])) j--;
        if (j >= 0) doc = lines.slice(j, i).join('\n').replace(/^\/--\s*/, '').replace(/\s*-\/\s*$/, '').replace(/\s+/g, ' ');
      }
      out.push({ name: ns.concat(m[1]).join('.'), statement: stmt, doc, file: path.relative(BRIDGE, file), line: i + 1 });
    }
  }
  return out;
}

/* where a theorem's statement ends (from "theorem" to the ":=" or the first "|" that begins the proof), as an
   offset into `rest`, the text from the theorem line on; the ONE rule theorems() and the challenge share */
function statementEnd(rest) {
  return Math.min(...[rest.indexOf(' :=\n'), rest.indexOf(' := '), rest.indexOf(' :=  '), rest.search(/\n\s*\| /)].filter((x) => x >= 0));
}

/* the definitions (def, noncomputable def, structure) a file declares under the given short names, verbatim from
   the keyword to the first blank line, with their docstrings */
function definitions(file, names) {
  const lines = read(file).split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const m = /^(?:noncomputable\s+)?(?:def|structure)\s+(\S+)/.exec(lines[i]);
    if (!m || !names.includes(m[1])) continue;
    let j = i;
    while (j < lines.length && lines[j].trim() !== '') j++;
    let doc = null;
    if (i > 0 && /-\/\s*$/.test(lines[i - 1])) {
      let d = i - 1;
      while (d >= 0 && !/^\/--/.test(lines[d])) d--;
      if (d >= 0) doc = lines.slice(d, i).join('\n').replace(/^\/--\s*/, '').replace(/\s*-\/\s*$/, '').replace(/\s+/g, ' ');
    }
    out.push({ name: m[1], doc, text: lines.slice(i, j).join('\n'), file: path.relative(BRIDGE, file), line: i + 1 });
  }
  return out;
}

/* a bridge file with every theorem's proof replaced by `sorry`: the statement is kept byte for byte, the proof
   (everything after it up to the next line that starts at column 0) becomes " := sorry", and one blank line
   follows. Nothing else changes. */
function sorryProofs(text) {
  const lines = text.split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    if (!/^theorem\s/.test(lines[i])) { out.push(lines[i]); i++; continue; }
    const rest = lines.slice(i).join('\n');
    const stmt = rest.slice(0, statementEnd(rest)).replace(/\s+$/, '');
    const stmtLines = stmt.split('\n').length;
    let j = i + stmtLines;
    while (j < lines.length && (lines[j] === '' || /^\s/.test(lines[j]))) j++;
    out.push(...(stmt + ' := sorry').split('\n'), '');
    i = j;
  }
  return out.join('\n');
}

/* the challenge Comparator checks a project's solution module against: Generic.lean, then the instantiation, as one
   module, their proofs replaced by `sorry`; the imports of both files minus the two inlined modules, deduplicated */
function challengeText(project) {
  const base = path.join(BRIDGE, project);
  const files = ['ETHBridge/Generic.lean', PROJECTS[project].bridge];
  const inlined = files.map((f) => f.replace(/\.lean$/, '').replace(/\//g, '.'));
  const imports = [];
  const bodies = [];
  for (const f of files) {
    const L = read(path.join(base, f)).split('\n');
    let k = 0;
    while (k < L.length && /^import\s/.test(L[k])) {
      const mod = L[k].replace(/^import\s+/, '').trim();
      if (!inlined.includes(mod) && !imports.includes(mod)) imports.push(mod);
      k++;
    }
    bodies.push('-- ' + '='.repeat(20) + ' ' + project + '/' + f + ', every proof replaced by sorry\n' + sorryProofs(L.slice(k).join('\n')));
  }
  return '/- cert-machine, the ETH bridge kernel replay. GENERATED by tools/eth-bridge-gates.js (challenge) from\n' +
    files.map((f) => project + '/' + f).join(' and ') + ': every theorem\'s proof replaced by `sorry`, nothing else\n' +
    'changed but the imports of the two inlined files. Comparator checks the solution module ' + SOLUTION_MODULE + ' against it.\n-/\n' +
    imports.map((m) => 'import ' + m).join('\n') + '\n' + bodies.join('\n');
}

function comparatorConfig(theoremNames) {
  return { challenge_module: CHALLENGE_MODULE, solution_module: SOLUTION_MODULE, theorem_names: theoremNames, definition_names: [], permitted_axioms: PERMITTED, enable_nanoda: true };
}

/* writes the challenge, the lakefile block and the config into a project directory (the kernel job's checkout) */
function writeChallenge(project, dir) {
  const s = checkSources();
  if (!s.ok) return { ok: false, fails: s.fails };
  const names = s.facts.theorems[project].map((t) => t.name);
  const text = challengeText(project);
  const holes = (text.match(/ := sorry$/gm) || []).length;
  const fails = [];
  if (holes !== names.length) fails.push('the challenge holds ' + holes + ' proofs replaced by sorry, not one per theorem (' + names.length + ')');
  const lake = path.join(dir, 'lakefile.toml');
  const lakeText = read(lake);
  if (lakeText.includes('name = "' + CHALLENGE_MODULE + '"')) fails.push('lakefile.toml already names ' + CHALLENGE_MODULE);
  if (fails.length) return { ok: false, fails };
  fs.writeFileSync(path.join(dir, CHALLENGE_FILE), text);
  fs.writeFileSync(lake, lakeText + CHALLENGE_LIB);
  fs.writeFileSync(path.join(dir, CONFIG_FILE), JSON.stringify(comparatorConfig(names), null, 1) + '\n');
  return { ok: true, fails: [], names, challengeSha256: sha256(Buffer.from(text, 'utf8')) };
}

/* the facts of one project's kernel job: the files it ran with, and Comparator's verdict lines */
function checkKernels(project, dir, theoremNames) {
  const fails = [];
  const f = (n) => path.join(dir, n);
  const has = (n) => fs.existsSync(f(n));
  const base = path.join(BRIDGE, project);
  const facts = {};
  // the challenge, the config and the lakefile the run used, against what `challenge` builds from this checkout
  const want = { [CHALLENGE_FILE]: challengeText(project), [CONFIG_FILE]: JSON.stringify(comparatorConfig(theoremNames), null, 1) + '\n', 'lakefile.toml': read(path.join(base, 'lakefile.toml')) + CHALLENGE_LIB };
  for (const [n, text] of Object.entries(want)) {
    if (!has(n)) { fails.push(project + ': the kernel job kept no ' + n); continue; }
    const got = read(f(n));
    facts[n] = sha256(Buffer.from(got, 'utf8'));
    if (got !== text) fails.push(project + ': the run\'s ' + n + ' is not what the checkout builds');
  }
  // the run's other sources: the checkout's bytes
  if (has('sources.sha256')) {
    const ran = {};
    for (const l of read(f('sources.sha256')).split('\n').filter(Boolean)) {
      const m = /^([0-9a-f]{64})\s+\.\/(.+)$/.exec(l);
      if (m) ran[m[2]] = m[1];
    }
    for (const lf of leanFiles(project).concat(['lean-toolchain'])) {
      if (ran[lf] !== sha256(fs.readFileSync(path.join(base, lf)))) fails.push(project + ': the kernel job ran ' + lf + ' with other bytes than the checkout');
    }
    const extra = Object.keys(ran).filter((x) => !leanFiles(project).includes(x) && !['lean-toolchain', 'lakefile.toml', CHALLENGE_FILE].includes(x));
    if (extra.length) fails.push(project + ': the kernel job held sources the checkout does not: ' + extra.join(', '));
    if (ran['lakefile.toml'] !== facts['lakefile.toml'] || ran[CHALLENGE_FILE] !== facts[CHALLENGE_FILE]) fails.push(project + ': the hashed lakefile or challenge differs from the kept copy');
  } else fails.push(project + ': the kernel job kept no sources.sha256');
  // Comparator
  const exit = has('comparator.exit') ? read(f('comparator.exit')).trim() : 'missing';
  const text = (has('comparator.log') ? read(f('comparator.log')) : '') + '\n' + (has('comparator.err') ? read(f('comparator.err')) : '');
  const lines = [...new Set(text.split('\n').filter((l) => /kernel (accepts|rejects|rejected)|Quotient post-check|Error while interacting|Your solution is okay!/.test(l)).map((l) => l.trim()))];
  facts.exit = exit;
  facts.lines = lines;
  if (exit !== '0') fails.push(project + ': Comparator exit ' + exit);
  if (!/^Your solution is okay!$/m.test(text)) fails.push(project + ': Comparator did not print "Your solution is okay!"');
  for (const k of ['Lean default kernel accepts the solution', 'nanoda kernel accepts the solution']) if (!lines.includes(k)) fails.push(project + ': Comparator did not print "' + k + '"');
  const bad = lines.filter((l) => /rejects|rejected|Error while interacting/.test(l));
  if (bad.length) fails.push(project + ': ' + bad.join('; '));
  const sol = text.indexOf('Building ' + SOLUTION_MODULE + '\n');
  if (sol < 0) fails.push(project + ': Comparator never built ' + SOLUTION_MODULE);
  else if (/declaration uses 'sorry'/.test(text.slice(sol))) fails.push(project + ': the solution build reports a declaration that uses sorry');
  const exp = (new RegExp('^Exporting #\\[(.*)\\] from ' + SOLUTION_MODULE + '$', 'm').exec(text) || [])[1];
  const exported = exp ? exp.split(',').map((s) => s.trim()) : [];
  const missing = theoremNames.filter((n) => !exported.includes(n));
  if (!exp) fails.push(project + ': no "Exporting … from ' + SOLUTION_MODULE + '" line');
  else if (missing.length) fails.push(project + ': not in the solution export: ' + missing.join(', '));
  facts.exported = theoremNames.filter((n) => exported.includes(n)).length;
  return { ok: fails.length === 0, fails, facts };
}

function checkSources() {
  const fails = [];
  const facts = { files: {}, theorems: {} };
  const g = ['openai', 'anthropic'].map((p) => fs.readFileSync(path.join(BRIDGE, p, 'ETHBridge', 'Generic.lean')));
  if (!g[0].equals(g[1])) fails.push('ETHBridge/Generic.lean differs between openai/ and anthropic/');
  facts.genericSha256 = sha256(g[0]);
  try {
    const want = PINS.claims.anthropic.files['eth/MainResults.lean'];
    const got = sha256(Buffer.from(stripHeader(read(path.join(BRIDGE, 'anthropic', 'MainResults.lean')), 'MainResults.lean'), 'utf8'));
    facts.mainResults = { pinned: want, rebuilt: got };
    if (got !== want) fails.push('anthropic/MainResults.lean without its header has sha256 ' + got + ', the pin is ' + want);
  } catch (e) { fails.push(e.message); }
  try {
    const want = PINS.claims.openai.files['lean/ComparatorChallenges/SubexponentialSAT.lean'];
    const body = stripHeader(read(path.join(BRIDGE, 'openai', 'ETHBridge', 'OpenAIChallenge.lean')), 'OpenAIChallenge.lean');
    const got = sha256(Buffer.from(undoOpenAIChange(body), 'utf8'));
    facts.openaiChallenge = { pinned: want, rebuilt: got };
    if (got !== want) fails.push('openai/ETHBridge/OpenAIChallenge.lean with the declared change undone has sha256 ' + got + ', the pin is ' + want);
  } catch (e) { fails.push(e.message); }
  for (const p of Object.keys(PROJECTS)) {
    const base = path.join(BRIDGE, p);
    const tc = read(path.join(base, 'lean-toolchain')).trim();
    if (tc !== PROJECTS[p].toolchain) fails.push(p + '/lean-toolchain is ' + tc + ', not ' + PROJECTS[p].toolchain);
    const lake = read(path.join(base, 'lakefile.toml'));
    if (!lake.includes('rev = "' + PROJECTS[p].mathlib + '"')) fails.push(p + '/lakefile.toml does not pin mathlib ' + PROJECTS[p].mathlib);
    facts.files[p] = {};
    for (const f of leanFiles(p).concat(['lakefile.toml', 'lean-toolchain'])) facts.files[p][f] = sha256(fs.readFileSync(path.join(base, f)));
    for (const f of leanFiles(p)) {
      const t = read(path.join(base, f));
      for (const [re, what] of FORBIDDEN) if (re.test(t)) fails.push(p + '/' + f + ' contains ' + what);
    }
    const thms = ['ETHBridge/Generic.lean', PROJECTS[p].bridge].flatMap((f) => theorems(path.join(base, f)));
    facts.theorems[p] = thms;
    const printed = [...read(path.join(base, 'Axioms.lean')).matchAll(/^#print axioms (\S+)\s*$/gm)].map((m) => m[1]);
    const names = thms.map((t) => t.name);
    const missing = names.filter((n) => !printed.includes(n));
    const extra = printed.filter((n) => !names.includes(n));
    if (missing.length) fails.push(p + '/Axioms.lean does not print ' + missing.join(', '));
    if (extra.length) fails.push(p + '/Axioms.lean prints names no bridge file declares: ' + extra.join(', '));
    if (new Set(names).size !== names.length) fails.push(p + ': a theorem name is declared twice');
  }
  return { ok: fails.length === 0, fails, facts };
}

/* the facts of one project's logs: exit codes, error lines, and the axioms of each printed theorem */
function checkLogs(project, dir, theoremNames) {
  const fails = [];
  const f = (n) => path.join(dir, n);
  const exit = (n) => (fs.existsSync(f(n)) ? read(f(n)).trim() : 'missing');
  const build = fs.existsSync(f('build.log')) ? read(f('build.log')) : '';
  const ax = fs.existsSync(f('axioms.log')) ? read(f('axioms.log')) : '';
  if (exit('build-exit.txt') !== '0') fails.push(project + ': lake build exit ' + exit('build-exit.txt'));
  if (exit('axioms-exit.txt') !== '0') fails.push(project + ': Axioms.lean exit ' + exit('axioms-exit.txt'));
  for (const [log, name] of [[build, 'build.log'], [ax, 'axioms.log']]) {
    if (/declaration uses 'sorry'/.test(log)) fails.push(project + ': ' + name + ' reports a declaration that uses sorry');
    const errs = log.split('\n').filter((l) => /(^|\s)error:/.test(l));
    if (errs.length) fails.push(project + ': ' + name + ' has ' + errs.length + ' error line(s), first: ' + errs[0].slice(0, 300));
  }
  const axioms = {};
  for (const m of ax.matchAll(/'([^']+)' depends on axioms: \[([^\]]*)\]/g)) axioms[m[1]] = m[2].split(',').map((s) => s.trim()).filter(Boolean);
  for (const m of ax.matchAll(/'([^']+)' does not depend on any axioms/g)) axioms[m[1]] = [];
  for (const n of theoremNames) {
    if (!(n in axioms)) { fails.push(project + ': no #print axioms line for ' + n); continue; }
    const bad = axioms[n].filter((a) => !STANDARD.includes(a));
    if (bad.length) fails.push(project + ': ' + n + ' depends on ' + bad.join(', '));
  }
  return { ok: fails.length === 0, fails, axioms };
}

module.exports = { checkSources, checkLogs, checkKernels, writeChallenge, challengeText, comparatorConfig, definitions, theorems, leanFiles,
  PROJECTS, STANDARD, BRIDGE, OPENAI_CHANGE, CHALLENGE_FILE, CHALLENGE_LIB, CONFIG_FILE, SOLUTION_MODULE, CHALLENGE_MODULE, SHARP_DEFS };

if (require.main === module) {
  const [mode, project, dir] = process.argv.slice(2);
  let r;
  if (mode === 'sources') r = checkSources();
  else if (mode === 'logs' && PROJECTS[project] && dir) {
    const s = checkSources();
    r = checkLogs(project, path.resolve(dir), s.facts.theorems[project].map((t) => t.name));
    if (!s.ok) { r.ok = false; r.fails = s.fails.concat(r.fails); }
  } else if (mode === 'challenge' && PROJECTS[project] && dir) {
    r = writeChallenge(project, path.resolve(dir));
    if (r.ok) console.log(project + ': ' + CHALLENGE_FILE + ' (sha256 ' + r.challengeSha256 + '), ' + r.names.length + ' theorems, ' + CONFIG_FILE + ', and the lakefile block' + CHALLENGE_LIB.replace(/\n/g, ' '));
  } else if (mode === 'kernels' && PROJECTS[project] && dir) {
    const s = checkSources();
    r = checkKernels(project, path.resolve(dir), s.facts.theorems[project].map((t) => t.name));
    if (!s.ok) { r.ok = false; r.fails = s.fails.concat(r.fails); }
    console.log(project + ': Comparator exit ' + r.facts.exit + '; ' + r.facts.lines.join('; ') + '; ' + r.facts.exported + ' theorems in the solution export');
  } else { console.error('usage: eth-bridge-gates.js sources | logs <openai|anthropic> <dir> | challenge <openai|anthropic> <project-dir> | kernels <openai|anthropic> <dir>'); process.exit(2); }
  if (mode === 'sources') {
    for (const p of Object.keys(PROJECTS)) console.log(p + ': ' + r.facts.theorems[p].length + ' theorems, ' + Object.keys(r.facts.files[p]).length + ' files hashed');
    console.log('generic file sha256 ' + r.facts.genericSha256);
    if (r.facts.mainResults) console.log('MainResults.lean rebuilt sha256 ' + r.facts.mainResults.rebuilt);
    if (r.facts.openaiChallenge) console.log('SubexponentialSAT.lean rebuilt sha256 ' + r.facts.openaiChallenge.rebuilt);
  } else if (mode === 'logs') {
    for (const [n, a] of Object.entries(r.axioms)) console.log(n + ': ' + (a.length ? a.join(', ') : 'no axioms'));
  }
  if (!r.ok) { console.error('REFUSED:\n  ' + r.fails.join('\n  ')); process.exit(1); }
  console.log('all gates pass');
}
