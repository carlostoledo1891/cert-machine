# Replay the two full-CNF cases of R(7)

This replay does not determine R(3,10) or establish proof-byte reproducibility for other configurations. On the arm64 Mac, both full CNFs and both regenerated LRAT proofs matched their production hashes. For each proof, lrat-check printed `c VERIFIED` and cake_lpr printed `s VERIFIED UNSAT`, both with exit status 0. CaDiCaL reported UNSAT with exit status 20 in each case. [Full Mac run transcript](example-mac-full.txt)

## Run

Use a local copy of the public record. Set `reveal` to its reveal directory, and run the examples from the directory containing `regen-two/`. Each command takes a **new** output directory. Python 3.7 or later and a C compiler named `cc` suffice for CNF-only mode on a little-endian machine. For a full run use Git, tar, GNU Make and a C/C++ toolchain. Linux x86-64 matches production. [Public record and files](https://github.com/carlostoledo1891/cert-machine/tree/main/corpus/r310-c35-r7)

```sh
reveal=/path/to/cert-machine/corpus/r310-c35-r7/r7/reveal
python3 regen-two/regen.py "$reveal" cnf-run --cnf-only
```

### Fetch the pinned CaDiCaL source

On a machine with network access, download the archive from the commit-specific URL below. Its SHA-256 is `2dccd6ecc1878348dd70194d51df6b69006bf86439b5b3c395a5c5dd8863201e`. A reviewer with the supplied archive can go straight to the offline command.

```sh
commit=c60730422e758ef1cebe7aeddf2dda31c996bf04
archive="cadical-$commit.tar.gz"
curl --fail --location --output "$archive" \
  https://codeload.github.com/arminbiere/cadical/tar.gz/c60730422e758ef1cebe7aeddf2dda31c996bf04
printf '%s  %s\n' 2dccd6ecc1878348dd70194d51df6b69006bf86439b5b3c395a5c5dd8863201e "$archive" | shasum -a 256 -c -
```

Copy the archive, kit and public reveal inputs to the replay machine. Run from the directory containing `regen-two/`, with the archive path and `reveal` set appropriately.

```sh
python3 regen-two/regen.py "$reveal" proof-run --cadical-archive "$archive"
```

The script verifies the compressed bytes, the commit in the tar header, the archive paths and the extracted `VERSION` file. It runs plain `./configure` as in the bundle's `pod_run.sh`, then `make -j1`. The bundle provides the C sources for the generator and lrat-check and the native assembly, C runtime and Makefile for cake_lpr.

### Git source options

For a full offline replay from Git, supply a complete local repository containing the registered upstream CaDiCaL commit. The script exports the committed tree into its build directory. Local edits to a checkout are ignored.

```sh
python3 regen-two/regen.py "$reveal" proof-run-git --cadical-repo /path/to/cadical
```

For a reviewer with network access, this is the single-command full replay using the upstream repository named in the bundle. This is the only mode that requests a download.

```sh
python3 regen-two/regen.py "$reveal" proof-run-online --fetch-cadical
```

The bundle supplies the generator, cores, and both checker sources. Its `pod_run.sh` obtains CaDiCaL separately from `https://github.com/arminbiere/cadical.git` at commit `c60730422e758ef1cebe7aeddf2dda31c996bf04` (version `3.0.1`). An offline reader starting with just the bundle and configuration list can complete the CNF check. The solver build also needs that upstream source. The script checks the commit, builds serially, and uses the freshly built executables.

## What the script checks

The only inputs read from the reveal directory are the following files. The script checks both SHA-256 digests before extracting sources or generating a CNF.

| Path relative to `reveal/` | SHA-256 |
|---|---|
| `31-r7-prod-bundle.tar.gz/files/r7-prod-bundle.tar.gz` | `5666807cab6db618d7a0316a7333de433dc5236a466c170e62c8ffcf4388a2d3` |
| `08-configs.bin/files/configs.bin` | `76c2666b7f2c4de5d54951cf2ba5e17337c541fa89b5e39ce5d9de45142ced9e` |

Both zero-based IDs had the production trail `3:SAT,4:SAT,7:UNSAT`, outcome `CERTIFIED-UNSAT`, lrat-check verdict `c VERIFIED`, and cake_lpr verdict `s VERIFIED UNSAT`. The script goes straight to the deciding level. It calls `r7cnf cores_e85.g6 configs.bin IDX 9 1 7`, where the final arguments select the independence bound, lexicographic symmetry breaking, and the full formula. Both CNFs must match their ledger hashes before any solve starts.

| ID | Core | Side rows (a1, a2, b1, b2) | Level | Clauses | CNF bytes | Production LRAT bytes |
|---:|---|---|---:|---:|---:|---:|
| 332942 | X1 | 159, 1965, 1329, 2348 | 7 | 354830 | 23618970 | 84325 |
| 745446 | X2 | 996, 2425, 1408, 1895 | 7 | 358724 | 23519932 | 17935 |

| ID | File | Production SHA-256 |
|---:|---|---|
| 332942 | CNF | `35f616ed7bff001b86f17ee1772e6551ad227dea8bf63fe4d75ee6d7ec0543f1` |
| 332942 | LRAT | `d2556d836453432151a7876404cad7f56f8f6b77a9bf6cb6b470f9317392a985` |
| 745446 | CNF | `265986376c70f767de2aac5bcd0115ff35c05bf382375088ba06f617ae317176` |
| 745446 | LRAT | `96c6450f8b8efa1d862da3595b305a24e02f364f5dfcd740db4c289bd9a85148` |

Configuration fields come from `08-configs.bin/files/configs.bin`, read as five little-endian unsigned shorts at byte offset `10 * idx` as in the bundle's `prod.py`. The ledger fields above and costs below were extracted by filtering `prod-out/prod.tsv` on its `level` field. Its SHA-256 is `ba545601b42d7796ff8e8dc8b8d671f05f83ce14c24c90bb484b985dbeb47793`, published in `21-prod-out_OUT.sha256/files/prod-out/OUT.sha256`. The corpus README lists the ledger as a deferred large file. The kit embeds the two reference pairs so a reviewer can replay them without the ledger download. A reviewer who has the complete ledger can retrieve the original rows with this command.

```sh
LC_ALL=C awk -F '\t' 'NR == 1 || $4 == "7"' prod-out/prod.tsv
```

The full path invokes CaDiCaL with the production options `-q -t 300 --lrat --binary=false CNF LRAT`. It requires `s UNSATISFIABLE` and the UNSAT exit status, hashes the text proof, then runs both checkers on that same CNF and proof. Each verdict and numeric exit code is printed. The output directory retains the CNFs, LRAT proofs, solver and checker stdout/stderr logs. Its `build/` directory retains the sources, executables and CaDiCaL build log.

Read `both_checkers=PASS` as acceptance of the regenerated proof by both checkers. Read `production_proof_bytes=MATCH` as reproduction of the ledger's proof hash. A different proof also goes through both checkers. Full-mode exit zero requires a matched CNF, an UNSAT solve and both checker acceptances for each case. The public production control recorded matching proof-hash prefixes for 1184 of 1200 cross-machine cases. See `20-prod-out_CONTROLS.txt/files/prod-out/CONTROLS.txt`.

## Cost

These are the child CPU seconds printed in the two production ledger rows, with sums of the printed values. In the bundle's `prod.py`, function `one` accumulates generation and solving over all attempted levels. The checker columns are for the deciding proofs alone.

| ID | Generate | Solve | lrat-check | cake_lpr | Sum |
|---:|---:|---:|---:|---:|---:|
| 332942 | 0.53 | 1.89 | 0.52 | 1.85 | 4.79 |
| 745446 | 0.53 | 2.01 | 0.55 | 1.99 | 5.08 |
| Both | 1.06 | 3.90 | 1.07 | 3.84 | 9.87 |

The complete serial Mac replay, including compilation from the supplied archive, took **62.89 seconds elapsed**, with 51.41 user and 6.52 system CPU-seconds. The transcript records the host, compiler, binary digests, solver and checker exit codes, and both proof hashes. [Full Mac run transcript](example-mac-full.txt)

The historical reference is **9.87 CPU-seconds** for both production trails, including **4.91 CPU-seconds** for the checkers. This kit skips the lower levels. The production ledger excludes compilation, hashing, and driver overhead. The production machine and run log are in `22-prod-out_RUN-MACHINE.txt/files/prod-out/RUN-MACHINE.txt` and `30-prod-out_run.log/files/prod-out/run.log`. The earlier source search recorded in `offline-attempt.txt` preceded the supplied archive.
