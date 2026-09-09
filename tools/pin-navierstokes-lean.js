#!/usr/bin/env node
/* pin-navierstokes-lean.js — corpus/navier-stokes/lean-repo.json: every count the
   Navier–Stokes report states about github.com/openai/NavierStokesAndEuler, computed
   from a clone at the pinned commit rather than retyped.

   The clone lives outside this repository (LEAN_CLONE, default
   ~/Projects/navier-stokes-lean/NavierStokesAndEuler) because it is 616k lines plus a
   multi-gigabyte Mathlib cache; this record is what the page reads. Refuses if the clone
   is missing or not at the pinned commit.

   usage: node tools/pin-navierstokes-lean.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const os = require('os');
const ROOT = path.resolve(__dirname, '..');
const CLONE = process.env.LEAN_CLONE || path.join(os.homedir(), 'Projects', 'navier-stokes-lean', 'NavierStokesAndEuler');
const PIN = '8937a8f4cbc7abaab5e9e97d1cc7f5d2319d9538';
const die = (m) => { console.error('LEAN PIN REFUSED: ' + m); process.exit(1); };
if (!fs.existsSync(CLONE)) die('no clone at ' + CLONE);
const sh = (c, cwd = CLONE) => cp.execSync(c, { cwd, encoding: 'utf8', maxBuffer: 1 << 28 });
const head = sh('git rev-parse HEAD').trim();
if (head !== PIN) die('clone is at ' + head + ', not the pinned ' + PIN);
if (sh('git status --porcelain').trim()) die('the clone has local modifications');

const walk = (d) => { const out = []; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.name === '.lake' || e.name === '.git') continue; if (e.isDirectory()) out.push(...walk(p)); else if (e.name.endsWith('.lean')) out.push(p); } return out; };
const files = walk(CLONE);
const lib = (p) => path.relative(CLONE, p).split(path.sep)[0].replace(/\.lean$/, '');
const counts = {};
for (const f of files) { const k = lib(f); const n = fs.readFileSync(f, 'utf8').split('\n').length; counts[k] = counts[k] || { files: 0, lines: 0 }; counts[k].files++; counts[k].lines += n; }
const total = { files: files.length, lines: Object.values(counts).reduce((a, c) => a + c.lines, 0) };

/* greps over the proof libraries (the challenge files carry their intentional sorry placeholders and are counted separately) */
const stripComments = (s) => s.replace(/\/-[\s\S]*?-\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/--.*$/gm, '');
const grepCount = (re, dirs, raw = false) => { let n = 0; const hits = []; for (const f of files) { const k = lib(f); if (!dirs.includes(k)) continue; const s = raw ? fs.readFileSync(f, 'utf8') : stripComments(fs.readFileSync(f, 'utf8')); const lines = s.split('\n'); lines.forEach((l, i) => { if (re.test(l)) { n++; if (hits.length < 8) hits.push(path.relative(CLONE, f) + ':' + (i + 1) + ': ' + l.trim().slice(0, 100)); } }); } return { n, hits }; };
const PROOF = ['NavierStokes', 'Euler', 'NavierStokes.lean', 'Euler.lean'];
const CHAL = ['ComparatorChallenges'];
const hygiene = {
  sorry: grepCount(/\bsorry\b/, PROOF), sorry_in_challenges: grepCount(/\bsorry\b/, CHAL),
  axiom: grepCount(/^\s*axiom\b/, PROOF), native_decide: grepCount(/native_decide/, PROOF),
  unsafe: grepCount(/\bunsafe\b/, PROOF), opaque: grepCount(/^\s*opaque\b/, PROOF),
  partial_def: grepCount(/\bpartial def\b/, PROOF), implemented_by: grepCount(/implemented_by|@\[extern/, PROOF),
  macro_elab_syntax: grepCount(/^\s*(macro|elab|syntax|macro_rules)\b/, PROOF),
  maxHeartbeats: grepCount(/set_option maxHeartbeats/, PROOF), maxRecDepth: grepCount(/set_option maxRecDepth/, PROOF),
  print_axioms: grepCount(/#print axioms/, PROOF),
  maxHeartbeats_mentions_in_comments: grepCount(/maxHeartbeats/, PROOF, true),
};
const heartbeatValues = []; for (const f of files) { const s = fs.readFileSync(f, 'utf8'); for (const m of s.matchAll(/set_option maxHeartbeats (\d+)/g)) heartbeatValues.push(Number(m[1])); }

/* challenge vs solution definitions: strip comments/docstrings/blank lines and the two theorem blocks, compare */
const strip = (s) => s.replace(/\/-[\s\S]*?-\//g, '').replace(/--.*$/gm, '').split('\n').map((l) => l.trimEnd()).filter((l) => l.trim());
const chal = fs.readFileSync(path.join(CLONE, 'ComparatorChallenges', 'NavierStokes.lean'), 'utf8');
const defs = fs.readFileSync(path.join(CLONE, 'NavierStokes', 'ComparatorDefinitions.lean'), 'utf8');
const chalBody = strip(chal.replace(/theorem navier_stokes_breakdown_(R3|periodic)[\s\S]*?sorry\n/g, ''));
const defsBody = strip(defs);
const definitionsIdentical = chalBody.join('\n') === defsBody.join('\n');
let firstDiff = null; if (!definitionsIdentical) { for (let i = 0; i < Math.max(chalBody.length, defsBody.length); i++) if (chalBody[i] !== defsBody[i]) { firstDiff = { i, challenge: chalBody[i], solution: defsBody[i] }; break; } }

/* the challenge vs the upstream Formal Conjectures file at the pinned revision (held in corpus) */
const up = fs.readFileSync(path.join(ROOT, 'corpus', 'navier-stokes', 'lean', 'formal-conjectures-NavierStokes-8bf45ed.lean'), 'utf8');
const upBody = strip(up.replace(/theorem navier_stokes_existence_and_smoothness_(R3|periodic)[\s\S]*?sorry\n/g, ''));
const norm = (ls) => ls.map((l) => l.replace(/@\[simp, category API, AMS 35\]/, '@[simp]').replace(/^@\[category .*\]$/, '').replace(/^@\[category research open, AMS 35\]$/, '')).filter((l) => l.trim())
  .map((l) => l.replace(/^namespace NavierStokes(\.Comparator)?$/, 'namespace NS').replace(/^end NavierStokes(\.Comparator)?$/, 'end NS').replace(/^local notation/, 'notation').replace(/^import .*/, 'import'));
const chalN = norm(strip(chal)), upN = norm(upBody);
const onlyInChallenge = chalN.filter((l) => !upN.includes(l)), onlyInUpstream = upN.filter((l) => !chalN.includes(l));

const toolchain = fs.readFileSync(path.join(CLONE, 'lean-toolchain'), 'utf8').trim();
const manifest = JSON.parse(fs.readFileSync(path.join(CLONE, 'lake-manifest.json'), 'utf8'));
const rev = (n) => (manifest.packages.find((p) => p.name === n) || {}).rev;
const log = sh("git log --format='%H|%aI|%an|%s'").trim().split('\n').map((l) => { const [sha, date, author, msg] = l.split('|'); return { sha, date, author, msg }; });
const yaml = fs.readFileSync(path.join(CLONE, 'formalization.yaml'), 'utf8');
const mainResults = [...yaml.matchAll(/declaration: "([^"]+)"/g)].map((m) => m[1]);
const lakefile = fs.readFileSync(path.join(CLONE, 'lakefile.toml'), 'utf8');

const rec = {
  what: 'Counts and facts about github.com/openai/NavierStokesAndEuler computed from a clone at the pinned commit by tools/pin-navierstokes-lean.js; the Navier–Stokes report reads this record and retypes nothing.',
  commit: head, commits: log, toolchain, mathlib: rev('mathlib'), comparator: rev('Comparator'), lean4export: rev('lean4export'),
  files: total.files, lines: total.lines, byLibrary: counts, heartbeatMax: heartbeatValues.length ? Math.max(...heartbeatValues) : null,
  hygiene: Object.fromEntries(Object.entries(hygiene).map(([k, v]) => [k, v.n])), hygieneMethod: 'code lines only — block comments, docstrings and line comments blanked before matching, except the *_mentions_in_comments rows', hygieneHits: Object.fromEntries(Object.entries(hygiene).filter(([, v]) => v.n).map(([k, v]) => [k, v.hits])),
  lakefile: { navierStokesOptions: /name = "NavierStokes"\n([^\n]*leanOptions[^\n]*)?/.exec(lakefile)?.[1] || null, eulerOptions: /name = "Euler"\n([^\n]*leanOptions[^\n]*)?/.exec(lakefile)?.[1] || null },
  formalizationYaml: { mainResults, review: /review:\n\s+status: "([^"]+)"/.exec(yaml)?.[1], automation: /models:\n\s+- "([^"]+)"/.exec(yaml)?.[1], sorryCount: Number(/sorry_count: (\d+)/.exec(yaml)?.[1]) },
  challengeVsSolutionDefinitions: { identical: definitionsIdentical, firstDifference: firstDiff, method: 'comments, docstrings and blank lines stripped; the two theorem blocks removed from the challenge; remaining lines compared verbatim' },
  challengeVsUpstream: { upstreamRev: '8bf45ed70d48b2b2a501de9c00b26bfa38c573ee', onlyInChallenge, onlyInUpstream, method: 'comments stripped; attributes, namespace, local-notation and import lines normalised; (A),(B) removed from upstream; remaining lines compared as sets' },
  pinnedAt: new Date().toISOString(),
};
const out = path.join(ROOT, 'corpus', 'navier-stokes', 'lean-repo.json');
fs.writeFileSync(out, JSON.stringify(rec, null, 2) + '\n');
console.log('corpus/navier-stokes/lean-repo.json: ' + total.files + ' files, ' + total.lines + ' lines; sorry in proofs ' + hygiene.sorry.n + ', in challenges ' + hygiene.sorry_in_challenges.n + '; definitions identical: ' + definitionsIdentical + '; upstream diff lines: ' + onlyInChallenge.length + '/' + onlyInUpstream.length);
