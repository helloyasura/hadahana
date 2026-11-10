import assert from "node:assert/strict";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { pdfTemplate, escapeHtml } from "../src/lib/pdf/template";
import { pdfOptions, PDF_SIZES } from "../src/lib/pdf/options";
import { buildSatahana } from "../src/lib/astrology/satahana";
import { renderPdf, admitPdf } from "../src/lib/pdf/renderer";
const out = process.env.PDF_SHOTS_DIR || "/workspace/hadahana-pdf-shots";
await mkdir(out, { recursive: true });
assert.equal(escapeHtml('<script>"&\''), '&lt;script&gt;&quot;&amp;&#39;');
assert.throws(() => pdfOptions(new URLSearchParams('size=A3')));
assert.throws(() => pdfOptions(new URLSearchParams('orientation=evil')));
for (let i=0;i<8;i++) admitPdf('test-rate',100);
assert.throws(() => admitPdf('test-rate',100), /limit/);
admitPdf('test-rate',600101);
const d = await buildSatahana({ date: '1995-06-15', time: '10:30', placeId: 'colombo', nativeName: 'ශ්‍රී චන්ද්‍ර ප්‍රඥා' });
const dimensions = { A4:[595.28,841.89], A5:[419.53,595.28], Letter:[612,792], Legal:[612,1008] };
for (const size of PDF_SIZES) {
  const html = pdfTemplate(d,size,'portrait');
  const unsafe = pdfTemplate({...d, native:{...d.native,name:'<img src="http://169.254.169.254/"> & \"test\"'}},size,'portrait');
  assert(!unsafe.includes('<img')); assert(unsafe.includes('&lt;img'));
  assert.equal((html.match(/<svg/g)||[]).length, d.chandraChart?3:2);
  await writeFile(`${out}/${size}.html`,html);
  const pdf = await renderPdf(html); assert.equal(pdf.subarray(0,5).toString(),'%PDF-');
  const path = `${out}/${size}.pdf`; await writeFile(path,pdf);
  const info = execFileSync('pdfinfo',[path],{encoding:'utf8'});
  const match = info.match(/Page size:\s+([\d.]+) x ([\d.]+)/)!;
  assert(match); const expected = dimensions[size];
  assert(Math.abs(+match[1]-expected[0])<2 && Math.abs(+match[2]-expected[1])<2, info);
  execFileSync('pdftoppm',['-f','1','-l',size==='A4'||size==='A5'?'2':'1','-scale-to','1300','-png',path,`${out}/${size}`]);
  const fonts=execFileSync('pdffonts',[path],{encoding:'utf8'}); assert.match(fonts,/NotoSansSinhala/);
  const text=execFileSync('pdftotext',[path,'-'],{encoding:'utf8'}); assert.match(text,/HADAHANA/); assert(!text.includes('undefined'));
  console.log(`${size}: ${info.match(/Pages:.*/)?.[0]}, dimensions ${match[1]} x ${match[2]}pt, Sinhala font embedded, escaped input`);
}
const html = pdfTemplate(d,'A4','landscape');
const [one,two,three,four] = await Promise.allSettled([renderPdf(html), renderPdf(html), renderPdf(html), renderPdf(html)]);
assert.equal(one.status,'fulfilled');assert.equal(two.status,'fulfilled');assert.equal(three.status,'fulfilled');assert.equal(four.status,'rejected');
if(one.status==='fulfilled') {
  await writeFile(`${out}/A4-landscape.pdf`,one.value);
  assert.match(execFileSync('pdfinfo',[`${out}/A4-landscape.pdf`],{encoding:'utf8'}), /Page size:\s+841\.[\d]+ x 594\.[\d]+/);
}
assert((await readFile(`${out}/A4.pdf`)).length>10000);
console.log('PDF tests passed: escaping, SVG, sizes, landscape, embedded Sinhala, rate limit, concurrency cap.');
