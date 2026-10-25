/* =====================================================================================
   team.js — ÉQUIPES : liste des 19 équipes (teams, filtre par ligue) et fiche équipe (t/<id>/<onglet> : Aperçu · Saison · Matchs).
   Propriétaire : agent joueurs (d'après sa mission ; voir DEMANDES.md). Styles .tea-* rangés dans players.css.
   Calculs repris de v13.5 : renderTeams/tform/tnext, teamSheet, rkTeamBrief, flTeamHTML, renderTeamSeason, h2h (SJ du robot).
   ===================================================================================== */
const TEA={lg:"all"};
const TEA_ISTAR=`<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2.8 2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/></svg>`;
/* séries terminées d'une équipe à ces Worlds, de la plus ancienne à la plus récente */
const teaDone=id=>MATCHES.filter(m=>m.winner&&(m.t1===id||m.t2===id)).sort((a,b)=>String(a.start).localeCompare(String(b.start)));
const teaNext=id=>MATCHES.find(m=>!m.winner&&m.state!=="done"&&m.t1&&m.t2&&(m.t1===id||m.t2===id))||null;
const teaPips=L=>L?`<span class="tea-pips" aria-hidden="true">${[0,1].map(i=>`<i class="${i<L.n-1?"on":""}"></i>`).join("")}</span>`:"";
const teaOpp=(m,id)=>m.t1===id?m.t2:m.t1;
/* « ce soir 01:00 contre DK », « EN DIRECT contre DK » (tnext de v13.5) */
function teaNextTxt(m,id){const o=teaOpp(m,id),d=new Date(m.start),vs=` contre ${logo(o,14)}<b>${esc(tid(o))}</b>`;
  if(m.state==="live")return `<em class="lv">EN DIRECT</em>${vs}`;if(m.state==="wait")return `résultat en attente${vs}`;
  return esc(dayKeyL(d)===dayKeyL(new Date())?(d.getHours()<6?"cette nuit ":"ce soir ")+fmtTime(d):d.toLocaleDateString("fr-FR",{weekday:"short"})+" "+fmtTime(d))+vs}
const teaFormHTML=(id,n=5)=>{const L=teaDone(id).slice(-n);return L.length?`<span class="tea-tf">${L.map(m=>`<i class="${m.winner===id?"ply-w":"ply-l"}" title="${esc(tid(teaOpp(m,id)))}">${m.winner===id?"V":"D"}</i>`).join("")}</span>`:""};

/* =====================================================================================
   1. LES 19 ÉQUIPES (teams) : filtre par ligue, cartes (éliminées en dernier)
   ===================================================================================== */
function scrTeams(){return {title:`Les ${TEAMS.length} équipes<small>Worlds 2026</small>`,info:"teams",render:()=>teaListBody()}}
function teaListBody(){
  const R=records(),f=TEA.lg,list=TEAMS.filter(t=>f==="all"||t.league===f).sort((a,b)=>(status(a.id,R).k==="out")-(status(b.id,R).k==="out"));
  const seg=`<div class="ply-seg tea-lgs" role="group" aria-label="Ligue">${[["all","Toutes"],...Object.keys(LEAGUES).map(k=>[k,k])].map(([k,l])=>`<button data-tealg="${k}" aria-pressed="${f===k}">${l}</button>`).join("")}</div>`;
  return seg+`<div class="tea-grid">${list.map(t=>{const st=status(t.id,R),P=teamPlayers(t.id),nats=[...new Set(P.map(p=>p.cc))],L=lives(t.id,R),nx=teaNext(t.id),fm=teaFormHTML(t.id);
    return `<button class="pl tea-card${st.k==="out"?" out":""}" style="--tc:${t.color}" data-go="t/${t.id}" aria-label="${esc(t.name)}, ${esc(st.txt)}">
      <span class="wm">${logo(t.id,110)}</span><span class="hd">${logo(t.id,36)}<b>${esc(t.name)}</b>${fav===t.id?`<i class="tea-star" title="Mon équipe">${TEA_ISTAR}</i>`:""}</span>
      <span class="ln">${flag(t.cc)}${esc(t.seed)}${P.some(p=>p.titles.length)?`<i class="ply-cup" title="Un champion du monde dans l’effectif">${ICUP}</i>`:""}</span>
      ${nats.length>1?`<span class="ln fls">${P.map(p=>flag(p.cc)).join("")}</span>`:""}
      ${fm?`<span class="ln">${fm}</span>`:""}${L?`<span class="ln">${teaPips(L)}${esc(L.txt)}</span>`:""}${nx?`<span class="ln nx">${teaNextTxt(nx,t.id)}</span>`:""}
      <span class="tea-st ${st.k}">${esc(st.txt)}</span></button>`}).join("")}</div>`}
onAct("[data-tealg]",b=>{TEA.lg=b.dataset.tealg;vib(6);const el=plyTop("teams");if(el)refreshTab(el,0)});
INFO.teams=()=>["Les équipes","Les 19 équipes des Worlds, les éliminées en dernier. Sur chaque carte : tête de série, nationalités de l’effectif, forme aux Worlds (5 dernières séries), défaites encore permises, prochain match et statut. Touche une carte pour la fiche."];

/* =====================================================================================
   2. FICHE ÉQUIPE (t/<id>/<onglet>)
   ===================================================================================== */
function scrTeam(d){
  const t=T[d.id];if(!t)return {title:"Équipe",body:`<p class="empty">Équipe introuvable.</p>`};
  const R=records(),st=status(t.id,R),L=lives(t.id,R);
  const head=`<div class="tea-hero" style="--tc:${t.color}"><span class="wm">${logo(t.id,190)}</span>
    <div class="tea-hin">${logo(t.id,60)}<div class="tea-hid"><h2>${esc(t.name)}</h2><p>${flag(t.cc)} ${esc(t.seed)} · ${t.entry==="pi"?"entrée au Play-In":"entrée en phase suisse"}</p></div></div>
    ${t.note?`<p class="tea-note">${esc(t.note)}</p>`:""}
    <div class="tea-hst"><span class="tea-st ${st.k}">${esc(st.txt)}</span>${L?`<span class="tea-lv">${teaPips(L)}${esc(L.txt)}</span>`:""}<button class="tea-fav" data-fav="${t.id}" aria-pressed="${fav===t.id}">${TEA_ISTAR}${fav===t.id?"Mon équipe":"Suivre"}</button></div>${teaTrail(t.id)}</div>`;
  return {title:`${esc(t.name)}<small>${esc(t.league)} · ${esc(LEAGUES[t.league]||"")}</small>`,info:"equipe",head,tabs:[["ap","Aperçu"],["sa","Saison"],["ma","Matchs"]],
    render:tb=>tb==="sa"?teaSa(t):tb==="ma"?teaMa(t):teaAp(t),mount:plyFitOn,needs:[plyNeedSJ()]};
}
/* parcours aux Worlds dans le héros (swiTrail du module suisse : une case par série, le prochain match en pointillés, les places
   suisses restantes) + le prochain match en clair (tnext de v13.5) ; "" si le module suisse manque (repli : bloc « À ces Worlds » de l'Aperçu) */
function teaTrail(id){if(typeof swiTrail!=="function"||typeof swiState!=="function")return"";const tr=safe(swiTrail,id,swiState());if(!tr)return"";const nx=teaNext(id);
  return `<div class="tea-htr">${tr}${nx?`<span class="tea-hnx">${teaNextTxt(nx,id)}</span>`:""}</div>`}
function teaAp(t){
  const id=t.id,R=records(),st=status(id,R),nx=teaNext(id),D=teaDone(id);let h="";
  /* à ces Worlds : dans le héros (teaTrail) ; ici seulement sans parcours (module suisse absent) : forme (séries), prochain match */
  if(!teaTrail(id))h+=`<div class="blk"><div class="bh">À ces Worlds${D.length?`<span class="tag">${D.filter(m=>m.winner===id).length}–${D.filter(m=>m.winner!==id).length} en séries</span>`:""}</div>
    ${`${D.length?`<div class="tea-fps">${D.slice(-5).map(m=>{const o=teaOpp(m,id),w=m.winner===id;return `<button class="tea-fp ${w?"ply-w":"ply-l"}" data-go="m/${esc(m.id)}" aria-label="${w?"Victoire":"Défaite"} contre ${esc(tid(o))}">${logo(o,20)}<b>${w?"V":"D"}</b><small>${m.s1!=null?(m.t1===id?`${m.s1}-${m.s2}`:`${m.s2}-${m.s1}`):""}</small></button>`}).join("")}</div>`:""}
    ${nx?`<div style="margin-top:${D.length?"8px":"0"}">${mrow(nx)}</div>`:`<p class="ply-sub" style="margin-top:${D.length?"10px":"0"}">${st.k==="out"?esc(st.txt)+".":/Champion/.test(st.txt)?"Champion du monde 2026.":"Prochain adversaire pas encore tiré."}</p>`}`}</div>`;
  /* les cinq : portraits sans défilement horizontal */
  h+=`<div class="blk"><div class="bh">Les cinq<span class="tag">${[...new Set(teamPlayers(id).map(p=>p.cc))].map(c=>flag(c)).join("")}</span></div><div class="tea-five">${teamPlayers(id).map(p=>{const x=rkOf(p);
    return `<button class="pl tea-pl" data-go="p/${esc(p.key)}" style="--tc:${t.color}" aria-label="${esc(p.id)}, ${ROLES[p.role]}"><span class="ph">${photo(p,"fill")}<span class="ro">${ROLE_S[p.role]}</span>${p.titles.length?`<span class="cup">${ICUP}${p.titles.length}</span>`:""}</span><b>${esc(p.id)}</b><small>${x?`${ordi(x.i)} ${RK_ROLE1[x.role]}`:flag(p.cc)}</small></button>`}).join("")}</div></div>`;
  h+=teaBrief(t);
  h+=plyFactsBlk([id,...teamPlayers(id).map(p=>p.key)],1);
  return h}
/* le robot en bref (rkTeamBrief de v13.5) : Force, Chances, Joueurs, Grands tournois ; le détail au toucher */
function teaBrief(t){
  const id=t.id,R=RKX(),S=SJ&&SJ.sim,M=SJ&&SJ.m,rows=[];
  const inS=!!(S&&S.S&&S.S[id]!=null),src=inS?S.S:M&&M.t;
  if(src&&src[id]!=null){const L=Object.entries(src).sort((a,b)=>b[1]-a[1]),i=L.findIndex(z=>z[0]===id)+1;
    rows.push(plyLn("Force",`${rkFem(i)} force sur ${L.length} <em>(${fx2(src[id])})</em>`,`data-info="${xi("tf|"+id,()=>["La force des équipes",`<p>${inS?"Équipes de la phase suisse":"Équipes des Worlds"} : somme des notes d’impact des 5 titulaires (niveau des adversaires et des ligues compris).</p><div class="tea-fl">${L.map(([x,v],j)=>`<button class="tea-fr${x===id?" me":""}" data-go="t/${esc(x)}"><span>${j+1}</span>${logo(x,20)}<b>${esc(tid(x))}</b><i><i style="width:${Math.max(2,v/L[0][1]*100).toFixed(1)}%"></i></i><em>${fx2(v)}</em></button>`).join("")}</div>`,true])}"`))}
  const e=S&&S.eq&&S.eq[id],st=status(id,records());
  if(e&&st.k!=="out"){const nx=(S.mt||[]).find(r=>r[1]===id||r[2]===id),lab=["3-0","3-1","3-2","2-3","1-3","0-3"];
    rows.push(plyLn("Chances",`Titre ${rkPct(e[10])}${NB}%, finale ${rkPct(e[9])}${NB}%<small>demies ${rkPct(e[8])}${NB}%, quarts ${rkPct(e[7])}${NB}%</small>`,`data-info="${INFOP.swt?"swt:"+esc(id):xi("tc|"+id,()=>["Ses chances selon le robot",`<p>Titre <b>${rkPct(e[10])}${NB}%</b>, finale ${rkPct(e[9])}${NB}%, demies ${rkPct(e[8])}${NB}%, quarts ${rkPct(e[7])}${NB}%.</p><p>Bilan final probable en phase suisse (actuel : ${esc(e[0])}) :</p><div class="tea-dist">${lab.map((l,j)=>`<span><i style="height:${Math.max(2,e[1+j]*100).toFixed(0)}%"></i><b>${rkPct(e[1+j])}${NB}%</b><small>${l}</small></span>`).join("")}</div>${nx?`<p>Prochain match contre ${esc(tid(nx[1]===id?nx[2]:nx[1]))} (Bo${nx[3]}) : <b>${rkPct(nx[1]===id?nx[4]:1-nx[4])}${NB}%</b> de chances.</p>`:""}<p class="small">${((S.n)||20000).toLocaleString("fr-FR")} tournois simulés avec les résultats déjà acquis. Probabilités du robot, pas des certitudes.</p><button class="btn" data-go="sim">Qui va gagner ces Worlds ? ›</button>`,true])}"`))}
  const P=teamPlayers(id).map(p=>rkFind(p.key)).filter(Boolean);
  if(P.length){const S2=[...P].sort((a,b)=>a.i-b.i),top=S2.filter(x=>x.i<=5),sh=(top.length?top:S2.slice(0,1)).slice(0,3);
    rows.push(plyLn("Joueurs",`${esc(sh.map(x=>`${rkNm(x.key)} ${rkOrd(x.i)}`).join(", "))}`,`data-info="${xi("tj|"+id,()=>["Ses joueurs au classement",`<p>Rang de la note d’impact parmi les titulaires du poste, ligues comprises. Touche un joueur pour sa fiche.</p><div class="list">${P.map(x=>{const p=pkey(x.key);return p?`<button class="ply-rkr" data-go="p/${esc(p.key)}"><span class="n">${x.i}${x.lo!==x.hi?`<small>${x.lo}–${x.hi}e</small>`:""}</span>${photo(p,"ava",38)}<span class="tx"><b>${esc(p.id)}</b><small>${ROLE_S[p.role]} · ${rkLine(x)}</small></span><em class="${x.note<0?"neg":""}">${fxs(x.note)}</em></button>`:""}).join("")}</div>`,true])}"`))}
  const wt=R&&R.T?teaWT1(id):null;
  if(wt)rows.push(plyLn("Grands tournois",`${wt[0]}<small>${wt[1]}</small>`,`data-info="${xi("tw|"+id,()=>["Aux grands tournois",rkWorldsT2(id),true])}"`));
  return rows.length?`<div class="blk tea-brief"><div class="bh">Le robot en bref<button class="i" data-info="teabrief" aria-label="D’où viennent ces lignes">i</button></div><div class="ply-lns">${rows.join("")}</div></div>`:(SJ||PLY.sjDone?"":skel(120))}
/* grands tournois en une ligne : victoires réelles − attendues et le verdict de rkWorldsT1 (v13.5) : « net » au-delà du hasard (v[7]),
   comme prévu si l'écart est sous une erreur type (|v[3]| < 1), sinon dans la marge d'erreur ; le détail (rkWorldsT2) au toucher */
function teaWT1(id){const R=RKX(),v=R&&R.T&&R.T[id];if(!v||!v[0])return null;const x=v[1]-v[2];
  const lab=v[7]>0?"au-delà du hasard":v[7]<0?"en dessous, au-delà du hasard":Math.abs(v[3])<1?"comme prévu":"dans la marge d’erreur";
  return [`${rkSg(x,fx1)} victoire${Math.abs(x)>=1.95?"s":""} <em>(${lab})</em>`,`${rkWE(v[1],v[2],v[0])} aux internationaux depuis 2024`]}
/* saison 2026 (renderTeamSeason de v13.5) et début de partie (flTeamHTML) */
function teaSa(t){
  const id=t.id,S=SJ&&SJ.teams&&SJ.teams[id];if(!SJ)return plyWaitSJ(200);
  if(!S||!S.g)return `<p class="empty">Pas de parties 2026 recensées.</p>`;
  const dur=v=>Math.floor(v)+" min "+String(Math.round(v%1*60)).padStart(2,"0");let h="";
  /* début de partie 2026 (flTeamHTML de v13.5, SJ.fl.t) : une ligne sous les tuiles, le détail au toucher */
  const f=SJ.fl&&SJ.fl.t&&SJ.fl.t[id];let fl="";
  if(f&&f[0]>=10){const pc=(a,b)=>b?Math.round(a/b*100)+NB+"%":"–",[n,,fb,fbw,ft,ftw,fd,fdw,nb,fn,fnw,,,so,sow,soa]=f;
    fl=`<div class="ply-lns ply-sty">${plyLn("Début de partie",`1er sang ${pc(fb,n)} · 1re tour ${pc(ft,n)} · 1er dragon ${pc(fd,n)}${so?`<small>âme du dragon ${so} fois en ${n} parties</small>`:""}`,`data-info="${xi("tfl|"+id,()=>["Début de partie",`<p>Saison 2026, ${n} parties au flux complet.</p><p>Quand ${esc(tid(id))} fait le premier sang, elle gagne <b>${pc(fbw,fb)}</b> de ces parties ; la première tour, <b>${pc(ftw,ft)}</b> ; le premier dragon, <b>${pc(fdw,fd)}</b>.</p><p>Premier Baron dans ${pc(fn,nb)} des parties avec un Baron (${pc(fnw,fn)} gagnées). Âme du dragon : ${so} fois, ${sow} gagnées ; âme adverse : ${soa} fois.</p>`,true])}"`)}</div>`}
  h+=`<div class="blk"><div class="bh">Saison 2026<span class="tag">${S.g} parties</span><button class="i" data-info="teasaison" aria-label="Sources">i</button></div>${tiles([[`${S.sw}-${S.sl}`,"séries"],[pct(S.gw,S.g)+NB+"%",`des ${S.g} parties`],[pct(S.bw,S.bn)+NB+"%",`côté bleu (${S.bn} parties)`],[pct(S.rw,S.rn)+NB+"%",`côté rouge (${S.rn} parties)`],[fx1(S.k),"kills par partie"],[fx1(S.dr),"dragons par partie"],[(S.gd>0?"+":"")+fx1(S.gd/1000)+NB+"k","écart d’or final"],[dur(S.gl),"durée moyenne"]])}${fl}</div>`;
  if(S.last&&S.last.length){const L=S.last,w=L.filter(x=>x.won).length;
    const row=x=>`<${x.oid?`button data-go="t/${esc(x.oid)}"`:"div"} class="tea-sr ${x.won?"ply-w":"ply-l"}">${x.oid?logo(x.oid,24):`<span class="mono" style="width:24px;height:24px;background:var(--card2)">?</span>`}<span class="grow"><b>${esc(x.oid?tid(x.oid):String(x.opp))}</b><small>${esc(tourName(x.op))} · ${esc(fmtShort(x.dt))}</small></span><em>${x.s}-${x.o}</em><i>${x.won?"V":"D"}</i></${x.oid?"button":"div"}>`;
    /* la bande entière ouvre le détail (adversaire, compétition, date, score) ; « Le détail › » dans l'en-tête */
    const det=xi("tl|"+id,()=>[`${t.name} : ${L.length} dernières séries`,`<div class="list">${L.map(row).join("")}</div>`,true]);
    h+=`<div class="blk"><div class="bh">${L.length} dernières séries<span class="tag ${w>L.length-w?"on":""}">${w}–${L.length-w}</span><button class="ply-bhl" data-info="${det}">Le détail<i class="chev" aria-hidden="true">›</i></button></div><button class="tea-ls" data-info="${det}" aria-label="Le détail des ${L.length} dernières séries">${L.map(x=>`<i class="${x.won?"ply-w":"ply-l"}" title="${esc(x.oid?tid(x.oid):x.opp)} ${x.s}-${x.o}">${x.oid?logo(x.oid,20):`<b>${esc(String(x.opp).slice(0,3))}</b>`}</i>`).join("")}</button></div>`}
  return h}
/* ses matchs à ces Worlds, puis les face-à-face (SJ.h2h) avec les équipes de ces Worlds affrontées en 2026 */
function teaMa(t){
  const id=t.id,ms=MATCHES.filter(m=>m.t1===id||m.t2===id),R=records()[id],nx=teaNext(id);let h="";
  h+=`<div class="blk"><div class="bh">Ses matchs à ces Worlds${R?`<span class="tag">suisse ${R.sw.w}-${R.sw.l}${R.pi.w+R.pi.l?` · Play-In ${R.pi.w}-${R.pi.l}`:""}${R.ko.w+R.ko.l?` · finale ${R.ko.w}-${R.ko.l}`:""}</span>`:""}</div>${ms.length?`<div class="list">${ms.map(mrow).join("")}</div>`:`<p class="ply-p">Aucun match connu pour l’instant.</p>`}</div>`;
  const S=SJ&&SJ.teams&&SJ.teams[id],vs=S&&S.vs?Object.entries(S.vs).sort((x,y)=>(y[1].w+y[1].l)-(x[1].w+x[1].l)):[];
  if(nx){const o=teaOpp(nx,id);h+=`<div class="blk"><div class="bh">Face-à-face avec ${esc(tid(o))}<span class="tag">prochain adversaire</span></div>${teaH2H(id,o)}</div>`}
  if(vs.length)h+=`<div class="blk"><div class="bh">En 2026 contre les équipes de ces Worlds</div><div class="tea-vsl">${vs.map(([o,r])=>`<button class="tea-vsr" data-info="${xi("h2|"+id+"|"+o,()=>[`${tid(id)} – ${tid(o)}`,teaH2H(id,o)+`<button class="btn" data-go="t/${esc(o)}">Fiche ${esc(tid(o))} ›</button>`,true])}">${logo(o,22)}<span>${esc(tid(o))}</span><b class="${r.w>r.l?"ply-w":r.w<r.l?"ply-l":""}">${r.w}-${r.l}</b></button>`).join("")}</div><p class="note">Séries 2026. Touche une équipe pour le face-à-face depuis 2024.</p></div>`;
  else if(!SJ)h+=plyWaitSJ(120);
  return h}
/* face-à-face de deux équipes depuis 2024 (h2h de v13.5, données du robot) */
function teaH2H(a,b){
  const s=SJ&&SJ.h2h;if(!s)return `<p class="ply-p">Stats du robot pas encore publiées.</p>`;
  const [x,y]=[a,b].sort(),G=s[x+"|"+y];let H=null;
  if(G)H=x===a?G:{aw:G.bw,bw:G.aw,since:G.since,intl:{aw:G.intl.bw,bw:G.intl.aw},list:G.list.map(z=>({...z,as:z.bs,bs:z.as,aWon:!z.aWon}))};
  if(!H||!(H.aw+H.bw))return `<p class="ply-p">Pas de confrontation officielle depuis ${esc(String(SJ.since||"2024").slice(0,4))}.</p>`;
  const c=cpair(a,b);
  return `<div class="bigvs"><div class="a"><span class="n ${H.aw>=H.bw?"lead":"trail"}">${H.aw}</span><span class="t">${logo(a,18)}${esc(tid(a))}</span></div><div class="c">séries gagnées<br>depuis ${esc(fmtMonth(H.since))}</div><div class="b"><span class="n ${H.bw>=H.aw?"lead":"trail"}">${H.bw}</span><span class="t">${esc(tid(b))}${logo(b,18)}</span></div></div>${splitBar(H.aw/(H.aw+H.bw),c[0],c[1])}
    ${H.intl.aw+H.intl.bw?`<p class="ply-sub" style="text-align:center">En compétition internationale : ${esc(tid(a))} ${H.intl.aw}, ${esc(tid(b))} ${H.intl.bw}</p>`:""}
    <div class="tea-h2">${H.list.map(z=>`<div class="tea-h2r"><span>${esc(fmtShort(z.dt))}<small>${esc(tourName(z.op))}</small></span><b><em class="${z.aWon?"ply-w":""}">${z.as}</em>-<em class="${z.aWon?"":"ply-w"}">${z.bs}</em></b>${logo(z.aWon?a:b,20)}</div>`).join("")}</div>`}
/* « Suivre » : data-fav, géré par le socle (setFav dans app.js : w26_fav, toucher à nouveau retire, comme v13.5) */
INFO.equipe=()=>["Fiche équipe","En tête : son statut, les défaites encore permises, son parcours à ces Worlds (une case par série, le prochain match en pointillés, les places suisses restantes) et son prochain match. Aperçu : ses cinq titulaires, l’avis du robot (force, chances, joueurs, grands tournois) et un fait. Saison : stats 2026, côtés bleu et rouge, dernières séries, début de partie. Matchs : ses matchs à ces Worlds et les face-à-face. « Suivre » : ses matchs sont mis en avant dans l’appli."];
INFO.teabrief=()=>["Le robot en bref",`<p>Force : somme des notes d’impact des 5 titulaires (niveau des adversaires et des ligues compris). Chances : ${((SJ&&SJ.sim&&SJ.sim.n)||20000).toLocaleString("fr-FR")} tournois simulés avec les résultats déjà acquis. Joueurs : rang de la note d’impact parmi les 19 titulaires du poste. Grands tournois : victoires réelles moins victoires attendues d’après la note de ses joueurs avant chaque tournoi, depuis 2024 ; « au-delà du hasard » : au moins 2 erreurs types, 20 parties et le même sens en 2024 et depuis 2025 ; « comme prévu » : moins d’une erreur type d’écart.</p>`,true];
INFO.teasaison=()=>["Saison 2026","Toutes les compétitions officielles de 2026 (ligue, First Stand, MSI, EWC, Worlds). Côtés : victoires côté bleu et côté rouge. Écart d’or final : différence d’or moyenne en fin de partie. Données du robot (LoL Esports)."];

/* ---------- branchements ---------- */
defScreen("teams",{arg:"none",screen:scrTeams});
defScreen("t",{arg:"idtab",screen:scrTeam});
