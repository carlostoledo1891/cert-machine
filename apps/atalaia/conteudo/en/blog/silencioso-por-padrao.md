---
titulo: "Silent by default"
data: 2026-11-16
resumo: "Atalaia listens and does not emit. When the mission calls for it, a proposed active module switches on only inside an envelope approved in advance, and every activation becomes a receipt. And there are lines that do not change in any mode."
fontes:
  - t: "Anatel, Resolution No. 760/2023 (signal jammers)"
    u: "https://informacoes.anatel.gov.br/legislacao/resolucoes/2023/1842-resolucao-760"
  - t: "Anatel, Resolution No. 680/2017 (restricted-radiation equipment)"
    u: "https://informacoes.anatel.gov.br/legislacao/resolucoes/2017/936-resolucao-680"
  - t: "Anatel, Act No. 14.448/2017, consolidated text of 14 October 2025, on the legislation portal"
    u: "https://informacoes.anatel.gov.br/legislacao/"
  - t: "Anatel, Resolution No. 775/2025 (temporary use of radio frequencies)"
    u: "https://informacoes.anatel.gov.br/legislacao/resolucoes/2025/2025-resolucao-775"
  - t: "Law No. 9.472/1997, General Telecommunications Law"
    u: "https://www.planalto.gov.br/ccivil_03/leis/l9472.htm"
  - t: "Atalaia, draft protocol v0.5, red lines"
    u: "/atalaia/doutrina/"
---

The problem Atalaia faces is other people's emissions: the jammer that drowns out the satellite, the spoofer that imitates it. The temptation to answer one emission with another is strong, and it is exactly the one Atalaia refuses. It was designed to listen.

The project uses a single sentence on every page, written once and repeated without variation:

> Atalaia receives signals and stays silent by default. An optional active module, proposed, switches on only inside an envelope approved before the mission, using type-approved low-power equipment, and every activation is logged. In no mode does it jam, spoof or interfere with third-party signals, or transmit in the GNSS bands.

## Why silence

**Because it is the law.** In Brazil, Anatel Resolution No. 760/2023 prohibits the sale, possession and use of signal jammers, except by listed public bodies and in exceptional circumstances. Clandestinely carrying out a telecommunications activity carries two to four years of detention. A product that emitted in order to strike back would be born illegal.

**Because it is easier to adopt.** Civil defense in a flood, a farming cooperative, an offshore shipowner: none of them wants to buy a regulatory risk along with the box. Equipment that only receives fits into any operation without asking for a spectrum license in order to exist.

**Because silence is also integrity.** A system that does not emit does not give itself away and does not interfere with its neighbor. Resolution No. 680/2017 says that restricted-radiation (low-power) equipment that causes harmful interference must stop operating immediately. The best way to always comply with that is not to emit without need.

## When the mission calls for more: the active module, proposed

There are situations where listening is not enough: over water, terrain and imagery do not give back the position; on a landing pad, the region can grow too wide to descend safely. For these cases, Atalaia proposes an optional active module that brings references a spoofer cannot imitate. There are four capabilities, all PROPOSED:

- **Cooperative ranging and authenticated beacons.** The distance measured round trip, over the telemetry link itself or by UWB, to a beacon at a station, a pier, a platform or the edge of a field. The measurement is signed, and a forged distance does not get through.
- **Its own radars.** A radar altimeter on the drone, at 24 GHz or at 60 to 64 GHz, and a Doppler ground-speed radar on land vehicles, which wheel slip cannot fool.
- **Integrity shared across the fleet.** Each vehicle broadcasts its region; a local spoofer shows up as disagreement among them.
- **The integrity test bench.** Test and report, sealed and reproducible, for receivers, autopilots and machines. It starts digital, with no radio emission at all.

## The envelope

The module does not switch on because someone thought it best. Before the mission, the operator approves an envelope: which emitters may switch on, where, at what power and duty cycle, for how long, and who can switch them off. The envelope is signed and goes into the record. Inside it, the box switches the emitter on by itself when the gate declares the GNSS false, or when the region approaches the alert limit for the phase, and switches it off when the condition clears. Outside it, nothing switches on, not even on command: switching on outside it requires a new, signed envelope. The operator can switch off at any moment. An empty envelope is the silent mode, and a customer who needs total silence simply approves an empty envelope. The behavior is the same in civil and in defense use: the envelope decides.

Every activation goes into the sealed record: when, where, which emitter, what power, for what reason and when it switched off. An outside verifier redoes the decision to switch on from that record. It is the receipt that the envelope was respected.

## What the rules allow, as we read them

We read the regulations, and this is not a legal opinion. Ranging over the link and broadcasting across the fleet fit within modules already type-approved in the 900 MHz, 2.4 GHz and 5.8 GHz bands. The drone radar altimeter fits at 24 GHz and at 60 to 64 GHz (up to 122 m in height and 20 dBm peak), and not at 76 to 81 GHz in flight nor in the aeronautical band from 4.2 to 4.4 GHz. The ground-speed radar fits at 24 GHz, with continuous operation allowed on agricultural equipment. UWB on fixed outdoor beacons has no clear category and would start with a temporary test authorization. The box with the module goes through type approval by a body designated by Anatel.

## The lines that do not change

In no mode, with no envelope:

- jam, spoof or interfere with third-party signals;
- transmit in the GNSS bands over the air;
- counter-drone action by jamming;
- guide weapons, release munitions or designate targets;
- decode communications;
- track people or collect data about them.

At Atalaia, delivery means logistics delivery. These lines are not a concession to the regulator: they are the product. They let any operator adopt the box without fear of what it does, and they let an auditor check, in the record, that it did only what was authorized.

Prepared by Carlos Toledo, with AI help (Claude) in the research and writing.
