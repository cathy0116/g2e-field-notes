const refs=r=>[...(r?.mediaIds||[]),...(r?.audioIds||[])];
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
