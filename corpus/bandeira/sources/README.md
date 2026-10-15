# Disproving Bandeira's Matrix AM--GM Open Problem 0.2(a)

This repository packages the exact rational certificate, Lean 4 formalization,
manuscripts, and provenance artifacts for the disproof of **Bandeira's Open
Problem 0.2(a)** on the matrix arithmetic--geometric mean inequality in spectral
norm.

## What is established

The project proves the following chain.

1. Bandeira's Open Problem 0.2(a) is reduced to the relevant square case of
   the Recht--Ré noncommutative arithmetic--geometric mean conjecture.
2. The Lai--Lim obstruction at `(m,n)=(5,5)` is certified by an exact rational
   Farkas certificate.  The certificate has
   `y0 = -146/2061`, scalar value `1417280/1417281 > 0`, scalar block entry
   `m00 = -1060/20438937 < 0`, no cross-block support, and six independent
   `31 x 31` blocks whose negatives are positive definite by exact SymPy LDL.
3. The Lean 4 formalization verifies the reduction, the spectral-norm facts,
   the abstract Farkas contradiction chain, and the generated certificate
   arithmetic used by the published proof path.

The rigorous proof path is **not** the historical floating-point SDP output.
It is the exact rational certificate plus the Lean formalization.

## Repository map

```text
Manuscripts/
  paper/        primary paper LaTeX/PDF
  supplement/   supplementary Lean/certificate description
  report/       extended research report

Formalization/
  Core/          algebraic and spectral-norm proof core
  Farkas/        abstract Farkas contradiction chain
  Certificate/   generated certificate arithmetic and default proof artifacts
  Bridges/       small adapters between certificate and abstract proof layers
  Tests/         lightweight sanity/import checks used by the default build
  Experimental/  scratchpad / abandoned modules, not built by default
  SlowDiagnostics/NativePSD/
                 correct but very slow native_decide diagnostics, not built by default

Pipeline/
  verify/        verifier modules used by scripts/verify_certificate.py
  generate_lean/ Lean-code generators and exports
  search/        historical certificate-search scripts
  audit/         historical audit/provenance scripts
  reference_session/
                 extracted reference-session helpers

Artifacts/
  certificate/   canonical exact rational certificate and manifest
  lean_export/   canonical compressed Lean export
  audits/        JSON/text audit artifacts
  reference_sdp/ historical floating-point SDP/search artifacts

scripts/
  reproduce.sh            canonical Python replay entry point
  verify_certificate.py   repository-relative exact certificate verifier
  _internal/              packaging/maintenance helpers

docs/REPRODUCIBILITY.md   exact replay instructions
results/                  regenerated outputs and build logs (not source of truth)
```

## Quick reproduction

### Python exact certificate replay

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
bash scripts/reproduce.sh
```

This writes `results/certified_block_farkas_v2_den10000_verified.txt` and
checks the certificate in exact rational arithmetic.

### Lean default proof replay

This repository now bundles a Lake project:

```bash
lake exe cache get
lake build
```

The toolchain is pinned by `lean-toolchain` to `leanprover/lean4:v4.29.1`.
`lake-manifest.json` pins Mathlib at revision
`5e932f97dd25535344f80f9dd8da3aab83df0fe6` (`v4.29.1`).

The default `lake build` is the publishable proof build. It excludes two
non-default subtrees:

- `Formalization/Experimental/`: scratchpad or abandoned modules retained for
  research archaeology.
- `Formalization/SlowDiagnostics/NativePSD/`: valid but extremely slow
  `native_decide` re-verifications of block-1 PSD, retained for optional
  diagnostics and buildable on demand with `lake build SlowDiagnostics`.

## Reproducibility status

- Python exact certificate replay has passed after the repository restructure;
  see `docs/RERUN_GATE_STATUS.md`. Running `bash scripts/reproduce.sh`
  regenerates local evidence under `results/`.
- The fresh default Lean build after the `SlowDiagnostics` split has passed;
  see `docs/RERUN_GATE_STATUS.md`. Running `lake build` regenerates local build
  evidence under `results/`. The checked default proof tree has 427 Lean
  sources and 427 corresponding `.olean` files, excluding
  `Formalization/Experimental/` and `Formalization/SlowDiagnostics/`.
- Historical floating-point SDP artifacts under `Artifacts/reference_sdp/` are
  retained for provenance only; they are not used as proof evidence.

## Citation and license

If this repository supports your work, cite the accompanying paper and use the
metadata in `CITATION.cff`.

Code, Lean files, and scripts are released under the MIT license (`LICENSE`).
Manuscript PDFs and LaTeX sources are released under CC BY 4.0 unless a
subdirectory README says otherwise.
