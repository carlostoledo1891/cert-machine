# corpus/blinking-light — the pinned inputs of the blinking-light decision

The third multitrack run, 2026-11-19, 11:04 to 17:48 UTC. It asked for the least entropy production of a hidden
finite-state network whose lamp, read at Poisson times of rate r = 2, has C1 = 3/10 and C2 = 2/25: the constant
g(3/10, 2/25). The phenomenon and the continuous-record version of the question belong to A. V. Dobrynin and
A. Stroujkova, "When Time-Reversible Sensor Records Require Hidden Dissipation", arXiv:2611.24898 v1 (18 Nov 2026).

- `run/`: what the run folder held at its end. What the two models were given (`GOAL.md`, `START.md`, `gpt.md`,
  `claude.md`, `inherited/`), their conversation (`CHAT.md`, `chat/*.jsonl`, hash-chained message by message), the
  claims the control room registered from their words (`claims/`), the run's pre-registration, amendments, verdicts
  and tests (`control/`), and each track's notes and data files (`gpt/`, `claude/`). Copies are byte for byte; local
  paths appear as they were written.
- `private/`: the control room's private part, kept outside the run folder during the run and sealed by its sha256 in
  the conversation (k3 and k19): the two planted errors and the checks that showed them false before they were posted.
  Published here after the run; both hashes match.
- `MANIFEST.json`: sha256 and size of every file of the run folder and of the private part.

Not copied, pinned by hash in the manifest: the two tracks' programs (`gpt/*.py`, `claude/*.py`, `claude/mt.sh`),
their binary arrays (`*.npz`, `*.npy`), and the paper itself (`inherited/paper/`, distributed by arXiv under its own
licence). The texts are the operator's own: the output of two model chats he opened and of the control-room chat.
