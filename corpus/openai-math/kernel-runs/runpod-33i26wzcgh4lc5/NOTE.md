# RunPod pod 33i26wzcgh4lc5 — amendment 16 (2026-10-12): the three challenges that never reached Comparator

cpu3c, 32 vCPU, 64 GB cgroup (the container reported 503 GB of host RAM), $0.96/h, tools/runpod-openai-math.sh @ 784cb2ef,
SLOTS=1, nanoda issue44-stack1g, GLIBC_TUNABLES=glibc.malloc.mmap_max=0:glibc.malloc.arena_max=1. Created 12:43:39 UTC,
terminated at the operator's $10 cap (22:5x UTC). The importer could not run: the pod's HTTP server stopped answering under
memory pressure (RunPod reported 99% memory, full CPU), so no result file was copied; the facts below were read from the
pod's own served files during the run (21:53 UTC) and are recorded here by hand.

- MUBSix: ran, exit 1 after 3,041 s — the solution build reached 9,399 of 12,304 modules and Lake reported
  "uncaught exception: Child exited with 137" (a SIGKILL: out of memory at the 64 GB limit). No kernel ran. Stays REFUSED
  (resources).
- ErdosReciprocal: building from 13:43 UTC until the cap, about 9 h, without reaching Comparator. Stays REFUSED (resources).
- PlanarPacking: never started (queued behind the two above). Stays REFUSED (resources).

Nothing here changes certs/openai-math-kernel.json: all three were REFUSED for resources before and remain so.
