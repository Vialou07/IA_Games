#!/usr/bin/env python3
"""Draft, bans et matchups de champions : publie data/draft.json pour worlds.html.

Deux entrées :
- golgg_update(C, now_iso, budget_s=60) : lit sur gol.gg les drafts (bans dans l'ordre 3|2, picks dans l'ordre
  de draft) des parties des Worlds de l'année, une page « summary » par série. Mémoire dans C["gg"], sauvée
  avec le cache du robot. 0 requête quand rien de nouveau. Association aux parties de l'API par les 10 champions.
- draft_block(C, FLAT, teams, now_iso) -> dict (None si la base est illisible : le robot garde l'ancien fichier) :
  méta des Worlds (picks, bans, présence, First Selection, côté bleu, qui a joué quoi), pool 90 jours et picks
  probables de nos 95 titulaires, bans probables contre chaque équipe, matchups champion contre champion au même
  poste (2025-2026, toutes ligues, a priori bayésien), fiabilité mesurée sur le tournoi en cours et sur 2025.

Format de draft.json (champions remplacés par leur rang dans « ch ») : voir LISEZMOI.md.
L'API LoL Esports n'a pas les bans : gol.gg est la seule source utilisée pour eux (vérifiée sur 114 parties des
Worlds 2025 et 2026 : picks et vainqueurs identiques à l'API, 10 bans distincts, fearless respecté).
Bibliothèque standard seulement. Aucune exception ne remonte.
Usage local : python draft_block.py <cache.json.gz> <flat.json.gz> <teams.json> <draft.json> [--net]"""
import json, gzip, os, re, sys, time, bisect, datetime, collections, unicodedata, urllib.request, urllib.parse

GG = "https://gol.gg/"
UA = "IA_Games-Worlds26-stats/2.0 (+https://github.com/Vialou07/IA_Games)"
SEED = os.path.join(os.path.dirname(os.path.abspath(__file__)), "draft_seed.json")
ROLES = ["TOP", "JGL", "MID", "BOT", "SUP"]
GAP = 1.6          # secondes entre deux requêtes gol.gg (robots.txt : aucun délai imposé, on reste poli)
WAIT_END = 10      # minutes après la fin d'une partie avant de chercher sa draft (gol.gg publie 10 min à 1 h 10 après)
TRIES = 12         # passages au plus pour une partie introuvable sur gol.gg, puis on abandonne
# réglages des modèles, choisis sur un tournoi et testés sur l'autre (Worlds 2025 / Worlds 2026) :
#  k : poids de la méta d'avant-tournoi dans le taux de ban ; lam : poids du pool des joueurs ; mu : bans déjà subis
#  par l'équipe ; nu : bans déjà faits par l'adversaire ; kr, eps, alpha : picks (méta du poste, pool)
P = {"k": 4, "lam": 4, "mu": 1.5, "nu": 2, "kr": 10, "eps": 0.005, "alpha": 1.0}
POOL_D, META_D = 90, 45        # jours de pool joueur, jours de méta d'avant-tournoi
MU_SINCE, MU_MIN = "2025-01-01", 3
K_WIN, K_GD = 100, 10          # a priori des matchups (Bayes empirique sur 2025-2026, voir LISEZMOI)
# fiabilité sur les Worlds 2025 (84 parties), test strict : ce code avec les réglages choisis sur les Worlds 2026
# (k=4 lam=4 mu=1.5 nu=4 kr=10 eps=0.05 alpha=0.5). Avec les réglages publiés P : b3 0,839, b5 1,93, p3 0,477, p5 0,682
# (légèrement optimiste : P a été choisi en regardant aussi 2025). work/backtest_final.py
FI_2025 = {"y": "2025", "bn": 168, "b3": 0.827, "b5": 1.85, "pn": 840, "p1": 0.176, "p3": 0.475, "p5": 0.688}
# test hors échantillon des matchups (work/backtest_final.py) : historique avant la coupure, duels joués après.
# n : duels testés ; ll : log-loss du bilan de victoires avec k = 100 (pile ou face = 0,693) ; gd : baisse de l'erreur
# quadratique sur l'écart d'or à 15 min grâce à l'estimation (k = 10), en % ; pour les écarts annoncés « nets » :
# nn duels, écart prévu pre, observé obs, champion annoncé devant à 15 min dans dev % des cas, son équipe gagne win %
MU_FI = [{"cut": "2025-09-01", "n": 16195, "ll": 0.6931, "gd": 1.5, "nn": 1586, "pre": 251, "obs": 272, "dev": 65, "win": 51},
         {"cut": "2026-03-01", "n": 11335, "ll": 0.6933, "gd": 2.2, "nn": 1599, "pre": 239, "obs": 306, "dev": 66, "win": 50},
         {"cut": "2026-06-01", "n": 6135, "ll": 0.6932, "gd": 3.6, "nn": 1173, "pre": 248, "obs": 261, "dev": 64, "win": 49}]
# conseil de bans (work/backtest_final.py) : écart de victoires d'un joueur sur un de ses 3 champions favoris (90 jours)
# contre ses autres champions, à l'intérieur de chaque joueur-saison, 2025-2026 : parties, écart en points, IC 95 % ;
# toutes ligues puis internationaux seuls
BAN_FI = {"n": 39136, "d": 0.4, "lo": -0.7, "hi": 1.5, "ni": 3849, "di": 2.5, "loi": -0.5, "hii": 5.6}

# ---------- utilitaires ----------
def norm(s):
    s = str(s or "").lower().replace("ø", "o")
    s = "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]", "", s)
AL = {"monkeyking": "wukong", "renata": "renataglasc", "nunu": "nunuwillump"}   # identifiant Data Dragon -> nom
def ck(s): n = norm(s); return AL.get(n, n)   # clé de champion commune à l'API, à Data Dragon et à gol.gg
def t19(s): return str(s or "")[:19].replace(" ", "T")
def pdt(s): return datetime.datetime.strptime(t19(s), "%Y-%m-%dT%H:%M:%S")
def shift(s, **kw): return (pdt(s) + datetime.timedelta(**kw)).strftime("%Y-%m-%dT%H:%M:%S")
def row(g, i):
    R = g.get("rows") or {}
    return R.get(i) if i in R else R.get(str(i))

# ---------- gol.gg : lecture des pages ----------
def _champs(seg):
    return [[c.strip() for c in re.findall(r"title='([^']+?) stats'", part)] for part in seg.split("|")]

def parse_summary(h):
    """Page « summary » d'une série : [{n, id, L: [équipe, gagné, bans, picks, 1er choix], R: [...]}].
    Bans dans l'ordre (3 de la 1re rotation, puis 2) ; picks dans l'ordre de draft ; 1er choix = picks groupés 1-2-2."""
    out = []
    m = re.search(r"tournament-stats/[^']*'>([^<]+)</a>", h)
    tn = m.group(1).strip() if m else ""
    md = re.search(r"(\d{4}-\d{2}-\d{2}) \(([^)]*)\)", h)
    heads = re.findall(r"<h1><a href='\.\./teams/team-stats/\d+/[^']*' title='([^']+?) stats'>", h)
    nav = sorted(set(re.findall(r"href='\.\./game/stats/(\d+)/page-game/' title='[^']*'>Game (\d+)<", h)), key=lambda x: int(x[1]))
    for i, r in enumerate(h.split("<div class='row pb-1'>")[1:]):
        cols = re.findall(r"<div class='col-4 col-sm-5 text-center'>(.*?)</div>", r, re.S)[:2]
        if len(cols) != 2: continue
        sides = []
        for j, col in enumerate(cols):
            if "Bans</span><br/>" not in col or "Picks</span><br/>" not in col: break
            bg = _champs(col.split("Bans</span><br/>")[1].split("<br/>")[0])
            pg = _champs(col.split("Picks</span><br/>")[1])
            shape = "-".join(str(len(x)) for x in pg)
            win = 1 if "text_victory'>WIN" in col else (0 if "LOSS" in col else None)
            sides.append([heads[j] if j < len(heads) else "", win, [c for g in bg for c in g], [c for g in pg for c in g],
                          1 if shape == "1-2-2" else (0 if shape == "2-2-1" else None), len(bg[0]) if bg else 0])
        if len(sides) != 2 or len(sides[0][3]) != 5 or len(sides[1][3]) != 5: continue   # partie illisible : on n'invente rien
        out.append({"n": i + 1, "id": int(nav[i][0]) if i < len(nav) else None, "L": sides[0], "R": sides[1]})
    return {"tn": tn, "d": md.group(1) if md else None, "r": md.group(2) if md else None, "g": out}

def parse_matchlist(h):
    """Page « tournament-matchlist » : [(id, sorte, score total, date)] ; sorte = summary, game (Bo1) ou preview (pas jouée)."""
    out = []
    for sid, kind, rest in re.findall(r"href='\.\./game/stats/(\d+)/page-(\w+)/'[^>]*>[^<]*</a></td>(.*?)</tr>", h, re.S):
        sc = re.search(r">\s*(\d+)\s*-\s*(\d+)\s*<", rest); d = re.search(r"(\d{4}-\d{2}-\d{2})", rest)
        out.append((sid, kind, int(sc.group(1)) + int(sc.group(2)) if sc else 0, d.group(1) if d else ""))
    return out

def _get(url, timeout=25):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", "replace")

# ---------- association aux parties de l'API ----------
def api_games(C, year):
    """Parties des Worlds de l'année dans le cache brut : clé = ensemble des 10 champions."""
    E, D, G = C.get("events") or {}, C.get("details") or {}, C.get("games") or {}
    idx, dup = {}, set()
    for mid, e in E.items():
        if e.get("l") != "worlds" or str(e.get("t", ""))[:4] != year: continue
        for g in (D.get(mid) or {}).get("g", []):
            s = G.get(g[0])
            if not s or len(s.get("p") or []) != 10: continue
            key = frozenset(ck(p[3]) for p in s["p"])
            if key in idx: dup.add(key)
            idx[key] = {"gid": g[0], "mid": mid, "bn": e.get("bn", ""), "s": s.get("s"), "min": s.get("wmin", s.get("min", 40))}
    for k in dup: idx.pop(k, None)   # deux parties avec les mêmes 10 champions : on ne devine pas
    return idx

def gg_games(gg):
    """Toutes les parties gol.gg en mémoire : clé = ensemble des 10 champions."""
    out = {}
    for sid, S in (gg.get("s") or {}).items():
        for g in (S or {}).get("g") or []:
            try:
                if len(g["L"][3]) == 5 and len(g["R"][3]) == 5 and len(g["L"][2]) <= 5 and len(g["R"][2]) <= 5:
                    out[frozenset(ck(c) for c in g["L"][3] + g["R"][3])] = (sid, S, g)
            except Exception: pass   # partie mal formée : ignorée plutôt que de tout perdre
    return out

# ---------- gol.gg : mise à jour (robot) ----------
def golgg_update(C, now_iso, budget_s=60, log=print, seed=SEED):
    """Ajoute à C["gg"] les drafts gol.gg des parties des Worlds terminées. now_iso = heure réelle (UTC).
    0 requête si toutes les parties terminées de l'API sont déjà associées ou trop récentes."""
    t0 = time.time(); nq = 0
    try:
        gg = C.setdefault("gg", {"v": 1, "s": {}, "ml": {}, "try": {}})
        for k in ("s", "ml", "try"): gg.setdefault(k, {})
        if seed and os.path.exists(seed):   # amorce : pages déjà téléchargées (Worlds 2026 avant la mise en service)
            try:
                for sid, S in json.load(open(seed, encoding="utf-8")).get("s", {}).items(): gg["s"].setdefault(sid, S)
            except Exception as e: log("  gol.gg : amorce illisible", str(e)[:80])
        now = t19(now_iso); year = now[:4]
        api = api_games(C, year); have = gg_games(gg)
        todo = {}   # tournoi gol.gg -> parties de l'API sans draft
        for key, a in api.items():
            if key in have or not a["s"]: continue
            end = shift(a["s"], minutes=float(a["min"] or 40))
            if shift(end, minutes=WAIT_END) > now: continue                 # trop tôt : gol.gg n'a rien publié
            if gg["try"].get(a["gid"], 0) >= TRIES: continue                 # abandonnée
            tn = "Worlds %s %s" % (year, "Play-In" if "play" in a["bn"].lower() else "Main Event")
            todo.setdefault(tn, []).append(a)
        if not todo: return {"req": 0, "msg": "rien de nouveau"}
        new = 0
        for tn, games in todo.items():
            slow = all(gg["try"].get(a["gid"], 0) >= 4 for a in games)   # introuvables depuis 4 passages : toutes les 3 h
            last = gg["ml"].get(tn)
            if last and shift(last, minutes=180 if slow else 25) > now: continue
            if time.time() - t0 > budget_s - 10: break
            try:
                if nq: time.sleep(GAP)
                nq += 1; rows = parse_matchlist(_get(GG + "tournament/tournament-matchlist/" + urllib.parse.quote(tn) + "/"))
            except Exception as e:
                log("  gol.gg : liste des matchs injoignable", tn, str(e)[:80]); gg["ml"][tn] = now; break
            gg["ml"][tn] = now
            for a in games: gg["try"][a["gid"]] = gg["try"].get(a["gid"], 0) + 1
            for sid, kind, tot, d in rows:
                if kind == "preview" or not tot: continue
                S = gg["s"].get(sid)
                if S and (len(S.get("g", [])) >= tot or S.get("x", 0) >= 3): continue
                if time.time() - t0 > budget_s - 5: break
                try:
                    time.sleep(GAP); nq += 1; x = parse_summary(_get(GG + "game/stats/%s/page-summary/" % sid))
                except Exception as e:
                    log("  gol.gg : série", sid, "injoignable", str(e)[:80]); break
                if not x["g"]:
                    if S is None: S = gg["s"][sid] = {"tn": tn, "d": d, "g": []}
                    S["x"] = S.get("x", 0) + 1; log("  gol.gg : série", sid, "illisible"); continue
                gg["s"][sid] = {"tn": x["tn"] or tn, "d": x["d"] or d, "r": x["r"], "t": now, "g": x["g"]}; new += 1
        have = gg_games(gg)
        for key, a in api.items():
            if key in have: gg["try"].pop(a["gid"], None)
        left = sum(1 for k in api if k not in have)
        return {"req": nq, "new": new, "left": left, "msg": "%d série(s) lue(s), %d partie(s) sans draft" % (new, left)}
    except Exception as e:
        log("  gol.gg : erreur", type(e).__name__, str(e)[:120])
        return {"req": nq, "msg": "erreur"}

# ---------- drafts reliées aux parties retenues par le robot ----------
def team_of(g, sd, teams_by):
    """Équipe d'un côté : nos identifiants (préfixe des clés joueurs, sinon code LoL Esports), sinon le code."""
    ks = (g.get("ks") or [None] * 10)[0:5] if sd == "b" else (g.get("ks") or [None] * 10)[5:10]
    c = collections.Counter(k.split("_")[0] for k in ks if k).most_common(1)
    if c and c[0][1] >= 3: return c[0][0]
    code = g.get("bc" if sd == "b" else "rc") or g.get(sd)
    return teams_by.get(norm(code), code)

def ident(g, i):
    """Identité d'un participant : notre clé joueur si c'est un de nos 95, sinon son identifiant LoL Esports."""
    ks, pid = g.get("ks") or [], g.get("pid") or []
    k = ks[i] if i < len(ks) else None
    return k if k else ("#" + str(pid[i]) if i < len(pid) and pid[i] else None)

def shown(g, i):
    """Nom affichable d'un participant : notre clé joueur, sinon son pseudo du flux sans le code d'équipe."""
    ks, nm = g.get("ks") or [], g.get("nm") or []
    if i < len(ks) and ks[i]: return ks[i]
    n = str((nm[i] if i < len(nm) else None) or "").strip()
    code = str(g.get("bc" if i < 5 else "rc") or "")
    if code and n.upper().startswith(code.upper()) and len(n) > len(code): n = n[len(code):].strip()
    return n or "?"

def records(gg, FLAT, year, teams_by):
    """Une ligne par partie des Worlds de l'année présente à la fois dans FLAT et sur gol.gg, dans l'ordre du tournoi."""
    have = gg_games(gg or {}); out = []
    for g in FLAT:
        if g.get("l") != "worlds" or str(g.get("t", ""))[:4] != year: continue
        rs = [row(g, i) for i in range(10)]
        if any(r is None for r in rs): continue
        key = frozenset(ck(r["C"]) for r in rs)
        x = have.get(key)
        if not x: continue
        sid, S, d = x
        blue = {ck(r["C"]) for r in rs[:5]}
        bc, rc = (d["L"], d["R"]) if {ck(c) for c in d["L"][3]} == blue else (d["R"], d["L"])
        fs = "b" if bc[4] == 1 else ("r" if rc[4] == 1 else None)
        out.append({"g": g, "t": t19(g["t"]), "n": g.get("n", 1), "m": g.get("m"), "B": team_of(g, "b", teams_by), "R": team_of(g, "r", teams_by),
                    "bb": [ck(c) for c in bc[2]], "br": [ck(c) for c in rc[2]], "b1b": [ck(c) for c in bc[2][:bc[5] or 3]],
                    "b1r": [ck(c) for c in rc[2][:rc[5] or 3]], "fs": fs, "p1": ck(bc[3][0] if fs == "b" else rc[3][0]) if fs else None,
                    "w": "b" if rs[0]["W"] else "r", "P": [(ident(g, i), rs[i]["role"], ck(rs[i]["C"]), rs[i]["W"]) for i in range(10)]})
    out.sort(key=lambda r: (r["t"], r["n"]))
    return out

# ---------- modèle : pools, méta d'avant-tournoi, état du tournoi ----------
class Pools:
    """Parties de chaque joueur (identité -> dates, champions, victoires) pour des fenêtres glissantes."""
    def __init__(self, FLAT):
        R = collections.defaultdict(list)
        for g in FLAT:
            t = t19(g["t"])
            for i in range(10):
                x, r = ident(g, i), row(g, i)
                if x and r: R[x].append((t, ck(r["C"]), r["W"]))
        self.R = {x: sorted(v) for x, v in R.items()}
        self.T = {x: [e[0] for e in v] for x, v in self.R.items()}
        self.memo = {}
    def get(self, x, before, days=POOL_D):
        """(champion -> parties, champion -> victoires, total) sur [before - days, before[."""
        k = (x, before, days)
        if k in self.memo: return self.memo[k]
        v, T = self.R.get(x, []), self.T.get(x, [])
        lo = bisect.bisect_left(T, shift(before[:10] + "T00:00:00", days=-days)); hi = bisect.bisect_left(T, before)
        cnt, win = collections.Counter(), collections.Counter()
        for _, c, w in v[lo:hi]: cnt[c] += 1; win[c] += w
        self.memo[k] = (cnt, win, hi - lo)
        return self.memo[k]

def premeta(FLAT, start, days=META_D):
    """Taux de pick de chaque champion (et par poste) dans toutes les ligues lues, sur les `days` jours avant `start`."""
    lo = shift(start, days=-days); cnt = collections.Counter(); byr = collections.defaultdict(collections.Counter); n = 0
    for g in FLAT:
        t = t19(g["t"])
        if not (lo <= t < start): continue
        n += 1
        for i in range(10):
            r = row(g, i)
            if r: cnt[ck(r["C"])] += 1; byr[r["role"]][ck(r["C"])] += 1
    return ({c: v / n for c, v in cnt.items()} if n else {}), ({r: {c: v / n for c, v in d.items()} for r, d in byr.items()} if n else {})

class State:
    """Ce que le tournoi a montré jusqu'ici : bans vus, bans subis et faits par équipe, picks par poste."""
    def __init__(self, mp, mpr, par=P):
        self.mp, self.mpr, self.par = mp, mpr, par
        self.sb = collections.Counter(); self.ng = 0
        self.ag = collections.defaultdict(collections.Counter); self.by = collections.defaultdict(collections.Counter)
        self.tg = collections.Counter(); self.rs = collections.defaultdict(collections.Counter); self.rn = 0
    def rate(self, c):
        k = self.par["k"]
        return (self.sb[c] + k * min(1.0, 1.6 * self.mp.get(c, 0))) / (self.ng + k)
    def add_bans(self, r):
        self.ng += 1
        for c in r["bb"] + r["br"]: self.sb[c] += 1
        for c in r["br"]: self.ag[r["B"]][c] += 1; self.by[r["R"]][c] += 1
        for c in r["bb"]: self.ag[r["R"]][c] += 1; self.by[r["B"]][c] += 1
        self.tg[r["B"]] += 1; self.tg[r["R"]] += 1
    def add_picks(self, P10, r=None):
        self.rn += 1
        for x, role, c, w in P10: self.rs[role][c] += 1
    def threat(self, lineup, pools, before):
        th = collections.Counter(); best = {}
        for x in lineup:
            cnt, win, n = pools.get(x, before)
            for c, v in cnt.items():
                th[c] += v / max(n, 1)
                if c not in best or v / n > best[c][1] / max(1, best[c][2]): best[c] = (x, v, n, win[c])
        return th, best
    def ban_base(self, team, lineup, pools, before, unavail=()):
        """Score des bans CONTRE `team` sans le terme de l'adversaire : taux de ban du tournoi × (1 + lam × pool des
        5 joueurs) + mu × bans déjà subis par l'équipe."""
        p = self.par; th, best = self.threat(lineup, pools, before)
        cands = [c for c in set(self.mp) | set(self.sb) | set(th) if c not in unavail]
        sc = {c: self.rate(c) * (1 + p["lam"] * th[c]) + p["mu"] * self.ag[team][c] / (self.tg[team] + 1) for c in cands}
        return sc, best
    def opp_term(self, opp, c):
        return self.par["nu"] * self.by[opp][c] / (self.tg[opp] + 1) if opp else 0.0
    def role_meta(self, role):
        kr = self.par["kr"]; m = self.mpr.get(role, {}); s = self.rs[role]
        return {c: (m.get(c, 0) * kr + s[c]) / (kr + self.rn) for c in set(m) | set(s)}
    def pick_rank(self, x, role, pools, before, unavail=(), rm=None):
        p = self.par; cnt, win, n = pools.get(x, before); rm = rm if rm is not None else self.role_meta(role)
        cands = {c for c in set(cnt) | {c for c, v in rm.items() if v > 0.02} if c not in unavail}
        sc = lambda c: (cnt[c] / max(1, n) + p["eps"]) * (rm.get(c, 0) + 0.01) ** p["alpha"]
        return sorted(cands, key=lambda c: (-sc(c), c)), cnt, n

def replay(recs, flat_worlds, pools, mp, mpr, par=P, opp=True, picks_on=True, state_cls=None):
    """Rejoue le tournoi partie par partie : chaque prédiction n'utilise que ce qui était connu avant la partie.
    recs : drafts gol.gg reliées ; flat_worlds : toutes les parties API du tournoi (picks connus sans gol.gg).
    Renvoie (bans : [(équipe visée, top 10, vrais bans)], picks : [(rang du champion joué ou None)])."""
    st = (state_cls or State)(mp, mpr, par); burned = collections.defaultdict(set); bans, picks = [], []
    rec_of = {r["g"]["g"]: r for r in recs}
    for g in sorted(flat_worlds, key=lambda g: (t19(g["t"]), g.get("n", 1))):
        t = t19(g["t"]); un = burned[g.get("m")]
        r = rec_of.get(g["g"])
        rs = [row(g, i) for i in range(10)]
        P10 = [(ident(g, i), rs[i]["role"], ck(rs[i]["C"]), rs[i]["W"]) for i in range(10)]
        if r:
            for X, O, lin, truth in ((r["B"], r["R"], [q[0] for q in P10[:5]], r["br"]), (r["R"], r["B"], [q[0] for q in P10[5:]], r["bb"])):
                sc, _ = st.ban_base(X, lin, pools, t, un)
                if opp: sc = {c: v + st.opp_term(O, c) for c, v in sc.items()}
                top = sorted(sc, key=lambda c: (-sc[c], c))[:10]
                bans.append((X, top, set(truth)))
        rms = {}
        for x, role, c, w in (P10 if picks_on else ()):
            if role not in rms: rms[role] = st.role_meta(role)
            top, cnt, n = st.pick_rank(x, role, pools, t, un, rms[role])
            picks.append(top.index(c) + 1 if c in top[:10] else None)
        if r: st.add_bans(r)
        st.add_picks(P10, r)
        burned[g.get("m")] |= {q[2] for q in P10}
    return bans, picks, st

def summarize_fi(bans, picks, year):
    if not bans and not picks: return {"y": year, "bn": 0, "pn": 0}
    b5 = sum(len(set(top[:5]) & tr) for _, top, tr in bans); b3 = sum(1 for _, top, tr in bans if set(top[:3]) & tr)
    pk = lambda k: round(sum(1 for r in picks if r and r <= k) / len(picks), 3) if picks else None
    return {"y": year, "bn": len(bans), "b3": round(b3 / len(bans), 3) if bans else None, "b5": round(b5 / len(bans), 2) if bans else None,
            "pn": len(picks), "p1": pk(1), "p3": pk(3), "p5": pk(5)}

# ---------- matchups champion contre champion ----------
def matchups(FLAT, since=MU_SINCE, mn=MU_MIN):
    """Paires de champions face à face au même poste : {poste: {(a, b): [parties, victoires de a, somme gd15 de a, n15]}}, a < b."""
    M = {r: collections.defaultdict(lambda: [0, 0, 0, 0]) for r in ROLES}
    for g in FLAT:
        if t19(g["t"]) < since: continue
        rs = [row(g, i) for i in range(10)]
        if any(r is None for r in rs): continue
        for r in ROLES:
            a = [x for x in rs[:5] if x["role"] == r]; b = [x for x in rs[5:] if x["role"] == r]
            if len(a) != 1 or len(b) != 1: continue
            a, b = a[0], b[0]; ca, cb = ck(a["C"]), ck(b["C"])
            if ca == cb: continue
            if cb < ca: a, b, ca, cb = b, a, cb, ca
            z = M[r][(ca, cb)]; z[0] += 1; z[1] += a["W"]
            if a["gd15"] is not None: z[2] += a["gd15"]; z[3] += 1
    return {r: {k: v for k, v in d.items() if v[0] >= mn} for r, d in M.items()}

# ---------- bloc publié ----------
def draft_block(C, FLAT, teams, now_iso, log=print):
    """Contenu de data/draft.json. now_iso : heure de référence (début du dernier match terminé, avancée jusqu'à la
    dernière partie de FLAT : rien ne bouge sans nouvelle donnée). Chaque partie est facultative : en cas d'erreur, elle
    manque et l'erreur est notée dans « err ». Renvoie None si la base même est illisible (le robot garde l'ancien fichier)."""
    err = []; out = {"v": 1}
    try:
        # le robot passe le début du dernier match terminé : on avance jusqu'à la dernière partie connue (même résultat sans nouvelle donnée)
        now = max([t19(now_iso)] + [t19(g["t"]) for g in FLAT if g.get("t")]); year = now[:4]
        teams_by = {}
        for t in teams:
            for a in [t["id"], t.get("name"), t.get("lp")] + list(t.get("al", [])): teams_by[norm(a)] = t["id"]
        names = {}   # clé -> nom affiché (Data Dragon, anglais)
        for g in FLAT:
            for i in range(10):
                r = row(g, i)
                if r: names.setdefault(ck(r["C"]), r["C"])
        gg = C.get("gg") or {}
        for sid, S, d in gg_games(gg).values():
            for c in d["L"][2] + d["L"][3] + d["R"][2] + d["R"][3]: names.setdefault(ck(c), c)
        FW = [g for g in FLAT if g.get("l") == "worlds" and str(g.get("t", ""))[:4] == year and t19(g["t"]) <= now
              and all(row(g, i) for i in range(10))]
        recs = [r for r in records(gg, FLAT, year, teams_by) if r["t"] <= now]
        start = min([t19(g["t"]) for g in FW] or [now])
        pools = Pools([g for g in FLAT if t19(g["t"]) <= now])
        mp, mpr = premeta(FLAT, start)
        out.update(y=year, asof=now, par=P)
    except Exception as e:
        log("  draft.json : base illisible, ancien fichier conservé :", type(e).__name__, str(e)[:160])
        return None
    used = set()
    def ci(c): used.add(c); return c   # remplacé par l'index à la fin
    # méta des Worlds (parties dont la draft est connue)
    try:
        st = State(mp, mpr)
        pk, wn, bn, b1, f1 = (collections.Counter() for _ in range(5))
        who = collections.defaultdict(list)   # champion -> [joueur (clé ou pseudo), équipe, victoire] dans l'ordre du tournoi
        fs = [0, 0, 0]   # parties connues, victoires de l'équipe au 1er choix, 1er choix côté rouge
        for r in recs:
            st.add_bans(r)
            for i, (x, role, c, w) in enumerate(r["P"]):
                pk[c] += 1; wn[c] += w; who[c].append([shown(r["g"], i), r["B"] if i < 5 else r["R"], w])
            for c in r["bb"] + r["br"]: bn[c] += 1
            for c in r["b1b"] + r["b1r"]: b1[c] += 1
            if r["fs"]:
                fs[0] += 1; fs[1] += r["fs"] == r["w"]; fs[2] += r["fs"] == "r"
                if r["p1"]: f1[r["p1"]] += 1
        cs = sorted(set(pk) | set(bn), key=lambda c: (-(pk[c] + bn[c]), -bn[c], c))
        out["meta"] = {"n": len(recs), "att": len(FW) - len(recs), "src": "gol.gg",
                       "tn": sorted({S.get("tn") for S in (gg.get("s") or {}).values() if S and str(S.get("tn", "")).startswith("Worlds " + year)}),
                       "maj": max([S.get("t") or "" for S in (gg.get("s") or {}).values() if S] or [""]) or None,
                       "c": [[ci(c), pk[c], wn[c], bn[c], b1[c], f1[c], round(10000 * st.rate(c)), who.get(c, [])] for c in cs],
                       "fs": fs, "bl": [len(FW), sum(1 for g in FW if row(g, 0)["W"])]}
    except Exception as e: err.append("méta : %s %s" % (type(e).__name__, str(e)[:160])); st = State(mp, mpr)
    # état complet pour les prédictions (bans de toutes les drafts connues, picks de toutes les parties API)
    try:
        for g in FW:
            st.add_picks([(ident(g, i), row(g, i)["role"], ck(row(g, i)["C"]), row(g, i)["W"]) for i in range(10)])
    except Exception as e: err.append("picks du tournoi : %s" % str(e)[:160])
    # pool 90 jours et picks probables de nos titulaires
    try:
        pool, pp = {}, {}
        rms = {r: st.role_meta(r) for r in ROLES}
        for t in teams:
            for p in t["players"]:
                cnt, win, n = pools.get(p["key"], shift(now, seconds=1))
                pool[p["key"]] = [n, sum(win.values()), [[ci(c), v, win[c]] for c, v in sorted(cnt.items(), key=lambda kv: (-kv[1], -win[kv[0]], kv[0]))[:10]]]
                top, cnt, n = st.pick_rank(p["key"], p["role"], pools, shift(now, seconds=1), (), rms.get(p["role"]))
                pp[p["key"]] = [[ci(c), cnt[c]] for c in top[:12]]
        out["pool"], out["pp"] = pool, pp
    except Exception as e: err.append("picks probables : %s %s" % (type(e).__name__, str(e)[:160]))
    # bans probables contre chaque équipe (sans le terme de l'adversaire, ajouté par l'appli) et bans faits par chacune
    try:
        pb, tb = {}, {}
        for t in teams:
            lin = [p["key"] for p in t["players"]]
            sc, best = st.ban_base(t["id"], lin, pools, shift(now, seconds=1))
            rows_ = []; order = sorted(sc, key=lambda c: (-sc[c], c))
            for c in order[:25]:
                x = best.get(c)   # joueur visé : au moins 2 parties et 8 % de ses parties sur ce champion
                tg = x if x and x[1] >= 2 and x[1] / max(1, x[2]) >= 0.08 else None
                rows_.append([ci(c), round(10000 * sc[c]), tg[0] if tg else "", tg[1] if tg else 0, tg[2] if tg else 0,
                              tg[3] if tg else 0, st.ag[t["id"]][c]])
            # au-delà des 25 premiers : score seul des champions déjà bannis à ces Worlds (seuls à pouvoir recevoir le terme adverse)
            rows_ += [[ci(c), round(10000 * sc[c])] for c in order[25:] if st.sb[c]]
            pb[t["id"]] = rows_
            tb[t["id"]] = [st.tg[t["id"]], [[ci(c), v] for c, v in st.by[t["id"]].most_common()]]
        out["pb"], out["tb"] = pb, tb
    except Exception as e: err.append("bans probables : %s %s" % (type(e).__name__, str(e)[:160]))
    # fiabilité sur le tournoi en cours (rejeu, mêmes fonctions) et celle mesurée sur les Worlds 2025
    try:
        b, p, _ = replay(recs, FW, pools, mp, mpr)
        out["fi"] = [summarize_fi(b, p, year), FI_2025]
        out["cb"] = BAN_FI
    except Exception as e: err.append("fiabilité : %s %s" % (type(e).__name__, str(e)[:160]))
    # matchups
    try:
        M = matchups([g for g in FLAT if t19(g["t"]) <= now])
        out["mu"] = {"since": MU_SINCE[:4], "min": MU_MIN, "k": [K_WIN, K_GD], "fi": MU_FI}
        for r in ROLES:
            out["mu"][r] = [[ci(a), ci(b), v[0], v[1], v[2], v[3]] for (a, b), v in sorted(M[r].items(), key=lambda kv: -kv[1][0])]
    except Exception as e: err.append("matchups : %s %s" % (type(e).__name__, str(e)[:160]))
    # index des champions : remplace les clés par leur rang dans « ch »
    try:
        ch = sorted(used, key=lambda c: norm(names.get(c, c)))
        ix = {c: i for i, c in enumerate(ch)}
        out["ch"] = [names.get(c, c) for c in ch]
        if "meta" in out:
            for x in out["meta"]["c"]: x[0] = ix[x[0]]
        for k in ("pool",):
            for v in out.get(k, {}).values():
                for x in v[2]: x[0] = ix[x[0]]
        for v in out.get("pp", {}).values():
            for x in v: x[0] = ix[x[0]]
        for v in out.get("pb", {}).values():
            for x in v: x[0] = ix[x[0]]
        for v in out.get("tb", {}).values():
            for x in v[1]: x[0] = ix[x[0]]
        for r in ROLES:
            for x in out.get("mu", {}).get(r, []): x[0] = ix[x[0]]; x[1] = ix[x[1]]
    except Exception as e:   # sans index cohérent, le fichier serait illisible pour l'appli : on garde l'ancien
        log("  draft.json : index des champions impossible, ancien fichier conservé :", type(e).__name__, str(e)[:160])
        return None
    out["err"] = err
    return out

def dump(d):
    """JSON compact, prêt à écrire (octets UTF-8)."""
    return json.dumps(d, ensure_ascii=False, separators=(",", ":")).encode("utf-8")

# ---------- essai local ----------
if __name__ == "__main__":
    cache, flat, teams_f, dst = sys.argv[1:5]
    C = json.load(gzip.open(cache, "rt", encoding="utf-8"))
    F = json.load(gzip.open(flat, "rt", encoding="utf-8"))
    TM = json.load(open(teams_f, encoding="utf-8"))
    if "--net" in sys.argv:
        print(golgg_update(C, datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")))
    else:   # sans réseau : amorce seulement
        C.setdefault("gg", {"v": 1, "s": {}, "ml": {}, "try": {}})
        if os.path.exists(SEED): C["gg"]["s"].update(json.load(open(SEED, encoding="utf-8"))["s"])
    last = max(s["s"] for s in C["games"].values() if "s" in s)
    t = time.time(); d = draft_block(C, F, TM, last); dt = time.time() - t
    b = dump(d); open(dst, "wb").write(b)
    print("draft.json : %d Ko brut, %d Ko gzip, %.1f s, erreurs %s" % (len(b) // 1024, len(gzip.compress(b)) // 1024, dt, d.get("err")))
