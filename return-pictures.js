import {esc,sortedRecords} from './return-core.js?v=1.1.0';
// Browser export fills the artifact-tool workbook template. OOXML drawings keep
// original JPEG/PNG bytes; unsupported images remain accessible in the HTML.
function size(a){
 const b=a.bytes;
 if(a.type==='image/png'&&b.length>=24&&b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71){const v=new DataView(b.buffer,b.byteOffset,b.byteLength);return [v.getUint32(16),v.getUint32(20)];}
 if(a.type==='image/jpeg'&&b[0]===255&&b[1]===216){let p=2;while(p+8<b.length){if(b[p++]!==255)break;while(b[p]===255)p++;const m=b[p++];if(m===217||m===218)break;if(m===1||(m>=208&&m<=215))continue;const n=b[p]*256+b[p+1];if(n<2||p+n>b.length)break;if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(m))return [b[p+5]*256+b[p+6],b[p+3]*256+b[p+4]];p+=n;}}
 return null;
}
export async function addOverviewPictures(zip,c){
 const relns='http://schemas.openxmlformats.org/package/2006/relationships',office='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
 const rows=sortedRecords(c).filter(r=>r.type==='機台'),assets=new Map(c.attachments.map(a=>[a.path,a])),draw=[],rels=[],links=[],sheetRels=[];let sheet=await zip.file('xl/worksheets/sheet1.xml').async('string');
 for(const [i,r] of rows.entries()){
  links.push(`<hyperlink ref="B${i+2}" r:id="link${i}"/>`);sheetRels.push(`<Relationship Id="link${i}" Type="${office}/hyperlink" Target="index.html#${esc(r.key)}" TargetMode="External"/>`);
  const a=r.photos.map(p=>assets.get(p)).find(a=>a&&size(a)),d=a&&size(a);if(!d||!d[0]||!d[1])continue;
  const n=draw.length+1,scale=Math.min(140/d[0],148/d[1]),w=Math.round(d[0]*scale),h=Math.round(d[1]*scale),x=Math.round((150-w)/2),y=Math.round((176-h)/2);
  const marker=(px,py)=>`<xdr:col>2</xdr:col><xdr:colOff>${px*9525}</xdr:colOff><xdr:row>${i+1}</xdr:row><xdr:rowOff>${py*9525}</xdr:rowOff>`;
  zip.file(`xl/media/overview${n}.${a.ext}`,a.bytes);
  rels.push(`<Relationship Id="img${n}" Type="${office}/image" Target="/xl/media/overview${n}.${a.ext}"/>`);
  draw.push(`<xdr:oneCellAnchor><xdr:from>${marker(x,y)}</xdr:from><xdr:ext cx="${w*9525}" cy="${h*9525}"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${n}" name="${esc(a.exportName)}" descr="${esc(r.raw.name+'；'+(a.origin||'來源未註明'))}"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="img${n}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${w*9525}" cy="${h*9525}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor>`);
  sheet=sheet.replace(new RegExp(`(<c\\b[^>]*r="C${i+2}"[^>]*>)[\\s\\S]*?<\\/c>`),'$1<is><t></t></is></c>');
 }
 if(!sheet.includes('xmlns:r='))sheet=sheet.replace('<worksheet ','<worksheet xmlns:r="'+office+'" ');
 // hyperlinks must precede pageMargins/pageSetup/drawing in the worksheet schema.
 if(links.length){const hyperlinks=`<hyperlinks>${links.join('')}</hyperlinks>`;sheet=/<pageMargins|<pageSetup/.test(sheet)?sheet.replace(/<(pageMargins|pageSetup)/,hyperlinks+'<$1'):sheet.replace('</worksheet>',hyperlinks+'</worksheet>');}
 if(draw.length){
  zip.file('xl/drawings/overview.xml',`<?xml version="1.0" encoding="UTF-8"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="${office}">${draw.join('')}</xdr:wsDr>`);
  zip.file('xl/drawings/_rels/overview.xml.rels',`<Relationships xmlns="${relns}">${rels.join('')}</Relationships>`);
  sheetRels.push(`<Relationship Id="overview" Type="${office}/drawing" Target="/xl/drawings/overview.xml"/>`);sheet=sheet.replace('</worksheet>','<drawing r:id="overview"/></worksheet>');
  let ct=await zip.file('[Content_Types].xml').async('string');for(const [ext,type]of [['jpg','image/jpeg'],['png','image/png']])if(!ct.includes(`Extension="${ext}"`))ct=ct.replace('</Types>',`<Default Extension="${ext}" ContentType="${type}"/></Types>`);
  ct=ct.replace('</Types>','<Override PartName="/xl/drawings/overview.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/></Types>');zip.file('[Content_Types].xml',ct);
 }
 zip.file('xl/worksheets/sheet1.xml',sheet);if(sheetRels.length)zip.file('xl/worksheets/_rels/sheet1.xml.rels',`<Relationships xmlns="${relns}">${sheetRels.join('')}</Relationships>`);
}
