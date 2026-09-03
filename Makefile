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
	@# CERT_CAP defaults to 1600: below that, a default run silently regresses
	@# the chowla R6 exhaustion (all 1,579 screen survivors certified — terminal)
	@CERT_CAP=$${CERT_CAP:-1600} $(NODE) tools/run-engine.js $${LIMIT:-400000}
	@$(NODE) tools/export-keller-certificate.js
	@$(NODE) tools/export-strassen-certificate.js
	@$(NODE) tools/export-erdos852-certificate.js

control:
	@$(NODE) tools/build-control.js

site: control
	@$(NODE) tools/build-site.js
	@$(NODE) apps/skyaudit/build.js

test:
	@printf "%-30s " "engine + families"; $(NODE) tools/test-engine.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "funnel machine"; $(NODE) machine/funnel/selftest/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "detach"; $(NODE) machine/detach/selftest.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@for t in test-eqcert test-interval test-transcendental test-transcendental-enclosure; do \
	  printf "%-30s " "interval/$$t"; $(NODE) instruments/interval/tests/$$t.js >/dev/null 2>&1 && echo PASS || echo FAIL; done
	@printf "%-30s " "trigmin certifier"; $(NODE) instruments/trigmin/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "forecast instrument"; $(NODE) instruments/forecast/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "kissing ledger"; $(NODE) instruments/kissing/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "lemniscate (erdős 1038 inf)"; $(NODE) instruments/lemniscate/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "ember band (P3a audit)"; $(NODE) instruments/emberband/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "fueleu penalty"; $(NODE) instruments/fueleu/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "oracle claim library"; python3 oracle/battery.py >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "newman box sweep"; $(NODE) instruments/trigmin/sweep-battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "lambda4 campaign"; $(NODE) instruments/lambda4/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "lambda56 campaign"; $(NODE) instruments/lambda56/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "sublevel (tao 179)"; $(NODE) instruments/sublevel/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "lambda sweep"; $(NODE) instruments/trigmin/lambda-battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "mercer mu5 ladder"; $(NODE) instruments/trigmin/mercer6-battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "henon census"; $(NODE) instruments/census/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "keller audit"; $(NODE) instruments/keller/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "cf audit"; $(NODE) instruments/cf/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "entropy covering"; $(NODE) instruments/entropy/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "strassen audit"; $(NODE) instruments/strassen/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "bilinear certifier"; $(NODE) instruments/bilinear/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "slp additive circuits"; $(NODE) instruments/slp/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "bigfloat layer"; $(NODE) instruments/bigfloat/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "ivspecial (Γ + Bessel)"; $(NODE) instruments/ivspecial/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "hotspots (ember chain)"; $(NODE) instruments/hotspots/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "erdos852 constants"; $(NODE) instruments/erdos852/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "evtol energy"; $(NODE) instruments/evtol/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "mfg lab (box certifier)"; $(NODE) labs/mfg/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "mfg-cap census (EXACTLY-n)"; $(NODE) labs/mfg/census-battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "mfg2p lab (two populations)"; $(NODE) labs/mfg2p/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "design system + charts"; $(NODE) design/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "wiring"; $(NODE) tools/check-wiring.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "skyaudit app"; $(NODE) apps/skyaudit/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "glide band"; $(NODE) apps/glide-band/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "skyaudit stdlib verifier"; $(PY) apps/skyaudit/audit/verify_skyaudit.py >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "erdos290 lean fork"; $(NODE) tools/erdos290-lean-battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@for f in sos_verify lyapunov_cert reverify_ai_lyapunov; do \
	  printf "%-30s " "sos/$$f"; $(PY) instruments/sos/$$f.py >/dev/null 2>&1 && echo PASS || echo FAIL; done
	@printf "%-30s " "keller stdlib verifier"; $(PY) tools/verify_keller.py certs/keller-certificate.json --sources corpus/sources >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "strassen stdlib verifier"; $(PY) tools/verify_strassen.py certs/strassen-certificate.json --sources corpus/sources >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "erdos852 stdlib verifier"; $(PY) tools/verify_erdos852.py certs/erdos852-certificate.json --sources corpus/sources >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "tensorlb (lower-bound audit)"; $(PY) instruments/tensorlb/battery.py >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "mfgcap (terra re-cert)"; $(PY) instruments/mfgcap/battery.py >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "critcount (peak counts)"; $(NODE) instruments/critcount/battery.js >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "facelaw (face dimension)"; $(PY) instruments/facelaw/battery.py >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "attnflow (attention exact-Q)"; $(PY) instruments/attnflow/battery.py >/dev/null 2>&1 && echo PASS || echo FAIL
	@printf "%-30s " "llm harness (dry)"; $(PY) tools/llm-harness.py --dry-run --n 20 --ledger /dev/null >/dev/null 2>&1 && echo PASS || echo FAIL

drift:
	@$(NODE) tools/lift.js --check

lift:
	@$(NODE) tools/lift.js

clean:
	@rm -f index.html ledger.json

reports:
	@$(NODE) tools/build-report-lambda4.js
	@$(NODE) tools/build-report-erdos1038-sup.js
	@$(NODE) tools/build-report-tensorlb.js
	@$(NODE) tools/build-report-bilinear.js
	@$(NODE) tools/build-report-add55.js
	@$(NODE) tools/build-report-impostors.js
	@$(NODE) tools/build-report-zeta3.js
	@$(NODE) tools/build-report-entropy.js
	@$(NODE) tools/build-report-erdos852.js
	@$(NODE) tools/build-report-rm-audit.js
	@$(NODE) tools/build-report-erdos290.js
	@$(NODE) tools/build-report-lemniscate.js
	@$(NODE) tools/build-report-mfg-congest.js
	@$(NODE) tools/build-report-terra.js
	@$(NODE) tools/run-ember-band.js
	@$(NODE) tools/build-report-ember.js
	@$(NODE) tools/build-report-wardrop.js
	@$(NODE) tools/build-report-alien-science.js
	@$(NODE) tools/build-report-eval.js
	@$(NODE) tools/build-report-mercer.js
	@$(NODE) tools/build-report-methods.js
	@$(NODE) tools/build-report-alphaevolve.js
	@$(NODE) tools/build-report-kissing.js
	@$(NODE) tools/build-report-lemniscate-inf.js
	@$(NODE) tools/build-report-answer-key.js
	@$(NODE) tools/build-report-loop.js
	@$(NODE) tools/build-report-forecast-gym.js
	@$(NODE) tools/build-report-harbor-proof.js
	@$(NODE) tools/build-report-water-value.js
	@$(NODE) tools/build-report-mfg-cap.js
	@$(NODE) tools/build-report-mfg-lab.js
	@$(NODE) tools/build-report-mfg-observatory.js
	@$(NODE) tools/build-report-mfg2p.js
	@$(NODE) tools/build-report-evtol-energy.js
	@$(NODE) tools/build-report-skyaudit.js
	@$(NODE) tools/build-report-glide-band.js
	@$(NODE) tools/build-report-keller.js
	@$(NODE) tools/build-report-ai-claims.js
	@$(NODE) tools/build-report-claim.js
	@$(NODE) tools/build-report-erdos852h.js
