/* =====================================================================================
   stats.js — STATS DU TOURNOI ET FAITS (propriétaire : agent stats)
   Écrans : st/<onglet> (Tournoi · Leaders · Champions · Ligues · Chiffres), fx/<n> (un fait), fxl (tous les faits).
   Widget de l'accueil : fact. Aide partagée : staFactsBlk([clés]) (2 faits liés à une fiche joueur ou équipe, F-02).
   Calculs repris de v13.5 (lignes de ref/worlds_v13_5.html en commentaire) ; uxLeads (3154) est l'extrait du socle.
   Chaque onglet tient dans un écran de 664 px (iPhone 12) sans « mini défilement » ; le détail est derrière un toucher, la méthode derrière « i ».
   Conventions : noms globaux préfixés sta, classes .sta-*, aucun rendu au chargement.
   ===================================================================================== */

/* ===================== données ===================== */
const STA={sj:0,dj:0,ck:"pres",chAll:0,counted:0};
const STA_LG={LCK:"Corée",LPL:"Chine",LEC:"Europe",LCS:"Amérique du Nord",LCP:"Asie-Pacifique",CBLOL:"Brésil"};   // leaguesHTML (2652)
/* stats du tournoi : SJ.tourney du robot (tourneyStats, 2512) ; sinon le cache de v13.5 (w26_ak_tourney, même format) */
function staT(){if(SJ&&SJ.tourney)return SJ.tourney;const c=LS.get("ak_tourney",null);return c&&c.d&&typeof c.d.n==="number"?c.d:null}
/* joueur d'après le lien du robot (playerByLink, 2535 ; linkOf, 2133) */
const staP=L=>PLAYERS.find(p=>norm(p.page||p.id)===norm(L))||PLAYERS.find(p=>norm(p.id)===norm(String(L).replace(/\s*\(.*\)$/,"")))||null;
/* équipe d'après un nom (idOfName, 2430 : SJ.names du robot, sinon les alias) */
function staTid(n){const N=SJ&&SJ.names;if(N)for(const k in N)if(Array.isArray(N[k])&&N[k].includes(n))return k;return resolveTeam(n)}
/* 39,87 min → « 39:52 » (renderTourney, 2752, sans le « 39:60 » d'un arrondi à la minute près) */
const staDur=v=>{const s=Math.round((+v||0)*60);return Math.floor(s/60)+":"+String(s%60).padStart(2,"0")};
const staI=(k,lab="Comment c’est calculé")=>`<button class="i" data-info="sta:${k}" aria-label="${lab}">i</button>`;

/* ===================== écran st/<onglet> ===================== */
const STA_TABS=[["to","Tournoi"],["ld","Leaders"],["ch","Champions"],["lg","Ligues"],["nb","Chiffres"]];
function scrStats(d){
  const D=staT(),need=[];
  if(!STA.sj)need.push(loadSJ().finally(()=>{STA.sj=1}));
  if(!STA.dj)need.push(loadDJ().finally(()=>{STA.dj=1}));
  return {title:`Stats du tournoi<small>${D&&D.n?"Worlds 2026 · "+plur(D.n,"partie jouée","parties jouées"):"Worlds 2026"}</small>`,info:"sta:src",tabs:STA_TABS,
    render:t=>`<div class="sta">${staTab(t,D)}</div>`,needs:need};
}
function staTab(t,D){
  if(t==="lg")return staLeagues();
  if(t==="nb"){if(!STA.counted&&!RM){STA.counted=1;requestAnimationFrame(()=>requestAnimationFrame(staCount))}return staNumbers()}
  if(t==="ch"){if(DJ&&DJ.meta&&DJ.meta.n)return staChamps();if(!STA.dj)return skel(56,5)}
  if(!D)return STA.sj?`<div class="blk"><p class="empty">Stats du robot pas encore publiées.</p><button class="btn" data-sta-retry>Réessayer</button></div>`:skel(120,3);
  if(t==="ld")return staLeaders(D);
  if(t==="ch")return staChampsOld(D);
  return staTourney(D);
}
onAct("[data-sta-retry]",b=>{const el=b.closest(".scr");b.disabled=true;b.textContent="Chargement…";loadSJ(true).then(()=>{STA.sj=1;if(!SJ)toast("Stats toujours injoignables");const c=el.querySelector(".tabc");if(c)c._h=null;rerender(el)})});

/* ---------- onglet Tournoi : tuiles, côtés, records (renderTourney, 2750) ---------- */
function staTourney(D){
  if(!D.n)return `<div class="blk"><p class="empty">Les stats du tournoi apparaissent dès les premières parties terminées.</p></div>${staFxEntry()}`;
  const M=DJ&&DJ.meta,mp=M&&M.n?staMetaRows("pres")[0]:null,c0=D.champs&&D.champs[0];
  const top=mp?{c:DJ.ch[mp[0]],l:`le plus présent, ${P((mp[1]+mp[3])/M.n)}`}:c0?{c:c0.c,l:D.nobans?"le plus joué":"le plus présent"}:null;
  const tile=(v,l,a="")=>`<${a?"button":"div"} class="sta-t"${a}><b>${v}</b><span>${l}</span></${a?"button":"div"}>`;
  const red=D.red!=null?D.red:D.n-D.blue;
  const rec=(g,v,l)=>{if(!g)return"";const a=staTid(g.b1),b=staTid(g.b2),w=staTid(g.wt),m=staRecMatch(a,b,g.ph),tm=(id,n)=>`<span class="${w&&w===id?"sta-win":""}">${id?logo(id,14):""}${esc(id?tid(id):n)}</span>`;
    return `<button class="key sta-rk"${m?` data-go="m/${esc(m.id)}"`:" disabled"}><span class="kn">${v}</span><span class="kt">${l}<small>${tm(a,g.b1)} contre ${tm(b,g.b2)}${g.ph?` · ${g.ph==="pi"?"Play-In":"phase principale"}`:""}</small></span><span class="chev">${m?"›":""}</span></button>`};
  const recs=rec(D.longest,staDur(D.longest&&D.longest.gl),"partie la plus longue")+rec(D.shortest,staDur(D.shortest&&D.shortest.gl),"partie la plus courte")+rec(D.bloodiest,D.bloodiest&&D.bloodiest.kills,"kills dans une partie");
  return `<div class="blk"><div class="bh">Ces Worlds${staI("to")}</div>
    <div class="sta-tl">${tile(D.n,"parties jouées")}${tile(staDur(D.avg),"durée moyenne")}${tile(P(D.blue/D.n),"victoires côté bleu")}${top?tile(`${champ(top.c,24)}<span>${esc(top.c)}</span>`,esc(top.l),` data-tab="ch" aria-label="Champions des Worlds"`):tile("–","champion le plus présent")}</div>
    <div class="sta-sd"><span>Bleu <b>${D.blue}</b></span><span class="split"><i style="width:calc(${(D.blue/D.n*100).toFixed(1)}% - 1px);background:var(--sblue)"></i><i style="background:var(--sred)"></i></span><span><b>${red}</b> Rouge</span></div></div>
   ${recs?`<div class="blk"><div class="bh">Records${staI("rec")}</div><div class="keys">${recs}</div></div>`:""}`;
}
/* le match d'un record : mêmes équipes, même phase (pi : Play-In ; main : le reste) */
function staRecMatch(a,b,ph){if(!a||!b)return null;const L=MATCHES.filter(m=>m.winner&&((m.t1===a&&m.t2===b)||(m.t1===b&&m.t2===a)));
  return L.find(m=>ph==="pi"?m.stage==="pi":ph==="main"?m.stage!=="pi":true)||L[0]||null}
/* entrée vers les faits : le fait du moment, deux lignes */
function staFxEntry(){const L=staFxList();if(!L.length)return"";const f=L[STA_FX.i%L.length];
  return `<button class="rowb sta-fe" data-go="fx" aria-label="Le saviez-vous ?"><span class="grow"><b class="sta-fk">Le saviez-vous ?${f[7]?` <span class="nw">nouveau</span>`:""}<em>${L.length} faits</em></b><span class="sta-ft">${esc(f[2])}</span></span><span class="chev">›</span></button>`}

/* ---------- onglet Leaders : phase, catégorie, top 5 (renderTourney 2757-2762, uxLeads 3154) ---------- */
function staLeaders(D){
  const L2=D.lead2||{},PH=[["main","Phase principale"],["pi","Play-In"]].filter(([k])=>L2[k]);
  const ph=PH.some(([k])=>k===ui.leadPh)?ui.leadPh:PH.length?(L2.main&&L2.main.n>=4?"main":PH[PH.length-1][0]):null,L=ph?L2[ph]:D.lead;
  const body=L?uxLeads(L,(title,list,fmt)=>`<div class="sta-lt">${esc(title)}<em>les 5 premiers</em></div><div class="list">${list.map((x,i)=>staLeadRow(x,i,fmt)).join("")}</div>`):"";
  const seg=PH.length>1?`<div class="sta-seg" style="--n:${PH.length}">${PH.map(([k,l])=>`<button data-leadph="${k}" aria-pressed="${k===ph}">${l}<small>${plur(L2[k].n,"partie")}</small></button>`).join("")}</div>`:`<span class="sta-hd">Les leaders</span>`;
  return `<div class="sta-sg">${seg}${staI("ld")}</div>
    ${body||`<p class="empty">Pas encore de leaders.</p>`}${body?`<p class="note">Minimum ${plur(L.mn||3,"partie")}, sauf pour les kills.</p>`:""}`;
}
function staLeadRow(x,i,fmt){const p=staP(x.L);
  return `<button class="rowb sta-lr"${p?` data-p="${esc(p.key)}"`:" disabled"}><span class="n">${i+1}</span>${p?photo(p,"ava",40):`<span class="mono" style="width:40px;height:40px;background:var(--card2)">?</span>`}<span class="grow"><b class="nm">${esc(p?p.id:x.L)}</b><small>${p?logo(p.team,14):""}${esc(p?tid(p.team):x.tm)} · ${plur(x.g,"partie")} · ${x.k}/${x.d}/${x.a}</small></span><span class="num">${fmt(x.v)}</span></button>`}
onAct("[data-leadcat]",b=>{ui.leadCat=b.dataset.leadcat;vib(6);refreshTab(b.closest(".scr"),0)});
onAct("[data-leadph]",b=>{ui.leadPh=b.dataset.leadph;vib(6);refreshTab(b.closest(".scr"),0)});

/* ---------- onglet Champions : présence, bannis, joués (metaHTML, 2356 ; draft.json, meta gol.gg) ---------- */
const STA_CF={pres:x=>x[1]+x[3],ban:x=>x[3],pick:x=>x[1]},STA_CL={pres:"choisi ou banni",ban:"banni",pick:"joué"};
/* M.c : [champion, picks, victoires, bans, bans de la 1re rotation, premier choix, …, [[joueur, équipe, victoire], …]] */
/* gol.gg publie les drafts avec du retard : tant qu'il lui manque des parties, picks et victoires des champions du robot
   (SJ.tourney.champs, API LoL Esports, 15 premiers) remplacent les siens. Mêmes chiffres que « Le saviez-vous ? » ; bans : gol.gg. */
function staMC(){const M=DJ.meta,T=staT(),sig=(SJ&&SJ.built)+"|"+M.maj+"|"+M.n;if(STA.mc&&STA.mc.sig===sig&&STA.mc.dj===DJ)return STA.mc;
  let c=M.c,n=M.n,lag=0;
  if(T&&Array.isArray(T.champs)&&T.n>M.n){lag=T.n-M.n;n=T.n;const by=new Map(T.champs.map(t=>[norm(t.c),t])),seen=new Set();
    c=M.c.map(x=>{const t=by.get(norm(DJ.ch[x[0]]||""));if(!t)return x;seen.add(t);const y=x.slice();y[1]=t.p;y[2]=t.w;return y});
    T.champs.forEach(t=>{if(seen.has(t))return;const i=DJ.ch.findIndex(h=>norm(h)===norm(t.c));if(i>=0)c.push([i,t.p,t.w,0,0,0,0,[]])})}
  return STA.mc={sig,dj:DJ,c,n,lag}}
function staMetaRows(kind){const f=STA_CF[kind]||STA_CF.pres;return staMC().c.filter(x=>f(x)>0).sort((a,b)=>f(b)-f(a)||b[3]-a[3]||a[0]-b[0])}
function staChamps(){
  const D=DJ,M=D.meta,MC=staMC(),N=MC.n,kind=STA_CF[STA.ck]?STA.ck:"pres",f=STA_CF[kind],rows=staMetaRows(kind),top=rows[0],fs=M.fs||[0,0,0];
  if(!top)return `<div class="blk"><p class="empty">Pas encore de draft publiée.</p></div>`;
  const nm=i=>D.ch[i]||"?",L=STA.chAll?rows:rows.slice(0,5);
  const row=x=>`<button class="sta-cr" data-info="sta:c:${x[0]}">${champ(nm(x[0]),34)}<span class="g"><b>${esc(nm(x[0]))}</b><small>${djS(x[3],"ban","bans")}, ${djS(x[1],"pick","picks")}${x[1]>=5?`, ${djS(x[2],"victoire","victoires")}`:""}</small></span><span class="cw"><i style="width:${Math.min(100,f(x)/N*100).toFixed(1)}%"></i></span><em>${Math.round(f(x)/N*100)}${NB}%</em></button>`;
  return `<div class="blk"><div class="bh">Champions des Worlds${staI("ch","Sources et méthode")}</div>
    <p class="sta-ph"><b>${esc(nm(top[0]))}</b> : ${STA_CL[kind]} dans ${f(top)} parties sur ${N}.${fs[0]?` L’équipe du 1<sup>er</sup> pick a gagné ${fs[1]} parties sur ${fs[0]}.`:""}${MC.lag?` <small>Bans : ${M.n} parties sur ${N} publiées par gol.gg.</small>`:""}</p>
    <div class="sta-seg" style="--n:3">${[["pres","Présence"],["ban","Bannis"],["pick","Joués"]].map(([v,l])=>`<button data-sta-ck="${v}" aria-pressed="${kind===v}">${l}</button>`).join("")}</div>
    <div class="sta-cl">${L.map(row).join("")}</div>
    ${rows.length>5?`<button class="btn sta-more" data-sta-chall>${STA.chAll?"Seulement les 5 premiers":`Voir les ${rows.length-5} autres`}</button>`:""}</div>`;
}
/* repli tant que draft.json manque : picks seuls du robot (oldCh de renderTourney, 2754) */
function staChampsOld(D){const C=D.champs||[];if(!C.length)return `<div class="blk"><p class="empty">Pas encore de draft publiée.</p></div>`;const L=STA.chAll?C:C.slice(0,5);
  return `<div class="blk"><div class="bh">Champions des Worlds${staI("ch0","Sources")}</div><p class="sta-ph">${D.nobans?"Présence = parties où le champion a été choisi. ":""}Les bans apparaissent quand gol.gg a publié les premières drafts des Worlds.</p>
    <div class="sta-cl">${L.map(c=>`<div class="sta-cr">${champ(c.c,34)}<span class="g"><b>${esc(c.c)}</b><small>${djS(c.p,"pick","picks")}${D.nobans?"":`, ${djS(c.b,"ban","bans")}`}${c.p?`, ${pct(c.w,c.p)}${NB}% de victoires`:""}</small></span><span class="cw"><i style="width:${Math.min(100,c.pr).toFixed(1)}%"></i></span><em>${Math.round(c.pr)}${NB}%</em></div>`).join("")}</div>
    ${C.length>5?`<button class="btn sta-more" data-sta-chall>${STA.chAll?"Seulement les 5 premiers":`Voir les ${C.length-5} autres`}</button>`:""}</div>`}
onAct("[data-sta-ck]",b=>{STA.ck=b.dataset.staCk;vib(6);refreshTab(b.closest(".scr"),0)});
onAct("[data-sta-chall]",b=>{STA.chAll=STA.chAll?0:1;const el=b.closest(".scr"),y=el.scrollTop;refreshTab(el,0);if(!STA.chAll)el.scrollTop=Math.min(y,el.scrollHeight)});
/* détail d'un champion (feuille) : bans, picks, qui l'a joué (det et who de metaHTML, 2361-2364) */
function staChSheet(i){
  const D=DJ,M=D&&D.meta;if(!M)return null;const MC=staMC(),x=MC.c.find(y=>y[0]===+i);if(!x)return null;const N=MC.n,c=D.ch[x[0]]||"?";
  const g=new Map();(x[7]||[]).forEach(([p,t,w])=>{const k=p+"|"+t,o=g.get(k)||{p,t,w:0,l:0};w?o.w++:o.l++;g.set(k,o)});
  const who=[...g.values()].sort((a,b)=>b.w+b.l-a.w-a.l||b.w-a.w);
  const tl=(v,l)=>`<div class="sta-t"><b>${v}</b><span>${l}</span></div>`;
  const rowP=o=>{const p=pkey(o.p),rec=`${o.w?djS(o.w,"victoire","victoires"):""}${o.w&&o.l?", ":""}${o.l?djS(o.l,"défaite","défaites"):""}`;
    return `<${p?"button":"div"} class="sta-wp"${p?` data-sta-go="p/${esc(p.key)}"`:""}>${p?photo(p,"ava",30):""}<span class="g"><b>${esc(djName(o.p))}</b><small>${esc(djT(o.t))}</small></span><em>${rec}</em>${p?`<span class="chev">›</span>`:""}</${p?"button":"div"}>`};
  return [c,`<div class="sta-shd">${champ(c,52)}<p>${STA_CL.pres[0].toUpperCase()+STA_CL.pres.slice(1)} dans <b>${x[1]+x[3]} parties sur ${N}</b> (${Math.round((x[1]+x[3])/N*100)}${NB}%).</p></div>
    <div class="sta-tl">${tl(x[3],x[3]?`bans, dont ${x[4]} en 1<sup>re</sup> rotation`:"ban")}${tl(x[1],x[1]>1?"picks":"pick")}${tl(x[1]>=5?x[2]:"–",x[1]>=5?(x[2]>1?"victoires":"victoire"):"victoires, comptées dès 5 picks")}${tl(x[5]||0,"fois choisi en premier de la draft")}</div>
    ${who.length?`<h4 class="sta-h4">Joué par</h4><div class="sta-who">${who.map(rowP).join("")}</div>`:`<p>Jamais joué à ces Worlds.</p>`}`,true];
}

/* ---------- onglet Ligues : force, ces Worlds ligue contre ligue, vrais face-à-face (leaguesHTML 2650, wlgHTML 2638, lgrHTML 2644) ---------- */
function staWlg(){
  const R={},S={};MATCHES.filter(m=>m.winner&&m.t1&&m.t2&&T[m.t1]&&T[m.t2]&&T[m.t1].league!==T[m.t2].league).forEach(m=>{
    const w=T[m.winner].league,l=T[m.winner===m.t1?m.t2:m.t1].league;(R[w]=R[w]||[0,0])[0]++;(R[l]=R[l]||[0,0])[1]++;(S[w]=S[w]||[]).push(m);(S[l]=S[l]||[]).push(m)});
  return {R,S}}
function staLeagues(){
  const m=SJ&&SJ.m,lg=m&&m.lg,{R,S}=staWlg();
  const L=lg?Object.entries(lg).filter(([l])=>STA_LG[l]).sort((a,b)=>b[1]-a[1]):Object.keys(STA_LG).map(l=>[l,null]).sort((a,b)=>{const x=R[a[0]]||[0,0],y=R[b[0]]||[0,0];return y[0]-x[0]||x[1]-y[1]});
  const V=L.map(x=>x[1]).filter(v=>v!=null),mx=Math.max(...V),mn=Math.min(...V);
  const row=([l,v])=>{const r=R[l],cls=r?(r[0]>r[1]?" up":r[0]<r[1]?" dn":""):"";
    const inner=`<span class="lc"><b>${l}</b><small>${STA_LG[l]}</small></span><span class="br">${v!=null?`<i style="width:${((v-mn)/(mx-mn||1)*92+8).toFixed(1)}%"></i>`:""}</span><em class="fv">${v!=null?fxs(v):""}</em><em class="wl${cls}">${r?`${r[0]}-${r[1]}`:"–"}</em>`;
    return S[l]?`<details class="sta-lgr" data-uo="sta_wl_${l}"${amO("sta_wl_"+l)}><summary>${inner}<span class="chev">›</span></summary><div class="sta-ls list">${S[l].slice().reverse().map(mrow).join("")}</div></details>`
      :`<div class="sta-lgr"><div class="sm">${inner}<span></span></div></div>`};
  const ans=lg&&lg.LCK!=null&&lg.LEC!=null?`<p class="sta-ans">Une équipe LCK moyenne battrait une équipe LEC moyenne <b>${staVs(lg.LCK,lg.LEC)} fois sur 100</b>.</p>`:"";
  return `<div class="blk"><div class="bh">Les ligues${staI("lg","Comment c’est mesuré")}</div>
    <div class="sta-lgh"><span></span><span>force estimée</span><span>à ces Worlds</span></div>
    ${L.map(row).join("")}${ans}${staLgr()}</div>`;
}
const staVs=(a,b)=>{const al=((SJ&&SJ.m&&SJ.m.logit)||[0,.64])[1];return Math.round(100/(1+Math.exp(-al*5*(a-b))))};
function staLgr(){
  const G0=SJ&&SJ.lgr,Y=G0&&(G0["2025"]?"2025":G0["2024"]?"2024":null);if(!Y)return"";
  const rows=Object.entries(G0[Y]).filter(([k,v])=>k.split("|").every(l=>STA_LG[l])&&v[0]+v[1]>=6);if(!rows.length)return"";
  return `<details class="uxf sta-lgv" data-uo="sta_lgr"${amO("sta_lgr")}><summary><b>Leurs vrais face-à-face depuis ${Y}</b><small>parties entre équipes des deux ligues, aux internationaux</small></summary><div>${rows.map(([k,v])=>{
    const [a,b]=k.split("|"),[x,y]=v[0]>=v[1]?[a,b]:[b,a],[wx,wy]=v[0]>=v[1]?v:[v[1],v[0]];
    return `<div class="sta-vv"><b>${esc(x)}</b><span>${wx} – ${wy}</span><b>${esc(y)}</b><small>${Math.round(wx/(wx+wy)*100)}${NB}% pour ${esc(x)}</small></div>`}).join("")}</div></details>`;
}

/* ---------- onglet Chiffres : ces Worlds en chiffres (renderHome, 1713-1722) ----------
   Un chiffre par ligne, avec un aperçu (drapeaux, visages) ; toucher la ligne déplie la liste (puces → fiche joueur ou équipe). */
function staNumbers(){
  const R=records(),nats={};PLAYERS.forEach(p=>nats[p.cc]=(nats[p.cc]||0)+1);
  const kr=PLAYERS.filter(p=>p.cc==="kr"&&T[p.team].league!=="LCK"),fr=PLAYERS.filter(p=>p.cc==="fr"),leg=PLAYERS.filter(p=>p.titles.length).sort((a,b)=>b.titles.length-a.titles.length);
  const alive=TEAMS.filter(t=>status(t.id,R).k!=="out"),titles=leg.reduce((a,p)=>a+p.titles.length,0),NA=Object.entries(nats).sort((a,b)=>b[1]-a[1]);
  const chip=p=>`<button class="chip" data-p="${esc(p.key)}">${logo(p.team,16)}${esc(p.id)}${p.titles.length?`<small>×${p.titles.length}</small>`:""}</button>`;
  const faces=L=>`<span class="sta-fc">${L.slice(0,5).map(p=>`<span>${photo(p,"ava",26)}</span>`).join("")}${L.length>5?`<em>+${L.length-5}</em>`:""}</span>`;
  const row=(id,n,txt,prev,body,x="")=>`<details class="sta-nr" data-uo="sta_nb_${id}"${amO("sta_nb_"+id)}><summary><b class="sta-nn" data-sta-to="${n}">${n}${x}</b><span class="sta-nt"><span>${txt}</span>${prev}</span><span class="chev">›</span></summary><div class="sta-ch">${body}</div></details>`;
  return `<div class="blk"><div class="bh">Ces Worlds en chiffres${staI("nb")}</div>
    ${row("in",alive.length,`équipe${alive.length>1?"s":""} encore en lice sur 19`,`<span class="sta-pv">${alive.slice(0,8).map(t=>logo(t.id,18)).join("")}${alive.length>8?`<em>+${alive.length-8}</em>`:""}</span>`,alive.map(t=>`<button class="chip" data-t="${t.id}">${logo(t.id,18)}${esc(t.id)}</button>`).join(""))}
    ${row("nat",NA.length,"nationalités chez les titulaires",`<span class="sta-pv">${NA.slice(0,7).map(([cc])=>flag(cc)).join("")}${NA.length>7?`<em>+${NA.length-7}</em>`:""}</span>`,`<div class="sta-fl">${NA.map(([cc,n])=>`<span>${flag(cc)}${esc(cname(cc))}<small>${n}</small></span>`).join("")}</div>`)}
    ${row("leg",leg.length,`champions du monde sur le terrain, ${titles} titres à eux tous`,faces(leg),leg.map(chip).join(""))}
    ${row("kr",kr.length,"Coréens jouent hors de la LCK",faces(kr),kr.map(chip).join(""))}
    ${row("fr",fr.length,"Français titulaires",faces(fr),fr.map(chip).join(""),flag("fr"))}</div>${staFxEntry()}`;
}
/* chiffres qui défilent, une fois par session (countUp, 1557) */
function staCount(){const el=topScreen();if(!el||RM)return;el.querySelectorAll("[data-sta-to]").forEach(n=>{const to=+n.dataset.staTo,tx=n.firstChild;if(!tx||tx.nodeType!==3||!to)return;const t0=performance.now();
  (function f(t){const k=Math.min(1,(t-t0)/1100);tx.nodeValue=String(k<1?Math.round(to*(1-Math.pow(1-k,3))):to);if(k<1&&n.isConnected)requestAnimationFrame(f)})(t0)})}

/* ---------- feuilles « i » du domaine (data-info="sta:<clé>[:arg]") ---------- */
INFOP.sta=(k,a)=>{
  const src=`Calculé par notre robot depuis les données officielles LoL Esports, Play-In compris, mis à jour toutes les 30 minutes`;
  if(k==="src"){const b=SJ&&SJ.built?new Date(SJ.built):null;
    return ["Stats du tournoi",`<p>${src}${b&&!isNaN(b)?` (dernier passage : ${esc(fmtDay(b))} à ${esc(fmtTime(b))})`:""}.</p><p>Bans : gol.gg. Force des ligues : modèle du robot, matchs internationaux depuis 2024.</p>
      <p>Matchs : ${SOURCE==="hors ligne"||SOURCE==="embarquées"?"données embarquées (sources en direct injoignables)":"synchronisés via "+(SOURCE==="robot"?"le robot":esc(SOURCE))}${lastSync?" à "+esc(fmtTime(lastSync)):""}. Horaires en ${esc(tzLabel)}.</p>`,true]}
  if(k==="to")return ["Ces Worlds",`<p>${src}.</p><p>Toutes les parties terminées des Worlds 2026 : durée moyenne, et part des victoires du côté bleu et du côté rouge. Toucher le champion : la présence de tous les champions.</p>`,true];
  if(k==="rec")return ["Records",`<p>La partie la plus longue, la plus courte et la plus sanglante (kills des deux équipes) des Worlds 2026, Play-In compris. Le vainqueur est en or ; toucher une ligne ouvre le match.</p>`,true];
  if(k==="ld")return ["Les leaders",`<p>Le classement porte sur les parties de la phase choisie : la phase principale (phase suisse puis phase finale) ou le Play-In.</p><p>Il faut un minimum de parties pour y figurer, sauf pour les kills, qui sont un total.</p>
    <p>KDA : (kills + assists) ÷ morts. CS/min : sbires et monstres tués par minute. Dégâts : part des dégâts infligés aux champions par son équipe. Participation : part des kills de son équipe où il a tué ou aidé.</p><p>${src}.</p>`,true];
  if(k==="ch"){const M=DJ&&DJ.meta;if(!M)return null;const fs=M.fs||[0,0,0],bl=M.bl||[0,0];
    const links=(M.tn||[]).map(t=>`<a href="https://gol.gg/tournament/tournament-picksandbans/${encodeURIComponent(t)}/" target="_blank" rel="noopener">${esc(t)}</a>`).join(" et ");
    return ["Champions des Worlds",`<p>Sur les ${djS(M.n,"partie","parties")} dont la draft est publiée par gol.gg${M.att?` (${M.att} en attente de publication)`:""}. Bans : gol.gg ; picks et vainqueurs : API LoL Esports, identiques à gol.gg sur ces parties. Quand gol.gg a du retard, les picks des 15 champions les plus joués viennent du robot (toutes les parties terminées, comme « Le saviez-vous ? »). Victoires affichées à partir de 5 picks.</p>
      <p>Présence : parties où le champion a été choisi ou banni. Toucher un champion : ses bans, ses picks et qui l’a joué.</p>
      ${fs[0]?`<p>Premier choix : depuis 2026 (« First Selection »), l’équipe prioritaire choisit soit son côté, soit le premier pick. Sur ${fs[0]} parties où l’ordre des picks est connu, l’équipe qui a choisi en premier a gagné ${fs[1]} fois ; elle était côté rouge ${fs[2]} fois.</p>`:""}
      ${bl[0]?`<p>Côté bleu : ${bl[1]} victoires sur ${bl[0]} parties.</p>`:""}${links?`<p>À vérifier sur gol.gg : ${links}.</p>`:""}`,true]}
  if(k==="ch0")return ["Champions des Worlds",`<p>En attendant les drafts de gol.gg, la liste vient des feuilles de match officielles : picks seulement (les bans n’y figurent pas).</p><p>${src}.</p>`,true];
  if(k==="c")return staChSheet(a);
  if(k==="lg"){const lg=SJ&&SJ.m&&SJ.m.lg;
    return ["Les ligues",`<p>Force estimée : mesurée sur les matchs internationaux depuis 2024, en comparant les performances des joueurs. C’est elle qui rend les ligues comparables (0 : ligue moyenne).</p>
      ${lg&&lg.LCK!=null&&lg.LEC!=null&&lg.CBLOL!=null?`<p>Pour se faire une idée : une équipe LCK moyenne battrait une équipe LEC moyenne ${staVs(lg.LCK,lg.LEC)} fois sur 100, et une équipe LEC moyenne une équipe CBLOL moyenne ${staVs(lg.LEC,lg.CBLOL)} fois sur 100. Un même KDA ne vaut donc pas la même chose d’une ligue à l’autre.</p>`:""}
      <p>À ces Worlds : séries gagnées et perdues contre les équipes des autres ligues, Play-In compris (résultats officiels). Toucher une ligue : ses séries.</p>
      <p>Vrais face-à-face : parties gagnées entre équipes des deux ligues aux internationaux (Worlds, MSI, First Stand, EWC), au moins 6 parties. Brut : ne tient pas compte de qui a été envoyé.</p>`,true]}
  if(k==="nb")return ["Ces Worlds en chiffres",`<p>Les titulaires des 19 équipes (5 par équipe). Champions du monde : joueurs qui ont déjà gagné les Worlds, avec leurs titres cumulés. Coréens hors LCK : joueurs coréens d’une équipe d’une autre ligue.</p><p>Équipes encore en lice : ni éliminées au Play-In, ni en phase suisse, ni en phase finale, d’après les résultats officiels.</p>`,true];
  return null;
};
/* une puce dans une feuille (joueur de « Joué par ») : fermer la feuille, puis ouvrir l'écran (une seule entrée d'historique) */
onAct("#shB [data-sta-go]",b=>{const r=b.dataset.staGo;if(SHEET.open&&history.state&&history.state.sheet){addEventListener("popstate",()=>setTimeout(()=>go(r),0),{once:true});history.back()}else{hideSheet();go(r)}});

/* ---------- fraîcheur : à chaque synchro du planning (1 à 5 min), stats.json et draft.json sont rechargés s'ils ont plus de 10 min
   (le robot publie toutes les 15 min) ; un nouveau fichier redessine aussitôt l'accueil et les écrans ouverts ---------- */
const STA_FRESH=10*60e3;
/* draft.json (DJ) et fiche.json (FJ) : chargés une fois par loadDJ / loadFJ, rechargés ici ; remplacés seulement si valides et différents */
const STA_AUX=[["draft",()=>DJ,d=>Array.isArray(d.ch)&&d.meta,d=>{DJ=d}],["fiche",()=>FJ,d=>Array.isArray(d.gm),d=>{FJ=d}]];
function staFresh(){if(document.hidden||!started)return;const now=Date.now();STA.at=STA.at||{};
  if(SJ&&now-SJt>=STA_FRESH)loadSJ();
  STA_AUX.forEach(([k,get,ok,set])=>{if(!get())return;if(!STA.at[k]){STA.at[k]=now;return}if(now-STA.at[k]<STA_FRESH||STA["p"+k])return;STA.at[k]=now;
    STA["p"+k]=fetch(BASE+k+".json",{cache:"no-cache"}).then(r=>r.ok?r.json():null).then(d=>{
      if(!(d&&d.v===1&&ok(d))||JSON.stringify(d)===JSON.stringify(get()))return;if(AUX[k])AUX[k].d=d;set(d);STA.mc=null;staRepaint()})
      .catch(()=>{}).finally(()=>{STA["p"+k]=null})})}
function staRepaint(){if(started&&MATCHES.length)onData()}
BUS.on("data",()=>safe(staFresh));
BUS.on("sj",()=>{if(STA.sjb&&SJ&&SJ.built!==STA.sjb)staRepaint();STA.sjb=SJ&&SJ.built});
document.addEventListener("visibilitychange",()=>{if(!document.hidden)safe(staFresh)});

/* ===================== le saviez-vous ? (SJ.fx, v13.5 1736-1797) =====================
   SJ.fx : [[id, famille, texte, calcul, n, intérêt, clés, nouveau], …]. Les faits nés au dernier passage du robot d'abord ;
   sinon on repart du fait qui suit le dernier vu (w26_lsv, même clé que v13.5). STA_FX.i : le fait « du moment » (widget, fx sans numéro). */
const STA_FX={i:0,sig:"",L:[],sw:0,x0:null,y0:0};
function staFxList(){
  const F=SJ&&Array.isArray(SJ.fx)?SJ.fx.filter(f=>Array.isArray(f)&&f.length>=8&&f[2]):[],sig=F.map(f=>f[0]+(f[7]?"*":"")).join("|");
  if(sig!==STA_FX.sig){const cur=STA_FX.L[STA_FX.i]&&STA_FX.L[STA_FX.i][0];
    STA_FX.L=[...F.filter(f=>f[7]),...F.filter(f=>!f[7])];
    let i=STA_FX.L.findIndex(f=>f[0]===cur);
    if(i<0){if(STA_FX.L.some(f=>f[7]))i=0;else{const j=STA_FX.L.findIndex(f=>f[0]===LS.get("lsv",null));i=j<0?0:(j+1)%STA_FX.L.length}}
    STA_FX.i=Math.max(0,i);STA_FX.sig=sig}
  return STA_FX.L;
}
const STA_FAM={ligues:"Ligues",remontee:"Remontée",serie:"Série",premiere:"Une première",champions:"Champions",duels:"Duels",record:"Record",joueurs:"Joueurs",intelligence:"Tendance",kills:"Kills",duree:"Durée",worlds:"Worlds",duel_equipes:"Face-à-face",style:"Style de jeu"};
const staFam=f=>STA_FAM[f]||String(f||"Fait").replace(/_/g," ").replace(/^./,c=>c.toUpperCase());
/* puces d'un fait : équipe → fiche équipe, joueur → fiche joueur, ligue → Stats › Ligues, champion → Stats › Champions (3 au plus) */
function staFxChips(keys){const out=[],seen=new Set();
  (Array.isArray(keys)?keys:[]).forEach(k=>{if(out.length>=3||seen.has(k))return;seen.add(k);
    if(Object.prototype.hasOwnProperty.call(T,k))out.push(`<button class="chip" data-t="${esc(k)}">${logo(k,16)}${esc(T[k].id)}</button>`);
    else if(pkey(k)){const p=pkey(k);out.push(`<button class="chip" data-p="${esc(p.key)}">${logo(p.team,16)}${esc(p.id)}</button>`)}
    else if(STA_LG[k])out.push(`<button class="chip" data-go="st/lg">${esc(k)}</button>`);
    else if(champImg(k)||(DJ&&DJ.ch&&DJ.ch.includes(k)))out.push(`<button class="chip" data-go="st/ch">${champ(k,18)}${esc(champNm(k))}</button>`)});
  return out.join("")}
/* widget de l'accueil (A-11) : le fait du moment ; affiché à l'accueil visible = vu (w26_lsv, comme la carte de v13.5) */
function wFact(k,small){const L=staFxList();if(!L.length)return"";STA_FX.i%=L.length;const f=L[STA_FX.i];if(!NAV.length)LS.set("lsv",f[0]);
  if(small)return W("w11","fx",`<div class="wh">Le saviez-vous ?${f[7]?`<em><span class="nw">nouveau</span></em>`:""}</div><p class="fx3">${esc(f[2])}</p>`,k,"","Le saviez-vous ?");
  return W("w21","fx",`<div class="wh">Le saviez-vous ?${f[7]?` <span class="nw">nouveau</span>`:""}<em>${L.length} faits</em></div><p class="fx3">${esc(f[2])}</p>`,k,"","Le saviez-vous ?")}
/* écran fx/<n> : un fait ; fx sans numéro = le fait du moment. Une fois affiché, le fait du moment devient le suivant (le prochain passage commence après le dernier vu). */
function scrFacts(d){const L=staFxList(),n=L.length;
  if(!n)return {title:"Le saviez-vous ?",render:()=>SJ||STA.sj?`<p class="empty">Pas encore de fait publié par le robot.</p>`:skel(300),needs:[loadSJ().finally(()=>{STA.sj=1})]};
  if(d.id==null)d.id=STA_FX.i;const i=((d.id%n)+n)%n,f=L[i];d.id=i;LS.set("lsv",f[0]);STA_FX.i=(i+1)%n;
  const ch=staFxChips(f[6]);
  return {title:"Le saviez-vous ?",render:()=>`<div class="fxc" id="fxc" aria-live="polite"><div class="wh">${esc(staFam(f[1]))}${f[7]?` <span class="nw">nouveau</span>`:""}<button class="i" style="margin-left:auto" data-info="fx:${i}" aria-label="Comment c’est calculé">i</button></div><p>${esc(f[2])}</p>${ch?`<div class="ft">${ch}</div>`:""}</div>
    <div class="fxn"><button data-fx="-1" aria-label="Fait précédent">‹ Précédent</button><span>${i+1}/${n}</span><button data-fx="1" aria-label="Fait suivant">Suivant ›</button></div>
    <button class="btn sta-all" data-go="fxl">Tous les faits <small>${n}</small></button>`};}
function rerenderFacts(el,dir){el._d.id+=dir;const o=scrFacts(el._d);el._o=o;const c=el.querySelector(".tabc"),h=o.render();c._h=h;c.innerHTML=h;
  try{history.replaceState({...(history.state||{}),r:routeOf(el._d)},"","#"+routeOf(el._d))}catch(e){}
  const fc=el.querySelector("#fxc");if(fc&&!RM)fc.animate([{opacity:0,transform:`translateX(${dir*30}px)`},{opacity:1,transform:"none"}],{duration:260,easing:"cubic-bezier(.2,.9,.25,1)"});vib(6)}
onAct("[data-fx]",b=>rerenderFacts(b.closest(".scr"),+b.dataset.fx));
/* toucher la carte = fait suivant (les puces ouvrent leur fiche) ; glisser à gauche = suivant, à droite = précédent */
onAct("#fxc",(c,e)=>{const g=e.target.closest("[data-go],[data-p],[data-t]");
  if(g){for(const a in GO_ATTR){const v=g.dataset[a];if(v){go(GO_ATTR[a](v),g);return}}}
  if(Date.now()-STA_FX.sw<500)return;rerenderFacts(c.closest(".scr"),1)});
addEventListener("touchstart",e=>{const c=e.target.closest&&e.target.closest("#fxc");if(!c||e.touches.length>1||e.touches[0].clientX<=24){STA_FX.x0=null;return}STA_FX.x0=e.touches[0].clientX;STA_FX.y0=e.touches[0].clientY},{passive:true});
addEventListener("touchend",e=>{if(STA_FX.x0==null)return;const t=e.changedTouches[0],dx=t.clientX-STA_FX.x0,dy=t.clientY-STA_FX.y0;STA_FX.x0=null;
  if(Math.abs(dx)>40&&Math.abs(dx)>1.5*Math.abs(dy)){STA_FX.sw=Date.now();const el=topScreen();if(el&&el.querySelector("#fxc"))rerenderFacts(el,dx<0?1:-1)}},{passive:true});
/* écran fxl : tous les faits (liste), toucher = le fait */
function scrFactList(){const L=staFxList();
  return {title:`Le saviez-vous ?<small>${plur(L.length,"fait")}${L.some(f=>f[7])?", les nouveaux d’abord":""}</small>`,
    render:()=>L.length?`<div class="list sta-fxl">${L.map((f,i)=>`<button class="rowb" data-go="fx/${i}"><span class="grow"><small>${esc(staFam(f[1]))}${f[7]?` <span class="nw">nouveau</span>`:""}</small><span class="sta-ft">${esc(f[2])}</span></span><span class="chev">›</span></button>`).join("")}</div>`:SJ||STA.sj?`<p class="empty">Pas encore de fait publié par le robot.</p>`:skel(64,6),
    needs:L.length?[]:[loadSJ().finally(()=>{STA.sj=1})]}}
/* aide partagée (F-02, lsvSheet 1780) : au plus 2 faits dont les clés contiennent la 1re clé (l'équipe, le joueur), puis les autres (ses joueurs).
   À poser dans un onglet de fiche : staFactsBlk([p.key]) ou staFactsBlk([t.id, ...clés de ses joueurs]). "" si aucun fait. */
function staFactsBlk(keys,max=2){
  const F=staFxList();if(!F.length||!keys||!keys.length)return"";
  const K=new Set(keys.filter(Boolean)),k0=keys[0],has=(f,k)=>Array.isArray(f[6])&&f[6].includes(k);
  const L=[...F.filter(f=>has(f,k0)),...F.filter(f=>!has(f,k0)&&Array.isArray(f[6])&&f[6].some(k=>K.has(k)))].slice(0,max);
  if(!L.length)return"";
  return `<div class="blk sta-fb"><div class="bh">Le saviez-vous ?</div>${L.map(f=>{const i=F.indexOf(f);return `<div class="sta-fm"><button class="sta-fmt" data-go="fx/${i}">${f[7]?`<span class="nw">nouveau</span> `:""}${esc(f[2])}</button><button class="i" data-info="fx:${i}" aria-label="Comment c’est calculé">i</button></div>`}).join("")}</div>`;
}

/* ---------- branchements ---------- */
defScreen("st",{arg:"tab",screen:scrStats});
defScreen("fx",{arg:"id",screen:scrFacts,parse:a=>({v:"fx",id:a==null||a===""||isNaN(+a)?null:+a})});
defScreen("fxl",{screen:scrFactList});
defWidget("fact",wFact);
INFOP.fx=a=>{const f=staFxList()[+a];return f?["Comment c’est calculé",`<p>${esc(f[3])}</p><p class="small">${esc(staFam(f[1]))}${f[7]?" · nouveau : né au dernier passage du robot":""}. Faits calculés par le robot sur les données officielles, mis à jour toutes les 30 minutes.</p>`,true]:null};
