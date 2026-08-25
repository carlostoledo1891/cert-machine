SHELL := /bin/bash
PY    ?= python3
NODE  ?= node

.PHONY: help engine control test drift lift clean

help:
	@echo "cert-machine — the conjecture engine"
	@echo ""
	@echo "  make engine   generate, screen, certify; writes ledger.json"
	@echo "  make control  rebuild index.html from the ledger (runs the batteries)"
	@echo "  make test     every battery: instruments, engine, funnel"
	@echo "  make drift    re-hash the lift against the source lab"
	@echo ""
	@echo "  LIMIT=800000 CERT_CAP=600 make engine   to run wider"

engine:
	@$(NODE) tools/run-engine.js $${LIMIT:-400000}

control:
	@$(NODE) tools/build-control.js

test:
	@printf "%-30s " "engine + families"; $(NODE) tools/test-engine.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "funnel machine"; $(NODE) machine/funnel/selftest/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "detach"; $(NODE) machine/detach/selftest.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@for t in test-eqcert test-interval test-transcendental test-transcendental-enclosure; do \
	  printf "%-30s " "interval/$$t"; $(NODE) instruments/interval/tests/$$t.js >/dev/null 2>&1 && echo PASS || echo FAIL; done
	@printf "%-30s " "trigmin certifier"; $(NODE) instruments/trigmin/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "henon census"; $(NODE) instruments/census/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@for f in sos_verify lyapunov_cert reverify_ai_lyapunov; do \
	  printf "%-30s " "sos/$$f"; $(PY) instruments/sos/$$f.py >/dev/null 2>&1 && echo PASS || echo FAIL; done
	@printf "%-30s " "llm harness (dry)"; $(PY) tools/llm-harness.py --dry-run --n 20 --ledger /dev/null >/dev/null 2>&1 && echo PASS || echo FAIL

drift:
	@$(NODE) tools/lift.js --check

lift:
	@$(NODE) tools/lift.js

clean:
	@rm -f index.html ledger.json
