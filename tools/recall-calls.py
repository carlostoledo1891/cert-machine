#!/usr/bin/env python3
"""recall-calls.py — copy every tool call a reading-recall reader made out of its session transcript, so that what the
reader opened can be audited from the corpus without the transcript (corpus/openai-math/recall-2026-10-19/calls/).

Each reader was an AI agent told to open nothing outside its packets; this keeps the evidence of whether it did: the tool
name and the full input of every call, in order. tools/score-reading-recall.py audits them (every absolute path inside
the allowed directories, no '..', no home directory). Run once, by the session that ran the readers, with the transcript
paths; the transcripts themselves are local and are not committed.

usage: python3 tools/recall-calls.py <label>=<transcript.jsonl> [...]
MIT"""
import json
import os
import sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
OUT = os.path.join(ROOT, 'corpus', 'openai-math', 'recall-2026-10-19', 'calls')
os.makedirs(OUT, exist_ok=True)
for arg in sys.argv[1:]:
    label, path = arg.split('=', 1)
    calls = []
    for line in open(path, encoding='utf-8'):
        try:
            o = json.loads(line)
        except ValueError:
            continue
        if o.get('type') != 'assistant':
            continue
        for c in (o.get('message') or {}).get('content') or []:
            if isinstance(c, dict) and c.get('type') == 'tool_use' and c.get('name') != 'SubagentHandback':
                calls.append({'tool': c['name'], 'input': c.get('input', {})})
    with open(os.path.join(OUT, label + '.json'), 'w', encoding='utf-8') as f:
        json.dump({'reader': label, 'calls': calls}, f, indent=1, ensure_ascii=False)
        f.write('\n')
    print('%s: %d calls' % (label, len(calls)))
