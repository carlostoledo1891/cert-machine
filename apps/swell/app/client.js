/* client.js — Swell: the sea of Florianópolis, beach by beach. The page.
   apps/swell/app · cert-machine

   THREE ALTITUDES (frontier's Swell, kept): the answer for the chosen activity (one sentence, the day, the beaches in
   order); what it rests on (a beach: the number that matters, its measured band, what is DECIDED and what is only
   FORECAST, safety, the week; the map: waves, wind, currents, the places that help); how we know (a sheet).
   One clock: the step drives everything.

   WHAT CHANGED FROM FRONTIER, AND WHY:
     · the forecast is no longer fetched from a non-commercial API in the tab: the day is built once a day in the cloud
       from ECMWF and NOAA (apps/swell/build-day.js) and published on the swell-field branch; this page reads it;
     · every number is computed HERE by apps/swell/model/surf.js — the same bytes the day's build ran (sha256 pinned in
       the day) — and the tab re-derives the day's digest over every height and decided letter: "conferido";
     · the open sea's band is MEASURED (satellites, Janela's calibrated bands at this site, ECMWF ∪ NOAA), and the wave
       limits are DECIDED over it (PERIGO / ATENÇÃO / abaixo do limite), never "seguro";
     · decided and forecast never share a colour or a typography (style.js); a beach the model cannot reach is REFUSED.

   WHAT IS STORED: the chosen activity, language and saved beaches stay in this browser's localStorage; the URL carries
   the activity and the beach. Nothing goes anywhere.                                                          MIT */
(function () {
'use strict';
var CFG = window.SWELL;
var $ = function (s) { return document.querySelector(s); };
var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

/* ================================================================ the deciding modules, by name, as text */
var MODS = CFG.modules, cache = {};
function req(name) {
  var base = String(name).split('/').pop();
  if (cache[base]) return cache[base].exports;
  if (!Object.prototype.hasOwnProperty.call(MODS.src, base)) throw new Error('swell: no module ' + name);
  var m = { exports: {} }; cache[base] = m;
  (new Function('module', 'exports', 'require', MODS.src[base]))(m, m.exports, req);
  return m.exports;
}
var S = req('surf.js');
var KN = S.C.KN_PER_MS;
var clamp = function (x, a, b) { return Math.min(b, Math.max(a, x)); };
var smooth = function (a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/* ================================================================ colours: read from the tokens, never written here */
var COL = {};
function colors() {
  var cs = getComputedStyle(document.documentElement), g = function (k) { return cs.getPropertyValue(k).trim(); };
  COL = { ink: g('--ink'), ink2: g('--ink-2'), ink3: g('--ink-3'), ink4: g('--ink-4'), ink5: g('--ink-5'), paper: g('--paper'), rule: g('--rule'),
    ruleS: g('--rule-strong'), c2: g('--c-2'), band: g('--band-fill'), refu: g('--v-refu'), refd: g('--v-refd'), mark: g('--mark') };
}
function rgba(hex, a) { var h = hex.replace('#', ''); if (h.length !== 6) return hex; return 'rgba(' + [0, 2, 4].map(function (k) { return parseInt(h.slice(k, k + 2), 16); }).join(',') + ',' + a + ')'; }

/* ================================================================ words: Portuguese first, English matched to it */
var STR = {
  pt: {
    tagline: 'O mar de Florianópolis, praia por praia', how: 'Como sabemos', board: 'Placar', sos: 'Emergência', close: 'Fechar',
    today: 'hoje', tomorrow: 'amanhã', now: 'agora', wd: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'], hourFmt: '{h}h',
    whenToday: 'hoje', whenTomorrow: 'amanhã', whenDay: '{wd} ({d})',
    loading: 'Buscando o dia do Swell…', fcFail: 'Não deu para buscar o dia agora. Tente de novo em alguns minutos.',
    stale: 'Previsão de {run} — a rodada de hoje ainda não foi publicada.',
    act_surf: 'Surfe', act_kite: 'Kite', act_sup: 'SUP', act_swim: 'Banho', act_fish: 'Pesca', act_boat: 'Barco',
    actLong_surf: 'surfe', actLong_kite: 'kite, windsurfe e wing', actLong_sup: 'SUP, caiaque e canoa', actLong_swim: 'banho de mar', actLong_fish: 'pesca de praia e costão', actLong_boat: 'sair de barco',
    win1: 'às {a}', win2: 'das {a} às {b}', allDay: 'o dia todo',
    ans_surf: '{When}, o melhor mar é em {beach}, {win}: {h} com ondulação de {dir} e {wind}.',
    ans_kite: '{When}, o melhor vento é em {beach}, {win}: {kn} nós de {dir}, {cls}.',
    ans_sup: '{When}, a água mais calma é em {beach}, {win}: ondas de {h} e vento de {kmh} km/h.',
    ans_swim: '{When}, o mar mais tranquilo para banho é em {beach}, {win}: ondas de {h}{guard}.',
    ans_fish: '{When}, a melhor condição de pesca é em {beach}, {win}: mar de {h} na beira e vento de {kmh} km/h.',
    ans_boat: '{When}, a melhor saída de barco é por {beach}, {win}: mar de {h} ao largo e vento de {kn} nós.',
    none_surf: '{When} está fraco na ilha toda: no máximo {h} em {beach}.',
    none_kite: '{When} não tem vento bom para velejar: no máximo {kn} nós em {beach}.',
    none_sup: '{When} a água está mexida em toda parte; o lugar mais calmo é {beach}.',
    none_swim: '{When}, cuidado: o mar está agitado na ilha toda. O mais calmo é {beach}.',
    none_fish: '{When} as condições estão difíceis; o melhor lugar é {beach}.',
    none_boat: '{When} não é dia de sair de barco: mar de {h} ao largo e vento de {kn} nós.',
    danger_n: ' {n} {praias} com perigo decidido nesse horário.', praia1: 'praia', praiaN: 'praias',
    guardAt: ', com guarda-vidas a {d} m', night: 'Hoje já escureceu. Toque em amanhã para ver o próximo dia.',
    v_good: 'bom', v_poor: 'fraco', v_none: '—', v_refused: 'fora do modelo',
    vf_surf: 'dá pra surfar', vf_kite: 'dá pra velejar', vf_sup: 'dá pra remar', vf_swim: 'com atenção', vf_fish: 'razoável', vf_boat: 'com cautela',
    vflat_surf: 'sem onda', vflat_kite: 'sem vento',
    dec_V: 'decidido', dec_I: 'atenção', dec_L: 'abaixo do limite', dec_S: 'sem dados', dec_R: 'recusado',
    wc_offshore: 'terral', 'wc_side-offshore': 'terral cruzado', 'wc_cross-shore': 'lateral', 'wc_side-onshore': 'maral cruzado', wc_onshore: 'maral',
    calm: 'quase sem vento', s_light: 'fraco', s_mod: 'moderado', s_strong: 'forte',
    dirs: ['norte', 'nor-nordeste', 'nordeste', 'leste-nordeste', 'leste', 'leste-sudeste', 'sudeste', 'sul-sudeste', 'sul', 'sul-sudoeste', 'sudoeste', 'oeste-sudoeste', 'oeste', 'oeste-noroeste', 'noroeste', 'nor-noroeste'],
    dirsShort: ['N', 'NNE', 'NE', 'ENE', 'L', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'],
    from: 'de', rankHead: 'As praias, da melhor para a pior', knots: 'nós', gusts: 'rajadas', current: 'corrente', calmWater: 'sem correnteza',
    breakH: 'Ondas na beira', swellOff: 'Mar aberto', windH: 'Vento', currentH: 'Corrente', tide: 'Maré', water: 'Água', air: 'Ar', rain: 'Chuva',
    safety: 'Segurança', nearestGuard: 'Guarda-vidas mais próximo', noGuard: 'nenhum posto marcado no mapa a menos de 2 km.',
    ripWarn: 'Ondas de mais de 0,9 m chegando de frente: correntes de retorno são prováveis (regra prática, não decidida). Nade perto de um posto e fora das faixas de água escura e calma entre as ondas.',
    offWarn: 'Vento terral (previsão): empurra para o mar. Perigoso para kite, SUP e boias.',
    longshore: '{v} m/s para o {dir}', week: 'Próximos 7 dias', onMap: 'Ver no mapa', back: 'Todas as praias',
    yourBeaches: 'Suas praias', noWindow: 'nada bom nos próximos 7 dias', save: 'Salvar', saved: 'Salva', share: 'Compartilhar', copied: 'Copiado: cole no WhatsApp.',
    cbmsc: 'Na temporada (novembro a março) o CBMSC mantém cerca de 70 postos de guarda-vidas na ilha. Os postos abertos e a bandeira do dia estão no app oficial CBMSC Cidadão.',
    whyGet: 'Recebe {p}% da ondulação de {dir}', whyAnd: 'e {p}% da de {dir}', whyGrow: 'Recebe toda a ondulação de {dir}, que ainda cresce no raso', whyAndGrow: 'e toda a de {dir}',
    whySheltered: 'Abrigada desta ondulação: chega só {p}%.', whyChop: 'Na baía, o que conta é o vento: {h} de marola com {kmh} km/h (previsão do vento, não medida).',
    lagoonWhy: 'Água plana da lagoa; o que conta é o vento. Nada aqui é decidido: a marola vem só da previsão do vento.',
    tab_beaches: 'Praias', tab_week: 'Semana', tab_map: 'Mapa', conditions: 'Condições',
    bandLine: 'faixa medida <b>{lo}–{hi}</b> · o mar aberto com o erro medido por satélite, levado até a praia pelo modelo da ilha',
    bandNone: 'sem faixa medida neste passo: nada é decidido aqui',
    capped: 'no limite do modelo: o mar quebra antes da sonda mais funda ({h} m) — pode ser maior',
    extT: 'período de {T} s fora da biblioteca de casos (6–15 s): lido como {T0} s',
    flatSea: 'sem as partições do mar (NOAA) neste passo: o mar entra como uma ondulação só (ECMWF)',
    decidedH: 'O que é decidido', forecastH: 'O que é previsão',
    decV: '<b>{word}</b>: mesmo a borda baixa da faixa ({lo}) passa de {lim} — decidido.',
    decI: '<b>atenção</b>: a faixa ({lo}–{hi}) cruza o limite de {lim}: vira {word} se a borda baixa subir {up}; fica abaixo do limite se a borda alta descer {gap}.',
    decL: 'abaixo do limite de {lim} em toda a faixa ({lo}–{hi}) — decidido. Não quer dizer seguro.',
    decS: 'sem faixa medida: o limite de {lim} não é decidido.',
    refusedEdge: 'Fora do modelo: a borda do modelo da ilha passa a {km} desta praia, e ali a onda que entra pela borda não dobrou no fundo. Swell não calcula a altura aqui.',
    refusedNo: 'Fora do modelo: sem sondas na zona de arrebentação.',
    cert: 'Certificado', certDl: 'Baixar certificado .json', rechk: 'Conferido no seu navegador: {n} linhas, as mesmas alturas e decisões publicadas ({ms} ms).', rechkBad: 'ATENÇÃO: o seu navegador NÃO reproduziu o dia publicado ({why}).',
    tlIsland: 'mar aberto', tlShore: 'na beira', tlScopeIsland: 'mar aberto · abra uma praia para ver a dela', lg_waves: 'ondas: altura na beira (ou no mar aberto)', lg_band: 'faixa medida', lg_wind: 'vento em nós (previsão); a linha fina são as rajadas',
    lg_tide: 'maré (Copernicus, previsão)', lg_good: 'horário bom para a atividade', lg_fair: 'dá para ir', lg_dec: 'perigo decidido',
    layers: 'Camadas', L_waves: 'Ondas', L_wind: 'Vento', L_currents: 'Correntes', L_pois: 'Serviços',
    legend_waves: 'cada linha é uma crista; mais clara e mais grossa, mais alta a onda (m)', legend_wind: 'traços que correm com o vento; mais longos e claros, mais forte (km/h)', legend_currents: 'corrente ao longo da praia; mais longa, mais rápida (m/s); um anel = risco de retorno',
    mapNoteFast: 'As cristas se movem {x}× mais rápido que o real neste zoom, para o movimento ser visível; aproximando, voltam ao período de verdade.', mapNoteReal: 'Neste zoom as cristas se movem no período real.',
    sosTitle: 'Em caso de emergência', sosNote: 'Ligações gratuitas, de qualquer telefone.',
    n193: 'Bombeiros e guarda-vidas', n190: 'Polícia Militar', n192: 'SAMU (ambulância)', n185: 'Marinha — salvamento no mar', n199: 'Defesa Civil',
    poi_lifeguard: 'Posto de guarda-vidas', poi_police: 'Polícia', poi_fire: 'Bombeiros', poi_health: 'Saúde', poi_navy: 'Marinha — Capitania dos Portos', poi_ramp: 'Rampa de barcos', poi_marina: 'Marina',
    route: 'Como chegar', region_norte: 'norte', region_leste: 'leste', region_sul: 'sul', 'region_baía norte': 'baía norte', 'region_baía sul': 'baía sul', region_continente: 'continente',
    kind_ocean: 'mar aberto', kind_bay: 'baía', kind_lagoon: 'lagoa', kind_island: 'ilha',
    runChip: 'rodada {d} 00 UTC', introSub: 'Lendo o mar aberto (ECMWF e NOAA), a faixa medida por satélite e calculando as 34 praias…',
    texBad: 'Uma textura do modelo da ilha não bateu com o sha256 fixado: as ondas do mapa não são desenhadas.',
    fromSpace: 'Do espaço', foamRow: 'espuma em {p}% da zona de arrebentação (mediana de {n} passagens sem nuvens do Sentinel-2, {from}–{to}){rank}', foamRank: ' · a {k}ª de {of} praias de mar aberto que mais quebra', measured: 'medido',
  },
  en: {
    tagline: 'The sea of Florianópolis, beach by beach', how: 'How we know', board: 'Scoreboard', sos: 'Emergency', close: 'Close',
    today: 'today', tomorrow: 'tomorrow', now: 'now', wd: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], hourFmt: '{h}:00',
    whenToday: 'Today', whenTomorrow: 'Tomorrow', whenDay: '{wd} {d}',
    loading: 'Getting Swell\'s day…', fcFail: 'The day could not be fetched right now. Try again in a few minutes.',
    stale: 'Forecast of {run} — today\'s run is not published yet.',
    act_surf: 'Surf', act_kite: 'Kite', act_sup: 'SUP', act_swim: 'Swim', act_fish: 'Fish', act_boat: 'Boat',
    actLong_surf: 'surfing', actLong_kite: 'kite, windsurf and wing', actLong_sup: 'SUP, kayak and canoe', actLong_swim: 'swimming', actLong_fish: 'shore and rock fishing', actLong_boat: 'going out by boat',
    win1: 'at {a}', win2: 'from {a} to {b}', allDay: 'all day',
    ans_surf: '{When}, the best surf is at {beach}, {win}: {h} of {dir} swell, {wind}.',
    ans_kite: '{When}, the best wind is at {beach}, {win}: {kn} knots from the {dir}, {cls}.',
    ans_sup: '{When}, the calmest water is at {beach}, {win}: {h} waves and {kmh} km/h of wind.',
    ans_swim: '{When}, the calmest sea for a swim is at {beach}, {win}: {h} waves{guard}.',
    ans_fish: '{When}, the best fishing is at {beach}, {win}: {h} at the shore and {kmh} km/h of wind.',
    ans_boat: '{When}, the best way out by boat is from {beach}, {win}: {h} offshore and {kn} knots of wind.',
    none_surf: '{When} it is small all round the island: at most {h} at {beach}.',
    none_kite: '{When} there is no good wind to sail: at most {kn} knots at {beach}.',
    none_sup: '{When} the water is choppy everywhere; the calmest is {beach}.',
    none_swim: '{When}, take care: the sea is rough all round the island. The calmest is {beach}.',
    none_fish: '{When} conditions are hard; the best place is {beach}.',
    none_boat: '{When} is not a day to go out by boat: {h} offshore and {kn} knots of wind.',
    danger_n: ' {n} {praias} with decided danger at that hour.', praia1: 'beach', praiaN: 'beaches',
    guardAt: ', with a lifeguard {d} m away', night: 'It is already dark today. Tap tomorrow to see the next day.',
    v_good: 'good', v_poor: 'poor', v_none: '—', v_refused: 'outside the model',
    vf_surf: 'surfable', vf_kite: 'sailable', vf_sup: 'paddleable', vf_swim: 'with care', vf_fish: 'fair', vf_boat: 'with caution',
    vflat_surf: 'flat', vflat_kite: 'no wind',
    dec_V: 'decided', dec_I: 'caution', dec_L: 'under the limit', dec_S: 'needs data', dec_R: 'refused',
    wc_offshore: 'offshore', 'wc_side-offshore': 'side-offshore', 'wc_cross-shore': 'cross-shore', 'wc_side-onshore': 'side-onshore', wc_onshore: 'onshore',
    calm: 'barely any wind', s_light: 'light', s_mod: 'moderate', s_strong: 'strong',
    dirs: ['north', 'north-northeast', 'northeast', 'east-northeast', 'east', 'east-southeast', 'southeast', 'south-southeast', 'south', 'south-southwest', 'southwest', 'west-southwest', 'west', 'west-northwest', 'northwest', 'north-northwest'],
    dirsShort: ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'],
    from: 'from', rankHead: 'The beaches, best first', knots: 'kn', gusts: 'gusts', current: 'current', calmWater: 'no current',
    breakH: 'Waves at the shore', swellOff: 'Open sea', windH: 'Wind', currentH: 'Current', tide: 'Tide', water: 'Water', air: 'Air', rain: 'Rain',
    safety: 'Safety', nearestGuard: 'Nearest lifeguard', noGuard: 'no post marked on the map within 2 km.',
    ripWarn: 'Waves over 0.9 m arriving square to the beach: rip currents are likely (a rule of thumb, not decided). Swim near a post, away from dark, calm gaps between the waves.',
    offWarn: 'Offshore wind (forecast): it pushes you out to sea. Dangerous for kites, boards and floats.',
    longshore: '{v} m/s toward the {dir}', week: 'Next 7 days', onMap: 'Show on the map', back: 'All beaches',
    yourBeaches: 'Your beaches', noWindow: 'nothing good in the next 7 days', save: 'Save', saved: 'Saved', share: 'Share', copied: 'Copied: paste it in WhatsApp.',
    cbmsc: 'In season (November to March) the fire brigade (CBMSC) keeps about 70 lifeguard posts on the island. The open posts and the day\'s flag are in the official CBMSC Cidadão app.',
    whyGet: 'Gets {p}% of the {dir} swell', whyAnd: 'and {p}% of the {dir}', whyGrow: 'Gets all of the {dir} swell, which still grows in the shallows', whyAndGrow: 'and all of the {dir}',
    whySheltered: 'Sheltered from this swell: only {p}% gets in.', whyChop: 'In the bay it is the wind that counts: {h} of chop with {kmh} km/h (a wind forecast, not measured).',
    lagoonWhy: 'Flat lagoon water; the wind is what counts. Nothing here is decided: the chop comes from the wind forecast alone.',
    tab_beaches: 'Beaches', tab_week: 'Week', tab_map: 'Map', conditions: 'Conditions',
    bandLine: 'measured band <b>{lo}–{hi}</b> · the open sea with its satellite-measured error, carried to the beach by the island model',
    bandNone: 'no measured band at this step: nothing is decided here',
    capped: 'at the model\'s limit: the sea breaks before the deepest probe ({h} m) — it may be bigger',
    extT: 'a {T} s period is outside the case library (6–15 s): read as {T0} s',
    flatSea: 'no sea partitions (NOAA) at this step: the sea enters as one swell (ECMWF)',
    decidedH: 'What is decided', forecastH: 'What is forecast',
    decV: '<b>{word}</b>: even the band\'s low edge ({lo}) is over {lim} — decided.',
    decI: '<b>caution</b>: the band ({lo}–{hi}) straddles the {lim} limit: it turns {word} if the low edge rises {up}; it falls under the limit if the high edge drops {gap}.',
    decL: 'under the {lim} limit over the whole band ({lo}–{hi}) — decided. It does not mean safe.',
    decS: 'no measured band: the {lim} limit is not decided.',
    refusedEdge: 'Outside the model: the island model\'s edge passes {km} from this beach, and there the wave entering through the edge has not bent over the seafloor. Swell does not compute the height here.',
    refusedNo: 'Outside the model: no probes in the surf zone.',
    cert: 'Certificate', certDl: 'Download certificate .json', rechk: 'Re-checked in your browser: {n} lines, the same heights and decisions as published ({ms} ms).', rechkBad: 'WARNING: your browser did NOT reproduce the published day ({why}).',
    tlIsland: 'open sea', tlShore: 'at the shore', tlScopeIsland: 'open sea · open a beach to see its own', lg_waves: 'waves: height at the shore (or the open sea)', lg_band: 'measured band', lg_wind: 'wind in knots (forecast); the thin line is the gusts',
    lg_tide: 'tide (Copernicus, forecast)', lg_good: 'a good hour for the activity', lg_fair: 'doable', lg_dec: 'decided danger',
    layers: 'Layers', L_waves: 'Waves', L_wind: 'Wind', L_currents: 'Currents', L_pois: 'Services',
    legend_waves: 'each line is a crest; lighter and heavier, the higher the wave (m)', legend_wind: 'streaks running with the wind; longer and lighter, the stronger (km/h)', legend_currents: 'longshore current; longer, faster (m/s); a ring = rip risk',
    mapNoteFast: 'At this zoom the crests move {x}× faster than real time so the motion can be seen; zoom in and they return to the true period.', mapNoteReal: 'At this zoom the crests move at the real period.',
    sosTitle: 'In an emergency', sosNote: 'Free calls from any phone.',
    n193: 'Fire brigade and lifeguards', n190: 'Military Police', n192: 'SAMU (ambulance)', n185: 'Navy — rescue at sea', n199: 'Civil Defence',
    poi_lifeguard: 'Lifeguard post', poi_police: 'Police', poi_fire: 'Fire brigade', poi_health: 'Health', poi_navy: 'Navy — Harbour Master', poi_ramp: 'Boat ramp', poi_marina: 'Marina',
    route: 'Directions', region_norte: 'north', region_leste: 'east', region_sul: 'south', 'region_baía norte': 'north bay', 'region_baía sul': 'south bay', region_continente: 'mainland',
    kind_ocean: 'open sea', kind_bay: 'bay', kind_lagoon: 'lagoon', kind_island: 'island',
    runChip: 'run {d} 00 UTC', introSub: 'Reading the open sea (ECMWF and NOAA), the satellite-measured band, and computing the 34 beaches…',
    texBad: 'An island-model texture did not match its pinned sha256: the map\'s waves are not drawn.',
    fromSpace: 'From space', foamRow: 'foam over {p}% of the surf zone (median of {n} cloud-free Sentinel-2 passes, {from}–{to}){rank}', foamRank: ' · {k} of {of} open-sea beaches by how much it breaks', measured: 'measured',
  },
};
var LANG = { cur: 'pt' };
(function () {
  var q = (location.search.match(/lang=(pt|en)/) || [])[1], saved = null;
  try { saved = localStorage.getItem('swell.lang'); } catch (e) {}
  LANG.cur = q || saved || 'pt';
})();
function setLang(l) { LANG.cur = l; try { localStorage.setItem('swell.lang', l); } catch (e) {} document.documentElement.lang = l === 'pt' ? 'pt-BR' : 'en'; }
function t(key, vars) {
  var s = (STR[LANG.cur] && STR[LANG.cur][key]); if (s == null) s = STR.pt[key]; if (s == null) s = key;
  if (vars && typeof s === 'string') s = s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
  return s;
}
function num(v, d) { var s = (+v).toFixed(d == null ? 1 : d); return LANG.cur === 'pt' ? s.replace('.', ',') : s; }
function metres(v, d) { return num(v, d == null ? 1 : d) + ' m'; }
function dirIndex(deg) { return Math.round(((deg % 360) + 360) % 360 / 22.5) % 16; }
function dirWord(deg) { return t('dirs')[dirIndex(deg)]; }
function dirShort(deg) { return t('dirsShort')[dirIndex(deg)]; }
function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
function cmTxt(c) { return metres(c / 100, 2); }

/* ================================================================ the icons */
var ICON = {
  lifeguard: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.6"/><path d="M6 6l3.4 3.4M18 6l-3.4 3.4M6 18l3.4-3.4M18 18l-3.4-3.4" stroke-width="2.2"/>',
  police: '<path d="M12 3l7 3v5c0 5-3.2 8.3-7 10-3.8-1.7-7-5-7-10V6z"/>',
  fire: '<path d="M12 3c1 3 4 4.5 4 8.5a4 4 0 1 1-8 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 0-7.5z"/>',
  health: '<path d="M12 5v14M5 12h14" stroke-width="2.4"/><rect x="3.5" y="3.5" width="17" height="17" rx="3"/>',
  navy: '<circle cx="12" cy="5" r="2"/><path d="M12 7v13M7 11h10M5 15a7 7 0 0 0 14 0"/>',
  ramp: '<path d="M3 19h18M4 19l14-9"/><path d="M14 8h5v4"/>',
  marina: '<path d="M4 17c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 4 0"/><path d="M12 3v10M12 4l5 6h-5"/>',
  surf: '<path d="M5 19c4-1 9-6 14-14-6 2-11 7-14 14z"/><path d="M8 16l3 3"/>',
  kite: '<path d="M4 9c4-5 12-5 16 0l-4 1c-2-2-6-2-8 0z"/><path d="M12 10l2 10"/>',
  sup: '<path d="M4 16c5 2 11 2 16 0"/><path d="M12 4v10M9 6l3-2 3 2"/>',
  swim: '<circle cx="15" cy="6" r="2"/><path d="M4 18c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 4 0"/><path d="M6 14l5-4 3 3"/>',
  fish: '<path d="M3 12c4-5 10-5 14 0-4 5-10 5-14 0z"/><path d="M17 12l4-3v6z"/>',
  boat: '<path d="M3 15h18l-3 4H6z"/><path d="M12 3v12M12 4l6 8h-6"/>',
  sos: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16v1" stroke-width="2.4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v1" stroke-width="2.2"/>',
  board: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
};
function svgIcon(name, size) { size = size || 16; return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON[name] || '') + '</svg>'; }

/* ================================================================ state */
var A = { B: CFG.beaches, day: null, all: null, fc: null, beaches: [], pois: CFG.pois.pois, act: 'surf', sel: null, dayRef: null, hour: null,
  layers: { waves: true, wind: true, currents: true, pois: true }, ready: false, map: null, check: null };
var UI = { phone: matchMedia('(max-width: 899px)'), sheet: 'peek', timer: 0, toast: 0, tab: 'beaches' };
var FAV = new Set((function () { try { return JSON.parse(localStorage.getItem('swell.favs') || '[]'); } catch (e) { return []; } })());
function toggleFav(name) { FAV.has(name) ? FAV.delete(name) : FAV.add(name); try { localStorage.setItem('swell.favs', JSON.stringify(Array.from(FAV))); } catch (e) {} }

/* ================================================================ the day */
function loadDay() {
  var local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';
  var urls = local ? CFG.data.today.slice().reverse() : CFG.data.today;
  var get = function (i) {
    return fetch(urls[i], { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(urls[i] + ' ' + r.status); return r.json(); })
      .catch(function (e) { if (i + 1 < urls.length) return get(i + 1); throw e; });
  };
  /* file:// (the layout ruler, a saved copy): fetch cannot read a local file, the same bytes as a script can */
  var script = function () {
    return new Promise(function (res, rej) {
      if (window.SWELL_TODAY) return res(window.SWELL_TODAY);
      var el = document.createElement('script'); el.src = 'data/today.js';
      el.onload = function () { window.SWELL_TODAY ? res(window.SWELL_TODAY) : rej(new Error('data/today.js')); }; el.onerror = rej;
      document.head.appendChild(el);
    });
  };
  return (window.SWELL_EARLY ? window.SWELL_EARLY.today.catch(function () { return get(0); }) : get(0)).catch(script);
}
/* steps -> local time (Brasília, UTC-3, no summer time since 2019), days, daylight, now */
function makeClock(day, all) {
  var N = day.steps.length, time = [], days = [];
  day.steps.forEach(function (s, i) {
    var ms = Date.parse(s.t + ':00:00Z'), loc = new Date(ms - 3 * 3600e3).toISOString().slice(0, 13);
    time.push(loc);
    var d = loc.slice(0, 10), dd = days.filter(function (x) { return x.date === d; })[0];
    if (!dd) days.push(dd = { date: d, idx: [] });
    dd.idx.push(i);
  });
  var nowMs = Date.now(), now = 0;
  day.steps.forEach(function (s, i) { if (Date.parse(s.t + ':00:00Z') <= nowMs) now = i; });
  /* at most seven days, the first one the day "now" falls in */
  var first = days.findIndex(function (d) { return d.idx.indexOf(now) >= 0; });
  days = days.slice(Math.max(0, first), Math.max(0, first) + 7);
  return { N: N, time: time, days: days, daylight: all.daylight, now: now, utc: day.steps.map(function (s) { return s.t; }) };
}
function hourLabelOf(i) { var h = +A.fc.time[i].slice(11, 13); return t('hourFmt', { h: LANG.cur === 'pt' ? String(h) : String(h).padStart(2, '0') }); }
function dayOf(i) { return A.fc.days.filter(function (d) { return d.idx.indexOf(i) >= 0; })[0]; }
function dayName(day) {
  var k = A.fc.days.indexOf(day), d = new Date(day.date + 'T12:00:00');
  if (k === 0 && isToday(day)) return t('today'); if (k === 1 && isToday(A.fc.days[0])) return t('tomorrow');
  return t('wd')[d.getDay()] + ' ' + d.getDate();
}
function isToday(day) { return day.date === new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10); }
function whenWord(day) {
  var k = A.fc.days.indexOf(day), d = new Date(day.date + 'T12:00:00');
  if (k === 0 && isToday(day)) return t('whenToday'); if (k === 1 && isToday(A.fc.days[0])) return t('whenTomorrow');
  return t('whenDay', { wd: t('wd')[d.getDay()], d: d.getDate() });
}

/* ================================================================ the model's results, read */
function scoreAt(b, i, act) {
  act = act || A.act;
  var row = b.rows[i], j = row.acts[act];
  var v = !j ? 'none' : j.refused ? 'refused' : j.flat ? 'flat' : j.q;
  return { c: row.c, j: j, s: j && !j.refused ? j.s : -1, v: v, d: j && !j.refused ? j.worst : null };
}
function verdictWord(v, act) {
  act = act || A.act;
  if (v === 'fair') return t('vf_' + act);
  if (v === 'flat') { var f = t('vflat_' + act); return f !== 'vflat_' + act ? f : t('v_poor'); }
  return t('v_' + v);
}
function decWord(j) { var d = j.dec.filter(function (x) { return x.letter === 'V'; })[0]; return d ? (LANG.cur === 'pt' ? d.word : d.en) : ''; }
function chipHTML(r) {
  var h = '<span class="sw-chip ' + (r.v === 'refused' ? 'none' : r.v) + '">' + esc(verdictWord(r.v)) + '</span>';
  if (r.d === 'V') h += ' <span class="sw-dec V">' + esc(decWord(r.j)) + '</span>';
  else if (r.d === 'I') h += ' <span class="sw-dec I">' + esc(t('dec_I')) + '</span>';
  if (r.j && r.j.warn) r.j.warn.forEach(function (w) { h += ' <span class="sw-fw">' + esc(LANG.cur === 'pt' ? w.word : w.en) + '</span>'; });
  return h;
}
function metricOf(c, act) { act = act || A.act; return act === 'kite' ? c.wind.U * KN : act === 'boat' ? (c.off || 0) : (c.hb == null ? 0 : c.hb); }
function metricBig(c, act) {
  act = act || A.act;
  if (act === 'kite') return num(c.wind.U * KN, 0) + ' ' + t('knots');
  if (act === 'boat') return c.off == null ? '—' : metres(c.off);
  return c.hb == null ? '—' : metres(c.hb);
}
function metricSub(c, act) {
  act = act || A.act;
  if (act === 'kite') return t('gusts') + ' ' + num(c.wind.gust * KN, 0) + ' · ' + dirShort(c.wind.dir);
  if (act === 'boat') return t('swellOff').toLowerCase() + ' · ' + t('windH').toLowerCase() + ' ' + num(c.wind.U * KN, 0) + ' ' + t('knots');
  if (act === 'swim') return c.cur && c.cur.V > 0.15 ? t('current') + ' ' + num(c.cur.V, 1) + ' m/s' : t('calmWater');
  if (act === 'sup' || act === 'fish') return t('windH').toLowerCase() + ' ' + num(c.wind.U * 3.6, 0) + ' km/h';
  var dom = c.cur && c.cur.dom; return dom ? num(dom.p, 0) + ' s ' + dirShort(dom.d) : '';
}
function bandOf(c, act) {
  act = act || A.act;
  if (act === 'kite') return null;
  if (act === 'boat') { var s = c.sea; return s && s.lo != null ? [Math.round(s.lo * 100), Math.round(s.hi * 100)] : null; }
  return c.waves && c.waves.lo != null ? [c.waves.lo, c.waves.hi] : null;
}
function spotsOf(act) { return S.RULES[act].spots; }
function rankDay(day, act) {
  act = act || A.act;
  var from = day === A.fc.days[0] ? A.fc.now : 0;
  var rows = A.beaches.filter(function (b) { return spotsOf(act).indexOf(b.kind) >= 0; }).map(function (b) { return { b: b, best: S.bestOfDay(A.all, b.k, day.idx, act, from) }; });
  rows.sort(function (x, y) { return (y.best ? y.best.s + (y.best.j.dec.length ? 0 : 0) : -1) - (x.best ? x.best.s : -1); });
  return rows;
}
function daylightLeft(day) { return day.idx.some(function (i) { return A.fc.daylight[i] && !(day === A.fc.days[0] && i < A.fc.now); }); }
function nextWindow(b, act) {
  act = act || A.act; var fair = null;
  for (var k = 0; k < A.fc.days.length; k++) {
    var d = A.fc.days[k], w = S.bestOfDay(A.all, b.k, d.idx, act, k === 0 ? A.fc.now : 0); if (!w) continue;
    if (w.s >= 0.6) return Object.assign(w, { day: d });
    if (!fair && w.s >= 0.33) fair = Object.assign(w, { day: d });
  }
  return fair;
}
function winText(w) { return w.from === w.to ? hourLabelOf(w.from) : hourLabelOf(w.from) + '–' + hourLabelOf(Math.min(w.to + 1, A.fc.N - 1)); }
function windWords(U, wc) { if (U < 3 || !wc) return t('calm'); return t('wc_' + wc) + ' ' + t(U < 6 ? 's_light' : U < 10 ? 's_mod' : 's_strong'); }
function actsAt(b, i) {
  var out = [];
  S.ACT_ORDER.forEach(function (a) {
    if (spotsOf(a).indexOf(b.kind) < 0) return;
    var r = scoreAt(b, i, a); if (r.v === 'refused' || r.v === 'none') return;
    var cls = r.d === 'V' ? 'V' : r.d === 'I' ? 'I' : r.v;
    if (cls === 'good' || cls === 'fair' || cls === 'V' || cls === 'I') out.push({ act: a, cls: cls, s: r.s });
  });
  out.sort(function (x, y) { return (y.act === A.act) - (x.act === A.act) || (x.cls === 'V') - (y.cls === 'V') || y.s - x.s; });
  return out;
}
function miniIcons(list, size) { return list.map(function (o) { return '<b class="' + o.cls + '" title="' + esc(t('act_' + o.act)) + '">' + svgIcon(o.act, size || 11) + '</b>'; }).join(''); }

/* ================================================================ the answer */
function answerFor(day, rows) {
  if (day === A.fc.days[0] && isToday(day) && !daylightLeft(day)) return t('night');
  var top = rows.filter(function (r) { return r.best; })[0]; if (!top) return '';
  var h = top.best, c = A.beaches[top.b.k].rows[h.i].c, act = A.act;
  var dl = day.idx.filter(function (i) { return A.fc.daylight[i] && !(day === A.fc.days[0] && i < A.fc.now); });
  var win = h.from === h.to ? t('win1', { a: hourLabelOf(h.from) }) : (h.from <= dl[0] && h.to >= dl[dl.length - 1]) ? t('allDay') : t('win2', { a: hourLabelOf(h.from), b: hourLabelOf(Math.min(h.to + 1, A.fc.N - 1)) });
  var lg = top.b.lifeguard && top.b.lifeguard.d < 900 ? t('guardAt', { d: Math.round(top.b.lifeguard.d / 50) * 50 }) : '';
  var dom = c.cur && c.cur.dom;
  var vars = { When: cap(whenWord(day)), beach: '<b>' + esc(top.b.name) + '</b>', win: '<b>' + win + '</b>', h: act === 'boat' ? metres(c.off || 0) : metres(c.hb || 0),
    dir: dom ? dirWord(dom.d) : dirWord(c.wind.dir), wind: windWords(c.wind.U, c.wc), kn: num(c.wind.U * KN, 0), kmh: num(c.wind.U * 3.6, 0), cls: c.wc ? t('wc_' + c.wc) : t('calm'), guard: lg };
  if (act === 'kite') vars.dir = dirWord(c.wind.dir);
  var s = t((h.s >= 0.33 ? 'ans_' : 'none_') + act, vars);
  var nV = A.beaches.filter(function (b) { var r = scoreAt(b, h.i); return r.d === 'V'; }).length;
  if (nV) s += '<span class="dec">' + esc(t('danger_n', { n: nV, praias: nV === 1 ? t('praia1') : t('praiaN') })) + '</span>';
  return s;
}

/* ================================================================ render */
function renderAll() {
  if (!A.ready) return;
  renderFilter(); renderDays(); renderHourRow();
  var rows = rankDay(A.dayRef); A.rows = rows;
  $('#sw-answer').innerHTML = answerFor(A.dayRef, rows);
  if (A.sel) renderCard(); else renderList(rows);
  paintLabels(); drawCurrents(); renderTabLabels();
}
function renderFilter() {
  var box = $('.sw-filter');
  box.innerHTML = S.ACT_ORDER.map(function (a) { return '<button class="sw-fl' + (a === A.act ? ' on' : '') + '" data-act="' + a + '" role="radio" aria-checked="' + (a === A.act) + '" title="' + esc(t('actLong_' + a)) + '">' + svgIcon(a, 15) + '<span>' + t('act_' + a) + '</span></button>'; }).join('');
  box.querySelectorAll('button').forEach(function (b) { b.onclick = function () { setAct(b.dataset.act); }; });
}
function renderDays() {
  var box = $('#sw-days'); box.innerHTML = '';
  A.fc.days.forEach(function (d) {
    var rows = rankDay(d), top = rows.filter(function (r) { return r.best; })[0], s = top ? top.best.s : 0;
    var b = document.createElement('button'); b.className = d === A.dayRef ? 'on' : '';
    b.innerHTML = '<span>' + dayName(d) + '</span><i><b style="width:' + Math.round(100 * clamp(s / 0.85, 0.04, 1)) + '%"></b></i>';
    b.onclick = function () { chooseDay(d); }; box.appendChild(b);
  });
}
function renderHourRow() {
  var r = $('#sw-hour'), pos = A.dayRef.idx.indexOf(A.hour);
  r.max = A.dayRef.idx.length - 1; r.value = Math.max(0, pos);
  $('#sw-hour-v').textContent = hourLabelOf(A.hour);
  drawDayStrip(); drawTimeline();
}
function drawDayStrip() {
  var cv = $('#sw-daystrip'), dpr = devicePixelRatio, W = cv.clientWidth || 300, H = cv.clientHeight || 20;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  var g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  var idx = A.dayRef.idx, n = idx.length, X = function (k) { return (k + 0.5) / n * W; };
  var spots = A.beaches.filter(function (b) { return spotsOf(A.act).indexOf(b.kind) >= 0; });
  idx.forEach(function (i, k) {
    var s = Math.max.apply(null, [0].concat(spots.map(function (b) { return scoreAt(b, i).s; })));
    var bh = Math.max(1.5, s * (H - 3));
    g.fillStyle = !A.fc.daylight[i] ? rgba(COL.ink5, 0.5) : s >= 0.6 ? COL.ink : s >= 0.33 ? COL.ink3 : COL.ink5;
    g.fillRect(X(k) - W / n / 2 + 2, H - bh, W / n - 4, bh);
  });
}
function renderFavs() {
  var box = $('#sw-favs'), favs = A.beaches.filter(function (b) { return FAV.has(b.name); });
  if (!favs.length) { box.hidden = true; return; }
  box.hidden = false;
  box.innerHTML = '<h2 class="sw-sec">' + t('yourBeaches') + '</h2>' + favs.map(function (b) {
    var w = spotsOf(A.act).indexOf(b.kind) >= 0 ? nextWindow(b) : null, c = w ? b.rows[w.i].c : null;
    return '<button class="sw-fav" data-beach="' + esc(b.name) + '"><span class="b">★ ' + esc(b.name) + '</span><span class="w">' + (w ? dayName(w.day) + ' · ' + winText(w) + ' · ' + metricBig(c) : t('noWindow')) + '</span>' + (w ? chipHTML(scoreAt(b, w.i)) : '') + '</button>';
  }).join('');
  box.querySelectorAll('.sw-fav').forEach(function (el) { el.onclick = function () {
    var b = A.beaches.filter(function (x) { return x.name === el.dataset.beach; })[0], w = spotsOf(A.act).indexOf(b.kind) >= 0 ? nextWindow(b) : null;
    if (w && w.day !== A.dayRef) A.dayRef = w.day;
    selectBeach(b.name); if (w) setHour(w.i);
  }; });
}
function renderList(rows) {
  $('#sw-card').hidden = true; var box = $('#sw-rank'); box.hidden = false;
  renderFavs();
  var ol = box.querySelector('ol'); ol.innerHTML = '';
  var night = A.dayRef === A.fc.days[0] && isToday(A.dayRef) && !daylightLeft(A.dayRef);
  /* refused beaches go last, named, never ranked */
  var ranked = rows.filter(function (r) { return r.best; }), refused = rows.filter(function (r) { return !r.best; });
  ranked.concat(refused).forEach(function (r, k) {
    var li = document.createElement('li'); li.dataset.beach = r.b.name;
    var i = night || !r.best ? A.hour : r.best.i, now = scoreAt(r.b, i), c = now.c;
    var win = !r.best || night ? '' : winText(r.best) + ' · ';
    var others = actsAt(r.b, i).filter(function (o) { return o.act !== A.act; }).slice(0, 4);
    var band = bandOf(c), refusedNow = now.v === 'refused';
    if (refusedNow) li.className = 'refused';
    li.innerHTML = '<span class="n">' + (night || !r.best ? '' : k + 1) + '</span>' +
      '<span class="b">' + (FAV.has(r.b.name) ? '<i class="star">★</i> ' : '') + esc(r.b.name) + '<small>' + t('region_' + r.b.region) + ' · ' + t('kind_' + r.b.kind) + '</small></span>' +
      '<span class="h">' + (refusedNow ? '—' : metricBig(c)) + (band ? '<small>' + num(band[0] / 100, 1) + '–' + num(band[1] / 100, 1) + '</small>' : '') + '</span>' +
      '<span class="d">' + chipHTML(now) + '<span>' + (refusedNow ? '' : win + metricSub(c)) + '</span><span class="sp"></span><span class="sw-mini">' + miniIcons(others) + '</span></span>' +
      '<canvas class="sw-spark"></canvas>';
    li.onclick = function () { selectBeach(r.b.name); };
    li.tabIndex = 0; li.setAttribute('role', 'button');
    li.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectBeach(r.b.name); } };
    ol.appendChild(li);
  });
  A.listRows = ranked.concat(refused);
  requestAnimationFrame(drawSparks);
}
function drawSparks() {
  var idx = A.dayRef.idx;
  var vals = A.listRows.map(function (r) { return idx.map(function (i) { return metricOf(r.b.rows[i].c); }); });
  var ymax = Math.max.apply(null, [A.act === 'kite' ? 20 : 0.8].concat([].concat.apply([], vals))) * 1.05;
  document.querySelectorAll('#sw-rank li').forEach(function (li, k) {
    var cv = li.querySelector('canvas'); if (!cv) return;
    var dpr = devicePixelRatio, W = cv.clientWidth || 280, H = cv.clientHeight || 16;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    var g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    var X = function (j) { return (j + 0.5) / idx.length * W; }, Y = function (v) { return H - 1 - (H - 3) * v / ymax; };
    idx.forEach(function (i, j) { if (!A.fc.daylight[i]) { g.fillStyle = rgba(COL.paper, 0.55); g.fillRect(X(j) - W / idx.length / 2, 0, W / idx.length + 0.5, H); } });
    g.beginPath(); g.moveTo(X(0), H); vals[k].forEach(function (v, j) { g.lineTo(X(j), Y(v)); }); g.lineTo(X(idx.length - 1), H); g.closePath();
    g.fillStyle = rgba(COL.ink2, 0.16); g.fill();
    g.beginPath(); vals[k].forEach(function (v, j) { j ? g.lineTo(X(j), Y(v)) : g.moveTo(X(j), Y(v)); }); g.strokeStyle = COL.ink2; g.lineWidth = 1.1; g.stroke();
    var j0 = idx.indexOf(A.hour); if (j0 >= 0) { g.fillStyle = COL.ink; g.fillRect(Math.round(X(j0)) - 0.75, 0, 1.5, H); }
  });
}

/* ================================================================ a beach */
function selectBeach(name, fly) {
  var b = A.beaches.filter(function (x) { return x.name === name; })[0]; if (!b) return;
  A.sel = name; setHash(); setTab('beaches');
  var best = S.bestOfDay(A.all, b.k, A.dayRef.idx, A.act, A.dayRef === A.fc.days[0] ? A.fc.now : 0);
  if (best) setHour(best.i, true);
  renderHourRow(); renderCard(); paintLabels(); drawCurrents(); renderTabLabels();
  if (UI.phone.matches) setSheet('half');
  if (fly !== false && A.map) A.map.flyTo({ center: [b.lon, b.lat], zoom: Math.max(A.map.getZoom(), 13.4), duration: 1200, essential: true });
  $('#panel .sw-scroll').scrollTop = 0;
}
function closeCard() { A.sel = null; setHash(); renderAll(); }
function decLines(j, c) {
  if (!j || !j.dec || !j.dec.length) return '';
  return j.dec.map(function (d) {
    var word = LANG.cur === 'pt' ? d.word : d.en, lim = metres(Number(d.limit), 2);
    var bd = d.var === 'hs' ? (c.sea && c.sea.lo != null ? [Math.round(c.sea.lo * 100), Math.round(c.sea.hi * 100)] : null) : (c.waves && c.waves.lo != null ? [c.waves.lo, c.waves.hi] : null);
    var lo = bd ? metres(bd[0] / 100, 2) : '—', hi = bd ? metres(bd[1] / 100, 2) : '—', txt;
    if (d.letter === 'V') txt = t('decV', { word: word, lo: lo, lim: lim });
    else if (d.letter === 'I') {
      /* decide.js's flip is how far the UNFAVOURABLE edge (here the high one) must move to clear; the other way, the
         low edge must pass the limit (a <= limit: one centimetre over it), counted in whole centimetres, exactly */
      var f = d.flip && d.flip[0], up = bd ? Math.round(Number(d.limit) * 100) - bd[0] + 1 : null;
      txt = t('decI', { word: word, lo: lo, hi: hi, lim: lim, gap: f ? metres(Number(f.gapDec), 2) : '—', up: up != null ? metres(up / 100, 2) : '—' });
    }
    else if (d.letter === 'L') txt = t('decL', { lim: lim, lo: lo, hi: hi });
    else txt = t('decS', { lim: lim });
    return '<span class="sw-dec ' + d.letter + '">' + esc(d.letter === 'V' ? word : t('dec_' + d.letter)) + '</span><span>' + txt + '</span>';
  }).join('');
}
function renderCard() {
  var b = A.beaches.filter(function (x) { return x.name === A.sel; })[0]; if (!b) return;
  $('#sw-rank').hidden = true; $('#sw-favs').hidden = true; var el = $('#sw-card'); el.hidden = false;
  var i = A.hour, r = scoreAt(b, i), c = r.c, act = A.act, j = r.j, w = c.waves;
  var band = bandOf(c);
  /* why: how much of each offshore swell reaches this beach (K at its probes, the model's own reading) */
  var why = '';
  if (b.kind === 'lagoon') why = t('lagoonWhy');
  else if (!w.refused && c.sea && c.sea.parts.length) {
    var tot = Math.sqrt(c.sea.parts.reduce(function (s, P) { return s + P.h * P.h; }, 0)) || 1;
    var ps = c.sea.parts.map(function (P) { var ks = S.kProbes(A.B, b, P.d, P.p), k = Math.max.apply(null, [0].concat(ks)); return { P: P, pct: Math.round(100 * k), h: P.h * c.sea.size / tot }; })
      .filter(function (x) { return x.h > 0.1; }).sort(function (x, y) { return y.pct * y.h - x.pct * x.h; });
    if (ps.length) {
      var p0 = ps[0].pct;
      if (p0 < 30) why = t('whySheltered', { p: p0 });
      else {
        why = p0 >= 100 ? t('whyGrow', { dir: dirWord(ps[0].P.d) }) : t('whyGet', { p: p0, dir: dirWord(ps[0].P.d) });
        if (ps[1]) why += (p0 >= 100 ? ', ' : ' ') + (ps[1].pct >= 100 ? t('whyAndGrow', { dir: dirWord(ps[1].P.d) }) : t('whyAnd', { p: ps[1].pct, dir: dirWord(ps[1].P.d) }));
        why += '.';
      }
    }
    if (w.chop > 10 && b.kind === 'bay') why += ' ' + t('whyChop', { h: metres(w.chop / 100), kmh: num(c.wind.U * 3.6, 0) });
  }
  var parts = c.sea && c.sea.parts.length ? c.sea.parts.map(function (P) { return metres(P.h * c.sea.size / (Math.sqrt(c.sea.parts.reduce(function (s, Q) { return s + Q.h * Q.h; }, 0)) || 1)) + ' · ' + num(P.p, 0) + ' s · ' + dirShort(P.d); }).join('<br>') : '—';
  var tide = tideAt(i), sst = sstAt(i);
  var cur = c.cur && c.cur.V >= 0.05 ? t('longshore', { v: num(c.cur.V, 1), dir: dirWord(c.cur.toward) }) : t('calmWater');
  var guard = b.lifeguard && b.lifeguard.d < 2000
    ? esc(b.lifeguard.name || t('poi_lifeguard')) + ' · ' + Math.round(b.lifeguard.d / 50) * 50 + ' m · <a href="https://www.google.com/maps/dir/?api=1&destination=' + b.lifeguard.lat + ',' + b.lifeguard.lon + '" target="_blank" rel="noopener">' + t('route') + '</a>'
    : t('noGuard');
  var warns = [];
  if (c.rip) warns.push(t('ripWarn'));
  if ((c.wc === 'offshore' || c.wc === 'side-offshore') && c.wind.U > 4 && /kite|sup|swim/.test(act)) warns.push(t('offWarn'));
  var here = S.ACT_ORDER.filter(function (a) { return spotsOf(a).indexOf(b.kind) >= 0; }).map(function (a) { var q = scoreAt(b, i, a); return { act: a, cls: q.d === 'V' ? 'V' : q.v }; });
  var actsHere = here.map(function (o) { return '<button class="ah ' + (/good|fair|V/.test(o.cls) ? o.cls : '') + (o.act === act ? ' sel' : '') + '" data-act="' + o.act + '">' + svgIcon(o.act, 13) + t('act_' + o.act) + '</button>'; }).join('');
  var refusedHtml = '';
  if (w.refused) {
    var m = /^edge:(.*)$/.exec(w.refused);
    refusedHtml = '<p class="sw-refused">' + (m ? t('refusedEdge', { km: m[1].replace(/^[NSW] /, '').replace('.', LANG.cur === 'pt' ? ',' : '.') }) : t('refusedNo')) + '</p>';
  }
  var notes = [];
  if (w.capped) notes.push(t('capped', { h: num(b.probes[b.probes.length - 1].h, 1) }));
  /* a wind sea shorter than 6 s is read as the 6 s case (said once, in "Como sabemos"); a swell LONGER than the
     library is the one worth flagging where it happens */
  if (w.ext) w.ext.filter(function (T) { return T > S.C.T_MAX; }).forEach(function (T) { notes.push(t('extT', { T: num(T, 0), T0: S.C.T_MAX })); });
  if (c.sea && c.sea.flat) notes.push(t('flatSea'));
  var rain = c.wind.rain;
  el.innerHTML =
    '<button class="sw-btn sw-back" id="sw-card-back">← ' + t('back') + '</button>' +
    '<div class="head"><h1>' + esc(b.name) + '</h1>' + chipHTML(r) + '</div>' +
    '<div class="where">' + t('region_' + b.region) + ' · ' + t('kind_' + b.kind) + '</div>' +
    '<div class="acts-here">' + actsHere + '</div>' +
    (w.refused && act !== 'kite' ? refusedHtml : '<div class="big"><b>' + metricBig(c) + '</b><span>' + cap(dayName(dayOf(i))) + ' · ' + hourLabelOf(i) + '<br>' + metricSub(c) + '</span></div>' +
      (act === 'kite' ? '' : '<p class="band">' + (band ? t('bandLine', { lo: num(band[0] / 100, 2), hi: metres(band[1] / 100, 2) }) : t('bandNone')) + '</p>')) +
    (notes.length ? '<p class="sw-note">' + notes.join(' · ') + '</p>' : '') +
    (why ? '<p class="why">' + why + '</p>' : '') +
    (j && j.dec && j.dec.length ? '<h2 class="sw-sec">' + t('decidedH') + '</h2><div class="sw-decl">' + decLines(j, c) + '</div>' : '') +
    warns.map(function (x) { return '<p class="sw-warn">' + svgIcon('sos', 15) + '<span>' + x + '</span></p>'; }).join('') +
    '<h2 class="sw-sec">' + t('conditions') + '</h2><dl>' +
      '<dt>' + t('breakH') + '</dt><dd>' + (c.hb == null ? '—' : metres(c.hb)) + (c.cur && c.cur.dom ? ' · ' + num(c.cur.dom.p, 0) + ' s · ' + dirShort(c.cur.dom.d) : '') + '</dd>' +
      '<dt>' + t('swellOff') + '</dt><dd>' + (c.off == null ? '—' : metres(c.off) + (c.sea && c.sea.lo != null ? ' <span class="fc">(' + num(c.sea.lo, 1) + '–' + num(c.sea.hi, 1) + ')</span>' : '')) + '<br>' + parts + '</dd>' +
      '<dt>' + t('windH') + '</dt><dd>' + windWords(c.wind.U, c.wc) + ' · ' + num(c.wind.U * 3.6, 0) + ' km/h (' + num(c.wind.U * KN, 0) + ' ' + t('knots') + ') ' + t('from') + ' ' + dirShort(c.wind.dir) + ' · ' + t('gusts') + ' ' + num(c.wind.gust * 3.6, 0) + ' km/h <span class="fc">ECMWF</span></dd>' +
      '<dt>' + t('currentH') + '</dt><dd>' + cur + '</dd>' + foamRow(b) +
      '<dt>' + t('tide') + '</dt><dd>' + (tide ? (tide.level >= 0 ? '+' : '−') + metres(Math.abs(tide.level), 2) + ' · ' + tide.trend + ' <span class="fc">Copernicus</span>' : '—') + '</dd>' +
      '<dt>' + t('water') + ' · ' + t('air') + '</dt><dd>' + (sst != null ? num(sst, 1) + ' °C' : '—') + ' · ' + (c.wind.t2 != null ? num(c.wind.t2, 0) + ' °C' : '—') + (rain != null && rain >= 0.2 ? ' · ' + t('rain').toLowerCase() + ' ' + num(rain, 1) + ' mm' : '') + '</dd>' +
    '</dl>' +
    '<h2 class="sw-sec">' + t('safety') + '</h2>' +
    '<p class="sw-guard">' + svgIcon('lifeguard', 14) + '<span>' + t('nearestGuard') + ': ' + guard + '</span></p>' +
    '<p class="sw-guard">' + svgIcon('info', 14) + '<span>' + t('cbmsc') + '</span></p>' +
    '<button class="sw-btn sw-sosline" data-sos>' + svgIcon('sos', 15) + '<span>' + t('sos') + ': 193 · 190 · 192 · 185</span></button>' +
    '<h2 class="sw-sec">' + t('week') + '</h2><canvas class="week"></canvas>' +
    '<h2 class="sw-sec">' + t('cert') + '</h2>' + certBlock(b, i) +
    '<div class="actions"><button class="sw-btn on" id="sw-card-map">' + t('onMap') + '</button><button class="sw-btn' + (FAV.has(b.name) ? ' on' : '') + '" id="sw-card-fav">' + (FAV.has(b.name) ? '★ ' + t('saved') : '☆ ' + t('save')) + '</button><button class="sw-btn" id="sw-card-share">' + t('share') + '</button><button class="sw-btn" id="sw-card-cert">' + t('certDl') + '</button></div>';
  $('#sw-card-back').onclick = closeCard;
  $('#sw-card-fav').onclick = function () { toggleFav(b.name); renderCard(); };
  $('#sw-card-share').onclick = function () { shareBeach(b, r); };
  $('#sw-card-cert').onclick = function () { certDownload(b, i); };
  $('#sw-card-map').onclick = function () { if (UI.phone.matches) setSheet('peek'); A.map.flyTo({ center: [b.lon, b.lat], zoom: 14, duration: 1000 }); };
  el.querySelector('[data-sos]').onclick = openSOS;
  el.querySelectorAll('.acts-here .ah').forEach(function (x) { x.onclick = function () { setAct(x.dataset.act); }; });
  requestAnimationFrame(function () { drawWeek(el.querySelector('canvas.week'), b); });
}
/* the beach's measured trait (apps/swell/sim/foam.py): how much it usually breaks, as the satellites saw it */
function foamRow(b) {
  var F = CFG.foam, f = F && F.beaches[b.name]; if (!f) return '';
  var rank = f.rankOcean ? t('foamRank', { k: f.rankOcean, of: F.oceanBeaches }) : '';
  return '<dt>' + t('fromSpace') + '</dt><dd>' + t('foamRow', { p: Math.round(100 * f.median), n: f.n, from: F.from.slice(0, 4), to: F.to.slice(0, 4), rank: rank }) + ' <span class="fc">' + t('measured') + ' · Copernicus Sentinel-2</span></dd>';
}
function certBlock(b, i) {
  var D = A.day, ck = A.check, st = D.steps[i];
  var lines = [];
  lines.push((ck && ck.equal ? '<span class="ok">✓</span> ' + esc(t('rechk', { n: ck.lines, ms: ck.ms })) : '<span class="bad">✗</span> ' + esc(t('rechkBad', { why: ck ? ck.why : '—' }))));
  lines.push('<b>' + esc(b.name) + '</b> · ' + st.t + ' UTC (+' + st.lead + ' h) · ' + (LANG.cur === 'pt' ? 'rodada ECMWF/NOAA ' : 'ECMWF/NOAA run ') + D.run);
  var s = D.sea[i];
  if (s && s.lo != null) lines.push((LANG.cur === 'pt' ? 'mar aberto: ' : 'open sea: ') + s.size + ' m, ' + (LANG.cur === 'pt' ? 'faixa ' : 'band ') + s.lo + '–' + s.hi + ' m (' + (s.from || []).join(' ∪ ') + ', ' + D.band.claim + ')');
  lines.push('surf.js ' + D.modules['surf.js'].sha.slice(0, 12) + ' · decide.js ' + D.modules['decide.js'].sha.slice(0, 12) + ' · beaches.json ' + D.inputs['apps/swell/data/beaches.json'].slice(0, 12));
  lines.push((LANG.cur === 'pt' ? 'digest do dia ' : 'day digest ') + D.digest.slice(0, 16) + ' · feed ' + D.feed.sha.slice(0, 12));
  return '<div class="sw-cert">' + lines.join('<br>') + '</div>';
}
function certDownload(b, i) {
  var D = A.day, r = scoreAt(b, i), c = r.c, st = D.steps[i];
  var cert = {
    praia: b.name, passo: st.t + ' UTC', antecedencia_h: st.lead, atividade: A.act, rodada: D.run,
    altura_na_beira_cm: c.waves.refused ? null : { central: c.waves.c, faixa: c.waves.lo != null ? [c.waves.lo, c.waves.hi] : null, no_limite_do_modelo: !!c.waves.capped },
    recusa: c.waves.refused || null,
    mar_aberto: D.sea[i], decisoes: r.j && r.j.dec ? r.j.dec.map(function (d) { return { regra: d.id, limite_m: d.limit, veredito: d.verdict, testemunha: d.witness, limiar: d.flip }; }) : [],
    avisos_de_previsao: r.j && r.j.warn ? r.j.warn.map(function (w) { return w.id; }) : [],
    modulos: D.modules, entradas: D.inputs, digest_do_dia: D.digest, feed: D.feed, codigo: D.git,
    conferencia_no_navegador: A.check,
    refazer: ['git clone https://github.com/carlostoledo1891/cert-machine && cd cert-machine && git checkout ' + D.git, 'node apps/swell/build-day.js --feed ' + D.run.slice(0, 8)],
    aviso: 'Decidido = a aritmética exata sobre a faixa medida do mar aberto levada à praia pelo modelo linear da ilha (o erro do próprio modelo na beira não foi medido). Não é uma garantia de segurança. Não serve para navegação.',
  };
  var blob = new Blob([JSON.stringify(cert, null, 1)], { type: 'application/json' });
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'swell-' + slug(b.name) + '-' + st.t.replace(/[^0-9]/g, '') + '.json'; a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
}
function drawWeek(cv, b) {
  if (!cv) return;
  var N = A.fc.N, dpr = devicePixelRatio, W = cv.clientWidth || 340, H = cv.clientHeight || 96;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  var g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  var vals = b.rows.map(function (r) { return metricOf(r.c); }), top = 16, bot = H - 2;
  var bands = b.rows.map(function (r) { return bandOf(r.c); });
  var ymax = Math.max.apply(null, [A.act === 'kite' ? 20 : 0.8].concat(vals, bands.map(function (x) { return x ? x[1] / 100 : 0; }))) * 1.1;
  var X = function (i) { return (i + 0.5) / N * W; }, Y = function (v) { return bot - (bot - top) * v / ymax; };
  for (var i = 0; i < N; i++) {
    if (!A.fc.daylight[i]) { g.fillStyle = rgba(COL.paper, 0.6); g.fillRect(X(i) - W / N / 2, top - 2, W / N + 0.5, bot - top + 2); }
    else { var q = scoreAt(b, i); if (q.d === 'V') { g.fillStyle = rgba(COL.refu, 0.22); g.fillRect(X(i) - W / N / 2, top - 2, W / N + 0.5, bot - top + 2); } else if (q.s >= 0.33) { g.fillStyle = rgba(COL.ink, q.s >= 0.6 ? 0.16 : 0.07); g.fillRect(X(i) - W / N / 2, top - 2, W / N + 0.5, bot - top + 2); } }
    var dd = dayOf(i);
    if (dd && dd.idx[0] === i) { g.fillStyle = rgba(COL.ink, 0.12); g.fillRect(Math.round(X(i) - W / N / 2), 0, 1, bot); g.fillStyle = dd === A.dayRef ? COL.ink : COL.ink3; g.font = '10px ' + getComputedStyle(document.body).fontFamily; g.fillText(dayName(dd), X(i) + 1, 10); }
  }
  /* the measured band: a filled band (decided ink is solid) */
  g.beginPath(); var started = false;
  bands.forEach(function (bd, k) { if (!bd) return; var y = Y(bd[1] / 100); started ? g.lineTo(X(k), y) : (g.moveTo(X(k), y), started = true); });
  for (var k2 = N - 1; k2 >= 0; k2--) if (bands[k2]) g.lineTo(X(k2), Y(bands[k2][0] / 100));
  if (started) { g.closePath(); g.fillStyle = rgba(COL.ink2, 0.18); g.fill(); }
  g.beginPath(); vals.forEach(function (v, k) { k ? g.lineTo(X(k), Y(v)) : g.moveTo(X(k), Y(v)); }); g.strokeStyle = COL.ink2; g.lineWidth = 1.4; g.stroke();
  g.strokeStyle = rgba(COL.ink3, 0.8); g.setLineDash([2, 3]); g.beginPath(); g.moveTo(X(A.fc.now), top - 2); g.lineTo(X(A.fc.now), bot); g.stroke(); g.setLineDash([]);
  g.fillStyle = COL.ink; g.fillRect(Math.round(X(A.hour)) - 0.75, top - 4, 1.5, bot - top + 4);
  g.font = '9.5px ' + getComputedStyle(document.body).fontFamily; g.fillStyle = COL.ink3; g.textAlign = 'right'; g.fillText(A.act === 'kite' ? num(ymax / 1.1, 0) + ' ' + t('knots') : metres(ymax / 1.1), W - 2, top + 8); g.textAlign = 'left';
  cv.onclick = function (e) { var rr = cv.getBoundingClientRect(); setHour(clamp(Math.floor((e.clientX - rr.left) / rr.width * N), 0, N - 1)); };
}
function tideAt(i) {
  var O = A.day.ocean; if (!O || !O.times) return null;
  var k = O.times.indexOf(A.day.steps[i].t); if (k < 0) return null;
  var lv = O.level[k]; if (lv == null || isNaN(lv)) return null;
  var a = O.level[Math.max(0, k - 1)], z = O.level[Math.min(O.level.length - 1, k + 1)];
  return { level: lv, trend: z > a ? (LANG.cur === 'pt' ? 'subindo' : 'rising') : (LANG.cur === 'pt' ? 'descendo' : 'falling') };
}
function sstAt(i) { var O = A.day.ocean; if (!O || !O.sst) return null; var k = O.times.indexOf(A.day.steps[i].t); return k < 0 ? null : O.sst[k]; }
function shareBeach(b, r) {
  var w = S.bestOfDay(A.all, b.k, A.dayRef.idx, A.act, 0), c = w ? b.rows[w.i].c : r.c;
  var when = cap(dayName(A.dayRef)) + (w ? ' ' + winText(w) : ' ' + hourLabelOf(A.hour));
  var text = b.name + ' · ' + t('act_' + A.act) + ' · ' + when + ': ' + metricBig(c) + ', ' + metricSub(c) + ' (' + verdictWord(w ? scoreAt(b, w.i).v : r.v) + ')';
  var url = location.origin + location.pathname + '#praia=' + slug(b.name) + (A.act !== 'surf' ? '&atividade=' + A.act : '');
  if (navigator.share) navigator.share({ title: 'Swell — ' + b.name, text: text, url: url }).catch(function () {});
  else (navigator.clipboard ? navigator.clipboard.writeText(text + ' ' + url) : Promise.reject()).then(function () { toastMsg(t('copied')); }, function () { toastMsg(url, 8000); });
}

/* ================================================================ the clock */
function chooseDay(d) {
  A.dayRef = d;
  var rows = rankDay(d), b = A.sel && A.beaches.filter(function (x) { return x.name === A.sel; })[0];
  var best = b ? S.bestOfDay(A.all, b.k, d.idx, A.act, d === A.fc.days[0] ? A.fc.now : 0) : (rows.filter(function (r) { return r.best; })[0] || {}).best;
  setHour(best ? best.i : (d === A.fc.days[0] ? Math.max(A.fc.now, d.idx[0]) : d.idx[Math.min(4, d.idx.length - 1)]), true);
  renderAll();
}
function setHour(i, quiet) {
  A.hour = i; var d = dayOf(i); if (d && d !== A.dayRef) { A.dayRef = d; if (!quiet) return renderAll(); }
  if (!quiet) { renderHourRow(); if (A.sel) renderCard(); else drawSparks(); paintLabels(); drawCurrents(); }
  clearTimeout(UI.timer); UI.timer = setTimeout(function () { setWaveHour(i); }, 120);
}
function setAct(a) { A.act = a; setHash(); try { localStorage.setItem('swell.act', a); } catch (e) {} chooseDay(A.dayRef); }

/* ================================================================ tabs, sheets, language */
function setTab(name) {
  UI.tab = name;
  document.querySelectorAll('.sw-tab').forEach(function (b) { var on = b.dataset.tab === name; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  document.querySelectorAll('.sw-pane').forEach(function (p) { p.classList.toggle('on', p.dataset.pane === name); });
  moveTabLine();
  if (name === 'week') requestAnimationFrame(drawTimeline);
  if (UI.phone.matches && UI.sheet === 'peek') setSheet('half');
  $('#panel .sw-scroll').scrollTop = 0;
}
function moveTabLine() { var on = $('.sw-tab.on'), ul = $('.sw-tabs .ul'); if (!on || !ul) return; ul.style.left = on.offsetLeft + 10 + 'px'; ul.style.width = Math.max(0, on.offsetWidth - 20) + 'px'; }
function renderTabLabels() {
  var n = A.rows ? A.rows.filter(function (r) { return r.best && r.best.s >= 0.6; }).length : 0;
  $('[data-tab="beaches"]').innerHTML = t('tab_beaches') + (A.ready ? '<span class="ct">' + n + '</span>' : '');
  $('[data-tab="week"]').textContent = t('tab_week'); $('[data-tab="map"]').textContent = t('tab_map');
  moveTabLine();
}
function openSOS() { $('#sw-sheet-sos').hidden = false; $('#sw-sheet-how').hidden = true; $('#sw-sheet-board').hidden = true; }
function renderSOS() {
  var nums = [['193', 'n193'], ['190', 'n190'], ['192', 'n192'], ['185', 'n185'], ['199', 'n199']];
  $('#sw-sos-body').innerHTML = '<p class="sw-note">' + t('sosNote') + '</p>' + nums.map(function (x) { return '<a class="sw-tel" href="tel:' + x[0] + '"><b>' + x[0] + '</b><span>' + t(x[1]) + '</span></a>'; }).join('');
}
function renderHow() { $('#sw-how-body').innerHTML = CFG.how[LANG.cur] || CFG.how.pt; }
function renderBoard() {
  var D = A.day, pt = LANG.cur === 'pt';
  var rows = (D && D.board || []).map(function (p) {
    var s = p.site, cov = s.scored ? Math.round(1000 * s.covered / s.scored) / 10 : null;
    return '<tr><td>' + esc(p.name) + (p.decides ? (pt ? ' · <b>decide</b>' : ' · <b>decides</b>') : '') + '</td><td class="n">' + esc(p.claim) + '</td><td class="n">' + s.scored + '</td><td class="n">' + s.covered + '</td><td class="n">' + (cov == null ? '—' : num(cov, 1) + '%') + '</td></tr>';
  }).join('');
  $('#sw-board-body').innerHTML = CFG.boardIntro[LANG.cur] +
    '<table><thead><tr><th>' + (pt ? 'Proponente' : 'Proposer') + '</th><th>' + (pt ? 'promete' : 'claims') + '</th><th>' + (pt ? 'medidas' : 'scored') + '</th><th>' + (pt ? 'cobertas' : 'covered') + '</th><th>%</th></tr></thead><tbody>' +
    (rows || '<tr><td colspan="5">' + (pt ? 'ainda sem medidas neste ponto' : 'no scores at this point yet') + '</td></tr>') + '</tbody></table>' + CFG.boardFoot[LANG.cur];
}
function legendSVG(kind) {
  var W = 300, steps = 5, g = [];
  for (var k = 0; k < steps; k++) {
    var x0 = 2 + k * (W - 4) / steps, x1 = x0 + (W - 4) / steps - 10, u = k / (steps - 1), col = 'var(--ink)';
    if (kind === 'waves') { var w = 0.6 + 1.6 * u; for (var j = 0; j < 3; j++) g.push('<line x1="' + x0 + '" y1="' + (5 + j * 6) + '" x2="' + x1 + '" y2="' + (5 + j * 6) + '" stroke="' + col + '" stroke-width="' + w + '" opacity="' + (0.35 + 0.65 * u) + '"/>'); }
    else if (kind === 'wind') { var L = 8 + 22 * u; for (var j2 = 0; j2 < 3; j2++) g.push('<line x1="' + (x0 + j2 * 7) + '" y1="' + (6 + j2 * 5) + '" x2="' + (x0 + j2 * 7 + L) + '" y2="' + (6 + j2 * 5) + '" stroke="' + col + '" stroke-width="' + (1 + 1.2 * u) + '" stroke-linecap="round" opacity="' + (0.35 + 0.65 * u) + '"/>'); }
    else { var L2 = 10 + 28 * u, y = 11, xe = x0 + L2; g.push('<line x1="' + x0 + '" y1="' + y + '" x2="' + xe + '" y2="' + y + '" stroke="' + col + '" stroke-width="2.2" stroke-linecap="round" opacity="' + (0.35 + 0.65 * u) + '"/><path d="M' + (xe + 4) + ' ' + y + ' L' + (xe - 4) + ' ' + (y - 4) + ' L' + (xe - 4) + ' ' + (y + 4) + ' Z" fill="' + col + '" opacity="' + (0.35 + 0.65 * u) + '"/>'); }
  }
  return '<svg viewBox="0 0 ' + W + ' 22" preserveAspectRatio="none" aria-hidden="true">' + g.join('') + '</svg>';
}
function renderLayers() {
  var rows = [['waves', 'L_waves', 'legend_waves', ['0', '0,5', '1', '2', '3+']], ['wind', 'L_wind', 'legend_wind', ['0', '15', '30', '45+']], ['currents', 'L_currents', 'legend_currents', ['0', '0,3', '0,6+']], ['pois', 'L_pois', null, null]];
  $('#sw-layers-body').innerHTML = rows.map(function (x) {
    var k = x[0];
    return '<label class="sw-lay"><input type="checkbox" data-layer="' + k + '"' + (A.layers[k] ? ' checked' : '') + '><span class="nm">' + t(x[1]) + '</span>' +
      (x[2] ? '<span class="lg">' + legendSVG(k) + '<em>' + x[3].map(function (s) { return '<s>' + (LANG.cur === 'en' ? s.replace(',', '.') : s) + '</s>'; }).join('') + '</em><small>' + t(x[2]) + '</small></span>'
        : '<span class="lg poi-row">' + ['lifeguard', 'police', 'fire', 'health', 'navy', 'ramp'].map(function (c) { return '<span class="sw-poi sw-poi-' + c + '" title="' + esc(t('poi_' + c)) + '">' + svgIcon(c, 12) + '</span>'; }).join('') + '</span>') + '</label>';
  }).join('');
  $('#sw-layers-body').querySelectorAll('input').forEach(function (inp) { inp.onchange = function () {
    A.layers[inp.dataset.layer] = inp.checked; document.body.classList.toggle('pois-off', !A.layers.pois); drawCurrents(); if (A.map) A.map.triggerRepaint();
  }; });
  mapNote();
}
function mapNote() { var el = $('#sw-map-note'); if (!el) return; var s = WV.speed || 1; el.textContent = s > 1.5 ? t('mapNoteFast', { x: Math.round(s) }) : t('mapNoteReal'); }
function renderLegend() {
  $('#sw-tl-legend').innerHTML = [['wv', 'lg_waves'], ['bd', 'lg_band'], ['', 'lg_wind'], ['td', 'lg_tide'], ['q', 'lg_good'], ['q2', 'lg_fair'], ['dv', 'lg_dec']].map(function (x) { return '<i class="' + x[0] + '"></i><span>' + t(x[1]) + '</span>'; }).join('');
}
function applyStrings() {
  document.documentElement.lang = LANG.cur === 'pt' ? 'pt-BR' : 'en';
  $('#sw-how').innerHTML = svgIcon('info', 16) + '<span>' + t('how') + '</span>'; $('#sw-how').title = t('how');
  $('#sw-boardb').innerHTML = svgIcon('board', 16) + '<span>' + t('board') + '</span>';
  $('#sw-sos').innerHTML = svgIcon('sos', 15) + '<span>' + t('sos') + '</span>';
  $('#sw-now').textContent = t('now'); $('#sw-tl-now').textContent = t('now'); $('#sw-rank-h').textContent = t('rankHead');
  $('#sw-how-title').textContent = t('how'); $('#sw-sos-title').textContent = t('sosTitle'); $('#sw-board-title').textContent = t('board');
  $('#sw-intro-sub').textContent = t('introSub');
  document.querySelectorAll('[data-close]').forEach(function (el) { el.textContent = t('close'); });
  document.querySelectorAll('.sw-lang button').forEach(function (b) { b.classList.toggle('on', b.dataset.lang === LANG.cur); });
  renderHow(); renderSOS(); renderLayers(); renderLegend(); renderTabLabels(); if (A.day) renderBoard();
}
function toastMsg(msg, ms) { var el = $('#sw-toast'); el.textContent = msg; el.style.display = 'block'; clearTimeout(UI.toast); if (ms !== 0) UI.toast = setTimeout(function () { el.style.display = 'none'; }, ms || 4000); }
var slug = function (s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-'); };
function setHash() {
  var parts = [];
  if (A.act !== 'surf') parts.push('atividade=' + A.act);
  if (A.sel) parts.push('praia=' + slug(A.sel));
  history.replaceState(null, '', parts.length ? '#' + parts.join('&') : location.pathname + location.search);
}

/* ================================================================ the phone's sheet */
function setSheet(state) {
  UI.sheet = state; var p = $('#panel');
  p.classList.toggle('half', state === 'half'); p.classList.toggle('full', state === 'full');
  setMapPadding();
}
function setupSheet() {
  var p = $('#panel'), grab = $('.sw-grab'), y0 = null, t0 = 0, base = 0;
  var peek = function () { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sw-peek')) || 252; };
  var offsetOf = function (st) { return st === 'full' ? 0 : st === 'half' ? 0.40 * innerHeight : 0.90 * innerHeight - peek(); };
  var start = function (e) { if (!UI.phone.matches) return; y0 = e.clientY; t0 = performance.now(); base = offsetOf(UI.sheet); p.classList.add('dragging'); };
  var move = function (e) { if (y0 == null) return; p.style.transform = 'translateY(' + Math.max(0, base + e.clientY - y0) + 'px)'; };
  var end = function (e) {
    if (y0 == null) return; p.classList.remove('dragging'); p.style.transform = '';
    var dy = e.clientY - y0, v = dy / Math.max(1, performance.now() - t0), y = base + dy; y0 = null;
    if (Math.abs(dy) < 6) { setSheet(UI.sheet === 'peek' ? 'half' : UI.sheet === 'half' ? 'full' : 'half'); return; }
    var st = ['full', 'half', 'peek'].reduce(function (a, s2) { return Math.abs(offsetOf(s2) - y) < Math.abs(offsetOf(a) - y) ? s2 : a; });
    if (v > 0.6) st = UI.sheet === 'full' ? 'half' : 'peek'; else if (v < -0.6) st = UI.sheet === 'peek' ? 'half' : 'full';
    setSheet(st);
  };
  grab.addEventListener('pointerdown', start); addEventListener('pointermove', move); addEventListener('pointerup', end); addEventListener('pointercancel', end);
  $('#sw-answer').addEventListener('click', function () { if (UI.phone.matches && UI.sheet === 'peek') setSheet('half'); });
}
var VIEW = [[-48.62, -27.86], [-48.33, -27.37]];
function fitIsland(duration) {
  if (!A.map) return;
  var pad = UI.phone.matches ? { top: 60, bottom: 260, left: 12, right: 12 } : { top: 70, left: 24, bottom: 24, right: 404 + 28 + 14 };
  A.map.fitBounds(VIEW, { padding: pad, duration: duration || 0 });
}
function setMapPadding() { if (!A.map) return; if (UI.phone.matches) A.map.setPadding({ top: 50, bottom: UI.sheet === 'peek' ? 252 : UI.sheet === 'half' ? Math.round(innerHeight * 0.6) : 0, left: 0, right: 0 }); else A.map.setPadding({ top: 60, left: 0, bottom: 0, right: 404 + 28 }); }

/* ================================================================ the week tab */
var TL = { drag: false };
function tlSeries() {
  var N = A.fc.N, b = A.sel && A.beaches.filter(function (x) { return x.name === A.sel; })[0];
  var S2 = { b: b, waves: [], band: [], wind: [], gust: [], tide: [], q: [], dv: [] };
  var spots = A.beaches.filter(function (x) { return spotsOf(A.act).indexOf(x.kind) >= 0; });
  for (var i = 0; i < N; i++) {
    var c;
    if (b) { c = b.rows[i].c; S2.waves.push(c.hb == null ? 0 : c.hb); var bd = bandOf(c, 'surf'); S2.band.push(bd ? [bd[0] / 100, bd[1] / 100] : null); S2.wind.push(c.wind.U * KN); S2.gust.push(c.wind.gust * KN); var q = scoreAt(b, i); S2.q.push(q.s); S2.dv.push(q.d === 'V'); }
    else {
      var s = A.day.sea[i], w = S.windAt(A.day, i, -48.45, -27.6) || { U: 0, gust: 0 };
      S2.waves.push(s.size || 0); S2.band.push(s.lo != null ? [s.lo, s.hi] : null); S2.wind.push(w.U * KN); S2.gust.push(w.gust * KN);
      S2.q.push(Math.max.apply(null, [0].concat(spots.map(function (x) { return scoreAt(x, i).s; }))));
      S2.dv.push(spots.some(function (x) { return scoreAt(x, i).d === 'V'; }));
    }
    var td = tideAt(i); S2.tide.push(td ? td.level : null);
  }
  return S2;
}
function drawTimeline() {
  var pane = $('[data-pane="week"]'); if (!pane || !A.ready || !pane.classList.contains('on')) return;
  var cv = $('#sw-tl-chart'), dpr = devicePixelRatio, W = cv.clientWidth, H = cv.clientHeight; if (!W) return;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  var g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
  var N = A.fc.N, Sr = tlSeries(), L = 2, R = 58, top = 28, qy = 15, bot = H - 18, tideH = 14, plotB = bot - tideH - 6;
  var X = function (i) { return L + (W - L - R) * (i + 0.5) / N; }, cw = (W - L - R) / N;
  var ff = getComputedStyle(document.body).fontFamily;
  for (var i = 0; i < N; i++) {
    if (!A.fc.daylight[i]) { g.fillStyle = rgba(COL.paper, 0.65); g.fillRect(X(i) - cw / 2, top - 4, cw + 0.5, bot - top + 4); }
    var d = dayOf(i);
    if (d && d.idx[0] === i) { if (i) { g.fillStyle = rgba(COL.ink, 0.10); g.fillRect(Math.round(X(i) - cw / 2), 0, 1, bot); } g.font = '600 10.5px ' + ff; g.fillStyle = d === A.dayRef ? COL.ink : COL.ink4; var nm = cap(dayName(d)); g.fillText(cw * 8 < 58 ? nm.slice(0, 3) : nm, X(i) - cw / 2 + 4, 10); }
  }
  for (var k = 0; k < N; k++) {
    if (!A.fc.daylight[k]) continue;
    var s = Sr.q[k], x = X(k) - cw / 2 + 0.6, w = Math.max(1, cw - 1.2);
    if (Sr.dv[k]) { g.fillStyle = COL.refu; g.fillRect(x, qy, w, 6); }
    else if (s >= 0.6) { g.fillStyle = COL.ink; g.fillRect(x, qy, w, 6); }
    else if (s >= 0.33) { g.strokeStyle = COL.ink3; g.lineWidth = 1; g.strokeRect(x + 0.5, qy + 0.5, w - 1, 5); }
    else { g.fillStyle = COL.ruleS; g.fillRect(x, qy + 2.5, w, 1); }
  }
  var hmax = Math.max.apply(null, [1].concat(Sr.waves, Sr.band.map(function (b) { return b ? b[1] : 0; }))) * 1.12, umax = Math.max.apply(null, [15].concat(Sr.gust)) * 1.05;
  var Yh = function (v) { return plotB - (plotB - top) * v / hmax; }, Yu = function (v) { return plotB - (plotB - top) * v / umax; };
  /* the measured band, then the forecast line inside it */
  g.beginPath(); var st = false;
  Sr.band.forEach(function (b, j) { if (!b) return; st ? g.lineTo(X(j), Yh(b[1])) : (g.moveTo(X(j), Yh(b[1])), st = true); });
  for (var j3 = N - 1; j3 >= 0; j3--) if (Sr.band[j3]) g.lineTo(X(j3), Yh(Sr.band[j3][0]));
  if (st) { g.closePath(); g.fillStyle = rgba(COL.c2, 0.22); g.fill(); }
  g.beginPath(); Sr.waves.forEach(function (v, j) { j ? g.lineTo(X(j), Yh(v)) : g.moveTo(X(j), Yh(v)); }); g.strokeStyle = rgba(COL.c2, 0.95); g.lineWidth = 1.3; g.stroke();
  g.beginPath(); Sr.gust.forEach(function (v, j) { j ? g.lineTo(X(j), Yu(v)) : g.moveTo(X(j), Yu(v)); }); g.strokeStyle = rgba(COL.ink, 0.28); g.lineWidth = 0.8; g.stroke();
  g.beginPath(); Sr.wind.forEach(function (v, j) { j ? g.lineTo(X(j), Yu(v)) : g.moveTo(X(j), Yu(v)); }); g.strokeStyle = COL.ink; g.lineWidth = 1.5; g.stroke();
  var tv = Sr.tide.filter(function (v) { return v != null; });
  if (tv.length) {
    var lo = Math.min.apply(null, tv), hi = Math.max.apply(null, tv), y0 = bot - tideH;
    g.beginPath(); var st2 = false; Sr.tide.forEach(function (v, j) { if (v == null) return; var y = y0 + tideH - tideH * (v - lo) / Math.max(0.2, hi - lo); st2 ? g.lineTo(X(j), y) : (g.moveTo(X(j), y), st2 = true); });
    g.strokeStyle = COL.ink4; g.lineWidth = 1; g.stroke();
  }
  g.strokeStyle = rgba(COL.ink3, 0.9); g.setLineDash([2, 3]); g.lineWidth = 1; g.beginPath(); g.moveTo(X(A.fc.now), qy - 2); g.lineTo(X(A.fc.now), bot); g.stroke(); g.setLineDash([]);
  g.fillStyle = COL.ink; g.fillRect(Math.round(X(A.hour)) - 1, qy - 4, 2, bot - qy + 6);
  g.font = '500 10px ' + ff;
  var lab = function (txt, y, col) { g.fillStyle = col; g.fillText(txt, W - R + 8, Math.max(top + 6, Math.min(bot, y + 3))); };
  var i0 = A.hour;
  lab(num(Sr.waves[i0], 1) + ' m', Yh(Sr.waves[i0]), COL.c2);
  lab(num(Sr.wind[i0], 0) + ' ' + t('knots'), Yu(Sr.wind[i0]) - (Math.abs(Yu(Sr.wind[i0]) - Yh(Sr.waves[i0])) < 12 ? 12 : 0), COL.ink);
  lab(t('tide').toLowerCase(), bot - 4, COL.ink4);
  var where = Sr.b ? Sr.b.name : t('tlIsland'), sea = A.day.sea[i0];
  var wave = Sr.b ? t('tlShore') + ' ' + metres(Sr.waves[i0]) : t('tlIsland') + ' ' + metres(sea.size || 0);
  var bd = Sr.band[i0];
  $('#sw-tl-line').innerHTML = '<b>' + cap(dayName(dayOf(i0))) + ' · ' + hourLabelOf(i0) + '</b><span>' + wave + (bd ? ' (' + num(bd[0], 1) + '–' + num(bd[1], 1) + ')' : '') + '</span><span>' + t('windH').toLowerCase() + ' ' + num(Sr.wind[i0], 0) + ' ' + t('knots') + '</span>' + (Sr.tide[i0] != null ? '<span>' + t('tide').toLowerCase() + ' ' + (Sr.tide[i0] >= 0 ? '+' : '−') + metres(Math.abs(Sr.tide[i0]), 2) + '</span>' : '');
  $('#sw-tl-scope').textContent = Sr.b ? where : t('tlScopeIsland');
}
function setupTimeline() {
  var cv = $('#sw-tl-chart');
  var hourAt = function (e) { var r = cv.getBoundingClientRect(); return clamp(Math.floor((e.clientX - r.left - 2) / (r.width - 60) * A.fc.N), 0, A.fc.N - 1); };
  cv.addEventListener('pointerdown', function (e) { if (!A.ready) return; TL.drag = true; cv.setPointerCapture(e.pointerId); setHour(hourAt(e)); });
  cv.addEventListener('pointermove', function (e) { if (TL.drag) { var i = hourAt(e); if (i !== A.hour) setHour(i); } });
  cv.addEventListener('pointerup', function () { TL.drag = false; });
  cv.addEventListener('pointercancel', function () { TL.drag = false; });
  $('#sw-tl-prev').onclick = function () { if (A.ready) setHour(Math.max(0, A.hour - 1)); };
  $('#sw-tl-next').onclick = function () { if (A.ready) setHour(Math.min(A.fc.N - 1, A.hour + 1)); };
  $('#sw-tl-now').onclick = function () { if (A.ready) setHour(A.fc.now); };
}

/* ================================================================ the waves: a MapLibre custom layer (WebGL2), frontier's */
var WV = { gl: null, prog: null, buf: null, n: 0, tex: {}, depth: null, slots: [null, null, null], parts: [], clock: 0, last: performance.now(), size: [1, 1], speed: 1, bad: false };
var VS = '#version 300 es\nin vec2 a_merc; in vec2 a_uv;\nuniform mat4 u_matrix;\nout vec2 v_uv;\nvoid main() { v_uv = a_uv; gl_Position = u_matrix * vec4(a_merc, 0.0, 1.0); }';
var FS = ['#version 300 es', 'precision highp float;', 'in vec2 v_uv;', 'uniform sampler2D u_depth, u_w0, u_w1, u_w2;', 'uniform vec2 u_size;', 'uniform vec4 u_p[3];',
  'uniform float u_lines, u_alpha, u_dpr, u_breakOn, u_zoom;', 'uniform vec3 u_ink;', 'out vec4 o;', 'const float GAMMA = ' + S.C.GAMMA.toFixed(2) + ';',
  'vec4 tx(sampler2D t, ivec2 c) { return texelFetch(t, clamp(c, ivec2(0), ivec2(u_size) - 1), 0); }',
  'vec2 depthAt(vec2 f) { ivec2 i = ivec2(floor(f)); vec2 w = fract(f);',
  '  vec4 a = tx(u_depth, i), b = tx(u_depth, i + ivec2(1, 0)), c = tx(u_depth, i + ivec2(0, 1)), d = tx(u_depth, i + ivec2(1, 1));',
  '  vec4 da = vec4(a.r * 65280.0 + a.g * 255.0, b.r * 65280.0 + b.g * 255.0, c.r * 65280.0 + c.g * 255.0, d.r * 65280.0 + d.g * 255.0) / 100.0;',
  '  vec4 sa = vec4(a.b, b.b, c.b, d.b);',
  '  return vec2(mix(mix(da.x, da.y, w.x), mix(da.z, da.w, w.x), w.y), mix(mix(sa.x, sa.y, w.x), mix(sa.z, sa.w, w.x), w.y)); }',
  'vec2 waveAt(sampler2D t, vec2 f, float scale) { ivec2 i = ivec2(floor(f)); vec2 w = fract(f);',
  '  vec4 a = tx(t, i), b = tx(t, i + ivec2(1, 0)), c = tx(t, i + ivec2(0, 1)), d = tx(t, i + ivec2(1, 1));',
  '  vec4 ph = vec4(a.r * 65280.0 + a.g * 255.0, b.r * 65280.0 + b.g * 255.0, c.r * 65280.0 + c.g * 255.0, d.r * 65280.0 + d.g * 255.0) * scale;',
  '  vec4 k = vec4(a.b, b.b, c.b, d.b) * 2.55;',
  '  float m = max(max(ph.x, ph.y), max(ph.z, ph.w)); vec4 ok = step(vec4(0.5), ph) + step(m, 0.5);',
  '  vec4 ww = vec4((1.0 - w.x) * (1.0 - w.y), w.x * (1.0 - w.y), (1.0 - w.x) * w.y, w.x * w.y) * ok;',
  '  return vec2(dot(ph, ww) / max(dot(ww, vec4(1.0)), 1e-6), mix(mix(k.x, k.y, w.x), mix(k.z, k.w, w.x), w.y)); }',
  'void main() {',
  '  vec2 f = vec2(v_uv.x * u_size.x, (1.0 - v_uv.y) * u_size.y) - 0.5;',
  '  vec2 ds = depthAt(f); float dep = ds.x, sea = ds.y;',
  '  vec2 w0 = waveAt(u_w0, f, u_p[0].z), w1 = waveAt(u_w1, f, u_p[1].z), w2 = waveAt(u_w2, f, u_p[2].z);',
  '  float ph0 = w0.x - u_p[0].y, ph1 = w1.x - u_p[1].y, ph2 = w2.x - u_p[2].y;',
  '  float fw0 = fwidth(ph0), fw1 = fwidth(ph1), fw2 = fwidth(ph2);',
  '  float lim = GAMMA * max(dep, 0.05);',
  '  float h0 = w0.y * u_p[0].x * u_p[0].w, h1 = w1.y * u_p[1].x * u_p[1].w, h2 = w2.y * u_p[2].x * u_p[2].w;',
  '  float hlin = sqrt(h0 * h0 + h1 * h1 + h2 * h2); float hs = min(hlin, lim);',
  '  vec4 acc = vec4(0.0); float e2 = max(h0 * h0 + h1 * h1 + h2 * h2, 1e-6);',
  '  float wpx = (0.6 + 0.6 * smoothstep(0.3, 2.5, hs)) * (1.0 + 0.5 * smoothstep(12.0, 15.5, u_zoom));',
  '  float vis = smoothstep(0.03, 0.15, hs) * (0.2 + 0.8 * smoothstep(0.15, 2.4, hs));',
  '  vec3 lc = mix(u_ink * 0.6, u_ink, smoothstep(0.2, 2.0, hs));',
  '  float nearBreak = 1.0 - smoothstep(0.8, 1.0, hlin / lim);',
  '  for (int p = 0; p < 3; p++) {',
  '    float ph = p == 0 ? ph0 : p == 1 ? ph1 : ph2, fw = p == 0 ? fw0 : p == 1 ? fw1 : fw2, hp = p == 0 ? h0 : p == 1 ? h1 : h2;',
  '    float raw = p == 0 ? w0.x : p == 1 ? w1.x : w2.x, off = u_p[p].y;',
  '    if (u_p[p].w < 0.5 || hp < 0.02) continue;',
  '    float sh = hp * hp / e2; float share = p == 0 ? smoothstep(0.28, 0.38, sh) : smoothstep(0.62, 0.72, sh);',
  '    float k = log2(max(1.0, 15.0 * u_dpr * fw)), s0 = exp2(floor(k)), tk = smoothstep(0.0, 1.0, fract(k));',
  '    float fq0 = max(fw / s0, 1e-6), fq1 = max(fw / (2.0 * s0), 1e-6);',
  '    float d0 = abs(fract(ph / s0 + 0.5) - 0.5) / fq0, d1 = abs(fract(ph / (2.0 * s0) + 0.5) - 0.5) / fq1;',
  '    float hw = 0.5 * wpx * u_dpr;',
  '    float line = mix(1.0 - smoothstep(hw - 0.6, hw + 0.6, d0), 1.0 - smoothstep(hw - 0.6, hw + 0.6, d1), tk);',
  '    float grp = cos(6.2831853 * (raw - 0.5 * off) / 6.0); float env = 0.5 + 0.5 * smoothstep(-0.7, 0.9, grp);',
  '    float a = line * share * vis * env * u_lines * smoothstep(0.5, 2.5, dep) * nearBreak;',
  '    acc = vec4(lc * a, a) + acc * (1.0 - a);',
  '  }',
  '  float br = 0.85 * u_breakOn * smoothstep(0.75, 1.0, hlin / lim) * smoothstep(0.12, 0.6, hs) * (1.0 - smoothstep(6.0, 9.0, dep));',
  '  acc = vec4(u_ink * br, br) + acc * (1.0 - br);',
  '  o = acc * clamp(sea * 1.25 - 0.1, 0.0, 1.0) * u_alpha;',
  '}'].join('\n');
function inkVec() { var h = (COL.ink || '#ffffff').replace('#', ''); return [0, 2, 4].map(function (k) { return parseInt(h.slice(k, k + 2), 16) / 255; }); }
function wavesLayer() {
  var I = CFG.island;
  return {
    id: 'swell-waves', type: 'custom', renderingMode: '2d',
    onAdd: function (map, gl) {
      WV.gl = gl;
      var sh = function (type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
      var p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      WV.prog = p;
      var rows = 48, v = [];
      for (var r = 0; r <= rows; r++) {
        var lat = I.lat[0] + (I.lat[1] - I.lat[0]) * r / rows;
        [0, 1].forEach(function (c) { var lon = I.lon[0] + (I.lon[1] - I.lon[0]) * c, m = maplibregl.MercatorCoordinate.fromLngLat([lon, lat]); v.push(m.x, m.y, c, r / rows); });
      }
      WV.buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, WV.buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW); WV.n = (rows + 1) * 2;
      WV.size = [I.texture.nx, I.texture.ny];
      loadTex(I.texture.depth).then(function (t2) { WV.depth = t2; map.triggerRepaint(); }).catch(texFail);
      WV.blank = makeTex(gl, 1, 1, new Uint8Array([0, 0, 0, 255]));
    },
    render: function (gl, args) {
      if (!WV.depth || !A.layers.waves || WV.bad) return;
      var M = (args && args.defaultProjectionData && args.defaultProjectionData.mainMatrix) || (args && args.modelViewProjectionMatrix) || args;
      gl.useProgram(WV.prog);
      gl.uniformMatrix4fv(gl.getUniformLocation(WV.prog, 'u_matrix'), false, M);
      gl.bindBuffer(gl.ARRAY_BUFFER, WV.buf);
      var am = gl.getAttribLocation(WV.prog, 'a_merc'), au = gl.getAttribLocation(WV.prog, 'a_uv');
      gl.enableVertexAttribArray(am); gl.vertexAttribPointer(am, 2, gl.FLOAT, false, 16, 0);
      gl.enableVertexAttribArray(au); gl.vertexAttribPointer(au, 2, gl.FLOAT, false, 16, 8);
      [['u_depth', WV.depth], ['u_w0', WV.slots[0] ? WV.slots[0].tex : WV.blank], ['u_w1', WV.slots[1] ? WV.slots[1].tex : WV.blank], ['u_w2', WV.slots[2] ? WV.slots[2].tex : WV.blank]]
        .forEach(function (x, k) { gl.activeTexture(gl.TEXTURE0 + k); gl.bindTexture(gl.TEXTURE_2D, x[1]); gl.uniform1i(gl.getUniformLocation(WV.prog, x[0]), k); });
      gl.uniform2f(gl.getUniformLocation(WV.prog, 'u_size'), WV.size[0], WV.size[1]);
      var pv = [], speed = waveSpeedup();
      WV.clock += Math.min(0.1, (performance.now() - WV.last) / 1000) * speed; WV.last = performance.now();
      for (var k = 0; k < 3; k++) { var P = WV.parts[k], s = WV.slots[k]; if (!P || !s) { pv.push(0, 0, 1, 0); continue; } pv.push(P.H, (WV.clock / P.Tp) % 12, s.scale, 1); }
      gl.uniform4fv(gl.getUniformLocation(WV.prog, 'u_p'), new Float32Array(pv));
      var z = A.map.getZoom();
      gl.uniform1f(gl.getUniformLocation(WV.prog, 'u_lines'), smooth(9.0, 9.8, z));
      gl.uniform1f(gl.getUniformLocation(WV.prog, 'u_breakOn'), smooth(9.5, 11.0, z));
      gl.uniform1f(gl.getUniformLocation(WV.prog, 'u_alpha'), A.act === 'kite' ? 0.55 : 1.0);
      gl.uniform1f(gl.getUniformLocation(WV.prog, 'u_dpr'), devicePixelRatio);
      gl.uniform1f(gl.getUniformLocation(WV.prog, 'u_zoom'), z);
      var ink = inkVec(); gl.uniform3f(gl.getUniformLocation(WV.prog, 'u_ink'), ink[0], ink[1], ink[2]);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, WV.n);
    },
  };
}
function makeTex(gl, w, h, data) {
  var t2 = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t2);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]].forEach(function (x) { gl.texParameteri(gl.TEXTURE_2D, x[0], x[1]); });
  return t2;
}
function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (x) { return x.toString(16).padStart(2, '0'); }).join(''); }
/* the pinned bytes or nothing: each texture is hashed in the tab against data/PINS.json before the GPU sees it */
function loadTex(file) {
  if (WV.tex[file]) return WV.tex[file];
  var I = CFG.island, local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';
  var url = (local ? I.local : I.base) + file;
  var p = fetch(url).then(function (r) { if (!r.ok) throw new Error(url + ' ' + r.status); return r.arrayBuffer(); }).then(function (buf) {
    var pin = I.pins[file];
    return (crypto.subtle ? crypto.subtle.digest('SHA-256', buf).then(hex) : Promise.resolve(pin)).then(function (h) {
      if (h !== pin) throw new Error('texture ' + file + ' sha256 ' + h + ' is not its pin ' + pin);
      return createImageBitmap(new Blob([buf]), { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
    });
  }).then(function (bmp) {
    var gl = WV.gl, t2 = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t2);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, bmp);
    [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]].forEach(function (x) { gl.texParameteri(gl.TEXTURE_2D, x[0], x[1]); });
    if (bmp.close) bmp.close();
    return t2;
  });
  WV.tex[file] = p; return p;
}
function texFail(e) { console.error(e); WV.bad = true; toastMsg(t('texBad'), 9000); }
function waveSpeedup() {
  var P = WV.parts[0]; if (!P || !A.map) return 1;
  var mpp = 40075016 * Math.cos(A.map.getCenter().lat * Math.PI / 180) / (512 * Math.pow(2, A.map.getZoom()));
  var L = 1.56 * P.Tp * P.Tp, pxPerCrest = L / mpp;
  WV.speed = clamp(16 * P.Tp / Math.max(pxPerCrest, 1e-3), 1, 60);
  return WV.speed;
}
function setWaveHour(i) {
  if (!WV.gl || !A.day || WV.bad) return;
  var s = A.day.sea[i]; if (!s) return;
  var tot = Math.sqrt((s.parts || []).reduce(function (a, P) { return a + P.h * P.h; }, 0)) || 1;
  var parts = (s.parts && s.parts.length ? s.parts : (s.tp ? [{ h: s.size, p: s.tp, d: s.mwd }] : [])).map(function (P) { return { H: P.h * (s.parts && s.parts.length ? s.size / tot : 1), Tp: P.p, dir: P.d }; })
    .sort(function (a, b) { return b.H - a.H; }).slice(0, 3);
  var I = CFG.island, step = I.dirs[1] - I.dirs[0];
  var want = parts.map(function (P) {
    var d = I.dirs[Math.round((((P.dir % 360) + 360) % 360) / step) % I.dirs.length];
    var T = I.periods.reduce(function (a, b) { return Math.abs(b - P.Tp) < Math.abs(a - P.Tp) ? b : a; });
    return I.cases.filter(function (c) { return c.dir === d && c.T === T; })[0];
  });
  Promise.all(want.map(function (c) { return c ? loadTex(c.file) : null; })).then(function (texs) {
    WV.parts = parts;
    WV.slots = want.map(function (c, k) { return c ? { tex: texs[k], scale: c.phiScale, c: c } : null; });
    while (WV.slots.length < 3) WV.slots.push(null);
    A.map.triggerRepaint(); mapNote();
  }).catch(texFail);
}
function animateWaves() {
  var last = 0;
  var tick = function (now) {
    if (!document.hidden && A.map && A.layers.waves && A.map.getZoom() > 9.0 && now - last > 33) { last = now; A.map.triggerRepaint(); }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ================================================================ wind, currents, places */
var WD = { parts: [], cv: null, g: null, last: 0 };
function windSetup() {
  WD.cv = $('#sw-windfx'); WD.g = WD.cv.getContext('2d');
  var tick = function (now) { var dt = Math.min(0.1, (now - (WD.last || now)) / 1000); WD.last = now; if (!document.hidden) windFrame(dt); requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}
function windFrame(dt) {
  var cv = WD.cv, g = WD.g, dpr = devicePixelRatio, map = A.map;
  if (cv.width !== Math.round(innerWidth * dpr) || cv.height !== Math.round(innerHeight * dpr)) { cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr); }
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (!A.layers.wind || !A.ready || A.hour == null || !map) { g.clearRect(0, 0, cv.width, cv.height); return; }
  g.globalCompositeOperation = 'destination-in'; g.fillStyle = 'rgba(0,0,0,0.86)'; g.fillRect(0, 0, cv.width, cv.height);
  g.globalCompositeOperation = 'source-over';
  var w = innerWidth, h = innerHeight, n = Math.round(clamp(w * h / 1700, 320, 1100));
  while (WD.parts.length < n) WD.parts.push({ x: Math.random() * w, y: Math.random() * h, age: Math.random() * 80 });
  WD.parts.length = n;
  var mpp = 40075016 * Math.cos(map.getCenter().lat * Math.PI / 180) / (512 * Math.pow(2, map.getZoom()));
  var vis = clamp(9000 / mpp, 1.5, 55), lead = A.act === 'kite' ? 1 : 0.8, I = CFG.island;
  var c0 = map.unproject([0, 0]), cxu = map.unproject([w, 0]), cyu = map.unproject([0, h]);
  var toLL = function (x, y) { return { lng: c0.lng + (cxu.lng - c0.lng) * x / w + (cyu.lng - c0.lng) * y / h, lat: c0.lat + (cxu.lat - c0.lat) * x / w + (cyu.lat - c0.lat) * y / h }; };
  g.lineCap = 'round';
  WD.parts.forEach(function (p) {
    var ll = toLL(p.x, p.y);
    if (ll.lng < I.lon[0] || ll.lng > I.lon[1] || ll.lat < I.lat[0] || ll.lat > I.lat[1] || p.age > 90) { p.x = Math.random() * w; p.y = Math.random() * h; p.age = 0; return; }
    var wv = S.windAt(A.day, A.hour, ll.lng, ll.lat); if (!wv) return;
    var sp = Math.max(1e-6, Math.hypot(wv.u, wv.v)), boost = Math.max(1, 14 / Math.max(1e-6, sp * vis));
    var nx = p.x + wv.u * vis * boost * dt, ny = p.y - wv.v * vis * boost * dt;
    var a = Math.min(1, p.age / 8) * Math.min(1, (90 - p.age) / 15);
    g.strokeStyle = COL.ink; g.globalAlpha = (0.18 + 0.6 * smooth(2, 10, wv.U)) * a * lead;
    g.lineWidth = (1.1 + 1.0 * smooth(3, 12, wv.U)) * dpr;
    g.beginPath(); g.moveTo(p.x * dpr, p.y * dpr); g.lineTo(nx * dpr, ny * dpr); g.stroke();
    p.x = nx; p.y = ny; p.age++;
  });
  g.globalAlpha = 1;
}
function drawCurrents() {
  var cv = $('#sw-flowfx'), g = cv.getContext('2d'), dpr = devicePixelRatio, map = A.map;
  if (cv.width !== Math.round(innerWidth * dpr) || cv.height !== Math.round(innerHeight * dpr)) { cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr); }
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, innerWidth, innerHeight);
  if (!A.layers.currents || !A.ready || A.hour == null || !map || map.getZoom() < 10.5) return;
  var z = map.getZoom();
  A.beaches.forEach(function (b) {
    var c = b.rows[A.hour].c; if (!c || !c.cur || !(c.cur.V >= 0.05) || !b.probes || !b.probes.length) return;
    var p0 = b.probes[Math.min(1, b.probes.length - 1)], s = map.project([p0.lon, p0.lat]);
    if (s.x < -40 || s.y < -40 || s.x > innerWidth + 40 || s.y > innerHeight + 40) return;
    var L = clamp(14 + 60 * c.cur.V, 14, 70) * clamp((z - 10) / 3, 0.6, 1.4);
    var th = c.cur.toward * Math.PI / 180, ux = Math.sin(th), uy = -Math.cos(th);
    g.strokeStyle = COL.ink2; g.fillStyle = COL.ink2; g.lineWidth = 2.4; g.lineCap = 'round'; g.globalAlpha = clamp(0.4 + c.cur.V, 0.4, 1);
    var x0 = s.x - ux * L / 2, y0 = s.y - uy * L / 2, x1 = s.x + ux * L / 2, y1 = s.y + uy * L / 2;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    g.beginPath(); g.moveTo(x1 + ux * 5, y1 + uy * 5); g.lineTo(x1 - ux * 4 - uy * 5, y1 - uy * 4 + ux * 5); g.lineTo(x1 - ux * 4 + uy * 5, y1 - uy * 4 - ux * 5); g.closePath(); g.fill();
    if (c.rip) { g.lineWidth = 1.5; g.beginPath(); g.arc(s.x, s.y, 11, 0, Math.PI * 2); g.stroke(); }
    g.globalAlpha = 1;
  });
}
var PL = { beachM: [], poiM: [] };
function placesSetup() {
  A.beaches.forEach(function (b) {
    var el = document.createElement('div'); el.className = 'sw-bl'; el.dataset.name = b.name;
    el.innerHTML = '<i class="dot"></i><span class="nm">' + esc(b.name) + '</span><span class="ic"></span>';
    el.addEventListener('click', function (e) { e.stopPropagation(); selectBeach(b.name); });
    PL.beachM.push({ b: b, el: el, m: new maplibregl.Marker({ element: el, anchor: 'left' }).setLngLat([b.lon, b.lat]).addTo(A.map) });
  });
  A.pois.forEach(function (p) {
    var el = document.createElement('div'); el.className = 'sw-poi sw-poi-' + p.cat; el.innerHTML = svgIcon(p.cat, 13);
    el.title = (p.name ? p.name + ' · ' : '') + t('poi_' + p.cat);
    el.addEventListener('click', function (e) { e.stopPropagation(); poiPopup(p); });
    PL.poiM.push({ p: p, el: el, m: new maplibregl.Marker({ element: el }).setLngLat([p.lon, p.lat]).addTo(A.map) });
  });
  var onZoom = function () { var z = A.map.getZoom(); document.body.classList.toggle('z-far', z < 10.8); document.body.classList.toggle('z-near', z >= 12.6); document.body.classList.toggle('pois-off', !A.layers.pois); declutterLabels(); };
  A.map.on('zoom', onZoom); A.map.on('moveend', declutterLabels); onZoom();
}
function declutterLabels() {
  if (!A.map) return;
  var order = PL.beachM.map(function (o) { return { o: o, s: A.hour != null && spotsOf(A.act).indexOf(o.b.kind) >= 0 ? scoreAt(o.b, A.hour).s : -1 }; })
    .sort(function (x, y) { return (y.o.b.name === A.sel) - (x.o.b.name === A.sel) || y.s - x.s; });
  var placed = [];
  order.forEach(function (x) {
    var o = x.o, pt = A.map.project([o.b.lon, o.b.lat]), w = o.el.getBoundingClientRect().width || 90;
    var hit = placed.some(function (r) { return pt.x < r[0] + r[2] + 6 && pt.x + w + 6 > r[0] && Math.abs(pt.y - r[1]) < 20; });
    o.el.classList.toggle('hidden', hit); if (!hit) placed.push([pt.x, pt.y, w]);
  });
}
function paintLabels() {
  PL.beachM.forEach(function (x) {
    var b = x.b, el = x.el, on = spotsOf(A.act).indexOf(b.kind) >= 0 && A.hour != null;
    var r = on ? scoreAt(b, A.hour) : null;
    el.dataset.v = r ? r.v : 'none'; el.dataset.d = r && r.d ? r.d : ''; el.dataset.r = r && r.v === 'refused' ? '1' : '';
    el.classList.toggle('off', !on); el.classList.toggle('sel', b.name === A.sel);
    var ic = el.querySelector('.ic');
    if (ic && A.hour != null) { var list = actsAt(b, A.hour).slice(0, 4), key = list.map(function (o) { return o.act + o.cls; }).join('|'); if (ic.dataset.key !== key) { ic.dataset.key = key; ic.innerHTML = miniIcons(list, 11); } }
  });
  declutterLabels();
}
function poiPopup(p) {
  if (PL.popup) PL.popup.remove();
  PL.popup = new maplibregl.Popup({ closeButton: true, offset: 12, className: 'sw-pop' }).setLngLat([p.lon, p.lat])
    .setHTML('<b>' + esc(p.name || t('poi_' + p.cat)) + '</b><span>' + esc(t('poi_' + p.cat)) + '</span><a href="https://www.google.com/maps/dir/?api=1&destination=' + p.lat + ',' + p.lon + '" target="_blank" rel="noopener">' + t('route') + '</a>').addTo(A.map);
}
/* the basemap, from the tokens: the island and its coast in grays (frontier's style, house values) */
function mapStyle() {
  var cs = getComputedStyle(document.documentElement), v = function (k) { return cs.getPropertyValue(k).trim(); };
  var src = 'pm', local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  var turl = local ? new URL(CFG.tiles.local, location.href).href : CFG.tiles.url;
  return { version: 8, name: 'swell', sources: { pm: { type: 'vector', url: 'pmtiles://' + turl, attribution: CFG.tiles.attribution } },
    layers: [
      { id: 'sea', type: 'background', paint: { 'background-color': v('--paper') } },
      { id: 'earth', type: 'fill', source: src, 'source-layer': 'earth', filter: ['==', '$type', 'Polygon'], paint: { 'fill-color': v('--surface') } },
      { id: 'green', type: 'fill', source: src, 'source-layer': 'landuse', filter: ['in', 'kind', 'national_park', 'park', 'protected_area', 'nature_reserve', 'forest', 'wood', 'scrub', 'grassland', 'grass', 'golf_course'], paint: { 'fill-color': v('--surface2'), 'fill-opacity': 0.6 } },
      { id: 'beach', type: 'fill', source: src, 'source-layer': 'landuse', filter: ['in', 'kind', 'beach', 'sand'], paint: { 'fill-color': v('--rule') } },
      { id: 'urban', type: 'fill', source: src, 'source-layer': 'landuse', filter: ['in', 'kind', 'residential', 'commercial', 'industrial', 'retail'], paint: { 'fill-color': v('--sunk') } },
      { id: 'water', type: 'fill', source: src, 'source-layer': 'water', filter: ['all', ['==', '$type', 'Polygon'], ['!in', 'kind', 'ocean', 'sea', 'bay', 'strait']], paint: { 'fill-color': v('--paper') } },
      { id: 'river', type: 'line', source: src, 'source-layer': 'water', minzoom: 12, filter: ['in', 'kind', 'river', 'stream', 'canal'], paint: { 'line-color': v('--rule'), 'line-width': 0.6 } },
      { id: 'roads-minor', type: 'line', source: src, 'source-layer': 'roads', minzoom: 13, filter: ['in', 'kind', 'minor_road', 'other'], paint: { 'line-color': v('--rule-soft'), 'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 13, 0.4, 18, 5] } },
      { id: 'roads-major', type: 'line', source: src, 'source-layer': 'roads', minzoom: 9, filter: ['in', 'kind', 'major_road', 'highway'], paint: { 'line-color': v('--rule'), 'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 9, 0.5, 18, 9] } },
      { id: 'buildings', type: 'fill', source: src, 'source-layer': 'buildings', minzoom: 15, paint: { 'fill-color': v('--surface2'), 'fill-opacity': 0.7 } },
      { id: 'coast', type: 'line', source: src, 'source-layer': 'earth', filter: ['==', '$type', 'Polygon'], paint: { 'line-color': v('--ink-4'), 'line-width': ['interpolate', ['linear'], ['zoom'], 9, 0.5, 15, 1.0] } },
    ] };
}

/* ================================================================ the re-check: the day re-derived in this tab */
function recheck() {
  var t0 = performance.now();
  var lines = S.canon(A.all, A.day), txt = lines.join('\n');
  if (!crypto.subtle) { A.check = { equal: false, why: 'crypto.subtle unavailable (http?)', lines: lines.length }; return Promise.resolve(); }
  var mods = Object.keys(MODS.pins).map(function (k) { return crypto.subtle.digest('SHA-256', new TextEncoder().encode(MODS.src[k])).then(function (h) { return [k, hex(h)]; }); });
  return Promise.all([crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt)).then(hex)].concat(mods)).then(function (res) {
    var dg = res[0], bad = [];
    res.slice(1).forEach(function (x) { var d = A.day.modules[x[0]]; if (!d || d.sha !== x[1]) bad.push(x[0] + ' differs from the day\'s pin'); });
    if (dg !== A.day.digest) bad.push('digest ' + dg.slice(0, 12) + ' ≠ ' + A.day.digest.slice(0, 12));
    A.check = { equal: !bad.length, why: bad.join('; '), lines: lines.length, ms: Math.round(performance.now() - t0 + A.computeMs), digest: dg };
    window.__swell = { check: A.check };
  });
}

/* ================================================================ boot */
function boot() {
  colors();
  try { var a0 = localStorage.getItem('swell.act'); if (a0 && S.RULES[a0]) A.act = a0; } catch (e) {}
  var ha = (location.hash.match(/atividade=(\w+)/) || [])[1]; if (ha && S.RULES[ha]) A.act = ha;
  $('#sw-answer').textContent = t('loading');
  applyStrings();
  var I = CFG.island;
  if (window.pmtiles && !window.__pmp) { window.__pmp = new pmtiles.Protocol(); maplibregl.addProtocol('pmtiles', window.__pmp.tile); }
  A.map = new maplibregl.Map({ container: 'map', style: mapStyle(), bounds: VIEW, fitBoundsOptions: { padding: 30 },
    maxBounds: [[I.lon[0] - 0.15, I.lat[0] - 0.1], [I.lon[1] + 0.15, I.lat[1] + 0.1]], minZoom: 8.5, maxZoom: 17.5,
    dragRotate: false, pitchWithRotate: false, touchPitch: false, maxPitch: 0, attributionControl: false, fadeDuration: 0 });
  A.map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: CFG.credit }), 'bottom-left');
  A.map.touchZoomRotate.disableRotation(); A.map.keyboard.disableRotation();
  A.map.on('load', function () {
    try { A.map.addLayer(wavesLayer(), 'earth'); } catch (e) { console.error('waves layer:', e); toastMsg(String(e.message || e)); }
    if (A.hour != null) setWaveHour(A.hour);
  });
  A.map.on('move', drawCurrents);
  A.map.on('moveend', function () { drawCurrents(); declutterLabels(); mapNote(); });
  A.map.on('click', function () { if (PL.popup) PL.popup.remove(); });
  document.querySelectorAll('.sw-lang button').forEach(function (b) { b.onclick = function () { setLang(b.dataset.lang); applyStrings(); renderAll(); }; });
  var sheets = ['how', 'sos', 'board'];
  sheets.forEach(function (k) { var btn = $(k === 'board' ? '#sw-boardb' : '#sw-' + k); btn.onclick = function () { var el = $('#sw-sheet-' + k), was = el.hidden; sheets.forEach(function (o) { $('#sw-sheet-' + o).hidden = true; }); el.hidden = !was; }; });
  document.querySelectorAll('.sw-tab').forEach(function (b) { b.onclick = function () { setTab(b.dataset.tab); }; });
  document.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { b.closest('.sw-sheet').hidden = true; }; });
  $('#sw-hour').oninput = function (e) { var i = A.dayRef.idx[+e.target.value]; if (i != null) setHour(i); };
  $('#sw-now').onclick = function () { setHour(A.fc.now); };
  addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || !A.ready) return;
    if (e.key === 'Escape') { document.querySelectorAll('.sw-sheet').forEach(function (s) { s.hidden = true; }); if (A.sel) closeCard(); }
    if (e.key === 'ArrowRight' && A.hour < A.fc.N - 1) setHour(A.hour + 1);
    if (e.key === 'ArrowLeft' && A.hour > 0) setHour(A.hour - 1);
    if (e.key === '1') setTab('beaches'); if (e.key === '2') setTab('week'); if (e.key === '3') setTab('map');
  });
  setupSheet(); setMapPadding(); setupTimeline(); moveTabLine();
  A.map.once('load', function () { if (!/praia=/.test(location.hash)) fitIsland(); });
  UI.phone.addEventListener('change', function () { setSheet('peek'); setMapPadding(); fitIsland(); });
  addEventListener('resize', function () { moveTabLine(); if (A.ready) { drawDayStrip(); drawTimeline(); if (A.sel) renderCard(); else drawSparks(); } });
  windSetup(); animateWaves();
  loadDay().then(function (day) {
    if (day.v !== 'swell-day-1') throw new Error('not a Swell day: ' + day.v);
    A.day = day;
    var t0 = performance.now();
    A.all = S.computeAll(A.B, day);
    A.computeMs = performance.now() - t0;
    A.beaches = A.B.beaches.map(function (b, k) { return Object.assign({}, b, { k: k, rows: A.all.beaches[k].rows, lifeguard: nearestPoi(b, 'lifeguard') }); });
    A.fc = makeClock(day, A.all);
    $('#sw-run').textContent = t('runChip', { d: day.run.slice(6, 8) + '/' + day.run.slice(4, 6) });
    var today = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10).replace(/-/g, '');
    if (day.run.slice(0, 8) < today) toastMsg(t('stale', { run: day.run.slice(6, 8) + '/' + day.run.slice(4, 6) }), 9000);
    return recheck();
  }).then(function () {
    A.ready = true; renderBoard();
    placesSetup();
    var d0 = A.fc.days[0];
    A.dayRef = daylightLeft(d0) && d0.idx.some(function (i) { return A.fc.daylight[i] && i >= A.fc.now && +A.fc.time[i].slice(11, 13) < 16; }) ? d0 : (A.fc.days[1] || d0);
    chooseDay(A.dayRef);
    var want = (location.hash.match(/praia=([\w-]+)/) || [])[1], wb = want && A.beaches.filter(function (b) { return slug(b.name) === want; })[0];
    if (wb) selectBeach(wb.name);
    $('#sw-intro').classList.add('gone');
  }).catch(function (e) {
    console.error(e); $('#sw-answer').textContent = t('fcFail'); $('#sw-intro-sub').textContent = t('fcFail');
    setTimeout(function () { $('#sw-intro').classList.add('gone'); }, 1500);
  });
}
function nearestPoi(b, cat) {
  var best = null, bd = 1e12;
  A.pois.forEach(function (p) { if (p.cat !== cat) return; var d = Math.hypot((p.lat - b.lat) * 110574, (p.lon - b.lon) * 98636); if (d < bd) { bd = d; best = p; } });
  return best ? Object.assign({}, best, { d: bd }) : null;
}
boot();
})();
