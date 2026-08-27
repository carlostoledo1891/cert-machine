/* test-index.js — the gate for the LANDING PAGE, and for the shape of it.

   There is no separate index file. One was built and deleted the same day: it
   duplicated a landing route the artifact already had, so the "site" was a
   single page split across two files and every link between them pointed from
   mfg-lab.html back to mfg-lab.html. The hub is now the artifact's own `/`
   route, which is why this battery reads mfg-lab.html.

   WHAT IS CHECKED, AND WHY EACH ONE EXISTS

     I1  every site-absolute href on the landing page resolves THROUGH THE
         DEPLOYED ROUTE MAP. Checking the filesystem alone is the wrong check:
         these pages are served from rewrites, so `/research/mfg-cap/mfg-cap` is right and
         `mfg-cap.html` — a real file — is a 404 in production. The route map
         lives in two places by design (the skeleton here, the deployed file
         after export), so both are tried and NEITHER-FOUND is fatal rather
         than skipped. A route check that quietly does not run is worse than
         no route check.

         REDIRECT-AWARE since 2026-07-29, and the order is the whole content of
         the fix. Vercel resolves **redirects -> FILESYSTEM -> rewrites**, and
         this gate modelled only the third step: it read `vercel.rewrites` and
         nothing else, so it reported every address served by a 301 — and every
         address served by a plain file — as "would 404 in production". Measured
         the day it was fixed: 4 FAILs, and NONE of them was a broken link.
         `/research/mfg-cap/mfg-cap` and `/research/stock-constraint/stock-constraint` are M7b's permanent redirects into `/papers/`;
         `/papers/wardrop-repro` and `/papers/mfg-congest` are files. Four false
         reds, and a gate that cries wolf is a gate that gets muted.

         THE ORDER OF THE REPAIR MATTERED MORE THAN THE REPAIR. Until 2026-07-29
         this page also linked `/lab` and `/byo` — pages M3 DELETED, whose routes
         M3 replaced with 301s to `/`. Teaching the gate about redirects while
         those links were still here would have resolved `/lab -> / -> 200` and
         turned a card advertising a deleted tool GREEN. The links were removed
         first and the gate taught second, deliberately, in that order.

         WHAT REDIRECT-AWARENESS CANNOT SEE, stated so nobody mistakes its
         silence for approval: a link to a 301 source is a 200, not a 404, so
         this assertion cannot tell a deliberate legacy address from a link that
         should have been re-pointed. It is a REACHABILITY gate, not an editorial
         one. Every such hop is therefore PRINTED — see the `via 301` note — and
         a link landing on a page that does not do what the link promised is a
         defect no route map can carry. The deleted-tool card was exactly that,
         and it was found by reading the markup, not by running this file.

         The pattern (redirects -> filesystem -> rewrites, the redirect hop kept
         visible rather than folded in) was taken from two gates that this repo
         RETIRED on 2026-07-28 (commit a4dd280, "remove all 28 gates"), so do not
         go looking for them: they modelled it correctly and the model outlived
         them. It is not reinvented here.

     I2  every in-page `data-goto` target is a route the artifact actually has.

     I3  THE SHAPE. One featured card for the Lab, exactly three receipt cards,
         and everything else in a LIST. This is asserted because it is a design
         decision that decays silently: cards are easy to add, seven cards of
         equal weight is not a hierarchy, and the wall it becomes still looks
         fine in review. The count is the falsifier.

     I4  no page presents `pip install mfg-lab` as a working command, because
         the distribution is not on PyPI. Doctrine forbids claiming the package
         exists as shipped, and the first draft of the hub printed exactly that.
         REBUILT 2026-07-28 — see the block itself for the argument. In one
         sentence: it used to read a HARDCODED two-file list, one of which is
         scheduled for deletion, and it skipped any page that did not already
         say "install" — so its entire coverage came from the dying file and it
         would have CRASHED on ENOENT rather than failed. It now scans the
         pages the ROUTE MAP deploys, asserts absence on every one of them
         unconditionally, and mutation-tests its own detector on synthetic
         encoded fixtures so the assertion keeps teeth even if every page falls
         silent.

   PROBE — the redirect-aware resolver, driven RED on throwaway copies of the
   EXPORT (never on the live tree), 2026-07-29. Control first: the untouched
   export copy runs 47 PASS, 0 FAIL, exit 0, with no env overrides at all — the
   public tree resolves every route directly. Then, one mutation per copy:

     exit 1  a landing link to `/no-such-page` — no redirect, no file, no
             rewrite. I1 names all three cleanUrls candidates it tried.
     exit 1  DELETE papers/mfg-cap.html, the file the `/research/mfg-cap/mfg-cap` 301 lands on.
             This is the sharp one: it proves the chain is followed to a FILE
             and that the gate does not go green merely because a redirect RULE
             exists. I1 and I4 both fire, and I4 carries the repair instruction.
     exit 1  add a 301 onto a shipped page nothing links to. I1b fires — which
             it could not have done before this pass, when its whole domain was
             the one rewrite and that one was the self-link.

   COUNTS — MEASURED, NOT REMEMBERED (2026-07-29, this tree, `make check` env)

     47 checks, of which I4 contributes 13: 6 detector self-tests (3 on the
     forbidden claim, 3 on the claimant filter), 1 non-empty domain, 6 absence
     checks (one per deployed page), 0 disclosure checks — no page in the domain
     raises installing, so I4b is N/A and contributes nothing, which is printed
     and is a SKIP, never a pass.

     It was 32 in this tree the hour before (28 PASS, 4 FAIL), and every one of
     the +15 is redirect-awareness paying for itself:
       +7  I1b. It ran ONE check while ROUTES was the rewrite list, and that one
           was the self-route, so it could not fail. It now runs over all 8
           deployed addresses.
       +5  I4a absence. The domain was 1 page (the artifact itself, pushed in as
           the structural floor); it is now the 6 pages the map really deploys.
       +3  I4z, the new probes under the claimant filter.
     The previous note here recorded 44 with I4 contributing 11 including 6
     absence checks. That was measured on 2026-07-28 BEFORE M3 deleted three
     pages and M7b moved two routes; by the time this pass ran, the same code
     was scanning exactly one page. The old number is left described rather than
     restated as current — a count is a measurement with a date on it.

     The number is domain-dependent BY DESIGN. Retire a route and both I1b and
     I4a shrink with it. The floor never reaches zero — the six self-tests and
     the non-empty-domain check are structural. Do not copy a count out of this
     comment into another document without re-running the gate; this repo's
     catalogue is full of counts that drifted.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = require('./_root.js').treeRoot(__dirname);
/* 2026-07-29: this battery SHIPS, and the lab's directory differs by tree — research/mfg-lab in
   the monorepo (every unit is a paper or report inside research/), flat mfg-lab/ in the export.
   Nearest-existing wins; a miss falls through to the export shape and I0z reports it BY NAME. */
/* AMENDED AGAIN 2026-08-21 (the structure migration), and this amendment DELETES the two-shape
   lookup rather than adding a third shape to it.

   The lookup existed because the lab's directory differed by tree: research/mfg-lab in the
   monorepo, flat mfg-lab/ in the export. Phase 2 (2026-08-08) then moved it to site/mfg-lab —
   its route — and renamed the artifact mfg-lab.html -> index.html, because /mfg-lab was the last
   address served by a Vercel rewrite rather than by a file sitting where it is addressed.

   The structure migration makes source path and published path THE SAME STRING for every file in
   the export, so there are no longer two shapes to try: the lab is research/mfg-lab/ in this tree
   and research/mfg-lab/ in the export, and the artifact is mfg-lab.html in both. `index.html` was
   only ever a way to make a directory answer to its own name; a page's path IS its URL now, so
   research/mfg-lab/mfg-lab.html answers /research/mfg-lab/mfg-lab directly under cleanUrls.
   One path, and I0z still reports it BY NAME if it is not there. */
const LABDIR = path.join(ROOT, 'research', 'mfg-lab');
const ART = path.join(LABDIR, 'mfg-lab.html');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error('   FAIL  ' + m); } };

console.log('== landing-page gate ==');
/* A MISSING FILE MUST BE A SENTENCE, NOT A STACK TRACE. Every readFileSync in
   this battery is guarded, because an ENOENT is indistinguishable in a Makefile
   from a broken harness — the runner sees a nonzero exit and a node internal
   frame, and cannot tell "the gate caught something" from "the gate is broken".
   A crash is also strictly worse than a red: it aborts mid-file, so every check
   AFTER the throw silently stops running. That is exactly what the old I4 did
   (it read `lab.html` unguarded) — it took I5 and the PASS/FAIL summary down
   with it, verified 2026-07-28. */
if (!fs.existsSync(ART)) {
  console.error('   FAIL  I0z the artifact this battery reads is not there: ' +
    path.relative(ROOT, ART));
  console.error('   This is a MISSING FILE, not a failed assertion. The artifact IS the');
  console.error('   /research/mfg-lab/mfg-lab landing page; if it moved, re-point ART, and if it');
  console.error('   was deleted, this whole battery must be retired deliberately — not by');
  console.error('   letting it crash.');
  console.error('landing-page gate FAILED'); process.exit(1);
}
const html = fs.readFileSync(ART, 'utf8');
console.log('   research/mfg-lab/mfg-lab.html  ' + html.length + ' bytes  sha256:' +
  crypto.createHash('sha256').update(html).digest('hex').slice(0, 16));

/* I0 REPHRASED 2026-08-08, and the rephrasing is the point rather than a repair. It read
   `!fs.existsSync(LABDIR/index.html)` — "there is no separate index file". That was a proxy for
   the real property, which is that ONE page is the hub: the artifact answers /research/mfg-lab/mfg-lab itself and
   nothing else competes for the address. Phase 2 renamed the artifact TO index.html, which made
   the proxy assert the artifact does not exist while the property it stood for became MORE true
   than before. So the property is asserted directly: exactly one .html at the lab root. */
/* AMENDED 2026-08-21: the expected basename is mfg-lab.html again. Phase 2 named it index.html so
   that a DIRECTORY could answer to its own name; the structure migration made a page's path its
   URL, so research/mfg-lab/mfg-lab.html answers /research/mfg-lab/mfg-lab under cleanUrls and the
   index.html trick is not needed. The PROPERTY this asserts is unchanged and is the one that
   matters: exactly one .html at the lab root, so nothing competes for the address. */
const rootPages = fs.readdirSync(LABDIR).filter((f) => f.endsWith('.html'));
ok(rootPages.length === 1 && rootPages[0] === 'mfg-lab.html',
   'I0 exactly one page owns the lab route — the artifact IS the landing page  [' + rootPages.join(', ') + ']');

/* THE LANDING PAGE IS GONE, and this battery's scope is re-homed rather than deleted.
   2026-07-30: `pgStart` was removed from the artifact. It was a landing page INSIDE an
   instrument -- hero, lede, card grid -- and the site homepage now does that job; two landing
   pages competing for one reader is what made this page's navigation hard to simplify.

   This file used to isolate that page and run every check below against the slice. The scope is
   now THE WHOLE ARTIFACT, which makes the surviving checks STRICTLY STRONGER: I1 previously
   validated the site-absolute links in one div and now validates every site-absolute link on the
   page, including the four in the new shared site nav.

   I0b IS RETIRED, WITH A VERDICT rather than by vanishing. Its assertion was "the landing page is
   locatable", and the landing page is deliberately not there. A check whose subject was removed on
   purpose is retired on purpose; a check that quietly stops running is the silent-pass failure
   this repository has already paid for. The same verdict applies to I2b and the I3 family below. */
const start = html;

/* ------------------- I1 · site-absolute links resolve through the route map */
/* This file ships in the public repo, so it must name no private build path.
   In the export the route map is at the tree root; in the monorepo it lives in
   repo-root tooling, and the (private, unexported) Makefile passes that location
   through MFG_ROUTE_MAP. The env var is undefined in the public tree, where the
   root candidate resolves. */
const ROUTE_MAPS = [
  process.env.MFG_ROUTE_MAP,           // monorepo override, set by the private Makefile
  path.join(ROOT, 'vercel.json'),      // the export: at the tree root
].filter(Boolean);
const mapFile = ROUTE_MAPS.find(f => fs.existsSync(f));
if (!mapFile) {
  console.error('   FAIL  I1 no route map found — looked in:\n     ' + ROUTE_MAPS.join('\n     '));
  console.error('landing-page gate FAILED'); process.exit(1);
}
/* ---- route algebra. Pure, and shaped like the redirect gate RETIRED on 2026-07-28
   (a4dd280), where this project's model of Vercel's pipeline was first written down and
   from which it was carried here rather than reinvented. Strip query and fragment
   (a fragment is client-side and never reaches the router), strip the trailing slash. */
const norm = r => {
  if (typeof r !== 'string') return '';
  const q = r.replace(/[?#].*$/, '');
  return q.replace(/\/+$/, '') || '/';
};
const isExternal = d => typeof d === 'string' && /^[a-z][a-z0-9+.-]*:/i.test(d);

const vercel = JSON.parse(fs.readFileSync(mapFile, 'utf8'));
const CLEAN = vercel.cleanUrls !== false;
const rulesOf = key => (vercel[key] || [])
  .filter(r => r && typeof r.source === 'string' && typeof r.destination === 'string');
const bySource = rules => {
  const m = new Map();
  /* Vercel takes the FIRST matching rule; later duplicates are dead code. */
  for (const r of rules) if (!m.has(norm(r.source))) m.set(norm(r.source), r);
  return m;
};
const REWRITES = bySource(rulesOf('rewrites'));
const REDIRECTS = bySource(rulesOf('redirects'));
/* Every address the deployed map claims, whichever step answers it. This is the
   domain of I1b and I4, and it is derived — add a route and both grow. */
const ROUTES = new Map([...REWRITES, ...REDIRECTS].map(([s, r]) => [s, r.destination]));
console.log('   route map: ' + path.relative(ROOT, mapFile) +
  '  (' + REWRITES.size + ' rewrite(s) + ' + REDIRECTS.size + ' redirect(s))');

/* A DEPLOYED FILE PATH (`papers/mfg-cap.html`) -> THE BYTES ON DISK.
   In the export the two coincide, and ROOT is the tree root, so a plain join is right. In
   the MONOREPO the published projects do not share one parent: M7a (2026-07-28) moved
   mfg-cap to research/mfg-cap and sin-mfg to research/stock-constraint, so
   `<academic>/research/mfg-cap/mfg-cap/mfg-cap.html` stopped existing and I1/I4 reported four pages MISSING
   that are in fact present and shipping. Nothing about the routes changed, and nothing here
   may change them — this is purely where the bytes are found.
   THE MAP IS NOT HARDCODED, for the same reason MFG_ROUTE_MAP is not: this file ships in the
   public repo and may not name a private build path. The private Makefile passes it in; the
   variable is undefined in the public tree, where the first branch already answers. */
const PAGE_MAP = process.env.MFG_PAGE_MAP ? JSON.parse(process.env.MFG_PAGE_MAP) : {};
/* FILES ONLY. Vercel's filesystem step serves a file; a DIRECTORY of that name is not a hit,
   and treating it as one is not a near miss — it swallows the rewrite step entirely. Measured
   while writing this: `/research/mfg-lab/mfg-lab` matched the `mfg-lab/` directory, the rewrite to
   /research/mfg-lab/mfg-lab/mfg-lab never ran, and the gate died on EISDIR instead of reporting anything.
   The link gate RETIRED on 2026-07-28 (a4dd280) stated the same rule, as
   `fs.statSync(abs).isFile()`. */
const isFile = p => { try { return fs.statSync(p).isFile(); } catch (e) { return false; } };
function onDisk(rel) {
  const direct = path.join(ROOT, rel);
  if (isFile(direct)) return direct;
  for (const [pub, src] of Object.entries(PAGE_MAP)) {
    if (!rel.startsWith(pub)) continue;
    const mapped = path.resolve(ROOT, src, rel.slice(pub.length));
    if (isFile(mapped)) return mapped;
  }
  return null;
}
/* cleanUrls: a request for /x may be served by the file x, x.html or x/index.html. */
function fsCandidates(route) {
  const rel = norm(route).replace(/^\/+/, '');
  if (!rel) return ['index.html'];
  /* THE UNLISTED TIER. /x/<basename> exists only in the EXPORT: the builder flattens every
     tracked page under site/_gated/ into x/. In the source tree the page is still at its
     gated path, so a route resolved here must be offered those candidates too, or every
     301 into the tier reads as a route serving no file. Added 2026-08-21, when the site
     minimisation pointed seventeen 301s at /x/ and this resolver called all of them dead
     while the pages were present and shipping. It knew about redirects and rewrites and
     did not know the tier existed. */
  const base = CLEAN ? [rel, rel + '.html', rel + '/index.html'] : [rel, rel + '/index.html'];
  const m = /^x\/([^/]+?)(?:\.html)?$/.exec(rel);
  if (m) {
    for (const dir of ['_gated', '_gated/technical-reports']) {
      base.push(dir + '/' + m[1] + '.html');
    }
  }
  return base;
}

/* THE PIPELINE: redirects -> FILESYSTEM -> rewrites, in that order, which is Vercel's.
   The redirect hop is followed first and reported separately rather than folded into the
   result, so a caller can see that an address was answered by a 301 instead of directly.
   Both loops are hop-capped and cycle-guarded; check-redirects.js owns the assertions that
   the map itself is acyclic, and this file must not hang on a map that is not. */
function serve(route) {
  let cur = norm(route), via = null;
  const seenR = new Set();
  while (REDIRECTS.has(cur) && !seenR.has(cur) && seenR.size < 8) {
    seenR.add(cur);
    const d = REDIRECTS.get(cur).destination;
    if (isExternal(d)) return { file: null, external: d, via: cur };
    via = via || cur;
    cur = norm(d);
  }
  const seenW = new Set();
  for (let i = 0; i < 8; i++) {
    const hit = fsCandidates(cur).find(c => onDisk(c));
    if (hit) return { file: hit, via };
    if (!REWRITES.has(cur) || seenW.has(cur)) break;
    seenW.add(cur);
    const d = REWRITES.get(cur).destination;
    if (isExternal(d)) return { file: null, external: d, via };
    cur = norm(d);
  }
  return { file: null, dead: cur, via };
}

const abs = [...start.matchAll(/href="(\/[^"]*)"/g)].map(m => m[1]);
ok(abs.length >= 3, 'I1a the landing page links out to the other artifacts (' + abs.length + ' site links)');
const hops = [];
for (const h of abs) {
  const route = norm(h.split('#')[0]);
  const s = serve(route);
  if (s.external) { ok(true, 'I1 ' + route + ' -> ' + s.external + ' (external destination)'); continue; }
  ok(s.file !== null, 'I1 ' + route + (s.file
    ? ' -> ' + s.file + (s.via ? '  (via 301 on ' + s.via + ')' : '')
    : ' resolves to nothing: no redirect, no file at ' + fsCandidates(s.dead).join(' / ') +
      ', no rewrite — it would 404 in production'));
  /* A 301 hop is NOT a failure — the address answers — but it is not invisible either.
     See the header: this assertion is reachability, and a link to a retired address is a
     200 that only a human reading the markup can judge. Printing it is the whole guard. */
  if (s.file && s.via) hops.push(route + ' -> 301 -> ' + s.file);
}
if (hops.length) console.log('   I1  ' + hops.length + ' landing link(s) answered by a permanent redirect (a 200, not a defect — but the address is retired):\n        ' + hops.join('\n        '));
/* I1b — reachability is a property of the DESTINATION, not of the route string.
   Two routes with the same destination are the same page, so an alias is reachable
   whenever any of its siblings is linked; and a route pointing back at this very
   artifact is a self-link, which a page is never required to make.
   (This used to hardcode `src === '/'` as the sole exemption. That expressed
   "the self-link is exempt" only while `/` still resolved to mfg-lab.html. When the
   onepager became the homepage, `/` -> onepager and the self-route became /research/mfg-lab/mfg-lab,
   so the string test started failing on /research/mfg-lab/mfg-lab and on /onepager — an alias of `/`,
   which IS linked. The artifact was correct both times; the gate's premise was stale.
   Comparing destinations keeps the teeth: a destination no route reaches still fails.) */
/* I1a stays scoped to the landing section (it asserts the hub links OUT).
   I1b is a different question — "is any deployed route orphaned?" — and that is a
   property of the whole artifact, because the topbar/footer chrome is present on
   every page and is where the homepage link lives. It is also a property of the
   DESTINATION, not the route string: two routes with one destination are one page,
   so an alias is reachable when any sibling is linked, and a route pointing back at
   this artifact is a self-link no page is required to make. Teeth are kept: a
   destination that nothing anywhere links to still fails.

   SHARPENED 2026-07-29, with the redirect awareness above. Comparing destination STRINGS
   worked only while every route was a rewrite whose destination was written the same way in
   every rule. It cannot see that `/lab -> /` and a bare `href="/"` are the same page — `/`
   is served by a FILE and is nobody's route source, so `ROUTES.get('/')` was undefined and
   the link vanished from the reached set. The comparison is therefore on the FILE each side
   resolves to, through the same redirects -> filesystem -> rewrites pipeline the browser
   uses. Two addresses that serve one file are one page, which is what the rule always meant.
   That change also un-vacuums the assertion: before it, ROUTES held ONE rewrite, and that
   one was the self-link, so I1b ran exactly one check that could never fail. */
const SELFFILE = path.relative(ROOT, ART).split(path.sep).join('/');    // research/mfg-lab/mfg-lab.html
/* ONE SPELLING SINCE 2026-08-21, and the note it replaces is worth keeping because it names the
   defect class. It read: "in the monorepo SELFFILE is research/mfg-lab/mfg-lab.html, while the
   route table resolves /mfg-lab to the EXPORT path mfg-lab/index.html. String equality therefore
   reported the artifact as orphaned by itself in one tree and not the other." Two spellings for
   one file is what made that possible; the structure migration leaves one, because a page's path
   IS its URL in both trees now. The prefix strip is kept as a widening, not a requirement — it
   costs nothing and it stays true in a tree where either historical move is what happened. */
const isSelf = (f) => f === SELFFILE || f === SELFFILE.replace(/^(site|research)\//, '');
const siteLinks = [...html.matchAll(/href="(\/[^"]*)"/g)].map(m => norm(m[1].split('#')[0]));
const reachedFiles = new Set();
for (const r of new Set(siteLinks)) { const s = serve(r); if (s.file) reachedFiles.add(s.file); }

/* I1b SPLIT IN TWO ON 2026-08-21, and the split is a correction of the assertion's DOMAIN rather
   than a relaxation of it.

   WHAT IT USED TO ASSERT: every source in the deploy map — rewrites AND redirects — resolves to a
   file this artifact links to. That was a fair proxy for "no deployed route is orphaned" while
   this page WAS the site's hub and the map held about thirty rules, most of them into the unlisted
   tier and exempted by hand. It is not a fair proxy any more, and the reason is structural: the
   structure migration retires 68 addresses at once, so the map is now mostly MIGRATION 301s. A
   301's source is a RETIRED address. Nothing should link it — linking a retired address is the
   defect, not the absence of a link — so asking "is this source linked from the lab artifact"
   asks the wrong question of 68 of the rules and would fail on every one of them for being
   correct.

   THE TIER EXEMPTION IS GONE WITH ITS SUBJECT. It read: a route retired into /x/ satisfies neither
   U6 (a listed page may not link into the tier) nor I1b (every deployed route must be linked), so
   the contradiction was resolved in U6's favour and counted out loud. There is no /x/ space and no
   U6; an unlisted page is served at its own address now, so nothing is orphaned by construction
   and no exemption is needed.

   I1b  — REWRITES, the addresses served IN PLACE. A rewrite is a live address with no page of its
          own, so if nothing links it, nothing reaches it. This is the original assertion, kept at
          full strength on the set it was actually about. IT COVERS ZERO RULES TODAY and that is
          NAMED rather than left to look like a pass (C53): the last rewrite retired when every
          page moved to its route.
   I1c  — REDIRECTS, the retired addresses. The question that matters for a 301 is the other one:
          does it LAND somewhere. A redirect into a file that is not there is a 404 with an extra
          hop, and after a migration that renames 68 URLs it is the single most likely defect in
          the tree. This is a NEW assertion, not a renamed one, and its domain is every redirect
          rule in the map. */
const rewriteOrphans = [];
for (const [src] of REWRITES) {
  const s = serve(src);
  /* A route that serves no file is I4's finding, which carries the repair instruction. Asserting
     it here too would double-report one defect, and passing it here would be a skip counted as a
     pass — so it is neither: it is left to the assertion that owns it. */
  if (!s.file) continue;
  const self = isSelf(s.file);
  ok(self || reachedFiles.has(s.file),
     'I1b no rewritten route is orphaned: ' + src + ' -> ' + s.file + (self ? ' (self)' : ''));
  if (!(self || reachedFiles.has(s.file))) rewriteOrphans.push(src);
}
console.log('   I1b domain: ' + REWRITES.size + ' rewrite(s)' +
  (REWRITES.size === 0
    ? ' — ZERO, so I1b asserted nothing this run. Named, not counted as a pass: every page is served'
      + '\n        by a file at its own address since the 2026-08-21 migration, so the rewrite step is empty.'
    : ''));

{
  const dead = [];
  for (const [src, rule] of REDIRECTS) {
    if (isExternal(rule.destination)) continue;          /* the host catch-all leaves this deploy */
    if (String(src).includes(':')) continue;             /* a :path* pattern has no single answer */
    const s = serve(src);
    if (!s.file) dead.push(src + ' -> ' + rule.destination + ' (serves no file)');
  }
  ok(dead.length === 0,
     'I1c every redirect lands on a file that exists — a 301 into nothing is a 404 with an extra hop  ['
     + (dead.length ? dead.join(' · ') : REDIRECTS.size + ' redirect(s), all land') + ']');
}
/* RETIRED 2026-08-21 WITH A VERDICT, not by vanishing. This read:
     ok(tierRetired.every(t => / -> \/x\//.test(t)),
        'I1c every orphan exemption is a 301 into /x/ and nothing else');
   It was the guard on I1b's ONE exemption — it made sure the exemption could only ever cover
   routes retired into the unlisted tier, so nobody could quietly widen it into a general escape
   hatch. It was the right shape for a gate with an exemption in it.
   THERE IS NO EXEMPTION LEFT TO GUARD. The tier was a DIRECTORY (site/_gated/) flattened to a
   second URL space (/x/), and the structure migration deleted both: an unlisted page is served at
   its own address now, unindexed rather than relocated, so no route is orphaned by construction
   and I1b needs no exemption. A guard on an empty set is the vacuous pass this repository names
   in C10 — it would print green having decided nothing. The I1c identifier is REUSED above for a
   different and non-vacuous assertion (every redirect lands on a file), which is stated here so a
   reader of an older log does not think one check silently changed meaning. */

/* --------------------------------- I2 · in-page routes are real routes */
const artRoutes = new Set([...html.matchAll(/data-route="([^"]+)"/g)].map(m => m[1]));
ok(artRoutes.size >= 5, 'I2a the artifact exposes its routes (' + artRoutes.size + ')');
/* I2b's FLOOR IS RETIRED, its BODY IS KEPT. The floor said "the landing page routes inward with
   at least five data-goto targets" -- a statement about a page that no longer exists. The body
   said "every data-goto target is a real route", which is about the ROUTER and is still true and
   still worth gating: a button that navigates to a route the map does not define is a dead
   control wherever it sits. So the count is no longer asserted, and every target that IS present
   is still checked. If the artifact carries none, this loop is vacuous and says so. */
const gotos = [...start.matchAll(/data-goto="([^"]+)"/g)].map(m => m[1]);
console.log('   I2b data-goto targets present: ' + gotos.length +
            (gotos.length ? '' : '  (none — the landing page that carried them was removed)'));
for (const g of new Set(gotos))
  ok(artRoutes.has(g), 'I2 data-goto target is a real route: ' + g);

/* --------------------------------------------------------- I3 · THE SHAPE — RETIRED 2026-07-30
   I3a..I3e asserted the SHAPE OF THE LANDING PAGE: exactly one featured Lab card, exactly three
   receipt cards, at least five list entries, the list idiom, and the Lab card ordered before the
   evidence for it. Every one of those is a statement about `pgStart`, which was deliberately
   deleted. They are recorded here as RETIRED WITH THEIR SUBJECT rather than removed silently,
   which is the classification LAB_DISSOLUTION requires before any orphaned check is dropped.

   None of them re-homes. They are not general page hygiene -- they encode an editorial hierarchy
   ("the Lab is the product, not one exhibit among many") for a page that no longer exists. The
   equivalent judgement now lives on the site homepage, whose own battery gates it: a rendered
   floor, no hidden section, every section carrying text, no horizontal overflow at five widths.
   5 checks retired. Recorded, not lost. */

/* ------------------------------------------ I4 · the package does not exist */
/* WHAT WENT WRONG HERE, because the shape of the bug is the reason for the shape
   of the fix.

   The old I4 read a hardcoded list, `['index.html', 'lab.html']`, and opened
   each file with no existence guard; then it did `if (!/install/i.test(page))
   continue`. Two consequences, both measured 2026-07-28 rather than argued:

     (a) mfg-lab.html contains the string "install" ZERO times, so it took the
         `continue` every run. Every one of I4's 2 checks came from lab.html —
         which SITE_ARCHITECTURE §7 step 3 deletes. Re-pointing the list at the
         surviving file would have left I4 running and asserting NOTHING, which
         is the worst of the three outcomes: it still prints, it still counts,
         and it is no longer evidence.
     (b) With lab.html absent the gate threw ENOENT and took I5 and the summary
         line down with it.

   The `continue` is the deeper defect. I4's subject is an ABSENCE — "no page
   presents this command" — and skipping every page that does not already
   mention installing turns an absence assertion into a presence assertion about
   whatever pages happen to mention it. An absence claim's domain is the whole
   set, or it is not an absence claim.

   THE REBUILD, and what it costs.

   I4a (absence) now runs UNCONDITIONALLY on every page the route map deploys.
   Its domain is derived from a live record, not written down — retire a route
   and the domain shrinks with it, which is the failure catalogue's rule ("a
   probe premised on a live record's value dies the moment the record moves —
   derive the bad input from the record, or synthesize it, never write it down").

   I4b (disclosure) still runs only on pages that DO mention installing, because
   "say plainly that it is not published" is meaningless addressed to a page that
   never raises the subject. Its domain is therefore conditional, and after step
   3 it will be EMPTY: an encoding-aware sweep of all 98 files in the export
   allowlist (2026-07-28) found the "not on PyPI" prose in exactly two of them,
   mfg-lab/lab.html and mfg-lab/tools/lab-template.html, and §4 deletes BOTH.
   So I4b is reported as N/A when it has no subject, and N/A is printed, counted
   as zero checks, and never as a pass. THAT IS A REAL LOSS OF COVERAGE and it is
   recorded here rather than absorbed: after step 3 no shipped page states the
   distribution's publication status, because no shipped page discusses
   installing it. If one ever does again, I4b re-arms itself automatically.

   I4z is what stops that loss from hollowing out I4 altogether. The detector is
   mutation-tested in BOTH directions on synthetic fixtures, so the absence
   assertion is proved to have teeth independently of whether any page currently
   trips it. A green probe that cannot expire is worth more than a strict one
   that can.

   KNOWN COVERAGE BOUNDARY, deliberately not closed here. Three files in the
   export allowlist that SURVIVE step 3 do write `pip install mfg-lab` with no
   nearby retraction: python/pyproject.toml (a comment naming the distribution),
   python/tests/test_crosslang_lab.py and python/tools/lab_reference.js (both
   prose headers). They are source files, not pages — nobody lands on them from
   a route — so they are outside I4's stated subject and widening I4 to cover
   them would be this gate asserting something it was never asked to assert.
   Flagged for a deliberate decision; NOT silently adopted, and NOT silently
   dropped. The two /enclosure/ papers are genuinely pages and are also outside
   the domain, for a different reason: their path differs between this tree and
   the export, and the in-tree one is a private research path this file may not
   name (see the I1 note above). */

/* Normalise a shipped page to READABLE TEXT before matching prose against it.
   A tag strip alone is not enough, and this repo has already paid for that:
   "grep for the phrase AND its encodings — HTML entities, &nbsp;, curly quotes
   and line wrapping all defeat a naive pattern." `pip&nbsp;install`,
   `mfg&#8209;lab` and a zero-width space inside the command all survive a tag
   strip untouched, and each one would let the forbidden claim sit on the page
   while the gate reported it absent — a false negative wearing a green tick. */
function readable(raw) {
  return raw
    .replace(/<[^>]+>/g, ' ')                                  // markup can split a phrase
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"').replace(/&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))            // decimal entities
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, '')                // zero-width: invisible splitters
    .replace(/[\u2010-\u2015\u2212]/g, '-')                    // hyphen / dash / minus variants
    .replace(/[‘’‛]/g, "'").replace(/[“”]/g, '"')
    .replace(/[\u00A0\u2007\u2009\u202F]/g, ' ')               // non-breaking and thin spaces
    .replace(/\s+/g, ' ');
}

/* The forbidden claim. WIDER than the prose it has to catch today — `\s+`
   tolerates the double space a tag strip leaves behind, `mfg-?lab` catches the
   unhyphenated form — because a claim that slips past a narrow pattern is a
   claim the gate certified by accident. The lookahead is the retraction: the
   command is allowed to appear if it is taken back inside the same sentence. */
const WORKING_INSTALL =
  /pip\s+install\s+mfg-?lab(?![^.]{0,80}(not published|not on PyPI|from source))/i;
/* The retraction itself, in the words the pages actually use. NOT widened, ever:
   every alternative added here makes the I4b assertion EASIER to satisfy. */
const DISCLAIMED =
  /not on PyPI|not published to PyPI|install (it )?from (the )?(source|repository)/i;

/* WHO I4b IS ADDRESSED TO — "this page raises installing THE DISTRIBUTION".
   It used to be the bare substring `/install/i`, which was sound only while the domain was
   two hand-picked lab pages. The redirect-aware domain (2026-07-29) put the homepage in
   scope and the substring immediately misfired on it: index.html says the verifier is
   *"standard library only — **no install**, no wheels, no network"*, which is a NEGATION
   about a standalone Python file and raises nothing about the mfglab distribution at all.
   Demanding "say plainly that mfg-lab is not on PyPI" of that sentence is a non-sequitur,
   and a gate that demands non-sequiturs is a gate that gets argued with instead of fixed.
   NARROWED to name the subject, and the narrowing costs no coverage of the thing I4 exists
   for: I4a (the FORBIDDEN CLAIM) is unchanged and runs UNCONDITIONALLY on every page in the
   domain, so a page that actually presents the command is caught there whatever this
   predicate says. This one only decides who additionally owes a disclosure. Both directions
   are probed on fixtures below — the narrowing is proved, not asserted. */
const RAISES_INSTALL =
  /pip\s+install|install[^.]{0,60}\bmfg-?lab\b|\bmfg-?lab\b[^.]{0,60}\binstall/i;

/* I4z · the detector, mutation-tested in both directions on fixtures written
   here rather than read from the tree — so these three cannot go vacuous no
   matter what happens to the pages. */
ok(WORKING_INSTALL.test(readable('just run <code>pip&nbsp;install&#32;mfg&#8209;lab</code> and go')),
   'I4z the detector fires through &nbsp;, a numeric entity and a non-breaking hyphen');
ok(!WORKING_INSTALL.test(readable('pip install mfg-lab will not work: it is not on PyPI')),
   'I4z the detector stays silent when the command is retracted in the same sentence');
ok(DISCLAIMED.test(readable('<b>not published to PyPI yet</b>, so install it from the repository')),
   'I4z the disclosure pattern recognises the retraction the pages actually write');
/* I4z · the CLAIMANT filter, both directions. The false-positive fixture is the homepage's
   real sentence, kept here as a fixture rather than read from the page — a probe premised on
   a live page's wording dies the moment the wording moves. */
ok(RAISES_INSTALL.test(readable('the package: <code>pip&nbsp;install&#32;mfg&#8209;lab</code>')),
   'I4z the claimant filter fires on an install command through entities and a soft hyphen');
ok(RAISES_INSTALL.test(readable('mfg-lab is not yet something you can install')),
   'I4z the claimant filter fires when the subject is raised in prose, without a command');
ok(!RAISES_INSTALL.test(readable('standard library only &mdash; <b>no install</b>, no wheels, no network.')),
   'I4z the claimant filter stays silent on a page that says a standalone file needs NO install');

/* THE DOMAIN — every page the deployed route map serves, resolved and guarded.
   A route that serves no file is a LOUD failure with a repair instruction, never an ENOENT
   and never a quiet skip: a skip is not a pass.
   REDIRECT-AWARE 2026-07-29 with the rest of this file: the domain is now every route SOURCE
   resolved through redirects -> filesystem -> rewrites, not the raw `destination` strings.
   A 301's destination is a page a reader really lands on, so it is really in the domain, and
   the domain went from 1 page to 6 the day this changed — every one of them a page the map
   deploys and this absence claim had never read. */
const pages = [];
const seenFile = new Set();
let wildcardRoutes = 0;
for (const [src] of ROUTES) {
  /* A SEGMENT-WILDCARD ROUTE HAS NO SINGLE ANSWER, and resolving it as a literal is how a correct
     rule reports itself dead: `/technical-reports/erdos290/:path*` matched against the filesystem
     looks for a file literally named `:path*`. These arrived on 2026-08-21 with the structure
     migration, which retires whole asset PREFIXES (an erdos290 program pack, a lane of verifiers,
     the alien-science fellows pack) rather than single pages, and one rule per prefix is the only
     honest way to keep those addresses alive. They are SKIPPED here and COUNTED OUT LOUD below —
     a skip that prints as a pass is the fake certificate this tree exists to refuse (C6, C53).
     What still covers them: I1c proves every non-wildcard redirect lands on a real file, and
     tools/check-vercel-schema.js proves the deploy target accepts every rule. */
  if (String(src).includes(':')) { wildcardRoutes++; continue; }
  const s = serve(src);
  if (s.external) continue;                 /* off-site: not ours to make claims about */
  if (!s.file) {
    ok(false, 'I4 route ' + src + ' resolves to no file (tried ' + fsCandidates(s.dead).join(' / ') +
       '). Delete the route row in the same change as the page, or restore the page — ' +
       'a page may not be removed while a route still advertises it');
    continue;
  }
  /* PUBLIC-shaped, deliberately: this is the page's deployed identity and it must read the
     same in both trees. Deriving it from the on-disk path would make a monorepo page
     announce itself as `../research/…`, which is not a page name and would break the
     artRel comparison below. Two routes onto one file are one page, scanned once. */
  if (seenFile.has(s.file)) continue;
  seenFile.add(s.file);
  pages.push({ name: s.file, text: readable(fs.readFileSync(onDisk(s.file), 'utf8')) });
}
if (wildcardRoutes) {
  console.log('   I4 ' + wildcardRoutes + ' segment-wildcard route(s) NOT resolved here — a `:path*` rule has no\n'
    + '        single file to resolve to. Named, not passed: I1c covers every literal redirect.');
}
/* The artifact is in the domain whether or not a route names it — it is this
   battery's own subject, and it is the one page guaranteed to be readable here
   (guarded at the top). This is what makes the domain structurally non-empty. */
const artRel = path.relative(ROOT, ART).split(path.sep).join('/');
if (!pages.some(p => p.name === artRel)) pages.push({ name: artRel, text: readable(html) });

ok(pages.length > 0,
   'I4a the absence claim has a non-empty domain (' + pages.length + ' deployed pages). ' +
   'This check exists because I4 was once an assertion over a domain of zero');

for (const p of pages)
  ok(!WORKING_INSTALL.test(p.text),
     'I4a ' + p.name + ' does not present `pip install mfg-lab` as a working command');

const claimants = pages.filter(p => RAISES_INSTALL.test(p.text));
for (const p of claimants)
  ok(DISCLAIMED.test(p.text),
     'I4b ' + p.name + ' raises installing, so it must say plainly that the package is ' +
     'not published yet');

console.log('   I4  ' + pages.length + ' deployed pages scanned · ' + (claimants.length
  ? claimants.length + ' raise installing: ' + claimants.map(p => p.name).join(', ')
  : 'NONE raises installing — I4b is N/A and contributes 0 checks (a skip, NOT a pass)'));

/* ------------------------- I5 · prose guards — MOVED 2026-07-30, not deleted
   These policed the LANDING PAGE's promotional prose: no "guaranteed", no "fastest", no "best in
   the world", no unfilled ⟨placeholders⟩ or TODO/FIXME left in copy. With `pgStart` removed the
   scope became the whole 289 KB artifact, and at that scope BOTH guards produce false positives
   on legitimate technical writing -- measured, not assumed:

     "guaranteed"  -> "a composite modulus has no guaranteed inverses and no Schwartz-Zippel
                      bound" — mathematics, not a promise.
     ⟨ ⟩           -> inner-product and expectation notation throughout the modules, not
                      unfilled placeholders.

   Widening a marketing guard onto technical prose does not make it stronger, it makes it wrong,
   and a check that cries wolf gets suppressed. So the guard follows its SUBJECT: promotional
   prose now lives on the site pages, and the check is re-homed to research/_engine/tests/test-layout-site.py
   where it runs against home, papers, program and contact. Moved, with the same three patterns.
   2 checks leave this file; 4 pages gain them. */

console.log('   ' + pass + ' PASS, ' + fail + ' FAIL');
if (fail) { console.error('landing-page gate FAILED'); process.exit(1); }
