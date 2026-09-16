export let EKG={title:'EKG 詞彙',source_report:'',prepared:'',terms:[]};
export const termByName=new Map(),termById=new Map(),exact=new Map();
export function checkVocabulary(data){
 if(!data||!Array.isArray(data.terms)||data.terms.length<1||data.terms.length>1000)throw Error('詞彙表格式不正確。');
 for(const k of ['title','source_report','prepared','translation_note'])if(data[k]!==undefined&&typeof data[k]!=='string')throw Error('詞彙來源格式不正確。');
 const ids=new Set(),names=new Set();
 for(const t of data.terms){for(const k of ['id','term_en','term_zh','definition_en','definition_zh','example_game','definition_status','translation_status','source_file','notes'])if(typeof t[k]!=='string'||t[k].length>20000)throw Error('詞彙欄位不完整。');
 if(!t.id||!t.term_en||ids.has(t.id)||names.has(t.term_en.toLowerCase()))throw Error('詞彙ID或名稱重複。');
 if(!Number.isInteger(t.attribute)||!Number.isInteger(t.report_page))throw Error('詞彙頁碼格式不正確。');
 ids.add(t.id);names.add(t.term_en.toLowerCase());}
 return data;
}
export function setVocabulary(data){checkVocabulary(data);EKG=structuredClone(data);termByName.clear();termById.clear();exact.clear();for(const t of EKG.terms){termByName.set(t.term_en,t);termById.set(t.id,t);exact.set(t.term_en.toLowerCase(),t.term_en);exact.set(t.term_zh.toLowerCase(),t.term_en);}}
export function normalizeEKGRecord(record){if(!EKG.terms.length)return {...record};const matched=[],legacy=[...(record.legacyTags||[])];for(const value of record.tags||[]){const name=exact.get(value.trim().toLowerCase());if(name)matched.push(name);else legacy.push(value);}return {...record,tags:[...new Set(matched)],legacyTags:[...new Set(legacy)]};}

