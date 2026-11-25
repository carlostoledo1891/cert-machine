# Amendments to corpus/omega-nine-fourths/PREREG.md (each dated and sealed; never edits of PREREG.md)

## A2 — 2026-11-25 ~02:56 UTC: the prompt files, sealed before any agent starts (SEAL-A2.sha256)

prompts/blind-writer.md (writers A and B), prompts/adversarial-reader.md (F4), prompts/proof-reader.md (P1, a Claude
agent and GPT-6.2-astra separately), prompts/provenance-scout.md (U), prompts/kernel-runner.md (Phase 1). A1 (the
closure's target-SHA256SUMS) is written by the Phase 1 runner at the pin step, before K0, and sealed then.
Phase 1 pod: yfz653o1ck7ew9, RunPod cpu3m 32 vCPU / 256 GB, US$1.76/h, created 2026-11-25 02:53:29 UTC (US-CA-2).

## A3 — 2026-11-25 ~02:58 UTC: the two GPT-6.2-astra task files (sealed prompt + a role-and-folders footer)

blind/B/TASK.md (prompts/blind-writer.md + writer B's folders) and proof-readers/astra/TASK.md (prompts/proof-reader.md
+ the pre-fetched inputs, hashed in proof-readers/astra/INPUTS.sha256, because Astra has no network). Each run's
RUN.txt records its TASK.md sha256 at start. Started 02:57–02:58 UTC with the four Claude agents (Phase 1 runner,
writer A, the adversarial reader, proof reader 1) and the provenance scout.
c088065140ef09c1454fe8586da7250864cd62ba8141c760d0a1de117c17ff94  corpus/omega-nine-fourths/blind/B/TASK.md
a9b46484f6d84a8429cc0881fd2571a2e286e774517eb7a57d23d71f844520a6  corpus/omega-nine-fourths/proof-readers/astra/TASK.md
9b50eb44ff2824a5bcd53aefe43931c03c778ceac9ce786a9c4a2cc80db25fc9  corpus/omega-nine-fourths/proof-readers/astra/INPUTS.sha256
