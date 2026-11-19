#!/usr/bin/env python3
"""series.py — the two series of the report's figure, per residue r = n mod 1096, as integers over 2192:

  rounded   2192 * (M(C_n) - f(n)), counted here from the bits of the rounded twelve blocks at n = 1096 + r
            (judge.py D7 decides that this depends only on r, for n = 1..3288)
  proposed  c_r, read from the two models' table (corpus/twelve-blocks/run/gpt/optimum-residues.json): the proposed
            exact minimum is V(n) = f(n) + c_r / 2192 for n >= 92,000. NOT decided here.

Writes certs/twelve-blocks-series.json; --check recounts and compares.   f(n) = 117 n^2/2192 - n/2."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); sys.path.insert(0, HERE)
import ap3, judge                                           # noqa: E402
OUT = os.path.join(ROOT, 'certs', 'twelve-blocks-series.json')


def build():
    T = {row['residue']: row for row in judge.table()}
    rows = []
    for r in range(1096):
        n = 1096 + r
        num = 2192 * ap3.count_masks(judge.rounded(n)[0]) - (117 * n * n - 1096 * n)      # 2192 (M - f), an integer
        c = T[r]['excess_numerator']
        assert (num - c) % 2192 == 0 and (num - c) // 2192 == -T[r]['rounded_delta'] >= 0, r       # the field is the proposed minimum minus M(C_n)
        rows.append([r, num, c])
    return {'what': 'Per residue r = n mod 1096, as integers over 2192: [r, 2192 (M(C_n) - f(n)) counted at n = 1096 + r, c_r of the two models\' table]. '
                    'The first is decided (instruments/twelve-blocks/judge.py D7, D9); the second is the proposed exact minimum for n >= 92,000 and is not decided here.',
            'denominator': 2192, 'rows': rows,
            'rounded': {'min': min(x[1] for x in rows), 'max': max(x[1] for x in rows)}, 'proposed': {'min': min(x[2] for x in rows), 'max': max(x[2] for x in rows)},
            'roundedEqualsProposedOn': sum(1 for x in rows if x[1] == x[2])}


if __name__ == '__main__':
    d = build()
    if sys.argv[1:] == ['--check']:
        ok = json.load(open(OUT)) == d
        print('PASS: the figure\'s series recounted' if ok else 'REFUSED: the series differ from certs/twelve-blocks-series.json'); sys.exit(0 if ok else 1)
    json.dump(d, open(OUT, 'w'), separators=(',', ':'))
    print('written:', os.path.relpath(OUT, ROOT), d['rounded'], d['proposed'], 'equal on', d['roundedEqualsProposedOn'])
