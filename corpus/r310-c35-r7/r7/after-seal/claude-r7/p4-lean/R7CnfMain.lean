import R7Cnf
open R7Cnf

/-- usage: cores_e85.g6 configs.bin OUTDIR IDX:LEVEL ... — writes OUTDIR/IDX_LEVEL.cnf for each pair. -/
def main (args : List String) : IO UInt32 := do
  match args with
  | cores :: cfgPath :: out :: rest =>
    let lines := ((← IO.FS.readFile cores).splitOn "\n").filter (fun l => l.length > 4) |>.toArray
    let cfg ← IO.FS.readBinFile cfgPath
    for a in rest do
      match a.splitOn ":" with
      | [i, l] =>
        let idx := i.toNat!
        let lvl := l.toNat!
        let (core, inp) := inputOf lines cfg idx
        IO.FS.writeFile (out ++ "/" ++ i ++ "_" ++ l ++ ".cnf") (bytes inp core idx lvl)
      | _ => IO.eprintln ("bad argument " ++ a); return 2
    return 0
  | _ => IO.eprintln "usage: cores_e85.g6 configs.bin OUTDIR IDX:LEVEL ..."; return 2
