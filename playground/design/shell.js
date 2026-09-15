/* shell.js — /instruments' entry to THE one shell, design/template.js.
   playground/design · cert-machine

   Until 2026-09-15 this file WAS a shell: its own <head> (no canonical, no
   favicon, no card image, no analytics), its own footer, a linked stylesheet
   the reports did not have, and a vendored font subset that drew Greek in
   Times. Now it is thirty lines that map what a builder passes to what the
   one shell takes. The base layer (the nav rules, shell.css, the shared
   components) is still this section's own and still emitted here, as the
   page's own sheet, until the two stylesheets become one.

   A builder passes: title, desc, path (the served path, for the canonical
   URL — REQUIRED), body, css (its own rules, no <style> tags), script (its
   own <script> tags, emitted after the footer), foot (its own footer
   paragraphs, nothing for the section's default line, or null for a viewport
   page that carries its own closing line and cannot show a document footer). */
'use strict';

const fs = require('fs');
const path = require('path');

const TPL = require(path.join(__dirname, '..', '..', 'design', 'template.js'));
const NAV = require(path.join(__dirname, '..', '..', 'design', 'nav.js'));
const BASE = NAV.navCss('var(--gutter)')
  + fs.readFileSync(path.join(__dirname, 'shell.css'), 'utf8')
  + '\n' + require(path.join(__dirname, 'components.js')).sharedCss();

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const DEFAULT_FOOT = '<p>nothing here is gated · every number came out of the record beside the page</p>';

function page({ title, desc = '', path: served, body, css = '', script = '', bodyClass = '', foot }) {
  if (!served || !/^\/instruments\//.test(served)) throw new Error('page(): pass the served path (/instruments/<id>/) — ' + title);
  if (/<style[\s>]/i.test(css)) throw new Error('page(): `css` takes rules, not a <style> element — ' + title);
  return TPL.render({ title, desc, path: served, bodyRaw: body, footRaw: foot === undefined ? DEFAULT_FOOT : foot,
    cssRaw: BASE + '\n' + css, scriptRaw: script, sheet: 'own', bodyClass });
}

module.exports = { page, esc };
