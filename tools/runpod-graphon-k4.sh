#!/usr/bin/env bash
# runpod-graphon-k4.sh — the first implementation of the C_89 (K4) replay (instruments/optq/graphon_k4.c: every block,
# no symmetry, nine primes below 2^21) on ONE RunPod CPU pod. The pod holds no credential: it fetches the C source and
# the pinned certificate from this repository at a fixed commit (K4_SHA), checks the certificate's sha256 against the
# pin, builds, runs the kernel's selftest, then the kernel on every vCPU, and serves the per-block residues read-only on
# port 8000; tools/import-runpod-graphon-k4.js brings them into certs/graphon-k4-blocks.txt. A stopped run resumes:
# blocks already in blocks.txt are skipped (--done).
#
# start command (ubuntu:24.04):
#   apt-get update -qq && apt-get install -y -qq curl ca-certificates < /dev/null > /dev/null \
#     && curl -fsSL https://raw.githubusercontent.com/carlostoledo1891/cert-machine/<sha>/tools/runpod-graphon-k4.sh -o /run.sh \
#     && bash /run.sh
# env: K4_SHA (the commit), THREADS (the pod's vCPU count; nproc can report the host's)
set -uo pipefail
: "${K4_SHA:?}"
RAW=https://raw.githubusercontent.com/carlostoledo1891/cert-machine/$K4_SHA
CERT=corpus/optconst-queue/c89a-k4-2026-10-27/c89-k4/c89_stepgraphon_D20.json.gz
CERT_SHA=82c28f7761f8392df6ed1728b5eefdc4ef388b266fc2beb1a2f0a54f7dd2631a
R=/results; W=/work; mkdir -p $R $W
export DEBIAN_FRONTEND=noninteractive
THREADS=${THREADS:-$(nproc)}
status() { echo "{\"phase\":\"$1\",\"commit\":\"$K4_SHA\",\"threads\":$THREADS,\"updated\":\"$(date -u +%FT%TZ)\"}" > $R/_status.json; }
status starting
apt-get update -qq && apt-get install -y -qq python3 gcc libc6-dev curl ca-certificates gzip < /dev/null > /dev/null || { status "FAILED: apt"; sleep infinity; }
(cd $R && nohup python3 -m http.server 8000 --bind 0.0.0.0 > /dev/null 2>&1 &)        # after apt: ubuntu:24.04 ships no python3
fetch() { for t in 1 2 3 4 5 6; do curl -fsSL "$RAW/$1" -o "$2" && return 0; sleep $((t * 10)); done; return 1; }
fetch instruments/optq/graphon_k4.c $W/graphon_k4.c || { status "FAILED: fetch the kernel"; sleep infinity; }
fetch $CERT $W/cert.json.gz || { status "FAILED: fetch the certificate"; sleep infinity; }
[ "$(sha256sum $W/cert.json.gz | cut -d' ' -f1)" = "$CERT_SHA" ] || { status "FAILED: the certificate does not match its pin"; sleep infinity; }
gcc -O3 -march=native -ffp-contract=fast -pthread -o $W/graphon_k4 $W/graphon_k4.c -lm > $R/_build.log 2>&1 || { status "FAILED: build"; sleep infinity; }
{ sha256sum $W/graphon_k4.c $W/cert.json.gz; gcc --version | head -1; grep -m1 "model name" /proc/cpuinfo; grep -m1 -o -E "avx512f|avx2" /proc/cpuinfo | head -1; echo "threads $THREADS"; } > $R/_build.txt
$W/graphon_k4 --selftest > $R/selftest.txt 2>&1 || { status "FAILED: selftest"; sleep infinity; }
status running
gunzip -c $W/cert.json.gz > $W/cert.json
$W/graphon_k4 --threads=$THREADS --done=$R/blocks.txt < $W/cert.json >> $R/blocks.txt 2> $R/_kernel.err \
  && status complete || status "FAILED: kernel (see _kernel.err)"
sleep infinity
