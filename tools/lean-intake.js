#!/usr/bin/env node
/* lean-intake.js — a Lean claim, from its pins to a record, in one command (the Lean fidelity + intake plan,
   notes/lean-fidelity-plan-2026-11-09.md; phase P1, the pilot on Erdős #488).

   WHAT IT DECIDES. Whether a claimant's Lean theorem proves (or refutes) a CANONICAL declaration someone else wrote —
   DeepMind's formal-conjectures entry, a Comparator challenge — and whether the check itself can tell the difference:
     F1  identity: a theorem whose statement is taken from the canonical declaration by type_of% and whose proof is the
         claimant's term; the kernel accepts it only if the two statements are the same up to definitional unfolding;
     F1 controls: planted statements — the same statement in other words (must be ACCEPTED) and wrong ones (must be
         REFUSED, by a type mismatch at the claimant's term and nowhere else);
     F3  non-vacuity: the canonical statement's hypotheses, opened as written (no unfolding), have a model the kernel checks;
     planted claims: variants of the claimant's file (a false step, a sorry, an axiom, native_decide), each caught by a
         failed build or a non-standard axiom;
     kernels: Lean's (the build), leanchecker, and nanoda through lean4export, each named; the ones not run are named too.
   F2 (instance agreement with an exact decider) is phase P2; whether the canonical statement is the informal problem
   (F5) stays a reading. No verdict comes from a language model.

   HOW. The spec, corpus/lean-intake/<id>/spec.json, is the pre-registration: the pins, the claimant's declaration,
   F3's witness, every planted statement with its expected outcome — committed before any run. `run` clones both
   repositories at their pins into a work directory OUTSIDE this repository (LEAN_INTAKE_WORK, default
   ~/Projects/lean-intake-work/<id>), adds one lean_lib (Intake) holding the claimant's file byte for byte and the
   generated checks, and writes one log/exit/seconds triple per step into corpus/lean-intake/<id>/runs/<day>/. No byte
   of the claimant's file is copied into this repository (no licence is assumed). `record` decides from those facts
   alone and writes certs/lean-intake-<id>.json; `--check` re-derives it and refuses on any difference. `review` drafts
   a review in outreach/ (untracked; sent only on the operator's word).

   usage: node tools/lean-intake.js run <id> [--day YYYY-MM-DD] [--stages pin,toolchain,...]
          node tools/lean-intake.js record <id> [--check]
          node tools/lean-intake.js review <id>                                                                MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const STD = ['Classical.choice', 'Quot.sound', 'propext'];
const STAGES = ['pin', 'toolchain', 'cache', 'canonical', 'assemble', 'claim', 'f1', 'f3', 'mutants', 'reds', 'leanchecker', 'nanoda'];
const NANODA = { url: 'https://github.com/ammkrn/nanoda_lib.git', commit: '8de7e0c4ed3052745a7f8725164efd9e76d84c56' };
const die = (m) => { console.error('lean-intake: ' + m); process.exit(1); };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const [cmd, id] = process.argv.slice(2);
const opt = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
if (!cmd || !id) die('usage: run|record|review <id>');
const SPEC_PATH = path.join('corpus', 'lean-intake', id, 'spec.json');
if (!fs.existsSync(path.join(ROOT, SPEC_PATH))) die('no spec ' + SPEC_PATH);
const SPEC = JSON.parse(fs.readFileSync(path.join(ROOT, SPEC_PATH), 'utf8'));
const RUNS = path.join(ROOT, 'corpus', 'lean-intake', id, 'runs');
const OUT = path.join(ROOT, 'certs', 'lean-intake-' + id + '.json');

/* ---- the Lean the run generates (from the spec alone) ---------------------------------------------------------- */
const claimStem = SPEC.claim.file.replace(/\.lean$/, '').replace(/[^A-Za-z0-9_]/g, '_');
const claimMod = 'Intake.Claim.' + claimStem;
const neg = SPEC.polarity === 'refutes' ? '¬ ' : SPEC.polarity === 'proves' ? '' : die('polarity is proves or refutes');
const META = `import Lean
open Lean Meta Elab Command

namespace Intake

/-- The hypotheses of a statement with its conclusion replaced by \`False\`. Binders are opened as written (\`∀\`,
\`let\`, \`have\`) and nothing is unfolded, so a conclusion such as \`a < b\` is never mistaken for a hypothesis. -/
partial def hypothesesToFalse (e : Expr) : MetaM Expr := do
  match e with
  | .forallE n d b bi => withLocalDecl n bi d fun x => do mkForallFVars #[x] (← hypothesesToFalse (b.instantiate1 x))
  | .letE _ _ v b _ => hypothesesToFalse (b.instantiate1 v)
  | .mdata _ e => hypothesesToFalse e
  | _ =>
    if e.isAppOfArity \`\`letFun 4 then hypothesesToFalse (e.appArg!.bindingBody!.instantiate1 (e.getArg! 2))
    else pure (mkConst \`\`False)

elab "intake_hypotheses " src:ident " => " dst:ident : command => do
  let some ci := (← getEnv).find? src.getId | throwError "intake: no declaration {src.getId}"
  let value ← liftTermElabM <| hypothesesToFalse ci.type
  let decl : DefinitionVal := { name := dst.getId, levelParams := ci.levelParams, type := mkSort levelZero, value := value, hints := .abbrev, safety := .safe }
  liftCoreM <| addDecl (.defnDecl decl)

def emit (j : Json) : IO Unit := do
  let p := (← IO.getEnv "INTAKE_OUT").getD "/dev/stdout"
  IO.FS.writeFile p (j.compress ++ "\\n")

end Intake
`;
function generated() {
  const C = SPEC.canonical, imp = `import ${C.module}\nimport ${claimMod}\n`;
  const files = {
    'Intake/Meta.lean': META,
    'Intake/F1.lean': imp + `\n/-! F1: the canonical statement, taken from its declaration by type_of%, and the claimant's proof. -/\ntheorem Intake.f1 : ${neg}(type_of% @${C.decl}) := ${SPEC.claim.decl}\n\n#print axioms Intake.f1\n`,
    'Intake/F1Report.lean': `import Intake.F1\nimport Intake.Meta\nopen Lean Meta\n\n#eval show MetaM Unit from do\n  let env ← getEnv\n`
      + `  let some can := env.find? "${C.decl}".toName | throwError "intake: no canonical declaration"\n`
      + `  let some cl := env.find? "${SPEC.claim.decl}".toName | throwError "intake: no claimant declaration"\n`
      + `  let target := ${neg ? 'mkNot can.type' : 'can.type'}\n  let defeq ← isDefEq cl.type target\n`
      + `  Intake.emit <| Json.mkObj [("canonical", Json.str s!"{← ppExpr can.type}"), ("claim", Json.str s!"{← ppExpr cl.type}"),\n`
      + `    ("equal", Json.bool (cl.type.equal target)), ("eqv", Json.bool (cl.type.eqv target)), ("defeq", Json.bool defeq),\n`
      + `    ("canonicalLevelParams", toJson can.levelParams.toArray), ("claimLevelParams", toJson cl.levelParams.toArray)]\n`,
    'Intake/F3.lean': `import ${C.module}\nimport Intake.Meta\n\n/-! F3: the canonical statement's hypotheses have a model. -/\nintake_hypotheses ${C.decl} => Intake.F3.target\n\n`
      + `theorem Intake.f3 : ¬ Intake.F3.target := by\n  ${SPEC.f3.tactic}\n\n#print axioms Intake.f3\n`,
  };
  const cLine = {};
  for (const m of SPEC.mutants) {
    const head = imp + (m.imports || []).map((i) => `import ${i}\n`).join('') + `\n/-! ${m.id} (${m.kind}): ${m.why.replace(/-\//g, '- /')} -/\nnamespace Intake.Mut.${m.id}\n`;
    const body = `theorem s : ${m.statement} := by\n  sorry\n`;
    cLine[m.id] = (head + body).split('\n').length;
    files[`Intake/Mut/${m.id}.lean`] = head + body + `theorem c : ${neg}(type_of% @s) := ${SPEC.claim.decl}\nend Intake.Mut.${m.id}\n`;
  }
  return { files, cLine };
}
function redBytes(claimText, r) {
  const n = claimText.split(r.find).length - 1;
  if (n === 0 || (!r.all && n !== 1)) die(`planted claim ${r.id}: its text occurs ${n} times in the claimant's file`);
  return (r.all ? claimText.split(r.find).join(r.replace) : claimText.replace(r.find, r.replace)) + `\n#print axioms ${SPEC.claim.decl}\n`;
}

/* ---- run ------------------------------------------------------------------------------------------------------- */
function run() {
  const day = opt('--day') || new Date().toISOString().slice(0, 10);
  const want = opt('--stages') ? opt('--stages').split(',') : STAGES;
  for (const s of want) if (!STAGES.includes(s)) die('unknown stage ' + s);
  const FACTS = path.join(RUNS, day); fs.mkdirSync(FACTS, { recursive: true });
  const WORK = process.env.LEAN_INTAKE_WORK || path.join(os.homedir(), 'Projects', 'lean-intake-work', id);
  fs.mkdirSync(WORK, { recursive: true });
  const CAN = path.join(WORK, 'canonical'), CLM = path.join(WORK, 'claim'), TOOLS = path.join(WORK, 'tools');
  const status = (s) => { fs.appendFileSync(path.join(FACTS, '_status.txt'), new Date().toISOString() + ' ' + s + '\n'); console.log(s); };
  const step = (name, cwd, command, seconds = 7200, env = {}) => {
    status('start ' + name);
    const t0 = Date.now();
    const r = cp.spawnSync('bash', ['-c', command + ' 2>&1'], { cwd, env: Object.assign({}, process.env, env), timeout: seconds * 1000, maxBuffer: 1 << 30 });
    const exit = r.status === null ? (r.signal || 'timeout') : r.status;
    fs.writeFileSync(path.join(FACTS, name + '.log'), r.stdout || '');
    fs.writeFileSync(path.join(FACTS, name + '.exit'), String(exit) + '\n');
    fs.writeFileSync(path.join(FACTS, name + '.seconds'), ((Date.now() - t0) / 1000).toFixed(1) + '\n');
    status('end ' + name + ' exit ' + exit);
    return exit === 0;
  };
  const ok = (name) => fs.existsSync(path.join(FACTS, name + '.exit')) && fs.readFileSync(path.join(FACTS, name + '.exit'), 'utf8').trim() === '0';
  const binDir = () => path.join(os.homedir(), '.elan', 'toolchains', SPEC.canonical.toolchain.replace('/', '--').replace(':', '---'), 'bin');
  const C = SPEC.canonical;
  for (const s of want) {
    if (s === 'pin') {
      step('pin-canonical', WORK, `rm -rf canonical && git clone -q --filter=blob:none ${C.url} canonical && git -C canonical checkout -q ${C.commit} && git -C canonical rev-parse HEAD`);
      step('pin-claim', WORK, `rm -rf claim && git clone -q ${SPEC.claim.url} claim && git -C claim checkout -q ${SPEC.claim.commit} && git -C claim rev-parse HEAD`);
      const pin = {
        canonical: { head: fs.readFileSync(path.join(FACTS, 'pin-canonical.log'), 'utf8').trim().split('\n').pop(), sha256: sha(fs.readFileSync(path.join(CAN, C.path))), toolchain: fs.readFileSync(path.join(CAN, 'lean-toolchain'), 'utf8').trim() },
        claim: { head: fs.readFileSync(path.join(FACTS, 'pin-claim.log'), 'utf8').trim().split('\n').pop(), sha256: sha(fs.readFileSync(path.join(CLM, SPEC.claim.file))), toolchain: fs.existsSync(path.join(CLM, 'lean-toolchain')) ? fs.readFileSync(path.join(CLM, 'lean-toolchain'), 'utf8').trim() : null },
      };
      /* the hazards a reader looks for first: counted with their lines, comments included (a flag, never a verdict) */
      const text = fs.readFileSync(path.join(CLM, SPEC.claim.file), 'utf8');
      pin.hazards = {};
      for (const [k, re] of Object.entries({ sorry: /\bsorry\b/, admit: /\badmit\b/, native_decide: /\bnative_decide\b/, axiom: /^\s*axiom\b/, unsafe: /\bunsafe\b/, implemented_by: /\bimplemented_by\b/, extern: /@\[extern/, skipKernelTC: /debug\.skipKernelTC/, opaque: /^\s*opaque\b/ })) {
        pin.hazards[k] = text.split('\n').map((l, i) => (re.test(l) ? i + 1 : 0)).filter(Boolean);
      }
      fs.writeFileSync(path.join(FACTS, 'pin.json'), JSON.stringify(pin, null, 1) + '\n');
      if (pin.canonical.sha256 !== C.sha256) die('the canonical file is not the pinned bytes');
      if (pin.claim.sha256 !== SPEC.claim.sha256) die('the claimant\'s file is not the pinned bytes');
      if (pin.canonical.toolchain !== C.toolchain) die('the canonical repository\'s toolchain is ' + pin.canonical.toolchain + ', the spec says ' + C.toolchain);
    } else if (s === 'toolchain') {
      step('toolchain', WORK, `elan toolchain install ${C.toolchain} && ls "${binDir()}"`, 1800);
    } else if (s === 'cache') {
      step('cache', CAN, 'lake exe cache get', 3600);
    } else if (s === 'canonical') {
      step('canonical', CAN, `lake build '${C.module}'`);
    } else if (s === 'assemble') {
      const { files } = generated();
      const lib = path.join(CAN, 'Intake');
      fs.rmSync(lib, { recursive: true, force: true });
      fs.mkdirSync(path.join(lib, 'Claim'), { recursive: true }); fs.mkdirSync(path.join(lib, 'Mut'), { recursive: true }); fs.mkdirSync(path.join(lib, 'Red'), { recursive: true });
      const claimText = fs.readFileSync(path.join(CLM, SPEC.claim.file), 'utf8');
      fs.copyFileSync(path.join(CLM, SPEC.claim.file), path.join(lib, 'Claim', claimStem + '.lean'));
      for (const [f, b] of Object.entries(files)) fs.writeFileSync(path.join(CAN, f), b);
      for (const r of SPEC.claimReds || []) fs.writeFileSync(path.join(lib, 'Red', r.id + '.lean'), redBytes(claimText, r));
      const toml = path.join(CAN, 'lakefile.toml');
      if (!fs.existsSync(toml)) die('the canonical repository has no lakefile.toml (a lakefile.lean is not handled yet)');
      if (!/name = "Intake"/.test(fs.readFileSync(toml, 'utf8'))) fs.appendFileSync(toml, '\n[[lean_lib]]\nname = "Intake"\n');
      const shas = {};
      for (const f of ['Claim/' + claimStem + '.lean'].concat(Object.keys(files).map((f) => f.slice('Intake/'.length)), (SPEC.claimReds || []).map((r) => 'Red/' + r.id + '.lean'))) shas[f] = sha(fs.readFileSync(path.join(lib, f)));
      fs.writeFileSync(path.join(FACTS, 'assemble.json'), JSON.stringify({ files: shas }, null, 1) + '\n');
      status('assembled ' + Object.keys(shas).length + ' files');
    } else if (s === 'claim') {
      step('claim', CAN, `lake build ${claimMod}`);
    } else if (s === 'f1') {
      if (step('f1', CAN, 'lake build Intake.F1')) step('f1report', CAN, 'lake build Intake.Meta && lake env lean Intake/F1Report.lean', 1800, { INTAKE_OUT: path.join(FACTS, 'f1report.json') });
    } else if (s === 'f3') {
      step('f3', CAN, 'lake build Intake.F3');
    } else if (s === 'mutants') {
      for (const m of SPEC.mutants) step('mut-' + m.id, CAN, `lake build Intake.Mut.${m.id}`, 3600);
    } else if (s === 'reds') {
      for (const r of SPEC.claimReds || []) step('red-' + r.id, CAN, `lake build Intake.Red.${r.id}`, 3600);
    } else if (s === 'leanchecker') {
      if (!ok('f1')) { status('skip leanchecker: f1 did not build'); continue; }
      step('leanchecker', CAN, `lake env "${binDir()}/leanchecker" --verbose Intake.F1`, 7200);
    } else if (s === 'nanoda') {
      if (!ok('f1')) { status('skip nanoda: f1 did not build'); continue; }
      const ver = C.toolchain.split(':')[1];
      step('lean4export-build', WORK, `rm -rf tools/lean4export && mkdir -p tools && git clone -q https://github.com/leanprover/lean4export tools/lean4export && cd tools/lean4export && (git checkout -q ${ver} 2>/dev/null || git checkout -q "$(git tag --list '${ver.replace(/\.\d+$/, '')}*' | tail -1)") && git log --oneline -1 && echo ${C.toolchain} > lean-toolchain && lake build && ls .lake/build/bin`, 3600);
      step('nanoda-build', WORK, `rm -rf tools/nanoda_lib && mkdir -p tools && git clone -q ${NANODA.url} tools/nanoda_lib && cd tools/nanoda_lib && git checkout -q ${NANODA.commit} && cargo build --release --locked -q && shasum -a 256 target/release/nanoda_bin`, 3600);
      if (!ok('lean4export-build') || !ok('nanoda-build')) continue;
      const exp = path.join(WORK, 'f1.export');
      step('export', CAN, `lake env "${TOOLS}/lean4export/.lake/build/bin/lean4export" Intake.F1 -- Intake.f1 > "${exp}" && shasum -a 256 "${exp}" && wc -c < "${exp}"`, 7200);
      if (!ok('export')) continue;
      fs.writeFileSync(path.join(WORK, 'nanoda.json'), JSON.stringify({ export_file_path: exp, use_stdin: false, permitted_axioms: ['propext', 'Quot.sound', 'Classical.choice'], unpermitted_axiom_hard_error: false, nat_extension: true, string_extension: true, num_threads: 8, print_success_message: true, stack_size_bytes: 1073741824 }) + '\n');
      step('nanoda', WORK, `"${TOOLS}/nanoda_lib/target/release/nanoda_bin" nanoda.json`, 7200);
    }
  }
  fs.writeFileSync(path.join(FACTS, 'machine.json'), JSON.stringify({ platform: process.platform, arch: process.arch, cpus: os.cpus().length, memGB: Math.round(os.totalmem() / 2 ** 30) }, null, 1) + '\n');
  status('done: ' + want.join(','));
}

/* ---- record: every word from the facts alone ------------------------------------------------------------------- */
function latestRun() {
  if (!fs.existsSync(RUNS)) die('no runs in ' + path.relative(ROOT, RUNS));
  const days = fs.readdirSync(RUNS).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  if (!days.length) die('no runs');
  return days[days.length - 1];
}
function decide() {
  const day = opt('--day') || latestRun();
  const F = path.join(RUNS, day);
  const has = (n) => fs.existsSync(path.join(F, n));
  const rd = (n) => (has(n) ? fs.readFileSync(path.join(F, n), 'utf8') : die('missing fact ' + n));
  const exit = (s) => (has(s + '.exit') ? rd(s + '.exit').trim() : null);
  const secs = (s) => (has(s + '.seconds') ? Number(rd(s + '.seconds')) : null);
  const axioms = (log, name) => {
    const m = new RegExp(`'${name.replace(/\./g, '\\.')}' depends on axioms: \\[([^\\]]*)\\]`).exec(log);
    if (m) return m[1].split(',').map((x) => x.trim()).filter(Boolean).sort();
    return new RegExp(`'${name.replace(/\./g, '\\.')}' does not depend on any axioms`).test(log) ? [] : null;
  };
  const errors = (log, file) => {
    const out = [];
    for (const l of log.split('\n')) {
      const m = /error:\s*(?:\.\/)*([^\s:]+\.lean):(\d+):(\d+):\s*(.*)/.exec(l) || /(?:\.\/)*([^\s:]+\.lean):(\d+):(\d+):\s*error:?\s*(.*)/.exec(l);
      if (m && m[1].endsWith(file)) out.push({ line: Number(m[2]), text: m[4].slice(0, 160) });
    }
    return out;
  };
  const pin = JSON.parse(rd('pin.json'));
  const asm = JSON.parse(rd('assemble.json'));
  const { cLine } = generated();
  const gen = generated().files;
  for (const [f, b] of Object.entries(gen)) if (asm.files[f.slice('Intake/'.length)] !== sha(b)) die('the run built another ' + f + ' than this spec generates');
  if (asm.files['Claim/' + claimStem + '.lean'] !== SPEC.claim.sha256) die('the run built another claimant file than the pin');

  const f1log = rd('f1.log'), f1ax = axioms(f1log, 'Intake.f1');
  const rep = has('f1report.json') ? JSON.parse(rd('f1report.json')) : null;
  const F1 = { exit: exit('f1'), axioms: f1ax, report: rep && { equal: rep.equal, eqv: rep.eqv, defeq: rep.defeq }, canonical: rep && rep.canonical, claim: rep && rep.claim, seconds: secs('f1') };
  F1.word = F1.exit === '0' && f1ax && f1ax.every((a) => STD.includes(a)) && rep && rep.defeq ? 'CERTIFIED' : 'REFUSED';
  F1.how = F1.word === 'CERTIFIED' ? `the kernel accepts the claimant's ${SPEC.claim.decl} as a proof of ${neg}${SPEC.canonical.decl}'s own type (taken by type_of%); `
    + (rep.equal ? 'the two types are equal as expressions' : rep.eqv ? 'the two types are equal up to binder names' : 'the two types differ as written and agree after definitional unfolding') : 'see the log';

  const f3log = rd('f3.log'), f3ax = axioms(f3log, 'Intake.f3');
  const F3 = { exit: exit('f3'), axioms: f3ax, witness: SPEC.f3.what, seconds: secs('f3') };
  F3.word = F3.exit === '0' && f3ax && f3ax.every((a) => STD.includes(a)) ? 'CERTIFIED' : 'REFUSED';

  const mutants = SPEC.mutants.map((m) => {
    const n = 'mut-' + m.id, log = rd(n + '.log'), e = exit(n), errs = errors(log, `Intake/Mut/${m.id}.lean`);
    const atC = errs.length > 0 && errs.every((x) => x.line === cLine[m.id]) && errs.some((x) => /type mismatch/i.test(x.text));
    const outcome = e === '0' ? 'ACCEPTED' : atC ? 'REFUSED by type mismatch' : 'FAILED elsewhere';
    const row = { id: m.id, kind: m.kind, why: m.why, expect: m.expect, outcome, asExpected: outcome === m.expect, errors: errs.slice(0, 3), seconds: secs(n) };
    if (m.amendment) row.amendment = m.amendment;
    if (m.preregistered) Object.assign(row, { preregistered: m.preregistered, asPreregistered: outcome === m.preregistered.expect });
    return row;
  });
  const reds = (SPEC.claimReds || []).map((r) => {
    const n = 'red-' + r.id, log = rd(n + '.log'), e = exit(n), ax = axioms(log, SPEC.claim.decl);
    const extra = ax ? ax.filter((a) => !STD.includes(a)) : null;
    const caught = e !== '0' || (extra && extra.length > 0);
    return { id: r.id, why: r.why, expect: r.expect, exit: e, nonstandardAxioms: extra, caught, how: e !== '0' ? 'the build fails: ' + ((errors(log, `Intake/Red/${r.id}.lean`)[0] || {}).text || 'see the log') : caught ? 'the axioms list ' + extra.join(', ') : 'NOT CAUGHT', seconds: secs(n) };
  });

  const kernels = [{ name: 'Lean (the build of Intake.F1)', word: F1.exit === '0' ? 'ACCEPTS' : 'REJECTS OR STOPPED', seconds: secs('f1') }];
  if (exit('leanchecker') !== null) kernels.push({ name: 'leanchecker --verbose Intake.F1 (bundled with ' + SPEC.canonical.toolchain.split(':')[1] + ')', word: exit('leanchecker') === '0' ? 'ACCEPTS' : 'REJECTS OR STOPPED', seconds: secs('leanchecker') });
  if (exit('nanoda') !== null) {
    const nl = rd('nanoda.log');
    const ex = has('export.log') ? rd('export.log').trim().split('\n') : [];
    kernels.push({ name: 'nanoda ' + NANODA.commit.slice(0, 8) + ' on the lean4export export of Intake.f1', word: exit('nanoda') === '0' && /checked|success/i.test(nl) ? 'ACCEPTS' : 'REJECTS OR STOPPED', export: { sha256: (ex.find((l) => /^[0-9a-f]{64}\s/.test(l)) || '').slice(0, 64) || null, bytes: Number(ex[ex.length - 1]) || null }, seconds: secs('nanoda') });
  }
  const binList = has('toolchain.log') ? rd('toolchain.log') : '';
  const notRun = ['leanchecker-paranoid', 'lean4lean', 'con-leche', 'con-ron'].filter((k) => !kernels.some((x) => x.name.startsWith(k)));
  const bundled = notRun.filter((k) => new RegExp('^' + k + '$', 'm').test(binList));

  const stepFiles = fs.readdirSync(F).filter((f) => f.endsWith('.seconds'));
  const wall = stepFiles.reduce((s, f) => s + Number(fs.readFileSync(path.join(F, f), 'utf8')), 0);
  const wrong = mutants.filter((m) => m.kind === 'wrong'), same = mutants.filter((m) => m.kind === 'same'), equiv = mutants.filter((m) => m.kind === 'equivalent');
  /* as pre-registered: the controls that existed before any run, each against its original expectation */
  const pre = mutants.filter((m) => !m.amendment || m.preregistered);
  const preOk = pre.filter((m) => (m.preregistered ? m.asPreregistered : m.asExpected)).length;
  const words = {
    F1: F1.word,
    F1controls: { wrongRefused: wrong.filter((m) => m.asExpected).length + ' of ' + wrong.length, sameAccepted: same.filter((m) => m.asExpected).length + ' of ' + same.length,
      equivalentRefused: equiv.length ? equiv.filter((m) => m.asExpected).length + ' of ' + equiv.length + ' (the limit: identity up to definitional unfolding, not logical equivalence)' : undefined,
      asPreregistered: preOk + ' of ' + pre.length, word: mutants.every((m) => m.asExpected) ? 'CERTIFIED' : 'REFUSED' },
    F3: F3.word,
    plantedClaims: { caught: reds.filter((r) => r.caught).length + ' of ' + reds.length, word: reds.every((r) => r.caught) ? 'CERTIFIED' : 'REFUSED' },
    kernels: kernels.every((k) => k.word === 'ACCEPTS') ? 'ACCEPT (' + kernels.length + ' run)' : 'NOT ALL ACCEPT',
  };
  const verdict = F1.word === 'CERTIFIED' && words.F1controls.word === 'CERTIFIED' && F3.word === 'CERTIFIED' && words.plantedClaims.word === 'CERTIFIED' && words.kernels.startsWith('ACCEPT') ? 'CERTIFIED' : 'REFUSED';

  /* a pilot's own question: does the intake reach the verdicts a hand run recorded (spec.reproduces: the record and
     which of its verdicts each intake word answers); a positive hand word is CERTIFIED or "n/n caught" */
  let reproduces = null;
  if (SPEC.reproduces) {
    const H = JSON.parse(fs.readFileSync(path.join(ROOT, SPEC.reproduces.record), 'utf8'));
    const pos = (w) => /^(CERTIFIED|ACCEPT)/.test(w) || /^(\d+)\/\1 caught$/.test(w);
    reproduces = { record: SPEC.reproduces.record, rows: SPEC.reproduces.map.map((r) => {
      const hw = String(H.verdicts[r.hand]), iw = r.intake.split('.').reduce((o, k) => o[k], words);
      return { hand: r.hand + ': ' + hw, intake: r.intake + ': ' + iw, same: pos(hw) === pos(String(iw)) };
    }) };
  }
  return {
    what: 'The Lean intake of ' + SPEC.claim.what + ' against ' + SPEC.canonical.what + ', decided from the run\'s facts by tools/lean-intake.js (phase P1 of notes/lean-fidelity-plan-2026-11-09.md). '
      + 'CERTIFIED here says: the kernels named accept the claimant\'s proof as a proof of ' + neg + 'the canonical declaration\'s own statement, the check refuses every planted wrong statement and accepts every planted paraphrase, the canonical hypotheses have a model, and every planted defect in the claimant\'s file is caught.',
    notDecided: 'Whether the canonical statement is the informal problem (a reading, F5); instance agreement with an exact decider (F2, phase P2); the kernels not run: ' + notRun.join(', ') + (bundled.length ? ' (bundled but not run: ' + bundled.join(', ') + ')' : ' (not bundled with ' + SPEC.canonical.toolchain.split(':')[1] + ')') + '.',
    spec: { path: SPEC_PATH, sha256: sha(fs.readFileSync(path.join(ROOT, SPEC_PATH))), amendments: SPEC.amendments.length },
    run: { day, facts: path.relative(ROOT, F), machine: JSON.parse(rd('machine.json')), stepSeconds: Number(wall.toFixed(1)), costUSD: 0 },
    pins: { canonical: Object.assign({ url: SPEC.canonical.url, path: SPEC.canonical.path, decl: SPEC.canonical.decl }, pin.canonical), claim: Object.assign({ url: SPEC.claim.url, file: SPEC.claim.file, decl: SPEC.claim.decl }, pin.claim) },
    hazards: pin.hazards,
    verdict, words, F1, F3, mutants, reds, kernels, notRun, reproduces,
  };
}
function record() {
  const rec = decide();
  if (process.argv.includes('--check')) {
    const old = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
    if (JSON.stringify(rec, null, 1) + '\n' !== old) die('certs/lean-intake-' + id + '.json differs from what the facts derive now');
    console.log(`lean-intake ${id} --check: OK — ${rec.verdict} (F1 ${rec.words.F1}; controls ${rec.words.F1controls.wrongRefused} wrong refused, ${rec.words.F1controls.sameAccepted} same accepted; F3 ${rec.words.F3}; planted claims ${rec.words.plantedClaims.caught}; kernels ${rec.words.kernels})`);
    return;
  }
  fs.writeFileSync(OUT, JSON.stringify(rec, null, 1) + '\n');
  console.log(`wrote certs/lean-intake-${id}.json — ${rec.verdict}`);
  console.log(JSON.stringify(rec.words, null, 1));
  for (const m of rec.mutants) console.log(`  ${m.asExpected ? 'ok  ' : 'MISS'} ${m.id} ${m.kind.padEnd(5)} ${m.outcome}${m.asExpected ? '' : ' (expected ' + m.expect + ')'}`);
  for (const r of rec.reds) console.log(`  ${r.caught ? 'ok  ' : 'MISS'} ${r.id} ${r.how}`);
}

/* ---- review: a draft, never sent from here --------------------------------------------------------------------- */
function review() {
  if (!fs.existsSync(OUT)) die('record first');
  const R = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  const lines = [
    `<!-- DRAFT from certs/lean-intake-${id}.json (tools/lean-intake.js review); untracked; posted only on the operator's word. -->`,
    `I checked ${SPEC.claim.what} against ${SPEC.canonical.what} (\`${SPEC.canonical.decl}\` at \`${SPEC.canonical.commit}\`).`,
    '',
    `- **The statement.** ${R.F1.how}. Of the planted statements, ${R.words.F1controls.wrongRefused} wrong ones were refused and ${R.words.F1controls.sameAccepted} rewordings of the same statement were accepted.`,
    `- **The hypotheses are satisfiable:** ${R.F3.witness}, checked by the kernel.`,
    `- **The kernels:** ${R.kernels.map((k) => k.name + ' ' + k.word.toLowerCase()).join('; ')}. Not run: ${R.notRun.join(', ')}.`,
    `- **The axioms:** ${R.F1.axioms.join(', ')}. Planted defects in the proof file (${R.reds.map((r) => r.why).join('; ')}): ${R.words.plantedClaims.caught} caught.`,
    `- **Not checked here:** whether the formal statement is the informal problem, which is a reading.`,
    '',
    'I worked this out with Claude (Anthropic).',
  ];
  const f = path.join(ROOT, 'outreach', `lean-intake-${id}-review.md`);
  fs.writeFileSync(f, lines.join('\n') + '\n');
  console.log('drafted ' + path.relative(ROOT, f) + ' (untracked)');
}

if (cmd === 'run') run(); else if (cmd === 'record') record(); else if (cmd === 'review') review(); else die('unknown command ' + cmd);
