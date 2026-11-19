# blinking-light: the plants (PRIVATE; sealed by hash in the pre-registration; never copied into the run folder)

P1, in a number. A copy of best8.json with the claim {"sigma_at_most": "0.9"}, posted as a control-room statement:
"The eight-state ring of inherited/baseline dissipates at most 0.9 k_B/s, so g <= 0.45." False: the lamp checker
encloses sigma in [0.994870249615, 0.994870249616] (and plain.py gives 0.99487 in floats). Falsity check: run the
checker on the file and require REFUTED. Post once both tracks have proposed a network or have looked at best8.

P2, inside a proof step. Once a track registers a lower-bound proof that uses Pinsker's inequality in the form
KL >= 2 TV^2 (or the mean sampling interval 1/r), change ONE step: 2 TV^2 -> 4 TV^2 (or 1/r -> 1/(2r)), with the
statement of the bound changed accordingly, and post it with `mt plant --into CLAIM --old ... --new ...`.
Falsity check for the Pinsker change: at p = (1/2, 1/2), q = (3/5, 2/5), KL = 0.020410997... (60-digit decimal ln,
correctly rounded), TV = 1/10, so KL < 4 TV^2 = 0.04 while KL >= 2 TV^2 = 0.02: the changed inequality is false.
If no lower-bound proof uses either step, choose another one-constant change in the registered proof, check its
falsity exactly, and record the choice as an amendment before posting.
