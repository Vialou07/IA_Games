/* =====================================================================================
   home.js — ACCUEIL et BILAN D'UNE SOIRÉE (propriétaire : agent socle)
   Une grille de widgets arrondis qui suit le moment (homeMoment, règles de v13.5) :
     live  match en cours ou résultat en attente : héros en direct, ton prono, mes paris, ensuite, classement, fait…
     soon  coup d'envoi dans moins de 75 min : héros avec compte à rebours, pari en un geste, clé du robot, qui a parié
     day   jour de match, avant : héros du prochain match, ce soir, mes paris, hier soir (bilan replié)…
     after soirée finie, et le lendemain jusqu'à 11 h (le « matin ») : bilan de la soirée en grand (podium, meilleure
           soirée, surprises du robot), prochain match, mes paris, ligue…
     rest  jour sans match : qui va gagner en grand, prochain match (ou le prochain tirage), le saviez-vous…
     final finale jouée : champion du monde, bilan, ligue.
   ?mo=live|soon|day|after|rest force un moment (tests). Toujours en bas : les sections (Matchs, Suisse, Équipes, Joueurs,
   Stats, Ligue). CADRAGE : chaque widget a une hauteur fixe (w22 284 px, héros d'avant-match 300, w21 112, w11 136 par
   paire, sections 84) ; homFit retire les widgets les moins utiles du moment tant que l'accueil dépasse 1,5 écran, puis
   s'il ne dépasse que de moins de 120 px (le « mini défilement ») : l'accueil tient dans l'écran, ou défile franchement.
   Widgets des modules : widget("bets"|"league"|"livebets"|"sim"|"rank"|"fact") ; ici : héros, ce soir / ensuite,
   prochain match, calendrier, bilan (grand et replié), mon équipe, champion du monde, sections.
   Écran eve/<jour> : bilan d'une soirée (Résumé : tes paris, meilleure soirée de la ligue, podium des joueurs, le robot ;
   Résultats). Podium : extrait de v13.5 (funEveLines, funPodium, funWhy ; données SJ.fu.g du robot, sinon feuilles du flux).
   ===================================================================================== */
let HM=null;   // dernier moment calculé (compatibilité : les rendus de ligue de v13.5 lisent HM.k)
function homeMoment(){
  const now=Date.now(),dk=dayKeyL(new Date()),dayOf=x=>dayKeyL(new Date(x.start)),ok=x=>x.t1&&x.t2;
  /* un résultat en attente depuis plus de 8 h (sources coupées, données embarquées d'un autre jour) ne fait plus de l'accueil
     un « direct » : il reste dans le calendrier et sa fiche, où l'on peut saisir le vainqueur */
  const live=MATCHES.find(x=>x.state==="live")||MATCHES.find(x=>x.state==="wait"&&now-new Date(x.start)<8*3600e3),next=MATCHES.find(x=>x.state==="soon"&&ok(x))||null;
  let last=null;for(let i=MATCHES.length-1;i>=0;i--)if(MATCHES[i].winner&&ok(MATCHES[i])){last=MATCHES[i];break}
  const ldk=last&&dayOf(last);
  // soirée récente (aujourd'hui ou hier) dont tous les matchs sont joués : son bilan (v13.5, 1641)
  const recent=ldk&&(ldk===dk||ldk===dayKeyL(new Date(now-864e5)))&&MATCHES.every(x=>!ok(x)||x.winner||dayOf(x)!==ldk)?ldk:null;
  let k;
  if(live)k="live";else if(next&&new Date(next.start)-now<75*60e3)k="soon";
  else if(recent&&(recent===dk||new Date().getHours()<11))k="after";
  else k=MATCHES.some(x=>ok(x)&&!x.winner&&dayOf(x)===dk)?"day":"rest";
  if(["live","soon","day","after","rest"].includes(FORCE_MO))k=FORCE_MO;
  if(k==="live"&&!live)k="soon";
  const champ=MATCHES.find(x=>x.stage==="f"&&x.winner&&ok(x))||null;
  return {k,live,next,recent,last:ldk,champ};
}

/* ===================== héros du match (prochain ou en cours) ===================== */
function wHeroMatch(m,k){
  const live=m.state==="live",wait=m.state==="wait",on=live||wait,st=new Date(m.start),f=seriesFav(m),me=picks[m.key];
  const pr=t=>!on&&f?`<span class="rp${f.t===t?" f":""}">${P(t===m.t1?f.p1:1-f.p1)}${f.t===t?"<small>robot</small>":""}</span>`:"";
  const side=t=>`<div class="side">${logo(t,on?48:46)}<span class="code">${esc(tid(t))}</span>${pr(t)}</div>`;
  const stk=!on?stakeTxt(m,records()):"";let foot,cls="w22 hero";
  if(live){foot=`<div id="wlive" data-k="${esc(m.key)}"></div>`;cls+=" hlive"}
  else if(wait)foot=homWait(m);
  else{const key=homKey(m),lgl=homLgLine(m);cls+=" tall";
    foot=`<div class="cdl"><span class="cdp" data-cdp="${st.getTime()}"></span><span class="cdd">${esc(whenTxt(st))}</span></div>
    <div class="pk2 hpk">${[m.t1,m.t2].map(t=>`<button class="pkb" data-pick="${t}" data-mk="${esc(m.key)}" aria-pressed="${me===t}" aria-label="Parier sur ${esc(T[t].name)}">${logo(t,20)}${esc(tid(t))}</button>`).join("")}</div>
    ${key||lgl?`<div class="hom-key">${key}${key&&lgl?" · ":""}${lgl}</div>`:""}`}
  return W(cls,`m/${m.id}`,`${heroBg(m)}<div class="hin"><div class="hmeta"><span>${esc(stageLab(m))}${stk?` · <b class="stk">${esc(stk)}</b>`:""}</span><span class="badge${live?" live":wait?" wait":""}">${live?"En direct":wait?"Résultat en attente":"Bo"+m.bo}</span></div>
    <div class="vs">${side(m.t1)}<div class="mid">${on&&m.bo>1&&m.s1!=null?`<span class="sc">${m.s1}-${m.s2}</span>`:`<span class="v">VS</span>`}</div>${side(m.t2)}</div>
    <div class="hfoot">${foot}</div></div>`,k,`--c1:${cA(m)};--c2:${cB(m)}`,`${tid(m.t1)} contre ${tid(m.t2)}${live?", en direct":wait?", résultat en attente":", "+whenTxt(st)}`);
}
/* la clé du robot en une ligne (moKey de v13.5 : son favori et son meilleur poste, SJ.pm) */
function homKey(m){try{const p=robotProb(m);if(p==null)return"";const f=p>=.5?m.t1:m.t2,pf=Math.round(Math.max(p,1-p)*100);
  const row=typeof pmRow==="function"&&SJ&&SJ.pm?pmRow(m):null,K=row&&Array.isArray(row[7])?row[7]:[],fv=K.find(k=>k[0]==="fav"),ps=K.find(k=>k[0]==="postes");
  if(fv&&ps&&fv[1]===f){const b=K.find(k=>k[0]==="poste"&&((k[4]>0)===(f===row[1])));
    return `<b>${esc(tid(f))}</b> mieux noté à ${ps[2]} poste${ps[2]>1?"s":""} sur 5${b&&typeof ROLE_AU!=="undefined"?`, surtout ${ROLE_AU[b[1]]} (${pnm(b[4]>0?b[2]:b[3])})`:""}`}
  return pf<56?"Très serré selon le robot":`Le robot voit <b>${esc(tid(f))}</b> favori`}catch(e){return""}}
/* qui de la ligue a parié (les choix restent cachés jusqu'au coup d'envoi) */
function homLgLine(m){if(typeof leaHeroLine==="function")return esc(safe(leaHeroLine,m)||"");try{if(!lg||!lg.players||!Object.keys(lg.players).length)return"";const O=members().filter(u=>!u.me),n=O.filter(u=>u.p[m.key]).length;
  return n===O.length?(O.length>1?"tes potes ont tous parié":"ton pote a parié"):`${n} sur ${O.length} ${n>1?"ont":"a"} parié`}catch(e){return""}}
function homWait(m){const f=seriesFav(m);
  return `<div class="hom-lm wait">En attente du résultat officiel</div>${f?`${splitBar(f.p1,cA(m),cB(m))}<div class="wpl"><b>${P(f.p1)}</b><span>prono du robot</span><b>${P(1-f.p1)}</b></div>`:""}<div class="hom-key">Le résultat tarde ? Touche pour l’indiquer dans la fiche</div>`}
/* mini direct (repeint à chaque image du flux : BUS "live") : temps, kills, or + tendance, chances, objectifs, dernier événement */
function liveMini(m){
  const L=typeof LV!=="undefined"&&LV.games?LV.games[m.key]:null;
  if(!L||!L.frame||L.status==="between"||L.status==="waiting"){const f=seriesFav(m);return `<div class="hom-lm wait">${L&&L.status==="between"?`Pause entre deux parties · série ${m.s1??0}-${m.s2??0}`:L&&L.status==="nolive"?"Flux direct introuvable : suis le match sur LoL Esports":"Draft en cours : le direct démarre au lancement"}</div>${f?`${splitBar(f.p1,cA(m),cB(m))}<div class="wpl"><b>${P(f.p1)}</b><span>prono du robot</span><b>${P(1-f.p1)}</b></div>`:""}${typeof betOpen==="function"&&betOpen(m)?`<div class="pk2 hpk">${[m.t1,m.t2].map(t=>`<button class="pkb" data-pick="${t}" data-mk="${esc(m.key)}" aria-pressed="${picks[m.key]===t}" aria-label="Parier sur ${esc(T[t].name)}">${logo(t,20)}${esc(tid(t))}</button>`).join("")}</div><div class="hom-key">Paris ouverts jusqu’à 2${NB}min après le lancement</div>`:""}`}
  const S=sideFrame(L,m),p=liveP(L,m),gd=S.A.totalGold-S.B.totalGold,ld=gd>=0?m.t1:m.t2,e=L.kf&&L.kf.ev?L.kf.ev.filter(x=>x.k!=="gap").slice(-1)[0]:null;
  const tr=safe(()=>typeof trend==="function"&&typeof spark==="function"?trend(L,m):null),sp=tr?safe(spark,tr,44,14):"";
  /* record de ces Worlds ou de l'année battu ou égalé (match.js, A-05) : il prend la place du dernier événement */
  const rec=typeof matHeroRec==="function"?String(safe(matHeroRec,m)||"").replace(/\s*\([^()<>]*\)/g,""):"";   // une ligne : sans la parenthèse (détail dans le match)
  return `<div class="hom-lm"><span class="hom-t">${gtime(L)}${L.num?`<small>partie ${L.num}</small>`:""}</span><span class="hom-k">${S.A.totalKills}<i>–</i>${S.B.totalKills}</span><span class="hom-g"${tr&&tr.txt?` title="${esc(String(tr.txt).replace(/<[^>]*>/g,""))}"`:""}>${Math.abs(gd)<100?"Or à égalité":`${esc(tid(ld))} +${kf1(gd)}`}${sp?`<span class="hom-spk">${sp}</span>`:""}</span></div>
    ${splitBar(p,cA(m),cB(m))}<div class="wpl"><b>${P(p)}</b><span>chances (estimation)</span><b>${P(1-p)}</b></div>${homObj(S)}${rec?`<div class="hom-ev hom-rec">${rec}</div>`:e?`<div class="hom-ev">${safe(evLine,L,e,true)}</div>`:""}`;
}
/* joueurs en direct (accueil, pendant une partie) : K/D/A et part des dégâts dans son équipe, poste par poste, écart d'or de la lane ;
   repeint à chaque image du flux (BUS "live") ; toucher = tableau complet du match */
function wLiveBoard(m,k){const L=typeof LV!=="undefined"&&LV.games?LV.games[m.key]:null;if(!L||!L.frame||typeof l2Rows!=="function")return"";
  const h=safe(homLsb,m);if(!h)return"";
  return W("w22 hom-lsb",`m/${m.id}/pl`,`<div id="wlsb" data-k="${esc(m.key)}">${h}</div>`,k,`--c1:${cA(m)};--c2:${cB(m)}`,"Joueurs en direct, tableau du match")}
function homLsb(m){const L=LV.games[m.key];if(!L||!L.frame)return"";l2St(L);l2Det(L,m);const R=l2Rows(L);if(!R)return"";
  const sa=L.blue===m.t2?1:0,fin=L.frame.gameState==="finished",one=x=>x?{c:x.c,n:x.n,kda:l2Kda(x.s),ds:x.dd&&typeof x.dd.championDamageShare==="number"?x.dd.championDamageShare:null,gold:x.s.totalGold||0,dead:kfDead(x.s)}:null;
  const A=ROLE_ORDER.map(r=>one(R.find(x=>x.side===sa&&x.role===r))),B=ROLE_ORDER.map(r=>one(R.find(x=>x.side!==sa&&x.role===r)));
  return `<div class="wh">${fin?`Partie ${esc(L.num||"")} terminée`:"Joueurs en direct"}<em>part des dégâts</em></div>${boardRows(A,B)}`}
/* tableau des joueurs poste par poste : champion, pseudo, K/D/A, part des dégâts dans l'équipe (le plus gros en or, barre sous le joueur),
   écart d'or de la lane au milieu. A et B : 5 joueurs (TOP → SUP) {c, n, kda, ds, gold, dead} ; direct (accueil) et parties terminées */
function boardRows(A,B){const best=S=>S.reduce((b,x)=>x&&x.ds!=null&&(!b||x.ds>b.ds)?x:b,null),bA=best(A),bB=best(B);
  const cell=(x,rev,top,mx)=>`<span class="ls-c${rev?" r":""}"><span class="ls-f${x.dead?" dead":""}">${champ(x.c,28)}</span><span class="ls-t"><b>${esc(x.n)}</b><small>${esc(x.kda)}</small></span><b class="ls-d${x===top?" top":""}">${x.ds==null?"–":l2pc(x.ds)}</b><i class="ls-bar" style="width:${x.ds!=null&&mx?Math.round(x.ds/mx*100):0}%"></i></span>`;
  return `<div class="ls-b">${ROLE_ORDER.map((r,i)=>{const a=A[i],b=B[i];if(!a||!b)return"";const gd=a.gold!=null&&b.gold!=null?a.gold-b.gold:null;
    return `<div class="ls-r">${cell(a,0,bA,bA&&bA.ds)}<span class="ls-m${gd==null||Math.abs(gd)<150?"":gd>0?" a":" b"}"><small>${r==="BOT"?"ADC":r}</small>${gd==null?"":Math.abs(gd)<150?"=":l2k(Math.abs(gd))}</span>${cell(b,1,bB,bB&&bB.ds)}</div>`}).join("")}</div>`}
/* rangée d'objectifs : tours, dragons (couleur du type), Barons, inhibiteurs, des deux côtés */
function homObj(S){const dr=x=>(x.dragons||[]).slice(0,5).map(t=>`<i class="hom-dg" style="background:${typeof DRAG!=="undefined"&&DRAG[t]||"var(--gold)"}" title="${esc(t)}"></i>`).join("")||`<i class="hom-dg no"></i>`;
  const sd=(x,r)=>`<span class="hom-ob${r?" r":""}"><span>${typeof MIC!=="undefined"?MIC.tw:ITOW}${x.towers||0}</span><span class="hom-dgs">${dr(x)}</span><span>${typeof MIC!=="undefined"?MIC.br:IBAR}${x.barons||0}</span><span>${typeof MIC!=="undefined"?MIC.ih:IINH}${x.inhibitors||0}</span></span>`;
  return `<div class="hom-obj">${sd(S.A)}${sd(S.B,1)}</div>`}

/* ===================== listes et prochain match ===================== */
/* un match joué n'est jamais « ensuite » : vainqueur en avant, perdant estompé, ton prono juste (✓) ou faux (✗) ;
   titre selon le contenu (Thomas, 26/10) : tout joué = résultats, mélange = ce soir, rien de joué = le titre demandé */
function wTonight(list,k,title="Ce soir"){
  const L=list.slice(0,3),done=L.filter(x=>x.winner),mine=done.filter(x=>picks[x.key]),good=mine.filter(x=>picks[x.key]===x.winner).length;
  const ttl=!done.length?title:done.length===L.length?"Résultats de ce soir":"Ce soir";
  const rows=L.map(x=>{const f=seriesFav(x),st=new Date(x.start),pk=picks[x.key],fv=fav&&(x.t1===fav||x.t2===fav),w=x.winner;
    if(w){const sd=t=>`<span class="${t===w?"wi":"lo"}">${t===x.t1?logo(t,18)+esc(tid(t)):esc(tid(t))+logo(t,18)}</span>`;
      return `<div class="wrow res${fv?" fav":""}${pk?(pk===w?" ok":" ko"):""}"><time>${x.s1!=null?"Fini":""}</time><span class="mt">${sd(x.t1)}<i class="sc">${x.s1}-${x.s2}</i>${sd(x.t2)}</span><span class="rb">${pk?`${logo(pk,16)}<span class="pkr">${pk===w?"✓":"✗"}</span>`:`<span class="dotp none"></span>`}</span></div>`}
    const dot=pk?`<span class="mypk" title="Ton prono">${logo(pk,16)}</span>`:typeof betOpen==="function"&&betOpen(x)?`<span class="dotp todo" title="À parier"></span>`:`<span class="dotp none"></span>`;
    return `<div class="wrow${fv?" fav":""}"><time>${x.state==="live"?`<span class="lv">LIVE</span>`:fmtTime(st)}</time><span class="mt">${logo(x.t1,18)}${esc(tid(x.t1))}<i>vs</i>${esc(tid(x.t2))}${logo(x.t2,18)}</span><span class="rb">${f?`${esc(tid(f.t))} <b>${P(f.p)}</b> `:""}${dot}</span></div>`}).join("");
  const nx=list.find(x=>x.state==="soon");
  const em=nx&&new Date(nx.start)-Date.now()<3*3600e3?`dans <span data-cd="${new Date(nx.start).getTime()}"></span>`:!nx&&mine.length?`tes paris <b>${good}/${mine.length}</b>`:list.length>3?`+${list.length-3}`:plur(list.length,"match","matchs");
  return W("w21","cal",`<div class="wh">${ttl}<em>${em}</em></div><div class="wb" style="justify-content:center;gap:2px">${rows}</div>`,k,"",ttl);
}
/* jour sans affiche connue (tirage à venir) : la prochaine étape en grand, avec les pancartes du compte à rebours */
function wNextDayBig(k){const d=homNextDay();if(!d)return"";const R=records();
  const tq=Object.keys(T).filter(t=>{try{return R[t]&&status(t,R).k==="ko"}catch(e){return false}}).slice(0,8);
  return W("w22 hero tall nday","cal",`${heroBg({})}<div class="hin"><div class="hmeta"><span>${esc(fmtDay(evDate(d.dt)))}</span><span class="badge">${esc(fmtTime(d.dt))}</span></div>
    <div class="ndw"><div class="ndt">${esc(d.d.what.split(",")[0])}</div>${tq.length?`<div class="ndq">${tq.map((t,i)=>`<span style="--i:${i}">${logo(t,30)}</span>`).join("")}<small>${tq.length>1?"qualifiés":"qualifié"} pour les quarts</small></div>`:`<div class="ws">affiches au tirage</div>`}</div>
    <div class="hfoot"><div class="cdl"><span class="cdp" data-cdp="${d.dt.getTime()}"></span></div></div></div>`,k,"--c1:#1B3766;--c2:#6B4A18",`Prochaine étape : ${d.d.what}, ${fmtDay(evDate(d.dt))}`)}
function wNextWide(m,k){
  if(!m){const d=homNextDay();if(!d)return"";
    return W("w21","cal",`<div class="wh">Prochain match<em>${esc(fmtDay(evDate(d.dt)))}</em></div><div class="wb"><div class="wn" style="font-size:24px;line-height:1.1">${esc(d.d.what)}</div><div class="ws">Premier match à ${esc(fmtTime(d.dt))} · affiches au tirage</div></div>`,k,"","Prochain match")}
  const st=new Date(m.start),f=seriesFav(m);
  return W("w21",`m/${m.id}`,`<div class="wh">Prochain match<em>${esc(whenTxt(st))}</em></div><div class="wb wnx">
    <span class="wnt">${logo(m.t1,34)}${esc(tid(m.t1))}<span class="hom-vsx">VS</span>${esc(tid(m.t2))}${logo(m.t2,34)}</span>
    ${f?`<span class="wnr"><span class="wn" style="font-size:28px">${P(f.p)}</span><span class="ws">${esc(tid(f.t))} selon le robot</span></span>`:""}</div>`,k,"",`Prochain match ${tid(m.t1)} contre ${tid(m.t2)}`);}
/* prochain jour sans affiche connue (DAYS de v13.5 : tirage au fil de l'eau) */
function homNextDay(){const known=new Set(MATCHES.filter(m=>m.t1||m.t2).map(m=>dayKeyL(new Date(m.start))));
  const d=DAYS.map(d=>({d,dt:new Date(d.d+"T"+d.t+":00Z")})).find(x=>x.dt>Date.now()&&!known.has(dayKeyL(x.dt)));return d||null}
function wCal(k){const dk=dayKeyL(new Date()),fut=MATCHES.filter(x=>!x.winner&&dayKeyL(new Date(x.start))>dk),d0=fut[0],nd=homNextDay();
  const L=d0?fut.filter(x=>dayKeyL(new Date(x.start))===dayKeyL(new Date(d0.start))):[],known=L.filter(x=>x.t1&&x.t2).length;
  const body=d0?`<div class="wn" style="font-size:26px;line-height:1.05">${esc(fmtDay(evDate(new Date(d0.start))).split(" ").slice(0,2).join(" "))}</div><div class="ws"><b>${plur(L.length,"match","matchs")}</b> dès ${esc(fmtTime(new Date(d0.start)))}</div><div class="ws" style="margin-top:0">${known?`${known} affiche${known>1?"s":""} connue${known>1?"s":""}`:"affiches au tirage"}</div>`
    :nd?`<div class="wn" style="font-size:26px;line-height:1.05">${esc(fmtDay(evDate(nd.dt)).split(" ").slice(0,2).join(" "))}</div><div class="ws"><b>${esc(nd.d.what.split(",")[0])}</b></div><div class="ws" style="margin-top:0">affiches au tirage</div>`
    :`<div class="wn" style="font-size:24px">Fin</div><div class="ws">plus de match prévu</div>`;
  return W("w11","cal",`<div class="wh">Calendrier</div><div class="wb">${body}</div>`,k,"","Calendrier");}

/* ===================== bilan d'une soirée ===================== */
const homTtl=(dk,L)=>dk===dayKeyL(new Date())?"Bilan de la soirée":dk===dayKeyL(new Date(Date.now()-864e5))?"Hier soir":fmtDay(evDate(new Date(L[0].start)));
/* tout ce qu'on sait d'une soirée : matchs, tes paris, meilleure soirée de la ligue (eveHTML de v13.5), surprises, podium */
function homEve(dk){const L=MATCHES.filter(x=>x.t1&&x.t2&&dayKeyL(new Date(x.start))===dk);if(!L.length)return null;
  const mine=L.filter(x=>x.winner&&picks[x.key]),good=mine.filter(x=>picks[x.key]===x.winner).length;let best=null;
  try{if(lg&&lg.players&&Object.keys(lg.players).length){const D=L.filter(x=>x.winner&&!x.manual);
    const S=members().map(u=>({u,p:D.reduce((s,x)=>{const b=u.p[x.key];return s+(b?pts(b.w,b.sc,x):0)},0)})).sort((a,b)=>b.p-a.p);
    if(S.length&&S[0].p>0)best={who:S.filter(x=>x.p===S[0].p).map(x=>x.u.me?"toi":x.u.name),p:S[0].p}}}catch(e){}
  const rb=L.filter(x=>x.winner).map(x=>({x,r:robotPast(x)})).filter(o=>o.r),up=rb.filter(o=>!o.r.ok);
  return {dk,L,mine,good,best,rb,up,ttl:homTtl(dk,L),done:L.every(x=>x.winner)};
}
/* podium des joueurs de la soirée (fun de v13.5) : null = feuilles en cours de lecture, [] = pas assez de parties */
function homPod(dk){try{const E=funEveLines(dk);if(E.miss.length){funFetch(dk,E.miss);if(!E.lines.length)return null}const P2=funPodium(E.lines);return P2.length>=3?P2:[]}catch(e){return []}}
const homBest=(b,dk)=>typeof leaEveBest==="function"?esc(safe(leaEveBest,dk)||""):b?`Meilleure soirée : <b>${b.who.map(esc).join(" et ")}</b>, +${b.p}`:"";
const homUp=E=>E.up.length?`${plur(E.up.length,"surprise")} : ${E.up.map(o=>esc(tid(o.x.winner))).join(", ")} contre l’avis du robot`:E.rb.length?"Aucune surprise : le robot avait vu juste":"";
function homPodLine(dk){const P2=homPod(dk);return P2&&P2.length?`Podium : ${P2.map((o,i)=>`<b>${esc(o.x.n)}</b>`).join(", ")}`:""}
function wEve(dk,k){const E=homEve(dk);if(!E)return"";
  const res=x=>{const w=x.winner,pk=picks[x.key],side=t=>`<span class="${w&&w!==t?"lo":""}">${logo(t,18)}${esc(tid(t))}</span>`;return `<span class="rres${pk&&w?(pk===w?" ok":" ko"):""}${fav&&(x.t1===fav||x.t2===fav)?" fav":""}">${side(x.t1)}<em>${w?`${x.s1}-${x.s2}`:fmtTime(new Date(x.start))}</em>${side(x.t2)}</span>`};
  const lines=[homPodLine(dk),homBest(E.best,E.dk),homUp(E)].filter(Boolean).slice(0,2);
  return W("w22",`eve/${dk}`,`<div class="hin weve"><div class="wh">${esc(E.ttl)}<em>${E.mine.length?`tes paris <b>${E.good}/${E.mine.length}</b>`:plur(E.L.length,"match","matchs")}</em></div><div class="rgrid">${E.L.slice(0,8).map(res).join("")}</div><div class="wb">${lines.map(l=>`<div class="ws">${l}</div>`).join("")}</div></div>`,k,"",E.ttl);}
/* bilan replié (jour suivant, après 11 h, ou avant les matchs du soir) */
function wEveMini(dk,k){const E=homEve(dk);if(!E||!E.done)return"";
  const l1=[plur(E.L.length,"match","matchs"),E.up.length?plur(E.up.length,"surprise"):""].filter(Boolean).join(" · "),l2=homPodLine(dk)||homBest(E.best,E.dk)||homUp(E);
  return W("w21",`eve/${dk}`,`<div class="wh">${esc(E.ttl)}<em>${E.mine.length?`tes paris <b>${E.good}/${E.mine.length}</b>`:"bilan"}</em></div><div class="wb"><div class="wn" style="font-size:22px;line-height:1.1">${l1}</div>${l2?`<div class="ws">${l2}</div>`:""}</div>`,k,"",E.ttl);}
/* fin du tournoi : le champion du monde */
function wChampion(m,k){const w=m.winner,lo=w===m.t1?m.t2:m.t1,sc=w===m.t1?`${m.s1}-${m.s2}`:`${m.s2}-${m.s1}`;
  return W("w22 hero champ",`m/${m.id}`,`<div class="hbg"><i class="hb l"></i><i class="hb r"></i><span class="wm l">${logo(w,150)}</span><i class="sheen"></i><i class="vign"></i></div>
    <div class="hin" style="align-items:center;justify-content:center;text-align:center"><span class="cup2">${ICUP}</span>${logo(w,88)}<div class="chn">${esc(T[w].name)}</div><div class="cht">Champion du monde 2026</div><div class="ws">Finale : ${esc(tid(w))} ${sc} ${esc(tid(lo))}</div></div>`,k,`--c1:${col(w)};--c2:${col(w)}`,`${T[w].name}, champion du monde 2026`);}

/* ===================== mon équipe =====================
   widget("myteam") du module suisse (bilan, sursis, prochain match) ; à défaut, celui-ci. Choix de l'équipe : écran set/moi. */
const homTeam=k=>widget("myteam",k)||homMyTeam(k);
function homMyTeam(k){
  if(!fav||!T[fav])return W("w11","set/moi",`<div class="wh">Mon équipe</div><div class="wb"><div class="mtl">${["T1","GEN","G2","BLG"].map(t=>logo(t,24)).join("")}</div><div class="ws mtw">Choisis ton équipe : ses matchs seront surlignés</div></div>`,k,"","Choisir mon équipe");
  const R=records(),st=status(fav,R),nx=nextOf(fav),L=lives(fav,R);
  const nt=nx?(nx.state==="live"?"en direct":nx.state==="wait"?"résultat en attente":(dayKeyL(new Date(nx.start))===dayKeyL(new Date())?"ce soir ":fmtDay(evDate(new Date(nx.start))).split(" ").slice(0,2).join(" ").toLowerCase()+" ")+fmtTime(new Date(nx.start)))+` · ${esc(tid(nx.t1===fav?nx.t2:nx.t1)||"à venir")}`:"";
  return W("w11",ROUTES.t?`t/${fav}`:"set/moi",`<div class="wh">Mon équipe<em>${logo(fav,22)}</em></div><div class="wb"><div class="wn" style="font-size:30px">${esc(tid(fav))}</div><div class="ws"><b>${esc(st.txt)}</b>${L&&st.k==="in"&&L.n===1?" · dos au mur":""}</div>${nt?`<div class="ws">${nt}</div>`:""}</div>`,k,"",`Mon équipe : ${T[fav].name}`)}

/* ===================== sections (en bas de l'accueil, remplacent la barre d'onglets de v13.5) ===================== */
const HOM_NAV=[["cal","Matchs",`<path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4"/>`],["sui","Suisse",`<path d="M4 6h5v4H4zM4 14h5v4H4zM15 10h5v4h-5zM9 8h3v8H9M12 12h3"/>`],
  ["teams","Équipes",`<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>`],["pl","Joueurs",`<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M16.5 14.6c2.4.3 4.2 2 4.9 4.9"/>`],
  ["st","Stats",`<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>`],["lg","Ligue",`<path d="M8 21h8M12 17v4M6 4h12v4a6 6 0 0 1-12 0zM6 6H3c0 3 1.5 4.5 3.5 4.7M18 6h3c0 3-1.5 4.5-3.5 4.7"/>`]];
function wNav(k){const n=MATCHES.filter(x=>x.state==="soon"&&x.t1&&x.t2&&!picks[x.key]&&new Date(x.start)-Date.now()<24*3600e3).length;
  return `<nav class="wnav" style="--k:${k}" aria-label="Sections">${HOM_NAV.map(([r,l,ic])=>`<button class="wn-i" data-go="${r}"${r==="lg"&&n?` aria-label="${l}, ${n} match${n>1?"s":""} à parier"`:""}><span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ic}</svg>${r==="lg"&&n?`<i class="bdg">${n}</i>`:""}</span><span class="lb">${l}</span></button>`).join("")}</nav>`}

/* ===================== composition selon le moment, et cadrage ===================== */
const HOM_H={w11:136,w21:112,w22:284,tall:300,nav:84},HOM_GAP=12;
const homSz=h=>{const c=/class="w ([^"]*)"/.exec(h)||[];const s=c[1]||"";return s.includes("tall")?"tall":s.includes("w22")?"w22":s.includes("w21")?"w21":"w11"};
/* widgets des modules (ou d'ici) appelables par leur nom */
const HOM_W={bets:k=>widget("bets",k),league:k=>widget("league",k),rank:k=>widget("rank",k),fact:k=>widget("fact",k,true),sim:k=>widget("sim",k),
  simbig:k=>widget("sim",k,true),swiss:k=>widget("swiss",k),myteam:k=>homTeam(k),cal:k=>wCal(k)};
/* ordre et priorité de chaque moment : « nom:priorité » (plus le chiffre est grand, plus le widget part tôt quand la place manque ;
   0 = jamais retiré). Les carrés (w11) vont par deux dans l'ordre ; réserve (HOM_SPARE) pour compléter un carré seul. */
/* « nom:F » = bouche-trou : ajouté seulement s'il tient en entier sans faire défiler ; puis la place qui reste va au
   premier widget extensible (héros, bilan, prochaine étape) : l'accueil sans direct remplit l'écran (Thomas, 26/10) */
const HOM_ORDER={
  live:"hero:0 lsb:1 paris:1 next:2",
  soon:"hero:0 paris:1 next:1 evemini:3 swiss:F fact:F",
  day:"hero:0 paris:1 next:1 evemini:3 swiss:F fact:F",
  after:"eve:0 paris:1 next:1 swiss:F fact:F",
  rest:"nbig:0 paris:1 evemini:3 swiss:F fact:F simbig:F",
  final:"champ:0 paris:1 eve:2"},HOM_SPARE="",HOM_GROW=["hero","eve","nbig","champ"];   // accueil épuré (Thomas, 26/10) : le reste est rangé dans les onglets
function homItems(M){const dk=dayKeyL(new Date()),ok=x=>x.t1&&x.t2,today=MATCHES.filter(x=>ok(x)&&dayKeyL(new Date(x.start))===dk);
  const fin=M.champ&&!M.live&&!M.next,hm=M.k==="live"?(M.live||M.next):M.next,yday=M.recent&&M.recent!==dk?M.recent:null;
  const rest=(()=>{const o=today.filter(x=>x!==hm),up=o.filter(x=>x.state!=="done");return [...up,...o.filter(x=>x.state==="done").reverse()].slice(0,3).sort((a,b)=>new Date(a.start)-new Date(b.start))})(),other=MATCHES.find(x=>x.state==="soon"&&x!==hm&&ok(x));
  const F={...HOM_W,
    hero:k=>hm?wHeroMatch(hm,k):"",lsb:k=>M.k==="live"&&hm?wLiveBoard(hm,k):"",paris:k=>typeof wParis==="function"?wParis(k,hm):"",livebets:k=>hm?widget("livebets",hm,k):"",
    next:k=>M.k==="after"||M.k==="rest"?wNextWide(M.next,k):rest.length?wTonight(rest,k,M.k==="day"?"Ce soir":"Ensuite"):wNextWide(other,k),
    nbig:k=>M.next?wHeroMatch(M.next,k):wNextDayBig(k)||wNextWide(null,k),
    eve:k=>M.recent||M.last?wEve(M.recent||M.last,k):"",evemini:k=>(M.k==="rest"?M.recent:yday)?wEveMini(M.k==="rest"?M.recent:yday,k):"",champ:k=>M.champ?wChampion(M.champ,k):""};
  const I=HOM_ORDER[fin?"final":M.k].split(" ").map(x=>{const [n,p]=x.split(":");return p==="F"?{n,f:F[n],pr:9,fill:true}:{n,f:F[n],pr:+p}});
  /* équipe suivie (w26_fav) : son widget passe juste après « Mes paris » et n'est retiré qu'en dernier recours */
  if(fav&&T[fav]){const i=I.findIndex(x=>x.n==="myteam");if(i>=0){const it=I.splice(i,1)[0];it.pr=Math.min(it.pr,2);const j=I.findIndex(x=>x.n==="bets");I.splice(j>=0?j+1:I.length,0,it)}}
  return {I,spares:HOM_SPARE.split(" ").map(n=>[n,F[n]])};
}
/* rangées : un widget large, ou deux carrés côte à côte (un carré seul est complété par un widget de réserve, sinon élargi) */
function homRows(M){const {I,spares}=homItems(M),used=new Set(),rows=[];let k=0,pend=null;
  const take=(n,f)=>{const h=safe(f,k)||"";if(!h)return null;used.add(n);return {n,h,sz:homSz(h),k:k++}};
  for(const it of I){const x=take(it.n,it.f);if(!x)continue;x.pr=it.pr;x.fill=!!it.fill;
    /* une paire reste tant que l'un des deux compte (priorité la plus forte des deux) */
    if(x.sz==="w11"){if(pend){rows.push({h:HOM_H.w11,html:pend.h+x.h,pr:Math.min(pend.pr,x.pr),n:pend.n+"+"+x.n,fill:pend.fill&&x.fill});pend=null}else pend=x;continue}
    /* bilan : hauteur selon le nombre de matchs (2 par rangée), au lieu des 284 px d'un bilan de 8 matchs */
    const h=x.n==="eve"?(n=>Math.min(HOM_H.w22,128+Math.ceil(n/2)*42))((homEve(M.recent||M.last)||{L:[]}).L.slice(0,8).length):HOM_H[x.sz];
    rows.push({h,hx:h!==HOM_H[x.sz],html:x.h,pr:x.pr,n:x.n,fixed:x.pr===0,fill:x.fill,grow:HOM_GROW.includes(x.n)})}
  if(pend){let sp=null;for(const [n,f] of spares){if(used.has(n))continue;const x=take(n,f);if(x&&x.sz==="w11"){sp=x;break}}
    rows.push(sp?{h:HOM_H.w11,html:pend.h+sp.h,pr:pend.pr,n:pend.n+"+"+sp.n}:{h:HOM_H.w11,html:pend.h.replace('class="w w11','class="w w11 solo'),pr:pend.pr,n:pend.n,fill:pend.fill})}
  return rows;
}
/* ≤ 1,5 écran, et jamais un dépassement de moins de 120 px (Thomas : « bien tout cadrer ») */
function homFit(rows,el){const H=el.clientHeight||innerHeight,bar=el.querySelector(".bar"),chrome=(bar?bar.offsetHeight:54)+6+8+(parseFloat(getComputedStyle(el).paddingBottom)||28);
  const tot=rs=>chrome+rs.reduce((s,r)=>s+r.h,0)+HOM_GAP*Math.max(0,rs.length-1);let rs=rows.filter(r=>!r.fill);
  const drop=()=>{let j=-1;rs.forEach((r,i)=>{if(!r.fixed&&(j<0||r.pr>=rs[j].pr))j=i});if(j<0)return false;rs.splice(j,1);return true};
  while(tot(rs)>1.5*H&&drop());
  while(tot(rs)>H&&tot(rs)-H<120&&drop());
  /* l'écran tient : bouche-trous qui entrent en entier (à leur place dans l'ordre), puis le reste au widget extensible */
  if(tot(rs)<=H){for(const f of rows.filter(r=>r.fill)){const t=rows.filter(r=>rs.includes(r)||r===f);if(tot(t)<=H)rs=t}
    const g=rs.find(r=>r.grow),ex=Math.min(Math.floor(H-tot(rs)),260);
    rs=rs.map(r=>r===g&&ex>6?{...r,h:r.h+ex,hx:true,html:r.html.replace('class="w ','class="w grow ')}:r)}
  rs=rs.map(r=>r.hx?{...r,html:r.html.replace('style="--k:',`style="height:${r.h}px;--k:`)}:r);
  HM.rows=rs.map(r=>r.n);HM.est=tot(rs);return rs}
/* chiffres qui défilent jusqu'à leur valeur à l'arrivée sur l'accueil (nombres entiers seuls dans leur texte) */
function homRoll(g){g.querySelectorAll(".pw-v,.wn,.rres em,.wrow .sc").forEach(e=>{[...e.childNodes].forEach(t=>{if(t.nodeType!==3)return;const m=/^(\d{1,3})(-(\d{1,2}))?$/.exec(t.nodeValue.trim());if(!m)return;
  const a=+m[1],b=m[3]!=null?+m[3]:null,fin=t.nodeValue,t0=performance.now(),D=800;
  const st=n=>{const p=Math.min(1,(n-t0)/D),q=1-Math.pow(1-p,3);t.nodeValue=p>=1?fin:String(Math.round(a*q))+(b!=null?"-"+Math.round(b*q):"");if(p<1)requestAnimationFrame(st)};requestAnimationFrame(st)})})}
function renderHome(el=HOME){if(!el)return;
  const M=homeMoment();HM=M;const rows=homFit(homRows(M),el),h=rows.map(r=>r.html).join("");
  const g=el.querySelector(".grid");if(g._h!==h){const first=!g._h;g._h=h;g.innerHTML=h;if(first&&!RM){g.classList.add("first");setTimeout(()=>g.classList.remove("first"),1400);homRoll(g)}startBeam(g.querySelector(".hero .beam"))}
  tickCd(el);const wl=g.querySelector("#wlive");if(wl){const m=MATCHES.find(x=>x.key===wl.dataset.k);if(m){const lh=safe(liveMini,m);if(wl._h!==lh){wl._h=lh;wl.innerHTML=lh}}}
  const wb=g.querySelector("#wlsb");if(wb){const m=MATCHES.find(x=>x.key===wb.dataset.k);if(m){const bh=safe(homLsb,m);if(bh&&wb._h!==bh){wb._h=bh;wb.innerHTML=bh}}}
  paintPill();if(typeof paintTabs==="function")paintTabs();
}
function homeShell(){return `<div class="scrin"><header class="bar"><div class="brand">WORLDS 2026<small>Los Angeles, Allen, New York</small></div><button class="pill busy" data-go="set" aria-label="État de l’appli"><i></i>Chargement…</button></header>
  <div class="grid">${skel(292)}<div class="sk" style="height:144px"></div><div class="sk" style="height:144px"></div></div><div class="grid" style="display:none"></div></div>`}

/* ===================== écran « bilan d'une soirée » (eve/<jour>) ===================== */
function scrEve(d){const dk=d.id||(HM&&(HM.recent||HM.last))||dayKeyL(new Date()),E=homEve(dk);
  if(!E)return {title:"Bilan de la soirée",body:`<p class="empty">Aucun match ce soir-là.</p>`};
  return {title:`${esc(E.ttl)}<small>${esc(fmtDay(evDate(new Date(E.L[0].start))))}</small>`,info:"eve",tabs:[["sum","Résumé"],["res","Résultats"]],render:t=>t==="res"?eveRes(E):eveSum(E)}}
/* Résumé : tes paris (une ligne) et le podium des joueurs ; Résultats : le robot (bons favoris, surprises) puis les matchs */
function eveSum(E){const p=E.mine.length?E.good/E.mine.length:0,P2=homPod(E.dk);
  const me=`<div class="blk evme">${E.mine.length?`<span class="ring">${ringSVG(p,52,6)}<b>${Math.round(p*100)}</b></span>`:""}<span class="grow"><b class="evn">${E.mine.length?`${E.good}/${E.mine.length}`:"Aucun pari"}</b><small>${E.mine.length?`prono${E.good>1?"s":""} gagné${E.good>1?"s":""} ${E.dk===dayKeyL(new Date())?"ce soir":"ce soir-là"}`:"sur cette soirée"}</small>${(bt=>bt?`<small class="evl">${bt}</small>`:"")(homBest(E.best,E.dk))}</span></div>`;
  const pod=P2===null?`<p class="note mt0">Lecture des feuilles de match…</p>${skel(52,3)}`:!P2.length?`<p class="note mt0">${E.done?"Pas assez de parties lues pour un podium.":"Le podium arrive à la fin de la soirée."}</p>`
    :`<div class="list">${P2.map((o,i)=>{const x=o.x,pl=x.k?pkey(x.k):null;return `<button class="rowb evp" data-info="${xi("pod|"+E.dk+"|"+i,()=>[`${i+1}. ${x.n}`,`<p>${esc(x.n)} (${esc(funTm(x.tm))}), ${esc(x.c||"?")} contre ${esc(funTm(x.op))} : ${funWhy(o,true)}. ${x.w?"Victoire":"Défaite"}.</p>${x.k?`<button class="btn" data-p="${esc(x.k)}">Fiche de ${esc(x.n)}</button>`:""}`,true])}"><span class="evr r${i+1}">${i+1}</span>${pl?photo(pl,"ava",40):`<span class="ava" style="width:40px;height:40px"></span>`}<span class="grow"><b class="nm">${esc(x.n)}</b><small>${esc(funTm(x.tm))} · ${esc(x.c||"?")} contre ${esc(funTm(x.op))}</small></span><span class="evw">${funWhy(o)}</span></button>`}).join("")}</div>`;
  return me+`<div class="blk"><div class="bh">Podium des joueurs<button class="i" data-info="podium" aria-label="Comment est fait le podium">i</button></div>${pod}</div>`}
function eveRobot(E){const ok=E.rb.filter(o=>o.r.ok).length;
  const rob=E.rb.length?`<p class="evl mt0">${ok}/${E.rb.length} bons favoris${E.up.length?"":" : aucune surprise"}</p>${E.up.length?`<div class="keys">${E.up.map(o=>{const x=o.x,lo=x.winner===x.t1?x.t2:x.t1;return `<button class="key" data-go="m/${esc(x.id)}"><span class="kn">${P(o.r.p)}<small>${esc(tid(o.r.fav))} favori</small></span><span class="kt"><b>${esc(tid(x.winner))}</b> bat ${esc(tid(lo))} ${x.s1!=null?`(${Math.max(x.s1,x.s2)}-${Math.min(x.s1,x.s2)})`:""}<small>contre l’avis du robot</small></span><span class="chev">›</span></button>`}).join("")}</div>`:""}`:`<p class="note mt0">Pronos du robot pas encore publiés pour cette soirée.</p>`;
  return `<div class="blk"><div class="bh">Le robot<button class="i" data-info="everobot" aria-label="Le robot ce soir">i</button></div>${rob}</div>`}
function eveRes(E){return eveRobot(E)+`<div class="list" style="margin-top:14px">${E.L.map(mrow).join("")}</div>`}
INFO.eve=()=>["Bilan d’une soirée","Une soirée va de 19 h à 6 h du matin (heure de Paris) : un match à 1 h compte dans la soirée de la veille. Résumé : tes paris, la meilleure soirée de ta ligue, les trois joueurs de la soirée et les surprises du robot. Résultats : tous les matchs, avec ton prono (vert gagné, rouge perdu)."];
INFO.podium=()=>["Podium des joueurs","Meilleure partie de chaque joueur ce soir, notée sur le KDA, les kills, la part des dégâts, le CS par minute et l’avance d’or à 15 min, comparés aux autres joueurs de la soirée ; petit bonus pour la victoire. À droite, ce qui le distingue le plus. Données du robot, sinon feuilles de match du flux officiel, lues une fois et gardées sur ce téléphone."];
INFO.everobot=()=>["Le robot ce soir","Le prono du robot est figé au coup d’envoi de chaque match. Une surprise : l’équipe qu’il voyait perdante a gagné. Son bilan complet aux Worlds est dans « Qui va gagner »."];

/* ---------- branchements ---------- */
defScreen("eve",{arg:"id",screen:scrEve});
/* le mini direct du héros suit chaque image du flux (match.js émet "live") */
BUS.on("live",m=>{if(NAV.length)return;const w=document.getElementById("wlive");   // accueil couvert : repeint au retour (renderHome)
  if(w&&w.dataset.k===m.key){const h=safe(liveMini,m);if(w._h!==h){w._h=h;w.innerHTML=h}}
  /* tableau des joueurs : repeint ; absent alors que la partie a démarré (accueil composé pendant la draft) → l'accueil se recompose */
  const b=document.getElementById("wlsb");if(b){if(b.dataset.k===m.key){const h=safe(homLsb,m);if(h&&b._h!==h){b._h=h;b.innerHTML=h}}}
  else if(HM&&HM.k==="live"&&HM.rows&&!HM.rows.includes("lsb")&&safe(homLsb,m))renderHome(HOME)});
