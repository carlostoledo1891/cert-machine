#!/usr/bin/env python3
"""extract-harbor-proof.py — the HarborProof data extraction: the official
EU-MRV public emission report (THETIS-MRV, EMSA) to a pinned JSON record.

Source: corpus/sources/mrv2025-v45.xlsx — the "2025 Full ERs" sheet of the
publication generated 28-08-2026 05:42 (reporting period 2025, version 45),
downloaded from
  https://mrv.emsa.europa.eu/api/public-emission-report/reporting-period-document/binary/2025/45

Discipline: stdlib only (zipfile + ElementTree); every numeric cell is kept
as the exact decimal STRING the registry printed — conversion to exact
rationals happens in the instrument, never here; rows sorted by IMO for a
deterministic byte-stable output; the output records the source sha256 so
the report build can refuse on drift.

usage: python3 tools/extract-harbor-proof.py
writes: corpus/harbor-proof-2025.json
"""
import hashlib
import io
import json
import os
import zipfile
from xml.etree import ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "corpus", "sources", "mrv2025-v45.xlsx")
OUT = os.path.join(ROOT, "corpus", "harbor-proof-2025.json")
A = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"

# column index -> field name (header row verified in FIELDS_EXPECT below)
COLS = {
    0: "imo", 1: "name", 2: "type", 23: "fuel_t",
    28: "co2_t", 29: "co2_intra_t", 30: "co2_out_t", 31: "co2_in_t",
    32: "co2_berth_t", 33: "co2_ports_t",
    58: "co2eq_t", 59: "co2eq_intra_t", 60: "co2eq_out_t", 61: "co2eq_in_t",
    62: "co2eq_berth_t", 63: "co2eq_ports_t",
    70: "hours_at_sea",
}
FIELDS_EXPECT = {
    0: "IMO Number", 1: "Name", 2: "Ship type",
    23: "Total fuel consumption [m tonnes]",
    28: "Total CO₂ emissions [m tonnes]",
    58: "Total CO₂eq emissions [m tonnes]",
    70: "Time spent at sea [hours]",
}


def cellval(c):
    if c.get("t") == "inlineStr":
        for tt in c.iter(A + "t"):
            return tt.text or ""
        return ""
    v = c.find(A + "v")
    return v.text if v is not None and v.text is not None else ""


def main():
    sha = hashlib.sha256(open(SRC, "rb").read()).hexdigest()
    z = zipfile.ZipFile(SRC)
    ships, header = [], None
    for _, el in ET.iterparse(io.BytesIO(z.read("xl/worksheets/sheet1.xml"))):
        if el.tag != A + "row":
            continue
        vals = [cellval(c) for c in el]
        el.clear()
        if header is None:
            if vals and vals[0] == "IMO Number":
                header = vals
                for i, want in FIELDS_EXPECT.items():
                    got = header[i]
                    assert got == want, f"column {i} moved: {got!r} != {want!r}"
            continue
        if not vals or not vals[0].strip():
            continue
        row = {}
        for i, k in COLS.items():
            row[k] = vals[i].strip() if i < len(vals) else ""
        ships.append(row)
    assert header is not None, "header row not found — the sheet layout moved"
    ships.sort(key=lambda r: r["imo"])
    rec = {
        "what": "EU MRV public emission report, reporting period 2025 (Full ERs sheet) — "
                "the FIRST FuelEU Maritime live compliance year",
        "source": {
            "url": "https://mrv.emsa.europa.eu/api/public-emission-report/reporting-period-document/binary/2025/45",
            "file": "corpus/sources/mrv2025-v45.xlsx",
            "sha256": sha,
            "version": 45,
            "generated": "28-08-2026 05:42:08 (per the THETIS downloadable-files listing)",
        },
        "note": "every numeric field is the exact decimal string the registry printed; "
                "rationalization happens in instruments/fueleu, never here",
        "ships": ships,
    }
    with open(OUT, "w") as f:
        json.dump(rec, f, indent=1, sort_keys=True)
        f.write("\n")
    print(f"{len(ships)} ships -> {OUT}")
    print(f"source sha256 {sha}")


if __name__ == "__main__":
    main()
