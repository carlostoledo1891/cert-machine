# SUN.md: provenance scout for arXiv:2610.13971 (the conflicting upper bound)

Scouted 2026-11-25, 03:26:40 to 03:35:47 UTC (`date -u` at the start and the end). Nothing was committed, posted or sent.
Every downloaded file was handled as untrusted data. Nothing in it was executed, and the TeX was read, never compiled.

- READ: I opened the source and the words quoted are its words.
- INFERRED: my reading, my arithmetic, or the absence of a result after a search.

The claim being scouted is OpenAI's sentence (openai/math @ 92b516ef, `nine-fourths-nov24/consequences.tex` l. 44-47). READ:
"At finite sizes, Corollary~\ref{cor:tight} also conflicts with the dyadic border-rank estimate proposed in the first version of
Sun's preprint~\cite{Sun}. At $n=2^8$ the proposed upper bound is $2^{17}$ and our lower bound is $2^{18}$."
Its bib entry points at `https://arxiv.org/abs/2610.13971v1`. Corollary 1.2 (`intro.tex` l. 56-62), READ: "For every \(n\ge2\) and
every field \(F\), the geometric border rank of \(T_n\) is at least \(n^{9/4}\)".

---

## 1. Versions: only v1 exists. Nothing has been withdrawn, weakened or corrected.

- **arXiv listing**, https://arxiv.org/abs/2610.13971, fetched 03:27:19 UTC. READ: "Submission history From: Zhi-Wei Sun …
  [v1] Mon, 14 Sep 2026 17:50:53 UTC (56 KB)". No v2 is listed.
  - The page is filed under math.GM and its comment is "67 pages". MSC 15A69, 14N07, 15A03, 68Q25.
  - Its sha256 is byte-identical to the copy fetched about 3.5 h earlier (`sources/arxiv/abs-2610.13971.html`).
- **https://arxiv.org/abs/2610.13971v2**. READ: HTTP 404 at 03:27:40 UTC.
- **arXiv API** (`export.arxiv.org/api/query?id_list=2610.13971`). READ: one entry, `2610.13971v1`, with published = updated =
  `2026-09-14T17:50:53Z`.
  - A search of the API for the same author on matrix, tensor or omega returns this paper and four older number-theory papers.
  - There is no follow-up or replacement paper.
- **alphaXiv**, https://www.alphaxiv.org/abs/2610.13971. READ: one version, "Submitted 14 Sep 2026". Its discussion section has no
  posts.
- **The 2610 identifier on a 14 Sep submission.** INFERRED: the paper was probably held in moderation and announced in mid-October.
  - The e-print gzip header reads "last modified: Wed Oct 14 00:00:25 2026", while the tar entries are dated Sep 14.
  - It was reclassified to, or filed in, math.GM.
- **The author's homepage**, http://maths.nju.edu.cn/~zwsun/. READ: "Last modified: August 4, 2026". It predates the preprint and does
  not mention it.
- **OpenAI's wording.** INFERRED: "first version" names v1 precisely. It does not mean a later version exists, because none does as of
  03:35 UTC on 25 Nov.

### What v1 claims (READ: abstract and TeX source `P102Final.tex`, Theorems 1.1-1.4 and Corollary 1.5)

The abstract, READ: "mainly prove for any integer $n\ge5$ the uniform dyadic estimate
\underline{R}_K(M_{2^n}) \le 2^{2n+1} which implies that $\omega(K)\le 2+1/n$ … This improves the current best record
$\omega(K)<2.371177$ greatly, and answers affirmatively the long-standing open question whether the value $\omega(K)$ is exactly
$2$."

Theorem 1.4 (l. 427-436), READ: "Let $\K$ be any field. For every integer $n\ge5$ … $\BR_{\K}(\MM_{2^n})\le2^{2n+1}$ … Consequently,
$\omega(\K)=2$."

In the table below:
- Sun's notation is M_N = T_N, and his exponent n is k here.
- LM = 2N² − log₂N − 1 (Landsberg–Michałek, https://arxiv.org/abs/1608.07486, the title as returned by search). That this is the best
  known general lower bound is INFERRED from memory.

| Sun's statement (field) | Claimed border rank | N^{9/4} (OpenAI's Cor. 1.2) | LM lower bound | Conflict? |
|---|---|---|---|---|
| Thm 1.3(a): M_32 ⊴ D_16 ⊠ (14CW_3 ⊕ 6CW_2 ⊕ 7W ⊕ 5D_4), char ≠ 2 | **2048** = 2^11 | 2435.50 | 2042 | yes |
| Cor 1.5 (2064 source), char ≠ 2 | 2064 | 2435.50 | 2042 | yes |
| Thm 1.3(b): M_32 ⊴ D_16 ⊠ (19CW_3 ⊕ 6CW_2 ⊕ 7W), char ≠ 2 | 2128 | 2435.50 | 2042 | yes |
| Cor 1.5: M_32 ⊴ D_16 ⊠ (22CW_3 ⊕ 10CW_2), char ≠ 2 | 2400 (16·150, INFERRED arithmetic; the paper prints no number) | 2435.50 | 2042 | yes |
| Thm 1.2: M_64 ⊴ D_32 ⊠ D_2 ⊠ S*, char ≠ 2 | 2^13 = 8192 | 11585.2 | 8185 | yes |
| Thm 1.2: M_256 ⊴ D_128 ⊠ D_8 ⊠ S*, char ≠ 2 | **2^17** = 131072 | 2^18 = 262144 | 131063 | yes, the pair OpenAI cites |
| Thm 1.1: M_1024 ⊴ D_512 ⊠ D_32 ⊠ S*, char ≠ 2 | 2^21 | 2^22.5 ≈ 5.93·10^6 | 2097141 | yes |
| Thm 1.4: M_{2^k}, k ≥ 5, every field | 2^{2k+1} | 2^{9k/4} | 2^{2k+1} − k − 1 | yes for every k ≥ 5 |

S* = 14CW_3 ⊕ 4CW_2 ⊕ 7W ⊕ 5D_4 ⊕ D_8, whose border-rank cost is 128.

Notes on the table, all INFERRED (arithmetic):
- 2^{2k+1} < 2^{9k/4} exactly when k > 4, and Sun's own theorem starts at k = 5.
- **The conflict therefore begins at N = 32, not at 2^8.** Every one of Sun's four M_32 numbers lies below 32^{9/4}, even the weakest
  (2400). Sun calls 2048 "the primary corrected construction" (Remark 1.3, READ).
- At k = 4 the two bounds meet at 512 = 16^{9/4}. Sun's Remark 1.4 says the bound "also holds for n≤4" but proves nothing there. That
  is not a conflict, because ≤ 512 and ≥ 512 can both hold.
- **Sun's bounds sit k + 1 above the Landsberg–Michałek lower bound** (2048 against 2042 at N = 32). The paper therefore claims that
  border rank is near-minimal at every dyadic size. This is extraordinary on its own terms, independently of OpenAI.
- **Only border rank conflicts. Rank does not, at these sizes.** Sun's exact algorithm for M_1024 uses 133·2^21 = 278,921,216
  products (READ, §11 and App. A.12). OpenAI's exact bilinear lower bound at N = 1024 is ⌈1024^{9/4}⌉ = 5,931,642, so there is no
  clash.
- **Either way, the outcome is decisive.**
  - Sun claims every field with char ≠ 2, and OpenAI claims every field.
  - So one valid degeneration over one odd-characteristic field, for example F_p, would refute OpenAI's Corollary 1.2.
  - One field of char ≠ 2 where Sun's identity fails would refute Sun's Theorem 1.3 as stated.

---

## 2. Is it explicit and checkable?

**Explicit in claim, but not machine-readable. No code, data or ancillary file is published.**

- **No ancillary files.** READ: the abstract page has no "Ancillary files" block, and grep finds no `anc/` link. The e-print
  (`https://arxiv.org/e-print/2610.13971v1`, 57,422 B gzip) unpacks to two files only:
  - `00README.json` (218 B, pdflatex, TeX Live 2025);
  - `P102Final.tex` (180,297 B, 4,777 lines).
- **No URL in the TeX points to code, a repository, Zenodo or data.** READ, by grep for http, github, zenodo, python, sage, magma and
  code. The only links are bibliography DOIs.
- **SHA-256 fingerprints without the files.** READ, App. B.1, l. 4162-4171: "For reproducibility, the fixed-row records and the sorted
  physical-cycle set have SHA-256 fingerprints f7e57ddd…76df and d8ff8464…9083". INFERRED: the records they fingerprint are not
  published anywhere I found.
- **AI authorship of the data.** READ, the acknowledgement (l. 4680-4681): "This research was done with the aid of AI under the
  author's guidance. In particular, all the tables and numerical data were produced by AI."
- **What the abstract promises.** READ: "The implementation disclosure and appendices in this paper give fixed source maps,
  interpolation data, terminal incidence ledgers, and deterministic check counts for independent reconstruction." §11.4 adds: "An
  independent implementation needs no parameter search."

### The form of the claim (READ, Def. 2.2 and §§2-8)

- **The degeneration.** S ⊴ T means that there are maps A(t), B(t), C(t) with Laurent entries such that
  (A⊗B⊗C)T = t^d S + O(t^{d+1}).
- **The sources.** They are the standard Coppersmith–Winograd realizations:
  - CW_q has border rank q + 2 (Lemma 2.6 prints Φ_q(s), with q + 2 products).
  - CW_2 has 4 products.
  - W = x0y0z∞ + x0y∞z0 + x∞y0z0 has 2 products.
  - D_r has r products.
- **The maps.** They are built from Walsh characters on H_k = F_2^k, Weyl matrices, packet, module and chart tables, and endpoint
  ledgers. For M_32 the data sits in §§4-8 (TeX l. 1260-2095, roughly 13 pages) and App. B.2.
- **The M_32 globalization is argued by support and incidence counting, as a bijection.** READ, Thm 8.1's proof: "identify the sixteen
  translates with all 16·2048=32768=32^3 matrix-unit cycles".
- **The fields.**
  - M_32, M_64, M_256 and M_1024 are claimed for char ≠ 2. The Walsh entries are ±1 with 1/16 normalisations, and the CW_3
    realization has the coefficients 1/(q−2) and (q−1)²/(q−2).
  - The executable reference circuit is over **F_311**. For M_1024 it has t = u, s = u^19, degree 132, target [u^44] and 133
    evaluation points (READ, §11).
- **The author's own checks are counts, not the tensor identity.** READ, App. A.13, "Deterministic exact checks". The table lists
  items such as "literal module–chart coefficients 4096", "M_δM_ε=M_{δ+ε} 256", "fixed-row H_9 classes 2^21" and
  "physical cycles 1024^3".
  - INFERRED: no line claims that the composed identity (A⊗B⊗C)(source) = t^d M_N + O(t^{d+1}) was expanded and compared at every
    coordinate.

### What an exact check would have to verify (INFERRED)

**The cheapest decisive size is N = 32 (Thm 1.3(a), 2048, or Cor 1.5, 2400), not 2^8.**

1. **Reconstruct.** Rebuild A(t), B(t), C(t) from the printed tables and lemmas, literally, with no shared code.
   - The source is D_16 ⊠ S_2048, with 16·(14·5 + 6·4 + 7·2 + 5·4) = **2048** coordinates per factor and 16·263 = 4208 trilinear
     support monomials.
   - The target M_32 has 1024 coordinates per factor and 32^3 = 32,768 support triples.
   - Each map is therefore a 1024 × 2048 matrix of Laurent polynomials. The degree window for M_32 is not stated; for M_1024 the
     entries lie in [−2, 4].
   - Composing with the CW, W and D border realizations gives the alternative form: 2048 rank-one triples, polynomial in (t, s).
2. **Verify the identity.** In (K^1024)^{⊗3}, a space of **2^30 ≈ 1.07·10^9 coordinates**, every t-coefficient below d must vanish
   and the t^d coefficient must equal M_32.
   - Do it in exact arithmetic: over Z[1/2] (the denominators are powers of 2 and q − 2 = 1), or over a single odd prime field.
     Sun claims all fields with char ≠ 2, so F_311 or any odd F_p is a legitimate test field for both directions.
3. **Cost.**
   - Dense worst case: the flattening product (2^20 × 4208)·(4208 × 2^10) costs about 4.5·10^12 multiply-adds per pair of degrees.
     That is a few CPU-hours or under a pod-hour for a few dozen degree pairs.
   - Memory: it can be streamed over the 1024 z-slices (1024 × 1024 each).
   - Sparsity of the Walsh-coset maps would cut this a great deal.
4. **Cheap falsifier first.**
   - Contract both sides with random x, y, z over a large prime field, at random t (or as a polynomial in t). This costs about
     3·2048·1024 + 4208 ≈ 6·10^6 operations per point.
   - One mismatching point is an exact, replayable refutation of the reconstructed identity.
   - Passing points is only Schwartz–Zippel evidence, not a certificate. The full 2^30-coordinate expansion is the certificate.
5. **At N = 2^8 (OpenAI's example).**
   - The target has 2^48 coordinates, so a dense exact expansion is out of reach.
   - The random-point falsifier still costs only about 3·2^17·2^16 ≈ 2.6·10^10 operations per point.
   - Reconstructing it needs the whole M_1024 apparatus (§9 and App. A, TeX l. 2095-2615 and 3606-4141), because Thm 1.2 is a
     "direct finite restriction" of it.
6. **The real cost is reconstruction, not arithmetic.** About 13 pages of AI-produced tables have to become three exact matrices.
   - A failed reconstruction is NEEDS DATA, not REFUTED, unless every step follows the printed text and each discrepancy is logged
     against its line.
7. **No cheap spectral kill exists.** INFERRED, my computation, not a source. Strassen's upper support functional at θ = (⅓, ⅓, ⅓) is
   a necessary monotone under degeneration, and Sun's M_32 degeneration passes it:
   - ζ(CW_3) ≈ 4.3441, ζ(CW_2) ≈ 3.5717, ζ(W) = 3/2^{2/3} ≈ 1.8899;
   - 16·ζ(S_2048) ≈ 1847.6 ≥ ζ(M_32) = 1024;
   - the implied irreversibility barrier is about 2.027, which is below 2.2.
   - So the construction is not refuted by this standard invariant. OpenAI's lower bound, if it is true, needs something stronger.
     That fits SCOUT.md "WHAT THIS CHANGES FOR THE AUDIT", item 3, on rank-method barriers.

---

## 3. Public discussion of the conflict: none found (INFERRED)

I made 13 web searches in English and Chinese, covering:
- the arXiv id;
- the exact title;
- "omega = 2" with math.GM, MathOverflow, Zhihu and blogs;
- "Sun" with 9/4, 2^17 and 2^18;
- the author's name with 矩阵乘法.

I also made direct reads of alphaXiv (no comments) and Semantic Scholar. READ: `…/paper/arXiv:2610.13971/citations` returned
`{"offset": 0, "data": []}`, so there are no indexed citing papers.

None of them found:
- any blog post, MathOverflow thread, erratum, reply by the author, or comment by OpenAI beyond the one sentence in consequences.tex;
- any other paper citing 2610.13971.

OpenAI's sentence is the only public statement of the conflict that I found. The earlier SCOUT.md §3 reached the same result:
"No response to it was found."

---

## 4. Other published constructions below N^{9/4}: none found besides Sun's (INFERRED)

- **Recent arXiv scan.** An arXiv API scan covered the 120 most recent abstracts that match "matrix multiplication" with
  exponent, omega or border rank (`api-mm-recent.xml`). Its 2026 entries run from June to 24 Nov.
  - Every exponent claim there is ≥ 9/4 except Sun's. Examples: 2.371177 (2608.16884); 2.37115924 (2610.10593, Zadeh, with a
    Python-stdlib verifier); "ω ≤ 9/4" (2610.18914, 2610.28627, 2610.30054, 2611.04175, 2611.09716).
- **The constructive 9/4 proof is not below 9/4.** 2610.28627 (Pass et al., v2 30 Oct), READ in its abstract: "multiplies two n×n
  integer matrices using $O(n^{9/4+\gamma})$". That is above N^{9/4} for every finite N it yields.
- **The barrier paper.** 2610.30054 (Zuiddam et al.), READ: "the current degeneration ingredients cannot improve the bounds".
- **Solomonik–Bläser, 2610.26563**, READ: "border rank bound \underline R(⟨n²,n²,n²⟩^{⊕9}) ≤ (n+1)^6+6(n+1)^5". It concerns direct
  sums and is far above 9·N^{9/4}. They write "do not come close to improving the best known bounds on ω".
- **Small sizes cannot conflict.** INFERRED: for N ≤ 15 the Landsberg–Michałek bound already exceeds N^{9/4}, and every known small
  rank and border-rank bound is far above N^{9/4}. Examples: border rank 7 for M_2 against 4.76; border rank ≤ 20 for M_3 against
  11.8, from memory.
- **Bini's inequality.** INFERRED, a standard fact: ω ≤ log_N \underline R(M_N) for every N. So any construction below N^{9/4} at any N
  is the same thing as a claim that ω < 9/4.
  - The only such claim I found is Sun's ω = 2.
  - OpenAI's October bound ω ≤ 9/4 gives N^{9/4+o(1)} and does not conflict.

---

## 5. Files in `provenance/sun/` (sha256)

```
900c88e538f824bd062a7ada0b0e6998a8898104563b2e2f0a7a9c9ad522750b  abs-2610.13971.html          arXiv listing, 03:27 UTC (identical to sources/arxiv/ copy)
65ccfdf0a1b4f4fc23f973b1b2018b7a667e2a3a25335dae778718dcbe0907f0  abs-2610.13971v2.html        HTTP 404 body: no v2
4ab194c99416b59a21809d78a71d089695ee62de75981635b6cb95b6e2299e96  pdf-2610.13971v1.pdf         636,922 B, 67 pp, arXiv GenPDF
1726d523a0d5299fa5df9e7f5909891c9c7f6ef24a18f84ff485d7158812436b  eprint-2610.13971v1.bin      gzip tar of the TeX source
5b8ac88239f028700a99fe1dc8536c53a5a21a0a4ae85208068e25b559e64d10  eprint-v1/00README.json
267360310577c890173eb22a50abbe205aaf1bb2b8cb2bcebf1e824924682467  eprint-v1/P102Final.tex      180,297 B, 4,777 lines
436e80bd6f0db2b3e018b417ebea6530863d5d10637c658cdd98bf72bdfdab59  api-id-2610.13971.xml        arXiv API: one version
900dcdc4286357b3e254d13803f41b2dc626ea0543b432104513cf7baae39210  api-sun-search.xml           arXiv API: author × matrix/tensor/omega
f99acad756902e36de2c0e7d254924356da71ca94b3d5ff768a795ba2a1fbc27  api-mm-recent.xml            arXiv API: 120 recent MM-exponent abstracts
cd700c76afcd3c95befbbf7f72eef520579cbe089ff8fe4feefa066a9a8e24ef  nju-zwsun-home.html          author homepage, last modified 4 Aug 2026
b890c0f15f5c03ba84c2ef5ace10d4d63f07c6388916be8151f53ffbb7a0b479  s2-citations.json            Semantic Scholar: zero citing papers
```
