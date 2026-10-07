# Licence of Janela's data

Everything under `corpus/janela/` (and under `corpus/janela/regions/<region>/`) is values read
from public sources, kept as read, with the sha256 of what was read. The code that read them
(`apps/janela/audit/`) is MIT, like the rest of this repository; the data keep their own terms:

- **ECMWF open data** — the forecasts in `ecmwf/`, `feed/` and the forecast side of
  `matchups.json.gz`. Copyright ECMWF, **CC BY 4.0** (https://creativecommons.org/licenses/by/4.0/);
  commercial use allowed; no endorsement by ECMWF is implied. What was changed: nothing but
  selection — the packed integers of each GRIB2 message at the model nodes around each site,
  with the message's packing constants, so every value is re-derived exactly.
- **NOAA/NESDIS RADS-built along-track altimetry** (coastwatch.noaa.gov) — `alt/`, `observed/` and
  the satellite side of `matchups.json.gz`. A work of the US government: **public domain**. RADS
  editing as applied by NOAA; the 1 Hz points within 150 km of each site kept as integers. NOAA
  rewrites every near-real-time file daily, so a file's sha256 pins the bytes as read, not a
  file anyone can download again; the points are what a re-check reads.
- **METAR of platform P-25 (SBLB)** via the Iowa Environmental Mesonet archive — `metar/`.
  Public.
- **ANP GeoMaps** (the production units, fields and the pre-salt polygon) live in `corpus/anp/`
  with their own pins (`PINS.json`): Brazilian federal open data (Decreto 8.777/2016, Política de
  Dados Abertos); attribution "ANP — Agência Nacional do Petróleo, Gás Natural e Biocombustíveis,
  GeoMaps ANP".

Attribution for any page or note built from these files: "Previsão ECMWF open data (CC BY 4.0) ·
altimetria NOAA RADS (domínio público)".
