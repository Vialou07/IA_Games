/* test/ply_probe.js — sonde ponctuelle (agent joueurs) : node test/ply_probe.js <appareil> <route> [<route>…] → dépassement et classes de resserrement */
const PW="C:/Users/vialo/AppData/Local/Temp/claude/c--Users-vialo-Desktop-Code-Worlds-2026/cead0307-273c-463a-8548-1b2491359512/scratchpad/pw/node_modules/playwright";
const {chromium,devices}=require(PW);const fs=require("fs"),path=require("path"),http=require("http");
const DIST=path.join(__dirname,"ply_dist"),DATA=path.join(__dirname,"../../data"),PORT=8904;
const DEV={iphone12:{...devices["iPhone 12"]},pixel7:{...devices["Pixel 7"]},w360:{...devices["Galaxy S9+"],viewport:{width:360,height:740},screen:{width:360,height:740}}};
const [dev,...routes]=process.argv.slice(2);
const srv=http.createServer((q,s)=>{const f=path.join(DIST,decodeURIComponent(q.url.split("?")[0]));if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);s.end();return}s.writeHead(200,{"content-type":"text/html; charset=utf-8"});fs.createReadStream(f).pipe(s)});
(async()=>{await new Promise(r=>srv.listen(PORT,"127.0.0.1",r));const b=await chromium.launch();const ctx=await b.newContext({...DEV[dev],locale:"fr-FR",timezoneId:"Europe/Paris"});
  await ctx.route(/raw\.githubusercontent\.com\/Vialou07\/IA_Games\/stats[^/]*\/data\/(\w+)\.json/,r=>{const n=r.request().url().match(/data\/(\w+)\.json/)[1],f=path.join(DATA,n+"_pp.json");const off=(process.env.PLY_OFF||"").split(",");if(off.includes(n))return r.fulfill({status:404,body:""});r.fulfill({status:200,contentType:"application/json",body:fs.readFileSync(f,"utf8")})});
  const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
  await p.goto(`http://127.0.0.1:${PORT}/worlds-b.html?nointro`);await p.waitForFunction(()=>typeof MATCHES!=="undefined"&&MATCHES.length&&typeof SJ!=="undefined"&&(SJ||document.querySelector('.home .grid .w')),null,{timeout:45000});await p.waitForTimeout(2500);
  for(const rr of routes){const [r,...tabs]=rr.split(">");await p.evaluate(r=>go(r),r);await p.waitForTimeout(1800);
    for(const k of tabs){await p.evaluate(k=>{const el=NAV[NAV.length-1].el;const b=el.querySelector(`.seg [data-tab="${k}"]`);if(b)b.click()},k);await p.waitForTimeout(700)}
    console.log(rr,"avant sonde",JSON.stringify(await p.evaluate(()=>{const el=NAV[NAV.length-1].el;return {empty:[...el.querySelectorAll(".empty")].map(x=>x.textContent.slice(0,60)),sk:el.querySelectorAll(".sk").length,ov:el.scrollHeight-el.clientHeight,cls:el.className,oy:getComputedStyle(el).overflowY,pb:getComputedStyle(el).paddingBottom,sab:typeof SAB==="number"?SAB:null}})));
    console.log(r,JSON.stringify(await p.evaluate(()=>{const el=NAV[NAV.length-1].el;const ov=el.scrollHeight-el.clientHeight;el.classList.remove("ply-fit1","ply-fit2","ply-fit3");const raw=el.scrollHeight-el.clientHeight;plyFit(el);
      return {ov,raw,after:el.scrollHeight-el.clientHeight,cls:el.className,ih:innerHeight}})));
    await p.screenshot({path:path.join(__dirname,"../shots/joueurs",`probe_${dev}_${r.replace(/\W+/g,"_")}.png`)});await p.evaluate(()=>history.back());await p.waitForTimeout(700)}
  console.log("erreurs",errs);await b.close();srv.close()})();
