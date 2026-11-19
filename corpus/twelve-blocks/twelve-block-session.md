# Twelve blocks at finite length

**Instructions for one research session on Cert-Machine · Carlos Toledo · 18 November 2026**

Take the research lead for this session. Start from the finite coloring below. Aim to explain what happens when an extremal continuum coloring lands on an integer lattice. The immediate opportunity is an all-scales parity result with a small exact witness. The ambitious target is a finite extremal theorem or a family of colorings that beats the proposed formula. Pursue the strongest lead the evidence supports. A smaller theorem with a short proof is worth more here than another table of large searches.

## The question

Color the integers from 1 through $n=548m$, for positive integer $m$, in twelve alternating blocks. Start with red. Multiply each of these lengths by $m$.

~~~text
28  6  28  37  59  116  116  59  37  28  6  28
~~~

Call this coloring $B_m$. Write $M(c)$ for the number of triples $(a,a+d,a+2d)$ of one color, with $d>0$ and all three sites in the interval. Count each triple once. Write $V(n)$ for the minimum of $M$ over all binary colorings. Use labeled sites and colors throughout. Record explicitly any quotient by reflection or color exchange.

For even $m$, the existing report gives $M(B_m)=117n^2/2192-n/2$. **Does $V(n)=M(B_m)$ for all sufficiently large even $m$?** One better coloring settles one length. A construction beating $B_m$ for unbounded even $m$ refutes the eventual claim. A matching lower bound would prove it. The existing asymptotic result permits a finite improvement. [Delta-three report, especially §§2–4](https://carlostoledo.co/reports/delta3.html)

## What the session inherits

At each of the eleven interior boundaries $b$, allow independent flips at $b$ and $b+1$. Keep every other site fixed. These are 22 binary choices, including choices that split a block. The baseline is the zero mask. This family is the **starting experiment**.

| Scale | Length | Baseline count | Minimum in the 22-site family | Masks attaining it |
|---|---:|---:|---:|---:|
| 1 | 548 | 15,756 | 15,756 | 51 |
| 2 | 1,096 | 63,568 | 63,568 | 1 |

At scale one, flipping sites 28 and 29 together preserves the count. At scale two the corresponding pair is 56 and 57, and flipping it adds two. The original JavaScript census obtained its coefficients by directly counting triples after single and double flips and directly recounted each winning mask. This session also produced a derivation explaining how *every flip mask* transfers to all scales of the same parity. The appendix gives a standalone replay. Both routes came from the same Codex chat. The derivation and software are claimant evidence awaiting independent review. The existing delta-three verifier was replayed as context and checks its own continuum certificates.

## Where to spend the session

1. **Challenge the strongest local claim first.** For a fixed mask $x$, let $D_m(x)=M(B_m\text{ with }x\text{ flipped})-M(B_m)$. The proposed statement is $D_{m+2}(x)=D_m(x)$ for every $m\ge1$ and every mask. Check the all-scales argument below, particularly the diagonal correction, parity in half-open intervals, and the cutoff in the affine argument. A clean-room reviewer can work from the definition and the claim alone. Preserve the first disagreeing scale, mask and direct triple count if one appears.
2. **Explain the 51.** Recover the complete odd-scale equality set. Look for a human description of the allowed boundary moves and why there are precisely 51, with overlapping descriptions counted once. For even scales, try to exhibit a short decomposition of the flip cost into nonnegative integer penalties that vanish simultaneously only for the zero mask. A concise classification would explain more than an exhaustive listing. Retain full masks when using symmetry to search.
3. **Give the global conjecture a serious chance to fail.** Enlarge the movable set to $b-1,b,b+1,b+2$. Search coordinated shifts and defects away from the edges. An unrestricted candidate may come from integer programming, SAT, local search, or a construction on residue classes. Start by asking for a *strictly better* witness. Verify any proposed coloring directly from its bits and minimize the support of the improvement. If its support has a repeating description, derive its cost at symbolic scale. For exhaustive negative results, save a checkable lower-bound certificate or a complete search proof together with the domain exhausted.
4. **Try a shortcut to a theorem.** For fixed boundary-window width, stationary piecewise-linear structure may give the same eventual two-parity reduction as in the appendix. Seek a bound on the scale at which the two finite problems stabilize, as a function of window width. The harder question is localization. Can a coloring matching or improving the baseline always be moved into such a window without increasing its count? Quantify the finite error in any use of the continuum lower bound. A certificate for this step would connect the local computation to the global conjecture.

Choose between these directions as evidence arrives. If a wider-window counterexample appears, follow it immediately. If the 51 masks have a compact explanation, finish that proof while the global search remains open. Lean is worth using on a faithful combinatorial lemma, including the transfer from two scales to all scales. A solver or an AI is equally welcome as a source of candidates.

## How to work in the project

- Open the Cert-Machine checkout. Read its current `CLAUDE.md`, the applicable standing rules and active work at the top of `HANDOFF.md`, and `instruments/delta3/README.md`. The checkout inspected for this brief was at `3199d1c0f24eed4b32376630a11f9920908205a9` on an unrelated working branch. Use a separate private research branch or workspace. Preserve the operator's working tree. [Cert-Machine](https://github.com/carlostoledo1891/cert-machine)
- Scout with `node tools/targets.js delta3`, the earlier claimant material, and the literature on discrete extremizers. Keep the target and its disposition in the project's target memory when integrating the work. For the original result, `node instruments/delta3/verify.js` is a read-only baseline replay. Read the October correction before borrowing a near-minimizer estimate. [Report and correction](https://carlostoledo.co/reports/delta3.html)
- Explore freely in the claimant workspace. For a decision run, pin the exact statement, input conventions, code revision, evidence and expected falsifiers under the project's applicable preregistration procedure. Identify the two known counts and the appendix as prior observations. Record subsequent changes explicitly. A fresh implementation may read the mathematical definition and witness format. Keep claimant implementation code out of an independent judge.
- Use Claimbox where its grammar expresses the claim faithfully. Audit the printed-back statement. For Lean Intake, check the declaration against the intended quantifiers and domain. Document what the kernel decided and which mathematical steps still rely on prose. Use a small exact decider directly when that gives a clearer result. Keep repository boundaries, provenance and operator-controlled publication intact. [Claimbox](https://github.com/carlostoledo1891/claimbox)
- Plant failures that exercise the actual result. Examples include omitting the midpoint completion for an even-separated pair, admitting $d=0$, changing the odd tie count to 50, and claiming the zero mask is unique at every scale. Test the first-boundary swap explicitly. Keep an honest record of any planted error the checks miss.

Two exploratory controls already distinguish common errors. At scale one, the mixed coefficient for sites 28 and 34 is −3. Its three triples have third sites 22, 31, and 40. Omitting midpoint completion changed the coefficient to −2 in a planted run, while the first-boundary swap still passed. Removing the diagonal subtraction tripped the integrality check. Include both controls in the independent replay.

**Lead with one sentence stating the strongest result and its domain.** Include the proof or smallest counterexample, a replay command, the outcome of the falsifiers, and the remaining gap to $V(n)$. If the project state changes, update its handoff alongside the research record. A public priority claim would also require a fresh literature check.

## Appendix · Why two finite censuses might decide every scale

Write $s_p\in\{-1,1\}$ for the baseline color. For three sites the monochromatic indicator is $(1+s_as_b+s_as_c+s_bs_c)/4$. For distinct sites $p,q$, let $w(p,q)$ be the number of valid triples containing both. Each possible third site comes from putting the pair at the two ends or using either site as midpoint. Hence

$$
w(p,q)=[p\equiv q\pmod 2]+[1\le 2p-q\le n]+[1\le 2q-p\le n].
$$

The flip cost is a quadratic in the 22 mask bits. Its linear coefficient for $p$ is $-s_p\sum_{q\ne p}s_q w(p,q)/2$, summed over the **whole interval**. Its pair coefficient for two flippable sites is $s_ps_q w(p,q)$. The latter has no factor of two. Let $F(t)=\sum_{1\le j\le n,\ j\le t}s_j$ and let $P(p)$ sum all signs at sites of the same parity as $p$. The sum in the linear coefficient becomes

$$
P(p)+F(2p-1)-F(2p-n-1)+F(\lfloor(n+p)/2\rfloor)-F(\lfloor p/2\rfloor)-3s_p.
$$

Each of the three completion tests counted the forbidden diagonal $q=p$. This accounts for the subtraction. The prefix convention automatically handles endpoints outside the interval.

**All-scales step.** Each movable site is $p=Bm+e$ with $B$ an integer block boundary at unit scale and $e\in\{0,1\}$. Fix the parity of $m$. The floor terms above are affine functions of $m$ on that parity. The contribution of a block $(Am,Cm]$ to $F(t)$ is its sign times $(t-Am)_+-(t-Cm)_+$, where $z_+=\max(z,0)$. For every displayed prefix argument, twice the argument of either positive part has the form $am+h$ with $a$ an integer and $|h|\le2$. For instance $2(2p-n-1-Am)=(4B-1096-2A)m+4e-2$. For a halved argument the rounding changes the numerator by at most one. Thus every positive part selects the same affine branch for all $m\ge5$ on the chosen parity. The parity sum is affine by counting each block's odd or even sites. In each pair test the endpoint comparisons likewise involve integer slopes and offsets of absolute value at most two, so its value is constant beyond that cutoff.

It follows that all 253 coefficients are affine on each parity for $m\ge5$. The exact checks at 5 and 7, and at 6 and 8, give equal coefficient vectors within each pair. Their slopes are therefore zero. The checks at 1 through 4 settle the remaining cases. Together with the two finite censuses this gives the proposed all-scales result for the specified 22-site family, including the same winning masks throughout each parity. The finite computations and the general affine argument are separate proof obligations.

### Replay from this file

Save this Markdown file locally. The following command extracts its single Python block and runs it with the Python 3 standard library. Run with Python assertions enabled (the default).

~~~sh
awk '/^~~~python$/{p=1;next} p && /^~~~$/{exit} p' twelve-block-session.md | python3 -
~~~


~~~python
from itertools import accumulate, combinations

WIDTHS = (28, 6, 28, 37, 59, 116, 116, 59, 37, 28, 6, 28)

def signature(m):
    ends = [0, *accumulate(w*m for w in WIDTHS)]
    n = ends[-1]
    blocks = [(a, b, (-1)**i) for i, (a, b) in enumerate(zip(ends, ends[1:]))]
    sites = [(b+e, sign*(-1)**e) for _, b, sign in blocks[:-1] for e in (0, 1)]

    def prefix(t):
        return sum(s * min(b-a, max(0, t-a)) for a, b, s in blocks)

    linear = []
    for p, s in sites:
        parity_sum = sum(v * ((b + p%2)//2 - (a + p%2)//2) for a,b,v in blocks)
        middle = prefix(2*p-1) - prefix(2*p-n-1)
        endpoint = prefix((n+p)//2) - prefix(p//2)
        twice = -s * (parity_sum + middle + endpoint - 3*s)
        assert twice % 2 == 0
        linear.append(twice//2)

    quadratic = []
    for (p,s), (q,t) in combinations(sites, 2):
        weight = int((p-q)%2 == 0) + int(1 <= 2*p-q <= n) + int(1 <= 2*q-p <= n)
        quadratic.append(s*t*weight)
    return (tuple(linear), tuple(quadratic))


def census(m):
    linear, quadratic = signature(m)
    size = len(linear)
    pairs = [[0]*size for _ in linear]
    for (i, j), value in zip(combinations(range(size), 2), quadratic):
        pairs[i][j] = pairs[j][i] = value

    # Enumerate the binary cube in Gray order. The marginal cost of a flip
    # is its linear term plus the pair terms for the currently selected sites.
    marginal = list(linear)
    delta = mask = best = 0
    ties = 1
    for step in range(1, 1 << size):
        bit = step & -step
        i = bit.bit_length() - 1
        sign = -1 if mask & bit else 1
        delta += sign * marginal[i]
        mask ^= bit
        for j, value in enumerate(pairs[i]):
            marginal[j] += sign * value
        if delta < best:
            best, ties = delta, 1
        elif delta == best:
            ties += 1
    return best, ties


if __name__ == "__main__":
    for m in range(1, 9):
        assert signature(m) == signature(1 if m % 2 else 2)
    print("All 253 coefficients match their parity reference at scales 1 through 8.")
    for m, expected in [(1, (0, 51)), (2, (0, 1))]:
        result = census(m)
        assert result == expected
        print(f"Scale {m}: minimum change {result[0]}, minimizing masks {result[1]}")
~~~
