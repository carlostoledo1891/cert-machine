# Erdős #1 — the sharing plan (ported from frontier-apps SHARE.md, 2026-09-15; every send is the operator's)

Standing rule: nothing leaves the machine from the bench side. This file is the checklist; the
texts are `erdos1-forum-comment.md`, `erdos1-tadamcz-issue.md`, `erdos1-mastodon.md`.

ONE REPOSITORY (operator ruling, 2026-09-15 night: "Why a separate repo? Let's use the same").
The bench had prepared a second public repository (`experiments/erdos1/public/`, one commit,
never pushed); it is NOT used. Everything the texts point at lives in cert-machine:

- The page: https://carlostoledo.co/reports/erdos1.html — every number from the ledger, the
  certificates under 20 MB linked, the verifier linked, the paper linked.
- The repository: https://github.com/carlostoledo1891/cert-machine — `certs/erdos1/` (the
  twelve certificates; the two 2,197-dimensional ones gzipped at 46 MB), `certs/erdos1-ledger.json`,
  `instruments/erdos1/` (the instrument, the verifier, the battery), `tools/verify_erdos1.py`,
  `paper/erdos1-explicit.pdf` and `paper/erdos1-explicit.md`.
- The verifier for a reader: https://carlostoledo.co/verify/verify_erdos1.py (needs python-flint).

## Route (ruled 2026-09-15): push first, then the Erdős forum, then the issue, then Mastodon. No email.

### 0. Gates before anything leaves

1. `node tools/run-erdos1-ledger.js` lists `cert-b13-s3-a11_20.json.gz  verified k: [36]` — MET
   2026-09-16 01:12 (2 h 28 min of shared CPU). Every text quotes the 79,092-element set at
   0.145269, and the texts quote nothing this machine has not verified.
2. Then `node tools/build-report-erdos1.js && python3 instruments/erdos1/certnumbers.py &&
   node tools/build-paper-tex.js erdos1-explicit`, the three Chrome gates with `--accept` for the
   changed page, `make control` (88/88) and `make site`.
3. Push main. DONE 2026-09-16 01:49 (3b182f4..b0c5f04); the page was live ten seconds later and the
   verifier, the ledger, a certificate, the 16 MB gzipped d = 1331 certificate, the paper PDF and
   the theorem note all answer 200.
4. Re-read the four comments on erdosproblems.com/1. DONE 2026-09-16 01:50: the live thread is
   byte-identical to the pinned 2026-09-15 copy except the access date — no explicit set posted.
   tadamcz/erdos1: HEAD still 0e395153 (2026-09-06), one issue (a dependabot bump), all eight
   cited lemma names present in the resolution file.

### 1. The forum comment — `erdos1-forum-comment.md` — POSTED 2026-09-16 ~11:25 -03, IN MODERATION (sweep watches it)
   Reviewed against the five forum rules on 2026-09-16 (pinned: corpus/sources/erdos1/erdosproblems-forum-rules_2026-09-16.txt);
   the rule-by-rule notes are at the foot of the file. Rule 1's disclosure is in the text; rules 1, 2 and 4 are
   YOURS to satisfy by having read the two half-pages the notes name before you post.
### 2. The issue on tadamcz/erdos1 — POSTED 2026-09-16 11:40 -03: https://github.com/tadamcz/erdos1/issues/2 (gh, the operator's account, on the operator's word)
### 3. Mathstodon — `erdos1-mastodon.md` (under 500 characters; the page carries the link preview) — AFTER the
   forum comment is shown and has had a few days: the site's advice page says not to announce on social media
   before community assessment, and the September blog thread says priority from AI-heavy work counts for little.

### 4. Later, not now

Zenodo: DONE ON THE OPERATOR'S WORD 2026-09-16 13:31 -03 — release v2026.09.3 cut on GitHub
(https://github.com/carlostoledo1891/cert-machine/releases/tag/v2026.09.3) with .zenodo.json at
v2026.09.3 and the Erdős #1 front in its description. Zenodo's API answered 504 for the twenty minutes
after, so the versioned DOI was not yet read from the public record; when it is,
`python3 tools/stamp-release.py v2026.09.3 <doi> 2026-09-16` writes it into corpus/zenodo.json and
CITATION.cff (check-wiring gates the pair), then commit and push. Until then cite the concept DOI
10.5281/zenodo.22225860, which resolves to the latest version. arXiv (math.NT, cross-list math.CO) when
endorsed. OEIS A276661 comment. Lean Zulip (formalising one certificate: every step is a finite
exact computation, and the Lean lemmas `chainMatrix_saturated`, `exists_binary_block_set`,
`composeMatrix_admissible` already exist). Hacker News only after 1–3 exist.

## Checks

- 2026-09-15 (bench): the bench's standalone bundle tested in a fresh venv (python-flint 0.9):
  verify.py on two certificates → ALL CHECKS PASSED. That bundle is superseded by this repository.
- 2026-09-15 (here): all eight bench certificates re-verified from the files alone
  (`certs/erdos1/verify-*.log`; the last of them, the tilted d = 2197, ended green at 01:12 on
  2026-09-16), four new certificates built (d = 81 k = 21, d = 441, d = 961 verified; d = 3375
  built at 00:08 and verifying), battery 13 checks and 6 red controls, control page 88/88.
