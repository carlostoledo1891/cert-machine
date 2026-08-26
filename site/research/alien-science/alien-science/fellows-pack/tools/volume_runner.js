#!/usr/bin/env node
'use strict';
/* Re-exec the authoritative Node volume runner (single source). */
const path = require('path');
const { spawnSync } = require('child_process');
const target = path.join(__dirname, '..', '..', 'volume-runner.js');
const r = spawnSync(process.execPath, [target, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: process.env
});
process.exit(r.status == null ? 1 : r.status);
