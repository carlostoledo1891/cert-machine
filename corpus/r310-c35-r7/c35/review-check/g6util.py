"""graph6 helpers and the circulant C35(1,7,11,16) (C35 review check, 2026-11-23)."""
def to_g6(adj):
    n = len(adj); bits = [1 if adj[i][j] else 0 for j in range(n) for i in range(j)]
    bits += [0] * (-len(bits) % 6)
    return chr(n + 63) + ''.join(chr(63 + int(''.join(map(str, bits[k:k + 6])), 2)) for k in range(0, len(bits), 6))

def from_g6(s):
    s = s.strip(); n = ord(s[0]) - 63; data = [ord(c) - 63 for c in s[1:]]
    adj = [[False] * n for _ in range(n)]; b = 0
    for j in range(1, n):
        for i in range(j):
            if (data[b // 6] >> (5 - b % 6)) & 1:
                adj[i][j] = adj[j][i] = True
            b += 1
    return adj

STEPS = (1, 7, 11, 16)
def circulant(n=35, steps=STEPS):
    D = {s % n for s in steps} | {(-s) % n for s in steps}
    return [[((v - u) % n) in D for v in range(n)] for u in range(n)]
