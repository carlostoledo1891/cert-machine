# Issue on jasondavies/macmahon-min-universal-sets — DRAFT, the send is Carlos's word

Title: Your classification replayed and certified twice here, with no shared code (records attached)

Hi Jason,

I replayed your classification of the minimum universal sets independently, twice, and both came back certified. Posting
here so the result is on your record, in your format if you want it (Palomar-style), with the two records to attach.

**1. The sufficiency half, from your released witnesses, with my own geometry.** A standard-library checker that ignores
your rotation indices and slot order: it builds the 24 proper rotations from signed axis permutations of determinant +1,
the eight corner slots as the sign patterns of three axes, and decides each of your 300 constructions as a perfect
matching of cubes to slots with every exposed face the target's colour. All 300 build. Before that it decides that your
faceColours table lists all thirty varieties exactly once (30 rotation classes, equal to the classes of all 720 colourings),
and that the ten witnessed sets are exactly the ten two-triangle sets. Three red controls (a cube from outside the set, a
target with two faces exchanged, reflections admitted) each refuse.
Record: https://github.com/carlostoledo1891/cert-machine/blob/main/certs/macmahon-witnesses.json
Checker: https://github.com/carlostoledo1891/cert-machine/blob/main/instruments/macmahon/check.py

**2. The whole classification, through two kernels.** Your repository at d8856c9 (the commit the Palomar entry names),
built with its own toolchain on a GitHub runner, then leanprover/comparator v4.35.0 on the comparator.json you ship with
nanoda switched on: "Your solution is okay!", Lean's kernel and nanoda both accept the ten theorems, and `#print axioms`
from my own file names only propext, Classical.choice and Quot.sound (exposed_face_rule: propext alone). Cache 116 s,
build 207 s, comparator 347 s.
Record: https://github.com/carlostoledo1891/cert-machine/blob/main/certs/macmahon-kernel.json
Workflow: https://github.com/carlostoledo1891/cert-machine/blob/main/.github/workflows/macmahon-kernel.yml

**The statement, read against the paper.** Challenge.lean's Inventory : Pair → ℕ carries the "repeats allowed" of
Theorem 1; PhysicalBuilds is an injection of the eight slots into the stock with only exposed faces constrained; the
five auxiliary theorems certify the tables. I read it as the paper's theorem; the one step a reader takes on the paper's
word is the discrete model of the cubes itself, which the paper declares.

**What I do not claim.** Any independent proof of necessity beyond the kernels; priority; anything about how the proof
was found. The page with the gaps first: https://carlostoledo.co/reports/macmahon.html

Your scripts and search were read, never run; no code here derives from them. If anything above misreads your work,
tell me and I correct the page.

Carlos Toledo
