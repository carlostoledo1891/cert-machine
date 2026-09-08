# Reply on vinid/einstein-arena#64 — DRAFT, operator-gated, NOT SENT

Written 2026-09-07 after vinid's reply of 14:54 UTC that day (pointing to
github.com/togethercomputer/EinsteinArena-new-SOTA for the 604 vectors), and
rewritten 2026-09-08 once congruence was DECIDED. Every number below is read
from certs/kissing-ledger.json and certs/kissing-congruence.json at the build
of 2026-09-08; re-run `node tools/run-kissing-ledger.js` before pasting if the
tree has moved. Post with `gh issue comment 64 -R vinid/einstein-arena -F -`
(body below the rule) only on the operator's explicit yes.

---

Thank you — that was exactly what was missing, and the row is decided.

`kissing-number/solutions/solution_n=604_d=11.json` (commit c388c6f7, sha256
`0bde9ca2c434d7beb5af63a64a291498e8c264d9a5718b738e92dd70b9ba7761`) read as 604
vectors over Z[√2] at shell norm exactly 36 and **certified** in exact
arithmetic, shared-nothing with your verifier: all 182,106 pairs decided, 19,704
of them at exactly 60°, every other pair strictly clear. The row is CERTIFIED
and credited to the platform: https://carlostoledo.co/reports/kissing.html —
the file is pinned byte for byte and re-hashed at every build.

Three things the bytes said that you may want to know.

**1. Your 604 and the Station's configuration 1 are the same configuration.**
Not "similar": congruent, with a certificate. Treating each configuration as a
complete graph on 604 vertices whose edges carry the exact normalised inner
product (22 distinct values), an individualisation–refinement search finds a
bijection π of the vectors, and from π an orthogonal matrix T over Q(√2) is
solved on eleven independent vectors and verified on all 604 (T·2aᵢ = b_π(i)
for every i, TᵀT = I, all exact). T is a signed permutation of the eleven
coordinates — your file and their `kissing_certificates.npz` configuration 1
are one configuration written in two frames. Their configurations 2 and 3 are
NOT congruent to it (the same search exhausts; their contact counts 22,904 and
22,840 already say so). The certificate (π, T) is public and anyone can re-check
it without the search: https://carlostoledo.co/certs/kissing-congruence.json
(the verifier is `instruments/kissing/congruence.js`, `verifyCertificate`).
As data: your file entered a public repository on 2026-04-12 and arXiv:2606.10402
was submitted 2026-06-09; the Station's artifacts and arXiv:2608.23691 are
dated 2026-08-24. I am stating the bytes and the dates, nothing more.

**2. The lineage is in the bytes.** 496 of the 604 directions are your 594 rung
winner's — exactly its 496 integer vectors — and the winner's 98 decimal-valued
vectors were replaced by 108 vectors with a √2 part. 176 directions are the
classical 582 shell's. Slack: 4,608 pairs sit at 60.94°, under a degree from
contact.

**3. Your open rungs, read exactly.** I ran the best submission on each open
rung through the same instrument, as a distance rather than a verdict (an
attempt that fails refutes nothing): n = 605 — 9,510 violating pairs, worst
40.24°; n = 842 — 237 violating pairs, worst 57.09°; n = 841 — exactly ONE
violating pair, and it is a repeated vector (#2081, entries 0 and 840
coincide): 840 distinct directions with 41,128 exact contacts, an 840-point
configuration handed in as 841. You may want a duplicate check in the scorer;
the platform score of 2 is that one pair.

The offer stands for anything else you would like decided exactly.

*(Independent re-verification, not affiliated with EinsteinArena, DeepMind,
Together AI or dualverse; machine-derived and not peer-reviewed; instrument,
corpus and certificates public in the cert-machine repository.)*
