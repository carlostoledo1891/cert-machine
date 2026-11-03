# Verify Seal (v1)

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
   and reads "Bitcoin block N attests existence as of <date>". Pending attestations refuse until `ots upgrade`.
2. **The registry** (`seals/registry.jsonl` in this repository): post the digest with the issue form "Register a Verify
   Seal digest"; the maintainer appends one line in one commit; record `{"kind": "git", "commit": "<sha>", "path":
   "seals/registry.jsonl"}` in the bundle's `anchors.json`. `open --registry <clone>` reads the line and the commit date.

A seal proves possession of exact bytes by a date. It does not say who first had the idea, that the idea is correct,
or anything about credit. The battery: `python3 -I instruments/seal/battery.py` (record `certs/seal-battery.json`).
