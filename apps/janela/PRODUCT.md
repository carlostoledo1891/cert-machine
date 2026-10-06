# Janela — the app view (product spec, 2026-10-06)

The document page (`/janela/` today) explains. The APP decides, for someone who has an
operation to run this week. This file is the spec the app is built and reviewed against.

## Who opens it, and what they must leave with

| who | the decision they own | horizon | what they must leave with |
|---|---|---|---|
| Planejador de logística offshore | when the PSV sails, when the helicopter flies, which platform first | 1–7 days | the next window per platform, ranked, with why |
| Coordenador / fiscal de operações marítimas | go / no-go for an offloading, an STS, a lift | 0–72 h | a decided verdict over the measured band, the flip threshold, a note the surveyor can re-run |
| Engenheiro de campanha (instalação, descomissionamento) | which months, how long to wait, what alpha to argue for | months | workability per month (exact counts), waiting time, what the site alpha gives back |
| Vistoriador (marine warranty) / SMS | accept or not the operator's weather argument | per operation | the evidence: inputs pinned by hash, the rule cited, the commands to re-run |
| Gestor | where weather costs us this week | week | a portfolio line: waiting hours × day rate, per area |

## The pains, and the answer to each (every answer is something the records already support)

1. **"Can it go, where, when?"** — the forecast is a picture, not an answer.
   → The ANSWER LINE first ("Alívio em Santos: próxima janela LIBERADA qui 14h → sex 20h, 30 h"),
   then the board: every site × the next 7 days for the chosen operation, each cell a decided window.
2. **"The forecast says 2,4 m and my limit is 2,5 m — can I trust it?"**
   → The verdict is decided over the MEASURED band (three years of forecast vs satellite at that
   site and lead), not the point. INDEFINIDA comes with its flip threshold.
3. **"DNV's alpha eats our windows."**
   → Three criteria side by side for the same window: the measured band · DNV Table 4-1 · the site
   alpha (lower end of its 90% interval). The gap, in hours of window and in R$ at the user's day rate.
4. **"Planning a campaign months ahead."**
   → O MÊS: workability per month for an operation (limit × duration), 32 years counted exactly,
   at the sea's limit, at the table's OPWF, at the site's OPWF; the mean wait to the next window.
5. **"Providers disagree; nobody shows their track record."**
   → O PLACAR: every band committed before the sea happened, scored against satellites, in public;
   the ensemble and Janela's band graded side by side; admission by the exact binomial rule.
6. **"The surveyor / insurer / ANP needs paper."**
   → NOTA DE DECISÃO: one click, a printable note — operation, site, window, rule (with the act and
   page), forecast run, band, verdict, flip threshold, the sha256 of every module and record, and the
   commands to re-run it.
7. **"The Capitania rule limits current and visibility; nobody forecasts them."**
   → SEM DADOS says exactly which variable is missing, and the app says what would close it
   ("um correntômetro no terminal decide esta linha"): NEEDS DATA as an incentive to connect sensors.
8. **"Alívio crítico": the tanks fill before the sea opens.** Offloadings close to full storage are
   the production-loss risk Petrobras names. → On an FPSO card the USER types capacity, inventory and
   production; the app sets "tanques cheios em X h" beside the next LIBERADA offloading window and
   raises ALÍVIO CRÍTICO when the window opens too late (their numbers, never ours).
9. **"What does waiting cost?"
   → The user's own day rate (never a number we invent) × the hours to the next LIBERADA window.
10. **"Direction decides offloading; current decides the Equatorial Margin."** → Wave and wind direction
   on every card (forecast ink); current named as SEM DADOS wherever a rule needs it, with what would
   close it (a current forecast, a current meter).

## The screens

**Map (full screen).** The Brazilian margin, dark grayscale; the sea state of the hour drawn as
forecast ink (crest lines for waves, streaks for wind — Swell's grammar); every site a verdict
annunciator for the chosen operation and hour: filled = LIBERADA, crossed = VETADA, hatched =
INDEFINIDA, dotted = SEM DADOS, always with the word on hover/tap — never colour alone.

**Top bar.** Janela · the three modes (Semana · Mês · Placar) · the run ("ECMWF 06/10 00 UTC") · Método ↗.

**Panel (desktop right rail; phone bottom sheet in three heights).**
- SEMANA: the answer line; the operation chips (Alívio (critério Petrobras citado: Hs ≤ 3,5 m, vento ≤ 50 nós — OMAE2010) · Carga · Lançamento · Içamento ·
  Terminal (NPCP) · Seu limite), each with editable limits and window length, the defaults
  marked "exemplo — use o do seu procedimento"; the criterion switch (Banda medida · DNV tabela ·
  DNV local); the day strip + hour scrubber (ONE clock, shared with the map); the ranked list of
  sites by next window with a 7-day verdict strip each; the site card (the week strip, the Hs and
  wind band charts, Tp, the rule, witness or flip threshold, Nota de decisão).
- MÊS: area, limit, window → 12 months, three bars each (sea · table · site alpha), the wait.
- PLACAR: commits, scored, covered per proposer; the admission state; the latest scores.

## Rules the build is held to
- Decided and forecast never share ink: decided = the band and the verdict glyphs; forecast =
  dashed/italic/hatched. The verdict hues are the annunciator pair the app shell defines, never alone.
- Every number from a gated record or computed in the tab by the SAME pinned modules
  (q.js, decide.js, the DNV table file); the tab re-decides the published decisions and says so.
- No invented operator limit: presets are labelled examples; the user's own limits stay in the tab.
- No "certificado", no "aprovado"; the alpha is an estimate; berth wave limits are not decided.
- Phone first: one thumb, the answer line visible without scrolling, the map never hidden.
