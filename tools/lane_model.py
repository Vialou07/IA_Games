#!/usr/bin/env python3
"""Modèle D : note de phase de lane des joueurs, comparable entre ligues (bibliothèque standard seulement).

Pour chaque partie et chaque poste, le joueur bleu affronte le joueur rouge du même poste.
y = écart d'or à 15 min (bleu - rouge)  [ou écart de CS à 15 min]
Modèle par paires, un par poste :
    y = (L[ligue(b)] + u[b]) - (L[ligue(r)] + u[r]) + h + bruit,   bruit ~ N(0, s^2 / w)
    u[i] ~ N(0, s^2 / lam_u)   (talent propre du joueur, ramené vers la moyenne de SA ligue)
    L[k] ~ N(0, s^2 / lam_L)   (force moyenne de la ligue k à ce poste, identifiée par les duels inter-ligues)
    h    ~ N(0, s^2 / lam_h)   (avantage du côté bleu à ce poste)
    w = 0.5 ** (âge en jours / demi_vie)   (pondération dans le temps)
Note du joueur i : r[i] = L[ligue(i)] + u[i] (ligue = celle de sa partie la plus récente).
Estimation : moindres carrés pondérés régularisés (= moyenne a posteriori gaussienne),
résolus par gradient conjugué préconditionné ; incertitudes = s^2 * v' A^-1 v.

Entrée principale : lane_ratings(C, teams=None, asof=None, prm=None) -> dict (voir sa docstring)."""
import math, re, unicodedata, datetime, collections

REG = {"lck": "LCK", "lpl": "LPL", "lec": "LEC", "lcs": "LCS", "lta_n": "LCS", "cblol-brazil": "CBLOL", "lta_s": "CBLOL",
       "lcp": "LCP", "pcs": "PCS", "vcs": "VCS"}
LINK = {"worlds", "msi", "first_stand", "americas_cup", "lta_cross", "ewc_lol"}   # matchs entre ligues (ou entre conférences)
INTL = {"worlds", "msi", "first_stand"}
FALLBACK = {"R7": "LLA", "EST": "LLA"}   # équipes LLA 2024 : pas de ligue nationale dans le cache
ROLES = ["TOP", "JGL", "MID", "BOT", "SUP"]
# choisis par validation glissante (critère v2, work_lane/choose_v2.py) sur les seules prédictions antérieures au 25/10/2026
DEFAULT = {"half_life": 180.0, "half_life_cross": None, "lam_u": 8.0, "lam_L": 4.0, "lam_h": 1.0, "clip": None}


def norm(s):
    s = str(s or "").lower().replace("ø", "o")
    s = "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]", "", s)


def _days(iso):
    t = datetime.datetime.fromisoformat(iso[:19])
    return (t - datetime.datetime(2024, 1, 1)).total_seconds() / 86400.0


# ---------------------------------------------------------------- données
def prepare(C):
    """Liste des duels de lane (toutes les parties du cache ayant les 10 joueurs).
    Chaque duel : dict(t, d (jours depuis 2024-01-01), gid, mid, slug, role, b, r (clés joueur),
    lb, lr (ligue de chaque côté au moment de la partie), gd, csd (None si pas de 15e minute), tb, tr (équipes))."""
    E, D, G = C["events"], C["details"], C["games"]
    mid_of = {g[0]: m for m, d in D.items() for g in d["g"]}
    # ligue nationale de chaque équipe, par année (la plus jouée)
    tl = collections.defaultdict(collections.Counter)
    code = {}
    for m, d in D.items():
        e = E.get(m)
        if not e: continue
        for t in d["tm"]:
            code[t[0]] = t[1]
            if e["l"] in REG: tl[(t[0], e["t"][:4])][REG[e["l"]]] += 1

    def team_league(tid, year, slug):
        if slug in REG: return REG[slug]
        c = tl.get((tid, year))
        if not c:   # année voisine
            for y in (str(int(year) - 1), str(int(year) + 1)):
                if tl.get((tid, y)): c = tl[(tid, y)]; break
        if c: return c.most_common(1)[0][0]
        return FALLBACK.get(code.get(tid), "AUTRE")

    # identifiants manquants : retrouvés par le nom affiché dans le flux
    by_name = collections.defaultdict(collections.Counter)
    for s in G.values():
        for p in s.get("p", []):
            if p[0]: by_name[norm(p[1])][p[0]] += 1

    def pkey(p):
        if p[0]: return p[0]
        c = by_name.get(norm(p[1]))
        return c.most_common(1)[0][0] if c else "n:" + norm(p[1])

    names, out = {}, []
    for gid, s in G.items():
        if "p" not in s: continue
        m = mid_of.get(gid); e = E.get(m)
        if not e: continue
        t = s.get("s") or e["t"][:19]; year = t[:4]
        lb, lr = team_league(s["b"][0], year, e["l"]), team_league(s["r"][0], year, e["l"])
        P = s["p"]
        for i in range(5):
            a = P[i]; b = next((q for q in P[5:] if q[2] == a[2]), None)
            if not b or a[2] not in ROLES: continue
            ka, kb = pkey(a), pkey(b)
            names[ka] = (t, a[1]) if ka not in names or names[ka][0] < t else names[ka]
            names[kb] = (t, b[1]) if kb not in names or names[kb][0] < t else names[kb]
            ok = a[9] is not None and b[9] is not None
            out.append({"t": t, "d": _days(t), "gid": gid, "mid": m, "slug": e["l"], "role": a[2], "b": ka, "r": kb,
                        "lb": lb, "lr": lr, "gd": (a[9] - b[9]) if ok else None,
                        "csd": (a[10] - b[10]) if ok and a[10] is not None and b[10] is not None else None,
                        "tb": s["b"][0], "tr": s["r"][0]})
    out.sort(key=lambda x: (x["t"], x["gid"], ROLES.index(x["role"])))
    return {"duels": out, "names": {k: v[1] for k, v in names.items()}, "code": code}


def homes(duels, T=None):
    """Ligue de chaque joueur : celle de sa partie la plus récente avant T (tous postes confondus)."""
    h = {}
    for x in duels:   # triés par date
        if T is not None and x["d"] >= T: break
        h[x["b"]] = x["lb"]; h[x["r"]] = x["lr"]
    return h


# ---------------------------------------------------------------- ajustement
class Fit:
    pass


def _cg(matvec, b, x0, dinv, tol=1e-6, maxit=600):
    n = len(b)
    x = list(x0)
    Ax = matvec(x)
    r = [b[i] - Ax[i] for i in range(n)]
    z = [r[i] * dinv[i] for i in range(n)]
    p = list(z)
    rz = sum(r[i] * z[i] for i in range(n))
    bn = math.sqrt(sum(v * v for v in b)) or 1.0
    it = 0
    for it in range(maxit):
        if math.sqrt(sum(v * v for v in r)) <= tol * bn: break
        Ap = matvec(p)
        pAp = sum(p[i] * Ap[i] for i in range(n))
        if pAp <= 0: break
        a = rz / pAp
        for i in range(n):
            x[i] += a * p[i]; r[i] -= a * Ap[i]
        z = [r[i] * dinv[i] for i in range(n)]
        rz2 = sum(r[i] * z[i] for i in range(n))
        beta = rz2 / rz; rz = rz2
        p = [z[i] + beta * p[i] for i in range(n)]
    return x, it


def fit_role(duels, role, T, prm=None, home=None, target="gd", x0=None, use_league=True, use_player=True):
    """Ajuste le modèle d'un poste sur les duels strictement antérieurs à T (jours depuis 2024-01-01).
    use_league=False : pas de terme de ligue (joueurs ramenés vers 0) ; use_player=False : ligues seules."""
    prm = dict(DEFAULT, **(prm or {}))
    H = prm["half_life"]; lu, lL, lh = prm["lam_u"], prm["lam_L"], prm["lam_h"]
    Hx = prm.get("half_life_cross") or H   # demi-vie des duels entre ligues (au moment de la partie)
    if home is None: home = homes(duels, T)
    agg = {}
    sw = 0.0
    for x in duels:
        if x["d"] >= T: break
        if x["role"] != role or x[target] is None: continue
        h_ = Hx if x["lb"] != x["lr"] else H
        w = 0.5 ** ((T - x["d"]) / h_) if h_ else 1.0
        y = x[target]
        if prm["clip"] is not None: y = max(-prm["clip"], min(prm["clip"], y))
        k = (x["b"], x["r"])
        a = agg.get(k)
        if a is None: agg[k] = [w, w * y, w * y * y, 1]
        else: a[0] += w; a[1] += w * y; a[2] += w * y * y; a[3] += 1
        sw += w
    players = sorted({p for k in agg for p in k})
    pidx = {p: i for i, p in enumerate(players)}
    leagues = sorted({home.get(p, "AUTRE") for p in players})
    lidx = {l: i for i, l in enumerate(leagues)}
    P, K = len(players), len(leagues)
    N = P + K + 1; Hh = P + K
    pl = [P + lidx[home.get(p, "AUTRE")] for p in players]   # indice de la ligue de chaque joueur
    rows = []
    b = [0.0] * N
    diag = [0.0] * N
    neff = [0.0] * P; nraw = [0] * P; ncross = [0.0] * K
    for (pb, pr), (W, Wy, Wyy, n) in agg.items():
        ib, ir = pidx[pb], pidx[pr]; kb, kr = pl[ib], pl[ir]
        cross = use_league and kb != kr
        rows.append((ib, ir, kb, kr, W, cross))
        if use_player:
            b[ib] += Wy; b[ir] -= Wy; diag[ib] += W; diag[ir] += W
        if cross:
            b[kb] += Wy; b[kr] -= Wy; diag[kb] += W; diag[kr] += W
            ncross[kb - P] += W; ncross[kr - P] += W
        b[Hh] += Wy; diag[Hh] += W
        neff[ib] += W; neff[ir] += W; nraw[ib] += n; nraw[ir] += n
    BIG = 1e9
    pri = [lu if use_player else BIG] * P + [lL if use_league else BIG] * K + [lh]
    for i in range(N): diag[i] += pri[i]
    dinv = [1.0 / v for v in diag]

    def matvec(th):
        out = [pri[i] * th[i] for i in range(N)]
        hh = th[Hh]
        for ib, ir, kb, kr, W, cross in rows:
            d = hh
            if use_player: d += th[ib] - th[ir]
            if cross: d += th[kb] - th[kr]
            Wd = W * d
            if use_player: out[ib] += Wd; out[ir] -= Wd
            if cross: out[kb] += Wd; out[kr] -= Wd
            out[Hh] += Wd
        return out

    if x0 is not None:
        x0 = [x0.get(("p", p), 0.0) for p in players] + [x0.get(("l", l), 0.0) for l in leagues] + [x0.get(("h",), 0.0)]
    else:
        x0 = [0.0] * N
    th, it = _cg(matvec, b, x0, dinv)
    # variance résiduelle pondérée
    sse = 0.0
    for (pb, pr), (W, Wy, Wyy, n) in agg.items():
        ib, ir = pidx[pb], pidx[pr]; kb, kr = pl[ib], pl[ir]
        pred = th[Hh] + (th[ib] - th[ir] if use_player else 0.0) + (th[kb] - th[kr] if (use_league and kb != kr) else 0.0)
        sse += Wyy - 2 * pred * Wy + pred * pred * W
    F = Fit()
    F.role, F.T, F.prm, F.target = role, T, prm, target
    F.players, F.pidx, F.leagues, F.lidx, F.home = players, pidx, leagues, lidx, home
    F.th, F.N, F.P, F.K, F.matvec, F.dinv, F.it = th, N, P, K, matvec, dinv, it
    F.use_league, F.use_player = use_league, use_player
    F.s2 = sse / sw if sw else 0.0
    F.sw = sw; F.neff, F.nraw, F.ncross = neff, nraw, ncross
    F.h = th[Hh]
    F.L = {l: (th[P + i] if use_league else 0.0) for l, i in lidx.items()}
    return F


def warm(F):
    """Solution précédente, pour démarrer le prochain ajustement."""
    x = {("p", p): F.th[i] for p, i in F.pidx.items()}
    x.update({("l", l): F.th[F.P + i] for l, i in F.lidx.items()})
    x[("h",)] = F.th[-1]
    return x


def rating(F, p, league=None):
    """Note r = L[ligue] + u du joueur p (0 + L si inconnu)."""
    lg = F.home.get(p, league) if p in F.pidx else (league or F.home.get(p))
    L = F.L.get(lg, 0.0)
    u = F.th[F.pidx[p]] if (p in F.pidx and F.use_player) else 0.0
    return L + u


def predict(F, pb, pr, lb=None, lr=None, side=True):
    return rating(F, pb, lb) - rating(F, pr, lr) + (F.h if side else 0.0)


def vec(F, terms):
    """Vecteur creux -> plein. terms : liste de (('p', clé) | ('l', ligue) | ('h',), coef)."""
    v = [0.0] * F.N
    for key, c in terms:
        if key[0] == "p":
            if key[1] in F.pidx and F.use_player: v[F.pidx[key[1]]] += c
        elif key[0] == "l":
            if key[1] in F.lidx and F.use_league: v[F.P + F.lidx[key[1]]] += c
        else:
            v[-1] += c
    return v


def variance(F, v, tol=1e-5):
    """s^2 * v' A^-1 v (variance a posteriori de la combinaison linéaire v)."""
    if not any(v): return 0.0
    z, _ = _cg(F.matvec, v, [0.0] * F.N, F.dinv, tol=tol, maxit=2000)
    return F.s2 * sum(a * b for a, b in zip(v, z))


def player_terms(F, p, league=None):
    lg = F.home.get(p, league) if p in F.pidx else (league or F.home.get(p))
    return [(("p", p), 1.0), (("l", lg), 1.0)]


# ---------------------------------------------------------------- graphe des ligues
def league_graph(duels, T=None, H=None, role=None):
    """Duels entre joueurs de ligues différentes (ligue au moment de la partie), avant T.
    Renvoie (aretes {(a,b): n}, poids {(a,b): somme des poids temporels}, composantes connexes)."""
    E, Wt, nodes = collections.Counter(), collections.Counter(), set()
    for x in duels:
        if T is not None and x["d"] >= T: break
        if role and x["role"] != role: continue
        if x["gd"] is None: continue
        nodes.add(x["lb"]); nodes.add(x["lr"])
        if x["lb"] == x["lr"]: continue
        k = tuple(sorted((x["lb"], x["lr"])))
        E[k] += 1
        if T is not None and H: Wt[k] += 0.5 ** ((T - x["d"]) / H)
    # composantes
    par = {n: n for n in nodes}
    def f(a):
        while par[a] != a: par[a] = par[par[a]]; a = par[a]
        return a
    for a, b in E: par[f(a)] = f(b)
    comp = collections.defaultdict(list)
    for n in nodes: comp[f(n)].append(n)
    return E, Wt, sorted(sorted(c) for c in comp.values())


def player_components(duels, T, role):
    """Composantes connexes du graphe joueurs (duels avant T, un poste) en tenant compte des transferts
    (un joueur = un nœud, quelle que soit son équipe)."""
    par = {}
    def f(a):
        par.setdefault(a, a)
        while par[a] != a: par[a] = par[par[a]]; a = par[a]
        return a
    for x in duels:
        if x["d"] >= T: break
        if x["role"] != role or x["gd"] is None: continue
        par[f(x["b"])] = f(x["r"])
    comp = collections.Counter(f(a) for a in list(par))
    return sorted(comp.values(), reverse=True)


# ---------------------------------------------------------------- sortie pour l'appli
MAJOR = ["LCK", "LPL", "LEC", "LCS", "LCP", "CBLOL"]
Z = {0.8: 1.2816, 0.9: 1.6449, 0.95: 1.9600}


def _sd(F, terms):
    return math.sqrt(max(0.0, variance(F, vec(F, terms))))


def lane_ratings(C, teams, asof=None, prm=None, ci=0.90):
    """Notes de lane (écart d'or et de CS à 15 min) à la date asof (ISO UTC, défaut : maintenant),
    calculées sur les seules parties strictement antérieures.
    teams : contenu de teams.json (nos 19 équipes, 95 titulaires).
    Renvoie {
      "asof", "prm", "ci",
      "players": {clé: {"role", "league",
                        "gd", "gd_sd", "gd_lo", "gd_hi"    note en or à 15 min contre le titulaire moyen de nos 19 équipes au même poste,
                        "csd", "csd_sd", "csd_lo", "csd_hi" (idem en CS),
                        "n" duels 2024+ à ce poste, "neff" poids effectif, "nx" duels contre un joueur d'une autre ligue}},
      "leagues": {poste: {ligue: {"gd", "gd_lo", "gd_hi", "csd", "csd_lo", "csd_hi"   joueur moyen de la ligue contre joueur moyen LCK,
                              "nx" duels inter-ligues (poids effectif), "players" joueurs de la ligue dans le modèle}}},
      "vs": {poste: {"A|B": {"gd", "lo", "hi", "csd"}}}   joueur moyen de A contre joueur moyen de B (6 grandes ligues), hors côté,
      "side": {poste: avantage du côté bleu (or)}, "sigma": {poste: écart type d'un duel autour de la prédiction (or)},
      "sigma_cs": {poste: idem en CS},
      "vs_team": {"A|B": {"gd", "lo", "hi"}}   équipe moyenne de A contre équipe moyenne de B (somme des 5 postes)}
    Duel A contre B (même poste) : E = gd[A] - gd[B] (+ side si A est bleu, - side s'il est rouge),
    P(A devant à 15 min) = Phi(E / sqrt(sigma^2 + gd_sd[A]^2 + gd_sd[B]^2))   (voir duel())."""
    prm = dict(DEFAULT, **(prm or {}))
    z = Z[ci]
    duels = prepare(C)["duels"]
    now = asof or datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")
    T = _days(now)
    home = homes(duels, T)
    pid_of = {k: p for p, k in C["roster"]["players"].items()}   # clé -> esportsPlayerId
    team_league = {t["id"]: t["league"] for t in teams}
    role_of = {p["key"]: p["role"] for t in teams for p in t["players"]}
    team_of = {p["key"]: t["id"] for t in teams for p in t["players"]}
    byrole = {R: [x for x in duels if x["role"] == R] for R in ROLES}
    out = {"asof": now, "prm": prm, "ci": ci, "players": {}, "leagues": {}, "vs": {}, "side": {}, "sigma": {}, "sigma_cs": {}}
    for role in ROLES:
        fits = {tg: fit_role(byrole[role], role, T, prm, home, target=tg) for tg in ("gd", "csd")}
        mine = [k for k, r in role_of.items() if r == role]
        nx = collections.Counter()
        for x in byrole[role]:
            if x["d"] < T and x["gd"] is not None and x["lb"] != x["lr"]:
                nx[x["b"]] += 1; nx[x["r"]] += 1
        for tg, F in fits.items():
            nd = 1 if tg == "gd" else 2

            def terms_of(k, F=F):
                p = pid_of.get(k)
                lg = F.home.get(p) if p in F.pidx else team_league[team_of[k]]
                return [(("p", p), 1.0), (("l", lg), 1.0)], lg, p
            ref = []
            for k in mine:
                ref += [(t, -c / len(mine)) for t, c in terms_of(k)[0]]
            refv = sum(rating(F, terms_of(k)[2], terms_of(k)[1]) for k in mine) / len(mine)
            for k in mine:
                tm, lg, p = terms_of(k)
                r = rating(F, p, lg) - refv
                sd = _sd(F, tm + ref)
                if p not in F.pidx:   # aucun duel à ce poste : on ajoute l'incertitude du talent propre
                    sd = math.sqrt(sd * sd + F.s2 / prm["lam_u"])
                q = out["players"].setdefault(k, {"role": role, "league": lg})
                q[tg] = round(r, nd); q[tg + "_sd"] = round(sd, nd)
                q[tg + "_lo"] = round(r - z * sd, nd); q[tg + "_hi"] = round(r + z * sd, nd)
                if tg == "gd":
                    i = F.pidx.get(p)
                    q["n"] = F.nraw[i] if i is not None else 0
                    q["neff"] = round(F.neff[i], 1) if i is not None else 0.0
                    q["nx"] = nx.get(p, 0)
        # ligues : joueur moyen de la ligue contre joueur moyen LCK
        F, Fc = fits["gd"], fits["csd"]
        Lg = {}
        for l in F.leagues:
            d = F.L[l] - F.L.get("LCK", 0.0)
            sd = _sd(F, [(("l", l), 1.0), (("l", "LCK"), -1.0)]) if l != "LCK" else 0.0
            dc = Fc.L.get(l, 0.0) - Fc.L.get("LCK", 0.0)
            sdc = _sd(Fc, [(("l", l), 1.0), (("l", "LCK"), -1.0)]) if l != "LCK" else 0.0
            Lg[l] = {"gd": round(d, 1), "gd_lo": round(d - z * sd, 1), "gd_hi": round(d + z * sd, 1),
                     "csd": round(dc, 2), "csd_lo": round(dc - z * sdc, 2), "csd_hi": round(dc + z * sdc, 2),
                     "nx": round(F.ncross[F.lidx[l]], 1), "players": sum(1 for p in F.players if F.home.get(p) == l)}
        out["leagues"][role] = Lg
        vs = {}
        main = [l for l in MAJOR if l in F.lidx]
        for i, a in enumerate(main):
            for b in main[i + 1:]:
                d = F.L[a] - F.L[b]
                sd = _sd(F, [(("l", a), 1.0), (("l", b), -1.0)])
                vs[a + "|" + b] = {"gd": round(d, 1), "lo": round(d - z * sd, 1), "hi": round(d + z * sd, 1),
                                   "csd": round(Fc.L.get(a, 0.0) - Fc.L.get(b, 0.0), 2)}
        out["vs"][role] = vs
        out["side"][role] = round(F.h, 1)
        out["sigma"][role] = round(math.sqrt(F.s2), 1)
        out["sigma_cs"][role] = round(math.sqrt(Fc.s2), 2)
    # équipe moyenne de A contre équipe moyenne de B : somme des 5 postes (modèles indépendants : variances additionnées)
    out["vs_team"] = {}
    for pair in out["vs"]["MID"]:
        d = sum(out["vs"][r][pair]["gd"] for r in ROLES)
        sd = math.sqrt(sum(((out["vs"][r][pair]["hi"] - out["vs"][r][pair]["lo"]) / (2 * z)) ** 2 for r in ROLES))
        out["vs_team"][pair] = {"gd": round(d, 1), "lo": round(d - z * sd, 1), "hi": round(d + z * sd, 1)}
    return out


def Phi(x):
    return 0.5 * (1 + math.erf(x / math.sqrt(2)))


def duel(R, a, b, a_side=None):
    """Duel de lane entre deux de nos joueurs (clés EQUIPE_pseudo, même poste), d'après lane_ratings().
    a_side : "b" (A côté bleu), "r" ou None (inconnu). Renvoie (écart d'or attendu à 15 min pour A, P(A devant à 15 min))."""
    A, B = R["players"][a], R["players"][b]
    role = A["role"]
    e = A["gd"] - B["gd"] + {"b": 1, "r": -1}.get(a_side, 0) * R["side"][role]
    s = math.sqrt(R["sigma"][role] ** 2 + A["gd_sd"] ** 2 + B["gd_sd"] ** 2)
    return e, Phi(e / s)


if __name__ == "__main__":
    import json, gzip, os, sys
    here = os.path.dirname(os.path.abspath(__file__))
    cache = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(here), "cache.json.gz")
    teams_f = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(here), "teams.json")
    C = json.load(gzip.open(cache, "rt", encoding="utf-8"))
    R = lane_ratings(C, json.load(open(teams_f, encoding="utf-8")))
    print(json.dumps(R, ensure_ascii=False)[:2000])
