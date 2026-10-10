#!/usr/bin/env python3
"""openai-math-transfer.py — lane K's TRANSFER check for a definition-hole challenge (pre-registration amendment 7).

Comparator compares a definition hole's type, never its body, so for a challenge that declares holes the question it
leaves open is: does the solution's theorem prove the statement THE CHALLENGE FILE DISPLAYS? This writes a Lean file
that answers it in Lean's kernel:

  * the challenge file is copied verbatim with its top-level `namespace OAI` / `end OAI` renamed `AuditCopy`, so its
    definitions — the displayed bodies — exist beside the solution's under other names;
  * the solution module is imported;
  * for every theorem in the config, `example : type_of% @AuditCopy.<T> := @OAI.<T>` asks Lean to accept the
    solution's proof as a proof of the copied (displayed) statement. That holds exactly when the two statements agree
    up to definitional unfolding; Lean's elaborator decides it and its kernel re-checks the example.

Accepted for every theorem: TRANSFERS. Any error: the transfer is not definitional, and the gap is a reading.

The copy is elaborated in the solution's environment, so a global instance the solution declares on a Mathlib type
could be chosen where the challenge alone would choose Mathlib's; a TRANSFERS is a kernel-checked proof that the
solution's theorem proves the displayed statement as elaborated here, and the record says so.

usage: openai-math-transfer.py <challenge.lean> <config.json>   (writes the Lean file to stdout)
"""
import json
import re
import sys

lean_path, cfg_path = sys.argv[1], sys.argv[2]
src = open(lean_path, encoding='utf-8').read()
cfg = json.load(open(cfg_path))

lines = src.split('\n')
imports = [l for l in lines if re.match(r'^import\s', l)]
body = [l for l in lines if not re.match(r'^import\s', l)]
renamed, opened, closed = [], 0, 0
for l in body:
    if re.match(r'^namespace OAI\s*$', l):
        renamed.append('namespace AuditCopy'); opened += 1
    elif re.match(r'^end OAI\s*$', l):
        renamed.append('end AuditCopy'); closed += 1
    else:
        renamed.append(l)
if opened != 1 or closed != 1:
    sys.exit('expected exactly one top-level `namespace OAI` ... `end OAI` in %s (found %d / %d)' % (lean_path, opened, closed))

out = []
out += imports
out.append('import ' + cfg['solution_module'])
out.append('')
out.append('-- the challenge file, verbatim, with its top-level namespace OAI renamed AuditCopy')
out += renamed
out.append('')
out.append('-- does each solution theorem prove the DISPLAYED statement? (accepted iff the statements agree definitionally)')
for t in cfg['theorem_names']:
    if not t.startswith('OAI.'):
        sys.exit('theorem outside OAI: ' + t)
    copy = 'AuditCopy.' + t[len('OAI.'):]
    out.append('example : type_of% @' + copy + ' := @' + t)
out.append('')
sys.stdout.write('\n'.join(out))
