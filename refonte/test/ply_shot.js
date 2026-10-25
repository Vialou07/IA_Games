/* test/ply_shot.js — capture ponctuelle (agent joueurs) : node test/ply_shot.js <appareil> <nom> <route[>onglet]> [bas] (build partagé dist/) */
const PW="C:/Users/vialo/AppData/Local/Temp/claude/c--Users-vialo-Desktop-Code-Worlds-2026/cead0307-273c-463a-8548-1b2491359512/scratchpad/pw/node_modules/playwright";
const {chromium,devices}=require(PW);const fs=require("fs"),path=require("path"),http=require("http");
const DIST=path.join(__dirname,"../dist"),DATA=path.join(__dirname,"../../data"),PORT=8904,OUT=path.join(__dirname,"../shots/joueurs");
const DEV={iphone12:{...devices["iPhone 12"]},pixel7:{...devices["Pixel 7"]},w360:{...devices["Galaxy S9+"],viewport:{width:360,height:740},screen:{width:360,height:740}}};
const [dev,name,rr,bas]=process.argv.slice(2);
const srv=http.createServer((q,s)=>{const f=path.join(DIST,decodeURIComponent(q.url.split("?")[0]));if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);s.end();return}s.writeHead(200,{"content-type":"text/html; charset=utf-8"});fs.createReadStream(f).pipe(s)});
(async()=>{await new Promise(r=>srv.listen(PORT,"127.0.0.1",r));const b=await chromium.launch();const ctx=await b.newContext({...DEV[dev],locale:"fr-FR",timezoneId:"Europe/Paris"});
  await ctx.route(/raw\.githubusercontent\.com\/Vialou07\/IA_Games\/stats[^/]*\/data\/(\w+)\.json/,r=>{const n=r.request().url().match(/data\/(\w+)\.json/)[1],f=path.join(DATA,n+"_pp.json");r.fulfill({status:200,contentType:"application/json",body:fs.readFileSync(f,"utf8")})});
  const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
  await p.goto(`http://127.0.0.1:${PORT}/worlds-b.html?nointro`);await p.waitForFunction(()=>typeof MATCHES!=="undefined"&&MATCHES.length&&typeof SJ!=="undefined"&&SJ&&document.querySelector('.home .grid .w'),null,{timeout:45000});await p.waitForTimeout(2000);
  const [r,...tabs]=rr.split(">");await p.evaluate(r=>go(r),r);await p.waitForTimeout(1800);
  for(const k of tabs){await p.evaluate(k=>{const el=NAV[NAV.length-1].el;const b=el.querySelector(`.seg [data-tab="${k}"]`);if(b)b.click()},k);await p.waitForTimeout(800)}
  await p.screenshot({path:path.join(OUT,`${dev}_${name}.png`)});
  if(bas){await p.evaluate(()=>{const el=NAV[NAV.length-1].el;el.scrollTop=el.scrollHeight});await p.waitForTimeout(500);await p.screenshot({path:path.join(OUT,`${dev}_${name}_bas.png`)})}
  console.log("erreurs",errs);await b.close();srv.close()})();
