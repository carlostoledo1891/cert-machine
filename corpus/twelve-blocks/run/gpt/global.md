# Exact finite optimality of the twelve blocks at sufficiently large scales

**Theorem.** For every even integer m ≥ 192 and every odd integer m ≥ 195, the twelve-block coloring B_m minimizes the number of monochromatic nonconstant three-term arithmetic progressions among all binary colorings of [1,548m]. With sites and colors labeled, there are precisely two minimizers in the even case and 102 in the odd case. For n=548m the value is

    V(n) = 117 n²/2192 − n/2 + (m mod 2).

The even minimizers are B_m and its color exchange. Each odd minimizer is one of the 51 masks in windows.md or its color exchange. Reflection is not quotiented. These are sufficient cutoffs. The proof gives no global decision for the smaller even scales or smaller odd scales.

## 1. A quantitative continuum bound

Embed a sign coloring s as the step function φ with value s_p on ((p−1)/n,p/n]. Let φ* denote the twelve blocks. Write Q(φ)=∬ φ(a)φ(b) over 0≤2b−a≤1 in the unit square. Exchange colors if necessary so the mass μ=∫(1−φφ*)/2 is at most 1/2. For step colorings this is k/n for the Hamming distance k to the closer orientation. Write E=(Q(φ)−Q(φ*))/4. Then

    E ≥ μ²/1024.                                                   (1)

We use the staged delta-three continuum discretization. On the inner 130-cell grid set w_i to the cell widths and y_i to the cell means of σ=(1−φφ*)/2. Thus μ=wᵀy. In the prior certificate's nonnegative matrix multiplier, replace N by N+wwᵀ/1024. Rebuilding the polynomial identity subtracts wwᵀ/1024 from its residual matrix P. Its positive semidefiniteness is verified exactly. Splitting the new matrix multiplier back into its two nonnegative contributions leaves μ²/1024 as an explicit lower bound. This applies on 0≤μ≤1/5. On [1/5,1/2] each of the four existing slab bounds exceeds 1/4096, and μ²/1024≤1/4096.

For completeness, the continuum lower polynomial follows by expanding E=∫hσ+Q(φ*σ), with h equal to −φ* times the symmetrized kernel applied to φ*. Within a cell the rearrangement of h gives a_i y_i+b_i y_i² where a_i=w_i min h and b_i=w_i²/(2 sup density); the density sums inverse absolute slopes on all crossing pieces at each regular height. On a full ordered cell pair the interaction is exactly s_i s_j w_iw_j y_i y_j. On a cut pair of positive sign the two lower bounds are zero and w_iw_j y_i y_j minus the outside area. On a negative pair they are minus the inside area and −w_iw_j y_i y_j. They follow from 0≤σ≤1. The inner polynomial uses the alternatives vanishing at zero. The slabs use verified convex combinations. Subtracting products of nonnegative factors on each slab and verifying the residual Gram matrix (with its stated diagonal error) certifies the slab bound. Each triangle multiplier is nonnegative on the box by multilinearity and evaluation at the vertices. The inner residual has zero constant and linear coefficients. This proof uses a quadratic lower bound on E.

The Python finite core embeds the five staged certificates, recomputes h, the bathtub constants, cut areas, polynomials and exact matrix inequalities. Its integer Cholesky factors propose decompositions; exact strict diagonal dominance of each remainder certifies them. The separate script global_verifier.js checks the same modification using the staged verifier with data changed only in memory. The staged SHA and definition files can be found in inherited/cert-machine.

## 2. The exact lattice correction

Let n be even, r=n/2, and S_e,S_o the sign sums on the two site parities. Let T=r(r−1) count all positive-difference progressions. The monochromatic indicator is (1+ab+bc+ca)/4. Each unordered same-parity pair occurs once as endpoints. Its contribution to the sign-pair sum, aggregated over all such pairs, is (S_e²+S_o²−n)/2. Each possible extrapolation contributes one ordered pair (p,q) with 1≤2p−q≤n. Adding its diagonal to the sum adds n.

To compare that ordered sum to n²Q, consider the unit cell with vertical site p and horizontal site q in [0,n]². At the lower boundary 2y−x=0 the discrete indicator and area differ only for q=2p−1 and q=2p. Their differences (indicator minus area) are +1/4 and −1/4, respectively. Integration across the cell gives areas 3/4 and 1/4. At the upper boundary p=r+i the corresponding differences are −1/4 and +1/4 at q=2i−1 and q=2i. All other unit cells agree exactly. Therefore

    R(s) = (1/4) Σ_{i=1}^r (s_i−s_{r+i})(s_{2i−1}−s_{2i}),
    4M(s) = T − 3n/2 + (S_e²+S_o²)/2 + n²Q(φ) + R(s).          (2)

The normalized baseline is exactly φ* and has Q(φ*)=−5/137. At even scales its parity sums vanish and all pairs (2i−1,2i) agree. At odd scales its parity sums are 2 and −2, and the only split pairs have 2i−1 equal to 99m or 449m. In each such pair s_i=s_{r+i}. Indeed i/m ranges from 99/2 to 50 in the first case and from 449/2 to 225 in the second, with matched signs after adding 274. Hence R(B_m)=0 at both parities. Substitution into (2) gives the displayed baseline count at every scale.

## 3. Every potential improvement has bounded support

Choose the closer baseline orientation. By color symmetry we may write it as B_m. Let k be the number of flipped sites and t the sum of their old signs. The new total sign is −2t since the baseline is balanced. Thus (S_e²+S_o²)/2 ≥ t². Write o=m mod 2. The baseline contribution at this term is 4o. Each summand of R(s) is at least −1 and vanishes when s_{2i−1}=s_{2i}. At most k+2o of those pairs are split. Hence R(s)≥−k−2o. Combining (1) and (2), with D=M(s)−M(B_m), yields

    4D ≥ k²/256 + t² − k − 6o.                                   (3)

If D≤0, each baseline color contributes at most (k+|t|)/2 flips. Since k²/256−k−6o is positive and increasing for k≥263, it suffices to check 0≤k≤262 and t=−k,−k+2,…,k. Subject to (3) with the right side nonpositive, the exact maxima of (k+|t|)/2 are 128 at even scales and 130 at odd scales. A global minimizer exists and has D≤0.

## 4. A global minimizer cannot flip outside the windows

The eleven windows at scale m are (bm−2m,bm+2m], where b runs through the unit-scale interior boundaries. For every site p outside the windows the baseline single-flip cost L(p) satisfies

    L(p) ≥ 2m+2   at even scales,
    L(p) ≥ 2m+1   at odd scales.                                  (4)

To prove this, put x=p−1/2. Let F be the linear interpolation of the integer baseline sign prefix sum, clamped at both endpoints. The continuum value n h(x/n) equals −s_p/2 times

    F(2x)−F(2x−n)+F((n+x)/2)−F(x/2).

The exact discrete expression for L from windows.md adds 3/2, adds the parity sum multiplied by −s_p/2, and replaces the last two arguments by ⌊(n+p)/2⌋ and ⌊p/2⌋. Each argument changes by exactly 1/4. Since F is 1-Lipschitz, the total additional error from the two rounded terms is at most 1/4 after multiplication. The absolute parity sum is 2o. The normalized field h has kinks only at multiples of 1/1096, since its four prefix arguments are affine and all original edges are multiples of 1/548. Away from open intervals of radius 2/548 around those edges, its minimum is 2/548 by exact evaluation at the nodes; the ends of the removed intervals are nodes. An outside site center x/n belongs to this closed region. Consequently L(p)≥2m+3/2−o−1/4. Integrality proves (4).

For a flipped site p, undoing its flip subtracts the marginal L(p)+Σ_{q≠p, flipped}s_p s_q w(p,q), where 0≤w≤3. Only opposite baseline colors can reduce this marginal. It is at least L(p) minus three times the number of opposite-color flips. By (3) and (4) this is strictly positive at every outside site when m is even and m≥192, or odd and m≥195. Such a site in a minimizer would permit a strict decrease.

It follows that every global minimizer lies in the eleven windows of the closer orientation. The exact window theorem in windows.md gives the count and classifies every equality mask. Both orientations are attainable and their minimizing lists are disjoint at the stated scales.

## Replay

From gpt/ run `python3 -B global_core.py`. The single standard-library file carries all five certificate inputs, the inner strengthening, the window enumeration and the remaining finite checks. Run `node global_verifier.js` for the original verifier implementation and `python3 -B falsifiers.py` for planted controls. Neither an extrapolation from small n nor a first-order-exact continuum estimate is used.
