const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('causerie-export.js','utf8');
const block=source.slice(source.indexOf('  function reserveWindow(){'),source.indexOf('  connect.onclick='));
for(const blocked of [false,true]){
 let submitted,intervals=0;
 const mainBody={append(form){form.destination='main';}};
 const popup={document:{body:{append(form){form.destination='popup';}}},close(){}};
 const context={window:{open(){return blocked?null:popup;}},busy:false,stopConnectionPoll(){},viewVersion:1,status:{},clubToken:()=> 'test-token',gateway:'https://gateway.example',location:{href:'https://club.example/index.html'},URL,document:{body:mainBody},el(tag){return {append(){},submit(){submitted={target:this.target,destination:this.destination,action:this.action};},remove(){}};},setInterval(){intervals++;},connectionPoll:null};
 vm.createContext(context);
 vm.runInContext(block+';startAuthorization();',context);
 assert.deepEqual(submitted,{target:'_self',destination:blocked?'main':'popup',action:'https://gateway.example/oauth/start'});
 assert.equal(intervals,blocked?0:1);
}
console.log('Canva: reserved-window POST and blocked-popup same-tab fallback passed.');
