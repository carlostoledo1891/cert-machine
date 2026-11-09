#!/bin/sh
# zq-freer-fetch.sh — fetch the pinned inputs of tools/zq-freer.js into a folder OUTSIDE cert-machine:
# a bare clone of elliotglazer/diophantine-z-q with the six PR heads (#8, #9, #11, #12, #13, #16) and the fork commit
# that #13's retained order-47 argument cites, the fork's CI artifacts that carry the tables of #9 through #16 (they are
# not committed), and the API metadata that binds runs and PRs to commits.
# Reads only; runs none of the repository's code. Needs git and an authenticated gh.
#
# usage: sh tools/zq-freer-fetch.sh /absolute/path/to/an/empty/folder
#        ZQ_FREER_DIR=/that/folder node tools/zq-freer.js --check                                           MIT
set -eu
D=${1:?usage: sh tools/zq-freer-fetch.sh /absolute/empty/folder}
mkdir -p "$D/ci/meta" "$D/meta"
git clone --quiet --bare https://github.com/elliotglazer/diophantine-z-q.git "$D/zq.git"
for n in 8 9 11 12 13 16; do git --git-dir "$D/zq.git" fetch --quiet origin "refs/pull/$n/head:refs/heads/pr$n"; done
git --git-dir "$D/zq.git" fetch --quiet https://github.com/cameronfreer/diophantine-z-q.git bc51100fd3ada82df0dac55d6f1d235219430c74:refs/heads/fork-bc51100f
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
get pr13-cube45-42501591301 42501591301 cubic-reuse-order-45
get pr13-cube47-42501591301 42501591301 cubic-reuse-order-47
get pr13r-cube45-42502112522 42502112522 cubic-reuse-order-45
get pr13r-cube47-42502112522 42502112522 cubic-reuse-order-47
get pr16-cube45-42537804191 42537804191 cubic-reuse-order-45
get pr16-cube47-42537804191 42537804191 cubic-reuse-order-47
get pr16r-cube45-42537807736 42537807736 cubic-reuse-order-45
get pr16r-cube47-42537807736 42537807736 cubic-reuse-order-47
get pr16-height45-42537804182 42537804182 height-consumers-order-45
get pr16-height47-42537804182 42537804182 height-consumers-order-47
get pr16r-height45-42537807726 42537807726 height-consumers-order-45
get pr16r-height47-42537807726 42537807726 height-consumers-order-47
get pr13-chain-42501591246 42501591246 conditional-quartic-389-385-chain-receipts
get pr13r-chain-42502112489 42502112489 conditional-quartic-389-385-chain-receipts
get pr16-chain-42537804236 42537804236 conditional-quartic-389-385-chain-receipts
get pr16r-chain-42537807727 42537807727 conditional-quartic-389-385-chain-receipts
get pr13-prep-42501591237 42501591237 scalar-preparation-zero-receipts
get pr13r-prep-42502112560 42502112560 scalar-preparation-zero-receipts
get pr16-prep-42537804187 42537804187 scalar-preparation-zero-receipts
get pr16r-prep-42537807728 42537807728 scalar-preparation-zero-receipts
for r in 42500725092 42500725633 42440965320 42500730137 42500725279 42446323061 42500728544 42500725217 42500728630 42447547426 \
         42501591301 42502112522 42537804191 42537807736 42537804182 42537807726 42501591246 42502112489 42537804236 42537807727 \
         42501591237 42502112560 42537804187 42537807728; do
  gh api "repos/$F/actions/runs/$r" > "$D/ci/meta/run-$r.json"
  gh api "repos/$F/actions/runs/$r/artifacts" > "$D/ci/meta/artifacts-$r.json"
done
for n in 8 9 11 12 13 16; do
  gh pr view "$n" -R elliotglazer/diophantine-z-q --json number,title,body,author,headRefOid,headRefName,baseRefOid,createdAt,updatedAt,commits,reviews,comments,state,isDraft > "$D/meta/pr-$n.json"
done
echo "fetched into $D; now: ZQ_FREER_DIR=$D node tools/zq-freer.js --check"
