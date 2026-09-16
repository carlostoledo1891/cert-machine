#!/bin/sh
cd /Users/carlostoledo/Projects/cert-machine/instruments/erdos1
L=/Users/carlostoledo/Projects/cert-machine/instruments/erdos1/../../certs/erdos1/logs
# 3. the stretch: (3/5, 15, 3), d = 3375
/Users/carlostoledo/Projects/cert-machine/instruments/erdos1/.venv/bin/python hnf_pari.py --alpha 3/5 15 3 > $L/hnf-b15-s3-a3_5.log 2>&1
/Users/carlostoledo/Projects/cert-machine/instruments/erdos1/.venv/bin/python build.py --alpha 3/5 --out /Users/carlostoledo/Projects/cert-machine/instruments/erdos1/../../certs/erdos1/cert-b15-s3-a3_5.json 15 3 32 34 36 > $L/build-b15-s3-a3_5.log 2>&1
/Users/carlostoledo/Projects/cert-machine/instruments/erdos1/.venv/bin/python verify.py --k 36 /Users/carlostoledo/Projects/cert-machine/instruments/erdos1/../../certs/erdos1/cert-b15-s3-a3_5.json > /Users/carlostoledo/Projects/cert-machine/instruments/erdos1/../../certs/erdos1/verify-b15-s3-a3_5.log 2>&1
/Users/carlostoledo/Projects/cert-machine/instruments/erdos1/.venv/bin/python report.py /Users/carlostoledo/Projects/cert-machine/instruments/erdos1/../../certs/erdos1/cert-b15-s3-a3_5.json > /dev/null 2>&1
echo PUSH-BIG-DONE > $L/push-big.done
