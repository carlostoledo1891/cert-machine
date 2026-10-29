# Ramsey multiplicity constant of K₅: upper bound 0.0016870052

**Result.** The step graphon `c89b_stepgraphon_m192_D20.json.gz` (schema `rational-step-graphon-v1`: 192 blocks of
equal weight, red-edge probability R_ij / 2²⁰ between blocks i and j, R_ii inside block i) has monochromatic-K₅
density exactly

    107218716425177032911811117405568916263805081691166740697 / 63555655070790142733837367909977622463036348875198349443072
    = 0.0016870051344094…

so c₅ ≤ 0.0016870052. The previous best is c₅ ≤ 2320651·2⁻²⁴·3⁻⁴ = 0.0017076738… (Parczyk, Pokutta, Spiegel and
Szabó, FoCM 2024, Theorem 1.2), from the blow-ups of a 192-vertex Cayley graph. This improves it by 2.07 × 10⁻⁵.

**Provenance.** The starting point is that 192-vertex graph (`c5.graph6.txt` from Zenodo 10.5281/zenodo.6602512,
CC-BY-4.0; sha256 in `results/input_sha256.txt`), read as a 0/1 step graphon: red between blocks i ≠ j iff ij is an
edge, blue inside blocks. `k5.py refine` then runs projected gradient descent on all 18,528 symmetric entries
(inside-block densities included) until the line search stalls (103 steps). The result is rounded to multiples of
2⁻²⁰.

**Verification.** `exact5.py` computes the integer numerator N(R) + N(2²⁰ − R), with
N(R) = Σ_{i,j} R_ij tr((diag(R_i ∘ R_j) R)³), over every pair of blocks (no symmetry assumed). It works modulo 11
primes p with 192 p² < 2⁵³ (float64 matrix products are then exact), combines them by CRT, and checks one extra
prime. It reproduces the PPSS value 2320651/1358954496 exactly from their graph, and on random small step graphons
it agrees with brute force over all 5-tuples. It shares no code with `k5.py`.

```bash
python3 exact5.py c89b_stepgraphon_m192_D20.json.gz
```

Needs numpy; a few minutes. Output: `results/exact.txt`.

AI use: search and checker written with Claude Code (Anthropic) under the direction of Jeetu SK.
