# Janela — decided operating windows for offshore energy

**What it is.** For a platform, a production area, an oil or LNG terminal, or a
decommissioning job: will the sea let this operation run, and when? Janela takes
a marine forecast whose error has been MEASURED, and decides each window against
the limit someone else published — a Capitania's NPCP, DNV's alpha factor, the
operator's own procedure — with three verdicts and the threshold that would flip
each one.

| verdict | meaning |
|---|---|
| **LIBERADA** (cleared) | every limit holds at the unfavourable edge of the forecast band, at every step of the window |
| **VETADA** (blocked) | some limit fails even at the favourable edge — the witness is that hour and that variable |
| **INDEFINIDA** (undecided) | the band straddles a limit; the flip threshold says by how much |
| **SEM DADOS** (needs data) | what is forecast clears, but the rule also limits something nobody forecasts (current, visibility) |

## The experience beats
1. Pick a site (a basin, a platform, a terminal) and an operation (a published rule, or your own limit).
2. The week, as windows: cleared, blocked, undecided — and why, in one sentence.
3. The month, as climate: how often this operation finds its window (32 years of hindcast, counted exactly), and what a better alpha would buy.
4. One click down: the band, its measured error, the ledger that grades it, the source of every limit.

## Honest boundaries (on the page)
- The forecast is ECMWF's, read at the nearest open-sea model node. At a terminal that is the APPROACH, not the berth: a berth limit is REFUSED until the nearshore transfer exists.
- The band is a proposer's claim (two today: the ECMWF ensemble's central 40 of 50 members, claim 4/5; Janela's calibrated band v1, claim 9/10), graded in public against satellites in `certs/janela-ledger/`; a proposer that misses its claim is pruned by the exact binomial rule over one trial per target day, read at 30, 60, 120… days (`audit/placar.js`).
- What is decided is the band at the forecast's own steps — not the sea between steps, not a probability.
- The 1-in-10,000 tail behind DNV's alpha is a model extrapolation; three years of satellite matchups cannot observe it.
- Not an approval. Marine warranty and class societies own the word "certified"; Janela gives evidence a surveyor can re-run.

## Data (all commercial-clean)
ECMWF open data (CC BY 4.0) · NOAA RADS near-real-time altimetry (public domain) · METAR of platform P-25 (SBLB, public) · Ifremer WAVEWATCH III GLOBMULTI hindcast (CC BY-SA 4.0, `corpus/ww3-points`) · Capitania NPCPs (official acts).

## Where things are
- `scenario/sites.json` — the sites (one definition).
- `audit/ecmwf.py` · `audit/archive.py` · `audit/feed.py` · `audit/commit.js` — reading, back-archive, daily feed, ledger commits.
- `instruments/window/` — workability (exact counts) and the decider; battery with reds.
- `certs/janela-ledger/` — the forward ledger (append-only; daily, `.github/workflows/janela-feed.yml`); its rules dated in `DEFINITIONS.json`.
- `audit/observe.py` · `audit/score.js` · `audit/placar.js` — the satellites three days late, the scores, the admission (one definition).
- `audit/push.sh` · `audit/guard.js` — every push from the Action, refused unless the ledger, the feed and the observations only grew.
- `audit/field.py` · `build-today.js` · `app/` — the map field and the 181 units' forecast, the day's gated data (orphan branch `janela-field`), the app at /janela/.
