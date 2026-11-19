# The exact minimum at every length from 92,000 onwards

**Theorem.** For every integer n≥92,000, let r be n modulo 1096. Then

    V(n) = (117 n² + c_r)/2192 − n/2.

The 1,096 integers c_r, the number of labeled minimizers and one attaining coloring per residue appear in optimum-residues.json. The least and greatest c_r are −1476 and 3516. The labeled counts range from 2 to 536. Every minimizer, up to color exchange, is obtained by flipping sites among the four nearest sites at each rounded interior edge. The rounded construction alone attains the minimum on 500 residues and can lose by 10 progressions.

For example, V(92,000)=451,727,723 and there are four labeled minimizers. At n=92,284, rounding gives ten extra progressions. One minimizing coloring flips the sites at rounded edges 2,3,4,6,7,11, using the last site of the block on the left at each. The table gives ten labeled minimizers at this length.

In each table row a pair [j,e] specifies site b_j(n)+e, with boundary indices starting at one and b_j(n)=⌊nB_j/548+1/2⌋. The unit edges B_j are 28,34,62,99,158,274,390,449,486,514,520. Start with red and alternate. No reflection quotient is taken.

## 1. A fixed window contains every minimizer

Write f(n)=117n²/2192−n/2, C for the rounded construction, and U=1453/137. Use the exact continuum and lattice bounds of ALLN and the upper bound M(C)≤f(n)+U from ROUNDED. Set k=nμ, where μ is the continuous disagreement with the nearer orientation of the ideal twelve blocks φ*. Write S_e,S_o for the sums of the actual coloring's signs on the even and odd sites. The inequalities before dropping the parity squares give

    4(M−f) ≥ k²/237 − k − 11                                  (all n),
    4(M−f) ≥ k²/237 − k − 45/4 + (S_e²+S_o²)/2.             (all n)

Indeed at even n the split-pair term is at least −k−11. At odd n it is at least −k−23/2, the total-triple term gains 1/4, and the parity term is at least 1/2. For a minimizer, comparison with U forces k<282. The second inequality and k−k²/237≤237/4 give |S_e|,|S_o|≤15 and |S_e+S_o|≤21. All these comparisons are exact in residue_optima.py.

Choose signs so φ* is the closer orientation. Let S be the flipped sites relative to C. Rounding incurs at most 11/2 cells of continuous disagreement, so |S|≤287. With P_e,P_o the parity sums of C, |P_e+P_o|≤11 (balance and rounding), and |P_e−P_o|≤12 (at most twelve runs). Each |P| is therefore at most 11 by integrality. The signed flip sums a=(P_e−S_e)/2 and b=(P_o−S_o)/2 satisfy |a|,|b|≤13 and |a+b|≤16.

For a flipped site p the same-parity part of its marginal equals its old sign times a or b minus one. The two extrapolation tests can each subtract at most the number of flipped sites of the opposite old color. The latter is at most (|S|+|a+b|)/2. Removing a flip from a global minimizer cannot lower M, so its baseline single-site cost satisfies L_C(p)≤1+13+287+16=317.

Put x=p−1/2. Comparing the discrete prefix formula of windows.md with the continuum field h at x/n gives

    L_C(p) ≥ n h(x/n) − 61/4.

Indeed C samples φ* at the center, with ties assigned to the left; at an exact edge h=0. Each of the two prefix differences is an integral over one interval. Replacing rounded signs by the ideal step function changes each integral by at most 11, since their total L¹ discrepancy in site units is at most 11. Rounding the two half arguments changes the signed sum by at most 1/2. The parity sum contributes at most 11 in absolute value, all three errors are multiplied by 1/2, and the diagonal correction adds 3/2. Hence every flipped site has n h(x/n)≤1329/4.

In units of 1/548, 548h(y/548)≥min(2,min_j|y−B_j|) on [0,548]. Both sides are linear between consecutive half-integers; the core checks them at all 1097 nodes. Since 2n/548>333 for n≥92,000, every flipped center lies within 1329/4 of an ideal scaled edge. Relative to its rounded edge the flipped site lies in (b_j(n)−333,b_j(n)+333]. These eleven windows are disjoint.

## 2. The local cost is a common lattice problem

Let K_ij count the extrapolations 2B_i−B_j and 2B_j−B_i strictly inside (0,548). These values are at least 6 away from the endpoints. For sites p,q in the indicated windows, |p−nB_i/548| and |q−nB_j/548| are at most 333.5. The inequality 6n/548>3·333.5 makes the two discrete extrapolation tests constant, equal to K_ij in sum.

Let F be the rounded sign prefix, clamped outside [0,n]. Its value at integers is used below. For old sign s_p the expression 2L_C(p)−3 equals −s_p G(p), where

    G(p) = P_parity(p) + F(2p−1) − F(2p−n−1)
                          + F(⌊(n+p)/2⌋) − F(⌊p/2⌋).

Along either parity in window i the field increments by G(p+2)−G(p)=2H_i s_i, where s_i is the old sign of the left block and H=(2,2,3,2,3,3,3,2,3,2,2). Here is the branch check. For doubled arguments the unrounded reference targets 2B_i and 2B_i−548 have distance at least 6 from every distinct edge. For the half arguments (548+B_i)/2 and B_i/2 the minimum distance is 3. The endpoint displacement of the argument plus the rounding error of an edge is strictly less than the corresponding distance in site units, as verified at n=92,000. Thus away from coincidence, a prefix has throughout the window slope equal to the ideal block sign, or zero outside the domain. The only coincidences occur at B_i=274, simultaneously at 548 and 0. With t=2p−1−n, the difference F(n+t)−F(t)=F(n)−t on this neighborhood, because the first and last blocks have opposite signs. The core adds the two doubled slopes with weight four and the two halved slopes with weight one, with their displayed signs. It obtains exactly 2H_i s_i.

For each of the 22 pairs (i,π) of window and site parity, let u_iπ be the sum of old signs of the selected flips. Write z_i=u_i0+u_i1 and v_i=u_i0−u_i1. The pair identity from windows.md now reads

    4D = 2 Σ_selected (2L_C(p)−3) + 2 zᵀKz + (Σz)² + (Σv)²,

where D=M−M(C). For fixed u the minimizing flips are unique. Select the nearest |u_iπ| sites of that parity on the side with the prescribed old sign. To see this, let p_L be the nearest site on the left of that parity, put c_L=−s_iG(p_L) and λ_iπ=s_i(c_L−H_i). The right-side first cost is 2H_i−c_L, by the increment just proved. On each side the costs increase by 2H_i per outward step. For counts l,r the minimum sequence sum is H_i(l²+r²)+λ_iπ u_iπ, with additional positive cost for skipped sites. Since l²+r²≥(l−r)², cancellations can only raise it. Thus the compact cost is

    4D_compact = uᵀMu + 2λᵀu,
    M_(i,π),(j,τ) = 2K_ij + 2[π=τ] + 2H_i[(i,π)=(j,τ)].

It suffices to minimize over all integral u, checking that every minimizing vector respects the actual per-side capacities.

## 3. Period transfer

Advancing n by T=1096 moves each rounded edge by exactly 2B_i. The sites p_L move with their edge and keep their parity. Every block gains exactly its original unit width in each site parity. Balance gives zero net change in P_e and P_o.

Write Φ for the ideal clamped sign primitive on [0,1]. At any of the four integer prefix arguments t above, let y be its normalized limiting target (twice the edge, twice the edge minus one, or one of the two halved targets). Advancing n by T increases t by exactly Ty. In a fixed block the prefix is a signed linear combination of preceding edge locations and the argument itself. Its increment is therefore TΦ(y), since the rounded edges increase by exactly T times their ideal locations. For a clamped prefix the same formula uses Φ(0) or Φ(1). At coincident targets the argument's offset from the endpoint stays fixed, so the assertion also holds there. Summing with the four displayed signs gives zero: it is 2T times the symmetrized baseline field at an ideal interior edge, which vanishes. Consequently λ, the matrix M, and every charge cost transfer unchanged on each residue class. The baseline excess M(C)−f(n) has period 1096 by ROUNDED.

## 4. Exact minimization

The finite core checks positive definiteness by rational LDLᵀ and verifies the reconstructed matrix entry by entry. It completes the square for each of the 1096 linear terms and enumerates integer coordinates from the last to the first. At a partial assignment the completed squares already set give a lower bound. The core visits both directions from the real center in increasing distance, pruning only when this bound strictly exceeds the best feasible value. It retains every equality and checks one attaining vector by direct substitution into the original quadratic. A common integer denominator makes each search comparison exact.

All minimizing coordinates have absolute value at most one across all residues, so all are feasible, each with a unique compact mask using only offsets −1,0,1,2. Conversely all global minimizers are in the windows from section 1, proving exhaustiveness. The two color orientations have disjoint lists, since each lies within 287 flips of its rounded baseline. The table doubles the charge-vector count. For every residue the core also applies an example mask to the actual bit coloring at a smaller representative and recounts triples directly. Those smaller-length recounts verify the witnesses' counts; the proof of global optimality begins at 92,000.

Run `python3 -B residue_optima.py` from gpt/. The core verifies the SHA-256 of the entire table. Passing `--table FILE` regenerates it. The prior inputs are the reviewed ALLN and ROUNDED bounds; their replays are claude/core_alln.py and gpt/all_length_check.py. The integer 92,000 is a sufficient cutoff. Smaller multiples of 548 have additional exact results in claude/NOTES-alln.md §7.
