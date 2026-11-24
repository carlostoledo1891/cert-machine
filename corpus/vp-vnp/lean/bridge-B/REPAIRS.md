# REPAIRS — BlindB.lean (bridge B, VP ≠ VNP lane, row F1/F2)

None. The sealed file elaborated as written, with no error and no warning, in the release's environment
(Lean v4.33.1, Mathlib 0df444a3), on the first attempt (2026-11-24 00:22 UTC, `lake env lean
CertMachine/BlindB.lean`, 26.9 s; then `lake build CertMachine.BlindB` under the workspace's
`autoImplicit = false`, also clean).

CertMachine/BlindB.lean in the workspace and in this folder is byte-identical to corpus/vp-vnp/blind/B/BlindB.lean:
sha256 f8b5af56a0f4f01ca3cdd10b0eaa13e7cfb5b4a8774b6664fb74f63d273ee892, the value sealed in SEAL-1B.

The only change outside the sealed file is the workspace lakefile (lakefile.diff): a `[[lean_lib]]` for the
CertMachine folder, so the blind file, the bridge and the challenge build as modules.
