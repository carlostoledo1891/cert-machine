# janela-field — the Janela app's day, overwritten daily

today.json: every place's forecast steps, its bands rounded outward and every published decision, with the sha256 of the deciding modules and of every input record.
field.bin: the ECMWF forecast field over the Brazilian margin (JNF1; apps/janela/audit/field.py). ECMWF open data, CC BY 4.0.

Built by apps/janela/build-today.js on main bd59f813fab63064c02a6888cead69b8af2fb49b; one commit, force-pushed, so main never grows by a day of app data.
Re-run: git checkout bd59f813fab63064c02a6888cead69b8af2fb49b && python apps/janela/audit/field.py 2026-11-07 && python apps/janela/audit/noaa.py --units 2026-11-07 && node apps/janela/build-today.js --feed 20261107
