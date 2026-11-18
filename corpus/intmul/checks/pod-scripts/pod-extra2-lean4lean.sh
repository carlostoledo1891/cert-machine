#!/bin/bash
# pod-extra2-lean4lean.sh — as tester (2026-11-18): the lean4lean block of pod-extra2-tools.sh failed in 2 s because no
# commit of digama0/lean4lean names a released v4.33.x or any v4.34 toolchain (its master is on v4.33.0-rc2). Second
# and last try: master, its lean-toolchain replaced by each proof's exact toolchain. A build that fails is the fact.
export HOME=/home/tester PATH=/home/tester/.elan/bin:/usr/local/bin:/usr/bin:/bin GIT_TERMINAL_PROMPT=0
X=/home/tester/x; O=/results/extra2/tools
date -u +%FT%TZ > $O/lean4lean2.start
{ cd $X/lean4lean && echo "lean4lean master $(git rev-parse HEAD) $(git log -1 --format=%cI); ships $(cat lean-toolchain)"
  for v in 33 34; do
    rm -rf $X/l4l4$v; git worktree prune; git worktree add -q $X/l4l4$v HEAD
    ( cd $X/l4l4$v && echo "leanprover/lean4:v4.$v.1" > lean-toolchain && echo "== v4.$v.1" && nice -n 10 lake build lean4lean 2>&1 | tail -25
      ls -l .lake/build/bin/lean4lean && sha256sum .lake/build/bin/lean4lean && ./.lake/build/bin/lean4lean --help 2>&1 | head -20 ) || echo "lean4lean on v4.$v.1: no binary"
  done; } > $O/lean4lean2.log 2>&1
date -u +%FT%TZ > $O/lean4lean2.end
