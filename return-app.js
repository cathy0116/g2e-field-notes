import {parseSource,assemble,esc,vendorFor,sortedRecords,searchText} from './return-core.js?v=1.1.0';
import {recordHtml,packageReport} from './return-export.js?v=1.1.0';
const $=s=>document.querySelector(s);let sources=[],batch=null,busy=false,shown=20,downloadUrl='';const urls=new Map();
const status=t=>{$('#status').textContent=t;};
function setBusy(v){busy=v;for(const el of document.querySelectorAll('input,select,button'))el.disabled=v;}
function refresh(){
 batch=assemble(sources);$('#workspace').hidden=!sources.length;
 $('#sources').innerHTML=sources.map((s,i)=>`<div class="source-row"><label><input type="checkbox" data-include="${i}" ${s.enabled?'checked':''}> ${esc(s.name)}</label><label>紀錄者<input data-owner="${i}" aria-label="${esc(s.name)} 的紀錄者" placeholder="姓名或代號（選填）" value="${esc(s.owner)}"></label><small>${s.data.records.length} 機台 · ${(s.data.casinos||[]).length} 賭場 · ${s.assets.length} 附件</small></div>`).join('');
 $('#summary').textContent=`勾選 ${batch.sources.length} 份來源 · ${batch.records.length} 筆紀錄 · ${batch.attachments.length} 份附件`;
 $('#export').disabled=busy||!batch.sources.length;
 $('#warnings').innerHTML=batch.warnings.length?`<details class="notice"><summary>${batch.warnings.length} 項待確認：重複 ID 或缺少附件</summary><ul>${batch.warnings.map(w=>`<li>${esc(w)}</li>`).join('')}</ul></details>`:'';
 for(const u of urls.values())URL.revokeObjectURL(u);urls.clear();
 const selected=$('#vendor').value;$('#vendor').innerHTML='<option value="">全部廠商</option>'+[...new Set(batch.records.map(vendorFor))].sort().map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');$('#vendor').value=selected;
 render();
}
function mediaUrl(path){if(!urls.has(path)){const a=batch.attachments.find(a=>a.path===path);if(a)urls.set(path,URL.createObjectURL(new Blob([a.bytes],{type:a.type})));}return urls.get(path)||'';}
function render(){if(!batch)return;const q=$('#search').value.trim().toLowerCase(),type=$('#category').value,vendor=$('#vendor').value;const rows=sortedRecords(batch).filter(r=>(!type||r.type===type)&&(!vendor||vendorFor(r)===vendor)&&searchText(r).includes(q));$('#records').innerHTML=rows.slice(0,shown).map(r=>recordHtml(r,batch.attachments,mediaUrl)).join('')||'<p class="empty">沒有符合的紀錄，請調整搜尋或勾選來源。</p>';$('#more').hidden=rows.length<=shown;$('#more').textContent=`顯示更多（目前 ${Math.min(shown,rows.length)} / ${rows.length} 筆）`;}
$('#files').addEventListener('change',async e=>{
 if(busy)return;const files=[...e.target.files];if(!files.length)return;
 if(sources.length+files.length>20||sources.reduce((n,s)=>n+s.raw.length,0)+files.reduce((n,f)=>n+f.size,0)>150*1024*1024){status('超過 20 份或 150 MB，請清空本頁後分批整理。');e.target.value='';return;}
 setBusy(true);let added=0;const errors=[];
 try{for(const file of files){status('正在讀取 '+file.name);try{const s=await parseSource(await file.arrayBuffer(),file.name);if(sources.some(x=>x.sha256===s.sha256)){errors.push(file.name+'：完全相同的檔案已略過');continue;}if(sources.reduce((n,x)=>n+x.data.records.length+(x.data.casinos||[]).length,0)+s.data.records.length+(s.data.casinos||[]).length>20000)throw Error('合計超過 20,000 筆，請分批');sources.push(s);added++;}catch(err){errors.push(file.name+'：'+err.message);}}}finally{setBusy(false);e.target.value='';refresh();status(`新增 ${added} 份。${errors.join('；')||'請核對紀錄者與內容，再下載整理包。'}`);}
});
$('#sources').addEventListener('change',e=>{if(e.target.dataset.include!==undefined)sources[Number(e.target.dataset.include)].enabled=e.target.checked;if(e.target.dataset.owner!==undefined)sources[Number(e.target.dataset.owner)].owner=e.target.value;refresh();});
for(const id of ['search','category','vendor'])$('#'+id).addEventListener('input',()=>{shown=20;render();});
$('#reset').addEventListener('click',()=>{for(const id of ['search','category','vendor'])$('#'+id).value='';shown=20;render();});
$('#more').addEventListener('click',()=>{shown+=20;render();});
$('#clear').addEventListener('click',()=>{if(!confirm('清空本頁的匯入資料？原始檔與 App 資料不會刪除。'))return;for(const u of urls.values())URL.revokeObjectURL(u);urls.clear();sources=[];refresh();status('已清空本頁，原始檔沒有改動。');});
$('#export').addEventListener('click',async()=>{
 if(busy)return;setBusy(true);try{status('正在準備整理包…');batch=assemble(sources);const res=await fetch('./return-template-v2.xlsx',{cache:'no-store'});if(!res.ok)throw Error('無法取得 Excel 範本，請連網重試');const bytes=await packageReport(batch,sources,await res.arrayBuffer(),window.JSZip,status);if(downloadUrl)URL.revokeObjectURL(downloadUrl);downloadUrl=URL.createObjectURL(new Blob([bytes],{type:'application/zip'}));const a=document.createElement('a');a.href=downloadUrl;a.download='G2E回國整理-'+new Date().toISOString().replace(/[:.]/g,'-')+'.zip';a.textContent='再次下載整理包';a.className='button';$('#status').textContent='整理包已製作。請確認下載完成，解壓縮後開啟 index.html。 ';$('#status').append(a);a.click();}catch(e){status('匯出失敗：'+e.message+'。原始資料仍保留，可重試。');}finally{setBusy(false);$('#export').disabled=!batch.sources.length;}
});
window.addEventListener('beforeunload',e=>{if(sources.length){e.preventDefault();e.returnValue='';}});
