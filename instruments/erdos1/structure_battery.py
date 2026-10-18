#!/usr/bin/env python3
"""structure_battery.py — the battery form of structure.py (python structure.py --check), run under instruments/erdos1/.venv,
which has FLINT; PARI's gp must be on PATH. MIT"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); VENV_PY = os.path.join(HERE, '.venv', 'bin', 'python')
if not os.path.exists(VENV_PY): print('structure battery: instruments/erdos1/.venv is missing (make erdos1-venv)'); sys.exit(2)
os.chdir(HERE)
os.execv(VENV_PY, [VENV_PY, os.path.join(HERE, 'structure.py'), '--check'])
