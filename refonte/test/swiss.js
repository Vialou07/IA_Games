/* =====================================================================================
   test/swiss.js — module suisse : écrans sui (Ronde, Tableau, Bilans, Finale), sim (Titre, Tableau, Robot), cal (À venir,
   Résultats, filtre), feuilles (case de l'arbre, équipe, mon équipe, i), widgets sim / swiss / myteam, w26_fav.
   Sur iPhone 12 (390×664), Pixel 7, 360×740 : erreurs JS, débordement horizontal, hauteur ÷ écran, « mini défilement »
   (dépassement 0 ou ≥ 120 px), cibles tactiles < 40 px, typographie, clés localStorage. Captures : shots/suisse/.
   node test/swiss.js [iphone12|pixel7|w360] [--local]      (DIST=… pour tester un autre dist ; serveur sur le port 8902)
   ===================================================================================== */
const PW="C:/Users/vialo/AppData/Local/Temp/claude/c--Users-vialo-Desktop-Code-Worlds-2026/cead0307-273c-463a-8548-1b2491359512/scratchpad/pw/node_modules/playwright";
const {chromium,devices}=require(PW);const fs=require("fs"),path=require("path"),http=require("http");
const DIST=path.resolve(process.env.DIST||path.join(__dirname,"../dist")),OUT=path.join(__dirname,"../shots/suisse"),DATA=path.join(__dirname,"../../data");fs.mkdirSync(OUT,{recursive:true});
const ARGS=process.argv.slice(2),ONLY=ARGS.find(a=>!a.startsWith("--")),LOCAL=ARGS.includes("--local"),PORT=8902;
const BASE=`http://127.0.0.1:${PORT}/worlds-b.html`;
const DEV={iphone12:{...devices["iPhone 12"]},pixel7:{...devices["Pixel 7"]},w360:{...devices["Galaxy S9+"],viewport:{width:360,height:740},screen:{width:360,height:740}}};
const srv=http.createServer((q,s)=>{const f=path.join(DIST,decodeURIComponent(q.url.split("?")[0]));if(!f.startsWith(DIST)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);s.end();return}
  s.writeHead(200,{"content-type":"text/html; charset=utf-8","cache-control":"no-store"});fs.createReadStream(f).pipe(s)});
const R={};
async function run(name,dev){
  const b=await chromium.launch();const ctx=await b.newContext({...dev,locale:"fr-FR",timezoneId:"Europe/Paris"});
  if(LOCAL)await ctx.route(/raw\.githubusercontent\.com\/Vialou07\/IA_Games\/stats[^/]*\/data\/(\w+)\.json/,r=>{const n=r.request().url().match(/data\/(\w+)\.json/)[1],f=path.join(DATA,n+"_pp.json");
    r.fulfill({status:fs.existsSync(f)?200:404,contentType:"application/json",body:fs.existsSync(f)?fs.readFileSync(f,"utf8"):""})});
  const p=await ctx.newPage();const errs=[];
  p.on("pageerror",e=>errs.push(e.message));
  p.on("console",m=>{if(m.type()==="error"&&!/Failed to load resource|ERR_|net::/.test(m.text()))errs.push("console "+m.text().slice(0,200))});
  const res={screens:{},errs,checks:{}};R[name]=res;
  p.setDefaultTimeout(20000);await p.goto(BASE+"?nointro",{waitUntil:"domcontentloaded"});
  await p.waitForFunction(()=>typeof MATCHES!=="undefined"&&MATCHES.length&&document.querySelector(".home .grid .w"),null,{timeout:45000});
  await p.waitForFunction(()=>typeof SJ!=="undefined"&&SJ&&SJ.sim,null,{timeout:30000}).catch(()=>{});
  await p.waitForTimeout(2500);
  await p.evaluate(()=>{localStorage.removeItem("w26_fav");fav=null});
  const shot=(l,full)=>p.screenshot({path:`${OUT}/${name}_${l}.png`,fullPage:false}).then(async()=>{if(full){const h=await p.evaluate(()=>{const el=NAV.length?NAV[NAV.length-1].el:HOME;return el.scrollHeight-el.clientHeight});if(h>40){await p.evaluate(()=>{const el=NAV[NAV.length-1].el;el.scrollTop=el.scrollHeight});await p.waitForTimeout(300);await p.screenshot({path:`${OUT}/${name}_${l}_bas.png`});await p.evaluate(()=>{NAV[NAV.length-1].el.scrollTop=0});await p.waitForTimeout(150)}}});
  /* mesures : hauteur ÷ écran, dépassement, défilement horizontal, cibles < 40 px dans la tabc et la tête */
  const measure=async l=>{const m=await p.evaluate(()=>{const el=NAV.length?NAV[NAV.length-1].el:HOME;
    const over=[...el.querySelectorAll("*")].filter(x=>{const r=x.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left<-1)&&!x.closest(".hbg,.beam,.hc,.ph,.seg")}).slice(0,4).map(x=>x.className+"|"+Math.round(x.getBoundingClientRect().right));
    const small=[...el.querySelectorAll(".tabc button,.tabc [role=button],.headslot button,.tabc a")].filter(x=>{const r=x.getBoundingClientRect();return r.width>0&&(r.height<39.5||r.width<39.5)}).map(x=>x.className.split(" ")[0]+":"+Math.round(x.getBoundingClientRect().width)+"x"+Math.round(x.getBoundingClientRect().height));
    const sm={};small.forEach(s=>sm[s]=(sm[s]||0)+1);
    const fit=el.classList.contains("fit");return {h:el.scrollHeight,ih:el.clientHeight,ratio:+(el.scrollHeight/el.clientHeight).toFixed(2),excess:fit?0:el.scrollHeight-el.clientHeight,cad:fit?"fit":el.classList.contains("snug")?"snug":"",hscroll:el.scrollWidth>el.clientWidth+1||document.documentElement.scrollWidth>innerWidth+1,over,small:sm}});
    res.screens[l]=m;return m};
  const typo=()=>p.evaluate(()=>{const tw=document.createTreeWalker(NAV.length?NAV[NAV.length-1].el:document.body,NodeFilter.SHOW_TEXT);let x,n=0;const ex=[];while((x=tw.nextNode())){const e=x.parentElement;if(!e||/^(SCRIPT|STYLE)$/.test(e.nodeName))continue;if(/ [:;?!%]/.test(x.nodeValue)){n++;if(ex.length<3)ex.push(x.nodeValue.trim().slice(0,50))}}return {n,ex}});
  const go=async(r,w=1100)=>{await p.evaluate(r=>go(r),r);await p.waitForTimeout(w)};
  const tab=async k=>{await p.evaluate(k=>{const b=NAV[NAV.length-1].el.querySelector(`.seg [data-tab="${k}"]`);b&&b.click()},k);await p.waitForTimeout(650)};
  const back=async()=>{await p.evaluate(()=>history.back());await p.waitForTimeout(700)};
  const sheet=async(sel,l)=>{const ok=await p.evaluate(s=>{const x=NAV[NAV.length-1].el.querySelector(s);if(!x)return false;x.scrollIntoView({block:"center"});x.click();return true},sel);if(!ok)return null;await p.waitForTimeout(600);
    const info=await p.evaluate(()=>({open:document.querySelector("#sheet").classList.contains("on"),t:(document.querySelector("#shT")||{}).textContent,n:document.querySelector("#shB").textContent.length,hscroll:document.querySelector("#sheet").scrollWidth>document.querySelector("#sheet").clientWidth+1}));
    if(l)await p.screenshot({path:`${OUT}/${name}_${l}.png`});await back();return info};
  const ctx0=await p.evaluate(()=>{const S=swiState();return {src:SOURCE,r:S.r,drawn:S.drawn,played:S.played,q:S.q,x:S.x,over:S.over,teams:S.teams.length,mo:homeMoment().k,sim:!!(SJ&&SJ.sim)}});res.ctx=ctx0;
  /* ---- phase suisse ---- */
  await go("sui");await measure("sui_ronde");await shot("01_sui_ronde",true);res.checks.typoSui=await typo();
  res.checks.defaultTab=await p.evaluate(()=>NAV[NAV.length-1].el._d.tab);
  res.checks.roundGroups=await p.evaluate(()=>[...NAV[NAV.length-1].el.querySelectorAll(".swi-gh")].map(x=>x.textContent.trim().slice(0,60)));
  await tab("tb");await measure("sui_tableau");await shot("02_sui_tableau",true);
  res.checks.tree=await p.evaluate(()=>{const el=NAV[NAV.length-1].el,n=el.querySelectorAll(".swi-nd"),lg=el.querySelectorAll(".swi-nd .lg i.h");const tr=el.querySelector(".swi-tree").getBoundingClientRect();
    const ov=[...n].filter(x=>{const r=x.getBoundingClientRect();return r.left<tr.left-1||r.right>tr.right+1}).length;
    const inter=[];const rs=[...n].map(x=>x.getBoundingClientRect());for(let i=0;i<rs.length;i++)for(let j=i+1;j<rs.length;j++){const a=rs[i],c=rs[j];if(a.left<c.right-1&&c.left<a.right-1&&a.top<c.bottom-1&&c.top<a.bottom-1)inter.push(i+"/"+j)}
    const clip=[...n].filter(x=>x.scrollHeight>x.clientHeight+1).map(x=>x.querySelector("b").textContent);
    return {nodes:n.length,here:lg.length,outside:ov,overlap:inter.length,clipped:clip}});
  res.checks.nodeSheet=await sheet(".swi-nd.cur,.swi-nd","03_sui_case");
  await tab("bl");await measure("sui_bilans");await shot("04_sui_bilans",true);
  res.checks.bilans=await p.evaluate(()=>NAV[NAV.length-1].el.querySelectorAll(".swi-br").length);
  await tab("fn");await measure("sui_finale");await shot("05_sui_finale",true);
  /* mon équipe : choix dans la feuille → w26_fav, parcours en or dans l'arbre, carte dans Ronde */
  await tab("rd");const pk=await p.evaluate(()=>{const x=NAV[NAV.length-1].el.querySelector(".swi-pick");if(x){x.click();return true}return false});await p.waitForTimeout(600);
  if(pk){await p.screenshot({path:`${OUT}/${name}_06_choix_equipe.png`});const fv=await p.evaluate(()=>(MATCHES.find(m=>m.stage==="sw"&&m.winner)||{}).winner||"GEN");
    await p.evaluate(id=>{const x=document.querySelector(`#sheet [data-fav="${id}"]`);x&&x.click()},fv);await p.waitForTimeout(900);
    res.checks.fav=await p.evaluate(()=>({ls:localStorage.getItem("w26_fav"),varFav:fav,sheet:document.querySelector("#sheet").classList.contains("on"),depth:NAV.length,card:!!NAV[NAV.length-1].el.querySelector(".swi-me"),trail:NAV[NAV.length-1].el.querySelectorAll(".swi-ts").length}));
    await measure("sui_ronde_fav");await shot("07_sui_ronde_fav",true);
    await tab("tb");res.checks.favPath=await p.evaluate(()=>({paths:NAV[NAV.length-1].el.querySelectorAll(".swi-tree path.ef").length,on:NAV[NAV.length-1].el.querySelectorAll(".swi-nd.on").length}));await shot("08_sui_tableau_fav");
    await tab("bl");res.checks.favRow=await p.evaluate(()=>NAV[NAV.length-1].el.querySelectorAll(".swi-br.me").length)}
  await back();
  /* ---- qui va gagner ---- */
  await go("sim",1300);await measure("sim_titre");await shot("09_sim_titre",true);res.checks.typoSim=await typo();
  res.checks.simRows=await p.evaluate(()=>({fav:!!NAV[NAV.length-1].el.querySelector(".swi-fav"),rows:NAV[NAV.length-1].el.querySelectorAll(".swi-tr").length,ans:(NAV[NAV.length-1].el.querySelector(".swi-ans")||{}).textContent}));
  res.checks.teamSheet=await sheet(".swi-fav","10_sim_feuille_equipe");
  await tab("tb");await measure("sim_tableau");await shot("11_sim_tableau",true);
  res.checks.simTable=await p.evaluate(()=>NAV[NAV.length-1].el.querySelectorAll(".swi-td").length);
  res.checks.teamSheet2=await sheet(".swi-td:nth-of-type(8)","12_sim_feuille_equipe2");
  await tab("rob");await measure("sim_robot");await shot("13_sim_robot",true);
  res.checks.fiab=await p.evaluate(()=>({rows:NAV[NAV.length-1].el.querySelectorAll(".swi-fr").length,score:(NAV[NAV.length-1].el.querySelector(".swi-fs strong")||{}).textContent}));
  res.checks.fiabSheet=await sheet(".swi-fb .i","14_sim_robot_test");
  await back();
  /* ---- calendrier ---- */
  await go("cal");await measure("cal_avenir");await shot("15_cal_avenir",true);res.checks.typoCal=await typo();
  res.checks.calFirst=await p.evaluate(()=>{const d=NAV[NAV.length-1].el.querySelector(".swi-day");return d?{txt:d.textContent.trim().slice(0,60),now:d.classList.contains("now")}:null});
  res.checks.calTbd=await p.evaluate(()=>[...NAV[NAV.length-1].el.querySelectorAll(".swi-tbd")].slice(0,3).map(x=>x.textContent.trim().replace(/\s+/g," ").slice(0,70)));
  await p.evaluate(()=>{NAV[NAV.length-1].el.querySelector('[data-swst="sw"]').click()});await p.waitForTimeout(500);
  res.checks.calFilterSw=await p.evaluate(()=>{const ids=[...NAV[NAV.length-1].el.querySelectorAll(".mrow[data-go]")].map(x=>x.dataset.go.slice(2));return {n:ids.length,nonSw:ids.filter(id=>{const m=mOf(id);return m&&m.stage!=="sw"}).length}});
  await tab("res");await measure("cal_resultats");await shot("16_cal_resultats",true);
  await p.evaluate(()=>{NAV[NAV.length-1].el.querySelector('[data-swst="all"]').click()});await p.waitForTimeout(400);
  await back();
  /* ---- mini défilement : chaque onglet, dépassement 0 ou ≥ 120 px ---- */
  res.checks.minscroll={};
  for(const r of ["sui/rd","sui/tb","sui/bl","sui/fn","sim/ti","sim/tb","sim/rob","cal/next","cal/res"]){await go(r,900);const m=await p.evaluate(()=>{const el=NAV[NAV.length-1].el;return el.classList.contains("fit")?0:el.scrollHeight-el.clientHeight});res.checks.minscroll[r]=m;await back()}
  /* ---- widgets (rendu direct) et accueil « rest » (qui va gagner en grand) ---- */
  res.checks.widgets=await p.evaluate(()=>({sim:widget("sim",0).length,simBig:widget("sim",0,true).length,swiss:widget("swiss",0).length,myteam:widget("myteam",0).length}));
  /* retour Android depuis une feuille ouverte au-dessus d'un écran, puis l'écran */
  await go("sim");await p.evaluate(()=>NAV[NAV.length-1].el.querySelector(".swi-fav,.swi-tr").click());await p.waitForTimeout(500);
  await p.evaluate(()=>document.querySelector('#sheet [data-m],#sheet [data-t]')?.click());await p.waitForTimeout(1200);
  res.checks.sheetGo=await p.evaluate(()=>({sheet:document.querySelector("#sheet").classList.contains("on"),top:NAV.length?NAV[NAV.length-1].d.v:"home",depth:NAV.length}));
  await back();await back();res.checks.depthEnd=await p.evaluate(()=>NAV.length);
  res.checks.storage=await p.evaluate(()=>Object.keys(localStorage).filter(k=>!/^w26_/.test(k)));
  await p.evaluate(()=>{localStorage.removeItem("w26_fav")});
  await p.goto(BASE+"?nointro&mo=rest",{waitUntil:"domcontentloaded"});await p.waitForFunction(()=>document.querySelector(".home .grid .w"),null,{timeout:30000});await p.waitForTimeout(3000);
  await p.screenshot({path:`${OUT}/${name}_17_accueil_rest.png`});
  /* widgets neufs du module (placement : socle) : posés en tête de la grille pour la capture */
  await p.evaluate(()=>{localStorage.setItem("w26_fav",JSON.stringify("T1"));fav="T1";const g=HOME.querySelector(".grid");g.insertAdjacentHTML("afterbegin",widget("swiss",0)+widget("myteam",1));fav=null;g.insertAdjacentHTML("afterbegin",widget("myteam",0)+widget("sim",0));HOME.scrollTop=0;localStorage.removeItem("w26_fav")});await p.waitForTimeout(900);
  await p.screenshot({path:`${OUT}/${name}_18_widgets.png`});
  await b.close();
}
(async()=>{
  await new Promise(r=>srv.listen(PORT,"127.0.0.1",r));
  for(const [n,d] of Object.entries(DEV)){if(ONLY&&ONLY!==n)continue;try{await run(n,d)}catch(e){R[n]=R[n]||{};R[n].crash=e.stack.slice(0,500)}}
  srv.close();fs.writeFileSync(path.join(OUT,"resultats.json"),JSON.stringify(R,null,1));
  let bad=0;
  for(const [n,x] of Object.entries(R)){console.log("=== "+n);if(x.crash){bad++;console.log("CRASH",x.crash)}if(x.ctx)console.log(JSON.stringify(x.ctx));
    if(x.screens)Object.entries(x.screens).forEach(([k,v])=>console.log(k.padEnd(18),"ratio",v.ratio,"excès",v.excess,v.cad,v.hscroll?"HSCROLL":"",v.over.length?JSON.stringify(v.over):"",Object.keys(v.small).length?"petites cibles "+JSON.stringify(v.small):""));
    if(x.checks)Object.entries(x.checks).forEach(([k,v])=>console.log("  "+k+":",JSON.stringify(v)));
    if(x.errs){console.log("erreurs JS:",x.errs.length,x.errs.slice(0,6).join(" || "));bad+=x.errs.length}}
  process.exit(bad?1:0);
})();
