#!/usr/bin/env node
/* record-zq-trackb.js — the Track B decision on the claim "Z is Diophantine in Q" (Elliot Glazer with AI agents,
   2026-11-05): claimbox's conditional theorem at 125509a1 (lean/zinq), built and checked on a RunPod CPU pod by
   tools/runpod-zq-trackb.sh. Writes certs/zq-trackb.json; `--check` re-derives it and refuses on any difference.

   THE THEOREM IS UNDECIDED HERE. This record decides that Glazer's frozen statement follows in Lean from eight named
   hypotheses (and from nine), that G holds and what G says; it does not decide that any of the eight is true, nor that
   it says what the manuscript's premise says. If one is false, the conditional theorem is vacuous.

   INPUTS. (1) The pod's facts, imported verbatim into corpus/zq/runs/trackb-2026-11-06/ from /root/zq-trackb/final/out:
   exit codes, logs, GNU time, our checks' and our audit's JSON lines, sha256s. (2) The pinned TeX of the read-only
   clone at ~/Projects/zq-scout/diophantine-z-q (ZQ_REPO), sha256-checked before use: the manuscript's d and P_0, which
   B5(d) compares with the rationals Lean computed. (3) Our pod-side files: each step recorded their sha256 (.code); a
   step whose files differ from the ones in tools/ now refuses the record. Nothing of claimbox is read here.

   RULES: notes/zq-trackb-preregistration-2026-11-06.md. Verdict words exactly as pre-registered: CERTIFIED, REFUTED,
   REFUSED.

   IMPORT (once, after the pod run): ssh … 'tar -C /root/zq-trackb/final/out -czf - .' | tar -xzf - -C <RUN>, then this
   tool.

   usage: node tools/record-zq-trackb.js [--check] */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const REPO = process.env.ZQ_REPO || path.join(os.homedir(), 'Projects', 'zq-scout', 'diophantine-z-q');
const RUN = process.env.ZQ_TRACKB_RUN || path.join(ROOT, 'corpus', 'zq', 'runs', 'trackb-2026-11-06');
const OUT = path.join(ROOT, 'certs', 'zq-trackb.json');
const die = (m) => { console.error('zq-trackb: ' + m); process.exit(1); };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const PIN = {
  claimbox: { repository: 'github.com/carlostoledo1891/claimbox', commit: '125509a1fbb307ed4b80faef216b701a9165ccf2', branch: 'zinq-2026-11-06', folder: 'lean/zinq', tree: 'bf5111756795bbdb47935e2981f5d62414821a8a', files: 23, transfer: 'a git bundle (the branch was not public at the decision); the commit id pins the tree' },
  glazer: { repository: 'github.com/elliotglazer/diophantine-z-q', commit: '97cec7fdd757d9a8e4f468151a47a6d3610fb2f2', subDir: 'lean' },
  frozen: { path: 'lean/Frozen/BoundedIntegerPolynomial.lean', sha256: '0889579ae56e75eca811af520eb4e18c9f697e163db408771b93fdbc651a95b9', constant: 'ZInQ.exists_bounded_integer_polynomial_defining_integers' },
  tex: { path: 'diophantine_zq.tex', sha256: 'cb1148cd6c7769d2af3f1636b60ff0ada4b40431978d1e98d0c339274b3d792b' },
  mathlib: '56a005855ea17e0b0958f73ec801ae140b0a1679',
};
const TOOLCHAIN = { version: '4.35.0', commit: 'eb6cafb7290e8bd5f2937522d8d804f58f02bafc', file: 'leanprover/lean4:v4.35.0' };
const NANODA_PIN = '8de7e0c4ed3052745a7f8725164efd9e76d84c56';
const CONRON_PIN = '97eead2d5b496f1017da5d11fe08bb1cb328eb7d';
const CONLECHE_PIN = 'dc8ca857d6de080cb29906c8ab10b10f837c369d';
const ALLOWED = ['Classical.choice', 'Quot.sound', 'propext'];
const T8 = 'CondZQ.exists_bounded_integer_polynomial_defining_integers_of_eight_hypotheses';
const T9 = 'CondZQ.exists_bounded_integer_polynomial_defining_integers_of_hypotheses';
const G = 'CondZQ.hypG_holds';
const HYPS8 = ['CondZQ.HypM', 'CondZQ.HypH', 'CondZQ.HypPC', 'CondZQ.HypC', 'CondZQ.HypLT', 'CondZQ.HypCC', 'CondZQ.HypH1', 'CondZQ.HypH2'];
const OURTHMS = ['CertMachineZQ.trackB_eight', 'CertMachineZQ.trackB_nine', 'CertMachineZQ.trackB_G', 'CertMachineZQ.trackB_G_infinite'];
const UNDECIDED = 'The theorem (Z is Diophantine in Q) is undecided here. This decides that Glazer\'s frozen statement follows in Lean from eight named hypotheses; it does not decide that any of them is true, nor that they say what the manuscript\'s premises say. If one is false, the conditional theorem is vacuous.';
const NOT_DECIDED = [
  'the theorem: Z Diophantine in Q is not decided by anything here',
  'each of the eight hypotheses that remain (M, H, PC, C, LT, CC, H1, H2): whether it is true, and whether it says what the manuscript\'s premise says, is a reading recorded beside it, not a decision',
  'their joint consistency: if they cannot all hold, the conditional theorem is vacuous',
  'that the polynomial T8 asserts is Glazer\'s saved P_* (the frozen statement is existential in P)',
  'claimbox and cert-machine have the same operator: this decision separates the roles of author and checker; it is not a second party',
];
const OURS = { script: 'tools/runpod-zq-trackb.sh', audit: 'tools/zq-lean-audit.lean', statement: 'tools/zq-trackb-statement.lean', check: 'tools/zq-trackb-check.lean', plants: 'tools/zq-trackb-plants.txt' };

/* ---- the read-only clone (the TeX only) ---- */
const readPinned = (pin) => { const p = path.join(REPO, pin.path); if (!fs.existsSync(p)) die('the claimant clone is not at ' + REPO + ' (set ZQ_REPO); refusing'); const b = fs.readFileSync(p); if (sha(b) !== pin.sha256) die(pin.path + ' is not the pinned bytes; REFUSED, nothing computed'); return b; };

/* ---- the pod's facts ---- */
const fact = (name) => { const p = path.join(RUN, name); return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null; };
/* amendment C: the screens (B5(c), Q2's half) come from a supplement run with the corrected check file */
const SUP = path.join(RUN, 'screen-supplement');
const CHECK_RECORDED = 'fd34b9bd24fe90af6d426a4e5218be1f751ae8cc4af11b4da3122edd5703ac49';   /* zq-trackb-check.lean as the recorded pass ran it */
const supFact = (name) => { const p = path.join(SUP, name); return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null; };
const supJsonl = (name) => { const t = supFact(name); if (t === null) die('missing supplement fact ' + name); return t.split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l)); };
const need = (name) => { const t = fact(name); if (t === null) die('missing fact ' + name + ' in ' + path.relative(ROOT, RUN)); return t; };
const exitOf = (s) => { const t = fact(s + '.exit'); return t === null ? null : Number(t.trim()); };
const gnuTime = (t) => {
  if (!t) return {};
  const m = (re) => { const x = t.match(re); return x ? x[1].trim() : null; };
  const el = m(/Elapsed \(wall clock\) time \(h:mm:ss or m:ss\): (\S+)/);
  let wall = null;
  if (el) { const parts = el.split(':').map(Number); wall = Math.round(parts.reduce((a, b) => a * 60 + b, 0) * 100) / 100; }
  const rss = m(/Maximum resident set size \(kbytes\): (\d+)/);
  return { wallSeconds: wall, maxRssKiB: rss === null ? null : Number(rss) };
};
const step = (s) => {
  const e = exitOf(s); if (e === null) return null;
  const a = fact(s + '.start'), b = fact(s + '.end');
  return Object.assign({ step: s, exit: e, seconds: a && b ? Number(b) - Number(a) : null }, gnuTime(fact(s + '.time')));
};
const countBy = (xs, f) => { const m = new Map(); for (const x of xs) m.set(f(x), (m.get(f(x)) || 0) + 1); return Object.fromEntries([...m].sort((a, b) => (a[0] < b[0] ? -1 : 1))); };
const jsonl = (name) => need(name).split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
const lines = (t) => (t || '').split('\n');
const sorryWarnings = (t) => (t.match(/declaration uses `sorry`/g) || []).length;
const errorLines = (t) => lines(t).filter((l) => /(^|: )error(\(|:)/.test(l));
const tail = (t, n = 2) => (t || '').trim().split('\n').slice(-n).join(' | ').slice(0, 300);
const subset = (xs) => xs.every((a) => ALLOWED.includes(a));

/* ---- exact rationals for B5(d): the manuscript's numbers in the basis 1, s ---- */
const bgcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
const rat = (n, d = 1n) => { if (d < 0n) { n = -n; d = -d; } const g = bgcd(n, d) || 1n; return { num: String(n / g), den: String(d / g) }; };
function texModel(tex) {
  const s = tex.toString('utf8'), at = s.indexOf('\\section{The elliptic model of integer indices}\\label{sec:model}');
  if (at < 0) die('sec:model not found in the pinned TeX');
  const body = s.slice(at, at + 1200), line = s.slice(0, at).split('\n').length;
  const dm = body.match(/s\^2=2,\\quad d=(-?\d+)([+-]\d+)s,\\quad E:y\^2=x\^3-d\^2x,/);
  const pm = body.match(/P_0=\\left\(\\frac\{(-?\d+)([+-]\d+)s\}\{(\d+)\},\\frac\{(-?\d+)([+-]\d+)s\}\{(\d+)\}\\right\)/);
  if (!dm || !pm) die('the model line (d, E, P_0) is not in the shape this reader knows; REFUSED');
  const B = (x) => BigInt(x);
  return {
    sectionLine: line, text: { d: dm[1] + dm[2] + 's', P0x: '(' + pm[1] + pm[2] + 's)/' + pm[3], P0y: '(' + pm[4] + pm[5] + 's)/' + pm[6] },
    dco: [rat(B(dm[1])), rat(B(dm[2]))],
    P0x: [rat(B(pm[1]), B(pm[3])), rat(B(pm[2]), B(pm[3]))],
    P0y: [rat(B(pm[4]), B(pm[6])), rat(B(pm[5]), B(pm[6]))],
  };
}

function build() {
  const rows = [], info = [], notes = [];
  const row = (id, statement, ok, numbers = {}, onFail = 'REFUSED') => { rows.push({ id, statement, verdict: ok ? 'CERTIFIED' : onFail, numbers }); return ok; };
  const record = (id, statement, outcome, numbers = {}) => info.push({ id, statement, outcome, numbers });

  /* our files: every step's recorded sha256s against tools/ now */
  const cur = Object.fromEntries(Object.values(OURS).map((p) => [path.basename(p), sha(fs.readFileSync(path.join(ROOT, p)))]));
  /* the recorded pass ran every file as tools/ holds it now except the check file (CHECK_RECORDED, amendment C); the
     supplement ran every file as tools/ holds it now */
  const codeCheck = (dir, ran, label) => {
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.code'));
    if (!files.length) die('no .code facts in ' + label);
    for (const f of files) {
      for (const [h, n] of ran(f).trim().split('\n').map((l) => l.trim().split(/\s+/))) {
        if (!(n in cur)) die(label + ' step ' + f.slice(0, -5) + ' lists ' + n + ', not one of our files');
        const want = label === 'the recorded pass' && n === 'zq-trackb-check.lean' ? CHECK_RECORDED : cur[n];
        if (h !== want) die(label + ' step ' + f.slice(0, -5) + ' ran ' + n + ' ' + h.slice(0, 12) + '…, not ' + want.slice(0, 12) + '…: the record is not what these files give; REFUSED');
      }
    }
    return files.length;
  };
  const stepsRecorded = codeCheck(RUN, need, 'the recorded pass');
  const stepsSupplement = codeCheck(SUP, (f) => supFact(f), 'the supplement');

  /* B1 the source at its pins */
  const fe = step('fetch'), felog = lines(fact('fetch.log')).filter(Boolean);
  const rh = JSON.parse(need('rehash.json'));
  const fileNames = Object.keys(rh.files).sort();
  const mf = JSON.parse(need('lake-manifest.json'));
  const want = Object.fromEntries(mf.packages.map((p) => [p.name, p.rev]));
  const deps = need('deps.txt').trim().split('\n').map((l) => l.trim().split(/\s+/));
  const depsOk = deps.length === mf.packages.length && deps.every(([n, r, dirty]) => want[n] === r && dirty === '0');
  const frozenSha = (need('frozen.sha256').match(/^([0-9a-f]{64})/) || [])[1];
  const headLine = felog.find((l) => l.startsWith(PIN.claimbox.commit + ' ')) || '';
  row('B1', 'the source at its pins: claimbox ' + PIN.claimbox.commit.slice(0, 8) + ' from the bundle with lean/zinq at tree ' + PIN.claimbox.tree.slice(0, 8) + ' and a clean checkout (' + PIN.claimbox.files + ' files, each hashed); the committed lake-manifest (no `lake update`) pins Glazer\'s repository at ' + PIN.glazer.commit.slice(0, 8) + ' and Mathlib at ' + PIN.mathlib.slice(0, 8) + '; every dependency checkout is at its manifest revision with clean tracked sources; Glazer\'s frozen file hashes to its pin',
    !!fe && fe.exit === 0 && !!headLine && felog.includes(PIN.claimbox.tree) && felog[felog.length - 1] === '0' && fileNames.length === PIN.claimbox.files
      && want.z_in_q === PIN.glazer.commit && want.mathlib === PIN.mathlib && mf.packages.find((p) => p.name === 'z_in_q').subDir === 'lean' && depsOk && frozenSha === PIN.frozen.sha256 && step('cache').exit === 0,
    { commit: headLine.split(' ').slice(0, 2).join(' '), bundleSha256: (felog[0] || '').split(/\s+/)[0], files: rh.files, dependencies: Object.fromEntries(deps.map(([n, r]) => [n, r])), frozenSha256: frozenSha });

  /* B2 the toolchain */
  const env = need('env.txt');
  const toolSha = Object.fromEntries((env.match(/^[0-9a-f]{64}  \S+$/gm) || []).map((l) => l.split(/\s+/).reverse()));
  row('B2', 'the pinned toolchain: Lean ' + TOOLCHAIN.version + ' at commit ' + TOOLCHAIN.commit.slice(0, 8) + ' (elan\'s ' + TOOLCHAIN.file + ', the toolchain of Track A lane 4), each tool recorded by sha256',
    env.includes('toolchain file: ' + TOOLCHAIN.file) && env.includes('Lean (version ' + TOOLCHAIN.version + ', x86_64-unknown-linux-gnu, commit ' + TOOLCHAIN.commit),
    { lean: (env.match(/^lean: (.*)$/m) || [])[1], platform: (env.match(/^kernel: (.*)$/m) || [])[1], nproc: Number((env.match(/^nproc: (\d+)/m) || [])[1]), toolSha256: toolSha });

  /* B3 the build */
  const b = step('build'), blog = need('build.log');
  const sorryAt = [...blog.matchAll(/([^\s:]+\.lean):(\d+:\d+): declaration uses `sorry`/g)].map((m) => m[1] + ':' + m[2]);
  const built = [...new Set((blog.match(/Built (CondZQ(?:\.[A-Za-z0-9_]+)?) /g) || []).map((x) => x.slice(6, -1)))].sort();
  row('B3', '`lake build CondZQ Frozen` exits 0 with no error, and its one "declaration uses `sorry`" warning is the frozen file\'s',
    !!b && b.exit === 0 && !errorLines(blog).length && sorryWarnings(blog) === 1 && sorryAt.length === 1 && /Frozen\/BoundedIntegerPolynomial\.lean$/.test(sorryAt[0].split(':')[0]) && /Build completed successfully/.test(blog),
    { exit: b && b.exit, seconds: b && b.seconds, maxRssKiB: b && b.maxRssKiB, sorryWarningAt: sorryAt, projectModulesBuilt: built.length, oleans: need('build-oleans.sha256').trim().split('\n').length }, 'REFUTED');

  /* B3' each source alone, with the kernel flag written out */
  const list = need('modules/list.txt').trim().split('\n');
  const per = list.map((p) => { const m = p.replace(/\//g, '_'); const t = gnuTime(fact('modules/' + m + '.time')); const log = fact('modules/' + m + '.log') || ''; return { path: p, exit: Number((fact('modules/' + m + '.exit') || '').trim()), errors: errorLines(log).length, sorry: sorryWarnings(log), wall: t.wallSeconds, rss: t.maxRssKiB }; });
  row('B3m', 'each of the ten sources (CondZQ.lean, CondZQ/*.lean) re-elaborated alone with `lake env lean -Ddebug.skipKernelTC=false` exits 0 with no error and no `sorry` warning',
    list.length === 10 && per.every((x) => x.exit === 0 && x.errors === 0 && x.sorry === 0),
    { sources: list, failing: per.filter((x) => x.exit !== 0 || x.errors || x.sorry).map((x) => x.path), maxWallSeconds: Math.max(...per.map((x) => x.wall)), maxRssKiB: Math.max(...per.map((x) => x.rss)) }, 'REFUTED');

  /* B4 our axiom audit of claimbox's modules */
  const auditOf = (name) => {
    const A = jsonl(name), sum = A.find((x) => x.type === 'summary') || {}, decls = A.filter((x) => x.type === 'decl');
    const flag = (f) => decls.filter((d) => d.flags.includes(f));
    return { A, sum, decls, flag };
  };
  const au = step('audit'), AU = auditOf('audit.jsonl');
  const partials = AU.decls.filter((d) => d.flags.includes('partial') || d.flags.includes('unsafe'));
  const auditOk = !!au && au.exit === 0 && AU.sum.lean === TOOLCHAIN.version && AU.sum.githash === TOOLCHAIN.commit && AU.sum.skipKernelTCDefault === false && AU.sum.modules === 10
    && AU.sum.declarations === AU.decls.length && AU.sum.missingReferences.length === 0 && AU.sum.nonstandard.length === 0 && subset(AU.sum.unionOurs) && subset(AU.sum.unionLean)
    && AU.decls.every((d) => d.kind !== 'axiom' && subset(d.ours) && subset(d.lean)) && !AU.flag('implementedBy').length && !AU.flag('extern').length
    && partials.every((d) => /\._unsafe_rec$/.test(d.name)) && [T8, T9, G].every((n) => AU.decls.some((d) => d.name === n && d.kind === 'theorem'));
  row('B4', 'our audit (tools/zq-lean-audit.lean, Track A lane 4\'s): every declaration of claimbox\'s ten CondZQ modules, selected by defining module, reaches only propext, Quot.sound and Classical.choice, by our fresh traversal AND by Lean.collectAxioms; no declaration of kind axiom; no implemented_by or extern; T8, T9 and G among them as theorems', auditOk,
    { exit: au && au.exit, seconds: au && au.seconds, maxRssKiB: au && au.maxRssKiB, declarations: AU.decls.length, kinds: AU.sum.kinds, perModule: AU.sum.perModule, closureConstants: AU.sum.closure, axiomsInClosure: AU.sum.axiomsInClosure, partialOrUnsafe: partials.map((d) => d.name), traversalDisagreements: (AU.sum.traversalDisagreements || []).length,
      targets: Object.fromEntries([T8, T9, G].map((n) => { const d = AU.decls.find((x) => x.name === n) || {}; return [n, { ours: d.ours, lean: d.lean }]; })) }, 'REFUTED');
  if ((AU.sum.traversalDisagreements || []).length) notes.push('Our traversal and Lean.collectAxioms differ on ' + AU.sum.traversalDisagreements.length + ' CondZQ declaration(s), every difference inside the three standard axioms: ' + AU.sum.traversalDisagreements.map((d) => d.name).join(', ') + '.');

  /* B5 our statement module */
  const sb = step('statement-build'), sa = step('statement-audit'), SA = auditOf('statement-audit.jsonl');
  const copyTxt = need('copy.txt');
  const added = (copyTxt.match(/^> .*$/gm) || []).map((l) => l.slice(2));
  const ourDecls = SA.decls.map((d) => d.name).sort();
  const stmtOk = !!sb && sb.exit === 0 && !!sa && sa.exit === 0 && JSON.stringify(ourDecls) === JSON.stringify(OURTHMS.slice().sort())
    && SA.decls.every((d) => d.kind === 'theorem' && subset(d.ours) && subset(d.lean) && !d.ours.includes('sorryAx'))
    && copyTxt.includes(cur['zq-trackb-statement.lean'] + '  CertMachineZQ.lean')
    && JSON.stringify(added) === JSON.stringify(['', '[[lean_lib]]', 'name = "CertMachineZQ"', 'roots = ["CertMachineZQ"]', '', '[[lean_lib]]', 'name = "CertMachineZQPlant"', 'globs = ["CertMachineZQPlant.+"]']);
  row('B5', 'our statement module (tools/zq-trackb-statement.lean as lean_lib CertMachineZQ in a copy whose lakefile gains only our two lean_libs): our four theorems, the conclusion Glazer\'s statement by `type_of%`, proved by T8, T9, G and Mathlib\'s addOrderOf_eq_zero_iff, build and reach only the three standard axioms by both traversals (the frozen theorem\'s `sorry` is not used)', stmtOk,
    { build: sb && sb.exit, seconds: sb && sb.seconds, declarations: Object.fromEntries(SA.decls.map((d) => [d.name, { ours: d.ours, lean: d.lean }])), lakefileAdded: added }, 'REFUTED');

  /* B6 our checks: (a) the targets, (b) F, (c) the screens */
  /* B6 from the supplement (amendment C); its target, F and G lines must equal the recorded pass's */
  const CK0 = jsonl('check.jsonl'), CK = supJsonl('check.jsonl');
  const ck = (() => { const e = Number((supFact('check.exit') || 'NaN').trim()); return { exit: e }; })();
  const same = (A, B, t) => JSON.stringify(A.filter((x) => x.type === t)) === JSON.stringify(B.filter((x) => x.type === t));
  const supplementAgrees = ['target', 'frozen', 'gMeaning'].every((t) => same(CK0, CK, t));
  if (!supplementAgrees) die('the supplement\'s target, F or G lines differ from the recorded pass\'s: it changed more than the screens; REFUSED');
  const F = CK.find((x) => x.type === 'frozen') || {};
  const target = (n) => CK.find((x) => x.type === 'target' && x.name === n) || {};
  const screens = CK.filter((x) => x.type === 'screen');
  const tOk = (t, mode) => t.found === true && t.kind === 'theorem' && t.levelParams === 0 && t.mode === mode && t.domainsOk === true && t.bodyClosed === true && t.conclusionEqv === true && t.pass === true
    && JSON.stringify(t.expected) === JSON.stringify(mode === '9' ? ['CondZQ.HypG', ...HYPS8] : mode === '8' ? HYPS8 : []);
  const fOk = F.pass === true && F.module === 'Frozen.BoundedIntegerPolynomial' && F.kind === 'theorem' && F.localConstants.length === 0 && F.leanAxioms.includes('sorryAx');
  row('B6b', 'F, the frozen theorem\'s type (module Frozen.BoundedIntegerPolynomial, its value `sorry`), is built from constants none of which is defined in a claimbox or cert-machine module', !!ck && ck.exit === 0 && fOk,
    { constants: F.constants && F.constants.length, byModuleRoot: F.constants && countBy(F.constants, (c) => c[1].split('.')[0]), frozenAxioms: F.leanAxioms, hash: F.hash }, 'REFUTED');
  const screened = screens.map((s) => s.name).sort();
  const screenOk = JSON.stringify(screened) === JSON.stringify(['CondZQ.HypG', ...HYPS8].sort()) && screens.every((s) => s.found && !s.flagged && s.kind === 'def' && s.isProp && !s.valueIsFalse && !s.containsF.length && !s.mentionsFrozen.length);
  row('B6c', 'the screen of the nine hypotheses (not a decision of their meaning): each a definition of type Prop, not False; neither its value nor any claimbox definition it reaches contains F or mentions the frozen theorem', !!ck && ck.exit === 0 && screenOk,
    { hypotheses: Object.fromEntries(screens.map((s) => [s.name, { reachedDefinitions: s.reachedDefinitions, flagged: s.flagged, valueConstantsByModuleRoot: s.valueConstants && Object.fromEntries(Object.entries(s.valueConstants).map(([k, v]) => [k, v.length])) }])) });
  const tRow = (id, n, mode, statement) => {
    const t = target(n);
    return row(id, statement, !!ck && ck.exit === 0 && tOk(t, mode) && fOk,
      { name: n, binders: t.binders, domains: t.domains, conclusionEqv: t.conclusionEqv, conclusionEqual: t.conclusionEqual, conclusionHash: t.conclusionHash, goalHash: t.goalHash, leanAxioms: t.leanAxioms }, 'REFUTED');
  };
  tRow('B6a8', T8, '8', 'T8\'s type is exactly HypM → HypH → HypPC → HypC → HypLT → HypCC → HypH1 → HypH2 → F: eight binders whose domains are those constants in that order, then a closed body alpha-equivalent to F');
  tRow('B6a9', T9, '9', 'T9\'s type is exactly HypG → HypM → … → HypH2 → F, the same check with HypG first');
  tRow('B6aG', G, 'G', 'G\'s type is exactly the constant CondZQ.HypG');
  const oursAll = ['CertMachineZQ.trackB_eight:8', 'CertMachineZQ.trackB_nine:9', 'CertMachineZQ.trackB_G:G'].every((x) => { const [n, m] = x.split(':'); return tOk(target(n), m); });

  /* B6d what G says */
  const gm = CK.find((x) => x.type === 'gMeaning') || {};
  const tex = texModel(readPinned(PIN.tex));
  const sameRat = (a, b) => a.length === 2 && a.every((q, i) => q.num === b[i].num && q.den === b[i].den);
  const lean6 = gm.rationals || {};
  const nums = ['dco', 'P0x', 'P0y'].map((k) => ({ name: k, lean: lean6[k], manuscript: tex[k], equal: !!lean6[k] && sameRat(lean6[k], tex[k]) }));
  /* amendment A: alpha-equivalence after each auxiliary proof constant is replaced by its statement; plain eqv recorded */
  const structOk = ['HypG', 'Pt', 'E', 'K0'].every((k) => gm[k] && gm[k].found && gm[k].eqvUpToAuxProofNames === true) && gm.P0 && gm.P0.typeIsPt && gm.P0.isPointSome && gm.P0.argsAreP0xP0y;
  row('B6d', 'what G says: HypG is alpha-equivalent to our `addOrderOf CondZQ.P0 = 0`; P0 is Point.some of P0x, P0y on CondZQ.Pt; Pt, E and K0 are alpha-equivalent to our `E.toAffine.Point`, `{ a₁ := 0, a₂ := 0, a₃ := 0, a₄ := -(dco * dco), a₆ := 0 }` and `QuadraticAlgebra ℚ 2 0` (s² = 2); the six rationals of dco, P0x, P0y computed by Lean equal the manuscript\'s d = ' + tex.text.d + ', P_0 = (' + tex.text.P0x + ', ' + tex.text.P0y + ') (TeX sec:model, line ' + tex.sectionLine + ')',
    !!ck && ck.exit === 0 && structOk && nums.every((x) => x.equal),
    { structure: Object.fromEntries(['HypG', 'Pt', 'E', 'K0'].map((k) => [k, gm[k] && { eqvUpToAuxProofNames: gm[k].eqvUpToAuxProofNames, eqv: gm[k].eqv, auxProofsTheirs: gm[k].auxProofsTheirs, auxProofsOurs: gm[k].auxProofsOurs, theirs: gm[k].theirsPretty }])), rule: 'amendment A (written after the first pass): alpha-equivalence up to the names of auxiliary proof constants', P0: gm.P0 && { type: gm.P0.type, isPointSome: gm.P0.isPointSome, argsAreP0xP0y: gm.P0.argsAreP0xP0y }, rationals: nums, manuscript: tex.text }, 'REFUTED');

  /* B7 kernel replays */
  const replay = (s) => { const x = step(s); const log = fact(s + '.log') || ''; return Object.assign({}, x, { replayed: (log.match(/^replaying /gm) || []).length, logTail: tail(log) }); };
  const lcz = replay('leanchecker-condzq'), lczp = replay('leanchecker-paranoid-condzq'), lco = replay('leanchecker-ours'), lcop = replay('leanchecker-paranoid-ours'), fr = replay('fresh');
  /* a replay that did not run, or did not finish (time, memory), is REFUSED; one that exits non-zero having run is REFUTED */
  const failWord = (...xs) => (xs.some((x) => typeof x.exit !== 'number' || x.exit === 124 || x.exit === 137) ? 'REFUSED' : 'REFUTED');
  row('B7a', '`leanchecker CondZQ` and `leanchecker-paranoid CondZQ`: claimbox\'s ten modules replayed by the toolchain kernel onto their imports', lcz.exit === 0 && lczp.exit === 0 && lcz.replayed === 10 && lczp.replayed === 10, { leanchecker: lcz, paranoid: lczp }, failWord(lcz, lczp));
  row('B7b', '`leanchecker CertMachineZQ` and `leanchecker-paranoid CertMachineZQ`: our statement module replayed', lco.exit === 0 && lcop.exit === 0 && lco.replayed === 1 && lcop.replayed === 1, { leanchecker: lco, paranoid: lcop }, failWord(lco, lcop));
  row('B7c', '`leanchecker --fresh CertMachineZQ`: every constant of the closure (core, Mathlib, Glazer\'s modules, claimbox\'s, ours) replayed into an empty environment', fr.exit === 0 && /replaying CertMachineZQ with --fresh/.test(fact('fresh.log') || ''), fr, failWord(fr));

  /* B8 second kernels on the name-restricted export: each its own row; a tool stop is REFUSED (tool), never the decision */
  const exp = fact('export.txt') || '';
  const ej = (() => { try { return JSON.parse(exp.split('\n').find((l) => l.startsWith('{'))); } catch (e) { return null; } })();
  record('X1', 'the name-restricted export (`leanexport CertMachineZQ -- <our four theorems> <the built-in list>`) given to the second kernels', step('export') && step('export').exit === 0 ? 'exported with the built-in list' : step('export-plain') && step('export-plain').exit === 0 ? 'exported without the built-in list (the toolchain lacks a name of it)' : 'not exported',
    Object.assign({ sha256: (exp.match(/^([0-9a-f]{64})/) || [])[1], bytes: Number((exp.match(/^(\d+) bytes$/m) || [])[1]), lines: ej && ej.lines, declarationLines: ej && Object.fromEntries(['axiom', 'def', 'thm', 'opaque', 'quot', 'inductive'].map((k) => [k, ej.linesByFirstKey[k] || 0])) }, step('export') || {}, { exportLog: tail(fact('export.log')) }));
  const toolStop = (log) => /overflow|out of memory|fuel|stack|Killed|memory/i.test(log || '');
  const second = (id, s, statement, accepted) => {
    const x = step(s), log = fact(s + '.log') || '';
    if (!x) { info.push({ id, statement, outcome: 'not run', numbers: {} }); return null; }
    const ok = x.exit === 0 && accepted(log);
    const verdict = ok ? 'CERTIFIED' : toolStop(log) || x.exit === 137 || x.exit === 124 ? 'REFUSED' : 'INVESTIGATE';
    rows.push({ id, statement, verdict: verdict === 'INVESTIGATE' ? 'REFUSED' : verdict, numbers: Object.assign({}, x, { logTail: tail(log), toolStop: verdict === 'REFUSED' }) });
    if (verdict === 'INVESTIGATE') notes.push(id + ': ' + s + ' exited ' + x.exit + ' with no recognised tool stop (' + tail(log, 1) + '); the decision waits on reading it.');
    return verdict;
  };
  const nbuild = fact('nanoda-build.log') || '';
  second('B8n', 'nanoda', 'nanoda v0.4.31 (nanoda_lib ' + NANODA_PIN.slice(0, 8) + ', built on the pod, 1 GiB stack) accepts the export, permitted axioms exactly the three', (l) => /Checked|success|accepted/i.test(l) && nbuild.includes('version = "0.4.31"'));
  second('B8nb', 'nanoda-bundled', 'the toolchain\'s bundled nanoda_bin accepts the export', (l) => /Checked|success|accepted/i.test(l));
  second('B8rb', 'con-ron-bundled', 'con-ron as bundled with v4.35.0 accepts the export', (l) => /accepted \d+ declarations/.test(l));
  second('B8lb', 'con-leche-bundled', 'con-leche as bundled with v4.35.0 accepts the export (--jobs=8)', (l) => /accepted \d+ declarations/.test(l));
  second('B8rm', 'con-ron-master', 'con-ron master ' + CONRON_PIN.slice(0, 8) + ' (cargo, on the pod) accepts the export', (l) => /accepted \d+ declarations/.test(l));
  if (step('con-leche-master')) second('B8lm', 'con-leche-master', 'con-leche master ' + CONLECHE_PIN.slice(0, 8) + ' (lake, on the pod) accepts the export (--jobs=8)', (l) => /accepted \d+ declarations/.test(l));
  else {
    rows.push({ id: 'B8lm', statement: 'con-leche master ' + CONLECHE_PIN.slice(0, 8) + ' (lake) accepts the export (--jobs=8)', verdict: 'REFUSED', numbers: { notRun: 'not run in the recorded pass (amendment B): on the 64 GB pod it can only be killed by the memory limit again', continuation: 'exit 137 after 18 min, 62 GB peak (quoted, not imported)', toolStop: true } });
  }
  const secondIds = ['B8n', 'B8nb', 'B8rb', 'B8lb', 'B8rm', 'B8lm'];
  const secondAccepted = rows.filter((r) => secondIds.includes(r.id) && r.verdict === 'CERTIFIED').map((r) => r.id);

  /* recorded: claimbox's own checks, the conclusion span */
  const th = step('theirs'), thlog = fact('theirs.log') || '';
  record('X2', 'claimbox\'s own Checks library (its statement check and #print_axioms_all), built here', th ? (th.exit === 0 ? 'built; ' + ((thlog.match(/AXIOMS-SUMMARY theorems=\d+ outside-standard=\d+/) || ['no summary line'])[0]) : 'exit ' + th.exit) : 'not run', th || {});
  const span = fact('span.log') ? JSON.parse(fact('span.log')) : {};
  const spanVals = Object.values(span);
  record('X3', 'the 355-byte conclusion span claimbox calls byte-identical, hashed in CondZQ/Main.lean, CondZQ/Discharged.lean and the frozen file', spanVals.length === 3 && spanVals.every((v) => v.bytes === spanVals[0].bytes && v.sha256 === spanVals[0].sha256) ? 'identical in all three (' + spanVals[0].bytes + ' bytes)' : 'not identical in all three', span);

  /* red controls (B7 of the pre-registration) */
  const PK0 = jsonl('plants-check.jsonl'), PK = supJsonl('plants-check.jsonl');
  if (!same(PK0, PK, 'target')) die('the supplement\'s plant target lines differ from the recorded pass\'s; REFUSED');
  const pt = (n) => PK.find((x) => x.type === 'target' && x.name === n) || {};
  const ps = (n) => PK.find((x) => x.type === 'screen' && x.name === n) || {};
  const PA1 = fact('plants-audit-claimbox.jsonl') ? auditOf('plants-audit-claimbox.jsonl') : { decls: [] }, PA2 = fact('plants-audit-ours.jsonl') ? auditOf('plants-audit-ours.jsonl') : { decls: [] };
  const pd = (n) => [...PA1.decls, ...PA2.decls].find((d) => d.name === n) || {};
  const lck = (m) => { const x = step('plants-leanchecker-' + m); return x && x.exit; };
  const lckLog = (m) => fact('plants-leanchecker-' + m + '.log') || '';
  /* nanoda's reason: the line after its panic location (amendment A: each refusal's reason is stated) */
  const reason = (log) => ((log || '').match(/panicked at [^\n]*\n([^\n]*)/) || [])[1] || null;
  const nd = (id) => ({ v031: (step('plants-nanoda-' + id) || {}).exit, bundled: (step('plants-nanoda-' + id + '-bundled') || {}).exit, reason: reason(fact('plants-nanoda-' + id + '.log')), reasonBundled: reason(fact('plants-nanoda-' + id + '-bundled.log')) });
  const pb = step('plants-build');
  const ctl = (id, mutation, prediction, outcome, passed) => ({ id, mutation, prediction, outcome, passed: !!pb && pb.exit === 0 && passed });
  const c1 = pt('CondZQ.Planted.planted_conclusion_changed'), c2 = pt('CondZQ.Planted.planted_sorry'), c3 = pt('CondZQ.Planted.planted_axiom');
  const q1 = pt('CertMachineZQPlant.q1_extra_hypothesis'), q2 = pt('CertMachineZQPlant.q2_circular'), q3 = pt('CertMachineZQPlant.q3_unchecked');
  const n2 = nd('C2'), n3 = nd('C3'), nq3 = nd('Q3');
  const redControls = [
    ctl('C1', 'claimbox\'s Planted.Conclusion: the degree bound 2↑↑7 → 2↑↑8, proved from the nine hypotheses', 'builds; standard axioms; B6(a) with nine hypotheses refuses it (body not alpha-equivalent to F)',
      { pass: c1.pass, domainsOk: c1.domainsOk, conclusionEqv: c1.conclusionEqv, axioms: pd('CondZQ.Planted.planted_conclusion_changed').ours, leanchecker: lck('Planted.Conclusion') },
      c1.found && c1.domainsOk === true && c1.conclusionEqv === false && c1.pass === false && subset(pd('CondZQ.Planted.planted_conclusion_changed').ours || ['x'])),
    ctl('C2', 'claimbox\'s Planted.Sorry: the frozen statement from the nine hypotheses by `sorry`', 'B6(a) passes; the audit flags sorryAx by both traversals; nanoda refuses its export',
      { pass: c2.pass, axiomsOurs: pd('CondZQ.Planted.planted_sorry').ours, axiomsLean: pd('CondZQ.Planted.planted_sorry').lean, nanoda: n2 },
      c2.pass === true && (pd('CondZQ.Planted.planted_sorry').ours || []).includes('sorryAx') && (pd('CondZQ.Planted.planted_sorry').lean || []).includes('sorryAx') && n2.v031 !== 0 && n2.v031 !== undefined),
    ctl('C3', 'claimbox\'s Planted.Axiom: the frozen statement asserted as a new axiom and used', 'B6(a) passes; the audit lists planted_zinq_axiom (kind axiom) and flags planted_axiom; nanoda refuses its export',
      { pass: c3.pass, axiomDecl: pd('CondZQ.Planted.planted_zinq_axiom').kind, axiomsOurs: pd('CondZQ.Planted.planted_axiom').ours, nanoda: n3 },
      c3.pass === true && pd('CondZQ.Planted.planted_zinq_axiom').kind === 'axiom' && (pd('CondZQ.Planted.planted_axiom').ours || []).includes('CondZQ.Planted.planted_zinq_axiom') && (pd('CondZQ.Planted.planted_axiom').lean || []).includes('CondZQ.Planted.planted_zinq_axiom') && n3.v031 !== 0 && n3.v031 !== undefined),
    ctl('Q1', 'ours: an extra first hypothesis (1 : Nat) = 0, the theorem proved by absurd', 'B6(a) with eight refuses it',
      { pass: q1.pass, binders: q1.binders, domainsOk: q1.domainsOk, axioms: pd('CertMachineZQPlant.q1_extra_hypothesis').ours },
      q1.found && q1.pass === false && q1.domainsOk === false && q1.binders === 9 && subset(pd('CertMachineZQPlant.q1_extra_hypothesis').ours || ['x'])),
    ctl('Q2', 'ours: HypH2 replaced by HypCirc := F, the theorem proved by it', 'B6(a) refuses it (the eighth domain is not HypH2) and the screen flags HypCirc',
      { pass: q2.pass, domainsOk: q2.domainsOk, screenHypCirc: { flagged: ps('CertMachineZQPlant.HypCirc').flagged, containsF: ps('CertMachineZQPlant.HypCirc').containsF } },
      q2.found && q2.pass === false && q2.domainsOk === false && ps('CertMachineZQPlant.HypCirc').flagged === true && (ps('CertMachineZQPlant.HypCirc').containsF || []).includes('CertMachineZQPlant.HypCirc')),
    ctl('Q3', 'ours: T8\'s exact type with the value True.intro, added by run_cmd under set_option debug.skipKernelTC true', 'B6(a) PASSES and the audit sees no axiom outside the three standard ones, raising no flag (both blind spots; the word corrected after the recorded pass, amendment C); leanchecker on its module exits non-zero; nanoda refuses its export',
      { pass: q3.pass, axiomsOurs: pd('CertMachineZQPlant.q3_unchecked').ours, leanchecker: lck('CertMachineZQPlant.Q3'), leancheckerKernelError: /type mismatch|kernel/i.test(lckLog('CertMachineZQPlant.Q3')), nanoda: nq3 },
      q3.pass === true && subset(pd('CertMachineZQPlant.q3_unchecked').ours || ['x']) && subset(pd('CertMachineZQPlant.q3_unchecked').lean || ['x']) && lck('CertMachineZQPlant.Q3') !== 0 && lck('CertMachineZQPlant.Q3') !== null && nq3.v031 !== 0 && nq3.v031 !== undefined),
    { id: 'Q4', mutation: 'one byte appended to CondZQ/Main.lean in a copy, on the pod', prediction: 'B1\'s re-hash flags exactly that file', outcome: { flagged: rh.q4 && rh.q4.flagged }, passed: !!rh.q4 && JSON.stringify(rh.q4.flagged) === JSON.stringify(['CondZQ/Main.lean']) },
  ];
  const controlsOk = redControls.every((c) => c.passed);

  /* the verdicts, as pre-registered: one per claim, T8 the headline */
  const v = (id) => (rows.find((r) => r.id === id) || {}).verdict;
  const base = ['B1', 'B2'];
  const common = ['B3', 'B3m', 'B4', 'B5', 'B6b', 'B6c', 'B7a', 'B7b', 'B7c'];
  const investigate = notes.some((n) => /^B8/.test(n));
  const decide = (own) => {
    if (base.some((id) => v(id) !== 'CERTIFIED')) return ['REFUSED', 'the source or toolchain was not reproduced at the pins'];
    const refuted = [...common, ...own].filter((id) => v(id) === 'REFUTED');
    if (refuted.length) return ['REFUTED', 'rows refuted: ' + refuted.join(', ')];
    if (v('B6c') !== 'CERTIFIED') return ['REFUSED', 'the screen flagged a hypothesis'];
    if (!controlsOk) return ['REFUSED', 'a control did not come out as predicted: ' + redControls.filter((c) => !c.passed).map((c) => c.id).join(', ')];
    if (!oursAll) return ['REFUSED', 'our own statement theorems did not pass B6(a)'];
    if (investigate) return ['REFUSED', 'a second kernel stopped with something other than a tool limit, not yet read'];
    const notCert = [...common, ...own].filter((id) => v(id) !== 'CERTIFIED');
    if (notCert.length) return ['REFUSED', 'rows not certified: ' + notCert.join(', ')];
    return ['CERTIFIED', 'every row and every control as pre-registered; second kernels accepting: ' + (secondAccepted.length ? secondAccepted.join(', ') : 'none (each stop a tool limit, recorded)')];
  };
  const claims = [
    { id: 'T8', name: T8, statement: 'Glazer\'s frozen statement follows in Lean from the eight hypotheses M, H, PC, C, LT, CC, H1, H2 (claimbox\'s theorem; ours trackB_eight states it with his statement by type_of%)', rows: ['B6a8'] },
    { id: 'T9', name: T9, statement: 'the same from the nine hypotheses, G first', rows: ['B6a9'] },
    { id: 'G', name: G, statement: 'HypG holds: P0 has infinite order (claimbox\'s proof, 2-adic)', rows: ['B6aG'] },
    { id: 'Gmeaning', name: 'CondZQ.HypG', statement: 'HypG is the first clause of the manuscript\'s prop:generator about the manuscript\'s own curve and point: "the point P_0 has infinite order"', rows: ['B6aG', 'B6d'] },
  ].map((c) => { const [verdict, reason] = decide(c.rows); return Object.assign(c, { verdict, reason }); });
  const head = claims[0];

  const status = need('_status.txt').trim().split('\n');
  return {
    what: 'The Track B decision on the claim "Z is Diophantine in Q" (Elliot Glazer with AI agents, announced 2026-11-05): claimbox\'s conditional Lean theorem at ' + PIN.claimbox.commit.slice(0, 8) + ' (lean/zinq), which proves Glazer\'s frozen main statement from named hypotheses, built on Lean 4.35.0 with Mathlib v4.35.0 and decided here by our own axiom audit, our own statement module and syntactic checks, the toolchain kernel three ways, second kernels on an export, and planted controls that must fail.',
    undecided: UNDECIDED,
    notDecided: NOT_DECIDED,
    generated: new Date().toISOString().slice(0, 10),
    preregistration: 'notes/zq-trackb-preregistration-2026-11-06.md (committed and pushed before any code of ours ran on claimbox\'s files; amendments A and B after a first pass and before the recorded one, C after the recorded pass and before its supplement)',
    pins: PIN,
    code: Object.assign({ 'tools/record-zq-trackb.js': sha(fs.readFileSync(__filename)) }, Object.fromEntries(Object.values(OURS).map((p) => [p, sha(fs.readFileSync(path.join(ROOT, p)))]))),
    run: { facts: path.relative(ROOT, RUN), pod: 'RunPod CPU pod, 8 vCPU, 64 GB cgroup, /root/zq-trackb/final', firstStatus: status[0], lastStatus: status[status.length - 1], steps: stepsRecorded,
      firstPass: 'a first pass ran 11:05-12:22 UTC under /root/zq-trackb/pass1; nothing of it is imported (amendments A and B)',
      supplement: { facts: path.relative(ROOT, SUP), why: 'amendment C: the recorded pass\'s screen lines were broken by a fault of ours (a `return` in a match arm left the screen function); the screens re-run with the corrected check file, every other row from the recorded pass', checkFileRecordedPass: CHECK_RECORDED, checkFileSupplement: cur['zq-trackb-check.lean'], steps: stepsSupplement, firstStatus: (supFact('_status.txt') || '').trim().split('\n')[0], agreesOnTargetsFAndG: supplementAgrees } },
    verdict: head.verdict,
    verdictScope: 'the frozen statement follows in Lean from the eight named hypotheses; G holds and says what the manuscript\'s prop:generator says first. The theorem itself, and each of the eight: undecided here.',
    verdictReason: head.reason,
    claims, rows, recorded: info, redControls, notes,
  };
}

const L = build();
const strip = (x) => JSON.stringify(Object.assign({}, x, { generated: null }));
if (process.argv.includes('--check')) {
  if (!fs.existsSync(OUT)) die('no record to check');
  if (strip(JSON.parse(fs.readFileSync(OUT, 'utf8'))) !== strip(L)) die('certs/zq-trackb.json is not what the imported facts, the pinned TeX and this code give now');
  console.log('zq-trackb: re-derived, identical · ' + L.claims.map((c) => c.id + ' ' + c.verdict).join(' · '));
} else {
  fs.writeFileSync(OUT, JSON.stringify(L, null, 1) + '\n');
  console.log('zq-trackb: ' + L.claims.map((c) => c.id + ' ' + c.verdict).join(' · ') + ' · ' + L.rows.map((r) => r.id + ' ' + (r.verdict === 'CERTIFIED' ? 'ok' : r.verdict)).join(' ') + ' · controls ' + L.redControls.map((c) => c.id + (c.passed ? ' ok' : ' FAILS')).join(' ') + ' · ' + L.verdictReason);
}
