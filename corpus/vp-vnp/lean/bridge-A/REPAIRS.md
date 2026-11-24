# REPAIRS — BlindA.lean (row F2, author A)

**None.** The sealed file corpus/vp-vnp/blind/A/BlindA.lean (sha256
d8891151420e827134e7c33a603bc30a6bd754e6db6073576f958a55c29ba3b0, SEAL-1A) was copied byte for byte to
/home/tester/ws-A/CertMachine/BlindA.lean and elaborated on the first attempt, 2026-11-24 00:22 UTC:

```
$ lake env lean CertMachine/BlindA.lean      # Lean v4.33.1, Mathlib 0df444a3, in the release's workspace
(no output: no error, no warning)
$ lake build CertMachine.BlindA
✔ [8706/8706] Built CertMachine.BlindA (15s)
```

The file in this folder is that file, unchanged (same sha256). Every "least sure" item of NOTES.md §4 elaborated
as written. One observation, not a repair: in `Approximates`, `algebraMap K (LaurentSeries K)` is found through
`HahnSeries.powerSeriesAlgebra`, i.e. the composite K → K[[ε]] → K((ε)); it is the constant series
(`algebraMap K (LaurentSeries K) a = HahnSeries.ofPowerSeries ℤ K (PowerSeries.C a)` holds by `rfl`), so the
meaning is the one the notes state.
