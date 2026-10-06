# GITHUB OUTREACH MAP: research map, 2026-10-05. NOTHING WAS SENT FROM IT.

This is a read-only map. Every venue was checked on 2026-10-05 with `gh api` GETs, `gh search` and web fetches. No issue was opened, nothing was commented on, starred, followed or forked, and no setting was changed. Each send is the operator's, item by item, after a freshness check (CLAUDE.md; outreach/SEND-QUEUE.md). Our pages live at https://carlostoledo.co/reports/…, all 41 were checked at 200. Register ids refer to certs/claims-ledger.json (132 rows, 131 decided).

## Read first: record corrections this pass found (fix before citing anything they touch)

1. **Navier–Stokes is superseded upstream.** The upstream HEAD is now `f9e8bc5b` (2026-09-10, balexeev-oai), one commit after our pin `8937a8f4`. At HEAD, `NavierStokes/R3/ActualCandidate.lean` lines 114–119 supply `energy_bounded` via `CompactEnergy.uniform_finite_energy`, and a new `R3/Theorem.lean` proves `theorem_1_1`. So "the finite-energy clause is absent" holds only at the pin. Affected: /reports/navier-stokes.html and register row `navier-stokes-openai-2026`. This was read from the source only; the HEAD was not built.
   **RESOLVED 2026-10-05:**
   - f9e8bc5b was BUILT here: 486/486 modules, axioms only propext, Classical.choice and Quot.sound.
   - Recorded in corpus/navier-stokes/upstream-f9e8bc5b.json.
   - The register row moved PARTIAL → CERTIFIED, with the pin's PARTIAL kept as history.
   - The page is re-dated, with a new §4b.
   - Comparator was not re-run at f9e8bc5b.
2. **The #1038 supremum is already settled.** /reports/erdos1038-sup.html says "Tao's conjecture itself … remains open". But erdosproblems.com/1038 records `sup = 2√2`, and formal-conjectures marks `erdos_1038.parts.ii` `research solved`, "proved in [Tao25]". Our 2026-09-01 comment on teorth/erdosproblems#179 presents the per-degree results as "certified progress on the supremum side".
3. **A count slip in our 2026-09-08 comment on vinid/einstein-arena#64.** It says "840 distinct directions with 41,128 exact contacts". `certs/mc100-einstein-arena.json` (`withoutRepeats`) gives **40,992**. The figure 41,128 counts the repeated entry's 136 contacts twice.
4. **The λ(4) page header is stale.** /reports/lambda4.html says "No independent re-verification has run yet". The same page describes rainrzk's no-shared-code re-certification of 2026-09-30.
5. **The claims and rerun pages count 87 rows.** /reports/claims.html, /reports/rerun.html and RERUN.md say 87 decided rows, built 2026-10-02. The register now holds 131 decided. Every GitHub send of 2026-10-05 links /reports/rerun.html. (corpus/rerun-kit.json already lists the five mc100 records; the page was simply not rebuilt.)
6. **The diagonal-Ramsey page misses two newer bounds.** /reports/diagonal-ramsey.html ("3.7823, then 3.7721") does not mention either:
   - R(k,k) ≤ 3.769^(k+o(k)), kernel-checked in Lean (wamlat/RamseyLean-bootstrap, Neisler–Shin–Sukhatankar, Zenodo 22263823, 2026-09-03);
   - Lu–Wang's R(k,k) ≤ 3.69507^k (arXiv 2609.14525, "Retained-Set Descent for Diagonal Ramsey Numbers", 2026-09-13; not checked here).
   Our GNNW result confirms the paper's own remark; it is not a record.
7. **Kissing page fixes:**
   - The author signs his name "Alexey Kravatskiy" (MIRIAI). The page writes "Kravatsky".
   - "No paper" should read "no arXiv paper": `paper/kissing46.pdf` (47 pp) is in his repo.
   - Dims 25–27 are "joint work in progress with H. Cohn and B. Lindow". That wording is in his paper and KNOWLEDGE.md, not the README.
   - B. Lindow already ships exact verifiers for Kravatskiy's 25–31 (btlindow/KissingNumbers). He is a collaborator, so this is not a third-party check. K(18) has no outside check except ours.
8. **The polymaps gist pin names a blob, not a revision.** `1f974e34` is the file blob. The gist's only revision is `2224dace` (Spacerat, 2026-07-20).
9. **Three slips in this task's own brief:**
   - The Ramanujan Machine's refuted row is a sign slip on the 2022 sheet. The ζ(3) sheet survives whole.
   - rm-audit counts 51 printed rows, 50 surviving.
   - The AlphaEvolve minimum-overlap residual is Σh − n/2 = −2.4e-15 (easota). The figure 1.93e-13 belongs to the live leaderboard's CodexProLong entry.

---

## §0 Our presence: the fixes (facts as of 2026-10-05)

**APPLIED 2026-10-05 on the operator's "Go":**
- 0.1: the description, verbatim.
- 0.2: the 20 topics.
- 0.3: labels `claim` and `rerun`.
- 0.4 and 0.5: the README badge now points at the concept DOI, and δ₃ is on the first screen.
- 0.6: the claims and rerun pages rebuilt to 131 rows.
- 0.8: Wiki and Projects off.
- 0.13: the profile README, at https://github.com/carlostoledo1891/carlostoledo1891.
- 0.14: mfg-lab +3 topics.

**LEFT FOR THE OPERATOR:**
- 0.11: the bio.
- 0.12: the pins; GitHub has no API for pinning.
- 0.9: CONTRIBUTING.md, optional.

| # | Item | Now | Set to | Why |
|---|---|---|---|---|
| 0.1 | Repo "About" description | "The conjecture engine: generate mathematical objects at scale, screen in float, certify the survivors exactly. Certified audits of published AI-generated mathematics. A REFUTED here is proved." | `Independent exact certification of machine-generated mathematics — exact arithmetic, no code shared with the claimant, refusal as a verdict.` (140 chars, verbatim) | CLAUDE.md D1: the ONE description is never paraphrased. The current text is the pre-09-03 engine line. |
| 0.2 | Topics | none | ai4math, computer-assisted-proof, interval-arithmetic, erdos-problems, ai-for-math, alphaevolve, rigorous-numerics, exact-arithmetic, certified-computation, mathematical-discovery, rl-environments, rlvr, reward-hacking, llm-evaluation, llm-benchmark, reproducibility, automated-reasoning, number-theory, combinatorics, tensor-decomposition (20, GitHub's maximum). Alternates: gsm8k, sphere-packing, kissing-number, oeis, evals. | Repo counts per topic are in §4. Avoid lean4 / theorem-proving / formal-verification (they imply proof-assistant work), and verification / benchmark / mathematics / matrix-multiplication (swamped by unrelated repos). |
| 0.3 | Issue-form labels | `claim.yml` applies label `claim` and `rerun.yml` applies `rerun`. The repo has only GitHub's 9 default labels. | Create labels `claim` and `rerun`. | A form label that does not exist is dropped, so claims and reruns arrive unlabelled. |
| 0.4 | README DOI badge | `10.5281/zenodo.22225861` (λ(4) deposit, version 1) | Concept DOI `10.5281/zenodo.22225860` (resolves to the latest, now v2026.10 = 23171167) | CITATION.cff already carries the concept DOI. |
| 0.5 | README first screen | λ(4) and λ(5). δ₃ appears nowhere in README.md. | Add one δ₃ = 117/2192 line on top, linking /reports/delta3.html and doi:10.5281/zenodo.23171167, with "read line by line by the author; not refereed; not formalised". | Today's release and DOI are δ₃. |
| 0.6 | /reports/rerun.html, RERUN.md, /reports/claims.html | 87 rows | Rebuild (correction 5 above). | These are linked from every send of 2026-10-05. |
| 0.7 | Discussions | off | Keep off. | The two issue forms are the intake; a second channel splits it. |
| 0.8 | Wiki, Projects | both enabled, both empty | Disable both. | Empty tabs. |
| 0.9 | CONTRIBUTING.md | absent (community profile 42%) | Optional, ~10 lines: "submit a claim" → `?template=claim.yml`; "report a rerun" → `?template=rerun.yml`; what is decided and what is refused; claimant code is never run. | GitHub shows CONTRIBUTING on the new-issue page. |
| 0.10 | Releases, DOI, CITATION.cff | 7 releases; v2026.10 (2026-10-05) → doi:10.5281/zenodo.23171167; CITATION.cff matches | nothing | consistent |
| 0.11 | Profile bio | "Independent Researcher"; blog www.carlostoledo.co; 0 followers | `Independent exact certification of machine-generated mathematics.` | The bio is the only text on every issue hovercard, and today 13 threads show it. |
| 0.12 | Pinned repositories | none | cert-machine, then mfg-lab (the only two public repos) | |
| 0.13 | Profile README (`carlostoledo1891/carlostoledo1891`) | does not exist (404) | Outline below | |
| 0.14 | mfg-lab topics | fokker-planck-equation, hamilton-jacobi, mathematics, mean-field, mean-field-games, mean-field-theory, partial-differential-equations | Add computer-assisted-proof, interval-arithmetic, rigorous-numerics. | Its README describes Krawczyk / radii-polynomial certificates. |

**Profile README outline:**
1. The ONE description, verbatim.
2. A "Start here" table (what · link · what to inspect):
   - the proofs: λ(4), λ(5), δ₃;
   - the claims register (132 rows, CERTIFIED / REFUTED / REPAIRED / PARTIAL / NEEDS DATA);
   - the rerun kit (stdlib verifiers);
   - "send a claim" (the issue form);
   - the three Environments Hub environments.
3. The concept DOI.
4. One line: "Published, not peer-reviewed; built with Claude, disclosed."

Comparable profiles: seewoo5 (one-line role plus links), pitmonticone (projects grouped by area), Agnuxo1 (a Start-here table).

---

## §1 Already done on GitHub (13 touchpoints, 0 PRs; every one re-read 2026-10-05)

| Venue | What we posted | Date (UTC) | State | Replies after us | Waiting on |
|---|---|---|---|---|---|
| teorth/erdosproblems#164 (Woett, "HELP WANTED: computing sequence for #290") | 3 comments | 08-04, 08-31, 08-31 | open | **Woett, 09-08:** his arXiv 2609.00104 proves liminf = 1/(1+c), "so the earlier constant of 1/(2c) is no longer relevant". He asks no question. | **US, as a courtesy.** Draft `outreach/erdos290-issue164-reply-2026-09-08.md`, unsent for 27 days (P2 #6). |
| teorth/erdosproblems#179 (teorth, "Beat the AI" on #1038) | 2 comments | 09-01, 09-03 | open | none | them; see correction 2 |
| teorth/erdosproblems#392 (ours: λ(4) exactly determined) | the issue, plus our reply to rainrzk | 09-01, 09-30 | open | rainrzk's audit (09-30), answered; ours is the last post | nobody. PR #411 (Chessing234, merged by teorth 09-18) encoded our cubic in `scripts/lambda4_cubic.py` as the "unique real root" (P3 #20). λ(5) is not mentioned anywhere on GitHub. |
| vinid/einstein-arena#64 (ours: the 604 vectors) | the issue, our thanks, the R3 comment | 09-03, 09-08, 10-05 | closed 09-08 by vinid | vinid (09-07) gave the vectors' path | them. Correction 3 applies to our 09-08 comment. |
| tadamcz/erdos1#2 (ours: effective sets) | the issue | 09-16 | open, 0 comments | The owner pushed 09-17 and 09-21 without replying. | them; do not bump |
| Pengbinghui/pipeline-math#5 (ours: #1038 Appendix A) | the issue | 08-05 | open, 0 comments | Repo silent since 07-20; all 5 issues unanswered | nobody (dead) |
| safety-research/automated-w2s-research#2 (ours: disposition lane) | the issue | 08-04 | open, 0 comments | 2 commits ever (last 04-13); no maintainer comment on anything | nobody (dormant) |
| gmDevi/zeta-7-21-lean#1 (huntrontrakkr's, third party) | 1 comment (exact I_out) | 10-05 22:09 | open | none | them |
| PrimeIntellect-ai/verifiers#2775 | the issue | 10-05 22:35 | open, 0 comments | — | them |
| METR/eval-analysis-public#43 | the issue | 10-05 22:36 | open, 0 comments | — | them |
| rainrzk/erdos510-lambda4-audit#1 (R1) | the issue | 10-05 22:36 | open, 0 comments | — | them |
| dualverse-ai/station_data_v2#2 (R3) | the issue | 10-05 22:36 | open, 0 comments | — | them |
| suvrit/count-ex-machina#1 (R4) | the issue | 10-05 22:36 | open, 0 comments | — | them |

Our own repo has 7 releases (lambda4-v1.0 … v2026.10), 0 issues, 0 stars and 0 forks. Off GitHub (context only): the erdosproblems.com #1 comment is public; the #510 comment and the #1186 proof claim are in moderation. erdosproblems.com/1186 shows Comments (0) and Proof claims (0) at the time of this check.

---

## §2 Candidate sends, ranked (none sent)

Every row was checked against §1 for duplicates; R1–R5, M4 and P2 of SEND-QUEUE are done and not repeated. The "re-derive" command is run from a clone.

| # | P | Venue | Type | What we bring (register id · page · re-derive) | Why they would care | Constraints / etiquette | Effort | Status |
|---|---|---|---|---|---|---|---|---|
| 1 | **P1** | teorth/optimizationproblems | new PR, Markdown only | Independent replay of three asterisked bounds, no code shared with the claimants: `optconst-3b` C3b ≥ 1.77898884 (MI2026, 13-point), `optconst-3c` C3c ≥ 1.6747338950414058 (L2026, 147-point), `optconst-71` C71 > 6.521845710923046575 (Num2026), all CERTIFIED. /reports/optimization-constants.html. Re-derive: `node tools/run-sumdiff-ledger.js --check` · `python3 tools/verify_sumdiff.py` (stdlib) · `python3 tools/run-fei-ledger.py --check`. | Tao on #176 (2026-09-26): "If the 13-point certificate does get independently replayed, or formalized, the asterisk comes off — that is the point of it. … I would happily take a PR that removes it on those grounds." CONTRIBUTING: the marker "is removed when … the argument is formalized or independently replayed". Precedent: #146. The PR also fixes the README-vs-page asterisk mismatch on 3c and 71a. | CONTRIBUTING: "Markdown changes only". Link the replay from outside (pinned commit + doi:10.5281/zenodo.23171167). Edit the README cell, the constant-page row and the "Recent progress" line. Note AI use. One constant per PR, or one PR with three clearly separated changes. | low | ready to draft (item (c) of the 09-29 list; no file yet) |
| 2 | **P1** | ewang26/HorizonMath | new issue | `horizonmath-ramsey-asymptotic` REFUTED (checker-wider-than-definition):<br>• the pair (X(1), Y(1)) = (0.22745, 0.9988) lies outside GNNW's region R; 56 of 201 decided points are outside R;<br>• `validators/ramsey_asymptotic.py:299` reads `return max(mp.mpf(0), min(bu, bs))`, an "either orientation" rule (re-read at HEAD 4ef0b61a today); with `max` the certificate fails on its first interval.<br>Also `horizonmath-keich-thin-triangles-128` CERTIFIED exactly (6008623/55050240), and `horizonmath-gpt56-closed-forms` NEEDS DATA (ask for the three expressions). /reports/horizonmath.html. Re-derive: `python3 tools/run-horizonmath-ledger.py --check`. | An ICML AI4Math best-paper benchmark whose headline discovery (3.7992 → 3.6961) does not hold as certified. The project page and arXiv v2 still state it. Maintainers are active (last commit 09-26; issues answered within days). | Say "the certificate is refuted, not the inequality". Tag @le-big-mac, author of the validator in PR #1. The README's "Contributing" invites issues. No licence: quote, don't copy. Decide the order against R2, since Norin owns region R. Lu–Wang's 3.69507 is unverified context only. | low (the text is on the page) | ready to draft (item (b) of 09-29) |
| 3 | **P1** | gist CoolRmal/5368357cd781d7e5c676c9d68ad24d22 (Yongxi Lin, CMU) | gist comment | The 147-point checker `check_cert.py` encloses the ratio at 100 digits. Its last line, `mpmath.mpf(lo_str) >= mpmath.mpf(claimed)`, runs at the default 53 bits and prints OK for the FALSE C3c ≥ 1.6747338950414059. Fix: compare as Fractions, or at `mp.dps = 100`. The bound itself is CERTIFIED (`optconst-3c`). Re-derive: `python3 tools/verify_sumdiff.py`. | A concrete bug in the checker behind a merged registry entry (PR #185, merged 09-26, 0 comments). The author works in Lean and verification. | No licence: quote, attach nothing. Send with #1 or just before it, so the PR can cite it. | trivial | ready to draft |
| 4 | **P1** | k-nic/Leech_lifting (Takhanov–Yun, arXiv 2609.21591) | new issue | K(25) ≥ 197,058 decided exactly (REPAIRED: float decode/snap; every decoded point equals the published float bit for bit). **Measured:** the d31 array stores the four added points as (±0.501179·u, 0.865343·v), while README §5 writes (±u/2, (√3/2)·v), so the two describe different configurations. Ask which one the paper certifies. 26–31 remain QUEUED here. /reports/kissing.html §4. Re-derive: `python3 tools/pin-kissing-wave.py --fetch` then `python3 tools/run-kissing-wave.py` (~25 min). | A discrepancy nobody has raised: 0 issues ever; HEAD 12a06bc unchanged since our pin. | **No licence:** numbers and short quotes only, no files. Say plainly that neither configuration is refuted. | low | ready to draft |
| 5 | **P1** | alexlegeartis/KissingNumbers (Alexey Kravatskiy, MIRIAI) | new issue (alternative: email `kravatskii.a@miriai.org`) | K(18) ≥ 8,358 WITNESSED exactly in Z[√3], the first outside certification with no shared code (+704 on Cohn–Li). K(26) ≥ 199,806, K(28)–K(31) WITNESSED. K(25) ≥ 197,579 REPAIRED (the float heads decode bit for bit; Qiushi's `baseline-heads.json` carries the same exact leans). Dims 49–63, 68–71, 73–96 publish counts only (NEEDS DATA). /reports/kissing.html §4. Re-derive as in #4. | His only checks of K(18) are his own two scripts. Lindow's independent verifiers cover 25–31, not 18. | Spell the name "Kravatskiy". Dims 25–27 are unpublished joint work with Cohn and Lindow per his paper: stay neutral, lead with 18. Fix correction 7 first. MIT licence. 0 issues ever, so the email may be the better channel. | low | ready to draft |
| 6 | P2 | teorth/erdosproblems#164 | reply to Woett | Under his theorem, liminf (b(a)−a)/log a = 1/(1+c) ∈ [0.546083759260, 0.546323774021] with no assumption, which is three digits. /reports/erdos290.html. | It is the help-wanted thread's own question (the sequence and its digits), and he engaged. | No question is pending, so keep it short. CONTRIBUTING lines 93 and 159: **AI-generated OEIS submissions are forbidden**, so promise no OEIS entry. Re-run the report before pasting. | low | **draft exists:** `outreach/erdos290-issue164-reply-2026-09-08.md` |
| 7 | P2 | teorth/optimizationproblems | new issue (or a Markdown PR) | `optconst-84b` REPAIRED: the chain the note prints gives c ≤ 0.0007150507 for every choice of parameters, so C84b ≤ 1.999281 (c ≥ 0.000719) is out of reach of the cited calculation. What it proves is C84b ≤ 1.9993. Re-derive: `python3 tools/run-sumproduct-ledger.py --check`. | A registry value the cited source does not support. Nothing exists on GitHub about it. | Quote the note (althofer.de/improved_constant_052.tex) exactly. As a courtesy, tell Althöfer first; his note sits in erdosproblems forum thread 52, not on GitHub. Note AI use. | medium | ready to draft |
| 8 | P2 | teorth/optimizationproblems PR #184 (A. Röhrig with Codex) | review comment | `optconst-42a-pr184` PARTIAL: the eight-block limiting inequality is decided, \|Y\|/D ≤ 0.68898209850 < 0.688983; the asymptotic reduction is prose. Same reading as Griego's `optconst-42a`. The C51 half of the PR was not decided here. Re-derive: `python3 tools/run-turan-ledger.py --check`. | Open since 09-09 with 0 reviews or comments; merge state "dirty". | Do not call the bound verified; the asterisk stays. | low | ready to draft |
| 9 | P2 | togethercomputer/EinsteinArena-new-SOTA (@ykwon0407) | new issue | `ea-circles-ours_2026` REPAIRED. As published, w + h − 2 = +4.2e-14 (exact) and 44 pairs overlap. Today's live EinsteinArena verifier (Fraction box check, fetched 10-05) therefore rejects the repo's own file. The exact repair, 2.3658323758318174, still beats AlphaEvolve's WITNESSED 2.3658321334167631. Add the flat-polynomial point: the grid score vs the certified supremum (`ea-flat-ours_2026`). /reports/easota.html. Re-derive: `node tools/run-easota-ledger.js`. | The README says its verifier "matches" the platform's, and its SOTA file no longer passes the platform. | Dormant since 2026-04-12; #13 unanswered. No licence, no CONTRIBUTING. The overlap row already went to vinid on #64 today, so do not repeat it. | low | not drafted (noted 09-08 in memory) |
| 10 | P2 | Oxelra-AI/Qiushi-Engine-Kissing-Number-Research | new issue | K(25) ≥ 197,580 and K(27) ≥ 201,567 WITNESSED: their +1s hold exactly. Dims 43 and 45 publish counts only (NEEDS DATA): ask for the vectors. 32–39 and 49–55 are not yet decided here (say so). Re-derive as in #4. | A confirmation from outside; 0 issues ever. | Code MIT, data CC BY 4.0. Authors at Zhejiang University. | low | ready to draft |
| 11 | P2 | test-time-training/discover (TTT-Discover) | comment on closed #19, or a short new issue | `ea-overlap-ttt_discover_2026` REPAIRED: as published Σh ≠ n/2; the normalised bound is exactly 0.3808753232177187, of which the printed 0.380876 is the ceiling. `ea-autocorr-ttt_discover_2026` CERTIFIED, C₁ ≤ 1.5028628982558265. Re-derive: `node tools/run-easota-ledger.js`. | Settles #19 ("returns self-claimed c5_bound, unverifiable as-is"), which vinid closed by pointing at the notebook. | vinid is a collaborator there and already has two of our posts today: wait several days. | low | ready to draft |
| 12 | P2 | incrediblecrab/erdos-1186 | new issue | δ₃ = 117/2192: their table row "δ₃ = 117/2192 [PRS08] — not improved" is now claimed optimal (proof + five certificates, clean-room verifier). δ₄: BCG's 36 blocks are a strict local minimiser but not the record. /reports/delta3.html. Re-derive: `node instruments/delta3/verify.js` (~1–4 s). | They work on upper bounds for #1186 and stop at k = 3 because nothing beats PRS; this says why. | **Blocked** until the #1186 proof claim is visible on the forum, the same gate as delta3-forum.md B–D. AI disclosure. | low | blocked on the forum claim |
| 13 | P2 | subroy13/awesome-ai-proofs | PR (one YAML file under `data/problems/`) or the issue form | Audit events: the matmul audit (`mm-alphaevolve-48-4x4x4`, AlphaTensor over Q), whose existing row says "Code was not executed", source review "Pending"; HorizonMath Ramsey (debunked); Erdős #852 C* (debunked); later the Navier–Stokes event, after correction 1. | The exact scope of the list: "failed attempts, corrections, disputes and evaluation questions belong under Research". | Factual fields; `models` from the operator only, else "Not specified". The maintainer has never handled an outside contribution. Send the HorizonMath row only after #2. | low | ready to draft |
| 14 | P2 | Omni-Scientist/Awesome-AI-Scientist | PR, one line | `- [cert-machine](https://github.com/carlostoledo1891/cert-machine), Re-decides published machine-generated mathematical claims in exact rational and interval arithmetic without running the claimant's code, and publishes certified, refuted and refused verdicts with standard-library verifiers.` under "Peer review & verification" | Lists AlphaEvolve, FunSearch, AlphaTensor and Formal Conjectures; there is no verification-layer entry. | CC BY 4.0. Comma format; link-check and awesome-lint must pass. Last merge 10-03. Do §0 first. | low | ready to draft |
| 15 | P3 | snorin239/RamseyLean (Norin) | new issue | `gnnw-gai-3782` CERTIFIED: Remark 17's G_AI gives R(k,k) ≤ 3.7823287755…^(k+o(k)). The README says Remark 17's "preliminary unverified further optimization … [is] intentionally outside scope". Re-derive: `python3 tools/verify_gnnw_gai.py certs/gnnw-certificate.json` (stdlib, ~8 s). | Fills the stated gap. | **This is R2's GitHub alternative; R2 is the planned email. Do one, not both.** Acknowledge 3.769 (Lean) and Lu–Wang (correction 6): a confirmation, not a record. No licence. | low | alternative to R2 |
| 16 | P3 | teorth/erdosproblems#392 (ours) | one-line follow-up | λ(5) = −L(1,2,4,5,6) exact; λ(6) < λ(5) (/reports/lambda5.html). | Same quantity, same formalization offer. | Forum thread 510 first; CONTRIBUTING sends mathematics to the site. | trivial | after the forum comment |
| 17 | P3 | vinid/einstein-arena#59 (d12 lane) | comment | The live d12 top (#2081, score 2) is 840 distinct directions plus a repeat of entry 0: 40,992 exact contacts and no valid 841 on the lane. `mc100-ea-best-kissing-number-d12`. Re-derive: `node tools/run-mc100-einstein.js`. | Supports the issue's point. | vinid heard most of this on #64; state the corrected count (correction 3). | trivial | optional |
| 18 | P3 | dualverse-ai/station_data_v2#2 | follow-up comment | Configurations 2 and 3 CERTIFIED (`kiss-station-604-2/3`). The 3-D Keller map CERTIFIED non-injective (`mc100-st-jacobian`: det JF = −6, degrees 4, 6, 7, smaller than Gao's G). Re-derive: `python3 tools/run-mc100-station.py`. | Confirmation; they already ship a Lean proof for the map. | **Only after they reply to #2.** | trivial | blocked on their reply |
| 19 | P3 | google-deepmind/formal-conjectures | new issue (template `new_erdos_problem`) | Erdős #1186 has no file. Offer the statement, the published PRS bounds 1675/32768 ≤ δ₃ ≤ 117/2192 as solved variants, and δ₃ = 117/2192 as a `research open` variant. | The site says "Formalised statement? No (create one)". | Our proof cannot be `formal_proof` (not Lean). PRs need the Google CLA. "Do not add an informal proof of an open research problem." | medium | blocked on the forum claim |
| 20 | P3 | teorth/erdosproblems | one-line PR | `scripts/lambda4_cubic.py` (from PR #411) docstring and function name say "unique real root". The cubic has three real roots (≈ −0.1556, 1.0325, 1.5196); λ(4) is the largest. | rainrzk flagged it on #392 and we agreed; the file is unchanged. | Database tooling, so in scope. AI disclosure. | trivial | ready |
| 21 | P3 | google-deepmind/formal-conjectures | new issue (template `new_conjecture_request`) | The hot spots conjecture (Rauch 1974). Zero files, issues or PRs exist (re-checked today). Our certified trapezoid family is context only (/reports/ember.html). | No coverage. | Mathlib lacks Neumann eigenfunctions on Lipschitz domains: say so. Rewrite the opening for the family, as the draft's own header says. | low | **draft exists:** `outreach/formal-conjectures-hotspots-issue.md` |
| 22 | P3 | mo271/Zeta5#3 (keithadler) | comment | Corroborates Adler's "the method fails for ζ(7) by a wide margin", with certified margins: ζ(3) −1.380, ζ(5) −0.185, ζ(7) +1.016, and Catalan's G +0.428 (new). The ζ(5) true margin is 7.5–12× the published normalisations. /reports/zeta-hankel.html. A measurement, not a theorem. | The thread has 0 replies since 09-24. | Mostly overlaps Adler's post; label it a measurement. | low | optional |
| 23 | P3 | benchflow-ai/awesome-evals §6 | PR | `gsm8k-keys` MIXED: all 4,282 test calculator annotations exact; 2 test and 24 train keys print a step that does not hold as printed. /reports/gsm8k-audit.html. | §6 lists label-error audits. | Their format; figures verbatim from the page; disclose affiliation. 49 open PRs, slow queue. | low | ready to draft |
| 24 | P3 | jackburrus/awesome-breakthroughs | PR | Set `disputed: true`, `dispute_evidence: /reports/horizonmath.html` on the HorizonMath record. | The format fits exactly. | Created 09-23, 0 stars, no audience. After #2. | trivial | after #2 |
| 25 | P3 | gist Spacerat/08b4a43f6b6ca57178efabc220170ce8 | gist comment | `polymaps-chv-phi` CERTIFIED: det J = −2 identically, three colliding points; now Prop 6.2 of arXiv 2608.05392. Re-derive: `python3 tools/run-polymaps-ledger.py --check`. | Courtesy to the gist author. | Low value. | trivial | optional |
| 26 | P3 | sebastian-griego/turan-c42-certificate#2 / krplatz/turan-c42-six-level-review | reply | krplatz asks for review of C42 ≤ 0.688970 (six levels, GPT-6 Astra Pro, 09-25, 0 replies). | An explicit review request. | **Blocked:** not decided here. The step-profile decider reproduces Griego's and Röhrig's bounds; estimated 1–3 h. | 1–3 h | blocked on deciding it |
| 27 | P3 | ec-benchmark-organizers/ec-benchmark | new issue (SEND-QUEUE U2) | `ecbench-counts` MIXED: 173 of 176 printed counts exact; contribution 3's one-year row is not the count of the file now in the repo (files rewritten 2020-09-25); 30 of 150 contours not simple, 49 not closed. /reports/ec-benchmark.html. Re-derive: `node tools/run-ecbench-ledger.js`. | The organizers' benchmark. | **Blocked on U1** (the UFSC line). Repo dormant since 2021-06. | low | blocked on U1 |

### §2.1 Found while mapping: claims to decide BEFORE they could be sends (targets, not sends)

- Felpix-Studios/D19-D21-Kissing: τ19 ≥ 12,270 and τ21 ≥ 30,779 (integer rays plus Lean; pushed 10-05).
- Qiushi's dims 32–39 and 49–55 (38 and 39 beat Kravatskiy's queued 591,612 and 756,116).
- krplatz's C42 ≤ 0.688970 (row 26).
- wamlat/RamseyLean-bootstrap's 3.769, which ships a stdlib replay (`code2/verify_pq.py`).
- Lu–Wang's 3.69507 (arXiv 2609.14525).
- incrediblecrab/erdos-1186's δ̃₄ = 159/2888 and δ₅–δ₈ rows.
- google-deepmind/alphaevolve_repository_of_problems community certificate claims #6, #8 (3-D sofa 1.8558), #10 (no-isosceles 58 > 56; 2026-10-04), all unanswered there.
- funsearch#8 (the 1082-cap in n = 9), to revisit once the pool's cap-set row is decided.
- alphatensor#21: a claimed certified 178-XOR circuit for the rank-47.
- teorth/optimizationproblems PR #204: C84a → 1.0427, conditional on the interval-certified ζ inequality H241.

Each needs a corpus/targets.json row (a later session's job; this pass edited nothing else).

---

## §3 Do-not-send list (checked and rejected)

| Venue | Reason |
|---|---|
| teorth/erdosproblems, new issue for δ₃ / #1186 (delta3-forum.md item C) | **Drop it.** CONTRIBUTING line 167: discussion of problems "should occur on the web site"; the issue system is "mostly intended for matters relating to the database entries". On 2026-08-28 teorth closed about 10 partial-result issues (e.g. #340, #358) as problem-page content. #1186 stays `open` for k ≥ 4, so the database has no field to change. The forum claim is the venue. |
| teorth/erdosproblems, issues for the #852 C* correction, #1038 bounds, #1 sets | Same rule. The database has no bounds field; #179 already carries our two comments. |
| teorth/erdosproblems AI-contributions wiki | Frozen 2026-06-30; the README forbids proposals (#330 was closed on exactly that). None of our results is listed. Its live successor is the forum thread "AI Contributions 3", which is not GitHub. |
| teorth/erdosproblems#179, further comments | Nothing pending. If anything, a one-line correction per correction 2 (operator's call). |
| tadamcz/erdos1#2, a bump | No new information; the owner read past it. |
| Pengbinghui/pipeline-math | Dead (all issues unanswered; last push 07-20). |
| safety-research/automated-w2s-research | Dormant code release; no maintainer has ever commented. |
| epoch-research/LeanOpenProblems | A FrontierMath harness repo; we have no built finding for it (the 548 lemma is OPEN). |
| google-deepmind/alphaevolve_results | Nothing wrong to report (16/16 decompositions plus the 593 confirm). Maintainers answer errors, not verification pitches (#7 has been unanswered since 05-17). PRs need the CLA. |
| google-deepmind/alphaevolve_repository_of_problems, funsearch | Our pools there are undecided (§2.1). Maintainers have been silent since 2025-11 and 2024 respectively. |
| google-deepmind/alphatensor | F2-only is already public (#5, 2022; the Nature paper). Dormant since 2022. |
| google-deepmind/formal-conjectures for #1, #290, #1038 | Already `solved` there. Our results add nothing to a Lean statement, and our #1038 sup results are weaker than the known theorem. |
| openai/NavierStokesAndEuler | Issues off; PRs appear off (REST 404, 0 PRs). The finding is superseded at f9e8bc5b (correction 1). |
| openai/grade-school-math | Archived (read-only since 2024-01). Many "wrong answer" threads already exist. |
| MadryLab/platinum-benchmarks | Inactive since 2025-04; our 2 test-set slips are prose steps under correct answers. Low value. |
| RamanujanMachine org | The result sheets are hosted on ramanujanmachine.com, not GitHub, and the main repo is dormant. The one sign slip goes by email. |
| PrimeIntellect-ai/community-environments (formerly prime-environments) | Closed to community input: issues bulk-closed NOT_PLANNED on 09-29, PRs appear off. The Hub, where our three environments are pushed, is the listing. |
| PrimeIntellect-ai/verifiers Discussions | 9 threads ever, the last unanswered (02-14). #2775 is pending. |
| dualverse-ai/station (main repo) and station-open-reseach | We posted on station_data_v2 today, so a second repo would be spam. The latter is not math. |
| Mosaic Intelligence, Numaro | No GitHub venue with issues (the Mosaic-Intelligence org has 0 repos; unnir has no Numaro repo). Our findings confirm theirs. |
| `henrycohn` GitHub account | Issues off and identity unconfirmed. Cohn's table (cohn.mit.edu) is reached by email. |
| S. Gao; Castañeda–Honorato–Valenzuela-Henríquez; Fauzan | No GitHub repos (Fauzan-Research has 0). Email only (§3.1). |
| incrediblecrab/learning-jacobian-conjecture | 404. |
| btlindow/KissingNumbers | A Kravatskiy collaborator who already verified 25–31. |
| Other ζ(5) Lean repos (danromik, long-mathematics, AxiomMath, simnalamburt, realazthat, domino14) | Our measurement does not bear on their correctness. |
| przchojecki/agentic-erdos | A dormant mirror of the C* forum post; issues never used. |
| u00dxk2/bounds-ledger, rjwalters/lean-genius, Geniusyingmanji/ScientistsLastExam, UndercoverMathGuy/grok, jmsung/einstein | Bots, mirrors or tangential. |
| Lean / sphere-packing communities in general | No open item there that an artifact of ours answers. Felpix's D19/D21 Lean claims are a target (§2.1), not a venue. |
| Awesome lists, rejected | • rossant/awesome-math: needs nomination with "strong independent evidence"; self-nominations closed.<br>• V01dMur10c/awesome-agent-rl-environments: excludes single-turn; ours are `SingleTurnEnv`.<br>• opendilab/awesome-RLVR: papers plus major codebases.<br>• subinium/Awesome-Scientific-LLM-Benchmarks: venue or citation bar.<br>• onejune2018/Awesome-LLM-Eval: last merge 2024-10.<br>• tjunlp-lab/Awesome-LLMs-Evaluation-Papers: inactive since 2024-05.<br>• xhwang22/Awesome-Reward-Hacking: no merges.<br>• nschloe/awesome-scientific-computing: last merge 2023-04.<br>• Xinze-Li-Moqian/awesome-ai4math: "community traction".<br>• 34j/best-of-lean4: Lean only.<br>• ElNiak/awesome-formal-verification: off-topic.<br>• ai4s-research/awesome-ai-for-science: excludes "personal projects"; 3 outside merges ever.<br>• Starscream-11813/awesome-AI4Math, natnew/awesome-ai-scientists: tiny or marginal.<br>• seewoo5/awesome-ai-for-math: papers only, so wait for an arXiv write-up (then FIT).<br>• Inactive paper lists: tongyx361, lupantech, zhaoyu-li, rdi-berkeley, TsinghuaC3I, openags. |

### §3.1 Off GitHub, surfaced by this pass (each a send, each the operator's)

- **Email:**
  - Cohn: K(18) ≥ 8,358 certified; his table still shows 7,654.
  - Gao: the F6/F7 ancillary files promised in arXiv 2608.00222 are absent; G/F4/F5/F6 are CERTIFIED.
  - Castañeda–Honorato–Valenzuela-Henríquez: X-hat's (JX+I)^17 = 0 holds identically, where the paper checks one point.
  - Fauzan: the 7.5–12× margin.
  - The Ramanujan Machine group: the 2022 sign slip.
  - Althöfer: C84b, before row 7.
  - Norin: R2, already planned.
- **OEIS:** teorth/erdosproblems CONTRIBUTING (lines 93, 159) links OEIS's rule that **AI-generated submissions are forbidden**. This bears on SEND-QUEUE 1a (the #852 extension) and 2b (the #290 packs) and should be read before either goes.

---

## §4 Sources (every URL checked 2026-10-05, GET only)

**Our presence:**
- api.github.com/repos/carlostoledo1891/cert-machine (+ /labels, /releases, /community/profile)
- api.github.com/users/carlostoledo1891 (+ /repos, /events/public); GraphQL pinnedItems
- api.github.com/repos/carlostoledo1891/carlostoledo1891 (404)
- api.github.com/repos/carlostoledo1891/mfg-lab
- https://carlostoledo.co/reports/{delta3, erdos1, erdos1038-inf, erdos1038-sup, lambda4, lambda5, erdos290, erdos852, erdos852-h, mercer-program, alphaevolve, kissing, easota, horizonmath, diagonal-ramsey, gsm8k-audit, rm-audit, zeta3-audit, polymaps, keller, optimization-constants, counterexample-machine, navier-stokes, zeta7-anand, zeta-hankel, time-horizon, ember, tensor-rank-bounds, matmul-additions, polynomial-multiplication, rerun, claims, envs, ai-claims-audit, verify-lemniscate, claim-lemniscate, impostors, alien-science, ec-benchmark, return-levels}.html and /paper/delta3.pdf (all 200)

**Touchpoints:** github.com/
- teorth/erdosproblems/issues/{164,179,392} (+ comments)
- vinid/einstein-arena/issues/64
- tadamcz/erdos1/issues/2
- Pengbinghui/pipeline-math/issues/5
- safety-research/automated-w2s-research/issues/2
- gmDevi/zeta-7-21-lean/issues/1
- PrimeIntellect-ai/verifiers/issues/2775
- METR/eval-analysis-public/issues/43
- rainrzk/erdos510-lambda4-audit/issues/1
- dualverse-ai/station_data_v2/issues/2
- suvrit/count-ex-machina/issues/1
- `gh search issues --author/--commenter carlostoledo1891`, `gh search prs --author carlostoledo1891` (none)

**Erdős / Tao registries / formal-conjectures:** github.com/
- teorth/erdosproblems: README, CONTRIBUTING.md, scripts/lambda4_cubic.py, tests/test_lambda4_cubic.py; issues #151, #164, #179, #300, #308, #316, #330, #340, #341, #342, #352, #355, #358, #371, #392, #436, #439, #447; PR #411; the wiki (AI-contributions-to-Erdős-problems)
- google-deepmind/formal-conjectures: CONTRIBUTING, AGENTS, STATEMENTS, PROOFS, ISSUE_TEMPLATE; FormalConjectures/ErdosProblems/{1, 290, 510, 1038, 1187}.lean; issues and PRs #762, #977, #4685, #5276, #5278, #5293, #5470, #5581, #6436, #6448, #6449, #6580, #6591, #6608
- teorth/optimizationproblems: README, CONTRIBUTING; constants/{3b, 3c, 42a, 71a, 84a, 84b}; #92, #93, #103, #130, #146, #158, #159, #168, #176, #184, #185, #204
- gist.github.com/CoolRmal/5368357cd781d7e5c676c9d68ad24d22
- epoch-research/LeanOpenProblems
- przchojecki/agentic-erdos (notes/ep852.md)
- u00dxk2/bounds-ledger
- rjwalters/lean-genius PR #41939
- Geniusyingmanji/ScientistsLastExam PR #36
- jmsung/einstein
- UndercoverMathGuy/grok
- TheJustinSunPrize/awards

Sites: erdosproblems.com/{1, 290, 510, 852, 1038, 1186}, erdosproblems.com/forum/ (rules), erdosproblems.com/forum/thread/510; oeis.org A078515, A053597

**AI-discovery platforms and benchmarks:** github.com/
- google-deepmind/{alphaevolve_results (#2, #6, #7), alphaevolve_repository_of_problems (#4, #6, #7, #8, #9, #10), alphatensor (#5, #21), funsearch (#8)}
- togethercomputer/EinsteinArena-new-SOTA (#13)
- vinid/einstein-arena (#56–#64)
- dualverse-ai/{station, station_data, station_data_v2, station-open-reseach, station-open-reseach_data, dualverse-ai.github.io}
- ewang26/HorizonMath: issues #1–#9; validators/ramsey_asymptotic.py at 4ef0b61a; data/problems_full.json; docs/index.html
- openai/grade-school-math (#25, #30, #35)
- openai/NavierStokesAndEuler: commits 8937a8f4 … f9e8bc5b; R3/ActualCandidate.lean, R3/CompactEnergy.lean, R3/ProblemStatement.lean, R3/Theorem.lean
- test-time-training/discover (#19; results/mathematics/ttt_erdos_sequence.json, ttt_ac1_sequence.json)
- MadryLab/platinum-benchmarks (#2, #3)
- RamanujanMachine/* (12 repos)
- PrimeIntellect-ai/{prime-environments → community-environments (#758, #778, #786), prime-envs, verifiers (Discussions)}
- ec-benchmark-organizers/ec-benchmark (issues #1–#8, commits); virocon-organization/virocon

Sites: einsteinarena.com/api/problems/{circles-rectangle, erdos-min-overlap, kissing-number-d12}; einsteinarena.com/api/solutions/best?problem_id={1,18,22,24,25}; arxiv.org/abs/2603.15617; arxiv.org/abs/2609.14525

**Kissing, polynomial maps, constants, ζ, Ramsey:** github.com/
- alexlegeartis/KissingNumbers (README, KNOWLEDGE.md, paper/kissing46.tex, RESULTS.md, PR #1)
- btlindow/KissingNumbers (+ -1)
- Oxelra-AI/Qiushi-Engine-Kissing-Number-Research
- k-nic/Leech_lifting
- Felpix-Studios/D19-D21-Kissing
- cheptil/kissing-number-19-dimensions, kenzkallal/Kissing-Numbers, boonsuan/kissing
- henrycohn
- gist Spacerat/08b4a43f6b6ca57178efabc220170ce8
- incrediblecrab/{learning-jacobian-conjecture (404), erdos-1186}
- aidilamrym-ops/jacobian-conjecture-audit, rk-mlu/kellermap, nmonson1/guide-to-jacobian-conjecture, Arthur742Ramos/jacobian-conjecture-lean, Alacosta2025/jacobian-conjecture-counterexample, fsantibanezleal/CAOS_RESEARCH
- sebastian-griego/turan-c42-certificate (#2)
- krplatz/turan-c42-six-level-review
- 463464q435q43, unnir, Mosaic-Intelligence, mosaicintelligence
- mo271/Zeta5 (#3), keithadler/zeta42 (zeta7/README @ afd4190)
- danromik/zeta5-irrationality, long-mathematics/zeta5-irrationality, AxiomMath/Zeta5Irrational, simnalamburt/zeta5, realazthat/zeta5-lean2, domino14/zeta5
- Fauzan-Research, fcalegari
- snorin239/RamseyLean, wamlat/RamseyLean-bootstrap
- sichen-wang/diagonal-ramsey-numbers, maaxgrin/ramsey-3792-bound, jaredwilder/diagonal-ramsey-corridor

Sites:
- cohn.mit.edu/kissing-numbers/; hdl.handle.net/1721.1/153312
- zenodo.org/records/{20794135, 20794146, 21497769, 22826419, 22263823}
- arXiv 2608.00222, 2608.05392, 2607.22198, 2608.12543, 2607.18186, 2609.35051, 2609.21591, 2411.04916, 2407.19026

**Discoverability:** github.com/
- subroy13/awesome-ai-proofs
- benchflow-ai/awesome-evals
- Omni-Scientist/Awesome-AI-Scientist
- seewoo5/awesome-ai-for-math
- jackburrus/awesome-breakthroughs
- ai4s-research/awesome-ai-for-science
- Starscream-11813/awesome-AI4Math
- rossant/awesome-math (#193–#197)
- V01dMur10c/awesome-agent-rl-environments, NafiGit/awesome-rl-environments
- opendilab/awesome-RLVR
- subinium/Awesome-Scientific-LLM-Benchmarks
- onejune2018/Awesome-LLM-Eval
- tjunlp-lab/Awesome-LLMs-Evaluation-Papers
- xhwang22/Awesome-Reward-Hacking
- nschloe/awesome-scientific-computing
- Xinze-Li-Moqian/awesome-ai4math
- 34j/best-of-lean4
- ElNiak/awesome-formal-verification
- openags/Awesome-AI-Scientist-Papers, natnew/awesome-ai-scientists
- AI4Maths/awesome-interactive-theorem-prover, ericjiang18/Awesome-Formal-Mathematics
- TsinghuaC3I/Awesome-RL-for-LRMs, rdi-berkeley/awesome-RLVR-boundary
- x-tahosin/awesome-llm-benchmarks, BenchGecko/awesome-llm-benchmarks, jatinsihag2345/awesome-ai-evaluations
- zhaoyu-li/DL4TP, lupantech/dl4math, tongyx361/Awesome-LLM4Math
- tatn/awesome-ai-benchmarks, amao0o0/awesome-AI-Math-Datasets
- ubmids/erdos-verification-gap

Also:
- www.reliable-computing.org/intsoft.html
- Topic counts (public repos) via api.github.com/search/repositories?q=topic:X: interval-arithmetic 155, computer-assisted-proof 106, rigorous-numerics 14, exact-arithmetic 120, certified-computation 22, ai4math 54, ai-for-math 28, erdos-problems 105, alphaevolve 34, mathematical-discovery 8, rl-environments 42, rlvr 172, reward-hacking 161, llm-evaluation 6,703, llm-benchmark 374, reproducibility 4,954, automated-reasoning 162, number-theory 1,651, combinatorics 961, tensor-decomposition 163, gsm8k 98, sphere-packing 18, kissing-number 3, oeis 156
- Profile READMEs of seewoo5, pitmonticone, Agnuxo1, codelion
- app.primeintellect.ai/dashboard/environments/carlos-toledo/{break-the-grader, blind-spot, lattice-claims} (200)
