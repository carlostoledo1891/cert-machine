#!/usr/bin/env bash
# A2 / P4′ — the orchestrator's replay, ATTEMPT 2 (2026-11-12). Attempt 1's clean build exited 1: "OAI: some modules have
# bad imports". Cause, the orchestrator's own packaging: the inputs were packed with macOS tar, which wrote one AppleDouble
# file (._X.lean) per file; unpacked on Linux they became 34 extra "modules" inside the OAI library's glob. Nothing of the
# port. Attempt 1's logs are kept whole in runs-attempt1/. Here: those files are listed and removed, the tree is compared
# with the manifest FILE BY FILE (find, not a shell glob — attempt 1's check used `*.lean`, which hides dotfiles), and
# every check starts again from `rm -rf .lake/build`.
source /root/one/scripts/common.sh
E=$(ls -d /root/one/A/*/percolation); O=/root/one/O/lean; cd $E
find . -path ./.lake -prune -o -name '._*' -print | sort > $R/appledouble-removed.txt; echo "AppleDouble files in E: $(wc -l < $R/appledouble-removed.txt)"
find . -path ./.lake -prune -o -name '._*' -exec rm -f {} +
rm -f comparator-ours.json comparator-openai.json
[ -f comparator.json ] || cp /root/one/cmp-aside/anthropic-comparator.json comparator.json
{
  echo "# ATTEMPT 2 — the tree, file by file ($(date -u +%FT%TZ))"
  echo "AppleDouble files left anywhere in E outside .lake: $(find . -path ./.lake -prune -o -name '._*' -print | wc -l)"
  echo "files under OAI/ and ComparatorChallenges/ (find): $(find OAI ComparatorChallenges -type f | wc -l) (expected 34 + 1)"
  ( find OAI ComparatorChallenges -type f | sort | xargs sha256sum ) > $R/E-port-files.sha256
  ( cd /root/one && grep -E '  envsaved/(OAI|ComparatorChallenges)/' INPUTS.sha256 | sed 's#  envsaved/#  #' | sort -k2 ) > $R/manifest-port-files.sha256
  cmp -s <(sort -k2 $R/E-port-files.sha256) $R/manifest-port-files.sha256 && echo "the port's files in E equal the home manifest: the same $(wc -l < $R/E-port-files.sha256) paths, the same sha256 each" || { echo "THE PORT'S FILES IN E DIFFER FROM THE MANIFEST"; diff <(sort -k2 $R/E-port-files.sha256) $R/manifest-port-files.sha256 | head -20; }
  echo "pinned OpenAI directory (find): $(find $O/OAI/Probability/CriticalZ3 -type f | wc -l) files; names equal to the port's: $(cmp -s <(cd $O && find OAI/Probability/CriticalZ3 -type f | sort) <(find OAI/Probability/CriticalZ3 -type f | sort) && echo yes || echo NO)"
  echo "top level of E against a fresh unpack of the tarball (names only in E):"; diff <(ls -A $(ls -d /root/one/A-ref/*/percolation) | sort) <(ls -A | grep -v '^\.lake$' | sort) | grep '^>' | tr '\n' ' '; echo
  echo "Anthropic's own files, E vs the fresh unpack (diff -rq, .lake and the nine added names excluded):"; diff -rq --exclude=.lake --exclude=OAI --exclude=ComparatorChallenges --exclude=Textbook.lean --exclude=BridgeA.lean --exclude=BridgeO.lean --exclude=OneLean.lean --exclude=OurChallenge.lean --exclude=ThetaAnchors.lean --exclude=PlantedFalse.lean $(ls -d /root/one/A-ref/*/percolation) $E; echo "(end)"
  echo "sha256: Textbook $(sha256sum < Textbook.lean | cut -c1-16)… BridgeA $(sha256sum < BridgeA.lean | cut -c1-16)… BridgeO $(sha256sum < BridgeO.lean | cut -c1-16)… comparator.json equal to the tarball's: $(cmp -s comparator.json $(ls -d /root/one/A-ref/*/percolation)/comparator.json && echo yes || echo NO)"
} > $R/CHECKS-attempt2.txt 2>&1
cat $R/CHECKS-attempt2.txt
echo "$(date -u +%FT%TZ) ATTEMPT 2 starts (attempt 1: E-clean-build exit 1, AppleDouble files of the orchestrator's tar; logs in runs-attempt1)" >> $R/TIMELINE
bash /root/one/scripts/e3-checks.sh > /root/one/e3.out 2>&1; echo "e3 exit $?"
bash /root/one/scripts/e4-red.sh > /root/one/e4.out 2>&1; echo "e4 exit $?"
echo "$(date -u +%FT%TZ) REPLAY DONE" | tee -a $R/TIMELINE
