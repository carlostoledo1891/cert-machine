#!/usr/bin/env python3
"""openai-math-kernel-result.py — the facts of one lane-K job, as JSON on stdout.

Runs inside .github/workflows/openai-math-kernel.yml after Comparator. It reports what the
run printed and nothing more: the exit code, the time, the peak memory, which kernels said
what, and the last lines of the logs. It writes NO verdict word — the ledger tool
(tools/record-openai-math-kernel.js) decides CERTIFIED / REFUTED / REFUSED from these
facts, so the rule lives in one module.

usage: openai-math-kernel-result.py <out-dir> <challenge>
"""
import json
import os
import re
import sys

out, ch = sys.argv[1], sys.argv[2]


def read(name):
    p = os.path.join(out, name)
    if not os.path.exists(p):
        return None
    with open(p, encoding='utf-8', errors='replace') as f:
        return f.read()


log, err = read('comparator.log'), read('comparator.err')
exit_txt, sec_txt = read('exit.txt'), read('seconds.txt')
both = (log or '') + '\n' + (err or '')
kernels = sorted(set(re.findall(r'^(.*kernel (?:accepts|rejects).*)$', both, re.M)))
rss = re.search(r'Maximum resident set size \(kbytes\): (\d+)', err or '')
jobs = re.findall(r'Build completed successfully \((\d+) jobs\)', log or '')
fact = {
    'challenge': ch,
    'ran': exit_txt is not None,
    'exit': int(exit_txt) if exit_txt and exit_txt.strip().lstrip('-').isdigit() else None,
    'seconds': int(sec_txt) if sec_txt and sec_txt.strip().isdigit() else None,
    'cacheSeconds': int(os.environ['CACHE_SECONDS']) if os.environ.get('CACHE_SECONDS', '').isdigit() else None,
    'okay': 'Your solution is okay!' in both,
    'kernels': kernels,
    'buildJobs': [int(j) for j in jobs],
    'maxRssKB': int(rss.group(1)) if rss else None,
    'env': (read('env.txt') or '').strip().splitlines(),
    'logTail': [l for l in (log or '').splitlines() if l.strip()][-25:],
    'errTail': [l for l in (err or '').splitlines() if l.strip() and not l.lstrip().startswith(('Command being timed', 'User time', 'System time', 'Percent of CPU', 'Elapsed', 'Average', 'Maximum resident', 'Major', 'Minor', 'Voluntary', 'Involuntary', 'Swaps', 'File system', 'Socket', 'Signals', 'Page size', 'Exit status'))][-25:],
}
s_log, s_err, s_exit = read('strict.log'), read('strict.err'), read('strict-exit.txt')
if s_exit is not None:
    s_both = (s_log or '') + '\n' + (s_err or '')
    fact['strict'] = {
        'what': 'the same config with definition_names emptied: every definition compared body and all',
        'exit': int(s_exit) if s_exit.strip().lstrip('-').isdigit() else None,
        'okay': 'Your solution is okay!' in s_both,
        'mismatches': sorted(set(re.findall(r"Const does not match between challenge and target '([^']+)'", s_both))),
        'errTail': [l for l in (s_err or '').splitlines() if l.strip()][-15:],
        'logTail': [l for l in (s_log or '').splitlines() if l.strip()][-10:],
    }
t_exit = read('transfer-exit.txt')
if t_exit is not None:
    t_log, t_err = read('transfer.log') or '', read('transfer.err') or ''
    t_all = t_log + '\n' + t_err
    fact['transfer'] = {
        'what': 'a copy of the challenge under namespace AuditCopy, elaborated beside the solution; example : type_of% @AuditCopy.T := @OAI.T for each theorem',
        'exit': int(t_exit) if t_exit.strip().lstrip('-').isdigit() else None,
        'errors': [l for l in t_all.splitlines() if ': error' in l or l.startswith('error')][:20],
        'logTail': [l for l in t_log.splitlines() if l.strip()][-12:],
    }
print(json.dumps(fact, indent=1))
