-- eth-c1-axioms.lean — OUR file for deciding C1 (claimbox lean/eth-bridge, notes/eth-model-gap-preregistration-2026-11-04.md).
import EthBridge
#print axioms EthBridge.WordRAM.not_eth_ram
#print axioms EthBridge.WordRAM.Sim.executes_simProgram_of_space
#print axioms EthBridge.WordRAM.Decide.uniformDecidable_of_timeSpace
#print axioms EthBridge.WordRAM.Decider.exists_ksat3_decider
#print EthBridge.WordRAM.RAMDecidableInExpTime
#print EthBridge.WordRAM.ETH_RAM
#check @EthBridge.WordRAM.not_eth_ram
