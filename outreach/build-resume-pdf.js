#!/usr/bin/env node
/* build-resume-pdf.js — outreach/<dir>/resume.md -> resume.pdf in the same directory, through the repo's one
   headless-Chrome client (design/cdp.js). One builder for every outreach resume variant (moved out of
   outreach/primeintellect/ on 2026-10-16, when the v3 base in outreach/resume/ was written). The parser, the page
   and the print live in outreach/resume-lib.js since 2026-10-29, shared with the public CV (apps/cv/build.js).

   PERSONAL LINES NEVER ENTER THE TRACKED FILE. resume.md carries [OPERATOR FILLS name] marks; resume.private.md
   (git-ignored) holds "@@ name" blocks that replace them. A mark with no block prints on a yellow highlight, so a
   draft can never be mistaken for the finished page.

   usage: node outreach/build-resume-pdf.js outreach/resume          -> outreach/resume/resume.pdf
          node outreach/build-resume-pdf.js outreach/primeintellect   -> the 2026-10-05 variant */
'use strict';
const fs = require('fs');
const path = require('path');
const LIB = require('./resume-lib.js');

if (!process.argv[2]) { console.error('usage: node outreach/build-resume-pdf.js <dir with resume.md>'); process.exit(2); }
const HERE = path.resolve(process.argv[2]);
if (!fs.existsSync(path.join(HERE, 'resume.md'))) { console.error('no resume.md in ' + HERE); process.exit(2); }
const md = fs.readFileSync(path.join(HERE, 'resume.md'), 'utf8');
const fills = LIB.readFills(path.join(HERE, 'resume.private.md'));
const { html, head, left } = LIB.renderHtml(md, { fills, register: 'site', docWord: 'resume' });
const outPath = path.join(HERE, 'resume.pdf');
LIB.printPdf(html, { footerLeft: head.name + ' · resume', outPath, port: 9231 }).then(({ pages }) => {
  console.log(outPath + ' written, ' + pages + ' page(s)' + (left ? ` — ${left} placeholder(s) still marked in yellow` : ' — no placeholders left'));
}).catch((e) => { console.error(e.message || e); process.exit(1); });
