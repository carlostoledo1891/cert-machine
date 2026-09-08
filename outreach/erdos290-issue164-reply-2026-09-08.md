# Reply to Woett on teorth/erdosproblems#164 — DRAFT, operator-gated, NOT SENT

Context (2026-09-08 16:49 UTC): Woett (Wouter van Doorn) answered our three
comments: "Thanks for the effort! I only just saw your comments. Worth
mentioning is that, last week (incidentally on the exact same day when you
wrote that the third digit is now determined), I put out a preprint
(arXiv:2609.00104) that proves that the liminf is actually equal to 1/(1+c).
So the earlier constant of 1/(2c) is no longer relevant."

How it lands: our page already carries the theorem (reports/erdos290.html
§3b, since 2026-08-31/09-01) — the 1/(2c) reading is kept there as history.
Our third comment on the thread (2026-08-31 20:21) still presents the 1/(2c)
endpoint as live; his reply retires it. The numbers that matter are
unchanged and gain meaning: with Theorem 1 the unconditional bracket for
1/(1+c) IS a bracket for the liminf itself.

Every number below is read from certs/erdos290-*.json at the build of
2026-09-08; re-run the report before pasting. Post with
`gh issue comment 164 -R teorth/erdosproblems -F -` (body below the rule)
only on the operator's explicit yes.

---

Thank you — and congratulations on the theorem; I had seen the preprint the
day after it went up and the page already reads it as the result (the 1/(2c)
endpoint is kept there as history, marked superseded).

With Theorem 1 the bracket I posted becomes a bracket for the liminf itself,
with no assumption of any kind:

```
liminf (b(a)−a)/log a  =  1/(1+c)  ∈  [0.546083759260, 0.546323774021]
c                                   ∈  [0.830416407911, 0.831220912621]
```

So the constant is 0.546… to three digits, proved: your theorem for the
identity, the certified Galois-density enclosure (every even degree d ≤ 620
decided exactly, i.e. l ≤ 310; the tail bounded with δ ∈ [0, 1] and no
assumption) for the digits. Under the one stated assumption about the Galois
groups in the tail (it enters only at even d ≥ 622), the expansion continues

```
1/(1+c) = 0.546229310400104587412660585438363…
```

with the failure semantics I gave above (a first failure at degree d₀ moves
1/(1+c) by at most about 0.299/(d₀(d₀+1))).

Two things I can do with this, if you want them:

1. **OEIS.** The entry you asked for now has a name a reader would search for:
   "decimal expansion of liminf (b(a)−a)/log a", citing arXiv:2609.00104 for the
   identity and arXiv:2411.03073 for c. I have the two entries drafted (the
   liminf, and c itself as its cross-reference), with the unconditional
   three-digit statement as the fallback if an editor objects to a conditional
   expansion. I would rather submit them with your name on the definition, or
   have you submit them — your call.

2. **A fourth digit.** The unconditional width is the tail's: about 1/(4l) in
   c at horizon l (8.05 × 10⁻⁴ at l = 310), and 0.3 of that in 1/(1+c), so the
   fourth digit of the liminf wants a horizon near l ≈ 750–1,000 — a campaign,
   not an afternoon, but the machinery is built and every degree it closes is
   an exact record. If the fourth digit is worth anything to you, say so and I
   will start it.

*(Machine-derived, not peer-reviewed; the programs are attached above, the
records and the page are public.)*
