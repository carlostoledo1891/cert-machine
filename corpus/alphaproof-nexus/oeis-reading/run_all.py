#!/usr/bin/env python3
# Re-runs every translation and stores its JSON line in results/<A-number>.json
import os, subprocess, sys, json
HERE = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(HERE, 'results')
os.makedirs(out, exist_ok=True)
for f in sorted(os.listdir(HERE)):
    if f.startswith('A') and f.endswith('.py'):
        r = subprocess.run([sys.executable, '-I', os.path.join(HERE, f)], capture_output=True, text=True)
        line = r.stdout.strip().splitlines()[-1] if r.stdout.strip() else json.dumps({'error': r.stderr[-500:]})
        open(os.path.join(out, f[:-3] + '.json'), 'w').write(line + '\n')
        d = json.loads(line)
        print(f, d.get('termsChecked'), d.get('termsAgree'), d.get('firstDisagreement'), d.get('error', ''))
