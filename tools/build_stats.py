#!/usr/bin/env python3
"""Construit data/stats.json pour worlds.html depuis l'API officielle LoL Esports.

Plus de Leaguepedia (limité à une requête par minute, bloqué sur les téléphones) :
- planning de chaque ligue (getSchedule) et détails des matchs terminés (getEventDetails) ;
- flux de stats de chaque partie (feed.lolesports.com) : début, 15e minute, fin, et détails de fin
  (part des dégâts, participation aux kills, balises).
L'API ne dit pas qui a gagné chaque partie : on le déduit de l'état final (seule l'équipe qui a détruit
un inhibiteur peut finir) sous la contrainte du score de la série (la dernière manche revient au vainqueur).

Mémoire du robot : data/cache.json.gz, publiée avec stats.json sur la branche stats. Chaque passage ne
télécharge que les nouvelles parties, de la plus récente à la plus ancienne (2026, puis 2025 et 2024).
Usage local : python3 tools/build_stats.py   (STATS_MAX_MIN = budget en minutes)"""
import json, gzip, time, re, os, sys, unicodedata, urllib.request, urllib.parse, urllib.error, datetime, itertools, threading
import concurrent.futures as cf

GW = "https://esports-api.lolesports.com/persisted/gw/"
FEED = "https://feed.lolesports.com/livestats/v1/"
KEY = "0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z"   # clé publique du site lolesports.com
UA = "IA_Games-Worlds26-stats/2.0 (+https://github.com/Vialou07/IA_Games)"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "data", "stats.json")
CACHE = os.path.join(ROOT, "data", "cache.json.gz")
MAX_MIN = float(os.environ.get("STATS_MAX_MIN", "40"))
T0 = time.time(); DEADLINE = T0 + MAX_MIN * 60
SINCE = "2024-01-01"; YEAR = "2026"
# ligues où jouent (ou ont joué depuis 2024) les 95 titulaires
SLUGS = ["worlds", "msi", "first_stand", "americas_cup", "lck", "lpl", "lec", "lcs", "cblol-brazil", "lcp",
         "lta_n", "lta_s", "lta_cross", "pcs", "vcs"]
INTL = {"worlds": "Season World Championship", "msi": "Mid-Season Invitational", "first_stand": "First Stand", "americas_cup": "Americas Cup"}
ROLE = {"top": "TOP", "jungle": "JGL", "mid": "MID", "bottom": "BOT", "support": "SUP"}
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)

def norm(s):
    s = str(s or "").lower().replace("ø", "o")
    s = "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]", "", s)
def ts(s): return datetime.datetime.fromisoformat(s.replace("Z", "+00:00"))
def iso10(t): return t.strftime("%Y-%m-%dT%H:%M:") + "%02d.000Z" % (t.second // 10 * 10)
def lpdt(s): return s[:19].replace("T", " ")   # format de date attendu par l'appli : "2026-10-23 17:00:00"
class Budget(Exception): pass

NQ = [0]; _lock = threading.Lock()
def fetch(url, key=False):
    last = None
    for a in range(10):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, **({"x-api-key": KEY} if key else {})})
            with _lock: NQ[0] += 1
            with urllib.request.urlopen(req, timeout=30) as r:
                return None if r.status == 204 else json.load(r)
        except urllib.error.HTTPError as e:
            if e.code in (400, 403, 404): return None   # fenêtre hors partie, ou pas de flux pour ce match
            last = e
        except Exception as e:
            last = e
        time.sleep(min(4, 0.5 * 2 ** a))
    raise RuntimeError("%s : %s" % (url[:100], last))
def gw(path, **p):
    j = fetch(GW + path + "?" + urllib.parse.urlencode({"hl": "en-US", **p}), key=True)
    return (j or {}).get("data")
def feed(path): return fetch(FEED + path)
def budget():
    if time.time() > DEADLINE: raise Budget()

# ---------- collecte ----------
def refresh_leagues(C):
    if C.get("leagues_t", "") >= time.strftime("%Y-%m-%d") and C.get("leagues"): return
    C["leagues"] = {l["slug"]: l["id"] for l in gw("getLeagues")["leagues"] if l["slug"] in SLUGS}
    C["leagues_t"] = time.strftime("%Y-%m-%d")

def refresh_schedules(C):
    E, done = C["events"], C.setdefault("sched_done", {})
    for slug in SLUGS:
        lid = C["leagues"].get(slug)
        if not lid: continue
        tok, page = None, 0
        while True:
            budget()
            try: s = gw("getSchedule", leagueId=lid, **({"pageToken": tok} if tok else {}))["schedule"]; page += 1
            except Exception as e:   # coupure : on garde ce qu'on a, la suite au prochain passage
                log("  planning", slug, "page", page + 1, str(e)[-80:]); break
            for e in s["events"]:
                m = e.get("match")
                if e.get("type", "match") != "match" or not m or e["startTime"] < SINCE: continue
                E[m["id"]] = {"t": e["startTime"], "st": e["state"], "l": slug, "bn": e.get("blockName") or "", "bo": (m.get("strategy") or {}).get("count", 1),
                              "tm": [[t.get("code"), t.get("name"), (t.get("result") or {}).get("gameWins")] for t in m.get("teams", [])]}
            tok = s["pages"].get("older")
            if not tok or (s["events"] and s["events"][0]["startTime"] < SINCE):
                done[slug] = True; break   # historique complet jusqu'à SINCE
            # déjà rempli : la page courante et la précédente suffisent pour voir les nouveaux résultats
            if done.get(slug) and page >= 2: break

def fetch_details(C, mids):
    def one(mid):
        if time.time() > DEADLINE: return mid, None
        try: ev = (gw("getEventDetails", id=mid) or {}).get("event")
        except Exception as e: log("  détails", mid, str(e)[-80:]); return mid, None
        if not ev: return mid, None
        m = ev["match"]
        return mid, {"tm": [[t["id"], t.get("code"), t.get("name"), (t.get("result") or {}).get("gameWins")] for t in m["teams"]],
                     "g": [[g["id"], g["number"], g["state"], next((t["id"] for t in g.get("teams", []) if t.get("side") == "blue"), None)] for g in m["games"]]}
    with cf.ThreadPoolExecutor(8) as ex:
        for mid, d in ex.map(one, mids):
            if d: C["details"][mid] = d

def summarize(gid, want_details):
    w0 = feed("window/" + gid)
    if not w0 or not w0.get("frames"): return {"x": 1}
    md = w0["gameMetadata"]
    fr = [f for f in w0["frames"] if f["blueTeam"]["totalGold"] > 0] or w0["frames"]
    start = ts(fr[0]["rfc460Timestamp"])
    we = feed("window/" + gid + "?startingTime=" + iso10(start + datetime.timedelta(hours=6)))
    if not we or not we.get("frames"): return {"x": 1}
    fe = we["frames"][-1]; end = ts(fe["rfc460Timestamp"])
    w15 = feed("window/" + gid + "?startingTime=" + iso10(start + datetime.timedelta(minutes=15))) if (end - start).total_seconds() > 16 * 60 else None
    f15 = w15["frames"][0] if w15 and w15.get("frames") else None
    det = feed("details/" + gid + "?startingTime=" + iso10(start + datetime.timedelta(hours=6))) if want_details else None
    dp = {p["participantId"]: p for p in (det["frames"][-1]["participants"] if det and det.get("frames") else [])}
    p15 = {p["participantId"]: p for p in ([*f15["blueTeam"]["participants"], *f15["redTeam"]["participants"]] if f15 else [])}
    def team(t, mt):
        return [mt["esportsTeamId"], t["totalKills"], t["totalGold"], t["towers"], t["inhibitors"], t["barons"], len(t["dragons"])]
    P = []
    for side in ("blue", "red"):
        mt, ft = md[side + "TeamMetadata"], fe[side + "Team"]
        for pm, pp in zip(mt["participantMetadata"], ft["participants"]):
            i = pm["participantId"]; d = dp.get(i, {}); q = p15.get(i)
            P.append([pm.get("esportsPlayerId"), pm.get("summonerName"), ROLE.get(pm.get("role"), pm.get("role")), pm.get("championId"),
                      pp["kills"], pp["deaths"], pp["assists"], pp["creepScore"], pp["totalGold"],
                      q["totalGold"] if q else None, q["creepScore"] if q else None,
                      round(d["championDamageShare"], 4) if "championDamageShare" in d else None, d.get("wardsPlaced"), d.get("wardsDestroyed")])
    return {"s": iso10(start)[:19], "fin": fe["gameState"] == "finished", "min": round((end - start).total_seconds() / 60, 2),
            "b": team(fe["blueTeam"], md["blueTeamMetadata"]), "r": team(fe["redTeam"], md["redTeamMetadata"]), "p": P}

def fetch_games(C, todo, ours):
    def one(item):
        gid, year, teams = item
        if time.time() > DEADLINE: return gid, None
        try: return gid, summarize(gid, year >= YEAR and bool(teams & ours))
        except Exception as e:
            log("  partie", gid, str(e)[:120]); return gid, None
    n = 0
    with cf.ThreadPoolExecutor(8) as ex:
        for gid, s in ex.map(one, todo):
            if s is None: continue
            if "x" in s: s["x"] = C["games"].get(gid, {}).get("x", 0) + 1; s["at"] = time.strftime("%Y-%m-%d")
            C["games"][gid] = s; n += 1
            if n % 250 == 0: log("  %d parties résumées (%d requêtes, %d s)" % (n, NQ[0], time.time() - T0))
    return n

# ---------- vainqueur de chaque partie ----------
def lean(s):
    """> 0 si le bleu a gagné, d'après l'état final. Sans inhibiteur détruit, pas de nexus possible."""
    b, r = s["b"], s["r"]
    v = (3 if b[4] > 0 else -3) if (b[4] > 0) != (r[4] > 0) else 0
    return v + 0.3 * (b[3] - r[3]) + (b[2] - r[2]) / 5000

def winners(C, mid):
    d = C["details"][mid]; wins = {t[0]: t[3] or 0 for t in d["tm"]}; ids = list(wins)
    total = sum(wins.values())
    games = sorted([g for g in d["g"] if g[2] == "completed"], key=lambda g: g[1])[:total]
    if len(ids) != 2 or not games: return {}
    sw = max(ids, key=lambda t: wins[t])
    lean_of = []
    for g in games:
        s = C["games"].get(g[0])
        blue = s["b"][0] if s and "b" in s else g[3]
        lean_of.append((blue, lean(s) if s and "b" in s else 0.0))
    best, bscore = None, None
    for combo in itertools.product(ids, repeat=len(games)):
        if any(combo.count(t) != wins[t] for t in ids) or combo[-1] != sw: continue
        sc = sum((l if w == blue else -l) for w, (blue, l) in zip(combo, lean_of))
        if bscore is None or sc > bscore: best, bscore = combo, sc
    if best is None:   # score de série incohérent avec les parties : l'état final seul
        best = [blue if l >= 0 else next(t for t in ids if t != blue) for blue, l in lean_of]
    return {g[0]: w for g, w in zip(games, best)}

# ---------- agrégats ----------
def agg(rows):
    A = {"g": 0, "w": 0, "k": 0, "d": 0, "a": 0, "cs": 0, "gold": 0, "min": 0, "tk": 0, "dmg": 0, "vs": 0,
         "dsn": 0, "ds": 0, "wp": 0, "wk": 0, "wn": 0, "n15": 0, "gd15": 0, "csd15": 0}
    ch = {}
    for r in rows:
        A["g"] += 1; A["w"] += r["W"]
        for a in ("k", "d", "a", "cs", "gold", "min", "tk"): A[a] += r[a]
        if r["ds"] is not None: A["dsn"] += 1; A["ds"] += r["ds"]
        if r["wp"] is not None: A["wn"] += 1; A["wp"] += r["wp"]; A["wk"] += r["wk"] or 0
        if r["gd15"] is not None: A["n15"] += 1; A["gd15"] += r["gd15"]; A["csd15"] += r["csd15"]
        c = ch.setdefault(r["C"], {"g": 0, "w": 0, "k": 0, "d": 0, "a": 0}); c["g"] += 1; c["w"] += r["W"]
        c["k"] += r["k"]; c["d"] += r["d"]; c["a"] += r["a"]
    for k in ("min", "ds"): A[k] = round(A[k], 3)
    A["champs"] = [dict(c=c, **v) for c, v in sorted(ch.items(), key=lambda kv: (-kv[1]["g"], -kv[1]["w"]))[:8]]
    A["pool"] = len(ch)
    return A

def opname(slug, league_names, t):
    y = t[:4]
    return "%s %s" % (y, INTL[slug]) if slug in INTL else "%s %s" % (league_names.get(slug, slug.upper()), y)

def ensure_roster(C, teams):
    """Identifiants LoL Esports de nos 19 équipes et 95 joueurs, logos, vrais noms et photos (getTeams, une fois par jour)."""
    if C.get("roster_t", "") >= time.strftime("%Y-%m-%d") and C.get("roster"): return
    al = {t["id"]: set(t["al"]) | {norm(t["id"]), norm(t["name"]), norm(t["lp"])} for t in teams}
    LT = gw("getTeams")["teams"]; R = {"teams": {}, "players": {}, "logos": {}, "pinfo": {}}
    for t in teams:
        # homonymes (LYON / Lyon Academy / Lynch Esports « LY ») : équipe active de la bonne ligue d'abord
        cands = [x for x in LT if norm(x.get("code")) in al[t["id"]] or norm(x.get("name")) in al[t["id"]]]
        cands.sort(key=lambda x: (x.get("status") != "active", norm((x.get("homeLeague") or {}).get("name")) != norm(t["league"]), not x.get("players")))
        if not cands: log("  équipe introuvable chez LoL Esports :", t["id"]); continue
        x = cands[0]; R["teams"][x["id"]] = t["id"]; R["logos"][t["id"]] = x.get("image")
        for p in t["players"]:
            q = next((q for q in x.get("players", []) if norm(q.get("summonerName")) == norm(p["id"])), None)
            if not q: log("  joueur introuvable chez LoL Esports :", p["key"]); continue
            R["players"][q["id"]] = p["key"]
            R["pinfo"][p["key"]] = {"rn": " ".join(filter(None, [(q.get("firstName") or "").strip(), (q.get("lastName") or "").strip()])), "img": q.get("image")}
    C["roster"], C["roster_t"] = R, time.strftime("%Y-%m-%d")

def build(C, teams):
    E, D, G = C["events"], C["details"], C["games"]
    R = C["roster"]; our_team = R["teams"]; our_pl = R["players"]
    key_of = {p["key"]: p for t in teams for p in t["players"]}
    team_of_key = {p["key"]: t["id"] for t in teams for p in t["players"]}
    LN = {"lck": "LCK", "lpl": "LPL", "lec": "LEC", "lcs": "LCS", "cblol-brazil": "CBLOL", "lcp": "LCP", "lta_n": "LTA North", "lta_s": "LTA South", "lta_cross": "LTA", "pcs": "PCS", "vcs": "VCS"}
    # noms des champions (Data Dragon)
    try:
        v = fetch("https://ddragon.leagueoflegends.com/api/versions.json")[0]
        CN = {c["id"]: c["name"] for c in fetch("https://ddragon.leagueoflegends.com/cdn/%s/data/en_US/champion.json" % v)["data"].values()}
    except Exception: CN = {}
    cname = lambda c: CN.get(c, c)

    # matchs terminés, du plus récent au plus ancien
    matches = sorted([(E[m]["t"], m) for m in D if m in E and E[m]["st"] == "completed"], reverse=True)
    W = {}
    for _, mid in matches: W.update(winners(C, mid))

    # lignes par joueur (nos 95), par partie
    prow = {}   # clé joueur -> [lignes]
    duels, champs, mastery, tour = {}, {}, {}, {"games": [], "rows": []}
    tg = {t["id"]: [] for t in teams}   # parties 2026 par équipe
    cover = {}
    for t_, mid in matches:
        e, d = E[mid], D[mid]; op = opname(e["l"], LN, t_)
        for g in d["g"]:
            s = G.get(g[0]); wid = W.get(g[0])
            if not s or "p" not in s or not wid: continue
            year = t_[:4]; cover[year] = cover.get(year, 0) + 1
            if not s["fin"]: continue   # flux coupé avant la fin : chiffres incomplets
            sides = {"b": s["b"], "r": s["r"]}; P = s["p"]
            rows = {}
            for i, pp in enumerate(P):
                sd = "b" if i < 5 else "r"; me, opp = sides[sd], sides["r" if sd == "b" else "b"]
                foe = next((q for q in (P[5:] if sd == "b" else P[:5]) if q[2] == pp[2]), None)
                r = {"C": cname(pp[3]), "W": 1 if me[0] == wid else 0, "k": pp[4], "d": pp[5], "a": pp[6], "cs": pp[7], "gold": pp[8],
                     "min": s["min"], "tk": me[1], "ds": pp[11], "wp": pp[12], "wk": pp[13],
                     "gd15": pp[9] - foe[9] if foe and pp[9] is not None and foe[9] is not None else None,
                     "csd15": pp[10] - foe[10] if foe and pp[10] is not None and foe[10] is not None else None,
                     "dt": lpdt(t_), "op": op, "team": me[0], "role": pp[2]}
                rows[i] = r
                if year == YEAR:
                    ck = norm(r["C"]); c = champs.setdefault(ck, {"n": 0, "w": 0}); c["n"] += 1; c["w"] += r["W"]
                k = our_pl.get(pp[0])
                if k:
                    prow.setdefault(k, []).append(r)
                    if year >= "2025":
                        mk = norm(key_of[k]["id"]) + "|" + norm(r["C"]); m = mastery.setdefault(mk, {"n": 0, "w": 0}); m["n"] += 1; m["w"] += r["W"]
            # duels de lane entre nos joueurs
            for i in range(5):
                a, b = P[i], next((q for q in P[5:] if q[2] == P[i][2]), None)
                if not b: continue
                ka, kb = our_pl.get(a[0]), our_pl.get(b[0])
                if not (ka and kb): continue
                ra, rb = rows[i], rows[P.index(b)]
                for (x, rx, y, ry) in ((ka, ra, kb, rb), (kb, rb, ka, ra)):
                    dk = norm(key_of[x]["id"]) + "|" + norm(key_of[y]["id"])
                    z = duels.setdefault(dk, {"g": 0, "w": 0, "ka": 0, "da": 0, "aa": 0, "kb": 0, "db": 0, "ab": 0, "gd15": 0, "n15": 0, "last": None})
                    z["g"] += 1; z["w"] += rx["W"]
                    z["ka"] += rx["k"]; z["da"] += rx["d"]; z["aa"] += rx["a"]; z["kb"] += ry["k"]; z["db"] += ry["d"]; z["ab"] += ry["a"]
                    if rx["gd15"] is not None: z["n15"] += 1; z["gd15"] += rx["gd15"]
                    if not z["last"]: z["last"] = {"dt": rx["dt"], "ca": rx["C"], "cb": ry["C"], "w": bool(rx["W"]), "op": op}
            # parties 2026 des équipes, et parties des Worlds 2026
            if year == YEAR:
                for sd in ("b", "r"):
                    tid = our_team.get(sides[sd][0])
                    if tid: tg[tid].append((sd, sides, wid, s["min"]))
            if e["l"] == "worlds" and year == YEAR:
                tour["games"].append({"gl": s["min"], "b1": our_team.get(s["b"][0], s["b"][0]), "b2": our_team.get(s["r"][0], s["r"][0]),
                                      "wt": our_team.get(wid, wid), "kills": s["b"][1] + s["r"][1]})
                for i, r in rows.items():
                    k = our_pl.get(P[i][0])
                    tour["rows"].append(dict(r, L=key_of[k]["id"] if k else re.sub(r"^\S+\s+", "", P[i][1] or "?"), tm=our_team.get(r["team"], "")))

    # joueurs
    players = {}
    for t in teams:
        for p in t["players"]:
            rs = prow.get(p["key"], [])
            wr = [r for r in rs if r["op"].endswith(INTL["worlds"])]
            players[p["key"]] = {"S": agg([r for r in rs if r["dt"][:4] == YEAR]), "W": agg(wr), "years": sorted({r["dt"][:4] for r in wr}),
                                 "now": agg([r for r in wr if r["dt"][:4] == YEAR]), "since": SINCE[:4]}

    # séries : saison 2026 des équipes, face-à-face (depuis 2024)
    teams_out, h2h = {}, {}
    for t in teams:
        teams_out[t["id"]] = {"sw": 0, "sl": 0, "last": [], "vs": {}, "g": 0, "gw": 0, "bn": 0, "bw": 0, "rn": 0, "rw": 0, "gl": 0, "k": 0, "d": 0, "dr": 0, "ba": 0, "to": 0, "gd": 0}
    for t_, mid in matches:
        d = D[mid]; e = E[mid]
        if len(d["tm"]) != 2: continue
        (ia, ca, na, wa), (ib, cb, nb, wb) = d["tm"]
        if wa == wb or wa is None: continue
        op = opname(e["l"], LN, t_); A, B = our_team.get(ia), our_team.get(ib)
        for me, opp, onm, s1, s2 in ((A, B, nb, wa, wb), (B, A, na, wb, wa)):
            if not me or t_[:4] != YEAR: continue
            S = teams_out[me]; won = s1 > s2
            S["sw" if won else "sl"] += 1
            if len(S["last"]) < 10: S["last"].append({"opp": onm, "oid": opp, "won": won, "s": s1, "o": s2, "dt": lpdt(t_), "op": op})
            if opp: v = S["vs"].setdefault(opp, {"w": 0, "l": 0}); v["w" if won else "l"] += 1
        if A and B and A != B:
            x, y = sorted([A, B]); xa = (A == x)
            H = h2h.setdefault(x + "|" + y, {"aw": 0, "bw": 0, "list": [], "since": None, "intl": {"aw": 0, "bw": 0}})
            sx, sy = (wa, wb) if xa else (wb, wa); xw = sx > sy
            H["aw" if xw else "bw"] += 1
            if e["l"] in INTL: H["intl"]["aw" if xw else "bw"] += 1
            if len(H["list"]) < 5: H["list"].append({"dt": lpdt(t_), "op": op, "as": sx, "bs": sy, "aWon": xw, "bo": e["bo"]})
            H["since"] = lpdt(t_)
    for tid, gl in tg.items():
        S = teams_out[tid]
        for sd, sides, wid, mins in gl:
            me, op_ = sides[sd], sides["r" if sd == "b" else "b"]; won = me[0] == wid
            S["g"] += 1; S["gw"] += won
            if sd == "b": S["bn"] += 1; S["bw"] += won
            else: S["rn"] += 1; S["rw"] += won
            S["gl"] += mins; S["k"] += me[1]; S["d"] += op_[1]; S["dr"] += me[6]; S["ba"] += me[5]; S["to"] += me[3]; S["gd"] += me[2] - op_[2]
        if S["g"]:
            for k in ("gl", "k", "d", "dr", "ba", "to", "gd"): S[k] = round(S[k] / S["g"], 3)

    # tournoi (Worlds 2026)
    TG = tour["games"]; n = len(TG); pl, chs = {}, {}
    for r in tour["rows"]:
        q = pl.setdefault(r["L"], {"L": r["L"], "tm": r["tm"], "g": 0, "w": 0, "k": 0, "d": 0, "a": 0, "cs": 0, "dmg": 0, "tk": 0, "min": 0, "ds": 0, "dsn": 0})
        q["g"] += 1; q["w"] += r["W"]
        for a in ("k", "d", "a", "cs", "tk", "min"): q[a] += r[a]
        if r["ds"] is not None: q["ds"] += r["ds"]; q["dsn"] += 1
        c = chs.setdefault(r["C"], {"p": 0, "w": 0, "b": 0}); c["p"] += 1; c["w"] += r["W"]
    P_ = list(pl.values())
    top = lambda f, mn=3: sorted([dict(q, v=f(q)) for q in P_ if q["g"] >= mn], key=lambda x: -x["v"])[:5]
    byLen = sorted(TG, key=lambda g: -g["gl"]); byK = sorted(TG, key=lambda g: -g["kills"])
    tourney = {"n": n, "blue": sum(1 for g in TG if g["wt"] == g["b1"]), "avg": sum(g["gl"] for g in TG) / n if n else 0,
               "longest": byLen[0] if TG else None, "shortest": byLen[-1] if TG else None, "bloodiest": byK[0] if TG else None, "nobans": True,
               "lead": {"kda": top(lambda q: (q["k"] + q["a"]) / max(1, q["d"])), "kills": top(lambda q: q["k"], 1), "csm": top(lambda q: q["cs"] / max(1, q["min"])),
                        "dmg": top(lambda q: q["ds"] / max(1, q["dsn"]) * 100), "kp": top(lambda q: (q["k"] + q["a"]) / max(1, q["tk"]) * 100)},
               "champs": sorted([dict(c=c, pr=(v["p"] / n * 100) if n else 0, **v) for c, v in chs.items()], key=lambda x: -x["pr"])[:15]}
    tourney["red"] = n - tourney["blue"]

    names = {t["id"]: sorted({t["lp"], t["name"], t["id"]} | {x[c] for mid in D for x in D[mid]["tm"] if our_team.get(x[0]) == t["id"] for c in (1, 2) if x[c]}) for t in teams}
    return {"v": 2, "src": "lolesports", "since": SINCE, "teams": teams_out, "h2h": h2h, "duels": duels, "players": players, "tourney": tourney,
            "champs": champs, "mastery": mastery, "names": names, "logos": R["logos"], "pinfo": R["pinfo"],
            "cover": cover, "errors": [], "stale": {}}

# ---------- passage ----------
def main():
    teams = json.load(open(os.path.join(ROOT, "data", "teams.json"), encoding="utf-8"))
    C = {}
    if os.path.exists(CACHE):
        try: C = json.load(gzip.open(CACHE, "rt", encoding="utf-8"))
        except Exception as e: log("cache illisible, on repart de zéro :", e)
    for k in ("events", "details", "games"): C.setdefault(k, {})
    log("cache : %d matchs, %d détails, %d parties | budget %d min" % (len(C["events"]), len(C["details"]), len(C["games"]), MAX_MIN))
    complete = True
    try:
        refresh_leagues(C)
        refresh_schedules(C)
        E, D = C["events"], C["details"]
        # matchs terminés sans détails (ou détaillés avant la fin), du plus récent au plus ancien
        todo = [m for t, m in sorted(((E[m]["t"], m) for m in E if E[m]["st"] == "completed"), reverse=True)
                if m not in D or any(g[2] not in ("completed", "unneeded") for g in D[m]["g"])]
        log("planning : %d matchs connus, %d à détailler" % (len(E), len(todo)))
        fetch_details(C, todo)
        budget()
        ensure_roster(C, teams); ours = set(C["roster"]["teams"])
        today = time.strftime("%Y-%m-%d")
        todo = []
        for t, m in sorted(((E[m]["t"], m) for m in D if m in E), reverse=True):
            d = D[m]; total = sum((x[3] or 0) for x in d["tm"])
            for g in sorted(d["g"], key=lambda g: g[1])[:total]:
                if g[2] != "completed": continue
                s = C["games"].get(g[0])
                # flux absent : 3 essais, un par jour
                if s and ("p" in s or s.get("x", 0) >= 3 or s.get("at") == today): continue
                todo.append((g[0], t[:4], {x[0] for x in d["tm"]}))
        log("parties à résumer : %d" % len(todo))
        fetch_games(C, todo, ours)
        if time.time() > DEADLINE: complete = False
    except Budget:
        complete = False
    except Exception as e:   # API injoignable : on publie avec ce qu'on a déjà
        log("erreur :", type(e).__name__, str(e)[-200:]); complete = False
    if not complete: log("passage incomplet, la suite au prochain")
    try: ensure_roster(C, teams)
    except Exception as e: log("équipes LoL Esports injoignables :", str(e)[-120:])
    # mtime=0 : même contenu, même fichier (pas de publication inutile)
    with gzip.GzipFile(CACHE, "wb", mtime=0) as f: f.write(json.dumps(C, separators=(",", ":")).encode("utf-8"))
    if not C.get("roster"):
        log("pas encore d'identifiants d'équipes, stats inchangées"); return 0

    out = build(C, teams)
    left = sum(1 for m in C["details"].values() for g in m["g"] if g[2] == "completed" and g[0] not in C["games"])
    out["meta"] = {"queries": NQ[0], "seconds": round(time.time() - T0), "games": len(C["games"]), "left": left, "cover": out["cover"],
                   "players": sum(1 for p in out["players"].values() if p["S"]["g"]), "duels": len(out["duels"]), "h2h": len(out["h2h"]), "tourney": out["tourney"]["n"]}
    if left: out["stale"] = {"historique": "%d parties restent à charger" % left}
    old = None
    if os.path.exists(OUT):
        try: old = json.load(open(OUT, encoding="utf-8"))
        except Exception: old = None
    strip = lambda d: {k: v for k, v in (d or {}).items() if k not in ("built", "meta")}
    if old and strip(old) == strip(out):
        log("aucun changement", out["meta"]); return 0
    out["built"] = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    with open(OUT, "w", encoding="utf-8") as f: json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    log("écrit", OUT, os.path.getsize(OUT) // 1024, "ko", out["meta"])
    return 0

if __name__ == "__main__":
    rc = 1
    try: rc = main()
    finally:
        with open(os.path.join(ROOT, "data", "stats_log.txt"), "w", encoding="utf-8") as f: f.write("\n".join(LOG) + "\n")
    sys.exit(rc)
