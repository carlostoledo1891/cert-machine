SHELL := /bin/bash
PY    ?= python3
NODE  ?= node

.PHONY: help engine control test drift lift clean reports site

help:
	@echo "cert-machine — the conjecture engine"
	@echo ""
	@echo "  make engine   generate, screen, certify; writes ledger.json"
	@echo "  make control  rebuild index.html from the ledger (runs the batteries)"
	@echo "  make test     every battery: instruments, engine, funnel"
	@echo "  make site     assemble the public site bundle (site/)"
	@echo "  make drift    re-hash the lift against the source lab"
	@echo ""
	@echo "  LIMIT=800000 CERT_CAP=600 make engine   to run wider"

engine:
	@$(NODE) tools/run-engine.js $${LIMIT:-400000}
	@$(NODE) tools/export-keller-certificate.js
	@$(NODE) tools/export-strassen-certificate.js
	@$(NODE) tools/export-erdos852-certificate.js

control:
	@$(NODE) tools/build-control.js

site:
	@$(NODE) tools/build-site.js

test:
	@printf "%-30s " "engine + families"; $(NODE) tools/test-engine.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "funnel machine"; $(NODE) machine/funnel/selftest/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "detach"; $(NODE) machine/detach/selftest.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@for t in test-eqcert test-interval test-transcendental test-transcendental-enclosure; do \
	  printf "%-30s " "interval/$$t"; $(NODE) instruments/interval/tests/$$t.js >/dev/null 2>&1 && echo PASS || echo FAIL; done
	@printf "%-30s " "trigmin certifier"; $(NODE) instruments/trigmin/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "newman box sweep"; $(NODE) instruments/trigmin/sweep-battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "lambda sweep"; $(NODE) instruments/trigmin/lambda-battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "mercer mu5 ladder"; $(NODE) instruments/trigmin/mercer6-battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "henon census"; $(NODE) instruments/census/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "keller audit"; $(NODE) instruments/keller/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "cf audit"; $(NODE) instruments/cf/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "entropy covering"; $(NODE) instruments/entropy/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "strassen audit"; $(NODE) instruments/strassen/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "bigfloat layer"; $(NODE) instruments/bigfloat/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "erdos852 constants"; $(NODE) instruments/erdos852/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@for f in sos_verify lyapunov_cert reverify_ai_lyapunov; do \
	  printf "%-30s " "sos/$$f"; $(PY) instruments/sos/$$f.py >/dev/null 2>&1 && echo PASS || echo FAIL; done
	@printf "%-30s " "keller stdlib verifier"; $(PY) tools/verify_keller.py certs/keller-certificate.json --sources corpus/sources >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "strassen stdlib verifier"; $(PY) tools/verify_strassen.py certs/strassen-certificate.json --sources corpus/sources >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "erdos852 stdlib verifier"; $(PY) tools/verify_erdos852.py certs/erdos852-certificate.json --sources corpus/sources >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "llm harness (dry)"; $(PY) tools/llm-harness.py --dry-run --n 20 --ledger /dev/null >/dev/null 2>&1 && echo PASS || echo FAIL

drift:
	@$(NODE) tools/lift.js --check

lift:
	@$(NODE) tools/lift.js

clean:
	@rm -f index.html ledger.json

reports:
	@$(NODE) tools/build-report-impostors.js
	@$(NODE) tools/build-report-zeta3.js
	@$(NODE) tools/build-report-entropy.js
	@$(NODE) tools/build-report-erdos852.js
	@$(NODE) tools/build-report-rm-audit.js
	@$(NODE) tools/build-report-erdos290.js
	@$(NODE) tools/build-report-lemniscate.js
	@$(NODE) tools/build-report-mfg-congest.js
	@$(NODE) tools/build-report-wardrop.js
	@$(NODE) tools/build-report-alien-science.js
	@$(NODE) tools/build-report-eval.js
	@$(NODE) tools/build-report-mercer.js
