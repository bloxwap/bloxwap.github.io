// usage: node shoot.mjs <baseUrl> <outDir> <label>
import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
const [base,out,label]=process.argv.slice(2);mkdirSync(out,{recursive:true});
const pages=[['home','/'],['developers','/developers/'],['privacy','/privacy/'],['404','/does-not-exist']];
const browser=await chromium.launch();const report={};
for(const [w,h,tag] of [[1440,900,'desktop'],[390,844,'390'],[320,640,'320'],[640,800,'640-200pct']]){
  const ctx=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:tag==='desktop'?1:2});
  for(const [name,path] of pages){
    const page=await ctx.newPage();const bytes={css:0,font:0,img:0,html:0,other:0};const fonts=new Set();
    page.on('response',async r=>{try{const b=(await r.body()).length;const t=r.request().resourceType();const k=t==='stylesheet'?'css':t==='font'?'font':t==='image'?'img':t==='document'?'html':'other';bytes[k]+=b;if(t==='font')fonts.add(new URL(r.url()).pathname);}catch{}});
    await page.goto(base+path,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
    const m=await page.evaluate(()=>({scrollW:document.documentElement.scrollWidth,clientW:document.documentElement.clientWidth,bodyFont:getComputedStyle(document.body).fontFamily,h1Font:getComputedStyle(document.querySelector('h1')).fontFamily,loaded:[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family+' '+f.style)}));
    if(tag==='desktop'||tag==='390')await page.screenshot({path:`${out}/${label}-${name}-${tag}.png`,fullPage:true});
    report[`${name}@${tag}`]={...m,overflow:m.scrollW>m.clientW,bytes,fonts:[...fonts]};
    await page.close();
  }
  await ctx.close();
}
// keyboard: tab through home, record focus outline of first 4 focusables
const ctx=await browser.newContext({viewport:{width:1440,height:900}});const page=await ctx.newPage();await page.goto(base+'/',{waitUntil:'networkidle'});
const focus=[];for(let i=0;i<4;i++){await page.keyboard.press('Tab');focus.push(await page.evaluate(()=>{const e=document.activeElement;const s=getComputedStyle(e);return {tag:e.tagName,text:(e.textContent||e.getAttribute('alt')||'').trim().slice(0,30),href:e.getAttribute('href'),outline:`${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}`,offset:s.outlineOffset};}));}
await page.screenshot({path:`${out}/${label}-home-keyboard-focus.png`});
report.keyboard=focus;await browser.close();
writeFileSync(`${out}/${label}-report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report.keyboard,null,1));
for(const [k,v] of Object.entries(report))if(k!=='keyboard')console.log(k,'overflow='+v.overflow,'h1='+v.h1Font.slice(0,40),'css='+v.bytes.css,'font='+v.bytes.font);
