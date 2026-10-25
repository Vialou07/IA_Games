/* =====================================================================================
   test/stats.js — module stats : écran st (5 onglets), faits fx et fxl, widget « Le saviez-vous ? », aide staFactsBlk.
   node test/stats.js [iphone12|pixel7|w360] [--local] [--dist=<dossier contenant worlds-b.html>] [--shots] [--edge]
     --local : stats/fiche/draft lus dans lot1/data/*_pp.json ; --shots : captures dans shots/stats/
     --edge : cas limites (draft.json absent : repli « picks seuls » ; stats.json absent : message + Réessayer, puis cache w26_ak_tourney de v13.5)
   Mesures par écran : dépassement (px, doit valoir 0 ou ≥ 120), hauteur ÷ écran, défilement horizontal, typographie, erreurs JS.
   Serveur statique sur le port 8903 (port du module stats).
   ===================================================================================== */
const PW="C:/Users/vialo/AppData/Local/Temp/claude/c--Users-vialo-Desktop-Code-Worlds-2026/cead0307-273c-463a-8548-1b2491359512/scratchpad/pw/node_modules/playwright";
const {chromium,devices}=require(PW);const fs=require("fs"),path=require("path"),http=require("http");
const ARGS=process.argv.slice(2),ONLY=ARGS.find(a=>!a.startsWith("--")),LOCAL=ARGS.includes("--local"),SHOTS=ARGS.includes("--shots");
const DIST=path.resolve((ARGS.find(a=>a.startsWith("--dist="))||"").slice(7)||path.join(__dirname,"../dist"));
const OUT=path.join(__dirname,"../shots/stats"),DATA=path.join(__dirname,"../../data"),PORT=8903;fs.mkdirSync(OUT,{recursive:true});
const DEV={iphone12:{...devices["iPhone 12"]},pixel7:{...devices["Pixel 7"]},w360:{...devices["Galaxy S9+"],viewport:{width:360,height:740},screen:{width:360,height:740}}};
const srv=http.createServer((q,s)=>{const f=path.join(DIST,decodeURIComponent(q.url.split("?")[0]));if(!f.startsWith(DIST)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);s.end();return}
  s.writeHead(200,{"content-type":/\.html$/.test(f)?"text/html; charset=utf-8":"application/octet-stream","cache-control":"no-store"});fs.createReadStream(f).pipe(s)});
const R={},EDGE=ARGS.includes("--edge");
async function edge(name,dev){
  const res={errs:[],checks:{}};R[name]=res;const DS=JSON.parse(fs.readFileSync(path.join(DATA,"stats_pp.json"),"utf8"));
  for(const mode of ["nodraft","nostats","cache"]){
    const b=await chromium.launch();const ctx=await b.newContext({...dev,locale:"fr-FR",timezoneId:"Europe/Paris"});
    await ctx.route(/raw\.githubusercontent\.com\/Vialou07\/IA_Games\/stats[^/]*\/data\/(\w+)\.json/,r=>{const n=r.request().url().match(/data\/(\w+)\.json/)[1],f=path.join(DATA,n+"_pp.json");
      const off=(mode==="nodraft"&&n==="draft")||(mode!=="nodraft"&&n==="stats");r.fulfill({status:off?404:200,contentType:"application/json",body:off?"":fs.readFileSync(f,"utf8")})});
    if(mode==="cache")await ctx.addInitScript(d=>{try{localStorage.setItem("w26_ak_tourney",JSON.stringify({t:Date.now(),d}))}catch(e){}},DS.tourney);
    const p=await ctx.newPage();p.on("pageerror",e=>res.errs.push(mode+" "+e.message));
    await p.goto(`http://127.0.0.1:${PORT}/worlds-b.html?nointro`);await p.waitForFunction(()=>typeof MATCHES!=="undefined"&&MATCHES.length&&document.querySelector(".home .grid .w"),null,{timeout:45000});await p.waitForTimeout(2500);
    const T=sel=>p.evaluate(s=>{const el=NAV[NAV.length-1].el.querySelector(s);return el?el.textContent.replace(/\s+/g," ").trim().slice(0,160):null},sel);
    await p.evaluate(()=>go("st/ch"));await p.waitForTimeout(2000);
    const c={ch:await T(".sta"),rows:await p.evaluate(()=>NAV[NAV.length-1].el.querySelectorAll(".sta-cr").length)};
    await p.evaluate(()=>{const b=NAV[NAV.length-1].el.querySelector('.seg [data-tab="to"]');b&&b.click()});await p.waitForTimeout(600);c.to=await T(".sta");
    if(mode==="nostats"){c.retry=await p.evaluate(()=>!!NAV[NAV.length-1].el.querySelector("[data-sta-retry]"));await p.evaluate(()=>NAV[NAV.length-1].el.querySelector("[data-sta-retry]").click());await p.waitForTimeout(2000);c.afterRetry=await T(".sta")}
    if(SHOTS)await p.screenshot({path:`${OUT}/${name}_edge_${mode}.png`});
    await p.evaluate(()=>history.back());await p.waitForTimeout(600);await p.evaluate(()=>go("fx"));await p.waitForTimeout(1500);c.fx=await T(".tabc");
    res.checks[mode]=c;await b.close()}
}
async function run(name,dev){if(EDGE)return edge(name,dev);
  const b=await chromium.launch();const ctx=await b.newContext({...dev,locale:"fr-FR",timezoneId:"Europe/Paris"});
  if(LOCAL)await ctx.route(/raw\.githubusercontent\.com\/Vialou07\/IA_Games\/stats[^/]*\/data\/(\w+)\.json/,r=>{const n=r.request().url().match(/data\/(\w+)\.json/)[1],f=path.join(DATA,n+"_pp.json");
    r.fulfill({status:fs.existsSync(f)?200:404,contentType:"application/json",body:fs.existsSync(f)?fs.readFileSync(f,"utf8"):""})});
  const p=await ctx.newPage();const errs=[];
  p.on("pageerror",e=>errs.push(e.message));
  p.on("console",m=>{if(m.type()==="error"&&!/Failed to load resource|ERR_|net::/.test(m.text()))errs.push("console "+m.text().slice(0,200))});
  const res={screens:{},errs,checks:{}};R[name]=res;
  await p.goto(`http://127.0.0.1:${PORT}/worlds-b.html?nointro`,{waitUntil:"domcontentloaded"});
  await p.waitForFunction(()=>typeof MATCHES!=="undefined"&&MATCHES.length&&document.querySelector(".home .grid .w")&&typeof SJ!=="undefined"&&SJ,null,{timeout:45000});
  await p.waitForTimeout(3000);
  const top=`(NAV.length?NAV[NAV.length-1].el:document.querySelector(".home"))`;
  const measure=async label=>{const m=await p.evaluate(top=>{const el=eval(top);
      const over=[...el.querySelectorAll("*")].filter(x=>{const r=x.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left<-1)&&!x.closest(".hbg,.beam,.hc,.ph")}).slice(0,4).map(x=>(x.className||x.nodeName)+"|"+Math.round(x.getBoundingClientRect().right));
      const tw=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let x,typo=0;const ex=[];while((x=tw.nextNode())){if(/ [:;?!%]/.test(x.nodeValue)){typo++;if(ex.length<2)ex.push(x.nodeValue.trim().slice(0,40))}}
      const small=[...el.querySelectorAll("button,[role=button],summary,a")].filter(x=>{const r=x.getBoundingClientRect();return r.width>0&&r.height>0&&r.height<40&&!x.closest(".seg,.bar,#sheet")&&getComputedStyle(x).visibility!=="hidden"}).slice(0,5).map(x=>(x.className||x.nodeName)+"|"+Math.round(x.getBoundingClientRect().height));
      const ell=[...el.querySelectorAll(".seg button")].filter(b=>b.scrollWidth>b.clientWidth+1).map(b=>b.textContent);
      const c=el.querySelector(".tabc");let bot=0;if(c){const top0=el.getBoundingClientRect().top-el.scrollTop;c.querySelectorAll("*").forEach(x=>{if(x.closest("details:not([open])>:not(summary)"))return;const r=x.getBoundingClientRect();if(r.height)bot=Math.max(bot,r.bottom-top0)})}
      return {room:c?Math.round(el.clientHeight-bot-parseFloat(getComputedStyle(c).paddingBottom)-parseFloat(getComputedStyle(el).paddingBottom)):null,dep:el.scrollHeight-el.clientHeight,ratio:+(el.scrollHeight/innerHeight).toFixed(2),hscroll:el.scrollWidth>el.clientWidth+1||document.documentElement.scrollWidth>innerWidth+1,over,typo,ex,small,ell}},top);
    m.mini=m.dep>0&&m.dep<120;res.screens[label]=m;return m};
  const shot=async(label,scroll)=>{if(!SHOTS)return;await p.screenshot({path:`${OUT}/${name}_${label}.png`});
    if(scroll){const d=await p.evaluate(top=>{const el=eval(top);el.scrollTop=el.scrollHeight;return el.scrollHeight-el.clientHeight},top);if(d>0){await p.waitForTimeout(300);await p.screenshot({path:`${OUT}/${name}_${label}_bas.png`});await p.evaluate(top=>{eval(top).scrollTop=0},top)}}};
  const go=async(r,w=1200)=>{await p.evaluate(r=>go(r),r);await p.waitForTimeout(w)};
  const tab=async k=>{await p.evaluate(k=>{const b=NAV[NAV.length-1].el.querySelector(`.seg [data-tab="${k}"]`);b&&b.click()},k);await p.waitForTimeout(600)};
  const click=async sel=>{const ok=await p.evaluate(s=>{const el=NAV[NAV.length-1].el.querySelector(s)||document.querySelector(s);if(!el)return false;el.click();return true},sel);await p.waitForTimeout(500);return ok};
  const back=async()=>{await p.evaluate(()=>history.back());await p.waitForTimeout(700)};
  const text=sel=>p.evaluate(s=>{const el=NAV.length?NAV[NAV.length-1].el.querySelector(s):document.querySelector(s);return el?el.textContent.replace(/\s+/g," ").trim():null},sel);

  /* accueil : widget « Le saviez-vous ? » */
  res.checks.widget=await p.evaluate(()=>{const w=document.querySelector('.home .w[data-go="fx"]');return w?w.textContent.replace(/\s+/g," ").trim().slice(0,80):null});
  /* st : 5 onglets */
  await go("st",1800);
  for(const [k,lab] of [["to","tournoi"],["ld","leaders"],["ch","champions"],["lg","ligues"],["nb","chiffres"]]){await tab(k);await p.waitForTimeout(k==="nb"?1400:300);await measure("st_"+lab);await shot("st_"+lab,true)}
  await tab("to");
  res.checks.tournoi={tiles:await p.evaluate(()=>NAV[NAV.length-1].el.querySelectorAll(".sta-t").length),split:await text(".sta-sd"),records:await p.evaluate(()=>[...NAV[NAV.length-1].el.querySelectorAll(".sta-rk")].map(x=>x.textContent.replace(/\s+/g," ").trim())),
    recLinks:await p.evaluate(()=>NAV[NAV.length-1].el.querySelectorAll(".sta-rk[data-go]").length),fact:await text(".sta-fe")};
  /* le champion le plus présent mène à l'onglet Champions */
  await click('.sta-t[data-tab="ch"]');res.checks.tileToChamps=await p.evaluate(()=>NAV[NAV.length-1].d.tab);
  /* leaders : catégorie et phase sans rechargement */
  await tab("ld");
  const l0=await text(".sta .list");await click('[data-leadcat="kills"]');const l1=await text(".sta .list");
  await click('[data-leadph="pi"]');const l2=await text(".sta .list");
  res.checks.leaders={cats:await p.evaluate(()=>[...NAV[NAV.length-1].el.querySelectorAll("[data-leadcat]")].map(b=>b.textContent)),changedCat:l0!==l1,changedPh:l1!==l2,rows:await p.evaluate(()=>NAV[NAV.length-1].el.querySelectorAll(".sta-lr").length),
    linked:await p.evaluate(()=>NAV[NAV.length-1].el.querySelectorAll(".sta-lr[data-p]").length),note:await text(".sta .note")};
  await measure("st_leaders_pi");await shot("st_leaders_pi");
  await click('[data-leadph="main"]');await click('[data-leadcat="kda"]');
  await click(".sta-lr[data-p]");res.checks.leaderOpens=await p.evaluate(()=>NAV[NAV.length-1].d.v+"/"+(NAV[NAV.length-1].d.id||""));await back();
  /* champions : tri, liste complète, feuille d'un champion, joueur depuis la feuille */
  await tab("ch");
  const c0=await text(".sta-cr");await click('[data-sta-ck="ban"]');const c1=await text(".sta-cr");await click('[data-sta-ck="pick"]');const c2=await text(".sta-cr");
  await shot("st_champions_joues");
  await click('[data-sta-ck="pres"]');
  const n5=await p.evaluate(()=>NAV[NAV.length-1].el.querySelectorAll(".sta-cr").length);await click("[data-sta-chall]");const nAll=await p.evaluate(()=>NAV[NAV.length-1].el.querySelectorAll(".sta-cr").length);
  await measure("st_champions_tous");await click("[data-sta-chall]");
  await click(".sta-cr");await p.waitForTimeout(400);
  const sh=await p.evaluate(()=>({on:document.querySelector("#sheet").classList.contains("on"),t:document.querySelector("#shT").textContent,who:document.querySelectorAll("#shB .sta-wp").length,txt:document.querySelector("#shB").textContent.replace(/\s+/g," ").slice(0,220)}));
  if(SHOTS)await p.screenshot({path:`${OUT}/${name}_st_champion_feuille.png`});
  const d0=await p.evaluate(()=>NAV.length);await p.evaluate(()=>{const b=document.querySelector("#shB [data-sta-go]");b&&b.click()});await p.waitForTimeout(1200);
  const fromSheet=await p.evaluate(()=>({sheet:document.querySelector("#sheet").classList.contains("on"),depth:NAV.length,v:NAV[NAV.length-1].d.v}));await back();
  const afterBack=await p.evaluate(()=>({depth:NAV.length,v:NAV[NAV.length-1]&&NAV[NAV.length-1].d.v,tab:NAV[NAV.length-1]&&NAV[NAV.length-1].d.tab}));
  res.checks.champions={first:c0,bans:c1,picks:c2,n5,nAll,sheet:sh,fromSheet:{...fromSheet,d0},afterBack};
  /* ligues : déplier une ligue */
  await tab("lg");
  res.checks.ligues={rows:await p.evaluate(()=>[...NAV[NAV.length-1].el.querySelectorAll(".sta-lgr")].map(x=>x.querySelector(".lc b").textContent+" "+x.querySelector(".fv").textContent+" "+x.querySelector(".wl").textContent)),ans:await text(".sta-ans")};
  await p.evaluate(()=>{const d=NAV[NAV.length-1].el.querySelector("details.sta-lgr");if(d)d.open=true});await p.waitForTimeout(300);
  res.checks.ligues.series=await p.evaluate(()=>NAV[NAV.length-1].el.querySelectorAll("details.sta-lgr[open] .mrow").length);await shot("st_ligues_ouverte");
  await p.evaluate(()=>{const d=NAV[NAV.length-1].el.querySelector("details.sta-lgr[open]");if(d)d.open=false;const g=NAV[NAV.length-1].el.querySelector(".sta-lgv");if(g)g.open=true});await p.waitForTimeout(300);
  res.checks.ligues.h2h=await p.evaluate(()=>NAV[NAV.length-1].el.querySelectorAll(".sta-vv").length);await shot("st_ligues_h2h");
  await p.evaluate(()=>{const g=NAV[NAV.length-1].el.querySelector(".sta-lgv");if(g)g.open=false});
  /* chiffres : puces +n */
  await tab("nb");
  res.checks.chiffres={nums:await p.evaluate(()=>[...NAV[NAV.length-1].el.querySelectorAll(".sta-nn")].map(x=>x.textContent)),
    preview:await p.evaluate(()=>NAV[NAV.length-1].el.querySelectorAll(".sta-pv img,.sta-pv .mono,.sta-fc .ava,.sta-fc .mono").length)};
  await click('details.sta-nr[data-uo="sta_nb_leg"] summary');
  res.checks.chiffres.chipsLeg=await p.evaluate(()=>NAV[NAV.length-1].el.querySelectorAll('details.sta-nr[open] .chip[data-p]').length);
  await measure("st_chiffres_ouvert");await shot("st_chiffres_ouvert");
  await click('details.sta-nr[open] .chip[data-p]');res.checks.chiffres.chipOpens=await p.evaluate(()=>NAV[NAV.length-1].d.v+"/"+NAV[NAV.length-1].d.id);await back();
  await click('details.sta-nr[data-uo="sta_nb_leg"] summary');
  /* feuilles « i » du domaine */
  res.checks.infos={};
  for(const k of ["sta:src","sta:to","sta:rec","sta:ld","sta:ch","sta:lg","sta:nb","fx:0"]){await p.evaluate(k=>openInfo(k),k);await p.waitForTimeout(250);
    res.checks.infos[k]=await p.evaluate(()=>document.querySelector("#sheet").classList.contains("on")?document.querySelector("#shT").textContent:null);await p.evaluate(()=>closeSheet());await p.waitForTimeout(350)}
  await back();
  /* faits : départ après le dernier vu, suivant, précédent, glisser, toucher la carte, liste */
  const lsv0=await p.evaluate(()=>localStorage.getItem("w26_lsv"));
  await go("fx",900);const f0=await p.evaluate(()=>NAV[NAV.length-1].d.id);await measure("fx");await shot("fx");
  await click('[data-fx="1"]');const f1=await p.evaluate(()=>NAV[NAV.length-1].d.id);
  await click('[data-fx="-1"]');const f2=await p.evaluate(()=>NAV[NAV.length-1].d.id);
  await click("#fxc p");const f3=await p.evaluate(()=>NAV[NAV.length-1].d.id);
  const sw=await p.evaluate(async()=>{const c=document.querySelector("#fxc");const r=c.getBoundingClientRect(),y=r.top+r.height/2;
    const T=(x)=>new Touch({identifier:1,target:c,clientX:x,clientY:y});
    c.dispatchEvent(new TouchEvent("touchstart",{bubbles:true,touches:[T(300)],changedTouches:[T(300)]}));c.dispatchEvent(new TouchEvent("touchend",{bubbles:true,touches:[],changedTouches:[T(150)]}));
    await new Promise(r=>setTimeout(r,400));return NAV[NAV.length-1].d.id});
  const lsv1=await p.evaluate(()=>localStorage.getItem("w26_lsv"));const hashF=await p.evaluate(()=>location.hash);
  await back();const w2=await p.evaluate(()=>{const w=document.querySelector('.home .w[data-go="fx"]');return w?w.textContent.replace(/\s+/g," ").trim().slice(0,80):null});
  await go("fx",800);const f4=await p.evaluate(()=>NAV[NAV.length-1].d.id);
  res.checks.facts={lsv0,start:f0,next:f1,prev:f2,tap:f3,swipe:sw,lsv1,hash:hashF,widgetAfter:w2,reopen:f4,startsAfterLastSeen:f4===(sw+1)%(await p.evaluate(()=>staFxList().length))};
  await click('[data-go="fxl"]');await p.waitForTimeout(600);await measure("fxl");await shot("fxl");
  res.checks.factList=await p.evaluate(()=>NAV[NAV.length-1].el.querySelectorAll(".sta-fxl .rowb").length);
  await click('.sta-fxl .rowb[data-go="fx/3"]');res.checks.factFromList=await p.evaluate(()=>NAV[NAV.length-1].d.v+"/"+NAV[NAV.length-1].d.id);await back();await back();await back();
  /* aide staFactsBlk (F-02) pour les fiches joueur et équipe */
  res.checks.factsBlk=await p.evaluate(()=>({KC:(staFactsBlk(["KC"]).match(/sta-fm"/g)||[]).length,faker:(staFactsBlk(["T1_faker"]).match(/sta-fm"/g)||[]).length,none:staFactsBlk(["XXX"])===""}));
  /* clés localStorage : seulement w26_ */
  res.checks.keys=await p.evaluate(()=>Object.keys(localStorage).filter(k=>!k.startsWith("w26_")));
  res.checks.depth=await p.evaluate(()=>NAV.length);
  await b.close();
}
(async()=>{await new Promise(r=>srv.listen(PORT,"127.0.0.1",r));
  for(const [n,d] of Object.entries(DEV)){if(ONLY&&ONLY!==n)continue;try{await run(n,d)}catch(e){(R[n]=R[n]||{}).fatal=String(e.stack||e).slice(0,600)}
    console.log("== "+n);const r=R[n];console.log(JSON.stringify(r,null,1))}
  fs.writeFileSync(path.join(__dirname,"stats_results.json"),JSON.stringify(R,null,1));srv.close()})();
