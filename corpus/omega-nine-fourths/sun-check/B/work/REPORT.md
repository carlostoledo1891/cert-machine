NEEDS DATA

The literal scalar table on page 21 and its stated normalization give different coefficients for 50 retained supports in Theorem 1.3(a). The discrepancy survives reduction at both requested primes. It occurs before there are 2,048 source products in physical matrix coordinates. The full Laurent identity for $M_{32}$ remains undecided.

## Reconstruction self-checks

The PDF, TeX, e-print, and source metadata match the four SHA-256 digests in SUN.md §5. The e-print contains P102Final.tex and 00README.json. Both archived members are byte-identical to the extracted copies. Source locations below are line numbers of that TeX. The rendered scalar table on PDF page 21 agrees with lines 1556–1580.

**First inconsistent coefficient.** Packet 1 in the full table (1510) retains A1, B1, and C1. For satellite 1 the table sets $(x_1,y_1,z_1)=(1,1,1)$, and $y_0=1$. Definition 2.4 (715–731) defines B1 as $x_1y_0z_1$. Its literal product is 1. The sentence after the table and the definition of the Walsh sum $F$ assign the same retained term $1/128$. The two readings already differ at the origin of the dense chart, where every phase is +1. The literal sum is $50+78/128=3239/64$. Equation (5.1) gives 1.

| Local coefficient | Over the rationals | Modulo 1,000,003 | Modulo 998,244,353 |
|---|---:|---:|---:|
| Packet 1, B1, displayed factors | 1 | 1 | 1 |
| Packet 1, B1, stated weight | 1/128 | 164063 | 990445569 |
| Dense chart origin, displayed factors | 3239/64 | 796928 | 389939251 |
| Dense chart origin, Eq. (5.1) RHS | 1 | 1 | 1 |

| Self-check | Exact result |
|---|---|
| Packet addresses and masks, 1480–1555 | All 32 addresses agree with the state and character formulas and all 32 masks agree with the layer rule. There are 22 CW3 and 10 CW2 packets. |
| Support counts, 1556–1580 and Appendix B.2 | 354 possible products, from $22·12+10·9$. The masks retain 128 and omit 226. All 354 zero/nonzero decisions agree. Appendix B.2 labels 354 as retained. |
| Weights of the 128 retained products | 78 have the stated weight. All 50 discrepancies have literal weight 1, distributed over 16 B1, 14 B2 and 20 C1 occurrences. |
| Walsh masks, 1582–1645 | All 12 side-colour twist sums and all eight buckets per character agree. At the stated uniform weight, Eq. (5.1) holds at 256/256 chart points and 4,096/4,096 common twists of those points. With the literal source factors, it holds at 128/256 and 2,048/4,096 respectively. All 128 defects have two chart representatives. The zero representatives are (0,0) and (3,15). |
| Source partition and cost, 1651–1676, 1961–1974 | All 32 packet labels occur once. Seven punctures replace three CW3 and four CW2. The compressed row has 14 CW3, 6 CW2, 7 corner tensors and 5 diagonal tensors of size four. The costs are 128 per row and 2,048 across 16 rows. Restoring the five active blocks costs 133 per row. |
| Rank-one source formulas, 745–769, 839–857, 938–960 | Four products for CW2 and five for CW3. Each expansion starts at degree 2, equals the full CW tensor there, and ends at degree 6. The two-product corner expansion starts with its three monomials at degree 1 and ends at degree 3. |
| Seven tangent pairs, 1678–1705 | The printed corner substitution supplies exactly seven of eight arrow monomials. The missing term is $X_1Y_1Z_0$. The stated allocation of three endpoints per companion gives (6,6,9) across two X, two Y and three Z pairs. This count uses the companion description. |
| Four exceptional pairs, 1736–1793 and 4388–4478 | 18+21+18+21=78 raw CW supports. Direct contraction gives $E_L K E_R^T=I_r$ at ranks 3,4,3,4. Grouping dense colours by the printed side-colour twists before row transport gives clean dimensions (7,6), (8,7), (7,6), (8,7) and all three zero pairings in each block. The all-ones dense specialization also gives zero for all three pairings. |
| Five-empty module, 1796–1875 | Expanded all 60 CW supports. All negative powers cancel. Degree zero has 54 distinct monomials with coefficient one, giving (16,15,22) endpoints and one cubic. Degrees 3 and 6 have 62 and 8 nonzero monomials respectively. The four stated matrix pairings and all 15 last-five-column zero sums hold. |
| Five active replacements, 1895–1974 | The four printed products expand to the canonical tensor at degree 0 and the single residual $t x_2y_2z_1$. Flattening ranks are (4,4,3), and the displayed slice change has determinant −1 for $M_0+M_2$. The effective-basis lift is recorded with the local maps. Two X and three Y orientations supply the five active slots. |
| Endpoint allocation, 1878–1889 and 4205–4226 | In each of X, Y and Z the printed intervals partition 1 through 31. The four modules' endpoint profiles sum to (31,31,31), with one cubic. |
| Defect and physical incidence, 1263–1473 | Enumerating all $64^3$ label triples gives 128 fibres of size 2,048. The zero fibre contains 1,954 all-nonzero triples, 31 in each one-bar sector, and one cubic. Applying the printed three edge formulas to all 16 translates produces 32,768 directed matrix cycles, each exactly once. |
| Row and Weyl formulas, 2006–2050 | Each of the seven nonempty row-map sums has rank four. The Walsh selector, phase identity, Weyl products, Gram pairings, and diagonal projectors agree with their displayed right-hand sides. The empty sum for the all-barred sector has rank zero and the selector then reduces to the condition that sigma vanish. |

The orbit enumeration establishes the physical incidence conditional on the claimed fixed-row tensor. The cost calculation accounts for the 2,048 source directions. Connecting the two requires the three source-to-edge maps. The recorded discrepancy occurs in their dense-chart normalization.

Machine-readable results are in `checks.json`. The 32 packet rows, their three scalar restrictions, and all 354 products are in `packets.json`. The 256 chart records in `charts.json` include every common twist and both weight readings. Chart weights in that file are multiplied by 128 for exact integer storage. The source families, active lift, five-empty maps, tangent corner map and generic exceptional matrices are in `local-maps.json`. These maps take values in the local bases identified in the file.

## Ambiguity log

`PREREG.txt` contains the full reading decisions and seed recorded before the first algebraic check. Its digest and UTC record are in `prereg-record.txt`.

1. The full packet table and Appendix B.2 admit different readings of “retained”. Both the total number of tested products and the number selected by the masks are recorded. For the scalar conflict, the two literal readings were carried separately through the common chart.
2. The local comparison uses the binary bases, directed edge orientation, common-twist convention, inclusive endpoint intervals and colour orders recorded in the preregistration. The exceptional pairings above concern the local colour space. No higher-dimensional chart transport is needed for those pairings.
3. For the seven tangent companions, lines 1696–1701 describe the missing corner term, barred centre and satellite degrees. They do not tabulate a full substitution in physical edge coordinates. Section 8 (1991–2050) specifies relations on joint character and defect labels, along with row and Weyl operators. I could not recover from those relations a coefficient for each source colour at each physical edge. For example, the edge relabeling defines $X_{h,(q,e,a)}$ once the label is supplied. A source evaluator also needs the weights with which a fixed packet colour contributes to those labels. The separately tabulated physical cycles already assume the desired leading tensor.
4. The local top maps designate degree zero. Definition 2.2 allows a monomial shift. The stated $u^{44}$ coefficient and degree-132 schedule on lines 3533–3561 belong to the 1024 construction, which has a different source. A specific choice of a common parameter and shifts would fix the requested global order once consistent maps were supplied.

To finish the source test requires consistent retained-support weights and the three sidewise rules that take each source direction to physical edge variables, including their Laurent parameter convention. A factored formula specifying those columns would suffice.

## Points and seed

The ASCII seed was `X1-Sun-M32-B-v1`. The sampling protocol in `PREREG.txt` uses a separate SHA-256 counter stream for each prime and point index and rejection sampling for each field coordinate. `points.jsonl` stores all 40 triples of matrices and their exact $M_{32}(x,y,z)$ values, 20 per field. Each matrix is a row-major array of 1,024 residues. An independent contraction in `verify-records.rb` checks every saved trace.

**Full source evaluations and global Laurent coefficient comparisons both total zero.** Each point has `source_evaluation` equal to `null` and an empty `coefficients_compared` array. There is no failing global coefficient to name.

## Exact reproduction

Run from the existing B workspace with system Ruby 2.6.10, its standard library, and the local tar and shasum utilities.

```sh
cd ~/Projects/cert-machine/corpus/omega-nine-fourths/sun-check/B/work
date -u
ruby audit.rb
ruby verify-records.rb
shasum -a 256 -c SHA256SUMS
```

The audit verifies the input hashes before parsing, reads both e-print members as data through standard output, and writes the result files into this directory. The last command compares them with the original run.
