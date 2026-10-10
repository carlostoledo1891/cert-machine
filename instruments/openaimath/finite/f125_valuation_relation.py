"""F-125 — "Ambiently homeomorphic isolated hypersurfaces of multiplicities two and three" (openai/math family 059).

THE HEADLINE (build/sections/introduction.tex:39-52, Theorem thm:main): there are N > 3 divisible by eight and reduced
real weighted-homogeneous polynomials f1, f2 in N variables, each with an isolated critical point, ord f1 = 2,
ord f2 = 3, and an ambient homeomorphism germ (C^N, V(f1), 0) = (C^N, V(f2), 0).

THE FINITE CLAIM (build/sections/seeds.tex:7-20, Lemma seed:product): with d = 3^11,
B = {b : 0 < b < d/2, 3 does not divide b}, A_b = (d-b)/b, R_b = (2d+b)(2d-b)/((3d-b)(d+b)), there are integers e_b
with E = sum e_b > 0 and prod A_b^{e_b} = prod R_b^{e_b} = 1.
Its certificate as printed (seeds.tex:28-56): keep the columns b whose six integers d-b, b, 2d+b, 2d-b, 3d-b, d+b have
no prime factor > 4450 (1118 columns, 1100 nonzero valuation rows); repeatedly delete a column that is the only
column supported on some nonzero row (896 columns, 867 rows); the augmentation M~ by a row of ones has
rank over F_1009 equal to 868. The supplementary witness (certificate.tex:11-15): verification/support/
explicit-relation.json, 849 nonzero integer coefficients, at most 140 decimal digits each, positive sum.

WHAT IS DECIDED HERE, exactly, with code written for this audit (no release code read or run before it ran):
  1. THE LEMMA ITSELF, from the shipped explicit relation: every b lies in B, the b are distinct, every e_b is a
     nonzero integer; for every prime p, sum_b e_b v_p(A_b) = 0 and sum_b e_b v_p(R_b) = 0, with every v_p computed
     from a complete factorization (smallest-prime-factor sieve to 3d) of the six integers; E = sum e_b > 0.
     A positive rational with every p-adic valuation zero is 1 (unique factorization), so both products are 1.
     A second, independent route (no factorization): both products are reduced modulo three primes q > 3d (each
     factor is a unit there, exponents reduced mod q - 1) and each is 1 mod q. That route is a necessary
     condition only; route 1 is the proof.
  2. Every printed number about the witness: support 849, at most 140 digits, sum_e, sum_abs_e, d (JSON fields).
  3. THE PRINTED RANK CERTIFICATE, rebuilt from the definitions: the counts 1118 / 1100 after the prime cutoff and
     896 / 867 after the deletions, and rank_{F_1009} M~ = 868, computed by our own sparse elimination over F_1009.
     Direction of the modular argument: M~ has exactly 868 rows, so rank 868 mod 1009 means some 868 x 868 minor is
     nonzero mod 1009, hence a nonzero integer, so M~ has full row rank 868 over Q as well (rank mod p is a LOWER
     bound for the rank over Q; the row count is the upper bound). Then the row of ones is not in the rational row
     space of M, i.e. some rational kernel vector of M has nonzero coordinate sum — the lemma again, by a second
     route (the paper's own). The same rank is recomputed mod 1000003 as a corroboration.
  4. The two routes are tied together: the explicit witness is supported inside the 1118 cutoff columns and inside
     the 896-column core (the deletion only removes columns that every kernel vector must give coefficient zero).
  5. The chain construction of Lemma seed:chain (seeds.tex:78-114) for the 4 x 849 starting weights the
     construction uses (numerators 3b, b, d-b, d+b over D = 3d, seeds.tex:138-146): each remainder sequence
     terminates, every a_i >= 2, the terminal exponent is >= 3 and a_l c_l = D, every weight c_i / D lies in
     (0, 1/2), and the four starting numerators have the stated reduced denominators d, 3d, 3d, 3d.

WHAT IS NOT DECIDED: everything after the finite relation — Proposition seed:seeds (equality of spectra mod 2 by the
cotangent triple-angle identity, the Seifert-form and monodromy isomorphisms via Theorems bg:real and bg:orlik),
Corollary seed:prepared, the lattice/topology of sections local.tex and global.tex, and the existence of the ambient
homeomorphism. The germs themselves live in an astronomically large number of variables (the counts are built from
|e_b| ~ 10^140) and are never constructed here. This row decides a finite component, not the headline.
"""
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402

DIR = 'preprints/Ambiently-homeomorphic-isolated-hypersurfaces-of-multiplicities-two-and-three-September-24-2026/'
SEEDS = DIR + 'build/sections/seeds.tex'
CERT = DIR + 'build/sections/certificate.tex'
INTRO = DIR + 'build/sections/introduction.tex'
RELATION = DIR + 'verification/support/explicit-relation.json'

D_ = 3 ** 11
CUTOFF = 4450
P_RANK = 1009
PRINTED = {'cut_cols': 1118, 'cut_rows': 1100, 'core_cols': 896, 'core_rows': 867, 'rank': 868,
           'support': 849, 'digits': 140}


def is_prime(n):
    if n < 2:
        return False
    i = 2
    while i * i <= n:
        if n % i == 0:
            return False
        i += 1
    return True


def spf_sieve(n):
    spf = list(range(n + 1))
    i = 2
    while i * i <= n:
        if spf[i] == i:
            for k in range(i * i, n + 1, i):
                if spf[k] == k:
                    spf[k] = i
        i += 1
    return spf


def factor(n, spf):
    out = {}
    while n > 1:
        p = spf[n]
        n //= p
        out[p] = out.get(p, 0) + 1
    return out


def six(b, d=D_):
    """(numerator factors, denominator factors) of A_b and of R_b"""
    return ((d - b,), (b,)), ((2 * d + b, 2 * d - b), (3 * d - b, d + b))


def column(b, spf, d=D_):
    """the valuation column of b: {('A', p): v_p(A_b), ('R', p): v_p(R_b)}, zeros dropped"""
    col = {}
    for fam, (num, den) in zip('AR', six(b, d)):
        for sgn, ns in ((1, num), (-1, den)):
            for n in ns:
                for p, e in factor(n, spf).items():
                    k = (fam, p)
                    v = col.get(k, 0) + sgn * e
                    if v:
                        col[k] = v
                    else:
                        col.pop(k, None)
    return col


def smooth(b, spf, cutoff, d=D_):
    for (num, den) in six(b, d):
        for n in num + den:
            if max(factor(n, spf), default=1) > cutoff:
                return False
    return True


def core(cols):
    """repeatedly delete a column that is the only column supported on some nonzero row (order-independent: a
    column singly supported on a row stays so while other columns are deleted)"""
    cols = dict(cols)
    while True:
        support = {}
        for b, col in cols.items():
            for r in col:
                support.setdefault(r, []).append(b)
        dele = {bs[0] for bs in support.values() if len(bs) == 1}
        if not dele:
            return cols, support
        for b in dele:
            del cols[b]


def rank_mod_p(vectors, p):
    """rank over F_p of a list of sparse vectors {coordinate index: int}, by incremental echelon form"""
    piv = {}
    for vec in vectors:
        r = {c: v % p for c, v in vec.items() if v % p}
        while r:
            c = min(r)
            pr = piv.get(c)
            if pr is None:
                inv = pow(r[c], p - 2, p)
                piv[c] = {cc: vv * inv % p for cc, vv in r.items()}
                break
            f = r[c]
            for cc, vv in pr.items():
                x = (r.get(cc, 0) - f * vv) % p
                if x:
                    r[cc] = x
                else:
                    r.pop(cc, None)
    return len(piv)


def chain(c, D):
    """Lemma seed:chain's divisions a_i = floor(D/c_i), c_{i+1} = D - a_i c_i, to the first zero remainder"""
    cs, as_ = [c], []
    while True:
        a = D // cs[-1]
        nxt = D - a * cs[-1]
        as_.append(a)
        if nxt == 0:
            return cs, as_
        if not (0 < nxt < cs[-1]):
            return None
        cs.append(nxt)


def chain_ok(c, D):
    r = chain(c, D)
    if r is None:
        return False
    cs, as_ = r
    return (all(a >= 2 for a in as_) and as_[-1] >= 3 and as_[-1] * cs[-1] == D
            and all(0 < 2 * ci < D for ci in cs) and all(a * ci + cn == D for a, ci, cn in zip(as_, cs, cs[1:])))


def gcd(a, b):
    while b:
        a, b = b, a % b
    return a


def decide(src=None, edit=None, cutoff=CUTOFF, printed=None, p_rank=P_RANK):
    src = src or Sources()
    printed = dict(PRINTED, **(printed or {}))
    checks = []
    d = D_
    seeds = src.text(SEEDS)
    cert = src.text(CERT)
    intro = src.text(INTRO)
    flat = ' '.join(seeds.split())
    check(checks, 'the lemma and its certificate as printed (seeds.tex:7-56)',
          all(k in flat for k in ('Set $d=3^{11}$', 'no prime factor greater than $4450$', 'After the prime cutoff & $1118$ & $1100$',
                                  'After all deletions & $896$ & $867$', '\\operatorname{rank}_{\\F_{1009}}\\widetilde M=868'))
          and 'It has $849$ nonzero integer' in cert and 'at most $140$ decimal digits' in ' '.join(cert.split())
          and '\\ord_0f_1=2$ and $\\ord_0f_2=3' in intro)
    rel = json.loads(src.text(RELATION))
    pairs = [(int(t['b']), int(t['e'])) for t in rel['relation']]
    if edit:
        pairs = edit(pairs)
    spf = spf_sieve(3 * d)

    # 1. the lemma from the explicit witness: exact valuations
    bs = [b for b, _ in pairs]
    check(checks, '1. every b of the witness lies in B (0 < b < d/2, 3 does not divide b), all distinct',
          all(0 < 2 * b < d and b % 3 for b in bs) and len(set(bs)) == len(bs), '%d entries' % len(bs))
    check(checks, '1. every coefficient e_b is a nonzero integer', all(isinstance(e, int) and e != 0 for _, e in pairs))
    acc = {}
    for b, e in pairs:
        for r, v in column(b, spf, d).items():
            x = acc.get(r, 0) + e * v
            if x:
                acc[r] = x
            else:
                acc.pop(r, None)
    nprimes = len({p for b, _ in pairs for n in sum((num + den for num, den in six(b, d)), ()) for p in factor(n, spf)})
    check(checks, '1. sum_b e_b v_p(A_b) = 0 for every prime p (complete factorizations)', not any(r[0] == 'A' for r in acc),
          '%d distinct primes divide the six integers of the support' % nprimes)
    check(checks, '1. sum_b e_b v_p(R_b) = 0 for every prime p (complete factorizations)', not any(r[0] == 'R' for r in acc),
          'nonzero rows: %s' % sorted(acc)[:4] if acc else '')
    E = sum(e for _, e in pairs)
    check(checks, '1. E = sum e_b > 0', E > 0, '%d digits' % len(str(abs(E))))
    qs = []
    q = 3 * d + 1
    while len(qs) < 3:
        if is_prime(q):
            qs.append(q)
        q += 1
    ok_mod = True
    for q in qs:
        pa = pr = 1
        for b, e in pairs:
            k = e % (q - 1)
            (nA, dA), (nR, dR) = six(b, d)
            pa = pa * pow(nA[0], k, q) * pow(pow(dA[0], k, q), q - 2, q) % q
            pr = pr * pow(nR[0] * nR[1] % q, k, q) * pow(pow(dR[0] * dR[1] % q, k, q), q - 2, q) % q
        ok_mod = ok_mod and pa == 1 and pr == 1
    check(checks, '1. second route: prod A_b^e_b = prod R_b^e_b = 1 modulo q = %s (no factorization; necessary only)' % qs, ok_mod)

    # 2. printed numbers about the witness
    check(checks, '2. support size = %d (printed in certificate.tex and the JSON)' % printed['support'],
          len(pairs) == printed['support'] == rel['support_size'], str(len(pairs)))
    digits = max(len(str(abs(e))) for _, e in pairs)
    check(checks, '2. at most %d decimal digits per coefficient (max_abs_e_digits)' % printed['digits'],
          digits <= printed['digits'] and digits == rel['max_abs_e_digits'], str(digits))
    check(checks, '2. JSON sum_e, sum_abs_e and d equal the recomputed values',
          E == int(rel['sum_e']) and sum(abs(e) for _, e in pairs) == int(rel['sum_abs_e']) and rel['d'] == d)

    # 3. the printed rank certificate, rebuilt from the definitions
    B = [b for b in range(1, (d + 1) // 2) if b % 3]
    cut = {b: column(b, spf, d) for b in B if smooth(b, spf, cutoff, d)}
    cut_rows = {r for col in cut.values() for r in col}
    check(checks, '3. after the prime cutoff %d: %d columns, %d nonzero valuation rows' % (cutoff, printed['cut_cols'], printed['cut_rows']),
          len(cut) == printed['cut_cols'] and len(cut_rows) == printed['cut_rows'], '%d columns, %d rows (|B| = %d)' % (len(cut), len(cut_rows), len(B)))
    kept, support = core(cut)
    check(checks, '3. after all deletions: %d columns, %d nonzero rows' % (printed['core_cols'], printed['core_rows']),
          len(kept) == printed['core_cols'] and len(support) == printed['core_rows'], '%d columns, %d rows' % (len(kept), len(support)))
    # M~ transposed: one sparse vector per column b, coordinates = the rows (largest primes first, so the sparse
    # rows pivot first) and last the row of ones; rank(M~) = rank(M~^T)
    order = sorted(support, key=lambda r: (-r[1], r[0]))
    idx = {r: i for i, r in enumerate(order)}
    ones = len(order)
    vecs = []
    for b in sorted(kept):
        v = {idx[r]: x for r, x in kept[b].items()}
        v[ones] = 1
        vecs.append(v)
    rk = rank_mod_p(vecs, p_rank)
    check(checks, '3. %d is prime' % p_rank, is_prime(p_rank))
    check(checks, '3. rank over F_%d of M~ (%d x %d) = %d = its row count, so M~ has full row rank over Q'
          % (p_rank, len(order) + 1, len(kept), printed['rank']), rk == printed['rank'] == len(order) + 1, 'rank %d' % rk)
    rk2 = rank_mod_p(vecs, 1000003)
    check(checks, '3. corroboration: 1000003 is prime and rank over F_1000003 of M~ = %d' % printed['rank'], is_prime(1000003) and rk2 == printed['rank'], 'rank %d' % rk2)

    # 4. the two routes agree on where the relation lives
    in_cut = sum(1 for b in bs if b in cut)
    in_core = sum(1 for b in bs if b in kept)
    check(checks, '4. the witness is supported inside the cutoff columns and inside the 896-column core',
          in_cut == len(bs) and in_core == len(bs), '%d of %d in the cutoff set, %d in the core' % (in_cut, len(bs), in_core))

    # 5. the chains of Lemma seed:chain for the starting weights the construction uses
    Dc = 3 * d
    nums = [c for b in bs for c in (3 * b, b, d - b, d + b)]
    check(checks, '5. every starting weight numerator (3b, b, d-b, d+b over D = 3^12) gives a chain with all a_i >= 2, '
          'terminal exponent >= 3, a_l c_l = D, weights in (0, 1/2)', all(chain_ok(c, Dc) for c in nums), '%d chains' % len(nums))
    check(checks, '5. reduced denominators: b/d has denominator d; b/(3d), (d-b)/(3d), (d+b)/(3d) have denominator 3d',
          all(gcd(b, d) == 1 and gcd(b, Dc) == 1 and gcd(d - b, Dc) == 1 and gcd(d + b, Dc) == 1 for b in bs))
    ok = all(c['pass'] for c in checks)
    return {'verdict': 'CERTIFIED' if ok else 'REFUTED', 'checks': checks, 'sources': src.read,
            'decides': 'a finite component: Lemma seed:product (the integer relation with E > 0 and both products 1), '
                       'by the shipped witness and by the printed F_1009 rank certificate, plus the chain arithmetic; '
                       'not the spectra, the lattice/topology, or the homeomorphism',
            'value': {'E_digits': len(str(E)), 'E_mod_10^12': E % 10 ** 12, 'support': len(pairs), 'max_digits': digits,
                      'cutoff_columns': len(cut), 'cutoff_rows': len(cut_rows), 'core_columns': len(kept),
                      'core_rows': len(support), 'rank_F1009': rk, 'kernel_dim_M_over_Q': len(kept) - len(support)}}


def forge():
    """each must NOT certify"""
    out = []

    def bump(pairs):
        return [(b, e + 1) if i == 0 else (b, e) for i, (b, e) in enumerate(pairs)]
    out.append(('the witness: first coefficient + 1', decide(edit=bump)['verdict']))

    def move(pairs):
        b0, e0 = pairs[-1]
        b1 = b0 + 1 if (b0 + 1) % 3 else b0 + 2
        return pairs[:-1] + [(b1, e0)]
    out.append(('the witness: last b moved to the next admissible b', decide(edit=move)['verdict']))
    out.append(('the printed rank changed to 867', decide(printed={'rank': 867})['verdict']))
    out.append(('the prime cutoff moved to 4440 (counts must change)', decide(cutoff=4440)['verdict']))
    return out


if __name__ == '__main__':
    t = time.time()
    res = decide()
    print(json.dumps({k: res[k] for k in ('verdict', 'decides', 'value')}, indent=1))
    for c in res['checks']:
        print(('PASS ' if c['pass'] else 'FAIL ') + c['check'], c['detail'])
    print('%.1fs' % (time.time() - t))
    t = time.time()
    print(forge())
    print('forges %.1fs' % (time.time() - t))
