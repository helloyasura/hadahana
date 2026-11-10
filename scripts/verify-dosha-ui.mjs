// Isolated local app/browser test, not the signed-in box browser. No production data/services.
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { chromium } from '/workspace/hadahana-redesign/node_modules/playwright/index.mjs';
const shots='/workspace/hadahana-dosha-shots'; await mkdir(shots,{recursive:true});
const env={...process.env,NEXT_PUBLIC_BASE_PATH:"/hadahana",SESSION_SECRET:randomBytes(48).toString('hex'),LUMS_API_URL:'http://127.0.0.1:4344/api',NEXT_PUBLIC_POSTHOG_KEY:'',NEXT_PUBLIC_GA_MEASUREMENT_ID:''};
const children=[];let browser;
function run(args,cwd=process.cwd()){const c=spawn(process.execPath,args,{cwd,env,stdio:'inherit'});children.push(c);return c;}
async function ready(url){for(let i=0;i<120;i++){try{if((await fetch(url)).ok)return;}catch{}await delay(1000);}throw Error('Startup timeout');}
const fixture=spawn(process.execPath,['scripts/profile-fixture.mjs'],{env:{...env,PROFILE_FIXTURE_PORT:'4344'},stdio:'inherit'});children.push(fixture);
try{
 run(['node_modules/next/dist/bin/next','dev','--turbopack','-p','4341'],'/workspace/hadahana-dosha-before');
 await ready('http://127.0.0.1:4341/hadahana');
 browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
 for(const stage of ['before','after']){
  const port=stage==='before'?4341:4342,root=`http://127.0.0.1:${port}/hadahana`;
  if(stage==='after'){run(['node_modules/next/dist/bin/next','dev','--turbopack','-p','4342']);await ready(root);}
  for(const width of [390,1280]){
   const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();
   if(stage==='after')assert.equal((await context.request.get(root+'/api/horoscopes/not-mine/periods')).status(),401);
   const post=(path,data)=>context.request.post(root+path,{headers:{'X-Hadahana-Action':'1'},data});
   await post('/api/cast',{date:'2026-11-04',time:'05:46',latitude:7.2744,longitude:80.61115,timezone:'Asia/Colombo'});
   await post('/api/account',{action:'signup',name:'Anonymous test',email:`${stage}${width}@example.test`,password:'Local-test123'});
   await post('/api/account',{action:'verify-email',code:'123456'});
   const account=await(await context.request.get(root+'/api/account')).json(),id=account.profile.horoscopes[0].id;
   await page.goto(root+`?horoscope=${id}`);await page.locator('#kendraya-satahana').waitFor({timeout:60000});
   await page.addStyleTag({content:'nextjs-portal {display:none!important;} *{animation-duration:0s!important;scroll-behavior:auto!important;} .reveal{opacity:1!important;transform:none!important;}'});
   for(const tab of ['panchanga','palapala','chart','dosha']){
    const index={chart:0,palapala:2,panchanga:5,dosha:6}[tab];await page.locator('.tabs button').nth(index).click();
    if(tab==='panchanga'){const response=page.waitForResponse(r=>r.url().endsWith('/api/panchanga'));await page.locator('#workspace-results button.primary').click();await response;}
    if(stage==='after'&&tab==='palapala'){
     await page.getByRole('button',{name:'අරිෂ්ට / දෝෂ කාල · Challenging periods',exact:true}).click();
     const response=page.waitForResponse(r=>r.url().includes('/periods'));await page.getByRole('button',{name:'කාල සටහන බලන්න / View periods',exact:true}).click();assert.equal((await response).status(),200);
     await page.locator('.period-card').first().waitFor();assert(await page.locator('.period-card[data-current=true]').count()>0);
     await page.locator('.period-report select').selectOption('current');
     assert.equal(await page.locator('.period-card:not([data-current=true])').count(),0);
     await page.locator('.period-card').first().scrollIntoViewIfNeeded(); await page.screenshot({path:`${shots}/after-period-card-${width}.png`});
    }
    await page.locator('#workspace-results').scrollIntoViewIfNeeded();
    await page.screenshot({path:`${shots}/${stage}-${tab}-${width}.png`});
    if(stage==='after'){
     assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${tab} overflow`);
     const skip=page.locator('.skip-link');assert.equal(await skip.evaluate(el=>getComputedStyle(el).clipPath),'inset(50%)');
    }
   }
   if(stage==='after'){
    assert.equal((await context.request.get(root+'/api/horoscopes/not-mine/periods')).status(),404);
    const main=await (await context.request.get(root+`/api/horoscopes/${id}`)).json(); assert(!main.report && !main.periods, 'Report never added to main chart payload');
    const report=await context.request.get(root+`/api/horoscopes/${id}/periods`);assert.equal(report.headers()['cache-control'],'no-store');
    await page.keyboard.press('Tab'); await page.locator('.skip-link').focus();assert.equal(await page.locator('.skip-link').evaluate(el=>getComputedStyle(el).clipPath),'none');
    await page.keyboard.press('Enter');assert.equal(new URL(page.url()).hash,'#birth-details');
   }
   await context.close();
  }
 }
 // Expired account stays blocked at the API, even with saved chart.
 const context=await browser.newContext(),root='http://127.0.0.1:4342/hadahana';
 await context.request.post(root+'/api/account',{headers:{'X-Hadahana-Action':'1'},data:{action:'login',email:'after390@example.test',password:'Local-test123'}});
 await fetch('http://127.0.0.1:4344/__test/expiry');assert.equal((await context.request.get(root+'/api/horoscopes/not-mine/periods')).status(),402);await context.close();
 console.log('Before/after screenshots and 390/1280 UI, current filter, guest/expiry/ownership API guards, private cache and keyboard skip-link checks passed.');
}finally{await browser?.close();for(const c of children)c.kill('SIGTERM');}
