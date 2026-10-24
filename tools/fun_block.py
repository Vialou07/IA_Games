"""Clé « fu » de stats.json : records d'une partie (Worlds 2026, et année 2026 parmi les joueurs des Worlds) pour « records en vue »
pendant le direct, et feuilles compactes des parties des dernières soirées des Worlds pour le « podium de la soirée ».

fun_block(FLAT, teams, C=None, log=None) -> dict ou None
- FLAT  : parties à plat remplies par build() (rows indexés par entiers dans le robot, par chaînes si relus d'un JSON) ;
- teams : data/teams.json (nos 19 équipes, 95 titulaires) ;
- C     : mémoire du robot (C["games"][gid] : fin = flux complet, tv = temps de jeu mesuré). Sans elle : aucun record publié
          (on ne publie jamais au jugé), les feuilles restent publiées ;
- log   : journal du robot (facultatif).
Ne lève jamais d'exception : None en cas de panne (l'appli n'affiche alors ni records ni podium venant du robot).

Sortie (JSON compact, ~5 à 12 Ko) :
  v : 1
  r : records, {id: [valeur, joueur, équipe, adversaire, champion, ligue, date ISO, k, d, a, partie]}
      id = portée « . » nature. Portées : w = Worlds 2026 (toutes les parties du tournoi au flux complet) ;
      y = année 2026, parmi les joueurs des Worlds (nos 95 titulaires) dans les compétitions suivies.
      Natures (une partie) : k kills, a assists, csm CS par minute (temps de jeu mesuré, au moins 20 min), ds part des dégâts
      de l'équipe (0-1), court partie la plus courte (minutes ; joueur None, équipe = vainqueur ; temps mesuré), sang partie la plus
      sanglante (kills des 10 joueurs ; joueur None, équipe = bleue, adversaire = rouge, k = kills bleus, d = kills rouges).
      joueur = clé de titulaire (« HLE_zeka »), sinon pseudo. Égalité : la plus ancienne garde le record (comme un vrai record).
  n : échantillons {w: parties des Worlds 2026 retenues, y: lignes joueur-partie de 2026 retenues}
  g : parties des Worlds des deux dernières soirées (match commencé au plus 36 h avant le dernier match joué) :
      {gid: [match, manche, date ISO du match, équipe bleue, équipe rouge, côté vainqueur 0/1, minutes, temps mesuré 0/1,
             [[joueur, poste, champion, k, d, a, cs, part des dégâts en ‰ ou None, écart d'or à 15 min ou None] × 10]]}
Garde-fous (repris de facts_block, vérifiés sur gol.gg) : flux complet pour tout record de joueur ; KeSPA Cup : seulement si l'équipe
principale a joué (au moins 3 titulaires) ; « de l'année » ne vaut que parmi les joueurs des Worlds dans les compétitions suivies (l'appli
l'écrit ainsi). Usage hors robot : python -X utf8 fun_block.py flat.json.gz teams.json cache.json.gz"""
import collections, datetime, gzip, json, re, sys, time

YEAR = "2026"
CSM_MIN = 20.0          # CS par minute : parties d'au moins 20 min de jeu mesuré
EVE_H = 36              # feuilles publiées : matchs commencés au plus 36 h avant le dernier match des Worlds joué


def _rows(f):
    R = f.get("rows") or {}
    out = [R.get(i, R.get(str(i))) for i in range(10)]
    return out if all(r is not None for r in out) else None

def _pseudo(nm):
    nm = nm or "?"
    return re.sub(r"^\S+\s+", "", nm) if " " in nm else nm

def fun_block(FLAT, teams, C=None, log=None):
    t0 = time.time()
    say = log if callable(log) else (lambda *a: None)
    try:
        G = (C or {}).get("games") or {}
        key_team = {p["key"]: t["id"] for t in teams for p in t["players"]}
        roster = ((C or {}).get("roster") or {}).get("teams") or {}
        FL = sorted((f for f in FLAT if f.get("t") and f.get("g") and f["t"][:4] == YEAR), key=lambda f: (f["t"], f.get("n", 1)))

        def side_team(f, sd):   # notre équipe de ce côté (au moins 3 titulaires), sinon l'identifiant connu, sinon le code
            ks = (f.get("ks") or [None] * 10)[5 * sd:5 * sd + 5]
            c = collections.Counter(key_team[k] for k in ks if k in key_team).most_common(1)
            if c and c[0][1] >= 3: return c[0][0], True
            return roster.get(f["r" if sd else "b"]) or f.get("rc" if sd else "bc") or "?", False

        rec, n_w, n_y = {}, 0, 0
        def put(rid, val, row):   # strictement mieux : à égalité, le premier (le plus ancien) garde le record
            if val is None: return
            if rid not in rec or val > rec[rid][0] + 1e-9: rec[rid] = [val] + row
        def put_min(rid, val, row):
            if val is None: return
            if rid not in rec or val < rec[rid][0] - 1e-9: rec[rid] = [val] + row

        G_out, last_w = {}, max((f["t"] for f in FL if f["l"] == "worlds"), default=None)
        cut = None
        if last_w:
            cut = (datetime.datetime.fromisoformat(last_w.replace("Z", "+00:00")) - datetime.timedelta(hours=EVE_H)).strftime("%Y-%m-%dT%H:%M:%SZ")

        for f in FL:
            R = _rows(f)
            if not R: continue
            s = G.get(f["g"]) or {}
            fin = s.get("fin") is True                       # flux complet (état « finished »)
            tv = bool(s.get("tv"))                           # temps de jeu mesuré, pauses retirées
            mins = f.get("min") or 0
            ws = 0 if f.get("w") == f.get("b") else 1 if f.get("w") == f.get("r") else None
            if ws is None: continue
            T = [side_team(f, 0), side_team(f, 1)]
            ks = f.get("ks") or [None] * 10; nm = f.get("nm") or [None] * 10
            who = lambda i: ks[i] if ks[i] in key_team else _pseudo(nm[i])
            kills = [sum(r["k"] for r in R[:5]), sum(r["k"] for r in R[5:])]
            worlds = f["l"] == "worlds"
            # feuilles des dernières soirées (podium) : flux complet ou non, l'appli affiche ce qui est publié
            if worlds and cut and f["t"] >= cut:
                G_out[f["g"]] = [f.get("m"), f.get("n") or 1, f["t"], T[0][0], T[1][0], ws, round(mins, 2), 1 if tv else 0,
                                 [[who(i), r.get("role"), r.get("C"), r["k"], r["d"], r["a"], r.get("cs") or 0,
                                   None if r.get("ds") is None else round(r["ds"] * 1000), r.get("gd15")] for i, r in enumerate(R)]]
            if not fin or not C: continue
            if worlds: n_w += 1
            for i, r in enumerate(R):
                sd = 0 if i < 5 else 1
                row = [who(i), T[sd][0], T[1 - sd][0], r.get("C"), f["l"], f["t"], r["k"], r["d"], r["a"], f["g"]]
                csm = (r.get("cs") or 0) / mins if tv and mins >= CSM_MIN else None
                scopes = []
                if worlds: scopes.append("w")
                # année : nos 95 titulaires ; KeSPA Cup seulement avec l'équipe principale (sinon c'est l'académie)
                if ks[i] in key_team and (f["l"] != "kespa_cup" or T[sd][1]):
                    scopes.append("y"); n_y += 1
                for sc in scopes:
                    put(sc + ".k", r["k"], row); put(sc + ".a", r["a"], row); put(sc + ".csm", None if csm is None else round(csm, 3), row)
                    put(sc + ".ds", r.get("ds"), row)
            if worlds:
                gw, gl = T[ws][0], T[1 - ws][0]
                if tv: put_min("w.court", round(mins, 2), [None, gw, gl, None, f["l"], f["t"], kills[ws], kills[1 - ws], None, f["g"]])
                put("w.sang", kills[0] + kills[1], [None, T[0][0], T[1][0], None, f["l"], f["t"], kills[0], kills[1], None, f["g"]])
        out = {"v": 1, "r": rec, "n": {"w": n_w, "y": n_y}, "g": G_out}
        say("records et soirées : %d records (%d parties des Worlds, %d lignes de l'année), %d feuilles, %.1f s" % (len(rec), n_w, n_y, len(G_out), time.time() - t0))
        return out
    except Exception as e:
        say("records indisponibles : %s %s" % (type(e).__name__, str(e)[:160]))
        return None


if __name__ == "__main__":
    a = sys.argv[1:]
    if len(a) < 2: print(__doc__); sys.exit(1)
    op = lambda p: gzip.open(p, "rt", encoding="utf-8") if p.endswith(".gz") else open(p, encoding="utf-8")
    FLAT = json.load(op(a[0])); teams = json.load(op(a[1])); C = json.load(op(a[2])) if len(a) > 2 else None
    o = fun_block(FLAT, teams, C, log=print)
    s = json.dumps(o, ensure_ascii=False, separators=(",", ":"))
    print(len(s.encode("utf-8")), "octets")
    for k, v in sorted((o or {}).get("r", {}).items()): print(k, v)
    if len(a) > 3: open(a[3], "w", encoding="utf-8").write(s)
