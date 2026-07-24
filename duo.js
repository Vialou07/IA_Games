/* Moteur commun aux jeux "duo" à manches : lobby WebRTC OU solo 1 tel, choix de thème,
   puis le jeu fournit des callbacks. Simplifie l'écriture de chaque nouveau jeu. */
window.Duo = (function(){
  const META = THEMES.meta;
  const wrap = document.getElementById("wrap");
  const $ = id => document.getElementById(id);
  function screen(html){ wrap.innerHTML = `<div class="screen active">${html}</div>`; window.scrollTo(0,0); }
  function stepper(n,t){ return `<div class="step-label">Étape ${n} sur ${t}</div>
    <div class="stepper">${Array.from({length:t},(_,i)=>`<div class="dot${i<n?" on":""}"></div>`).join("")}</div>`; }
  function themeGrid(){ return `<div class="theme-grid">${Object.keys(META).map(k =>
    `<button class="theme-btn" data-th="${k}"><span class="t-emoji">${META[k].emoji}</span>${META[k].label}</button>`).join("")}</div>`; }

  return { screen, stepper, themeGrid, $, META,
    uniqueName(players, n){
      let base=(n||"Joueur").trim(), name=base, i=2;
      while (players.some(p=>p.name===name)) name=base+" "+(i++);
      return name;
    },
    scoresHtml(list){ return list.slice().sort((a,b)=>b.score-a.score)
      .map((p,i)=>`<div class="row${i===0&&p.score>0?" top":""}"><span>${UI.esc(p.name)}</span><span class="pts">${p.score} pt${p.score>1?"s":""}</span></div>`).join(""); },
  };
})();
