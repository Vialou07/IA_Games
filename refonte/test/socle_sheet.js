/* test/socle_sheet.js — lien dans une feuille « i » (podium du bilan → fiche du joueur) : la feuille se ferme, l'écran s'ouvre,
   le retour revient au bilan. node test/socle_sheet.js (port 8906, dist/socle) */
const PW="C:/Users/vialo/AppData/Local/Temp/claude/c--Users-vialo-Desktop-Code-Worlds-2026/cead0307-273c-463a-8548-1b2491359512/scratchpad/pw/node_modules/playwright";
const {chromium,devices}=require(PW);const fs=require("fs"),path=require("path"),http=require("http");
const DIST=path.join(__dirname,"../dist/socle"),OUT=path.join(__dirname,"../shots/socle");
const srv=http.createServer((q,s)=>{const f=path.join(DIST,decodeURIComponent(q.url.split("?")[0]));if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);s.end();return}s.writeHead(200,{"content-type":/html$/.test(f)?"text/html; charset=utf-8":"application/octet-stream"});fs.createReadStream(f).pipe(s)});
(async()=>{await new Promise(r=>srv.listen(8906,"127.0.0.1",r));const b=await chromium.launch(),errs=[];
  const ctx=await b.newContext({...devices["iPhone 12"],locale:"fr-FR",timezoneId:"Europe/Paris"});const p=await ctx.newPage();
  p.on("pageerror",e=>errs.push(e.message));p.on("console",m=>{if(m.type()==="error"&&!/Failed to load|ERR_/.test(m.text()))errs.push(m.text())});
  await p.goto("http://127.0.0.1:8906/worlds-b.html?nointro");await p.waitForFunction(()=>typeof MATCHES!=="undefined"&&MATCHES.length&&document.querySelector(".home .grid .w"),null,{timeout:45000});await p.waitForTimeout(3000);
  const dk=await p.evaluate(()=>HM.recent||HM.last);await p.evaluate(dk=>go("eve/"+dk),dk);await p.waitForTimeout(2500);
  const r={};r.rows=await p.evaluate(()=>document.querySelectorAll(".scr .evp").length);
  await p.click(".scr .evp");await p.waitForTimeout(600);r.sheet=await p.evaluate(()=>({open:SHEET.open,t:document.querySelector("#shT").textContent,txt:document.querySelector("#shB p").textContent.slice(0,120)}));
  await p.screenshot({path:`${OUT}/iphone12_eve_podium_feuille.png`});
  await p.click("#shB [data-p]");await p.waitForTimeout(1200);r.after=await p.evaluate(()=>({open:SHEET.open,top:routeOf(NAV[NAV.length-1].d),depth:NAV.length,hist:history.state}));
  await p.evaluate(()=>history.back());await p.waitForTimeout(900);r.back=await p.evaluate(()=>({top:NAV.length?routeOf(NAV[NAV.length-1].d):"accueil",depth:NAV.length}));
  console.log(JSON.stringify(r,null,1),"\nerreurs JS",errs.length,errs.join(" | "));await b.close();srv.close()})();
