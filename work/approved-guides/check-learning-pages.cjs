const puppeteer=require('/Users/hammad/.codex/skills/video-effects/node_modules/puppeteer');
const fs=require('fs');
const out='/Users/hammad/withhammad-video-pipeline/work/approved-guides';
(async()=>{
 const browser=await puppeteer.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox']});
 const checks=[];
 for(const width of [390,1280]){
  const page=await browser.newPage();await page.setCacheEnabled(false);await page.setViewport({width,height:900,deviceScaleFactor:1});
  for(const slug of ['ai-agent-developer-learning-plan','vector-databases-explained']){
   const errors=[];page.on('pageerror',e=>errors.push(String(e)));
   const res=await page.goto('http://127.0.0.1:3192/resources/'+slug,{waitUntil:'networkidle2'});
   await page.evaluate(async()=>{await Promise.all(Array.from(document.images).map(im=>im.decode().catch(()=>{})))});
   const d=await page.evaluate(()=>({title:document.title,description:document.querySelector('meta[name=description]')?.content,canonical:document.querySelector('link[rel=canonical]')?.href,h1:Array.from(document.querySelectorAll('h1')).map(x=>x.textContent),overflow:document.documentElement.scrollWidth>innerWidth,schemas:Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(x=>JSON.parse(x.textContent)),images:Array.from(document.querySelectorAll('figure img')).map(x=>({loaded:x.complete&&x.naturalWidth>0,alt:x.alt})),inlineLinks:Array.from(document.querySelectorAll('main p a')).map(x=>x.href)}));
   if(res.status()!==200||d.h1.length!==1||d.overflow||d.title.length>60||d.description.length>155||!d.images.every(x=>x.loaded)||errors.length)throw Error(JSON.stringify({slug,width,status:res.status(),errors,...d}));
   await page.screenshot({path:`${out}/${slug}-${width}.png`,fullPage:true});
   checks.push({slug,width,status:res.status(),errors,...d});
  }
  await page.goto('http://127.0.0.1:3192/resources',{waitUntil:'networkidle2'});
  const index=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,links:['ai-agent-developer-learning-plan','vector-databases-explained'].map(s=>!!document.querySelector(`a[href="/resources/${s}"]`))}));
  if(index.overflow||!index.links.every(Boolean))throw Error('Resource index failed');
  checks.push({index:true,width,...index});await page.close();
 }
 const page=await browser.newPage();const response=await page.goto('http://127.0.0.1:3192/sitemap.xml');const xml=await response.text();
 for(const slug of ['ai-agent-developer-learning-plan','vector-databases-explained'])if(!xml.includes('/resources/'+slug))throw Error('Missing sitemap route '+slug);
 checks.push({sitemap:true,status:response.status()});
 fs.writeFileSync(`${out}/learning-browser-checks.json`,JSON.stringify(checks,null,2));
 console.log(JSON.stringify(checks.map(({schemas,inlineLinks,...x})=>x),null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
