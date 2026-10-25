/* Outil à usage unique (architecte) : écrit src/shell.js à partir de la maquette B (lignes recopiées telles quelles,
   marquées @@B a-b@@) et du code neuf du socle (registres, bus, clics, pari, démarrage). Ne pas relancer ensuite. */
const fs=require("fs"),path=require("path");
const B=path.join(__dirname,"../../designB/src.html"),OUT=path.join(__dirname,"../src/shell.js");
if(process.argv[2]!=="--force"&&fs.existsSync(OUT)){console.error("src/shell.js existe déjà : --force pour écraser");process.exit(1)}
const L=fs.readFileSync(B,"utf8").replace(/\r/g,"").split("\n");
const r=(a,b)=>L.slice(a-1,(b||a)).join("\n");
const rep=(s,a,b)=>{if(!s.includes(a))throw new Error("motif absent : "+a.slice(0,70));return s.replace(a,()=>b)};
let T=`/* =====================================================================================
   shell.js — SOCLE de la refonte « B » (propriétaire : agent socle)
   Pile d'écrans + history API, contrôle segmenté, feuilles « i », transitions, widgets de l'accueil, chargement des
   données, pari en un geste, bus d'événements, effets (intro, faisceau, holo). API : voir ARCHI.md.
   Ordre de chargement : legacy.js (extraits figés de worlds v13.5) → shell.js → home, match, players, team, swiss, stats,
   league → boot.js. Aucun rendu au chargement : les modules déclarent et s'enregistrent, boot() démarre.
   ===================================================================================== */
const APP_VERSION="v14.0-b, préprod";
@@B 494-495@@
/* état propre à la refonte (MATCHES, SOURCE, lastSync, picks, manual, fav, celebrated, ui : legacy « état » ;
   lg, scores, DU, NTFY, topicOf : legacy « ligue, état ») */
let SJ=null,SJt=0,FJ=null,DJ=null,CH=LS.get("champs2",null);
@@B 501-517@@
@@B 519-527@@

/* ===================== bus d'événements =====================
   BUS.on(évt, fn) → fn ; BUS.off(évt, fn) ; BUS.emit(évt, …args). Événements émis par le socle :
   "boot" (accueil posé), "data" (MATCHES rafraîchis, accueil et écrans redessinés), "sj" (nouveau stats.json),
   "pick" (clé, équipe ou null, bouton touché). Les modules peuvent en émettre d'autres (match : "live" (m) ; ligue : "league"). */
const BUS={h:{},on(e,f){(this.h[e]=this.h[e]||[]).push(f);return f},off(e,f){this.h[e]=(this.h[e]||[]).filter(x=>x!==f)},
  emit(e,...a){(this.h[e]||[]).slice().forEach(f=>{try{f(...a)}catch(err){console.warn("BUS "+e,err)}})}};

/* ===================== données ===================== */
@@B 530-548@@

@@B 560-570@@

/* ===================== probas, rangs, petits calculs partagés ===================== */
@@B 573-581@@

/* ===================== rendus communs (cartes, héros, barres) ===================== */
@@B 585-593@@
@@B 596-596@@
@@B 598-598@@
@@B 627-628@@
const mOf=id=>MATCHES.find(x=>x.id===id)||null;
/* ligne de match (calendrier, paris, fiches) : toucher = la fiche du match */
@@B 1056-1058@@

/* ===================== widgets de l'accueil =====================
   W(cls, route, inner, k, style, label) : une tuile (div role=button data-go=route) ; cls = taille : w11 (carré, 136 px),
   w21 (large, 112 px), w22 (héros, 284 px, sans marge) ; k = rang d'apparition (cascade d'entrée).
   defWidget(nom, fn(k, …)) : un module fournit un widget ; widget(nom, k, …) l'appelle ("" s'il manque ou plante). */
@@B 613-613@@
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
@@B 701-729@@

/* ===================== feuilles « i » =====================
   INFO.clé = () => [titre, texte, html?] ; INFOP.préfixe = (a, b, c) => […] pour data-info="préfixe:a:b:c" ;
   xi(clé, fn) rend une clé « x:n » pour une feuille construite à la demande ; showSheet(titre, corps, html?) ouvre directement. */
const INFO={},INFOP={};
INFOP.x=a=>{const f=XI.get(+a);return f?f():null};
function infoFor(k){if(INFO[k])return INFO[k]();const [t,a,b,c]=String(k).split(":"),f=INFOP[t];return f?f(a,b,c):null}
@@B 1117-1123@@

/* ===================== navigation : pile d'écrans + historique ===================== */
@@B 1126-1183@@

/* ===================== clics : délégation unique =====================
   Ordre : data-pick (pari) → data-info (feuille) → data-back → fond/croix de la feuille → data-tab → actions des modules
   (onAct) → navigation (data-go, puis attributs hérités de v13.5 : data-p, data-t, data-m, data-cmp, data-vs). */
const ACTS=[];
function onAct(sel,fn){ACTS.push([sel,fn])}
const GROW=".w,.role,.mrow,.rowb,.rkr,.pl,.simr";   // éléments d'où l'écran ouvert « grandit »
const GO_ATTR={go:v=>v,p:v=>"p/"+v,t:v=>"t/"+v,m:v=>"m/"+v,cmp:v=>"d/"+String(v).replace("|","~")+"/cmp",vs:v=>"d/"+String(v).replace("|","~")};
function go(route,origin){const d=parseRoute(route);if(!d){toast("Bientôt dans l’appli");return false}
  window.__t0=performance.now();vib(8);openScr(d,origin&&origin.matches&&origin.matches(GROW)?origin:null);return true}
document.addEventListener("click",e=>{
  const t=e.target;if(!t||!t.closest)return;
  const pk=t.closest("[data-pick]");if(pk){e.stopPropagation();return pickFromBtn(pk)}
  const inf=t.closest("[data-info]");if(inf){e.stopPropagation();return openInfo(inf.dataset.info)}
  if(t.closest("[data-back]"))return back();
  if(t.closest("#scrim,#shX"))return closeSheet();
  const tb=t.closest("[data-tab]");if(tb){const el=tb.closest(".scr");if(el)setTab(el,tb.dataset.tab);return}
  for(const [s,f] of ACTS){const x=t.closest(s);if(x){safe(f,x,e);return}}
  const g=t.closest("[data-go],[data-p],[data-t],[data-m],[data-cmp],[data-vs]");
  if(g)for(const a in GO_ATTR){const v=g.dataset[a];if(v){go(GO_ATTR[a](v),g);return}}
});
@@B 1198-1198@@

/* ===================== pari en un geste =====================
   setPick(clé, équipe, bouton?) : même règle que v13.5 — toucher l'équipe déjà choisie annule le prono (et son score exact) ;
   paris fermés au coup d'envoi ; écrit w26_picks et w26_scores ; met à jour tous les boutons [data-pick][data-mk] ;
   prévient les modules (BUS "pick" : la ligue publie, l'écran Mes paris anime sa ligne). Bouton : data-pick="T1" data-mk="clé". */
function setPick(k,t,btn){const m=MATCHES.find(x=>x.key===k);
  if(!m||m.state!=="soon"||Date.now()>=new Date(m.start).getTime()){MATCHES=finalize(MATCHES);toast("Paris fermés : le match a commencé");onData();return false}
  if(picks[k]===t)delete picks[k];else{picks[k]=t;vib(15)}
  if(!picks[k])delete scores[k];LS.set("picks",picks);LS.set("scores",scores);
  document.querySelectorAll(\`[data-mk="\${CSS.escape(k)}"][data-pick]\`).forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.pick===picks[k])));
  toast(picks[k]?\`Prono : \${tid(t)}\`:"Prono annulé");
  BUS.emit("pick",k,picks[k]||null,btn);return true}
const pickFromBtn=b=>setPick(b.dataset.mk,b.dataset.pick,b);

/* ===================== compatibilité : noms de v13.5 appelés par des extraits =====================
   Les rendus repris de v13.5 appellent parfois ces fonctions : elles redessinent la refonte à la place. */
let sheetState=null,curTab="home";
function renderLive(){onData()}
function renderAll(){onData()}
function refreshSheet(){NAV.forEach(x=>rerender(x.el))}

/* ===================== effets aimés : intro, faisceau, holo ===================== */
@@B 1234-1265@@

@@B 1267-1274@@
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
  intro();
  HOME=document.createElement("section");HOME.className="scr home ready";HOME.style.zIndex="1";HOME.innerHTML=homeShell();$("#app").appendChild(HOME);
  HOME.addEventListener("scroll",onScroll,{passive:true});
  try{history.replaceState({n:0},"",location.pathname+location.search)}catch(e){}
  BUS.emit("boot");
  champMap().then(()=>{if(MATCHES.length){renderHome(HOME);NAV.forEach(x=>rerender(x.el))}});
  quickStart();sync();
}
`;
T=T.replace(/@@B (\d+)-(\d+)@@/g,(_,a,b)=>r(+a,+b));
// adaptations du code de B, vérifiées une par une
T=rep(T,'CH={t:Date.now(),v,map,nm};LSB.set("champs",CH)','CH={t:Date.now(),v,map,nm};LS.set("champs2",CH)');
T=rep(T,'if(j&&j.teams&&j.built){SJ=j;SJt=Date.now();applySJ()}','if(j&&j.teams&&j.built){const nw=!SJ||SJ.built!==j.built;SJ=j;SJt=Date.now();applySJ();if(nw)BUS.emit("sj",SJ)}');
T=rep(T,'function renderScreen(el,d){const f=SCR[d.v];','function renderScreen(el,d){const f=ROUTES[d.v]&&ROUTES[d.v].screen;');
T=rep(T,'const d=el._d,y=el.scrollTop,old=el._o;const o=safe(SCR[d.v],d);','const d=el._d,y=el.scrollTop,old=el._o,R=ROUTES[d.v];const o=R?safe(R.screen,d):null;');
T=rep(T,'function openInfo(k){const x=safe(infoFor,k);if(!x)return;const [t,body,raw]=x;\n','function openInfo(k){const x=safe(infoFor,k);if(x)showSheet(...x)}\nfunction showSheet(t,body,raw){\n');
T=rep(T,'  if(d.v==="m"){const m=mOf(d.id);if(m&&m.state==="done")loadStats(el,gamesOf(m))}\n','  if(o&&o.opened)safe(o.opened,el);\n');
T=rep(T,'seen=sessionStorage.getItem("w26b_intro")','seen=sessionStorage.getItem("w26_intro")');
T=rep(T,'sessionStorage.setItem("w26b_intro","1")','sessionStorage.setItem("w26_intro","1")');
if(/LSB|w26b_|SCR\[/.test(T))throw new Error("reste de la maquette : "+(T.match(/.{40}(LSB|w26b_|SCR\[).{40}/)||[""])[0]);
fs.writeFileSync(OUT,T);console.log("shell.js",(T.length/1024).toFixed(1)+" Ko");
