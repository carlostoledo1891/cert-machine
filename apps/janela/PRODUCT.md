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

## The outreach pass (2026-10-07): use cases as doors, and the order of what is seen

Operator: "prepare Janela to start outreach — usable, easy to spot information; information hierarchy, what is
important to spot first; the use cases, the user needs." What a stranger opening a link needs, in order: what this
is → the answer for the operation they care about → where and when → why to trust it → the paper. The build holds:

- **The use cases are ONE list** (`apps/janela/uses.js`): who decides, the question, what they leave with, the door.
  The app's intro shows the doors (Alívio · Carga de PSV · Campanha · Conferir · Placar · Método), the method page's
  "para quem" shows the six cases as cards with deep links (`/janela/#op=…&modo=…`), the deck's slide 4 is the same
  table. The battery refuses a door the client does not act on and a link to a state the app cannot hold.
- **The intro** is open on a first visit (one sentence of what it is + the doors) and folds to one line once a door
  is used, it is folded, or the visitor arrived on a shared place (site in the hash — not op/modo alone, which the
  address bar carries from the first render). The choice is a per-viewer convenience in localStorage.
- **The panel's order on a desk**: intro → the operation (chips, then the limits in force as ONE line — "Hs ≤ 3,5 m ·
  vento ≤ 50 nós · janela de 24 h" — with "ajustar" one click down) → the answer → the clock → the card → the list.
  **On a phone** the answer and the clock come first (the peek), the operation under them; the intro drops its
  paragraph in the peek so the answer line stays visible without scrolling.
- **The fleet answer** is the count over the SAME set the list shows (its Todos/Unidades/Bacias filter), the verdict
  mix with words, and **the minority by name**: on a calm day the few that cannot go ("Fora da janela (1): Pelotas"),
  on a rough day the few that can ("Na janela (12): …") — clickable.
- **The list** is grouped at the chosen start hour (ONE clock): na janela agora (tightest margin first) · abre mais
  tarde (soonest first) · sem janela no resto da previsão · não se aplica.
- **The card's order is the hierarchy**: who it is → when it can go (the next window from now, with the margin) →
  why, by the three criteria → the week → the sea charts → the user's own planning numbers (tanks, day rate) → what
  is shown but never decided (the sea by parts, the current — folded) → the certificate → where the forecast was read.
- **CAMPANHA** (the month view renamed for its use): purpose → area/limit/window → the campaign (N operations from a
  month) → the months → the season → the table → the cost. The Campanha door opens the case where the sea, Table 4-1
  and the site alpha all have a count (10 × 48 h at Hs ≤ 2,0 m, the Lançamento example, from next month).
- **PLACAR** opens with what is already measured (the held-out coverage and the broken-LIBERADA rate, from
  certs/janela-providers-eval.json) before the forward record, which fills from 2026-10-09.
- **The link preview** (site/janela/og.png, both pages' og:image) and **the deck** (site/janela/janela-apresentacao.pdf,
  apps/janela/deck.js, 12 slides) are built from the same N and the app's own screenshots.

## The review pass (2026-10-08): the planner's board, and the evaluator's first screen

Operator: "Make the app target the real people that will evaluate and use … professional and beautiful." Two readers,
two first screens:

- **The planner (marine coordination, offshore logistics) needs the whole fleet against the whole week at once** —
  the weather-window chart every offshore forecast desk prints. **O quadro da frota** is docked under the map on a desk
  (≥ 1000 px, SEMANA): one row per place in the SAME set the list and the fleet answer count (`rowsFor`, one
  definition), 29 cells per row (the starts, Brasília time), the verdict glyphs at cell size, the chosen start and
  "now" marked, the past dimmed, the next window in words at the end of the row. Ordered **por bacia** (Foz do
  Amazonas → Pelotas, read from the ANP field names each unit serves; a basin header with its LIBERADA count) or
  **pela próxima janela** — the list's own order (`nextOrder`, one definition: in the window now with the smallest
  margin first, then the soonest to open). A cell click moves the ONE clock and selects the place; an hour click
  moves the clock; a row hover rings the place on the map and a map hover lights the row. **CSV ↓** writes the board as
  a spreadsheet (semicolon, UTF-8 BOM, every start in BRT and UTC, the operation, the limits, the criterion, the run and
  the digest in the first line). Folds to a 34 px bar (Q); the choice and the order are per-viewer conveniences.
- **The evaluator needs the proof before the product**: the intro opens with three numbers read from the held-out
  record (the units, the band's coverage on satellite it never saw, the broken-LIBERADA rate against ECMWF alone), and
  the top bar says **✓ conferido 2×** once the tab and the second verifier both re-decided the day.
- **The map names the basins** above their pills (a reviewer reads "CAMPOS 64/64", not a bare fraction); no label or
  pill hides under the top bar or the clock chip; a pill pushed off its place stacks, never overlaps.
- A narrow desk (721–1099 px) drops the brand and the read time from the bar, so the modes and Método stay visible; a
  board narrower than ~900 px names every other start.
