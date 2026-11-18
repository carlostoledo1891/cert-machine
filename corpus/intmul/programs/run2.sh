#!/bin/bash
# run2.sh — the second pass (2026-11-18), after a review of the first run: zero and one for the C program, 10^8 bits in its
# other mode, and the Python reference again with the library's own counters recorded per row.
cd /home/prog; export OMP_NUM_THREADS=2
python3 q5/decide_c2.py /home/prog/q5/harness /home/prog/q5/work2 q5/c2.jsonl 4096,65536,1000000 0,1 zero,one > q5/c2.out 2>&1
python3 q5/decide_c2.py /home/prog/q5/harness /home/prog/q5/work2 q5/c2.jsonl 100000000 0 random >> q5/c2.out 2>&1
echo "C2 done $(date -u +%FT%TZ)" >> q5/c2.out
(cd src/python && PYTHONPATH=. /home/prog/venv/bin/python /home/prog/q5/decide_py2.py /home/prog/q5/py2.jsonl 900 > /home/prog/q5/py2.out 2>&1)
echo "PY2 done $(date -u +%FT%TZ)" >> q5/py2.out; touch q5/DONE2
