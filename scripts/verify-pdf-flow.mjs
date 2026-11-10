// Isolated local Next app + mock LUMS. No production accounts, secrets or services.
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';
const root = 'http://127.0.0.1:4323/hadahana';
const shots = process.env.PDF_SHOTS_DIR || '/workspace/hadahana-pdf-shots';
const env = {...process.env, NEXT_PUBLIC_BASE_PATH:'/hadahana',SESSION_SECRET:randomBytes(48).toString('hex'),LUMS_API_URL:'http://127.0.0.1:4324/api',CHROMIUM_PATH:process.env.CHROMIUM_PATH || '/usr/bin/google-chrome'};
const fixture = spawn(process.execPath,['scripts/profile-fixture.mjs'],{env:{...env,PROFILE_FIXTURE_PORT:'4324'},stdio:'inherit'});
const app = spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--turbopack','-p','4323'],{env,stdio:'inherit'});
let browser;
try {
  for(let i=0;i<120;i++){try{if((await fetch(root)).ok)break;}catch{}if(i===119)throw Error('startup timeout');await delay(500);}
  await mkdir(shots,{recursive:true});
  browser=await chromium.launch({executablePath:env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']});
  for(const width of [1280,390]){
    const context=await browser.newContext({viewport:{width,height:900}});
    const page=await context.newPage();
    const post=(path,data)=>context.request.post(root+path,{headers:{'X-Hadahana-Action':'1'},data});
    assert.equal((await context.request.get(root+'/api/horoscopes/no/pdf')).status(),401);
    await post('/api/cast',{date:'1995-06-15',time:'10:30',placeId:'colombo',nativeName:'ශ්‍රී චන්ද්‍ර ප්‍රඥා'});
    assert.equal((await post('/api/account',{action:'signup',name:'Local PDF test',email:`pdf${width}@example.test`,password:'Local-test123'})).status(),200);
    assert.equal((await post('/api/account',{action:'verify-email',code:'123456'})).status(),200);
    const account=await(await context.request.get(root+'/api/account')).json();
    const id=account.profile.horoscopes[0].id;
    assert.equal((await context.request.get(root+'/api/horoscopes/not-mine/pdf')).status(),404);
    assert.equal((await context.request.get(root+`/api/horoscopes/${id}/pdf?size=A3`)).status(),400);
    assert.equal((await context.request.get(root+`/api/horoscopes/${id}?download=1`)).status(),410);
    assert.equal((await context.request.get(root+`/api/horoscopes/${id}/pdf`,{headers:{'sec-fetch-site':'cross-site'}})).status(),403);
    for(const size of ['A4','A5','Letter','Legal']) {
      const r=await context.request.get(root+`/api/horoscopes/${id}/pdf?size=${size}&download=1`);
      assert.equal(r.status(),200,await r.text().then(t=>t.slice(0,100)));
      assert.match(r.headers()['content-type'],/application\/pdf/);assert.match(r.headers()['content-disposition'],/attachment; filename="hadahana-/);
      assert.match(r.headers()['cache-control'],/no-store/);
      await writeFile(`${shots}/api-${size}-${width}.pdf`,await r.body());
    }
    await page.goto(root);await page.addStyleTag({content:'nextjs-portal{display:none!important}'});
    await page.getByRole('button',{name:'English',exact:true}).click();
    await page.getByRole('button',{name:'Open horoscope ↗',exact:true}).click();
    await page.locator('.pdf-panel').waitFor();
    await page.getByRole('button',{name:'View PDF',exact:true}).click();await page.locator('.pdf-preview').waitFor();
    await page.locator('.pdf-panel').screenshot({path:`${shots}/panel-en-${width}.png`});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    const download=page.waitForEvent('download');await page.getByRole('link',{name:/Download PDF/}).click();assert.match((await download).suggestedFilename(),/\.pdf$/);
    await page.getByRole('button',{name:'සිංහල',exact:true}).click();
    await page.locator('.pdf-panel').screenshot({path:`${shots}/panel-si-${width}.png`});
    assert.equal(await page.getByRole('button',{name:/JSON/}).count(),0);
    if(width===1280) {
      for(let i=0;i<3;i++) assert.equal((await context.request.get(root+`/api/horoscopes/${id}/pdf`)).status(),200);
      const limited=await context.request.get(root+`/api/horoscopes/${id}/pdf`);assert.equal(limited.status(),429);assert.equal(limited.headers()['retry-after'],'600');
    }
    await fetch('http://127.0.0.1:4324/__test/expiry');
    assert.equal((await context.request.get(root+`/api/horoscopes/${id}/pdf`)).status(),402);
    await context.close();
  }
  console.log('PDF API/UI passed at 1280/390: four page sizes; inline preview/blob download; English/Sinhala; no overflow; unauthenticated/expired/wrong-owner/cross-site/invalid-size denied; JSON export gone.');
}finally{await browser?.close();app.kill('SIGTERM');fixture.kill('SIGTERM');}
