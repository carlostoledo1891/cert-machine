# Deviations from the pre-registration

D0 (2026-11-23 23:58 UTC, before any run). The first seal (superseded/SEAL-0a, stamped 23:57 UTC) covered a
PREREG.md that gave its own writing time as "2026-11-24 around 00:05 UTC" and briefs dated 2026-11-24: ahead of the
clock. The three texts were corrected to the real time and date (nothing else changed; compare superseded/*-0a.md)
and sealed again as SEAL-0. Both stamps are kept.

D1 (2026-11-24 00:18 UTC, check script, no result changed). Row K0's count of sorry warnings searched for
"declaration uses 'sorry'" with straight quotes; Lean 4.33.1 prints the word in backticks, so the count read 0. The
log itself (K0.out lines 63–67) holds exactly five, all in Challenge.lean at lines 17, 20, 23, 26, 29 — the five
theorems the README says are stated without proof. The pattern in tools/runpod-vp-vnp-p1.sh is now "declaration uses".
