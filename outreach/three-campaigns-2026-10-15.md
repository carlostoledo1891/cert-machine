# Three audits, fifteen comments — DRAFTED 2026-10-15, NOT SENT (the operator's word, item by item)

Pages (all re-derived at build from their ledgers): /reports/alphaevolve-community.html (certs/aerp-ledger.json),
/reports/wowii-counterexamples.html (certs/wowii-ledger.json), /reports/optconst-queue.html (certs/optq-ledger.json).
Every number below is a field of those ledgers — re-run the ledger and re-read the page before posting anything.
Post ONLY on the operator's word, one item at a time: `gh issue comment N -R <repo> -F <block>` / `gh pr comment N ...`,
then SEND-QUEUE + GITHUB-OUTREACH.

Pre-send checks (each item):
- [ ] the page live with the row(s) cited; the ledger re-derived today
- [ ] the thread re-read: no new reply that changes the facts; the object files unchanged at their pins
- [ ] nothing in the block that the record does not hold

────────────────────────────────────────────────────────────────────────────────────────────────
## A. google-deepmind/alphaevolve_repository_of_problems (lane AE)

### A1 — issue #6 (no 5 on a sphere; to the four contributors)
---- PASTE ----
We re-decided every point set in this thread in exact integer arithmetic, from the notebook's definition (the 5 × 5 lifted determinant, planes included), with no code from any of the repositories: #4's 36 points at n = 13; the ten RECORD files of release v1.1.1 (milesandmistakes); the ten sets of hraness/algal-lab at d881f970 (0thernet, n = 17–26); all forty certificate files of hashkanna/mendel-evolve at 5a3b9668 (n = 15–40, stepping stones included). **All 61 sets are admissible**, so the best certified sizes per n run 36, 38, 42, 44, 46, 48, 51, 54, 56, 59, 62, 64, 66, 70, 72, 74, 76, 80, 82, 85, 86, 90, 91, 94, 96, 99, 102, 104 for n = 13 … 40 — the repository's table stops at n = 12 with 33.

How: every 4-subset keyed by the primitive integer 5-vector of its lifted hyperplane; a duplicate key or a zero normal is exactly a zero 5-subset determinant (and conversely), so the check is O(N⁴) rather than O(N⁵) and needs no floats; on the sets of at most 45 points every 5-subset determinant was also computed directly, agreeing, with min |det| = 2 throughout — the margin at which the notebook's float verifier (np.linalg.det + isclose) sits one rounding from wrong. Record, decider and the pins (sha256 of every file read): https://carlostoledo.co/reports/alphaevolve-community.html, github.com/carlostoledo1891/cert-machine (`instruments/aerp/p60.py`, `certs/aerp-ledger.json`). Priority among you is read from the thread and not adjudicated; the rows name the file decided.
---- END ----

### A2 — issue #10 (no isosceles triangles, hashkanna)
---- PASTE ----
Both 58-point sets decided exactly from the notebook's definition (three distinct points with two equal squared distances forbidden, the collinear midpoint case included): 30,856 triples each, zero isosceles, and neither admits another grid point (maximal); `n32_58.json` at c012959d equals set_a. The notebook's own 112-point n = 64 and 164-point n = 100 constructions decide as admissible under the same code, and a planted midpoint is caught. So C(32) ≥ 58 under this definition stands; what that means for PatternBoost's "f(32) = 56, SAT-optimal" (arXiv:2411.00566 §4.1) — a different definition in the SAT work, or a slip in the caption — is a question for that paper, and the one thing we can rule out is an error in the check. https://carlostoledo.co/reports/alphaevolve-community.html (rows aerp-p59-c32-58-a/b).
---- END ----

### A3 — issue #12 (ring loading; also answers #11)
---- PASTE ----
Decided in exact rationals, every 2^m sign pattern, both k-ranges, no code of yours: #11's m = 15 instance has α = 47/42 under k = 1..m−1 and under k = 1..m alike; the m = 14 instance here has α = 9/8 under k = 1..m, 3/4 under the notebook's k = 1..m−1, and 9/8 again padded to m = 16 under the notebook's convention; the m = 15 instance of your zip likewise; the m = 17 instance at denominator 560 gives 9/8 under the notebook's own k = 1..m−1 without padding; @karldaeubel's 12-pair instance gives 9/8 under k = 1..m. So C ≥ 9/8 holds under either reading of the problem — the notebook's prompt and its `compute_alpha_exact` agree with each other (k = 1..m−1) and differ from this thread's k = 1..m, and the padding argument closes the gap. https://carlostoledo.co/reports/alphaevolve-community.html (§3). Which range the ring-loading constant itself wants is a question for the problem's source rather than for the notebook; we did not decide it.
---- END ----

### A4 — issue #5 (sums and differences, there4iam)
---- PASTE ----
The two finite parts of your note decide: the far-block set your certificate script defines at L = 100000, rebuilt here from its stated rule (not by running the script) — |A| = 101,478, |A+A| = 1,200,837, |A−A| = 848,817 by exact bitset sumsets — has g = 1.163338…, and g > 1.163 was decided as the integer inequality |A+A|¹⁰⁰⁰|A|¹⁶³ > |A−A|¹¹⁶³; the explicit 23,646-integer set of §5 has |A+A| = 6,924,316, |A−A| = 3,370,545, diameter 3,577,327, so |A+A| + |A| exceeds |A−A| + diam + 1 by exactly 89, as your header says. The repository's 309-element list re-counts to 1,367 sums and 1,163 differences (1.12194). The 1.6269 instance we did not decide — nothing enumerable at an 86-digit modulus — and C = 2 is Lin–Li's theorem, as you noted. https://carlostoledo.co/reports/alphaevolve-community.html (§4).
---- END ----

### A5 — issue #4 (n = 13, Harmenszoon) — optional, one line
---- PASTE ----
Your 36 points at n = 13 decide as admissible in exact integers here (376,992 five-subsets, zero determinants none, min |det| = 2, matching your checker's figures), with the notebook's n = 7…12 constructions as controls; the thread has since gone far past n = 13 (see #6). https://carlostoledo.co/reports/alphaevolve-community.html
---- END ----

(#8, the sofa, gets no comment: the row is REFUSED for want of an exact object, and the page says what an interval instrument would need. #7 is structural and was read, not decided.)

────────────────────────────────────────────────────────────────────────────────────────────────
## B. google-deepmind/formal-conjectures (lane W) — one comment per issue; the five share a tail

### B1 — #7304 (WOWII 353)
---- PASTE ----
The 25-vertex tree, rebuilt from the parent table of your fork's `WOWII353Proof.lean` and matching the issue's construction (24 edges), decides in exact arithmetic from the archive's definitions: γ_t = 10 by a tree DP (your ten-vertex set is total dominating; the nine support vertices force at least nine), c(T[D₂]) = 9, k_M = 3, right side 21/2 — the inequality fails. Standard library, no Lean built, nothing of yours run.
{TAIL}
---- END ----

### B2 — #7305 (WOWII 360)
---- PASTE ----
The 41-vertex tree decides: γ_t = 6 (your set {1,2,3,6,7,8} is total dominating; six vertices with pairwise disjoint open neighbourhoods force six), c(T[S ∪ L]) = 4, dist_avg(C,V) = 321/80 over the centre, right side 961/160 — and 641/80 without the ½. On the ½: the Internet Archive's 2010-07-17 and 2016-10-09 copies of open.html carry it as byte 0xBD; the 2026 copy lost the byte. Either way the inequality fails.
{TAIL}
---- END ----

### B3 — #7306 (WOWII 373)
---- PASTE ----
The 150-vertex tree decides: γ_t = 12 by the DP (your twelve-vertex set is total dominating), periphery of 11 vertices at eccentricity 23, transmission sum 29,514 over 1,639 positive pairs, dist_avg = 29514/1639 and two thirds of it 19676/1639 > 12 — the inequality fails.
{TAIL}
---- END ----

### B4 — #7308 (WOWII 396)
---- PASTE ----
The 39-vertex graph (K4…K9, five bridges; 121 edges, connected) decides: each clique keeps two vertices with no outside neighbour, so every 2-dominating set has at least two per clique (12), and two per clique 2-dominate — γ₂ = 12; degree frequencies 3,4,6,8,8,7,3 at degrees 3…9, modes {6, 7}, |M| = 8, no boundary edge: right side 10. The inequality fails. One note on the Lean: definition 45 leaves dd_mode undefined for a unique mode, which `(degreeModes G).card` sets to 1 — moot for this witness.
{TAIL}
---- END ----

### B5 — #7330 (WOWII 395b)
---- PASTE ----
The 15-vertex graph, taken from your fork's `WOWII395bProof.lean` (the issue gives no graph; the zip was not opened), decides by exhaustion over all 2¹⁵ subsets: γ₂ = 6, modes {6}, |M| = 4, minimum degree 3, δ(G[V∖A]) = 1, no vertex of degree < 3 — right side 5; the inequality fails. One note on the Lean: `(remaining G).Nonempty` is a hypothesis the archive's statement does not have (needed because δ is undefined on regular graphs); it weakens the universal, and the witness satisfies it.
{TAIL}
---- END ----

TAIL (append to each of B1–B5):
The record (certs/wowii-ledger.json), the decider (instruments/wowii/decide.py) and the page: https://carlostoledo.co/reports/wowii-counterexamples.html. Two things you may want to fix: the `formal_proof` links in PRs #7310/#7321/#7322/#7320/#7337 returned 404 by 20:45 UTC on 10-15 (the fork's cited commits appear rewritten; main no longer carries `Proofs/WOWII*Proof.lean`) — the copies decided here were fetched at 17:14 UTC and are pinned by sha256 in corpus/wowii/PINS.json; and the manuscripts' infinite families are not decided here, only the one witness of each.

────────────────────────────────────────────────────────────────────────────────────────────────
## C. teorth/optimizationproblems (lane T) — PR comments

### C1 — PR #225 (Atris)
---- PASTE ----
Both constructions re-decided exactly, no code of yours run: the 65,536 heights as integers over one denominator, the autoconvolution as a single exact integer product (Kronecker substitution), the maximum over every grid shift — 645423412969467179759478160871915520/429496729600000035389440000000000729 = 1.502743486709583379743219592078…, your fraction to the last digit, below 1.5027435; and for 1b the 114,688-step h with Σh = n/2 exactly correlated with 1 − h: 10919976354672639675467789613614419/28672000000000000000000000000000000 = 0.380858550316428560109786189090…, below 0.38085856. Record and decider: https://carlostoledo.co/reports/optconst-queue.html, `instruments/optq/stepfun.py`. (The notebook-style scorer of the EinsteinArena lineage is not needed; the registry's definitions suffice.)
---- END ----

### C2 — PR #221 (Jaswal)
---- PASTE ----
Decided with no code of yours: exact pushforwards per law, directed-rounding interval entropies at 128 bits (the single-law instrument that decided C₃b and C₃c in September), the mixture by the rational weights 39041372760532870645 : 60958627239467129355, after checking the condition that makes the entropies add — max |L(x,y)| over both supports is 27 ≤ (55−1)/2, so the digit map is injective. ρ ∈ [1.674894211307116228764343737060, …061], above 1.674894211307116. https://carlostoledo.co/reports/optconst-queue.html (§3).
---- END ----

### C3 — PR #226 (Patankar)
---- PASTE ----
Three of the five decide here exactly and hold: 20a (E[Eᵏ] = k!, so E[(E−1)⁴] = 9 and Var(X²) = 8), 20c (the uniform on [−√3, √3] with A = (−∞, 0]: inverse Cheeger ratio √3, computed through squares), and 23b read step by step (the parity, the trace, the Frobenius bound from odd entries, Bhatia–Davis, the algebra) — all as written. 16a and 70a we did not attempt (interval sums with cited inequalities in the derivation; an afternoon each, not done). https://carlostoledo.co/reports/optconst-queue.html (§4).
---- END ----

### C4 — PR #217 (kleinwaks) — optional
---- PASTE ----
For the record: OpenAI's BorsukNine was rebuilt and checked under both Lean's kernel and nanoda on 2026-10-10 (certs/openai-math-kernel.json in github.com/carlostoledo1891/cert-machine; the statement read against the paper's claim, no definition holes), so the row's certificate is the Lean development itself. https://carlostoledo.co/reports/optconst-queue.html
---- END ----

### C5 — PR #210 (Mosaic Intelligence) — the sensitive one; the operator reads it first
---- PASTE ----
We read the package file by file (104 files; nothing run) to see what an outside party can decide from it. The scorer and the two mathematical checkers (python-flint arb; mpmath.iv) evaluate auxiliary inequalities on frozen coefficient tables — walls, clocks, norms, debits, Taylor leaves — and compare rationals, hashes and box covers; no function in the three scripts evaluates ζ, H_t or the 690,988-term Dirichlet polynomial. The torus floor, the separator at X and the Polymath15 error constants enter as frozen outputs whose proofs cite banks (713, 729, 744, 745, 755, 767, 774, 786, 791 — the numbers the pinned files name) that are not in the bundle, and the anchor Λ ≤ 3/16 is your own July row. So what the package certifies is that its parts fit together as declared; whether the parts are true is not in the submission, and our record marks the claim REFUSED on that ground — a verdict on the evidence, not on Λ (your C₃b, C₃c and C₇₁ certificates were all true when we decided them in September). If the bank's contents for 767 (the T⁴ floor |F₁| − Σ_{r>1}|F_r| > 1/10), the separator at x = X for t ∈ [0, 3/16] including y = 0, and the constants p, q from Polymath15 Theorem 1.3 were published as data, each is a check we would run. https://carlostoledo.co/reports/optconst-queue.html (§5).
---- END ----
