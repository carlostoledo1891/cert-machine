#!/usr/bin/env node
/* sparse-at-pin.js — a blobless, sparse, depth-1 checkout of ONE commit of a public repository, into a directory
   outside this repository (a fresh temp dir unless one is named). Only the paths matched by the sparse patterns are
   downloaded; the checkout refuses unless HEAD is the pinned commit and the tree is clean. Used by recorders that
   READ a pinned upstream and keep no copy of it (tools/record-openai-hodge-statement.js).

   usage (module):  const { sparseAtPin } = require('./sparse-at-pin.js');
                    const dir = sparseAtPin('https://github.com/openai/math.git', '<40-hex>', ['/lean/docs/032.md'], dir?)
   usage (cli):     node tools/sparse-at-pin.js <url> <40-hex pin> <dir> <pattern> [<pattern> ...]
                    (a dir that already holds a checkout of that pin is reused after the same refusals) */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

function sparseAtPin(url, pin, patterns, dir) {
  if (!/^[0-9a-f]{40}$/.test(pin || '')) throw new Error('sparse-at-pin: the pin must be a full 40-hex commit');
  if (!patterns.length) throw new Error('sparse-at-pin: no sparse pattern');
  const target = dir || fs.mkdtempSync(path.join(os.tmpdir(), 'sparse-' + pin.slice(0, 8) + '-'));
  const ROOT = path.resolve(__dirname, '..');
  if (path.resolve(target).startsWith(ROOT + path.sep)) throw new Error('sparse-at-pin: refusing a checkout inside this repository: ' + target);
  const git = (args, opts) => cp.execFileSync('git', args, Object.assign({ cwd: target, encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'] }, opts || {}));
  const fresh = !fs.existsSync(path.join(target, '.git'));
  if (fresh) {
    fs.mkdirSync(target, { recursive: true });
    git(['init', '-q']);
    git(['remote', 'add', 'origin', url]);
  } else if (git(['remote', 'get-url', 'origin']).trim() !== url) throw new Error('sparse-at-pin: ' + target + ' is a checkout of another remote');
  git(['sparse-checkout', 'set', '--no-cone'].concat(patterns));
  const have = (() => { try { return git(['rev-parse', 'HEAD']).trim(); } catch (e) { return null; } })();
  if (have !== pin) {
    git(['fetch', '-q', '--depth', '1', '--filter=blob:none', 'origin', pin]);
    git(['checkout', '-q', '--detach', pin]);
  } else git(['checkout', '-q', '--detach', pin]);   /* re-applies the sparse patterns; fetches any blob newly matched */
  const head = git(['rev-parse', 'HEAD']).trim();
  if (head !== pin) throw new Error('sparse-at-pin: the checkout is at ' + head + ', not ' + pin);
  if (git(['status', '--porcelain']).trim()) throw new Error('sparse-at-pin: the checkout at ' + target + ' has local modifications');
  return target;
}

module.exports = { sparseAtPin };

if (require.main === module) {
  const [url, pin, dir, ...patterns] = process.argv.slice(2);
  if (!url || !pin || !dir || !patterns.length) { console.error('usage: node tools/sparse-at-pin.js <url> <pin> <dir> <pattern> [...]'); process.exit(2); }
  try { console.log(sparseAtPin(url, pin, patterns, path.resolve(dir))); } catch (e) { console.error(e.message); process.exit(1); }
}
