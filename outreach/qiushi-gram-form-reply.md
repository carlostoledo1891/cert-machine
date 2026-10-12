# A follow-up on Oxelra-AI/Qiushi-Engine-Kissing-Number-Research issue #1 — DRAFT, NOT SENT

Answers the question Cherish0925 asked on 2026-10-11 04:01 UTC ("Would integer or rational coefficient rows accompanied by
their exact Gram matrix work with your checker, or would ordinary Euclidean coordinates be more convenient?"), which our
2026-10-12 reply did not answer. Send only on the operator's word, and only after they have answered our 2026-10-12 post
(no double-posting). Every number below is a field of the gramCheck blocks on rows qiushi-43 / qiushi-45 of
certs/kissing-wave.json — fill and re-check them from the record before sending.

Pre-send checks:
- [ ] gramCheck WITNESSED and agreesWithCartesian on both rows, committed, pushed, and the kissing page live with the
      Gram-form sentence
- [ ] gram_battery.py green in the control build
- [ ] their thread re-read; their constructions/sections data unchanged since 33fe9c1f (or the pins updated)

---- PASTE BELOW THIS LINE ----

On your question of 2026-10-11 — whether integer or rational coefficient rows with their exact Gram matrix would work: yes,
directly. The checker now takes the form your construction states:

- **rows:** n integer coefficient rows (a binary file of little-endian int8/int16/int32, or CSV), with its sha256;
- **gram:** the Gram matrix of that basis as integers over one denominator;
- **scale:** for a projection or section written over a common denominator s, the rows are s·p and the products are
  z G z′ᵀ / s²;
- **claim:** the count, the dimension, the squared norm (a rational in G's units).

It proves G positive definite by an exact LDLᵀ, checks every norm, distinctness and the span dimension, and decides every
pair as z G z′ᵀ, exactly, with a plain-integer sample and a separate BigInt implementation as cross-checks.

To calibrate it I re-decided 43 and 45 from your lattice data in `constructions/sections` at 33fe9c1f. Every exported row
is z·B (43) or n·B (45) with integer coefficients ({{43.basisIdentity}}, {{45.basisIdentity}} exactly); in 43 every z
satisfies z G zᵀ = 6 and T₅ G zᵀ = 0, and in 45 every n is 8z − (eᵢ + 𝟏)T for exactly one fibre i with z G zᵀ = 6 and
z G Tᵀ = eᵢ ({{45.fibreCounts}} per fibre). Decided again from the coefficients, every pair gives the same result as the
Cartesian check: {{43.contacts}} and {{45.contacts}} contacts, none closer.

So for 32–39 and 49–55, publish in whichever form is native to the construction. A manifest like this is all the checker
needs:

```json
{"rows": {"file": "section43-coefficients.i8", "sha256": "…", "format": "i1", "columns": 48},
 "gram": {"num": [[6, 3, 3, …], …], "den": 1}, "scale": 1,
 "claim": {"count": 2553792, "dimension": 43, "norm": "6"}}
```

For 49–55 the pair count is the cost — about 1.4 × 10¹⁵ pairs per dimension — so there we would also like to check what
your proof rests on (the moment certificates and the minimum norm of the ambient lattice), not only the points.

*AI-assisted: built with Claude (Anthropic); every verdict is the record's exact decision, re-derived at every build.*

---- END PASTE ----
