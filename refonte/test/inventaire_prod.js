/* Parcours en lecture seule de la prod v13.5 (worlds.html) pour l'inventaire : chaque onglet, chaque type de fiche,
   plan des titres (h2, h3, summary, boutons), captures pleine page. Rien n'est écrit (pas de ligue, pas de pari).
   node inventaire_prod.js [url]  →  test/inv/*.png + test/inv/plan.json */
const PW="C:/Users/vialo/AppData/Local/Temp/claude/c--Users-vialo-Desktop-Code-Worlds-2026/cead0307-273c-463a-8548-1b2491359512/scratchpad/pw/node_modules/playwright";
const {chromium,devices}=require(PW);const fs=require("fs");
const URL0=process.argv[2]||"https://vialou07.github.io/IA_Games/worlds.html";
const OUT=__dirname+"/inv";fs.mkdirSync(OUT,{recursive:true});
const plan={};
(async()=>{
  const b=await chromium.launch();const ctx=await b.newContext({...devices["Pixel 7"],locale:"fr-FR",timezoneId:"Europe/Paris"});
  const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
  await p.goto(URL0+"?v="+Date.now(),{waitUntil:"domcontentloaded"});await p.waitForTimeout(9000);
  const ctxi=await p.evaluate(()=>{const M=MATCHES,f=x=>x&&{id:x.id,t:x.t1+"-"+x.t2,bo:x.bo,s:x.state,sc:x.s1+"-"+x.s2};
    return {v:APP_VERSION,src:SOURCE,mo:homeMoment().k,live:f(M.find(m=>m.state==="live")),wait:f(M.find(m=>m.state==="wait")),soon:f(M.find(m=>m.state==="soon"&&m.t1&&m.t2)),
      done1:f([...M].reverse().find(m=>m.winner&&m.bo===1&&/^le/.test(m.id))),doneN:f([...M].reverse().find(m=>m.winner&&m.bo>1&&/^le/.test(m.id))),n:M.length,
      sj:!!SJ,keys:SJ?Object.keys(SJ):[],lg:!!lg,ls:Object.keys(localStorage)}});
  plan.ctx=ctxi;console.log(JSON.stringify(ctxi).slice(0,600));
  // plan d'un conteneur : titres, résumés de <details>, boutons, notes (texte tronqué)
  const outline=sel=>p.evaluate(s=>{const root=document.querySelector(s);if(!root)return null;
    root.querySelectorAll("details:not([open])").forEach(d=>{d.open=true});   // tout déplier pour voir le niveau 2
    const T=(e,n=110)=>(e.innerText||"").replace(/\s+/g," ").trim().slice(0,n);
    const out=[];root.querySelectorAll("h1,h2,h3,h4,summary,.note,.sub,.small,.btn,.chip,[data-duel],[data-diag],.lsv-hd,.amhd,.rkh,.l2h,.dcta").forEach(e=>{
      const t=T(e);if(!t)return;out.push(e.tagName.toLowerCase()+(e.className&&typeof e.className==="string"?"."+e.className.split(" ")[0]:"")+" | "+t)});
    return {h:root.scrollHeight,n:out.length,items:[...new Set(out)].slice(0,400)}},sel);
  const shot=async(name,full=true)=>{await p.screenshot({path:`${OUT}/${name}.png`,fullPage:full})};
  // 1. onglets
  for(const v of ["home","matchs","swiss","stats","teams","players"]){
    await p.evaluate(v=>{const b=document.querySelector(`nav.tabs button[data-v="${v}"]`);b&&b.click()},v);await p.waitForTimeout(v==="stats"||v==="players"?4000:1500);
    plan["tab_"+v]=await outline("#v-"+v);await shot("tab_"+v);console.log("onglet",v,plan["tab_"+v]&&plan["tab_"+v].n);
  }
  // classement 2026 (Joueurs)
  await p.evaluate(()=>{ui.pview="rank";ui.pstat="imp";ui.role="all";renderPlayers()});await p.waitForTimeout(1200);plan.tab_players_rank=await outline("#v-players");await shot("tab_players_rank");
  await p.evaluate(()=>{ui.role="MID";renderPlayers()});await p.waitForTimeout(800);plan.tab_players_rank_mid=await outline("#v-players");await shot("tab_players_rank_mid");
  await p.evaluate(()=>{ui.pstat="kda";renderPlayers()});await p.waitForTimeout(800);plan.tab_players_raw=await outline("#v-players");
  await p.evaluate(()=>{ui.pview="cards";ui.pstat="imp";ui.role="all";renderPlayers();showTab("home")});await p.waitForTimeout(800);
  // 2. fiches
  const sheet=async(name,js,wait=5000)=>{try{await p.evaluate(js);await p.waitForTimeout(wait);plan["sheet_"+name]=await outline("#sheetBody");await p.evaluate(()=>{document.querySelector("#sheet").scrollTop=0});await shot("sheet_"+name,false);
      await p.evaluate(()=>closeSheet());await p.waitForTimeout(700);console.log("fiche",name,plan["sheet_"+name]&&plan["sheet_"+name].n)}catch(e){console.log("fiche",name,"ERREUR",e.message)}};
  const C=ctxi;
  if(C.soon)await sheet("match_avenir",`matchSheet(${JSON.stringify(C.soon.id)})`,7000);
  if(C.live)await sheet("match_direct",`matchSheet(${JSON.stringify(C.live.id)})`,15000);
  if(C.wait)await sheet("match_attente",`matchSheet(${JSON.stringify(C.wait.id)})`,8000);
  if(C.done1)await sheet("match_fini_bo1",`matchSheet(${JSON.stringify(C.done1.id)})`,9000);
  if(C.doneN)await sheet("match_fini_serie",`matchSheet(${JSON.stringify(C.doneN.id)})`,12000);
  await sheet("equipe_GEN",`teamSheet("GEN")`,6000);
  await sheet("joueur_faker",`playerSheet("T1_faker")`,7000);
  await sheet("comparaison",`compareSheet("T1_faker|GEN_chovy")`,6000);
  await sheet("duel_detaille",`amVsSheet("T1_faker|GEN_chovy")`,6000);
  await sheet("special_worlds",`worldsSheet("")`,3000);
  await sheet("diagnostic",`diagSheet()`,1500);
  await sheet("ligue_creer",`duelSheet("create")`,1000);
  await sheet("ligue_rejoindre",`duelSheet("join")`,1000);
  plan.errs=errs;fs.writeFileSync(OUT+"/plan.json",JSON.stringify(plan,null,1));
  console.log("erreurs JS",errs.length,errs.slice(0,5).join(" | "));await b.close();
})();
