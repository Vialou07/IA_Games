#!/usr/bin/env python3
"""Modèle E : note d'impact global des joueurs, corrigée de l'adversité.

Bibliothèque standard uniquement (tourne dans le robot GitHub Actions).

1. Indice de performance par partie et par joueur (y) : moyenne de z-scores standardisés PAR POSTE
   (constantes calculées sur 2024 seulement) de
     kda   = ln((K + A + 1) / (D + 1))
     kp    = (K + A) / kills de l'équipe
     gpm   = or / minute,      cspm = CS / minute
     gd15  = or à 15 min - or à 15 min du vis-à-vis (même poste),  csd15 = idem en CS
   puis re-standardisé par poste (moyenne 0, écart-type 1 sur 2024).
2. Modèle additif (moindres carrés pondérés + ridge hiérarchique) :
     y[i, g] = r_i - moyenne(r_j, j dans les 5 adversaires de g) + bruit
     poids w_g = 0,5 ** (âge_g / H)               (demi-vie H jours)
     pénalité  lam * somme_i (r_i - L_ligue(i))^2 + lamL * somme_l L_l^2
   r_i = note du joueur (unité : écart-type d'une performance de partie), L_l = niveau moyen de sa ligue
   (ligue domestique de sa dernière partie). Les internationaux (et les transferts) relient les ligues :
   dans un match interne à une ligue, décaler toute la ligue ne change rien ; seuls les matchs mixtes fixent l'écart.
3. Prédiction d'une partie : P(bleu gagne) = sigmoïde(a0 + alpha * (somme des 5 notes bleues - somme des 5 rouges)),
   a0 et alpha ajustés par régression logistique sur les prédictions passées hors échantillon.

Entrée principale : ratings(C=None, asof=None, boot=0) -> dict (voir la fonction)."""
import json, gzip, math, os, datetime, importlib.util, random, bisect

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
INTL = ("worlds", "msi", "first_stand", "ewc_lol")
HOME = {"lck": "LCK", "lpl": "LPL", "lec": "LEC", "lcs": "LCS", "lta_n": "LCS", "cblol-brazil": "CBLOL", "lta_s": "CBLOL",
        "lcp": "LCP", "pcs": "PCS", "vcs": "VCS"}
ROLES = ("TOP", "JGL", "MID", "BOT", "SUP")
METRICS = ("kda", "kp", "gpm", "cspm", "gd15", "csd15")
VARIANTS = {"complet": METRICS, "combat": ("kda", "kp"), "sans_or_final": ("kda", "kp", "gd15", "csd15"), "lane": ("gd15", "csd15", "cspm")}
# paramètres retenus (choisis sur la validation 2024-05 -> 2024-12, voir run_select.py)
PARAMS = {"variant": "complet", "H": 120.0, "lam": 4.0, "lamL": 0.5}
# P(bleu gagne) = sigmoïde(a0 + alpha * écart des sommes de notes) ; ajusté sur les 7 217 prédictions hors échantillon
# du 2024-05-01 au 2026-10-23 (run_walk.py puis report.py). À réajuster de temps en temps, pas à chaque passage.
LOGIT = (0.1729, 0.6407)
EPOCH = datetime.datetime(2024, 1, 1)


def tday(s):
    """'2026-10-23T17:00:00' -> jours (float) depuis le 2024-01-01 UTC."""
    dt = datetime.datetime(int(s[0:4]), int(s[5:7]), int(s[8:10]), int(s[11:13]), int(s[14:16]), int(s[17:19] or 0))
    return (dt - EPOCH).total_seconds() / 86400.0


def load_bs(path=None):
    spec = importlib.util.spec_from_file_location("bs", path or os.path.join(ROOT, "build_stats.py"))
    bs = importlib.util.module_from_spec(spec); spec.loader.exec_module(bs); return bs


def load_cache(path=None):
    return json.load(gzip.open(path or os.path.join(ROOT, "cache.json.gz"), "rt", encoding="utf-8"))


# ---------------------------------------------------------------- données
def prepare(C, bs=None):
    """Toutes les parties terminées dont le vainqueur est connu, triées par heure de début.
    Chaque partie : dict(gid, mid, lg, t, day, bo, num, b, r, y (1 si bleu gagne), fin, min, tk=(kills b, kills r),
    P = 10 lignes [pid, poste, K, D, A, CS, or, or15, cs15, part_dégâts] ou None)."""
    bs = bs or load_bs()
    E, D, G = C["events"], C["details"], C["games"]
    out = []
    for mid, d in D.items():
        e = E.get(mid)
        if not e or e["st"] != "completed" or len(d["tm"]) != 2: continue
        W = bs.winners(C, mid)
        tids = [x[0] for x in d["tm"]]
        for g in sorted(d["g"], key=lambda g: g[1]):
            wid = W.get(g[0])
            if not wid: continue
            s = G.get(g[0])
            if s and "b" in s:
                b, r = s["b"][0], s["r"][0]
                t = tday(s["s"]); day = s["s"][:10]
            else:
                b = g[3]
                if b not in tids: continue
                r = tids[1] if tids[0] == b else tids[0]
                t = tday(e["t"][:19]) + (g[1] - 1) * 0.03; day = e["t"][:10]
            P = None
            if s and "p" in s and len(s["p"]) == 10:
                P = []
                for pp in s["p"]:
                    pid = pp[0] or ("n:" + "".join(ch for ch in str(pp[1]).lower() if ch.isalnum()))
                    P.append([pid, pp[2], pp[4], pp[5], pp[6], pp[7], pp[8], pp[9], pp[10], pp[11]])
            out.append({"gid": g[0], "mid": mid, "lg": e["l"], "t": t, "day": day, "bo": e.get("bo", 1), "num": g[1],
                        "b": b, "r": r, "y": 1 if wid == b else 0, "fin": bool(s and s.get("fin")), "min": (s or {}).get("min"),
                        "tk": (s["b"][1], s["r"][1]) if s and "b" in s else None, "P": P})
    out.sort(key=lambda x: (x["t"], x["mid"], x["num"]))
    return out


def raw_metrics(g):
    """10 dicts de métriques brutes (None si absentes) ; None si la partie n'a pas de stats complètes."""
    P = g["P"]
    if not P or not g["fin"] or not g["min"] or g["min"] < 10: return None
    mins = g["min"]; out = []
    for i, pp in enumerate(P):
        side = 0 if i < 5 else 1
        foe = next((q for q in (P[5:] if side == 0 else P[:5]) if q[1] == pp[1]), None)
        k, d, a, cs, gold, g15, c15 = pp[2], pp[3], pp[4], pp[5], pp[6], pp[7], pp[8]
        tk = g["tk"][side]
        m = {"kda": math.log((k + a + 1.0) / (d + 1.0)), "kp": (k + a) / max(1, tk), "gpm": gold / mins, "cspm": cs / mins,
             "gd15": (g15 - foe[7]) if foe and g15 is not None and foe[7] is not None else None,
             "csd15": (c15 - foe[8]) if foe and c15 is not None and foe[8] is not None else None}
        out.append(m)
    return out


def norm_consts(games, before="2025-01-01"):
    """Moyenne et écart-type par poste et par métrique, sur les parties antérieures à `before` (2024) uniquement."""
    acc = {}
    for g in games:
        if g["day"] >= before: break
        M = raw_metrics(g)
        if not M: continue
        for pp, m in zip(g["P"], M):
            for k, v in m.items():
                if v is None: continue
                a = acc.setdefault((pp[1], k), [0, 0.0, 0.0]); a[0] += 1; a[1] += v; a[2] += v * v
    return {key: (s / n, math.sqrt(max(1e-12, ss / n - (s / n) ** 2))) for key, (n, s, ss) in acc.items()}


def perf_index(games, variant="complet", consts=None):
    """Indice de performance y par partie (liste de 10 floats ou None), re-standardisé par poste sur 2024."""
    consts = consts or norm_consts(games)
    mets = VARIANTS[variant]
    raw = []
    for g in games:
        M = raw_metrics(g)
        if not M: raw.append(None); continue
        ys = []
        for pp, m in zip(g["P"], M):
            z = [(m[k] - consts[(pp[1], k)][0]) / consts[(pp[1], k)][1] for k in mets if m[k] is not None]
            ys.append(sum(z) / len(z) if z else 0.0)
        raw.append(ys)
    # re-standardisation par poste (2024)
    acc = {}
    for g, ys in zip(games, raw):
        if g["day"] >= "2025-01-01": break
        if ys is None: continue
        for pp, v in zip(g["P"], ys):
            a = acc.setdefault(pp[1], [0, 0.0, 0.0]); a[0] += 1; a[1] += v; a[2] += v * v
    rc = {k: (s / n, math.sqrt(ss / n - (s / n) ** 2)) for k, (n, s, ss) in acc.items()}
    return [None if ys is None else [(v - rc[pp[1]][0]) / rc[pp[1]][1] for pp, v in zip(g["P"], ys)] for g, ys in zip(games, raw)]


# ---------------------------------------------------------------- moteur d'ajustement
class Engine:
    """Système linéaire du modèle additif, résolu par gradient conjugué préconditionné (Jacobi)."""

    def __init__(self, games, Y):
        self.games = games
        self.pid = {}; self.plist = []
        for g in games:
            if g["P"]:
                for pp in g["P"]:
                    if pp[0] not in self.pid: self.pid[pp[0]] = len(self.plist); self.plist.append(pp[0])
        self.NP = len(self.plist)
        self.leagues = sorted(set(HOME.values())) + ["AUTRE"]
        self.lidx = {l: i for i, l in enumerate(self.leagues)}
        # parties utilisables pour l'ajustement : (t, mid, idx[10], y[10], ligue de la partie)
        self.PG = []
        for g, ys in zip(games, Y):
            if ys is None: continue
            self.PG.append((g["t"], g["mid"], [self.pid[pp[0]] for pp in g["P"]], ys, g["lg"]))
        self.PT = [x[0] for x in self.PG]

    def homes(self, n):
        """Ligue domestique (dernière partie domestique) de chaque joueur, d'après les n premières parties."""
        h = [None] * self.NP
        seen = [False] * self.NP
        for t, mid, idx, ys, lg in self.PG[:n]:
            hl = HOME.get(lg)
            for j in idx:
                seen[j] = True
                if hl: h[j] = hl
        A = self.lidx["AUTRE"]
        return [(self.lidx[x] if x else A) if s else -1 for x, s in zip(h, seen)]

    def fit(self, T, H, lam, lamL, x0=None, mult=None, tol=1e-6, maxit=300):
        """Ajuste sur les parties de début < T (jours). mult : multiplicateur par match (bootstrap).
        Renvoie dict(r=[note par joueur, None si jamais vu], L=[niveau par ligue], home, n, w (somme des poids par joueur), it)."""
        n = bisect.bisect_left(self.PT, T)
        PG = self.PG[:n]
        NP, NL = self.NP, len(self.leagues)
        home = self.homes(n)
        W = []
        for t, mid, idx, ys, lg in PG:
            w = 0.5 ** ((T - t) / H)
            if mult is not None: w *= mult.get(mid, 0)
            W.append(w)
        # second membre b = X' W y et diagonale
        b = [0.0] * (NP + NL); diag = [0.0] * (NP + NL); wsum = [0.0] * NP
        for (t, mid, idx, ys, lg), w in zip(PG, W):
            if w == 0: continue
            Y0 = ys[0] + ys[1] + ys[2] + ys[3] + ys[4]; Y1 = ys[5] + ys[6] + ys[7] + ys[8] + ys[9]
            for q in range(10):
                j = idx[q]
                b[j] += w * (ys[q] - (Y1 if q < 5 else Y0) / 5.0)
                wsum[j] += w
        nl = [0] * NL
        for j in range(NP):
            if home[j] >= 0:
                diag[j] = 1.2 * wsum[j] + lam; nl[home[j]] += 1
            else:
                diag[j] = 1.0
        for l in range(NL): diag[NP + l] = lam * nl[l] + lamL
        act = [home[j] >= 0 for j in range(NP)]

        def Hv(v):
            out = [0.0] * (NP + NL)
            for (t, mid, idx, ys, lg), w in zip(PG, W):
                if w == 0: continue
                a = [v[j] for j in idx]
                M0 = (a[0] + a[1] + a[2] + a[3] + a[4]) / 5.0; M1 = (a[5] + a[6] + a[7] + a[8] + a[9]) / 5.0
                u = [w * (a[q] - (M1 if q < 5 else M0)) for q in range(10)]
                U0 = (u[0] + u[1] + u[2] + u[3] + u[4]) / 5.0; U1 = (u[5] + u[6] + u[7] + u[8] + u[9]) / 5.0
                for q in range(5): out[idx[q]] += u[q] - U1
                for q in range(5, 10): out[idx[q]] += u[q] - U0
            for j in range(NP):
                if act[j]:
                    l = NP + home[j]; dlt = lam * (v[j] - v[l]); out[j] += dlt; out[l] -= dlt
                else:
                    out[j] = v[j]
            for l in range(NL): out[NP + l] += lamL * v[NP + l]
            return out

        x = list(x0) if x0 else [0.0] * (NP + NL)
        for j in range(NP):
            if not act[j]: x[j] = 0.0
        Ax = Hv(x)
        res = [bi - ai for bi, ai in zip(b, Ax)]
        bn = math.sqrt(sum(v * v for v in b)) or 1.0
        z = [ri / di for ri, di in zip(res, diag)]
        p = list(z); rz = sum(ri * zi for ri, zi in zip(res, z))
        it = 0
        while it < maxit and math.sqrt(sum(v * v for v in res)) / bn > tol:
            Ap = Hv(p)
            alpha = rz / (sum(pi * api for pi, api in zip(p, Ap)) or 1e-300)
            x = [xi + alpha * pi for xi, pi in zip(x, p)]
            res = [ri - alpha * api for ri, api in zip(res, Ap)]
            z = [ri / di for ri, di in zip(res, diag)]
            rz2 = sum(ri * zi for ri, zi in zip(res, z))
            p = [zi + (rz2 / rz) * pi for zi, pi in zip(z, p)]
            rz = rz2; it += 1
        r = [x[j] if act[j] else None for j in range(NP)]
        return {"x": x, "r": r, "L": x[NP:], "home": home, "n": n, "w": wsum, "it": it, "T": T}

    def residual_sd(self, F, H):
        n = F["n"]; T = F["T"]; s = sw = 0.0; r = F["r"]
        for t, mid, idx, ys, lg in self.PG[:n]:
            w = 0.5 ** ((T - t) / H)
            a = [r[j] for j in idx]
            M0 = sum(a[:5]) / 5; M1 = sum(a[5:]) / 5
            for q in range(10):
                e = ys[q] - (a[q] - (M1 if q < 5 else M0)); s += w * e * e; sw += w
        return math.sqrt(s / sw)


def player_rating(F, eng, pid, team_league=None):
    """Note d'un joueur ; joueur inconnu -> niveau de la ligue de son équipe (ou 0)."""
    j = eng.pid.get(pid)
    if j is not None and F["r"][j] is not None: return F["r"][j]
    if team_league in eng.lidx: return F["L"][eng.lidx[team_league]]
    return 0.0


# ---------------------------------------------------------------- logistique 1-D (a0 + alpha * d)
def fit_logit(rows, l2=1e-3, it=50):
    """rows = [(d, y)] ; renvoie (a0, alpha) par Newton-Raphson."""
    a0 = 0.0; al = 0.0
    for _ in range(it):
        g0 = g1 = h00 = h01 = h11 = 0.0
        for d, y in rows:
            p = 1 / (1 + math.exp(-(a0 + al * d)))
            e = y - p; v = p * (1 - p)
            g0 += e; g1 += e * d; h00 += v; h01 += v * d; h11 += v * d * d
        g1 -= l2 * al; h11 += l2
        det = h00 * h11 - h01 * h01
        if det <= 0: break
        da0 = (h11 * g0 - h01 * g1) / det; dal = (-h01 * g0 + h00 * g1) / det
        a0 += da0; al += dal
        if abs(da0) + abs(dal) < 1e-10: break
    return a0, al


def sig(x): return 1 / (1 + math.exp(-x)) if x > -500 else 0.0


def series_prob(p, bo):
    """P(gagner une série au meilleur des bo) si chaque partie est gagnée avec la proba p (indépendantes)."""
    need = bo // 2 + 1
    return sum(math.comb(need - 1 + k, k) * p ** need * (1 - p) ** k for k in range(need))


# ---------------------------------------------------------------- point d'entrée
def ratings(C=None, asof=None, boot=0, params=None, teams_path=None, seed=7, bs=None):
    """Notes actuelles des 95 titulaires.
    C : cache (chargé depuis ../cache.json.gz si None) ; asof : date ISO 'AAAA-MM-JJ' (exclue) ou None = toutes les parties ;
    boot : nombre de répétitions du bootstrap par match (incertitude ; ~0,8 s par répétition).
    Renvoie {"params", "logit": (a0, alpha), "T", "leagues": {ligue: niveau L},
             "players": {clé: {note, sd (None si boot=0), role, team, league, n_eff (somme des poids)}},
             "teams": {équipe: somme des 5 notes}} (+ objets internes _F, _eng, _boots)."""
    P = dict(PARAMS, **(params or {}))
    C = C or load_cache()
    teams = json.load(open(teams_path or os.path.join(ROOT, "teams.json"), encoding="utf-8"))
    games = prepare(C, bs)   # bs : le module build_stats déjà chargé (vainqueurs et côtés corrigés)
    Y = perf_index(games, P["variant"])
    eng = Engine(games, Y)
    T = tday(asof + "T00:00:00") if asof else games[-1]["t"] + 1e-6
    F = eng.fit(T, P["H"], P["lam"], P["lamL"])
    roster = C["roster"]["players"]
    boots = []
    if boot:
        rnd = random.Random(seed)
        mids = sorted({x[1] for x in eng.PG[:F["n"]]})
        for b in range(boot):
            mult = {}
            for _ in range(len(mids)):
                m = mids[rnd.randrange(len(mids))]; mult[m] = mult.get(m, 0) + 1
            boots.append(eng.fit(T, P["H"], P["lam"], P["lamL"], x0=F["x"], mult=mult))
    out = {"params": P, "logit": LOGIT, "T": T, "leagues": {l: F["L"][i] for i, l in enumerate(eng.leagues)}, "players": {}}
    key_meta = {p["key"]: (t["id"], t["league"], p["role"]) for t in teams for p in t["players"]}
    for pid, key in roster.items():
        j = eng.pid.get(pid)
        if j is None or F["r"][j] is None: continue
        team, lg, role = key_meta[key]
        vals = [B["r"][j] for B in boots if B["r"][j] is not None]
        m = sum(vals) / len(vals) if vals else None
        sd = math.sqrt(sum((v - m) ** 2 for v in vals) / (len(vals) - 1)) if len(vals) > 1 else None
        out["players"][key] = {"note": F["r"][j], "sd": sd, "role": role, "team": team, "league": lg, "n_eff": F["w"][j], "j": j}
    out["teams"] = {}
    for t in teams:
        ks = [p["key"] for p in t["players"] if p["key"] in out["players"]]
        out["teams"][t["id"]] = sum(out["players"][k]["note"] for k in ks)
    out["_boots"] = boots; out["_F"] = F; out["_eng"] = eng
    return out


def win_prob(R, blue, red, bo=1, side=True):
    """P(que l'équipe `blue` gagne) avec les notes R = ratings(...). blue/red : listes de 5 clés joueurs (ex. T1_peyz)
    ou un identifiant d'équipe (ex. "T1"). bo=1 : une partie (côté bleu compris si side) ; bo=3/5 : la série (côté neutre)."""
    def tot(x):
        if isinstance(x, str): return R["teams"][x]
        return sum(R["players"][k]["note"] for k in x)
    a0, al = R.get("logit", LOGIT)
    d = tot(blue) - tot(red)
    if bo == 1: return sig((a0 if side else 0.0) + al * d)
    return series_prob(sig(al * d), bo)


if __name__ == "__main__":
    R = ratings(boot=0)
    for k, v in sorted(R["players"].items(), key=lambda kv: -kv[1]["note"])[:10]:
        print(k, round(v["note"], 3), v["role"], v["league"])
    print("T1 contre KC, Bo5 : %.1f %%" % (100 * win_prob(R, "T1", "KC", bo=5)))
