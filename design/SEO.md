# SEO / AEO — the discoverability layer (2026-09-02)

The goal this ladders to (the operator's positioning sentence): *"I build
verification layers under which AI-scale mathematical search produces only
certified output — reward signals that cannot be hacked — and I audit
published AI-generated mathematics."* The site is a hiring portfolio aimed at
frontier-lab evals, reasoning and oversight people, plus the mathematicians
who verify specific claims. Discoverability serves exactly two reader paths:

1. **A person searches a topic we own** (a named problem, a named audit, a
   named technique) and a report page should be the result.
2. **An answer engine (ChatGPT, Claude, Perplexity, Google AI) is asked a
   question our records answer** and should cite the page. This is AEO, and
   it rewards the same things the house style already does: one clear claim
   per page, a tl;dr block, exact numbers, honest fences.

## Keyword map — what each cluster should be found for

The audience vocabulary (memory ruling 2026-08-27): *answer-key
contamination, reward hacking, scalable oversight, verified rewards, RLVR,
eval ground truth*. The searchable topic terms per cluster:

| Cluster | Pages | Primary terms |
|---|---|---|
| AI-math audits | rm-audit, zeta3-audit, ai-claims-audit, keller, erdos852, impostors, answer-key | Ramanujan Machine audit · AI-generated mathematics verification · answer-key contamination |
| Verified reward | oracle, verifier-loop, matmul-eval, forecast-gym, alien-science | reward oracle · verified rewards RLVR · eval whose ground truth is a proof · reward hacking |
| Theorem programs | ember, terra, lambda4, mfg-cap, mfg-congest, mfg-observatory, mfg-two-population | hot spots conjecture certified · validated numerics mean-field games · Chowla cosine problem λ(4) · Erdős 510 |
| Erdős / classical | erdos290, erdos852-h, erdos1038-sup, verify-lemniscate, mercer-program, entropy | Erdős problem #N certified · computer-assisted proof · interval arithmetic enclosure |
| Tensor / algebra records | matmul-additions, tensor-rank-bounds, polynomial-multiplication, alphaevolve | AlphaEvolve verified · AlphaTensor rank 47 · Laderman 23 multiplications · matrix multiplication additions |
| Decidable-claims apps | skyaudit (+app), harbor-proof, evtol-energy, glide-band, water-value | eVTOL energy reserve audit · FuelEU Maritime penalty calculation · certified enclosure |

Rule of thumb: the **description** carries the searchable noun phrases (the
problem's name, the technique's name, the number); the **title** stays the
operator's editorial voice. Answer engines quote descriptions and tl;dr
blocks nearly verbatim — write both as complete, checkable sentences.

## What is implemented (all in the generators — pages are born with it)

- `design/template.js` — every page: title, unique meta description, author,
  canonical + `og:url` (builders pass `path`), full Open Graph + Twitter
  cards against `/og.png` (dark screenshot of the landing, built by
  `tools/build-og.js`), `theme-color`, `max-image-preview:large`, favicon,
  and **JSON-LD picked by served path**: `WebSite` (+author `Person`,
  `sameAs` GitHub + concept DOI 10.5281/zenodo.22225860) on `/`,
  `ScholarlyArticle` on every `/reports/*.html`, `ProfilePage` on `/about/`.
  The JSON-LD is generated from the SAME title/desc strings as the visible
  head — one source, no divergence.
- `design/app-shell.js` — app pages (SkyAudit NYC/SP): canonical + OG when
  the app build passes `path`.
- `tools/build-site.js` — the **meta gate**: the build REFUSES if any served
  page has no meta description, ships the template default, or shares a
  description with another page. robots.txt (allow all — answer-engine
  crawlers included, deliberately) and sitemap.xml are generated here.

## House meta rules (for new pages)

- Every report builder passes `path` (canonical home) and `desc`.
- Descriptions: one complete sentence, ~140–170 chars, leading with the
  claim and its named object; no marketing adjectives; verdicts and exact
  numbers welcome. Never restate the default positioning sentence — the
  meta gate refuses it.
- Titles: editorial voice is fine; when the title carries no searchable
  term, the description must carry all of them.
- One canonical home per page; every alternate URL is a 301 in vercel.json.

## Noted, deliberately not done (keep the machine lean)

- Per-page OG images (would need a screenshot pass per report; one strong
  site card is enough at this audience size).
- `datePublished` in JSON-LD (we don't track per-page publish dates and
  will not fabricate them; the DOI-versioned releases are the time record).
- meta keywords tag (ignored by every engine since 2009).
- lastmod in sitemap (every build rewrites bytes; mtime would lie).
