/* build.js — /swell/, gated.
   apps/swell · cert-machine

   usage: node apps/swell/build.js
     1. the batteries: the window instrument's (the decider Swell borrows) and Swell's own (apps/swell/battery.js);
        either red refuses the build;
     2. the app shell (app/build-app.js): the pinned data re-hashed, the page, the modules as text;
     3. on a desk with a feed on disk: the day, into site/swell/data/ (git-ignored) — the published day is built by
        the daily Action and lives on the swell-field branch.
   MIT licensed. Part of cert-machine.                                                                        */
'use strict';
const path = require('path');
const fs = require('fs');
const cp = require('child_process');
const ROOT = path.join(__dirname, '..', '..');

function run(cmd) {
  const r = cp.spawnSync(process.execPath, [cmd], { cwd: ROOT, encoding: 'utf8' });
  const tail = (r.stdout || '').trim().split('\n').slice(-1)[0];
  if (r.status !== 0) { process.stderr.write((r.stdout || '') + (r.stderr || '')); throw new Error('REFUSED: ' + cmd + ' failed'); }
  return tail;
}

if (require.main === module) {
  console.log('  ' + run('instruments/window/battery.js'));
  console.log('  ' + run('apps/swell/battery.js'));
  const git = (() => { try { return cp.execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return null; } })();
  const out = require('./app/build-app.js').emit(git);
  console.log('  site/swell/index.html ' + (out.bytes / 1024).toFixed(0) + ' KB, model.js ' + (out.model / 1024).toFixed(0) + ' KB, app.js ' + (out.app / 1024).toFixed(0) + ' KB; data served from ' + out.dataAt.slice(0, 7));
  if (fs.existsSync(path.join(ROOT, 'corpus', 'swell', 'feed'))) {
    const r = cp.spawnSync(process.execPath, ['apps/swell/build-day.js'], { cwd: ROOT, encoding: 'utf8' });
    if (r.status !== 0) { process.stderr.write(r.stdout + r.stderr); process.exit(1); }
    console.log('  ' + r.stdout.trim());
  }
}
