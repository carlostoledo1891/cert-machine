import OAI.Bridges.AnthropicETH.Simulation.Run

/-!
# RPI-378.3b: H1 discharged

`Sim.simulationHypothesis_proved : SimulationHypothesis` (in `Simulation/Run.lean`) removes the
first hypothesis of RPI-378.3a. What remains conditional is H2, the converter (RPI-378.3c).
-/

namespace OAI.Bridges.AnthropicETH

/-- **RPI-378.3b.** The simulation hypothesis H1 holds. -/
theorem simulationHypothesis_proved : SimulationHypothesis := Sim.simulationHypothesis_proved

/-- RPI-378.3a with H1 discharged: only the converter hypothesis H2 remains. -/
theorem ethIsFalse_of_not_positiveRateETH_of_converter (hconv : ConverterHypothesis) :
    ¬ OAI.ParityWL.Complexity.PositiveRateETH → MainResults.ETHIsFalse :=
  ethIsFalse_of_not_positiveRateETH simulationHypothesis_proved hconv

end OAI.Bridges.AnthropicETH
