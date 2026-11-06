from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000},timezone_id='America/Los_Angeles',reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 page.goto('http://localhost:3016/?mode=local');page.wait_for_function('typeof trainingAgendaNext==="function"')
 page.evaluate('''()=>{
 homeClubNow=()=>({day:'2026-11-06',minutes:Date.parse('2026-11-06T09:00:00Z')/60000});
 playerStatsNow=()=>({day:'2026-11-06',time:'09:00'});
 const slot={id:'slot-friday',seriesId:'series-friday',day:5,type:'training',time:'19:00',title:'Séance du vendredi',status:'pending',location:'Terrain',category:activeCoachTeam.category||'',from:'2026-11-01',to:null,seasonEnd:'2027-06-15'};
 const plan={version:2,scope:'persistent',revision:0,enabled:true,from:'2026-11-01',to:null,category:slot.category,statuses:{},exceptions:{},slots:[slot]};
 if(!agendaRecurringValid(plan))throw Error('Bad fixture');coachStorageSet(agendaRecurringKey,JSON.stringify(plan));
 }''')
 assert page.evaluate('trainingAgendaNext().date')=='2026-11-06'
 assert page.evaluate('newTraining().time')=='19:00'
 assert page.evaluate('newTraining().agendaLink.eventId')=='recurring:slot-friday:2026-11-06'
 page.evaluate("()=>{const s=trainingAssistantGenerate({objectives:['ball-build'],level:'U17 Régional',players:'14 + 2',space:'half'});s.title='Séance préparée par le coach';window.linkedSession=trainingAgendaPrepareSave(s);trainingLibrary=[linkedSession];coachStorageSet('vestiaire-training-library',JSON.stringify(trainingLibrary));renderTrainingLibrary();renderHomeWidgets();}")
 assert page.evaluate("agendaCalendarAllEvents({from:'2026-11-06',to:'2026-11-06'}).filter(e=>e.kind==='training'&&e.date==='2026-11-06').length")==1
 assert page.evaluate('homeWidgetsSnapshot().training.session.title')=='Séance préparée par le coach'
 assert page.evaluate('newTraining().date')=='2026-11-13'
 assert page.evaluate('trainingAgendaOccurrence({...linkedSession,libraryOnly:true,agendaLink:undefined})') is None
 assert page.evaluate("()=>{try{trainingAgendaPrepareSave({...structuredClone(linkedSession),id:crypto.randomUUID()});return false}catch(e){return e.message.includes('doublon')}}")
 # A moved recurrence remains one event; reopening keeps the prepared blocks.
 page.evaluate("agendaRecurringChange('recurring:slot-friday:2026-11-06','one',{date:'2026-11-07',time:'18:00',title:'Séance décalée',location:'Terrain'},agendaRecurringRead().revision)")
 assert page.evaluate('homeWidgetsSnapshot().training.date')=='2026-11-07'
 page.locator('#home-live-widgets .home-live-training button').click()
 assert page.evaluate('currentTraining.date')=='2026-11-07'
 assert page.evaluate('currentTraining.blocks.length')==4
 page.locator('#view-training').click();page.evaluate('trainingWizard.openLibrary()')
 card=page.locator('.training-saved-card').filter(has_text='Séance préparée par le coach')
 card.get_by_role('button',name='Supprimer',exact=True).click();card.get_by_role('button',name='Annuler',exact=True).click();assert page.evaluate('trainingLibrary.length')==1
 card.get_by_role('button',name='Supprimer',exact=True).click()
 page.evaluate("window.oldSet=coachStorageSet;coachStorageSet=(key,value)=>{if(key===agendaRecurringKey)throw Error('Simulated failure');return oldSet(key,value)}")
 card.get_by_role('button',name='Oui, supprimer',exact=True).click()
 assert page.evaluate('trainingLibrary.length')==1
 assert page.evaluate("agendaRecurringResolve('recurring:slot-friday:2026-11-06')!==null")
 page.evaluate('coachStorageSet=oldSet')
 card.get_by_role('button',name='Oui, supprimer',exact=True).click()
 assert page.evaluate('trainingLibrary.length')==0
 assert page.evaluate("agendaRecurringResolve('recurring:slot-friday:2026-11-06')") is None
 assert page.evaluate('agendaRecurringRead().slots.length')==1
 assert page.evaluate('trainingAgendaNext().date')=='2026-11-13'
 page.evaluate("homeClubNow=()=>({day:'2026-11-13',minutes:Date.parse('2026-11-13T20:00:00Z')/60000})")
 assert page.evaluate('trainingAgendaNext().date')=='2026-11-20'
 assert not errors,errors;b.close()
print('PASS: Paris next occurrence, automatic linkage, one agenda event, prepared widget, reschedule, guarded deletion and preserved weekly recurrence')
