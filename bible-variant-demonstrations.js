// Choreographies of alternative decisions, using the same clock and ball as the base reader.
// A clip is a possible action, never a mandatory pass pattern for a live game.
function bibleVariantDemonstration(design,h){
 if(!design||design.demo==='base'||design.demo.startsWith('reference-'))return false;
 const {group,players,blue,red,neutrals,keepers,point,current,move,advance,add,pass,carry,feet,owner,shot,recover,goalPoint}=h;
 const code=design.demo,start=players.find(p=>p.number===owner()),own=start?.team==='red'?red:blue;
 const mates=own.filter(p=>p!==start),a=start,b=mates[0]||neutrals[0],c=mates[1]||neutrals[1],enemy=start?.team==='red'?blue:red;
 if(!a)return false;
 const title=t=>t,detail=design.rule,at=(x,y)=>point(start?.team==='red'?1-x:x,y);
 const play=(from,to,label,moves=[])=>{if(from&&to&&from!==to)pass(from,to,label,detail,1.8,moves);};
 add('Lire la situation · '+design.title,detail,1);
 if(code.startsWith('quadrant-')){
  const [left,right,central]=neutrals;if(blue.length!==4||red.length!==4||neutrals.length!==3)return false;
  if(code==='quadrant-central'){play(left,blue[0],'1 · Recevoir dans son quadrant',[advance(blue[0],.03,.025)]);play(blue[0],central,'2 · Utiliser le joker protégé');play(central,blue[1],'3 · Trouver l’autre secteur',[advance(blue[1],.025,.04)]);play(blue[1],right,'4 · Relier l’appui de bout');}
  else if(code==='quadrant-around'){play(left,blue[2],'1 · Choisir l’angle extérieur');play(blue[2],blue[3],'2 · Relier les secteurs bas',[advance(blue[3],.015,-.03)]);play(blue[3],right,'3 · Atteindre l’appui opposé');}
  else{play(left,blue[0],'1 · Recevoir sous pression',[advance(red[0],-.02,0)]);play(blue[0],left,'2 · Revenir sans forcer');play(left,blue[2],'3 · Changer l’angle');play(blue[2],blue[3],'4 · Progresser dans l’autre couloir');play(blue[3],right,'5 · Relier les extrémités');}return true;
 }
 if(code.startsWith('expand-')){
  if(blue.length!==8||red.length!==5)return false;
  play(red[0],red[1],'1 · Les rouges conservent dans le petit carré',[advance(blue[0],-.02,-.025)]);
  recover(blue[0],'2 · Un bleu anticipe la passe','Exemple d’interception : les cinq rouges deviennent défenseurs, les huit bleus jouent dans le grand carré.',[move(blue[0],at(.45,.43))]);
  const outlet=code==='expand-safe'?blue[6]:blue[2];play(blue[0],outlet,code==='expand-safe'?'3 · Utiliser l’autre sortie':'3 · Sortir du petit carré',red.map((p,i)=>move(p,at(.3+(i%3)*.17,.27+Math.floor(i/3)*.38))));
  if(code==='expand-switch'){play(outlet,blue[7],'4 · Relier un soutien extérieur');play(blue[7],blue[5],'5 · Déplacer le jeu côté opposé');}
  else play(outlet,blue[4],'4 · Conserver hors de la première pression');return true;
 }

 if(code.startsWith('individual')){
  const active=players.filter(p=>!p.rotation&&!p.keeper),moves=active.map((p,i)=>advance(p,(i%2?-.045:.045),(i%3?-.055:.055)));
  add('Regarder puis changer de direction','Chaque joueur conserve son propre ballon ; les trajectoires montrées restent des exemples à adapter aux espaces libres.',2,moves);
  if(code==='individual-stop')add('Stabiliser et annoncer l’information','Arrêt du ballon, regard disponible, puis départ après l’annonce de la couleur.',1.6);
  add('Repartir dans un espace disponible','Les joueurs se répartissent ; pas de course vers un point central commun.',2,active.map((p,i)=>advance(p,(i%3?-.03:.03),(i%2?.05:-.05))));return true;
 }
 if(code.startsWith('quiet')){if(b){play(a,b,'Montrer une passe douce');if(code==='quiet-return')play(b,a,'Retrouver le soutien');}add('Faire verbaliser','Le coach recueille un exemple de réussite et une décision du thème, sans relancer une opposition.',2);return true;}
 if(code.startsWith('technical-'))return false; // Dedicated full station rotation, selected below in the circuit engine.
 if(code.startsWith('keeper-')){
  const k=keepers.find(p=>!p.rotation),team=k?players.filter(p=>!p.rotation&&!p.keeper&&(p.team===k.team||p.team==='neutral')):[];
  if(!k)return false;
  if(code==='keeper-close'||code==='keeper-angle'){
   const attacker=a.keeper?blue.find(p=>!p.keeper):a;if(!attacker)return false;
   carry(attacker,at(code==='keeper-angle'?.8:.77,code==='keeper-angle'?.22:.48),'Ajuster le dernier contact',detail,2,[move(k,at(code==='keeper-angle'?.92:.86,code==='keeper-angle'?.35:.49))]);
   if(code==='keeper-close'){recover(k,'Intervenir sur le contrôle long','Exemple d’un ballon que l’attaquant laisse à portée du gardien : avancer seulement si l’intervention est réalisable.',[move(k,at(.83,.48))]);}
   else shot(attacker,'Frapper depuis un angle fermé',[move(k,at(.95,.39))]);return true;
  }
  // The goalkeeper owns the opening ball for these exercises.
  const first=team[0],opposite=team[1];if(!first)return false;
  if(code==='keeper-return'){play(k,first,'Le gardien sert le soutien');play(first,k,'Revenir au gardien',enemy[0]?[advance(enemy[0],-.025,.025)]:[]);play(k,opposite||first,'Ressortir par un autre angle');}
  else{add('La première sortie est fermée','Le gardien regarde le soutien opposé ; la pression ferme une solution, pas les deux artificiellement.',1.8,enemy[0]?[move(enemy[0],at(.33,.27))]:[]);play(k,opposite||first,'Distribuer côté disponible');}return true;
 }
 if(code==='reinforce-wide'||code==='reinforce-cover')return false; // Keep the authored wave/entry clock, with adapted starting slots.
 if(code==='press-return'||code==='press-beaten'){
  const attack=start?.team==='red'?red:blue,defence=start?.team==='red'?blue:red,receiver=attack.find(p=>p!==a&&!p.keeper),next=attack.find(p=>p!==a&&p!==receiver&&!p.keeper);
  if(!receiver||!defence.length)return false;
  play(a,receiver,'La passe déclenche le déplacement',defence.map((p,i)=>move(p,at(.55+i*.065,Math.max(.15,Math.min(.85,.32+i*.16))))));
  if(code==='press-return'){
   play(receiver,a,'Le porteur revient au soutien',defence.map((p,i)=>advance(p,-.035,i%2?-.045:.045)));
   if(next)play(a,next,'Coulisser sur la nouvelle passe',defence.map((p,i)=>advance(p,0,i%2?.035:.055)));
  }else{
   const target=next||a;
   play(receiver,target,'Le premier rideau est dépassé',[move(target,at(.77,.68)),...defence.map((p,i)=>move(p,at(.81+(i%2)*.06,.22+(i+1)*.58/(defence.length+1))))]);
   add('Se reconnecter et protéger l’intérieur','La couverture ralentit ; le joueur dépassé revient dans le bloc, sans nouvelle récupération inventée.',2,defence.map((p,i)=>advance(p,.015,i%2?-.025:.025)));
  }return true;
 }
 if(code==='retreat'||code==='regain-safe'){
  let holder=a;
  if(code==='regain-safe'&&enemy[0]){recover(enemy[0],'Exemple de récupération','L’adversaire anticipe une passe ; la démonstration montre ensuite la première décision du nouveau porteur.',[move(enemy[0],at(.48,.42))]);holder=enemy[0];}
  if(code==='retreat'){
   if(['transition','counterpress-escape','rest-defence'].includes(h.exerciseId)&&red[0]){recover(red[0],'L’adversaire sort de la première pression','Exemple d’une perte bleue : les rouges maîtrisent le ballon ; les bleus protègent maintenant leur cible à gauche.',[move(red[0],point(.49,.43))]);holder=red[0];}
   const defending=holder.team==='red'?blue:red,direction=holder.team==='red'?-1:1;
   carry(holder,point(.5+direction*.1,.4),'Ralentir le porteur',detail,2,defending.map((p,i)=>move(p,point(.5+direction*(.2+.06*(i%2)),.2+(i+1)*.6/(defending.length+1)))));
   add('Revenir à des hauteurs différentes','Un joueur intervient ; les autres protègent les passes et la profondeur. Tous ne viennent pas sur le ballon.',2,defending.map((p,i)=>advance(p,direction*.025,i%2?-.025:.025)));
  }else{const safe=players.filter(p=>p!==holder&&!p.rotation&&!p.keeper&&(p.team===holder.team||p.team==='neutral')).sort((p,q)=>p.x-q.x).at(holder.team==='red'?-1:0);if(safe)play(holder,safe,'Sortir de la pression avec une sécurité');}
  return true;
 }
 if(code.startsWith('corner-')||code.startsWith('second-ball')){
  if(!b)return false;
  if(code==='corner-short'||code==='corner-def-short'){
   play(a,b,'Jouer le corner court',[move(b,at(.82,.13)),...(code==='corner-def-short'&&red[0]?[move(red[0],at(.87,.22))]:[])]);
   if(code==='corner-def-short'){add('Garder la couverture de la surface','Le second défenseur conserve une hauteur intérieure au lieu de sortir à deux.',2,red.slice(1).map((p,i)=>move(p,at(.88,.37+i*.09))));}
   else if(c)play(b,c,'Servir la surface si disponible',[move(c,at(.85,.49))]);
  }else{
   const defender=red[0];if(!defender)return false;
   recover(defender,'Le défenseur gagne le premier contact','La défense repousse le centre ; le soutien offensif anticipe la zone du second ballon.',[move(defender,at(.84,.5))]);
   if(code==='second-ball-def'){const outlet=red[1];if(outlet)play(defender,outlet,'Sortir du premier duel', [move(outlet,at(.59,.23)),...blue.slice(1,3).map(p=>advance(p,-.1,0))]);}
   else{recover(b,'Maîtriser le ballon dégagé','Le soutien reçoit le dégagement hors de la surface ; un partenaire reste en sécurité.',[move(b,at(.59,.65))]);if(c)play(b,c,'Trouver une nouvelle solution',[move(c,at(.73,.27))]);}
  }return true;
 }
 if(code==='nearpost'||code==='cross-cutback'){
  if(!b)return false;
  carry(a,at(.92,.14),'Le centreur prépare son service',detail,2,[move(b,at(code==='nearpost'?.91:.73,code==='nearpost'?.39:.53)),...(c?[move(c,at(.86,.7))]:[]),...enemy.slice(0,2).map((p,i)=>move(p,at(.88,.48+i*.15)))]);
  play(a,b,code==='nearpost'?'Attaquer le premier poteau':'Le ballon arrive en retrait');
  if(code==='cross-cutback'&&red[0])recover(red[0],'Fermer la réception en retrait','Exemple d’intervention défensive : le défenseur voit ballon et receveur avant de sortir.',[move(red[0],current(b))]);else shot(b,'Terminer l’action');return true;
 }
 if(code.startsWith('finish-')){
  const shooter=a,helper=b;if(code!=='finish-direct'&&!helper)return false;
  if(code==='finish-layoff'){
   play(shooter,helper,'Remettre hors de la ligne de pression',[move(helper,at(.7,.65)),...enemy.slice(0,1).map(p=>move(p,at(.79,.43)))]);carry(helper,at(.8,.59),'Ouvrir son angle de frappe',detail,1.8);shot(helper,'Finir après la remise');
  }else if(code==='finish-square'){
   carry(shooter,at(.78,.35),'Fixer avant la dernière passe',detail,1.8,[move(helper,at(.83,.68)),...enemy.slice(0,2).map((p,i)=>move(p,at(i?.9:.79,i?.47:.23))),...keepers.filter(p=>p.team!==shooter.team).map(p=>move(p,at(.95,.36)))]);play(shooter,helper,'Décaler le partenaire mieux placé');shot(helper,'Frapper après le décalage');
  }else{carry(shooter,at(.8,.45),'Préparer le dernier contact',detail,1.8);shot(shooter,'Frapper si la ligne est ouverte');}return true;
 }
 if(code==='carry'||code==='turn'||code==='underlap'||code==='depth-wide'||code==='wide'){
  if(code==='turn'&&b){play(a,b,'Recevoir et identifier le côté libre');carry(b,at(.68,.61),'Contrôler vers l’avant',detail,2,enemy[0]?[advance(enemy[0],.02,-.03)]:[]);}
  else if(code==='carry'){carry(a,at(.52,.42),'Progresser sans forcer la passe',detail,2,enemy[0]?[move(enemy[0],at(.65,.47))]:[]);if(b)play(a,b,'Transmettre après fixation',[move(b,at(.72,.73))]);}
  else if(b){const destination=at(code==='depth-wide'?.88:.74,code==='underlap'?.52:.83);add('Démarrer dans un autre couloir',detail,2,[move(b,destination),...enemy.slice(0,1).map(p=>code==='underlap'?move(p,at(.59,.22)):advance(p,.025,.025))]);play(a,b,'Servir la course disponible');if(c)play(b,c,'Conserver une deuxième action',[move(c,at(.78,.48))]);}else return false;
  return true;
 }
 if(!b)return false;
 if(code==='switch-low'){
  play(a,b,'Relier la base derrière la pression',[move(b,at(.17,.56))]);
  if(c)play(b,c,'Changer de côté par le soutien bas',[move(c,at(.6,.85)),...enemy.slice(0,2).map(p=>advance(p,-.03,.04))]);
 }else if(code==='return'||code==='recycle'){
  play(a,b,'Offrir un angle de soutien',[move(b,at(.36,.74)),...enemy.slice(0,1).map(p=>move(p,at(.57,.39)))]);
  play(b,a,'Revenir pour déplacer la pression',[move(a,at(.23,.45))]);
  if(c)play(a,c,code==='switch-low'?'Ressortir du côté faible':'Trouver une nouvelle solution',[move(c,at(.66,.2))]);
 }else if(code==='bypass'){
  if(c){add('Reconnaître le relais marqué',detail,1.6,enemy[0]?[move(enemy[0],at(.5,.4))]:[]);play(a,c,'Utiliser un autre angle',[move(c,at(.64,.8))]);play(c,b,'Retrouver le relais après déplacement',[move(b,at(.69,.53))]);}else play(a,b,'Servir le seul soutien accessible');
 }else if(code==='split'){
  if(c){play(a,b,'Déplacer la pression sur le côté',[move(b,at(.3,.17)),...enemy.slice(0,2).map((p,i)=>move(p,at(.5,.12+i*.64)))]);play(b,c,'Franchir dans la fenêtre ouverte',[move(c,at(.78,.49))]);}else play(a,b,'Trouver le partenaire opposé');
 }else return false;
 return true;
}
