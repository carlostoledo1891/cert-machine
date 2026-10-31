#!/usr/bin/env node
/* xx-reduction-gates.js — the gates of the x^x reduction's Lean proof (lean/xx-reduction). ONE module, two consumers:
   the workflow .github/workflows/xx-reduction.yml runs it before and after the build, and tools/record-xx-reduction.js
   runs it again on the downloaded logs before it writes certs/xx-reduction-lean.json. The pattern is the ETH bridge's
   (tools/eth-bridge-gates.js), for one project and one file.

   sources (before any build; no network):
     · lean-toolchain and the lakefile's mathlib rev are the pins below (TOOLCHAIN, MATHLIB);
     · no Lean file contains sorry, admit, native_decide, an axiom declaration, implemented_by, extern, unsafe or
       debug.skipKernelTC;
     · Axioms.lean prints the axioms of exactly the theorems XXReduction.lean declares, and the theorems the ledger
       names (REQUIRED) are among them.
   logs <dir> (after the build, on the files the workflow wrote):
     · build-exit.txt and axioms-exit.txt say 0, and neither log says "declaration uses 'sorry'" or "error:";
     · every theorem has one #print axioms line, and its axioms are among propext, Classical.choice, Quot.sound.
   challenge <project-dir> (the kernel job, before Comparator runs; writes files):
     · <project-dir>/XXChallenge.lean: XXReduction.lean with every theorem's proof replaced by `sorry` and its header
       comment replaced by a generated one; the ONE lakefile block CHALLENGE_LIB appended; the Comparator config.
   kernels <dir> (after Comparator):
     · the challenge, config and lakefile the run used are what `challenge` builds from the checkout, the run's other
       sources have the checkout's sha256; Comparator exit 0, "Your solution is okay!", both kernels accept, no
       rejection, no sorry after "Building XXReduction", every theorem in the solution export.

   usage: node tools/xx-reduction-gates.js sources | logs <dir> | challenge <project-dir> | kernels <dir>      MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
// XX_REDUCTION_DIR: a tampered copy for a red control (never the real folder)
const PROJECT = process.env.XX_REDUCTION_DIR || path.join(ROOT, 'lean', 'xx-reduction');
const TOOLCHAIN = 'leanprover/lean4:v4.34.1';
const MATHLIB = 'd13f23b723b8a846827a245b89c10fc7d3f11612';
const SOURCE = 'XXReduction.lean';
const SOLUTION_MODULE = 'XXReduction';
const CHALLENGE_MODULE = 'XXChallenge';
const CHALLENGE_FILE = CHALLENGE_MODULE + '.lean';
const CHALLENGE_LIB = '\n[[lean_lib]]\nname = "' + CHALLENGE_MODULE + '"\n';
const CONFIG_FILE = 'comparator-xx.json';
const STANDARD = ['propext', 'Classical.choice', 'Quot.sound'];
const PERMITTED = ['propext', 'Quot.sound', 'Classical.choice'];
/* the theorems certs/xx-ledger.json names as the reduction: uniqueness, the four comparisons, the two whole-number bounds */
const REQUIRED = ['XXReduction.existsUnique_root', 'XXReduction.one_lt_of_selfpow_eq', 'XXReduction.lt_root_iff', 'XXReduction.le_root_iff',
  'XXReduction.root_lt_iff', 'XXReduction.root_le_iff', 'XXReduction.natCast_le_root_iff', 'XXReduction.root_le_natCast_iff'];
const FORBIDDEN = [
  [/\bsorry\b/, 'sorry'], [/\badmit\b/, 'admit'], [/\bnative_decide\b/, 'native_decide'],
  [/^\s*(?:@\[[^\]]*\]\s*)?(?:(?:private|protected|noncomputable|unsafe)\s+)*axiom\s/m, 'an axiom declaration'],
  [/implemented_by/, 'implemented_by'], [/@\[\s*extern/, 'extern'], [/\bunsafe\b/, 'unsafe'], [/skipKernelTC/, 'debug.skipKernelTC'],
];
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const read = (p) => fs.readFileSync(p, 'utf8');

function leanFiles() {
  const out = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === '.lake') continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.lean')) out.push(path.relative(PROJECT, p));
    }
  })(PROJECT);
  return out.sort();
}

/* where a theorem's statement ends (from "theorem" to the ":=" that begins the proof), as an offset into `rest` */
function statementEnd(rest) {
  return Math.min(...[rest.indexOf(' :=\n'), rest.indexOf(' := ')].filter((x) => x >= 0));
}

/* the theorems of the file, full names (namespace blocks followed line by line), docstrings, statements verbatim */
function theorems(file) {
  const lines = read(file).split('\n');
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
      out.push({ name: ns.concat(m[1]).join('.'), statement: stmt, doc, file: path.relative(ROOT, file), line: i + 1 });
    }
  }
  return out;
}

/* every theorem's proof replaced by `sorry`: the statement byte for byte, the proof (everything after it up to the next
   line that starts at column 0) becomes " := sorry", one blank line follows; nothing else changes */
function sorryProofs(text) {
  const lines = text.split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    if (!/^theorem\s/.test(lines[i])) { out.push(lines[i]); i++; continue; }
    const rest = lines.slice(i).join('\n');
    const stmt = rest.slice(0, statementEnd(rest)).replace(/\s+$/, '');
    let j = i + stmt.split('\n').length;
    while (j < lines.length && (lines[j] === '' || /^\s/.test(lines[j]))) j++;
    out.push(...(stmt + ' := sorry').split('\n'), '');
    i = j;
  }
  return out.join('\n');
}

/* the challenge Comparator checks the solution against: the file, its header comment replaced, every proof sorry */
function challengeText() {
  const text = read(path.join(PROJECT, SOURCE));
  if (!text.startsWith('/-')) throw new Error(SOURCE + ': no header comment');
  const end = text.indexOf('\n-/\n');
  if (end < 0) throw new Error(SOURCE + ': the header comment does not end');
  return '/- cert-machine, the x^x reduction kernel replay. GENERATED by tools/xx-reduction-gates.js (challenge) from\n' +
    'lean/xx-reduction/' + SOURCE + ': every theorem\'s proof replaced by `sorry`, the header comment replaced by this one,\n' +
    'nothing else changed. Comparator checks the solution module ' + SOLUTION_MODULE + ' against it.\n-/\n' + sorryProofs(text.slice(end + 4));
}

function comparatorConfig(names) {
  return { challenge_module: CHALLENGE_MODULE, solution_module: SOLUTION_MODULE, theorem_names: names, definition_names: [], permitted_axioms: PERMITTED, enable_nanoda: true };
}

function checkSources() {
  const fails = [];
  const facts = { files: {} };
  const tc = read(path.join(PROJECT, 'lean-toolchain')).trim();
  if (tc !== TOOLCHAIN) fails.push('lean-toolchain is ' + tc + ', not ' + TOOLCHAIN);
  const lake = read(path.join(PROJECT, 'lakefile.toml'));
  if (!lake.includes('rev = "' + MATHLIB + '"')) fails.push('lakefile.toml does not pin mathlib ' + MATHLIB);
  if (lake.includes('name = "' + CHALLENGE_MODULE + '"')) fails.push('lakefile.toml already names ' + CHALLENGE_MODULE);
  for (const f of leanFiles().concat(['lakefile.toml', 'lean-toolchain'])) facts.files[f] = sha256(fs.readFileSync(path.join(PROJECT, f)));
  for (const f of leanFiles()) {
    const t = read(path.join(PROJECT, f));
    for (const [re, what] of FORBIDDEN) if (re.test(t)) fails.push(f + ' contains ' + what);
  }
  const extra = leanFiles().filter((f) => f !== SOURCE && f !== 'Axioms.lean');
  if (extra.length) fails.push('Lean files beyond ' + SOURCE + ' and Axioms.lean: ' + extra.join(', '));
  const thms = theorems(path.join(PROJECT, SOURCE));
  facts.theorems = thms;
  const names = thms.map((t) => t.name);
  const printed = [...read(path.join(PROJECT, 'Axioms.lean')).matchAll(/^#print axioms (\S+)\s*$/gm)].map((m) => m[1]);
  const missing = names.filter((n) => !printed.includes(n));
  const unknown = printed.filter((n) => !names.includes(n));
  if (missing.length) fails.push('Axioms.lean does not print ' + missing.join(', '));
  if (unknown.length) fails.push('Axioms.lean prints names ' + SOURCE + ' does not declare: ' + unknown.join(', '));
  if (new Set(names).size !== names.length) fails.push('a theorem name is declared twice');
  const absent = REQUIRED.filter((n) => !names.includes(n));
  if (absent.length) fails.push(SOURCE + ' does not declare ' + absent.join(', '));
  try { facts.challengeSha256 = sha256(Buffer.from(challengeText(), 'utf8')); } catch (e) { fails.push(e.message); }
  return { ok: fails.length === 0, fails, facts };
}

function checkLogs(dir, theoremNames) {
  const fails = [];
  const f = (n) => path.join(dir, n);
  const exit = (n) => (fs.existsSync(f(n)) ? read(f(n)).trim() : 'missing');
  const build = fs.existsSync(f('build.log')) ? read(f('build.log')) : '';
  const ax = fs.existsSync(f('axioms.log')) ? read(f('axioms.log')) : '';
  if (exit('build-exit.txt') !== '0') fails.push('lake build exit ' + exit('build-exit.txt'));
  if (exit('axioms-exit.txt') !== '0') fails.push('Axioms.lean exit ' + exit('axioms-exit.txt'));
  for (const [log, name] of [[build, 'build.log'], [ax, 'axioms.log']]) {
    if (/declaration uses 'sorry'/.test(log)) fails.push(name + ' reports a declaration that uses sorry');
    const errs = log.split('\n').filter((l) => /(^|\s)error:/.test(l));
    if (errs.length) fails.push(name + ' has ' + errs.length + ' error line(s), first: ' + errs[0].slice(0, 300));
  }
  const axioms = {};
  for (const m of ax.matchAll(/'([^']+)' depends on axioms: \[([^\]]*)\]/g)) axioms[m[1]] = m[2].split(',').map((s) => s.trim()).filter(Boolean);
  for (const m of ax.matchAll(/'([^']+)' does not depend on any axioms/g)) axioms[m[1]] = [];
  for (const n of theoremNames) {
    if (!(n in axioms)) { fails.push('no #print axioms line for ' + n); continue; }
    const bad = axioms[n].filter((a) => !STANDARD.includes(a));
    if (bad.length) fails.push(n + ' depends on ' + bad.join(', '));
  }
  return { ok: fails.length === 0, fails, axioms };
}

function writeChallenge(dir) {
  const s = checkSources();
  if (!s.ok) return { ok: false, fails: s.fails };
  const names = s.facts.theorems.map((t) => t.name);
  const text = challengeText();
  const holes = (text.match(/ := sorry$/gm) || []).length;
  if (holes !== names.length) return { ok: false, fails: ['the challenge holds ' + holes + ' proofs replaced by sorry, not one per theorem (' + names.length + ')'] };
  const lake = path.join(dir, 'lakefile.toml');
  fs.writeFileSync(path.join(dir, CHALLENGE_FILE), text);
  fs.writeFileSync(lake, read(lake) + CHALLENGE_LIB);
  fs.writeFileSync(path.join(dir, CONFIG_FILE), JSON.stringify(comparatorConfig(names), null, 1) + '\n');
  return { ok: true, fails: [], names, challengeSha256: sha256(Buffer.from(text, 'utf8')) };
}

function checkKernels(dir, theoremNames) {
  const fails = [];
  const f = (n) => path.join(dir, n);
  const has = (n) => fs.existsSync(f(n));
  const facts = {};
  const want = { [CHALLENGE_FILE]: challengeText(), [CONFIG_FILE]: JSON.stringify(comparatorConfig(theoremNames), null, 1) + '\n', 'lakefile.toml': read(path.join(PROJECT, 'lakefile.toml')) + CHALLENGE_LIB };
  for (const [n, text] of Object.entries(want)) {
    if (!has(n)) { fails.push('the kernel job kept no ' + n); continue; }
    const got = read(f(n));
    facts[n] = sha256(Buffer.from(got, 'utf8'));
    if (got !== text) fails.push('the run\'s ' + n + ' is not what the checkout builds');
  }
  if (has('sources.sha256')) {
    const ran = {};
    for (const l of read(f('sources.sha256')).split('\n').filter(Boolean)) {
      const m = /^([0-9a-f]{64})\s+\.\/(.+)$/.exec(l);
      if (m) ran[m[2]] = m[1];
    }
    for (const lf of leanFiles().concat(['lean-toolchain'])) if (ran[lf] !== sha256(fs.readFileSync(path.join(PROJECT, lf)))) fails.push('the kernel job ran ' + lf + ' with other bytes than the checkout');
    const extra = Object.keys(ran).filter((x) => !leanFiles().includes(x) && !['lean-toolchain', 'lakefile.toml', CHALLENGE_FILE].includes(x));
    if (extra.length) fails.push('the kernel job held sources the checkout does not: ' + extra.join(', '));
    if (ran['lakefile.toml'] !== facts['lakefile.toml'] || ran[CHALLENGE_FILE] !== facts[CHALLENGE_FILE]) fails.push('the hashed lakefile or challenge differs from the kept copy');
  } else fails.push('the kernel job kept no sources.sha256');
  const exit = has('comparator.exit') ? read(f('comparator.exit')).trim() : 'missing';
  const text = (has('comparator.log') ? read(f('comparator.log')) : '') + '\n' + (has('comparator.err') ? read(f('comparator.err')) : '');
  const lines = [...new Set(text.split('\n').filter((l) => /kernel (accepts|rejects|rejected)|Quotient post-check|Error while interacting|Your solution is okay!/.test(l)).map((l) => l.trim()))];
  facts.exit = exit;
  facts.lines = lines;
  if (exit !== '0') fails.push('Comparator exit ' + exit);
  if (!/^Your solution is okay!$/m.test(text)) fails.push('Comparator did not print "Your solution is okay!"');
  for (const k of ['Lean default kernel accepts the solution', 'nanoda kernel accepts the solution']) if (!lines.includes(k)) fails.push('Comparator did not print "' + k + '"');
  const bad = lines.filter((l) => /rejects|rejected|Error while interacting/.test(l));
  if (bad.length) fails.push(bad.join('; '));
  const sol = text.indexOf('Building ' + SOLUTION_MODULE + '\n');
  if (sol < 0) fails.push('Comparator never built ' + SOLUTION_MODULE);
  else if (/declaration uses 'sorry'/.test(text.slice(sol))) fails.push('the solution build reports a declaration that uses sorry');
  const exp = (new RegExp('^Exporting #\\[(.*)\\] from ' + SOLUTION_MODULE + '$', 'm').exec(text) || [])[1];
  const exported = exp ? exp.split(',').map((s) => s.trim()) : [];
  const missing = theoremNames.filter((n) => !exported.includes(n));
  if (!exp) fails.push('no "Exporting … from ' + SOLUTION_MODULE + '" line');
  else if (missing.length) fails.push('not in the solution export: ' + missing.join(', '));
  facts.exported = theoremNames.filter((n) => exported.includes(n)).length;
  return { ok: fails.length === 0, fails, facts };
}

module.exports = { checkSources, checkLogs, checkKernels, writeChallenge, challengeText, comparatorConfig, theorems, leanFiles,
  PROJECT, TOOLCHAIN, MATHLIB, STANDARD, REQUIRED, SOURCE, CHALLENGE_FILE, CHALLENGE_LIB, CONFIG_FILE, SOLUTION_MODULE, CHALLENGE_MODULE };

if (require.main === module) {
  const [mode, dir] = process.argv.slice(2);
  let r;
  const s = checkSources();
  const names = (s.facts.theorems || []).map((t) => t.name);
  if (mode === 'sources') r = s;
  else if (mode === 'logs' && dir) { r = checkLogs(path.resolve(dir), names); if (!s.ok) { r.ok = false; r.fails = s.fails.concat(r.fails); } }
  else if (mode === 'challenge' && dir) {
    r = writeChallenge(path.resolve(dir));
    if (r.ok) console.log(CHALLENGE_FILE + ' (sha256 ' + r.challengeSha256 + '), ' + r.names.length + ' theorems, ' + CONFIG_FILE + ', and the lakefile block' + CHALLENGE_LIB.replace(/\n/g, ' '));
  } else if (mode === 'kernels' && dir) {
    r = checkKernels(path.resolve(dir), names);
    if (!s.ok) { r.ok = false; r.fails = s.fails.concat(r.fails); }
    console.log('Comparator exit ' + r.facts.exit + '; ' + r.facts.lines.join('; ') + '; ' + r.facts.exported + ' theorems in the solution export');
  } else { console.error('usage: xx-reduction-gates.js sources | logs <dir> | challenge <project-dir> | kernels <dir>'); process.exit(2); }
  if (mode === 'sources') {
    console.log(names.length + ' theorems, ' + Object.keys(s.facts.files).length + ' files hashed; challenge sha256 ' + s.facts.challengeSha256);
  } else if (mode === 'logs') {
    for (const [n, a] of Object.entries(r.axioms)) console.log(n + ': ' + (a.length ? a.join(', ') : 'no axioms'));
  }
  if (!r.ok) { console.error('REFUSED:\n  ' + r.fails.join('\n  ')); process.exit(1); }
  console.log('all gates pass');
}
