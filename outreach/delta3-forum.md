# δ₃ = 117/2192: the erdosproblems.com/1186 texts (paste by hand) and the teorth/erdosproblems note

STATUS: DRAFT, NOT SENT (2026-10-05). Every item here is a SEND on the operator's per-item word.
- **Already met:** the author's line-by-line reading (operator, 2026-10-05), and the Zenodo deposit: v2026.10, doi:10.5281/zenodo.23171167, verified public 2026-10-05 and filled in below.
- **Before pasting:** check that the three links resolve (the site deploys from main).

THE SITE'S FORMAT (read off its preview renderer for the Erdős #1 comment, outreach/erdos1-forum-comment.md):
- Plain text; newlines become line breaks.
- MathJax for $…$ and $$…$$.
- Links ONLY as <a href="URL">text</a>.
- No markdown: **bold**, [text](url), `code` and "- " bullets all print literally.

THE CHANNEL. Problem #1186 asks for δ_k for every k, and this settles k = 3 only.
- **A. Proof claim:** a PARTIAL solution goes through the problem's proof-claims form (/forum/thread/1186/submit-proof, "partial or full"), marked partial.
- **B. Discussion comment (optional):** a short pointer in the discussion thread, if the operator wants the thread to see it before moderation of A.
- Never claim "solves #1186".

---

## A. The proof claim (partial), field by field — /forum/thread/1186/submit-proof (signed in as carlos_toledo)

The fields are read off the site's rendered proof claims (2026-10-05): "A {full|partial} proof claimed by {who} (using {AI})",
then Summary, Notes, an external link to the proof, and an external link to a formalisation. The submit form itself sits
behind the login, so check the field names there. Sizes follow the claims already on the site: a summary of 250–600
characters, notes of about 450. An earlier version of A, a long comment-style text, was too large and is replaced.

**Proof type** (7 chars)

```
Partial
```

**Claimed by** (13 chars)

```
Carlos Toledo
```

**Using (AI)** (18 chars)

```
Claude (Anthropic)
```

**Summary** (560 chars)

```
The case $k=3$: $\delta_3=117/2192$, so the twelve-block colouring of Parrilo, Robertson and Saracino (2008) is optimal, as they conjectured. By their counting lemma it suffices that $\iint_{a/2\le b\le(1+a)/2}\varphi(a)\varphi(b)\ge-5/137$ for every measurable $\varphi:[0,1]\to[-1,1]$. Expanding around the twelve blocks, the first-order term is an explicit $h\ge0$ vanishing exactly at the block edges; a discretisation built on $h$ loses nothing to first order, and five regions are closed by exact rational certificates. The case $k\ge4$ is not addressed.
```

**Notes** (445 chars)

```
Produced with substantial AI assistance (Claude); I have read and checked the mathematics myself, line by line. The certificates are verified in exact rational arithmetic by two independent programs that share no code, and planted forgeries are rejected; they re-run in seconds. Not peer reviewed, not formalised in Lean. Certificates, verifiers and records: https://carlostoledo.co/reports/delta3.html (archived at doi:10.5281/zenodo.23171167).
```

**External link to proof** (40 chars)

```
https://carlostoledo.co/paper/delta3.pdf
```

**External link to formalisation** (13 chars)

```
(leave empty)
```

Rules: rule 1 (disclose AI) — the "using" field and the first sentence of Notes; rules 2 and 4(a) (a human understood and
verified it) — Notes, true since the operator's reading on 2026-10-05; rule 3 (long proofs by link) — the PDF is the
external link and the summary is a summary; rule 5 (no key difficulty waved away) — the summary names the two places the
weight sits (the expansion and the certificates), and the PDF carries the lemmas with proofs and the certificates' records.
---

## B. Optional discussion comment — /forum/thread/1186

A note on the case $k=3$: the twelve-block colouring of Parrilo, Robertson and Saracino is optimal, so $\delta_3 = 117/2192$ (their conjectured value; Graham's 1999 question). The proof is a two-page expansion around the twelve blocks plus five exact certificates, checked by two independent verifiers. It is submitted as a partial proof claim. Write-up: <a href="https://carlostoledo.co/paper/delta3.pdf">PDF</a>. AI-assisted (disclosed in the claim); read and checked by me; not peer reviewed.

---

## C. teorth/erdosproblems — RECOMMENDATION: no status PR

The repository's CONTRIBUTING routes status edits through a PR to data/problems.yaml together with a comment on the problem page. #1186 asks about δ_k for every k, so the k = 3 result leaves it OPEN, and a PR changing its status would be wrong.

The honest moves are:
1. Nothing, letting the maintainers read the proof claim on the site.
2. If the operator wants the maintainers to see it, an ISSUE (not a PR), only after the proof claim is visible on the site:

> **Title:** #1186: the case k = 3 (δ₃ = 117/2192) — a partial result, for the maintainers' information
>
> **Body:** A partial proof claim for #1186 is on the site: δ₃ = 117/2192, the Parrilo–Robertson–Saracino conjecture (the twelve-block colouring is optimal). The general question stays open, so this proposes no status change. Write-up and certificates: https://carlostoledo.co/reports/delta3.html (archived at doi:10.5281/zenodo.23171167). AI-assisted and disclosed; read and checked by the author; not peer reviewed; not formalised.

---

## Reviewed against the forum rules (pinned: corpus/sources/erdos1/erdosproblems-forum-rules_2026-09-16.txt)

1. **Disclose AI assistance; contents verified by a human before posting.** The disclosure paragraph is in A. The reading was done by the operator on 2026-10-05 (§§2–4 of the paper: the reduction, the expansion, the bathtub and discretisation lemmas).
2. **Do not post mathematics you do not understand.** Same reading. Be ready to answer: why $h\ge0$ matters, why the discretisation is exact to first order, and what the certificates certify.
3. **Long proofs by link, not in full.** A is a summary with a link to the PDF.
4. **AI-solved problems: post only after (a) understanding and verifying the mathematics yourself, or (b) a sorry-free Lean proof.** (a) is met; (b) is not claimed.
5. **The harder the problem, the higher the bar; no key difficulty waved away.** The difficulty sits in the five certificates and the two lemmas. Both are explicit: the PDF has the lemmas with proofs, and the certificates are public and re-run in seconds.

---

## D. Optional, separate: a k = 4 comment on /forum/thread/1186 (from the δ₄ scout, notes/delta4-centring-2026-10-05.md)

The problem page lists no bound for $\delta_4$ on $[n]$. Lu and Peng's colouring (arXiv:1107.2888) unrolls the quadratic residues mod $11$ and gives $\delta_4 \le 1/72 \approx 0.01389$. That is 19% below the best block colouring, Butler–Costello–Graham's 36 blocks at $0.01722$. Both values were re-checked in exact arithmetic. Unlike $k=3$, a quartic term enters the counting, and it blocks the kind of reduction that settles $\delta_3$. AI-assisted (Claude); checked by me.

STATUS: DRAFT, NOT SENT. Small, and correct as far as it goes. Post it only if A has landed and the thread is still quiet on k = 4.
