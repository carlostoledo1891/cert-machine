/* platforms.js — every offshore production unit in Brazil, from the agency's own layer, as Janela sites.
   apps/janela/audit · cert-machine

     node apps/janela/audit/platforms.js     writes apps/janela/scenario/platforms.json

   Source: ANP's public GeoMaps layer of production units (corpus/anp/unidades_de_producao.geojson,
   pinned in corpus/anp/PINS.json — a file that does not hash to its pin is REFUSED): installation
   code, acronym, type (FPSO, FSO, semi-submersible, fixed, TLWP...), water depth, the fields it
   serves, capacity, coordinates. One row per unit with water depth > 0.

   Each unit is forecast at its nearest open-sea model node (feed.py). Its MEASURED band and its
   site alpha are BORROWED from the nearest of Janela's open-sea measured sites (sites.json kinds
   field/platform/coast) — but only within BORROW_KM: farther than that, the unit has no measured
   band yet and the app says SEM DADOS for the band criterion, never stretches a band across a
   region it was not measured in.

   MIT licensed. Part of cert-machine.                                    */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..', '..', '..');
const BORROW_KM = 350;

function km(a, b) {
  const p = Math.PI / 180;
  const s = Math.sin((b[0] - a[0]) * p / 2) ** 2 + Math.cos(a[0] * p) * Math.cos(b[0] * p) * Math.sin((b[1] - a[1]) * p / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(s));
}

function main() {
  const pins = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'anp', 'PINS.json'), 'utf8'));
  const buf = fs.readFileSync(path.join(ROOT, 'corpus', 'anp', 'unidades_de_producao.geojson'));
  const sha = crypto.createHash('sha256').update(buf).digest('hex');
  if (sha !== pins.files['unidades_de_producao.geojson'].sha256) throw new Error('REFUSED: the ANP production-unit layer does not hash to its pin');
  const measured = require('../scenario/sites.json').sites.filter((s) => ['field', 'platform', 'coast'].includes(s.kind));
  const rows = [];
  const seen = new Map();
  for (const f of JSON.parse(buf.toString('utf8')).features) {
    const p = f.properties;
    const depth = Number(p.MED_DISTANCIA_LAMINA);
    if (!(depth > 0)) continue;
    const [lon, lat] = f.geometry.coordinates;
    const sig = String(p.SIG_INSTALACAO || '').trim();
    let id = 'uep-' + p.COD_INSTALACAO;
    if (seen.has(id)) id += '-' + seen.get(id);
    seen.set('uep-' + p.COD_INSTALACAO, (seen.get('uep-' + p.COD_INSTALACAO) || 1) + 1);
    let near = null;
    for (const s of measured) {
      const d = km([lat, lon], [s.lat, s.lon]);
      if (!near || d < near.km) near = { site: s.id, km: Math.round(d) };
    }
    rows.push({ id, code: p.COD_INSTALACAO, sig, name: String(p.NOM_INSTALACAO || '').trim(), type: p.DESC_TIPO_UEP,
      waterDepthM: depth, serves: String(p.DESC_ATENDIMENTOS || '').trim(), operator: String(p.NOM_FANTASIA || '').trim(),
      oilBpd: p.QTD_PROCESSAMENTO_PETROLEO, gasKm3d: p.QTD_PROCESSAMENTO_GAS,
      lat: Math.round(lat * 1e5) / 1e5, lon: Math.round(lon * 1e5) / 1e5, kind: 'uep', box: 1,
      bandFrom: near && near.km <= BORROW_KM ? near.site : null, nearestMeasured: near });
  }
  rows.sort((a, b) => a.lat - b.lat);
  const out = {
    what: 'Offshore production units of Brazil (ANP GeoMaps layer, pinned in corpus/anp) as Janela sites: forecast at the nearest open-sea model node; the measured band and the site alpha borrowed from the nearest measured site within ' + BORROW_KM + ' km (bandFrom; null = no measured band yet). Derived by apps/janela/audit/platforms.js.',
    source: { file: 'corpus/anp/unidades_de_producao.geojson', sha256: sha, fetched: pins.fetched, licence: pins.licence },
    borrowKm: BORROW_KM, count: rows.length, units: rows,
  };
  fs.writeFileSync(path.join(ROOT, 'apps', 'janela', 'scenario', 'platforms.json'), JSON.stringify(out, null, 1) + '\n');
  const withBand = rows.filter((r) => r.bandFrom).length;
  console.log('platforms.json: ' + rows.length + ' offshore units, ' + withBand + ' with a measured band within ' + BORROW_KM + ' km');
}

main();
