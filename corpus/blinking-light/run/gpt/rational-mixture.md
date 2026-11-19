# An exact rational, irreducible telegraph–ring mixture

**Proved.** The 84-state network in `rational-mixture-84.json` realizes C1=3/10 and C2=2/25 at r=2 with g≤0.377876231746. All listed rates are rationals. This refines the Claude track's discovery that a reversible telegraph mixed with an oscillating ring outperforms the rings found in this run. Global optimality within the ring class remains open.

## Construction

Work at dimensionless sampling rate one, then double all rates for the supplied file. The oscillating component is an 80-state ring with a half-turn exchanging the signs of the lamp. The Claude track supplied floating-point component data from its mixture search. We symmetrize its two half-periods and round stationary masses, one net current, and directed edge traffic ratios to rationals. The ring's two conditional correlations cR,qR are computed as exact fractions. Two additional symmetric two-state chains (telegraphs) have one-step lamp eigenvalues z=2827/10000 and t=707/2500. A telegraph with eigenvalue z has flip rate (1/z-1)/2 and correlations z,z².

Set e=1/10^7, C=(1+e)(3/10), and D=(1+e)^2(2/25). Choose the component weights using the following rational formulas:

```
p = [D-(z+t)C+zt] / [qR-(z+t)cR+zt],
b = [C-p cR-(1-p)z] / (t-z),
a = 1-p-b.
```

All three are strictly positive. Their disjoint mixture has correlations C,D. Every component has a sign-exchanging involution preserving its rates and stationary law. Its odd observables take opposite values on the two members of each pair. The binary lamp is odd.

Group states into these pairs. Let M_i denote their stationary masses, including mixture weights. Pick one ring pair 0 and connect it to the two telegraph pairs by a reversible stochastic matrix U on pairs. For each telegraph pair j set U_0j=M_j/4 and U_j0=M_0/4. Fill the diagonal to make each row sum to one. On the full state space let R select a pair via U and then select either sign in the destination pair with probability 1/2. R is reversible and sends every odd function to zero. If L is the disjoint generator, set

```
Lnew=(1+e)L + e(R-I).
```

This network is irreducible. On odd functions its one-step resolvent is exactly K/(1+e), so the two correlations are C/(1+e) and D/(1+e)^2, exactly the targets. The only edges carrying current are ring edges. Its dimensionless entropy is (1+e)p times that of the conditional ring, since all new reset edges miss the original directed ring edges. In particular the construction pays zero entropy for the two telegraphs and their reversible joining transitions.

## Reproduction

`python3 -B rational_mix.py 80` reads the Claude track's original floating-point seed and generates the rational file. Rational arithmetic verifies the positive mixing weights, both target identities, stationarity and the excess-current formula. An integer logarithm enclosure gives the upper bound. The floating arithmetic only chooses candidate rationals before these checks. The general network checker can test the output independently with `python3 -B ../inherited/checker/lamp-v2.py rational-mixture-84.json`. It requires no free-rate box and no optimization.
