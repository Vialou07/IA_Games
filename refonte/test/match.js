/* =====================================================================================
   test/match.js — fiche de match de la refonte B (module match) sur 3 téléphones : Pixel 7, iPhone 12 (390×664), 360×740.
   Données figées : robot = test/match_data/live_{stats,fiche,draft}.json (copie du 25/10 01:54), API LoL Esports = events/*.json
   (getEventDetails réels, modifiés par scénario), planning = robot (getSchedule refusé), flux officiel = caches disque
   (lot1/flux/t2/fcache, lot1/ui_match/test/fcache, test/match_data/fcache) sinon lu et mémorisé. Horloge de la page décalée.
   Scénarios : soon (TLAW-BLG à venir), done (KC-C9 Bo5 3-2, HLE-GEN Bo1), duel, live (KC-AL rejoué, horloge accélérée),
   between (KC-MVK entre P1 et P2), wait (résultat en attente, saisie à la main), err (flux coupé).
   node test/match.js [pixel7|iphone12|w360] [scénario…]   → captures dans shots/match/, résultats dans test/match_results.json
   ===================================================================================== */
const PW="C:/Users/vialo/AppData/Local/Temp/claude/c--Users-vialo-Desktop-Code-Worlds-2026/cead0307-273c-463a-8548-1b2491359512/scratchpad/pw/node_modules/playwright";
const {chromium,devices}=require(PW);const fs=require("fs"),path=require("path"),http=require("http"),crypto=require("crypto");
const ROOT=path.join(__dirname,".."),DIST=path.join(ROOT,"dist"),OUT=path.join(ROOT,"shots","match"),MD=path.join(__dirname,"match_data"),LOT=path.join(ROOT,"..");
const FC=[path.join(LOT,"flux/t2/fcache"),path.join(LOT,"ui_match/test/fcache"),path.join(MD,"fcache")];fs.mkdirSync(FC[2],{recursive:true});fs.mkdirSync(OUT,{recursive:true});
const PORT=8905,BASE=`http://127.0.0.1:${PORT}/worlds-b.html`;
const ARGS=process.argv.slice(2),DEVS=ARGS.filter(a=>/^(pixel7|iphone12|w360)$/.test(a)),SCN=ARGS.filter(a=>!/^(pixel7|iphone12|w360)$/.test(a));
const DEV={pixel7:{...devices["Pixel 7"]},iphone12:{...devices["iPhone 12"]},w360:{...devices["Galaxy S9+"],viewport:{width:360,height:740},screen:{width:360,height:740}}};
const EV={};for(const f of fs.readdirSync(path.join(MD,"events")))EV[f.replace(".json","")]=JSON.parse(fs.readFileSync(path.join(MD,"events",f),"utf8"));
const FIX=JSON.parse(fs.readFileSync(path.join(LOT,"flux/tests/fixtures_events.json"),"utf8"));for(const k in FIX)if(!EV[k])EV[k]=FIX[k];
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const srv=http.createServer((q,s)=>{const f=path.join(DIST,decodeURIComponent(q.url.split("?")[0]));if(!f.startsWith(DIST)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);s.end();return}
  s.writeHead(200,{"content-type":/\.html$/.test(f)?"text/html; charset=utf-8":"application/octet-stream","cache-control":"no-store"});fs.createReadStream(f).pipe(s)});
const R={};

async function mkPage(b,dev,sc){
  const ctx=await b.newContext({...dev,locale:"fr-FR",timezoneId:"Europe/Paris"});
  await ctx.route(/raw\.githubusercontent\.com\/Vialou07\/IA_Games\/stats[^/]*\/data\/(\w+)\.json/,r=>{const n=r.request().url().match(/data\/(\w+)\.json/)[1],f=path.join(MD,"live_"+n+".json");
    r.fulfill({status:fs.existsSync(f)?200:404,contentType:"application/json",body:fs.existsSync(f)?fs.readFileSync(f,"utf8"):""})});
  await ctx.route(/esports-api\.lolesports\.com\/persisted\/gw\/(\w+)/,r=>{const u=new URL(r.request().url()),op=u.pathname.split("/").pop(),hdr={"access-control-allow-origin":"*","content-type":"application/json"};
    if(op==="getEventDetails"){const id=u.searchParams.get("id"),j=JSON.parse(JSON.stringify(EV[id]||{data:{}}));if(j.data.event&&sc.ev)sc.ev(id,j.data.event.match);if(sc.apiDown)return r.fulfill({status:503,headers:hdr,body:""});return r.fulfill({status:200,headers:hdr,body:JSON.stringify(j)})}
    if(op==="getLive")return r.fulfill({status:200,headers:hdr,body:JSON.stringify({data:{schedule:{events:[]}}})});
    return r.fulfill({status:503,headers:hdr,body:""})});
  await ctx.route(/feed\.lolesports\.com\/livestats\/v1\/(window|details)\//,async r=>{const hdr={"access-control-allow-origin":"*","content-type":"application/json"};
    if(sc.feedDown)return r.abort();
    const u=new URL(r.request().url()),p=u.pathname.replace("/livestats/v1/","")+u.search,h=crypto.createHash("md5").update(p).digest("hex")+".json";
    for(const d of FC){const fp=path.join(d,h);if(fs.existsSync(fp)){const s=fs.readFileSync(fp,"utf8");return s==="null"?r.fulfill({status:204,headers:hdr,body:""}):r.fulfill({status:200,headers:hdr,body:s})}}
    for(let a=0;a<3;a++){try{const res=await r.fetch({timeout:20000}),body=await res.text();if(res.status()===200)fs.writeFileSync(path.join(FC[2],h),body);else if(res.status()===204)fs.writeFileSync(path.join(FC[2],h),"null");return r.fulfill({status:res.status(),headers:hdr,body})}catch(e){await wait(400*(a+1))}}
    return r.abort()});
  await ctx.route(/ntfy\.sh|lol\.fandom\.com|wikipedia\.org/,r=>r.abort());
  await ctx.addInitScript(([t0,fast])=>{const RD=Date;let off=t0?t0-RD.now():0;window.__adv=ms=>{off+=ms};window.__now=()=>RD.now()+off;
    class FD extends RD{constructor(...a){if(a.length)super(...a);else super(RD.now()+off)}static now(){return RD.now()+off}}FD.parse=RD.parse;FD.UTC=RD.UTC;window.Date=FD;
    window.__TICKS=0;if(fast){const st=window.setTimeout;window.setTimeout=(fn,d,...a)=>(fn&&fn.name==="run"&&(d===10000||d===30000)&&!window.__STOP)?st(()=>{off+=10000;window.__TICKS++;fn(...a)},40):st(fn,d,...a)}},[sc.t0||0,!!sc.fast]);
  const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));p.on("console",m=>{if(m.type()==="error"&&!/Failed to load resource|net::ERR|ERR_FAILED/.test(m.text()))errs.push("console "+m.text().slice(0,200))});
  p.setDefaultTimeout(30000);await p.goto(BASE+"?nointro",{waitUntil:"domcontentloaded"});
  await p.waitForFunction(()=>typeof MATCHES!=="undefined"&&MATCHES.length>10&&SJ&&document.querySelector(".home .grid"),null,{timeout:60000});
  await p.evaluate(async()=>{await Promise.all([loadFJ(),loadDJ(),champMap()])});await wait(800);
  return {p,ctx,errs};
}
/* mesures de l'écran du dessus : hauteur ÷ écran, dépassement (px), défilement horizontal, éléments qui débordent, typographie */
const measure=p=>p.evaluate(()=>{const el=NAV.length?NAV[NAV.length-1].el:document.querySelector(".home");
  const over=[...el.querySelectorAll("*")].filter(x=>{const r=x.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left<-1)&&!x.closest(".hbg,.beam,.hc,.ph,.bans,.mat-grid")}).slice(0,4).map(x=>(x.className||x.tagName)+"|"+Math.round(x.getBoundingClientRect().right));
  const tw=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let x,typo=0;const ex=[];while((x=tw.nextNode())){if(/ [:;?!%]/.test(x.nodeValue)){typo++;if(ex.length<3)ex.push(x.nodeValue.trim().slice(0,50))}}
  const small=[...el.querySelectorAll("button,[role=button],a")].filter(b=>{const r=b.getBoundingClientRect();return r.width>0&&r.height>0&&(r.height<38||r.width<34)&&!b.closest(".seg,.bans,.mat-grid,.hc")}).slice(0,4).map(b=>(b.className||b.tagName)+" "+Math.round(b.getBoundingClientRect().width)+"×"+Math.round(b.getBoundingClientRect().height));
  return {cls:el.className,ratio:+(el.scrollHeight/innerHeight).toFixed(2),over:el.scrollHeight-el.clientHeight,hscroll:el.scrollWidth>el.clientWidth+1||document.documentElement.scrollWidth>innerWidth+1,ovf:over,typo,ex,small}});
async function shot(p,name,label,bottom){await p.screenshot({path:path.join(OUT,`${name}_${label}.png`)});
  if(bottom){const sc=await p.evaluate(()=>{const el=NAV[NAV.length-1].el;el.scrollTop=el.scrollHeight;return el.scrollTop});if(sc>40){await wait(450);await p.screenshot({path:path.join(OUT,`${name}_${label}_bas.png`)})}await p.evaluate(()=>{NAV[NAV.length-1].el.scrollTop=0});await wait(150)}}
const tab=async(p,k,ms=700)=>{await p.evaluate(k=>{const el=NAV[NAV.length-1].el,b=el.querySelector(`.segw .seg [data-tab="${k}"]`);if(b)b.click()},k);await wait(ms)};
const open=async(p,r,ms=2500)=>{await p.evaluate(r=>go(r),r);await wait(ms)};
const back=async p=>{await p.evaluate(()=>history.back());await wait(700)};
const sheet=async(p,sel,ms=500)=>{const ok=await p.evaluate(s=>{const el=NAV[NAV.length-1].el,b=el.querySelector(s);if(!b)return false;b.click();return true},sel);await wait(ms);return ok};
const sheetTxt=p=>p.evaluate(()=>document.querySelector("#sheet.on")?document.querySelector("#shB").innerText.slice(0,600):null);
const closeSh=async p=>{await p.evaluate(()=>{if(SHEET.open)closeSheet()});await wait(500)};
const txt=p=>p.evaluate(()=>{const el=NAV[NAV.length-1].el,c=el.querySelector(".tabc");return c?c.innerText.replace(/\s+/g," ").slice(0,900):""});
const T_LIVE=Date.parse("2026-10-24T23:30:00Z");

const SC={
  /* à venir : TLAW-BLG (00:00Z), vu à 23:30Z */
  async soon(b,name,dev,res){const {p,errs}=await mkPage(b,dev,{t0:T_LIVE,ev:(id,m)=>{if(id==="115660540726095035")m.games.forEach(g=>g.state="unstarted")}});res.errs=errs;
    const id="le115660540726095035",o=res.soon={};
    o.state=await p.evaluate(id=>{const m=mOf(id);return m&&m.state},id);
    await open(p,"m/"+id,3500);
    for(const [k,l] of [["ov","apercu"],["pl","joueurs"],["dr","draft"],["eq","equipes"]]){if(k!=="ov")await tab(p,k,k==="pl"?2500:1500);o[l]=await measure(p);o[l+"_txt"]=(await txt(p)).slice(0,500);await shot(p,name,"01_avenir_"+l,true)}
    await tab(p,"ov");o.keySheet=await sheet(p,".tabc .key")&&(await sheetTxt(p));await p.screenshot({path:path.join(OUT,`${name}_01_avenir_cle.png`)});await closeSh(p);
    o.clesI=await sheet(p,'.tabc [data-info^="cles:"]')&&(await sheetTxt(p));await closeSh(p);
    // pari en un geste, puis annulé (clés w26_)
    o.pick=await p.evaluate(id=>{const m=mOf(id),q=()=>NAV[NAV.length-1].el.querySelector(`.pkb[data-pick="${m.t2}"]`);q().click();const a=JSON.parse(localStorage.getItem("w26_picks")||"{}")[m.key];q().click();const c=JSON.parse(localStorage.getItem("w26_picks")||"{}")[m.key]||null;return {pose:a,annule:c}},id);
    await tab(p,"dr",1200);o.banSheet=await sheet(p,".tabc .bans button")&&(await sheetTxt(p));await closeSh(p);o.pvp=await sheet(p,".tabc .drr")&&(await sheetTxt(p));await p.screenshot({path:path.join(OUT,`${name}_01_avenir_draft_croise.png`)});await closeSh(p);
    await tab(p,"eq",900);o.tape=await sheet(p,".tabc .mat-row")&&(await sheetTxt(p));await closeSh(p);
    // duel d'un poste
    await tab(p,"pl",1500);const d=await p.evaluate(()=>{const b=NAV[NAV.length-1].el.querySelectorAll(".tabc .role")[2];if(!b)return null;b.click();return b.dataset.go},);await wait(3000);o.duelRoute=d;
    if(d){for(const [k,l] of [["du","duel"],["ch","champions"],["fo","forme"]]){if(k!=="du")await tab(p,k,1200);o["duel_"+l]=await measure(p);o["duel_"+l+"_txt"]=(await txt(p)).slice(0,400);await shot(p,name,"05_duel_"+l,true)}
      await tab(p,"du",900);o.encSheet=await sheet(p,".tabc .mat-enc")&&(await sheetTxt(p));await p.screenshot({path:path.join(OUT,`${name}_05_duel_rencontre.png`)});await closeSh(p);
      o.cmp=await p.evaluate(()=>!!NAV[NAV.length-1].el.querySelector("[data-cmp]"));await back(p)}
    o.depth=await p.evaluate(()=>NAV.length);await back(p);await p.close()},
  /* terminé : KC-C9 Bo5 3-2 (rediffusions), HLE-GEN Bo1 */
  async done(b,name,dev,res){const {p,errs}=await mkPage(b,dev,{t0:T_LIVE});res.errs=errs;const o=res.done={};
    await open(p,"m/le115660588583171786",6000);
    for(const [k,l] of [["ov","resume"],["gm","parties"],["pl","joueurs"],["dr","draft"],["av","avant"]]){if(k!=="ov")await tab(p,k,k==="pl"?2500:1500);o["bo5_"+l]=await measure(p);o["bo5_"+l+"_txt"]=(await txt(p)).slice(0,500);await shot(p,name,"04_bo5_"+l,true)}
    await tab(p,"gm",900);o.vod=await p.evaluate(()=>{const a=NAV[NAV.length-1].el.querySelector(".mat-vod");return a?[a.textContent.trim(),a.href]:null});
    await p.evaluate(()=>{const b=NAV[NAV.length-1].el.querySelector('.tabc [data-game="1"]');if(b)b.click()});await wait(800);o.vodP1=await p.evaluate(()=>{const a=NAV[NAV.length-1].el.querySelector(".mat-vod");return a?a.href:null});await shot(p,name,"04_bo5_partie1");
    await tab(p,"ov",900);await p.evaluate(()=>{const b=NAV[NAV.length-1].el.querySelector('.tabc [data-gm="2"]');if(b)b.click()});await wait(900);o.pill=await p.evaluate(()=>NAV[NAV.length-1].el._d.tab+"/"+NAV[NAV.length-1].el._d.g);
    await tab(p,"dr",900);o.ddSheet=await sheet(p,".tabc .mat-dd")&&(await sheetTxt(p));await closeSh(p);
    await back(p);
    await open(p,"m/le115660540726095025",6000);
    for(const [k,l] of [["ov","resume"],["pl","joueurs"],["dr","draft"],["av","avant"]]){if(k!=="ov")await tab(p,k,k==="pl"?2500:1500);o["bo1_"+l]=await measure(p);o["bo1_"+l+"_txt"]=(await txt(p)).slice(0,400);await shot(p,name,"04_bo1_"+l,true)}
    await back(p);await p.close()},
  /* direct rejoué : KC-AL du 23/10, partie suivie depuis 20:17:12Z, horloge accélérée (10 s par passage) */
  async live(b,name,dev,res){const sc={t0:Date.parse("2026-10-23T20:16:12Z")+60e3+6*60e3,fast:true,ev:(id,m)=>{if(id==="115660540726095009"){m.games.forEach(g=>g.state="inProgress");m.teams.forEach(t=>t.result={gameWins:0})}}};
    const {p,errs}=await mkPage(b,dev,sc);res.errs=errs;const o=res.live={};
    await p.evaluate(()=>{clearTimeout(sync.t);window.sync=async()=>{};const m=mOf("le115660540726095009");m.state="live";m.winner=null;m.s1=0;m.s2=0;m.apiLive=true});
    await open(p,"m/le115660540726095009",500);
    for(let i=0;i<240;i++){await wait(250);const st=await p.evaluate(()=>{const L=LV.games[mOf("le115660540726095009").key];return {T:window.__TICKS,st:L&&L.status,amd:!!(L&&L.amd),ev:L&&L.kf?L.kf.ev.length:0,gt:L&&L.frame?gtime(L):""}});o.etat=st;if(st.amd&&st.T>=36&&st.ev>3)break}
    await p.evaluate(()=>{window.__STOP=1});await wait(1500);
    for(const [k,l] of [["di","direct"],["pl","joueurs"],["dr","draft"],["av","avant"]]){if(k!=="di")await tab(p,k,1200);o[l]=await measure(p);o[l+"_txt"]=(await txt(p)).slice(0,600);await shot(p,name,"03_direct_"+l,true)}
    await tab(p,"di",800);
    // fluidité : 6 repeintures, l'onglet, le défilement et la feuille ouverte restent ; seuls les blocs qui changent sont remplacés
    o.fluid=await p.evaluate(async()=>{const m=mOf("le115660540726095009"),el=NAV[NAV.length-1].el;el.scrollTop=140;const y0=el.scrollTop,tab0=el._d.tab,b0=el.querySelector('.tabc [data-pk="gold"]'),hud0=el.querySelector(".hud .hudo");
      const t0=performance.now();for(let i=0;i<6;i++)paintLive(m);const ms=(performance.now()-t0)/6;return {ms:Math.round(ms*10)/10,scroll:[y0,el.scrollTop],tab:[tab0,el._d.tab],blocGarde:b0===el.querySelector('.tabc [data-pk="gold"]'),hudGarde:hud0===el.querySelector(".hud .hudo")}});
    o.filSheet=await sheet(p,".tabc .mat-bhb")&&(await sheetTxt(p));await p.screenshot({path:path.join(OUT,`${name}_03_direct_toutlefil.png`)});
    o.liveSheet=await p.evaluate(async()=>{const b=document.querySelector("#shB"),n0=b.querySelectorAll(".kfr").length;window.__STOP=0;await new Promise(r=>setTimeout(r,3500));window.__STOP=1;return {avant:n0,apres:b.querySelectorAll(".kfr").length,ouverte:SHEET.open,ticks:window.__TICKS}});
    await closeSh(p);
    for(const [sel,l] of [['.tabc .mat-rows .mat-row[data-info]',"rangee1"]]){o[l]=await sheet(p,sel)&&(await sheetTxt(p));await p.screenshot({path:path.join(OUT,`${name}_03_direct_feuille.png`)});await closeSh(p)}
    o.rows=await p.evaluate(()=>[...NAV[NAV.length-1].el.querySelectorAll(".tabc .mat-row small")].map(x=>x.textContent));
    // mini-HUD : défiler sous le HUD, le titre devient le score ; le toucher remonte
    o.mini=await p.evaluate(async()=>{const el=NAV[NAV.length-1].el;el.scrollTop=el.scrollHeight;await new Promise(r=>setTimeout(r,250));const bt=el.querySelector(".bar .bt"),on=bt.classList.contains("mat-mini"),t=bt.innerText.replace(/\s+/g," ");bt.click();await new Promise(r=>setTimeout(r,900));return {on,t,top:el.scrollTop}});
    await p.evaluate(()=>{NAV[NAV.length-1].el.scrollTop=400});await wait(300);await p.screenshot({path:path.join(OUT,`${name}_03_direct_minihud.png`)});await p.evaluate(()=>{NAV[NAV.length-1].el.scrollTop=0});
    await tab(p,"pl",900);o.plSheet=await sheet(p,".tabc .mat-lps")&&(await sheetTxt(p));await p.screenshot({path:path.join(OUT,`${name}_03_direct_joueur.png`)});await closeSh(p);
    await tab(p,"dr",900);o.ldSheet=await sheet(p,".tabc .mat-ld")&&(await sheetTxt(p));await closeSh(p);
    o.home=await p.evaluate(async()=>{await new Promise(r=>{history.back();setTimeout(r,800)});const w=document.getElementById("wlive");return w?w.innerText.replace(/\s+/g," ").slice(0,120):null});
    await p.close()},
  /* entre deux parties : KC-MVK Bo5, P1 finie, P2 pas commencée */
  async between(b,name,dev,res){const sc={t0:Date.parse("2026-10-18T18:50:00Z"),ev:(id,m)=>{if(id==="116299649498303884"){m.games.forEach(g=>g.state=g.number===1?"completed":"unstarted");m.teams.forEach(t=>t.result={gameWins:t.code==="KC"?1:0})}}};
    const {p,errs}=await mkPage(b,dev,sc);res.errs=errs;const o=res.between={};
    await p.evaluate(()=>{clearTimeout(sync.t);window.sync=async()=>{};const m=mOf("le116299649498303884");m.state="live";m.winner=null;const kc=m.t1==="KC";m.s1=kc?1:0;m.s2=kc?0:1;m.apiLive=true});
    await open(p,"m/le116299649498303884",7000);o.tab=await p.evaluate(()=>NAV[NAV.length-1].el._d.tab);
    for(const [k,l] of [["dr","draft"],["di","direct"],["gm","parties"]]){if(k!=="dr")await tab(p,k,2500);else await wait(2500);o[l]=await measure(p);o[l+"_txt"]=(await txt(p)).slice(0,600);await shot(p,name,"06_entre_"+l,true)}
    await tab(p,"dr",1200);o.flSheet=await sheet(p,".tabc .mat-rows .mat-row[data-info]")&&(await sheetTxt(p));await p.screenshot({path:path.join(OUT,`${name}_06_entre_fearless.png`)});await closeSh(p);
    await p.close()},
  /* résultat en attente et saisie à la main (w26_manual) */
  async wait(b,name,dev,res){const sc={t0:Date.parse("2026-10-25T00:40:00Z"),ev:(id,m)=>{if(id==="115660540726095027"){m.games.forEach(g=>g.state="completed");m.teams.forEach(t=>t.result={gameWins:0})}}};
    const {p,errs}=await mkPage(b,dev,sc);res.errs=errs;const o=res.wait={};
    await p.evaluate(()=>{clearTimeout(sync.t);window.sync=async()=>{};const m=mOf("le115660540726095027");m.state="wait";m.winner=null;m.s1=0;m.s2=0;m.apiLive=false});
    await open(p,"m/le115660540726095027",5000);o.direct=await measure(p);o.txt=(await txt(p)).slice(0,400);await shot(p,name,"07_attente");
    o.sheet=await sheet(p,".tabc [data-pk=man] .mat-row")&&(await sheetTxt(p));await p.screenshot({path:path.join(OUT,`${name}_07_attente_saisie.png`)});
    o.saisie=await p.evaluate(async()=>{const m=mOf("le115660540726095027");document.querySelector(`#shB [data-win="${m.t1}"]`).click();await new Promise(r=>setTimeout(r,1500));const x=mOf("le115660540726095027"),el=NAV[NAV.length-1].el;
      return {manual:JSON.parse(localStorage.getItem("w26_manual")||"{}")[x.key]||null,winner:x.winner,etat:x.state,onglets:[...el.querySelectorAll(".segw .seg button")].map(b=>b.textContent).join(","),feuille:SHEET.open}});
    await wait(800);await shot(p,name,"07_attente_saisi");
    o.efface=await p.evaluate(async()=>{const m=mOf("le115660540726095027");localStorage.setItem("w26_manual","{}");manual={};MATCHES.forEach(x=>{if(x.manual){x.winner=null;x.manual=false}});return true});
    await p.close()},
  /* flux coupé pendant un direct : message et nouvel essai */
  async err(b,name,dev,res){const sc={t0:T_LIVE,feedDown:true,ev:(id,m)=>{if(id==="115660540726095027"){m.games.forEach(g=>g.state="inProgress");m.teams.forEach(t=>t.result={gameWins:0})}}};
    const {p,errs}=await mkPage(b,dev,sc);res.errs=errs;const o=res.err={};
    await p.evaluate(()=>{clearTimeout(sync.t);window.sync=async()=>{};const m=mOf("le115660540726095027");m.state="live";m.winner=null;m.apiLive=true});
    await open(p,"m/le115660540726095027",9000);o.hud=await p.evaluate(()=>NAV[NAV.length-1].el.querySelector(".hud").innerText.replace(/\s+/g," "));o.txt=(await txt(p)).slice(0,300);o.direct=await measure(p);await shot(p,name,"08_flux_coupe");
    await p.close()},
};
(async()=>{
  await new Promise(r=>srv.listen(PORT,"127.0.0.1",r));const b=await chromium.launch();
  for(const [n,d] of Object.entries(DEV)){if(DEVS.length&&!DEVS.includes(n))continue;R[n]={};
    for(const [k,f] of Object.entries(SC)){if(SCN.length&&!SCN.includes(k))continue;const res={};try{await f(b,n,d,res)}catch(e){res.crash=String(e.message||e).slice(0,400)}R[n][k]=res;
      console.log(`${n} ${k} : ${res.crash?"CRASH "+res.crash:"ok"} · erreurs JS ${res.errs?res.errs.length:"?"}${res.errs&&res.errs.length?" · "+res.errs.slice(0,3).join(" || "):""}`)}}
  await b.close();srv.close();
  const fp=path.join(__dirname,"match_results.json");let prev={};try{prev=JSON.parse(fs.readFileSync(fp,"utf8"))}catch(e){}
  for(const n in R){prev[n]=Object.assign(prev[n]||{},R[n])}fs.writeFileSync(fp,JSON.stringify(prev,null,1));
  for(const [n,x] of Object.entries(R))for(const [k,v] of Object.entries(x)){const o=v[k]||{};for(const [l,m] of Object.entries(o))if(m&&typeof m==="object"&&"ratio" in m)console.log(n.padEnd(8),(k+"."+l).padEnd(26),"×"+m.ratio,"dépasse "+m.over+" px",(m.cls||"").replace(/scr|ready/g,"").trim(),m.hscroll?"DÉFILEMENT HORIZONTAL":"",m.ovf.length?"débordent "+JSON.stringify(m.ovf):"",m.typo?"TYPO "+JSON.stringify(m.ex):"",m.small.length?"petits "+JSON.stringify(m.small):"")}
})();
