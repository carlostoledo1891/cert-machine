import RectChallenges.RectPlanted2
open Lean in
#eval show CoreM Unit from do
  let env ← getEnv
  for n in [`Rect.AlphaBounds, `Rect.DualExponentDiv, `Rect.alpha, `Rect.rectBound, `Rect.BorderRankRect, `Rect.rectExponent] do
    match env.find? n with
    | some (.defnInfo d) => IO.println s!"{n} hints={match d.hints with | .regular h => toString h | .abbrev => "abbrev" | .opaque => "opaque"} vhash={d.value.hash} thash={d.type.hash} all={d.all}"
    | _ => IO.println s!"{n} ?"
