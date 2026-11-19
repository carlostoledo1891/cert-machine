# corpus/twelve-blocks-2 — the pinned inputs of the second twelve-blocks decision

- `review.md`: the review of the first run's report that prompted this run (a separate GPT chat's, as the operator gave it).
- `run/`: the multitrack run of 2026-11-19, 04:31 to 05:45 UTC: what the two models were given (`GOAL.md`, `START.md`,
  `gpt.md`, `claude.md`), their conversation (`CHAT.md`, `chat/*.jsonl`), the claims the control room registered from
  their words (`claims/`), the run's verdicts (`control/`), and each track's notes and data files. In `START.md`,
  `gpt.md` and `claude.md` the operator's home path is written `~`; nothing else differs from the run folder.
- `certificates/`: every certificate the judge reads, compressed with xz: the lower bounds for n = 1..94
  (`V{n}-ge-{V}.json.xz`), the two sub-cube certificates at n = 548 (`W-unit-final-ge-15756`, `W-unit-count`) and the
  one-cube certificate `sdp548-root`. The format is `run/claude/CERT-FORMAT-V.md`.
- `MANIFEST.json`: sha256 of every file the tracks and the control room wrote in the run folder, and of every file here.

The two tracks' programs are not copied: they are pinned by hash in the manifest. The texts are the operator's own (the
output of two model chats he opened).
