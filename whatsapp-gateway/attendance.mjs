import {createHmac} from 'node:crypto';
export function reactionStatus(emoji) {
  const normalized=String(emoji||'').replace(/[\u{1F3FB}-\u{1F3FF}\uFE0F\u200D]/gu,'');
  return normalized==='👍'?'present':normalized==='👎'?'absent':'uncertain';
}
// L'instantané courant remplace le précédent : une réaction retirée redevient « à confirmer ».
export function reactionSnapshot(members,reactions,salt){
  const rows=members.slice(0,200).map(member=>{const name=String(member.name||'Participant à identifier').trim();return {senderKey:createHmac('sha256',salt).update(member.id).digest('hex').slice(0,24),name:/^[+\d\s().-]{6,}$/.test(name)?'Participant à identifier':name.slice(0,80),isMe:!!member.isMe,status:'uncertain',emoji:'',time:null,reason:'Aucune réaction 👍 ou 👎.'};});
  const aliases=new Map();members.slice(0,200).forEach((member,i)=>{for(const id of [member.id,...(member.aliases||[])])aliases.set(id,i);});
  let unmatched=0;const latest=new Map();
  for(const reaction of reactions){
    const index=aliases.get(reaction.senderId);if(index===undefined){unmatched++;continue;}
    const previous=latest.get(index),time=Number(reaction.timestamp)||0;
    if(previous&&previous.time>time)continue;
    if(previous&&previous.time===time&&previous.emoji!==reaction.emoji){latest.set(index,{time,emoji:'',conflict:true});continue;}
    latest.set(index,{time,emoji:reaction.emoji||''});
  }
  for(const [index,reaction]of latest){const row=rows[index];row.emoji=String(reaction.emoji).slice(0,20);row.time=reaction.time||null;row.status=reactionStatus(reaction.emoji);row.reason=reaction.conflict?'Réactions contradictoires à vérifier.':row.status==='uncertain'?'Réaction différente ou retirée : à confirmer.':'Réaction '+row.emoji+' sous le message sélectionné.';}
  return {responses:rows,unmatched,limited:members.length>200};
}
export function validateEvent(value) {
  if (!value || typeof value.sessionId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(value.sessionId) || typeof value.title !== 'string' || !value.title.trim() || value.title.length > 120 || typeof value.messageId!=='string'||!/^[a-zA-Z0-9_@.:-]{1,250}$/.test(value.messageId)) throw Error('Séance ou message invalide.');
  const start=Date.parse(value.startsAt);
  if(!Number.isFinite(start)||start>Date.now()+90*86400000||start<Date.now()-30*86400000)throw Error('Choisissez une séance entre les 30 derniers jours et les 90 prochains jours.');
  return {sessionId:value.sessionId,title:value.title.trim(),startsAt:new Date(start).toISOString(),messageId:value.messageId};
}
