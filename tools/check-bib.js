#!/usr/bin/env node
/* check-bib.js — no reference in a paper here can be invented or go stale unnoticed.

   A paper's .bib is read entry by entry. Every entry must name a DOI, an arXiv identifier or a URL. With --verify the
   tool asks the source (Crossref, then DataCite, for a DOI; the arXiv API for an eprint; a fetch for a URL) and records
   what it answered — the resolved title and whether it matches the entry's — in corpus/bib/<paper>.json, dated. Without
   --verify the tool is the battery: offline, it refuses a .bib with an entry that has no verified row, whose identifier
   differs from the verified one, or whose title the source did not match; and it runs its red controls (an entry with a
   bogus DOI, an entry whose title was changed after verification, an entry with no identifier) through the same code,
   which must refuse each.

   usage: node tools/check-bib.js [--verify] [paper/tex/cert-machine-method.bib ...]                                MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const VERIFY = args.includes('--verify');
const files = args.filter((a) => !a.startsWith('--'));
if (!files.length) files.push('paper/tex/cert-machine-method.bib');

/* ---- a small BibTeX reader: @type{key, field = {value} | "value" | bare, ...} with nested braces ---- */
function parseBib(text) {
  const out = [];
  let i = 0;
  while ((i = text.indexOf('@', i)) >= 0) {
    const m = /^@(\w+)\s*\{/.exec(text.slice(i));
    if (!m) { i++; continue; }
    const type = m[1].toLowerCase();
    if (type === 'comment' || type === 'preamble' || type === 'string') { i += m[0].length; continue; }
    let j = i + m[0].length; let depth = 1; const start = j;
    while (j < text.length && depth) { if (text[j] === '{') depth++; else if (text[j] === '}') depth--; j++; }
    const body = text.slice(start, j - 1);
    const comma = body.indexOf(',');
    const key = body.slice(0, comma).trim();
    const fields = {};
    let rest = body.slice(comma + 1);
    const fm = /\s*(\w+)\s*=\s*/y;
    let pos = 0;
    while (pos < rest.length) {
      fm.lastIndex = pos; const f = fm.exec(rest);
      if (!f) break;
      pos = fm.lastIndex;
      let val = '';
      if (rest[pos] === '{') { let d = 1; let k = pos + 1; while (k < rest.length && d) { if (rest[k] === '{') d++; else if (rest[k] === '}') d--; k++; } val = rest.slice(pos + 1, k - 1); pos = k; }
      else if (rest[pos] === '"') { const k = rest.indexOf('"', pos + 1); val = rest.slice(pos + 1, k); pos = k + 1; }
      else { const k = rest.indexOf(',', pos); val = rest.slice(pos, k < 0 ? rest.length : k).trim(); pos = k < 0 ? rest.length : k; }
      fields[f[1].toLowerCase()] = val.replace(/\s+/g, ' ').trim();
      const c = rest.indexOf(',', pos); pos = c < 0 ? rest.length : c + 1;
    }
    out.push({ type, key, fields });
    i = j;
  }
  return out;
}

const norm = (s) => String(s).toLowerCase().replace(/\\[a-z]+/g, '').replace(/[{}'"`^~$\\]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
/* the entry's title must be found in the source's title or cover it: every word of the shorter in the longer, in any order */
function titleMatch(a, b) {
  const A = norm(a).split(' ').filter((w) => w.length > 2), B = norm(b).split(' ').filter((w) => w.length > 2);
  if (!A.length || !B.length) return false;
  const [s, l] = A.length <= B.length ? [A, B] : [B, A];
  const L = new Set(l);
  const hit = s.filter((w) => L.has(w)).length;
  return hit >= Math.ceil(0.8 * s.length);
}
const idOf = (e) => e.fields.doi ? { kind: 'doi', id: e.fields.doi.replace(/^https?:\/\/doi\.org\//, '') }
  : e.fields.eprint ? { kind: 'arxiv', id: e.fields.eprint.replace(/^arxiv:/i, '') }
  : e.fields.url ? { kind: 'url', id: e.fields.url } : null;

async function get(url, accept) {
  const r = await fetch(url, { headers: { 'User-Agent': 'cert-machine check-bib (carlos@carlostoledo.co)', Accept: accept || '*/*' }, redirect: 'follow' });
  return { status: r.status, text: r.ok ? await r.text() : '', url: r.url };
}
async function resolve(e) {
  const id = idOf(e);
  if (!id) return { ok: false, why: 'no DOI, arXiv id or URL' };
  try {
    if (id.kind === 'doi') {
      let r = await get('https://api.crossref.org/works/' + encodeURIComponent(id.id), 'application/json');
      if (r.status === 200) { const j = JSON.parse(r.text).message; const t = (j.title || [])[0] || ''; return { ...id, ok: true, source: 'crossref', resolvedTitle: t, titleMatch: titleMatch(e.fields.title, t), year: (j.issued && j.issued['date-parts'] && j.issued['date-parts'][0][0]) || null }; }
      r = await get('https://api.datacite.org/dois/' + encodeURIComponent(id.id), 'application/vnd.api+json');
      if (r.status === 200) { const j = JSON.parse(r.text).data.attributes; const t = (j.titles || [])[0] ? j.titles[0].title : ''; return { ...id, ok: true, source: 'datacite', resolvedTitle: t, titleMatch: titleMatch(e.fields.title, t), year: j.publicationYear || null }; }
      const h = await get('https://doi.org/api/handles/' + encodeURIComponent(id.id), 'application/json');
      return { ...id, ok: h.status === 200, source: 'doi.org handle', resolvedTitle: '', titleMatch: false, why: h.status === 200 ? 'the DOI resolves but neither Crossref nor DataCite holds its title' : 'the DOI does not resolve (' + h.status + ')' };
    }
    if (id.kind === 'arxiv') {
      /* the API first; it rate-limits (HTTP 429) after a few requests, so the abstract page is the fallback — its <title>
         is "[id] Title" — and a 429 there too is retried once after ten seconds */
      let r = await get('https://export.arxiv.org/api/query?id_list=' + encodeURIComponent(id.id), 'application/atom+xml');
      let m = r.status === 200 ? /<entry>[\s\S]*?<title>([\s\S]*?)<\/title>/.exec(r.text) : null;
      let t = m ? m[1].replace(/\s+/g, ' ').trim() : '';
      let source = 'arxiv api';
      if (!t || /^Error/i.test(t)) {
        for (let attempt = 0; attempt < 2 && !t; attempt++) {
          if (attempt) await new Promise((res) => setTimeout(res, 10000));
          r = await get('https://arxiv.org/abs/' + encodeURIComponent(id.id), 'text/html');
          m = r.status === 200 ? /<title>\s*\[([^\]]+)\]\s*([\s\S]*?)<\/title>/i.exec(r.text) : null;
          if (m && m[1].replace(/v\d+$/, '') === id.id.replace(/v\d+$/, '')) { t = m[2].replace(/\s+/g, ' ').trim(); source = 'arxiv abs page'; }
        }
      }
      const ok = !!t;
      return { ...id, ok, source, status: r.status, resolvedTitle: t, titleMatch: ok && titleMatch(e.fields.title, t), why: ok ? undefined : 'neither the arXiv API nor the abstract page returned the entry (HTTP ' + r.status + ')' };
    }
    const r = await get(id.id, 'text/html');
    const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(r.text);
    return { ...id, ok: r.status === 200, source: 'fetch', status: r.status, finalUrl: r.url, resolvedTitle: m ? m[1].replace(/\s+/g, ' ').trim() : '', titleMatch: r.status === 200, why: r.status === 200 ? undefined : 'HTTP ' + r.status };
  } catch (err) { return { ...id, ok: false, why: String(err.message || err) }; }
}

function check(entries, rec, label) {
  const bad = [];
  for (const e of entries) {
    const id = idOf(e);
    const row = rec.entries[e.key];
    if (!id) bad.push(e.key + ': no DOI, arXiv id or URL');
    else if (!row) bad.push(e.key + ': never verified (run --verify)');
    else if (!row.ok) bad.push(e.key + ': the source did not resolve it — ' + row.why);
    else if (row.kind !== id.kind || row.id !== id.id) bad.push(e.key + ': the identifier changed since it was verified (' + row.kind + ' ' + row.id + ' -> ' + id.kind + ' ' + id.id + ')');
    else if (row.kind !== 'url' && !row.titleMatch) bad.push(e.key + ': the source\'s title does not match — "' + row.resolvedTitle + '"');
    else if (norm(row.bibTitle) !== norm(e.fields.title)) bad.push(e.key + ': the title changed since it was verified');
  }
  return bad;
}

(async () => {
  let fails = 0;
  for (const rel of files) {
    const abs = path.resolve(ROOT, rel);
    const name = path.basename(rel, '.bib');
    const recPath = path.join(ROOT, 'corpus', 'bib', name + '.json');
    const entries = parseBib(fs.readFileSync(abs, 'utf8'));
    if (!entries.length) { console.error('CHECK-BIB REFUSED: ' + rel + ' holds no entry'); process.exit(1); }
    const keys = entries.map((e) => e.key);
    const dup = keys.filter((k, i) => keys.indexOf(k) !== i);
    if (dup.length) { console.error('CHECK-BIB REFUSED: duplicate keys ' + dup.join(', ')); process.exit(1); }
    if (VERIFY) {
      const rec = { what: 'every entry of ' + rel + ' resolved at its source (Crossref / DataCite / the arXiv API / a fetch); the offline check refuses an entry without an ok row whose title matched', verified: new Date().toISOString().slice(0, 10), entries: {} };
      for (const e of entries) {
        const r = await resolve(e);
        rec.entries[e.key] = { ...r, bibTitle: e.fields.title };
        console.log((r.ok && (r.kind === 'url' || r.titleMatch) ? '  ok   ' : '  FAIL ') + e.key.padEnd(18) + (r.kind || '-').padEnd(6) + ' ' + (r.resolvedTitle || r.why || '').slice(0, 90));
        await new Promise((res) => setTimeout(res, r.kind === 'arxiv' ? 3500 : 350));   // the arXiv API asks for three seconds between requests
      }
      fs.mkdirSync(path.dirname(recPath), { recursive: true });
      fs.writeFileSync(recPath, JSON.stringify(rec, null, 1) + '\n');
      console.log('recorded ' + path.relative(ROOT, recPath));
    }
    const rec = fs.existsSync(recPath) ? JSON.parse(fs.readFileSync(recPath, 'utf8')) : { entries: {} };
    const bad = check(entries, rec, rel);
    /* red controls: the same check must refuse a forged entry, a changed title and a missing identifier */
    const reds = [];
    const forged = JSON.parse(JSON.stringify(entries[0])); forged.key = '__forged'; forged.fields.doi = '10.1000/this-doi-was-invented'; delete forged.fields.eprint; delete forged.fields.url;
    reds.push(['an invented DOI (never verified) is refused', check([forged], rec).length === 1]);
    const changed = JSON.parse(JSON.stringify(entries[0])); changed.fields.title = changed.fields.title + ' (altered after verification)';
    reds.push(['a title altered after verification is refused', check([changed], rec).length === 1]);
    const bare = JSON.parse(JSON.stringify(entries[0])); bare.key = '__bare'; delete bare.fields.doi; delete bare.fields.eprint; delete bare.fields.url;
    reds.push(['an entry with no DOI, arXiv id or URL is refused', check([bare], rec).length === 1]);
    const fired = reds.filter((r) => r[1]).length;
    for (const [name_, ok] of reds) if (!ok) console.log('  RED DID NOT FIRE: ' + name_);
    for (const b of bad) console.log('  FAIL ' + b);
    console.log('check-bib ' + rel + ': ' + (entries.length - bad.length) + ' of ' + entries.length + ' entries verified, ' + fired + '/' + reds.length + ' red controls fired' + (rec.verified ? ' (verified ' + rec.verified + ')' : ''));
    if (bad.length || fired !== reds.length) fails++;
  }
  process.exit(fails ? 1 : 0);
})();
