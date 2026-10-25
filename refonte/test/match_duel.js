/* test/match_duel.js — duel Faker–Chovy (beaucoup de rencontres) sur 3 téléphones : hauteur, signe de l'or à 15 min des rencontres,
   lien « 11/20 aux Worlds › » vers sim/rob. Données figées (test/match_data/live_*.json), LoL Esports refusé (planning du robot).
   node test/match_duel.js   (port 8905, module match) */
const PW="C:/Users/vialo/AppData/Local/Temp/claude/c--Users-vialo-Desktop-Code-Worlds-2026/cead0307-273c-463a-8548-1b2491359512/scratchpad/pw/node_modules/playwright";
const {chromium,devices}=require(PW);const fs=require("fs"),path=require("path"),http=require("http");
const ROOT=path.join(__dirname,".."),DIST=path.join(ROOT,"dist"),MD=path.join(__dirname,"match_data"),OUT=path.join(ROOT,"shots","match");
const PORT=8905,BASE=`http://127.0.0.1:${PORT}/worlds-b.html`,wait=ms=>new Promise(r=>setTimeout(r,ms));
const DEV={pixel7:{...devices["Pixel 7"]},iphone12:{...devices["iPhone 12"]},w360:{...devices["Galaxy S9+"],viewport:{width:360,height:740},screen:{width:360,height:740}}};
const srv=http.createServer((q,s)=>{const f=path.join(DIST,decodeURIComponent(q.url.split("?")[0]));if(!f.startsWith(DIST)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);s.end();return}
  s.writeHead(200,{"content-type":"text/html; charset=utf-8","cache-control":"no-store"});fs.createReadStream(f).pipe(s)});
(async()=>{await new Promise(r=>srv.listen(PORT,"127.0.0.1",r));const b=await chromium.launch();const R={};
  for(const [n,dev] of Object.entries(DEV)){
    const ctx=await b.newContext({...dev,locale:"fr-FR",timezoneId:"Europe/Paris"});
    await ctx.route(/raw\.githubusercontent\.com\/Vialou07\/IA_Games\/stats[^/]*\/data\/(\w+)\.json/,r=>{const k=r.request().url().match(/data\/(\w+)\.json/)[1],f=path.join(MD,"live_"+k+".json");
      r.fulfill({status:fs.existsSync(f)?200:404,contentType:"application/json",body:fs.existsSync(f)?fs.readFileSync(f,"utf8"):""})});
    await ctx.route(/esports-api\.lolesports\.com|feed\.lolesports\.com|ntfy\.sh|lol\.fandom\.com|wikipedia\.org/,r=>r.fulfill({status:503,headers:{"access-control-allow-origin":"*"},body:""}));
    // horloge de la page : 24/10 23:30 UTC (TL-BLG encore à venir), comme test/match.js
    await ctx.addInitScript(t0=>{const RD=Date,off=t0-RD.now();class FD extends RD{constructor(...a){if(a.length)super(...a);else super(RD.now()+off)}static now(){return RD.now()+off}}FD.parse=RD.parse;FD.UTC=RD.UTC;window.Date=FD},Date.parse("2026-10-24T23:30:00Z"));
    const p=await ctx.newPage(),errs=[];p.on("pageerror",e=>errs.push(e.message));
    await p.goto(BASE+"?nointro",{waitUntil:"domcontentloaded"});
    await p.waitForFunction(()=>typeof MATCHES!=="undefined"&&MATCHES.length>10&&SJ&&document.querySelector(".home .grid"),null,{timeout:60000});
    await p.evaluate(async()=>{await Promise.all([loadFJ(),loadDJ(),champMap()])});await wait(600);
    await p.evaluate(()=>go("d/T1_faker~GEN_chovy"));await wait(3500);
    const o=await p.evaluate(()=>{const el=NAV[NAV.length-1].el,rows=[...el.querySelectorAll(".tabc .mat-enc")];
      return {ratio:+(el.scrollHeight/innerHeight).toFixed(2),over:el.scrollHeight-el.clientHeight,hscroll:el.scrollWidth>el.clientWidth+1,enc:rows.length,
        first:rows[0]?rows[0].innerText.replace(/\s+/g," "):null,more:(el.querySelector(".tabc .mat-more")||{}).textContent||null}});
    await p.screenshot({path:path.join(OUT,`${n}_05_duel_faker_chovy.png`)});
    // détail de la 1re rencontre : l'or à 15 min doit désigner le même joueur que la ligne (colonne de droite = 2e joueur)
    o.sheet=await p.evaluate(async()=>{const b=NAV[NAV.length-1].el.querySelector(".tabc .mat-enc");if(!b)return null;b.click();await new Promise(r=>setTimeout(r,500));const t=document.querySelector("#shB").innerText.replace(/\s+/g," ");closeSheet();return t.slice(0,400)});
    o.verdict=await p.evaluate(async()=>{const b=NAV[NAV.length-1].el.querySelector(".tabc .mat-verdict .i");if(!b)return null;b.click();await new Promise(r=>setTimeout(r,500));const t=document.querySelector("#shB").innerText.replace(/\s+/g," ");return t.slice(0,500)});
    await p.screenshot({path:path.join(OUT,`${n}_05_duel_verdict.png`)});await p.evaluate(()=>closeSheet());
    await wait(500);await p.evaluate(()=>history.back());await wait(800);
    // lien du robot depuis un match à venir
    o.robLink=await p.evaluate(async()=>{const m=MATCHES.find(x=>x.state==="soon"&&x.t1&&x.t2);if(!m)return "pas de match à venir";go("m/"+m.id);await new Promise(r=>setTimeout(r,2500));
      const t=NAV[NAV.length-1].el.querySelector(".mat-tgo");if(!t)return "pas d’étiquette";const r=t.getBoundingClientRect();t.click();await new Promise(r=>setTimeout(r,1500));const d=NAV[NAV.length-1].d;return {route:d.v+"/"+(d.tab||""),txt:t.textContent,h:Math.round(r.height)}});
    o.errs=errs;R[n]=o;console.log(n,JSON.stringify(o));await ctx.close()}
  await b.close();srv.close();fs.writeFileSync(path.join(__dirname,"match_duel_results.json"),JSON.stringify(R,null,1))})();
