/* =====================================================================================
   test/qa_live.js — contrôle qualité (intégrateur) : direct REJOUÉ, refonte et v13.5 côte à côte.
   Partie réelle KC-AL du 23/10 (Bo1, 33:16), flux officiel relu (caches disque du lot, sinon feed.lolesports.com),
   API LoL Esports = getEventDetails réels (test/match_data/events), robot figé (test/match_data/live_*.json).
   Horloge du téléphone décalée sur le moment voulu (comme quelqu'un qui ouvre l'appli à ce moment-là) :
     5 min, 9 min, 25 min de jeu, fin de partie (flux fini, résultat officiel pas encore publié), résultat officiel ;
   puis « entre deux manches » : KC-MVK Bo5 du 18/10, partie 1 finie, partie 2 pas commencée.
   À chaque point : héros de l'accueil, fiche du match (onglets, mesures de cadrage), et MÊMES chiffres que v13.5
   (temps de jeu, kills, or, fil, fights, joueur du match, chances, prono après draft).
   node test/qa_live.js [iphone12|pixel7|w360…] [p5 p9 p25 fin off entre…]   (port 8913) → test/qa/live.json, shots/qa/live_*.png
   ===================================================================================== */
const PW="C:/Users/vialo/AppData/Local/Temp/claude/c--Users-vialo-Desktop-Code-Worlds-2026/cead0307-273c-463a-8548-1b2491359512/scratchpad/pw/node_modules/playwright";
const {chromium,devices}=require(PW);const fs=require("fs"),path=require("path"),http=require("http"),crypto=require("crypto");
const ROOT=path.join(__dirname,".."),OUT=path.join(ROOT,"shots","qa"),MD=path.join(__dirname,"match_data"),LOT=path.join(ROOT,"..");fs.mkdirSync(OUT,{recursive:true});
const FC=[path.join(LOT,"flux/t2/fcache"),path.join(LOT,"ui_match/test/fcache"),path.join(MD,"fcache")];
const PORT=8913,B_URL=`http://127.0.0.1:${PORT}/dist/worlds-b.html`,A_URL=`http://127.0.0.1:${PORT}/ref/worlds_v13_5.html`;
const ARGS=process.argv.slice(2),DEVS=ARGS.filter(a=>/^(pixel7|iphone12|w360)$/.test(a)),SCN=ARGS.filter(a=>!/^(pixel7|iphone12|w360)$/.test(a));
const DEV={iphone12:{...devices["iPhone 12"]},pixel7:{...devices["Pixel 7"]},w360:{...devices["Galaxy S9+"],viewport:{width:360,height:740},screen:{width:360,height:740}}};
const EV={};for(const f of fs.readdirSync(path.join(MD,"events")))EV[f.replace(".json","")]=JSON.parse(fs.readFileSync(path.join(MD,"events",f),"utf8"));
const FIX=JSON.parse(fs.readFileSync(path.join(LOT,"flux/tests/fixtures_events.json"),"utf8"));for(const k in FIX)if(!EV[k])EV[k]=FIX[k];
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const TYPES={html:"text/html; charset=utf-8",js:"text/javascript",json:"application/json",png:"image/png"};
const srv=http.createServer((q,s)=>{const f=path.join(ROOT,decodeURIComponent(q.url.split("?")[0]));if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);s.end();return}
  s.writeHead(200,{"content-type":TYPES[f.split(".").pop()]||"application/octet-stream","cache-control":"no-store"});fs.createReadStream(f).pipe(s)});
const START=Date.parse("2026-10-23T20:17:12Z");   // début de la partie 1 de KC-AL dans le flux (≈ 0:00)
const KCAL="115660540726095009",KCMVK="116299649498303884";
const SC={
  p5:{mid:KCAL,t0:START+5*60e3+35e3,api:"live",want:"5"},
  p9:{mid:KCAL,t0:START+9*60e3+35e3,api:"live",want:"9"},
  p25:{mid:KCAL,t0:START+25*60e3+35e3,api:"live",want:"25"},
  fin:{mid:KCAL,t0:START+33.27*60e3+95e3,api:"live",want:"fin"},
  off:{mid:KCAL,t0:START+33.27*60e3+6*60e3,api:"done",want:"officiel"},
  entre:{mid:KCMVK,t0:Date.parse("2026-10-18T18:50:00Z"),api:"between",want:"entre"},
};
function evMod(sc,id,m){if(id!==sc.mid)return;
  if(sc.api==="live"){m.games.forEach(g=>g.state="inProgress");m.teams.forEach(t=>t.result={gameWins:0})}
  if(sc.api==="between"){m.games.forEach(g=>g.state=g.number===1?"completed":"unstarted");m.teams.forEach(t=>t.result={gameWins:t.code==="KC"?1:0})}}
async function mkPage(b,dev,sc,url,v13){
  const ctx=await b.newContext({...dev,locale:"fr-FR",timezoneId:"Europe/Paris"});
  await ctx.route(/raw\.githubusercontent\.com\/Vialou07\/IA_Games\/stats[^/]*\/data\/(\w+)\.json/,r=>{const n=r.request().url().match(/data\/(\w+)\.json/)[1],f=path.join(MD,"live_"+n+".json");
    r.fulfill({status:fs.existsSync(f)?200:404,contentType:"application/json",body:fs.existsSync(f)?fs.readFileSync(f,"utf8"):""})});
  await ctx.route(/esports-api\.lolesports\.com\/persisted\/gw\/(\w+)/,r=>{const u=new URL(r.request().url()),op=u.pathname.split("/").pop(),hdr={"access-control-allow-origin":"*","content-type":"application/json"};
    if(op==="getEventDetails"){const id=u.searchParams.get("id"),j=JSON.parse(JSON.stringify(EV[id]||{data:{}}));if(j.data.event)evMod(sc,id,j.data.event.match);return r.fulfill({status:200,headers:hdr,body:JSON.stringify(j)})}
    if(op==="getLive")return r.fulfill({status:200,headers:hdr,body:JSON.stringify({data:{schedule:{events:[]}}})});
    return r.fulfill({status:503,headers:hdr,body:""})});
  await ctx.route(/feed\.lolesports\.com\/livestats\/v1\/(window|details)\//,async r=>{const hdr={"access-control-allow-origin":"*","content-type":"application/json"};
    const u=new URL(r.request().url()),p=u.pathname.replace("/livestats/v1/","")+u.search,h=crypto.createHash("md5").update(p).digest("hex")+".json";
    for(const d of FC){const fp=path.join(d,h);if(fs.existsSync(fp)){const s=fs.readFileSync(fp,"utf8");return s==="null"?r.fulfill({status:204,headers:hdr,body:""}):r.fulfill({status:200,headers:hdr,body:s})}}
    for(let a=0;a<3;a++){try{const res=await r.fetch({timeout:20000}),body=await res.text();if(res.status()===200)fs.writeFileSync(path.join(FC[2],h),body);else if(res.status()===204)fs.writeFileSync(path.join(FC[2],h),"null");return r.fulfill({status:res.status(),headers:hdr,body})}catch(e){await wait(400*(a+1))}}
    return r.abort()});
  await ctx.route(/ntfy\.sh|lol\.fandom\.com|wikipedia\.org/,r=>r.abort());
  await ctx.addInitScript(t0=>{const RD=Date;let off=t0-RD.now();window.__now=()=>RD.now()+off;
    class FD extends RD{constructor(...a){if(a.length)super(...a);else super(RD.now()+off)}static now(){return RD.now()+off}}FD.parse=RD.parse;FD.UTC=RD.UTC;window.Date=FD;try{sessionStorage.setItem("w26_intro","1")}catch(e){}},sc.t0);
  const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));p.on("console",m=>{if(m.type()==="error"&&!/Failed to load resource|net::ERR|ERR_FAILED/.test(m.text()))errs.push("console "+m.text().slice(0,200))});
  p.setDefaultTimeout(30000);await p.goto(url+"?nointro",{waitUntil:"domcontentloaded"});
  await p.waitForFunction(v13=>typeof MATCHES!=="undefined"&&MATCHES.length>10&&typeof SJ!=="undefined"&&SJ&&(v13?typeof matchSheet==="function":!!document.querySelector(".home .grid")),v13,{timeout:60000});
  await p.evaluate(async()=>{await Promise.all([loadFJ(),loadDJ(),champMap()].map(x=>x&&x.catch?x.catch(()=>{}):x))});
  return {p,ctx,errs};
}
/* forcer l'état « en direct » côté appli : la synchro du test lit le planning du robot (déjà « terminé ») */
const forceLive=(p,sc,v13)=>p.evaluate(async([mid,api,v13])=>{if(!v13&&SYNC.p)await SYNC.p;for(let i=0;i<20&&!v13&&SYNC.busy;i++)await new Promise(r=>setTimeout(r,250));
  try{clearTimeout(v13?syncTimer:sync.t)}catch(e){}window.sync=async()=>{};
  const m=MATCHES.find(x=>x.id==="le"+mid);if(api==="done")return m.key;m.state="live";m.winner=null;m.apiLive=true;
  if(api==="between"){const kc=m.t1==="KC";m.s1=kc?1:0;m.s2=kc?0:1}else{m.s1=0;m.s2=0}
  try{v13?renderAll():onData()}catch(e){}   // comme après une vraie synchro : l'accueil passe en direct et le moteur démarre
  return m.key},[sc.mid,sc.api,v13]);
/* les chiffres du moteur du direct (même code dans les deux versions : live2 et le fil sont des extraits) */
const engine=(p,key)=>p.evaluate(key=>{const L=LV.games[key];if(!L)return null;const f=L.frame;let pog=null,fights=null,R=null;
  try{R=l2Rows(L);fights=l2Fights(L).length}catch(e){}
  pog=L.l2&&L.l2.pog||null;   // joueur du match retenu par l'appli (clé), sans recalcul côté test
  return {status:L.status,num:L.num,gt:f?gtime(L):null,k:f?[f.blueTeam.totalKills,f.redTeam.totalKills]:null,gold:f?[f.blueTeam.totalGold,f.redTeam.totalGold]:null,
    tw:f?[f.blueTeam.towers,f.redTeam.towers]:null,dr:f?[(f.blueTeam.dragons||[]).length,(f.redTeam.dragons||[]).length]:null,ev:L.kf&&L.kf.ev?L.kf.ev.length:0,types:L.kf&&L.kf.ev?L.kf.ev.reduce((o,e)=>(o[e.k]=(o[e.k]||0)+1,o),{}):null,fights,pog,samples:(L.samples||[]).length,amd:L.amd&&!L.amd.err?[L.amd.pE,L.amd.p].map(x=>x==null?null:Math.round(x*1000)/10):null}},key);
const measure=p=>p.evaluate(()=>{const el=NAV.length?NAV[NAV.length-1].el:document.querySelector(".home");const fit=el.classList.contains("fit");
  let maxB=0;el.querySelectorAll("*").forEach(x=>{const r=x.getBoundingClientRect();if(r.height>0&&r.width>0&&getComputedStyle(x).position!=="fixed")maxB=Math.max(maxB,r.bottom)});const cut=fit?Math.round(maxB-el.getBoundingClientRect().bottom):0;
  return {fit,over:fit?0:el.scrollHeight-el.clientHeight,ratio:+(el.scrollHeight/innerHeight).toFixed(2),cut:cut>1?cut:0,hs:el.scrollWidth>el.clientWidth+1||document.documentElement.scrollWidth>innerWidth+1,doc:document.scrollingElement.scrollHeight-document.scrollingElement.clientHeight}});
const txt=p=>p.evaluate(()=>{const el=NAV[NAV.length-1].el,c=el.querySelector(".tabc");return c?c.innerText.replace(/\s+/g," ").slice(0,700):""});
const head=p=>p.evaluate(()=>{const el=NAV[NAV.length-1].el,h=el.querySelector(".hud,.hero,.mat-head");return h?h.innerText.replace(/\s+/g," ").slice(0,220):""});
const tab=async(p,k,ms=1200)=>{await p.evaluate(k=>{const b=NAV[NAV.length-1].el.querySelector(`.segw .seg [data-tab="${k}"]`);if(b)b.click()},k);await wait(ms)};
const R={};
(async()=>{await new Promise(r=>srv.listen(PORT,"127.0.0.1",r));const b=await chromium.launch();
  const devs=Object.entries(DEV).filter(([n])=>!DEVS.length||DEVS.includes(n)),scs=Object.entries(SC).filter(([k])=>!SCN.length||SCN.includes(k));
  for(const [k,sc] of scs){R[k]={};
    // v13.5 (référence), sur iPhone 12 seulement
    try{const {p,ctx,errs}=await mkPage(b,DEV.iphone12,sc,A_URL,true);const key=await forceLive(p,sc,true);
      await p.evaluate(mid=>matchSheet("le"+mid),sc.mid);
      for(let i=0;i<60;i++){await wait(500);const e=await engine(p,key);if(e&&e.status&&e.status!=="waiting"&&(sc.api!=="live"||e.ev>0&&e.samples>0))break}
      // fil stabilisé (rattrapage depuis 0:00 terminé) : même nombre d'événements pendant 8 s
      {let last=-1,same=0;for(let i=0;i<60&&same<8;i++){await wait(1000);const e=await engine(p,key);const n=e?e.ev:0;same=n===last?same+1:0;last=n}}
      R[k].v13=await engine(p,key);
      R[k].v13_box=await p.evaluate(()=>{const x=document.querySelector("#livebox")||document.querySelector("#sheetBody");return x?x.innerText.replace(/\s+/g," ").slice(0,600):null});
      await p.screenshot({path:path.join(OUT,`live_${k}_v13.png`)});R[k].v13_errs=errs;await ctx.close()}catch(e){R[k].v13_crash=String(e.message||e).slice(0,300)}
    for(const [n,dev] of devs){const o=R[k][n]={};
      try{const {p,ctx,errs}=await mkPage(b,dev,sc,B_URL,false);o.errs=errs;const key=await forceLive(p,sc,false);
        if(sc.api!=="done"){for(let i=0;i<40;i++){await wait(500);const e=await engine(p,key);if(e&&e.status&&e.status!=="waiting"&&(sc.api!=="live"||e.ev>0))break}await wait(4000)}
        // héros de l'accueil
        o.hero=await p.evaluate(()=>{const h=document.querySelector(".home .grid>.w.w22");return h?h.innerText.replace(/\s+/g," ").slice(0,200):null});
        o.home=await measure(p);await p.screenshot({path:path.join(OUT,`live_${k}_${n}_accueil.png`)});
        await p.evaluate(mid=>go("m/le"+mid),sc.mid);await wait(sc.api==="live"?7000:5000);
        o.engine=await engine(p,key);o.tabs=await p.evaluate(()=>{const el=NAV[NAV.length-1].el;return {all:[...el.querySelectorAll(".segw .seg button")].map(b=>b.dataset.tab).join(","),cur:el._d.tab}});
        o.head=await head(p);
        for(const t of o.tabs.all.split(",").filter(Boolean)){await tab(p,t,t==="pl"?2500:1500);o["tab_"+t]={m:await measure(p),txt:(await txt(p)).slice(0,600),blocks:await p.evaluate(()=>{const el=NAV[NAV.length-1].el,c=el.querySelector(".tabc");return {head:Math.round((el.querySelector(".tabc")||el).getBoundingClientRect().top+el.scrollTop),b:c?[...c.children].map(x=>(x.className||x.tagName).toString().slice(0,30)+":"+Math.round(x.getBoundingClientRect().height)):[]}})};await p.screenshot({path:path.join(OUT,`live_${k}_${n}_${t}.png`)})}
        await tab(p,o.tabs.cur,900);
        {let last=-1,same=0;for(let i=0;i<60&&same<8;i++){await wait(1000);const e=await engine(p,key);const n=e?e.ev:0;same=n===last?same+1:0;last=n}}
        o.engine2=await engine(p,key);
        // la feuille « Tout le fil » se remplit-elle ?
        o.fil=await p.evaluate(()=>{const el=NAV[NAV.length-1].el,b=el.querySelector(".tabc .mat-bhb");if(!b)return null;b.click();return new Promise(r=>setTimeout(()=>{const s=document.querySelector("#shB");r(s?s.querySelectorAll(".kfr").length:0)},700))});
        await p.evaluate(()=>{if(SHEET.open)closeSheet()});await wait(500);
        o.errs=errs;await ctx.close()}catch(e){o.crash=String(e.message||e).slice(0,400)}
      console.log(k,n,o.crash?"CRASH "+o.crash:"ok","erreurs JS",o.errs?o.errs.length:"?",JSON.stringify(o.engine2||o.engine),"| v13",JSON.stringify(R[k].v13))}}
  await b.close();srv.close();fs.mkdirSync(path.join(__dirname,"qa"),{recursive:true});fs.writeFileSync(path.join(__dirname,"qa","live.json"),JSON.stringify(R,null,1));
  for(const [k,x] of Object.entries(R))for(const [n,o] of Object.entries(x)){if(!o||!o.tabs)continue;
    console.log(`${k} ${n} héros: ${o.hero}`);console.log(`   onglets ${o.tabs.all} (ouvert ${o.tabs.cur}) tête: ${o.head}`);
    for(const t of o.tabs.all.split(","))if(o["tab_"+t])console.log(`   ${t}: ×${o["tab_"+t].m.ratio} dépasse ${o["tab_"+t].m.over}${o["tab_"+t].m.fit?" fit":""}${o["tab_"+t].m.cut?" COUPÉ "+o["tab_"+t].m.cut:""}${o["tab_"+t].m.hs?" HSCROLL":""}${o["tab_"+t].m.doc?" DOC "+o["tab_"+t].m.doc:""} | ${o["tab_"+t].txt.slice(0,240)}`)}
})();
