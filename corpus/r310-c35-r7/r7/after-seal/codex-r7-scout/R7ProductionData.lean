import R7ProductionEmbed

/-! The production records and the ledger's level column, indexed by record number.
Only literal data crosses the elaboration boundary. The replay exports the two
logical definitions below for exhaustive comparison with the pinned files. -/

namespace R7ProductionData

private def packedConfig : String := r7_config_literal%

def cfg : ByteArray :=
  let text := packedConfig.toUTF8
  ⟨Array.ofFn fun i : Fin (10 * recordCount) =>
    ((text.get! (2 * i.val) - 65) <<< 4) ||| (text.get! (2 * i.val + 1) - 65)⟩

theorem cfg_size : cfg.size = 9770080 := by
  simp only [cfg, ByteArray.size, Array.size_ofFn, recordCount]

theorem num_records : cfg.size / 10 = recordCount := by rw [cfg_size]

private def levelCodes : String := r7_ledger_levels%

def level (idx : Fin (cfg.size / 10)) : Nat :=
  (levelCodes.toUTF8.get! idx.val).toNat - 48

#print axioms cfg_size
#print axioms num_records

end R7ProductionData
