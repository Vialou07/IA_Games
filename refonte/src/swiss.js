/* =====================================================================================
   swiss.js — SUISSE ET CALENDRIER (propriétaire : agent suisse)
   Écrans : sui/<onglet> Phase suisse (Ronde · Tableau · Bilans · Finale) ; sim/<onglet> Qui va gagner (Titre · Tableau · Robot) ;
   cal/<onglet> Calendrier (À venir · Résultats, filtre de phase en tête).
   Feuilles « i » : sui, swtree, swfin, sim, swfiab, cal ; swn:<bilan> (une case de l'arbre), swt:<équipe> (ses chances en
   détail), swfav (choisir son équipe : écrit w26_fav comme v13.5).
   Widgets de l'accueil : sim (qui va gagner), swiss (phase suisse), myteam (mon équipe et son parcours).
   Logique de v13.5 : extraits swissTeams, rkWho1, rkTeamShort, rkWhyTeam, RK_KIND, rkSimInfo, rkFiab (legacy/swiss.list.js) ;
   recopiés ici sans changement de règle : parcours de renderSwiss, enjeux de roundHTML, jours sans affiche de renderMatchs,
   bilan de fiabHTML. Aucun rendu au chargement : déclarations et enregistrements seulement.
   ===================================================================================== */

/* ===================== données de la phase suisse ===================== */
/* parcours de chaque équipe (bilans successifs [v,d]), même calcul que renderSwiss de v13.5 */
function swiPaths(){
  const teams=swissTeams(),P={};teams.forEach(t=>P[t.id]=[[0,0]]);
  MATCHES.filter(m=>m.stage==="sw"&&m.winner&&m.t1&&m.t2).forEach(m=>[m.t1,m.t2].forEach(id=>{if(!P[id])P[id]=[[0,0]];const [w,l]=P[id][P[id].length-1];if(w<3&&l<3)P[id].push(m.winner===id?[w+1,l]:[w,l+1])}));
  return {teams,P};
}
const swiRec=(P,id)=>{const p=P[id]||[[0,0]];return p[p.length-1]};
/* où en est la phase suisse : ronde en cours (r), affiches connues (drawn), qualifiés (q), éliminés (x), terminée (over) */
function swiState(){
  const {teams,P}=swiPaths(),sw=MATCHES.filter(m=>m.stage==="sw"&&m.t1&&m.t2),open=sw.filter(m=>!m.winner);
  let q=0,x=0;teams.forEach(t=>{const [w,l]=swiRec(P,t.id);if(w>=3)q++;else if(l>=3)x++});
  const over=teams.length>0&&q+x===teams.length,played=Math.max(0,...sw.filter(m=>m.winner).map(m=>m.round||0));
  const drawn=open.length>0,r=drawn?Math.min(...open.map(m=>m.round||1)):over?5:Math.min(5,played+1);
  return {teams,P,sw,open,q,x,over,played,drawn,r};
}
/* enjeu d'un match selon le bilan des deux équipes (roundHTML de v13.5) */
const swiStake=k=>({"2-0":"le vainqueur est en quarts","0-2":"le perdant est éliminé","2-2":"le vainqueur est en quarts, le perdant éliminé","2-1":"le vainqueur est en quarts","1-2":"le perdant est éliminé"})[k]||({"0":"chacun peut encore perdre deux fois","1":"chacun peut encore perdre une fois"})[String(k).split("-")[1]]||"";
const swiStakeCls=k=>{const s=swiStake(k);return /quarts/.test(s)&&/élimin/.test(s)?" sqx":/quarts/.test(s)?" sq":/élimin/.test(s)?" sx":""};
const swiRecSort=(a,b)=>b.split("-")[0]-a.split("-")[0]||a.split("-")[1]-b.split("-")[1];
/* prochain tirage d'après les jours sans affiche (DAYS de v13.5) : « tirage le 26 octobre », premier match */
function swiNextDraw(r){const re=new RegExp("^Ronde "+r+"\\b"),D=DAYS.filter(d=>re.test(d.what));if(!D.length)return null;
  const dt=new Date(D[0].d+"T"+D[0].t+":00Z");return {dt,tir:(D[0].what.match(/tirage le [^.]+/)||[""])[0]}}
const swiVenue=s=>{const v=VENUES[s]||"";return v.includes(",")?v.split(",").slice(1).join(",").trim():v};
function swiWhen(m){if(m.state==="live")return "en direct";const d=new Date(m.start);
  return dayKeyL(d)===dayKeyL(new Date())?(d.getHours()<6?"cette nuit ":"ce soir ")+fmtTime(d):d.toLocaleDateString("fr-FR",{weekday:"short"})+" "+fmtTime(d)}
const swiDate=d=>{const e=evDate(d);return e.toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"})+" · "+fmtTime(d)};
const swiOpp=(m,id)=>m.t1===id?m.t2:m.t1;
/* une ligne de statut courte : « plus droit à l’erreur · ce soir 22:00 contre DK » */
function swiSub(id,R,withNext=true){const st=status(id,R),L=lives(id,R),nx=withNext?nextOf(id):null,e=SJ&&SJ.sim&&SJ.sim.eq&&SJ.sim.eq[id];
  const a=st.k==="in"?(L?L.txt:st.txt):st.k==="ko"?(st.txt+(e&&!/Champion/.test(st.txt)?` · titre ${rkPct(e[10])}${NB}%`:"")):st.txt;
  return a+(nx?` · ${swiWhen(nx)} contre ${tid(swiOpp(nx,id))}`:"")}
/* sursis en pastilles (pips de v13.5) : défaites encore permises avant l'élimination */
const swiPips=L=>L&&!L.ko?`<span class="swi-pips" title="${esc(L.txt)}">${[0,1].map(i=>`<i class="${i<L.n-1?"on":""}"></i>`).join("")}</span>`:"";
const SWI_OK=`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 8.5 6.6 11.4 12.5 4.6"/></svg>`;
const SWI_KO=`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/></svg>`;
const swiAnimOn=d=>{const t=d.tab||"",k="anim_"+t;if(!d[k])d[k]=Date.now();return Date.now()-d[k]<1500};   // cascade : à l'ouverture de l'onglet seulement

/* parcours d'une équipe aux Worlds : une case par match (adversaire, victoire ou défaite), le prochain, les places encore possibles en suisse */
function swiTrail(id,S,max=6){
  const L=MATCHES.filter(m=>m.t1&&m.t2&&(m.t1===id||m.t2===id)).sort((a,b)=>a.start.localeCompare(b.start));
  const done=L.filter(m=>m.winner),next=L.filter(m=>!m.winner);
  let fut=0;const sp=S.P[id];if(sp){const [w,l]=sp[sp.length-1];if(w<3&&l<3)fut=Math.max(0,(3-w)+(3-l)-1-next.filter(m=>m.stage==="sw").length)}
  let items=[...done.map(m=>({m,k:m.winner===id?"vic":"def"})),...next.map(m=>({m,k:"nxt"})),...Array.from({length:fut},()=>({k:"fut"}))];
  if(items.length>max){const drop=items.length-max;items=items.slice(drop)}
  if(!items.length)return "";
  return `<div class="swi-trail">${items.map(x=>{if(x.k==="fut")return `<span class="swi-ts fut" aria-hidden="true"><i></i><small>&nbsp;</small></span>`;
    const o=swiOpp(x.m,id),lab=x.k==="vic"?"V":x.k==="def"?"D":x.m.state==="live"?"live":fmtTime(new Date(x.m.start));
    return `<button class="swi-ts ${x.k}" data-go="m/${esc(x.m.id)}" aria-label="${esc((x.k==="vic"?"Victoire contre ":x.k==="def"?"Défaite contre ":"Prochain match contre ")+tid(o))}"><i>${logo(o,22)}</i><small>${lab}</small></button>`}).join("")}</div>`;
}

/* ===================== mon équipe ===================== */
function swiMine(S){
  if(!fav||!T[fav])return `<button class="rowb swi-pick" data-info="swfav"><span class="swi-pki">${ICUP}</span><span class="grow"><b class="nm">Suis ton équipe</b><small>son parcours s’affiche en or dans le tableau</small></span><span class="chev">›</span></button>`;
  const R=records(),sp=S.P[fav],rec=sp?swiRec(S.P,fav).join("-"):"";
  return `<div class="blk swi-me"><div class="bh">Mon équipe<button class="swi-chg" data-info="swfav">Changer</button></div>
    <button class="swi-mt" data-t="${esc(fav)}">${logo(fav,34)}<span class="grow"><b>${esc(tid(fav))}</b><small>${esc(swiSub(fav,R,false))}</small></span>${rec?`<span class="swi-rc">${rec}${swiPips(lives(fav,R))}</span>`:""}</button>
    ${swiTrail(fav,S)}</div>`;
}
/* choisir son équipe (w26_fav, même format que v13.5 : "T1" ou null) */
INFO.swfav=()=>["Mon équipe",`<p>Ses matchs ressortent partout et son parcours est tracé en or dans le tableau de la phase suisse.</p>
  <div class="swi-favg">${TEAMS.map(t=>`<button class="swi-fo${t.id===fav?" on":""}" data-fav="${t.id}" aria-pressed="${t.id===fav}" aria-label="${esc(t.name)}">${logo(t.id,30)}<b>${esc(t.id)}</b></button>`).join("")}</div>
  ${fav?`<button class="btn" data-fav="${esc(fav)}">Ne plus suivre ${esc(tid(fav))}</button>`:""}`,true];
/* le choix passe par le socle (data-fav → setFav : w26_fav, toast, confettis, onData, BUS "fav") ; la feuille se referme ensuite */
BUS.on("fav",()=>{if(SHEET.open&&document.querySelector("#sheet .swi-favg"))closeSheet()});

/* ===================== PHASE SUISSE (sui) ===================== */
function swiHead(S){
  const seg=[1,2,3,4,5].map(i=>{const d=S.over||i<S.r||(!S.drawn&&i<=S.played),c=!S.over&&i===S.r&&!d;return `<i class="${d?"d":c?"c":""}"></i>`}).join("");
  return `<div class="swi-hd"><div class="swi-hl"><b>${S.over?"Terminée":`Ronde ${S.r}<small> sur 5</small>`}</b><div class="swi-sg">${seg}</div></div><div class="swi-ct"><span class="cq"><b>${S.q}</b>en quarts</span>${S.over?"":`<span><b>${S.teams.length-S.q-S.x}</b>en lice</span>`}<span class="cx"><b>${S.x}</b>dehors</span></div></div>`;
}
/* l'arbre suisse, repensé en vertical : une rangée par ronde, une case par bilan, aucune largeur fixe */
const SWI_CAP={"0-0":16,"1-0":8,"0-1":8,"2-0":4,"1-1":8,"0-2":4,"3-0":2,"2-1":6,"1-2":6,"0-3":2,"3-1":3,"2-2":6,"1-3":3,"3-2":3,"2-3":3};
const SWI_ROWS=[[[0,0]],[[1,0],[0,1]],[[2,0],[1,1],[0,2]],[[3,0],[2,1],[1,2],[0,3]],[[3,1],[2,2],[1,3]],[[3,2],[2,3]]];
function swiTree(S){
  /* rangées de hauteur fixe (cases), intervalles plus bas quand le socle resserre l’écran (.snug) ; chaque intervalle
     porte ses traits dans un SVG étiré en hauteur : victoire vers la gauche (sarcelle), défaite vers la droite (rouge), parcours en or */
  const cw=Math.max(280,Math.min(innerWidth||390,560)-32),G=6,TW=62,CELL=25,PX=8,HEAD=22;
  const term=(w,l)=>w===3||l===3,M=swiMembers(S),pos={},rows=[];
  SWI_ROWS.forEach((row,c)=>{
    const avail=cw-G*(row.length-1),nt=row.filter(([w,l])=>!term(w,l)),capS=nt.reduce((a,[w,l])=>a+SWI_CAP[w+"-"+l],0);
    const ws=row.map(([w,l])=>!nt.length?avail/row.length:term(w,l)?TW:(avail-TW*(row.length-nt.length))*SWI_CAP[w+"-"+l]/capS);
    const lines=row.map(([w,l],i)=>{const m=M[w+"-"+l];return Math.ceil(Math.max(1,m.here.length+m.past.length)/Math.max(1,Math.floor((ws[i]-2*PX+4)/CELL)))});   // hauteur selon les équipes réellement passées : les cases futures restent basses
    let x=0;row.forEach(([w,l],i)=>{pos[w+"-"+l]={x,w:ws[i],wv:w,lv:l,c};x+=ws[i]+G});rows.push({c,h:HEAD+Math.max(...lines)*CELL+4,ks:row.map(([w,l])=>w+"-"+l)})});
  const pc=v=>(v/cw*100).toFixed(3),cv=(x1,x2)=>`M${x1.toFixed(1)} 0C${x1.toFixed(1)} 50 ${x2.toFixed(1)} 50 ${x2.toFixed(1)} 100`;
  const fp=fav&&S.P[fav]?S.P[fav]:null,onP=new Set(fp?fp.map(z=>z.join("-")):[]);
  let h="";
  rows.forEach(({c,h:rh,ks})=>{
    const cur=!S.over&&c===S.r-1,lab=`<span class="swi-rl${cur?" on":""}">${c<5?`Ronde ${c+1}`:"Bilan final"}${cur&&S.drawn?" · en cours":""}</span>`;
    if(!c)h+=`<div class="swi-t0">${lab}</div>`;
    else{let ed="";rows[c-1].ks.forEach(k=>{const p=pos[k];if(term(p.wv,p.lv))return;
        [[p.wv+1,p.lv,"ew",.3,.64],[p.wv,p.lv+1,"el",.7,.36]].forEach(([w,l,cl,f1,f2])=>{const q=pos[w+"-"+l];if(q)ed+=`<path class="${cl}" d="${cv(p.x+p.w*f1,q.x+q.w*f2)}"/>`})});
      if(fp&&fp[c]&&fp[c-1]){const a=pos[fp[c-1].join("-")],b=pos[fp[c].join("-")];if(a&&b)ed+=`<path class="ef" d="${cv(a.x+a.w/2,b.x+b.w/2)}"/>`}
      h+=`<div class="swi-tg"><svg viewBox="0 0 ${cw} 100" preserveAspectRatio="none" aria-hidden="true">${ed}</svg>${lab}</div>`}
    h+=`<div class="swi-trw" style="height:${rh}px">${ks.map(k=>{const p=pos[k],{here,past}=M[k];
      const cls=(p.wv===3?" nq":p.lv===3?" nx":"")+(onP.has(k)?" on":"")+(here.length&&!term(p.wv,p.lv)?" cur":"");
      const lg=[...here.map(id=>`<i class="h${id===fav?" me":""}">${logo(id,22)}</i>`),...past.map(id=>`<i class="p${id===fav?" me":""}">${logo(id,22)}</i>`)].join("");
      return `<button class="swi-nd${cls}" data-info="swn:${k}" style="left:${pc(p.x)}%;width:${pc(p.w)}%" aria-label="${esc(`Bilan ${k} : ${plur(here.length,"équipe")}`)}"><b>${k}${p.wv===3?`<i class="mk">${SWI_OK}</i>`:p.lv===3?`<i class="mk">${SWI_KO}</i>`:""}</b><span class="lg">${lg}</span></button>`}).join("")}</div>`});
  const lgd=`<div class="swi-lgd"><span><i class="lw"></i>victoire</span><span><i class="ll"></i>défaite</span>${fp?`<span><i class="lf"></i>${esc(tid(fav))}</span>`:`<button class="swi-lk" data-info="swfav">suis ton équipe</button>`}<button class="i swi-i" data-info="swtree" aria-label="Comment lire le tableau">i</button></div>`;
  return lgd+`<div class="swi-tree">${h}</div>`;
}
/* qui est dans chaque case (here : maintenant, past : passé par là) */
function swiMembers(S){const M={};Object.keys(SWI_CAP).forEach(k=>M[k]={here:[],past:[]});
  S.teams.forEach(t=>{const path=S.P[t.id]||[[0,0]];path.forEach(([w,l],i)=>{const m=M[w+"-"+l];if(m)(i===path.length-1?m.here:m.past).push(t.id)})});return M}
/* feuille d'une case de l'arbre : qui y est, qui y est passé */
const swiFull=id=>T[id]&&norm(T[id].name)!==norm(T[id].id)?` <span class="swi-tn">${esc(T[id].name)}</span>`:"";
function swiSheetRow(id,R,S,showRec){const rec=S.P[id]?swiRec(S.P,id).join("-"):"";
  return `<button class="rowb swi-sl${id===fav?" me":""}" data-t="${esc(id)}">${logo(id,30)}<span class="grow"><b class="nm">${esc(tid(id))}${swiFull(id)}</b><small>${esc(swiSub(id,R))}</small></span>${showRec&&rec?`<span class="num">${rec}</span>`:""}<span class="chev">›</span></button>`}
INFOP.swn=k=>{const S=swiState(),R=records(),[w,l]=String(k).split("-").map(Number);if(isNaN(w)||isNaN(l))return null;
  const m=swiMembers(S)[k];if(!m)return null;const {here,past}=m;
  const t=w===3?`${k} : en quarts`:l===3?`${k} : éliminées`:`Bilan ${k}`;
  const lead=w===3?"Trois victoires : qualifiées pour les quarts de finale.":l===3?"Trois défaites : éliminées de ces Worlds.":`Prochain match en ${w===2||l===2?"Bo3":"Bo1"} : ${swiStake(k)}.`;
  return [t,`<p>${esc(lead)}</p>${here.length?`<h4 class="swi-sh">${w===3||l===3?"Les équipes":"Ici maintenant"}</h4><div class="list">${here.map(id=>swiSheetRow(id,R,S,false)).join("")}</div>`:`<p class="small">${past.length?"Plus personne ici : toutes ont avancé.":"Personne pour l’instant."}</p>`}${past.length?`<h4 class="swi-sh">Passées par là</h4><div class="list">${past.map(id=>swiSheetRow(id,R,S,true)).join("")}</div>`:""}`,true]};
/* bilans : qualifiées, en lice (sursis), éliminées */
function swiTabChances(S,cas){
  /* bilans et chances du robot réunis : une ligne par équipe, groupées en quarts / en lice / éliminées ; podium du titre en tête */
  const R=records(),SIM=SJ&&SJ.sim,E=SIM&&SIM.eq||null,e=id=>E&&E[id],key=id=>swiRec(S.P,id),fin=MATCHES.find(m=>m.stage==="f"&&m.winner);
  const ids=S.teams.map(t=>t.id).sort((a,b)=>{const [wa,la]=key(a),[wb,lb]=key(b);return wb-wa||la-lb||((e(b)||[])[10]||0)-((e(a)||[])[10]||0)});
  const mx=Math.max(.01,...ids.map(id=>(e(id)||[])[10]||0));let k=0,h="";
  if(fin)h+=`<div class="blk swi-champ" data-t="${esc(fin.winner)}" role="button" tabindex="0"><span class="swi-cup">${ICUP}</span>${logo(fin.winner,64)}<b>${esc(T[fin.winner]?T[fin.winner].name:fin.winner)}</b><small>Champion du monde 2026</small></div>`;
  else if(E){const top=Object.entries(E).sort((a,b)=>b[1][10]-a[1][10]).slice(0,3);
    h+=`<div class="swi-pod${cas?" cas":""}">${top.map(([t,v],i)=>`<button class="swi-pp p${i+1}" data-info="swt:${esc(t)}" aria-label="${esc(tid(t))} : ${rkPct(v[10])} % de chances de titre">${i?"":`<span class="swi-cup">${ICUP}</span>`}${logo(t,i?38:50)}<b>${esc(tid(t))}</b><strong>${rkPct(v[10])}${NB}%</strong><span class="swi-bar"><i style="width:${Math.max(2,v[10]/top[0][1][10]*100).toFixed(1)}%;--k:${i}"></i></span></button>`).join("")}</div>`}
  const row=id=>{const [w,l]=key(id),L=lives(id,R),x=e(id),i=k++,q=w>=3,o=l>=3;
    const qc=q?`<span class="swi-cq ok" aria-label="en quarts">${SWI_OK}</span>`:o?`<span class="swi-cq ko" aria-label="éliminée">${SWI_KO}</span>`
      :x?`<span class="swi-cq"><b>${rkPct(x[7])}${NB}%</b><span class="swi-bar t"><i style="width:${Math.max(2,x[7]*100).toFixed(1)}%;--k:${i}"></i></span></span>`:`<span class="swi-cq"></span>`;
    const tc=x&&!o?`<span class="swi-cg"><b>${rkPct(x[10])}${NB}%</b><span class="swi-bar"><i style="width:${Math.max(2,x[10]/mx*100).toFixed(1)}%;--k:${i}"></i></span></span>`:`<span class="swi-cg"></span>`;
    return `<button class="swi-cr${id===fav?" me":""}${o?" out":""}" ${x?`data-info="swt:${esc(id)}"`:`data-t="${esc(id)}"`} style="--k:${i}"><span class="tn">${logo(id,26)}<b>${esc(tid(id))}</b></span><span class="rc"><b>${w}-${l}</b>${w<3&&l<3?swiPips(L):""}</span>${qc}${tc}</button>`};
  const grp=[["bq","En quarts",ids.filter(id=>key(id)[0]>=3)],["bin","En lice",ids.filter(id=>key(id)[0]<3&&key(id)[1]<3)],["bx","Éliminées",ids.filter(id=>key(id)[1]>=3)]];
  h+=`<div class="blk swi-chs${cas?" cas":""}"><div class="swi-ch"><span></span><span>Bilan</span><span>Quarts</span><span>Titre</span></div>`
    +grp.filter(g=>g[2].length).map(([c,lab,L])=>`<div class="swi-gh ${c}"><b>${lab}</b><span>${L.length}</span></div>${L.map(row).join("")}`).join("")+`</div>`;
  const pi=TEAMS.filter(t=>!S.teams.some(x=>x.id===t.id));
  if(pi.length)h+=`<div class="swi-gh bx"><b>Éliminées au Play-In</b><span>${pi.length}</span></div><div class="swi-pig">${pi.map(t=>`<button class="swi-qt out" data-t="${t.id}">${logo(t.id,26)}<b>${esc(t.id)}</b></button>`).join("")}</div>`;
  return h+(SIM?`<p class="note">${(SIM.n||20000).toLocaleString("fr-FR")} tournois simulés · ${esc(simMaj(SIM))}</p>`:"");
}
/* sous-ligne d'une équipe avec « EN DIRECT » en pastille */
function swiSubHTML(id,R){const nx=nextOf(id);if(nx&&nx.state==="live")return `${esc(swiSub(id,R,false))} · <span class="lv">LIVE</span> contre ${esc(tid(swiOpp(nx,id)))}`;return esc(swiSub(id,R))}
const swiQT=(id,S)=>`<button class="swi-qt${id===fav?" me":""}" data-t="${esc(id)}">${logo(id,28)}<b>${esc(tid(id))}</b>${S&&S.P[id]?`<small>${swiRec(S.P,id).join("-")}</small>`:""}</button>`;
/* phase finale : tableau à élimination directe, vertical */
function swiKOCard(x){
  const ln=(m,id,s,w)=>`<span class="swi-kl${w?(w===id?" kw":" lo"):""}">${id?logo(id,22):`<i class="swi-kq"></i>`}<b>${id?esc(tid(id)):"À déterminer"}</b><em>${s!=null&&m&&m.state!=="soon"?s:""}</em></span>`;
  if(x.m&&(x.m.t1||x.m.t2)){const m=x.m,ok=m.t1&&m.t2,st=new Date(m.start),pk=picks[m.key];
    const top=`<small>${m.state==="live"?`<span class="lv">LIVE</span>`:esc(swiDate(st))}${pk?`<span class="dotp${m.winner?(pk===m.winner?" ok":" ko"):" on"}"></span>`:""}</small>${ln(m,m.t1,m.s1,m.winner)}${ln(m,m.t2,m.s2,m.winner)}`;
    return ok?`<button class="swi-kc${m.state==="live"?" live":""}" data-go="m/${esc(m.id)}">${top}</button>`:`<div class="swi-kc tbd">${top}</div>`}
  return `<div class="swi-kc tbd"><b>${esc(x.lab||"À déterminer")}</b><small>${esc(swiDate(x.dt))}</small></div>`;
}
function swiTabKO(S){
  const fin=MATCHES.find(m=>m.stage==="f"&&m.winner);let h="";
  if(fin)h+=`<div class="blk swi-champ" data-t="${esc(fin.winner)}" role="button" tabindex="0"><span class="swi-cup">${ICUP}</span>${logo(fin.winner,64)}<b>${esc(T[fin.winner]?T[fin.winner].name:fin.winner)}</b><small>Champion du monde 2026</small></div>`;
  const Q=S.teams.filter(t=>swiRec(S.P,t.id)[0]>=3).map(t=>t.id),qfKnown=MATCHES.some(m=>m.stage==="qf"&&m.t1&&m.t2);
  if(!fin&&!qfKnown){
    h+=`<div class="blk"><div class="bh">${Q.length?`En quarts<span class="swi-bhs">${Q.length}/8</span>`:"Phase finale"}<button class="i swi-i" data-info="swfin" aria-label="Comment se fait le tirage">i</button></div>
      ${Q.length?`<div class="swi-ql">${Q.map(id=>swiQT(id,S)).join("")}</div>`:""}
      <p class="small" style="margin:8px 0 0">Tirage des quarts le 31 octobre.</p><button class="chip swi-tochs" data-tab="ch">Chances de chaque équipe ›</button></div>`}
  [["qf","Quarts de finale",4],["sf","Demi-finales",2],["f","Finale",1]].forEach(([s,lab,n])=>{
    const L0=MATCHES.filter(m=>m.stage===s).sort((a,b)=>a.start.localeCompare(b.start)),kn=L0.filter(m=>m.t1||m.t2),L=kn.length>=n?kn:L0,cov=new Set(L.map(m=>dayKeyL(new Date(m.start))));
    const ph=DAYS.filter(d=>d.stage===s).map(d=>({dt:new Date(d.d+"T"+d.t+":00Z"),lab:d.what.replace(/^Quart de finale/,"Quart").replace(/^Demi-finale/,"Demie").replace(/^Grande finale/,"Finale")})).filter(x=>!cov.has(dayKeyL(x.dt)));
    const slots=[...L.map(m=>({m,dt:new Date(m.start)})),...ph].sort((a,b)=>a.dt-b.dt).slice(0,Math.max(n,L.length));if(!slots.length)return;
    const f=x=>evDate(x.dt).toLocaleDateString("fr-FR",{day:"numeric",month:"short"}),d0=f(slots[0]),d1=f(slots[slots.length-1]);
    h+=`<div class="swi-gh"><b>${lab}</b><span>${esc(d0===d1?d0:`${d0.split(" ")[1]===d1.split(" ")[1]?d0.split(" ")[0]:d0} au ${d1}`)} · ${esc(swiVenue(s))}</span></div><div class="swi-ko n${Math.min(n,2)}">${slots.map((x,i)=>swiKOCard({...x,lab:x.lab||(s==="f"?"Finale":(s==="qf"?"Quart ":"Demie ")+(i+1))})).join("")}</div>`});
  return h||`<p class="empty">Phase finale pas encore programmée.</p>`;
}
function scrSui(d){
  const S=swiState();if(!d.tab||!["tb","ch","fn","rob"].includes(d.tab))d.tab=S.over?"fn":"tb";
  return {title:`Phase suisse<small>${S.over?"terminée":`ronde ${S.r} sur 5${S.drawn?"":" · tirage à venir"}`}</small>`,info:"sui",head:swiHead(S),tabs:[["tb","Tableau"],["ch","Chances"],["fn","Finale"],["rob","Robot"]],
    needs:SJ?[]:[loadSJ()],
    render:t=>{const cas=swiAnimOn(d);return t==="ch"?swiTabChances(S,cas):t==="fn"?swiTabKO(S):t==="rob"?swiFiab():swiTree(S)+(fav&&T[fav]?swiMine(S):"")}};
}
INFO.sui=()=>["Phase suisse",`<p>16 équipes, 5 rondes : 3 victoires pour les quarts, 3 défaites pour la sortie. On affronte une équipe au même bilan. Matchs décisifs (qualification ou élimination) en Bo3, les autres en Bo1.</p>
  <p><b>Tableau</b> : le chemin de chaque équipe. <b>Chances</b> : bilan, défaites encore permises (pastilles) et chances du robot pour les quarts et le titre. <b>Finale</b> : le tableau à élimination directe. <b>Robot</b> : ses pronos match par match. Les matchs eux-mêmes sont dans le Calendrier.</p>`,true];
INFO.swtree=()=>["Le tableau suisse",`<p>Une rangée par ronde, une case par bilan (victoires-défaites). Logos vifs : les équipes qui y sont maintenant ; pâles : celles qui y sont passées.</p>
  <p>Trait sarcelle : la victoire mène à la case de gauche ; trait rouge : la défaite, à celle de droite. Cases sarcelle : qualifiées pour les quarts ; rouges : éliminées.${fav?` En or : le parcours de ${esc(tid(fav))}.`:""}</p><p>Touche une case pour voir ses équipes.</p>`,true];
INFO.swfin=()=>["Phase finale",`<p>Tirage des quarts le 31 octobre. Les deux équipes à 3-0 seront placées dans des moitiés de tableau opposées, face à des équipes à 3-2. Quarts du 3 au 6 novembre, demies les 7 et 8, finale le 14 au Barclays Center (Brooklyn, New York). Tout en Bo5.</p>`,true];

/* ===================== QUI VA GAGNER (sim) ===================== */
const simMaj=S=>S.maj?"mis à jour "+new Date(S.maj).toLocaleString("fr-FR",{weekday:"long",hour:"2-digit",minute:"2-digit"}):"";
function swiWho(){const R=RKX(),W2=R&&R.W;if(!W2||!W2.fav)return [];return [["fav",W2.fav],...(W2.ch||[]).map(x=>["ch",x]),...(W2.out?[["out",W2.out]]:[])]}
/* le robot a-t-il vu juste ? (fiabHTML de v13.5 : même décompte, mis en page façon B) */
function swiFiab(){
  const F=SJ&&SJ.fiab;if(!F||!F.w26||!F.w26.m||!F.w26.m.length)return `<p class="empty">Pas encore de match joué : le bilan du robot arrive avec le premier résultat.</p>`;
  const Rm=F.w26.m,good=r=>(r[5]>=.5)===!!r[6],ok=Rm.filter(good).length,id=c=>resolveTeam(c)||c,nm=c=>esc(T[id(c)]?T[id(c)].id:c),E=F.t&&F.t.E;
  const by={};Rm.forEach(r=>{const s=stageOf(r[1]+"T12:00:00Z"),k=s==="pi"?"Play-In":s==="sw"?"Suisse":"Phase finale";(by[k]=by[k]||[0,0]);by[k][0]+=good(r)?1:0;by[k][1]++});
  const rows=Rm.slice().reverse().map(r=>{const fa=r[5]>=.5,g=good(r),a=id(r[2]),b=id(r[3]),m=mOf("le"+r[0]),tag=m?"button":"div";
    return `<${tag} class="swi-fr ${g?"ok":"ko"}"${m?` data-go="m/${esc(m.id)}"`:""}><span class="d">${esc(new Date(r[1]+"T12:00:00Z").toLocaleDateString("fr-FR",{day:"numeric",month:"short"}))}</span><span class="tn">${logo(a,18)}<b class="${r[6]?"fw":""}">${nm(r[2])}</b><i>–</i><b class="${r[6]?"":"fw"}">${nm(r[3])}</b>${logo(b,18)}</span><span class="fv">${nm(fa?r[2]:r[3])} ${Math.round(Math.max(r[5],1-r[5])*100)}${NB}%</span><i class="mk" aria-label="${g?"vu juste":"surprise"}">${g?SWI_OK:SWI_KO}</i></${tag}>`}).join("");
  return `<div class="blk swi-fb"><div class="bh">Le robot a-t-il vu juste ?<button class="i swi-i" data-info="swfiab" aria-label="Comment il a été testé">i</button></div>
    <div class="swi-fs"><div class="ring">${ringSVG(ok/Rm.length,64,7)}<b>${Math.round(ok/Rm.length*100)}${NB}%</b></div><div class="grow"><strong>${ok}/${Rm.length}</strong><span>bons favoris sur les matchs joués de ces Worlds</span><small>${Object.entries(by).map(([k,v])=>`${k} ${v[0]}/${v[1]}`).join(" · ")}</small></div></div>
    ${E&&E.g?`<p class="swi-fn">Avant les Worlds, testé à l’aveugle : ${Math.round(E.g[3]*100)}${NB}% de bons favoris sur ${E.g[0]} parties internationales.</p>`:""}</div>
    <div class="blk"><div class="bh">Match par match<span class="swi-bhs">gagnant en or</span></div><div class="swi-fl">${rows}</div>
    <p class="small" style="margin:10px 0 0">${Rm.some(r=>r[7]==="g")?"Pronos figés au coup d’envoi. ":""}${Rm.some(r=>r[7]==="r")?"Les premiers matchs sont recalculés avec les seules données d’avant le match.":""}</p></div>`;
}
INFO.swfiab=()=>{const F=SJ&&SJ.fiab,E=F&&F.t&&F.t.E,L=F&&F.t&&F.t.lig,cal=((F&&F.cal)||[]).filter(c=>c[2]>=30);
  return ["Comment il a été testé",`${E&&L?`<p>Avant les Worlds, testé à l’aveugle sur ${E.g[0]} parties internationales : bon favori ${Math.round(E.g[3]*100)} % du temps, autant que la règle « la ligue la plus forte gagne » (${Math.round(L.g[3]*100)} %), mais avec des pourcentages plus justes.</p>`:""}
    ${cal.length?`<h4 class="swi-sh">Annoncé et réel</h4><div class="swi-cal">${cal.map(c=>`<div><span>annonce ${Math.round(c[0]*100)}${NB}%</span><span class="swi-cb"><i style="width:${c[0]*100}%"></i><i class="r" style="width:${c[1]*100}%"></i></span><b>${Math.round(c[1]*100)}${NB}%</b><small>${c[2]} parties</small></div>`).join("")}</div><p class="small">Barre claire : ce que le robot annonce ; barre sarcelle : ce qui s’est vraiment passé.</p>`:""}
    <p>Pour ces Worlds, chaque prono est figé au coup d’envoi ; les premiers matchs, publiés avant le robot, sont recalculés avec les seules données d’avant le match. Les surprises restent fréquentes : c’est ce qui rend les Worlds beaux.</p>`,true]};
/* feuille d'une équipe : étapes, bilan final probable, pourquoi, prochain adversaire, évolution */
INFOP.swt=a=>{const S=SJ&&SJ.sim,e=S&&S.eq&&S.eq[a];const W2=RKX()&&RKX().W;let kind=null,x=null;
  if(W2){if(W2.fav&&W2.fav.t===a){kind="fav";x=W2.fav}else{const c=(W2.ch||[]).find(z=>z.t===a);if(c){kind="ch";x=c}else if(W2.out&&W2.out.t===a){kind="out";x=W2.out}}}
  if(!e)return null;let h="";
  h+=`<div class="swi-stp">${[["Quarts",e[7]],["Demies",e[8]],["Finale",e[9]],["Titre",e[10]]].map(([l,v])=>`<div><span>${l}</span><span class="swi-bar"><i style="width:${Math.max(1,v*100).toFixed(1)}%"></i></span><b>${rkPct(v)}${NB}%</b></div>`).join("")}</div>`;
  const [w,l]=String(e[0]).split("-").map(Number);
  if(w<3&&l<3){const lab=["3-0","3-1","3-2","2-3","1-3","0-3"],v=e.slice(1,7),mx=Math.max(...v)||1;
    h+=`<h4 class="swi-sh">Bilan suisse final (bilan actuel ${esc(e[0])})</h4><div class="swi-hist">${v.map((p,i)=>`<div class="${i<3?"hq":"hx"}${p<.005?" hz":""}"><b>${rkPct(p)}</b><i style="height:${Math.max(3,p/mx*44).toFixed(1)}px"></i><span>${lab[i]}</span></div>`).join("")}</div>`}
  const why=x?rkWhyTeam(x,kind):[];
  if(S.S&&S.S[a]!=null){const r=Object.values(S.S).filter(v=>v>S.S[a]).length+1;why.push(`${rkFem(r)} force sur ${Object.keys(S.S).length} (somme des notes d’impact de ses 5 titulaires)`)}
  const nx=nextOf(a);
  if(nx){const p=robotProb(nx),pa=p==null?null:(nx.t1===a?p:1-p);why.push(`prochain match : contre ${esc(tid(swiOpp(nx,a)))}, ${esc(swiWhen(nx))}${pa!=null?`, ${rkPct(pa)} % de chances selon le robot`:""}`)}
  else if(!x&&S.nx&&S.nx[a]&&S.nx[a][0]){const z=S.nx[a][0];why.push(`adversaire le plus probable au prochain match : ${esc(tid(z[0]))} (${rkPct(z[1])} %), battu ${rkPct(z[2])} fois sur 100`)}
  if(why.length)h+=`<h4 class="swi-sh">Pourquoi</h4><ul class="why">${why.map(s=>`<li>${s.charAt(0).toUpperCase()+s.slice(1)}.</li>`).join("")}</ul>`;
  const hs=(S.hist||[]).filter(z=>z[2]&&z[2][a]).map(z=>z[2][a][1]);
  if(hs.length>=2){const mx=Math.max(...hs),mn=Math.min(...hs),n=hs.length-1,pts=hs.map((v,i)=>`${(i/n*100).toFixed(1)},${(36-(v-mn)/(mx-mn||1)*32).toFixed(1)}`).join(" ");
    h+=`<h4 class="swi-sh">Évolution de ses chances de titre</h4><div class="swi-evo"><svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}"/></svg><span>${rkPct(hs[0])}${NB}%</span><b>${rkPct(hs[n])}${NB}%</b></div>`}
  h+=`<div class="swi-sb"><button class="btn" data-t="${esc(a)}">Fiche ${esc(tid(a))}</button>${nx?`<button class="btn" data-m="${esc(nx.id)}">Son prochain match</button>`:""}</div>`;
  return [`${tid(a)}${kind?" · "+RK_KIND[kind]:""}`,h,true]};
/* « Qui va gagner ? » vit maintenant dans la phase suisse (onglets Chances et Robot) : l'ancienne route y mène */
function scrSim(d){if(!d._sim){d._sim=1;d.tab=d.tab==="rob"?"rob":"ch"}return scrSui(d)}
INFO.sim=()=>{const s=SJ&&SJ.sim,W2=RKX()&&RKX().W;return ["Qui va gagner ?",(s?rkSimInfo(s,W2):"")+`<p>Probabilités du robot, pas des certitudes.${s&&s.modele&&/secours/.test(s.modele)?" Modèle de secours utilisé cette fois.":""}${s&&s.maj?` Mis à jour ${esc(new Date(s.maj).toLocaleString("fr-FR",{weekday:"long",hour:"2-digit",minute:"2-digit"}))}.`:""}</p>`,true]};

/* ===================== CALENDRIER (cal) ===================== */
const swiInF=(f,s)=>f==="all"||s===f||(f==="ko"&&["qf","sf","f"].includes(s));
function swiDayHead(k,first,stg,extra){const now=k===dayKeyL(new Date());
  return `<div class="swi-day${now?" now":""}"><b>${esc(fmtDay(evDate(first)))}</b>${now?`<span class="swi-now">ce soir</span>`:""}${extra?`<span class="swi-dx">${extra}</span>`:""}<small>${esc(STAGES[stg]||"")}${swiVenue(stg)?" · "+esc(swiVenue(stg)):""}</small></div>`}
function swiCalNext(f){
  const dk0=dayKeyL(new Date()),G={};
  MATCHES.filter(m=>swiInF(f,m.stage)).forEach(m=>{const k=dayKeyL(new Date(m.start));(G[k]=G[k]||[]).push(m)});
  const keep=Object.keys(G).filter(k=>k>=dk0||G[k].some(m=>!m.winner&&m.t1&&m.t2&&m.state!=="soon"));
  const PH={};DAYS.forEach(d=>{if(!swiInF(f,d.stage))return;const dt=new Date(d.d+"T"+d.t+":00Z"),k=dayKeyL(dt);if(k<dk0)return;if(G[k]&&G[k].some(m=>m.t1||m.t2))return;PH[k]={d,dt};if(!keep.includes(k))keep.push(k)});
  keep.sort();if(!keep.length)return `<p class="empty">Plus de match prévu.</p>`;
  return keep.map(k=>{const g=(G[k]||[]).slice().sort((a,b)=>a.start.localeCompare(b.start)),kn=g.filter(x=>x.t1&&x.t2),tb=g.filter(x=>!(x.t1&&x.t2)),ph=PH[k];
    const first=g.length?new Date(g[0].start):ph.dt,stg=g.length?g[0].stage:ph.d.stage;
    const tbd=tb.length||ph?`<div class="swi-tbd"><time>${esc(fmtTime(tb.length?new Date(tb[0].start):ph.dt))}</time><span class="grow"><b>${tb.length?`${plur(tb.length,"match","matchs")} à déterminer`:esc(ph.d.what.split(".")[0])}</b><small>${tb.length?(ph?esc(ph.d.what.split(".")[0]):"affiches publiées au tirage de la ronde"):`premier match à ${esc(fmtTime(ph.dt))}`}</small></span></div>`:"";
    return swiDayHead(k,first,stg,"")+`<div class="list">${kn.map(mrow).join("")}${tbd}</div>`}).join("");
}
function swiCalRes(f){
  const G={};MATCHES.filter(m=>m.winner&&m.t1&&m.t2&&swiInF(f,m.stage)).forEach(m=>{const k=dayKeyL(new Date(m.start));(G[k]=G[k]||[]).push(m)});
  const ks=Object.keys(G).sort().reverse();if(!ks.length)return `<p class="empty">Aucun résultat pour l’instant.</p>`;
  return ks.map(k=>{const g=G[k].sort((a,b)=>a.start.localeCompare(b.start)),mine=g.filter(x=>picks[x.key]),ok=mine.filter(x=>picks[x.key]===x.winner).length;
    return swiDayHead(k,new Date(g[0].start),g[0].stage,mine.length?`tes paris <b>${ok}/${mine.length}</b>`:"")+`<div class="list">${g.map(mrow).join("")}</div>`}).join("");
}
function scrCal(d){const f=ui.stage||"all";
  const chip=(k,l)=>`<button class="chip swi-chip" data-swst="${k}" aria-pressed="${f===k}">${l}</button>`;
  return {title:`Calendrier<small>${esc("horaires en "+tzLabel)}</small>`,info:"cal",head:`<div class="swi-chips">${chip("all","Tout")}${chip("pi","Play-In")}${chip("sw","Suisse")}${chip("ko","Phase finale")}</div>`,
    tabs:[["next","À venir"],["res","Résultats"]],render:t=>t==="res"?swiCalRes(f):swiCalNext(f)};
}
onAct("[data-swst]",b=>{ui.stage=b.dataset.swst;vib(6);const el=b.closest(".scr");if(el){el.scrollTop=0;rerender(el)}});
INFO.cal=()=>["Calendrier",`<p>Horaires en ${esc(tzLabel)}. La nuit (avant 6 h) compte dans la soirée de la veille. Sous « VS » : le favori du robot. Pastille : ton prono (doré), gagné (sarcelle), perdu (rouge) ; anneau vide : pas encore parié.</p>
  <p>Les affiches de la phase suisse sont publiées au tirage de chaque ronde. Lieux : Play-In à la ${esc(VENUES.pi)} ; phase suisse, quarts et demies au ${esc(VENUES.sw)} ; finale au ${esc(VENUES.f)}.</p>`,true];

/* ===================== widgets de l'accueil ===================== */
function wSim(k,big){
  if(MATCHES.some(m=>m.stage==="f"&&m.winner))return"";
  const S=SJ&&SJ.sim;if(!S||!S.eq)return"";const L=swiWho();
  if(big&&L.length){const R=[L[0],...L.filter(z=>z[0]==="ch")].slice(0,4).map(z=>z[1]),mx=Math.max(...R.map(x=>x.p[0]))||1;
    return W("w22","sim",`<div class="hin" style="padding:16px"><div class="wh">Qui va gagner ces Worlds ?<em>titre</em></div><div class="wb swi-wl" style="justify-content:center">${R.map((x,i)=>`<div class="swi-wr">${logo(x.t,24)}<span class="grow"><b>${esc(tid(x.t))}</b><small>${esc(rkTeamShort(x))}</small></span><em>${rkPct(x.p[0])}${NB}%</em><span class="swi-bar"><i style="width:${(x.p[0]/mx*100).toFixed(1)}%;--k:${i}"></i></span></div>`).join("")}</div><div class="ws" style="margin-top:8px">${(S.n||20000).toLocaleString("fr-FR")} tournois simulés · ${esc(simMaj(S))}</div></div>`,k,"","Qui va gagner ces Worlds ? Voir la simulation");}
  const rows=Object.entries(S.eq).sort((a,b)=>b[1][10]-a[1][10]).slice(0,big?5:3),mx=rows[0][1][10]||1;
  const r=([t,v],i)=>`<div class="tb">${logo(t,20)}<b>${esc(tid(t))}</b><span class="br swi-bar"><i style="width:${(v[10]/mx*100).toFixed(1)}%;--k:${i}"></i></span><em>${rkPct(v[10])}${NB}%</em></div>`;
  if(big)return W("w22","sim",`<div class="hin" style="padding:16px"><div class="wh">Qui va gagner ces Worlds ?<em>titre</em></div><div class="wb" style="gap:10px;justify-content:center">${rows.map(r).join("")}</div><div class="ws" style="margin-top:10px">${(S.n||20000).toLocaleString("fr-FR")} tournois simulés · ${esc(simMaj(S))}</div></div>`,k,"","Qui va gagner ces Worlds ?");
  return W("w21","sim",`<div class="wh">Qui va gagner ?<em>chances de titre</em></div><div class="wb" style="gap:3px;justify-content:center;overflow:hidden">${rows.map(r).join("")}</div>`,k,"","Qui va gagner ces Worlds ?");
}
/* phase suisse : ronde en cours, qualifiés, éliminés */
function wSwiss(k){const S=swiState();if(!S.teams.length)return"";
  if(S.over){const ko=MATCHES.filter(m=>["qf","sf","f"].includes(m.stage)&&m.t1&&m.t2&&!m.winner)[0];
    const ch=(MATCHES.find(m=>m.stage==="f"&&m.winner)||{}).winner;
    return W("w11","sui/fn",`<div class="wh">${ch?"Champion du monde":"Phase finale"}${ch?`<em>${logo(ch,22)}</em>`:""}</div><div class="wb"><div class="wn" style="font-size:30px">${ch?esc(tid(ch)):ko?esc(STAGES[ko.stage].split(" ")[0]):"Quarts"}</div><div class="ws">${ch?"Worlds 2026":ko?`${ko.state==="live"?"en direct · ":""}${esc(tid(ko.t1))} – ${esc(tid(ko.t2))}`:"8 équipes qualifiées"}</div></div>`,k,"",ch?"Champion du monde":"Phase finale")}
  return W("w11","sui",`<div class="wh">Phase suisse</div><div class="wb"><div class="wn" style="font-size:34px">Ronde ${S.r}</div><div class="ws"><b>${S.q}</b> en quarts · <b>${S.x}</b> dehors</div><div class="swi-wsg">${[1,2,3,4,5].map(i=>`<i class="${i<S.r||(!S.drawn&&i<=S.played)?"d":i===S.r?"c":""}"></i>`).join("")}</div></div>`,k,"","Phase suisse, ronde "+S.r)}
/* mon équipe : bilan, sursis, prochain match ; sans équipe, le choix */
function wMyTeam(k){
  if(!fav||!T[fav])return W("w11","sui",`<div data-info="swfav" style="display:flex;flex-direction:column;height:100%"><div class="wh">Mon équipe</div><div class="wb"><div class="swi-wpk">${["GEN","T1","KC","G2"].map(id=>logo(id,22)).join("")}</div><div class="ws" style="white-space:normal;color:var(--gold2);font-weight:600">Choisis ton équipe</div><div class="ws">son parcours en or</div></div></div>`,k,"","Choisir mon équipe");
  const S=swiState(),R=records(),st=status(fav,R),L=lives(fav,R),nx=nextOf(fav),rec=S.P[fav]?swiRec(S.P,fav).join("-"):"";
  return W("w11",ROUTES.t?"t/"+fav:"sui",`<div class="wh">Mon équipe<em>${logo(fav,22)}</em></div><div class="wb"><div class="wn" style="font-size:32px">${esc(tid(fav))}${rec?`<small>${rec}</small>`:""}</div><div class="ws">${esc(st.k==="in"&&L?L.txt:st.txt)}</div><div class="ws">${nx?`${nx.state==="live"?`<span class="lv">LIVE</span>`:esc(swiWhen(nx))} contre <b>${esc(tid(swiOpp(nx,fav)))}</b>`:"&nbsp;"}</div></div>`,k,"","Mon équipe : "+tid(fav));
}

/* ===================== branchements ===================== */
defScreen("sui",{arg:"tab",screen:scrSui});
defScreen("sim",{arg:"tab",screen:scrSim});
defScreen("cal",{arg:"tab",screen:scrCal});
defWidget("sim",wSim);
defWidget("swiss",wSwiss);
defWidget("myteam",wMyTeam);
