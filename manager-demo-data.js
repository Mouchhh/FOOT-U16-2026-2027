// Shared fictional data for the manager overview and statistics. No network or storage.
(() => {
 const day=d=>new Intl.DateTimeFormat('fr-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
 const today=()=>day(new Date());
 const shift=(v,n)=>{const d=new Date(v+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
 function documents(){
  const configs=[['c1','U17',18],['c2','U15',16],['c3','SENIORS',20],['c4','U13',16],['c5','U19',18],['c6','U11',14]],docs=[];
  const monday=shift(today(),-(new Date(today()+'T12:00:00Z').getUTCDay()+6)%7);
  const themes=['Conservation','Relance','Finition','Transitions','Défense','Pressing'];
  const iso=d=>new Date(d+'T20:00:00+01:00').toISOString();
  const modified=d=>iso(d)>new Date().toISOString()?new Date().toISOString():iso(d);
  for(const [ci,[owner_id,category,size]] of configs.entries()){
   const teamContext={id:'team-'+owner_id,team:category+' · Équipe 1'};
   for(let week=0;week<8;week++){
    for(let session=0;session<3;session++){
     const d=shift(monday,-week*7+session*2),time='18:30',valid=d<today()&&(week+session+ci)%7!==0;
     const attendance={version:1,date:d,time,validatedAt:valid?iso(d):'',rows:Array.from({length:size},(_,i)=>({id:owner_id+'-p'+i,name:'Joueur '+String(i+1).padStart(2,'0'),included:true,status:(i+week+session+ci)%13===0?'uncertain':(i+week+session)%8===0?'absent':'present'}))};
     docs.push({id:'training-'+owner_id+'-'+week+'-'+session,source_id:'t-'+week+'-'+session,kind:'training',owner_id,category,updated_at:modified(d),title:ci===0&&week===0&&session===0?'Conserver pour avancer':'Séance '+category,stats:{teamContext,team:teamContext.team,date:d,time,duration:category==='U11'?75:90,themes:[themes[(week+session+ci)%themes.length]],attendance}});
    }
    const d=shift(monday,-week*7-2),gf=(week+ci)%4,ga=(week+ci+1)%3;
    docs.push({id:'report-'+owner_id+'-'+week,source_id:'r-'+week,kind:'report',owner_id,category,updated_at:modified(d),title:'Bilan '+category,stats:{id:'r-'+week,teamContext,team:teamContext.team,eventType:'match',info:{date:d,time:'15:00',opponent:'Équipe invitée '+week,goalsFor:week===5?'':String(gf),goalsAgainst:week===5?'':String(ga),duration:'90'},ratings:Object.fromEntries(['project','defence','attack','physical','cohesion','attitude','emotions'].map((k,i)=>[k,{score:(week+i)%9===0?'':String(2.5+((week+i+ci)%5)*.5)}])),players:Array.from({length:Math.min(size,16)},(_,i)=>({id:'row-'+i,squadPlayerId:owner_id+'-p'+i,name:'Joueur '+String(i+1).padStart(2,'0'),minutes:(week+i)%13===0?'':String(i<11?60+(i%3)*10:20),goals:i===week%11?'1':'0',assists:(week+i)%11===0?'':i===(week+2)%11?'1':'0',yellowCards:i===week%9?'1':'0',redCards:'0'}))}});
   }
  }
  return docs;
 }
window.CruzaManagerDemo=Object.freeze({documents});
})();
