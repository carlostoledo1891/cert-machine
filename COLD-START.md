cert-machine — cold start. READ FIRST, LOOK SECOND, BUILD LAST.

Working dir: /Users/carlostoledo/Projects/cert-machine (out of iCloud since
2026-09-06; sin-mfg and frontier-apps beside it under ~/Projects, both
READ-ONLY). Then read CLAUDE.md, the TOP OF HANDOFF.md (the 2026-09-07
eighth-session block first), DEBT.md. Tip: git log --oneline -1

STATE YOU INHERIT (2026-09-07, 33e4f44, pushed, LIVE): 80/80 batteries,
58 reports, 16 instruments. The ten-report KAUST plan is COMPLETE (reports
1–5 and 7–10 under /reports, 6 as /instruments/census). The front is one
power system: the engine → certifiers → {reports, instruments} → gates
drawing under the deck, the instruments carrying half the front, every
count read at build from playground/out/manifest.json (the instruments'
single source — make site builds the instruments first). New library:
instruments/interval/taylor2.js (a second-order interval jet + midpoint
rule with remainder). Census sliders and grammar fixed; every instrument
page has the shell's footer.

ORIENTATION:
  git log --oneline -1 && git status -sb
  node tools/check-grammar.js && node tools/check-wiring.js | tail -2
  ps -p 90265 -o pid,etime   (λ(6), if it still lives; the fix is
    mathematical — see the 2026-09-06 cold start in git history)
  node tools/targets.js kaust   (the plan's row: built 1–10, next = follow-ups)

THE MENU, in the order I would take it:
  1. THE THREE DRAFTS, for the operator's eyes only: Ashrafyan–Gomes (the
     printed density is not integrable as printed; the finest printed error
     is 39 % tolerance), Gomes–Yang/Gomes–Oberman (4.4099660 is wrong in its
     seventh digit), and the KAUST bundle. Draft, do not send; re-verify the
     July roster at source on the day of any send.
  2. THE CHROME GATE HANG (DEBT, open): the layout ruler and the render gate
     hung THREE times today in chained runs, each a Chrome with a second of
     CPU that never returned, each clean on rerun. Serialise the two gates
     with a per-page timeout that names the page and print the Chrome
     version. An hour. It has eaten two chained runs and a chunk of three
     sessions.
  3. Follow-ups from the plan, none started: an inf–max upper bound for the
     non-separable 2-D effective Hamiltonian (a rigorous ceiling for
     Gomes–Yang Fig. 7); a banded tail inverse for the regularization atlas;
     the m = 0 free-boundary regime.
  4. The older menu still stands: the G&R integral-table audit (targets row
     gr-integral-table-audit), λ(6)'s tenth family, certifier-core from
     frontier, terrain for the glide band.

STANDING RULES, unchanged:
  · ALL SENDS ARE OPERATOR-GATED. Repository pushes are fine, and a push to
    main IS the deploy (Vercel; no CLI here).
  · sin-mfg is READ-ONLY, permanently — report its bugs (the MPR wall leak is
    in instruments/price/FINDINGS_LIT.md), never repair them. frontier-apps
    likewise, and it has no git.
  · SCOUT BEFORE CLAIMING — node tools/targets.js; write the row, even OPEN.
  · NO FICTION ON /instruments; every count there is computed (the manifest).
  · A MEASUREMENT IS NOT A LOOK. Screenshot the page (scratchpad fullshot.js
    pattern: design/cdp.js, full-page capture, crop, Read) before saying it
    is fine; the ruler ratchets, and a worse number needs --accept-worse and
    a reason in the commit.
  · When a gate hangs, it is the Chrome flake: kill it, rerun it alone, and
    trust the rerun. When a gate and a throwaway probe disagree, THE GATE IS
    PROBABLY RIGHT.
  · A rule defined twice WILL diverge: one manifest, one catalogue, one
    battery record; read them, never retype a count.

OWED BY THE OPERATOR: the three drafts above, once written; the two
superseded Zenodo titles; the ember paper read; the staged formal-conjectures
issue and the letters.

Spent this session: $0.00 (no paid API calls; every instrument page rebuilt
from its records).

Wait for instructions.
