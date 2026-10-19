"""Practical coaching content must describe the same installation as the drawing."""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1440,'height':1100})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto('http://127.0.0.1:3016/?mode=local')
    page.locator('#view-training').click()
    result=page.evaluate('''()=>{
      const assert=(ok,msg)=>{if(!ok)throw Error(msg);};let cards=0;
      for(const e of trainingExercises){
        const plan=biblePlan(e,{players:14,keepers:2,space:'full',age:18,level:'developing'},{organisation:'auto'});
        for(const g of plan.groups){
          const s=bibleCoachScenario(e,g,0);
          for(const key of ['objective','placement','start','score','reset','look','intervene','meaning'])assert(typeof s[key]==='string'&&s[key].length>20,e.id+' lacks '+key);
          assert(s.liveBalls===g.material.activeBalls&&s.reserveBalls===g.material.reserveBalls,e.id+' invented inventory');
          assert(s.roles===g.roles&&s.dimensions.includes(g.width+' m'),e.id+' wrong setup');cards++;
        }
      }
      const e=trainingExercises.find(e=>e.id==='passes'),g=biblePlan(e,{players:14,keepers:0,space:'full',age:18,level:'developing'},{organisation:'single'}).groups[0],field=bibleDiagramField(g),stations=bibleCircuitStations(g,field),svg=bibleDiagramSVG(e,g),scene=svg.bibleScene;
      assert(g.fits&&stations.length===4,'four real circuits');
      assert(g.material.circuitCones===12&&svg.querySelectorAll('[data-equipment="cone"]').length===12,'three marked posts per circuit');
      assert(Math.abs((stations[1].x-stations[0].x-stations[0].w)/field.scale-3)<.001,'three metre separation not drawn');
      assert(scene.balls.length===4,'one live ball per circuit');
      for(const s of stations){
        const ball=scene.balls[s.index];assert(ball.owner===s.offset+1,'wrong circuit ball owner');
        for(const a of scene.tokens.filter(t=>t.number>s.offset&&t.number<=s.offset+s.players))assert(a.x>=s.x&&a.x<=s.x+s.w&&a.y>=s.y&&a.y<=s.y+s.h,'participant outside own circuit');
      }
      const demo=bibleAnimationPlan(e,g,{scene});
      for(let n=0;n<=20;n++)for(const a of bibleAnimationState(demo,demo.duration*n/20).players){const s=stations.find(s=>a.number>s.offset&&a.number<=s.offset+s.players);assert(a.x>=s.x-.001&&a.x<=s.x+s.w+.001&&a.y>=s.y-.001&&a.y<=s.y+s.h+.001,'run crosses adjacent circuit');}
      const wall=trainingExercises.find(e=>e.id==='wall-pass'),wg=biblePlan(wall,{players:6,keepers:0,space:'full'},{organisation:'single'}).groups[0],wp=bibleAnimationPlan(wall,wg),passes=wp.steps.filter(s=>s.action==='pass');
      assert(passes.length>=2&&passes[1].from===passes[0].to&&passes[1].to===passes[0].from,'wall pass never returns to original runner');
      assert(passes[1].motions.some(m=>m.kind==='player'&&m.id===passes[1].to&&Math.hypot(m.to.x-m.from.x,m.to.y-m.from.y)>.1),'wall pass receiver is static');
      const warm=trainingExercises.find(e=>e.id==='warm'),w=biblePlan(warm,{players:12,keepers:0,space:'full'},{organisation:'single'}).groups[0];
      assert(w.material.activeBalls===12&&w.material.circuitCones===0,'activation material');
      assert(![...warm.rules,...bibleKnowledge.warm.sequences.map(s=>s.rule)].some(s=>/passe/i.test(s)),'individual activation still asks for passes');
      const rondo=trainingExercises.find(e=>e.id==='rondo'),base={id:'preview-criteria-test',players:18,keepers:0,space:'full',age:18,level:'developing'};
      const big=biblePreviewState(rondo,base).variant.width,small=biblePreviewState(rondo,{...base,players:6});assert(small.variant.width<big&&small.variant.width===12,'default preview keeps old group dimensions');
      small.customised=true;small.variant.width=17;assert(biblePreviewState(rondo,{...base,players:8}).variant.width===17,'coach dimensions overwritten');
      return {cards,circuits:stations.length};
    }''')
    for exercise,players,keepers in [('rondo',6,0),('build',12,2),('cover',6,0),('passes',14,0)]:
        page.evaluate('''([id,n,g])=>{Object.assign(currentTraining,{players:n,keepers:g,space:'full'});openBibleSheet(trainingExercises.find(e=>e.id===id));}''',[exercise,players,keepers])
        dialog=page.locator('#bible-sheet-dialog')
        guide=dialog.locator('.bible-coach-guide')
        assert guide.is_visible()
        assert 'Installer' in guide.inner_text() and 'Lancer et faire jouer' in guide.inner_text()
        guide.locator('summary').click()
        assert guide.locator('.bible-coach-interventions p').count()>=4
        figure=dialog.locator('.bible-diagram')
        assert figure.locator('.training-diagram-screen [data-feature="coach"]').count()==1
        assert 'Installation' in figure.locator('.training-diagram-controls>strong').inner_text()
        assert 'À observer' in figure.locator('.bible-animation-observe').inner_text()
        figure.locator('.bible-animation-phase').first.click()
        assert 'Exemple d’action' in figure.locator('.training-diagram-controls>strong').inner_text()
        figure.locator('.bible-animation-reset').click()
        if exercise=='rondo':
            assert '5 passes' in guide.inner_text() and 'défenseurs' in guide.inner_text()
            page.screenshot(path='/tmp/bible-guide-rondo-desktop.png')
        if exercise=='passes':
            page.set_viewport_size({'width':390,'height':844})
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            figure.scroll_into_view_if_needed()
            page.screenshot(path='/tmp/bible-guide-circuits-mobile.png')
            page.set_viewport_size({'width':1440,'height':1100})
        dialog.get_by_role('button',name='Fermer',exact=True).click()
    assert not errors,errors
    print('PASS:',result,'coaching protocols, real circuits/posts/queues/balls, bounded demonstrations, individual activation, coach placement, installation/action modes and mobile.')
    browser.close()
