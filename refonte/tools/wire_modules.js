/* Outil à usage unique (architecte) : branche les modules découpés de B sur l'API du socle (defScreen, defWidget, INFOP,
   onAct, BUS) et leur met un en-tête. Ne pas relancer après le début des portages. */
const fs=require("fs"),path=require("path");
const SRC=path.join(__dirname,"../src"),B=path.join(__dirname,"../../designB/src.html");
const L=fs.readFileSync(B,"utf8").replace(/\r/g,"").split("\n"),r=(a,b)=>L.slice(a-1,(b||a)).join("\n");
const edit=(f,fn)=>{const p=path.join(SRC,f);let s=fs.readFileSync(p,"utf8");const rep=(a,b)=>{if(!s.includes(a))throw new Error(f+" : motif absent : "+a.slice(0,80));s=s.replace(a,()=>b)};
  s=fn(s,rep)||s;if(/LSB|w26b_|SCR\[/.test(s))throw new Error(f+" : reste de maquette");fs.writeFileSync(p,s);console.log(f,(s.length/1024).toFixed(1)+" Ko")};
const head=(nom,owner,txt)=>`/* =====================================================================================
   ${nom} — ${txt}
   Propriétaire : agent ${owner}. Conventions : nouveaux noms globaux préfixés (voir ARCHI.md), aucun rendu au chargement.
   ===================================================================================== */
`;
/* « if(t==="x"…){…} » de infoFor → corps d'une fonction INFOP */
const pfx=(a,b,from,to)=>{let s=r(a,b);if(!s.includes(from))throw new Error("infoFor : "+from);return s.replace(from,()=>to)};

edit("match.js",(s,rep)=>{
  rep('render:t=>t==="fil"?tabFeed(m):t==="dr"?tabDraftLive(m):t==="av"?tabOverview(m,true):tabLivePlayers(m),needs:[loadDJ(),loadFJ()]}}',
      'render:t=>t==="fil"?tabFeed(m):t==="dr"?tabDraftLive(m):t==="av"?tabOverview(m,true):tabLivePlayers(m),needs:[loadDJ(),loadFJ()],\n    skipData:d=>["fil","pl","dr"].includes(d.tab)&&!!LV.games[m.key]}}');
  rep('    mount:el=>startBeam(el.querySelector(".headslot .beam")),needs:[loadDJ()]};\n}',
      '    mount:el=>startBeam(el.querySelector(".headslot .beam")),needs:[loadDJ()],opened:el=>loadStats(el,gamesOf(m)),onData:el=>loadStats(el,gamesOf(m))};\n}');
  rep('  const w=document.getElementById("wlive");if(w&&w.dataset.k===m.key){const h=liveMini(m);if(w._h!==h){w._h=h;w.innerHTML=h}}\n','');
  rep('    if(x===NAV[NAV.length-1]&&["pl","fil","dr"].includes(x.d.tab))refreshTab(x.el,0)}});\n}',
      '    if(x===NAV[NAV.length-1]&&["pl","fil","dr"].includes(x.d.tab))refreshTab(x.el,0)}});\n  BUS.emit("live",m);\n}');
  return head("match.js","match","FICHE DE MATCH : à venir (Aperçu, Joueurs, Draft, Stats), en direct (HUD, Joueurs, Fil, Draft, Avant), terminé (Résumé, Parties, Joueurs, Draft) ; moteur du direct (liveTick, watchLive, paintLive → BUS \"live\").")+s+`
/* ---------- branchements ---------- */
defScreen("m",{arg:"idtab",screen:scrMatch});
INFOP.keys=(a,b)=>matKeyInfo("keys",a,b);INFOP.key=(a,b)=>matKeyInfo("key",a,b);
function matKeyInfo(t,a,b){${pfx(1103,1104,'  if(t==="key"||t==="keys"){','')}
/* partie choisie dans « Résumé » (pastille) ou dans le sélecteur d'un onglet */
onAct("[data-gm]",gn=>{const el=gn.closest(".scr");el._d.g=+gn.dataset.gm;setTab(el,"gm")});
onAct("[data-game]",gm=>{const el=gm.closest(".scr");el._d.g=+gm.dataset.game;refreshTab(el,0);loadStats(el,gamesOf(mOf(el._d.id)).filter(g=>g.n===el._d.g))});
/* un match passe en direct : on suit son flux (une seule partie suivie à la fois) */
BUS.on("data",()=>{const lv=MATCHES.find(x=>x.state==="live");if(lv)watchLive(lv)});
`});

edit("players.js",(s,rep)=>head("players.js","joueurs","JOUEURS : fiche joueur (Saison, Duels, Champions), duel A contre B, classement par poste ; widget « Classement ».")+s+`
/* ---------- branchements ---------- */
defScreen("p",{arg:"idtab",screen:scrPlayer});
defScreen("d",{arg:"id",screen:scrDuel});
defScreen("rk",{arg:"id",screen:scrRank,parse:a=>({v:"rk",id:a||"TOP"})});
defWidget("rank",wRank);
INFOP.why=a=>{${pfx(1106,1107,'  if(t==="why"){','')}
`);

edit("swiss.js",(s,rep)=>head("swiss.js","suisse","SUISSE ET CALENDRIER : qui va gagner (simulation), calendrier (à venir, résultats) ; widget « Qui va gagner ? ». À venir : arbre suisse, ronde en cours, phase finale, fiabilité du robot.")+s+`
/* ---------- branchements ---------- */
defScreen("sim",{arg:"none",screen:scrSim});
defScreen("cal",{arg:"tab",screen:scrCal});
defWidget("sim",wSim);
INFOP.team=a=>{${pfx(1108,1109,'  if(t==="team"){','')}
`);

edit("stats.js",(s,rep)=>head("stats.js","stats","STATS ET FAITS : le saviez-vous (un fait par écran, précédent / suivant) ; widget « Le saviez-vous ? ». À venir : tournoi, leaders, champions, ligues.")+s+`
/* ---------- branchements ---------- */
defScreen("fx",{arg:"id",screen:scrFacts,parse:a=>({v:"fx",id:+a||0})});
defWidget("fact",wFact);
INFOP.fx=a=>{const f=fxList()[+a];return f?["Comment c’est calculé",\`<p>\${esc(f[3])}</p>\`,true]:null};
onAct("[data-fx]",fx=>{const el=fx.closest(".scr");el._d.id+=+fx.dataset.fx;rerenderFacts(el,+fx.dataset.fx)});
`);

edit("league.js",(s,rep)=>head("league.js","ligue","PARIS ET LIGUE : mes paris (à parier, en attente, bilan), la ligue (classement, toi contre le robot) ; widgets « Mes paris », « Ligue », « Ton prono ». À venir : protocole ntfy de v13.5, création, invitation, badges.")+s+`
/* ---------- branchements ---------- */
defScreen("bets",{arg:"tab",screen:scrBets});
defScreen("lg",{arg:"none",screen:scrLeague});
defWidget("bets",wBets);defWidget("league",wLeague);defWidget("livebets",wLiveBets);
/* pari fait depuis « À parier » : la ligne s'efface puis l'écran se redessine */
BUS.on("pick",(k,t,b)=>{if(!b||!b.closest(".qb"))return;const r=b.closest(".qb");if(!RM)r.animate([{opacity:1},{opacity:0,transform:"translateX(30px)"}],{duration:300,fill:"forwards"});setTimeout(()=>{const el=b.closest(".scr");if(el)rerender(el)},320)});
`);

const tm=path.join(SRC,"team.js");fs.writeFileSync(tm,head("team.js","suisse","ÉQUIPES : liste des 19 équipes (filtre par ligue) et fiche équipe (route t/<id>). À écrire : rien n'existe dans la maquette B.")+"\n");console.log("team.js");
