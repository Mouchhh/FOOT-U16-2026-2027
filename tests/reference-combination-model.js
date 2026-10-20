const assert=require('node:assert/strict');
const {createReferenceCombination,referenceCombinationState:state,referencePlayerAt:at}=require('../reference-combination-model.js');
let cases=0;
for(const players of [3,4,5,6,7,8])for(const [width,length]of [[20,28],[24,32],[32,40]]){
 const p=createReferenceCombination({players,width,length});
 assert.equal(p.actors.length,players);assert.equal(p.material.balls,1);assert.equal(p.poles.length,6);assert.equal(new Set(p.cycles.map(c=>c.receiver)).size,players);
 for(const actor of p.actors){
  const motions=p.motions.filter(m=>m.id===actor.id);let end=0;
  for(const m of motions){assert.ok(m.start>=end-1e-8,'A player cannot execute overlapping runs');const before=at(p,actor.id,Math.max(0,m.start-.00001));assert.ok(Math.hypot(before.x-m.from.x,before.y-m.from.y)<.001,`Player ${actor.id} teleports at ${m.start}`);end=m.end;}
  const final=at(p,actor.id,p.duration);assert.ok(Math.hypot(final.x-actor.initial.x,final.y-actor.initial.y)<.001,'Full rotation must restore the role positions without renumbering');
 }
 for(const pass of p.passes){
  for(const t of [pass.start,pass.end]){const before=state(p,Math.max(0,t-.000001)),after=state(p,t+.000001);assert.ok(Math.hypot(before.ball.x-after.ball.x,before.ball.y-after.ball.y)<.001,'Ball teleports between owners or during a pass');}
  const middle=state(p,(pass.start+pass.end)/2),from=middle.flight.fromPoint,to=middle.flight.toPoint;assert.ok(Math.hypot(middle.ball.x-(from.x+to.x)/2,middle.ball.y-(from.y+to.y)/2)<.00001,'Pass must travel to the receiver’s real arrival position');
 }
 assert.ok(new Set(state(p,p.period+.9).moving).size>=3,'Agility, the supporting run and receiver run must share one clock');
 assert.equal(state(p,p.duration).owner,p.initialOwner,'The next block must keep the same ball');
 for(let t=0;t<=p.duration;t+=.05){const s=state(p,t);assert.equal(new Set(s.players.map(x=>x.number)).size,players);for(const a of [...s.players,s.ball])assert.ok(a.x>=0&&a.x<=width&&a.y>=0&&a.y<=length,'Actor or ball leaves the installation');}
 cases++;
}
assert.throws(()=>createReferenceCombination({players:2}));assert.throws(()=>createReferenceCombination({players:20}));
console.log('PASS',cases,'layouts: real simultaneous runs, stable numbers, one continuous ball, full player rotation, valid space and bounded roster.');
