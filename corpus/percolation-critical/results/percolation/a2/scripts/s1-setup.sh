#!/usr/bin/env bash
# A2 step 1: tools, OpenAI's environment at the pin (the host of the one Lean), Anthropic's tarball unpacked.
source /root/one/scripts/common.sh
step tools bash -c 'apt-get update -qq && apt-get install -y -qq jq golang-go git curl build-essential >/dev/null && (command -v rustup || test -x $HOME/.cargo/bin/cargo || curl -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal) && (command -v elan || test -x $HOME/.elan/bin/elan || curl -sSf https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh | sh -s -- -y --default-toolchain none) && go version && $HOME/.cargo/bin/cargo --version'
mkdir -p /root/one/A && tar xzf $I/formal-math-795efb86.tar.gz -C /root/one/A
mkdir -p /root/one/O && cd /root/one/O && git init -q && git remote add origin https://github.com/openai/math && git fetch -q --depth 1 origin $OAI && git checkout -q FETCH_HEAD
git rev-parse HEAD > $R/O-head.txt
cd lean
step O-update lake update
git diff --stat lake-manifest.json > $R/O-manifest.diff; echo "O manifest diff lines: $(wc -l < $R/O-manifest.diff)"
step O-cache lake exe cache get
step O-build-z3 lake build -j24 OAI.Probability.CriticalZ3.Main ComparatorChallenges.CriticalZ3
echo "s1 done"
