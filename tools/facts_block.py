"""Faits « Le saviez-vous ? » vérifiés, recalculés à chaque passage du robot (clé « fx » de stats.json).

facts_block(FLAT, teams, state, now_iso, C=None, log=None) -> list
- FLAT    : parties à plat remplies par build() (clés de rows en entiers dans le robot, en chaînes si relues d'un JSON) ;
- teams   : data/teams.json ;
- state   : dict persistant (MS["fx"], sauvé dans data/model_state.json). Il porte la règle des 2 passages : un fait n'est
            publié qu'après 2 passages consécutifs avec le même texte, et un fait publié ne disparaît pas sur une seule absence ;
- now_iso : heure de référence (dernière partie du cache) ; l'année en cours en découle ;
- C       : mémoire du robot, facultative mais conseillée. Elle donne le score officiel des séries (details), le flux complet,
            le temps de jeu mesuré, l'état final (vainqueur certain) et les dragons. Sans elle, les faits qui en dépendent sont
            retenus : on ne publie jamais au jugé ;
- log     : fonction de journal du robot (facultative) : une ligne de bilan et les faits retenus avec leur raison.

Sortie : [[id, fam, txt, calcul, n, wow, keys, nouveau], ...] triée par intérêt, 60 faits au plus (< 25 Ko).
- calcul  : comment le fait est calculé, sa condition de publication et l'échantillon ;
- keys    : équipes (GEN, KC…), titulaires (T1_faker…), ligues ou champions concernés ;
- nouveau : 1 si le fait (ou sa nouvelle version) est publié pour la première fois à ce passage.
Ne lève jamais d'exception : en cas de panne, renvoie la dernière liste publiée.

Garde-fous (repris du générateur faits.py, rapport x_4e4dc433) :
- échantillons minimaux et tests (z, intervalle de Wilson), « jamais / toujours » sur au moins 10 cas ;
- records d'une partie : flux complet ; durées : temps de jeu mesuré ; vainqueur certain pour « a perdu malgré… » ;
- identité d'équipe : en KeSPA Cup et en VCS, l'équipe ne compte qu'avec au moins 3 titulaires actuels (MVK Academy) ;
- une partie ou une série sans données coupe une série de victoires : on ne sur-annonce jamais ;
- bilans parfaits joueur-champion retenus : une seule défaite hors API (qualifications EWC, KeSPA Cup 2025) les rend faux
  (Busio sur Lulu 11-1, ShowMaker sur Cassiopeia 11-2, Caps sur Orianna 12-1 sur gol.gg) ;
- périmètre écrit dans le texte (« depuis 2024 », « en 2026 (LEC, MSI) », « pour l'instant »).

Usage hors robot : python -X utf8 facts_block.py flat.json.gz teams.json [cache.json.gz] [faits_sortie.txt]"""
import collections, gzip, hashlib, json, math, re, statistics, sys, time, unicodedata, urllib.request

MAX_OUT = 60            # faits publiés au plus
MAX_BYTES = 25000       # taille maximale de la liste publiée (JSON compact)
INTL = {"worlds", "msi", "first_stand", "americas_cup", "ewc_lol"}
ACADEMY = {"kespa_cup", "vcs"}   # l'équipe peut y aligner son académie sous le même identifiant LoL Esports
LS = {"worlds": "Worlds", "msi": "MSI", "first_stand": "First Stand", "americas_cup": "Americas Cup", "ewc_lol": "EWC", "kespa_cup": "KeSPA Cup",
      "lck": "LCK", "lpl": "LPL", "lec": "LEC", "lcs": "LCS", "cblol-brazil": "CBLOL", "lcp": "LCP", "lta_n": "LTA Nord", "lta_s": "LTA Sud",
      "lta_cross": "LTA", "pcs": "PCS", "vcs": "VCS"}
# noms courts pour les phrases (sinon le nom de data/teams.json)
NAMES = {"GEN": "Gen.G", "HLE": "Hanwha Life", "T1": "T1", "DK": "Dplus KIA", "AL": "Anyone's Legend", "BLG": "Bilibili Gaming", "TES": "Top Esports",
         "IG": "Invictus Gaming", "G2": "G2", "MKOI": "Movistar KOI", "KC": "Karmine Corp", "FUR": "FURIA", "TL": "Team Liquid", "C9": "Cloud9",
         "LYON": "LYON", "CFO": "CTBC Flying Oyster", "TSW": "Team Secret Whales", "MVK": "MVK", "LOS": "LOS"}
RK = {"A": 0, "B": 1, "C": 2}
# faits qui citent un score officiel de série : publiés seulement avec C (details)
OFFICIAL = ("w.ligues", "w.phoenix", "w.premiere", "s.bo5", "s.decisive", "s.reverse", "h.dom", "h.encours", "l.inter", "l.blanc", "l.lcklpl")
DDRAGON = "https://ddragon.leagueoflegends.com/"


# ---------- petits outils ----------
def _norm(s):
    s = str(s or "").lower().replace("ø", "o")
    s = "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]", "", s)
def fr(x, d=1): return ("%%.%df" % d % x).replace(".", ",")
def pct(w, n, d=0): return fr(100 * w / n, d) + " %"
def dfr(s): y, m, d = s[:10].split("-"); return "%d/%s" % (int(d), m)
def mmss(x): m = int(x); s = round((x - m) * 60); return "%d:%02d" % (m + (s == 60), 0 if s == 60 else s)
def sp(x): return format(x, ",").replace(",", " ")
def opp(sd): return "r" if sd == "b" else "b"
def wilson(w, n, z=1.96):
    if n == 0: return (0, 1)
    p = w / n; den = 1 + z * z / n; c = p + z * z / (2 * n); m = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))
    return ((c - m) / den, (c + m) / den)
def _lean(s):
    """> 0 si le bleu a gagné, d'après l'état final (même calcul que build_stats.lean)."""
    b, r = s["b"], s["r"]
    v = (3 if b[4] > 0 else -3) if (b[4] > 0) != (r[4] > 0) else 0
    return v + 0.3 * (b[3] - r[3]) + (b[2] - r[2]) / 5000
def _unit(n, u):
    if n == 1: w = u.split(" ", 1); return w[0][:-1] + ((" " + w[1]) if len(w) > 1 else "") if w[0].endswith("s") else u
    return u
def _typo(s):
    """Typographie française du texte publié, comme dans l'appli : apostrophe typographique, espace insécable avant « : »,
    espace fine insécable avant ; ? ! % » et après «, et dans les milliers (2 500). Appliquée à la sortie seulement :
    l'empreinte des faits (règle des 2 passages, « nouveau ») reste calculée sur le texte brut, rien n'est republié."""
    s = re.sub(r"(?<=[A-Za-zÀ-ÿ])'(?=[A-Za-zÀ-ÿ])", "\u2019", s)
    s = re.sub(r" (?=:(\s|$))", "\u00a0", s)
    s = re.sub(r" (?=[;?!»%])", "\u202f", s)
    s = s.replace("« ", "«\u202f")
    return re.sub(r"(?<=\d) (?=\d{3}(?!\d))", "\u202f", s)
BN = {"Play-Ins": "Play-In", "Play In Knockouts": "Play-In", "Swiss": "phase suisse", "Knockouts": "phase finale", "Groups": "groupes",
      "Finals": "finale", "Semifinals": "demi-finale", "Quarterfinals": "quart de finale", "Regional Qualifier": "qualification",
      "Regular Season": "saison", "Playoffs": "playoffs", "Promotion": "promotion"}
def _bn(s):
    """nom de phase de LoL Esports en français (même table que fjPhase dans l'appli)"""
    s = str(s or ""); m = re.match(r"(Week|Round) (\d+)$", s)
    return BN.get(s) or ((("semaine " if m.group(1) == "Week" else "tour ") + m.group(2)) if m else s)


# ---------- table des parties ----------
class _P: pass

def _prep(FLAT, teams, C, Y):
    """Parties et séries au format du générateur (même logique que dataset.py), à partir de FLAT (+ C si fournie)."""
    P = _P()
    P.PL = {p["key"]: {"id": p["id"], "role": p["role"], "team": t["id"]} for t in teams for p in t["players"]}
    P.LOT = {t["id"]: t["league"] for t in teams}
    P.TNAME = {t["id"]: NAMES.get(t["id"], t.get("name") or t["id"]) for t in teams}
    C = C if isinstance(C, dict) else {}
    E, D, GS = C.get("events") or {}, C.get("details") or {}, C.get("games") or {}
    P.full = bool(E and D and GS)
    FL = sorted((f for f in FLAT if f.get("t") and f.get("g")), key=lambda f: (f["t"], f.get("n", 1)))
    # code d'équipe de chaque identifiant (le plus récent)
    code_of = {}
    for mid, d in D.items():
        for t in d.get("tm") or []:
            if t[1]: code_of[t[0]] = t[1]
    for f in FL:
        if f.get("bc"): code_of[f["b"]] = f["bc"]
        if f.get("rc"): code_of[f["r"]] = f["rc"]
    # identifiant LoL Esports -> notre équipe : effectif du robot (C.roster), complété par les alias de l'année
    # (au moins 3 titulaires d'une même équipe du même côté : « AG.AL » = AL, « MIBR.LOS » = LOS à l'EWC)
    votes = collections.defaultdict(collections.Counter)
    for f in FL:
        if f["t"][:4] != Y: continue
        ks = f.get("ks") or [None] * 10
        for sd, ix in (("b", range(5)), ("r", range(5, 10))):
            c = collections.Counter(P.PL[ks[i]]["team"] for i in ix if ks[i] in P.PL).most_common(1)
            if c and c[0][1] >= 3: votes[f[sd]][c[0][0]] += 1
    our = dict((C.get("roster") or {}).get("teams") or {})
    al = {t["id"]: set(t.get("al") or []) | {_norm(t["id"]), _norm(t.get("name")), _norm(t.get("lp"))} for t in teams}
    for lid, v in votes.items():
        if lid in our: continue
        top = v.most_common()
        our[lid] = max(top, key=lambda kv: (kv[1], _norm(code_of.get(lid)) in al.get(kv[0], ())))[0]
    P.our = our
    tname = lambda lid: our.get(lid) or code_of.get(lid) or lid
    P.tname = tname
    # parties
    G = []
    for f in FL:
        rows = f.get("rows") or {}
        R10 = [rows.get(i, rows.get(str(i))) for i in range(10)]
        if any(r is None for r in R10): continue
        b, r = f["b"], f["r"]
        win = "b" if f.get("w") == b else "r" if f.get("w") == r else None
        if not win: continue
        ks = f.get("ks") or [None] * 10; nm = f.get("nm") or [None] * 10
        s = GS.get(f["g"]) or {}; have = "b" in s and "r" in s
        kills = {"b": sum(x["k"] for x in R10[:5]), "r": sum(x["k"] for x in R10[5:])}
        gb = [x.get("gd15") for x in R10[:5]]
        d15 = sum(gb) if all(v is not None for v in gb) else None   # écart d'or d'équipe à 15 min (bleu - rouge)
        blue, red = tname(b), tname(r)
        main = {}
        for sd, lid, ix in (("b", b, range(5)), ("r", r, range(5, 10))):
            tid = our.get(lid)
            main[sd] = bool(tid) and sum(1 for i in ix if ks[i] in P.PL and P.PL[ks[i]]["team"] == tid) >= 3
        g = {"gid": f["g"], "mid": f["m"], "t": f["t"], "y": f["t"][:4], "l": f["l"], "bn": f.get("bn") or "", "bo": f.get("bo") or 1, "n": f.get("n") or 1,
             "blue": blue, "red": red, "bid": b, "rid": r, "win": win, "min": f["min"],
             "tv": (s.get("tv", 0) if have else None), "fin": (bool(s.get("fin")) if have else None),
             "lean": (round(_lean(s), 2) if have else None), "drg": ({"b": s["b"][6], "r": s["r"][6]} if have else None),
             "k": kills, "d15": d15, "ok15": d15 is not None, "main": main, "p": []}
        for i, x in enumerate(R10):
            sd = "b" if i < 5 else "r"; raw = nm[i]
            g["p"].append({"key": ks[i] if ks[i] in P.PL else None, "nm": re.sub(r"^\S+\s+", "", raw) if raw and " " in raw else (raw or "?"),
                           "side": sd, "team": blue if sd == "b" else red, "role": x.get("role"), "C": x.get("C"), "k": x["k"], "d": x["d"], "a": x["a"],
                           "cs": x.get("cs") or 0, "gold": x.get("gold"), "gd15": x.get("gd15"), "csd15": x.get("csd15"), "ds": x.get("ds"),
                           "wp": x.get("wp"), "wk": x.get("wk"), "tk": kills[sd], "W": 1 if sd == win else 0})
        G.append(g)
    G.sort(key=lambda g: (g["t"], g["n"]))
    P.G = G
    # séries : score officiel (C.details), sinon recompté sur FLAT (incomplet si une manche manque : il coupe alors les séries)
    S = []
    if E and D:
        for mid, d in D.items():
            e = E.get(mid)
            if not e or e.get("st") != "completed" or len(d.get("tm") or []) != 2: continue
            (ia, ca, na, wa), (ib, cb, nb, wb) = [tuple(x[:4]) for x in d["tm"]]
            S.append({"mid": mid, "t": e["t"], "l": e["l"], "bn": e.get("bn", ""), "bo": e.get("bo"), "A": tname(ia), "B": tname(ib), "ia": ia, "ib": ib,
                      "sa": wa, "sb": wb, "gids": [x[0] for x in sorted(d["g"], key=lambda x: x[1]) if x[2] == "completed"]})
    else:
        byM = collections.defaultdict(list)
        for g in G: byM[g["mid"]].append(g)
        for mid, gs in byM.items():
            gs.sort(key=lambda g: g["n"]); ia, ib = gs[0]["bid"], gs[0]["rid"]
            if any({x["bid"], x["rid"]} != {ia, ib} for x in gs): continue
            wa = sum(1 for x in gs if (x["bid"] if x["win"] == "b" else x["rid"]) == ia); wb = len(gs) - wa
            bo = gs[0]["bo"] or 1
            done = [x["n"] for x in gs] == list(range(1, len(gs) + 1)) and (max(wa, wb) == bo // 2 + 1 if bo % 2 else len(gs) == bo)
            S.append({"mid": mid, "t": gs[0]["t"], "l": gs[0]["l"], "bn": gs[0]["bn"], "bo": bo, "A": tname(ia), "B": tname(ib), "ia": ia, "ib": ib,
                      "sa": wa if done else None, "sb": wb if done else None, "inc": not done, "gids": [x["gid"] for x in gs]})
    S.sort(key=lambda s: s["t"])
    P.S = S
    return P


def _champions(state, played):
    """Liste officielle des champions (Data Dragon), gardée dans l'état et rafraîchie une fois par jour."""
    day = time.strftime("%Y-%m-%d")
    cn = state.get("cn") if isinstance(state.get("cn"), list) else None
    if cn and cn[0] == day: return cn[1]
    try:
        get = lambda u: json.load(urllib.request.urlopen(urllib.request.Request(DDRAGON + u, headers={"User-Agent": "IA_Games-Worlds26-faits/1.0"}), timeout=3))
        v = get("api/versions.json")[0]
        names = sorted(c["name"] for c in get("cdn/%s/data/en_US/champion.json" % v)["data"].values())
        if len(names) >= 150 and len(set(played) - set(names)) <= 2:   # liste plausible, mêmes noms que FLAT
            state["cn"] = [day, names]; return names
    except Exception:
        pass
    return cn[1] if cn else None


# ---------- générateur ----------
def _generate(P, Y, state):
    G, S, LOT, PL = P.G, P.S, P.LOT, P.PL
    OURS = set(LOT); tn = lambda t: P.TNAME.get(t, t)
    pid = lambda k: PL[k]["id"]
    GID = {g["gid"]: g for g in G}
    SER = {s["mid"]: s for s in S}
    FACTS, HELD = [], []

    def fact(fid, fam, scope, txt, calc, cond, n, wow, rob, keys=(), src="parties", ok=True, why=""):
        f = {"id": fid, "fam": fam, "scope": scope, "txt": txt, "calc": calc, "cond": cond, "n": n, "wow": wow, "rob": rob, "keys": [k for k in keys if k], "src": src}
        (FACTS if ok else HELD).append(f if ok else dict(f, why=why))
    def hold(fid, txt, why): HELD.append({"id": fid, "txt": txt, "why": why})

    def side_ok(g, sd):
        """L'équipe de ce côté est une des nôtres, avec son équipe principale (KeSPA Cup, VCS : académies écartées)."""
        t = g["blue" if sd == "b" else "red"]
        return t in OURS and (g["main"][sd] or g["l"] not in ACADEMY)
    def team_games(year=None, league=None):
        for g in G:
            if year and g["y"] != year: continue
            if league and g["l"] != league: continue
            for sd in ("b", "r"):
                if side_ok(g, sd): yield g["blue" if sd == "b" else "red"], sd, g
    def prows(year=None, league=None):
        for g in G:
            if year and g["y"] != year: continue
            if league and g["l"] != league: continue
            for p in g["p"]:
                if p["key"]: yield p, g
    def gd(g, sd): return g["d15"] if sd == "b" else -g["d15"]          # écart d'or à 15 min vu du côté sd
    def team_seq(t, year=Y):
        """Résultats chronologiques de l'équipe t (avec au moins 3 titulaires actuels là où l'académie peut jouer). None = partie
        officielle sans données, série incomplète ou autre effectif : elle coupe toute série (on ne sur-annonce jamais)."""
        seq = []
        for s in S:
            if s["t"][:4] != year or t not in (s["A"], s["B"]): continue
            if s["sa"] is None:
                if s.get("inc"): seq.append((s["t"], None, s, None))
                continue
            for gid in s["gids"][:s["sa"] + s["sb"]]:
                g = GID.get(gid)
                if not g: seq.append((s["t"], None, s, None)); continue
                sd = "b" if g["blue"] == t else "r"
                seq.append((g["t"], (g["win"] == sd) if side_ok(g, sd) else None, s, g))
        return seq
    def runs(seq, val):
        best, cur, st, out = 0, 0, None, None
        for i, x in enumerate(seq):
            cur = cur + 1 if x[1] is val else 0
            if cur == 1: st = i
            if cur > best: best, out = cur, (seq[st], x)
        return best, out
    def trailing(seq):
        if not seq or seq[-1][1] is None: return None, 0
        v = seq[-1][1]; n = 0
        for x in reversed(seq):
            if x[1] is v: n += 1
            else: break
        return v, n
    def vs(g, t): return g["red"] if g["blue"] == t else g["blue"]
    def certain(g):
        """Vainqueur sûr : état final net (|indice| >= 1), ou imposé par le score officiel (balayage, dernière manche,
        ou toutes les autres manches de la série nettes)."""
        if g["lean"] is not None and abs(g["lean"]) >= 1: return True
        s = SER.get(g["mid"])
        if not s or s["sa"] is None: return False
        n = s["sa"] + s["sb"]; gids = s["gids"][:n]
        if min(s["sa"], s["sb"]) == 0 or (gids and gids[-1] == g["gid"]): return True
        return all(x == g["gid"] or (x in GID and GID[x]["lean"] is not None and abs(GID[x]["lean"]) >= 1) for x in gids)
    def sw(g): return g["blue"] if g["win"] == "b" else g["red"]
    def fin(g): return g["fin"] is True
    def timed(g): return bool(g["tv"]) and g["fin"] is True

    secs = []
    def section(fn): secs.append(fn); return fn

    # =====================================================================
    # 1. WORLDS (tournoi en cours)
    # =====================================================================
    W = [g for g in G if g["l"] == "worlds" and g["y"] == Y]
    WS = [s for s in S if s["l"] == "worlds" and s["t"][:4] == Y and s["sa"] is not None and s["sa"] != s["sb"]]
    nW = len(W)
    WY = "Worlds %s" % Y

    @section
    def w_ligues():   # 1a. bilan entre ligues (séries officielles)
        lr = collections.defaultdict(lambda: [0, 0])
        for s in WS:
            la, lb = LOT.get(s["A"]), LOT.get(s["B"])
            if not la or not lb or la == lb: continue
            aw = s["sa"] > s["sb"]; lr[la][0 if aw else 1] += 1; lr[lb][1 if aw else 0] += 1
        perfect = [(l, w) for l, (w, lo) in lr.items() if lo == 0 and w >= 3]; zero = [(l, lo) for l, (w, lo) in lr.items() if w == 0 and lo >= 3]
        if perfect or zero:
            parts = ["la %s a gagné ses %d séries contre les autres ligues" % (l, w) for l, w in perfect] + ["la %s a perdu les %d siennes" % (l, lo) for l, lo in zero]
            fact("w.ligues", "ligues", WY, "Aux %s, " % WY + " ; ".join(parts) + ".",
                 "Séries officielles des %s entre équipes de ligues différentes : " % WY + ", ".join("%s %d-%d" % (l, *v) for l, v in sorted(lr.items(), key=lambda kv: -kv[1][0])),
                 "au moins 3 séries pour la ligue citée ; score officiel (aucune déduction)", sum(sum(v) for v in lr.values()) // 2, 5, "A", [l for l, _ in perfect + zero], "séries")

    @section
    def w_encours():  # 1b. séries en cours (toutes compétitions suivies) des équipes encore aux Worlds
        alive = {s[k] for s in WS for k in ("A", "B")}
        cur = sorted(((trailing(team_seq(t))[1], t, trailing(team_seq(t))[0]) for t in alive if t in OURS), reverse=True)
        if cur and cur[0][0] >= 6 and cur[0][2]:
            n, t, _ = cur[0]; seq = team_seq(t)
            txt = "%s reste sur %d victoires de suite, toutes compétitions suivies confondues." % (tn(t), n)
            if not P.full: return hold("w.encours." + t, txt, "sans la mémoire du robot (C), une série absente du flux ne se voit pas")
            fact("w.encours." + t, "serie", Y, txt,
                 "Parties de %s en %s dans l'ordre (avec au moins 3 titulaires actuels) ; la série démarre le %s (%s %s)." % (t, Y, dfr(seq[-n][0]), LS.get(seq[-n][2]["l"], seq[-n][2]["l"]), _bn(seq[-n][2]["bn"])),
                 "série d'au moins 6 ; aucune partie officielle manquante dans la fenêtre", n, 4, "A", [t])

    @section
    def w_bilan():    # 1c. bilan en parties du tournoi
        rec = collections.defaultdict(lambda: [0, 0])
        for t, sd, g in team_games(Y, "worlds"): rec[t][0] += g["win"] == sd; rec[t][1] += 1
        best = sorted(((w / n, w, n, t) for t, (w, n) in rec.items() if n >= 5), reverse=True)
        if best and best[0][0] >= 0.75:
            r, w, n, t = best[0]
            fact("w.bilan." + t, "worlds", WY, "%s : %d victoires en %d parties à ces Worlds, le meilleur bilan du tournoi." % (tn(t), w, n),
                 "Toutes les parties des %s (Play-In + phase suisse) de %s." % (WY, t), "au moins 5 parties ; pas de taux affiché en dessous", n, 3, "B", [t])

    @section
    def w_records():  # 1d. records de parties (temps de jeu mesuré, pauses retirées)
        Wt = [g for g in W if timed(g)]
        if len(Wt) >= 8:
            a = min(Wt, key=lambda g: g["min"]); b = max(Wt, key=lambda g: g["min"])
            fact("w.courte", "duree", WY, "Partie la plus courte des Worlds pour l'instant : %s en %s face à %s (%d kills à %d)." % (tn(sw(a)), mmss(a["min"]), tn(vs(a, sw(a))), a["k"][a["win"]], a["k"][opp(a["win"])]),
                 "Temps de jeu mesuré dans le flux, pauses retirées, sur %d parties." % len(Wt), "flux complet (état « finished ») et temps de jeu mesuré", len(Wt), 3, "A", [sw(a), vs(a, sw(a))])
            fact("w.longue", "duree", WY, "Partie la plus longue : %s contre %s, %s de jeu (%s gagne)." % (tn(b["blue"]), tn(b["red"]), mmss(b["min"]), tn(sw(b))),
                 "Temps de jeu mesuré dans le flux, pauses retirées.", "flux complet et temps de jeu mesuré", len(Wt), 2, "A", [b["blue"], b["red"]])
        elif not P.full and W: hold("w.courte", "Partie la plus courte / la plus longue des Worlds", "sans C : temps de jeu mesuré inconnu")
        Wf = [g for g in W if fin(g)]
        if len(Wf) >= 8:
            c = max(Wf, key=lambda g: g["k"]["b"] + g["k"]["r"])
            fact("w.sanglante", "kills", WY, "Partie la plus sanglante : %s – %s, %d kills au total." % (tn(c["blue"]), tn(c["red"]), c["k"]["b"] + c["k"]["r"]),
                 "Somme des kills des 10 joueurs (le total d'équipe du flux compte aussi les exécutions).", "flux complet", nW, 2, "A", [c["blue"], c["red"]])

    @section
    def w_phoenix():  # 1e. le plus gros écart de kills perdu… et la série gagnée quand même
        for g in sorted(W, key=lambda g: -abs(g["k"]["b"] - g["k"]["r"])):
            lo = opp(g["win"]); t = g["blue"] if lo == "b" else g["red"]
            s = SER.get(g["mid"])
            if not s or s["sa"] is None: continue
            won = (s["sa"] > s["sb"]) == (s["A"] == t)
            if won and g["k"][g["win"]] - g["k"][lo] >= 12:
                fact("w.phoenix." + t, "remontee", WY, "%s a perdu la manche %d contre %s avec %d kill%s contre %d… puis a gagné la série %d-%d." % (
                    tn(t), g["n"], tn(vs(g, t)), g["k"][lo], "s" if g["k"][lo] > 1 else "", g["k"][g["win"]], max(s["sa"], s["sb"]), min(s["sa"], s["sb"])),
                    "Kills de la manche (flux) + score officiel de la série.", "écart d'au moins 12 kills dans la manche perdue ; série gagnée (score officiel)", 1, 5, "A", [t, vs(g, t)], "manches")
                break

    @section
    def w_champions():  # 1f. champions du tournoi
        ch = collections.Counter(); chw = collections.Counter()
        for g in W:
            for p in g["p"]: ch[p["C"]] += 1; chw[p["C"]] += p["W"]
        if nW < 10: return
        c, n = ch.most_common(1)[0]
        fact("w.champ.top", "champions", WY, "%s est le champion le plus joué des Worlds : %d parties sur %d (%s)." % (c, n, nW, pct(n, nW)),
             "Choix (picks) dans les %d parties ; les bannissements ne sont pas dans l'API." % nW, "au moins 10 parties dans le tournoi", nW, 3, "A", [c])
        fact("w.champ.div", "champions", WY, "Déjà %d champions différents joués en %d parties." % (len(ch), nW), "Champions distincts parmi les 10 joueurs de chaque partie.", "au moins 10 parties", nW, 2, "A")
        inv = sorted(((n, c) for c, n in ch.items() if n >= 5 and chw[c] == n), reverse=True)
        if inv: fact("w.champ.invaincu", "champions", WY, "%s n'a pas encore perdu à ces Worlds : %d victoires en %d parties." % (inv[0][1], inv[0][0], inv[0][0]),
                     "Résultat de chaque partie où le champion a été joué.", "au moins 5 parties (sinon trop fragile)", inv[0][0], 3, "B", [inv[0][1]])
        cur_ = sorted(((chw[c] / n, -n, c) for c, n in ch.items() if n >= 6))
        if cur_ and cur_[0][0] <= 0.2:
            r, mn, c = cur_[0]
            fact("w.champ.maudit", "champions", WY, "%s, le piège du tournoi : %d victoire%s en %d parties." % (c, chw[c], "s" if chw[c] > 1 else "", -mn),
                 "Résultat de chaque partie où le champion a été joué.", "au moins 6 parties", -mn, 3, "B", [c])

    @section
    def w_joueurs():  # 1g. joueurs du tournoi
        if not W: return
        wr = [(p, g) for g in W for p in g["p"]]
        wf = [(p, g) for p, g in wr if fin(g)]
        if wf:
            p, g = max(wf, key=lambda x: (x[0]["k"], -x[0]["d"]))
            fact("w.kills.partie", "record", WY, "Record de kills sur une partie : %s, %d/%d/%d sur %s contre %s." % (p["nm"].strip(), p["k"], p["d"], p["a"], p["C"], tn(vs(g, p["team"]))),
                 "K/D/A de fin de partie (flux).", "flux complet", nW, 3, "A", [p["key"] or p["team"]])
        tk = collections.Counter(); tg_ = collections.Counter(); kk = {}
        for p, g in wr:
            x = (p["nm"].strip(), p["team"]); tk[x] += p["k"]; tg_[x] += 1
            if p["key"]: kk[x] = p["key"]
        (nm, t), k = tk.most_common(1)[0]
        fact("w.kills.total", "record", WY, "%s (%s) est le meilleur tueur du tournoi : %d kills en %d parties." % (nm, t, k, tg_[(nm, t)]),
             "Somme des kills.", "aucune (c'est un total) ; affiché avec le nombre de parties", tg_[(nm, t)], 3, "A", [kk.get((nm, t)) or t])

    @section
    def w_remontee():  # 1h. remontée du tournoi (or à 15 min)
        cb = sorted(((-gd(g, g["win"]), g) for g in W if g["ok15"] and fin(g)), key=lambda x: -x[0])
        if cb and cb[0][0] >= 2500:
            d, g = cb[0]; t = sw(g)
            fact("w.remontee", "remontee", WY, "Plus belle remontée du tournoi : %s, mené de %s pièces d'or à 15 min, a battu %s." % (tn(t), sp(d), tn(vs(g, t))),
                 "Or total des 5 joueurs à la 15e minute de jeu (pauses retirées).", "retard d'au moins 2 500 or ; image de 15 min plausible ; flux complet", 1, 3, "B", [t, vs(g, t)])

    @section
    def w_nouveaux():  # 1i. nouveaux venus (jamais « premiers Worlds » : nos données commencent en 2024)
        seen = collections.defaultdict(set)
        for p, g in prows(league="worlds"): seen[p["key"]].add(g["y"])
        prev = sorted({g["y"] for g in G if g["l"] == "worlds" and g["y"] < Y})
        new = sorted(pid(k) for k, ys in seen.items() if Y in ys and not ys - {Y})
        if new and len(prev) >= 2:
            fact("w.nouveaux", "joueurs", WY, "%d des %d titulaires n'avaient joué ni les Worlds %s ni ceux de %s." % (len(new), len(PL), prev[-2], prev[-1]),
                 "Joueurs présents dans au moins une partie des %s, absents des parties des Worlds %s." % (WY, " et ".join(prev[-2:])),
                 "jamais « premiers Worlds » : nos données commencent en %s" % prev[0], len(PL), 2, "A", [], "titulaires")

    @section
    def w_veteran():  # 1j. Worlds depuis le début des données
        wg = collections.Counter(); ww = collections.Counter(); wk = collections.Counter()
        for p, g in prows(league="worlds"): wg[p["key"]] += 1; ww[p["key"]] += p["W"]; wk[p["key"]] += p["k"]
        if not wg: return
        y0 = min(g["y"] for g in G if g["l"] == "worlds")
        k, n = wg.most_common(1)[0]; ties = sorted((pid(x) for x, m in wg.items() if m == n), key=lambda x: x != "Faker")
        fact("w.veteran", "joueurs", "Worlds %s-%s" % (y0, Y), "%s : %d parties de Worlds depuis %s (%d victoires), le plus gros total des titulaires." % (" , ".join(ties).replace(" ,", ","), n, y0, ww[k]),
             "Parties des Worlds %s à %s (Play-In compris)." % (y0, Y), "horizon des données : %s" % y0, n, 2, "A", [x for x, m in wg.items() if m == n])
        k, n = wk.most_common(1)[0]
        fact("w.tueur", "joueurs", "Worlds %s-%s" % (y0, Y), "%s a fait %d kills aux Worlds depuis %s, plus que tout autre titulaire." % (pid(k), n, y0), "Somme des kills.", "horizon %s" % y0, wg[k], 3, "A", [k])

    @section
    def w_style():  # 1k. style du tournoi contre les éditions précédentes (barrière statistique)
        ys = sorted({g["y"] for g in G if g["l"] == "worlds" and g["y"] < Y})[-2:]
        kpg = {y: [g["k"]["b"] + g["k"]["r"] for g in G if g["l"] == "worlds" and g["y"] == y] for y in ys + [Y]}
        a = kpg[Y]; b = [x for y in ys for x in kpg[y]]
        if len(a) >= 2 and len(b) >= 2 and len(ys) == 2:
            z = (statistics.mean(b) - statistics.mean(a)) / math.sqrt(statistics.variance(a) / len(a) + statistics.variance(b) / len(b))
            fact("w.style.kills", "style", WY, "Des Worlds plus %s : %s kills par partie, contre %s en %s et %s en %s." % (
                "sages" if z > 0 else "sanglants", fr(statistics.mean(a)), fr(statistics.mean(kpg[ys[1]])), ys[1], fr(statistics.mean(kpg[ys[0]])), ys[0]),
                 "Moyenne des kills par partie ; écart testé (z = %s)." % fr(z, 2), "au moins 40 parties ET écart d'au moins 2 erreurs types", len(a), 3, "B",
                 ok=len(a) >= 40 and abs(z) >= 2, why="%d parties seulement (40 requises)" % len(a) if len(a) < 40 else "écart non significatif")
        if nW:
            bw = sum(g["win"] == "b" for g in W); lo, hi = wilson(bw, nW)
            fact("w.bleu", "intelligence", WY, "Le côté bleu gagne %s des parties de ces Worlds (%d sur %d)." % (pct(bw, nW), bw, nW),
                 "Intervalle de confiance à 95 %% : %s-%s %%." % (fr(100 * lo), fr(100 * hi)), "au moins 40 parties ET intervalle qui exclut 50 %", nW, 2, "B",
                 ok=nW >= 40 and (lo > 0.5 or hi < 0.5), why="%d parties, intervalle %s-%s %% : pas d'avantage démontré" % (nW, fr(100 * lo, 0), fr(100 * hi, 0)))

    @section
    def w_premiere():  # 1l. premières victoires (depuis le début des données) aux Worlds
        y0 = S[0]["t"][:4] if S else Y
        for s in WS:
            if s["A"] not in OURS or s["B"] not in OURS: continue
            win = s["A"] if s["sa"] > s["sb"] else s["B"]; los = s["B"] if win == s["A"] else s["A"]
            prev = [x for x in S if x["t"] < s["t"] and {x["A"], x["B"]} == {win, los} and x["sa"] is not None and x["sa"] != x["sb"]]
            pw = sum(1 for x in prev if (x["A"] if x["sa"] > x["sb"] else x["B"]) == win)
            if len(prev) >= 2 and pw == 0:
                fact("w.premiere.%s.%s" % (win, los), "premiere", WY, "Première victoire de %s sur %s depuis %s (0 sur %d auparavant)." % (tn(win), tn(los), y0, len(prev)),
                     "Toutes les séries entre les deux équipes depuis janvier %s." % y0, "au moins 2 défaites avant ; « depuis %s » obligatoire (horizon des données)" % y0, len(prev) + 1, 4, "A", [win, los], "séries")

    # =====================================================================
    # 2. SAISON : ÉQUIPES
    # =====================================================================
    TG = list(team_games(Y))

    @section
    def s_series():
        SEQ = {t: team_seq(t) for t in OURS}
        for val, lab, wow in ((True, "victoires", 4), (False, "défaites", 4)):
            best = sorted(((runs(SEQ[t], val)[0], t) for t in OURS), reverse=True)
            n, t = best[0]
            if not n: continue
            _, (a, b) = runs(SEQ[t], val)
            ties = [x for m, x in best if m == n and x != t]
            fid = "s.serie.%s.%s" % ("v" if val else "d", t)
            txt = "Plus longue série de %s en %s : %s, %d parties d'affilée (du %s au %s)%s." % (
                lab, Y, tn(t), n, dfr(a[0]), dfr(b[0]), (", à égalité avec " + ", ".join(tn(x) for x in ties)) if ties else "")
            if not P.full: hold(fid, txt, "sans la mémoire du robot (C), une série absente du flux ne se voit pas"); continue
            fact(fid, "serie", Y, txt, "Parties %s dans l'ordre chronologique, comptées seulement avec au moins 3 titulaires actuels ; une partie sans données coupe la série." % Y,
                 "série d'au moins 8 ; fenêtre sans partie manquante", n, wow, "A", [t] + ties)

    @section
    def s_avance():   # conversion d'avance / remontées (or à 15 min)
        conv = collections.defaultdict(lambda: [0, 0, 0, 0])
        for t, sd, g in TG:
            if not g["ok15"]: continue
            d = gd(g, sd); w = g["win"] == sd
            if d >= 2500: conv[t][0] += w; conv[t][1] += 1
            if d <= -2500: conv[t][2] += w; conv[t][3] += 1
        pf = sorted(((v[1], t) for t, v in conv.items() if v[0] == v[1] and v[1] >= 15), reverse=True)
        if pf:
            n, t = pf[0]
            fact("s.avance." + t, "intelligence", Y, "%s n'a perdu AUCUNE des %d parties de %s où elle menait de 2 500 or ou plus à 15 minutes." % (tn(t), n, Y),
                 "Écart d'or d'équipe à la 15e minute de jeu ; parties avec au moins 3 titulaires actuels.", "au moins 15 parties concernées", n, 4, "A", [t])
        nc = sorted(((v[3], t) for t, v in conv.items() if v[2] == 0 and v[3] >= 10), reverse=True)
        for n, t in nc[:2]:
            fact("s.retard." + t, "intelligence", Y, "%s n'a jamais gagné en %s une partie où elle était menée de 2 500 or à 15 minutes (0 sur %d)." % (tn(t), Y, n),
                 "Écart d'or d'équipe à la 15e minute de jeu ; parties avec au moins 3 titulaires actuels.", "au moins 10 parties concernées", n, 3, "A", [t])

    @section
    def s_cote():     # côtés
        by = collections.defaultdict(lambda: [0, 0, 0, 0])
        for t, sd, g in TG:
            x = by[t]
            if sd == "b": x[0] += g["win"] == sd; x[1] += 1
            else: x[2] += g["win"] == sd; x[3] += 1
        sides = []
        for t, (bw, nb, rw, nr) in by.items():
            if nb < 25 or nr < 25: continue
            p1, p2 = bw / nb, rw / nr; pp = (bw + rw) / (nb + nr)
            if pp in (0, 1): continue
            z = (p1 - p2) / math.sqrt(pp * (1 - pp) * (1 / nb + 1 / nr))
            sides.append((abs(z), t, bw, nb, rw, nr, z))
        sides.sort(reverse=True)
        if sides and sides[0][0] >= 2.5:
            _, t, bw, nb, rw, nr, z = sides[0]; good, bad = ("bleu", "rouge") if z > 0 else ("rouge", "bleu")
            fact("s.cote." + t, "intelligence", Y, "%s est une autre équipe côté %s : %s de victoires (%d/%d), contre %s côté %s (%d/%d)." % (
                tn(t), good, pct(bw if z > 0 else rw, nb if z > 0 else nr), bw if z > 0 else rw, nb if z > 0 else nr, pct(rw if z > 0 else bw, nr if z > 0 else nb), bad, rw if z > 0 else bw, nr if z > 0 else nb),
                 "Taux de victoire par côté, test d'écart entre deux proportions (z = %s)." % fr(z, 1), "au moins 25 parties de chaque côté ET z ≥ 2,5", nb + nr, 4, "A", [t])

    def team_series(s, t):
        """La série compte-t-elle pour l'équipe t ? Non si elle a été jouée par un autre effectif (académie en KeSPA Cup ou en VCS)."""
        gs = [GID[x] for x in s["gids"] if x in GID]
        if gs and not any(side_ok(g, "b" if g["blue"] == t else "r") for g in gs): return False
        if not gs and s["l"] in ACADEMY: return False
        return True

    @section
    def s_bo5():      # Bo5 et manches décisives (séries officielles)
        bo5 = collections.defaultdict(lambda: [0, 0]); dec = collections.defaultdict(lambda: [0, 0])
        for s in S:
            if s["t"][:4] != Y or s["sa"] is None or s["sa"] == s["sb"]: continue
            win = s["A"] if s["sa"] > s["sb"] else s["B"]
            for t in (s["A"], s["B"]):
                if t not in OURS or not team_series(s, t): continue
                if s["bo"] == 5: bo5[t][0 if t == win else 1] += 1
                if s["bo"] in (3, 5) and s["sa"] + s["sb"] == s["bo"]: dec[t][0 if t == win else 1] += 1
        b = sorted(((w / (w + l), w, l, t) for t, (w, l) in bo5.items() if w + l >= 10), reverse=True)
        if b:
            b = b[0]
            fact("s.bo5." + b[3], "serie", Y, "%s en Bo5 cette année : %d séries gagnées, %d perdues." % (tn(b[3]), b[1], b[2]), "Scores officiels des séries en 5 manches de %s." % Y,
                 "au moins 10 Bo5", b[1] + b[2], 3, "A", [b[3]], "séries")
        d = sorted(((w / (w + l), w, l, t) for t, (w, l) in dec.items() if w + l >= 10), reverse=True)
        for r, w, l, t in d[:2]:
            fact("s.decisive." + t, "serie", Y, "Sang-froid : %s a gagné %d des %d manches décisives jouées en %s (3e manche d'un Bo3, 5e d'un Bo5)." % (tn(t), w, w + l, Y),
                 "Séries allées jusqu'à la dernière manche possible (score officiel).", "au moins 10 manches décisives", w + l, 3, "A", [t], "manches décisives")

    @section
    def s_reverse():  # reverse sweeps (0-2 puis 3-2)
        rs = collections.defaultdict(list); rsv = collections.defaultdict(list)
        for s in S:
            if s["t"][:4] != Y or s["bo"] != 5 or s["sa"] is None or s["sa"] + s["sb"] != 5: continue
            gs = [GID.get(x) for x in s["gids"][:5]]
            if None in gs: continue
            win = s["A"] if s["sa"] > s["sb"] else s["B"]; los = s["B"] if win == s["A"] else s["A"]
            seq = [sw(g) == win for g in gs]
            if seq[:2] == [False, False] and all(certain(g) for g in gs):
                rs[win].append((s, los)); rsv[los].append((s, win))
        for t, l in sorted(rs.items(), key=lambda kv: -len(kv[1])):
            if len(l) >= 2 and t in OURS:
                fact("s.reverse." + t, "remontee", Y, "%s a réussi %d « reverse sweeps » en %s (0-2 puis 3-2) : %s." % (tn(t), len(l), Y, ", ".join("contre %s (%s, %s)" % (tn(o), LS.get(s["l"], s["l"]), dfr(s["t"])) for s, o in l)),
                     "Vainqueur de chaque manche (déduit de l'état final) + score officiel.", "vainqueur certain dans les 5 manches (état final net ou imposé par le score)", len(l), 4, "A", [t] + [o for s, o in l], "séries")
        for t, l in sorted(rsv.items(), key=lambda kv: -len(kv[1])):
            if len(l) >= 2 and t in OURS:
                fact("s.reversed." + t, "remontee", Y, "%s a subi %d « reverse sweeps » en %s : mené 2-0, perdu 2-3 contre %s." % (tn(t), len(l), Y, " puis ".join("%s (%s)" % (tn(o), dfr(s["t"])) for s, o in l)),
                     "Vainqueur de chaque manche (déduit de l'état final) + score officiel.", "vainqueur certain dans les 5 manches (état final net ou imposé par le score)", len(l), 4, "A", [t] + [o for s, o in l], "séries")

    @section
    def s_records():  # records de parties de l'année (nos équipes)
        wins = [(t, sd, g) for t, sd, g in TG if g["win"] == sd and timed(g)]
        if wins:
            t, sd, g = min(wins, key=lambda x: x[2]["min"])
            fact("s.rapide." + t, "duree", Y, "Victoire la plus rapide de l'année : %s contre %s en %s (%d kills à %d), %s." % (tn(t), tn(vs(g, t)), mmss(g["min"]), g["k"][sd], g["k"][opp(sd)], LS.get(g["l"], g["l"])),
                 "Temps de jeu mesuré, pauses retirées, parties de nos 19 équipes.", "temps de jeu mesuré ; flux complet", len(wins), 4, "A", [t, vs(g, t)], "victoires")
        lgs = [g for t, sd, g in TG if timed(g)]
        if lgs:
            lg = max(lgs, key=lambda g: g["min"])
            fact("s.longue", "duree", Y, "Partie la plus longue de l'année : %s – %s, %s de jeu (%s, %s)." % (tn(lg["blue"]), tn(lg["red"]), mmss(lg["min"]), LS.get(lg["l"], lg["l"]), dfr(lg["t"])),
                 "Temps de jeu mesuré, pauses retirées, parties de nos 19 équipes.", "temps de jeu mesuré ; flux complet", len(TG), 3, "A", [lg["blue"], lg["red"]])
        if not P.full: hold("s.rapide", "Records de durée, victoires sans kills, remontée de l'année", "sans C : flux complet et temps de jeu inconnus")

    @section
    def s_kills():
        cand = [(t, sd, g) for t, sd, g in TG if g["win"] == sd and fin(g)]
        if cand:
            t, sd, g = min(cand, key=lambda x: (x[2]["k"][x[1]], x[2]["k"][opp(x[1])]))
            fact("s.radin." + t, "kills", Y, "Gagner sans tuer : %s a battu %s avec seulement %d kill%s (%d en face), %s %s." % (tn(t), tn(vs(g, t)), g["k"][sd], "s" if g["k"][sd] > 1 else "", g["k"][opp(sd)], LS.get(g["l"], g["l"]), dfr(g["t"])),
                 "Kills de l'équipe gagnante.", "flux complet", len(TG), 3, "A", [t, vs(g, t)])
        cand = [(t, sd, g) for t, sd, g in TG if g["win"] != sd and fin(g) and certain(g)]
        if cand:
            t, sd, g = max(cand, key=lambda x: x[2]["k"][x[1]] - x[2]["k"][opp(x[1])])
            fact("s.kills.perdu." + t, "kills", Y, "%s a fait %d kills contre %d… et a perdu (%s contre %s, %s)." % (tn(t), g["k"][sd], g["k"][opp(sd)], LS.get(g["l"], g["l"]), tn(vs(g, t)), dfr(g["t"])),
                 "Kills des deux équipes ; vainqueur déduit et certain.", "vainqueur certain (état final net ou imposé par le score de la série)", len(TG), 4, "A", [t, vs(g, t)])
        cbk = [(-gd(g, sd), t, sd, g) for t, sd, g in TG if g["ok15"] and g["win"] == sd and fin(g) and certain(g)]
        if cbk:
            d, t, sd, g = max(cbk, key=lambda x: (x[0], x[3]["t"]))
            fact("s.remontee." + t, "remontee", Y, "Remontée de l'année : %s, mené de %s or à 15 minutes contre %s, a gagné (%s, %s)." % (tn(t), sp(d), tn(vs(g, t)), LS.get(g["l"], g["l"]), dfr(g["t"])),
                 "Or d'équipe à la 15e minute de jeu.", "image de 15 min plausible ; vainqueur net", len(cbk), 4, "B", [t, vs(g, t)])

    @section
    def s_dragons():
        wins = [(t, sd, g) for t, sd, g in TG if g["win"] == sd and g["drg"] is not None]
        if len(wins) >= 200:
            nod = sum(1 for t, sd, g in wins if g["drg"][sd] == 0)
            fact("s.dragons", "intelligence", Y, "Gagner sans dragon, c'est presque impossible : %d victoires sur %d en %s (%s)." % (nod, len(wins), Y, pct(nod, len(wins), 1)),
                 "Dragons d'équipe en fin de partie, victoires de nos 19 équipes.", "au moins 200 victoires", len(wins), 3, "A", [], "victoires")
        elif not P.full: hold("s.dragons", "Gagner sans dragon…", "sans C : dragons inconnus")

    @section
    def h2h():        # face-à-face depuis le début des données (séries officielles)
        y0 = S[0]["t"][:4] if S else Y
        hh = collections.defaultdict(list)
        for s in S:
            if s["sa"] is None or s["sa"] == s["sb"] or s["A"] not in OURS or s["B"] not in OURS: continue
            if not (team_series(s, s["A"]) and team_series(s, s["B"])): continue
            hh[tuple(sorted([s["A"], s["B"]]))].append(s)
        dom = []
        for (a, b), v in hh.items():
            wa = sum(1 for s in v if (s["A"] if s["sa"] > s["sb"] else s["B"]) == a)
            if len(v) >= 10: dom.append((max(wa, len(v) - wa) / len(v), len(v), a if wa >= len(v) - wa else b, b if wa >= len(v) - wa else a, max(wa, len(v) - wa), min(wa, len(v) - wa)))
        for r, n, x, y, w, l in sorted(dom, key=lambda d: (-(d[4] - d[5]), -d[0], -d[1], d[2], d[3]))[:4]:
            if r >= 0.7: fact("h.dom.%s.%s" % (x, y), "duel_equipes", "depuis %s" % y0, "%s domine %s : %d séries gagnées, %d perdues depuis %s." % (tn(x), tn(y), w, l, y0),
                              "Toutes les séries officielles entre les deux équipes depuis janvier %s." % y0, "au moins 10 séries ; ≥ 70 %", n, 3, "A", [x, y], "séries")
        cs_ = []
        for (a, b), v in hh.items():
            v = sorted(v, key=lambda s: s["t"]); last = v[-1]; wl = last["A"] if last["sa"] > last["sb"] else last["B"]; n = 0
            for s in reversed(v):
                if (s["A"] if s["sa"] > s["sb"] else s["B"]) == wl: n += 1
                else: break
            cs_.append((n, wl, b if wl == a else a, len(v)))
        for n, x, y, tot in sorted(cs_, reverse=True):
            if n >= 4 and (n >= 6 or tot >= 20): fact("h.encours.%s.%s" % (x, y), "duel_equipes", "depuis %s" % y0, "%s a gagné ses %d dernières séries contre %s." % (tn(x), n, tn(y)),
                                                     "Séries officielles, ordre chronologique.", "au moins 4 séries de suite", tot, 3, "A", [x, y], "séries")

    # =====================================================================
    # 3. LIGUES (comparables seulement : matchs directs, ou style de jeu dans chaque ligue)
    # =====================================================================
    @section
    def ligues():
        home = {}
        for s in S:
            if s["t"][:4] == Y and s["l"] in ("lck", "lpl", "lec", "lcs", "cblol-brazil", "lcp"):
                for t in (s["A"], s["B"]): home.setdefault(t, LS[s["l"]])
        home.update(LOT)
        rec = collections.defaultdict(lambda: [0, 0, 0, 0])
        for s in S:
            if s["t"][:4] != Y or s["l"] not in INTL or s["sa"] is None or s["sa"] == s["sb"]: continue
            la, lb = home.get(s["A"]), home.get(s["B"])
            if not la or not lb or la == lb: continue
            aw = s["sa"] > s["sb"]
            for me, ot, w, gw, gl in ((la, lb, aw, s["sa"], s["sb"]), (lb, la, not aw, s["sb"], s["sa"])):
                r = rec[(me, ot)]; r[0] += w; r[1] += 1 - w; r[2] += gw; r[3] += gl
        tot = collections.defaultdict(lambda: [0, 0])
        for (me, ot), r in rec.items(): tot[me][0] += r[0]; tot[me][1] += r[1]
        if tot:
            evs = [LS[l] for l in ("first_stand", "msi", "ewc_lol", "americas_cup", "worlds") if any(s["l"] == l and s["t"][:4] == Y for s in S)]
            l, (w, lo) = max(tot.items(), key=lambda kv: kv[1][0] / sum(kv[1]))
            fact("l.inter." + l, "ligues", Y, "La %s a gagné %d des %d séries jouées contre les autres ligues en %s (%s)." % (l, w, w + lo, Y, ", ".join(evs)),
                 "Séries officielles internationales entre équipes de ligues différentes : " + ", ".join("%s %d-%d" % (k, *v) for k, v in sorted(tot.items(), key=lambda kv: -kv[1][0])),
                 "seule comparaison de niveau entre ligues autorisée : les matchs directs", w + lo, 4, "A", [l], "séries")
        clean = sorted(((r[2], me, ot, r) for (me, ot), r in rec.items() if r[3] == 0 and r[2] >= 6), reverse=True)
        if clean:
            _, me, ot, r = clean[0]
            fact("l.blanc.%s.%s" % (me, ot), "ligues", Y, "En %s, la %s n'a pas lâché une seule manche à la %s : %d séries, %d manches à 0." % (Y, me, ot, r[0], r[2]),
                 "Séries internationales officielles.", "au moins 6 manches", r[2], 4, "A", [me, ot], "manches")
        r = rec.get(("LCK", "LPL"))
        if r and r[0] + r[1] >= 5:
            fact("l.lcklpl", "ligues", Y, "LCK contre LPL en %s : %d séries à %d, %d manches à %d." % (Y, r[0], r[1], r[2], r[3]), "Séries internationales officielles.", "au moins 5 séries", r[0] + r[1], 3, "A", ["LCK", "LPL"], "séries")

    @section
    def styles():
        sty = {}
        for lg in ("lck", "lpl", "lec", "lcs", "cblol-brazil", "lcp", "vcs", "pcs"):
            gs = [g for g in G if g["y"] == Y and g["l"] == lg]
            if len(gs) < 80: continue
            g15 = [g for g in gs if g["ok15"] and abs(g["d15"]) >= 2000]
            sty[LS[lg]] = (len(gs), sum(g["k"]["b"] + g["k"]["r"] for g in gs) / len(gs), sum(1 for g in g15 if gd(g, g["win"]) < 0), len(g15), sum(g["win"] == "b" for g in gs))
        if len(sty) >= 2:
            hi = max(sty.items(), key=lambda kv: kv[1][1]); lo_ = min(sty.items(), key=lambda kv: kv[1][1])
            fact("l.kills", "style", Y, "La %s est la ligue la plus sanglante : %s kills par partie, contre %s en %s, la plus sage." % (hi[0], fr(hi[1][1]), fr(lo_[1][1]), lo_[0]),
                 "Kills par partie, toutes les parties %s de chaque ligue : " % Y + ", ".join("%s %s" % (k, fr(v[1])) for k, v in sorted(sty.items(), key=lambda kv: -kv[1][1])),
                 "style de jeu, pas de niveau ; au moins 80 parties par ligue", sum(v[0] for v in sty.values()), 3, "A", [hi[0], lo_[0]])
        cr = {k: (v[2], v[3]) for k, v in sty.items() if v[3] >= 60}
        if len(cr) >= 2:
            a = max(cr.items(), key=lambda kv: kv[1][0] / kv[1][1]); b = min(cr.items(), key=lambda kv: kv[1][0] / kv[1][1])
            pa, pb = a[1][0] / a[1][1], b[1][0] / b[1][1]; pp = (a[1][0] + b[1][0]) / (a[1][1] + b[1][1])
            z = (pa - pb) / math.sqrt(pp * (1 - pp) * (1 / a[1][1] + 1 / b[1][1])) if 0 < pp < 1 else 0
            fact("l.remontees", "style", Y, "En %s, rien n'est joué à 15 minutes : l'équipe menée de 2 000 or a gagné %s des parties (%d/%d), contre %s en %s." % (a[0], pct(*a[1]), *a[1], pct(*b[1]), b[0]),
                 "Parties avec au moins 2 000 or d'écart à 15 min ; part gagnée par l'équipe en retard (z = %s)." % fr(z, 1), "au moins 60 parties concernées par ligue ; z ≥ 2", a[1][1] + b[1][1], 3, "B", [a[0], b[0]],
                 ok=abs(z) >= 2, why="écart non significatif")
        lck = sty.get("LCK")
        if lck:
            lo, hi_ = wilson(lck[4], lck[0])
            fact("l.bleu.lck", "intelligence", Y, "En LCK, le côté bleu gagne %s des parties en %s (%d sur %d)." % (pct(lck[4], lck[0], 1), Y, lck[4], lck[0]),
                 "Intervalle de confiance à 95 %% : %s-%s %%." % (fr(100 * lo), fr(100 * hi_)), "affiché seulement si l'intervalle exclut 50 %", lck[0], 2, "A", ["LCK"], ok=lo > 0.5 or hi_ < 0.5, why="intervalle contient 50 %")

    # =====================================================================
    # 4. JOUEURS (nos 95 titulaires)
    # =====================================================================
    RA = [(p, g) for p, g in prows(Y) if g["l"] != "kespa_cup" or g["main"][p["side"]]]   # mêmes lignes que le robot (totaux)
    Rr = [(p, g) for p, g in RA if fin(g)]                                                 # records d'une partie : flux complet seulement

    def rec1(fid, txt, f, wow, cond="flux complet", flt=lambda p, g: True):
        c = [(f(p, g), p, g) for p, g in Rr if flt(p, g) and f(p, g) is not None]
        if not c:
            if not P.full: hold(fid, fid, "sans C : flux complet inconnu")
            return
        v, p, g = max(c, key=lambda x: (x[0], x[2]["t"]))
        fact(fid, "record", Y, txt(v, p, g), "Maximum sur %s lignes joueur-partie de %s (nos 95 titulaires)." % (sp(len(c)), Y), cond, len(c), 4, "A", [p["key"]], "lignes joueur-partie")

    @section
    def p_records():
        rec1("p.kills", lambda v, p, g: "Record de kills de l'année : %s, %d/%d/%d sur %s contre %s (%s, %s)." % (pid(p["key"]), p["k"], p["d"], p["a"], p["C"], tn(vs(g, p["team"])), LS.get(g["l"], g["l"]), dfr(g["t"])), lambda p, g: p["k"], 5)
        rec1("p.parfait", lambda v, p, g: "Partie parfaite : %s, %d/0/%d sur %s contre %s (%s)." % (pid(p["key"]), p["k"], p["a"], p["C"], tn(vs(g, p["team"])), dfr(g["t"])), lambda p, g: p["k"] + p["a"] if p["d"] == 0 else None, 3)
        rec1("p.degats", lambda v, p, g: "%s a infligé %s des dégâts de son équipe sur %s (%s, %s), record de l'année." % (pid(p["key"]), pct(v, 1), p["C"], LS.get(g["l"], g["l"]), dfr(g["t"])), lambda p, g: p["ds"], 3)
        rec1("p.balises", lambda v, p, g: "%s a posé %d balises dans une seule partie (%s, %s de jeu)." % (pid(p["key"]), v, p["C"], mmss(g["min"])), lambda p, g: p["wp"], 3)
        rec1("p.csmin", lambda v, p, g: "Farm record : %s, %s CS par minute sur %s (%s de jeu, %s)." % (pid(p["key"]), fr(v, 2), p["C"], mmss(g["min"]), dfr(g["t"])), lambda p, g: p["cs"] / g["min"],
             3, "temps de jeu mesuré ; au moins 25 min", lambda p, g: g["tv"] and g["min"] >= 25)
        rec1("p.kp", lambda v, p, g: "%s a participé aux %d kills de son équipe dans la même partie (%d/%d/%d sur %s)." % (pid(p["key"]), v, p["k"], p["d"], p["a"], p["C"]),
             lambda p, g: p["tk"] if p["tk"] >= 15 and p["k"] + p["a"] == p["tk"] else None, 3, "au moins 15 kills d'équipe")
        rec1("p.gd15", lambda v, p, g: "Plus gros écart à 15 minutes : %s, %s or d'avance sur son vis-à-vis (%s, %s)." % (pid(p["key"]), sp(v), p["C"], dfr(g["t"])), lambda p, g: p["gd15"], 3, "image de 15 min plausible")

    A = collections.defaultdict(collections.Counter); CH = collections.defaultdict(collections.Counter); CW = collections.defaultdict(collections.Counter)
    for p, g in RA:
        a = A[p["key"]]; a["g"] += 1; a["w"] += p["W"]; a["k"] += p["k"]; a["d"] += p["d"]; a["a"] += p["a"]; a["d0"] += p["d"] == 0
        if p["gd15"] is not None: a["n15"] += 1; a["gd15"] += p["gd15"]
        CH[p["key"]][p["C"]] += 1; CW[p["key"]][p["C"]] += p["W"]

    @section
    def p_totaux():
        if not A: return
        k = max(A, key=lambda k: (A[k]["d0"], -A[k]["g"]))
        fact("p.immortel." + k, "joueurs", Y, "%s a fini %d parties sans mourir une seule fois en %s (sur %d)." % (pid(k), A[k]["d0"], Y, A[k]["g"]), "Parties avec 0 mort.", "aucune (total)", A[k]["g"], 4, "A", [k])
        ks = [k for k in A if A[k]["g"] >= 40]
        if ks:
            k = max(ks, key=lambda k: (A[k]["k"] + A[k]["a"]) / max(1, A[k]["d"]))
            fact("p.kda." + k, "joueurs", Y, "Meilleur KDA de l'année : %s, %s sur %d parties." % (pid(k), fr((A[k]["k"] + A[k]["a"]) / max(1, A[k]["d"]), 2), A[k]["g"]), "(kills + assists) / morts, sommes de l'année.", "au moins 40 parties", A[k]["g"], 3, "A", [k])
        k = max(A, key=lambda k: (len(CH[k]), -A[k]["g"]))
        ties = [x for x in A if len(CH[x]) == len(CH[k]) and x != k]
        fact("p.pool." + k, "joueurs", Y, "Le joueur le plus imprévisible : %s a joué %d champions différents en %s%s." % (pid(k), len(CH[k]), Y, (" (comme " + ", ".join(pid(x) for x in ties) + ")") if ties else ""),
             "Champions distincts par joueur.", "aucune", A[k]["g"], 3, "A", [k] + ties)
        ks = [k for k in A if A[k]["g"] >= 60]
        if ks:
            k = max(ks, key=lambda k: CH[k].most_common(1)[0][1])
            c, n = CH[k].most_common(1)[0]
            fact("p.signature." + k, "joueurs", Y, "Champion signature : %s a joué %s %d fois en %s (%d victoires)." % (pid(k), c, n, Y, CW[k][c]), "Parties par couple joueur-champion.", "au moins 60 parties pour le joueur", n, 3, "A", [k, c])

    @section
    def p_maitrise():
        CL = collections.defaultdict(set)
        for p, g in RA: CL[(p["key"], p["C"])].add(LS.get(g["l"], g["l"]))
        best = sorted(((CW[k][c] / n, n, k, c) for k in CH for c, n in CH[k].items() if n >= 10), reverse=True)
        cond = "au moins 10 parties ; compétitions citées (les qualifications EWC et la KeSPA Cup 2025 ne sont pas dans l'API) ; jamais de bilan parfait"
        out = 0
        for r, n, k, c in best:
            w = CW[k][c]; lo, _ = wilson(w, n)
            txt = "%s sur %s : %d victoires en %d parties en %s (%s)." % (pid(k), c, w, n, Y, ", ".join(sorted(CL[(k, c)])))
            if w == n:   # « invaincu » : une défaite hors API suffit à le rendre faux (Busio sur Lulu : 11-1 sur gol.gg)
                hold("p.maitrise.%s.%s" % (k, c), txt, "bilan parfait non vérifiable : qualifications EWC et KeSPA Cup 2025 absentes de l'API"); continue
            fact("p.maitrise.%s.%s" % (k, c), "joueurs", Y, txt, "Résultats des parties du joueur sur ce champion. Borne basse de confiance : %s." % pct(lo, 1), cond, n, 3, "B", [k, c])
            out += 1
            if out == 3: break

    @section
    def p_lane():
        for role in ("BOT", "MID", "TOP"):
            c = [(A[k]["gd15"] / A[k]["n15"], k) for k in A if A[k]["n15"] >= 40 and PL[k]["role"] == role]
            if not c: continue
            v, k = max(c)
            fact("p.gd15.%s.%s" % (role, k), "intelligence", Y, "%s écrase sa lane : %s or d'avance en moyenne à 15 minutes sur %d parties, le meilleur %s des Worlds." % (
                pid(k), sp(round(v)), A[k]["n15"], {"BOT": "ADC", "MID": "mid", "TOP": "top"}[role]),
                 "Moyenne de l'écart d'or avec le vis-à-vis à 15 min de jeu (même méthode que gol.gg), parties de %s." % Y, "au moins 40 parties avec image de 15 min", A[k]["n15"], 3, "A", [k])

    # =====================================================================
    # 5. DUELS DE LANE (depuis le début des données)
    # =====================================================================
    @section
    def duels():
        y0 = G[0]["y"] if G else Y
        du = collections.defaultdict(collections.Counter); dser = collections.defaultdict(set)
        for g in G:
            if g["l"] == "kespa_cup" and not (g["main"]["b"] and g["main"]["r"]): continue
            for a in g["p"][:5]:
                b = next((x for x in g["p"][5:] if x["role"] == a["role"]), None)
                if not b or not a["key"] or not b["key"]: continue
                for x, y in ((a, b), (b, a)):
                    z = du[(x["key"], y["key"])]; z["g"] += 1; z["w"] += x["W"]
                    if x["gd15"] is not None: z["n15"] += 1; z["gd15"] += x["gd15"]
                    dser[(x["key"], y["key"])].add(g["mid"])
        if not du: return
        (a, b), z = max(du.items(), key=lambda kv: (kv[1]["g"], kv[1]["w"]))
        if z["g"] >= 20:
            fact("d.classique.%s.%s" % (a, b), "duels", "depuis %s" % y0, "Le duel le plus joué : %s contre %s, %d face-à-face en lane depuis %s. %s mène %d-%d." % (pid(a), pid(b), z["g"], y0, pid(a), z["w"], z["g"] - z["w"]),
                 "Parties où les deux joueurs étaient au même poste, face à face.", "au moins 20 parties", z["g"], 3, "A", [a, b], "duels")
        lop = sorted(((z["w"] / z["g"], z["g"], k) for k, z in du.items() if z["g"] >= 8 and len(dser[k]) >= 3), reverse=True)
        for r, n, (a, b) in lop[:3]:
            z = du[(a, b)]
            m = round(z["gd15"] / z["n15"]) if z["n15"] >= 5 else None
            tail = "" if m is None else (", avec %s or d'avance en moyenne à 15 min" % sp(m) if m >= 200 else
                                         (", alors qu'il est derrière à 15 min (%s or en moyenne)" % sp(-m) if m <= -150 else ", sans écart notable à 15 min"))
            fact("d.nemesis.%s.%s" % (a, b), "duels", "depuis %s" % y0, "%s est la bête noire de %s : %d victoires en %d duels de lane depuis %s%s." % (pid(a), pid(b), z["w"], z["g"], y0, tail),
                 "Duels de lane depuis %s." % y0, "au moins 8 parties sur au moins 3 séries différentes", n, 4, "A", [a, b], "duels")
        fz = [(k, z) for k, z in du.items() if pid(k[0]) == "Faker" and pid(k[1]) == "Chovy"]
        if fz and fz[0][1]["g"] >= 20 and fz[0][1]["n15"]:
            (a, b), z = fz[0]
            fact("d.faker.chovy", "duels", "depuis %s" % y0, "Faker contre Chovy depuis %s : %d-%d en duel de lane, et %s or de %s en moyenne à 15 minutes." % (
                y0, z["w"], z["g"] - z["w"], sp(abs(round(z["gd15"] / z["n15"]))), "retard" if z["gd15"] < 0 else "avance"),
                 "Duels de lane depuis %s." % y0, "au moins 20 parties", z["g"], 3, "A", [a, b], "duels")

    # =====================================================================
    # 6. CHAMPIONS (toutes les parties des ligues suivies)
    # =====================================================================
    @section
    def champions():
        cc = collections.Counter(); cw = collections.Counter(); roles = collections.defaultdict(collections.Counter); ng = 0
        for g in G:
            if g["y"] != Y: continue
            ng += 1
            for p in g["p"]: cc[p["C"]] += 1; cw[p["C"]] += p["W"]; roles[p["C"]][p["role"]] += 1
        if ng < 500: return
        c, n = cc.most_common(1)[0]
        fact("c.top", "champions", Y, "%s est le champion de l'année : joué dans %s des %s parties de %s." % (c, pct(n, ng, 1), sp(ng), Y), "Picks, toutes les parties des ligues suivies.", "au moins 500 parties", ng, 3, "A", [c])
        ok = [(wilson(cw[c], n), c, n) for c, n in cc.items() if n >= 100]
        if ok:
            (lo, hi), c, n = max(ok, key=lambda x: x[0][0])
            fact("c.fort", "champions", Y, "%s gagne %s de ses parties en %s (%d sur %d), le meilleur taux des champions joués plus de 100 fois." % (c, pct(cw[c], n, 1), Y, cw[c], n),
                 "Borne basse de confiance : %s." % pct(lo, 1), "au moins 100 parties ET intervalle qui exclut 50 %", n, 3, "A", [c], ok=lo > 0.5, why="intervalle contient 50 %")
            (lo, hi), c, n = min(ok, key=lambda x: x[0][1])
            fact("c.faible", "champions", Y, "%s ne gagne que %s de ses parties (%d sur %d)." % (c, pct(cw[c], n, 1), cw[c], n), "Borne haute de confiance : %s." % pct(hi, 1),
                 "au moins 100 parties ET intervalle qui exclut 50 %", n, 3, "A", [c], ok=hi < 0.5, why="intervalle contient 50 %")
        CN = _champions(state, list(cc))
        if CN:
            never = sorted(set(CN) - set(cc))
            if never:
                fact("c.jamais", "champions", Y, "%d champion%s n'%s été joué%s dans aucune des %s parties de %s : %s." % (
                    len(never), "s" if len(never) > 1 else "", "ont" if len(never) > 1 else "a", "s" if len(never) > 1 else "", sp(ng), Y, ", ".join(never)),
                     "Liste officielle des champions (Data Dragon) moins les champions vus en %s." % Y, "périmètre : ligues suivies + internationaux (pas les ligues mineures)", ng, 4, "A", never)
        else: hold("c.jamais", "Champions jamais joués", "liste Data Dragon injoignable")
        rare = [(p["k"], p, g) for g in G if g["y"] == Y and fin(g) for p in g["p"] if cc[p["C"]] <= 3 and p["key"] and p["k"] >= 12]
        if rare:
            k_, p, g = max(rare, key=lambda x: (x[0], x[2]["t"]))
            fact("c.rare." + p["C"], "champions", Y, "%s n'a été joué que %d fois en %s… dont une partie à %d/%d/%d pour %s (%s, %s)." % (p["C"], cc[p["C"]], Y, p["k"], p["d"], p["a"], pid(p["key"]), LS.get(g["l"], g["l"]), dfr(g["t"])),
                 "Nombre de parties du champion en %s + ligne du joueur." % Y, "champion joué 3 fois ou moins ; au moins 12 kills ; flux complet", cc[p["C"]], 3, "A", [p["key"], p["C"]])
        cam = roles.get("Camille")
        if cam and cam["SUP"] > cam["TOP"] and cam["SUP"] >= 50:
            fact("c.camille", "champions", Y, "Méta étrange : Camille a été jouée %d fois support en %s, contre %d fois top." % (cam["SUP"], Y, cam["TOP"]), "Poste indiqué par le flux officiel pour chaque joueur.",
                 "au moins 50 parties au poste inattendu", sum(cam.values()), 3, "A", ["Camille"])

    errs = []
    for fn in secs:
        try: fn()
        except Exception as e: errs.append("%s: %s %s" % (fn.__name__, type(e).__name__, str(e)[:80]))
    # barrière finale
    out = []
    for f in FACTS:
        if f["fam"] == "serie" and f["id"].startswith("s.serie") and f["n"] < 8: HELD.append(dict(f, why="série trop courte")); continue
        if not P.full and f["id"].startswith(OFFICIAL):   # score recompté sur FLAT : faux dès qu'une manche n'a pas de flux
            HELD.append(dict(f, why="sans C : score officiel des séries inconnu")); continue
        out.append(f)
    return out, HELD, errs


# ---------- sortie, règle des 2 passages ----------
def _row(f):
    """[id, fam, txt, calcul, n, wow, keys] : le calcul porte la condition de publication et l'échantillon."""
    calc = f["calc"].strip(); calc += "" if calc.endswith((".", "…")) else "."
    cond = f["cond"].strip().rstrip(".")
    det = "%s Condition : %s. Échantillon : %s %s." % (calc, cond, sp(f["n"]), _unit(f["n"], f["src"]))
    return [f["id"], f["fam"], _typo(f["txt"]), _typo(det), f["n"], f["wow"], f["keys"]]

def _interest(f, Y):
    """Effet waouh d'abord ; à note égale, le tournoi en cours (faits « w. ») puis la robustesse."""
    return round(f["wow"] + (0.5 if f["id"].startswith("w.") else 0) - (0.4 if f["rob"] == "B" else 0), 2)

def _order(es):
    """Par intérêt décroissant, en évitant deux faits de la même famille à la suite (écart d'intérêt toléré : 0,5)."""
    rest = sorted(es, key=lambda e: (-e["k"], -e["row"][5], e["row"][0])); out = []
    while rest:
        i = next((j for j, e in enumerate(rest) if e["k"] < rest[0]["k"] - 0.5 or not out or e["row"][1] != out[-1]["row"][1]), 0)
        if rest[i]["k"] < rest[0]["k"] - 0.5: i = 0
        out.append(rest.pop(i))
    return out

def _publish(facts, state, Y):
    F = state.get("f") if isinstance(state.get("f"), dict) else {}
    npass = int(state.get("n") or 0) + 1
    boot = not any(e.get("row") for e in F.values())   # premier passage avec des faits publiés : rien n'est « nouveau »
    cur = {}
    for f in facts: cur.setdefault(f["id"], f)
    for fid, f in cur.items():
        h = hashlib.sha1(f["txt"].encode("utf-8")).hexdigest()[:10]
        e = F.get(fid) or {}
        e["m"] = 0; e["k"] = _interest(f, Y)
        if e.get("h") == h:                                   # publié et inchangé : on rafraîchit calcul et échantillon
            e["row"] = _row(f); e.pop("ph", None); e.pop("pc", None)
        else:                                                  # nouveau fait ou nouvelle version : 2 passages identiques
            e["pc"] = e.get("pc", 0) + 1 if e.get("ph") == h else 1; e["ph"] = h
            if e["pc"] >= 2:
                sig = re.sub(r"[\d\s,.%]+", " ", f["txt"]).strip()   # « né » : nouveau fait, ou autre sujet (pas un simple compteur qui avance)
                e.update(h=h, row=_row(f), b=npass if not boot and sig != e.get("s") else e.get("b", 0), s=sig); e.pop("ph", None); e.pop("pc", None)
        F[fid] = e
    for fid in list(F):
        if fid in cur: continue
        e = F[fid]; e.pop("ph", None); e.pop("pc", None)
        e["m"] = e.get("m", 0) + 1
        if not e.get("row") or e["m"] >= 2: del F[fid]       # un fait publié survit à une absence, pas à deux
    state["f"] = F; state["n"] = npass
    pub = _order([e for e in F.values() if e.get("row")])
    rows = [e["row"] + [1 if e.get("b") == npass else 0] for e in pub[:MAX_OUT]]
    while rows and len(json.dumps(rows, ensure_ascii=False, separators=(",", ":")).encode("utf-8")) > MAX_BYTES: rows.pop()
    return rows

def facts_block(FLAT, teams, state, now_iso, C=None, log=None):
    t0 = time.time()
    st = state if isinstance(state, dict) else {}
    say = log if callable(log) else (lambda *a: None)
    try:
        Y = (now_iso or max(f["t"] for f in FLAT))[:4]
        P = _prep(FLAT, teams, C, Y)
        facts, held, errs = _generate(P, Y, st)
        rows = _publish(facts, st, Y)
        st["t"] = now_iso
        say("faits : %d calculés, %d publiés (%d nouveaux), %d retenus, %.1f s%s" % (len(facts), len(rows), sum(r[7] for r in rows), len(held), time.time() - t0,
                                                                                      "" if P.full else " (sans C : garde-fous réduits)"))
        for h in held: say("  fait retenu : %s -> %s" % (h["txt"][:110], h["why"]))
        for e in errs: say("  section de faits en panne : %s" % e)
        return rows
    except Exception as e:   # l'appli garde la dernière liste publiée
        say("faits indisponibles : %s %s" % (type(e).__name__, str(e)[:160]))
        try:
            F = st.get("f") or {}
            pub = sorted((x for x in F.values() if x.get("row")), key=lambda x: (-x.get("k", 0), x["row"][0]))
            return [x["row"] + [0] for x in pub[:MAX_OUT]]
        except Exception:
            return []


# ---------- essai hors robot ----------
if __name__ == "__main__":
    a = sys.argv[1:]
    if len(a) < 2: print(__doc__); sys.exit(1)
    op = lambda p: gzip.open(p, "rt", encoding="utf-8") if p.endswith(".gz") else open(p, encoding="utf-8")
    FLAT = json.load(op(a[0])); teams = json.load(op(a[1])); C = json.load(op(a[2])) if len(a) > 2 and a[2] != "-" else None
    now = max(f["t"] for f in FLAT)
    state = {}
    for i in (1, 2):
        t = time.time(); rows = facts_block(FLAT, teams, state, now, C=C, log=print if i == 2 else None)
        print("passage %d : %d faits, %.2f s, %d octets" % (i, len(rows), time.time() - t, len(json.dumps(rows, ensure_ascii=False, separators=(",", ":")).encode("utf-8"))))
    for i, r in enumerate(rows, 1): print("%2d. [%s|%d] %s\n      %s" % (i, r[1], r[5], r[2], r[3]))
