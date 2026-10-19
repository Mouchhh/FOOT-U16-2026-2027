import fs from 'node:fs';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
export class Store {
  constructor(directory) { this.directory = directory; fs.mkdirSync(directory,{recursive:true,mode:0o700}); }
  file(owner) { if(!/^[0-9a-f-]{36}$/i.test(owner))throw Error('Compte invalide.');return path.join(this.directory,owner+'.json'); }
  read(owner) {
    let data;try { data=JSON.parse(fs.readFileSync(this.file(owner),'utf8')); } catch(error) { if(error.code!=='ENOENT')throw error;return {salt:randomBytes(32).toString('hex'),group:null,events:{},linked:false}; }
    data.events ||= {};let changed=false;for(const [id,event]of Object.entries(data.events))if(Date.parse(event.startsAt)<Date.now()-30*86400000){delete data.events[id];changed=true;}if(changed)this.write(owner,data);
    return data;
  }
  write(owner,data) { const file=this.file(owner),temp=file+'.tmp';fs.writeFileSync(temp,JSON.stringify(data),{mode:0o600});fs.renameSync(temp,file); }
  delete(owner) { fs.rmSync(this.file(owner),{force:true}); }
}
