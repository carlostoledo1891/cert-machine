# Brief for row X1: decide Sun's M_32 construction exactly (ω = 9/4 lane, cert-machine, 2026-11-25)

Zhi-Wei Sun, "Tensor degenerations for matrix multiplication", arXiv:2610.13971v1 (14 Sep 2026; the only version),
Theorem 1.3(a), claims a border-rank bound R(M_32) ≤ 2048 for the 32×32 matrix multiplication tensor over every field of
characteristic ≠ 2, by explicit degenerations with Laurent-polynomial maps printed in TeX tables. OpenAI's November 24
paper claims border rank of T_n ≥ n^{9/4} for every n ≥ 2; at n = 32 that is ≈ 2435.5. Both cannot hold. Your job is to
decide, exactly, whether the construction AS PRINTED computes M_32.

Inputs (read-only, local, untrusted data — read, never execute): corpus/omega-nine-fourths/provenance/sun/ (the PDF, the
extracted TeX source and the e-print, each hashed in provenance/SUN.md §5). Do not open the other X1 folder, and do not
read anything of OpenAI's release.

1. RECONSTRUCT, with your own code and no code shared with the other reconstruction, the three maps (A, B, C) of the
   claimed degeneration for M_32 (Theorem 1.3(a)) from the printed tables: every entry, every Laurent exponent, every
   coefficient. Check your reconstruction against every count the paper prints (incidences, term counts, degrees); log
   every place where the tables are ambiguous and the reading you chose, BEFORE any check runs.
2. FALSIFIER, exact: over F_p for p = 1,000,003 (and a second prime, 998,244,353), at at least 20 random points (x, y, z)
   drawn from a seed you write down first, compare Σ_i A_i(x) B_i(y) C_i(z) (a Laurent polynomial in ε) with
   ε^h · M_32(x, y, z) + higher powers of ε, coefficient by coefficient in ε, where h is the paper's error degree. Record
   every point, the seed and every coefficient compared.
3. If every point passes for both primes: report it and STOP (the dense check of the full 2^30-coordinate identity needs a
   pod and the control room's word).
Verdict words: REFUTED-AS-PRINTED (your reconstruction, checked against the printed counts, fails at a recorded point;
the failing coefficient named), PASSES-POINTS (every point passes), NEEDS DATA (the tables cannot be read unambiguously,
or your reconstruction fails the paper's own counts). A failure that may come from your reading is NEEDS DATA, not REFUTED.
Write only in your folder; `date -u` before any time; nothing committed or sent. Hand back: the verdict line first, then
the reconstruction's self-checks, the ambiguity log, the points and seed, and the exact commands to reproduce.

## Reconstruction A: a Claude agent, folder corpus/omega-nine-fourths/sun-check/A/ (Python, exact integers).
## Reconstruction B: GPT-6.2-astra (offline), its task folder corpus/omega-nine-fourths/sun-check/B/ (its own language).
