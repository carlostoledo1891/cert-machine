#!/usr/bin/env node
/* build-og-report.js — a report's own share card (og:image, twitter:image), the link preview a recipient sees before
   the page: the house header — an eyebrow, the title as the H1, one deck sentence — rendered from design/template.js's
   page shell in Chrome (design/cdp.js, a real wait for the fonts), at 2x and scaled to 1200 × 630, written to
   design/assets/og-<key>.png with a receipt og-<key>.json (the words it set, the PNG's sha256). No number goes on a
   card: a card is rendered when this tool runs, not at every build, and a number on it could go stale unseen.
   tools/build-site.js serves design/assets/og-<key>.png at /og-<key>.png; the page's builder passes
   og: { image: '/og-<key>.png', alt } to TPL.render (the operator, 2026-11-03: a shared report must not carry the
   landing's card).

   usage: node tools/build-og-report.js <key>        the cards are listed in CARDS below, one per report
          node tools/build-og-report.js --all                                                            MIT */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const MAX = 300 * 1024;

const CARDS = {
  wsp: { eyebrow: 'Carlos Toledo · independent certification · Weight-Space Programming (MIT CSAIL)',
    title: 'Weight-Space Programming, decided from its bytes',
    deck: 'The edit is real and exactly as released. Run under its maker’s own recommended settings, the untouched model already reaches the edited one’s score: the gain is termination, the multiplier mostly a settings effect. Every answer graded exactly, every input pinned.',
    path: '/reports/weight-space-programming.html' },
  eth: { eyebrow: 'Carlos Toledo · independent certification · the Exponential Time Hypothesis',
    title: 'Two claims that ETH is false, decided',
    deck: 'Both labs’ Lean proofs replayed by two kernels and accepted against their own statements. The bridges between the two machine models, written by third parties, replayed and certified. The version seam between the two Leans measured, and said to be read, not decided.',
    path: '/eth/' }
};

function cardHtml(c) {
  const C = require(path.join(ROOT, 'design', 'components.js'));
  const TPL = require(path.join(ROOT, 'design', 'template.js'));
  return TPL.render({
    /* path '/' on purpose: the card is a still, not the page — design/titles.js would otherwise hold its H1 to the registry's */
    title: c.title, path: '/', footRaw: null, desc: c.deck,
    /* a still, not a page: no nav, no theme pill, no entrance motion; the block set lower and larger so it reads at thumbnail size */
    cssRaw: 'h1,.deck,.stats{animation:none}\nnav.topnav,[class*="theme"]{display:none !important}\n.page{padding-top:var(--s-10)}\n.og-host{margin-top:var(--s-7)}\nh1{font-size:clamp(34px,4.2vw,54px);line-height:1.08}\n.deck{font-size:clamp(18px,1.9vw,24px);line-height:1.45}',
    bodyRaw: C.header({ eyebrow: c.eyebrow, title: c.title, deck: c.deck })
      + '\n<div class="col og-host"><div class="eyebrow">carlostoledo.co' + c.path + '</div></div>'
  });
}

async function build(key) {
  const c = CARDS[key];
  if (!c) throw new Error('no card named ' + key + ' (known: ' + Object.keys(CARDS).join(', ') + ')');
  const OUT = path.join(ROOT, 'design', 'assets', 'og-' + key + '.png'), REC = path.join(ROOT, 'design', 'assets', 'og-' + key + '.json');
  const { withChrome, settle } = require(path.join(ROOT, 'design', 'cdp.js'));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'og-' + key + '-'));
  const page = path.join(dir, 'card.html');
  fs.writeFileSync(page, cardHtml(c));
  try {
    await withChrome(async (send) => {
      await send('Page.enable');
      await send('Runtime.enable');
      await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 2, mobile: false });
      await send('Page.navigate', { url: 'file://' + page });
      await settle(1500);
      await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => document.fonts.size)', awaitPromise: true, returnByValue: true }, 20000);
      await settle(800);
      const fit = await send('Runtime.evaluate', { expression: 'JSON.stringify({ h: document.documentElement.scrollHeight, w: document.documentElement.scrollWidth, inter: document.fonts.check("550 64px Inter") })', returnByValue: true });
      const F = JSON.parse(fit.result.value);
      if (F.w > 1200 || F.h > 630) throw new Error('the card overflows 1200 × 630 (' + F.w + ' × ' + F.h + '): shorten the deck');
      if (!F.inter) throw new Error('Inter did not load: the card would be set in a fallback face');
      const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      if (!shot || !shot.data) throw new Error('captureScreenshot returned nothing');
      fs.writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
    });
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  cp.execFileSync('/usr/bin/sips', ['-z', '630', '1200', OUT], { stdio: 'ignore' });
  const buf = fs.readFileSync(OUT);
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  if (w !== 1200 || h !== 630) throw new Error('the card is ' + w + ' × ' + h + ', not 1200 × 630');
  if (buf.length >= MAX) throw new Error('the card is ' + buf.length + ' bytes, over 300 KB');
  const receipt = { what: 'The share card of ' + c.path + ' (og:image, twitter:image), rendered by tools/build-og-report.js from the house page shell: the eyebrow, the title and one deck sentence, no number.',
    key, path: c.path, eyebrow: c.eyebrow, title: c.title, description: c.deck, width: w, height: h, bytes: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex'), rendered: new Date().toISOString().slice(0, 10) };
  fs.writeFileSync(REC, JSON.stringify(receipt, null, 2) + '\n');
  console.log('wrote design/assets/og-' + key + '.png (' + w + ' × ' + h + ', ' + Math.round(buf.length / 1024) + ' KB) and its receipt');
}

/* the alt a page builder passes beside the image: the card's own words, read from its receipt so they cannot disagree */
function alt(key) {
  const R = JSON.parse(fs.readFileSync(path.join(ROOT, 'design', 'assets', 'og-' + key + '.json'), 'utf8'));
  return R.title + ' — ' + R.description;
}

module.exports = { CARDS, alt };
if (require.main === module) {
  const keys = process.argv.includes('--all') ? Object.keys(CARDS) : process.argv.slice(2).filter((a) => !a.startsWith('--'));
  if (!keys.length) { console.error('usage: node tools/build-og-report.js <key> | --all   (keys: ' + Object.keys(CARDS).join(', ') + ')'); process.exit(2); }
  (async () => { for (const k of keys) await build(k); })().catch((e) => { console.error('OG-REPORT REFUSED: ' + e.message); process.exit(1); });
}
