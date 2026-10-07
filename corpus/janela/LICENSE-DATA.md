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
- **ECMWF AIFS (data-driven) open data** — `aifs/`, `feed-aifs/` and the forecast side of
  `matchups-aifs.json.gz` (from the 2026-05-13 run). Copyright ECMWF, **CC BY 4.0**, as above;
  the same selection (packed integers at the model nodes around each site).
- **NOAA WAVEWATCH III (GFS-Wave, GEFS-Wave)** on AWS — `noaa/`, `feed-noaa/`, `matchups-noaa.json.gz`.
  A work of the US government: **public domain**.
- **PNBOIA — Programa Nacional de Boias** (Marinha do Brasil, Centro de Hidrografia da Marinha), the
  GOOS-Brasil public archive (www.goosbrasil.org, OPeNDAP) — `pnboia/`. Freely available; attribution
  "Dados PNBOIA / GOOS-Brasil — Marinha do Brasil (CHM)". Kept as the server prints them, with the
  sha256 of each response; the time axis read from the binary view (float32, a 90-minute quantum).
  `pnboia/ww3/` holds the Ifremer WAVEWATCH III hindcast (GLOBMULTI_ERA5_GLOBCUR_01, **CC BY-SA 4.0**,
  doi:10.12770/857a3337-f59a-481a-bf98-5561e8b61e7b) at the buoys' nearest nodes.
- **ANP GeoMaps** (the production units, fields and the pre-salt polygon) live in `corpus/anp/`
  with their own pins (`PINS.json`): Brazilian federal open data (Decreto 8.777/2016, Política de
  Dados Abertos); attribution "ANP — Agência Nacional do Petróleo, Gás Natural e Biocombustíveis,
  GeoMaps ANP".

Attribution for any page or note built from these files: "Previsão ECMWF open data (CC BY 4.0) ·
altimetria NOAA RADS (domínio público)".
