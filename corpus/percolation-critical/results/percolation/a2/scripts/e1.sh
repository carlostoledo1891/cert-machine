#!/usr/bin/env bash
# The one environment E = Anthropic s project (unchanged, v4.32.0 / Mathlib 81a5d257); first its own library.
source /root/one/scripts/common.sh
export LEAN_NUM_THREADS=22
cd /root/one/A/*/percolation
step E-build-anthropic lake build Percolation Solution Challenge
