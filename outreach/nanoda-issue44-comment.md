# A comment on ammkrn/nanoda_lib#44 — DRAFT, posted only once the RunPod rows are in

Status: APPROVED by the operator ("Send on nanoda's as well when we finish all tasks", 2026-10-10), to be posted
when the RunPod run (pod mkkyh9bvl5o7au, amendment 14) is imported and the page is updated. Fill the last column from
the ledger, re-check every number against certs/openai-math-kernel.json, then post with
`gh issue comment 44 -R ammkrn/nanoda_lib -F <file>` and record it in outreach/SEND-QUEUE.md (lane O).
Every number below comes from certs/openai-math-kernel.json at commit f8ff2392 or later; "terminated" means the
GitHub runner killed the job (exit 143 or "lost communication", memory) and is NOT attributed to nanoda unless the
log shows nanoda's own abort.

---- PASTE BELOW THIS LINE ----

A data point for this patch from an independent run of every Comparator challenge in OpenAI's math release
(github.com/openai/math @ fd4aeeb2: 416 challenges, Lean v4.34.1), with `enable_nanoda: true` on every config —
Comparator d03acab1 (which asks nanoda for 4 threads), nanoda 3a24072, GitHub ubuntu-24.04 runners (4 vCPU, 16 GB).

- **At 3a24072 as published**, 13 exports abort with `fatal runtime error: stack overflow` / `nanoda exited with 134`
  (the 16 MiB worker stack). Lean's kernel accepted every one of them in the same run.
- **STACK_SIZE raised to 1 GiB** (one line of src/lib.rs): 3 of them then pass (GroupRingDeterminant,
  KaplanskyDirectFiniteness, KaplanskyFinitelyPresented, ~7 GB peak, ~15 min); the others exhaust the 16 GB runner.
- **This issue's patch, on the stock 16 MiB stack**: Laughlin, LaughlinFock, LaughlinPlanar and KMedianThreshold —
  which overflowed or ran out of memory unpatched — are accepted (6.8–8.5 GB peak, 33–142 min). Nine exports still
  overflow the 16 MiB stack with the patch (DirectedFeedback, IndependentSets, MinUncut, OptimalMaxCut,
  SquareDifference, UniqueGamesTheorem, VertexCover, BinPackingGap, PerfectCompleteness; 6.8–11.2 GB at the abort).
- **The patch plus a 1 GiB stack**, on a 256 GB machine: @@RUNPOD@@

So on these real-world exports the patch removes the memory blow-up you describe, and a second, separate limit
remains: some exports recurse deeper than a hard-coded 16 MiB thread stack holds. Would a PR making the worker
stack size configurable (an environment variable, or a config field beside `num_threads`) be welcome?

Every run's facts (exit, peak RSS, time, the kernel lines) are in
https://github.com/carlostoledo1891/cert-machine/blob/main/certs/openai-math-kernel.json; the workflow is
`.github/workflows/openai-math-kernel.yml` and your patch is applied byte for byte
(`corpus/openai-math/nanoda/issue44.patch`). Context: https://carlostoledo.co/reports/openai-math.html (gap G9).
(Run and written with Claude.)

---- END PASTE ----
