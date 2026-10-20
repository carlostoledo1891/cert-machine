#!/usr/bin/env python3
# Assembles readings.json from: the hand readings below, lean_statements.json (exact theorem text),
# and results/<A>.json (output of each Python translation; regenerate with run_all.py).
import os, json
HERE = os.path.dirname(os.path.abspath(__file__))
ST = json.load(open(os.path.join(HERE, 'lean_statements.json')))
def res(py):
    return json.load(open(os.path.join(HERE, 'results', py[:-3] + '.json')))

PAPER = 'arXiv 2605.22763 v1 (May 2026)'
R = []
def add(file, anumber, py, termsRange, quote, source, word, declared, reason, notes, proof, extra_disagree=None):
    r = res(py)
    R.append({
        'file': file, 'anumber': anumber,
        'conjectureQuote': quote, 'conjectureSource': source,
        'termsChecked': r['termsChecked'], 'termsRange': termsRange,
        'termsAgree': r['termsAgree'], 'firstDisagreement': r['firstDisagreement'],
        'word': word, 'declared': declared, 'reason': reason,
        'leanStatement': ST[file], 'notes': notes, 'oeisListsProof': proof,
        'python': py,
    })

add('A224515_conjecture_existence.lean', 'A224515', 'A224515.py', 'n = 0..1000 (b-file); least k found by scanning k < 3,000,000',
    'Conjectures: 1. a(n) >= 0. 2. Least k is also the only such k.  [name: a(n) = least k such that sqrt(k^2 XOR (k+1)^2) = 2*n+1, a(n) = -1 if there is no such k.]',
    'A224515 comments (unsigned; entry by Alex Ratushnyak, Apr 08 2013). Conjecture 1 is the one formalized.',
    'MATCHES', None,
    'Conjecture 1 (a(n) >= 0, i.e. some k exists for every n) is stated exactly: `∃ k : ℕ, Nat.xor (k ^ 2) ((k + 1) ^ 2) = (2 * n + 1) ^ 2` for all n.',
    'The Lean def uses sInf (0 on an empty set) where OEIS uses -1, but the theorem does not use A224515. sqrt read as exact square root: the least-k values agree with all 1001 b-file terms. Uniqueness (Conjecture 2) is not claimed.',
    'Only the AI-agent proof (Ralf Stephan comment, May 24 2026, links the Lean file and ' + PAPER + ') and Adamczewski arXiv:2608.11941 (later). No earlier proof listed.')

add('A309132_conjecture_carmichael.lean', 'A309132', 'A309132.py', 'n = 1..420 vs b-file (Bernoulli numbers exact)',
    'Conjecture: composite numbers n such that a(n) is squarefree are only the Carmichael numbers A002997. Cf. A309235. - _Thomas Ordowski_, Jul 15 2019',
    'A309132 comments',
    'STRONGER', None,
    'The conjecture asserts one inclusion (composite and a(n) squarefree => Carmichael); the theorem is an iff, `(is_composite n ∧ Squarefree (a n)) ↔ is_carmichael_number n`, adding Carmichael => composite and a(n) squarefree. The added direction is already in the entry: Sondow\'s Theorem 2 (Jul 19 2019) and his proof in A309235 that a(m) | m for Carmichael m (Carmichael numbers are squarefree). So the open content is the same; read as "are exactly the Carmichael numbers" it would be MATCHES.',
    'Mathlib `bernoulli` has B1 = -1/2, matching A027641/A027642 (B1 = -1/2; zero Bernoulli numbers have num 0, den 1 in both). Lean a 0 = 0 is outside the offset 1. is_carmichael_number is the standard definition (composite, n > 1, b^(n-1) = 1 mod n for b coprime). Sanity: the iff holds on every b-file value n <= 10000 (Carmichael 561, 1105, 1729, 2465, 2821, 6601, 8911).',
    'Only the AI-agent proof (Stephan comment, May 25 2026) and Adamczewski (later). The converse direction was known (Sondow 2019); the conjectured direction was not.')

add('A382590_conjecture_kth_prime_factor_is_eventually_periodic.lean', 'A382590', 'A382590.py', 'n = 0..14 (b-file has 15 terms); Lean values computed to n = 30',
    'This sequence appears to have a very peculiar (conjectured) property. For any k > 1, if you take the k-th prime factor of each term, you get an eventually periodic sequence. This seems to hold even when we change a(1) as long as it is an integer > 1.',
    'A382590 comments (unsigned; entry by Bryle Morga, Mar 31 2025), linking MathOverflow question 490330 (Bryle Morga, 2025-03-31), whose examples count DISTINCT prime factors ("n = 2, N = 2: (3, 5, 7)"; Will Jagy\'s tables list 896 = 2^7*7 as "2 7").',
    'VACUOUS/TRIVIAL', 'The Lean docstring says the k-th prime factor is "counted with multiplicity" (Nat.primeFactorsList); it does not say this differs from the source or that it makes the claim degenerate.',
    'With multiplicity the k-th smallest prime factor is 2 as soon as v2(a(n)) >= k, and v2 grows without bound: the identity a(k+3) = 2 a(k) b(k) (a(k+1) b(k-1) - a(k-1) b(k+1)) (Will Jagy, MO 490330; checked exactly for k = 1..27) gives v2(a(n+3)) >= v2(a(n)) + 1. Computed v2(a(n)) for n = 7..30: 7, 6, 10, 21, 27, 44, 77, 116, 188, ..., 257114, and `kth_prime_factor 2` = `kth_prime_factor 3` = 2 for every n >= 7. So the theorem holds because the Lean sequence is eventually constant 2. Under the source\'s distinct-prime reading the k = 2 sequence cycles 3, 5, 7 from n = 5 and the k = 3 sequence cycles 19, 13, 11 from n = 11 (computed to n = 30), which is what the conjecture is about. Compared text: `let L := primeFactorsList n_abs ... L[k - 1]` in kth_prime_factor, and `kth_prime_factor k (A382590 (n + p)) = kth_prime_factor k (A382590 n)`.',
    'The definition of A382590 itself is right (pair recursion; 15 b-file terms agree). If a term were 0, Lean returns 1 (empty factor list); a zero would persist along its residue class mod 3 (a(n) | a(n+3)), so the conclusion stays degenerate. The OEIS entry has no DeepMind link.',
    'Yes, earlier: "Terence Tao sketched the proof (see the Mathoverflow link)". Tao\'s accepted MO 490330 answer is dated 2025-03-31 (Somos 2025-04-01), before ' + PAPER + '. That proof covers the distinct-prime reading.')

add('a091669_conjecture_primitive_root.lean', 'A091669', 'A091669.py', 'n = 1..85 vs b-file (Lean computed to 399; Nat division exact throughout)',
    'If p is a prime with primitive root 2, A001122, then p | a(p-1) + 2^(p-2). Conjecture: (for n > 2), if n | a(n-1) + 2^(n-2), then n is a prime (A001122). Note that if p is an odd prime for which 2 is not a primitive root, A216838, then p | a(p-1). - _Amiram Eldar_ and _Thomas Ordowski_, Jan 19 2020',
    'A091669 comments',
    'MATCHES', None,
    '"n is a prime (A001122)" (a prime with primitive root 2) is exactly `Nat.Prime n ∧ IsPrimitiveRoot (2 : ZMod n) (Nat.totient n)`, under `hn : n > 2` and the hypothesis `n ∣ (a (n - 1) + 2 ^ (n - 2))`.',
    'Lean a 0 = 0 (outside the offset). The Nat division in a is exact for every n <= 399. Sanity: no counterexample for n = 3..399.',
    'Only the AI-agent proof (Stephan, May 24 2026) and Adamczewski (later).')

add('a325046_odd_terms_at_k_times_k_plus_1.lean', 'A325046', 'A325046.py', 'N = 0..1500 vs b-file',
    'Odd terms occur only at positions n*(n+1) for n >= 0 (conjecture).',
    'A325046 comments (unsigned; entry by Paul D. Hanna, Mar 26 2019)',
    'MATCHES', None,
    'Stated exactly: `a N % 2 = 1 → ∃ k : ℕ, N = k * (k + 1)`.',
    'The Lean a is an explicit coefficient extraction, sum over n + nk + (n+1)j = N of C(n,k) C(n+j,j). That is an exact expansion of the g.f. (1+x^n)^n = sum C(n,k) x^(nk) and (1-x^(n+1))^-(n+1) = sum C(n+j,j) x^((n+1)j). Sanity: no odd term off k(k+1) in the b-file (N <= 10100).',
    'YES, earlier: "The conjecture is true (see Fried link). - _Sela Fried_, Dec 17 2025" with the PDF /A325046/a325046.pdf. OEIS history shows revisions #16-#21 on Dec 17 2025, approved that day, about five months before ' + PAPER + '. This contradicts "previously unproven" unless the agent run predates Dec 2025. Also Fried arXiv:2607.24832.')

add('oeis_103311_conjecture_0.lean', 'A103311', 'A103311.py', 'n = 0..4788 vs b-file',
    'Conjecture: all elements in absolute value are Fibonacci numbers.',
    'A103311 comments (unsigned; entry by Paul Barry, Jan 30 2005)',
    'MATCHES', None,
    'Stated exactly: `∃ m : ℕ, Int.natAbs (a n) = Nat.fib m` for all n.',
    'The recurrence and initial terms agree with the formula and with 4789 b-file terms. Sanity: |a(n)| is Fibonacci for n < 5000.',
    'Only the AI-agent proof (Stephan, May 25 2026) and Adamczewski (later).')

add('oeis_108_conjecture_2.lean', 'A000108', 'A000108.py', 'n = 0..1000 vs b-file',
    'Conjecture: All the rational numbers Sum_{i=j..k} 1/a(i) with 0 < min{2,k} <= j <= k have pairwise distinct fractional parts. - _Zhi-Wei Sun_, Sep 24 2015',
    'A000108 comments',
    'MATCHES', None,
    'The index condition `1 ≤ k ∧ min 2 k ≤ j ∧ j ≤ k` is the literal translation of 0 < min{2,k} <= j <= k, since 0 < min{2,k} iff k >= 1. The conclusion is pairwise distinct fractional parts: `(j₁, k₁) ≠ (j₂, k₂) → frac_part (...) ≠ frac_part (...)`.',
    'The Catalan definition uses Nat division C(2n,n)/(n+1), which is exact. Sanity: the 991 admissible pairs with k <= 45 have distinct fractional parts.',
    'Only the AI-agent proof ("This was proved by an autonomous AI agent", Stephan, May 25 2026).')

add('oeis_113254_conjecture_0.lean', 'A113254', 'A113254.py', 'n = 0..1000 vs b-file',
    'Conjecture: a(m, 2*n+1) is a perfect square for all m,n (see A113249).',
    'A113254 comments (unsigned; entry by Creighton Dement, Nov 18 2005). The name defines the family a(n) = m^4*a(n-4) + (2*m)^2*a(n-3) - 4*a(n-1) with m as a parameter.',
    'NARROWER', 'Partially. The docstring says the sequence "Corresponds to m = 8 in a family of 4th-order linear recurrence sequences", but it does not say the conjecture quantifies over all m.',
    'The conjecture quantifies over all m (the whole family); the theorem is the single case m = 8: `∀ n : ℕ, IsSquare (a (2 * n + 1))` with the m = 8 recurrence `| n\' + 4 => -4 * a (n\' + 3) + 256 * a (n\' + 1) + 4096 * a n\'`.',
    'The m = 8 recurrence and initial values match the name (m^4 = 4096, (2m)^2 = 256, a(2) = 176, a(3) = 3136) and 1001 b-file terms. IsSquare over Z also forces a(2n+1) >= 0. The OEIS comment itself says "proved in the case m = 8 (this sequence)". Sanity: odd-index terms are squares for m = 1..12 and n < 40, so the family conjecture is not refuted.',
    'Only the AI-agent proof for m = 8 (Stephan, May 25 2026).')

add('oeis_175386_conjecture_0.lean', 'A175386', 'A175386.py', 'n = 1..71 vs b-file (Lean computed to 399)',
    'We conjecture that sum((1/i)*C(2n-i-1,i-1),i=1..n) is not an integer for n>1.',
    'A175386 comments (unsigned; entry by Zak Seidov and Vladimir Shevelev, Apr 24 2010)',
    'MATCHES', None,
    'Since a n is the reduced denominator of the sum, `a n ≠ 1` under `hn : 1 < n` says exactly that the sum is not an integer for n > 1.',
    'Nat subtraction 2n-(i+1) never truncates for 1 <= i <= n. Lean a 0 = 1 (empty sum), outside the offset. Sanity: no integral sum for n = 2..399.',
    'Only the AI-agent proof (Stephan, May 25 2026) and Adamczewski (later).')

add('oeis_194806_conjecture_0.lean', 'A194806', 'A194806.py', 'n = 1..40 vs b-file (exhaustive literal search for n <= 14; supersets of {1}+primes for 15..40, cross-checked)',
    'Is a(n)/A000720(n) bounded as n -> infinity? (End)',
    'A194806 comments, block "From _Robert Israel_, Jan 09 2017: (Start) ... (End)"',
    'MATCHES', None,
    'The theorem is the affirmative answer, `∃ C : ℝ, ∀ n : ℕ, 2 ≤ n → (a n : ℝ) / (Nat.primeCounting n : ℝ) ≤ C`. That is equivalent to boundedness as n -> infinity because pi(n) >= 1 for n >= 2.',
    'The entry poses a question, not a conjecture; the paper counts it as a conjecture. S*S includes squares, as in the Lean set_prod (S x S image). Lean a 0 = 0, outside the offset.',
    'Only the AI-agent proof (Stephan, May 25 2026) and Adamczewski (later).')

add('oeis_227582_conjecture_0.lean', 'A227582', 'A227582.py', 'n = 1..1000 vs b-file',
    'Conjectures: ... (4) floor(1/(2*H(n) - H(n^2 + n - 1) - g)) = A227582(n).',
    'A227581 comments (unsigned; entry by Clark Kimberling, Jul 17 2013), restated in A227582: "At A227581, it is conjectured that a(n) = floor(1/(2*H(n) - H(n^2 + n - 1) - g))"',
    'MATCHES', None,
    'Stated exactly for n >= 1: `a n = (Int.floor (1 / (2 * harmonic n - harmonic (n * n + n - 1) - Real.eulerMascheroniConstant))).toNat`. The `.toNat` is harmless because a(n) >= 2, so the floor must be positive.',
    'The LinearRecurrence coefficient order (![1,-2,1,0,0,-1,2] for u(n+7) = sum c_i u(n+i)) reproduces the signature (2,-1,0,0,1,-2,1) and 1000 b-file terms. n*n+n-1 never truncates for n >= 1. Sanity: the floor identity checks exactly for n = 1..29, with gamma bracketed to 40 digits.',
    'Only the AI-agent proof (Stephan, May 25 2026) and Adamczewski (later).')

add('oeis_228143_conjecture_1.lean', 'A228143', 'A228143.py', 'n = 0..32 vs b-file (exact Bareiss determinants)',
    'Conjecture: if A(x) = 1 + 48*x + 161856*x^2 + ... denotes the o.g.f. then  A(x/3)^(1/8) has integer coefficients (checked up to x^30). - _Peter Bala_, Apr 22 2018',
    'A228143 comments',
    'MATCHES', None,
    '`∃ C : PowerSeries ℤ, map (C ^ 8) = OGF_A_scaled`, with OGF_A_scaled = sum a(n)/3^n x^n, is equivalent to A(x/3)^(1/8) having integer coefficients. C(0)^8 = 1 forces C(0) = +-1, and -C is also a root, so the principal root is integral.',
    'A005259\' is the Apéry sum; a is |det| of the Hankel matrix, matching the nonnegative terms. Sanity: the principal 8th root has integer coefficients through x^32, and 3^n | a(n). Zhi-Wei Sun\'s other conjecture in the entry (a(n)/24^n integral) is not claimed.',
    'Only the AI-agent proof (Stephan, May 25 2026) and Adamczewski (later).')

add('oeis_243106_conjecture_0.lean', 'A243106', 'A243106.py', 'n = 1..100 vs b-file',
    'There are 2^n ways of taking the partial sum of the first n powers of b=10 if exponent zero is excluded and the signs can be assigned arbitrarily. Conjecture: When expressed in base b, the absolute value for any of these terms only contains digits belonging to {0,1,b-2,b-1}; here {0,1,8,9}.',
    'A243106 comments (unsigned; entry by R. J. Cano, Aug 19 2014). The preceding comment, extended by M. F. Hasler (Aug 20 2014), reads off the equivalent "for any other base b > 4".',
    'MATCHES', None,
    'Every base b >= 5 (`hb : b ≥ 5`), every sign map σ on 1..n (exponent 0 excluded), and digits of |x| in {0, 1, b-2, b-1}: exactly the base-b form of the conjecture.',
    'The theorem does not use the defined a at all. Sanity: no violation for b = 5..12, n <= 10, all sign patterns.',
    'Only the AI-agent proof (Stephan, May 26 2026) and Adamczewski (later).')

add('oeis_248802_conjecture_0.lean', 'A248802', 'A248802.py', 'n = 0..23 vs b-file except n = 20 (smallest factor 14936336767657 is above the 3.3e7 trial bound)',
    'Conjecture 1: a(10n+2) = 67 for n >= 0.',
    'A248802 comments, block "From _Chai Wah Wu_, Oct 21 2019: (Start) ... (End)"',
    'MATCHES', None,
    'Stated exactly: `a (10 * n + 2) = 67` for all n, with a n = Nat.minFac (2^(2^n+2) + 3).',
    'Sanity: for n = 0..2999, 67 divides X and no smaller prime does (exponent reduced mod p-1).',
    'Only the AI-agent proof (Stephan, May 26 2026; OEIS link label typo "A244802") and Adamczewski (later).')

add('oeis_248802_conjecture_4.lean', 'A248802', 'A248802.py', 'same as conjecture 0 (n = 0..23 except 20)',
    'Conjecture 4: a(58n+26) = 1399 for n >= 0 and when it is not covered by Conjectures 1-3.  [Conjecture 1: a(10n+2) = 67 for n >= 0. Conjecture 2: a(36n+16) = 271 for n >= 0 and n <> 1 mod 5. Conjecture 3: a(84n+22) = 523 for n >= 0 and n <> 0 mod 5.]',
    'A248802 comments, block "From _Chai Wah Wu_, Oct 21 2019"',
    'MATCHES', None,
    '"Not covered by Conjectures 1-3" is encoded literally by covered_by_C1 (k = 10m+2), covered_by_C2 (k = 36m+16, m % 5 ≠ 1) and covered_by_C3 (k = 84m+22, m % 5 ≠ 0). The conclusion is `a (58 * n + 26) = 1399`.',
    'Sanity: of n = 0..2999, the 2209 uncovered cases all have least prime factor 1399.',
    'Only the AI-agent proof (Stephan, May 26 2026) and Adamczewski (later).')

add('oeis_256012_conjecture_0.lean', 'A256012', 'A256012.py', 'n = 0..3000 vs b-file (literal enumeration n <= 16, cross-checked DP)',
    'Conjecture: a(n) > 0 for n > 23.',
    'A256012 comments (unsigned; entry by Reinhard Zumkeller, Jun 01 2015)',
    'MATCHES', None,
    'Stated exactly: `(hn : n > 23) : A256012 n > 0`.',
    'Squarefree 1 holds in Mathlib, so 1 is correctly excluded as a part. Lean A256012 0 = 1, matching a(0) = 1.',
    'Only the AI-agent proof (Stephan, May 26 2026).')

add('oeis_267581_conjecture_0.lean', 'A267581', 'A267581.py', 'n = 0..1000 vs b-file',
    'Assuming the conjecture that the positions of the 0-bits of the middle column ("Rule 167") are given by the sequence A000051, it follows that a possible formula could be: a(n) = 2*a(n-1) + 1 - floor((1/2)^((2^(n+1)) mod n)) with a(0)=1 and a(1)=3 (Not proved, but tested up to n = 10^4). - _Andres Cicuttin_, Mar 29 2016',
    'A267581 comments',
    'MATCHES', None,
    'The formula is stated for n >= 2 (a(0), a(1) are the given initial values): `a n = 2 * a (n - 1) + 1 - oeis_floor_term n`. oeis_floor_term n = 1 iff 2^(n+1) mod n = 0, which equals floor((1/2)^(2^(n+1) mod n)) for n >= 1.',
    'ca_state is defined on all of Z. Rule 167 maps 000 to 1, so the background becomes 1 after t = 1. The infinite-lattice semantics reproduce 1001 b-file terms. Nat subtraction in `2 * a (n - 1) + 1 - ...` cannot truncate, since the subtrahend is <= 1. Sanity: the recurrence holds for n = 2..1099.',
    'Only the AI-agent proof (Stephan, May 28 2026) and Adamczewski (later).')

add('oeis_271591_conjecture_0.lean', 'A271591', 'A271591.py', 'n = 4..10000 vs b-file',
    'It is conjectured that after the first two 0\'s, the number of consecutive 0\'s is only 4 or 5, and the number of consecutive 1\'s is only 3 or 4 (tested up to n=10^4).',
    'A271591 comments (unsigned; entry by Andres Cicuttin, Apr 10 2016)',
    'NARROWER', 'No',
    'is_maximal_run requires the run to end (`a (n + L) ≠ v`), so the theorem only constrains runs that terminate. It does not exclude an eventually constant tail (an infinite run of 0s or 1s), which the conjecture ("only 4 or 5" / "only 3 or 4") does exclude. The omitted case is elementary to rule out from the tribonacci growth ratio (about 1.839 < 2), but it is not stated.',
    'Lean a(n) = 0 for n = 0..3 (outside the offset 4). The n >= 2 and `a (n - 1) ≠ v` clauses correctly skip the initial zero run (Lean a(0..5) = 0, i.e. OEIS\'s "first two 0\'s" plus four artificial zeros). Sanity: within n <= 10001 the maximal zero runs have lengths {4,5} and one runs {3,4}.',
    'Only the AI-agent proof (Stephan, May 28 2026) and Adamczewski (later).')

add('oeis_278070_conjecture_0.lean', 'A278070', 'A278070.py', 'n = 0..370 vs b-file',
    'We conjecture that a(n+k) == a(n) (mod k) for all n and k.',
    'A278070 comments, block "From _Peter Bala_, Mar 12 2023: (Start)"',
    'MATCHES', None,
    'Stated exactly: `∀ (n k : ℕ), Nat.ModEq k (A278070 (n + k)) (A278070 n)` (k = 0 is trivially true).',
    'The definition is the closed form sum C(n,k) C(n+k-1,k) k! (OEIS: "This form was given by AlphaProof", Luschny, May 31 2026), not the hypergeometric name; it agrees with 371 b-file terms. Nat.pred handles n = k = 0. Sanity: congruence checked for n, k < 120. The second, more general conjecture in the same block is not claimed.',
    'Only the AI-agent proof (Stephan, May 31 2026); later: Adamczewski, Kallat arXiv:2610.15849.')

add('oeis_282779_conjecture_0.lean', 'A282779', 'A282779.py', 'n = 1..600 vs b-file (p = 3)',
    'Conjecture: let a_p(n) be the length of the period of the sequence k^p mod n where p is a prime, then a_p(n) = n/p if n == 0 (mod p^2) else a_p(n) = n.',
    'A282779 comments (unsigned; entry by Ilya Gutkovskiy, Feb 21 2017)',
    'MATCHES', None,
    'General prime p, n > 0: `period_of_power_mod p n = if p ^ 2 ∣ n then n / p else n`, where period_of_power_mod is the least T > 0 with (k+T)^p ≡ k^p (mod n) for all k.',
    'The k^p mod n sequence is purely periodic, so least shift-period = period. Sanity: the formula holds for p in {2,3,5,7,11,13}, n <= 400.',
    'Only the AI-agent proof (Stephan, May 31 2026) and Adamczewski (later).')

add('oeis_289411_conjecture_0.lean', 'A289411', 'A289411.py', 'n = 0..10000 vs b-file; untruncated partial sums to n = 10^7',
    '- for k = 1..6: let m_k = (10^k)/2-1: for i = 0..m_k, we have a(m_k - i) = a(m_k + i),  - this relation is conjectured to hold for any k > 0,',
    'A289411 comments (unsigned; entry by Rémy Sigrist, Jul 18 2017)',
    'MATCHES', None,
    'Stated exactly for k > 0: `let m_k : ℕ := (10 ^ k) / 2 - 1` and `∀ i : ℕ, i ≤ m_k → A289411 (m_k - i) = A289411 (m_k + i)`. Caveat: the Lean A289411 is the integer partial sum passed through `.toNat`.',
    'Truncation caveat: `|>.toNat` makes the Lean sequence max(S(n), 0). The theorem is implied by the conjecture, and equivalent to it wherever S >= 0. The docstring asserts "The sequence is non-negative" without proof. Computed: S(n) >= 0 for all n <= 10^7 (min 0), so for k <= 7 the two coincide and the untruncated symmetry holds; beyond that, nonnegativity is assumed, not shown. The OEIS entry has no AI-agent comment or DeepMind link.',
    'No proof listed at all (no AI-agent comment either).')

add('oeis_2897_conjecture_0.lean', 'A002897', 'A002897.py', 'n = 0..99 vs b-file; coefficient form computed n = 0..8, diagonal form n = 0..4',
    'Conjecture: The g.f. is also the diagonal of the rational function 1/(1 - (x + y)*(1 - 4*z*t) - z - t) = 1/det(I - M*diag(x, y, z, t)), I the 4 X 4 unit matrix and M the 4 X 4 matrix [1, 1, 1, 1; 1, 1, 1, 1; 1, 1, 1, -1; 1, 1, -1, 1]. If true, then a(n) = [(x*y*z)^n] (1 + x + y + z)^(2*n)*(1 + x + y - z)^n*(1 + x - y + z)^n. - _Peter Bala_, Apr 10 2022',
    'A002897 comments',
    'NARROWER', 'No (the docstrings define a(n) = C(2n,n)^3 and P_n; neither mentions the diagonal claim).',
    'The theorem states only the second, "If true, then" part (the coefficient identity): `(a n : ℤ) = MvPolynomial.coeff (xyz_pow_n n) (P_n n)`. It does not state the diagonal claim. OEIS treats the two as "both parts of Bala\'s conjecture" (Easwar), and the AI comment says "The latter identity was proved". By MacMahon\'s Master Theorem the coefficient identity is equivalent to the diagonal claim: setting x = 1 in the degree-4n homogeneous form gives exactly P_n. So the omitted part is classical, not open mathematics.',
    'Sanity: the coefficient form equals C(2n,n)^3 for n = 0..8, and the diagonal coefficients of the rational function equal a(n) for n = 0..4 (1, 8, 216, 8000, 343000). The OEIS link label reads "A002879" (OEIS-side typo).',
    'AI-agent proof of the latter identity (Stephan, May 31 2026). Later: Easwar arXiv:2608.22053 (Aug 25 2026) proves both parts.')

add('oeis_306424_conjecture_0.lean', 'A306424', 'A306424.py', 'OEIS terms 1..23 vs Lean nth; condition scanned for k <= 200000',
    'Conjecture: The sequence is finite, with 43 being the last term.',
    'A306424 comments (unsigned; entry by Felix Fröhlich, Feb 14 2019)',
    'MATCHES', None,
    'Stated exactly: `A306424_condition 43 ∧ ∀ k : ℕ, 43 < k → ¬A306424_condition k`.',
    'Lean a n = Nat.nth (0-indexed), and the condition holds vacuously at k = 0, so Lean a 0 = 0 is not an OEIS term. Lean a n = OEIS a(n) for n >= 1, and the theorem does not use a. Sanity: no k in 44..200000 satisfies the condition.',
    'Only the AI-agent proof (Stephan, Jun 01 2026) and Adamczewski (later).')

add('oeis_307865_conjecture_0.lean', 'A307865', 'A307865.py', 'n = 0..1600 vs b-file',
    'Conjecture: if 2n+1 is an absolute Euler pseudoprime, then a(n) = 0.',
    'A307865 comments (unsigned; entry by Thomas Ordowski, May 02 2019)',
    'MATCHES', None,
    'Stated exactly: `(h : IsAbsoluteEulerPseudoprime (2 * n + 1)) : a n = 0`. IsAbsoluteEulerPseudoprime m means m > 1, m not prime, and b^((m-1)/2) = +-1 for all b coprime to m. That is the A033181 notion, with "odd" automatic for 2n+1.',
    'Sanity: 1729 (n = 864) and 2465 (n = 1232) give a(n) = 0.',
    'Only the AI-agent proof (Stephan, Jun 01 2026) and Adamczewski (later).')

add('oeis_323557_conjecture_0.lean', 'A323557', 'A323557.py', 'm = 0..1500 vs b-file',
    'Odd terms occur only at positions n*(n+1) for n >= 0 (conjecture; verified for initial 32600 terms).',
    'A323557 comments (unsigned; entry by Paul D. Hanna, Feb 03 2019)',
    'MATCHES', None,
    'Stated exactly: `Odd (a m) → ∃ n : ℕ, m = n * (n + 1)`.',
    'The coefficient extraction with sign (-1)^j is an exact expansion of the g.f. Sanity: no odd term off n(n+1) in the b-file (m <= 10100).',
    'Only the AI-agent proof (Stephan, Jun 01 2026) and Adamczewski (later).')

add('oeis_340737_conjecture_0.lean', 'A340737', 'A340737.py', 'A340737 n = 1..730 and A340738 n = 1..731 vs b-files',
    'The convergence is conjectured.  [names: A340737 "Numerators of a sequence of fractions converging to e."; A340738 "Denominator of a sequence of fractions converging to e."]',
    'A340738 comments (unsigned; entries by Gary Detlefs, Jan 18 2021); A340737 itself carries no explicit "conjecture" line.',
    'MATCHES', None,
    'Stated exactly: `Filter.Tendsto (fun n => (A340737 n : ℝ) / (A340738 n : ℝ)) Filter.atTop (nhds (Real.exp 1))`.',
    'Both sequences are N-valued with `Int.toNat` on the even-step subtraction; no truncation occurs for n <= 739. Index 0 = 0/0 is irrelevant to the limit. Sanity: |A/B - e| <= 1e-187 at n = 100.',
    'Only the AI-agent proof (Stephan, Jun 09 2026, in A340737) and Adamczewski (later).')

add('oeis_341254_conjecture_0.lean', 'A341254', 'A341254.py', 'n = 1..10000 vs b-file (exact isqrt floors)',
    'Conjecture:  1/4 < n*r^2 - a(n) < 3 for n >= 1.',
    'A341254 comments (unsigned; entry by Clark Kimberling, Feb 13 2021)',
    'MATCHES', None,
    'Stated exactly: `(hn : 1 ≤ n) : (1 / 4 : ℝ) < (n : ℝ) * r_sq - (a n : ℝ) ∧ (n : ℝ) * r_sq - (a n : ℝ) < 3` with r_sq = r*r.',
    'Sanity: both inequalities hold exactly (integer comparisons) for n = 1..10000.',
    'Only the AI-agent proof (Stephan, Jun 09 2026) and Adamczewski (later).')

add('oeis_363347_conjecture_2.lean', 'A363347', 'A363347.py', 'n = 3..56 vs b-file (Lean computed to 500)',
    'Conjecture 2: The sequence contains all prime numbers which end with a 1 or 9.',
    'A363347 comments (unsigned; entry by Mohammed Bouras, May 28 2023)',
    'MATCHES', None,
    'Stated exactly: `∀ p, (p.Prime ∧ (p ≡ 1 [MOD 10] ∨ p ≡ 9 [MOD 10])) → ∃ n, A363347 n = p`. Lean A363347 n = 0 for n <= 2, so the witness is automatically >= 3.',
    'The CF is evaluated with Lean\'s x/0 = 0, but no zero denominator occurs for n <= 500. Values agree with the OEIS formula for n <= 500. OEIS says "Conjectures 1 and 2 were proved by an autonomous AI agent", but only a Conjecture 2 file is published. Sanity: every prime = +-1 mod 10 below 400 occurs among a(3..500).',
    'Only the AI-agent proof (Stephan, Jun 09 2026) and Adamczewski (later).')

add('oeis_372761_conjecture_2.lean', 'A372761', 'A372761.py', 'n = 3..71 vs b-file (Lean computed to 500)',
    'Conjecture 2: Except for 3 and 5, all odd primes appear in the sequence once.',
    'A372761 comments (unsigned; entry by Mohammed Bouras, May 12 2024)',
    'MATCHES', None,
    'Stated exactly: `Nat.Prime p ∧ p % 2 = 1 ∧ p ≠ 3 ∧ p ≠ 5 → ∃! n, n ≥ 3 ∧ a n = p`.',
    'Lean conventions (a zero tail returns 0; 3/0 = 0) are never triggered for n <= 500. Values agree with the OEIS formula (5n-4)/gcd(...) for n <= 500. Sanity: each odd prime 7..299 occurs exactly once in a(3..500); 3 and 5 never.',
    'Only the AI-agent proof (Stephan, Jun 18 2026) and Adamczewski (later).')

add('oeis_51293_conjecture_0.lean', 'A051293', 'A051293.py', 'n = 1..60 vs b-file (literal enumeration n <= 15, cross-checked DP)',
    'In fact I conjecture that a(n) = 2^(n+1)/n * (1 + 1/n + 3/n^2 + 13/n^3 + 75/n^4 + 541/n^5 + o(1/n^5)). - _Benoit Cloitre_, Oct 20 2002.',
    'A051293 comments (the same comment also states the general all-m conjecture, which is not claimed)',
    'MATCHES', None,
    'Dividing by 2^(n+1)/n^6 and taking the limit to 0 is exactly the o(1/n^5) remainder: `Tendsto (fun n => (a_real n - (2^(n+1)/n) * (1 + 1/n + 3/n^2 + 13/n^3 + 75/n^4 + 541/n^5)) / (2^(n+1)/n^6)) atTop (nhds 0)`.',
    'This file carries a "Copyright 2025" header (all others 2026), and OEIS links a natural-language PDF (NaturalLanguageProofs/OEIS/oeis_51293.pdf) rather than the Lean file. Lean A051293 0 = 0.',
    'Only the AI-agent proof ("see the PDF from Deepmind", Stephan, Jun 18 2026) and Adamczewski (later).')

add('oeis_62567_conjecture_0.lean', 'A062567', 'A062567.py', 'n = 1..59 vs b-file; a(3^n) computed for n = 2..5',
    'a(3^5)=4899999987<10^27-1 so Jud McCranie\'s conjecture "for n>1, a(3^n)=10^3^(n-2)-1 " is incorrect. ... It seems that only for n=2,3 & 4 we have a(3^n)=10^3^(n-2)-1. - _Farideh Firoozbakht_, Nov 13 2005',
    'A062567 comments',
    'MATCHES', None,
    'Stated exactly for n >= 2: `a (3 ^ n) = 10 ^ (3 ^ (n - 2)) - 1 ↔ n = 2 ∨ n = 3 ∨ n = 4`.',
    'reverse_nat = ofDigits 10 (digits 10 k).reverse drops leading zeros, matching OEIS a(10k) = 0 (Lean returns 0 when no multiple exists). Instances computed: a(9) = 9, a(27) = 999, a(81) = 999999999, a(243) = 4899999987. Firoozbakht had already computed a(3^n) for n < 21, so the open part was n >= 21.',
    'Only the AI-agent proof (Stephan, Jun 18 2026) and Adamczewski (later).')

add('oeis_A028859_conjecture_1.lean', 'A028859', 'A028859.py', 'n = 0..1000 vs b-file; card of the Lean set S brute-forced for n = 0..8',
    'Conjecture: Also the number of length n + 1 sequences that cover an initial interval of positive integers and whose non-adjacent parts are weakly decreasing.',
    'A028859 comments, block "From _Gus Wiseman_, May 19 2020: (Start)"',
    'MATCHES', None,
    'Length L = n + 1, positive parts, covering [1, max], and for i < j with j ≠ i+1, σ i >= σ j; the set is finite with card a n. This is exactly the conjecture.',
    'Brute force: |S| = 1, 3, 8, 22, 60, 164, 448, 1224, 3344 = a(0..8). The entry\'s example labels ("a(1) = 1 through a(3) = 8") are off by one against the data. The Lean follows the "length n + 1" text, as does Wang\'s proof (b(N) = a(N-1)).',
    'AI-agent proof ("See also the Deepmind proof", Stephan, Jun 30 2026). Independent proof by Xinjun Wang (comment Jun 01 2026, Zenodo 10.5281/zenodo.20437247), after ' + PAPER + '.')

add('oeis_A258667_conjecture_0.lean', 'A258667', 'A258667.py', 'n = 1..24 vs b-file; the formula also matches brute-force seatings for n = 5..10',
    'It is known [Riordan, ch. 8, ex. 7(b)] that, after the ladies are seated at every other chair, the number U_n of ways of seating the men in the ménage problem has asymptotic expansion U_n ~ e^(-2)*n!*(1 + Sum_{k>=1} (-1)^k/(k!(n-1)_k)), ... Therefore, it is natural to conjecture that a(n) ~ e^(-2)*n!/(n-2)*(1 + Sum_{k>=1} (-1)^k/(k!(n-1)_k)).',
    'A258667 comments (unsigned; entry by Vladimir Shevelev and Peter J. C. Moses, Jun 07 2015)',
    'MATCHES', None,
    'With "~" read literally as asymptotic equivalence, `IsEquivalent atTop (fun n => (A258667 n : ℝ)) A258667_asymptotic_term` states it exactly, with the series truncated at k <= n-1 where (n-1)_k ≠ 0. Caveat: the series tends to 0, so IsEquivalent is the same as a(n) ~ e^-2 (n-1)!. Read as a full asymptotic expansion (as in the Riordan result it imitates), it is not what is formalized, and numerically it fails beyond relative order n^-3.',
    'Computed delta(n) = a(n)/T(n) - 1 = 1.94e-5, 3.78e-7, 2.17e-8, 1.30e-9, 7.97e-11 at n = 20, 50, 100, 200, 400; n^4 * delta -> 2.04. So the conjectured expansion is off at relative order n^-4. For the true ménage numbers U_n, Riordan\'s series has error below 1e-66 at n = 50. The formalization (and the OEIS proof summary: "equivalence to exp(-2)*(n-1)!") is the weak, true reading. Nat subtractions in the formula do not truncate for n > 5.',
    'Only the AI-agent proof (Stephan, Jun 30 2026) and Adamczewski (later).')

add('oeis_a211417_conjecture_specific.lean', 'A211417', 'A211417.py', 'n = 0..50 vs b-file',
    'It appears that a(n)/(30*n - 1) is integral for all n (checked up to n = 1000).',
    'A211417 comments, block "From _Peter Bala_, Aug 28 2025: (Start)"',
    'MATCHES', None,
    'Stated exactly: `(30 * (n : ℤ) - 1) ∣ (a n : ℤ)` for all n. For n = 0 this is -1 | 1, true.',
    'The Nat division is exact (integrality is known, Bala). The general D(r) conjecture in the same block is not claimed; the filename says "specific". Sanity: holds for n <= 199.',
    'Only the AI-agent proof (Stephan, Jun 30 2026) and Adamczewski (later).')

add('oeis_a237271_conjecture_2.lean', 'A237271', 'A237271.py', 'n = 1..10000 vs b-file',
    'Conjecture 2: a(n) is the number of 2-dense sublists of divisors of n.',
    'A237271 comments, block "From _Omar E. Pol_, Jul 31 2025: (Start)"',
    'VACUOUS/TRIVIAL', 'The docstring declares that `a` is not the defining object (the parts of the symmetric representation of sigma) but "a known characterization of the sequence". It does not say that this makes the theorem a triviality.',
    'The Lean a is 1 + #{consecutive divisors (d, d\') : d\' odd and d\' >= 2d}, and the theorem `a n = num_2_dense_sublists n` compares it with 1 + #{consecutive (d, d\') : d\' > 2d}. These are identical for elementary reasons: if d\' > 2d with d\' even, then d\'/2 is a divisor strictly between d and d\', contradicting consecutiveness; and for odd d\', >= 2d is the same as > 2d. All the content about the symmetric representation of sigma(n) was moved into the definition.',
    'The characterization is A379288 Conjecture 1, proved by Hartmut Hoft (Jan 09 2025); its count equals the A379288 row length (checked n <= 3000) and the OEIS terms (n <= 10000). Checked: a = num_2_dense_sublists for n = 0..10000, and no consecutive-divisor jump with even d\' occurs.',
    'YES, earlier, for the substance: "The conjecture 1 is true. For a proof see A379288. - _Hartmut F. W. Hoft_, Jan 21 2025" gives the Lean a. A237271 says Conjecture 2 "is essentially the same as the second conjecture in the Comments of A384149", and A384149 has "See the link below for a proof. - _Hartmut F. W. Hoft_, Jan 11 2026" (approved Jan 21 2026). Both predate ' + PAPER + '.')

add('oeis_a300997_finite_difference_is_one_or_two.lean', 'A300997', 'A300997.py', 'n = 1..69 vs b-file (Lean computed to 300)',
    'Observations/conjectures: it appears that the finite difference of this sequence only contains 1\'s and 2\'s, that the runs of 2\'s are delimited by isolated 1\'s and tend to become larger and larger.',
    'A300997 comments (unsigned; entry by Luc Rousseau, Jun 14 2018). The first of the listed observations is formalized.',
    'MATCHES', None,
    'The first observation, stated exactly: `∀ n : ℕ, 1 ≤ n → a (n + 1) = a n + 1 ∨ a (n + 1) = a n + 2`.',
    'The CA step (keep ceil(m/2), pass floor(m/2) right, trim trailing zeros) and sInf of stable times reproduce the b-file. Stabilization occurs for every n <= 300, so the sInf-of-empty = 0 default never applies. The other observations (runs of 2s, A305992) are not claimed. OEIS has no AI-agent comment or DeepMind link here.',
    'None listed except Adamczewski\'s proof abstract (Aug 19 2026, later).')

add('oeis_a363102_conjecture_1.lean', 'A363102', 'A363102.py', 'n = 3..10002 vs b-file; continued fraction itself recomputed for n = 3..700',
    'Conjecture 1: The sequence contains only 1\'s and primes.',
    'A363102 comments (unsigned; entry by Mohammed Bouras, May 19 2023)',
    'MATCHES', None,
    'Stated exactly for n >= 3: `a n = 1 ∨ Nat.Prime (a n)`.',
    'Definition caveat: the Lean a is the OEIS formula (n^2-2)/gcd(n^2-2, 2*A051403(n-3) + n*A051403(n-4)), not the continued fraction in the name. That formula is not proved in the file. It agrees with the actual continued fraction for every n = 3..700 and with all 10000 b-file terms. Nat subtraction n-4 at n = 3 uses a051403(0) = 1 where OEIS has A051403(-1) = 0; a(3) = 7 either way. The OEIS entry has no DeepMind link.',
    'None listed except Adamczewski\'s proof sketch (Aug 17 2026, later).')

add('oeis_a368692_conjecture_integrality.lean', 'A368692', 'A368692.py', 'n = 0..8 vs b-file',
    'It is conjectured here that a(n) are integers.',
    'A368692 comments (unsigned; entry by Karol A. Penson, Jan 03 2024)',
    'MATCHES', None,
    'The integrality is stated directly as the divisibility `108 * ((4n+2)! * (2n+3)! * ((6n+5)!)^2) ∣ (12n+6)! * (6n+9)!`.',
    'The theorem does not use a. Adolphson-Sperber gives integrality of 108*a(n) only, so the factor 108 is the open part. Sanity: the divisibility holds for n <= 299.',
    'None listed except Adamczewski\'s proof abstract (Aug 17 2026, later).')

assert len(R) == 38, len(R)
assert len({r['file'] for r in R}) == 38
json.dump(R, open(os.path.join(HERE, 'readings.json'), 'w'), indent=1, ensure_ascii=False)
from collections import Counter
print(Counter(r['word'] for r in R))
print('termsAgree false:', [r['file'] for r in R if not r['termsAgree']])
