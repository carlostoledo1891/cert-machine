# R(3,10): Theorem C35, and a second computation of the case R(7)

This folder is the public record behind two boxes of the live page "R(3,10), in the open"
(https://carlostoledo.co/r310/). Every file here but this README was private until 2026-11-23, when it was published
unchanged. The titles of many files still say "PRIVATE": that was true when they were written.

**Neither result decides R(3,10).** 40 ≤ R(3,10) ≤ 41 stands (Exoo; Angeltveit, EJC 32(4) P4.30, 2025). Whether a
triangle-free graph on 40 vertices with no independent set of size 10 exists is as open as before.

## What is not established (read first)

1. **R(7) was excluded first by Zhiyang Chen's run `r310_ralph`, not by us.** His claim C-004, "No R(7) extension for
   any of the four 27/85 seeds over all 977,008 admissible package pairs, no cutoffs", entered his `ralph/CLAIMS.md`
   in round 1, commit 3248382 (2026-11-21 16:50:52 UTC), labelled `enum`, "acceptance pending". Round 2, commit
   ab6d5eb (17:49:01 UTC), relabelled it `cert`, "CONFIRMED, cert (custom trace)", over a hand reduction, not Lean
   (github.com/jeffchen006/Ramsey-R3-10). Our rules were timestamped on 2026-11-22 at 02:13 UTC, about nine hours
   later. Ours is a **second computation** of that case. Our files cite only his report v2 (Zenodo
   10.5281/zenodo.23678020, 26 Oct 2026) and his repository as of 27 Oct (commit 1473adf8); we read his run on
   23 Nov. Our reduction uses his Lemma R7, and our CNF was compared with his October builder on 8 configurations
   (`r7/reveal/06-REDUCTION.md/files/REDUCTION.md`, lines 33 and 109–111). By our re-implementation of his
   `pair_packages.py` (not a run of it), our 977,008 configurations are his package pairs, set for set; his logged
   package counts match ours on all four cores.
2. **The R(7) statement holds only if its premises hold**, status as of 22 Nov 19:13 UTC
   (`r7/after-seal/claude-r7/PROD-RESULT.md`):
   - P1 e(3,8,27) = 85 (Goedgebeur–Radziszowski) and P2 the list of (3,8;27)-graphs is complete (McKay's data page
     credits completeness to Brinkmann and Goedgebeur, 2012): from the literature, not checked here.
   - P3, every configuration is one of the 977,008 records: a SAT cover, unsatisfiable on the four cores, accepted by
     both checkers, two generators giving the same clauses (`r7/after-seal/control-room-checks/p3-pod/P3-RESULT.md`).
     It still rests on the definition of a configuration and three exchanges; in Lean it is a hypothesis.
   - P4, the CNF is the formula: T0 and T1 are proved in Lean (`r7/after-seal/claude-r7/p4-lean/R7CnfSound.lean`;
     accepted by nanoda, con-leche and `leanchecker --fresh`). T2 is computed, not proved: on all 977,008 rows a
     program compiled from the Lean definition writes the bytes whose hash and size the ledger records
     (`r7/after-seal/control-room-checks/t2-pod/T2-RESULT.md`). Lean holds no instance of "every CNF is
     unsatisfiable"; between a checker's verdict on a file and that statement stand T2, the checkers' own reading of
     the bytes, and the identity of the embedded data with the pinned files (an evaluation, not a kernel fact).
   - P5, the derivation: a Lean chain ending in `R7ProductionClosing.no_r7_production`
     (`r7/after-seal/codex-r7-scout/`), a conditional whose hypotheses are P1, P2, a census sieve, the cover and
     the unsatisfiability of every CNF; read once by one agent (`r7/after-seal/control-room-checks/P5-READ-4.md`).
   - P6, the two proof checkers, lrat-check and cake_lpr.
3. **The R(7) proofs are not here.** Each CNF and proof was deleted after both checkers read it (about 2.5 TB). The
   ledger keeps each CNF's and proof's sha256 and both verdict lines; any proof can be made again from the pinned
   tools. The ledger itself (232 MB) is on the Zenodo-later list below.
4. **The ledger is the run machine's own account of what its checkers said.** Independent of it: four controls
   before production, our own decider on 1,002 configurations, our own tally, and T2.
5. **One operator; Claude and GPT models; no second party.** "Own" and "independent" mean code written without
   reading the other track's code. Claude models also worked on Chen's side (his final report names a Claude
   Opus 5.5 re-check of R(7)).
6. **Nobody outside has read any of this.** No referee, no outside replay, no reply yet.
7. **C35's novelty rests on one agent's reading of the literature (21 and 23 Nov).** The induced-C35 question had
   been posed in public at least three times: Unsolved Lab's M20 (1 Oct 2026, "not run"); the public repository
   andrey-kokoev/marici, note `research/chatgpt/ramsey/induced_35_core_five_pentagon_extension.md` (dated 9 Nov,
   committed 16 Nov 2026: the five new vertices must induce C5, τ₈(C35) = 9, "this extension family has not been
   excluded"); and an idea-scout note of Chen's run (`review/ideas/fable_G.md`, 21 Nov, a SAT run that timed out
   at 13 minutes). None of them decided it.
8. **The corollaries are not new in kind.** "No vertex of degree 4" is known four times, all unrefereed. Both
   corollaries below need Goedgebeur–Radziszowski's uniqueness of the (3,9;35)-graph, a computer enumeration not
   checked here.
9. **Smaller limits.** C35: the Lean statements were read once; `leanchecker --fresh` was not run for C35; there is
   no human-readable proof of Lemma P. R(7): one hash in `prod-out/OUT.sha256` is of an earlier state of
   `RUN-MACHINE.txt` (the end time was appended after hashing); the pilot's pin of `r7cnf.c` (350a9f73…) is not the
   production file (e9a4e759…).
10. **A seal proves possession of exact bytes by a date, nothing else** (`instruments/seal/README.md`).

### A correction printed beside a sealed text

The sealed `r7/reveal/05-PROD-RESULT.md/files/PROD-RESULT.md`, line 25, says: **"It is Chen's open case R(7)."**
That is out of date. It was written on 22 Nov at 08:36 UTC from Chen's report v2, which lists R(7) as open; his run
had excluded it the day before (item 1). The sealed bytes cannot change without breaking their salted hash, so the
correction stands here. The same sentence is at line 50 of the later, unsealed
`r7/after-seal/claude-r7/PROD-RESULT.md`; the same correction applies. The sealed 08:36 text also says the run
"checks none" of the premises: true of the run; P3–P5 were worked on afterwards (item 2).

## The two statements

**Theorem C35** (`c35/files/STATEMENT.md`, sealed). Any finite triangle-free simple graph with no independent set of
size 10 that contains an induced copy of the circulant C35(1,7,11,16) (vertices 0..34, u ~ v iff v − u ≡ ±1, ±7, ±11
or ±16 mod 35) has at most 39 vertices, and any four distinct vertices outside the copy induce a 4-cycle.
Lean 4.35.0, Mathlib 56a00585; axioms propext, Classical.choice and Quot.sound only; Lemma P is checked by the kernel
on a 32,529-node certificate, with no native code. Every pre-registered row is CERTIFIED (`c35/files/P1-RESULT.md`).
The bound 39 is attained by a 39-vertex graph (control C1).

Two corollaries, both conditional on Goedgebeur–Radziszowski 2013, Theorem 3 (every triangle-free graph on 35 vertices
with no independent 9-set is C35(1,7,11,16)):
- In Lean (`c35/files/lean/NoDegreeFour.lean`): a triangle-free graph on 40 vertices with no independent 10-set has
  no vertex of degree 4. Known before.
- **In prose, not in Lean:** in a triangle-free graph G on 40 vertices with no independent 10-set, deleting any 5
  vertices leaves an independent set of size 9. *Proof.* If G − W had none, with |W| = 5, then G − W would be a
  triangle-free graph on 35 vertices with no independent 9-set, hence an induced C35(1,7,11,16), and Theorem C35
  would give |G| ≤ 39. So at least 6 deletions are needed. (The degree-4 corollary is the case W = N[v].) This
  bears on the lemma 5 ≤ τ₉ ≤ 10 in the scout note `review/ideas/fable_G.md` of Chen's run.

**R(7), a second computation** (`r7/reveal/07-STATEMENT.md/files/STATEMENT.md`, sealed). If P1–P6 hold: no
9-regular triangle-free graph on 40 vertices with independence number at most 9 has two non-adjacent vertices with
exactly 7 common neighbours. All 977,008 configurations ended `CERTIFIED-UNSAT` (879,379 at level 3, 97,627 at
level 4, 2 on the full CNF), each with an LRAT proof from CaDiCaL accepted by lrat-check and by the formally verified
cake_lpr. The rules (`PROD-PREREG.md`) were timestamped before the run machine existed; four controls passed before
production. Ledger sha256 ba545601b42d7796ff8e8dc8b8d671f05f83ce14c24c90bb484b985dbeb47793.

## Layout

| Path | What | Covered by a seal? |
|---|---|---|
| `c35/seal/` | The C35 seal, opened whole: `archive.tar` (37 files), `salts.json` (all salts), `manifest.json`, `salt.hex`, `seal.json`, `digest.txt`, `digest.txt.ots` (Bitcoin block 976983), `anchors.json` (registry commit d484835f) | yes, digest ed00c765…69e4 |
| `c35/files/` | The 37 sealed files, unpacked from `archive.tar` | yes |
| `c35/unsealed/cert-machine-r1/` | `cm_encode.py`, `cmp_cnf.py`: the scripts of row D1, pinned in `P1-PREREG.md` | no (sha256 pinned in the sealed `P1-PREREG.md`) |
| `r7/reveal/NN-name/` | 32 packages, one per sealed R(7) file (index NN), each with `files/`, `reveal.json` (that file's salt), and the shared `manifest.json`, `seal.json`, `salt.hex`, `digest.txt`, `digest.txt.ots` (block 977031), `anchors.json` (commit 200ea669). Index 29, `prod-out/prod.tsv`, is on the Zenodo-later list | yes, digest 75dd6cf7…85eb |
| `r7/after-seal/` | Byte copies of 61 files written after the R(7) seal: the current result note, the P4 Lean and its checks, the P3 and T2 registrations and results, three readings, the P5 Lean chain | no |

Paths written inside the files refer to the private working folder they came from; a file they name is here only if
it is in this folder. Some files carry local absolute paths, the offset −0300 (`seal.json`) or the operator's user
name (the tar headers inside `r7-prod-bundle.tar.gz`); sealed bytes are published as they were sealed.

## How to check

```sh
pip install opentimestamps-client          # the ots client; without a Bitcoin node the tool reads block headers from two explorers
git clone https://github.com/carlostoledo1891/cert-machine && cd cert-machine
python3 -I instruments/seal/seal.py open corpus/r310-c35-r7/c35/seal --registry .                 # CERTIFIED, all 37 files
for d in corpus/r310-c35-r7/r7/reveal/*/; do python3 -I instruments/seal/seal.py verify "$d" --registry .; done   # CERTIFIED, each
```

On 2026-11-23 (05:13–05:16 UTC) these gave: C35 CERTIFIED, "all 37 file(s) re-derive … held by 2026-11-21"
(the registry commit's local date; the Bitcoin block is 976983, 03:26:46 UTC 22 Nov); R(7) CERTIFIED on all 32
packages, held by 2026-11-22 (block 977031, 09:29:47 UTC 22 Nov). Planted errors (a flipped byte, a wrong salt) were
REFUTED in a dry run.

## Whose work this is

The operator (Carlos Toledo) set the target, ran the tracks and made every decision and every spend. The work was
done by AI models; the model of each part is read from the sessions that wrote the files.

| Track | Model | What |
|---|---|---|
| Claude track (Claude Code) | Claude Opus 5.5 (`claude-opus-5-5`), 21 Nov to 01:22 UTC 22 Nov | C35: the question, Lemma P, the first enumeration. R(7): the CNF generator and the pilot. |
| Claude track, same session | Claude Fable 5.2 (`claude-fable-5-2`), from 01:22 UTC 22 Nov | R(7): the reduction (`REDUCTION.md`), the pipeline, the registration (`PROD-PREREG.md`), the P4 Lean (T0, T1). |
| Astra track (Codex, OpenAI) | GPT-6.2-astra (`gpt-6.2-astra`, "Astra 6.2" in the files) | C35: the direct CNF and its LRAT proofs, the Lean statement of Lemma P and the bridge `Outside.lean`, `OutsideSize.lean`. R(7): the reading of the reduction, the counting rules, the P5 Lean chain. |
| cert-machine (Claude Code, this repository) | Claude Opus 5.5, to 01:27 UTC 22 Nov | C35: the whole of P1 (the kernel-checked Lemma P, the two deciders, the controls, the second checkers). |
| cert-machine, same session | Claude Fable 5.2, 01:27–23:13 UTC 22 Nov | R(7): the byte-identical enumeration, the own decider, the tally, the runs, the readings of P3–P5, both seals. |
| cert-machine | Claude Opus 5.5, from 23:13 UTC 22 Nov | This record and the comparison with Chen's run. |

Cited: Exoo (R(3,10) ≥ 40); Kalbfleisch (the circulant, as Unsolved Lab's page names it); Goedgebeur and Radziszowski (2013: the (3,9;35) uniqueness,
e(3,8,27) = 85); Brinkmann and Goedgebeur (2012: the complete (3,8;27) list); McKay (the graph lists; four of his
(3,8;27)-graphs are in `cores_e85.g6`); Angeltveit (R(3,10) ≤ 41); Zhiyang Chen (the case R(7), Lemma R7, the report
and C-004); Unsolved Lab and andrey-kokoev/marici (the C35 question). Tools: CaDiCaL 3.0.1; drat-trim's
`lrat-check.c` (Marijn Heule; MIT, licence inside `r7-prod-bundle.tar.gz`); cake_lpr (Marijn Heule, Magnus Myreen,
Yong Kiam Tan; under the CakeML BSD 3-Clause licence); Lean 4 and Mathlib; nanoda; con-leche; kissat; nauty;
OpenTimestamps.

**Licence notice:** `r7-prod-bundle.tar.gz` contains cake_lpr's sources (`tools-src/cake/`) without cake_lpr's
LICENSE file. It is added beside the record as `r7/licenses/cake_lpr-LICENSE`, fetched on 2026-11-23 from
github.com/tanyongkiam/cake_lpr at commit 033aad53 (sha256 251cdc54d59eb4d22a0969b78714b3baef76724744b3c90e73a83cc63374a18a).

## Zenodo later (not in this folder)

| File | Bytes | sha256 |
|---|---|---|
| R(7) seal `archive.tar` (all 33 files) | 245,770,240 | 3c32c7ea4c81ac09acda3d69af31aa1bb121ae0038e8d852a0b671292a74b560 |
| R(7) seal `salts.json` (all 33 salts) | 5,352 | d5122a4bcf531c10f57fd63d31e178a7efef4aa6448116bf4860ecf55d8057b5 |
| `prod-out/prod.tsv`, the ledger, with its reveal package (index 29) | 231,996,228 | ba545601b42d7796ff8e8dc8b8d671f05f83ce14c24c90bb484b985dbeb47793 |
| `c35-direct-proof.tar.xz` (row D1's CNFs and LRAT proofs) | 44,346,848 | 956b2dfb5e9acb5d28170bda603af024fc405667548d416c98226f275b7e26ff |
| `t2.tsv.gz` (T2's output) | 51,189,950 | 91fdac12286219c9a4f95971bc45e7da8aab03a1c5d680942ffc9705f3319873 |
| `t2-bundle.tar.gz` (T2's run bundle) | 46,950,775 | 11d0055dd1ceb60e7366149ceafb5626a733cc497e839c0d3e74c3b4e3506cf5 |
| `p3-bundle.tar.gz` (P3's run bundle, with its 138 output files) | 3,425,090 | 206893b52de6101b096702b4f9c693a26d14003caa9807c0c73fbbd8e4b0f789 |
| `c35.ndjson` (row K's Lean export; can be made again by `c35/files/lean/k-replay.sh`) | 27,750,870 | daf9c43c9d3256433fa6ef256568840f0d3bef70f8332269594ae4cb2781acdb |

With `archive.tar` and `salts.json`, `seal.py open` re-derives all 33 R(7) files at once.
