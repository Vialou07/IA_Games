/* =====================================================================================
   test/qa_ligue.js — contrôle qualité (intégrateur) : ligue entre potes à 3 navigateurs sur le VRAI ntfy.sh.
     A = refonte (dist/worlds-b.html) sur iPhone 12, crée la ligue par l'écran lgf/create ;
     B = v13.5 figée (ref/worlds_v13_5.html) sur Pixel 7, rejoint en tapant le code (« J'ai un code ») ;
     C = refonte sur 360×740, rejoint par le lien d'invitation ?ligue=CODE&n=…&g=… .
   Horloge des 3 téléphones : 24/10 16:30Z (18:30 Paris), LoL Esports coupé → planning du robot (lot1/data/stats_pp.json,
   servi par ce script, avec G2-KC rempli sur le Bo3 du 25/10 19:00Z). Paris posés au doigt dans chaque interface :
     M1 = CFO-MKOI (Bo1, 24/10 18:00Z) ; M3 = G2-KC (Bo3, 25/10 19:00Z) avec score exact.
   Vérifie : chacun voit les deux autres ; paris CACHÉS avant le coup d'envoi (✓ sans le choix, dans les deux versions),
   RÉVÉLÉS après (horloge avancée), classements IDENTIQUES dans les 3 navigateurs (robot compris) une fois les résultats
   publiés (planning du robot modifié par ce script), clés w26_ seulement, 0 erreur JS.
   node test/qa_ligue.js   (port 8911) → test/qa/ligue.json, captures shots/qa/ligue_*.png
   ===================================================================================== */
const PW="C:/Users/vialo/AppData/Local/Temp/claude/c--Users-vialo-Desktop-Code-Worlds-2026/cead0307-273c-463a-8548-1b2491359512/scratchpad/pw/node_modules/playwright";
const {chromium,devices}=require(PW);const fs=require("fs"),path=require("path"),http=require("http");
const ROOT=path.join(__dirname,".."),DATA=path.join(ROOT,"../data"),OUT=path.join(ROOT,"shots","qa"),PORT=8911;fs.mkdirSync(OUT,{recursive:true});fs.mkdirSync(path.join(__dirname,"qa"),{recursive:true});
const B_URL=`http://127.0.0.1:${PORT}/dist/worlds-b.html`,A_URL=`http://127.0.0.1:${PORT}/ref/worlds_v13_5.html`;
const DEV={iphone12:{...devices["iPhone 12"]},pixel7:{...devices["Pixel 7"]},w360:{...devices["Galaxy S9+"],viewport:{width:360,height:740},screen:{width:360,height:740}}};
const TYPES={html:"text/html; charset=utf-8",js:"text/javascript",json:"application/json",png:"image/png"};
const srv=http.createServer((q,s)=>{const f=path.join(ROOT,decodeURIComponent(q.url.split("?")[0]));if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);s.end();return}
  s.writeHead(200,{"content-type":TYPES[f.split(".").pop()]||"application/octet-stream","cache-control":"no-store"});fs.createReadStream(f).pipe(s)});
const M1="115660540726095021",M3="115660540726095037",RESULTS={};   // résultats publiés par le « robot » au fil du test
function statsBody(){const d=JSON.parse(fs.readFileSync(path.join(DATA,"stats_pp.json"),"utf8"));
  (d.sched||[]).forEach(x=>{if(x[0]===M3){x[5]=["G2","G2 Esports",null];x[6]=["KC","Karmine Corp",null]}
    if(RESULTS[x[0]]){x[2]="completed";x[5][2]=RESULTS[x[0]][0];x[6][2]=RESULTS[x[0]][1]}});return JSON.stringify(d)}
const T0=new Date("2026-10-24T16:30:00Z");
const R={errs:{},checks:{},timings:{}};const log=(...a)=>console.log(...a);const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function mk(b,dev,name){const ctx=await b.newContext({...dev,locale:"fr-FR",timezoneId:"Europe/Paris"});
  await ctx.route(/raw\.githubusercontent\.com\/Vialou07\/IA_Games\/stats[^/]*\/data\/(\w+)\.json/,r=>{const n=r.request().url().match(/data\/(\w+)\.json/)[1];
    if(n==="stats")return r.fulfill({status:200,contentType:"application/json",body:statsBody()});const f=path.join(DATA,n+"_pp.json");
    r.fulfill({status:fs.existsSync(f)?200:404,contentType:"application/json",body:fs.existsSync(f)?fs.readFileSync(f,"utf8"):""})});
  await ctx.route(/esports-api\.lolesports\.com|feed\.lolesports\.com|lol\.fandom\.com/,r=>r.abort());
  await ctx.clock.install({time:T0});
  const p=await ctx.newPage();R.errs[name]=[];p.on("pageerror",e=>R.errs[name].push(e.message));
  p.on("console",m=>{if(m.type()==="error"&&!/Failed to load resource|net::ERR|EventSource/.test(m.text()))R.errs[name].push("console "+m.text().slice(0,200))});
  p.on("dialog",d=>d.accept().catch(()=>{}));p.ctx=ctx;p.nm=name;return p}
const readyB=async p=>{await p.waitForFunction(()=>typeof MATCHES!=="undefined"&&MATCHES.length&&document.querySelector(".home .grid .w"),null,{timeout:45000});await wait(1500)};
const readyA=async p=>{await p.waitForFunction(()=>typeof MATCHES!=="undefined"&&MATCHES.length>10&&typeof duelHome==="function",null,{timeout:45000});await wait(1500)};
const LSget=(p,k)=>p.evaluate(k=>JSON.parse(localStorage.getItem("w26_"+k)||"null"),k);
const goR=async(p,r,w=900)=>{await p.evaluate(r=>go(r),r);await wait(w)};
const home=async p=>{await p.evaluate(async()=>{while(NAV.length){history.back();await new Promise(r=>setTimeout(r,450))}})};
const until=async(p,fn,arg,ms=25000)=>{const t=Date.now();try{await p.waitForFunction(fn,arg,{timeout:ms,polling:200});return Date.now()-t}catch(e){return -1}};
/* ce que chaque version AFFICHE des paris d'un match (pas seulement les données) */
const viewB=(p,mid)=>p.evaluate(mid=>{const m=MATCHES.find(x=>x.id==="le"+mid),h=leaMatchHTML(m),d=document.createElement("div");d.innerHTML=h;
  const who=[...d.querySelectorAll(".lea-who .lea-w")].map(s=>({nm:s.querySelector("small").textContent,ok:!!s.querySelector(".ok"),logo:!!s.querySelector("i img,i .lg,i [class*=logo]")||/<img/.test(s.querySelector("i").innerHTML)}));
  const lst=[...d.querySelectorAll(".lea-lst .lea-lr")].map(r=>r.querySelector(".nm").textContent+":"+r.querySelector(".pk").textContent.trim()+(r.querySelector("em")?"("+r.querySelector("em").textContent+")":""));
  return {state:m.state,hidden:!!d.querySelector(".lea-who"),who,lst,foot:(d.querySelector(".lea-foot")||{}).textContent||null}},mid);
const viewA=(p,mid)=>p.evaluate(mid=>{const m=MATCHES.find(x=>x.id==="le"+mid),d=document.createElement("div");d.innerHTML=duelMatchHTML(m,"lg");
  const h=document.createElement("div");h.innerHTML=duelHome(true);const row=[...h.querySelectorAll(".lup")].find(x=>x.dataset.m==="le"+mid);
  return {state:m.state,txt:d.innerText.replace(/\s+/g," ").slice(0,260),ok:d.querySelectorAll("i.ok").length+(row?row.querySelectorAll("i.ok").length:0),logos:row?row.querySelectorAll(".lb i img").length:null,html:d.innerHTML.length}},mid);
const stand=p=>p.evaluate(()=>standings().map(u=>`${u.rank}.${u.bot?"robot":u.name}:${u.pts}(${u.ok}/${u.n}${u.ex?",ex"+u.ex:""})`).join(" "));

(async()=>{await new Promise(r=>srv.listen(PORT,"127.0.0.1",r));const b=await chromium.launch();
  try{
  const A=await mk(b,DEV.iphone12,"A_refonte_iphone12"),B=await mk(b,DEV.pixel7,"B_v13_pixel7"),C=await mk(b,DEV.w360,"C_refonte_360");
  // ---- 1. A crée la ligue (écran lgf/create)
  await A.goto(B_URL+"?nointro");await readyB(A);
  await goR(A,"lgf/create");await A.fill(".scr .lea-in[name=n]","Thomas");await A.fill(".scr .lea-in[name=g]","Le dernier paie les pizzas");
  await A.evaluate(()=>document.querySelector(".scr .lea-go").click());await wait(2500);
  const L0=await LSget(A,"league");const code=L0&&L0.code;R.checks.creation={code,owner:L0&&L0.owner,gage:L0&&L0.gage,myname:await LSget(A,"myname")};log("ligue",code);
  if(!code)throw new Error("ligue non créée");
  // ---- 2. B (v13.5) rejoint en tapant le code
  await B.goto(A_URL);await readyA(B);await wait(2600);   // intro de v13.5
  await B.evaluate(()=>{const x=document.querySelector('[data-duel="join"]');x&&x.click()});await B.waitForSelector("#dName",{timeout:15000});
  await B.fill("#dName","Léa");await B.fill("#dCode",code.toLowerCase());await B.evaluate(()=>document.querySelector('[data-duel="go-join"]').click());await wait(1500);
  // ---- 3. C (refonte) rejoint par le lien d'invitation
  await C.goto(B_URL+`?nointro&ligue=${code}&n=Thomas&g=${encodeURIComponent("Le dernier paie les pizzas")}`);await readyB(C);await wait(1200);
  R.checks.invitation=await C.evaluate(()=>({top:NAV.length&&NAV[NAV.length-1].d.v+"/"+NAV[NAV.length-1].d.id,search:location.search,inv:(document.querySelector(".scr .lea-inv")||{}).textContent}));
  await C.fill(".scr .lea-in[name=n]","Sam");await C.evaluate(()=>document.querySelector(".scr .lea-go").click());
  const t0=Date.now();
  for(const [p,isA] of [[A,0],[B,1],[C,0]])R.timings["voit_3_membres_"+p.nm]=await until(p,()=>typeof lg!=="undefined"&&lg&&Object.keys(lg.players).length>=2,null,30000);
  R.checks.membres={};for(const p of [A,B,C])R.checks.membres[p.nm]=await p.evaluate(()=>({code:lg.code,moi:lg.me.name,autres:Object.values(lg.players).map(x=>x.name).sort(),gage:lg.gage,owner:!!lg.owner}));
  R.checks.membres_ms=Date.now()-t0;
  // ---- 4. paris au doigt (24/10 18:30 Paris) : M1 = CFO-MKOI (Bo1), M3 = G2-KC (Bo3, score exact)
  const info=await A.evaluate(([a,c])=>{const f=id=>{const m=MATCHES.find(x=>x.id==="le"+id);return m&&{key:m.key,t1:m.t1,t2:m.t2,bo:m.bo,state:m.state,start:m.start}};return {m1:f(a),m3:f(c)}},[M1,M3]);R.checks.matchs=info;
  if(!info.m1||!info.m3||info.m1.state!=="soon"||info.m3.state!=="soon")throw new Error("matchs de test introuvables "+JSON.stringify(info));
  // A : fiche du match M1 → MKOI ; fiche M3 → G2 puis score 2-1
  const tapB=async(p,mid,team,score)=>{await goR(p,"m/le"+mid,1800);const ok=await p.evaluate(t=>{const x=NAV[NAV.length-1].el.querySelector(`.pkb[data-pick="${t}"]`);if(!x)return false;x.click();return true},team);await wait(900);
    let sc=null;if(score)sc=await p.evaluate(s=>{const x=NAV[NAV.length-1].el.querySelector(`.lea-sc [data-score="${s}"]`);if(!x)return false;x.click();return true},score);await wait(700);await home(p);return {ok,sc}};
  R.checks.pariA={m1:await tapB(A,M1,"MKOI"),m3:await tapB(A,M3,"G2","2-1")};
  // C : Mes paris › À parier (bouton de la ligne), puis le score exact dans En attente
  await goR(C,"bets/todo",1200);
  R.checks.pariC=await C.evaluate(([k1,k3])=>{const el=NAV[NAV.length-1].el,q=(k,t)=>el.querySelector(`.pkb[data-mk="${CSS.escape(k)}"][data-pick="${t}"]`);const a=q(k1,"MKOI"),c=q(k3,"G2");if(a)a.click();if(c)c.click();return {m1:!!a,m3:!!c}},[info.m1.key,info.m3.key]);
  await wait(1200);await C.evaluate(()=>{const b=NAV[NAV.length-1].el.querySelector('.seg [data-tab="run"]');b&&b.click()});await wait(900);
  R.checks.pariC.sc=await C.evaluate(k=>{const x=NAV[NAV.length-1].el.querySelector(`.lea-sc [data-score="2-0"][data-mk="${CSS.escape(k)}"]`);if(!x)return false;x.click();return true},info.m3.key);await wait(800);await home(C);
  // B (v13.5) : boutons de pari de son accueil (« Ce soir » / paris), sinon ceux de la fiche du match
  R.checks.pariB=await B.evaluate(async([k1,k3])=>{const res={};for(const [k,t] of [[k1,"CFO"],[k3,"KC"]]){let x=document.querySelector(`[data-pick="${t}"][data-mk="${CSS.escape(k)}"]`);
      if(!x){const m=MATCHES.find(m=>m.key===k);if(typeof matchSheet==="function"){matchSheet(m.id);await new Promise(r=>setTimeout(r,900));x=document.querySelector(`#sheetBody [data-pick="${t}"][data-mk="${CSS.escape(k)}"]`)}}
      res[k]=!!x;if(x)x.click();await new Promise(r=>setTimeout(r,500));if(document.getElementById("sheet")&&document.getElementById("sheet").classList.contains("on"))history.back();await new Promise(r=>setTimeout(r,500))}return res},[info.m1.key,info.m3.key]);
  R.checks.localPicks={A:await LSget(A,"picks"),Ascores:await LSget(A,"scores"),B:await LSget(B,"picks"),C:await LSget(C,"picks"),Cscores:await LSget(C,"scores")};
  // propagation par ntfy (publication 600 ms après le pari)
  const t1=Date.now();const has=(p,who,k)=>until(p,([who,k])=>Object.values(lg.players).some(x=>x.name===who&&x.p&&x.p[k]),[who,k],25000);
  R.timings.propagation={A_voit_B:await has(A,"Léa",info.m3.key),A_voit_C:await has(A,"Sam",info.m3.key),B_voit_A:await has(B,"Thomas",info.m3.key),B_voit_C:await has(B,"Sam",info.m3.key),C_voit_A:await has(C,"Thomas",info.m3.key),C_voit_B:await has(C,"Léa",info.m3.key)};
  R.timings.propagation_total_ms=Date.now()-t1;await wait(1500);
  R.checks.donnees={};for(const p of [A,B,C])R.checks.donnees[p.nm]=await p.evaluate(([k1,k3])=>Object.fromEntries(Object.values(lg.players).map(x=>[x.name,[x.p[k1]&&x.p[k1].w,x.p[k3]&&(x.p[k3].w+(x.p[k3].sc?" "+x.p[k3].sc:""))]])),[info.m1.key,info.m3.key]);
  // ---- 5. CACHÉS avant le coup d'envoi
  R.checks.caches={A:await viewB(A,M1),C:await viewB(C,M3),B:await viewA(B,M1),B3:await viewA(B,M3)};
  await goR(A,"m/le"+M1,1800);await A.screenshot({path:path.join(OUT,"ligue_A_avant_coup_envoi.png")});
  await A.evaluate(()=>{const el=NAV[NAV.length-1].el,x=el.querySelector(".lea-mb");if(x)el.scrollTop=x.offsetTop-80});await wait(400);await A.screenshot({path:path.join(OUT,"ligue_A_avant_coup_envoi_bloc.png")});await home(A);
  await goR(C,"lg/bt",1500);await C.screenshot({path:path.join(OUT,"ligue_C_qui_a_parie.png")});R.checks.caches.C_lgbt=await C.evaluate(()=>NAV[NAV.length-1].el.querySelector(".tabc").innerText.replace(/\s+/g," ").slice(0,400));await home(C);
  // ---- 6. coup d'envoi de M1 : horloge des 3 téléphones à 24/10 18:10Z, resynchro
  for(const p of [A,B,C])await p.clock.setSystemTime(new Date("2026-10-24T18:10:00Z"));
  await A.evaluate(()=>sync());await C.evaluate(()=>sync());await B.evaluate(()=>sync(false));await wait(2500);
  R.checks.reveles_M1={A:await viewB(A,M1),C:await viewB(C,M1),B:await viewA(B,M1)};R.checks.toujours_caches_M3={A:await viewB(A,M3),B:await viewA(B,M3)};
  await goR(A,"m/le"+M1,2000);R.checks.reveles_M1.A_onglets=await A.evaluate(()=>[...NAV[NAV.length-1].el.querySelectorAll(".segw .seg button")].map(b=>b.dataset.tab).join(","));
  await A.evaluate(()=>{const b=NAV[NAV.length-1].el.querySelector('.seg [data-tab="av"]');b&&b.click()});await wait(1200);
  R.checks.reveles_M1.A_ecran=await A.evaluate(()=>{const x=NAV[NAV.length-1].el.querySelector(".lea-mb");return x?x.innerText.replace(/\s+/g," "):null});
  await A.evaluate(()=>{const el=NAV[NAV.length-1].el,x=el.querySelector(".lea-mb");if(x)el.scrollTop=x.offsetTop-80});await wait(400);await A.screenshot({path:path.join(OUT,"ligue_A_apres_coup_envoi.png")});await home(A);
  await B.screenshot({path:path.join(OUT,"ligue_B_v13_apres_coup_envoi.png")});
  // ---- 7. résultats : M1 MKOI 1-0 ; puis M3 (25/10 19:00Z) G2 2-1
  RESULTS[M1]=[0,1];for(const p of [A,B,C])await p.clock.setSystemTime(new Date("2026-10-25T19:20:00Z"));
  await A.evaluate(async()=>{await loadSJ(true);await sync()});await C.evaluate(async()=>{await loadSJ(true);await sync()});await B.evaluate(async()=>{SJt=0;await loadSJ();await sync(false)});await wait(2000);
  R.checks.reveles_M3={A:await viewB(A,M3),B:await viewA(B,M3)};
  RESULTS[M3]=[2,1];for(const p of [A,B,C])await p.clock.setSystemTime(new Date("2026-10-25T21:40:00Z"));
  await A.evaluate(async()=>{await loadSJ(true);await sync()});await C.evaluate(async()=>{await loadSJ(true);await sync()});await B.evaluate(async()=>{SJt=0;await loadSJ();await sync(false)});await wait(2500);
  R.checks.resultats={};for(const p of [A,B,C])R.checks.resultats[p.nm]=await p.evaluate(([a,c])=>[a,c].map(id=>{const m=MATCHES.find(x=>x.id==="le"+id);return m.state+":"+m.winner+" "+m.s1+"-"+m.s2}),[M1,M3]);
  // ---- 8. classements
  const S=[await stand(A),await stand(B),await stand(C)];R.checks.classements={A:S[0],B_v13:S[1],C:S[2],identiques:S.every(s=>s===S[0])};
  // ce que montre l'écran Classement (refonte) et le bloc ligue de v13.5
  await goR(A,"lg/rk",1500);R.checks.ecranA=await A.evaluate(()=>NAV[NAV.length-1].el.querySelector(".tabc").innerText.replace(/\s+/g," ").slice(0,420));await A.screenshot({path:path.join(OUT,"ligue_A_classement.png")});
  await goR(C,"lg/rk",1500);R.checks.ecranC=await C.evaluate(()=>NAV[NAV.length-1].el.querySelector(".tabc").innerText.replace(/\s+/g," ").slice(0,420));await C.screenshot({path:path.join(OUT,"ligue_C_classement.png")});
  R.checks.ecranB=await B.evaluate(()=>{const d=document.createElement("div");d.innerHTML=duelHome(true);return [...d.querySelectorAll(".lbr")].map(x=>x.innerText.replace(/\s+/g," ")).join(" | ")});
  await B.evaluate(()=>{const x=document.querySelector(".duelbox");if(x)x.scrollIntoView()});await wait(500);await B.screenshot({path:path.join(OUT,"ligue_B_v13_classement.png")});
  R.checks.badges={A:await A.evaluate(()=>{try{return JSON.stringify(funBadges?Object.fromEntries(Object.entries(funBadges()).map(([k,v])=>[k,(v||[]).map(x=>x.k||x.t||x[0])])):null).slice(0,300)}catch(e){return "?"+e.message}})};
  R.checks.cles={};for(const p of [A,B,C])R.checks.cles[p.nm]=(await p.evaluate(()=>Object.keys(localStorage))).filter(k=>!/^w26_/.test(k));
  R.checks.ligueStockee={A:await LSget(A,"league").then(x=>x&&{code:x.code,me:x.me,n:Object.keys(x.players).length}),B:await LSget(B,"league").then(x=>x&&{code:x.code,me:x.me,n:Object.keys(x.players).length}),C:await LSget(C,"league").then(x=>x&&{code:x.code,me:x.me,n:Object.keys(x.players).length})};
  for(const p of [A,B,C])await p.ctx.close();
  }catch(e){R.crash=String(e.stack||e).slice(0,600)}
  await b.close();srv.close();fs.writeFileSync(path.join(__dirname,"qa","ligue.json"),JSON.stringify(R,null,1));console.log(JSON.stringify(R,null,1).slice(0,9000));
})();
