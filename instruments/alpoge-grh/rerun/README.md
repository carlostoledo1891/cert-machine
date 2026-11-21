# Re-run it yourself

cert-machine's decision of Levent Alpöge's Lean release of RH and GRH for Dirichlet L-functions (alpo.ge,
20 November 2026), as a kit: the same scripts, run in the same order, from the same commit, on a machine of your own.

**What you need.** Linux x86-64 (Debian or Ubuntu), root, network access, at least 320 GB of free disk and 256 GB of
memory, and ideally 32 vCPU or more. On 32 vCPU the build took about 20 hours (~150 files a minute); the judges and
kernels after it take hours more.

**One command.** From any directory, as root, with `<commit>` the cert-machine commit you are re-running (the page
names the one behind its record):

```sh
curl -fsSL https://raw.githubusercontent.com/carlostoledo1891/cert-machine/<commit>/instruments/alpoge-grh/rerun/rerun.sh -o rerun.sh
less rerun.sh            # read it first: it fetches six scripts from the same commit and runs them
AUDIT_SHA=<commit> bash rerun.sh
```

It runs, in order: phase 1 (`tools/runpod-alpoge-grh-p1.sh`: the 14 parts fetched from alpo.ge and checked against
`corpus/alpoge-grh/PINS.json`, our statement file built before any of the release's code, then the release's build),
phase 2 (`…-p2.sh`: the judges rebuilt by root, axioms, the census, Comparator, the planted errors, the export, nanoda,
Lean's own replay), the bridge (`…-p3-bridge.sh`) and con-leche (`…-p4.sh`); `…-setupclean.sh` keeps the build inside
320 GB. Results land in `/results`; `tail -f /results/_phase.log` follows them.

**Compare with ours.** In a checkout of the same commit, with your `/results` copied next to it:

```sh
python3 -I tools/check-alpoge-grh.py --compare-run /path/to/results
```

prints each check's verdict on your machine beside ours, and the digest of your export beside ours. The rules every
verdict follows are in `notes/alpoge-grh-preregistration-2026-11-20.md`, fixed before any of them ran; their
checksums are timestamped in Bitcoin (`corpus/alpoge-grh/timestamps/`).

Not in the kit: the checks we ran on other machines (SPEC and CHAR, a few minutes each in any Mathlib-only workspace at
0df444a3 — `instruments/alpoge-grh/spec/`; the August release's re-check, P0) and the clean-machine re-check
(`tools/runpod-alpoge-grh-clean.sh`), which needs two machines.
