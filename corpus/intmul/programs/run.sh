#!/bin/bash
# run.sh — on the pod, as user prog: the release at its pin, the harness, both deciders. Low priority.
set -uo pipefail
cd /home/prog
PIN=4738aeff839dafd4bbcd176a0550f70242d966a6
[ -d src ] || (git clone -q https://github.com/lockqueue/intmul.git src && git -C src checkout -q $PIN)
git -C src rev-parse HEAD > q5/pin.txt
cp q5/harness.c src/companion/impl/ && cd src/companion/impl && gcc -O2 -march=native -fopenmp -DNDEBUG harness.c -o /home/prog/q5/harness -lmpfr -lgmp -lm 2> /home/prog/q5/build.log; echo "build exit $?" >> /home/prog/q5/build.log
(make all > /home/prog/q5/release-build.log 2>&1; OMP_NUM_THREADS=2 ./intmul_fastdft selftest > /home/prog/q5/release-selftest.log 2>&1; echo "selftest exit $?" >> /home/prog/q5/release-selftest.log)
cd /home/prog
export OMP_NUM_THREADS=2
python3 q5/decide_c.py /home/prog/q5/harness /home/prog/q5/work q5/c.jsonl 4096,65536,1000000,10000000 0,1 > q5/c.out 2>&1
python3 q5/decide_c.py /home/prog/q5/harness /home/prog/q5/work q5/c.jsonl 100000000 1 random,ones >> q5/c.out 2>&1
echo "C done $(date -u +%FT%TZ)" >> q5/c.out
# the Python reference wants CPython 3.13
[ -x $HOME/.local/bin/uv ] || curl -LsSf https://astral.sh/uv/install.sh | sh > q5/uv.log 2>&1
$HOME/.local/bin/uv venv --python 3.13 venv >> q5/uv.log 2>&1 && $HOME/.local/bin/uv pip install --python venv/bin/python mpmath==1.3.0 >> q5/uv.log 2>&1
venv/bin/python --version > q5/python-version.txt 2>&1
(cd src/python && PYTHONPATH=. /home/prog/venv/bin/python /home/prog/q5/decide_py.py /home/prog/q5/py.jsonl 600 > /home/prog/q5/py.out 2>&1)
echo "PY done $(date -u +%FT%TZ)" >> q5/py.out
touch q5/DONE
