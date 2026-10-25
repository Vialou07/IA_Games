/* débogage ponctuel du module match : évalue une expression dans la page (données figées), ex. node test/match_dbg.js "await draftMatchData(mOf('le115660540726095035'))" */
const PW="C:/Users/vialo/AppData/Local/Temp/claude/c--Users-vialo-Desktop-Code-Worlds-2026/cead0307-273c-463a-8548-1b2491359512/scratchpad/pw/node_modules/playwright";
const {chromium,devices}=require(PW);const fs=require("fs"),path=require("path"),http=require("http");
const DIST=path.join(__dirname,"../dist"),MD=path.join(__dirname,"match_data"),PORT=8915;
const srv=http.createServer((q,s)=>{const f=path.join(DIST,q.url.split("?")[0]);if(!fs.existsSync(f)){s.writeHead(404);s.end();return}s.writeHead(200,{"content-type":"text/html; charset=utf-8"});fs.createReadStream(f).pipe(s)});
(async()=>{await new Promise(r=>srv.listen(PORT,"127.0.0.1",r));const b=await chromium.launch();const ctx=await b.newContext({...devices["Pixel 7"],locale:"fr-FR",timezoneId:"Europe/Paris"});
  await ctx.route(/raw\.githubusercontent\.com\/Vialou07\/IA_Games\/stats[^/]*\/data\/(\w+)\.json/,r=>{const n=r.request().url().match(/data\/(\w+)\.json/)[1];r.fulfill({status:200,contentType:"application/json",body:fs.readFileSync(path.join(MD,"live_"+n+".json"),"utf8")})});
  await ctx.route(/esports-api|ntfy|fandom/,r=>r.fulfill({status:503,body:""}));
  const p=await ctx.newPage();p.on("pageerror",e=>console.log("pageerror",e.message));p.on("console",m=>{if(m.type()==="error"||m.type()==="warning")console.log("console",m.type(),m.text().slice(0,300))});
  await p.goto(`http://127.0.0.1:${PORT}/worlds-b.html?nointro`);await p.waitForFunction(()=>typeof MATCHES!=="undefined"&&MATCHES.length>10&&SJ,null,{timeout:60000});
  await p.evaluate(async()=>{await Promise.all([loadFJ(),loadDJ(),champMap()])});
  const code="(async()=>{try{const v="+process.argv[2]+";return JSON.stringify(v,null,1).slice(0,3000)}catch(e){return \"ERREUR \"+e.message+\" \"+e.stack}})()";const r=await p.evaluate(code);console.log(r);
  await b.close();srv.close()})();
