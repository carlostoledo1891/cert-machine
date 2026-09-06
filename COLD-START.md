cert-machine — cold start. READ FIRST, LOOK SECOND, BUILD LAST.

Working dir: /Users/carlostoledo/Projects/cert-machine IF THE MOVE HAPPENED,
else /Users/carlostoledo/Documents/cert-machine. Find out before anything:

  ls -d ~/Projects/cert-machine ~/Documents/cert-machine 2>&1
  pgrep -fl 'move-out-of-icloud|python3 -' | head

══ FIRST: WAIT FOR THE iCLOUD TASK. ══
The last session left a detached job running (pid 74153 at handoff). It reads
back every file iCloud still held evicted in the three trees (cert-machine,
sin-mfg, frontier-apps — the last were git objects) and, when all three read
clean, runs tools/move-out-of-icloud.sh /Users/carlostoledo/Projects, which
MOVES the three folders out of iCloud Drive, repoints the four path-bound
places in this repo and renames the ~/.claude/projects memory directories.
  · If ~/Projects/cert-machine EXISTS: the move happened. cd there. The four
    path edits are uncommitted: run `make drift` (expect 130 unchanged),
    `node tools/check-wiring.js`, `make test` (70/70), then commit them and
    push. Then proceed to the menu.
  · If it does NOT exist and the job is still running: WAIT. Do not build,
    edit or run a gate in ~/Documents/cert-machine — the folder will move
    under you. Check every few minutes with the two commands above.
  · If it does not exist and NO such job is running: the job died. Run
    `zsh tools/move-out-of-icloud.sh /Users/carlostoledo/Projects` from
    ~/Documents/cert-machine. It refuses while any file is still evicted
    (that refusal is correct — a dataless file moved out of iCloud can never
    be hydrated); read the named files through (cat > /dev/null) and re-run.
After the move the three folders are outside iCloud; Keep Downloaded no
longer applies and check-wiring's check 0 stays as a harmless guard.

Then read CLAUDE.md, the TOP OF HANDOFF.md (the 2026-09-06 close-of-session
block, then the fifth-session block), DEBT.md. Tip: git log --oneline -1

STATE YOU INHERIT: pushed, live, 70/70 batteries in BOTH registries and on
carlostoledo.co/machine. Fifteen instrument pages; the last five ported
2026-09-05 from frontier-apps (lattice-claims, rewire, pqc, occultation,
transit). Zenodo v2026.09.2 carries the one title; the concept DOI resolves
to it. The dash census is at zero, dark is locked, the ruler drives
1440/768/390, the render gate reads what a page shows.

ORIENTATION (after the move, from the new root):
  git log --oneline -1 && git status -sb
  node tools/check-grammar.js && node tools/check-wiring.js | tail -2
  ps -p 90265 -o pid,etime   (λ(6): 51+ hours at node 119. THE FIX IS
    MATHEMATICAL. Do not restart it hoping.)
  node tools/targets.js gr    (the newest row: the G&R integral-table audit)

THE MENU, in the order I would take it:
  1. The G&R audit's YIELD MEASUREMENT (targets row gr-integral-table-audit):
     ~100 entries transcribed with double entry from sections Moll has not
     proved, a rigorous quadrature (python-flint's acb_calc behind our own
     red controls is the hour-long route; a Petras integrator in
     instruments/interval the session-long one), count refuted / held /
     undecidable. The known errata (mathtable.com/errata/gr8_errata.pdf) are
     the calibration set: refute every known-wrong entry and certify its
     correction before believing a new refutation. Every erratum is a SEND.
  2. λ(6): the tenth family, a+2e=2f, needs a closing shape the auto-closer
     lacks (instruments/lambda56/close.js). Kill the 51-hour run on purpose
     and rerun that family alone with AUTOCLOSE_TRACE=1 to see where it stalls.
  3. certifier-core + blind-spot from frontier, after one more frontier
     session (HANDOFF says why). The toolchain is installed.
  4. Terrain for the glide band, after the TAWS scout nobody has done.

STANDING RULES, unchanged:
  · ALL SENDS ARE OPERATOR-GATED. Repository pushes are fine.
  · sin-mfg is READ-ONLY, permanently. frontier-apps is READ-ONLY too and
    has NO git — sha256 is the only pin. Both moved with this repo.
  · SCOUT BEFORE CLAIMING — node tools/targets.js; write the row, even OPEN.
  · NO FICTION ON /instruments. No gates there; that is the whole obligation.
  · A MEASUREMENT IS NOT A LOOK. If you cannot see the page, say so and stop.
  · NEVER put a backtick or a literal hex inside a comment that sits in a
    template literal.
  · When a gate and your own throwaway probe disagree, THE GATE IS PROBABLY
    RIGHT — twice this session it was (the layout ruler on SVG; the move
    script on .git objects the walks had skipped).
  · A pinned record is a claim about the code that produced it. Re-run it
    once at port time; two of five ports this session had records their own
    code did not reproduce.

OWED BY THE OPERATOR: the two superseded Zenodo titles (22285003, 22257596)
— ZENODO_TOKEN=... node tools/zenodo-metadata.js --apply; the ember paper
read; the staged formal-conjectures issue and the letters.

Spent last session: $0.00.

Wait for instructions.
