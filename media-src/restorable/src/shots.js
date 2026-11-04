const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();fs.mkdirSync('out',{recursive:true});
const man=fs.readFileSync('manifest.txt','utf8').split('\n').map(l=>l.split(' '));
for(const [k,w,h] of man){const p=await b.newPage({viewport:{width:+w,height:+h}});await p.goto('file://'+process.cwd()+'/'+k+'.html');await p.waitForTimeout(300);await p.screenshot({path:`out/${k}.png`});await p.close()}
const p=await b.newPage({viewport:{width:1080,height:1350}});await p.goto('file://'+process.cwd()+'/carousel-restorable.html');await p.waitForTimeout(400);
await p.pdf({path:'out/restorable-carousel-5-slides.pdf',width:'1080px',height:'1350px',printBackground:true,preferCSSPageSize:true});
const n=await p.$$eval('section',e=>e.length);for(let i=0;i<n;i++){const el=(await p.$$('section'))[i];await el.screenshot({path:`out/carousel-s${i+1}.png`})}
await b.close()})();
