# tools/grammar-scenes — the scenes of /grammar/, by topic

Each file here exports `{ topic, scenes }`: a topic (`{ id, title, lead }`) and an array of scene functions. A scene
function takes `guard(plain, ok, msg)` and returns:

```js
{
  id: 'janela-windows',              // unique, kebab-case
  title: 'An operational window',    // short, a noun phrase
  form: 'a timeline over a forecast',// the visual form this teaches (maps, routes, fields, …)
  kind: 'record' | 'built' | 'illustration',
  record: 'path/to/record.json',     // kind 'record': the file(s) every number is read from (string or array)
  source: 'built: what it is computed from',   // kind 'built'
  stop: 'the plain sentence of the check that would refuse this figure',
  hides: 'one or two sentences: what the usual view hides, and what WARRANT shows',
  caption: 'what the figure is, in words (HTML allowed)',
  usual: '<svg …>',                  // optional: the same data as a default plotting call draws it (unclassed, one ink)
  warrant: '<svg …>',                // the same data in WARRANT
  link: 'instruments/janela/'        // optional: the live page it comes from, relative to site/
}
```

Rules (tools/build-grammar-gallery.js and design/WARRANT.md say why): every number is read from its record at build and
checked with `guard`; standings are drawn with `W.attrs` / `W.extentAttrs` / the void (`PL.hatch`, `PL.voidRect`); colours
are tokens only (`var(--ink)` … `var(--c-s5)`), never a literal; no red × (the page keeps one, on its hero); an
invented number only in an `illustration`; a chosen input named in italic (`atoms.mood`); a picture of a model said once.

Preview one module: `node tools/grammar-scenes/preview.js tools/grammar-scenes/<file>.js <out.html>`.
