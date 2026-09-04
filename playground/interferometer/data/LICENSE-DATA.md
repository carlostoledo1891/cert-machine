# The data in this directory is not ours

24 CSV files, 7.2 MB, **byte-for-byte as released** by the Event Horizon
Telescope Collaboration — public data release **2024-D01-01**, M87 April 2018,
calibrated Stokes I. Three nights (April 21, 22, 25) × four bands × two
independent calibration pipelines (CASA and HOPS).

Nothing here was resampled, averaged, cleaned or corrected. The loader
(`../vis.js`) reads them as they are; every filter this project applies —
the baseline cut, the pipeline choice, the night — is a stated option, applied
at read time, and printed on the page.

## Terms

The code in this repository is MIT. **These files are not, and MIT does not
apply to them.** They are redistributed here under the EHT Collaboration's own
release terms, which require citation of the release and the associated
publications. Consult the release page for the authoritative terms — they
govern, not this file:

  https://eventhorizontelescope.org/for-astronomers/data

If you use these data for anything, cite the EHT Collaboration's M87 2018
release rather than this repository. This project is a reader of the data and
claims nothing about it beyond what it computes and shows.

## Why they are here at all

Because a page about what data do and do not determine is worthless if you
cannot re-run it against the data. Every number on the interferometer page comes
out of these files by a script in this folder, on one laptop, with no network.
Deleting this directory does not break the page — the page ships its own
records — but it does break the only thing that makes the page checkable.
