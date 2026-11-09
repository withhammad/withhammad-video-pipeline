const puppeteer=require('/Users/hammad/.codex/skills/video-effects/node_modules/puppeteer');
const fs=require('fs');const path=require('path');
(async()=>{
 const browser=await puppeteer.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox']});
 const checks=[];const out='/Users/hammad/withhammad-video-pipeline/work/approved-guides';
 for(const width of [390,1280]) {
  const page=await browser.newPage();await page.setCacheEnabled(false);await page.setViewport({width,height:900,deviceScaleFactor:1});
  for(const slug of ['five-open-source-ai-repos','ai-guardrails-explained']){
   const response=await page.goto('http://127.0.0.1:3192/resources/'+slug,{waitUntil:'networkidle2'});
   const details=await page.evaluate(()=>({h1:[...document.querySelectorAll('h1')].map(x=>x.textContent),title:document.title,description:document.querySelector('meta[name=description]')?.content,canonical:document.querySelector('link[rel=canonical]')?.href,overflow:document.documentElement.scrollWidth>innerWidth,schemas:[...document.querySelectorAll('script[type="application/ld+json"]')].map(x=>JSON.parse(x.textContent)),copyButtons:document.querySelectorAll('button').length}));
   if(response.status()!=200||details.h1.length!==1||details.overflow)throw Error(JSON.stringify({slug,width,status:response.status(),...details}));
   await page.screenshot({path:path.join(out,slug+'-'+width+'.png'),fullPage:true});
   checks.push({slug,width,status:response.status(),...details});
  }
  await page.close();
 }
 const page=await browser.newPage();await page.setCacheEnabled(false);await page.setViewport({width:390,height:900});
 for(const url of ['/resources','/blog/five-open-source-ai-repos','/sitemap.xml']){
  const r=await page.goto('http://127.0.0.1:3192'+url,{waitUntil:'networkidle2'});
  const details=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,miniLink:!!document.querySelector('a[href="/resources/build-an-agent-harness"]'),h1:document.querySelectorAll('h1').length}));
  if(r.status()!=200||(url!='/sitemap.xml'&&details.overflow))throw Error(url+JSON.stringify(details));
  checks.push({url,status:r.status(),...details});
 }
 fs.writeFileSync(path.join(out,'repo-guard-browser-checks.json'),JSON.stringify(checks,null,2));
 console.log(JSON.stringify(checks.map(({schemas,...r})=>r),null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
