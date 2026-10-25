/* =====================================================================================
   test/qa_reprise.js — contrôle qualité (intégrateur) : reprise des données d'un téléphone resté en v13.5.
   Même origine (comme en prod : même adresse), même navigateur (iPhone 12) :
     1. v13.5 figée (ref/worlds_v13_5.html) remplit le localStorage AU DOIGT : mon équipe (GEN), 3 paris dont un Bo3 avec score
        exact, création d'une ligue (prénom, gage), une pote (Léa, v13.5 sur un autre téléphone, vrai ntfy.sh) qui rejoint et
        parie ; puis résultat publié par le robot (prono gagné fêté : w26_celebrated, rang : w26_lgRank) et un résultat saisi à
        la main sur un match en attente (w26_manual).
     2. Le MÊME onglet ouvre la refonte (dist/worlds-b.html) : toutes les clés w26_ sont intactes, et l'écran montre l'équipe
        suivie, les paris, le score exact, le résultat saisi, la ligue (code, membres, classement identique à v13.5), sans
        refêter le prono gagné ; la pote voit toujours UN seul « Thomas » (même identifiant publié).
     3. Retour en v13.5 (retour arrière d'une mise à jour) : tout est encore là.
   node test/qa_reprise.js  (port 8912) → test/qa/reprise.json, captures shots/qa/reprise_*.png
   ===================================================================================== */
const PW="C:/Users/vialo/AppData/Local/Temp/claude/c--Users-vialo-Desktop-Code-Worlds-2026/cead0307-273c-463a-8548-1b2491359512/scratchpad/pw/node_modules/playwright";
const {chromium,devices}=require(PW);const fs=require("fs"),path=require("path"),http=require("http");
const ROOT=path.join(__dirname,".."),DATA=path.join(ROOT,"../data"),OUT=path.join(ROOT,"shots","qa"),PORT=8912;fs.mkdirSync(OUT,{recursive:true});fs.mkdirSync(path.join(__dirname,"qa"),{recursive:true});
const B_URL=`http://127.0.0.1:${PORT}/dist/worlds-b.html`,A_URL=`http://127.0.0.1:${PORT}/ref/worlds_v13_5.html`;
const TYPES={html:"text/html; charset=utf-8",js:"text/javascript",json:"application/json",png:"image/png"};
const srv=http.createServer((q,s)=>{const f=path.join(ROOT,decodeURIComponent(q.url.split("?")[0]));if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);s.end();return}
  s.writeHead(200,{"content-type":TYPES[f.split(".").pop()]||"application/octet-stream","cache-control":"no-store"});fs.createReadStream(f).pipe(s)});
const M1="115660540726095021",M2="115660540726095031",M3="115660540726095037",MW="115660540726095029",RESULTS={};
function statsBody(){const d=JSON.parse(fs.readFileSync(path.join(DATA,"stats_pp.json"),"utf8"));
  (d.sched||[]).forEach(x=>{if(x[0]===M3){x[5]=["G2","G2 Esports",null];x[6]=["KC","Karmine Corp",null]}if(RESULTS[x[0]]){x[2]="completed";x[5][2]=RESULTS[x[0]][0];x[6][2]=RESULTS[x[0]][1]}});return JSON.stringify(d)}
const R={errs:{},checks:{},toasts:{}};const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function mk(b,dev,name){const ctx=await b.newContext({...dev,locale:"fr-FR",timezoneId:"Europe/Paris"});
  await ctx.route(/raw\.githubusercontent\.com\/Vialou07\/IA_Games\/stats[^/]*\/data\/(\w+)\.json/,r=>{const n=r.request().url().match(/data\/(\w+)\.json/)[1];
    if(n==="stats")return r.fulfill({status:200,contentType:"application/json",body:statsBody()});const f=path.join(DATA,n+"_pp.json");
    r.fulfill({status:fs.existsSync(f)?200:404,contentType:"application/json",body:fs.existsSync(f)?fs.readFileSync(f,"utf8"):""})});
  await ctx.route(/esports-api\.lolesports\.com|feed\.lolesports\.com|lol\.fandom\.com/,r=>r.abort());
  await ctx.clock.install({time:new Date("2026-10-24T16:30:00Z")});
  await ctx.addInitScript(()=>{window.__toasts=[];new MutationObserver(()=>{const t=document.getElementById("toast");if(t&&t.textContent&&window.__toasts[window.__toasts.length-1]!==t.textContent)window.__toasts.push(t.textContent)}).observe(document,{subtree:true,childList:true,characterData:true})});
  const p=await ctx.newPage();R.errs[name]=[];p.on("pageerror",e=>R.errs[name].push(e.message));
  p.on("console",m=>{if(m.type()==="error"&&!/Failed to load resource|net::ERR|EventSource/.test(m.text()))R.errs[name].push("console "+m.text().slice(0,200))});
  p.on("dialog",d=>d.accept().catch(()=>{}));p.ctx=ctx;return p}
const readyA=async p=>{await p.waitForFunction(()=>typeof MATCHES!=="undefined"&&MATCHES.length>10&&typeof duelHome==="function",null,{timeout:45000});await wait(3000)};
const readyB=async p=>{await p.waitForFunction(()=>typeof MATCHES!=="undefined"&&MATCHES.length&&document.querySelector(".home .grid .w"),null,{timeout:45000});await wait(2500)};
const snap=p=>p.evaluate(()=>{const o={};Object.keys(localStorage).sort().forEach(k=>o[k]=localStorage.getItem(k));return o});
const CORE=["w26_picks","w26_scores","w26_manual","w26_fav","w26_myname","w26_celebrated","w26_lgRank","w26_lsv"];
const leagueCore=s=>{try{const L=JSON.parse(s);return L&&JSON.stringify({code:L.code,me:L.me,owner:L.owner,gage:L.gage,players:Object.fromEntries(Object.entries(L.players).map(([id,x])=>[id,{name:x.name,p:x.p}]))})}catch(e){return "?"}};
const tapA=async(p,mk,t)=>p.evaluate(async([mk,t])=>{let x=document.querySelector(`[data-pick="${t}"][data-mk="${CSS.escape(mk)}"]`);
  if(!x){const m=MATCHES.find(m=>m.key===mk);matchSheet(m.id);await new Promise(r=>setTimeout(r,900));x=document.querySelector(`#sheetBody [data-pick="${t}"][data-mk="${CSS.escape(mk)}"]`)}
  if(x)x.click();await new Promise(r=>setTimeout(r,500));return !!x},[mk,t]);

(async()=>{await new Promise(r=>srv.listen(PORT,"127.0.0.1",r));const b=await chromium.launch();
  try{
  const A=await mk(b,devices["iPhone 12"],"telephone_thomas"),P=await mk(b,devices["Pixel 7"],"pote_lea_v13");
  // ---------- 1. v13.5 remplit le stockage au doigt ----------
  await A.goto(A_URL);await readyA(A);
  const K=await A.evaluate(ids=>Object.fromEntries(ids.map(id=>{const m=MATCHES.find(x=>x.id==="le"+id);return [id,m&&m.key]})),[M1,M2,M3,MW]);R.checks.cles_matchs=K;
  R.checks.v13_fav=await A.evaluate(()=>{const x=document.querySelector('[data-fav="GEN"]');if(x)x.click();return !!x});await wait(500);
  R.checks.v13_paris={m1:await tapA(A,K[M1],"MKOI"),m2:await tapA(A,K[M2],"G2"),m3:await tapA(A,K[M3],"G2")};
  // score exact du Bo3 : puces de la fiche du match
  R.checks.v13_score=await A.evaluate(async mk=>{const m=MATCHES.find(x=>x.key===mk);matchSheet(m.id);await new Promise(r=>setTimeout(r,900));const x=document.querySelector(`#sheetBody [data-score="2-0"][data-mk="${CSS.escape(mk)}"]`);if(x)x.click();await new Promise(r=>setTimeout(r,500));history.back();await new Promise(r=>setTimeout(r,500));return !!x},K[M3]);
  // ligue : créer (prénom, gage)
  await A.evaluate(()=>{const x=document.querySelector('[data-duel="create"]');x&&x.click()});await A.waitForSelector("#dName",{timeout:15000});
  await A.fill("#dName","Thomas");await A.fill("#dGage","Le dernier paie les croissants");await A.evaluate(()=>document.querySelector('[data-duel="go-create"]').click());await wait(2500);
  const code=await A.evaluate(()=>lg&&lg.code);R.checks.code=code;if(!code)throw new Error("ligue v13.5 non créée");
  // la pote (v13.5 sur son téléphone) rejoint et parie
  await P.goto(A_URL+`?ligue=${code}&n=Thomas`);await readyA(P);await P.waitForSelector("#dName",{timeout:15000});await P.fill("#dName","Léa");await P.evaluate(()=>document.querySelector('[data-duel="go-join"]').click());await wait(2000);
  R.checks.lea_paris={m1:await tapA(P,K[M1],"CFO"),m2:await tapA(P,K[M2],"LOS")};
  await A.waitForFunction(k=>lg&&Object.values(lg.players).some(x=>x.name==="Léa"&&x.p[k]),K[M2],{timeout:25000}).catch(()=>{});
  // résultat publié (M1 : MKOI) à 19:10Z ; match en attente (AL-TES, 17:00Z) : vainqueur saisi à la main
  RESULTS[M1]=[0,1];for(const p of [A,P])await p.clock.setSystemTime(new Date("2026-10-24T19:10:00Z"));
  for(const p of [A,P])await p.evaluate(async()=>{SJt=0;await loadSJ();await sync(false)});await wait(2500);
  R.checks.v13_attente=await A.evaluate(async mk=>{const m=MATCHES.find(x=>x.key===mk);const st=m.state;matchSheet(m.id);await new Promise(r=>setTimeout(r,900));const d=document.querySelector("#sheetBody details.manual");if(d)d.open=true;
    const x=document.querySelector(`#sheetBody [data-win="${m.t1}"]`);if(x)x.click();await new Promise(r=>setTimeout(r,600));history.back();await new Promise(r=>setTimeout(r,500));return {etat:st,saisi:!!x,t1:m.t1}},K[MW]);
  await wait(1500);R.toasts.v13=await A.evaluate(()=>window.__toasts);
  const S13=await A.evaluate(()=>standings().map(u=>`${u.rank}.${u.bot?"robot":u.name}:${u.pts}`).join(" "));R.checks.classement_v13=S13;
  await A.screenshot({path:path.join(OUT,"reprise_1_v13.png")});
  const before=await snap(A);R.checks.stockage_v13=Object.fromEntries(Object.entries(before).filter(([k])=>CORE.includes(k)||k==="w26_league").map(([k,v])=>[k,k==="w26_league"?JSON.parse(v):JSON.parse(v)]));
  R.checks.cles_v13=Object.keys(before);
  // ---------- 2. le même onglet ouvre la refonte ----------
  await A.goto(B_URL+"?nointro");await readyB(A);await wait(3000);
  const after=await snap(A);
  R.checks.intactes=Object.fromEntries(CORE.map(k=>[k,before[k]===after[k]?"identique":`AVANT ${before[k]} APRÈS ${after[k]}`]));
  R.checks.intactes.w26_league=leagueCore(before.w26_league)===leagueCore(after.w26_league)?"identique":`AVANT ${leagueCore(before.w26_league)} APRÈS ${leagueCore(after.w26_league)}`;
  R.checks.cles_ajoutees=Object.keys(after).filter(k=>!(k in before));R.checks.cles_hors_w26=Object.keys(after).filter(k=>!/^w26_/.test(k));
  R.checks.globals=await A.evaluate(()=>({fav,myname:typeof myname!=="undefined"?myname:LS.get("myname"),picks,scores,manual,code:lg&&lg.code,me:lg&&lg.me,owner:lg&&lg.owner,gage:lg&&lg.gage}));
  R.checks.accueil=await A.evaluate(()=>[...document.querySelectorAll(".home .grid>.w")].map(w=>w.innerText.replace(/\s+/g," ").slice(0,70)));
  await A.screenshot({path:path.join(OUT,"reprise_2_refonte_accueil.png")});
  const scr=async(r,t,w=1500)=>{await A.evaluate(r=>go(r),r);await wait(w);if(t)await A.evaluate(t=>{const x=NAV[NAV.length-1].el.querySelector(`.seg [data-tab="${t}"]`);x&&x.click()},t);await wait(700);
    return A.evaluate(()=>{const el=NAV[NAV.length-1].el;return (el.querySelector(".tabc")||el).innerText.replace(/\s+/g," ").slice(0,500)})};
  const home=async()=>{await A.evaluate(async()=>{while(NAV.length){history.back();await new Promise(r=>setTimeout(r,450))}})};
  R.checks.ecran_bets_run=await scr("bets/run");await A.screenshot({path:path.join(OUT,"reprise_3_refonte_enattente.png")});
  R.checks.ecran_bets_pressed=await A.evaluate(([k2,k3])=>{const el=NAV[NAV.length-1].el,q=k=>[...el.querySelectorAll(`.pkb[data-mk="${CSS.escape(k)}"][aria-pressed="true"]`)].map(x=>x.dataset.pick);const sc=[...el.querySelectorAll(`.lea-sc [aria-pressed="true"][data-mk="${CSS.escape(k3)}"]`)].map(x=>x.dataset.score);return {m2:q(k2),m3:q(k3),score:sc}},[K[M2],K[M3]]);
  R.checks.ecran_bets_done=await scr("bets/done");await home();
  R.checks.ecran_lg=await scr("lg/rk");R.checks.classement_refonte=await A.evaluate(()=>standings().map(u=>`${u.rank}.${u.bot?"robot":u.name}:${u.pts}`).join(" "));
  R.checks.classement_identique=R.checks.classement_refonte===S13;await A.screenshot({path:path.join(OUT,"reprise_4_refonte_ligue.png")});
  R.checks.ecran_lg_reglages=await scr("lg/set");await home();
  R.checks.ecran_match_saisi=await A.evaluate(id=>{go("m/le"+id);return new Promise(r=>setTimeout(()=>{const el=NAV[NAV.length-1].el,m=MATCHES.find(x=>x.id==="le"+id);r({etat:m.state,winner:m.winner,manual:m.manual,tete:el.querySelector(".hero,.mat-hero,.hd")?(el.querySelector(".hero,.mat-hero,.hd").innerText.replace(/\s+/g," ").slice(0,160)):el.innerText.slice(0,160)})},1800))},MW);
  await A.screenshot({path:path.join(OUT,"reprise_5_refonte_match_saisi.png")});await home();
  R.checks.ecran_equipe=await A.evaluate(()=>{const w=[...document.querySelectorAll(".home .grid>.w")].find(x=>/GEN/.test(x.innerText)&&x.dataset.go&&x.dataset.go.startsWith("t/"));return w?w.dataset.go+" "+w.innerText.replace(/\s+/g," "):null});
  R.checks.set_moi=await scr("set/moi");await home();
  // la pote voit toujours un seul Thomas ; la refonte publie avec le même identifiant
  await A.evaluate(()=>{if(typeof publish==="function")publish(true)});await wait(4000);
  R.checks.pote_voit=await P.evaluate(()=>Object.entries(lg.players).map(([id,x])=>id+":"+x.name));
  R.checks.refonte_voit=await A.evaluate(()=>Object.entries(lg.players).map(([id,x])=>id+":"+x.name+":"+Object.keys(x.p).length));
  R.toasts.refonte=await A.evaluate(()=>window.__toasts);
  // ---------- 3. retour en v13.5 ----------
  const mid=await snap(A);await A.goto(A_URL);await readyA(A);await wait(1500);const back=await snap(A);
  R.checks.retour_v13=Object.fromEntries(CORE.map(k=>[k,mid[k]===back[k]?"identique":`AVANT ${mid[k]} APRÈS ${back[k]}`]));R.checks.retour_v13.w26_league=leagueCore(mid.w26_league)===leagueCore(back.w26_league)?"identique":"DIFFÉRENT";
  R.checks.retour_v13_classement=await A.evaluate(()=>standings().map(u=>`${u.rank}.${u.bot?"robot":u.name}:${u.pts}`).join(" "));
  await A.screenshot({path:path.join(OUT,"reprise_6_retour_v13.png")});
  await A.ctx.close();await P.ctx.close();
  }catch(e){R.crash=String(e.stack||e).slice(0,600)}
  await b.close();srv.close();fs.writeFileSync(path.join(__dirname,"qa","reprise.json"),JSON.stringify(R,null,1));console.log(JSON.stringify(R,null,1).slice(0,12000));
})();
