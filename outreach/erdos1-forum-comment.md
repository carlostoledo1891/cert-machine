# Erdős #1 — the comment for erdosproblems.com/1 (paste by hand)

THE SITE'S FORMAT (read off its preview renderer, 2026-09-16): plain text; newlines become line
breaks; MathJax for $…$ and $$…$$; links ONLY as <a href="URL">text</a> (an anchor with nothing but
an href); {PROBLEM=n} links a problem. NO MARKDOWN: **bold** and [text](url) and `code` and "- "
bullets all print literally (the #852 comment still shows its ** and its code fence as ''' to this
day). The text below is in that format — check the preview shows the three links as links.

A COMMENT, NOT A PROOF CLAIM. The site keeps two channels per problem: the discussion thread
(https://www.erdosproblems.com/forum/thread/1, "add a comment") and the proof-claims register
(/forum/thread/1/proof-claims, fed by /forum/thread/1/submit-proof, "partial or full" claims of
solving the problem — problem 1 has two, both GPT-6 Astra's). Nothing here claims to solve or
partially solve the problem, which is already disproved; it adds explicit objects and their
certificates to a resolved problem. So it goes in the discussion thread as a comment, and never
through the submit-proof form.

Status: DRAFT, NOT SENT. Operator-gated like every send. Route ruled 2026-09-15: push cert-machine
first (one repository, no separate one — the links below resolve only after the push), then this
comment. No email to Bloom.

BEFORE SENDING, two gates, both mechanical — BOTH MET 2026-09-16 01:50 (main pushed at 01:49, the page live
ten seconds later with all six links resolving; the forum thread re-fetched and byte-identical to the pinned
copy except the access date; tadamcz/erdos1 HEAD still 0e395153 with every cited lemma name present):
1. `node tools/run-erdos1-ledger.js` must list `cert-b13-s3-a11_20.json.gz  verified k: [36]` — the
   79,092-element set quoted below is bench-verified and its re-verification on this machine takes
   about two hours; the comment quotes nothing this machine has not verified.
2. Push main (the page and the repository links must resolve) and re-read the four comments on the problem
   page (`corpus/sources/erdos1/erdosproblems-1-forum-discuss_2026-09-15.html` is the 2026-09-15
   state: no explicit set posted; StijnC, 12 Sep 2025, asks for a construction with $N < 2^n/5$).
   If someone posted an explicit set since, "the first" must go.

---

An effective version of the disproof, with explicit sets. Bloom's exposition of the GPT-6 Astra proof says the argument is non-quantitative only where a lattice is approximated by a primitive one. That step can be made explicit: replace the Smith normal form in the Lean proof by a Hermite basis with a bidiagonal chain perturbation (which makes the perturbed lattice saturated by construction) and compute the one quantity the proof never computed, the buffer $K$ that controls the perturbation, as an operator norm; for the original gadget it comes out between $d$ and $2.4d$ in every lattice computed (a tilt with denominator $q$ pays a factor through $D = q^s$). This gives explicit sum-distinct sets below Bohman's constant, each with a certificate that an independent program re-checks in exact arithmetic:

• $n = 1{,}701$, $N/2^n = 0.217967$ (dimension $81$);
• $n = 4{,}732$, $N/2^n = 0.193433$ (dimension $169$);
• $n = 12{,}348$, $N/2^n = 0.172386$ (dimension $441$);
• $n = 79{,}092$, $N/2^n = 0.145269$ (dimension $2197$), i.e. $f(n) \le 0.290537$ against Bohman's $0.44004$.

This also answers StijnC's comment above: constructions with $N < 2^n/5$ exist explicitly. Two further points. The base gadget $T = I + \tfrac12 P$ is not special: for $T = I + \alpha P$ the cube property holds for every $0 < \alpha < 1$ by a three-line argument, and the strip property is decided exactly for each $(\alpha, b)$ by a finite search that a structure lemma makes small; the $81$-dimensional set above uses $\alpha = 3/5$, where the original gadget first crosses Bohman at dimension $729$, and in a scan over tilts and dimensions a tilt other than $\tfrac12$ gave the smaller constant at every budget tried. And, as anticipated in the exposition, the lattices give explicit lower bounds for the constant in Siegel's lemma: $C_{2197} \ge 3.44$ in the exposition's normalisation. Nothing here touches the effective rate $f(n) \le n^{-c/\log\log n}$: the missing ingredient is a proof that the buffer is polynomial in $d$, which is measured in every instance and not shown. The construction is Astra's as read by Bloom; what is added is the effective transfer, the tilt lemmas, the Siegel numbers and the sets.

Write-up: <a href="https://carlostoledo.co/paper/erdos1-explicit.pdf">PDF</a>. Certificates, the verifier and every number's provenance: <a href="https://carlostoledo.co/reports/erdos1.html">the page</a> and <a href="https://github.com/carlostoledo1891/cert-machine">the repository</a> (certs/erdos1/ and instruments/erdos1/).

Disclosure per rule 1: this was produced with substantial AI assistance — the effective step, the code, the certificates and the text of this comment were produced by me working with Claude (Anthropic). Every claim above is decided by an independent verifier in exact arithmetic (no floating point enters a certificate), and I have read and checked the mathematics myself before posting. Not peer reviewed; refutations are welcome and I will publish any that land.

---
## Reviewed against the forum rules (2026-09-16; the rules are pinned at corpus/sources/erdos1/erdosproblems-forum-rules_2026-09-16.txt)

1. **AI assistance must be disclosed; contents independently verified by a human before posting.** The earlier
   draft had NO disclosure line — non-compliant as it stood. The last paragraph now carries it, in the wording
   the #852 and #1038 comments used. The sentence "I have read and checked the mathematics myself" must be
   TRUE when you post: read paper/erdos1-explicit.md §3 (Lemmas 2–4, half a page) and §2b (the two tilt lemmas,
   half a page) — that is the whole of the new mathematics — and the verifier's docstring (V0–V7).
2. **Do not post mathematics you do not understand yourself.** Same reading. You should be able to say in your
   own words why the chain minor is unimodular (upper-triangular H, so deleting row 0 of top(tH) − sh leaves
   diagonal −1) and why Dt − K ≥ 2^k forces every small relation to zero.
3. **Long proofs go in a linked PDF, not the comment.** The comment is a summary; the PDF is now linked first.
4. **AI-solved problem → read the advice page; post only once understood and verified, or with a Lean proof.**
   Not an AI-solved open problem (the disproof is Astra's, Lean-verified; this is its effective version), but
   the advice page's questions are met: key ideas understood and written down; literature reviewed (Bloom's
   exposition, the Lean resolution, Bohman 1998, Aliev 2008, Dubroff–Fox–Xu; the thread re-read on
   2026-09-16, no explicit set posted); the method compared honestly ("the construction is Astra's as read by
   Bloom; what is added is …"). No Lean certificate — stated on the page, not claimed here.
5. **The harder the problem, the higher the bar; no waved-away difficulties.** No proof of an open problem is
   claimed. The one theorem-shaped sentence was tightened: "beats 1/2 at every dimension budget" came from a
   float scan and now says so ("in a scan … at every budget tried"); "about 2d" became the measured range.

Also changed: the body is in the site's own format (no Markdown — see the top); $f(n) \le 0.290538$ was 2 × the rounded ratio; the ledger's rounded $f$ is 0.290537. No
priority language ("the first") in the body — the September blog thread ("Tell me what should change",
2026-09-12, 28 comments) is explicit that priority earned by AI-heavy work counts for little; the value
claimed is the objects and the certificates. The site owner wrote he would be away the week after 12 Sep,
so moderation may take days; the advice page also says not to announce on social media before the community
has looked — so Mathstodon waits until this comment has been shown and read.
