# Verify Seal — design note (2026-11-03, branch verify-seal, not deployed)

The operator's brief, after Tao's Math 2.0 talk: researchers hide directions for fear a draft pasted into a frontier model
is published first. A seal proves possession of exact bytes by a date and reveals nothing until opened.

## Commitment

`digest = SHA256("verify-seal-v1\n" || salt32 || SHA256(archive))`, archive = the deterministic tar (instruments/seal/README.md).
Versioned by the prefix: a change to the archive rules or the hash is `verify-seal-v2`, and `open` refuses a version it
does not read. The salt is drawn with `secrets.token_bytes(32)` and stored as exactly 64 lowercase hex characters; the
component hashes (`archive_sha256`, `salt_sha256`) in seal.json let `open` name which input differs on a REFUTED — they
reveal nothing (a hash of 32 random bytes, a hash of an archive nobody has). One line of shell re-derives the digest.

## Anchors

Two, independent, neither ours to move: OpenTimestamps (Bitcoin; `ots verify` read by `open` when the client is present;
pending until `ots upgrade`) and the registry commit in this repository (a git commit date; read from a clone). The
registry's date is as strong as GitHub's record of the push: a maintainer could backdate a commit locally, which is why
the registry is the SECOND anchor and the page says so. `open` never fakes a confirmation: no client, no clone, no
upgrade → REFUSED with the step that would decide it.

## Threat model

- **Guessing short statements.** A one-line theorem can be guessed and hashed by an adversary who already suspects it;
  the salt defeats that (the digest is of salt || hash, and the salt never leaves the machine until the reveal). Without
  the salt the digest is a rainbow-table target; with it there is nothing to invert. Seal the whole draft anyway: the
  reveal is all-or-nothing in v1 (Phase 2 below).
- **Lost salt.** An unopenable seal: the digest proves nothing to anyone, including its owner. The bundle keeps the salt
  beside the archive; the owner's backup is the owner's problem, and the page says "a lost salt is an unopenable seal".
- **Backdating.** The `created_at` in seal.json is a local claim and is labelled so in every output; the only dates a
  verdict uses are the anchors'. A claim `--by D` earlier than every confirmed anchor is REFUSED, never certified.
- **Non-deterministic archives.** mtimes, modes, owners, name order, Unicode normalisation and separators are fixed;
  symlinks refuse; directories are not entries (an empty folder is not sealed — stated). The battery re-archives the
  same contents written another way under another locale and time zone and requires the same bytes. Another OS is not
  run here; the rules leave nothing OS-dependent, and an outside run on Linux/Windows is the open check.
- **What it does not prove.** Priority of an idea, correctness, credit; nor that the bytes were the owner's.

## Battery (certs/seal-battery.json)

12 planted forgeries, 0 certified (a byte flipped → REFUTED; wrong salt → REFUTED; truncated salt, newline salt, missing
salt/archive/seal.json, edited version → REFUSED; a file added / removed / renamed → REFUTED; the recorded digest edited
→ REFUTED). 23 cases in all: the honest anchored seal CERTIFIED with the anchor's date; the date rule (an anchor after the
claimed date → REFUSED); no anchor / an unread registry / an unconfirmable .ots / a commit without the digest → REFUSED;
determinism → CERTIFIED with equal archive bytes; the shell one-liner equal to the Python digest; a symlink refuses to
seal. 3 red controls on a deliberately broken opener (certifies a mismatch; ignores the date; tolerates a newline after
the salt). The newline case caught a real bug on the first run: `re.match` with `$` lets a trailing newline through;
now `fullmatch`.

## Phase 2 — selective reveal (recommendation: build a small v2, not now)

Format: a manifest `{"version": "verify-seal-v2", "files": [{"path": p, "salt": s_i (hex), "sha256": h_i}]}` where
h_i = SHA256("verify-seal-v2-file\n" || s_i || SHA256(bytes_i)); the manifest itself is sealed as in v1 (one digest,
one anchor set). Opening one file = revealing (path, s_i, bytes_i) plus the manifest; the verifier recomputes h_i,
checks it is in the manifest, and the manifest's own seal. Cost: one salt per file (the owner keeps the manifest, so no
new key management), ~60 lines on top of v1, and the verdict vocabulary extends to "this file CERTIFIED under a sealed
manifest; the others unrevealed". Benefit: the theorem statement can be shown while the notes stay sealed — the actual
use case the brief names. Risk: paths leak structure (file names in the manifest are revealed with it); mitigate by
sealing the manifest with per-file salted path hashes, or by letting the owner name files by index. Recommend building
after the v1 page is reviewed, as `verify-seal-v2` with its own battery row (a revealed file whose bytes differ → REFUTED;
a revealed file absent from the manifest → REFUTED; a manifest whose seal fails → REFUSED).

### Phase 2, built 2026-11-05 (the operator's word: "manifest v2 + first use on claimbox")

Built in instruments/seal/seal.py as `seal2` / `reveal` / `verify` (and `open` reads a v2 bundle whole). ONE DEVIATION from
the format above, on the path-leak risk it names: the salts are NOT in the manifest. The manifest holds per file only an
index, `q_i = SHA256("verify-seal-v2-path\n" || s_i || path_i)` and `h_i = SHA256("verify-seal-v2-file\n" || s_i ||
SHA256(bytes_i))`; the salts stay in the bundle's private `salts.json`, and a reveal publishes one salt. So showing the
manifest reveals the file count and nothing else, a revealed salt says nothing about the other files, and a short file
cannot be guessed from its entry without its salt (with the salts in the manifest, one reveal would have exposed every
other file's salt and made short files guessable). Canonical manifest bytes (sorted keys, no spaces, one newline) are
part of the commitment; a non-canonical manifest REFUSES. The verdict words: CERTIFIED "this file, under a sealed manifest
held by <date>; the others unrevealed"; REFUTED when the bytes, the name, the index or the salt do not re-derive the entry,
or the manifest's digest does not re-derive; REFUSED as v1. The battery grew from 12 to 24 planted forgeries (0 certified),
23 to 42 cases, 3 to 5 red controls (a verifier that skips the salted path check; one that skips the salted file hash).
The first use — claimbox sealing its next proposal before cert-machine decides it — follows in the same lane.

### The Bitcoin anchor without a node (2026-11-05 evening)

The first seal's `.ots` upgraded to Bitcoin block 974704 (mined 20:34:20 UTC), and `ots verify` could not confirm it: the
client asks a local Bitcoin node, and the Mac has none (public RPC nodes are https, which the client's library refuses). So
`anchors_of` now falls back: `ots --no-bitcoin verify` still checks the path from digest.txt to the block's merkle root and
prints both; the tool reads that block's 80-byte header from public Esplora explorers ($SEAL_ESPLORA, default
blockstream.info and mempool.space; empty = offline), computes the header's hash and merkle root itself, and confirms only
when every explorer serves the same header, its hash is the one the explorer named for that height, and its merkle root is
the one the `.ots` reaches. The date is the header's time in UTC; the anchor records `read_via`, and the page says "read
from two public block explorers, not a Bitcoin node of ours". What it does not check: that the header is in the
most-work chain (that needs a node) — two independent explorers agreeing is the trust. The battery exercises it against
stand-ins (a fake `ots`, local explorers serving block 974704's real header): 27 planted forgeries, 49 cases, 7 red
controls.

## Phase 3 — the registry (built, minimal)

`.github/ISSUE_TEMPLATE/seal.yml` accepts one input (the digest) and a checkbox; the form cannot validate a regex, so
`tools/seal-registry.py add <digest> --issue <n>` refuses anything but 64 lowercase hex and a repeat before the
maintainer commits; `--check` (a battery row) holds the file to digest lines. The commit is one line, by hand, on the
operator's word; its date is the anchor.

## Page

tools/verify-page.js: the ninth product card (In development; "0 bytes of the idea leave your machine, by design" — a
property, not a measurement, so it carries no mark), the section after "for graders" (Seal · Anchor · Open · Decide, and
"What a seal does not say"), one Tao sentence linked to his AI-views page (the Math 2.0 video is on the AIM site, not
SAIR's channel — the operator pastes the exact video URL), the dropdown's ninth product. Nothing on the page says the
tool is published. The diff is for review; not deployed.
