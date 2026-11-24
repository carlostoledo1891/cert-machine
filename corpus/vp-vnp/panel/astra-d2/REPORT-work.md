# Exact check of Theorem D.2 at $\mu=2$ and $\mu=3$

## COMPUTED — full-system dimensions

| $\mu$ | Unordered pair variables | Transversal direction pairs | (D.1) equations | (D.2) equations | Total equations | Exact rank | Dimension |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 2 | 120 | 18 | 576 | 288 | 864 | 113 | **7** |
| 3 | 130,816 | 5,586 | 5,720,064 | 2,860,032 | 8,580,096 | 130,815 | **1** |

The counts use each unordered direction pair $\{W,V\}$ once, with both opposite-side equations and one diagonal equation at every basepoint $a$. They include dependent rows. Using ordered direction pairs doubles the equation counts by repeating rows. Transversality was tested by enumerating the binary row and column spaces and checking that each intersection was $\{0\}$. At $\mu=3$ there were 882 pairs of ranks $(1,1)$ and 4,704 of ranks $(1,2)$.

The rank function passed direct integer evaluation on every original equation at both sizes. At $\mu=2$ a separate elimination on the 120 unordered-endpoint variables also gave rank 113.

## REASONED — why the calculation covers all pair functions

Write $G=\mathrm{Mat}_\mu(\mathbb F_2)$, $N=|G|$, and $f_W(a)=d(a,a+W)$ for $W\ne0$. Every symmetric zero-diagonal function is specified by these functions subject to $f_W(a+W)=f_W(a)$. For each binary matrix $K$ use the character

$$
\chi_K(a)=(-1)^{\sum_{ij}K_{ij}a_{ij}}.
$$

Expand $f_W(a)=\sum_K c_K(W)\chi_K(a)$. Character orthogonality gives the inverse $c_K(W)=N^{-1}\sum_a f_W(a)\chi_K(a)$ over the rationals. Translation by $V$ multiplies the $K$ coefficient by $\chi_K(V)$. Thus imposing the equations at **every** basepoint is equivalent to imposing the following rows separately for **every** $K$.

1. Endpoint symmetry forces $c_K(W)=0$ if $\chi_K(W)=-1$.
2. For each transversal pair, (D.1) forces $c_K(W)=0$ if $\chi_K(V)=-1$, and $c_K(V)=0$ if $\chi_K(W)=-1$.
3. Set $S=W+V$. The two diagonals are $f_S(a+W)$ and $f_S(a)$, so (D.2) becomes

   $$
   \frac{1+\chi_K(W)}{2}\,c_K(S)-c_K(W)-c_K(V)=0.
   $$

The code removes exactly the forced-zero columns in the first two steps, then uses sparse Gaussian elimination with rational unit pivots on the third. Summing the block nullities gives the full nullity. The same change of basis and pivots work over $\mathbb R$.

## COMPUTED — ranks of the individual blocks

Each numerical column after the character count is **per character**. Characters were grouped by matrix rank for display after every block had been reduced.

| $\mu$ | $\operatorname{rk}K$ | Characters | Variables after symmetry | After (D.1) | Rank of remaining (D.2) rows | Nullity |
|---:|---:|---:|---:|---:|---:|---:|
| 2 | 0 | 1 | 15 | 15 | 14 | 1 |
| 2 | 1 | 9 | 7 | 2 | 2 | 0 |
| 2 | 2 | 6 | 7 | 4 | 3 | 1 |
| 3 | 0 | 1 | 511 | 511 | 510 | 1 |
| 3 | 1 | 49 | 255 | 72 | 72 | 0 |
| 3 | 2 | 294 | 255 | 88 | 88 | 0 |
| 3 | 3 | 168 | 255 | 80 | 80 | 0 |

## REASONED — the bases and the role of $\mu=3$

At either size, $R(x,y)=\operatorname{rk}(x+y)$ solves the system. Opposite sides have the same displacement. Transversal $W,V$ have $\operatorname{rk}(W+V)=\operatorname{rk}W+\operatorname{rk}V$, so both sides of (D.2) equal $\operatorname{rk}(W+V)$. This nonzero function spans the $K=0$ kernel at both sizes by the computed ranks.

**At $\mu=2$ a basis consists of $R$ and the six functions $E_S$** indexed by invertible matrices $S$, where

$$
E_S(x,y)=\mathbf 1_{\{x+y=S\}}\,(-1)^{\operatorname{tr}(S^{-1}x)}.
$$

The trace is in $\mathbb F_2$. On the support, exchanging $x$ and $y=x+S$ adds $\operatorname{tr}(I_2)=0$ to the exponent. Every transversal pair has two rank-one sides, so $E_S$ vanishes on all sides. If the diagonal displacement is $S=W+V$, the maps $S^{-1}W$ and $S^{-1}V$ sum to the identity and have complementary one-dimensional images. They are the projections onto those lines, so $\operatorname{tr}(S^{-1}W)=1$. The two diagonals therefore have opposite signs, as (D.2) requires. For any other diagonal displacement both values vanish. The six functions have disjoint supports, and $R$ is nonzero on rank-one displacements where all six vanish. This proves independence, and dimension seven gives completeness.

**At $\mu=3$ the basis is $\{R\}$.** To see why basepoint dependence disappears, take any nonzero singular $W$. Equation (D.1) makes $f_W$ invariant under translation by $uv^T$ whenever $u$ lies outside the column space of $W$ and $v$ outside its row space. The complement of each proper subspace spans the ambient vector space because each element of the subspace is a sum of two elements outside it. The allowed outer products therefore span $G$, making $f_W$ constant.

Now write any invertible $S$ as $P_1+P_2+P_3$ with $P_i=S e_i e_i^T$ for the standard basis vectors $e_i$. For each $W$ in $\{P_1,P_2,P_1+P_2\}$, the pair $W,S+W$ is transversal and both sides are singular. In a nonconstant character block their coefficients vanish. For $c_K(S)$ to survive (D.2), the character must consequently be $-1$ on all three choices of $W$. This is impossible because $\chi_K(P_1+P_2)=\chi_K(P_1)\chi_K(P_2)$.

This agrees with Steps 4–7 of the pinned Appendix D at $\mu=3$. The homogeneous system leaves a scalar free, and the paper's normalization $D(1)^2=1$ sets it to one. The six functions at $\mu=2$ show precisely how the stated equations admit further solutions below the dimension hypothesis.

## COMPUTED — reproduction

Run `python3 check_d2.py` in this directory. The [code](check_d2.py) uses only the Python standard library. The [full output](OUTPUT.txt) records the block ranks, the independent direct elimination at $\mu=2$, the evaluations of the seven basis functions there, and the CPU time for both sizes.
