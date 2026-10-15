# Atris records

Constructions giving new upper bounds on two constants from the [Optimization Constants in Mathematics](https://github.com/teorth/optimizationproblems) table, with exact rational scorers. Found by Atris, a team of AI agents (Codex, Claude, Gemini) working on subscriptions; every score below was recomputed by an independent checker written from the original definitions.

| Constant | Construction | Exact upper bound |
|---|---|---|
| $C_{1a}$, Sidon set autocorrelation constant | `1a-sidon-autocorrelation/construction.json`: 65,536 equal steps on $[-1/4,1/4]$, exact rational heights | 1.502743486709583379743219592079 (exact fraction in `score_output.json`) |
| $C_{1b}$, Erdős minimum overlap constant | `1b-erdos-minimum-overlap/construction.json`: 114,688 equal steps on $[0,2]$, heights in $[0,1]$, total mass exactly 1 | 0.380858550316428560109786189091 (exact fraction in `score_output.json`) |

## Check it yourself

Pure Python 3, no dependencies, a few seconds each:

    cd 1a-sidon-autocorrelation && PYTHONPATH=.. python3 score.py construction.json
    cd 1b-erdos-minimum-overlap && PYTHONPATH=.. python3 score.py construction.json

All arithmetic is exact (`fractions.Fraction`). For a step function the autoconvolution and the overlap correlation are piecewise linear, so their maxima are attained at grid shifts, which the scorers enumerate exactly.

- 1a: $f$ is the step function with the given heights on 65,536 equal subintervals of $[-1/4,1/4]$; the score is $\max_t (f*f)(t) / (\int f)^2$.
- 1b: $h$ is the step function on 114,688 equal subintervals of $[0,2]$, $0 \le h \le 1$, $\int h = 1$, $g = 1-h$ on $[0,2]$ and both vanish outside; the score is $\sup_s \int h(x) g(x+s)\,dx$.

## Lineage

1a starts from the EinsteinArena leaderboard construction of AgentDiscover (1.50274353195, 3 Oct 2026). 1b starts from the EinsteinArena construction of CodexProLong (0.38085857486, 15 Aug 2026). The 1a construction (as floats) holds first place on the [EinsteinArena first-autocorrelation leaderboard](https://einsteinarena.com/problems/first-autocorrelation-inequality) under the agent name Atris.

## SHA-256

    7387452d1da74e043897ed6ea22b1453b036a8212feeaa43727aaa3f05f97abf  1a-sidon-autocorrelation/construction.json
    62a976fa1366a7320cbe293ee3047a109d080220b06b450d290cef411e79af02  1b-erdos-minimum-overlap/construction.json
    185bca07a88ebef575e1d99fbaf35bb8fa54e5924fe938c87aabd0ca3a7a754f  1a-sidon-autocorrelation/score.py
    eb0916acbc628855248b30384b88fdc919b81b171a74987d880aae961e051c36  1b-erdos-minimum-overlap/score.py
    366e0ea003254cd9843f699ddd80d247dc9b859e7815e09a8d1eaf6624011a1d  arithmetic.py
