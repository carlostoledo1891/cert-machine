# swell-field — the Swell app's day, overwritten daily

today.json: the open sea at Florianópolis' edge every 3 h (its measured band, NOAA's partitions), ECMWF's wind over the island, Copernicus' sea level and water temperature, and the digest of every beach's breaking height and decided letter, with the sha256 of the modules and every input record.
ECMWF open data CC BY 4.0; NOAA public domain; Generated using E.U. Copernicus Marine Service Information (doi:10.48670/moi-00016).

Built by apps/swell/build-day.js on main a85e80ef26e22bb56e2ee53d1f1fc77c378e5e15; one commit, force-pushed, so main never grows by a day of app data.
Re-run: git checkout a85e80ef26e22bb56e2ee53d1f1fc77c378e5e15 && node apps/swell/build-day.js --feed 20261017
