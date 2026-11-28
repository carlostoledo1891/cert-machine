# Pre-registration: "Language Models Can Rewrite Their Own Weights", Stage 3, one GPU pod under US$20

Drafted 2026-11-27 00:50 UTC (the operator's word of 26 Nov: one GPU pod, a hard cap of US$20), before any pod exists.
No RunPod resource has been created, started or touched for this stage. The catalog was READ only, for the prices
below. It is registered when the control room commits it together with the code listed in
`corpus/qwen-self-rewriting/stage3/STAGE3-CODE.sha256`. A later change is an amendment, dated and committed before the
code or the run it changes.

## What Stage 3 asks
On 490 problems of our own fixed draw from the paper's pool, with one answer per problem, three arms run in this order:
- **A**: the base at the paper's settings. This anchors our setup against the paper's 57.2% and 33.6% cut.
- **B**: session 8's edit, using our rebuilt bytes, at the same settings. The paired change B − A is the paper's claim
  (57.2 → 63.8, +6.6 points, p < 10⁻⁵).
- **C**: the base, with no edit, at the model card's thinking-mode settings and a longer budget. This measures how much of
  the edit's effect the card's settings recover with no edit at all.

## What Stage 3 cannot establish (read first)
- **Not the paper's 490 problems.** The paper's split is unpublished: its order, its "seed base", and the hash behind
  `Hash(identifier) mod 2^31` (App. D.3, Alg. 3). The paper's held-out items 500–999 therefore cannot be identified or
  excluded. Our draw overlaps them only by chance, about 6 problems expected (490 × 490 / 40,315).
- **Not the paper's 3,920 answers.** We give one answer per problem, the paper eight. At this size the standard error of
  a paired change is about 1.8 points (see "Uncertainty"). A difference from 6.6 smaller than about 3.5 points shows
  nothing. A gain that is real but smaller than about 4 points may be missed.
- **Not the authors' edit.** Arm B serves OUR rebuild of session 8's edit (Stage 1, E4 CERTIFIED: +0.5 on the 48
  `dt_bias` tensors, identical bytes from two deciders). It is not the authors' file. Their file is unreleased.
- **Not the authors' stack.** The paper names vLLM and Math-Verify with no versions (Fan, e-mail of 26 Nov). We pin
  vLLM 0.33.0 and math-verify 0.9.0. Their GPU, engine settings and revision of the base are unknown. Our base is the
  revision Stage 1 pinned (81a287ca).
- **Not their grader as the authority.** Our two graders decide. They share no code and are exact and three-valued.
  Math-Verify 0.9.0 runs beside them as a reading and decides nothing.
- **Not the same population.** E2 below keeps only problems whose gold answer our graders canonicalise as a number,
  surd, multiple of π, angle or complex number (88% of the pool). The paper graded all its problems with Math-Verify.
  Our accuracy is on that subset of problem types.
- **Not the card's full budget.** The card suggests 81,920 tokens "for benchmarking on highly complex problems, such as
  those found in math and programming competitions" (README at 81a287ca, line 1323). C runs at 32,768, the most the money
  allows. Answers that need more than 32,768 tokens count as cut.
- **Not reproducible to the token.** The paper says so too (D.3): two runs with the same seeds part ways. A re-run of
  this stage would change some answers.
- Nothing about sessions, logs, the repair, images, or the 2B/4B/9B models.

## Pins (`corpus/qwen-self-rewriting/stage3/PINS.json`)
- **Paper:** arXiv 2611.21885 v2, pinned in Stage 1's PINS (TeX sha256 `35b11253…f11a`).
- **Model:** `Qwen/Qwen3.5-27B` at commit `81a287ca484a5e71148f5beb7f367bb5286d70f9`, never `main`.
  - The 11 shards are pinned by their LFS sha256 (55,563,022,432 bytes together) and hashed whole on the pod.
  - `config.json` and the index are pinned by the sha256 of Stage 1's fetched copies.
  - `README.md` (`124ef747…2b63`, equal to the scout's copy) and `generation_config.json` were fetched at the commit
    on 27 Nov. `tokenizer.json` is pinned by its LFS sha256.
- **The edit:** `corpus/qwen-self-rewriting/runs/stage1/py/session8-edit-spec.json` (committed; the JavaScript decider's copy is byte-identical), sha256
  `2e2c3f761426c086fd2b669d5389031e5eac1700b2b384204fec8b50310c9c13`. The 48 edited tensors concatenated hash to
  `72123fa2…0df21`.
- **The pool:** `agentica-org/DeepScaleR-Preview-Dataset` at revision `b6ae8c60f5c1f2b594e2140b91c49c9ad0949e29`.
  `deepscaler.json` is 21,479,374 bytes, sha256 `4e9e7b18248d982b4498a54a6bdb37b1bb653cf5f77bc309fa67a6c2533c8ba4`, with
  40,315 rows, MIT. The host reported that commit and that LFS hash on the 27 Nov download.
- **The draw:** `corpus/qwen-self-rewriting/stage3/draw-490.jsonl`, 258,658 bytes, sha256
  **`33efd6b71e9894ec33bb82b3ab57dbf8406bbf374d29c8944cfe7c304a4e1282`**. The list of ids hashes to
  `e028c7373a2bd063051de3bb2124f27ee5ca6625c73c30cb8ac28363fd7ccdff`. Its record is `draw.json`.
- **Engine:** the image `vllm/vllm-openai:v0.33.0`.
  - Index digest `sha256:d825baf9…6c84c6e`; amd64 `sha256:91ee972a…10b3`.
  - It is the WSP lane's image (vllm 0.33.0, torch 2.14.0+cu130, CUDA 13.0) and needs a host with CUDA ≥ 13.0.
  - vLLM 0.34.0 (16 Nov) is less than two weeks old and is not used.
- **The paper's grader, as a reading:** math-verify 0.9.0, latex2sympy2_extended 1.11.0, antlr4-python3-runtime 4.13.2,
  sympy 1.14.0 and mpmath 1.3.0, each wheel by its PyPI sha256. They are installed with `--require-hashes` into a
  directory apart from the engine's packages.

## The draw (done on the desk before this file; `instruments/qwen-self-rewriting/stage3/draw.py`)
- **Rows:** row i of `deepscaler.json`, 0-based in file order, is problem `dsr-%05d`. The pool has no identifiers of its
  own.
- **Exclusions:**
  - **E1:** the answer is empty (6 rows).
  - **E2:** the gold answer's canonical class, under both graders (which must agree on it), is not q, sqrt, pi, deg or c.
    This excludes lit 4,038, tuple 407, q% 237, base 118 and text 90 rows. The graders disagreed on 0 classes.
  - **E3:** the problem's normalised text (lower case, whitespace collapsed) occurs more than once in the pool. Every
    copy is excluded, 1,996 rows. This plays the part of the paper's "10 whose question repeats".
  - **E4:** the problem equals a MATH-500 problem (3 rows).
  - **Not checked:** the paper's other decontamination lists (AIME 2024/2025, HMMT Feb 2025, AMC 2023, OlympiadBench,
    GPQA-Diamond). The first four postdate the pool's sources as its card lists them (AIME 1984–2023, AMC before 2023).
    The last two were not checked, and that is stated as not established.
  - **Not excluded because it cannot be identified:** the paper's items 500–999.
- **Order:** key = sha256("qwen-self-rewriting-stage3|2026-11-26|" + id + "|" + sha256(problem)). The salt is the seed.
  The 490 eligible rows with the smallest keys are taken (of 33,420 eligible) and written in pool order.
- **Drawn:** 424 q, 54 sqrt, 8 pi, 3 deg, 1 c.
- **Seed per problem:** int(sha256("qwen-self-rewriting-stage3-seed|" + id)[:8], 16) & 0x7fffffff. There are 490
  distinct seeds, and each problem gets the same seed in every arm. The paper uses the same scheme, a seed fixed by the
  problem's identifier.
- **K5:** `draw.py --check` redraws the file and compares it byte for byte. It passed at drafting.

## The arms (one vLLM engine configuration for all three; only the weights' directory changes)
- **Engine:** `vllm serve DIR --dtype bfloat16 --max-model-len 34816 --gpu-memory-utilization 0.92 --max-num-seqs 256
  --seed 0 --generation-config vllm --limit-mm-per-prompt {"image":0,"video":0}`.
  - `--generation-config vllm` keeps the checkpoint's own `generation_config.json` (T 0.6, top-k 20, top-p 0.95) from
    filling any parameter that was not sent.
  - If the server will not start with the last flag, it is retried once without it, and the record states the deviation.
- **Prompt:** the pinned chat template, with one user turn: problem + "\n" + "Please reason step by step, and put your
  final answer within \boxed{}." (Tab. 5's instruction; the separator is ours). `add_generation_prompt`,
  `enable_thinking=True`. The prompt is sent raw to `/v1/completions` with n = 1 and the problem's seed. All 490 requests
  are in flight at once, and the server schedules them.

| arm | weights | temperature | top-p | top-k | min-p | presence | repetition | max new tokens |
|---|---|---|---|---|---|---|---|---|
| A | base (P1) | 0.6 | 0.95 | 20 | 0 | 0 | 1.0 | 16,384 |
| B | edited (P2) | 0.6 | 0.95 | 20 | 0 | 0 | 1.0 | 16,384 |
| C | base (P1) | 1.0 | 0.95 | 20 | 0 | 1.5 | 1.0 | 32,768 |

- **A and B:** the paper's settings as its first author states them: thinking on, T 0.6, top-p 0.95, top-k 20, 16,384
  tokens. The paper states no presence penalty. 0 is the card's value for these settings (its "precise coding" line) and
  vLLM's default.
- **C:** the card's "Thinking mode for general tasks" line (README line 1314): `temperature=1.0, top_p=0.95, top_k=20,
  min_p=0.0, presence_penalty=1.5, repetition_penalty=1.0`. The card gives no separate line for maths. Its maths advice
  is the output length, and 32,768 is also the card's "most queries" length (line 1323).
- **Order:** A, then B, then C. B and C need A complete. No arm is re-run. A partial arm's answers are kept and decide
  nothing.

## Grading (`instruments/qwen-self-rewriting/stage3/grade3.py`, `grade3.js`)
- **The paper's rule (Tab. 5):** "The last \boxed{} after the thinking, checked against the reference …; no credit if
  the thinking is still open when the budget runs out."
- **Thinking:** it closes at the first `</think>` of the answer. If there is none, the answer is WRONG, whether it was
  cut or stopped. Nothing inside the thinking is read.
- **Prediction:** the last closed `\boxed{}` after that point. If there is none, or it is empty, the answer is WRONG.
- **Decision:** `instruments/wsp/grade.py`, or `grade.js`, unchanged: CORRECT, WRONG or REFUSED.
- **Second reading:** after the last `</think>`. It is recorded and decides nothing.
- **The two graders share no code.** The Python one wraps the WSP lane's Python grader and the JavaScript one wraps
  its JavaScript grader. The WSP pair was written independently and found a bug in each other on 3 Nov.
- **K3:** 13 planted answers, the same in both graders. Each must get its stated verdict. Both passed at drafting.
- **Scoring:** a REFUSED answer is scored twice. The floor counts it wrong and the ceiling counts it right. A decision
  must hold under both, and under both graders.
- **Cut:** finish reason `length`. **Looping** (Tab. 5): cut, and the last 6,000 characters compress (zlib) to under 15%
  of their size.
- **Math-Verify 0.9.0 (reading M1):** its own extraction over the text after the first `</think>`, against
  `\boxed{gold}`. It decides nothing.

## The test (the paper's, App. D.3, computed exactly)
- **Per problem:** d = (the later arm's answer is right) − (the earlier arm's answer is right), so d ∈ {−1, 0, 1}. The
  statistic is the mean of d over the 490.
- **The one-sided sign-flip permutation p:** the share of the 2^490 sign vectors whose sum is at least the observed sum.
  It is computed EXACTLY, not with the paper's 100,000 flips. With one answer per problem it equals the one-sided sign
  test P(Bin(k, ½) ≥ n_up) over the k problems where the arms differ.
- **Two computations that share no code must give the same rational (row G2):** the record tool's binomial tail, and
  `stats3.js`'s enumeration over sign vectors.
- **Interval:** δ ± 1.96 SE, with SE² = Σ(dᵢ − δ)² / (489 × 490) exact and its square root rounded outward. A
  proportion's interval is the exact Clopper–Pearson bound on a 10⁻⁶ grid, rounded outward.
- **α = 0.05, one-sided,** as the paper's evaluation fixed in advance.

## Rows

Integrity rows. P1–P3 and G0 stop the run or void the rows. P2 and K6 void only B's rows.

| id | what | passes iff |
|---|---|---|
| P1 | the base on the pod | the 11 shards hash whole to their LFS sha256, and config, index, README, generation_config and tokenizer.json match PINS; every other file's sha256 is recorded |
| P2 | the edit, applied ON THE POD (`apply_edit.py`) | the spec hashes to its pin; the base bytes of each of the 48 tensors hash to `sha256_base`; our own bf16(x + ½) rounding gives each tensor's `edited.a` sha256 and the 48 together `72123fa2…`; the patched shard 11 differs from the base only inside the 48 ranges (both streamed whole). The second reader (`verify_edit_torch.py`, safetensors + torch, no shared code) finds that exactly the 48 tensors differ and that each equals (x.float() + 0.5).bf16 |
| K1, K2 | planted errors in the applier | a flipped base byte and a +0.25 edit must each be refused (both caught on the desk with the 48 real ranges read from the host; the clean build reproduced the spec's hashes) |
| P3 | prompts and seeds | the draw hashes to its pin; the prompt and seed hashes are equal across the arms |
| P4 | one engine | `_serve_args.txt` is identical across the arms except for the weights' directory |
| K6 | B served the edit | the greedy log-probs of a fixed prompt differ between A's and B's servers (whether A's and C's are equal is recorded) |
| G0 | graders | both K3 self-tests pass |
| G1 | agreement | the two graders' verdicts on every answer, with the disagreements listed; a row is decided under both graders, so a disagreement can only make it REFUSED |
| G2 | exact p | the two p computations are equal |
| SEAL | the pull | every file in the pod's `_SEAL.sha256` is present and hashes equal at the desk |

Rows with a verdict, or COMPUTED. "All four readings" means both graders × floor and ceiling.

| id | question | CERTIFIED iff | REFUTED iff | otherwise |
|---|---|---|---|---|
| A1 | does our setup land where the paper's does? | — COMPUTED: A's accuracy (floor, Python grader) with its exact 95% interval; reads "lands on the paper's 57.2" iff 57.2 is inside, else "does not land". The same for the cut share against 33.6 | — | — |
| B1 | does the rebuilt edit make the model more accurate? (the claim) | B − A > 0 and the exact one-sided p < 0.05 under all four readings | A − B > 0 and the exact one-sided p (other direction) < 0.05 under all four readings | REFUSED, "not decided at 490 × 1" |
| B2 | how large is the gain? | — COMPUTED: δ in points with its 95% interval; reads "consistent with +6.6" iff 6.6 is inside, "smaller than" iff the upper end is below 6.6, "larger than" iff the lower end is above it | — | — |
| B3 | is the gain the share that finishes? | — COMPUTED: the cut shares of A and B with the paired count and exact p of fewer cuts; accuracy among finished answers in A and B (the scout's arithmetic on the paper's numbers gave 86.1% and 86.3%); mean lengths | — | — |
| C1 | do the card's settings alone beat the paper's? | C − A > 0, p < 0.05 under all four readings | A − C > 0, p < 0.05 under all four readings | REFUSED |
| C2 | does the edit still beat a no-edit arm at the card's settings? | B − C > 0, p < 0.05 under all four readings ("the card's settings do not recover the gain") | C − B > 0, p < 0.05 under all four readings ("the no-edit card arm beats the edit") | REFUSED |
| C3 | how much of the gain do the card's settings recover? | — COMPUTED, read only if B1 is CERTIFIED: r = (C − A) / (B − A) on the Python floor. r < 0.25: "the gain stands against the card's settings"; 0.25 ≤ r < 0.75: "partly a settings effect"; r ≥ 0.75: "mostly a settings effect"; within 0.05 of an edge: "(at the edge)" | — | — |
| M1 | the paper's grader | — COMPUTED: Math-Verify 0.9.0's accuracy per arm, and its agreement with ours | — | — |
| L1 | lengths | — COMPUTED: mean tokens, mean finished tokens, cut share, looping share, thinking never closed | — | — |

An arm that did not run or did not finish makes every row that needs it **REFUSED on resources**. The record names
the arm and gives its `not-run.json` reason. If P1, P3, G0 or the seal fails, every row with a verdict is REFUSED.

## The money and the stop rule (`instruments/qwen-self-rewriting/stage3/project.py`; the runner obeys it)

### The GPU, compared by the catalog's listed prices (RunPod `list-gpu-types` and `get-gpu-type`, read 27 Nov ~00:40 UTC)

| GPU | memory | secure US$/h | community US$/h | stock read for the CUDA-13 image |
|---|---|---|---|---|
| H200 SXM ("NVIDIA H200") | 141 GB | 5.29 | 3.59 | secure: MEDIUM (CUDA 13.2 hosts). Community: NONE at CUDA ≥ 13.0, LOW at 12.9 only |
| H100 SXM ("NVIDIA H100 80GB HBM3") | 80 GB | 4.39 | 2.69 | community: NONE |
| H200 NVL (reference) | 143 GB | 3.79 | — | secure: NONE |

**The choice: one H200 SXM on the secure cloud at US$5.29/h,** with minCudaVersion 13.0, 160 GB of container disk and
port 8000/http.
- **Memory decides it.** The weights take 55.6 GB.
  - **H200:** about 68 GiB of cache is left at 0.92 utilisation. Per sequence, the 16 full-attention layers hold
    64 KiB per token (4 KV heads × 256 × 2 × bf16), which is 1.07 GB at 16,384 tokens and 2.15 GB at 32,768. The 48
    linear-attention layers hold a fixed state of about 0.15 GB (48 heads × 128 × 128 in float32, plus the convolution
    state). So about 60 sequences fit at full length at 16,384 (about 100 at a typical length) and about 30 at 32,768.
  - **H100:** about 16 GiB of cache is left, so about 12–25 sequences at 16,384 and fewer than 10 at 32,768. Decoding a
    27B model is bound by memory bandwidth (H200 4.8 TB/s against H100 3.35 TB/s). A batch that small makes the H100's
    tokens per dollar roughly half the H200's, and arm C would not fit at all.
- **Price.** The community H200 at US$3.59 would buy 5.6 h instead of 3.8 h. At the read it had no host with
  CUDA ≥ 13.0, so the pinned image would not run there. If the create finds one, the cheaper price may be used. PRICE is
  then the price read at the create, and the deadline follows from it.

### The cap and the deadline
- **Cap:** US$20.00 for the pod's whole life, from its create to its delete. **Raised before any pod (2026-11-28 ~00:05 UTC), on the operator's word: "You can use all balance on runpod. ... Go".** The RunPod balance read at 00:02 UTC was US$28.89; the cap is set to **US$27.00** (CAP_USD in the pod's env), leaving US$1.89 so the balance never reaches zero while the pod is alive (at zero RunPod wipes a pod and its data). The deadline formula is unchanged with 27 in place of 20. PAIR_AB stays on (A alone decides no claim). The desk deletes the pod; the pod's own RunPod-issued key is the backup deleter.
- **Deadline:** DEADLINE = POD_START + 20 / PRICE hours − 900 s. At US$5.29 that is 3.78 h of pod, and DEADLINE falls
  3.53 h after the create.
- **At DEADLINE the runner's watchdog stops everything:** the stop file, then the server killed. The 900 s reserve is
  for the last pull, the seal and the deletion.
- **If the pod is still alive at DEADLINE + 840 s,** it asks RunPod to delete itself with its own key. The key is kept
  in the runner's shell and never exported.
- **The desk:** pulls every 5 minutes (`pull.py --every 300`) and deletes the pod when the run completes or at
  DEADLINE + 900 s, whichever comes first.

### Throughput first
- **The probe:** 600 s into arm A, R0 is the server's generated tokens per second between 120 s and 600 s (vLLM's own
  counter, sampled every 30 s).
- **A continues iff** the projection of A ends before DEADLINE, and (PAIR_AB, on) A and then B both do. A alone decides
  no claim, so with PAIR_AB on A is not finished if B cannot follow it. This is our addition to the operator's rule: it
  stops more, never less. `PAIR_AB=0` turns it off.
- **B starts iff** now + A's server start + A's generation wall-clock × 1.10 ≤ DEADLINE.
- **C starts iff** now + A's server start + tokens_C / (R_A × 0.75) × 1.10 + 32,768 / 40 ≤ DEADLINE.
  - tokens_C = 490 × (s_A × 32,768 + (1 − s_A) × A's mean finished length). Every answer cut in A is assumed to run to
    32,768.
  - R_A is A's tokens over its wall-clock. The factor 0.75 allows for fewer, longer sequences in memory.
- **Before anything is measured,** the token model is the paper's cut shares with a finished answer at 8,000 tokens:
  A ≤ 5.30 M tokens, B ≤ 4.99 M, C ≤ 8.00 M. At 4,000 tokens: 4.00 M, 3.54 M and 6.70 M.
- **The tail:** the last sequences of an arm run in a thin batch, at about 40 tokens/s (our assumption), which adds
  16,384/40 or 32,768/40 seconds.
- **Arms not run are REFUSED on resources,** and the record and the report say so.

### The projection before the pod (project.py plan; fixed costs 25–50 min)
The fixed costs are the image pull, the 55.6 GB download at 100–250 MB/s (4–9 min), the hashing, the edit, three server
starts and the reserve. The throughput sources:
- The paper's D.3 says a 16,384-token pass "took about half an hour" for up to 512 answers. That gives at most about
  2,500 tokens/s, or 1,250 if the pass held 256 answers (the scout's §7). The paper's GPU is not stated.
- The WSP lane did 7,726 tokens/s with a 0.8B model on an H200. That is an upper context only.
- A bandwidth-and-compute estimate for 27B at a batch of about 100 on an H200 gives about 2,000–3,500 tokens/s.

| at US$5.29/h | A | B | C | fit in order under US$20 |
|---|---|---|---|---|
| 1,250 tok/s, short answers (4,000) | 1.09 h, US$5.77 | 1.05 h, US$5.54 | 2.48 h, US$13.10 | A, B |
| 1,250 tok/s, long answers (8,000) | 1.41 h, US$7.46 | 1.40 h, US$7.41 | 2.90 h, US$15.35 | A only, so with PAIR_AB the probe stops (about US$5 spent, all REFUSED) |
| 2,500 tok/s, short answers | 0.60 h, US$3.19 | 0.61 h, US$3.25 | 1.39 h, US$7.33 | A, B, C (about US$17.30) |
| 2,500 tok/s, long answers | 0.76 h, US$4.03 | 0.79 h, US$4.18 | 1.60 h, US$8.45 | A, B |

## Uncertainty at 490 × 1 (fixed now, so no result is read against a band chosen after it)
- **A's accuracy:** SE ≈ √(0.572 × 0.428 / 490) = 2.2 points, so the 95% interval is about ±4.4.
  - Agreement with 57.2 (inside the interval) means our setup lands where the paper's does. It does not show the same
    problems or the same engine.
  - A miss means our population or our stack differs. It does not refute the paper's 57.2, which was measured on other
    problems, and the B − A change is still read.
- **B − A:** the paper's own pair counts (439 right only with the edit, 182 only without, of 3,920) give a per-answer
  discordance of 15.8%. With one answer per problem, SE ≈ 1.8 points and the 95% half-width is about 3.5.
  - **Power** of the one-sided test at 0.05: 98% if the true change is 6.6, 73% at 4.0, 30% at 2.0.
  - **CERTIFIED** means the direction holds on our problems, our engine and our rebuild of the edit.
  - **REFUSED** means not decided at this size. A null result here is not a refutation of 6.6.
  - **B2's reading** "smaller than +6.6" (the upper end below 6.6) means our setup does not reproduce the size. It does
    not refute the paper's number on its own 490 × 8.
- **C − A and B − C:** the discordance at T 1.0 with a longer budget is unknown. At 25–35% it would give SE ≈ 2.3–2.7
  points.
- **C3's ratio** has an SE of about 0.4 when B − A ≈ 6.6, so its bands are coarse and it is printed as COMPUTED, never
  as a verdict.

## Method limits
- **One pod.** The pod holds no credential of ours and pushes nothing. The desk pulls `/results`, which is served
  read-only on port 8000, by `instruments/qwen-self-rewriting/stage3/pull.py`, which checks each file against the pod's
  index. The record is written on the desk by `tools/qwen-stage3-record.py`.
- **The code must be committed and pushed before the pod exists.** The pod fetches it from GitHub at AUDIT_SHA (the WSP
  lane's pattern), and the code list's hashes are in `STAGE3-CODE.sha256`.
- **One run.** No row is added, dropped or re-read after a result is seen. The control room does not contact the authors.

## How it is run (for the control room, on the operator's word)
1. Commit and push this note, `corpus/qwen-self-rewriting/stage3/` and `instruments/qwen-self-rewriting/stage3/`, and
   record the commit as AUDIT_SHA.
2. Read the catalog. List the pods first. Create ONE pod:
   - image `vllm/vllm-openai:v0.33.0`, gpu `NVIDIA H200` × 1, secure cloud, minCudaVersion 13.0;
   - 160 GB of container disk, port 8000/http;
   - env AUDIT_SHA, PRICE_PER_HOUR (the price read), and POD_START_EPOCH (`date +%s` on the desk just before the
     create call: the env is fixed before the real start is known, and an earlier time only moves the deadline earlier);
   - entrypoint `/bin/bash -c` and the start command at the head of `run.sh`.
3. `python3 instruments/qwen-self-rewriting/stage3/pull.py <pod> corpus/qwen-self-rewriting/runs/stage3/<pod> --every 300`
4. When the phase is `complete`, or at DEADLINE + 900 s: one last pull, then DELETE the pod, read it back to confirm,
   and read the billing.
5. `python3 tools/qwen-stage3-record.py corpus/qwen-self-rewriting/runs/stage3/<pod> --pod <pod>` writes
   `certs/qwen-self-rewriting-stage3.json`. The billed total is added from RunPod's billing read.

## Amendment S3-A1 (2026-11-28 00:43 UTC, before any arm ran)

The first pod (6muofpeqzx8fax, created 00:07:20 UTC) passed P1 (the base's 11 shards hashed whole) and the edit (EDIT-OK,
the 48 tensors' hash 72123fa2…, equal to Stage 1's), then stopped at setup at 00:09:29: the second reader
(verify_edit_torch.py) refused only because the base checkout holds huggingface_hub's `.cache` metadata folder, which the
edited copy does not — every tensor check passed (836 tensors, exactly the 48 differ, every target is the bf16 of x + 0.5).
The second reader now records that folder as skipped instead of comparing it. No arm ran; no answer was generated. The
same pod is restarted on the new commit with the same POD_START_EPOCH, so the cap counts from the first create.

## Amendment S3-A2 (2026-11-28 00:44 UTC, desk side only)

The desk's pull.py sends a plain User-Agent: RunPod's proxy answered Python's default with 403, so the desk's watcher saw no phase while the first pod sat failed for 33 minutes. Nothing on the pod changes.
