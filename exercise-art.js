// Matériel vectoriel : silhouette lisible sur fond clair, terrain et exports HD.
function exerciseEquipmentArt(c,o){
 const ink='#29445d',color=o.type==='pole'?'#8655c5':o.color||'#ffab2e';
 c.save();c.lineJoin='round';c.lineCap='round';c.lineWidth=1.6;
 const path=(p,fill,stroke=ink)=>{c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}};
 const line=(x,y,xx,yy,s=ink,w=2)=>{c.strokeStyle=s;c.lineWidth=w;c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();};
 const ellipse=(x,y,rx,ry,fill,stroke)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}};
 const rect=(x,y,w,h,r,fill,stroke)=>{c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}};
 const shade=(x,y,xx,yy,a,b)=>{const g=c.createLinearGradient(x,y,xx,yy);g.addColorStop(0,a);g.addColorStop(1,b);return g;};
 if(o.type!=='zone'){ellipse(2,30,25,5,'#102a3610');ellipse(2,29,18,3,'#102a3614');}
 if(['blue','red','keeper'].includes(o.type)){
  const fabric=shade(-28,-26,25,29,o.type==='blue'?'#4d7ed2':o.type==='red'?'#f34d55':'#ffe181',color);
  path([[-13,-24],[-25,-19],[-35,-5],[-24,4],[-18,-3],[-18,26],[18,26],[18,-3],[24,4],[35,-5],[25,-19],[13,-24],[8,-18],[-8,-18]],fabric);
  path([[-13,-24],[-8,-18],[0,-14],[8,-18],[13,-24],[7,-24],[0,-20],[-7,-24]],'#fff',null);
  line(-31,-8,-24,-3,'#fff',3);line(24,-3,31,-8,'#fff',3);
  path([[-17,-9],[-12,-5],[-12,23],[-17,23]],'#ffffff24',null);
  line(-16,23,16,23,'#ffffffa0',2);rect(7,-8,6,7,1,'#fff',null);line(-13,-12,-13,17,'#ffffff40',1.2);
 }else if(o.type==='ball'){
  const g=c.createRadialGradient(-7,-9,1,1,1,21);g.addColorStop(0,'#fff');g.addColorStop(.55,'#f4f8fc');g.addColorStop(1,'#91a8ba');ellipse(0,0,21,21,g,ink);
  const pent=[];for(let i=0;i<5;i++){const a=i*Math.PI*2/5-Math.PI/2;pent.push([Math.cos(a)*8,Math.sin(a)*8]);}path(pent,ink,null);
  for(const [x,y]of pent){line(x,y,x*2.35,y*2.35,'#50687b',1.3);ellipse(x*2.35,y*2.35,3.5,2.6,ink);}
  ellipse(-7,-9,5,3,'#ffffffbd');
 }else if(o.type==='cone'){
  path([[-25,18],[-16,27],[25,23],[18,14]],'#e47b1b');
  path([[-18,19],[-4,-28],[4,-28],[18,19]],shade(-18,0,18,0,'#ffcd63','#ff8e25'));
  path([[-12,1],[-8,-10],[8,-10],[12,1]],'#fff');line(-3,-23,-11,14,'#fff9',2);
 }else if(o.type==='disc'){
  ellipse(0,8,25,10,'#e9791a',ink);
  path([[-24,6],[-10,-7],[10,-7],[24,6]],shade(0,-8,0,12,'#ffd26e','#ff9b2d'));
  ellipse(0,-6,10,4,'#ffd783',ink);ellipse(0,-6,4,2,ink);c.lineWidth=1;ellipse(0,7,22,6,null,'#ffe2a1');
 }else if(o.type==='goal'||o.type==='mini'){
  const mini=o.type==='mini',w=mini?34:55,h=mini?26:37,front=mini?'#ff982e':'#f4f8fc';
  path([[-w,h/2],[w,h/2],[w-9,-h],[-w+9,-h]],'#e1edf7aa','#718aa1');
  c.save();c.beginPath();c.moveTo(-w,h/2);c.lineTo(w,h/2);c.lineTo(w-9,-h);c.lineTo(-w+9,-h);c.closePath();c.clip();
  for(let x=-w;x<w;x+=8)line(x,-h,x,h/2,'#8ca6bb99',.8);for(let y=-h;y<h/2;y+=7)line(-w,y,w,y,'#8ca6bb99',.8);c.restore();
  for(const [x,y,xx,yy]of [[-w,h/2,-w,-h+9],[-w,-h+9,w,-h+9],[w,-h+9,w,h/2],[-w,-h+9,-w+9,-h],[w,-h+9,w-9,-h],[-w+9,-h,w-9,-h]]){line(x,y,xx,yy,'#6e859b',5.5);line(x,y,xx,yy,front,3.6);}
  line(-w,h/2,w,h/2,'#536d80',2);if(!mini){ellipse(-w+4,h/2+3,4,4,ink);ellipse(w-4,h/2+3,4,4,ink);}
 }else if(o.type==='pole'){
  ellipse(0,28,17,6,'#263f56',ink);rect(-4,-39,8,65,3,shade(-4,0,4,0,'#b596f0','#7043b4'),ink);line(-1,-34,-1,20,'#e2d4ff',1.5);rect(-4,-39,8,7,2,'#e1cfff',ink);
 }else if(o.type==='dummy'){
  ellipse(0,-32,10,11,shade(-10,-42,10,-20,'#ffd46e','#f6a82f'),ink);
  path([[-10,-19],[-20,-10],[-19,19],[-11,25],[-10,34],[10,34],[11,25],[19,19],[20,-10],[10,-19]],shade(-20,0,20,0,'#ffd062','#f49a22'));
  for(const x of [-10,0,10])line(x,-9,x,20,'#9c5d14',2);line(-18,-2,18,-2,'#fff0ba',2);line(-19,35,19,35,ink,5);
 }else if(o.type==='ladder'){
  rect(-25,-53,7,106,3,shade(-25,0,-18,0,'#48627c','#21374c'));rect(18,-53,7,106,3,shade(18,0,25,0,'#48627c','#21374c'));
  for(let y=-48;y<=48;y+=19){rect(-24,y,48,7,3,shade(0,y,0,y+7,'#ffd971','#f0a32c'),ink);line(-19,y+2,19,y+2,'#ffe9ac',1);}
 }else if(o.type==='hurdle'){
  line(-26,26,-15,18,ink,5);line(20,26,33,18,ink,5);
  for(const [x,y,xx,yy]of [[-21,23,-21,-16],[-21,-16,27,-16],[27,-16,27,23]]){line(x,y,xx,yy,ink,8);line(x,y,xx,yy,'#ffb835',5);}
 }else if(o.type==='hoop'){
  c.lineWidth=7;ellipse(0,0,27,21,null,ink);c.lineWidth=4;ellipse(0,0,27,21,null,'#ffb835');c.lineWidth=1;ellipse(-1,-1,27,21,null,'#ffe3a0');
 }else if(o.type==='zone'){
  path([[-80,-55],[80,-55],[80,55],[-80,55]],color+'25',null);c.setLineDash([9,7]);c.strokeStyle=color;c.lineWidth=2;c.strokeRect(-80,-55,160,110);
 }
 c.restore();
}
