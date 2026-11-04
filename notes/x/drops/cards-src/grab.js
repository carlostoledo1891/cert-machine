// grab the n-th large FIGURE (or a selector) on a served page, caption hidden, at 2x
const fs=require('fs');
const ROOT='/Users/carlostoledo/Projects/cert-machine';
const { withChrome, settle } = require(ROOT+'/design/cdp.js');
const jobs=[
  {url:'http://127.0.0.1:8765/verify/',theme:'light',sel:'figure',idx:0,out:'f-verify.png'},
  {url:'http://127.0.0.1:8765/verify/',theme:'light',sel:'figure',idx:1,out:'f-selfaudit.png'},
  {url:'http://127.0.0.1:8765/instruments/black-hole/',theme:'dark',sel:'figure.bh-fig',idx:0,out:'f-bh.png',wait:10000},
];
withChrome(async (send)=>{
  await send('Page.enable');
  for (const j of jobs){
    await send('Page.addScriptToEvaluateOnNewDocument',{source:'try{localStorage.setItem("warrant-theme","'+j.theme+'")}catch(e){}'});
    await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:2,mobile:false});
    await send('Page.navigate',{url:j.url});
    await settle(j.wait||5000);
    const r=await send('Runtime.evaluate',{returnByValue:true,expression:`(()=>{document.documentElement.setAttribute('data-theme','${j.theme}');const f=[...document.querySelectorAll('${j.sel}')].filter(e=>e.getBoundingClientRect().width>300)[${j.idx}];f.querySelectorAll('figcaption').forEach(c=>c.style.display='none');[...document.querySelectorAll('*')].forEach(e=>{const p=getComputedStyle(e).position;if(p==='sticky'||p==='fixed')e.style.display='none'});scrollTo(0,0);const b=f.getBoundingClientRect();return {x:b.x,y:b.y+scrollY,w:b.width,h:b.height}})()`});
    await settle(j.wait?4000:800);
    const b=r.result.value;
    const s=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:b.x,y:b.y,width:b.w,height:b.h,scale:1}});
    fs.writeFileSync(j.out,Buffer.from(s.data,'base64'));console.log(j.out,JSON.stringify(b));
  }
},{port:9233}).catch(e=>{console.error(e);process.exit(1)});
