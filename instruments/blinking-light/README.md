# instruments/blinking-light — the judge of the blinking-light record

Decides `certs/blinking-light.json` from the pinned run in `corpus/blinking-light/`, as pre-registered in
`notes/blinking-light-preregistration-2026-11-19.md` (committed before any file here existed).

- `judge.py` — runs the deciders on the pinned files and the controls, writes the record (`--write`) and replays it
  (`--check`: re-hashes the pins, decides the start, the rational network and the certificate again).
- `lamp.py` — the run's network checker, byte for byte (multitrack `adapters/lamp.py`, sha256 988cfe18dd5f9ba9…):
  exact rationals for exact rates; for two free rates the Krawczyk test in 256-bit outward-rounded intervals (mpmath);
  sigma enclosed with interval logarithms. Written by the control room from the definitions before the run.
- `rational.py` — a second decider for networks whose rates are all rational, in exact arithmetic, written for this
  record from the definitions without opening `lamp.py`.
- `lower.py` — the checker of a lower-bound certificate's finite conditions over the whole diamond, written for this
  record from the text of the two theorems (`run/claude/lifting.md`, `run/claude/locality.md`) and the format, without
  opening either track's program.
- `CHECKERS.md` — the account of `rational.py` and `lower.py` by their author, limits first.

What this does not decide: Theorems D and C, which turn the certificate into a lower bound on g. They were proved by
one model and read once by the other.

Needs Python 3.9+ and mpmath (for `lamp.py` only). `python3 instruments/blinking-light/judge.py --check`.
