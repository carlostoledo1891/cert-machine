# Cohere — Member of Technical Staff, Data Analysis and Evaluation (packet drafted 2026-10-16, updated 2026-10-19; the send is the operator's)

Written for: the Cohere hiring team reading the MTS, Data Analysis and Evaluation applications.

Posting: https://jobs.ashbyhq.com/cohere/61703710-4379-42fd-a508-946f2a5fb6bc. Pinned as read on 2026-10-16 (Ashby
job-board API) in posting-2026-10-16.txt. "No restrictions on where you can be located for this role"; London listed as
the posting's office, so London core hours are the likely alignment (UTC−3 overlaps 09:00–18:00 London from 06:00 to
15:00 local); compensation unlisted. The posting warns that AI-enabled tools may screen applications: keep the resume's
nouns literal (evaluation, statistics, dataset quality, robustness, annotators) and the numbers in the text.

What the Ashby form takes (read the live form): name, email, resume, LinkedIn, GitHub, website, location, work
authorization, and free-text fields.

## Attach

- `outreach/resume/resume.pdf` (v3, verification accent).
- Links: carlostoledo.co · github.com/carlostoledo1891/cert-machine.
- FRESHEST RESULT (2026-10-18): https://carlostoledo.co/reports/optimization-constants.html — Terence Tao's
  optimization-constants registry removed four "verification minimal" asterisks on our exact replays (pull requests
  #216 and #230, merged; the pages cite the replays). An outside record-keeper changing a public record on the
  verdict alone is the strongest validation the work has; lead with it where the form allows a link.
- ALSO FRESH (2026-10-16 night): https://carlostoledo.co/reports/curve-seeds.html — a published claim reproduced independently from the specifications within hours, two implementations agreeing field for field, every forgery failing: the reproduction discipline the role asks for.
- Writing samples: https://carlostoledo.co/reports/gsm8k-audit.html (dataset quality: an answer key audited item by
  item, with the error classes counted); https://carlostoledo.co/reports/openai-math.html (a release's statements
  read by two readers against their headlines — annotation with a second reader wherever the first found a gap);
  https://carlostoledo.co/reports/envs.html (graders measured against provably wrong answers).

## Free text: relevant work / why this role (~200 words)

The role asks for statistics and experimental design applied to the quality of data and the reliability of
evaluation. That is the part of my 2026 work that is not mathematics-specific:

- **Dataset quality.** GSM8K's answer key re-decided step by step: 8,792 keys, 4,282 annotated steps all exact, 26
  printed steps wrong, 7 of them leaving the key's answer underived — each class counted, each item listed, the page
  rebuilt from the record.
- **Annotation with a second reader.** OpenAI's math release: 242 formalized families read against their headlines,
  by two readers wherever the first found a gap; 34 state less than they claim with nothing saying so. The protocol,
  the ledger and the per-item evidence are public.
- **Evaluator reliability.** Four grader families measured against 4,000 provably wrong answers: absolute-tolerance
  rules accept 3,582 (tolerances pooled), a certificate grader none — ground truth that is a proof, so no label noise.
- **Outside acceptance.** Terence Tao's optimization-constants registry removed four "unverified" marks after my exact
  replays of their certificates, and cites the replays.
- **Reproduction with error bars.** METR's time-horizon estimator re-derived with a certified enclosure for every fit.
- **Pre-registration and negative results.** A GRPO study with gates set before any spend, deviations dated, the
  negative result published as the result.

I would bring that discipline — pre-registration, red controls, two implementations sharing no code, refusal as a
reported verdict — to data collection and evaluation at Cohere's scale, and learn the human-annotator and
distributed-training ends from your team. Remote from Brazil (UTC−3), overlapping London's day.

## Facts to hold to, and gaps to state plainly if asked

- "Hands-on experience training LLMs on distributed training infrastructures": NOT met. One LoRA GRPO study on a
  hosted trainer. The posting says the list is neither exhaustive nor necessary; apply on the statistics and
  evaluation half and say which half.
- "One or more papers at top-tier venues": none. The method paper is a manuscript (draft v0.7, 56 pp, not peer-reviewed).
- Human-annotator programmes: not run here; the two-reader protocol above is the nearest thing and is small.
- Numbers above are read from the records named in resume.md's sender notes; re-read before sending (last re-read 2026-10-19).

Status: SENT 2026-10-20 by the operator.
