/* =====================================================================================
   test/smoke.js — parcours de dist/worlds-b.html sur 3 téléphones (iPhone 12 390×664, Pixel 7, 360×740) :
   chaque écran de la maquette B, mesures (hauteur ÷ écran, débordement horizontal), erreurs JS, clés localStorage,
   pari en un geste (pose puis annule), retour (bouton, geste depuis le bord, history.back), captures dans test/shots/.
   node test/smoke.js [iphone12|pixel7|w360] [--local] [--port N] [--dist dist/socle]
     --local : stats.json, fiche.json et draft.json lus dans lot1/data/*_pp.json (sinon le robot en ligne).
   Un serveur statique interne sert dist/ sur le port 8872 (aucune dépendance hors Playwright).
   ===================================================================================== */
const PW="C:/Users/vialo/AppData/Local/Temp/claude/c--Users-vialo-Desktop-Code-Worlds-2026/cead0307-273c-463a-8548-1b2491359512/scratchpad/pw/node_modules/playwright";
const {chromium,devices}=require(PW);const fs=require("fs"),path=require("path"),http=require("http");
const DIST0=path.join(__dirname,"../dist"),OUT=path.join(__dirname,"shots"),DATA=path.join(__dirname,"../../data");fs.mkdirSync(OUT,{recursive:true});
const ARGS=process.argv.slice(2),pi=ARGS.indexOf("--port"),PORT=pi>=0?+ARGS[pi+1]:8872,ONLY=ARGS.find((a,i)=>!a.startsWith("--")&&!["--port","--dist"].includes(ARGS[i-1])),LOCAL=ARGS.includes("--local");
const DI=ARGS.indexOf("--dist"),DIST2=DI>=0?path.resolve(__dirname,"..",ARGS[DI+1]):null;   // --dist dist/socle : page construite ailleurs (--out)
const DIST=DIST2||DIST0,BASE=`http://127.0.0.1:${PORT}/worlds-b.html`;
const DEV={iphone12:{...devices["iPhone 12"]},pixel7:{...devices["Pixel 7"]},w360:{...devices["Galaxy S9+"],viewport:{width:360,height:740},screen:{width:360,height:740}}};
const srv=http.createServer((q,s)=>{const f=path.join(DIST,decodeURIComponent(q.url.split("?")[0]));if(!f.startsWith(DIST)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);s.end();return}
  s.writeHead(200,{"content-type":/\.html$/.test(f)?"text/html; charset=utf-8":/\.js$/.test(f)?"text/javascript":/\.json$/.test(f)?"application/json":"application/octet-stream","cache-control":"no-store"});fs.createReadStream(f).pipe(s)});
const R={};
async function run(name,dev){
  const b=await chromium.launch();const ctx=await b.newContext({...dev,locale:"fr-FR",timezoneId:"Europe/Paris"});
  if(LOCAL)await ctx.route(/raw\.githubusercontent\.com\/Vialou07\/IA_Games\/stats[^/]*\/data\/(\w+)\.json/,r=>{const n=r.request().url().match(/data\/(\w+)\.json/)[1],f=path.join(DATA,n+"_pp.json");
    r.fulfill({status:fs.existsSync(f)?200:404,contentType:"application/json",body:fs.existsSync(f)?fs.readFileSync(f,"utf8"):""})});
  const p=await ctx.newPage();const errs=[],net=[];
  p.on("pageerror",e=>errs.push(e.message));
  p.on("console",m=>{if(m.type()==="error"&&!/Failed to load resource/.test(m.text()))errs.push("console "+m.text().slice(0,200))});
  p.on("requestfailed",r=>net.push(r.url().replace(/\?.*/,"").slice(0,90)+" "+(r.failure()&&r.failure().errorText)));
  const cdp=await ctx.newCDPSession(p);
  const res={screens:{},opens:[],errs,net,checks:{}};R[name]=res;
  p.setDefaultTimeout(20000);await p.goto(BASE+"?nointro",{waitUntil:"domcontentloaded"});
  await p.waitForFunction(()=>typeof MATCHES!=="undefined"&&MATCHES.length&&document.querySelector(".home .grid .w"),null,{timeout:45000});console.log(name,"accueil prêt");
  await p.waitForTimeout(5000);
  const C=await p.evaluate(()=>{const live=MATCHES.find(m=>m.state==="live"),soon=MATCHES.find(m=>m.state==="soon"&&m.t1&&m.t2),
    done1=[...MATCHES].reverse().find(m=>m.winner&&m.bo===1),done5=MATCHES.find(m=>m.winner&&m.bo===5&&m.s1+m.s2===5)||MATCHES.find(m=>m.winner&&m.bo>1);
    return {mo:homeMoment().k,live:live&&live.id,soon:soon&&soon.id,soonKey:soon&&soon.key,soonT:soon&&soon.t1,done1:done1&&done1.id,done5:done5&&done5.id,src:SOURCE,version:APP_VERSION}});
  res.ctx=C;
  const measure=async label=>{const m=await p.evaluate(()=>{const el=NAV.length?NAV[NAV.length-1].el:document.querySelector(".home");
      const over=[...el.querySelectorAll("*")].filter(x=>{const r=x.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left<-1)&&!x.closest(".hbg,.beam,.hc,.ph,.seg,.bans")}).slice(0,4).map(x=>x.className+"|"+Math.round(x.getBoundingClientRect().right));
      return {h:el.scrollHeight,ih:innerHeight,ratio:+(el.scrollHeight/innerHeight).toFixed(2),hscroll:el.scrollWidth>el.clientWidth+1||document.documentElement.scrollWidth>innerWidth+1,over}});
    res.screens[label]=m;return m};
  const top=()=>p.evaluate(()=>{const el=NAV.length?NAV[NAV.length-1].el:document.querySelector(".home");return el});
  const shot=async(label,scroll)=>{await p.screenshot({path:`${OUT}/${name}_${label}.png`});if(scroll){await p.evaluate(()=>{const el=NAV.length?NAV[NAV.length-1].el:document.querySelector(".home");el.scrollTop=el.scrollHeight});await p.waitForTimeout(350);await p.screenshot({path:`${OUT}/${name}_${label}_bas.png`});await p.evaluate(()=>{const el=NAV.length?NAV[NAV.length-1].el:document.querySelector(".home");el.scrollTop=0})}};
  const throttle=on=>cdp.send("Emulation.setCPUThrottlingRate",{rate:on?4:1});
  const openBy=async(sel,label)=>{await throttle(true);
    const ms=await p.evaluate(async s=>{const el=document.querySelector(s);if(!el)return -1;el.scrollIntoView({block:"center"});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
      const t0=performance.now();el.click();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return Math.round(performance.now()-t0)},sel);
    await throttle(false);res.opens.push([label,ms]);await p.waitForTimeout(900);return ms};
  const openRoute=async(r,wait=1500)=>{await p.evaluate(r=>go(r),r);await p.waitForTimeout(wait)};
  const tab=async k=>{await p.evaluate(k=>{if(!NAV.length)return;const el=NAV[NAV.length-1].el;const b=el.querySelector(`.seg [data-tab="${k}"]`);if(b)b.click()},k);await p.waitForTimeout(700)};
  const back=async()=>{if(await p.evaluate(()=>typeof NAV!=="undefined"&&(NAV.length>0||SHEET.open)))await p.evaluate(()=>history.back());await p.waitForTimeout(800)};   // jamais au-delà de l'accueil
  const depth=()=>p.evaluate(()=>NAV.length);
  /* typographie : nœuds texte avec une espace ordinaire avant « : ; ? ! % » (doit rester à 0) */
  const typo=()=>p.evaluate(()=>{const tw=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let x,n=0;const ex=[];while((x=tw.nextNode())){const e=x.parentElement;if(!e||/^(SCRIPT|STYLE)$/.test(e.nodeName))continue;if(/ [:;?!%]/.test(x.nodeValue)){n++;if(ex.length<3)ex.push(x.nodeValue.trim().slice(0,40))}}return {n,ex}});

  await measure("accueil");await shot("01_accueil",true);res.checks.typoHome=await typo();
  /* bloc asynchrone de v13.5 (ablock, extrait par le socle) : squelette, contenu, cache w26_ak_* */
  res.checks.ablock=await p.evaluate(async()=>{const box=document.createElement("div");box.innerHTML=ablock("smoke_t",async()=>({x:41}),d=>`<b id=\"akok\">${d.x+1}</b>`,1);HOME.scrollTop=0;HOME.querySelector(".scrin").prepend(box);
    await new Promise(r=>setTimeout(r,1500));const ok=document.getElementById("akok"),c=localStorage.getItem("w26_ak_smoke_t");box.remove();localStorage.removeItem("w26_ak_smoke_t");return {rendu:ok?ok.textContent:null,cache:!!c}});
  // pari en un geste : pose puis annule (w26_picks), boutons synchronisés
  if(C.soonKey){res.checks.pick=await p.evaluate(async([k,t])=>{const before=JSON.parse(localStorage.getItem("w26_picks")||"{}")[k]||null;
      setPick(k,t);const a=JSON.parse(localStorage.getItem("w26_picks")||"{}")[k]||null;const pressed=[...document.querySelectorAll(`[data-mk="${CSS.escape(k)}"][data-pick="${t}"]`)].every(b=>b.getAttribute("aria-pressed")==="true");
      setPick(k,t);const b2=JSON.parse(localStorage.getItem("w26_picks")||"{}")[k]||null;return {before,afterPick:a,pressed,afterCancel:b2}},[C.soonKey,C.soonT])}
  if(C.live){await openBy(`.home .w[data-go="m/${C.live}"]`,"direct");await p.waitForTimeout(4000);await measure("direct_joueurs");await shot("03_direct_joueurs",true);
    await tab("di");await p.waitForTimeout(1500);await measure("direct_direct");await shot("03_direct_direct",true);await tab("dr");await measure("direct_draft");await shot("03_direct_draft");
    await tab("av");await shot("03_direct_avant");await back()}
  if(C.soon){const sel=await p.evaluate(id=>document.querySelector(`.home [data-go="m/${id}"]`)?`.home [data-go="m/${id}"]`:null,C.soon);
    if(sel)await openBy(sel,"avenir");else await openRoute("m/"+C.soon);
    await p.waitForTimeout(2500);res.checks.typoMatch=await typo();await measure("avenir_apercu");await shot("02_avenir_apercu",true);
    await tab("pl");await measure("avenir_joueurs");await shot("02_avenir_joueurs");
    await openBy(".tabc .role","duel");await p.waitForTimeout(1500);await measure("duel");await shot("05_duel",true);await back();
    await tab("dr");await p.waitForTimeout(800);await measure("avenir_draft");await shot("02_avenir_draft",true);
    await tab("eq");await measure("avenir_equipes");await shot("02_avenir_equipes",true);
    await p.evaluate(()=>{const b=NAV[NAV.length-1].el.querySelector(".bar .ib");b&&b.click()});await p.waitForTimeout(500);await shot("08_feuille_info");
    await back();res.checks.sheetClosedByBack=await p.evaluate(()=>!document.querySelector("#sheet").classList.contains("on")&&NAV.length===1);
    await back()}
  res.checks.depthAfterBack=await depth();
  for(const [k,lab] of [["done1","04_termine_bo1"],["done5","04_termine_bo5"]]){if(!C[k])continue;
    await openRoute("m/"+C[k],6000);await measure(lab);await shot(lab,true);
    if(k==="done5"){await tab("gm");await shot(lab+"_parties")}
    await tab("pl");await p.waitForTimeout(2500);await measure(lab+"_joueurs");await shot(lab+"_joueurs");await tab("dr");await shot(lab+"_draft");await back()}
  /* le widget du classement n'est pas sur l'accueil à tous les moments (ex. after) : sinon, par la route */
  if(await p.evaluate(()=>!!document.querySelector('.home .w[data-go^="rk/"]')))await openBy(`.home .w[data-go^="rk/"]`,"classement");else await openRoute("rk/TOP",800);await p.waitForTimeout(800);await measure("classement");await shot("06_classement",true);
  await tab("MID");await measure("classement_mid");await shot("06_classement_mid");
  if(await openBy(".tabc .podium [data-go^=\"p/\"],.tabc [data-go^=\"p/\"],.tabc [data-p]","joueur")<0)await openRoute("p/T1_faker");await p.waitForTimeout(2500);await measure("joueur_saison");await shot("05_joueur_saison",true);
  await tab("du");await p.waitForTimeout(600);await measure("joueur_duels");await shot("05_joueur_duels",true);
  await tab("ch");await measure("joueur_champions");await shot("05_joueur_champions",true);
  const before=await depth();
  try{await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x:6,y:400}]});
    for(let x=20;x<=260;x+=40){await cdp.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x,y:404}]});await p.waitForTimeout(16)}
    await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});await p.waitForTimeout(800)}catch(e){res.checks.swipeErr=e.message}
  res.checks.swipeBack=[before,await depth()];
  await back();
  for(const [w,lab] of [["sim","07_simulation"],["bets","07_paris"],["fx","07_faits"]]){const ok=await p.evaluate(w=>!!document.querySelector(`.home .w[data-go="${w}"]`),w);if(!ok)continue;
    await openBy(`.home .w[data-go="${w}"]`,lab);await measure(lab);await shot(lab,true);if(w==="bets"){await tab("done");await shot("07_paris_bilan")}await back()}
  if(await p.evaluate(()=>!!document.querySelector('.home .w[data-go^="cal"]'))){await openBy(`.home .w[data-go^="cal"]`,"calendrier");await measure("calendrier");await shot("07_calendrier",true);await back()}
  // routes du registre : chaque écran déclaré s'ouvre sans erreur (avec un identifiant plausible)
  res.checks.routes=await p.evaluate(async()=>{const ids={m:MATCHES.find(m=>m.t1&&m.t2)?.id,p:"T1_faker",d:"T1_faker~GEN_chovy",rk:"TOP",fx:"0",t:"T1"},out={};
    for(const v of Object.keys(ROUTES)){const r=v+(ids[v]?"/"+ids[v]:"");const n0=NAV.length;try{go(r);await new Promise(x=>setTimeout(x,600));out[v]=NAV.length>n0?"ok":"pas ouvert";history.back();await new Promise(x=>setTimeout(x,500))}catch(e){out[v]="ERREUR "+e.message}}return out});
  res.checks.finalDepth=await depth();
  res.checks.storage=await p.evaluate(()=>Object.keys(localStorage).sort());
  res.checks.badKeys=res.checks.storage.filter(k=>!/^w26_/.test(k));
  for(const mo of ["soon","after","rest"]){await p.goto(BASE+"?nointro&mo="+mo,{waitUntil:"domcontentloaded"});await p.waitForFunction(()=>document.querySelector(".home .grid .w"),null,{timeout:30000});await p.waitForTimeout(3000);await measure("accueil_"+mo);await shot("01_accueil_"+mo)}
  await b.close();
}
(async()=>{
  await new Promise(r=>srv.listen(PORT,"127.0.0.1",r));
  for(const [n,d] of Object.entries(DEV)){if(ONLY&&ONLY!==n)continue;try{await run(n,d)}catch(e){R[n]=R[n]||{};R[n].crash=e.message.slice(0,300)}}
  srv.close();fs.writeFileSync(path.join(__dirname,"smoke_results.json"),JSON.stringify(R,null,1));
  let bad=0;
  for(const [n,x] of Object.entries(R)){console.log("=== "+n);if(x.crash){bad++;console.log("CRASH",x.crash)}if(x.ctx)console.log(JSON.stringify(x.ctx));
    if(x.screens)Object.entries(x.screens).forEach(([k,v])=>console.log(k.padEnd(26),v.ratio,v.hscroll?"HSCROLL":"",v.over.length?JSON.stringify(v.over):""));
    if(x.opens)console.log("ouvertures CPU×4 (ms):",x.opens.map(o=>o.join(" ")).join(" | "));
    if(x.checks)console.log("contrôles:",JSON.stringify(x.checks));
    if(x.errs){console.log("erreurs JS:",x.errs.length,x.errs.slice(0,6).join(" || "));bad+=x.errs.length}
    if(x.net&&x.net.length)console.log("réseau en échec:",x.net.length,[...new Set(x.net)].slice(0,4).join(" || "))}
  process.exit(bad?1:0);
})();
