# erdos852 thread comment — PREPARED; operator reports POSTED 2026-08-25

STATUS NOTE (2026-08-25, appended — the header above it is history, not
state): POSTED by the operator; the site holds new comments for
MODERATOR APPROVAL (operator-confirmed), which is why two cache-busted
public fetches the same day still show 7 comments and none of the
correction's digits. Do not cite the correction as public until a fetch
of the thread shows it; when it lands, snapshot the thread as evidence
bytes beside the original pin.

Operator posts; nothing in this repo auto-sends. Target:
https://www.erdosproblems.com/forum/discuss/852 (login required).
The text below is self-contained — every number is carried by the exact
integer snippet inside it, so the comment needs no external links. If you
also want to publish the full certificate + verifier
(certs/erdos852-certificate.json + tools/verify_erdos852.py, stdlib-only,
0.7 s), that is a separate call; the comment stands without them.

Verified against the certificate at commit time; `make test` re-proves
every claim in it (erdos852 battery + stdlib verifier rows).

---- PASTE BELOW THIS LINE ----

Both constants in this thread were produced without stated error bounds, so I recomputed them with certified interval arithmetic (directed rounding, every series truncated with an explicit remainder bound, all final comparisons exact).

**$c_0$ is confirmed.** The unique positive root of $I_0(c)=1$ is
$$c_0 = 1.3232282768639494690289693932974634613586\ldots$$
(bracketed to width $\sim 10^{-61}$; uniqueness since $I_0'(c) = \log\frac{e^{2c}-1}{2c} > 0$ for $c>0$). The value $1.32322827686395$ quoted above is its correct rounding to 14 places.

**$C_*$ is incorrect from the 12th significant digit.** The certified value is
$$C_* = \tfrac12\Big(\prod_{p\ge 3}\Big(1+\tfrac{1}{(p-1)^3}\Big)-1\Big) = 0.0752403861783092\ldots,$$
not $0.0752403861777\ldots$. The discrepancy is floating point, not mathematics: in IEEE-754 double precision the factor $1+(p-1)^{-3}$ rounds to exactly $1.0$ once $(p-1)^3 \ge 2^{53}$, i.e. for every $p > 208{,}064$, so a double-precision product silently ignores all primes beyond $\sim 2\times 10^5$ no matter how far the loop runs. The missing mass, $\sum_{p > 208064} (p-1)^{-3} \approx 9.1\times 10^{-13}$, accounts for the observed error — and indeed a naive double product reproduces $0.0752403861777418$ digit for digit.

The correction requires no trust in my code. The partial product is a strict lower bound of the infinite product, and already over $p \le 4\times 10^5$, exact integer arithmetic gives $\tfrac12\big(\prod - 1\big) > 0.0752403861778$, which exceeds the published value under either a truncation or a rounding reading. In Python (exact, standard library, under a second):

```python
L = 400_000
sieve = bytearray([1]) * (L + 1)
for i in range(2, int(L**0.5) + 1):
    if sieve[i]: sieve[i*i::i] = bytearray(len(sieve[i*i::i]))
pairs = [((p-1)**3 + 1, (p-1)**3) for p in range(3, L+1, 2) if sieve[p]]
def prod(lo, hi):
    if hi - lo == 1: return pairs[lo]
    m = (lo + hi)//2; a, b = prod(lo, m), prod(m, hi)
    return (a[0]*b[0], a[1]*b[1])
N, D = prod(0, len(pairs))
assert 5 * (N - D) * 10**12 > 752403861778 * D  # (N/D - 1)/2 > 0.0752403861778, exactly
```

For the upper side, $\sum_{p>L}(p-1)^{-3} \le \sum_{m\ge L} m^{-3} \le \tfrac{1}{2(L-1)^2} = S$ together with $\prod(1+a_p) \le e^S \le 1+S+S^2$ bounds the tail; carrying the product to $L = 3\times 10^7$ with directed rounding pins
$$C_* \in [0.0752403861783092455,\; 0.0752403861783095652].$$

None of this touches the structure of the argument — only the numeric value of $C_*$, and hence $\tfrac12 + C_* = 0.5752403861783\ldots$, in digits that do not affect the qualitative conclusion that $I_0(c)+J(c) < 1$ for small $c > 0$.

---- END PASTE ----
