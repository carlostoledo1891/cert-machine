#!/bin/sh
cd /Users/carlostoledo/Projects/cert-machine/instruments/erdos1
L=/Users/carlostoledo/Projects/cert-machine/instruments/erdos1/../../certs/erdos1/logs
# 1. the smallest set: k = 21 at (3/5, 9, 2)
/Users/carlostoledo/Projects/cert-machine/instruments/erdos1/.venv/bin/python build.py --alpha 3/5 --out /Users/carlostoledo/Projects/cert-machine/instruments/erdos1/../../certs/erdos1/cert-b9-s2-a3_5-k21.json 9 2 21 > $L/build-b9-s2-a3_5-k21.log 2>&1
/Users/carlostoledo/Projects/cert-machine/instruments/erdos1/.venv/bin/python verify.py /Users/carlostoledo/Projects/cert-machine/instruments/erdos1/../../certs/erdos1/cert-b9-s2-a3_5-k21.json > /Users/carlostoledo/Projects/cert-machine/instruments/erdos1/../../certs/erdos1/verify-b9-s2-a3_5-k21.log 2>&1
/Users/carlostoledo/Projects/cert-machine/instruments/erdos1/.venv/bin/python report.py /Users/carlostoledo/Projects/cert-machine/instruments/erdos1/../../certs/erdos1/cert-b9-s2-a3_5-k21.json > /dev/null 2>&1
# 2. s = 2 tilts at larger b
/Users/carlostoledo/Projects/cert-machine/instruments/erdos1/.venv/bin/python hnf_pari.py --alpha 3/4 21 2 > $L/hnf-b21-s2-a3_4.log 2>&1
/Users/carlostoledo/Projects/cert-machine/instruments/erdos1/.venv/bin/python build.py --alpha 3/4 --out /Users/carlostoledo/Projects/cert-machine/instruments/erdos1/../../certs/erdos1/cert-b21-s2-a3_4.json 21 2 20 22 24 26 28 > $L/build-b21-s2-a3_4.log 2>&1
/Users/carlostoledo/Projects/cert-machine/instruments/erdos1/.venv/bin/python verify.py /Users/carlostoledo/Projects/cert-machine/instruments/erdos1/../../certs/erdos1/cert-b21-s2-a3_4.json > /Users/carlostoledo/Projects/cert-machine/instruments/erdos1/../../certs/erdos1/verify-b21-s2-a3_4.log 2>&1
/Users/carlostoledo/Projects/cert-machine/instruments/erdos1/.venv/bin/python report.py /Users/carlostoledo/Projects/cert-machine/instruments/erdos1/../../certs/erdos1/cert-b21-s2-a3_4.json > /dev/null 2>&1
/Users/carlostoledo/Projects/cert-machine/instruments/erdos1/.venv/bin/python hnf_pari.py --alpha 4/5 31 2 > $L/hnf-b31-s2-a4_5.log 2>&1
/Users/carlostoledo/Projects/cert-machine/instruments/erdos1/.venv/bin/python build.py --alpha 4/5 --out /Users/carlostoledo/Projects/cert-machine/instruments/erdos1/../../certs/erdos1/cert-b31-s2-a4_5.json 31 2 22 24 26 28 30 > $L/build-b31-s2-a4_5.log 2>&1
/Users/carlostoledo/Projects/cert-machine/instruments/erdos1/.venv/bin/python verify.py /Users/carlostoledo/Projects/cert-machine/instruments/erdos1/../../certs/erdos1/cert-b31-s2-a4_5.json > /Users/carlostoledo/Projects/cert-machine/instruments/erdos1/../../certs/erdos1/verify-b31-s2-a4_5.log 2>&1
/Users/carlostoledo/Projects/cert-machine/instruments/erdos1/.venv/bin/python report.py /Users/carlostoledo/Projects/cert-machine/instruments/erdos1/../../certs/erdos1/cert-b31-s2-a4_5.json > /dev/null 2>&1
echo PUSH-SMALL-DONE > $L/push-small.done
