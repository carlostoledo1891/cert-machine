# Reply on vinid/einstein-arena#64 — DRAFT, operator-gated, NOT SENT

Written 2026-09-07 after vinid's reply of 14:54 UTC the same day, which pointed
to github.com/togethercomputer/EinsteinArena-new-SOTA for the 604 vectors.
Every number below is read from certs/kissing-ledger.json at the build of
2026-09-07; re-run `node tools/run-kissing-ledger.js` before pasting if the
tree has moved. Post with `gh issue comment 64 -R vinid/einstein-arena -F -`
only on the operator's explicit yes.

---

Thank you — that was exactly what was missing, and the row is decided.

`kissing-number/solutions/solution_n=604_d=11.json` (commit c388c6f7, sha256
`0bde9ca2c434d7beb5af63a64a291498e8c264d9a5718b738e92dd70b9ba7761`) read as 604
vectors over Z[√2] at shell norm exactly 36 and **certified** in exact
arithmetic, shared-nothing with your verifier: all 182,106 pairs decided, 19,704
of them at exactly 60°, every other pair strictly clear. The ledger row is
CERTIFIED and credited to the platform:
https://carlostoledo.co/reports/kissing.html — the file is pinned byte for byte
and re-hashed at every build.

One observation you may find interesting, stated carefully. 19,704 is also the
contact count of the Station's configuration 1, and the coincidence goes
further: normalising every inner product by the shell norm, the multiset of all
182,106 pairwise inner products of your 604 is identical to configuration 1's,
and so is the multiset of per-vector profiles; both differ from the Station's
configurations 2 and 3. The two published lists are not the same list (108 of
the 604 directions coincide exactly). Equal Gram profiles are necessary for
congruence, not sufficient, so I have recorded the match and not decided
congruence. If you know the two were reached independently, that is worth a
line in the ledger; if you know they are one configuration in different
coordinates, so is that.

The offer for the d = 12 and d = 16 rung winners stands.

*(Independent re-verification, not affiliated with EinsteinArena, DeepMind,
Together AI or dualverse; machine-derived and not peer-reviewed; instrument and
corpus public in the cert-machine repository.)*
