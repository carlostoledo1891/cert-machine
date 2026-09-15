/* instruments/ecbench/lib.js — the exact reader for the environmental-contour
   benchmark (github.com/ec-benchmark-organizers/ec-benchmark).

   Every number in the benchmark is a decimal literal: an hourly sea state
   "0.2845; 4.7252" in a dataset, a contour vertex "4.283446918632201;
   7.469377172830912" in a submission. Each is read as the RATIONAL its digits
   denote — kept as the literal string beside its float64 image, so the fast
   path runs in doubles and the exact path (BigInt at a fixed decimal scale)
   is entered only where a float cannot decide (instruments/ecbench/decide.js).

   Column order is read from each file's HEADER, never assumed: the benchmark's
   submissions put wave height first or second by author, and the organizers'
   scripts carry a hand-made list of who did which. Both readings are kept so
   the ledger can say whether they agree. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const CORPUS = path.join(ROOT, 'corpus', 'ec-benchmark');

/* ---- decimal literals ---- */
const DEC_RE = /^([+-]?)(\d+)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/;
/* a literal -> { s: normalised literal, v: float64 image } ; throws on anything else */
function lit(s) {
  s = String(s).trim();
  if (!DEC_RE.test(s)) throw new Error('not a decimal literal: "' + s + '"');
  const v = Number(s);
  if (!Number.isFinite(v)) throw new Error('literal does not fit a double: ' + s);
  return { s, v };
}
/* the exact value of a literal as a BigInt at scale 10^K (i.e. literal × 10^K) */
function scaled(s, K) {
  const m = DEC_RE.exec(s);
  const neg = m[1] === '-', frac = m[3] || '';
  let num = BigInt(m[2] + frac), k = BigInt(frac.length);
  if (m[4]) { const e = BigInt(m[4]); if (e >= 0n) num *= 10n ** e; else k += -e; }
  const KK = BigInt(K);
  if (k > KK) {
    /* more digits than the scale carries: refuse rather than round */
    if (num % (10n ** (k - KK)) !== 0n) throw new Error('literal ' + s + ' needs more than ' + K + ' decimals');
    num /= 10n ** (k - KK);
  } else num *= 10n ** (KK - k);
  return neg ? -num : num;
}
const decimals = (s) => { const m = DEC_RE.exec(s); let k = (m[3] || '').length; if (m[4]) k = Math.max(0, k - Number(m[4])); return k; };

/* ---- files ---- */
const readText = (rel) => fs.readFileSync(path.join(CORPUS, rel), 'utf8');
const sha256 = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(CORPUS, rel))).digest('hex');
const lines = (txt) => txt.split('\n').map((l) => l.replace(/\r$/, '')).filter((l) => l.trim().length > 0);

/* which of two header cells names significant wave height */
const isHs = (h) => /wave\s*heig|^\s*hs\s*$|h_?s\b/i.test(h) && !/period|wind/i.test(h);   /* 'heig': one submission spells it heigth */
const isPeriod = (h) => /period|^\s*tz\s*$|t_?z\b/i.test(h);
const isWind = (h) => /wind|^\s*u10\s*$|^\s*ws\s*$|u_?10\b/i.test(h);

/* A contour file: header + rows of two literals. Returns vertices in the
   canonical frame (u, h): u = the second variable (Tz for A–C, wind for D–F),
   h = significant wave height. */
function readContour(rel) {
  const L = lines(readText(rel));
  const head = L[0].split(';').map((x) => x.trim());
  if (head.length < 2) throw new Error(rel + ': header has ' + head.length + ' cells');
  let hsCol;
  if (isHs(head[0]) && !isHs(head[1])) hsCol = 0;
  else if (isHs(head[1]) && !isHs(head[0])) hsCol = 1;
  else throw new Error(rel + ': cannot tell which column is Hs from header "' + L[0] + '"');
  const other = head[1 - hsCol];
  const kind = isPeriod(other) ? 'tz' : isWind(other) ? 'wind' : null;
  if (!kind) throw new Error(rel + ': second variable unrecognised in header "' + L[0] + '"');
  const pts = [];
  for (let i = 1; i < L.length; i++) {
    const cells = L[i].split(';').map((x) => x.trim()).filter((x) => x.length);
    if (cells.length !== 2) throw new Error(rel + ':' + (i + 1) + ': ' + cells.length + ' cells');
    const a = lit(cells[0]), b = lit(cells[1]);
    pts.push(hsCol === 0 ? { u: b, h: a } : { u: a, h: b });
  }
  if (pts.length < 3) throw new Error(rel + ': ' + pts.length + ' vertices');
  return { rel, header: L[0], hsCol, kind, pts, sha256: sha256(rel) };
}

/* A dataset file: "time; var1; var2" hourly. A–C are (Hs, Tz); D–F are (wind, Hs). */
function readDataset(rel) {
  const L = lines(readText(rel));
  const head = L[0].split(';').map((x) => x.trim());
  if (head.length !== 3) throw new Error(rel + ': header has ' + head.length + ' cells');
  let hsCol, kind;
  if (isHs(head[1]) && isPeriod(head[2])) { hsCol = 1; kind = 'tz'; }
  else if (isWind(head[1]) && isHs(head[2])) { hsCol = 2; kind = 'wind'; }
  else throw new Error(rel + ': header "' + L[0] + '" not understood');
  const n = L.length - 1;
  const u = new Float64Array(n), h = new Float64Array(n);
  const us = new Array(n), hs = new Array(n), t = new Array(n);
  for (let i = 1; i < L.length; i++) {
    const c = L[i].split(';').map((x) => x.trim());
    if (c.length !== 3) throw new Error(rel + ':' + (i + 1) + ': ' + c.length + ' cells');
    const a = lit(c[1]), b = lit(c[2]);
    const H = hsCol === 1 ? a : b, U = hsCol === 1 ? b : a;
    u[i - 1] = U.v; h[i - 1] = H.v; us[i - 1] = U.s; hs[i - 1] = H.s; t[i - 1] = c[0];
  }
  return { rel, header: L[0], kind, n, u, h, us, hs, t, sha256: sha256(rel) };
}

/* The twelve datasets are not committed (55 MB, NDBC's and WDCC's); they are
   fetched from the pinned commit and verified by digest. A battery or a ledger
   run on a fresh clone fetches them itself and SAYS SO — a gate that fails for
   want of a download it could have made is a gate that gets skipped. */
function ensureCorpus() {
  const meta = JSON.parse(fs.readFileSync(path.join(CORPUS, 'meta.json'), 'utf8'));
  const missing = Object.keys(meta.files).filter((rel) => !fs.existsSync(path.join(CORPUS, rel)));
  if (!missing.length) return 0;
  console.log('  ecbench: ' + missing.length + ' pinned file(s) absent — fetching from ' + meta.repo + ' @ ' + meta.commit.slice(0, 8) + ' (tools/fetch-ec-benchmark.js)');
  const r = require('child_process').spawnSync('node', [path.join(ROOT, 'tools', 'fetch-ec-benchmark.js')], { cwd: ROOT, stdio: 'inherit' });
  if (r.status !== 0) throw new Error('ecbench: the fetch did not complete — run node tools/fetch-ec-benchmark.js and read its output');
  return missing.length;
}

module.exports = { ROOT, CORPUS, lit, scaled, decimals, readText, sha256, lines, readContour, readDataset, isHs, isPeriod, isWind, ensureCorpus };
