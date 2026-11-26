# Reveal draft: Theorem C35 and Chen's case R(7) (PRIVATE, drafted 2026-11-22)

## 1. What is not established (read first)

**Neither result decides R(3,10).** Whether a (3,10;40)-graph exists is as open after them as before.

1. **The R(7) statement holds only if six premises hold, and the run checks none of them** (`claude-r7/PROD-RESULT.md`
   item 1; wording of the premises from `claude-r7/PROD-PREREG.md`).
   - P1. e(3,8,27) = 85 (Goedgebeur–Radziszowski). Taken from the literature.
   - P2. McKay's list of (3,8;27)-graphs is complete. Taken from the literature. Our filter of the list finds 4 graphs
     with 85 edges and none below (`r7-scout/README.md`). That does not test completeness.
   - P3. `configs.bin` is the complete list of configurations. Three enumerations agree and ours is byte-identical
     (sha256 76c2666b…). That is agreement, not a checked proof.
   - P4. `r7cnf.c` writes the CNF that `REDUCTION.md` §5 describes. Read by eye, and compared with Chen's builder on 8
     configurations (`claude-r7/REDUCTION.md` §5, §7). Not formalised.
   - P5. The derivation in `REDUCTION.md`. Not formalised. Astra read it (`codex-r7-scout/r7-reduction-review.json`);
     the control room did not re-run that reading.
   - P6. The checkers lrat-check and cake_lpr.
2. **The R(7) proofs are not at home.** Each CNF and proof was deleted on the pod after both checkers read it, as
   registered (about 2.5 TB otherwise). Only the ledger came home: per configuration, the sha256 of the CNF and of the
   proof, and each checker's verdict line. A proof can be made again from the pinned tools. On the 1,200 sampled
   configurations the CNF hashes matched the Mac's on all 1,200, the proof hashes on 1,184 (`PROD-RESULT.md` item 2).
3. **The ledger is the pod's own account of what its checkers said.** Independent of it there are the four controls,
   our own decider on 1,002 of the 977,008 configurations, and our own tally of the ledger (`PROD-RESULT.md` item 3).
4. **One operator, three tracks.** The two chats and cert-machine all work for the operator, and cert-machine is a
   Claude model too (Claude Opus 5.5, `cert-machine-r1/P1-PREREG.md`). "Own" and "independent" here mean code written
   without reading the other track's code (`control-room-2026-11-22.md`, round 2). They do not mean a second party.
5. **Nobody outside has read any of it.** No referee, no outside replay, no reply (`PROD-RESULT.md` item 5).
6. **Several sources are unrefereed.** The case R(7) is defined in Chen's report (Zenodo, version 2, 26 Oct 2026),
   which calls itself a progress report (`audit/chen-23678020/chen-v2.txt`). Also unrefereed: the four δ ≥ 5 claims,
   McCrea's deposit, Unsolved Lab's page, Pandey–Ravi's preprint (`prior-art-2026-11-21.md` §1; `audit/AUDIT-RESULT.md`).
7. **The novelty of Theorem C35 rests on one reading of prior art.** "Not found anywhere" is the scout's finding of
   21 Nov, made by an agent, with five flags it did not verify (`prior-art-2026-11-21.md` §5 and "Flags"). It must be
   read again on the day of the reveal.
8. **The corollary is not new.** "No vertex of degree 4" is known four times, all unrefereed. Here it also needs
   Goedgebeur–Radziszowski's uniqueness of the (3,9;35)-graph, a computer enumeration we have not checked
   (`cert-machine-r1/P1-RESULT.md`, Corollary).
9. **Smaller limits.** C35 (`P1-RESULT.md`): the Lean statements were read once, by cert-machine; `leanchecker
   --fresh` was not run; there is no human-readable proof of Lemma P. R(7): one hash in `OUT.sha256` is of an earlier
   state of `RUN-MACHINE.txt` (`PROD-RESULT.md` item 4); the pilot's pin of `r7cnf.c` (350a9f73…) no longer matches
   the file (e9a4e759…), and the pinned bytes are kept as `r7cnf_pilot.c` (`claude-r7/PINS-NOTE.md`).

About this file: a draft for the operator to decide whether and how to reveal. Nothing was sent, staged or committed.
Paths are relative to `notes/ramsey-r310-scout-2026-11-21/`; a file is named with its folder once, then without.

## 2. The two statements, exactly as they may be said

**A. Theorem C35.** The first sentence of the sealed text (`~/Projects/seals/r310-c35-2026-11-22/src/STATEMENT.md`):

> Any finite triangle-free simple graph with no independent set of size 10 that contains an induced copy of the
> circulant C35(1,7,11,16) (vertices 0..34, u ~ v iff v − u ≡ ±1, ±7, ±11 or ±16 mod 35) has at most 39 vertices, and
> any four distinct vertices outside the copy induce a 4-cycle.

Its conditions:
- Lean 4.35.0, Mathlib 56a00585…; the axioms are propext, Classical.choice and Quot.sound only; Lemma P is checked
  by the kernel on a 32,529-node certificate, with no native code (`P1-RESULT.md`, rows L and B).
- Every pre-registered row is CERTIFIED: S, D1, D2, L, B, and K by three checkers (`P1-RESULT.md`, table).
- The sealed text adds that Exoo's 39-vertex graph attains the bound. "The bound 39 is attained" may be said:
  control C1 decodes a 39-vertex graph, triangle-free, α = 9, outside C4. That Exoo's graph is one rests on the two
  chats' checks (`codex-r2/cert-machine-handoff.json`, `claude-r1/REPLY-r1.md`), not on cert-machine's record.
- The corollary only as: "given Goedgebeur–Radziszowski 2013, Theorem 3, no vertex of degree 4; known before".

**B. Chen's case R(7).** The wording of `PROD-RESULT.md`, "The statement, as it stands":

> If P1–P6 hold: no 9-regular triangle-free graph on 40 vertices with independence number at most 9 has two
> non-adjacent vertices with exactly 7 common neighbours.

Its conditions:
- The six premises are named in the same breath, every time.
- `CERTIFIED-UNSAT` is the word for each configuration's refutation: 977,008 of 977,008 (879,379 at level 3, 97,627
  at level 4, 2 on the full CNF), each accepted by lrat-check and cake_lpr (`PROD-RESULT.md`). The statement as a
  whole has no verdict word in the records; the control-room log says the case is closed "under premises P1–P6".
- The rules were timestamped at 02:13 UTC on 22 Nov, before the pod existed. Four controls passed before production.
- Chen's R(7) is the 9-regular sub-case with maximum non-adjacent codegree 7; their report has 365 of 464 cubes
  certified and 99 open (`chen-v2.txt` §7.4). Under P1–P6 our statement covers it, by another route.

**Sentences that must NOT be said:**
- "R(3,10) is determined", "R(3,10) = 40", "solved", "settled", "one step from R(3,10)".
- "Proved", "a theorem" or "CERTIFIED" for statement B without "if P1–P6 hold".
  "First", "most complete", "strongest", "a record", for either.
- "The 9-regular case is closed." Only pairs with exactly 7 common neighbours are covered.
- "Every 9-regular (3,10;40)-graph has codegrees at most 6." That needs Chen's Lemma Mc, not a row of our audit.
- "Independently verified", "verified by a second party", "audited". See item 4 above.
- "The proofs are available" for B. The ledger is; the proofs were deleted.
- "New" for the degree-4 corollary. "δ ≥ 5 certified by us" without the uniqueness premise.
- "McKay's list was checked." "The reduction is formalised." "A human proof of Lemma P."
- "Chen was wrong", "we fixed Chen's case". Their report says R(7) is open; nothing of theirs is refuted here.
- "This answers Unsolved Lab's M20", before their page is read again that day.

## 3. Page outline (one report page under /reports; outline only)

Born from the template (`design/` tokens, components, template), English, every number from a gated record. The slug
and title are proposals, not decisions: `/reports/r310-c35-r7.html`; "Two cases of the 40-vertex question behind
R(3,10): one proved in Lean, one closed only under six premises".

1. **What is not established.** The nine items of section 1, first; "neither decides R(3,10)" in the first lines.
2. **The question.** 40 ≤ R(3,10) ≤ 41; Exoo, Goedgebeur–Radziszowski, Angeltveit cited first (`PLAN.md` §3, P4).
3. **Theorem C35.** The statement, then each check with its verdict word (`P1-RESULT.md`). S, statement fidelity:
   CERTIFIED (read once). D1, SAT decider: CERTIFIED. D2, non-SAT decider: CERTIFIED (403,541 nodes, no
   configuration). L, Lemma P without native code: CERTIFIED. B, the bridge: CERTIFIED. K, second checkers: CERTIFIED
   by three checkers, `--fresh` not run. Corollary: CERTIFIED given one named premise, and known before.
4. **What would have caught a wrong result.** Controls C1–C5 and what each did, with the note that cake_lpr exits 0
   on a truncated proof, so its `s` line is the verdict (`P1-RESULT.md`, D1).
5. **Chen's case R(7), under six premises.** The statement, then a premise table with how far each was checked:
   P1, P2 from the literature; P3 COMPUTED three ways, byte-identical once; P4 READ; P5 READ by the other chat, not
   re-run; P6 the tools. Then the run: 977,008 of 977,008 `CERTIFIED-UNSAT`; C-SAT, C-CORES, C-TRUNC, C-IDENTITY PASS
   (`claude-r7/prod-out/CONTROLS.txt`); the cross-check of 1,000 plus the two full-CNF configurations; our own tally.
6. **What is at home and what is not.** The ledger; the deleted proofs; how one proof is made again; 1,184 of 1,200.
7. **Names that collide.** Our Lemma P (on C35) is not Chen's Lemma P (`chen-v2.txt` §3). Lemma R7 is Chen's.
8. **Whose work this uses.** Section 5 below.
9. **How to re-run it.** Pins, tool versions, commands, the two seal digests. Then the template's closing block.

Not on the page: the R(6) probe, the global scout, the multitrack, pod ids, the chats' messages. The lane files do
not print COMPUTED: the outline uses it only for the steps `REDUCTION.md` marks "C", computed by named code.

## 4. Artifacts

Bytes are read from disk (22 Nov); "today" marks a hash made for this draft. Small outputs in each seal are unlisted.

| Would be published | Bytes | sha256 | Record |
|---|---|---|---|
| **C35 seal, 37 files** (archive) | 1,085,440 | digest ed00c76571823fc3e412ea029b9aacdb36678a5bffc8ebfd799a3ca75f9969e4 | control-room log, 02:38 UTC |
| `P1-PREREG.md` (+ `.ots`, 492) | 4,913 | fdc44622…bc7f80 | `P1-RESULT.md` |
| `P1-RESULT.md`; `P1-SHA256SUMS` (20 hashes) | 8,752; 1,725 | f9c264b9…; 2e956639… | today |
| `lean/PathLemma.lean`, `LemmaPCheck.lean`, `LemmaPCert.lean` | 17,875; 3,769; 566,315 | 3868999a…; 415a6a89…; 8c3029bf… | `P1-SHA256SUMS` |
| `lean/Outside.lean`, `OutsideSize.lean` (Codex's, unchanged) | 3,659; 4,718 | 55fc5e99…; 24980e4a… | `P1-SHA256SUMS` |
| `lean/NoDegreeFour.lean`; `ControlC4`, `ControlC5`, `ControlC5Check` | 3,194; 35,338; 638; 3,861 | 8c8e9c96…; d4dd94ec…; c328041e…; aa71b755… | `P1-SHA256SUMS` |
| `d2/lp_search.c`, `lp_counts.c`, `gen_pieces.py`, `certAE.txt` | 6,586; 3,935; 4,151; 367,675 | 4a701c96…; e3c1b121…; de877051…; c44bb7a7… | `P1-SHA256SUMS` |
| **Not in the C35 seal, used by rows D1 and K:** `cm_encode.py`, `cmp_cnf.py` | 3,571; 3,396 | f77b25e4…; 720c8dc2… | `P1-PREREG.md`, pins |
| `codex-r2/c35-direct-proof.tar.xz` (`target.lrat` 179 MB, `path.lrat` 15 MB per `PLAN.md`) | 44,346,848 | 956b2dfb… | `P1-PREREG.md`, pins |
| `k-replay/c35.ndjson` (the export; can be made again) | 27,750,870 | daf9c43c… | `P1-RESULT.md`, K |
| **R(7) seal, 33 files** (archive) | 245,770,240 | digest 75dd6cf73a79b7d95b751136da8a6a8ebb8f994710875d731417dd057fe985eb | control-room log, round 5 |
| `PROD-PREREG.md`; `PROD-PINS.sha256` (18 pins); each + `.ots` | 6,059; 1,529 | 99731718…; f5af8915… | `PROD-PREREG.sha256` |
| `PROD-RESULT.md`; `REDUCTION.md` | 4,090; 10,035 | c1317327…; dd29496a… | today; `PROD-PREREG.sha256` |
| `configs.bin`; `cores_e85.g6` (4 graphs out of McKay's list) | 9,770,080; 244 | 76c2666b…; 6b237361… | `PROD-PINS.sha256` |
| `r7-prod-bundle.tar.gz` (holds lrat-check and cake_lpr sources) | 3,502,554 | 5666807c… | `PROD-PREREG.sha256` |
| `prod-out/prod.tsv`, the ledger (977,008 rows and a header) | 231,996,228 | ba545601b42d7796ff8e8dc8b8d671f05f83ce14c24c90bb484b985dbeb47793 | `PROD-RESULT.md` |
| `prod-out/`, ten more files (controls, tally, logs) | 285,098 the largest | seven in `OUT.sha256`; not `prod.log`, `run.log` | `prod-out/OUT.sha256` |
| `xcheck_1000.txt`; our `r7own.py`, `r7list.c`, `tally_prod.py`, `PROD-TALLY-own.json` | 6,886; 8,465; 4,291; 3,781; 1,078 | c8b4e37a…; ffe08502…; 80b849c5…; f3d38bfa…; 12a21a74… | pins; `r7-scout/SHA256SUMS`; today |
| `r7-reduction-review.json` (Astra's reading) | 3,081 | ffb09377… | today |

**Stays private:** `PLAN.md`; `control-room-2026-11-22.md` (messages to the chats, pod ids, notes of the RH lane);
`prior-art-2026-11-21.md` as a file (its facts go on the page after the re-check); the chats' round folders, but for
the bundle and the review above; the multitrack goal draft; the private progress page; `audit/` (a separate
decision; it holds third parties' PDFs and repositories); this folder.
**Third parties' bytes are cited, not re-hosted:** McKay's `r38_27.g6` (sha256 9a2e9723…, 477,142 graphs), Exoo's
matrix (sha256 45581492…), Chen's report and repository, McCrea's deposit. The R(7) seal already holds four of
McKay's graphs and the two checkers' sources; opening it whole re-hosts those (licences: section 7).

**The seals.** Both are verify-seal-v2 bundles in `~/Projects/seals/`. Their digests are already public, as lines 43
and 44 of `seals/registry.jsonl` (commits d484835f and 200ea669). A reveal would open them: publish the files with the
salt and the manifest, so that anyone re-derives the digest and reads the anchor's date, as in
`seals/reveals/claimbox-intake-2026-11-05/`. v2 can also reveal one file and keep the rest sealed
(`instruments/seal/README.md`). The sealed files carry "PRIVATE" in their titles and cannot be edited without breaking
the digest. Both OpenTimestamps receipts were pending a Bitcoin block when the log was written. The R(7) archive is too
large for a plain repository file; where it goes is a step in section 7.

## 5. Credits

- **The operator** (Carlos Toledo): the target, the scout, the two chats run side by side, every go and every cost.
- **The Claude chat.** For C35: the question "does a (3,10;40)-graph contain an induced C35", its reductions, Lemma P
  and the short argument, and the first enumeration (`claude-r1/REPLY-r1.md`, `claude-r2/STATUS.md`). For R(7): the
  reduction, the enumeration, the CNF generator, the pipeline and the run's design (`REDUCTION.md`, `PROD-PREREG.md`).
- **The Astra 6.2 chat, in Codex.** For C35: the direct CNF and its LRAT proofs, the claim as handed to cert-machine,
  and the Lean bridge `Outside.lean`, `OutsideSize.lean` (`codex-r2/cert-machine-handoff.json`, `split-result.json`).
  For R(7): the second reading of the reduction and the counting rules (`codex-r7-scout/`). The brief gives this chat
  "the C35 statement"; the round files give the question and Lemma P to the Claude chat; the seal credits both
  (question 5).
- **cert-machine.** For C35: Lemma P checked by the kernel, the two deciders written from the statement, the
  controls, the second checkers (`P1-RESULT.md`). For R(7): the byte-identical enumeration, its own decider on 1,002
  configurations, the reading of the controls, the tally, the pod (`control-room-2026-11-22.md`, `PROD-RESULT.md`).
- **Others, cited first on the page.** Exoo: the 39-vertex graph and R(3,10) ≥ 40. Goedgebeur–Radziszowski: the
  uniqueness of the (3,9;35)-graph, e(3,8,27) = 85 and the tables. McKay: the graph lists. Angeltveit: R(3,10) ≤ 41.
  Chen: the case R(7) and its Lemma R7, the MTF argument, Theorem A; they state every published fact their Lean uses
  as a hypothesis. McCrea, Daugherty–Ward–Ryan, Pandey–Ravi and algal-lab: the earlier claims our audit read.
  Unsolved Lab: M20, which lists the C35 extension as open, and M09.
- **Tools.** CaDiCaL 3.0.1; drat-trim's `lrat-check.c` (Marijn Heule, per `codex-r2/split-result.json`); cake_lpr
  (tanyongkiam/cake_lpr@033aad53); Lean 4.35.0 and Mathlib 56a00585; nanoda 0.4.19; con-leche; kissat (control C1);
  nauty. The records name no other author; read each repository that day and credit each as they ask.

## 6. Two texts

**X post** (one post; 269 characters, counting the link as 23):

> Is there a 40-vertex graph with no triangle and no 10 pairwise non-adjacent vertices? Still unknown. With Claude and
> Astra 6.2, I ruled out two families of candidates: one by a Lean proof, one only under six premises, which the page
> lists first. [link]

**HANDOFF line** (two sentences):

> R(3,10) lane REVEALED [date]: Theorem C35 CERTIFIED (an induced C35(1,7,11,16) in a triangle-free graph with no
> independent 10-set forces at most 39 vertices; Lean, the three standard axioms, Lemma P by the kernel), and Chen's
> case R(7) closed only under premises P1–P6, none of them checked by the run (977,008 of 977,008 configurations
> CERTIFIED-UNSAT by lrat-check and cake_lpr; ledger sha256 ba545601…). Neither decides R(3,10); the R(7) proofs were
> deleted on the pod by design, nobody outside has read either record, and the page is /reports/[slug].html.

## 7. The steps of a reveal

Re-checked that day, before anything else ("web" marks what the files cannot answer):
- [ ] web: 40 ≤ R(3,10) ≤ 41 still stands; no paper decides it.
- [ ] web: Chen's Zenodo record and repository: any version after v2 of 26 Oct; whether R(7) is still open there.
      Their Lemma Mc, read, before any sentence about codegrees at most 6.
- [ ] web: Unsolved Lab's page: M20 still open, M09, any change since 1 Oct.
- [ ] web: a new search for the C35 statement (arXiv, Zenodo, GitHub), and the flags of `prior-art-2026-11-21.md`.
- [ ] web: Goedgebeur–Radziszowski 2013 in their own words: Theorem 3, e(3,8,27) = 85, |R(3,8;27,85)| = 4.
- [ ] web: McKay's page: `r38_27.g6` still at sha256 9a2e9723…, and their own word for "complete".
- [ ] web: licences and terms for `lrat-check.c`, the cake_lpr sources in the bundle and McKay's four graphs; each
      person's name as they write it.
- [ ] `shasum -c` on `P1-SHA256SUMS`, `PROD-PINS.sha256` and `OUT.sha256` (one known mismatch, `RUN-MACHINE.txt`);
      `seal.py open` on both seals with `--registry`; the OpenTimestamps receipts upgraded and verified.

Then, once the six questions of section 8 are answered, in this order:
- [ ] The records copied byte for byte into `corpus/`, a `certs/` record written by a tool with `--check`, its
      battery in both registries. Explicit files staged, never the notes folder. Data committed before the page.
- [ ] The ledger and the R(7) archive placed (`PLAN.md` §3, P4 names a Zenodo deposit); the host's file limit read.
- [ ] The `corpus/targets.json` row: R(3,10) itself OPEN; the two results BUILT, with their conditions; the finding
      from the prior-art file; the cost (about US$7, `PROD-RESULT.md`). `PLAN.md` §3 P0 asks for this row to be
      written in this folder first; no such file exists yet.
- [ ] The HANDOFF line above and the TASKS BACKLOG entry, in the same commit.
- [ ] The page: a builder from the template, `make page R=[slug]`, its own light share card. Listing it on the index
      also runs `make control` (15–18 min, `HANDOFF.md`).
- [ ] The seals opened into `seals/reveals/`. Then the push: it is the reveal itself, so it waits for the word.
- [ ] Outside notices, one at a time, each on the operator's word: an issue on Chen's repository; a note on M20
      (`prior-art-2026-11-21.md` §3 says Unsolved Lab has no submission process); the X post. No e-mail is started.
      Afterwards the private progress page is updated.

## 8. Open questions for the operator

1. Reveal now, or only after P3–P5 have a checked form? (now / after)
2. Both results on one page, or C35 alone first? (both / C35)
3. One outside reader before the page goes live? (yes / no)
4. The audit of the public (3,10;40) claims on the same page? (yes / no)
5. Credit both chats together for C35, by model name, as the sealed statement does? (yes / no)
6. An issue on Chen's repository as the first outside notice? (yes / no)

## Annex: where the source files disagree

- **When P1 was registered.** `P1-PREREG.md` says "written ~17:35 UTC"; `P1-RESULT.md` says its receipt was submitted
  at 17:22 UTC, and the receipt's file time is 17:22 UTC.
- **cake_lpr.** `PLAN.md` §6 says every C35 row is CERTIFIED "except cake_lpr", lists it under "Next" and gives 15 of
  39 for McCrea. `P1-RESULT.md` D1 has cake_lpr accepting both proofs; `AUDIT-RESULT.md` A5 has 39 of 39.
- **The native axiom.** `PLAN.md` §1 and `prior-art-2026-11-21.md` say the bridge rests on a `native_decide` axiom;
  `P1-RESULT.md` L and B say it does not. The first two were written before row L.
- **lrat-check on `path`.** 0.6 s in `cert-machine-r1/README.md`, `PLAN.md`, `P1-PREREG.md`; 0.31 s in `P1-RESULT.md`.
- **The C35 seal's date.** "Sealed 2026-11-22" (its `STATEMENT.md`), "held by 2026-11-21, the commit's local date"
  (control-room log). One moment: 02:38 UTC on 22 Nov, 23:38 local on 21 Nov.
- **Wording.** `r7-scout/README.md` says "7 common neighbours", the other R(7) files "exactly 7". For P6,
  `REDUCTION.md` §7 adds "and CaDiCaL's proofs as they accept them" to the two checkers of `PROD-PREREG.md`.
- **Who stated C35.** Section 5: the brief, the round files and the sealed statement give three different splits.
