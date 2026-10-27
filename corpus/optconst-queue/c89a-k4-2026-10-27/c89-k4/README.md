# C_89 (Ramsey multiplicity constant of K₄): upper bound 0.0301388794

**Result.** The step graphon in `c89_stepgraphon_D20.json.gz` (schema `rational-step-graphon-v1`: 3840 blocks of
equal weight, red-edge probability R_ij / 2²⁰ between blocks i and j) has monochromatic-K₄ density exactly

    27220838459434583306277336063848530765605851167 / 903180180540490237232196590042258640992206848000
    = 0.030138879313256…

so C_89 ≤ 0.0301388794. The previous best was 0.0301388876 (Van Seters–Jothimani 2026, exact value
0.030138887566…), so this improves it by 8.25 × 10⁻⁹.

**Provenance.** The construction is a gradient refinement of the final 3840-block witness of
L. Van Seters and M. Jothimani, *Twelve Clebsch graphs and a new upper bound for the Ramsey multiplicity of K₄*
(github.com/lukevs/k4-ramsey, commit `2cf216b`, `data/constructions/final3840.json.gz`; sha256 in
`results/input_sha256.txt`). Block structure and weights are unchanged. Only the inter-block red probabilities move:
120 projected-gradient steps (`refine.py`) on the 16,045 groups of block pairs that share (class i, class j, original
value), keeping the witness's symmetry. Then everything is rounded to denominator 2²⁰.

**Verification.** `exact_eval.py` computes the exact numerator Σᵢ tr((diag(Rᵢ)R)³) + Σᵢ tr((diag(Bᵢ)B)³),
B = 2²⁰ − R, over **every** block (no symmetry assumed). It works modulo 9 primes below 1.5 × 10⁶, where float64
matrix products are exact because m·p² < 2⁵³, then combines them by CRT, and checks one extra prime. It shares no
code with the search, and on random small step graphons it agrees with brute-force enumeration over all 4-tuples.
`float_eval.py` gives the same value from one representative per class (0.0301388793133).

```bash
python3 exact_eval.py c89_stepgraphon_D20.json.gz
```

Needs numpy; about 10 h on 4 threads (Apple M5 Pro). Output: `results/candidate_exact.txt`.

AI use: search and checker written with Claude Code (Anthropic) under the direction of Jeetu SK.
