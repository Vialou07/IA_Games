/* =====================================================================================
   league.js — PARIS ET LIGUE (propriétaire : agent ligue)
   Écrans : « Mes paris » bets/<onglet> (À parier · En attente · Bilan) ; « Ligue » lg/<onglet> (sans ligue : créer, rejoindre,
   toi contre le robot ; avec : Classement · Paris · Badges · Réglages) ; formulaire lgf/create | lgf/join ; un membre lgu/<id>.
   Widgets de l'accueil : bets, league, livebets. Blocs pour la fiche de match (placés par le module match) : leaScoreHTML (score
   exact), leaMyHTML (ton prono et tes points), leaMatchHTML (les paris de la ligue) ; aides pour l'accueil : leaHeroLine, leaEveBest, leaDue.
   Protocole ntfy, points, classement, robot membre, badges : extraits tels quels de v13.5 (src/legacy/league.list.js), on les appelle.
   Mêmes clés que v13.5 : w26_picks (socle), w26_scores, w26_league, w26_myname, w26_lgRank, w26_celebrated, w26_mv_lb_<code>.
   Conventions : noms préfixés lea (sauf avatar, renderDuelOnly, duelSheet : noms de v13.5 appelés par les extraits), aucun rendu au chargement.
   ===================================================================================== */
const LEA={pre:null,ring:false};
const LEA_BOT=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M9 13v2M15 13v2"/></svg>`;
const LEA_OK=`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7"/></svg>`;
const LEA_LOCK=`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="3.5" y="7" width="9" height="6.5" rx="1.6"/><path d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7"/></svg>`;
const LEA_EZ="cubic-bezier(.22,1,.36,1)";

/* ===================== petits outils ===================== */
/* confettis du socle (confetti, extrait 1503-1514) : rien tant qu'il n'est pas là */
function leaBoom(x,y,c,n){try{if(typeof confetti==="function")confetti(x,y,c,n)}catch(e){}}
/* avatar d'un membre (nom de v13.5 : uxBetsLine l'appelle) : initiale sur la couleur du joueur (même couleur que v13.5), robot en icône */
function avatar(u,size=34){const s=`width:${size}px;height:${size}px`;
  if(u.bot)return `<span class="dav dbot" style="${s}">${LEA_BOT}</span>`;
  return `<span class="dav" style="${s};font-size:${Math.round(size*.46)}px;background:${pcol(u.id)}">${esc((String(u.name||"?").trim().charAt(0)||"?").toUpperCase())}</span>`}
/* membres : la ligue (v13.5 members) ; sans ligue, toi et le robot avec les mêmes règles (robotBets, standings) */
function leaMembers(){if(lg)return members();
  const L=[{id:"me",name:LS.get("myname","")||"Toi",p:myBets(),me:true}];
  if(SJ&&(SJ.fiab||SJ.sim))L.push({id:"robot",name:"Le robot",p:robotBets(L),bot:true});return L}
const leaStand=()=>standings(leaMembers());
const leaOthers=()=>lg&&lg.players?Object.keys(lg.players).length:0;
const leaNm=u=>u.me?"toi":u.name;
const leaTm=c=>T[c]?T[c].id:String(c||"?");
const leaPc=v=>Math.round(v*100)+NB+"%";
const leaDay=iso=>{const d=new Date(iso);return isNaN(d)?"":evDate(d).toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"})};
function leaDayLab(x){const d=new Date(x.start),dk=dayKeyL(d);return dk===dayKeyL(new Date())?"Ce soir":dk===dayKeyL(new Date(Date.now()+864e5))?"Demain":fmtDay(evDate(d))}
const leaNight=d=>d.getHours()<6?`<small>nuit</small>`:"";
const leaDots=f=>`<span class="lea-dots" aria-hidden="true">${f.slice(-5).map(x=>`<i class="${x?"o":"x"}"></i>`).join("")}</span>`;
function leaSyncState(){return DU.open||DU.pollOk?["on","Synchro active","synchro active"]:DU.pubErr?["ko","Pas de connexion, nouvel essai en cours","hors ligne, nouvel essai"]:["","Connexion…","connexion…"]}
const leaSync=(long)=>{const s=leaSyncState();return `<span class="lea-sync ${s[0]}" data-l="${long?1:0}"><i></i>${long?s[1]:s[2]}</span>`};
/* paris de ce téléphone */
function mBets(){const o={};Object.keys(picks).forEach(k=>o[k]={w:picks[k]});return o}
function betStats(){const done=MATCHES.filter(x=>x.winner&&picks[x.key]),good=done.filter(x=>picks[x.key]===x.winner).length,open=MATCHES.filter(x=>x.t1&&x.t2&&!picks[x.key]&&betOpen(x));return {done,good,open}}
const leaPend=()=>MATCHES.filter(x=>picks[x.key]&&!x.winner&&x.t1&&x.t2);
/* matchs des prochaines 24 h pas encore pariés (pastille de l'accès Paris, comme betBadge de v13.5) */
const leaDue=()=>MATCHES.filter(x=>x.t1&&x.t2&&!picks[x.key]&&betOpen(x)&&new Date(x.start)-Date.now()<24*3600e3).length;

/* ===================== joker, coup de poker, vote du robot (règles de la ligue du 27/10) =====================
   Points d'un match = (1 bon vainqueur + 1 score exact + 1 coup de poker) × 2 avec le joker ; mauvais vainqueur : 0, joker ou pas.
   Coup de poker : bon vainqueur alors que le robot donnait l'autre équipe favorite à 65 % ou plus (son prono figé du match, SJ.fiab).
   Joker : un par soirée (heure de Paris, la nuit compte avec la veille), posé tant que les paris du match sont ouverts.
   w26_side {clé:{j:1}}, publié en 6e champ : clé~vainqueur~score~~~J (v13.5 et v14.3 ne lisent que les 3 premiers).
   Vote robot : vainqueur seul, ni score exact, ni poker, ni joker. Mêmes données partout, donc même classement sur chaque téléphone. */
const LEA_POK=.65;
let LSIDE=LS.get("side",{})||{};
Object.keys(LSIDE).forEach(k=>{if(!LSIDE[k]||!LSIDE[k].j)delete LSIDE[k]});   // anciens paris bonus (1er sang, 1er dragon) : oubliés
function leaEnc(){return Object.keys(picks).filter(k=>picks[k]).map(k=>`${k}~${picks[k]}~${scores[k]||""}${LSIDE[k]&&LSIDE[k].j?"~~~J":""}`).join(".")}
function leaDecSide(str){const o={};String(str||"").split(".").forEach(x=>{const f=x.split("~");if(f[0]&&f[1]&&f[5]==="J")o[f[0]]={j:1}});return o}
/* soirée d'un match : date de Paris de l'heure de début moins 6 h (un match à minuit compte avec la soirée) */
const LEA_SF=new Intl.DateTimeFormat("fr-CA",{timeZone:"Europe/Paris",year:"numeric",month:"2-digit",day:"2-digit"});
const leaSoir=m=>{const t=Date.parse(m&&m.start);return isNaN(t)?"":LEA_SF.format(new Date(t-6*36e5))};
/* prono figé du robot (avant chaque match joué) : vainqueur et chances de chaque équipe */
function leaRobotFrozen(){const F=SJ&&SJ.fiab&&SJ.fiab.w26&&SJ.fiab.w26.m;if(!F)return null;const c=leaRobotFrozen;if(c.f===F&&c.n===MATCHES.length)return c.o;
  const o={},q={},tidr=x=>T[x]?x:(typeof resolveTeam==="function"?resolveTeam(x,x):null);
  F.forEach(r=>{const m=MATCHES.find(x=>x.id==="le"+r[0]);if(!m)return;const a=tidr(r[2]),b=tidr(r[3]),w=r[5]>=.5?a:b;
    if(w&&(w===m.t1||w===m.t2))o[m.key]=w;if(a&&b&&typeof r[5]==="number")q[m.key]={[a]:r[5],[b]:1-r[5]}});
  c.f=F;c.n=MATCHES.length;c.o=o;c.q=q;return o}
const leaFrozenP=(m,t)=>{leaRobotFrozen();const q=leaRobotFrozen.q&&leaRobotFrozen.q[m.key];return q&&q[t]!=null?q[t]:null};
/* avant le match : le pari sur t serait un coup de poker (prono du moment du robot, le figé décide à la fin) */
const leaPokerTip=(m,t)=>{const f=seriesFav(m);return !!(f&&t&&f.t!==t&&f.p>=LEA_POK)};
function leaRobotFill(L){const F=leaRobotFrozen();if(!F)return;const t=m=>Date.parse(m.start)||0,D=MATCHES.filter(m=>m.winner&&!m.manual&&m.t1&&m.t2&&F[m.key]);if(!D.length)return;
  L.forEach(u=>{if(u.bot)return;let f0=Infinity;MATCHES.forEach(m=>{if(u.p[m.key])f0=Math.min(f0,t(m))});if(f0===Infinity)return;let add=null;
    D.forEach(m=>{if(!u.p[m.key]&&t(m)>f0)(add||(add=Object.assign({},u.p)))[m.key]={w:F[m.key],sc:null,robot:true}});if(add)u.p=add})}
/* jokers valables d'un membre : un par soirée, sur un vrai pari ; deux jokers la même soirée : le plus tôt compte */
function leaJokers(u){const S=u.s||{},o={},seen={};
  MATCHES.filter(m=>S[m.key]&&S[m.key].j&&u.p[m.key]&&u.p[m.key].w&&!u.p[m.key].robot).sort((a,b)=>(Date.parse(a.start)||0)-(Date.parse(b.start)||0)||(a.key<b.key?-1:1))
    .forEach(m=>{const d=leaSoir(m);if(!seen[d]){seen[d]=1;o[m.key]=1}});return o}
/* points d'un pari sur un match joué : {v, sc, pk, jk, robot, t} */
function leaPtsOf(u,m,J){const b=u.p[m.key];if(!b||!b.w||!m.winner||m.manual)return null;const base=pts(b.w,b.sc,m),real=!b.robot&&!u.bot;
  const d={v:base>0?1:0,sc:base>1?1:0,pk:0,jk:real&&(J||leaJokers(u))[m.key]?1:0,robot:!!b.robot};
  if(base&&real){const q=leaFrozenP(m,b.w);if(q!=null&&q<=1-LEA_POK)d.pk=1}
  d.t=(d.v+d.sc+d.pk)*(d.jk?2:1);return d}
/* appelé par standings (extrait v13.5) avant le rattrapage : poker et joker en plus des points de base, détail par match u.mp */
function leaSidePts(all){const done=MATCHES.filter(m=>m.winner&&!m.manual&&m.t1&&m.t2);
  all.forEach(u=>{u.sp=0;u.pk=0;u.jk=0;u.mp={};const J=u.bot?{}:leaJokers(u);
    done.forEach(m=>{const d=leaPtsOf(u,m,J);if(!d)return;u.mp[m.key]=d;const add=d.t-d.v-d.sc;if(add){u.pts+=add;u.sp+=add}if(d.pk)u.pk++;if(d.jk&&d.t)u.jk++})})}
/* petites pastilles du détail : « +1 · score +1 · poker +1 · joker ×2 » */
function leaPtsTags(d){if(!d)return"";if(!d.t)return d.jk?`<span class="lea-tg jk off">joker</span>`:"";
  return [d.sc?`<span class="lea-tg">score exact</span>`:"",d.pk?`<span class="lea-tg pk">poker +1</span>`:"",d.jk?`<span class="lea-tg jk">joker ×2</span>`:""].join("")}
/* joker du match (sous le prono, tant que les paris sont ouverts) et indice « coup de poker » */
const LEA_JK=`<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="1.5" width="10" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 4.6 9 7l2.4.2-1.8 1.6.5 2.4L8 10l-2.1 1.2.5-2.4-1.8-1.6L7 7z" fill="currentColor"/></svg>`;
function leaJokOther(m){const d=leaSoir(m);return MATCHES.find(x=>x.key!==m.key&&LSIDE[x.key]&&LSIDE[x.key].j&&picks[x.key]&&leaSoir(x)===d)||null}
function leaSideHTML(m){if(!m||!m.t1||!m.t2||!betOpen(m)||!picks[m.key]||!T[picks[m.key]])return"";
  const on=!!(LSIDE[m.key]&&LSIDE[m.key].j),o=on?null:leaJokOther(m),pk=leaPokerTip(m,picks[m.key]);
  return `<div class="lea-sc lea-jkr"><span class="lea-scl">Joker<b>${on?"points ×2 sur ce match":o?`déjà sur ${esc(tid(o.t1))}–${esc(tid(o.t2))}`:"1 par soirée, points ×2"}</b></span><button class="chip lea-jkb" data-jok data-mk="${esc(m.key)}" aria-pressed="${on}">${LEA_JK}${on?"Joker posé":o?"Le mettre ici":"Poser le joker"}</button></div>`
    +(pk?`<p class="lea-pok"><b>Coup de poker</b> : le robot voit ${esc(tid(m.t1===picks[m.key]?m.t2:m.t1))} favori, +1 si ${esc(tid(picks[m.key]))} gagne.</p>`:"")}
onAct("[data-jok]",b=>{const k=b.dataset.mk,m=MATCHES.find(x=>x.key===k);if(!m)return;
  if(!betOpen(m)){MATCHES=finalize(MATCHES);toast("Paris fermés : la partie a commencé");onData();return}
  if(!picks[k]){toast("Choisis d’abord un vainqueur");return}
  if(LSIDE[k]&&LSIDE[k].j){delete LSIDE[k];toast("Joker retiré")}
  else{const o=leaJokOther(m);if(o&&!betOpen(o)){toast(`Joker déjà joué ce soir sur ${tid(o.t1)}–${tid(o.t2)}`);return}
    if(o)delete LSIDE[o.key];LSIDE[k]={j:1};toast(`Joker : points ×2 sur ${tid(m.t1)}–${tid(m.t2)}`);vib([12,40,12]);
    const r=b.getBoundingClientRect();leaBoom(r.left+r.width/2,r.top+r.height/2,["#C8AA6E","#F0E6D2","#A66CFF"],40)}
  LS.set("side",LSIDE);duelPickChanged(k);NAV.forEach(x=>{if(x.el.isConnected&&x.d&&(x.d.v==="m"||x.d.v==="bets"))rerender(x.el)});renderHome()});

/* ===================== PARIS : un seul endroit (Thomas, 26/10) =====================
   Accueil : widget « Paris » (ton prono du moment, ce qu'il reste à parier, ta place) → écran Paris :
   À parier · Mes paris (tes choix et tes points, votes du robot compris) · Classement (la ligue, ou toi contre le robot) · La ligue (les paris des autres). */
function wParis(k,hm){const {open,done:dn,good}=betStats(),nx=leaNextDue(open),S=leaStand(),me=S.find(u=>u.me)||{pts:0,rank:1},bot=S.find(u=>u.bot),solo=!lg||!leaOthers();
  let c1="";
  if(hm&&hm.t1&&hm.t2){const pk=picks[hm.key],mine=lg?((members().find(u=>u.me)||{}).p||{})[hm.key]:null,vs=`${esc(tid(hm.t1))}–${esc(tid(hm.t2))}`;
    c1=pk?`<span class="pw-v">${logo(pk,22)}${esc(tid(pk))}${scores[hm.key]?`<small>${esc(scores[hm.key])}</small>`:""}</span><small>ton prono · ${vs}</small>`
      :mine&&mine.robot?`<span class="pw-v">${logo(mine.w,22)}${esc(tid(mine.w))}</span><small>vote robot · ${vs}</small>`
      :betOpen(hm)?`<span class="pw-v ko">À parier</span><small>${vs}</small>`:`<span class="pw-v" style="color:var(--muted)">Pas parié</span><small>${vs}</small>`}
  const c2=nx?`<span class="pw-v ko">${nx.n}</span><small>à parier ${nx.when}</small>`:`<span class="pw-v ok">${LEA_OK.replace("<svg",'<svg width="22" height="22"')}</span><small>tout est parié</small>`;
  const c3=`<span class="pw-v">${good}<small>/${dn.length}</small></span><small>pronos gagnés</small>`;
  /* le joker de la prochaine soirée ouverte aux paris : posé (sur quel match) ou à poser */
  const nm=MATCHES.filter(x=>x.t1&&x.t2&&betOpen(x)).sort((x,y)=>new Date(x.start)-new Date(y.start))[0],sd=nm&&leaSoir(nm),
    jm=nm&&MATCHES.find(x=>LSIDE[x.key]&&LSIDE[x.key].j&&picks[x.key]&&leaSoir(x)===sd),
    cj=nm?`<span class="pw-v jk">${LEA_JK}${jm?`${esc(tid(jm.t1))}<small>–</small>${esc(tid(jm.t2))}`:"à poser"}</span><small>${jm?"ton joker ×2":"joker ×2 "+(leaDayLab(nm)==="Ce soir"?"ce soir":esc(leaDayLab(nm).toLowerCase()))}</small>`:"";
  return W("w21 hom-pw",nx?"bets/todo":"bets/mine",`<div class="wh">Paris</div><div class="pw"><div class="pw-c">${c1||c3}</div><div class="pw-c">${c2}</div><div class="pw-c">${cj||(c1?c3:me.streak>1?`<span class="pw-v ok">${me.streak}</span><small>bons paris d’affilée</small>`:`<span class="pw-v">${leaPend().length}</span><small>en attente</small>`)}</div></div>`,k,"","Paris : ton prono, les matchs à parier, ton joker")}
/* une ligne de pari : jour et heure, le match, ton choix (score exact, bonus, vote du robot), le résultat */
function leaBetRow(m,b,d){const st=new Date(m.start),s=b&&b.s||null,p=b&&b.w&&m.winner&&!m.manual?(d?d.t:pts(b.w,b.sc,m)):null;
  const bon=""&&s?[s.fb?`1er sang ${esc(tid(s.fb))}`:"",s.fd?`1er dragon ${esc(tid(s.fd))}`:""].filter(Boolean).join(" · "):"";
  return `<button class="rowb lea-hr" data-go="m/${esc(m.id)}"><span class="d">${esc(evDate(st).toLocaleDateString("fr-FR",{weekday:"short",day:"numeric"}))}<small>${fmtTime(st)}</small></span><span class="grow"><b class="nm">${esc(tid(m.t1))} – ${esc(tid(m.t2))}</b>
    <small>${b&&b.w?`${logo(b.w,14)} ${esc(tid(b.w))}${b.sc?" "+esc(b.sc):""}${b.robot?` <span class="lea-rbv">vote robot</span>`:""}`:`<span style="color:var(--muted)">pas de vainqueur choisi</span>`}${p==null&&s&&s.j?` <span class="lea-tg jk">joker</span>`:leaPtsTags(d)}</small></span>
    ${p==null?`<em class="lea-st">${betOpen(m)?"modifiable":m.state==="soon"?"à venir":"en cours"}</em>`:`<em class="lea-st ${p?"ok":"ko"}">${p?"+"+p:"0"}</em>`}</button>`}
function leaMine(){const {done,good}=betStats(),p=done.length?good/done.length:0,S=leaStand(),me=S.find(u=>u.me)||{pts:0,ex:0,streak:0,sp:0},P=lg?((members().find(u=>u.me)||{}).p||{}):mBets();
  const B=k=>{const b=P[k]?Object.assign({},P[k]):picks[k]?{w:picks[k],sc:scores[k]||null}:null;if(LSIDE[k]){(b||(b={})).s=LSIDE[k]}return b};
  const up=MATCHES.filter(m=>m.t1&&m.t2&&!m.winner&&(picks[m.key]||LSIDE[m.key])),res=MATCHES.filter(m=>m.t1&&m.t2&&m.winner&&(P[m.key]||LSIDE[m.key])).reverse();
  const extra=[me.ex?plur(me.ex,"score exact","scores exacts"):"",me.pk?plur(me.pk,"coup de poker","coups de poker"):"",me.jk?plur(me.jk,"joker gagnant","jokers gagnants"):"",me.streak>=2?`série de ${me.streak}`:""].filter(Boolean).join(" · ");
  let h=`<div class="blk lea-bil"><div class="lea-bilh"><span class="ring lea-ring">${ringSVG(p,76,8)}<b>${done.length?Math.round(p*100)+NB+"%":"–"}</b></span><span class="tx"><b>${plur(me.pts,"point")}</b><span>${good}/${done.length} pronos gagnés</span><small>${extra}</small></span></div></div>`;
  if(up.length)h+=`<div class="day">À venir et en cours<small>${plur(up.length,"match","matchs")}</small></div><div class="list">${up.map(m=>leaBetRow(m,B(m.key))).join("")}</div>`;
  if(res.length)h+=`<div class="day">Résultats<small>${plur(me.pts,"point")}</small></div><div class="list">${res.slice(0,8).map(m=>leaBetRow(m,B(m.key),me.mp&&me.mp[m.key])).join("")}</div>${res.length>8?uxFold("lea_res","Tous mes résultats",plur(res.length-8,"autre match","autres matchs"),`<div class="list" style="padding:0 10px 10px">${res.slice(8).map(m=>leaBetRow(m,B(m.key),me.mp&&me.mp[m.key])).join("")}</div>`):""}`;
  if(!up.length&&!res.length)h+=`<div class="lea-empty"><b>Pas encore de pari</b><span>Choisis un vainqueur dans « À parier ».</span><button class="btn" data-tab="todo">À parier</button></div>`;
  return h+`<button class="btn" data-lea="sharepicks">Partager mes pronos</button>`}
function leaRankTab(){if(!lg)return leaNoLeague();
  return leaRank()+`<div class="list" style="margin-top:12px"><button class="rowb" data-info="leaPts"><span class="grow"><b class="nm">Comment on marque</b><small>vainqueur, score exact, coup de poker, joker</small></span><span class="chev">›</span></button><button class="rowb" data-go="lg/bg"><span class="grow"><b class="nm">Les badges</b><small>Flair, Bat le robot, Audacieux, Devin, Série</small></span><span class="chev">›</span></button><button class="rowb" data-go="lg/set"><span class="grow"><b class="nm">Réglages de la ligue</b><small>code, invitation, gage, synchro</small></span><span class="chev">›</span></button></div>`}

/* ===================== widgets de l'accueil ===================== */
/* une seule indication, lisible en 2 secondes : les matchs à parier de la prochaine soirée (« 4 ce soir », « 2 demain »,
   « 3 mardi »), sinon « à jour » ; la liste complète est dans Mes paris › À parier (intégrateur, demandes du socle 02:55 et 10:00) */
function leaNextDue(open){if(!open.length)return null;const o=open.slice().sort((a,b)=>new Date(a.start)-new Date(b.start)),dk=dayKeyL(new Date(o[0].start)),n=o.filter(x=>dayKeyL(new Date(x.start))===dk).length;
  const today=dayKeyL(new Date()),tom=dayKeyL(new Date(Date.now()+864e5)),wd=new Intl.DateTimeFormat("fr-FR",{weekday:"long"}).format(evDate(new Date(o[0].start)));
  return {n,when:dk===today?"ce soir":dk===tom?"demain":wd}}
function wBets(k){const {done,good,open}=betStats(),p=done.length?good/done.length:0,nx=leaNextDue(open);
  return W("w11","bets",`<div class="wh">Mes paris</div><div class="wb" style="flex-direction:row;align-items:flex-end;justify-content:space-between;gap:8px"><div style="min-width:0"><div class="wn">${good}<small>/${done.length}</small></div><div class="ws">${nx?`<b class="lea-due">${nx.n} à parier</b> ${nx.when}`:"tout est parié"}</div></div><span class="ring">${ringSVG(p)}<b>${done.length?Math.round(p*100):"–"}</b></span></div>`,k,"",`Mes paris : ${good} sur ${done.length} gagnés${nx?`, ${nx.n} à parier ${nx.when}`:", tout est parié"}`);}
function wLeague(k){const S=leaStand(),me=S.find(u=>u.me),bot=S.find(u=>u.bot);
  if(lg&&leaOthers()){const f=S[0];
    return W("w11","lg",`<div class="wh">Ligue<em>${esc(lg.code)}</em></div><div class="wb"><div class="wn">${ordS(me.rank)}<small>/${S.length}</small></div><div class="ws"><b>${plur(me.pts,"pt")}</b> · ${f===me||f.pts===me.pts?"en tête":"1<sup>er</sup>"+" : "+esc(f.name)}</div></div>`,k,"",`Ligue ${lg.code}`);}
  if(lg)return W("w11","lg",`<div class="wh">Ligue<em>${esc(lg.code)}</em></div><div class="wb"><div class="wn lea-wcode">${esc(lg.code)}</div><div class="ws"><b>Invite tes potes</b></div></div>`,k,"",`Ligue ${lg.code}`);
  return W("w11","lg",`<div class="wh">Toi vs robot</div><div class="wb"><div class="wn">${me?me.pts:0}<small>–</small>${bot?bot.pts:0}</div><div class="ws">${me&&bot?(me.pts>bot.pts?"<b>tu mènes</b>":me.pts<bot.pts?"le robot mène":"égalité"):"crée ta ligue"}</div></div>`,k,"","Toi contre le robot");}
/* pendant le match : les paris de la ligue révélés (sinon ton prono seul) */
function wLiveBets(m,k){const me=picks[m.key],L=lg&&leaOthers()?members():null;
  if(L&&!betOpen(m)){const B=L.filter(u=>u.p[m.key]),n1=B.filter(u=>u.p[m.key].w===m.t1).length;
    return W("w11","bets/lgb",`<div class="wh">Les paris</div><div class="wb"><div class="lea-wsp">${logo(m.t1,24)}<b>${n1}</b><i>–</i><b>${B.length-n1}</b>${logo(m.t2,24)}</div><div class="lea-wav">${B.slice(0,6).map(u=>`<span class="${u.p[m.key].w===m.t1?"a":"b"}">${avatar(u,20)}</span>`).join("")}</div><div class="ws">${me?`toi : <b>${esc(tid(me))}</b>`:"tu n’as pas parié"}</div></div>`,k,"","Les paris de la ligue");}
  return W("w11","bets/mine",`<div class="wh">Ton prono</div><div class="wb">${me?`<div style="display:flex;align-items:center;gap:8px">${logo(me,36)}<span class="wn" style="font-size:32px">${esc(tid(me))}${scores[m.key]?`<small>${esc(scores[m.key])}</small>`:""}</span></div>`:`<div class="wn" style="font-size:24px;color:var(--muted)">Pas parié</div>`}<div class="ws">${esc(tid(m.t1))} – ${esc(tid(m.t2))}</div></div>`,k,"","Ton prono");}
/* une ligne sous le héros de l'accueil (A-06) : « 2 sur 3 de la ligue ont parié » ; "" sans ligue */
function leaHeroLine(m){if(!m||!lg||!leaOthers()||m.state!=="soon")return"";const O=members().filter(u=>!u.me&&!u.bot),n=O.filter(u=>u.p[m.key]).length;
  return n===O.length?(O.length>1?"Tes potes ont tous parié":"Ton pote a parié"):`${n} sur ${O.length} de la ligue ${n>1?"ont":"a"} parié`}
/* bilan d'une soirée (A-09) : « Meilleure soirée : Léa, +4 » ; "" sans ligue ou sans point */
function leaEveBest(dk){if(!lg||!leaOthers())return"";const D=MATCHES.filter(x=>x.winner&&!x.manual&&x.t1&&x.t2&&dayKeyL(new Date(x.start))===dk);if(!D.length)return"";
  const S=standings().map(u=>({u,p:D.reduce((s,x)=>{const d=u.mp&&u.mp[x.key],b=u.p[x.key];return s+(d?d.t:b?pts(b.w,b.sc,x):0)},0)})).sort((a,b)=>b.p-a.p);
  return S[0].p>0?`Meilleure soirée : ${S.filter(x=>x.p===S[0].p).map(x=>x.u.me?"toi":x.u.name).join(" et ")}, +${S[0].p}`:""}

/* ===================== MES PARIS (bets/<onglet>) ===================== */
function scrBets(d){const S=leaStand(),me=S.find(u=>u.me)||{pts:0,rank:1},solo=!lg||!leaOthers();if(d.tab==="run"||d.tab==="done")d.tab="mine";
  const tabs=[["rk","Classement"],["todo","À parier"],["mine","Mes paris"]];if(lg&&leaOthers())tabs.push(["lgb","Les autres"]);
  return {title:`Paris<small>${plur(me.pts,"point")}${solo?"":` · ${me.rank}${me.rank===1?"er":"e"} sur ${S.length}`}</small>`,info:"paris",tabs,
    render:t=>{const h=t==="mine"?leaMine():t==="rk"?leaRankTab():t==="lgb"?leaLgBets():leaTodo();requestAnimationFrame(()=>{leaSegCount();if(t==="mine")leaRingMotion()});return h}}}
/* nombre de matchs dans les onglets (À parier 3, En attente 2), recalculé à chaque rendu */
function leaSegCount(){NAV.forEach(x=>{if(!x.d||x.d.v!=="bets"||!x.el.isConnected)return;const n={todo:betStats().open.length};
  x.el.querySelectorAll(".seg [data-tab]").forEach(b=>{const v=n[b.dataset.tab];if(v==null)return;const h=`À parier${v?` <i class="lea-n">${v}</i>`:""}`;if(b._h!==h){b._h=h;b.innerHTML=h}})})}
/* ligne de pari : heure, deux boutons (le favori du robot porte son %), › = le match */
function leaQb(x){const st=new Date(x.start),f=seriesFav(x),me=picks[x.key];
  const b=t=>`<button class="pkb" data-pick="${t}" data-mk="${esc(x.key)}" aria-pressed="${me===t}" aria-label="Parier sur ${esc(T[t].name)}">${logo(t,22)}<span>${esc(tid(t))}</span>${f&&f.t===t?`<i class="lea-rb">${Math.round(f.p*100)}${NB}%</i>`:""}</button>`;
  return `<div class="qb" data-qk="${esc(x.key)}"><time>${fmtTime(st)}${leaNight(st)}</time>${b(x.t1)}${b(x.t2)}<button class="go" data-go="m/${esc(x.id)}" aria-label="Le match ${esc(tid(x.t1))} contre ${esc(tid(x.t2))}">›</button></div>`}
function leaTodo(){const {open:o0}=betStats(),now=Date.now(),open=MATCHES.filter(x=>o0.includes(x)||(LEA.keep&&LEA.keep[x.key]&&now-LEA.keep[x.key]<6e5&&picks[x.key]&&betOpen(x)));
  if(!open.length)return `<div class="lea-empty"><span class="lea-eic">${LEA_OK}</span><b>Tous les matchs connus sont pronostiqués</b><span>Les affiches suivantes arrivent au tirage de la ronde.</span><button class="btn" data-go="cal">Voir le calendrier</button></div>`;
  let h="",dk0=null,grp=[];const flush=()=>{if(grp.length)h+=`<div class="day">${esc(leaDayLab(grp[0]))}<small>${plur(grp.length,"match","matchs")}</small></div><div class="blk lea-qbk">${grp.map(x=>leaQb(x)+(picks[x.key]?leaScoreHTML(x):"")).join("")}</div>`;grp=[]};
  open.forEach(x=>{const dk=dayKeyL(new Date(x.start));if(dk!==dk0){flush();dk0=dk}grp.push(x)});flush();
  return h+`<p class="lea-foot">Touche l’équipe que tu vois gagner. Ensuite, sous le match : le score exact (Bo3, Bo5) et ton joker de la soirée. <button class="lnk" data-info="leaPts">Comment on marque</button></p>`}
/* score exact (M-04) : une fois l'équipe choisie, Bo3 et Bo5, avant le coup d'envoi ; écrit w26_scores */
function leaScoreHTML(m){if(!m||!betOpen(m)||!picks[m.key]||!T[picks[m.key]])return"";const w=picks[m.key];if(!(m.bo>1))return leaSideHTML(m);
  return `<div class="lea-sc"><span class="lea-scl">Score exact<b>+1 point</b></span><div class="lea-scc" style="--n:${scoreOpts(m.bo).length}">${scoreOpts(m.bo).map(s=>`<button class="chip" data-score="${s}" data-mk="${esc(m.key)}" aria-pressed="${scores[m.key]===s}">${esc(tid(w))} ${s}</button>`).join("")}</div></div>`+leaSideHTML(m)}
/* ton prono après le coup d'envoi (M-05) : « gagné, +2 », « perdu », « en cours » ; ou « Paris fermés » */
function leaMyLine(m){const b=picks[m.key];if(!b||!T[b]){const me=lg?members().find(u=>u.me):null,rb=me&&me.p[m.key];
    if(rb&&rb.robot){const p=m.winner?pts(rb.w,null,m):null;return `<span class="lea-myp">${logo(rb.w,22)}<b>${esc(tid(rb.w))}</b><small class="lea-rbv">vote robot</small></span>${p==null?"":p?`<em class="lea-st ok">gagné, +${p}</em>`:`<em class="lea-st ko">perdu</em>`}`}
    return `<span class="lea-myn">${m.winner?"Tu n’avais pas parié sur ce match.":"Paris fermés : la partie a commencé."}</span>`}
  const sc=scores[m.key],me=m.winner?leaStand().find(u=>u.me):null,d=me&&me.mp&&me.mp[m.key],p=m.winner?(d?d.t:pts(b,sc,m)):null,jk=LSIDE[m.key]&&LSIDE[m.key].j;
  return `<span class="lea-myp">${logo(b,22)}<b>${esc(tid(b))}${sc?" "+esc(sc):""}</b>${p==null&&jk?`<span class="lea-tg jk">joker</span>`:leaPtsTags(d)}</span>${p==null?`<em class="lea-st">en cours</em>`:m.manual?`<em class="lea-st">résultat saisi</em>`:p?`<em class="lea-st ok">gagné, +${p}</em>`:`<em class="lea-st ko">perdu</em>`}`}
function leaMyHTML(m){if(!m||!m.t1||!m.t2||m.state==="soon")return"";return `<div class="blk lea-myb"><div class="bh">Ton prono</div><div class="lea-myr">${leaMyLine(m)}</div></div>`}
function leaRun(){const L=leaPend(),{open}=betStats();
  if(!L.length)return `<div class="lea-empty"><b>Aucun pari en attente</b><span>Tes paris arrivent ici jusqu’au résultat.</span>${open.length?`<button class="btn" data-tab="todo">${plur(open.length,"match","matchs")} à parier</button>`:""}</div>`;
  const live=L.filter(x=>!betOpen(x)),soon=L.filter(x=>betOpen(x));let h="";
  if(live.length)h+=`<div class="day">En cours<small>paris fermés</small></div><div class="list">${live.map(x=>`<div class="lea-lc">${mrow(x)}<div class="lea-lcf">${leaMyLine(x)}${leaSplitTxt(x)}</div></div>`).join("")}</div>`;
  if(soon.length)h+=`<div class="day">À venir<small>modifiable jusqu’au coup d’envoi</small></div><div class="blk lea-qbk">${soon.map(x=>leaQb(x)+leaScoreHTML(x)).join("")}</div>`;
  return h}
const leaSplitTxt=m=>{if(!lg||!leaOthers())return"";const B=members().filter(u=>u.p[m.key]),n1=B.filter(u=>u.p[m.key].w===m.t1).length;return B.length?`<small class="lea-spt">ligue : ${n1} pour ${esc(tid(m.t1))}, ${B.length-n1} pour ${esc(tid(m.t2))}</small>`:""};
function leaBilan(){const {done,good}=betStats(),p=done.length?good/done.length:0,S=leaStand(),me=S.find(u=>u.me)||{pts:0,ex:0,streak:0};
  const extra=[plur(me.pts,"point"),me.ex?plur(me.ex,"score exact","scores exacts"):"",me.streak>=2?`série de ${me.streak}`:""].filter(Boolean).join(" · ");
  let h=`<div class="blk lea-bil"><div class="lea-bilh"><span class="ring lea-ring">${ringSVG(p,92,9)}<b>${done.length?Math.round(p*100)+NB+"%":"–"}</b></span><span class="tx"><b>${good}/${done.length}</b><span>pronos gagnés</span><small>${extra}</small></span></div>
    <button class="btn" data-lea="sharepicks">Partager mes pronos</button></div>`;
  if(S.length>1){const top=S.slice(0,4);if(me.rank&&!top.includes(me))top.push(me);
    h+=`<div class="blk lea-lbk"><div class="bh">${lg?`Ligue ${esc(lg.code)}`:"Toi contre le robot"}<button class="i" data-info="leaRules" aria-label="Règles de la ligue">i</button></div><div class="lea-lb sm">${top.map(u=>leaRow(u,null,true)).join("")}</div>${lg?`<button class="btn mt0 lea-more" data-go="lg">Toute la ligue</button>`:`<button class="btn mt0 lea-more" data-go="lg">Créer une ligue avec tes potes</button>`}</div>`}
  const D=done.slice().reverse();
  if(D.length)h+=`<div class="day">Derniers résultats<small>${good} gagné${good>1?"s":""} sur ${done.length}</small></div><div class="list">${D.slice(0,5).map(mrow).join("")}</div>${D.length>5?uxFold("lea_res","Tous mes résultats",plur(D.length-5,"autre match","autres matchs"),`<div class="list" style="padding:0 10px 10px">${D.slice(5).map(mrow).join("")}</div>`):""}`;
  return h}
/* l'anneau se remplit une fois par session, quand on ouvre le bilan (moment animé 5 de v13.5) */
function leaRingMotion(){if(LEA.ring||RM||!Element.prototype.animate)return;const el=topScreen(),c=el&&el.querySelector(".lea-ring svg circle:nth-of-type(2)");if(!c)return;LEA.ring=true;
  const C=parseFloat(c.getAttribute("stroke-dasharray")),off=parseFloat(c.getAttribute("stroke-dashoffset"));if(!(C>0)||isNaN(off))return;
  c.animate([{strokeDashoffset:C},{strokeDashoffset:off}],{duration:1100,easing:LEA_EZ});const b=c.closest(".ring").querySelector("b"),m=/^(\d+)/.exec(b.textContent);if(m)leaCount(b,0,+m[1],1100,0,NB+"%")}
/* nombre qui défile (transform/opacity ailleurs ; ici seulement le texte), remis à sa valeur à la fin */
function leaCount(el,a,b,d,dl,suf=""){if(!el||RM)return;const fin=el.textContent,t0=performance.now()+dl;
  const step=t=>{if(!el.isConnected)return;const k=(t-t0)/d;if(k<0){requestAnimationFrame(step);return}if(k>=1){el.textContent=fin;return}el.textContent=Math.round(a+(b-a)*(1-Math.pow(1-k,4)))+suf;requestAnimationFrame(step)};
  el.textContent=a+suf;requestAnimationFrame(step)}
/* partager mes pronos (L-02) : texte simple, sans emoji, adresse de l'appli */
async function leaShare(){
  const L=MATCHES.filter(m=>picks[m.key]&&m.t1&&m.t2&&T[picks[m.key]]).map(m=>{const sc=scores[m.key],p=m.winner?pts(picks[m.key],sc,m):null;
    return `${T[m.t1].id} vs ${T[m.t2].id} : ${T[picks[m.key]].id}${sc?" "+sc:""}${m.winner?(p?`, gagné${p>1?" (score exact)":""}`:", perdu"):""}`});
  const {done,good}=betStats(),url=location.origin+location.pathname;
  const text=`Mes pronos Worlds 2026 (${good}/${done.length})\n`+(L.join("\n")||"Aucun prono pour l’instant");
  try{if(navigator.share){await navigator.share({title:"Mes pronos Worlds 2026",text,url});return}}catch(e){return}
  try{await navigator.clipboard.writeText(text+"\n"+url);toast("Pronos copiés")}catch(e){toast("Partage indisponible")}}

/* ===================== LIGUE (lg/<onglet>) ===================== */
function scrLeague(d){
  if(!lg)return {title:"Ligue de paris",info:"leaRules",render:leaNoLeague};
  const n=leaOthers()+1;
  return {title:`Ligue ${esc(lg.code)}<small>${plur(n,"joueur")} · ${leaSync(false)}</small>`,info:"leaRules",tabs:[["rk","Classement"],["bt","Paris"],["bg","Badges"],["set","Réglages"]],
    render:t=>{if(!lg)return"";const h=t==="bt"?leaLgBets():t==="bg"?leaBadges():t==="set"?leaSettings():leaRank();if(t==="rk")requestAnimationFrame(leaLbMotion);return h}}}
/* sans ligue : l'invitation (créer, rejoindre) et toi contre le robot */
function leaNoLeague(){const S=leaStand(),me=S.find(u=>u.me),bot=S.find(u=>u.bot);
  return `<div class="blk lea-cta"><div class="lea-ctat">Pariez entre potes</div><p class="lea-ctas">Un code à partager, et vous pariez sur tous les matchs. Classement en direct.</p>
    <ul class="lea-rules"><li><b>1</b><span>point par bon vainqueur</span></li><li><b>+1</b><span>pour le score exact en Bo3 et Bo5</span></li><li><b class="ic">${LEA_LOCK}</b><span>paris cachés jusqu’au coup d’envoi</span></li></ul>
    <div class="lea-two"><button class="btn lea-gold" data-go="lgf/create">Créer une ligue</button><button class="btn" data-go="lgf/join">J’ai un code</button></div></div>
  ${bot?`<div class="blk lea-lbk"><div class="bh">Toi contre le robot<button class="i" data-info="leaRules" aria-label="Règles">i</button></div><div class="lea-lb sm">${S.map(u=>leaRow(u,null,true)).join("")}</div><p class="lea-foot">${me.pts>bot.pts?"Tu mènes":me.pts<bot.pts?"Le robot mène":"Égalité"}, sur les matchs que tu as pariés.</p></div>`:""}
  <button class="rowb lea-mv" data-lea="move"><span class="grow"><b class="nm">Emporter mon profil</b><small>Tu changes de navigateur ou de téléphone ?</small></span><span class="chev">›</span></button>`}
/* rattrapage des retardataires : les matchs joués avant ton premier pari te rapportent les points du dernier de ceux qui
   pariaient déjà (ses points sur ces matchs, rattrapage compris). Calculé avec les paris partagés : même classement sur tous les
   téléphones. Le robot n'en reçoit pas et ne sert pas de repère. */
function leaCatchUp(all,done){
  const t=m=>Date.parse(m.start)||0,H=all.filter(u=>!u.bot);
  H.forEach(u=>{u.bonus=0;u.f0=Infinity;MATCHES.forEach(m=>{if(u.p[m.key])u.f0=Math.min(u.f0,t(m))})});
  H.slice().sort((a,b)=>a.f0-b.f0).forEach(u=>{
    const S=done.filter(m=>t(m)<u.f0);if(!S.length)return;
    const R=H.filter(r=>r!==u&&r.f0<u.f0&&S.some(m=>r.p[m.key]));if(!R.length)return;
    u.bonus=Math.min(...R.map(r=>r.bonus+S.reduce((n,m)=>n+(r.p[m.key]?(r.mp&&r.mp[m.key]?r.mp[m.key].t:pts(r.p[m.key].w,r.p[m.key].sc,m)):0),0)));
  });
  H.forEach(u=>{u.pts+=u.bonus});
}
/* une ligne du classement : rang, avatar, nom, bons paris et badges, 5 derniers résultats, points ; toucher = le membre */
function leaRow(u,bg,small){
  const pills=bg&&bg.length?leaPills(bg):"";
  return `<button class="lea-r${u.me?" me":""}${u.bot?" bot":""}" data-go="lgu/${esc(u.id)}" data-nm="${esc(u.name)}"><span class="k">${u.rank}</span>${avatar(u,small?30:34)}<span class="nm"><b>${esc(u.name)}${u.me&&u.name!=="Toi"?` <small>toi</small>`:""}</b><small>${u.n?`${u.ok}/${u.n}${u.ex||u.pk||u.jk?"":" bons"}`:u.bonus?"":"pas encore de résultat"}${u.ex?`<span class="lea-tg">${u.ex} score${u.ex>1?"s":""}</span>`:""}${u.pk?`<span class="lea-tg pk">${u.pk} poker</span>`:""}${u.jk?`<span class="lea-tg jk">${u.jk} joker${u.jk>1?"s":""}</span>`:""}${u.bonus?`${u.n?" · ":""}+${u.bonus} rattrapage`:""}${pills}</small></span>${small?"":leaDots(u.form)}<em>${u.pts}</em></button>`}
function leaPodium(S){if(S.length<2)return"";const P=[S[1],S[0],S[2]],h=[38,52,28];
  return `<div class="lea-pod">${P.map((u,i)=>u?`<button class="pod p${[2,1,3][i]}${u.me?" me":""}" data-go="lgu/${esc(u.id)}">${avatar(u,[40,50,36][i])}<b>${esc(u.me?"Toi":u.name)}</b><small class="pt">${plur(u.pts,"pt")}</small><i style="height:${h[i]}px">${u.rank}</i></button>`:`<span class="pod none"><i style="height:${h[i]}px"></i></span>`).join("")}</div>`}
function leaRank(){const S=standings(),B=safe(funBadges)||{},solo=!leaOthers();let h="";
  if(solo)h+=`<div class="blk lea-solo"><div class="bh">Ta ligue est prête</div>${leaCode()}<p class="sub">Personne d’autre pour l’instant. Tes potes ouvrent le lien, ou tapent le code dans « J’ai un code ».</p><button class="btn lea-gold mt0" data-lea="share">Inviter tes potes</button></div>`;
  else h+=`<div class="blk lea-podk">${leaPodium(S)}${lg.gage?`<p class="lea-gage">Gage du dernier : <b>${esc(lg.gage)}</b></p>`:""}</div>`;
  h+=`<div class="blk lea-lbk"><div class="lea-lb" data-code="${esc(lg.code)}">${S.map(u=>leaRow(u,B[u.id])).join("")}</div></div>`;
  if(solo&&lg.gage)h+=`<p class="lea-gage">Gage du dernier : <b>${esc(lg.gage)}</b></p>`;
  return h}
const leaCode=()=>`<div class="lea-code" aria-label="Code ${esc(lg.code)}">${[...lg.code].map(c=>`<span>${esc(c)}</span>`).join("")}</div>`;
/* le classement glisse depuis l'ordre vu la dernière fois (w26_mv_lb_<code>, même format que v13.5), points qui défilent */
function leaLbMotion(){const el=topScreen();if(!lg||!el||!el._d||el._d.v!=="lg")return;const box=el.querySelector(".lea-lb[data-code]");if(!box)return;
  const rows=[...box.querySelectorAll(".lea-r")];if(rows.length<2)return;
  const cur=rows.map(r=>{const e=r.querySelector(":scope>em");return {r,n:r.dataset.nm,e,p:e?parseInt(e.textContent,10)||0:0}});
  const key="w26_mv_lb_"+lg.code;let prev=null;try{prev=JSON.parse(localStorage.getItem(key)||"null")}catch(e){}
  const now={o:cur.map(x=>x.n),p:{}};cur.forEach(x=>now.p[x.n]=x.p);try{localStorage.setItem(key,JSON.stringify(now))}catch(e){}
  if(RM||!Element.prototype.animate||!prev||!Array.isArray(prev.o)||!prev.p)return;
  if(prev.o.join("\n")===now.o.join("\n")&&now.o.every(n=>prev.p[n]===now.p[n]))return;
  const P=rows[1].offsetTop-rows[0].offsetTop;
  cur.forEach((x,i)=>{const j=prev.o.indexOf(x.n);
    if(j<0)x.r.animate([{opacity:0,transform:"translateY(10px)"},{opacity:1,transform:"none"}],{duration:500,delay:120,easing:LEA_EZ,fill:"backwards"});
    else if(j!==i&&P>0)x.r.animate([{transform:`translateY(${(j-i)*P}px)`},{transform:"none"}],{duration:800,delay:120,easing:LEA_EZ,fill:"backwards"});
    const op=prev.p[x.n];if(op!=null&&x.p>op)leaCount(x.e,op,x.p,800,120)})}
/* qui a parié sur les prochains matchs (choix cachés jusqu'au coup d'envoi), puis les derniers résultats avec les points */
function leaMc(m,all){const hide=betOpen(m),bt=all.filter(u=>u.p[m.key]),n1=bt.filter(u=>u.p[m.key].w===m.t1).length,st=new Date(m.start);
  const when=m.state==="live"||m.state==="wait"?`<span class="lv">LIVE</span>`:m.winner?`<b class="lea-mcs">${m.s1}-${m.s2}</b>`:`<time>${fmtTime(st)}</time>`;
  const who=all.map(u=>{const b=u.p[m.key],d=u.mp&&u.mp[m.key],p=b&&m.winner&&!m.manual?(d?d.t:pts(b.w,b.sc,m)):null,jk=b&&(!hide||u.me)&&u.s&&u.s[m.key]&&u.s[m.key].j;
    return `<span class="lea-w${b?"":" no"}${u.me?" me":""}${jk?" jk":""}">${avatar(u,28)}<i>${!b?"":hide&&!u.me?`<span class="ok">${LEA_OK}</span>`:logo(b.w,16)}</i>${jk?`<b class="lea-wj">×2</b>`:""}${p==null?"":`<em class="${p?"ok":"ko"}">${p?"+"+p:"0"}</em>`}</span>`}).join("");
  const foot=hide?`${bt.length} sur ${all.length} ${bt.length>1?"ont":"a"} parié · choix révélés à la fermeture des paris`:bt.length?`${n1} pour ${esc(tid(m.t1))} · ${bt.length-n1} pour ${esc(tid(m.t2))}`:"Personne n’a parié";
  return `<button class="lea-mc" data-go="m/${esc(m.id)}"><span class="lea-mh">${when}<span class="t">${logo(m.t1,22)}<b class="${m.winner&&m.winner!==m.t1?"lo":""}">${esc(tid(m.t1))}</b></span><i>vs</i><span class="t r"><b class="${m.winner&&m.winner!==m.t2?"lo":""}">${esc(tid(m.t2))}</b>${logo(m.t2,22)}</span><span class="chev">›</span></span><span class="lea-who">${who}</span><small class="lea-mcf">${foot}</small></button>`}
function leaLgBets(){const all=standings(),up=MATCHES.filter(m=>m.t1&&m.t2&&m.state!=="done").slice(0,4),last=MATCHES.filter(m=>m.winner&&m.t1&&m.t2&&all.some(u=>!u.bot&&u.p[m.key])).slice(-3).reverse();
  let h="";
  if(up.length)h+=`<div class="day">Prochains matchs<small>${LEA_OK.replace("<svg",'<svg class="lea-ico"')} a parié</small></div><div class="list">${up.map(m=>leaMc(m,all)).join("")}</div>`;
  if(last.length)h+=`<div class="day">Derniers résultats<small>points de chacun</small></div><div class="list">${last.map(m=>leaMc(m,all)).join("")}</div>`;
  return h||`<p class="empty">Aucun match à venir pour l’instant.</p>`}
/* badges (calcul funBadges de v13.5, extrait) : pastilles, une ligne par badge, règles derrière « i » */
const leaPill=b=>`<span class="lea-pill${b.t?" t":""}">${b.lab}${b.n>1||b.id==="serie"?`<i>${b.n}</i>`:""}</span>`;
function leaPills(B){const sh=[];let used=0;for(const b of B){const n=b.lab.length+(b.n>1||b.id==="serie"?2:0);if(sh.length&&used+n>17)break;sh.push(b);used+=n;if(sh.length===2)break}
  return `<span class="lea-pills">${sh.map(leaPill).join("")}${B.length>sh.length?`<span class="lea-pill x">+${B.length-sh.length}</span>`:""}</span>`}
function leaBadgeLine(b){const d=m=>esc(leaDay(m.start)),lst=(L,f)=>(b.n>L.length?", dont ":" : ")+L.map(f).join(", ")+".",dot=s=>/[.…]$/.test(s)?s:s+".";
  if(b.id==="flair")return `${b.n>1?`${b.n} paris gagnés`:"Pari gagné"} sur l’outsider du robot`+lst(b.L.slice(0,3),o=>`${esc(leaTm(o.m.winner))} contre ${esc(leaTm(o.m.winner===o.m.t1?o.m.t2:o.m.t1))} (robot : ${leaPc(o.p)})`);
  if(b.id==="robot")return `Plus de points que le robot sur ${b.n>1?b.n+" soirées":"une soirée"}`+lst(b.L.slice(-3),e=>`${esc(leaDay(e.t))} (${e.me} à ${e.bo})`);
  if(b.id==="auda")return `${b.n>1?`${b.n} paris gagnés`:"Pari gagné"} contre l’avis de la majorité de la ligue`+lst(b.L.slice(-3),m=>`${esc(leaTm(m.winner))} contre ${esc(leaTm(m.winner===m.t1?m.t2:m.t1))} (${d(m)})`);
  if(b.id==="devin")return `Score exact trouvé ${b.n>1?b.n+" fois":"une fois"}`+lst(b.L.slice(-3),m=>`${esc(leaTm(m.t1))} – ${esc(leaTm(m.t2))} ${m.s1}-${m.s2} (${d(m)})`);
  if(b.id==="serie")return dot(`${b.n} bons paris d’affilée, ${d(b.a)===d(b.b)?"le "+d(b.a):`du ${d(b.a)} au ${d(b.b)}`}${b.cur?", série en cours":""}`);
  return""}
function leaBadges(){const B=safe(funBadges),all=members(),me=all.find(u=>u.me);
  const head=`<div class="bh">Badges de la ligue<button class="i" data-info="leaBadges" aria-label="Les cinq badges">i</button></div>`;
  if(!B)return `<div class="blk">${head}<p class="sub">Les badges arrivent quand tes potes sont dans la ligue et que les matchs sont joués.</p>${leaBadgeLegend()}</div>`;
  const L=[me,...all.filter(u=>u!==me)].filter(u=>u&&B[u.id]&&B[u.id].length),none=all.filter(u=>!B[u.id]||!B[u.id].length);
  return `<div class="blk lea-bgk">${head}${L.length?L.map(u=>`<div class="lea-bm"><button class="lea-bmh" data-go="lgu/${esc(u.id)}">${avatar(u,30)}<b>${esc(u.me?"Toi":u.name)}</b><span class="chev">›</span></button>${B[u.id].map(b=>`<p class="lea-bl">${leaPill(b)}<span>${leaBadgeLine(b)}</span></p>`).join("")}</div>`).join(""):`<p class="sub">Pas encore de badge : il faut des matchs joués.</p>`}
    ${none.length&&L.length?`<p class="lea-foot">Pas encore de badge : ${none.map(u=>esc(u.me?"toi":u.name)).join(", ")}.</p>`:""}</div>${L.length?"":`<div class="blk">${leaBadgeLegend()}</div>`}`}
const LEA_BG=[["Flair","pari gagné sur l’équipe que le robot donnait perdante",1],["Bat le robot","plus de points que lui sur une soirée",1],["Audacieux","pari gagné contre l’avis de la majorité",0],["Devin","score exact d’un Bo3 ou d’un Bo5",0],["Série","au moins 3 bons paris d’affilée",0]];
const leaBadgeLegend=()=>`<div class="lea-leg">${LEA_BG.map(x=>`<p class="lea-bl"><span class="lea-pill${x[2]?" t":""}">${x[0]}</span><span>${x[1]}</span></p>`).join("")}</div>`;
/* réglages : code, inviter, synchro, profil, quitter */
function leaSettings(){
  return `<div class="blk lea-codek"><div class="bh">Code de la ligue<button class="i" data-info="leaRules" aria-label="Règles de la ligue">i</button></div>${leaCode()}<button class="btn lea-gold" data-lea="share">Inviter des potes</button></div>
    <div class="blk lea-setk"><div class="lea-kv">${leaSync(true)}<button class="lea-mini" data-lea="sync">Synchroniser</button></div>
      <div class="lea-kv"><span>Ton prénom</span><b>${esc(lg.me.name)}</b></div>${lg.gage?`<div class="lea-kv"><span>Gage</span><b>${esc(lg.gage)}</b></div>`:""}
      <button class="lea-kv lea-mv2" data-lea="move"><span>Emporter mon profil<small>autre navigateur, autre téléphone</small></span><span class="chev">›</span></button></div>
    <button class="btn lea-quit" data-lea="quit">Quitter la ligue</button>`}
/* état de la synchro (nom de v13.5 : publish, duelConnect et pollOnce l'appellent) : seulement les pastilles, pas de rerendu */
function renderDuelOnly(){const s=leaSyncState();document.querySelectorAll(".lea-sync").forEach(x=>{const t=x.dataset.l==="1"?s[1]:s[2],c="lea-sync "+s[0];if(x.className!==c)x.className=c;if(x.lastChild&&x.lastChild.nodeValue!==t)x.lastChild.nodeValue=t})}
/* la ligue a changé (message reçu, création, départ) : accueil, écrans qui la montrent, BUS "league" */
function leaChanged(){renderHome();NAV.forEach(x=>{const v=x.d&&x.d.v;if(x.el.isConnected&&(v==="lg"||v==="bets"||v==="lgu"||v==="m"))rerender(x.el)});BUS.emit("league")}

/* ===================== UN MEMBRE (lgu/<id>) ===================== */
function scrLeaUser(d){const S=lg?standings():leaStand(),u=S.find(x=>x.id===d.id);
  if(!u)return {title:"Ligue",body:`<p class="empty">Ce joueur n’est plus dans la ligue.</p>`};
  return {title:`${esc(u.me?"Toi":u.name)}<small>${ordi(u.rank)} sur ${S.length}${lg?` · ligue ${esc(lg.code)}`:""}</small>`,info:"leaRules",render:()=>leaUser(u.id)}}
function leaUser(id){const S=lg?standings():leaStand(),u=S.find(x=>x.id===id);if(!u)return"";const B=lg?(safe(funBadges)||{})[u.id]||[]:[];
  const tile=(n,l)=>`<span class="lea-t"><b>${n}</b><small>${l}</small></span>`;
  const L=MATCHES.filter(m=>m.t1&&m.t2&&u.p[m.key]&&T[u.p[m.key].w]&&(u.me||!betOpen(m))).slice(-8).reverse(),hid=u.me?0:MATCHES.filter(m=>betOpen(m)&&u.p[m.key]).length;
  const row=m=>{const b=u.p[m.key],d=u.mp&&u.mp[m.key],p=m.winner&&!m.manual?(d?d.t:pts(b.w,b.sc,m)):null,st=new Date(m.start),jk=u.s&&u.s[m.key]&&u.s[m.key].j;
    return `<button class="rowb lea-hr" data-go="m/${esc(m.id)}"><span class="d">${esc(evDate(st).toLocaleDateString("fr-FR",{weekday:"short",day:"numeric"}))}<small>${fmtTime(st)}</small></span><span class="grow"><b class="nm">${esc(tid(m.t1))} – ${esc(tid(m.t2))}</b><small>${logo(b.w,14)} ${esc(tid(b.w))}${b.sc?" "+esc(b.sc):""}${b.robot?` <span class="lea-rbv">vote robot</span>`:""}${p==null&&jk?` <span class="lea-tg jk">joker</span>`:leaPtsTags(d)}</small></span>${p==null?`<em class="lea-st">${m.state==="soon"?"à venir":"en cours"}</em>`:`<em class="lea-st ${p?"ok":"ko"}">${p?"+"+p:"0"}</em>`}</button>`};
  return `<div class="blk lea-uh">${avatar(u,56)}<div class="lea-tiles">${tile(u.pts,plur(u.pts,"point").replace(/^\d+ /,""))}${tile(`${u.ok}<small>/${u.n}</small>`,"bons paris")}<span class="lea-t lea-tx"><span class="lea-tg">${plur(u.ex,"score exact","scores exacts")}</span><span class="lea-tg pk">${u.pk||0} poker</span><span class="lea-tg jk">${plur(u.jk||0,"joker","jokers")}</span>${u.streak>1?`<span class="lea-tg">série de ${u.streak}</span>`:""}</span></div></div>
    ${B.length?`<div class="blk"><div class="bh">Badges<button class="i" data-info="leaBadges" aria-label="Les cinq badges">i</button></div>${B.map(b=>`<p class="lea-bl">${leaPill(b)}<span>${leaBadgeLine(b)}</span></p>`).join("")}</div>`:""}
    ${u.form.length?`<div class="day">${u.me?"Tes paris":u.bot?"Ses paris":"Ses paris"}<small>${leaDots(u.form)}</small></div>`:`<div class="day">${u.me?"Tes paris":"Ses paris"}</div>`}
    ${L.length?`<div class="list">${L.map(row).join("")}</div>`:`<p class="empty">Aucun pari ${u.me?"":"révélé "}pour l’instant.</p>`}
    ${hid?`<p class="lea-foot">${plur(hid,"pari caché","paris cachés")} jusqu’à la fermeture des paris.</p>`:""}`}

/* ===================== CRÉER OU REJOINDRE (lgf/create | lgf/join) ===================== */
function scrLeaForm(d){const mode=d.id==="create"?"create":"join",pre=mode==="join"&&LEA.pre?LEA.pre:{},nm=LS.get("myname","");
  const body=`<form class="lea-form" data-leaf="${mode}" autocomplete="off">
    ${pre.n?`<div class="blk lea-inv">${avatar({id:pre.n,name:pre.n},40)}<span><b>${esc(pre.n)}</b> t’invite dans sa ligue${pre.g?`<small>Gage du dernier : ${esc(pre.g)}</small>`:""}</span></div>`:""}
    <div class="blk"><label class="lea-lab" for="leaN_${mode}">Ton prénom</label><input class="lea-in" id="leaN_${mode}" name="n" maxlength="14" placeholder="Prénom" value="${esc(nm)}" autocomplete="given-name" enterkeyhint="go">
    ${mode==="join"?(pre.code?`<span class="lea-lab">Code de la ligue</span>${`<div class="lea-code sm">${[...pre.code].map(c=>`<span>${esc(c)}</span>`).join("")}</div>`}`:`<label class="lea-lab" for="leaC">Code de la ligue</label><input class="lea-in code" id="leaC" name="c" maxlength="4" placeholder="XXXX" autocapitalize="characters" autocorrect="off" spellcheck="false" enterkeyhint="go">`)
      :`<label class="lea-lab" for="leaG">Gage du dernier <small>(facultatif)</small></label><input class="lea-in" id="leaG" name="g" maxlength="60" placeholder="Le dernier paie les pizzas" enterkeyhint="go">`}</div>
    <ul class="lea-rules sm"><li><b class="ic">${LEA_LOCK}</b><span>paris cachés jusqu’au coup d’envoi</span></li><li><b>1</b><span>point par bon vainqueur, +1 pour le score exact (Bo3, Bo5)</span></li><li><b class="ic">${LEA_OK}</b><span>tes paris déjà faits comptent</span></li></ul>
    <button class="btn lea-gold lea-go" type="submit">${mode==="create"?"Créer et inviter":"Rejoindre la ligue"}</button></form>`;
  return {title:mode==="create"?"Créer une ligue":"Rejoindre une ligue",info:"leaRules",body,skipData:()=>true}}
function leaSubmit(f){const mode=f.dataset.leaf,inp=n=>f.querySelector(`[name="${n}"]`),name=((inp("n")||{}).value||"").trim().slice(0,14);
  if(name.length<2){toast("Ton prénom (2 lettres min.)");inp("n")&&inp("n").focus();return}
  let code="";
  if(mode==="join"){const pre=LEA.pre||{};code=(pre.code||(inp("c")||{}).value||"").toUpperCase().replace(/[^A-Z0-9]/g,"");if(code.length!==4){toast("Le code fait 4 caractères");inp("c")&&inp("c").focus();return}}
  LS.set("myname",name);f.querySelectorAll("input").forEach(x=>x.blur());
  if(mode==="create"){for(let i=0;i<4;i++)code+=CODE_CH[Math.floor(Math.random()*CODE_CH.length)];
    lg={code,me:{id:rid(),name},owner:true,gage:((inp("g")||{}).value||"").trim().slice(0,60),players:{}};saveLg()}
  else{const pre=LEA.pre||{};duelStop();lg={code,me:{id:rid(),name},owner:false,gage:pre.g||"",players:{}};saveLg()}
  LEA.pre=null;duelConnect();
  const b=f.querySelector(".lea-go").getBoundingClientRect();leaBoom(b.left+b.width/2,b.top,["#C8AA6E","#F0E6D2","#0AC8B9"],60);vib([20,30,20]);
  if(mode==="create")setTimeout(shareDuel,450);else toast("Tu es dans la ligue "+code);
  const below=NAV.length>=2?NAV[NAV.length-2]:null;leaChanged();
  if(NAV.length&&NAV[NAV.length-1].d.v==="lgf"){history.back();if(!below||below.d.v!=="lg")setTimeout(()=>go("lg"),420)}}
/* ouvre le formulaire (nom de v13.5 : readDuelParams l'appelle avec l'invitation du lien ?ligue=CODE&n=…&g=…) */
function duelSheet(mode,pre){LEA.pre=mode==="join"&&pre?pre:null;const top=NAV.length?NAV[NAV.length-1].d:null;if(top&&top.v==="lgf"&&top.id===mode){const x=NAV[NAV.length-1];renderScreen(x.el,x.d);return}go("lgf/"+(mode==="create"?"create":"join"))}

/* ===================== FICHE DE MATCH : les paris de la ligue (M-06) ===================== */
/* avant le coup d'envoi : qui a parié (ton choix visible, les autres cachés) ; après : répartition, choix de chacun et points */
function leaMatchHTML(m){if(!m||!m.t1||!m.t2||!lg||!leaOthers())return"";
  const all=members(),hide=betOpen(m),bt=all.filter(u=>u.p[m.key]),n1=bt.filter(u=>u.p[m.key].w===m.t1).length,c=cpair(m.t1,m.t2);
  let h=`<div class="blk lea-mb"><div class="bh">Les paris de la ligue<button class="i" data-info="leaRules" aria-label="Règles de la ligue">i</button></div>`;
  if(hide)return h+`<div class="lea-who wide">${all.map(u=>{const b=u.p[m.key];return `<span class="lea-w${b?"":" no"}${u.me?" me":""}">${avatar(u,30)}<i>${!b?"":u.me?logo(b.w,16):`<span class="ok">${LEA_OK}</span>`}</i><small>${esc(leaNm(u))}</small></span>`}).join("")}</div><p class="lea-foot">${bt.length} sur ${all.length} ${bt.length>1?"ont":"a"} parié, choix révélés à la fermeture des paris.</p></div>`;
  if(bt.length)h+=`<div class="lea-spl"><span>${logo(m.t1,22)}<b>${n1}</b></span><span><b>${bt.length-n1}</b>${logo(m.t2,22)}</span></div><div class="split" style="margin:6px 0 4px"><i style="width:${n1/bt.length*100}%;background:${c[0]}"></i><i style="background:${c[1]}"></i></div>`;
  h+=`<div class="lea-lst">${all.map(u=>{const b=u.p[m.key],p=b&&m.winner&&!m.manual?pts(b.w,b.sc,m):null;
    return `<div class="lea-lr${u.me?" me":""}">${avatar(u,28)}<b class="nm">${esc(u.me?"Toi":u.name)}</b><span class="pk">${!b?`<small>pas parié</small>`:`${logo(b.w,18)}<b>${esc(tid(b.w))}${b.sc?" "+esc(b.sc):""}</b>${b.robot?`<small class="lea-rbv">vote robot</small>`:""}`}</span>${p==null?"":`<em class="${p?"ok":"ko"}">${p?"+"+p:"0"}</em>`}</div>`}).join("")}</div></div>`;
  return h}

/* ===================== feuilles « i » ===================== */
INFO.paris=()=>["Mes paris",`<p>Touche l’équipe que tu vois gagner : c’est parié. Touche-la encore pour annuler. Les paris restent ouverts pendant la draft et jusqu’à 2 min après le lancement de la partie 1.</p>
  <p><b>1 point</b> par bon vainqueur, <b>+1</b> pour le score exact d’un Bo3 ou d’un Bo5, <b>+1</b> pour un coup de poker, et le <b>joker</b> double tout (1 par soirée). Le détail est dans « Comment on marque ».</p>
  <p><b>Oubli</b> : le robot parie pour toi (son prono d’avant-match), marqué « vote robot ».</p>
  <p>Le petit pourcentage sur un bouton : l’équipe favorite du robot et ses chances. Le robot joue aussi : son prono figé avant chaque match.</p>
  <p>Dans une ligue, tes potes voient ton choix à la fermeture des paris, pas avant.</p>`,true];
INFO.leaRules=()=>["La ligue de paris",`<p>Un code de 4 caractères, autant de joueurs que vous voulez. Chacun publie ses paris sur un relais (ntfy.sh) : ça marche en 4G comme en Wi-Fi, sans compte. Chaque téléphone garde les derniers paris connus de chacun.</p>
  <p><b>Points</b> : voir « Comment on marque » (vainqueur, score exact, coup de poker, joker). Égalité : les scores exacts, puis les bons paris départagent. Un résultat saisi à la main ne compte pas.</p>
  <p><b>Rattrapage</b> : tu arrives en cours de route ? Les matchs joués avant ton premier pari te rapportent les points du dernier de la ligue sur ces matchs. Ensuite, tes paris comptent comme pour tout le monde.</p>
  <p><b>Fenêtre</b> : paris ouverts pendant la draft et jusqu’à 2 min après le lancement de la partie 1.</p>
  <p><b>Vote robot</b> : un match oublié après ton premier pari compte avec le prono d’avant-match du robot (vainqueur seul), marqué « vote robot ».</p>
  <p><b>Paris cachés</b> jusqu’à la fermeture : avant, tu vois seulement qui a parié.</p>
  <p><b>Le robot</b> joue sur ce téléphone seulement : son prono figé avant chaque match joué, son prono du moment sinon. Il ne compte que les matchs pariés par quelqu’un.</p>
  <p><b>Gage du dernier</b> : choisi par le créateur de la ligue.</p>`,true];
/* les points d'un match, en une table (Thomas, 27/10 : « quelque chose de logique », explication dans un i) */
INFO.leaPts=()=>["Comment on marque",`<div class="lea-ptab">
    <p><span>Bon vainqueur</span><b>1</b></p>
    <p><span>Score exact <small>Bo3, Bo5</small></span><b>+1</b></p>
    <p><span>Coup de poker <small>tu gagnes contre le favori du robot (65 % ou plus)</small></span><b>+1</b></p>
    <p class="jk"><span>Joker <small>1 par soirée, à poser avant la fermeture des paris</small></span><b>×2</b></p>
    <p class="ko"><span>Mauvais vainqueur</span><b>0</b></p></div>
  <p>On additionne, puis le joker double le tout. Un Bo5 au score exact, contre le favori, avec le joker : (1 + 1 + 1) × 2 = <b>6 points</b>. Un mauvais vainqueur rapporte 0, avec ou sans joker.</p>
  <p><b>Le joker</b> : touche « Poser le joker » sous ton prono. Un seul par soirée : le poser ailleurs le déplace, tant que les paris de son match sont ouverts. Annuler ton prono retire le joker.</p>
  <p><b>Le coup de poker</b> se décide avec le prono du robot figé au début du match. Avant, l’appli te prévient sous ton prono quand ton choix en serait un.</p>
  <p><b>Vote robot</b> (match oublié) : 1 point si le robot a vu juste, sans score exact, poker ni joker.</p>
  <p><b>Rattrapage</b> : les matchs joués avant ton premier pari rapportent les points du dernier de la ligue sur ces matchs.</p>`,true];
INFO.leaBadges=()=>["Les badges",`<p><b>Flair</b> : pari gagné sur l’équipe que le robot donnait perdante (son prono figé avant le match).</p><p><b>Bat le robot</b> : plus de points que lui sur une soirée, sur au moins 2 matchs pariés par les deux.</p><p><b>Audacieux</b> : pari gagné alors qu’au plus un tiers de la ligue avait vu juste (3 parieurs au moins).</p><p><b>Devin</b> : score exact d’un Bo3 ou d’un Bo5.</p><p><b>Série</b> : au moins 3 bons paris d’affilée, sa meilleure série.</p><p>Calculés sur ce téléphone avec les paris déjà échangés dans la ligue.</p>`,true];

/* ===================== actions ===================== */
function leaAct(a){
  if(a==="share")return shareDuel();
  if(a==="sharepicks")return leaShare();
  if(a==="move")return moveProfile();
  if(a==="sync"){toast("Synchro…");duelWake();publish(false);return}
  if(a==="quit")return showSheet("Quitter la ligue ?",`<p>Le classement sera effacé sur ce téléphone. Tes pronos restent.</p><button class="btn lea-danger" data-lea="quit-ok">Quitter la ligue</button><button class="btn" data-lea="cancel">Annuler</button>`,true);
  if(a==="cancel")return closeSheet();
  if(a==="quit-ok"){duelStop();lg=null;LS.set("league",null);LS.set("lgRank",null);closeSheet();toast("Tu as quitté la ligue");leaChanged();return}
}
onAct("[data-lea]",b=>{vib(8);leaAct(b.dataset.lea)});
/* score exact : même règle que v13.5 (fermé au coup d'envoi, toucher à nouveau retire) ; publié à la ligue */
onAct("[data-score]",so=>{const k=so.dataset.mk,sm=MATCHES.find(x=>x.key===k);
  if(!betOpen(sm)){MATCHES=finalize(MATCHES);toast("Paris fermés : la partie a commencé");onData();return}
  if(!picks[k])return;
  if(scores[k]===so.dataset.score)delete scores[k];else scores[k]=so.dataset.score;LS.set("scores",scores);duelPickChanged(k);vib(10);
  document.querySelectorAll(`[data-score][data-mk="${CSS.escape(k)}"]`).forEach(x=>x.setAttribute("aria-pressed",String(scores[k]===x.dataset.score)));
  toast(scores[k]?`Score exact : ${tid(picks[k])} ${scores[k]}`:"Score exact retiré")});

/* ===================== branchements ===================== */
defScreen("bets",{arg:"tab",screen:scrBets});
defScreen("lg",{arg:"tab",screen:scrLeague});
defScreen("lgf",{arg:"id",screen:scrLeaForm});
defScreen("lgu",{arg:"id",screen:scrLeaUser});
defWidget("bets",wBets);defWidget("league",wLeague);defWidget("livebets",wLiveBets);
/* pari posé ou retiré (setPick du socle) : publication à la ligue (600 ms), confettis aux couleurs de l'équipe,
   ligne de « Mes paris » qui s'efface, écrans de match redessinés (le score exact apparaît sous le prono) */
BUS.on("pick",(k,t,b)=>{if(!t&&LSIDE[k]){delete LSIDE[k];LS.set("side",LSIDE)}duelPickChanged(k);paintTabs();
  if(t&&b&&b.getBoundingClientRect){const r=b.getBoundingClientRect();leaBoom(r.left+r.width/2,r.top+r.height/2,[col(t),"#C8AA6E","#F0E6D2"],45)}
  const el=b&&b.closest?b.closest(".scr"):null;
  if(el&&el._d&&el._d.v==="bets"&&el._d.tab==="todo"&&t){(LEA.keep||(LEA.keep={}))[k]=Date.now()}   // la ligne reste : score exact et bonus
  if(el&&el._d&&el._d.v==="bets"){const tab=el._d.tab,row=b.closest(".qb"),gone=tab==="mine"&&!t;
    if(row&&gone&&!RM){row.animate([{opacity:1},{opacity:0,transform:"translateX(30px)"}],{duration:280,fill:"forwards"});const sc=row.nextElementSibling;if(sc&&sc.classList.contains("lea-sc"))sc.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards"})}
    setTimeout(()=>{if(el.isConnected)rerender(el);leaSegCount()},gone?300:0)}
  NAV.forEach(x=>{if(x.el.isConnected&&x.d&&(x.d.v==="m"||(x.d.v==="bets"&&x.el!==el)))rerender(x.el)})});
/* démarrage : relais de la ligue, invitation ?ligue=, profil repris, retour dans l'appli */
BUS.on("boot",()=>{
  if(lg)duelConnect();
  readDuelParams();
  if(IMPORTED)setTimeout(()=>toast(`Profil de ${IMPORTED} repris sur ce navigateur`),1500);
  document.addEventListener("visibilitychange",()=>{if(!document.hidden&&lg)duelWake()});
  document.addEventListener("submit",e=>{const f=e.target&&e.target.closest?e.target.closest("[data-leaf]"):null;if(f){e.preventDefault();leaSubmit(f)}});
});
/* après chaque synchro : prono gagné fêté une fois (w26_celebrated), toast de rang (w26_lgRank) */
function leaCelebrate(){const won=MATCHES.filter(m=>m.winner&&!m.manual&&picks[m.key]===m.winner&&!celebrated[m.key]);if(!won.length)return;
  won.forEach(m=>celebrated[m.key]=1);LS.set("celebrated",celebrated);const m=won[won.length-1];
  setTimeout(()=>{leaBoom(innerWidth/2,innerHeight*.25,[col(m.winner),"#C8AA6E","#F0E6D2","#0AC8B9"],120);toast(won.length>1?`${won.length} pronos gagnés${NB}!`:`Prono gagné : ${T[m.winner].id}${NB}!`);vib([30,40,30])},700)}
BUS.on("data",()=>{safe(leaCelebrate);if(lg)safe(checkRank)});
