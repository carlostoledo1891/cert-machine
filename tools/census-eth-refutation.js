#!/usr/bin/env node
/* census-eth-refutation.js — corpus/eth-refutation/census.json: a static scan of the two ETH-refutation proof trees for
   everything that can weaken a Lean proof or widen the trust base. HITS, NEVER VERDICTS: a hit says where a construct
   is written and whether the file can reach a main theorem through imports; whether a theorem DEPENDS on it is decided
   on the pod by the axiom print and by Comparator (sorryAx, Lean.ofReduceBool, Lean.trustCompiler and every declared
   axiom show up there), and recorded in certs/eth-kernel.json.

   The scan reads Lean source with its comments and string literals blanked (nested /- -/, --, "…", r#"…"#, char
   literals), so a "sorry" in a docstring is not a hit. Every file it reads is checked against corpus/eth-refutation/
   pins.json first; the clones are untrusted data and nothing in them is run.

   REACH. The import closure is followed from each claim's roots: the STATEMENT roots (the files Comparator trusts:
   OpenAI's ComparatorChallenges/SubexponentialSAT.lean; Anthropic's MainResults.lean and Challenge.lean) and the
   SOLUTION root (the config's solution_module). A file outside the solution closure cannot reach a main theorem; a
   file inside it can, which is not the same as does.

   usage: node tools/census-eth-refutation.js <oai-clone> <ant-clone> */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { writeStable } = require('./stable-json.js');

const ROOT = path.resolve(__dirname, '..');
const PINS = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'eth-refutation', 'pins.json'), 'utf8'));
const OUT = path.join(ROOT, 'corpus', 'eth-refutation', 'census.json');
const die = (m) => { console.error('ETH CENSUS REFUSED: ' + m); process.exit(1); };
const [oaiClone, antClone] = process.argv.slice(2);
if (!oaiClone || !antClone) die('usage: census-eth-refutation.js <oai-clone> <ant-clone>');

const CLAIMS = {
  openai: {
    clone: oaiClone, project: 'lean', srcDirs: ['.'],
    notes: [
      'lean/lakefile.lean is configuration, not proof: its run_cmd (with unsafe evalConstCheck) runs when Lake elaborates the configuration and applies OpenAI\'s compatibility patches to dependencies before resolution (the post_update hook lane K runs `lake update` for). The patch folder lean/patches at the pin (GitHub tree ffc4b0d5) names 23 dependencies, none of them mathlib; the solution closure imports only Mathlib and Lean, so no patched dependency is in it.',
    ],
    statementRoots: ['ComparatorChallenges.SubexponentialSAT'],
    solutionRoots: ['OAI.Algorithms.SubexponentialSAT.Main'],
    theorems: ['OAI.Algorithms.SubexponentialSAT.SqrtLogSpace.exact_count_and_sat'],
  },
  anthropic: {
    clone: antClone, project: 'eth',
    // eth/lakefile.toml: each lean_lib's srcDir
    srcDirs: ['.', 'proof', 'proof/statements', 'proof/machines', 'proof/networks', 'proof/threesat', 'proof/consequences',
      'proof/sparsification', 'proof/rates', 'proof/variables', 'proof/maintheorem'],
    statementRoots: ['MainResults', 'Challenge'],
    solutionRoots: ['Solution'],
    otherRoots: ['PaperIndex'],
    theorems: ['MainResults.ethIsFalse', 'MainResults.mainTheorem'],
  },
};

/* ── Lean source with comments and strings blanked (newlines kept, so line numbers hold) ─────────────────────── */
const IDCH = /[A-Za-z0-9_'!?.À-ɏͰ-Ͽᴀ-ᶿ₀-ₜ℀-⅏]/;
let unterminated = false;   // set when a comment or string runs to the end of a file: the scan would then be blind
function strip(src) {
  unterminated = false;
  const out = src.split('');
  const blank = (i) => { if (out[i] !== '\n') out[i] = ' '; };
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '-') {                       // block comment, nested
      let depth = 0;
      while (i < n) {
        if (src[i] === '/' && src[i + 1] === '-') { depth++; blank(i); blank(i + 1); i += 2; continue; }
        if (src[i] === '-' && src[i + 1] === '/') { depth--; blank(i); blank(i + 1); i += 2; if (depth === 0) break; continue; }
        blank(i); i++;
      }
      if (depth !== 0) unterminated = true;
      continue;
    }
    if (c === '-' && d === '-') { while (i < n && src[i] !== '\n') { blank(i); i++; } continue; }
    if (c === '«') { const j = src.indexOf('»', i); i = j < 0 ? n : j + 1; continue; }   // a quoted name: kept, never parsed
    if (c === 'r' && (d === '"' || d === '#') && !(i > 0 && IDCH.test(src[i - 1]))) {   // raw string r"…" / r#"…"#
      let j = i + 1, h = 0;
      while (src[j] === '#') { h++; j++; }
      if (src[j] === '"') {
        const close = '"' + '#'.repeat(h);
        const k = src.indexOf(close, j + 1);
        const end = k < 0 ? n : k + close.length;
        for (let q = i; q < end; q++) blank(q);
        i = end; continue;
      }
    }
    if (c === '"') {
      blank(i); i++;
      while (i < n && src[i] !== '"') { if (src[i] === '\\') { blank(i); i++; } blank(i); i++; }
      if (i >= n) unterminated = true;
      blank(i); i++; continue;
    }
    if (c === "'" && !(i > 0 && IDCH.test(src[i - 1]))) {       // a char literal 'x' / '\n' / '\x41'
      const m = /^'(?:\\(?:x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|.)|[^\\'\n])'/.exec(src.slice(i, i + 10));
      if (m) { for (let q = i; q < i + m[0].length; q++) blank(q); i += m[0].length; continue; }
    }
    i++;
  }
  return out.join('');
}

/* ── what is looked for. Each entry: a regex over blanked source; `hazard` marks the constructs that can make a
   kernel-checked proof prove less (the rest widen what runs at build time or change what a statement means). ─── */
const MODS = String.raw`(?:@\[[^\]]*\]\s*)*(?:(?:private|protected|noncomputable|unsafe|partial|public|nonrec|local|scoped)\s+)*`;
const PATTERNS = {
  axiom: { re: new RegExp(String.raw`^\s*` + MODS + String.raw`axiom\s+(\S+)`, 'gm'), hazard: true,
    what: 'an axiom declaration: anything it asserts is assumed, not proved' },
  sorry: { re: /\bsorry\b/g, hazard: true, what: 'sorry (sorryAx)' },
  admit: { re: /\badmit\b/g, hazard: true, what: 'admit (sorryAx)' },
  sorryAx: { re: /\bsorryAx\b/g, hazard: true, what: 'sorryAx named directly' },
  decreasingBySorry: { re: /decreasing_by\s+sorry\b/g, hazard: true, what: 'decreasing_by sorry: termination assumed' },
  native_decide: { re: /\bnative_decide\b/g, hazard: true, what: 'native_decide: the compiler is trusted (Lean.ofReduceBool)' },
  decideNative: { re: /\bdecide\s*\+\s*native\b/g, hazard: true, what: 'decide +native: as native_decide' },
  bv_decide: { re: /\bbv_decide\b/g, hazard: true, what: 'bv_decide: its reflection step trusts the compiler (Lean.ofReduceBool)' },
  ofReduceBool: { re: /\b(?:Lean\.)?(?:ofReduceBool|ofReduceNat|reduceBool|reduceNat)\b/g, hazard: true, what: 'Lean.ofReduceBool / reduceBool named directly' },
  trustCompiler: { re: /\b(?:Lean\.)?trustCompiler\b/g, hazard: true, what: 'Lean.trustCompiler' },
  implemented_by: { re: /\bimplemented_by\b/g, hazard: true, what: '@[implemented_by]: the compiled code differs from the kernel\'s definition' },
  extern: { re: /@\[[^\]]*\bextern\b/g, hazard: true, what: '@[extern]: the compiled code is foreign' },
  unsafe: { re: /\bunsafe\b/g, hazard: true, what: 'unsafe: definitions the kernel never checks' },
  opaque: { re: new RegExp(String.raw`^\s*` + MODS + String.raw`opaque\s+(\S+)`, 'gm'), hazard: true,
    what: 'opaque: a constant whose value the kernel cannot unfold (with an implementation, the compiler runs it)' },
  skipKernelTC: { re: /\bdebug\.skipKernelTC\b/g, hazard: true, what: 'set_option debug.skipKernelTC: declarations added without the kernel' },
  partialDef: { re: /\bpartial\s+def\b/g, hazard: true, what: 'partial def: an opaque constant, unfoldable by nothing' },
  csimp: { re: /@\[[^\]]*\bcsimp\b/g, hazard: true, what: '@[csimp]: a compiler substitution (matters only where the compiler is trusted)' },
  envTouch: { re: /\b(?:addDecl|addDeclCore|addDeclWithoutChecking|modifyEnv|setEnv|unsafeCast|unsafeIO|unsafeBaseIO|unsafeEIO|ofKernelEnv|replayConsts)\b/g, hazard: true,
    what: 'a meta-level call that adds to or replaces the environment, or leaves the type system' },
  prelude: { re: /^\s*prelude\b/gm, hazard: true, what: 'prelude: the file does not import Lean\'s own Init' },
  run_cmd: { re: /\b(?:run_cmd|run_elab|run_meta)\b/g, hazard: false, what: 'run_cmd / run_elab / run_meta: code run while the file is elaborated' },
  eval: { re: /#eval\b/g, hazard: false, what: '#eval: code run while the file is elaborated (a CommandElabM can change the environment)' },
  elab: { re: new RegExp(String.raw`^\s*` + MODS + String.raw`(?:elab|elab_rules)\b`, 'gm'), hazard: false, what: 'a custom elaborator' },
  macro: { re: new RegExp(String.raw`^\s*` + MODS + String.raw`(?:macro|macro_rules)\b`, 'gm'), hazard: false, what: 'a macro' },
  syntax: { re: new RegExp(String.raw`^\s*` + MODS + String.raw`(?:syntax|declare_syntax_cat)\b`, 'gm'), hazard: false, what: 'new syntax' },
  notation: { re: new RegExp(String.raw`^\s*` + MODS + String.raw`(?:notation|infix|infixl|infixr|prefix|postfix)\b`, 'gm'), hazard: false, what: 'notation' },
  initialize: { re: /^\s*(?:builtin_)?initialize\b/gm, hazard: false, what: 'initialize: code run when the module is loaded' },
  elabAttribute: { re: /@\[[^\]]*\b(?:command_elab|term_elab|tactic|macro|simproc|dsimproc|builtin_\w+)\b/g, hazard: false, what: 'an elaborator / tactic / simproc attribute' },
  namespaceLean: { re: /^\s*namespace\s+Lean\b/gm, hazard: false, what: 'declarations added under namespace Lean' },
  importLean: { re: /^\s*(?:public\s+|private\s+)?(?:meta\s+)?import\s+(?:all\s+)?Lean\b/gm, hazard: false, what: 'imports Lean\'s meta-level library' },
};

/* ── imports and the closure ──────────────────────────────────────────────────────────────────────────────────── */
function importsOf(stripped) {
  const out = [];
  const re = /^\s*(?:public\s+|private\s+)?(?:meta\s+)?import\s+(?:all\s+)?([A-Za-z0-9_.'«»]+)/gm;
  let m;
  while ((m = re.exec(stripped))) out.push(m[1].replace(/[«»]/g, ''));
  return out;
}
const lineOf = (s, idx) => s.slice(0, idx).split('\n').length;

const record = {
  what: 'A static scan of the two ETH-refutation proof trees (tools/census-eth-refutation.js) for every construct that can weaken a Lean proof or widen the trust base, with comments and strings blanked. HITS, NEVER VERDICTS: "in the solution closure" means the file can reach a main theorem through imports, not that the theorem depends on it; that is decided on the pod by the axiom print and by Comparator, and recorded in certs/eth-kernel.json.',
  scannedAt: new Date().toISOString().slice(0, 10),
  patterns: Object.fromEntries(Object.entries(PATTERNS).map(([k, p]) => [k, { regex: String(p.re), hazard: p.hazard, what: p.what }])),
  claims: {},
};

for (const [name, c] of Object.entries(CLAIMS)) {
  const pin = PINS.claims[name];
  const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
  const leanFiles = Object.keys(pin.files).filter((p) => p.startsWith(c.project + '/') && p.endsWith('.lean'));
  const src = {};
  for (const p of leanFiles) {
    const b = fs.readFileSync(path.join(c.clone, p));
    if (sha(b) !== pin.files[p]) die(name + ': ' + p + ' differs from pins.json');
    src[p] = strip(b.toString('utf8'));
    if (unterminated) die(name + ': ' + p + ' has a comment or string that runs to the end of the file; the scan would be blind past it');
  }
  // module name -> file, by the project's srcDirs
  const fileOf = (mod) => {
    const rel = mod.split('.').join('/') + '.lean';
    const hits = c.srcDirs.map((d) => path.posix.normalize(c.project + '/' + (d === '.' ? '' : d + '/') + rel)).filter((p) => p in src);
    if (hits.length > 1) die(name + ': module ' + mod + ' resolves to ' + hits.join(' and '));
    return hits[0] || null;
  };
  const external = new Map();      // top-level package -> count of import lines, solution closure only
  const unresolved = new Set();
  const closure = (roots) => {
    const seen = new Set();
    const stack = roots.map((r) => { const f = fileOf(r); if (!f) die(name + ': root ' + r + ' has no file'); return f; });
    while (stack.length) {
      const f = stack.pop();
      if (seen.has(f)) continue;
      seen.add(f);
      for (const m of importsOf(src[f])) {
        const g = fileOf(m);
        if (g) stack.push(g);
        else {
          const top = m.split('.')[0];
          if (['Mathlib', 'Lean', 'Init', 'Std', 'Batteries', 'Aesop', 'Qq', 'Plausible', 'ProofWidgets', 'ImportGraph', 'LeanSearchClient', 'Lake'].includes(top)) {
            if (roots === c.solutionRoots) external.set(top, (external.get(top) || 0) + 1);
          } else unresolved.add(m + ' (imported by ' + f + ')');
        }
      }
    }
    return seen;
  };
  const statementClosure = closure(c.statementRoots);
  const solutionClosure = closure(c.solutionRoots);
  const otherClosure = c.otherRoots ? closure(c.otherRoots) : new Set();
  if (unresolved.size) die(name + ': imports that resolve to no pinned file and no known library: ' + [...unresolved].slice(0, 5).join('; '));

  const hits = {};
  for (const [k, p] of Object.entries(PATTERNS)) {
    const byFile = [];
    for (const f of leanFiles) {
      const lines = [];
      let m;
      p.re.lastIndex = 0;
      const values = [];
      while ((m = p.re.exec(src[f]))) {
        const at = m.index + (m[0].length - m[0].trimStart().length);   // `^\s*` may begin on an earlier, blanked line
        lines.push(lineOf(src[f], at));
        // an opaque declaration: does it give its value (`:=`, which the kernel checks) before the next blank line?
        if (k === 'opaque') { const rest = src[f].slice(at); const end = rest.search(/\n\s*\n/); values.push((end < 0 ? rest : rest.slice(0, end)).includes(':=')); }
        if (m[0].length === 0) p.re.lastIndex++;
      }
      if (lines.length) {
        const row = { path: f, n: lines.length, lines: lines.slice(0, 8), statementClosure: statementClosure.has(f), solutionClosure: solutionClosure.has(f) };
        if (k === 'opaque') row.explicitValue = values.slice(0, 8);
        if (f === c.project + '/lakefile.lean') row.buildConfiguration = true;
        byFile.push(row);
      }
    }
    const sum = (arr) => arr.reduce((a, x) => a + x.n, 0);
    const inSol = byFile.filter((x) => x.solutionClosure), inSt = byFile.filter((x) => x.statementClosure);
    hits[k] = {
      files: byFile.length, occurrences: sum(byFile),
      solutionClosure: { files: inSol.length, occurrences: sum(inSol) },
      statementClosure: { files: inSt.length, occurrences: sum(inSt) },
      byFile: p.hazard || byFile.length <= 40 ? byFile : byFile.slice().sort((a, b) => b.n - a.n).slice(0, 40),
      byFileTruncated: !(p.hazard || byFile.length <= 40),
    };
  }
  // set_option names, solution closure: a histogram (debug.* and compiler.* are the ones to read)
  const options = {};
  for (const f of solutionClosure) {
    const re = /\bset_option\s+([A-Za-z0-9_.]+)/g;
    let m;
    while ((m = re.exec(src[f]))) options[m[1]] = (options[m[1]] || 0) + 1;
  }
  // the statement files in full: every declaration keyword, so a reader sees what the trusted files contain
  const statementFiles = [...statementClosure].sort().map((f) => {
    const kinds = {};
    const re = new RegExp(String.raw`^\s*` + MODS + String.raw`(theorem|lemma|def|abbrev|structure|class|inductive|instance|axiom|opaque|notation|macro|syntax|elab|attribute|set_option|open|variable|universe|namespace|section|end|deriving|irreducible_def)\b`, 'gm');
    let m;
    while ((m = re.exec(src[f]))) kinds[m[1]] = (kinds[m[1]] || 0) + 1;
    return { path: f, sha256: pin.files[f], imports: importsOf(src[f]), declarationKeywords: kinds };
  });
  const hazardsReaching = Object.entries(hits).filter(([k, h]) => PATTERNS[k].hazard && h.solutionClosure.occurrences > 0)
    .map(([k, h]) => ({ pattern: k, files: h.solutionClosure.files, occurrences: h.solutionClosure.occurrences }));
  const hazardsInStatements = Object.entries(hits).filter(([k, h]) => PATTERNS[k].hazard && h.statementClosure.occurrences > 0)
    .map(([k, h]) => ({ pattern: k, files: h.statementClosure.files, occurrences: h.statementClosure.occurrences, where: h.byFile.filter((x) => x.statementClosure).map((x) => x.path + ':' + x.lines.join(',')) }));
  record.claims[name] = {
    commit: pin.commit,
    theorems: c.theorems,
    notes: c.notes || [],
    roots: { statement: c.statementRoots, solution: c.solutionRoots, other: c.otherRoots || [] },
    leanFiles: leanFiles.length,
    closure: {
      statement: statementClosure.size, solution: solutionClosure.size,
      otherOnly: [...otherClosure].filter((f) => !solutionClosure.has(f)).length,
      outsideEveryRoot: leanFiles.filter((f) => !statementClosure.has(f) && !solutionClosure.has(f) && !otherClosure.has(f)).length,
      solutionImportsByLibrary: Object.fromEntries([...external].sort()),
    },
    hazardsReachingTheorems: hazardsReaching,
    hazardsInStatementFiles: hazardsInStatements,
    statementFiles,
    setOptionsInSolutionClosure: Object.fromEntries(Object.entries(options).sort((a, b) => b[1] - a[1])),
    hits,
  };
  console.log(name + ': ' + leanFiles.length + ' Lean files; closure statement ' + statementClosure.size + ', solution ' + solutionClosure.size +
    '; hazards in the solution closure: ' + (hazardsReaching.map((h) => h.pattern + ' ' + h.occurrences + '/' + h.files + 'f').join(', ') || 'none') +
    '; in the statement files: ' + (hazardsInStatements.map((h) => h.pattern + ' ' + h.occurrences).join(', ') || 'none'));
}
writeStable(OUT, record, ['scannedAt']);
console.log('wrote ' + path.relative(ROOT, OUT));
