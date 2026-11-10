// Local mock LUMS only: never sends email or touches live customers.
import { spawn, execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const root='http://127.0.0.1:4333/hadahana';
const shots=process.env.PANCHANGA_SHOTS_DIR || '/workspace/hadahana-panchanga-shots';
const before=process.env.BEFORE==='1';
const env={...process.env,NEXT_PUBLIC_BASE_PATH:'/hadahana',SESSION_SECRET:randomBytes(48).toString('hex'),LUMS_API_URL:'http://127.0.0.1:4334/api',CHROMIUM_PATH:'/usr/bin/google-chrome'};
const fixture=spawn(process.execPath,['scripts/profile-fixture.mjs'],{env:{...env,PROFILE_FIXTURE_PORT:'4334'},stdio:'inherit'});
const app=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--turbopack','-p','4333'],{env,stdio:'inherit'});
let browser;
try {
 for(let i=0;i<120;i++){try{if((await fetch(root)).ok)break;}catch{} if(i===119)throw Error('startup timeout');await delay(500);}
 await mkdir(shots,{recursive:true});
 if(!before){
  const emptyHeaders={'X-Hadahana-Action':'1','Content-Type':'application/json'};
  const emptyContext=await (await import(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright')).request.newContext();
  await emptyContext.post(root+'/api/account',{headers:emptyHeaders,data:{action:'signup',name:'Empty profile',email:'empty@example.test',password:'Local-test123'}});
  await emptyContext.post(root+'/api/account',{headers:emptyHeaders,data:{action:'verify-email',code:'123456'}});
  assert.equal((await emptyContext.post(root+'/api/panchanga/pdf',{headers:emptyHeaders,data:{date:'2026-11-10',placeId:'colombo'}})).status(),403);
  await emptyContext.dispose();
 }
 browser=await chromium.launch({executablePath:env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']});
 for(const width of [1280,390]){
  const context=await browser.newContext({viewport:{width,height:900}});const page=await context.newPage();
  const post=(path,data)=>context.request.post(root+path,{headers:{'X-Hadahana-Action':'1'},data});
  if(!before) assert.equal((await post('/api/panchanga/pdf',{date:'2026-11-10',placeId:'colombo'})).status(),401);
  await post('/api/cast',{date:'2026-11-10',time:'10:30',placeId:'colombo',nativeName:'ශ්‍රී චන්ද්‍ර ප්‍රඥා'});
  await post('/api/account',{action:'signup',name:'Local Panchanga test',email:`panchanga${width}@example.test`,password:'Local-test123'});
  assert.equal((await post('/api/account',{action:'verify-email',code:'123456'})).status(),200);
  await page.goto(root);await page.addStyleTag({content:'nextjs-portal{display:none!important}'});
  await page.getByRole('button',{name:'English',exact:true}).click();
  await page.getByRole('button',{name:'Open horoscope ↗',exact:true}).click();
  await page.locator('.tabs').getByRole('button',{name:'Panchanga',exact:true}).click();
  await page.locator('#workspace-results').getByRole('button',{name:'Panchanga',exact:true}).click();
  await page.locator(before?'.json-block':'.panchanga-view').waitFor();
  if(!before) await page.locator('.panchanga-sun').getByText('05:59',{exact:true}).waitFor();
  await page.getByRole('button',{name:'සිංහල',exact:true}).click();
  await page.locator('#workspace-results').screenshot({path:`${shots}/${before?'before':'after'}-si-${width}.png`});
  if(!before){
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.getByRole('button',{name:'English',exact:true}).click();
   await page.locator('#workspace-results').screenshot({path:`${shots}/after-en-${width}.png`});
   if(width===390){await page.getByLabel('Paper size',{exact:true}).selectOption('A5');await page.getByLabel('Orientation',{exact:true}).selectOption('landscape');}
   const previewRequest=page.waitForRequest(request=>request.url().includes('/api/panchanga/pdf'));
   await page.getByRole('button',{name:'View PDF',exact:true}).click();await page.locator('.pdf-preview').waitFor();
   const requested=await previewRequest;assert.equal(requested.postDataJSON().placeId,'colombo');assert.equal(requested.postDataJSON().latitude,undefined);
   if(width===390){assert.match(requested.url(),/size=A5&orientation=landscape/);}
   await page.locator('.pdf-panel').screenshot({path:`${shots}/preview-panel-${width}.png`});
   const download=page.waitForEvent('download');await page.getByRole('link',{name:/Download PDF/}).click();assert.match((await download).suggestedFilename(),/panchanga.*\.pdf$/);
   if(width===1280){
    const input={date:'2026-11-10',placeId:'colombo'};
    for(const bad of [{date:'2026-02-30'},{latitude:91,longitude:79},{timezone:'Invalid/Zone'},{html:'<img src="http://169.254.169.254/">'},{placeId:'missing'}]) assert.equal((await post('/api/panchanga/pdf',{...input,...bad})).status(),400);
    assert.equal((await post('/api/panchanga/pdf?size=A3',input)).status(),400);
    assert.equal((await post('/api/panchanga/pdf?orientation=bad',input)).status(),400);
    assert.equal((await context.request.post(root+'/api/panchanga/pdf',{data:input})).status(),403);
    assert.equal((await context.request.post(root+'/api/panchanga/pdf',{headers:{'X-Hadahana-Action':'1','sec-fetch-site':'cross-site'},data:input})).status(),403);
    assert.equal((await post('/api/panchanga/pdf',{...input,placeName:'x'.repeat(5000)})).status(),413);
    for(const size of ['A4','A5','Letter','Legal']){
     const response=await post(`/api/panchanga/pdf?size=${size}&download=1`,input);
     assert.equal(response.status(),200);assert.match(response.headers()['content-type'],/application\/pdf/);assert.match(response.headers()['content-disposition'],/attachment; filename="panchanga-/);assert.match(response.headers()['cache-control'],/no-store/);
     const path=`${shots}/api-${size}.pdf`;await writeFile(path,await response.body());assert.match(execFileSync('pdfinfo',[path],{encoding:'utf8'}),/Pages:/);
    }
    const account=await(await context.request.get(root+'/api/account')).json();
    const id=account.profile.horoscopes[0].id;
    // Budget is shared between horoscope and Panchanga endpoints: preview + 4 + 3 = 8.
    for(let i=0;i<3;i++)assert.equal((await context.request.get(root+`/api/horoscopes/${id}/pdf`)).status(),200);
    const limited=await post('/api/panchanga/pdf',input);assert.equal(limited.status(),429);assert.equal(limited.headers()['retry-after'],'600');
   }
   for(const button of await page.locator('.tabs button').all()){
    await button.click();assert.equal(await page.locator('pre, .json-block').count(),0);assert.equal(await page.getByRole('button',{name:/JSON/i}).count(),0);assert.equal(await page.locator('a[download$=".json"]').count(),0);
   }
  }
  if(!before && width===390){await fetch('http://127.0.0.1:4334/__test/expiry');assert.equal((await post('/api/panchanga/pdf',{date:'2026-11-10',placeId:'colombo'})).status(),402);}
  await context.close();
 }
 console.log(`Panchanga ${before?'before screenshots':'UI / preview / download / all-tabs checks'} complete`);
}finally{await browser?.close();app.kill('SIGTERM');fixture.kill('SIGTERM');}
