#!/usr/bin/env python3
"""effective_battery.py — the battery form of effective.py (python effective.py --check), run under instruments/erdos1/.venv. MIT"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); VENV_PY = os.path.join(HERE, '.venv', 'bin', 'python')
if not os.path.exists(VENV_PY): print('effective battery: instruments/erdos1/.venv is missing (make erdos1-venv)'); sys.exit(2)
os.chdir(HERE)
os.execv(VENV_PY, [VENV_PY, os.path.join(HERE, 'effective.py'), '--check'])
