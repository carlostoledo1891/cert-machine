/* model.js — the app's static model, ONE definition: the places, the operation
   presets, the published terminal rules, the alphas the DNV criteria use. The
   app shell (build-app.js) embeds it; the daily data (data.js) decides with it;
   the battery checks it. A preset or an alpha table defined twice WILL diverge.

   apps/janela/app · cert-machine                                         MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..', '..', '..');
const Q = require('../../../instruments/window/q.js');

const J = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const sha = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');

/* THE PRESETS. Alívio is a CITED criterion (a 2010 paper quoting a 2010 rule, worded as such);
   the other three are EXAMPLES and say so. Limits are decimal strings, as printed. */
const PRESETS = [
  { id: 'alivio', name: 'Alívio', long: 'Alívio (offloading) em FPSO/FSO', TR: 24, kind: 'cited',
    limits: [{ var: 'hs', op: '<=', value: '3.5', unit: 'm' }, { var: 'wind_sustained', op: '<=', value: '50', unit: 'kn' }],
    source: 'critério de alívio citado em 2010 (Tannuri, Pesce, Simos et al., OMAE2010-20147: Hs acima de 3,5 m e vento acima de 50 nós estão "acima dos limites de alívio definidos pela regulação da Petrobras") — confirme com o procedimento vigente',
    sourceUrl: 'https://repositorio.usp.br/item/002250013',
    notDecided: ['tração no cabo (hawser) abaixo de 100 tf', 'separação de pelo menos 50 m entre o aliviador e a unidade', 'o aliviador dentro do setor verde, +45°/−60° do aproamento da unidade'],
    /* offloading needs storage: the units ANP types as FPSO, FSO or NAVIO TANQUE, and the measured open-sea areas;
       never a fixed platform, a semi-submersible, a drillship, a buoy or a terminal (whose Capitania rules decide there) */
    appliesTo: { types: ['FPSO', 'FSO', 'NAVIO TANQUE'], kinds: ['field', 'platform'], why: 'o alívio é de unidade com armazenagem (FPSO, FSO, navio-tanque)' } },
  { id: 'carga', name: 'Carga (PSV)', long: 'Transferência de carga com PSV', TR: 12, kind: 'example',
    limits: [{ var: 'hs', op: '<=', value: '2.5', unit: 'm' }, { var: 'wind_sustained', op: '<=', value: '30', unit: 'kn' }] },
  { id: 'lancamento', name: 'Lançamento de linhas', long: 'Lançamento de linhas e risers', TR: 48, kind: 'example',
    limits: [{ var: 'hs', op: '<=', value: '2.0', unit: 'm' }] },
  { id: 'icamento', name: 'Içamento', long: 'Içamento pesado / descomissionamento', TR: 72, kind: 'example',
    limits: [{ var: 'hs', op: '<=', value: '1.5', unit: 'm' }] }
];
const CRITS = ['band', 'table', 'site'];

/* the site alpha as a table in the standard's shape: columns = design Hs, rows = TPOP,
   each cell the LOWER end of the 90% interval rounded DOWN to 0.01 (as the workability
   record uses it), null where the record could not estimate it */
function siteAlphaTables(A) {
  const out = {};
  for (const [sid, s] of Object.entries(A.sites)) {
    const cols = [...new Set(s.cells.map((c) => c.designHs))].sort((a, b) => a - b);
    const rows = {};
    for (const c of s.cells) {
      rows[c.TPOP] = rows[c.TPOP] || cols.map(() => null);
      rows[c.TPOP][cols.indexOf(c.designHs)] = c.verdict === 'ESTIMATED' ? Q.dec(Q.parse(String(c.ci90[0])), 2, 'down') : null;
    }
    out[sid] = { columns: cols, rows };
  }
  return out;
}

function load() {
  const SITES = J('apps/janela/scenario/sites.json').sites;
  const UNITS = J('apps/janela/scenario/platforms.json').units;
  const OPS = J('apps/janela/scenario/operations.json').operations;
  const NPCP = J('apps/janela/scenario/rules/npcp.json');
  const DNVJ = J('apps/janela/scenario/rules/dnv-alpha.json');
  const A = require('../audit/bandset.js').alpha();       /* the 2026-10-06 record + every measured region */
  const alphaT = siteAlphaTables(A);

  /* a region's caveat (regions.json caveatPt) travels with every band its site lends */
  const BS = require('../audit/bandset.js');
  const caveatOf = (sid) => { const r = sid && BS.regionOf(sid); return r && r.caveatPt ? r.caveatPt : null; };
  /* the places: the measured sites (their own band), then every production unit (a borrowed band, or none) */
  const places = [];
  for (const s of SITES) {
    /* P-25's measured site and ANP's unit P-25 are one platform: the unit is drawn, the site lends it the band */
    places.push({ id: s.id, name: s.name, kind: s.kind, lat: s.lat, lon: s.lon, own: true, bandFrom: null, hidden: s.kind === 'platform' || undefined,
      alphaFrom: s.kind === 'terminal' ? null : (alphaT[s.id] ? s.id : null), added: s.added || null, caveat: caveatOf(s.id) });
  }
  /* a unit with no measured band may still sit by a site that is TRACKED (forecast and ledgered daily) but not yet
     measured: the nearest such open-sea site within the borrowing distance, named so the card can say so */
  const km = (a, b) => { const r = Math.PI / 180, x = Math.sin((b[0] - a[0]) * r / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin((b[1] - a[1]) * r / 2) ** 2; return 12742 * Math.asin(Math.sqrt(x)); };
  const BORROW_KM = J('apps/janela/scenario/platforms.json').borrowKm;
  const tracked = SITES.filter((s) => ['field', 'platform', 'coast'].includes(s.kind) && !alphaT[s.id]);
  for (const u of UNITS) {
    /* ANP's layer spells one unit's type "SEMI SUBVERSÍVEL": shown as the word it means; corpus/anp keeps the layer as published */
    places.push({ id: u.id, name: u.sig || u.name, full: u.name, kind: 'uep', type: u.type === 'SEMI SUBVERSÍVEL' ? 'SEMI SUBMERSÍVEL' : u.type, depth: u.waterDepthM, serves: u.serves,
      operator: u.operator, oilBpd: u.oilBpd, gasKm3d: u.gasKm3d, lat: u.lat, lon: u.lon, own: false, bandFrom: u.bandFrom,
      near: u.nearestMeasured, alphaFrom: u.bandFrom && alphaT[u.bandFrom] ? u.bandFrom : null, caveat: caveatOf(u.bandFrom),
      tracked: u.bandFrom ? null : tracked.map((s) => ({ site: s.id, km: Math.round(km([u.lat, u.lon], [s.lat, s.lon])), added: s.added || null }))
        .filter((t) => t.km <= BORROW_KM).sort((a, b) => a.km - b.km)[0] || null });
  }
  /* the terminal rules, with the act that prints them */
  const npcp = OPS.map((o) => {
    const r = NPCP.rules.find((x) => x.id === o.rule);
    const src = NPCP.sources[r.source] || {};
    return { id: o.id, site: o.site, name: o.name, limits: o.limits, hsAt: o.hsAt, status: o.status || 'in force', npcp: true, TR: 0,
      quote: r.quote, page: r.page, ruleStatus: r.status || null,
      source: { title: src.title, act: src.act, url: src.url, sha256: src.sha256, fetched: src.fetched } };
  });
  /* why the site-alpha criterion has nothing to say at a place */
  const siteWhy = (p) => p.kind === 'terminal' ? 'num terminal o α do local não se aplica: a baía não tem α medido, e o nó do modelo é a aproximação'
    : p.alphaFrom ? null : p.kind === 'uep' && !p.bandFrom ? 'região ainda sem medição: nenhum local medido a menos de 350 km' : 'sem α do local estimado aqui';
  for (const p of places) p.siteWhy = siteWhy(p);
  const records = require('../audit/bandset.js').files().concat(['certs/janela-workability.json', 'apps/janela/scenario/sites.json', 'apps/janela/scenario/regions.json',
    'apps/janela/scenario/platforms.json', 'apps/janela/scenario/operations.json', 'apps/janela/scenario/rules/npcp.json', 'apps/janela/scenario/rules/dnv-alpha.json']);
  return { places, npcp, presets: PRESETS, crits: CRITS, alphaT, siteWhy, wind46: DNVJ.windTable['4-6'], t41: DNVJ.waveTables['4-1'], columns: DNVJ.waveColumns,
    dnvSource: DNVJ.source, records: Object.fromEntries(records.map((r) => [r, sha(r)])) };
}

/* the deciding modules the tab runs, by name, as text (the require shim resolves by file name) */
const MODULES = ['instruments/window/q.js', 'instruments/window/decide.js', 'apps/janela/audit/dnv.js', 'apps/janela/scenario/rules/dnv-alpha.json', 'apps/janela/audit/criteria.js'];
function modules() {
  const src = {}, pins = {};
  for (const rel of MODULES) {
    const t = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    src[path.basename(rel)] = t;
    pins[path.basename(rel)] = { rel, sha: crypto.createHash('sha256').update(t).digest('hex') };
  }
  return { src, pins };
}

/* the context a place decides the DNV criteria in (Node side; the tab builds the same from the shell's data) */
function ctxFor(M, p, DNV) {
  return { dnv: DNV, wind46: M.wind46, site: p.alphaFrom ? M.alphaT[p.alphaFrom] : null, why: p.siteWhy };
}

/* the model's fingerprint: the shell embeds it, the day's data records it; a tab holding data made with
   another model says so instead of comparing what was never the same question */
function fingerprint(M) {
  return crypto.createHash('sha256').update(JSON.stringify({ places: M.places, presets: M.presets, npcp: M.npcp, crits: M.crits,
    alphaT: M.alphaT, wind46: M.wind46 })).digest('hex');
}

module.exports = { load, modules, ctxFor, fingerprint, PRESETS, CRITS, MODULES, siteAlphaTables };
