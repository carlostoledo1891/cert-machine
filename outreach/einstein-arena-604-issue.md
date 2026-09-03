# STAGED — GitHub issue on vinid/einstein-arena (post only on the operator's word)

Target: https://github.com/vinid/einstein-arena/issues/new
Command on approval:

```
gh issue create --repo vinid/einstein-arena \
  --title "The 604-point kissing configuration (d=11): please publish the vectors — independent exact certification is ready" \
  --body-file outreach/einstein-arena-604-issue.md   # body = everything below the marker
```

---8<--- BODY BELOW THIS LINE ---8<---

Congratulations on the 604 — one of the largest single moves on K(11) since Best. I maintain
[cert-machine](https://carlostoledo.co), which re-decides published mathematical records in exact
arithmetic, and I have just re-decided the dimension-11 kissing ladder end to end, in exact
arithmetic over Z[√2] on BigInt, shared-nothing with every producer's verifier:

- **AlphaEvolve's 593** — certified from the integer vectors in DeepMind's notebook;
- **your platform's solved n=594 rung winner** (solution #1492, fetched from your public
  `/api/solutions/best`) — certified. A detail your team may enjoy: the winning bytes are
  *not* integers (982 decimal entries), but read as the exact rationals those literals denote
  they are already a genuine exact witness — 17,088 pairs at exactly 60°, every other pair
  strictly clear;
- **the Station's three 604-point configurations** — certified at shell norm exactly 4, with
  distinct exact contact counts (19,704 / 22,904 / 22,840), so the three are provably pairwise
  non-congruent.

The ledger and method are here: https://carlostoledo.co/reports/kissing.html — every verdict
recomputes from sha-pinned bytes at every build, and the instrument's battery includes red
controls that must fire.

The one row I cannot decide is **your headline 604** (arXiv:2606.10402, and the bound Cohn's
table credits to your paper). As far as I can tell no public endpoint serves the configuration
itself: `/api/problems` lists the solved n=594 rung and the open n=605 rung, and the threads
discuss the frozen 604 without carrying its vectors. So the ledger row for it currently reads
NEEDS DATA.

**The ask:** publish the 604 vectors in any form you like — float64 lists, decimal strings,
integers, or (a+b√2)/q coefficient pairs; a repo file, a gist, or an API endpoint all work. I
will run the exact certification the same day and flip the row to CERTIFIED with your
configuration's exact contact count, credited to the platform. If any other rung winners
(d=12, d=16) would benefit from the same treatment, I'm happy to run them too.

*(Independent re-verification, not affiliated with EinsteinArena, DeepMind, or dualverse;
machine-derived and not peer-reviewed; the full instrument and corpus are public in the
cert-machine repository.)*
