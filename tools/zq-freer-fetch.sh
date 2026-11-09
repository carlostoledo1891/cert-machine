#!/bin/sh
# zq-freer-fetch.sh — fetch the pinned inputs of tools/zq-freer.js into a folder OUTSIDE cert-machine:
# a bare clone of elliotglazer/diophantine-z-q with the four PR heads, the fork's CI artifacts that carry the
# tables of #9, #11 and #12 (they are not committed), and the API metadata that binds runs and PRs to commits.
# Reads only; runs none of the repository's code. Needs git and an authenticated gh.
#
# usage: sh tools/zq-freer-fetch.sh /absolute/path/to/an/empty/folder
#        ZQ_FREER_DIR=/that/folder node tools/zq-freer.js --check                                           MIT
set -eu
D=${1:?usage: sh tools/zq-freer-fetch.sh /absolute/empty/folder}
mkdir -p "$D/ci/meta" "$D/meta"
git clone --quiet --bare https://github.com/elliotglazer/diophantine-z-q.git "$D/zq.git"
for n in 8 9 11 12 13; do git --git-dir "$D/zq.git" fetch --quiet origin "refs/pull/$n/head:refs/heads/pr$n"; done
F=cameronfreer/diophantine-z-q
get() { mkdir -p "$D/ci/$1"; gh run download "$2" -R "$F" -n "$3" -D "$D/ci/$1"; }
get pr8-42500725092 42500725092 conditional-quartic-389-receipts
get pr9-42500725633 42500725633 conditional-quartic-389-385-receipts
get pr9early-42440965320 42440965320 conditional-quartic-389-385-receipts
get pr11-42500730137 42500730137 conditional-quartic-389-385-chain-receipts
get pr11b-42500725279 42500725279 conditional-quartic-389-385-chain-receipts
get pr11early-42446323061 42446323061 conditional-quartic-389-385-chain-receipts
get pr12r-42500728544 42500728544 conditional-quartic-389-385-chain-receipts
get pr12-42500725217 42500725217 scalar-preparation-zero-receipts
get pr12b-42500728630 42500728630 scalar-preparation-zero-receipts
get pr12early-42447547426 42447547426 scalar-preparation-zero-receipts
for r in 42500725092 42500725633 42440965320 42500730137 42500725279 42446323061 42500728544 42500725217 42500728630 42447547426; do
  gh api "repos/$F/actions/runs/$r" > "$D/ci/meta/run-$r.json"
  gh api "repos/$F/actions/runs/$r/artifacts" > "$D/ci/meta/artifacts-$r.json"
done
for n in 8 9 11 12 13; do
  gh pr view "$n" -R elliotglazer/diophantine-z-q --json number,title,body,author,headRefOid,headRefName,baseRefOid,createdAt,updatedAt,commits,reviews,comments,state,isDraft > "$D/meta/pr-$n.json"
done
echo "fetched into $D; now: ZQ_FREER_DIR=$D node tools/zq-freer.js --check"
