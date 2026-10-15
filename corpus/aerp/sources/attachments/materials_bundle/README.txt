Materials for the GitHub note on AlphaEvolve Problem 42 (sum-difference constant).

1_WRITEUP.md            - full write-up: constructions, ceiling theorem,
                          dichotomy partial results, verification summary.
2_REVIEW_PACKET.md      - self-contained referee packet: precise claim
                          statements plus the exact data (all 43 gadgets)
                          needed to check them.
3_CERTIFICATE.py        - self-checking script (python 3 + numpy, runs in a
                          second): builds an explicit set of ~100k integers and
                          prints exact |A|, |A+A|, |A-A| certifying g > 1.163.
4_STRONG_conjecture_counterexample.txt
                        - explicit set of 23,646 integers with
                          |A+A| + |A| > |A-A| + diam(A) + 1 (excess 89),
                          counted by four independent methods; format noted in
                          the file header.
5_gadget_family_and_certificate.json
                        - the 43 pairwise-coprime residue gadgets (moduli and
                          sets) and the certified bridge parameters.

Produced with heavy AI assistance; no human mathematician has reviewed it.
Corrections welcome.
