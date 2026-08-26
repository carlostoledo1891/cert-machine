#!/usr/bin/env node
'use strict';
/* Pointer to the monorepo single-source kernel (not a second copy — drift trap). */
module.exports = require(require('path').join(__dirname, '..', '..', 'swap-consistency.js'));
