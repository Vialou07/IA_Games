/* Mesure du « mini défilement » : pour quelques écrans, dépassement (px) et part due au min-height:60vh de .tabc */
const PW="C:/Users/vialo/AppData/Local/Temp/claude/c--Users-vialo-Desktop-Code-Worlds-2026/cead0307-273c-463a-8548-1b2491359512/scratchpad/pw/node_modules/playwright";
const {chromium,devices}=require(PW);const fs=require("fs"),path=require("path"),http=require("http");
const DIST=path.join(__dirname,"../dist"),PORT=8873;
const srv=http.createServer((q,s)=>{const f=path.join(DIST,q.url.split("?")[0]);if(!fs.existsSync(f)){s.writeHead(404);s.end();return}s.writeHead(200,{"content-type":"text/html; charset=utf-8"});fs.createReadStream(f).pipe(s)});
(async()=>{await new Promise(r=>srv.listen(PORT,"127.0.0.1",r));
  const b=await chromium.launch();const ctx=await b.newContext({...devices["Galaxy S9+"],viewport:{width:360,height:740},locale:"fr-FR",timezoneId:"Europe/Paris"});const p=await ctx.newPage();
  await p.goto(`http://127.0.0.1:${PORT}/worlds-b.html?nointro`);await p.waitForFunction(()=>typeof MATCHES!=="undefined"&&MATCHES.length&&document.querySelector(".home .grid .w"),null,{timeout:45000});await p.waitForTimeout(5000);
  const routes=await p.evaluate(()=>{const d=[...MATCHES].reverse().find(m=>m.winner&&m.bo===1),s=MATCHES.find(m=>m.state==="soon"&&m.t1&&m.t2);return ["m/"+d.id+"/pl","m/"+d.id+"/dr","m/"+s.id+"/ov","m/"+s.id+"/pl","sim","bets/run","fx/0","cal/res","rk/TOP","p/T1_faker/ch"]});
  for(const r of routes){await p.evaluate(r=>go(r),r);await p.waitForTimeout(2500);
    const m=await p.evaluate(()=>{const el=NAV[NAV.length-1].el,c=el.querySelector(".tabc");const over=el.classList.contains("fit")?0:el.scrollHeight-el.clientHeight;   /* .fit (socle) : contenu qui tient, défilement coupé */
      let nat=0;if(c){const cs=getComputedStyle(c);[...c.children].forEach(x=>{const r=x.getBoundingClientRect(),st=getComputedStyle(x);nat+=r.height+parseFloat(st.marginTop)+parseFloat(st.marginBottom)});nat+=parseFloat(cs.paddingTop)}
      return {over,fit:el.classList.contains("fit"),snug:el.classList.contains("snug"),tabc:c?Math.round(c.getBoundingClientRect().height):0,natural:Math.round(nat),minH:c?getComputedStyle(c).minHeight:""}});
    console.log(r.padEnd(40),JSON.stringify(m));await p.evaluate(()=>history.back());await p.waitForTimeout(700)}
  await b.close();srv.close()})();
