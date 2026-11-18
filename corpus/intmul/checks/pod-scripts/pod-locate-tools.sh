#!/bin/bash
# pod-locate-tools.sh — as tester on the second pod (2026-11-18): con-leche master at the commit used on the first pod
# (cd2eceab), built with its own toolchain, while the proof builds. Facts in /results/locate/tools.
set -uo pipefail
export HOME=/home/tester
X=/home/tester/x; O=/results/locate/tools; mkdir -p $X $O
export PATH=$HOME/.elan/bin:$HOME/.cargo/bin:/usr/local/bin:/usr/bin:/bin GIT_TERMINAL_PROMPT=0
until [ -x $HOME/.elan/bin/elan ]; do sleep 10; done
date -u +%FT%TZ > $O/conleche.start
{ cd $X && rm -rf con-leche && git clone -q https://github.com/leanprover/con-leche.git && cd con-leche && git checkout -q cd2eceab2e9b10404c663b468639c8aa99d0d1f2 \
  && echo "con-leche $(git rev-parse HEAD) $(git log -1 --format=%cI)" && cat lean-toolchain && elan toolchain install "$(cat lean-toolchain)" 2>&1 | tail -2 \
  && nice -n 10 lake build 2>&1 | tail -8 && ls -l .lake/build/bin/ && sha256sum .lake/build/bin/*; } > $O/conleche.log 2>&1
echo $? > $O/conleche.exit; date -u +%FT%TZ > $O/conleche.end
