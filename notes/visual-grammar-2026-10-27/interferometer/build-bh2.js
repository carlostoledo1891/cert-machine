/* The live interferometer page, byte for byte, plus the WARRANT layer: four hooks patched into its script, one panel
   group, one note span. Greyscale; red is the only accent. */
const fs = require('fs'), path = require('path');
const R = '/Users/carlostoledo/Projects/cert-machine/';
let s = fs.readFileSync(R + 'site/instruments/interferometer/index.html', 'utf8');
const SW = JSON.parse(fs.readFileSync(R + 'playground/interferometer/out/cp-sweep.json', 'utf8')).rows.map(r => ({ r0: r.r0, ceiling: r.ceiling, witness: r.witness }));
const patch = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`anchor found ${n} times: ${a.slice(0, 60)}`); s = s.replace(a, b); };
/* hooks */
patch('if (st.uv) drawUV();', 'if (window.__W) window.__W(ctx, c, scale, OX, OY, SQ); if (st.uv) drawUV();');
patch("ctx.fillText('u–v coverage', x0, y0 - 4);", "ctx.fillText('u–v coverage', x0, y0 - 4); if (window.__Wuv) window.__Wuv(ctx, c, sc);");
patch('ctx.strokeStyle = ink(a * (band > 1 ? 0.5 : 1));', 'ctx.strokeStyle = ink(a * (band > 1 ? 0.5 : 1)); ctx.setLineDash(window.__Wdash || []);');
patch('else drawScan();', 'else drawScan();\n    ctx.setLineDash([]);');
patch('readout();', 'readout(); if (window.__inst && window.__inst.onDraw) window.__inst.onDraw();');
patch('applyHash();\n  reduce(); resize();', 'applyHash();\n  window.__inst = { st, draw, reduce, resize, ALL, D, M, weightOf, onDraw: null };\n  reduce(); resize();');
/* the panel group, after the one control that matters */
patch('What they disagree on is texture.</p>', 'What they disagree on is texture.<span id="w-note"></span></p>');
const grp = `
  <div class="grp" id="w-grp">
    <span class="eyebrow">the grammar · warrant v2</span>
    <div class="row-btns"><button data-w="on">grammar</button><button data-w="lid">the lid</button><button data-w="witness">the witness</button><button data-w="void">where</button></div>
    <div class="w-h">
      <label for="w-model">gains</label><select id="w-model"><option value="station">per station</option><option value="add">additive 5%</option></select>
      <label for="w-n">ceiling</label><select id="w-n"><option value="2">2σ</option><option value="3" selected>3σ</option><option value="4">4σ</option><option value="5">5σ</option></select>
      <label for="w-o">rows may break</label><select id="w-o"><option value="0" selected>none</option><option value="2">2</option><option value="5">5</option><option value="10">10</option></select>
    </div>
    <div id="w-read" class="w-read"></div>
  </div>
  <hr class="hr-thin">
`;
const i = s.indexOf('<aside class="ov-panel">'), j = s.indexOf('<hr class="hr-thin">', i) + '<hr class="hr-thin">'.length;
s = s.slice(0, j) + grp + s.slice(j);
/* links out to the live site; no analytics */
s = s.replace(/href="\.\.\/\.\.\//g, 'href="https://carlostoledo.co/').replace(/<script[^>]*_vercel[^>]*><\/script>/, '');
/* the artifact supplies the document shell */
const head = s.slice(s.indexOf('<head>') + 6, s.indexOf('</head>')), body = s.slice(s.indexOf('<body>') + 6, s.lastIndexOf('</body>'));
const headClean = head.replace(/<meta charset[^>]*>/i, '').replace(/<meta name="viewport"[^>]*>/i, '').replace(/<title>[\s\S]*?<\/title>/, '').replace(/<link rel="icon"[^>]*>/, '');
const css = `<style>
.w-h { display: grid; grid-template-columns: auto 1fr; gap: 6px 10px; align-items: center; margin: 12px 0; }
.w-h label { font-family: var(--font-mono); font-size: 9px; letter-spacing: .14em; text-transform: uppercase; color: var(--ink-4); }
.w-h select { font: 400 11px var(--font-mono); color: var(--ink); background: transparent; border: 1px solid var(--border-strong); border-radius: 4px; padding: 3px 5px; }
.w-read { font-family: var(--font-mono); font-size: 10px; line-height: 1.6; color: var(--ink-3); display: flex; flex-direction: column; gap: 9px; }
.w-read b { color: var(--ink); font-weight: 500; margin-right: 4px; }
.w-read em { color: var(--ink-4); }
#w-note { display: block; margin-top: 8px; font-size: 0.92em; }
.w-read svg { display: inline-block; vertical-align: middle; }
.wx { color: #e0574e; font-weight: 600; }
</style>`;
const layer = fs.readFileSync(path.join(__dirname, 'warrant-layer.js'), 'utf8').replace('__SWEEP__', JSON.stringify(SW));
const out = `<title>Black Hole as a Set</title>\n${headClean}\n${css}\n${body}\n<script>\n${layer}\n</script>\n`;
fs.writeFileSync(path.join(__dirname, 'black-hole-as-a-set.html'), out);
console.log('bytes', out.length);
