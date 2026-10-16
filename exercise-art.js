// Dessins vectoriels partagés par la palette, le terrain et les exports HD.
function exerciseEquipmentArt(c,o){
 const color=o.color;c.save();c.lineJoin='round';c.lineCap='round';c.lineWidth=2;
 const path=(points,fill,stroke)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}};
 const ellipse=(x,y,rx,ry,fill,stroke)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}};
 const line=(x,y,xx,yy,stroke,width=2)=>{c.strokeStyle=stroke;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();};
 if(o.type!=='zone')ellipse(3,24,25,7,'#092b2838');
 if(['blue','red','keeper'].includes(o.type)){
  const g=c.createLinearGradient(-22,-25,22,28);g.addColorStop(0,color);g.addColorStop(1,'#142a43');
  path([[-13,-23],[-25,-18],[-34,-4],[-23,3],[-18,-4],[-18,25],[18,25],[18,-4],[23,3],[34,-4],[25,-18],[13,-23],[7,-17],[-7,-17]],g,'#ffffff');
  c.lineWidth=3;c.beginPath();c.arc(0,-25,10,.15,Math.PI-.15);c.strokeStyle='#ffffffcc';c.stroke();line(-16,20,16,20,'#ffffff55');
 }else if(o.type==='ball'){
  const g=c.createRadialGradient(-5,-6,2,0,0,16);g.addColorStop(0,'#fff');g.addColorStop(1,'#b7cad2');ellipse(0,0,16,16,g,'#122c40');const pent=[];for(let i=0;i<5;i++){const a=i*Math.PI*2/5-Math.PI/2;pent.push([Math.cos(a)*6,Math.sin(a)*6]);}path(pent,'#183347');for(const [x,y]of pent)line(x,y,x*2.3,y*2.3,'#3b5362',1.5);
 }else if(o.type==='disc'){
  ellipse(0,9,22,9,'#102a3033');ellipse(0,3,21,9,color,'#ffffffaa');path([[-19,2],[-8,-8],[8,-8],[19,2]],color,'#fff8');ellipse(0,-7,8,4,'#ffe4a1');ellipse(0,-7,3,1.8,'#774a22');
 }else if(o.type==='cone'){
  path([[-24,17],[-15,25],[25,20],[18,12]],'#b95c22','#fff8');path([[-17,17],[0,-29],[17,17]],color,'#fff9');path([[-11,0],[-7,-11],[7,-11],[11,0]],'#fff5df');line(0,-24,8,13,'#ffffff55',3);
 }else if(o.type==='goal'||o.type==='mini'){
  const z=o.type==='mini'?33:57,d=o.type==='mini'?22:32;
  path([[-z,17],[z,17],[z-10,-d],[-z+10,-d]],'#e5f6ff16','#b9d6e0');
  c.save();c.beginPath();c.moveTo(-z,17);c.lineTo(z,17);c.lineTo(z-10,-d);c.lineTo(-z+10,-d);c.closePath();c.clip();for(let x=-z;x<=z;x+=9)line(x,20,x,-d,'#e4f4ff99',1);for(let y=-d;y<=17;y+=8)line(-z,y,z,y,'#e4f4ff99',1);c.restore();
  line(-z,17,-z,-5,'#d9e7eb',5);line(z,17,z,-5,'#d9e7eb',5);line(-z,-5,z,-5,'#fff',6);line(-z,-5,-z+10,-d,'#d9e7eb',3);line(z,-5,z-10,-d,'#d9e7eb',3);line(-z+10,-d,z-10,-d,'#d9e7eb',3);ellipse(-z+7,20,5,5,'#253942');ellipse(z-7,20,5,5,'#253942');
 }else if(o.type==='dummy'){
  ellipse(0,-33,10,10,color,'#fff9');path([[-9,-20],[-20,-13],[-20,15],[-11,21],[-11,32],[11,32],[11,21],[20,15],[20,-13],[9,-20]],color,'#fff9');for(let x=-10;x<=10;x+=10)line(x,-12,x,15,'#4b351a88',2);line(-18,-6,18,-6,'#fff7',2);line(-14,34,14,34,'#dce7ec',4);
 }else if(o.type==='pole'){
  ellipse(0,25,15,7,'#254352','#fff7');line(0,23,0,-38,color,6);line(-1,-36,-1,18,'#fff8',1.5);line(-2,27,2,27,'#fff',2);
 }else if(o.type==='hurdle'){
  line(-25,24,-16,16,'#dee7eb',5);line(25,24,34,16,'#dee7eb',5);line(-22,21,-22,-12,color,6);line(29,18,29,-15,color,6);line(-22,-12,29,-15,color,7);line(-18,-13,25,-16,'#fff9',2);
 }else if(o.type==='ladder'){
  line(-21,-54,-21,54,'#1b2b36',5);line(21,-54,21,54,'#1b2b36',5);for(let y=-50;y<=50;y+=20){line(-21,y,21,y,color,6);line(-20,y-2,20,y-2,'#fff8',1);}
 }else if(o.type==='hoop'){
  c.lineWidth=6;ellipse(0,0,26,19,null,color);c.lineWidth=1.5;ellipse(-1,-2,26,19,null,'#ffffff99');
 }else if(o.type==='zone'){
  path([[-80,-55],[80,-55],[80,55],[-80,55]],color+'25');c.setLineDash([9,7]);c.strokeStyle=color;c.lineWidth=2;c.strokeRect(-80,-55,160,110);
 }
 c.restore();
}
