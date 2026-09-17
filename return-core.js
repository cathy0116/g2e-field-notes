export const TOOL_VERSION='1.0.0';
export const SHEETS=[
 ['使用說明與版本',['項目','內容']],
 ['機台總表',['整理ID','身份狀態','原始名稱','標準名稱（待查）','廠商','產品類型','平台／市場／版本（待查）','地點','地點詳述','遊戲說明原文','個人心得原文','作品原填','系列原填','作品關係（待查）','上市年（待查）','日期類型（待查）','玩法Tag','主題／美術','美術說明','相關連結','照片路徑','錄音路徑','來源ID','原始ID','更新時間（原文）','狀態','待確認事項']],
 ['賭場觀察',['整理ID','賭場名稱','城市','訪查日（原文）','特性與說明原文','照片路徑','錄音路徑','來源ID','原始ID','更新時間（原文）','封存']],
 ['個人原始觀察',['整理ID','來源ID','紀錄者','類型','原始ID','筆記ID／欄位','原始文字','時間（原文）','地點']],
 ['查證與差異',['差異ID','整理ID','來源ID','原文主張','查證項目','查證結果','差異類型','來源網址','查詢日期','適用市場／版本','證據信心與理由','建議處理','審閱人','決議']],
 ['來源索引',['來源ID','紀錄者','原始檔名','SHA-256','App版本（原填）','Schema','備份時間（原文）','原始JSON路徑','機台數','賭場數','附件數']],
 ['附件索引',['來源ID','原始附件ID','原始檔名','類型','來源','圖說','附件路徑','位元組','SHA-256','引用整理ID']]
];
export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const str=v=>v==null?'':typeof v==='string'?v:Array.isArray(v)?v.map(str).join('\n'):typeof v==='object'?JSON.stringify(v):String(v);
export function safeUrl(v){try{const u=new URL(v);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}}
export async function hash(bytes){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('');}
const TYPES={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif','image/heic':'heic','image/heif':'heif','audio/mp4':'m4a','audio/mpeg':'mp3','audio/wav':'wav','audio/webm':'webm','audio/ogg':'ogg','audio/aac':'aac','audio/flac':'flac'};
export function mediaBytes(data){const m=/^data:([^;,]+);base64,([A-Za-z0-9+/]*={0,2})$/.exec(data||'');if(!m||!TYPES[m[1]]||m[2].length%4)throw Error('附件格式不支援或已損壞');let binary;try{binary=atob(m[2]);}catch{throw Error('附件編碼已損壞');}if(!binary.length)throw Error('附件內容為空');return {type:m[1],ext:TYPES[m[1]],bytes:Uint8Array.from(binary,c=>c.charCodeAt(0))};}
function array(v,k){if(v[k]===undefined)return [];if(!Array.isArray(v[k]))throw Error(k+' 必須是清單');return v[k];}
export async function parseSource(bytes,name){
 const raw=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);let data;try{data=JSON.parse(new TextDecoder().decode(raw).replace(/^\uFEFF/,''));}catch{throw Error('JSON 無法讀取，請重新匯出完整備份');}
 if(data?.format!=='g2e-field-notes'||![1,2,3].includes(data.schema)||!Array.isArray(data.records)||!Array.isArray(data.media))throw Error('請選擇 App 匯出的完整 JSON 備份');
 const records=data.records,casinos=array(data,'casinos'),media=data.media;
 if(records.length+casinos.length>20000||media.length>20000)throw Error('資料超過 20,000 筆，請分批處理');
 for(const items of [records,casinos,media]){const ids=new Set();for(const item of items){if(!item||typeof item.id!=='string'||!item.id||ids.has(item.id))throw Error('資料缺少 ID 或同檔 ID 重複');ids.add(item.id);}}
 for(const r of [...records,...casinos]){
  for(const k of ['name','vendor','description','personalNotes','location','locationDetail','city','visitedOn','updatedAt','family','work','kind','artNotes','todo'])if(r[k]!==undefined&&typeof r[k]!=='string')throw Error('欄位格式不正確：'+k);
  for(const k of ['mediaIds','audioIds','tags','styles','links'])if(array(r,k).some(v=>typeof v!=='string'))throw Error('清單格式不正確：'+k);
  if(array(r,'notes').some(n=>!n||typeof n.text!=='string'))throw Error('追加筆記格式不正確');
 }
 const digest=await hash(raw),id='S-'+digest.slice(0,16),assets=[];
 for(let i=0;i<media.length;i++){const m=media[i],decoded=mediaBytes(m.data);assets.push({id:m.id,name:str(m.name),origin:str(m.origin),caption:str(m.caption),...decoded,path:`media/${id}/${i+1}.${decoded.ext}`,sha256:await hash(decoded.bytes)});}
 return {id,sha256:digest,name,owner:'',raw,data,assets,enabled:true};
}
export function assemble(sources,now=new Date().toISOString()){
 const rows=[],warnings=[],attachments=[],sourceRows=[],seen=new Map();
 for(const s of sources.filter(s=>s.enabled)){
  const amap=new Map(s.assets.map(a=>[a.id,a]));
  sourceRows.push({id:s.id,owner:s.owner.trim()||'未提供',name:s.name,sha256:s.sha256,appVersion:str(s.data.appVersion),schema:s.data.schema,exportedAt:str(s.data.exportedAt),path:`source/${s.id}.json`,records:s.data.records.length,casinos:(s.data.casinos||[]).length,media:s.assets.length});
  for(const [type,items] of [['機台',s.data.records],['賭場',s.data.casinos||[]]])for(const [i,r] of items.entries()){
   const key=`${s.id}-${type==='機台'?'G':'C'}${i+1}`,duplicateKey=type+':'+r.id;
   if(seen.has(duplicateKey))warnings.push(`${r.name||r.id}：與 ${seen.get(duplicateKey)} 有相同原始 ID，已分開保留，尚未合併。`);else seen.set(duplicateKey,s.name);
   const photos=[],audios=[];
   for(const [field,list,kind] of [['mediaIds',photos,'image/'],['audioIds',audios,'audio/']])for(const mid of r[field]||[]){const a=amap.get(mid);if(!a||!a.type.startsWith(kind)){warnings.push(`${r.name||r.id}：缺少或類型不符的附件 ${mid}`);continue;}list.push(a.path);}
   rows.push({key,type,sourceId:s.id,owner:s.owner.trim()||'未提供',raw:r,photos,audios,identity:'未查證',research:{standardName:'',marketVersion:'',releaseYear:'',dateType:'',relationships:'',status:'未查證'}});
  }
  for(const a of s.assets)attachments.push({sourceId:s.id,...a,refs:rows.filter(r=>r.sourceId===s.id&&(r.photos.includes(a.path)||r.audios.includes(a.path))).map(r=>r.key)});
 }
 return {format:'g2e-return-report',schema:1,toolVersion:TOOL_VERSION,sopVersion:2,createdAt:now,sources:sourceRows,records:rows,attachments,warnings,research:[]};
}
export function tables(c){
 const paths=(r,k)=>r[k].join('\n');
 return [
 [['工具版本',TOOL_VERSION],['SOP版本',2],['產製時間',c.createdAt],['狀態','原始資料整理；尚未執行網路查證或多人合併'],['機台數',c.records.filter(r=>r.type==='機台').length],['賭場數',c.records.filter(r=>r.type==='賭場').length],['附件數',c.attachments.length],['使用方法','解壓縮整包後開啟 index.html 看圖與聽錄音。Excel 修改不會自動回寫網頁或 App。'],['原文保護','舊版混合文字不自動拆分。個人喜好不判定對錯。'],['長文字','單格超過 Excel 32,767 字元時以提示截短；完整內容保留於原始 JSON、canonical.json 及圖文頁。'],['待確認',c.warnings.join('\n')||'無附件或重複 ID 警告；不代表內容已查證']],
 c.records.filter(r=>r.type==='機台').map(r=>{const v=r.raw;return [r.key,r.identity,v.name,'',v.vendor,v.kind,'',v.location,v.locationDetail,v.description,v.personalNotes||'',v.work,v.family,'','','',str(v.tags),str(v.styles),v.artNotes,str(v.links),paths(r,'photos'),paths(r,'audios'),r.sourceId,v.id,v.updatedAt,v.archived?'封存':'一般',v.todo];}),
 c.records.filter(r=>r.type==='賭場').map(r=>{const v=r.raw;return [r.key,v.name,v.city,v.visitedOn,v.description,paths(r,'photos'),paths(r,'audios'),r.sourceId,v.id,v.updatedAt,v.archived?'是':'否'];}),
 c.records.flatMap(r=>[['description',r.raw.description],...(r.type==='機台'?[['personalNotes',r.raw.personalNotes]]:[])].filter(([,v])=>v).map(([field,v])=>[r.key,r.sourceId,r.owner,r.type,r.raw.id,field,v,r.raw.updatedAt,r.raw.locationDetail||r.raw.city]).concat((r.raw.notes||[]).map((n,i)=>[r.key,r.sourceId,r.owner,r.type,r.raw.id,n.id||`notes[${i}]`,n.text,n.createdAt,n.location||r.raw.locationDetail||'']))),
 [],
 c.sources.map(s=>[s.id,s.owner,s.name,s.sha256,s.appVersion,s.schema,s.exportedAt,s.path,s.records,s.casinos,s.media]),
 c.attachments.map(a=>[a.sourceId,a.id,a.name,a.type,a.origin,a.caption,a.path,a.bytes.length,a.sha256,a.refs.join('\n')])
 ];
}
export function serializable(c){return {...c,attachments:c.attachments.map(({bytes,...a})=>({...a,size:bytes.length}))};}
