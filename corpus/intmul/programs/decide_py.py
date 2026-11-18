#!/usr/bin/env python3
"""decide_py.py — the Python reference of Algorithm 1 (subnlogn.multiply) on operands WE choose, decided twice: by
Python's own integers, and (up to 4,096 bits) by a schoolbook product in base 2^16 written here, which shares no
multiplication code with CPython's long arithmetic beyond single 32-bit products. One JSON line per case.
usage: decide_py.py <out.jsonl> <seconds per case>"""
import sys, json, time, random, signal
from subnlogn.multiply import multiply
from subnlogn.schedule import faithful_schedule, test_policy
out, limit = sys.argv[1], int(sys.argv[2])
SEED = 20261117
def school(a, b):
    A = [(a >> (16 * i)) & 0xffff for i in range((a.bit_length() + 15) // 16)]
    B = [(b >> (16 * i)) & 0xffff for i in range((b.bit_length() + 15) // 16)]
    acc = [0] * (len(A) + len(B) + 1)
    for i, x in enumerate(A):
        carry = 0
        for j, y in enumerate(B):
            t = acc[i + j] + x * y + carry          # below 2^33
            acc[i + j] = t & 0xffff; carry = t >> 16
        k = i + len(B)
        while carry:
            t = acc[k] + carry; acc[k] = t & 0xffff; carry = t >> 16; k += 1
    r = 0
    for d in reversed(acc): r = (r << 16) | d
    return r
class TimeUp(Exception): pass
def alarm(*_): raise TimeUp()
signal.signal(signal.SIGALRM, alarm)
policies = [('unforced (the 2D fallback)', lambda a, b: multiply(a, b)),
            ('forced d=4, Walsh middle', lambda a, b: multiply(a, b, schedule=test_policy(4, middle='walsh'))),
            ('forced d=4, Bluestein middle', lambda a, b: multiply(a, b, schedule=test_policy(4, middle='bluestein'))),
            ('unforced, inner-multiplier hierarchy', lambda a, b: multiply(a, b, schedule=faithful_schedule(), products='hierarchy'))]
def cases(n):
    r = random.Random(SEED * 1000003 + n); top = 1 << (n - 1)
    return [('random', r.getrandbits(n) | top, r.getrandbits(n) | top), ('ones', (1 << n) - 1, (1 << n) - 1), ('pow2', top, top),
            ('unbalanced', r.getrandbits(n) | top, 3), ('zero', r.getrandbits(n) | top, 0), ('one', r.getrandbits(n) | top, 1)]
with open(out, 'a') as o:
    for n in [1, 2, 8, 64, 70, 96, 256, 1024, 4096]:
        for name, a, b in cases(n):
            for pol, f in policies:
                row = {'bits': n, 'case': name, 'policy': pol}
                t0 = time.time(); signal.alarm(limit)
                try:
                    got = f(a, b); signal.alarm(0)
                    row['python_int'] = 'EXACT' if got == a * b else 'MISMATCH'
                    row['schoolbook'] = ('EXACT' if got == school(a, b) else 'MISMATCH') if n <= 4096 else 'not run'
                except TimeUp:
                    row['python_int'] = row['schoolbook'] = 'REFUSED on resources (over %d s)' % limit
                except Exception as e:
                    signal.alarm(0); row['python_int'] = row['schoolbook'] = 'RAISED ' + type(e).__name__ + ': ' + str(e)[:160]
                row['seconds'] = round(time.time() - t0, 2)
                o.write(json.dumps(row) + '\n'); o.flush(); print(json.dumps(row), flush=True)
