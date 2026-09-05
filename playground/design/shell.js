/* shell.js — the whole page shell for /instruments, and deliberately the whole of it.

   The rest of this repository generates every page from design/template.js with
   gates around it: a scope line, a certificate table that must agree with disk,
   a stale-claim check. Those exist because those pages make claims.

   THIS PLACE MAKES NONE. Nothing under /instruments is certified, nothing here is
   gated, and the point is to be free enough to show mathematics as something you
   can touch. So the shell is thirty lines, it imports nothing, and if a page
   wants to throw it away and write its own <html> it can.
*/
'use strict';

const fs = require('fs');
const path = require('path');

/* THE BASE LAYER IS THE SHELL'S JOB, not the caller's. Ten builders each read
   shell.css and pasted it into their own <style>, which is a list ten people
   have to remember; interferometer had already forgotten a different one and
   linked base.css instead. page() emits it now, and a builder passes only what
   is its own. */
const NAV = require(path.join(__dirname, '..', '..', 'design', 'nav.js'));
const BASE = NAV.navCss('var(--gutter)')
  + fs.readFileSync(path.join(__dirname, 'shell.css'), 'utf8')
  + '\n' + require(path.join(__dirname, 'components.js')).sharedCss();

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* THE NAV IS THE SITE'S NAV (2026-09-05). This section used to carry its own:
   the word "instruments/" and one link home. A reader who landed on an
   instrument page — and these are the pages most likely to be landed on
   directly — could not reach the reports, the machine or the about page
   without going home first. design/nav.js is the one nav now, markup and CSS
   together, so the two shells cannot drift apart again. */
function page({ title, desc = '', root = '', here = 'home', body, head = '', script = '', bodyClass = '' }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index, follow">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<link rel="stylesheet" href="${root}design/tokens.css">
<style>${BASE}</style>
${head}
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
${NAV.navHtml({ here: here === 'home' ? 'instruments' : here, root: root + '../' })}
${body}
${script}
</body>
</html>`;
}

module.exports = { page, esc };
