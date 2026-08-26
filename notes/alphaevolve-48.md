# AlphaEvolve's rank-48 <4,4,4> — canonical bytes located and pinned

Status: source acquired and pinned (2026-08-26); the strassen-audit
extension is NOT yet built (needs a Gaussian-rational ring mode).

## The canonical source (the only first-party byte source)

Commit-pinned raw URL (the notebook has been rewritten 7 times since May
2025, so `main` is mutable — pin by commit):

    https://raw.githubusercontent.com/google-deepmind/alphaevolve_results/4226acbf237ff9ad10ba7673a2af127a2d8a5971/mathematical_results.ipynb

- pinned locally at corpus/sources/alphaevolve_mathematical_results.ipynb
- sha256 2cce2543e48c89aa3e91614272a698a0147dd2548ea11cf92f1292b7435d38ff
  (verified locally; identical bytes at `main` and the pinned commit as of
  the fetch)
- format: Jupyter ipynb JSON, 1,311,048 bytes, 128 cells. Cell 35 (markdown)
  reads "Rank-48 decomposition of <4,4,4> over 0.5*C"; cell 36 (code) holds
  `decomposition_444 = (np.array(...))` — three 16×48 complex64 factor
  matrices; cell 37 verifies with rank = 48. Robust extraction: locate the
  code cell whose source contains `decomposition_444 = (`.
- arXiv 2506.13131 (the AlphaEvolve paper) carries NO ancillary files — it
  is the citation, not the byte source. No HuggingFace mirror exists.

## The ring (decides the instrument work)

Every entry lies in ½·Z[i] with re, im ∈ {−½, 0, +½} (the doubled
coefficient set is exactly {0, ±1, ±i, ±1±i}; ±0.5 is exact in float32, so
byte-level parse → exact rationals is lossless). Clearing denominators:
2u, 2v, 2w over Z[i] and the claim is Σᵣ (2uᵣ)⊗(2vᵣ)⊗(2wᵣ) = 8·T<4,4,4>.
Session research pass already re-checked that identity exactly in Gaussian
integers (zero mismatches, standard Strassen-tensor convention, w indexing
Cᵀ) — informal confirmation only; the ENGINE's certification over a Z[i]
ring mode in instruments/strassen/tensor.js is the pending build, with the
usual perturbed-coefficient red control.

## Related but distinct

arXiv 2506.13242 derives a rank-48 <4,4,4> scheme over NON-complex
coefficients from AlphaEvolve's — a second corpus row later, not the
DeepMind artifact.
