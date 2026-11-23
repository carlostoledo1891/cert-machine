import R7ProductionData

/-! Local round-trip test of the exact constants used by no_r7_production. -/

private def exportLevels (n : Nat) (level : Fin n → Nat) : ByteArray := Id.run do
  let mut codes := ByteArray.emptyWithCapacity n
  for h : i in [:n] do
    codes := codes.push (level ⟨i, h.upper⟩).toUInt8
  return codes

def main (args : List String) : IO Unit := do
  let [records, levels] := args | throw (IO.userError "expected output paths for records and levels")
  IO.FS.writeBinFile records R7ProductionData.cfg
  IO.FS.writeBinFile levels (exportLevels _ R7ProductionData.level)
