from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 ctx=b.new_context(viewport={'width':1366,'height':900});ctx.add_init_script("localStorage.setItem('vestiaire-coach-profiles',JSON.stringify([{id:'legacy',name:'Enzo Mouchet'}]))");page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 def agenda(page):
  page.locator('#view-coach-agenda').click();page.evaluate('workspaceFlows.agenda.go(1)');month=page.locator('#coach-agenda-month');month.fill('2026-11');month.dispatch_event('change')
 page.goto('http://127.0.0.1:3016/?mode=local');page.wait_for_function("typeof agendaEventEdits==='function'");agenda(page)
 original=page.evaluate('JSON.stringify(clubFixtureSchedules)')
 source=page.locator('[data-date="2026-11-07"] .agenda-calendar-event');target=page.locator('.agenda-calendar-day[data-date="2026-11-08"]')
 assert source.get_attribute('draggable')=='true'
 source.drag_to(target)
 assert page.locator('[data-date="2026-11-07"] .agenda-calendar-event').count()==0
 moved=page.locator('[data-date="2026-11-08"] .agenda-calendar-event');assert moved.count()==1
 assert '10:30' in moved.inner_text()
 assert page.evaluate('agendaEventEdits()[0].date')=='2026-11-08'
 assert page.locator('[data-agenda-day="2026-11-08"]').get_attribute('aria-pressed')=='true'
 assert page.evaluate('JSON.stringify(clubFixtureSchedules)')==original
 # Same-date drop, canceled drop and unknown external drag have no effect.
 moved.drag_to(target);assert page.evaluate('agendaEventEdits().length')==1
 moved.drag_to(page.locator('#coach-agenda-title'));assert page.locator('[data-date="2026-11-08"] .agenda-calendar-event').count()==1
 page.locator('.agenda-calendar-day[data-date="2026-11-09"]').dispatch_event('drop');assert page.locator('[data-date="2026-11-09"] .agenda-calendar-event').count()==0
 page.reload();page.wait_for_function("typeof agendaEventEdits==='function'");agenda(page);assert page.locator('[data-date="2026-11-08"] .agenda-calendar-event').count()==1
 # Retain existing title/time/location edits while moving, including next-month padding cells.
 page.evaluate("()=>{const r=agendaEventEdits();r[0].title='Rencontre déplacée';r[0].location='Terrain 2';coachStorageSet('vestiaire-agenda-event-edits',JSON.stringify(r));renderCoachAgenda()}")
 # Start moving before scrolling to an off-screen row, as a real mouse gesture does.
 chip=page.locator('[data-date="2026-11-08"] .agenda-calendar-event');chip.scroll_into_view_if_needed();box=chip.bounding_box();x,y=box['x']+box['width']/2,box['y']+box['height']/2
 page.mouse.move(x,y);page.mouse.down();page.mouse.move(x-15,y+5,steps=5)
 destination=page.locator('.agenda-calendar-day[data-date="2026-12-01"]');destination.scroll_into_view_if_needed();box=destination.bounding_box();page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2,steps=10);page.mouse.up()
 assert page.locator('#coach-agenda-month').input_value()=='2026-12'
 edit=page.evaluate('agendaEventEdits()[0]');assert edit['title']=='Rencontre déplacée' and edit['location']=='Terrain 2' and edit['time']=='10:30' and edit['date']=='2026-12-01'
 # Storage failure leaves the original date and clears visual drag state.
 page.evaluate("()=>{window.writer=coachStorageSet;coachStorageSet=(k,v)=>{if(k==='vestiaire-agenda-event-edits')throw Error('quota');return writer(k,v)}}")
 page.locator('[data-date="2026-12-01"] .agenda-calendar-event').drag_to(page.locator('.agenda-calendar-day[data-date="2026-12-02"]'))
 assert page.locator('[data-date="2026-12-01"] .agenda-calendar-event').count()==1
 assert page.locator('.agenda-dragging,.agenda-drop-target').count()==0
 page.evaluate('()=>{coachStorageSet=writer}')
 # Real touch events: hold, slide, release. No accidental opening of the match.
 mobile=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);mobile.add_init_script("localStorage.setItem('vestiaire-coach-profiles',JSON.stringify([{id:'legacy',name:'Enzo Mouchet'}]))");phone=mobile.new_page();phone.on('pageerror',lambda e:errors.append(str(e)));phone.goto('http://127.0.0.1:3016/?mode=local');phone.wait_for_function("typeof agendaEventEdits==='function'");agenda(phone)
 chip=phone.locator('[data-date="2026-11-07"] .agenda-calendar-event');chip.scroll_into_view_if_needed();a=chip.bounding_box();z=phone.locator('.agenda-calendar-day[data-date="2026-11-08"]').bounding_box();cdp=mobile.new_cdp_session(phone)
 x,y=a['x']+a['width']/2,a['y']+a['height']/2
 cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]});phone.wait_for_timeout(400)
 assert phone.locator('.agenda-drag-ghost').is_visible()
 cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':z['x']+z['width']/2,'y':z['y']+z['height']/2}]})
 cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
 assert phone.locator('[data-date="2026-11-08"] .agenda-calendar-event').count()==1
 assert phone.locator('[data-date="2026-11-07"] .agenda-calendar-event').count()==0
 assert phone.locator('.agenda-drag-ghost').count()==0
 assert phone.locator('#coach-agenda').is_visible()
 assert phone.evaluate('document.documentElement.scrollWidth<=innerWidth')
 assert not errors,errors
 mobile.close();ctx.close();b.close();print('Desktop and real touch dragging, same/outside drops, persistence, cross-month move, metadata preservation and quota rollback passed')
