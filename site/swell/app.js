/* client.js — Swell: the sea of Florianópolis, beach by beach. The page.
   apps/swell/app · cert-machine

   ONE CLOCK, ONE SEA. The reader chooses a day and an hour; everything on the page — the map's crests and wind, every
   beach's waves and wind, the card, the week — is the sea at THAT step. Nothing else moves the clock: the activities
   are LEGENDS, never filters. Each beach carries six small icons, one per activity, whose state says what that sea means
   for it (bom · dá pra ir · fraco · ▲ perigo decidido · atenção: a faixa cruza o limite · aviso de previsão); hovering
   an icon tells why, tapping it opens the beach at that activity. Picking an activity above the list only HIGHLIGHTS
   the beaches good for it and says where its best window is — the reader moves the clock there, or not.
   (Operator, 2026-10-08: "the activities must be only icons that communicate the conditions to that activity, like
   legends … do not change the wind and waves, it seems like another timestamp".)

   WHAT IS STORED: the highlighted activity, the language and the saved beaches stay in this browser's localStorage; the
   URL carries the beach, the highlight and the step. Nothing goes anywhere.

   Every number is computed HERE by apps/swell/model/surf.js — the bytes the day's build ran, sha256 pinned in the day —
   and the tab re-derives the day's digest over every height and decided letter ("conferido").              MIT */
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
var ACTS = S.ACT_ORDER;
var clamp = function (x, a, b) { return Math.min(b, Math.max(a, x)); };
var smooth = function (a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/* ================================================================ colours: read from the tokens, never written here */
var COL = {};
function colors() {
  var cs = getComputedStyle(document.documentElement), g = function (k) { return cs.getPropertyValue(k).trim(); };
  COL = { ink: g('--ink'), ink2: g('--ink-2'), ink3: g('--ink-3'), ink4: g('--ink-4'), ink5: g('--ink-5'), paper: g('--paper'), rule: g('--rule'),
    ruleS: g('--rule-strong'), c2: g('--c-2'), band: g('--band-fill'), refu: g('--v-refu'), refd: g('--v-refd'), mark: g('--mark'), sunk: g('--sunk') };
}
function rgba(hex, a) { var h = hex.replace('#', ''); if (h.length !== 6) return hex; return 'rgba(' + [0, 2, 4].map(function (k) { return parseInt(h.slice(k, k + 2), 16); }).join(',') + ',' + a + ')'; }

/* ================================================================ words: Portuguese first, English matched to it */
var STR = {
  pt: {
    how: 'Como sabemos', board: 'Placar', sos: 'Emergência', close: 'Fechar',
    today: 'hoje', tomorrow: 'amanhã', now: 'agora', wd: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'], WD: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
    mon: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'], hourFmt: '{h}h',
    loading: 'Buscando o dia do Swell…', fcFail: 'Não deu para buscar o dia agora. Tente de novo em alguns minutos.',
    stale: 'Previsão da rodada de {run} — a de hoje ainda não foi publicada.', night: 'noite',
    act_surf: 'Surfe', act_kite: 'Kite', act_sup: 'SUP', act_swim: 'Banho', act_fish: 'Pesca', act_boat: 'Barco',
    actLong_surf: 'surfe', actLong_kite: 'kite, windsurfe e wing', actLong_sup: 'SUP, caiaque e canoa', actLong_swim: 'banho de mar', actLong_fish: 'pesca de praia e costão', actLong_boat: 'sair de barco',
    seaLine: 'Mar aberto <b>{hs}</b> de {dir}, {tp} s · vento <b>{kn} nós</b> <span class="nw">de {wdir} {arr}</span>',
    seaNone: 'Mar aberto: sem previsão neste horário',
    st_good: 'bom', st_fair: 'dá pra ir', st_poor: 'fraco', st_V: 'perigo, decidido', st_I: 'atenção: a faixa cruza o limite', st_W: 'aviso de previsão', st_off: 'fora do modelo',
    sh_good: 'bom', sh_fair: 'dá pra ir', sh_poor: 'fraco', sh_V: 'perigo', sh_I: 'atenção', sh_W: 'aviso', sh_off: 'fora do modelo',
    capActs: 'Praias boas agora, por atividade', seaSub: 'faixa medida do mar aberto: {lo}–{hi} m (satélites, 9 em 10)',
    legendH: 'Os ícones', legendNote: 'cada ícone é uma atividade; a forma diz como está o mar para ela neste horário',
    nGood: '{n} bom', nGoodN: '{n} bons', noneGood: 'nenhum',
    focusNow: '<b>{act}</b> {when}: {list}.', focusNone: '<b>{act}</b> {when}: nenhuma praia boa neste horário.', goodAt: 'bom em {x}', fairAt: 'dá pra ir em {x}', andN: ' e mais {n}',
    focusBest: 'Melhor janela do dia: <b>{beach}</b>, {win}.', focusBestNone: 'Nada bom para {act} neste dia.', goThere: 'ir para {h}',
    focusDanger: '▲ perigo decidido em {n} {praias}.', praia1: 'praia', praiaN: 'praias',
    win1: 'às {a}', win2: 'das {a} às {b}', allDay: 'o dia todo',
    wc_offshore: 'terral', 'wc_side-offshore': 'terral cruzado', 'wc_cross-shore': 'lateral', 'wc_side-onshore': 'maral cruzado', wc_onshore: 'maral',
    calm: 'quase sem vento', s_light: 'fraco', s_mod: 'moderado', s_strong: 'forte',
    dirs: ['norte', 'nor-nordeste', 'nordeste', 'leste-nordeste', 'leste', 'leste-sudeste', 'sudeste', 'sul-sudeste', 'sul', 'sul-sudoeste', 'sudoeste', 'oeste-sudoeste', 'oeste', 'oeste-noroeste', 'noroeste', 'nor-noroeste'],
    dirsShort: ['N', 'NNE', 'NE', 'ENE', 'L', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'],
    from: 'de', knots: 'nós', gusts: 'rajadas', current: 'corrente', calmWater: 'sem correnteza', waves: 'ondas', sea: 'mar', wind: 'vento',
    breakH: 'Ondas na beira', swellOff: 'Mar aberto', windH: 'Vento', currentH: 'Corrente', tide: 'Maré', water: 'Água', air: 'Ar', rain: 'chuva',
    safety: 'Segurança', nearestGuard: 'Guarda-vidas mais próximo', noGuard: 'nenhum posto marcado no mapa a menos de 2 km.',
    ripWarn: 'Ondas de mais de 0,9 m chegando de frente: correntes de retorno são prováveis (regra prática, não decidida). Nade perto de um posto, longe das faixas de água escura e calma entre as ondas.',
    offWarn: 'Vento terral (previsão): empurra para o mar. Perigoso para kite, SUP e boias.',
    longshore: '{v} m/s para o {dir}', week: 'Os próximos dias', onMap: 'Ver no mapa', back: 'Todas as praias',
    yourBeaches: 'Suas praias', save: 'Salvar', saved: 'Salva', share: 'Compartilhar', copied: 'Copiado: cole no WhatsApp.',
    cbmsc: 'Na temporada (novembro a março) o CBMSC mantém cerca de 70 postos de guarda-vidas na ilha. Os postos abertos e a bandeira do dia estão no app oficial CBMSC Cidadão.',
    whyGet: 'Recebe {p}% da ondulação de {dir}', whyAnd: 'e {p}% da de {dir}', whyGrow: 'Recebe toda a ondulação de {dir}, que ainda cresce no raso', whyAndGrow: 'e toda a de {dir}',
    whySheltered: 'Abrigada desta ondulação: chega só {p}%.', whyChop: 'Na baía, conta o vento: {h} de marola com {kmh} km/h (previsão do vento).',
    lagoonWhy: 'Água plana da lagoa: o que conta é o vento. Nada aqui é decidido — a marola vem só da previsão do vento.',
    tab_beaches: 'Praias', tab_week: 'Semana', tab_map: 'Mapa', conditions: 'Condições', actsH: 'As atividades', actsHint: 'toque numa atividade para ver a regra e o que está decidido',
    bandLine: 'faixa medida <b>{lo}–{hi}</b>', bandWhat: 'o mar aberto com o erro medido por satélite, levado até a praia pelo modelo da ilha', bandNone: 'sem faixa medida neste horário: nada é decidido aqui',
    capped: 'no limite do modelo: o mar quebra antes da sonda mais funda ({h} m) — pode ser maior',
    extT: 'ondulação de {T} s, mais longa que os casos do modelo (até 15 s): lida como 15 s',
    flatSea: 'sem as partições do mar (NOAA) neste horário: o mar entra como uma ondulação só (ECMWF)',
    decV: '<b>{word}</b>: mesmo a borda baixa da faixa ({lo}) passa de {lim} — decidido.',
    decI: 'a faixa ({lo}–{hi}) cruza o limite de {lim}: vira {word} se a borda baixa subir {up}; fica abaixo se a borda alta descer {gap}.',
    decL: 'abaixo do limite de {lim} em toda a faixa ({lo}–{hi}) — decidido. Não quer dizer seguro.',
    decS: 'sem faixa medida: o limite de {lim} não é decidido.',
    na: 'não se aplica aqui', notHere: '—',
    refusedEdge: 'Fora do modelo: a borda do modelo da ilha passa a {km} desta praia, e ali a onda que entra pela borda ainda não dobrou no fundo. Swell não calcula a altura aqui.',
    refusedNo: 'Fora do modelo: sem sondas na zona de arrebentação.',
    cert: 'Certificado', certDl: 'Baixar certificado .json', rechk: 'Conferido no seu navegador: {n} linhas, as mesmas alturas e decisões publicadas ({ms} ms).', rechkBad: 'ATENÇÃO: o seu navegador NÃO reproduziu o dia publicado ({why}).',
    tlIsland: 'mar aberto', tlShore: 'na beira', tlScopeIsland: 'o mar aberto · abra uma praia para ver a dela',
    lg_waves: 'ondas: na beira da praia (ou o mar aberto)', lg_band: 'faixa medida', lg_wind: 'vento em nós (previsão); a linha fina são as rajadas', lg_tide: 'maré (Copernicus)',
    gridH: 'Quando cada atividade está boa', gridIsland: 'na melhor praia de cada horário; noite em branco · toque num horário para ir até ele', gridBeach: 'em {beach}; noite em branco · toque num horário para ir até ele',
    layers: 'Camadas', L_waves: 'Ondas', L_wind: 'Vento', L_currents: 'Correntes', L_pois: 'Serviços',
    legend_waves: 'cada linha é uma crista; mais clara e mais grossa, mais alta a onda (m)', legend_wind: 'traços que correm com o vento; mais longos e claros, mais forte (km/h)', legend_currents: 'corrente ao longo da praia; mais longa, mais rápida (m/s); um anel = risco de retorno',
    mapNoteFast: 'As cristas se movem {x}× mais rápido que o real neste zoom, para o movimento ser visível; aproximando, voltam ao período de verdade.', mapNoteReal: 'Neste zoom as cristas se movem no período real.',
    sosTitle: 'Em caso de emergência', sosNote: 'Ligações gratuitas, de qualquer telefone.',
    n193: 'Bombeiros e guarda-vidas', n190: 'Polícia Militar', n192: 'SAMU (ambulância)', n185: 'Marinha — salvamento no mar', n199: 'Defesa Civil',
    poi_lifeguard: 'Posto de guarda-vidas', poi_police: 'Polícia', poi_fire: 'Bombeiros', poi_health: 'Saúde', poi_navy: 'Marinha — Capitania dos Portos', poi_ramp: 'Rampa de barcos', poi_marina: 'Marina',
    route: 'Como chegar', region_norte: 'Norte', region_leste: 'Leste', region_sul: 'Sul', 'region_baía norte': 'Baía Norte', 'region_baía sul': 'Baía Sul', region_continente: 'Continente',
    kind_ocean: 'mar aberto', kind_bay: 'baía', kind_lagoon: 'lagoa', kind_island: 'ilha',
    runChip: 'rodada {d} 00 UTC', introSub: 'Lendo o mar aberto (ECMWF e NOAA), a faixa medida por satélite e calculando as 34 praias…',
    texBad: 'Uma textura do modelo da ilha não bateu com o sha256 fixado: as ondas do mapa não são desenhadas.',
    fromSpace: 'Do espaço', foamRow: 'espuma em {p}% da zona de arrebentação (mediana de {n} passagens sem nuvens do Sentinel-2, {from}–{to}){rank}', foamRank: ' · a {k}ª de {of} praias de mar aberto que mais quebra', measured: 'medido',
    island: 'só de barco', clear: 'limpar',
  },
  en: {
    how: 'How we know', board: 'Scoreboard', sos: 'Emergency', close: 'Close',
    today: 'today', tomorrow: 'tomorrow', now: 'now', wd: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], WD: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    mon: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], hourFmt: '{h}:00',
    loading: 'Getting Swell\'s day…', fcFail: 'The day could not be fetched right now. Try again in a few minutes.',
    stale: 'Forecast from the {run} run — today\'s is not published yet.', night: 'night',
    act_surf: 'Surf', act_kite: 'Kite', act_sup: 'SUP', act_swim: 'Swim', act_fish: 'Fish', act_boat: 'Boat',
    actLong_surf: 'surfing', actLong_kite: 'kite, windsurf and wing', actLong_sup: 'SUP, kayak and canoe', actLong_swim: 'swimming', actLong_fish: 'shore and rock fishing', actLong_boat: 'going out by boat',
    seaLine: 'Open sea <b>{hs}</b> from the {dir}, {tp} s · wind <b>{kn} kn</b> <span class="nw">from the {wdir} {arr}</span>',
    seaNone: 'Open sea: no forecast at this hour',
    st_good: 'good', st_fair: 'doable', st_poor: 'poor', st_V: 'danger, decided', st_I: 'caution: the band straddles the limit', st_W: 'forecast warning', st_off: 'outside the model',
    sh_good: 'good', sh_fair: 'doable', sh_poor: 'poor', sh_V: 'danger', sh_I: 'caution', sh_W: 'warning', sh_off: 'outside the model',
    capActs: 'Beaches good now, by activity', seaSub: 'the open sea\'s measured band: {lo}–{hi} m (satellites, 9 in 10)',
    legendH: 'The icons', legendNote: 'each icon is an activity; its shape says what the sea means for it at this hour',
    nGood: '{n} good', nGoodN: '{n} good', noneGood: 'none',
    focusNow: '<b>{act}</b> {when}: {list}.', focusNone: '<b>{act}</b> {when}: no beach is good at this hour.', goodAt: 'good at {x}', fairAt: 'doable at {x}', andN: ' and {n} more',
    focusBest: 'Best window of the day: <b>{beach}</b>, {win}.', focusBestNone: 'Nothing good for {act} that day.', goThere: 'go to {h}',
    focusDanger: '▲ decided danger at {n} {praias}.', praia1: 'beach', praiaN: 'beaches',
    win1: 'at {a}', win2: 'from {a} to {b}', allDay: 'all day',
    wc_offshore: 'offshore', 'wc_side-offshore': 'side-offshore', 'wc_cross-shore': 'cross-shore', 'wc_side-onshore': 'side-onshore', wc_onshore: 'onshore',
    calm: 'barely any wind', s_light: 'light', s_mod: 'moderate', s_strong: 'strong',
    dirs: ['north', 'north-northeast', 'northeast', 'east-northeast', 'east', 'east-southeast', 'southeast', 'south-southeast', 'south', 'south-southwest', 'southwest', 'west-southwest', 'west', 'west-northwest', 'northwest', 'north-northwest'],
    dirsShort: ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'],
    from: 'from', knots: 'kn', gusts: 'gusts', current: 'current', calmWater: 'no current', waves: 'waves', sea: 'sea', wind: 'wind',
    breakH: 'Waves at the shore', swellOff: 'Open sea', windH: 'Wind', currentH: 'Current', tide: 'Tide', water: 'Water', air: 'Air', rain: 'rain',
    safety: 'Safety', nearestGuard: 'Nearest lifeguard', noGuard: 'no post marked on the map within 2 km.',
    ripWarn: 'Waves over 0.9 m arriving square to the beach: rip currents are likely (a rule of thumb, not decided). Swim near a post, away from dark, calm gaps between the waves.',
    offWarn: 'Offshore wind (forecast): it pushes you out to sea. Dangerous for kites, boards and floats.',
    longshore: '{v} m/s toward the {dir}', week: 'The days ahead', onMap: 'Show on the map', back: 'All beaches',
    yourBeaches: 'Your beaches', save: 'Save', saved: 'Saved', share: 'Share', copied: 'Copied: paste it in WhatsApp.',
    cbmsc: 'In season (November to March) the fire brigade (CBMSC) keeps about 70 lifeguard posts on the island. The open posts and the day\'s flag are in the official CBMSC Cidadão app.',
    whyGet: 'Gets {p}% of the {dir} swell', whyAnd: 'and {p}% of the {dir}', whyGrow: 'Gets all of the {dir} swell, which still grows in the shallows', whyAndGrow: 'and all of the {dir}',
    whySheltered: 'Sheltered from this swell: only {p}% gets in.', whyChop: 'In the bay the wind counts: {h} of chop with {kmh} km/h (a wind forecast).',
    lagoonWhy: 'Flat lagoon water: the wind is what counts. Nothing here is decided — the chop comes from the wind forecast alone.',
    tab_beaches: 'Beaches', tab_week: 'Week', tab_map: 'Map', conditions: 'Conditions', actsH: 'The activities', actsHint: 'tap an activity to see its rule and what is decided',
    bandLine: 'measured band <b>{lo}–{hi}</b>', bandWhat: 'the open sea with its satellite-measured error, carried to the beach by the island model', bandNone: 'no measured band at this hour: nothing is decided here',
    capped: 'at the model\'s limit: the sea breaks before the deepest probe ({h} m) — it may be bigger',
    extT: 'a {T} s swell, longer than the model\'s cases (up to 15 s): read as 15 s',
    flatSea: 'no sea partitions (NOAA) at this hour: the sea enters as one swell (ECMWF)',
    decV: '<b>{word}</b>: even the band\'s low edge ({lo}) is over {lim} — decided.',
    decI: 'the band ({lo}–{hi}) straddles the {lim} limit: it turns {word} if the low edge rises {up}; it falls under if the high edge drops {gap}.',
    decL: 'under the {lim} limit over the whole band ({lo}–{hi}) — decided. It does not mean safe.',
    decS: 'no measured band: the {lim} limit is not decided.',
    na: 'not here', notHere: '—',
    refusedEdge: 'Outside the model: the island model\'s edge passes {km} from this beach, and there the wave entering through the edge has not yet bent over the seafloor. Swell does not compute the height here.',
    refusedNo: 'Outside the model: no probes in the surf zone.',
    cert: 'Certificate', certDl: 'Download certificate .json', rechk: 'Re-checked in your browser: {n} lines, the same heights and decisions as published ({ms} ms).', rechkBad: 'WARNING: your browser did NOT reproduce the published day ({why}).',
    tlIsland: 'open sea', tlShore: 'at the shore', tlScopeIsland: 'the open sea · open a beach to see its own',
    lg_waves: 'waves: at the shore (or the open sea)', lg_band: 'measured band', lg_wind: 'wind in knots (forecast); the thin line is the gusts', lg_tide: 'tide (Copernicus)',
    gridH: 'When each activity is good', gridIsland: 'at the best beach for each hour; night left blank · tap an hour to go there', gridBeach: 'at {beach}; night left blank · tap an hour to go there',
    layers: 'Layers', L_waves: 'Waves', L_wind: 'Wind', L_currents: 'Currents', L_pois: 'Services',
    legend_waves: 'each line is a crest; lighter and heavier, the higher the wave (m)', legend_wind: 'streaks running with the wind; longer and lighter, the stronger (km/h)', legend_currents: 'longshore current; longer, faster (m/s); a ring = rip risk',
    mapNoteFast: 'At this zoom the crests move {x}× faster than real time so the motion can be seen; zoom in and they return to the true period.', mapNoteReal: 'At this zoom the crests move at the real period.',
    sosTitle: 'In an emergency', sosNote: 'Free calls from any phone.',
    n193: 'Fire brigade and lifeguards', n190: 'Military Police', n192: 'SAMU (ambulance)', n185: 'Navy — rescue at sea', n199: 'Civil Defence',
    poi_lifeguard: 'Lifeguard post', poi_police: 'Police', poi_fire: 'Fire brigade', poi_health: 'Health', poi_navy: 'Navy — Harbour Master', poi_ramp: 'Boat ramp', poi_marina: 'Marina',
    route: 'Directions', region_norte: 'North', region_leste: 'East', region_sul: 'South', 'region_baía norte': 'North bay', 'region_baía sul': 'South bay', region_continente: 'Mainland',
    kind_ocean: 'open sea', kind_bay: 'bay', kind_lagoon: 'lagoon', kind_island: 'island',
    runChip: 'run {d} 00 UTC', introSub: 'Reading the open sea (ECMWF and NOAA), the satellite-measured band, and computing the 34 beaches…',
    texBad: 'An island-model texture did not match its pinned sha256: the map\'s waves are not drawn.',
    fromSpace: 'From space', foamRow: 'foam over {p}% of the surf zone (median of {n} cloud-free Sentinel-2 passes, {from}–{to}){rank}', foamRank: ' · {k} of {of} open-sea beaches by how much it breaks', measured: 'measured',
    island: 'by boat only', clear: 'clear',
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
  arrow: '<path d="M12 20V5M6 11l6-6 6 6" stroke-width="2"/>',
  star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z"/>',
  share: '<path d="M8 12l8-5M8 12l8 5"/><circle cx="6" cy="12" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="18" cy="18" r="2.4"/>',
  pin: '<path d="M12 21s-6-5.6-6-10.5a6 6 0 0 1 12 0C18 15.4 12 21 12 21z"/><circle cx="12" cy="10.5" r="2.2"/>',
  dl: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
};
function svgIcon(name, size) { size = size || 16; return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON[name] || '') + '</svg>'; }
/* an arrow pointing where the wind blows / the waves travel (FROM + 180) */
function arrow(fromDeg, size) { return '<i class="sw-arr" style="--r:' + Math.round((fromDeg + 180) % 360) + 'deg">' + svgIcon('arrow', size || 12) + '</i>'; }

/* ================================================================ state */
var A = { B: CFG.beaches, day: null, all: null, fc: null, beaches: [], pois: CFG.pois.pois, focus: null, sel: null, open: null, dayRef: null, hour: null,
  layers: { waves: true, wind: true, currents: true, pois: true }, ready: false, map: null, check: null };
var UI = { phone: matchMedia('(max-width: 899px)'), sheet: 'peek', timer: 0, toast: 0, tab: 'beaches' };
var FAV = new Set((function () { try { return JSON.parse(localStorage.getItem('swell.favs') || '[]'); } catch (e) { return []; } })());
function toggleFav(name) { FAV.has(name) ? FAV.delete(name) : FAV.add(name); try { localStorage.setItem('swell.favs', JSON.stringify(Array.from(FAV))); } catch (e) {} }
var REGIONS = ['norte', 'leste', 'sul', 'continente', 'baía norte', 'baía sul'];

/* ================================================================ the day */
function loadDay() {
  var local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';
  /* raw.githubusercontent keeps a copy at its edge for five minutes, keyed by the full URL: an hourly stamp in the query
     makes a new day visible within the hour it is published, without defeating the cache for every reader */
  var stamp = new Date().toISOString().slice(0, 13).replace(/[^0-9]/g, '');
  var urls = (local ? CFG.data.today.slice().reverse() : CFG.data.today).map(function (u) { return /^https:/.test(u) ? u + '?h=' + stamp : u; });
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
  var first = days.findIndex(function (d) { return d.idx.indexOf(now) >= 0; });
  days = days.slice(Math.max(0, first), Math.max(0, first) + 7);
  return { N: N, time: time, days: days, daylight: all.daylight, now: now, utc: day.steps.map(function (s) { return s.t; }) };
}
function localHour(i) { return +A.fc.time[i].slice(11, 13); }
function hourLabelOf(i) { var h = localHour(i); return t('hourFmt', { h: LANG.cur === 'pt' ? String(h) : String(h).padStart(2, '0') }); }
function dayOf(i) { return A.fc.days.filter(function (d) { return d.idx.indexOf(i) >= 0; })[0]; }
function todayStr() { return new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10); }
function dayName(day) {
  var d = new Date(day.date + 'T12:00:00'), tod = todayStr();
  if (day.date === tod) return t('today');
  if (new Date(Date.parse(tod + 'T12:00:00Z') + 864e5).toISOString().slice(0, 10) === day.date) return t('tomorrow');
  return t('wd')[d.getDay()] + ' ' + d.getDate();
}
function whenLong(i) {
  var d = dayOf(i), dt = new Date(d.date + 'T12:00:00'), nm = dayName(d);
  var head = (nm === t('today') || nm === t('tomorrow')) ? cap(nm) : t('WD')[dt.getDay()];
  return head + ', ' + dt.getDate() + ' ' + t('mon')[dt.getMonth()] + ' · ' + hourLabelOf(i);
}
function whenShort(i) { var d = dayOf(i), nm = dayName(d); return (nm === t('today') || nm === t('tomorrow') ? nm : nm) + ' ' + (LANG.cur === 'pt' ? 'às ' : 'at ') + hourLabelOf(i); }

/* ================================================================ the model's results, read */
function spotsOf(act) { return S.RULES[act].spots; }
/* the state of an activity at a beach and step — the icon's shape; priority: decided danger, a forecast warning,
   a band straddling a decided limit, then the forecast's own word */
function stOf(b, i, a) {
  if (spotsOf(a).indexOf(b.kind) < 0) return null;
  var j = b.rows[i].acts[a]; if (!j) return null;
  if (j.refused) return { cls: 'off', j: j, s: -1 };
  var cls = j.worst === 'V' ? 'V' : j.warn.length ? 'W' : j.worst === 'I' ? 'I' : j.flat ? 'poor' : j.q;
  return { cls: cls, j: j, s: j.s };
}
var RANK = { good: 5, fair: 4, I: 3, W: 2, poor: 1, V: 0, off: -1 };
function stWord(cls) { return t('st_' + cls); }
function decWord(j) { var d = j.dec.filter(function (x) { return x.letter === 'V'; })[0]; return d ? (LANG.cur === 'pt' ? d.word : d.en) : ''; }
function bandOfWaves(c) { return c.waves && c.waves.lo != null ? [c.waves.lo, c.waves.hi] : null; }
function windWords(U, wc) { if (U < 3 || !wc) return t('calm'); return t('wc_' + wc) + ' ' + t(U < 6 ? 's_light' : U < 10 ? 's_mod' : 's_strong'); }
/* the number that matters for an activity — for the tooltip and the card's row; the page's headline numbers never change */
function actMetric(a, c) {
  var kn = num(c.wind.U * KN, 0), kmh = num(c.wind.U * 3.6, 0), hb = c.hb == null ? '—' : metres(c.hb), dom = c.cur && c.cur.dom;
  if (a === 'surf') return hb + (dom ? ' · ' + num(dom.p, 0) + ' s ' + dirShort(dom.d) : '') + ' · ' + windWords(c.wind.U, c.wc);
  if (a === 'kite') return kn + ' ' + t('knots') + ' · ' + t('gusts') + ' ' + num(c.wind.gust * KN, 0) + ' · ' + (c.wc ? t('wc_' + c.wc) : t('calm'));
  if (a === 'sup') return t('waves') + ' ' + hb + ' · ' + t('wind') + ' ' + kmh + ' km/h';
  if (a === 'swim') return t('waves') + ' ' + hb + (c.cur && c.cur.V > 0.15 ? ' · ' + t('current') + ' ' + num(c.cur.V, 1) + ' m/s' : '');
  if (a === 'fish') return t('sea') + ' ' + hb + ' · ' + t('wind') + ' ' + kmh + ' km/h';
  return t('swellOff').toLowerCase() + ' ' + (c.off == null ? '—' : metres(c.off)) + ' · ' + t('wind') + ' ' + kn + ' ' + t('knots');
}
function iconHTML(b, i, a, size, extra) {
  var st = stOf(b, i, a); if (!st) return '';
  var foc = A.focus === a ? ' foc' : '';
  return '<b class="sw-ai ' + st.cls + foc + '" data-tip="' + b.k + '|' + a + '" tabindex="0" role="button" aria-label="' + esc(t('act_' + a) + ': ' + stWord(st.cls)) + '">' + svgIcon(a, size || 13) + (extra || '') + '</b>';
}
function iconsRow(b, i, size) { return ACTS.map(function (a) { return iconHTML(b, i, a, size); }).join(''); }
function daylightLeft(day) { return day.idx.some(function (i) { return A.fc.daylight[i] && !(day === A.fc.days[0] && i < A.fc.now); }); }
function winText(w) { return w.from === w.to ? t('win1', { a: hourLabelOf(w.from) }) : t('win2', { a: hourLabelOf(w.from), b: hourLabelOf(Math.min(w.to + 1, A.fc.N - 1)) }); }
/* the best window of a day for an activity, over every beach — named, never applied to the clock by itself */
function bestWindow(day, a) {
  var from = day === A.fc.days[0] ? A.fc.now : 0, best = null;
  A.beaches.forEach(function (b) {
    if (spotsOf(a).indexOf(b.kind) < 0) return;
    var w = S.bestOfDay(A.all, b.k, day.idx, a, from);
    if (w && w.j.worst !== 'V' && (!best || w.s > best.w.s + 1e-9)) best = { b: b, w: w };
  });
  return best;
}

/* ================================================================ the top: when, the sea, the activities as legends */
function renderTop() {
  var i = A.hour, s = A.day.sea[i], w = S.windAt(A.day, i, -48.47, -27.6);
  $('#sw-when').textContent = whenLong(i) + (A.fc.daylight[i] ? '' : ' · ' + t('night'));
  $('#sw-sea').innerHTML = s && s.size != null ? t('seaLine', { hs: metres(s.size), dir: dirWord(s.mwd), tp: num(s.tp, 0), kn: num(w.U * KN, 0), wdir: dirWord(w.dir), arr: arrow(w.dir, 12) }) +
    (s.lo != null ? '<span class="sub">' + t('seaSub', { lo: num(s.lo, 1), hi: num(s.hi, 1) }) + '</span>' : '') : t('seaNone');
  $('#sw-cap').textContent = t('capActs');
  /* the six activities: how many beaches each is good at, now — a legend, and a highlight when tapped */
  var box = $('#sw-acts');
  box.innerHTML = ACTS.map(function (a) {
    var good = 0, fair = 0, dang = 0;
    A.beaches.forEach(function (b) { var st = stOf(b, i, a); if (!st) return; if (st.cls === 'good') good++; else if (st.cls === 'fair') fair++; else if (st.cls === 'V') dang++; });
    var cls = good ? 'good' : fair ? 'fair' : 'poor';
    return '<button class="sw-act ' + cls + (A.focus === a ? ' on' : '') + '" data-act="' + a + '" aria-pressed="' + (A.focus === a) + '" title="' + esc(t('actLong_' + a)) + '">' +
      '<span class="ic">' + svgIcon(a, 15) + '</span><span class="nm">' + t('act_' + a) + '</span><span class="ct">' + (good ? good : fair ? '·' + fair : '–') + '</span>' + (dang ? '<span class="dg" title="' + esc(t('st_V')) + '">▲' + dang + '</span>' : '') + '</button>';
  }).join('');
  box.querySelectorAll('.sw-act').forEach(function (el) { el.onclick = function () { setFocus(A.focus === el.dataset.act ? null : el.dataset.act); }; });
  renderFocusLine();
}
function renderFocusLine() {
  var el = $('#sw-focus'), a = A.focus;
  if (!a) { el.hidden = true; el.innerHTML = ''; return; }
  var i = A.hour, good = [], fair = [], dang = 0;
  A.beaches.forEach(function (b) { var st = stOf(b, i, a); if (!st) return; if (st.cls === 'good') good.push(b); else if (st.cls === 'fair') fair.push(b); else if (st.cls === 'V') dang++; });
  good.sort(function (x, y) { return stOf(y, i, a).s - stOf(x, i, a).s; }); fair.sort(function (x, y) { return stOf(y, i, a).s - stOf(x, i, a).s; });
  var names = function (l) { return l.slice(0, 3).map(function (b) { return '<b>' + esc(b.name) + '</b>'; }).join(', ') + (l.length > 3 ? t('andN', { n: l.length - 3 }) : ''); };
  var parts = [];
  if (good.length) parts.push(t('goodAt', { x: names(good) }));
  if (fair.length) parts.push(t('fairAt', { x: names(fair) }));
  var html = parts.length ? t('focusNow', { act: t('act_' + a), when: whenShort(i), list: parts.join('; ') }) : t('focusNone', { act: t('act_' + a), when: whenShort(i) });
  if (dang) html += ' <span class="dec">' + esc(t('focusDanger', { n: dang, praias: dang === 1 ? t('praia1') : t('praiaN') })) + '</span>';
  var bw = bestWindow(A.dayRef, a);
  if (bw) {
    html += ' ' + t('focusBest', { beach: esc(bw.b.name), win: winText(bw.w) });
    if (bw.w.i !== A.hour) html += ' <button class="sw-go" data-go="' + bw.w.i + '" data-beach="' + esc(bw.b.name) + '">' + esc(t('goThere', { h: hourLabelOf(bw.w.i) })) + ' →</button>';
  } else html += ' ' + t('focusBestNone', { act: t('act_' + a).toLowerCase() });
  html += ' <button class="sw-go x" data-clear>' + t('clear') + ' ✕</button>';
  el.innerHTML = html; el.hidden = false;
  var go = el.querySelector('[data-go]'); if (go) go.onclick = function () { setHour(+go.dataset.go); };
  el.querySelector('[data-clear]').onclick = function () { setFocus(null); };
}
function setFocus(a) {
  A.focus = a; setHash(); try { localStorage.setItem('swell.focus', a || ''); } catch (e) {}
  renderTop(); if (A.sel) renderCard(); else renderList(); paintLabels(); drawTimeline();
}

/* ================================================================ the days and the hour */
function renderDays() {
  var box = $('#sw-days'); box.innerHTML = '';
  A.fc.days.forEach(function (d) {
    /* per activity, the best state at any beach in the day's daylight: a row of six marks under the day's name */
    var marks = ACTS.map(function (a) {
      var best = null;
      d.idx.forEach(function (i) { if (!A.fc.daylight[i] || (d === A.fc.days[0] && i < A.fc.now)) return; A.beaches.forEach(function (b) { var st = stOf(b, i, a); if (st && (!best || RANK[st.cls] > RANK[best])) best = st.cls; }); });
      return '<i class="' + (best === 'good' ? 'good' : best === 'fair' ? 'fair' : '') + (A.focus === a ? ' foc' : '') + '"></i>';
    }).join('');
    var b = document.createElement('button'); b.className = d === A.dayRef ? 'on' : '';
    var nm = dayName(d); if (LANG.cur === 'en' && nm === t('tomorrow')) { var dd0 = new Date(d.date + 'T12:00:00'); nm = t('wd')[dd0.getDay()] + ' ' + dd0.getDate(); }
    b.innerHTML = '<span>' + nm + '</span><em>' + marks + '</em>';
    b.title = ACTS.map(function (a) { return t('act_' + a); }).join(' · ');
    b.onclick = function () { chooseDay(d); }; box.appendChild(b);
  });
}
function renderHourRow() {
  var r = $('#sw-hour'), pos = A.dayRef.idx.indexOf(A.hour);
  r.max = A.dayRef.idx.length - 1; r.value = Math.max(0, pos);
  $('#sw-hour-v').textContent = hourLabelOf(A.hour);
  drawDayStrip();
}
/* the open sea through the chosen day behind the slider: its height and measured band, night shaded — the same for
   every activity */
function drawDayStrip() {
  var cv = $('#sw-daystrip'), dpr = devicePixelRatio, W = cv.clientWidth || 300, H = cv.clientHeight || 20;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  var g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  var idx = A.dayRef.idx, n = idx.length, cw = W / n, X = function (k) { return (k + 0.5) * cw; };
  var hmax = Math.max.apply(null, [2].concat(A.day.sea.map(function (s) { return s.hi || s.size || 0; }))) * 1.05, Y = function (v) { return H - 1 - (H - 3) * v / hmax; };
  idx.forEach(function (i, k) { if (!A.fc.daylight[i]) { g.fillStyle = rgba(COL.ink5, 0.22); g.fillRect(k * cw, 0, cw, H); } });
  var sea = idx.map(function (i) { return A.day.sea[i]; });
  if (sea.every(function (s) { return s.lo != null; })) {
    g.beginPath(); sea.forEach(function (s, k) { if (k) g.lineTo(X(k), Y(s.hi)); else g.moveTo(X(k), Y(s.hi)); });
    for (var k = n - 1; k >= 0; k--) g.lineTo(X(k), Y(sea[k].lo));
    g.closePath(); g.fillStyle = rgba(COL.ink3, 0.18); g.fill();
  }
  g.beginPath(); sea.forEach(function (s, k) { if (k) g.lineTo(X(k), Y(s.size || 0)); else g.moveTo(X(k), Y(s.size || 0)); }); g.strokeStyle = COL.ink3; g.lineWidth = 1.2; g.stroke();
  var j = idx.indexOf(A.hour); if (j >= 0) { g.fillStyle = COL.ink; g.beginPath(); g.arc(X(j), Y(sea[j].size || 0), 2.6, 0, 7); g.fill(); }
}

/* ================================================================ the list: every beach, by region, the same sea */
function renderList() {
  $('#sw-card').hidden = true; $('#sw-legend').hidden = false; var box = $('#sw-rank'); box.hidden = false;
  var i = A.hour, html = '';
  var favs = A.beaches.filter(function (b) { return FAV.has(b.name); });
  if (favs.length) html += '<h2 class="sw-sec">' + t('yourBeaches') + '</h2><ol>' + favs.map(function (b) { return rowHTML(b, i, true); }).join('') + '</ol>';
  REGIONS.forEach(function (r) {
    var bs = A.beaches.filter(function (b) { return b.region === r && !FAV.has(b.name); });
    if (!bs.length) return;
    html += '<h2 class="sw-sec">' + t('region_' + r) + '</h2><ol>' + bs.map(function (b) { return rowHTML(b, i); }).join('') + '</ol>';
  });
  box.innerHTML = html;
  box.querySelectorAll('li').forEach(function (li) {
    var open = function (act) { selectBeach(li.dataset.beach, true, act); };
    li.onclick = function (e) { var ic = e.target.closest('.sw-ai'); open(ic ? ic.dataset.tip.split('|')[1] : null); };
    li.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); var ic = e.target.closest('.sw-ai'); open(ic ? ic.dataset.tip.split('|')[1] : null); } };
  });
  requestAnimationFrame(drawSparks);
}
function rowHTML(b, i, fav) {
  var c = b.rows[i].c, w = c.waves, band = bandOfWaves(c);
  var dim = A.focus && (function () { var st = stOf(b, i, A.focus); return !st || !(st.cls === 'good' || st.cls === 'fair'); })();
  var h = w.refused ? '<span class="h off">—</span>' : '<span class="h">' + metres(c.hb) + (band ? '<small>' + num(band[0] / 100, 1) + '–' + num(band[1] / 100, 1) + '</small>' : '') + '</span>';
  var sub = w.refused ? t('st_off') : (b.kind === 'island' ? t('island') : windWords(c.wind.U, c.wc) + ' · ' + num(c.wind.U * KN, 0) + ' ' + t('knots') + ' ' + arrow(c.wind.dir, 11));
  return '<li data-beach="' + esc(b.name) + '" class="' + (dim ? 'dim' : '') + (w.refused ? ' refused' : '') + '" tabindex="0" role="button">' +
    '<span class="b">' + (fav ? '<i class="star">★</i> ' : '') + esc(b.name) + '<small>' + t('kind_' + b.kind) + '</small></span>' + h +
    '<span class="d"><span class="w">' + sub + '</span><span class="sp"></span><span class="sw-icons">' + iconsRow(b, i, 13) + '</span></span>' +
    '<canvas class="sw-spark" data-k="' + b.k + '"></canvas></li>';
}
/* each beach's waves through the chosen day — one shared scale, so the beaches compare at a glance */
function drawSparks() {
  var idx = A.dayRef.idx, ymax = 1;
  A.beaches.forEach(function (b) { idx.forEach(function (i) { var c = b.rows[i].c; if (c.hb != null) ymax = Math.max(ymax, c.hb); }); });
  ymax *= 1.08;
  document.querySelectorAll('#sw-rank canvas.sw-spark').forEach(function (cv) {
    var b = A.beaches[+cv.dataset.k], dpr = devicePixelRatio, W = cv.clientWidth || 280, H = cv.clientHeight || 14;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    var g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    var X = function (j) { return (j + 0.5) / idx.length * W; }, Y = function (v) { return H - 1 - (H - 3) * v / ymax; };
    idx.forEach(function (i, j) { if (!A.fc.daylight[i]) { g.fillStyle = rgba(COL.paper, 0.55); g.fillRect(X(j) - W / idx.length / 2, 0, W / idx.length + 0.5, H); } });
    var vals = idx.map(function (i) { var c = b.rows[i].c; return c.hb == null ? 0 : c.hb; });
    g.beginPath(); g.moveTo(X(0), H); vals.forEach(function (v, j) { g.lineTo(X(j), Y(v)); }); g.lineTo(X(idx.length - 1), H); g.closePath();
    g.fillStyle = rgba(COL.ink2, 0.14); g.fill();
    g.beginPath(); vals.forEach(function (v, j) { j ? g.lineTo(X(j), Y(v)) : g.moveTo(X(j), Y(v)); }); g.strokeStyle = COL.ink3; g.lineWidth = 1; g.stroke();
    var j0 = idx.indexOf(A.hour); if (j0 >= 0) { g.fillStyle = COL.ink; g.beginPath(); g.arc(X(j0), Y(vals[j0]), 2, 0, 7); g.fill(); }
  });
}

/* ================================================================ the tooltip: an icon says why, without moving anything */
var TIP = { el: null, hide: 0 };
function tipText(k, a) {
  var b = A.beaches[k], i = A.hour, st = stOf(b, i, a); if (!st) return '';
  var c = b.rows[i].c, j = st.j, out = '<b>' + t('act_' + a) + '</b> · ' + esc(st.cls === 'V' ? decWord(j) : stWord(st.cls));
  if (st.cls !== 'off') out += '<br>' + actMetric(a, c);
  if (j && j.warn && j.warn.length) out += '<br><span class="w">' + j.warn.map(function (x) { return esc(LANG.cur === 'pt' ? x.word : x.en); }).join(' · ') + ' (' + (LANG.cur === 'pt' ? 'previsão' : 'forecast') + ')</span>';
  if (j && j.dec) j.dec.forEach(function (d) { if (d.letter === 'V' || d.letter === 'I') out += '<br><span class="d ' + d.letter + '">' + (d.letter === 'V' ? '▲ ' : '') + esc(d.letter === 'V' ? (LANG.cur === 'pt' ? 'decidido' : 'decided') : t('st_I')) + ' · ' + metres(Number(d.limit), 1) + '</span>'; });
  return out;
}
function setupTips() {
  TIP.el = $('#sw-tip');
  var show = function (el) {
    var p = el.dataset.tip.split('|'), html = tipText(+p[0], p[1]); if (!html) return;
    clearTimeout(TIP.hide); TIP.el.innerHTML = html; TIP.el.hidden = false;
    var r = el.getBoundingClientRect(), tw = TIP.el.offsetWidth, th = TIP.el.offsetHeight;
    var x = clamp(r.left + r.width / 2 - tw / 2, 8, innerWidth - tw - 8), y = r.top - th - 8; if (y < 60) y = r.bottom + 8;
    TIP.el.style.left = x + 'px'; TIP.el.style.top = y + 'px';
  };
  var hide = function () { TIP.hide = setTimeout(function () { TIP.el.hidden = true; }, 80); };
  document.addEventListener('mouseover', function (e) { var el = e.target.closest && e.target.closest('[data-tip]'); if (el && matchMedia('(hover: hover)').matches) show(el); });
  document.addEventListener('mouseout', function (e) { var el = e.target.closest && e.target.closest('[data-tip]'); if (el) hide(); });
  document.addEventListener('focusin', function (e) { var el = e.target.closest && e.target.closest('[data-tip]'); if (el) show(el); });
  document.addEventListener('focusout', hide);
  /* a wheel or a touch moves the page under the tip: hide it (a focus-driven scroll keeps it, it follows the focus) */
  document.addEventListener('wheel', function () { TIP.el.hidden = true; }, { passive: true });
  document.addEventListener('touchmove', function () { TIP.el.hidden = true; }, { passive: true });
}

/* ================================================================ a beach */
function selectBeach(name, fly, act) {
  var b = A.beaches.filter(function (x) { return x.name === name; })[0]; if (!b) return;
  A.sel = name; A.open = act || A.focus || null; setHash(); setTab('beaches');
  renderCard(); paintLabels(); drawCurrents(); drawTimeline();
  if (UI.phone.matches) setSheet('half');
  if (fly !== false && A.map) A.map.flyTo({ center: [b.lon, b.lat], zoom: Math.max(A.map.getZoom(), 13.2), duration: 1100, essential: true });
  $('#panel .sw-scroll').scrollTop = 0;
}
function closeCard() { A.sel = null; A.open = null; setHash(); renderList(); paintLabels(); drawTimeline(); }
function decLines(j, c) {
  if (!j || !j.dec || !j.dec.length) return '';
  return j.dec.map(function (d) {
    var word = LANG.cur === 'pt' ? d.word : d.en, lim = metres(Number(d.limit), 2);
    var bd = d.var === 'hs' ? (c.sea && c.sea.lo != null ? [Math.round(c.sea.lo * 100), Math.round(c.sea.hi * 100)] : null) : bandOfWaves(c);
    var lo = bd ? metres(bd[0] / 100, 2) : '—', hi = bd ? metres(bd[1] / 100, 2) : '—', txt;
    if (d.letter === 'V') txt = t('decV', { word: word, lo: lo, lim: lim });
    else if (d.letter === 'I') {
      /* decide.js's flip is how far the UNFAVOURABLE edge (here the high one) must move to clear; the other way, the
         low edge must pass the limit (a <= limit: one centimetre over it), counted in whole centimetres, exactly */
      var f = d.flip && d.flip[0], up = bd ? Math.round(Number(d.limit) * 100) - bd[0] + 1 : null;
      txt = t('decI', { word: word, lo: lo, hi: hi, lim: lim, gap: f ? metres(Number(f.gapDec), 2) : '—', up: up != null ? metres(up / 100, 2) : '—' });
    } else if (d.letter === 'L') txt = t('decL', { lim: lim, lo: lo, hi: hi });
    else txt = t('decS', { lim: lim });
    return '<span class="sw-dec ' + d.letter + '">' + esc(d.letter === 'V' ? word : d.letter === 'I' ? (LANG.cur === 'pt' ? 'atenção' : 'caution') : d.letter === 'L' ? (LANG.cur === 'pt' ? 'abaixo' : 'under') : (LANG.cur === 'pt' ? 'sem dados' : 'no data')) + '</span><span>' + txt + '</span>';
  }).join('');
}
/* the card's activity rows: icon, name, word, the number that matters; open one for its rule and what is decided */
function actsBlock(b, i) {
  var c = b.rows[i].c;
  return ACTS.map(function (a) {
    var st = stOf(b, i, a), R = S.RULES[a];
    if (!st) return '<div class="sw-arow na"><span class="ai">' + svgIcon(a, 15) + '</span><span class="an">' + t('act_' + a) + '</span><span class="aw">' + t('na') + '</span></div>';
    var open = A.open === a, j = st.j;
    var det = '<div class="sw-adet">' + (j && j.dec && j.dec.length ? '<div class="sw-decl">' + decLines(j, c) + '</div>' : '') +
      (j && j.warn && j.warn.length ? j.warn.map(function (x) { return '<p class="sw-warn sm">' + svgIcon('sos', 13) + '<span>' + esc(LANG.cur === 'pt' ? x.word : x.en) + ' — ' + (LANG.cur === 'pt' ? 'previsão, não decidido' : 'forecast, not decided') + '</span></p>'; }).join('') : '') +
      '<p class="sw-rule">' + R.text[LANG.cur] + '</p></div>';
    return '<div class="sw-arow' + (open ? ' open' : '') + (A.focus === a ? ' foc' : '') + '" data-act="' + a + '"><button class="sw-ahead" aria-expanded="' + open + '">' +
      '<span class="ai sw-ai ' + st.cls + '">' + svgIcon(a, 15) + '</span><span class="an">' + t('act_' + a) + '</span>' +
      '<span class="aw ' + st.cls + '">' + esc(st.cls === 'V' ? decWord(j) : t('sh_' + st.cls)) + '</span><span class="am">' + (st.cls === 'off' ? '' : actMetric(a, c)) + '</span><span class="chev">›</span></button>' + det + '</div>';
  }).join('');
}
function renderCard() {
  var b = A.beaches.filter(function (x) { return x.name === A.sel; })[0]; if (!b) return;
  $('#sw-rank').hidden = true; $('#sw-legend').hidden = true; var el = $('#sw-card'); el.hidden = false;
  var i = A.hour, c = b.rows[i].c, w = c.waves, band = bandOfWaves(c);
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
  var tot2 = c.sea && c.sea.parts.length ? Math.sqrt(c.sea.parts.reduce(function (s, Q) { return s + Q.h * Q.h; }, 0)) || 1 : 1;
  var parts = c.sea && c.sea.parts.length ? c.sea.parts.map(function (P) { return metres(P.h * c.sea.size / tot2) + ' · ' + num(P.p, 0) + ' s · ' + dirShort(P.d) + ' ' + arrow(P.d, 10); }).join('<br>') : '—';
  var tide = tideAt(i), sst = sstAt(i);
  var cur = c.cur && c.cur.V >= 0.05 ? t('longshore', { v: num(c.cur.V, 1), dir: dirWord(c.cur.toward) }) : t('calmWater');
  var guard = b.lifeguard && b.lifeguard.d < 2000
    ? esc(b.lifeguard.name || t('poi_lifeguard')) + ' · ' + Math.round(b.lifeguard.d / 50) * 50 + ' m · <a href="https://www.google.com/maps/dir/?api=1&destination=' + b.lifeguard.lat + ',' + b.lifeguard.lon + '" target="_blank" rel="noopener">' + t('route') + '</a>'
    : t('noGuard');
  var warns = [];
  if (c.rip) warns.push(t('ripWarn'));
  if ((c.wc === 'offshore' || c.wc === 'side-offshore') && c.wind.U > 4) warns.push(t('offWarn'));
  var refusedHtml = '';
  if (w.refused) { var m = /^edge:(.*)$/.exec(w.refused); refusedHtml = '<p class="sw-refused">' + (m ? t('refusedEdge', { km: m[1].replace(/^[NSW] /, '').replace('.', LANG.cur === 'pt' ? ',' : '.') }) : t('refusedNo')) + '</p>'; }
  var notes = [];
  if (w.capped) notes.push(t('capped', { h: num(b.probes[b.probes.length - 1].h, 1) }));
  if (w.ext) w.ext.filter(function (T) { return T > S.C.T_MAX; }).forEach(function (T) { notes.push(t('extT', { T: num(T, 0) })); });
  if (c.sea && c.sea.flat) notes.push(t('flatSea'));
  var dom = c.cur && c.cur.dom, rain = c.wind.rain;
  el.innerHTML =
    '<div class="sw-cbar"><button class="sw-btn sw-back" id="sw-card-back">← ' + t('back') + '</button><span class="sp"></span>' +
      '<button class="sw-btn ic' + (FAV.has(b.name) ? ' on' : '') + '" id="sw-card-fav" title="' + (FAV.has(b.name) ? t('saved') : t('save')) + '">' + svgIcon('star', 15) + '</button>' +
      '<button class="sw-btn ic" id="sw-card-map" title="' + t('onMap') + '">' + svgIcon('pin', 15) + '</button>' +
      '<button class="sw-btn ic" id="sw-card-share" title="' + t('share') + '">' + svgIcon('share', 15) + '</button></div>' +
    '<h1>' + esc(b.name) + '</h1><div class="where">' + t('region_' + b.region) + ' · ' + t('kind_' + b.kind) + ' · ' + whenLong(i) + '</div>' +
    (w.refused ? refusedHtml :
      '<div class="sw-hero"><div class="hb"><b>' + metres(c.hb) + '</b><span>' + t('breakH').toLowerCase() + (dom ? ' · ' + num(dom.p, 0) + ' s ' + dirShort(dom.d) + ' ' + arrow(dom.d, 11) : '') + '</span></div>' +
      '<div class="wd"><b>' + num(c.wind.U * KN, 0) + ' <small>' + t('knots') + '</small></b><span>' + windWords(c.wind.U, c.wc) + ' ' + arrow(c.wind.dir, 11) + '</span></div></div>' +
      '<p class="sw-band">' + (band ? t('bandLine', { lo: num(band[0] / 100, 2), hi: metres(band[1] / 100, 2) }) + ' — ' + t('bandWhat') : t('bandNone')) + '</p>') +
    (notes.length ? '<p class="sw-note">' + notes.join(' · ') + '</p>' : '') +
    (why ? '<p class="why">' + why + '</p>' : '') +
    warns.map(function (x) { return '<p class="sw-warn">' + svgIcon('sos', 15) + '<span>' + x + '</span></p>'; }).join('') +
    '<h2 class="sw-sec">' + t('actsH') + '</h2><div class="sw-acts-card">' + actsBlock(b, i) + '</div><p class="sw-note">' + t('actsHint') + '</p>' +
    '<h2 class="sw-sec">' + t('conditions') + '</h2><dl>' +
      '<dt>' + t('swellOff') + '</dt><dd>' + (c.off == null ? '—' : metres(c.off) + (c.sea && c.sea.lo != null ? ' <span class="fc">(' + num(c.sea.lo, 1) + '–' + num(c.sea.hi, 1) + ')</span>' : '')) + '<br>' + parts + '</dd>' +
      '<dt>' + t('windH') + '</dt><dd>' + num(c.wind.U * 3.6, 0) + ' km/h (' + num(c.wind.U * KN, 0) + ' ' + t('knots') + ') ' + t('from') + ' ' + dirShort(c.wind.dir) + ' · ' + t('gusts') + ' ' + num(c.wind.gust * 3.6, 0) + ' km/h <span class="fc">ECMWF</span></dd>' +
      '<dt>' + t('currentH') + '</dt><dd>' + cur + '</dd>' + foamRow(b) +
      '<dt>' + t('tide') + '</dt><dd>' + (tide ? (tide.level >= 0 ? '+' : '−') + metres(Math.abs(tide.level), 2) + ' · ' + tide.trend + ' <span class="fc">Copernicus</span>' : '—') + '</dd>' +
      '<dt>' + t('water') + ' · ' + t('air') + '</dt><dd>' + (sst != null ? num(sst, 1) + ' °C' : '—') + ' · ' + (c.wind.t2 != null ? num(c.wind.t2, 0) + ' °C' : '—') + (rain != null && rain >= 0.2 ? ' · ' + t('rain') + ' ' + num(rain, 1) + ' mm' : '') + '</dd>' +
    '</dl>' +
    '<h2 class="sw-sec">' + t('week') + '</h2><canvas class="week"></canvas><canvas class="grid"></canvas>' +
    '<h2 class="sw-sec">' + t('safety') + '</h2>' +
    '<p class="sw-guard">' + svgIcon('lifeguard', 14) + '<span>' + t('nearestGuard') + ': ' + guard + '</span></p>' +
    '<p class="sw-guard">' + svgIcon('info', 14) + '<span>' + t('cbmsc') + '</span></p>' +
    '<button class="sw-btn sw-sosline" data-sos>' + svgIcon('sos', 15) + '<span>' + t('sos') + ': 193 · 190 · 192 · 185</span></button>' +
    '<h2 class="sw-sec">' + t('cert') + '</h2>' + certBlock(b, i) +
    '<div class="actions"><button class="sw-btn" id="sw-card-cert">' + svgIcon('dl', 14) + t('certDl') + '</button></div>';
  $('#sw-card-back').onclick = closeCard;
  $('#sw-card-fav').onclick = function () { toggleFav(b.name); renderCard(); };
  $('#sw-card-share').onclick = function () { shareBeach(b); };
  $('#sw-card-cert').onclick = function () { certDownload(b, i); };
  $('#sw-card-map').onclick = function () { if (UI.phone.matches) setSheet('peek'); A.map.flyTo({ center: [b.lon, b.lat], zoom: 14, duration: 1000 }); };
  el.querySelector('[data-sos]').onclick = openSOS;
  el.querySelectorAll('.sw-arow:not(.na) .sw-ahead').forEach(function (x) { x.onclick = function () { var a = x.parentNode.dataset.act; A.open = A.open === a ? null : a; renderCard(); }; });
  requestAnimationFrame(function () { drawWeek(el.querySelector('canvas.week'), b); drawGrid(el.querySelector('canvas.grid'), b, true, 34, 0); });
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
  var D = A.day, c = b.rows[i].c, st = D.steps[i];
  var cert = {
    praia: b.name, passo: st.t + ' UTC', antecedencia_h: st.lead, rodada: D.run,
    altura_na_beira_cm: c.waves.refused ? null : { central: c.waves.c, faixa: c.waves.lo != null ? [c.waves.lo, c.waves.hi] : null, no_limite_do_modelo: !!c.waves.capped },
    recusa: c.waves.refused || null, mar_aberto: D.sea[i],
    atividades: ACTS.map(function (a) {
      var j = b.rows[i].acts[a]; if (!j) return { atividade: a, aplica: false };
      if (j.refused) return { atividade: a, recusa: j.refused };
      return { atividade: a, nota_de_previsao: Math.round(j.s * 1000) / 1000, palavra: j.q,
        decisoes: j.dec.map(function (d) { return { regra: d.id, limite_m: d.limit, veredito: d.verdict, testemunha: d.witness, limiar: d.flip }; }),
        avisos_de_previsao: j.warn.map(function (w) { return w.id; }) };
    }),
    modulos: D.modules, entradas: D.inputs, digest_do_dia: D.digest, feed: D.feed, codigo: D.git,
    conferencia_no_navegador: A.check,
    refazer: ['git clone https://github.com/carlostoledo1891/cert-machine && cd cert-machine && git checkout ' + D.git, 'node apps/swell/build-day.js --feed ' + D.run.slice(0, 8)],
    aviso: 'Decidido = a aritmética exata sobre a faixa medida do mar aberto levada à praia pelo modelo linear da ilha (o erro do próprio modelo na beira não foi medido). Não é uma garantia de segurança. Não serve para navegação.',
  };
  var blob = new Blob([JSON.stringify(cert, null, 1)], { type: 'application/json' });
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'swell-' + slug(b.name) + '-' + st.t.replace(/[^0-9]/g, '') + '.json'; a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
}
/* the beach's week: the waves at the shore with their measured band, the chosen hour, now */
function drawWeek(cv, b) {
  if (!cv) return;
  var N = A.fc.N, dpr = devicePixelRatio, W = cv.clientWidth || 340, H = cv.clientHeight || 96;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  var g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  var vals = b.rows.map(function (r) { return r.c.hb == null ? 0 : r.c.hb; }), top = 16, bot = H - 2;
  var bands = b.rows.map(function (r) { return bandOfWaves(r.c); });
  var ymax = Math.max.apply(null, [0.8].concat(vals, bands.map(function (x) { return x ? x[1] / 100 : 0; }))) * 1.1;
  var L0 = 34, cw0 = (W - L0) / N, X = function (i) { return L0 + (i + 0.5) * cw0; }, Y = function (v) { return bot - (bot - top) * v / ymax; };
  var ff = getComputedStyle(document.body).fontFamily;
  for (var i = 0; i < N; i++) {
    if (!A.fc.daylight[i]) { g.fillStyle = rgba(COL.paper, 0.6); g.fillRect(X(i) - cw0 / 2, top - 2, cw0 + 0.5, bot - top + 2); }
    var dd = dayOf(i);
    if (dd && dd.idx[0] === i) { g.fillStyle = rgba(COL.ink, 0.12); g.fillRect(Math.round(X(i) - cw0 / 2), 0, 1, bot); g.fillStyle = dd === A.dayRef ? COL.ink : COL.ink3; g.font = '10px ' + ff; var nm0 = dayName(dd); g.fillText(cw0 * dd.idx.length < 52 ? nm0.slice(0, 3) : nm0, X(i) + 1, 10); }
  }
  g.beginPath(); var started = false;
  bands.forEach(function (bd, k) { if (!bd) return; var y = Y(bd[1] / 100); if (started) g.lineTo(X(k), y); else { g.moveTo(X(k), y); started = true; } });
  for (var k2 = N - 1; k2 >= 0; k2--) if (bands[k2]) g.lineTo(X(k2), Y(bands[k2][0] / 100));
  if (started) { g.closePath(); g.fillStyle = rgba(COL.ink2, 0.18); g.fill(); }
  g.beginPath(); vals.forEach(function (v, k) { if (k) g.lineTo(X(k), Y(v)); else g.moveTo(X(k), Y(v)); }); g.strokeStyle = COL.ink2; g.lineWidth = 1.4; g.stroke();
  g.strokeStyle = rgba(COL.ink3, 0.8); g.setLineDash([2, 3]); g.beginPath(); g.moveTo(X(A.fc.now), top - 2); g.lineTo(X(A.fc.now), bot); g.stroke(); g.setLineDash([]);
  g.fillStyle = COL.ink; g.fillRect(Math.round(X(A.hour)) - 0.75, top - 4, 1.5, bot - top + 4);
  g.font = '9.5px ' + ff; g.fillStyle = COL.ink3; g.textAlign = 'right'; g.fillText(metres(ymax / 1.1), W - 2, top + 8); g.textAlign = 'left';
  cv.onclick = function (e) { var rr = cv.getBoundingClientRect(); setHour(clamp(Math.floor((e.clientX - rr.left - L0) / (rr.width - L0) * N), 0, N - 1)); };
}
/* WHEN EACH ACTIVITY IS GOOD: six rows, one per activity, one cell per step, the icons' own grammar (filled good,
   outlined doable, red decided danger, ringed caution, dim poor). For a beach, its own states; for the island, at each
   step the best state any beach has. Tap a cell: the clock moves there (the reader asked). */
function drawGrid(cv, b, compact, L, R) {
  if (!cv) return;
  var N = A.fc.N, dpr = devicePixelRatio, W = cv.clientWidth || 340, rowH = compact ? 12 : 15, H = ACTS.length * rowH + 4;
  L = L == null ? 26 : L; R = R || 0;
  cv.style.height = H + 'px'; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  var g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
  var cw = (W - L - R) / N;
  var stAt = function (i, a) {
    if (b) { var s = stOf(b, i, a); return s ? s.cls : null; }
    var best = null; A.beaches.forEach(function (x) { var s = stOf(x, i, a); if (s && (!best || RANK[s.cls] > RANK[best])) best = s.cls; }); return best;
  };
  ACTS.forEach(function (a, r) {
    var y = 2 + r * rowH, h = rowH - 3;
    g.fillStyle = A.focus === a ? COL.ink : COL.ink4; g.font = (compact ? '600 8.5px ' : '600 9.5px ') + getComputedStyle(document.body).fontFamily;
    g.fillText(t('act_' + a), 0, y + h - 1);
    for (var i = 0; i < N; i++) {
      var x = L + i * cw + 0.5, w = Math.max(1, cw - 1), cls = stAt(i, a);
      if (!A.fc.daylight[i]) { g.fillStyle = rgba(COL.paper, 0.9); g.fillRect(x, y, w, h); continue; }
      if (!cls) continue;
      if (cls === 'good') { g.fillStyle = COL.ink; g.fillRect(x, y, w, h); }
      else if (cls === 'fair') { g.fillStyle = rgba(COL.ink, 0.38); g.fillRect(x, y, w, h); }
      else if (cls === 'V') { g.fillStyle = COL.refu; g.fillRect(x, y, w, h); }
      else if (cls === 'I') { g.strokeStyle = COL.refd; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); }
      else if (cls === 'W') { g.fillStyle = rgba(COL.ink3, 0.5); g.fillRect(x + w / 2 - 1, y + h / 2 - 1, 2, 2); }
      else { g.fillStyle = COL.rule; g.fillRect(x, y + h / 2, w, 1); }
    }
  });
  g.fillStyle = COL.ink; g.fillRect(L + A.hour * cw + cw / 2 - 0.75, 0, 1.5, H);
  cv.onclick = function (e) { var rr = cv.getBoundingClientRect(); var i = Math.floor((e.clientX - rr.left - L) / ((rr.width - L - R) / N)); if (i >= 0 && i < N) setHour(i); };
}
function tideAt(i) {
  var O = A.day.ocean; if (!O || !O.times) return null;
  var k = O.times.indexOf(A.day.steps[i].t); if (k < 0) return null;
  var lv = O.level[k]; if (lv == null || isNaN(lv)) return null;
  var a = O.level[Math.max(0, k - 1)], z = O.level[Math.min(O.level.length - 1, k + 1)];
  return { level: lv, trend: z > a ? (LANG.cur === 'pt' ? 'subindo' : 'rising') : (LANG.cur === 'pt' ? 'descendo' : 'falling') };
}
function sstAt(i) { var O = A.day.ocean; if (!O || !O.sst) return null; var k = O.times.indexOf(A.day.steps[i].t); return k < 0 ? null : O.sst[k]; }
function shareBeach(b) {
  var i = A.hour, c = b.rows[i].c;
  var good = ACTS.filter(function (a) { var s = stOf(b, i, a); return s && s.cls === 'good'; }).map(function (a) { return t('act_' + a).toLowerCase(); });
  var text = b.name + ' · ' + whenLong(i) + ': ' + (c.hb == null ? '' : t('waves') + ' ' + metres(c.hb) + ', ') + t('wind') + ' ' + num(c.wind.U * KN, 0) + ' ' + t('knots') + (good.length ? ' · ' + good.join(', ') : '');
  var url = location.origin + location.pathname + '#praia=' + slug(b.name) + '&t=' + A.day.steps[i].t;
  if (navigator.share) navigator.share({ title: 'Swell — ' + b.name, text: text, url: url }).catch(function () {});
  else (navigator.clipboard ? navigator.clipboard.writeText(text + ' ' + url) : Promise.reject()).then(function () { toastMsg(t('copied')); }, function () { toastMsg(url, 8000); });
}

/* ================================================================ the clock: only the reader moves it */
function chooseDay(d) {
  var h = A.hour != null ? localHour(A.hour) : 9;
  var same = d.idx.filter(function (i) { return localHour(i) === h && A.fc.daylight[i] && !(d === A.fc.days[0] && i < A.fc.now); })[0];
  var day = d.idx.filter(function (i) { return A.fc.daylight[i] && !(d === A.fc.days[0] && i < A.fc.now); });
  var near = day.slice().sort(function (x, y) { return Math.abs(localHour(x) - 9) - Math.abs(localHour(y) - 9); })[0];
  setHour(same != null ? same : near != null ? near : d.idx[0]);
}
function setHour(i) {
  A.hour = i; A.dayRef = dayOf(i) || A.dayRef; setHash();
  renderTop(); renderDays(); renderHourRow();
  if (A.sel) renderCard(); else renderList();
  paintLabels(); drawCurrents(); drawTimeline();
  clearTimeout(UI.timer); UI.timer = setTimeout(function () { setWaveHour(i); }, 120);
}
/* the default: the step now if it is daylight, otherwise the next daylight step */
function defaultHour() {
  var i = A.fc.now;
  if (A.fc.daylight[i]) return i;
  for (var k = i; k < A.fc.N; k++) if (A.fc.daylight[k]) return k;
  return i;
}

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
  $('[data-tab="beaches"]').textContent = t('tab_beaches'); $('[data-tab="week"]').textContent = t('tab_week'); $('[data-tab="map"]').textContent = t('tab_map');
  moveTabLine();
}
function openSOS() { $('#sw-sheet-sos').hidden = false; $('#sw-sheet-how').hidden = true; $('#sw-sheet-board').hidden = true; }
function renderSOS() {
  var nums = [['193', 'n193'], ['190', 'n190'], ['192', 'n192'], ['185', 'n185'], ['199', 'n199']];
  $('#sw-sos-body').innerHTML = '<p class="sw-note">' + t('sosNote') + '</p>' + nums.map(function (x) { return '<a class="sw-tel" href="tel:' + x[0] + '"><b>' + x[0] + '</b><span>' + t(x[1]) + '</span></a>'; }).join('');
}
function renderHow() { $('#sw-how-body').innerHTML = legendHTML(true) + (CFG.how[LANG.cur] || CFG.how.pt); }
/* the legend: the icon grammar, drawn with the icons themselves */
function legendHTML(wide) {
  var st = ['good', 'fair', 'poor', 'V', 'I', 'W'];
  return '<div class="sw-legend2' + (wide ? ' wide' : '') + '">' + (wide ? '<h3>' + t('legendH') + '</h3>' : '') + st.map(function (x) {
    return '<span title="' + esc(t('st_' + x)) + '"><b class="sw-ai ' + x + '">' + svgIcon('surf', 12) + '</b>' + t((wide ? 'st_' : 'sh_') + x) + '</span>'; }).join('') + (wide ? '<p class="sw-note">' + t('legendNote') + '</p>' : '') + '</div>';
}
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
  }).join('') + legendHTML(true);
  $('#sw-layers-body').querySelectorAll('input').forEach(function (inp) { inp.onchange = function () {
    A.layers[inp.dataset.layer] = inp.checked; document.body.classList.toggle('pois-off', !A.layers.pois); drawCurrents(); if (A.map) A.map.triggerRepaint();
  }; });
  mapNote();
}
function mapNote() { var el = $('#sw-map-note'); if (!el) return; var s = WV.speed || 1; el.textContent = s > 1.5 ? t('mapNoteFast', { x: Math.round(s) }) : t('mapNoteReal'); }
function renderLegend() {
  $('#sw-tl-legend').innerHTML = [['wv', 'lg_waves'], ['bd', 'lg_band'], ['', 'lg_wind'], ['td', 'lg_tide']].map(function (x) { return '<i class="' + x[0] + '"></i><span>' + t(x[1]) + '</span>'; }).join('');
}
function applyStrings() {
  document.documentElement.lang = LANG.cur === 'pt' ? 'pt-BR' : 'en';
  $('#sw-how').innerHTML = svgIcon('info', 16) + '<span>' + t('how') + '</span>'; $('#sw-how').title = t('how');
  $('#sw-boardb').innerHTML = svgIcon('board', 16) + '<span>' + t('board') + '</span>';
  $('#sw-sos').innerHTML = svgIcon('sos', 15) + '<span>' + t('sos') + '</span>';
  $('#sw-now').textContent = t('now'); $('#sw-tl-now').textContent = t('now');
  $('#sw-how-title').textContent = t('how'); $('#sw-sos-title').textContent = t('sosTitle'); $('#sw-board-title').textContent = t('board');
  $('#sw-intro-sub').textContent = t('introSub');
  $('#sw-legend').innerHTML = legendHTML(false);
  document.querySelectorAll('[data-close]').forEach(function (el) { el.textContent = t('close'); });
  document.querySelectorAll('.sw-lang button').forEach(function (b) { b.classList.toggle('on', b.dataset.lang === LANG.cur); });
  renderHow(); renderSOS(); renderLayers(); renderLegend(); renderTabLabels(); if (A.day) renderBoard();
}
function toastMsg(msg, ms) { var el = $('#sw-toast'); el.textContent = msg; el.style.display = 'block'; clearTimeout(UI.toast); if (ms !== 0) UI.toast = setTimeout(function () { el.style.display = 'none'; }, ms || 4000); }
var slug = function (s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-'); };
function setHash() {
  var parts = [];
  if (A.sel) parts.push('praia=' + slug(A.sel));
  if (A.focus) parts.push('foco=' + A.focus);
  if (A.ready && A.hour != null && A.hour !== defaultHour()) parts.push('t=' + A.day.steps[A.hour].t);
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
  var peek = function () { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sw-peek')) || 268; };
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
  $('#sw-sea').addEventListener('click', function () { if (UI.phone.matches && UI.sheet === 'peek') setSheet('half'); });
}
var VIEW = [[-48.62, -27.86], [-48.33, -27.37]];
function fitIsland(duration) {
  if (!A.map) return;
  var pad = UI.phone.matches ? { top: 60, bottom: 280, left: 12, right: 12 } : { top: 70, left: 24, bottom: 24, right: 420 + 28 + 14 };
  A.map.fitBounds(VIEW, { padding: pad, duration: duration || 0 });
}
function setMapPadding() { if (!A.map) return; if (UI.phone.matches) A.map.setPadding({ top: 50, bottom: UI.sheet === 'peek' ? 268 : UI.sheet === 'half' ? Math.round(innerHeight * 0.6) : 0, left: 0, right: 0 }); else A.map.setPadding({ top: 60, left: 0, bottom: 0, right: 420 + 28 }); }

/* ================================================================ the week tab */
var TL = { drag: false };
function tlSeries() {
  var N = A.fc.N, b = A.sel && A.beaches.filter(function (x) { return x.name === A.sel; })[0];
  var S2 = { b: b, waves: [], band: [], wind: [], gust: [], tide: [] };
  for (var i = 0; i < N; i++) {
    if (b) { var c = b.rows[i].c, bd = bandOfWaves(c); S2.waves.push(c.hb == null ? 0 : c.hb); S2.band.push(bd ? [bd[0] / 100, bd[1] / 100] : null); S2.wind.push(c.wind.U * KN); S2.gust.push(c.wind.gust * KN); }
    else {
      var s = A.day.sea[i], w = S.windAt(A.day, i, -48.47, -27.6) || { U: 0, gust: 0 };
      S2.waves.push(s.size || 0); S2.band.push(s.lo != null ? [s.lo, s.hi] : null); S2.wind.push(w.U * KN); S2.gust.push(w.gust * KN);
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
  var N = A.fc.N, Sr = tlSeries(), L = 34, R = 58, top = 18, bot = H - 18, tideH = 14, plotB = bot - tideH - 6;
  var X = function (i) { return L + (W - L - R) * (i + 0.5) / N; }, cw = (W - L - R) / N;
  var ff = getComputedStyle(document.body).fontFamily;
  for (var i = 0; i < N; i++) {
    if (!A.fc.daylight[i]) { g.fillStyle = rgba(COL.paper, 0.65); g.fillRect(X(i) - cw / 2, top - 4, cw + 0.5, bot - top + 4); }
    var d = dayOf(i);
    if (d && d.idx[0] === i) { if (i) { g.fillStyle = rgba(COL.ink, 0.10); g.fillRect(Math.round(X(i) - cw / 2), 0, 1, bot); } g.font = '600 10.5px ' + ff; g.fillStyle = d === A.dayRef ? COL.ink : COL.ink4; var nm = cap(dayName(d)); g.fillText(cw * d.idx.length < 64 ? nm.slice(0, 3) : nm, X(i) - cw / 2 + 4, 10); }
  }
  var hmax = Math.max.apply(null, [1].concat(Sr.waves, Sr.band.map(function (b) { return b ? b[1] : 0; }))) * 1.12, umax = Math.max.apply(null, [15].concat(Sr.gust)) * 1.05;
  var Yh = function (v) { return plotB - (plotB - top) * v / hmax; }, Yu = function (v) { return plotB - (plotB - top) * v / umax; };
  g.beginPath(); var st = false;
  Sr.band.forEach(function (b, j) { if (!b) return; if (st) g.lineTo(X(j), Yh(b[1])); else { g.moveTo(X(j), Yh(b[1])); st = true; } });
  for (var j3 = N - 1; j3 >= 0; j3--) if (Sr.band[j3]) g.lineTo(X(j3), Yh(Sr.band[j3][0]));
  if (st) { g.closePath(); g.fillStyle = rgba(COL.c2, 0.22); g.fill(); }
  g.beginPath(); Sr.waves.forEach(function (v, j) { if (j) g.lineTo(X(j), Yh(v)); else g.moveTo(X(j), Yh(v)); }); g.strokeStyle = rgba(COL.c2, 0.95); g.lineWidth = 1.3; g.stroke();
  g.beginPath(); Sr.gust.forEach(function (v, j) { if (j) g.lineTo(X(j), Yu(v)); else g.moveTo(X(j), Yu(v)); }); g.strokeStyle = rgba(COL.ink, 0.28); g.lineWidth = 0.8; g.stroke();
  g.beginPath(); Sr.wind.forEach(function (v, j) { if (j) g.lineTo(X(j), Yu(v)); else g.moveTo(X(j), Yu(v)); }); g.strokeStyle = COL.ink; g.lineWidth = 1.5; g.stroke();
  var tv = Sr.tide.filter(function (v) { return v != null; });
  if (tv.length) {
    var lo = Math.min.apply(null, tv), hi = Math.max.apply(null, tv), y0 = bot - tideH;
    g.beginPath(); var st2 = false; Sr.tide.forEach(function (v, j) { if (v == null) return; var y = y0 + tideH - tideH * (v - lo) / Math.max(0.2, hi - lo); if (st2) g.lineTo(X(j), y); else { g.moveTo(X(j), y); st2 = true; } });
    g.strokeStyle = COL.ink4; g.lineWidth = 1; g.stroke();
  }
  g.strokeStyle = rgba(COL.ink3, 0.9); g.setLineDash([2, 3]); g.lineWidth = 1; g.beginPath(); g.moveTo(X(A.fc.now), top - 2); g.lineTo(X(A.fc.now), bot); g.stroke(); g.setLineDash([]);
  g.fillStyle = COL.ink; g.fillRect(Math.round(X(A.hour)) - 1, top - 4, 2, bot - top + 6);
  g.font = '500 10px ' + ff;
  var lab = function (txt, y, col) { g.fillStyle = col; g.fillText(txt, W - R + 8, Math.max(top + 6, Math.min(bot, y + 3))); };
  var i0 = A.hour;
  lab(num(Sr.waves[i0], 1) + ' m', Yh(Sr.waves[i0]), COL.c2);
  lab(num(Sr.wind[i0], 0) + ' ' + t('knots'), Yu(Sr.wind[i0]) - (Math.abs(Yu(Sr.wind[i0]) - Yh(Sr.waves[i0])) < 12 ? 12 : 0), COL.ink);
  lab(t('tide').toLowerCase(), bot - 4, COL.ink4);
  var where = Sr.b ? Sr.b.name : t('tlIsland'), bd = Sr.band[i0];
  $('#sw-tl-line').innerHTML = '<b>' + whenLong(i0) + '</b><span>' + (Sr.b ? t('tlShore') : t('tlIsland')) + ' ' + metres(Sr.waves[i0]) + (bd ? ' (' + num(bd[0], 1) + '–' + num(bd[1], 1) + ')' : '') + '</span><span>' + t('wind') + ' ' + num(Sr.wind[i0], 0) + ' ' + t('knots') + '</span>' + (Sr.tide[i0] != null ? '<span>' + t('tide').toLowerCase() + ' ' + (Sr.tide[i0] >= 0 ? '+' : '−') + metres(Math.abs(Sr.tide[i0]), 2) + '</span>' : '');
  $('#sw-tl-scope').textContent = Sr.b ? where : t('tlScopeIsland');
  $('#sw-grid-h').textContent = t('gridH');
  $('#sw-grid-n').textContent = Sr.b ? t('gridBeach', { beach: Sr.b.name }) : t('gridIsland');
  drawGrid($('#sw-tl-grid'), Sr.b || null, false, L, R);
}
function setupTimeline() {
  var cv = $('#sw-tl-chart');
  var hourAt = function (e) { var r = cv.getBoundingClientRect(); return clamp(Math.floor((e.clientX - r.left - 34) / (r.width - 92) * A.fc.N), 0, A.fc.N - 1); };
  cv.addEventListener('pointerdown', function (e) { if (!A.ready) return; TL.drag = true; cv.setPointerCapture(e.pointerId); setHour(hourAt(e)); });
  cv.addEventListener('pointermove', function (e) { if (TL.drag) { var i = hourAt(e); if (i !== A.hour) setHour(i); } });
  cv.addEventListener('pointerup', function () { TL.drag = false; });
  cv.addEventListener('pointercancel', function () { TL.drag = false; });
  $('#sw-tl-prev').onclick = function () { if (A.ready) setHour(Math.max(0, A.hour - 1)); };
  $('#sw-tl-next').onclick = function () { if (A.ready) setHour(Math.min(A.fc.N - 1, A.hour + 1)); };
  $('#sw-tl-now').onclick = function () { if (A.ready) setHour(defaultHour()); };
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
      gl.uniform1f(gl.getUniformLocation(WV.prog, 'u_alpha'), 1.0);
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
  var vis = clamp(9000 / mpp, 1.5, 55), lead = 0.9, I = CFG.island;
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
    el.addEventListener('click', function (e) { e.stopPropagation(); var ic = e.target.closest('.sw-ai'); selectBeach(b.name, true, ic ? ic.dataset.tip.split('|')[1] : null); });
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
/* how much a beach has to say at this step: the more activities good there (the highlighted one first), the earlier its
   label is placed when labels would overlap */
function weightOf(b) {
  var i = A.hour, w = 0;
  ACTS.forEach(function (a) { var st = stOf(b, i, a); if (!st) return; var v = st.cls === 'good' ? 2 : st.cls === 'fair' ? 1 : st.cls === 'V' ? 1.5 : 0; w += A.focus === a ? 10 * v : v; });
  return w + (FAV.has(b.name) ? 100 : 0) + (b.name === A.sel ? 1000 : 0);
}
function declutterLabels() {
  if (!A.map || A.hour == null) return;
  var order = PL.beachM.map(function (o) { return { o: o, s: weightOf(o.b) }; }).sort(function (x, y) { return y.s - x.s; });
  var placed = [];
  order.forEach(function (x) {
    var o = x.o, pt = A.map.project([o.b.lon, o.b.lat]), w = o.el.getBoundingClientRect().width || 90;
    var hit = placed.some(function (r) { return pt.x < r[0] + r[2] + 6 && pt.x + w + 6 > r[0] && Math.abs(pt.y - r[1]) < 20; });
    o.el.classList.toggle('hidden', hit); if (!hit) placed.push([pt.x, pt.y, w]);
  });
}
/* each pin: a neutral dot, the name, and the activities worth naming there at this step (good, doable, decided danger,
   caution, a forecast warning) in the icons' grammar — the highlighted activity first; beaches where it is not good are
   dimmed, never moved */
function paintLabels() {
  if (!PL.beachM.length || A.hour == null) return;
  var i = A.hour;
  PL.beachM.forEach(function (x) {
    var b = x.b, el = x.el, c = b.rows[i].c;
    var list = ACTS.map(function (a) { return { a: a, st: stOf(b, i, a) }; }).filter(function (o) { return o.st && /good|fair|V|I|W/.test(o.st.cls); });
    list.sort(function (p, q) { return (q.a === A.focus) - (p.a === A.focus) || RANK[q.st.cls] - RANK[p.st.cls]; });
    var dim = A.focus && !list.some(function (o) { return o.a === A.focus && (o.st.cls === 'good' || o.st.cls === 'fair'); });
    el.classList.toggle('off', !!dim); el.classList.toggle('sel', b.name === A.sel);
    el.dataset.r = c.waves.refused ? '1' : '';
    var ic = el.querySelector('.ic'), key = list.map(function (o) { return o.a + o.st.cls; }).join('|') + (A.focus || '');
    if (ic.dataset.key !== key) { ic.dataset.key = key; ic.innerHTML = list.slice(0, 4).map(function (o) { return iconHTML(b, i, o.a, 11); }).join(''); }
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

/* ================================================================ boot */
function boot() {
  colors();
  try { var f0 = localStorage.getItem('swell.focus'); if (f0 && S.RULES[f0]) A.focus = f0; } catch (e) {}
  var hf = (location.hash.match(/foco=(\w+)/) || [])[1]; if (hf && S.RULES[hf]) A.focus = hf;
  $('#sw-sea').textContent = t('loading');
  applyStrings(); setupTips();
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
  document.querySelectorAll('.sw-lang button').forEach(function (b) { b.onclick = function () { setLang(b.dataset.lang); applyStrings(); if (A.ready) setHour(A.hour); }; });
  var sheets = ['how', 'sos', 'board'];
  sheets.forEach(function (k) { var btn = $(k === 'board' ? '#sw-boardb' : '#sw-' + k); btn.onclick = function () { var el = $('#sw-sheet-' + k), was = el.hidden; sheets.forEach(function (o) { $('#sw-sheet-' + o).hidden = true; }); el.hidden = !was; }; });
  document.querySelectorAll('.sw-tab').forEach(function (b) { b.onclick = function () { setTab(b.dataset.tab); }; });
  document.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { b.closest('.sw-sheet').hidden = true; }; });
  $('#sw-hour').oninput = function (e) { var i = A.dayRef.idx[+e.target.value]; if (i != null) setHour(i); };
  $('#sw-now').onclick = function () { setHour(defaultHour()); };
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
    var today = todayStr().replace(/-/g, '');
    if (day.run.slice(0, 8) < today) toastMsg(t('stale', { run: day.run.slice(6, 8) + '/' + day.run.slice(4, 6) }), 9000);
    return recheck();
  }).then(function () {
    A.ready = true; renderBoard();
    placesSetup();
    var ht = (location.hash.match(/t=([0-9T-]+)/) || [])[1], hi = ht ? A.day.steps.findIndex(function (s) { return s.t === ht; }) : -1;
    var want = (location.hash.match(/praia=([\w-]+)/) || [])[1], wb = want && A.beaches.filter(function (b) { return slug(b.name) === want; })[0];
    setHour(hi >= 0 && dayOf(hi) ? hi : defaultHour());
    if (wb) selectBeach(wb.name);
    $('#sw-intro').classList.add('gone');
  }).catch(function (e) {
    console.error(e); $('#sw-sea').textContent = t('fcFail'); $('#sw-intro-sub').textContent = t('fcFail');
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
