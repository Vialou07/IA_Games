/* =====================================================================================
   test/swiss_scen.js — module suisse, états futurs du tournoi simulés dans la page (aucune écriture réseau, aucun pari) :
   A « tirage à venir » (ronde en cours terminée, affiches suivantes inconnues), B « suisse finie + quarts tirés » (16 équipes
   à 3 victoires ou 3 défaites, 4 quarts connus, un quart en direct), C « champion » (finale jouée).
   Pour chaque état : sui (4 onglets), sim, cal, widgets ; erreurs JS, débordement horizontal, captures shots/suisse/scen_*.
   node test/swiss_scen.js [iphone12|pixel7|w360]      (DIST=… ; port 8902)
   ===================================================================================== */
const PW="C:/Users/vialo/AppData/Local/Temp/claude/c--Users-vialo-Desktop-Code-Worlds-2026/cead0307-273c-463a-8548-1b2491359512/scratchpad/pw/node_modules/playwright";
const {chromium,devices}=require(PW);const fs=require("fs"),path=require("path"),http=require("http");
const DIST=path.resolve(process.env.DIST||path.join(__dirname,"../dist")),OUT=path.join(__dirname,"../shots/suisse");fs.mkdirSync(OUT,{recursive:true});
const ONLY=process.argv[2]||"iphone12",PORT=8902;
const DEV={iphone12:{...devices["iPhone 12"]},pixel7:{...devices["Pixel 7"]},w360:{...devices["Galaxy S9+"],viewport:{width:360,height:740},screen:{width:360,height:740}}};
const srv=http.createServer((q,s)=>{const f=path.join(DIST,decodeURIComponent(q.url.split("?")[0]));if(!f.startsWith(DIST)||!fs.existsSync(f)){s.writeHead(404);s.end();return}s.writeHead(200,{"content-type":"text/html; charset=utf-8"});fs.createReadStream(f).pipe(s)});
/* dans la page : fait avancer le tournoi (déterministe : le favori du robot gagne, sinon la 1re équipe) */
const ADV=function(mode){
  const fin=m=>{const p=robotProb(m);const a=p==null||p>=.5;m.winner=a?m.t1:m.t2;m.s1=m.bo===1?(a?1:0):(a?Math.ceil(m.bo/2):1);m.s2=m.bo===1?(a?0:1):(a?1:Math.ceil(m.bo/2));m.state="done";m.apiLive=false};
  MATCHES.filter(m=>m.stage==="sw"&&m.t1&&m.t2&&!m.winner).forEach(fin);
  MATCHES=MATCHES.filter(m=>!(m.stage==="sw"&&!(m.t1&&m.t2)));
  const rec=()=>{const R={};swissTeams().forEach(t=>R[t.id]=[0,0]);MATCHES.filter(m=>m.stage==="sw"&&m.winner).forEach(m=>{R[m.winner][0]++;R[m.winner===m.t1?m.t2:m.t1][1]++});return R};
  let day=Date.parse("2026-10-25T17:00:00Z"),n=0;
  const round=()=>{const R=rec(),alive=Object.keys(R).filter(id=>R[id][0]<3&&R[id][1]<3),G={};alive.forEach(id=>{const k=R[id].join("-");(G[k]=G[k]||[]).push(id)});
    const L=[];Object.values(G).forEach(g=>{for(let i=0;i+1<g.length;i+=2){const dec=R[g[i]][0]===2||R[g[i]][1]===2;L.push({id:"scn"+(n++),stage:"sw",label:"",t1:g[i],t2:g[i+1],start:new Date(day+L.length*3600e3).toISOString(),bo:dec?3:1})}});day+=2*864e5;return L};
  for(let r=0;r<3;r++){const L=round();if(!L.length)break;if(mode==="draw"&&r===0){/* ronde suivante annoncée sans affiches */L.forEach(m=>{m.t1=null;m.t2=null});MATCHES.push(...L);return finalize(MATCHES)}L.forEach(fin);MATCHES.push(...L)}
  MATCHES=finalize(MATCHES);
  const R=rec(),Q=Object.keys(R).filter(id=>R[id][0]>=3).sort((a,b)=>R[a][1]-R[b][1]);
  const qf=[0,1,2,3].map(i=>({id:"scq"+i,stage:"qf",label:"Quarts de finale",t1:Q[i],t2:Q[7-i],start:new Date(Date.parse("2026-11-03T22:00:00Z")+i*864e5).toISOString(),bo:5}));
  MATCHES.push(...qf);
  if(mode==="ko"){qf.slice(0,2).forEach(fin);qf[2].apiLive=true;qf[2].s1=1;qf[2].s2=1;qf[2].start=new Date(Date.now()-3600e3).toISOString();return finalize(MATCHES)}
  qf.forEach(fin);const sf=[0,1].map(i=>({id:"scs"+i,stage:"sf",label:"Demi-finales",t1:qf[2*i].winner,t2:qf[2*i+1].winner,start:new Date(Date.parse("2026-11-07T22:00:00Z")+i*864e5).toISOString(),bo:5}));sf.forEach(fin);MATCHES.push(...sf);
  const f={id:"scf",stage:"f",label:"Finale",t1:sf[0].winner,t2:sf[1].winner,start:"2026-11-14T19:00:00Z",bo:5};fin(f);MATCHES.push(f);return finalize(MATCHES)};
(async()=>{await new Promise(r=>srv.listen(PORT,"127.0.0.1",r));const out={};
  const b=await chromium.launch();const ctx=await b.newContext({...DEV[ONLY],locale:"fr-FR",timezoneId:"Europe/Paris"});
  for(const mode of ["draw","ko","champ"]){
    const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
    await p.goto(`http://127.0.0.1:${PORT}/worlds-b.html?nointro`,{waitUntil:"domcontentloaded"});
    await p.waitForFunction(()=>typeof MATCHES!=="undefined"&&MATCHES.length&&document.querySelector(".home .grid .w")&&SJ&&SJ.sim,null,{timeout:60000});await p.waitForTimeout(2500);
    /* figer : plus de synchro qui écraserait l'état simulé */
    await p.evaluate(([src,mode])=>{clearTimeout(sync.t);window.sync=()=>{};const f=new Function("return ("+src+")")();MATCHES=f(mode);localStorage.setItem("w26_fav",JSON.stringify("T1"));fav="T1";onData()},[ADV.toString(),mode]);
    await p.waitForTimeout(600);
    const st=await p.evaluate(()=>{const S=swiState();return {r:S.r,drawn:S.drawn,over:S.over,q:S.q,x:S.x}});const res={st,errs,tabs:{}};out[mode]=res;
    for(const [r,t] of [["sui","rd"],["sui","tb"],["sui","bl"],["sui","fn"],["sim","ti"],["sim","rob"],["cal","next"],["cal","res"]]){
      await p.evaluate(r=>go(r),r+"/"+t);await p.waitForTimeout(900);
      res.tabs[r+"/"+t]=await p.evaluate(()=>{const el=NAV[NAV.length-1].el;return {over:el.classList.contains("fit")?0:el.scrollHeight-el.clientHeight,h:el.scrollWidth>el.clientWidth+1,txt:el.querySelector(".tabc").textContent.replace(/\s+/g," ").trim().slice(0,90)}});
      await p.screenshot({path:`${OUT}/${ONLY}_scen_${mode}_${r}_${t}.png`});
      await p.evaluate(()=>history.back());await p.waitForTimeout(500)}
    res.widgets=await p.evaluate(()=>({sim:widget("sim",0).length,swiss:widget("swiss",0).replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim(),myteam:widget("myteam",0).replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim()}));
    await p.evaluate(()=>localStorage.removeItem("w26_fav"));await p.close()}
  await b.close();srv.close();console.log(JSON.stringify(out,null,1));
  const bad=Object.values(out).reduce((a,x)=>a+x.errs.length+Object.values(x.tabs).filter(t=>t.h).length,0);process.exit(bad?1:0)})();
