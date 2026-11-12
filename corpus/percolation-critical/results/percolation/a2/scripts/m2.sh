#!/usr/bin/env bash
# A2 measurement, direction 2: OpenAI s Z3 closure (35 modules, Mathlib only) at v4.32.0 / Mathlib 81a5d257.
source /root/one/scripts/common.sh
export LEAN_NUM_THREADS=12
AP=$(ls -d /root/one/A/*/percolation); O=/root/one/O/lean
mkdir -p /root/one/m2 && cd /root/one/m2
cp $AP/lean-toolchain $AP/lake-manifest.json .
cat > lakefile.toml <<L
name = "m2"
defaultTargets = ["OAI", "ComparatorChallenges"]

[leanOptions]
autoImplicit = false

[[require]]
name = "mathlib"
git = "https://github.com/leanprover-community/mathlib4"
rev = "81a5d257c8e410db227a6665ed08f64fea08e997"

[[lean_lib]]
name = "OAI"
roots = ["OAI.Probability.CriticalZ3.Main"]

[[lean_lib]]
name = "ComparatorChallenges"
roots = ["ComparatorChallenges.CriticalZ3"]
L
sed -i "s/\"name\": \"PercolationContinuity\"/\"name\": \"m2\"/" lake-manifest.json
mkdir -p OAI/Probability ComparatorChallenges
cp -r $O/OAI/Probability/CriticalZ3 OAI/Probability/
cp $O/ComparatorChallenges/CriticalZ3.lean ComparatorChallenges/
step m2-cache lake exe cache get
step m2-build lake build
echo m2 done
