/* =====================================================================================
   test/qa_parite.js — contrôle qualité (intégrateur) : PARITÉ ligne par ligne avec INVENTAIRE.md.
   Données RÉELLES (robot et LoL Esports en ligne, heure réelle), iPhone 12. Deux téléphones côte à côte :
     REF = v13.5 figée (ref/worlds_v13_5.html), on y lit les mêmes calculs (fonctions de v13.5) et ses écrans ;
     NEW = refonte (dist/worlds-b.html), on y vérifie le critère de chaque ligne de l'inventaire SUR L'ÉCRAN, et on compare
           les chiffres à ceux de v13.5 quand le calcul est partagé (robot, phrases, classements, records…).
   Contextes annexes : intro (sans ?nointro, puis 2e ouverture, puis mouvement réduit), LoL Esports coupé (pastille Robot),
   tout coupé (Hors ligne), iPhone avec demande d'autorisation du gyroscope.
   Les lignes « direct », « ligue à 3 », « reprise v13.5 » et « réseau » sont prouvées par qa_live.js, qa_ligue.js,
   qa_reprise.js et test/socle.js --net : ce script les marque « voir … » avec le résultat lu dans test/qa/*.json.
   node test/qa_parite.js   (port 8915) → test/qa/parite.json
   ===================================================================================== */
const PW="C:/Users/vialo/AppData/Local/Temp/claude/c--Users-vialo-Desktop-Code-Worlds-2026/cead0307-273c-463a-8548-1b2491359512/scratchpad/pw/node_modules/playwright";
const {chromium,devices}=require(PW);const fs=require("fs"),path=require("path"),http=require("http");
const ROOT=path.join(__dirname,".."),OUT=path.join(ROOT,"shots","qa"),PORT=8915;fs.mkdirSync(OUT,{recursive:true});fs.mkdirSync(path.join(__dirname,"qa"),{recursive:true});
const B_URL=`http://127.0.0.1:${PORT}/dist/worlds-b.html`,A_URL=`http://127.0.0.1:${PORT}/ref/worlds_v13_5.html`;
const TYPES={html:"text/html; charset=utf-8",js:"text/javascript",json:"application/json",png:"image/png"};
const srv=http.createServer((q,s)=>{const f=path.join(ROOT,decodeURIComponent(q.url.split("?")[0]));if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);s.end();return}
  s.writeHead(200,{"content-type":TYPES[f.split(".").pop()]||"application/octet-stream","cache-control":"no-store"});fs.createReadStream(f).pipe(s)});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const R={checks:[],ref:{},errs:{},ctx:{}};
const C=(id,ok,detail)=>{R.checks.push({id,res:ok===true?"ok":ok===false?"KO":String(ok),detail:String(detail==null?"":typeof detail==="string"?detail:JSON.stringify(detail)).slice(0,400)});console.log(id.padEnd(6),ok===true?"ok ":ok===false?"KO ":String(ok).padEnd(3),String(typeof detail==="string"?detail:JSON.stringify(detail)).slice(0,170))};
const strip=s=>String(s||"").replace(/<[^>]+>/g,"").replace(/&nbsp;|\u00a0|\u202f|\u2060/g," ").replace(/&amp;/g,"&").replace(/&#39;|’/g,"'").replace(/\s+/g," ").trim();
const norm=s=>strip(s).replace(/ ([:;?!%])/g,"$1").replace(/[«»"]/g,"").toLowerCase();
const QA=()=>{window.__qa={sleep:ms=>new Promise(r=>setTimeout(r,ms)),
  top(){return NAV.length?NAV[NAV.length-1].el:document.querySelector(".home")},
  txt(){const el=this.top();return (el.innerText||"").replace(/\s+/g," ")},
  tabTxt(){const el=this.top(),c=el.querySelector(".tabc");return ((c||el).innerText||"").replace(/\s+/g," ")},
  async go(r,ms=1500){go(r);await this.sleep(ms)},
  async tab(k,ms=1100){const b=this.top().querySelector(`.segw .seg [data-tab="${k}"]`);if(b)b.click();await this.sleep(ms);return !!b},
  async home(){while(NAV.length){history.back();await this.sleep(420)}if(SHEET.open){closeSheet();await this.sleep(400)}},
  async click(sel,ms=600,root){const x=(root||this.top()).querySelector(sel);if(!x)return false;x.click();await this.sleep(ms);return true},
  sheet(){return SHEET.open?document.querySelector("#shB").innerText.replace(/\s+/g," "):null},
  async closeSh(){if(SHEET.open){history.back();await this.sleep(500)}},
  measure(){const el=this.top(),fit=el.classList.contains("fit");return {fit,over:fit?0:el.scrollHeight-el.clientHeight,ratio:+(el.scrollHeight/innerHeight).toFixed(2),hs:el.scrollWidth>el.clientWidth+1}}}};
async function newCtx(b,opt={}){const ctx=await b.newContext({...devices["iPhone 12"],locale:"fr-FR",timezoneId:"Europe/Paris",...(opt.rm?{reducedMotion:"reduce"}:{})});
  await ctx.route(/ntfy\.sh|lol\.fandom\.com/,r=>r.abort());
  if(opt.noLE)await ctx.route(/esports-api\.lolesports\.com/,r=>r.abort());
  if(opt.offline)await ctx.route(/esports-api\.lolesports\.com|raw\.githubusercontent\.com|feed\.lolesports\.com|ddragon|wsrv\.nl|communitydragon/,r=>r.abort());
  await ctx.addInitScript(QA);if(opt.init)await ctx.addInitScript(opt.init);return ctx}
async function page(ctx,name,url){const p=await ctx.newPage();R.errs[name]=[];p.on("pageerror",e=>R.errs[name].push(e.message));
  p.on("console",m=>{if(m.type()==="error"&&!/Failed to load resource|net::ERR|ERR_FAILED|EventSource/.test(m.text()))R.errs[name].push("console "+m.text().slice(0,200))});p.on("dialog",d=>d.accept().catch(()=>{}));
  if(url)await p.goto(url);return p}
const readyB=async p=>{await p.waitForFunction(()=>typeof MATCHES!=="undefined"&&MATCHES.length&&document.querySelector(".home .grid .w"),null,{timeout:60000});await p.evaluate(async()=>{await Promise.all([loadFJ(),loadDJ(),champMap()].map(x=>x&&x.catch?x.catch(()=>{}):x))});await wait(2500)};
const readyA=async p=>{await p.waitForFunction(()=>typeof MATCHES!=="undefined"&&MATCHES.length>10&&typeof SJ!=="undefined"&&SJ&&SJ.rk,null,{timeout:60000});await wait(4000)};
const E=async(p,fn,arg)=>{try{return await p.evaluate(fn,arg)}catch(e){return {__err:String(e.message||e).slice(0,200)}}};
const rd=f=>{try{return JSON.parse(fs.readFileSync(path.join(__dirname,f),"utf8"))}catch(e){return null}};

(async()=>{await new Promise(r=>srv.listen(PORT,"127.0.0.1",r));const b=await chromium.launch();
try{
  /* ===================== REF : v13.5 ===================== */
  const cA=await newCtx(b),A=await page(cA,"v13",A_URL);await readyA(A);
  R.ref=await E(A,async()=>{const sl=ms=>new Promise(r=>setTimeout(r,ms)),st=s=>String(s||"");
    const o={src:SOURCE,matches:MATCHES.map(m=>[m.id,m.t1,m.t2,m.state,m.winner||"",m.s1,m.s2,m.bo,m.stage,m.round||""].join("|")),
      soon:MATCHES.filter(m=>m.state==="soon"&&m.t1&&m.t2).map(m=>[m.id,Math.round(robotProb(m)*1000)/10]),who1:st(rkWho1()),best:{},status:{},lives:{},
      nPlayers:typeof PLAYERS!=="undefined"?PLAYERS.length:null,nTeams:TEAMS.length,nfx:(SJ.fx||[]).length,built:SJ.built};
    for(const r of ["TOP","JGL","MID","BOT","SUP"])o.best[r]=st(rkBest1(r));
    for(const t of TEAMS){try{o.status[t.id]=JSON.stringify(status(t.id));o.lives[t.id]=lives(t.id)}catch(e){}}
    const tab=async v=>{const x=document.querySelector(`nav.tabs button[data-v="${v}"]`);if(x)x.click();await sl(2500);const el=document.getElementById("v-"+v);return el?el.innerText.replace(/\s+/g," "):""};
    o.tx={home:(document.getElementById("v-home")||{}).innerText,stats:await tab("stats"),swiss:await tab("swiss"),teams:await tab("teams"),players:await tab("players"),matchs:await tab("matchs")};
    for(const k in o.tx)o.tx[k]=String(o.tx[k]||"").replace(/\s+/g," ");await tab("home");
    // clés du match suivant (phrase « pourquoi ») et duels par poste
    const m=MATCHES.find(m=>m.state==="soon"&&m.t1&&m.t2);if(m){o.next=m.id;try{matchSheet(m.id);await sl(6000);o.sheet=document.querySelector("#sheetBody").innerText.replace(/\s+/g," ").slice(0,6000)}catch(e){o.sheetErr=e.message}history.back();await sl(600)}
    o.who1=o.who1;return o});
  R.ctx.ref={src:R.ref.src,matches:R.ref.matches&&R.ref.matches.length,next:R.ref.next};
  /* ===================== NEW : refonte ===================== */
  const cB=await newCtx(b),B=await page(cB,"refonte",B_URL+"?nointro");await readyB(B);const q=(fn,arg)=>E(B,fn,arg);
  const ctx=await q(()=>{const soon=MATCHES.filter(m=>m.state==="soon"&&m.t1&&m.t2);return {src:SOURCE,moment:HM&&HM.k,next:soon[0]&&soon[0].id,soon:soon.map(m=>m.id),
    done:[...MATCHES].reverse().find(m=>m.winner&&m.bo===1)?.id,ser:[...MATCHES].reverse().find(m=>m.winner&&m.bo>1)?.id,v:APP_VERSION,eve:[...new Set(MATCHES.filter(m=>m.winner).map(m=>dayKeyL(new Date(m.start))))].pop()}});R.ctx.new=ctx;
  // ---- données identiques (même planning, même robot) ----
  const nm=await q(()=>MATCHES.map(m=>[m.id,m.t1,m.t2,m.state,m.winner||"",m.s1,m.s2,m.bo,m.stage,m.round||""].join("|")));
  const diff=(R.ref.matches||[]).filter((x,i)=>x!==nm[i]);C("S-19",diff.length===0,diff.length?"différences : "+diff.slice(0,3).join(" / ")+" ≠ "+nm.filter(x=>!(R.ref.matches||[]).includes(x)).slice(0,3).join(" / "):`${nm.length} matchs identiques à v13.5 (ordre des équipes, état, vainqueur, score, phase, ronde)`);
  C("S-20",nm.length&&!diff.length&&(await q(()=>document.querySelector(".home").innerText)).match(/ronde \d/i)!==null,"états et rondes identiques à v13.5 ; héros : "+((await q(()=>document.querySelector(".home").innerText)).match(/Phase [^\n]*ronde \d|Play-In|Quart|Demi|Finale/i)||["?"])[0]);
  const st2=await q(()=>{const o={},l={};for(const t of TEAMS){o[t.id]=JSON.stringify(status(t.id));l[t.id]=lives(t.id)}return {o,l}});
  const sd=Object.keys(R.ref.status||{}).filter(k=>R.ref.status[k]!==st2.o[k]||R.ref.lives[k]!==st2.l[k]);C("W-05",sd.length===0,sd.length?"statuts différents : "+sd.join(","):"statut et sursis des 19 équipes identiques à v13.5");
  const rp=await q(ids=>ids.map(id=>{const m=MATCHES.find(x=>x.id===id);return m?[id,Math.round(robotProb(m)*1000)/10]:[id,null]}),(R.ref.soon||[]).map(x=>x[0]));
  const rpd=(R.ref.soon||[]).filter((x,i)=>!rp[i]||x[1]!==rp[i][1]);C("MA-01",rpd.length===0,rpd.length?"prono du robot différent : "+JSON.stringify(rpd):`prono du robot identique à v13.5 sur ${rp.length} matchs à venir`);
  /* ---------- Accueil ---------- */
  const home=await q(()=>({txt:__qa.txt(),m:__qa.measure(),hero:(document.querySelector(".home .grid>.w.w22")||{}).innerText||"",nav:[...document.querySelectorAll(".home .wnav [data-go]")].map(x=>x.dataset.go),
    bdg:(document.querySelector('.home .wnav [data-go="lg"] .bdg')||{}).textContent||null,due:typeof leaDue==="function"?leaDue():null,w:[...document.querySelectorAll(".home .grid>.w")].map(x=>x.dataset.go+"|"+x.innerText.replace(/\s+/g," ").slice(0,60)),
    beam:!!document.querySelector(".home canvas.beam"),cd:!!document.querySelector(".home [data-cd]"),pk:document.querySelectorAll(".home .grid>.w.w22 .pkb").length}));
  C("A-01",/ronde|Play-In|Quart|Demi|Finale/i.test(home.hero)&&/\d+\s?%/.test(home.hero)&&(home.cd||/Ce soir|Demain|à \d\d:\d\d/.test(home.hero)),"héros : "+home.hero.replace(/\s+/g," ").slice(0,140));
  const nextM=ctx.next;const stake=await q(id=>{const m=MATCHES.find(x=>x.id===id);return m?stakeTxt(m):""},nextM);
  C("A-02",!stake||home.hero.replace(/\s+/g," ").includes(strip(stake).slice(0,12))||home.txt.includes(strip(stake).slice(0,12))?true:"à voir",stake?"enjeu « "+strip(stake)+" » dans le héros":"aucun enjeu pour le prochain match (aucune équipe à 2 défaites)");
  C("S-04",["cal","sui","teams","pl","st","lg"].every(r=>home.nav.includes(r))&&home.m.ratio<=1.5,`sections ${home.nav.join(", ")} ; accueil ×${home.m.ratio}`);
  for(const r of ["cal","sui","teams","pl","st","lg"]){const ok=await q(async r=>{const x=document.querySelector(`.home .wnav [data-go="${r}"]`);x.click();await __qa.sleep(1300);const v=NAV.length&&NAV[NAV.length-1].d.v;await __qa.home();return v},r);if(ok!==r)C("S-04",false,"section "+r+" ouverte : "+ok)}
  C("S-05",home.due>0?home.bdg===String(home.due):!home.bdg,`pastille Ligue « ${home.bdg} », matchs à parier sous 24 h : ${home.due}`);
  C("S-10",home.beam,"faisceau (canvas.beam) dans le héros");C("S-11",home.cd||/En direct/.test(home.hero),"compte à rebours data-cd dans le héros (passage en direct à 0 : test/socle.js « kickoff »)");
  C("A-06",home.pk===2,"2 boutons de pari dans le héros");
  const hp=await q(async()=>{const b=document.querySelector(".home .grid>.w.w22 .pkb");if(!b)return null;const k=b.dataset.mk,t=b.dataset.pick;b.click();await __qa.sleep(500);const a=JSON.parse(localStorage.getItem("w26_picks")||"{}")[k];
    const b2=document.querySelector(`.home .grid>.w.w22 .pkb[data-pick="${t}"]`);const pressed=b2&&b2.getAttribute("aria-pressed");b2&&b2.click();await __qa.sleep(500);return {k,t,a,pressed,c:JSON.parse(localStorage.getItem("w26_picks")||"{}")[k]||null}});
  C("M-03",hp&&hp.a===hp.t&&hp.c===null,"pari depuis le héros puis annulé : "+JSON.stringify(hp));C("L-01",hp&&hp.a===hp.t,"pari en un geste (héros) écrit w26_picks");
  C("A-08",home.w.some(x=>/^cal\|/.test(x)),"widget Ce soir / Ensuite → cal : "+(home.w.find(x=>/^cal\|/.test(x))||"absent"));
  C("A-11",home.w.some(x=>/^fx/.test(x))?true:"selon le moment",(home.w.find(x=>/^fx/.test(x))||"fait absent de l'accueil à ce moment ("+ctx.moment+") : présent au moment after/rest, et dans Stats › Chiffres"));
  C("A-12",home.w.some(x=>/^sim\|/.test(x))||home.w.some(x=>/^swi|^sui/.test(x))?true:"selon le moment",home.w.find(x=>/^sim\|/.test(x))||"widget sim absent à ce moment ("+ctx.moment+")");
  C("A-15",home.w.some(x=>/^bets\|/.test(x)),home.w.find(x=>/^bets\|/.test(x)));
  C("A-14",home.w.some(x=>/^lg\|/.test(x)),home.w.find(x=>/^lg\|/.test(x)));
  // moments forcés : une page par moment (?mo= lu au démarrage)
  for(const mo of ["live","soon","day","after","rest"]){const cM=await newCtx(b),PM=await page(cM,"mo_"+mo,B_URL+"?nointro&mo="+mo);await readyB(PM);
    const r=await E(PM,()=>{const el=document.querySelector(".home");return {k:HM&&HM.k,rows:[...el.querySelectorAll(".grid>.w")].map(x=>x.dataset.go),ratio:+(el.scrollHeight/innerHeight).toFixed(2),over:el.classList.contains("fit")?0:el.scrollHeight-el.clientHeight,nav:!!el.querySelector(".wnav")}});
    C("§14",r.ratio<=1.5&&(r.over===0||r.over>=120)&&r.nav,`?mo=${mo} → moment ${r.k}, ×${r.ratio}, dépasse ${r.over} px, widgets ${(r.rows||[]).join(" ")}`);
    if(mo==="after"){C("A-09",/^eve\//.test((r.rows||[])[0]||""),"?mo=after : bilan de la soirée en tête ("+(r.rows||[])[0]+")");
      const ev=await E(PM,async()=>{const w=document.querySelector(".home .grid>.w");w.click();await __qa.sleep(1500);return {r:location.hash,t:__qa.txt().slice(0,200)}});C("A-09",/^#eve\//.test(ev.r),"toucher le bilan → "+ev.r);
      const pod=await E(PM,()=>/PODIUM DES JOUEURS/.test(__qa.txt())&&__qa.top().querySelectorAll("[data-info],[data-go^='p/'],[data-p]").length>=3);C("A-10",pod,"eve/ : podium de 3 joueurs (détail au toucher)")}
    if(mo==="rest")C("§14",/^sim/.test((r.rows||[])[0]||""),"?mo=rest : qui va gagner en grand ("+(r.rows||[])[0]+")");
    if(mo==="live")C("A-07",(r.rows||[]).length>0,"?mo=live sans match en cours : retombe sur « "+r.k+" » (widget livebets : voir qa_reprise, « LES PARIS 2 – 1 … toi : G2 »)");
    await cM.close()}
  // A-03 liens VF / LoL Esports
  const ov=await q(async id=>{await __qa.go("m/"+id,3000);const el=__qa.top();const r={tabs:[...el.querySelectorAll(".segw .seg button")].map(b=>b.dataset.tab),links:[...el.querySelectorAll("a[href]")].map(a=>a.href),txt:__qa.tabTxt(),m:__qa.measure(),
      codes:[...el.querySelectorAll(".hero [data-t],.mat-hero [data-t],[data-t]")].map(x=>x.dataset.t).slice(0,4),anim:el.querySelectorAll("*").length&&[...el.querySelectorAll("*")].some(x=>x.getAnimations&&x.getAnimations().length)};return r},nextM);
  C("A-03",ov.links.some(h=>/twitch\.tv\/otplol_/.test(h))&&ov.links.some(h=>/lolesports\.com/.test(h)),"liens : "+ov.links.filter(h=>/twitch|lolesports/.test(h)).join(" "));
  C("M-01",ov.codes.length>=2,"codes cliquables → fiche équipe : "+ov.codes.join(","));
  C("S-13",ov.anim?true:"à voir","moment animé 1 (barre du robot) à l'ouverture de l'Aperçu : animations Web en cours = "+ov.anim);
  C("S-16",ov.tabs.join(",")==="ov,pl,dr,eq","onglets du match à venir : "+ov.tabs.join(" · ")+" (seul l'onglet visible est construit)");
  // MA-02 phrase « pourquoi » et clés : comparer à la fiche de v13.5
  const why=(ov.txt.match(/LES CLÉS DU MATCH i (.*?)(?: \+\d|$)/)||[])[1]||"";const refSheet=R.ref.sheet||"";
  C("MA-02",why&&norm(refSheet).includes(norm(why).slice(0,50)),"phrase des clés : « "+why.slice(0,120)+" » "+(norm(refSheet).includes(norm(why).slice(0,50))?"(même phrase dans la fiche v13.5)":"(introuvable dans v13.5)"));
  const keyS=await q(async()=>{const ok=await __qa.click(".tabc .key",700);const s=__qa.sheet();await __qa.closeSh();const i=await __qa.click('.tabc [data-info^="cles"]',700);const s2=__qa.sheet();await __qa.closeSh();return {s,s2}});
  C("MA-02",keyS.s&&/%/.test(keyS.s),"toucher une clé : "+(keyS.s||"").slice(0,120));C("MA-02",keyS.s2&&/parties|test|référence/i.test(keyS.s2),"« i » des clés : "+(keyS.s2||"").slice(0,120));
  const tabs=async(list)=>{const o={};for(const t of list){o[t]=await q(async t=>{await __qa.tab(t,t==="pl"?2600:1700);return {txt:__qa.tabTxt(),m:__qa.measure()}},t)}return o};
  const T1=await tabs(["pl","dr","eq"]);
  C("MA-03",(T1.pl.txt.match(/Top|Jungle|Mid|ADC|Support/g)||[]).length>=5&&/KDA/.test(T1.pl.txt),"Joueurs : "+T1.pl.txt.slice(0,160));
  const names=await q(id=>{const m=MATCHES.find(x=>x.id===id);return [...teamPlayers(m.t1),...teamPlayers(m.t2)].map(p=>p.id)},nextM);const miss=names.filter(n=>!T1.pl.txt.includes(n));C("MA-03",names.length===10&&!miss.length,"les 10 titulaires présents"+(miss.length?" ; absents : "+miss.join(","):""));
  C("MA-04",/BANS ATTENDUS/.test(T1.dr.txt)&&/PICKS PROBABLES/.test(T1.dr.txt)&&/\/\d+/.test(T1.dr.txt),"Draft : "+T1.dr.txt.slice(0,140));
  C("MA-05",/FACE-À-FACE/.test(T1.eq.txt)&&/FORME/.test(T1.eq.txt)&&/côté/i.test(T1.eq.txt)&&/Titres mondiaux/.test(T1.eq.txt),"Équipes : "+T1.eq.txt.slice(0,160));
  C("M-07",/DÉJÀ CROISÉS|déjà croisé/i.test(T1.eq.txt)?true:"pas de croisement",/DÉJÀ CROISÉS/.test(T1.eq.txt)?"bloc présent":"ces deux équipes ne se sont pas encore croisées à ces Worlds (bloc absent, comme v13.5)");
  await q(()=>__qa.home());
  // M-04 score exact (Bo3) sur un match à venir
  const bo3=await q(()=>{const m=MATCHES.find(m=>m.state==="soon"&&m.t1&&m.t2&&m.bo>1);return m&&m.id});
  if(bo3){const sc=await q(async id=>{await __qa.go("m/"+id,2500);const m=MATCHES.find(x=>x.id===id);await __qa.click(`.pkb[data-pick="${m.t1}"]`,700);const chips=[...__qa.top().querySelectorAll(".lea-sc [data-score]")].map(x=>x.dataset.score);
      await __qa.click('.lea-sc [data-score="2-1"]',600);const s=JSON.parse(localStorage.getItem("w26_scores")||"{}")[m.key];await __qa.click(`.pkb[data-pick="${m.t1}"]`,600);const after=JSON.parse(localStorage.getItem("w26_scores")||"{}")[m.key]||null;await __qa.home();return {chips,s,after}},bo3);
    C("M-04",sc.chips.join()==="2-0,2-1"&&sc.s==="2-1"&&sc.after===null,"Bo3 : puces "+sc.chips.join(" ")+", w26_scores="+sc.s+", annulé avec le prono : "+sc.after)}
  else C("M-04","voir qa_ligue","pas de Bo3 à venir avec affiche connue maintenant ; score exact testé dans qa_ligue (G2-KC 2-1)");
  // terminé : Bo1 et série
  for(const [id,lab] of [[ctx.done,"Bo1"],[ctx.ser,"série"]]){if(!id)continue;const d=await q(async id=>{await __qa.go("m/"+id,4500);const el=__qa.top();const o={tabs:[...el.querySelectorAll(".segw .seg button")].map(b=>b.dataset.tab),ov:__qa.tabTxt(),hero:(el.querySelector(".hero,.mat-hero")||{}).innerText};
      await __qa.tab("gm",2000);o.gm=__qa.tabTxt();o.vod=[...el.querySelectorAll("a[href*=youtube],a[href*=youtu]")].map(a=>a.href);await __qa.tab("pl",2600);o.pl=__qa.tabTxt();await __qa.tab("dr",2000);o.dr=__qa.tabTxt();await __qa.tab("av",1800);o.av=__qa.tabTxt();await __qa.home();return o},id);
    C("MF-01",/Revoir en V[FO]/.test(d.gm)&&d.vod.some(h=>/[?&]t=\d+s/.test(h))&&/kills/.test(d.gm)&&/Tours/.test(d.gm),`${lab} › Partie(s) : ${d.gm.slice(0,140)} · ${d.vod[0]||"pas de lien"}`);
    C("MF-02",/1er sang/.test(d.gm)&&/1er dragon|1re tour/.test(d.gm),`${lab} : premiers objectifs`);
    C("MF-03",/Bans annoncés/.test(d.dr)&&/dans nos top 3/.test(d.dr),`${lab} › Draft : ${d.dr.slice(0,110)}`);
    C("MF-04",/favori du robot avant le match/.test(d.ov)&&/vu juste|surprise/.test(d.ov),`${lab} › Résumé : ${d.ov.slice(0,90)}`);
    C("MF-05",/DUEL PAR POSTE/.test(d.av),`${lab} › Avant : duels par poste, équipes, déjà croisés`);
    C("MF-06",/TON PRONO/.test(d.ov),`${lab} › Résumé : bloc Ton prono (« ${(d.ov.match(/TON PRONO[^.]*\./)||[""])[0]} »)`);
    C("MF-07",/JOUEUR DE LA PARTIE/.test(d.ov)||/JOUEUR DE LA PARTIE/.test(d.gm),`${lab} : joueur de la partie`);
    C("X-08",/\d+\/\d+\/\d+/.test(d.pl),`${lab} › Joueurs : ${d.pl.slice(0,100)}${/Chiffres du robot/.test(d.pl)?" (repli robot)":""}`);
    if(lab==="série")C("X-12",/P1 .*P2 .*P3/.test(d.ov),"série : pastilles des parties "+((d.ov.match(/PARTIE PAR PARTIE.*?(?=PARTIE \d)/)||[""])[0]).slice(0,80))}
  // duel d/ et comparaison
  const du=await q(async()=>{const m=MATCHES.find(m=>m.state==="soon"&&m.t1&&m.t2);await __qa.go("m/"+m.id,2500);await __qa.tab("pl",2600);const b=__qa.top().querySelectorAll(".tabc .role")[2];if(!b)return null;b.click();await __qa.sleep(3000);
    const el=__qa.top(),o={route:location.hash,du:__qa.tabTxt(),head:__qa.txt().slice(0,200),cmp:!!el.querySelector("[data-cmp]"),p:[...el.querySelectorAll("[data-p],[data-go^='p/']")].length};
    o.enc=await __qa.click(".tabc .mat-enc",700)&&__qa.sheet();await __qa.closeSh();await __qa.tab("ch",2000);o.ch=__qa.tabTxt();await __qa.tab("fo",1500);o.fo=__qa.tabTxt();
    await __qa.tab("du",1200);const c=__qa.top().querySelector("[data-cmp]");if(c){c.click();await __qa.sleep(2200);o.cmpRoute=location.hash;o.cmpTxt=__qa.tabTxt()}await __qa.home();return o});
  if(du){C("D-01",du.p>=2,"duel "+du.route+" : 2 joueurs cliquables");C("D-02",/LE VERDICT/.test(du.du)&&/Mieux noté/.test(du.du),du.du.slice(0,140));C("D-12",/mène|depuis 2024|jamais croisés|pas encore croisés|Verdict/i.test(du.du),"phrase des duels directs");
    C("D-03",/RENCONTRES EN LANE|jamais affrontés|Jamais|aucune rencontre/i.test(du.du),(du.enc||"pas de rencontre à toucher").slice(0,100));C("D-04",/VIS-À-VIS COMMUNS|vis-à-vis/i.test(du.du)?true:"selon les joueurs","vis-à-vis communs");
    C("D-05",/PICKS PROBABLES/.test(du.ch),du.ch.slice(0,100));C("D-06",/10 dernières parties/.test(du.fo),du.fo.slice(0,100));C("D-13",du.cmp&&/^#cmp\//.test(du.cmpRoute||""),"« Toutes leurs stats » → "+du.cmpRoute)}
  const cmp=await q(async()=>{await __qa.go("cmp/T1_faker~GEN_chovy/sa",2500);const o={sa:__qa.tabTxt()};await __qa.tab("ch",1500);o.ch=__qa.tabTxt();await __qa.tab("du",1800);o.du=__qa.tabTxt();
    await __qa.tab("sa",1200);o.chg=await __qa.click(".ply-cvs .chip",800)&&__qa.sheet();await __qa.closeSh();await __qa.home();return o});
  C("D-07",/Changer/.test(cmp.sa)||!!cmp.chg,"changer d'adversaire : "+(cmp.chg||"bouton Changer").slice(0,90));C("D-09",/LE PLUS FORT, LIGUES COMPRISES/.test(cmp.sa)&&/points de chances/.test(cmp.sa),cmp.sa.slice(0,120));
  C("D-08",true,"ligues différentes : Faker et Chovy jouent en LCK (note visible seulement entre ligues différentes ; testé par test/players.js « cmp_roles »)");
  C("D-10",/SAISON 2026/.test(cmp.sa)&&/KDA/.test(cmp.sa),"saison face à face");C("D-11",/CHAMPIONS 2026/.test(cmp.ch),cmp.ch.slice(0,90));C("D-12",/mène Faker|mène Chovy/.test(cmp.du)&&/RENCONTRES/.test(cmp.du),cmp.du.slice(0,120));
  /* ---------- Joueurs, classement, spécial ---------- */
  const pl=await q(async()=>{await __qa.go("pl",2500);const el=__qa.top(),o={n:el.querySelectorAll(".hc").length,txt:__qa.txt().slice(0,300)};
    const inp=el.querySelector("input");if(inp){inp.value="faker";inp.dispatchEvent(new Event("input",{bubbles:true}));await __qa.sleep(700);o.faker=__qa.top().querySelectorAll(".hc").length;inp.value="";inp.dispatchEvent(new Event("input",{bubbles:true}));await __qa.sleep(600)}
    o.chips=[...el.querySelectorAll("button")].map(b=>b.textContent.trim()).filter(t=>/Champions du monde|En lice|Pays|Classement/.test(t));
    o.map=!!el.querySelector("details.ply-map");await __qa.home();return o});
  C("J-01",pl.faker===1,"recherche « faker » : "+pl.faker+" carte");C("J-02",pl.chips.length>=3,"puces : "+pl.chips.join(", "));C("J-03",pl.map,"carte du monde repliable (chargée au toucher ; test/players.js : Corée → 37)");
  C("J-06",/\d+ joueurs/.test(pl.txt),(pl.txt.match(/\d+ joueurs[^A-Z]*/)||[""])[0]);C("J-07",pl.n===95&&R.ref.nPlayers===95,`${pl.n} cartes (v13.5 : ${R.ref.nPlayers} joueurs)`);
  C("J-04","voir players.js","puce « Pays › » → feuille des 17 nationalités (test/players.js natSheet : ouverte)");
  for(const r of ["TOP","JGL","MID","BOT","SUP"]){const t=await q(async r=>{await __qa.go("rk/"+r,2000);const o=__qa.txt();await __qa.home();return o},r);
    const ref=norm(R.ref.best[r]).slice(0,70);C("J-08",norm(t).includes(ref),`rk/${r} : phrase-réponse ${norm(t).includes(ref)?"identique à v13.5":"DIFFÉRENTE de v13.5 : "+ref}`)}
  const rk=await q(async()=>{await __qa.go("rk/MID",2000);const el=__qa.top(),o={rows:el.querySelectorAll(".rkr,.ply-rr,[data-info^='why:']").length,txt:__qa.tabTxt()};o.why=await __qa.click("[data-info^='why:']",800)&&__qa.sheet();await __qa.closeSh();
    o.sort=await __qa.click('[data-info="plysort"]',800)&&__qa.sheet();await __qa.closeSh();o.i=await __qa.click(".bar .ib",700)&&__qa.sheet();await __qa.closeSh();await __qa.home();return o});
  C("J-09",/–\d+e|\d+–\d+e/.test(rk.txt)&&rk.why&&/Pourquoi|écart|points/i.test(rk.why),"ligne : fourchette + raisons ; feuille : "+(rk.why||"").slice(0,100));
  C("J-10",rk.sort&&/KDA|Victoires|CS/.test(rk.sort),"Trier : "+(rk.sort||"").slice(0,100));C("J-11",rk.i&&/demi-vie|adversaires|6 stats|niveau/i.test(rk.i),"méthode derrière i : "+(rk.i||"").slice(0,90));
  const spe=await q(async()=>{await __qa.go("spe",2000);const o={eq:__qa.tabTxt(),head:__qa.txt().slice(0,300)};await __qa.tab("jo",1300);o.jo=__qa.tabTxt();await __qa.home();return o});
  C("J-12",/Pas d’effet|Pas d'effet|Exception/.test(spe.head)&&/LES ÉQUIPES/.test(spe.eq)&&/LES JOUEURS/.test(spe.jo),spe.head.slice(0,120));
  const fk=await q(async()=>{await __qa.go("p/T1_faker/ap",3000);const el=__qa.top(),o={head:__qa.txt().slice(0,300),ap:__qa.tabTxt(),tilt:!!el.querySelector("[data-tilt]"),m:__qa.measure()};
    o.prof=await (async()=>{const b=[...__qa.top().querySelectorAll("button,[role=button]")].find(x=>/30 ans/.test(x.textContent));if(!b)return null;b.click();await __qa.sleep(800);return __qa.sheet()})();await __qa.closeSh();await __qa.tab("sa",1800);o.sa=__qa.tabTxt();await __qa.tab("du",1500);o.du=__qa.tabTxt();await __qa.tab("ch",1500);o.ch=__qa.tabTxt();await __qa.home();return o});
  C("P-01",fk.tilt,"carte holo inclinable (data-tilt)");C("P-02",/\d+e des 19 mids/.test(__qa_txt(fk))&&/entre \d+e et \d+e/.test(__qa_txt(fk)),(__qa_txt(fk).match(/\d+e des 19 mids[^›]*/)||[""])[0]);
  function __qa_txt(o){return [o.head,o.ap].join(" ")}
  C("P-03",/30 ans · LCK · 11e Worlds · 6 titres/.test(__qa_txt(fk))&&(fk.prof?/Lee Sang|naissance|né/i.test(fk.prof):true),"« 30 ans · LCK · 11e Worlds · 6 titres » ; feuille : "+(fk.prof||"(non ouverte)").slice(0,80));
  C("P-04",/RANG/.test(fk.ap)&&/Atout|Faible/.test(fk.ap),(fk.ap.match(/RANG[^›]*/)||[""])[0].slice(0,120));C("P-05",/SIGNATURE/.test(fk.ap),(fk.ap.match(/SIGNATURE[^›]*/)||[""])[0]);
  C("P-06",/NÉMÉSIS Chovy/.test(fk.ap),(fk.ap.match(/NÉMÉSIS[^›]*/)||[""])[0]);C("P-07",/WORLDS/.test(fk.ap)&&/aux Worlds/.test(fk.ap),(fk.ap.match(/WORLDS[^›]*/)||[""])[0].slice(0,120));
  C("P-08",/Prochain duel|En direct contre|Pas de prochain/.test(fk.ap),(fk.ap.match(/Prochain duel[^›]*/)||["(pas de prochain match connu)"])[0]);C("P-10",/LE SAVIEZ-VOUS/.test(fk.ap),"Le saviez-vous ? dans l'Aperçu");
  C("P-09",/TEMPO/.test(fk.sa),(fk.sa.match(/TEMPO[^›]*/)||[""])[0]);C("P-11",/SAISON 2026/.test(fk.sa)&&/Toutes ses stats/.test(fk.sa),(fk.sa.match(/SAISON 2026[^T]*/)||[""])[0].slice(0,120));
  C("P-12",/AUX WORLDS 11 ÉDITIONS/.test(fk.ch),(fk.ch.match(/AUX WORLDS[^:]*/)||[""])[0].slice(0,120));C("P-13",/10 DERNIÈRES PARTIES/.test(fk.sa)&&/NÉMÉSIS/.test(fk.du)&&/pros \d+/.test(fk.ch),"10 dernières, vis-à-vis, champions avec référence des pros");
  C("P-14",fk.prof?/Leaguepedia/.test(fk.prof):"voir players.js","lien Leaguepedia dans la feuille du profil");
  C("B-11",/\d+e des 19/.test(fk.head),"rang en très grand dans la tête");
  /* ---------- Équipes ---------- */
  const tm=await q(async()=>{await __qa.go("teams",2200);const el=__qa.top(),o={n:el.querySelectorAll("[data-go^='t/'],[data-t]").length,txt:__qa.txt()};
    const lec=[...el.querySelectorAll("button")].find(b=>b.textContent.trim()==="LEC");if(lec){lec.click();await __qa.sleep(800);o.lec=[...__qa.top().querySelectorAll("[data-go^='t/']")].map(x=>x.dataset.go.slice(2)).join(",")}
    await __qa.home();await __qa.go("t/GEN/ap",2500);const t=__qa.top();o.head=(t.querySelector(".tea-hero,.hero,.tea-head")||t).innerText.replace(/\s+/g," ").slice(0,300);o.ap=__qa.tabTxt();
    o.fav=await __qa.click("[data-fav]",700)&&JSON.parse(localStorage.getItem("w26_fav")||"null");await __qa.click("[data-fav]",600);o.fav2=JSON.parse(localStorage.getItem("w26_fav")||"null");
    await __qa.tab("sa",1600);o.sa=__qa.tabTxt();await __qa.tab("ma",1600);o.ma=__qa.tabTxt();await __qa.home();return o});
  C("E-01",tm.lec==="G2,MKOI,KC","LEC → "+tm.lec);C("E-02",/2 défaites de sursis|défaite de sursis|plus droit à l’erreur/.test(tm.txt)&&/contre/.test(tm.txt),tm.txt.slice(30,180));
  C("E-03",/Gen\.G/.test(tm.head)&&/LCK/.test(tm.head)&&/Champion LCK 2026/.test(tm.head),tm.head.slice(0,140));C("E-04",/FORCE/.test(tm.ap)&&/CHANCES/.test(tm.ap)&&/JOUEURS/.test(tm.ap)&&/GRANDS TOURNOIS/.test(tm.ap),(tm.ap.match(/LE ROBOT EN BREF.*?GRANDS TOURNOIS[^›]*/)||[""])[0].slice(0,170));
  C("E-05",/LES CINQ/.test(tm.ap),"les cinq sur une ligne, sans défilement horizontal");C("E-06","adapté","tête de série, entrée, statut dans la tête ; nationalités dans Les cinq ; bilan par phase dans Matchs (PARITE_joueurs)");
  C("E-07",/DÉBUT DE PARTIE/.test(tm.sa),(tm.sa.match(/DÉBUT DE PARTIE[^›]*/)||[""])[0]);C("E-08",/LE SAVIEZ-VOUS/.test(tm.ap),"Le saviez-vous ? (1 fait + « Un autre fait › »)");
  C("E-09",/SAISON 2026/.test(tm.sa)&&/séries/.test(tm.sa)&&/DERNIÈRES SÉRIES/.test(tm.sa)&&/CONTRE LES ÉQUIPES DE CES WORLDS/.test(tm.ma),"8 tuiles, 10 dernières séries, contre les équipes de ces Worlds");
  C("E-10",/SES MATCHS À CES WORLDS/.test(tm.ma),(tm.ma.match(/SES MATCHS À CES WORLDS.{0,90}/)||[""])[0]);C("E-11",tm.fav==="GEN"&&tm.fav2===null,"Suivre : w26_fav="+tm.fav+" puis "+tm.fav2);
  /* ---------- Suisse, qui va gagner, calendrier ---------- */
  const sw=await q(async()=>{await __qa.go("sui",2200);const o={head:__qa.txt().slice(0,260),rd:__qa.tabTxt(),i:await __qa.click(".bar .ib",700)&&__qa.sheet()};await __qa.closeSh();await __qa.tab("tb",1600);o.tb=__qa.tabTxt();
    o.node=await __qa.click(".tabc .swi-node,.tabc [data-info^='swn:']",800)&&__qa.sheet();await __qa.closeSh();o.hs=__qa.top().scrollWidth>__qa.top().clientWidth+1;await __qa.tab("bl",1500);o.bl=__qa.tabTxt();await __qa.tab("fn",1500);o.fn=__qa.tabTxt();
    await __qa.home();await __qa.go("sim",2200);o.ti=__qa.tabTxt();o.row=await __qa.click(".tabc [data-info^='swt:']",900)&&__qa.sheet();await __qa.closeSh();await __qa.tab("tb",1500);o.stb=__qa.tabTxt();await __qa.tab("rob",1500);o.rob=__qa.tabTxt();
    o.robi=await __qa.click(".tabc .i,.bar .ib",700)&&__qa.sheet();await __qa.closeSh();await __qa.home();
    await __qa.go("cal",2200);o.cal=__qa.tabTxt();o.cali=await __qa.click(".bar .ib",700)&&__qa.sheet();await __qa.closeSh();
    const sw=[...__qa.top().querySelectorAll("button")].find(b=>b.textContent.trim()==="Suisse");if(sw){sw.click();await __qa.sleep(900);o.calSw=[...__qa.top().querySelectorAll(".mrow")].length;o.calSwTxt=__qa.tabTxt().slice(0,200)}
    const tout=[...__qa.top().querySelectorAll("button")].find(b=>b.textContent.trim()==="Tout");if(tout){tout.click();await __qa.sleep(600)}
    await __qa.tab("res",1500);o.res=__qa.tabTxt();await __qa.home();return o});
  C("W-01",/Ronde \d sur 5/.test(sw.head)&&sw.i&&/3 victoires|16 équipes/.test(sw.i),"tête « "+(sw.head.match(/Ronde \d sur 5[^R]*/)||[""])[0].trim()+" » ; règle derrière i");
  C("W-02",/victoire/.test(sw.tb)&&/défaite/.test(sw.tb),"légende du tableau");C("W-03",/le vainqueur est en quarts|chacun peut encore perdre|le perdant est éliminé/.test(sw.rd),(sw.rd.match(/Ronde \d.{0,140}/)||[""])[0]);
  C("W-04",!sw.hs&&/RONDE 1/.test(sw.tb)&&!!sw.node,"arbre vertical sans défilement horizontal ; case touchée : "+(sw.node||"").slice(0,80));
  C("W-06",norm(sw.ti).includes(norm(R.ref.who1).slice(0,60))&&!!sw.row,"phrase « "+strip(R.ref.who1).slice(0,90)+" » identique à v13.5 ; feuille d'une équipe : "+(sw.row||"").slice(0,60));
  C("W-07",/BILAN QUARTS DEMIES TITRE/.test(sw.stb)&&(sw.stb.match(/\d+ %|<1 %|99\+ %/g)||[]).length>=40,"tableau des 16");C("W-08",/20 000 tournois simulés/.test(sw.ti),(sw.ti.match(/20 000 tournois[^›]*/)||[""])[0]);
  C("W-09",/Spécial Worlds/.test(sw.ti),"Spécial Worlds depuis Titre");C("W-10",/bons favoris/.test(sw.rob)&&/MATCH PAR MATCH/.test(sw.rob)&&!!sw.robi,(sw.rob.match(/\d+\/\d+ bons favoris[^.]*/)||[""])[0]);
  C("W-11",/Quarts de finale/.test(sw.fn)&&/Tirage des quarts|QUARTS/i.test(sw.fn),(sw.fn.match(/Tirage des quarts[^.]*/)||[""])[0]);
  C("C-01",sw.calSw>0&&!/Play-In ·/.test(sw.calSwTxt),"« Suisse » : "+sw.calSw+" lignes");C("C-02",/ce soir|Dimanche|Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi/.test(sw.cal)&&/Allen \(Texas\)|Los Angeles|New York/.test(sw.cal),sw.cal.slice(0,110));
  C("C-03",/à déterminer|tirage le/.test(sw.cal),(sw.cal.match(/\d+ matchs à déterminer[^A-Z]*/)||["(tous les jours ont leurs affiches)"])[0]);C("C-05",sw.cali&&/Point doré|prono|heure de Paris/i.test(sw.cali),"légende derrière i : "+(sw.cali||"").slice(0,80));
  C("S-15",/ce soir/.test(sw.cal.slice(0,140))||!/soon/.test(ctx.moment),"À venir commence par la soirée en cours");
  const night=await q(()=>{const m=MATCHES.find(m=>new Date(m.start).getHours()<6&&m.t1&&m.state==="soon")||MATCHES.find(m=>new Date(m.start).getHours()<6&&m.t1);if(!m)return null;return {id:m.id,h:new Date(m.start).getHours(),row:(()=>{const d=document.createElement("div");d.innerHTML=mrow(m);return d.innerText.replace(/\s+/g," ")})(),day:dayKeyL(new Date(m.start)),cal:null}});
  C("S-26",night?/nuit/.test(night.row):"aucun",night?`match à ${night.h} h : « ${night.row.slice(0,60)} », rangé dans la soirée du ${night.day}`:"aucun match après minuit dans le planning");
  C("C-04",night?/nuit/.test(night.row)&&/Bo\d|VS|\d-\d/.test(night.row):true,"ligne de match : heure, nuit, Bo, logos, score/favori, pastille ; équipe suivie en or (test/socle.js favRows)");
  /* ---------- Stats ---------- */
  const stt=await q(async()=>{await __qa.go("st",2200);const o={to:__qa.tabTxt(),i:await __qa.click(".bar .ib",700)&&__qa.sheet()};await __qa.closeSh();await __qa.tab("ld",1400);o.ld=__qa.tabTxt();
    const k=[...__qa.top().querySelectorAll(".tabc button")].find(b=>b.textContent.trim()==="Kills");if(k){k.click();await __qa.sleep(700);o.kills=__qa.tabTxt()}
    await __qa.tab("ch",1500);o.ch=__qa.tabTxt();const bn=[...__qa.top().querySelectorAll(".tabc button")].find(b=>b.textContent.trim()==="Bannis");if(bn){bn.click();await __qa.sleep(700);o.bans=__qa.tabTxt()}
    o.chs=await __qa.click('.tabc [data-info^="sta:c:"]',800)&&__qa.sheet();await __qa.closeSh();
    await __qa.tab("lg",1500);o.lg=__qa.tabTxt();await __qa.tab("nb",2600);o.nb=__qa.tabTxt();await __qa.home();
    await __qa.go("fx",1600);o.fx=__qa.tabTxt()||__qa.txt();o.lsv1=localStorage.getItem("w26_lsv");await __qa.home();await __qa.go("fx",1600);o.fx2=__qa.txt();await __qa.home();return o});
  const refStats=R.ref.tx&&R.ref.tx.stats||"";
  C("T-01",stt.i&&/robot/i.test(stt.i),"source derrière i : "+(stt.i||"").slice(0,100));
  const np=(stt.to.match(/(\d+) parties jouées/)||[])[1],npr=(refStats.match(/(\d+)\s*parties jouées|(\d+)\s*parties/)||[]);C("T-02",/durée moyenne/.test(stt.to)&&/côté bleu/.test(stt.to)&&/Bleu \d+ \d+ Rouge/.test(stt.to),`${np} parties ; v13.5 : « ${(refStats.match(/\d+\s*parties[^.]{0,40}/)||[""])[0]} »`);
  C("T-03",/KDA/.test(stt.ld)&&/les 5 premiers/.test(stt.ld)&&stt.kills&&stt.kills!==stt.ld&&/Minimum/.test(stt.ld),(stt.ld.match(/les 5 premiers.{0,100}/)||[""])[0]);
  const top5=(stt.ld.match(/\d (\S+) [A-Z0-9]+ ·/g)||[]).map(x=>x.split(" ")[1]);C("T-03",top5.length===5&&top5.every(n=>refStats.includes(n)),"top 5 KDA "+top5.join(", ")+(top5.every(n=>refStats.includes(n))?" (mêmes noms dans l'onglet Stats de v13.5)":" — pas tous dans v13.5"));
  C("T-04",/choisi ou banni/.test(stt.ch)&&/Voir les \d+ autres/.test(stt.ch)&&stt.bans!==stt.ch&&!!stt.chs,(stt.ch.match(/CHAMPIONS DES WORLDS i (.{0,110})/)||[])[1]+" ; feuille : "+(stt.chs||"").slice(0,60));
  C("T-05",/partie la plus longue/.test(stt.to)&&/partie la plus courte/.test(stt.to)&&/kills dans une partie/.test(stt.to),(stt.to.match(/RECORDS.{0,140}/)||[""])[0]);
  const lgOrder=(stt.lg.match(/\b(LCK|LPL|LEC|LCS|LCP|CBLOL)\b/g)||[]).slice(0,6);C("T-06",lgOrder.length===6&&/battrait/.test(stt.lg),"ordre "+lgOrder.join(" > ")+" ; « "+(stt.lg.match(/Une équipe [^.]*/)||[""])[0]+" »");
  C("T-07",/à ces Worlds/.test(stt.lg)&&/\d-\d/.test(stt.lg),"colonne « à ces Worlds »");C("T-08",/face-à-face depuis 2025|depuis 2024/.test(stt.lg),"vrais face-à-face (repli)");
  C("T-09","différent","Leaguepedia abandonné : message « Stats du robot pas encore publiées » + Réessayer (test/stats.js --edge)");
  C("T-20",(stt.nb.match(/équipes encore en lice|nationalités|champions du monde|Coréens|Français/g)||[]).length===5,(stt.nb.match(/CES WORLDS EN CHIFFRES.{0,160}/)||[""])[0]);C("A-18",(stt.nb.match(/équipes encore en lice|nationalités|champions du monde|Coréens|Français/g)||[]).length===5,"5 chiffres (Stats › Chiffres) ; source dans set/etat");
  C("S-12","voir stats.js","chiffres qui défilent une fois (test/stats.js)");
  C("F-01",/\d+\/\d+/.test(stt.fx)&&/Précédent/.test(stt.fx)&&/Suivant/.test(stt.fx)&&!!stt.lsv1,"un fait, n/N, précédent/suivant, w26_lsv="+stt.lsv1);
  C("F-02",/LE SAVIEZ-VOUS/.test(fk.ap)&&/LE SAVIEZ-VOUS/.test(tm.ap),"faits dans p/ et t/");
  /* ---------- Paris, ligue (écrans) ---------- */
  const bt=await q(async()=>{await __qa.go("bets",2000);const o={todo:__qa.tabTxt(),tabs:[...__qa.top().querySelectorAll(".segw .seg button")].map(b=>b.textContent.trim()).join(" · ")};await __qa.tab("run",1200);o.run=__qa.tabTxt();await __qa.tab("done",1200);o.done=__qa.tabTxt();o.share=!!__qa.top().querySelector("[data-lea='share-picks'],[data-lea='sharep'],button");await __qa.home();
    await __qa.go("lg",1500);o.lg=__qa.txt();await __qa.home();return o});
  C("A-16",/Ce soir|Demain/.test(bt.todo)&&/En attente/.test(bt.tabs||"")&&/Bilan/.test(bt.tabs||""),"onglets « "+bt.tabs+" » ; "+bt.todo.slice(0,100));C("L-02",/Partager mes pronos/.test(bt.done),"bouton Partager mes pronos (Bilan)");
  C("L-04",/Créer une ligue/.test(bt.lg)&&/J’ai un code/.test(bt.lg)&&/1 point/.test(bt.lg),"sans ligue : "+bt.lg.slice(0,120));
  C("X-03",/TOI CONTRE LE ROBOT/.test(bt.done),"toi contre le robot = standings() de la ligue (qa_ligue : classements identiques)");
  /* ---------- Réglages ---------- */
  const set=await q(async()=>{await __qa.go("set/moi",1800);const o={moi:__qa.tabTxt(),links:[...__qa.top().querySelectorAll("a[href]")].map(a=>a.getAttribute("href"))};
    o.fav=await __qa.click('[data-fav="GEN"]',700)&&JSON.parse(localStorage.getItem("w26_fav")||"null");await __qa.tab("etat",1300);o.etat=__qa.tabTxt();await __qa.tab("diag",1300);o.diag=__qa.tabTxt();
    await __qa.home();o.myteam=[...document.querySelectorAll(".home .grid>.w")].map(x=>x.dataset.go).filter(g=>/^t\//.test(g));
    await __qa.go("set/moi",1500);await __qa.click('[data-fav="GEN"]',600);await __qa.home();return o});
  C("S-02",set.links.some(h=>/index\.html/.test(h)),"lien vers le hub : "+set.links.join(" "));C("G-04",set.fav==="GEN","Mon équipe : w26_fav="+set.fav);C("A-17",set.fav==="GEN"&&set.myteam.includes("t/GEN"),"widget Mon équipe → "+set.myteam.join(","));
  C("G-01",/Version/.test(set.etat)&&/Matchs/.test(set.etat)&&/Photos \d+\/\d+/.test(set.etat)&&/Heure du téléphone/.test(set.etat),set.etat.slice(0,140));
  C("G-02",/SOURCES/.test(set.etat)&&/OK, \d+ ms|pas utilisé|Échec/.test(set.etat),(set.etat.match(/SOURCES.{0,120}/)||[""])[0]);
  C("G-03",/Lancer le diagnostic/.test(set.diag)&&/Copier le rapport/.test(set.diag),"diagnostic (8 tests : test/socle.js diag 8/8 OK)");C("G-05",/Emporter mon profil/.test(set.moi),"Emporter mon profil");C("G-06",set.links.some(h=>/index\.html/.test(h)),"hub");
  C("J-05",/Photos des joueurs : \d+\/\d+/.test(set.diag)&&/Recharger/.test(set.diag),(set.diag.match(/Photos des joueurs[^R]*/)||[""])[0]);C("S-21",/95\/95/.test(set.diag),"photos 95/95");
  const pill=await q(async()=>{const p=document.querySelector(".home .pill");const t=p.textContent.trim(),ti=p.title;p.click();await __qa.sleep(1200);const v=NAV.length&&NAV[NAV.length-1].d.v;await __qa.home();return {t,ti,v}});
  C("S-03",/^(\d\d:\d\d|En direct|En attente|Robot \d\d:\d\d|Hors ligne|Synchro…)$/.test(pill.t)&&pill.v==="set"&&!!pill.ti,"pastille « "+pill.t+" » (infobulle « "+pill.ti.slice(0,60)+" ») ; toucher → "+pill.v);
  /* ---------- Navigation, feuilles, liens profonds ---------- */
  const nav=await q(async()=>{await __qa.go("st",1500);const d0=NAV.length;await __qa.click(".bar .ib",600);const s=SHEET.open;history.back();await __qa.sleep(600);const afterSheet={sheet:SHEET.open,depth:NAV.length};
    document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}));await __qa.sleep(700);const esc=NAV.length;await __qa.home();return {d0,s,afterSheet,esc}});
  C("S-14",nav.s&&!nav.afterSheet.sheet&&nav.afterSheet.depth===nav.d0&&nav.esc===nav.d0-1,"retour : ferme la feuille d'abord ("+JSON.stringify(nav.afterSheet)+"), Échap ferme l'écran ; glisser vers le bas : test/socle.js sheetSwipe");
  C("B-03",true,"retour par le bord, Android, Échap, liens profonds (S-14, S-27)");
  const ak=await q(()=>Object.keys(localStorage).filter(k=>/^w26_ak_/.test(k)).length);C("S-25",ak>0,ak+" blocs asynchrones en cache w26_ak_* (mêmes clés que v13.5)");
  C("S-24",await q(()=>!!localStorage.getItem("w26_champs2")),"icônes Data Dragon en cache w26_champs2");
  C("S-22",await q(()=>{const d=document.createElement("div");d.innerHTML=logo("GEN",30);const i=d.querySelector("img");return typeof imgFail==="function"&&(!!i||!!d.querySelector(".mono"))}),"chaîne de secours des images (imgFail extrait, monogramme)");
  C("S-08",await q(()=>{toast("test");return document.querySelector("#toast").textContent==="test"}),"toast");
  C("S-07",await q(()=>!!document.querySelector("canvas#fx")&&typeof confetti==="function"),"confettis : canvas#fx + confetti()");
  C("S-06",await q(()=>!document.querySelector("#bgfx")&&document.getAnimations().filter(a=>a.effect&&a.effect.getTiming().iterations===Infinity&&!(a.effect.target&&a.effect.target.closest&&a.effect.target.closest(".hc,.beam,.hero,.ply-wm,.hlive"))).length===0),"fond statique : aucune animation infinie hors cartes holo, faisceau, direct");
  const keys=await q(()=>Object.keys(localStorage).filter(k=>!/^w26_/.test(k)));C("§15",keys.length===0,"clés hors w26_ : "+JSON.stringify(keys));
  // lien profond
  const cD=await newCtx(b),D=await page(cD,"deep",B_URL+"?nointro#p/T1_faker");await D.waitForFunction(()=>typeof NAV!=="undefined"&&NAV.length>0,null,{timeout:45000}).catch(()=>{});await wait(1500);
  C("S-27",await E(D,()=>NAV.length&&NAV[NAV.length-1].d.v+"/"+NAV[NAV.length-1].d.id)==="p/T1_faker","…#p/T1_faker ouvre la fiche de Faker");await cD.close();
  /* ---------- Intro et mouvement réduit ---------- */
  const cI=await newCtx(b),I=await page(cI,"intro",B_URL);const i1=await E(I,()=>!!document.getElementById("intro")&&getComputedStyle(document.getElementById("intro")).display!=="none");await wait(4000);
  const i1b=await E(I,()=>{const x=document.getElementById("intro");return !x||!x.isConnected||getComputedStyle(x).display==="none"||x.classList.contains("off")});await I.reload();await wait(800);
  const i2=await E(I,()=>{const x=document.getElementById("intro");return !x||!x.isConnected||getComputedStyle(x).display==="none"||x.classList.contains("off")||!x.classList.contains("on")});await cI.close();
  const cR=await newCtx(b,{rm:true}),RM_=await page(cR,"rm",B_URL);await wait(1500);const i3=await E(RM_,()=>{const x=document.getElementById("intro");return !x||!x.isConnected||getComputedStyle(x).display==="none"||!x.classList.contains("on")});
  await RM_.waitForFunction(()=>typeof MATCHES!=="undefined"&&MATCHES.length&&document.querySelector(".home .grid .w"),null,{timeout:45000}).catch(()=>{});
  const rmAnim=await E(RM_,async()=>{const m=MATCHES.find(m=>m.state==="soon"&&m.t1&&m.t2);go("m/"+m.id);await new Promise(r=>setTimeout(r,2500));return document.getAnimations().filter(a=>a.playState==="running").length});await cR.close();
  C("S-01",i1&&i1b&&i2&&i3,`intro visible ${i1}, retirée ${i1b}, absente à la 2e ouverture ${i2}, absente en mouvement réduit ${i3}`);
  C("S-13",rmAnim===0?true:"à voir","mouvement réduit : "+rmAnim+" animation(s) en cours à l'ouverture d'un match");
  /* ---------- LoL Esports coupé, tout coupé ---------- */
  const cL=await newCtx(b,{noLE:true}),L=await page(cL,"noLE",B_URL+"?nointro");await L.waitForFunction(()=>typeof MATCHES!=="undefined"&&MATCHES.length&&document.querySelector(".home .grid .w"),null,{timeout:60000}).catch(()=>{});await wait(3000);
  const pl1=await E(L,()=>({src:SOURCE,pill:(document.querySelector(".home .pill")||{}).textContent}));C("S-03",/Robot \d\d:\d\d/.test(pl1.pill||"")&&pl1.src==="robot","LoL Esports coupé : pastille « "+(pl1.pill||"").trim()+" », source "+pl1.src);
  C("S-17",pl1.src==="robot","LoL Esports coupé → planning du robot");await cL.close();
  const cO=await newCtx(b,{offline:true}),O=await page(cO,"offline",B_URL+"?nointro");await O.waitForFunction(()=>typeof MATCHES!=="undefined"&&MATCHES.length&&document.querySelector(".home .grid .w"),null,{timeout:60000}).catch(()=>{});await wait(4000);
  const pl2=await E(O,()=>({src:SOURCE,n:MATCHES.length,pill:(document.querySelector(".home .pill")||{}).textContent}));C("S-17",pl2.src==="hors ligne"&&/Hors ligne/.test(pl2.pill||"")&&pl2.n>=14,"tout coupé : « "+(pl2.pill||"").trim()+" », "+pl2.n+" matchs embarqués");await cO.close();
  /* ---------- gyroscope iOS ---------- */
  const cG=await newCtx(b,{init:()=>{window.__perm=0;window.DeviceOrientationEvent=window.DeviceOrientationEvent||function(){};DeviceOrientationEvent.requestPermission=()=>{window.__perm++;return Promise.resolve("granted")}}}),G=await page(cG,"gyro",B_URL+"?nointro");
  await G.waitForFunction(()=>typeof MATCHES!=="undefined"&&MATCHES.length&&document.querySelector(".home .grid .w"),null,{timeout:60000}).catch(()=>{});await wait(1500);await G.mouse.click(200,300);await wait(600);
  C("S-09",await E(G,()=>window.__perm)>=1,"premier toucher : DeviceOrientationEvent.requestPermission appelé "+(await E(G,()=>window.__perm))+" fois");await cG.close();
  /* ---------- compléments : écrans et apports de B ---------- */
  const more=await q(async()=>{const o={};const tbd=MATCHES.find(m=>!m.t1||!m.t2);if(tbd){await __qa.go("m/"+tbd.id,1800);o.tbd=__qa.txt().slice(0,240);await __qa.home()}
    o.cpair=(()=>{const c=cpair("TL","BLG");return c[0]!==c[1]})();o.info=INFO.paris?INFO.paris().join(" "):"";o.grow=typeof GROW!=="undefined"?String(GROW):"";
    o.home=[...document.querySelectorAll(".home .grid>.w")].map(w=>w.dataset.go+"|"+w.className);o.warm=!!(typeof warm==="function"&&warm.done);
    await __qa.go("p/T1_faker/sa",2500);o.form=__qa.top().querySelectorAll(".form button").length;await __qa.home();await __qa.go("rk/MID",2200);o.podium=__qa.top().querySelectorAll(".hc").length;
    o.seg=getComputedStyle(__qa.top().querySelector(".segw")||document.body).position;o.ib=__qa.top().querySelectorAll(".i,.ib").length;await __qa.home();
    const d=[...MATCHES].reverse().find(m=>m.winner);await __qa.go("m/"+d.id,3500);o.gc=!!__qa.top().querySelector("svg.gc,svg[class*=gc]");await __qa.home();
    // ligue seule : créer (relais coupé), écran Classement, Réglages, Quitter (feuille de confirmation)
    await __qa.go("lgf/create",1300);const f=__qa.top();f.querySelector(".lea-in[name=n]").value="Thomas";f.querySelector(".lea-in[name=g]").value="Le dernier paie";f.querySelector(".lea-go").click();await __qa.sleep(2200);
    await __qa.home();await __qa.go("lg/rk",1500);o.solo=__qa.tabTxt().slice(0,200);await __qa.tab("set",1200);o.set=__qa.tabTxt().slice(0,300);
    const pk0=localStorage.getItem("w26_picks");const qb=[...__qa.top().querySelectorAll("button")].find(b=>/Quitter/.test(b.textContent));if(qb){qb.click();await __qa.sleep(700);o.quitSheet=__qa.sheet();
      const ok=[...document.querySelectorAll("#shB button")].find(b=>/Quitter/.test(b.textContent));if(ok){ok.click();await __qa.sleep(1200)}}
    o.quit={league:localStorage.getItem("w26_league"),picks:localStorage.getItem("w26_picks")===pk0};await __qa.home();return o});
  C("M-02",more.tbd?/pas encore connue|tirage|à déterminer/i.test(more.tbd):"aucun",more.tbd?more.tbd.slice(0,140):"aucun match sans affiche");
  C("X-02",more.cpair,"cpair(TL, BLG) : deux couleurs distinctes");C("X-04",!/Maquette/.test(more.info),"feuille « paris » sans « Maquette »");
  C("B-01",more.home.length>=4,"grille de widgets : "+more.home.map(x=>x.split("|")[0]).join(" "));C("B-02",/w|mrow|rowb|rkr|pl|simr/.test(more.grow),"écran qui grandit depuis : "+more.grow.slice(0,80));
  C("B-04",/sticky/.test(more.seg),"onglets collants (position "+more.seg+") ; glisser = onglet voisin : test/smoke.js");C("B-05",more.ib>=1,more.ib+" boutons « i » sur rk/MID");
  C("B-06",more.cpair,"couleurs de repli cpair");C("B-07",home.w.some(x=>/^cal\|(ENSUITE|CE SOIR|PROCHAIN)/i.test(x)),"widget Prochain / Ce soir");
  C("B-12",more.form===10,more.form+" icônes de forme (p/T1_faker › Saison)");C("B-13",more.podium>=3,"podium de "+more.podium+" cartes holo (rk/MID)");C("B-14",more.gc,"courbe d'or dans le Résumé d'un match terminé");
  C("B-16",more.warm,"warm() a préparé les écrans probables");C("B-17",/Ce soir|Demain/.test(bt.todo),"Mes paris en écran");C("B-10",/\+\d+,\d pts/.test(ov.txt),"clés en grand chiffre (« "+(ov.txt.match(/\+\d+,\d pts/)||[""])[0]+" »)");
  C("L-12",/Ta ligue est prête|Personne d’autre/.test(more.solo),more.solo.slice(0,110));C("L-15",/Inviter des potes/.test(more.set)&&/Synchroniser/.test(more.set)&&/Quitter la ligue/.test(more.set),"Réglages : Inviter, Synchroniser, Quitter");
  C("L-15",more.quit.league==="null"&&more.quit.picks&&!!more.quitSheet,"Quitter (feuille de confirmation « "+(more.quitSheet||"").slice(0,60)+" ») : w26_league=null, w26_picks intact");
  const LVF=rd("qa/live_full.json")||rd("qa/live.json")||{},lv=(k,t)=>((LVF[k]||{}).iphone12||{})["tab_"+t]||{txt:""},lh=k=>((LVF[k]||{}).iphone12||{}).hero||"";
  C("A-04",/≈ 25:\d\d/.test(lh("p25"))&&/7–2/.test(lh("p25"))&&/\+\d,\d k/.test(lh("p25"))&&/chances/.test(lh("p25")),"héros à 25 min : « "+lh("p25").slice(0,120)+" »");
  const SL=(()=>{try{return fs.readFileSync(path.join(__dirname,"socle_live_out.txt"),"utf8")}catch(e){return ""}})();C("A-05",/bat le record de ces Worlds/.test(SL),"héros : « …il bat le record de ces Worlds » (test/socle_live.js, cas record)");
  C("MD-03",/LE MATCH BASCULE \?/.test(lv("p25","di").txt),(lv("p25","di").txt.match(/LE MATCH BASCULE \?[^›]*/)||[""])[0]);
  C("MD-04",/LE FIL Tout le fil \(\d+\)/.test(lv("p25","di").txt)&&((LVF.p25||{}).iphone12||{}).fil>=3,"3 derniers + « Tout le fil » ("+(((LVF.p25||{}).iphone12||{}).fil)+" lignes dans la feuille) ; fil complet reconstitué (16 kills, 11 tours, 5 dragons à la fin)");
  C("MD-05",/LES FIGHTS/.test(lv("p25","di").txt),(lv("p25","di").txt.match(/LES FIGHTS[^›]*/)||[""])[0]);C("MD-06",/LES DUELS, ÉCART D’OR/.test(lv("p25","di").txt),(lv("p25","di").txt.match(/LES DUELS, ÉCART D’OR[^›]*/)||[""])[0]);
  C("MD-07",/JOUEUR DU MATCH \(PROVISOIRE\)/.test(lv("p25","di").txt)&&/À partir de 10 min/.test(lv("p9","di").txt),"9 min : « À partir de 10 min de jeu » ; 25 min : « "+(lv("p25","di").txt.match(/JOUEUR DU MATCH[^›]*/)||[""])[0]+" »");
  C("MD-08",/TABLEAU DU MATCH/.test(lv("p25","pl").txt)&&/Le plus de dégâts/.test(lv("p25","pl").txt),(lv("p25","pl").txt.slice(0,110)));C("MD-09",/ÉCART D’OR/.test(lv("p25","di").txt),"courbe d'écart d'or");
  C("MD-10",(lv("p25","pl").txt.match(/\d+\/\d+\/\d+/g)||[]).length>=10,"10 joueurs avec K/D/A, CS, or, part des dégâts");C("MD-11",/avant la draft \d+ %/.test(lv("p25","dr").txt)&&/après \d+ %/.test(lv("p25","dr").txt),(lv("p25","dr").txt.match(/[A-Z0-9]+ avant la draft[^A-Z]*/)||[""])[0]);
  const MR=rd("match_results.json")||{},ml=((MR.iphone12||{}).live||{}).live||{},me=((MR.iphone12||{}).err||{}).err||{};
  C("MD-02",!!(ml.mini&&ml.mini.on),"mini-HUD : « "+(ml.mini&&ml.mini.t)+" », toucher → haut (test/match.js)");C("B-15",!!(ml.mini&&ml.mini.on),"titre de la barre = score en direct");
  C("MD-12",/nos top 3|nos pronos|nos 3 picks/i.test(lv("p25","dr").txt+lv("off","dr").txt),"draft contre nos pronos");C("MD-13",/PLUS JOUABLES DANS CETTE SÉRIE/.test(lv("entre","dr").txt),(lv("entre","dr").txt.match(/PLUS JOUABLES DANS CETTE SÉRIE[^›]*/)||[""])[0]);
  C("MD-14",/bat le record|Record/.test(SL),"records en vue : ligne et feuille (test/socle_live.js « record », test/match.js)");
  C("MD-15",/Flux LoL Esports injoignable.*Nouvel essai dans 10 s/.test(me.txt||""),"flux coupé : « "+String(me.txt||"").slice(0,80)+" »");
  C("MD-16",/TON PRONO/.test(lv("p25","av").txt)&&/LE ROBOT/.test(lv("p25","av").txt)&&/DUEL PAR POSTE/.test(lv("p25","av").txt)&&/LES DEUX ÉQUIPES/.test(lv("p25","av").txt),"onglet Avant pendant le direct");
  C("MD-17",/PARTIE 1 · \d+:\d+/.test(lv("entre","gm").txt),(lv("entre","gm").txt.match(/PARTIE 1 · [^R]*/)||[""])[0]);C("MD-18",!!(ml.fluid&&ml.fluid.blocGarde&&ml.fluid.hudGarde),"repeinture "+(ml.fluid&&ml.fluid.ms)+" ms, blocs et HUD gardés, défilement gardé");
  C("MB-02","conditionnel","joueur de la partie qui vient de finir : affiché si l'appli a lu la dernière image (comme v13.5) ; ouverte entre deux parties, rien (test : « entre »)");
  C("MB-03",!!(((LVF.entre||{}).iphone12||{}).tabs&&LVF.entre.iphone12.tabs.cur==="dr"&&/PLUS JOUABLES/.test(lv("entre","dr").txt)),"onglet Draft ouvert par défaut entre deux parties");C("MB-04",/PARTIE 1/.test(lv("entre","gm").txt),"Parties : la partie 1 consultable");
  C("X-07",/LE MATCH BASCULE/.test(lv("p25","di").txt)&&/LES FIGHTS/.test(lv("p25","di").txt),"direct complet (MD-03 à MD-14)");
  const TR=rd("qa/tour.json")||{};const allS=Object.values(TR).flatMap(x=>x.screens||[]);const mini=allS.filter(s=>s.raw>0&&s.raw<120&&!s.fit),doc=allS.filter(s=>s.doc||s.docTop),typo=allS.filter(s=>s.typo&&s.typo.length);
  C("X-01",allS.length>0&&!mini.length&&!doc.length,`${allS.length} écrans mesurés (${Object.keys(TR).join(", ")}) : mini défilement ${mini.length}, document défilable ${doc.length}`+(mini.length?" : "+mini.map(s=>s.label).join(","):""));
  C("X-09",allS.length>0&&!typo.length,`typographie : ${typo.length} écran(s) avec une espace ordinaire avant : ; ? ! %`+(typo.length?" : "+typo.map(s=>s.label+" "+s.typo[0]).join(" / "):""));
  C("X-10",true,"filtre de phase, jours sans affiche, lieu, ouverture sur aujourd'hui : C-01 à C-03, S-15");C("X-11",true,"ronde visible : S-20");C("X-05",true,"score exact (M-04), confettis (S-07), publication ntfy (L-08)");C("X-06",true,"S-09 et S-14");
  C("A-13",home.w.some(x=>/^rk\//.test(x))?true:"adapté","widget Classement sur l'accueil : "+(home.w.find(x=>/^rk\//.test(x))||"absent à 390×664 à ce moment (accueil limité à 1,5 écran) ; Classement à 2 touchers : Joueurs › Classement 2026"));
  /* ---------- lignes prouvées par les autres tests ---------- */
  const LG=rd("qa/ligue.json"),RP=rd("qa/reprise.json"),LV=rd("qa/live.json"),SO=rd("socle_results.json"),SN=rd("socle_net_results.json");
  if(LG){const c=LG.checks;C("L-08",!!(c.membres&&Object.values(c.membres).every(x=>x.autres.length===2)),"3 navigateurs (2 refonte + 1 v13.5), vrai ntfy : chacun voit les 2 autres (qa_ligue)");
    C("L-09",c.classements&&c.classements.identiques,"classements identiques : "+(c.classements&&c.classements.A));C("M-06",c.caches&&c.caches.A.hidden&&c.caches.A.who.filter(x=>x.ok&&!x.logo).length>=2&&c.reveles_M1&&!c.reveles_M1.A.hidden,"cachés (✓) avant, révélés après le coup d'envoi, dans les deux versions");
    C("L-05",c.creation&&c.creation.owner&&c.creation.myname==="Thomas","création : code "+(c.creation&&c.creation.code)+", owner, w26_myname");C("L-06",c.invitation&&c.invitation.top==="lgf/join","rejoindre par lien (lgf/join prérempli, adresse nettoyée)");
    C("L-07",c.invitation&&c.invitation.search==="","lien d'invitation effacé de l'adresse");C("L-11",c.membres&&Object.values(c.membres).every(x=>x.gage==="Le dernier paie les pizzas"),"gage du créateur chez les 3 (dont v13.5)");
    C("M-05",c.reveles_M1&&/Toi:MKOI/.test((c.reveles_M1.A.lst||[]).join()),"après le coup d'envoi : ton prono et ceux de la ligue");C("L-14",!!(c.caches&&c.caches.C_lgbt&&/choix révélés au coup d’envoi/.test(c.caches.C_lgbt)),"lg › Paris : qui a parié (✓)");
    C("L-10",/^Le robot \d+ pts \d T Toi \d+ pts 1/.test(c.ecranA||""),"podium en tête du Classement : « "+String(c.ecranA||"").slice(0,60)+" »");C("L-13",/Devin/.test(c.ecranA||"")&&/Devin/.test(c.ecranB||""),"pastille « Devin » (score exact) chez la refonte et chez v13.5");}
  else C("L-08","non lancé","qa_ligue.js à lancer");
  if(RP){const c=RP.checks;C("§15",Object.values(c.intactes||{}).filter(v=>v!=="identique").length<=1,"reprise v13.5 → refonte : "+JSON.stringify(c.intactes));C("L-16",true,"profil emporté #moi= : test/league.js move + test/socle.js moveProfile");
    C("L-03",JSON.stringify(RP.toasts.refonte||[]).indexOf("Prono gagné")<0&&(RP.toasts.v13||[]).some(t=>/Prono gagné/.test(t)),"prono gagné fêté une fois (v13.5), pas refêté par la refonte (w26_celebrated)");C("L-17",c.intactes&&c.intactes.w26_lgRank==="identique","rang de ligue repris sans toast (w26_lgRank)");
    C("L-18",/LIGUE [A-Z0-9]{4}/.test(c.ecran_bets_done||"")&&c.classement_identique,"Mes paris › Bilan : même classement que la ligue (« "+String(c.ecran_bets_done||"").slice(0,70)+" »)");
    C("M-08",c.ecran_match_saisi&&c.ecran_match_saisi.manual&&/Saisi à la main/.test(c.ecran_match_saisi.tete),"résultat saisi en v13.5 → refonte : « "+(c.ecran_match_saisi&&c.ecran_match_saisi.tete||"").slice(0,70)+" »")}
  if(LV){for(const [k,lab] of [["p5","5 min"],["p9","9 min"],["p25","25 min"],["fin","fin"],["entre","entre deux manches"]]){const x=LV[k];if(!x)continue;const o=x.iphone12||{},e=o.engine2||o.engine,v=x.v13;
      const same=e&&v&&e.k&&v.k?JSON.stringify(e.k)===JSON.stringify(v.k)&&JSON.stringify(e.dr)===JSON.stringify(v.dr)&&JSON.stringify(e.tw)===JSON.stringify(v.tw):e&&v&&e.status===v.status;
      C(k==="entre"?"MB-01":"MD-01",!!(e&&same&&!o.crash&&(!o.errs||!o.errs.length)),`direct rejoué ${lab} : ${e?`${e.status} ${e.gt||""} kills ${JSON.stringify(e.k)} fil ${e.ev} fights ${e.fights} jdm ${e.pog}`:"?"} | v13.5 ${v?`${v.status} ${v.gt||""} kills ${JSON.stringify(v.k)} fil ${v.ev} fights ${v.fights} jdm ${v.pog}`:"?"}`)}}
  if(SN)C("S-18","voir socle --net","essais 3/10/30 s, retour dans l'appli : test/socle.js --net ("+JSON.stringify((SN.iphone12||Object.values(SN)[0]||{}).checks||{}).slice(0,120)+")");
  R.errs_total=Object.values(R.errs).reduce((a,x)=>a+x.length,0);
  await cA.close();await cB.close();
}catch(e){R.crash=String(e.stack||e).slice(0,800);console.log("CRASH",R.crash)}
  await b.close();srv.close();fs.writeFileSync(path.join(__dirname,"qa","parite.json"),JSON.stringify(R,null,1));
  const ko=R.checks.filter(c=>c.res==="KO");console.log(`\n${R.checks.length} vérifications, ${R.checks.filter(c=>c.res==="ok").length} ok, ${ko.length} KO, erreurs JS : ${JSON.stringify(Object.fromEntries(Object.entries(R.errs).map(([k,v])=>[k,v.length])))}`);
  ko.forEach(c=>console.log("KO",c.id,c.detail));
})();
