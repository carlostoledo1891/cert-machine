# Independent audit of the λ(4) proof (Erdős Problem #510)

[teorth/erdosproblems#392](https://github.com/teorth/erdosproblems/issues/392) announces a machine-derived proof, produced by the [cert-machine](https://github.com/carlostoledo1891/cert-machine) engine, of a conjecture of Mercer (INTEGERS 19, 2019). The claim is that among all sets of four positive integers, {1,2,3,4} has the shallowest cosine-sum minimum:

λ(4) = −min_t (cos t + cos 2t + cos 3t + cos 4t) ≈ 1.5195578816428, the largest root of 512y³ − 1227y² + 600y + 125.

This repository re-checks that proof **independently**:
- All computations use our own code; none of the engine's code is executed.
- The engine's record is used only as data, to learn *which* argument each step claims. Each claim is then re-derived from scratch and compared.

**Result:** every layer of the proof checks out. We found no mathematical error, and we list five documentation issues.

| Layer | Checked |
|---|---|
| exact value | resultant = 2048·(cubic); agreement to 190 digits |
| lemmas A–F | by hand |
| generic case | 14 collision conditions derived exhaustively; all deltas identical |
| 9 family dot theorems (incl. 10 triangulated cone tables) | all identical to the record |
| every subfamily closure (anchors, bounds, floors, thresholds) | all identical |
| finite certificates | **2,231 / 2,231** re-enumerated and certified with interval arithmetic |
| coverage | every positive-delta condition accounted for |
| proof-independent sweep | all **1,473,833** gcd-reduced 4-sets with max ≤ 80 dip strictly deeper than {1,2,3,4} |

Details, findings and caveats: [AUDIT_NOTES.md](AUDIT_NOTES.md). Data provenance: [data/PROVENANCE.md](data/PROVENANCE.md).

## Reproduce
```
pip install -r requirements.txt
bash run_all.sh        # about a minute; ends with ALL CHECKS PASSED
```

## Disclosure
The audit scripts were written with the assistance of Claude (Anthropic). The author reviewed the method and the results.

## License
MIT. See [LICENSE](LICENSE). The bundled record file is MIT-licensed by its author; see [data/LICENSE-cert-machine](data/LICENSE-cert-machine).
