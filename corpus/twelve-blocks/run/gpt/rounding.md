# Exact error of the rounded twelve-block construction at every length

For any n≥1 round every interior edge nb/548 to the nearest integer, sending half-integer ties upwards. Denote the resulting coloring by C_n, including empty blocks. Its excess above f(n)=117n²/2192−n/2 has period 1096 and ranges from −369/548 to 1453/137. In particular V(n)≤f(n)+1453/137 at all lengths. The upper endpoint is attained by the construction at n≡220 or 876 modulo 1096.

For integers a,b,c,d on the site-edge scale, let G(x,y)=(2y−x)₊²−(2y−x−n)₊². Four times the area of {(x,y) in (a,b]×(c,d], 0≤2y−x≤n} is G(a,d)−G(b,d)−G(a,c)+G(b,c), by integrating the linear sections. Summing signed areas on the rounded blocks gives the continuum pair term exactly. For even n use the quarter-cell correction in global.md. For odd n=2r+1 the correction is

    4R = s_{r+1}(s_1+s_n) + Σ_{i=1}^r [s_i(s_{2i−1}−s_{2i})
                                      + s_{r+1+i}(s_{2i+1}−s_{2i})].

This follows by summing the same two boundary triangles in each column, including the two end cells. The total number of progressions is floor((n−1)²/4) for either parity. Thus the formula for 4M in global.md applies to odd n as well with this R and this total. Only adjacent pairs with differing signs contribute to the sums, so the computation of R can inspect the rounded boundaries.

Write n=t+1096k, 1≤t≤1096. Each rounded edge increases by exactly 2b in each step k. Its parity is constant, including when it enters an argument divided by two. For k≥1 all rounded blocks are nonempty. Every input to a positive part in G is affine in k. The core verifies its value at k=1 and its slope have a common weak sign. Each site lookup used for R compares an integer argument x to a rounded edge a. The test x≤a is fixed for k≥1 since the core verifies either x−a≤0 and its slope≤0, or x−a>0 and its slope≥0, at k=1. Hence on each residue f and the formula for M are polynomials of degree at most two for k≥1. Equality of the excess at k=1,2,3 proves it is constant, and the exact count at k=0 treats any coincident edges. Taking the extrema over the 1096 residues proves the bounds.

Replay from gpt/ with `python3 -B all_length_check.py`. It also verifies the signed area identity for all 8190 labeled binary strings of lengths 1 through 12 against direct triple counts.
