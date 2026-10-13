# A note to H. Cohn (cohn.mit.edu/kissing-numbers) — DRAFT, NOT SENT

Audience: Henry Cohn, who maintains the table of kissing-number bounds. Channel: email, sent by the operator (the address
is the operator's to choose; none is guessed here). Every number below is a field of certs/kissing-wave.json and of the
pinned extract corpus/sources/kissing/cohn-table-extract_2026-10-11.json (the table as read on 2026-10-11) — re-read the
live table before sending and adjust any line whose entry has changed.

Pre-send checks:
- [ ] the live table re-read; the entries for 18, 32, 34–39, 43, 45 still equal the bounds decided here (33 still higher)
- [ ] https://carlostoledo.co/reports/kissing.html live with all 19 Qiushi rows and Kravatskiy's 18
- [ ] the operator's word

---- PASTE BELOW THIS LINE ----

Subject: Independent exact checks of the kissing configurations behind several entries in your table

Dear Professor Cohn,

A short note in case it is useful for your kissing-number table. Several of its current lower bounds come from configurations whose authors have now published every point, and I have checked each one exhaustively, pair by pair, in exact integer arithmetic with code that shares nothing with the authors':

- **K(18) ≥ 8,358** (Kravatskiy): decided exactly in Z[√3].
- **K(32), K(34)–K(39), K(43), K(45)**, where your table's values equal the bounds of Yang et al. (arXiv:2609.35051, the "Qiushi Engine" paper): every pair decided, none closer than 60°, the span dimension and the point counts as stated. The authors' own verification checked membership, norms and distinctness but not the pairs; they published the complete point sets at my request and now link the check from their README.
- The same paper's bounds in dimensions 25, 27, 33 and 49–55 are decided too. Your table lists higher values in 25, 27 and 33, which I have not checked.

For 43 and 45 the configurations were also re-decided from the authors' lattice data (Gram matrix, section and fibre conditions), with the same contacts. Dimensions 49–55 (about 1.4·10¹⁵ pairs each) ran on one GPU, using a kernel first calibrated against the CPU results in two smaller dimensions. Every input file is pinned by sha256, and every result can be re-derived with one command.

Write-up with all counts: https://carlostoledo.co/reports/kissing.html (§4)
Code: https://github.com/carlostoledo1891/cert-machine

If the authors behind the other recent entries publish their points (25–31, and 33), I would be glad to run the same check on them.

With best regards,
Carlos Toledo

(This work was done with the help of Claude, an AI model by Anthropic; every verdict above is an exact computation that can be re-run, not the model's judgement.)

---- END PASTE ----
