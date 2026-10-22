// Keep document tables and schematic blocks intact in the browser's PDF output.
function exportPreparePrintTables(root){
 for(const table of root.querySelectorAll('table')){if(table.tHead)continue;const first=table.querySelector('tr');if(!first?.querySelector('th'))continue;const head=document.createElement('thead');head.append(first);table.prepend(head);const body=document.createElement('tbody');for(const row of [...table.querySelectorAll(':scope > tr')])body.append(row);if(body.children.length)table.append(body);}
}
document.addEventListener('DOMContentLoaded',()=>{
 let beforeTitle=null;for(const id of ['training-pdf','report-pdf'])$(id)?.addEventListener('click',()=>{beforeTitle=document.title;},true);
 window.addEventListener('beforeprint',()=>{for(const id of ['training-print','report-print']){const root=$(id);if(root)exportPreparePrintTables(root);}});
 window.addEventListener('afterprint',()=>{if(beforeTitle!==null){document.title=beforeTitle;beforeTitle=null;}});
});
