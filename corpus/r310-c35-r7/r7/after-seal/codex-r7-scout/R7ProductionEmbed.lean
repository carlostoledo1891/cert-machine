import Lean

/-! Source-relative literal readers for the two production inputs. -/

namespace R7ProductionData
abbrev recordCount : Nat := 977008

private def dataDir : Lean.Elab.Term.TermElabM System.FilePath := do
  let file := System.FilePath.mk (← readThe Lean.Core.Context).fileName
  let some dir := file.parent | throwError "cannot locate source directory of {file}"
  return dir / ".." / "claude-r7"

-- Arbitrary bytes need a representation in Lean's UTF-8 string literals.
-- Encode each byte as two ASCII nibbles, in high-to-low order, with A = 0.
private def packNibbles (raw : ByteArray) : IO String := do
  let mut text := ByteArray.emptyWithCapacity (2 * raw.size)
  for byte in raw do
    text := (text.push ((65 : UInt8) + (byte >>> 4))).push ((65 : UInt8) + (byte &&& 15))
  let some literal := String.fromUTF8? text | throw (IO.userError "invalid nibble encoding")
  return literal

elab "r7_config_literal%" : term => do
  let raw ← IO.FS.readBinFile ((← dataDir) / "configs.bin")
  unless raw.size == 10 * recordCount do
    throwError "expected {10 * recordCount} configuration bytes, read {raw.size}"
  return Lean.mkStrLit (← packNibbles raw)

-- Only idx and level are needed for the theorem. Stream the TSV so it need
-- not enter the object file. Record numbers in the ledger arrive out of order.
private def readLevels (dir : System.FilePath) : IO String := IO.FS.withFile (dir / "prod-out" / "prod.tsv") .read fun h => do
  let header := (← h.getLine).splitOn "\t"
  unless header.take 4 == ["idx", "K", "outcome", "level"] do
    throw (IO.userError "unexpected production ledger header")
  let mut codes : ByteArray := ⟨Array.replicate recordCount 0⟩
  let mut count := 0
  repeat
    let line ← h.getLine
    if line.isEmpty then break
    match line.splitOn "\t" with
    | idx :: _ :: _ :: level :: _ =>
      let some i := idx.toNat? | throw (IO.userError "invalid record number")
      unless i < recordCount do throw (IO.userError s!"record number out of range: {i}")
      unless codes.get! i == 0 do throw (IO.userError s!"duplicate record: {i}")
      let value : UInt8 ← match level with
        | "3" => pure 51
        | "4" => pure 52
        | "7" => pure 55
        | _ => throw (IO.userError s!"unexpected level at record {i}")
      codes := codes.set! i value
      count := count + 1
    | _ => throw (IO.userError "short production ledger row")
  unless count == recordCount do throw (IO.userError s!"expected {recordCount} unique records, read {count}")
  let some text := String.fromUTF8? codes | throw (IO.userError "invalid level encoding")
  return text

elab "r7_ledger_levels%" : term => return Lean.mkStrLit (← readLevels (← dataDir))

end R7ProductionData
