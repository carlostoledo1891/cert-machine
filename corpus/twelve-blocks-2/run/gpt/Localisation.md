# Localisation of arbitrary sublevel colourings and two maps on their sign changes

**Results.** Every colouring at or below the rounded baseline lies in eleven radius-75 windows for $n\ge20700$. The residue formula and its labelled multiplicities hold from $n=15756$. Its value is attained at every positive length. At *every* exact scale $n=548m$, the value is $f(n)+(m\bmod2)$ and the number of labelled minimisers is 2 for even $m$ and 102 for odd $m$. Section 10 gives a separate finite proof of $V(548)=15756$ and the 102 ties. It uses the numerical multipliers directly and checks the required inequalities on the 548-site Boolean cube. The all-length upper construction also needs no continuum lower bound. The large-length and all-scale arguments identify their continuum inputs below.

**Theorem 1 (proved, conditional on the stated continuum certificates).** Let
$B=(28,34,62,99,158,274,390,449,486,514,520)$. For $n\ge20700$, write
$\beta_i=nB_i/548$, $b_i=\lfloor\beta_i+1/2\rfloor$, and let $C_n$ start red on site 1 and change colour after each $b_i$.
If a labelled binary colouring $s$ of $1,\ldots,n$ has at most $M(C_n)$ monochromatic three-term progressions of positive difference, then, up to exchanging its two colours, **every** site $p$ where it differs from $C_n$ lies in one of the eleven intervals
$$
                 b_i-75 < p \le b_i+75.
$$
In fact the centre of every such site has distance less than 75 from an ideal edge. Reflection of sites is never quotiented. The chosen orientation is unique.

**Theorem 2 (proved with the same continuum input).** On the same range there is a reversible map from the baseline sublevel at length $n$ onto the baseline sublevel at $n+1096$, adding exactly $117n+63568$ progressions. In particular it carries all labelled minimisers bijectively. For $n,n'\ge20700$ with $n+n'=1096q$, a second explicit involution carries all minimisers at $n$ to those at $n'$, preserving $M-f$, where $f(n)=117n^2/2192-n/2$. This proves both residue symmetries independently of the 1,096-row comparison. This extends the first run’s enumerated table to every length from 20,700. Section 9 lowers the cutoff for optimality to 15,756.

**Theorem 3 (proved using also the first run's finite window classification).** For $n=548m$, every baseline-sublevel competitor agrees with the nearer orientation of $B_m=C_n$ outside $\mathopen{(}mB_i-2m,mB_i+2m]$ for every even $m\ge20$ and odd $m\ge23$. The value is $f(n)+(m\bmod2)$; the labelled counts are respectively 2 and 102. Sections 7–8 strengthen this conclusion to every $m\ge1$, including the unit scale.

## 1. Continuum stability

Let $R=\{(a,b)\in[0,1]^2:0\le2b-a\le1\}$, $Q(u)=\iint_R u(a)u(b)$, and $u_*$ the ideal sign function, initially $+1$, with edges $B_i/548$. Embed site $p$ as the interval $\mathopen{(}(p-1)/n,p/n]$ with sign $s_p$. For any measurable sign function $u$, orient it so $\sigma=(1-uu_*)/2$ has $\mu=\int\sigma\le1/2$. Put $E=(Q(u)-Q(u_*))/4$.

**Lemma 1 (centring and field, paper identity and finite geometry).** Let $\Phi$ be the primitive of $u_*$, clamped at 0 and 1 outside its domain. Then
$$
 g(x)=[\Phi(2x)-\Phi(2x-1)+\Phi((1+x)/2)-\Phi(x/2)]/2,\quad h=-u_* g,
 \qquad E=\int h\sigma+Q(u_*\sigma).
$$
Indeed $u=u_*(1-2\sigma)$ and the two linear terms in the expansion are the integrals over the two sections of $R$. The balance is $\Phi(1)=0$, and $Q(u_*)=-5/137$. The field is continuous, linear between nodes $j/1096$, $0\le j\le1096$, and is $3/2$-Lipschitz. It satisfies
$$
 548h(y/548)\ge\min(2,\min_i|y-B_i|),\qquad 0\le y\le548.
$$
For $|y-B_i|\le2$ it equals $H_i|y-B_i|/2$ in these same units, with $H=(2,2,3,2,3,3,3,2,3,2,2)$. These are rational evaluations at the 1,097 nodes; the breakpoints of the right-hand sides belong to this grid, and the grid contains every possible kink of the primitive formula. Values on opposite sides of a sign edge agree because $g=0$ there.

**Lemma 2 (October discretisation, paper).** Use any of the five certificate grids. Each cell $I_i$ has width $w_i$, constant ideal sign $s_i$, mean $y_i=w_i^{-1}\int_{I_i}\sigma$. Thus $0\le y_i\le1$ and $\mu=w^Ty$. For cell minimum $h_i$, put $a_i=w_ih_i$, $b_i=w_i^2/(2d_i)$, where $d_i$ is the maximum, over regular heights in that cell, of the sum of the inverse absolute slopes of the linear pieces crossing the height. The finite field check shows there are no flat pieces. The measure of the sublevel $h<h_i+t$ is at most $d_i t$, by integrating the level density. Layer cake for mass $v=w_i y_i$ now gives
$$
 \int_{I_i}h\sigma\ge vh_i+\int_0^\infty(v-d_i t)_+dt=a_i y_i+b_i y_i^2.
$$
For an ordered rectangle let $w=w_iw_j$, $A=|R\cap(I_i\times I_j)|$, $m=w y_i y_j$. The integral of $\sigma(a)\sigma(b)$ over its inside lies between $\max(0,m-w+A)$ and $\min(m,A)$, since the density is in $[0,1]$ and its total is $m$. Multiply by $s_i s_j$, remembering to reverse the inequality for a negative sign. Full and empty rectangles contribute exactly. On cut rectangles the inner polynomial $L_0$ takes 0 for a positive sign and $-m$ for a negative sign. A slab polynomial takes the certificate's convex combination of the two available lower bounds. Summing proves $E\ge L$ for each such polynomial and for arbitrary measurable defects. No cellwise constancy of the defects enters.

**Lemma 3 (global and small-mass certificates, machine-checked).** For $\mu\le1/2$, $E\ge\mu^2/948$. In addition, for each row below, $\mu\le1/D$ implies $E\ge\mu^2/C$.

| $D$ | 35 | 100 | 150 | 200 | 250 |
|---|---:|---:|---:|---:|---:|
| $C$ | 315 | 213 | 175 | 168 | 166 |

The first inequality uses the first run's rank-one strengthening of the October inner certificate and its four original slabs. Here are the finite obligations. On the four intervals with endpoints $1/5,3/10,2/5,9/20,1/2$, subtract the stored scalar and nonnegative multiples of the box and slab inequalities from the slab polynomial. The residual Gram matrix $S$ on $(1,y)$ satisfies $S+\epsilon'I\succ0$; the scalar minus $(1+\dim y)\epsilon'$ exceeds $1/3792$. The replay uses $\epsilon'=(1+2^{-20})\epsilon$. Triangle forms are affine in each variable and nonnegative at the vertices, as follows from the multiplier signs having product $+1$.

On the inner grid of 130 cells the exact polynomial identity is
$$
 L_0=y^TPy+\sum_{ij}\lambda_{ij}y_i(1-y_j)+\sum_i\nu_i y_i(1/5-\mu)
       +\kappa\mu(1/5-\mu)+y^TNy+c^Ty .
$$
All displayed multipliers and all entries of $N$ are nonnegative. $P-ww^T/948\succ0$. This gives the global constant for the inner interval. The checker rebuilds the polynomials by coefficient comparison. Positive definiteness is certified by an exact decomposition into an integer triangular Gram term and a strictly diagonally dominant positive-diagonal remainder after scaling. Floating point plays no part in acceptance.

For the new rows, take $0<\mu\le1/D$, $x_i=w_i y_i/\mu$, $A_{ij}=P_{ij}/(w_iw_j)$, and put
$$
 b_i(D)=\frac D{w_i}\left[c_i+\nu_i(1/5-1/D)+\sum_j\lambda_{ij}\max(0,1-1/(Dw_j))\right].
$$
Because $y_j\le\mu/w_j$, division of the inner identity by $\mu^2$ gives $E/\mu^2\ge x^TAx+b(D)^Tx$. For any rational vector $v$, positivity of $A$ and $\sum x_i=1, x_i\ge0$ imply
$$
 x^TAx+b^Tx\ge \min_i(2Av+b)_i-v^TAv.
$$
Each of the five provided rational vectors makes this last expression strictly greater than $1/C$. The case $\mu=0$ follows directly. The vectors were located numerically; the five inequalities and the matrix signs are proved by integer and fractional arithmetic in the replay. This uses previously discarded terms of the certificate.

## 2. What the lattice contributes

**Lemma 4 (exact lattice identity, paper).** Let $S_0,S_1$ be the even and odd sign sums, $T=\lfloor(n-1)^2/4\rfloor$, and $p,q\in\{1,\ldots,n\}$. For $n\ge2$,
$$
 4M=T-3n/2+(S_0^2+S_1^2)/2+n^2Q(u)+R_n,\qquad
 4R_n=\sum_{p,q}s_ps_q([2p-q=1]-[2p-q=0]+[2p-q=n]-[2p-q=n+1]).
$$
Indeed the triple indicator is $(1+ab+bc+ca)/4$. Same-parity pairs contribute $(S_0^2+S_1^2-n)/2$; the two extrapolation counts sum to the ordered sum with $1\le2p-q\le n$ minus its $n$ diagonal terms. In the unit cell $\mathopen{(}q-1,q]\times\mathopen{(}p-1,p]$, the area inside the strip equals the integer indicator except for $2p-q=1,n,0,n+1$, where it is respectively $3/4,3/4,1/4,1/4$. These areas follow by cutting a right triangle of base 1 and height $1/2$. This proves the identity.

For even $n=2r$, $4R_n=\sum_{i=1}^r(s_i-s_{r+i})(s_{2i-1}-s_{2i})$. For odd $n=2r+1, c=r+1$,
$$
 4R_n=s_c(s_1+s_n)+\sum_{i=1}^r[s_i(s_{2i-1}-s_{2i})+s_{c+i}(s_{2i+1}-s_{2i})].
$$
Let $k=n\mu$ in site-length units, possibly fractional. For jumps after odd sites the corresponding pairs of cells are disjoint. Each pair that jumps either contains an ideal edge in its open span (at most eleven such pairs) or disagrees with the ideal on one entire cell. Thus their count is at most $k+11$; the proof for even sites is identical. Consequently $R_n\ge-k-11$ at even $n$, and $R_n\ge-k-23/2$ at odd $n$. Since $T=n^2/4-n/2+(n\bmod2)/4$, both parities satisfy
$$
 M-f(n)\ge n^2 E+(S_0^2+S_1^2)/8-k/4-45/16. \tag{1}
$$

**Lemma 5 (rounded competitor, finite check from the first run, replayed).** $M(C_n)-f(n)\le U=1453/137$; its excess has period 1096. Here is an exact way to test the assertion over all lengths. On rounded blocks $\mathopen{(}a,b],\mathopen{(}c,d]$, four times the strip area is $G(a,d)-G(b,d)-G(a,c)+G(b,c)$, with $G(x,y)=(2y-x)_+^2-(2y-x-n)_+^2$. Count even sites by floor differences, odd sites by subtraction, and use Lemma 4 at the at most eleven jumps for $R_n$. For each $1\le t\le1096$, write $n=t+1096j$. Every rounded interior edge advances by $2B_i$, with unchanged parity. For $j\ge1$, check at $j=1$ that each hinge argument and its increment have a common weak sign; for every sign lookup at site $x$ check $x-b_i\le0$ and increment $\le0$, or $x-b_i>0$ and increment $\ge0$. This leaves a quadratic polynomial per residue. Its excess has equal values at $j=1,2,3$, hence is constant. $j=0$ is counted separately. The exact maximum over those residues is $1453/137$.

## 3. Restoring one cell of an arbitrary competitor

**Lemma 6 (mass bootstrap).** For $M(s)\le M(C_n)$ and $n\ge20700$, $k<362/5$. From (1) and Lemmas 3 and 5, whenever a constant $C$ applies, $4k^2/C-k\le4U+45/4$. With $C=948,315,175,166$ successively the strict upper bounds on $k$ are $283,116,76,362/5$. In each case substitute the proposed endpoint, which is above the vertex $C/8$, and obtain a strict violation. The first three bounds imply in order $35k<n,150k<n,250k<n$ at $n=20700$. They therefore activate the next row at every larger length.

**Lemma 7 (cost of restoring a far flip, paper).** Let a site centred at $x=p-1/2$ differ from $C_n$. If its cell contains an ideal edge in its interior, its distance from one is already at most $1/2$. Otherwise its ideal sign is constant $c$ and its actual sign is $-c$. Restore it to $c$, obtaining $u'$ with mass $(k-1)/n$. Keeping the orientation fixed only decreases the mass. Use length units on $[0,n]$, and write $h_n(t)=nh(t/n)$, so the linear and quadratic terms on this interval sum to $n^2 E$. Relative to $u'$, reinserting the unit defect adds at least $h_n(x)-3/8$ to the linear term by the $3/2$ Lipschitz estimate integrated over a unit cell. Its self-interaction is nonnegative. The two cross terms lose at most twice the restored colouring's defect mass of opposite ideal sign. Indeed each of the two ordered kernels lies in $[0,1]$ and the inserted mass is one. The total defect mass of $u'$ is $k-1$; its signed defect mass is $-(S_0+S_1+2c)/2$, by ideal balance. Twice its opposite mass is therefore $k+c(S_0+S_1)/2$. Lemma 3 applies to $u'$ with $C=166$. We conclude
$$
 n^2 E(s)\ge (k-1)^2/166 + h_n(x)-3/8-k-c(S_0+S_1)/2.
$$
The lattice correction in (1) belongs to the **original** colouring. Complete the two parity squares there, using $(S_0^2+S_1^2)/8-c(S_0+S_1)/2\ge-1$. Combining with the sublevel assumption gives
$$
 h_n(x)\le U+3/8+1+45/16+5k/4-(k-1)^2/166
 <339232121/4548400<75 .
$$
The expression is increasing up to $k=362/5$. Since $2n/548>75$, the field envelope of Lemma 1 forces $|x-\beta_i|<75$ at some edge. The inequality $|b_i-\beta_i|\le1/2$, with $p,b_i$ integers, gives precisely the asserted half-open site windows. Uniqueness of orientation follows because $k<n/2$. This proves Theorem 1. No step assumes restoring a flip decreases the count of the original competitor.

## 4. Period translation and opposite residues

**Lemma 8 (local jump coordinates).** Work in physical coordinates on $[0,n]$, with each cell $(p-1,p]$. Record the integer jumps $t$ where $s_t\ne s_{t+1}$, with sign $d_t=(s_t-s_{t+1})/2$. In the orientation that starts red, put $l_i=(-1)^{i-1}$. For the competitors in Theorem 1, every jump lies within $W=151/2$ of a unique $\beta_i$, the neighbourhoods are disjoint, and $\sum_{t\text{ near }i}d_t=l_i$. Between these neighbourhoods the colouring equals the ideal. Conversely we may allow *any* local jump patterns with these properties and alternating signs starting and ending with the prescribed block colours. This enlarged class is closed under both maps below, including rounding ties.

Within these neighbourhoods let $m_i=\int_{\text{near }i}u_*\sigma$ be the signed physical defect masses. The ordered interaction indicator is constant on each product of neighbourhoods, since every $2B_i-B_j$ is at distance at least 6 from $0,548$ and $3W<6n/548$. If $J_{ij}=[0<2B_j-B_i<548]$, the physical energy therefore is exactly
$$
 n^2 E=\sum_i \frac{H_i}{2}\int_{\text{near }i}|x-\beta_i|\sigma(x)\,dx+\sum_{ij}J_{ij}m_i m_j.
$$
At $n=20700$, the two strict margins $2n/548-W$ and $6n/548-3W$ are respectively $13/274$ and $39/274$; both grow with $n$. The local field formula holds because $W<2n/548$. Localisation of the step function on whole cells costs an extra half site beyond the field bound on centres.

For $n'=n+1096$, translate every jump near $\beta_i$ by $2B_i$, keeping its sign. The inverse subtracts $2B_i$ at the corresponding edge. This keeps both the defect density as a function of its offset and its signed mass. For $n'=1096q-n$, send
$$
                    t\longmapsto 2qB_i-t,\qquad d'_{{2qB_i-t}}=d_t.
$$
The resulting local pattern is the negative of the reversed pattern, so it starts and ends with the prescribed colours. This preserves the absolute defect density under reflection about the two ideal edge locations and sends $m_i$ to $-m_i$ for *every* $i$. The preceding formula proves equality of the centred physical energies under both maps.

The total sign sum is $-2\sum_i m_i$ by ideal balance. The parity difference satisfies
$$
 S_0-S_1=[n\ \mathrm{odd}]-2\sum_{t\ \mathrm{odd}} d_t
$$
in the red-first orientation. Indeed $s_p=-1+2\sum_{t\ge p}d_t$ and $\sum_{p=1}^t(-1)^p=-[t\ \mathrm{odd}]$. Jump parities and the parity of $n$ are preserved by both maps. Consequently the translation preserves both parity sums, and the second map sends $(S_0,S_1)$ to $(-S_1,-S_0)$.

It remains to check $R_n$, since invariance of the continuum and parity terms alone would miss an order-one contribution. At even $n$, a jump after an odd $t$ is multiplied in $4R_n$ by twice the difference of the signs at cell centres $t/2,(n+t)/2$. At odd $n$, an odd jump is multiplied by twice the sign at $t/2$ and an even jump by minus twice the sign at $(n+t)/2$. These statements use the signed jump $d_t$; they follow by direct substitution in Lemma 4. The odd endpoint term vanishes because the two endpoint colours are opposite. In ideal units $B_i/2$ and $(548+B_i)/2$ are at distance at least 3 from every edge including the endpoints. A probe centre moves at most $W/2$ from that target, and $3n/548>W+W/2$. Thus every probe sees its ideal block colour, which depends only on the edge index and which probe it is. Both maps preserve the signed jumps, their parity, and these probe signs, hence preserve $R_n$.

Lemma 4 now gives equality of $M-f$ under both maps, since $T$ contributes the same parity correction. They are bijections on the enlarged neighbourhood class. Translation also takes $C_n$ exactly to $C_{n+1096}$. Theorem 1 therefore makes its restriction a bijection of the entire baseline sublevels, with count increment $f(n+1096)-f(n)=117n+63568$. For opposite residues, take an optimum in each direction. Each image is a feasible competitor of equal excess, so the two minimum excesses agree, and the inverse maps carry the labelled minimisers in both directions. For a blue-first colouring, exchange colours before applying either map and exchange them back afterwards. This proves Theorem 2 and transports the first run's large-length enumeration down to 20,700.

The opposite-residue map also has a description in the 22 integer boundary variables. Define $u_{i\pi}$ to be the sum of baseline signs of flipped sites of parity $\pi$ at edge $i$. Equivalently, it is half the sum of $C_n-s$ over those sites. Away from a rounding tie, the reference patterns themselves are reversed and negated, and site $p$ goes to $2qB_i+1-p$, of opposite parity. Thus $u'_{i\pi}=-u_{i,1-\pi}$. At a tie the reflected baseline jump is at $\lfloor\beta_i'\rfloor$, while the target rounded baseline jumps at $b'_i=\lceil\beta_i'\rceil$. The single discrepant site $b'_i$ has target baseline sign $l_i$. Therefore one adds $l_i$ to $u'_{i,b'_i\bmod2}$ at that edge. Applying the rule twice cancels these terms because the two tie sites have opposite parities. The jump map itself works for arbitrary noncompact configurations with the same charges.

## 5. Exact block scales

**Lemma 9 (scale-specific deletion).** Set $o=m\bmod2$. At $n=548m$ the rounded and ideal functions agree. The baseline has $(S_0,S_1)=(2o,-2o)$, and $R_n=0$. Indeed only the edges $99m,449m$ can be odd; for these two jumps, the ideal signs at $t/2$ and $(n+t)/2$ agree. These facts also follow from the block width and parity sums directly. For a competitor in the closer orientation let $k$ be its integer number of flipped sites, and $a,b$ their old sign sums on the even and odd sites. The new parity sums are $2o-2a,-2o-2b$. Each flip can split at most one of the disjoint odd-even pairs in the even-length formula for $R_n$. The original has at most $2o$ splits. Thus comparison with $M(B_m)=f(n)+o$ gives
$$
 4k^2/C-k+2(a-o)^2+2(b+o)^2\le6o
$$
whenever $C$ applies. Starting at $C=948$ use this inequality and $n\ge548(20+3o)$ to activate $D=35,100,200,250$ successively. At $C=166$ this gives $k\le41$ for even $m$ and $k\le46$ for odd $m$. The finite maxima of $k+\max(|2a+b-o|,|a+2b+o|)$ are 41 and 47, respectively. The replay checks all $|a|+|b|\le k$ and $a+b\equiv k\bmod2$ in those ranges.

Here are the removal costs with the sign of the parity contribution retained. Let $L(p)$ be the single flip cost of the baseline and $c$ its old sign at $p$. For the clamped baseline sign prefix $F$ and baseline parity sum $P_\pi$, direct counting gives
$$
 2L(p)=3-c\{P_\pi+F(2p-1)-F(2p-1-n)+F(\lfloor(n+p)/2\rfloor)-F(\lfloor p/2\rfloor)\}.
$$
The same-parity pair and both extrapolations include the diagonal in this prefix expression, explaining the 3. With $x=p-1/2$, the two half-arguments differ from the continuous ones by $1/4$ each. Each prefix is 1-Lipschitz. An outside site has field $h_n(x)\ge2m$, so integrality gives $L(p)\ge 2m+2-cP_\pi/2$. In a set of flips the removal marginal (count before minus after deletion) adds to $L(p)$ the signed pair weights between $p$ and the other flips. This follows by expanding the triple indicator in the flip bits. The parity term is $c a_\pi-1$, where $a_\pi=a$ or $b$. The two extrapolations together lose at most twice the number of opposite-sign flips, namely $k-c(a+b)$. The resulting removal marginal is at least
$$
 2m+1-k+c(a+b+a_\pi-P_\pi/2)\ge0
$$
by the finite maxima above. Hence we can delete outside flips from any baseline-sublevel competitor without increasing its count.

The remaining input here is the first run's finite window lemma, whose exact checker is included in the replay. Within the eleven radius-$2m$ windows the minimum change is zero, with just the empty mask at even scales and 51 masks (each of size at most seven) at odd scales, before colour exchange. For context, the proof groups flips by boundary, side and parity. The two extrapolation indicators are constant on window pairs. At fixed signed charges the nearest sites give the unique cheapest mask; the one-body costs increase by $H_i$ per same-parity step. The resulting integer quadratic is tested by exact positive-definite elimination and bounded lattice enumeration. The full finite proof, including branch checks for unbounded $m$, is in the inherited window core. This classification is an input only for Theorem 3. After the deletions the final count is at least baseline, so all deletions would have to be equalities. If a last deletion occurred, its outside site had at most seven other flips. Its removal marginal is at least $2m+2-o-3\cdot7>0$, since a pair has weight at most three. This contradiction proves Theorem 3.

## 6. Replay and attempted falsification

From the GPT folder run the following, with Python's bytecode cache disabled. All use the standard library.

~~~sh
python3 -B localisation.py
python3 -B ../inherited/run1/gpt/all_length_check.py
python3 -B ../inherited/run1/gpt/window_core.py
python3 -B jump_check.py
~~~

The first command reads the staged October certificates themselves, reuses the first run's verified grid/Gram routines, rebuilds the inner matrix a second way, and checks the new vectors, arithmetic and geometry. The second replays the rounded upper bound. The third checks the separate local classification at exact scales. The fourth compares the two jump maps against a direct count from the coloured bits. Lemmas 1–7 prove localisation for arbitrary lengths in the stated range.

The first run uses a necessary marginal condition for an optimum. On a sublevel with positive slack, a strict decrease on removing an outlying flip would be consistent with that slack. Theorem 1 addresses this logical gap by applying stability to the *restored* colouring and retaining the parity penalty of the *original* colouring. The bound $k$ here is a continuous site-length distance and need not be an integer. The Hamming distance differs from it by at most $11/2$.

Three other sensitive points are the two orders of the quadratic interaction, the odd endpoint term, and rounding ties under the opposite-residue map. Lemma 7 charges both orders, Lemma 4 includes the endpoint even before localisation, and the signed jump rule uses integer edges without rounding. The October bounds remain the external mathematical dependency. The paper-to-finite bridge in Lemma 2 uses the upper density of **all** linear pieces crossing a height; using only one inverse slope would overstate the cell bound. This document re-derives that bridge and the lattice identity on paper. The strengthened small-mass, single-cell and jump-map arguments are new. The original five certificate data files and the inherited window enumeration are reused and identified above.

## 7. Every exact scale except the unit scale

**Theorem 4 (proved, strengthened scale bound).** For every integer $m\ge2$, every competitor at or below $M(B_m)$ is supported, relative to its closer baseline, in the eleven radius-$2m$ windows. Thus $V(548m)=f(548m)+(m\bmod2)$, with 2 labelled minimisers for even $m$ and 102 for odd $m$. This improves Theorem 3 using a second, independent localisation argument. The finite window classification used after localisation is the same.

**Full-cell integer masses.** At exact scales every inner-grid cell is an integer number of whole sites. Let $x_i$ be its number of flipped sites, $k=\sum_i x_i$, $s_i$ its ideal sign. Lemma 9 with $C=948$ gives $k\le243$. In fact $\mu<1/5$ even at $m=1$, because on the outer slabs $n^2E>548^2/3792>(243+6)/4$, while the proof of Lemma 9 gives $n^2E\le(k+6o)/4$. We can therefore use the full inner polynomial. From Lemma 4 and the baseline quantities,
$$
 n^2E+\tfrac14(\sum_i s_i x_i)^2+R_n/4\le o .
$$
Here the two actual parity squares divided by eight are at least the total sign squared divided by sixteen, and the total sign is $-2\sum_i s_i x_i$.

**Charging the lattice correction.** Exactly 22 of the 130 inner-grid cells touch a $B_i$. These are the two sides of the eleven desired windows, each of width $2m$. Call an edge active when the ideal signs at $B_i/2$ and $(548+B_i)/2$ differ in units of $1/548$. The active edges are $62,158,274,390,486$. In the even-length formula for $R_n$ write a summand as the product of the two half sign differences, each in $\{-1,0,1\}$. For a pair of sites $(2j-1,2j)$ that touches an inactive window, the two probe centres $(2j-1)/2,(n+2j-1)/2$ are outside *all* windows and have equal ideal signs. Indeed the midpoint $2j-1$ is within $2m$ of the window centre, and ideal probe targets are at least $3m$ from every edge. Hence a probe centre is at least $2m$ from every edge. Its position is a half-integer, so the inequality is strict. Charge a possible negative summand to a flip of either probe site. For all other pairs charge it to a flip in the pair itself. The pair baseline signs agree in this second case, since its only possible split jumps, $99m$ and $449m$, are inactive. Each site occurs in at most one probe pair and one site pair. It follows that $-R_n\le\sum_i g_i x_i$, with $g_i=0$ at inactive windows, 1 at active windows, and 2 on the exterior cells. At $n=1096$, for each actual pair choose the probes precisely when their baseline signs agree and the pair touches a window or has split baseline signs (the parenthesised condition applies jointly with probe agreement). Otherwise choose the site pair. Take the maximum site charge multiplicity within each cell. The six vectors use these particular weights. This sometimes improves $g_i$ on the exterior. The bound for $m\ge3$ uses only the uniform weights.

**Three rounds of exact box bounds.** Consider two cases, $n=1096$ with $o=0$, and $n\ge1644$ with $o\le1$. Write $n_0=1096,1644$ respectively. Start with $0\le x_i\le U_i$, $\sum x_i\le K=243$. At the single length intersect the box with the actual capacities $n_0w_i$ and use $K\le\lfloor n_0/5\rfloor$. Let $N_i=n_0w_i$, and for each row of the October multipliers compute
$$
 h_i=\sum_j\lambda_{ij}-
 \max_{\substack{0\le t_j\le\min(N_j,U_j)\\ \sum_j t_j\le K}}
                \sum_j \lambda_{ij}t_j/N_j .
$$
The maximum fills entries in descending order of $\lambda_{ij}/N_j$, by exchanging capacity between entries. For actual masses at length $n\ge n_0$,
$n(1-y_j)=n-x_j/w_j\ge n_0(1-\min(x_j,N_j)/N_j)$. Consequently the contribution of the $\lambda$ row to $n^2E$ is at least $n_0 h_i x_i/w_i$. The nonnegative $\nu_i,c_i$ terms give further lower bounds with coefficients $\nu_i\max(0,n_0/5-K)/w_i$ and $n_0 c_i/w_i$. The entrywise nonnegative $N$ term may be discarded.

Define
$$
 e_i=[n_0(h_i+c_i)+\nu_i\max(0,n_0/5-K)]/w_i-g_i/4,\qquad
 H=A+ss^T/4-I/8,
$$
where $A_{ij}=P_{ij}/(w_iw_j)$ exactly as in Lemma 3. The checker establishes $H\succ0$. For any rational $v$, every surviving integer vector consequently satisfies
$$
 \sum_i q_i(x_i)\le o+v^THv,\qquad
 q_i(t)=t^2/8+[e_i+2(Hv)_i]t.
$$
This is the tangent inequality for $x^THx$. It permits exact coordinate elimination by enumerating the integers $0,\ldots,U_i$. Exclude every value $t$ for which $q_i(t)+\sum_{j\ne i}\min_{0\le u\le U_j,\ u\in\mathbb Z}q_j(u)>o+v^THv$. Replace each upper bound by the largest surviving value, and $K$ by $\min(K,\sum U_i)$. Recompute $h_i$ before the next round. Each case needs just three rational vectors with denominator 10,000. The final upper bound is zero on every exterior cell. This proves the claimed localisation simultaneously for *every* $m\ge3$, as well as separately for $m=2$.

Run `python3 -B scale_cells.py` in this folder. The six vectors are in `scale-tangents.json`. This proof uses integer cell masses, which is why its scale conclusion does not directly transfer to arbitrary lengths. Section 8 handles the remaining unit scale.

## 8. The unit scale and the classification for all multiples of 548

**Theorem 5 (proved, all exact scales).** For every integer $m\ge1$, the minimum at $n=548m$ is $f(n)+(m\bmod2)$. The numbers of labelled minimisers are 2 for even $m$ and 102 for odd $m$. Every colouring at or below $M(B_m)$ agrees with its nearer baseline outside the eleven radius-$2m$ windows. In particular $V(548)=15756$ with 102 labelled minimisers.

Only $m=1$ remains after Theorem 4. Set $c_i^*=548w_i$, the integer capacities, and use the site-by-site charge calculation of Section 7 at this length. On an integer box $l\le x\le u$, keep $K=\min(109,\sum u_i)$ as a bound on $\sum x_i$. The number 109 follows from $\mu<1/5$ in Section 7. Write $\Lambda_{ij}=\lambda_{ij}/(w_iw_j)$ and $Z_{ij}=N_{ij}/(w_iw_j)$. The exact multiplier terms in physical units are
$$
       \sum_{ij}\Lambda_{ij}x_i(c_j^*-x_j)+x^TZx .
$$
For row $i$ let $a_i$ be the maximum of $\sum_j\Lambda_{ij}x_j$ on the current box and total-mass budget. Start at $l$, then fill the remaining budget in descending order of $\Lambda_{ij}$. Write $b_i=\sum_j\Lambda_{ij}c_j^*$. The following two bounds retain the effect of **positive lower bounds** on cell mass:
$$
 \sum_j\Lambda_{ij}x_i(c_j^*-x_j)
 \ \ge (x_i-l_i)(b_i-a_i)+l_i(b_i-\sum_j\Lambda_{ij}x_j),
 \qquad x^TZx\ge 2l^TZx-l^TZl .
$$
The first splits $x_i=l_i+(x_i-l_i)$ and uses the row maximum only for the second part. The second follows entrywise from $x-l\ge0$ and $Z\ge0$. No semidefinite sign assumption on $Z$ is needed.

Insert these bounds in the proof of Section 7. More explicitly, define
$$
 e_i=b_i-a_i+\frac{548c_i+\nu_i(548/5-K)}{w_i}-g_i/4
       +2(Zl)_i-(\Lambda^Tl)_i,\qquad
 e_0=\sum_i l_i a_i-l^TZl .
$$
For every supplied $v$, a necessary inequality is
$$
 \sum_i\big(x_i^2/8+[e_i+2(Hv)_i]x_i\big)\le 1+v^THv-e_0 .
$$
Minimise each one-variable polynomial over the current integer interval and remove impossible upper **and** lower values as in Section 7. An empty box or a sum of minima above budget refutes the subproblem. A certificate operation either narrows the current box directly, or posits $x_i\ge a$ and proves that restricted box empty, after which $u_i$ may be decreased to $a-1$. All original points outside the restricted box remain possible. The file contains 120 operations with 201 sparse rational tangent vectors, each denominator $10^7$. The exact replay leaves just two exterior cells, sites $\{31,32\}$ and $\{517,518\}$, each holding at most one flip. This is a necessary condition; the final comparison below rules out all four sites.

Fix any one of the eight nonempty choices $F$ of exterior sites. The four sites at each of the eleven near edges split by parity into 22 pairs, each with one positive and one negative old sign. For distinct sites define $w(p,q)=[p\equiv q\bmod2]+[1\le2p-q\le548]+[1\le2q-p\le548]$. Direct expansion gives the cost of $F$ as the sum of its single-site costs $L(p)=-\frac12\sum_{q\ne p}s_ps_qw(p,q)$ and its signed pair weights. For near sites the adjusted single-site costs are $L'(p)=L(p)+\sum_{f\in F}s_ps_fw(p,f)$.

Let $W_{ij}$ be the common unsigned $w(p,q)$ between near pairs $i,j$, extending the diagonal with $W_{ii}=3$. Constancy follows from the original window geometry and is checked for every distinct pair of the 44 sites. Let $u_i$ be the signed number of flips in pair $i$ and $q_\pm=2L'(p_\pm)-3$. At fixed $u_i=1,-1,0$ the cheapest one-body contributions are respectively $q_+,q_-,z_i=\min(0,q_++q_-)$. The two ways to attain $u_i=0$ are doing nothing and flipping both sites. Thus the least possible $4(M-M(B_1))$ at fixed $u$ is exactly
$$
 4D(F)+2\sum_i z_i+
 u^T[2W+\operatorname{diag}(q_++q_--2z_i)]u
 +\sum_i(q_+-q_-)u_i.
$$
For each $F$, exact positive-definite elimination and completed-square enumeration over *all* integer vectors give an excess lower bound of 2 for one exterior site and 5 for two. Enumeration over all integers only enlarges the ternary feasible set. With the exterior excluded, the inherited near-window classification gives exactly the 51 masks in the red-first orientation. Colour exchange doubles that count. The exact unit-scale value follows by evaluating $f(548)+1$.

Run `python3 -B unit_cells.py` from this folder. It reads `unit-tangents.json` and calls `unit_finish.py`. The box replay scales all rational coefficients to integers before comparison. The quadratic solver used only in the final eight problems is the first run's exact lattice enumerator. The lower-bound numbers in those eight cases concern configurations with an exterior flip, independently of the minimum among configurations with no exterior flip.

## 9. Attainment at every length and a sharper cutoff for optimality

**Theorem 6.** Let $A(n)=(117n^2+c_r)/2192-n/2$ use the inherited residue table. **Unconditionally, $V(n)\le A(n)$ for every $n\ge1$**, with a specified colouring attaining $A(n)$. Using also the continuum input, **$V(n)=A(n)$ with the tabulated labelled multiplicity for every $n\ge15756$**. Theorem 1 still gives the stronger arbitrary-*rounded*-sublevel assertion on its original range. The smaller cutoff here concerns the sublevel $M\le A(n)$.

For the first assertion, all displayed table masks use offsets $-1,0,1,2$ at rounded edges. Their jumps are at most $5/2$ from ideal edges. In Lemma 8 replace $W$ by $5/2$. For $n\ge686$, $2n/548>5/2$, so the disjointness, field, strip and probe inequalities all hold. Moving the mask by one period preserves its excess. Direct bit counts verify the target on the 1,096 consecutive base lengths $686,\ldots,1781$. At $1,\ldots,685$ apply the same supplied mask, ignoring any out-of-range site and toggling duplicate indices in order. Only at $23,24,25,31,33$ are other colourings needed. The five checked strings are in `upper-short.json`. This constructs a colouring at the target at *every* length without using the October lower bounds or assuming any table entry is minimal.

For $M\le A(n)$, repeat Lemmas 6–7 with $U=3516/2192$, the maximum $c_r/2192$. At $C=948,315,175,166$ successive strict bounds on $k$ are $254,94,58,549/10$; the first three times $35,150,250$, respectively, are each below 15,756. Substitution of the final bound into Lemma 7 gives $h_n(x)<57$ for every flipped cell away from a cut edge. Thus every jump lies within $W=115/2$ of an ideal edge. The geometric condition is strict already at 15,756, since $274W=15755$. Translation is a bijection on this enlarged local class. It preserves $M-f$ and $A-f$ is periodic, so it carries the whole sublevel $M\le A(n)$ bijectively to the corresponding sublevel after one period. This sublevel is nonempty by the first assertion, and contains every optimum. Translate to the already enumerated large-length range and back. This proves the equality and the multiplicities.

Run `python3 -B upper_all.py` for the bit counts, mask support, upper bound and exact cutoff arithmetic. Whether every length below the proved cutoff also satisfies the lower bound remains open beyond the separately settled domains.

## 10. A finite proof of the unit scale, and an independent root bound

**Finite-cube version of Theorem 5 at $n=548$.** The two continuum paper lemmas can be eliminated entirely at this length. All five numerical certificates have grid endpoints on lattice-site boundaries. The following audit proves their polynomials lower bounds directly for the $2^{548}$ binary strings. The numerical multipliers are reused as candidate data. The proof needs no continuum optimum, centring identity or rearrangement theorem.

Number sites $1,\ldots,548$. Form the integer coefficient array $r_{pq}$ of $4R=\sum_{j=1}^{274}(s_j-s_{274+j})(s_{2j-1}-s_{2j})$ by adding the four ordered terms per $j$. Define $G_{pq}=4[1\le2p-q\le548]-r_{pq}$. Check every $0\le G_{pq}\le4$. Write $K(s)=\sum G_{pq}s_ps_q$. Enumerating the $T$ actual triples builds independent unordered pair weights $w_{pq}$. Comparing all constant and pair coefficients, using $s_p^2=1$, proves the polynomial identity
$$
      16M=4T-6n+2(S_0^2+S_1^2)+K(s)+4R(s).
$$
Counting the baseline directly gives 15,756, parity sums $2,-2$, and $R(B_1)=0$.

Let $b_p$ be baseline signs and $\delta_p\in\{0,1\}$ flip bits, so $s_p=b_p(1-2\delta_p)$. Define the finite quadratic $Y=(K(s)-K(b))/16$. Its exact expansion is
$$
 Y=\sum_p h_p\delta_p+\tfrac14\sum_{pq}G_{pq}b_pb_q\delta_p\delta_q,\qquad
 8h_p=-\sum_q(G_{pq}+G_{qp})b_pb_q .
$$
Take the arrays of coefficients $a_i,b_i$ and cut-rectangle capacities from the numerical model as *predictions*. To prove the one-body inequality for any grid cell $I$ of $c$ sites and $t$ flips, check the sum of the $t$ cheapest $h_p$ for every $t=0,\ldots,c$. It is at least $n^2(a_it/c+b_i(t/c)^2)$ in every case. The machine checks the ideal sign is constant on each group. For a pair of groups with $t_i,t_j$ flips, put $z=\frac14\sum_{p\in I_i,q\in I_j}G_{qp}\delta_p\delta_q$ and $a=\frac14\sum_{p\in I_i,q\in I_j}G_{qp}$. Then
$$
       \max(0,t_it_j-c_ic_j+a)\le z\le\min(t_it_j,a).
$$
The transposition places the extrapolation centre in the second model coordinate. The bounds follow by adding numbers in $[0,1]$ over the selected pairs and their complement, including when the two groups are the same. Check $a$ against the model's inside capacity and $c_ic_j-a$ against its outside capacity on every ordered pair. With the constant block signs these are precisely the finite inequalities encoded in each inner or slab polynomial, multiplied by $n^2$. Thus $Y$ dominates each polynomial on its stated mass domain. Rebuild their Gram identities and confirm every multiplier sign as in Lemma 3. These are now lower bounds on the finite $Y$.

Choose the nearer colour orientation, so $k=\sum\delta_p\le n/2$. The global polynomial certificate gives $Y\ge k^2/948$. Since $R\ge-k-2$ by counting baseline and new split pairs, $M\le15{,}756$ implies $4k^2/948-k\le6$, or $k\le243$. The four slab bounds exceed $n^2/3792>(243+6)/4$, forcing $k<548/5$. With $Y$ in place of $n^2E$, the box and charge calculations of Section 8 are all finite. For the empty exterior case the same 22-charge enumerator counts 51 red-first optima, all ternary and with unique masks. It verifies the remaining eight exterior cases have strictly positive excess. This supplies a finite proof of $V(548)=15756$ and the count 102 without assuming any continuum result.

The replay is `python3 -B finite548.py`. It proves the model inequalities from all 548 sites, reconstructs the rational polynomials and checks the box certificates and final minimisation. It uses the five candidate multiplier files of October. It shares numerical certificate data with the large-length proof.

A separate calculation uses only the triple weights and Claude's general `cube-psd-1` format. The all-wildcard certificate in `sdp548-root.json` has a diagonal such that its full matrix is positive definite, giving a lower bound of $32263407467/2097152$ before integer rounding. Thus $V(548)\ge15385$ from one cube independently of the October data. Verify it with `python3 -B check_root548.py`.

**Limit of the one-cube method.** The integer lower bound 15,385 is the strongest possible using a single all-free cube of this format. The supplied five-dimensional rational vectors have squared norms at most one. Give each its own additional orthogonal component to bring its norm to one. Their Gram matrix has unit diagonal and rational off-diagonal entries and is positive semidefinite. Its objective, evaluated directly from triples, is $3076878488712142201/200000000000000<15385$. Every valid diagonal dual certificate for the all-free cube bounds this objective from below, since the trace of a product of two positive semidefinite matrices is nonnegative. Hence such a certificate cannot reach the strict threshold for the next integer, 15,386. This concerns the unbranched relaxation. The two exact rational bounds on its value differ by less than one thousandth. The same replay checks the primal vectors in `sdp548-primal.json`.
