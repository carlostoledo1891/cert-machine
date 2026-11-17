---
titulo: "How to test without emitting"
data: 2026-11-16
resumo: "To know what a receiver, an autopilot or a machine does when GNSS lies, you have to attack it. Atalaia's test bench does this without emitting a single signal, and delivers a sealed report that another party can reproduce."
fontes:
  - t: "Anatel, Resolution No. 760/2023 (signal jammers)"
    u: "https://informacoes.anatel.gov.br/legislacao/resolucoes/2023/1842-resolucao-760"
  - t: "Anatel, Resolution No. 775/2025 (temporary use; excludes jammer testing)"
    u: "https://informacoes.anatel.gov.br/legislacao/resolucoes/2025/2025-resolucao-775"
  - t: "Law No. 9.472/1997 (LGT), art. 162"
    u: "https://www.planalto.gov.br/ccivil_03/leis/l9472.htm"
  - t: "ANAC, RBAC No. 100, 100.107(a)(2)"
    u: "https://pergamum.anac.gov.br/arquivos/RBAC100EMD00.pdf"
  - t: "ISO 18497-4:2024, sample with the table of contents"
    u: "https://cdn.standards.iteh.ai/samples/82688/9e77c86a5bb84b87859f194af2752999/ISO-18497-4-2024.pdf"
  - t: "IMCA Information Note 1730, April 2026"
    u: "https://www.imca-int.com/resources/technical-library/in-1730-gnss-jamming-and-spoofing-operational-impacts-and-mitigation-for-dynamic-positioning-dp/"
  - t: "Converge Digest, Keysight completes its purchase of Spirent"
    u: "https://convergedigest.com/keysight-completes-1-16-billion-acquisition-of-spirent-communications/"
  - t: "Skydel (Safran, formerly Orolia)"
    u: "https://www.4test.no/Orolia-Skydel.htm"
  - t: "Rohde & Schwarz, GNSS simulation"
    u: "https://www.rohde-schwarz.com/br/_56279-610109.html"
  - t: "IABG, white paper on robust GNSS systems, Dec. 2025"
    u: "https://www.iabg.de/fileadmin/Daten/06_MEDIATHEK/04_Veroeffentlichungen/CT_Digitalisierung/2025-12_Whitepaper-Robuste-GNSS-Systeme-EN.pdf"
  - t: "Fraunhofer IIS, test environment"
    u: "https://www.iis.fraunhofer.de/en/ff/lv/lok/leist/test/over-the-air-testumgebung.html"
  - t: "Statens vegvesen, Jammertest 2026"
    u: "https://www.vegvesen.no/om-oss/presse/aktuelt/2026/09/jammertest-2026/"
  - t: "BSI, EN 16803 (security assessment of GNSS terminals)"
    u: "https://knowledge.bsigroup.com/products/space-use-of-gnss-based-positioning-for-road-intelligent-transport-systems-its-assessment-of-security-performances-of-gnss-based-positioning-terminals"
---

A drone maker wants to know what its autopilot does when GNSS starts to lie. An agricultural machinery maker wants to show that the machine does not leave its fence when it loses its precision correction. A vessel operator wants to check GNSS against the other references before trusting it. All three need the same thing: to attack the equipment on purpose, in a controlled way, and to record what happened.

The obvious path is to radiate the attack. In Brazil that path is closed, and rightly so. Anatel Resolution No. 760/2023 prohibits the possession and use of jammers by anyone who is not a listed public user, and the temporary authorization for radio frequency use expressly excludes jammer testing. Abroad, those who test over the air do so under the regulator's license: IABG, in Germany, transmits controlled signals inside its campus with authorization from the federal agency; Jammertest, in Norway, is an open event that in 2026 brought together 310 participants from 127 organizations in 28 countries; Fraunhofer IIS offers a protected environment for testing receivers. Laboratory equipment is a mature market: Keysight, which absorbed Spirent in October 2025, Safran, with Skydel, and Rohde & Schwarz.

Atalaia's bench starts from a different question: how much can be tested without emitting anything at all?

## Three layers, from the cheapest to the most expensive

**Position domain.** The false GNSS enters the autopilot as a position, and the autopilot runs in simulation with the real firmware. No radio and no cable. This layer exists, and it has already produced a report.

**Signal domain, in software.** Public recordings of attacked signals go through a software receiver, which runs as a separate program. Also with no emission. Each recording comes in only after its license has been read. This layer is prepared, not built.

**By cable, with the signal confined.** A generator connected by cable to the physical receiver, with no antenna. Under the law, a signal confined to a cable is not radiocommunication; but the law also prohibits a radio frequency emitter without type approval, and the jammer rule may reach the generator. That is why this layer waits on a legal opinion and a purchase gate of its own. A jamming generator with an antenna output does not exist in the project, ever.

## The inaugural report

On 16 November 2026, the bench ran its initial catalog on ArduCopter 4.7.2 in simulation, on a mission of about 4.4 km to a station in the hills. Three tests: nominal, with no attack; drag, with GNSS pulled sideways at 2 m/s from 35% of the outbound leg; and jump, with GNSS shifted 300 m at once. Two pieces of equipment under test: ArduPilot alone and ArduPilot with the Atalaia box, emulated.

The report measures five items, each with ✓ PASS, × FAIL or ∅ NEEDS DATA, and the criterion for each was written in advance: containment, alarm, false alarm, conduct and outcome. The results, all from simulation:

- Under drag, ArduPilot alone raised the alarm at 14.9 s, before the box, which raised it at 46.0 s, but ArduPilot alone landed 585.7 m from the station. With the box, the landing was 1.8 m away.
- Under jump, 300.0 m without the box and 0.8 m with it.
- In the nominal test, no false alarm in 600 s for either.
- ArduPilot alone received ∅ NEEDS DATA on containment and conduct, because it declares neither a region nor a conduct. That is the point of the bench: it also says what the equipment does not claim.

The catalog was written before any run. A separately written verifier redid the 30 items from the raw record and reached the same verdicts. Three red controls were planted on purpose: a forged verdict, a forged number and a false alarm inserted in the middle of the nominal test. All were caught.

## What the report does not show yet

The report itself says so. The box is emulated: its estimate is the simulator's truth plus a randomly drawn error, so its containment passes by construction, and what is measured is the protocol on the autopilot's side. The spoofer is naive: it shifts the position and leaves the true velocity, which is why ArduPilot's estimator notices the drag. The terrain is flat, and the simulated aircraft is not a cargo drone. There was one run per pair, with no false-alarm statistics.

## Who it is for, and what we do not say

The bench serves makers of drones and autopilots, makers of autonomous agricultural machines, and dynamic positioning operators. There are hooks: RBAC No. 100 asks for navigation with sufficient performance and reliability, demonstrated in a manner acceptable to ANAC; Annex D.2 of ISO 18497-4 describes the virtual fence test; IMCA IN 1730 asks for cross-checking of GNSS. But no Brazilian rule requires this test today, and we say so.

Recording and replaying attacks are already in a European standard, EN 16803-2 and -3. What we did not find, in the services we read about, is a sealed report that a third party can reproduce from the package, with a containment verdict. That is what the bench sells: test and report. Type approval of equipment remains Anatel's role, through the bodies it designates.

Prepared by Carlos Toledo, with AI help (Claude) in the research and writing.
