#!/usr/bin/env bash
# A2 measurement, direction 1 (the default): Anthropic s library (251 files) inside openai/math at 4eaee875
# (v4.34.1 / Mathlib d13f23b7). First the host s own Z3 closure, then wave 1 of Anthropic s library, unedited.
source /root/one/scripts/common.sh
AP=$(ls -d /root/one/A/*/percolation); cd /root/one/O/lean
mv $R/O-build-z3.log $R/O-build-z3-0-flag-slip.log; rm -f $R/O-build-z3.exit $R/O-build-z3.seconds
step O-build-z3 lake build OAI.Probability.CriticalZ3.Main ComparatorChallenges.CriticalZ3
mkdir -p anthropic && cp -r $AP/Percolation $AP/Percolation.lean $AP/Challenge.lean $AP/Solution.lean anthropic/
cat >> lakefile.lean <<L

-- A2 (2026-11-12), the one-Lean port: Anthropic s library (anthropics/formal-math 795efb86, percolation/), sources
-- under anthropic/, with the options of its own lakefile.toml.
lean_lib Percolation where
  srcDir := "anthropic"
  leanOptions := #[⟨\`autoImplicit, false⟩, ⟨\`relaxedAutoImplicit, false⟩]
lean_lib Challenge where
  srcDir := "anthropic"
  roots := #[\`Challenge]
  leanOptions := #[⟨\`autoImplicit, false⟩, ⟨\`relaxedAutoImplicit, false⟩]
lean_lib Solution where
  srcDir := "anthropic"
  roots := #[\`Solution]
  leanOptions := #[⟨\`autoImplicit, false⟩, ⟨\`relaxedAutoImplicit, false⟩]
L
step m1-wave1 lake build Percolation Solution Challenge
echo m1 done
