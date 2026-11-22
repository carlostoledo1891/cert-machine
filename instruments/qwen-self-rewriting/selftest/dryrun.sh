#!/bin/bash
# dryrun.sh: the whole of Stage 1 against a synthetic checkpoint served by a local mock of the hub. No network beyond
# 127.0.0.1. It writes only under the scratch directory given. It exercises both deciders, the retries (the mock cuts
# some responses short), the controls and the recorder, and compares the result with the brute-force answer key.
# usage: bash dryrun.sh <scratch_dir> [f32|bf16] [extra mock options, e.g. --no-lfs-in-api]
set -u
S="$1"; VARIANT="${2:-f32}"; shift; shift 2>/dev/null
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(cd "$HERE/../../.." && pwd)"
PORT=18473
PYTHON="${PYTHON:-python3}"
rm -rf "$S/fx" "$S/runs"; mkdir -p "$S/fx" "$S/runs"
"$PYTHON" -I "$HERE/fixture.py" "$S/fx" $PORT "$VARIANT" || exit 1
"$PYTHON" -I "$HERE/mock_hub.py" "$S/fx" $PORT --cut-every 7 "$@" > "$S/fx/hub.out" 2>&1 &
HUB=$!
trap 'kill $HUB 2>/dev/null' EXIT
sleep 1
OPT="--pins $S/fx/PINS-fixture.json --runs $S/runs"
PY="$PYTHON -I $ROOT/tools/qwen-stage1.py"; JS="node $ROOT/tools/qwen-stage1.js"
fail() { echo "DRY RUN FAILED at: $1"; exit 1; }
$PY offline $OPT > "$S/runs/py-offline.out" || fail "py offline"
$JS offline $OPT > "$S/runs/js-offline.out" || fail "js offline"
$PY i1 $OPT || fail "py i1"; $JS i1 $OPT || fail "js i1"
$PY i2 $OPT || fail "py i2"; $JS i2 $OPT || fail "js i2"
$PY plan $OPT > "$S/runs/py-plan.out" || fail "py plan"; $JS plan $OPT > "$S/runs/js-plan.out" || fail "js plan"
cmp "$S/runs/py/ranges.tsv" "$S/runs/js/ranges.tsv" || fail "range lists differ"
$PY run $OPT > "$S/runs/py-run.out" || fail "py run"; $JS run $OPT > "$S/runs/js-run.out" || fail "js run"
$PY controls $OPT > "$S/runs/py-controls.out" || fail "py controls"; $JS controls $OPT > "$S/runs/js-controls.out" || fail "js controls"
$PY record $OPT --cert "$S/runs/cert.json" --spec "$S/runs/session8-edit-spec.json" --code "$S/runs/none"; REC=$?
"$PYTHON" -I - "$S" <<'EOF'
import json, sys, collections
S = sys.argv[1]
key = json.load(open(S + "/fx/answer-key.json"))
cert = json.load(open(S + "/runs/cert.json"))
r = {x["id"]: x.get("values") or {} for x in cert["rows"]}
got = {
 "W1_variance_dividing_by_n": r["W1"].get("variance_dividing_by_n"),
 "W2_sum_of_squares_rows_counted_from_0": r["W2"]["readings"]["rows_counted_from_0"]["sum_of_squares"],
 "W2_sum_of_squares_rows_counted_from_1": r["W2"]["readings"]["rows_counted_from_1"]["sum_of_squares"],
 "W3_largest_abs_rows_counted_from_0": r["W3"]["readings"]["rows_counted_from_0"]["largest_abs"],
 "W3_largest_abs_rows_counted_from_1": r["W3"]["readings"]["rows_counted_from_1"]["largest_abs"],
 "W5_base_median_lower_middle": r["W5"]["base"]["median_lower_middle"],
 "W4_M_abs_over_lower": r["W4"]["readings"]["abs_over_lower"]["M"],
 "W4_attained_by": r["W4"]["readings"]["abs_over_lower"]["attained_by"][0],
 "E4_edited_sha256_reading_a": r["E4"]["edited_sha256_all_tensors"]["a"],
 "E4_edited_sha256_reading_b": r["E4"]["edited_sha256_all_tensors"]["b"],
 "E4_entries_where_a_and_b_differ": r["E4"]["entries_where_two_readings_differ"].get("ab", 0),
 "E2_entries": r["E2"]["entries"],
}
bad = [k for k in key if got.get(k) != key[k]]
print("answer key: %d values, %d differ %s" % (len(key), len(bad), bad))
heads = collections.Counter()
for line in open(S + "/fx/requests.log"):
    q = json.loads(line)
    heads[(q["user_agent"], tuple(q["headers"]))] += 1
for (ua, hs), n in sorted(heads.items()):
    print("requests: %5d  user-agent %s  headers %s" % (n, ua, ",".join(hs)))
forbidden = [h for (_, hs) in heads for h in hs if h in ("cookie", "authorization", "referer", "from")]
print("headers that must not be sent:", forbidden or "none")
ok = not bad and not forbidden and cert["deciders"]["agree_on_every_row"] and cert["deciders"]["range_hashes_equal"] and cert["deciders"]["specification_bytes_identical"] and all(c["caught"] for c in cert["controls"].values())
print("DRY RUN", "PASSED" if ok else "FAILED")
sys.exit(0 if ok else 1)
EOF
