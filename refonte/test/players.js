/* =====================================================================================
   test/players.js — domaine « joueurs » : pl, rk, spe, p, cmp, teams, t (3 téléphones), zéro erreur JS,
   hauteurs (÷ écran), mini défilement (0 ou ≥ 120 px), débordement horizontal, clés w26_, captures shots/joueurs/.
   node test/players.js [iphone12|pixel7|w360] [--shared]
     par défaut : test/ply_dist/worlds-b.html (node test/ply_build.js) ; --shared : dist/worlds-b.html.
   Données du robot : lot1/data/*_pp.json (copies locales). Serveur local sur le port 8904.
   ===================================================================================== */
const PW="C:/Users/vialo/AppData/Local/Temp/claude/c--Users-vialo-Desktop-Code-Worlds-2026/cead0307-273c-463a-8548-1b2491359512/scratchpad/pw/node_modules/playwright";
const {chromium,devices}=require(PW);const fs=require("fs"),path=require("path"),http=require("http");
const ARGS=process.argv.slice(2),ONLY=ARGS.find(a=>!a.startsWith("--")),SHARED=ARGS.includes("--shared");
const DIST=SHARED?path.join(__dirname,"../dist"):path.join(__dirname,"ply_dist"),OUT=path.join(__dirname,"../shots/joueurs"),DATA=path.join(__dirname,"../../data"),PORT=8904;
fs.mkdirSync(OUT,{recursive:true});
const BASE=`http://127.0.0.1:${PORT}/worlds-b.html`;
const DEV={iphone12:{...devices["iPhone 12"]},pixel7:{...devices["Pixel 7"]},w360:{...devices["Galaxy S9+"],viewport:{width:360,height:740},screen:{width:360,height:740}}};
const srv=http.createServer((q,s)=>{const f=path.join(DIST,decodeURIComponent(q.url.split("?")[0]));if(!f.startsWith(DIST)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);s.end();return}
  s.writeHead(200,{"content-type":/\.html$/.test(f)?"text/html; charset=utf-8":/\.js$/.test(f)?"text/javascript":/\.json$/.test(f)?"application/json":"application/octet-stream","cache-control":"no-store"});fs.createReadStream(f).pipe(s)});
const R={};
async function run(name,dev){
  const b=await chromium.launch();const ctx=await b.newContext({...dev,locale:"fr-FR",timezoneId:"Europe/Paris"});
  await ctx.route(/raw\.githubusercontent\.com\/Vialou07\/IA_Games\/stats[^/]*\/data\/(\w+)\.json/,r=>{const n=r.request().url().match(/data\/(\w+)\.json/)[1],f=path.join(DATA,n+"_pp.json");
    r.fulfill({status:fs.existsSync(f)?200:404,contentType:"application/json",body:fs.existsSync(f)?fs.readFileSync(f,"utf8"):""})});
  const p=await ctx.newPage();const errs=[];
  p.on("pageerror",e=>errs.push(e.message));
  p.on("console",m=>{if(m.type()==="error"&&!/Failed to load resource|net::ERR/.test(m.text()))errs.push("console "+m.text().slice(0,200))});
  const res={screens:{},checks:{},errs};R[name]=res;
  p.setDefaultTimeout(25000);
  await p.goto(BASE+"?nointro",{waitUntil:"domcontentloaded"});
  await p.waitForFunction(()=>typeof MATCHES!=="undefined"&&MATCHES.length&&document.querySelector(".home .grid .w")&&typeof SJ!=="undefined"&&SJ,null,{timeout:45000});
  await p.waitForTimeout(2500);
  const W=ms=>p.waitForTimeout(ms);
  const measure=label=>p.evaluate(l=>{const el=NAV.length?NAV[NAV.length-1].el:document.querySelector(".home");
      const over=[...el.querySelectorAll("*")].filter(x=>{const r=x.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left<-1)&&!x.closest(".hbg,.beam,.wm,.hc,.ph,.seg")}).slice(0,4).map(x=>x.className&&x.className.baseVal==null?String(x.className).slice(0,40):x.nodeName);
      const ov=getComputedStyle(el).overflowY==="hidden"?0:el.scrollHeight-el.clientHeight;return {route:location.hash,h:el.scrollHeight,ih:innerHeight,ratio:+(el.scrollHeight/innerHeight).toFixed(2),mini:ov>0&&ov<120?ov:0,hscroll:el.scrollWidth>el.clientWidth+1||document.documentElement.scrollWidth>innerWidth+1,over}},label)
    .then(m=>{res.screens[label]=m;return m});
  const shot=async(label,scroll)=>{await p.screenshot({path:`${OUT}/${name}_${label}.png`});
    if(scroll){const more=await p.evaluate(()=>{const el=NAV.length?NAV[NAV.length-1].el:document.querySelector(".home");if(el.scrollHeight<=el.clientHeight+4)return false;el.scrollTop=el.scrollHeight;return true});
      if(more){await W(450);await p.screenshot({path:`${OUT}/${name}_${label}_bas.png`});await p.evaluate(()=>{const el=NAV.length?NAV[NAV.length-1].el:document.querySelector(".home");el.scrollTop=0})}}};
  const open=async(r,wait=1300)=>{await p.evaluate(r=>go(r),r);await W(wait)};
  const tab=async k=>{await p.evaluate(k=>{const el=NAV[NAV.length-1].el;const b=el.querySelector(`.seg [data-tab="${k}"]`);if(b)b.click()},k);await W(650)};
  const back=async()=>{await p.evaluate(()=>{if(SHEET.open)closeSheet();else history.back()});await W(750)};
  const home=async()=>{await p.evaluate(()=>{if(SHEET.open)hideSheet();const n=NAV.length;if(n)history.go(-n)});await W(900)};
  const click=async(sel,wait=700)=>{const ok=await p.evaluate(s=>{const el=(NAV.length?NAV[NAV.length-1].el:document).querySelector(s)||document.querySelector(s);if(!el)return false;el.scrollIntoView({block:"center"});el.click();return true},sel);await W(wait);return ok};
  const typo=()=>p.evaluate(()=>{const tw=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let x,n=0;const ex=[];while((x=tw.nextNode())){const e=x.parentElement;if(!e||/^(SCRIPT|STYLE)$/.test(e.nodeName))continue;if(/ [:;?!%]/.test(x.nodeValue)){n++;if(ex.length<3)ex.push(x.nodeValue.trim().slice(0,40))}}return {n,ex}});
  const sheet=()=>p.evaluate(()=>({open:SHEET.open,title:(document.querySelector("#shT")||{}).textContent||"",bars:document.querySelectorAll("#shB .contrib").length}));
  const depth=()=>p.evaluate(()=>({n:NAV.length,v:NAV.length?NAV[NAV.length-1].d.v:"home",hash:location.hash,state:history.state}));

  /* ---------- 0. temps d'ouverture, processeur ralenti 4 fois (go → 2 images) ---------- */
  {const cdp=await ctx.newCDPSession(p);res.opens={};
    for(const r of ["pl","p/T1_faker","rk/MID","t/GEN","cmp/T1_faker~GEN_chovy","spe","teams"]){await cdp.send("Emulation.setCPUThrottlingRate",{rate:4});
      res.opens[r]=await p.evaluate(async r=>{const t0=performance.now();go(r);await new Promise(x=>requestAnimationFrame(()=>requestAnimationFrame(x)));return Math.round(performance.now()-t0)},r);
      await cdp.send("Emulation.setCPUThrottlingRate",{rate:1});await W(900);await home()}}

  /* ---------- 1. Joueurs (pl) ---------- */
  await open("pl");await measure("pl");await shot("01_joueurs",true);res.checks.typoPl=await typo();
  res.checks.plCount=await p.evaluate(()=>document.querySelectorAll(".ply-grid .ply-card").length);
  // recherche : la liste se redessine, le champ garde le clavier
  await p.focus(".scr:last-of-type .ply-qi").catch(()=>{});await p.keyboard.type("faker",{delay:30});await W(500);
  res.checks.search=await p.evaluate(()=>({cards:document.querySelectorAll(".ply-grid .ply-card").length,focus:document.activeElement&&document.activeElement.classList.contains("ply-qi"),first:(document.querySelector(".ply-grid .hc .bd b")||{}).textContent}));
  await p.evaluate(()=>{const i=document.querySelector(".ply-qi");i.value="";i.dispatchEvent(new Event("input",{bubbles:true}))});await W(400);
  await click('[data-plyrole="MID"]');res.checks.mid=await p.evaluate(()=>document.querySelectorAll(".ply-grid .ply-card").length);
  await click('[data-plytog="leg"]');res.checks.midLeg=await p.evaluate(()=>[...document.querySelectorAll(".ply-grid .hc .bd b")].map(b=>b.textContent));await shot("02_joueurs_mid_champions");
  await click('[data-plyclear]');await click('[data-plytog="live"]');res.checks.live=await p.evaluate(()=>document.querySelectorAll(".ply-grid .ply-card").length);await click('[data-plyclear]');
  await click("[data-plynats]",700);res.checks.natSheet=await sheet();await shot("03_joueurs_pays");
  await click('#shB [data-plynat="kr"]',1200);res.checks.kr=await p.evaluate(()=>({cards:document.querySelectorAll(".ply-grid .ply-card").length,sheet:SHEET.open,depth:NAV.length}));
  await click('[data-plyclear]');
  // carte du monde (d3 + topojson chargés à la demande ; réseau requis)
  await p.evaluate(()=>{const d=document.querySelector(".ply-map");d.open=true});await W(6000);
  res.checks.map=await p.evaluate(()=>({svg:!!document.querySelector(".ply-wm svg"),paths:document.querySelectorAll(".ply-wm .land.has").length,dots:document.querySelectorAll(".ply-wm .dot").length,msg:(document.querySelector(".ply-wm .note")||{}).textContent||""}));
  await p.evaluate(()=>{const d=document.querySelector(".ply-map");d.scrollIntoView({block:"start"})});await W(300);await shot("04_joueurs_carte");
  if(res.checks.map.svg){await p.evaluate(()=>{const c=document.querySelector('.ply-wm .dot[data-plynat="kr"]');c.dispatchEvent(new MouseEvent("click",{bubbles:true}))});await W(900);
    res.checks.mapKr=await p.evaluate(()=>({nat:PLY.nat,cards:document.querySelectorAll(".ply-grid .ply-card").length,sel:document.querySelectorAll(".ply-wm .sel").length}))}
  await p.evaluate(()=>{Object.assign(PLY,{role:"all",nat:null,q:"",live:false,leg:false,map:false})});
  await click('.ply-grid .ply-card[data-go="p/T1_faker"]',1300);res.checks.cardOpens=await depth();
  await home();

  /* ---------- 2. Classement (rk) ---------- */
  await open("rk/MID");await measure("rk_mid");await shot("05_classement_mid",true);res.checks.typoRk=await typo();
  res.checks.rk=await p.evaluate(()=>({ans:(document.querySelector(".scr:last-of-type .ply-ans")||{}).textContent||"",podium:document.querySelectorAll(".scr:last-of-type .podium .pl").length,rows:document.querySelectorAll(".scr:last-of-type .ply-rkl .ply-rkr").length,range:document.querySelectorAll(".scr:last-of-type .ply-rkr .n small").length}));
  await click(".ply-rkl .ply-rkr",800);res.checks.why=await sheet();await shot("06_classement_pourquoi");
  await click('#shB [data-cmp]',1500);res.checks.whyCmp=await depth();res.checks.whyCmpSheet=await p.evaluate(()=>SHEET.open);await back();
  res.checks.backToRk=await depth();
  await click('[data-info="plysort"]');await click('#shB [data-plyst="kda"]',1100);
  res.checks.raw=await p.evaluate(()=>({brut:/brut/.test(document.querySelector(".scr:last-of-type .ply-ans").textContent),rows:document.querySelectorAll(".scr:last-of-type .ply-rkr").length,st:PLY.st}));await shot("07_classement_kda");
  await click('[data-info="plysort"]');await click('#shB [data-plyst="imp"]',900);
  await click("[data-plyrkleg]");res.checks.rkLeg=await p.evaluate(()=>document.querySelectorAll(".scr:last-of-type .ply-rkr").length);await click("[data-plyrkleg]");
  for(const r of ["TOP","JGL","BOT","SUP"]){await tab(r);await measure("rk_"+r)}
  await home();

  /* ---------- 3. Spécial Worlds ---------- */
  await open("spe");await measure("spe_eq");await shot("08_special_equipes",true);
  await tab("jo");await measure("spe_jo");await shot("09_special_joueurs",true);
  await open("spe/jo/T1_faker");await measure("spe_focus");await shot("10_special_faker");res.checks.speFocus=await p.evaluate(()=>!!document.querySelector(".scr:last-of-type .ply-wr.me"));
  await home();

  /* ---------- 4. Fiche joueur ---------- */
  await open("p/T1_faker",2000);await measure("p_ap");await shot("11_faker_apercu",true);res.checks.typoP=await typo();
  res.checks.brief=await p.evaluate(()=>[...document.querySelectorAll(".scr:last-of-type .ply-ln>b")].map(b=>b.textContent));
  await click('.scr:last-of-type .ply-idb',700);res.checks.profil=await sheet();await shot("12_faker_profil");await back();
  for(const [k,l] of [["sa","13_faker_saison"],["du","14_faker_duels"],["ch","15_faker_champions"]]){await tab(k);await measure("p_"+k);await shot(l,true)}
  await tab("sa");await click(".scr:last-of-type .form button",700);res.checks.game=await sheet();await back();
  await click(".scr:last-of-type .ply-rkb",700);res.checks.whySelf=await sheet();await back();
  /* un joueur dont l'équipe a un match à venir : ligne « Prochain duel » → duel d/ */
  const nk=await p.evaluate(()=>{const m=MATCHES.find(x=>(x.state==="soon"||x.state==="live")&&x.t1&&x.t2);return m?teamPlayers(m.t1)[2].key:null});res.checks.nextKey=nk;
  if(nk){await open("p/"+nk,1500);await measure("p_next");await shot("11b_prochain_duel");res.checks.nd=await p.evaluate(()=>{const b=document.querySelector(".scr:last-of-type .ply-nd");return b?{go:b.dataset.go,txt:b.textContent.replace(/\s+/g," ").trim().slice(0,90)}:null});
    if(res.checks.nd){await click(".scr:last-of-type .ply-nd",1300);res.checks.ndOpens=await depth();await back()}await back()}
  await tab("ap");await click('.ply-ln[data-tab="du"]',800);res.checks.toDuels=await p.evaluate(()=>NAV[NAV.length-1].d.tab);
  for(const k of ["GEN_chovy","DK_siwoo","FUR_tutsz","T1_keria","MVK_chika"]){await open("p/"+k,1200);await measure("p_"+k);for(const t of ["sa","du","ch"]){await tab(t);await measure("p_"+k+"_"+t)}await back()}
  await home();

  /* ---------- 5. Comparaison ---------- */
  await open("cmp/T1_faker~GEN_chovy",1800);await measure("cmp_sa");await shot("16_cmp_saison",true);
  await tab("ch");await measure("cmp_ch");await shot("17_cmp_champions");
  await tab("du");await measure("cmp_du");await shot("18_cmp_duels",true);
  res.checks.cmpDu=await p.evaluate(()=>({phrase:(document.querySelector(".scr:last-of-type .ply-ans")||{}).textContent||"",enc:document.querySelectorAll(".scr:last-of-type .ply-enc").length}));
  await click(".scr:last-of-type .ply-enc",700);res.checks.encSheet=await sheet();await shot("19_cmp_rencontre");await back();
  await click('.ply-cvs [data-info]',700);await click('#shB [data-plycmp$="DK_showmaker"]',1300);res.checks.change=await depth();
  res.checks.changeHead=await p.evaluate(()=>[...document.querySelectorAll(".scr:last-of-type .ply-cs b")].map(b=>b.textContent));
  await open("cmp/T1_faker~BLG_bin",1500);await measure("cmp_roles");
  await home();

  /* ---------- 6. Équipes ---------- */
  await open("teams");await measure("teams");await shot("20_equipes",true);res.checks.teams=await p.evaluate(()=>document.querySelectorAll(".tea-card").length);
  await click('[data-tealg="LEC"]');res.checks.lec=await p.evaluate(()=>[...document.querySelectorAll(".tea-card .hd b")].map(b=>b.textContent));
  await click('[data-tealg="all"]');
  await open("t/GEN",1500);await measure("t_ap");await shot("21_gen_apercu",true);res.checks.typoT=await typo();
  await tab("sa");await measure("t_sa");await shot("22_gen_saison",true);
  await tab("ma");await measure("t_ma");await shot("23_gen_matchs",true);
  await tab("ap");await click('.scr:last-of-type .ply-ln',700);res.checks.force=await sheet();await shot("24_gen_force");await back();
  const fav0=await p.evaluate(()=>localStorage.getItem("w26_fav"));
  await click(".scr:last-of-type .tea-fav",900);res.checks.fav=await p.evaluate(()=>localStorage.getItem("w26_fav"));await click(".scr:last-of-type .tea-fav",900);
  res.checks.favBack=await p.evaluate(()=>localStorage.getItem("w26_fav"));if(fav0!==res.checks.favBack)await p.evaluate(v=>localStorage.setItem("w26_fav",v),fav0);
  for(const k of ["KC","MVK","LOS","T1"]){await open("t/"+k,1200);await measure("t_"+k);for(const t of ["sa","ma"]){await tab(t);await measure("t_"+k+"_"+t)}await back()}
  await home();

  res.checks.keys=await p.evaluate(()=>Object.keys(localStorage).filter(k=>!k.startsWith("w26_")));
  res.checks.typoEnd=await typo();
  await b.close();
}
(async()=>{await new Promise(r=>srv.listen(PORT,"127.0.0.1",r));
  for(const n of Object.keys(DEV)){if(ONLY&&n!==ONLY)continue;try{await run(n,DEV[n])}catch(e){(R[n]=R[n]||{}).fatal=String(e&&e.stack||e).slice(0,600);console.log(n,"ÉCHEC",e)}}
  srv.close();fs.writeFileSync(path.join(__dirname,"players_results.json"),JSON.stringify(R,null,1));
  for(const n in R){const r=R[n];console.log(`\n=== ${n} : ${r.errs?r.errs.length:"?"} erreur(s) JS ${r.fatal?"FATAL "+r.fatal:""}`);(r.errs||[]).slice(0,8).forEach(e=>console.log("  ERR",e));
    for(const [k,v] of Object.entries(r.screens||{}))console.log(`  ${k.padEnd(22)} ${String(v.ratio).padEnd(5)} ${v.mini?"MINI "+v.mini:""}${v.hscroll?" HSCROLL":""}${v.over&&v.over.length?" over:"+v.over.join(","):""}`);
    console.log("  checks",JSON.stringify(r.checks))}
})();
