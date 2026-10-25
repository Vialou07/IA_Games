/* profil CPU (intégrateur) de l'ouverture d'un écran — node test/qa_prof.js <route> */
const PW="C:/Users/vialo/AppData/Local/Temp/claude/c--Users-vialo-Desktop-Code-Worlds-2026/cead0307-273c-463a-8548-1b2491359512/scratchpad/pw/node_modules/playwright";
const {chromium,devices}=require(PW);const fs=require("fs"),path=require("path"),http=require("http");const ROOT=path.join(__dirname,"..");
const srv=http.createServer((q,s)=>{const f=path.join(ROOT,decodeURIComponent(q.url.split("?")[0]));if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);s.end();return}s.writeHead(200,{"content-type":/html$/.test(f)?"text/html; charset=utf-8":"application/octet-stream"});fs.createReadStream(f).pipe(s)});
(async()=>{await new Promise(r=>srv.listen(8920,"127.0.0.1",r));const route=process.argv[2];
  const b=await chromium.launch(),ctx=await b.newContext({...devices["iPhone 12"],locale:"fr-FR",timezoneId:"Europe/Paris"}),p=await ctx.newPage();
  await p.goto("http://127.0.0.1:8920/dist/worlds-b.html?nointro");await p.waitForFunction(()=>typeof MATCHES!=="undefined"&&MATCHES.length&&document.querySelector(".home .grid .w"),null,{timeout:60000});await p.waitForTimeout(6000);
  const cdp=await ctx.newCDPSession(p);await cdp.send("Emulation.setCPUThrottlingRate",{rate:4});await cdp.send("Profiler.enable");await cdp.send("Profiler.setSamplingInterval",{interval:200});
  await p.evaluate(async r=>{go(r);await new Promise(x=>setTimeout(x,1000));history.back();await new Promise(x=>setTimeout(x,800))},route);
  await cdp.send("Profiler.start");await p.evaluate(async r=>{go(r);await new Promise(x=>requestAnimationFrame(()=>requestAnimationFrame(x)))},route);const {profile}=await cdp.send("Profiler.stop");
  const self={},byId={};profile.nodes.forEach(n=>byId[n.id]=n);const dt=profile.timeDeltas;const cnt={};profile.samples.forEach((s,i)=>{cnt[s]=(cnt[s]||0)+(dt[i]||0)});
  for(const [id,us] of Object.entries(cnt)){const n=byId[id],k=(n.callFrame.functionName||"(anon)")+" "+(n.callFrame.url?"":"")+":"+n.callFrame.lineNumber;self[k]=(self[k]||0)+us}
  console.log(Object.entries(self).sort((a,b)=>b[1]-a[1]).slice(0,18).map(([k,v])=>Math.round(v/1000)+" ms  "+k).join("\n"));await b.close();srv.close()})();
