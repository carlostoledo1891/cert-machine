#!/usr/bin/env python3
"""openai-math-transfer.py — lane K's TRANSFER check for a definition-hole challenge (pre-registration amendment 9;
the first design, amendment 7, was withdrawn in amendment 8 because it re-declared nominal types).

THE QUESTION. Comparator compares a declared definition hole by its type, never its body. When a challenge file
DISPLAYS a body for a hole, does the solution's theorem prove the statement the file displays?

THE FILE THIS WRITES, checked by `lake env lean` on the runner after Comparator has built the solution:
  * it imports the solution module, so every non-hole constant the challenge names resolves to the solution's
    constant — the ones Comparator's ordinary run has already matched to the challenge's, constant for constant;
  * it keeps the challenge file's skeleton (namespace / section / end / open / variable / universe / set_option /
    local notation) and DROPS every declaration except, to a fixpoint: the declared holes; every declaration whose
    text refers to a copied name (helper lemmas included, so the proofs inside copied definitions find their simp
    lemmas); every non-lemma declaration a copied text refers to; and the listed theorems (re-proved by `sorry`) —
    each kept one renamed `<name>_auditDisplayed`, every reference to a copied name rewritten. Nominal types are
    never copied;
  * a GUARD (a `run_cmd`) first computes V, the OAI constants Comparator's ordinary run matched to the challenge (from
    the theorems' types, through every non-hole constant's type and value, through holes' types only), then walks
    everything the copies reach: it fails if a copy reaches an ORIGINAL hole (the check would pass vacuously through
    the solution's own definition) or a constant that is neither a copy (nor one of a copy's auxiliary constants,
    such as X._proof_3) nor in V (one Comparator never compared);
  * then, for each theorem T: `example : type_of% @T_auditDisplayed := @T` — Lean accepts it exactly when the
    displayed statement and the proved statement agree up to definitional unfolding, and its kernel re-checks it.
With `--forge` the first displayed (unsorried) hole's body is replaced by `sorry` — a red control that must NOT
transfer; exit 3 when every hole is sorried in the challenge (a genuine hole: there is no displayed body to test).

usage: openai-math-transfer.py <challenge.lean> <config.json> [--forge]   (writes the Lean file to stdout)
"""
import json
import re
import sys

lean_path, cfg_path = sys.argv[1], sys.argv[2]
forge = '--forge' in sys.argv
src = open(lean_path, encoding='utf-8').read()
cfg = json.load(open(cfg_path))
holes_full = list(cfg.get('definition_names') or [])
theorems_full = list(cfg['theorem_names'])
if not holes_full:
    sys.exit('no definition holes in ' + cfg_path)


def strip_comments(s):
    """blank out /- -/ blocks (nested) and -- line comments, keeping every newline and column"""
    out, i, depth, n = [], 0, 0, len(s)
    while i < n:
        if s.startswith('/-', i):
            depth += 1; out.append('  '); i += 2; continue
        if depth and s.startswith('-/', i):
            depth -= 1; out.append('  '); i += 2; continue
        if depth:
            out.append('\n' if s[i] == '\n' else ' '); i += 1; continue
        if s.startswith('--', i):
            j = s.find('\n', i)
            j = n if j < 0 else j
            out.append(' ' * (j - i)); i = j; continue
        if s[i] == '"':                                   # a string literal: copy through its closing quote
            j = i + 1
            while j < n and s[j] != '"':
                j += 2 if s[j] == '\\' else 1
            out.append(s[i:j + 1]); i = j + 1; continue
        out.append(s[i]); i += 1
    return ''.join(out)


code = strip_comments(src)
lines = code.split('\n')
MODS = r'(?:@\[[^\]]*\]\s*)*(?:(?:private|protected|noncomputable|partial|unsafe|nonrec)\s+)*'
DECL = re.compile(r'^' + MODS + r'(def|abbrev|theorem|lemma|structure|class|inductive|instance|example|opaque|axiom|irreducible_def)\b\s*([^\s:({\[]*)')
SKEL = re.compile(r'^(namespace|section|end|open|variable|universe|set_option|noncomputable\s+section|local\s+notation|local\s+infix\w*|local\s+prefix|local\s+postfix|attribute\s+\[local)\b')
OTHER = re.compile(r'^(notation|infix\w*|prefix|postfix|macro|macro_rules|syntax|elab|run_cmd|run_elab|run_meta|#\w+|scoped|attribute|deriving|mutual|initialize|import)\b')


def is_start(line):
    return bool(line) and not line[0].isspace() and (DECL.match(line) or SKEL.match(line) or OTHER.match(line))


# segment the file into commands; track the namespace stack to give each declaration its full name
segs, cur = [], None
for ln in lines:
    if is_start(ln):
        if cur:
            segs.append(cur)
        cur = [ln]
    elif cur is not None:
        cur.append(ln)
if cur:
    segs.append(cur)

stack = []          # list of (kind, name) for namespace / section
decls = []          # (index into segs, full name, kind)
for k, seg in enumerate(segs):
    head = seg[0]
    m = re.match(r'^namespace\s+(\S+)', head)
    if m:
        stack.append(('ns', m.group(1))); continue
    if re.match(r'^(?:noncomputable\s+)?section\b', head):
        stack.append(('sec', (re.match(r'^(?:noncomputable\s+)?section\b\s*(\S*)', head).group(1)))); continue
    m = re.match(r'^end\b\s*(\S*)', head)
    if m:
        if stack:
            stack.pop()
        continue
    m = DECL.match(head)
    if m:
        name = m.group(2)
        ns = '.'.join(n for kind, n in stack if kind == 'ns')
        full = (ns + '.' + name) if (ns and name) else name
        decls.append((k, full or '', m.group(1)))

decl_by_full = {full: (k, kind) for k, full, kind in decls if full}
missing = [h for h in holes_full + theorems_full if h not in decl_by_full]
if missing:
    sys.exit('declarations not found in the challenge text: ' + ', '.join(missing))


def ref_pattern(full):
    """any qualification of a full name OAI.a.b.c that ends in the short name: c, b.c, a.b.c, OAI.a.b.c"""
    parts = full.split('.')
    alts = ['.'.join(parts[i:]) for i in range(len(parts))]
    alts.sort(key=len, reverse=True)
    return re.compile(r"(?<![\w.'])(?:" + '|'.join(re.escape(a) for a in alts) + r")(?![\w'])")


# the copy set, to a fixpoint in both directions: the holes; every declaration whose text refers to a copied name (its
# displayed meaning depends on a hole); every declaration a copied text refers to (reachable only through a hole body,
# so Comparator never compared it). Never a theorem; never a nominal type (structure / class / inductive), which
# cannot be copied without becoming a different type — the guard below flags one that is needed and unverified.
NOMINAL = ('structure', 'class', 'inductive')
copy = set(holes_full)
copied_anon = set()       # anonymous instances that refer to a copied name: copied, not renamed
text_of = {k: '\n'.join(segs[k]) for k, _, _ in decls}
pat_of = {full: ref_pattern(full) for _, full, kind in decls if full}
changed = True
while changed:
    changed = False
    copied_texts = [text_of[k] for k, full, _ in decls if (full and full in copy) or k in copied_anon]
    copied_texts += [text_of[decl_by_full[t][0]] for t in theorems_full]
    for k, full, kind in decls:
        if kind == 'example' or kind in NOMINAL or full in theorems_full:
            continue
        if (full and full in copy) or (not full and k in copied_anon):
            continue
        refers_to_copy = any(pat_of[c].search(text_of[k]) for c in copy)
        if kind in ('theorem', 'lemma'):
            # a helper lemma is copied only as a DEPENDENT (it states something about a copied name): the proofs inside
            # copied definitions use such lemmas, and a statement about a copy must exist about the copy
            if refers_to_copy and full:
                copy.add(full); changed = True
            continue
        referred_by_copy = bool(full) and any(pat_of[full].search(t) for t in copied_texts if t is not text_of[k])
        if refers_to_copy or referred_by_copy:
            # a dependency is copied only when a HOLE-side text refers to it: theorem statements alone do not pull one in
            if refers_to_copy or any(pat_of[full].search(text_of[kk]) for kk, ff, _ in decls if (ff and ff in copy) or kk in copied_anon):
                if full:
                    copy.add(full)
                else:
                    copied_anon.add(k)
                changed = True
copy_theorems = set(theorems_full)
renamed = {c: c + '_auditDisplayed' for c in copy | copy_theorems}
pats = sorted(((c, ref_pattern(c)) for c in copy), key=lambda cp: -len(cp[0]))


def rewrite(text):
    for c, p in pats:
        text = p.sub(renamed[c], text)
    return text


out_lines = []
first_hole_forged = False
for k, seg in enumerate(segs):
    head = seg[0]
    if SKEL.match(head) or re.match(r'^(?:noncomputable\s+)?section\b', head):
        out_lines.extend(seg); continue
    m = DECL.match(head)
    if not m:
        continue                                  # notation, macros, run_cmd, attribute, ... — dropped
    full = next((f for kk, f, _ in decls if kk == k), None)
    if not full and k in copied_anon:
        out_lines.extend(rewrite(l) for l in seg); continue
    if full and full in copy:
        name = m.group(2)
        cut = m.end(2)                                   # the declared name ends here; rename it, rewrite what follows
        body = [seg[0][:m.start(2)] + name + '_auditDisplayed' + rewrite(seg[0][cut:])] + [rewrite(l) for l in seg[1:]]
        if forge and not first_hole_forged and full in holes_full and not re.search(r'\bsorry\b', '\n'.join(seg)):
            joined = '\n'.join(body)
            pos = joined.find(':=')
            if pos >= 0 and 'where' not in joined[:pos]:
                body = (joined[:pos] + ':= sorry').split('\n')
                first_hole_forged = True
        out_lines.extend(body)
    elif full in copy_theorems:
        name = m.group(2)
        joined = seg[0][:m.start(2)] + name + '_auditDisplayed' + '\n'.join([seg[0][m.end(2):]] + seg[1:])
        pos = joined.rfind(':=')
        head_len = len(seg[0][:m.start(2)] + name + '_auditDisplayed')
        stmt = joined[:head_len] + rewrite(joined[head_len:pos] if pos >= 0 else joined[head_len:])
        out_lines.extend((stmt + ':= by sorry').split('\n'))
if forge and not first_hole_forged:
    sys.stderr.write('no displayed hole body to forge: every hole is left sorried in the challenge (a genuine hole)\n')
    sys.exit(3)

imports = [l for l in src.split('\n') if re.match(r'^import\s', l)]
lean = []
lean += imports
lean.append('import ' + cfg['solution_module'])
lean.append('')
lean.append('-- the challenge file\'s skeleton, its holes and every declaration that refers to one, renamed _auditDisplayed;')
lean.append('-- every other name resolves to the solution\'s constant (already matched to the challenge\'s by Comparator)')
lean += out_lines
lean.append('')
hole_names = ', '.join('`' + h for h in holes_full)
thm_names = ', '.join('`' + t for t in theorems_full)
copy_names = ', '.join('`' + renamed[c] for c in sorted(copy | copy_theorems))
G = """open Lean Elab Command in
run_cmd do
  let env ← getEnv
  let holes : Array Name := #[HOLES]
  let thms : Array Name := #[THMS]
  let copies : Array Name := #[COPIES]
  let isOAI : Name → Bool := fun n => (`OAI).isPrefixOf n
  let deps : ConstantInfo → Bool → Array Name := fun ci typeOnly =>
    if typeOnly then ci.type.getUsedConstants
    else ci.type.getUsedConstants ++ (match ci with | .defnInfo d => d.value.getUsedConstants | _ => #[])
  -- V: what Comparator's ordinary run matched to the challenge, constant for constant: from the theorems' types,
  -- through every non-hole constant's type and value, through the holes' types only
  let mut V : Std.HashSet Name := {}
  let mut todo : Array Name := #[]
  for t in thms do
    let some ci := env.find? t | throwError m!"AUDIT-GUARD: unknown theorem {t}"
    todo := todo ++ (ci.type.getUsedConstants.filter isOAI)
  while todo.size > 0 do
    let c := todo.back!
    todo := todo.pop
    if V.contains c then continue
    V := V.insert c
    let some ci := env.find? c | throwError m!"AUDIT-GUARD: unknown constant {c}"
    todo := todo ++ ((deps ci (holes.contains c)).filter fun u => isOAI u && !V.contains u)
  -- the copies: every OAI constant they reach must be a copy or in V, and never an original hole
  let mut seen : Std.HashSet Name := {}
  let mut unverified : Array Name := #[]
  todo := copies
  while todo.size > 0 do
    let c := todo.back!
    todo := todo.pop
    if seen.contains c then continue
    seen := seen.insert c
    if holes.contains c then throwError m!"AUDIT-GUARD FAILED: a copy reaches the original hole {c}"
    if !(copies.any (·.isPrefixOf c)) && !V.contains c then unverified := unverified.push c
    let some ci := env.find? c | throwError m!"AUDIT-GUARD: unknown constant {c}"
    todo := todo ++ ((deps ci false).filter fun u => isOAI u && !seen.contains u)
  if unverified.size > 0 then throwError m!"AUDIT-GUARD UNVERIFIED: the copies reach constants Comparator never matched: {unverified}"
  logInfo m!"AUDIT-GUARD OK: {seen.size} constants walked from the copies, {V.size} matched by Comparator, no original hole reached"
"""
lean += G.replace('HOLES', hole_names).replace('THMS', thm_names).replace('COPIES', copy_names).rstrip('\n').split('\n')
lean.append('')
lean.append('-- does each solution theorem prove the DISPLAYED statement? (accepted iff the two agree definitionally)')
for t in theorems_full:
    lean.append('example : type_of% @' + renamed[t] + ' := @' + t)
lean.append('')
sys.stdout.write('\n'.join(lean))
