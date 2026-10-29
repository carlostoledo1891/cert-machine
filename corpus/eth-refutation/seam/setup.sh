#!/usr/bin/env bash
# eth-seam: one side's Lake project, built, for .github/workflows/eth-seam.yml (the export jobs and the cross jobs).
#   setup.sh openai     corpus/eth-refutation/bridge/openai (Lean v4.34.1, Mathlib d13f23b7) + OpenAI's challenge as
#                       ComparatorChallenges.SubexponentialSAT + TSavo's statement file as Bridge.OpenAIStatement
#   setup.sh anthropic  anthropics/formal-math @ 16a5ce41 eth/ as eth-tsavo.yml sets it up (the clones against the pins,
#                       the statement checks, bridge/ inside, the README block and the declared challenge-lib amendment
#                       by tools/eth-tsavo-gates.js) + the same challenge module
# Every statement file is fetched at its pin and checked against the sha256 pins before anything is built. Needs
# $GITHUB_WORKSPACE/audit (the sparse checkout), $W (work dir), $OUT (facts dir) and the pins in the environment.
# Leaves the project at $W/project and prints its directory last.
set -euo pipefail
side=$1
A="$GITHUB_WORKSPACE/audit"
E="$A/corpus/eth-refutation"
mkdir -p "$OUT" "$W"
pin() { python3 -I -c 'import json,sys; d=json.load(open(sys.argv[1]))
for k in sys.argv[2:]: d=d[k]
print(d)' "$@"; }
test "$(pin "$E/pins.json" claims openai commit)" = "$OPENAI_PIN"
CH=$(pin "$E/pins.json" claims openai files lean/ComparatorChallenges/SubexponentialSAT.lean)
ST=$(pin "$E/tsavo/pins.json" tsavo files bridge/Bridge/OpenAIStatement.lean)
curl -sSfL -o "$W/SubexponentialSAT.lean" "https://raw.githubusercontent.com/openai/math/$OPENAI_PIN/lean/ComparatorChallenges/SubexponentialSAT.lean"
test "$(sha256sum "$W/SubexponentialSAT.lean" | cut -d' ' -f1)" = "$CH"
git clone -q "$TSAVO_REPO" "$W/tsavo" && git -C "$W/tsavo" checkout -q "$TSAVO_PIN"
test "$(git -C "$W/tsavo" rev-parse HEAD)" = "$TSAVO_PIN"
test "$(sha256sum "$W/tsavo/bridge/Bridge/OpenAIStatement.lean" | cut -d' ' -f1)" = "$ST"
echo "challenge $CH; statement $ST" > "$OUT/pins-checked.txt"
P="$W/project"
if [ "$side" = openai ]; then
  cp -r "$E/bridge/openai" "$P"
  mkdir -p "$P/seam/ComparatorChallenges" "$P/bridge/Bridge"
  cp "$W/tsavo/bridge/Bridge/OpenAIStatement.lean" "$P/bridge/Bridge/OpenAIStatement.lean"
  cat >> "$P/lakefile.toml" <<'EOF'

# eth-seam: the export and OpenAI's challenge under its own module name; TSavo's statement file under its own
[[lean_lib]]
name = "Seam"
srcDir = "seam"
roots = ["SeamExport", "SeamCross", "ComparatorChallenges.SubexponentialSAT"]

[[lean_lib]]
name = "Bridge"
srcDir = "bridge"
roots = ["Bridge.OpenAIStatement"]
EOF
  WANT_TC=$OPENAI_TOOLCHAIN
  WANT_ML=$OPENAI_MATHLIB
  TARGETS="SeamExport SeamCross ComparatorChallenges.SubexponentialSAT Bridge.OpenAIStatement"
elif [ "$side" = anthropic ]; then
  git clone -q --filter=blob:none --no-checkout "$ANT_REPO" "$W/ant"
  git -C "$W/ant" sparse-checkout set --no-cone '/eth/**' '/.github/**'
  git -C "$W/ant" checkout -q "$ANT_PIN"
  test "$(git -C "$W/ant" rev-parse HEAD)" = "$ANT_PIN"
  python3 -I "$A/tools/eth-pod-facts.py" verify anthropic "$W/ant" "$E/pins.json" eth .github > "$OUT/verify-anthropic.json"
  node "$A/tools/eth-tsavo-gates.js" sources "$W/tsavo" "$W/ant/eth" > "$OUT/sources-gate.txt" 2>&1 || { cat "$OUT/sources-gate.txt"; exit 1; }
  mv "$W/ant/eth" "$P"
  cp -r "$W/tsavo/bridge" "$P/bridge"
  node "$A/tools/eth-tsavo-gates.js" lakefile "$W/tsavo" "$P" > "$OUT/lakefile-step.txt"
  node "$A/tools/eth-tsavo-gates.js" lakefile "$W/tsavo" "$P" --challenge-lib >> "$OUT/lakefile-step.txt"
  mkdir -p "$P/seam/ComparatorChallenges"
  cat >> "$P/lakefile.toml" <<'EOF'

# eth-seam: the export and OpenAI's challenge under its own module name
[[lean_lib]]
name = "Seam"
srcDir = "seam"
roots = ["SeamExport", "SeamCross", "ComparatorChallenges.SubexponentialSAT"]
EOF
  WANT_TC=$ANT_TOOLCHAIN
  WANT_ML=$ANT_MATHLIB
  TARGETS="SeamExport SeamCross ComparatorChallenges.SubexponentialSAT Bridge.OpenAIStatement BridgeChallenge"
else
  echo "usage: setup.sh openai|anthropic" >&2; exit 2
fi
cp "$W/SubexponentialSAT.lean" "$P/seam/ComparatorChallenges/SubexponentialSAT.lean"
cp "$E/seam/lean/"*.lean "$P/seam/"
cp "$P/lakefile.toml" "$OUT/lakefile.toml"
cd "$P"
test "$(cat lean-toolchain)" = "$WANT_TC"
if [ "$side" = openai ]; then lake update > "$OUT/lake-update.log" 2>&1 || { tail -30 "$OUT/lake-update.log"; exit 1; }; fi
lake exe cache get > "$OUT/cache.log" 2>&1 || { tail -30 "$OUT/cache.log"; exit 1; }
test "$(cat lean-toolchain)" = "$WANT_TC"
test "$(cd .lake/packages/mathlib && git rev-parse HEAD)" = "$WANT_ML"
cp lake-manifest.json "$OUT/lake-manifest.json"
find . -path ./.lake -prune -o -type f -print | sort | xargs sha256sum > "$OUT/sources.sha256"
{ echo "side: $side"; echo "toolchain: $(cat lean-toolchain)"; lean --version; lake --version
  echo "mathlib: $(cd .lake/packages/mathlib && git rev-parse HEAD)"
  echo "commit: $GITHUB_SHA"; echo "run: $GITHUB_RUN_ID attempt $GITHUB_RUN_ATTEMPT"; cat "$OUT/machine.txt" 2>/dev/null || true; } > "$OUT/env.txt" 2>&1
set +e
# shellcheck disable=SC2086
lake build -v $TARGETS > "$OUT/build.log" 2>&1
echo $? > "$OUT/build.exit"
set -e
grep -E '(Built|error|warning)' "$OUT/build.log" | grep -v -E '^.*(Mathlib|Batteries|Aesop|Qq|ProofWidgets|Plausible|LeanSearchClient|ImportGraph)\.' | tail -40 >&2 || true
test "$(cat "$OUT/build.exit")" = 0
echo "$P"
