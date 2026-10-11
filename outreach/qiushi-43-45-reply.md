# Reply on Oxelra-AI/Qiushi-Engine-Kissing-Number-Research issue #1 — DRAFT, for the operator's approval

Context: our 2026-10-06 post checked K(25) and K(27) and asked for the dimension-43 and -45 points. On 2026-10-11
(04:01–04:51 UTC) Cherish0925 published both complete point sets (release section-vectors-2026-10-11) and asked how the
format works with our checker. Every number below is a field of certs/kissing-wave.json (rows qiushi-43, qiushi-45);
re-check them before posting. Post with `gh issue comment 1 -R Oxelra-AI/Qiushi-Engine-Kissing-Number-Research -F <file>`,
then record it in outreach/SEND-QUEUE.md and the GitHub outreach map.

Pre-send checks (all must hold at posting time):
- [ ] both rows WITNESSED, committed and pushed; the kissing page rebuilt and LIVE showing both
- [ ] the release assets' GitHub digests still equal our pins; no new comment on the thread since the last read
- [ ] jsCheck.agree and csvCheck.identicalToBinary true on both rows
- [ ] the clean-clone re-derive path works (`--js-only` tested 2026-10-11 for 43)

---- PASTE BELOW THIS LINE ----

Thank you for publishing both point sets so quickly — and in exactly the right form: integer Cartesian rows needed no adaptation. I read the int8 files and checked that the CSVs hold the same rows, in the same order.

**K(43) ≥ 2,553,792 holds.** The 2,553,792 rows are distinct, every squared norm is 576, and they span exactly a 43-dimensional subspace of Q⁴⁸ (a sample has rank 43 over Q, and every row is orthogonal to the five integer vectors of its null space). All 3,260,925,512,736 pairs were decided exactly: 4,467,331,098 are at exactly 60° (inner product 288), none is closer, and the nearest non-contact has inner product 192 (cos θ = 1/3).

**K(45) ≥ 7,380,090 holds.** @@K45@@

How: the inner products are float32 BLAS tiles, exact because every partial sum is bounded by |x||y| = N < 2²⁴. A seeded 600-row sample in each dimension was re-decided in plain Python integers, and a 672-row sample by a separate JavaScript implementation; both agree with the bulk run on every contact count. Your verification files record `"pairwise_inner_products_checked": false`, so as far as I know this is the first pairwise check of these two configurations. It stands on the explicit points alone; the moment certificates were not checked.

Re-derive (the tool downloads your release files and refuses them unless they match the sha256 pins): `python3 tools/run-kissing-sections.py 43` and `python3 tools/run-kissing-sections.py 45` in https://github.com/carlostoledo1891/cert-machine — @@TIMES@@ on an 8-core laptop. Write-up: https://carlostoledo.co/reports/kissing.html §4.

**Not decided here yet:** 32–39 and 49–55.

*AI-assisted: built with Claude (Anthropic) in a certified-arithmetic setting; every verdict above is the record's exact decision, re-derived at every build.*

---- END PASTE ----
