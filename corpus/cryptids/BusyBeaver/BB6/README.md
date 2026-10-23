# Busy Beaver 6 Holdouts (`BusyBeaver/BB6/`)

This directory contains formal Lean 4 specifications and kernel-verified Collatz-like reductions for 53 Busy Beaver 6 (`BB(6)`, 6-state 2-symbol) holdout Turing machines. Each machine module exposes both **Level A** (`ps`, `is_closed_pattern_set`, `has_collatz_reduction`) and **Level B** (`State`, `start`, `encode`, `next`, `is_valid_acceleration`, `isHalt_iff_acceleration`), and each novel discovery module additionally exposes the higher-level Collatz-like acceleration (`HighLevelState`, `highLevelStart`, `highLevelEncode`, `highLevelNext`, `is_valid_highLevel_acceleration`, `isHalt_iff_highLevel_acceleration`, `acceleration_iff_highLevel_acceleration`); see [`BusyBeaver/README.md`](../README.md) for definitions of the behavioral predicates.

## Formalized `BB(6)` Machines

| Machine (`bbchallenge` RLE) | States | Symbols | Proved Properties | Wiki / Notes | Lean 4 Proof |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `1RB0LB_1LC0RE_1LA1LD_0LC---_0RB0RF_1RE1RB` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | [Wiki](https://wiki.bbchallenge.org/wiki/1RB0LB_1LC0RE_1LA1LD_0LC---_0RB0RF_1RE1RB) | [`M_1RB0LB_1LC0RE_1LA1LD_0LCHHH_0RB0RF_1RE1RB.lean`](./M_1RB0LB_1LC0RE_1LA1LD_0LCHHH_0RB0RF_1RE1RB.lean) |
| `1RB0LC_0LC0RF_1RD1LC_0RA1LE_---0LD_1LF1LA` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | [Wiki](https://wiki.bbchallenge.org/wiki/1RB0LC_0LC0RF_1RD1LC_0RA1LE_---0LD_1LF1LA) | [`M_1RB0LC_0LC0RF_1RD1LC_0RA1LE_HHH0LD_1LF1LA.lean`](./M_1RB0LC_0LC0RF_1RD1LC_0RA1LE_HHH0LD_1LF1LA.lean) |
| `1RB0LC_0LC1RF_1LE1RD_0RC1RC_0LA1LA_---1RA` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | [Wiki](https://wiki.bbchallenge.org/wiki/1RB0LC_0LC1RF_1LE1RD_0RC1RC_0LA1LA_---1RA) | [`M_1RB0LC_0LC1RF_1LE1RD_0RC1RC_0LA1LA_HHH1RA.lean`](./M_1RB0LC_0LC1RF_1LE1RD_0RC1RC_0LA1LA_HHH1RA.lean) |
| `1RB0LC_1LC0RD_1LF1LA_1LB1RE_1RB1LE_---0LE` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | [Wiki](https://wiki.bbchallenge.org/wiki/1RB0LC_1LC0RD_1LF1LA_1LB1RE_1RB1LE_---0LE) | [`M_1RB0LC_1LC0RD_1LF1LA_1LB1RE_1RB1LE_HHH0LE.lean`](./M_1RB0LC_1LC0RD_1LF1LA_1LB1RE_1RB1LE_HHH0LE.lean) |
| `1RB0LD_0RC1RB_0RD0RA_1LE0RD_1LF---_0LA1LA` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | [Wiki](https://wiki.bbchallenge.org/wiki/1RB0LD_0RC1RB_0RD0RA_1LE0RD_1LF---_0LA1LA) (BMO base-3) | [`M_1RB0LD_0RC1RB_0RD0RA_1LE0RD_1LFHHH_0LA1LA.lean`](./M_1RB0LD_0RC1RB_0RD0RA_1LE0RD_1LFHHH_0LA1LA.lean) |
| `1RB0LD_1LC0RA_1RA1LB_1LA1LE_1RF0LC_---0RE` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | [Wiki](https://wiki.bbchallenge.org/wiki/1RB0LD_1LC0RA_1RA1LB_1LA1LE_1RF0LC_---0RE) (BMO5) | [`M_1RB0LD_1LC0RA_1RA1LB_1LA1LE_1RF0LC_HHH0RE.lean`](./M_1RB0LD_1LC0RA_1RA1LB_1LA1LE_1RF0LC_HHH0RE.lean) |
| `1RB0LD_1LC1RA_1RA1LC_1LE1LA_0RF1LD_---1RE` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | [busycoq `CubicCapLoop_v2.v` (`TM1`)](https://github.com/ccz181078/busycoq/blob/BB6/verify/CubicCapLoop_v2.v) (**resolved non-halting**) | [`M_1RB0LD_1LC1RA_1RA1LC_1LE1LA_0RF1LD_HHH1RE.lean`](./M_1RB0LD_1LC1RA_1RA1LC_1LE1LA_0RF1LD_HHH1RE.lean) |
| `1RB0LD_1RC1RA_1LD0RB_1LE1LA_1RF0RC_---1RE` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | [Wiki](https://wiki.bbchallenge.org/wiki/1RB0LD_1RC1RA_1LD0RB_1LE1LA_1RF0RC_---1RE) | [`M_1RB0LD_1RC1RA_1LD0RB_1LE1LA_1RF0RC_HHH1RE.lean`](./M_1RB0LD_1RC1RA_1LD0RB_1LE1LA_1RF0RC_HHH1RE.lean) |
| `1RB0LD_1RC1RF_1LA0RA_0LA0LE_1LD1LA_0RB---` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | [Wiki](https://wiki.bbchallenge.org/wiki/1RB0LD_1RC1RF_1LA0RA_0LA0LE_1LD1LA_0RB---) | [`M_1RB0LD_1RC1RF_1LA0RA_0LA0LE_1LD1LA_0RBHHH.lean`](./M_1RB0LD_1RC1RF_1LA0RA_0LA0LE_1LD1LA_0RBHHH.lean) |
| `1RB0LE_0RC1RC_0RD1LA_1LD0LA_1LF1LC_---0LA` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | — | [`M_1RB0LE_0RC1RC_0RD1LA_1LD0LA_1LF1LC_HHH0LA.lean`](./M_1RB0LE_0RC1RC_0RD1LA_1LD0LA_1LF1LC_HHH0LA.lean) |
| `1RB0LE_0RC1RC_0RD1LA_1LD0LA_1LF1LC_---1LC` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | — | [`M_1RB0LE_0RC1RC_0RD1LA_1LD0LA_1LF1LC_HHH1LC.lean`](./M_1RB0LE_0RC1RC_0RD1LA_1LD0LA_1LF1LC_HHH1LC.lean) |
| `1RB0LE_1LC1RA_1RA1LD_0LC0LA_0RE1RF_0RC---` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | [Wiki (`User:RobinCodes/Next_Steps`)](https://wiki.bbchallenge.org/wiki/User:RobinCodes/Next_Steps) | [`M_1RB0LE_1LC1RA_1RA1LD_0LC0LA_0RE1RF_0RCHHH.lean`](./M_1RB0LE_1LC1RA_1RA1LD_0LC0LA_0RE1RF_0RCHHH.lean) |
| `1RB0LF_1LC0LD_1RD1LB_---1RE_0RA1RE_1LA0LE` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | — | [`M_1RB0LF_1LC0LD_1RD1LB_HHH1RE_0RA1RE_1LA0LE.lean`](./M_1RB0LF_1LC0LD_1RD1LB_HHH1RE_0RA1RE_1LA0LE.lean) |
| `1RB0LF_1LC1RA_0RE0RD_---1LE_1LF1RC_1LC1LA` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | — | [`M_1RB0LF_1LC1RA_0RE0RD_HHH1LE_1LF1RC_1LC1LA.lean`](./M_1RB0LF_1LC1RA_0RE0RD_HHH1LE_1LF1RC_1LC1LA.lean) |
| `1RB0LF_1RC1RA_0RD0RB_1LE---_0LA1LE_1RD1LA` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | — | [`M_1RB0LF_1RC1RA_0RD0RB_1LEHHH_0LA1LE_1RD1LA.lean`](./M_1RB0LF_1RC1RA_0RD0RB_1LEHHH_0LA1LE_1RD1LA.lean) |
| `1RB0RB_1LB0LC_1RD1LC_1RE0RA_0RF1RA_---1LB` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | [Wiki](https://wiki.bbchallenge.org/wiki/1RB0RB_1LB0LC_1RD1LC_1RE0RA_0RF1RA_---1LB) | [`M_1RB0RB_1LB0LC_1RD1LC_1RE0RA_0RF1RA_HHH1LB.lean`](./M_1RB0RB_1LB0LC_1RD1LC_1RE0RA_0RF1RA_HHH1LB.lean) |
| `1RB0RB_1LC1RE_1LF0LD_1RA1LD_1RC1RB_---1LC` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | [Wiki](https://wiki.bbchallenge.org/wiki/1RB0RB_1LC1RE_1LF0LD_1RA1LD_1RC1RB_---1LC) (*Space Needle* family) | [`M_1RB0RB_1LC1RE_1LF0LD_1RA1LD_1RC1RB_HHH1LC.lean`](./M_1RB0RB_1LC1RE_1LF0LD_1RA1LD_1RC1RB_HHH1LC.lean) |
| `1RB0RC_1LC1RE_1RA1LD_0LC0LA_1RF1RD_---0RD` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | — | [`M_1RB0RC_1LC1RE_1RA1LD_0LC0LA_1RF1RD_HHH0RD.lean`](./M_1RB0RC_1LC1RE_1RA1LD_0LC0LA_1RF1RD_HHH0RD.lean) |
| `1RB0RD_0RC1RE_1RD0LA_1LE1LC_1RF0LD_---0RA` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | [Wiki](https://wiki.bbchallenge.org/wiki/1RB0RD_0RC1RE_1RD0LA_1LE1LC_1RF0LD_---0RA) (*Lucy's Moonlight*) | [`M_1RB0RD_0RC1RE_1RD0LA_1LE1LC_1RF0LD_HHH0RA.lean`](./M_1RB0RD_0RC1RE_1RD0LA_1LE1LC_1RF0LD_HHH0RA.lean) |
| `1RB0RE_1LC0RA_1RF0RD_---1LE_0LB1LE_1LE1RC` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | — | [`M_1RB0RE_1LC0RA_1RF0RD_HHH1LE_0LB1LE_1LE1RC.lean`](./M_1RB0RE_1LC0RA_1RF0RD_HHH1LE_0LB1LE_1LE1RC.lean) |
| `1RB0RE_1LC1LD_0RA0LD_1LB0LA_1RF1RA_---1LB` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | [Wiki](https://wiki.bbchallenge.org/wiki/1RB0RE_1LC1LD_0RA0LD_1LB0LA_1RF1RA_---1LB) | [`M_1RB0RE_1LC1LD_0RA0LD_1LB0LA_1RF1RA_HHH1LB.lean`](./M_1RB0RE_1LC1LD_0RA0LD_1LB0LA_1RF1RA_HHH1LB.lean) |
| `1RB0RF_1RC1RF_1LD0LE_---1LC_1RA1LE_1LC1RB` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | [Wiki](https://wiki.bbchallenge.org/wiki/1RB0RF_1RC1RF_1LD0LE_---1LC_1RA1LE_1LC1RB) (Parity-Collatz) | [`M_1RB0RF_1RC1RF_1LD0LE_HHH1LC_1RA1LE_1LC1RB.lean`](./M_1RB0RF_1RC1RF_1LD0LE_HHH1LC_1RA1LE_1LC1RB.lean) |
| `1RB1LA_0LC0RC_1LE1RD_1RE1RC_1LF0LA_---1LE` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | [Wiki](https://wiki.bbchallenge.org/wiki/1RB1LA_0LC0RC_1LE1RD_1RE1RC_1LF0LA_---1LE) (*The Sheep Machine*) | [`M_1RB1LA_0LC0RC_1LE1RD_1RE1RC_1LF0LA_HHH1LE.lean`](./M_1RB1LA_0LC0RC_1LE1RD_1RE1RC_1LF0LA_HHH1LE.lean) |
| `1RB1LA_1LC0RE_1LF1LD_0RB0LA_1RC1RE_---0LD` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | [Wiki](https://wiki.bbchallenge.org/wiki/1RB1LA_1LC0RE_1LF1LD_0RB0LA_1RC1RE_---0LD) (*Space Needle* / BMO6) | [`M_1RB1LA_1LC0RE_1LF1LD_0RB0LA_1RC1RE_HHH0LD.lean`](./M_1RB1LA_1LC0RE_1LF1LD_0RB0LA_1RC1RE_HHH0LD.lean) |
| `1RB1LA_1LC0RE_1LF1LD_1RE0LC_1LB1RA_---0LA` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | — | [`M_1RB1LA_1LC0RE_1LF1LD_1RE0LC_1LB1RA_HHH0LA.lean`](./M_1RB1LA_1LC0RE_1LF1LD_1RE0LC_1LB1RA_HHH0LA.lean) |
| `1RB1LA_1RC1RE_1LD0RB_1LA0LC_0RF0RD_0RB---` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | [Wiki](https://wiki.bbchallenge.org/wiki/1RB1LA_1RC1RE_1LD0RB_1LA0LC_0RF0RD_0RB---) (*Pomme* / Baker machine; **resolved non-halting**) | [`M_1RB1LA_1RC1RE_1LD0RB_1LA0LC_0RF0RD_0RBHHH.lean`](./M_1RB1LA_1RC1RE_1LD0RB_1LA0LC_0RF0RD_0RBHHH.lean) |
| `1RB1LC_1LC1RD_1LA0LB_0RB1RE_1RF0RA_---0RC` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | [Wiki](https://wiki.bbchallenge.org/wiki/1RB1LC_1LC1RD_1LA0LB_0RB1RE_1RF0RA_---0RC) | [`M_1RB1LC_1LC1RD_1LA0LB_0RB1RE_1RF0RA_HHH0RC.lean`](./M_1RB1LC_1LC1RD_1LA0LB_0RB1RE_1RF0RA_HHH0RC.lean) |
| `1RB1LC_1RC0LD_1LA0RB_1LB1LE_1RF0LA_---0RE` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | [Wiki](https://wiki.bbchallenge.org/wiki/1RB1LC_1RC0LD_1LA0RB_1LB1LE_1RF0LA_---0RE) (redirects to BMO5) | [`M_1RB1LC_1RC0LD_1LA0RB_1LB1LE_1RF0LA_HHH0RE.lean`](./M_1RB1LC_1RC0LD_1LA0RB_1LB1LE_1RF0LA_HHH0RE.lean) |
| `1RB1LC_1RC0RF_1RD0LB_1RE0LD_1LF---_0RA1LA` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | — | [`M_1RB1LC_1RC0RF_1RD0LB_1RE0LD_1LFHHH_0RA1LA.lean`](./M_1RB1LC_1RC0RF_1RD0LB_1RE0LD_1LFHHH_0RA1LA.lean) |
| `1RB1LD_1RC0RA_1LA1RE_0LA0LB_0RB1RF_---1RD` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | — | [`M_1RB1LD_1RC0RA_1LA1RE_0LA0LB_0RB1RF_HHH1RD.lean`](./M_1RB1LD_1RC0RA_1LA1RE_0LA0LB_0RB1RF_HHH1RD.lean) |
| `1RB1LD_1RC1RE_0LA1LB_0LD1LC_1RF0RA_---0RC` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | [Wiki](https://wiki.bbchallenge.org/wiki/1RB1LD_1RC1RE_0LA1LB_0LD1LC_1RF0RA_---0RC) | [`M_1RB1LD_1RC1RE_0LA1LB_0LD1LC_1RF0RA_HHH0RC.lean`](./M_1RB1LD_1RC1RE_0LA1LB_0LD1LC_1RF0RA_HHH0RC.lean) |
| `1RB1LE_1LB1LC_1RD0LE_---0RB_1RF1LA_0RA0RD` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | [Wiki (`Cryptids`)](https://wiki.bbchallenge.org/wiki/Cryptids) | [`M_1RB1LE_1LB1LC_1RD0LE_HHH0RB_1RF1LA_0RA0RD.lean`](./M_1RB1LE_1LB1LC_1RD0LE_HHH0RB_1RF1LA_0RA0RD.lean) |
| `1RB1LE_1LC0RA_0RF0LD_1LE1LA_1RC0LB_---1RC` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | [Wiki](https://wiki.bbchallenge.org/wiki/1RB1LE_1LC0RA_0RF0LD_1LE1LA_1RC0LB_---1RC) (TMBR Aug 2025) | [`M_1RB1LE_1LC0RA_0RF0LD_1LE1LA_1RC0LB_HHH1RC.lean`](./M_1RB1LE_1LC0RA_0RF0LD_1LE1LA_1RC0LB_HHH1RC.lean) |
| `1RB1LE_1RC1RA_0LD1RB_1LE1LD_1RF0LA_---0RE` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | — | [`M_1RB1LE_1RC1RA_0LD1RB_1LE1LD_1RF0LA_HHH0RE.lean`](./M_1RB1LE_1RC1RA_0LD1RB_1LE1LD_1RF0LA_HHH0RE.lean) |
| `1RB1LF_0RC1RD_1LA1LD_1LE0RA_---1LC_0LA1LA` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | — | [`M_1RB1LF_0RC1RD_1LA1LD_1LE0RA_HHH1LC_0LA1LA.lean`](./M_1RB1LF_0RC1RD_1LA1LD_1LE0RA_HHH1LC_0LA1LA.lean) |
| `1RB1LF_1RC1RF_0LD1RE_---1LC_0RB1RE_1LA0LE` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | [Wiki (`User:RobinCodes/Next_Steps`)](https://wiki.bbchallenge.org/wiki/User:RobinCodes/Next_Steps) | [`M_1RB1LF_1RC1RF_0LD1RE_HHH1LC_0RB1RE_1LA0LE.lean`](./M_1RB1LF_1RC1RF_0LD1RE_HHH1LC_0RB1RE_1LA0LE.lean) |
| `1RB1RA_0LC0RE_1LF1LD_1LA0LA_1LC1RB_---1LC` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | — | [`M_1RB1RA_0LC0RE_1LF1LD_1LA0LA_1LC1RB_HHH1LC.lean`](./M_1RB1RA_0LC0RE_1LF1LD_1LA0LA_1LC1RB_HHH1LC.lean) |
| `1RB1RA_0LC1LE_1LD1LC_1LA0LB_1LF1RE_---0RA` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | [Wiki (`Antihydra`)](https://wiki.bbchallenge.org/wiki/Antihydra) (*Antihydra*) | [`M_1RB1RA_0LC1LE_1LD1LC_1LA0LB_1LF1RE_HHH0RA.lean`](./M_1RB1RA_0LC1LE_1LD1LC_1LA0LB_1LF1RE_HHH0RA.lean) |
| `1RB1RA_0RC1RC_1LD0LF_0LE1LE_1RA0LB_---0LC` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | [Wiki](https://wiki.bbchallenge.org/wiki/1RB1RA_0RC1RC_1LD0LF_0LE1LE_1RA0LB_---0LC) (*Counter6*) | [`M_1RB1RA_0RC1RC_1LD0LF_0LE1LE_1RA0LB_HHH0LC.lean`](./M_1RB1RA_0RC1RC_1LD0LF_0LE1LE_1RA0LB_HHH0LC.lean) |
| `1RB1RB_1LC0RE_---1LD_0RA1LB_1RA1LF_0LE1LE` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | — | [`M_1RB1RB_1LC0RE_HHH1LD_0RA1LB_1RA1LF_0LE1LE.lean`](./M_1RB1RB_1LC0RE_HHH1LD_0RA1LB_1RA1LF_0LE1LE.lean) |
| `1RB1RC_1LC1LC_1RE0LD_1LB1RF_---1RA_0RD1RD` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | — | [`M_1RB1RC_1LC1LC_1RE0LD_1LB1RF_HHH1RA_0RD1RD.lean`](./M_1RB1RC_1LC1LC_1RE0LD_1LB1RF_HHH1RA_0RD1RD.lean) |
| `1RB1RC_1LC1LE_1RA1RD_0RF0RE_1LA0LB_---1RA` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | [Wiki](https://wiki.bbchallenge.org/wiki/1RB1RC_1LC1LE_1RA1RD_0RF0RE_1LA0LB_---1RA) | [`M_1RB1RC_1LC1LE_1RA1RD_0RF0RE_1LA0LB_HHH1RA.lean`](./M_1RB1RC_1LC1LE_1RA1RD_0RF0RE_1LA0LB_HHH1RA.lean) |
| `1RB1RD_0LC1RA_0RA1LC_1RA1LE_1RF0LD_---0RE` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | — | [`M_1RB1RD_0LC1RA_0RA1LC_1RA1LE_1RF0LD_HHH0RE.lean`](./M_1RB1RD_0LC1RA_0RA1LC_1RA1LE_1RF0LD_HHH0RE.lean) |
| `1RB1RD_0LC1RA_1LA1LC_1RA1LE_1RF0LD_---0RE` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | — | [`M_1RB1RD_0LC1RA_1LA1LC_1RA1LE_1RF0LD_HHH0RE.lean`](./M_1RB1RD_0LC1RA_1LA1LC_1RA1LE_1RF0LD_HHH0RE.lean) |
| `1RB1RD_0LC1RA_1RA1LC_0RB1LE_1RF0LD_---0RE` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | — | [`M_1RB1RD_0LC1RA_1RA1LC_0RB1LE_1RF0LD_HHH0RE.lean`](./M_1RB1RD_0LC1RA_1RA1LC_0RB1LE_1RF0LD_HHH0RE.lean) |
| `1RB1RD_1LC0RD_1RF1RB_1LE0RA_0LB0LE_---0RC` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | [Wiki (`User:RobinCodes/Next_Steps`)](https://wiki.bbchallenge.org/wiki/User:RobinCodes/Next_Steps) | [`M_1RB1RD_1LC0RD_1RF1RB_1LE0RA_0LB0LE_HHH0RC.lean`](./M_1RB1RD_1LC0RD_1RF1RB_1LE0RA_0LB0LE_HHH0RC.lean) |
| `1RB1RE_1LC0RA_0RD1LB_---1RC_1LF1RE_0LB0LE` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | [Wiki](https://wiki.bbchallenge.org/wiki/1RB1RE_1LC0RA_0RD1LB_---1RC_1LF1RE_0LB0LE) (BMO1) | [`M_1RB1RE_1LC0RA_0RD1LB_HHH1RC_1LF1RE_0LB0LE.lean`](./M_1RB1RE_1LC0RA_0RD1LB_HHH1RC_1LF1RE_0LB0LE.lean) |
| `1RB1RE_1LC0RA_1RD0LB_1LB1RC_1LF0RD_---0LE` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | [Wiki](https://wiki.bbchallenge.org/wiki/1RB1RE_1LC0RA_1RD0LB_1LB1RC_1LF0RD_---0LE) | [`M_1RB1RE_1LC0RA_1RD0LB_1LB1RC_1LF0RD_HHH0LE.lean`](./M_1RB1RE_1LC0RA_1RD0LB_1LB1RC_1LF0RD_HHH0LE.lean) |
| `1RB1RE_1LC1LD_---1LA_1LB1LE_0RF0RA_1LD1RF` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | [Wiki](https://wiki.bbchallenge.org/wiki/1RB1RE_1LC1LD_---1LA_1LB1LE_0RF0RA_1LD1RF) (*HydraShift6*) | [`M_1RB1RE_1LC1LD_HHH1LA_1LB1LE_0RF0RA_1LD1RF.lean`](./M_1RB1RE_1LC1LD_HHH1LA_1LB1LE_0RF0RA_1LD1RF.lean) |
| `1RB1RF_0LC0RF_1RD1LC_---0LE_0RC1LF_1RA0LE` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | [Wiki](https://wiki.bbchallenge.org/wiki/1RB1RF_0LC0RF_1RD1LC_---0LE_0RC1LF_1RA0LE) | [`M_1RB1RF_0LC0RF_1RD1LC_HHH0LE_0RC1LF_1RA0LE.lean`](./M_1RB1RF_0LC0RF_1RD1LC_HHH0LE_0RC1LF_1RA0LE.lean) |
| `1RB1RF_1LC1LF_0RE1LD_0LB1LD_---1RC_1RA0RD` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | [Wiki](https://wiki.bbchallenge.org/wiki/1RB1RF_1LC1LF_0RE1LD_0LB1LD_---1RC_1RA0RD) | [`M_1RB1RF_1LC1LF_0RE1LD_0LB1LD_HHH1RC_1RA0RD.lean`](./M_1RB1RF_1LC1LF_0RE1LD_0LB1LD_HHH1RC_1RA0RD.lean) |
| `1RB1RF_1LC---_1LE1RD_1RA0RC_0LF0LA_0LD0RB` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | — | [`M_1RB1RF_1LCHHH_1LE1RD_1RA0RC_0LF0LA_0LD0RB.lean`](./M_1RB1RF_1LCHHH_1LE1RD_1RA0RC_0LF0LA_0LD0RB.lean) |
| `1RB---_1RC1LE_0RD0RF_0RE0LA_1LF0LB_1LA1LD` | `6` | `2` | `IsClosedPatternSet`, `HasCollatzReduction`, `IsValidAcceleration` | — | [`M_1RBHHH_1RC1LE_0RD0RF_0RE0LA_1LF0LB_1LA1LD.lean`](./M_1RBHHH_1RC1LE_0RD0RF_0RE0LA_1LF0LB_1LA1LD.lean) |

## High-Level Acceleration Equations

### [`1RB0LC_0LC1RF_1LE1RD_0RC1RC_0LA1LA_---1RA`](./M_1RB0LC_0LC1RF_1LE1RD_0RC1RC_0LA1LA_HHH1RA.lean)

We define the configuration for $a, k, c \ge 0$:

$$
E(a, k, c) := 0^\infty \ 1^a \ \mathrm{A}{>} \ 0 \ (11)^k \ 0 \ 1^c \ 0^\infty.
$$

Starting from $E(3, 0, 2)$ (reached after 23 steps from the blank tape), the machine follows the map $T$:

$$
T(E(a, k, c)) = \begin{cases}
  E(3, 0, a + 2) & \text{if } k = 0,\ c = 0, \\
  E(3, m, 2j + 1) & \text{if } a = 2m,\ k = 0,\ c = 2j + 1, \\
  E(4, m + 1, 2j + 1) & \text{if } a = 2m + 1,\ k = 0,\ c = 2j + 1, \\
  E(0, 1, 2m + 2) & \text{if } a = 2m,\ k = 0,\ c = 2, \\
  E(1, 1, 2m + 4) & \text{if } a = 2m + 1,\ k = 0,\ c = 2, \\
  E(3, m + 1, 2j + 2) & \text{if } a = 2m,\ k = 0,\ c = 2j + 4, \\
  E(4, m + 2, 2j + 2) & \text{if } a = 2m + 1,\ k = 0,\ c = 2j + 4, \\
  E(a + 3, m, 0) & \text{if } k = 1,\ c = 2m, \\
  \text{Halt} & \text{if } k = 1,\ c = 1, \\
  E(3, 0, a + 7) & \text{if } k = 1,\ c = 3, \\
  E(1, 1, 2m + 8) & \text{if } a = 2m,\ k = 1,\ c = 5, \\
  E(0, 1, 2m + 8) & \text{if } a = 2m + 1,\ k = 1,\ c = 5, \\
  E(4, m + 4, 2j + 2) & \text{if } a = 2m,\ k = 1,\ c = 2j + 7, \\
  E(3, m + 4, 2j + 2) & \text{if } a = 2m + 1,\ k = 1,\ c = 2j + 7, \\
  E(3, m + 1, 2k' + 1) & \text{if } a = 2m,\ k = k' + 2,\ c = 0, \\
  E(4, m + 2, 2k' + 1) & \text{if } a = 2m + 1,\ k = k' + 2,\ c = 0, \\
  E(a + 6, k', 2j + 1) & \text{if } k = k' + 2,\ c = 2j + 1, \\
  E(a + 3, 1, 2k' + 2) & \text{if } k = k' + 2,\ c = 2, \\
  E(a + 6, k' + 1, 2j + 2) & \text{if } k = k' + 2,\ c = 2j + 4.
\end{cases}
$$

### [`1RB0LE_0RC1RC_0RD1LA_1LD0LA_1LF1LC_---0LA`](./M_1RB0LE_0RC1RC_0RD1LA_1LD0LA_1LF1LC_HHH0LA.lean)

We define the configuration for $a, b, d \ge 0$ and $c \in \lbrace 0, 1 \rbrace$:

$$
D(a, b, c, d) := 0^\infty \ \mathrm{D}{>} \ (10)^a \ (110)^b \ 0^c \ 1^d \ 0^\infty.
$$

Starting from $D(0, 0, 0, 4)$ (reached after 6 steps from the blank tape), the machine follows the map $T$:

$$
\begin{aligned}
  T(D(a, b, 0, d)) &= \begin{cases}
    D(0, 0, 1, 1) & \text{if } a = 0,\ b = 0,\text{ and } d = 0, \\
    D(1, b-1, 1, 2) & \text{if } a = 0,\ b \ge 1,\text{ and } d = 0, \\
    B(a-1, 0, b, 0) & \text{if } a \ge 1 \text{ and } d = 0, \\
    D(0, 0, 0, 4) & \text{if } a = 0,\ b = 0,\text{ and } d = 1, \\
    B(a, 0, 0, 0) & \text{if } a \ge 1,\ b = 0,\text{ and } d = 1, \\
    D(a+2, b-1, 1, 3) & \text{if } b \ge 1 \text{ and } d = 1, \\
    D(1, b, 1, 2) & \text{if } a = 0 \text{ and } d = 2, \\
    B(a-1, 0, b+1, 0) & \text{if } a \ge 1 \text{ and } d = 2, \\
    D(a+2, b, 0, d-2) & \text{if } d \ge 3,
  \end{cases} \\
  T(D(a, b, 1, d)) &= \begin{cases}
    D(0, 0, 1, d+1) & \text{if } a = 0 \text{ and } b = 0, \\
    D(1, b-1, 1, d+2) & \text{if } a = 0 \text{ and } b \ge 1, \\
    B(a-1, 0, b, d) & \text{if } a \ge 1,
  \end{cases}
\end{aligned}
$$

where $B(a, k, b, d)$, $H(a, b, m)$, and $A(a, k, q, m)$ are defined recursively by:

$$
\begin{aligned}
  B(a, k, b+1, d) &= B(a, k+1, b, d+2), \\
  B(a, 0, 0, d) &= \begin{cases}
    D(0, 0, 0, d+4) & \text{if } a = 0, \\
    \text{Halt} & \text{if } a = 1, \\
    D(1, 2, 1, 2) & \text{if } a = 2 \text{ and } d = 0, \\
    D(2, 2, 0, d) & \text{if } a = 2 \text{ and } d \ge 1, \\
    H(a-3, 1, d+1) & \text{if } a \ge 3,
  \end{cases} \\
  B(a, k+1, 0, d) &= A(a, k, 0, d+3), \\
  H(a, b, m) &= \begin{cases}
    \text{Halt} & \text{if } a = 0 \text{ and } m \ne 1, \\
    D(1, b+1, 1, 5) & \text{if } a = 1 \text{ and } m = 0, \\
    D(a, b+1, 1, 5) & \text{if } a \ge 2 \text{ and } m = 0, \\
    D(a+2, b+1, 1, 2) & \text{if } m = 1, \\
    D(2, b+2, 1, 3) & \text{if } a = 1 \text{ and } m = 2, \\
    D(1, b+3, 1, 2) & \text{if } a = 1 \text{ and } m = 3, \\
    D(2, b+3, 0, m-3) & \text{if } a = 1 \text{ and } m \ge 4, \\
    H(a-2, b+2, m-2) & \text{if } a \ge 2 \text{ and } m \ge 2,
  \end{cases} \\
  A(a, k, q, m) &= \begin{cases}
    \text{Halt} & \text{if } a = 0 \text{ and } k = 0, \\
    D(1, q, 1, m+2) & \text{if } a = 1 \text{ and } k = 0, \\
    D(a, q, 1, m+2) & \text{if } a \ge 2 \text{ and } k = 0, \\
    D(1, q, 1, m) & \text{if } a = 0 \text{ and } k = 1, \\
    A(a-1, q, 0, m+2q+3) & \text{if } a \ge 1 \text{ and } k = 1, \\
    D(a+2, q, 1, m) & \text{if } k = 2, \\
    A(a, k-3, q+1, m) & \text{if } k \ge 3.
  \end{cases}
\end{aligned}
$$

### [`1RB0LE_0RC1RC_0RD1LA_1LD0LA_1LF1LC_---1LC`](./M_1RB0LE_0RC1RC_0RD1LA_1LD0LA_1LF1LC_HHH1LC.lean)

We define the configuration for $a, b, d \ge 0$ and $c \in \lbrace 0, 1 \rbrace$:

$$
D(a, b, c, d) := 0^\infty \ \mathrm{D}{>} \ (10)^a \ (110)^b \ 0^c \ 1^d \ 0^\infty.
$$

Starting from $D(0, 0, 0, 4)$ (reached after 6 steps from the blank tape), the machine follows the map $T$:

$$
\begin{aligned}
  T(D(a, b, 0, d)) &= \begin{cases}
    D(0, 0, 1, 1) & \text{if } a = 0,\ b = 0,\text{ and } d = 0, \\
    D(1, b-1, 1, 2) & \text{if } a = 0,\ b \ge 1,\text{ and } d = 0, \\
    B(a-1, 0, b, 0) & \text{if } a \ge 1 \text{ and } d = 0, \\
    D(0, 0, 0, 4) & \text{if } a = 0,\ b = 0,\text{ and } d = 1, \\
    B(a, 0, 0, 0) & \text{if } a \ge 1,\ b = 0,\text{ and } d = 1, \\
    D(a+2, b-1, 1, 3) & \text{if } b \ge 1 \text{ and } d = 1, \\
    D(1, b, 1, 2) & \text{if } a = 0 \text{ and } d = 2, \\
    B(a-1, 0, b+1, 0) & \text{if } a \ge 1 \text{ and } d = 2, \\
    D(a+2, b, 0, d-2) & \text{if } d \ge 3,
  \end{cases} \\
  T(D(a, b, 1, d)) &= \begin{cases}
    D(0, 0, 1, d+1) & \text{if } a = 0 \text{ and } b = 0, \\
    D(1, b-1, 1, d+2) & \text{if } a = 0 \text{ and } b \ge 1, \\
    B(a-1, 0, b, d) & \text{if } a \ge 1,
  \end{cases}
\end{aligned}
$$

where $B(a, k, b, d)$, $H(a, b, m)$, and $A(a, k, b, d)$ are defined recursively by:

$$
\begin{aligned}
  B(a, k, b+1, d) &= B(a, k+1, b, d+2), \\
  B(a, 0, 0, d) &= \begin{cases}
    D(0, 0, 0, d+4) & \text{if } a = 0, \\
    \text{Halt} & \text{if } a = 1, \\
    D(0, 2, 0, d+2) & \text{if } a = 2, \\
    H(a-3, 1, d+1) & \text{if } a \ge 3,
  \end{cases} \\
  B(a, k+1, 0, d) &= A(a, k, 0, d+3), \\
  H(a, b, m) &= \begin{cases}
    A(a, 0, b+1, 3) & \text{if } m = 0, \\
    D(a+2, b+1, 1, 2) & \text{if } m = 1, \\
    \text{Halt} & \text{if } a = 0 \text{ and } m \ge 2, \\
    D(2, b+2, 1, 3) & \text{if } a = 1 \text{ and } m = 2, \\
    D(1, b+3, 1, 2) & \text{if } a = 1 \text{ and } m = 3, \\
    D(2, b+3, 0, m-3) & \text{if } a = 1 \text{ and } m \ge 4, \\
    H(a-2, b+2, m-2) & \text{if } a \ge 2 \text{ and } m \ge 2,
  \end{cases} \\
  A(a, k, b, d) &= \begin{cases}
    \text{Halt} & \text{if } a = 0 \text{ and } k = 0, \\
    D(0, b+1, 1, d) & \text{if } a = 1 \text{ and } k = 0, \\
    A(a-2, 2, b, d+2) & \text{if } a \ge 2 \text{ and } k = 0, \\
    D(1, b, 1, d) & \text{if } a = 0 \text{ and } k = 1, \\
    A(a-1, b, 0, d+2b+3) & \text{if } a \ge 1 \text{ and } k = 1, \\
    D(a+2, b, 1, d) & \text{if } k = 2, \\
    A(a, k-3, b+1, d) & \text{if } k \ge 3.
  \end{cases}
\end{aligned}
$$

### [`1RB0LF_1LC0LD_1RD1LB_---1RE_0RA1RE_1LA0LE`](./M_1RB0LF_1LC0LD_1RD1LB_HHH1RE_0RA1RE_1LA0LE.lean)

We define the configuration for $b, k, c \ge 0$:

$$
A(b, k, c) := 0^\infty \ 1^b \ (01)^k \ \mathrm{F}{>} \ 00 \ 1^c \ 0^\infty.
$$

Starting from $A(5, 0, 2)$ (reached after 33 steps from the blank tape), the machine follows the map $T$:

$$
T(A(b, k, c)) = \begin{cases}
  A(4, 0, 3) & \text{if } b = 0,\ k = 0,\text{ and } c = 0, \\
  A(6, 0, 3) & \text{if } b \in \lbrace 1, 3 \rbrace,\ k = 0,\text{ and } c = 0, \\
  A(3, 0, 3) & \text{if } b = 2,\ k = 0,\text{ and } c = 0, \\
  \text{Halt} & \text{if } b = 4,\ k = 0,\text{ and } c = 0, \\
  A(b-4, 0, 5) & \text{if } b \ge 5,\ k = 0,\text{ and } c = 0, \\
  A(b, k-1, 1) & \text{if } k \ge 1 \text{ and } c = 0, \\
  A(2k+6, 0, 3) & \text{if } b = 0 \text{ and } c = 1, \\
  A(2k+8, 0, 3) & \text{if } b \in \lbrace 1, 3 \rbrace \text{ and } c = 1, \\
  \text{Halt} & \text{if } b = 4 \text{ and } c = 1, \\
  A(b-4, 0, 2k+7) & \text{if } b \ge 5 \text{ and } c = 1, \\
  A(5, 0, c-1) & \text{if } b = 2,\ k = 0,\text{ and } c \ge 1, \\
  F(k-1, 2, 0, 0, c-1) & \text{if } b = 2,\ k \ge 1,\text{ and } c \ge 1, \\
  A(1, k+1, c-2) & \text{if } b = 0 \text{ and } c \ge 2, \\
  A(1, k+2, c-2) & \text{if } b = 1 \text{ and } c \ge 2, \\
  A(b-2, k+2, c-2) & \text{if } b \ge 3 \text{ and } c \ge 2,
\end{cases}
$$

where $F(m, p, k, n, c)$ is defined recursively on $m$ (with $k' = k + 2n$):

$$
F(m, p, k, n, c) = \begin{cases}
  A(2k'+c+7, 0, 3) & \text{if } m = 0 \text{ and } p \le n+1, \\
  A(2(p-n-2)+1, 0, 2(k'+3)+c) & \text{if } m = 0 \text{ and } p \ge n+2, \\
  A(2(k'+4)+1, 0, c) & \text{if } m = 1 \text{ and } p \le n+1, \\
  F(0, p-n-2, 0, k'+3, c) & \text{if } m = 1 \text{ and } p \ge n+2, \\
  F(m-2, k'+4, 0, 0, c) & \text{if } m \ge 2 \text{ and } p \le n+1, \\
  F(m-1, p-n-2, 0, k'+3, c) & \text{if } m \ge 2 \text{ and } p \ge n+2.
\end{cases}
$$

### [`1RB0LF_1LC1RA_0RE0RD_---1LE_1LF1RC_1LC1LA`](./M_1RB0LF_1LC1RA_0RE0RD_HHH1LE_1LF1RC_1LC1LA.lean)

We define the configuration for $a \ge 0$, $b \ge 1$:

$$
C(a, b) := 0^\infty \ \mathrm{E}{>} \ (10)^a \ 1^b \ 0^\infty.
$$

Starting from $C(0, 3)$ (encoded as `.C 0 2`, reached after 7 steps from the blank tape), the machine follows the map $T$:

$$
T(C(a, b)) = \begin{cases}
  C(2a+2, b-2a-2) & \text{if } b > 2a+2, \\
  C(2, 2a+2) & \text{if } b = 1, \\
  \text{Halt} & \text{if } b = 2, \\
  C(\lfloor(6a+2k+2)/4\rfloor, (6a+2k+2) \bmod 4 + 1)
    & \text{if } a \ge 1,\ b = 2k,\ 2 \le k \le a+1, \\
  C(\lfloor(6a+2k+6)/4\rfloor, (6a+2k+6) \bmod 4 + 1)
    & \text{if } a \ge 1,\ b = 2k+1,\ 1 \le k \le a.
\end{cases}
$$

### [`1RB0LF_1RC1RA_0RD0RB_1LE---_0LA1LE_1RD1LA`](./M_1RB0LF_1RC1RA_0RD0RB_1LEHHH_0LA1LE_1RD1LA.lean)

We define the configuration for $u, v, w \ge 0$:

$$
J(u, v, w) := 0^\infty \ 1^5 \ (10)^u \ 1 \ \mathrm{A}{>} \ 11 \ (01)^v \ 1^w \ 01 \ 0^\infty.
$$

Starting from $J(0, 0, 0)$ (reached after 35 steps from the blank tape), the machine follows the map $T$:

$$
T(J(u, v, w)) = \begin{cases}
  J(0, 0, 2v+12) & \text{if } u = 0,\ w = 0,\ v \text{ is even}, \\
  J(2, 4, 2v+7) & \text{if } u = 0,\ w = 0,\ v \text{ is odd}, \\
  J(2, 4, 2v+9) & \text{if } u = 0,\ w = 1,\ v \text{ is even}, \\
  J(0, 0, 2v+14) & \text{if } u = 0,\ w = 1,\ v \text{ is odd}, \\
  J(2, v+4, 1) & \text{if } u = 0,\ w = 2,\ v \text{ is even}, \\
  J(0, v+4, 1) & \text{if } u = 0,\ w = 2,\ v \text{ is odd}, \\
  J(v+3, 0, w-3) & \text{if } u = 0,\ w \ge 3, \\
  J(0, 0, 2v+12) & \text{if } u = 1,\ w = 0, \\
  J(2, 4, 2u+2v+5) & \text{if } u \ge 2,\ w = 0,\ u \text{ is even}, \\
  J(0, 0, 2u+2v+10) & \text{if } u \ge 3,\ w = 0,\ u \text{ is odd}, \\
  \text{Halt} & \text{if } u = 1,\ w = 1, \\
  J(0, 0, 2v+10) & \text{if } u = 2,\ w = 1, \\
  J(2, u, 2v+5) & \text{if } u \ge 4,\ w = 1,\ u \text{ is even}, \\
  J(0, u, 2v+5) & \text{if } u \ge 3,\ w = 1,\ u \text{ is odd}, \\
  J(u-1, v+2, w-2) & \text{if } u \ge 1,\ w \ge 2.
\end{cases}
$$

### [`1RB0RC_1LC1RE_1RA1LD_0LC0LA_1RF1RD_---0RD`](./M_1RB0RC_1LC1RE_1RA1LD_0LC0LA_1RF1RD_HHH0RD.lean)

We define the configuration for $p \in \lbrace 0, 1 \rbrace$ and $k, j, c \ge 0$:

$$
S(p, k, j, c) := 0^\infty \ (1110)^p \ 1^k \ \mathrm{D}{>} \ 11 \ (01)^j \ 1^c \ 0^\infty.
$$

Starting from $S(0, 2, 0, 0)$ (reached after 10 steps from the blank tape), the machine follows the map $T$:

$$
T(S(p, k, j, c)) = \begin{cases}
  S(p, k', j + 2, c') & \text{if } k = k' + 3,\ c = c' + 1, \\
  S(p, k' + 1, 0, 2j + 5) & \text{if } k = k' + 3,\ c = 0, \\
  S(0, \Phi(j + 2, c')) & \text{if } p = 0,\ k = 2,\ c = c' + 1, \\
  S(0, 0, 0, 2j + 5) & \text{if } p = 0,\ k = 2,\ c = 0, \\
  S(0, \Phi(j + 1, c')) & \text{if } p = 0,\ k = 1,\ c = c' + 1, \\
  S(0, 0, 0, 2j + 3) & \text{if } p = 0,\ k = 1,\ c = 0, \\
  S(1, \Phi(j', c)) & \text{if } p = 0,\ k = 0,\ j = j' + 1, \\
  S(0, \Phi(0, c + 2)) & \text{if } p = 0,\ k = 0,\ j = 0, \\
  S(0, 1, j + 3, c') & \text{if } p = 1,\ k = 2,\ c = c' + 1, \\
  S(1, 0, 0, 2j + 5) & \text{if } p = 1,\ k = 2,\ c = 0, \\
  S(0, (3, 0, 0) + \Phi(j + 1, c')) & \text{if } p = 1,\ k = 1,\ c = c' + 1, \\
  S(0, 1, 1, 2j + 5) & \text{if } p = 1,\ k = 1,\ c = 0, \\
  S(0, 6, j' + 1, c) & \text{if } p = 1,\ k = 0,\ j = j' + 1, \\
  S(0, 2, 0, c + 2) & \text{if } p = 1,\ k = 0,\ j = 0,
\end{cases}
$$

where $\Phi(j, c)$ is defined by:

$$
\Phi(j, c) = \begin{cases}
  \text{Halt} & \text{if } j = 2m \text{ and } c = 0, \\
  (4m + 2, 0, 0) & \text{if } j = 2m \text{ and } c = 1, \\
  (4m + 2, 0, 3) & \text{if } j = 2m \text{ and } c = 2, \\
  (4m + 4, 0, c - 3) & \text{if } j = 2m \text{ and } c \ge 3, \\
  (4m + 4, 0, 1) & \text{if } j = 2m + 1 \text{ and } c = 0, \\
  (4m + 3, 0, c) & \text{if } j = 2m + 1 \text{ and } c \ge 1.
\end{cases}
$$

### [`1RB0RE_1LC0RA_1RF0RD_---1LE_0LB1LE_1LE1RC`](./M_1RB0RE_1LC0RA_1RF0RD_HHH1LE_0LB1LE_1LE1RC.lean)

We define the configuration for $b, k, c \ge 0$:

$$
A(b, k, c) := 0^\infty \ 1^c \ 0 \ \mathrm{A}{>} \ 0 \ (10)^k \ 1^b \ 0^\infty.
$$

Starting from $A(4, 0, 3)$ (reached after 27 steps from the blank tape), the machine follows the map $T$:

$$
T(A(b, k, c)) = \begin{cases}
  A(4, 0, 3) & \text{if } b = 0,\ k = 0,\text{ and } c = 0, \\
  A(6, 0, 3) & \text{if } b \in \lbrace 1, 3 \rbrace,\ k = 0,\text{ and } c = 0, \\
  A(3, 0, 3) & \text{if } b = 2,\ k = 0,\text{ and } c = 0, \\
  \text{Halt} & \text{if } b = 4,\ k = 0,\text{ and } c = 0, \\
  A(b-4, 0, 5) & \text{if } b \ge 5,\ k = 0,\text{ and } c = 0, \\
  A(b, k-1, 1) & \text{if } k \ge 1 \text{ and } c = 0, \\
  A(2k+6, 0, 3) & \text{if } b = 0 \text{ and } c = 1, \\
  A(2k+8, 0, 3) & \text{if } b \in \lbrace 1, 3 \rbrace \text{ and } c = 1, \\
  \text{Halt} & \text{if } b = 4 \text{ and } c = 1, \\
  A(b-4, 0, 2k+7) & \text{if } b \ge 5 \text{ and } c = 1, \\
  A(5, 0, c-1) & \text{if } b = 2,\ k = 0,\text{ and } c \ge 1, \\
  F(k-1, 2, 0, 0, c-1) & \text{if } b = 2,\ k \ge 1,\text{ and } c \ge 1, \\
  A(1, k+1, c-2) & \text{if } b = 0 \text{ and } c \ge 2, \\
  A(1, k+2, c-2) & \text{if } b = 1 \text{ and } c \ge 2, \\
  A(b-2, k+2, c-2) & \text{if } b \ge 3 \text{ and } c \ge 2,
\end{cases}
$$

where $F(m, p, k, n, c)$ is defined recursively on $m$ (with $k' = k + 2n$):

$$
F(m, p, k, n, c) = \begin{cases}
  A(2k'+c+7, 0, 3) & \text{if } m = 0 \text{ and } p \le n+1, \\
  A(2(p-n-2)+1, 0, 2(k'+3)+c) & \text{if } m = 0 \text{ and } p \ge n+2, \\
  A(2(k'+4)+1, 0, c) & \text{if } m = 1 \text{ and } p \le n+1, \\
  F(0, p-n-2, 0, k'+3, c) & \text{if } m = 1 \text{ and } p \ge n+2, \\
  F(m-2, k'+4, 0, 0, c) & \text{if } m \ge 2 \text{ and } p \le n+1, \\
  F(m-1, p-n-2, 0, k'+3, c) & \text{if } m \ge 2 \text{ and } p \ge n+2.
\end{cases}
$$

### [`1RB1LA_1LC0RE_1LF1LD_1RE0LC_1LB1RA_---0LA`](./M_1RB1LA_1LC0RE_1LF1LD_1RE0LC_1LB1RA_HHH0LA.lean)

We define the configuration for $a, b, c \ge 0$ and $d \in \lbrace 3, 6 \rbrace$:

$$
C(a, b, c, d) := 0^\infty \ 1^{a+1} \ \mathrm{C}{>} \ 00 \ 1^{b+4} \ (01)^c \ 1^d \ 011 \ 0^\infty,
$$

noting that at $c = 0$ the two families satisfy $C(a, b, 0, 6) = C(a, b+3, 0, 3)$.

Starting from $C(4, 0, 0, 3)$ (reached after 162 steps from the blank tape), the machine follows the map $T$:

$$
T(C(a, b, c, d)) = \begin{cases}
  C(a-2, b+3, c, d) & \text{if } a \ge 2, \\
  C(a+b+4, 3, c-2, d) & \text{if } a \le 1,\ c \ge 2, \\
  C(a+b+4, 0, 3, 3) & \text{if } a \le 1,\ c = 1,\ d = 6, \\
  C(a, 0, k+3, 3) & \text{if } a \le 1,\ b = 2k,\ c = 0,\ d = 3, \\
  \text{Halt} & \text{if } a = 0,\ b = 2k+1,\ c = 0,\ d = 3, \\
  C(6, 3, k, 3) & \text{if } a = 1,\ b = 2k+1,\ c = 0,\ d = 3, \\
  \text{Halt} & \text{if } a = 0,\ b = 2k,\ c = 0,\ d = 6, \\
  C(6, 3, k+1, 3) & \text{if } a = 1,\ b = 2k,\ c = 0,\ d = 6, \\
  C(a, 0, k+5, 3) & \text{if } a \le 1,\ b = 2k+1,\ c = 0,\ d = 6, \\
  C(a, 0, k+3, 6) & \text{if } a \le 1,\ b = 2k+1,\ c = 1,\ d = 3, \\
  \text{Halt} & \text{if } a = 0,\ b = 2k,\ c = 1,\ d = 3, \\
  C(6, 0, 3, 3) & \text{if } a = 1,\ b = 0,\ c = 1,\ d = 3, \\
  C(6, 3, k, 6) & \text{if } a = 1,\ b = 2k+2,\ c = 1,\ d = 3.
\end{cases}
$$

### [`1RB1LC_1RC0RF_1RD0LB_1RE0LD_1LF---_0RA1LA`](./M_1RB1LC_1RC0RF_1RD0LB_1RE0LD_1LFHHH_0RA1LA.lean)

We define the configurations for $n \ge 0$ (where $L(n) := 0^\infty \ (1100)^n$):

$$
\begin{aligned}
  R_1(n) &:= L(n) \ 100 \ \mathrm{A}{>} \ 0^\infty, \\
  R_2(n) &:= L(n) \ 100100 \ \mathrm{A}{>} \ 0^\infty, \\
  Q(n)   &:= L(n) \ 111100 \ \mathrm{A}{>} \ 0^\infty, \\
  S_4(n) &:= L(n) \ 111100100100 \ \mathrm{A}{>} \ 0^\infty, \\
  S_6(n) &:= L(n) \ 11111100100100 \ \mathrm{A}{>} \ 0^\infty.
\end{aligned}
$$

Starting from $S_6(1)$ (reached after 169 steps from the blank tape), the machine follows the map $T$ (with $w = \lfloor (n-1)/2 \rfloor = 5q + r$
for $n \ge 1$ and $r \in \lbrace 0, 1, 2, 3, 4 \rbrace$):

$$
\begin{aligned}
  T(R_1(n)) &= \begin{cases}
    R_1(4) & \text{if } n = 0, \\
    R_1(6) & \text{if } n = 1, \\
    R_1(n+5) & \text{if } n \ge 2,
  \end{cases} \\
  T(R_2(n)) &= \begin{cases}
    R_1(4) & \text{if } n = 0, \\
    R_1(31q + 8) & \text{if } n \ge 1 \text{ and } r = 0, \\
    R_2(31q + 11) & \text{if } n \ge 1 \text{ and } r = 1, \\
    Q(31q + 19) & \text{if } n \ge 1 \text{ and } r = 2, \\
    R_2(31q + 26) & \text{if } n \ge 1 \text{ and } r = 3, \\
    R_1(31q + 44) & \text{if } n \ge 1 \text{ and } r = 4,
  \end{cases} \\
  T(Q(0)) &= R_1(6), \quad T(S_4(0)) = R_1(10), \quad T(S_6(0)) = R_1(9), \quad T(S_6(1)) = R_2(23), \\
  T(Q(b+1)) &= \Phi_Q(2, b, 3), \quad T(S_4(b+1)) = \Phi_{S_4}(2, b, 3), \quad T(S_6(b+2)) = \Phi_{S_6}(2, b, 3),
\end{aligned}
$$

where for each $H \in \lbrace Q, S_4, S_6 \rbrace$, the scan transducer $\Phi_H(a, b, i)$ with prefix index
$i \in \lbrace 0, 1, 2, 3, 4, 5, 6 \rbrace$ (corresponding to `[0]`, `[0,0,1,0,1,0]`, `[0,0,1,0]`,
`[0,0,1,0,1,1,0]`, `[0,0]`, `[0,1,0]`, `[]`) is defined recursively on $b \ge 0$ (writing
$\lfloor (a + 3)/2 \rfloor = 5q + r$ with $r \in \lbrace 0, 1, 2, 3, 4 \rbrace$) by:

$$
\begin{aligned}
  \Phi_H(a, 0, i) &= \bigl(E_H^{(0)}(a)\bigr)_i, \\
  \Phi_H(a, 1, 0) &= E_H^{(1)}(a), \quad \Phi_H(a, 1, 2) = E_H^{(2)}(a), \\
  \Phi_H(a, b+2, 0) &= \Phi_H(31q + c_r, b, j_r), \quad
    (c_r, j_r) = \bigl((4, 0), (7, 5), (16, 4), (22, 2), (28, 1)\bigr)_r, \\
  \Phi_H(a, b+2, 2) &= \Phi_H(a + 5, b, 3), \\
  \Phi_H(a, b+1, i) &= \begin{cases}
    \Phi_H(a + 6, b, 0) & \text{if } i = 1, \\
    \Phi_H(a + 9, b, 4) & \text{if } i = 3, \\
    \Phi_H(a + 3, b, 5) & \text{if } i = 4, \\
    \Phi_H(a + 4, b, 6) & \text{if } i = 5, \\
    \Phi_H(a + 3, b, 0) & \text{if } i = 6,
  \end{cases}
\end{aligned}
$$

with base-case tables $E_H^{(0)}(a)$ (for $i = 0, \dots, 6$), $E_H^{(1)}(a)$, $E_H^{(2)}(a)$ and
tail maps $\tau_3(w), \tau_4(w), \tau_5(w)$ (writing $w = 5q + r$ with $r \in \lbrace 0, 1, 2, 3, 4 \rbrace$):

$$
\begin{aligned}
  E_Q^{(0)}(a) &= \bigl(R_1(a+4),\ S_6(a+6),\ R_2(a+4),\ S_6(a+8),\ R_1(a+4),\ S_6(a+5),\ S_6(a+3)\bigr), \\
  E_{S_4}^{(0)}(a) &= \bigl(R_2(a+7),\ R_1(a+9),\ R_1(a+9),\ S_4(a+9),\ R_1(a+11),\ Q(a+9),\ R_1(a+6)\bigr), \\
  E_{S_6}^{(0)}(a) &= \bigl(S_4(a+9),\ R_1(a+18),\ R_1(a+10),\ \text{Halt},\ R_2(a+11),\ R_1(a+14),\ R_1(a+15)\bigr), \\
  E_Q^{(1)}(a) &= S_6(a+2), \quad E_Q^{(2)}(a) = R_1(a+9), \\
  E_{S_4}^{(1)}(a) &= \tau_5(\lfloor (a+1)/2 \rfloor + 1), \quad E_{S_4}^{(2)}(a) = R_1(a+13), \\
  E_{S_6}^{(1)}(a) &= \tau_4(\lfloor (a+1)/2 \rfloor + 1), \quad E_{S_6}^{(2)}(a) = \tau_3(\lfloor (a+8)/2 \rfloor), \\
  \tau_3(5q + r) &= \bigl(R_1(31q+10),\ Q(31q+16),\ R_2(31q+23),\ \text{Halt},\ R_2(31q+37)\bigr)_r, \\
  \tau_4(5q + r) &= \bigl(R_1(31q+16),\ R_2(31q+15),\ R_1(31q+25),\ S_6(31q+28),\ R_2(31q+41)\bigr)_r, \\
  \tau_5(5q + r) &= \bigl(R_1(31q+12),\ R_1(31q+15),\ R_2(31q+26),\ Q(31q+34),\ R_1(31q+45)\bigr)_r.
\end{aligned}
$$

### [`1RB1LD_1RC0RA_1LA1RE_0LA0LB_0RB1RF_---1RD`](./M_1RB1LD_1RC0RA_1LA1RE_0LA0LB_0RB1RF_HHH1RD.lean)

We define the configuration for $a, b, d \ge 0$:

$$
C(a, b, d) := 0^\infty \ 1^a \ (10)^b \ \mathrm{A}{>} \ 1^d \ 0^\infty.
$$

Starting from $C(0, 0, 0)$ (the blank tape, 0 steps), the machine follows the map $T$:

$$
T(C(a, b, d)) = \begin{cases}
  C(a+1, 0, 2b+2) & \text{if } d = 0, \\
  C(a-3, b+2, d-1) & \text{if } a \ge 3,\ d \ge 1, \\
  C(0, b+1, d-1) & \text{if } a = 2,\ d \ge 1, \\
  C(1, b+3, d-1) & \text{if } a = 1,\ b \ge 1,\ d \ge 1, \\
  C(0, 0, d+2) & \text{if } a = 1,\ b = 0,\ d \ge 1, \\
  C(0, 2, 5) & \text{if } a = 0,\ b = 0,\ d = 1, \\
  C(0, 2, 2b+1) & \text{if } a = 0,\ b \ge 1,\ d = 1, \\
  C(3d-4, 3, 2b-2d+3) & \text{if } a = 0,\ d \ge 2,\ b \ge d-1, \\
  \text{Halt} & \text{if } a = 0,\ d = b+2, \\
  C(3b+2, 0, 6) & \text{if } a = 0,\ d = b+3, \\
  C(3b+4, 0, 4) & \text{if } a = 0,\ d = b+4, \\
  C(3b+3, 2, d-b-5) & \text{if } a = 0,\ d \ge b+5.
\end{cases}
$$

### [`1RB1LE_1RC1RA_0LD1RB_1LE1LD_1RF0LA_---0RE`](./M_1RB1LE_1RC1RA_0LD1RB_1LE1LD_1RF0LA_HHH0RE.lean)

We define the configuration for $a, b, c \ge 0$:

$$
E(a, b, c) := 0^\infty \ (10)^b \ (11)^{a+1} \ \mathrm{E}{>} \ 1^{c+1} \ 0^\infty.
$$

Starting from $E(1, 0, 2)$ (reached after 28 steps from the blank tape), the machine follows the map $T$:

$$
T(E(a, b, c)) = \begin{cases}
  E(a-1, b, 1) & \text{if } a \ge 1,\ c = 0, \\
  E(1, 0, 1) & \text{if } a = 0,\ b = 0,\ c = 0, \\
  E(1, 0, 2) & \text{if } a = 0,\ b = 1,\ c = 0, \\
  E(1, 0, 6) & \text{if } a = 0,\ b = 2,\ c = 0, \\
  E(1, b-3, 4) & \text{if } a = 0,\ b \ge 3,\ c = 0, \\
  E(1, 0, 2a+2c+1) & \text{if } b = 0,\ 1 \le c \le 2, \\
  \text{Halt} & \text{if } b = 0,\ c = 3, \\
  E(1, a+1, 2c-6) & \text{if } b = 0,\ 4 \le c \le 6, \\
  E(1, a+3, c-6) & \text{if } b = 0,\ c \ge 7, \\
  E(1, 0, 2a+2c+2) & \text{if } b = 1,\ 1 \le c \le 2, \\
  E(1, 2, 2a+2c) & \text{if } b = 2,\ 1 \le c \le 2, \\
  E(1, b-3, 2a+2c+4) & \text{if } b \ge 3,\ 1 \le c \le 2, \\
  E(a+2, b-1, c-2) & \text{if } b \ge 1,\ c \ge 3.
\end{cases}
$$

### [`1RB1LF_0RC1RD_1LA1LD_1LE0RA_---1LC_0LA1LA`](./M_1RB1LF_0RC1RD_1LA1LD_1LE0RA_HHH1LC_0LA1LA.lean)

We define the configuration for $a \ge 0$, $b \ge 6$:

$$
C(a, b) := 0^\infty \ 110 \ \mathrm{A}{>} \ (11)^a \ 0 \ 1^b \ 0^\infty.
$$

Starting from $C(0, 9)$ (encoded as `.C 0 3`, reached after 74 steps from the blank tape), the machine follows the map $T$:

$$
T(C(a, b)) = \begin{cases}
  C(k+1, 9) & \text{if } a = 0,\ b = 2k+6, \\
  C(a-k+3, 6k+12) & \text{if } a \ge 1,\ b = 2k+6,\ k \le a+2, \\
  \text{Halt} & \text{if } a \ge 1,\ b = 2k+6,\ k \in \lbrace a+3, a+4 \rbrace, \\
  C(k-a-4, 6a+33) & \text{if } a \ge 1,\ b = 2k+6,\ k \ge a+5, \\
  C(k-a, 6a+6) & \text{if } b = 2k+1,\ k > a, \\
  \text{Halt} & \text{if } b = 2k+1,\ a \in \lbrace k, k+1 \rbrace, \\
  C(a-k-1, 6k+9) & \text{if } b = 2k+1,\ a \ge k+2.
\end{cases}
$$

### [`1RB1RA_0LC0RE_1LF1LD_1LA0LA_1LC1RB_---1LC`](./M_1RB1RA_0LC0RE_1LF1LD_1LA0LA_1LC1RB_HHH1LC.lean)

We define the configuration for $a, k, d, c \ge 0$:

$$
C(a, k, d, c) := 0^\infty \ (10)^a \ (11)^k \ \mathrm{C}{>} \ (11)^d \ (10)^c \ 1111 \ 0^\infty.
$$

Starting from $C(0, 0, 0, 1)$ (reached after 27 steps from the blank tape), the machine follows the map $T$:

$$
T(C(a, k, d, c)) = \begin{cases}
  C(a, k - c, 0, d + 2c + 1) & \text{if } k \ge 1,\ k > c, \\
  C(a, 0, d + 2k, c - k) & \text{if } k \ge 1,\ k \le c, \\
  C(a', d + 1, 2, c') & \text{if } a = a' + 1,\ k = 0,\ c = c' + 2, \\
  C(a', d + 2, 0, 1) & \text{if } a = a' + 1,\ k = 0,\ c = 1, \\
  C(a', d + 2, 0, 0) & \text{if } a = a' + 1,\ k = 0,\ c = 0, \\
  C(d + 1, 0, 0, c' + 1) & \text{if } a = 0,\ k = 0,\ c = c' + 1, \\
  \text{Halt} & \text{if } a = 0,\ k = 0,\ c = 0.
\end{cases}
$$

### [`1RB1RB_1LC0RE_---1LD_0RA1LB_1RA1LF_0LE1LE`](./M_1RB1RB_1LC0RE_HHH1LD_0RA1LB_1RA1LF_0LE1LE.lean)

We define the configuration for $k \ge 1$, $m \ge 1$, $f \ge 1$:

$$
C(2k, 2m, f) := 0^\infty \ (11)^k \ 0 \ (11)^m \ 0 \ \mathrm{D}{>} \ 1 \ 1^f \ 0^\infty.
$$

Starting from $C(6, 2, 2)$ (encoded as `.C 2 0 1`, reached after 76 steps from the blank tape), the machine follows the map $T$:

$$
T(C(2k, 2m, f)) = \begin{cases}
  C(2, 2m-2k+2, f+6k-6) & \text{if } 2 \le k < m, \\
  C(2k-2m+2, 2, f+6m-6) & \text{if } 2 \le m < k, \\
  C(2, 2, f+6k-6) & \text{if } k = m \ge 2, \\
  C(2k-4, 2j+8, 2) & \text{if } k \ge 3,\ m = 1,\ f = 2j \text{ with } j \ge 1, \\
  C(2k-4, 2j+8, 5) & \text{if } k \ge 3,\ m = 1,\ f = 2j+1 \text{ with } j \ge 0, \\
  C(2j+4, 6, 5) & \text{if } k = 2,\ m = 1,\ f = 2j \text{ with } j \ge 1, \\
  C(2j+8, 2, 2) & \text{if } k = 2,\ m = 1,\ f = 2j+1 \text{ with } j \ge 0, \\
  C(2m-6, 2j+10, 5) & \text{if } k = 1,\ m \ge 4,\ f = 2j \text{ with } j \ge 1, \\
  C(2m-6, 2j+12, 2) & \text{if } k = 1,\ m \ge 4,\ f = 2j+1 \text{ with } j \ge 0, \\
  C(2j+10, 2, 2) & \text{if } k = 1,\ m = 3,\ f = 2j \text{ with } j \ge 1, \\
  C(2j+8, 6, 5) & \text{if } k = 1,\ m = 3,\ f = 2j+1 \text{ with } j \ge 0, \\
  \text{Halt} & \text{if } k = 1,\ m \in \lbrace 1, 2 \rbrace.
\end{cases}
$$

### [`1RB1RC_1LC1LC_1RE0LD_1LB1RF_---1RA_0RD1RD`](./M_1RB1RC_1LC1LC_1RE0LD_1LB1RF_HHH1RA_0RD1RD.lean)

We define the configuration for $a, b, c \ge 0$:

$$
C(a, b, c) := 0^\infty \ 1^{a+2} \ \mathrm{E}{>} \ 1^{2b+2} \ 0 \ 1^{2c+2} \ 0^\infty.
$$

Starting from $C(5, 2, 0)$ (reached after 100 steps from the blank tape), the machine follows the map $T$:

$$
T(C(a, b, c)) = \begin{cases}
  \text{Halt} & \text{if } b = 0,\ c = 0, \\
  C(5, 2, k + 1) & \text{if } a = 2k,\ b = 0,\ c = 1, \\
  C(2, 0, k + 3) & \text{if } a = 2k + 1,\ b = 0,\ c = 1, \\
  C(2, k + 3, d) & \text{if } a = 2k,\ b = 0,\ c = d + 2, \\
  C(5, k + 3, d) & \text{if } a = 2k + 1,\ b = 0,\ c = d + 2, \\
  C(a + 3, 0, b') & \text{if } b = b' + 1,\ c = 0, \\
  C(a + 6, b', c') & \text{if } b = b' + 1,\ c = c' + 1.
\end{cases}
$$

### [`1RB1RD_0LC1RA_0RA1LC_1RA1LE_1RF0LD_---0RE`](./M_1RB1RD_0LC1RA_0RA1LC_1RA1LE_1RF0LD_HHH0RE.lean)

We define the configuration for $a, w \ge 0$ and $b \ge 1$ (with $b$ odd when $a \ge 1$):

$$
D(a, b, w) := 0^\infty \ (10)^a \ 1^b \ \mathrm{D}{>} \ 1^{w+1} \ 0^\infty.
$$

Starting from $D(0, 1, 1)$ (reached after 13 steps from the blank tape), the machine follows the map $T$:

$$
T(D(a, b, w)) = \begin{cases}
  D(0, 1, 2k + 2w + 2) & \text{if } a = 0,\ b = 2k + 1,\ w \le 1, \\
  D(0, 2k + 4, w') & \text{if } a = 0,\ b = 2k + 1,\ w = w' + 2, \\
  \text{Halt} & \text{if } a = 0,\ b = 2k + 2,\ w = 0, \\
  D(k + 1, 1, 2w - 1) & \text{if } a = 0,\ b = 2k + 2,\ 1 \le w \le 3, \\
  D(k + 1, 5, w') & \text{if } a = 0,\ b = 2k + 2,\ w = w' + 4, \\
  D(a', 1, 2k + 2w + 3) & \text{if } a = a' + 1,\ b = 2k + 1,\ w \le 1, \\
  D(a', 2k + 5, w') & \text{if } a = a' + 1,\ b = 2k + 1,\ w = w' + 2.
\end{cases}
$$

### [`1RB1RD_0LC1RA_1LA1LC_1RA1LE_1RF0LD_---0RE`](./M_1RB1RD_0LC1RA_1LA1LC_1RA1LE_1RF0LD_HHH0RE.lean)

We define the configuration for $a, c \ge 0$:

$$
P_1(a, c) := 0^\infty \ 1^a \ \mathrm{A}{>} \ 1^c \ 0^\infty.
$$

Starting from $P_1(2, 1)$ (reached after 6 steps from the blank tape), the machine follows the map $T$:

$$
T(P_1(a, c)) = \begin{cases}
  P_1(2, a+1) & \text{if } c = 0, \\
  P_1(a+2, 0) & \text{if } c = 1, \\
  P_1(a+3, c-2) & \text{if } c \ge 2 \text{ and } a \text{ is even}, \\
  \text{Halt} & \text{if } c = 2 \text{ and } a \text{ is odd}, \\
  F(\lfloor a/2 \rfloor, 1, 0) & \text{if } c = 3 \text{ and } a \text{ is odd}, \\
  F(\lfloor a/2 \rfloor, 2, c-4) & \text{if } c \ge 4 \text{ and } a \text{ is odd},
\end{cases}
$$

where $F(k, m, c)$ is defined recursively by:

$$
F(k, m, c) = \begin{cases}
  P_1(0, 2m+3) & \text{if } k = 0 \text{ and } c = 0, \\
  F(k-1, 0, 2m+3) & \text{if } k \ge 1 \text{ and } c = 0, \\
  F(k, m+1, 0) & \text{if } c = 1, \\
  P_1(2m+4, c-2) & \text{if } k = 0 \text{ and } c \ge 2, \\
  F(k-1, m+2, c-2) & \text{if } k \ge 1 \text{ and } c \ge 2.
\end{cases}
$$

### [`1RB1RD_0LC1RA_1RA1LC_0RB1LE_1RF0LD_---0RE`](./M_1RB1RD_0LC1RA_1RA1LC_0RB1LE_1RF0LD_HHH0RE.lean)

We define the configuration for $a, w \ge 0$ and $z \ge 1$ (with $z$ odd when $a \ge 1$):

$$
D_1(a, z, w) := 0^\infty \ (10)^a \ 1^z \ \mathrm{D}{>} \ 1 \ 1^w \ 0^\infty.
$$

Starting from $D_1(0, 2, 2)$ (reached after 16 steps from the blank tape), the machine follows the map $T$:

$$
T(D_1(a, z, w)) = \begin{cases}
  D_1(0, 2, 2k + 2w + 2) & \text{if } a = 0,\ z = 2k + 1,\ w \le 1, \\
  D_1(0, 2k + 4, w') & \text{if } a = 0,\ z = 2k + 1,\ w = w' + 2, \\
  \text{Halt} & \text{if } a = 0,\ z = 2k + 2,\ w = 0, \\
  D_1(k, 3, 2w - 1) & \text{if } a = 0,\ z = 2k + 2,\ 1 \le w \le 3, \\
  D_1(k + 1, 5, w') & \text{if } a = 0,\ z = 2k + 2,\ w = w' + 4, \\
  D_1(0, 2, 2k + 2w + 3) & \text{if } a = 1,\ z = 2k + 1,\ w \le 1, \\
  D_1(a', 3, 2k + 2w + 3) & \text{if } a = a' + 2,\ z = 2k + 1,\ w \le 1, \\
  D_1(a', 2k + 5, w') & \text{if } a = a' + 1,\ z = 2k + 1,\ w = w' + 2.
\end{cases}
$$

### [`1RB1RF_1LC---_1LE1RD_1RA0RC_0LF0LA_0LD0RB`](./M_1RB1RF_1LCHHH_1LE1RD_1RA0RC_0LF0LA_0LD0RB.lean)

We define the configuration for $a, b, c \ge 0$:

$$
P_2(a, b, c) := 0^\infty \ 11 \ (01)^b \ (10)^a \ 1 \ \mathrm{D}{>} \ (10)^c \ 1111 \ 0^\infty.
$$

Starting from $P_2(2, 1, 0)$ (reached after 73 steps from the blank tape), the machine follows the map $T$:

$$
T(P_2(a, b, c)) = \begin{cases}
  P_2(2, b+2-a, 2a+2) & \text{if } c = 0 \text{ and } a \le b+1, \\
  P_2(2, 1, 2a+2) & \text{if } c = 0,\ a \ge b+2,\text{ and } a - b \text{ is odd}, \\
  P_2(2, 0, 2a+2) & \text{if } c = 0,\ a \ge b+2,\text{ and } a - b \text{ is even}, \\
  P_2(2, 0, a+4) & \text{if } b = 0 \text{ and } c = 1, \\
  \text{Halt} & \text{if } b = 0 \text{ and } c = 2, \\
  P_2(2, a+2, c-3) & \text{if } b = 0 \text{ and } c \ge 3, \\
  P_2(a+2, b-1, c-1) & \text{if } b \ge 1 \text{ and } c \ge 1.
\end{cases}
$$

### [`1RB---_1RC1LE_0RD0RF_0RE0LA_1LF0LB_1LA1LD`](./M_1RBHHH_1RC1LE_0RD0RF_0RE0LA_1LF0LB_1LA1LD.lean)

We define the configuration for $a, b, c, d \ge 0$:

$$
P_1(a, b, c, d) := 0^\infty \ 1^b \ (01)^a \ 1 \ \mathrm{C}{>} \ (01)^c \ 1 \ (01)^d \ 1 \ 0^\infty.
$$

Starting from $P_1(1, 4, 1, 1)$ (reached after 70 steps from the blank tape), the machine follows the map $T$:

$$
T(P_1(a, b, c, d)) = \begin{cases}
  P_1(k+c+1, 4, 1, 1) & \text{if } a = 0,\ b = 2k,\text{ and } d = 0, \\
  P_1(k+c, 4, 1, 2) & \text{if } a = 0,\ b = 2k+1,\text{ and } d = 0, \\
  P_1(c, 4, 1, 2) & \text{if } a = 1,\ b = 0,\text{ and } d = 0, \\
  P_1(0, 0, 1, c+2) & \text{if } a = 1,\ b = 1,\text{ and } d = 0, \\
  P_1(c+3, 4, 1, 1) & \text{if } a = 1,\ b = 2,\text{ and } d = 0, \\
  \text{Halt} & \text{if } a = 1,\ b \ge 3,\text{ and } d = 0, \\
  P_1(a-2, b, 1, c+2) & \text{if } a \ge 2 \text{ and } d = 0, \\
  \text{Halt} & \text{if } a = 0,\ b = 0,\ c = 0,\text{ and } d \ge 1, \\
  F(c-1, 1, d+1) & \text{if } a = 0,\ b = 0,\ c \ge 1,\text{ and } d \ge 1, \\
  F(k+c, 1, d+1) & \text{if } a = 0,\ b = 2k+2,\text{ and } d \ge 1, \\
  P_1(0, 0, k+c+2, d-1) & \text{if } a = 0,\ b = 2k+1,\text{ and } d \ge 1, \\
  P_1(a-1, b, c+2, d-1) & \text{if } a \ge 1 \text{ and } d \ge 1,
\end{cases}
$$

where $F(m, c, d)$ is defined by:

$$
F(m, c, d) = \begin{cases}
  P_1(2m+c+1, 4, 1, d+1-m) & \text{if } m \le d, \\
  P_1(2m+c+1, 4, 1, 2) & \text{if } m > d \text{ and } m - d \text{ is odd}, \\
  P_1(2m+c+1, 4, 1, 1) & \text{if } m > d \text{ and } m - d \text{ is even}.
\end{cases}
$$
