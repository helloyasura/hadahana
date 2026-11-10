import assert from "node:assert/strict";
import { writeFile, mkdir, readFile, readdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { panchangaSchema } from "../src/lib/astrology/panchanga-schema";
import { getPanchanga } from "../src/lib/astrology/panchanga";
import { panchangaRows } from "../src/lib/astrology/panchanga-view";
import { panchangaPdfTemplate } from "../src/lib/pdf/panchanga-template";
import { renderPdf } from "../src/lib/pdf/renderer";
import { placePayload } from "../src/components/PlaceFields";
import { PDF_SIZES } from "../src/lib/pdf/options";
assert.equal(placePayload({placeId:"colombo",placeName:"",latitude:"",longitude:"",useCustomCoords:false}).latitude,undefined);
assert.equal(placePayload({placeId:"custom",placeName:"",latitude:"0",longitude:"0",useCustomCoords:true}).latitude,0);
const valid={date:"2026-11-10",placeId:"colombo"};
assert(panchangaSchema.safeParse(valid).success);
assert(panchangaSchema.safeParse({date:"2024-02-29",latitude:6.9,longitude:79.8,timezone:"Asia/Colombo"}).success);
for(const invalid of [ {date:"2026-02-30"},{date:"2025-02-29"},{date:"1899-12-31"},{date:"2101-01-01"},{latitude:91,longitude:79},{longitude:181,latitude:6},{latitude:6},{placeId:"unknown"},{timezone:"invalid/zone"},{html:"<script>bad</script>"},{date:"https://example.test"}]) assert(!panchangaSchema.safeParse({...valid,...invalid}).success,JSON.stringify(invalid));
const data=await getPanchanga(valid);
const si=panchangaRows(data,"si"),en=panchangaRows(data,"en");
assert.equal(si.limbs[0].value,"අඟහරුවාදා");assert.equal(en.limbs[0].value,"Tuesday");
assert.equal(si.limbs.length,6);assert.equal(en.periods.length,3);assert.match(en.limbs[1].detail!,/Ends: 10 Nov 2026, 14:00/);
assert.equal(en.sun[0].value,data.sunriseSunset.sunriseLocal);
assert(!JSON.stringify(si).includes("[object Object]"));
const missing=panchangaRows({...data,vara:null,panchang:null,sunriseSunset:{...data.sunriseSunset,sunriseLocal:null},inauspiciousLocal:{rahuKalaya:null,yamaganda:null,gulika:null}},"en");
assert.equal(missing.sun[0].value,"—");assert.equal(missing.periods[0].value,"—");
const unsafe=panchangaPdfTemplate({...data,place:'<img src="http://169.254.169.254/">'},"A4","portrait");assert(!unsafe.includes("<img"));assert(unsafe.includes("&lt;img"));
// Guard all tab components against a new raw-result dump or JSON export.
for(const entry of await readdir("src/components",{withFileTypes:true})){
 if(!entry.isFile()) continue;
 const file=entry.name;
 const source=await readFile(`src/components/${file}`,"utf8");
 assert(!/<pre\b|className="json-block"|download[^\n]*\.json|application\/json[^\n]*Blob/.test(source),file);
}
const out=process.env.PANCHANGA_SHOTS_DIR || "/workspace/hadahana-panchanga-shots";await mkdir(out,{recursive:true});
const dimensions={A4:[595.28,841.89],A5:[419.53,595.28],Letter:[612,792],Legal:[612,1008]};
for(const size of PDF_SIZES) for(const orientation of ["portrait","landscape"] as const){
 const pdf=await renderPdf(panchangaPdfTemplate(data,size,orientation));assert.equal(pdf.subarray(0,5).toString(),"%PDF-");
 const path=`${out}/panchanga-${size}-${orientation}.pdf`;await writeFile(path,pdf);
 const info=execFileSync("pdfinfo",[path],{encoding:"utf8"});const match=info.match(/Page size:\s+([\d.]+) x ([\d.]+)/)!;
 const expected=orientation==="portrait"?dimensions[size]:[...dimensions[size]].reverse();assert(Math.abs(+match[1]-expected[0])<2 && Math.abs(+match[2]-expected[1])<2,info);
 assert.match(execFileSync("pdffonts",[path],{encoding:"utf8"}),/NotoSansSinhala/);
 const text=execFileSync("pdftotext",[path,"-"],{encoding:"utf8"});assert.match(text,/Panchanga/);assert.match(text,/Asia\/Colombo/);assert(!text.includes("undefined"));
 execFileSync("pdftoppm",["-f","1","-singlefile","-scale-to","1500","-png",path,`${out}/panchanga-${size}-${orientation}-page1`]);
 console.log(`${size} ${orientation}: ${match[1]} x ${match[2]}pt; embedded Sinhala; PNG proof`);
}
console.log("Panchanga: strict validation, local dates, both languages, missing values, HTML escaping, all-component JSON audit, four PDF sizes and orientations passed.");
