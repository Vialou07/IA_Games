/* sonde (intégrateur) : coût du rendu HTML seul (CPU ×4) de quelques écrans — node test/qa_perf3.js */
const PW="C:/Users/vialo/AppData/Local/Temp/claude/c--Users-vialo-Desktop-Code-Worlds-2026/cead0307-273c-463a-8548-1b2491359512/scratchpad/pw/node_modules/playwright";
const {chromium,devices}=require(PW);const fs=require("fs"),path=require("path"),http=require("http");const ROOT=path.join(__dirname,"..");
const srv=http.createServer((q,s)=>{const f=path.join(ROOT,decodeURIComponent(q.url.split("?")[0]));if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);s.end();return}s.writeHead(200,{"content-type":/html$/.test(f)?"text/html; charset=utf-8":"application/octet-stream"});fs.createReadStream(f).pipe(s)});
(async()=>{await new Promise(r=>srv.listen(8919,"127.0.0.1",r));
  const b=await chromium.launch(),ctx=await b.newContext({...devices["iPhone 12"],locale:"fr-FR",timezoneId:"Europe/Paris"}),p=await ctx.newPage();
  await p.goto("http://127.0.0.1:8919/dist/worlds-b.html?nointro");await p.waitForFunction(()=>typeof MATCHES!=="undefined"&&MATCHES.length&&document.querySelector(".home .grid .w"),null,{timeout:60000});await p.waitForTimeout(6000);
  const cdp=await ctx.newCDPSession(p);await cdp.send("Emulation.setCPUThrottlingRate",{rate:4});
  console.log(JSON.stringify(await p.evaluate(()=>{const T=(f,n=3)=>{const v=[];for(let i=0;i<n;i++){const t=performance.now();f();v.push(performance.now()-t)}return Math.round(v.sort((a,b)=>a-b)[1])};
    const o={};o.teaListBody=T(()=>teaListBody());o.plyBody=T(()=>plyBody());o.records=T(()=>records());
    const h=teaListBody(),d=document.createElement("div");o.typo_teams=T(()=>{d.innerHTML=h;typoNode(d)});const h2=plyBody();o.typo_pl=T(()=>{d.innerHTML=h2;typoNode(d)});
    o.parse_pl=T(()=>{const x=document.createElement("div");x.innerHTML=h2});return o})));
  await b.close();srv.close()})();
