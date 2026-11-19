# Keeping both snapshot targets exact when joining components

**Theorem.** For any moment pair (c,q) with c<1 realizable by a stationary finite jump network of finite entropy production, allowing reducible networks gives the same infimum of g as requiring irreducibility. In fact every such pair is an ordinary interior point of the moment region realizable with finite entropy. Consequently the value function on this domain is convex, using the Claude track's lifted program (or disjoint mixtures directly).

Normalize the sampling rate to one. In this note a network may have multiple closed classes until a reversible reset explicitly connects them. Discard all zero-stationary-mass states.

## 1. Two independent ways to perturb the moments

Fix the given network L, stationary law pi, and binary lamp f. Choose nu greater than every escape rate and P=I+L/nu. A stationary P-chain run at independent Poisson ticks of rate nu realizes L. Replace the tick process by an independent stationary renewal process with interarrival time T, mean m and Laplace transform phi(s). Assign the current P-state to the interval after each tick. We will use finite phase-type T for which this entire process has a finite Markov realization.

Let C(s) be the stationary lamp correlation across an independent Exp(s) time. The transform of the waiting time from a stationary observation until the next tick is rho=(1-phi(s))/(sm), by integrating the stationary excess-time density Pr(T>t)/m. The number of ticks before the Exp(s) time is zero with probability 1-rho, and k≥1 with probability rho (1-phi(s)) phi(s)^(k-1), by memorylessness. Averaging the correlations <f,P^k f> therefore gives

```
C(s)=1-H(phi(s))/(s m),    H(v)=(1-v)<f,(I-P)(I-vP)^(-1) f>.
```

Two Exp(s) intervals have the Gamma(2,s) density. Differentiating the one-interval transform under the integral shows that the two-interval correlation is C(s)-s C'(s). At s=1, set v=phi(1), u=phi'(1). Thus

```
c=1-H(v)/m,                q=1-2H(v)/m+H'(v)u/m.
```

At the original Exp(nu) choice, v=nu/(1+nu). With K=(I-L)^(-1), differentiating the matrix expression gives

```
H'(v)=-<f,(I-P)^2 (I-vP)^(-2) f>
     =-((1+nu)/nu)^2 (1-2c+q).
```

Here 1-2c+q=<f-Kf,f-K*f> is strictly positive. Its summands are nonnegative because f is ±1, and both factors have the same strict sign on every state of every closed class with a nonconstant lamp. There is such a positive-mass class since c<1. Also H(v)>0 since c<1. Holding v fixed, the Jacobian of (c,q) with respect to (m,u) has nonzero determinant H(v)H'(v)/m³.

## 2. Finite bidirectional phase clocks realize an open set of (m,v,u)

Start with four distinct positive killing rates, say nu, 2nu, 3nu, 4nu, and a small positive symmetric rate between every pair of phases. Let B be the four-by-four transient subgenerator, with killing included on its diagonal. By Perron-Frobenius B has a strictly positive probability left eigenvector alpha at eigenvalue -lambda. Scale all phase transition and killing rates by nu/lambda so this eigenvalue becomes -nu. When a renewal starts from alpha, its survival function is alpha exp(Bt)1=exp(-nu t), with B now denoting the scaled subgenerator.

Vary the strictly positive initial distribution alpha of each renewal around that choice, keeping the scaled phase rates fixed. The triple (m,phi(1),phi'(1)) is affine in the initial distribution. At zero internal mixing, the scaling tends to one and the four triples starting in a pure phase of rate x are

```
(1/x, x/(1+x), -x/(1+x)^2).
```

They are affinely independent. Indeed, the four functions 1, 1/x, x/(1+x), -x/(1+x)^2 span all cubic polynomials after multiplication by x(1+x)^2. To check linear independence, evaluate a purported zero combination successively at x=0, x=-1, then compare the remaining terms. A nonzero cubic cannot vanish at four different positive rates. The starting-phase triples depend continuously on B (their entries are given by inverses of -B and I-B and their products). Independence therefore persists for small positive mixing. The positive alpha lies in the interior of the probability simplex, so its image contains an open neighborhood of the exponential triple. By the Jacobian above the achievable moment pairs contain an open neighborhood of (c,q).

For the Markov realization use states (hidden state i, current phase a). Internal phase changes preserve i. At a killing in phase a, update i to j with P_ij and restart in phase b with probability alpha_b. Include the resulting rates for every change of state. The possible null update is simply an invisible renewal. Internal phase transitions are bidirectional, refresh probabilities are positive, and positive P edges have reverses because the original entropy was finite. The realization has finite entropy. In the stationary renewal construction the embedded P-chain has law pi and is independent of the phase clock, as used in the correlation calculation.

## 3. Reversible resets join components exactly at the target

Given any near-minimizing network at (c,q), choose three finite-entropy anchor networks whose moment triangle contains (c,q) in its interior, using sections 1–2. For each small tau>0 retain mass 1-tau on the original network and distribute tau among the anchors. The attainable pairs then surround (c,q) in a smaller triangle. Duplicate each component with the sign of the lamp flipped and equal probability, making the global mean of f zero without changing its correlations or cost.

For sufficiently small epsilon>0 choose the anchor weights so the disjoint union has correlations ((1+epsilon)c,(1+epsilon)^2 q). Write pi for its stationary law and Pi for the matrix with all rows pi. Replace its generator by

```
Lnew=(1+epsilon)L + epsilon(Pi-I).
```

The reset makes the chain irreducible. The mean-zero subspace is invariant, and on it the new resolvent is exactly (I-L)^(-1)/(1+epsilon). Both target correlations are therefore restored exactly. The added reset is reversible with respect to pi. By the log-sum inequality the new entropy is no larger than (1+epsilon) times the weighted average of the component entropies. Let tau and epsilon tend to zero. This gives the same infimum with irreducibility imposed.

At c=1 a nonconstant lamp on an irreducible chain is impossible. The theorem makes no boundary claim there. It establishes the irreducibility step for the finite-value part of the lifted formulation at c<1. Deriving all lower bounds from pointwise dual potentials would require an additional strong-duality argument.

I derived the phase construction and the reset proof after reading the Claude track's lifted formulation and its exact-target irreducibility issue.
