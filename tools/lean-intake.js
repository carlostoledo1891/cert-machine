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

   SELF-CONTAINED FILES (2026-11-10). A claim often ships as a pair — a statement file and a solution file — that declare
   the SAME names (a Comparator Challenge/Solution pair; a results file that restates the canonical definitions in the
   canonical namespace). The two cannot be loaded into one environment, so F1 as above cannot even be written. With
   `canonical.selfContained: true` the run builds, beside the canonical module, a COPY of the canonical file with one
   line added after its imports (`namespace IntakeCanon`): every declaration of the copy is IntakeCanon.<its name>,
   and it loads beside the claimant's file. Then:
     the copy is the canonical file: each declaration F1 uses is compared with the original's, constant by constant
         (types, definitions' values, inductive types), through everything the canonical file itself declares
         (Intake/WrapCheck.lean; a difference REFUSES);
     F1 is the same kernel check against the copy's declaration: the claimant's restated definitions must UNFOLD to
         the canonical ones (identity up to definitional unfolding, as always; a restated structure or inductive type
         is not definitionally the canonical one and is REFUSED);
     `canonical.axioms`: axioms the canonical file itself declares. The claimant's proof may rest on its own axioms of
         the same names only if each is the canonical one — the statement and every definition under it identical,
         name for name (Intake/Same.lean; structural, so a deep numerical definition is never unfolded). The verdict
         is then CONDITIONAL on those axioms, and says so; nothing here proves them;
     the planted statements are written in the copy's namespace, so their names are the canonical file's, and the
         claimant's term is named from the root.
   `intakeImports` (a list of modules) is imported first by the generated meta-programs, which otherwise import only
   Lean: a package that sets an option defined in a library for every module (Mathlib's linter set, say) cannot build
   a file that does not load that library.
   `claim.module` names the claimant's file when it is already a module of the canonical repository at the same
   commit: it is built in place, never copied. `LEAN_INTAKE_ROOT` reads specs and writes facts and records under
   another root than this repository (a claim not yet public); `LEAN_INTAKE_KEEP=1` keeps a checkout already at the
   pinned commit (several declarations of one repository, one build).

   RECORD FORMAT 2 (2026-11-11; a spec asks for it with `"format": 2`, written down in instruments/intake/SPEC.md).
   A spec without the field is decided exactly as before, so every earlier record re-derives byte for byte. What the
   first format got wrong, and format 2 changes:
     a planted statement that does not ELABORATE never reached the identity check, so it tests nothing: its outcome is
         DID NOT ELABORATE (an error in the statement itself) or FAILED elsewhere, it is shown, and it is counted
         neither as a refusal nor as a miss. "NOT ACCEPTED" is met only by a refusal at the claimant's term. The
         controls are CERTIFIED only on statements that reached the check, and only if one of them was refused;
     the cost is a fact (`cost <id> --usd … --what …` writes cost.json beside the run), never a constant; absent, the
         record says null;
     the machine is the container's limits where there are any (cgroup, the provider's declared size), beside the host's;
     the kernels this run did not run are named as this run's (another record may have run them);
     step seconds are summed over the steps the spec names, not over every file in the folder;
     no text names a plan or a phase.
   `preflight <id>` elaborates every planted statement ALONE (its `theorem s`, without the claimant's term) against
   the pinned canonical file, before the registered run: a statement that does not elaborate is found before the
   pre-registration, not inside it. It reveals no outcome of the identity check.

   usage: node tools/lean-intake.js preflight <id> [--day YYYY-MM-DD]
          node tools/lean-intake.js run <id> [--day YYYY-MM-DD] [--stages pin,toolchain,...]
          node tools/lean-intake.js cost <id> --usd 0.42 --what "RunPod cpu5c-16-32, 52 min" [--day YYYY-MM-DD]
          node tools/lean-intake.js record <id> [--check]
          node tools/lean-intake.js review <id>                                                                MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');
const crypto = require('crypto');

const ROOT = process.env.LEAN_INTAKE_ROOT ? path.resolve(process.env.LEAN_INTAKE_ROOT) : path.resolve(__dirname, '..');
const STD = ['Classical.choice', 'Quot.sound', 'propext'];
const STAGES = ['pin', 'toolchain', 'cache', 'canonical', 'assemble', 'claim', 'f1', 'f3', 'mutants', 'reds', 'leanchecker', 'nanoda', 'f2', 'f2eval', 'f2kernel'];
const NANODA = { url: 'https://github.com/ammkrn/nanoda_lib.git', commit: '8de7e0c4ed3052745a7f8725164efd9e76d84c56' };
const die = (m) => { console.error('lean-intake: ' + m); process.exit(1); };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const [cmd, id] = process.argv.slice(2);
const opt = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
if (!cmd || !id) die('usage: preflight|run|cost|record|review <id>');
const SPEC_PATH = path.join('corpus', 'lean-intake', id, 'spec.json');
if (!fs.existsSync(path.join(ROOT, SPEC_PATH))) die('no spec ' + SPEC_PATH);
const SPEC = JSON.parse(fs.readFileSync(path.join(ROOT, SPEC_PATH), 'utf8'));
const RUNS = path.join(ROOT, 'corpus', 'lean-intake', id, 'runs');
const OUT = path.join(ROOT, 'certs', 'lean-intake-' + id + '.json');
if (SPEC.format !== undefined && SPEC.format !== 2) die('spec.format is absent (the first format) or 2');
const V2 = SPEC.format === 2;
/* the steps a spec names: what a run writes and what format 2 sums */
const STEP_NAMES = () => ['pin-canonical', 'pin-claim', 'toolchain', 'cache', 'canonical', 'claim', 'wrapcheck', 'f1', 'f1report', 'same', 'f3']
  .concat(SPEC.mutants.map((m) => 'mut-' + m.id), (SPEC.claimReds || []).map((r) => 'red-' + r.id), ['leanchecker', 'lean4export-build', 'nanoda-build', 'export', 'nanoda'], SPEC.f2 ? ['f2', 'f2eval', 'f2kernel'] : []);
/* the machine a run had: the host's numbers, and the container's limits where there are any (cgroup v2, then v1; a
   provider's declared size). cpus and memGB are the smallest of what applies */
function machineFacts() {
  const rdn = (f) => { try { return fs.readFileSync(f, 'utf8').trim(); } catch (e) { return null; } };
  const host = { cpus: os.cpus().length, memGB: Math.round(os.totalmem() / 2 ** 30) };
  let lc = null, lm = null, source = null;
  const v2 = rdn('/sys/fs/cgroup/cpu.max'), m2 = rdn('/sys/fs/cgroup/memory.max');
  if (v2 || m2) {
    source = 'cgroup v2';
    if (v2 && !v2.startsWith('max')) { const [q, per] = v2.split(/\s+/).map(Number); if (q > 0 && per > 0) lc = q / per; }
    if (m2 && m2 !== 'max') lm = Number(m2) / 2 ** 30;
  } else {
    const q = Number(rdn('/sys/fs/cgroup/cpu/cpu.cfs_quota_us')), per = Number(rdn('/sys/fs/cgroup/cpu/cpu.cfs_period_us')), m1 = Number(rdn('/sys/fs/cgroup/memory/memory.limit_in_bytes'));
    if (q > 0 && per > 0) { lc = q / per; source = 'cgroup v1'; }
    if (m1 > 0 && m1 < os.totalmem()) { lm = m1 / 2 ** 30; source = 'cgroup v1'; }
  }
  const num = (v) => (v !== undefined && v !== '' && Number.isFinite(Number(v)) ? Number(v) : null);
  const declared = { cpus: num(process.env.RUNPOD_CPU_COUNT), memGB: num(process.env.RUNPOD_MEM_GB) };
  const least = (...xs) => Math.min(...xs.filter((x) => x !== null && x > 0));
  const r1 = (x) => (x === null ? null : Math.round(x * 10) / 10);
  return { platform: process.platform, arch: process.arch, cpus: r1(least(host.cpus, lc, declared.cpus, typeof os.availableParallelism === 'function' ? os.availableParallelism() : null)), memGB: r1(least(host.memGB, lm, declared.memGB)),
    host, limit: lc !== null || lm !== null ? { cpus: r1(lc), memGB: r1(lm), source } : null, declared: declared.cpus !== null || declared.memGB !== null ? Object.assign({ source: 'RUNPOD_CPU_COUNT / RUNPOD_MEM_GB' }, declared) : null };
}

/* ---- the Lean the run generates (from the spec alone) ---------------------------------------------------------- */
const claimStem = SPEC.claim.file.replace(/\.lean$/, '').replace(/[^A-Za-z0-9_]/g, '_');
/* the identity mode for self-contained files: every name below is the old one when the spec does not ask for it */
const WRAP = !!SPEC.canonical.selfContained, WRAP_NS = 'IntakeCanon';
const IN_PLACE = !!SPEC.claim.module;
if (IN_PLACE && (SPEC.claim.url !== SPEC.canonical.url || SPEC.claim.commit !== SPEC.canonical.commit)) die('claim.module needs the claimant\'s file in the canonical repository at the same commit');
const claimMod = IN_PLACE ? SPEC.claim.module : 'Intake.Claim.' + claimStem;
const canonStem = 'C_' + path.basename(SPEC.canonical.path, '.lean').replace(/[^A-Za-z0-9_]/g, '_');
const canonMod = WRAP ? 'Intake.Canon.' + canonStem : SPEC.canonical.module;
const canonDecl = (WRAP ? WRAP_NS + '.' : '') + SPEC.canonical.decl;
const claimRef = (WRAP ? '_root_.' : '') + SPEC.claim.decl;
const AXIOMS = (SPEC.canonical.axioms || []).map((a) => (typeof a === 'string' ? { canonical: a, claim: a } : a));
if (AXIOMS.length && !WRAP) die('canonical.axioms needs canonical.selfContained (the comparison is name for name)');
const PERMITTED = AXIOMS.map((a) => a.claim);
const INTAKE_IMPORTS = (SPEC.intakeImports || []).map((i) => `import ${i}\n`).join('');
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

/-- One JSON line appended to \`INTAKE_OUT\`; nothing when it is unset (a module build). -/
def emitLine (j : Json) : IO Unit := do
  if let some p := (← IO.getEnv "INTAKE_OUT") then
    IO.FS.withFile p .append fun h => h.putStrLn j.compress

def bits (l : List Bool) : String := String.mk (l.map fun b => if b then '1' else '0')

/-- F2: a statement's decidable parts. Its instance binders (the binders that are not propositions) become parameters,
each hypothesis and the conclusion a \`decide\`, in order. Binders are opened as written, never unfolded; a hypothesis
whose proof a later binder uses is refused. -/
partial def components {α : Type} (e : Expr) (data props : Array Expr) (k : Array Expr → Array Expr → MetaM α) : MetaM α := do
  match e with
  | .forallE n d b bi =>
    withLocalDecl n bi d fun x => do
      let b' := b.instantiate1 x
      if ← isProp d then
        if b'.containsFVar x.fvarId! then throwError "intake: a later binder uses the proof of the hypothesis {d}"
        components b' data (props.push d) k
      else components b' (data.push x) props k
  | .letE _ _ v b _ => components (b.instantiate1 v) data props k
  | .mdata _ e => components e data props k
  | _ =>
    if e.isAppOfArity \`\`letFun 4 then components (e.appArg!.bindingBody!.instantiate1 (e.getArg! 2)) data props k
    else k data (props.push e)

elab "intake_components " src:ident " => " dst:ident : command => do
  let some ci := (← getEnv).find? src.getId | throwError "intake: no declaration {src.getId}"
  let (value, type, pps, ds) ← liftTermElabM do
    components ci.type #[] #[] fun data props => do
      let decs ← props.mapM mkDecide
      let v ← mkLambdaFVars data (← mkListLit (mkConst \`\`Bool) decs.toList)
      let pps ← props.mapM fun q => do pure s!"{← ppExpr q}"
      let ds ← data.mapM fun x => do pure s!"{← ppExpr x} : {← ppExpr (← inferType x)}"
      pure (v, ← inferType v, pps, ds)
  let decl : DefinitionVal := { name := dst.getId, levelParams := ci.levelParams, type := type, value := value, hints := .abbrev, safety := .safe }
  liftCoreM <| addAndCompile (.defnDecl decl)
  emitLine <| Json.mkObj [("components", Json.str src.getId.toString), ("binders", toJson ds), ("parts", toJson pps)]

end Intake
`;
const IDENT = `import Lean
import Intake.Meta
open Lean Meta Elab Command

namespace Intake

/-- The name a constant of one file has in the other: the prefix added (the canonical file → its copy) or removed (the
copy → the claimant's file). A private name is rebuilt for the other module. -/
def counterpart (pre : Name) (add : Bool) (modB : Name) (c : Name) : Name :=
  let f := fun (u : Name) => if add then pre ++ u else u.replacePrefix pre Name.anonymous
  match privateToUserName? c with
  | some u => mkPrivateNameCore modB (f u)
  | none => f c

structure Same where
  env : Environment
  modA : ModuleIdx
  tr : Name → Name

def Same.inA (S : Same) (n : Name) : Bool := S.env.getModuleIdxFor? n == some S.modA

partial def Same.rename (S : Same) (e : Expr) : Expr :=
  e.replace fun
    | .const n ls => if S.inA n then some (.const (S.tr n) ls) else none
    | .proj s i b => if S.inA s then some (.proj (S.tr s) i (S.rename b)) else none
    | _ => none

/-- \`a\` and \`b\` are the same declaration, name for name: equal universe parameters, equal types and (for
definitions) equal values once every constant of \`a\`'s own module is given its counterpart's name, and the same for
every such constant in turn. Binder names are not compared. A theorem's proof is not part of what it says. -/
partial def Same.visit (S : Same) (top : Bool) (a b : Name) : StateT NameSet (Except String) Unit := do
  if (← get).contains a then return
  modify fun s => s.insert a
  let some x := S.env.find? a | throw s!"no constant {a}"
  let some y := S.env.find? b | throw s!"{a} has no counterpart {b}"
  unless x.levelParams == y.levelParams do throw s!"{a} and {b}: the universe parameters differ"
  unless S.rename x.type == y.type do throw s!"{a} and {b}: the types differ"
  let mut deps := x.type.getUsedConstants
  match x, y with
  | .defnInfo u, .defnInfo v =>
    unless S.rename u.value == v.value do throw s!"{a} and {b}: the definitions differ"
    deps := deps ++ u.value.getUsedConstants
  | .opaqueInfo u, .opaqueInfo v =>
    unless S.rename u.value == v.value do throw s!"{a} and {b}: the opaque definitions differ"
    deps := deps ++ u.value.getUsedConstants
  | .thmInfo _, .thmInfo _ => pure ()
  | .axiomInfo _, .axiomInfo _ => pure ()
  | .quotInfo _, .quotInfo _ => pure ()
  | .inductInfo u, .inductInfo v =>
    unless u.numParams == v.numParams && u.numIndices == v.numIndices && u.ctors.map S.tr == v.ctors && u.all.map S.tr == v.all do
      throw s!"{a} and {b}: the inductive types differ"
    deps := deps ++ u.ctors.toArray
  | .ctorInfo u, .ctorInfo v =>
    unless S.tr u.induct == v.induct && u.cidx == v.cidx && u.numParams == v.numParams && u.numFields == v.numFields do
      throw s!"{a} and {b}: the constructors differ"
    deps := deps.push u.induct
  | .recInfo u, .recInfo v =>
    unless u.all.map S.tr == v.all do throw s!"{a} and {b}: the recursors differ"
    deps := deps ++ u.all.toArray
  | _, _ => unless top do throw s!"{a} and {b}: different kinds of declaration"
  for d in deps do
    if S.inA d then S.visit false d (S.tr d)

/-- One JSON line: whether \`a\` and \`b\` are the same declaration (\`Same.visit\`), and through how many constants. -/
elab "intake_same " label:str mode:ident pre:ident a:ident " => " b:ident : command => do
  let env ← getEnv
  let an := a.getId
  let bn := b.getId
  let res : Except String Nat := do
    let some ma := env.getModuleIdxFor? an | throw s!"{an} is not an imported constant"
    let some ib := env.getModuleIdxFor? bn | throw s!"{bn} is not an imported constant"
    let some mb := env.header.moduleNames.find? (fun m => env.getModuleIdx? m == some ib) | throw s!"{bn}: no module"
    let S : Same := { env := env, modA := ma, tr := counterpart pre.getId (mode.getId == \`add) mb }
    let (_, seen) ← (S.visit true an bn).run {}
    pure seen.size
  let fields := match res with
    | .ok n => [("identical", Json.bool true), ("constants", toJson n)]
    | .error m => [("identical", Json.bool false), ("difference", Json.str m)]
  emitLine <| Json.mkObj ([("same", Json.str label.getString), ("a", Json.str an.toString), ("b", Json.str bn.toString)] ++ fields)

end Intake
`;
/* the copy of the canonical file: one line added after its last import, nothing else (comments are skipped to find it) */
function wrapCanonical(text) {
  const lines = text.split('\n');
  let depth = 0, last = -1;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    let out = '';
    for (let j = 0; j < l.length; j++) {
      if (l.startsWith('/-', j)) { depth++; j++; continue; }
      if (depth && l.startsWith('-/', j)) { depth--; j++; continue; }
      if (!depth && l.startsWith('--', j)) break;
      if (!depth) out += l[j];
    }
    const t = out.trim();
    if (!t) continue;
    if (/^((public|private|meta)\s+)*import(\s+all)?\s+\S/.test(t)) { last = i; continue; }
    if (/^(module|prelude)$/.test(t)) continue;
    break;
  }
  if (last < 0) die('the canonical file has no import line to add the namespace after');
  const out = lines.slice(0, last + 1).concat(['namespace ' + WRAP_NS], lines.slice(last + 1));
  if (out.filter((_, i) => i !== last + 1).join('\n') !== text) die('the copy is not the canonical file plus one line');
  return { text: out.join('\n'), line: last + 2 };
}
function generated() {
  const C = SPEC.canonical, imp = `import ${canonMod}\nimport ${claimMod}\n`;
  const files = {
    'Intake/Meta.lean': INTAKE_IMPORTS + META,
    'Intake/F1.lean': imp + `\n/-! F1: the canonical statement, taken from its declaration by type_of%, and the claimant's proof. -/\ntheorem Intake.f1 : ${neg}(type_of% @${canonDecl}) := ${claimRef}\n\n#print axioms Intake.f1\n`,
    'Intake/F1Report.lean': `import Intake.F1\nimport Intake.Meta\nopen Lean Meta\n\n#eval show MetaM Unit from do\n  let env ← getEnv\n`
      + `  let some can := env.find? "${canonDecl}".toName | throwError "intake: no canonical declaration"\n`
      + `  let some cl := env.find? "${SPEC.claim.decl}".toName | throwError "intake: no claimant declaration"\n`
      + `  let target := ${neg ? 'mkNot can.type' : 'can.type'}\n  let defeq ← isDefEq cl.type target\n`
      + `  Intake.emit <| Json.mkObj [("canonical", Json.str s!"{← ppExpr can.type}"), ("claim", Json.str s!"{← ppExpr cl.type}"),\n`
      + `    ("equal", Json.bool (cl.type.equal target)), ("eqv", Json.bool (cl.type.eqv target)), ("defeq", Json.bool defeq),\n`
      + `    ("canonicalLevelParams", toJson can.levelParams.toArray), ("claimLevelParams", toJson cl.levelParams.toArray)]\n`,
    'Intake/F3.lean': (WRAP && SPEC.f3.withClaim ? imp : `import ${C.module}\n`) + `import Intake.Meta\n\n/-! F3: the canonical statement's hypotheses have a model. -/\nintake_hypotheses ${WRAP && SPEC.f3.withClaim ? canonDecl : C.decl} => Intake.F3.target\n\n`
      + `theorem Intake.f3 : ¬ Intake.F3.target := by\n  ${SPEC.f3.tactic}\n\n#print axioms Intake.f3\n`,
  };
  const cLine = {};
  for (const m of SPEC.mutants) {
    const ns = (WRAP ? WRAP_NS + '.' : '') + (SPEC.mutantNamespace || 'Intake.Mut') + '.' + m.id;   /* inside the canonical namespace, its dot notation resolves */
    const head = imp + (m.imports || []).map((i) => `import ${i}\n`).join('') + `\n/-! ${m.id} (${m.kind}): ${m.why.replace(/-\//g, '- /')} -/\nnamespace ${ns}\n` + (SPEC.mutantOpen || []).map((o) => `open ${o}\n`).join('');
    const body = `theorem s : ${m.statement} := by\n  sorry\n`;
    cLine[m.id] = (head + body).split('\n').length;
    files[`Intake/Mut/${m.id}.lean`] = head + body + `theorem c : ${neg}(type_of% @s) := ${claimRef}\nend ${ns}\n`;
  }
  if (WRAP) {
    /* the copy against the original (the two load together: the copy's names are prefixed), and the copy against the claimant's file */
    const pairs = [C.decl].concat(AXIOMS.map((a) => a.canonical));
    files['Intake/Ident.lean'] = IDENT;
    files['Intake/WrapCheck.lean'] = `import ${C.module}\nimport ${canonMod}\nimport Intake.Ident\n\n/-! The copy of the canonical file is the canonical file: each declaration F1 uses, constant by constant. -/\n`
      + pairs.map((d) => `intake_same "wrap" add ${WRAP_NS} ${d} => ${WRAP_NS}.${d}\n`).join('');
    files['Intake/Same.lean'] = imp + `import Intake.Ident\n\n/-! The claimant's declarations against the canonical copy's, name for name (no unfolding). -/\n`
      + (neg ? '' : `intake_same "statement" strip ${WRAP_NS} ${canonDecl} => ${SPEC.claim.decl}\n`)
      + AXIOMS.map((a) => `intake_same "axiom" strip ${WRAP_NS} ${WRAP_NS}.${a.canonical} => ${a.claim}\n`).join('');
  }
  if (SPEC.f2) {
    const F2 = SPEC.f2, app = (c) => F2.apply.replace('COMP', c);
    files['Intake/F2.lean'] = `import ${C.module}\nimport Intake.Meta\n\n/-! F2: the canonical statement's own parts, and the pre-registered instances. -/\nintake_components ${C.decl} => Intake.F2.can\n\n`
      + `def Intake.F2.instances : List (${F2.instanceType}) :=\n  ${F2.instances}\n`;
    const muts = SPEC.mutants;
    files['Intake/F2Eval.lean'] = `import Intake.F2\n` + [...new Set(muts.flatMap((m) => m.imports || []))].map((i) => `import ${i}\n`).join('')
      + `open Lean\n\n/-! F2, evaluated by the interpreter: the canonical statement and every planted one, part by part, on every instance. -/\n`
      + `def Intake.F2.rows (f : ${F2.instanceType} → List Bool) : Json :=\n  Json.arr (Intake.F2.instances.map fun x => Json.arr #[(${F2.instanceJson}) x, Json.str (Intake.bits (f x))]).toArray\n\n`
      + `intake_components ${C.decl} => Intake.F2E.can\n`
      + `#eval Intake.emitLine (Json.mkObj [("statement", Json.str "canonical"), ("rows", Intake.F2.rows (${app('Intake.F2.can')}))])\n`
      + muts.map((m) => `\nnamespace Intake.F2M.${m.id}\n` + (SPEC.mutantOpen || []).map((o) => `open ${o}\n`).join('') + `theorem s : ${m.statement} := by\n  sorry\nend Intake.F2M.${m.id}\n`
        + `intake_components Intake.F2M.${m.id}.s => Intake.F2M.${m.id}.comp\n`
        + `#eval Intake.emitLine (Json.mkObj [("statement", Json.str "${m.id}"), ("rows", Intake.F2.rows (${app(`Intake.F2M.${m.id}.comp`)}))])\n`).join('');
  }
  return { files, cLine };
}
/* the kernel's confirmation of the canonical statement's values: one theorem per chunk, the values the interpreter gave */
function f2KernelFile(rows) {
  const F2 = SPEC.f2, k = F2.chunk, out = ['import Intake.F2', '', '/-! F2: the kernel evaluates the canonical statement\'s parts on every instance (decide +kernel). -/'];
  for (let i = 0; i * k < rows.length; i++) {
    const vals = rows.slice(i * k, (i + 1) * k).map((r) => '[' + r[1].split('').map((b) => (b === '1' ? 'true' : 'false')).join(', ') + ']');
    out.push(`theorem Intake.f2_${i} : ((Intake.F2.instances.drop ${i * k}).take ${k}).map (${F2.apply.replace('COMP', 'Intake.F2.can')}) =\n    [${vals.join(',\n     ')}] := by\n  decide +kernel`);
  }
  return out.join('\n\n') + '\n';
}
function redBytes(claimText, r) {
  const n = claimText.split(r.find).length - 1;
  if (n === 0 || (!r.all && n !== 1)) die(`planted claim ${r.id}: its text occurs ${n} times in the claimant's file`);
  return (r.all ? claimText.split(r.find).join(r.replace) : claimText.replace(r.find, r.replace)) + `\n#print axioms ${SPEC.claim.decl}\n`;
}

/* ---- several independent files at once ---------------------------------------------------------------------------
   LEAN_INTAKE_JOBS=N (default 1): the planted statements, each a file that imports only modules already built, are
   elaborated N at a time by `lake env lean <file>` instead of one `lake build` after another. Each still writes its
   own log, exit and seconds; the seconds are then per file under load, and their sum is processor time, not the clock's.
   The pool runs in a child of this same file (`__pool`), because the run itself is synchronous. */
const JOBS = Math.max(1, Math.floor(Number(process.env.LEAN_INTAKE_JOBS || 1)) || 1);
function runPool(tasks, outDir, jobs) {
  const f = path.join(os.tmpdir(), 'lean-intake-pool-' + process.pid + '.json');
  fs.writeFileSync(f, JSON.stringify({ tasks, outDir, jobs }));
  const r = cp.spawnSync(process.execPath, [__filename, '__pool', id, f], { stdio: 'inherit' });
  fs.rmSync(f, { force: true });
  if (r.status !== 0) die('the pool of ' + tasks.length + ' files did not finish');
}
function pool() {
  const { tasks, outDir, jobs } = JSON.parse(fs.readFileSync(process.argv[4], 'utf8'));
  const status = (m) => { fs.appendFileSync(path.join(outDir, '_status.txt'), new Date().toISOString() + ' ' + m + '\n'); console.log(m); };
  let next = 0, live = 0, done = 0;
  const one = () => {
    if (next >= tasks.length) { if (!live) process.exit(0); return; }
    const t = tasks[next++]; live++;
    status('start ' + t.name);
    const t0 = Date.now(), chunks = [];
    const c = cp.spawn('bash', ['-c', t.command + ' 2>&1'], { cwd: t.cwd, env: process.env });
    const killer = setTimeout(() => c.kill('SIGKILL'), (t.seconds || 3600) * 1000);
    c.stdout.on('data', (d) => chunks.push(d));
    c.on('close', (code, signal) => {
      clearTimeout(killer);
      const exit = code === null ? (signal || 'timeout') : code;
      fs.writeFileSync(path.join(outDir, t.name + '.log'), Buffer.concat(chunks));
      fs.writeFileSync(path.join(outDir, t.name + '.exit'), String(exit) + '\n');
      fs.writeFileSync(path.join(outDir, t.name + '.seconds'), ((Date.now() - t0) / 1000).toFixed(1) + '\n');
      status('end ' + t.name + ' exit ' + exit + ' (' + (++done) + ' of ' + tasks.length + ')');
      live--; one();
    });
  };
  for (let i = 0; i < Math.min(jobs, tasks.length); i++) one();
}

/* ---- run ------------------------------------------------------------------------------------------------------- */
function run() {
  const day = opt('--day') || new Date().toISOString().slice(0, 10);
  const want = opt('--stages') ? opt('--stages').split(',') : STAGES;
  for (const s of want) if (!STAGES.includes(s)) die('unknown stage ' + s);
  const FACTS = path.join(RUNS, day); fs.mkdirSync(FACTS, { recursive: true });
  const WORK = process.env.LEAN_INTAKE_WORK || path.join(os.homedir(), 'Projects', 'lean-intake-work', id);
  fs.mkdirSync(WORK, { recursive: true });
  const CAN = path.join(WORK, 'canonical'), CLM = IN_PLACE ? CAN : path.join(WORK, 'claim'), TOOLS = path.join(WORK, 'tools');
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
      /* LEAN_INTAKE_KEEP=1: a checkout already at the pinned commit is kept (its build with it); the file's bytes are checked below either way */
      const keep = process.env.LEAN_INTAKE_KEEP === '1' ? `[ "$(git -C canonical rev-parse HEAD 2>/dev/null)" = "${C.commit}" ] || ` : '';
      step('pin-canonical', WORK, `${keep}(rm -rf canonical && git clone -q --filter=blob:none ${C.url} canonical && git -C canonical checkout -q ${C.commit}) && git -C canonical rev-parse HEAD`);
      if (IN_PLACE) step('pin-claim', WORK, 'git -C canonical rev-parse HEAD');
      else step('pin-claim', WORK, `rm -rf claim && git clone -q ${SPEC.claim.url} claim && git -C claim checkout -q ${SPEC.claim.commit} && git -C claim rev-parse HEAD`);
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
      /* a failed cache download must stop the run: the next stage would compile Mathlib from source, for hours */
      /* the download clones the package's dependencies from GitHub, which refuses a clone now and then (the run pod of
         2026-11-11 died here on "could not read Username"): four tries, a minute apart, each kept in its own log */
      let got = false;
      for (let t = 1; t <= 4 && !got; t++) {
        got = step('cache', CAN, 'lake exe cache get', 3600);
        if (!got && t < 4) { fs.copyFileSync(path.join(FACTS, 'cache.log'), path.join(FACTS, 'cache-try' + t + '.log')); status('cache: try ' + t + ' failed, waiting 60 s'); cp.spawnSync('sleep', ['60']); }
      }
      if (!got) die('lake exe cache get failed four times (see cache.log): stopped before the canonical build; run the stage again');
    } else if (s === 'canonical') {
      step('canonical', CAN, `lake build '${C.module}'`);
    } else if (s === 'assemble') {
      const { files } = generated();
      const lib = path.join(CAN, 'Intake');
      fs.rmSync(lib, { recursive: true, force: true });
      fs.mkdirSync(path.join(lib, 'Claim'), { recursive: true }); fs.mkdirSync(path.join(lib, 'Mut'), { recursive: true }); fs.mkdirSync(path.join(lib, 'Red'), { recursive: true });
      const claimText = fs.readFileSync(path.join(CLM, SPEC.claim.file), 'utf8');
      if (!IN_PLACE) fs.copyFileSync(path.join(CLM, SPEC.claim.file), path.join(lib, 'Claim', claimStem + '.lean'));
      let wrap = null;
      if (WRAP) {
        const canText = fs.readFileSync(path.join(CAN, C.path), 'utf8'), w = wrapCanonical(canText);
        fs.mkdirSync(path.join(lib, 'Canon'), { recursive: true });
        fs.writeFileSync(path.join(lib, 'Canon', canonStem + '.lean'), w.text);
        wrap = { canonicalSha256: sha(Buffer.from(canText, 'utf8')), copy: 'Intake/Canon/' + canonStem + '.lean', copySha256: sha(Buffer.from(w.text, 'utf8')), addedLine: w.line, added: 'namespace ' + WRAP_NS, check: 'the copy without that line is the canonical file, byte for byte' };
      }
      for (const [f, b] of Object.entries(files)) fs.writeFileSync(path.join(CAN, f), b);
      for (const r of SPEC.claimReds || []) fs.writeFileSync(path.join(lib, 'Red', r.id + '.lean'), redBytes(claimText, r));
      const toml = path.join(CAN, 'lakefile.toml');
      if (!fs.existsSync(toml)) die('the canonical repository has no lakefile.toml (a lakefile.lean is not handled yet)');
      if (!/name = "Intake"/.test(fs.readFileSync(toml, 'utf8'))) fs.appendFileSync(toml, '\n[[lean_lib]]\nname = "Intake"\n');
      const shas = {};
      for (const f of (IN_PLACE ? [] : ['Claim/' + claimStem + '.lean']).concat(WRAP ? ['Canon/' + canonStem + '.lean'] : [], Object.keys(files).map((f) => f.slice('Intake/'.length)), (SPEC.claimReds || []).map((r) => 'Red/' + r.id + '.lean'))) shas[f] = sha(fs.readFileSync(path.join(lib, f)));
      fs.writeFileSync(path.join(FACTS, 'assemble.json'), JSON.stringify(wrap ? { files: shas, wrap } : { files: shas }, null, 1) + '\n');
      status('assembled ' + Object.keys(shas).length + ' files');
    } else if (s === 'claim') {
      step('claim', CAN, `lake build ${claimMod}`);
    } else if (s === 'f1') {
      if (WRAP) {
        fs.rmSync(path.join(FACTS, 'wrapcheck.jsonl'), { force: true }); fs.rmSync(path.join(FACTS, 'same.jsonl'), { force: true });
        step('wrapcheck', CAN, `lake build Intake.Ident ${canonMod} && lake env lean Intake/WrapCheck.lean`, 3600, { INTAKE_OUT: path.join(FACTS, 'wrapcheck.jsonl') });
      }
      if (step('f1', CAN, 'lake build Intake.F1')) step('f1report', CAN, 'lake build Intake.Meta && lake env lean Intake/F1Report.lean', 1800, { INTAKE_OUT: path.join(FACTS, 'f1report.json') });
      if (WRAP) step('same', CAN, `lake build Intake.Ident ${canonMod} ${claimMod} && lake env lean Intake/Same.lean`, 3600, { INTAKE_OUT: path.join(FACTS, 'same.jsonl') });
    } else if (s === 'f3') {
      step('f3', CAN, 'lake build Intake.F3');
    } else if (s === 'mutants') {
      if (JOBS === 1) for (const m of SPEC.mutants) step('mut-' + m.id, CAN, `lake build Intake.Mut.${m.id}`, 3600);
      else {
        /* everything a planted file imports is built first, once; then the files alone, JOBS at a time */
        const deps = [...new Set([canonMod, claimMod].concat(SPEC.mutants.flatMap((m) => m.imports || [])))];
        if (!step('mut-imports', CAN, `lake build ${deps.join(' ')}`, 7200)) die('the planted statements\' imports did not build');
        runPool(SPEC.mutants.map((m) => ({ name: 'mut-' + m.id, cwd: CAN, command: `lake env lean Intake/Mut/${m.id}.lean`, seconds: 3600 })), FACTS, JOBS);
      }
    } else if (s === 'reds') {
      for (const r of SPEC.claimReds || []) step('red-' + r.id, CAN, `lake build Intake.Red.${r.id}`, 3600);
    } else if ((s === 'f2' || s === 'f2eval' || s === 'f2kernel') && !SPEC.f2) {
      continue;   /* a spec without F2 has no Intake.F2 to build (the first runs built it anyway and recorded a failing step) */
    } else if (s === 'f2') {
      step('f2', CAN, 'lake build Intake.F2', 3600);
    } else if (s === 'f2eval') {
      if (!ok('f2')) { status('skip f2eval: Intake.F2 did not build'); continue; }
      fs.rmSync(path.join(FACTS, 'f2eval.jsonl'), { force: true });
      step('f2eval', CAN, 'lake env lean Intake/F2Eval.lean', 7200, { INTAKE_OUT: path.join(FACTS, 'f2eval.jsonl') });
    } else if (s === 'f2kernel') {
      const lines = fs.existsSync(path.join(FACTS, 'f2eval.jsonl')) ? fs.readFileSync(path.join(FACTS, 'f2eval.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l)) : [];
      const can = lines.find((l) => l.statement === 'canonical');
      if (!can) { status('skip f2kernel: no canonical rows from f2eval'); continue; }
      const body = f2KernelFile(can.rows);
      fs.writeFileSync(path.join(CAN, 'Intake', 'F2Kernel.lean'), body);
      fs.writeFileSync(path.join(FACTS, 'f2kernel.sha256'), sha(body) + '\n');
      step('f2kernel', CAN, 'lake build Intake.F2Kernel', 7200);
    } else if (s === 'leanchecker') {
      if (!ok('f1')) { status('skip leanchecker: f1 did not build'); continue; }
      step('leanchecker', CAN, `lake env "${binDir()}/leanchecker" --verbose Intake.F1`, 7200);
    } else if (s === 'nanoda') {
      if (!ok('f1')) { status('skip nanoda: f1 did not build'); continue; }
      const ver = C.toolchain.split(':')[1];
      step('lean4export-build', WORK, `rm -rf tools/lean4export && mkdir -p tools && git clone -q https://github.com/leanprover/lean4export tools/lean4export && cd tools/lean4export && (git checkout -q ${(SPEC.tools && SPEC.tools.lean4export) || ver} 2>/dev/null || git checkout -q "$(git tag --list '${ver.replace(/\.\d+$/, '')}*' | tail -1)") && git log --oneline -1 && echo ${C.toolchain} > lean-toolchain && lake build && ls .lake/build/bin`, 3600);
      step('nanoda-build', WORK, `rm -rf tools/nanoda_lib && mkdir -p tools && git clone -q ${NANODA.url} tools/nanoda_lib && cd tools/nanoda_lib && git checkout -q ${NANODA.commit} && cargo build --release --locked -q && shasum -a 256 target/release/nanoda_bin`, 3600);
      if (!ok('lean4export-build') || !ok('nanoda-build')) continue;
      const exp = path.join(WORK, 'f1.export');
      step('export', CAN, `lake env "${TOOLS}/lean4export/.lake/build/bin/lean4export" Intake.F1 -- Intake.f1 > "${exp}" && shasum -a 256 "${exp}" && wc -c < "${exp}"`, 7200);
      if (!ok('export')) continue;
      fs.writeFileSync(path.join(WORK, 'nanoda.json'), JSON.stringify({ export_file_path: exp, use_stdin: false, permitted_axioms: ['propext', 'Quot.sound', 'Classical.choice'].concat(PERMITTED), unpermitted_axiom_hard_error: false, nat_extension: true, string_extension: true, num_threads: 8, print_success_message: true, stack_size_bytes: 1073741824 }) + '\n');
      step('nanoda', WORK, `"${TOOLS}/nanoda_lib/target/release/nanoda_bin" nanoda.json`, 7200);
    }
  }
  fs.writeFileSync(path.join(FACTS, 'machine.json'), JSON.stringify(V2 ? Object.assign(machineFacts(), JOBS > 1 ? { plantedStatementsAtOnce: JOBS } : {}) : { platform: process.platform, arch: process.arch, cpus: os.cpus().length, memGB: Math.round(os.totalmem() / 2 ** 30) }, null, 1) + '\n');
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
  if (IN_PLACE ? pin.claim.sha256 !== SPEC.claim.sha256 : asm.files['Claim/' + claimStem + '.lean'] !== SPEC.claim.sha256) die('the run built another claimant file than the pin');

  const f1log = rd('f1.log'), f1ax = axioms(f1log, 'Intake.f1');
  const rep = has('f1report.json') ? JSON.parse(rd('f1report.json')) : null;
  const F1 = { exit: exit('f1'), axioms: f1ax, report: rep && { equal: rep.equal, eqv: rep.eqv, defeq: rep.defeq }, canonical: rep && rep.canonical, claim: rep && rep.claim, seconds: secs('f1') };
  /* self-contained files: the copy is the canonical file, and each axiom the proof rests on is the canonical file's own */
  let SC = null;
  if (WRAP) {
    const jl = (n) => (has(n) ? rd(n).trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
    const wc = jl('wrapcheck.jsonl'), sm = jl('same.jsonl');
    const row = (L, label, a, b) => { const l = L.find((x) => x.same === label && x.a === a && x.b === b); return { identical: !!(l && l.identical === true), constants: l && l.constants !== undefined ? l.constants : null, difference: l ? l.difference || null : 'not compared' }; };
    const copy = [SPEC.canonical.decl].concat(AXIOMS.map((a) => a.canonical)).map((d) => Object.assign({ decl: d }, row(wc, 'wrap', d, WRAP_NS + '.' + d)));
    const axs = AXIOMS.map((a) => Object.assign({ canonical: a.canonical, claim: a.claim }, row(sm, 'axiom', WRAP_NS + '.' + a.canonical, a.claim)));
    const bytes = !!asm.wrap && asm.wrap.canonicalSha256 === SPEC.canonical.sha256 && asm.files['Canon/' + canonStem + '.lean'] === asm.wrap.copySha256;
    SC = { copy: asm.wrap || null, copyIsCanonical: { bytes, exit: exit('wrapcheck'), declarations: copy, word: bytes && exit('wrapcheck') === '0' && copy.every((r) => r.identical) ? 'CERTIFIED' : 'REFUSED' },
      statementAsWritten: neg ? null : row(sm, 'statement', canonDecl, SPEC.claim.decl),
      axioms: { exit: exit('same'), pairs: axs, word: !AXIOMS.length ? 'none declared' : exit('same') === '0' && axs.every((r) => r.identical) ? 'CERTIFIED' : 'REFUSED' },
      conditionalOn: AXIOMS.map((a) => a.canonical) };
  }
  const f1std = !!f1ax && f1ax.every((a) => STD.includes(a) || PERMITTED.includes(a));
  F1.word = F1.exit === '0' && f1std && rep && rep.defeq && (!SC || (SC.copyIsCanonical.word === 'CERTIFIED' && SC.axioms.word !== 'REFUSED')) ? 'CERTIFIED' : 'REFUSED';
  F1.how = F1.word === 'CERTIFIED' ? `the kernel accepts the claimant's ${SPEC.claim.decl} as a proof of ${neg}${SPEC.canonical.decl}'s own type (taken by type_of%); `
    + (rep.equal ? 'the two types are equal as expressions' : rep.eqv ? 'the two types are equal up to binder names' : 'the two types differ as written and agree after definitional unfolding') : 'see the log';

  if (SC) {
    F1.selfContained = SC;
    if (F1.word === 'CERTIFIED') F1.how += `; the statement is read from a copy of the canonical file with one line added after its imports (\`namespace ${WRAP_NS}\`: the two files declare the same names and cannot be loaded together), and each declaration used is the original's, constant by constant (${SC.copyIsCanonical.declarations.map((r) => r.constants).join(', ')} constants)`
      + (AXIOMS.length ? `; CONDITIONAL on the canonical file's own axioms ${SC.conditionalOn.join(', ')}: the claimant's proof rests on its axioms of those names, and each is the canonical one, its statement and every definition under it identical name for name (${SC.axioms.pairs.map((r) => r.constants).join(', ')} constants)` : '');
  }
  const f3log = rd('f3.log'), f3ax = axioms(f3log, 'Intake.f3');
  const F3 = { exit: exit('f3'), axioms: f3ax, witness: SPEC.f3.what, seconds: secs('f3') };
  F3.word = F3.exit === '0' && f3ax && f3ax.every((a) => STD.includes(a)) ? 'CERTIFIED' : 'REFUSED';

  const mutants = SPEC.mutants.map((m) => {
    const n = 'mut-' + m.id, log = rd(n + '.log'), e = exit(n), errs = errors(log, `Intake/Mut/${m.id}.lean`);
    const atC = errs.length > 0 && errs.every((x) => x.line === cLine[m.id]) && errs.some((x) => /type mismatch/i.test(x.text));
    /* format 2: an error before the claimant's term is an error in the planted statement itself — it did not elaborate */
    const outcome = e === '0' ? 'ACCEPTED' : atC ? 'REFUSED by type mismatch' : V2 && errs.some((x) => x.line < cLine[m.id]) ? 'DID NOT ELABORATE' : 'FAILED elsewhere';
    const tested = outcome === 'ACCEPTED' || outcome === 'REFUSED by type mismatch';
    /* claimbox's words (its spec's `vocabulary`): "kernel decides" predicts nothing — the outcome is recorded, never a miss;
       "NOT ACCEPTED" is met by a refusal or (the first format only) by a statement that does not elaborate. Format 2: a
       statement that did not reach the check is not tested — its prediction is neither met nor missed (null) */
    const asExp = m.expect === 'kernel decides' ? true : V2 && !tested ? null : m.expect === 'NOT ACCEPTED' ? (V2 ? outcome === 'REFUSED by type mismatch' : outcome !== 'ACCEPTED') : outcome === m.expect;
    const row = { id: m.id, kind: m.kind, why: m.why, expect: m.expect, outcome, asExpected: asExp, errors: errs.slice(0, 3), seconds: secs(n) };
    if (V2) row.tested = tested;
    if (m.rule) Object.assign(row, { rule: m.rule, predicted: m.expect !== 'kernel decides', aligned: !!m.aligned });
    if (m.amendment) row.amendment = m.amendment;
    if (m.preregistered) Object.assign(row, { preregistered: m.preregistered, asPreregistered: outcome === m.preregistered.expect });
    return row;
  });
  const reds = (SPEC.claimReds || []).map((r) => {
    const n = 'red-' + r.id, log = rd(n + '.log'), e = exit(n), ax = axioms(log, SPEC.claim.decl);
    const extra = ax ? ax.filter((a) => !STD.includes(a) && !PERMITTED.includes(a)) : null;
    const caught = e !== '0' || (extra && extra.length > 0);
    return { id: r.id, why: r.why, expect: r.expect, exit: e, nonstandardAxioms: extra, caught, how: e !== '0' ? 'the build fails: ' + ((errors(log, `Intake/Red/${r.id}.lean`)[0] || {}).text || 'see the log') : caught ? 'the axioms list ' + extra.join(', ') : 'NOT CAUGHT', seconds: secs(n) };
  });

  const kernels = [{ name: 'Lean (the build of Intake.F1)', word: F1.exit === '0' ? 'ACCEPTS' : 'REJECTS OR STOPPED', seconds: secs('f1') }];
  /* a toolchain that ships no leanchecker (v4.27.0): the step could not start — not run, never a kernel that did not accept */
  const lcAbsent = has('leanchecker.log') && /could not execute external process/.test(rd('leanchecker.log'));
  if (exit('leanchecker') !== null && !lcAbsent) kernels.push({ name: 'leanchecker --verbose Intake.F1 (bundled with ' + SPEC.canonical.toolchain.split(':')[1] + ')', word: exit('leanchecker') === '0' ? 'ACCEPTS' : 'REJECTS OR STOPPED', seconds: secs('leanchecker') });
  if (exit('nanoda') !== null) {
    const nl = rd('nanoda.log');
    const ex = has('export.log') ? rd('export.log').trim().split('\n') : [];
    kernels.push({ name: 'nanoda ' + NANODA.commit.slice(0, 8) + ' on the lean4export export of Intake.f1', word: exit('nanoda') === '0' && /checked|success/i.test(nl) ? 'ACCEPTS' : 'REJECTS OR STOPPED', export: { sha256: (ex.find((l) => /^[0-9a-f]{64}\s/.test(l)) || '').slice(0, 64) || null, bytes: Number(ex[ex.length - 1]) || null }, seconds: secs('nanoda') });
  }
  /* F2: the canonical statement's parts against the informal decider, instance by instance */
  let F2 = null;
  if (SPEC.f2 && SPEC.f2.table) {
    /* F2 against claimbox's reading: its table (one row per instance and reading, each part T, F or -, the claim last),
       copied beside the spec by LIFT-claimbox-intake.json and held to the sha256 the spec names. Each canonical hypothesis
       is the reading's assumption whose values it equals wherever the assumption is defined (truth table), or "added";
       an assumption no hypothesis equals is "missing"; the conclusion is compared with the claim where the claim is
       defined; a disagreement of the whole implication is explained when an added hypothesis is false there and the
       sentence is false there. Then F2 ⇒ F1: an aligned planted statement with a part that differs from the canonical's
       on an instance is not definitionally equal to it, so F1 must have refused it. */
    const tb = fs.readFileSync(path.join(ROOT, path.dirname(SPEC_PATH), 'reading.json'));
    if (sha(tb) !== SPEC.f2.table.sha256) die('the reading table beside the spec is not the bytes the spec names');
    const T = JSON.parse(tb.toString('utf8'));
    const lines = has('f2eval.jsonl') ? rd('f2eval.jsonl').trim().split('\n').map((l) => JSON.parse(l)) : [];
    const can = lines.find((l) => l.statement === 'canonical');
    const parts = (lines.find((l) => l.components === SPEC.canonical.decl) || {}).parts || null;
    const key = (x) => JSON.stringify(x);
    const sameEnum = !!can && T.readings.every((r) => r.rows.length === can.rows.length && r.rows.every((x, i) => key(x[0]) === key(can.rows[i][0])));
    const compare = (rows, rr, assumes) => {
      const k = rows[0][1].length - 1, val = rr.map((r) => r[1].split('').map((c) => (c === '-' ? null : c === 'T')));
      const match = [];
      for (let j = 0; j < k; j++) match.push(assumes.map((_, i) => i).filter((i) => val.some((v) => v[i] !== null) && val.every((v, q) => v[i] === null || v[i] === (rows[q][1][j] === '1'))));
      const added = [...Array(k).keys()].filter((j) => !match[j].length);
      const missing = assumes.filter((_, i) => !match.some((mj) => mj.includes(i)));
      let cc = 0, cd = 0, und = 0, ic = 0, idis = 0, ex = 0;
      const why = new Set(), inst = new Set(), first = [];
      val.forEach((v, q) => {
        const bits = rows[q][1].split('').map((b) => b === '1'), c = v[v.length - 1];
        if (c === null) und++; else { cc++; if (c !== bits[k]) { cd++; if (first.length < 3) first.push(rows[q][0]); } }
        const li = bits.slice(0, k).every(Boolean) ? bits[k] : true;
        const hs = v.slice(0, -1), ri = hs.some((h) => h === false) ? true : hs.some((h) => h === null) ? null : c;
        if (ri !== null) {
          ic++;
          if (li !== ri) { idis++; const off = added.filter((j) => !bits[j]); if (off.length && ri === false) { ex++; off.forEach((j) => why.add(j)); inst.add((Object.keys(SPEC.f2.binders || {})[0] || 'x') + ' = ' + JSON.stringify(rows[q][0][0])); } }
        }
      });
      const nm = (j) => (parts ? parts[j] : String(j));
      return { map: Object.fromEntries([...Array(k).keys()].map((j) => [nm(j), match[j].length ? match[j].map((i) => assumes[i]) : 'added'])), added: added.map(nm), missing,
        conclusion: { compared: cc, disagreements: cd, undefinedInReading: und, first }, implication: { compared: ic, disagreements: idis, explained: ex, explainedBy: [...why].sort((a, b) => a - b).map(nm), explainedInstances: [...inst].sort() } };
    };
    const readings = can && parts ? T.readings.map((r) => {
      const c = compare(can.rows, r.rows, r.parts.slice(0, -1));
      const ok = !c.missing.length && c.conclusion.disagreements === 0 && c.implication.disagreements === c.implication.explained;
      return Object.assign({ reading: r.reading, word: ok ? 'AGREES' : 'DISAGREES' }, c);
    }) : [];
    const kernelSha = has('f2kernel.sha256') ? rd('f2kernel.sha256').trim() : null;
    const kernelOk = !!can && exit('f2kernel') === '0' && kernelSha === sha(f2KernelFile(can.rows));
    const f1of = Object.fromEntries(mutants.map((m) => [m.id, m.outcome]));
    const planted = SPEC.mutants.map((m) => {
      const L = lines.find((l) => l.statement === m.id);
      if (!L) return { id: m.id, rows: false, aligned: !!m.aligned, outcome: f1of[m.id], mustRefuse: false, holds: true };
      const alignedInLean = !!m.aligned && L.rows[0][1].length === can.rows[0][1].length;
      const diff = L.rows.filter((r, i) => r[1] !== can.rows[i][1]).length;
      const must = alignedInLean && diff > 0;
      return { id: m.id, rows: true, aligned: !!m.aligned, alignedInLean, instancesWithADifferingPart: diff, outcome: f1of[m.id], mustRefuse: must, holds: !must || f1of[m.id] !== 'ACCEPTED' };
    });
    const f1 = { mustRefuse: planted.filter((p) => p.mustRefuse).length, holds: planted.every((p) => p.holds), alignmentMisses: planted.filter((p) => p.rows && p.aligned && !p.alignedInLean).map((p) => p.id) };
    const ok = sameEnum && !!parts && readings.length > 0 && readings.every((r) => r.word === 'AGREES') && kernelOk && f1.holds;
    F2 = { informal: SPEC.f2.informal, reading: SPEC.f2.reading, table: SPEC.f2.table, instances: can ? can.rows.length : 0, sameEnumeration: sameEnum, canonicalParts: parts,
      readings, kernel: { confirmed: kernelOk, chunks: can ? Math.ceil(can.rows.length / SPEC.f2.chunk) : 0, seconds: secs('f2kernel') },
      f1, planted, limits: ['F2 compares truth values on finitely many instances: a change that never flips one there is invisible to it', 'where the reading is undefined (a division by zero, an instance outside a given\'s type) nothing is compared; Lean\'s conventions decide those instances'],
      word: ok ? 'CERTIFIED' : 'REFUSED' };
  } else if (SPEC.f2) {
    const D = require(path.join(ROOT, SPEC.f2.decider));
    const lines = has('f2eval.jsonl') ? rd('f2eval.jsonl').trim().split('\n').map((l) => JSON.parse(l)) : [];
    const inst = D.instances(), can = lines.find((l) => l.statement === 'canonical');
    const sameEnum = !!can && can.rows.length === inst.length && can.rows.every((r, i) => JSON.stringify(r[0]) === JSON.stringify(inst[i]));
    const inf = inst.map((x) => D.informal(x));
    const map = SPEC.f2.componentMap;
    const cmp = (rows) => {
      let concl = 0, conclN = 0, impl = 0, implN = 0, undefinedN = 0, explained = 0;
      const where = [], why = new Set();
      const added = Object.entries(map).filter(([, v]) => v.startsWith('added')).map(([i]) => Number(i));
      rows.forEach((r, i) => {
        const v = r[1].split('').map((b) => b === '1'), I = inf[i], c = v[v.length - 1];
        if (I.conclusion === null) undefinedN++;
        else { conclN++; if (c !== I.conclusion) { concl++; if (where.length < 3) where.push(r[0]); } }
        const P = v.slice(0, -1).every(Boolean) ? c : true;
        const Pi = I['m > n'] && I['n ≥ max(A)'] ? I.conclusion : true;
        if (Pi !== null) {
          implN++;
          if (P !== Pi) {
            impl++;
            /* explained: the instance violates a hypothesis the formalization added, and the informal sentence is false there */
            const off = added.filter((k) => k < v.length - 1 && !v[k]);
            if (off.length && Pi === false) { explained++; off.forEach((k) => why.add(k)); }
          }
        }
      });
      return { concl, conclN, impl, implN, explained, explainedBy: [...why], undefinedN, firstDisagreements: where };
    };
    const C = can ? cmp(can.rows) : null;
    const parts = (lines.find((l) => l.components === SPEC.canonical.decl) || {}).parts || null;
    const mapped = Object.entries(map).filter(([, v]) => !v.startsWith('added'));
    const partAgree = can ? mapped.filter(([i]) => i !== String(parts.length - 1)).map(([i, key]) => ({ part: parts[i], informal: key,
      disagreements: can.rows.filter((r, j) => (r[1][Number(i)] === '1') !== inf[j][key]).length })) : [];
    const kernelSha = has('f2kernel.sha256') ? rd('f2kernel.sha256').trim() : null;
    const kernelOk = !!can && exit('f2kernel') === '0' && kernelSha === sha(f2KernelFile(can.rows));
    const evalLog = has('f2eval.log') ? rd('f2eval.log') : '';
    const muts = SPEC.mutants.map((m) => {
      const L = lines.find((l) => l.statement === m.id), e = SPEC.f2.expect.mutants[m.id];
      if (!L) {
        const err = errors(evalLog, 'Intake/F2Eval.lean').find((x) => x.text) || {};
        return { id: m.id, outcome: 'REFUSED: not decidable on instances', why: (err.text || '').slice(0, 120), expect: e, asExpected: /^REFUSED/.test(e || '') };
      }
      const r = cmp(L.rows);
      const outcome = r.concl ? `conclusion disagrees on ${r.concl} of ${r.conclN} instances` : 'conclusion agrees on every instance';
      const asExpected = e ? (/at least one/.test(e) ? r.concl > 0 : /agrees on every/.test(e) ? r.concl === 0 : false) : null;
      return { id: m.id, outcome, implicationDisagreements: r.impl, expect: e, asExpected, firstDisagreements: r.firstDisagreements };
    });
    const base = !!C && sameEnum && parts && parts.length === Object.keys(map).length && C.concl === 0 && partAgree.every((p) => p.disagreements === 0) && kernelOk;
    const canOk = base && C.impl === C.explained, canPre = base && C.impl === 0;
    const preExp = SPEC.f2.preregisteredExpect || {};
    for (const m of muts) if (preExp[m.id]) { m.preregistered = preExp[m.id]; m.asPreregistered = /at least one/.test(preExp[m.id]) ? !/agrees on every/.test(m.outcome) : /agrees on every/.test(m.outcome); }
    F2 = {
      informal: SPEC.f2.informal, decider: SPEC.f2.decider, instances: inst.length, sameEnumeration: sameEnum,
      canonicalParts: parts, added: Object.entries(map).filter(([, v]) => v.startsWith('added')).map(([i, v]) => ({ part: parts && parts[i], note: v })),
      canonical: C && { conclusionDisagreements: C.concl, conclusionCompared: C.conclN, undefinedInInformal: C.undefinedN, implicationDisagreements: C.impl, implicationCompared: C.implN,
        implicationExplained: C.explained, explainedBy: C.explainedBy.map((k) => parts[k]), explainedInstances: [...new Set(can.rows.filter((r, i) => {
          const v = r[1].split('').map((b) => b === '1'), I = inf[i], Pi = I['m > n'] && I['n ≥ max(A)'] ? I.conclusion : true;
          return Pi === false && (v.slice(0, -1).every(Boolean) ? v[v.length - 1] : true) === true; }).map((r) => JSON.stringify(r[0][0])))].map((a) => 'A = ' + a),
        hypotheses: partAgree },
      limits: ['F2 compares truth values on finitely many instances: a change that never flips one there is invisible to it (E1)', 'where the informal sentence divides by zero (n = 0 or m = 0) nothing is compared; Lean\'s x / 0 = 0 decides those instances by convention'],
      asPreregistered: { canonical: canPre ? 'as expected' : 'NOT as expected (' + C.impl + ' implication disagreements, the pre-registration expected none)', planted: muts.filter((m) => (m.preregistered ? m.asPreregistered : m.asExpected)).length + ' of ' + muts.length },
      kernel: { confirmed: kernelOk, chunks: can ? Math.ceil(can.rows.length / SPEC.f2.chunk) : 0, seconds: secs('f2kernel') },
      mutants: muts,
      word: canOk && muts.every((m) => m.asExpected) ? 'CERTIFIED' : 'REFUSED',
    };
  }

  const binList = has('toolchain.log') ? rd('toolchain.log') : '';
  const notRun = (lcAbsent ? ['leanchecker (the toolchain does not ship it)'] : []).concat(['leanchecker-paranoid', 'lean4lean', 'con-leche', 'con-ron'].filter((k) => !kernels.some((x) => x.name.startsWith(k))));
  const bundled = notRun.filter((k) => new RegExp('^' + k + '$', 'm').test(binList));

  /* format 2 sums the steps the spec names (a copy kept from a retried step is not a step) */
  const stepFiles = V2 ? STEP_NAMES().map((n) => n + '.seconds').filter((f) => has(f)) : fs.readdirSync(F).filter((f) => f.endsWith('.seconds'));
  const wall = stepFiles.reduce((s, f) => s + Number(fs.readFileSync(path.join(F, f), 'utf8')), 0);
  const wrong = mutants.filter((m) => m.kind === 'wrong'), same = mutants.filter((m) => m.kind === 'same'), equiv = mutants.filter((m) => m.kind === 'equivalent');
  /* as pre-registered: the controls that existed before any run, each against its original expectation */
  const pre = mutants.filter((m) => !m.amendment || m.preregistered);
  const preOk = pre.filter((m) => (m.preregistered ? m.asPreregistered : m.asExpected)).length;
  /* claimbox's spec (kinds changed / type): only certain predictions count; the controls show the check discriminates when
     some changed or retyped statement is refused and some rewording accepted; F2 ⇒ F1 must hold where F2 ran */
  const cbx = mutants.some((m) => m.kind === 'changed' || m.kind === 'type' || m.kind === 'answer');
  const changed = mutants.filter((m) => m.kind === 'changed'), typ = mutants.filter((m) => m.kind === 'type'), ans = mutants.filter((m) => m.kind === 'answer'), certain = mutants.filter((m) => m.expect !== 'kernel decides');
  /* format 2: only the statements that reached the check are counted; the others are named */
  const REF = 'REFUSED by type mismatch';
  const T = (l) => l.filter((m) => m.tested), untested = mutants.filter((m) => m.tested === false);
  const notTested = untested.length ? { count: untested.length, statements: untested.map((m) => m.id + ' (' + m.outcome + ')'), note: 'these planted statements never reached the identity check: shown, counted neither as refusals nor as misses' } : undefined;
  const F1controls = V2 && cbx ? {
    same: T(same).filter((m) => m.outcome === 'ACCEPTED').length + ' of ' + T(same).length + ' accepted (predicted)',
    type: T(typ).filter((m) => m.outcome === REF).length + ' of ' + T(typ).length + ' refused (predicted)',
    changed: T(changed).filter((m) => m.outcome === REF).length + ' refused, ' + T(changed).filter((m) => m.outcome === 'ACCEPTED').length + ' accepted, of ' + T(changed).length + ' (kernel decides: no outcome predicted)'
      + (changed.some((m) => m.outcome === 'ACCEPTED') ? ' — accepted: ' + changed.filter((m) => m.outcome === 'ACCEPTED').map((m) => m.id).join(', ') + ' (the rule\'s change is definitionally invisible there)' : ''),
    equivalent: equiv.length ? T(equiv).filter((m) => m.outcome === REF).length + ' of ' + T(equiv).length + ' refused (kernel decides)' : undefined,
    answer: ans.length ? T(ans).filter((m) => m.outcome === REF).length + ' of ' + T(ans).length + ' refused (the answer flipped)' : undefined,
    certain: T(certain).filter((m) => m.asExpected).length + ' of ' + T(certain).length + ' certain predictions met',
    reachedTheCheck: T(mutants).length + ' of ' + mutants.length,
    notTested,
    f2ImpliesF1: F2 && F2.f1 ? (F2.f1.holds ? 'holds: ' + F2.f1.mustRefuse + ' aligned statements with a differing part, all refused' : 'FAILS') : undefined,
    word: T(certain).every((m) => m.asExpected) && T(changed.concat(typ, equiv, ans)).some((m) => m.outcome === REF) && T(same).some((m) => m.outcome === 'ACCEPTED') && (!F2 || !F2.f1 || F2.f1.holds) ? 'CERTIFIED' : 'REFUSED',
  } : V2 ? { wrongRefused: T(wrong).filter((m) => m.asExpected).length + ' of ' + T(wrong).length, sameAccepted: T(same).filter((m) => m.asExpected).length + ' of ' + T(same).length,
    equivalentRefused: equiv.length ? T(equiv).filter((m) => m.asExpected).length + ' of ' + T(equiv).length + ' (the limit: identity up to definitional unfolding, not logical equivalence)' : undefined,
    reachedTheCheck: T(mutants).length + ' of ' + mutants.length,
    notTested,
    asPreregistered: T(pre).filter((m) => (m.preregistered ? m.asPreregistered : m.asExpected)).length + ' of ' + T(pre).length,
    word: T(mutants).every((m) => m.asExpected) && T(mutants).some((m) => m.outcome === REF) && T(same).some((m) => m.outcome === 'ACCEPTED') ? 'CERTIFIED' : 'REFUSED',
  } : cbx ? {
    same: same.filter((m) => m.outcome === 'ACCEPTED').length + ' of ' + same.length + ' accepted (predicted)',
    type: typ.filter((m) => m.outcome !== 'ACCEPTED').length + ' of ' + typ.length + ' not accepted (predicted)',
    changed: changed.filter((m) => m.outcome !== 'ACCEPTED').length + ' refused, ' + changed.filter((m) => m.outcome === 'ACCEPTED').length + ' accepted, of ' + changed.length + ' (kernel decides: no outcome predicted)'
      + (changed.some((m) => m.outcome === 'ACCEPTED') ? ' — accepted: ' + changed.filter((m) => m.outcome === 'ACCEPTED').map((m) => m.id).join(', ') + ' (the rule\'s change is definitionally invisible there)' : ''),
    equivalent: equiv.length ? equiv.filter((m) => m.outcome !== 'ACCEPTED').length + ' of ' + equiv.length + ' refused (kernel decides)' : undefined,
    certain: certain.filter((m) => m.asExpected).length + ' of ' + certain.length + ' certain predictions met',
    f2ImpliesF1: F2 && F2.f1 ? (F2.f1.holds ? 'holds: ' + F2.f1.mustRefuse + ' aligned statements with a differing part, all refused' : 'FAILS') : undefined,
    word: certain.every((m) => m.asExpected) && changed.concat(typ, equiv).some((m) => m.outcome !== 'ACCEPTED') && same.some((m) => m.outcome === 'ACCEPTED') && (!F2 || !F2.f1 || F2.f1.holds) ? 'CERTIFIED' : 'REFUSED',
  } : { wrongRefused: wrong.filter((m) => m.asExpected).length + ' of ' + wrong.length, sameAccepted: same.filter((m) => m.asExpected).length + ' of ' + same.length,
    equivalentRefused: equiv.length ? equiv.filter((m) => m.asExpected).length + ' of ' + equiv.length + ' (the limit: identity up to definitional unfolding, not logical equivalence)' : undefined,
    asPreregistered: preOk + ' of ' + pre.length, word: mutants.every((m) => m.asExpected) ? 'CERTIFIED' : 'REFUSED' };
  const words = {
    F1: F1.word,
    F1controls,
    F3: F3.word,
    plantedClaims: { caught: reds.filter((r) => r.caught).length + ' of ' + reds.length, word: reds.every((r) => r.caught) ? 'CERTIFIED' : 'REFUSED' },
    kernels: kernels.every((k) => k.word === 'ACCEPTS') ? 'ACCEPT (' + kernels.length + ' run)' : 'NOT ALL ACCEPT',
  };
  if (!F2 && SPEC.f2NotApplicable) words.F2 = { word: 'REFUSED (not run)', why: SPEC.f2NotApplicable };
  if (F2 && F2.readings) {
    words.F2 = { word: F2.word,
      readings: F2.readings.map((r) => `${r.reading}: ${r.word} — conclusion ${r.conclusion.disagreements} disagreements of ${r.conclusion.compared} (${r.conclusion.undefinedInReading} undefined in the reading); `
        + `implication ${r.implication.disagreements} disagreements` + (r.implication.disagreements ? `, ${r.implication.explained} explained by ${r.implication.explainedBy.join(', ')} (${r.implication.explainedInstances.join(', ')})` : '')
        + (r.added.length ? '; added by the formalization: ' + r.added.join(', ') : '') + (r.missing.length ? '; MISSING from it: ' + r.missing.join(', ') : '')),
      kernel: F2.kernel.confirmed ? 'the kernel confirms all ' + F2.kernel.chunks + ' chunks' : 'NOT confirmed',
      f2ImpliesF1: F2.f1.holds ? 'holds (' + F2.f1.mustRefuse + ' must-refuse)' : 'FAILS' };
  } else if (F2) {
    const c = F2.canonical;
    words.F2 = { word: F2.word,
      canonical: !c ? 'no rows' : (c.conclusionDisagreements ? `DISAGREES with the informal decider on ${c.conclusionDisagreements} of ${c.conclusionCompared} instances` : `agrees with the informal decider on all ${c.conclusionCompared} instances where the informal statement is defined`) + ` (${c.undefinedInInformal} undefined there: n = 0 or m = 0)`
        + (c.implicationDisagreements ? `; the whole implication differs on ${c.implicationDisagreements}, ${c.implicationExplained} of them explained by the added hypothesis ${c.explainedBy.join(', ')} (${c.explainedInstances.join(', ')}: the informal sentence is false there)` : ''),
      kernel: F2.kernel.confirmed ? 'the kernel confirms all ' + F2.kernel.chunks + ' chunks' : 'NOT confirmed',
      planted: F2.mutants.filter((m) => m.asExpected).length + ' of ' + F2.mutants.length + ' as expected',
      asPreregistered: 'canonical ' + F2.asPreregistered.canonical + '; planted ' + F2.asPreregistered.planted };
  }
  const verdict = F1.word === 'CERTIFIED' && words.F1controls.word === 'CERTIFIED' && F3.word === 'CERTIFIED' && words.plantedClaims.word === 'CERTIFIED' && words.kernels.startsWith('ACCEPT') && (!F2 || F2.word === 'CERTIFIED') ? 'CERTIFIED' : 'REFUSED';

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
  if (V2) {
    const cost = has('cost.json') ? JSON.parse(rd('cost.json')) : null;
    const known = ['leanchecker', 'leanchecker-paranoid', 'lean4lean', 'nanoda', 'con-leche', 'con-ron'];
    const ranHere = kernels.map((k) => k.name);
    const notRunHere = known.filter((k) => !ranHere.some((n) => n.startsWith(k + ' '))).map((k) => (k === 'leanchecker' && lcAbsent ? 'leanchecker (the toolchain does not ship it)' : k));
    return {
      format: 2,
      what: 'The Lean intake of ' + SPEC.claim.what + ' against ' + SPEC.canonical.what + ', decided from the run\'s facts by tools/lean-intake.js (record format 2, instruments/intake/SPEC.md). '
        + 'CERTIFIED here says: the kernels named accept the claimant\'s proof as a proof of ' + neg + 'the canonical declaration\'s own statement; of the planted statements that reached the identity check, every one with a predicted outcome has it, at least one is refused and at least one rewording is accepted; the canonical hypotheses have a model; and every planted defect in the claimant\'s file is caught. A planted statement that did not elaborate tested nothing and is named, not counted.'
        + (SPEC.writer ? ' The spec was written by claimbox (' + SPEC.writer.by + ': every planted statement by a fixed rule, only certain outcomes predicted — "kernel decides" otherwise), copied here by LIFT-claimbox-intake.json and committed before the run.' : ''),
      notDecided: 'Whether the canonical statement is the informal problem (a reading, F5' + (SPEC.f2 ? '; F2 tests it on finitely many instances, which is evidence, not proof' : '; F2, instance agreement, was not run') + '). Kernels THIS RUN did not run: ' + (notRunHere.join(', ') || 'none of the six it knows') + ' — another record of the same proof may have run them; this record speaks for its own run only.',
      spec: { path: SPEC_PATH, sha256: sha(fs.readFileSync(path.join(ROOT, SPEC_PATH))), amendments: SPEC.amendments.length },
      run: { day, facts: path.relative(ROOT, F), machine: JSON.parse(rd('machine.json')), stepSeconds: Number(wall.toFixed(1)), cost: cost || null, ...(cost ? {} : { costNote: 'not recorded (no cost.json beside the run)' }) },
      pins: { canonical: Object.assign({ url: SPEC.canonical.url, path: SPEC.canonical.path, decl: SPEC.canonical.decl }, pin.canonical), claim: Object.assign({ url: SPEC.claim.url, file: SPEC.claim.file, decl: SPEC.claim.decl }, pin.claim) },
      hazards: pin.hazards,
      verdict, words, F1, F2, F3, mutants, reds, kernels, notRunHere, reproduces,
      ...(AXIOMS.length ? { conditionalOn: { axioms: AXIOMS.map((a) => a.canonical), note: 'CERTIFIED is conditional on these axioms, which the canonical file itself declares. Nothing here proves them.' } } : {}),
    };
  }
  return {
    what: 'The Lean intake of ' + SPEC.claim.what + ' against ' + SPEC.canonical.what + ', decided from the run\'s facts by tools/lean-intake.js (phase P1 of notes/lean-fidelity-plan-2026-11-09.md). '
      + 'CERTIFIED here says: the kernels named accept the claimant\'s proof as a proof of ' + neg + 'the canonical declaration\'s own statement, the check refuses every planted wrong statement and accepts every planted paraphrase, the canonical hypotheses have a model, and every planted defect in the claimant\'s file is caught.'
      + (SPEC.writer ? ' The spec was written by claimbox (' + SPEC.writer.by + ': every planted statement by a fixed rule, only certain outcomes predicted — "kernel decides" otherwise), copied here by LIFT-claimbox-intake.json and committed before the run.' : ''),
    notDecided: 'Whether the canonical statement is the informal problem (a reading, F5' + (SPEC.f2 ? '; F2 tests it on finitely many instances, which is evidence, not proof' : '; F2, instance agreement, is phase P2') + '); the kernels not run: ' + notRun.join(', ') + (bundled.length ? ' (bundled but not run: ' + bundled.join(', ') + ')' : ' (not bundled with ' + SPEC.canonical.toolchain.split(':')[1] + ')') + '.',
    spec: { path: SPEC_PATH, sha256: sha(fs.readFileSync(path.join(ROOT, SPEC_PATH))), amendments: SPEC.amendments.length },
    run: { day, facts: path.relative(ROOT, F), machine: JSON.parse(rd('machine.json')), stepSeconds: Number(wall.toFixed(1)), costUSD: 0 },
    pins: { canonical: Object.assign({ url: SPEC.canonical.url, path: SPEC.canonical.path, decl: SPEC.canonical.decl }, pin.canonical), claim: Object.assign({ url: SPEC.claim.url, file: SPEC.claim.file, decl: SPEC.claim.decl }, pin.claim) },
    hazards: pin.hazards,
    verdict, words, F1, F2, F3, mutants, reds, kernels, notRun, reproduces,
    ...(AXIOMS.length ? { conditionalOn: { axioms: AXIOMS.map((a) => a.canonical), note: 'CERTIFIED is conditional on these axioms, which the canonical file itself declares. Nothing here proves them.' } } : {}),
  };
}
function record() {
  const rec = decide();
  if (process.argv.includes('--check')) {
    const old = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
    if (JSON.stringify(rec, null, 1) + '\n' !== old) die('certs/lean-intake-' + id + '.json differs from what the facts derive now');
    const fc = rec.words.F1controls;
    console.log(`lean-intake ${id} --check: OK — ${rec.verdict} (F1 ${rec.words.F1}; controls ${fc.wrongRefused ? fc.wrongRefused + ' wrong refused, ' + fc.sameAccepted + ' same accepted' : fc.certain + '; changed ' + fc.changed.split(' (')[0]}; F3 ${rec.words.F3}; planted claims ${rec.words.plantedClaims.caught}; kernels ${rec.words.kernels}${rec.words.F2 ? '; F2 ' + rec.words.F2.word + (rec.words.F2.kernel ? ', ' + rec.words.F2.kernel : '') : ''})`);
    return;
  }
  fs.writeFileSync(OUT, JSON.stringify(rec, null, 1) + '\n');
  console.log(`wrote certs/lean-intake-${id}.json — ${rec.verdict}`);
  console.log(JSON.stringify(rec.words, null, 1));
  for (const m of rec.mutants) console.log(`  ${m.tested === false ? 'n/t ' : m.asExpected ? 'ok  ' : 'MISS'} ${m.id} ${m.kind.padEnd(5)} ${m.outcome}${m.asExpected || m.tested === false ? '' : ' (expected ' + m.expect + ')'}`);
  for (const r of rec.reds) console.log(`  ${r.caught ? 'ok  ' : 'MISS'} ${r.id} ${r.how}`);
}

/* ---- review: a draft, never sent from here --------------------------------------------------------------------- */
function review() {
  if (!fs.existsSync(OUT)) die('record first');
  const R = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  const lines = [
    `<!-- DRAFT from certs/lean-intake-${id}.json (tools/lean-intake.js review); untracked; posted only on the operator's word. -->`,
    `I checked ${SPEC.claim.what}, against ${SPEC.canonical.what} (\`${SPEC.canonical.decl}\` at \`${SPEC.canonical.commit}\`).`,
    '',
    `- **The statement.** ${R.F1.how.charAt(0).toUpperCase() + R.F1.how.slice(1)}. ` + (R.words.F1controls.wrongRefused ? `Of the planted statements, ${R.words.F1controls.wrongRefused} wrong ones were refused and ${R.words.F1controls.sameAccepted} rewordings of the same statement were accepted.`
      : `Of the planted statements (written by fixed rules): rewordings ${R.words.F1controls.same}; changed ones ${R.words.F1controls.changed.split(' (')[0]}; retyped ${R.words.F1controls.type}.`),
    `- **The hypotheses are satisfiable:** ${R.F3.witness}, checked by the kernel.`,
    `- **The kernels:** ${R.kernels.map((k) => k.name + ' ' + k.word.toLowerCase()).join('; ')}. Not run here: ${(R.notRunHere || R.notRun).join(', ')}.`,
    ...(R.F2 && R.F2.readings ? [`- **The statement against the informal problem, on ${R.F2.instances} small instances:** Lean evaluated DeepMind's statement part by part, and a separate exact program written from the informal sentence alone evaluated the same instances, under each reading of the sentence: ${R.words.F2.readings.join('; ')}. The kernel confirmed Lean's values.`] : []),
    ...(R.F2 && !R.F2.readings ? [`- **The statement against the informal problem, on ${R.F2.instances} small instances:** Lean evaluated DeepMind's statement part by part, and a separate exact program written from the informal sentence alone evaluated the same instances. ${R.words.F2.canonical.charAt(0).toUpperCase() + R.words.F2.canonical.slice(1)}. The kernel confirmed Lean's values.`] : []),
    `- **The axioms:** ${R.F1.axioms.join(', ')}. Planted defects in the proof file (${R.reds.map((r) => r.why).join('; ')}): ${R.words.plantedClaims.caught} caught.`,
    `- **Not checked here:** whether the formal statement is the informal problem, which is a reading.`,
    '',
    'I worked this out with Claude (Anthropic).',
  ];
  const f = path.join(ROOT, 'outreach', `lean-intake-${id}-review.md`);
  fs.writeFileSync(f, lines.join('\n') + '\n');
  console.log('drafted ' + path.relative(ROOT, f) + ' (untracked)');
}

/* ---- cost: a fact of the run, written by whoever paid --------------------------------------------------------------- */
function cost() {
  const day = opt('--day') || latestRun(), usd = Number(opt('--usd')), what = opt('--what');
  if (opt('--usd') === null || !Number.isFinite(usd) || usd < 0 || !what) die('cost <id> --usd <number ≥ 0> --what "<the machine, the time, the rate>"');
  fs.writeFileSync(path.join(RUNS, day, 'cost.json'), JSON.stringify({ usd, what }, null, 1) + '\n');
  console.log(`wrote ${path.relative(ROOT, path.join(RUNS, day, 'cost.json'))} — US$${usd}`);
}

/* ---- preflight: does every planted statement elaborate, alone? ------------------------------------------------------ */
function preflight() {
  const day = opt('--day') || new Date().toISOString().slice(0, 10);
  const PRE = path.join(ROOT, 'corpus', 'lean-intake', id, 'preflight', day); fs.mkdirSync(PRE, { recursive: true });
  const WORK = process.env.LEAN_INTAKE_WORK || path.join(os.homedir(), 'Projects', 'lean-intake-work', id);
  const CAN = path.join(WORK, 'canonical'), C = SPEC.canonical;
  if (!fs.existsSync(path.join(CAN, '.lake')) || cp.spawnSync('git', ['-C', CAN, 'rev-parse', 'HEAD']).stdout.toString().trim() !== C.commit) die('preflight needs the canonical repository built at its pin in ' + CAN + ': run --stages pin,toolchain,cache,canonical first (LEAN_INTAKE_KEEP=1 keeps the build for the run)');
  if (sha(fs.readFileSync(path.join(CAN, C.path))) !== C.sha256) die('the canonical file is not the pinned bytes');
  /* the statement alone: the header the run writes, `theorem s`, and no claimant's term — so no outcome of F1 is seen.
     Self-contained files: the statement is written in the copy's namespace, so the copy is built here first. */
  const pre = WRAP ? `import ${canonMod}\n` : `import ${C.module}\n`;
  const ns = (m) => (WRAP ? WRAP_NS + '.' : '') + (SPEC.mutantNamespace || 'Intake.Mut') + '.' + m.id;
  const head = (m) => pre + (m.imports || []).map((i) => `import ${i}\n`).join('') + `namespace ${ns(m)}\n` + (SPEC.mutantOpen || []).map((o) => `open ${o}\n`).join('');
  if (WRAP) {
    const canText = fs.readFileSync(path.join(CAN, C.path), 'utf8'), w = wrapCanonical(canText);
    fs.mkdirSync(path.join(CAN, 'Intake', 'Canon'), { recursive: true });
    fs.writeFileSync(path.join(CAN, 'Intake', 'Canon', canonStem + '.lean'), w.text);
    const toml = path.join(CAN, 'lakefile.toml');
    if (!fs.existsSync(toml)) die('the canonical repository has no lakefile.toml');
    if (!/name = "Intake"/.test(fs.readFileSync(toml, 'utf8'))) fs.appendFileSync(toml, '\n[[lean_lib]]\nname = "Intake"\n');
  }
  const deps = [...new Set([WRAP ? canonMod : C.module].concat(SPEC.mutants.flatMap((m) => m.imports || [])))];
  const built = cp.spawnSync('bash', ['-c', `lake build ${deps.join(' ')} 2>&1`], { cwd: CAN, timeout: 7200 * 1000, maxBuffer: 1 << 28 });
  if (built.status !== 0) { fs.writeFileSync(path.join(PRE, 'imports.log'), built.stdout || ''); die('the modules the planted statements import did not build (see preflight/' + day + '/imports.log)'); }
  for (const m of SPEC.mutants) fs.writeFileSync(path.join(CAN, 'IntakePre_' + m.id + '.lean'), head(m) + `theorem s : ${m.statement} := by\n  sorry\n`);
  runPool(SPEC.mutants.map((m) => ({ name: 'pre-' + m.id, cwd: CAN, command: `lake env lean IntakePre_${m.id}.lean`, seconds: 1800 })), PRE, JOBS);
  const rows = SPEC.mutants.map((m) => {
    fs.rmSync(path.join(CAN, 'IntakePre_' + m.id + '.lean'), { force: true });
    const exit = fs.readFileSync(path.join(PRE, 'pre-' + m.id + '.exit'), 'utf8').trim(), out = fs.readFileSync(path.join(PRE, 'pre-' + m.id + '.log'), 'utf8');
    const errs = out.split('\n').filter((l) => /error/.test(l)).map((l) => l.replace(/^.*IntakePre_[^:]*:/, '').slice(0, 200)).slice(0, 3);
    console.log(`  ${exit === '0' ? 'ok  ' : 'FAIL'} ${m.id} ${m.kind}${exit === '0' ? '' : ' — ' + (errs[0] || 'exit ' + exit)}`);
    return { id: m.id, kind: m.kind, rule: m.rule, elaborates: exit === '0', errors: errs };
  });
  /* the planted defects need the claimant's file (their text must occur in it): checked when a run has cloned it */
  const CLM = IN_PLACE ? CAN : path.join(WORK, 'claim');
  let reds = null;
  if (fs.existsSync(path.join(CLM, SPEC.claim.file))) {
    const text = fs.readFileSync(path.join(CLM, SPEC.claim.file), 'utf8');
    reds = (SPEC.claimReds || []).map((r) => ({ id: r.id, occurrences: text.split(r.find).length - 1, ok: r.all ? text.includes(r.find) : text.split(r.find).length === 2 }));
  }
  const out = { what: 'Preflight of the spec at ' + SPEC_PATH + ': each planted statement elaborated alone (its theorem s with sorry, without the claimant\'s term) against the pinned canonical file. It shows which statements can test anything; it runs no identity check and reveals no outcome of one.',
    spec: { path: SPEC_PATH, sha256: sha(fs.readFileSync(path.join(ROOT, SPEC_PATH))) }, day, canonical: { commit: C.commit, sha256: C.sha256, toolchain: C.toolchain },
    statements: rows, elaborate: rows.filter((r) => r.elaborates).length + ' of ' + rows.length, doNotElaborate: rows.filter((r) => !r.elaborates).map((r) => r.id), plantedDefects: reds };
  fs.writeFileSync(path.join(PRE, 'preflight.json'), JSON.stringify(out, null, 1) + '\n');
  console.log(`preflight ${id}: ${out.elaborate} planted statements elaborate` + (out.doNotElaborate.length ? ' — NOT: ' + out.doNotElaborate.join(', ') : '') + (reds ? `; planted defects ${reds.filter((r) => r.ok).length} of ${reds.length} find their text` : ''));
}

if (cmd === '__pool') pool(); else if (cmd === 'run') run(); else if (cmd === 'record') record(); else if (cmd === 'review') review(); else if (cmd === 'cost') cost(); else if (cmd === 'preflight') preflight(); else die('unknown command ' + cmd);
