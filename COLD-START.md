cert-machine — cold start. READ FIRST, BUILD SECOND.

Working dir: /Users/carlostoledo/Documents/cert-machine
Read CLAUDE.md and HANDOFF.md; both current. For the tip run
`git log --oneline -1` — a hash written here would name the commit before the
one that carries it.

══ YOUR TASK THIS SESSION: NONE YET. READ, REPORT, AND WAIT. ══

The operator will give instructions. Do the four orientation actions below,
report what you find in one message, and then STOP. Do not start a build, do
not pick something off the menu, do not spend on model calls. The previous
session closed clean on purpose.

STATE YOU INHERIT: EVERYTHING IS PUSHED AND EVERYTHING IS LIVE.
Working tree clean, no unpushed commits, 56/56 batteries. carlostoledo.co is
current with the repository.

  · THE ENVIRONMENT IS PUBLISHED. carlos-toledo/break-the-grader, PUBLIC,
    v0.1.2, on the Prime Intellect Environments Hub. Verified from the Hub in a
    clean venv, on verifiers 0.2.0 AND 0.3.1. It is the one artifact of this lab
    a stranger can check in a single command:
        prime env install carlos-toledo/break-the-grader
    The `prime` CLI is installed at ~/.local/bin/prime and IS logged in.
  · /playground IS NEW and has four projects: interferometer, simplex,
    neural-geometry, shape-hunt. It is built by playground/build.js alone, none
    of the repository's gates apply to it, and `make playground` rebuilds it.
    The one rule there: no gates, but no fiction.
  · THE LAMBDA(6) RUN IS STILL ALIVE — 17+ hours, pid 90265, sitting on
    NODE 119 exactly as two earlier runs did. Node 119 IS the wall and the fix
    is mathematical, not more hours. Do not restart it hoping.

FIRST ACTION:  node tools/sweep-claims.js && node tools/check-stale-claims.js
SECOND ACTION: node tools/targets.js   (34 rows — the DEAD ones are afternoons
  you do not have to spend again; environments-hub-2026-09-04 is the newest)
THIRD ACTION:  ps -p 90265 -o pid,etime,%cpu   and
  tail -3 '/private/tmp/claude-501/-Users-carlostoledo-Documents-cert-machine/c5f93d49-edfb-492d-b5d5-1cfa9983d587/scratchpad/l6c-err.log'
FOURTH ACTION: gh issue view 179 --repo teorth/erdosproblems --comments
  (and 392, 164; vinid/einstein-arena 64). All four were at zero maintainer
  replies at handoff. A MAINTAINER OR TAO REPLY OUTRANKS EVERYTHING — report it
  and pause rather than acting.

Then read the MENU at the top of HANDOFF.md and report. The menu carries a
ranked list of five unbuilt studies for /playground/shape-hunt, and the two
open items on the interferometer, but NOTHING THERE IS AN INSTRUCTION.

STANDING RULES, unchanged:

  ALL SENDS ARE OPERATOR-GATED. Publishing a decision on our own site is a
  BUILD; posting it into someone else's thread, repo or inbox is a SEND.
  Repository pushes are fine. The claims desk is open and its submitted count
  is zero, published as zero.

  SCOUT BEFORE CLAIMING, AND IT APPLIES TO POSITIONING. "Nobody does X" is a
  literature claim — scout it like one, and write the targets row either way,
  including when the verdict is OPEN.

  MODEL RUNS RESERVE THEIR WORST CASE BEFORE EVERY CALL, so spend cannot cross
  the cap — but the cap is PER PROCESS. Record effort and max_tokens on every
  row or the table is noise. Haiku 4.5 takes no effort parameter at all.
  Spent last session: $2.70.

  sin-mfg is READ-ONLY, permanently. Read anything; write nothing.
  frontier-apps is publication-bound; the interferometer was ported out of it
  with the operator's word, and it is not a general lift source.

  THE OPERATOR'S OWN STANDING NOTE: this is a dev tool, not an academic
  exercise. Find solutions rather than raising blockers, and do not stop at
  every message for permission that has already been given.

ONE OPERATOR ACTION STILL OWED, since 2026-09-03, NARROWED 2026-09-05: the
concept DOI and the current version (v2026.09.2, 10.5281/zenodo.22382866)
carry the one title. The two SUPERSEDED records, 10.5281/zenodo.22285003 and
...22257596, still carry the retired title. ZENODO_TOKEN=... node
tools/zenodo-metadata.js --apply closes it; corpus/zenodo.json titleLag has
the clicks. Metadata edits mint no new DOI.
