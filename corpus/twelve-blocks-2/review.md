# A review of the first run's report

Written by a separate GPT chat (OpenAI family) for the operator on 2026-11-19, after the report
https://carlostoledo.co/reports/twelve-blocks.html went live. Pasted here as the operator gave it to the control room;
the link labels that followed some paragraphs are removed. What the control room checked of it is in GOAL.md.

---

The 51 ties are now a useful test case inside a much larger claim. I'd put the next effort into the step that says every
sufficiently good coloring must be close to the twelve blocks. That is what turns a search near a promising construction
into a statement about all colorings.

## 1. The period 1,096 is the smallest one arithmetic permits

There's a short deduction I'd put in the report. Let f(n) = 117n²/2192 − n/2. If the correction V(n) − f(n) eventually
has integer period T > 0, then f(n+T) − f(n) must be an integer for every sufficiently large n, because it equals
V(n+T) − V(n). Compare that integer at n+1 and n. Their difference is

    117T/1096.

Since 117 and 1,096 are coprime, every possible period must be a multiple of 1,096. Thus the models are proposing the
shortest possible period. This deduction uses only integrality and the proposed quadratic term. The existence of the
period is the hard part.

It also gives you a way to state the main claim without a 1,096-row table:

    V(n + 1096) = V(n) + 117n + 63,568      (n ≥ 92,000).

That suggests a proof question a combinatorialist could attack directly: can an optimal coloring be enlarged by one
period, and can every larger optimum be reduced again at exactly that cost? A reversible construction would explain the
recurrence and could also explain why the number of minimizers repeats.

## 2. I checked attainability in all 1,096 residue classes

The report's D10 checks 24 witnesses above the cutoff. I wrote a separate counter that groups same-color endpoints by run
and parity, then counts when their midpoint has the same color. I calibrated it against direct triple enumeration on every
coloring through length nine. I then reconstructed the table's witness at every length from 92,000 through 93,095. All
1,096 counts agree exactly. Each table value is therefore attainable at its tested length. The question of whether a
better coloring exists remains open in this replay.

I also checked a symmetry worth explaining: both the proposed correction and the proposed number of minimizers agree at
residues r and −r mod 1096, in every row. Reversing the order of the sites preserves the length, so ordinary reflection
alone doesn't explain this. I'd look for a map between the two residue classes in the proof's 22 integer boundary
variables. Such a map could explain the symmetry of the values and the multiplicities at once.

## 3. The most valuable outside review has a precise target

I'd give a reader the following question: Starting with an arbitrary binary coloring whose count is at most the rounded
baseline, prove that all changes needed to attain the minimum lie inside the stated boundary windows. Ask them to
reconstruct the argument from the continuum stability bound, the exact lattice correction, and the cost of removing an
outlying flip. This is where the unrefereed October result and the new finite argument meet. An outside derivation here
would do more for confidence in the main theorem than another sweep of periods.

For a smaller result that can stand independently, I'd target V(46) = 90. The eventual formula extrapolates correctly to
all 45 published exact values, as the run log already observed. I checked that its next five predictions also equal Rob
Pratt's published upper bounds: 90, 95, 100, 104, 110. The decisive deliverable at 46 is an independently checkable
certificate that no coloring has 89 or fewer. That would add an exact value even if the large-n proof later needs repair.

One edit I'd make now: the opening says the scaled result holds "from m = 118 on." That includes m = 119 and 121, which
the body explicitly leaves open. I'd use "for even m ≥ 118 and odd m ≥ 123" in the opening too.
