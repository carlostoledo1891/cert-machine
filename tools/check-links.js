#!/usr/bin/env node
/* check-links.js — the site's URLs cannot 404 from inside it (2026-10-27).

   What happened: Vercel served a folder URL without its slash (/instruments) with 200, so the page's RELATIVE links
   resolved one level up (/navier-stokes/index.html → 404), from every nav button or outside link that dropped the slash.
   vercel.json now sets trailingSlash: true; under it, Vercel adds the slash BEFORE matching a redirect, so a redirect
   written for "/playground" no longer matched and every legacy URL broke until each got its slashed twin.

   This battery refuses, from the bytes on disk:
     1. vercel.json without trailingSlash: true;
     2. a redirect whose extensionless, parameterless source has no slash and no slashed twin;
     3. a redirect "/x/:path*" without its bare "/x/" twin (the empty path does not match the pattern);
     4. any internal href/src in site/**.html (the foreign zones excluded) whose target is not a file, a folder with
        index.html, or a redirect source.
   Red controls (must fail): a config without trailingSlash; a slashless source without its twin; a pattern without its
   bare twin; a page with a relative link to a missing file.

   usage: node tools/check-links.js            the battery (exit 1 on any failure)                              MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const SITE = path.join(ROOT, 'site');
let FOREIGN = [];
try { FOREIGN = (require(path.join(ROOT, 'design', 'zones.js')).FOREIGN || []).map((z) => (z.dir || z).replace(/\/$/, '')); } catch (e) { FOREIGN = ['machinidae']; }

function configProblems(cfg) {
  const out = [];
  if (cfg.trailingSlash !== true) out.push('vercel.json: trailingSlash is not true');
  const reds = (cfg.redirects || []).filter((r) => !r.has);
  const sources = new Set(reds.map((r) => r.source));
  for (const r of reds) {
    const s = r.source;
    if (!s.endsWith('/') && !/\.[A-Za-z0-9]+$/.test(s) && !s.includes(':') && !sources.has(s + '/')) out.push('redirect ' + s + ' has no slashed twin ' + s + '/');
    if (s.endsWith('/:path*') && !sources.has(s.slice(0, -':path*'.length))) out.push('redirect ' + s + ' has no bare twin ' + s.slice(0, -':path*'.length));
  }
  return out;
}

function redirectMatch(cfg, urlPath) {
  for (const r of (cfg.redirects || [])) {
    if (r.has) continue;
    const s = r.source;
    if (s === urlPath || s === urlPath.replace(/\/$/, '')) return true;
    if (s.endsWith('/:path*') && (urlPath + '/').startsWith(s.slice(0, -':path*'.length))) return true;
  }
  return false;
}

function linkProblems(siteDir, cfg) {
  const out = [];
  const walk = (d) => {
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, f.name);
      if (f.isDirectory()) { if (d === siteDir && FOREIGN.includes(f.name)) continue; walk(p); continue; }
      if (!f.name.endsWith('.html')) continue;
      const text = fs.readFileSync(p, 'utf8');
      for (const m of text.matchAll(/(?:href|src)="([^"#?]*)/g)) {
        let u = m[1].replace(/&amp;/g, '&');
        if (!u || /^(mailto:|data:|javascript:|tel:)/.test(u) || u.includes("' + ") || u.includes('${')) continue;
        if (/^https?:\/\//.test(u) || u.startsWith('//')) {
          const x = new URL(u.startsWith('//') ? 'https:' + u : u);
          if (!/^(www\.)?carlostoledo\.co$/.test(x.hostname)) continue;
          u = x.pathname;
        }
        if (u.startsWith('/_vercel/')) continue;
        const abs = u.startsWith('/') ? path.join(siteDir, decodeURIComponent(u)) : path.resolve(path.dirname(p), decodeURIComponent(u));
        const ok = fs.existsSync(abs) && (fs.statSync(abs).isFile() || fs.existsSync(path.join(abs, 'index.html')));
        if (ok) continue;
        const urlPath = '/' + path.relative(siteDir, abs).split(path.sep).join('/');
        if (redirectMatch(cfg, urlPath)) continue;
        out.push(path.relative(siteDir, p) + ' → ' + m[1]);
      }
    }
  };
  walk(siteDir);
  return out;
}

let fails = 0;
const say = (ok, m) => { console.log((ok ? '  ok   ' : '  FAIL ') + m); if (!ok) fails++; };
const red = (fired, m) => { console.log((fired ? '  RED ok    ' : '  RED FAIL  ') + m); if (!fired) fails++; };

const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
const cp = configProblems(cfg);
say(cp.length === 0, 'vercel.json: trailingSlash on, every redirect with its twins' + (cp.length ? ':\n         ' + cp.slice(0, 10).join('\n         ') : ''));
const lp = linkProblems(SITE, cfg);
say(lp.length === 0, 'every internal link of site/ resolves (' + (lp.length ? lp.length + ' broken:\n         ' + lp.slice(0, 15).join('\n         ') : 'none broken') + ')');

/* red controls */
red(configProblems({ redirects: [] }).some((x) => /trailingSlash/.test(x)), 'a config without trailingSlash is refused');
red(configProblems({ trailingSlash: true, redirects: [{ source: '/old', destination: '/new/' }] }).some((x) => /slashed twin/.test(x)), 'a slashless redirect without its twin is refused');
red(configProblems({ trailingSlash: true, redirects: [{ source: '/x/:path*', destination: '/y/:path*' }] }).some((x) => /bare twin/.test(x)), 'a path pattern without its bare twin is refused');
{ const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'links-'));
  fs.mkdirSync(path.join(tmp, 'a')); fs.writeFileSync(path.join(tmp, 'a', 'index.html'), '<a href="missing/index.html">x</a><a href="index.html">y</a>');
  red(linkProblems(tmp, { redirects: [] }).length === 1, 'a relative link to a missing file is caught (and only that one)');
  fs.rmSync(tmp, { recursive: true, force: true }); }

console.log(fails ? 'check-links: ' + fails + ' failed' : 'check-links: PASS');
process.exit(fails ? 1 : 0);
