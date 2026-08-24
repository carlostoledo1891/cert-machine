# cert-machine — there are no gates in this file. Every target reports.
#
# C53 is kept: a runner NAMES what it does not run. `make selftest` prints its
# own absences at the end, because a summary that lists its passes and omits
# its gaps reads as complete when it is not.

SHELL := /bin/bash
PY    ?= python3
NODE  ?= node

.PHONY: help selftest fast drift lift new-hunt hunts control page clean

help:
	@echo "cert-machine"
	@echo ""
	@echo "  make selftest    every battery in the tree, and a list of what it does NOT cover"
	@echo "  make fast        the inner loop: funnel machine + interval only"
	@echo "  make hunts       every hunt battery under hunts/*/battery.js"
	@echo "  make control     rebuild control.html from the records (runs every battery)"
	@echo "  make page        gate the generated page: determinism, derivation, design invariants"
	@echo "  make drift       re-hash the lift against sin-mfg and name what moved (reports, never blocks)"
	@echo "  make lift        re-copy from sin-mfg per LIFT.json (source is never written to)"
	@echo "  make new-hunt SLUG=<name>   start a hunt from the funnel skeleton"
	@echo ""
	@echo "  a hunt runs itself:  node machine/funnel/funnel.js hunts/<slug> --seed s1 [--generator enum|evolve|searcher]"

fast:
	@$(NODE) machine/funnel/selftest/battery.js | tail -1
	@for t in test-eqcert test-interval; do \
	  printf "%-34s " "interval/$$t"; \
	  $(NODE) instruments/interval/tests/$$t.js >/dev/null 2>&1 && echo PASS || echo FAIL; \
	done

selftest:
	@echo "=== machine ==="
	@printf "%-34s " "funnel (14 items, 19 red controls)"; \
	  $(NODE) machine/funnel/selftest/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-34s " "detach (11 checks)"; \
	  $(NODE) machine/detach/selftest.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@echo "=== instruments ==="
	@for t in test-eqcert test-interval test-transcendental test-transcendental-enclosure; do \
	  printf "%-34s " "interval/$$t"; \
	  $(NODE) instruments/interval/tests/$$t.js >/dev/null 2>&1 && echo PASS || echo FAIL; \
	done
	@printf "%-34s " "trigmin (47 checks, 2 red)"; \
	  $(NODE) instruments/trigmin/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@for f in sos_verify lyapunov_cert reverify_ai_lyapunov; do \
	  printf "%-34s " "sos/$$f"; \
	  $(PY) instruments/sos/$$f.py >/dev/null 2>&1 && echo PASS || echo FAIL; \
	done
	@echo ""
	@echo "NOT COVERED BY THIS RUNNER (C53 — named, not hidden):"
	@echo "  · the live LLM generator — no ANTHROPIC_API_KEY in env, so mock mode only."
	@echo "    The selftest forces mock by passing an empty env; nothing here proves the"
	@echo "    live path works. It is 194 lines behind the generator interface."
	@echo "  · the CAMPAIGNS under hunts/ — 'make hunts' runs each hunt's battery, which"
	@echo "    gates its instrument and its controls; it does not run a campaign, and a"
	@echo "    green battery says nothing about what a campaign found."
	@echo "  · the lift itself — run 'make drift' to compare against sin-mfg."
	@echo "  · instruments/sos runs on stdlib fractions only; no numeric solver is exercised."
	@echo "  · the generated page — 'make page' gates control.html; this runner does not"
	@echo "    rebuild it, so a stale control.html passes here and fails there."

hunts:
	@$(NODE) tools/run-hunt-batteries.js

control:
	@$(NODE) tools/build-control.js

page:
	@$(NODE) tools/test-control.js

drift:
	@$(NODE) tools/lift.js --check

lift:
	@$(NODE) tools/lift.js

new-hunt:
	@test -n "$(SLUG)" || { echo "usage: make new-hunt SLUG=<name>"; exit 1; }
	@test ! -d hunts/$(SLUG) || { echo "hunts/$(SLUG) already exists"; exit 1; }
	@mkdir -p hunts/$(SLUG)/experiments
	@cp machine/funnel/skeleton/target.js   hunts/$(SLUG)/target.js
	@cp machine/funnel/skeleton/program.md  hunts/$(SLUG)/program.md
	@echo "hunts/$(SLUG) created from the skeleton — fill the TODOs in target.js, then:"
	@echo "  node machine/funnel/funnel.js hunts/$(SLUG) --seed s1 --generator enum"

clean:
	@find hunts -name 'checkpoint-*.json' -delete 2>/dev/null; true
	@echo "checkpoints removed. experiments/*.jsonl, best.json and mute.json are RECORDS — never deleted here."
