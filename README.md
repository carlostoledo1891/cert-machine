# swell-field — the Swell app's day, overwritten daily

today.json: the open sea at Florianópolis' edge every 3 h (its measured band, NOAA's partitions), ECMWF's wind over the island, Copernicus' sea level and water temperature, and the digest of every beach's breaking height and decided letter, with the sha256 of the modules and every input record.
ECMWF open data CC BY 4.0; NOAA public domain; Generated using E.U. Copernicus Marine Service Information (doi:10.48670/moi-00016).

Built by apps/swell/build-day.js on main 4d0fdde48ac9810b091bcd62ee0be0af28bbd949; one commit, force-pushed, so main never grows by a day of app data.
Re-run: git checkout 4d0fdde48ac9810b091bcd62ee0be0af28bbd949 && node apps/swell/build-day.js --feed 20261029
