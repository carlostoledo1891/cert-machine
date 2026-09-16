# Erdős #1 — the comment for erdosproblems.com/1 (paste by hand; the site renders $…$ LaTeX)

Status: DRAFT, NOT SENT. Operator-gated like every send. Route ruled 2026-09-15: push cert-machine
first (one repository, no separate one — the links below resolve only after the push), then this
comment. No email to Bloom.

BEFORE SENDING, two gates, both mechanical:
1. `node tools/run-erdos1-ledger.js` must list `cert-b13-s3-a11_20.json.gz  verified k: [36]` — the
   79,092-element set quoted below is bench-verified and its re-verification on this machine takes
   about two hours; the comment quotes nothing this machine has not verified.
2. Push main (the page and the repository links must resolve) and re-read the four comments on the problem
   page (`corpus/sources/erdos1/erdosproblems-1-forum-discuss_2026-09-15.html` is the 2026-09-15
   state: no explicit set posted; StijnC, 12 Sep 2025, asks for a construction with $N < 2^n/5$).
   If someone posted an explicit set since, "the first" must go.

---

**An effective version of the disproof, with explicit sets.** Bloom's exposition says the argument is non-quantitative only where a lattice is approximated by a primitive one. That step can be made explicit: replace the Smith normal form in the Lean proof by a Hermite basis with a bidiagonal chain perturbation (which makes the perturbed lattice saturated by construction) and compute the one quantity the proof never computed, the buffer $K$ that controls the perturbation, as an operator norm; it is about $2d$ for the original gadget. This gives explicit sum-distinct sets below Bohman's constant, each with a certificate that an independent program re-checks in exact arithmetic:

- $n = 1{,}701$, $N/2^n = 0.217967$ (dimension $81$);
- $n = 4{,}732$, $N/2^n = 0.193433$ (dimension $169$);
- $n = 12{,}348$, $N/2^n = 0.172386$ (dimension $441$);
- $n = 79{,}092$, $N/2^n = 0.145269$ (dimension $2197$), i.e. $f(n) \le 0.290538$ against Bohman's $0.44004$.

This also answers StijnC's comment above: constructions with $N < 2^n/5$ exist explicitly. Two further points. The base gadget $T = I + \tfrac12 P$ is not special: $T = I + \alpha P$ works for every $0 < \alpha < 1$ (the cube property has a three-line proof for all tilts; the strip property is decided exactly by a finite search that a structure lemma makes small), and the best tilt beats $\tfrac12$ at every dimension budget — the $81$-dimensional set above uses $\alpha = 3/5$, where the original gadget first crosses Bohman at dimension $729$. And, as anticipated in the exposition, the lattices give explicit lower bounds for the constant in Siegel's lemma: $C_{2197} \ge 3.44$ in the exposition's normalisation. Paper, certificates, the independent verifier and every number's provenance: https://carlostoledo.co/reports/erdos1.html (repository: https://github.com/carlostoledo1891/cert-machine, `certs/erdos1/` and `instruments/erdos1/`). The effective rate $f(n) \le n^{-c/\log\log n}$ is not proved here; the missing ingredient is a proof of the buffer law, which is measured (linear in $d$ in every instance computed) but not yet shown.

---

Provenance of every number above: `certs/erdos1-ledger.json` (the verified-instance rule lives in
`tools/run-erdos1-ledger.js`). The $C_{2197}$ value is the bench's; it enters the ledger with the
2197-dimensional certificate.
