/* reasons.js — a mark's reason is visible text, never only a tooltip (R22).
   design/ · cert-machine · 2026-10-30

   WHY. A value printed through playground/warrant.js carries its reason in a title ("a wall-clock time on the rented
   machine: measured, not decided"). A title shows on hover, so on a phone it never shows, and on a desk a reader has
   to know to look: 1,206 values on the site had a reason no visible text said. The legend says what each underline
   means in general; it cannot say why THIS number is computed.

   WHAT IT DOES. At render, for each section of a page, every value whose reason appears nowhere in the page's visible
   text is collected, and the section ends with its reasons, once each: the underline the value wears, then the reason
   in words. A reason the page already prints (a legend gloss, a sentence, a stat tile's note) is not repeated. The
   standing's own word comes first, so the line reads as the value would be read aloud: "computed — a wall-clock
   time on the rented machine: measured, not decided".

   Idempotent: a section that already ends with its reasons block is not given a second one.             MIT */
'use strict';

const ENT = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&rsquo;': '’', '&lsquo;': '‘', '&ldquo;': '“', '&rdquo;': '”', '&nbsp;': ' ' };
const unent = (s) => String(s).replace(/&[a-z#0-9]+;/gi, (e) => ENT[e] || ' ');
const visibleText = (html) => unent(String(html).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const STAND = ['decided', 'computed', 'chosen', 'refused'];

/* the reason a value's title gives, without the standing's word in front ("computed — …" or "…: …" keep the rest) */
function reasonOf(title) {
  const t = unent(title).trim();
  const m = /^(decided|computed|chosen|refused)\s+—\s+(.*)$/i.exec(t);
  return m ? m[2] : t;
}

function deriveReasons(html) {
  const page = String(html);
  if (!/class="[^"]*\bw-val\b[^"]*"[^>]*\btitle="/.test(page)) return page;
  const seen = visibleText(page);
  return page.replace(/<section\b[^>]*>[\s\S]*?<\/section>/g, (sec) => {
    if (/<div class="w-why"/.test(sec)) return sec;
    const rows = [], keys = new Set();
    for (const m of sec.matchAll(/<span\b[^>]*\bclass="([^"]*\bw-val\b[^"]*)"[^>]*\btitle="([^"]+)"/g)) {
      const st = STAND.find((s) => new RegExp('\\bw-' + s + '\\b').test(m[1]));
      const why = reasonOf(m[2]);
      if (!st || !why) continue;
      /* the census's own test (tools/build-grammar.js tooltipOnly): the reason's tail, to 40 characters, is on the page */
      const tail = why.split(/ — |: /).pop().trim().slice(0, 40);
      if (tail && seen.includes(tail)) continue;
      const key = st + '|' + why;
      if (keys.has(key)) continue;
      keys.add(key);
      rows.push('<li><span class="w-' + st + '">' + st + '</span> — ' + esc(why) + '</li>');   /* no w-val: the word is a key, not a value */
    }
    if (!rows.length) return sec;
    return sec.replace(/<\/section>$/, '<div class="w-why"><div class="k">why these numbers stand as they do</div><ul>' + rows.join('') + '</ul></div></section>');
  });
}

module.exports = { deriveReasons, reasonOf, visibleText };
