# Cover note — Task Development Engineer, METR (DRAFT 2026-09-22; a SEND)

Written for: the METR hiring team reading the Task Development Engineer applications (posting b4812bf4; Berkeley, on-site; contractor arrangements discussable).

---

I build evaluation tasks whose grader is an exact verifier: no answer key, no judge model, no tolerance. That is the property your posting asks for in three places — tasks that stay hard as models improve, QA that catches misspecification, and baselining — and it is the one thing I have spent this year making concrete in public.

**Tasks.** Three environments on the Prime Intellect hub (`carlos-toledo/blind-spot`, `break-the-grader`, `lattice-claims`), each verified from the registry in a clean install and run against live models. blind-spot is the one closest to your work: a model is handed a mutated RTL netlist (yosys mutants of a comparator, SAT-labelled: 348 killable with a verified witness, 51 proved equivalent) and must name input pairs that kill the mutant or prove it equivalent; a kill is verified by simulating the netlist, equivalence against the SAT proof. Three rungs (the defect named; only its testbench profile; nothing) make a difficulty ladder that separated Opus, Sonnet and Haiku cleanly. It ships as an Inspect task whose scorer is the verifiers rubric's own function, with a battery proving both frameworks grade every one of the 400 pooled mutants identically. Human baselines are the next step and the protocol is written; the recruiting is in progress.

**QA and misspecification.** I re-decided GSM8K's answer key mechanically — every calculator annotation and prose step of the 8,792 keys evaluated exactly: the arithmetic is clean where humans looked and slips where no model disagreed (two test keys print a step that does not hold, both in items GSM8K-Platinum never inspected because every model got them right); Platinum's ten relabellings all have arithmetic that holds, so they are readings, not sums. That is what "spot misspecifications and ambiguity, fiddly minutiae" looks like as an artifact, and it took three seconds per run once built. The same method earlier re-decided 176 printed counts of a published engineering benchmark and 20 AI-generated "new SOTA" constructions.

**Time Horizons.** I re-implemented your Time Horizon 1.1 estimator in standard-library Python with the optimum certified: all 44 fits on your public runs and site files proved to hold one optimum in a box below 10⁻¹⁰, your printed coefficients the rounding of the box for 22 of 23 models, your doubling time re-derived to the printed digit (128.74 days). The instrument exists to put a time-horizon number on judge-free tasks; your published data was the calibration.

**Inspect.** The blind-spot Inspect task, its battery and its ledger are in the repository; the rest of the machine is ~90 gated batteries with red controls that must fire on every build, because a check that has never gone red is decorative.

I am in Brazil. [OPERATOR FILLS: relocation stance — Berkeley on-site, or the contractor arrangement the posting mentions.] I would be glad to do the take-home on any task you choose.

Carlos Toledo · carlos@carlostoledo.co · carlostoledo.co

---
Links (all public): carlostoledo.co/reports/time-horizon.html · carlostoledo.co/reports/gsm8k-audit.html · carlostoledo.co/instruments/blind-spot · github.com/carlostoledo1891/cert-machine (environments/blind_spot/inspect)
