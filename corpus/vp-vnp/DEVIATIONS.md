# Deviations from the pre-registration

D0 (2026-11-23 23:58 UTC, before any run). The first seal (superseded/SEAL-0a, stamped 23:57 UTC) covered a
PREREG.md that gave its own writing time as "2026-11-24 around 00:05 UTC" and briefs dated 2026-11-24: ahead of the
clock. The three texts were corrected to the real time and date (nothing else changed; compare superseded/*-0a.md)
and sealed again as SEAL-0. Both stamps are kept.

D1 (2026-11-24 00:18 UTC, check script, no result changed). Row K0's count of sorry warnings searched for
"declaration uses 'sorry'" with straight quotes; Lean 4.33.1 prints the word in backticks, so the count read 0. The
log itself (K0.out lines 63–67) holds exactly five, all in Challenge.lean at lines 17, 20, 23, 26, 29 — the five
theorems the README says are stated without proof. The pattern in tools/runpod-vp-vnp-p1.sh is now "declaration uses".

D2 (2026-11-24 00:44 UTC, the census script, no result changed). Row CEN's first run (inside the phase-1 script, 00:34
UTC) stopped on errors in instruments/vp-vnp/census/Census.lean: ConstantInfo.getUsedConstants does not exist in Lean
v4.33.1, and three counters were typed as messages. A first repair walked only the declarations' types and reached 2,824
constants — wrong, and not recorded as a result. The script now walks the bodies of theorems, definitions and opaque
constants and the parts of inductive types explicitly; it was run by hand on the same pod (CEN2.out, 62,499 constants,
close to the 60,921 declarations of the kernel export). The script's hash is in CEN2-file.sha256.

D3 (2026-11-24 01:02 UTC, an author outside its workspace, no result changed). The anchors' author saved a backup of
its workspace's lakefile to /tmp on the pod, as root, at about 00:24 UTC, which its brief forbids; nothing read it and
it deleted the file at 00:44 UTC (its WORKLOG). The control room's replay used only the workspace's own files.

D4 (2026-11-24 02:41 UTC, what the seals prove, no result changed). The page said the rows were "timestamped in Bitcoin
before any of them ran". The stamps were submitted before the runs they concern (SEAL-0 at 23:57:19 UTC on 23 Nov,
SEAL-1B at 00:03, SEAL-1A at 00:12 on 24 Nov), but a stamp proves a date only from the Bitcoin block that confirms it:
block 977295 (00:19:22 UTC) for SEAL-0 and SEAL-1B, block 977301 (01:10:46 UTC) for SEAL-1A. Phase 1 began on the pod at
00:03:24 UTC; rows PIN and K0 had finished by 00:15:02 and K1 was running at 00:19 (runs/p1/_phase.log). So the chain
shows that the rows and the verdict rule existed before every result except PIN and K0 and before the verdict
(01:14 UTC), and that writer B's blind statement existed before the time our log gives for its first elaboration
(00:22 UTC). It does not show that the rule preceded PIN and K0, nor that writer A's blind statement preceded its first
elaboration (00:22 UTC) or its bridge (00:42 to 00:48 UTC): for those the evidence is this lane's own log and its
commits (pre-registration df92c754 at 00:04:53 UTC, blind statements 0e001d38 at 00:13:29 UTC; a commit's time is its
author's to set). Found by the control room when the block heights were read; the page's sentence now says this.
