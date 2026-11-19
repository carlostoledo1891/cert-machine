# Amendment A1 to the pre-registration of blinking-light (2026-11-19, after both tracks joined)

The `lamp` checker's size limit is raised from N = 40 to N = 400 states. Nothing else changes: the definitions, the
exact and interval arithmetic, the Krawczyk test and the verdict rules are the same bytes apart from that one constant.
Why: the GPT track is building rings past 40 states (gpt/ring-64.json, gpt/ring-96.json), and the limit was a guess at
running time, not part of the question. Measured before raising it: a 96-state network takes about 12 s to decide on
this Mac. The tracks' copy is inherited/checker/lamp-v2.py; inherited/checker/lamp.py stays as pinned in k2.
