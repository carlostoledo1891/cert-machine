#!/usr/bin/env node
/* build-report-verify-seal.js — reports/verify-seal.html: Verify Seal, for a researcher with a draft to protect. Plain
   words first (seal before anything goes into a cloud model), the rigor one layer down (the app doctrine). Read from
   certs/seal-battery.json (instruments/seal/battery.py) and seals/registry.jsonl alone: a battery that is not PASS, a
   planted forgery that came back CERTIFIED, a red control that did not fire, or a registry line that is not a digest line
   refuses the page. The operator, 2026-11-05: build it now; link the tool; the card's tag stays "In development" until
   the first use (claimbox's next proposal sealed before it is decided) is on this page as a row.

   usage: node tools/build-report-verify-seal.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('VERIFY SEAL REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const GH = 'https://github.com/carlostoledo1891/cert-machine/blob/main/';
const esc = C.esc;
const rec = (rel) => '<a href="' + C.escAttr(GH + rel) + '"><span class="m">' + esc(rel) + '</span></a>';
const m = (t) => '<span class="m">' + esc(t) + '</span>';
const tag = (v) => C.tag(v, v === 'CERTIFIED' ? 'held' : v === 'REFUTED' ? 'fail' : 'open');

const REC = 'certs/seal-battery.json', REG = 'seals/registry.jsonl', TOOL = 'instruments/seal/seal.py', README = 'instruments/seal/README.md';
const B0 = JSON.parse(fs.readFileSync(path.join(ROOT, REC), 'utf8'));
if (B0.verdict !== 'PASS') die('the battery record is ' + B0.verdict);
if (B0.certified !== 0) die(B0.certified + ' planted forgeries came back CERTIFIED');
if (B0.failed.length || B0.reds_dead.length) die('the battery lists failed cases or dead red controls');
for (const f of B0.forgeries) if (!['REFUTED', 'REFUSED'].includes(f.verdict)) die('forgery "' + f.forgery + '" has the word ' + f.verdict);
if (!B0.red_controls.every((r) => r.fired)) die('a red control did not fire');
const v2 = B0.forgeries.filter((f) => /^v2: /.test(f.forgery)), v1 = B0.forgeries.filter((f) => !/^v2: /.test(f.forgery));
if (!v2.length) die('the record holds no v2 forgery, and this page describes v2');
const HEX = /^[0-9a-f]{64}$/;
const regLines = fs.existsSync(path.join(ROOT, REG)) ? fs.readFileSync(path.join(ROOT, REG), 'utf8').split('\n').filter((l) => l.trim()) : [];
const registry = regLines.map((l, i) => { let r; try { r = JSON.parse(l); } catch (e) { die('registry line ' + (i + 1) + ' is not JSON'); }
  if (!HEX.test(String(r.digest)) || !/^\d{4}-\d{2}-\d{2}$/.test(String(r.posted))) die('registry line ' + (i + 1) + ' is not a digest line'); return r; });
const N = (x) => Number(x).toLocaleString('en-US');

const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · Verify Seal',
  title: 'Prove you held the draft, without showing it',
  deck: 'Researchers now hold back directions for fear that a draft pasted into a frontier model comes back as someone else’s paper. A seal lets you prove, later, that you held these exact bytes by this date, and shows nothing until you choose to. Seal before anything goes into a cloud model. One file, Python’s standard library, nothing of the content leaves your machine.'
}));
B.push(C.stats([
  { k: 'planted forgeries certified', v: String(B0.certified) + ' of ' + B0.planted, n: 'flipped bytes, wrong salts, renamed or added files, edited manifests: every one REFUTED or REFUSED' },
  { k: 'cases in the battery', v: String(B0.cases.length), n: 'the honest seals certified, the date rule, the unconfirmed anchors, determinism, the shell one-liner' },
  { k: 'red controls fired', v: B0.red_controls.filter((r) => r.fired).length + ' of ' + B0.red_controls.length, n: 'a deliberately broken opener or verifier is caught every time' },
  { k: 'digests in the public registry', v: String(registry.length), n: registry.length ? 'each a git commit date, the second anchor' : 'none yet: the first seal is scheduled, and it is our own' },
]));

/* the story, for a researcher: one minute, plain words */
B.push(C.section({
  lab: 'in one minute', title: 'What a seal is, and when to make one', id: 'story',
  bodyRaw: C.pRaw('<b>The worry.</b> You have a draft, a statement, a direction, and you want help from a model, a colleague, a referee. Once the bytes leave your machine you cannot prove you had them first. <a href="https://teorth.github.io/tao-web/ai-views.html">Terence Tao said as much in his Math 2.0 talk</a>: people hold back.')
    + C.pRaw('<b>The seal.</b> On your machine, the tool makes a deterministic archive of the file or folder, draws 32 random bytes (the salt), and computes one number from the two: the digest. The archive and the salt stay with you. Only the digest goes out, to two public anchors nobody here controls: OpenTimestamps, which ties it to a Bitcoin block, and this repository’s registry, where one commit holds it. The digest reveals nothing: without the salt there is nothing to guess, and a 32-byte salt is not guessed.')
    + C.pRaw('<b>The reveal, when you choose.</b> Hand over the archive and the salt. Anyone re-derives the digest with one line of shell, without this tool, and reads the anchors’ dates. Sealed file by file, you can show one file, the theorem statement, say, while the notes stay sealed: the manifest names no path and no salt.')
    + C.pRaw('<b>What to do today.</b> Seal the folder before the first paste into a cloud model. Keep the bundle somewhere you will find it; a lost salt is an unopenable seal. The commands are three lines, below.')
}));

/* gaps first: what it does not say */
B.push(C.section({
  lab: 'what stays open', title: 'What a seal does not say', id: 'open',
  bodyRaw: C.plainList([
    { b: 'It does not prove priority of an idea.', text: 'It proves possession of exact bytes by a date. Someone else may have held the same idea earlier, sealed or not.' },
    { b: 'It does not say the content is correct, or whose it is.', text: 'A seal of a wrong proof is a seal of a wrong proof; a seal of copied bytes is a seal of copied bytes.' },
    { b: 'The date is the anchors’, never yours.', text: 'The time stamp the tool writes at sealing is a local claim and is labelled so in every output; the only dates a verdict uses are the Bitcoin block’s and the registry commit’s. A claim earlier than every confirmed anchor is REFUSED, never certified.' },
    { b: 'A short statement alone can be guessed.', text: 'One line can be guessed and hashed by someone who already suspects it; the salt defeats that, which is why the digest is of salt and hash together. Seal the whole draft anyway.' },
    { b: 'A lost salt is an unopenable seal.', text: 'Without it the digest proves nothing to anyone, including you. The bundle keeps the salt beside the archive; the backup is yours.' },
    { b: 'The registry is as strong as GitHub’s record of a push.', text: 'A maintainer could backdate a commit locally; that is why the registry is the second anchor and OpenTimestamps the first.' },
    { b: 'Other operating systems are the open check.', text: 'The archive rules leave nothing OS-dependent and the battery re-archives the same files under another locale and time zone, but only macOS has run here; a run on Linux or Windows that re-derives a digest from this page’s rules is the outside check.' },
  ])
}));

/* how: the commands */
B.push(C.section({
  lab: 'how', title: 'Three commands, and three more to show one file', id: 'how', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('The tool is one file, ' + rec(TOOL) + ', with its ' + rec(README) + '. Python 3.9 or later, standard library only; no network except the anchoring step, and that step sends the digest and nothing else.') + '</div>'
    + C.code('python3 seal.py seal  <file-or-folder>            # -> <name>.seal/ : archive.tar, salt.hex, seal.json, digest.txt; prints the digest\npython3 seal.py stamp <name>.seal                 # OpenTimestamps (ots stamp, free) + the registry line to post\npython3 seal.py open  <name>.seal [--by YYYY-MM-DD] [--registry <clone of this repository>]')
    + '<div class="col">' + C.pRaw('<b>One file at a time (v2).</b> Seal a folder file by file; later, show one file and keep the rest sealed.') + '</div>'
    + C.code('python3 seal.py seal2  <folder>                   # -> <name>.seal2/ : manifest.json, salts.json (private), archive.tar (private), salt.hex, seal.json, digest.txt\npython3 seal.py reveal <name>.seal2 <path>         # the package that shows ONE file: its bytes, its salt, the manifest, the seal and its anchors\npython3 seal.py verify <package> [--by YYYY-MM-DD] [--registry <clone>]')
    + '<div class="col">' + C.pRaw('<b>Without this tool.</b> The digest is one line of shell on the bundle (macOS; on Linux, ' + m('sha256sum') + ' for ' + m('shasum -a 256') + '):') + '</div>'
    + C.code("( printf 'verify-seal-v1\\n'; xxd -r -p salt.hex; shasum -a 256 archive.tar   | cut -c1-64 | xxd -r -p ) | shasum -a 256\n( printf 'verify-seal-v2\\n'; xxd -r -p salt.hex; shasum -a 256 manifest.json | cut -c1-64 | xxd -r -p ) | shasum -a 256")
    + '<div class="col">' + C.pRaw('The battery runs both lines against the Python digest on every build.') + '</div>'
}));

/* the verdict words */
B.push(C.section({
  lab: 'the decision', title: 'Three words, and what each one needs', id: 'verdict',
  bodyRaw: C.plainList([
    { b: 'CERTIFIED.', text: 'The archive and the salt re-derive the recorded digest, and at least one public anchor is confirmed here: the digest is in it and its date is read. With a claimed date, the earliest confirmed anchor is on or before it. For one revealed file: its bytes and its name re-derive the manifest’s entry under its salt, and the manifest’s own seal re-derives; the other files stay unrevealed and undecided.' },
    { b: 'REFUTED.', text: 'The digest does not re-derive, and the input that differs is named: the archive, the salt, or the recorded digest itself, told apart by the component hashes the bundle keeps. For a revealed file: the bytes, the name, the index or the salt do not match the manifest.' },
    { b: 'REFUSED.', text: 'A part is missing or malformed, no anchor is in the bundle, an anchor is not confirmed here (an .ots not yet upgraded, no ots client, no registry clone), or every confirmed anchor is later than the claimed date. The reason says what would make it decidable.' },
  ])
}));

/* why you can trust this: the commitment and the battery, read from the record */
const fRows = (list) => list.map((f) => [f.forgery.replace(/^v2: /, ''), { raw: tag(f.verdict) }, f.reason.replace(/\s+/g, ' ').slice(0, 160) + (f.reason.length > 160 ? '…' : '')]);
B.push(C.section({
  lab: 'why you can trust this', title: 'The commitment, and the forgeries it refused', id: 'trust', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('<b>The commitment.</b> ' + m('digest = SHA256("verify-seal-v1\\n" || salt_32_bytes || SHA256(archive_bytes))') + '. The archive is a tar of the regular files under the path, names relative and NFC-normalised, sorted by their UTF-8 bytes, mtime 0, uid and gid 0, mode 0644, no directories, no symbolic links (a symlink refuses the seal), no compression: the same contents give the same bytes on any machine. The salt is exactly 64 lowercase hex characters and nothing else; a trailing newline refuses, which caught a real bug on the battery’s first run.')
    + C.pRaw('<b>One file at a time.</b> Per file, with its own salt ' + m('s_i') + ': ' + m('h_i = SHA256("verify-seal-v2-file\\n" || s_i || SHA256(bytes_i))') + ' and ' + m('q_i = SHA256("verify-seal-v2-path\\n" || s_i || path_i)') + '. The manifest holds only an index and those two hashes per file, in canonical JSON, and is sealed as above. The salts stay private; a reveal publishes one. So the manifest shows how many files were sealed and nothing else, and a revealed salt says nothing about the other files.')
    + C.pRaw('<b>The battery</b> (' + rec(REC) + ', written by ' + rec('instruments/seal/battery.py') + ' in a temporary folder with a temporary git registry; no network, no ots client, the OpenTimestamps path exercised only as present-but-unconfirmed): ' + B0.planted + ' planted forgeries, ' + B0.certified + ' certified; ' + B0.cases.length + ' cases; ' + B0.red_controls.length + ' red controls on a deliberately broken opener or verifier, each of which must turn a forgery green under it, or the battery itself fails. The tool’s sha256 is in the record (' + esc(B0.seal_py_sha256.slice(0, 12)) + '…); a changed tool must re-run the battery.') + '</div>'
    + C.table({ cols: [{ h: 'planted forgery (v1, whole bundle)' }, { h: 'word' }, { h: 'what the opener said' }], rows: fRows(v1) })
    + C.table({ cols: [{ h: 'planted forgery (v2, one file revealed, or the whole bundle)' }, { h: 'word' }, { h: 'what the verifier said' }], rows: fRows(v2) })
    + '<div class="col">' + C.plainList(B0.red_controls.map((r) => ({ b: 'Red control.', text: r.red.replace(/^v2: /, '') + (r.fired ? ' Fired.' : ' DID NOT FIRE.') }))) + '</div>'
}));

/* the registry */
B.push(C.section({
  lab: 'the registry', title: 'Digests anchored here', id: 'registry',
  bodyRaw: C.pRaw('The second anchor is ' + rec(REG) + ': one line per digest, appended by the maintainer in one commit on a request through <a href="https://github.com/carlostoledo1891/cert-machine/issues/new?template=seal.yml">the issue form</a>; ' + rec('tools/seal-registry.py') + ' refuses anything but a 64-hex digest and a repeat. The commit’s date is what ' + m('open --registry <clone>') + ' reads.')
    + (registry.length
      ? C.table({ cols: [{ h: 'digest' }, { h: 'posted' }, { h: 'issue' }], rows: registry.map((r) => [{ raw: m(r.digest) }, r.posted, '#' + r.issue]) })
      : C.pRaw('<b>No digest is registered yet.</b> The first seal is our own: claimbox, the claimant of this machine’s Lean proposals, seals its next proposal before cert-machine decides it, so that author and judge get a timestamped separation. Its digest will be the first row here, with both anchors.'))
}));

const foot = '<p>' + esc('Generated by tools/build-report-verify-seal.js from ' + REC + ' and ' + REG + ' @ git ' + git + '. The tool and this page are MIT; the design note is notes/verify-seal-design-2026-11-03.md. Built with Claude (Anthropic).') + '</p>';
fs.writeFileSync(path.join(ROOT, 'reports', 'verify-seal.html'), TPL.render({
  title: 'Prove you held the draft, without showing it · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot,
  desc: 'Verify Seal: prove you held exact bytes by a date and reveal nothing until you choose, file by file; one Python file, two public anchors, a battery of planted forgeries with none certified; what a seal does not say, first.',
  path: '/reports/verify-seal.html'
}));
console.log('reports/verify-seal.html written: battery ' + B0.verdict + ', ' + B0.planted + ' forgeries / ' + B0.certified + ' certified, registry ' + registry.length + ' digest(s) @ git ' + git);
