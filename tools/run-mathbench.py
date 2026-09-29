#!/usr/bin/env python3
"""run-mathbench.py — Certified MathBench v0, one campaign under one dollar ceiling.

The pre-registration is notes/mathbench-v0-preregistration-2026-09-29.md; this script runs exactly it. For every
family of instruments/mathbench/families.py and every rung of its ladder: the dumb baseline's construction is
decided first (free, model "baseline"), then each model is asked once per rung through tools/llm-harness.py, which
runs the family's red and green controls before the first call and reserves each call's worst case against the
remaining budget. The ceiling is the campaign's: before every harness run the dollars already spent under the tag
are summed from the ledger's own usage rows and only the rest is passed on, so no run can overspend another.

usage: python3 tools/run-mathbench.py [--cap 30] [--tag v0] [--models claude-haiku-4-5-20251001,claude-sonnet-5,claude-opus-5]
       python3 tools/run-mathbench.py --baseline-only"""
import argparse
import json
import os
import subprocess
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
sys.path.insert(0, os.path.join(ROOT, 'instruments', 'mathbench'))
from families import BENCH  # noqa: E402

LEDGER = os.path.join(ROOT, 'certs', 'mathbench-ledger.jsonl')


def spent(tag):
    if not os.path.exists(LEDGER):
        return 0.0
    tot = 0.0
    for line in open(LEDGER):
        r = json.loads(line)
        if r.get('tag') == tag and r.get('usage'):
            tot += r['usage'].get('usd', 0.0)
    return tot


def baseline_rows(tag):
    """the dumb baseline, decided rung by rung; written once per tag"""
    have = set()
    if os.path.exists(LEDGER):
        for line in open(LEDGER):
            r = json.loads(line)
            if r.get('model') == 'baseline' and r.get('tag') == tag:
                have.add((r['family'], r['target']))
    out = []
    for name, F in BENCH.items():
        f = F()
        for t in f.LADDER:
            if (name, str(t)) in have:
                continue
            b = f.baseline(t)
            ok = f.interesting(b, t)
            v = f.certify(b, t) if ok else None
            out.append({'family': name, 'model': 'baseline', 'tag': tag, 'target': str(t), 'proposal_raw': '(the family\'s baseline() construction)',
                        'obj': repr(b), 'outcome': 'rejected' if not ok else ('certified' if v.holds else 'refuted') if v else 'undecided',
                        'statement': f.statement(b, t), 'witness': v.witness if v else None, 'certificate': v.certificate if v else None,
                        'key': f.key(b), 'latency_s': 0.0, 'usage': None})
    with open(LEDGER, 'a') as fh:
        for r in out:
            fh.write(json.dumps(r) + '\n')
    return len(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--cap', type=float, default=30.0)
    ap.add_argument('--tag', default='v0')
    ap.add_argument('--models', default='claude-haiku-4-5-20251001,claude-sonnet-5,claude-opus-5')
    ap.add_argument('--max-tokens', type=int, default=24000)
    ap.add_argument('--baseline-only', action='store_true')
    a = ap.parse_args()
    print(f'baseline: {baseline_rows(a.tag)} rows written', file=sys.stderr)
    if a.baseline_only:
        return 0
    for model in a.models.split(','):
        for name, F in BENCH.items():
            left = a.cap - spent(a.tag)
            print(f'{model} {name}: ${spent(a.tag):.4f} spent of ${a.cap:.2f}', file=sys.stderr)
            if left <= 0.05:
                print('CAMPAIGN CAP reached: stopping', file=sys.stderr)
                return 0
            cmd = [sys.executable, os.path.join(ROOT, 'tools', 'llm-harness.py'), '--family', name, '--model', model, '--n', str(len(F.LADDER)),
                   '--seed', '1', '--ledger', LEDGER, '--tag', a.tag, '--max-tokens', str(a.max_tokens), '--stream', '--cap-usd', f'{left:.4f}']
            p = subprocess.run(cmd, capture_output=True, text=True)
            sys.stderr.write(p.stderr[-2000:])
            if p.returncode != 0:
                print(f'harness exited {p.returncode} for {model} {name}', file=sys.stderr)
    print(f'campaign {a.tag}: ${spent(a.tag):.4f} spent of ${a.cap:.2f}', file=sys.stderr)
    return 0


if __name__ == '__main__':
    sys.exit(main())
