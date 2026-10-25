/* sonde ponctuelle (intégrateur) : node test/qa_probe.js <route> [appareil] — éléments qui dépassent le bas d'un écran .fit */
const PW="C:/Users/vialo/AppData/Local/Temp/claude/c--Users-vialo-Desktop-Code-Worlds-2026/cead0307-273c-463a-8548-1b2491359512/scratchpad/pw/node_modules/playwright";
const {chromium,devices}=require(PW);const fs=require("fs"),path=require("path"),http=require("http");const ROOT=path.join(__dirname,"..");
const srv=http.createServer((q,s)=>{const f=path.join(ROOT,decodeURIComponent(q.url.split("?")[0]));if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);s.end();return}s.writeHead(200,{"content-type":/html$/.test(f)?"text/html; charset=utf-8":"application/octet-stream"});fs.createReadStream(f).pipe(s)});
(async()=>{await new Promise(r=>srv.listen(8916,"127.0.0.1",r));const [route,dv]=process.argv.slice(2);const D={iphone12:devices["iPhone 12"],pixel7:devices["Pixel 7"],w360:{...devices["Galaxy S9+"],viewport:{width:360,height:740}}}[dv||"iphone12"];
  const b=await chromium.launch(),ctx=await b.newContext({...D,locale:"fr-FR",timezoneId:"Europe/Paris"}),p=await ctx.newPage();await p.goto("http://127.0.0.1:8916/dist/worlds-b.html?nointro");
  await p.waitForFunction(()=>typeof MATCHES!=="undefined"&&MATCHES.length&&document.querySelector(".home .grid .w"),null,{timeout:60000});await p.waitForTimeout(2500);
  await p.evaluate(r=>go(r),route);await p.waitForTimeout(2500);
  const r=await p.evaluate(()=>{const el=NAV[NAV.length-1].el,er=el.getBoundingClientRect();const out=[];
    el.querySelectorAll("*").forEach(x=>{const r=x.getBoundingClientRect();if(r.height>0&&r.bottom>er.bottom+1){const cs=getComputedStyle(x);let a=x.parentElement,clip=null;for(;a&&a!==el;a=a.parentElement){const c=getComputedStyle(a);if(c.overflowY!=="visible"){clip=(a.className||a.tagName)+"|"+c.overflowY+"|"+Math.round(a.getBoundingClientRect().bottom);break}}
      out.push((x.className||x.tagName)+" bottom "+Math.round(r.bottom)+" vis "+cs.visibility+" op "+cs.opacity+" disp "+cs.display+" clip "+clip)}});
    return {fit:el.classList.contains("fit"),sh:el.scrollHeight,ch:el.clientHeight,bottom:er.bottom,out:out.slice(0,12)}});
  console.log(JSON.stringify(r,null,1));await p.screenshot({path:path.join(ROOT,"shots","qa","probe.png")});await b.close();srv.close()})();
