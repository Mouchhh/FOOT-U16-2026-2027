"""Real browser quota: compact journal fits where duplicate full library cannot; recover safely."""
from pathlib import Path
from playwright.sync_api import sync_playwright
source=Path('club-network.js').read_text()
helpers=source[source.index('function clubNetworkSaveJournalKey('):source.index('function clubNetworkRecoveryArchivePrefix(')]
setter=source[source.index('coachStorageSet=function(key,value){'):source.index('function clubNetworkResume(')]
stubs="""
var coachLibraryBaselines=new Map(),clubSaveLocalErrors=new Set(),clubSaveLocalConflicts=new Set();
var clubNetworkKinds={composition:'Composition'},clubNetworkSession={user:{id:'test'}};
function clubNetworkBound(){return true} function coachTeamEncodeLibrary(k,v){return v}
function coachStorageKey(k){return k} function coachStorageGet(k){return localStorage.getItem(k)}
function clubNetworkOriginalStorageSet(k,v){localStorage.setItem(k,v);coachLibraryBaselines.set(k,v)}
function clubNetworkLibraryKey(){return 'vestiaire-saves'}
function clubNetworkPayloadId(k,p){return p.documentId}
function clubNetworkSource(k,p){return {id:p.documentId,payload:p}}
function clubNetworkPending(k,id){return JSON.parse(localStorage.getItem('pending:'+id)||'null')}
function clubNetworkKnownVersion(){return {revision:0,id:null}}
function clubNetworkMarkPending(k,id,op,expected,stamp){localStorage.setItem('pending:'+id,JSON.stringify({kind:k,id,op,expected,stamp}))}
function clubNetworkError(m,status=0,code=''){return Object.assign(new Error(m),{status,code})}
function clubSaveStatus(s,d){window.lastSaveStatus={s,d}} function clubNetworkStatus(){}
function clubNetworkQueueSync(){return Promise.resolve()}
function clubNetworkLocalSaveMessage(e){return e.name}
"""
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);ctx=b.new_context();page=ctx.new_page()
 page.route('**/quota-test',lambda r:r.fulfill(content_type='text/html',body='<!doctype html><title>Disposable quota test</title>'))
 page.goto('http://127.0.0.1:3016/quota-test');page.add_script_tag(path='vendor/lz-string/lz-string.min.js');page.add_script_tag(content=stubs+helpers+setter)
 result=page.evaluate("""()=>{
 const assert=(ok,msg)=>{if(!ok)throw Error(msg)};
 let chunks=0;for(;;){try{localStorage.setItem('quota-filler:'+chunks,'x'.repeat(1024*1024));chunks++}catch(e){assert(e.name==='QuotaExceededError','Unexpected quota');break}}
 assert(chunks>=3,'Expected ordinary browser quota');
 const key='vestiaire-saves',previous=JSON.stringify([{state:{documentId:'doc',title:'Before',photo:'data:image/png;base64,'+'a'.repeat(700*1024)}}]);
 const rows=JSON.parse(previous);rows[0].state.title='Après sauvegarde ⚽';const next=JSON.stringify(rows);
 localStorage.setItem(key,previous);coachLibraryBaselines.set(key,previous);
 let oldFailed=false;try{localStorage.setItem(clubNetworkSaveJournalKey(key),JSON.stringify({key,value:next,jobs:[]}))}catch(e){oldFailed=e.name==='QuotaExceededError'}
 assert(oldFailed,'Old full-library duplicate must exceed actual quota');
 coachStorageSet(key,next);
 assert(localStorage.getItem(key)===next,'Saved document changed');assert(clubNetworkPending('composition','doc')?.op==='save','Outbox missing');
 assert(!localStorage.getItem(clubNetworkSaveJournalKey(key)),'Completed journal retained');
 for(let i=0;i<chunks;i++)assert(localStorage.getItem('quota-filler:'+i)?.length===1024*1024,'Unrelated data removed');
 // A completed library write survives a crash before the outbox is repaired.
 localStorage.removeItem('pending:doc');
 const jobs=clubNetworkSaveIntents('composition',previous,next),raw=clubNetworkEncodeJournal(key,next,jobs);
 assert(JSON.parse(raw).valueEncoding==='lz-utf16-v1','Compression missing');
 assert(clubNetworkParseJournal(raw).value===next,'Lossless Unicode recovery failed');
 localStorage.setItem(clubNetworkSaveJournalKey(key),raw);clubNetworkRepairSaves();
 assert(clubNetworkPending('composition','doc'),'Interrupted outbox not recovered');
 // A crash before the library commit preserves the different journal for recovery.
 rows[0].state.title='Not committed';const uncommitted=JSON.stringify(rows),pendingRaw=clubNetworkEncodeJournal(key,uncommitted,jobs);
 localStorage.setItem(clubNetworkSaveJournalKey(key),pendingRaw);
 let interrupted=false;try{clubNetworkRepairSaves()}catch(e){interrupted=e.code==='local_save_interrupted'}
 assert(interrupted,'Uncommitted write was acknowledged');
 assert(localStorage.getItem(key)===next,'Stored library replaced');
 assert(clubNetworkParseJournal(localStorage.getItem(clubNetworkSaveJournalKey(key))).value===uncommitted,'Recovery payload lost');
 assert(clubNetworkParseJournal(JSON.stringify({key,value:next,jobs})).value===next,'Legacy journal compatibility lost');
 return {oldFailed,newSaved:true,compressionPercent:Math.round(raw.length/next.length*100)};
}""")
 print('PASS actual Chromium quota, exact saved payload, preserved unrelated data, crash/outbox recovery, legacy journals:',result);b.close()
