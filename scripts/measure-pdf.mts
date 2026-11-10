import { buildSatahana } from '../src/lib/astrology/satahana';
import { pdfTemplate } from '../src/lib/pdf/template';
import { renderPdf } from '../src/lib/pdf/renderer';
const data=await buildSatahana({date:'1995-06-15',time:'10:30',placeId:'colombo'});
console.log('RENDER_BEGIN');
const start=Date.now();
await renderPdf(pdfTemplate(data,'A4','portrait'));
console.log(`RENDER_END ${Date.now()-start}ms`);
