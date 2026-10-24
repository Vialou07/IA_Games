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
import json, gzip, time, re, os, sys, unicodedata, urllib.request, urllib.parse, urllib.error, datetime, itertools, threading, collections
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
         "lta_n", "lta_s", "lta_cross", "pcs", "vcs", "ewc_lol", "kespa_cup"]
INTL = {"worlds": "Season World Championship", "msi": "Mid-Season Invitational", "first_stand": "First Stand", "americas_cup": "Americas Cup",
        "ewc_lol": "Esports World Cup"}
# KeSPA Cup : les équipes LCK y alignent souvent leur académie sous le même identifiant d'équipe (T1A sous « T1 », GGA sous « GEN »)
ROSTER_CHECK = {"kespa_cup"}
MIN_NOFIN = 20   # flux arrêté sans l'état « finished » : on garde la partie si elle a duré au moins 20 min (KDA identiques à gol.gg dans 53 cas sur 54)
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

SEC = datetime.timedelta(seconds=1)
def timing(gid, first, end):
    """Temps de jeu réel, pauses retirées. Renvoie (début, minutes de jeu, secondes de pause, instant de la 15e minute de jeu).
    Pendant une pause, le flux marque ses images « paused », ou n'en émet plus et renvoie les dernières, antérieures à l'instant demandé."""
    seen = {}
    def frames(t):
        k = iso10(t)
        if k not in seen: seen[k] = (feed("window/%s?startingTime=%s" % (gid, k)) or {}).get("frames") or []
        return seen[k]
    def gold(t):
        fr = frames(t)
        return fr[0]["blueTeam"]["totalGold"] + fr[0]["redTeam"]["totalGold"] if fr else None
    def paused(t):
        fr = frames(t)
        if not fr: return True
        return fr[-1]["gameState"] == "paused" or (t - ts(fr[-1]["rfc460Timestamp"])).total_seconds() > 20
    # début : l'or passe 5 000 de 40 à 64 s après 0:00 (médiane 49 s, mesuré sur les Worlds 2026).
    # S'il est encore à 5 000 au bout de 75 s, c'est une attente ou un écran de chargement : on recale.
    start = first
    if (end - first).total_seconds() > 300 and (gold(first + 75 * SEC) or 0) <= 5000:
        lo, hi = first + 75 * SEC, min(end, first + datetime.timedelta(minutes=60))
        while (hi - lo).total_seconds() > 10:
            mid = lo + (hi - lo) / 2
            if (gold(mid) or 0) > 5000: hi = mid
            else: lo = mid
        start = hi - 49 * SEC
    # une image toutes les 2 minutes (les pauses techniques durent plusieurs minutes), puis début et fin de chaque pause à 10 s près
    T = [start + (60 + 120 * k) * SEC for k in range(max(0, int((end - start).total_seconds() - 90) // 120 + 1))]
    st = [paused(t) for t in T]
    pauses, i = [], 0
    while i < len(T):
        if not st[i]: i += 1; continue
        j = i
        while j + 1 < len(T) and st[j + 1]: j += 1
        lo, hi = (T[i - 1] if i else start), T[i]   # premier instant en pause
        while (hi - lo).total_seconds() > 10:
            mid = lo + (hi - lo) / 2
            if paused(mid): hi = mid
            else: lo = mid
        ps = hi
        lo, hi = T[j], (T[j + 1] if j + 1 < len(T) else end)   # reprise du jeu
        while (hi - lo).total_seconds() > 10:
            mid = lo + (hi - lo) / 2
            if paused(mid): lo = mid
            else: hi = mid
        if (hi - ps).total_seconds() >= 20: pauses.append((ps, hi))
        i = j + 1
    pz = sum((b - a).total_seconds() for a, b in pauses)
    t15 = start + datetime.timedelta(minutes=15)
    for a, b in pauses:
        if a < t15: t15 += b - a
    return start, round(((end - start).total_seconds() - pz) / 60, 2), round(pz), t15

def summarize(gid, want_details, want_timing=False):
    w0 = feed("window/" + gid)
    if not w0 or not w0.get("frames"): return {"x": 1}
    md = w0["gameMetadata"]
    fr = [f for f in w0["frames"] if f["blueTeam"]["totalGold"] > 0] or w0["frames"]
    start = ts(fr[0]["rfc460Timestamp"]); now = datetime.datetime.now(datetime.timezone.utc)
    recent = now - start < datetime.timedelta(hours=6)
    # image finale : début + 6 h, mais jamais dans le futur (le flux refuse une fenêtre qui finit il y a moins de 20 s)
    t_end = min(start + datetime.timedelta(hours=6), now - datetime.timedelta(seconds=60))
    we = feed("window/" + gid + "?startingTime=" + iso10(t_end))
    if not we or not we.get("frames"): return None if recent else {"x": 1}
    fe = we["frames"][-1]; end = ts(fe["rfc460Timestamp"])
    if fe["gameState"] != "finished" and recent: return None   # partie à peine finie : on réessaiera au prochain passage
    wall = round((end - start).total_seconds() / 60, 2)
    tm = timing(gid, start, end) if want_timing else None
    if tm: start, mins, pz, t15 = tm
    else: mins, pz, t15 = wall, None, start + datetime.timedelta(minutes=15)
    w15 = feed("window/" + gid + "?startingTime=" + iso10(t15)) if mins > 16 else None
    f15 = w15["frames"][0] if w15 and w15.get("frames") else None
    det = feed("details/" + gid + "?startingTime=" + iso10(t_end)) if want_details else None
    dp = {p["participantId"]: p for p in (det["frames"][-1]["participants"] if det and det.get("frames") else [])}
    p15 = {p["participantId"]: p for p in ([*f15["blueTeam"]["participants"], *f15["redTeam"]["participants"]] if f15 else [])}
    def team(t, mt):
        return [mt["esportsTeamId"], t["totalKills"], t["totalGold"], t["towers"], t["inhibitors"], t["barons"], len(t["dragons"])]
    P = []
    for side in ("blue", "red"):
        mt = md[side + "TeamMetadata"]; fp = {p["participantId"]: p for p in fe[side + "Team"]["participants"]}
        for pm in mt["participantMetadata"]:
            i = pm["participantId"]; pp = fp.get(i)
            if not pp: return {"x": 1}   # flux incomplet : on n'invente rien
            d = dp.get(i, {}); q = p15.get(i)
            P.append([pm.get("esportsPlayerId"), pm.get("summonerName"), ROLE.get(pm.get("role"), pm.get("role")), pm.get("championId"),
                      pp["kills"], pp["deaths"], pp["assists"], pp["creepScore"], pp["totalGold"],
                      q["totalGold"] if q else None, q["creepScore"] if q else None,
                      round(d["championDamageShare"], 4) if "championDamageShare" in d else None, d.get("wardsPlaced"), d.get("wardsDestroyed")])
    out = {"s": start.strftime("%Y-%m-%dT%H:%M:%S"), "fin": fe["gameState"] == "finished", "min": mins, "wmin": wall,
           "b": team(fe["blueTeam"], md["blueTeamMetadata"]), "r": team(fe["redTeam"], md["redTeamMetadata"]), "p": P}
    if tm: out["tv"] = 1; out["pz"] = pz   # temps de jeu mesuré, pauses retirées
    return out

def upgrade_timing(gid, s):
    """Partie déjà résumée en temps réel : on mesure le temps de jeu et on reprend l'image de la 15e minute de jeu."""
    first = ts(s["s"] + "Z"); end = first + datetime.timedelta(minutes=s.get("wmin", s["min"]))
    start, mins, pz, t15 = timing(gid, first, end)
    w15 = feed("window/" + gid + "?startingTime=" + iso10(t15)) if mins > 16 else None
    f15 = w15["frames"][0] if w15 and w15.get("frames") else None
    p15 = {p["participantId"]: p for p in ([*f15["blueTeam"]["participants"], *f15["redTeam"]["participants"]] if f15 else [])}
    s = dict(s, s=start.strftime("%Y-%m-%dT%H:%M:%S"), min=mins, wmin=s.get("wmin", s["min"]), tv=1, pz=pz, p=[list(q) for q in s["p"]])
    for i, q in enumerate(s["p"]):   # participants 1 à 10 dans l'ordre (5 bleus puis 5 rouges)
        x = p15.get(i + 1); q[9], q[10] = (x["totalGold"], x["creepScore"]) if x else (None, None)
    return s

def fetch_games(C, todo, ours, our_players):
    def one(item):
        gid, year, teams, upgrade = item
        if time.time() > DEADLINE: return gid, None
        try:
            if upgrade: return gid, upgrade_timing(gid, C["games"][gid])
            return gid, summarize(gid, year >= YEAR and bool(teams & ours), want_timing=True)   # nouvelles parties : temps de jeu mesuré
        except Exception as e:
            log("  partie", gid, str(e)[:120]); return gid, None
    n = 0
    with cf.ThreadPoolExecutor(10) as ex:
        for gid, s in ex.map(one, todo):
            if s is None: continue
            if "x" in s: s["x"] = C["games"].get(gid, {}).get("x", 0) + 1; s["at"] = time.strftime("%Y-%m-%d")
            C["games"][gid] = s; n += 1
            if n % 250 == 0: log("  %d parties traitées (%d requêtes, %d s)" % (n, NQ[0], time.time() - T0))
    return n

def needs_timing(C, gid, mid, our_players):
    """Parties où le temps de jeu compte pour l'appli : 2026 avec un de nos titulaires, et toutes les parties internationales."""
    s = C["games"].get(gid) or {}
    if "p" not in s or s.get("tv"): return False
    e = C["events"].get(mid) or {}
    return e.get("l") in ("worlds", "msi", "first_stand", "ewc_lol") or (e.get("t", "")[:4] == YEAR and any(q[0] in our_players for q in s["p"]))

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
        l = lean(s) if s and "b" in s else 0.0
        if s and "b" in s and not s.get("fin"): l *= 0.1   # flux coupé : état partiel, sert seulement à départager
        lean_of.append((blue, l))
    best, bscore = None, None
    for combo in itertools.product(ids, repeat=len(games)):
        if any(combo.count(t) != wins[t] for t in ids) or combo[-1] != sw: continue
        sc = sum((l if w == blue else -l) for w, (blue, l) in zip(combo, lean_of))
        if bscore is None or sc > bscore: best, bscore = combo, sc
    if best is None:   # score de série incohérent avec les parties : l'état final seul
        best = [blue if l >= 0 else next(t for t in ids if t != blue) for blue, l in lean_of]
    return {g[0]: w for g, w in zip(games, best)}

def swap_ids(s):
    P = s["p"]
    for i in range(5):
        j = next((k for k in range(5, 10) if P[k][2] == P[i][2]), None)
        if j is not None: P[i][0], P[j][0] = P[j][0], P[i][0]

def fix_sides(C):
    """Flux LPL mal étiquetés (17 parties, vérifiées sur gol.gg) : étiquette d'équipe ou identifiants de joueurs du mauvais côté.
    On corrige en mémoire seulement (le cache brut est déjà écrit), à chaque passage."""
    E, D, G = C["events"], C["details"], C["games"]; codes, year, votes = {}, {}, {}
    for mid, d in D.items():
        for t in d["tm"]:
            if t[1]: codes.setdefault(t[0], set()).add(norm(t[1]))
        for g in d["g"]: year[g[0]] = E.get(mid, {}).get("t", "")[:4]
    for gid, s in G.items():
        for i, p in enumerate(s.get("p", [])):
            v = votes.setdefault((p[0], year.get(gid)), {}); t = (s["b"] if i < 5 else s["r"])[0]; v[t] = v.get(t, 0) + 1
    n = 0
    for gid, s in G.items():
        if "p" not in s: continue
        b, r, y, P = s["b"][0], s["r"][0], year.get(gid), s["p"]
        pre = lambda p, t: bool(p[1]) and any(norm(p[1]).startswith(c) for c in codes.get(t, ()))
        if sum(pre(p, r) for p in P[:5]) >= 3 and sum(pre(p, b) for p in P[5:]) >= 3:   # les pseudos contredisent l'étiquette
            s["b"][0], s["r"][0] = r, b; b, r = r, b; n += 1
        bad = lambda ps, me, ot: sum(votes.get((p[0], y), {}).get(ot, 0) > votes.get((p[0], y), {}).get(me, 0) for p in ps)
        if bad(P[:5], b, r) >= 3 and bad(P[5:], r, b) >= 3: swap_ids(s); n += 1   # identifiants de l'autre équipe
    return n

# ---------- agrégats ----------
def agg(rows):
    A = {"g": 0, "w": 0, "k": 0, "d": 0, "a": 0, "cs": 0, "gold": 0, "min": 0, "tk": 0, "dmg": 0, "vs": 0,
         "dsn": 0, "ds": 0, "wp": 0, "wk": 0, "wn": 0, "n15": 0, "gd15": 0, "csd15": 0, "kps": 0, "kpn": 0}
    ch = {}
    for r in rows:
        A["g"] += 1; A["w"] += r["W"]
        for a in ("k", "d", "a", "cs", "gold", "min", "tk"): A[a] += r[a]
        if r["tk"]: A["kpn"] += 1; A["kps"] += (r["k"] + r["a"]) / r["tk"]   # participation aux kills : moyenne par partie, comme gol.gg
        if r["ds"] is not None: A["dsn"] += 1; A["ds"] += r["ds"]
        if r["wp"] is not None: A["wn"] += 1; A["wp"] += r["wp"]; A["wk"] += r["wk"] or 0
        if r["gd15"] is not None: A["n15"] += 1; A["gd15"] += r["gd15"]; A["csd15"] += r["csd15"]
        c = ch.setdefault(r["C"], {"g": 0, "w": 0, "k": 0, "d": 0, "a": 0}); c["g"] += 1; c["w"] += r["W"]
        c["k"] += r["k"]; c["d"] += r["d"]; c["a"] += r["a"]
    for k in ("min", "ds", "kps"): A[k] = round(A[k], 3)
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
    LN = {"lck": "LCK", "lpl": "LPL", "lec": "LEC", "lcs": "LCS", "cblol-brazil": "CBLOL", "lcp": "LCP", "lta_n": "LTA North", "lta_s": "LTA South", "lta_cross": "LTA", "pcs": "PCS", "vcs": "VCS",
          "kespa_cup": "KeSPA Cup"}
    # noms des champions (Data Dragon)
    try:
        v = fetch("https://ddragon.leagueoflegends.com/api/versions.json")[0]
        CN = {c["id"]: c["name"] for c in fetch("https://ddragon.leagueoflegends.com/cdn/%s/data/en_US/champion.json" % v)["data"].values()}
    except Exception: CN = {}
    cname = lambda c: CN.get(c, c)
    pseudo = {k: norm(p["id"]) for k, p in key_of.items()}
    side_ix = {"b": range(5), "r": range(5, 10)}
    # équipes 2026 sous un autre identifiant (EWC : « AG.AL » = AL, « MIBR.LOS » = LOS) : au moins 3 titulaires d'une même équipe du même côté
    alias = {}
    for mid in D:
        if mid not in E or E[mid]["t"][:4] != YEAR: continue
        for g in D[mid]["g"]:
            s = G.get(g[0])
            if not s or "p" not in s: continue
            for sd in ("b", "r"):
                if s[sd][0] in our_team: continue
                c = collections.Counter(team_of_key[our_pl[s["p"][i][0]]] for i in side_ix[sd] if s["p"][i][0] in our_pl).most_common(1)
                if c and c[0][1] >= 3: alias[s[sd][0]] = c[0][0]
    our_team = {**our_team, **alias}
    def ident(s):
        """Clé de nos joueurs pour chaque participant. Le flux se trompe parfois : identifiant d'un de nos joueurs posé sur un adversaire
        alors que le vrai joueur est dans la partie (LPL 18/05/2025, 25/01/2026), ou identifiant absent (TES-WBG 02/05/2026)."""
        P = s["p"]; ks = [our_pl.get(q[0]) for q in P]
        lost = []
        for i, q in enumerate(P):
            k = ks[i]
            if k and q[1] and len(pseudo[k]) >= 3 and not norm(q[1]).endswith(pseudo[k]) and \
               any(j != i and x[1] and norm(x[1]).endswith(pseudo[k]) for j, x in enumerate(P)):
                ks[i] = None; lost.append(k)
        for k in lost:
            j = next((j for j, x in enumerate(P) if x[1] and norm(x[1]).endswith(pseudo[k])), None)
            if j is not None: ks[j] = k
        for i, q in enumerate(P):
            if ks[i] is None and q[0] is None and q[1]:
                tid = our_team.get(s["b" if i < 5 else "r"][0]); nm = norm(q[1])
                ks[i] = next((k for k in pseudo if team_of_key[k] == tid and len(pseudo[k]) >= 3 and nm.endswith(pseudo[k]) and k not in ks), None)
        return ks
    def main_side(KS, sd, tid):   # l'équipe a-t-elle aligné au moins 3 de nos titulaires ? (KeSPA Cup : sinon c'est l'académie)
        return sum(1 for i in side_ix[sd] if KS[i] and team_of_key[KS[i]] == tid) >= 3
    main_ok = set()   # (match, notre équipe) où l'équipe principale a joué

    # matchs terminés, du plus récent au plus ancien
    matches = sorted([(E[m]["t"], m) for m in D if m in E and E[m]["st"] == "completed"], reverse=True)
    W = {}
    log("côtés ou identifiants corrigés :", fix_sides(C))
    for _, mid in matches:
        w = winners(C, mid)
        # vainqueur imposé par la série contre un état final très net : les métadonnées du flux sont inversées, on suit les images
        flip = [g for g, x in w.items() if "b" in G.get(g, {}) and abs(lean(G[g])) >= 3 and (G[g]["b"][0] if lean(G[g]) > 0 else G[g]["r"][0]) != x]
        for g in flip:
            s = G[g]; s["b"][0], s["r"][0] = s["r"][0], s["b"][0]; swap_ids(s)
        W.update(winners(C, mid) if flip else w)
    LS = {"worlds": "Worlds", "msi": "MSI", "first_stand": "First Stand", "americas_cup": "Americas Cup", "ewc_lol": "EWC", "kespa_cup": "KeSPA"}

    # lignes par joueur (nos 95), par partie
    prow = {}   # clé joueur -> [lignes]
    duels, champs, mastery, tour, recent = {}, {}, {}, {"games": [], "rows": []}, {}
    tg = {t["id"]: [] for t in teams}   # parties 2026 par équipe
    cover = {}
    for t_, mid in matches:
        e, d = E[mid], D[mid]; op = opname(e["l"], LN, t_)
        for g in d["g"]:
            s = G.get(g[0]); wid = W.get(g[0])
            if not s or "p" not in s or not wid: continue
            year = t_[:4]; cover[year] = cover.get(year, 0) + 1
            # flux arrêté sans « finished » : la dernière image est presque toujours la fin réelle ; on écarte seulement les flux coupés tôt
            if not s["fin"] and s["min"] < MIN_NOFIN: continue
            # partie reprise après une coupure (compteurs remis à zéro) : or par minute impossible, on l'écarte
            if (s["b"][2] + s["r"][2]) / max(1, s.get("wmin", s["min"])) > 5500: continue
            sides = {"b": s["b"], "r": s["r"]}; P = s["p"]; KS = ident(s)
            # kills d'équipe = somme des kills des joueurs (le total du flux compte aussi les exécutions)
            kills = {"b": sum(q[4] for q in P[:5]), "r": sum(q[4] for q in P[5:])}
            # écart à 15 min seulement si l'image est plausible (or total 40 000 à 62 000 : sinon pause ou image vide)
            ok15 = 40000 <= sum(q[9] or 0 for q in P) <= 62000
            for sd in ("b", "r"):
                tid = our_team.get(sides[sd][0])
                if tid and main_side(KS, sd, tid): main_ok.add((mid, tid))
            rows = {}
            for i, pp in enumerate(P):
                sd = "b" if i < 5 else "r"; me, opp = sides[sd], sides["r" if sd == "b" else "b"]
                foe = next((q for q in (P[5:] if sd == "b" else P[:5]) if q[2] == pp[2]), None)
                r = {"C": cname(pp[3]), "W": 1 if me[0] == wid else 0, "k": pp[4], "d": pp[5], "a": pp[6], "cs": pp[7], "gold": pp[8],
                     "min": s["min"], "tk": kills[sd], "ds": pp[11], "wp": pp[12], "wk": pp[13],
                     "gd15": pp[9] - foe[9] if ok15 and foe and pp[9] is not None and foe[9] is not None else None,
                     "csd15": pp[10] - foe[10] if ok15 and foe and pp[10] is not None and foe[10] is not None else None,
                     "dt": lpdt(t_), "op": op, "team": me[0], "role": pp[2]}
                rows[i] = r
                if year == YEAR:
                    ck = norm(r["C"]); c = champs.setdefault(ck, {"n": 0, "w": 0}); c["n"] += 1; c["w"] += r["W"]
                k = KS[i]
                if k:
                    prow.setdefault(k, []).append(r)
                    if year >= "2025":
                        mk = norm(key_of[k]["id"]) + "|" + norm(r["C"]); m = mastery.setdefault(mk, {"n": 0, "w": 0}); m["n"] += 1; m["w"] += r["W"]
            # duels de lane entre nos joueurs
            for i in range(5):
                a, b = P[i], next((q for q in P[5:] if q[2] == P[i][2]), None)
                if not b: continue
                ka, kb = KS[i], KS[P.index(b)]
                if not (ka and kb): continue
                ra, rb = rows[i], rows[P.index(b)]
                for (x, rx, y, ry) in ((ka, ra, kb, rb), (kb, rb, ka, ra)):
                    dk = norm(key_of[x]["id"]) + "|" + norm(key_of[y]["id"])
                    z = duels.setdefault(dk, {"g": 0, "w": 0, "ka": 0, "da": 0, "aa": 0, "kb": 0, "db": 0, "ab": 0, "gd15": 0, "n15": 0, "last": None})
                    z["g"] += 1; z["w"] += rx["W"]
                    z["ka"] += rx["k"]; z["da"] += rx["d"]; z["aa"] += rx["a"]; z["kb"] += ry["k"]; z["db"] += ry["d"]; z["ab"] += ry["a"]
                    if rx["gd15"] is not None: z["n15"] += 1; z["gd15"] += rx["gd15"]
                    # dernière manche jouée (les matchs vont du plus récent au plus ancien, les manches dans l'ordre)
                    if not z["last"] or (z["last"]["dt"] == rx["dt"] and g[1] > z["last"]["n"]):
                        z["last"] = {"dt": rx["dt"], "ca": rx["C"], "cb": ry["C"], "w": bool(rx["W"]), "op": op, "n": g[1]}
                # 5 dernières rencontres, rangées une seule fois (clé dans l'ordre alphabétique, du point de vue du premier)
                (x, rx, y, ry) = sorted(((ka, ra, kb, rb), (kb, rb, ka, ra)), key=lambda v: norm(key_of[v[0]]["id"]))[0]
                recent.setdefault(norm(key_of[x]["id"]) + "|" + norm(key_of[y]["id"]), []).append(
                    [rx["dt"][:10], g[1], LS.get(e["l"], LN.get(e["l"], e["l"].upper())), rx["C"], ry["C"], [rx["k"], rx["d"], rx["a"]], [ry["k"], ry["d"], ry["a"]], rx["gd15"], rx["W"]])
            # parties 2026 des équipes, et parties des Worlds 2026
            if year == YEAR:
                for sd in ("b", "r"):
                    tid = our_team.get(sides[sd][0])
                    if tid and (e["l"] not in ROSTER_CHECK or (mid, tid) in main_ok and main_side(KS, sd, tid)):
                        tg[tid].append((sd, sides, wid, s["min"], kills))
            if e["l"] == "worlds" and year == YEAR:
                tour["games"].append({"gl": s["min"], "b1": our_team.get(s["b"][0], s["b"][0]), "b2": our_team.get(s["r"][0], s["r"][0]),
                                      "wt": our_team.get(wid, wid), "kills": kills["b"] + kills["r"]})
                for i, r in rows.items():
                    k = KS[i]
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
        if e["l"] in ROSTER_CHECK:   # série jouée par l'académie sous le nom de l'équipe : ignorée pour l'équipe
            A = A if (mid, A) in main_ok else None; B = B if (mid, B) in main_ok else None
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
        for sd, sides, wid, mins, kl in gl:
            me, op_ = sides[sd], sides["r" if sd == "b" else "b"]; won = me[0] == wid
            S["g"] += 1; S["gw"] += won
            if sd == "b": S["bn"] += 1; S["bw"] += won
            else: S["rn"] += 1; S["rw"] += won
            S["gl"] += mins; S["k"] += kl[sd]; S["d"] += kl["r" if sd == "b" else "b"]; S["dr"] += me[6]; S["ba"] += me[5]; S["to"] += me[3]; S["gd"] += me[2] - op_[2]
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
    return {"v": 2, "src": "lolesports", "since": SINCE[:4], "teams": teams_out, "h2h": h2h, "duels": duels, "players": players, "tourney": tourney,
            "champs": champs, "mastery": mastery, "names": names, "logos": R["logos"], "pinfo": R["pinfo"],
            "dr": {k: sorted(v, key=lambda x: (x[0], x[1]), reverse=True)[:5] for k, v in recent.items()},
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
        two_days = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=2)).strftime("%Y-%m-%dT%H:%M:%SZ")
        todo = []
        for t, m in sorted(((E[m]["t"], m) for m in D if m in E), reverse=True):
            d = D[m]; total = sum((x[3] or 0) for x in d["tm"])
            for g in sorted(d["g"], key=lambda g: g[1])[:total]:
                if g[2] != "completed": continue
                s = C["games"].get(g[0])
                if s and "p" in s: continue
                # flux absent : à chaque passage pendant 2 jours, puis 3 essais, un par jour
                if s and (s.get("x", 0) >= 40 if t >= two_days else (s.get("x", 0) >= 3 or s.get("at") == today)): continue
                todo.append((g[0], t[:4], {x[0] for x in d["tm"]}, False))
        log("parties à résumer : %d" % len(todo))
        our_players = set(C["roster"]["players"])
        fetch_games(C, todo, ours, our_players)
        # parties déjà en mémoire sans temps de jeu mesuré (pauses comptées) : de la plus récente à la plus ancienne
        upg = [(g[0], t[:4], set(), True) for t, m in sorted(((E[m]["t"], m) for m in D if m in E), reverse=True)
               for g in D[m]["g"] if needs_timing(C, g[0], m, our_players)]
        if upg:
            log("temps de jeu à mesurer : %d parties" % len(upg))
            fetch_games(C, upg, ours, our_players)
            log("temps de jeu restant à mesurer : %d parties" % sum(1 for x in upg if not C["games"][x[0]].get("tv")))
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
    out["meta"] = {"queries": NQ[0], "seconds": round(time.time() - T0), "games": len(C["games"]), "left": left, "cover": out["cover"], "timed": sum(1 for s in C["games"].values() if s.get("tv")),
                   "players": sum(1 for p in out["players"].values() if p["S"]["g"]), "duels": len(out["duels"]), "h2h": len(out["h2h"]), "tourney": out["tourney"]["n"]}
    if left: out["stale"] = {"parties": "%d récentes ou manquantes, reprises au prochain passage" % left}
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
