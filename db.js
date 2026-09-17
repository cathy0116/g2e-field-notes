import {dataManagementPlan,managementFingerprint} from './lifecycle.js';
export const DB_NAME='g2e-private-local-v2';
let db;
export async function openDB(){if(db)return db;db=await new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>{for(const store of ['records','media','vendors','meta','drafts'])req.result.createObjectStore(store,{keyPath:'id'});};req.onerror=()=>reject(req.error);req.onblocked=()=>reject(Error('請關閉同網址的其他舊分頁後重試。'));req.onsuccess=()=>resolve(req.result);});db.onversionchange=()=>{db.close();db=null;};return db;}
export async function all(store){const d=await openDB();return new Promise((resolve,reject)=>{const req=d.transaction(store).objectStore(store).getAll();req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
export async function get(store,id){const d=await openDB();return new Promise((resolve,reject)=>{const req=d.transaction(store).objectStore(store).get(id);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
export async function batch(changes){const d=await openDB();return new Promise((resolve,reject)=>{const tx=d.transaction([...new Set(changes.map(c=>c.store))],'readwrite');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error||Error('本機儲存未完成。'));tx.onerror=()=>{};try{for(const c of changes){const s=tx.objectStore(c.store);if(c.delete)s.delete(c.id);else s.put(c.value);}}catch(e){tx.abort();reject(e);}});}
export const put=(store,value)=>batch([{store,value}]);
// Read and delete within one transaction; a changed preview never deletes newer work.
export async function manageData(mode,expected){
 const d=await openDB(),stores=['records','media','vendors','meta','drafts'];
 return new Promise((resolve,reject)=>{
  const tx=d.transaction(stores,expected===undefined?'readonly':'readwrite');
  const snapshot={};let remaining=stores.length,result,failure;
  tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(failure||tx.error||Error('清除未完成，資料未變更。'));tx.onerror=()=>{};
  for(const name of stores){const req=tx.objectStore(name).getAll();req.onsuccess=()=>{
   snapshot[name]=req.result;if(--remaining)return;
   try{const fingerprint=managementFingerprint(snapshot),plan=dataManagementPlan(snapshot,mode);result={plan,fingerprint};
    if(expected!==undefined){if(expected!==fingerprint)throw Error('資料已變更，請重新預覽後再確認。');
     if(mode==='all')for(const store of stores)tx.objectStore(store).clear();
     else for(const c of plan.changes)tx.objectStore(c.store).delete(c.id);
    }
   }catch(e){failure=e;tx.abort();}
  };}
 });
}
export async function initialize(seed){if(await get('meta','seedVersion'))return;await batch([...seed.records.map(value=>({store:'records',value})),...seed.media.map(value=>({store:'media',value})),...seed.vendors.map(value=>({store:'vendors',value})),{store:'meta',value:{id:'seedVersion',value:seed.version}}]);}
