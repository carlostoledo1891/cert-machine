---
titulo: "Pampulha, January 2025"
data: 2026-11-16
resumo: "A jammer on a hilltop made 21 aircraft lose GPS over an airport in Belo Horizonte. What the case teaches drone operators, and anyone who will need to prove what happened."
fontes:
  - t: "Agência Gov (Anatel), operation dismantles a clandestine jammer factory and recalls the Pampulha case, 15 September 2025"
    u: "https://agenciagov.ebc.com.br/noticias/202509/operacao-conjunta-desmantela-fabrica-clandestina-de-bloqueadores-de-sinais-em-sao-paulo"
  - t: "Convergência Digital, Anatel seizes the clandestine equipment that made 21 aircraft lose their GPS signal in Minas Gerais, 24 January 2025"
    u: "https://convergenciadigital.com.br/mercado/anatel-apreende-equipamento-clandestino-que-fez-21-aeronaves-perderem-o-sinal-de-gps-em-minas-gerais/"
  - t: "DPL News, Anatel stops the use of a jammer that was interfering with air navigation in Belo Horizonte, 27 January 2025"
    u: "https://dplnews.com/brasil-anatel-interrompe-uso-de-jammer-que-interferia-em-comunicacoes-e-navegacao-aerea-em-belo-horizonte/"
  - t: "Aviacionline, arrest in Belo Horizonte over a jammer that affected aircraft GPS, 26 January 2025"
    u: "https://www.aviacionline.com/man-arrested-in-belo-horizonte-for-operating-drone-signal-jammer-that-affected-aircraft-gps"
  - t: "Intercept Brasil, Brasília's 173 aircraft and the anti-drone jammers, 2023"
    u: "https://www.intercept.com.br/?p=422332"
  - t: "Atalaia, draft protocol v0.5"
    u: "/atalaia/doutrina/"
---

Between 17 and 21 January 2025, 21 aircraft lost the GPS signal while flying over the perimeter of Pampulha airport, in Belo Horizonte, and had to land using instrument procedures. On 21 January, the company that provides the airport's air navigation services alerted Anatel's regional office. On the 22nd, the Minas Gerais Military Police reported recurring GPS failures in the drones it used to monitor the area.

On 24 January, Anatel inspectors and the police detected a constant signal in the GPS band in the Serra neighborhood. Using technical analysis and radio direction finding, the technique of locating a transmitter by measuring the direction its signal arrives from, they found the source: a jammer installed at the top of the Aglomerado da Serra. The transmission was stopped and the device seized. The person responsible for the installation was taken to the Federal Police. Under the General Telecommunications Law, operating a jammer without authorization is a clandestine telecommunications activity, punishable by two to four years of detention. The specialist press reported that the device was probably used to disrupt the police drones.

In September 2025, when announcing that it had dismantled a clandestine jammer factory in Sorocaba, Anatel itself recalled the case: the device was causing serious harm to air navigation, as reported by the airport.

It was not an isolated case. Between April 2021 and March 2022, according to an Anatel report cited by the press, 173 aircraft lost satellite navigation on approach to or departure from Brasília, because of anti-drone jammers operated by the state itself.

## What the case teaches

**The threat is local, cheap and needs no war.** One device, on high ground, was enough to affect the approach to an airport for several days. There was no sophisticated attack: there was a noise transmitter on the right band.

**Aviation had somewhere to fall back to. A small drone, as a rule, does not.** The aircraft landed on instruments, because aviation maintains procedures and aids that do not depend on satellites. The police drones, in the same sky, simply failed. A cargo or inspection drone that loses GNSS needs a plan decided in advance: how long to continue, where to hold or land.

**Jamming is the easy case.** A jammer is loud: the receiver notices it has lost the signal. The hard case is spoofing, where the signal keeps arriving, only it lies, and a drone that trusts GNSS blindly can be pulled off course slowly, without the pilot noticing. Pampulha shows that the equipment exists and circulates. The Sorocaba factory, with anti-drone briefcases ready for sale, shows that someone is making it.

**Finding the source is geometry.** Anatel found the jammer by measuring directions. It is the same principle Atalaia proposes to use passively, with the fleet and fixed posts as sensors: in simulation, with three listening posts, the interference source was located to within about 350 m. This is simulation, and no post exists yet.

**After the fact, someone will ask what happened.** In an incident with a drone under interference, the investigator's question is simple and hard: was the position the vehicle trusted correct at that instant? Without a sealed record, the answer rests on the operator's word. With a record signed at capture, chained and redone by another party's verifier, the answer becomes a calculation anyone can redo.

## What Atalaia would have done in a case like this

This is illustrative, not measured. Atalaia would not have stopped the jamming: it only listens, and never transmits to strike back. Under jamming, GNSS disappears, and the protection region then grows using only the inertial sensor, the terrain and the camera. Before takeoff, the verdict would already have said how long each leg of the mission stays within the alert limit without GNSS. During the flight, as long as the region fit within the limit, the mission would continue. Once it no longer fit, the box would hold or land in a zone assessed in advance. It would never return home guided by a suspect signal. And everything would be in the record.

If the attack had been spoofing, the gate would have made the difference: the false position, falling outside the region computed without it, would have been declared false, with the source identified. In a simulated test with the real ArduPilot firmware, under GNSS dragged off course little by little, the autopilot alone landed 585.7 m from the post; with the box emulated, 1.8 m. The box there is emulated and the spoofer is naive, and the report says so.

Pampulha does not call for a drone that never gets lost. It calls for a drone that knows what it can still guarantee, and that leaves the proof.

Prepared by Carlos Toledo, with AI help (Claude) on research and writing.
