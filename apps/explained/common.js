/* apps/explained/common.js — the script every story page shares: the error hook the smoke test reads, exact rationals over
   BigInt (Q, qdec, qdouble), the small DOM helpers, the reveal/progress/rail/count-up, and the cold open's typing log. The
   builders wrap this and the page's own instruments in one strict IIFE. */
window.__errs=[];window.addEventListener('error',function(e){window.__errs.push(String(e.message)+' @'+e.lineno+':'+e.colno);});
/* ---------------- exact rationals over BigInt ---------------- */
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b){[a,b]=[b,a%b];}return a;};
class Q{constructor(n,d=1n){n=BigInt(n);d=BigInt(d);if(d<0n){n=-n;d=-d;}const g=gcd(n,d)||1n;this.n=n/g;this.d=d/g;}
 add(o){return new Q(this.n*o.d+o.n*this.d,this.d*o.d)} sub(o){return new Q(this.n*o.d-o.n*this.d,this.d*o.d)} mul(o){return new Q(this.n*o.n,this.d*o.d)} div(o){return new Q(this.n*o.d,this.d*o.n)}
 toString(){return this.d===1n?String(this.n):this.n+'/'+this.d} cmp(o){const l=this.n*o.d,r=o.n*this.d;return l<r?-1:l>r?1:0} sign(){return this.n<0n?-1:this.n>0n?1:0} neg(){return new Q(-this.n,this.d)} abs(){return this.n<0n?this.neg():this}
 dec(k,up){const neg=this.n<0n,a=neg?-this.n:this.n,s=10n**BigInt(k);let q=(a*s)/this.d;const rem=(a*s)%this.d;if(up&&rem!==0n&&!neg)q+=1n;const t=q.toString().padStart(k+1,'0');return (neg?'-':'')+t.slice(0,-k)+'.'+t.slice(-k)}
 sci(m){if(this.n===0n)return '0';let v=this.abs(),e=0;const ten=new Q(10n);while(v.cmp(new Q(1n))<0){v=v.mul(ten);e--;}while(v.cmp(ten)>=0){v=v.div(ten);e++;}const sup=String(e).replace(/-/g,'⁻').replace(/\d/g,d=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);return (this.n<0n?'−':'')+v.dec(m)+'·10'+sup}}
const qdec=s=>{s=String(s).trim();let m;if((m=s.match(/^(-?\d+)\/(\d+)$/)))return new Q(m[1],m[2]);if((m=s.match(/^(-?)(\d+)\.(\d+)$/)))return new Q((m[1]+m[2]+m[3]).replace(/^(-?)0+(?=\d)/,'$1'),10n**BigInt(m[3].length));if((m=s.match(/^-?\d+$/)))return new Q(s);throw new Error('not a decimal: '+s)};
const qdouble=x=>{const dv=new DataView(new ArrayBuffer(8));dv.setFloat64(0,x);const bits=dv.getBigUint64(0);const sign=bits>>63n?-1n:1n;const exp=Number((bits>>52n)&0x7ffn);let man=bits&((1n<<52n)-1n);if(exp===0)return new Q(sign*man,1n<<1074n);man|=1n<<52n;const e=exp-1075;return e>=0?new Q(sign*man*(1n<<BigInt(e))):new Q(sign*man,1n<<BigInt(-e))};
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const W=(k,t)=>'<span class="w '+k+'">'+t+'</span>';
const K=t=>'<span class="k">'+t+'</span>',V=t=>'<span class="v">'+t+'</span>';
const group=s=>String(s).replace(/\B(?=(\d{3})+(?!\d))/g,',');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
/* ---------------- reveal, progress, rail, count-up, draw-in ---------------- */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.14});
document.querySelectorAll('.rv,.bar,.draw').forEach(el=>io.observe(el));
const prog=$('prog');const dots=[...document.querySelectorAll('nav.rail a')];const secs=dots.map(a=>document.querySelector(a.getAttribute('href')));
addEventListener('scroll',()=>{const h=document.documentElement;prog.style.width=(100*h.scrollTop/(h.scrollHeight-h.clientHeight))+'%';let cur=0;secs.forEach((s,i)=>{if(s&&s.getBoundingClientRect().top<innerHeight*.45)cur=i;});dots.forEach((d,i)=>d.classList.toggle('on',i===cur));},{passive:true});
{const ioc=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;ioc.unobserve(e.target);const el=e.target,to=Number(String(el.dataset.count).replace(/,/g,''));if(reduced||!Number.isFinite(to))return;const t0=performance.now(),dur=1100;const step=now=>{const u=Math.min(1,(now-t0)/dur),k=1-Math.pow(1-u,3);el.textContent=group(Math.round(to*k));if(u<1)requestAnimationFrame(step);};requestAnimationFrame(step);}),{threshold:.6});document.querySelectorAll('[data-count]').forEach(el=>ioc.observe(el));}
/* ---------------- the cold open: a log that types itself ---------------- */
{const log=$('log');if(log){const lines=log.dataset.lines.split('|');let li=0,ci=0,out='';const cur='<span class="cur"></span>';
 const fmt=l=>{const m=l.match(/^(\S+)\s{2}(.*)$/);return m?'<b>'+esc(m[1])+'</b>  '+esc(m[2]):esc(l)};
 if(reduced){log.innerHTML=lines.map(fmt).join('\n');}
 else{const tick=()=>{if(li>=lines.length){log.innerHTML=lines.map(fmt).join('\n');return;}const l=lines[li];ci++;const done=lines.slice(0,li).map(fmt).join('\n');const m=l.match(/^(\S+)\s{2}(.*)$/);const part=m?'<b>'+esc(m[1])+'</b>  '+esc(m[2].slice(0,Math.max(0,ci-m[1].length-2))):esc(l.slice(0,ci));log.innerHTML=(done?done+'\n':'')+part+cur;if(ci>=l.length){li++;ci=0;setTimeout(tick,420);}else setTimeout(tick,14+Math.random()*22);};setTimeout(tick,900);}}}