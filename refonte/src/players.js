/* =====================================================================================
   players.js — JOUEURS : grille des joueurs (pl), classement par poste (rk), Spécial Worlds (spe), fiche joueur (p),
   comparaison de deux joueurs (cmp) ; widget « Classement ».
   Propriétaire : agent joueurs. Conventions : nouveaux noms globaux préfixés ply (voir ARCHI.md), aucun rendu au chargement.
   Calculs repris de v13.5 (extraits de players.list.js : PSTAT, ranking, rkWhy, rkBest1, rkPair, rkDuel1, rkWorlds*, fj*…) ;
   données : SJ (stats.json) et FJ (fiche.json), déjà en mémoire, donc pas de bloc asynchrone ni de cache w26_ak_*.
   Trois niveaux : la réponse à l'écran (N1), le détail au toucher (onglet, écran suivant ou feuille, N2), la méthode derrière « i » (N3).
   ===================================================================================== */

/* ---------- état du module (mémoire de la session, rien dans localStorage) ---------- */
const PLY={role:"all",nat:null,q:"",live:false,leg:false,map:false,svg:null,mapP:null,mapAnim:true,st:"imp",rkLeg:false,qt:0};
const PLY_ISR=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>`;
const plyRoles=()=>[["all","Tous"],...ROLE_ORDER.map(r=>[r,ROLE_S[r]])];
const plyY=()=>{const R=RKX();return R&&R.y?R.y:"2026"};
/* ferme la feuille (et son entrée d'historique) puis fait fn : naviguer depuis une feuille sans laisser d'entrée orpheline */
function plyAfter(fn){
  if(SHEET.open&&history.state&&history.state.sheet){addEventListener("popstate",()=>setTimeout(fn,0),{once:true});closeSheet()}
  else{if(SHEET.open)hideSheet();fn()}}
/* écran du dessus s'il est de ce type */
const plyTop=v=>{const el=topScreen();return el&&el._d&&el._d.v===v?el:null};
/* ligne « libellé | réponse | › » (En bref, style de jeu, robot en bref) */
const plyLn=(lab,txt,attr)=>`<button class="ply-ln" ${attr}><b>${lab}</b><span>${txt}</span><i class="chev" aria-hidden="true">›</i></button>`;
const plyPct=v=>Math.round(v*100)+NB+"%";
/* fichiers du robot attendus par un écran : squelette pendant le chargement, puis une phrase s'ils manquent (réseau, robot en retard) */
const plyNeedFJ=()=>loadFJ().finally(()=>{PLY.fjDone=true});
const plyNeedSJ=()=>loadSJ().finally(()=>{PLY.sjDone=true});
const plyWaitFJ=(h,n=1)=>PLY.fjDone?`<p class="empty">Le détail (fiche du robot) n’est pas disponible pour l’instant. Réessaie dans quelques minutes.</p>`:skel(h,n);
const plyWaitSJ=(h,n=1)=>PLY.sjDone?`<p class="empty">Les stats du robot ne sont pas encore publiées. Réessaie dans quelques minutes.</p>`:skel(h,n);
/* « bien tout cadrer » : un écran qui dépasse de moins de 120 px se resserre (ply-fit1, puis ply-fit2) pour tenir sans mini défilement ;
   recalculé à chaque changement de taille (onglet, image chargée, rotation) par un ResizeObserver posé au montage */
function plyFit(el){if(!el||!el.isConnected||!el.classList)return;el.classList.remove("ply-fit1","ply-fit2","ply-fit3");
  /* « tient » : même règle que fitScr du socle (marge du bas rognable jusqu'à 12 px au-dessus de la barre d'accueil) */
  const sab=typeof SAB==="number"?SAB:0,ov=()=>el.scrollHeight-el.clientHeight,ok=()=>ov()<=1||el.scrollHeight-(parseFloat(getComputedStyle(el).paddingBottom)||0)+12+sab<=el.clientHeight+1;
  if(ok())return;
  /* intégrateur : une fiche (joueur, équipe, comparaison, spécial) qui dépasse 1,5 écran de moins de 90 px se resserre aussi
     (fiche de Faker › Aperçu avec le planning réel : ×1,53 sur iPhone 12) ; une liste défile telle quelle */
  if(ov()>=120){const d=el._d,lim=Math.round(innerHeight*1.5),tall=()=>el.scrollHeight-lim;
    if(!d||!/^(p|t|cmp|spe)$/.test(d.v)||(d.v==="t"&&d.tab==="ma")||tall()<=0||tall()>=90)return;
    for(const k of ["ply-fit1","ply-fit2","ply-fit3"]){el.classList.add(k);if(tall()<=0)return}return}
  for(const k of ["ply-fit1","ply-fit2","ply-fit3"]){el.classList.add(k);if(ok())return}}
function plyFitOn(el){if(!window.ResizeObserver||!el)return;if(!el._plyRo)el._plyRo=new ResizeObserver(()=>plyFit(el));const ro=el._plyRo;ro.disconnect();ro.observe(el);const c=el.querySelector(".scrin");if(c)ro.observe(c);
  /* nouveau contenu (onglet, rerendu) : on retire le resserrement AVANT que le socle ne mesure (microtâche, avant le ResizeObserver),
     sinon fitScr verrait l'ancien resserrement et poserait .snug à tort */
  if(!el._plyMo)el._plyMo=new MutationObserver(()=>el.classList.remove("ply-fit1","ply-fit2","ply-fit3"));el._plyMo.disconnect();el._plyMo.observe(el,{childList:true,subtree:true})}
function age(bd){if(!bd)return null;const b=new Date(bd);if(isNaN(b))return null;const n=new Date();let a=n.getFullYear()-b.getFullYear();if(n<new Date(n.getFullYear(),b.getMonth(),b.getDate()))a--;return a}
const plyDay=(d,h)=>new Date(d+"T"+(h||"12:00")+":00Z").toLocaleDateString("fr-FR",{day:"numeric",month:"short",timeZone:"Europe/Paris"});
/* « Le saviez-vous ? » d'une fiche : au plus 2 faits du robot (SJ.fx) liés à la première clé, puis aux autres (règle de lsvSheet, v13.5) */
function plyFacts(keys,max=2){
  const F=SJ&&Array.isArray(SJ.fx)?SJ.fx.filter(f=>Array.isArray(f)&&f.length>=8&&f[2]):[];if(!F.length||!keys||!keys.length)return"";
  const K=new Set(keys.filter(Boolean)),k0=keys[0],has=(f,k)=>Array.isArray(f[6])&&f[6].includes(k);
  const L=[...F.filter(f=>has(f,k0)),...F.filter(f=>!has(f,k0)&&Array.isArray(f[6])&&f[6].some(k=>K.has(k)))].slice(0,2);
  if(!L.length)return"";
  const one=f=>`<div class="ply-fx"><p>${f[7]?`<span class="tag on">nouveau</span> `:""}${esc(f[2])}</p><button class="i" data-info="${xi("fx|"+f[0],()=>["Comment c’est calculé",esc(f[3])])}" aria-label="Comment c’est calculé">i</button></div>`;
  const more=L.length>max?`<button class="ply-lk" data-info="${xi("fxm|"+keys.join(","),()=>["Le saviez-vous ?",L.map(f=>`<p>${f[7]?"<b>Nouveau.</b> ":""}${esc(f[2])}</p><p class="small">${esc(f[3])}</p>`).join(""),true])}">${L.length-max===1?"Un autre fait":(L.length-max)+" autres faits"}<i class="chev">›</i></button>`:"";
  return `<div class="blk"><div class="bh">Le saviez-vous ?</div>${L.slice(0,max).map(one).join("")}${more}</div>`}

/* faits d'une fiche : l'aide partagée du module stats (staFactsBlk : toucher → fx/<n>) quand elle existe, sinon plyFacts ;
   s'il y a plus de faits que la place, un lien « Un autre fait › » les montre tous (v13.5 en montrait 2) */
function plyFactsBlk(keys,max=2){
  if(typeof staFactsBlk!=="function")return plyFacts(keys,max);
  const h=safe(staFactsBlk,keys,max)||"";if(!h)return"";
  const F=SJ&&Array.isArray(SJ.fx)?SJ.fx.filter(f=>Array.isArray(f)&&f.length>=8&&f[2]):[],K=new Set(keys),k0=keys[0],has=(f,k)=>Array.isArray(f[6])&&f[6].includes(k);
  const L=[...F.filter(f=>has(f,k0)),...F.filter(f=>!has(f,k0)&&Array.isArray(f[6])&&f[6].some(k=>K.has(k)))].slice(0,2);
  if(L.length<=max)return h;
  /* « Un autre fait › » dans l'en-tête du bloc (place libre à droite du titre) : pas de ligne de plus à l'écran */
  const lk=`<button class="ply-bhl" data-info="${xi("fxm|"+keys.join(","),()=>["Le saviez-vous ?",L.map(f=>`<p>${f[7]?"<b>Nouveau.</b> ":""}${esc(f[2])}</p><p class="small">${esc(f[3])}</p>`).join(""),true])}">Un autre fait<i class="chev" aria-hidden="true">›</i></button>`;
  return h.includes('<div class="bh">Le saviez-vous ?</div>')?h.replace('<div class="bh">Le saviez-vous ?</div>',`<div class="bh">Le saviez-vous ?${lk}</div>`):h.replace(/<\/div>\s*$/,lk.replace("ply-bhl","ply-lk")+"</div>")}
/* ---------- widget de l'accueil : le n°1 de chaque poste ---------- */
function wRank(k){const R=RKX();if(!R)return"";const top=ROLE_ORDER.map(r=>R.P[r]&&R.P[r].r[0]&&pkey(R.P[r].r[0][0])).filter(Boolean);
  return W("w11","rk/TOP",`<div class="wh">Classement</div><div class="wb"><div class="ws" style="margin:0 0 6px">N°1 à chaque poste</div><div class="faces">${top.map(p=>`<span>${photo(p,"ava",40)}</span>`).join("")}</div><div class="ws"><b>${esc(top[0]?top[0].id:"")}</b> meilleur top</div></div>`,k,"","Classement par poste");}

/* =====================================================================================
   1. JOUEURS (pl) : recherche, poste, en lice, champions du monde, pays, carte du monde, grille de cartes holo
   ===================================================================================== */
function plyNats(){const n={};PLAYERS.forEach(p=>n[p.cc]=(n[p.cc]||0)+1);return Object.entries(n).sort((a,b)=>b[1]-a[1]||cname(a[0]).localeCompare(cname(b[0]),"fr"))}
function plyList(){const q=norm(PLY.q),R=PLY.live?records():null;
  return PLAYERS.filter(p=>(PLY.role==="all"||p.role===PLY.role)&&(!PLY.leg||p.titles.length)&&(!PLY.nat||p.cc===PLY.nat)&&(!PLY.live||status(p.team,R).k!=="out")
    &&(!q||norm(p.id).includes(q)||norm(p.realName).includes(q)||T[p.team].al.some(a=>a.includes(q))))}
function plyResults(){
  const L=plyList(),f=[PLY.role!=="all"?ROLE_S[PLY.role]:null,PLY.live?"en lice":null,PLY.leg?"champions du monde":null,PLY.nat?cname(PLY.nat):null,PLY.q?"« "+PLY.q.trim()+" »":null].filter(Boolean);
  return `<div class="ply-n"><span><b>${L.length}</b> joueur${L.length>1?"s":""}${f.length?" · "+esc(f.join(", ")):""}</span>${f.length?`<button class="chip" data-plyclear>Tout effacer</button>`:""}</div>`
    +(L.length?`<div class="ply-grid">${L.slice(0,PLY_FIRST).map(plyCardHTML).join("")}${L.length>PLY_FIRST?plyLater(L.slice(PLY_FIRST)):""}</div>`
      :`<p class="empty">Aucun joueur ne correspond.</p>`)}
/* intégrateur (performance, CPU ×4 : ouverture de 330 → ~150 ms) : les 24 premières cartes tout de suite, les autres juste après la
   première image (elles sont sous le pli) ; un jeton évite d'insérer des cartes d'un filtre déjà remplacé */
const PLY_FIRST=24,plyCardHTML=p=>`<button class="pl ply-card" data-go="p/${esc(p.key)}" aria-label="${esc(p.id)}, ${esc(T[p.team].name)}">${hcard(p,"mini")}</button>`;
function plyLater(rest){const tk=PLY.tk=(PLY.tk||0)+1;
  requestAnimationFrame(()=>setTimeout(()=>{const s=document.querySelector(`.ply-later[data-tk="${tk}"]`);if(s&&s.isConnected)s.outerHTML=rest.map(plyCardHTML).join("")},0));
  return `<i class="ply-later" data-tk="${tk}" hidden></i>`}
function plyMapHTML(){
  if(!PLY.map)return"";if(!PLY.svg)return `<div class="sk" style="height:168px;margin-top:6px"></div>`;
  let s=PLY.svg;if(PLY.nat)s=s.split(`data-plynat="${PLY.nat}" class="`).join(`data-plynat="${PLY.nat}" class="sel `);return s}
function plyBody(){
  const N=plyNats(),an=PLY.mapAnim&&PLY.svg&&!RM;if(an)PLY.mapAnim=false;
  return `<div class="ply-tools">
    <label class="ply-q">${PLY_ISR}<input class="ply-qi" type="search" enterkeyhint="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Pseudo, vrai nom ou équipe" aria-label="Chercher un joueur" value="${esc(PLY.q)}"></label>
    <div class="ply-seg" role="group" aria-label="Poste">${plyRoles().map(([k,l])=>`<button data-plyrole="${k}" aria-pressed="${PLY.role===k}">${l}</button>`).join("")}</div>
    <div class="ply-chips"><button class="chip" data-plytog="live" aria-pressed="${PLY.live}">En lice</button><button class="chip" data-plytog="leg" aria-pressed="${PLY.leg}">${ICUP}Champions du monde</button>${PLY.nat?`<button class="chip" data-plynat="${esc(PLY.nat)}" aria-pressed="true" aria-label="Retirer le filtre ${esc(cname(PLY.nat))}">${flag(PLY.nat)}${esc(cname(PLY.nat))} ×</button>`:`<button class="chip" data-plynats>Pays ›</button>`}</div>
  </div>
  <div class="ply-go"><button class="ply-gt" data-go="rk/TOP"><b>Classement 2026</b><small>le meilleur à chaque poste</small></button><button class="ply-gt" data-go="spe"><b>Spécial Worlds</b><small>qui se transforme ?</small></button></div>
  <details class="blk ply-map"${PLY.map?" open":""}><summary><span><b>Tous les chemins mènent à Allen</b><small>${N.length} nationalités · touche un pays pour filtrer</small></span><i class="chev" aria-hidden="true">›</i></summary><div class="ply-wm${an?" anim":""}">${plyMapHTML()}</div></details>
  <div class="ply-res">${plyResults()}</div>`}
function scrPlayers(){return {title:`Joueurs<small>${PLAYERS.length} titulaires des Worlds</small>`,info:"pl",render:()=>plyBody(),
  opened:el=>{if(PLY.map&&!PLY.svg)plyMapLoad(el)}}}
/* carte du monde (d3 + topojson chargés à la demande, comme v13.5) : pays colorés selon l'effectif, arcs vers Allen, points */
function plyMapLoad(el){
  if(!PLY.mapP)PLY.mapP=(async()=>{try{
    if(!window.d3)await loadScript("https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js");
    if(!window.topojson)await loadScript("https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js");
    const w=await (await fetch("https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json")).json();
    const feats=topojson.feature(w,w.objects.countries).features.filter(f=>String(f.id)!=="010");
    const Wd=760,Hd=390,proj=d3.geoNaturalEarth1().fitExtent([[4,4],[Wd-4,Hd-4]],{type:"Sphere"}),path=d3.geoPath(proj);
    const nats={};PLAYERS.forEach(p=>nats[p.cc]=(nats[p.cc]||0)+1);const byNum={};Object.entries(NUM).forEach(([cc,n])=>byNum[n]=cc);
    let s=`<svg viewBox="0 0 ${Wd} ${Hd-52}" role="img" aria-label="Carte des nationalités des joueurs">`;
    feats.forEach(f=>{const cc=byNum[String(f.id).padStart(3,"0")],n=cc&&nats[cc];s+=n?`<path data-plynat="${cc}" class="land has" d="${path(f)}" style="fill-opacity:${(.45+.55*Math.min(1,n/30)).toFixed(2)}"><title>${esc(cname(cc))} : ${n}</title></path>`:`<path class="land" d="${path(f)}"/>`});
    Object.keys(nats).filter(cc=>GEO[cc]&&cc!=="us").sort((a,b)=>nats[a]-nats[b]).forEach((cc,i)=>{const d=path({type:"LineString",coordinates:[GEO[cc],ALLEN]});
      s+=`<path class="arc" pathLength="1" d="${d}" style="animation-delay:${(i*.08).toFixed(2)}s"/><path class="flow" pathLength="1" d="${d}" style="animation-delay:${(1.2+i*.27).toFixed(2)}s;animation-duration:${(2.2+(i%4)*.4).toFixed(1)}s"/>`});
    const [hx,hy]=proj(ALLEN);s+=`<circle class="hostring" cx="${hx}" cy="${hy}" r="6"/><circle class="host" cx="${hx}" cy="${hy}" r="4"/><text class="hostlbl" x="${hx+8}" y="${hy+14}">Allen, TX</text>`;
    Object.keys(nats).filter(cc=>GEO[cc]).forEach(cc=>{const [x,y]=proj(GEO[cc]),n=nats[cc],r=4+Math.sqrt(n)*1.9;s+=`<circle data-plynat="${cc}" class="dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}"><title>${esc(cname(cc))} : ${n}</title></circle>${r>8?`<text class="dotn" x="${x.toFixed(1)}" y="${y.toFixed(1)}">${n}</text>`:""}`});
    PLY.svg=s+"</svg>"}
   catch(e){PLY.svg=`<p class="note" style="margin:6px 0 4px">Carte indisponible (réseau).</p><div class="ply-nats">${plyNats().map(([cc,n])=>`<button class="chip" data-plynat="${cc}" aria-pressed="${PLY.nat===cc}">${flag(cc)}${esc(cname(cc))}<b>${n}</b></button>`).join("")}</div>`}})();
  PLY.mapP.then(()=>{const e=plyTop("pl")||el;if(e&&e.isConnected)refreshTab(e,0)});
}
function plyRefresh(){NAV.forEach(x=>{if(x.d.v==="pl"&&x.el.isConnected)refreshTab(x.el,0)})}
function plyNatSheet(){showSheet("Nationalités",`<p>${PLAYERS.length} titulaires, ${plyNats().length} pays. Touche un pays pour filtrer les joueurs.</p><div class="ply-nats">${plyNats().map(([cc,n])=>`<button class="chip" data-plynat="${cc}" aria-pressed="${PLY.nat===cc}">${flag(cc)}${esc(cname(cc))}<b>${n}</b></button>`).join("")}</div>`,true)}
onAct("[data-plyrole]",b=>{PLY.role=b.dataset.plyrole;vib(6);plyRefresh()});
onAct("[data-plytog]",b=>{const k=b.dataset.plytog;PLY[k]=!PLY[k];vib(6);plyRefresh()});
onAct("[data-plynats]",()=>plyNatSheet());
onAct("[data-plynat]",b=>{const cc=b.dataset.plynat;PLY.nat=PLY.nat===cc?null:cc;vib(8);plyAfter(()=>{plyRefresh();const el=plyTop("pl"),r=el&&el.querySelector(".ply-res");if(PLY.nat&&r&&!RM)r.scrollIntoView({behavior:"smooth",block:"start"})})});
onAct("[data-plyclear]",()=>{Object.assign(PLY,{role:"all",nat:null,q:"",live:false,leg:false});vib(6);plyRefresh()});
/* frappe dans la recherche : seule la liste est redessinée (le champ garde le clavier) */
document.addEventListener("input",e=>{const t=e.target;if(!t||!t.classList||!t.classList.contains("ply-qi"))return;PLY.q=t.value;clearTimeout(PLY.qt);
  PLY.qt=setTimeout(()=>{const el=t.closest(".scr"),r=el&&el.querySelector(".ply-res");if(!r)return;r.innerHTML=plyResults();const c=el.querySelector(".tabc");if(c&&el._o&&el._o.render)c._h=safe(el._o.render,el._d.tab)},120)});
document.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target&&e.target.classList&&e.target.classList.contains("ply-qi"))e.target.blur()});
/* carte : chargée à la première ouverture du repli */
document.addEventListener("toggle",e=>{const d=e.target;if(!d||!d.classList||!d.classList.contains("ply-map"))return;PLY.map=d.open;
  const el=d.closest(".scr"),c=el&&el.querySelector(".tabc");if(PLY.map&&!PLY.svg)plyMapLoad(el);else if(c&&el._o)c._h=safe(el._o.render,el._d.tab)},true);
INFO.pl=()=>["Joueurs","Les 95 titulaires des 19 équipes. Cherche par pseudo, vrai nom ou équipe ; filtre par poste, équipes encore en lice, champions du monde ou pays (aussi en touchant la carte). Touche une carte pour la fiche du joueur."];

/* =====================================================================================
   2. CLASSEMENT PAR POSTE (rk/<poste>) : phrase-réponse, podium, lignes avec fourchette et raisons ; tri par stat brute
   ===================================================================================== */
function scrRank(d){
  const R=RKX();if(!R)return {title:"Classement par poste",render:()=>plyWaitSJ(52,8),needs:[plyNeedSJ()]};
  if(!ROLE_ORDER.includes(d.id))d.id="TOP";d.tab=d.id;
  return {title:`Classement par poste<small>${PLY.st==="imp"?"note d’impact, ligues comprises":"stat brute, ligues mélangées"}</small>`,info:"classement",tabs:ROLE_ORDER.map(r=>[r,ROLE_S[r]]),tab:d.id,render:r=>{d.id=r;return plyRankTab(r)}};
}
function plyRkRow(x){const p=pkey(x.key);if(!p)return"";const rg=x.lo!=null&&x.lo!==x.hi?`${x.lo}–${x.hi}e`:"";
  return `<button class="ply-rkr${x.i<=3?" top3":""}" data-info="why:${esc(x.key)}" aria-label="${esc(p.id)}, ${ordi(x.i)}, pourquoi ce rang"><span class="n">${x.i}${rg?`<small>${rg}</small>`:""}</span>${photo(p,"ava",38)}<span class="tx"><b>${esc(p.id)}${p.titles.length?`<i class="ply-cup" title="Champion du monde">${ICUP}</i>`:""}</b><small>${logo(p.team,13)}${esc(tid(p.team))} · ${rkLine(x)}</small></span><em class="${x.note<0?"neg":""}">${fxs(x.note)}</em></button>`}
function plyRankTab(role){
  const R=RKX(),st=PSTAT.find(z=>z[0]===PLY.st)||PSTAT[0];
  const ctl=`<div class="ply-sort"><button class="chip gold" data-info="plysort">Trier : ${esc(st[1])} ▾</button><button class="chip" data-plyrkleg aria-pressed="${PLY.rkLeg}">${ICUP}Champions</button></div>`;
  const tail=`<button class="rowb ply-more" data-go="spe"><span class="grow"><b class="nm">Spécial Worlds</b><small>qui se transforme aux grands tournois ?</small></span><i class="chev">›</i></button>`;
  if(st[0]!=="imp")return ctl+plyRawList(role,st)+tail;
  let L=R.P[role].r.map(z=>rkFind(z[0])).filter(Boolean);
  if(PLY.rkLeg){L=L.filter(x=>{const p=pkey(x.key);return p&&p.titles.length});
    return ctl+`<p class="ply-ans">Les champions du monde parmi les ${R.P[role].r.length} ${RK_ROLEN[role]}, et leur rang à leur poste.</p>`+(L.length?`<div class="list ply-rkl">${L.map(plyRkRow).join("")}</div>`:`<p class="empty">Aucun champion du monde à ce poste.</p>`)+tail}
  const top=L.slice(0,3).map(x=>{const p=pkey(x.key);return p?`<div class="pl" data-go="p/${esc(p.key)}" role="button" aria-label="${esc(p.id)}, ${ordi(x.i)}">${hcard(p,"mini")}<b>${ordi(x.i)}</b><small>${x.lo!==x.hi?`${x.lo}–${x.hi}e · `:""}${fxs(x.note)}</small></div>`:""}).join("");
  return ctl+`<p class="ply-ans">${rkBest1(role)}</p><div class="podium">${top}</div><div class="list ply-rkl">${L.slice(3).map(plyRkRow).join("")}</div>${tail}`;
}
function plyRawList(role,d){
  const inF=p=>p.role===role&&(!PLY.rkLeg||p.titles.length),r=ranking(d[0],inF),out=PLAYERS.filter(p=>inF(p)&&!r.some(x=>x.p===p));
  const lab=/^[A-Z]{2}/.test(d[1])?d[1]:d[1].charAt(0).toLowerCase()+d[1].slice(1);
  return `<p class="ply-ans">Classement <b>brut</b> : ${esc(lab)} sur la saison, ligues mélangées. Un même chiffre ne vaut pas autant en LCK qu’en CBLOL ; la note d’impact, elle, en tient compte.</p>
    <div class="list ply-rkl">${r.map((x,i)=>`<button class="ply-rkr" data-go="p/${esc(x.p.key)}"><span class="n">${i+1}</span>${photo(x.p,"ava",38)}<span class="tx"><b>${esc(x.p.id)}</b><small>${logo(x.p.team,13)}${esc(tid(x.p.team))} · ${seasonOf(x.p).g} parties</small></span><em>${d[3](x.v)}</em></button>`).join("")||`<p class="empty">Aucun joueur.</p>`}</div>
    <p class="note">Rang brut, ${MINR} parties minimum${out.length?`. Pas assez de parties : ${out.map(p=>esc(p.id)).join(", ")}`:""}.</p>`}
INFO.plysort=()=>["Trier le classement",`<p>La note d’impact compare les joueurs ligues comprises. Les autres stats sont brutes, ligues mélangées.</p><div class="ply-nats">${PSTAT.map(([k,l])=>`<button class="chip" data-plyst="${k}" aria-pressed="${PLY.st===k}">${esc(l)}</button>`).join("")}</div>`,true];
onAct("[data-plyst]",b=>{PLY.st=b.dataset.plyst;vib(6);plyAfter(()=>{const el=plyTop("rk");if(el)rerender(el)})});
onAct("[data-plyrkleg]",()=>{PLY.rkLeg=!PLY.rkLeg;vib(6);const el=plyTop("rk");if(el)refreshTab(el,0)});
INFO.classement=()=>{const R=RKX();return ["Classement par poste",`${rkMethod()}<p>Entre parenthèses, sous chaque nom : rang parmi les 19 titulaires du poste sur la stat brute de la saison${R?" "+esc(R.y):""}, ligues mélangées. Sous le rang : les places possibles vu l’incertitude (1–3e : entre 1er et 3e). Touche une ligne pour le pourquoi.</p>`,true]};
/* « Pourquoi ce rang » : la note décomposée en 6 barres, la saison avec les rangs bruts, la fiche et le voisin à comparer */
INFOP.why=(key,self)=>{const x=rkFind(key),R=RKX();if(!x)return null;
  const mx=Math.max(.05,...x.g.map(Math.abs)),tot=rkPts(x.note-x.m),s=x.s,r=x.rk,L=R.P[x.role].r,j=x.i>1?L[x.i-2][0]:(L[1]||[])[0];
  const st=[[s[2]!=null,`or à 15 min ${rkSg(s[2])}`,r[0]],[s[3]!=null,`CS à 15 min ${rkSg(s[3],fx1)}`,r[1]],[x.role!=="SUP"&&s[4]!=null,`${fx2(s[4]||0)} CS/min`,r[2]],
    [s[5]!=null,`${Math.round(s[5]||0)} or/min`,r[3]],[s[6]!=null,`KDA ${fx1(s[6]||0)}`,r[4]],[s[7]!=null,`${Math.round(s[7]||0)}${NB}% aux kills`,r[5]]].filter(z=>z[0]);
  return [self?"Pourquoi ce rang":`${rkNm(key)} : pourquoi ce rang`,`<p><b>${ordi(x.i)} des ${x.n} ${RK_ROLEN[x.role]}</b>${x.lo!==x.hi?` (entre le ${ordi(x.lo)} et le ${ordi(x.hi)})`:""}, note ${fxs(x.note)}. ${rkWhy(x)}</p>
    <p>Écart au ${RK_ROLE1[x.role]} moyen des Worlds : <b>${rkPt(tot)}</b> de chances de victoire dans une partie équilibrée. D’où il vient :</p>`
    +x.g.map((g,i)=>`<div class="contrib"><span>${RK_LAB[RK_AX[i]]}</span><span class="tr"><i class="${g<0?"n":""}" style="${g<0?"right":"left"}:50%;width:${(Math.abs(g)/mx*50).toFixed(1)}%"></i></span><em>${rkSg(rkPts(g),fx1)}</em></div>`).join("")
    +`<p class="ply-sst">Saison ${esc(R.y)} : ${s[0]} parties, ${Math.round(s[1]/Math.max(1,s[0])*100)}${NB}% de victoires.<br>${st.map(z=>`${esc(z[1])} <i class="rk${z[2]<=3?" top":""}">${ordi(z[2])}</i>`).join(" · ")}<br><span>Rangs bruts sur ${x.n}.</span></p>
    <div class="ply-btns">${self?`<button class="btn" data-go="rk/${x.role}">Classement des ${RK_ROLEN[x.role]} ›</button>`:`<button class="btn" data-go="p/${esc(key)}">Fiche de ${esc(rkNm(key))} ›</button>`}${j?`<button class="btn" data-cmp="${esc(key)}|${esc(j)}">Comparer avec ${esc(rkNm(j))} ›</button>`:""}</div>`,true]};

/* =====================================================================================
   3. SPÉCIAL WORLDS (spe/<onglet>/<focus>) : qui se transforme aux grands tournois (équipes, joueurs)
   ===================================================================================== */
function scrSpe(d){const R=RKX();
  if(!R||!R.T)return {title:"Spécial Worlds",render:()=>plyWaitSJ(60,4),needs:[plyNeedSJ()]};
  if(!d.tab)d.tab=d.id&&pkey(d.id)?"jo":"eq";
  return {title:"Spécial Worlds<small>qui se transforme aux grands tournois ?</small>",info:"spe",head:`<p class="ply-ans ply-spea">${rkWorlds1()}</p>`,
    tabs:[["eq","Équipes"],["jo","Joueurs"]],tab:d.tab,render:t=>t==="jo"?plySpePl(d.id):plySpeTm(d.id),mount:plyFitOn}}
function plySpeTm(focus){
  const R=RKX(),TT=R.T,ft=focus&&TT[focus]?focus:null;
  const rows=Object.entries(TT).filter(([t,v])=>v[0]>=8).sort((a,b)=>(b[1][1]-b[1][2])-(a[1][1]-a[1][2]));
  const row=([t,v])=>`<button class="ply-wr${t===ft?" me":""}" data-go="t/${esc(t)}"><span>${logo(t,22)}<b>${esc(tid(t))}</b>${v[7]?`<i class="tag ${v[7]>0?"on":"w"}">net</i>`:""}</span><span>${v[8]&&v[8][0]?Math.round(v[8][1]/v[8][0]*100)+NB+"%":"–"}</span><span><b class="${v[7]>0?"up":v[7]<0?"dn":""}">${rkSg(v[1]-v[2],fx1)}</b><small>${v[0]} p.</small></span></button>`;
  const th=`<div class="ply-wr hd"><span>Équipe</span><span>Ligue ${esc(R.y)}</span><span>Internat.</span></div>`;
  let h="";
  if(ft){const a=rkWorldsT1(ft);if(a)h+=`<div class="blk"><div class="bh">${logo(ft,20)} ${esc(tid(ft))}</div><p class="ply-p"><b>${a[0]}</b> (${a[1]}).</p>${rkWorldsT2(ft,true)}</div>`}
  const all=xi("speT",()=>["Les "+rows.length+" équipes",`<p>Victoires en plus ou en moins de ce que prévoyait la note de leurs joueurs, aux internationaux depuis 2024.</p><div class="ply-wl">${th}${rows.map(row).join("")}</div>`,true]);
  h+=`<div class="blk"><div class="bh">Les équipes<span class="tag">réel − attendu</span><button class="i" data-info="spe" aria-label="Méthode">i</button></div>
    <div class="ply-wl">${th}${rows.slice(0,3).map(row).join("")}${rows.length>5?`<div class="ply-wr gap"><span>…</span></div>`:""}${rows.slice(Math.max(3,rows.length-2)).map(row).join("")}</div>
    <button class="ply-lk" data-info="${all}">Les ${rows.length} équipes<i class="chev">›</i></button></div>`;
  return h}
function plySpePl(focus){
  const R=RKX(),I=R.I||{},fp=focus?pkey(focus):null,lb=v=>v[10]-1.645*v[11];
  const pl=Object.entries(I).filter(([k,v])=>v[7]>=20&&v[10]!=null&&v[11]).sort((a,b)=>lb(b[1])-lb(a[1])),nup=pl.filter(([k,v])=>lb(v)>0).length;
  const row=([k,v])=>`<button class="ply-wr${k===focus?" me":""}" data-go="p/${esc(k)}"><span>${logo(rkTm(k),20)}<b>${esc(rkNm(k))}</b></span><span>${v[7]} p.</span><span><b class="${lb(v)>0?"up":""}">${rkPt(rkPts(v[10]))}</b><small>±${fx1(rkPts(1.645*v[11]))}</small></span></button>`;
  const th=`<div class="ply-wr hd"><span>Joueur</span><span>Parties</span><span>Écart</span></div>`;
  let h="";
  if(fp){const a=rkWorldsP1(focus);h+=`<div class="blk"><div class="bh">${photo(fp,"ava",24)} ${esc(fp.id)}</div><p class="ply-p"><b>${a[0]}</b>${a[1]?` (${a[1]})`:""}.</p><div class="ply-p">${rkWorldsP2(focus,true)}</div></div>`}
  const all=xi("speP",()=>["Les "+pl.length+" joueurs",`<p>Stats aux Worlds en plus ou en moins de leur note, en points de chances de victoire, avec la marge d’erreur à 90${NB}%.</p><div class="ply-wl">${th}${pl.map(row).join("")}</div>`,true]);
  h+=`<div class="blk"><div class="bh">Les joueurs, aux Worlds<span class="tag">écart à leur note</span><button class="i" data-info="spe" aria-label="Méthode">i</button></div>
    <div class="ply-wl">${th}${pl.slice(0,fp?3:5).map(row).join("")}</div><p class="ply-sub">En vert : au-delà de la marge, ${nup} sur ${pl.length} (le hasard en donnerait ${fx1(.05*pl.length)}).</p>
    <button class="ply-lk" data-info="${all}">Les ${pl.length} joueurs<i class="chev">›</i></button></div>`;
  return h}
INFO.spe=()=>["Spécial Worlds",`<p>Équipes : victoires en plus ou en moins de ce que prévoyait la note de leurs joueurs, aux internationaux depuis 2024 (au moins 8 parties) ; « net » : au-delà du hasard. Joueurs : stats aux Worlds seuls en plus ou en moins de leur note, en points de chances de victoire, avec la marge d’erreur à 90${NB}% (au moins 20 parties depuis 2024), du résultat le plus sûr au moins sûr. Une tendance, pas une preuve.</p>${rkWorldsMethod()}`,true];
/* boutons des extraits de v13.5 (rkWorldsP2, rkWorldsT2) : data-rkw = joueur, équipe ou rien */
onAct("[data-rkw]",b=>{const k=b.dataset.rkw;plyAfter(()=>go("spe"+(k?(pkey(k)?"/jo/":"/eq/")+encodeURIComponent(k):"")))});

/* =====================================================================================
   4. FICHE JOUEUR (p/<clé>/<onglet>) : Aperçu (prochain duel, En bref, faits) · Saison · Duels · Champions
   ===================================================================================== */
function scrPlayer(d){
  const p=pkey(d.id);if(!p)return {title:"Joueur",body:`<p class="empty">Joueur introuvable.</p>`};
  const x=rkOf(p),t=T[p.team],a=age(p.birth),wy=(p.worlds||[]).length,foe=SJ?safe(bestFoe,p):null,im=SJ&&SJ.m?IMP(p):null;
  /* profil en une ligne (P-03) : âge, ligue, n-ièmes Worlds, titres ; l'identité complète au toucher */
  const id=[a!=null?a+" ans":null,t.league,wy?(wy===1?"premiers Worlds":wy+"e Worlds"):null,p.titles.length?plur(p.titles.length,"titre"):null].filter(Boolean).join(" · ");
  const head=`<div class="phead"><span data-tilt style="display:block">${hcard(p)}</span><div class="prk">${x?`<button class="ply-rkb" data-info="why:${esc(p.key)}:1" aria-label="Pourquoi ce rang"><span class="rn">${ordS(x.i)}</span><span class="rl">des ${x.n} ${ROLE_PL[x.role]} des Worlds</span><span class="rs">${x.lo!==x.hi?`entre ${ordi(x.lo)} et ${ordi(x.hi)} · `:""}<span class="ply-nw">note ${fxs(x.note)}${im&&im[1]?` ±${fx2(im[1])}`:""}&nbsp;<b>›</b></span></span></button>`:`<span class="rl">${ROLES[p.role]}</span>`}
    <button class="ply-idb" data-info="${xi("pid|"+p.key,()=>[p.id+(p.realName?" ("+p.realName+")":""),plyIdHTML(p),true])}" aria-label="Profil de ${esc(p.id)}"><span>${esc(id)}&nbsp;<b>›</b></span></button>
    <div class="act">${x?`<button class="chip gold" data-go="rk/${p.role}">Classement ›</button>`:""}${foe?`<button class="chip" data-cmp="${esc(p.key)}|${esc(foe.key)}">Comparer ›</button>`:""}</div></div></div>`;
  return {title:`${esc(p.id)}<small>${esc(t.name)} · ${ROLES[p.role]}</small>`,info:"joueur",head,tabs:[["ap","Aperçu"],["sa","Saison"],["du","Duels"],["ch","Champions"]],
    render:tb=>tb==="sa"?plyPSa(p):tb==="du"?plyPDu(p):tb==="ch"?plyPCh(p):plyPAp(p),mount:el=>{tiltOn(el);plyFitOn(el)},needs:[plyNeedFJ(),plyNeedSJ()]};
}
/* identité (Leaguepedia et Liquipedia croisées) */
function plyIdHTML(p){const t=T[p.team],b=p.birth?new Date(p.birth+"T12:00:00Z"):null,lp=`https://lol.fandom.com/wiki/${encodeURIComponent(String(p.page||p.id).replace(/ /g,"_"))}`;
  return `<dl class="kv">${p.realName?`<dt>Nom</dt><dd>${esc(p.realName)}${p.native?" ("+esc(p.native)+")":""}</dd>`:""}${b&&!isNaN(b)?`<dt>Né le</dt><dd>${esc(b.toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}))}</dd>`:""}${p.worlds&&p.worlds.length>1?`<dt>Worlds</dt><dd>${p.worlds.filter(y=>y<2026).join(", ")}</dd>`:""}${p.titles.length?`<dt>Titres</dt><dd>${p.titles.join(", ")}</dd>`:""}<dt>Nationalité</dt><dd>${flag(p.cc)} ${esc(cname(p.cc))}</dd><dt>Équipe</dt><dd>${esc(t.name)} (${esc(t.league)})</dd>${p.cc!==t.cc?`<dt>Expatrié</dt><dd>joue loin de son pays</dd>`:""}</dl>
    <div class="ply-btns"><button class="btn" data-go="t/${esc(t.id)}">${logo(t.id,20)} Fiche ${esc(t.id)} ›</button><a class="btn" href="${lp}" target="_blank" rel="noopener">Fiche Leaguepedia ↗</a></div>
    <p class="small" style="margin-top:10px">Identité Leaguepedia et Liquipedia croisées le 24/10/2026 ; date de naissance seulement si les deux concordent.</p>`}
function plyPAp(p){
  let h="";const x=rkOf(p),R=RKX();
  /* prochain duel (P-08) → duel de deux joueurs (d/, module match) */
  const nm=nextOf(p.team),o=nm?oppOf(p,nm):null;
  if(o){const pr=FJ?safe(fcPair,p,o):null,rp=safe(rkPair,p.key,o.key),dl=SJ&&SJ.duels&&SJ.duels[norm(p.id)+"|"+norm(o.id)];
    const bil=pr&&pr.a.g?`${pr.a.w}–${pr.a.g-pr.a.w} en lane depuis ${FJ.per.duo}${rp?`, ${Math.round(rp.e)} victoires attendues`:""}`:dl&&dl.g?`${dl.w}–${dl.g-dl.w} en lane depuis ${String(SJ.since||"2024").slice(0,4)}`:"jamais affrontés en lane";
    h+=`<button class="rowb ply-nd" data-go="d/${esc(p.key)}~${esc(o.key)}">${photo(p,"ava",40)}<span class="ply-vs">VS</span>${photo(o,"ava",40)}<span class="grow"><b class="nm">${nm.state==="live"?"En direct contre ":"Prochain duel : "}${esc(o.id)}</b><small>${nm.state==="live"?esc(tid(o.team)):esc(whenTxt(new Date(nm.start)))} · ${esc(bil)}</small></span><i class="chev" aria-hidden="true">›</i></button>`}
  /* En bref (P-04 à P-07) : une ligne chacun, le détail au toucher ; le profil (P-03) est dans la tête, sous le rang */
  const rows=[];
  if(x){const fs=x.fs.map(i=>rkTag(x,i,true,true)).filter(Boolean),wk=x.wk>=0?rkTag(x,x.wk,false,true):"";
    rows.push(plyLn("Rang",`${ordi(x.i)} des ${x.n} ${RK_ROLEN[x.role]}${x.lo!==x.hi?` <em>(${ordi(x.lo)} à ${ordi(x.hi)})</em>`:""}<small>${esc([fs.length?"Atout"+(fs.length>1?"s":"")+" : "+fs.join(", "):"",wk?"Faible : "+wk:""].filter(Boolean).join(". "))}</small>`,`data-info="why:${esc(p.key)}:1"`))}
  if(FJ){const F=safe(fcForm,p);if(F&&F.last.length){const w=F.last.filter(z=>z.w).length,s=F.streak;
      rows.push(plyLn("Forme",`${w} V – ${F.last.length-w} D sur ses ${F.last.length} dernières${Math.abs(s)>=3?`<small>${Math.abs(s)} ${s>0?"victoires":"défaites"} de suite${F.tag?", en "+F.tag:""}</small>`:F.tag?`<small>en ${F.tag}</small>`:""}`,`data-tab="sa"`))}
    const C=safe(fcChamps,p,"y");if(C&&C.rows.length){const c=C.rows[0];rows.push(plyLn("Signature",`${champ(c.c,20)} ${esc(c.c)}<small>${plur(c.g,"partie")} en ${esc(FJ.y)}, ${c.w} V – ${c.g-c.w} D</small>`,`data-tab="ch"`))}
    const des=safe(fcDesig,p);if(des){const L=safe(fcDuo,p)||[],pick=i=>des.y[i]?[des.y[i],"y"]:des.a[i]?[des.a[i],"a"]:null,n=pick(0),v=pick(1);
      const line=(z,per)=>{const q=L.find(y=>y.nm===z.nm&&y.tm===z.tm),r=q&&(per==="y"?q.y:q.a);return `${esc(z.nm)} <em>(${esc(z.tm)})</em>${r?`<small>${r.w} V – ${r.g-r.w} D ${per==="y"?"en "+esc(FJ.y):"depuis "+esc(FJ.per.duo)} · ${fx1(r.exp)} V attendues</small>`:""}`};
      rows.push(n?plyLn("Némésis",line(...n),`data-tab="du"`):v?plyLn("Victime",line(...v),`data-tab="du"`):plyLn("Duels",`personne ne le domine<small>au moins ${FJ.cfg.nem[0]} duels en lane</small>`,`data-tab="du"`))}}
  if(R&&R.I){const w=rkWorldsP1(p.key,true);rows.push(plyLn("Worlds",`${w[0]}${w[1]?`<small>${w[1]}</small>`:""}`,`data-info="${xi("pw|"+p.key,()=>["Aux grands tournois",rkWorldsP2(p.key),true])}"`))}
  h+=`<div class="blk"><div class="bh">En bref<button class="i" data-info="enbref" aria-label="D’où viennent ces lignes">i</button></div><div class="ply-lns">${rows.join("")}</div>${FJ||PLY.fjDone?"":skel(44,2)}</div>`;
  h+=plyFactsBlk([p.key]);
  return h}
/* gauges de rang (B) : stat de saison et rang brut au poste */
const plyGz=(lab,v,rank,n)=>v==null?"":`<div class="st"><span class="lb">${lab}</span><span class="vv">${v}${rank?`<em>${ordi(rank)}</em>`:""}</span>${rank?`<span class="gz"><i style="left:${(n>1?(n-rank)/(n-1)*100:50).toFixed(1)}%"></i></span>`:""}</div>`;
function plyPSa(p){
  const x=rkOf(p),S=seasonOf(p);let h="";
  /* style de jeu : début de partie (fl.p, P-09) et profil à adversaires égaux (fcProf, P-13), rangés dans le bloc de la saison */
  const st=[],fl=plyFl(p),P=FJ?safe(fcProf,p):null;
  if(fl)st.push(plyLn("Tempo",`${fl.tag}<small>${plyPct(fl.sh)} de ses kills et assists avant 15 min (${ROLE_PL[p.role]} : ${plyPct(fl.rs)})</small>`,`data-info="${xi("fl|"+p.key,()=>["Début de partie",fl.det,true])}"`));
  if(P&&P.ax.length){const sub=P.f.length||P.w.length?[P.f.length?"fort : "+P.f.map(k=>FJ_AX[k][1]).join(", "):"",P.w.length?"faible : "+P.w.map(k=>FJ_AX[k][1]).join(", "):""].filter(Boolean).join(" · "):"profil équilibré";
    st.push(plyLn("Profil",`${esc(sub.charAt(0).toUpperCase()+sub.slice(1))}<small>à adversaires égaux</small>`,`data-info="${xi("pf|"+p.key,()=>[`Profil ${FJ.y}, à adversaires égaux`,plyProfHTML(p,P),true])}"`))}
  const sty=st.length?`<div class="ply-lns ply-sty">${st.join("")}</div>`:"";
  const all=S?`<button class="ply-lk" data-info="${xi("pst|"+p.key,()=>["Saison "+plyY()+" de "+p.id,plyAllStats(p),true])}">Toutes ses stats ${esc(plyY())}, avec leur rang<i class="chev">›</i></button>`:"";
  if(x){const s=x.s,r=x.rk,n=x.n;
    h+=`<div class="blk"><div class="bh">Saison ${esc(plyY())}<span class="tag">${s[0]} parties · ${Math.round(s[1]/Math.max(1,s[0])*100)}${NB}% V</span><button class="i" data-info="saison" aria-label="Lire ces chiffres">i</button></div>
      ${plyGz("Or à 15 min face au vis-à-vis",s[2]!=null?sgn(s[2]):null,r[0],n)}${p.role!=="SUP"?plyGz("CS par minute",s[4]!=null?fx2(s[4]):null,r[2],n):plyGz("Or par minute",s[5]!=null?Math.round(s[5]):null,r[3],n)}
      ${plyGz("KDA",s[6]!=null?fx1(s[6]):null,r[4],n)}${plyGz("Participation aux kills",s[7]!=null?Math.round(s[7])+NB+"%":null,r[5],n)}${sty}${all}</div>`}
  else if(S)h+=`<div class="blk"><div class="bh">Saison ${esc(plyY())}<span class="tag">${S.g} parties</span></div>${plyAllStats(p)}${sty}</div>`;
  else if(sty)h+=`<div class="blk"><div class="bh">Saison ${esc(plyY())}</div>${sty}</div>`;
  /* forme (B : 10 icônes ; v13.5 : moyenne contre saison, règle stricte de la tendance) */
  const F=FJ?safe(fcForm,p):null;
  if(F&&F.last.length){const L=F.last,w=L.filter(z=>z.w).length,S2=F.S,kL=L.reduce((s,z)=>[s[0]+z.k,s[1]+z.d,s[2]+z.a],[0,0,0]),g15=L.filter(z=>z.gd!=null);
    h+=`<div class="blk"><div class="bh">10 dernières parties<span class="tag ${F.tag==="hausse"?"on":F.tag?"w":""}">${w}–${L.length-w}${F.tag?" · en "+F.tag:""}</span><button class="i" data-info="plyform" aria-label="La règle de la tendance">i</button></div>
      <div class="form">${L.map((z,i)=>`<button class="${z.w?"ply-w":"ply-l"}" data-info="${xi("g|"+p.key+"|"+i+"|"+z.date,()=>[`${z.w?"Victoire":"Défaite"} contre ${z.opp}`,plyGameHTML(z),true])}" aria-label="${z.w?"Victoire":"Défaite"} contre ${esc(z.opp)}">${champ(z.c,28)}</button>`).join("")}</div>
      <button class="ply-lk ply-lk3" data-info="${xi("gl|"+p.key,()=>["Ses "+L.length+" dernières parties",L.map(plyGameRow).join("")+`<p class="small" style="margin-top:8px">Saison : ${S2.w} V – ${S2.g-S2.w} D. Heures de Paris ; or d’une partie arrondi à 100.</p>`,true])}"><span>KDA ${fx1((kL[0]+kL[2])/Math.max(1,kL[1]))} <em>(saison ${fx1((S2.k+S2.a)/Math.max(1,S2.d))})</em> · or 15′ ${fjAvg(g15.reduce((s,z)=>s+z.gd,0),g15.length)} <em>(saison ${fjAvg(S2.gd,S2.n15)})</em></span><i class="chev">›</i></button></div>`}
  else if(!FJ&&!PLY.fjDone)h+=skel(120);
  return h||`<p class="empty">Pas encore de stats de saison.</p>`}
function plyAllStats(p){const S=seasonOf(p);if(!S)return `<p>Aucune partie ${esc(plyY())} recensée.</p>`;
  const rows=PSTAT.filter(z=>z[0]!=="imp").map(([id,l,f,fmt])=>{const v=f(S);if(v==null||!isFinite(v))return"";const r=S.g>=MINR?rankOf(p,id):null;
    return `<div class="ply-sr"><span>${esc(l)}</span><b>${fmt(v)}</b><em class="${r&&r.i<=3?"top":""}">${r?`${ordi(r.i)}<small>/${r.n}</small>`:"–"}</em></div>`}).join("");
  return `<p>${S.g} parties${S.g<MINR?" : non classé (moins de "+MINR+")":""}. K/D/A moyens ${fx1(S.k/S.g)} / ${fx1(S.d/S.g)} / ${fx1(S.a/S.g)}.</p><div class="ply-srs">${rows}</div>
    <p class="small" style="margin-top:8px">Rang brut parmi les titulaires des Worlds au même poste, ligues mélangées (${MINR} parties minimum) ; seule la note d’impact corrige le niveau des adversaires. Saison 2026 : ligues, First Stand, MSI, EWC, KeSPA Cup et Worlds (hors qualifications EWC ; gol.gg compte aussi la KeSPA Cup de décembre 2025). Écarts à 15 min face au joueur d’en face.</p>`}
function plyGameHTML(z){return `<p class="ply-gm">${champ(z.c,44)}<span><b>${z.k}/${z.d}/${z.a}</b> sur ${esc(z.c)}<br><small>${esc(fjDate(z.date,z.h))} · ${esc(z.comp)}, ${esc(fjPhase(z.bn))}${z.n?`, partie ${z.n}`:""}${z.vs?` · face à ${esc(z.vs)}`:""}${z.gd!=null?` · ${fjGd(z.gd)} d’or à 15 min`:""}${z.min?` · ${Math.round(z.min)} min`:""}</small></span></p>`}
const plyGameRow=z=>`<div class="ply-gl">${champ(z.c,32)}<span><b>${z.k}/${z.d}/${z.a}</b> <em class="${z.w?"ply-w":"ply-l"}">${z.w?"victoire":"défaite"}</em><small>${esc(fjDate(z.date,z.h))}, ${esc(z.comp)} ${esc(fjPhase(z.bn))}, contre ${fjLogo(z.opp,13)}${esc(z.opp)}${z.vs?" ("+esc(z.vs)+")":""}</small></span><span class="r"><small>or 15′</small>${fjGd(z.gd)}</span></div>`;
/* début de partie 2026 (flux du robot, fl.p) comparé au poste (fl.r) : même règle que flPlayerHTML de v13.5 */
function plyFl(p){const F=SJ&&SJ.fl,x=F&&F.p&&F.p[p.key],R=F&&F.r&&F.r[p.role]&&F.r[p.role].all;if(!x||!R||x[0]<20)return null;
  const [n,k15,d15,a15,kt,,at,lv,nf,fbk,fbd,fba]=x,sh=(k15+a15)/Math.max(1,kt+at),rs=(R[1]+R[3])/Math.max(1,R[4]+R[6]),de=d15/n,rd=R[2]/Math.max(1,R[0]);
  const tag=sh>=rs+.025?"Plutôt début de partie":sh<=rs-.025?"Plutôt fin de partie":"Dans la moyenne du poste";
  return {sh,rs,tag,det:`<p>Saison 2026, ${n} parties au flux complet. ${plyPct(sh)} de ses kills et assists arrivent avant 15 min (moyenne ${ROLEP[p.role]} : ${plyPct(rs)}).</p><p>Avant 15 min : ${fx2(de)} mort par partie (moyenne du poste : ${fx2(rd)}), écart de niveau ${lv>=0?"+":"−"}${fx2(Math.abs(lv/n))} face au vis-à-vis. Premier sang : ${fbk} fait${fbk>1?"s":""}, ${fba} en assistant, ${fbd} subi${fbd>1?"s":""} en ${nf} parties.</p><p class="small">« Plutôt début » ou « plutôt fin » de partie : au moins 2,5 points d’écart avec la moyenne du poste.</p>`}}
function plyProfHTML(p,P){const role=RK_ROLEN[p.role];
  return P.ax.map(a=>{const A=FJ_AX[a.k],f=v=>v==null?"–":A[2](v);return `<div class="st"><span class="lb">${A[0]}</span><span class="vv">${f(a.adj)}${a.rk?`<em>${ordi(a.rk)}/${a.n}</em>`:""}</span>${a.rk?`<span class="gz"><i style="left:${(a.n>1?(a.n-a.rk)/(a.n-1)*100:50).toFixed(1)}%"></i></span>`:""}<small class="ply-axs">${f(a.raw)} brut sur ${a.m} parties${a.lrk?` · ${ordi(a.lrk)}/${a.ln} en ${esc(P.lg)} (${f(a.lv)})`:""}</small></div>`}).join("")
    +`<p class="small" style="margin-top:8px">Rang parmi les 19 ${esc(role)} des Worlds (à droite le meilleur), ${FJ.cfg.prof} parties minimum. Chaque stat est corrigée de la force des adversaires : on retire l’effet mesuré de l’Elo adverse (régression sur toutes les parties pros de ${esc(FJ.y)}, par poste), ramené à l’adversaire moyen des Worlds (Elo ${FJ.ref&&FJ.ref.elo}). Ses adversaires : Elo moyen ${P.eop}. Point fort ou faible seulement dans les 4 premiers ou les 4 derniers sur les axes fiables (or et CS à 15 min, farm, morts, vision), dans les 2 premiers ou derniers pour la participation et la part des dégâts. Rang de ligue : saison régulière et playoffs, valeur brute.</p>`}
function plyPDu(p){
  if(!FJ)return plyWaitFJ(80,3);
  let h="";const des=safe(fcDesig,p),L=safe(fcDuo,p)||[],lab=RK_DES;
  if(des){const chips=[0,1,2,3].map(i=>{const per=des.y[i]?"y":des.a[i]?"a":null;if(!per)return"";const z=des[per][i],q=L.find(y=>y.nm===z.nm&&y.tm===z.tm),r=q&&(per==="y"?q.y:q.a),o=z.key&&pkey(z.key);
      return `<${o?`button data-cmp="${esc(p.key)}|${esc(o.key)}"`:"div"} class="dtile"><small>${lab[i]}</small><b>${esc(z.nm)}</b><em>${r?(i<2?`${r.w}–${r.g-r.w} · ${fx1(r.exp)} V att.`:r.n15?`${fjAvg(r.gd,r.n15)} or à 15′`:""):""}${per==="y"?" · "+esc(FJ.y):""}</em></${o?"button":"div"}>`}).join("");
    h+=`<div class="blk"><div class="bh">Ses vis-à-vis marquants<button class="i" data-info="desig" aria-label="Comment ils sont choisis">i</button></div>${chips?`<div class="dtiles">${chips}</div>`:`<p class="ply-p">Personne ne le domine ni ne le subit nettement (au moins ${FJ.cfg.nem[0]} duels).</p>`}</div>`}
  /* contre les titulaires du même poste (SJ.rk.D), du plus au moins favorable par rapport à l'attendu (rkVsHTML) */
  const R=RKX(),x=rkFind(p.key);
  if(R&&R.D&&x&&R.D[x.role]){const V=R.D[x.role].o.filter(k=>k!==p.key).map(k=>({k,d:rkPair(p.key,k)})).filter(z=>z.d).sort((a,b)=>(b.d.w-b.d.e)-(a.d.w-a.d.e));
    const vr=({k,d})=>`<button class="ply-vr" data-cmp="${esc(p.key)}|${esc(k)}"><span>${logo(rkTm(k),18)}<b>${esc(rkNm(k))}</b></span><span><b class="${d.w>d.n-d.w?"ply-w":d.w<d.n-d.w?"ply-l":""}">${d.w}–${d.n-d.w}</b></span><span>${Math.round(d.e)}–${d.n-Math.round(d.e)}</span><span>${d.gd!=null&&d.n15>=3?rkSg(d.gd):"–"}</span></button>`;
    const vh=`<div class="ply-vr hd"><span>Adversaire</span><span>Bilan</span><span>Attendu</span><span>Or 15′</span></div>`;
    if(V.length)h+=`<div class="blk"><div class="bh">Contre les ${RK_ROLEN[x.role]} des Worlds<button class="i" data-info="plyvs" aria-label="Victoires attendues">i</button></div><div class="ply-vl">${vh}${V.slice(0,3).map(vr).join("")}</div>
      ${V.length>3?`<button class="ply-lk" data-info="${xi("vsr|"+p.key,()=>[`${p.id} contre les ${RK_ROLEN[x.role]} des Worlds`,`<p>Depuis 2024, duels d’au moins 3 parties, du plus au moins favorable par rapport à l’attendu. Touche un nom pour comparer.</p><div class="ply-vl">${vh}${V.map(vr).join("")}</div>`,true])}">Les ${V.length} ${RK_ROLEN[x.role]} affrontés<i class="chev">›</i></button>`:""}<!--plyvs--></div>`}
  /* tous ses vis-à-vis depuis 2024 (fiche.json) : le plus affronté à l'écran, la liste au toucher */
  const vrow=z=>{const op=z.key&&pkey(z.key),c=cpair(p.team,op?op.team:p.team);
    return `<${op?`button data-cmp="${esc(p.key)}|${esc(op.key)}"`:"div"} class="rowb"><span class="grow"><b class="nm" style="font-size:17px">${esc(z.nm)}</b><small>${esc(z.tm)}${z.y?` · ${esc(FJ.y)} : ${z.y.w}–${z.y.g-z.y.w}`:""} · attendu ${fx1(z.a.exp)} V${z.a.n15>=3?` · or 15′ ${fjAvg(z.a.gd,z.a.n15)}`:""}</small><span class="split" style="margin-top:6px"><i style="width:calc(${(z.a.w/z.a.g*100).toFixed(1)}% - 1px);background:${c[0]}"></i><i style="background:${op?c[1]:"var(--dim)"}"></i></span></span><span class="num">${z.a.w}–${z.a.g-z.a.w}</span></${op?"button":"div"}>`};
  if(L.length){const tot=L.reduce((s,z)=>s+z.a.g,0),z=L[0];
    const lk=`<button class="ply-lk ply-lk2" data-info="${xi("vv|"+p.key,()=>[`Tous les vis-à-vis de ${p.id}`,`<p>${plur(L.length,"adversaire")} en lane depuis ${esc(FJ.per.duo)} (${tot} parties), toutes compétitions officielles. Touche un titulaire des Worlds pour comparer.</p><div class="list">${L.map(vrow).join("")}</div>`,true])}"><span>Le plus affronté : <b>${esc(z.nm)}</b> (${esc(z.tm)}), ${z.a.w}–${z.a.g-z.a.w}<small>${L.length} adversaires en lane depuis ${esc(FJ.per.duo)}, ${tot} parties</small></span><i class="chev">›</i></button>`;
    h=h.includes("<!--plyvs-->")?h.replace("<!--plyvs-->",lk):h+`<div class="blk"><div class="bh">Tous ses adversaires</div>${lk}</div>`}
  h=h.replace("<!--plyvs-->","");
  return h||`<p class="empty">Pas de duel enregistré.</p>`}
function plyChRow(c){const ref=c.rg>=FJ.cfg.chref&&c.rw!=null?c.rw/c.rg:null;
  return `<div class="ply-chr">${champ(c.c,34)}<span><b>${esc(c.c)}</b><small>KDA ${fx1(c.kda)}${c.n15>=3?` · or 15′ ${fjSg(c.gd)}`:""}${ref!=null?` · pros ${Math.round(ref*100)}${NB}%`:""}</small></span><span class="wl"><b>${c.w}–${c.g-c.w}</b><i><i style="width:${(c.w/c.g*100).toFixed(1)}%"></i></i></span></div>`}
function plyPCh(p){
  let h="";
  if(!FJ)h+=plyWaitFJ(60,4);
  else{const C=safe(fcChamps,p,"y"),A=safe(fcChamps,p,"a");
    if(C&&C.rows.length){const more=(C.og?`<p class="small" style="margin-top:6px">Et ${plur(C.og,"partie")} sur ${C.pool-C.rows.length} autres champions (${C.ow} V).</p>`:"");
      h+=`<div class="blk"><div class="bh">Champions ${esc(FJ.y)}<span class="tag">${plur(C.pool,"champion")}</span><button class="i" data-info="champs" aria-label="Lire ces chiffres">i</button></div><div class="ply-chs">${C.rows.slice(0,5).map(plyChRow).join("")}</div>
        <button class="ply-lk" data-info="${xi("ch|"+p.key,()=>[`Champions de ${p.id}`,`<h4 class="ply-h4">En ${esc(FJ.y)}</h4><div class="ply-chs">${C.rows.map(plyChRow).join("")}</div>${more}${A&&A.rows.length?`<h4 class="ply-h4">Depuis ${esc(FJ.per.ch)}</h4><div class="ply-chs">${A.rows.map(plyChRow).join("")}</div>`:""}`,true])}">Tous ses champions, depuis ${esc(FJ.per.ch)} aussi<i class="chev">›</i></button></div>`}
    else h+=`<p class="empty">Aucune partie cette année.</p>`}
  /* aux Worlds (P-12) : années (coupe les années de titre), parties, victoires, KDA, ces Worlds ; ses champions aux Worlds au toucher */
  const X=SJ&&SJ.players&&SJ.players[p.key],Wd=X&&X.W,yrs=p.worlds&&p.worlds.length?p.worlds:(X&&X.years||[]);
  const chips=`<div class="ply-yrs">${yrs.map(y=>`<span class="chip${p.titles.includes(+y)?" gold":""}">${y}${p.titles.includes(+y)?ICUP:""}</span>`).join("")}</div>`;
  if(Wd&&Wd.g){const now=X.now||{g:0};
    h+=`<div class="blk"><div class="bh">Aux Worlds<span class="tag">${plur(yrs.length,"édition")} · stats depuis ${esc(String(SJ.since||"2024").slice(0,4))}</span></div>${chips}
      <div class="ply-wst"><span><b>${Wd.g}</b>parties</span><span><b>${pct(Wd.w,Wd.g)}${NB}%</b>victoires</span><span><b>${fx2(kdaV(Wd.k,Wd.d,Wd.a))}</b>KDA</span><span><b>${now.g?`${now.w}–${now.g-now.w}`:"–"}</b>en 2026</span></div>
      ${Wd.champs&&Wd.champs.length?`<button class="ply-lk" data-info="${xi("wch|"+p.key,()=>[`${p.id} aux Worlds`,`<p>Depuis ${esc(String(SJ.since||"2024").slice(0,4))} : ${Wd.g} parties, ${pct(Wd.w,Wd.g)}${NB}% de victoires, KDA ${fx2(kdaV(Wd.k,Wd.d,Wd.a))}.${now.g?` À ces Worlds 2026 : ${plur(now.g,"partie")}, ${pct(now.w,now.g)}${NB}% de victoires, KDA ${fx2(kdaV(now.k,now.d,now.a))}.`:""}</p>${champList(Wd.champs)}`,true])}">Ses champions aux Worlds : ${esc(Wd.champs.slice(0,3).map(c=>c.c).join(", "))}<i class="chev">›</i></button>`:""}</div>`}
  else if(yrs.length)h+=`<div class="blk"><div class="bh">Aux Worlds<span class="tag">${plur(yrs.length,"édition")}</span></div>${chips}<p class="ply-sub">${yrs.length===1?"Premiers Worlds en carrière.":"Aucune partie aux Worlds recensée depuis 2024."}</p></div>`;
  return h}
INFO.joueur=()=>{const R=RKX();return ["Fiche joueur",`Rang : note d’impact du robot parmi les 19 titulaires du poste, niveau des adversaires et des ligues compris ; touche-le pour le pourquoi. Dessous : âge, ligue, Worlds et titres ; touche la ligne pour son identité (Leaguepedia et Liquipedia croisées). Aperçu : son prochain duel et l’essentiel en une ligne chacun. Saison : stats 2026 avec le rang brut au poste, forme, style de jeu. Duels : bilans en lane depuis 2024. Champions : l’année et les Worlds.${R&&R.asof?` Classement du ${esc(String(R.asof).slice(0,10).split("-").reverse().join("/"))}.`:""}${FJ&&FJ.asof?` Rencontres et forme : parties officielles LoL Esports depuis ${esc(FJ.per.duo)}, mises à jour le ${esc(fjDate(FJ.asof.slice(0,10)))} (qualifications EWC absentes).`:""}`]};
INFO.enbref=()=>{const R=RKX();return ["En bref",`<p>Rang : note d’impact du robot parmi les 19 titulaires du poste${R?` (stats du ${esc(String(R.asof||"").slice(0,10).split("-").reverse().join("/"))})`:""} ; entre parenthèses, la fourchette plausible ; atouts et point faible avec leur rang brut.</p><p>Forme : ses 10 dernières parties. Signature : son champion le plus joué de l’année. Némésis : au moins 8 duels en lane, au plus 40${NB}% de victoires et 5 défaites ; victoires attendues d’après la force des deux équipes partie par partie (parties officielles LoL Esports depuis 2024).</p><p>Worlds : ses stats aux internationaux comparées à sa note d’avant chaque tournoi, depuis 2024 ; « nettement » au-delà de 2 erreurs types et dans le même sens deux années de suite.</p>`,true]};
INFO.saison=()=>["Lire la saison","Chaque ligne : la stat 2026 et son rang brut parmi les 19 titulaires du poste, ligues mélangées. La jauge place le joueur : à droite, les meilleurs. Seule la note d’impact corrige le niveau des adversaires et des ligues : elle ne mesure ni le shotcalling ni la vision."];
INFO.plyform=()=>{const c=FJ&&FJ.cfg&&FJ.cfg.form;return ["Forme",`« En hausse » ou « en baisse » seulement si les 10 dernières parties s’écartent de la saison d’au moins ${c?Math.round(c[1]*100):20} points de victoires ET d’une erreur type d’or à 15 min, dans le même sens. Testé sur 2025-2026 : 10 parties ne prédisent presque pas les 10 suivantes (corrélation 0,05 pour les victoires, 0,12 pour l’or), d’où cette règle stricte. Or d’une partie arrondi à 100 : le flux officiel s’écarte de gol.gg de 35 d’or en médiane.`]};
INFO.desig=()=>{const c=FJ&&FJ.cfg;return ["Vis-à-vis marquants",`Némésis : au moins ${c?c.nem[0]:8} duels, au plus ${c?Math.round(c.nem[1]*100):40}${NB}% de victoires et ${c?c.nem[2]:5} défaites. Victime : au moins ${c?c.vic[0]:8} duels, ${c?Math.round(c.vic[1]*100):75}${NB}% de victoires et ${c?c.vic[2]:6} victoires. Plus dur ou plus facile en lane : au moins ${c?c.lane[0]:8} parties mesurées, écart d’or à 15 min d’au moins ${c?c.lane[2]:300}. Un bilan face à un adversaire reflète surtout la force des équipes, d’où les victoires attendues (« att. »).`]};
INFO.plyvs=()=>{const R=RKX(),dt=R&&R.dt;return ["Victoires attendues",`Somme des chances de son équipe avant chaque partie (Elo d’équipe, le même que dans la fiche).${dt?` Sur les ${dt.n} paires de titulaires qui se sont affrontées au moins ${dt.min[1]} fois, ${Math.round(dt.z2*dt.n)} s’écartent de l’attendu au-delà de 2 erreurs types ; le hasard seul en donnerait environ ${Math.round(dt.att*dt.n)}.`:""} Pas de « bête noire » démontrée : un bilan direct reflète surtout la force des deux équipes.`]};
INFO.champs=()=>["Champions","Bilan de ses parties par champion, or à 15 min face au vis-à-vis quand au moins 3 parties sont mesurées, et le taux de victoire des autres pros du poste sur ce champion (au moins 30 parties). Un bilan par champion ne s’écarte pas du hasard (testé sur les 95 titulaires) : ce sont des faits, pas des pronostics."];

/* =====================================================================================
   5. COMPARAISON DE DEUX JOUEURS (cmp/<a>~<b>/<onglet>) : Saison · Champions · Duels ; changer d'adversaire
   ===================================================================================== */
function scrCmp(d){
  const [ka,kb]=String(d.id||"").split("~"),a=pkey(ka),b=pkey(kb);
  if(!a||!b)return {title:"Comparaison",body:`<p class="empty">Joueurs introuvables.</p>`};
  const side=(p,r)=>`<button class="ply-cs${r?" r":""}" data-go="p/${esc(p.key)}">${photo(p,"ava",56)}<b>${esc(p.id)}</b><small>${logo(p.team,14)}${esc(tid(p.team))} · ${ROLE_S[p.role]}${rankChip(p)}</small></button>`;
  const head=`<div class="ply-cmph">${side(a)}<span class="ply-cvs"><span class="ply-vs">VS</span><button class="chip" data-info="${xi("chg|"+a.key,()=>["Comparer "+a.id+" avec…",plyCmpPick(a,b),true])}" aria-label="Changer d’adversaire">Changer</button></span>${side(b,1)}</div>`;
  return {title:`${esc(a.id)} – ${esc(b.id)}<small>comparaison</small>`,info:"cmp",head,headKey:d.id,tabs:[["sa","Saison"],["ch","Champions"],["du","Duels"]],
    render:t=>t==="ch"?plyCmpCh(a,b):t==="du"?plyCmpDu(a,b):plyCmpSa(a,b),mount:plyFitOn,needs:[plyNeedFJ(),plyNeedSJ()]};
}
function plyCmpPick(a,b){const L=PLAYERS.filter(x=>x.role===a.role&&x!==a).map(x=>({x,r:rkOf(x)})).sort((u,v)=>(u.r?u.r.i:99)-(v.r?v.r.i:99));
  return `<div class="list">${L.map(({x,r})=>`<button class="rowb" data-plycmp="${esc(a.key)}~${esc(x.key)}" aria-pressed="${x===b}">${photo(x,"ava",36)}<span class="grow"><b class="nm" style="font-size:17px">${esc(x.id)}</b><small>${esc(T[x.team].name)}</small></span><span class="num" style="font-size:16px">${r?ordi(r.i):""}</span></button>`).join("")}</div>`}
onAct("[data-plycmp]",bt=>{const v=bt.dataset.plycmp;vib(8);plyAfter(()=>{const el=plyTop("cmp");if(!el)return go("cmp/"+v);el._d.id=v;
  try{history.replaceState({...(history.state||{}),r:routeOf(el._d)},"","#"+routeOf(el._d))}catch(e){}rerender(el);el.scrollTop=0})});
/* barre face à face (B : .vl), couleurs distinctes (cpair) */
function plyVl(lab,va,vb,fa0,hi,c){const A=+va,B=+vb,best=A===B?0:((A>B)===!!hi?1:2),fa=v=>String(fa0(v)).replace(/^-/,"−"),pa=A+B>0?Math.max(0,A)/(Math.max(0,A)+Math.max(0,B)||1):.5;
  return `<div class="vl"><b class="${best===1?"lead":best?"trail":""}">${fa(va)}</b><span>${lab}</span><b class="${best===2?"lead":best?"trail":""}">${fa(vb)}</b><span class="vb"><i style="width:calc(${(Math.min(1,Math.max(0,pa))*100).toFixed(1)}% - 1px);background:${c[0]}"></i><i style="background:${c[1]}"></i></span></div>`}
function plyCmpSa(a,b){
  if(!SV2())return `<p class="empty">Les stats 2026 arrivent dès que le robot a publié. Réessaie dans quelques minutes.</p>`;
  const SA=seasonOf(a),SB=seasonOf(b),c=cpair(a.team,b.team),ta=T[a.team],tb=T[b.team];let h="";
  if(ta.league!==tb.league)h+=`<p class="ply-note">${esc(a.id)} joue en ${esc(ta.league)}, ${esc(b.id)} en ${esc(tb.league)} : leurs stats brutes ont été faites contre des adversaires différents. La note d’impact, elle, corrige la force des ligues.</p>`;
  const ia=IMP(a),ib=IMP(b),same=a.role===b.role;
  if(ia&&ib){const pb=(same&&safe(pBetter,a.key,b.key,a.role))||{d:ia[0]-ib[0],p:PHI((ia[0]-ib[0])/Math.hypot(ia[1]||.08,ib[1]||.08))};
    const Wn=pb.p>=.5?a:b,Lz=Wn===a?b:a,pw=Math.max(pb.p,1-pb.p),ld=same&&safe(laneDuel,a.key,b.key,a.role,true),lg=same&&safe(laneDuel,a.key,b.key,a.role,false),al=SJ.m&&SJ.m.logit?SJ.m.logit[1]:.64;
    const li=[same?`<li><b>${esc(Wn.id)}</b> est meilleur avec une probabilité de <b>${pw>.99?"plus de 99":Math.round(pw*100)}${NB}%</b>${pw>=.95?" (quasi certain)":pw>=.8?" (probable)":pw<.65?" : trop serré pour trancher":""}.</li>`:`<li>Postes différents : comparaison indicative.</li>`,
      ia[6]!=null&&ib[6]!=null&&Math.abs(ia[6]-ib[6])>=.1?`<li>${esc((ia[6]>ib[6]?a:b).id)} a affronté des adversaires plus forts (adversité ${fxs(Math.max(ia[6],ib[6]))} contre ${fxs(Math.min(ia[6],ib[6]))}).</li>`:"",
      same&&Math.abs(pb.d)>=.03?`<li>Dans une partie équilibrée, ${esc(Wn.id)} à la place de ${esc(Lz.id)} vaut environ <b>+${fx1(Math.abs(pb.d)*al*25)} point${Math.abs(pb.d)*al*25>=1.95?"s":""}</b> de chances de victoire.</li>`:"",
      same?rkGapLi(a.key,b.key):"",
      ld?`<li>En lane, ${esc((ld.p>=.5?a:b).id)} finirait devant aux CS à 15 min dans <b>${Math.round(Math.max(ld.p,1-ld.p)*100)}${NB}%</b> des cas${lg&&Math.abs(lg.e)>=50?`, avec environ ${Math.round(Math.abs(lg.e))} d’or d’avance attendus`:""}.</li>`:""].filter(Boolean).join("");
    h+=`<div class="blk"><div class="bh">Le plus fort, ligues comprises<button class="i" data-info="cmpimp" aria-label="La note d’impact">i</button></div>
      <div class="bigvs"><div class="a"><span class="n ${ia[0]>=ib[0]?"lead":"trail"}">${fxs(ia[0])}</span><span class="t">${esc(a.id)}</span></div><div class="c">note<br>d’impact</div><div class="b"><span class="n ${ib[0]>ia[0]?"lead":"trail"}">${fxs(ib[0])}</span><span class="t">${esc(b.id)}</span></div></div>
      ${splitBar(Math.min(.95,Math.max(.05,pb.p)),c[0],c[1])}<ul class="why">${li}</ul></div>`}
  if(!SA||!SB)return h+`<p class="empty">Aucune partie 2026 recensée pour ${esc((!SA?a:b).id)}.</p>`;
  const rows=PSTAT.filter(z=>z[0]!=="imp").map(([sid,l,f,fmt,hi])=>{const va=f(SA),vb=f(SB);return va==null||vb==null||!isFinite(va)||!isFinite(vb)?"":plyVl(l,va,vb,fmt,hi,c)});
  const vhd=`<div class="vhd"><span>${logo(a.team,18)}${esc(a.id)}</span><span>${esc(b.id)}${logo(b.team,18)}</span></div>`;
  const five=["win","kda","gd15","kp","csm"].map(k=>{const z=PSTAT.find(q=>q[0]===k),va=z[2](SA),vb=z[2](SB);return va==null||vb==null||!isFinite(va)||!isFinite(vb)?"":plyVl(z[1],va,vb,z[3],z[4],c)}).join("");
  h+=`<div class="blk"><div class="bh">Saison ${esc(plyY())}<span class="tag">${SA.g} et ${SB.g} parties</span></div>${vhd}${five}
    <button class="ply-lk" data-info="${xi("cst|"+a.key+"|"+b.key,()=>[`${a.id} – ${b.id}, saison ${plyY()}`,`${vhd}${plyVl("Parties",SA.g,SB.g,v=>v,1,c)}${rows.join("")}<p class="small" style="margin-top:8px">Saison 2026 : ligues, First Stand, MSI, EWC, KeSPA Cup et Worlds (hors qualifications EWC ; gol.gg, saison S16, compte aussi la KeSPA Cup de décembre 2025). En or : le meilleur des deux. Stats brutes, sans correction du niveau des adversaires.</p>`,true])}">Les ${rows.filter(Boolean).length+1} stats face à face<i class="chev">›</i></button></div>`;
  return h}
function plyCmpCh(a,b){const SA=seasonOf(a),SB=seasonOf(b);
  const col=(p,S)=>`<div class="ply-c2c"><b class="ply-c2h">${logo(p.team,16)}${esc(p.id)}</b>${S&&S.champs&&S.champs.length?S.champs.slice(0,5).map(c=>`<div class="ply-mch">${champ(c.c,30)}<span><b>${esc(c.c)}</b><small>${plur(c.g,"partie")} · ${pct(c.w,c.g)}${NB}%</small></span></div>`).join(""):`<p class="small">Aucune partie.</p>`}</div>`;
  return `<div class="blk"><div class="bh">Champions ${esc(plyY())}<span class="tag">les 5 plus joués</span></div><div class="ply-c2">${col(a,SA)}${col(b,SB)}</div></div>`}
function plyCmpDu(a,b){
  let h="";const t1=a.role===b.role?rkDuel1(a.key,b.key):"";
  if(t1)h+=`<p class="ply-ans">${t1.replace(/(\d)-(\d)/g,"$1\u2060–\u2060$2")}</p>`;
  if(!FJ){const x=SJ&&SJ.duels&&SJ.duels[norm(a.id)+"|"+norm(b.id)];
    if(x)h+=`<div class="blk"><div class="bh">En lane depuis ${esc(String(SJ.since||"2024").slice(0,4))}</div><div class="bigvs"><div class="a"><span class="n ${x.w>x.g-x.w?"lead":"trail"}">${x.w}</span><span class="t">${esc(a.id)}</span></div><div class="c">${plur(x.g,"partie")}</div><div class="b"><span class="n ${x.g-x.w>x.w?"lead":"trail"}">${x.g-x.w}</span><span class="t">${esc(b.id)}</span></div></div><p class="ply-sub">KDA ${fx2(kdaV(x.ka,x.da,x.aa))} contre ${fx2(kdaV(x.kb,x.db,x.ab))}${x.n15?` · ${x.gd15/x.n15>=0?"+":"−"}${Math.abs(Math.round(x.gd15/x.n15))} d’or à 15 min pour ${esc(a.id)}`:""}</p></div>`;
    const Rd=plyDr(a,b);if(Rd.length)h+=`<div class="blk"><div class="bh">Leurs dernières rencontres<span class="tag">${Rd.filter(z=>z.w).length}–${Rd.filter(z=>!z.w).length}</span></div><div class="ply-encs">${Rd.map(z=>`<div class="ply-enc ${z.w?"ply-w":"ply-l"}"><span class="d">${esc(plyDay(z.date))}<small>${esc(tourName(z.comp).replace(/ 20\d\d$/,""))} · P${z.n}</small></span><span class="c">${champ(z.chA,28)}<b>${fjK(z.kA)}</b></span><i>${z.w?"V":"D"}</i><span class="c r"><b>${fjK(z.kB)}</b>${champ(z.chB,28)}</span></div>`).join("")}</div></div>`;
    return h+(SJ?(Rd.length||x?"":plyWaitFJ(80,2)):plyWaitSJ(80,2))}
  const X=safe(fcPair,a,b),R=safe(fcEnc,a,b)||[],c=cpair(a.team,b.team);
  if(!X&&!R.length)return h+`<p class="empty">Jamais face à face en lane depuis ${esc(FJ.per.duo)}.</p>`;
  if(X)h+=`<div class="blk"><div class="bh">En lane depuis ${esc(FJ.per.duo)}<button class="i" data-info="plyvs" aria-label="Victoires attendues">i</button></div><div class="bigvs"><div class="a"><span class="n ${X.a.w>X.a.g-X.a.w?"lead":"trail"}">${X.a.w}</span><span class="t">${esc(a.id)}</span></div><div class="c">${plur(X.a.g,"partie")}${X.y?`<br>${X.y.w}–${X.y.g-X.y.w} en ${esc(FJ.y)}`:""}</div><div class="b"><span class="n ${X.a.g-X.a.w>X.a.w?"lead":"trail"}">${X.a.g-X.a.w}</span><span class="t">${esc(b.id)}</span></div></div>${splitBar(X.a.w/X.a.g,c[0],c[1])}
    <p class="ply-sub">D’après la force des équipes, ${esc(a.id)} en aurait gagné ${fx1(X.a.exp)}.${X.a.n15>=3?` Or à 15 min : ${fjAvg(X.a.gd,X.a.n15)} en moyenne pour ${esc(a.id)}.`:""}</p></div>`;
  if(R.length){const won=R.filter(z=>z.w).length;
    h+=`<div class="blk"><div class="bh">${R.length>1?`Leurs ${R.length} rencontres`:"Leur seule rencontre"}<span class="tag">${won}–${R.length-won}</span></div><div class="ply-encs">${R.slice(0,5).map((z,i)=>plyEncRow(a,b,z,i)).join("")}</div>
      ${R.length>5?`<button class="ply-lk" data-info="${xi("enc|"+a.key+"|"+b.key,()=>[`${a.id} – ${b.id} : toutes leurs rencontres`,`<div class="ply-encs">${R.map((z,i)=>plyEncRow(a,b,z,i)).join("")}</div>`,true])}">Les ${R.length} rencontres<i class="chev">›</i></button>`:""}
      <p class="note">Touche une partie pour le détail. Heures de Paris.</p></div>`}
  return h}
/* repli sans fiche.json : dernières rencontres de stats.json (SJ.dr), vues de a (recentDuels de v13.5) */
function plyDr(a,b){const D=SJ&&SJ.dr||{},k1=norm(a.id)+"|"+norm(b.id),k2=norm(b.id)+"|"+norm(a.id),R=D[k1]||D[k2];if(!R||!R.length)return [];const fl=!D[k1];
  return R.map(x=>fl?{date:x[0],n:x[1],comp:x[2],chA:x[4],chB:x[3],kA:x[6],kB:x[5],gd:x[7]==null?null:-x[7],w:1-x[8]}:{date:x[0],n:x[1],comp:x[2],chA:x[3],chB:x[4],kA:x[5],kB:x[6],gd:x[7],w:x[8]})}
function plyEncRow(a,b,z,i){
  return `<button class="ply-enc ${z.w?"ply-w":"ply-l"}" data-info="${xi("encd|"+a.key+"|"+b.key+"|"+i,()=>[`${fjDate(z.date,z.h)} : ${z.w?a.id:b.id} gagne`,plyEncHTML(a,b,z),true])}"><span class="d">${esc(plyDay(z.date,z.h))}<small>${esc(String(z.comp).replace(/ 20\d\d$/,""))} · P${z.n}</small></span><span class="c">${champ(z.chA,28)}<b>${fjK(z.kA)}</b></span><i>${z.w?"V":"D"}</i><span class="c r"><b>${fjK(z.kB)}</b>${champ(z.chB,28)}</span></button>`}
function plyEncHTML(a,b,x){return `<p>${esc(fjWhen(x.date,x.h))}, ${esc(x.comp)} (${esc(fjPhase(x.bn))}${x.bo>1?`, Bo${x.bo}, partie ${x.n}`:""}).</p>
  <dl class="kv ply-kv3"><dt></dt><dd>${fjLogo(x.ca,14)} ${esc(a.id)}</dd><dd>${esc(b.id)} ${fjLogo(x.cb,14)}</dd>
  <dt>Champion</dt><dd>${esc(x.chA)}</dd><dd>${esc(x.chB)}</dd><dt>K/D/A</dt><dd>${fjK(x.kA)}</dd><dd>${fjK(x.kB)}</dd><dt>CS</dt><dd>${x.csA}</dd><dd>${x.csB}</dd>
  ${x.dsA!=null?`<dt>Part des dégâts</dt><dd>${fx1(x.dsA*100)}${NB}%</dd><dd>${x.dsB!=null?fx1(x.dsB*100)+NB+"%":"–"}</dd>`:""}
  ${x.gd!=null?`<dt>À 15 min (${esc(a.id)})</dt><dd>${fjGd(x.gd)} or</dd><dd>${x.csd==null?"–":(x.csd>0?"+":"")+x.csd+" CS"}</dd>`:""}
  <dt>Durée</dt><dd>${Math.round(x.min)} min</dd><dd>${x.bo>1&&x.sc?"série "+esc(x.sc):""}</dd></dl>
  <p class="small" style="margin-top:8px">Parties officielles LoL Esports depuis ${esc(FJ.per.duo)} (qualifications EWC absentes). Recoupé avec gol.gg : K/D/A, part des dégâts, manche et série identiques ; CS à 1 près ; or à 15 min à 35 d’or près en médiane, d’où l’arrondi à 100.</p>`}
INFO.cmp=()=>["Comparaison","Saison : le plus fort ligues comprises (note d’impact du robot), puis les stats brutes de la saison face à face, le meilleur en or. Champions : les 5 plus joués de chacun en 2026. Duels : leurs rencontres en lane, partie par partie. « Changer d’adversaire » : un autre joueur du même poste."];
INFO.cmpimp=()=>["Le plus fort, ligues comprises","La note d’impact du robot corrige la force des adversaires et de la ligue, contrairement aux stats brutes. Probabilité d’être meilleur : d’après les rééchantillonnages du robot. Points de chances : écart de note converti en chances de victoire dans une partie équilibrée (écart × "+fx2(SJ&&SJ.m&&SJ.m.logit?SJ.m.logit[1]:.64)+" × 25). Lane : modèle de lane du robot, testé à l’aveugle."];

/* ---------- liens généraux ----------
   un lien de navigation touché dans une feuille (data-go, data-p, data-t, data-cmp…) : géré par le socle (SHEET.after,
   une seule entrée d'historique). plyAfter ne sert plus qu'aux actions propres au module (pays, tri, changer d'adversaire, data-rkw). */

/* ---------- branchements ---------- */
defScreen("pl",{arg:"none",screen:scrPlayers});
defScreen("p",{arg:"idtab",screen:scrPlayer});
defScreen("rk",{arg:"id",screen:scrRank,parse:a=>({v:"rk",id:a||"TOP"})});
defScreen("cmp",{arg:"idtab",screen:scrCmp});
defScreen("spe",{arg:"idtab",screen:scrSpe,parse:(a,b)=>a==="eq"||a==="jo"?{v:"spe",tab:a,id:b}:a?{v:"spe",id:a,tab:pkey(a)?"jo":"eq"}:{v:"spe"},
  route:d=>["spe",d.tab||"eq",d.id?encodeURIComponent(d.id):null].filter(Boolean).join("/")});
defWidget("rank",wRank);
