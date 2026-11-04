import { getBBox, getFurnitureRect } from '../../lib/geometry';
import { getOpeningCutRect, getOpeningSegment, getPartitionRect } from '../architecture/geometry';
import type { ProjectDataV2 } from '../../types/model';
import { projectFilename } from './json';

const esc = (value:string) => value
  .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]|[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g, '')
  .replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
function layout(project:ProjectDataV2) {
  const box = getBBox(project.room.polygon);
  const extras = [
    ...project.furniture.map(getFurnitureRect),
    ...(project.room.partitions ?? []).map(getPartitionRect),
    ...(project.room.zones ?? []).map(z => ({minX:z.x,minY:z.y,maxX:z.x+z.widthMm,maxY:z.y+z.depthMm})),
    ...(project.room.openings ?? []).map(o => getOpeningCutRect(project.room,o)).filter((r):r is NonNullable<typeof r> => r !== null),
  ];
  const minX=Math.min(box.minX,...extras.map(r=>r.minX)), maxX=Math.max(box.maxX,...extras.map(r=>r.maxX));
  const minY=Math.min(box.minY,...extras.map(r=>r.minY)), maxY=Math.max(box.maxY,...extras.map(r=>r.maxY));
  const margin = Math.max(maxX-minX,maxY-minY) * .12 + 150;
  return {box,margin,x:minX-margin,y:minY-margin,width:maxX-minX+margin*2,height:maxY-minY+margin*2};
}
export function planRasterSize(project:ProjectDataV2) {
  const {width,height} = layout(project), scale = 2048 / Math.max(width,height);
  return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};
}
export function createPlanSvg(project:ProjectDataV2):string {
  const {room,furniture} = project, {box,margin,x,y,width,height} = layout(project);
  const size = planRasterSize(project), font = Math.max(width,height)/95, stroke = Math.max(width,height)/650;
  const text = (x:number,y:number,value:string,anchor='start') => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${font}" fill="#253c45">${esc(value)}</text>`;
  const points = room.polygon.map(p => `${p.x},${p.y}`).join(' ');
  const zone = (room.zones ?? []).map(z => `<rect x="${z.x}" y="${z.y}" width="${z.widthMm}" height="${z.depthMm}" fill="#dcece8" stroke="#a1c8bf"/>${text(z.x+font/2,z.y+font*1.3,z.name)}`).join('');
  const partitions = (room.partitions ?? []).map(p => {const r=getPartitionRect(p);return `<rect x="${r.minX}" y="${r.minY}" width="${r.maxX-r.minX}" height="${r.maxY-r.minY}" fill="#71858d"/>`;}).join('');
  const openings = (room.openings ?? []).map(o => {const r=getOpeningCutRect(room,o), s=getOpeningSegment(room,o); if(!r || !s) return ''; return `<rect x="${r.minX}" y="${r.minY}" width="${r.maxX-r.minX}" height="${r.maxY-r.minY}" fill="white" stroke="#458396" stroke-width="${stroke}"/><line x1="${s.start.x}" y1="${s.start.y}" x2="${s.end.x}" y2="${s.end.y}" stroke="#458396" stroke-width="${stroke}"/>${text((s.start.x+s.end.x)/2,(s.start.y+s.end.y)/2-font*.5,`${o.name} ${o.widthMm} mm`,'middle')}`;}).join('');
  const items = furniture.map(item => {const r=getFurnitureRect(item);return `<rect x="${r.minX}" y="${r.minY}" width="${r.maxX-r.minX}" height="${r.maxY-r.minY}" fill="#e9d9b6" stroke="#876f4b" stroke-width="${stroke}"/>${text(item.position.x,item.position.y,item.name,'middle')}${text(item.position.x,item.position.y+font*1.3,`${item.widthMm} × ${item.depthMm} mm`,'middle')}`;}).join('');
  const dimensions = room.polygon.map((a,i) => {const b=room.polygon[(i+1)%room.polygon.length], length=Math.abs(a.x-b.x)+Math.abs(a.y-b.y);return text((a.x+b.x)/2,(a.y+b.y)/2-font*.45,`${length} mm`,'middle');}).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="${x} ${y} ${width} ${height}" role="img" aria-label="${esc(project.title)} 평면도"><rect x="${x}" y="${y}" width="${width}" height="${height}" fill="white"/>${text(box.minX,box.minY-margin*.5,`${project.title} · 단위 mm`)}<polygon points="${points}" fill="#f7faf9" stroke="#344d58" stroke-width="${stroke*3}"/>${zone}${partitions}${openings}${items}${dimensions}${text(box.minX,box.maxY+margin*.65,'계획용 도면 · 실제 치수와 현장을 확인하세요.')}</svg>`;
}
export function planFilename(project:ProjectDataV2, extension:'svg'|'png') { return projectFilename(project.title).replace(/\.json$/, `-plan.${extension}`); }
export function downloadBlob(blob:Blob, filename:string) { const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
export async function createPlanPng(project:ProjectDataV2):Promise<Blob> {
  const url=URL.createObjectURL(new Blob([createPlanSvg(project)],{type:'image/svg+xml;charset=utf-8'}));
  try {
    const image = new Image();
    await new Promise<void>((resolve,reject) => { image.onload=()=>resolve(); image.onerror=()=>reject(new Error('이미지를 만들 수 없습니다.')); image.src=url; });
    const size=planRasterSize(project), canvas=document.createElement('canvas'); canvas.width=size.width; canvas.height=size.height;
    const context=canvas.getContext('2d'); if(!context) throw new Error('이미지를 만들 수 없습니다.'); context.drawImage(image,0,0,size.width,size.height);
    return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob ? resolve(blob) : reject(new Error('이미지를 저장할 수 없습니다.')),'image/png'));
  } finally { URL.revokeObjectURL(url); }
}
export function printPlan(project:ProjectDataV2):boolean {
  const popup=window.open('', '_blank', 'width=1000,height=800'); if(!popup) return false;
  popup.document.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${esc(project.title)}</title><style>body{margin:1cm;font-family:sans-serif}svg{display:block;width:100%;height:auto;max-height:90vh}</style></head><body>${createPlanSvg(project)}</body></html>`);
  popup.document.close(); popup.focus(); popup.print(); return true;
}
