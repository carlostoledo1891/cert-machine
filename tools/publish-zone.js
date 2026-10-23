#!/usr/bin/env node
/* publish-zone.js — publish another repository's build into its foreign zone of site/, and pin it.
   tools/ · cert-machine · MIT

   WHY (2026-10-23). site/clade-code/ is a FOREIGN ZONE (design/zones.js): clade-code builds the page, carlostoledo.co
   serves it. Updating it must not mean rebuilding this site, and must not be able to lose anything this repository
   pins. So publishing is one commit built with git plumbing on top of origin/main, in a private index:

     · it holds the zone's files and their pin, corpus/zones/<name>.json (every file's sha256 and size, and the source
       repository's commit), and NOTHING ELSE — the commit is refused if it would change any other path;
     · this checkout is never touched: not its working tree, not its index, not its branch (a session working here keeps
       its uncommitted work; a later `git pull --rebase` brings the zone in);
     · no build and no gate runs: the site is static, so the push alone redeploys it, with every other page unchanged;
     · a push that races another (the feeds push to main every day) is rebuilt on the new origin/main, five tries.

   usage
     node tools/publish-zone.js clade-code              dry run: what would change, nothing pushed
     node tools/publish-zone.js clade-code --push       commit and push (the operator's word)
       --src <dir>        the build to publish (default: the zone's src in design/zones.js)
       -m <message>       the commit message (default: names the source commit and the file count)
     node tools/publish-zone.js --check                 the battery: every zone in this checkout matches its pin  */
'use strict';

const fs = require('fs');
const os = require('os');
const cp = require('child_process');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const { FOREIGN } = require(path.join(ROOT, 'design', 'zones.js'));
const MAX_FILE = 10 * 1024 * 1024, MAX_TOTAL = 20 * 1024 * 1024;   /* far under GitHub's 100 MB and Vercel's limits */

const die = (m) => { console.error('publish-zone REFUSES: ' + m); process.exit(1); };
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const nameOf = (z) => z.dir.replace(/\/$/, '');
const pinPath = (z) => 'corpus/zones/' + nameOf(z) + '.json';

/* every regular file under dir, '/'-separated, sorted; .DS_Store is not content; a symlink is refused */
function files(dir) {
  const out = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isSymbolicLink()) throw new Error('a symlink: ' + path.relative(dir, p));
      if (e.isDirectory()) walk(p);
      else if (e.isFile() && e.name !== '.DS_Store') out.push(path.relative(dir, p).split(path.sep).join('/'));
    }
  })(dir);
  return out.sort();
}

/* the pin check, on any directory and pin: null when they agree, else the reason */
function disagree(dir, pin) {
  const have = fs.existsSync(dir) ? files(dir) : [];
  if (!pin) return have.length ? 'site/' + path.basename(dir) + '/ has ' + have.length + ' file(s) and no pin — copied by hand, not published' : null;
  const want = Object.keys(pin.files).sort();
  const extra = have.filter((f) => !pin.files[f]), gone = want.filter((f) => !have.includes(f));
  if (extra.length) return 'not in the pin: ' + extra.join(', ');
  if (gone.length) return 'pinned but missing: ' + gone.join(', ');
  for (const f of want) if (sha(fs.readFileSync(path.join(dir, f))) !== pin.files[f].sha256) return f + ' differs from its pinned sha256 — edited here, or copied by hand';
  return null;
}

if (process.argv.includes('--check')) {
  /* red controls first: a check that cannot fail is decoration */
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'zone-red-'));
  const z = path.join(tmp, 'zone'); fs.mkdirSync(z);
  fs.writeFileSync(path.join(z, 'index.html'), 'a');
  const pin = { files: { 'index.html': { sha256: sha(Buffer.from('a')), bytes: 1 } } };
  const reds = [
    ['an agreeing zone passes', () => disagree(z, pin) === null],
    ['an edited byte is caught', () => { fs.writeFileSync(path.join(z, 'index.html'), 'b'); const r = disagree(z, pin) !== null; fs.writeFileSync(path.join(z, 'index.html'), 'a'); return r; }],
    ['an extra file is caught', () => { fs.writeFileSync(path.join(z, 'x.js'), ''); const r = disagree(z, pin) !== null; fs.rmSync(path.join(z, 'x.js')); return r; }],
    ['a zone with no pin is caught', () => disagree(z, null) !== null],
    ['no zone and no pin passes', () => disagree(path.join(tmp, 'absent'), null) === null],
  ];
  let bad = 0;
  for (const [what, f] of reds) { const okRed = f(); if (!okRed) bad++; console.log('  ' + (okRed ? 'RED ok' : 'RED FAIL') + '  ' + what); }
  fs.rmSync(tmp, { recursive: true, force: true });
  for (const zone of FOREIGN) {
    const pinFile = path.join(ROOT, pinPath(zone));
    const r = disagree(path.join(ROOT, 'site', nameOf(zone)), fs.existsSync(pinFile) ? JSON.parse(fs.readFileSync(pinFile, 'utf8')) : null);
    if (r) { bad++; console.log('  FAIL  site/' + zone.dir + ' — ' + r); }
    else console.log('  ok    site/' + zone.dir + (fs.existsSync(pinFile) ? ' matches ' + pinPath(zone) : ' not published (no files, no pin)'));
  }
  process.exit(bad ? 1 : 0);
}

/* ---------------------------------------------------------------- publish -- */
const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const zone = FOREIGN.find((z) => nameOf(z) === args[0]);
if (!zone) die('name a foreign zone (' + FOREIGN.map(nameOf).join(', ') + '), from design/zones.js');
const PUSH = args.includes('--push');
const src = path.resolve((opt('--src') || zone.src).replace(/^~(?=\/)/, os.homedir()));
if (!fs.existsSync(path.join(src, 'index.html'))) die(src + ' has no index.html — build it first (' + zone.build + ')');

let list;
try { list = files(src); } catch (e) { die(e.message); }
const pin = { zone: 'site/' + zone.dir, src, files: {} };
let total = 0;
for (const f of list) {
  const buf = fs.readFileSync(path.join(src, f));
  if (buf.length > MAX_FILE) die(f + ' is ' + buf.length + ' bytes; a file in a zone stays under ' + MAX_FILE);
  total += buf.length;
  pin.files[f] = { sha256: sha(buf), bytes: buf.length };
}
if (total > MAX_TOTAL) die('the build is ' + total + ' bytes; a zone stays under ' + MAX_TOTAL);

/* the source repository's commit: provenance, not a condition (a dirty or commit-less source is recorded as such) */
const inSrc = (a) => { try { return cp.execFileSync('git', ['-C', src, ...a], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) { return null; } };
const top = inSrc(['rev-parse', '--show-toplevel']);
const head = top ? inSrc(['rev-parse', 'HEAD']) : null;
const tilde = (p) => p && p.replace(os.homedir(), '~');
pin.src = tilde(src);
pin.source = { repository: tilde(top), commit: head, dirty: head ? (inSrc(['status', '--porcelain', '--untracked-files=no']) || '') !== '' : null };
if (!pin.source.commit) console.log('  note  the source has no commit to pin: the bytes are pinned by sha256 alone');
else if (pin.source.dirty) console.log('  note  the source repository has uncommitted changes: its commit ' + pin.source.commit.slice(0, 8) + ' may not reproduce these bytes');
const index = fs.readFileSync(path.join(src, 'index.html'), 'utf8');
const noindex = /<meta[^>]+name=["']robots["'][^>]*noindex/i.test(index);

const git = (a, o = {}) => cp.execFileSync('git', a, { cwd: ROOT, maxBuffer: 1 << 28, ...o }).toString().trim();
const ZPATH = 'site/' + nameOf(zone);

function build(base) {
  const tmpIndex = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'zone-index-')), 'index');
  const env = { ...process.env, GIT_INDEX_FILE: tmpIndex };
  git(['read-tree', base], { env });
  /* the zone is replaced whole: its old entries go (mode 0 removes), then the build's go in */
  const old = git(['ls-files', '--cached', '--', ZPATH, pinPath(zone)], { env }).split('\n').filter(Boolean);
  pin.published = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  const lines = old.map((p) => '0 ' + '0'.repeat(40) + '\t' + p)
    .concat(list.map((f) => '100644 ' + git(['hash-object', '-w', path.join(src, f)]) + '\t' + ZPATH + '/' + f));
  const pinBlob = git(['hash-object', '-w', '--stdin'], { input: JSON.stringify(pin, null, 1) + '\n' });
  lines.push('100644 ' + pinBlob + '\t' + pinPath(zone));
  git(['update-index', '--index-info'], { env, input: lines.join('\n') + '\n' });
  const tree = git(['write-tree'], { env });
  fs.rmSync(path.dirname(tmpIndex), { recursive: true, force: true });
  /* THE GUARANTEE: nothing outside the zone and its pin changes */
  const touched = git(['diff-tree', '-r', '--name-only', base, tree]).split('\n').filter(Boolean);
  const outside = touched.filter((p) => !p.startsWith(ZPATH + '/') && p !== pinPath(zone));
  if (outside.length) die('the commit would change paths outside the zone: ' + outside.join(', '));
  const quiet = { stdio: ['ignore', 'pipe', 'ignore'] };   /* a zone not yet published has no subtree: not an error */
  const same = (() => { try { return git(['rev-parse', base + ':' + ZPATH], quiet) === git(['rev-parse', tree + ':' + ZPATH], quiet); } catch (e) { return false; } })();
  return { tree, touched, same };
}

git(['fetch', '-q', 'origin', 'main']);
let base = git(['rev-parse', 'origin/main']);
let b = build(base);
const status = git(['diff-tree', '-r', '--name-status', base, b.tree, '--', ZPATH]);
console.log('zone      ' + ZPATH + '/   from ' + src);
console.log('files     ' + list.length + ', ' + total + ' bytes; index.html ' + (noindex ? 'carries noindex (a draft)' : 'has NO noindex (indexable)'));
console.log('source    ' + (pin.source.repository || '(not a git repository)') + (pin.source.commit ? ' @ ' + pin.source.commit.slice(0, 12) + (pin.source.dirty ? ' (dirty)' : '') : ''));
console.log('base      origin/main ' + base.slice(0, 8));
if (b.same) { console.log('unchanged the zone on origin/main already holds these bytes; nothing to publish'); process.exit(0); }
console.log('changes   ' + (status ? status.split('\n').join('  ·  ') : '(the zone is new)') + '  ·  M/A ' + pinPath(zone));
if (!PUSH) { console.log('DRY RUN   nothing pushed; add --push to publish (the operator\'s word)'); process.exit(0); }

const msg = opt('-m') || (ZPATH + '/: published from ' + (pin.source.repository ? path.basename(pin.source.repository) : 'its build')
  + (pin.source.commit ? ' ' + pin.source.commit.slice(0, 8) + (pin.source.dirty ? ' (dirty)' : '') : '') + ' — ' + list.length + ' file(s), '
  + total + ' bytes, pinned in ' + pinPath(zone) + '; nothing else changed (tools/publish-zone.js)');
for (let i = 1; i <= 5; i++) {
  const commit = git(['commit-tree', b.tree, '-p', base], { input: msg + '\n' });
  try {
    git(['push', '-q', 'origin', commit + ':refs/heads/main'], { stdio: ['ignore', 'pipe', 'pipe'] });
    console.log('PUSHED    ' + commit.slice(0, 8) + ' on origin/main — the site redeploys by itself in about a minute');
    console.log('          this checkout was not touched; `git pull --rebase` here brings the zone in when convenient');
    process.exit(0);
  } catch (e) {
    console.log('  race  origin/main moved (try ' + i + '); rebuilding on the new tip');
    git(['fetch', '-q', 'origin', 'main']);
    base = git(['rev-parse', 'origin/main']);
    b = build(base);
    if (b.same) { console.log('unchanged the new tip already holds these bytes'); process.exit(0); }
  }
}
die('the push failed five times; nothing was changed on origin');
