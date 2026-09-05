#!/usr/bin/env node
/* zenodo-metadata.js — bring the published Zenodo records' metadata in line
   with what this repository declares, and record that it happened.

   THE TITLE LAG (corpus/zenodo.json → titleLag). The repository adopted ONE
   description on 2026-09-03 and it is correct in CLAUDE.md, README.md,
   CITATION.cff and .zenodo.json. The published records still carry the title
   retired that day, because .zenodo.json governs a NEW deposit and never
   rewrites a published one. A metadata edit on a published record mints no
   new DOI; it needs the depositor's account, which is a personal access token
   with the `deposit:write` and `deposit:actions` scopes.

       node tools/zenodo-metadata.js              dry run: live vs declared, per record
       ZENODO_TOKEN=... node tools/zenodo-metadata.js --apply
                                                  edit → update → publish, then re-read
                                                  the public record and close the lag
       node tools/zenodo-metadata.js --apply --token-file ~/.zenodo-token

   WHAT CHANGES, AND WHAT DOES NOT. The current version (corpus/zenodo.json
   `latest`) takes the declared title, description, keywords and related
   identifiers from .zenodo.json — that file IS the declared metadata for that
   version. Every other repository snapshot under the concept takes the TITLE
   ONLY: it is the same work, so it carries the work's name, but its description
   is a historical record of what it said when it was minted and stays. The
   lambda(4) deposit (10.5281/zenodo.22225861) is a different work with its own
   correct title and is never touched. The concept DOI is not a record; it
   resolves to the latest version and inherits its title.

   The token is read from the environment or a file and is never printed. */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const API = 'https://zenodo.org/api';
const APPLY = process.argv.includes('--apply');
const tokenFileArg = process.argv.indexOf('--token-file');
const TOKEN_FILE = tokenFileArg >= 0 ? process.argv[tokenFileArg + 1] : null;

const Z = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'zenodo.json'), 'utf8'));
const DECL = JSON.parse(fs.readFileSync(path.join(ROOT, '.zenodo.json'), 'utf8'));
const CFF = fs.readFileSync(path.join(ROOT, 'CITATION.cff'), 'utf8');

/* the one title, and the three places that must already agree before a
   published record is made to agree with them */
const ONE = Z.titleLag.shouldBe;
const cffTitle = (/^title:\s*"([^"]+)"/m.exec(CFF) || [])[1];
if (DECL.title !== ONE || cffTitle !== ONE) {
  console.error('REFUSED: the declared titles disagree before anything is sent.\n'
    + '  corpus/zenodo.json titleLag.shouldBe : ' + ONE + '\n'
    + '  .zenodo.json title                   : ' + DECL.title + '\n'
    + '  CITATION.cff title                   : ' + cffTitle);
  process.exit(1);
}

const idOf = (doi) => doi.split('zenodo.')[1];
const RECORDS = Z.versions
  .filter((v) => v.version !== 'lambda4-v1.0.1')          /* a different work; see the header */
  .map((v) => ({ id: idOf(v.doi), doi: v.doi, version: v.version, full: v.version === Z.latest }));

/* what each record should carry */
function wanted(rec, live) {
  const m = { ...live, title: ONE };
  if (rec.full) {
    m.description = DECL.description;
    m.keywords = DECL.keywords;
    m.related_identifiers = DECL.related_identifiers;
  }
  return m;
}

const FIELDS = ['title', 'description', 'keywords', 'related_identifiers'];
function differences(live, want) {
  const out = [];
  for (const f of FIELDS) {
    const a = JSON.stringify(live[f] ?? null), b = JSON.stringify(want[f] ?? null);
    if (a !== b) out.push({ field: f, from: live[f], to: want[f] });
  }
  return out;
}

const show = (v) => typeof v === 'string' ? (v.length > 110 ? v.slice(0, 107) + '…' : v) : JSON.stringify(v);

async function getJson(url, opts = {}) {
  const r = await fetch(url, opts);
  const text = await r.text();
  let body = null;
  try { body = JSON.parse(text); } catch (e) { /* not json */ }
  if (!r.ok) throw new Error(`${opts.method || 'GET'} ${url.replace(/access_token=[^&]+/, 'access_token=***')} → ${r.status} ${text.slice(0, 300)}`);
  return body;
}

function token() {
  if (process.env.ZENODO_TOKEN) return process.env.ZENODO_TOKEN.trim();
  if (TOKEN_FILE) return fs.readFileSync(TOKEN_FILE, 'utf8').trim();
  return null;
}

(async () => {
  console.log((APPLY ? 'zenodo metadata — APPLY' : 'zenodo metadata — dry run') + '\n  the one title: ' + ONE + '\n');

  /* 1. what is live, from the public API (no token needed) */
  const plan = [];
  for (const rec of RECORDS) {
    const pub = await getJson(`${API}/records/${rec.id}`);
    const live = pub.metadata;
    const want = wanted(rec, live);
    const diff = differences(live, want);
    plan.push({ rec, live, diff });
    console.log(`  ${rec.doi}  (${rec.version}${rec.full ? ', current — full mirror of .zenodo.json' : ', title only'})`);
    if (!diff.length) console.log('       in agreement');
    for (const d of diff) console.log(`       ${d.field}\n         live: ${show(d.from)}\n         want: ${show(d.to)}`);
  }
  const pending = plan.filter((p) => p.diff.length);
  if (!pending.length) {
    console.log('\n  nothing to change — every record already carries the declared metadata');
    if (Z.titleLag.state.startsWith('OPEN')) closeLag('verified in agreement by a dry run');
    return;
  }
  if (!APPLY) {
    console.log(`\n  ${pending.length} record(s) would change. Re-run with --apply and a token (ZENODO_TOKEN or --token-file).`);
    return;
  }

  /* 2. apply, one record at a time: edit → update → publish */
  const tok = token();
  if (!tok) { console.error('REFUSED: --apply needs ZENODO_TOKEN in the environment or --token-file <path>.'); process.exit(1); }
  const auth = { headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' } };
  for (const { rec, diff } of pending) {
    const dep = `${API}/deposit/depositions/${rec.id}`;
    const cur = await getJson(dep, auth);
    if (cur.state !== 'inprogress') await getJson(`${dep}/actions/edit`, { ...auth, method: 'POST' });
    const unlocked = await getJson(dep, auth);
    const meta = wanted(rec, unlocked.metadata);
    await getJson(dep, { ...auth, method: 'PUT', body: JSON.stringify({ metadata: meta }) });
    await getJson(`${dep}/actions/publish`, { ...auth, method: 'POST' });
    console.log(`  published ${rec.doi}: ${diff.map((d) => d.field).join(', ')} updated`);
  }

  /* 3. verify from the PUBLIC record, not from the response */
  let allGood = true;
  for (const rec of RECORDS) {
    const pub = await getJson(`${API}/records/${rec.id}`);
    const left = differences(pub.metadata, wanted(rec, pub.metadata));
    if (left.length) { allGood = false; console.log(`  STILL DIFFERS ${rec.doi}: ${left.map((d) => d.field).join(', ')}`); }
    else console.log(`  verified ${rec.doi}: ${pub.metadata.title}`);
  }
  if (allGood) closeLag('applied through the deposit API and re-read from the public records');
  else process.exit(1);
})().catch((e) => { console.error('zenodo-metadata failed: ' + e.message); process.exit(1); });

/* the lag closes in the record that reported it, so check-wiring stops
   printing the note for a reason it can read */
function closeLag(how) {
  const today = new Date().toISOString().slice(0, 10);
  Z.titleLag.state = 'CLOSED ' + today + ' — ' + how;
  Z.titleLag.liveTitleIs = ONE;
  Z.titleLag.closedBy = 'tools/zenodo-metadata.js';
  fs.writeFileSync(path.join(ROOT, 'corpus', 'zenodo.json'), JSON.stringify(Z, null, 1) + '\n');
  console.log('\n  corpus/zenodo.json titleLag → ' + Z.titleLag.state);
}
