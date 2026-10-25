/* =====================================================================================
   test/league.js — module LIGUE : Mes paris, Ligue (sans ligue, création, classement, paris, badges, réglages, départ),
   membre, score exact, blocs de la fiche de match, widgets ; interopérabilité ntfy avec v13.5 ; profil emporté ; invitation.
   node test/league.js [ui|seed|interop|move|invite|all] [iphone12|pixel7|w360]
   Sert la racine du chantier sur le port 8901 : /test/lea_dist/worlds-b.html (copie privée faite après node build.js, pour ne pas
   tester un dist/ reconstruit entre-temps par un autre module) et /ref/worlds_v13_5.html (v13.5 figée).
   stats/fiche/draft du robot lus dans lot1/data/*_pp.json. ntfy.sh : coupé (ui, seed) ou réel (interop, sujet de test aléatoire).
   Captures : shots/ligue/. Résultat : test/league_results.json.
   ===================================================================================== */
const PW="C:/Users/vialo/AppData/Local/Temp/claude/c--Users-vialo-Desktop-Code-Worlds-2026/cead0307-273c-463a-8548-1b2491359512/scratchpad/pw/node_modules/playwright";
const {chromium,devices}=require(PW);const fs=require("fs"),path=require("path"),http=require("http");
const ROOT=path.join(__dirname,".."),OUT=path.join(ROOT,"shots","ligue"),DATA=path.join(ROOT,"../data"),PORT=8901;fs.mkdirSync(OUT,{recursive:true});
const ARGS=process.argv.slice(2),SC=ARGS.find(a=>/^(ui|seed|interop|move|invite|all)$/.test(a))||"all",ONLY=ARGS.find(a=>/^(iphone12|pixel7|w360)$/.test(a));
const B_URL=`http://127.0.0.1:${PORT}/test/lea_dist/worlds-b.html`,A_URL=`http://127.0.0.1:${PORT}/ref/worlds_v13_5.html`;
const DEV={iphone12:{...devices["iPhone 12"]},pixel7:{...devices["Pixel 7"]},w360:{...devices["Galaxy S9+"],viewport:{width:360,height:740},screen:{width:360,height:740}}};
const TYPES={html:"text/html; charset=utf-8",js:"text/javascript",json:"application/json",png:"image/png"};
const srv=http.createServer((q,s)=>{const f=path.join(ROOT,decodeURIComponent(q.url.split("?")[0]));if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);s.end();return}
  s.writeHead(200,{"content-type":TYPES[f.split(".").pop()]||"application/octet-stream","cache-control":"no-store"});fs.createReadStream(f).pipe(s)});
const R={};const log=(...a)=>console.log(...a);
/* mode « futur » (par défaut ; --now pour l'heure réelle) : horloge du téléphone au 24/10 17 h (Paris), LoL Esports coupé →
   planning du robot (stats_pp) : Play-In terminés, ronde 1 à parier (Bo1) ; deux Bo3 « à déterminer » du 25/10 remplis
   EN MÉMOIRE (G2-KC, GEN-T1) pour tester le score exact. Les deux versions (v13.5 et refonte) voient les mêmes matchs. */
const FUTUR=!ARGS.includes("--now"),FUTUR_AT=new Date("2026-10-24T15:00:00Z");
function statsBody(f){const t=fs.readFileSync(f,"utf8");if(!FUTUR||!/stats_pp/.test(f))return t;const d=JSON.parse(t);
  (d.sched||[]).forEach(x=>{if(x[0]==="115660540726095037"){x[5]=["G2","G2 Esports",null];x[6]=["KC","Karmine Corp",null]}if(x[0]==="115660540726095041"){x[5]=["GEN","Gen.G",null];x[6]=["T1","T1",null]}});return JSON.stringify(d)}
async function newCtx(b,dev,{ntfy=false}={}){const ctx=await b.newContext({...dev,locale:"fr-FR",timezoneId:"Europe/Paris"});
  await ctx.route(/raw\.githubusercontent\.com\/Vialou07\/IA_Games\/stats[^/]*\/data\/(\w+)\.json/,r=>{const n=r.request().url().match(/data\/(\w+)\.json/)[1],f=path.join(DATA,n+"_pp.json");
    r.fulfill({status:fs.existsSync(f)?200:404,contentType:"application/json",body:fs.existsSync(f)?statsBody(f):""})});
  if(!ntfy)await ctx.route(/ntfy\.sh/,r=>r.abort());
  if(FUTUR){await ctx.route(/esports-api\.lolesports\.com|feed\.lolesports\.com|lol\.fandom\.com/,r=>r.abort());await ctx.clock.install({time:FUTUR_AT})}
  return ctx}
function watch(p,res){p.on("pageerror",e=>res.errs.push(e.message));p.on("console",m=>{if(m.type()==="error"&&!/Failed to load resource|net::ERR|EventSource/.test(m.text()))res.errs.push("console "+m.text().slice(0,200))});
  p.on("dialog",d=>{res.dialogs=(res.dialogs||[]);res.dialogs.push(d.message().slice(0,80));d.dismiss().catch(()=>{})})}
const ready=async p=>{await p.waitForFunction(()=>typeof MATCHES!=="undefined"&&MATCHES.length&&document.querySelector(".home .grid .w"),null,{timeout:45000});await p.waitForTimeout(2500)};
const goR=async(p,r,w=900)=>{await p.evaluate(r=>go(r),r);await p.waitForTimeout(w)};
const tab=async(p,k)=>{await p.evaluate(k=>{const b=NAV[NAV.length-1].el.querySelector(`.seg [data-tab="${k}"]`);b&&b.click()},k);await p.waitForTimeout(650)};
const back=async p=>{await p.evaluate(()=>history.back());await p.waitForTimeout(700)};
const home=async p=>{await p.evaluate(async()=>{while(NAV.length){history.back();await new Promise(r=>setTimeout(r,450))}});await p.waitForTimeout(300)};
/* mesure de l'écran du dessus : dépassement vertical (0 ou ≥ 120 attendu), défilement horizontal, typographie, petites cibles */
async function measure(p,res,label){const m=await p.evaluate(()=>{const el=NAV.length?NAV[NAV.length-1].el:document.querySelector(".home");
  const fit=el.classList.contains("fit"),over=fit?0:el.scrollHeight-el.clientHeight,hs=el.scrollWidth>el.clientWidth+1||document.documentElement.scrollWidth>innerWidth+1;
  const wide=[...el.querySelectorAll("*")].filter(x=>{const r=x.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left<-1)&&!x.closest(".hbg,.beam,.hc,.ph,.seg")}).slice(0,3).map(x=>x.className+"|"+Math.round(x.getBoundingClientRect().right));
  const tw=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let x,typo=[];while((x=tw.nextNode())){if(/ [:;?!%]/.test(x.nodeValue)&&typo.length<3)typo.push(x.nodeValue.trim().slice(0,40))}
  const small=[...el.querySelectorAll("button,[role=button],a,input")].filter(b=>{const r=b.getBoundingClientRect();return r.width>0&&r.height>0&&(r.height<40&&r.width<40||r.height<30)&&b.closest(".lea-r,.qb,.lea-sc,.lea-mc,.lea-cta,.lea-form,.lea-kv,.lea-podk,.lea-bm,.lea-lbk,.lea-bil,.lea-codek")}).slice(0,4).map(b=>b.className+"|"+Math.round(b.getBoundingClientRect().width)+"x"+Math.round(b.getBoundingClientRect().height));
  return {over,cls:(fit?"fit ":"")+(el.classList.contains("snug")?"snug":""),ratio:+(el.scrollHeight/innerHeight).toFixed(2),hs,wide,typo,small}});
  res.screens[label]=m;return m}
async function shot(p,dev,label,bottom){await p.screenshot({path:path.join(OUT,`${dev}_${label}.png`)});
  if(bottom){const sc=await p.evaluate(()=>{const el=NAV.length?NAV[NAV.length-1].el:document.querySelector(".home");if(el.scrollHeight-el.clientHeight<120)return false;el.scrollTop=el.scrollHeight;return true});
    if(sc){await p.waitForTimeout(350);await p.screenshot({path:path.join(OUT,`${dev}_${label}_bas.png`)});await p.evaluate(()=>{const el=NAV.length?NAV[NAV.length-1].el:document.querySelector(".home");el.scrollTop=0})}}}
const keys=p=>p.evaluate(()=>Object.keys(localStorage).sort());
const LSget=(p,k)=>p.evaluate(k=>JSON.parse(localStorage.getItem("w26_"+k)||"null"),k);

/* ---------- 1. profil neuf : Mes paris, Ligue sans ligue, création, onglets, départ ---------- */
async function ui(b,name,dev){const res=R[name+"_ui"]={screens:{},errs:[],checks:{}};const ctx=await newCtx(b,dev),p=await ctx.newPage();watch(p,res);
  await p.goto(B_URL+"?nointro");await ready(p);
  res.checks.ctx=await p.evaluate(()=>({mo:homeMoment().k,src:SOURCE,soon:MATCHES.filter(m=>m.state==="soon"&&m.t1&&m.t2).length,done:MATCHES.filter(m=>m.winner).length}));
  await goR(p,"bets");await measure(p,res,"bets_todo");await shot(p,name,"bets_todo",true);
  // un pari depuis « À parier » : la ligne s'efface, w26_picks écrit, compteur de l'onglet
  const k1=await p.evaluate(()=>{const b=document.querySelector(".scr .qb .pkb");if(!b)return null;b.click();return b.dataset.mk});
  await p.waitForTimeout(800);res.checks.pickTodo=k1?{key:k1,saved:!!(await LSget(p,"picks"))[k1],still:await p.evaluate(k=>!!NAV[NAV.length-1].el.querySelector(`.qb[data-qk="${CSS.escape(k)}"]`),k1)}:"aucun match à parier";
  // un Bo3 parié pour le score exact (G2-KC du 25/10 en mode futur)
  res.checks.bo3=await p.evaluate(()=>{const m=MATCHES.find(x=>x.state==="soon"&&x.bo>1&&x.t1&&x.t2&&!picks[x.key]);if(!m)return null;setPick(m.key,m.t1);return m.key});
  await tab(p,"run");await measure(p,res,"bets_run");await shot(p,name,"bets_run",true);
  // score exact (Bo3/Bo5) depuis « En attente »
  res.checks.score=await p.evaluate(async()=>{const c=document.querySelector(".scr .lea-sc .chip");if(!c)return "pas de Bo3/Bo5 parié";const k=c.dataset.mk,s=c.dataset.score;c.click();await new Promise(r=>setTimeout(r,200));
    const a=JSON.parse(localStorage.getItem("w26_scores")||"{}")[k];c.click();await new Promise(r=>setTimeout(r,200));const z=JSON.parse(localStorage.getItem("w26_scores")||"{}")[k];return {k,s,set:a,removed:z===undefined}});
  // annuler depuis « En attente » (toucher à nouveau) : retour dans « À parier »
  if(k1){await p.evaluate(k=>{const b=document.querySelector(`.scr .qb[data-qk="${CSS.escape(k)}"] .pkb[aria-pressed="true"]`);b&&b.click()},k1);await p.waitForTimeout(800);res.checks.cancel=!(await LSget(p,"picks"))[k1]}
  await tab(p,"done");await p.waitForTimeout(1300);await measure(p,res,"bets_done");await shot(p,name,"bets_done",true);await back(p);
  await goR(p,"lg");await measure(p,res,"lg_sans");await shot(p,name,"lg_sans",true);
  await p.evaluate(()=>document.querySelector('.scr [data-go="lgf/create"]').click());await p.waitForTimeout(900);await measure(p,res,"lgf_create");await shot(p,name,"lgf_create");
  await p.fill(".scr .lea-in[name=n]","T");await p.evaluate(()=>document.querySelector(".scr .lea-go").click());await p.waitForTimeout(300);
  res.checks.nameTooShort=(await LSget(p,"league"))===null;
  await p.fill(".scr .lea-in[name=n]","Thomas");await p.fill(".scr .lea-in[name=g]","Le dernier paie les pizzas");await p.press(".scr .lea-in[name=g]","Enter");await p.waitForTimeout(1500);
  const L=await LSget(p,"league");res.checks.created={code:L&&L.code,owner:L&&L.owner,gage:L&&L.gage,me:L&&L.me&&L.me.name,myname:await LSget(p,"myname"),top:await p.evaluate(()=>NAV.length&&NAV[NAV.length-1].d.v),depth:await p.evaluate(()=>NAV.length)};
  await p.waitForTimeout(600);await measure(p,res,"lg_rk_solo");await shot(p,name,"lg_rk_solo",true);
  for(const t of ["bt","bg","set"]){await tab(p,t);await measure(p,res,"lg_"+t+"_solo");await shot(p,name,"lg_"+t+"_solo",true)}
  // quitter : feuille de confirmation, ligue effacée, pronos gardés
  await p.evaluate(k=>{if(k){picks[k]=MATCHES.find(m=>m.key===k).t1;LS.set("picks",picks)}},k1);
  await p.evaluate(()=>document.querySelector('.scr [data-lea="quit"]').click());await p.waitForTimeout(500);await shot(p,name,"lg_quitter");
  await p.evaluate(()=>document.querySelector('#sheet [data-lea="quit-ok"]').click());await p.waitForTimeout(900);
  res.checks.quit={league:await LSget(p,"league"),picksKept:k1?!!(await LSget(p,"picks"))[k1]:"—",title:await p.evaluate(()=>NAV.length&&NAV[NAV.length-1].el.querySelector(".bar .bt").textContent)};
  await goR(p,"lgf/join");await measure(p,res,"lgf_join");await shot(p,name,"lgf_join");
  await p.fill(".scr .lea-in[name=n]","Thomas");await p.fill(".scr .lea-in[name=c]","ab1");await p.evaluate(()=>document.querySelector(".scr .lea-go").click());await p.waitForTimeout(300);
  res.checks.badCode=(await LSget(p,"league"))===null;
  res.checks.storage=(await keys(p)).filter(k=>!/^w26_/.test(k));
  await ctx.close()}

/* ---------- 2. ligue remplie (4 joueurs + robot) : classement, podium, badges, paris, membre, blocs du match, widgets ---------- */
const SEED=()=>{const done=MATCHES.filter(m=>m.winner&&!m.manual&&m.t1&&m.t2),soon=MATCHES.filter(m=>m.state==="soon"&&m.t1&&m.t2);
  const loser=m=>m.winner===m.t1?m.t2:m.t1,ex=m=>{const ws=m.winner===m.t1?m.s1:m.s2,ls=m.winner===m.t1?m.s2:m.s1;return m.bo>1?`${ws}-${ls}`:""};
  const enc=f=>done.map((m,i)=>{const r=f(m,i);return r?`${m.key}~${r[0]}~${r[1]||""}`:null}).filter(Boolean);
  const P={lea1:{name:"Léa",p:enc((m,i)=>[m.winner,i%2?ex(m):""])},max2:{name:"Max",p:enc((m,i)=>[i%3?loser(m):m.winner,""])},sam3:{name:"Sam",p:enc((m,i)=>i%4?[i%2?m.winner:loser(m),""]:null)}};
  if(soon[0]){P.lea1.p.push(`${soon[0].key}~${soon[0].t1}~`);P.max2.p.push(`${soon[0].key}~${soon[0].t2}~`)}
  const players={};Object.entries(P).forEach(([id,x])=>players[id]={name:x.name,p:decPicks(x.p.join(".")),ts:Date.now()-60000});
  const mine={};done.forEach((m,i)=>{if(i%3!==1)mine[m.key]=i%5?m.winner:loser(m)});const sc={};done.forEach((m,i)=>{if(mine[m.key]===m.winner&&m.bo>1&&i%2===0)sc[m.key]=ex(m)});
  const lg0={code:"QX7K",me:{id:"me0thomas",name:"Thomas"},owner:true,gage:"Le dernier paie les pizzas",players};
  localStorage.setItem("w26_league",JSON.stringify(lg0));localStorage.setItem("w26_picks",JSON.stringify(mine));localStorage.setItem("w26_scores",JSON.stringify(sc));localStorage.setItem("w26_myname",JSON.stringify("Thomas"));
  localStorage.setItem("w26_mv_lb_QX7K",JSON.stringify({o:["Le robot","Max","Sam","Thomas","Léa"],p:{"Le robot":0,"Max":0,"Sam":0,"Thomas":0,"Léa":0}}));
  return {done:done.length,soon:soon.length,soonKey:soon[0]&&soon[0].key,doneId:done.length&&done[done.length-1].id,soonId:soon[0]&&soon[0].id}};
async function seed(b,name,dev){const res=R[name+"_seed"]={screens:{},errs:[],checks:{}};const ctx=await newCtx(b,dev),p=await ctx.newPage();watch(p,res);
  await p.goto(B_URL+"?nointro");await ready(p);res.checks.seed=await p.evaluate(SEED);
  await p.goto(B_URL+"?nointro&mo=after");await ready(p);await p.waitForTimeout(1500);
  res.checks.home=await p.evaluate(()=>({league:!!document.querySelector('.home .w[data-go="lg"]'),bets:!!document.querySelector('.home .w[data-go="bets"]'),widget:(document.querySelector('.home .w[data-go="lg"]')||{}).textContent}));
  await shot(p,name,"accueil_after");
  const st=await p.evaluate(()=>standings().map(u=>[u.rank,u.name,u.pts,u.ex,u.ok,u.n]));res.checks.standings=st;
  await goR(p,"lg",1800);await measure(p,res,"lg_rk");await shot(p,name,"lg_rk",true);
  res.checks.motion=await p.evaluate(()=>JSON.parse(localStorage.getItem("w26_mv_lb_QX7K")||"null"));
  for(const t of ["bt","bg","set"]){await tab(p,t);await measure(p,res,"lg_"+t);await shot(p,name,"lg_"+t,true)}
  // moment animé 5 : ordre vu différent → les lignes glissent et les points défilent (une fois) ; même ordre → rien
  await p.evaluate(()=>localStorage.setItem("w26_mv_lb_QX7K",JSON.stringify({o:["Max","Sam","Le robot","Léa","Thomas"],p:{"Max":2,"Sam":1,"Le robot":3,"Léa":9,"Thomas":4}})));
  await tab(p,"rk");res.checks.lbAnim=await p.evaluate(async()=>{await new Promise(r=>setTimeout(r,60));const n=document.getAnimations().filter(a=>a.effect&&a.effect.target&&a.effect.target.closest&&a.effect.target.closest(".lea-lb")).length;
    await new Promise(r=>setTimeout(r,1200));rerender(NAV[NAV.length-1].el);await new Promise(r=>setTimeout(r,80));const again=document.getAnimations().filter(a=>a.effect&&a.effect.target&&a.effect.target.closest&&a.effect.target.closest(".lea-lb")).length;return {first:n,onRerender:again}});
  await tab(p,"rk");await p.evaluate(()=>{const r=document.querySelector('.scr .lea-r[data-go="lgu/lea1"]');r&&r.click()});await p.waitForTimeout(900);await measure(p,res,"lgu_lea");await shot(p,name,"lgu_lea",true);await back(p);
  await p.evaluate(()=>{const r=document.querySelector('.scr .lea-r[data-go="lgu/robot"]');r&&r.click()});await p.waitForTimeout(900);await shot(p,name,"lgu_robot");await back(p);
  await p.evaluate(()=>{const b=NAV[NAV.length-1].el.querySelector(".bar .ib");b&&b.click()});await p.waitForTimeout(500);await shot(p,name,"lg_info");await back(p);
  await home(p);
  await goR(p,"bets/done",1500);await measure(p,res,"bets_done_lg");await shot(p,name,"bets_done_lg",true);await back(p);
  // blocs de la fiche de match (placés par le module match) : rendus dans une feuille pour la capture
  for(const [k,lab] of [["doneId","bloc_match_fini"],["soonId","bloc_match_avenir"]]){const id=res.checks.seed[k];if(!id)continue;
    const ok=await p.evaluate(id=>{const m=mOf(id);const h=leaMyHTML(m)+leaMatchHTML(m)+leaScoreHTML(m);if(!h)return false;showSheet("Bloc ligue (test)",h,true);return true},id);
    if(ok){await p.waitForTimeout(500);await shot(p,name,lab);await back(p)}}
  res.checks.helpers=await p.evaluate(id=>({hero:leaHeroLine(mOf(id)),eve:leaEveBest(dayKeyL(new Date(MATCHES.filter(m=>m.winner).slice(-1)[0].start))),due:leaDue(),badges:Object.fromEntries(Object.entries(funBadges()||{}).map(([k,v])=>[k,v.map(b=>b.lab+(b.n>1?b.n:""))]))}),res.checks.seed.soonId);
  // toast de rang (checkRank) : on fait croire qu'on était 5e
  res.checks.rankToast=await p.evaluate(async()=>{LS.set("lgRank",9);const me=standings().find(u=>u.me);checkRank();await new Promise(r=>setTimeout(r,100));return {rank:me.rank,pts:me.pts,toast:document.querySelector("#toast").textContent,saved:LS.get("lgRank",null)}});
  // célébration d'un prono gagné, une seule fois
  res.checks.celebrate=await p.evaluate(async()=>{const m=MATCHES.filter(x=>x.winner&&!x.manual&&picks[x.key]===x.winner).slice(-1)[0];if(!m)return "aucun prono gagné";delete celebrated[m.key];LS.set("celebrated",celebrated);
    leaCelebrate();await new Promise(r=>setTimeout(r,900));const t1=document.querySelector("#toast").textContent;document.querySelector("#toast").textContent="";leaCelebrate();await new Promise(r=>setTimeout(r,900));return {first:t1,second:document.querySelector("#toast").textContent||"(rien)"}});
  // le classement de « Mes paris » = celui de la ligue (X-03)
  res.checks.sameStandings=await p.evaluate(()=>JSON.stringify(standings().map(u=>u.id+u.pts))===JSON.stringify(leaStand().map(u=>u.id+u.pts)));
  // widget « Les paris » pendant un match (A-07) rendu à part
  res.checks.liveWidget=await p.evaluate(()=>{const m=MATCHES.find(x=>x.winner&&x.t1&&x.t2);if(!m)return null;const s=m.state;m.state="live";const h=wLiveBets(m,0);m.state=s;return h.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim()});
  res.checks.storage=(await keys(p)).filter(k=>!/^w26_/.test(k));
  await ctx.close()}

/* ---------- 3. interopérabilité : v13.5 (référence) et la refonte dans la même ligue, vrai relais ntfy ---------- */
async function interop(b,dev){const res=R.interop={errs:[],checks:{},screens:{}};
  const cB=await newCtx(b,dev,{ntfy:true}),pB=await cB.newPage();watch(pB,res);
  const cA=await newCtx(b,dev,{ntfy:true}),pA=await cA.newPage();const resA={errs:[],screens:{}};watch(pA,resA);res.errsV13=resA.errs;
  await pB.goto(B_URL+"?nointro");await ready(pB);
  await goR(pB,"lgf/create");await pB.fill(".scr .lea-in[name=n]","Bea");await pB.fill(".scr .lea-in[name=g]","Pizzas pour tout le monde");await pB.evaluate(()=>document.querySelector(".scr .lea-go").click());await pB.waitForTimeout(2500);
  const code=(await LSget(pB,"league")).code;res.checks.code=code;log("interop : ligue",code);
  await pA.goto(A_URL+`?ligue=${code}&n=Bea&g=Pizzas`);await pA.waitForFunction(()=>typeof MATCHES!=="undefined"&&MATCHES.length,null,{timeout:45000});
  await pA.waitForSelector("#dName",{timeout:15000});await pA.fill("#dName","Alex");await pA.evaluate(()=>document.querySelector('[data-duel="go-join"]').click());
  const t0=Date.now();
  await pA.waitForFunction(()=>typeof lg!=="undefined"&&lg&&lg.code&&Object.keys(lg.players).length>0,null,{timeout:30000}).catch(()=>{});
  res.checks.v13SeesRefonte={ms:Date.now()-t0,players:await pA.evaluate(()=>lg&&Object.values(lg.players).map(x=>x.name)),gage:await pA.evaluate(()=>lg&&lg.gage)};
  await pB.waitForFunction(()=>lg&&Object.keys(lg.players).length>0,null,{timeout:30000}).catch(()=>{});
  res.checks.refonteSeesV13={ms:Date.now()-t0,players:await pB.evaluate(()=>lg&&Object.values(lg.players).map(x=>x.name))};
  // paris : la refonte parie (setPick + score exact), v13.5 parie (clic sur son bouton)
  const S=await pB.evaluate(()=>{const s=MATCHES.filter(m=>m.state==="soon"&&m.t1&&m.t2);const bo=s.find(m=>m.bo>1)||s[0];return s.length?{kB:bo.key,tB:bo.t2,bo:bo.bo,kA:(s.find(m=>m!==bo)||bo).key,tA:(s.find(m=>m!==bo)||bo).t1}:null});res.checks.matches=S;
  if(S){await pB.evaluate(S=>{setPick(S.kB,S.tB);if(S.bo>1){scores[S.kB]=S.bo===3?"2-1":"3-1";LS.set("scores",scores);duelPickChanged(S.kB)}},S);
    await pA.evaluate(S=>{let bt=document.querySelector(`[data-pick="${S.tA}"][data-mk="${S.kA}"]`);if(bt){bt.click();return}picks[S.kA]=S.tA;LS.set("picks",picks);duelPickChanged(S.kA)},S);
    const t1=Date.now();
    await pA.waitForFunction(S=>Object.values(lg.players).some(x=>x.p&&x.p[S.kB]&&x.p[S.kB].w===S.tB),S,{timeout:20000}).catch(()=>{});
    res.checks.pickRefonteToV13={ms:Date.now()-t1,got:await pA.evaluate(S=>Object.values(lg.players).map(x=>x.p[S.kB]||null),S)};
    await pB.waitForFunction(S=>Object.values(lg.players).some(x=>x.p&&x.p[S.kA]&&x.p[S.kA].w===S.tA),S,{timeout:20000}).catch(()=>{});
    res.checks.pickV13ToRefonte={ms:Date.now()-t1,got:await pB.evaluate(S=>Object.values(lg.players).map(x=>x.p[S.kA]||null),S)};
    // annulation dans la refonte : v13.5 voit le pari disparaître
    await pB.evaluate(S=>setPick(S.kB,S.tB),S);const t2=Date.now();
    await pA.waitForFunction(S=>Object.values(lg.players).every(x=>!x.p[S.kB]),S,{timeout:20000}).catch(()=>{});
    res.checks.cancelSeen={ms:Date.now()-t2,ok:await pA.evaluate(S=>Object.values(lg.players).every(x=>!x.p[S.kB]),S)}}
  await pB.waitForTimeout(800);await goR(pB,"lg/bt",1200);await shot(pB,"interop","refonte_lg_paris");await tab(pB,"rk");await shot(pB,"interop","refonte_lg_classement");
  res.checks.syncLabel=await pB.evaluate(()=>(document.querySelector(".scr .bar .lea-sync")||{}).textContent);
  await pA.screenshot({path:path.join(OUT,"interop_v13_accueil.png"),fullPage:false});
  res.checks.storageB=(await keys(pB)).filter(k=>!/^w26_/.test(k));
  await cA.close();await cB.close()}

/* ---------- 4. profil emporté (#moi=) : refonte → refonte, v13.5 → refonte ---------- */
async function move(b,dev){const res=R.move={errs:[],checks:{},screens:{}};
  const c1=await newCtx(b,dev),p1=await c1.newPage();watch(p1,res);await p1.goto(B_URL+"?nointro");await ready(p1);await p1.evaluate(SEED);await p1.reload();await ready(p1);
  const link=await p1.evaluate(()=>moveLink());const src={league:await LSget(p1,"league"),picks:await LSget(p1,"picks"),scores:await LSget(p1,"scores")};
  const c2=await newCtx(b,dev),p2=await c2.newPage();watch(p2,res);await p2.goto(link.replace("worlds-b.html#","worlds-b.html?nointro#"));await ready(p2);await p2.waitForTimeout(800);
  res.checks.refonteToRefonte={sameLeague:JSON.stringify(await LSget(p2,"league"))===JSON.stringify(src.league),samePicks:JSON.stringify(await LSget(p2,"picks"))===JSON.stringify(src.picks),
    sameScores:JSON.stringify(await LSget(p2,"scores"))===JSON.stringify(src.scores),hash:await p2.evaluate(()=>location.hash),toast:await p2.evaluate(()=>document.querySelector("#toast").textContent)};
  // v13.5 → refonte : le lien de v13.5 ouvert sur la refonte
  const c3=await newCtx(b,dev),p3=await c3.newPage();await p3.goto(A_URL);await p3.waitForFunction(()=>typeof moveLink==="function",null,{timeout:30000});
  await p3.evaluate(()=>{localStorage.setItem("w26_league",JSON.stringify({code:"AB2C",me:{id:"v13me",name:"Vieux"},owner:false,gage:"",players:{}}));localStorage.setItem("w26_picks",JSON.stringify({"T1_TES_sw":"T1"}))});
  const l3=await p3.evaluate(()=>moveLink());const c4=await newCtx(b,dev),p4=await c4.newPage();watch(p4,res);
  await p4.goto(B_URL+"?nointro"+l3.slice(l3.indexOf("#")));await ready(p4);await p4.waitForTimeout(800);
  res.checks.v13ToRefonte={league:(await LSget(p4,"league")||{}).code,me:((await LSget(p4,"league")||{}).me||{}).id,pick:(await LSget(p4,"picks")||{})["T1_TES_sw"],toast:await p4.evaluate(()=>document.querySelector("#toast").textContent)};
  for(const c of [c1,c2,c3,c4])await c.close()}

/* ---------- 5. invitation ?ligue=CODE&n=…&g=… ---------- */
async function invite(b,name,dev){const res=R[name+"_invite"]={errs:[],checks:{},screens:{}};const ctx=await newCtx(b,dev),p=await ctx.newPage();watch(p,res);
  await p.goto(B_URL+"?nointro&ligue=ab2c&n=L%C3%A9a&g=Le%20dernier%20paie%20les%20pizzas");await ready(p);await p.waitForTimeout(1500);
  res.checks.open=await p.evaluate(()=>({top:NAV.length&&NAV[NAV.length-1].d.v+"/"+NAV[NAV.length-1].d.id,search:location.search,inv:(document.querySelector(".scr .lea-inv")||{}).textContent,code:(document.querySelector(".scr .lea-code")||{}).textContent}));
  await measure(p,res,"lgf_invite");await shot(p,name,"lgf_invite");
  await p.fill(".scr .lea-in[name=n]","Thomas");await p.evaluate(()=>document.querySelector(".scr .lea-go").click());await p.waitForTimeout(1600);
  const L=await LSget(p,"league");res.checks.joined={code:L&&L.code,gage:L&&L.gage,owner:L&&L.owner,top:await p.evaluate(()=>NAV.length&&NAV[NAV.length-1].d.v)};
  await ctx.close()}

(async()=>{await new Promise(r=>srv.listen(PORT,"127.0.0.1",r));const b=await chromium.launch();
  const D=Object.entries(DEV).filter(([n])=>!ONLY||ONLY===n);
  try{
    if(SC==="ui"||SC==="all")for(const [n,d] of D){log("ui",n);try{await ui(b,n,d)}catch(e){(R[n+"_ui"]=R[n+"_ui"]||{}).crash=e.message.slice(0,400)}}
    if(SC==="seed"||SC==="all")for(const [n,d] of D){log("seed",n);try{await seed(b,n,d)}catch(e){(R[n+"_seed"]=R[n+"_seed"]||{}).crash=e.message.slice(0,400)}}
    if(SC==="invite"||SC==="all")for(const [n,d] of D.slice(0,1)){log("invite",n);try{await invite(b,n,d)}catch(e){(R[n+"_invite"]=R[n+"_invite"]||{}).crash=e.message.slice(0,400)}}
    if(SC==="move"||SC==="all"){log("move");try{await move(b,DEV.pixel7)}catch(e){(R.move=R.move||{}).crash=e.message.slice(0,400)}}
    if(SC==="interop"||SC==="all"){log("interop");try{await interop(b,DEV.pixel7)}catch(e){(R.interop=R.interop||{}).crash=e.message.slice(0,400)}}
  }finally{await b.close();srv.close()}
  let prev={};try{prev=JSON.parse(fs.readFileSync(path.join(__dirname,"league_results.json"),"utf8"))}catch(e){}
  fs.writeFileSync(path.join(__dirname,"league_results.json"),JSON.stringify({...prev,...R},null,1));
  let bad=0;for(const [n,x] of Object.entries(R)){log("=== "+n);if(x.crash){bad++;log("CRASH",x.crash)}
    if(x.screens)Object.entries(x.screens).forEach(([k,v])=>{const flag=(v.over>0&&v.over<120?" MINI-DÉFILEMENT":"")+(v.hs?" HSCROLL":"");log(" ",k.padEnd(18),"dépasse",String(v.over).padStart(4),"px  ratio",v.ratio,(v.cls||"").padEnd(9),flag,v.wide.length?JSON.stringify(v.wide):"",v.typo.length?"TYPO "+JSON.stringify(v.typo):"",v.small.length?"PETIT "+JSON.stringify(v.small):"")});
    if(x.checks)log("  contrôles:",JSON.stringify(x.checks));
    if(x.errs){log("  erreurs JS:",x.errs.length,x.errs.slice(0,5).join(" || "));bad+=x.errs.length}
    if(x.errsV13&&x.errsV13.length)log("  (v13.5) erreurs JS:",x.errsV13.length,x.errsV13.slice(0,3).join(" || "))}
  process.exit(bad?1:0)})();
