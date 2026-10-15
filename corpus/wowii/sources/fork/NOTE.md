# The claimant's fork proofs — provenance

The five `WOWII*Proof.lean` files are the `formal_proof` targets the five PRs on google-deepmind/formal-conjectures cite
(RhudeJJJJ/formal-conjectures at commits c9f7e9b8 (353), a95d2f08 (360, 396), b45f7e0f (373), 66d81217 (395b),
path `Proofs/`). They were fetched by this session's scouting agent on 2026-10-15 ~17:14 UTC from those URLs; by
20:45 UTC the same URLs returned 404 and the fork's `main` (e47a327f, pushed 20:41 UTC) no longer carried the files
at any path (`git/trees?recursive=1` searched) — the cited commits appear to have been rewritten. The sha256 of each
file as fetched is recorded in corpus/wowii/PINS.json and matches the scout's MANIFEST.sha256 at fetch time.

What is used from them: the witness definitions only (a parent table for each tree; block + bridge tables for the two
clique graphs), read as text by instruments/wowii/decide.py. No Lean here is built or trusted; the verdicts are the
standard-library deciders'. Never executed.
