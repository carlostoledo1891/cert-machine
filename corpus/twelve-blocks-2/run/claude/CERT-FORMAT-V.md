# Certificate format `cube-psd-1` for a lower bound V(n) ≥ v

Kind of thing: a FORMAT, written before any certificate in it is relied on. A checker can be written from this
page alone. It needs integers only (or fractions), no floating point, no search, no table of earlier V(k).

## The file

JSON, one object:

    { "format": "cube-psd-1", "n": 46, "v": 90, "D": 1048576,
      "leaves": [ { "cube": "..R....B.....", "u": [U_0, U_1, ..., U_m] }, ... ] }

- `n`, `v`: the claim is: every colouring of 1..n has at least v monochromatic triples (a, a+d, a+2d), d ≥ 1.
- `D`: a positive integer (a common denominator).
- `cube`: a string of n letters over `R`, `B`, `.`; letter number p (1-based) is site p. `R` or `B` fixes the
  colour of that site; `.` leaves it free. The cube is the set of all colourings that agree with the fixed letters.
- `u`: a list of m+1 integers, m = the number of `.` in the cube. U_0 belongs to "the fixed part"; U_k (k = 1..m)
  belongs to the k-th free site in increasing order of site.

## What the checker verifies

**(C1) The cubes cover all 2ⁿ colourings.** Any exact method. In my files the cubes are pairwise disjoint (two
cubes are disjoint when some site is fixed R in one and B in the other), so it is enough to check pairwise
disjointness and Σ over leaves of 2^m = 2ⁿ. No colour-exchange symmetry is used: both orientations are listed.

**(C2) Each leaf.** For sites i < j of 1..n let

    w(i,j) = [j − i is even] + [2j − i ≤ n] + [2i − j ≥ 1]

(the number of triples inside 1..n that contain both i and j: the third site between them, beyond j, before i).
Let T = Σ_{d ≥ 1} max(0, n − 2d) (the number of triples; it equals ⌊(n−1)²/4⌋). Write F for the fixed sites of the
cube, f_i = +1 if site i is `R`, −1 if `B`; and j_1 < … < j_m for the free sites. Compute the integers

    c0  = Σ_{i < i', both in F} w(i,i') f_i f_i'
    b_k = Σ_{i in F} w(i, j_k) f_i                          (k = 1..m)

and the symmetric integer matrix A of size (m+1) × (m+1), indices 0..m:

    A[0][0] = U_0,   A[k][k] = U_k,   A[0][k] = A[k][0] = D·b_k,   A[k][l] = D·w(j_k, j_l)   (1 ≤ k ≠ l ≤ m).

Check, exactly:

    (a) A is positive semidefinite;
    (b) 2·D·(T + c0) − (U_0 + U_1 + … + U_m)  >  8·D·(v − 1).

For (a) any exact method will do. In my files A is positive definite, so plain symmetric elimination in fractions
(LDLᵀ without pivoting) with every pivot > 0 suffices; a checker that meets a pivot ≤ 0 should refuse the file.

## Why (C1) + (C2) prove V(n) ≥ v

Write x_p = +1 for red, −1 for blue. A triple (a,b,c) is monochromatic exactly when (1 + x_a x_b + x_b x_c + x_a x_c)/4
= 1, and this expression is 0 otherwise. Summing over triples, 4M(x) = T + Σ_{i<j} w(i,j) x_i x_j. For x in the cube,
split the pairs into fixed-fixed, fixed-free, free-free:

    4M(x) = T + c0 + Σ_k b_k x_{j_k} + Σ_{k<l} w(j_k, j_l) x_{j_k} x_{j_l}.

With z = (1, x_{j_1}, …, x_{j_m}), every z_k² = 1, so zᵀAz = ΣU + 2D(Σ_k b_k x_{j_k} + Σ_{k<l} w x x). By (a) zᵀAz ≥ 0:

    4M(x) ≥ T + c0 − ΣU/(2D),   and by (b) this is > 4(v − 1).

M(x) is an integer, so M(x) ≥ v. By (C1) every colouring is in some cube. ∎

## What the certificate does not use

No value V(k) for k < n, no symmetry, no search by the checker. The matching upper bound V(n) ≤ v is a separate
object (a colouring with exactly v monochromatic triples), given beside each certificate in the control room's
colouring format.

## Addendum (format `cube-psd-1` with `within`): a lower bound on a sub-cube

Added after c3/c4 were decided; nothing above changes. A file may carry one more field,

    "within": "RRRR..BB....RRR…"      (a cube string of n letters, as above)

and then the claim is weaker: **every colouring of 1..n that lies in the cube `within` has at least v monochromatic
triples.** The checker changes only (C1):

**(C1′)** every leaf cube is contained in `within` (wherever `within` has R or B, the leaf has the same letter), the leaf
cubes are pairwise disjoint, and Σ over leaves of 2^(free letters of the leaf) = 2^(free letters of `within`).

(C2) is unchanged, leaf by leaf, and so is the argument: (C2) proves M ≥ v on each leaf, (C1′) says the leaves fill
`within`. Without the field, `within` is the all-free cube and (C1′) is (C1).

Use here: `within` = the twelve blocks B_m on 1..548m with the sites of the eleven windows (b·m − R, b·m + R] left free.
The statement certified is then "no colouring that agrees with B_m outside those windows has fewer than M(B_m)", a
finite, unconditional piece of the localisation theorems (it uses nothing of the October result).

## Addendum 2: `exceptions` (for counting minimisers)

A file with `within` may also carry

    "exceptions": ["RRB…", …]        (complete colourings: n letters over R, B, no dot)

and then the claim is: **every colouring in the cube `within`, other than the listed ones, has at least v monochromatic
triples.** (C2) is unchanged. (C1″): every leaf and every exception lies inside `within`; the leaves are pairwise
disjoint; the exceptions are distinct and none lies in a leaf; Σ over leaves of 2^(free letters) + (number of
exceptions) = 2^(free letters of `within`). The counts of the exceptions are a separate matter (plain triple counts).

Use here: v = 15,757 on the UNITFINAL cube with 51 exceptions, each of count 15,756: exactly 51 colourings of that cube
attain 15,756.
