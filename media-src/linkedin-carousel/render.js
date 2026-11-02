const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1350}});
await p.goto('file://'+process.cwd()+'/carousel.html');await p.waitForTimeout(800);
const n=await p.$$eval('.s',e=>e.length);
for(let i=0;i<n;i++){const el=(await p.$$('.s'))[i];await el.screenshot({path:`s${i+1}.png`})}
await p.pdf({path:'clearwren-confluence-accessibility-carousel.pdf',width:'1080px',height:'1350px',printBackground:true,preferCSSPageSize:true});
// overflow check
const o=await p.$$eval('.s',els=>els.map((s,i)=>{const r=s.getBoundingClientRect();let bad=[];s.querySelectorAll('*').forEach(c=>{const q=c.getBoundingClientRect();if(q.bottom>r.bottom-40&&!c.closest('.foot')&&q.height>0&&c!==s)bad.push(c.tagName)});return [i+1,bad.length]}));
console.log(JSON.stringify(o));await b.close()})();
