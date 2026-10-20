import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire('/Users/hammad/autonomous-marketing-os/package.json');const {chromium}=require('playwright');
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const root=resolve(import.meta.dirname,'../..');const reports=[];
for(const [name,width,height,src] of [['before',900,1050,'before'],['after',900,1050,'after'],['mobile',390,844,'after']]){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});await page.goto('file://'+root+'/outputs/ai-website-transformation-reel/demo/'+src+'.html');await page.screenshot({path:root+'/studio/remotion/public/website-transformation/'+name+'.png'});
 reports.push({name,...await page.evaluate(()=>({viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,h1:document.querySelector('h1').innerText,cta:document.querySelector('a.cta')?.textContent}))});
 if(name==='mobile'){await page.locator('a.cta').click();reports.at(-1).ctaWorks=(await page.evaluate(()=>location.hash))==='#consultation';}
 await page.close();
}
writeFileSync(root+'/outputs/ai-website-transformation-reel/demo-check.json',JSON.stringify(reports,null,2));await browser.close();
