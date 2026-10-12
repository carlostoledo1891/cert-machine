# Reply on Oxelra-AI/Qiushi-Engine-Kissing-Number-Research issue #1 — all 19 dimensions — DRAFT, NOT SENT

Answers Cherish0925's two comments of 2026-10-12 (04:42 and 05:22 UTC: the README credit for 25/27/43/45; the complete
32–39 and 49–55 releases). Supersedes outreach/qiushi-gram-form-reply.md (their format question is answered by their own
choice of Cartesian exports; the Gram-form re-check of 43/45 is one sentence here). Every number is a field of the qiushi-*
rows of certs/kissing-wave.json — re-check before posting. Post ONLY on the operator's word:
`gh issue comment 1 -R Oxelra-AI/Qiushi-Engine-Kissing-Number-Research -F <paste block>`, then SEND-QUEUE + GITHUB-OUTREACH.

Pre-send checks:
- [ ] all 19 qiushi rows WITNESSED, committed and pushed; the kissing page live with "every one of the 19 bounds … holds"
- [ ] the release digests still equal the pins in tools/run-kissing-configs.py / run-kissing-config38.py
- [ ] the thread re-read; nothing new since 05:22 UTC 2026-10-12 (or this reply adjusted)

---- PASTE BELOW THIS LINE ----

Thank you — for the README links, and for publishing all fifteen remaining configurations so quickly. Every one is now checked, pair by pair, and **all 19 bounds in the paper hold**:

| d | points | pairs decided | at exactly 60° |
|---:|---:|---:|---:|
| 32 | 347,584 | 60,407,144,736 | 358,430,976 |
| 33 | 363,968 | 66,236,170,528 | 368,310,912 |
| 34 | 384,196 | 73,803,091,110 | 380,481,792 |
| 35 | 409,676 | 83,917,007,650 | 315,579,800 |
| 36 | 484,760 | 117,495,886,420 | 404,388,832 |
| 37 | 498,024 | 124,013,703,276 | 392,397,168 |
| 38 | 591,900 | 175,172,509,050 | 379,853,270 |
| 39 | 763,668 | 291,594,025,278 | 325,490,632 |
| 49 | 52,430,156 | 1,374,460,602,877,090 | 965,197,554,294 |
| 50 | 52,458,468 | 1,375,945,406,224,278 | 964,169,164,800 |
| 51 | 52,500,930 | 1,378,173,799,181,985 | 962,629,120,340 |
| 52 | 52,585,772 | 1,382,631,682,125,106 | 959,560,825,568 |
| 53 | 52,698,696 | 1,388,576,253,700,860 | 955,491,412,444 |
| 54 | 52,923,774 | 1,400,462,900,739,651 | 947,433,469,328 |
| 55 | 53,301,140 | 1,420,505,735,999,230 | 934,069,080,624 |

In every dimension: the row count and the counts per squared norm equal yours, the rows span exactly d dimensions (the rank of the exact Gram matrix XᵀX), and no pair is closer than 60°.

How, briefly:
- **Different row lengths.** Each pair is decided by the exact integer test `p <= 0 or 4p² <= AB` — your test — which also rejects a repeated or parallel row, so distinctness of directions is part of it. Contacts are `4p² = AB`.
- **32–37, 39** on a laptop (float32 BLAS; every partial sum is bounded by |x||y| ≤ 39, so every product is an exact integer).
- **38:** the 589,968 rows of norm 48 the same way; the products with the 1,932 rotated axes in exact int64 (every partial sum is bounded by √(48·N) < 4.4·10¹⁸ < 2⁶³); the axis–axis pairs in Python integers.
- **49–55** on one rented GPU, by a fused kernel that computes and reduces each 128 × 128 block of products in registers (fp16 inputs, fp32 accumulation; every partial sum is at most 192, so every value is an exact integer). Before deciding anything, the GPU path re-decided 32 and 39 and had to reproduce the laptop's contact counts exactly; it did.
- **Cross-checks:** in every dimension a seeded sample was decided again in plain Python integers and by a separate JavaScript implementation in BigInt; all agree.
- **43 and 45, a second way:** from your lattice data in `constructions/sections` (B Bᵀ = 96 G and 12 G exactly), every exported row is an integer combination of your basis satisfying your section and fibre conditions (2,460,030 per fibre in 45), and every pair decided again from the coefficients gives the same contacts.

Re-derive: `python3 tools/run-kissing-configs.py 32` (any of 32–37, 39), `python3 tools/run-kissing-config38.py`, and `tools/runpod-qiushi-lifting.sh` for 49–55, all in https://github.com/carlostoledo1891/cert-machine. Each tool downloads your release files and refuses them unless they match the sha256 pins. Write-up: https://carlostoledo.co/reports/kissing.html §4.

If it helps, the README line could now say all 19 dimensions.

*AI-assisted: built with Claude (Anthropic); every verdict is the record's exact decision, re-derived at every build.*

---- END PASTE ----
