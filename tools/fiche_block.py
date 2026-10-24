"""Fiche joueur et rencontres : bloc publié à part dans data/fiche.json, chargé par l'appli à l'ouverture d'une fiche.

Entrée : fiche_block(FLAT, teams, now_iso, C=None) -> dict, ou None en cas de panne (le robot garde alors le fichier
de la veille, voir aux_blocks) ; aucune exception ne remonte.
- FLAT : parties à plat remplies par build() (clés de rows en entiers dans le robot, en chaînes si relues d'un JSON) ;
- teams : data/teams.json ; now_iso : heure de référence (dernier match terminé), qui donne aussi l'année en cours ;
- C : mémoire du robot, facultative mais conseillée. Elle donne le score officiel des séries (details) et l'heure réelle
  de début de chaque partie (games[gid].s). Sans elle, le score est recompté sur FLAT (vide si la série n'a pas de
  vainqueur dans FLAT) et l'heure affichée est celle prévue pour la série, la même pour toutes les manches.

Contenu, pour nos 95 titulaires (clé EQUIPE_pseudo, ex. T1_faker), format détaillé dans LISEZMOI.md :
- enc  : les 10 dernières rencontres en lane entre deux de nos titulaires (parties décrites une seule fois dans gm) ;
- duo, dp : bilan contre chaque vis-à-vis (année en cours, depuis 2024), victoires attendues d'après la force des équipes,
  némésis, victime, plus dur et plus facile en lane ;
- ch   : champions (année en cours, depuis 2025) et référence des autres pros au même poste sur le même champion ;
- form : 10 dernières parties, série en cours, « hausse » ou « baisse » seulement si l'écart est net ;
- prof : rang dans sa ligue et rang corrigé de l'adversaire parmi les 19 du poste aux Worlds.
Les seuils viennent des tests par permutation sur nos 95 joueurs : on publie des faits, sans étiquette là où aucun
signal n'a été trouvé (bilan par champion, champion adverse). La sortie ne dépend que des données : sans nouvelle
partie, le fichier est identique octet pour octet (pas de publication inutile)."""
import math, re, unicodedata, collections, datetime, sys

# ---------- réglages ----------
N_ENC = 10                       # rencontres gardées par paire
DUO_SINCE, CH_SINCE = "2024", "2025"
# Elo d'équipe par partie, toutes ligues : niveau de départ par ligue, K = 24 (36 en international), saison suivante
# ramenée à 80 % vers le niveau de départ de sa ligue ; probabilité = écart × 0,85, côté bleu +25.
# Choisi sur les 5 810 parties 2025-2026 (chaque prévision faite avant la partie) : log-loss 0,635 (pile ou face 0,693).
ELO0 = {"lck": 1650, "lpl": 1650, "lec": 1520, "lcs": 1450, "lta_n": 1450, "lcp": 1430, "pcs": 1420, "vcs": 1400,
        "cblol-brazil": 1350, "lta_s": 1350, "lta_cross": 1400}
K_REG, K_INTL, SHRINK, BLUE, SCALE = 24, 36, 0.8, 25, 0.85
INTL = {"worlds", "msi", "first_stand", "ewc_lol", "americas_cup", "lta_cross"}
NO_ELO = {"kespa_cup"}           # académies alignées sous l'identifiant de l'équipe principale : pas de mise à jour
# némésis / victime / lane : seuils du rapport fiche joueur (testés par permutation)
NEM_G, NEM_WR, NEM_L, VIC_G, VIC_WR, VIC_W, PRIOR = 8, 0.40, 5, 8, 0.75, 6, 4
LANE_N, LANE_K, LANE_THR = 8, 8, 300
CH_REF = 30                      # parties minimum des autres pros pour la référence d'un champion
CH_TOP = 8                       # champions détaillés par période (les plus joués), le reste résumé
FORM_N, FORM_WR = 10, 0.20       # hausse/baisse : 20 points de victoires ET une erreur type d'or à 15 min, même sens
PROF_MIN = 20                    # parties minimum pour être classé (ligue et Worlds)
START_WIN = 720                  # heure réelle d'une partie retenue si elle est à moins de 12 h de l'heure prévue
# axes du profil : (clé, plus haut = mieux, postes, fiable). Fiabilité moitié/moitié : 0,79 à 0,94 pour les axes fiables,
# 0,42 à 0,74 pour la participation aux kills et la part des dégâts.
AXES = [("gd15", True, "TOP JGL MID BOT SUP", True), ("csd15", True, "TOP MID BOT", True), ("csm", True, "TOP JGL MID BOT", True),
        ("kp", True, "TOP JGL MID BOT SUP", False), ("ds", True, "TOP JGL MID BOT", False), ("dth", False, "TOP JGL MID BOT SUP", True),
        ("vis", True, "JGL SUP", True)]
NO_LEAGUE = {"ds", "vis"}        # mesurés seulement dans les parties de nos 19 équipes : pas de rang dans la ligue
DEC = {"gd15": 0, "csd15": 1, "csm": 2, "kp": 3, "ds": 3, "dth": 2, "vis": 2}
ROLES = ("TOP", "JGL", "MID", "BOT", "SUP")
SLUG = {"LCK": "lck", "LPL": "lpl", "LEC": "lec", "LCS": "lcs", "LCP": "lcp", "CBLOL": "cblol-brazil"}
LAB = {"worlds": "Worlds", "msi": "MSI", "first_stand": "First Stand", "americas_cup": "Americas Cup", "ewc_lol": "EWC",
       "kespa_cup": "KeSPA Cup", "lck": "LCK", "lpl": "LPL", "lec": "LEC", "lcs": "LCS", "cblol-brazil": "CBLOL", "lcp": "LCP",
       "lta_n": "LTA Nord", "lta_s": "LTA Sud", "lta_cross": "LTA", "pcs": "PCS", "vcs": "VCS"}


def norm(s):
    s = str(s or "").lower().replace("ø", "o")
    s = "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]", "", s)


def kda(k, d, a): return round((k + a) / max(1, d), 1)


def mean(v): return sum(v) / len(v) if v else None


def pm(x): return None if x is None else int(round(x * 1000))


def rnd(x, n):
    if x is None: return None
    return int(round(x)) if n == 0 else round(x, n)


def strip_code(name, codes):
    """« T1 Faker » -> Faker ; « WBGXiaohu » -> Xiaohu (flux LPL sans espace) ; « E Kratos », « W7 Fuuu » -> Kratos, Fuuu."""
    name = (name or "").strip()
    for c in sorted(codes, key=len, reverse=True):
        if c and name.lower().startswith(c.lower()) and len(name) > len(c):
            name = name[len(c):].strip() or name
            q = name.split(" ", 1)   # « FXW7 Ganks », « T1A Painter » : code d'équipe puis code de l'équipe réserve
            if len(q) == 2 and q[1].strip() and re.fullmatch(r"[A-Z0-9]{1,3}", q[0]): name = q[1].strip()
            return name
    p = name.split(" ", 1)
    if len(p) == 2 and p[1].strip() and re.fullmatch(r"[A-Z0-9.]{1,5}", p[0]): return p[1].strip()
    return name


def parse(s):
    try: return datetime.datetime(int(s[0:4]), int(s[5:7]), int(s[8:10]), int(s[11:13]), int(s[14:16]))
    except (ValueError, IndexError, TypeError): return None


def ols2(X, y):
    """y = a + b1 x1 + b2 x2, moindres carrés (équations normales 3x3)."""
    s = [[0.0] * 4 for _ in range(3)]
    for (x1, x2), v in zip(X, y):
        z = (1.0, x1, x2)
        for i in range(3):
            s[i][3] += z[i] * v
            for j in range(3): s[i][j] += z[i] * z[j]
    for i in range(3):
        p = max(range(i, 3), key=lambda r: abs(s[r][i])); s[i], s[p] = s[p], s[i]
        if abs(s[i][i]) < 1e-12: return [0.0, 0.0, 0.0]
        for r in range(3):
            if r != i:
                f = s[r][i] / s[i][i]
                for c in range(4): s[r][c] -= f * s[i][c]
    return [s[i][3] / s[i][i] for i in range(3)]


# ---------- Elo d'équipe ----------
def elo(G):
    """Pour chaque partie (G triées par heure) : (P(bleu gagne), Elo bleu, Elo rouge) avant la partie ; bilan de la prévision."""
    R, home, yr, out = {}, {}, None, []
    ll, n, cal = 0.0, 0, {}
    for g in G:
        y = g["t"][:4]
        if yr and y != yr:   # nouvelle saison : retour partiel vers le niveau de départ de la ligue
            for t in R:
                b = ELO0.get(home.get(t), 1450); R[t] = b + SHRINK * (R[t] - b)
        yr = y
        for t in (g["b"], g["r"]):
            if t not in R: R[t] = ELO0.get(g["l"], 1450)   # première apparition en international : valeur moyenne
            if g["l"] in ELO0 and g["l"] != "lta_cross": home[t] = g["l"]
        rb, rr = R[g["b"]], R[g["r"]]
        p = 1 / (1 + 10 ** (-(SCALE * (rb - rr) + BLUE) / 400))
        out.append((p, rb, rr))
        sb = 1 if g["w"] == g["b"] else 0
        if y >= "2025":
            ll -= math.log(p if sb else 1 - p); n += 1
            q = max(p, 1 - p); c = cal.setdefault(min(9, int(q * 10)), [0, 0.0, 0]); c[0] += 1; c[1] += q; c[2] += sb if p >= 0.5 else 1 - sb
        if g["l"] in NO_ELO: continue
        e = 1 / (1 + 10 ** ((rr - rb) / 400))
        k = K_INTL if g["l"] in INTL else K_REG
        R[g["b"]] += k * (sb - e); R[g["r"]] -= k * (sb - e)
    meta = {"ll": round(ll / n, 4) if n else None, "n": n,
            "cal": [[round(c[1] / c[0], 3), round(c[2] / c[0], 3), c[0]] for b, c in sorted(cal.items()) if c[0]]}
    return out, meta


# ---------- bloc ----------
def fiche_block(FLAT, teams, now_iso, C=None):
    try:
        return _block(FLAT, teams, now_iso, C)
    except Exception as e:   # le robot garde alors le fichier précédent
        print("fiche_block indisponible : %s: %s" % (type(e).__name__, str(e)[:160]), file=sys.stderr, flush=True)
        return None


def _block(FLAT, teams, now_iso, C):
    G = sorted(FLAT, key=lambda g: (g["t"], g["m"], g["n"]))
    if not G: return None
    now_iso = now_iso or G[-1]["t"]
    Y = now_iso[:4]
    PL = {p["key"]: dict(p, team=t["id"], league=t["league"]) for t in teams for p in t["players"]}
    PS = {k: norm(p["id"]) for k, p in PL.items()}
    D = (C or {}).get("details") or {}
    GS = (C or {}).get("games") or {}
    P, ELO = elo(G)

    # tables partagées (index entiers dans les lignes)
    def table():
        L, ix = [], {}
        def get(v):
            if v not in ix: ix[v] = len(L); L.append(v)
            return ix[v]
        return L, get
    CH, ci = table(); CP, cpi = table(); BN, bni = table()
    GM, gmi = [], {}

    codes = collections.defaultdict(set)   # codes vus pour chaque identifiant d'équipe (nettoyage des pseudos)
    for g in G:
        if g.get("bc"): codes[g["b"]].add(g["bc"])
        if g.get("rc"): codes[g["r"]].add(g["rc"])

    def start(g):
        """Début de la partie (UTC) : heure du flux si elle est à moins de 12 h de l'heure prévue pour la série
        (l'heure prévue est souvent fausse de 1 à 3 h), sinon heure prévue."""
        t = g["t"][:16].replace("T", " ")
        s = (GS.get(g["g"]) or {}).get("s")
        a, b = parse(s), parse(t)
        if a and b and abs((a - b).total_seconds()) <= START_WIN * 60: return s[:16].replace("T", " ")
        return t

    flat_w = collections.defaultdict(collections.Counter)
    for g in G: flat_w[g["m"]][g["w"]] += 1
    def series(g):
        """Score final de la série vu du côté bleu : officiel (details), sinon recompté sur FLAT si la série a un vainqueur."""
        d = D.get(g["m"])
        if d:
            w = {t[0]: t[3] for t in d.get("tm", [])}
            if w.get(g["b"]) is not None and w.get(g["r"]) is not None: return "%d-%d" % (w[g["b"]], w[g["r"]])
        c = flat_w[g["m"]]; a, b = c.get(g["b"], 0), c.get(g["r"], 0)
        return "%d-%d" % (a, b) if max(a, b) >= (g.get("bo") or 1) // 2 + 1 else None

    def game_ix(x):
        """Index de la partie dans gm (décrite une seule fois) : [date, heure UTC, compétition, phase, bo, manche,
        code bleu, code rouge, côté gagnant (0 bleu, 1 rouge), durée en minutes, score final de la série vu du bleu]."""
        g = x["g"]
        if g["g"] not in gmi:
            gmi[g["g"]] = len(GM)
            GM.append([x["st"][:10], x["st"][11:16], cpi(x["lab"]), bni(g.get("bn") or ""), g.get("bo") or 1, g["n"],
                       g.get("bc") or "?", g.get("rc") or "?", 0 if g["w"] == g["b"] else 1, round(g["min"], 2), series(g)])
        return gmi[g["g"]]

    # ---------- une ligne par participant ----------
    # identifiant : notre clé si titulaire, sinon identifiant LoL Esports (stable d'une équipe à l'autre), sinon pseudo normalisé
    NAMES, CODE = collections.defaultdict(list), {}
    rows_of = collections.defaultdict(list)
    allx = []
    for gi, g in enumerate(G):
        rw = g["rows"]; R = [rw.get(i, rw.get(str(i))) for i in range(10)]
        if any(r is None for r in R): continue
        ks, pids, nms = g.get("ks") or [None] * 10, g.get("pid") or [None] * 10, g.get("nm") or [None] * 10
        pb, eb, er = P[gi]
        st = start(g); lab = "%s %s" % (LAB.get(g["l"], g["l"].upper()), g["t"][:4])
        xs = []
        for i in range(10):
            side = 0 if i < 5 else 1; tid = g["b"] if side == 0 else g["r"]
            if ks[i] in PL: pid = ks[i]
            else:
                nm = strip_code(nms[i], codes[tid])
                pid = "p" + str(pids[i]) if pids[i] else "n" + (norm(nm) or "?")
                if nm: NAMES[pid].append(nm)
            CODE[pid] = (g.get("bc") if side == 0 else g.get("rc")) or "?"
            r = R[i]
            j = next((j for j in (range(5, 10) if side == 0 else range(5)) if R[j]["role"] == r["role"]), None)
            me = g["b"] if side == 0 else g["r"]
            x = {"g": g, "gi": gi, "i": i, "j": j, "side": side, "id": pid, "r": r, "W": 1 if g["w"] == me else 0,
                 "p": pb if side == 0 else 1 - pb, "eme": eb if side == 0 else er, "eop": er if side == 0 else eb,
                 "y": g["t"][:4], "st": st, "lab": lab, "role": r["role"]}
            rows_of[pid].append(x); allx.append(x); xs.append(x)
        for x in xs:
            f = xs[x["j"]] if x["j"] is not None else None
            x["foe"] = f; x["fid"] = f["id"] if f else None
    # pseudo affiché : le plus fréquent de ses 30 dernières parties (renommages, flux sans préfixe), à égalité le plus récent
    NAME = {k: p["id"] for k, p in PL.items()}
    for pid, L in NAMES.items():
        c = collections.Counter(L[-30:]); top = max(c.values())
        NAME[pid] = next(n for n in reversed(L[-30:]) if c[n] == top)

    out = {"v": 1, "asof": now_iso, "y": Y, "per": {"duo": DUO_SINCE, "ch": CH_SINCE},
           "src": {"g": len(G), "du": G[0]["t"][:10], "au": G[-1]["t"][:10], "details": bool(D)}, "elo": ELO,
           "cfg": {"nem": [NEM_G, NEM_WR, NEM_L], "vic": [VIC_G, VIC_WR, VIC_W], "lane": [LANE_N, LANE_K, LANE_THR],
                   "chref": CH_REF, "form": [FORM_N, FORM_WR], "prof": PROF_MIN}}

    # ---------- enc : dernières rencontres en lane entre deux de nos titulaires ----------
    enc = collections.defaultdict(list)
    for x in allx:
        if x["side"] or not x["foe"] or x["id"] not in PL or x["fid"] not in PL: continue
        a, b = (x, x["foe"]) if PS[x["id"]] <= PS[x["fid"]] else (x["foe"], x)
        enc[PS[a["id"]] + "|" + PS[b["id"]]].append((a, b))
    E = {}
    for k in sorted(enc):
        rows = []
        for a, b in sorted(enc[k], key=lambda z: z[0]["gi"], reverse=True)[:N_ENC]:   # ordre des parties (série, manche)
            ra, rb = a["r"], b["r"]
            row = [game_ix(a), a["side"], ci(ra["C"]), ci(rb["C"]), ra["k"], ra["d"], ra["a"], rb["k"], rb["d"], rb["a"],
                   ra["cs"], rb["cs"], ra["gd15"], ra["csd15"]]
            if ra.get("ds") is not None or rb.get("ds") is not None:   # part des dégâts en ‰ (parties 2026 de nos équipes)
                row += [pm(ra.get("ds")), pm(rb.get("ds"))]
            rows.append(row)
        E[k] = rows
    out["enc"] = E

    # ---------- duo : tous les vis-à-vis ----------
    VS, vix = [], {}
    def vi(fid):
        if fid not in vix:
            vix[fid] = len(VS); VS.append([NAME[fid], PL[fid]["team"], fid] if fid in PL else [NAME.get(fid, "Inconnu"), CODE.get(fid, "?")])
        return vix[fid]
    duo, DP = {}, {}
    for key in PL:
        res, agg = {}, {}
        for per in ("y", "a"):
            rs = [x for x in rows_of.get(key, []) if x["fid"] and (x["y"] == Y if per == "y" else x["y"] >= DUO_SINCE)]
            Z = agg[per] = {}
            for x in rs:
                r, f = x["r"], x["foe"]["r"]
                z = Z.setdefault(x["fid"], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "", 0.0])
                z[0] += 1; z[1] += x["W"]
                if r["gd15"] is not None: z[2] += r["gd15"]; z[3] += 1
                z[4] += r["k"]; z[5] += r["d"]; z[6] += r["a"]; z[7] += f["k"]; z[8] += f["d"]; z[9] += f["a"]
                z[10] = max(z[10], x["st"][:10]); z[11] += x["p"]
            p0 = sum(x["W"] for x in rs) / len(rs) if rs else 0.5
            sm = lambda z: (z[1] + PRIOR * p0) / (z[0] + PRIOR)   # taux lissé vers son taux habituel
            nem = [f for f, z in Z.items() if z[0] >= NEM_G and z[1] / z[0] <= NEM_WR and z[0] - z[1] >= NEM_L]
            vic = [f for f, z in Z.items() if z[0] >= VIC_G and z[1] / z[0] >= VIC_WR and z[1] >= VIC_W]
            lane = [(Z[f][2] / (Z[f][3] + LANE_K), f) for f in Z if Z[f][3] >= LANE_N]
            hard, easy = (min(lane), max(lane)) if lane else (None, None)
            pick = [min(nem, key=lambda f: (sm(Z[f]), -Z[f][0], f)) if nem else None,
                    max(vic, key=lambda f: (sm(Z[f]), Z[f][0], f)) if vic else None,
                    hard[1] if hard and hard[0] <= -LANE_THR else None, easy[1] if easy and easy[0] >= LANE_THR else None]
            res["d" + per] = [vi(f) if f else None for f in pick]
            res["p" + per] = round(p0, 3)
        # une ligne par vis-à-vis depuis 2024, prolongée par l'année en cours s'il y en a ; un duel entre deux de nos
        # titulaires n'est écrit qu'une fois (dans dp, vu du premier dans l'ordre alphabétique des pseudos)
        rows = []
        for f, z in sorted(agg["a"].items(), key=lambda kv: (-kv[1][0], -kv[1][1], NAME.get(kv[0], ""), kv[0])):
            row = [z[0], z[1], z[2], z[3], kda(z[4], z[5], z[6]), kda(z[7], z[8], z[9]), int(z[10].replace("-", "")), round(z[11], 1)]
            y = agg["y"].get(f)
            if y: row += [y[0], y[1], y[2], y[3], kda(y[4], y[5], y[6]), kda(y[7], y[8], y[9]), round(y[11], 1)]
            if f in PL:
                if PS[key] < PS[f]: DP[PS[key] + "|" + PS[f]] = row
            else: rows.append([vi(f)] + row)
        res["r"] = rows
        duo[key] = res
    out["duo"] = duo
    out["dp"] = {k: DP[k] for k in sorted(DP)}

    # ---------- ch : champions et référence des autres pros (même poste, même champion, même période) ----------
    ref = {}
    for x in allx:
        if x["y"] < CH_SINCE: continue
        r = x["r"]
        for per in (("y", "a") if x["y"] == Y else ("a",)):
            z = ref.setdefault((per, x["role"], r["C"]), [0, 0, 0, 0, 0, 0, 0])
            z[0] += 1; z[1] += x["W"]; z[4] += r["k"]; z[5] += r["d"]; z[6] += r["a"]
            if r["gd15"] is not None: z[2] += r["gd15"]; z[3] += 1
    ch = {}
    for key, p in PL.items():
        res = {}
        for per in ("y", "a"):
            T, Tm = {}, {}
            for x in rows_of.get(key, []):
                if (x["y"] != Y) if per == "y" else (x["y"] < CH_SINCE): continue
                r = x["r"]; z = T.setdefault(r["C"], [0, 0, 0, 0, 0, 0, 0])
                z[0] += 1; z[1] += x["W"]; z[2] += r["k"]; z[3] += r["d"]; z[4] += r["a"]
                if r["gd15"] is not None: z[5] += r["gd15"]; z[6] += 1
                if x["role"] == p["role"]:   # ses propres parties au poste, retirées de la référence
                    m = Tm.setdefault(r["C"], [0, 0, 0, 0, 0, 0, 0]); m[0] += 1; m[1] += x["W"]; m[4] += r["k"]; m[5] += r["d"]; m[6] += r["a"]
                    if r["gd15"] is not None: m[2] += r["gd15"]; m[3] += 1
            rows, top = [], sorted(T.items(), key=lambda kv: (-kv[1][0], -kv[1][1], kv[0]))
            for c, z in top[:CH_TOP]:
                b, m = ref.get((per, p["role"], c), [0] * 7), Tm.get(c, [0] * 7)
                o = [b[i] - m[i] for i in range(7)]
                row = [ci(c), z[0], z[1], kda(z[2], z[3], z[4]), rnd(z[5] / z[6], 0) if z[6] else None, z[6], o[0]]
                if o[0] >= CH_REF: row += [o[1], rnd(o[2] / o[3], 0) if o[3] >= CH_REF else None]
                rows.append(row)
            res[per] = rows
            res["z" + per] = [len(top), sum(z[0] for c, z in top[CH_TOP:]), sum(z[1] for c, z in top[CH_TOP:])]   # champions joués, parties et victoires hors liste
        ch[key] = res
    out["ch"] = ch

    # ---------- form : 10 dernières parties ----------
    sd = {}
    for role in ROLES:   # écart-type par partie de l'or à 15 min autour de la moyenne du joueur (nos 95, 2025-2026)
        dev = []
        for key in PL:
            v = [x["r"]["gd15"] for x in rows_of.get(key, []) if x["y"] >= "2025" and x["role"] == role and x["r"]["gd15"] is not None]
            if len(v) >= 20:
                m = mean(v); dev += [a - m for a in v]
        sd[role] = (sum(a * a for a in dev) / len(dev)) ** 0.5 if len(dev) > 50 else 750.0
    out["sd15"] = {r: int(round(v)) for r, v in sd.items()}
    def blk(rs):
        g15 = [x["r"]["gd15"] for x in rs if x["r"]["gd15"] is not None]
        return [len(rs), sum(x["W"] for x in rs), sum(x["r"]["k"] for x in rs), sum(x["r"]["d"] for x in rs), sum(x["r"]["a"] for x in rs), sum(g15), len(g15)]
    form = {}
    for key, p in PL.items():
        rs = rows_of.get(key, [])   # déjà dans l'ordre des parties
        cur = [x for x in rs if x["y"] == Y]
        last = cur[-FORM_N:]
        streak = 0
        for x in reversed(rs):
            if x["W"] != rs[-1]["W"]: break
            streak += 1
        S, L = blk(cur), blk(last)
        tag = None
        if L[0] >= FORM_N and L[6] and S[6] and S[0] > L[0]:
            dwr = L[1] / L[0] - S[1] / S[0]; dgd = L[5] / L[6] - S[5] / S[6]; se = sd[p["role"]] / math.sqrt(L[6])
            if dwr >= FORM_WR and dgd >= se: tag = "hausse"
            elif dwr <= -FORM_WR and dgd <= -se: tag = "baisse"
        form[key] = {"l": [[game_ix(x), x["side"], x["W"], ci(x["r"]["C"]), x["r"]["k"], x["r"]["d"], x["r"]["a"], x["r"]["gd15"],
                            vi(x["fid"]) if x["fid"] else None] for x in reversed(last)],
                     "s": (streak if rs[-1]["W"] else -streak) if rs else 0, "t": tag, "S": S}
    out["form"] = form

    # ---------- prof : rang dans sa ligue et rang corrigé de l'adversaire parmi les 19 du poste aux Worlds ----------
    def val(ax, x):
        r = x["r"]
        if ax == "gd15": return r["gd15"]
        if ax == "csd15": return r["csd15"]
        if ax == "csm": return r["cs"] / r["min"] if r["min"] else None
        if ax == "kp": return (r["k"] + r["a"]) / r["tk"] if r["tk"] else None   # moyenne par partie, comme gol.gg
        if ax == "ds": return r.get("ds")
        if ax == "dth": return r["d"]
        if ax == "vis": return (r["wp"] + (r.get("wk") or 0)) / r["min"] if r.get("wp") is not None and r["min"] else None
    def tot(ax, xs):
        """Valeur sur un ensemble de parties et nombre de parties mesurées : CS et balises par minute = total / minutes
        (comme la tuile « CS par minute » de l'appli) ; le reste = moyenne par partie (comme gol.gg)."""
        if ax in ("csm", "vis"):
            xs = [x for x in xs if x["r"]["min"] and (ax == "csm" or x["r"].get("wp") is not None)]
            if not xs: return None, 0
            num = sum(x["r"]["cs"] if ax == "csm" else x["r"]["wp"] + (x["r"].get("wk") or 0) for x in xs)
            return num / sum(x["r"]["min"] for x in xs), len(xs)
        v = [a for a in (val(ax, x) for x in xs) if a is not None]
        return mean(v), len(v)
    cur = [x for x in allx if x["y"] == Y]
    REF = mean([x["eop"] for x in cur if x["g"]["l"] == "worlds" and x["id"] in PL]) or mean([x["eop"] for x in cur if x["id"] in PL]) or 1550.0
    # correction : régression par poste de chaque stat sur l'Elo de son équipe et l'Elo adverse (toutes les parties pros de
    # l'année) ; on ne retire que la part de l'adversaire, ramenée à l'adversaire moyen des Worlds (REF)
    COEF = {}
    for role in ROLES:
        rs = [x for x in cur if x["role"] == role]
        for ax, hi, roles, rel in AXES:
            if role not in roles.split(): continue
            X, yv = [], []
            for x in rs:
                v = val(ax, x)
                if v is not None: X.append(((x["eme"] - 1500) / 100, (x["eop"] - 1500) / 100)); yv.append(v)
            COEF[(role, ax)] = ols2(X, yv)[2] if len(yv) > 200 else 0.0
    TAB = {}
    for key, p in PL.items():
        rs = [x for x in rows_of.get(key, []) if x["y"] == Y]
        for ax, hi, roles, rel in AXES:
            raw, m = tot(ax, rs)
            if raw is not None:
                e = mean([x["eop"] for x in rs if val(ax, x) is not None])
                TAB[(key, ax)] = (raw, raw + COEF.get((p["role"], ax), 0.0) * (REF - e) / 100, m)
    LG = collections.defaultdict(list)   # (ligue, poste) -> parties de la ligue, année en cours
    for x in cur:
        if x["g"]["l"] in SLUG.values(): LG[(x["g"]["l"], x["role"])].append(x)
    LV = {}
    def league_vals(slug, role, ax):
        if (slug, role, ax) not in LV:
            by = collections.defaultdict(list)
            for x in LG.get((slug, role), []): by[x["id"]].append(x)
            vals = {}
            for pid, xs in by.items():
                v, m = tot(ax, xs)
                if v is not None and m >= PROF_MIN: vals[pid] = v
            LV[(slug, role, ax)] = vals
        return LV[(slug, role, ax)]
    prof = {}
    for key, p in PL.items():
        role, slug = p["role"], SLUG.get(p["league"])
        axo, fort, faible = [], [], []
        for ax, hi, roles, rel in AXES:
            if role not in roles.split() or (key, ax) not in TAB: continue
            raw, adj, m = TAB[(key, ax)]
            peers = sorted([k for k in PL if PL[k]["role"] == role and (k, ax) in TAB and TAB[(k, ax)][2] >= PROF_MIN],
                           key=lambda k: (TAB[(k, ax)][1] * (-1 if hi else 1), k))
            rk, n = (peers.index(key) + 1 if key in peers else None), len(peers)
            lv = lrk = ln = None
            if slug and ax not in NO_LEAGUE:
                vals = league_vals(slug, role, ax)
                if key in vals:
                    order = sorted(vals, key=lambda k: (vals[k] * (-1 if hi else 1), k))
                    lv, lrk, ln = rnd(vals[key], DEC[ax]), order.index(key) + 1, len(order)
            axo.append([ax, rnd(raw, DEC[ax]), rnd(adj, DEC[ax]), rk, n, m, lv, lrk, ln])
            if rk and n >= 10:   # net : axes fiables dans le quart extrême, participation et part des dégâts aux 2 extrêmes
                top, bot = (4, n - 3) if rel else (2, n - 1)
                if rk <= top: fort.append((rk, ax))
                if rk >= bot: faible.append((-rk, ax))
        prof[key] = {"lg": p["league"], "eop": rnd(mean([x["eop"] for x in rows_of.get(key, []) if x["y"] == Y]), 0), "ax": axo,
                     "f": [a for _, a in sorted(fort)], "w": [a for _, a in sorted(faible)]}
    out["prof"] = prof
    out["ref"] = {"elo": rnd(REF, 0), "coef": {"%s|%s" % k: round(v, 4) for k, v in sorted(COEF.items())}}

    out["vs"], out["gm"], out["champs"], out["comp"], out["bn"] = VS, GM, CH, CP, BN
    return out
