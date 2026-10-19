import pkg from 'whatsapp-web.js';
import QRCode from 'qrcode';
import path from 'node:path';
const {Client,LocalAuth}=pkg;
export function createWhatsApp(owner,{directory,onState}) {
  const client=new Client({authStrategy:new LocalAuth({clientId:owner,dataPath:directory}),webVersionCache:{type:'local',path:path.join(directory,'cache-'+owner)},puppeteer:{executablePath:process.env.PUPPETEER_EXECUTABLE_PATH||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']}});
  let qrVersion=0,ready=false;
  client.on('qr',async value=>{try{const version=++qrVersion,image=await QRCode.toDataURL(value,{width:280,margin:2});if(version===qrVersion)onState({state:'qr',qr:image,qrExpires:Date.now()+55000});}catch{onState({state:'error'});}});
  client.on('authenticated',()=>{++qrVersion;onState({state:'connecting'});});
  client.on('ready',()=>{ready=true;++qrVersion;onState({state:'ready'});});
  client.on('auth_failure',()=>{ready=false;++qrVersion;onState({state:'error'});});
  client.on('disconnected',()=>{ready=false;++qrVersion;onState({state:'disconnected'});});
  const groupChat=async id=>{if(!ready)throw Error('WhatsApp non connecté.');const chat=await client.getChatById(id);if(!chat.isGroup)throw Error('Groupe invalide.');return chat;};
  return {
    start:()=>client.initialize(),
    async groups(){if(!ready)throw Error('WhatsApp non connecté.');return (await client.getChats()).filter(c=>c.isGroup).map(c=>({id:c.id._serialized,name:String(c.name||'Groupe sans nom').slice(0,100)}));},
    async announcements(group){const chat=await groupChat(group);return (await chat.fetchMessages({limit:100})).filter(m=>m.type==='chat'&&m.body).map(m=>({id:m.id._serialized,text:String(m.body).slice(0,300),time:m.timestamp,hasReaction:!!m.hasReaction})).sort((a,b)=>b.time-a.time).slice(0,50);},
    async reactions(group,messageId){
      const chat=await groupChat(group),message=await client.getMessageById(messageId);
      if(!message)throw Error('Message introuvable.');
      const origin=await message.getChat();if(!origin.isGroup||origin.id._serialized!==group)throw Error('Message hors du groupe sélectionné.');
      const members=[];
      for(const participant of chat.participants){
        const id=participant.id._serialized;let contact;try{contact=await client.getContactById(id);}catch{}
        const aliases=[contact?.id?._serialized,contact?.number?contact.number+'@c.us':null].filter(Boolean);
        members.push({id,aliases,name:contact?.name||contact?.pushname||contact?.shortName||'Participant à identifier',isMe:!!contact?.isMe});
        if(members.length>=201)break;
      }
      const groups=await message.getReactions(),reactions=(groups||[]).flatMap(g=>(g.senders||[]).map(sender=>({senderId:sender.senderId,emoji:sender.reaction||g.aggregateEmoji||g.id||'',timestamp:sender.timestamp})));
      return {members,reactions,message:{id:message.id._serialized,text:String(message.body||'').slice(0,500),time:message.timestamp}};
    },
    async stop(){++qrVersion;try{if(ready)await client.logout();}finally{ready=false;await client.destroy().catch(()=>{});}},
    async close(){++qrVersion;ready=false;await client.destroy().catch(()=>{});}
  };
}
