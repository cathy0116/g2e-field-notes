// Local outline icons: consistent 24px grid, no network dependency.
const paths={
 grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
 add:'<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 12h8m-4-4v8"/>',
 notes:'<path d="M8 3h11v18H5V6zM8 3v4H5m4 4h6m-6 4h6"/>',
 more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
 casino:'<path d="M4 21V5h12v16M16 10h4v11M2 21h20M8 9h1m3 0h1m-5 4h1m3 0h1m-4 8v-4h4v4"/>',
 vendor:'<path d="M3 10h18l-2-6H5zM5 10v11h14V10M9 21v-7h6v7M3 10c0 4 4 4 5 0 1 4 4 4 5 0 1 4 4 4 5 0 1 3 3 3 3 0"/>',
 book:'<path d="M12 5c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1v15"/>',
 backup:'<path d="M12 3v12m-4-4 4 4 4-4M4 15v6h16v-6"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3h.01"/>',
 archive:'<path d="M4 8h16v13H4zM3 3h18v5H3zM9 12h6"/>',
 draft:'<path d="M14 3H5v18h14v-9M13 8l6-6 3 3-6 6-4 1z"/>',
 chevron:'<path d="m9 5 7 7-7 7"/>'
};
export function icon(name){return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name]||paths.notes}</svg>`;}
export function primaryTab(view){if(['capture','new','casino-edit'].includes(view))return 'capture';if(['notes','casinos','casino','drafts','archive'].includes(view))return 'notes';if(['more','vendors','glossary','help','settings'].includes(view))return 'more';return 'catalog';}
export function navigation(){return [['catalog','grid','圖鑑'],['capture','add','記錄'],['notes','notes','我的'],['more','more','更多']].map(([route,glyph,label])=>`<a href="#${route}" data-tab="${route}">${icon(glyph)}<span class="nav-label">${label}</span></a>`).join('');}
export function myTabs(active){return `<nav class="subnav" aria-label="我的紀錄分類">${[['notes','機台'],['casinos','賭場'],['drafts','草稿'],['archive','封存']].map(([view,label])=>`<a href="#${view}" ${active===view?'aria-current="page"':''}>${label}</a>`).join('')}</nav>`;}
export function menuRow(route,glyph,title,subtitle=''){return `<a class="menu-row" href="#${route}">${icon(glyph)}<span><strong>${title}</strong>${subtitle?`<small>${subtitle}</small>`:''}</span>${icon('chevron')}</a>`;}
