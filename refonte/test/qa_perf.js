/* =====================================================================================
   test/qa_perf.js — contrôle qualité (intégrateur) : PERFORMANCE au processeur ralenti 4 fois (CDP), données réelles.
   1. Démarrage, cache vide puis cache chaud (2e ouverture) : premier affichage de l'accueil (squelette), accueil rempli (héros
      et widgets avec les données), tâches longues (> 50 ms) pendant les 6 premières secondes ; même mesure pour v13.5.
   2. Ouverture d'écran (toucher → écran peint : go() puis 2 images) pour les écrans principaux, médiane de 3.
   node test/qa_perf.js [iphone12|pixel7|w360]   (port 8917) → test/qa/perf.json
   ===================================================================================== */
const PW="C:/Users/vialo/AppData/Local/Temp/claude/c--Users-vialo-Desktop-Code-Worlds-2026/cead0307-273c-463a-8548-1b2491359512/scratchpad/pw/node_modules/playwright";
const {chromium,devices}=require(PW);const fs=require("fs"),path=require("path"),http=require("http");
const ROOT=path.join(__dirname,".."),PORT=8917;const ONLY=process.argv.slice(2);
const DEV={iphone12:{...devices["iPhone 12"]},pixel7:{...devices["Pixel 7"]},w360:{...devices["Galaxy S9+"],viewport:{width:360,height:740},screen:{width:360,height:740}}};
const srv=http.createServer((q,s)=>{const f=path.join(ROOT,decodeURIComponent(q.url.split("?")[0]));if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);s.end();return}
  s.writeHead(200,{"content-type":/\.html$/.test(f)?"text/html; charset=utf-8":"application/octet-stream","cache-control":"no-cache"});fs.createReadStream(f).pipe(s)});
const wait=ms=>new Promise(r=>setTimeout(r,ms)),med=a=>{const v=a.slice().sort((x,y)=>x-y);return v[Math.floor(v.length/2)]};
const R={};
async function startup(b,dev,url,v13,ctx0){const ctx=ctx0||await b.newContext({...dev,locale:"fr-FR",timezoneId:"Europe/Paris"});await ctx.route(/ntfy\.sh|lol\.fandom\.com/,r=>r.abort());
  await ctx.addInitScript(()=>{window.__lt=0;window.__ltn=0;try{new PerformanceObserver(l=>{for(const e of l.getEntries()){window.__lt+=e.duration;window.__ltn++}}).observe({type:"longtask",buffered:true})}catch(e){}});
  const p=await ctx.newPage();const cdp=await ctx.newCDPSession(p);await cdp.send("Emulation.setCPUThrottlingRate",{rate:4});
  const t0=Date.now();await p.goto(url,{waitUntil:"commit"});
  const shell=v13?await p.waitForFunction(()=>document.querySelector("#v-home")&&document.querySelector("#v-home").children.length>0,null,{timeout:90000,polling:20}).then(()=>Date.now()-t0)
                 :await p.waitForFunction(()=>document.querySelector(".home .grid"),null,{timeout:90000,polling:20}).then(()=>Date.now()-t0);
  const full=v13?await p.waitForFunction(()=>typeof MATCHES!=="undefined"&&MATCHES.length>10&&/VS|\d-\d/.test((document.querySelector("#v-home")||{}).innerText||""),null,{timeout:90000,polling:20}).then(()=>Date.now()-t0)
                :await p.waitForFunction(()=>typeof MATCHES!=="undefined"&&MATCHES.length>10&&document.querySelector(".home .grid>.w.w22")&&!document.querySelector(".home .grid .sk"),null,{timeout:90000,polling:20}).then(()=>Date.now()-t0);
  await wait(Math.max(0,6000-(Date.now()-t0)));const lt=await p.evaluate(()=>({ms:Math.round(window.__lt),n:window.__ltn,nav:Math.round(performance.getEntriesByType("navigation")[0].domContentLoadedEventEnd)}));
  return {p,ctx,cdp,r:{affichage_ms:shell,accueil_rempli_ms:full,taches_longues_ms:lt.ms,taches_longues:lt.n,domcontentloaded_ms:lt.nav}}}
(async()=>{await new Promise(r=>srv.listen(PORT,"127.0.0.1",r));const b=await chromium.launch();
  for(const [n,dev] of Object.entries(DEV)){if(ONLY.length&&!ONLY.includes(n))continue;const o=R[n]={};
    // v13.5 et refonte, cache vide (nouveau contexte), puis cache chaud (rechargement dans le même contexte)
    for(const [lab,url,v13] of [["v13.5",`http://127.0.0.1:${PORT}/ref/worlds_v13_5.html`,true],["refonte",`http://127.0.0.1:${PORT}/dist/worlds-b.html?nointro`,false]]){
      const s1=await startup(b,dev,url,v13);o[lab+"_froid"]=s1.r;await s1.p.close();const s2=await startup(b,dev,url,v13,s1.ctx);o[lab+"_chaud"]=s2.r;
      if(!v13){// ouvertures d'écrans au CPU ×4 (même page, cache chaud)
        const p=s2.p;await wait(2000);const routes=await p.evaluate(()=>{const m=MATCHES.find(m=>m.state==="soon"&&m.t1&&m.t2)||MATCHES.find(m=>m.t1&&m.t2);const d=[...MATCHES].reverse().find(m=>m.winner);return ["m/"+m.id,"m/"+d.id,"cal","sui","sim","teams","t/GEN","pl","p/T1_faker","rk/MID","cmp/T1_faker~GEN_chovy","st","fx","bets","lg","set","eve/"+dayKeyL(new Date(d.start))]});
        o.ouvertures={};for(const r of routes){const v=[];for(let i=0;i<3;i++){const ms=await p.evaluate(async r=>{const t=performance.now();go(r);await new Promise(x=>requestAnimationFrame(()=>requestAnimationFrame(x)));const d=performance.now()-t;await new Promise(x=>setTimeout(x,700));history.back();await new Promise(x=>setTimeout(x,700));return Math.round(d)},r);v.push(ms)}o.ouvertures[r.replace(/le\d+/,"<id>")]=med(v)}
        // onglets : Aperçu → Joueurs → Draft d'un match à venir
        o.onglets=await p.evaluate(async r=>{go(r);await new Promise(x=>setTimeout(x,2500));const out={};for(const k of ["pl","dr","eq","ov"]){const b=NAV[NAV.length-1].el.querySelector(`.segw .seg [data-tab="${k}"]`);if(!b)continue;const t=performance.now();b.click();await new Promise(x=>requestAnimationFrame(()=>requestAnimationFrame(x)));out[k]=Math.round(performance.now()-t);await new Promise(x=>setTimeout(x,900))}history.back();return out},routes[0])}
      await s2.ctx.close()}
    console.log(n,JSON.stringify(o))}
  await b.close();srv.close();fs.mkdirSync(path.join(__dirname,"qa"),{recursive:true});fs.writeFileSync(path.join(__dirname,"qa","perf.json"),JSON.stringify(R,null,1));
})();
