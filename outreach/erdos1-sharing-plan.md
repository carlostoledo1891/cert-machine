# Erdős #1 — the sharing plan (ported from frontier-apps SHARE.md, 2026-09-15; every send is the operator's)

Standing rule: nothing leaves the machine from the bench side. This file is the checklist; the
texts are `erdos1-forum-comment.md`, `erdos1-tadamcz-issue.md`, `erdos1-mastodon.md`.

## What exists, and where

- The page: `reports/erdos1.html` → https://carlostoledo.co/reports/erdos1.html after a push.
- The paper: `paper/erdos1-explicit.pdf` (v0.2, house preamble, numbers interpolated from the
  ledger by `instruments/erdos1/certnumbers.py`); the theorem note `paper/erdos1-explicit.md`.
- The ledger: `certs/erdos1-ledger.json`; the certificates `certs/erdos1/cert-*.json[.gz]`
  (the two 2,197-dimensional ones are 46 MB gzipped); the verifier `tools/verify_erdos1.py`
  (needs python-flint), also served at /verify/.
- The public repository prepared on the bench: `~/Projects/frontier-apps/experiments/erdos1/public/`
  (one commit e7a5c8a, 44 files, certificates gzipped, tested standalone in a fresh venv). It
  holds the bench's v0.1 paper and only the eight bench certificates. BEFORE PUSHING IT, rebuild
  it from here so it carries the twelve certificates and the v0.2 paper — or point the outreach at
  this repository (github.com/carlostoledo1891/cert-machine, `certs/erdos1/` + `instruments/erdos1/`)
  and skip the second repository altogether. The second option is one link and no new name;
  the first gives a Zenodo-able release with its own DOI. Operator's call.

## Route (ruled 2026-09-15): GitHub first, then the Erdős forum, then the issue, then Mastodon. No email.

### 0. Gates before anything leaves

1. `node tools/run-erdos1-ledger.js` lists `cert-b13-s3-a11_20.json.gz  verified k: [36]` (about two
   hours on the M2; started 2026-09-15 22:44). Every text quotes the 79,092-element set.
2. `make control` green with `erdos1 (the explicit sets)` among the batteries.
3. Re-read the four comments on erdosproblems.com/1 (state of 2026-09-15 pinned in the corpus:
   no explicit set posted). If one appeared, drop "the first" everywhere.
4. Replace REPO_URL in the three texts.

### 1. GitHub

Option A (separate repository, as prepared on the bench):

```sh
cd ~/Projects/frontier-apps/experiments/erdos1/public      # rebuild first: see above
gh repo create carlostoledo1891/erdos1-explicit --public --source=. --push \
   --description "Explicit sum-distinct sets below Bohman's constant: the Erdős #1 disproof made effective (certificates + verifier)"
gh release create v0.2 --title "v0.2 — explicit sets below Bohman, twelve certificates" --notes-file RELEASE.md
```

Option B: push cert-machine (main) and use https://github.com/carlostoledo1891/cert-machine/tree/main/certs/erdos1
as REPO_URL. The paper footnote in `paper/tex/erdos1-explicit.tex` (the shared `\cmauthor` block)
names no repository; `\cmrepro` names the paths in this one.

### 2. The forum comment — `erdos1-forum-comment.md`
### 3. The issue on tadamcz/erdos1 — `erdos1-tadamcz-issue.md` (`gh issue create` can post it on request)
### 4. Mathstodon — `erdos1-mastodon.md`

### 5. Later, not now

Zenodo via the GitHub integration (a release → a DOI in minutes; add it to the paper's date line);
arXiv (math.NT, cross-list math.CO) when endorsed; OEIS A276661 comment; Lean Zulip (formalising
one certificate: every step is a finite exact computation, and the Lean lemmas
`chainMatrix_saturated`, `exists_binary_block_set`, `composeMatrix_admissible` already exist);
Hacker News only after 1–4 exist.

## Checks

- 2026-09-15 (bench): `public/` tested standalone in a fresh venv (python-flint 0.9): verify.py on
  two certificates → ALL CHECKS PASSED; siegel.py runs.
- 2026-09-15 (here): all eight bench certificates re-verified from the files alone
  (`certs/erdos1/verify-*.log`; the two 2,197-dimensional runs take ~2 h each and were still
  running at the handoff — the ledger says which), four new certificates built and verified
  (d = 81 k = 21; d = 441; d = 961; d = 3375 pending), battery 13 checks and 6 red controls.
