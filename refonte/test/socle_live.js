/* test/socle_live.js — héros en direct de l'accueil sur une image du flux simulée (objectifs, tendance, dernier événement),
   pause entre deux parties, résultat en attente ; captures shots/socle/live_*.png. node test/socle_live.js (port 8906) */
const PW="C:/Users/vialo/AppData/Local/Temp/claude/c--Users-vialo-Desktop-Code-Worlds-2026/cead0307-273c-463a-8548-1b2491359512/scratchpad/pw/node_modules/playwright";
const {chromium,devices}=require(PW);const fs=require("fs"),path=require("path"),http=require("http");
const DIST=path.join(__dirname,"../dist/socle"),OUT=path.join(__dirname,"../shots/socle");
const srv=http.createServer((q,s)=>{const f=path.join(DIST,decodeURIComponent(q.url.split("?")[0]));if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);s.end();return}s.writeHead(200,{"content-type":/html$/.test(f)?"text/html; charset=utf-8":"application/octet-stream"});fs.createReadStream(f).pipe(s)});
(async()=>{await new Promise(r=>srv.listen(8906,"127.0.0.1",r));const b=await chromium.launch(),errs=[],out={};
  for(const [dn,dev] of [["iphone12",devices["iPhone 12"]],["w360",{...devices["Galaxy S9+"],viewport:{width:360,height:740}}]]){
  const ctx=await b.newContext({...dev,locale:"fr-FR",timezoneId:"Europe/Paris"});await ctx.route(/feed\.lolesports\.com/,r=>r.abort());
  const p=await ctx.newPage();p.on("pageerror",e=>errs.push(e.message));p.on("console",m=>{if(m.type()==="error"&&!/Failed to load|ERR_/.test(m.text()))errs.push(m.text())});
  await p.goto("http://127.0.0.1:8906/worlds-b.html?nointro");await p.waitForFunction(()=>typeof MATCHES!=="undefined"&&MATCHES.length&&document.querySelector(".home .grid .w"),null,{timeout:45000});await p.waitForTimeout(3000);
  const sim=st=>p.evaluate(st=>{clearTimeout(sync.t);if(LV.timer)clearTimeout(LV.timer);LV.watch="x";
    let m=MATCHES.find(x=>x.state==="live");if(!m){m=[...MATCHES].reverse().find(x=>x.winner&&x.t1&&x.t2);m.winner=null;m.s1=m.s2=null;m.apiLive=true}
    if(st==="wait"){m.apiLive=false;m.unst=false;m.start=new Date(Date.now()-3*3600e3).toISOString()}
    MATCHES=finalize(MATCHES);const T=(g,k,t,i,b,d)=>({totalGold:g,totalKills:k,towers:t,inhibitors:i,barons:b,dragons:d,participants:[]});
    const now=Date.now();LV.games[m.key]={status:st==="between"?"between":"live",num:2,gid:"1",blue:m.t1,red:m.t2,first:now-23*60e3,
      frame:{rfc460Timestamp:new Date(now-30000).toISOString(),blueTeam:T(43100,14,6,1,1,["infernal","ocean","mountain"]),redTeam:T(39800,9,3,0,0,["cloud"])},
      kf:{ev:[{k:"drag",t:1300,s:0,ty:"infernal",ms:now-60000}]},meta:null};
    renderHome();BUS.emit("live",m);return {k:HM.k,m:m.id,st:m.state}},st);
  for(const st of ["live","record","between","wait"]){
    /* record battu (A-05) : la ligne de match.js (matHeroRec) prend la place du dernier événement */
    if(st==="record")await p.evaluate(()=>{window.__rec=matHeroRec;matHeroRec=()=>`<div class="mat-hrec">Ruler est à 14 kills : il <b>bat le record de ces Worlds</b> (13, Gumayusi contre FLY le 18/10)</div>`});
    out[dn+"_"+st]=await sim(st==="record"?"live":st);await p.waitForTimeout(500);
    if(st==="record")await p.evaluate(()=>{matHeroRec=window.__rec});
    out[dn+"_"+st].html=await p.evaluate(()=>{const h=document.querySelector(".home .hero");return h?h.querySelector(".hfoot").textContent.replace(/\s+/g," ").slice(0,160):"pas de héros"});
    /* le contenu du héros tient dans sa hauteur fixe (rien de rogné en bas) */
    out[dn+"_"+st].fitHero=await p.evaluate(()=>{const h=document.querySelector(".home .hero"),i=h&&h.querySelector(".hin");if(!i)return null;const hb=h.getBoundingClientRect().bottom,last=[...i.querySelectorAll(".hfoot *")].reduce((m,x)=>Math.max(m,x.getBoundingClientRect().bottom),0);return {marge:Math.round(hb-last),deborde:i.scrollHeight>i.clientHeight+1}});
    await p.screenshot({path:`${OUT}/live_${dn}_${st}.png`,clip:{x:0,y:0,width:dev.viewport.width,height:Math.min(dev.viewport.height,420)}})}
  await ctx.close()}
  console.log(JSON.stringify(out,null,1));console.log("erreurs JS",errs.length,errs.slice(0,5).join(" | "));await b.close();srv.close()})();
