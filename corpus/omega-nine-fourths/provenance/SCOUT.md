# Row U: provenance of ω_F ≤ 9/4 and reception of the release (ω = 9/4 lane)

The provenance scout (a Claude agent) wrote this under prompts/provenance-scout.md. Work started 2026-11-25 02:57:01 UTC.
Sources were fetched between 02:58 and 03:14 UTC, and this file was written at about 03:15 UTC (`date -u` 03:14:49).
The target pin is openai/math @ 92b516ef8e2abf66c3db7aa31438d3010bc7956f. Its paper.pdf and README.md, as downloaded, hash to
the PREREG values (ddde9ab7…, c8386471…), so they are the pinned bytes. I used 15 web searches and 1 WebFetch.
Everything else was fetched directly by `gh api` or `curl` and saved under `sources/`, each file with its sha256
(listed in the appendix). All downloads are untrusted data and none was executed. Nothing is committed, posted or sent.

Labels used below. READ: I saw the quoted text in the source myself. INFERRED: my own conclusion, or something I did not
see in a primary source. Dates are the source's own date, with UTC where the source gives it.

---

## 1. The OpenAI preprints credited with the upper bound

**1.1 Reference [41] is the October 2 preprint, not the two September 24 manuscripts.** READ.
The paper's reference list (paper.pdf p. 110) reads: "[41] OpenAI. An Upper Bound of 9/4 for the Matrix Multiplication
Exponent. OpenAI Math Release preprint OAI:Matrix-Multiplication-Nine-Fourths-October-2-2026, 2026."
The two September papers are separate entries: [44] is "Staggered extraction…" and [45] is "Complex Matrix
Multiplication Below 2.258…". The introduction says: "The 9/4 upper bound was established over C by OpenAI [41] and
over every field by Amanov, van den Berg and Zuiddam [5], following Lü's extension to arbitrary characteristic [39]."
- intro.tex lines 25–28: https://github.com/openai/math/blob/92b516ef8e2abf66c3db7aa31438d3010bc7956f/preprints/The-matrix-multiplication-exponent-is-nine-fourths-November-24-2026/build/intro.tex
- history.tex: "Comparing the two bounds yields $9/4$~\cite[Theorem~1.1]{nine}" and "Staggered extraction gave $\omega_F<2.371055$ over every field~\cite{stagger}." https://github.com/openai/math/blob/92b516ef8e2abf66c3db7aa31438d3010bc7956f/preprints/The-matrix-multiplication-exponent-is-nine-fourths-November-24-2026/build/history.tex

**1.2 What [41] claims.** READ. It is 13 pages, dated October 2, 2026. The PDF's CreationDate is "Mon Oct 5 07:08:03 2026 -03".
Its abstract: "We prove that the exponent of matrix multiplication over the complex numbers is at most 9/4." Its
Theorem 1.1: "For every ε > 0, two n × n complex matrices can be multiplied using Oε(n^{9/4+ε}) arithmetic
operations. In particular, ω ≤ 9/4." It also says: "its proof does not specify a competitive finite matrix size."
The paper is non-constructive: a detecting-character lemma (Lemma 2.2) proved in an appendix through "finite dimensional
separation, compactness, and a fixed-point theorem".
https://github.com/openai/math/blob/92b516ef8e2abf66c3db7aa31438d3010bc7956f/preprints/Matrix-Multiplication-Nine-Fourths-October-2-2026/paper.pdf

**1.3 When [41] became public.** READ.
- The folder entered the repository in the "Initial commit" adc7f1241b42, dated 2026-10-06T21:58:50Z. The repository
  itself was created at 2026-10-06T21:47:02Z.
- Catalogue entry 107 in overview.tex is titled "Matrix multiplication with exponent at most $9/4$". It "Proves
  $\omega\le9/4$ over $\mathbb C$", and its first link is the October 2 paper.
- INFERRED: the first public appearance was October 6, not October 2.
- https://github.com/openai/math/commit/adc7f1241b42e322a6451854ab7e4b4c146bf78a
- https://github.com/openai/math/blob/92b516ef8e2abf66c3db7aa31438d3010bc7956f/overview.tex (line 292)

**1.4 Lean for [41]: it had a Comparator challenge on October 6, and the November 24 commit removed it.** READ.
- At adc7f124, lean/ComparatorChallenges/MatrixMultiplication.json listed `theorem_names`:
  "OAI.MatrixMultiplication.complex_omega_le_nine_quarters", "…complex_alpha_gt_93_div_200" and
  "…complex_rectangular_omega_lt_523_div_250". It also had `"enable_nanoda": false`.
- The challenge statement is `theorem complex_omega_le_nine_quarters : Arithmetic.omega ℂ ≤ (9 : ℝ) / 4`.
- In commit 92b516ef, the file list for MatrixMultiplication.json and MatrixMultiplication.lean says "removed", and
  MatrixExponent.json/.lean "added".
- The solution module lean/OAI/LinearAlgebra/MatrixMultiplication/Main.lean is still present at the pin. Its git blob
  is 7608542c58cf1d6e2955038e8b35f0a5fb127d0a at both adc7f124 and 92b516ef, so the file is byte-identical.
- At the pin, no Comparator config states ω_ℂ ≤ 9/4 on its own. INFERRED: `square_exponent` would subsume it if it checks.
- https://github.com/openai/math/blob/adc7f1241b42e322a6451854ab7e4b4c146bf78a/lean/ComparatorChallenges/MatrixMultiplication.json
- https://github.com/openai/math/blob/adc7f1241b42e322a6451854ab7e4b4c146bf78a/lean/ComparatorChallenges/MatrixMultiplication.lean (lines 118–128)
- https://github.com/openai/math/commit/92b516ef8e2abf66c3db7aa31438d3010bc7956f
- Caveat: the GitHub API lists only 3000 files for that commit, so the list is truncated. INFERRED: other removals may not show.

**1.5 The scope note never names [41].** READ.
- docs/107.md at adc7f124 was titled "Matrix multiplication with exponent at most 9/4". It listed only the two
  September 24 papers, yet said "The formalized results bound the complex matrix-multiplication exponent by
  $\omega(\mathbb C)\le9/4$ … The square bound implies the paper's weaker $2.258$ headline bound."
- docs/107.md at the pin lists the two September 24 papers plus the two November 24 papers. It still omits [41].
- formalization.yaml does list [41] as a source: "An Upper Bound of 9/4 for the Matrix Multiplication Exponent".
- VibeMathed noticed this on October 7: "The lean/docs page for this family names only the two September 24
  companions, while formalization.yaml lists the 9/4 paper as a source."
- https://github.com/openai/math/blob/adc7f1241b42e322a6451854ab7e4b4c146bf78a/lean/docs/107.md
- https://github.com/openai/math/blob/92b516ef8e2abf66c3db7aa31438d3010bc7956f/lean/docs/107.md

**1.6 The two September 24 manuscripts.** READ. Both are dated September 24, 2026, and both entered the repository on 2026-10-06.
- [45] "Complex Matrix Multiplication Below 2.258 and Rectangular Bounds" (83 pp.).
  - Claim: "Over every field of characteristic zero, we prove that the square matrix-multiplication exponent satisfies
    ω < 2.258, the dual exponent satisfies α > 0.465, and ω (1, 0.709, 1) < 2.092."
  - Its own README on the Python checks: "A zero exit status confirms input integrity only; it does not execute the
    numerical proof." The full replay checks "finite arithmetic interfaces; the tensor constructions and analytic
    allowances remain statements proved in the manuscript."
  - Lean: its α and rectangular bounds were in the removed MatrixMultiplication.json. At the pin they are superseded by
    `dual_exponent` and `rectangular_exponent`.
  - https://github.com/openai/math/blob/92b516ef8e2abf66c3db7aa31438d3010bc7956f/preprints/Complex-Matrix-Multiplication-Below-2.258-and-Rectangular-Bounds-September-24-2026/Complex-Matrix-Multiplication-Below-2.258-and-Rectangular-Bounds-September-24-2026.pdf
- [44] "Staggered extraction for exact matrix multiplication over every field" (35 pp.).
  - Claim: "ωF < 2.371054886006746 < 2.371054887". This is a laser-method bound, not 9/4.
  - README: "These calculations check the finite certificates, not the tensor constructions or limiting arguments."
  - Lean: the Comparator config lean/ComparatorChallenges/MatrixFields.json (`omega_lt_source_constant`,
    `"enable_nanoda": false`) is unchanged since adc7f124 and present at the pin.
  - https://github.com/openai/math/blob/92b516ef8e2abf66c3db7aa31438d3010bc7956f/preprints/Staggered-extraction-for-exact-matrix-multiplication-over-every-field-September-24-2026/Staggered-extraction-for-exact-matrix-multiplication-over-every-field-September-24-2026.pdf
- Outside checks of [44] or [45]: none found. INFERRED from about 15 searches. VibeMathed (07 Oct): "No independent
  mathematician has checked this yet."

**1.7 OpenAI's own verification statements for this release.** READ.
- PR #6 (opened 2026-11-25T00:17:44Z): "Lean and LaTeX builds were not run for this PR."
  https://github.com/openai/math/pull/6
- formalization.yaml: `review:` / `status: unchecked`, and `automation: methods: - method: agent`.
- openai/math has issues disabled ("has_issues": false, from the API, read 03:00 UTC). The workflow lock-prs.yml
  auto-locks pull-request conversations. So GitHub carries no public reaction channel on the repository itself.
  https://github.com/openai/math

**1.8 The division claim is in docs/379.md, not docs/107.md.** READ. docs/379.md is the family-379 scope note, which PR #6
points to. PREREG's "read before the seal" list does not include it. It says: "Lean also proves that allowing division
preserves the square exponent. In any circuit for matrix multiplication, the total number of multiplication and division
gates is at least half the tensor rank over the algebraic closure of $F$. The paper's lower bound of
$\lceil n^{9/4}/2\rceil$ on the number of nonscalar multiplication or division gates at each side length $n\ge2$ remains
unformalized." https://github.com/openai/math/blob/92b516ef8e2abf66c3db7aa31438d3010bc7956f/lean/docs/379.md

---

## 2. Amanov–van den Berg–Zuiddam [5], Lü [39], and the other outside checks of the upper bound

**2.1 [5] Amanov, van den Berg, Zuiddam, "Multiplying matrices via polynomials: exposition and barriers"** (arXiv:2610.30054v1, 21 Oct 2026). READ.
- arXiv lists cs.CC, math.RA and math.RT. It has no journal reference, so it is not refereed.
- Abstract: "We give an exposition of OpenAI's recent proof that … ω_ℂ ≤ 9/4. Our version of the proof gives
  ω_𝔽 ≤ 9/4 over every field 𝔽."
- The abstract also proves an "operational barrier … showing that the current analysis of all these upper bounds … is
  optimal and that in fact the current degeneration ingredients cannot improve the bounds."
- In the PDF: "Theorem 1.1. For every field F, ωF ≤ 9/4."
- "Theorem 5.4 (Operational barrier)… (ii) In particular, if n1 = n2 = n3 = n, then n^{9/4} ≤ r … no such relation, and
  no limit of such bounds, gives an upper bound on ωF below 9/4."
- https://arxiv.org/abs/2610.30054

**2.2 OpenAI's exact rectangular formula equals [5]'s bound.** INFERRED: my check, in exact rationals.
- For x ≥ y ≥ z > 0 the formula is x+y+[max(0,(x+y)z−xy)]²/(4xyz).
- It equals [5]'s Theorem 1.2 upper bound (a+b+c)/2+(ab/c+ac/b+bc/a)/4 in the range c(a+b) > ab.
- It also equals [5]'s barrier (5.1), which is a+b, or (ab+bc+ca)²/(4abc).
- Algebraically, (ab+bc+ca)² − (ac+bc−ab)² = 4abc(a+b).
- 0 mismatches over 20,000 random rational triples, run with Python `fractions`.

**2.3 [39] Houxi Lü, "Polynomial Separation of a Shared Tensor Leg and Matrix Multiplication in Arbitrary Characteristic"** (arXiv:2610.18914v1, 12 Oct 2026). READ.
- cs.CC, 5 pp., not refereed.
- "We improve the shared-leg separation construction in Proposition 3.1 of OpenAI … this reduces the number of source
  copies from 5M to 2M−1 … Over an algebraic closure, the replacement therefore gives ω≤9/4 in every characteristic."
- It is stated only for algebraically closed fields: "Corollary 4.1. For every algebraically closed field K, the matrix
  multiplication exponent satisfies ωK ≤ 9/4."
- Acknowledgements: "I would like to thank GPT 6.1 Sol (OpenAI) and Deepseek V4.1 Flash (Deepseek) for completing a gap
  in an earlier proof, checking the validity of my proof and generating the format of this paper."
- The November 24 paper uses Lü's "Proposition 2.1" inside its own lower-bound argument (contact.tex line 107: "in the
  interpolation form of~\cite[Proposition~2.1]{lu}").
- https://arxiv.org/abs/2610.18914

**2.4 Other outside write-ups of ω ≤ 9/4.** All READ, from abstract pages. None has a journal reference.
- Uznański, arXiv:2610.10494 (v1 07 Oct, v2 11 Oct): "we extend the matrix-multiplication analysis by OpenAI to
  rectangular products … α≥1/2". Cited as [55]. https://arxiv.org/abs/2610.10494
- Pass, arXiv:2610.28627 (v1 20 Oct, v2 30 Oct): "a self-contained constructive proof … OpenAI … using non-constructive
  arguments … multiplies two n×n integer matrices using O(n^{9/4+γ}) integer arithmetic operations." It is NOT in the
  November 24 bibliography. https://arxiv.org/abs/2610.28627
- Shpilka, ECCC TR26-281 (27 Oct 2026): "We give an elementary, self-contained proof of this bound … to obtain explicit
  algorithms". Cited as [48]. ECCC is a report server, not a journal. https://eccc.weizmann.ac.il/report/2026/281/
- Baitian Li, arXiv:2611.04175 (03 Nov): "an exposition of the recent preprints from OpenAI that establish the bound
  ω≤9/4". Cited as [38]. https://arxiv.org/abs/2611.04175
- Doğan, Lysikov, Sakabe, Walter, arXiv:2611.09716 (06 Nov): "OpenAI's recent result that the exponent of matrix
  multiplication is at most 9/4 valid over every field … fractional symmetrized variant of the tensor value … in place
  of spectral points". Cited as [26]. Its HTML version has the footnote "We provide a Lean formalization at
  http://github.com/qit-lmu/omega". https://arxiv.org/abs/2611.09716

**2.5 Four outside Lean proofs of the upper bound, but only one is independent of OpenAI's code.** READ, from READMEs, NOTICEs and the CI API.
- jzuiddam/omega-nine-quarters-all-fields. One commit, 615b591c, at 2026-10-07T07:40:34Z, with CI "build success".
  - It proves `Arithmetic.omega F ≤ (9 : ℝ) / 4` for every field.
  - "This is a derived work of the Lean library in openai/math, commit adc7f124 … 99 are copied unchanged; 41 are
    modified".
  - Its model is "verbatim as in the upstream comparator challenge".
  - https://github.com/jzuiddam/omega-nine-quarters-all-fields
- selanavot/matrix-multiplication-all-fields (last commit 08481ef2, 2026-10-08).
  - "a focused source fork of OpenAI's mathematics repository".
  - "The extension of OpenAI's proof to arbitrary fields was found and formalized by consumer-grade GPT-6 Astra and
    GPT-6.1 Sol"; "The paper itself was also AI-generated through Codex".
  - It also says: "Over finite fields, the original `P.Correct` predicate expresses equality of functions on
    field-valued inputs, which is weaker than formal polynomial equality—for example, `x²=x` on F₂."
  - https://github.com/selanavot/matrix-multiplication-all-fields
- YuvalFilmus/matrix-multiplication-block-identities (8e38460c, 2026-10-17, CI "Build and verify success").
  - It proves `formalOmega_le_nine_quarters` and `formalAlpha_ge_half`.
  - It vendors selanavot, per its NOTICE: "Original OpenAI and Navot source copyright notices … retained", so it
    descends from OpenAI's code.
  - VERIFICATION.md: "Independent static release review by a separate agent passed".
  - INFERRED: the names `formalOmega`/`formalAlpha` match OpenAI's November challenge names.
  - https://github.com/YuvalFilmus/matrix-multiplication-block-identities
- qit-lmu/omega (1461021e, 2026-11-05, CI "Lean and blueprint success").
  - It proves `MatrixMultiplication.omega_le_nine_quarters (K : Type u) [Field K] : MatrixMultiplication.omega K ≤ (9 : ℝ) / 4`.
  - Its omega is a different object: "`omega K` is the base-two logarithm of the asymptotic rank of the 2 × 2 matrix
    multiplication tensor … this project does not formalize a computational model or prove that its complexity
    exponent equals `omega`."
  - It also proves a third-party statement, Prove2Me's `mme_omega_le_225`, whose definition was "downloaded from the
    public `mme_omega` definition on 2026-11-02 … no proof from that platform is imported"
    (https://prove2.me/missions/Matrix_multiplication_exponent_%E2%89%A4_2.25_over_every_field).
  - A code search finds "OpenAI" only in material/main.tex. INFERRED: the code is independent.
  - https://github.com/qit-lmu/omega
- Priority. READ for the bibliography, INFERRED for the conclusion. The November 24 paper credits every field to [5]
  (21 Oct). It does not cite the October 7 Lean all-fields proofs (jzuiddam, selanavot), and it does not cite Pass.

---

## 3. The state of the art as others state it (after September 2026)

- DeepMind notebook, google-deepmind/alphaevolve omega/verification.ipynb. READ.
  - It was committed at aafb1e26 on 2026-11-04 and is unchanged at HEAD c4269490 (2026-11-11, a README-only edit).
  - Text: "The current best bound is $\omega < 2.371339$, obtained by [Alman et al. 2025] … Here, building on their
    work and using AlphaEvolve, we improve the bound to $\omega < 2.371177$."
  - It does not mention 9/4. The text describes its own arXiv:2608.16884, dated 17 Aug 2026 ("improving the previous
    best bound of 2.371339").
  - INFERRED: this sentence is stale, not a dispute (gap G5).
  - https://github.com/google-deepmind/alphaevolve/blob/c42694909d50/omega/verification.ipynb
- MathWorld, "Matrix Multiplication Exponent". READ. The page footer says "Last Updated: Tue Nov 24 2026" for the whole site.
  - "OpenAI (2026a) announced the bound omega_C<=9/4 over the complex numbers, with an argument attributed to an
    internal OpenAI model. VibeMathed (2026) reviewed the formal statement of that bound. Dogan et al. (2026) give a
    simplified proof … omega_F<=9/4."
  - It also says "the conjecture that omega_F=2 remains open", and it does not mention the lower bound.
  - https://mathworld.wolfram.com/MatrixMultiplicationExponent.html
- VibeMathed entry (added 07 Oct 2026). READ.
  - "Verification Lean-checked, statement unaudited"; "No independent mathematician has checked this yet."; "Not
    rebuilt here."
  - https://vibemathed.com/problem/matrix-multiplication-exponent-9-4
- Wikipedia, "Computational complexity of matrix multiplication", revision 1387680023 (2026-11-25T02:31:58Z). READ.
  - The new paragraph: "OpenAI claimed a proof formalized in Lean that the asymptotic complexity of the best possible
    matrix multiplication algorithm is exactly n^{9/4 + o(1)}. This claim has not yet been reviewed by leading
    mathematicians."
  - The same revision still has a table ending at "2026 || 2.371177" and the sentence "Thus 2 ≤ ω < 2.371177. It is
    unknown whether ω > 2."
  - https://en.wikipedia.org/w/index.php?oldid=1387680023
- Gupta, Suomela, Vahidi, arXiv:2611.15201 (11 Nov). READ. It is downstream use: "by plugging in the latest news
  \omega\leq 9/4 [8, 1] we obtain O(n^{1/9+\epsilon}) rounds". Here [8] is OpenAI's October 2 paper and [9] is Pass.
  https://arxiv.org/abs/2611.15201
- Kalai, 07 Oct 2026. READ. "The new bound is ω≤9/4 over the complex numbers, a substantial advance toward the
  conjecture ω=2."
  https://gilkalai.wordpress.com/2026/10/07/updates-sharing-ai-progress-on-mathematics-amazing-and-my-lecture-plans/
- Aaronson, "The Mathocalypse", 07 Oct 2026. READ. "Matrix multiplication in n^{9/4+o(1)} time—a rational exponent for
  once (!), and via a completely different approach". https://scottaaronson.blog/?p=10169
- Scientific American, 2026-10-08. READ.
  - "Problem 107 claims a new lowest bound of 9⁄4, or 2.25."
  - Vassilevska Williams is quoted generally: "Matrix multiplication is needed all over the place … its complexity is
    one of the great mysteries in computer science" and "In a maybe diabolical sense, the advance on matrix
    multiplication can be seen as an attempt by the LLMs to speed themselves up".
  - INFERRED: neither quote is a verdict on correctness.
  - https://www.scientificamerican.com/article/the-most-exciting-claims-from-openais-heap-of-new-proofs/
- A claim that disputes ω ≤ 9/4 from below. READ.
  - Zhi-Wei Sun, "Tensor Degenerations for Matrix Multiplication", arXiv:2610.13971. It is filed under math.GM. The
    page shows "[v1] Mon, 14 Sep 2026" under a 2610 identifier, as read.
  - Abstract: "the uniform dyadic estimate R_K(M_{2^n}) ≤ 2^{2n+1} which implies that ω(K)≤2+1/n … answers
    affirmatively the long-standing open question whether the value ω(K) is exactly 2."
  - No response to it was found.
  - https://arxiv.org/abs/2610.13971
- No source found that disputes ω ≤ 9/4 itself. INFERRED, from about 15 searches.

---

## 4. Public reaction to the November 24 release (up to 03:14 UTC, 25 Nov)

I found no technical evaluation of the lower bound by anyone outside OpenAI. INFERRED, from about 15 searches and the
direct fetches below. Everything I did find is listed here.
- openai/math: no issues channel (§1.7).
- Wikipedia edit history. READ.
  - 2026-11-25T02:06:58Z: summary "update from oai slop release".
  - 02:23:21Z: "The proven complexity is not n^9/4, it's n^(9/4 + o(1))".
  - 02:31:58Z: "open claimed a lower bound, not an upper bound".
  - October history: 2026-10-07T00:19:33Z, a revert reading "can we wait for human confirmation before posting this?"
  - https://en.wikipedia.org/w/index.php?title=Computational_complexity_of_matrix_multiplication&action=history
- Wikipedia talk page, section "OpenAI result and extensions: ω ≤ 2.25". READ.
  - User Patallurgist, 01:44, 25 November 2026 (UTC): "OAI now claims a matching lower bound, establishing omega=9/4.
    Obviously this can't be added to the article, since we can't put undue weight on major claims like this just
    because the likes of Vassilevska Williams and Scott Aaronson endorse them."
  - User Nolord, 02:31 UTC: "the table of improvements of the upper bound attributes 2.25 to OpenAI when it's due to
    Amanov-van den Berg-Zuiddam. OpenAI claims the lower bound."
  - Earlier, user D.Lazard, 11 Oct: "For the moment, we have no source independent from OpemAI that claims a
    verification of OpenAI claims." (The typo is in the original.)
  - INFERRED: I found no written endorsement of the LOWER bound by either person named.
  - https://en.wikipedia.org/wiki/Talk:Computational_complexity_of_matrix_multiplication
- Shtetl-Optimized, "I've been drinking wine in my kitchen", posted "Tuesday, November 24th, 2026 5:17 pm" (blog local time). READ.
  - The post is about VP≠VNP and RH, not ω.
  - Comment #10 (7:22 pm): "omega = 9/4!!!!!!!!!!!!!!!!!!!!!".
  - Comment #12 (7:33 pm): "UNCONDITIONAL PROOF OF ARITHMETIC CIRCUIT LOWER BOUND!!!".
  - Scott, comment #13 (7:54 pm): "Student #10 and #12: HOLY SHIT. I'll write much more later".
  - https://scottaaronson.blog/?p=10362
- Press. READ.
  - Crypto Briefing (published 2026-11-25T02:36:02Z): "That is a big claim. … A preprint is a paper that has been
    posted publicly but has not yet gon[e]…" https://cryptobriefing.com/openai-matrix-multiplication-exponent-9-4/
  - OfficeChai (2026-11-25T02:31:36Z): "If the proof holds, it settles a question that has been open since Volker
    Strassen kicked off the field in 1969. It also kills one of the most cherished conjectures in theoretical computer
    science: that ω might be 2."
    https://officechai.com/ai/openai-says-it-has-pinned-down-the-exact-speed-limit-for-matrix-multiplication-9-4/
  - Kingy Breakthrough Tracker (revision v2, "Last checked 2026-11-24"): "Evidence Tier 1 · Peer reviewed: No …
    Provisional · Claimed exact exponent with public formalization".
    https://kingy.ai/mathematics-science-breakthrough-tracker/records/cs-matrix-multiplication-exponent-nine-quarters-2026/
- Blogs with nothing on 9/4 as of the fetch. READ.
  - Computational Complexity blog: latest post Tuesday, November 24, 2026 ("VP ≠ VNP"), no 9/4 text on the front page
    or in that post. https://blog.computationalcomplexity.org/
  - Kalai's front page (latest post "Algebraic complexity, VP ≠ VNP, Möbius Pseudorandomness, the Riemann Hypothesis,
    and TYI 61"): no 9/4 text. https://gilkalai.wordpress.com/
- Searches for Mathstodon and X turned up no posts. INFERRED that none exist, which is weak: the search engine indexes
  those sites poorly.
- October context on the Comparator configs. READ, through WebFetch, so not hashed.
  - The OpenAI Community thread "First look at mathematics manuscripts…", user davegoldblatt, 7 Oct 2026: "One
    suggestion: 404 of the 405 comparator configs in the repo leave the second kernel off."
  - User selanavot, 7 Oct: "Long story short, Codex extended the proof to arbitrary fields … Lean verification passes,
    as do Comparator checks."
  - https://community.openai.com/t/first-look-at-mathematics-manuscripts-from-an-internal-frontier-model-at-openai/1403886

---

## 5. Known results the lower bound ω_F ≥ 9/4 would overturn or meet

- **It would refute Strassen's asymptotic rank conjecture for tight tensors.** READ: the paper says so itself. Strassen,
  "Algebra and complexity", First European Congress of Mathematics II, Progr. Math. 120 (1994) 429–446, Conjecture 5.3,
  which is the paper's [53].
  - consequences.tex: "Strassen's conjecture for tight tensors predicts asymptotic rank \(n^2\) in this case
    \cite[Conjecture~5.3]{Strassen1994}. Corollary~\ref{cor:tight} gives \(n^{9/4}\)."
  - Related work (READ, abstracts):
    - Björklund–Kaski, arXiv:2310.11926: "The Asymptotic Rank Conjecture and the Set Cover Conjecture are not Both
      True" ("The conjecture, if true, most notably would put square matrix multiplication in quadratic time").
    - Pratt, arXiv:2311.02774.
    - Kaski–Michałek, arXiv:2404.06427 ("ω=2σ(MM_2)").
  - INFERRED: refuting the conjecture removes that tension and is consistent with the set cover conjecture.
- **It would refute the concrete routes to ω = 2.** READ.
  - Cohn–Kleinberg–Szegedy–Umans, FOCS 2005, 379–388 (arXiv:math/0511460): "We present two conjectures … Either one
    would imply that the exponent of matrix multiplication is 2." Both would be false if ω = 9/4.
  - Blasiak–Church–Cohn–Grochow–Naslund–Sawin–Umans, Discrete Analysis 2017:3 (arXiv:1605.06702), had already ruled out
    "obtaining ω=2 in this framework from abelian groups of bounded exponent".
  - Alon–Shpilka–Umans, "On sunflowers and matrix multiplication", CCC 2012 / Computational Complexity 22 (2013), links
    sunflower conjectures to those ω=2 conjectures. INFERRED: this reference is from memory and was not fetched. Kalai
    links it through his 2011 post "Cap Sets, Sunflowers, and Matrix Multiplication".
- **It would directly contradict Sun's ω = 2 claim.** READ. consequences.tex: "At $n=2^8$ the proposed upper bound is
  $2^{17}$ and our lower bound is $2^{18}$." (arXiv:2610.13971, §3.)
- **It would beat the known lower bounds.** READ. The best previous bounds are a constant times n². INFERRED: the new
  bound would be the first superlinear rank or border-rank bound for an explicit 3-tensor (N^{9/8} at side N = n²).
  - Rank: Bläser, "Lower bounds for the bilinear complexity of associative algebras", Computational Complexity 9 (2000)
    73–112, gives (5/2)n² − 3n over every field. Landsberg, SIAM J. Comput. 43(1) (2014) 144–149, gives 3n² − o(n²).
  - Border rank: Landsberg–Michałek, IMRN 2018(15) 4722–4733, gives 2n² − ⌈log₂ n⌉ − 1.
  - These are as the paper lists them in [11], [35] and [36].
  - Alexeev–Forbes–Tsimerman, CCC 2011, 283–291 (arXiv:1102.0072): explicit tensors with rank "at least
    2n^(floor(d/2))+n-Theta(d log n)", which is about 3n for d = 3.
- **It must get around the rank-method barrier.** READ. Efremenko–Garg–Oliveira–Wigderson, "Barriers for Rank Methods in
  Arithmetic Complexity" (arXiv:1710.09502, ITCS 2018), says: "super-linear lower bounds on explicit 3-dimensional
  tensors, remain elusive" and "(In particular, they cannot prove super-linear, indeed even >8n tensor rank lower
  bounds for any 3-dimensional tensors.)"
  - INFERRED: so the lower-bound proof cannot be a flattening or rank method, at least for n > 8⁴. Phase 3 readers
    should name the step that is not a rank method.
- **It would beat the circuit lower bounds.**
  - READ, via Wikipedia: "The best known lower bound for matrix-multiplication complexity is Ω(n² log(n)), for bounded
    coefficient arithmetic circuits", citing Raz, STOC 2002, 144–151, doi:10.1145/509907.509932.
  - INFERRED: ⌈n^{9/4}/2⌉ nonscalar gates for general circuits on 2n² inputs would be a polynomially superlinear lower
    bound for an explicit bilinear map. For explicit polynomials in general circuits, the classical record is Baur–Strassen
    Ω(N log N), also from memory and not fetched.
- **The barriers to upper-bound methods are consistent with it, not overturned.** READ, abstracts and the paper's citations.
  - Ambainis–Filmus–Le Gall (STOC 2015), the paper's [6].
  - Christandl–Vrana–Zuiddam irreversibility (CCC 2019), the paper's [14].
  - Alman–Vassilevska Williams, "Limits on All Known (and Some Unknown) Approaches" (arXiv:1810.08671).
  - [5]'s operational barrier sits exactly at 9/4 (§2.1).
  - Wikipedia's "there must be an additional factor of n^{o(1)}" (Coppersmith–Winograd: ω is not attained) is
    consistent. INFERRED: the per-n bilinear bound R(T_n) ≥ n^{9/4} follows from ω ≥ 9/4 by the standard
    ω ≤ log_n R(T_n), as the paper's proof of Corollary 1.2 uses.

---

## WHAT THIS CHANGES FOR THE AUDIT

1. [41] is the 2026-10-02 preprint "An Upper Bound of 9/4…" (over ℂ), not the two September 24 papers the brief named. Its Comparator challenge was REMOVED at 92b516ef while its solution Main.lean stayed byte-identical, and neither version of docs/107.md names it. CEN should record whether MatrixExponent's ≤ half reuses that subtree.
2. The upper bound has wide outside support: seven write-ups (Lü, Uznański, Pass, [5], Shpilka, Li, Doğan et al.), none refereed. Of four outside Lean proofs, three descend from OpenAI's October code; only qit-lmu/omega is code-independent, and it uses a rank-based ω, not the program model. G5 is staleness: the DeepMind sentence predates both its own August result and [41], and I found no dispute.
3. Nobody outside OpenAI has checked the LOWER bound as of 03:14 UTC: there is only press, Wikipedia edits and talk, and blog comments. The bound would refute Strassen's tight-tensor conjecture, both CKSU ω=2 conjectures and Sun's ω=2. It would also be the first superlinear (border) rank bound for an explicit 3-tensor, which EGOW show rank methods cannot reach, so P1 must name the step that is not a rank method.
4. docs/379.md, not read before the seal, says Lean proves that divisions preserve the square exponent and that gates ≥ rank/2 over F̄. CEN must test this against G2 and G3: with ω_{F̄} = 9/4 and ω ≤ log_n R(T_n), the per-n bound would be two standard steps away (INFERRED). PR #6 says "Lean and LaTeX builds were not run" and the catalogue says "review: unchecked".
5. The exact rectangular formula equals [5]'s Theorem 1.2 upper bound and its Theorem 5.4 barrier (checked in exact rationals), so F2/F4 have an outside source for its ≤ half. Independence note for the panel: Lü and the selanavot all-fields proof both credit OpenAI GPT-6.x models, the same vendor as writer B.

---

## Appendix: sources (sha256, relative to this folder)

```
94f2103686d83cf922db22466e9b7fdacf117e676b3ec096aec6c304bdb7955b  sources/alphaevolve/README.at-c4269490.md
4764d5619e68ebd9d0ddc07288b0be137dc51588f4e1a80f465f3f3e9d62020c  sources/alphaevolve/verification.ipynb.at-c4269490
a945f18223dbc8b112e59ccca48c0e56ccd3e40f34be2b79f531d133fbd78e50  sources/arxiv/abs-1102.0072.html
459ed31c8e2f24662e2c1fffaeef0dc9f77686dda185a69634eea4a1b0c74a36  sources/arxiv/abs-1605.06702.html
6d44f9669b1f4ab0e8997eea8cc0787b96d9b43c3f04562645aa29ccd6b20de0  sources/arxiv/abs-1710.09502.html
0a7546bc752b2d982826e6335e46389eea3ff7bdc76a3a74a6a3caf8e639b680  sources/arxiv/abs-1810.08671.html
25bb584c0ef6ec5b5903e54e299e511ff9b4c0dc73afa5c1f465ff891b4fa917  sources/arxiv/abs-2310.11926.html
7716f7605bd570c2c343cd1129c0a0c48d5758b5dd13ff29e7e60a61dce46ac4  sources/arxiv/abs-2311.02774.html
3f116a25390f2f3908c05deafe6e70e86591f2aebe233f07ed6956b3fa4eb769  sources/arxiv/abs-2404.06427.html
3085a3f74b8d4adeb214ea36ffd1a9b8447f17e612536dfea7fb0b55c132c355  sources/arxiv/abs-2608.16884.html
9de4ce4058e9624448360f85d7609134c8e6fb1a7fb6de0d60f978cb045822db  sources/arxiv/abs-2610.10494.html
900c88e538f824bd062a7ada0b0e6998a8898104563b2e2f0a7a9c9ad522750b  sources/arxiv/abs-2610.13971.html
5319650f5a59fb9060d8a1bb156f79c73c76bd38c050ff126e2875eb1d1f87e0  sources/arxiv/abs-2610.17090.html
b0e9a0efd4649ccf7a3a2155b8aab51775917a926ead257a03bb6f18e3723513  sources/arxiv/abs-2610.18914.html
7ea78d685376d836da712649e11f1ab9782749994f118c7bcbf0525a10bec835  sources/arxiv/abs-2610.28627.html
1ffae8401a305f7de201f74778089ca6be5f7483a63a797eb6a048e6c848abbc  sources/arxiv/abs-2610.30054.html
16c42608252461c340f0cb90bbc2e156a52ddd1ae86fdd87faf6105ba8f713e1  sources/arxiv/abs-2611.04175.html
aa0174ee792660a9f510b6727c1a1b2dbb259199e5853ba59517e4888ae6c1d9  sources/arxiv/abs-2611.09716.html
1b1e3f866a557364a097e9c566236b9f8b925639d05adf6d0d73e4d0b93b7d17  sources/arxiv/abs-2611.15201.html
83f25456eb84efd4d51c131cc0c4558f92d47c561414d4aa1aa0700102054c23  sources/arxiv/abs-math_0511460.html
08a13e5b84463955c592764c9000cb280b137fa6eb34dbea2758966c527f7848  sources/arxiv/html-2611.09716.html
85502e3e3c58776c95cef2bed6aeecb0b5edd54f40fb8e9ddfd86023b708ad1e  sources/arxiv/html-2611.15201.html
b9f5231c18a786b07819150152072c75ddb50caf68453c57538c92b9fe34567f  sources/arxiv/pdf-2610.18914v1.pdf
00f5ed823228ea84c99806b4b16f5ea1afa5510920250ce96e94079d67dd236a  sources/arxiv/pdf-2610.30054v1.pdf
fa0579f3e70673579e9a16a92e0278b4205a75d615aaeeeac3f75b444d01d19f  sources/eccc/TR26-281.html
5ddb9bd62afbc54fabc9f2bf5e3c5b015e5eabc0e78f072d5bc89947b1fd6b8c  sources/lean-outside/filmus/NOTICE
c6acf802ba1b3ee1723a8db3f8506465c918b0c7b1babe0df56265c8608231c7  sources/lean-outside/filmus/README.md
0d62dc30d5419eb3464fc4bf09e2eede9220c2c3d8c945255170940185e1d89f  sources/lean-outside/filmus/VERIFICATION.md
ca5f1f601d34c49079e38d7e7041eb0f2a9c227fbc1df0f404820069a052330c  sources/lean-outside/filmus/lean-toolchain
1b50ea5e9fd5e72e5a3929adf6daa1c1280aa774046b4d65eb14b7b62fbe1aaa  sources/lean-outside/filmus/vendor-navot-UPSTREAM.md
801964b8e38c0c6d02ca85883dddc44049c776036e4b3c02c8e979a2de0f22d3  sources/lean-outside/qit-lmu-omega/External-Prove2Me.lean
5923bd99b3a66f8a5f7d6a16218b459cf72f086da1867a1de49d75b51395ef8f  sources/lean-outside/qit-lmu-omega/External-Prove2MeDefinitions.lean
eed1247ba00ceb79377de6835e403222d05a5e8e582736233b82a508c14a2a30  sources/lean-outside/qit-lmu-omega/README.md
ca5f1f601d34c49079e38d7e7041eb0f2a9c227fbc1df0f404820069a052330c  sources/lean-outside/qit-lmu-omega/lean-toolchain
3f378bb2a49c35da30ff5202e7b2065ab88867493d3065acd1811fe51e018d83  sources/lean-outside/qit-lmu-omega/prove2me-provenance.json
25ef57746dd00bc0d6383d9a5918867c6a24bb2b1423701627bde7f86dd37a07  sources/lean-outside/selanavot/README.md
5b7a7cd5bfec898a33832d6d4eefaee42df9ca51d977a0d1a740b71d74e6ff8e  sources/lean-outside/zuiddam/NOTICE
9f26ff1df49cdf7b96692c7cfef841b5e311bf4c5bf6938e7078aacfe0019816  sources/lean-outside/zuiddam/README.md
84246b85f17fc5b32f4194f44813921bc5b5f784120c3b259a69b54b10c56549  sources/openai-math/complex-2.258/README.md
97ffc7fc55cae485ec1f001a66c4ece8a293215b1ecfc8f9ec50ef4913c8e9f0  sources/openai-math/complex-2.258/paper.pdf
06a50b3ce05458fb4d83eb10b52483165b3928cd0ff04c400fc5976ccfffd2c8  sources/openai-math/euclidean-spectrum/README.md
7982a57ecaab76e22ab14d62e1145f30e98672ae690101ff96f78bb2a311a72d  sources/openai-math/lean/MatrixFields.json
fe4f7ef409f69f7ef9542c6672e091c9cb6505e0d17c41cda01a2924c2729bc6  sources/openai-math/lean/MatrixFields.lean
95a2e1557bef8931bdaa3da5c0ae969e5991f53199798b512d69e907f8a81288  sources/openai-math/lean/MatrixMultiplication.at-adc7f124.json
9a411f75929179604218e1cf84de34792e05acf40b15096ad4178ba21defa8eb  sources/openai-math/lean/MatrixMultiplication.at-adc7f124.lean
7c7263cfecc5a16d20165952ac3010598c3770b441d7d8fe2c5ceb8eda1c3347  sources/openai-math/lean/docs-107.at-adc7f124.md
31d88810902fccb13f04d0e60e992cc5e2726d36379d4c4806391b96156ec01d  sources/openai-math/lean/docs-107.md
46db2c1905f4687a732cba2eb11f50777fb5b64aefc99b9f5a3b4824cb7e1a8c  sources/openai-math/lean/docs-379.md
b56e17872e392e8985abaf669102ba2805719e682ee732a490d81b65ea01bc69  sources/openai-math/lean/formalization.yaml
c83864717e5f42acbbef76c7a17a4a8a9ead8df9d07f7701e4a70eb97e127834  sources/openai-math/nine-fourths-nov24/README.md
51a367f7daa6a3626ca35b0cd79c42cbd9ef04a1595eff0b7a8949cf40f0c9a3  sources/openai-math/nine-fourths-nov24/assembly.tex
345a8495660aa4bb07f9432235df2473bb3c3cf8fb64bdeda22aca538d5fbea8  sources/openai-math/nine-fourths-nov24/background.tex
04391783652b9e52ebfab77bbc9ef54d8bc04f0774f5252ea6a1a992290445c6  sources/openai-math/nine-fourths-nov24/boundary.tex
7132e6aa93b7c4b53b314aa2cd862d6a5fa35f7251593e1a97df22712cf4115c  sources/openai-math/nine-fourths-nov24/consequences.tex
213f551dc14438155aa634cb6dae8b9066475c06da587c4f5ad8720f60415871  sources/openai-math/nine-fourths-nov24/contact.tex
52631ce508b4acf8f982473766a396d4952f90a90deb97a9daec3684ad09a88a  sources/openai-math/nine-fourths-nov24/core-width.tex
dad721791b3022095106c00aa51ef315bd6434b4bdd8dbbdde67c51dacb831d1  sources/openai-math/nine-fourths-nov24/fermions.tex
ec39f49ad605f21e06789bc99e2de331818c7670ca3bfea40401b33682320939  sources/openai-math/nine-fourths-nov24/history.tex
bb2aae6f36762210622908d5581444d14c57eb7dace24dc73830f0455edb0f19  sources/openai-math/nine-fourths-nov24/incidence.tex
e65c9d0db16a716794515a549fe132afac849e9c87154dd083af6c808ec09b0f  sources/openai-math/nine-fourths-nov24/intro.tex
4a3601cf8fd4519ec984538a6f7f6eedeab9338fcf3226e6bd56c73481c12120  sources/openai-math/nine-fourths-nov24/list.tex
80c2d54c1c1dae7e2aacf75502155315c05b39836b040411811ef53759641c56  sources/openai-math/nine-fourths-nov24/local-motion.tex
4835930317e4f8b82c324ec9a3f4437c67c8f28e7e975c7a38eab3b62d14a309  sources/openai-math/nine-fourths-nov24/local-plant.tex
a9e3964f3d35bb4cc87c474e7a260a7d35fe25386cc8deef9f12befffab3e2b3  sources/openai-math/nine-fourths-nov24/local.tex
7ac0c8286b3f4c55f1f629913efb831e50406cdfa69aef5ed6bb2b9e3fa5a31d  sources/openai-math/nine-fourths-nov24/locators.tex
a43a6ad5a3281922c6c72cf6edf598a5a55598f278e56b35e1c5b6c83328aeba  sources/openai-math/nine-fourths-nov24/lookup.tex
097200c7b15a7a2a3ea1537d72c125f12678e8620481625bdbc310f9a94d2ed8  sources/openai-math/nine-fourths-nov24/main.tex
c8d877a5ff426d5ead2e6494a1db856d721e4aa6198998c51752ec6c3fcb867c  sources/openai-math/nine-fourths-nov24/motion.tex
278bc0cd9fb9697056bcbd3cbefede89d07d965af83cb72a160ffb25f1521dfa  sources/openai-math/nine-fourths-nov24/obstruction.tex
ddde9ab7755596c6f0210c148985f9761f2c291582e4d0a045987ad1766e5a01  sources/openai-math/nine-fourths-nov24/paper.pdf
1b9ddc45e8b7db3b554c61e89d4996ab72ece2f75c6ad4e1c0b836f86acbb862  sources/openai-math/nine-fourths-nov24/prices.tex
bb636e2516b416dcceb286be6e976b21925171de3a856a4c5c5e12d270f2a380  sources/openai-math/nine-fourths-nov24/references.bib
d6f02c15a97a248247a414ec5117b6049a2bbb3aa3191099fa8a60c8ff0bd854  sources/openai-math/nine-fourths-nov24/round-iteration.tex
b90fd6b657f086b0d59efdaa22f32d7be4831c9f292a6df12986536e37a2e586  sources/openai-math/nine-fourths-nov24/rounds.tex
7ea6936f1cef0759a6b3f200049d6308371c15baeb7e1b870a4df8befa528365  sources/openai-math/nine-fourths-nov24/shaving.tex
598f099f1b8d3d049781f249e9b2d71de0c16371ad47707af14cba5c56522423  sources/openai-math/nine-fourths-nov24/sorting.tex
4f8912577fd5ea50d4707b1ee059376724ce788d830056d9e07f98b794bc0f2b  sources/openai-math/nine-fourths-nov24/sphere.tex
1ad4e3d0be281a747223a135cfe07fc089732c822c16c917745b4fb8ccf32beb  sources/openai-math/nine-fourths-nov24/style.tex
bb474dbf44e4e2e38c85e8acd5c466fb9fdab33dc019172d9863c548bdbe7d41  sources/openai-math/nine-fourths-nov24/sync.tex
a146e4bd2bb517e65997db6d37b105fdd5d03961f1de25afe977b9bf4eff776a  sources/openai-math/nine-fourths-nov24/valued.tex
1857fc06d04a43588207ba2f726679c50a418299a5fd0313423a354680a783a7  sources/openai-math/nine-fourths-oct2/README.md
9c430672ddf2a1d0d2335c55c03b0b1fdea72f5a000c586bf130c2e984f19ae6  sources/openai-math/nine-fourths-oct2/paper.pdf
b8bfe031885cc8ddda69d4788bc49c22836dbaeb880890c2d90162a416ca4c70  sources/openai-math/overview.tex
8138ec883831ae251fa9b562584698467441b07fa1bb8d08e940326b4f86a746  sources/openai-math/staggered/README.md
85aa655473a156ad16db5bc59190d487a55db864d1014af0610c9c1f5b08490b  sources/openai-math/staggered/paper.pdf
6b02ee2fb7a93f4f9250d1f03717375812682e2a9953777d4e44349057e5cf35  sources/web/aaronson-front.html
5d9582cd4cf8c4e728bbfcba546e7255e1c5ec7385828dca39474b3f87a1cc5a  sources/web/aaronson-p10169.html
e8c9b4fe989b4afa6a9585e3c2896852eed6e346c112c29c18fd771f7a36f28b  sources/web/aaronson-p10362.html
e4c93baa8bfa5e94444b54d88d805f9fd3fd280051e748351b2845ddc97eb1c2  sources/web/ccblog-front.html
32ba138703d4e5de17d81062146ff89bc426861fd195b90d9e8b97f65275de68  sources/web/ccblog-vp-vnp.html
da5ccc70db16db556f7ffe6764db1d2787bc385868f42737ba6258d5adc91ca9  sources/web/cryptobriefing-9-4.html
96044b9535d4a56cca1b219a38df986159b089919b7ad2640ef7a2e30587790e  sources/web/kalai-2026-10-07.html
b1e66be47f1448e41e519eb91d6f3e40bbbc547710571dfdc8ac65c626c68d1d  sources/web/kalai-front.html
a7431971e4076e58f791299d97a7e042dfc7438e06347a38ef1dffd4c69a8cf1  sources/web/kingy-tracker-9-4.html
413c2ea36233ba4193ad8b75eb5a00937643001f88beee01db27c6fb8e39cd03  sources/web/mathworld-MatrixMultiplicationExponent.html
2074a1c0963da0de9181696553e14135f5625a9aeeacc865223f8e256b34a330  sources/web/officechai-9-4-exact.html
35a7d48917be914f3ab3c0ed27f4e043648afdb9184f8b6e8c9367f84be9ddb6  sources/web/sciam-heap-of-proofs.html
f0ceacb11981702a4958aa6ffc4e7cb4a09c46e0ee4553ba42d62b3dcda1faf9  sources/web/vibemathed-matrix-multiplication-exponent-9-4.html
d030950c425fded1f14c08b23ad94aae0cd7a5b8d2533bfb9d19f9f16d2de986  sources/web/wp-article.json
2e400704a9355c6b597e2becb90ca4560265e3d6afac8bc22dec1a20a9411f86  sources/web/wp-history.json
589bd55b1533128b8b31e394f8adf69f41ca2f0829a12b510641a79ee749ba14  sources/web/wp-talk.json
```
