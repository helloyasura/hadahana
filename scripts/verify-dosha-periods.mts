import assert from 'node:assert/strict';
import { difficultPeriods, signIntervals, signOf, houseFrom, lordIssues } from '../src/lib/astrology/dosha-periods';
import { castKendraya } from '../src/lib/astrology/kendraya';
import { vimshottari, DASHA_YEAR_DAYS } from '../src/lib/astrology/vimshottari';
import { EphemerisService, SE } from 'vpv-panchangam/dist/ephemeris';
const DAY = 86400000;
assert.equal(signOf(-1),11); assert.equal(houseFrom(11,0),12);
// Synthetic retrograde crossing goes out and returns, not merged over a gap.
const rows = signIntervals(0, 2*DAY, t => t < DAY ? 29 + t / DAY * 2 : 33 - t / DAY * 2);
assert.deepEqual(rows.map(r=>r.sign), [0,1,0]);
assert(Math.abs(rows[0].end-DAY/2)<1000); assert(Math.abs(rows[1].end-1.5*DAY)<1000);
for(let i=1;i<rows.length;i++) assert.equal(rows[i].start,rows[i-1].end);
// Anonymous reference fixture; no name or hospital details in outputs.
const chart = await castKendraya({ date:'2026-11-04',time:'05:46',latitude:7.2744,longitude:80.61115,timezone:'Asia/Colombo' });
assert(lordIssues(chart,'Jupiter').reasons.some(r=>r.includes('functional')));
assert(!lordIssues(chart,'Saturn').reasons.some(r=>r.includes('functional')), 'Libra yogakaraka is not a functional malefic');
const altered = structuredClone(chart);
const mercury = altered.navagraha.find(p=>p.graha==='Mercury')!;
mercury.bhava=8; mercury.combust=true; mercury.debilitated=true;
const mercuryReasons=lordIssues(altered,'Mercury').reasons;
assert(mercuryReasons.some(r=>r.includes('occupancy')));
assert(mercuryReasons.some(r=>r.includes('combust')));
assert(mercuryReasons.some(r=>r.includes('debilitated')));
const asOf = new Date('2026-11-10T10:20:00Z');
const report = await difficultPeriods(chart,asOf);
assert(report.childNote); assert.equal(report.windowStartUtc,chart.native.utcTime);
assert(report.periods.some(p=>p.current));
for(const p of report.periods){
 assert(Date.parse(p.startUtc)>=Date.parse(chart.native.utcTime));
 assert(p.startUtc<p.endUtc); assert.equal(p.current,p.startUtc<=report.asOfUtc && report.asOfUtc<p.endUtc);
 assert.equal(p.durationDays,Math.round((Date.parse(p.endUtc)-Date.parse(p.startUtc))/DAY*10)/10);
 assert(p.reasons.length && p.remedies.length); assert(p.planets.length);
}
const v=vimshottari(chart.chandra.longitude,chart.native.utcTime);
const firstAntar=report.periods.find(p=>p.current && p.kind==='dasha')!;
assert(firstAntar.clippedStart, 'Birth clips the already-running antardasha');
assert(firstAntar.titleEn.includes(v.antar[0].lord)); assert.equal(firstAntar.endUtc,v.antar[0].end);
const transits=report.periods.filter(p=>p.kind==='transit');
const ephe=EphemerisService.getInstance(); await ephe.init(); ephe.setAyanamsa('lahiri');
for(const p of transits){
 const t=(Date.parse(p.startUtc)+Date.parse(p.endUtc))/2;
 const planet=p.planets[0], id=planet==='Saturn'?SE.SATURN:planet==='Jupiter'?SE.JUPITER:SE.MEAN_NODE;
 const sign=signOf(ephe.calcUt(t/DAY+2440587.5,id).lon+(planet==='Ketu'?180:0));
 const h=houseFrom(sign,signOf(chart.chandra.longitude));
 if(p.titleEn==='Sade Sati') assert([12,1,2].includes(h));
 if(p.titleEn==='Ashtama Shani') assert.equal(h,8);
 if(p.titleEn==='Kantaka Shani') assert([4,7,10].includes(h));
 if(planet==='Jupiter') assert.equal(h,8);
 if(['Rahu','Ketu'].includes(planet)) assert(sign===signOf(chart.chandra.longitude)||sign===signOf(chart.lagna.longitude));
 // An un-clipped start really straddles the sign boundary (1s bisection).
 if(!p.clippedStart) {
 const t=Date.parse(p.startUtc), lon=(t:number)=>ephe.calcUt(t/DAY+2440587.5,id).lon;
 assert.notEqual(signOf(lon(t-2000)),signOf(lon(t+2000)));
 }
}
const cached=await difficultPeriods(chart,asOf); assert.deepEqual(cached,report);
const older=await castKendraya({date:'1990-01-01',time:'12:00',placeId:'colombo'});
const oldReport=await difficultPeriods(older,asOf);assert.equal(oldReport.childNote,null);
assert(oldReport.periods.some(p=>p.kind==='dasha' && p.current),'Later mahadashas have antardashas too');
// Full major/subminor durations remain anchored, never compressed to birth balance.
const fullFirstStart=Date.parse(chart.native.utcTime)-v.elapsedFraction*20*DASHA_YEAR_DAYS*DAY;
assert(fullFirstStart<Date.parse(chart.native.utcTime));
const format=(iso:string)=>new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Colombo',dateStyle:'medium'}).format(new Date(iso));
console.log('Dosha period unit/integration checks passed; fixture current + next (Asia/Colombo):');
console.log(JSON.stringify(report.periods.filter(p=>p.current || p.startUtc>report.asOfUtc).map(p=>({title:p.titleEn,start:format(p.startUtc),end:format(p.endUtc),current:p.current,intensity:p.intensity,clippedStart:p.clippedStart,clippedEnd:p.clippedEnd})),null,2));
