# C0 — the claimant's certificate on stock FLINT (2026-11-10)

Rules: PREREG-PG186-A2-C0.md (seal 10). This is a replay of the claimant's program, never a decision of the integrals.

**C0a RAISES. C0: REFUSED (environment).** The certificate's own startup regression (`check_flint_signed_fft`, lines
520–528, transcribed verbatim, checked identical by `diff`) fails on the stock `python-flint==0.9.0` wheel from PyPI
(bundled FLINT 3.6.0; Python 3.12.13; macOS 27.0, arm64): "FLINT failed its signed-FFT regression". The certificate
therefore cannot run on the stack the README names without a FLINT build that the release does not contain. C0b was
not run. 0.9.0 is the newest wheel on PyPI, so the rule's "one more attempt with the newest wheel" has nothing to try.

**The prediction** (C0a raises on stock 0.9.0, 60%): met.

## What the regression catches (diagnostic, not pre-registered)

It is a real wrong answer of the library, checked here against Python integers: for the two 16-term integer
polynomials with every coefficient 2^509 − 1 and every coefficient −(2^510 − 1), `fmpz_poly.__mul__` and `mul_low(·, 16)`
both return a wrong coefficient 15 (the middle one, −16·(2^509 − 1)(2^510 − 1), 1,023 bits); the other 30 are right.
The same product with both signs positive is right, and the signed product is right at 64, 128, 256, 400 and 480 bits
and wrong at 509. The older stock wheel, python-flint 0.8.0 (FLINT 3.3.1), fails the same regression.

## Gaps

- One machine and one platform (macOS arm64). Whether the Linux x86-64 wheels carry the defect is NOT known; a pod can
  say in a minute.
- FLINT's tracker was searched twice by keyword and no matching report was found; that is not a proof that none exists.
- Which FLINT code path is wrong was not investigated. The claimant's corrected build is not published, so its
  correction cannot be compared with anything.
- Nothing here bears on whether the 152 integral bounds hold.

## Why it matters to the claim

The numerical axiom rests on a program that, by its authors' own check, gives wrong integer products on the released
versions of its arithmetic library. They guard against it at startup, which is the right behaviour; the consequence is
that nobody outside can replay the certificate from the release as published.

## Addendum (2026-11-10, after phase B; the verdict above is unchanged)

- **Linux x86-64**: C0a raises there too, on python-flint 0.9.0 (FLINT 3.6.0) and 0.8.0 (FLINT 3.3.1) — phase B, B8.
- **The cause is known and fixed upstream, in no release.** `fmpz_poly_mul_SS` reads a negative coefficient whose
  top limb is exactly `0x8000000000000000` as non-negative (`_fmpz_vec_set_fft_coeff`, `src/fmpz_vec/set_fft.c`);
  fixed by FLINT's maintainer in `7ad753d5` (flintlib/flint#2790, merged 2026-08-11). The newest release, 3.6.0, is
  88 commits before it. Two of the gaps above are thereby closed: the tracker search missed it because the fix came
  as a pull request by the maintainer, not as an issue; and the code path is now named. `reveal/flint/` has the C and
  Python witnesses and the exploration.
- **CORRECTION of the last sentence above.** "Nobody outside can replay the certificate from the release as
  published" is too strong. The claimant's "custom FLINT 3.6.0 build with corrected signed polynomial convolution" is
  3.6.0 with this fix — the numerics note says so itself (its reference [5] is commit `7ad753d5`, pull request
  2790; I missed it in phase A and in C0, where I wrote "the corrected build is not published") — so anyone who builds FLINT from its main branch at or after `7ad753d5` should pass
  the startup check. What stands: the certificate cannot run on any RELEASED FLINT or python-flint wheel, and the
  README names no revision. Building FLINT main was not done here (the session declined building fetched code).
