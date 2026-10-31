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

   Idempotent: a section that already ends with its reasons block is not given a second one.

   ONE BLOCK FOR THE PAGE (2026-10-31, the operator, for /verify/): a page may say every reason once, at its end,
   instead of after each section: its builder calls pageReasons(body) and places the block it returns; the block
   carries data-all, and deriveReasons leaves a page that holds one alone. The rows are the same rows, by the same test.
                                                                                                         MIT */
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

/* the hidden reasons of the values in a piece of markup (scripts skipped: a template there is not a value), as rows */
function hiddenRows(markup, seen) {
  const rows = [], keys = new Set();
  const src = String(markup).replace(/<script[\s\S]*?<\/script>/g, '');
  for (const m of src.matchAll(/<span\b[^>]*\bclass="([^"]*\bw-val\b[^"]*)"[^>]*\btitle="([^"]+)"/g)) {
    const st = STAND.find((x) => new RegExp('\\bw-' + x + '\\b').test(m[1]));
    const why = reasonOf(m[2]);
    if (!st || !why) continue;
    const tail = why.split(/ — |: /).pop().trim().slice(0, 40);
    if (tail && seen.includes(tail)) continue;
    const key = st + '|' + why;
    if (keys.has(key)) continue;
    keys.add(key);
    rows.push('<li><span class="w-' + st + '">' + st + '</span> — ' + esc(why) + '</li>');
  }
  return rows;
}
const block = (rows) => '<div class="w-why"><div class="k">why these numbers stand as they do</div><ul>' + rows.join('') + '</ul></div>';

/* every hidden reason in a page's markup, as one block for its end (data-all), or '' when there is none */
function pageReasons(markup) {
  const rows = hiddenRows(markup, visibleText(markup));
  return rows.length ? block(rows).replace('<div class="w-why">', '<div class="w-why" data-all>') : '';
}

function deriveReasons(html) {
  const page = String(html);
  if (!/class="[^"]*\bw-val\b[^"]*"[^>]*\btitle="/.test(page)) return page;
  if (/<div class="w-why" data-all>/.test(page)) return page;
  const seen = visibleText(page);
  const out = page.replace(/<section\b[^>]*>[\s\S]*?<\/section>/g, (sec) => {
    if (/<div class="w-why"/.test(sec)) return sec;
    const rows = [], keys = new Set();
    for (const m of sec.replace(/<script[\s\S]*?<\/script>/g, '').matchAll(/<span\b[^>]*\bclass="([^"]*\bw-val\b[^"]*)"[^>]*\btitle="([^"]+)"/g)) {
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
    /* inside the section's own wrapper when it has one (the instruments' <div class="wrap">), so the block keeps the
       column's left edge */
    if (/^<section\b[^>]*>\s*<div class="(?:wrap|col|container)\b[^"]*"[^>]*>/.test(sec) && /<\/div>\s*<\/section>$/.test(sec))
      return sec.replace(/<\/div>(\s*)<\/section>$/, block(rows) + '</div>$1</section>');
    return sec.replace(/<\/section>$/, block(rows) + '</section>');
  });
  /* the values outside every section (a header's stat tiles, a landing's numbers): their reasons once, at the end of the
     page's main column, before the footer */
  const outside = out.replace(/<section\b[^>]*>[\s\S]*?<\/section>/g, '');
  if (/<div class="w-why" data-page>/.test(out)) return out;
  const rest = hiddenRows(outside, visibleText(out));
  if (!rest.length) return out;
  const pb = block(rest).replace('<div class="w-why">', '<div class="w-why" data-page>');
  /* in the page's last section, inside its wrapper, so the block keeps the column; with no section, before </main> */
  const last = out.lastIndexOf('</section>');
  if (last >= 0) {
    const open = out.lastIndexOf('<section', last), sec = out.slice(open, last + 10);
    const wrapped = /^<section\b[^>]*>\s*<div class="(?:wrap|col|container)\b[^"]*"[^>]*>/.test(sec) && /<\/div>\s*<\/section>$/.test(sec);
    return out.slice(0, open) + (wrapped ? sec.replace(/<\/div>(\s*)<\/section>$/, pb + '</div>$1</section>') : sec.replace(/<\/section>$/, pb + '</section>')) + out.slice(last + 10);
  }
  const at = out.lastIndexOf('</main>') >= 0 ? out.lastIndexOf('</main>') : out.search(/<footer\b/);
  if (at < 0) return out;
  return out.slice(0, at) + pb + out.slice(at);
}

module.exports = { deriveReasons, pageReasons, reasonOf, visibleText };
