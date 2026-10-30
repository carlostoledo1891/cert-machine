Tell us about your interest in &Truth, your qualifications, and what you would contribute.

I have spent 2026 doing, by hand and in public, a small version of what &Truth is building: checking what AI systems
claim, with proofs anyone can re-run.

The work is cert-machine, an independent verification system I built and run alone. It decides machine-generated
claims in exact arithmetic or in Lean, with code that shares nothing with the claimant, and publishes each verdict as a
certificate: certified, refuted with the object that breaks it, or refused with the reason. I replayed OpenAI's
416 Lean challenges under a second, independent kernel (398 accepted by both, none rejected) and read every statement
against its claim: 34 of 242 formalized families prove a weaker theorem than their headline says. When OpenAI and
Anthropic each published a Lean refutation of the Exponential Time Hypothesis, I replayed both under two kernels and a
fresh environment, wrote one model-generic ETH in Lean and proved each lab's statement refutes it in its own machine
model. The verifier is attacked first: 572 planted forgeries, zero false certifications.

That work taught me where verification breaks in practice. Rarely in the kernel; usually in the statement — a proof
that checks, of the wrong theorem — and in the last mile, where a correct proof reaches a person who cannot tell what it
rests on. So I also build the product side: verified tools people use (a re-performance of every Brazilian Treasury
bond price since 2004; an offshore operating-window app built with an industrial partner), and a visual grammar,
enforced by the build, in which every mark says whether it was decided, computed, chosen or refused.

What I would contribute: statement fidelity as a first-class check, not an afterthought; independent replay and
adversarial red controls, so the verification layer never certifies what it should refuse; and the forward-deployed
and developer-experience work that turns "proven" into something a customer can read and trust. I learn fast in new
domains and ship end to end.

I am based in Florianópolis, Brazil (UTC−3), open to relocating to Palo Alto with sponsorship, or to start remotely.
Everything above is public and re-runnable: carlostoledo.co and github.com/carlostoledo1891/cert-machine.
