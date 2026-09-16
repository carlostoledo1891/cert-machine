# d = 3375 (α = 3/5, b = 15, s = 3): the certificate and its verification

Built 2026-09-16 00:08 (PARI Hermite 20 min at r = 3374, then build.py; three instances k = 32, 34, 36; 384 MB raw).
verify.py --k 36 ran from 00:08 and ended green at ~14:20 (verify-b15-s3-a3_5.log; the k = 32 and 34 blocks read
"skipped" and are unverified). Gzipped, the three-instance file is 164 MB — over GitHub's 100 MB per-file limit —
so it stays out of git as certs/erdos1/wip-cert-b15-s3-a3_5.json.gz (gitignored). wip-cert-b15-s3-a3_5-k36.json.gz
is the same certificate with only the k = 36 instance (H, K, detA identical); verify-b15-s3-a3_5-k36.log is a copy
of the log. TO LEDGER IT: `git mv`-free — rename wip-cert-b15-s3-a3_5-k36.json.gz to cert-b15-s3-a3_5-k36.json.gz
(the runner scans cert-* names), then the rebuild chain (ledger, page, macros, paper, the three Chrome gates with
--accept, make control, make site), then commit. report.py was not run on it: the sorted-set listing would be
121,500 integers of ~36,000 digits, about 4 GB of text.
