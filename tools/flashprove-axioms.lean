-- flashprove-axioms.lean — OUR file for step L3 of the FlashProve check (notes/flashprove-preregistration-2026-11-04.md):
-- the axioms of the six theorems the claim's README and lean/THEOREM.md name, of the theorem beneath `sound`, and of
-- the two at the stored setup. Run on the pod from the claim's lean/ directory with `lake env lean <this file>`; the
-- claim's own audit (scripts/Audit.lean.in, run by scripts/check.py) is not used.
import AtFullSide.Face.TheSixLines
import Johnson.Goal.Skeleton.SoundOfVerifyAt

#print axioms VerifiableInference.sound
#print axioms VerifiableInference.soundAndBinding
#print axioms VerifiableInference.completeOnCanServe
#print axioms VerifiableInference.zeroKnowledgeOnCanServe
#print axioms VerifiableInference.refusedHandsOutNoProof
#print axioms VerifiableInference.repliesFit
#print axioms VerifiableInference.sound_stored
#print axioms VerifiableInference.soundAndBinding_stored
#print axioms VerifierAndGoals.AtTheName.sound_of_verify_at
#check @VerifiableInference.sound
#check @VerifierAndGoals.AtTheName.sound_of_verify_at
#print VerifiableInference.Compilation.finalSoundnessError
