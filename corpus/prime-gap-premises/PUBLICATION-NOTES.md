# What this folder is, and where it departs from the private bytes (2026-11-13)

The premises work of 2026-11-12 was done privately and sealed (four digests in seals/registry.jsonl: the rules 6f1e6d11…,
the results 15c5abca…, amendment A1's rules f18e88c4…, its results d1c8fe7d…). This folder is its publication. It is the
private folder's files, byte for byte, EXCEPT:

| file | what changed | sha256, private | sha256, here |
|---|---|---|---|
| decider_a.py | one line: the 186 audit's decider is loaded from this folder (pg186a_decide.py), not from a path on the author's machine | 90faff57cd56c8ed038d95709902f031a416193add1c0fc6eb89488deab6bb78 | bee776098c244c417d764227b33220d0ac511fd599f0324598386a0ac39a0329 |
| decider_b.js | two lines: the interval library is loaded by a relative path | ffd084f5792fe65ef0e34f2ef5d021cb05e4fe07678a763efc9147630ead6898 | cf4be526a33d16ed95ff1edac7051a31115893c8aeb5105d7f3a5a5011c6c0f9 |
| ledger.py | one line: the repository root is found from the file's place, not typed | 0e87f948ba4da787fbdce9049f478b210ab6c3c44c781812cfbf6ffc4c944fd0 | 69989a318c4926fd14305bc60b72f0a97f7026cc8f1908166e8a3edc2ab9e34c |
| PREREGISTRATION.md | one phrase in amendment A1: a path naming the private working repository reads "in the private working repository" | e3a10cfba6ee1b22df6d8e9b1d81174e57b5148bd0dbfbcac7b66167fea8a715 | 0e140784374952fe749d8e3c6461c12ae896ae20840530001f974685b989e82f |

So the hashes of decider_a.py and decider_b.js printed in RESULT-2026-11-12.md are the private files', and the sealed
pre-registration is the private one; the public copies differ only as listed. pg186a_decide.py is the 186 audit's own
decider A, unchanged (sha256 ba27c07aa1d24a7fa2aff6f550eb8807fd9e9e75d31c8e7a37ada0c3903e9b35), published here because decider A loads it.

WITHHELD, and why:
- The claimant's package output from the replay of step 5 (the acceptance receipt, the coverage record, every stage's
  output and log, the one-line Linux variant of its rejection test): the 182 repository carries no licence, so its
  material is run and quoted, never copied. step5/acceptance-read.json holds what WE read from the receipt, with the
  sha256 of the two files; step5/SHA256SUMS.step5 lists every imported file by hash; step5/runs/ holds only our own
  status line, comparison and controls.
- The two per-instance value files of step 2 (7 MB and 25 MB): out/VALUES-NOT-PUBLISHED.sha256 gives their hashes;
  decider_a.py (about 110 minutes) and decider_b.js (about 3 minutes) regenerate them.
- The blind readings of the 212's premises are already public in corpus/bgp212-readings-2026-11-12 (the same
  summary.json, sha256 576dd7c3…).
- The seal bundles (their archives and salts stay private; the digests are public), the private HTML page, the pod
  helper scripts.

HOW THE PUBLIC RECORD IS MADE. ledger.py is the private generator of ledger.jsonl, published to be read: it reads the two
withheld files of row 182-4 and the private copy of the readings, so it does not run from this folder. ledger.jsonl keeps
its bytes, and its evidence paths name the private folder. tools/record-prime-gap-premises.js is what re-derives the public
record (certs/prime-gap-premises.json) from this folder: it maps each evidence path to its public counterpart, or to
"withheld, sha256 …" for the two withheld files, and checks every hash against the ledger's.
