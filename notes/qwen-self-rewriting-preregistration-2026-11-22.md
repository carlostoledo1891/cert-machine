# Pre-registration — "Language Models Can Rewrite Their Own Weights", Stage 1: public files only

Registered 2026-11-22 11:36 UTC, before any check, download or range read. Drafted by an agent from the scouting note,
reviewed by the control room, which added the rulings below. A later change is an amendment, dated and committed before
the code or the read it changes.

## Control room rulings (they bind where they differ from the text below)
1. **The rule for a printed number stands as written:** CERTIFIED only on a match after rounding, REFUTED only when the
   value is more than one last-digit unit away under every reading, REFUSED in between.
2. **Shard 11 is also hashed whole.** It is 2.0 GiB and holds all 48 time-step bias tensors. It is streamed once, not
   stored, and its sha256 is compared with the published LFS value, so the bytes of the edit's targets are tied to the
   pin. Every other shard is read by range only, as the method limits say.
3. **Records** go where the last section proposes (`corpus/qwen-self-rewriting/`, `certs/`), with the rows as data
   committed before the run.
4. **Who asked.** An author of the paper asked for the review. That is stated here because it bears on independence;
   the authors supply files and explanations, and decide nothing.

## What is audited
The preprint "Language Models Can Rewrite Their Own Weights" (arXiv 2611.21885 v2). An author of the paper asked for an
independent review on 2026-11-22. The operator replied that the rules are written and timestamped before any
result is read, that the work uses our own code, and that the authors see the draft report first. The operator works
with Claude agents (Anthropic). This file covers Stage 1 only: what PUBLIC files decide, on a Mac with about 25 GiB of
free disk, no GPU, at no cost. The authors have released no files. The base model, Qwen/Qwen3.5-27B, is public.

## What Stage 1 cannot establish
- No accuracy number: not 57.2, 58.3, 57.8, 61.3, 63.8, 33.0, 55.0 or 70.2, and no interval, p-value or share of answers cut at the limit.
- Nothing about the authors' edits as they made them. Stage 1 sees an edit only as the paper describes it. Our rebuild of session 8's edit is ours. It is not their file, and no row says it is.
- Nothing about the damaged copy or the repaired copy. Neither is public.
- The revision the authors used. The paper states none. The revision read here is our choice, pinned below; I2 reports whether the weight files differ between revisions.
- How the authors' framework loads or casts the weights. Rows about a "stored" format are about the published files.
- Which tensor the paper means by "time-step bias". The paper names none. The reading in E1 is ours.

## Pins
- Paper: arXiv 2611.21885 v2 (18 Nov 2026 08:57:59 UTC). TeX source `notes/qwen-self-rewriting-2026-11-22/fetched/arxiv-src-v2.tar.gz`, 6,532,271 bytes, sha256 `35b1125320a0ac08dc295541381710238445bfc7150ad8a20968d41b9e69f11a`. HTML `fetched/arxiv-html-v2.html`, sha256 `cebec59cfa01f9c4f3edccc0197a1a2d1589b75a59b29ef99e10389b56ce4752`. A location below is the rendered number, then file:line inside the archive (files under `input/` or `tables/`).
- Model: `Qwen/Qwen3.5-27B` at commit `81a287ca484a5e71148f5beb7f367bb5286d70f9`, the head the scout recorded on 2026-11-22 (dated 2026-11-20). It is pinned at that commit: every URL carries the full hash, and `main` is never read.
- Files: `config.json` (4,134 bytes) and `model.safetensors.index.json` (126,601 bytes), whole. The 11 shards `model.safetensors-000NN-of-00011.safetensors` (55,563,022,432 bytes together), by range only: bytes 0–7 and the JSON header of each shard, then one range per tensor needed (the 128 output matrices of layers 0–63, the 48 time-step bias tensors). Shard sizes and sha256: `fetched/hf-api-qwen35-27b.json`, sha256 `c0febbdba96434ed271cc519631fde2c527eef76b2dd111d615e406ba410dceb`.
- I1, integrity (the stage stops if it fails): at the pinned commit the server reports, for each shard, the size and the LFS sha256 of that listing.
- I2, COMPUTED: the LFS sha256 of each shard at each of the 27 commits in `fetched/hf-qwen35-27b-commits.json`. It shows whether any revision carried other weight files.

## Read before these rules (so not blind)
- By the scout, from `fetched/`: `config.json` (64 layers; `layer_types` with 48 linear-attention and 16 full-attention; hidden size 5,120; MLP width 17,408), the tensor index (48 names ending `linear_attn.dt_bias`), the listing (shard sizes and hashes). The scout also redid part of the paper's arithmetic (SCOUT.md §3 "Stage 0", §6.1).
- While drafting, from the same files: the listing counts parameters in two dtypes (BF16 27,781,419,504; F32 8,448), and `config.json` has `"mamba_ssm_dtype": "float32"`. Of the paper's TeX, the experiments, details, results and second-protocol files and every table were read in full, the rest by search.
- Rows marked † are those these files may already answer. The stage's code still decides them at the pin. The arithmetic rows are not blind either: their inputs are printed in the paper.
- Not read by anyone here: a safetensors header, a tensor byte.

## The rule for a printed number (fixed now)
A printed number d has a unit u: one in its last printed digit. Our value x is exact. MATCH: |x − d| ≤ u/2.
NEAR: u/2 < |x − d| ≤ u. FAR: |x − d| > u. The test is made on exact rationals; for a norm or a standard deviation, on
the squares. A row is CERTIFIED only on MATCH under its first reading. It is REFUTED only on FAR under every reading
listed for it. Anything else is REFUSED, and x is printed under each reading. Every stored number is a dyadic rational:
sums, sums of squares, maxima and order statistics are computed on integers from the bit patterns, with no
floating-point accumulation. A decimal of ours that bounds something is rounded outward.

## Rows with a verdict
Names: "the layer-30 matrix" is `model.language_model.layers.30.mlp.down_proj.weight`. An output matrix of layer i is
`mlp.down_proj.weight`, `linear_attn.out_proj.weight` or `self_attn.o_proj.weight` under
`model.language_model.layers.i.`. That is our reading of the paper's "output matrices".

| id | the paper's sentence (location) | what we compute | CERTIFIED iff | REFUTED iff | REFUSED iff |
|---|---|---|---|---|---|
| S1 † | "in layer 30 of 64" (E.1, app_results.tex:44); "time-step bias +0.5 in all 48 linear-attention layers", "log decay rate +0.5, layer 62", "log decay rate -0.5, 9 layers in 40–50", "layer 63" (Tab. 13, app_protocol2.tex:45, 42, 43, 39) | `num_hidden_layers` and `layer_types` of `config.json`; from the 11 headers, the layers that hold tensors under `.linear_attn.` and under `.self_attn.` | config and headers both give 64 layers numbered 0–63 and the same 48 linear-attention layers; layer 62 is one of them; at least 9 of them lie in 40–50 | one of these fails (it is named) | a header cannot be parsed |
| S2 † | "rows 3068 to 3075 of the MLP output matrix (mlp.down_proj)" (E.1, app_results.tex:44–45); "In the eight damaged rows (139,264 weights)" (E.3, app_results.tex:199–200) | the header entry of the layer-30 matrix: its shape [r, c] | it exists with two axes, r ≥ 3,076 and 8 × c = 139,264 | it is absent, or r < 3,076, or 8 × c ≠ 139,264 | the header cannot be parsed |
| S3 † | "The damaged matrix is stored in bf16, like the rest of the model" (D.2, app_details.tex:75–76); "stored in bf16, the 16-bit number format of the model's weights" (Tab. 5, app_details.tex:54–55) | the dtype of every tensor in the 11 headers; entries per dtype | every tensor of the published files is BF16 | a tensor has another dtype (names, dtypes and entry counts listed) | a header cannot be parsed |
| S4 † | "in the layer-30 matrix and in 19 other output matrices of layers 0–10" (§3.2, 040experiments.tex:61–62); "for layer in [0, 1, 2, 3, 5, 6, 7, 8, 9, 10, 30]:" and "it applies the same rule to the linear-attention output matrices of layers 0–10" (Fig. 12, fig_notebook.tex:40, 73–74) | the set: `mlp.down_proj.weight` of the 11 quoted layers, plus `linear_attn.out_proj.weight` of every linear-attention layer in 0–10; its size; its total entries N | the set has exactly 20 tensors | it has another number | a layer in 0–10 holds more than one tensor that could be its linear-attention output matrix |
| W1 | "where σ=0.0111 is the standard deviation of the matrix's entries" (D.2, app_details.tex:73) | the exact variance of all entries of the layer-30 matrix, dividing by n; the n − 1 form is also printed | MATCH to 0.0111 | FAR | NEAR, or the two forms fall in different bands |
| W2 | "the norm of these rows is 3.85 in the published weights" (E.3, app_results.tex:201–202) | the exact sum of squares of rows 3068–3075 of that matrix: first axis, counted from 0, both ends included, 8 × c entries. Second reading: counted from 1 | MATCH to 3.85 under the first reading | FAR under both readings | anything else |
| W3 | "largest \|w\| in the eight damaged rows: 0.071 original" (Fig. 14, fig_found.tex:6) | the largest \|w\| on the same rows; the same second reading | MATCH to 0.071 under the first reading | FAR under both readings | anything else |
| W4 | "no other output matrix exceeds 162.3 times" (Tab. 1, tab_edits.tex:14); "against at most 162.3 times in every other matrix" (E.3, app_results.tex:158); "ratio = max_val / median if median > 0 else 0" (Fig. 12, fig_notebook.tex:31) | for each of the other 127 output matrices of layers 0–63 (63 MLP, 48 linear-attention, 16 full-attention): the largest \|w\| divided by the median \|w\|, the median being the lower middle value. Other readings: the mean of the two middle values; the largest signed w as numerator. M is the largest ratio; M over the 111 matrices that E.3 names is printed too. The row rests on the paper's "Every other weight is unchanged" (D.2, app_details.tex:75): the other matrices of the damaged copy are the base's | M is MATCH to 162.3 under the first reading (the matrix that attains it is named) | M is FAR under every reading | anything else |
| E1 † | "Session 8 raises the time-step bias of every linear-attention layer by 0.5" (E.9, app_protocol2.tex:68–69; also Tab. 13 and §3.6, 040experiments.tex:130–131) | our reading of "time-step bias": the tensor `linear_attn.dt_bias` of each linear-attention layer. From the headers: in each such layer, the tensors under `.linear_attn.` whose name contains `bias` | each of the 48 layers holds exactly one, named `dt_bias` | a linear-attention layer holds none | a layer holds more than one (the phrase does not single one out) |
| E4 | the same sentences | the edited bytes of the 48 tensors under each reading of the arithmetic: (a) y = x + 0.5 as an exact sum, rounded once to nearest, ties to even, in the tensor's stored dtype; (b) the same sum rounded once to bf16, the format Tab. 5 gives for edits; (c) the sum rounded to binary32, then to bf16; (d) if the stored dtype is not BF16: x rounded to bf16 first, then as (b). The specification file lists, per tensor: name, shard, byte range, dtype, shape, sha256 of the base bytes, sha256 of the edited bytes under each reading. Its own sha256 is recorded | E1 is CERTIFIED, every y is finite, both deciders write identical bytes, and all readings give the same value on every entry (the description fixes one edit) | E1 is REFUTED | the readings differ on some entry: the description does not fix the bytes. Each reading's hash is recorded; the authors' file would decide, in a later stage |

## COMPUTED rows (arithmetic restated; they decide nothing)
| id | the paper's numbers (location) | what is computed |
|---|---|---|
| S5 † | "Across one model family at 2B, 4B, 9B and 27B parameters" (§1, 010intro.tex:55) | the number of entries in the 11 headers: all tensors, and by group (`model.language_model`, `model.visual`, `mtp`, `lm_head`) |
| W5 | "holds a weight 1397 times its median" (Tab. 1); "10.1 damaged, 0.108 after its repair" (Fig. 14); "15.0 times the median magnitude of the matrix" (E.3, app_results.tex:203–204) | the median \|w\| of the layer-30 matrix in the base and its own ratio; the exact range the median can take in any copy that differs from the base in at most 139,264 entries; set beside 10.1 ÷ 1397 and 0.108 ÷ 15.0 with their rounding intervals. 1397, 10.1 and 0.108 belong to copies that are not public |
| E2 | — | per time-step bias tensor: shape, stored dtype, entries, byte range, sha256; the total number of entries the edit touches |
| E3 | "+0.5" (Tab. 13) | whether 0.5 is representable in the stored dtype and in bf16; entry by entry, whether x + 0.5 is; the count of entries where it is not; the set of realised y − x; if the stored dtype is not BF16, how many base entries bf16 cannot hold |
| A1 | 57.2, 58.3, 57.8, 61.3, 63.8; "439 answers right only with the edit against 182", "403 against 246" (E.9, app_protocol2.tex:65–66); "289 answers right only with the edit against 247" (E.4, app_results.tex:260); +6.6, +4.0, +1.1, +0.5 | (a − b) ÷ 3,920 for each pair; the integers B (the base model's correct answers out of 3,920) for which every printed accuracy and change rounds as printed. An empty set means the printed numbers cannot all hold |
| A2 | "[5.0, 8.1]", "[2.3, 5.7]", "[-0.9, 1.9]" (Tab. 13) | midpoint, half-width and half-width ÷ 1.96 of each interval, beside the printed change |
| A3 | sign tests with printed counts: 66 and 0, "p<10^-19"; 110 and 0, "p<10^-33" (E.3, app_results.tex:162–164, 223–224); Tab. 12 (65/1 to 388/11, "<10^-99"); Tab. 7; Tab. 8 (289 and 247, 0.038) | the exact one-sided sign-test p as a rational, beside the printed bound. The tables do not give enough for any permutation p (0.038, 0.045, 0.25, 0.009, "<10^-5", "<10^-4"): the per-problem differences are not printed. Computed instead: the smallest p that "100,000 flips" (D.3, app_details.tex:129) can report |
| A4 | "33.6% of the base model's answers against 26.1% for session 8 and 28.8% for session 2" (E.9, app_protocol2.tex:68); Tab. 9 (61.7 and 35.2; 18.8 and 80.5) | the accuracy among answers that finished: correct share ÷ (100 − share out of tokens), as an interval from the rounding of both printed numbers. It assumes that no answer that ran out of tokens counts as correct; the paper states that rule for answers "whose thinking is still open" |
| A5 | Tab. 12 (84.3, 7.3, 70.2; 388 and 11); "83%" (§3.6); "9.6 times" (Fig. 16, fig_visual.tex:8); "about 56%" (E.3); 110 against 117, 22 and 15 (E.3); "39.9" and "about 5%" (E.3) | column sums and means; damaged + turned right − turned wrong = repaired, per benchmark; each quotient |
| A6 | "158,399 weights of the damaged copy, 0.013% of them" (E.3, app_results.tex:204–205); "825 in the damaged copy" (E.3, app_results.tex:202) | 158,399 ÷ N with N from S4; with W1's exact σ, the expected norm 200σ√139,264 of the overwritten rows under the stated distribution, and its standard deviation 200σ ÷ √2 |

## Not registered
- Every accuracy claim and every claim about sessions, logs, seeds or grading (H1–H5, S1–S4, S7–S15 of SCOUT.md §3). They need the authors' files or a GPU.
- Session 1's edit ("time-step bias +3.0 in 7 linear-attention layers", Tab. 13): the 7 layers are not named. The edits at layers 8 and 63, and "a change of 0.6% and 0.1% of their norm" (Tab. 1): the direction is not public.
- 1397, 10.1, 0.108, 825, 39.7, 39.9, 0.002 and 158,399 as facts. They enter W5 and A6 only as printed numbers.
- The smaller models: "rows 1724 to 1731 of layer 11 of 24, rows 1660 to 1667 of layer 15 of 32, and rows 3420 to 3427 of layer 15 of 32" (E.1, app_results.tex:49); "at most 0.0124" (9B, E.3, app_results.tex:174); query heads "from 16 to 8" (4B, E.2, app_results.tex:123). Public files would decide them. No revision of those three repositories is pinned and none of their files is in `fetched/`. They need an amendment with pins before any read.
- Not found in the paper, so no row: a tensor name for the time-step bias; the hidden size; the MLP width; the entry count of any tensor (139,264 is the only count of base entries printed); the number of tensors; an exact parameter count.

## Controls (planted errors; each must be caught, and each is false by construction)
- K1, wrong offset: the range of rows 3068–3075 read two bytes late. Its sha256 must differ from the recorded one, and the two deciders' hashes must disagree when only one of them reads late.
- K2, a name removed: the list of 48 time-step bias tensors with one name deleted. E1 must fail at 47, and no specification may be written.
- K3, wrong constant: the edit built with +0.25. The check that recomputes y − x on every entry must reject it, and the specification hash must differ.
- K4, a dtype altered: a copy of one header with one tensor's dtype changed. S3 must list that tensor, and the length check (entries × bytes per entry = range length) must fail.
- K5, one bit flipped in a copy of the layer-30 matrix. Its sha256 and its census of bit patterns must change.
- K6, the number rule at its edges: x = d ± u/2 must be MATCH, x = d ± u must be NEAR, and any x beyond that must be FAR. A small matrix whose variance is worked by hand must come out exact.
- K7, a misquote: each sentence quoted above is searched in the pinned TeX (markup and spacing normalised: `$`, `~`, braces, `--`, `\_`, `\%`, `\texttt`, `\sigma`, line breaks). One altered quote must stop the stage.
A control that is not caught voids the rows that depend on it: they are reported REFUSED.

## Method limits
- Range reads only. No shard is downloaded whole. Each request names the full commit hash and one byte range. Requests are anonymous, one at a time, from one process.
- Every range is recorded: URL, first and last byte, length, sha256, time, and the commit and LFS hash the server reports.
- Two deciders that share no code (Python standard library; JavaScript). Each derives the list of ranges from the headers by itself; the two lists must be equal before any tensor is read. A tensor stays on disk only while both deciders read it (about 180 MB at most), then it is deleted. About 15.4 GB is read in all.
- A range cannot be checked against a shard's sha256, which needs the whole file. What ties the bytes to the pin: the commit in the URL, the LFS hash the server reports, the header's offsets, and two deciders agreeing on every hash.
- No GPU. No pod. No forward pass, no tokenizer, no generated token.
- The control room does not contact the authors. Only the operator writes to them.
- The code is written here. None of the authors' code is used; none is public. The third-party reconstruction (DukeCaesar/models-rewrite-own-weights) is not read by the code and not used.
- One run. A row that does not complete is reported incomplete, with what finished. No row is added, dropped or re-read after a result is seen.

## What happens after
- The result leads with what is not established (the list at the top), then the rows, each with its verdict or COMPUTED.
- Later stages each need their own dated rules and the operator's word: the authors' edit files against our specification, byte by byte; the authors' responses re-graded by two graders; a no-edit baseline at the model card's settings; a replay on a GPU. A GPU also needs a price quote first.

## Proposals for the control room (not rules)
- Records: `corpus/qwen-self-rewriting/claims.json` (these rows as data, committed before the run), `corpus/qwen-self-rewriting/PINS.json`, `corpus/qwen-self-rewriting/session8-edit-spec.json`, `certs/qwen-self-rewriting-base.json`.
- Reuse, in part: `instruments/wsp/weights.py` and `tools/wsp-weights.js` (the safetensors header parser, exact bf16 and binary32 conversion, rounding to bf16, the red-control pattern, pins, the agreement check). Both read two local checkpoints; the range reads and the statistics are new. `tools/wsp-side-claims.py` has the quote check (`must_contain`). The graders and the baseline tools belong to later stages.
- The targets row: `notes/qwen-self-rewriting-2026-11-22/targets-row.json`.

## Amendment A1 — rulings on the prepared code, before any read (2026-11-22 12:24 UTC)

The two deciders, the rows as data and the offline controls are written and committed with this amendment
(`corpus/qwen-self-rewriting/STAGE1-CODE.sha256` lists them). No request has been sent to the model's host. The agent
that prepared them named the places where the rules left a choice; the control room rules on them here.

1. **Each decider reads every range itself.** The method above had one copy of a tensor read by both. Now each decider
   fetches its own bytes, so the transport code is cross-checked by every hash. The traffic doubles, to about 35.5 GB.
2. **Shard 11 is streamed once by each decider** and hashed whole against the published LFS value. While it streams,
   the hashes of the tensors needed from it must equal those of the range reads.
3. **I2 reads the listings of the other 26 commits.** That is metadata only, no weight bytes.
4. **W4 has a fourth reading** (the largest signed value over the mean of the two middle magnitudes). REFUTED now needs
   a far miss under all four, which is harder to reach than under three.
5. **I1's rule as coded:** two sources per shard (the headers the host returns on the first read, and the listing at
   the pinned commit). It passes when every shard has at least one source giving size and LFS sha256 and no source
   gives another commit, size or hash. The stage also stops if `config.json` or the tensor index at the pin differ from
   the fetched copies.
6. **Which rows a control voids if it is not caught:** K1: W2, W3. K2: E1, E4. K3: E4. K4: S3. K5: W1, W4. K6: W1–W4.
   K7: all ten rows with a verdict.
7. **The record is `certs/qwen-self-rewriting-stage1.json`.**
8. **Not blind, stated again:** the arithmetic rows A1–A5 need no network. Their values were computed in the offline
   dry run and seen by the preparing agent. They are recorded by the run, and they decide nothing.
9. **If the system Python cannot open the connection,** the same decider runs under the other installed Python, and
   that is reported as a deviation.

