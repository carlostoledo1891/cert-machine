# Exact optimality from even scale 128 and odd scale 131

For n=548m, every even m≥128 and every odd m≥131 satisfies

    V(n)=117 n²/2192−n/2+(m mod 2).

There are exactly two labeled minimizers at these even scales and 102 at these odd scales. Their complete description is in windows.md. This sharpens the sufficient cutoffs in global.md, using the other track's refined marginal estimate (chat c7) and the last-flip argument below.

Choose the closer orientation of B_m as in global.md. For a global minimizer write k for the number of flipped sites and a,b for the old sign sums on the flipped even and odd sites. Put o=m mod 2. Before replacing the two parity squares by a square of the total, the continuum bound and the exact lattice identity in global.md give

    k²/256 + 2(a−o)² + 2(b+o)² ≤ k+6o.

The new parity sums are 2o−2a and −2o−2b. The split-pair correction is at least −k−2o and the baseline parity contribution is 4o. These are the only estimates involved.

For a flipped site p the same-parity contribution to its removal marginal is exactly s_p times its parity charge minus 1. The two extrapolation tests can subtract at most 2 per flipped site of the opposite old color. There are at most (k+|a+b|)/2 such sites. Consequently the marginal is at least

    L(p) − (1 + max(|a|,|b|) + k + |a+b|).

The maximum of the parenthesis over integers satisfying the previous inequality, |a|+|b|≤k and k≡a+b modulo 2, is 257 for even m and 263 for odd m. To check exhaustively, the inequality implies k≤262. Also k−k²/256≤64, hence |a−o| and |b+o| are strictly less than 6. The standalone sharper_cutoffs.py checks this small box using integers.

At every site outside the eleven windows, global.md proves L(p)≥2m+2−o. This is at least 257 from even scale 128 and at least 263 from odd scale 131. Undoing any outside flip therefore cannot increase M. Starting from a global minimizer, every such deletion must give another minimizer, until there are no outside flips. The closer orientation is preserved as k decreases.

The final window mask has minimum change zero and at most seven flipped sites, by the classified 51 odd masks and the unique even mask. If an outside flip was deleted, immediately before the last deletion its other flipped sites numbered at most seven. Its marginal was then at least 2m+2−o−3·7>0. This would strictly lower the global minimum, a contradiction. Thus all original global minimizers were already in the windows. This last step includes the borderline odd scale m=131, where the first marginal estimate allows equality.

Replay from gpt/ with `python3 -B global_core.py` followed by `python3 -B sharper_cutoffs.py`. The first script checks all continuum and window inputs and the second checks the stronger pruning constants. Global optimality at smaller scales and the least sufficient cutoffs remain open here.
