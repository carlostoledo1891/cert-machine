# Second-party confirmations, 2026-11-02 — three comments, each the operator's word to post

Record: certs/autocorr-replay-next.json (tools/replay-autocorr-next.js); page: /reports/optconst-queue.html#autocorr-next.
Re-read every number against the record before posting. No AI line beyond what the thread already carries.

---

## #261 (C_1c, Kos2026) — https://github.com/teorth/optimizationproblems/pull/261

Independent replay of the K = 24576 certificate, offered as the second party the asterisk rule in CONTRIBUTING asks for.

I re-derived the score of `K24576_0.4103333.json` (sha256 `963cb727…783c9e`, at a4ee94ef, the digest the page prints) with two implementations that share no code with each other or with `score_exact.py`, `verify.py` and `verify_independent.py`, which I kept as text and did not run: one in Python (Fraction and int, every lag summed term by term), one in JavaScript (BigInt, the autocorrelation as one Kronecker product). Both give

```
134648548624804778248790016 / 328144294688458468928334649
= 0.410333352748493339534747580157…
```

with the minimum at k = 21264: the fraction and the lag the page states, so `C_1c ≥ 0.4103333` holds. Controls, which must come out wrong in both: a bound 2·10⁻¹⁵ above the exact value is refuted, and a negative weight is refused.

Record, pins and both programs: https://github.com/carlostoledo1891/cert-machine (certs/autocorr-replay-next.json; corpus/optconst-queue/next-2026-11-02; instruments/optq/autocorr.py and stepfun-exact.js), and the page https://carlostoledo.co/reports/optconst-queue.html#autocorr-next. I have no connection to the author.

---

## #247 (C_1d, STEPS2026) — https://github.com/teorth/optimizationproblems/pull/247

Independent replay of the 600-cell certificate, offered as the second party the asterisk rule in CONTRIBUTING asks for.

I re-derived max_t |f∗f| / (∫f)² for `construction.json` (sha256 `3dd39fae…b3a28c`, at steps-re/c1d-certificate 9a091494, the digest the page prints), each stored double read as an exact rational, with two implementations that share no code with each other or with `verify.py`, which I kept as text and did not run: Python (Fraction, the knot sums term by term) and JavaScript (BigInt, Kronecker products). Both give

```
698746209786798359455483373677229695641600 / 478522078482569620433992386249161163190849
= 1.460217284022873985248826533292…
```

the fraction the page states, so `C_1d ≤ 1.460217284022874` holds (the printed bound is the value rounded up). Controls: a bound 10⁻¹⁵ below the exact value is refuted, and a function changed to integral zero is refused, in both.

Record and programs as above (https://carlostoledo.co/reports/optconst-queue.html#autocorr-next). I have no connection to the author.

---

## #248 (C_1d, AER2026; SCIEL2026 not decided) — https://github.com/teorth/optimizationproblems/pull/248

Independent replay of the [AER2026] row this pull request added, offered as the second party the asterisk rule in CONTRIBUTING asks for; and a note on [SCIEL2026].

**[AER2026].** `STEP_FUNCTION_C4_PRIME_N600` in `problem_4_signed_autoconvolution_bounds.py` (sha256 `1a290ad1…ff54b2`, at 4b3bbd2a, the digest the page prints), the 600 literals extracted verbatim and decided under both readings the row names, by two implementations that share no code with each other or with the file's evaluator (kept as text, not run):

```
decimals read exactly:  1.459989046905383144952592421986…
read as binary64:       1.459989046905383243150303255860…
```

Both are below 1.459989046905384, so the bound holds under either reading. A small precision for the comment: it gives 1.4599890469053831… for both readings; that is right for the exact one, while the binary64 one is 1.4599890469053832…, from the sixteenth decimal. Controls: the same function with its largest cell doubled is refuted, in both implementations.

**[SCIEL2026].** Not replayed: the certificate is a restricted Zenodo record (files on request), so there are no public bytes to pin. If the files are shared, I will replay them the same way.

Record and programs: https://github.com/carlostoledo1891/cert-machine (certs/autocorr-replay-next.json), and https://carlostoledo.co/reports/optconst-queue.html#autocorr-next. I have no connection to either team.
