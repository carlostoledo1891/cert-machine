# New lower bounds for kissing numbers in dimensions 25–31

Supporting data for the paper by **Rustem Takhanov and Stanislav Yun**.

- Paper: [arXiv:2609.21591](https://arxiv.org/abs/2609.21591)
- Repository: [k-nic/Leech_lifting](https://github.com/k-nic/Leech_lifting)

The updated paper includes the dimension 30 construction with 220442 points.

This directory contains coordinate files and saved numerical-search outputs
supporting the constructions reported in the paper.

A kissing configuration in R^d is represented by an N x d NumPy array whose
rows are unit vectors.  The kissing condition is

    x_i^T x_j <= 1/2   for all i != j.

The constructions start from the Leech-lifting configurations used by
PackingStar and modify them as described in the paper.


## 1. Main results

| Dimension | Starting size | Final size | Added points | Modification |
| --- | ---: | ---: | ---: | --- |
| 25 | 197056 | **197058** | 2 | Change the lifting height; add the antipodal poles. |
| 26 | 198550 | **198552** | 2 | Rotate the lifted and auxiliary blocks together; add an antipodal pair. |
| 27 | 200044 | **200046** | 2 | Rotate the lifted and auxiliary blocks together; add an antipodal pair. |
| 28 | 204520 | **204522** | 2 | Rotate the lifted and auxiliary blocks together; add an antipodal pair. |
| 29 | 209496 | **209497** | 1 | Rotate the lifted and auxiliary blocks together; add one point. |
| 30 | 220440 | **220442** | 2 | Transform the six additional coordinates, then rotate the entire lifted block; add an antipodal pair. |
| 31 | 238350 | **238354** | 4 | Rotate only the seven additional coordinates of the lifted vectors; add four points. |

Thus the coordinate files support the bounds

    tau_25 >= 197058,
    tau_26 >= 198552,
    tau_27 >= 200046,
    tau_28 >= 204522,
    tau_29 >= 209497,
    tau_30 >= 220442,
    tau_31 >= 238354.


## 2. Final coordinate files

Each ZIP archive below contains one float64 NumPy .npy array.  Rows are the
points of the corresponding spherical code.

    kissing_r25_197058_float64.zip
        kissing_r25_197058.npy
        shape: (197058, 25)

    kissing26_coord.zip
        kissing26_coord.npy
        shape: (198552, 26)

    kissing27_coord.zip
        kissing27_coord.npy
        shape: (200046, 27)

    kissing28_coord.zip
        kissing28_coord.npy
        shape: (204522, 28)

    kissing29_coord.zip
        kissing29_coord.npy
        shape: (209497, 29)

    kissing30_coord.zip
        kissing30_coord.npy
        shape: (220442, 30)

    kissing_r31_238354.zip
        kissing_r31_238354.npy
        shape: (238354, 31)

The arrays are floating-point approximations to the exact configurations.
For the new dimension 30 array, the maximum observed absolute row-norm error
is approximately 2.22e-15. Exact unit norms and kissing inequalities are
understood through the constructions and error bounds described below.

SHA-256 hashes of the inner .npy files:

    kissing_r25_197058.npy
        f4ac93575c536ff839738034a30d8a91fba2af329da5ead3c7720af076c53a79

    kissing26_coord.npy
        3f00fe093cc5b66f4458fcbe6e90bdb27932e1bc8400bda11db1436cd20c69be

    kissing27_coord.npy
        5cc217a675901681f9d73691d0c68c0b49da653bac4a84927f09b58001e761dd

    kissing28_coord.npy
        a09fb683f51508bc8f165f9af8696e893e2043a536428e2bb99ddcddfc4510c4

    kissing29_coord.npy
        0f0b2f1dc1149b460e8333229453325ce2222217ed1096f9518359864cb60490

    kissing30_coord.npy
        c723713b57bec987e784ad22eff87591057527ccbf6c46239a5d831e81e3b07f

    kissing_r31_238354.npy
        4a49815d0deb2289ad49577daa57890e56fa4109fdbcbaa9b6a1da4f28f933ba


## 3. Saved search runs: run25.tar.gz through run31.tar.gz

The archives run25.tar.gz, ..., run31.tar.gz are saved outputs of the
joint rotation/hole search described in the paper.  In this search the
unlifted bulk B_d is fixed and the block

    M_d = (lifted vectors) union (auxiliary vectors)

is rotated by a common orthogonal matrix Q, while a candidate hole x is
optimized simultaneously.

Typical contents of runXX.tar.gz include:

    runXX/run_info.json
        Dimension, input sizes, source member, hashes, and decomposition of
        the original PackingStar configuration.

    runXX/result.json
        Final status of the run and information about accepted added points.

    runXX/certificate.json
        Numerical/certified bounds for the saved configuration and rotation.

    runXX/base_certificate.json
        Verification information for the rotated base configuration.

    runXX/configuration.npy
        The configuration produced by this particular rigid-block-rotation
        run.

    runXX/Q.npy, runXX/Q.txt
        Saved rotation matrix.

    runXX/x.npy
        Saved candidate hole.

    runXX/added.npy, runXX/added.txt
        Points actually added by that run.  These are empty in runs for which
        the generic rigid-block search produced no certified extension.

    runXX/solution.npz
        Compact saved solution data.

    runXX/joint/
        Optimizer state, progress log, arguments, checkpoint, best rotation,
        and best candidate point.

    runXX/saturation/
        For dimensions where points were added, additional searches attempting
        to find further holes.  Failure to find another point within these
        budgets is not a proof of saturation or global optimality.

The rigid-block runs yield the extensions in dimensions 26, 27, 28, and 29.
Their certified added-point counts are respectively 2, 2, 2, and 1.

The saved generic rigid-block searches in dimensions 25, 30, and 31 did not
find a certified first hole.  This is not a nonexistence result.

The final records in dimensions 25, 30, and 31 use different constructions.
Use their final coordinate archives in Section 2. In particular,
`run30.tar.gz` records the earlier common-block search; the new 220442-point
construction is in `kissing30_coord.zip` and `certificate_D30.zip`.

For d=25, the paper changes the lifting height to h=1/2 and adds +/-e_25.
For d=30, an orthogonal transformation acts on the six additional coordinates
of the lifted vectors, followed by a rotation of the entire lifted block.
For d=31, only the seven additional coordinates of the lifted vectors are
rotated. In both d=30 and d=31, the bulk and auxiliary block remain fixed.


## 4. Dimension 30 certificate data

`certificate_D30.zip` contains:

    certificate_D30/d30_R.npy
        A 6 x 6 orthogonal transformation of the additional coordinates.

    certificate_D30/d30_G.npy
        A 30 x 30 rotation of the entire lifted block.

    certificate_D30/d30_x.npy
        A 30-component vector defining the added antipodal pair +/-x.

    certificate_D30/final30.zip
        final30.npy
        shape: (220442, 30), dtype: float64

The inner `final30.npy` is byte-for-byte identical to `kissing30_coord.npy`
in the root-level `kissing30_coord.zip`; only the filename differs.

### Construction

The original dimension 30 configuration uses 24 disjoint 496-point Leech
subsets S_i. Each corresponding T_i is an equilateral triangle, and both
K_6 and K'_6 are isometric to the normalized E_6 root system. The block sizes
are

    |B_30| = 184656,
    |L_30| = 35712,
    |F_30| = 72.

Keep B_30 and F_30 fixed and set

    L_30(R) = union over i of
              { (sqrt(2/3) s, R t / sqrt(3)) : s in S_i, t in T_i },

    C_30(R,G) = B_30 union F_30 union G L_30(R).

R belongs to O(6); for the supplied certificate its determinant is -1.
G belongs to SO(30). Matrices act on column vectors: apply R to the last six
coordinates first, and then apply G to the entire lifted vector. With
vectors stored as rows, the corresponding multiplications use R.T and G.T.
The original subset-to-triangle associations and coordinate basis are
preserved.

Both x and -x can be added, giving

    B_30 union F_30 union G L_30(R) union {x,-x},

with total size

    184656 + 72 + 35712 + 2 = 220442.

The rows of the supplied full array are ordered as B_30, F_30, G L_30(R),
x, -x. The final two rows are the stored candidate vector and its antipode.

### Exact interpretation and certification

Write R_hat, G_hat, and x_hat for the exact dyadic rational values represented
by the stored binary64 entries. The exact matrices and unit vector are

    R = R_hat (R_hat.T R_hat)^(-1/2),
    G = G_hat (G_hat.T G_hat)^(-1/2),
    x = x_hat / sqrt(x_hat.T x_hat).

These polar-factor and normalization corrections are included in the
certified inner-product bounds. They ensure the exact orthogonality and
unit-norm requirements that floating-point arrays approximate.

The relevant upper bounds are:

| Pair of blocks or points | Certified upper bound |
| --- | ---: |
| Distinct vectors within B_30 union F_30 or within G L_30(R) | 1/2 |
| B_30 and G L_30(R), with underlying Leech product u.T s = 1/2 | 0.499999797 |
| B_30 and G L_30(R), with underlying Leech product u.T s <= 1/4 | 0.463920 |
| F_30 and G L_30(R) | 0.499999901 |
| Either added point and C_30(R,G) | 0.487319117 |
| x and -x | -1 exactly |

Here ||G-I||_2 is approximately 0.259790515. For a bulk vector (u,0) and
a lifted vector l associated with s,

    (u,0).T G l <= sqrt(2/3) u.T s + ||G-I||_2.

Consequently, bulk--lifted pairs with u.T s <= 1/4 satisfy the bound
sqrt(6)/12 + ||G-I||_2 < 1/2. The remaining pairs, with u.T s = 1/2,
are explicitly checked, along with the auxiliary--lifted and new-point
constraints. The unchanged pair classes follow from the exact Leech-lifting
construction and orthogonality. These checks establish

    tau_30 >= 220442.

SHA-256 hashes of the three certificate arrays:

    d30_R.npy
        88dd1ed30ab1fee42dda3b695472c75623d0a7702fb0ddff8ef0ff97d342f577

    d30_G.npy
        fb0c4d70ea19d9546482a5dc33932792c251a4060acfba111c8c50818d772518

    d30_x.npy
        8d1f12e86391c3b4dc4badb729549a0045a3fcd0dcc8fc16fb84073a06a24437


## 5. Dimension 31 certificate data

    certificate_D31.zip

contains:

    certificate_D31/kissing_r31_238354.zip
        The full 238354 x 31 float64 coordinate array.  This is identical to
        the root-level kissing_r31_238354.zip.

    certificate_D31/rotation_matrix_R.txt
        The 7 x 7 rotation R applied to the additional coordinates of all
        lifted vectors.

    certificate_D31/u1_and_u2_vectors.txt
        Two unit vectors u_1,u_2 in R^24 used to define the four added points.

The d=31 construction is the one described in the paper as follows.  The
126 auxiliary directions form a normalized E_7 root configuration.  For two
antipodal deepest-hole directions

    v_1 = -(1/sqrt(3), 0, 0, 0, 0, 0, sqrt(2/3)),
    v_2 = -v_1,

the four added points are

    z_j^+ = ( +(1/2) u_j, (sqrt(3)/2) v_j ),
    z_j^- = ( -(1/2) u_j, (sqrt(3)/2) v_j ),     j=1,2.

The final configuration is

    B_31 union L_31(R) union F_31 union
    {z_1^+, z_1^-, z_2^+, z_2^-},

with block sizes

    |B_31| = 175728,
    |L_31| = 62496,
    |F_31| = 126,

and total size 238354.

The paper gives rigorous upper bounds for all changed classes of inner
products, including

    m(L_31(R), F_31) <= 0.499868403188,
    m(L_31(R), Z)    <= 0.499383903054,

while the remaining relevant classes are bounded by 1/2 (or, for the
cross-pairs between the two hole families, by -1/2).

The text files in certificate_D31.zip are compact numerical data defining
this construction.  The rigorous certification in the paper interprets the
stored decimal rotation through its orthogonal polar factor and accounts for
normalization and numerical representation by outward-rounded bounds.


## 6. Dimension 25 special construction

The d=25 record in

    kissing_r25_197058_float64.zip

does not come from the generic run25 rigid-block rotation search.

Let S_1 be the 496-point Leech subset used by the starting construction.
The lifted vectors are moved to height h=1/2:

    l_epsilon(u) = ( (sqrt(3)/2) u, epsilon/2 ),
    epsilon in {-1,+1}.

At this height the two poles +/-e_25 can be added.  The resulting size is

    (196560 - 496) + 2*496 + 2 = 197058.


## 7. Loading a coordinate file

Example:

    import numpy as np

    X = np.load("kissing30_coord.npy", allow_pickle=False)
    print(X.shape)                       # (220442, 30)
    print(np.max(np.abs(
        np.linalg.norm(X, axis=1) - 1
    )))

Extract the relevant ZIP archive first. For another dimension, replace the
filename accordingly. To load dimension 30 directly from its ZIP archive:

```python
import io
import zipfile
import numpy as np

with zipfile.ZipFile("kissing30_coord.zip") as archive:
    X = np.load(io.BytesIO(archive.read("kissing30_coord.npy")),
                allow_pickle=False)
print(X.shape)  # (220442, 30)
```

A direct full Gram matrix is unnecessary and can require substantial memory.
For numerical checking, process row blocks and exclude the diagonal when
computing the maximum off-diagonal inner product.


## 8. Interpretation of numerical files

The .npy files are convenient floating-point coordinate realizations.
They should not be confused with an exact symbolic representation.

The proofs in the paper use the algebraic structure of Leech lifting together
with explicit error bounds for the numerically changed parts.  In particular,
the numerical search output alone is not intended as a proof of global
optimality. The unsuccessful earlier common-block searches in dimensions
25, 30, and 31 do not establish nonexistence of extensions; the separate
constructions described above improve all three dimensions.

The results claimed here are lower bounds obtained from explicit kissing
configurations.


## 9. Provenance

The starting configurations in dimensions 25 through 31 are the
Leech-lifting configurations produced by PackingStar.  The saved run metadata
records the source member names and SHA-256 hashes used in the computations.

The present repository contains the derived coordinate files, rotations,
candidate points, certificates, and saved optimizer output needed to document
the computations reported in the paper.


## 10. Citation

If you use these files, please cite the accompanying paper:

    Rustem Takhanov and Stanislav Yun,
    "New lower bounds for kissing numbers in dimensions 25-31",
    arXiv:2609.21591, 2026.

Use the updated version including dimension 30:
https://arxiv.org/abs/2609.21591v2

```bibtex
@misc{TakhanovYun2026LeechLifting,
  title         = {New lower bounds for kissing numbers in dimensions 25--31},
  author        = {Rustem Takhanov and Stanislav Yun},
  year          = {2026},
  eprint        = {2609.21591},
  archivePrefix = {arXiv},
  primaryClass  = {cs.IT},
  url           = {https://arxiv.org/abs/2609.21591}
}
```

Please also cite the previous records in dimensions 25-31, as referenced in the paper.
