#!/usr/bin/env python3
"""tools/apn-statements.py — the nine Erdős proofs of Google DeepMind's AlphaProof Nexus (Science,
doi:10.1126/science.aej2213; arXiv 2605.22763) read against the formal statements they claim to prove. Standard library
only; reads the pinned copies in corpus/alphaproof-nexus (nothing of the claimant is run).

For each of the nine files in the results repository (google-deepmind/alphaproof-nexus-results @ 0647711a) it decides,
textually and exactly:
  S1  the proved theorem (target_theorem_0, the answer value included) equals the formal-conjectures statement at the
      commit the repository builds against (7862bf6a), whitespace aside
  S2  every definition, notation and variable of that formal-conjectures file appears verbatim outside the agent's
      EVOLVE blocks, and no declaration outside them is one formal-conjectures does not have
  S3  no name the agent declares inside its EVOLVE blocks is an identifier of the statement or of those definitions
      (a shadowing declaration would change what the statement means)
  S4  no kernel-bypassing construct anywhere in the file (sorry, axiom, native_decide, implemented_by, extern, unsafe,
      opaque, ofReduceBool, debug.skipKernelTC, macro/elab rules, run_cmd, #eval)
  S5  the statement at today's formal-conjectures head (e30c4c3d), reading the October refactor answer(True) ↔ P as P
      and answer(False) ↔ P as ¬P: unchanged in meaning, or changed — and if changed, how
These are textual decisions; the elaborated statements are compared by Comparator in the kernel lane
(.github/workflows/apn-kernel.yml). Red controls plant each kind of change in a copy and must be caught.

usage: python3 tools/apn-statements.py            write certs/apn-statements.json
       python3 tools/apn-statements.py --check    re-derive and compare with the record (the battery)
MIT"""
import hashlib
import json
import os
import re
import sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
D = os.path.join(ROOT, 'corpus', 'alphaproof-nexus')
OUT = os.path.join(ROOT, 'certs', 'apn-statements.json')
RISK = re.compile(r'\b(sorry|admit|native_decide|axiom|implemented_by|extern|unsafe|opaque|ofReduceBool|skipKernelTC|'
                  r'macro_rules|elab_rules|syntax|run_cmd|run_tac|#eval|#exit)\b')
DECL = re.compile(r'^(?:@\[[^\]]*\]\s*)?(?:private\s+|protected\s+)?(?:noncomputable\s+)?'
                  r'(def|abbrev|lemma|theorem|instance|notation|local notation|scoped notation|structure|class|inductive|'
                  r'irreducible_def|variable)\b\s*([^\s:({\[]*)', re.M)


def die(m):
    sys.exit('APN STATEMENTS REFUSED: ' + m)


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def strip_comments(t):
    t = re.sub(r'/-.*?-/', ' ', t, flags=re.S)
    return re.sub(r'--[^\n]*', ' ', t)


def squash(t):
    return re.sub(r'\s+', '', t)


def statement(text, name):
    """the text between the theorem's name and its ':= by' (comments removed)"""
    m = re.search(r'theorem\s+' + re.escape(name) + r'(?=[\s:({\[])(.*?):=\s*by', strip_comments(text), re.S)
    return m.group(1) if m else None


def meaning(st):
    """answer(True) ↔ P as P, answer(False) ↔ P as ¬(P), whitespace removed"""
    s = squash(st)
    s = s[1:] if s.startswith(':') else s
    m = re.match(r'answer\((True|False)\)↔(.*)$', s)
    if m:
        return m.group(2) if m.group(1) == 'True' else '¬(' + m.group(2) + ')'
    if s.startswith('¬') and not s.startswith('¬('):
        return '¬(' + s[1:] + ')'
    return s


def fixed_decls(text):
    """the top-level non-theorem declarations of a file, each squashed with its indented body"""
    t = strip_comments(text)
    out, cur = [], None
    for line in t.split('\n'):
        head = re.match(r'(noncomputable\s+)?(def|abbrev|structure|class|instance|variable|notation|local notation|scoped notation|irreducible_def|inductive)\b', line)
        if head and not line.startswith((' ', '\t')):
            if cur:
                out.append(cur)
            cur = line
        elif cur is not None and line.startswith((' ', '\t')) and line.strip():
            cur += ' ' + line.strip()
        else:
            if cur:
                out.append(cur)
            cur = None
    if cur:
        out.append(cur)
    return [squash(b) for b in out]


def evolve_blocks(text):
    return re.findall(r'--\s*EVOLVE-BLOCK-START(.*?)--\s*EVOLVE-BLOCK-END', text, re.S)


def outside_evolve(text):
    return re.sub(r'--\s*EVOLVE-BLOCK-START.*?--\s*EVOLVE-BLOCK-END', ' ', text, flags=re.S)


def identifiers(t):
    return set(re.findall(r'[A-Za-z_][A-Za-z0-9_\'.]*', strip_comments(t)))


def decide_one(name, apn, fc_pin, fc_head):
    """the five decisions for one file; returns a dict"""
    r = {'theorem': name}
    a = statement(re.sub(r'--\s*EVOLVE-VALUE-(START|END)', ' ', apn), 'target_theorem_0')
    p = statement(fc_pin, name)
    h = statement(fc_head, name)
    if a is None or p is None:
        return dict(r, S1=False, why='a statement is missing (APN %s, formal-conjectures %s)' % (a is not None, p is not None))
    r['answer'] = (re.search(r'answer\(\s*(True|False)\s*\)', a) or [None, None])[1]
    r['S1'] = squash(a) == squash(p)
    fc = [d for d in fixed_decls(fc_pin)]
    out = squash(strip_comments(outside_evolve(apn)))
    missing = [d for d in fc if d not in out]
    extra = [d for d in fixed_decls(outside_evolve(apn)) if d not in squash(strip_comments(fc_pin))]
    r['S2'] = not missing and not extra
    r['fixedDeclarations'] = len(fc)
    if missing or extra:
        r['S2detail'] = {'missing': [m[:160] for m in missing], 'extra': [e[:160] for e in extra]}
    declared = set()
    for blk in evolve_blocks(apn):
        for m in DECL.finditer(strip_comments(blk)):
            if m.group(2):
                declared.add(m.group(2).split('.')[-1])
    used = set(x.split('.')[-1] for x in identifiers(a) | identifiers(' '.join(fc)))
    shadow = sorted(declared & used - {'target_theorem_0'})
    r['S3'] = not shadow
    if shadow:
        r['S3detail'] = shadow
    risks = sorted(set(m.group(0) for m in RISK.finditer(strip_comments(apn))))
    r['S4'] = not risks
    if risks:
        r['S4detail'] = risks
    if h is None:
        r['S5'] = 'missing at head'
    else:
        r['S5'] = 'unchanged' if meaning(h) == meaning(p) else 'changed'
        if r['S5'] == 'changed':
            r['headStatement'] = re.sub(r'\s+', ' ', h).strip()
            r['pinStatement'] = re.sub(r'\s+', ' ', p).strip()
    return r


def run():
    pins = json.load(open(os.path.join(D, 'PINS.json')))
    for rel, f in pins['files'].items():
        if sha(os.path.join(D, rel)) != f['sha256']:
            die(rel + ' does not match its pin')
    rows = []
    for fn in sorted(os.listdir(os.path.join(D, 'apn', 'ErdosProblems'))):
        name = fn[:-5]
        n = name.split('_')[1].split('.')[0]
        apn = open(os.path.join(D, 'apn', 'ErdosProblems', fn)).read()
        rows.append(dict(decide_one(name, apn, open(os.path.join(D, 'fc-pin', n + '.lean')).read(),
                                    open(os.path.join(D, 'fc-head', n + '.lean')).read()), problem=int(n),
                         kind='variant' if '.variants.' in name else 'part' if '.parts.' in name else 'main'))
    # red controls: each kind of change planted in a copy of the 846 file must be caught by the decision that owns it
    base = open(os.path.join(D, 'apn', 'ErdosProblems', 'erdos_846.lean')).read()
    fcp, fch = open(os.path.join(D, 'fc-pin', '846.lean')).read(), open(os.path.join(D, 'fc-head', '846.lean')).read()
    reds = []

    def red(rid, what, mutated, key):
        r = decide_one('erdos_846', mutated, fcp, fch)
        reds.append({'id': rid, 'what': what, 'caughtBy': key, 'fired': r.get(key) is False})
    red('statement-weakened', 'ε > 0 replaced by ε ≥ 0 in the proved statement', base.replace('(ε > 0), A.Infinite', '(ε ≥ 0), A.Infinite', 1), 'S1')
    red('answer-flipped', 'answer(False) replaced by answer(True)', re.sub(r'answer\(\s*\n?\s*--\s*EVOLVE-VALUE-START\s*False', lambda m: m.group(0).replace('False', 'True'), base, count=1), 'S1')
    red('definition-changed', 'the definition of NonTrilinearFor weakened (≤ to <)', base.replace('ε * B.card ≤ C.card', 'ε * B.card < C.card', 1), 'S2')
    red('shadowing-def', 'a definition named WeaklyNonTrilinear declared inside an EVOLVE block',
        base.replace('-- EVOLVE-BLOCK-START', '-- EVOLVE-BLOCK-START\ndef WeaklyNonTrilinear (A : Set ℝ²) : Prop := True\n', 1), 'S3')
    red('axiom-planted', 'an axiom declared inside an EVOLVE block', base.replace('-- EVOLVE-BLOCK-START', '-- EVOLVE-BLOCK-START\naxiom cheat : False\n', 1), 'S4')
    problems = sorted(set(r['problem'] for r in rows))
    rec = {
        'what': "AlphaProof Nexus's nine Erdős proofs read against the formal statements they prove: the proved theorem equal to formal-conjectures' at the commit the repository builds against; the fixed definitions verbatim outside the agent's EVOLVE blocks; no EVOLVE declaration shadowing a statement identifier; no kernel-bypassing construct; and what formal-conjectures did to each statement afterwards. Textual and exact; the elaborated statements are Comparator's (the kernel lane).",
        'decider': sha(os.path.abspath(__file__)),
        'pins': 'corpus/alphaproof-nexus/PINS.json', 'apnCommit': pins['apnCommit'], 'fcPin': pins['fcPin'], 'fcHead': pins['fcHead'],
        'rows': rows,
        'counts': {'statements': len(rows), 'problemNumbers': len(problems), 'problems': problems,
                   'parts': sum(r['kind'] == 'part' for r in rows), 'variants': sum(r['kind'] == 'variant' for r in rows),
                   'S1': sum(r['S1'] for r in rows), 'S2': sum(r['S2'] for r in rows), 'S3': sum(r['S3'] for r in rows), 'S4': sum(r['S4'] for r in rows),
                   'changedAtHead': [r['theorem'] for r in rows if r.get('S5') == 'changed']},
        'redControls': reds,
    }
    if not all(x['fired'] for x in reds):
        die('a red control did not fire: ' + ', '.join(x['id'] for x in reds if not x['fired']))
    return rec


def main():
    rec = run()
    if '--check' in sys.argv:
        was = json.load(open(OUT))
        strip = lambda r: {k: v for k, v in r.items() if k != 'decider'}
        if strip(was) != strip(rec):
            die('the record does not re-derive')
        print('apn statements: re-derived as recorded — %d statements, %d problem numbers; S1 %d, S2 %d, S3 %d, S4 %d; changed at head: %s; %d/%d red controls fired'
              % (rec['counts']['statements'], rec['counts']['problemNumbers'], rec['counts']['S1'], rec['counts']['S2'], rec['counts']['S3'], rec['counts']['S4'],
                 ', '.join(rec['counts']['changedAtHead']) or 'none', len(rec['redControls']), len(rec['redControls'])))
        return
    open(OUT, 'w').write(json.dumps(rec, indent=1, ensure_ascii=False) + '\n')
    c = rec['counts']
    print('wrote certs/apn-statements.json — %d statements over %d problem numbers (%d parts, %d variants); S1 %d/%d, S2 %d, S3 %d, S4 %d; changed at head: %s; red controls %d/%d'
          % (c['statements'], c['problemNumbers'], c['parts'], c['variants'], c['S1'], c['statements'], c['S2'], c['S3'], c['S4'],
             ', '.join(c['changedAtHead']) or 'none', sum(x['fired'] for x in rec['redControls']), len(rec['redControls'])))


if __name__ == '__main__':
    main()
