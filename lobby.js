/* Lobby générique multi-téléphones : gère accueil→choix→prénom→salon→thème.
   Le jeu fournit: {game, title, subtitle, minPlayers, onData(guest), onThemeChosen(theme, isHost), soloStart()}.
   Expose: L.players, L.myName, L.isHost, L.broadcast, L.send, L.hostThemeScreen(), etc. */
window.makeLobby = function(cfg){
  const $ = Duo.$, screen = Duo.screen, stepper = Duo.stepper;
  const state = { players:[], myName:"", theme:null, started:false, roomCode:"" };
  const api = {
    get players(){ return state.players; },
    get myName(){ return state.myName; },
    get theme(){ return state.theme; },
    set theme(v){ state.theme=v; },
    get started(){ return state.started; },
    set started(v){ state.started=v; },
    isHost:()=>Net.isHost(),
    broadcast:o=>Net.broadcast(o),
    send:o=>Net.send(o),
    sendTo:(id,o)=>Net.sendTo(id,o),
    home:sHome,
    lobby:sLobby,
    themeHost:sThemeHost,
    guestWait,
    syncLobby,
  };

  function sHome(){
    state.players=[]; state.started=false; Net.destroy();
    if (cfg.reset) cfg.reset();
    screen(`<div class="center">
      <div class="eyebrow">${cfg.playersLabel||"2 joueurs ou plus"}</div>
      <h2 class="big">${cfg.title}</h2>
      <p class="sub">${cfg.subtitle}</p>
      ${stepper(1,4)}
      <p class="sub" style="margin-bottom:10px;"><b>Vous jouez comment ?</b></p>
      <div class="choice-col">
        <button class="choice accent" id="c-net"><div class="c-title">📱📱 Chacun son téléphone</div><div class="c-sub">${cfg.netHint||"Un code à partager."}</div></button>
        <button class="choice" id="c-solo"><div class="c-title">📱 Tous sur ce téléphone</div><div class="c-sub">${cfg.soloHint||"On se passe le téléphone."}</div></button>
      </div></div>`);
    $("c-net").onclick=sNetChoice;
    $("c-solo").onclick=()=>cfg.soloStart();
  }
  function sNetChoice(){
    screen(`<div class="center">${stepper(2,4)}
      <p class="sub" style="margin-bottom:10px;"><b>Un joueur crée, les autres rejoignent.</b></p>
      <div class="choice-col">
        <button class="choice accent" id="cc"><div class="c-title">➕ Créer la partie</div><div class="c-sub">Tu obtiens un code.</div></button>
        <button class="choice" id="cj"><div class="c-title">🔑 Rejoindre</div><div class="c-sub">On t'a donné un code ?</div></button>
      </div><div class="btn-row" style="margin-top:16px;"><button class="btn ghost" id="cb">Retour</button></div></div>`);
    $("cc").onclick=()=>sName(false); $("cj").onclick=()=>sName(true); $("cb").onclick=sHome;
  }
  function sName(joining){
    screen(`<div class="center">${stepper(3,4)}
      <div class="eyebrow">${joining?"Rejoindre":"Créer la partie"}</div>
      <h2 class="big">Ton prénom ?</h2>
      <input class="field" id="fn" maxlength="14" placeholder="Prénom">
      ${joining?`<p class="sub" style="margin:4px 0 2px;">…et le code de l'hôte :</p><input class="field code" id="fc" maxlength="4" autocapitalize="characters" placeholder="XXXX">`:""}
      <div class="btn-row"><button class="btn ghost" id="fb">Retour</button><button class="btn primary" id="fg" disabled>${joining?"Rejoindre":"Créer"}</button></div></div>`);
    const ck=()=>{ const okN=$("fn").value.trim().length>=2, okC=!joining||($("fc")&&$("fc").value.length===4); $("fg").disabled=!(okN&&okC); };
    $("fn").addEventListener("input",ck);
    if(joining)$("fc").addEventListener("input",e=>{ e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,4); ck(); });
    $("fb").onclick=sNetChoice;
    $("fg").onclick=()=>{ state.myName=$("fn").value.trim(); $("fg").disabled=true; joining?doJoin($("fc").value):doCreate(); };
  }
  function doCreate(){
    Net.create(cfg.game,{
      onOpen:code=>{ state.roomCode=code; state.players=[{id:"H",name:state.myName,score:0}]; sLobby(); },
      onData:(id,d)=>{
        if(d&&d.t==="hello"){ if(state.started){Net.sendTo(id,{t:"late"});return;} state.players.push({id,name:Duo.uniqueName(state.players,d.name),score:0}); syncLobby(); if(cfg.onJoin)cfg.onJoin(id); }
        else if(cfg.onHostData) cfg.onHostData(id,d);
      },
      onLeave:id=>{ const p=state.players.find(x=>x.id===id); state.players=state.players.filter(x=>x.id!==id); if(p)UI.banner(`${p.name} s'est déconnecté.`,true); if(!state.started)syncLobby(); else if(cfg.onLeave)cfg.onLeave(id); },
      onError:()=>UI.banner("Erreur de connexion. Recharge la page.",true,6000),
    });
  }
  function sLobby(){
    screen(`<div class="center">${stepper(4,4)}
      <div class="eyebrow">Salon ouvert</div><h2 class="big">Fais rejoindre les autres</h2>
      <div class="code-box">${state.roomCode}</div>
      <p class="sub">Chacun : même lien → ${cfg.title} → <b>Chacun son téléphone</b> → <b>Rejoindre</b> → prénom + ce code.</p>
      <div class="list" id="ll"></div><div class="status" id="ls"></div>
      <div class="btn-row"><button class="btn primary" id="lg" disabled>Choisir le thème ➜</button></div></div>`);
    $("lg").onclick=sThemeHost; syncLobby();
  }
  function syncLobby(){
    Net.broadcast({t:"lobby",players:state.players.map(p=>({name:p.name,score:p.score}))});
    const l=$("ll"); if(!l)return;
    l.innerHTML=state.players.map(p=>`<div class="item${p.name===state.myName?" me":""}"><span>${UI.esc(p.name)}</span><span class="tag">${p.id==="H"?"hôte":"✓"}</span></div>`).join("");
    const st=$("ls"),b=$("lg"),min=cfg.minPlayers||2;
    if(st)st.textContent=state.players.length<min?`${state.players.length}/${min} joueurs minimum`:`${state.players.length} joueurs — prêt !`;
    if(b)b.disabled=state.players.length<min;
  }
  function doJoin(code){
    Net.join(cfg.game,code,{
      onOpen:()=>{ Net.send({t:"hello",name:state.myName}); guestWait(); },
      onData:(_,d)=>{ if(d&&d.t==="lobby"){ const l=$("ll"); if(l)l.innerHTML=d.players.map(p=>`<div class="item${p.name===state.myName?" me":""}"><span>${UI.esc(p.name)}</span><span class="tag">${p.score} pts</span></div>`).join(""); } else if(d&&d.t==="wait"){guestWait();} else if(cfg.onData)cfg.onData(d); },
      onLeave:()=>UI.banner("L'hôte s'est déconnecté — partie terminée.",true,7000),
      onError:()=>{ screen(`<div class="center"><div class="eyebrow">Oups</div><h2 class="big">Connexion impossible</h2><p class="sub">Vérifie le code et que l'hôte est sur l'écran de son salon.</p><div class="btn-row"><button class="btn primary" id="rt">Réessayer</button></div></div>`); $("rt").onclick=sNetChoice; },
    });
  }
  function guestWait(){ screen(`<div class="center">${stepper(4,4)}<div class="eyebrow">Connecté !</div><h2 class="big">Bien reçu, ${UI.esc(state.myName)}</h2><div class="list" id="ll"></div><p class="sub">En attente que l'hôte lance…</p></div>`); }
  function sThemeHost(){
    screen(`<div class="center"><div class="eyebrow">Thème</div><h2 class="big">Choisis le thème</h2><p class="sub">${cfg.themeHint||"Tiré au hasard."}</p>${Duo.themeGrid()}<div class="btn-row" style="margin-top:16px;"><button class="btn ghost" id="tb">Retour au salon</button></div></div>`);
    document.querySelectorAll(".theme-btn").forEach(b=>b.onclick=()=>{ state.theme=b.dataset.th; state.started=true; cfg.onThemeChosen(state.theme,true); });
    $("tb").onclick=sLobby;
  }
  return api;
};

/* Sélecteur de thème simple pour le mode solo (pas de réseau). */
window.soloTheme = function(onPick, backFn){
  const $ = Duo.$, screen = Duo.screen, stepper = Duo.stepper;
  screen(`<div class="center">${stepper(3,4)}<div class="eyebrow">Thème</div><h2 class="big">Choisissez le thème</h2>${Duo.themeGrid()}<div class="btn-row" style="margin-top:16px;"><button class="btn ghost" id="stb">Retour</button></div></div>`);
  document.querySelectorAll(".theme-btn").forEach(b=>b.onclick=()=>onPick(b.dataset.th));
  $("stb").onclick=backFn;
};
