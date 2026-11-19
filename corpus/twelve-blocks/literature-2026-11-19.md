# Literature check, 2026-11-19: exact and second-order results for V(n)

Done by a research agent of the control room (web only; about 17 searches and 16 page reads, plus the arXiv listing API
and the citing-paper lists of the two main papers). Quotes marked "read" were read from the PDF or HTML; "relayed" came
through a summarising fetch tool and are paraphrase-grade.

## Gaps first

1. **The leading constant itself is not a published theorem.** erdosproblems.com/1186 (read, last edited 2026-04-08):
   Parrilo, Robertson and Saracino "have proved 0.0511 ≈ 1675/32768 ≤ δ₃ ≤ 117/2192 ≈ 0.0533, and conjectured the upper
   bound is correct." The database has 1186 as open. The page lists one proof claim: this repository's own
   (2026-10-05, carlostoledo.co/reports/delta3.html, doi:10.5281/zenodo.23171167), unrefereed. Dong, Mani, Pham and
   Tidor (2024) say the value "is still not known, even asymptotically" (relayed). formal-conjectures tags
   `prs_conjecture : δ 3 = 117 / 2192` as research open (read). Every statement of this target contains that lower bound,
   so any priority wording has to say it.
2. Not opened: Schoen 1999 (403), Datskovsky 2003, Cameron–Cilleruelo–Serra 2007; what is said of them is second-hand.
3. Not searched: MathSciNet, zbMATH, Google Scholar, theses, Landman–Robertson's book.

## Verdicts

- **(a) Exact optimality at n = 548m with the minimisers classified: NOT FOUND.** No exact V(n) beyond n = 45 and no
  exact extremal statement for infinitely many n was found.
- **(b) V(n) = 117n²/2192 − n/2 + O(1) with explicit constants: PARTLY KNOWN.** Known: the upper bound to O(n) with an
  unspecified constant (Butler–Costello–Graham 2010; Butler–Graham–Lu Theorem 4). Conjectured in print: the matching
  lower bound as 117/2192 n² + O(n) (Butler–Graham–Lu, Conjecture 5). Not found: the coefficient −1/2, an O(1) error, any
  explicit constant, any proved lower bound at this precision (the best published is still 1675/32768 n²(1 + o(1))).
- **(c) A periodic exact formula for large n, c_r depending on n mod 1096: NOT FOUND.** No periodicity statement for V(n)
  anywhere.

## Precedents that must be cited (same shape, neighbouring problems)

- Koutschan, Wong, "Exact Lower Bounds for Monochromatic Schur Triples and Generalizations", arXiv:1904.01925, Springer
  2020 (read): for Schur triples the minimum over 2-colourings of [n] is ⌊(n² − 4n + 6)/11⌋ for all n. An exact finite
  formula of the kind claimed here, for a different equation.
- Schoen, Europ. J. Combin. 20 (1999) 855–866: per Koutschan–Wong, the similar result "only for the case n = 22k"
  (second-hand).
- Sjöland, arXiv:1408.1058 (2014, relayed): 3-term progressions in ℤ_n, exact for many residues, with constants depending
  on n mod 24. The closest structural precedent for a residue-periodic correction.
- Robertson, Zeilberger, EJC 5 (1998) R19: N²/22 + O(N) Schur triples, Graham's other $100 problem.

## Works on V(n) itself

| Work | What it states | Overlap |
|---|---|---|
| Parrilo, Robertson, Saracino, JCTA 115 (2008) 185–192, arXiv:math/0609532 (read) | 1675/32768 n²(1+o(1)) ≤ V(n) ≤ 117/2192 n²(1+o(1)); the colouring "locally optimal"; "not enough to prove global optimality" | none: leading order only |
| Butler, Costello, Graham, Experimental Mathematics 19(4) (2010) (read) | block colourings give (117/2192)n² + O(n); local search on [10000] found the twelve blocks; "we believe that the correct value … is (117/2192)n² + O(n)"; no pattern with 11 or fewer blocks beats it | (b) in part |
| Butler, Graham, Lu, arXiv:1209.2687 (2012) (relayed) | Conjecture 5: every 2-colouring of [n] has at least 117/2192 n² + O(n) | (b) in part, as a conjecture |
| Greenwood, Kariv, Williams, arXiv:2301.00336 (2023) (relayed) | optimal, and unique, among antisymmetric colourings with at most 12 blocks; discrete-to-continuous error O(n/N) | uniqueness in a restricted class only |
| Dong, Mani, Pham, Tidor, arXiv:2410.13758 (2024) (relayed) | the constant "still not known, even asymptotically" | none |
| De Loera, Ventura, Wang, Wesley, arXiv:2410.21651, Discrete Applied Mathematics 2025 (read) | integer-programming optima for x + y = 2z at n = 15, 20, 26, 30 | none: inside the OEIS range |
| OEIS A121385, A121386 (relayed) | V(n) exactly for n ≤ 45 (the last by R. Pratt, 2014); the number of minimisers for n ≤ 34 | the computational record |
| Sjöland, arXiv:1408.1088 (2014) (relayed) | numerical evidence that the lower bound "can be improved to 0.052341…" (unpublished, with O. Kivinen) | none |
| Yang, Mao, arXiv:2604.02115 (2026) (read) | resolves the "beats random" conjecture for constellations; nothing on 117/2192 | none |
| Georgiev, Gómez-Serrano, Tao, Wagner, arXiv:2511.02864 (AlphaEvolve) (text searched) | no occurrence of this problem | none |

Came back empty: any exact V(n) for n > 45; any SAT or MaxSAT computation; any flag-algebra paper for 3-term progressions
in [n]; any stability theorem; any 2024–2026 paper improving either bound; any AI-lab result on this problem. On the
problem's page a user "DaPoWi" is marked as working on it.
