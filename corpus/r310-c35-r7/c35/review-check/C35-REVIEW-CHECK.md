# C35 review check: four claims of an outside reading of Theorem C35 (control room, 2026-11-23)

Checked here: the four claims of the outside review of Theorem C35 (pasted 06:0x UTC, `control-room-2026-11-22.md`),
each with code written for this note from the definitions (no track's search, encoder or parser code run or copied),
nauty 2.9 `labelg`/`countg`, kissat 4.0.4, CaDiCaL 3.0.1, the project's `tools-bin/lrat-check` and `cake_lpr`.
Written 06:22 UTC 23 Nov by the control room (Claude Opus 5.5). About 3 CPU-minutes, one process at a time, on the M2.
No network, no git, no pods, no Lean build.

## What is NOT established (read first)

- **Exoo's matrix is not at home.** The pinned bytes (`r3.10.39`, sha256 45581492…a3fe) were fetched fresh by the
  Claude track and Codex and never stored, and this check had no network. Claim 2 runs on the isomorphism class
  *identified* in our own files, not on the pinned bytes. It is the only one of Claude's 241 re-extension classes
  (`claude-r1/out/swap1_classes.g6`, which Claude's `control.py` wrote from the pinned bytes and recorded "Exoo
  itself among them: True") with Exoo's whole per-row profile in `claude-r1/out/control_out.txt`. It is also the
  only one with Chen's published fingerprint (e 167, |Aut| 1, 4,511 independent 9-sets). The identification is
  therefore only as good as those two files of Claude's.
- **The label "22" is not re-derived.** Exoo rows 35, 37 and 38 are pinned by profiles that no other row has. Row 22's
  profile (degree 9, 1 re-attachment, 1 maximal) is shared by 17 rows. The fourth removed vertex has that profile, its
  degree and its core count (7), and it sits in the cycle Codex recorded. That it *is* row 22 rests on Codex's
  `controls.py` and Claude's `struct.py`, both run on the pinned bytes.
- **Lemma P has no human proof.** It stays a finite computer-checked fact, including in the smaller 385-set form.
  Claim 1's explanation explains why the theorem follows *given* Lemma P, and nothing more.
- **385 is not the smallest certificate.** It is the smallest among unions of whole affine orbits. As a family of
  sets it is redundant: some 384-set sub-families already prove Lemma P, and a 368-set irredundant sub-family was
  found (greedy, one order). The true minimum was not computed.
- **Control C1 is not Exoo's graph.** `cert-machine-r1/cm4.kissat.out` decodes to a 39-vertex C35 + C4 graph with 168
  edges, not isomorphic to Exoo's (167 edges). It is a valid positive control, but not a check of Exoo.
- No referee and no outside reader of this note.

## Claim 1: the mechanism

**The reading is correct.** It is literally the bridge's first lemma.

- `Outside.lean` (55fc5e99…, Codex's, compiled unchanged against Lemma P) proves `outside_fork`: for any three
  distinct outside vertices w0, w1, w2, w0 ~ w1 or w1 ~ w2. Equivalently, no outside vertex has two outside
  non-neighbours.
- Its proof feeds Lemma P the three core-neighbourhoods S_i = N(w_i) ∩ core:
  - **Independent:** by triangle-freeness.
  - **Pairwise disjoint:** a shared core neighbour c would give an independent 10-set, namely c's 8 core neighbours
    plus the two outside vertices, all inside N(c).
  - **S0 ∪ S1 and S1 ∪ S2 meet every independent 8-set of the core:** otherwise an untouched 8-set plus the
    non-adjacent pair {w0, w1}, or {w1, w2}, is an independent 10-set.
  - Lemma P says no such triple exists.
- `OutsideSize.lean` then argues as follows:
  - `not_three_neighbors`: no vertex has three outside neighbours. They would be pairwise non-adjacent, and the
    middle one would have two outside non-neighbours.
  - `no_five_outside`: with five outside vertices, w0 is adjacent to at least 3 of the other 4, a contradiction.
  - `order_at_most_39`: 35 + 4.
  - `four_outside_C4`: choose a non-adjacent pair; the fork lemma forces the four cross edges; triangle-freeness
    forbids the other diagonal.
- The review's "matching" phrasing is equivalent. "With five, a triangle remains" (K5 minus a matching always has
  one) is a one-line finite fact. Lean reaches the same contradiction by the "three outside neighbours" step, so
  nothing beyond the proof is assumed.
- Brute force over all labelled graphs (`claim1_check.py`):
  - 0 triangle-free graphs on 5 vertices in which every vertex misses at most one other.
  - On 4 vertices: exactly 3, all of them 4-cycles.
- On Exoo's graph (identified class) the bridge's facts hold as stated:
  - The four core-neighbourhoods (sizes 4, 6, 6, 7) are independent and pairwise disjoint.
  - Each outside vertex has exactly one outside non-neighbour.
  - For both non-adjacent outside pairs, S_u ∪ S_x meets all 3,360 independent 8-sets.

**Plain-words explanation (faithful to the proof; it needs no step the proof lacks):**

> Call the 35 vertices of the copy the core and the others outside. If an outside vertex had two outside vertices it
> is not joined to, the core-neighbourhoods of the three would be three disjoint independent sets of the circulant
> in which the middle one, together with either end, touches every independent 8-set of the circulant (an untouched
> 8-set plus the two unjoined outside vertices would be 10 pairwise non-adjacent vertices), and Lemma P, a finite
> fact checked by computer, says no three such sets exist. So each outside vertex misses at most one of the others:
> the missing edges among outside vertices form a matching. Five outside vertices would then always contain a
> triangle, so there are at most four, which gives at most 35 + 4 = 39 vertices; and on four vertices the only way to
> remove a matching and leave no triangle is to remove two disjoint edges, which leaves exactly a 4-cycle.

## Claim 2: Exoo's square

- **The graph** (`exoo-candidate.g6`, class 112 of `swap1_classes.g6`):
  - 39 vertices, 167 edges, degrees 6¹ 8¹⁴ 9²⁴.
  - 0 triangles, α = 9 (no independent 10-set), 4,511 independent 9-sets, 209,016 independent sets.
  - |Aut| = 1 (nauty).
  - The (degree, valid re-attachments, maximal ones) multiset over its 39 vertices equals `control_out.txt`'s
    exactly. 1 of the 241 classes matches it, and 62 have the same degree multiset (`identify_exoo.py`).
- **The count** (`exoo_square.py`). Of the C(39,4) = 82,251 four-subsets W:
  - **1** leaves an 8-regular graph.
  - The same single W is the only one that meets every independent 9-set, i.e. α(G − W) ≤ 8.
  - G − W is isomorphic to C35(1,7,11,16), by `labelg` and by an explicit isomorphism found by our own backtracking
    and re-checked edge by edge.
  - Every other W fails the 8-regular test.
- **The removed set:**
  - It induces a **4-cycle** (each of its vertices has 2 neighbours inside W).
  - Degrees in G: 6, 8, 8, 9. Core neighbours: 4, 6, 6, 7.
  - By the unique per-row profiles, three of its vertices are Exoo's rows **35** (degree 6, 198 re-attachments),
    **37** (8, 27) and **38** (8, 15).
  - The fourth has row 22's profile and its 7 core neighbours.
  - The cycle is 35–37–22–38–35, Codex's recorded cycle [22, 37, 35, 38]; 22 ≁ 35 and 37 ≁ 38.
  - The core counts 7, 4, 6, 6 for 22, 35, 37, 38 match `REPLY-r1.md`.
- **Side finding:** control C1's SAT model is not Exoo's graph (`decode_c1.py`: 168 edges, not isomorphic). The page
  already says the record shows only that *a* 39-vertex graph attains 39. This check adds Exoo's own class, with the
  caveats above.

## Claim 3: the corollary on the live page

- `site/r310/index.html` (ab28acd3…) states, in the box-1 statement block and in the "this lane" source row:
  > "In a triangle-free graph on 40 vertices with no independent set of size 10, deleting any 5 vertices leaves an
  > independent set of size 9; so at least 6 deletions are needed to leave none."

  It is labelled "prose proof, not in Lean, conditional on Goedgebeur–Radziszowski's uniqueness of the
  (3,9;35)-graph", and the page says it contains the degree-4 corollary, which was known before.
- **It is stated correctly.** Delete any 5 vertices X. If no independent 9-set remained, G − X would be a triangle-free
  35-vertex graph with α ≤ 8, i.e. a (3,9;35)-graph.
  - By GR 2013 Theorem 3 (read in `audit/gr2013/gr2013.txt`: "There exists a unique (3, 9; 35)-graph", the cyclic graph
    with distances {1,7,11,16}), that graph is C35(1,7,11,16).
  - G would then contain an induced C35 with 5 vertices outside, which contradicts Theorem C35.
  - "Size 9" is exact, since α(G) ≤ 9. "At least 6" follows because deleting a subset of a hitting set also leaves no
    independent 9-set.
  - Deleting N[v] for a degree-4 vertex v is the case |X| = 5, so the degree-4 corollary is contained, as the page
    says.
- The wording matches REVEAL-v2 (lines 125–126).

## Claim 4: a smaller certificate for Lemma P

- **The objects** (`orbits.py`):
  - **Independent sets of the circulant:** 1, 35, 455, 2,905, 10,150, 20,265, 22,995, 13,760, **3,360** (size 8),
    and 0 of size 9. Total 73,926, the record's numbers.
  - **Multipliers** a with a·D = D (D = {±1, ±7, ±11, ±16}): **{1, 11, 16, 19, 24, 34}**.
  - **Affine automorphisms:** 6 × 35 = **210**. A search over all 24 units × 35 translations finds exactly these 210,
    and nauty gives |Aut(C35)| = 210, so the affine maps are the whole group.
  - **Orbits of independent 8-sets:** **23**, of sizes 35 ×2, 70 ×2, 105 ×8 and 210 ×11, summing to 3,360. Each orbit
    satisfies orbit × stabiliser = 210.
- **Forbidden triple**, exactly as `Feasible` in `PathLemma.lean`: A, B, C are each independent in the core and
  pairwise disjoint, and A ∪ B and B ∪ C meet every set of the family. Lemma P says no triple exists for the full
  family. A triple for the full family is a triple for any sub-family, so a sub-family with no triple proves Lemma P.
- **Decider 1** (`lpfam.c`) is a complete branching search with no symmetry. A triple it reports is re-checked from
  the definitions in Python.
  - **Controls:**
    - Full family: no triple (438,031 nodes), which is Lemma P.
    - C35 − 0 (2,592 sets, vertex 0 unavailable): a triple, verified, and it fails on the full C35.
    - The record's C3 triple (`d2/c3-config.json`): passes on C35 − 0 and fails on C35.
- **Decider 2** (`claim4_cnf.py`): a CNF written from the same statement.
  - The 385-set family: kissat UNSAT, CaDiCaL UNSAT.
  - CaDiCaL's LRAT (346,300 lines, sha256 e78efed0…6d79, deleted after checking) was accepted by `lrat-check`
    ("VERIFIED") and by `cake_lpr` ("s VERIFIED UNSAT").
  - The same proof without its final empty clause was rejected by both ("NOT VERIFIED"; "empty clause not derived").
  - Full family: UNSAT. C35 − 0: SAT, model verified.
- **(a) Holds.** Exactly **1** of the 56 unions of five orbits with sizes {105, 105, 70, 70, 35} admits no forbidden
  triple. It has 2,284,906 nodes and is confirmed by decider 2. Its sizes are 105 + 70 + 70 + 105 + 35 = **385**, and
  one member of each orbit is:
  - {0,2,5,8,14,17,20,22} (105)
  - {0,3,5,9,13,15,18,23} (70)
  - {0,2,8,12,17,20,22,25} (70)
  - {0,6,8,12,14,18,20,26} (105)
  - {0,2,8,12,17,20,25,29} (35)
- **(b) Holds.** Unions of complete orbits with fewer than 385 sets: **1,083** (this count includes the empty union;
  1,082 non-empty; the largest has 350 sets). **Every one admits a forbidden triple**, each verified from the
  definitions; the deepest search took 1,923 nodes. Of the 510 unions with exactly 385 sets, only the one in (a) admits
  none, so it is the unique minimum among orbit unions.
- **Beyond the claim (context for the wording):**
  - Dropping one set from the 385 still proves Lemma P when the set comes from the 105-orbit with member
    {0,2,5,8,14,17,20,22}, from the 70-orbit with member {0,3,5,9,13,15,18,23}, or from the 105-orbit with member
    {0,6,8,12,14,18,20,26}. For one of them kissat also returns UNSAT.
  - Dropping a set from either of the other two orbits does not: a triple exists, verified.
  - A greedy pass gives an irredundant **368-set** sub-family (91 + 69 + 70 + 103 + 35). It admits no triple, and
    every single removal admits a verified one.
  - So "385 suffice, minimal among unions of whole orbits" is right, and "385 is the minimum" would be wrong.

## Verdicts

| Claim | Verdict | What was decided |
|---|---|---|
| 1 mechanism | **CERTIFIED** | The reading equals `outside_fork` (Lemma P ⇒ no outside vertex has two outside non-neighbours). The rest of the argument and both finite facts (5 vertices: none; 4 vertices: only C4) were checked by brute force. The explanation above needs no step outside the proof. |
| 2 Exoo's square | **CERTIFIED** (count and C4), on the class identified from our files | 1 of 82,251 four-subsets leaves C35(1,7,11,16), and it induces C4. Labels 35, 37, 38 were pinned by unique profiles. **Label 22: REFUSED** here, consistent with its profile but not re-derived without the pinned bytes. |
| 3 corollary on the page | **CERTIFIED** (stated correctly) | The page's sentence follows from Theorem C35 + GR 2013 Thm 3 as labelled. It contains the degree-4 case. |
| 4 smaller certificate | **CERTIFIED** as stated | 3,360 sets, 6 multipliers, 210 maps, 23 orbits. One union of five orbits (105 + 70 + 70 + 105 + 35 = 385) has no triple (two deciders, LRAT checked twice). All 1,083 smaller orbit unions (the empty one included) have a verified triple. Not minimal as a set family: 368 sets suffice. |

## Files

Code and outputs in `control-room-checks/c35-review-check/`. Rebuild the two C programs with
`cc -O2 -o profile profile.c` and `cc -O2 -o lpfam lpfam.c` (binaries not kept). Run order: `orbits.py`,
`claim4_controls.py`, `claim4_orbits.py`, `claim4_cnf.py write p385|full|c35m0|p385minus22|p385minus8` + solvers,
`claim4_greedy.py`, `identify_exoo.py`, `exoo_square.py`, `compare_profile.py`, `claim1_check.py`, `decode_c1.py`.

```
3f5e83232bff7309a02d5044ee63c217be36234a068e398c9d1b6ba7a900f6af  profile.c
d0ed0990de419fef0c3b142242271516319e4679d033f8a32e3eeee9fed0672b  lpfam.c
7cc691e956e8e2791541b2499da2a2792186051d37446d7a1236e4a59bc6ca23  g6util.py
e595e75b90e506a0abd510a24dee72d1506562d851336e3d453790ffc0134af0  lpcheck_lib.py
6fbbc30a6eda85c9c0bc84246d2e3c969f50c3fa199ab644156244e68fff6829  orbits.py
7fcb9ff27fa9c1ccbea29e5e3d9063da7e6789787ac2c72b3cd0e9043e19d3b9  orbits.json
50fd6a2c8ae1009b3b1e664226e9b73b17abadafce88bbd811312b8d27c5cddf  claim4_controls.py
97fedf3c8f5a363fb243e24fe45041474ef64848289234f9745288f0872f809c  claim4_orbits.py
518486b169db63b7b5c19b927175e3aa7f400a32024a19ed33e4677bcd156ea0  claim4-orbits-result.json
abcaee5576273176acc111aad578c312840217a35336ad8272cdbfcc3833bdd3  claim4_cnf.py
1c98734227ffd2ee95208f970e9eb3919410ca45ac17b3a9d5cbb6dab78ecee5  claim4_greedy.py
e98c016a3348dee79e97c25ba57081d156e0248dfce976593cf206b8e9df1e48  claim4-greedy-result.json
14042e4c7496ae343c474a6657746737cbee6308d4409f47af728c7e198684af  cnf/p385.cnf
bde6e1eede96772c07c8ce29fd18088863815bd043aa59a06f11f5838cf8a162  cnf/p385.kissat.out (also p385.cadical.out, full.kissat.out, p385minus8.kissat.out: "s UNSATISFIABLE")
738569b48e67aab73fb9683b7942e7bb4a8ae275871f2b192ca6d88d4542498b  cnf/p385.lratcheck.out
c680d3bd38a04c7beee7d54999f8f00b43051f75a53cf2bd170ae0cc5f99eb5f  cnf/p385.cake.out
aeef03dc591706f675466913dbf14033e53aafa0b1d8c305f3f0f7c986dc71d9  cnf/p385-trunc.lratcheck.out
104a9df6bb3c5c31167c984268adfdeba3d6d23dee0b448a3bbf3f2c0e007193  cnf/p385-trunc.cake.out
f1d765aa5111b17e3bf0c5330ff1533bdff55a47adcb1746777aaaee347af23b  cnf/lrat-deleted.sha256 (the two deleted LRAT files: e78efed0…6d79 full, 2d33d4c2…5518 truncated)
b99b15d6eae11c9cd1280a2b6a86ec6da2e5ab39de31122f15d0c521b4ae0e31  cnf/full.cnf
c845ad1e07fb9e321d0d180aa7da161634597879a671c4868bcabb144d777e62  cnf/c35m0.cnf
104650eee88e31937f87baef58329317e0e10ec5e290b3f1430f11af7b55dc0c  cnf/c35m0.kissat.out
504e91d09e088011f6970d4befd99a49b8029a5b0cd7e794e5e0f9f9fc2ab8ef  cnf/p385minus22.cnf
93166e6ec8b703d6a700c663413a6a2386001c0d5a177f5b9ad0b2e931008cc6  cnf/p385minus22.kissat.out
4a0961e99c2f29660c73d0282bf5baf942887f49cd12135869e794e256553140  cnf/p385minus8.cnf
5905ef5734bc3195ea3240813b978a31ccbd6b937b2d5434dd3481c14a71db2e  cnf/p385.cadical.time (the first, binary-LRAT run: 4.0 s, 18.6 MB)
e3c3e4006dc90cf176d72c1e7e737f8ee96012a04f2f6a63e70f2fceb465c498  identify_exoo.py
e624fb0d18289995d3782a567fbc4f17732452e125e249184c92177f436cb2ea  swap1-profile.txt
1ca386759278ca99ed0ef86abc0760d471f291b671d54510b6e43351c9004e38  exoo-candidate.g6
20fd01f0d0cf8ddccc88ed580bef7a27c5bd131ae4d82a1124b43c3c62b6de10  exoo-candidate-profile.txt
a298a6c517df4ae693633cf4325e76b0b42109386728ff65c3837d5be6ac3aff  exoo_square.py
4a20426c97f18a3c233a911a8ae6558d874b6d5a176affc8ec5a1333d49b0108  compare_profile.py
e52d32c4ba0b04100cbb05a998b5b51464e7a3363e34b7b0a15ca91ae28e3b9c  claim1_check.py
44e6fbda3924510412d35315181db95760b41564fead0de54cb583997ffa566a  decode_c1.py
233fce456ff068ddd8cb9c7a0f907d81f8fe5377cccbc52018206f456a70f7d8  c35.g6
```

Inputs read (not changed):

```
7cdcb529db7ca4608b3c67393ee4f8febfc9d63186a02d5613d0f26a93fc73cf  claude-r1/out/swap1_classes.g6
fb4508861b86989c44a649aab71c1e6bcc5732797f6398da997605a50250e130  claude-r1/out/control_out.txt
1e53dda1078164707b3edb31e3fecc026c60908da930e960342985bc9a4689f7  cert-machine-r1/cm4.kissat.out
0d22d3487662f06db600a55d502127ac65891e5bf5faff3308ef747fea822440  cert-machine-r1/d2/c3-config.json
55fc5e99893a007c5a101930e169fdf2ecb979f702ec9a06ca786fc4d9a92afd  codex-r2/path-bridge/Outside.lean
24980e4aaf4fb1f8e954f1a314fd4075f2fae2471204451913f55b5610c95c4a  codex-r2/path-bridge/OutsideSize.lean
3868999a5879e1ccada7ea98f445ca2ebc67a2795ee355613160322928a9f60b  cert-machine-r1/lean/PathLemma.lean
ab28acd3bc74270fef6c7f139625c8f3b812db227207fe7ee2468428749d107b  site/r310/index.html
3f28211537e529ddf0ad8f0aa8cbf1d5b4618568e7a692732e7f38f1bb2179c8  audit/chen-ralph-2026-11-23/repo/notes/known39.md
4aeadfcf05c3dd56d47fa1a9423cc3d0747fb3c448b6dd3af3a0a3197f3ce794  tools-bin/lrat-check
eeba1fea28955124403d4e6614efa5ff3a365f16820e21b5830814c0b7ff8352  tools-bin/cake_lpr/cake_lpr
```
