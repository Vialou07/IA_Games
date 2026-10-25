/* =====================================================================================
   app.js — SYNCHRO, SOURCES, DIAGNOSTIC, RÉGLAGES (propriétaire : agent socle)
   Données : loadSJ (stats.json du robot, relu au plus toutes les 10 min), loadAux / loadFJ / loadDJ (fiche, draft), champMap
   (Data Dragon, cache w26_champs2 7 jours).
   Planning (sync) : LoL Esports (getSchedule paginé, ordre des équipes figé par keepSides), sinon le planning publié par le
   robot (SJ.sched), sinon les matchs embarqués ; après un échec de LoL Esports, nouveaux essais à 3 s, 10 s puis 30 s, ensuite
   toutes les minutes tant que LoL Esports ne répond pas ; sinon 60 s si un match est « chaud » (en cours, en attente, coup
   d'envoi dans moins de 20 min), 5 min sinon ; synchro au retour
   dans l'appli après plus d'une minute (règles de v13.5, 5332-5338).
   Santé des sources : HEALTH et mark (extraits de v13.5), mesurés sur les vrais appels (leFetch, feedWin enrobés au démarrage,
   loadSJ, champMap) ; diagnostic chronométré, rapport à copier.
   Écran « set » (pastille de synchro de l'accueil) : Réglages (mon équipe, emporter mon profil, autres jeux) · État · Diagnostic.
   ===================================================================================== */

/* ===================== données ===================== */
function loadSJ(force){
  if(SJ&&!force&&Date.now()-SJt<10*60e3)return Promise.resolve(SJ);if(loadSJ.p)return loadSJ.p;const t0=performance.now();
  return loadSJ.p=fetch(BASE+"stats.json",{cache:"no-cache"}).then(r=>{if(!r.ok)throw new Error("HTTP "+r.status);return r.json()})
    .then(j=>{if(!(j&&j.teams&&j.built))throw new Error("pas encore générées");mark("sj",true,performance.now()-t0);
      const nw=!SJ||SJ.built!==j.built;SJ=j;SJt=Date.now();applySJ();if(nw)BUS.emit("sj",SJ);return SJ})
    .catch(e=>{mark("sj",false,performance.now()-t0,e&&e.message||e);return SJ}).finally(()=>{loadSJ.p=null});
}
const AUX={};
function loadAux(name){if(AUX[name]&&AUX[name].d)return Promise.resolve(AUX[name].d);if(AUX[name]&&AUX[name].p)return AUX[name].p;
  const o=AUX[name]={};return o.p=fetch(BASE+name+".json",{cache:"no-cache"}).then(r=>r.ok?r.json():null).then(d=>{o.d=d;return d}).catch(()=>null).finally(()=>{o.p=null})}
async function loadFJ(){if(FJ)return FJ;const d=await loadAux("fiche");if(d&&d.v===1&&Array.isArray(d.gm))FJ=d;return FJ}
async function loadDJ(){if(DJ)return DJ;const d=await loadAux("draft");if(d&&d.v===1&&Array.isArray(d.ch))DJ=d;return DJ}
function champMap(){
  if(CH&&Date.now()-CH.t<7*864e5)return Promise.resolve(CH);if(champMap.p)return champMap.p;
  return champMap.p=(async()=>{const t0=performance.now();try{const v=(await (await fetch("https://ddragon.leagueoflegends.com/api/versions.json")).json())[0];
    const j=await (await fetch(`https://ddragon.leagueoflegends.com/cdn/${v}/data/en_US/champion.json`)).json();
    const map={},nm={};Object.values(j.data).forEach(c=>{map[norm(c.name)]=c.id;map[norm(c.id)]=c.id;nm[c.id]=c.name});
    CH={t:Date.now(),v,map,nm};LS.set("champs2",CH);mark("dd",true,performance.now()-t0)}catch(e){mark("dd",false,performance.now()-t0,e&&e.message||e)}champMap.p=null;return CH})();
}

/* ===================== planning : LoL Esports → robot → embarqué ===================== */
const SYNC={busy:false,p:null,fails:0,off:false,started:0};
function sync(){
  if(SYNC.p)return SYNC.p;
  SYNC.busy=true;paintPill();
  return SYNC.p=(async()=>{let list=null;
    try{
      try{list=await fromLolEsports();SOURCE="LoL Esports";SYNC.fails=0}
      catch(e){SYNC.fails++;try{await loadSJ();list=await fromRobot();SOURCE="robot"}catch(e2){list=null}}
      if(list){MATCHES=finalize(list);lastSync=new Date();SYNC.off=false}
      else if(!MATCHES.length||SOURCE==="hors ligne"){MATCHES=finalize(EMBED.map(m=>({...m})));SOURCE="hors ligne";SYNC.off=true}
      else{MATCHES=finalize(MATCHES);SYNC.off=true}            // sources injoignables : on garde la dernière synchro réussie
    }finally{SYNC.busy=false;SYNC.p=null;scheduleNext()}      // quoi qu'il arrive, la synchro suivante est programmée
    onData();
    if(!loadPhotos.done){loadPhotos.done=true;loadPhotos().catch(()=>{})}
  })();
}
function scheduleNext(){
  clearTimeout(sync.t);const now=Date.now();
  const hot=MATCHES.some(m=>m.state==="live"||m.state==="wait"||(m.state==="soon"&&new Date(m.start)-now<20*60e3));
  // LoL Esports injoignable : nouveaux essais rapprochés (3 s, 10 s, 30 s), puis toutes les minutes tant qu'on vit sur le planning
  // du robot ou hors ligne (retour à LoL Esports dans la minute où il répond à nouveau) ; sinon 60 s si un match est chaud, 5 min
  const deg=SOURCE!=="LoL Esports"&&SYNC.fails>=1,ms=deg&&SYNC.fails<=3?[3,10,30][SYNC.fails-1]*1e3:hot||deg?60e3:5*60e3;
  sync.t=setTimeout(sync,ms);SYNC.next=now+ms;
}
/* le robot publie aussi le planning : premier affichage sans attendre l'API */
async function quickStart(){await loadSJ();if(!MATCHES.length&&SJ){try{MATCHES=finalize(await fromRobot());SOURCE="robot"}catch(e){}}if(MATCHES.length)onData()}
/* pastille de l'accueil : état de la synchro ; toucher = Réglages et état */
/* priorité : l'origine des données d'abord (hors ligne, robot), puis le direct, puis l'heure de synchro (v13.5 : bouton de synchro) */
function pillState(){const live=HM&&HM.k==="live"&&HM.live;
  if(!MATCHES.length)return ["busy","Chargement…","Premier chargement des matchs"];
  if(SOURCE==="hors ligne"||SYNC.off)return ["off","Hors ligne",SOURCE==="hors ligne"?"Sources injoignables : données du 23/10 et tes saisies. Nouvel essai automatique.":"Sources injoignables : dernière synchro à "+(lastSync?fmtTime(lastSync):"?")+". Nouvel essai automatique."];
  if(SOURCE==="robot"){const rb=SJ&&SJ.built?new Date(SJ.built):null;return ["warn","Robot"+(rb?" "+fmtTime(rb):""),"LoL Esports ne répond pas : résultats du robot"+(rb?" de "+fmtTime(rb):"")+". Nouvel essai automatique."]}
  if(live&&live.state==="wait")return ["warn","En attente","Match terminé, résultat officiel en attente. Touche pour l’état des sources."];
  if(live)return ["live","En direct","Match en cours. Touche pour l’état des sources."];
  if(SYNC.busy)return ["busy","Synchro…","Synchronisation en cours"];
  return ["ok",lastSync?fmtTime(lastSync):"…","Synchronisé via LoL Esports. Touche pour l’état des sources."]}
function paintPill(){const p=HOME&&HOME.querySelector(".pill");if(!p)return;const [k,t,ti]=pillState(),h=`<i></i>${esc(t)}`;
  if(p._k!==k){p._k=k;p.className="pill "+k}if(p._h!==h){p._h=h;p.innerHTML=h}p.title=ti;p.setAttribute("aria-label",`${t.replace(/ :/g," :")}. État de l’appli`)}

/* ===================== photos : robot (pinfo) → LoL Esports (getTeams, cache w26_le_photos 24 h) ===================== */
const PHOTO_LOG={rb:"en attente",le:"en attente"};
const photoN=()=>PLAYERS.filter(p=>p.photo||p.lePhoto||p.wikiPhoto).length;
async function loadPhotos(force){
  const sig=()=>PLAYERS.map(p=>p.photo+"|"+p.lePhoto).join(";"),s0=sig();
  if(force){LS.set("le_photos",null);PHOTO_LOG.rb=PHOTO_LOG.le="en cours…";paintSet()}
  const s=await loadSJ(!!force);
  PHOTO_LOG.rb=s&&s.pinfo&&Object.keys(s.pinfo).length?`${Object.keys(s.pinfo).length} fiches`:"absentes";
  try{await enrichPhotosLE();PHOTO_LOG.le=PHOTO_LOG.rb!=="absentes"?"inutile (photos du robot)":"ok"}catch(e){PHOTO_LOG.le="injoignable ("+(e&&e.message||e)+")"}
  if(force||sig()!==s0)onData();else paintSet();
}

/* ===================== santé des sources et diagnostic (HEALTH, mark, ago, timed : extraits de v13.5) ===================== */
const SRCS=[["sj","Stats du robot"],["le","LoL Esports"],["feed","Flux direct"],["relay","Relais de la ligue"],["dd","Data Dragon"]];
const SRCL={sj:"Stats précalculées (robot GitHub)",le:"LoL Esports (planning, résultats)",feed:"Flux direct (kills, or, draft)",relay:"Relais de la ligue",dd:"Data Dragon (icônes)"};
/* les vrais appels sont chronométrés : leFetch (planning, direct) et feedWin (flux) enrobés une fois, au démarrage */
function instrumentSources(){
  const wrap=(name,key)=>{const f=window[name];if(typeof f!=="function"||f._hw)return;
    const g=async function(...a){const t=performance.now();try{const r=await f.apply(this,a);mark(key,true,performance.now()-t);return r}catch(e){mark(key,false,performance.now()-t,e&&e.message||e);throw e}};
    g._hw=1;window[name]=g};
  wrap("leFetch","le");wrap("feedWin","feed");
}
function relayHealth(){if(!lg)return;HEALTH.relay=HEALTH.relay&&HEALTH.relay.diag?HEALTH.relay:{ok:!!(DU.open||DU.pollOk),ms:0,at:Date.now(),err:DU.pubErr?"publication impossible":DU.open||DU.pollOk?null:"pas de connexion"}}
/* une source sur une ligne : nom, il y a combien de temps, état ; l'erreur en dessous seulement si échec */
function healthRow(k,label){const h=HEALTH[k];
  const st=!h?`<span class="hz">pas utilisé</span>`:h.ok?`<span class="hok">OK, ${h.ms}${NB}ms</span>`:`<span class="hko">Échec</span>`;
  return `<div class="hrow"><b>${esc(label)}${h?`<i>${esc(ago(h.at))}</i>`:""}</b>${st}${h&&!h.ok&&h.err?`<small class="he">${esc(h.err)}</small>`:""}</div>`}
const DIAG={run:false,res:[]};
async function runDiag(){
  if(DIAG.run)return;DIAG.run=true;DIAG.res=[];paintSet();
  const tests=[
    ()=>timed("LoL Esports : planning Worlds",async()=>{const j=await leFetch(`getSchedule?hl=fr-FR&leagueId=${WORLDS_LEAGUE}`);return (j?.data?.schedule?.events||[]).length+" matchs reçus"}),
    ()=>timed("LoL Esports : matchs en cours",async()=>{const j=await leFetch("getLive?hl=fr-FR");const ev=j?.data?.schedule?.events||[];return ev.length?ev.map(e=>(e.match?.teams||[]).map(t=>t.code).join(" contre ")).join(", "):"aucun match en cours"}),
    ()=>timed("Flux direct",async()=>{const L=typeof LV!=="undefined"&&Object.values(LV.games||{}).find(x=>x.gid);if(!L)return "aucune partie suivie pour l’instant";if(typeof feedWin!=="function")return "lecteur du flux absent";
      let w;try{w=await feedWin(L.gid,Date.now()-50000)}catch(e){throw new Error(/^(400|404)$/.test(String(e&&e.message))?`${e.message} : pas encore d’images pour cette partie (draft en cours ?)`:e&&e.message||e)}if(!w||!w.frames)return "partie trouvée, pas de nouvelle image";const f=w.frames[w.frames.length-1];return `kills ${f.blueTeam.totalKills}-${f.redTeam.totalKills}, ${((f.blueTeam.participants||[]).length+(f.redTeam.participants||[]).length)} joueurs lus`}),
    ()=>timed("Stats précalculées",async()=>{SJt=0;const s=await loadSJ(true);if(!s)throw new Error((HEALTH.sj&&HEALTH.sj.err)||"pas encore générées");const st=Object.keys(s.stale||{});
      return `générées le ${new Date(s.built).toLocaleString("fr-FR")}, ${(s.meta?.duels||0).toLocaleString("fr-FR")} duels, ${plur((s.errors||[]).length,"erreur")}${st.length?`, en retard : ${st.join(", ")}`:""}`}),
    ()=>timed("Fiche et draft du robot",async()=>{const [f,d]=await Promise.all([loadFJ(),loadDJ()]);if(!f&&!d)throw new Error("injoignables");return `fiche ${f?"OK":"absente"}, draft ${d?"OK":"absente"}`}),
    ()=>timed("Relais de la ligue",async()=>{const t=performance.now();const r=await fetch(NTFY+"iagames-worlds26-ping/json?poll=1&since=1m");if(!r.ok)throw new Error("HTTP "+r.status);
      if(lg)HEALTH.relay={ok:true,ms:Math.round(performance.now()-t),at:Date.now(),err:null,diag:1};return "joignable"}),
    ()=>timed("Data Dragon",async()=>{const t=performance.now(),r=await fetch("https://ddragon.leagueoflegends.com/api/versions.json");const v=(await r.json())[0];mark("dd",true,performance.now()-t);return "patch "+v}),
    ()=>timed("Images (drapeaux, logos)",()=>new Promise((ok,ko)=>{let n=0;const bad=[];setTimeout(()=>ko(new Error("pas de réponse en 6 s")),6000);
      const srcs=["https://flagcdn.com/kr.svg",thumb(LIVE_LOGO.T1||LE_LOGO.T1,160)];
      srcs.forEach(s=>{const i=new Image();i.onload=()=>{if(++n===srcs.length)bad.length?ko(new Error("échec : "+bad.join(", "))):ok("chargées")};i.onerror=()=>{bad.push(s.includes("flagcdn")?"drapeaux":"logos");if(++n===srcs.length)ko(new Error("échec : "+bad.join(", ")))};i.src=s})}))
  ];
  for(const t of tests){DIAG.res.push(await t());paintSet()}
  DIAG.run=false;paintSet();
}
function diagReport(){relayHealth();
  const L=[`Worlds 2026 ${APP_VERSION}`,`Source matchs : ${SOURCE}${lastSync?" à "+fmtTime(lastSync):""}${SYNC.off?" (hors ligne)":""}`,`Stats du robot : ${SJ&&SJ.built?new Date(SJ.built).toLocaleString("fr-FR"):"absentes"}`,
    `Photos ${photoN()}/${PLAYERS.length} (robot : ${PHOTO_LOG.rb}, LoL Esports : ${PHOTO_LOG.le})`,
    `Ligue : ${lg?lg.code+" / "+plur(Object.keys(lg.players).length+1,"joueur")+" / flux "+(DU.open?"SSE":DU.pollOk?"poll":"off"):"aucune"}`,
    `Écran : ${innerWidth}×${innerHeight}, ${devicePixelRatio||1}x${matchMedia("(display-mode: standalone)").matches?", appli installée":""}`,`Navigateur : ${navigator.userAgent}`];
  SRCS.forEach(([k])=>{const h=HEALTH[k],l=SRCL[k];L.push(`${l} : ${!h?"non utilisé":h.ok?"OK "+h.ms+" ms":"ÉCHEC "+(h.err||"")}`)});
  DIAG.res.forEach(r=>L.push(`[test] ${r.label} : ${r.ok?"OK":"ÉCHEC"} ${r.ms} ms, ${r.d}`));
  return L.join("\n");
}
async function diagAction(a){
  if(a==="run"){runDiag();return}
  if(a==="sync"){toast("Actualisation…");SJt=0;if(typeof LV!=="undefined")LV.liveT=0;await sync();paintSet();toast(SYNC.off?"Sources injoignables":"Données à jour");return}
  if(a==="photos"){loadPhotos(true);return}
  if(a==="copy"){try{await navigator.clipboard.writeText(diagReport());toast("Rapport copié")}catch(e){toast("Copie impossible")}}
}

/* ===================== mon équipe (w26_fav, comme v13.5) =====================
   data-fav="T1" (n'importe quel écran) : choisit l'équipe, ou la retire si c'est déjà elle. Surlignée partout (mrow.fav). */
function setFav(id,btn){fav=fav===id?null:id;LS.set("fav",fav);
  if(fav){if(btn){const b=btn.getBoundingClientRect();confetti(b.left+b.width/2,b.top+b.height/2,[col(fav),"#F0E6D2","#C8AA6E"],35)}vib(15);toast(`Mon équipe : ${tid(fav)}`)}else toast("Plus d’équipe suivie");
  onData();BUS.emit("fav",fav)}

/* ===================== écran « Réglages et état » (set) ===================== */
function scrSet(){return {title:"Réglages et état",info:"set",tabs:[["moi","Réglages"],["etat","État"],["diag","Diagnostic"]],render:t=>t==="etat"?setState():t==="diag"?setDiag():setMine()}}
function setMine(){
  return `<div class="blk"><div class="bh">Mon équipe<button class="i" data-info="fav" aria-label="Mon équipe">i</button></div>
    <div class="favg">${TEAMS.map(t=>`<button class="fvb" data-fav="${t.id}" aria-pressed="${fav===t.id}" aria-label="${esc(t.name)}">${logo(t.id,32)}<span>${esc(t.id)}</span></button>`).join("")}</div>
    <p class="note mt0" style="margin-top:8px">${fav?`${esc(T[fav].name)} : ses matchs sont surlignés en or.`:"Touche une équipe : ses matchs seront surlignés partout."}</p></div>
  <div class="blk"><div class="bh">Changer de téléphone<button class="i" data-info="move" aria-label="Emporter mon profil">i</button></div>
    <button class="btn gold mt0" data-move>Emporter mon profil</button></div>
  <a class="lnk" href="index.html">Autres jeux IA Games<span aria-hidden="true">›</span></a>`}
function setState(){relayHealth();const n=lg?Object.keys(lg.players).length+1:0,rb=SJ&&SJ.built?new Date(SJ.built):null;
  return `<div class="blk"><div class="bh">L’appli</div><dl class="kv">
    <dt>Version</dt><dd>${esc(APP_VERSION)}</dd>
    <dt>Matchs</dt><dd>${SOURCE==="hors ligne"?"données du 23/10 (hors ligne)":esc(SOURCE==="robot"?"planning du robot":SOURCE)}${lastSync?`, synchro à ${fmtTime(lastSync)}`:""}${SYNC.off&&SOURCE!=="hors ligne"?" (hors ligne depuis)":""}</dd>
    <dt>Stats du robot</dt><dd>${rb?esc(rb.toLocaleString("fr-FR",{weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})):"pas encore lues"}</dd>
    <dt>Photos</dt><dd>${photoN()}/${PLAYERS.length}</dd>
    <dt>Ligue</dt><dd>${lg?`${esc(lg.code)}, ${plur(n,"joueur")}, ${DU.open?"flux actif":DU.pollOk?"interrogation régulière":"hors ligne"}`:"aucune"}</dd>
    <dt>Horaires</dt><dd>${esc(tzLabel)}</dd>
    <dt>Heure du téléphone</dt><dd>${esc(new Date().toLocaleString("fr-FR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit"}))}</dd></dl></div>
  <div class="blk"><div class="bh">Sources<button class="i" data-info="sources" aria-label="Les sources">i</button></div>${SRCS.map(([k,l])=>healthRow(k,l)).join("")}</div>`}
const diagRes=res=>res.map(r=>`<div class="hrow"><b>${esc(r.label)}</b>${r.ok?`<span class="hok">OK, ${r.ms}${NB}ms</span>`:`<span class="hko">Échec, ${r.ms}${NB}ms</span>`}<small${r.ok?"":` class="he"`}>${esc(r.d)}</small></div>`).join("");
function setDiag(){
  return `<div class="pk2" style="margin-top:4px"><button class="btn gold mt0" data-diag="run"${DIAG.run?" disabled":""}>${DIAG.run?"Diagnostic en cours…":"Lancer le diagnostic"}</button><button class="btn mt0" data-diag="sync">Actualiser</button></div>
  ${DIAG.res.length?`<div class="blk"><div class="bh">Résultat<em class="bhe">${DIAG.res.filter(r=>r.ok).length}/${DIAG.res.length} OK</em></div>${diagRes(DIAG.res)}${DIAG.run?skel(40):""}</div>`:`<p class="note">8 tests chronométrés : planning, matchs en cours, flux direct, stats du robot, fiche et draft, relais de la ligue, icônes, images.</p>`}
  <button class="btn" data-diag="copy">Copier le rapport</button><p class="note mt0" style="margin-top:8px">Rien de personnel dans le rapport : colle-le dans la conversation avec Claude pour un correctif ciblé.</p>
  <div class="blk phl"><span class="grow"><b>Photos des joueurs : ${photoN()}/${PLAYERS.length}</b><small>robot : ${esc(PHOTO_LOG.rb)} · LoL Esports : ${esc(PHOTO_LOG.le)}</small></span><button class="btn mt0" data-diag="photos">Recharger</button></div>`}
/* l'écran set se redessine quand une mesure arrive (diagnostic en cours, photos) */
function paintSet(){NAV.forEach(x=>{if(x.d.v==="set"&&x.el.isConnected)rerender(x.el)})}
INFO.set=()=>["Réglages et état",`Réglages : ton équipe et ton profil. État : d’où viennent les données (LoL Esports, sinon le planning du robot, sinon les matchs embarqués) et si chaque source répond. Diagnostic : à lancer si quelque chose cloche, puis « Copier le rapport ».`];
INFO.fav=()=>["Mon équipe","Ses matchs sont surlignés partout d’un liseré or, elle a son widget sur l’accueil et son parcours est tracé dans la phase suisse. Elle reste sur ce téléphone (et voyage avec « Emporter mon profil »)."];
INFO.move=()=>["Emporter mon profil","Chaque navigateur a sa propre mémoire (Messenger, Chrome, Safari, icône sur l’écran d’accueil…). Ce lien transporte ta ligue, tes paris, tes scores exacts, tes résultats saisis, ton équipe et ton prénom : ouvre-le dans l’autre navigateur. Si un autre profil s’y trouve, l’appli te demande avant de le remplacer."];
INFO.sources=()=>["Les sources",`<p><b>Stats précalculées</b> : le robot GitHub recalcule tout toutes les 30 min (classements, pronos, faits, planning de secours).</p><p><b>LoL Esports</b> : planning et résultats officiels, relus toutes les minutes quand un match approche. S’il ne répond pas, nouvel essai à 3 s, 10 s, 30 s puis chaque minute, et en attendant le planning du robot.</p><p><b>Flux direct</b> : kills, or et draft de la partie en cours (environ 30 s de décalage).</p><p><b>Relais de la ligue</b> : ntfy.sh, qui échange les paris entre potes.</p><p><b>Data Dragon</b> : les icônes des champions.</p>`,true];

/* ---------- branchements ---------- */
defScreen("set",{arg:"tab",screen:scrSet});
onAct("[data-fav]",b=>setFav(b.dataset.fav,b));
onAct("[data-diag]",b=>{vib(8);diagAction(b.dataset.diag)});
onAct("[data-move]",()=>{vib(8);moveProfile()});
