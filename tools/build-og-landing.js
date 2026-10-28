#!/usr/bin/env node
/* build-og-landing.js — the landing's share card: the link preview a recipient sees before the page (og:image and
   twitter:image of / only; every other page keeps the site card, design/assets/og.png).

   WHAT IT SETS, AND WHY NOTHING ELSE. The landing's title and the one description, D1 (CLAUDE.md: adopted 2026-09-03,
   held for a year, never paraphrased) — the title is D1's head, so the card reads as one sentence in two sizes: the H1,
   then the rest of D1 as the deck. No number goes on it. A card is rendered when this tool runs, not with every build,
   so anything that can move between builds would go stale on it unseen; D1 cannot move without a decision.

   HOW. Our own page: the header is composed by design/components.js inside design/template.js's page shell (the nav,
   the tokens, the type, the ink; no colour of its own), written to a temporary file and driven in Chrome through
   design/cdp.js with a real wait for the fonts, at 2x and scaled down by sips to 1200 × 630. Beside the PNG it writes a
   receipt (design/assets/og-landing.json): the words it set and the PNG's SHA-256. tools/build-site.js serves the card
   at /og-landing.png and refuses the landing when the receipt's words are not the page's title and D1, the bytes are
   not the receipt's, or the PNG is not 1200 × 630 under 300 KB.

   usage: node tools/build-og-landing.js            then make page (the sync serves it)
   tools/ · cert-machine                                                                                         MIT */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'design', 'assets', 'og-landing.png');
const REC = path.join(ROOT, 'design', 'assets', 'og-landing.json');
const MAX = 300 * 1024;

/* D1 read once, here, for this tool and for tools/build-site.js: the first quoted line of CLAUDE.md, checked against
   the title corpus/zenodo.json says the archive carries */
function readD1() {
  const m = /^> (.+)$/m.exec(fs.readFileSync(path.join(ROOT, 'CLAUDE.md'), 'utf8'));
  const one = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'zenodo.json'), 'utf8')).titleLag.shouldBe.replace(/^cert-machine:\s*/i, '');
  if (!m || !m[1].toLowerCase().startsWith(one.toLowerCase() + ' — ')) throw new Error('CLAUDE.md no longer opens with the one description corpus/zenodo.json names ("' + one + ' — …")');
  const head = m[1].slice(0, m[1].indexOf(' — '));
  return { text: m[1], head, tail: m[1].slice(head.length + 1) };
}

/* the card, as a page of the house shell: the landing's eyebrow, D1's head as the H1, D1's tail as the deck */
function cardHtml(D1) {
  const C = require(path.join(ROOT, 'design', 'components.js'));
  const TPL = require(path.join(ROOT, 'design', 'template.js'));
  return TPL.render({
    title: D1.head, path: '/', footRaw: null,
    desc: D1.text,
    /* the card is a still: no entrance motion, and the page's own column, set a little lower so the block sits centred */
    cssRaw: 'h1,.deck,.stats{animation:none}\n.page{padding-top:var(--s-8)}\n.og-host{margin-top:var(--s-7)}',
    bodyRaw: C.header({ eyebrow: 'Carlos Toledo · independent certification', title: D1.head, deck: D1.tail })
      + '\n<div class="col og-host"><div class="eyebrow">carlostoledo.co</div></div>'
  });
}

async function main() {
  const D1 = readD1();
  const { withChrome, settle } = require(path.join(ROOT, 'design', 'cdp.js'));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'og-landing-'));
  const page = path.join(dir, 'card.html');
  fs.writeFileSync(page, cardHtml(D1));
  try {
    await withChrome(async (send) => {
      await send('Page.enable');
      await send('Runtime.enable');
      await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 2, mobile: false });
      await send('Page.navigate', { url: 'file://' + page });
      await settle(1500);
      /* the real wait: the page's own fonts, then a beat for layout */
      await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => document.fonts.size)', awaitPromise: true, returnByValue: true }, 20000);
      await settle(800);
      const fit = await send('Runtime.evaluate', { expression: 'JSON.stringify({ h: document.documentElement.scrollHeight, w: document.documentElement.scrollWidth, '
        + 'inter: document.fonts.check("550 64px Inter") })', returnByValue: true });
      const F = JSON.parse(fit.result.value);
      if (F.w > 1200 || F.h > 630) throw new Error('the card overflows 1200 × 630 (' + F.w + ' × ' + F.h + ')');
      if (!F.inter) throw new Error('Inter did not load: the card would be set in a fallback face');
      const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      if (!shot || !shot.data) throw new Error('captureScreenshot returned nothing');
      fs.writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
    });
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  cp.execFileSync('/usr/bin/sips', ['-z', '630', '1200', OUT], { stdio: 'ignore' });           /* 2x -> 1200 x 630 */
  const buf = fs.readFileSync(OUT);
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  if (w !== 1200 || h !== 630) throw new Error('the card is ' + w + ' × ' + h + ', not 1200 × 630');
  if (buf.length >= MAX) throw new Error('the card is ' + buf.length + ' bytes, over 300 KB');
  const receipt = { what: 'The landing\'s share card (og:image, twitter:image of /), rendered by tools/build-og-landing.js from the house page shell: '
      + 'the title (D1\'s head) and D1 whole, no number. tools/build-site.js refuses the landing when these words are not the page\'s or the bytes are not these.',
    title: D1.head, description: D1.text, width: w, height: h, bytes: buf.length,
    sha256: crypto.createHash('sha256').update(buf).digest('hex') };
  fs.writeFileSync(REC, JSON.stringify(receipt, null, 2) + '\n');
  console.log('wrote ' + path.relative(ROOT, OUT) + ' (' + w + ' × ' + h + ', ' + Math.round(buf.length / 1024) + ' KB) and its receipt');
}

module.exports = { readD1 };
if (require.main === module) main().catch((e) => { console.error('OG-LANDING REFUSED: ' + e.message); process.exit(1); });
