# The data in this directory is not ours

## `Pontius.dat` — NIST Statistical Reference Datasets

A load cell calibration by P. Pontius at the National Institute of Standards and
Technology: 40 observations, 20 loads each applied twice, deflection recorded.
Carried here **byte for byte** as NIST publishes it, header and certified values
included, because the header is part of the evidence — it is where the certified
quadratic and its residual standard deviation come from.

**Terms.** Works of the United States Government are not subject to copyright
protection in the United States (17 U.S.C. §105), and NIST publishes the StRD
collection for exactly this purpose: so that people can check whether their
least-squares software is correct. Nothing here is restricted, and nothing here
was resampled, cleaned or corrected.

**Read the header before quoting the numbers.** NIST certifies the regression
coefficients *as arithmetic*, to fifteen digits. That is a statement about a
computation, not a claim that a quadratic is the right model for a load cell —
and this page is about exactly that difference.

Source: <https://www.itl.nist.gov/div898/strd/lls/data/Pontius.shtml>

## The IL-6 standard curve

Eight numbers — seven standards and a blank — from a published example standard
curve for a rat IL-6 sandwich ELISA (Abbexa abx155737), absorbance at 450 nm as
printed. They are transcribed in `../data.js` rather than carried as a file,
because eight absorbances read off a datasheet are a citation, not a dataset.

**The code in this repository is MIT. Neither of these is code.**
