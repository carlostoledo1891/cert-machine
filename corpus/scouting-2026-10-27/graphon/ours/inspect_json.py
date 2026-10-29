"""Inspect the structure of the claimant's step-graphon JSON (our own code; reads data only)."""
import json, sys, collections

d = json.load(open(sys.argv[1]))
print('keys:', list(d.keys()))
for k, v in d.items():
    if isinstance(v, list):
        inner = ''
        if v and isinstance(v[0], list):
            inner = ' inner lens %s' % sorted(set(len(x) for x in v))
        print(' ', k, ': list len', len(v), 'elem', type(v[0]).__name__ if v else None, inner)
    else:
        print(' ', k, '=', repr(v)[:400])
bw = d['block_weights']
print('block_weights: distinct', sorted(set(bw)), 'sum', sum(bw), 'n', len(bw))
# find the matrix-like key
for k, v in d.items():
    if isinstance(v, list) and v and isinstance(v[0], list):
        n = len(v)
        vals = collections.Counter()
        sym = True
        diag = collections.Counter()
        ints = True
        for i in range(n):
            if len(v[i]) != n:
                print('  row', i, 'len', len(v[i]))
            for j in range(n):
                x = v[i][j]
                if not isinstance(x, int):
                    ints = False
                vals[x] += 1
                if v[j][i] != x:
                    sym = False
            diag[v[i][i]] += 1
        print(' matrix key', k, 'n', n, 'symmetric', sym, 'all ints', ints)
        print('  distinct values', len(vals), 'min', min(vals), 'max', max(vals))
        print('  diagonal values', dict(diag))
        D = d.get('edge_probability_denominator')
        cnt0 = vals.get(0, 0); cntD = vals.get(D, 0)
        print('  count 0 =', cnt0, ' count D =', cntD, ' other =', sum(vals.values()) - cnt0 - cntD)
        # row multiset signature to see whether rows repeat
        rows = collections.Counter(tuple(r) for r in v)
        print('  distinct rows', len(rows))
        # row sums
        rs = collections.Counter(sum(r) for r in v)
        print('  distinct row sums', len(rs), sorted(rs.items())[:10])
        # how many distinct values per row
        dv = collections.Counter(len(set(r)) for r in v)
        print('  distinct-values-per-row histogram', sorted(dv.items()))
        # sample of most common values
        print('  most common values', vals.most_common(12))
