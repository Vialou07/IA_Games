/* =====================================================================================
   match.js — FICHE DE MATCH (propriétaire : agent match). Un écran (route m/<id>/<onglet>), trois états :
   - à venir : Aperçu (robot, ton prono, clés, où regarder) · Joueurs (duel par poste) · Draft (fearless, bans, picks) · Équipes ;
   - en direct (et en attente du résultat) : HUD en tête, Direct (fil, courbe d'or, bascule, records, fights, duels, joueur du
     match) · Joueurs (tableau fusionné) · Draft (draft de la partie ; entre deux parties : la suite de la série) · Parties
     (dès la 1re partie finie) · Avant (paris, robot, clés, duels par poste, équipes) ;
   - terminé : Résumé · Parties (série) · Joueurs · Draft (contre nos pronos) · Avant.
   Moteur du direct (liveTick, watchLive, paintLive → BUS "live") : une partie suivie, toutes les 10 s (30 s onglet caché),
   repeinture par blocs (matPatch) : pas de saut, onglet, défilement et feuilles ouvertes gardés. Duel de deux joueurs (route d/).
   Calculs repris de v13.5 (src/legacy/match.list.js), rendus au style de B : la réponse à l'écran (N1), le détail en feuille au
   toucher (N2), la méthode derrière « i » (N3). Données asynchrones : mêmes clés de cache w26_ak_* que v13.5 (matAk).
   Conventions : nouveaux noms préfixés mat, classes .mat-* ; les noms repris de B (scrMatch, hudHTML…) gardent leur nom.
   ===================================================================================== */

/* ===================== 0. outils ===================== */
const MAT_VF="https://www.twitch.tv/otplol_",MAT_LES="https://lolesports.com/fr-FR/";
const IPLAY=`<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>`;
const matKind=m=>m.state==="done"?"done":(m.state==="live"||m.state==="wait")?"live":"soon";
const matN=m=>(m.s1||0)+(m.s2||0);
const matMid=m=>m&&/^le\d/.test(String(m.id))?String(m.id).slice(2):null;
const matCity=m=>{const v=VENUES[m.stage]||"",i=v.lastIndexOf(", ");return i>0?v.slice(i+2):v};
const matDur=v=>v==null?"":Math.floor(v)+":"+String(Math.round(v%1*60)%60).padStart(2,"0");
const matOn=L=>!!(L&&L.frame&&L.status!=="between"&&L.status!=="waiting"&&L.status!=="starting"&&L.status!=="nolive");
const matPc=v=>Math.round(v*100)+NB+"%";
/* côté de t1 dans la partie suivie : A = t1, B = t2 (bleu ou rouge selon la partie) */
function sideFrame(L,m){const f=L.frame;if(!f)return null;const aBlue=L.blue!==m.t2;return {A:aBlue?f.blueTeam:f.redTeam,B:aBlue?f.redTeam:f.blueTeam,aBlue}}
function liveP(L,m){const f=L.frame;const p=winProb(f,gameMins(L));return L.blue!==m.t2?p:1-p}
const matCol=(m,t)=>t===m.t2?cB(m):cA(m);
/* une ligne qui répond (niveau 1) et ouvre le détail (feuille, niveau 2) ; sans détail : une simple ligne */
function matRow(lab,val,info,cls=""){
  return info?`<button class="mat-row${cls?" "+cls:""}" data-info="${esc(info)}"><span class="mat-rt"><small>${lab}</small><span class="mat-rv">${val}</span></span><span class="chev">›</span></button>`
    :`<div class="mat-row${cls?" "+cls:""}"><span class="mat-rt"><small>${lab}</small><span class="mat-rv">${val}</span></span></div>`}
/* feuilles construites au toucher ; « live » : repeintes à chaque image du direct tant qu'elles restent ouvertes */
const MAT_LS=new Map();
function matSheet(k,title,fn,live){if(live)MAT_LS.set(k,{title,fn});
  return xi("mat|"+k,()=>{const h=safe(fn);return h?[title,h+(live?`<i data-matlive="${esc(k)}" hidden></i>`:""),true]:null})}
function matSheetRefresh(){if(!SHEET.open)return;const mk=document.querySelector("#shB [data-matlive]");if(!mk)return;const k=mk.dataset.matlive,r=MAT_LS.get(k);if(!r)return;
  const h=safe(r.fn);if(!h)return;const html=`<h3 id="shT">${esc(r.title)}</h3>${h}<i data-matlive="${esc(k)}" hidden></i>`,b=$("#shB");if(b._mh===html)return;
  const s=$("#sheet"),y=s.scrollTop;b._mh=html;b.innerHTML=html;s.scrollTop=y}
/* données asynchrones de v13.5 (ablock et son cache w26_ak_<clé>, mêmes clés et mêmes données que la prod : les caches des potes
   servent tout de suite). Rend les données, undefined pendant le chargement (l'écran se redessine à l'arrivée), null si échec. */
function matAk(key,fn,ttl){let a=AK[key];if(!a){ablock(key,fn,()=>"",ttl);a=AK[key]}
  if(a.st==="ok")return a.data;if(a.st==="err")return null;
  if(!a.started){a.fn=fn;runAk(key).then(matRedraw,matRedraw)}return undefined}
const matErr=k=>`<div class="aerr"><span>Données injoignables pour l’instant.</span><button class="btn" data-matretry="${esc(k)}">Réessayer</button></div>`;
function matRedraw(){if(matRedraw.r)return;matRedraw.r=requestAnimationFrame(()=>{matRedraw.r=0;NAV.forEach(x=>{if(x.el.isConnected&&(x.d.v==="m"||x.d.v==="d"))rerender(x.el)})})}
/* repeinture par blocs : seuls les blocs dont le HTML change sont remplacés (images, défilement, feuilles gardés) */
function matPatch(c,html){
  if(c._h===html)return;c._h=html;
  const t=document.createElement("template");t.innerHTML=html;const nw=[...t.content.children],old=[...c.children];
  if(nw.length!==old.length||nw.some((n,i)=>n.tagName!==old[i].tagName||n.dataset.pk!==old[i].dataset.pk)){c.innerHTML=html;[...c.children].forEach(x=>{x._src=x.outerHTML});return}
  nw.forEach((n,i)=>{const o=old[i],src=n.outerHTML;if(o._src===src)return;o.replaceWith(n);n._src=src});
}
/* ligue : blocs fournis par league.js et placés ici (score exact M-04 : leaScoreHTML ; ton prono et tes points M-05 : leaMyHTML ;
   paris de la ligue M-06 : leaMatchHTML) ; rien s'ils manquent */
function matLea(fn,...a){const f=fn==="score"?(typeof leaScoreHTML==="function"?leaScoreHTML:null):fn==="my"?(typeof leaMyHTML==="function"?leaMyHTML:null):(typeof leaMatchHTML==="function"?leaMatchHTML:null);
  if(!f)return"";try{return f(...a)||""}catch(e){console.warn("ligue",e);return""}}
const matWatch=()=>`<div class="mat-watch" data-pk="watch"><a class="btn mt0" href="${MAT_VF}" target="_blank" rel="noopener">${IPLAY}Regarder en VF</a><a class="btn mt0" href="${MAT_LES}" target="_blank" rel="noopener">LoL Esports</a></div>`;
const matSeg=(G,n,lab)=>G.length>1?`<div class="seg mat-gseg" data-pk="seg" style="--n:${G.length};--i:${Math.max(0,G.findIndex(x=>x.n===n))}"><i class="ind"></i>${G.map(x=>`<button data-game="${x.n}" aria-selected="${x.n===n}">${lab?lab+x.n:"Partie "+x.n}</button>`).join("")}</div>`:"";

/* identifiant stable pour les dégradés et découpes SVG (même tracé : même id, la repeinture garde le bloc) */
const matHash=s=>{let h=5381;for(let i=0;i<s.length;i++)h=(h*33^s.charCodeAt(i))>>>0;return h.toString(36)};

/* ===================== 1. écran du match ===================== */
function scrMatch(d){
  const m=mOf(d.id);if(!m)return {title:"Match",body:MATCHES.length?`<p class="empty">Match introuvable.</p>`:skel(200)};
  if(!("_t0" in d))d._t0=d.tab||null;
  const kind=matKind(m),fresh=()=>mOf(d.id)||m;d._k=kind;
  const title=`<span class="mh">${m.t1?logo(m.t1,20):""}${esc(tid(m.t1)||"?")} – ${esc(tid(m.t2)||"?")}${m.t2?logo(m.t2,20):""}</span><small>${esc(stageLab(m))} · Bo${m.bo}</small>`;
  const base={title,opened:matOpened,mount:matMount,skipData:x=>{const z=mOf(x.id);return !!z&&x._k==="live"&&matKind(z)==="live"}};
  if(!m.t1||!m.t2)return {...base,info:"prono",head:matHead(m),headKey:"tbd"+m.start,body:`<p class="empty">Affiche pas encore connue : elle dépend du tirage.</p>`};
  if(kind==="soon")return {...base,info:"prono",head:matHead(m),headKey:"soon"+m.start+m.t1+m.t2,tabs:[["ov","Aperçu"],["pl","Joueurs"],["dr","Draft"],["eq","Équipes"]],
    render:t=>{const x=fresh();return t==="pl"?matTabRoles(x):t==="dr"?matTabDraftSoon(x):t==="eq"?matTabTeams(x):matTabOverview(x)},needs:[loadFJ(),loadDJ()]};
  if(kind==="live"){if(LV.watch!==m.id)watchLive(m);
    const tabs=[["di","Direct"],["pl","Joueurs"],["dr","Draft"]];if(matN(m)>0&&matMid(m))tabs.push(["gm","Parties"]);tabs.push(["av","Avant"]);
    return {...base,info:"direct",head:hudHTML(m),tabs,
      render:t=>{const x=fresh();return t==="pl"?matTabLivePlayers(x):t==="dr"?matTabLiveDraft(x):t==="gm"?matTabGames(x,d):t==="av"?matTabBefore(x):matTabDirect(x)},needs:[loadDJ(),loadFJ(),champMap()]}}
  const G=matGames(m),tabs=[["ov","Résumé"]];if(G.length>1||(m.bo===1&&G.length))tabs.push(["gm",G.length>1?"Parties":"Partie"]);tabs.push(["pl","Joueurs"],["dr","Draft"],["av","Avant"]);
  return {...base,info:"termine",head:resultHead(m),headKey:"done"+m.s1+m.s2+m.winner,tabs,
    render:t=>{const x=fresh();return t==="gm"?matTabGames(x,d):t==="pl"?matTabDonePlayers(x,d):t==="dr"?matTabDraftDone(x,d):t==="av"?matTabBefore(x):matTabSummary(x,d)},needs:[loadDJ()]};
}
function recTxt(t,R){const r=R[t];if(!r)return"";const s=r.sw.w+r.sw.l;return s?`suisse ${r.sw.w}-${r.sw.l}`:(T[t]&&T[t].seed)||""}
const matSide=(t,sub,dim)=>t?`<button class="side" data-t="${esc(t)}" aria-label="Fiche ${esc(T[t].name)}"${dim?` style="opacity:.5"`:""}>${logo(t,64)}<span class="code">${esc(tid(t))}</span><span class="mat-rec">${sub}</span></button>`
  :`<div class="side"><span class="mat-tbd">?</span><span class="mat-rec">à déterminer</span></div>`;
/* tête d'un match à venir : face-à-face, compte à rebours, heure, ville, enjeu ; codes des équipes → fiche équipe */
function matHead(m){const st=new Date(m.start),R=records(),stk=m.t1&&m.t2?stakeTxt(m,R):"",ok=m.t1&&m.t2;
  return `<div class="hero mat-hero" style="--c1:${ok?cA(m):"#16294A"};--c2:${ok?cB(m):"#16294A"}">${heroBg(m,170)}<div class="hin">
    <div class="hmeta"><span>${esc(stageLab(m))}</span><span class="badge">Bo${m.bo}</span></div>
    <div class="vs">${matSide(m.t1,esc(m.t1?recTxt(m.t1,R):""))}<div class="mid"><span class="v">VS</span></div>${matSide(m.t2,esc(m.t2?recTxt(m.t2,R):""))}</div>
    <div class="hfoot"><div class="cdn" style="font-size:30px" data-cd="${st.getTime()}"></div><div class="cdd">${esc(whenTxt(st))} · ${esc(matCity(m))}${stk?` · <b style="color:var(--gold2)">${esc(stk)}</b>`:""}</div></div></div></div>`}
function resultHead(m){const w=m.winner;
  return `<div class="hero mat-hero done" style="--c1:${cA(m)};--c2:${cB(m)}">${heroBg(m,170)}<div class="hin"><div class="hmeta"><span>${esc(stageLab(m))}</span><span class="badge">${m.manual?"Saisi à la main":"Terminé"}</span></div>
    <div class="vs">${matSide(m.t1,w===m.t1?"victoire":"défaite",w&&w!==m.t1)}<div class="mid"><span class="sc">${m.s1??(w===m.t1?1:0)}-${m.s2??(w===m.t2?1:0)}</span></div>${matSide(m.t2,w===m.t2?"victoire":"défaite",w&&w!==m.t2)}</div>
    <div class="cdd hfoot">${esc(fmtDay(evDate(new Date(m.start))))} · ${esc(matCity(m))}</div></div></div>`}
function matMount(el){const b=el.querySelector(".headslot .beam");if(b)startBeam(b)}
/* une fois, à l'ouverture : barre du titre qui devient le score en direct, onglet Draft entre deux parties, moments animés */
function matOpened(el){
  el.addEventListener("scroll",()=>{if(el._mb)return;el._mb=requestAnimationFrame(()=>{el._mb=0;matBar(el)})},{passive:true});
  /* cadrage : à chaque changement de taille ou de contenu (onglet changé, données arrivées, direct) */
  if(window.ResizeObserver&&el.firstElementChild){const ro=new ResizeObserver(()=>{if(!el.isConnected){ro.disconnect();return}matFitSoon(el)});ro.observe(el.firstElementChild)}
  if(window.MutationObserver){const mo=new MutationObserver(()=>{if(!el.isConnected){mo.disconnect();return}matFitSoon(el)});mo.observe(el,{childList:true,subtree:true})}
  const d=el._d,m=d&&mOf(d.id);if(!m)return;
  if(d.v==="m"&&d._k==="live"&&!d._t0){const L=LV.games[m.key];el._lst=L&&L.status;if(L&&matPre(L.status)&&d.tab==="di"&&!matOver(m,L)){setTab(el,"dr");el._adr=1}}
  if(!RM&&d.v==="m"&&d._k==="soon"&&d.tab==="ov")matAnimRobot(el);
  if(!RM)matMotion(el);
}

/* cadrage (« bien tout cadrer ») : un onglet qui dépasse de moins de 120 px passe en version resserrée (3 crans : marges, blocs, tête), pour tenir
   dans l'écran plutôt que de défiler de quelques pixels ; un vrai défilement (≥ 120 px) reste tel quel. Une fois par onglet. */
const matFitSoon=el=>{if(!el._mf)el._mf=requestAnimationFrame(()=>{el._mf=0;matFit(el)})};
function matFit(el){const d=el._d;if(!d||!el.isConnected)return;
  const T4=["mat-tight","mat-tight2","mat-tight3","mat-tight4"],cl=el.classList,on=T4.filter(c=>cl.contains(c)).length;
  if(el._ftab!==d.tab){el._ftab=d.tab;el._fno=0;el._f15=0;if(on){cl.remove(...T4);matFitSoon(el);return}}
  const pb=parseFloat(getComputedStyle(el).paddingBottom)||0,o=el.scrollHeight-el.clientHeight-Math.max(0,pb-12);
  /* intégrateur : le premier onglet (Aperçu, Direct, Résumé) reste sous 1,5 écran quand il le dépasse de peu (direct à 25 min : ×1,58
     sur iPhone 12) : mêmes crans ; si le contenu grandit franchement ensuite, marges normales et vrai défilement */
  const first=d.tab==="ov"||d.tab==="di",ex=el.scrollHeight-Math.max(0,pb-12)-Math.round(innerHeight*1.5);
  if(el._f15){if(on&&ex>=160){cl.remove(...T4);el._f15=0;el._fno=1}else if(ex>0&&on<4)cl.add(T4[on]);return}
  if(on&&(o>=200||(on===4&&o>=40))){cl.remove(...T4);el._fno=1;return}   // trop de contenu pour tenir (données arrivées, direct) : vrai défilement, marges normales
  if(!el._fno&&o>0&&o<120&&on<4){cl.add(T4[on]);return}
  if(first&&!on&&o>=120&&ex>0&&ex<110){el._f15=1;cl.add(T4[0])}}

/* ===================== 2. avant le match : Aperçu ===================== */
function matRobotBlk(m,past){const F=fiabW26();let f,c,lab="Le robot",tg="";
  if(m.winner){const r=robotPast(m);if(!r)return"";f={p1:r.fav===m.t1?r.p:1-r.p};c="avant le match";lab="Le robot avait dit";tg=` <span class="tag ${r.ok?"on":""}">${r.ok?"vu juste":"surprise"}</span>`}
  else{f=seriesFav(m);if(!f)return"";c=past&&matN(m)?`série, ${m.s1}-${m.s2} compris`:f.p<.56?"match très serré":m.bo>1?"sur la série":"sur la partie"}
  return `<div class="blk mat-robot" data-pk="robot"><div class="bh">${lab}${tg||(F?` <button class="tag mat-tgo" data-go="sim/rob" aria-label="Le robot aux Worlds : ${F.ok} bons favoris sur ${F.n}">${F.ok}/${F.n} aux Worlds ›</button>`:"")}<button class="i" data-info="robot" aria-label="Comment calcule le robot">i</button></div>
    <div class="bigvs"><div class="a"><span class="n ${f.p1>=.5?"lead":"trail"}">${P(f.p1)}</span><span class="t">${logo(m.t1,18)}${esc(tid(m.t1))}</span></div><div class="c">${c}</div><div class="b"><span class="n ${f.p1<.5?"lead":"trail"}">${P(1-f.p1)}</span><span class="t">${esc(tid(m.t2))}${logo(m.t2,18)}</span></div></div>
    <div style="margin-top:10px">${splitBar(f.p1,cA(m),cB(m))}</div></div>`}
function matPronoBlk(m){const me=picks[m.key];
  return `<div class="blk" data-pk="prono"><div class="bh">Ton prono<span class="mat-bhr">${me?"modifiable jusqu’au coup d’envoi":"avant "+fmtTime(new Date(m.start))}</span></div>
    <div class="pk2">${[m.t1,m.t2].map(t=>`<button class="pkb" data-pick="${esc(t)}" data-mk="${esc(m.key)}" aria-pressed="${me===t}">${logo(t,26)}${esc(tid(t))}</button>`).join("")}</div>${matLea("score",m)}</div>${matLea("bets",m)}`}
/* une clé = un grand chiffre et une ligne ; la phrase complète et son taux réel au toucher (keyLine de v13.5) */
function matKey1(k,row){const t=k[0],A=row[1],B=row[2];
  if(t==="poste"){const [,r,ka,kb,dd,pts]=k,aw=dd>0,w=aw?ka:kb,l=aw?kb:ka;return {n:"+"+fx1(Math.abs(pts)),u:"pts",h:`<b>${pnm(w)}</b> mieux noté que ${pnm(l)}`,s:`${ROLES[r]} · chances pour ${tnm(aw?A:B)}`,w:3+Math.abs(pts)}}
  if(t==="cote")return {n:"Bleu",u:"côté",h:`<b>${tnm(k[1])}</b> joue côté bleu`,s:"environ +4 pts de chances",w:2};
  if(t==="regle")return {n:"3/3",u:"règle",h:`Règle de Thomas : <b>${tnm(k[1])}</b>`,s:"top, jungle et mid devant à 15 min",w:1.5};
  if(t==="duel"){const [,r,ka,kb,n,ha,hb,gd]=k,aw=ha>=hb;return {n:`${aw?ha:hb}/${n}`,u:"duels",h:`<b>${pnm(aw?ka:kb)}</b> devant ${pnm(aw?kb:ka)} à 15 min`,s:`${ROLES[r]} · ${sgd(Math.abs(gd))} d’or en moyenne`,w:1}}
  if(t==="h2h"){const [,c,sw,sl,gw,gl]=k;return {n:`${sw}-${sl}`,u:"séries",h:gw===gl?"Face-à-face à égalité":`<b>${tnm(c)}</b> devant en face-à-face`,s:`${gw} manches à ${gl} · dernière le ${dfr(k[6])}`,w:1.2}}
  if(t==="forme"){const [,c,w,,wo]=k;return {n:`${w}/10`,u:"forme",h:`<b>${tnm(c)}</b> en forme`,s:`${w} séries gagnées sur 10, ${tnm(c===A?B:A)} ${wo}`,w:.8}}
  return null}
/* la phrase « pourquoi » (whyLine) cite déjà le meilleur poste du favori : on ne le répète pas ; pèse, puis à surveiller, puis pour info */
function matKeys(row){const K=row[7]||[],fv=K.find(k=>k[0]==="fav"),why=whyLine(row),best=why&&fv&&K.find(k=>k[0]==="poste"&&((k[4]>0)===(fv[1]===row[1])));
  const out=[];K.forEach((k,i)=>{if(k===best)return;const x=matKey1(k,row);if(!x)return;const kl=safe(keyLine,k,row);x.tag=kl&&kl.tag||"";x.i=i;out.push(x)});
  const rk=x=>x.tag==="on"?0:x.tag==="w"?1:2;out.sort((a,b)=>rk(a)-rk(b)||b.w-a.w);return {why,keys:out,n:why?2:3}}
const MAT_TAG={on:["on","pèse"],w:["mat-tw","à surveiller"],"":["","pour info"]};
const matKeyBtn=(m,x)=>{const t=MAT_TAG[x.tag]||MAT_TAG[""];return `<button class="key" data-info="key:${esc(m.id)}:${x.i}"><span class="kn">${x.n}${x.u?`<small>${x.u}</small>`:""}</span><span class="kt">${x.h} <span class="tag ${t[0]}">${t[1]}</span>${x.s?`<small>${x.s}</small>`:""}</span><span class="chev">›</span></button>`};
function matKeysBlk(m,compact){const row=SJ&&SJ.pm?safe(pmRow,m):null;if(!row||!Array.isArray(row[7])||!row[7].length)return"";
  const {why,keys,n}=matKeys(row);if(!why&&!keys.length)return"";
  const hd=`<div class="bh">Les clés du match<button class="i" data-info="cles:${esc(m.id)}" aria-label="Comment lire les clés">i</button></div>${why?`<p class="mat-why">${why}</p>`:""}`;
  if(compact)return `<div class="blk" data-pk="keys">${hd}${matRow("Toutes les clés",`${plur(keys.length+(why?1:0),"clé")}, chacune avec son taux réel`,`keys:${m.id}`)}</div>`;
  return `<div class="blk" data-pk="keys">${hd}<div class="keys">${keys.slice(0,n).map(x=>matKeyBtn(m,x)).join("")}</div>${keys.length>n?`<button class="btn mt0 mat-more" data-info="keys:${esc(m.id)}">${keys.length-n===1?"Une autre clé":plur(keys.length-n,"autre clé","autres clés")}</button>`:""}</div>`}
function matTabOverview(m){let h=matRobotBlk(m)+matPronoBlk(m)+matKeysBlk(m);
  if(!seriesFav(m))h=`<p class="empty" data-pk="none">Le robot n’a pas encore publié ce match.</p>`+h;
  return h+matWatch()}

/* ===================== 3. avant le match : Joueurs (un duel par poste) ===================== */
function matRolesData(m){const k="amr_"+m.t1+"_"+m.t2;let D=matAk(k,()=>amRolesData(m),3);
  if(D&&D.nocache&&(FJ||DJ)){delete AK[k];D=matAk(k,()=>amRolesData(m),3)}return D}
function matRoleRow(m,x,i,burned,compact,nav="data-go"){const a=pkey(x.a),b=pkey(x.b);if(!a||!b)return"";
  const B=amBetter(a,b),lead=B&&B.p>=.6?B.w:null,P=x.pair;
  const side=(p,F,pk,rev)=>{const ic=(pk||[]).filter(z=>!burned.has(ckey(z[0]))).slice(0,3);
    const fo=F?`KDA ${fx1(F[0])}${F[2]?`<i class="mat-tr ${F[2]==="hausse"?"up":"dn"}" title="en ${F[2]}">${F[2]==="hausse"?"↗":"↘"}</i>`:""}`:"";
    return `<span class="mat-rp${rev?" r":""}">${photo(p,"ava",36)}<span class="mat-rn"><b class="${lead===p?"lead":""}">${esc(p.id)}</b><small>${rankChip(p)}${fo?" "+fo:""}</small>${!compact&&ic.length?`<span class="mat-pk">${ic.map(z=>champ(z[0],20)).join("")}</span>`:""}</span></span>`};
  let mid=`<i class="mat-ro">${ROLE_S[x.r]}</i>`;
  if(P&&P.g){const wa=P.w,wb=P.g-P.w,s5=x.s5||[];
    mid+=`<b class="mat-sc"><em class="${wa>wb?"lead":""}">${wa}</em>–<em class="${wb>wa?"lead":""}">${wb}</em></b>`;
    if(s5.length)mid+=`<span class="mat-pips" data-pp="${esc(a.key+b.key)}">${s5.map(v=>`<i class="${v==null||v===0?"pn":v>0?"pw":"pl"}">${v==null?"·":v===0?"=":v>0?"+":"−"}</i>`).join("")}</span>`;
    if(x.n5>=2&&!compact)mid+=`<small>${amSg(x.gd5)} à 15′</small>`}
  else mid+=`<small>jamais croisés</small>`;
  const ld=SJ&&SJ.lane?amFn(laneDuel,a.key,b.key,x.r,false):null;
  if(ld&&!compact){const q=Math.max(ld.p,1-ld.p);mid+=`<small>${q<.55?"lane équilibrée":`lane ${esc((ld.p>=.5?a:b).id)} ${Math.round(q*100)}${NB}%`}</small>`}
  return `<button class="role mat-role${compact?" c":""}" data-pk="r${i}" ${nav}="d/${esc(a.key)}~${esc(b.key)}" style="--c1:${cA(m)};--c2:${cB(m)}" aria-label="Duel ${esc(ROLES[x.r])} : ${esc(a.id)} contre ${esc(b.id)}">${side(a,x.fa,x.pa,false)}<span class="c">${mid}</span>${side(b,x.fb,x.pb,true)}</button>`}
function matRolesList(m,compact,nav){const D=matRolesData(m),k="amr_"+m.t1+"_"+m.t2;
  if(D===undefined)return skel(compact?60:86,5);if(D===null)return matErr(k);
  const burned=amBurned(m),rows=(D.rows||[]).map((x,i)=>matRoleRow(m,x,i,burned,compact,nav)).filter(Boolean);
  return rows.length?`<div class="list mat-roles">${rows.join("")}</div>${!D.fj&&!compact?`<p class="note">Le détail des rencontres arrive dès que le robot a publié ses fiches.</p>`:""}`:`<p class="empty">Compositions pas encore connues.</p>`}
function matTabRoles(m){return `<div class="bh mat-th" data-pk="h">Duel par poste<span class="mat-bhr">touche un poste</span><button class="i" data-info="roles" aria-label="Lire les duels par poste">i</button></div><div data-pk="l">${matRolesList(m,false)}</div>`}

/* ===================== 4. avant le match : Draft (fearless, bans attendus, picks probables) ===================== */
const matDraftData=(m,n)=>matAk("dj_"+m.key+"_"+n,()=>draftMatchData(m),1);
function matDraftSrc(D){return `Bans relevés sur gol.gg (${plur(D.n||0,"partie")} des Worlds${D.tn&&D.tn.length?`, pages ${D.tn.map(esc).join(" et ")}`:""}), picks et matchups lus dans l’API LoL Esports.`}
function matPvpHTML(x){if(!x.cells||!x.cells.length)return `<p>Pas assez de données sur ces joueurs.</p>`;
  return `<p>${esc(x.txt)}</p><div class="mat-grid" style="grid-template-columns:40px repeat(${x.B.length},minmax(0,1fr))"><span class="hd"></span>${x.B.map(y=>`<span class="hd">${champ(y.c,28)}</span>`).join("")}${x.A.map((y,i)=>`<span class="hd">${champ(y.c,28)}</span>`+(x.cells[i]||[]).map(c=>`<span class="${c[0][0]==="+"?"up":c[0][0]==="−"?"dn":""}">${esc(c[0])}${c[1]?`<small>${c[1]} p.</small>`:""}</span>`).join("")).join("")}</div>
    <p class="mat-mu">Lignes : ${esc(x.a)}, colonnes : ${esc(x.b)}. « + » : avance d’or à 15 min pour le champion de ${esc(x.a)}, « − » pour celui de ${esc(x.b)}, « ≈ » pas d’écart net, « – » moins de 3 parties pro face à face depuis 2025.</p>`}
function matBansRow(vs,L,key){return L&&L.length?`<div class="banr"><span class="who"><small>contre</small>${logo(vs,18)}${esc(tid(vs))}</span><span class="bans">${L.map(x=>`<button data-info="${matSheet("ban|"+key+"|"+vs+"|"+x.c,x.c,()=>`<p>${esc(x.why)}.</p><p class="mat-mu">Ban attendu contre ${esc(T[vs]?T[vs].name:vs)} : ce champion lui serait retiré.</p>`)}" aria-label="${esc(x.c)}">${champ(x.c,34)}</button>`).join("")}</span></div>`:""}
function matPickRows(m,D,key){const ic=L=>(L||[]).map(y=>`<span class="chc">${champ(y.c,30)}<span>${esc(y.txt)}</span></span>`).join("");
  return (D.lanes||[]).map(x=>`<button class="drr" data-info="${matSheet("pvp|"+key+"|"+x.r,`${x.a||"?"} – ${x.b||"?"}`,()=>matPvpHTML(x))}"><span class="s">${ic(x.A)}</span><span class="rl">${ROLE_S[x.r]}</span><span class="s r">${ic(x.B)}</span></button>`).join("")}
function matDraftHTML(m,D,key,title){const src=matDraftSrc(D);let h="";
  if(D.burned&&D.burned.length)h+=`<div class="blk" data-pk="fl"><div class="bh">Fearless<span class="mat-bhr">${plur(D.burned.length,"champion déjà joué","champions déjà joués")}</span></div><p class="mat-sub">Plus jouables dans la série : retirés des bans et des picks probables.</p><div class="mat-chs">${D.burned.map(c=>champ(c,30)).join("")}</div></div>`;
  const ib=matSheet("bansi|"+key,"Bans attendus",()=>`<p>${esc(D.fi&&D.fi.b||"")}</p><p>Calcul : bans déjà vus à ces Worlds (lissés par la méta des ligues sur les 45 jours d’avant), part de chaque champion dans les parties des 5 joueurs visés sur 90 jours, bans que l’équipe a déjà subis et habitudes de l’équipe qui bannit, champions déjà joués dans la série retirés. Ce sont les bans que l’on s’attend à voir.</p>${D.cb||""}<p class="mat-mu">${esc(src)}</p>`);
  const ip=matSheet("picksi|"+key,"Picks probables",()=>`<p>${esc(D.fi&&D.fi.p||"")}</p><p>« 6/42 » : joué 6 fois sur ses 42 parties des 90 derniers jours ; « – » : pas joué sur cette période (champion fort de la méta à son poste). Touche un poste pour croiser les picks probables des deux joueurs : écart d’or à 15 min entre ces champions face à face.</p>${D.mu||""}<p class="mat-mu">${esc(src)}</p>`);
  h+=`<div class="blk" data-pk="bans"><div class="bh">${title?esc(title)+" · ":""}Bans attendus<button class="i" data-info="${ib}" aria-label="Fiabilité et calcul des bans">i</button></div>${matBansRow(m.t1,D.b1,key)}${matBansRow(m.t2,D.b2,key)}</div>`;
  h+=`<div class="blk" data-pk="picks"><div class="bh">Picks probables<span class="mat-bhr">touche un poste</span><button class="i" data-info="${ip}" aria-label="Fiabilité des picks">i</button></div><div class="vhd"><span>${logo(m.t1,18)}${esc(tid(m.t1))}</span><span>${esc(tid(m.t2))}${logo(m.t2,18)}</span></div>${matPickRows(m,D,key)}</div>`;
  return h}
function matTabDraftSoon(m){const n=matN(m),k="dj_"+m.key+"_"+n,D=matDraftData(m,n);if(D===undefined)return skel(120,2);if(D===null)return matErr(k);return matDraftHTML(m,D,k)}

/* ===================== 5. avant le match : Équipes (face-à-face, forme, saison, côté, déjà croisés) ===================== */
function matH2H(a,b){if(!SJ||!SJ.h2h)return null;const [x,y]=[a,b].sort(),H=SJ.h2h[x+"|"+y];if(!H)return {aw:0,bw:0,list:[],since:null,intl:{aw:0,bw:0}};
  return x===a?H:{aw:H.bw,bw:H.aw,since:H.since,intl:{aw:(H.intl||{}).bw||0,bw:(H.intl||{}).aw||0},list:(H.list||[]).map(z=>({...z,as:z.bs,bs:z.as,aWon:!z.aWon}))}}
const matFS=v=>typeof fmtShort==="function"?fmtShort(v):String(v).slice(0,10);
const matTN=v=>typeof tourName==="function"?tourName(v):String(v||"");
const matFM=v=>typeof fmtMonth==="function"?fmtMonth(v):String(v).slice(0,7);
function matVl(m,lab,va,vb,fmt,share,hi=true){if(va==null||vb==null)return"";const p=share!=null?share:(Math.abs(va)+Math.abs(vb)?Math.abs(va)/(Math.abs(va)+Math.abs(vb)):.5),best=va===vb?0:((va>vb)===hi?1:2);
  return `<div class="vl"><b class="${best===1?"lead":""}">${fmt(va)}</b><span>${lab}</span><b class="${best===2?"lead":""}">${fmt(vb)}</b><span class="vb"><i style="width:calc(${(p*100).toFixed(1)}% - 1px);background:${cA(m)}"></i><i style="background:${cB(m)}"></i></span></div>`}
function matTeamsHTML(m,inSheet){const a=m.t1,b=m.t2,H=matH2H(a,b),tm=SJ&&SJ.teams;let h="";
  h+=`<div class="blk" data-pk="h2h"><div class="bh">Face-à-face<span class="mat-bhr">${H&&H.since?"depuis "+esc(matFM(H.since)):"depuis 2024"}</span></div>`;
  if(!H||!(H.aw+H.bw))h+=`<p class="mat-sub" style="margin:0">Jamais affrontées en match officiel depuis ${esc(String(SJ&&SJ.since||"2024").slice(0,4))}.</p>`;
  else h+=`<div class="bigvs"><div class="a"><span class="n ${H.aw>H.bw?"lead":"trail"}">${H.aw}</span><span class="t">${logo(a,18)}${esc(tid(a))}</span></div><div class="c">séries<br>gagnées</div><div class="b"><span class="n ${H.bw>H.aw?"lead":"trail"}">${H.bw}</span><span class="t">${esc(tid(b))}${logo(b,18)}</span></div></div>
    <div style="margin-top:8px">${splitBar(H.aw/(H.aw+H.bw),cA(m),cB(m))}</div>${H.intl&&(H.intl.aw+H.intl.bw)?`<p class="mat-sub">En compétition internationale : ${esc(tid(a))} ${H.intl.aw}, ${esc(tid(b))} ${H.intl.bw}.</p>`:""}
    <div class="mat-h2h">${(H.list||[]).map(x=>`<div><span>${esc(matFS(x.dt))}</span><span class="tn">${esc(matTN(x.op))}</span><b><em class="${x.aWon?"lead":""}">${x.as}</em>-<em class="${x.aWon?"":"lead"}">${x.bs}</em></b>${logo(x.aWon?a:b,18)}</div>`).join("")}</div>`;
  h+=`</div>`;
  const form=t=>{const S=tm&&tm[t];if(!S||!S.last||!S.last.length)return"";const L=S.last.slice(0,5),w=L.filter(z=>z.won).length;
    return `<div class="mat-form"><span class="tm">${logo(t,22)}<b>${esc(tid(t))}</b><small>${w}V-${L.length-w}D</small></span><span class="fo">${L.map(z=>`<span class="${z.won?"fw":"fl"}" title="${esc((z.oid&&T[z.oid]?T[z.oid].name:z.opp)+", "+matTN(z.op))}">${z.oid&&T[z.oid]?logo(z.oid,16):`<em>${esc(String(z.opp).slice(0,3))}</em>`}${z.s}-${z.o}</span>`).join("")}</span></div>`};
  const fa=form(a),fb=form(b);if(fa||fb)h+=`<div class="blk" data-pk="form"><div class="bh">Forme du moment<span class="mat-bhr">5 dernières séries</span></div>${fa}${fb}</div>`;
  h+=matTeamStats(m,inSheet);
  if(!inSheet){const prev=MATCHES.filter(x=>x.id!==m.id&&x.winner&&((x.t1===a&&x.t2===b)||(x.t1===b&&x.t2===a)));
    if(prev.length)h+=`<div data-pk="prev"><div class="bh mat-th" style="margin-top:16px">Déjà croisés à ces Worlds</div><div class="list">${prev.map(mrow).join("")}</div></div>`}
  return h}
const matTabTeams=m=>matTeamsHTML(m,false);
/* les deux équipes, une ligne par stat (couleurs du match, repli or/sarcelle) ; côté, titres ; saison 2026 complète au toucher */
function matTeamStats(m,inSheet){const a=m.t1,b=m.t2,S=SJ&&SJ.sim,M=SJ&&SJ.m,fl=SJ&&SJ.fl&&SJ.fl.t,tm=SJ&&SJ.teams,rows=[],pc=v=>Math.round(v*100)+NB+"%";
  const add=(...x)=>rows.push(matVl(m,...x));const src=Object.assign({},M&&M.t,S&&S.S);
  if(src[a]!=null&&src[b]!=null)add("Force (5 joueurs)",src[a],src[b],v=>fx2(v),.5+Math.max(-.5,Math.min(.5,(src[a]-src[b])/4)));
  if(S&&S.eq&&S.eq[a]&&S.eq[b])add("Chances de titre",S.eq[a][10],S.eq[b][10],v=>rkPct(v)+NB+"%");
  const form=t=>{const L=tm&&tm[t]&&tm[t].last;if(!L)return null;const x=L.slice(0,10);return x.filter(z=>z.won).length};
  const fa=form(a),fb=form(b);if(fa!=null&&fb!=null)add("Forme (10 séries)",fa,fb,v=>v+"/10");
  const A=fl&&fl[a],B=fl&&fl[b],pcx=(x,i)=>x&&x[0]?x[i]/x[0]:null;
  const ga=tm&&tm[a]&&tm[a].g?tm[a]:null,gb=tm&&tm[b]&&tm[b].g?tm[b]:null;
  if(ga&&gb){add("Victoires (parties 2026)",ga.gw/ga.g,gb.gw/gb.g,pc);add("Kills par partie",ga.k,gb.k,fx1)}
  const ta=teamPlayers(a).reduce((s,p)=>s+p.titles.length,0),tb=teamPlayers(b).reduce((s,p)=>s+p.titles.length,0);if(ta||tb)add("Titres mondiaux (titulaires)",ta,tb,v=>v);
  /* niveau 2 (feuille) : début de partie, côtés, saison 2026 complète */
  const more=[];const addM=(...x)=>more.push(matVl(m,...x));
  if(A&&B){addM("1er sang",pcx(A,2),pcx(B,2),pc);addM("1re tour",pcx(A,4),pcx(B,4),pc);addM("1er dragon",pcx(A,6),pcx(B,6),pc)}
  if(ga&&gb){if(ga.bn&&gb.bn)addM("Côté bleu (2026)",ga.bw/ga.bn,gb.bw/gb.bn,pc);if(ga.rn&&gb.rn)addM("Côté rouge (2026)",ga.rw/ga.rn,gb.rw/gb.rn,pc)}
  const R=SJ&&SJ.pm&&SJ.pm.ref&&SJ.pm.ref.cote,same=T[a].league===T[b].league;
  const side=m.bo===1?`<b>${esc(tid(a))}</b> joue côté bleu : en Bo1, la première équipe annoncée prend le bleu.`:"En série, le côté peut changer à chaque partie.";
  const tape=ga&&gb?matRow("Saison 2026 comparée",`Début de partie, côtés, ${same?`même ligue (${esc(T[a].league)}) : chiffres comparables`:`${esc(T[a].league)} contre ${esc(T[b].league)} : chiffres bruts`}`,matSheet("tape|"+a+"|"+b,"Saison 2026 comparée",()=>(more.length?`<div class="vhd"><span>${logo(a,20)}${esc(tid(a))}</span><span>${esc(tid(b))}${logo(b,20)}</span></div>${more.join("")}<p class="mat-mu">Début de partie : saison 2026 au flux complet. ${m.bo===1?`En Bo1, ${esc(tid(a))} joue côté bleu.`:"En série, le côté peut changer à chaque partie."}</p><h4 class="mat-h4">Toute la saison</h4>`:"")+matTapeHTML(m,ga,gb,same))):"";
  return `<div class="blk" data-pk="stats"><div class="bh">Les deux équipes<button class="i" data-info="${matSheet("tsi|"+a+"|"+b,"Sources",()=>`<p>Force : somme des notes d’impact des 5 titulaires. Titre : simulation du robot. Forme : 10 dernières séries toutes compétitions. Victoires et kills : parties 2026. Titres : titres mondiaux cumulés des 5 titulaires. Dans « Saison 2026 comparée » : début de partie (1er sang, 1re tour, 1er dragon, saison 2026 au flux complet), côtés bleu et rouge, et toute la saison.</p>${R&&R.tout?`<p>En 2026, le côté bleu gagne ${pc0(R.tout[1]/R.tout[0])} des parties (${nf(R.tout[0])})${R.intl?`, ${pc0(R.intl[1]/R.intl[0])} aux internationales (${nf(R.intl[0])})`:""} ; le robot lui compte environ 4 points.</p>`:""}`)}" aria-label="Sources et périodes">i</button></div>
    <div class="vhd"><span>${logo(a,20)}${esc(tid(a))}</span><span>${esc(tid(b))}${logo(b,20)}</span></div>${rows.join("")||`<p class="empty">Pas encore de stats.</p>`}<p class="mat-sub">${side}</p>${inSheet?"":tape}</div>`}
function matTapeHTML(m,A,B,same){const dur=v=>Math.floor(v)+":"+String(Math.round(v%1*60)).padStart(2,"0"),pc=(x,y)=>y?Math.round(x/y*100)+NB+"%":"–",pv=(x,y)=>y?x/y:0;
  const r=(l,a,b,f,hi=true)=>matVl(m,l,a,b,f,null,hi);
  return `<div class="vhd"><span>${logo(m.t1,20)}${esc(tid(m.t1))}</span><span>${esc(tid(m.t2))}${logo(m.t2,20)}</span></div>
    ${matVl(m,"Séries gagnées",pv(A.sw,A.sw+A.sl),pv(B.sw,B.sw+B.sl),v=>Math.round(v*100)+NB+"%")}${matVl(m,"Parties gagnées",pv(A.gw,A.g),pv(B.gw,B.g),v=>Math.round(v*100)+NB+"%")}
    ${matVl(m,"Côté bleu",pv(A.bw,A.bn),pv(B.bw,B.bn),v=>Math.round(v*100)+NB+"%")}${matVl(m,"Côté rouge",pv(A.rw,A.rn),pv(B.rw,B.rn),v=>Math.round(v*100)+NB+"%")}
    ${r("Kills par partie",A.k,B.k,fx1)}${r("Morts par partie",A.d,B.d,fx1,false)}${r("Dragons",A.dr,B.dr,fx1)}${r("Barons",A.ba,B.ba,fx2)}${r("Tours",A.to,B.to,fx1)}
    ${matVl(m,"Écart d’or final",A.gd,B.gd,v=>(v>0?"+":v<0?"−":"")+fx1(Math.abs(v)/1000)+NB+"k",.5+Math.max(-.5,Math.min(.5,(A.gd-B.gd)/8000)))}${r("Durée moyenne",A.gl,B.gl,dur,false)}
    <p class="mat-mu">Saison 2026 : ${A.sw}-${A.sl} en séries pour ${esc(tid(m.t1))} (${pc(A.sw,A.sw+A.sl)}), ${B.sw}-${B.sl} pour ${esc(tid(m.t2))}. Le chiffre en clair est le meilleur des deux.${same?"":" Ligues différentes : chiffres bruts, faits contre des adversaires différents."}</p>`}

/* ===================== 6. direct : moteur ===================== */
async function liveTick(m){
  const L=LV.games[m.key]||(LV.games[m.key]={samples:[]}),mid=matMid(m);if(!L.samples)L.samples=[];
  if(!mid){L.status="nolive";return}
  if(!L.games||Date.now()-L.gt>45000){try{const j=await leFetch("getEventDetails?hl=fr-FR&id="+mid),ev=j&&j.data&&j.data.event;
    if(ev){L.teams=(ev.match.teams||[]).map(t=>({id:t.id,our:resolveTeam(t.code,t.name),w:t.result&&t.result.gameWins}));L.games=ev.match.games||[];L.gt=Date.now()}}catch(e){L.apiErr=String(e&&e.message||e)}}
  let gid=null,num=null,g=null;
  if(L.games){g=L.games.find(x=>x.state==="inProgress");
    if(!g){L.status=L.games.some(x=>x.state==="completed")?"between":"waiting";return}
    gid=g.id;num=g.number}
  else{// API injoignable : l'id de la partie suit celui du match (+1 par manche), on le lit dans le flux
    const n=matN(m)+1;try{gid=(BigInt(mid)+BigInt(n)).toString();num=n}catch(e){L.status="nolive";return}}
  if(L.gid!==gid)Object.assign(L,{gid,num,first:null,samples:[],meta:null,frame:null,kf:null,draftP:null,amd:null,l2:null,l2d:null,blue:null,red:null});
  if(g&&L.teams){const bt=(g.teams||[]).find(t=>t.side==="blue"),rt=(g.teams||[]).find(t=>t.side==="red"),ob=bt&&(L.teams.find(t=>t.id===bt.id)||{}).our,or=rt&&(L.teams.find(t=>t.id===rt.id)||{}).our;
    if(ob){L.blue=ob;L.red=or||(ob===m.t1?m.t2:m.t1)}}
  if(!L.first){let w=null;try{w=await feedWin(gid)}catch(e){w=null}
    if(w&&w.frames&&w.frames.length){L.first=Date.parse(w.frames[0].rfc460Timestamp);L.meta=w.gameMetadata;w.frames.forEach(f=>pushSample(L,f));kfFeed(L,w.frames,null)}
    else if(!L.games){L.status="waiting";return}}
  if(L.meta&&!L.blue){const tm=sd=>{const pm=(L.meta[sd+"TeamMetadata"]||{}).participantMetadata||[];for(const x of pm){const p=playerFromSummoner(x.summonerName,null);if(p)return p.team}return null};
    L.blue=tm("blue")||m.t1;L.red=L.blue===m.t1?m.t2:m.t1}
  // le flux refuse (400) une fenêtre finissant il y a moins de 20 s : si l'horloge du téléphone avance, on recule
  let w=null,ws=0,err=null;for(const back of [50000,90000,180000]){ws=Date.now()-back;try{w=await feedWin(gid,ws);err=null}catch(e){w=null;err=e}if(w&&w.frames&&w.frames.length)break}
  if(w&&w.frames&&w.frames.length){L.meta=L.meta||w.gameMetadata;L.frame=w.frames[w.frames.length-1];pushSample(L,L.frame);L.status=L.frame.gameState==="finished"?"ended":"live";kfFeed(L,w.frames,ws);
    const id=m.id;kfFill(L,gid,()=>paintLive(mOf(id)||m))}
  else{// 404 avant la première image : la partie n'est pas encore lancée (draft), comme en v13.5 ; autre erreur : on la montre
    if(err&&!L.frame&&String(err&&err.message||err)!=="404")throw err;L.status=L.frame?"live":"starting"}
  if(L.meta&&!L.draftP){const id=m.id;L.draftP=amLiveDraftData(L).then(d=>{L.amd=d||{err:1};paintLive(mOf(id)||m)}).catch(e=>{console.warn(e);L.amd={err:1};paintLive(mOf(id)||m)})}
}
/* avant une partie (draft, pause entre deux parties) : la fiche du direct s'ouvre sur l'onglet Draft (draft probable, fearless),
   et revient sur Direct au lancement de la partie si c'est elle qui y était passée */
const matPre=st=>st==="between"||st==="starting"||st==="waiting";
/* une seule partie suivie ; à chaque passage le match est relu (la synchro remplace les objets de MATCHES) ; arrêt quand il est fini */
function watchLive(m){if(!m||LV.watch===m.id)return;clearTimeout(LV.timer);LV.watch=m.id;const id=m.id;
  const run=async()=>{if(LV.watch!==id)return;const x=mOf(id)||m;if(x.state!=="live"&&x.state!=="wait"){LV.watch=null;return}
    try{await liveTick(x);LV.err=null}catch(e){LV.err=String(e&&e.message||e)}
    paintLive(mOf(id)||x);if(LV.watch===id)LV.timer=setTimeout(run,document.hidden?30000:10000)};
  run()}
/* repeint les écrans de ce match (tête et onglet visible, par blocs), la feuille ouverte si elle suit le direct, puis BUS "live" */
function paintLive(m){if(!m)return;
  NAV.forEach(x=>{if(x.d.v!=="m"||x.d.id!==m.id||!x.el.isConnected||x.d._k!=="live")return;const el=x.el,o=el._o;if(!o)return;
    const L=LV.games[m.key],st=L&&L.status;
    if(matPre(st)&&!matPre(el._lst)&&!x.d._t0&&x.d.tab==="di"&&!matOver(m,L)&&o.tabs&&o.tabs.some(t=>t[0]==="dr")){setTab(el,"dr");el._adr=1}
    else if(st==="live"&&el._adr&&x.d.tab==="dr"){setTab(el,"di");el._adr=0}el._lst=st;
    const hs=el.querySelector(".headslot");if(hs)matPatchHud(hs,hudHTML(m));
    const c=el.querySelector(".tabc");if(c&&o.render){matPatch(c,safe(o.render,x.d.tab)||"");tickCd(c)}
    matBar(el)});
  matSheetRefresh();BUS.emit("live",m)}
/* tête du direct : seules les parties qui changent sont remplacées ; la barre des chances glisse, les kills « claquent » */
function matPatchHud(hs,html){if(hs._h===html)return;const old=hs.firstElementChild,t=document.createElement("template");t.innerHTML=html;const nw=t.content.firstElementChild;
  if(!old||!nw||old.className!==nw.className||old.dataset.hk!==nw.dataset.hk||old.children.length!==nw.children.length){hs._h=html;hs.innerHTML=html;return}
  old.setAttribute("style",nw.getAttribute("style")||"");
  [...nw.children].forEach((c,i)=>{const o=old.children[i],src=c.outerHTML;if(o._src===src)return;
    if(c.dataset.h==="w"&&o.dataset.h==="w"){const a=c.querySelectorAll("i"),b=o.querySelectorAll("i");if(a.length===b.length){a.forEach((z,j)=>{b[j].setAttribute("style",z.getAttribute("style")||"")});o._src=src;return}}
    const k0=c.dataset.h==="s"&&o.querySelector(".hudk")?o.querySelector(".hudk").textContent:null;
    o.replaceWith(c);c._src=src;
    if(k0!=null&&!RM){const k1=c.querySelector(".hudk");if(k1&&k1.textContent!==k0&&k1.animate)k1.animate([{transform:"scale(1.22)",color:"#fff"},{transform:"none"}],{duration:420,easing:"cubic-bezier(.3,1.35,.5,1)"})}});
  hs._h=html}
/* mini-HUD : le titre de la barre devient le score quand le HUD sort de l'écran ; le toucher ramène au HUD */
function matBar(el){const d=el._d;if(!d||d.v!=="m"||d._k!=="live")return;const m=mOf(d.id),bt=el.querySelector(".bar .bt"),hud=el.querySelector(".headslot .hud");if(!m||!bt)return;
  const L=LV.games[m.key],on=!!(hud&&matOn(L)&&el.scrollTop>hud.offsetTop+hud.offsetHeight-64);
  if(on){const S=sideFrame(L,m),p=liveP(L,m),gd=S.A.totalGold-S.B.totalGold,h=`<span class="mh">${logo(m.t1,18)}${S.A.totalKills}–${S.B.totalKills}${logo(m.t2,18)}</span><small>${gtime(L)} · ${Math.abs(gd)<100?"or =":esc(tid(gd>=0?m.t1:m.t2))+" +"+kf1(gd)} · ${esc(tid(p>=.5?m.t1:m.t2))} ${P(Math.max(p,1-p))}</small>`;
    if(bt._mh!==h){bt._mh=h;bt.innerHTML=h}if(!bt.classList.contains("mat-mini")){bt.classList.add("mat-mini");bt.setAttribute("role","button");bt.setAttribute("aria-label","Revenir au direct")}}
  else if(bt.classList.contains("mat-mini")){bt.classList.remove("mat-mini");bt._mh=null;bt.removeAttribute("role");bt.removeAttribute("aria-label");const o=el._o;if(o){bt._h=o.title;bt.innerHTML=o.title}}}

/* ===================== 7. direct : HUD ===================== */
function matSeries(m,L){const w=t=>{const x=L&&L.teams&&L.teams.find(z=>z.our===t);return x&&x.w!=null?x.w:null};const a=w(m.t1),b=w(m.t2);return [a!=null?Math.max(a,m.s1||0):(m.s1||0),b!=null?Math.max(b,m.s2||0):(m.s2||0)]}
const matDecided=(m,L)=>{const s=matSeries(m,L),need=(m.bo>>1)+1;return Math.max(s[0],s[1])>=need};
/* série finie : vainqueur connu par le score, ou toutes les parties terminées (ou inutiles) selon l'API */
const matOver=(m,L)=>matDecided(m,L)||!!(L&&L.games&&L.games.length&&L.games.every(g=>g.state==="completed"||g.state==="unneeded"));
function matLiveMsg(m,L){const s=matSeries(m,L);
  if(m.state==="wait"&&(!L||!matOn(L))&&(!L||L.status==="nolive"||matOver(m,L)))return "Match terminé : résultat officiel en attente";
  if(!L)return "Connexion au direct…";
  if(L.status==="nolive")return "Flux en direct introuvable pour ce match";
  if(LV.err&&!L.frame&&LV.watch===m.id)return `Flux LoL Esports injoignable (${esc(LV.err.slice(0,60))}). Nouvel essai dans 10 s`;
  if(L.status==="between")return `Pause entre deux parties · série ${esc(tid(m.t1))} ${s[0]} - ${s[1]} ${esc(tid(m.t2))}`;
  if(L.status==="starting"&&!matN(m))return "Draft en cours : le direct démarre au lancement de la partie";
  if(L.status==="waiting"||L.status==="starting")return matN(m)?`Partie ${matN(m)+1} : draft en cours, le direct démarre au lancement`:"La partie n’a pas encore commencé : le direct démarre au lancement";
  return "Connexion au direct…"}
function hudHTML(m){
  const L=LV.games[m.key],c=`--c1:${cA(m)};--c2:${cB(m)}`,s=matSeries(m,L),wait=m.state==="wait"&&!matOn(L);
  const tm=(t,rev,sub)=>`<div class="hudtm${rev?" r":""}">${logo(t,34)}<span><b>${esc(tid(t))}</b><small>${sub}</small></span></div>`;
  if(!matOn(L)){const f=seriesFav(m);
    return `<div class="hud${wait?" done":""}" data-hk="w" style="${c}" id="hud"><div class="hudt" data-h="t"><span class="badge${wait?"":" live"}">${wait?"Résultat en attente":"En direct"}</span><span>${esc(stageLab(m))}</span></div>
      <div class="huds" data-h="s">${tm(m.t1,0,"")}<div class="hudc"><div class="hudk">${m.bo>1||s[0]+s[1]?`${s[0]}<i>–</i>${s[1]}`:`<i style="margin:0">VS</i>`}</div><div class="hudclk">${m.bo>1?"série":"Bo1"}</div></div>${tm(m.t2,1,"")}</div>
      <div class="hudg" data-h="g">${matLiveMsg(m,L)}</div>${f?`<div data-h="w">${splitBar(f.p1,cA(m),cB(m))}</div><div class="wpl" data-h="p"><b>${P(f.p1)}</b><span>prono du robot${m.bo>1&&s[0]+s[1]?", score compris":""}</span><b>${P(1-f.p1)}</b></div>`:""}</div>`}
  const S=sideFrame(L,m),p=liveP(L,m),gd=S.A.totalGold-S.B.totalGold,tr=trend(L,m);
  const obj=(t,o,rev)=>{const dr=(t.dragons||[]).filter(x=>x!=="elder"),so=kfSoul(t.dragons),free=so||kfSoul(o.dragons)?0:Math.max(0,4-dr.length),ed=(t.dragons||[]).filter(x=>x==="elder").length;
    const nm=(t.dragons||[]).map(x=>KF_DR[x]||x).join(", "),ti=`Dragons : ${(t.dragons||[]).length}${nm?" ("+nm+")":""}${so?", âme "+(KF_DR[so]||so):""}`;
    const dots=dr.map(x=>`<i class="dg" style="background:${DRAG[x]||"#888"}"></i>`).join("")+`<i class="dg e"></i>`.repeat(free)+`<i class="dg" style="background:${DRAG.elder}"></i>`.repeat(ed);
    const it=[`<span class="ob" title="Tours détruites" aria-label="Tours détruites : ${t.towers||0}">${ITOW}${t.towers||0}</span>`,`<span class="mat-dr" title="${esc(ti)}" aria-label="${esc(ti)}">${dots}${so?`<b class="soul" style="--c:${DRAG[so]}">âme</b>`:""}</span>`,`<span class="ob" title="Barons" aria-label="Barons : ${t.barons||0}">${IBAR}${t.barons||0}</span>`,`<span class="ob" title="Inhibiteurs détruits" aria-label="Inhibiteurs détruits : ${t.inhibitors||0}">${IINH}${t.inhibitors||0}</span>`];
    return `<span>${(rev?it.reverse():it).join("")}</span>`};
  const ended=L.status==="ended";
  return `<div class="hud${ended?" done":""}" data-hk="f" style="${c}" id="hud">
    <div class="hudt" data-h="t"><span class="badge live">Partie ${L.num||""}</span><span>${m.bo>1?`Série ${s[0]}-${s[1]} · `:""}${ended?"Partie terminée":"≈ 30 s de décalage"}</span></div>
    <div class="huds" data-h="s">${tm(m.t1,0,`${S.aBlue?"bleu":"rouge"} · ${kf1(S.A.totalGold)}`)}<div class="hudc"><div class="hudk">${S.A.totalKills}<i>–</i>${S.B.totalKills}</div><div class="hudclk">${gtime(L)}</div></div>${tm(m.t2,1,`${kf1(S.B.totalGold)} · ${S.aBlue?"rouge":"bleu"}`)}</div>
    <div class="hudg" data-h="g">${Math.abs(gd)<100?"<b>Or à égalité</b>":`<b>${esc(tid(gd>=0?m.t1:m.t2))} +${kf1(gd)}</b> d’or`}${tr?`${spark(tr,56,18,m)}<small>${tr.txt}</small>`:""}</div>
    <div data-h="w">${splitBar(p,cA(m),cB(m))}</div><div class="wpl" data-h="p"><b>${P(p)}</b><span>chances de victoire <button class="i mat-i20" data-info="wp" aria-label="Comment c’est estimé">i</button></span><b>${P(1-p)}</b></div>
    <div class="hudo" data-h="o">${obj(S.A,S.B,false)}${obj(S.B,S.A,true)}</div></div>`}
/* écart d'or vu de t1, à partir des images du flux (rattrapées depuis le début de la partie) */
function goldPts(L,m){const K=L.kf;if(!K||!K.fr)return [];const flip=L.blue===m.t2?-1:1,out=[];
  K.fr.forEach(x=>{if(!x.g||x.gd==null)return;const c=kfClock(L,x.t);if(c==null)return;const t=c/60;const l=out[out.length-1];if(!l||t-l.t>=.2)out.push({t,gd:x.gd*flip})});return out}
function trend(L,m){const S=goldPts(L,m);if(S.length<3)return null;const tN=S[S.length-1].t,pts=S.filter(s=>s.t>=tN-5);if(pts.length<3)return null;
  const span=tN-pts[0].t;if(span<1.5)return null;const gN=pts[pts.length-1].gd,d=(gN-pts[0].gd)*(gN>=0?1:-1);
  return {pts,span,txt:Math.abs(d)<300?`stable sur ${Math.round(span)} min`:`${d>0?"+":"−"}${kf1(d)} en ${Math.round(span)} min`}}
function spark(tr,w,h){const P2=tr.pts,t0=P2[0].t,dt=Math.max(.01,tr.span),mx=Math.max(800,...P2.map(s=>Math.abs(s.gd)));
  const X=t=>((t-t0)/dt*(w-3)+1).toFixed(1),Y=g=>(h/2-g/mx*(h/2-2)).toFixed(1);
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><line x1="0" y1="${h/2}" x2="${w}" y2="${h/2}" stroke="rgba(240,230,210,.25)" stroke-dasharray="2 2"/><polyline points="${P2.map(s=>X(s.t)+","+Y(s.gd)).join(" ")}" fill="none" stroke="#F0E6D2" stroke-width="1.5" stroke-linejoin="round"/></svg>`}
function goldCurve(pts,m,lab,H=90){if(!pts||pts.length<3)return"";const W2=320,last=pts[pts.length-1].t||1,mx=Math.max(1500,...pts.map(p=>Math.abs(p.gd)));
  const X=v=>(v/last*W2).toFixed(1),Y=v=>(H/2-v/mx*(H/2-4)).toFixed(1),pp=pts.map(p=>X(p.t)+","+Y(p.gd)),area=`M0,${H/2} L${pp.join(" L")} L${X(last)},${H/2} Z`,id="gc"+matHash(area+cA(m)+cB(m));
  const hi=Math.max(0,...pts.map(p=>p.gd)),lo=Math.min(0,...pts.map(p=>p.gd));
  return `<svg class="gc" style="height:${H}px" viewBox="0 0 ${W2} ${H}" preserveAspectRatio="none" role="img" aria-label="Écart d’or au fil de la partie"><defs><clipPath id="${id}a"><rect width="${W2}" height="${H/2}"/></clipPath><clipPath id="${id}b"><rect y="${H/2}" width="${W2}" height="${H/2}"/></clipPath></defs>
    <path d="${area}" fill="${cA(m)}" fill-opacity=".45" clip-path="url(#${id}a)"/><path d="${area}" fill="${cB(m)}" fill-opacity=".45" clip-path="url(#${id}b)"/>
    <line x1="0" x2="${W2}" y1="${H/2}" y2="${H/2}" stroke="rgba(240,230,210,.22)" stroke-dasharray="3 3"/><polyline points="${pp.join(" ")}" fill="none" stroke="#F0E6D2" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>
    <div class="gcl"><span>${esc(tid(m.t1))} ${hi<50?"jamais devant":"jusqu’à +"+kf1(hi)}</span>${lab?`<span style="color:var(--gold2)">${lab}</span>`:""}<span>${esc(tid(m.t2))} ${lo>-50?"jamais devant":"jusqu’à +"+kf1(-lo)}</span></div>`}

/* ===================== 8. direct : onglet Direct ===================== */
function evLine(L,e,short){
  const tn=s=>esc(tid(kfTm(L,s)));
  if(e.k==="kill"){const v=kfWho(L,e.v);if(e.a<0)return `${champ(v.c,22)}<b>${esc(v.n)}</b><small>exécuté</small>`;const k=kfWho(L,e.a);
    return `${champ(k.c,22)}<b>${esc(k.n)}</b><span style="color:var(--gold3)">›</span>${champ(v.c,22)}<b class="vi">${esc(v.n)}</b>${e.as.length&&!short?`<small>+${e.as.length}</small>`:""}${e.fb?`<em>1er sang</em>`:""}`}
  if(e.k==="drag")return `<i class="dg" style="background:${DRAG[e.ty]||"#888"};width:12px;height:12px"></i><b>${tn(e.s)}</b><span>dragon ${esc((KF_DR[e.ty]||e.ty).toLowerCase())}</span>`;
  if(e.k==="soul")return `<i class="dg" style="background:${DRAG[e.ty]||"#888"};width:12px;height:12px"></i><b>${tn(e.s)}</b><span>âme ${esc(KF_DR[e.ty]||e.ty)}</span>`;
  if(e.k==="tower")return `${ITOW.replace("<svg",'<svg width="14" height="14"')}<b>${tn(e.s)}</b><span>${e.n>1?e.n+" tours":"tour"}</span>`;
  if(e.k==="inhib")return `${IINH.replace("<svg",'<svg width="14" height="14"')}<b>${tn(e.s)}</b><span>${e.n>1?e.n+" inhibiteurs":"inhibiteur"}</span>`;
  if(e.k==="baron")return `${IBAR.replace("<svg",'<svg width="14" height="14"')}<b>${tn(e.s)}</b><span>Baron Nashor</span>`;
  const p=[];if(e.kl&&e.kl[0]+e.kl[1])p.push(`${plur(e.kl[0]+e.kl[1],"kill")}`);[0,1].forEach(s=>{const o=[];if(e.nd&&e.nd[s].length)o.push(e.nd[s].map(x=>"dragon "+(KF_DR[x]||x).toLowerCase()).join(", "));if(e.no&&e.no[3*s])o.push(plur(e.no[3*s],"tour"));if(e.no&&e.no[3*s+2])o.push("Baron");if(o.length)p.push(tn(s)+" : "+o.join(", "))});
  return `<small>jusqu’à ${kfMS(e.t1)} · ${p.join(" · ")}${L.kf&&L.kf.err<3?" (lecture en cours)":""}</small>`}
const matEvKey=e=>e.k+e.ms+"|"+(e.v??e.s)+(e.ty||"");
const matEvSide=e=>e.k==="kill"?(e.a>=0?(e.a<5?0:1):(e.v<5?1:0)):e.s;
const matEvRow=(L,m,e,fresh)=>`<div class="kfr${e.k==="soul"||e.k==="baron"?" big":""}${e.k==="gap"?" gap":""}${fresh?" new":""}" style="--c:${matCol(m,kfTm(L,matEvSide(e)))}"><time>${e.k==="gap"||!kfExact(L,e.ms)?"≈":""}${kfMS(e.t)}</time><span>${evLine(L,e)}</span></div>`;
function matFil(L,m){const K=L.kf,ev=K?K.ev.slice().reverse():[];const sn=K?(K.seenB||(K.seenB=new Set())):new Set(),first=!sn.size;
  const rows=ev.slice(0,3).map(e=>matEvRow(L,m,e,!first&&!sn.has(matEvKey(e)))).join("");ev.forEach(e=>sn.add(matEvKey(e)));
  const all=matSheet("fil|"+m.key,"Tout le fil",()=>{const Lx=LV.games[m.key],Kx=Lx&&Lx.kf;return Kx&&Kx.ev.length?`<div class="kf">${Kx.ev.slice().reverse().map(e=>matEvRow(Lx,m,e,false)).join("")}</div><p class="mat-mu">Reconstitué en comparant les images du flux officiel ; « ≈ » : heure approximative tant que le début de la partie n’est pas lu.</p>`:"<p>Rien pour l’instant.</p>"},true);
  return `<div class="blk" data-pk="fil"><div class="bh">Le fil${ev.length>3?`<button class="mat-bhb" data-info="${all}">Tout le fil (${ev.length}) ›</button>`:""}</div><div class="kf">${rows||`<p class="mat-sub" style="margin:0">Rien pour l’instant.</p>`}</div></div>`}
function matCurveBlk(L,m){const tr=trend(L,m),c=goldCurve(goldPts(L,m),m,"",60);
  return `<div class="blk" data-pk="gold"><div class="bh">Écart d’or${tr?`<span class="mat-bhr">${tr.txt}</span>`:""}</div>${c||`<p class="mat-sub" style="margin:0">La courbe se remplit en quelques secondes.</p>`}</div>`}
/* sections de live2 (v13.5) : une ligne chacune, le détail en feuille qui suit le direct */
function matBascule(L,m,t,fin,f){const B=l2Bas(L,m,t,fin,f);if(!B)return"";const fv=`<b>${l2sd(B.fav)}</b>`,un=`<b>${l2sd(B.und)}</b>`,mn=Math.floor(t);
  const line=B.k==="w"?`${fv} était favori à ${l2pc(B.pf)} ; ${un} a gagné : surprise`:B.k==="s"?`${fv} était favori à ${l2pc(B.pf)} ; à ${mn} min, ${un} a <b class="g">${l2pc(1-B.lf)}</b> : surprise en vue`:`${fv} était favori à ${l2pc(B.pf)} ; à ${mn} min, il n’a plus que <b class="g">${l2pc(B.lf)}</b> : rien n’est joué`;
  return matRow("Le match bascule ?",line,matSheet("bas|"+L.gid,"Le match bascule ?",()=>{const Lx=LV.games[m.key];const Bx=Lx&&Lx.frame?l2Bas(Lx,m,gameMins(Lx),Lx.frame.gameState==="finished",Lx.frame):null;if(!Bx)return `<p>L’écart avec le prono n’est plus net.</p>`;
    return `<p>Prono du robot pour cette partie, avant le début : ${l2sd(Bx.fav)} ${l2pc(Bx.pf)}${Bx.pD!=null?`, puis ${l2pc(Bx.pD)} après la draft`:""} (note des joueurs, côté).</p>${Bx.k==="w"?"":`<p>Chances de victoire du direct à ${Math.floor(gameMins(Lx))} min : ${l2sd(Bx.fav)} ${l2pc(Bx.lf)}, ${l2sd(Bx.und)} ${l2pc(1-Bx.lf)} (or, tours, dragons, Barons, inhibiteurs).</p>`}<p class="mat-mu">Cette ligne n’apparaît que si l’écart avec le prono est net : l’outsider à 60 % ou plus, ou le favori qui a perdu 25 points. Rien avant 5 min ni si le robot voyait un match serré.</p>`},true),"hot")}
/* records en vue (fun de v13.5) : la plus forte candidate, une ligne ; le détail et la portée au toucher */
function matRecord(m,where){const L=LV.games[m.key];if(!L||!L.frame||(L.status!=="live"&&L.status!=="ended"))return null;
  const C=safe(funRecCands,L)||[];if(!C.length)return null;const c=C.sort((a,b)=>funRank(b)-funRank(a))[0];
  if(c.sc==="w"&&(c.beat||c.tie)&&c.who)c.y=C.find(x=>x.sc==="y"&&x.kind===c.kind&&x.who&&x.who.n===c.who.n&&!x.beat&&!x.tie)||null;
  return {c,txt:safe(funRecTxt,c,L),det:safe(funRecDet,c)}}
function matRecRow(m){const r=matRecord(m,"s");if(!r||!r.txt)return"";
  return matRow(r.c.beat?"Record battu":r.c.tie?"Record égalé":"Record en vue",r.txt,matSheet("rec|"+m.key,"Records en vue",()=>{const x=matRecord(m,"s");return x?`<p>${x.txt}</p>${x.det}`:"<p>Plus de record en vue pour l’instant.</p>"},true),r.c.beat||r.c.tie?"hot":"")}
/* accueil (A-05, pour home.js) : une ligne dans le héros du direct, seulement quand un record est battu ou égalé ; le détail est dans le match */
function matHeroRec(m){const r=matRecord(m,"h");return r&&r.txt&&(r.c.beat||r.c.tie)?`<div class="mat-hrec">${r.txt}</div>`:""}
function matFights(L,m,f){const F=l2Fights(L),last=F[F.length-1],now=Date.parse(f.rfc460Timestamp);
  if(!last)return matRow("Les fights","Pas encore de fight (2 kills ou plus en moins de 20 s)","");
  const sw=x=>{const a=l2Gd(L,x.ms0,-1),b=l2Gd(L,x.ms1,1);return a&&b?{a:a.gd,b:b.gd}:null},s1=sw(last),w=last.n[0]>last.n[1]?0:last.n[1]>last.n[0]?1:-1,live=f.gameState!=="finished"&&now-last.ms1<20000,swing=s1&&w>=0?(s1.b-s1.a)*(w?-1:1):null;
  const line=`<b>${kfMS(last.t0)}</b> · ${l2FightTxt(L,last)}${swing!=null&&Math.abs(swing)>=100?`, ${swing>0?"+":"−"}${l2k(swing)} d’or`:""}${live?` <span class="tag mat-tw">en cours</span>`:""}`;
  return matRow(`Les fights · ${F.length}`,line,matSheet("fights|"+L.gid,"Les fights",()=>{const Lx=LV.games[m.key];if(!Lx||Lx.gid!==L.gid)return"";const Fx=l2Fights(Lx),gdt=v=>Math.abs(v)<100?"égalité":`${l2sd(v>0?Lx.blue:Lx.red)} +${l2k(v)}`,swx=x=>{const a=l2Gd(Lx,x.ms0,-1),b=l2Gd(Lx,x.ms1,1);return a&&b?{a:a.gd,b:b.gd}:null};
    return Fx.slice().reverse().slice(0,8).map(x=>{const s=swx(x);return `<div class="mat-fg"><div class="mat-fgh"><b>${kfMS(x.t0)}</b><span>${l2FightTxt(Lx,x)}</span><small>${s?`or : ${gdt(s.a)} → ${gdt(s.b)}`:"écart d’or : pas mesuré"}</small></div>${x.e.map(e=>matEvRow(Lx,m,e,false)).join("")}</div>`}).join("")
      +(Fx.length>8?`<p class="mat-mu">Les ${Fx.length-8} premiers fights sont dans « Tout le fil ».</p>`:"")+`<p class="mat-mu">Un fight : au moins 2 kills espacés de moins de 20 s, lus dans le fil du match ; le bilan compte les kills de chaque équipe. Écart d’or avant et après : mesures du direct (une toutes les 10 s), seulement si l’appli suivait la partie à ce moment-là.</p>`},true))}
function matDuels(L,m,R,t,fin){const S=L.l2;
  if(t<5&&!fin)return matRow("Les duels, écart d’or","Verdict à partir de 5 min de jeu","");
  const lanes=l2Lanes(R,t),sel=l2Pick(S,lanes);
  const val=sel.length?sel.map(l=>`<span class="mat-l"><b>${esc(l.w.n)}</b> ${l2Verb(l.dl,t)} ${esc(l.l.n)} : <b class="g">+${l2k(l.dl)}</b>${l.tag?` <span class="tag${l.tag==="inattendu"?" mat-tw":""}">${l.tag}</span>`:""}</span>`).join(""):"Aucun écart marquant : toutes les lanes à moins de 0,5 k d’or";
  return matRow("Les duels, écart d’or",val,matSheet("lanes|"+L.gid,"Les duels, écart d’or",()=>{const Lx=LV.games[m.key];if(!Lx||!Lx.frame)return"";const Rx=l2Rows(Lx);if(!Rx)return"";const tx=gameMins(Lx),Ls=l2Lanes(Rx,tx).filter(Boolean),mx=Math.max(1500,...Ls.map(l=>l.dl)),fl=Lx.blue===m.t2;
    return `<div class="vhd"><span>${logo(m.t1,18)}${esc(tid(m.t1))}</span><span>${esc(tid(m.t2))}${logo(m.t2,18)}</span></div>`+Ls.map(l=>{const A=fl?l.b:l.a,B=fl?l.a:l.b,d=fl?-l.d:l.d,aw=d>=0,w=Math.min(50,Math.abs(d)/mx*50).toFixed(1),eq=Math.abs(d)<300,x=fl?-l.x:l.x;
      const pr=!l.ld?"pas de prévision":Math.abs(x)<100?"prévu : égalité":`prévu : ${esc((x>=0?A:B).n)} +${l2k(x)}`;
      return `<div class="mat-ln"><span class="${!eq&&aw?"lead":""}">${esc(A.n)}</span><span class="mat-lg"><i class="rl">${ROLE_S[l.r]}</i><b>${Math.abs(d)<50?"=":l2k(Math.abs(d))}</b><i class="bar"><s style="${aw?"right":"left"}:50%;width:${w}%;background:${aw?cA(m):cB(m)}"></s></i></span><span class="r ${!eq&&!aw?"lead":""}">${esc(B.n)}</span><small>${pr}${l.tag?" · "+l.tag:""}</small></div>`}).join("")
      +`<p class="mat-mu">Écart d’or actuel entre les deux joueurs du même poste. Prévu : modèle de lane du robot (écart attendu à 15 min, ligues comprises), au prorata du temps de jeu. « Inattendu » : celui qui mène n’était pas attendu devant, ou le duel était annoncé serré, et l’écart dépasse nettement l’habituel. Jungle et support n’ont pas de vraie lane : l’écart y dit surtout qui profite de la partie.</p>`},true))}
function matPogBody(P,fin){const bd=y=>`+${y.sc.k} kills, +${y.sc.a} assist., −${y.sc.d} morts, +${y.sc.go} or (${y.sc.g}${NB}%)${y.sc.dm!=null?`, +${y.sc.dmo} dégâts (${y.sc.dm}${NB}%)`:""}`;
  return [P.top,...P.rest].map((y,i)=>`<div class="mat-pr"><span class="n">${i+1}</span>${champ(y.c,30)}<span class="grow"><b>${esc(y.n)}</b><small>${l2sd(y.team)} · ${esc(ROLE_S[y.role]||y.role)} · ${l2Kda(y.s)}</small><small>${bd(y)}</small></span><b class="g">${y.sc.v}</b></div>`).join("")
    +(fin&&P.ws!=null?`<p class="mat-mu">Choisi dans l’équipe gagnante.</p>`:"")+`<p class="mat-mu">Score simple, recalculé à chaque mise à jour : 3 points par kill, 2 par assistance, −3 par mort, la moitié de sa part de l’or de l’équipe en % (26 % de l’or = 13 points), la moitié de sa part des dégâts quand le flux détaillé est lu. Au moins un kill ou une assistance. En cours de partie, le premier ne change que s’il est dépassé d’au moins 3 points. Ce n’est pas le titre officiel.</p>`}
function matPog(L,m,R,f,fin,t){const nk=(f.blueTeam.totalKills||0)+(f.redTeam.totalKills||0),lab=fin?"Joueur du match":"Joueur du match (provisoire)";
  const P=!fin&&(t<10||!nk)?null:l2Pog(L,R,f,fin);if(!P)return matRow(lab,"À partir de 10 min de jeu","");const x=P.top;
  return matRow(lab,`<span class="mat-pg">${champ(x.c,24)}<b>${esc(x.n)}</b><small>${l2sd(x.team)} · ${l2Kda(x.s)}</small><b class="g">${x.sc.v} pts</b></span>`,matSheet("pog|"+L.gid,lab,()=>{const Lx=LV.games[m.key];if(!Lx||!Lx.frame)return"";const Rx=l2Rows(Lx);if(!Rx)return"";const fx=Lx.frame,fn=fx.gameState==="finished",Px=l2Pog(Lx,Rx,fx,fn);return Px?matPogBody(Px,fn):""},true))}
/* résultat qui tarde (M-08) : vainqueur saisi à la main (w26_manual), ce n'est pas un pari ; la donnée officielle reprend la main */
function matManualBlk(m){const tx=m.manual?`Résultat saisi à la main : <b>${esc(tid(m.winner))}</b> a gagné`:"Le match semble fini mais le résultat officiel n’est pas encore arrivé";
  return `<div class="blk" data-pk="man">${matRow(m.manual?"Résultat saisi à la main":"Le résultat tarde à arriver ?",tx,matSheet("man|"+m.key,"Le résultat tarde à arriver ?",()=>{const x=mOf(m.id)||m;
    return `<p>Indique le vainqueur officiel du match. Ce n’est pas un pari : la donnée officielle reprend la main dès qu’elle arrive.</p><div class="pk2">${[x.t1,x.t2].map(t=>`<button class="pkb" data-win="${esc(t)}" data-mk="${esc(x.key)}" aria-pressed="${manual[x.key]===t}">${logo(t,22)}${esc(tid(t))} a gagné</button>`).join("")}</div>${manual[x.key]?`<p class="mat-mu">Touche à nouveau le vainqueur choisi pour effacer la saisie.</p>`:""}`}))}</div>`}
function matBetweenPog(m,L){const f=L&&L.frame;if(!f||f.gameState!=="finished"||!L.meta)return"";const R=l2Rows(L);if(!R)return"";const P=l2Pog(L,R,f,true);if(!P)return"";const x=P.top;
  return `<div class="blk" data-pk="bpog">${matRow(`Partie ${esc(L.num||"")} · joueur du match`,`<span class="mat-pg">${champ(x.c,24)}<b>${esc(x.n)}</b><small>${l2sd(x.team)} · ${l2Kda(x.s)}</small><b class="g">${x.sc.v} pts</b></span>`,matSheet("bpog|"+L.gid,`Partie ${L.num||""} · joueur du match`,()=>matPogBody(P,true)))}</div>`}
function matTabDirect(m){const L=LV.games[m.key];let h="";const man=m.state==="wait"||m.manual?matManualBlk(m):"";
  if(!matOn(L)){const st=L&&L.status,n=Math.max(matN(m),matSeries(m,L)[0]+matSeries(m,L)[1]);
    h+=`<div class="blk mat-msg" data-pk="msg"><span class="mat-dot${LV.err&&!(L&&L.frame)?" err":""}"></span><span>${matLiveMsg(m,L)}.</span></div>`+man;
    if(st==="between")h+=matBetweenPog(m,L);
    if(!matOver(m,L))h+=`<button class="btn mat-go" data-pk="gdr" data-tab="dr">${st==="between"?`Avant la partie ${n+1} : fearless, picks et bans`:"Draft probable de la partie"} ›</button>`;
    return h+matWatch()}
  h+=man;const f=L.frame,fin=f.gameState==="finished",t=gameMins(L);l2St(L);l2Det(L,m);const R=l2Rows(L);
  const hot=matBascule(L,m,t,fin,f)+matRecRow(m);
  h+=matFil(L,m)+matCurveBlk(L,m);
  h+=`<div class="blk mat-rows" data-pk="l2">${hot}${R?matFights(L,m,f)+matDuels(L,m,R,t,fin)+matPog(L,m,R,f,fin,t):matRow("Pendant la partie","Lecture des joueurs en cours…","")}</div>`;
  return h+matWatch()}

/* ===================== 9. direct : onglet Joueurs (tableau du match fusionné) ===================== */
function matTabLivePlayers(m){const L=LV.games[m.key];if(!matOn(L))return matLiveWaitTab(m,L);
  l2St(L);l2Det(L,m);const R=l2Rows(L),f=L.frame,t=gameMins(L);if(!R)return `<div class="blk" data-pk="w"><p class="mat-sub" style="margin:0">Lecture des joueurs en cours…</p></div>`;
  const sa=L.blue===m.t2?1:0,D=L.l2d&&L.l2d.gid===L.gid&&L.l2d.f,tk=[f.blueTeam.totalKills||0,f.redTeam.totalKills||0];
  const top=D?R.filter(x=>x.dd&&typeof x.dd.championDamageShare==="number").sort((p,q)=>q.dd.championDamageShare-p.dd.championDamageShare)[0]:null,jg=l2Jg(L,R);
  const ver=(()=>{const pv=/^(\d+)\.(\d+)/.exec((L.meta||{}).patchVersion||"");return pv?pv[1]+"."+pv[2]+".1":(CH&&CH.v)||""})(),fb=CH&&CH.v&&CH.v!==ver?CH.v:"";
  const ico=i=>`<img class="mat-it" src="https://ddragon.leagueoflegends.com/cdn/${ver}/img/item/${i}.png" alt="" loading="lazy" width="28" height="28"${fb?` onerror="this.onerror=null;this.src='https://ddragon.leagueoflegends.com/cdn/${fb}/img/item/${i}.png'"`:""}>`;
  const det=x=>()=>{const Lx=LV.games[m.key];if(!Lx||Lx.gid!==L.gid)return"";const Rx=l2Rows(Lx);if(!Rx)return"";const y=Rx.find(z=>z.pid===x.pid);if(!y)return"";const s=y.s,d=y.dd,fx=Lx.frame,tx=gameMins(Lx),tkx=[fx.blueTeam.totalKills||0,fx.redTeam.totalKills||0],kp=tkx[y.side]?Math.round(((s.kills||0)+(s.assists||0))/tkx[y.side]*100):0,it=d&&d.items?d.items.filter(i=>i>0):[];
    return `<div class="mat-pd">${champ(y.c,48)}<span><b>${esc(champNm(y.c))}</b><small>${esc(ROLES[y.role]||"")} · ${l2sd(y.team)} · niveau ${s.level||0}</small></span></div>
      <dl class="kv"><dt>K/D/A</dt><dd>${l2Kda(s)}</dd><dt>CS</dt><dd>${s.creepScore||0} (${fx1(tx>0?(s.creepScore||0)/tx:0)} par min)</dd><dt>Or</dt><dd>${l2k(s.totalGold||0)}</dd><dt>Participation aux kills</dt><dd>${kp}${NB}%</dd>
      ${d?`${typeof d.championDamageShare==="number"?`<dt>Part des dégâts</dt><dd>${l2pc(d.championDamageShare)} de ${l2sd(y.team)}</dd>`:""}<dt>Balises</dt><dd>${d.wardsPlaced||0} posées, ${d.wardsDestroyed||0} détruites</dd>`:""}</dl>
      ${d?(it.length?`<div class="mat-its">${it.map(ico).join("")}</div>`:""):`<p class="mat-mu">Dégâts, balises et objets : en attente du flux détaillé (lu toutes les 30 s).</p>`}
      ${y.pl?`<button class="btn" data-matgo="p/${esc(y.pl.key)}">Fiche de ${esc(y.pl.id)} ›</button>`:""}`};
  const cell=(x,rev)=>{const s=x.s,d=x.dd,ds=d&&typeof d.championDamageShare==="number"?l2pc(d.championDamageShare):"";
    return `<button class="lps mat-lps${rev?" r":""}" data-info="${matSheet("pl|"+L.gid+"|"+x.pid,x.n,det(x),true)}"><span class="fc${kfDead(s)?" dead":""}">${champ(x.c,36)}${s.level?`<i>${s.level}</i>`:""}</span><span class="txt"><b>${esc(x.n)}${x.pl?rankChip(x.pl):""}</b><small>${l2Kda(s)} · ${s.creepScore||0} CS</small><small>${l2k(s.totalGold||0)}${ds?" · "+ds:""}</small></span></button>`};
  const rows=ROLE_ORDER.map(r=>{const a=R.find(x=>x.side===sa&&x.role===r),b=R.find(x=>x.side!==sa&&x.role===r);if(!a||!b)return"";const gd=(a.s.totalGold||0)-(b.s.totalGold||0);
    return `<div class="lp mat-lp">${cell(a,0)}<span class="lgd${Math.abs(gd)<150?"":gd>0?" a":" b"}"><small>${ROLE_S[r]}</small>${Math.abs(gd)<150?"=":(gd>0?"◀ ":"")+l2k(Math.abs(gd))+(gd<0?" ▶":"")}</span>${cell(b,1)}</div>`}).join("");
  const sum=[top?`Le plus de dégâts : <b>${esc(top.n)}</b>, ${l2pc(top.dd.championDamageShare)} de ${l2sd(top.team)}`:"",jg?`Kills avec le jungler avant 15 min${t<15?" (jusqu’ici)":""} : <b>${esc(tid(m.t1))} ${jg[sa]}</b> · <b>${esc(tid(m.t2))} ${jg[1-sa]}</b>`:""].filter(Boolean);
  return `<div class="blk" data-pk="tab"><div class="bh">Tableau du match<button class="i" data-info="lplayers" aria-label="Lire ce tableau">i</button></div>${sum.length?`<div class="mat-sum">${sum.map(x=>`<p>${x}</p>`).join("")}</div>`:""}<div class="vhd"><span>${logo(m.t1,18)}${esc(tid(m.t1))}<small class="mat-sd">${sa?"rouge":"bleu"}</small></span><span><small class="mat-sd">${sa?"bleu":"rouge"}</small>${esc(tid(m.t2))}${logo(m.t2,18)}</span></div>${rows}</div>`}
function matLiveWaitTab(m,L){return `<div class="blk mat-msg" data-pk="msg"><span class="mat-dot"></span><span>${matLiveMsg(m,L)}. Les joueurs arrivent au lancement de la partie.</span></div>`+`<div data-pk="r">${matRolesList(m,true)}</div>`}

/* ===================== 10. direct : onglet Draft ===================== */
function matLiveDraft(m,L){const D=L.amd;if(!D)return `<div class="blk" data-pk="w"><div class="bh">Draft de la partie ${L.num||""}</div>${skel(48,3)}</div>`;
  if(D.err)return `<div class="blk" data-pk="w"><p class="mat-sub" style="margin:0">Analyse de la draft indisponible.</p></div>`;
  const R=SJ&&SJ.pm&&SJ.pm.ref,rd=R&&R.draft,nr=R&&R.new&&R.new.tout,fl=D.blue===m.t2;
  const info=matSheet("ldi|"+D.gid,"Draft de la partie",()=>`<p>Au centre, l’écart d’or à 15 min de ce duel de champions en pro : « + » ou « − » quand il est net, « ≈ » sinon.</p>${DJ&&DJ.mu?djMuNote(DJ):""}<p>Expérience : parties officielles du joueur sur ce champion depuis 2025 (« jamais en pro » : aucune).${nr?` Un champion jamais joué en pro par son joueur coûte : l’adversaire gagne ${amPc(nr[1]/nr[0])} de ces parties pour ${amPc(nr[2]/nr[0])} prévus (${amNf(nr[0])} parties 2025-2026).`:""}</p><p>Prono après la draft : prono du robot pour cette partie (note des joueurs et côté), corrigé par les matchups et les champions jamais joués. Testé mois par mois sur ${amNf((R&&R.cal&&R.cal.tout&&R.cal.tout.n)||5810)} parties 2025-2026 : gain faible mais réel en ligues${rd?`, il bouge le prono de ${fx1(rd.dp[0]*100)} point${rd.dp[0]*100>=1.95?"s":""} en médiane`:""}. Pas confirmé aux internationales.</p>`);
  let top="";
  if(D.p!=null&&D.pE!=null){const bl=D.blue,lgt=x=>{const q=Math.min(.999,Math.max(.001,x));return Math.log(q/(1-q))},rp=m.bo===1&&(bl===m.t1||bl===m.t2)?amFn(robotProb,m):null,pE=rp!=null?(bl===m.t1?rp:1-rp):D.pE,pD=rp!=null?sigm(lgt(pE)+lgt(D.p)-lgt(D.pE)):D.p,diff=Math.round(pD*100)-Math.round(pE*100);
    top=`<div class="mat-adj">${logo(bl,22)}<span>${esc(tid(bl))} avant la draft</span><b>${amPc(pE)}</b><span>après</span><b>${amPc(pD)}</b>${diff?`<small class="${diff>0?"up":"dn"}">${diff>0?"+":"−"}${Math.abs(diff)} pt${Math.abs(diff)>1?"s":""}</small>`:""}</div>${D.news.length?`<p class="mat-sub">${D.news.slice(0,2).map(z=>`${esc(z[0])} sur ${esc(z[1])} : jamais joué en pro depuis 2025.`).join(" ")}</p>`:""}`}
  const tag=(o,rev)=>{if(!o)return `<span class="mat-ldc${rev?" r":""}"></span>`;const nw=o.m&&!o.m[0];
    return `<span class="mat-ldc${rev?" r":""}">${champ(o.c,36)}<span class="txt"><b>${esc(champNm(o.c)||o.c)}</b><small>${esc(o.n||"")}</small><small class="${nw?"mat-new":""}">${!o.m?"":nw?"jamais en pro":`${amPl(o.m[0],"partie")}, ${o.m[1]} V`}</small></span></span>`};
  const det=o=>{if(!o)return"";const t=[];if(o.m)t.push(o.m[0]?`${esc(o.n)} sur ${esc(o.c)} : ${amPl(o.m[0],"partie")} officielle${o.m[0]>1?"s":""} depuis 2025, ${amPl(o.m[1],"victoire")}${o.t90?` ; ${o.g90||0} de ses ${o.t90} parties des 90 derniers jours`:""}.`:`${esc(o.n)} n’a jamais joué ${esc(o.c)} en match officiel depuis 2025.`);
    if(o.cn>=20)t.push(`${esc(o.c)} en pro en 2026 : ${pct(o.cw,o.cn)}${NB}% de victoires (${amNf(o.cn)} parties).`);return t.map(x=>`<p>${x}</p>`).join("")};
  const rows=D.lines.map(x=>{const A=fl?x.d:x.b,B=fl?x.b:x.d,mu=x.mu,mg=mu?(fl?-1:1)*(mu.gd||0):0;
    return `<button class="drr mat-ld" data-info="${matSheet("ld|"+D.gid+"|"+x.r,`${ROLES[x.r]} : ${A?A.c:"?"} – ${B?B.c:"?"}`,()=>`${mu?`<p>${esc(mu.t)}</p>`:""}${det(A)}${det(B)}`)}">${tag(A,false)}<span class="rl">${ROLE_S[x.r]}<small class="${mu&&mu.net?(mg>0?"a":"b"):""}">${mu?esc(mu.l):"–"}</small><i>${mu&&mu.g?amPl(mu.g,"partie"):"pas de duel"}</i></span>${tag(B,true)}</button>`}).join("");
  let h=`<div class="blk" data-pk="ld"><div class="bh">Draft de la partie ${D.num||""}<button class="i" data-info="${info}" aria-label="Lire la draft">i</button></div>${top}<div class="vhd"><span>${logo(m.t1,18)}${esc(tid(m.t1))}<small class="mat-sd">${fl?"rouge":"bleu"}</small></span><span><small class="mat-sd">${fl?"bleu":"rouge"}</small>${esc(tid(m.t2))}${logo(m.t2,18)}</span></div>${rows}</div>`;
  let more="";
  const P=DJ?safe(d2Pred,m,L.num,true):null,Rr=P?safe(d2RealLive,P,L):null,C=Rr?safe(d2Cmp,Object.assign({},P,{o:null}),Rr):null;
  if(C&&C.pn)more+=matRow("Draft contre nos pronos",safe(d2Sum,P,C,Rr,"live"),matSheet("d2l|"+L.gid,"Draft contre nos pronos",()=>safe(d2Detail,P,C,Rr,"live")+`<p class="mat-mu">${safe(d2Foot,P)}</p>`));
  if(m.bo>1&&L.num>1)more+=matFearlessRow(m,L.num-1,"live");
  if(more)h+=`<div class="blk mat-rows" data-pk="d2">${more}</div>`;
  return h}
/* « Plus jouables dans cette série » (fearless, d2FearlessData de v13.5) : une ligne, la liste et les favoris pris en feuille */
function matFearlessRow(m,n,ctx){const k="d2f_"+m.key+"_"+n,D=matAk(k,()=>d2FearlessData(m,n),1);
  if(D===undefined)return matRow("Plus jouables dans cette série","Lecture des parties déjà jouées…","");if(!D||!D.by)return"";
  const all=new Set();Object.values(D.by).forEach(L=>L.forEach(z=>all.add(ckey(z[0]))));const N=all.size,dj=DJ;
  const teams=[m.t1,m.t2].filter(t=>D.by[t]),pl=t=>teamPlayers(t).map(p=>{const Pp=dj&&dj.pool&&dj.pool[p.key],fav=Pp?Pp[2].slice(0,5).map(z=>dj.ch[z[0]]):[],lost=fav.filter(c=>all.has(ckey(c)));return {p,fav,lost,rest:dj?picksFor(p.key,all,3):[]}});
  const rows=teams.map(t=>[t,pl(t)]),top=rows.flatMap(x=>x[1]).filter(x=>x.lost.length).sort((a,b)=>b.lost.length-a.lost.length)[0];
  const sub=top?`${plur(N,"champion")} · ${esc(top.p.id)} : ${top.lost.length} de ses ${top.fav.length} favoris pris`:`${plur(N,"champion")} déjà pris`;
  const parts=L=>{const g=[...new Set(L.map(z=>z[1]))].sort((a,b)=>a-b);return g.length>1?"parties "+g.slice(0,-1).join(", ")+" et "+g[g.length-1]:"partie "+g[0]};
  return matRow("Plus jouables dans cette série",sub,matSheet("fl|"+k,"Plus jouables dans cette série",()=>`<p>Fearless : un champion joué dans une partie ne peut plus être choisi dans la suite de la série, ni par une équipe ni par l’autre.${ctx==="live"?" S’y ajouteront les 10 champions de la partie en cours.":""}${D.ng<D.n?" Partie pas encore lue dans le flux : liste incomplète.":""}</p>
    ${teams.map(t=>`<div class="mat-flt">${logo(t,18)}<b>Pris par ${esc(tid(t))}</b><small>${parts(D.by[t])}</small></div><div class="mat-chs">${D.by[t].map(z=>`<span title="${esc(z[0])}, partie ${z[1]}">${champ(z[0],30)}</span>`).join("")}</div>`).join("")}
    ${dj&&rows.length?`<h4 class="mat-h4">Leurs favoris <small>5 champions les plus joués sur 90 jours</small></h4>${rows.map(([t,L])=>`<div class="mat-flt">${logo(t,16)}<b>${esc(tid(t))}</b></div>${L.map(x=>`<div class="mat-flp"><i class="rl">${ROLE_S[x.p.role]}</i><b>${esc(x.p.id)}</b><span>${x.rest.length?`<small>reste</small>${x.rest.map(z=>champ(z.c,24)).join("")}`:""}</span><small class="ls">${!x.fav.length?"pas de partie depuis 90 jours":x.lost.length?`${x.lost.length} de ses ${x.fav.length} favoris pris : ${x.lost.map(c=>champ(c,18,"lost")).join("")}`:`aucun de ses ${x.fav.length} favoris pris`}</small></div>`).join("")}`).join("")}
      <p class="mat-mu">« reste » : ses 3 picks probables, champions déjà pris retirés. Règle vérifiée sur 1 989 séries 2025-2026 lues par le robot : jamais un champion rejoué dans une même série.</p>`:""}`))}
/* entre deux parties (ou avant la 1re) : la suite de la série, comme v13.5 « Avant la partie n » */
function matTabLiveDraft(m){const L=LV.games[m.key];
  if(L&&L.meta&&L.status!=="between"&&L.status!=="waiting")return matLiveDraft(m,L);
  const s=matSeries(m,L),n=s[0]+s[1];
  if(matOver(m,L))return matDraftDoneList(m);
  if(!n){const k="dj_"+m.key+"_0",D=matDraftData(m,0);return `<div class="blk mat-msg" data-pk="msg"><span class="mat-dot"></span><span>Draft en cours : les champions arrivent au lancement de la partie. En attendant, la draft probable.</span></div>`+(D===undefined?skel(120,2):D===null?matErr(k):matDraftHTML(m,D,k))}
  const mm=Object.assign({},m,{s1:n,s2:0}),k="amb_"+m.key+"_"+n,D=matAk(k,()=>draftMatchData(mm),1);
  const fr=m.bo>1?matFearlessRow(m,n,"between"):"",hd=`<div class="blk mat-msg" data-pk="msg"><span class="mat-dot"></span><span>Avant la partie ${n+1} : bans attendus et picks probables, champions déjà joués retirés.</span></div>${fr?`<div class="blk mat-rows" data-pk="fr">${fr}</div>`:""}`;
  if(D===undefined)return hd+skel(120,2);if(D===null)return hd+matErr(k);
  return hd+matDraftHTML(m,Object.assign({},D,{burned:[]}),k,`Partie ${n+1}`)}
function matDraftDoneList(m){return `<div class="blk mat-msg" data-pk="msg"><span class="mat-dot"></span><span>Série terminée : la draft de chaque partie est dans l’onglet Parties dès que le résultat est officiel.</span></div>`}

/* ===================== 11. onglet Avant (direct et match terminé) ===================== */
function matTabBefore(m){const live=matKind(m)==="live",me=picks[m.key];let h="";
  const pr=me?`Ton prono : <b>${esc(tid(me))}${scores[m.key]?" "+esc(scores[m.key]):""}</b>${m.winner?(me===m.winner?`, gagné (+${pts(me,scores[m.key],m)})`:", perdu"):""}`:live?"Paris fermés : le match a commencé":"Pas de prono sur ce match";
  if(live)h+=(matLea("my",m)||`<div class="blk" data-pk="prono"><div class="bh">Ton prono</div><p class="mat-say">${me?logo(me,22):""}<span>${pr}</span></p></div>`)+matLea("bets",m);
  h+=matRobotBlk(m,true)+matKeysBlk(m,true);
  if(live)h+=`<div class="blk mat-rows" data-pk="rl">${matRow("Duel par poste","Bilan depuis 2024 et derniers duels, poste par poste",matSheet("roles|"+m.key,"Duel par poste",()=>matRolesList(mOf(m.id)||m,true,"data-matgo")+`<p class="mat-mu">Touche un poste pour le duel complet. Méthode : « i » de l’onglet Joueurs avant le match.</p>`))}${matRow("Les deux équipes","Face-à-face, forme, saison 2026, côté",matSheet("teams|"+m.key,`${tid(m.t1)} – ${tid(m.t2)}`,()=>matTeamsHTML(mOf(m.id)||m,true)))}</div>`;
  else h+=`<div data-pk="rl"><div class="bh mat-th" style="margin-top:16px">Duel par poste<span class="mat-bhr">avant-match</span><button class="i" data-info="roles" aria-label="Lire les duels par poste">i</button></div>${matRolesList(m,true)}</div>`;
  if(!live)h+=`<div class="blk" data-pk="eq">${matRow("Les deux équipes","Face-à-face, forme, saison 2026, côté",matSheet("teams|"+m.key,`${tid(m.t1)} – ${tid(m.t2)}`,()=>matTeamsHTML(mOf(m.id)||m,true)))}</div>`;
  if(!live){const a=m.t1,b=m.t2,prev=MATCHES.filter(x=>x.id!==m.id&&x.winner&&((x.t1===a&&x.t2===b)||(x.t1===b&&x.t2===a)));
    if(prev.length)h+=`<div data-pk="prev"><div class="bh mat-th" style="margin-top:16px">Déjà croisés à ces Worlds</div><div class="list">${prev.map(mrow).join("")}</div></div>`}
  return h}

/* ===================== 12. parties d'un match : robot (fl.w, fu.g) et flux officiel (matchGames) ===================== */
function gamesOf(m){const mid=matMid(m),w=SJ&&SJ.fl&&SJ.fl.w;if(!w||!mid)return [];
  return Object.entries(w).filter(([,v])=>v[0]===mid).map(([gid,v])=>({gid,n:v[1],bc:resolveTeam(v[2]),rc:resolveTeam(v[3]),ws:v[4],mins:v[5],keys:v[9],ob:v[10],cv:v[11]})).sort((a,b)=>a.n-b.n)}
function matFeedGames(m){const n=matN(m);if(!n||!matMid(m))return null;return matAk("games_"+m.key+"_"+n,()=>matchGames(m),m.state==="done"?24:.03)}
function matGames(m){const out=new Map();gamesOf(m).forEach(g=>out.set(g.n,{n:g.n,gid:g.gid,r:g}));
  const F=matFeedGames(m);if(F&&F.games)F.games.forEach(x=>{if(!x||x.none||x.err)return;const o=out.get(x.num)||{n:x.num,gid:x.gid};o.f=x;if(!o.gid)o.gid=x.gid;out.set(x.num,o)});
  const U=SJ&&SJ.fu&&SJ.fu.g;if(U)out.forEach(o=>{if(o.gid&&U[o.gid])o.u=U[o.gid]});
  if(!out.size&&U){const mid=matMid(m);Object.entries(U).forEach(([gid,g])=>{if(g[0]===mid)out.set(g[1],{n:g[1],gid,u:g})})}
  return [...out.values()].sort((a,b)=>a.n-b.n)}
const matGameT=(g,s)=>g.r?(s?g.r.rc:g.r.bc):g.f?(s?g.f.r.our:g.f.b.our):g.u?resolveTeam(s?g.u[4]:g.u[3]):null;
function matGameWin(g){if(g.r)return g.r.ws===0?g.r.bc:g.r.rc;const f=g.f;if(f&&f.win)return f.win===f.b.id?f.b.our:f.r.our;if(g.u)return resolveTeam(g.u[5]===0?g.u[3]:g.u[4]);return null}
const matGameMins=g=>g.r?g.r.mins:g.f?g.f.mins:g.u?g.u[6]:null;
/* joueurs d'une partie : flux officiel, sinon données du robot (fu.g) ; {side, role, c, n, key, k, d, a, cs, gold, ds} */
function matGamePlayers(g){
  if(g.f&&g.f.b&&g.f.b.p&&g.f.b.p.length)return [[g.f.b,0],[g.f.r,1]].flatMap(([sd,s])=>(sd.p||[]).map((p,j)=>{const pl=playerFromSummoner(p.sn,sd.our);return {side:s,team:sd.our,role:ROLE_ORDER[j],c:p.c,pl,n:pl?pl.id:String(p.sn||"").split(" ").slice(1).join(" ")||p.sn||"?",k:p.k,d:p.d,a:p.a,cs:p.cs,gold:p.gold,ds:p.ds}}));
  if(g.u&&g.u[8])return g.u[8].map((x,i)=>{const pl=pkey(x[0]);return {side:i<5?0:1,team:resolveTeam(i<5?g.u[3]:g.u[4]),role:x[1],c:x[2],pl,n:pl?pl.id:String(x[0]||"?").split("_").slice(1).join("_"),k:x[3],d:x[4],a:x[5],cs:x[6],gold:null,ds:x[7]==null?null:x[7]/1000,robot:1}});
  return null}
function matGamePog(g){const P=matGamePlayers(g),w=matGameWin(g);if(!P||!w)return null;const W=P.filter(p=>p.team===w),tg=W.reduce((s,p)=>s+(p.gold||0),0)||0;
  const sc=p=>3*p.k+2*p.a-3*p.d+(tg?50*(p.gold||0)/tg:0)+(p.ds!=null?50*p.ds:0);return W.filter(p=>p.k+p.a>0).sort((a,b)=>sc(b)-sc(a))[0]||null}
function matPogBlk(m,g,compact){const x=matGamePog(g);if(!x)return"";
  if(compact)return `<div class="blk" data-pk="pog${g.n}">${matRow(`Joueur de la partie ${g.n}`,`<span class="mat-pg">${champ(x.c,30)}<b>${esc(x.n)}</b><small>${esc(tid(x.team))} · ${esc(champNm(x.c)||x.c)} · ${x.k}/${x.d}/${x.a}${x.ds!=null?` · ${Math.round(x.ds*100)}${NB}% des dégâts`:""}</small></span>`,"")}</div>`.replace('<div class="mat-row">',x.pl?`<div class="mat-row" data-go="p/${esc(x.pl.key)}" role="button">`:'<div class="mat-row">').replace(/<\/span><\/div><\/div>$/,x.pl?'</span><span class="chev">›</span></div></div>':'</span></div></div>');
  return `<div class="blk" data-pk="pog${g.n}"><div class="bh">Joueur de la partie${m.bo>1?` ${g.n}`:""}<button class="i" data-info="pog" aria-label="Comment il est choisi">i</button></div><div class="pog"${x.pl?` data-go="p/${esc(x.pl.key)}" role="button"`:""}>${x.pl?hcard(x.pl,"mini").replace('class="hc','style="width:86px;flex:none" class="hc'):champ(x.c,64)}
    <span class="grow"><b>${esc(x.n)}</b><small>${logo(x.team,14)} ${esc(tid(x.team))} · ${esc(champNm(x.c)||x.c)}</small><small>${x.ds!=null?Math.round(x.ds*100)+NB+"% des dégâts de l’équipe":""}</small></span><span class="num">${x.k}/${x.d}/${x.a}</span></div></div>`}
/* premiers objectifs, âme (fl.w du robot) : « 1er sang 5:54 · Canna sur Thanatos » */
function matMoments(g){const r=g.r;if(!r||!r.ob)return"";const [fb,ft,fd,fn,so]=r.ob,t=v=>Math.floor(v/60)+":"+String(Math.floor(v%60)).padStart(2,"0"),tm=s=>esc(tid(s?r.rc:r.bc)),it=[],DRN={o:"Océan",i:"Infernal",m:"Montagne",c:"Nuages",h:"Hextech",t:"Chimtech",e:"Ancestral"};
  const nm=i=>{const k=r.keys&&r.keys[i],p=pkey(k);return esc(p?p.id:String(k||"?").split("_").slice(1).join("_"))};
  if(fb)it.push(`<span><b>${t(fb[0])}</b>1er sang · ${fb[1]>=0?`${nm(fb[1])} sur ${nm(fb[2])}`:`${nm(fb[2])} exécuté`}</span>`);
  if(fd)it.push(`<span><b>${t(fd[0])}</b>1er dragon · ${tm(fd[1])}${DRN[fd[2]]?` (${DRN[fd[2]]})`:""}</span>`);
  if(ft)it.push(`<span><b>${t(ft[0])}</b>1re tour · ${tm(ft[1])}</span>`);if(fn)it.push(`<span><b>${t(fn[0])}</b>1er Baron · ${tm(fn[1])}</span>`);
  if(so)it.push(`<span><b>${t(so[0])}</b>âme · ${tm(so[1])}${DRN[so[2]]?` (${DRN[so[2]]})`:""}</span>`);
  return it.length?`<div class="mom">${it.join("")}</div>`:""}
function gameCurve(g,m,H){const r=g.r;if(!r||!r.cv||r.cv.length<3)return"";const flip=r.bc===m.t2?-1:1,pts=r.cv.map(p=>({t:p[0],gd:p[1]*flip}));
  const win=r.ws===0?r.bc:r.rc,beh=win===m.t1?-Math.min(0,...pts.map(p=>p.gd)):Math.max(0,...pts.map(p=>p.gd));
  return goldCurve(pts,m,beh>=3000?`Remontée : ${tid(win)} mené de ${kf1(beh)}`:"",H)}
function matObjRows(m,g){const f=g.f;if(!f||!f.b)return"";const A=f.b.our===m.t2?f.r:f.b,B=A===f.b?f.r:f.b;
  const dr=(d,rev)=>{const dots=`<span class="mat-drs">${d.map(x=>`<i class="dg" style="background:${DRAG[x]||"#888"}"></i>`).join("")}${kfSoul(d)?`<em class="soul" style="--c:${DRAG[kfSoul(d)]}">âme</em>`:""}</span>`;return rev?dots+d.length:d.length+dots};
  const row=(l,a,b,va,vb)=>`<div class="vl"><b class="${va>vb?"lead":""}">${a}</b><span>${l}</span><b class="${vb>va?"lead":""}">${b}</b></div>`;
  return `<div class="mat-ks">${logo(A.our,26)}<b class="${A.k>B.k?"lead":""}">${A.k}</b><i>kills</i><b class="${B.k>A.k?"lead":""}">${B.k}</b>${logo(B.our,26)}</div>
    ${row("Or",kf1(A.g),kf1(B.g),A.g,B.g)}${row("Tours",A.to,B.to,A.to,B.to)}${row("Dragons",dr(A.dragons||[]),dr(B.dragons||[],1),(A.dragons||[]).length,(B.dragons||[]).length)}${row("Barons",A.ba,B.ba,A.ba,B.ba)}${row("Inhibiteurs",A.in,B.in,A.in,B.in)}`}
/* une partie : en-tête (durée, vainqueur, revoir en VF/VO), score de kills et objectifs, courbe, premiers objectifs, joueur de la partie */
function matGameCard(m,g,short){const w=matGameWin(g),mins=matGameMins(g),f=g.f,v=f&&f.vod;
  let h=`<div class="blk" data-pk="g${g.n}"><div class="bh">${m.bo>1?`Partie ${g.n} · `:""}${mins?matDur(mins):""}${w?`<span class="mat-bhr mat-w">${logo(w,16)}${esc(tid(w))} gagne</span>`:""}</div>`;
  if((!short||m.bo===1)&&v)h+=`<a class="btn mt0 mat-vod" href="https://www.youtube.com/watch?v=${encodeURIComponent(v[0])}&t=${v[1]}s" target="_blank" rel="noopener">${IPLAY}Revoir en ${esc(v[2])}</a>`;
  if(!short)h+=matObjRows(m,g);
  h+=gameCurve(g,m,short?64:84);
  if(!short)h+=`<div style="margin-top:12px">${matMoments(g)}</div>`;
  if(!short&&f&&!f.fin)h+=`<p class="mat-mu">Le flux s’est arrêté avant la fin : chiffres de la dernière image disponible.</p>`;
  if(!g.r&&!f&&!g.u)h+=`<p class="mat-sub" style="margin:0">Feuille de la partie pas encore publiée.</p>`;
  return h+`</div>`+matPogBlk(m,g,short&&m.bo>1)}
function matTabGames(m,d){const live=matKind(m)==="live",G=matGames(m).filter(g=>!live||g.n<=matN(m));const F=matFeedGames(m);
  if(!G.length)return F===undefined?skel(160,2):F===null?matErr("games_"+m.key+"_"+matN(m)):`<p class="empty">Pas encore de partie terminée.</p>`;
  const n=+(d.g||G[G.length-1].n),g=G.find(x=>x.n===n)||G[G.length-1];
  return matSeg(G,g.n)+matGameCard(m,g,false)+(F===undefined?`<p class="note" data-pk="ld">Lecture du flux officiel (rediffusion, objectifs)…</p>`:"")}

/* ===================== 13. match terminé ===================== */
function matTabSummary(m,d){const r=robotPast(m),G=matGames(m),me=picks[m.key];let h="";
  if(r)h+=`<div class="blk mat-verdict" data-pk="rob"><div class="mat-vr">${logo(r.fav,34)}<span class="grow"><span class="wn" style="font-size:28px">${P(r.p)}</span><span class="ws">${esc(tid(r.fav))} favori du robot avant le match</span></span><span class="tag ${r.ok?"on":""}">${r.ok?"vu juste":"surprise"}</span><button class="i" data-info="robot" aria-label="Comment calcule le robot">i</button></div></div>`;
  const pr=me?`Ton prono : <b>${esc(tid(me))}${scores[m.key]?" "+esc(scores[m.key]):""}</b>${m.manual?" (résultat saisi à la main, pas compté)":me===m.winner?`, gagné (+${pts(me,scores[m.key],m)})`:", perdu"}`:"Pas de prono sur ce match";
  h+=(matLea("my",m)||`<div class="blk" data-pk="bets"><p class="mat-say${me?me===m.winner?" ok":" ko":""}">${me?logo(me,22):""}<span>${pr}</span></p></div>`)+matLea("bets",m);
  if(m.manual)h+=matManualBlk(m);
  if(!G.length){const F=matFeedGames(m);return h+(F===undefined?skel(120):`<p class="empty" data-pk="none">Détail des parties pas encore publié.</p>`)}
  if(G.length>1)h+=`<div class="blk" data-pk="gp"><div class="bh">Partie par partie<span class="mat-bhr">touche une partie</span></div><div class="gpills" style="grid-template-columns:repeat(${G.length},minmax(0,1fr))">${G.map(g=>{const w=matGameWin(g);return `<button class="gp" data-gm="${g.n}" style="--c:${w?matCol(m,w):"var(--line)"}"><small>P${g.n}</small>${w?logo(w,22):""}<b>${esc(tid(w)||"?")}</b><small>${matGameMins(g)?Math.floor(matGameMins(g))+"′":""}</small></button>`}).join("")}</div></div>`;
  h+=matGameCard(m,G[G.length-1],true);
  return h}
function matTabDonePlayers(m,d){const G=matGames(m),F=matFeedGames(m);
  if(!G.length)return F===undefined?skel(300):`<p class="empty">Pas encore de détail.</p>`;
  const n=+(d.g||G[G.length-1].n),g=G.find(x=>x.n===n)||G[G.length-1],P=matGamePlayers(g),seg=matSeg(G,g.n,"P");
  if(!P)return seg+(F===undefined?skel(300):`<div class="blk" data-pk="na"><p class="mat-sub" style="margin:0">Stats des joueurs pas encore disponibles (flux officiel injoignable, robot pas encore passé).</p></div>`);
  const sa=matGameT(g,0)===m.t2?1:0,by=(s,r)=>P.find(p=>p.side===s&&p.role===r);
  const cell=(p,rev)=>`<span class="lps${rev?" r":""}"${p.pl?` data-go="p/${esc(p.pl.key)}" role="button"`:""}>${champ(p.c,36)}<span class="txt"><b>${esc(p.n)}</b><small>${p.k}/${p.d}/${p.a} · ${p.cs} CS</small></span></span>`;
  return seg+`<div class="blk" data-pk="pl${g.n}"><div class="bh">Joueurs${m.bo>1?` · partie ${g.n}`:""}<button class="i" data-info="dplayers" aria-label="Lire ce tableau">i</button></div><div class="vhd"><span>${logo(m.t1,18)}${esc(tid(m.t1))}</span><span>${esc(tid(m.t2))}${logo(m.t2,18)}</span></div>${ROLE_ORDER.map(r=>{const a=by(sa,r),b=by(1-sa,r);if(!a||!b)return"";
    return `<div class="lp">${cell(a,0)}<span class="lgd"><small>${ROLE_S[r]}</small>${a.ds!=null&&b.ds!=null?`${Math.round(a.ds*100)}·${Math.round(b.ds*100)}`:""}</span>${cell(b,1)}</div>`}).join("")}${P[0].robot?`<p class="mat-mu">Chiffres du robot (flux officiel injoignable).</p>`:""}</div>`}
/* draft de chaque partie contre nos pronos (draft2 de v13.5) : bans réels (or : annoncés), picks avec leur rang dans nos 3 */
function matTabDraftDone(m,d){if(!DJ)return skel(200);const G=matGames(m),n=+(d.g||(G.length?G[G.length-1].n:1)),g=G.find(x=>x.n===n),seg=matSeg(G,n,"P");
  const P=safe(d2Pred,m,n,false),x=g&&g.f?g.f:null,R=P?safe(d2RealGame,P,x||{b:{},r:{}}):null,C=R?safe(d2Cmp,P,R):null;
  if(!P||!R||!C)return seg+matDraftFeed(m,g);
  const end=P.o&&P.o.e?Date.parse(P.o.e+":00Z"):NaN,late=!isNaN(end)&&Date.now()-end>3*3600e3,sa=P.t[0]===m.t1?0:1,sb=1-sa;
  const ic=(c,cls,sz=34)=>`<span class="${cls||""}">${champ(d2Nm(c),sz)}</span>`;
  let bans="";
  if(C.bans[0])bans=[sa,sb].map(s=>{const b=C.bans[s];return `<div class="banr"><span class="who">${logo(P.t[s],18)}${esc(tid(P.t[s]))}</span><span class="bans">${b.real.map(c=>ic(c,b.pred.some(p=>d2Same(p,c))?"mat-hit":"")).join("")}</span></div>${b.miss.length?`<p class="mat-miss">attendus aussi : ${b.miss.map(c=>champ(d2Nm(c),20)).join("")}</p>`:""}`}).join("");
  else bans=`<p class="mat-sub" style="margin:0 0 6px">${late?"Bans pas encore publiés par gol.gg.":"Vrais bans publiés environ une heure après la partie (gol.gg)."} Bans attendus :</p>`+[sa,sb].map(s=>`<div class="banr"><span class="who">${logo(P.t[s],18)}${esc(tid(P.t[s]))}</span><span class="bans dim">${(P.ban[s]||[]).map(c=>ic(c,"",28)).join("")}</span></div>`).join("");
  const rk=x=>x.c&&x.pr.length?`<small class="mat-rk${x.k>=0?" hit":""}">${x.k===0?"1er":x.k>0?(x.k+1)+"e":"hors top"}</small>`:"";
  const rows=ROLE_ORDER.map((r,i)=>{const a=C.picks[sa][i],b=C.picks[sb][i],na=d2Nm(a.c),nb=d2Nm(b.c),mu=na&&nb?matchup(r,na,nb):null;
    return `<button class="drr mat-dd" data-info="${matSheet("dd|"+m.key+"|"+n+"|"+r,`${ROLES[r]} : ${na||"?"} – ${nb||"?"}`,()=>`${mu?`<p>${esc(mu.txt)}</p>`:""}<p class="mat-mu">Picks probables annoncés : ${esc(tid(P.t[sa]))} ${a.pr.map(c=>esc(d2Nm(c))).join(", ")||"–"} ; ${esc(tid(P.t[sb]))} ${b.pr.map(c=>esc(d2Nm(c))).join(", ")||"–"}.</p>`)}"><span class="s">${ic(a.c,a.c&&a.pr.length?(a.k>=0?"mat-hit":""):"",38)}<span class="txt"><b>${esc(na||"")}</b>${rk(a)}</span></span><span class="rl">${ROLE_S[r]}${mu&&mu.n15>=3?`<small class="${mu.net?"lead":""}">${esc(mu.lbl)}</small>`:""}</span><span class="s r"><span class="txt"><b>${esc(nb||"")}</b>${rk(b)}</span>${ic(b.c,b.c&&b.pr.length?(b.k>=0?"mat-hit":""):"",38)}</span></button>`}).join("");
  return seg+`<div class="blk" data-pk="sum${n}"><p class="mat-why mat-d2s" style="margin:0">${safe(d2Sum,P,C,R,"game",late)}</p></div>
    <div class="blk" data-pk="bans${n}"><div class="bh">Bans${C.bans[0]?`<span class="mat-bhr">liseré or : annoncés</span>`:""}<button class="i" data-info="bansdone" aria-label="Lire les bans">i</button></div>${bans}</div>
    <div class="blk" data-pk="picks${n}"><div class="bh">Picks<span class="mat-bhr">rang dans nos 3 picks probables</span><button class="i" data-info="pickdone" aria-label="Lire les picks">i</button></div><div class="vhd"><span>${logo(m.t1,18)}${esc(tid(m.t1))}</span><span>${esc(tid(m.t2))}${logo(m.t2,18)}</span></div>${rows}<p class="mat-mu">${String(safe(d2Foot,P)).replace(" Petites icônes : les 3 picks probables du joueur."," Toucher un poste : nos 3 picks probables de chaque joueur.")}</p></div>`}
/* repli : le robot n'a pas encore figé de prono pour cette partie ; picks lus dans le flux, matchups */
function matDraftFeed(m,g){const P=g&&matGamePlayers(g);if(!P||P[0].robot&&!g.f)return `<p class="empty" data-pk="na">Draft pas encore publiée par le robot.</p>`;
  const sa=matGameT(g,0)===m.t2?1:0,by=(s,r)=>P.find(p=>p.side===s&&p.role===r);
  return `<div class="blk" data-pk="pk"><div class="bh">Picks<button class="i" data-info="mu" aria-label="Lire les duels de champions">i</button></div><div class="vhd"><span>${logo(m.t1,18)}${esc(tid(m.t1))}</span><span>${esc(tid(m.t2))}${logo(m.t2,18)}</span></div>${ROLE_ORDER.map(r=>{const a=by(sa,r),b=by(1-sa,r);if(!a||!b)return"";const na=champNm(a.c),nb=champNm(b.c),mu=DJ?matchup(r,na,nb):null;
    return `<button class="drr mat-dd" data-info="${matSheet("mu|"+r+"|"+na+"|"+nb,`${na} – ${nb}`,()=>mu?`<p>${esc(mu.txt)}</p>`:"<p>Pas encore de données.</p>")}"><span class="s">${champ(na,38)}<span class="txt"><b>${esc(na)}</b></span></span><span class="rl">${ROLE_S[r]}${mu&&mu.n15>=3?`<small class="${mu.net?"lead":""}">${esc(mu.lbl)}</small>`:""}</span><span class="s r"><span class="txt"><b>${esc(nb)}</b></span>${champ(nb,38)}</span></button>`}).join("")}<p class="mat-mu">Bans et comparaison avec nos pronos dès que le robot a publié cette partie.</p></div>`}

/* ===================== 14. duel de deux joueurs (route d/<a>~<b>/<onglet>) ===================== */
const matVsData=(a,b)=>matAk("amv_"+a.key+"_"+b.key,()=>amVsData(a,b),3);
function scrDuel(d){
  const [ka,kb]=String(d.id||"").split("~"),a=pkey(ka),b=pkey(kb);if(!a||!b)return {title:"Duel",body:`<p class="empty">Duel introuvable.</p>`};
  const xa=rkOf(a),xb=rkOf(b);
  const card=(p,x)=>`<span class="dcard" data-go="p/${esc(p.key)}" role="button" aria-label="Fiche de ${esc(p.id)}">${hcard(p,"mini")}${x?`<b>${ordS(x.i)}</b><small>des ${x.n} ${ROLE_PL[x.role]}</small>`:""}</span>`;
  return {title:`${esc(a.id)} – ${esc(b.id)}<small>${ROLES[a.role]}${a.role!==b.role?" / "+ROLES[b.role]:""}</small>`,info:"duel",head:`<div class="dhead">${card(a,xa)}<span class="dvs">VS</span>${card(b,xb)}</div>`,headKey:d.id,
    tabs:[["du","Duel"],["ch","Champions"],["fo","Forme"]],render:t=>t==="ch"?matDuelChamps(a,b):t==="fo"?matDuelForm(a,b):matDuelMain(a,b),opened:matOpened,needs:[loadFJ(),loadDJ()]};
}
const matDuelCol=(a,b)=>cpair(a.team,b.team);
function matDuelMain(a,b){const D=matVsData(a,b),[ca,cb]=matDuelCol(a,b),A=esc(a.id),Bn=esc(b.id);let h="";
  const one=a.role===b.role&&typeof rkDuel1==="function"?safe(rkDuel1,a.key,b.key):"";
  const B=SJ&&SJ.m?amFn(pBetter,a.key,b.key,a.role):null,ld=SJ&&SJ.lane?amFn(laneDuel,a.key,b.key,a.role,false):null,xa=rkOf(a),xb=rkOf(b);
  const vl=(lab,va,vb,pa,fa=v=>v,fb=fa)=>`<div class="vl"><b class="${pa>.5?"lead":""}">${fa(va)}</b><span>${lab}</span><b class="${pa<.5?"lead":""}">${fb(vb)}</b><span class="vb"><i style="width:calc(${(pa*100).toFixed(1)}% - 1px);background:${ca}"></i><i style="background:${cb}"></i></span></div>`;
  const P99=x=>x>.99?">99"+NB+"%":x<.01?"<1"+NB+"%":P(x);let v="";if(B)v+=vl("Mieux noté",B.p,1-B.p,B.p,P99);if(ld)v+=vl("Devant à 15 min (lane attendue)",ld.p,1-ld.p,ld.p,P);
  const X=D&&D.pair&&D.pair.a;if(X&&X.g)v+=vl(`Face-à-face depuis ${esc(D.since)}`,X.w,X.g-X.w,X.w/X.g);
  if(xa&&xb){const sa=xa.s,sb=xb.s;if(sa&&sb&&sa[2]!=null&&sb[2]!=null)v+=vl("Or à 15 min (saison)",sa[2],sb[2],sa[2]>sb[2]?.6:sa[2]<sb[2]?.4:.5,sgn)}
  /* le verdict : la phrase des duels directs (rkDuel1) puis les barres ; les phrases détaillées de v13.5 (amVsVerdict : points de chances, or attendu,
     dernières rencontres) derrière « i », pour ne pas répéter les barres en toutes lettres */
  const det=D?matSheet("vd|"+a.key+"|"+b.key,"Le verdict en détail",()=>amVsVerdict(a,b,D)+`<p class="mat-mu">Barres : note d’impact (chances d’être le meilleur des deux), lane attendue à 15 min (modèle de lane), face-à-face en lane depuis ${esc(D.since)}, or à 15 min de la saison.</p>`):"";
  h+=`<div class="blk mat-verdict" data-pk="v"><div class="bh">Le verdict${det?`<button class="i" data-info="${det}" aria-label="Le verdict en détail">i</button>`:""}</div>${one?`<p class="mat-why">${one}</p>`:""}${v?`<div class="vhd"><span>${logo(a.team,18)}${A}</span><span>${Bn}${logo(b.team,18)}</span></div>${v}`:""}${D===undefined&&!v?skel(60):D===null?matErr("amv_"+a.key+"_"+b.key):""}</div>`;
  if(D){const E=D.enc||[];
    let r=`<div class="bh">Rencontres en lane<span class="mat-bhr">touche une partie</span></div>`;
    if(X&&X.g&&!one)r+=`<p class="mat-sub">Depuis ${esc(D.since)} : ${amPl(X.g,"partie")}, <b>${A} ${X.w} – ${X.g-X.w} ${Bn}</b>${X.exp!=null?` (d’après la force des équipes, ${A} en aurait gagné ${fx1(X.exp)})`:""}.${X.n15>=3?` Or à 15 min : ${amSg(X.gd/X.n15)} en moyenne pour ${A}.`:""}${D.pair.y&&D.pair.y.g?` En ${esc(D.y)} : ${D.pair.y.w}-${D.pair.y.g-D.pair.y.w}.`:""}</p>`;
    r+=E.length?E.slice(0,3).map((x,i)=>matEncRow(a,b,x,i)).join(""):`<p class="mat-sub" style="margin:0">Aucune rencontre en lane depuis ${esc(D.since)}.</p>`;
    if(E.length>3)r+=`<button class="btn mt0 mat-more" data-info="${matSheet("enc|"+a.key+"|"+b.key,"Toutes leurs rencontres",()=>E.map((x,i)=>matEncRow(a,b,x,i)).join(""))}">${amPl(E.length-3,"rencontre plus ancienne","rencontres plus anciennes")}</button>`;
    h+=`<div class="blk" data-pk="e">${r}</div>`;
    const CO=D.common||[];
    if(CO.length){const better=CO.filter(o=>o.A[1]/o.A[0]>o.B[1]/o.B[0]).length,worse=CO.filter(o=>o.A[1]/o.A[0]<o.B[1]/o.B[0]).length;
      h+=`<div class="blk" data-pk="c">${matRow("Vis-à-vis communs",`${amPl(CO.length,"adversaire")} affronté${CO.length>1?"s":""} par les deux : ${A} fait mieux contre ${better||"aucun"}, ${Bn} contre ${worse||"aucun"}`,matSheet("co|"+a.key+"|"+b.key,"Vis-à-vis communs",()=>matCommonHTML(a,b,CO,D.since)))}</div>`}
    if(!D.fj)h+=`<p class="note" data-pk="nf">Le détail (vis-à-vis communs, champions, forme) arrive dès que le robot a publié ses fiches.</p>`}
  return h+`<button class="btn" data-pk="cmp" data-cmp="${esc(a.key+"|"+b.key)}">Toutes leurs stats ${esc(String(new Date().getFullYear()))} ›</button>`}
function matEncRow(a,b,x,i){const ds=v=>v==null?"–":fx1(v*100)+NB+"%",sc=x.sc&&x.bo>1;
  const det=()=>`<p class="mat-mu">${amWhen(x)}</p><dl class="kv mat-kv3"><dt></dt><dd>${esc(a.id)}</dd><dd>${esc(b.id)}</dd>${x.chA?`<dt>Champion</dt><dd>${esc(x.chA)}</dd><dd>${esc(x.chB)}</dd>`:""}${x.kA?`<dt>K/D/A</dt><dd>${x.kA.join("/")}</dd><dd>${x.kB.join("/")}</dd>`:""}${x.csA!=null?`<dt>CS</dt><dd>${x.csA}</dd><dd>${x.csB}</dd>`:""}${x.dsA!=null||x.dsB!=null?`<dt>Part des dégâts</dt><dd>${ds(x.dsA)}</dd><dd>${ds(x.dsB)}</dd>`:""}</dl>
    <dl class="kv">${x.gd!=null?`<dt>Or à 15 min</dt><dd>${x.gd===0?"égalité":`≈ ${amSg(Math.abs(amR(x.gd,100)))} pour ${esc((x.gd>0?a:b).id)}`}</dd>`:""}${x.csd!=null?`<dt>CS à 15 min</dt><dd>${x.csd===0?"égalité":`+${Math.abs(x.csd)} pour ${esc((x.csd>0?a:b).id)}`}</dd>`:""}${x.min?`<dt>Durée</dt><dd>${Math.round(x.min)} min</dd>`:""}${sc?`<dt>Série (Bo${x.bo})</dt><dd>${esc(x.ca)} ${esc(x.sc)} ${esc(x.cb)}</dd>`:x.bo===1?`<dt>Format</dt><dd>Bo1</dd>`:""}<dt>Vainqueur</dt><dd>${esc((x.w?a:b).id)}</dd></dl>`;
  return `<button class="lp mat-enc" data-info="${matSheet("e|"+a.key+"|"+b.key+"|"+i,`${x.chA?x.chA+" – "+x.chB:"Rencontre"}`,det)}"><span class="lps">${x.chA?champ(x.chA,32):""}<span class="txt"><b class="${x.w?"lead":"trail"}">${x.kA?x.kA.join("/"):x.w?"V":"D"}</b><small>${amDay(x.date,x.h)}</small></span></span><span class="lgd"><small>${esc(amComp(x.comp))}</small>${x.w?"V":"D"}</span><span class="lps r">${x.chB?champ(x.chB,32):""}<span class="txt"><b class="${x.w?"trail":"lead"}">${x.kB?x.kB.join("/"):""}</b><small>${x.gd!=null?sgn(-Math.round(x.gd/100)*100||0)+" or à 15′":""}</small></span></span></button>`}
function matCommonHTML(a,b,CO,since){const cell=(s,me)=>`<em class="${me?"lead":""}">${s[1]}-${s[0]-s[1]}<small>${s[3]>=3?amSg(s[2]/s[3])+" à 15′":amPl(s[0],"partie")}</small></em>`;
  return `<div class="mat-co hd"><span></span><em>${esc(a.id)}</em><em>${esc(b.id)}</em></div>${CO.map(o=>{const ra=o.A[1]/o.A[0],rb=o.B[1]/o.B[0],pl=o.key&&pkey(o.key);
    return `<div class="mat-co"><span>${pl?`<button data-matgo="p/${esc(pl.key)}">${logo(pl.team,14)} <b>${esc(o.nm)}</b></button>`:`<b>${esc(o.nm)}</b> <small>${esc(o.tm)}</small>`}</span>${cell(o.A,ra>rb)}${cell(o.B,rb>ra)}</div>`}).join("")}
    <p class="mat-mu">Depuis ${esc(since)} : victoires et défaites de leur équipe quand ils étaient face à cet adversaire en lane, puis l’or à 15 min moyen (3 parties mesurées au moins). Le bilan dépend surtout de la force des équipes.</p>`}
function matDuelChamps(a,b){const D=matVsData(a,b);if(D===undefined)return skel(120,2);if(D===null)return matErr("amv_"+a.key+"_"+b.key);
  const A=esc(a.id),Bn=esc(b.id),pk=L=>L&&L.length?L.map(z=>`<span class="chc">${champ(z[0],32)}<span>${z[1]?`${z[1]}/${z[2]}`:"–"}</span></span>`).join(""):`<span class="mat-sub">–</span>`;
  let h=`<div class="blk" data-pk="pp"><div class="bh">Picks probables<span class="mat-bhr">90 derniers jours</span><button class="i" data-info="picks" aria-label="Fiabilité des picks">i</button></div><div class="mat-pp"><b>${A}</b><span>${pk(D.pa)}</span></div><div class="mat-pp"><b>${Bn}</b><span>${pk(D.pb)}</span></div></div>`;
  const Pv=D.pvp;if(Pv&&Pv.cells&&Pv.cells.length)h+=`<div class="blk" data-pk="g"><div class="bh">Leurs picks face à face</div>${matPvpHTML({a:a.id,b:b.id,A:Pv.A.map(c=>({c})),B:Pv.B.map(c=>({c})),cells:Pv.cells,txt:Pv.txt})}</div>`;
  if(!D.fj)return h+`<p class="note">Champions joués : dès que le robot a publié ses fiches.</p>`;
  const ch=C=>!C||!C.rows.length?`<p class="mat-sub">Aucune partie en ${esc(D.y)}.</p>`:C.rows.map(c=>`<div class="mat-ch">${champ(c.c,28)}<span><b>${esc(c.c)}</b><small>${c.w}-${c.g-c.w}, KDA ${fx1(c.kda)}${c.n15>=3?`, ${amSg(c.gd)} à 15′`:""}</small></span></div>`).join("");
  return h+`<div class="blk" data-pk="cj"><div class="bh">Champions joués en ${esc(D.y)}</div><div class="mat-cc"><div><b class="mat-cn">${A}</b>${ch(D.ca)}</div><div><b class="mat-cn">${Bn}</b>${ch(D.cb)}</div></div><p class="mat-mu">Testé sur 2025-2026 : croiser les picks préférés des deux joueurs ne prédit pas le vainqueur.</p></div>`}
function matDuelForm(a,b){const D=matVsData(a,b);if(D===undefined)return skel(120,2);if(D===null)return matErr("amv_"+a.key+"_"+b.key);
  if(!D.fj||(!D.fa&&!D.fb))return `<p class="empty">La forme arrive dès que le robot a publié ses fiches.</p>`;
  const one=(p,F)=>{if(!F||!F.last.length)return `<div class="blk" data-pk="${esc(p.key)}"><div class="bh">${esc(p.id)}</div><p class="mat-sub" style="margin:0">Aucune partie en ${esc(D.y)}.</p></div>`;
    const L=F.last,w=L.filter(x=>x.w).length,k=L.reduce((s,x)=>[s[0]+x.k,s[1]+x.d,s[2]+x.a],[0,0,0]),g=L.filter(x=>x.gd!=null),S=F.S;
    return `<div class="blk" data-pk="${esc(p.key)}"><div class="bh">${esc(p.id)}${F.tag?` <span class="tag ${F.tag==="hausse"?"on":"mat-tw"}">en ${F.tag}</span>`:""}<span class="mat-bhr">10 dernières parties</span></div><div class="mat-f10">${L.map(x=>`<i class="${x.w?"fw":"fl"}" title="${esc(x.date)}">${x.c?champ(x.c,28):x.w?"V":"D"}</i>`).join("")}</div>
      <p class="mat-sub" style="margin:8px 0 0"><b>${w} V – ${L.length-w} D</b>, KDA ${fx1((k[0]+k[2])/Math.max(1,k[1]))}${g.length?`, ${amSg(g.reduce((s,x)=>s+x.gd,0)/g.length)} d’or à 15 min`:""} · saison ${S.w}-${S.g-S.w}, KDA ${fx1((S.k+S.a)/Math.max(1,S.d))}</p></div>`};
  return one(a,D.fa)+one(b,D.fb)+`<p class="note" data-pk="n">La plus récente à gauche. « En hausse » ou « en baisse » seulement si l’écart avec la saison est net. Testé : 10 parties ne prédisent presque pas les 10 suivantes.</p>`}

/* ===================== 15. moments animés (une fois, jamais aux rafraîchissements ; rien si mouvement réduit) ===================== */
/* 1. barre du robot : de 50/50 à son verdict, puis un éclat sur le favori */
function matAnimRobot(el){const b=el.querySelector(".mat-robot .wpb i");if(!b||!b.animate)return;const w=b.style.width;
  b.animate([{width:"calc(50% - 1px)"},{width:w}],{duration:900,easing:"cubic-bezier(.2,.9,.25,1)"});
  const n=el.querySelector(".mat-robot .n.lead");if(n)n.animate([{textShadow:"0 0 0 rgba(240,230,210,0)"},{textShadow:"0 0 24px rgba(240,230,210,.95)"},{textShadow:"0 0 0 rgba(240,230,210,0)"}],{duration:1000,delay:650})}
/* 3. pastilles des rencontres en cascade (une fois par duel et par écran) */
function matMotion(el){const done=el._mp||(el._mp=new Set());
  const run=()=>el.querySelectorAll(".mat-pips[data-pp]").forEach((p,ri)=>{const k=p.dataset.pp;if(done.has(k))return;done.add(k);
    p.querySelectorAll("i").forEach((i,j)=>{if(i.animate)i.animate([{opacity:0,transform:"scale(.3)"},{opacity:1,transform:"none"}],{duration:300,delay:120+ri*45+j*70,easing:"cubic-bezier(.3,1.35,.5,1)",fill:"backwards"})})});
  run();if(window.MutationObserver){const o=new MutationObserver(run);o.observe(el,{childList:true,subtree:true});el._mpo=o}}

/* ===================== 16. feuilles « i » ===================== */
INFO.prono=()=>["Ce match","Aperçu : le prono du robot, ton prono, les clés du match et où le regarder. Joueurs : un duel par poste (touche-le pour le détail). Draft : bans attendus, picks probables et champions déjà joués dans la série. Équipes : face-à-face, forme, saison 2026. Reviens d’un glissement depuis le bord gauche."];
INFO.robot=()=>{const F=SJ&&SJ.fiab,E=F&&F.t&&F.t.E,w=fiabW26();return ["Comment calcule le robot",`<p>Il additionne la note d’impact des 5 joueurs de chaque équipe (corrigée de la force des ligues), puis simule la suite du tournoi ${(SJ&&SJ.sim&&SJ.sim.n||20000).toLocaleString("fr-FR")} fois. Sur une série en cours, le score déjà joué est compris.</p>`+(E?`<p>Testé à l’aveugle sur <b>${E.g[0]}</b> parties internationales : bon favori <b>${Math.round(E.g[3]*100)} %</b> du temps, et quand il annonce 75 %, l’équipe gagne environ 72 % du temps.</p>`:"")+(w?`<p>À ces Worlds : <b>${w.ok}/${w.n}</b> bons favoris.</p>`:"")+`<p>Les surprises restent fréquentes, c’est ce qui rend les Worlds beaux.</p><button class="btn" data-matgo="sim/rob">Le robot a-t-il vu juste ? ›</button>`,true]};
INFOP.cles=id=>{const m=mOf(id),row=m&&SJ&&SJ.pm?safe(pmRow,m):null,C=SJ&&SJ.pm&&SJ.pm.ref&&SJ.pm.ref.cal,cal=row?safe(calTxt,row[6]):"";
  return ["Les clés du match",`<p>Chaque fait a été rejoué sur les ${amNf(C&&C.tout?C.tout.n:5810)} parties pro de 2025-2026 (dont ${amNf(C&&C.intl?C.intl.n:396)} internationales), avec seulement ce qui était connu avant le match.</p><p><b>Pèse</b> : change vraiment les chances (note d’impact des joueurs, côté). <b>Pour info</b> : va dans le même sens que la note, sans rien ajouter. <b>À surveiller</b> : piste vue aux internationales sur trop peu de séries pour conclure.</p><p>Testés et sans effet : forme des joueurs, picks préférés, expérience des Worlds, joueurs qui « se transforment » aux internationales.</p>${cal?`<p>${cal}</p>`:""}${SJ&&SJ.pm?safe(refTable):""}`,true]};
INFOP.keys=(a,b)=>matKeyInfo("keys",a,b);INFOP.key=(a,b)=>matKeyInfo("key",a,b);
function matKeyInfo(t,a,b){const m=mOf(a),row=m&&safe(pmRow,m);if(!row)return null;
  const why=t==="keys"?safe(whyLine,row):"",L=t==="key"?[row[7][+b]]:row[7],seen=new Set();
  const lines=L.map(z=>{const x=safe(keyLine,z,row);if(!x)return"";if(x.r&&x.tag!=="on"&&t==="keys"){const s=z[0]+"|"+x.r.slice(0,12);if(seen.has(s))x.r="";seen.add(s)}const tg=MAT_TAG[x.tag]||MAT_TAG[""];return `<p><span class="tag ${tg[0]}">${tg[1]}</span> ${x.h}</p>${x.r?`<p class="mat-mu">${x.r}</p>`:""}`}).join("");
  return [t==="key"?"La clé en détail":"Les clés du match",(why?`<p>${why}</p>`:"")+lines+`<p class="mat-mu">${safe(calTxt,row[6])}</p>`,true]}
INFO.direct=()=>["Le direct","Flux officiel LoL Esports, environ 30 secondes de retard sur le stream, mis à jour toutes les 10 secondes. Le fil est reconstitué en comparant les images du flux : il se complète tout seul depuis le début de la partie. Direct : le fil, l’écart d’or, les fights, les duels et le joueur du match. Joueurs : le tableau du match. Draft : la draft de la partie contre nos pronos. Glisse sur le contenu pour changer d’onglet."];
INFO.wp=()=>["Chances de victoire","Estimation maison à partir de l’écart d’or, des tours, inhibiteurs, Barons et dragons (âme comprise), ajustée selon la durée de la partie. Ce n’est pas un chiffre officiel. Tendance : variation de l’écart d’or sur les dernières minutes (jusqu’à 5)."];
INFO.termine=()=>["Match terminé","Résumé : ce que le robot avait annoncé, ton prono, la dernière partie (courbe d’or, premiers objectifs, joueur de la partie). Parties : chaque partie et sa rediffusion. Joueurs : K/D/A, CS et part des dégâts. Draft : la draft jouée contre nos pronos. Avant : l’avant-match tel qu’il était. Stats détaillées : flux officiel ; débrief et draft : robot (bans relevés sur gol.gg)."];
INFO.pog=()=>["Joueur de la partie","Dans l’équipe gagnante : 3 points par kill, 2 par assistance, −3 par mort, plus la moitié de sa part de l’or et la moitié de sa part des dégâts de l’équipe. Même formule que le direct de l’appli. Ce n’est pas le titre officiel."];
INFO.bans=()=>["Bans attendus",(DJ?esc(djFi(DJ).b)+" ":"")+"Calcul : bans déjà vus à ces Worlds, champions les plus joués par les 5 joueurs visés sur 90 jours, habitudes de l’équipe qui bannit. Touche un champion pour la raison."];
INFO.picks=()=>["Picks probables",(DJ?esc(djFi(DJ).p)+" ":"")+"« 6/42 » : joué 6 fois sur ses 42 parties des 90 derniers jours. Touche un poste pour croiser les picks des deux joueurs."];
INFO.bansdone=()=>["Bans","Bans relevés sur gol.gg, publiés environ une heure après la partie, dans l’ordre de la draft. Liseré or : bans que l’appli avait annoncés avant la partie. « Attendus aussi » : nos autres bans annoncés, qui ne sont pas tombés."];
INFO.roles=()=>{const C=SJ&&SJ.pm&&SJ.pm.ref,du=C&&C.duel&&C.duel.tout;return ["Duel par poste",`<p><b>Au centre</b> : leur bilan face à face depuis 2024 (victoires de leur équipe, toutes compétitions), puis leurs 5 dernières rencontres, la plus récente à gauche : « + » quand le joueur de gauche était devant à l’or à 15 min, « − » quand il était derrière, « · » écart non mesuré. Dessous : l’écart médian sur ces parties, et la lane attendue (probabilité d’être devant à 15 min selon le modèle de lane, testé à l’aveugle : 56 % de bons pronos sur 1 715 duels).</p><p><b>Nom en or</b> : le mieux noté des deux (note d’impact du robot, au moins 60 % de chances d’être le meilleur). Avec le côté, c’est le seul signal d’avant-match qui prédit le vainqueur.${du?` Avoir dominé ses derniers duels n’ajoute rien : ${amPc(du[1]/du[0])} de victoires sur ${amNf(du[0])} parties, ${amPc(du[2]/du[0])} prévus par la note.`:""}</p><p><b>Sous le nom</b> : rang au poste parmi les titulaires des Worlds, KDA de ses 10 dernières parties (la flèche n’apparaît que si l’écart avec sa saison est net) et ses 3 picks les plus probables, champions déjà joués dans la série retirés. Touche un poste pour le duel complet.</p>`,true]};
INFO.lplayers=()=>["Tableau du match","<p>Champion avec son niveau, grisé quand le joueur est mort ; K/D/A et CS ; or et part des dégâts de l’équipe. Au centre : écart d’or entre les deux joueurs du poste, la flèche pointe vers celui qui mène. Touche un joueur pour le détail (participation, balises, objets).</p><p>K/D/A, CS, or et niveau : toutes les 10 s. Part des dégâts, balises et objets : flux détaillé, lu au plus une fois toutes les 30 s. Le flux ne donne ni les dégâts totaux, ni la vision, ni les ganks : à la place, « kills avec le jungler avant 15 min », lus dans le fil quand il est complet.</p>",true];
INFO.dplayers=()=>["Joueurs de la partie","K/D/A et CS en fin de partie, lus dans le flux officiel (sinon chez le robot). Au centre : part des dégâts de l’équipe de chacun (%). Touche un joueur pour sa fiche."];
INFO.pickdone=()=>["Picks","Champions joués, poste par poste. Liseré or et rang : le champion figurait dans les 3 picks probables annoncés par l’appli avant la partie (1er, 2e ou 3e) ; « hors top » sinon. Au centre : avance d’or à 15 min de ce duel de champions en pro depuis 2025 (« ≈ » : pas d’écart net). Touche un poste pour le détail."];
INFO.mu=()=>["Duels de champions","Au centre : avance d’or à 15 min de ce champion contre celui d’en face, en pro depuis 2025 (au moins 3 parties). « ≈ » : pas d’écart net. L’avance de couloir ne dit pas qui gagne la partie."];
INFO.duel=()=>{const C=SJ&&SJ.pm&&SJ.pm.ref&&SJ.pm.ref.cal&&SJ.pm.ref.cal.tout,du=SJ&&SJ.pm&&SJ.pm.ref&&SJ.pm.ref.duel&&SJ.pm.ref.duel.tout;
  return ["Le duel",`<p>Rencontres : parties officielles LoL Esports où ils étaient face à face au même poste, depuis 2024 (qualifications EWC absentes). L’or à 15 min d’une partie est arrondi à 100 : le flux officiel s’écarte de gol.gg de 35 d’or en médiane.</p><p>Note d’impact : KDA, participation, or, CS et avance à 15 min, corrigés de la force des adversaires et des ligues.${C?` Avec le côté, c’est le seul signal d’avant-match qui prédit le vainqueur : le favori qu’elle désigne a gagné ${amPc(C.fav/C.n)} des ${amNf(C.n)} parties de 2025-2026.`:""} Lane attendue : modèle de lane du robot ; il prévoit la lane, pas la victoire.</p><p>Testé et sans valeur de plus que la note : avoir dominé les derniers duels${du?` (${amPc(du[1]/du[0])} de victoires pour ${amPc(du[2]/du[0])} prévus)`:""}, la forme récente, les picks préférés.</p>`,true]};

/* ===================== 17. branchements ===================== */
defScreen("m",{arg:"idtab",screen:scrMatch});
defScreen("d",{arg:"idtab",screen:scrDuel});   // duel de deux joueurs (Joueurs d'un match, data-vs de v13.5)
/* partie choisie : pastille du Résumé ou sélecteur d'un onglet */
onAct("[data-gm]",gn=>{const el=gn.closest(".scr");if(!el)return;el._d.g=+gn.dataset.gm;if(el._d.tab==="gm")refreshTab(el,0);else setTab(el,"gm")});
onAct("[data-game]",gm=>{const el=gm.closest(".scr");if(!el)return;el._d.g=+gm.dataset.game;vib(6);refreshTab(el,0)});
/* résultat saisi à la main (comme v13.5 : toucher à nouveau efface ; l'officiel l'écrase) */
onAct("[data-win]",b=>{const k=b.dataset.mk,w=b.dataset.win;if(manual[k]===w)delete manual[k];else manual[k]=w;LS.set("manual",manual);
  MATCHES.forEach(x=>{if(x.key===k&&x.manual){x.winner=null;x.manual=false}});MATCHES=finalize(MATCHES);vib(12);
  toast(manual[k]?`Résultat noté : ${tid(w)} a gagné`:"Résultat effacé");closeSheet();onData()});
/* aller vers un écran depuis une feuille : la feuille se ferme d'abord (son entrée d'historique), puis l'écran s'ouvre */
onAct("[data-matgo]",b=>{const r=b.dataset.matgo;if(!SHEET.open){go(r);return}closeSheet();const t0=Date.now();(function w(){if(!SHEET.open||Date.now()-t0>700)go(r);else setTimeout(w,30)})()});
onAct("[data-matretry]",b=>{const k=b.dataset.matretry,a=AK[k];if(a){a.started=false;a.st="load"}matRedraw()});
onAct(".bt.mat-mini",bt=>{const el=bt.closest(".scr");if(el)el.scrollTo({top:0,behavior:RM?"auto":"smooth"})});
/* un match passe en direct : on suit son flux (une seule partie suivie à la fois) */
BUS.on("data",()=>{const lv=MATCHES.find(x=>x.state==="live");if(lv)watchLive(lv)});
/* pari posé ou annulé, ligue mise à jour : l'écran du match concerné se redessine (score exact, paris de la ligue) */
BUS.on("pick",k=>NAV.forEach(x=>{if(x.d.v!=="m"||!x.el.isConnected)return;const m=mOf(x.d.id);if(m&&m.key===k)rerender(x.el)}));
BUS.on("league",()=>NAV.forEach(x=>{if(x.d.v==="m"&&x.el.isConnected)rerender(x.el)}));
