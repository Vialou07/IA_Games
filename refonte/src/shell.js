/* =====================================================================================
   shell.js — SOCLE de la refonte « B » (propriétaire : agent socle)
   Pile d'écrans + history API, contrôle segmenté, feuilles « i », transitions, widgets de l'accueil, chargement des
   données, pari en un geste, bus d'événements, effets (intro, faisceau, holo). API : voir ARCHI.md.
   Ordre de chargement : legacy.js (extraits figés de worlds v13.5) → shell.js → app.js (synchro, sources, diagnostic, réglages)
   → home, match, players, team, swiss, stats, league → boot.js. Aucun rendu au chargement : les modules déclarent et
   s'enregistrent, boot() démarre.
   Cadrage : #app est fixe (inset 0), chaque écran .scr défile seul ; .scrin remplit au moins l'écran (colonne flexible, .tabc
   prend la hauteur restante, sans min-height en vh) ; un écran dont le contenu tient reçoit .fit (défilement coupé : rien ne
   bouge, ni « mini défilement » ni rebond) ; html et body ne défilent jamais (overscroll-behavior:none).
   ===================================================================================== */
const APP_VERSION="v14.2, 25/10/2026";
const BASE="https://raw.githubusercontent.com/Vialou07/IA_Games/stats/data/";
const QS=new URLSearchParams(location.search),FORCE_MO=QS.get("mo");
/* état propre à la refonte (MATCHES, SOURCE, lastSync, picks, manual, fav, celebrated, ui : legacy « état » ;
   lg, scores, DU, NTFY, topicOf : legacy « ligue, état ») */
let SJ=null,SJt=0,FJ=null,DJ=null,CH=LS.get("champs2",null);
const NB=" ";
const P=v=>Math.round(v*100)+NB+"%";
const tid=id=>T[id]?T[id].id:String(id||"");
const col=id=>id&&T[id]?T[id].color:"#16294A";
function hsl(h){const x=String(h).replace("#",""),[r,g,b]=[0,2,4].map(i=>parseInt(x.substr(i,2),16)/255),mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,d=mx-mn;
  if(!d)return [0,0,l];const s2=d/(1-Math.abs(2*l-1));let hh=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;return [(hh*60+360)%360,s2,l]}
function cpair(a,b){const c1=col(a),c2=col(b),x=hsl(c1),y=hsl(c2),dh=Math.min(Math.abs(x[0]-y[0]),360-Math.abs(x[0]-y[0]));
  const near=(x[1]<.25&&y[1]<.25)||(dh<22&&Math.abs(x[2]-y[2])<.18);return near?["#C8AA6E","#0AC8B9"]:[c1,c2]}
const cA=m=>cpair(m.t1,m.t2)[0],cB=m=>cpair(m.t1,m.t2)[1];
const ordi=i=>i===1?"1er":i+"e";
const ordS=i=>`${i}<sup>${i===1?"er":"e"}</sup>`;
const kf1=v=>fx1(Math.abs(v)/1000)+NB+"k";
const sgn=v=>(v>0?"+":v<0?"−":"")+Math.abs(Math.round(v)).toLocaleString("fr-FR");
const plur=(n,w,ws)=>n+" "+(n>1?(ws||w+"s"):w);
const safe=(f,...a)=>{try{return f(...a)}catch(e){console.warn(e);return""}};
const pkey=k=>PLAYERS.find(p=>p.key===k)||null;
/* nouvelle version en ligne ? GitHub Pages garde la page 10 min en cache : on la relit sans cache et, si APP_VERSION a changé,
   on recharge (une seule fois par version et par onglet, sauf demande explicite depuis le diagnostic) */
async function newVersion(){try{const r=await fetch(location.pathname+"?nv="+Date.now(),{cache:"no-store"});if(!r.ok)return null;
  const v=((await r.text()).match(/const APP_VERSION="(v[^"]+)"/)||[])[1];return v&&v!==APP_VERSION?v:null}catch(e){return null}}
async function checkVersion(force){const v=await newVersion();if(!v)return false;
  try{if(!force&&sessionStorage.getItem("w26_nv")===v)return false;sessionStorage.setItem("w26_nv",v)}catch(e){if(!force)return false}
  location.replace(location.pathname+"?v="+encodeURIComponent(v.split(",")[0])+location.hash);return true}
const toast=msg=>{const t=$("#toast");t.textContent=msg;t.classList.add("on");clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("on"),2200)};
const XI=new Map(),XK=new Map();
function xi(key,fn){let id=XK.get(key);if(id==null){id=XK.size;XK.set(key,id)}XI.set(id,fn);return "x:"+id}
const ROLE_S={TOP:"Top",JGL:"Jungle",MID:"Mid",BOT:"ADC",SUP:"Support"};
const ROLE_PL={TOP:"tops",JGL:"junglers",MID:"mids",BOT:"ADC",SUP:"supports"};
const ICUP=`<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 3h12v3h3c0 4-2 6-4.4 6.6A6 6 0 0 1 13 15.9V19h4v2H7v-2h4v-3.1a6 6 0 0 1-3.6-3.3C5 12 3 10 3 6h3zm0 5H5c.2 1.6 1 2.6 2 3zm12 0v3c1-.4 1.8-1.4 2-3z"/></svg>`;
const ITOW=`<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 2h2v2h1V2h2v2h1V2h2v4l-1 1v6h1v1H4v-1h1V7L4 6z"/></svg>`;
const IBAR=`<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1 3 5v4l5 6 5-6V5zm0 3 2 2-2 4-2-4z"/></svg>`;
const IINH=`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="8" cy="8" r="5"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/></svg>`;
const IBACK=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5 8 12l7 7"/></svg>`;

/* ===================== bus d'événements =====================
   BUS.on(évt, fn) → fn ; BUS.off(évt, fn) ; BUS.emit(évt, …args). Événements émis par le socle :
   "boot" (accueil posé), "data" (MATCHES rafraîchis, accueil et écrans redessinés), "sj" (nouveau stats.json),
   "pick" (clé, équipe ou null, bouton touché). Les modules peuvent en émettre d'autres (match : "live" (m) ; ligue : "league"). */
const BUS={h:{},on(e,f){(this.h[e]=this.h[e]||[]).push(f);return f},off(e,f){this.h[e]=(this.h[e]||[]).filter(x=>x!==f)},
  emit(e,...a){(this.h[e]||[]).slice().forEach(f=>{try{f(...a)}catch(err){console.warn("BUS "+e,err)}})}};

/* ===================== données =====================
   loadSJ, loadAux, loadFJ, loadDJ, champMap, sync, quickStart : dans app.js (synchro, sources, diagnostic). */
const champImg=n=>{const id=CH&&CH.map&&CH.map[norm(n)];return id?`https://ddragon.leagueoflegends.com/cdn/${CH.v}/img/champion/${id}.png`:null};
const champNm=c=>CH&&CH.nm&&CH.nm[c]?CH.nm[c]:(DJ?djCh(c):c);
const champ=(n,size=26,cls="")=>{if(!n)return `<span class="chi tx" style="width:${size}px;height:${size}px">?</span>`;const s=champImg(n);return s?`<img class="chi ${cls}" src="${s}" alt="${esc(champNm(n))}" title="${esc(champNm(n))}" loading="lazy" decoding="async" style="width:${size}px;height:${size}px">`:`<span class="chi tx ${cls}" title="${esc(n)}" style="width:${size}px;height:${size}px">${esc(String(n).slice(0,2))}</span>`};

/* ===================== probas, rangs, petits calculs partagés ===================== */
function seriesFav(m){const p=robotProb(m);if(p==null)return null;return {t:p>=.5?m.t1:m.t2,p:Math.max(p,1-p),p1:p}}
function robotPast(m){const F=SJ&&SJ.fiab&&SJ.fiab.w26&&SJ.fiab.w26.m;if(!F)return null;const r=F.find(x=>"le"+x[0]===m.id);if(!r)return null;
  const a=resolveTeam(r[2]),b=resolveTeam(r[3]),fav=r[5]>=.5?a:b,ok=(r[5]>=.5)===!!r[6];return {fav,p:Math.max(r[5],1-r[5]),ok}}
function fiabW26(){const F=SJ&&SJ.fiab&&SJ.fiab.w26&&SJ.fiab.w26.m;if(!F||!F.length)return null;return {ok:F.filter(r=>(r[5]>=.5)===!!r[6]).length,n:F.length}}
/* rang au poste (note d'impact) : objet de rkFind */
const rkOf=p=>p?rkFind(p.key):null;
const rankChip=p=>{const x=rkOf(p);return x?`<i class="rk${x.i<=3?" top":""}" title="${x.i}${x.i===1?"er":"e"} des ${x.n} ${ROLE_PL[x.role]}">${x.i}${x.i===1?"er":"e"}</i>`:""};
const nextOf=team=>MATCHES.find(m=>(m.t1===team||m.t2===team)&&m.t1&&m.t2&&m.state!=="done");
const oppOf=(p,m)=>{const o=m.t1===p.team?m.t2:m.t1;return PLAYERS.find(x=>x.team===o&&x.role===p.role)||null};

/* ===================== rendus communs (cartes, héros, barres) ===================== */
function hcard(p,cls=""){const t=T[p.team],leg=p.titles.length;
  return `<span class="hc ${cls}${leg?" legend":""}" style="--tc:${t.color}"><span class="pin"><span class="ph" style="display:grid">${photo(p,"fill")}<span class="shade"></span><span class="ro">${ROLES[p.role]}</span><span class="tl">${logo(p.team,20)}</span>${leg?`<span class="cup">${ICUP}×${leg}</span>`:""}</span>
    <span class="bd"><b>${flag(p.cc)}${esc(p.id)}</b><span>${esc(t.name)}</span></span></span><span class="holo"></span></span>`}
function heroBg(m,wm=150){return `<div class="hbg"><i class="hb l"></i><i class="hb r"></i>${m.t1?`<span class="wm l">${logo(m.t1,wm)}</span>`:""}${m.t2?`<span class="wm r">${logo(m.t2,wm)}</span>`:""}<i class="sheen"></i><i class="vign"></i></div><canvas class="beam"></canvas>`}
const stageLab=m=>STAGES[m.stage]+(m.round&&m.stage==="sw"?`, ronde ${m.round}`:"");
function cdText(ms){ms=Math.max(0,ms);const d=Math.floor(ms/864e5),h=Math.floor(ms%864e5/36e5),mi=Math.floor(ms%36e5/6e4),s=Math.floor(ms%6e4/1e3);
  if(d)return `${d}<small>j</small>${h}<small>h</small>`;if(h)return `${h}<small>h</small>${String(mi).padStart(2,"0")}`;return `${String(mi).padStart(2,"0")}:${String(s).padStart(2,"0")}`}
const whenTxt=d=>{const dk=dayKeyL(d),today=dayKeyL(new Date()),tom=dayKeyL(new Date(Date.now()+864e5));return (dk===today?"Ce soir":dk===tom?"Demain":fmtDay(evDate(d)))+" à "+fmtTime(d)};
function splitBar(p,c1,c2){return `<div class="wpb"><i style="width:calc(${(p*100).toFixed(1)}% - 1px);background:${c1}"></i><i style="background:${c2}"></i></div>`}
function ringSVG(p,sz=62,stroke=7){const r=(sz-stroke)/2,C=2*Math.PI*r;return `<svg viewBox="0 0 ${sz} ${sz}"><circle cx="${sz/2}" cy="${sz/2}" r="${r}" fill="none" stroke="rgba(200,170,110,.15)" stroke-width="${stroke}"/><circle cx="${sz/2}" cy="${sz/2}" r="${r}" fill="none" stroke="url(#rgr)" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-p)}"/><defs><linearGradient id="rgr"><stop offset="0" stop-color="#0AC8B9"/><stop offset="1" stop-color="#F0E6D2"/></linearGradient></defs></svg>`}
const skel=(h=80,n=1)=>Array.from({length:n},()=>`<div class="sk" style="height:${h}px;margin-top:10px"></div>`).join("");
function stakeTxt(m,R){if(!m.t1||!m.t2||m.winner)return"";const a=lives(m.t1,R),b=lives(m.t2,R);if(!a||!b)return"";if(a.ko)return"Élimination directe";
  const out=[a.n===1?tid(m.t1):null,b.n===1?tid(m.t2):null].filter(Boolean);return out.length===2?"Match couperet":out.length?`Couperet pour ${out[0]}`:""}
const mOf=id=>MATCHES.find(x=>x.id===id)||null;
/* ligne de match (calendrier, paris, fiches) : toucher = la fiche du match */
function mrow(x){const w=x.winner,st=new Date(x.start),pk=picks[x.key],f=!w?seriesFav(x):null,fv=!!fav&&(x.t1===fav||x.t2===fav);
  // comme v13.5 (matchRow) : « nuit » aussi sur les résultats (un match de 01:00 est rangé dans la soirée de la veille), Bo des séries jouées
  const sub=[(f||w)&&x.bo>1?"Bo"+x.bo:"",x.state!=="live"&&st.getHours()<6?"nuit":""].filter(Boolean).join(" ");
  const t=(id,rev)=>`<span class="t${rev?" r":""}${w&&w!==id?" lo":""}${pk&&id&&pk===id?" pk":""}">${rev||!id?"":logo(id,24)}${esc(tid(id)||"À venir")}${rev&&id?logo(id,24):""}</span>`;
  return `<button class="mrow${x.state==="live"?" live":""}${fv?" fav":""}" ${x.t1&&x.t2?`data-go="m/${esc(x.id)}"`:"disabled"}><time>${x.state==="live"?`<span class="lv">LIVE</span>`:fmtTime(st)}${sub?`<small>${sub}</small>`:""}</time>${t(x.t1)}<span class="sc">${w?`${x.s1}-${x.s2}`:"VS"}<small>${w?"":f?`${esc(tid(f.t))} ${Math.round(f.p*100)}${NB}%`:"Bo"+x.bo}</small></span>${t(x.t2,1)}<span class="dotp${pk?(w?(pk===w?" ok":" ko"):" on"):x.state==="soon"&&x.t1&&x.t2?"":" none"}"></span></button>`}

/* ===================== widgets de l'accueil =====================
   W(cls, route, inner, k, style, label) : une tuile (div role=button data-go=route) ; cls = taille : w11 (carré, 136 px),
   w21 (large, 112 px), w22 (héros, 284 px, sans marge) ; k = rang d'apparition (cascade d'entrée).
   defWidget(nom, fn(k, …)) : un module fournit un widget ; widget(nom, k, …) l'appelle ("" s'il manque ou plante). */
const W=(cls,go,inner,k,style="",label="")=>`<div class="w ${cls}" role="button" tabindex="0" data-go="${esc(go)}" style="--k:${k};${style}"${label?` aria-label="${esc(label)}"`:""}>${inner}</div>`;
const WIDGETS={};
function defWidget(n,f){WIDGETS[n]=f}
function widget(n,...a){const f=WIDGETS[n];return f?safe(f,...a)||"":""}

/* ===================== écrans : registre des routes =====================
   defScreen(v, {arg, screen, parse, route}) : arg "none" (#v), "id" (#v/id), "tab" (#v/onglet), "idtab" (#v/id/onglet) ;
   screen(d) → objet écran (voir ARCHI.md : title, info, head, headKey, tabs, render, body, mount, needs, opened, onData, skipData) ;
   parse(a,b) / route(d) : seulement pour une route particulière. */
const ROUTES={};
function defScreen(v,o){ROUTES[v]=Object.assign({arg:"none"},o)}
function parseRoute(s){const [v,a,b]=String(s||"").replace(/^#/,"").split("/"),R=ROUTES[v];if(!R)return null;
  const x=a!=null&&a!==""?decodeURIComponent(a):undefined,y=b!=null&&b!==""?decodeURIComponent(b):undefined;
  if(R.parse)return R.parse(x,y);
  return R.arg==="id"?{v,id:x}:R.arg==="idtab"?{v,id:x,tab:y}:R.arg==="tab"?{v,tab:x}:{v}}
function routeOf(d){const R=ROUTES[d.v]||{},enc=x=>x==null||x===""?null:encodeURIComponent(x);if(R.route)return R.route(d);
  const p=R.arg==="id"?[enc(d.id)]:R.arg==="idtab"?[enc(d.id),enc(d.tab)]:R.arg==="tab"?[enc(d.tab)]:[];
  return [d.v,...p].filter(x=>x!=null).join("/")}
/* une fiche = barre (retour, titre, i) + tête + onglets collants + contenu de l'onglet ; seul l'onglet visible est construit */
function shell(o){
  const tabs=o.tabs||[],i=Math.max(0,tabs.findIndex(t=>t[0]===o.tab));
  return `<div class="scrin"><header class="bar"><button class="bk" data-back aria-label="Retour">${IBACK}</button><div class="bt">${o.title}</div>${o.info?`<button class="ib" data-info="${esc(o.info)}" aria-label="Comment lire cet écran">i</button>`:"<span></span>"}</header>
    ${o.head?`<div class="headslot">${o.head}</div>`:""}
    ${tabs.length>1?`<div class="segw"><div class="seg" role="tablist" style="--n:${tabs.length};--i:${i}"><i class="ind"></i>${tabs.map(t=>`<button role="tab" data-tab="${t[0]}" aria-selected="${t[0]===tabs[i][0]}">${t[1]}</button>`).join("")}</div></div>`:""}
    <div class="tabc" role="tabpanel">${o.body||""}</div></div>`}
const tabSig=o=>(o.tabs||[]).map(t=>t[0]).join();
function renderScreen(el,d){const f=ROUTES[d.v]&&ROUTES[d.v].screen;el._d=d;if(!f){el.innerHTML=shell({title:"Introuvable",body:`<p class="empty">Cet écran n’existe pas.</p>`});return}
  const o=f(d)||{title:"",body:`<p class="empty">Données en cours de chargement…</p>`};el._o=o;
  if(o.tabs&&o.tabs.length&&!o.tabs.some(t=>t[0]===d.tab))d.tab=o.tabs[0][0];o.tab=d.tab;
  if(!o.body&&o.render)o.body=safe(o.render,d.tab)||"";
  el.classList.remove("snug");el.innerHTML=shell(o);watchFit(el);const hs=el.querySelector(".headslot");if(hs){hs._h=o.head;hs._k=o.headKey}const c=el.querySelector(".tabc");if(c)c._h=o.body;
  if(o.mount)safe(o.mount,el);tickCd(el)}
function refreshTab(el,dir){const o=el._o,d=el._d;if(!o||!o.render)return;const c=el.querySelector(".tabc");if(!c)return;const h=safe(o.render,d.tab)||"";
  if(c._h===h&&!dir)return;c._h=h;el.classList.remove("snug");c.innerHTML=h;fitSoon(el);if(dir&&!RM){c.classList.remove("in","inl");void c.offsetWidth;c.classList.add(dir>0?"in":"inl")}tickCd(c)}
function setTab(el,k){const o=el._o,d=el._d;if(!o||!o.tabs)return;const i0=o.tabs.findIndex(t=>t[0]===d.tab),i=o.tabs.findIndex(t=>t[0]===k);if(i<0||i===i0)return;
  d.tab=k;if(d.v==="rk")d.id=k;const s=el.querySelector(".seg");s.style.setProperty("--i",i);s.querySelectorAll("button").forEach(b=>b.setAttribute("aria-selected",String(b.dataset.tab===k)));
  try{history.replaceState({...(history.state||{}),r:routeOf(d)},"","#"+routeOf(d))}catch(e){}
  const sw=el.querySelector(".segw");if(sw&&el.scrollTop>sw.offsetTop)el.scrollTop=sw.offsetTop;
  refreshTab(el,i>i0?1:-1);vib(6)}
/* quand une donnée arrive (fiche.json, draft.json, flux…), l'écran qui l'attendait se redessine s'il est encore là */
function rerender(el){if(!el||!el.isConnected||el===HOME)return;const d=el._d,y=el.scrollTop,old=el._o,R=ROUTES[d.v];const o=R?safe(R.screen,d):null;if(!o)return;
  if(!old||tabSig(old)!==tabSig(o)||!!old.head!==!!o.head){renderScreen(el,d);el.scrollTop=y;return}
  el._o=o;const hs=el.querySelector(".headslot");
  if(hs&&o.head!=null&&(o.headKey!=null?hs._k!==o.headKey:hs._h!==o.head)){hs._h=o.head;hs._k=o.headKey;hs.innerHTML=o.head;if(o.mount)safe(o.mount,el)}
  const bt=el.querySelector(".bar .bt");if(bt&&o.title&&bt._h!==o.title&&el.scrollTop<180){bt._h=o.title;bt.innerHTML=o.title}
  refreshTab(el,0);tickCd(el);el.scrollTop=y}
const topScreen=()=>NAV.length?NAV[NAV.length-1].el:HOME;

/* ===================== cadrage : un écran qui tient ne bouge pas =====================
   .scrin fait au moins la hauteur de l'écran ; quand le contenu tient (en rognant au besoin la marge du bas jusqu'à 12 px
   au-dessus de la barre d'accueil de l'iPhone), l'écran reçoit .fit : défilement coupé, donc ni « mini défilement » ni rebond.
   Surveillé par ResizeObserver (contenu qui arrive, onglet changé, rotation). Mesure : SAB = safe-area-inset-bottom en px. */
let SAB=0;
function measureSafe(){const p=document.createElement("div");p.style.cssText="position:fixed;left:0;bottom:0;width:1px;height:env(safe-area-inset-bottom,0px);visibility:hidden;pointer-events:none";document.body.appendChild(p);SAB=p.getBoundingClientRect().height||0;p.remove()}
function fitScr(s){if(!s||!s.isConnected)return;const pb=parseFloat(getComputedStyle(s).paddingBottom)||0,over=s.scrollHeight-s.clientHeight;
  const f=over<=1||s.scrollHeight-pb+12+SAB<=s.clientHeight+1;
  /* presque (moins de 120 px de trop) : version resserrée des composants partagés (.snug : marges des blocs, lignes, listes),
     qui suffit souvent à faire tenir l'écran ; remise à zéro à chaque nouveau contenu (renderScreen, refreshTab) */
  if(!f&&over<120&&s!==HOME&&!s.classList.contains("snug")){s.classList.add("snug");return fitScr(s)}
  if(f!==s.classList.contains("fit")){s.classList.toggle("fit",f);if(f)s.scrollTop=0}}
/* un nouveau contenu est cadré avant d'être peint (pas de saut) ; ce qui change ensuite (images, blocs
   asynchrones, rotation) est recadré à l'image suivante : changer la taille d'un élément observé pendant le rappel du
   ResizeObserver provoque « ResizeObserver loop completed with undelivered notifications » (erreur affichée par Safari) */
const FITQ=new Set();let FITR=0;
/* microtâche : après les MutationObserver des modules (qui retirent leurs propres classes de resserrement), avant la peinture */
const fitSoon=s=>queueMicrotask(()=>fitScr(s));
function fitLater(s){FITQ.add(s);if(!FITR)FITR=requestAnimationFrame(()=>{FITR=0;const L=[...FITQ];FITQ.clear();L.forEach(fitScr)})}
const FITRO=window.ResizeObserver?new ResizeObserver(es=>{for(const e of es){const x=e.target;if(!x.isConnected){FITRO.unobserve(x);continue}const sc=x.closest(".scr");if(sc)fitLater(sc)}}):null;
function watchFit(el){const c=el&&el.firstElementChild;if(!c)return;if(FITRO){if(el._fitc&&el._fitc!==c)FITRO.unobserve(el._fitc);el._fitc=c;FITRO.observe(c);FITRO.observe(el)}
  if(el.isConnected)fitSoon(el);else fitLater(el)}

/* ===================== feuilles « i » =====================
   INFO.clé = () => [titre, texte, html?] ; INFOP.préfixe = (a, b, c) => […] pour data-info="préfixe:a:b:c" ;
   xi(clé, fn) rend une clé « x:n » pour une feuille construite à la demande ; showSheet(titre, corps, html?) ouvre directement. */
const INFO={},INFOP={};
INFOP.x=a=>{const f=XI.get(+a);return f?f():null};
function infoFor(k){if(INFO[k])return INFO[k]();const [t,a,b,c]=String(k).split(":"),f=INFOP[t];return f?f(a,b,c):null}
const SHEET={open:false};
function openInfo(k){const x=safe(infoFor,k);if(x)showSheet(...x)}
function showSheet(t,body,raw){
  $("#shB").innerHTML=`<h3 id="shT">${esc(t)}</h3>${raw?body:`<p>${body}</p>`}`;$("#sheet").scrollTop=0;
  $("#sheet").classList.add("on");$("#scrim").classList.add("on");SHEET.open=true;vib(8);
  try{history.pushState({...(history.state||{}),sheet:1},"",location.hash)}catch(e){}}
/* glisser la feuille vers le bas pour la fermer (comme v13.5, 1993) : seulement quand son contenu est en haut */
function sheetSwipe(){
  const sh=$("#sheet"),sc=$("#scrim");if(!sh)return;let y0=null,dy=0,t0=0,drag=false;
  sh.addEventListener("touchstart",e=>{if(sh.scrollTop>2||e.touches.length>1){y0=null;return}y0=e.touches[0].clientY;dy=0;t0=performance.now();drag=false},{passive:true});
  sh.addEventListener("touchmove",e=>{if(y0==null)return;dy=e.touches[0].clientY-y0;
    if(!drag&&dy>12&&sh.scrollTop<=0){drag=true;sh.style.transition="none"}
    if(drag){sh.style.transform=`translateY(${Math.max(0,dy)}px)`;sc.style.opacity=String(Math.max(.15,1-dy/450))}},{passive:true});
  const end=()=>{if(!drag){y0=null;return}const v=dy/Math.max(1,performance.now()-t0);sh.style.transition="";sc.style.opacity="";
    if(dy>110||v>.7){sh.style.transform="translateY(104%)";setTimeout(()=>{sh.style.transform=""},450);closeSheet()}else sh.style.transform="";y0=null;drag=false};
  sh.addEventListener("touchend",end);sh.addEventListener("touchcancel",end);
}
function hideSheet(){$("#sheet").classList.remove("on");$("#scrim").classList.remove("on");SHEET.open=false}
function closeSheet(){if(SHEET.open&&history.state&&history.state.sheet)history.back();else hideSheet()}

/* ===================== navigation : pile d'écrans + historique ===================== */
const NAV=[];let HOME=null;
function setDim(){const d=$("#dim");d.style.zIndex=NAV.length?String(10+NAV.length*2-1):"0";d.style.opacity=NAV.length?".6":"0"}
function openScr(d,origin,instant){
  const t0=window.__t0||performance.now();window.__t0=0;
  const from=!instant&&!RM&&origin&&origin.isConnected?{r:origin.getBoundingClientRect(),rad:parseFloat(getComputedStyle(origin).borderTopLeftRadius)||22}:null;
  const el=document.createElement("section");el.className="scr";el.style.zIndex=String(10+(NAV.length+1)*2);
  renderScreen(el,d);$("#app").appendChild(el);fitSoon(el);
  NAV.push({d,el,origin});
  try{history.pushState({n:NAV.length,r:routeOf(d)},"","#"+routeOf(d))}catch(e){}
  setDim();tickCd(el);
  if(!instant&&!RM){animIn(el,from);setTimeout(()=>el.classList.add("ready"),460)}else el.classList.add("ready");
  const o=el._o;if(o&&o.needs&&o.needs.length)Promise.all(o.needs).then(()=>rerender(el)).catch(()=>{});
  if(o&&o.opened)safe(o.opened,el);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{window.__openMs=performance.now()-t0;(window.__opens=window.__opens||[]).push([routeOf(d),Math.round(window.__openMs)])}));
  el.addEventListener("scroll",onScroll,{passive:true});
}
function rectOk(r){return r&&r.width>20&&r.bottom>0&&r.top<innerHeight}
function animIn(el,from){
  const r=from&&from.r;
  if(rectOk(r)){const rad=from.rad;
    el.animate([{clipPath:`inset(${r.top}px ${innerWidth-r.right}px ${innerHeight-r.bottom}px ${r.left}px round ${rad}px)`},{clipPath:"inset(0px 0px 0px 0px round 0px)"}],{duration:420,easing:"cubic-bezier(.2,.9,.25,1)"});
    const c=el.querySelector(".scrin");c.animate([{opacity:0,transform:`translateY(${Math.min(40,r.top/6)}px) scale(.97)`},{opacity:1,transform:"none"}],{duration:340,delay:60,easing:"cubic-bezier(.2,.9,.25,1)",fill:"backwards"})}
  else el.animate([{transform:"translateX(100%)"},{transform:"none"}],{duration:340,easing:"cubic-bezier(.2,.9,.25,1)"})}
function animOut(x){
  const {el,origin}=x;el.removeEventListener("scroll",onScroll);
  if(RM){el.remove();return}
  const r=origin&&origin.isConnected&&el.scrollTop<60&&!el._swiped?origin.getBoundingClientRect():null;
  let a;
  if(rectOk(r)){const rad=parseFloat(getComputedStyle(origin).borderTopLeftRadius)||22;
    a=el.animate([{clipPath:"inset(0px 0px 0px 0px round 0px)",opacity:1},{clipPath:`inset(${r.top}px ${innerWidth-r.right}px ${innerHeight-r.bottom}px ${r.left}px round ${rad}px)`,opacity:.4}],{duration:340,easing:"cubic-bezier(.4,0,.2,1)",fill:"forwards"})}
  else{const x0=el._swiped||0;a=el.animate([{transform:`translateX(${x0}px)`},{transform:"translateX(100%)"}],{duration:Math.max(160,300*(1-x0/innerWidth)),easing:"cubic-bezier(.3,0,.2,1)",fill:"forwards"})}
  a.onfinish=()=>el.remove();setTimeout(()=>{if(el.isConnected)el.remove()},700);
}
addEventListener("popstate",e=>{
  const s=e.state||{n:0};
  if(SHEET.open&&!s.sheet)hideSheet();
  if(SHEET.after&&!SHEET.open){const r=SHEET.after;SHEET.after=null;setTimeout(()=>go(r),0);return}
  const n=s.n||0;let first=true;
  while(NAV.length>n){const x=NAV.pop();if(first){animOut(x);first=false}else x.el.remove()}
  if(n>NAV.length&&s.r){const d=parseRoute(s.r);if(d){openScr(d,null,true);return}}
  setDim();if(!NAV.length)renderHome(HOME);
});
function back(){if(SHEET.open)return closeSheet();if(NAV.length)history.back()}
/* retour d'un geste : glisser depuis le bord gauche */
const SW={};
addEventListener("touchstart",e=>{if(!NAV.length||SHEET.open||e.touches.length>1)return;const t=e.touches[0];if(t.clientX>24){SW.on=false;return}
  Object.assign(SW,{on:true,x0:t.clientX,y0:t.clientY,t0:Date.now(),dx:0,lock:null,el:NAV[NAV.length-1].el})},{passive:true});
addEventListener("touchmove",e=>{if(!SW.on)return;const t=e.touches[0],dx=t.clientX-SW.x0,dy=t.clientY-SW.y0;
  if(SW.lock==null&&(Math.abs(dx)>8||Math.abs(dy)>8))SW.lock=Math.abs(dx)>Math.abs(dy);if(!SW.lock){if(SW.lock===false)SW.on=false;return}
  SW.dx=Math.max(0,dx);SW.el.style.transform=`translateX(${SW.dx}px)`;$("#dim").style.opacity=String(.6*(1-SW.dx/innerWidth))},{passive:true});
addEventListener("touchend",()=>{if(!SW.on)return;SW.on=false;if(!SW.lock)return;const v=SW.dx/Math.max(1,Date.now()-SW.t0);
  if(SW.dx>innerWidth*.3||(SW.dx>50&&v>.45)){SW.el._swiped=SW.dx;SW.el.style.transform="";history.back()}
  else{const el=SW.el,x0=SW.dx;el.style.transform="";if(!RM)el.animate([{transform:`translateX(${x0}px)`},{transform:"none"}],{duration:220,easing:"cubic-bezier(.2,.9,.25,1)"});setDim()}});
/* glisser horizontalement sur le contenu : onglet voisin */
const TS={};
addEventListener("touchstart",e=>{const c=e.target.closest&&e.target.closest(".tabc");if(!c||e.touches.length>1){TS.on=false;return}const t=e.touches[0];if(t.clientX<=24){TS.on=false;return}Object.assign(TS,{on:true,x0:t.clientX,y0:t.clientY,el:c.closest(".scr")})},{passive:true});
addEventListener("touchend",e=>{if(!TS.on)return;TS.on=false;const t=e.changedTouches[0],dx=t.clientX-TS.x0,dy=t.clientY-TS.y0;if(Math.abs(dx)<70||Math.abs(dx)<2*Math.abs(dy))return;
  const el=TS.el,o=el&&el._o;if(!o||!o.tabs||o.tabs.length<2)return;const i=o.tabs.findIndex(x=>x[0]===el._d.tab),j=i+(dx<0?1:-1);if(j>=0&&j<o.tabs.length)setTab(el,o.tabs[j][0])},{passive:true});
function onScroll(e){const el=e.currentTarget,b=el.querySelector(".bar");if(b)b.classList.toggle("sc",el.scrollTop>4)}

/* ===================== clics : délégation unique =====================
   Ordre : data-pick (pari) → data-info (feuille) → data-back → fond/croix de la feuille → data-tab → actions des modules
   (onAct) → navigation (data-go, puis attributs hérités de v13.5 : data-p, data-t, data-m, data-cmp, data-vs). */
const ACTS=[];
function onAct(sel,fn){ACTS.push([sel,fn])}
const GROW=".grid>.w,.wn-i,.role,.mrow,.rowb,.rkr,.pl,.simr";   // éléments d'où l'écran ouvert « grandit »
const GO_ATTR={go:v=>v,p:v=>"p/"+v,t:v=>"t/"+v,m:v=>"m/"+v,cmp:v=>"cmp/"+String(v).replace("|","~"),vs:v=>"d/"+String(v).replace("|","~")};
function go(route,origin){const d=parseRoute(route);if(!d){toast("Bientôt dans l’appli");return false}
  window.__t0=performance.now();vib(8);openScr(d,origin&&origin.matches&&origin.matches(GROW)?origin:null);return true}
document.addEventListener("click",e=>{
  const t=e.target;if(!t||!t.closest)return;askGyro();   // iPhone : autorisation du gyroscope demandée au premier toucher (carte holo)
  const pk=t.closest("[data-pick]");if(pk){e.stopPropagation();return pickFromBtn(pk)}
  const inf=t.closest("[data-info]");if(inf){e.stopPropagation();return openInfo(inf.dataset.info)}
  if(t.closest("[data-back]"))return back();
  if(t.closest("#scrim,#shX"))return closeSheet();
  const tb=t.closest("[data-tab]");if(tb){const el=tb.closest(".scr");if(el)setTab(el,tb.dataset.tab);return}
  for(const [s,f] of ACTS){const x=t.closest(s);if(x){safe(f,x,e);return}}
  const g=t.closest("[data-go],[data-p],[data-t],[data-m],[data-cmp],[data-vs]");
  if(g)for(const a in GO_ATTR){const v=g.dataset[a];if(v){
    /* lien dans une feuille « i » : la feuille se ferme d'abord (une entrée d'historique), puis l'écran s'ouvre */
    if(SHEET.open&&g.closest("#sheet")){SHEET.after=GO_ATTR[a](v);closeSheet();if(!SHEET.open&&SHEET.after){const r=SHEET.after;SHEET.after=null;go(r)}return}
    go(GO_ATTR[a](v),g);return}}
});
document.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.matches&&e.target.matches("[role=button][data-go]")){e.preventDefault();e.target.click()}if(e.key==="Escape")back()});

/* ===================== pari en un geste =====================
   setPick(clé, équipe, bouton?) : même règle que v13.5 — toucher l'équipe déjà choisie annule le prono (et son score exact) ;
   paris fermés au coup d'envoi ; écrit w26_picks et w26_scores ; met à jour tous les boutons [data-pick][data-mk] ;
   prévient les modules (BUS "pick" : la ligue publie, l'écran Mes paris anime sa ligne). Bouton : data-pick="T1" data-mk="clé". */
function setPick(k,t,btn){const m=MATCHES.find(x=>x.key===k);
  if(!m||m.state!=="soon"||Date.now()>=new Date(m.start).getTime()){MATCHES=finalize(MATCHES);toast("Paris fermés : le match a commencé");onData();return false}
  if(picks[k]===t)delete picks[k];else{picks[k]=t;vib(15)}
  if(!picks[k])delete scores[k];LS.set("picks",picks);LS.set("scores",scores);
  document.querySelectorAll(`[data-mk="${CSS.escape(k)}"][data-pick]`).forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.pick===picks[k])));
  toast(picks[k]?`Prono : ${tid(t)}`:"Prono annulé");
  BUS.emit("pick",k,picks[k]||null,btn);return true}
const pickFromBtn=b=>setPick(b.dataset.mk,b.dataset.pick,b);

/* ===================== compatibilité : noms de v13.5 appelés par des extraits =====================
   Les rendus repris de v13.5 appellent parfois ces fonctions : elles redessinent la refonte à la place. */
let sheetState=null,curTab="home";
function renderLive(){onData()}
function renderAll(){onData()}
function refreshSheet(){NAV.forEach(x=>rerender(x.el))}
/* blocs asynchrones repris de v13.5 (ablock, extrait par le socle) : bouton « Réessayer » d'un bloc en erreur */
onAct("[data-retry]",rt=>{const k=rt.dataset.retry;if(AK[k]){document.querySelectorAll(`[data-ak="${CSS.escape(k)}"]`).forEach(el=>el.innerHTML=akSkel());runAk(k)}});

/* ===================== typographie française automatique =====================
   Tout texte posé dans la page : espace insécable U+00A0 avant « : », espace fine U+202F avant « ; ? ! % » et après « / avant ».
   Appliqué à chaque nœud texte ajouté ou modifié (MutationObserver) : les textes de B et les rendus repris de v13.5 en profitent
   sans qu'on retouche leurs chaînes. Écrire tout de même les nouveaux textes avec NB (U+202F) et U+00A0. */
const TYPO_T=/ [:;?!%»]|« /;
const typoFix=s=>s.replace(/ :/g," :").replace(/ ([;?!%»])/g," $1").replace(/« /g,"« ");
function typoNode(n){
  if(n.nodeType===3){const v=n.nodeValue;if(TYPO_T.test(v)){const w=typoFix(v);if(w!==v)n.nodeValue=w}return}
  if(n.nodeType!==1||/^(SCRIPT|STYLE|TEXTAREA|INPUT|CODE|PRE)$/.test(n.nodeName))return;
  const tw=document.createTreeWalker(n,NodeFilter.SHOW_TEXT);let x;while((x=tw.nextNode())){const v=x.nodeValue;if(TYPO_T.test(v)){const w=typoFix(v);if(w!==v)x.nodeValue=w}}}
new MutationObserver(rs=>{for(const r of rs){if(r.type==="characterData")typoNode(r.target);else r.addedNodes.forEach(typoNode)}})
  .observe(document.body,{childList:true,subtree:true,characterData:true});

/* ===================== effets aimés : intro, faisceau, holo ===================== */
function glowSprite(color,r=16){const c=document.createElement("canvas");c.width=c.height=r*2;const x=c.getContext&&c.getContext("2d");if(!x)return null;const g=x.createRadialGradient(r,r,0,r,r,r);g.addColorStop(0,"rgba(255,255,255,1)");g.addColorStop(.25,color);g.addColorStop(1,"rgba(0,0,0,0)");x.fillStyle=g;x.fillRect(0,0,r*2,r*2);return c}
/* faisceau hextech entre les deux logos : un par écran visible, en pause sous un autre écran ou hors champ */
function startBeam(cv){
  if(RM||!cv||!cv.getContext||cv._on)return;const x=cv.getContext("2d");if(!x)return;cv._on=true;
  const host=cv.parentElement,ls=host.querySelectorAll(".vs .side .logo, .vs .side .mono"),cs=getComputedStyle(host);
  const s1=glowSprite(cs.getPropertyValue("--c1").trim()||"#C8AA6E",12),s2=glowSprite(cs.getPropertyValue("--c2").trim()||"#0AC8B9",12),core=glowSprite("rgba(240,230,210,.6)",48);if(!s1||!s2||!core)return;
  const dpr=Math.min(1.5,devicePixelRatio||1);let Wd=0,H=0,A,B,C,vis=true;const scr=cv.closest(".scr");
  const measure=()=>{const r=cv.getBoundingClientRect();if(!r.width)return;Wd=cv.width=r.width*dpr;H=cv.height=r.height*dpr;
    const ctr=el=>{if(!el)return null;const b=el.getBoundingClientRect();return {x:(b.left+b.width/2-r.left)*dpr,y:(b.top+b.height/2-r.top)*dpr}};
    A=ctr(ls[0])||{x:Wd*.2,y:H*.35};B=ctr(ls[1])||{x:Wd*.8,y:H*.35};C={x:(A.x+B.x)/2,y:(A.y+B.y)/2}};
  requestAnimationFrame(measure);if(window.ResizeObserver)new ResizeObserver(measure).observe(cv);
  if(window.IntersectionObserver)new IntersectionObserver(es=>{vis=es[0].isIntersecting}).observe(cv);
  const Pp=[];let last=0;const add=(s,f)=>Pp.push({t:0,sp:.008+Math.random()*.01,amp:(Math.random()-.5)*26*dpr,ph:Math.random()*6.28,s,f});
  (function loop(t){if(!cv.isConnected)return;requestAnimationFrame(loop);
    const covered=scr===HOME?NAV.length>0:(NAV.length&&NAV[NAV.length-1].el!==scr);
    if(document.hidden||!vis||!Wd||covered||t-last<32)return;last=t;if(!A){measure();return}
    x.clearRect(0,0,Wd,H);x.globalCompositeOperation="lighter";if(Pp.length<120){add(s1,A);add(s2,B)}
    for(let i=Pp.length-1;i>=0;i--){const p=Pp[i];p.t+=p.sp;if(p.t>=1){Pp.splice(i,1);continue}const e=p.t*p.t*(3-2*p.t),px=p.f.x+(C.x-p.f.x)*e,py=p.f.y+(C.y-p.f.y)*e+Math.sin(p.t*9+p.ph)*p.amp*(1-p.t),sz=11*dpr;x.globalAlpha=.9-p.t*.4;x.drawImage(p.s,px-sz/2,py-sz/2,sz,sz)}
    const R=(44+10*Math.sin(t/180))*dpr;x.globalAlpha=1;x.drawImage(core,C.x-R/2,C.y-R/2,R,R);x.globalCompositeOperation="source-over"})(0);
}
/* carte holo : inclinaison au gyroscope (téléphone) ou à la souris */
const TILT={x:0,y:0,raf:0};
function tiltOn(el){const c=el.querySelector("[data-tilt] .hc");if(c)TILT.el=c}
function applyTilt(){TILT.raf=0;const c=TILT.el;if(!c||!c.isConnected)return;c.style.setProperty("--tx",TILT.x.toFixed(2));c.style.setProperty("--ty",TILT.y.toFixed(2))}
if(!RM){addEventListener("deviceorientation",e=>{if(e.gamma==null)return;TILT.x=Math.max(-1,Math.min(1,e.gamma/30));TILT.y=Math.max(-1,Math.min(1,(e.beta-50)/30));if(!TILT.raf)TILT.raf=requestAnimationFrame(applyTilt)},{passive:true});
  addEventListener("pointermove",e=>{if(e.pointerType!=="mouse")return;TILT.x=(e.clientX/innerWidth-.5)*2;TILT.y=(e.clientY/innerHeight-.5)*2;if(!TILT.raf)TILT.raf=requestAnimationFrame(applyTilt)})}
function intro(){const el=$("#intro");if(!el)return;let seen=false;try{seen=sessionStorage.getItem("w26_intro")}catch(e){}
  if(RM||seen||QS.has("nointro")){el.remove();return}try{sessionStorage.setItem("w26_intro","1")}catch(e){}
  const end=()=>{if(!el.isConnected)return;el.classList.add("out");setTimeout(()=>el.remove(),650)};el.addEventListener("click",end);setTimeout(end,2300)}
/* comptes à rebours : seulement sur l'écran du dessus */
function tickCd(s){if(!s)return;s.querySelectorAll("[data-cd]").forEach(x=>{const h=cdText(+x.dataset.cd-Date.now());if(x._h!==h){x._h=h;x.innerHTML=h}})}
setInterval(()=>{if(document.hidden)return;tickCd(topScreen());
  if(MATCHES.some(m=>m.state==="soon"&&Date.now()>=new Date(m.start).getTime())){MATCHES=finalize(MATCHES);onData();if(typeof scheduleNext==="function")scheduleNext()}},1000);

/* préparation : construit hors champ, pendant un temps mort, les écrans qu'on ouvrira sans doute (styles et images prêts) */
function warm(){if(warm.done)return;warm.done=true;const M=homeMoment(),L=["rk/TOP",M.live&&"m/"+M.live.id,M.next&&"m/"+M.next.id,"sim"];
  const R=RKX();if(R&&R.P.TOP)L.push("p/"+R.P.TOP.r[0][0]);
  const box=document.createElement("div");box.setAttribute("aria-hidden","true");box.style.cssText="position:fixed;left:0;top:0;width:100%;height:100%;visibility:hidden;pointer-events:none;z-index:-1;contain:strict";
  document.body.appendChild(box);
  const step=()=>{const r=L.shift();if(!r){box.remove();return}const d=parseRoute(r);if(d){try{const el=document.createElement("section");el.className="scr";box.appendChild(el);renderScreen(el,{...d});el.getBoundingClientRect();el.remove()}catch(e){}}
    (window.requestIdleCallback||setTimeout)(step,{timeout:1500})};
  (window.requestIdleCallback||setTimeout)(step,{timeout:2500})}
/* ===================== démarrage ===================== */
let started=false;
/* après chaque synchro : accueil, écrans ouverts (sauf ceux qui se repeignent seuls : skipData), BUS "data", hooks onData */
function onData(){
  if(!HOME)return;const g=HOME.querySelector(".grid");if(g&&g.querySelector(".sk")){g.remove();HOME.querySelector(".grid").style.display=""}
  renderHome(HOME);
  NAV.forEach(x=>{if(!x.el.isConnected)return;const o=x.el._o;if(o&&o.skipData&&safe(o.skipData,x.d))return;rerender(x.el)});
  BUS.emit("data");
  if(!started){started=true;const r=parseRoute(START_HASH);if(r)openScr(r,null,true);
    (window.requestIdleCallback||setTimeout)(()=>{if(SJ)warm();Promise.all([loadFJ(),loadDJ()]).then(()=>{if(!warm.done)warm()})},{timeout:3000})}
  NAV.forEach(x=>{const o=x.el._o;if(o&&o.onData&&x.el.isConnected)safe(o.onData,x.el)});
}
const START_HASH=location.hash;
function boot(){
  intro();measureSafe();sheetSwipe();instrumentSources();
  HOME=document.createElement("section");HOME.className="scr home ready";HOME.style.zIndex="1";HOME.innerHTML=homeShell();$("#app").appendChild(HOME);
  HOME.addEventListener("scroll",onScroll,{passive:true});watchFit(HOME);paintPill();
  try{history.replaceState({n:0},"",location.pathname+location.search)}catch(e){}
  BUS.emit("boot");
  champMap().then(()=>{if(MATCHES.length){renderHome(HOME);NAV.forEach(x=>rerender(x.el))}});
  quickStart();sync();
  /* retour dans l'appli après plus d'une minute : synchro immédiate (v13.5, 2092) */
  document.addEventListener("visibilitychange",()=>{if(!document.hidden&&(!lastSync||Date.now()-lastSync>60e3)){sync();if(!NAV.length)checkVersion(false)}});
  setTimeout(()=>{if(!NAV.length)checkVersion(false)},4000);
  if(IMPORTED)setTimeout(()=>toast("Profil de "+IMPORTED+" repris sur ce navigateur"),1500);
  /* iPhone : le clavier (recherche) peut décaler la page fixe ; à sa fermeture, on la remet à sa place */
  const unshift=()=>setTimeout(()=>{const se=document.scrollingElement;if(scrollY||(se&&se.scrollTop)){window.scrollTo(0,0);if(se)se.scrollTop=0}},80);
  document.addEventListener("focusout",unshift);if(window.visualViewport)visualViewport.addEventListener("resize",unshift);
  /* iPhone sous iOS 15 ou avant (pas d'overscroll-behavior) : la page ne « rebondit » pas ; seul un écran qui défile vraiment bouge */
  if(!(window.CSS&&CSS.supports&&CSS.supports("overscroll-behavior","none")))document.addEventListener("touchmove",e=>{
    if(e.touches.length>1||!e.target.closest||e.target.closest("input,textarea,select"))return;const s=e.target.closest(".scr,#sheet");
    if(!s||s.classList.contains("fit")||s.scrollHeight<=s.clientHeight+1)e.preventDefault()},{passive:false});
}
