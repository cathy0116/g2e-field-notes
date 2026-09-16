// User-approved UI grouping; original source articles and booth rows stay intact.
const aliases={'ags interactive':'AGS','egt digital':'EGT','konami online':'Konami','zitro digital':'Zitro'};
export const baseVendors=['AGS','Ainsworth','Aristocrat','Aruze','Bluberi','EGT','Gaming Arts','IGT','Incredible Technologies','Jumbo Technology','Konami','Light & Wonder','MERKUR','NOVOMATIC','Zitro'];
export function canonicalVendor(value){const name=String(value||'').trim();return aliases[name.toLowerCase()]||baseVendors.find(v=>v.toLowerCase()===name.toLowerCase())||name;}
export function vendorNames(rows=[],records=[]){return [...new Set([...baseVendors,...rows.map(v=>canonicalVendor(v.name)),...records.map(r=>canonicalVendor(r.vendor))].filter(Boolean))].sort((a,b)=>a.localeCompare(b));}
export function groupVendors(rows=[],records=[]){return vendorNames(rows,records).map(name=>{const members=rows.filter(v=>canonicalVendor(v.name)===name);const primary=members.find(v=>v.name===name)||members[0];return {...(primary||{id:name,event:'G2E 2026',booth:'',boothStatus:'待確認',boothSource:'',verifiedAt:'',note:''}),name};});}
export function normalizeVendorRecord(r){const vendor=canonicalVendor(r.vendor);return vendor===r.vendor?r:{...r,vendor,sourceVendor:r.sourceVendor||r.vendor};}
