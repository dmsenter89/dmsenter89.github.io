import {getLeyningForParsha} from '@hebcal/leyning';
import {parshiot} from '@hebcal/core';
const out=[];
for (const p of parshiot) { const l=getLeyningForParsha(p); for (const [k,a] of Object.entries(l.fullkriyah)) out.push({parsha:p,aliyah:k,k:a.k,b:a.b,e:a.e}); }
console.log(JSON.stringify(out));
