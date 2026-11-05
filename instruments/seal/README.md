# Verify Seal (v1, and v2 for selective reveal)

Prove you held exact bytes by a date without revealing them. One file, Python standard library, nothing of the sealed
content leaves the machine: only a salted digest goes out, to public anchors nobody here controls.

```
python3 instruments/seal/seal.py seal <file-or-folder>        # -> <name>.seal/  (archive.tar, salt.hex, seal.json, digest.txt); prints the digest
python3 instruments/seal/seal.py stamp <name>.seal            # `ots stamp` if installed, else the exact steps; the registry line to post
python3 instruments/seal/seal.py open  <name>.seal [--by YYYY-MM-DD] [--registry <clone of this repository>]
```

## The commitment

```
digest = SHA256( "verify-seal-v1\n" || salt_bytes || SHA256(archive_bytes) )
```

`salt_bytes` is exactly 32 bytes, stored as 64 lowercase hex characters in `salt.hex` and nothing else (a trailing
newline refuses). `SHA256(archive_bytes)` is the 32 raw bytes of the archive's hash. Re-derive it without this program:

```
( printf 'verify-seal-v1\n'; xxd -r -p salt.hex; shasum -a 256 archive.tar | cut -c1-64 | xxd -r -p ) | shasum -a 256
```

(Linux: `sha256sum` for `shasum -a 256`.) The battery checks this line against the Python digest on every run.

## The archive

A tar of the regular files under the path: names relative to it, `/` separators, NFC-normalised, sorted by their UTF-8
bytes; mtime 0, uid/gid 0, empty owner names, mode 0644 for every file; no directory entries, no symlinks (a symlink
refuses the seal), no compression. The same contents give the same bytes on any machine; the battery re-archives the
same files written in another order, with other mtimes and modes, under another locale and time zone.

## The verdict of `open`

- **CERTIFIED**: archive and salt re-derive the recorded digest, and at least one anchor is confirmed here (the digest
  is in it and its date is read); with `--by D`, the earliest confirmed anchor is on or before D. Every anchor is listed.
- **REFUTED**: the digest does not re-derive; the input that differs is named (the archive, the salt, or the recorded
  digest itself, told apart by the component hashes seal.json keeps).
- **REFUSED**: a part is missing or malformed, no anchor is in the bundle, an anchor is not confirmed here (an `.ots` not
  upgraded, no `ots` client, no `--registry` clone), or every confirmed anchor is later than the claimed date. The reason
  says what would make it decidable. Exit status 0 / 1 / 2.

## Anchors

1. **OpenTimestamps** (`digest.txt.ots`): a Bitcoin-attested date. `open` runs `ots verify` when the client is installed
   and reads "Bitcoin block N attests existence as of <date>". Pending attestations refuse until `ots upgrade`. With no
   Bitcoin node to ask, `ots --no-bitcoin verify` still checks the path from the digest to block N's merkle root; the
   tool then reads block N's 80-byte header from public block explorers (`SEAL_ESPLORA`, comma-separated Esplora URLs,
   default blockstream.info and mempool.space; empty to stay offline), computes its hash and merkle root itself, and
   confirms only when every explorer serves the same header and its merkle root is the one the `.ots` reaches. The date
   is the header's time in UTC; the anchor says `read_via` which way it was read. The request sends the block's number.
2. **The registry** (`seals/registry.jsonl` in this repository): post the digest with the issue form "Register a Verify
   Seal digest"; the maintainer appends one line in one commit; record `{"kind": "git", "commit": "<sha>", "path":
   "seals/registry.jsonl"}` in the bundle's `anchors.json`. `open --registry <clone>` reads the line and the commit date.

A seal proves possession of exact bytes by a date. It does not say who first had the idea, that the idea is correct,
or anything about credit. The battery: `python3 -I instruments/seal/battery.py` (record `certs/seal-battery.json`).

## v2 — reveal one file, keep the rest sealed

```
python3 instruments/seal/seal.py seal2 <folder>                    # -> <name>.seal2/ (manifest.json, salts.json [private], archive.tar [private], salt.hex, seal.json, digest.txt)
python3 instruments/seal/seal.py reveal <name>.seal2 <path> [--out <dir>]   # the package that shows ONE file: its bytes, its salt, the manifest, the seal and anchors
python3 instruments/seal/seal.py verify <package> [--by YYYY-MM-DD] [--registry <clone>]
```

Each file gets its own 32-byte salt `s_i`. The manifest holds, per file, only two salted hashes and an index:

```
h_i = SHA256( "verify-seal-v2-file\n" || s_i || SHA256(bytes_i) )        the bytes
q_i = SHA256( "verify-seal-v2-path\n" || s_i || path_i )                 the name
manifest = {"files":[{"index":i,"path_hash":q_i,"sha256":h_i},…],"version":"verify-seal-v2"}   canonical JSON, sorted keys, no spaces, one newline
digest   = SHA256( "verify-seal-v2\n" || salt_bytes || SHA256(manifest_bytes) )                  anchored exactly as v1
```

Showing the manifest reveals how many files were sealed and nothing else: no path, no salt. Revealing file *i* publishes
its bytes, its name and `s_i`; the other salts never leave `salts.json`, so a revealed salt says nothing about the other
files, and a short file cannot be guessed from its entry without its salt. `verify` recomputes `h_i` and `q_i`, requires
both at index *i*, re-derives the manifest's digest and reads the anchors:

- **CERTIFIED**: this file, under a sealed manifest held by the anchor's date; the other files stay unrevealed and undecided.
- **REFUTED**: the bytes, the name or the salt do not match the manifest at that index, or the manifest's digest does not re-derive.
- **REFUSED**: a part is missing or not canonical, or no anchor is confirmed here (as v1).

`open` also opens a v2 bundle whole (archive.tar and salts.json present): every file must re-derive its entry. The
manifest's own line of shell: `( printf 'verify-seal-v2\n'; xxd -r -p salt.hex; shasum -a 256 manifest.json | cut -c1-64 | xxd -r -p ) | shasum -a 256`.
The battery adds the v2 cases: a revealed file whose bytes differ, the right bytes under another name, another index,
another salt, an edited or non-canonical manifest, and two red controls on a verifier that skips a check.
