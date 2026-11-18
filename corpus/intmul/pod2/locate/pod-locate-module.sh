#!/bin/bash
# pod-locate-module.sh — as tester (2026-11-18 15:45 UTC): Lean's own kernel on the ONE module that holds the theorem
# con-leche was stuck on, replayed on top of its imports as they were built (leanchecker without --fresh), with a
# 15-minute limit and an address-space limit of 90 GiB. Facts in /results/locate/module.*
export HOME=/home/tester
O=/results/locate; C=/home/tester/work/aaf109266438/canonical
TB=$HOME/.elan/toolchains/leanprover--lean4---v4.34.1/bin
M=IntegerMultBounds.MathlibTM2.M8.Global.DataTraceB
date -u +%FT%TZ > $O/module.start; echo "lake env leanchecker --verbose $M" > $O/module.cmd
( cd $C && ulimit -v $((90*1024*1024)) && exec env -i HOME=$HOME PATH="$TB:$HOME/.elan/bin:/usr/local/bin:/usr/bin:/bin" /usr/bin/time -v timeout 900 lake env $TB/leanchecker --verbose $M ) > $O/module.out 2> $O/module.err
echo $? > $O/module.exit; date -u +%FT%TZ > $O/module.end
