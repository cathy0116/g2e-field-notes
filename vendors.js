// User-approved UI grouping; original source articles and booth rows stay intact.
const aliases={'ags interactive':'AGS','egt digital':'EGT','konami online':'Konami','zitro digital':'Zitro'};
export const baseVendors=['AGS','Ainsworth','Aristocrat','Aruze','Bluberi','EGT','Gaming Arts','IGT','Incredible Technologies','Jumbo Technology','Konami','Light & Wonder','MERKUR','NOVOMATIC','Zitro'];
export function canonicalVendor(value){const name=String(value||'').trim();return aliases[name.toLowerCase()]||baseVendors.find(v=>v.toLowerCase()===name.toLowerCase())||name;}
export function vendorNames(rows=[],records=[]){return [...new Set([...baseVendors,...rows.map(v=>canonicalVendor(v.name)),...records.map(r=>canonicalVendor(r.vendor))].filter(Boolean))].sort((a,b)=>a.localeCompare(b));}
// Public official directory facts only. Never mutate imported rows or private notes.
export const BOOTH_CHECKED_AT='2026-09-24';
const directory='https://www.globalgamingexpo.com/en-us/attend/exhibitor-list.html';
const facts=[
 ['AGS','1150','ags%20llc.org-cdd7b8cd-a1f3-4ede-83ff-92cd8b9b22db'],
 ['Ainsworth','2659','ainsworth%20game%20technology%20ltd.org-23fd2343-0d91-4de9-a484-ad65ae1143ab'],
 ['Aristocrat','1133','aristocrat%20technologies.org-ce2cba80-f8bb-4e9a-b3a2-124e95e30201'],
 ['Bluberi','1253','bluberi.org-6adccf16-4d82-46e9-83b7-3228a43c8eda'],
 ['EGT','3352 / 2452','euro%20games%20technology%20egt.org-b8fb0f70-f84b-4aee-afe6-45117e390c80'],
 ['IGT','4455','igt.org-c45b7796-aee8-4c03-9a3f-7454985a56e7'],
 ['Incredible Technologies','4047','incredible%20technologies%20inc.org-79c43268-2b11-4be3-949f-67b6f73b8cf9'],
 ['Konami','1256','konami%20gaming.org-e2068ae5-c9c7-4e96-8ecf-460e76875d19'],
 ['Light & Wonder','1116','light%20%20wonder%20inc.org-3f767d7b-9431-47a8-9563-d54c87ddd18d'],
 ['MERKUR','3353 / 3650','merkur.org-e50a1825-64cc-42bb-a695-b2539c2e884e'],
 ['NOVOMATIC','1259','novomatic%20ag.org-575b53bc-d87e-4596-a8f4-615748e06f61'],
 ['Zitro','3258','zitro.org-58bc402d-588b-413c-bc0c-b15032611ef7']
];
export const officialBooths=Object.fromEntries(facts.map(([name,booth,slug])=>[name,{event:'G2E 2026 · Las Vegas',booth,boothStatus:'已確認',boothSource:directory.replace('.html','/exhibitor-details.')+slug+'.html',verifiedAt:BOOTH_CHECKED_AT}]));
export function groupVendors(rows=[],records=[]){return vendorNames(rows,records).map(name=>{
 const members=rows.filter(v=>canonicalVendor(v.name)===name),primary=members.find(v=>v.name===name)||members[0];
 const result={id:name,event:'G2E 2026',booth:'',boothStatus:'待確認',boothSource:'',verifiedAt:'',note:'',...primary,name};
 // Respect local vendor edits made on/after this directory check. Older source rows remain intact in storage.
 const recentEdit=primary&&String(primary.updatedAt||'').slice(0,10)>=BOOTH_CHECKED_AT;
 if(!recentEdit&&officialBooths[name])Object.assign(result,officialBooths[name]);
 else if(!recentEdit&&['Aruze','Gaming Arts','Jumbo Technology'].includes(name))Object.assign(result,{event:'G2E 2026 · Las Vegas',booth:'',boothStatus:'待官方核對',boothSource:'尚未核實本屆攤位（不代表未參展）；'+directory,verifiedAt:BOOTH_CHECKED_AT});
 return result;
});}
export function normalizeVendorRecord(r){const vendor=canonicalVendor(r.vendor);return vendor===r.vendor?r:{...r,vendor,sourceVendor:r.sourceVendor||r.vendor};}
