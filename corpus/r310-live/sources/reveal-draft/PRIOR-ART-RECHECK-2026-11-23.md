# Prior-art re-check on the day of the reveal (PRIVATE, 2026-11-23, 04:43–05:05 UTC)

The 22 Nov draft's checklist asks for C35's novelty to be "read again on the day of the reveal". Read again here by
a control-room subagent (Claude Opus 5.5), once. Every search held only mathematical terms and author names; none held
the operator's name, e-mail or project name. Web pages were read with an anonymous fetcher; GitHub searches and API
reads went through `gh`, which is signed in to the operator's account (read only: no issue, comment, star or watch).

## Result in three lines

1. **C35 is still not found decided anywhere**, but the question is not ours alone: besides Unsolved Lab's M20 (open,
   "not run") and Chen's scout run (timed out), the public repository andrey-kokoev/marici posed it on 9 Nov
   (committed 16 Nov), reduced it to five new vertices inducing C5, and left it "not excluded". It must be cited.
2. **Chen's Zenodo record has no version after v2** (2 versions; latest 10.5281/zenodo.23678020, 26 Oct 2026); his
   repository's last commit is still 055ae277 (22:49:53 UTC 22 Nov); its one issue (#1, 31 Oct) is unanswered.
3. **40 ≤ R(3,10) ≤ 41 stands**; no 2026 source decides it; McCrea, Daugherty–Ward–Ryan and Pandey–Ravi have no new
   version, and none mentions an induced C35 extension.

## 1. The bounds
- Angeltveit, "R(3,10) ≤ 41", EJC 32(4) P4.30, published 2025-11-03 (https://www.combinatorics.org/ojs/index.php/eljc/article/view/v32i4p30; arXiv 2401.00392).
  Exoo's 39-vertex graph gives ≥ 40. No source found that decides the value.
- Pandey–Ravi, arXiv 2601.03572: still v1 only (7 Jan 2026); its abstract still says 40 ≤ R(3,10) ≤ 42; no C35.

## 2. Chen
- Zenodo API, versions of 23678020: total 2: 23677795 (26 Oct) and 23678020, "version 2 (latest)", 26 Oct 2026,
  "On (3,10,40)-graphs: structure, symmetry, and certified computations (progress report)". No v3.
- Zenodo search for "R(3,10)" / "(3,10,40)": the only on-topic record is Chen's v2. Zenodo search, title "Ramsey",
  published 1 Oct–31 Dec 2026: 16 records visible, none on R(3,10), (3,10)-graphs, 40-vertex triangle-free graphs or
  C35 (two checked by their full records: 24383617, Jang, SRG(45,22,10,11); 24438210, Clark, a software laboratory).
- github.com/jeffchen006/Ramsey-R3-10: last commit 055ae277 "r310_ralph: stop the run after round 23 and add the final
  report" (committer 2026-11-22 22:49:53 UTC; repository pushed_at 23:43:14 UTC). Nothing newer at about 04:45 UTC
  23 Nov. Issues enabled; one open issue, #1 by TKY-27 (31 Oct): "Request for R(7) reproducibility artifacts (version
  2)" (the v2 cube CNFs, cover and one solved cube); no reply.
- In Chen's clone (055ae277), on C35: the idea scout `review/ideas/fable_G.md` Idea 3 frames "τ₉ = 5 ⇒ G is the
  induced C35 + 5 vertices" and ran the C35 + 5 SAT formula (185 variables, 306,440 clauses): "TIMEOUT at 13 min; no
  answer" (lines 112–127; `review/ideas/TESTED.md:57`). Elsewhere C35 is used for the degree-4 case (`notes/cases.md:96`)
  and as a control. No claim in `ralph/CLAIMS.md` decides the induced-C35 extension.

## 3. Unsolved Lab (https://unsolvedlab.com/problems/ramsey-r310)
- Last update on the page: 1 Oct 2026, 20:29 UTC; nothing dated later. R(3,10) "still 40 or 41".
- M20, "Extension from C35": "Does a (3,10)-graph on 40 vertices contain C35?", five vertices added, 401 cubes; "Not
  run in full", "not run" in the table. M09 (degree 4 excluded): "not reviewed outside the lab".
- No submission process, no outside review. The page calls the circulant "Kalbfleisch's circulant C35(1,7,11,16)".

## 4. New: andrey-kokoev/marici (public GitHub repository)
- File `research/chatgpt/ramsey/induced_35_core_five_pentagon_extension.md`, "A 35-vertex Ramsey core and its possible
  eighth pentagon", dated "2026-11-09" in its text; first commit 964b63af, 2026-11-16 23:24:48 UTC ("research(ramsey):
  import remaining source notes and audit tools"). Objective stated: a 40-vertex graph proving R(3,10) = 41.
- What it does, by its own text: a fixed INDUCED copy of the circulant (differences ±1, ±7, ±11, ±16) in a
  triangle-free 40-vertex graph with α ≤ 9; the five attachment sets are pairwise disjoint; the five new vertices must
  induce C5 (a compatibility graph of maximal independent sets, 3,365 vertices, 191,100 edges, has no triangles);
  τ₈(C35) = 9 by exhaustive check; at least 168 edges; a 175-variable model, "not resolved within the allotted run".
  Status: "No 40-vertex graph has been found, and this extension family has not been excluded."
- Its last push, 22 Nov 17:50 UTC (daily handoff and inventory): the inventory and the handoff report no decision
  of the C35 question. Code search in the repository ("eighth pentagon", "35-core", "induced 35", "fixed induced")
  finds only that note and a registry entry.
- Relation to ours (my reading, not a record): our Lemma P forbids two disjoint hitting pairs that share a set (a
  path A–B–C), a stronger finite statement than their triangle-freeness; in their C5 the pairs (0,2) and (2,4) are
  such a path, so Lemma P closes their 175-variable model. Their τ₈ = 9 and our counts are of the same core and do not
  conflict. Not found by the 21 Nov scout.
- It is an AI-assisted repository (the folder is `research/chatgpt/`); unrefereed.

## 5. The other public (3,10;40) claims
- McCrea, Zenodo 10.5281/zenodo.23928054: one version (1.0, 3 Nov 2026), degree-7 extensions of the (3,9;32,104)
  census; no C35. His GitHub repository johnmccrea/ramsey-r3-10-gluing: last commit 9 Nov.
- Daugherty–Ward–Ryan, Zenodo 10.5281/zenodo.22945442: one version (24 Sep 2026); the 35-vertex graph appears only as
  the dual neighbourhood of a degree-4 vertex.
- hraness/algal-lab: the repository returns 404 (as on 21 Nov).
- github.com/KMercero/R-3-10-SAT-Solver (created 8 Nov 2026): a small general SAT search; no C35, no circulant.

## 6. Data and licences (from the draft's checklist)
- McKay's page (https://users.cecs.anu.edu.au/~bdm/data/ramsey.html): `r38_27.g6.gz`, 477,142 graphs; "the full set
  of Ramsey(3,8,27)-graphs was not determined until Gunnar Brinkmann and Jan Goedgebeur did it in 2012"; `r39_35.g6`,
  1 graph. No terms of use, licence or citation request on the page.
- cake_lpr (tanyongkiam/cake_lpr): its LICENSE: "Copyright 2020-2026 by Marijn Heule, Magnus Myreen, and Yong Kiam Tan.
  All rights reserved." and the CakeML BSD 3-Clause licence, whose clause 1 asks redistributed source to keep the
  notice. The sealed `r7-prod-bundle.tar.gz` holds `tools-src/cake/` WITHOUT that file: put cake_lpr's LICENSE beside the
  bundle in the record (fetched from the pinned commit 033aad53), as a new file.
- drat-trim (marijnheule/drat-trim): MIT; its LICENSE is inside the bundle (`tools-src/drat-trim/LICENSE`).

## 7. Not done today
- Goedgebeur–Radziszowski 2013 in their own words (Theorem 3; e(3,8,27) = 85; |R(3,8;27,85)| = 4).
- Chen's Lemma Mc (needed before any sentence on codegrees at most 6).
- The arXiv API search for 2026 R(3,10) preprints (HTTP 429); arXiv was covered only through the two web searches.
- A full-text search of every public repository: GitHub code search covers only indexed default branches.

## Searches made (verbatim queries)
- Web: `"C35(1,7,11,16)" Ramsey (3,10) graph`; `Ramsey number R(3,10) 40 41 upper bound 2026`;
  `triangle-free graph independence number 9 circulant 35 vertices induced extension 40 vertices Ramsey`;
  `"(3,10,40)" graph Zenodo 2026 Ramsey`.
- Zenodo API: versions of 23678020, 23928054, 22945442; `q="R(3,10)" OR "(3,10,40)" OR "(3,10;40)"`; `q=title:Ramsey AND
  publication_date:[2026-10-01 TO 2026-12-31]`; records 24383617, 24438210.
- arXiv: abs/2601.03572; the API query `all:"R(3,10)"` (refused, 429).
- GitHub (`gh`): repository search `R(3,10)`, `ramsey r310`; code search `1,7,11,16`, `"1,7,11,16" ramsey`,
  `C35 "R(3,10)"`; code search inside andrey-kokoev/marici: `eighth pentagon`, `35-core`, `five-way`, `induced 35`,
  `fixed induced`; repository and commit reads of jeffchen006/Ramsey-R3-10, andrey-kokoev/marici,
  johnmccrea/ramsey-r3-10-gluing, KMercero/R-3-10-SAT-Solver, tanyongkiam/cake_lpr, marijnheule/drat-trim,
  hraness/algal-lab.
- Pages: unsolvedlab.com/problems/ramsey-r310; github.com/jeffchen006/Ramsey-R3-10/commits/main, /issues, /issues/1;
  users.cecs.anu.edu.au/~bdm/data/ramsey.html.
- The code search `C35 "R(3,10)"` also returned two files of carlostoledo1891/multitrack; that repository is private
  (checked), visible only to the signed-in account.
