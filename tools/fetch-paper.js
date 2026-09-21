#!/usr/bin/env node
/* fetch-paper.js — fetch a publisher page the way a reader does, and keep it.

   Wiley (agupubs.onlinelibrary.wiley.com) and Elsevier (sciencedirect.com)
   sit behind Cloudflare and answer curl and headless Chrome with "Just a
   moment…" forever; a HEADED Chrome driven over design/cdp.js passes the
   challenge in a few seconds. This waits until the title stops being the
   challenge, then serialises the document — for an XML full text
   (doi/full-xml/…, where the MathML the HTML rendering drops lives) the
   XMLSerializer gives the bytes back verbatim.

   The result is a pin, not a source: hash it into the corpus's meta.json and
   transcribe the numbers you read into claims.json, as corpus/blacksea-
   breaking/paper/ does. Open-access only; the licence goes in the claims.

   usage: node tools/fetch-paper.js <url> <out-file> [wait-s]
     node tools/fetch-paper.js https://agupubs.onlinelibrary.wiley.com/doi/full-xml/10.1029/2026GL122293 corpus/x/paper.xml */
'use strict';
const fs = require('fs');
const path = require('path');
const { withChrome, settle } = require(path.join(__dirname, '..', 'design', 'cdp.js'));
const [url, out, waitS] = [process.argv[2], process.argv[3], Number(process.argv[4] || 60)];
if (!url || !out) { console.error('usage: node tools/fetch-paper.js <url> <out-file> [wait-s]'); process.exit(2); }
withChrome(async (send) => {
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url });
  let title = '';
  for (let i = 0; i < waitS / 3; i++) {
    await settle(3000);
    const t = await send('Runtime.evaluate', { expression: 'document.title', returnByValue: true });
    title = t.result ? String(t.result.value) : '';
    if (title && !/just a moment|attention required/i.test(title)) break;
  }
  if (/just a moment|attention required/i.test(title)) throw new Error('the challenge did not clear in ' + waitS + ' s');
  await settle(4000);
  const r = await send('Runtime.evaluate', { expression: 'new XMLSerializer().serializeToString(document)', returnByValue: true });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, r.result.value);
  console.log(out + ' — ' + fs.statSync(out).size + ' bytes — "' + title + '"');
}, { headed: true, callTimeout: 60000 }).catch((e) => { console.error('fetch-paper: ' + e.message); process.exit(1); });
