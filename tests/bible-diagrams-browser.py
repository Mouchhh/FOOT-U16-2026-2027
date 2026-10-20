"""Exercise diagrams: true proportions, exact real participants/equipment, variants and responsive UI."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1100,'height':900})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content('''<style>body{margin:0;font-family:Arial}main{max-width:800px;margin:20px auto}.training-diagram{margin:0}.training-diagram-controls{display:flex;gap:8px;flex-wrap:wrap}.training-diagram-svg{display:block;width:100%;height:auto}.training-diagram-print{display:none}select{max-width:100%}figcaption{font-size:12px}</style><main></main>''')
    page.add_script_tag(content='let bibleKnowledge={};')
    page.add_script_tag(content=(ROOT/'training-adaptation.js').read_text())
    page.add_script_tag(content=(ROOT/'bible-diagrams.js').read_text())
    page.add_script_tag(content=(ROOT/'exercise-board.js').read_text().split('function drawExerciseBoard')[0])
    result=page.evaluate('''() => {
      const templates=['rondo','possession','endzones','four-goals','build','press','transition','finish','wide-finish','circuit','duel','corner','keeper'];
      let cases=0;
      for(const template of templates){
        const exercise={id:'fixture-'+template,title:'Situation '+template,kind:template==='circuit'?'circuit':template==='rondo'?'possession':'game',target:8,width:30,length:40,goal:'Retrouver les solutions en match.'};
        bibleKnowledge[exercise.id]={template,format:{min:2,max:24,ideal:8,neutrals:template==='possession'?2:0,keeperMode:['rondo','circuit','possession'].includes(template)?'feet':'goals',goalType:['four-goals'].includes(template)?'mini':'full',goals:template==='four-goals'?4:['rondo','circuit','possession'].includes(template)?0:template==='finish'||template==='corner'||template==='keeper'?1:2,zones:['endzones','build'].includes(template)?3:1},sequences:[{title:'Découvrir',rule:'Trouver un partenaire libre.'},{title:'Progresser',rule:'Jouer vers la zone opposée.'}]};
        for(const players of [2,7,14,40,80])for(const keepers of [0,Math.min(1,players),Math.min(3,players),Math.min(8,players)]){
          const plan=biblePlan(exercise,{players,keepers,age:18,level:'developing',space:'full'});
          for(const group of plan.groups){
            const svg=bibleDiagramSVG(exercise,group);
            if(svg.dataset.invalid)throw new Error('Répartition invalide '+template+' '+players+' '+keepers);
            const assert=(ok,msg)=>{if(!ok)throw new Error(template+' '+players+'/'+keepers+' : '+msg);};
            assert(svg.querySelectorAll('.exercise-player').length===group.players,'nombre de participants');
            assert(svg.querySelectorAll('[data-keeper="true"]').length===group.keepers,'nombre de gardiens');
            for(const [key,type] of [['balls','ball'],['discs','disc'],['cones','cone'],['goals','goal'],['miniGoals','miniGoal']])assert(svg.querySelectorAll('[data-equipment="'+type+'"]').length===group.material[key],'matériel '+key);
            assert(svg.querySelectorAll('[data-equipment="ball"][data-reserve="true"]').length===group.material.reserveBalls,'réserve de ballons');
            assert(svg.querySelectorAll('[data-rotation="true"]').length===group.rotatingKeepers,'gardiens en rotation');
            const board=bibleEditableBoard(exercise,group);
            if(svg.biblePlacement.length>100){
              assert(board===null,'Une copie trop dense est refusée sans supprimer de joueur ou de matériel');
            }else{
              assert(board&&validExerciseBoard(board),'copie atelier portable et valide');
              const objects=board.frames[0].objects;
              assert(objects.filter(o=>['blue','red','keeper'].includes(o.type)).length===group.players,'joueurs copiés dans atelier');
              for(const [key,type] of [['balls','ball'],['discs','disc'],['cones','cone'],['goals','goal'],['miniGoals','mini']])assert(objects.filter(o=>o.type===type).length===group.material[key],'matériel copié '+key);
            }
            assert(svg.textContent.includes('Largeur '+String(group.width)+' m'),'largeur explicitée');
            assert(svg.textContent.includes('Longueur '+String(group.length)+' m'),'longueur explicitée');
            if(!group.fits)assert(svg.textContent.includes('Installation à revoir'),'installation impossible signalée');
            // A single full goal and an opposite cone gate must occupy different ends.
            if(group.material.goals===1&&group.material.gates===1){const goal=svg.querySelector('[data-equipment="goal"]');assert(goal.dataset.side==='left','but et porte sur des côtés opposés');}
            cases++;
          }
        }
      }
      return cases;
    }''')
    assert result>250,result
    # Participant group switch preserves the selected sequence; a second figure cannot collide SVG marker IDs.
    page.evaluate('''() => {
      const e={id:'fixture-build',title:'Sortir du pressing',kind:'game',target:8,width:30,length:40,goal:'Progresser.'};
      const session={players:19,keepers:3,space:'full',age:18,level:'advanced'};
      window.testFigure=bibleDiagram(e,session,{sequenceIndex:1});document.querySelector('main').append(testFigure);
      document.querySelector('main').append(bibleDiagram(e,session,{sequenceControls:false}));
    }''')
    page.locator('.bible-diagram').first.locator('select').first.select_option('1')
    assert page.locator('.bible-diagram').first.get_attribute('data-sequence-index')=='1'
    assert 'Jouer vers la zone opposée' in page.locator('.bible-diagram-active-rule').first.inner_text()
    page.evaluate('testFigure.bibleSetSequence(0)')
    assert 'Trouver un partenaire libre' in page.locator('.bible-diagram-active-rule').first.inner_text()
    assert page.evaluate('''() => { const ids=[...document.querySelectorAll('[id]')].map(e=>e.id); return ids.length===new Set(ids).size; }''')
    # The playing rectangle must use the actual ratio, not an arbitrary wide diagram.
    assert page.evaluate('''() => { const svg=document.querySelector('.training-diagram-screen svg');const grass=svg.querySelector('[data-feature="playing-surface"]');return Math.abs(Number(grass.getAttribute('width'))/Number(grass.getAttribute('height'))-Number(svg.dataset.length)/Number(svg.dataset.width))<.00001; }''')
    page.screenshot(path='/tmp/bible-diagrams-desktop.png',full_page=True)
    page.set_viewport_size({'width':390,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.screenshot(path='/tmp/bible-diagrams-mobile.png',full_page=True)
    real=browser.new_page(viewport={'width':1100,'height':900})
    real.on('pageerror',lambda e:errors.append(str(e)))
    real.set_content('<main></main>')
    for name in ['training-data.js','training-knowledge.js','training-adaptation.js','bible-diagrams.js']:
        real.add_script_tag(content=(ROOT/name).read_text())
    catalogue=real.evaluate('''() => {
      let installations=0;
      for(const e of trainingExercises)for(const players of [4,13,25,48]){
        const plan=biblePlan(e,{players,keepers:Math.min(4,Math.floor(players/6)),space:'full',age:17,level:'developing'});
        for(const g of plan.groups){const svg=bibleDiagramSVG(e,g);if(svg.dataset.invalid||svg.querySelectorAll('.exercise-player').length!==g.players||svg.querySelectorAll('[data-keeper="true"]').length!==g.keepers)throw new Error(e.id+' : joueurs incohérents');installations++;}
      }
      const session={players:13,keepers:1,space:'full',age:17,level:'developing'};
      for(const [id,passes,moves] of [['triangle',3,0],['switch',1,0],['cover',0,2],['block',0,1],['transition',0,1],['counter',1,0],['cutback',1,0],['touch',1,0],['keeper-feet',1,0]]){
        const e=trainingExercises.find(e=>e.id===id),g=biblePlan(e,session).groups[0],svg=bibleDiagramSVG(e,g);
        if(svg.querySelectorAll('.bible-action-pass').length<passes||svg.querySelectorAll('.bible-action-move').length<moves)throw new Error(id+' : mécanisme attendu absent');
      }
      const corner=trainingExercises.find(e=>e.id==='cpa-attack'),g=biblePlan(corner,session).groups[0],svg=bibleDiagramSVG(corner,g),first=svg.biblePlacement.find(o=>o.type==='blue');
      if(!(first.long>g.length*.9&&first.wide<g.width*.1))throw new Error('Corner sans tireur');
      // A keeper's distribution must find a teammate or shared neutral, never
      // an opponent merely because the goalkeeper happens to defend the right goal.
      for(const id of ['keeper-feet','keeper-distribute']){
        const e=trainingExercises.find(e=>e.id===id),g=biblePlan(e,session).groups[0],svg=bibleDiagramSVG(e,g);
        const pass=svg.querySelector('.bible-action-pass[data-from-keeper="true"]');
        if(!pass||!([pass.dataset.fromTeam,'neutral'].includes(pass.dataset.toTeam)))throw new Error(id+' : distribution vers un adversaire');
      }
      return {exercises:trainingExercises.length,installations};
    }''')
    assert catalogue['exercises']>=60,catalogue
    assert not errors,errors
    print(f'PASS: {result} adapted diagram installations, all 13 templates; {catalogue["installations"]} real catalogue installations ({catalogue["exercises"]} exercises), tactical mechanisms/corner thrower; exact participants/GKs/equipment/reserves, editable copies, real aspect ratio, impossible layouts flagged, controls, unique SVG references and mobile.')
    browser.close()
