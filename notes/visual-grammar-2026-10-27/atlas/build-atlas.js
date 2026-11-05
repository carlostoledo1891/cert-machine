/* The live return-level atlas, byte for byte, plus the WARRANT v2 layer: two hooks, one paragraph, one line per claim. */
const fs = require('fs'), path = require('path');
const R = '/Users/carlostoledo/Projects/cert-machine/', SITE = R + 'site/instruments/return-level-atlas/', OUT = path.join(__dirname, 'atlas-v2');
let s = fs.readFileSync(SITE + 'index.html', 'utf8');
const patch = (a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`anchor found ${n} times: ${a.slice(0, 60)}`); s = s.replace(a, b); };
patch('let A = null, cells = [], byId = new Map(), map = null, sel = null, worker = null, hover = null, claimOn = null, lastCert = null, run = null;',
  'let A = null, cells = [], byId = new Map(), map = null, sel = null, worker = null, hover = null, claimOn = null, lastCert = null, run = null;\n  window.__Watlas = { get A() { return A; }, get cells() { return cells; }, get map() { return map; }, get claimOn() { return claimOn; } };');
patch('claimOn = id; MY.on = false;', 'claimOn = id; MY.on = false; setTimeout(() => window.__Wclaim && window.__Wclaim(id), 0);');
s = s.replace(/<script[^>]*_vercel[^>]*><\/script>/, '').replace(/href="\.\.\/\.\.\//g, 'href="https://carlostoledo.co/');
const head = s.slice(s.indexOf('<head>') + 6, s.indexOf('</head>')), body = s.slice(s.indexOf('<body>') + 6, s.lastIndexOf('</body>'));
const headClean = head.replace(/<meta charset[^>]*>/i, '').replace(/<meta name="viewport"[^>]*>/i, '').replace(/<title>[\s\S]*?<\/title>/, '').replace(/<link rel="icon"[^>]*>/, '');
const css = `<style>
.w-claim { margin-top: 8px; font-family: var(--font-mono); font-size: 10.5px; line-height: 1.55; color: var(--ink-3); }
.w-claim b { color: var(--ink); font-weight: 500; }
.w-sum { margin: 14px 0 4px; padding: 12px 14px; border: 1px solid var(--border-strong); border-radius: 8px; font-size: 13px; line-height: 1.55; color: var(--ink-2); }
.w-sum em { color: var(--ink-4); font-family: var(--font-mono); font-size: 11px; display: block; margin-top: 6px; }
.w-k { font-family: var(--font-mono); font-size: 9px; letter-spacing: .14em; text-transform: uppercase; color: var(--ink-4); margin-bottom: 6px; }
.wx { color: #e0574e; font-weight: 600; }
</style>`;
const AC = fs.readFileSync(R + 'instruments/hseva/atlas-claims.js', 'utf8');
const layer = fs.readFileSync(path.join(__dirname, 'warrant-atlas.js'), 'utf8').replace('/*__AC__*/', AC);
const out = `<title>Return-Level Atlas Under Warrant</title>\n${headClean}\n${css}\n${body}\n<script>\n${layer}\n</script>\n`;
fs.mkdirSync(path.join(OUT, 'vendor'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), out);
for (const f of ['atlas.json', 'land.json', 'vendor/maplibre-gl.js']) fs.copyFileSync(SITE + f, path.join(OUT, f));
console.log('bytes', out.length);
