/* sonde de performance (intégrateur) : où part le temps à l'ouverture d'un écran (CPU ×4) — node test/qa_perf2.js <route>… */
const PW="C:/Users/vialo/AppData/Local/Temp/claude/c--Users-vialo-Desktop-Code-Worlds-2026/cead0307-273c-463a-8548-1b2491359512/scratchpad/pw/node_modules/playwright";
const {chromium,devices}=require(PW);const fs=require("fs"),path=require("path"),http=require("http");const ROOT=path.join(__dirname,"..");
const srv=http.createServer((q,s)=>{const f=path.join(ROOT,decodeURIComponent(q.url.split("?")[0]));if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);s.end();return}s.writeHead(200,{"content-type":/html$/.test(f)?"text/html; charset=utf-8":"application/octet-stream"});fs.createReadStream(f).pipe(s)});
(async()=>{await new Promise(r=>srv.listen(8918,"127.0.0.1",r));const routes=process.argv.slice(2);
  const b=await chromium.launch(),ctx=await b.newContext({...devices["iPhone 12"],locale:"fr-FR",timezoneId:"Europe/Paris"}),p=await ctx.newPage();
  await p.goto("http://127.0.0.1:8918/dist/worlds-b.html?nointro");await p.waitForFunction(()=>typeof MATCHES!=="undefined"&&MATCHES.length&&document.querySelector(".home .grid .w"),null,{timeout:60000});await p.waitForTimeout(6000);
  const cdp=await ctx.newCDPSession(p);await cdp.send("Emulation.setCPUThrottlingRate",{rate:4});
  for(const r of routes)for(let i=0;i<4;i++){const o=await p.evaluate(async r=>{const t=performance.now();go(r);const js=performance.now()-t;await new Promise(x=>requestAnimationFrame(x));const f1=performance.now()-t;await new Promise(x=>requestAnimationFrame(x));const f2=performance.now()-t;
      const n=NAV[NAV.length-1].el.querySelectorAll("*").length;await new Promise(x=>setTimeout(x,1200));history.back();await new Promise(x=>setTimeout(x,900));return {r,js:Math.round(js),f1:Math.round(f1),f2:Math.round(f2),noeuds:n}},r);console.log(JSON.stringify(o))}
  await b.close();srv.close()})();
