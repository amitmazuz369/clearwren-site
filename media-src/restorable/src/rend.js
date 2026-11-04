const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();
for(const o of ['h','v']){for(const now of [0,1]){
 const dir=`fr_${o}_${now}`;fs.mkdirSync(dir,{recursive:true});
 const p=await b.newPage({viewport:{width:o==='v'?1080:1920,height:o==='v'?1920:1080}});
 await p.goto('http://localhost:8765'+`/rest.html?o=${o}`);await p.waitForFunction(()=>window.__ready());
 for(let f=0;f<37*30;f++){const d=await p.evaluate(([t,n])=>{window.__draw(t,n);return document.getElementById('c').toDataURL('image/jpeg',0.9)},[f/30,now]);fs.writeFileSync(`${dir}/${String(f).padStart(5,'0')}.jpg`,Buffer.from(d.split(',')[1],'base64'))}
 await p.close();console.log('done',o,now);}}
await b.close()})();
