NEEDS DATA

**Reconstruction self-checks.** The printed side factors disagree with the stated coefficient on **50 of 128 retained supports**. In packet 1, \(B_1=x_1y_0z_1\). The table sets all three factors to 1, while the text assigns \(B_1\) coefficient \(1/128\). The discrepancy survives reduction modulo both requested primes. See page 21 of :codex-file-citation{path="/Users/carlostoledo/Projects/cert-machine/corpus/omega-nine-fourths/provenance/sun/pdf-2610.13971v1.pdf" purpose="source"}.

| Check | Exact result |
|---|---|
| Packet supports | 354 possible, 128 retained, 226 omitted. All 354 zero/nonzero decisions agree with the masks. |
| Retained coefficients | 78 equal \(1/128\). The other 50 equal 1, across 16 \(B_1\), 14 \(B_2\), and 20 \(C_1\) occurrences. |
| Dense chart | At the origin, the printed factors sum to \(50+78/128=3239/64\). Equation (5.1) requires 1. The factors pass 128 of 256 chart checks. The stated uniform weight passes all 256. |
| Source budget and terminal incidence | The budget gives 128 products per row and 2,048 overall. Starting from the stated zero fibre, the decoder produces all 32,768 matrix cycles exactly once. |

**Ambiguity log.** I recorded both normalization readings before testing and evaluated each separately. The conflict prevents a consistent reconstruction of the three physical Laurent maps. The chart discrepancy is a local coefficient failure. Whether the full source computes \(M_{32}\) remains undecided. [Preregistered readings](/Users/carlostoledo/Projects/cert-machine/corpus/omega-nine-fourths/sun-check/B/work/PREREG.txt) · [Full report and self-checks](/Users/carlostoledo/Projects/cert-machine/corpus/omega-nine-fourths/sun-check/B/work/REPORT.md)

**Points and seed.** Seed `X1-Sun-M32-B-v1` generated 20 points per prime. All 40 triples and their exact \(M_{32}(x,y,z)\) values are recorded and independently verified. **Full source evaluations and global Laurent coefficient comparisons both total zero.** [Point records](/Users/carlostoledo/Projects/cert-machine/corpus/omega-nine-fourths/sun-check/B/work/points.jsonl) · [All 354 support coefficients](/Users/carlostoledo/Projects/cert-machine/corpus/omega-nine-fourths/sun-check/B/work/packets.json) · [Chart coefficients](/Users/carlostoledo/Projects/cert-machine/corpus/omega-nine-fourths/sun-check/B/work/charts.json)

**Exact reproduction**

```sh
cd ~/Projects/cert-machine/corpus/omega-nine-fourths/sun-check/B/work
date -u
ruby audit.rb
ruby verify-records.rb
shasum -a 256 -c SHA256SUMS
```