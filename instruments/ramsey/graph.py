#!/usr/bin/env python3
"""Read one of Google's Ramsey adjacency files and refuse anything that is not a simple graph.

The released files print a NumPy array: rows of 0/1 separated by spaces, each row in brackets,
the whole in brackets, rows wrapped across lines. read() returns (n, adj) with adj[v] a bitmask
of v's neighbours, or raises ValueError naming what is wrong. Every check a proof needs is made
here, because Google's notebook makes fewer: it reads only the upper triangle (so symmetry and
the diagonal are never looked at) and treats any entry other than 1 as a non-edge.

  · every row has n entries and there are n rows (square);
  · every entry is 0 or 1;
  · the matrix is symmetric and its diagonal is zero (a simple, undirected graph);
  · n is the vertex count the file's own name claims (m − 1 for "R(s, t) >= m").
"""
import re

ROW = re.compile(r'\[([^\[\]]*)\]')


def read(text):
    body = text.strip()
    if not (body.startswith('[[') and body.endswith(']]')):
        raise ValueError('not a bracketed matrix')
    rows = ROW.findall(body[1:-1])
    if not rows:
        raise ValueError('no rows')
    M = []
    for i, r in enumerate(rows):
        toks = r.split()
        if any(t not in ('0', '1') for t in toks):
            raise ValueError('row %d has an entry that is not 0 or 1' % i)
        M.append([t == '1' for t in toks])
    n = len(M)
    if any(len(r) != n for r in M):
        raise ValueError('not square: %d rows, row lengths %s' % (n, sorted(set(len(r) for r in M))))
    for i in range(n):
        if M[i][i]:
            raise ValueError('vertex %d is joined to itself' % i)
        for j in range(i + 1, n):
            if M[i][j] != M[j][i]:
                raise ValueError('not symmetric at (%d, %d)' % (i, j))
    adj = [sum(1 << j for j in range(n) if M[i][j]) for i in range(n)]
    return n, adj


NAME = re.compile(r'R_(\d+)_(\d+)_ge_(\d+)\.txt$')


def claim(filename):
    """(s, t, m) from a corpus file name R_s_t_ge_m.txt (renamed from Google's 'R(s, t) >= m.txt')."""
    m = NAME.search(filename)
    if not m:
        raise ValueError('not a claim file name: ' + filename)
    return tuple(int(x) for x in m.groups())
