#!/usr/bin/env node
/* record-zq-lean-replay.js — Track A lane 4 on the claim "Z is Diophantine in Q" (Elliot Glazer with AI agents,
   2026-11-05): the kernel replay of the 48 accepted Lean helper modules of github.com/elliotglazer/diophantine-z-q at
   97cec7fd (lean/, integration 31). Writes certs/zq-lean-replay.json; `--check` re-derives it and refuses on any
   difference.

   THE THEOREM IS UNDECIDED HERE. The main Lean target lean/Frozen/BoundedIntegerPolynomial.lean is unproved (its
   proof is `sorry`); this record decides facts about the helper library and the target's statement, nothing else.

   INPUTS. (1) The pod's facts, imported verbatim into corpus/zq/runs/lane4-2026-11-06/ from /root/zq-lane4/final/out
   (tools/runpod-zq-lane4.sh, run over SSH): exit codes, logs, GNU time, our audit's JSON lines, sha256s. (2) The
   read-only clone at ~/Projects/zq-scout/diophantine-z-q (ZQ_REPO), whose pinned files are sha256-checked before
   use: the census, the re-hash and the reconciliation are computed HERE from those bytes, so --check re-derives
   them. (3) Our pod-side files: each pod step recorded their sha256 (.code); a step whose files differ from the
   ones in tools/ now refuses the record.

   RULES: notes/zq-preregistration-2026-11-06.md, lane 4 and its amendments A to E. Verdict words exactly as
   pre-registered: CERTIFIED, REFUTED, REFUSED.

   IMPORT (once, after the pod run): ssh … 'tar -C /root/zq-lane4/final/out -czf - .' | tar -xzf - -C <RUN>, then
   `node tools/record-zq-lean-replay.js --reduce-exported` (amendment E), then this tool.

   usage: node tools/record-zq-lean-replay.js [--check] */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const REPO = process.env.ZQ_REPO || path.join(os.homedir(), 'Projects', 'zq-scout', 'diophantine-z-q');
const RUN = path.join(ROOT, 'corpus', 'zq', 'runs', 'lane4-2026-11-06');
const OUT = path.join(ROOT, 'certs', 'zq-lean-replay.json');
const die = (m) => { console.error('zq-lean-replay: ' + m); process.exit(1); };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const PIN = {
  repository: 'github.com/elliotglazer/diophantine-z-q', commit: '97cec7fdd757d9a8e4f468151a47a6d3610fb2f2',
  sourceManifest: { path: 'lean/SOURCE_MANIFEST.json', sha256: '343d2eb94974a9c3defb58b8349f94378fb1984cb260b53162790426d8bbff96' },
  axioms: { path: 'lean/AXIOMS.json', sha256: '4890463e3344f729a320319f9daa116655b83eeabb7d2de73b3590116977a868' },
  lakeManifest: { path: 'lean/lake-manifest.json', sha256: 'a770787f33b5824f61a0731d59e67fca3f44a531b21d1fc1a804064c6fb54e58' },
  frozen: { path: 'lean/Frozen/BoundedIntegerPolynomial.lean', sha256: '0889579ae56e75eca811af520eb4e18c9f697e163db408771b93fdbc651a95b9' },
  validation: { path: 'lean/VALIDATION.json', sha256: '88e748d1369cde4e80ed4468795f28e5d5bb873738947ff468eae1c6ebcb677a' },
  lakefile: { path: 'lean/lakefile.toml', sha256: '632fda3c75f7616378b9dadd0906d9518c7b4a1199c59d7b36369121acfb3b26' },
};
const TOOLCHAIN = { version: '4.35.0', commit: 'eb6cafb7290e8bd5f2937522d8d804f58f02bafc', file: 'leanprover/lean4:v4.35.0' };
const NANODA_PIN = '8de7e0c4ed3052745a7f8725164efd9e76d84c56';
const ALLOWED = ['Classical.choice', 'Quot.sound', 'propext'];
const UNDECIDED = 'The theorem (Z is Diophantine in Q) is undecided here: the main Lean target lean/Frozen/BoundedIntegerPolynomial.lean is unproved (its proof is `sorry`) and nothing in this record decides it. This record decides that the 48 accepted helper modules check in the kernel with only the three standard axioms, how their declarations reconcile with the claimant\'s 704, and that the frozen statement elaborates with its one `sorry`; whether the helper statements mean what the manuscript needs is not decided here.';
const OURS = { script: 'tools/runpod-zq-lane4.sh', audit: 'tools/zq-lean-audit.lean', hyperop: 'tools/zq-lean-hyperop.lean', plants: 'tools/zq-lean-plants.txt', localize: 'tools/runpod-zq-lane4-nanoda-modules.sh' };

/* ---- the read-only clone ---- */
const repoFile = (rel) => { const p = path.join(REPO, rel); if (!fs.existsSync(p)) die('the claimant clone is not at ' + REPO + ' (set ZQ_REPO); refusing'); return fs.readFileSync(p); };
const readPinned = (pin) => { const b = repoFile(pin.path); if (sha(b) !== pin.sha256) die(pin.path + ' is not the pinned bytes; REFUSED, nothing computed'); return b; };
const walk = (dir, rel = '') => fs.readdirSync(path.join(dir, rel), { withFileTypes: true }).flatMap((e) => {
  const r = rel ? rel + '/' + e.name : e.name;
  if (e.isDirectory()) return e.name === '.lake' ? [] : walk(dir, r);
  return [r];
});

/* ---- the pod's facts ---- */
const fact = (name) => { const p = path.join(RUN, name); return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null; };
const need = (name) => { const t = fact(name); if (t === null) die('missing fact ' + name + ' in ' + path.relative(ROOT, RUN)); return t; };
const exitOf = (s) => { const t = fact(s + '.exit'); return t === null ? null : Number(t.trim()); };
const gnuTime = (t) => {
  if (!t) return {};
  const m = (re) => { const x = t.match(re); return x ? x[1].trim() : null; };
  const el = m(/Elapsed \(wall clock\) time \(h:mm:ss or m:ss\): (\S+)/);
  let wall = null;
  if (el) { const parts = el.split(':').map(Number); wall = Math.round(parts.reduce((a, b) => a * 60 + b, 0) * 100) / 100; }
  const rss = m(/Maximum resident set size \(kbytes\): (\d+)/);
  return { wallSeconds: wall, maxRssKiB: rss === null ? null : Number(rss), userSeconds: Number(m(/User time \(seconds\): (\S+)/)), systemSeconds: Number(m(/System time \(seconds\): (\S+)/)) };
};
const step = (s) => {
  const e = exitOf(s); if (e === null) return null;
  const a = fact(s + '.start'), b = fact(s + '.end');
  return Object.assign({ step: s, exit: e, seconds: a && b ? Number(b) - Number(a) : null }, gnuTime(fact(s + '.time')));
};
/* counts keyed by arbitrary strings ('constructor' is one of them): a Map, then a plain object sorted by key */
const countBy = (xs, f) => { const m = new Map(); for (const x of xs) m.set(f(x), (m.get(f(x)) || 0) + 1); return Object.fromEntries([...m].sort((a, b) => (a[0] < b[0] ? -1 : 1))); };
const jsonl = (name) => need(name).split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
const lines = (t) => (t || '').split('\n');
const sorryWarnings = (t) => (t.match(/declaration uses `sorry`/g) || []).length;
const errorLines = (t) => lines(t).filter((l) => /(^|: )error(\(|:)/.test(l));

/* ---- the census: a Lean lexer that marks code apart from comments, docstrings and strings ---- */
const TOKENS = ['sorry', 'admit', 'axiom', 'native_decide', 'implemented_by', 'extern', 'unsafe', 'opaque', 'partial', 'skipKernelTC', 'set_option', 'run_cmd', '#eval', 'ofReduceBool', 'trustCompiler', 'addDecl', 'elab', 'macro'];
const PREREG = ['sorry', 'axiom', 'native_decide', 'implemented_by', 'extern', 'unsafe'];
const GATING = ['sorry', 'admit', 'axiom', 'native_decide', 'implemented_by', 'extern', 'unsafe', 'skipKernelTC', 'run_cmd', '#eval', 'ofReduceBool', 'trustCompiler', 'addDecl'];
const codeMask = (s) => {
  const m = new Uint8Array(s.length); let i = 0, depth = 0;
  while (i < s.length) {
    if (depth > 0) {
      if (s.startsWith('/-', i)) { depth++; i += 2; } else if (s.startsWith('-/', i)) { depth--; i += 2; } else i++;
    } else if (s.startsWith('/-', i)) { depth = 1; i += 2; }
    else if (s.startsWith('--', i)) { while (i < s.length && s[i] !== '\n') i++; }
    else if (s[i] === '"') { i++; while (i < s.length && s[i] !== '"') i += s[i] === '\\' ? 2 : 1; i++; }
    else { m[i] = 1; i++; }
  }
  return m;
};
const census = (file, s) => {
  const mask = codeMask(s), hits = [];
  for (const tok of TOKENS) {
    /* a preceding '.' is allowed, so qualified uses (debug.skipKernelTC, Lean.ofReduceBool) are seen (amendment E) */
    const re = new RegExp('(?<![A-Za-z0-9_\'!?])' + tok.replace(/[#]/g, '\\#') + '(?![A-Za-z0-9_\'!?])', 'g');
    let x;
    while ((x = re.exec(s))) {
      const line = s.slice(0, x.index).split('\n').length;
      hits.push({ file, line, token: tok, inCode: mask[x.index] === 1, text: s.split('\n')[line - 1].trim().slice(0, 160) });
    }
  }
  return hits.sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : a.line - b.line || (a.token < b.token ? -1 : 1)));
};
const plants = () => {
  const t = fs.readFileSync(path.join(ROOT, OURS.plants), 'utf8'), out = {}; let cur = null;
  for (const l of t.split('\n')) {
    const m = l.match(/^-- ZQ-PLANT (P\d) /);
    if (m) { cur = m[1]; out[cur] = ''; continue; }
    if (l.startsWith('-- ZQ-PLANT ')) { cur = null; continue; }
    if (cur) out[cur] += l + '\n';
  }
  return out;
};

/* ---- the reconciliation classes (amendment C item 3) ---- */
const privateTail = (n) => { const m = n.match(/^_private\.(?:[^.]+\.)*?0\.(.*)$/); return m ? m[1] : null; };
const classOf = (n) => {
  const t = privateTail(n);
  if (t === null) return 'nonPrivate';
  const last = t.split('.').pop();
  if (/^_proof_\d+(_\d+)?$/.test(last)) return 'privateAuxProof';
  if (/^_simp_\d+_\d+$/.test(last)) return 'privateAuxSimp';
  if (last === '_arg_pusher') return 'privateArgPusher';
  return 'explicitPrivate';
};

function build() {
  const rows = [], notes = [];
  const row = (id, statement, ok, numbers = {}, onFail = 'REFUSED') => { rows.push({ id, statement, verdict: ok ? 'CERTIFIED' : onFail, numbers }); return ok; };
  const info = [];
  const record = (id, statement, outcome, numbers = {}) => info.push({ id, statement, outcome, numbers });

  /* our files: every step's recorded sha256s against tools/ now */
  const cur = Object.fromEntries(Object.entries(OURS).map(([k, p]) => [path.basename(p), sha(fs.readFileSync(path.join(ROOT, p)))]));
  const codeFiles = fs.readdirSync(RUN).filter((f) => f.endsWith('.code'));
  if (!codeFiles.length) die('no .code facts');
  /* every file a step listed must be the file in tools/ now (all four of the recorded pass were final before it began) */
  const ranWith = {};
  for (const f of codeFiles) {
    for (const [h, n] of need(f).trim().split('\n').map((l) => l.trim().split(/\s+/))) {
      if (!(n in cur)) die('step ' + f.slice(0, -5) + ' lists ' + n + ', not one of our files');
      if (h !== cur[n]) die('step ' + f.slice(0, -5) + ' ran ' + n + ' ' + h.slice(0, 12) + '…, tools/ holds ' + cur[n].slice(0, 12) + '…: the record is not what these files give; REFUSED');
      ranWith[n] = h;
    }
  }

  /* the pinned files of the clone */
  const manifest = JSON.parse(readPinned(PIN.sourceManifest));
  const theirAxioms = JSON.parse(readPinned(PIN.axioms));
  const lakeManifest = JSON.parse(readPinned(PIN.lakeManifest));
  const frozenSrc = readPinned(PIN.frozen).toString('utf8');
  const validation = JSON.parse(readPinned(PIN.validation));
  const lakefile = readPinned(PIN.lakefile).toString('utf8');
  const mods = manifest.files.filter((f) => /^ZInQ\./.test(f.module || ''));
  const localFiles = Object.fromEntries(walk(path.join(REPO, 'lean')).sort().map((r) => ['lean/' + r, sha(repoFile('lean/' + r))]));

  /* R1 the clone at the pin */
  const clone = step('clone'), cloneLog = lines(fact('clone.log'));
  row('R1', 'a fresh clone of the claimant repository is at the pinned commit with a clean tree', clone && clone.exit === 0 && cloneLog[0].split(' ')[0] === PIN.commit && cloneLog[1].trim() === '0', { head: cloneLog[0].split(' ').slice(0, 2).join(' ') });

  /* R2 the sources, re-hashed on the pod and here */
  const rh = JSON.parse(need('rehash.json'));
  const badManifest = manifest.files.filter((f) => rh.files['lean/' + f.path] !== f.sha256).map((f) => f.path);
  const badLocal = manifest.files.filter((f) => localFiles['lean/' + f.path] !== f.sha256).map((f) => f.path);
  const pinsOk = ['sourceManifest', 'axioms', 'lakeManifest', 'frozen', 'validation', 'lakefile'].every((k) => rh.files[PIN[k].path] === PIN[k].sha256);
  const podZ = Object.keys(rh.files).filter((p) => /^lean\/ZInQ\/[^/]+\.lean$/.test(p)).sort();
  const manZ = mods.map((f) => 'lean/' + f.path).sort();
  const rootOk = rh.rootImports.length === 48 && new Set(rh.rootImports).size === 48 && rh.rootImports.slice().sort().join() === mods.map((f) => f.module).sort().join();
  const sameAsLocal = JSON.stringify(Object.keys(rh.files).sort()) === JSON.stringify(Object.keys(localFiles)) && Object.keys(localFiles).every((p) => rh.files[p] === localFiles[p]);
  row('R2', 'the 48 module sources and the 5 other manifest files hash as lean/SOURCE_MANIFEST.json says, on the pod and in the desk clone; the root imports exactly the 48; no other .lean file in ZInQ/; the pod\'s lean/ tree equals the desk clone file for file', mods.length === 48 && manifest.files.length === 53 && !badManifest.length && !badLocal.length && pinsOk && JSON.stringify(podZ) === JSON.stringify(manZ) && rootOk && sameAsLocal,
    { manifestEntries: manifest.files.length, modules: mods.length, mismatchesPod: badManifest, mismatchesDesk: badLocal, filesUnderLean: Object.keys(localFiles).length, manifestCounts: manifest.counts });
  /* P5: one byte appended to a source must be flagged by exactly this comparison */
  const p5file = mods[0].path, p5bytes = Buffer.concat([repoFile('lean/' + p5file), Buffer.from(' ')]);
  const p5flag = manifest.files.filter((f) => (f.path === p5file ? sha(p5bytes) : localFiles['lean/' + f.path]) !== f.sha256).map((f) => f.path);

  /* R3 toolchain and dependencies */
  const env = need('env.txt'), deps = need('deps.txt').trim().split('\n').map((l) => l.trim().split(/\s+/));
  const want = Object.fromEntries(lakeManifest.packages.map((p) => [p.name, p.rev]));
  const depsOk = deps.length === lakeManifest.packages.length && deps.every(([n, r, dirty]) => want[n] === r && dirty === '0');
  const valDeps = Object.fromEntries(validation.dependency_pins.map((d) => [d.name, d.revision]));
  const valDepsAgree = Object.keys(valDeps).length === deps.length && deps.every(([n, r]) => valDeps[n] === r);
  const toolSha = Object.fromEntries((env.match(/^[0-9a-f]{64}  \S+$/gm) || []).map((l) => l.split(/\s+/).reverse()));
  row('R3', 'the pinned toolchain is reproduced: Lean ' + TOOLCHAIN.version + ' at commit ' + TOOLCHAIN.commit.slice(0, 8) + ' (the commit their VALIDATION.json names), and every dependency checkout is at its lake-manifest revision with clean tracked sources', env.includes('toolchain file: ' + TOOLCHAIN.file) && env.includes('Lean (version ' + TOOLCHAIN.version + ', x86_64-unknown-linux-gnu, commit ' + TOOLCHAIN.commit) && depsOk && valDepsAgree && step('cache').exit === 0,
    { lean: (env.match(/^lean: (.*)$/m) || [])[1], platform: (env.match(/^kernel: (.*)$/m) || [])[1], dependencies: deps.length, toolSha256: toolSha });

  /* R4 the build */
  const b = step('build'), blog = need('build.log');
  const built = [...new Set((blog.match(/Built (ZInQ(?:\.[A-Za-z0-9_]+)?) /g) || []).map((x) => x.slice(6, -1)))];
  const oleans = need('build-oleans.sha256').trim().split('\n').length;
  row('R4', '`lake build ZInQ` (kernel checking on: the lakefile sets no option and debug.skipKernelTC defaults to false) builds the 48 modules and the root with no error and no `sorry`', b && b.exit === 0 && built.length === 49 && oleans === 49 && !errorLines(blog).length && sorryWarnings(blog) === 0 && /Build completed successfully/.test(blog),
    { exit: b && b.exit, seconds: b && b.seconds, maxRssKiB: b && b.maxRssKiB, projectModulesBuilt: built.length, oleans, warnings: (blog.match(/^warning: /gm) || []).length, jobs: Number((blog.match(/Build completed successfully \((\d+) jobs\)/) || [])[1]) }, 'REFUTED');

  /* R5 the pre-registered flag, per module */
  const list = need('modules/list.txt').trim().split('\n');
  const per = list.map((p) => { const m = p.replace(/\//g, '_'); const t = gnuTime(fact('modules/' + m + '.time')); const log = fact('modules/' + m + '.log') || ''; return { path: p, exit: Number((fact('modules/' + m + '.exit') || '').trim()), errors: errorLines(log).length, sorry: sorryWarnings(log), wall: t.wallSeconds, rss: t.maxRssKiB }; });
  const msA = Number(need('modules.start')), msB = Number(need('modules.end'));
  row('R5', 'each of the 48 modules re-elaborated alone with `lake env lean -Ddebug.skipKernelTC=false` exits 0 with no error and no `sorry` warning', list.length === 48 && list.slice().sort().join() === mods.map((f) => f.path).sort().join() && per.every((x) => x.exit === 0 && x.errors === 0 && x.sorry === 0),
    { modules: list.length, failing: per.filter((x) => x.exit !== 0 || x.errors || x.sorry).map((x) => x.path), wallSecondsAll: msB - msA, maxWallSeconds: Math.max(...per.map((x) => x.wall)), maxRssKiB: Math.max(...per.map((x) => x.rss)) }, 'REFUTED');

  /* R6 our audit */
  const A = jsonl('audit.jsonl'), sum = A.find((x) => x.type === 'summary'), decls = A.filter((x) => x.type === 'decl'), amods = A.filter((x) => x.type === 'module');
  const au = step('audit');
  const flagCount = (f) => decls.filter((d) => d.flags.includes(f)).length;
  const flagNames = ['private', 'internal', 'auxRecursor', 'noConfusion', 'matcher', 'instance', 'unsafe', 'partial', 'implementedBy', 'extern'];
  const subset = (xs) => xs.every((a) => ALLOWED.includes(a));
  const auditOk = au && au.exit === 0 && sum && sum.lean === TOOLCHAIN.version && sum.githash === TOOLCHAIN.commit && sum.skipKernelTCDefault === false && sum.modules === 49 && amods.length === 49
    && sum.declarations === decls.length && sum.fromModuleData === decls.length && sum.missingReferences.length === 0 && sum.nonstandard.length === 0
    && subset(sum.unionOurs) && subset(sum.unionLean) && decls.every((d) => d.kind !== 'axiom' && subset(d.ours) && subset(d.lean))
    && mods.every((f) => decls.some((d) => d.module === f.module)) && !decls.some((d) => d.module === 'ZInQ');
  const disagree = sum ? sum.traversalDisagreements : [];
  row('R6', 'our audit (tools/zq-lean-audit.lean): every declaration of the 48 modules, selected by defining module, reaches only propext, Quot.sound and Classical.choice, by our fresh traversal AND by Lean.collectAxioms; no declaration of kind axiom; no unresolved reference', auditOk,
    { exit: au && au.exit, seconds: au && au.seconds, maxRssKiB: au && au.maxRssKiB, declarations: decls.length, modulesScanned: sum && sum.modules, kinds: sum && sum.kinds, closureConstants: sum && sum.closure, fixpointPasses: sum && sum.fixpointPasses, axiomsInClosure: sum && sum.axiomsInClosure, codeGeneratorExtraNames: sum && sum.extraConstNames, flags: Object.fromEntries(flagNames.map((f) => [f, flagCount(f)])), skipKernelTCDefault: sum && sum.skipKernelTCDefault, traversalDisagreements: disagree.length }, 'REFUTED');
  const partials = decls.filter((d) => d.flags.includes('partial') || d.flags.includes('unsafe'));
  if (partials.length) notes.push(partials.length + ' declaration(s) are partial or unsafe, ' + (partials.every((d) => /\._unsafe_rec$/.test(d.name)) ? 'all compiler-generated `._unsafe_rec` auxiliaries of well-founded definitions (the sources contain no `partial` or `unsafe` in code, R8); the kernel forbids a safe declaration to use them' : 'NOT all `._unsafe_rec`: ' + partials.map((d) => d.name).join(', ')) + '.');
  if (disagree.length) notes.push('Our traversal and Lean.collectAxioms differ on ' + disagree.length + ' declaration(s), every difference inside the three standard axioms: ' + disagree.map((d) => d.name + ' (ours ' + JSON.stringify(d.ours) + ', Lean ' + JSON.stringify(d.lean) + ')').join('; ') + '. Our reading (amendment C item 4): these constructors\' own types mention only their inductive, which ours follows back to the `equation` constructor; v4.35.0\'s stored table has [] for them.');

  /* R7 the reconciliation with their 704 */
  const T = new Map(theirAxioms.declarations.map((d) => [d.declaration, d.axioms.slice().sort()]));
  const O = new Map(decls.map((d) => [d.name, d]));
  const notOurs = [...T.keys()].filter((n) => !O.has(n));
  const leanDiff = [...T].filter(([n, a]) => O.has(n) && JSON.stringify(O.get(n).lean.slice().sort()) !== JSON.stringify(a)).map(([n]) => n);
  const oursNotSuper = [...T].filter(([n, a]) => O.has(n) && !a.every((x) => O.get(n).ours.includes(x))).map(([n]) => n);
  const strict = [...T].filter(([n, a]) => O.has(n) && JSON.stringify(O.get(n).ours.slice().sort()) !== JSON.stringify(a)).map(([n, a]) => ({ name: n, theirs: a, ours: O.get(n).ours }));
  const extras = decls.filter((d) => !T.has(d.name));
  const classes = countBy(extras, (d) => classOf(d.name));
  const extraKinds = [...new Set(extras.map((d) => d.kind))];
  const reconciles = theirAxioms.declarations.length === 704 && T.size === 704 && theirAxioms.module_count === 48 && !notOurs.length && !leanDiff.length && !oursNotSuper.length
    && strict.every((x) => subset(x.ours)) && !classes.nonPrivate && classes.explicitPrivate === manifest.counts.private && decls.length === 704 + extras.length;
  row('R7', 'our declarations reconcile with their 704 (lean/AXIOMS.json): all 704 are ours; Lean.collectAxioms gives their axiom set on all 704; ours contains theirs on all 704, every strict difference listed and standard; our ' + decls.length + ' − 704 = ' + extras.length + ' others are private theorems in the named classes, the explicit ones exactly the manifest\'s ' + manifest.counts.private + ' private declarations', reconciles,
    { theirs: T.size, ours: decls.length, extra: extras.length, extraClasses: classes, extraKinds, theirsNotOurs: notOurs, leanSetDiffers: leanDiff, oursStrictlyLarger: strict.map((x) => x.name), rule: 'amendment C items 3-4 (written after the first pass)' });

  /* the exported view (amendment C item 2), informational */
  const ex = step('exported');
  if (ex && ex.exit === 0) {
    const XR = JSON.parse(need('exported-audit.reduced.json'));
    const E = XR.decls, en = new Set(E.map((d) => d.name));
    const same = en.size === T.size && [...T.keys()].every((n) => en.has(n));
    const leanSame = E.every((d) => !T.has(d.name) || JSON.stringify(d.lean.slice().sort()) === JSON.stringify(T.get(d.name)));
    record('X1', 'our audit body from a module-system file (`module`, `public import ZInQ`): the exported view a module importer gets', same ? 'exactly their 704 names' : 'differs from their 704', { declarations: E.length, sameNamesAsTheirs: same, leanAxiomsEqualTheirs: leanSame, kinds: countBy(E, (d) => d.kind), theoremsSeenAsAxiomsInClosure: XR.summary.axiomsInClosure, original: XR.source + ' ' + XR.bytes + ' bytes, sha256 ' + XR.sha256 + ' (reduced on import: in this view every imported theorem is its own axiom, so our traversal\'s lists are long and meaningless)', prediction: 'exactly their 704 names (amendment C item 2)' });
  } else record('X1', 'the exported view', 'not run (exit ' + (ex && ex.exit) + ')');

  /* R8 the census */
  const files = mods.map((f) => 'lean/' + f.path).concat(['lean/ZInQ.lean', PIN.frozen.path]);
  const hits = files.flatMap((f) => census(f, repoFile(f).toString('utf8')));
  const inLib = (h) => h.file !== PIN.frozen.path;
  const gatingCode = hits.filter((h) => inLib(h) && h.inCode && GATING.includes(h.token));
  const frozenSorry = hits.filter((h) => h.file === PIN.frozen.path && h.token === 'sorry' && h.inCode).length;
  const frozenOther = hits.filter((h) => h.file === PIN.frozen.path && h.inCode && h.token !== 'sorry' && GATING.includes(h.token));
  const lakeOptions = /leanOptions|moreLeanArgs|weakLeanArgs|moreServerArgs|moreServerOptions/.test(lakefile);
  const tally = Object.fromEntries(TOKENS.map((t) => [t, { code: hits.filter((h) => inLib(h) && h.token === t && h.inCode).length, commentOrString: hits.filter((h) => inLib(h) && h.token === t && !h.inCode).length }]));
  row('R8', 'census of the 48 sources and the root: no code occurrence of sorry, admit, axiom, native_decide, implemented_by, extern, unsafe, skipKernelTC, run_cmd, #eval, ofReduceBool, trustCompiler or addDecl; the frozen file has exactly one code `sorry` and nothing else of that list; the lakefile sets no Lean option', !gatingCode.length && frozenSorry === 1 && !frozenOther.length && !lakeOptions,
    { files: files.length, linesScanned: files.reduce((a, f) => a + repoFile(f).toString('utf8').split('\n').length, 0), tally, frozenCodeSorry: frozenSorry, lakefileSetsOptions: lakeOptions, preRegisteredTokens: PREREG });

  /* R9 the frozen target alone (F1) */
  const f1 = step('frozen-alone'), f1log = need('frozen-alone.log');
  row('R9', 'the frozen target elaborated alone (`lake env lean Frozen/BoundedIntegerPolynomial.lean`, the pinned bytes) exits 0 with exactly one "declaration uses `sorry`" warning and no error', f1 && f1.exit === 0 && sorryWarnings(f1log) === 1 && !errorLines(f1log).length && need('frozen.sha256').startsWith(PIN.frozen.sha256),
    { exit: f1 && f1.exit, seconds: f1 && f1.seconds, maxRssKiB: f1 && f1.maxRssKiB, sorryWarnings: sorryWarnings(f1log), warningAt: (f1log.match(/BoundedIntegerPolynomial\.lean:(\d+:\d+): warning/) || [])[1] });

  /* R10 the frozen target as a module, audited, with the tower theorem (F2) */
  const fb = step('frozen-build'), fa = step('frozen-audit'), fcopy = need('frozen-copy.txt');
  const FA = jsonl('frozen-audit.jsonl'), fdecl = FA.filter((x) => x.type === 'decl'), fsum = FA.find((x) => x.type === 'summary');
  const target = fdecl.find((d) => d.name === 'ZInQ.exists_bounded_integer_polynomial_defining_integers');
  const tc = target ? Object.fromEntries(target.typeConsts) : {};
  const falog = need('frozen-audit.log');
  const printed = [...falog.matchAll(/'(zq_[A-Za-z_]+)' depends on axioms: \[([^\]]*)\]/g)].map((m) => [m[1], m[2].split(',').map((s) => s.trim()).filter(Boolean)]);
  const addedLines = (fcopy.match(/^> .*$/gm) || []).map((l) => l.slice(2));
  const f2ok = fb && fb.exit === 0 && fa && fa.exit === 0 && fcopy.startsWith(PIN.frozen.sha256) && JSON.stringify(addedLines) === JSON.stringify(['', '[[lean_lib]]', 'name = "Frozen"', 'roots = ["Frozen.BoundedIntegerPolynomial"]'])
    && fdecl.length === 1 && target && target.ours.includes('sorryAx') && target.ours.every((a) => a === 'sorryAx' || ALLOWED.includes(a)) && JSON.stringify(target.ours) === JSON.stringify(target.lean)
    && tc.hyperoperation === 'Mathlib.Data.Nat.Hyperoperation' && tc.MvPolynomial === 'Mathlib.Algebra.MvPolynomial.Basic' && tc.Rat === 'Init.Data.Rat.Basic' && tc.Int === 'Init.Data.Int.Basic'
    && !target.typeConsts.some(([, m]) => m.startsWith('Frozen') || m.startsWith('ZInQ') || m.startsWith('('))
    && printed.length === 4 && printed.every(([, ax]) => subset(ax)) && /\(2, 4, 16\)/.test(falog);
  row('R10', 'the frozen target as its own module (their file byte-identical, one lean_lib added in a copy): one declaration, its axioms sorryAx plus standard ones only, its statement built from Mathlib\'s `hyperoperation` (Mathlib.Data.Nat.Hyperoperation), MvPolynomial, Rat, Int and nothing of the claimant\'s; in the same file our kernel-checked theorem ∀ k, hyperoperation 4 2 k = T k (T 0 = 1, T (k+1) = 2^(T k)) makes hyperoperation 4 2 7 = 2↑↑7 and 4 2 8 = 2↑↑8, and 4 2 1, 2, 3, 4 = 2, 4, 16, 65536 are decided', f2ok,
    { targetAxioms: target && target.ours, statementConstants: target && target.typeConsts.length, hyperoperationModule: tc.hyperoperation, ourTheoremsAxioms: Object.fromEntries(printed), evaluated: (falog.match(/\(2, 4, 16\)/) || [null])[0], frozenClosure: fsum && fsum.closure });

  /* R11-R14 the kernel replays; R15-R17 recorded */
  const replay = (s) => { const x = step(s); const log = fact(s + '.log') || ''; return Object.assign({}, x, { replayed: (log.match(/^replaying /gm) || []).length, logTail: log.trim().split('\n').slice(-2).join(' | ').slice(0, 300) }); };
  const lc = replay('leanchecker'), lcp = replay('leanchecker-paranoid'), fr = replay('fresh');
  row('R11', '`leanchecker ZInQ`: the 49 modules ZInQ, ZInQ.* replayed by the toolchain kernel onto their imports', lc.exit === 0 && lc.replayed === 49, lc, 'REFUTED');
  row('R12', '`leanchecker-paranoid ZInQ`: the same replay by the paranoid build', lcp.exit === 0 && lcp.replayed === 49, lcp, 'REFUTED');
  row('R13', '`leanchecker --fresh ZInQ`: every constant of the closure (core, Mathlib, the 48 modules) replayed into an empty environment', fr.exit === 0 && /replaying ZInQ with --fresh/.test(fact('fresh.log') || ''), fr, 'REFUTED');
  const nd = step('nanoda'), ndlog = fact('nanoda.log') || '', ndb = step('nanoda-bundled'), ndblog = fact('nanoda-bundled.log') || '';
  const nbuild = fact('nanoda-build.log') || '';
  const ndcfg = fact('nanoda.json') ? JSON.parse(fact('nanoda.json')) : {};
  const nanodaOk = !!nd && nd.exit === 0 && JSON.stringify(ndcfg.permitted_axioms) === JSON.stringify(['propext', 'Quot.sound', 'Classical.choice']) && ndcfg.stack_size_bytes === 1073741824 && nbuild.includes('version = "0.4.31"');
  row('R14', 'nanoda v0.4.31 (nanoda_lib ' + NANODA_PIN.slice(0, 8) + ', built on the pod, unmodified; 1 GiB worker stack) accepts the full-environment export of ZInQ with permitted axioms exactly propext, Quot.sound, Classical.choice', nanodaOk,
    Object.assign({}, nd, { rustc: (nbuild.match(/^rustc .*$/m) || [])[0], binarySha256: (nbuild.match(/^([0-9a-f]{64})\s+\S*nanoda_bin-0\.4\.31$/m) || [])[1], logTail: ndlog.trim().split('\n').slice(-2).join(' | ').slice(0, 300) }), nd && nd.exit !== 0 && /declaration|type mismatch|def_eq/i.test(ndlog) && !/overflow|out of memory/i.test(ndlog) ? 'REFUTED' : 'REFUSED');
  record('R15', 'the toolchain\'s bundled nanoda_bin 0.4.19 on the same export (no stack option)', ndb ? (ndb.exit === 0 ? 'accepted' : /overflowed its stack/.test(ndblog) ? 'a worker stack overflow (exit ' + ndb.exit + '): a tool limit, not a verdict input' : 'exit ' + ndb.exit) : 'not run', ndb || {});
  const l4 = step('lean4lean'), l4log = fact('lean4lean.log') || '';
  record('R16', 'lean4lean (bundled) on ZInQ, one try', l4 ? (/incompatible header/.test(l4log) ? 'cannot read the v4.35.0 .olean files ("incompatible header"), exit ' + l4.exit + ': not usable with this toolchain' : 'exit ' + l4.exit) : 'not run', l4 || {});
  const exp = fact('export.txt') || '';
  const ej = (() => { try { return JSON.parse(exp.split('\n').find((l) => l.startsWith('{'))); } catch (e) { return null; } })();
  record('R17', 'the full-environment export (`leanexport ZInQ`, lean4export 3.1.0) given to nanoda', 'exported', Object.assign({ sha256: (exp.match(/^([0-9a-f]{64})/) || [])[1], bytes: Number((exp.match(/^(\d+) bytes$/m) || [])[1]), lines: ej && ej.lines, declarationLines: ej && Object.fromEntries(['axiom', 'def', 'thm', 'opaque', 'quot', 'inductive'].map((k) => [k, ej.linesByFirstKey[k] || 0])) }, step('export') || {}));
  const atLeastOne = rows.find((r) => r.id === 'R13').verdict === 'CERTIFIED' || rows.find((r) => r.id === 'R14').verdict === 'CERTIFIED';
  if (nd && nd.exit !== 0) notes.push('nanoda v0.4.31 on the full export: ' + (/memory overflow/.test(ndlog) ? '"memory overflow" panics inside num-bigint\'s pow (its Nat extension computes a literal power without the exponent bound Lean\'s kernel applies), after ' + nd.seconds + ' s' : 'exit ' + nd.exit) + '; a tool limit under amendment A item 5, so R14 is REFUSED as a tool row and the replay requirement rests on R13 (amendment D).');

  /* R18 nanoda v0.4.31 module by module (amendment D), informational */
  const nmList = (fact('nanoda-modules/list.txt') || '').trim().split('\n').filter(Boolean);
  if (nmList.length) {
    const per = nmList.map((m) => {
      const log = fact('nanoda-modules/' + m + '.log') || '', ex = Number((fact('nanoda-modules/' + m + '.exit') || 'NaN').trim()), t = gnuTime(fact('nanoda-modules/' + m + '.time'));
      const panic = (log.match(/panicked at [^\n]*\n([^\n]*)/) || [])[1] || null;
      const outcome = ex === 0 ? 'accepted' : /memory overflow/.test(log) ? 'memory overflow (num-bigint pow)' : /overflowed its stack/.test(log) ? 'stack overflow' : 'exit ' + ex + (panic ? ': ' + panic.slice(0, 160) : '');
      return { module: m, names: Number((fact('nanoda-modules/' + m + '.names') || '').trim()), exportExit: Number((fact('nanoda-modules/' + m + '.export.exit') || 'NaN').trim()), exit: ex, outcome, wallSeconds: t.wallSeconds, maxRssKiB: t.maxRssKiB };
    });
    const byOutcome = countBy(per, (x) => x.outcome);
    const typeErrors = per.filter((x) => x.exit !== 0 && !/overflow/.test(x.outcome));
    record('R18', 'nanoda v0.4.31 on each module\'s closure of its non-private declarations (amendment D)', per.filter((x) => x.exit === 0).length + ' of ' + per.length + ' modules accepted by a second, independent kernel; the rest: ' + JSON.stringify(Object.fromEntries(Object.entries(byOutcome).filter(([k]) => k !== 'accepted'))), { byOutcome, notAccepted: per.filter((x) => x.exit !== 0).map((x) => ({ module: x.module, outcome: x.outcome })), perModule: per, needsInvestigation: typeErrors.map((x) => x.module) });
    if (typeErrors.length) notes.push('R18: nanoda panicked on ' + typeErrors.map((x) => x.module).join(', ') + ' with something other than an overflow; amendment D requires that to be investigated before any verdict.');
  }

  /* red controls: the planted variants (amendment A item 8, B, C item 1) and P5 */
  const leaf = need('planted-leaf.txt').trim(), P = plants();
  const pc = (id, name, prediction, test) => {
    const bld = step('planted-' + id + '-build'), log = fact('planted-' + id + '-build.log') || '';
    const pa = fact('planted-' + id + '-audit.jsonl') ? jsonl('planted-' + id + '-audit.jsonl') : [];
    const psum = pa.find((x) => x.type === 'summary') || {}, pdecl = pa.filter((x) => x.type === 'decl');
    const lck = step('planted-' + id + '-leanchecker'), lcklog = fact('planted-' + id + '-leanchecker.log') || '';
    const n2 = step('planted-' + id + '-nanoda'), n1 = step('planted-' + id + '-nanoda-bundled');
    const cen = census('plant ' + id, P[id] || '').filter((h) => h.inCode).map((h) => h.token);
    const o = { build: bld && bld.exit, newSorryWarnings: sorryWarnings(log), declarations: psum.declarations, flagged: (psum.nonstandard || []).map((x) => x.name + ' ' + JSON.stringify(x.axioms)), leanchecker: lck && lck.exit, leancheckerKernelError: /declaration type mismatch/.test(lcklog), nanoda: n2 && n2.exit, nanodaBundled: n1 && n1.exit, census: [...new Set(cen)].sort(), fallback: fact('planted-' + id + '.fallback') };
    const passed = !!bld && test(o, pdecl);
    return { id, mutation: name, module: o.fallback ? 'ZInQ.ZqPlantedP4' : leaf, prediction, outcome: o, passed };
  };
  const redControls = [
    pc('P1', 'theorem zq_planted_sorry : 2 + 2 = 5 := by sorry, appended to the leaf', 'build 0 with one new sorry warning; the audit flags sorryAx by both traversals; leanchecker 0; nanoda (both) refuse; the census sees sorry',
      (o, d) => o.build === 0 && o.newSorryWarnings === 1 && d.some((x) => x.name === 'zq_planted_sorry' && x.ours.includes('sorryAx') && x.lean.includes('sorryAx')) && o.leanchecker === 0 && o.nanoda !== 0 && o.nanodaBundled !== 0 && o.census.includes('sorry')),
    pc('P2', 'axiom zq_planted_axiom and a theorem using it, appended to the leaf', 'build 0; the audit lists the axiom (kind axiom) and flags both; leanchecker 0; nanoda (both) refuse; the census sees axiom',
      (o, d) => o.build === 0 && d.some((x) => x.name === 'zq_planted_axiom' && x.kind === 'axiom') && d.some((x) => x.name === 'zq_planted_uses_axiom' && x.ours.includes('zq_planted_axiom') && x.lean.includes('zq_planted_axiom')) && o.leanchecker === 0 && o.nanoda !== 0 && o.nanodaBundled !== 0 && o.census.includes('axiom')),
    pc('P3', 'theorem zq_planted_native : 2 + 2 = 4 := by native_decide, appended to the leaf', 'build 0; the audit lists the auxiliary native_decide axiom (kind axiom) and flags it and the theorem; leanchecker 0; nanoda (both) refuse; the census sees native_decide (amendment B)',
      (o, d) => o.build === 0 && d.some((x) => x.kind === 'axiom' && /zq_planted_native\._native\.native_decide\.ax_/.test(x.name)) && d.some((x) => x.name === 'zq_planted_native' && x.ours.some((a) => /native_decide\.ax_/.test(a)) && x.lean.some((a) => /native_decide\.ax_/.test(a))) && o.leanchecker === 0 && o.nanoda !== 0 && o.nanodaBundled !== 0 && o.census.includes('native_decide')),
    pc('P4', 'theorem zq_planted_unchecked : False := True.intro, added by run_cmd under set_option debug.skipKernelTC true', 'build 0; the audit sees NO axiom on it (its blind spot); leanchecker non-zero with a kernel type mismatch; nanoda (both) refuse; the census sees skipKernelTC, run_cmd, addDecl',
      (o, d) => o.build === 0 && d.some((x) => x.name === 'zq_planted_unchecked' && x.ours.length === 0 && x.lean.length === 0) && o.leanchecker !== 0 && o.leancheckerKernelError && o.nanoda !== 0 && o.nanodaBundled !== 0 && ['addDecl', 'run_cmd', 'skipKernelTC'].every((t) => o.census.includes(t))),
    { id: 'P5', mutation: 'one byte appended to ' + p5file + ' (in memory, on the desk)', module: null, prediction: 'the re-hash of R2 flags exactly that file', outcome: { flagged: p5flag }, passed: p5flag.length === 1 && p5flag[0] === p5file },
  ];
  const controlsOk = redControls.every((c) => c.passed);
  notes.push('P4\'s census check failed on this recorder\'s first run: the census token boundary excluded a preceding ".", so `debug.skipKernelTC` was not seen. The boundary was fixed (amendment E) and the census re-run over every file; the claimant\'s sources gave the same code hits before and after.');

  /* their VALIDATION.json, compared */
  const validationComparison = [
    { field: 'toolchain', theirs: validation.toolchain, ours: (env.match(/^lean: (.*)$/m) || [])[1], agrees: validation.toolchain.includes('commit ' + TOOLCHAIN.commit) && env.includes('commit ' + TOOLCHAIN.commit), note: 'same Lean commit; theirs Windows, ours Linux' },
    { field: 'dependency_pins', theirs: validation.dependency_pins.length + ' revisions', ours: deps.length + ' checkouts', agrees: valDepsAgree },
    { field: 'source_manifest_sha256', theirs: validation.source_manifest_sha256, ours: rh.files[PIN.sourceManifest.path], agrees: validation.source_manifest_sha256 === rh.files[PIN.sourceManifest.path] },
    { field: 'project_modules_freshly_compiled', theirs: validation.project_modules_freshly_compiled, ours: built.length - 1, agrees: validation.project_modules_freshly_compiled === built.length - 1 },
    { field: 'root_compiled', theirs: validation.root_compiled, ours: built.includes('ZInQ'), agrees: validation.root_compiled === built.includes('ZInQ') },
    { field: 'declarations_axiom_checked', theirs: validation.declarations_axiom_checked, ours: decls.length, agrees: false, note: 'not a contradiction: ours adds the ' + extras.length + ' private theorems a module-system importer does not see (R7, X1); their 704 are all among ours' },
    { field: 'allowed_axioms', theirs: validation.allowed_axioms, ours: ALLOWED, agrees: validation.allowed_axioms.slice().sort().join() === ALLOWED.join() },
    { field: 'main_theorem_proved', theirs: validation.main_theorem_proved, ours: false, agrees: validation.main_theorem_proved === false, note: 'the frozen target is sorry (R9, R10)' },
    { field: 'quarantined_target_compiled', theirs: validation.quarantined_target_compiled, ours: true, agrees: false, note: 'they did not compile it; we did (R9, R10): it elaborates with its one sorry' },
    { field: 'seconds', theirs: validation.seconds, ours: b && b.seconds, agrees: null, note: 'their whole check on Windows with 2 jobs; ours is `lake build ZInQ` alone on 16 vCPU' },
  ];

  /* the verdict, as pre-registered */
  const g = (id) => rows.find((r) => r.id === id).verdict;
  let verdict, reason;
  if (['R1', 'R2', 'R3'].some((id) => g(id) !== 'CERTIFIED')) { verdict = 'REFUSED'; reason = 'the pinned sources or toolchain were not reproduced'; }
  else if (['R4', 'R5', 'R6', 'R11', 'R12', 'R13', 'R14'].some((id) => g(id) === 'REFUTED')) { verdict = 'REFUTED'; reason = 'a module fails in the kernel or a further axiom appears: ' + rows.filter((r) => r.verdict === 'REFUTED').map((r) => r.id).join(', '); }
  else if (!controlsOk) { verdict = 'REFUSED'; reason = 'a red control did not come out as predicted: ' + redControls.filter((c) => !c.passed).map((c) => c.id).join(', '); }
  else if (!atLeastOne) { verdict = 'REFUSED'; reason = 'neither leanchecker --fresh nor nanoda finished accepting'; }
  else if (rows.some((r) => r.verdict !== 'CERTIFIED' && !(r.id === 'R14' && atLeastOne))) { verdict = 'REFUSED'; reason = 'rows not certified: ' + rows.filter((r) => r.verdict !== 'CERTIFIED').map((r) => r.id).join(', '); }
  else if (notes.some((n) => n.startsWith('R18:'))) { verdict = 'REFUSED'; reason = 'a nanoda panic other than an overflow awaits investigation (amendment D)'; }
  else { verdict = 'CERTIFIED'; reason = 'every row and every red control as pre-registered' + (g('R14') !== 'CERTIFIED' ? '; the nanoda row is REFUSED as a tool limit and the replay requirement rests on leanchecker --fresh (amendment A item 5, D)' : ''); }

  const status = need('_status.txt').trim().split('\n');
  return {
    what: 'Track A lane 4 on the claim "Z is Diophantine in Q" (Elliot Glazer with AI agents, announced 2026-11-05): the kernel replay of the 48 accepted Lean helper modules (integration 31) on Lean 4.35.0 with Mathlib v4.35.0, our own axiom audit of every declaration, three replays by the toolchain kernel and one by nanoda, the reconciliation with their 704-declaration ledger, a census, the frozen target elaborated, and planted variants that must fail.',
    undecided: UNDECIDED,
    generated: new Date().toISOString().slice(0, 10),
    preregistration: 'notes/zq-preregistration-2026-11-06.md (lane 4; amendments A and B before any run, C after a first pass and before the recorded one, D during it before the step it adds, E on the desk for the recorder)',
    pins: PIN,
    code: Object.assign({ 'tools/record-zq-lean-replay.js': sha(fs.readFileSync(__filename)) }, Object.fromEntries(Object.values(OURS).map((p) => [p, sha(fs.readFileSync(path.join(ROOT, p)))]))),
    run: { facts: path.relative(ROOT, RUN), pod: 'RunPod CPU pod, 16 vCPU, 128 GB cgroup (shared with another agent\'s build), /root/zq-lane4/final', firstStatus: status[0], lastStatus: status[status.length - 1], firstPass: 'a first pass of an earlier script (482089e3…) ran 02:21-02:33 UTC; nothing of it is imported (amendment C)' },
    verdict,
    verdictScope: 'the 48 helper modules check in the kernel with only propext, Quot.sound and Classical.choice; our ' + decls.length + ' declarations reconcile with their 704; the frozen statement elaborates with exactly its one sorry. The theorem itself: undecided here.',
    verdictReason: reason,
    rows, recorded: info, redControls, validationComparison,
    census: { tally, hits: hits.filter((h) => h.inCode || GATING.includes(h.token)).map((h) => ({ file: h.file, line: h.line, token: h.token, inCode: h.inCode })), allHits: hits.length },
    notes,
  };
}

if (process.argv.includes('--reduce-exported')) {
  /* run once at import: exported-audit.jsonl (the exported view, X1) is kept as names, kinds and Lean's axiom sets */
  const src = path.join(RUN, 'exported-audit.jsonl'), raw = fs.readFileSync(src);
  const rows = raw.toString('utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l)), s = rows.find((x) => x.type === 'summary');
  const reduced = { source: 'exported-audit.jsonl', sha256: sha(raw), bytes: raw.length,
    summary: { declarations: s.declarations, kinds: s.kinds, modules: s.modules, unionLean: s.unionLean, axiomsInClosure: s.axiomsInClosure.length, nonstandard: s.nonstandard.length, traversalDisagreements: s.traversalDisagreements.length },
    decls: rows.filter((x) => x.type === 'decl').map((d) => ({ name: d.name, module: d.module, kind: d.kind, lean: d.lean })) };
  fs.writeFileSync(path.join(RUN, 'exported-audit.reduced.json'), JSON.stringify(reduced, null, 1) + '\n');
  fs.unlinkSync(src);
  console.log('zq-lean-replay: exported-audit.jsonl (' + raw.length + ' bytes) reduced to ' + reduced.decls.length + ' declarations');
  process.exit(0);
}
const L = build();
const strip = (x) => JSON.stringify(Object.assign({}, x, { generated: null }));
if (process.argv.includes('--check')) {
  if (!fs.existsSync(OUT)) die('no record to check');
  if (strip(JSON.parse(fs.readFileSync(OUT, 'utf8'))) !== strip(L)) die('certs/zq-lean-replay.json is not what the imported facts, the pinned clone and this code give now');
  console.log('zq-lean-replay: re-derived, identical · ' + L.verdict + ' (' + L.verdictScope.split(';')[0] + ')');
} else {
  fs.writeFileSync(OUT, JSON.stringify(L, null, 1) + '\n');
  console.log('zq-lean-replay: ' + L.verdict + ' · ' + L.rows.map((r) => r.id + ' ' + (r.verdict === 'CERTIFIED' ? 'ok' : r.verdict)).join(' ') + ' · controls ' + L.redControls.map((c) => c.id + (c.passed ? ' ok' : ' FAILS')).join(' ') + ' · ' + L.verdictReason);
}
