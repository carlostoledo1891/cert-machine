# A2, private: the second plant (P2), fixed before posting

No registered lower-bound proof uses Pinsker's KL >= 2 TV^2 or the mean interval 1/r in the planned form. Chosen
instead, in JOINT (gpt/joint-bound.md, the leading bound), the edge inequality behind (1):
  old:  J log(x/y)≥2J²/H on every edge.
  new:  J log(x/y)≥(5/2)J²/H on every edge, so (1) holds with 4g/5 in place of g.
Plant statement: JOINT sharpened, g >= 5 delta lambda^2 / [(1+tc)^2 - 4 lambda delta], at the target 0.29477...
Falsity check (step52.py in the private plants folder): at x = 2, y = 1 the claimed edge inequality reads
ln 2 >= 5/6, false (ln 2 = 0.6931..., 60-digit decimal ln); the original 2/3 <= ln 2 holds. The plant's conclusion
stays below the decided upper bound (0.456146), so only reading the step catches it.
