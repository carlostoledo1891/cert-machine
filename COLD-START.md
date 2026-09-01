cert-machine — cold start. READ FIRST, BUILD SECOND.

Working dir: /Users/carlostoledo/Documents/cert-machine
Read CLAUDE.md and HANDOFF.md; both current. For the tip, run
`git log --oneline -1` — a hash written into this file would name the commit
before the one that carries it, so it is deliberately not stamped here.
make test 39 PASS · batteries 29/29 · design battery ALL PASS · drift 130
unchanged, 0 local edited. Working tree clean, origin in sync, site deployed.

FIRST ACTION:  node tools/sweep-claims.js
SECOND ACTION: node tools/targets.js
  19 targets with the citation that killed each. Read it before proposing
  anything. It exists because five targets died in one session, each after
  hours, each of which would have died in minutes. Seven are DEAD or
  OCCUPIED — those rows are afternoons already paid for.
THIRD ACTION:  read the MENU at the top of HANDOFF.md. It is a real menu now,
  ranked, with the reason each item is ranked where it is.

YOUR TASK THIS SESSION: WAIT FOR DIRECTIONS.
Do not pick something off the menu and start. Read the three things above,
say what you found in a few lines, and then STOP and ask. The operator will
say what to work on. This is deliberate: the last several sessions each began
by being pointed at one thing, and the menu exists so that pointing is cheap
— not so that a session can self-assign.

WHERE THINGS STAND

  · Erdős #290 is CLOSED. c_0 = 0.546 unconditionally (250 degrees, l =
    61..310 contiguous). Both issue-164 comments are POSTED, including the
    free improvement to Theorem 8's other constant, 0.61 -> 0.6022. Nothing
    on that front is waiting on a session.
  · reports/glide-band.html is BUILT and LIVE — the engine-out glide ring
    recomputed as a certified enclosure on a real pinned ADS-B flight. Its
    headline is structural: while the panel's configured ratio sits inside
    the honest envelope, its single line cannot be proved wrong about
    anything. Terrain (H1) is the named next build.
  · The whole site moved to sans this session, and the SkyAudit app surface
    stopped owning its own fonts. 45 pages, one font request, one source.
  · UNSENT and NEEDING REWORK: the two OEIS packs. Their framing predates the
    repricing — the fourth digit is a sequence digit, not a theorem digit.

THE RULES THAT BIND, in one paragraph each

  SCOUT BEFORE YOU BUILD. sin-mfg (/Users/carlostoledo/Documents/sin-mfg) is
  READ-ONLY and permanently so — read anything, write nothing, and read it
  FIRST, because its probe notes have twice killed a target that was already
  on disk. Write the targets.json row for whatever you scout, including when
  the verdict is OPEN.

  DO NOT ANSWER A REQUEST FOR IDEAS WITH A CHECKER. A previous session was
  asked for ideas and built a gate; the gate was deleted. Gates catch drift
  and forgery, never direction.

  DO NOT TUNE A NUMBER UNTIL THE STORY WORKS. This nearly happened twice this
  session — once raising a "book glide ratio" until refutations appeared. The
  honest scenario needed no tuning at all. If a finding requires a chosen
  constant to be dramatic, it is not a finding.

  A RED CONTROL THAT CANNOT FAIL IS DECORATION. One written this session
  fired vacuously — an assert.ok(false) after the loop guaranteed it
  regardless of what the loop tested. Check that every red can actually fail.

  AVIATION WORDING. "Certified" always means a mathematically certified
  enclosure and carries no airworthiness meaning; say so where a reader could
  trip, and keep NOT FOR NAVIGATION on any artifact depicting a procedure.

WHAT THE LAST SESSION WOULD TELL YOU IF IT COULD SAY ONE THING

  Both defects it found were hand-maintained registries that nothing checks:
  `make reports` was missing a builder, and design/app-shell.js restated
  fonts it should have derived. Neither was a code-quality problem. If you
  are ever asked "why did this not propagate", look for the list somebody has
  to remember to update.

Now: run the three actions, report briefly, and WAIT FOR NEW DIRECTIONS.
