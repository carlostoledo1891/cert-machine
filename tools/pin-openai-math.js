#!/usr/bin/env node
/* pin-openai-math.js — corpus/openai-math/release.json: every count the openai/math
   audit states about github.com/openai/math, computed from a clone at the pinned commit
   rather than retyped, and the census every lane of the audit draws from.

   The clone lives outside this repository (MATH_CLONE, default ~/Projects/openai-math)
   because it is 3.1 GB (1.7 GB of it Lean under lean/OAI); this record is what the
   lanes, the ledger and the page read. Refuses if the clone is missing, is not at the
   pinned commit, or has local modifications.

   WHAT IT JOINS. CONTENTS.md (the manuscript map: families, manuscripts, abstracts) ×
   preprints/ (the bytes that carry each claim, sha256-pinned; withdrawal notices) ×
   lean/ComparatorChallenges/ (each challenge's config and statement, sha256-pinned) ×
   lean/docs/NNN.md (OpenAI's own scope notes, which name the papers each challenge
   covers) × lean/formalization.yaml (the 'main results' catalogue). No verdict lives
   here — the lanes write their own ledgers.

   The small top-level files are copied into corpus/openai-math/release/ beside their
   sha256 (Apache-2.0, LICENSE copied with them); everything else is pinned by sha256
   and resolvable at https://github.com/openai/math/blob/<commit>/<path>.

   usage: node tools/pin-openai-math.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const os = require('os');
const crypto = require('crypto');
const { writeStable } = require('./stable-json.js');

const ROOT = path.resolve(__dirname, '..');
const CLONE = process.env.MATH_CLONE || path.join(os.homedir(), 'Projects', 'openai-math');
const PIN = 'fd4aeeb2ee4fc729c18d98444fed42fd0529eeeb';
const FIRST = 'adc7f1241b42e322a6451854ab7e4b4c146bf78a';
const OUT = path.join(ROOT, 'corpus', 'openai-math');
const die = (m) => { console.error('OPENAI-MATH PIN REFUSED: ' + m); process.exit(1); };
if (!fs.existsSync(CLONE)) die('no clone at ' + CLONE + ' (git clone https://github.com/openai/math.git ' + CLONE + ')');
const sh = (c) => cp.execSync(c, { cwd: CLONE, encoding: 'utf8', maxBuffer: 1 << 28 });
const head = sh('git rev-parse HEAD').trim();
if (head !== PIN) die('clone is at ' + head + ', not the pinned ' + PIN);
if (sh('git status --porcelain').trim()) die('the clone has local modifications');

const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const rd = (p) => fs.readFileSync(path.join(CLONE, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(CLONE, p));

/* ── the manuscript map ─────────────────────────────────────────────────────── */
const contents = rd('CONTENTS.md');
const cells = [...contents.matchAll(/<td>\n([\s\S]*?)\n<\/td>/g)].map((m) => m[1].trim());
const families = [];
const manuscripts = [];
const unhtml = (s) => s.replace(/<\/?i>|<\/?sub>|<\/?sup>|<\/?b>/g, '').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').replace(/&emsp;/g, '').replace(/\s+/g, ' ').trim();
for (const c of cells) {
  const fam = /^\*\*(\d{3})\. ([\s\S]*?)\*\*\s*([\s\S]*)$/.exec(c);
  if (fam) {
    const lean = /\(\[Lean\]\(lean\/docs\/(\d{3})\.md\)\)/.exec(fam[3]);
    families.push({ n: fam[1], title: unhtml(fam[2]).replace(/\.$/, ''), desc: unhtml(fam[3].replace(/\(\[Lean\]\([^)]*\)\)/, '')), leanDoc: lean ? 'lean/docs/' + lean[1] + '.md' : null });
    continue;
  }
  const ms = /^&emsp;\[([\s\S]*?)\]\((preprints\/([^/\n]+?)\/([^/\n]+?\.pdf))\)\s*([\s\S]*)$/.exec(c);
  if (ms) {
    if (!families.length) die('a manuscript before any family');
    manuscripts.push({ family: families[families.length - 1].n, title: unhtml(ms[1]), dir: ms[3], pdf: ms[2], abstract: unhtml(ms[5]) });
    continue;
  }
  die('an unparsed cell in CONTENTS.md: ' + c.slice(0, 120));
}
const header = /\*\*(\d+) manuscripts covering (\d+) result families\.\*\*/.exec(contents);
if (!header) die('CONTENTS.md header not found');
const statedManuscripts = Number(header[1]), statedFamilies = Number(header[2]);

/* each manuscript's bytes and date; a duplicated link is counted, not dropped */
const seenDir = new Map();
for (const m of manuscripts) {
  if (!exists(m.pdf)) die('a linked PDF is missing: ' + m.pdf);
  const st = fs.statSync(path.join(CLONE, m.pdf));
  m.sha256 = sha(path.join(CLONE, m.pdf)); m.bytes = st.size;
  m.date = (/-(\w+-\d{1,2}-\d{4})$/.exec(m.dir) || [])[1] || null;
  m.withdrawn = false;
  seenDir.set(m.dir, (seenDir.get(m.dir) || 0) + 1);
}
const duplicateLinks = [...seenDir].filter(([, n]) => n > 1).map(([d, n]) => ({ dir: d, links: n, families: manuscripts.filter((m) => m.dir === d).map((m) => m.family) }));

/* every preprint directory: linked (current), withdrawn, or an earlier edition */
const allDirs = fs.readdirSync(path.join(CLONE, 'preprints')).filter((d) => fs.statSync(path.join(CLONE, 'preprints', d)).isDirectory()).sort();
const withdrawn = [], earlierEditions = [];
for (const d of allDirs) {
  if (seenDir.has(d)) continue;
  const readme = exists('preprints/' + d + '/README.md') ? rd('preprints/' + d + '/README.md') : '';
  const w = /^# \[Withdrawal notice: ([^\]]+)\]/m.exec(readme);
  if (w) {
    const on = /\*\*Withdrawn on ([^.]+)\.\*\*/.exec(readme);
    const rev = /Repository revision: `([0-9a-f]{40})`/.exec(readme);
    const pdfs = fs.readdirSync(path.join(CLONE, 'preprints', d)).filter((f) => f.endsWith('.pdf'));
    withdrawn.push({ dir: d, title: w[1], withdrawnOn: on ? on[1] : null, archivedAt: rev ? rev[1] : null, readmeSha256: sha(path.join(CLONE, 'preprints', d, 'README.md')), pdf: pdfs.map((f) => ({ path: 'preprints/' + d + '/' + f, sha256: sha(path.join(CLONE, 'preprints', d, f)) })), notice: unhtml(readme.split('\n').slice(2).join(' ').split('## Archived manuscript')[0]).slice(0, 1200) });
  } else earlierEditions.push(d);
}

/* ── the challenges ─────────────────────────────────────────────────────────── */
const CH = 'lean/ComparatorChallenges';
const chNames = fs.readdirSync(path.join(CLONE, CH)).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).sort();
const stripComments = (s) => s.replace(/\/-[\s\S]*?-\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/--.*$/gm, '');
const chReadme = rd(CH + '/README.md');
const declaredSupport = new Set([...chReadme.matchAll(/`([A-Za-z0-9]+)\.json`/g)].map((m) => m[1]));
const challenges = chNames.map((name) => {
  const jp = CH + '/' + name + '.json', lp = CH + '/' + name + '.lean';
  if (!exists(lp)) die('a challenge config without its statement: ' + name);
  const cfg = JSON.parse(rd(jp));
  const src = rd(lp), code = stripComments(src);
  const lines = src.split('\n').length;
  const imports = [...src.matchAll(/^import\s+(\S+)/gm)].map((m) => m[1]);
  const axioms = [...code.matchAll(/^\s*axiom\s+(\S+)/gm)].map((m) => m[1]);
  const sorries = (code.match(/\bsorry\b/g) || []).length;
  const defs = (code.match(/^\s*(noncomputable\s+)?(def|abbrev|structure|class|inductive|instance)\b/gm) || []).length;
  /* each declared definition hole: does the challenge DISPLAY a body for it, or leave it sorried? (Comparator compares
     a hole's type only, so a displayed body is a body the check does not compare) */
  const escRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const holeBodies = (cfg.definition_names || []).map((full) => {
    const parts = full.split('.');
    for (const c of [parts[parts.length - 1], parts.slice(-2).join('.')]) {
      const re = new RegExp('^\\s*(?:noncomputable\\s+)?(?:def|abbrev|structure|inductive|class)\\s+' + escRe(c)
        + '\\b[\\s\\S]*?(?=^\\s*(?:noncomputable\\s+)?(?:def|abbrev|theorem|lemma|structure|inductive|class|instance|end|namespace)\\b|^\\s*/--|^\\s*@\\[|(?![\\s\\S]))', 'm');
      const m = re.exec(src);
      if (m) return { name: full, displayed: !/\bsorry\b/.test(m[0]) };
    }
    return { name: full, displayed: null };
  });
  return {
    name, config: jp, statement: lp, holeBodies, configSha256: sha(path.join(CLONE, jp)), statementSha256: sha(path.join(CLONE, lp)), statementLines: lines, statementBytes: Buffer.byteLength(src),
    challengeModule: cfg.challenge_module, solutionModule: cfg.solution_module, theoremNames: cfg.theorem_names, definitionNames: cfg.definition_names || [],
    permittedAxioms: cfg.permitted_axioms, enableNanoda: cfg.enable_nanoda === undefined ? 'absent' : cfg.enable_nanoda, solutionImports: cfg.solution_imports || null,
    imports, axiomDeclarations: axioms, sorryCount: sorries, declarationsInStatement: defs,
    support: declaredSupport.has(name), supportByName: /Support$/.test(name) && !declaredSupport.has(name),
  };
});

/* ── OpenAI's scope notes: family ↔ papers ↔ challenges ─────────────────────── */
const docFiles = fs.readdirSync(path.join(CLONE, 'lean', 'docs')).filter((f) => /^\d{3}\.md$/.test(f)).sort();
const scopeNotes = docFiles.map((f) => {
  const s = rd('lean/docs/' + f);
  return {
    family: f.slice(0, 3), path: 'lean/docs/' + f, sha256: sha(path.join(CLONE, 'lean', 'docs', f)), title: unhtml((/^# (.*)$/m.exec(s) || [])[1] || ''),
    papers: [...new Set([...s.matchAll(/\(\.\.\/\.\.\/preprints\/([^/\n]+?)\/[^/\n]+?\.pdf\)/g)].map((m) => m[1]))],
    challenges: [...new Set([...s.matchAll(/\(\.\.\/ComparatorChallenges\/([^)]+)\.lean\)/g)].map((m) => m[1]))],
    scope: unhtml(((/## Scope\n([\s\S]*?)(\n## |$)/.exec(s)) || [])[1] || ''),
  };
});
const chToFam = new Map();
for (const n of scopeNotes) for (const c of n.challenges) { if (!chToFam.has(c)) chToFam.set(c, []); chToFam.get(c).push(n.family); }
for (const c of challenges) c.families = chToFam.get(c.name) || [];
const unlinkedChallenges = challenges.filter((c) => !c.families.length).map((c) => c.name);

/* ── the formalization catalogue ────────────────────────────────────────────── */
const yaml = rd('lean/formalization.yaml');
const mainResults = [...yaml.matchAll(/- comparator_config: (\S+)\n\s+declaration: (\S+)\n\s+file: (\S+)/g)].map((m) => ({ config: m[1], declaration: m[2], file: m[3] }));
const yamlSources = (yaml.match(/^  - title: /gm) || []).length;
const yamlField = (k) => (new RegExp('^\\s+(?:- )?' + k + ': "?([^"\\n]+)"?', 'm').exec(yaml) || [])[1] || null;
const mainByConfig = new Set(mainResults.map((r) => path.basename(r.config, '.json')));
for (const c of challenges) c.mainResultInCatalogue = mainByConfig.has(c.name);

/* ── the formal library itself ──────────────────────────────────────────────── */
const leanFiles = sh("git ls-files 'lean/OAI/*.lean' 'lean/OAI.lean' | wc -l").trim();
const manifest = JSON.parse(rd('lean/lake-manifest.json'));
const toolchain = rd('lean/lean-toolchain').trim();
const log = sh("git log --format='%H|%aI|%an|%s'").trim().split('\n').map((l) => { const [sha_, date, author, ...msg] = l.split('|'); return { sha: sha_, date, author, msg: msg.join('|') }; });
const diffFirst = sh('git diff --shortstat ' + FIRST + ' ' + PIN).trim();
const changedFirst = sh('git diff --name-status ' + FIRST + ' ' + PIN).trim().split('\n').map((l) => l.split('\t'));
const challengesAdded = changedFirst.filter(([st, p]) => st === 'A' && p.startsWith(CH + '/') && p.endsWith('.json')).map(([, p]) => path.basename(p, '.json')).sort();
const challengesModified = changedFirst.filter(([st, p]) => st === 'M' && p.startsWith(CH + '/')).map(([, p]) => path.basename(p)).sort();

/* ── per-family rows: what the census lanes read ────────────────────────────── */
const famRows = families.map((f) => {
  const ms = manuscripts.filter((m) => m.family === f.n);
  const note = scopeNotes.find((n) => n.family === f.n) || null;
  return { n: f.n, title: f.title, desc: f.desc, manuscripts: ms.map((m) => m.dir), scopeNote: note ? note.path : null, challenges: note ? note.challenges : [], reasoningSummary: null };
});
const readme = rd('README.md');
for (const m of readme.matchAll(/^\| (\d{3}) \| \[([^\]]+)\]\((reasoning_traces\/[^)]+)\) \|$/gm)) { const r = famRows.find((x) => x.n === m[1]); if (r) r.reasoningSummary = { subject: m[2], path: m[3], sha256: sha(path.join(CLONE, m[3])) }; }
const readmeRatio = /(\d+) \/ (\d+) = ~(\d+)%/.exec(rd('history.md'));

/* ── copies of the small top-level files ────────────────────────────────────── */
const COPY = ['README.md', 'CONTENTS.md', 'history.md', 'LICENSE', 'lean/formalization.yaml', 'lean/lake-manifest.json', 'lean/lakefile.lean', 'lean/lean-toolchain', 'lean/ComparatorChallenges/README.md'];
fs.mkdirSync(path.join(OUT, 'release'), { recursive: true });
const copied = COPY.map((p) => { const dst = path.join(OUT, 'release', p.replace(/\//g, '__')); fs.copyFileSync(path.join(CLONE, p), dst); return { path: p, copy: path.relative(ROOT, dst), sha256: sha(dst), bytes: fs.statSync(dst).size }; });

const sizeHist = (xs, cuts) => Object.fromEntries(cuts.map((c, i) => [(i ? '>' + cuts[i - 1] + ' ' : '') + '<=' + c, xs.filter((x) => x <= c && (i === 0 || x > cuts[i - 1])).length]).concat([['>' + cuts[cuts.length - 1], xs.filter((x) => x > cuts[cuts.length - 1]).length]]));
const lineCounts = challenges.map((c) => c.statementLines).sort((a, b) => a - b);
const tally = (xs) => xs.reduce((o, x) => ((o[x] = (o[x] || 0) + 1), o), {});

const release = {
  what: 'Counts and facts about github.com/openai/math computed from a clone at the pinned commit by tools/pin-openai-math.js, and the census the audit lanes draw from. The audit page, the ledger and the lanes read this record and retype nothing. No verdict lives here.',
  repository: 'https://github.com/openai/math', commit: head, commits: log, license: 'Apache-2.0 (LICENSE copied in release/)',
  sinceFirstCommit: { from: FIRST, shortstat: diffFirst, challengesAdded, challengesModified },
  stated: { manuscripts: statedManuscripts, families: statedFamilies, formalizedTopLine: readmeRatio ? { formalized: Number(readmeRatio[1]), of: Number(readmeRatio[2]), percentStated: Number(readmeRatio[3]) } : null, review: yamlField('status'), scope: yamlField('scope'), automation: yamlField('method') },
  counted: {
    familiesParsed: families.length, manuscriptLinks: manuscripts.length, manuscriptDirsLinked: seenDir.size, duplicateLinks,
    preprintDirs: allDirs.length, withdrawn: withdrawn.length, earlierEditions: earlierEditions.length,
    familiesWithScopeNote: famRows.filter((f) => f.scopeNote).length, scopeNotes: scopeNotes.length,
    challenges: challenges.length, challengesSupport: challenges.filter((c) => c.support).length, unlinkedChallenges,
    catalogueMainResults: mainResults.length, catalogueSources: yamlSources,
    enableNanoda: tally(challenges.map((c) => String(c.enableNanoda))),
    permittedAxioms: tally(challenges.map((c) => c.permittedAxioms.slice().sort().join(','))),
    challengesImportingAllMathlib: challenges.filter((c) => c.imports.includes('Mathlib')).length,
    theorems: challenges.reduce((a, c) => a + c.theoremNames.length, 0), definitionNamesDeclared: challenges.filter((c) => c.definitionNames.length).length,
    definitionHoles: { declared: challenges.reduce((a, c) => a + c.holeBodies.length, 0), displayedWithBody: challenges.reduce((a, c) => a + c.holeBodies.filter((h) => h.displayed === true).length, 0), sorried: challenges.reduce((a, c) => a + c.holeBodies.filter((h) => h.displayed === false).length, 0), notFound: challenges.reduce((a, c) => a + c.holeBodies.filter((h) => h.displayed === null).length, 0) },
    statementsWithAxiomDeclaration: challenges.filter((c) => c.axiomDeclarations.length).map((c) => ({ name: c.name, axioms: c.axiomDeclarations })),
    statementLines: { median: lineCounts[Math.floor(lineCounts.length / 2)], max: lineCounts[lineCounts.length - 1], hist: sizeHist(lineCounts, [50, 100, 200, 1000]) },
    largestStatements: challenges.slice().sort((a, b) => b.statementLines - a.statementLines).slice(0, 8).map((c) => ({ name: c.name, lines: c.statementLines })),
    leanFiles: Number(leanFiles), toolchain, mathlib: (manifest.packages.find((p) => p.name === 'mathlib') || {}).rev, dependencies: manifest.packages.length,
    reasoningSummaries: famRows.filter((f) => f.reasoningSummary).length,
  },
  copied,
  families: famRows,
  manuscripts,
  withdrawn,
  earlierEditions,
  scopeNotes,
  challenges,
  catalogueMainResults: mainResults,
  dependencies: manifest.packages.map((p) => ({ name: p.name, url: p.url, rev: p.rev })),
};
fs.mkdirSync(OUT, { recursive: true });
const wrote = writeStable(path.join(OUT, 'release.json'), release);
console.log('corpus/openai-math/release.json' + (wrote ? '' : ' (unchanged)') + ': ' + families.length + ' families, ' + manuscripts.length + ' manuscript links (' + seenDir.size + ' dirs), ' + withdrawn.length + ' withdrawn, ' + earlierEditions.length + ' earlier editions; ' + challenges.length + ' challenges (' + release.counted.challengesSupport + ' support), nanoda ' + JSON.stringify(release.counted.enableNanoda) + '; ' + scopeNotes.length + ' scope notes; ' + mainResults.length + ' catalogue main results; ' + leanFiles + ' Lean files');
if (families.length !== statedFamilies) console.log('NOTE: CONTENTS.md states ' + statedFamilies + ' families; parsed ' + families.length);
if (manuscripts.length !== statedManuscripts) console.log('NOTE: CONTENTS.md states ' + statedManuscripts + ' manuscripts; parsed ' + manuscripts.length + ' links over ' + seenDir.size + ' directories');
