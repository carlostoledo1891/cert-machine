# RESULTS — K2, K3 and the red controls on the pod (2026-11-13), for the orchestrator's replay

Working tree `/root/kn1/third` (a copy of the third party's tree after K1; K1: fetch 0, cache 0, build 0 in 543 s,
axioms 0). Lean v4.32.0, Mathlib 81a5d257, the lab at 795efb86, the third party at a5cc72bd. Nothing below was
replayed by anyone but the author; every line names the file where the orchestrator can re-read it. Logs:
`results/kn1/bridge/` (`logs/`, `k3/`, `red/`).

## The three targets (STATEMENT-DIFF.md §1)

T1 = `KNAll.Conjecture1` (KNConjectures/Statements.lean:44), the type of `KNAll.conjecture1_holds`:

    ∀ (n : ℕ) (w : Sym2 (Fin n) → unitInterval) (A : Finset (Fin n)) (hA : A.Nonempty) (o b : Fin n),
      (prodBernoulli w).real (⋃ a ∈ A, openConn o a) * A.inf' hA (fun a => (prodBernoulli w).real (openConn a b)) ≤
        (prodBernoulli w).real (openConn o b)

T3 = the type of `KN1Corollary.kozmaNitzan_conjecture1`: the same body (syntactically T1's body; `Targets.lean`).
T2 = `KN1Statement.MultiplicativeGluing`: the same text over that file's Mathlib-only copies of `prodBernoulli`,
`openGraph`, `openConn`.
`Targets.lean:16,19,23` (`rfl`) and its `run_cmd` (`logs/b2-core.log`: four lines, all `true`): the type of each
of the three theorems IS its target; T3's type is syntactically the body of `KNAll.Conjecture1`.

**No target is a sealed planted variant or neighbour. No MISMATCH.**

What separates the targets from R0, none of it by proof: vertices are `Fin n`; there is no graph, only weights on
ALL unordered pairs with 0 for "no edge"; the weight function also has inert diagonal entries; the measure lives
on sets of pairs; A is a `Finset` WITH a hypothesis `A.Nonempty` (R0 admits the empty set, vacuously); the minimum
is `Finset.inf'` (attained) where R0 has a number `m` with two hypotheses.

## K2 — target × direction

All proofs are Mathlib-only and about the mirror `KN1Transport.LabForm1` (`Transport1.lean:30`);
`Compare.lean:54,56,58` (`T1_iff_mirror`, `T2_iff_mirror`, `T3_iff_mirror`, each `Iff.rfl`) are the only steps
that touch the third party's or the lab's definitions.

| target | T → R0 | R0 → T | walks |
|---|---|---|---|
| **T1** | **PROVED (transport only)** `Compare.lean:62 T1_to_R0` [`Transport1.lean:36 conjecture1_of_labForm1`] | **PROVED (transport only)** `Compare.lean:65 R0_to_T1` [`Transport1.lean:56 labForm1_of_conjecture1`] | both CLEAN |
| T2 | **PROVED (transport only)** `Compare.lean:70 T2_to_R0` | **PROVED (transport only)** `Compare.lean:73 R0_to_T2` | both CLEAN |
| T3 | **PROVED (transport only)** `Compare.lean:78 T3_to_R0` | **PROVED (transport only)** `Compare.lean:81 R0_to_T3` | both CLEAN |

Six of six. Both directions are DIRECT (no sealed reading in between). `T → R0`: relabel the finite vertex type
by `Fin n`, weight 0 off the edges, the finset of images of A (nonempty because `m` is attained), `m ≤ inf'`.
`R0 → T`: the complete graph on `Fin n` with `w` on its edges, the diagonal weights dropped, `m = inf'`
(`Finset.exists_mem_eq_inf'`). The two dictionaries between the encodings are the sibling item's `Transport.lean`
(sha256 a25ea65d…, byte for byte behind one import line: `KN1/Bridge/Transport3.lean`).
Also, through K0's equivalences, for the record: `Compare.lean:86 T1_iff_RE`, `:90 T1_iff_RL`, `:94 T1_to_RF`.

**In the rule's words, for T1:** `T1 → R0` and `R0 → T1` are both PROVED by transport, the walks are clean, the
red controls are refused: **CERTIFIED, as printed** — pending the orchestrator's replay. The equivalence does not
pass through a sealed reading. The same words, apart, for T2 and for T3. What the word does not say: that the
Lean text is the printed sentence letter for letter (the encoding differences above are real and are bridged by
proof), or anything about the third party's proof.

## The dependency walks (`logs/walk.log`; source `Walk.lean`)

@@WALK@@

## K3 — the conjecture as printed, proved

`Proved.lean:12`: `theorem conjecture1_as_printed : KN1Printed.Conjecture1 := KN1Compare.T1_to_R0 KNAll.conjecture1_holds`.
- `#print axioms conjecture1_as_printed`: [propext, Classical.choice, Quot.sound] (`logs/b2-core.log`, `Axioms.lean`;
  all 22 theorems printed there depend on these three and no other).
- @@FRESH@@
- Comparator (the lab's `comparator-check.sh`, sha256 in `k3/comparator-check.sha256`: leanprover/comparator
  57567492…, lean4export at the release v4.32.0, nanoda forced on, landrun), challenge `OurChallenge.lean` =
  `import Printed1` + `theorem conjecture1_as_printed : KN1Printed.Conjecture1 := sorry`, solution `KN1.Proved`:
  "nanoda kernel accepts the solution", "Lean default kernel accepts the solution", "Your solution is okay!";
  exit 0, 180 s (`k3/comparator.log`).
- The walk of `conjecture1_as_printed` is FLAGGED, as it must be: it goes through `KNAll.conjecture1_holds`.

## Red controls

@@RED@@

## SEEN IN THEIR LEAN FILES (for amendment A1 and the blind control K4)

Comments and docstrings that describe how a Lean statement of Conjecture 1 stands to the printed sentence. I read
them with the statements; STATEMENT-DIFF.md was written after reading them, so K2's list of differences is NOT
blind with respect to these lines:
- `KNConjectures/KN1Statement.lean:8–11` — the encoding: "the vertices are `Fin n`, every unordered pair … carries
  a weight … (a pair of weight `0` is an absent edge)"; the conjecture "for every NONEMPTY finite set `A`". Names:
  `Fin n`, weights on all pairs, nonemptiness.
- `KNConjectures/KN1Statement.lean:13–15` — its three definitions are "definitionally equal copies" of the lab's.
- `KNConjectures/KN1Statement.lean:36–38` — "every nonempty finite relay set `A`"; "`o ↔ A` is `⋃ a ∈ A, {o ↔ a}`".
- `KNConjectures/KN1Bridge.lean:6–8` — T2 "is, by definitional unfolding," T3.
- `KNConjectures/KozmaNitzanConjecture1.lean:8–9` — "weights in `[0,1]`, any finite relay set `A`, any vertices
  `o, b`, no distinctness assumptions"; `:59–60` — the lower-bound form, "No hypothesis on `q`, on `A` (may be
  empty) or on the vertices"; `:93–94` — "for every nonempty finite set `A`".
- `KNConjectures/Statements.lean:6–8` — the encoding again ("absent edge = weight `0`").
- About OTHER conjectures, not Conjecture 1: `Statements.lean:15` (Conjecture 4, fixed-minimiser form, "stronger
  than the paper's"); `Statements6.lean:21` (Conjecture 6, "in the paper, two endpoint hypotheses that are not
  needed").
- NOT named in any comment I read, and found by K2: the diagonal weights (the weight function is defined on the
  pairs `s(v, v)` too); `Finset.inf'` as the form of the minimum; `Finset` in place of a set; the measure on sets
  of pairs in place of a product over edges. None of them changes the truth value (K2).

## Proposed amendments

None to the rules. Three choices made under them, for the orchestrator to read:
1. KR1 is run in the form the rule sheet words ("the proof scripts … with the name `Conjecture1` replaced"), on
   single files compiled outside the library; nothing is swapped inside the working tree.
2. T3 has no name in their files; `KN1Compare.T3` is my transcription, checked against the theorem's type by `rfl`
   and syntactically.
3. The forbidden list (44 names, 22 statements) was extended by reading and by `grep`, not by reading every
   theorem of both libraries (LOG.md, last section).

## Replay

On the pod, with the bridge sources uploaded to `$SRC` (= the desk's `perc/kn1/bridge/`, checked against
`INPUTS.sha256`):

    SRC=/root/replay-kn1-src bash /root/replay-kn1-src/pod-replay-kn1.sh

A fresh `cp -a` of the pristine tree to `/root/replay-kn1/third`, the sealed bytes, our modules, axioms, walks,
tokens, `k3.sh` (leanchecker, Comparator, KR4), `red.sh` (KR1–KR3).
