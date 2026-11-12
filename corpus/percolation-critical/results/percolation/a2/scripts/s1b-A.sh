#!/usr/bin/env bash
# A2 step 1b: Anthropic s own environment (v4.32.0 / Mathlib 81a5d257), for the measurement of the other direction.
source /root/one/scripts/common.sh
cd /root/one/A/*/percolation
step A-cache lake exe cache get
echo s1b done
