# janela-field — the Janela app's day, overwritten daily

today.json: every place's forecast steps, its bands rounded outward and every published decision, with the sha256 of the deciding modules and of every input record.
field.bin: the ECMWF forecast field over the Brazilian margin (JNF1; apps/janela/audit/field.py). ECMWF open data, CC BY 4.0.

Built by apps/janela/build-today.js on main 088fdcd42aad3c92ccbd3649099e137e8b6bfdca; one commit, force-pushed, so main never grows by a day of app data.
Re-run: git checkout 088fdcd42aad3c92ccbd3649099e137e8b6bfdca && python apps/janela/audit/field.py 2026-10-10 && python apps/janela/audit/noaa.py --units 2026-10-10 && node apps/janela/build-today.js --feed 20261010
