# Re-run it yourself

cert-machine's decision of Levent Alpöge's Lean release of RH and GRH for Dirichlet L-functions (alpo.ge,
20 November 2026), as a kit: the same scripts, run in the same order, from the same commit, on a machine of your own.

**What you need.** Linux x86-64 (Debian or Ubuntu), root, network access, at least 320 GB of free disk and 256 GB of
memory, and ideally 32 vCPU or more. On 32 vCPU the build took about 20 hours (~150 files a minute); the kernels after
it take hours more.

**What 256 GB is not enough for: the statement judge.** 256 GB was enough here for the build, nanoda, Lean's own
replay and con-leche. It was not enough for Comparator (the steps S1 and C1 of phase 2). At that limit its export
stopped making progress, and we stopped the run after 6.2 hours (amendment A17). On a machine with 376 GB it then ran
for 53 hours, printed nothing of its own, and was stopped for cost with no verdict (amendment A25). So our record has
no result for S1 or C1, and on a 256 GB machine yours will not have one either: phase 2 will sit in S1 until its
48-hour limit and then in C1 until its 4-hour limit, unless you stop them as we did (kill the step's `timeout` process
group with SIGKILL and leave a file `/results/S1.stopped`, then the same for C1). The other steps of phase 2 then run
by themselves.

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
Lean's own replay), the bridge's waiting script (`…-p3-bridge.sh`) and con-leche (`…-p4.sh`); `…-setupclean.sh` keeps
the build inside 320 GB. Results land in `/results`; `tail -f /results/_phase.log` follows them.

**The bridge.** The two releases in one environment (the bridge) was not run here: it was dropped for cost (amendment
A21), so there is no result of ours to compare yours with. The kit still starts its waiting script, because the
con-leche step waits for that script's line in the log. The bridge itself starts only if the statement judge passes on
your machine; otherwise the script logs "bridge not started" and ends.

**Compare with ours.** In a checkout of the same commit, with your `/results` copied next to it:

```sh
python3 -I tools/check-alpoge-grh.py --compare-run /path/to/results
```

prints the verdict of eleven checks on your machine beside ours, and the digest of your export beside ours. Three of
the eleven are REFUSED in our record (S1, C1–C5 and the bridge): "same" on those rows means only that neither run has a
verdict. The rules every verdict follows are in `notes/alpoge-grh-preregistration-2026-11-20.md`: the build, replay
and judging rules were registered before those runs, and every later change is a dated amendment, marked when it was
written after the result or the state it reads. The checksums of the rule files as they stood on 21 November, with
an OpenTimestamps proof of that list, are in `corpus/alpoge-grh/timestamps/`; the page says whether Bitcoin has
confirmed it.

Not in the kit: the checks we ran on other machines (SPEC and CHAR, a few minutes each in any Mathlib-only workspace at
0df444a3 — `instruments/alpoge-grh/spec/`; the August release's re-check, P0) and the clean-machine re-check
(`tools/runpod-alpoge-grh-clean.sh`), which needs two machines. In our own run, Lean's replay ran on a second machine
(amendment A15) and the statement judge on a third (A17); the kit runs both on your one machine, as registered.
