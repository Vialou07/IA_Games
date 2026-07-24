/* Net — mini-lib multi-téléphones basée sur PeerJS (WebRTC).
   L'hôte crée un salon (code 4 caractères), les autres s'y connectent.
   Tous les messages passent par l'hôte, qui fait autorité sur l'état du jeu. */
window.Net = (function () {
  const CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let peer = null, hostConn = null, conns = {}, cb = {}, isHost = false;

  function randCode() {
    let s = "";
    for (let i = 0; i < 4; i++) s += CHARS[Math.floor(Math.random() * CHARS.length)];
    return s;
  }
  const roomId = (game, code) => "iagames-" + game + "-" + code.toUpperCase();

  function create(game, callbacks, attempt) {
    cb = callbacks; isHost = true;
    const code = randCode();
    peer = new Peer(roomId(game, code), { debug: 0 });
    peer.on("open", () => cb.onOpen && cb.onOpen(code));
    peer.on("connection", (c) => {
      c.on("open", () => { conns[c.peer] = c; });
      c.on("data", (d) => cb.onData && cb.onData(c.peer, d));
      c.on("close", () => { delete conns[c.peer]; cb.onLeave && cb.onLeave(c.peer); });
    });
    peer.on("error", (e) => {
      if (e.type === "unavailable-id" && (attempt || 0) < 3) {
        peer.destroy(); create(game, callbacks, (attempt || 0) + 1);
      } else if (cb.onError) cb.onError(e);
    });
  }

  function join(game, code, callbacks) {
    cb = callbacks; isHost = false;
    peer = new Peer({ debug: 0 });
    peer.on("open", () => {
      hostConn = peer.connect(roomId(game, code), { reliable: true });
      let opened = false;
      hostConn.on("open", () => { opened = true; cb.onOpen && cb.onOpen(); });
      hostConn.on("data", (d) => cb.onData && cb.onData("H", d));
      hostConn.on("close", () => cb.onLeave && cb.onLeave("H"));
      setTimeout(() => { if (!opened && cb.onError) cb.onError({ type: "timeout" }); }, 9000);
    });
    peer.on("error", (e) => cb.onError && cb.onError(e));
  }

  function sendTo(id, obj) { const c = conns[id]; if (c && c.open) c.send(obj); }
  function broadcast(obj, exceptId) {
    for (const id in conns) if (id !== exceptId) sendTo(id, obj);
  }
  function send(obj) { if (hostConn && hostConn.open) hostConn.send(obj); }
  function peersCount() { return Object.keys(conns).length; }
  function destroy() { try { peer && peer.destroy(); } catch (e) {} peer = null; hostConn = null; conns = {}; }

  return { create, join, sendTo, broadcast, send, peersCount, destroy, isHost: () => isHost };
})();

/* Petites aides UI communes */
window.UI = {
  show(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
    window.scrollTo(0, 0);
  },
  banner(msg, bad, ms) {
    document.querySelectorAll(".banner").forEach((b) => b.remove());
    const b = document.createElement("div");
    b.className = "banner" + (bad ? " bad" : "");
    b.textContent = msg;
    document.body.appendChild(b);
    if (navigator.vibrate) navigator.vibrate(bad ? [80, 60, 80] : 120);
    setTimeout(() => b.remove(), ms || 4000);
  },
  esc(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; },
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  },
  normalize(s) {
    return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
  },
  fuzzyMatch(guess, target) {
    const g = UI.normalize(guess), t = UI.normalize(target);
    if (!g) return false;
    if (g === t) return true;
    const maxD = t.length >= 6 ? 2 : 1;
    if (Math.abs(g.length - t.length) > maxD) return false;
    const dp = Array.from({ length: g.length + 1 }, (_, i) => [i, ...Array(t.length).fill(0)]);
    for (let j = 0; j <= t.length; j++) dp[0][j] = j;
    for (let i = 1; i <= g.length; i++)
      for (let j = 1; j <= t.length; j++)
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (g[i - 1] === t[j - 1] ? 0 : 1));
    return dp[g.length][t.length] <= maxD;
  },
};

/* Chargement des visuels de plateau (Pokémon via PokeAPI, autres via Wikipédia FR). */
window.Roster = {
  async pokemon(gens, count){
    const ranges = THEMES.pokemonGens.filter(g => gens.includes(g.id));
    let ids = [];
    ranges.forEach(r => { for (let i = r.from; i <= r.to; i++) ids.push(i); });
    ids = UI.shuffle(ids).slice(0, count);
    const out = await Promise.all(ids.map(async id => {
      const img = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
      try {
        const r = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
        const j = await r.json();
        const fr = (j.names || []).find(n => n.language && n.language.name === "fr");
        return { name: fr ? fr.name : (j.name || ("N°" + id)), img };
      } catch (e) {
        return { name: "N° " + id, img };
      }
    }));
    return out;
  },
  async wiki(pairs, count){
    const picked = UI.shuffle(pairs.slice()).slice(0, count);
    return await Promise.all(picked.map(async ([name, title]) => {
      try {
        const r = await fetch("https://fr.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title));
        const j = await r.json();
        const src = j && j.thumbnail && j.thumbnail.source ? j.thumbnail.source : null;
        return { name, img: src };
      } catch (e) {
        return { name, img: null };
      }
    }));
  },
  ddragon(chars, count){
    return UI.shuffle(chars.slice()).slice(0, count).map(n => ({
      name: n,
      img: `https://ddragon.leagueoflegends.com/cdn/16.14.1/img/champion/${n.replace(/[^A-Za-z]/g, "")}.png`,
    }));
  },
};
