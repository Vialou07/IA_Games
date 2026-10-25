/* =====================================================================================
   test/socle.js — tests du SOCLE (agent socle) sur iPhone 12 (390×664), Pixel 7 et 360×740 :
   cadrage (document qui ne défile jamais, écrans « fit », dépassement 0 ou ≥ 120 px, accueil ≤ 1,5 écran dans chaque moment),
   accueil (widgets selon le moment, sections, pastille), écrans set et eve, mon équipe, pari depuis le héros, feuille fermée
   d'un glissement, compte à rebours → direct, reprise de profil #moi=, liens profonds, typographie, clés w26_, ouvertures à
   CPU ×4, sources coupées (pastille « Robot hh:mm », « Hors ligne », essais 3/10/30 s), zéro erreur JS ; captures shots/socle/.
   node test/socle.js [iphone12|pixel7|w360] [--local] [--net]     (--net : tests réseau coupé, plus longs)
   node test/socle.js --webkit [wk_iphone12|wk_iphone13|wk_promax]       moteur de Safari (WebKit de Playwright, installé dans
     scratchpad/pw/browsers) : mêmes contrôles sauf ceux qui passent par CDP (glissement de la feuille, CPU ×4)
   Construire avant : node build.js --out dist/socle/worlds-b.html   (serveur interne : port 8906, dossier dist/socle)
   ===================================================================================== */
const PW="C:/Users/vialo/AppData/Local/Temp/claude/c--Users-vialo-Desktop-Code-Worlds-2026/cead0307-273c-463a-8548-1b2491359512/scratchpad/pw/node_modules/playwright";
const WK=process.argv.includes("--webkit");if(WK)process.env.PLAYWRIGHT_BROWSERS_PATH=require("path").join(PW,"../../browsers");
const {chromium:CR,webkit,devices}=require(PW),chromium=WK?webkit:CR;const fs=require("fs"),path=require("path"),http=require("http");
const DIST=path.join(__dirname,"../dist/socle"),OUT=path.join(__dirname,"../shots/socle"),DATA=path.join(__dirname,"../../data");fs.mkdirSync(OUT,{recursive:true});
const ARGS=process.argv.slice(2),ONLY=ARGS.find(a=>!a.startsWith("--")),LOCAL=ARGS.includes("--local"),NET=ARGS.includes("--net"),PORT=8906;
const BASE=`http://127.0.0.1:${PORT}/worlds-b.html`;
const DEV=WK?{wk_iphone12:{...devices["iPhone 12"]},wk_iphone13:{...devices["iPhone 13"]},wk_promax:{...devices["iPhone 15 Pro Max"]}}
  :{iphone12:{...devices["iPhone 12"]},pixel7:{...devices["Pixel 7"]},w360:{...devices["Galaxy S9+"],viewport:{width:360,height:740},screen:{width:360,height:740}}};
const MIME={html:"text/html; charset=utf-8",js:"text/javascript",json:"application/json",webmanifest:"application/manifest+json",png:"image/png"};
const srv=http.createServer((q,s)=>{const f=path.join(DIST,decodeURIComponent(q.url.split("?")[0]));if(!f.startsWith(DIST)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);s.end();return}
  s.writeHead(200,{"content-type":MIME[f.split(".").pop()]||"application/octet-stream","cache-control":"no-store"});fs.createReadStream(f).pipe(s)});
const R={};
const local=async ctx=>{if(LOCAL)await ctx.route(/raw\.githubusercontent\.com\/Vialou07\/IA_Games\/stats[^/]*\/data\/(\w+)\.json/,r=>{const n=r.request().url().match(/data\/(\w+)\.json/)[1],f=path.join(DATA,n+"_pp.json");
  r.fulfill({status:fs.existsSync(f)?200:404,contentType:"application/json",body:fs.existsSync(f)?fs.readFileSync(f,"utf8"):""})})};
/* WebKit (Windows) remonte ses échecs réseau (« SSL connect error », « … due to access control checks ») comme des erreurs de
   page sans pile : ce ne sont pas des erreurs JS. Les vraies promesses rejetées sans traitement sont, elles, comptées
   (écouteur unhandledrejection posé dans la page). */
function watch(p,res){p.on("pageerror",e=>{if(WK&&!e.stack&&/due to access control checks|SSL connect error/.test(e.message))return;res.errs.push(e.message.slice(0,240))});
  p.addInitScript(()=>addEventListener("unhandledrejection",e=>console.error("REJET NON TRAITÉ "+(e.reason&&e.reason.message||e.reason)))).catch(()=>{});
  p.on("console",m=>{if(m.type()==="error"&&(/^REJET NON TRAITÉ/.test(m.text())||!/Failed to load resource|net::ERR|status of 4\d\d|ERR_FAILED|SSL connect error|access control checks|Fetch API cannot load|Load failed/.test(m.text())))res.errs.push("console "+m.text().slice(0,200))})}
const ready=p=>p.waitForFunction(()=>typeof MATCHES!=="undefined"&&MATCHES.length&&document.querySelector(".home .grid .w"),null,{timeout:45000});
/* mesure de l'écran du dessus : dépassement « utile » (0 si .fit), document, débordement horizontal */
const measure=p=>p.evaluate(()=>{const el=NAV.length?NAV[NAV.length-1].el:HOME,se=document.scrollingElement;
  const over=el.classList.contains("fit")?0:el.scrollHeight-el.clientHeight;
  const hs=[...el.querySelectorAll("*")].filter(x=>{const r=x.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left<-1)&&!x.closest(".hbg,.beam,.hc,.ph,.seg,.bans")}).slice(0,3).map(x=>x.className+"|"+Math.round(x.getBoundingClientRect().right));
  return {r:NAV.length?routeOf(NAV[NAV.length-1].d):"accueil",over,raw:el.scrollHeight-el.clientHeight,fit:el.classList.contains("fit"),ratio:+(el.scrollHeight/innerHeight).toFixed(2),
    doc:se.scrollHeight-se.clientHeight,docTop:se.scrollTop,hscroll:el.scrollWidth>el.clientWidth+1||document.documentElement.scrollWidth>innerWidth+1,hs}});
const typo=p=>p.evaluate(()=>{const tw=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let x,n=0;const ex=[];while((x=tw.nextNode())){const e=x.parentElement;if(!e||/^(SCRIPT|STYLE)$/.test(e.nodeName))continue;if(/ [:;?!%]/.test(x.nodeValue)){n++;if(ex.length<3)ex.push(x.nodeValue.trim().slice(0,40))}}return {n,ex}});
const go=async(p,r,w=900)=>{await p.evaluate(r=>go(r),r);await p.waitForTimeout(w)};
const back=async p=>{await p.evaluate(()=>history.back());await p.waitForTimeout(700)};
const tabs=p=>p.evaluate(()=>{const el=NAV[NAV.length-1].el;return [...el.querySelectorAll(".seg [data-tab]")].map(b=>b.dataset.tab)});
const tab=async(p,k)=>{await p.evaluate(k=>{const b=NAV[NAV.length-1].el.querySelector(`.seg [data-tab="${k}"]`);if(b)b.click()},k);await p.waitForTimeout(600)};

async function run(name,dev){
  const b=await chromium.launch();const ctx=await b.newContext({...dev,locale:"fr-FR",timezoneId:"Europe/Paris"});await local(ctx);
  const p=await ctx.newPage();const res={errs:[],home:{},screens:[],opens:[],checks:{}};R[name]=res;watch(p,res);
  const cdp=WK?null:await ctx.newCDPSession(p);p.setDefaultTimeout(20000);
  await p.goto(BASE+"?nointro",{waitUntil:"domcontentloaded"});await ready(p);await p.waitForTimeout(4500);
  res.ctx=await p.evaluate(()=>({mo:HM.k,rows:HM.rows,src:SOURCE,pill:document.querySelector(".home .pill").textContent,v:APP_VERSION,live:(MATCHES.find(m=>m.state==="live")||{}).id,recent:HM.recent}));
  /* 1. accueil, moment réel puis chaque moment forcé */
  const homeShot=async lab=>{const m=await measure(p);m.rows=await p.evaluate(()=>HM.rows);m.est=await p.evaluate(()=>HM.est);res.home[lab]=m;
    await p.screenshot({path:`${OUT}/${name}_accueil_${lab}.png`});if(m.raw>0){await p.evaluate(()=>{HOME.scrollTop=HOME.scrollHeight});await p.waitForTimeout(300);await p.screenshot({path:`${OUT}/${name}_accueil_${lab}_bas.png`});await p.evaluate(()=>{HOME.scrollTop=0})}};
  await homeShot("reel");res.checks.typoHome=await typo(p);
  /* 2. pari depuis le héros (si un match à venir est dans le héros) */
  res.checks.heroPick=await p.evaluate(async()=>{const b=document.querySelector(".home .hero [data-pick]");if(!b)return "pas de héros d'avant-match";const k=b.dataset.mk,t=b.dataset.pick,before=(JSON.parse(localStorage.getItem("w26_picks")||"{}"))[k]||null;
    b.click();await new Promise(r=>setTimeout(r,200));const a=(JSON.parse(localStorage.getItem("w26_picks")||"{}"))[k]||null;const pressed=b.getAttribute("aria-pressed");b.click();await new Promise(r=>setTimeout(r,200));
    const c=(JSON.parse(localStorage.getItem("w26_picks")||"{}"))[k]||null;return {before,apres:a,pressed,annule:c}});
  /* 3. écrans du socle : set (3 onglets), eve (2 onglets) */
  const shotScr=async lab=>{const m=await measure(p);res.screens.push(m);await p.screenshot({path:`${OUT}/${name}_${lab}.png`});
    if(m.over>0){await p.evaluate(()=>{const el=NAV[NAV.length-1].el;el.scrollTop=el.scrollHeight});await p.waitForTimeout(300);await p.screenshot({path:`${OUT}/${name}_${lab}_bas.png`});await p.evaluate(()=>{NAV[NAV.length-1].el.scrollTop=0})}};
  await p.click(".home .pill");await p.waitForTimeout(900);res.checks.pillOpensSet=await p.evaluate(()=>NAV.length&&NAV[NAV.length-1].d.v);
  for(const t of ["moi","etat","diag"]){await tab(p,t);await shotScr("set_"+t)}
  res.checks.typoSet=await typo(p);
  /* mon équipe : choisir GEN, vérifier w26_fav, puis la retirer */
  await tab(p,"moi");res.checks.fav=await p.evaluate(async()=>{const b=document.querySelector('.scr [data-fav="GEN"]');b.click();await new Promise(r=>setTimeout(r,300));const a=JSON.parse(localStorage.getItem("w26_fav"));
    const pressed=document.querySelector('.scr [data-fav="GEN"]').getAttribute("aria-pressed");return {fav:a,pressed}});
  await back(p);
  res.checks.favHome=await p.evaluate(()=>({widget:!!document.querySelector('.home .w[aria-label^="Mon équipe"]'),rows:HM.rows}));
  await go(p,"cal",1200);res.checks.favRows=await p.evaluate(()=>NAV[NAV.length-1].el.querySelectorAll(".mrow.fav").length);await back(p);
  /* diagnostic : lancer, attendre, copier le rapport */
  if(name==="iphone12"){await go(p,"set/diag");await p.evaluate(()=>runDiag());await p.waitForFunction(()=>!DIAG.run,null,{timeout:60000}).catch(()=>{});await p.waitForTimeout(400);
    res.checks.diag=await p.evaluate(()=>DIAG.res.map(r=>(r.ok?"OK ":"ÉCHEC ")+r.label+" "+r.ms+" ms : "+r.d));await shotScr("set_diag_resultat");
    res.checks.report=await p.evaluate(()=>diagReport().split("\n").slice(0,6));await back(p)}
  await p.evaluate(()=>{fav=null;localStorage.setItem("w26_fav","null");onData()});
  const eve=await p.evaluate(()=>HM.recent||HM.last);
  if(eve){await go(p,"eve/"+eve,2500);await shotScr("eve_resume");await tab(p,"res");await shotScr("eve_resultats");res.checks.eve=await p.evaluate(()=>({pod:NAV[NAV.length-1].el._o?1:0}));await back(p)}
  /* 4. feuille « i » : glisser vers le bas pour fermer */
  await go(p,"set/etat");await p.evaluate(()=>openInfo("set"));await p.waitForTimeout(500);
  const sy=await p.evaluate(()=>Math.round(document.querySelector("#sheet").getBoundingClientRect().top+40));
  if(WK)await p.evaluate(()=>closeSheet()).then(()=>p.waitForTimeout(500));else try{await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x:150,y:sy}]});
    for(let y=0;y<=200;y+=25){await cdp.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x:150,y:sy+y}]});await p.waitForTimeout(16)}
    await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});await p.waitForTimeout(700)}catch(e){res.checks.swipeErr=e.message}
  res.checks.sheetSwipe=await p.evaluate(()=>({open:SHEET.open,depth:NAV.length}));
  if(await p.evaluate(()=>SHEET.open))await back(p);await back(p);
  /* 5. ouvertures à CPU ×4 depuis l'accueil (parcours courant) */
  if(!WK)for(const [sel,lab] of [[".home .hero","héros"],[".home .w[data-go^='m/']","match"],[".home .wn-i[data-go='cal']","calendrier"],[".home .pill","réglages"],[".home .w[data-go^='eve/']","bilan"],[".home .w[data-go^='rk']","classement"],[".home .w[data-go='bets']","paris"]]){
    if(!await p.evaluate(s=>!!document.querySelector(s),sel))continue;await cdp.send("Emulation.setCPUThrottlingRate",{rate:4});
    const ms=await p.evaluate(async s=>{const el=document.querySelector(s);el.scrollIntoView({block:"center"});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
      const t0=performance.now();el.click();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return Math.round(performance.now()-t0)},sel);
    await cdp.send("Emulation.setCPUThrottlingRate",{rate:1});res.opens.push([lab,ms]);await p.waitForTimeout(800);await back(p);await p.evaluate(()=>{HOME.scrollTop=0})}
  /* 6. tour de cadrage : toutes les routes et tous leurs onglets (dépassement 0 ou ≥ 120 px) */
  const ids=await p.evaluate(()=>{const s=MATCHES.find(m=>m.state==="soon"&&m.t1&&m.t2),d=[...MATCHES].reverse().find(m=>m.winner),l=MATCHES.find(m=>m.state==="live");
    return {m:[s&&s.id,d&&d.id,l&&l.id].filter(Boolean),p:"T1_faker",d:"T1_faker~GEN_chovy",cmp:"T1_faker~GEN_chovy",rk:"TOP",fx:"0",t:"T1",eve:HM.recent||HM.last,routes:Object.keys(ROUTES)}});
  const survey=[];
  for(const v of ids.routes){const L=v==="m"?ids.m:[ids[v]||""];
    for(const id of L){await go(p,v+(id?"/"+id:""),1600);if(!await p.evaluate(()=>NAV.length))continue;const T=await tabs(p);
      for(const t of (T.length?T:[null])){if(t)await tab(p,t);await p.waitForTimeout(t?500:0);const m=await measure(p);survey.push(m)}
      await back(p)}}
  res.survey=survey;res.checks.mini=survey.filter(m=>m.over>0&&m.over<120).map(m=>m.r+" "+m.over);res.checks.docScroll=survey.filter(m=>m.doc>0).map(m=>m.r+" "+m.doc);
  res.checks.hscroll=survey.filter(m=>m.hscroll).map(m=>m.r+" "+JSON.stringify(m.hs));
  /* 7. héros d'avant-match (match simulé dans 40 min : un match joué remis « à venir »), pari depuis le héros, puis coup d'envoi */
  const simSoon=ms=>p.evaluate(ms=>{clearTimeout(sync.t);MATCHES.filter(x=>x.state==="live"||x.state==="wait").forEach(x=>{x.winner=x.t1;x.s1=Math.ceil(x.bo/2);x.s2=0;x.apiLive=false});let m=MATCHES.find(x=>x.state==="soon"&&x.t1&&x.t2);
    if(!m){m=[...MATCHES].reverse().find(x=>x.winner&&x.t1&&x.t2&&x.bo===1);m.winner=null;m.s1=m.s2=null;m.apiLive=false;m.unst=true;m.manual=false}
    m.start=new Date(Date.now()+ms).toISOString();MATCHES=finalize(MATCHES);onData();return m.id},ms);
  for(const mo of ["soon"]){await p.goto(BASE+"?nointro",{waitUntil:"domcontentloaded"});await ready(p);await p.waitForTimeout(2500);
    res.checks.simSoon=await simSoon(40*60e3);await p.waitForTimeout(800);await homeShot("soon_simule");
    res.checks.heroPick=await p.evaluate(async()=>{const b=document.querySelector(".home .hero [data-pick]");if(!b)return "pas de héros d'avant-match";const k=b.dataset.mk,t=b.dataset.pick,before=(JSON.parse(localStorage.getItem("w26_picks")||"{}"))[k]||null;
      b.click();await new Promise(r=>setTimeout(r,200));const a=(JSON.parse(localStorage.getItem("w26_picks")||"{}"))[k]||null;const pressed=b.getAttribute("aria-pressed");b.click();await new Promise(r=>setTimeout(r,200));
      const c=(JSON.parse(localStorage.getItem("w26_picks")||"{}"))[k]||null;return {before,apres:a,pressed,annule:c,cle:(document.querySelector(".home .hero .hom-key")||{}).textContent||""}});
    await simSoon(2500);await p.waitForTimeout(4200);
    res.checks.kickoff=await p.evaluate(()=>({moment:HM.k,heroLive:!!document.querySelector(".home .hero .badge.live"),state:(MATCHES.find(x=>x.id===document.querySelector(".home .hero")?.dataset.go?.slice(2))||{}).state}));
    await homeShot("coup_envoi_simule")}
  /* 8. retour dans l'appli après plus d'une minute : synchro */
  res.checks.visibility=await p.evaluate(async()=>{lastSync=new Date(Date.now()-120e3);Object.defineProperty(document,"hidden",{configurable:true,get:()=>false});document.dispatchEvent(new Event("visibilitychange"));
    const busy=!!SYNC.p;await (SYNC.p||Promise.resolve());return {syncLancee:busy,lastSync:Date.now()-lastSync<5000}});
  /* 9. liens profonds */
  for(const h of ["#p/T1_faker","#set/etat","#eve/"+(ids.eve||"")]){const q=await ctx.newPage();watch(q,res);await q.goto(BASE+"?nointro"+h);await ready(q);await q.waitForTimeout(1500);
    (res.checks.deep=res.checks.deep||[]).push(h+" → "+await q.evaluate(()=>NAV.length?routeOf(NAV[NAV.length-1].d):"accueil"));await q.close()}
  /* 10. moments forcés */
  for(const mo of ["live","soon","day","after","rest"]){await p.goto(BASE+"?nointro&mo="+mo,{waitUntil:"domcontentloaded"});await ready(p);await p.waitForTimeout(3000);await homeShot(mo)}
  res.checks.storage=await p.evaluate(()=>Object.keys(localStorage).filter(k=>!/^w26_/.test(k)));
  /* 11. profil emporté (#moi=) : nouveau navigateur, toast « Profil de X repris » */
  if(name==="iphone12"){const link=await p.evaluate(()=>{localStorage.setItem("w26_picks",JSON.stringify({"T1_DK_sw":"T1"}));localStorage.setItem("w26_myname",JSON.stringify("Léa"));return moveLink()});
    const c2=await b.newContext({...dev,locale:"fr-FR",timezoneId:"Europe/Paris"});await local(c2);const q=await c2.newPage();watch(q,res);
    await q.goto(link.replace(/^https?:\/\/[^/]+\/[^#]*/,BASE+"?nointro"));await ready(q);await q.waitForTimeout(1800);
    res.checks.moveProfile=await q.evaluate(()=>({toast:document.querySelector("#toast").textContent,picks:localStorage.getItem("w26_picks"),hash:location.hash}));await c2.close()}
  /* 12. ligue factice (relais ntfy bloqué : rien n'est publié) : ligne « qui a parié » du héros ; gyroscope iPhone au premier toucher */
  {const c3=await b.newContext({...dev,locale:"fr-FR",timezoneId:"Europe/Paris"});await local(c3);await c3.route(/ntfy.sh/,r=>r.abort());
    await c3.addInitScript(()=>{localStorage.setItem("w26_league",JSON.stringify({code:"ZZ99",me:{id:"utest1",name:"Thomas"},owner:true,gage:"",players:{utest2:{name:"Léa",p:{},ts:0},utest3:{name:"Max",p:{},ts:0}}}));
      window.__gyro=0;window.DeviceOrientationEvent=window.DeviceOrientationEvent||function(){};DeviceOrientationEvent.requestPermission=()=>{window.__gyro++;return Promise.resolve("granted")}});
    const q=await c3.newPage();watch(q,res);await q.goto(BASE+"?nointro");await ready(q);await q.waitForTimeout(2500);
    await q.evaluate(()=>{clearTimeout(sync.t);MATCHES.filter(x=>x.state==="live"||x.state==="wait").forEach(x=>{x.winner=x.t1;x.s1=1;x.s2=0;x.apiLive=false});const m=[...MATCHES].reverse().find(x=>x.winner&&x.t1&&x.t2&&x.bo===1);
      m.winner=null;m.s1=m.s2=null;m.unst=true;m.start=new Date(Date.now()+30*60e3).toISOString();MATCHES=finalize(MATCHES);lg.players.utest2.p[m.key]={w:m.t1};onData()});
    await q.waitForTimeout(600);res.checks.leagueLine=await q.evaluate(()=>(document.querySelector(".home .hero .hom-key")||{}).textContent||"");
    await q.click(".home .wn-i[data-go='cal']");await q.waitForTimeout(500);res.checks.gyro=await q.evaluate(()=>window.__gyro);
    await q.screenshot({path:`${OUT}/${name}_ligue_factice.png`});await c3.close()}
  await b.close();
}
/* sources coupées : LoL Esports bloqué → pastille « Robot hh:mm » + essais 3/10/30 s ; tout bloqué → « Hors ligne » */
async function runNet(dev){
  const b=await chromium.launch();const res={errs:[],checks:{}};R.net=res;
  let ctx=await b.newContext({...dev,locale:"fr-FR",timezoneId:"Europe/Paris"});await local(ctx);const tries=[];
  await ctx.route(/esports-api\.lolesports\.com/,r=>{if(/getSchedule/.test(r.request().url()))tries.push(Date.now());r.abort("connectionrefused")});
  let p=await ctx.newPage();watch(p,res);await p.goto(BASE+"?nointro");await ready(p);await p.waitForTimeout(3000);
  res.checks.robotPill=await p.evaluate(()=>({pill:document.querySelector(".home .pill").textContent,cls:document.querySelector(".home .pill").className,src:SOURCE}));
  await p.screenshot({path:`${OUT}/net_robot.png`});
  await p.waitForTimeout(50000);const t0=tries[0];res.checks.retries=tries.map(t=>Math.round((t-t0)/1000));
  /* l'API revient : la synchro suivante repasse sur LoL Esports */
  await ctx.unroute(/esports-api\.lolesports\.com/);await p.waitForTimeout(66000);res.checks.back=await p.evaluate(()=>({src:SOURCE,pill:document.querySelector(".home .pill").textContent}));
  await ctx.close();
  ctx=await b.newContext({...dev,locale:"fr-FR",timezoneId:"Europe/Paris"});await ctx.route(/esports-api\.lolesports\.com|raw\.githubusercontent\.com/,r=>r.abort("connectionrefused"));
  p=await ctx.newPage();watch(p,res);await p.goto(BASE+"?nointro");await ready(p);await p.waitForTimeout(2500);
  res.checks.offline=await p.evaluate(()=>({pill:document.querySelector(".home .pill").textContent,src:SOURCE,n:MATCHES.length,mo:HM.k}));await p.screenshot({path:`${OUT}/net_horsligne.png`});
  await b.close();
}
(async()=>{
  await new Promise(r=>srv.listen(PORT,"127.0.0.1",r));
  for(const [n,d] of Object.entries(DEV)){if(ONLY&&ONLY!==n)continue;try{await run(n,d)}catch(e){R[n]=R[n]||{};R[n].crash=e.stack.slice(0,500)}}
  if(NET)try{await runNet(DEV.iphone12)}catch(e){R.net=R.net||{};R.net.crash=e.stack.slice(0,400)}
  srv.close();fs.writeFileSync(path.join(__dirname,"socle_results.json"),JSON.stringify(R,null,1));
  let bad=0;
  for(const [n,x] of Object.entries(R)){console.log("=== "+n);if(x.crash){bad++;console.log("CRASH",x.crash)}if(x.ctx)console.log(JSON.stringify(x.ctx));
    if(x.home)Object.entries(x.home).forEach(([k,v])=>console.log(("accueil "+k).padEnd(16),"ratio",v.ratio,"dépasse",v.over,"fit",v.fit,"doc",v.doc,v.hscroll?"HSCROLL":"","est",v.est,"|",(v.rows||[]).join(" ")));
    if(x.screens)x.screens.forEach(v=>console.log(v.r.padEnd(22),"ratio",v.ratio,"dépasse",v.over,"fit",v.fit,"doc",v.doc,v.hscroll?"HSCROLL "+JSON.stringify(v.hs):""));
    if(x.opens)console.log("ouvertures CPU×4 (ms):",x.opens.map(o=>o.join(" ")).join(" | "));
    if(x.checks)Object.entries(x.checks).forEach(([k,v])=>console.log("  "+k+":",JSON.stringify(v)));
    if(x.errs){console.log("erreurs JS:",x.errs.length,[...new Set(x.errs)].slice(0,8).join(" || "));bad+=x.errs.length}}
  process.exit(bad?1:0);
})();
