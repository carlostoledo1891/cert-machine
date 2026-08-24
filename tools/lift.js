#!/usr/bin/env node
/* lift.js — copy instruments OUT of the source lab, and never write back.

   Two modes, one manifest (LIFT.json):

     node tools/lift.js            copy every item, apply every declared patch,
                                   write PROVENANCE.json
     node tools/lift.js --check    re-hash both ends and NAME what moved
                                   (`make drift`). Exit 0 always — it reports.

   PROVENANCE.json records, per lifted file: the source path, the source
   sha256 AT LIFT TIME, the local sha256 after patching, and whether a patch
   touched it. That is the whole audit: if the source moves we can see it, if
   we edited a copy we can see that too, and neither can be confused for the
   other. Nothing here ever opens the source tree for writing. */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const MAN = JSON.parse(fs.readFileSync(path.join(ROOT, 'LIFT.json'), 'utf8'));
const SRC = MAN.source_root;
const CHECK = process.argv.includes('--check');

const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const rel = (a, b) => path.relative(a, b).split(path.sep).join('/');

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (e.isFile()) out.push(p);
  }
  return out;
}

/* Expand the manifest into concrete (srcFile -> dstFile) pairs. */
function pairs() {
  const out = [];
  for (const it of MAN.items) {
    const s = path.join(SRC, it.src);
    if (!fs.existsSync(s)) { out.push({ missing: it.src }); continue; }
    if (fs.statSync(s).isDirectory()) {
      const ex = new Set(it.exclude || []);
      for (const f of walk(s, [])) {
        const r = rel(s, f);
        if (ex.has(r)) continue;
        out.push({ src: it.src + '/' + r, dst: it.dst + '/' + r, item: it.src });
      }
    } else {
      out.push({ src: it.src, dst: it.dst, item: it.src });
    }
  }
  return out;
}

function applyPatches() {
  const touched = new Map();
  for (const p of MAN.patches || []) {
    const f = path.join(ROOT, p.file);
    if (!fs.existsSync(f)) { console.log('  PATCH SKIPPED (no such file): ' + p.file); continue; }
    let txt = fs.readFileSync(f, 'utf8'), n = 0;
    for (const [from, to] of p.replace) {
      if (!txt.includes(from)) {
        console.log('  PATCH ANCHOR MISSING in ' + p.file + ': ' + from.slice(0, 60) + '…');
        continue;
      }
      txt = txt.split(from).join(to); n++;
    }
    if (n) { fs.writeFileSync(f, txt); touched.set(p.file, { n, why: p.why }); }
  }
  return touched;
}

if (CHECK) {
  const prov = JSON.parse(fs.readFileSync(path.join(ROOT, 'PROVENANCE.json'), 'utf8'));
  let moved = 0, edited = 0, gone = 0, ok = 0;
  for (const f of prov.files) {
    const s = path.join(SRC, f.src), d = path.join(ROOT, f.dst);
    if (!fs.existsSync(s)) { console.log('SOURCE GONE   ' + f.src); gone++; continue; }
    const nowSrc = sha(s);
    const nowDst = fs.existsSync(d) ? sha(d) : null;
    if (nowSrc !== f.src_sha256) { console.log('SOURCE MOVED  ' + f.src + '  (' + f.src_sha256.slice(0, 12) + ' -> ' + nowSrc.slice(0, 12) + ')'); moved++; }
    if (nowDst !== f.local_sha256) { console.log('LOCAL EDITED  ' + f.dst + (f.patched ? '  [was patched at lift]' : '')); edited++; }
    if (nowSrc === f.src_sha256 && nowDst === f.local_sha256) ok++;
  }
  console.log('');
  console.log('drift: ' + ok + ' unchanged · ' + moved + ' source moved · ' + edited + ' local edited · ' + gone + ' source gone');
  console.log('(a report, not a gate — a moved source is information, and a local edit is allowed. Both are named.)');
  process.exit(0);
}

/* ---- lift ---- */
console.log('lifting from ' + SRC);
const P = pairs();
const missing = P.filter(p => p.missing);
for (const m of missing) console.log('  MISSING IN SOURCE: ' + m.missing);
const files = [];
for (const p of P.filter(x => !x.missing)) {
  const s = path.join(SRC, p.src), d = path.join(ROOT, p.dst);
  fs.mkdirSync(path.dirname(d), { recursive: true });
  fs.copyFileSync(s, d);
  files.push({ src: p.src, dst: p.dst, src_sha256: sha(s) });
}
console.log('  copied ' + files.length + ' files');

console.log('applying declared patches');
const touched = applyPatches();
for (const [f, t] of touched) console.log('  patched ' + f + ' (' + t.n + ' replacement group(s))');

for (const f of files) {
  f.patched = touched.has(f.dst);
  f.local_sha256 = sha(path.join(ROOT, f.dst));
}

fs.writeFileSync(path.join(ROOT, 'PROVENANCE.json'), JSON.stringify({
  source_root: SRC,
  lifted_at_utc: new Date().toISOString(),
  policy: MAN.policy,
  counts: { files: files.length, patched: touched.size, missing_in_source: missing.length },
  files
}, null, 1) + '\n');
console.log('  PROVENANCE.json written: ' + files.length + ' files, ' + touched.size + ' patched');
