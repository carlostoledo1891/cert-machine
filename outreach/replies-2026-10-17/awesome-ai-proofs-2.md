# Reply on subroy13/awesome-ai-proofs issue #2 (drafted 2026-10-17; the send is the operator's)

Written for: subroy13, the maintainer of awesome-ai-proofs, who added our two audit records on 2026-10-17 (commit
852a8fac) and closed issue #2 with "Thanks for submitting the audit records."

What they changed from the submission, read from the commit: the matmul audit event is as submitted (plus a date and a
link back to the issue). On the Ramsey entry two words were softened: the audit event's `reported_evidence` went from
`debunked` to `disputed`, and the caveat's "what is refuted is that certificate" became "what is contested". Their
registry, their vocabulary; the note below says what our record says and leaves the word to them.

STATUS: NOT SENT.

---

Thank you for adding both, and for the care in the summaries.

One note for your source review, so the words line up with the record: our decision on the HorizonMath certificate is
REFUTED, not contested — the pair the certificate uses at λ = 1 lies outside the region Theorem 14 requires, by an
explicit bound (Erdős's 1947 colouring at e = 13/2000, p = 11981/500000 exceeds the pair's rate by 0.00130), and the
validator accepts it only because line 299 takes `min` where membership needs both inequalities; with `max` it rejects
the certificate on its first interval. The inequality R(k,k) ≤ 3.6961^(k+o(k)) itself is not decided either way by
this, as the caveat says. "Disputed" is a fair word while the authors have not replied (HorizonMath issue #10 is still
open and unanswered as of today); if your review reproduces the witness, "debunked" is the word our record supports.
Happy to help with the review in any way that is useful.
