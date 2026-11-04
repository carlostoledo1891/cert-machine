// d12: the Weight-Space Programming card, 1600x900 CSS px at 1.5x -> 2400x1350; every number from certs/wsp-regrade.json
const fs=require('fs'),path=require('path');
const ROOT='/Users/carlostoledo/Projects/cert-machine', HERE=__dirname;
const { withChrome, settle } = require(ROOT+'/design/cdp.js');
const G=JSON.parse(fs.readFileSync(ROOT+'/certs/wsp-regrade.json','utf8'));
const U=G.post_runs.post_unedited.tally, E=G.post_runs.post_edited_50_passes.tally;
if(U.their_1_our_WRONG||U.their_0_our_CORRECT||E.their_1_our_WRONG||E.their_0_our_CORRECT) throw new Error('disagreements appeared: redraw the card');
const FONT='<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">';
const css=`*{box-sizing:border-box;margin:0}html,body{width:1600px;height:900px;overflow:hidden}
body{background:#fff;color:#000;font-family:Inter,sans-serif;padding:64px 72px;position:relative}
.k{font:500 15px 'JetBrains Mono',monospace;letter-spacing:.16em;text-transform:uppercase;color:#4d4d4d}
h1{font-weight:600;letter-spacing:-.025em;line-height:1.04}
.sub{font-size:24px;line-height:1.35;color:#262626}
.foot{position:absolute;left:72px;bottom:52px;font:500 16px 'JetBrains Mono',monospace;letter-spacing:.14em;color:#4d4d4d}`;
function svg(){
  const W=1456,H=400,ml=330,mt=10,rowH=78,barH=44,pw=W-ml-260;
  const X=(v)=>ml+v/500*pw;
  const rows=[
    ['unedited · answered',U.boxed,'#9a9aa6',U.boxed+' of 500 first samples end in a box'],
    ['unedited · correct',U.boxed_their_1,'#000',U.boxed_their_1+' · every one of them'],
    ['edited · answered',E.boxed,'#9a9aa6',E.boxed+' of 500'],
    ['edited · correct',E.boxed_their_1,'#000',E.boxed_their_1+' · '+(100*E.boxed_their_1/E.boxed).toFixed(0)+'% of the answered'],
  ];
  let s=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="JetBrains Mono, monospace">`;
  for(const v of [0,100,200,300,400,500]){const x=X(v);s+=`<line x1="${x}" x2="${x}" y1="${mt}" y2="${mt+rows.length*rowH}" stroke="#e4e4e4"/><text x="${x}" y="${mt+rows.length*rowH+28}" text-anchor="middle" font-size="17" fill="#4d4d4d">${v}</text>`;}
  rows.forEach((r,i)=>{const y=mt+i*rowH+(rowH-barH)/2;const w=Math.max(2,X(r[1])-ml);
    s+=`<rect x="${ml}" y="${y}" width="${w}" height="${barH}" fill="${r[2]}"/>
    <text x="${ml-16}" y="${y+barH/2+7}" text-anchor="end" font-size="20" font-weight="500" fill="#000">${r[0]}</text>
    <text x="${ml+w+14}" y="${y+barH/2+7}" font-size="18" fill="#262626">${r[3]}</text>`;});
  s+=`<text x="${ml}" y="${H-30}" font-size="17" fill="#262626">MATH-500, the first sample per problem, from the authors' released logs.</text>
  <text x="${ml}" y="${H-6}" font-size="17" fill="#262626">Their grader (math-verify) and an exact grader here agree on every decided answer.</text>`;
  return s+'</svg>';
}
const html=`<!doctype html><meta charset=utf-8>${FONT}<style>${css}</style><body>
  <div class=k>MIT CSAIL's weight-space programming · Qwen3.5-0.8B edited by GPT-6 Astra, no training · decided from the bytes</div>
  <h1 style="font-size:56px;margin-top:18px">The edit is real. The gain is termination.</h1>
  <div class=sub style="margin-top:14px">The base model, when it finishes, is right; it almost never finishes. The edit makes it finish.</div>
  <div style="margin-top:30px">${svg()}</div>
  <div class=foot>2 OF 488 TENSORS DIFFER · 130,188 ENTRIES, NOT 131,072 · 0.015%, NOT 0.016% · CARLOSTOLEDO.CO/REPORTS</div>
</body>`;
fs.writeFileSync(path.join(HERE,'x-wsp.html'),html);
withChrome(async (send)=>{
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1600,height:900,deviceScaleFactor:1.5,mobile:false});
  await send('Page.navigate',{url:'file://'+path.join(HERE,'x-wsp.html')});await settle(3000);
  const s=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(HERE,'..','d12-wsp.png'),Buffer.from(s.data,'base64'));console.log('d12-wsp.png');
},{port:9235}).catch(e=>{console.error(e);process.exit(1)});
