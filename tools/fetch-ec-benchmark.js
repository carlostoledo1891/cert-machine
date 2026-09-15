#!/usr/bin/env node
/* fetch-ec-benchmark.js — the environmental-contour benchmark's bytes, pinned.

   corpus/ec-benchmark holds the benchmark's submitted contours (162 files,
   committed: they are the claims) and its twelve hourly datasets (55 MB,
   NOT committed: they are fetched from the benchmark's own repository at one
   pinned commit and verified against corpus/ec-benchmark/meta.json). NDBC's
   and WDCC's terms apply to the datasets; nothing here re-serves them.

   usage: node tools/fetch-ec-benchmark.js          fetch what is missing, verify everything
          node tools/fetch-ec-benchmark.js --check  verify only; exit 1 on a missing or drifted file
          node tools/fetch-ec-benchmark.js --pin    rewrite meta.json from the files on disk (a new pin — say why in the commit) */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const ROOT = path.resolve(__dirname, '..');
const CORPUS = path.join(ROOT, 'corpus', 'ec-benchmark');
const META = path.join(CORPUS, 'meta.json');
const REPO = 'ec-benchmark-organizers/ec-benchmark';
const COMMIT = 'a1561fe739b1b74e1c7da76e8fcf555e3316c8a2';
const arg = process.argv[2] || '';

const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const walk = (d, out = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, out); else if (e.name !== 'meta.json' && e.name !== 'claims.json' && !e.name.startsWith('.')) out.push(p); } return out; };
const upstreamOf = (rel) => {
  if (rel.startsWith('contours/')) return 'results/exercise-1/' + rel.slice('contours/'.length);
  if (rel.startsWith('datasets/') || rel.startsWith('datasets-retained/')) return rel;
  if (rel.startsWith('procedure/viroconcom-1.4.8-')) return 'pypi:viroconcom-1.4.8.tar.gz (sha256 b9f82e4ff02342e7a2167a264fbb633e8810c7da4e306d78804840695010cb42) viroconcom/' + rel.slice('procedure/viroconcom-1.4.8-'.length);
  if (rel.startsWith('procedure/')) return 'results/exercise-1/' + rel.slice('procedure/'.length);
  return null;
};

if (arg === '--pin') {
  const files = {};
  for (const p of walk(CORPUS).sort()) {
    const rel = path.relative(CORPUS, p).split(path.sep).join('/');
    files[rel] = { bytes: fs.statSync(p).size, sha256: sha(p), upstream: upstreamOf(rel), committed: !rel.startsWith('datasets') };
  }
  const meta = {
    what: 'The environmental-contour benchmark (Haselsteiner et al., 2021): every contour submitted to Exercise 1, byte for byte, the six provided and six retained hourly datasets they were tested against, and the organizers\' counting procedure — held at one commit of the benchmark\'s repository and re-hashed by the ledger runner at every run.',
    repo: 'github.com/' + REPO, commit: COMMIT, fetched: '2026-09-12',
    paper: { preprint: '2021-01-19_EC_Benchmark_Joint_Paper_WithFrontPages.pdf (publications/, same commit)', sha256: 'aff4e73974488ac4992a78b9157299d17b835f045f60d1eeb68332ec06e0e130', bytes: 6899667, published: 'Ocean Engineering 236 (2021) 109504, doi:10.1016/j.oceaneng.2021.109504 — the numbers compared on the page are the PREPRINT\'s Tables 5 and 6, which is the version the repository carries' },
    license: 'the repository carries no licence file; the submitted contours are redistributed verbatim as the published record, for verification only. Datasets A–C are NDBC\'s (ndbc.noaa.gov) and D–F are WDCC\'s (coastDat, cera-www.dkrz.de terms of use); they are NOT committed here — fetched from the pinned commit by tools/fetch-ec-benchmark.js and verified by digest.',
    files,
  };
  fs.writeFileSync(META, JSON.stringify(meta, null, 1) + '\n');
  console.log('pinned ' + Object.keys(files).length + ' files @ ' + COMMIT.slice(0, 8));
  process.exit(0);
}

const meta = JSON.parse(fs.readFileSync(META, 'utf8'));
const fetch = (url) => new Promise((res, rej) => {
  https.get(url, { headers: { 'User-Agent': 'cert-machine' } }, (r) => {
    if (r.statusCode !== 200) { rej(new Error(url + ' -> HTTP ' + r.statusCode)); r.resume(); return; }
    const chunks = []; r.on('data', (c) => chunks.push(c)); r.on('end', () => res(Buffer.concat(chunks)));
  }).on('error', rej);
});

(async () => {
  let missing = 0, drifted = 0, fetched = 0;
  for (const [rel, m] of Object.entries(meta.files)) {
    const p = path.join(CORPUS, rel);
    if (!fs.existsSync(p)) {
      if (arg === '--check' || !m.upstream || m.upstream.startsWith('pypi:')) { console.error('MISSING ' + rel); missing++; continue; }
      const url = 'https://raw.githubusercontent.com/' + REPO + '/' + meta.commit + '/' + m.upstream.split('/').map(encodeURIComponent).join('/');
      process.stdout.write('fetching ' + rel + ' … ');
      const buf = await fetch(url);
      const h = crypto.createHash('sha256').update(buf).digest('hex');
      if (h !== m.sha256) { console.error('DRIFT: fetched bytes hash ' + h.slice(0, 12) + ', pin says ' + m.sha256.slice(0, 12) + ' — not written'); drifted++; continue; }
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, buf); fetched++;
      console.log(buf.length + ' bytes, digest matches');
      continue;
    }
    if (sha(p) !== m.sha256) { console.error('DRIFT ' + rel); drifted++; }
  }
  console.log('ec-benchmark corpus: ' + Object.keys(meta.files).length + ' files pinned, ' + fetched + ' fetched now, ' + missing + ' missing, ' + drifted + ' drifted');
  process.exit(missing || drifted ? 1 : 0);
})().catch((e) => { console.error(e.message); process.exit(1); });
