# janela-field — the Janela app's day, overwritten daily

today.json: every place's forecast steps, its bands rounded outward and every published decision, with the sha256 of the deciding modules and of every input record.
field.bin: the ECMWF forecast field over the Brazilian margin (JNF1; apps/janela/audit/field.py). ECMWF open data, CC BY 4.0.

Built by apps/janela/build-today.js on main 21bb012e843eeb44ad17612cebde1c48ac506f7d; one commit, force-pushed, so main never grows by a day of app data.
Re-run: git checkout 21bb012e843eeb44ad17612cebde1c48ac506f7d && python apps/janela/audit/field.py 2026-10-24 && python apps/janela/audit/noaa.py --units 2026-10-24 && node apps/janela/build-today.js --feed 20261024
