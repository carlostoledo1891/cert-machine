// the four X cards: 1600x900 CSS px at 1.5x -> 2400x1350
const fs=require('fs'),path=require('path');
const ROOT='/Users/carlostoledo/Projects/cert-machine', HERE=__dirname;
const { withChrome, settle } = require(ROOT+'/design/cdp.js');
const L=JSON.parse(fs.readFileSync(ROOT+'/certs/ramsey-ledger.json','utf8'));
const fmt=(n)=>n.toLocaleString('en-US');
const FONT='<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">';
const css=(dark)=>`*{box-sizing:border-box;margin:0}html,body{width:1600px;height:900px;overflow:hidden}
body{background:${dark?'#0a0a0c':'#ffffff'};color:${dark?'#f6f6f8':'#000'};font-family:Inter,sans-serif;padding:64px 72px;position:relative}
.k{font:500 15px 'JetBrains Mono',monospace;letter-spacing:.16em;text-transform:uppercase;color:${dark?'#9a9aa6':'#4d4d4d'}}
h1{font-weight:600;letter-spacing:-.025em;line-height:1.04}
.sub{font-size:26px;line-height:1.35;color:${dark?'#c9c9d2':'#262626'}}
.big{font-weight:600;font-size:120px;letter-spacing:-.04em;line-height:1}
.foot{position:absolute;left:72px;bottom:52px;font:500 16px 'JetBrains Mono',monospace;letter-spacing:.14em;color:${dark?'#9a9aa6':'#4d4d4d'}}
img{display:block}`;
const page=(dark,body)=>`<!doctype html><meta charset=utf-8>${FONT}<style>${css(dark)}</style><body>${body}</body>`;

/* Ramsey: every released graph by its order and the search it took; the unfinished one a hatched void */
function ramseySvg(){
  const W=1456,H=560,ml=120,mr=330,mt=20,mb=70,pw=W-ml-mr,ph=H-mt-mb;
  const lx=(v)=>ml+(Math.log10(v)-Math.log10(40))/(Math.log10(1300)-Math.log10(40))*pw;
  const ly=(v)=>mt+ph-(Math.log10(v)-3)/(12-3)*ph;
  let s=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="JetBrains Mono, monospace">
  <defs><pattern id="h" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="10" stroke="#8a8a8a" stroke-width="2"/></pattern></defs>`;
  for(const e of [3,6,9,12]){const y=ly(10**e);s+=`<line x1="${ml}" x2="${ml+pw}" y1="${y}" y2="${y}" stroke="#e4e4e4"/><text x="${ml-14}" y="${y+6}" text-anchor="end" font-size="17" fill="#4d4d4d">${{3:'1 thousand',6:'1 million',9:'1 billion',12:'1 trillion'}[e]}</text>`;}
  for(const v of [50,100,200,500,1000]){const x=lx(v);s+=`<line x1="${x}" x2="${x}" y1="${mt+ph}" y2="${mt+ph+8}" stroke="#4d4d4d"/><text x="${x}" y="${mt+ph+32}" text-anchor="middle" font-size="17" fill="#4d4d4d">${v}</text>`;}
  s+=`<line x1="${ml}" x2="${ml+pw}" y1="${mt+ph}" y2="${mt+ph}" stroke="#000" stroke-width="1.5"/>`;
  s+=`<text x="${ml+pw/2}" y="${H-4}" text-anchor="middle" font-size="17" fill="#262626">vertices in the released graph</text>`;
  const cert=L.rows.filter(r=>r.verdict==='CERTIFIED'), ref=L.rows.filter(r=>r.verdict!=='CERTIFIED');
  if(cert.length!==17||ref.length!==1) throw new Error('ledger moved: '+cert.length+'/'+ref.length);
  for(const r of ref){const x=lx(r.n);s+=`<rect x="${x-14}" y="${mt}" width="28" height="${ph}" fill="url(#h)"/>
    <text x="${x+28}" y="${mt+40}" font-size="20" font-weight="500" fill="#000">${r.claim.replace(' >= ',' ≥ ')}</text>
    <text x="${x+28}" y="${mt+68}" font-size="17" fill="#262626">still searching:</text>
    <text x="${x+28}" y="${mt+92}" font-size="17" fill="#262626">REFUSED, not assumed</text>`;}
  let top=null;
  for(const r of cert){const x=lx(r.n),y=ly(r.I.nodes);s+=`<circle cx="${x}" cy="${y}" r="8" fill="#000"/>`;if(!top||r.I.nodes>top.I.nodes)top=r;}
  const first=cert.reduce((a,b)=>a.n<b.n?a:b);
  s+=`<text x="${lx(first.n)+16}" y="${ly(first.I.nodes)+28}" font-size="17" fill="#262626">${first.claim.replace(' >= ',' ≥ ')}</text>`;
  s+=`<text x="${lx(top.n)-18}" y="${ly(top.I.nodes)-8}" text-anchor="end" font-size="17" fill="#262626">${top.claim.replace(' >= ',' ≥ ')}: ${fmt(top.I.nodes)} nodes</text>`;
  s+=`<text x="${lx(900)}" y="${mt+ph-18}" text-anchor="end" font-size="17" fill="#262626">y: search nodes to close the independent-set side</text>`;
  return {svg:s+'</svg>', top};
}
const R=ramseySvg();
const cards={
 'x-verify':page(false,`<div class=k>carlostoledo.co/verify</div>
  <h1 style="font-size:58px;margin-top:18px">AI now publishes faster than anyone can check.</h1>
  <img src="f-verify.png" style="width:1290px;margin:30px 0 0 80px">`),
 'x-blackhole':page(true,`<div style="width:640px">
  <div class=k>M87* · the Event Horizon Telescope's black hole</div>
  <h1 style="font-size:60px;margin-top:22px">Every line says what it rests on.</h1>
  <div class=sub style="margin-top:30px">The shadow's edge: the one solid line, decided in interval arithmetic.<br><br>The image: computed, ray by ray, through the Kerr metric.<br><br>The disk: assumed. The jet: a dotted sketch.</div></div>
  <img src="f-bh.png" style="position:absolute;right:64px;top:64px;width:790px;height:770px;object-fit:cover">
  <div class=foot>CARLOSTOLEDO.CO/INSTRUMENTS/BLACK-HOLE</div>`),
 'x-ramsey':page(false,`<div class=k>AlphaEvolve's Ramsey graphs, decided from the definition</div>
  <h1 style="font-size:58px;margin-top:18px">18 graphs released. 17 proved. 1 still searching.</h1>
  <div style="margin-top:34px">${R.svg}</div>
  <div class=foot style="left:auto;right:72px">EACH DOT: NO FORBIDDEN CLIQUE OR INDEPENDENT SET, SEARCHED TO THE END · CARLOSTOLEDO.CO</div>`),
 'x-selfaudit':page(false,`<div style="width:700px">
  <div class=k>the self-audit</div>
  <h1 style="font-size:58px;margin-top:22px">I fed my own verifier 322 planted false values.</h1>
  <div class=big style="margin-top:56px">0 certified.</div><div class=sub style="margin-top:22px;width:600px">A float check at a 10⁻⁶ tolerance let 82 of 295 through.</div></div>
  <img src="f-selfaudit.png" style="position:absolute;right:72px;top:250px;width:760px">
  <div class=foot>CARLOSTOLEDO.CO/REPORTS/SELFAUDIT</div>`),
};
for(const [n,h] of Object.entries(cards)) fs.writeFileSync(path.join(HERE,n+'.html'),h);
withChrome(async (send)=>{
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1600,height:900,deviceScaleFactor:1.5,mobile:false});
  for(const n of Object.keys(cards)){
    await send('Page.navigate',{url:'file://'+path.join(HERE,n+'.html')});await settle(2500);
    const s=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(HERE,n+'.png'),Buffer.from(s.data,'base64'));console.log(n);
  }
},{port:9234}).catch(e=>{console.error(e);process.exit(1)});
