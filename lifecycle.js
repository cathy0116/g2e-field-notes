const refs=r=>[...(r?.mediaIds||[]),...(r?.audioIds||[])];
export function dataManagementPlan(snapshot,mode){
 const {records=[],media=[],drafts=[],vendors=[],meta=[]}=snapshot;
 const casinos=meta.find(m=>m.id==='casinos')?.value||[];
 if(!['prerelease','all'].includes(mode))throw Error('未知清除範圍。');
 const attachment=new Map(media.map(m=>[m.id,m]));
 const protectedDraftIds=new Set(drafts.flatMap(d=>[d.record?.id,d.originalId,d.id?.replace(/^(edit|note)-/,'')]));
 const removable=r=>/^PRE-/.test(r.id)&&r.location==='事前資料'&&r.userEdited===false&&
  r.createdAt&&r.updatedAt===r.createdAt&&!r.seen&&!r.archived&&Array.isArray(r.notes)&&!r.notes.length&&
  !(r.audioIds||[]).length&&!protectedDraftIds.has(r.id)&&Array.isArray(r.mediaIds)&&
  r.mediaIds.every(mid=>/^seed-/.test(mid)&&attachment.get(mid)?.origin==='事前文章配圖');
 const removed=mode==='all'?records:records.filter(removable);
 const ids=new Set(removed.map(r=>r.id));
 const kept=records.filter(r=>!ids.has(r.id));
 const referenced=new Set([...kept,...casinos,...drafts.map(d=>d.record)].flatMap(refs));
 const candidates=new Set(removed.flatMap(refs));
 const removedMedia=mode==='all'?media:media.filter(m=>candidates.has(m.id)&&!referenced.has(m.id));
 return {mode,records:removed.length,kept:kept.length,casinos:mode==='all'?casinos.length:0,drafts:mode==='all'?drafts.length:0,
  images:removedMedia.filter(m=>!m.type?.startsWith('audio/')).length,audio:removedMedia.filter(m=>m.type?.startsWith('audio/')).length,
  vendors:mode==='all'?vendors.length:0,terms:mode==='all'?(meta.find(m=>m.id==='glossary')?.value?.terms?.length||0):0,
  names:removed.map(r=>r.name||'名稱待確認'),changes:[...removed.map(r=>({store:'records',delete:true,id:r.id})),...removedMedia.map(m=>({store:'media',delete:true,id:m.id}))]};
}
export function managementFingerprint(snapshot){
 return JSON.stringify(snapshot,(_k,v)=>typeof Blob!=='undefined'&&v instanceof Blob?{blobSize:v.size,blobType:v.type}:v);
}
export function deletionPlan({records,casinos,drafts},kind,id){
 let removedRecords=[],removedDrafts=[];
 if(kind==='record'){
  const r=records.find(r=>r.id===id);
  if(!r?.archived)throw Error('只能永久刪除已封存的紀錄。');
  removedRecords=[r];removedDrafts=drafts.filter(d=>d.id==='edit-'+id||d.id==='note-'+id);
 }else if(kind==='draft'){
  const d=drafts.find(d=>d.id===id);if(!d)throw Error('草稿已不存在。');removedDrafts=[d];
 }else throw Error('未知刪除類型。');
 const candidates=new Set([...removedRecords,...removedDrafts.map(d=>d.record)].flatMap(refs));
 const kept=new Set([...records.filter(r=>!removedRecords.includes(r)),...casinos,...drafts.filter(d=>!removedDrafts.includes(d)).map(d=>d.record)].flatMap(refs));
 const mediaIds=[...candidates].filter(mid=>!kept.has(mid));
 return {mediaIds,changes:[...removedRecords.map(r=>({store:'records',delete:true,id:r.id})),...removedDrafts.map(d=>({store:'drafts',delete:true,id:d.id})),...mediaIds.map(mid=>({store:'media',delete:true,id:mid}))]};
}
