# janela-field — the Janela app's day, overwritten daily

today.json: every place's forecast steps, its bands rounded outward and every published decision, with the sha256 of the deciding modules and of every input record.
field.bin: the ECMWF forecast field over the Brazilian margin (JNF1; apps/janela/audit/field.py). ECMWF open data, CC BY 4.0.

Built by apps/janela/build-today.js on main 5f01c74f6133a0ce980411cf35496fbc1841564b; one commit, force-pushed, so main never grows by a day of app data.
Re-run: git checkout 5f01c74f6133a0ce980411cf35496fbc1841564b && python apps/janela/audit/field.py 2026-10-31 && python apps/janela/audit/noaa.py --units 2026-10-31 && node apps/janela/build-today.js --feed 20261031
