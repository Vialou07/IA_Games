#!/usr/bin/env python3
"""Modèles du robot, appelés par build_stats.models_block() (conçus et testés hors ligne par l'équipe de modélisation).
Bibliothèque standard seulement. Chaque fonction prend le cache C APRÈS build() (côtés et vainqueurs déjà corrigés en mémoire).

  impact_block(C, teams, bs, unc_cache)   -> clé "m"     (modèle E : notes, rangs, incertitudes, paires, ligues)
  lane_block(C, teams)                    -> clé "lane"  (modèle D : CS et or à 15 min corrigés)
  sim_block(C, teams, bs, R, hist)        -> clé "sim"   (worlds_sim, sans la matrice des duels)
  league_record(C, W)                     -> clé "lgr"   (bilan brut des ligues entre elles aux internationaux)
  track_record(C, W, R, pronos)           -> clé "fiab"  (fiche du modèle + pronos des Worlds 2026 et leur bilan)
"""
import os, sys, math, json, time, random, datetime, types, collections, bisect
import concurrent.futures as cf

ROLES = ("TOP", "JGL", "MID", "BOT", "SUP")
HOME = {"lck": "LCK", "lpl": "LPL", "lec": "LEC", "lcs": "LCS", "lta_n": "LCS", "cblol-brazil": "CBLOL", "lta_s": "CBLOL",
        "lcp": "LCP", "pcs": "PCS", "vcs": "VCS"}
INTL = ("worlds", "msi", "first_stand", "ewc_lol")


def q(v, p):
    v = sorted(v); k = (len(v) - 1) * p; i = int(k); f = k - i
    return v[i] + (v[min(i + 1, len(v) - 1)] - v[i]) * f


def sig(x): return 1 / (1 + math.exp(-x)) if x > -500 else 0.0


# ------------------------------------------------------------------ 1. modèle E
_W = {}
def _winit(light):
    import model_e
    eng = model_e.Engine.__new__(model_e.Engine)
    eng.__dict__.update(light); _W["eng"] = eng


def _wboot(args):
    """Un rééchantillonnage par match (même tirage que work_E/report.py : graine 1000 + b)."""
    seed, T, P, x0, keep = args
    eng = _W["eng"]; rnd = random.Random(seed)
    mids = sorted({x[1] for x in eng.PG if x[0] < T})
    mult = {}
    for _ in range(len(mids)):
        m = mids[rnd.randrange(len(mids))]; mult[m] = mult.get(m, 0) + 1
    F = eng.fit(T, P["H"], P["lam"], P["lamL"], x0=x0, mult=mult, tol=1e-5)
    return [F["r"][j] for j in keep], F["L"]


def bootstrap(R, B=200, workers=4):
    """Incertitudes du modèle E : B réajustements sur des matchs tirés avec remise, en parallèle (processus)."""
    import model_e
    eng, F = R["_eng"], R["_F"]; P = R["params"]
    keep = sorted({v["j"] for v in R["players"].values()})
    light = {k: getattr(eng, k) for k in ("PG", "PT", "NP", "leagues", "lidx")}
    args = [(1000 + b, F["T"], P, F["x"], keep) for b in range(B)]
    if workers > 1:
        with cf.ProcessPoolExecutor(workers, initializer=_winit, initargs=(light,)) as ex:
            res = list(ex.map(_wboot, args, chunksize=max(1, B // (4 * workers))))
    else:
        _winit(light); res = [_wboot(a) for a in args]
    pos = {j: i for i, j in enumerate(keep)}
    return [{"r": {j: r[pos[j]] for j in keep}, "L": L} for r, L in res]


def uncertainty(R, boots):
    """Résumé des rééchantillonnages, gardé dans le cache (C["m_unc"]) et réutilisé jusqu'au lendemain."""
    P = R["players"]; eng = R["_eng"]; B = len(boots)
    sd = lambda v: math.sqrt(sum((x - sum(v) / len(v)) ** 2 for x in v) / (len(v) - 1))
    out = {"B": B, "sd": {}, "rk": {}, "pd": {}, "lg": {}, "tsd": {}}
    for k, v in P.items(): out["sd"][k] = round(sd([b["r"][v["j"]] for b in boots]), 3)
    for role in ROLES:
        ks = sorted([k for k in P if P[k]["role"] == role], key=lambda k: -P[k]["note"])
        ranks = {k: [] for k in ks}
        for b in boots:
            for i, k in enumerate(sorted(ks, key=lambda k: -b["r"][P[k]["j"]])): ranks[k].append(i + 1)
        for k in ks: out["rk"][k] = [round(q(ranks[k], .05)), round(q(ranks[k], .95))]
        tri = []
        for i in range(len(ks)):
            for j in range(i + 1, len(ks)):
                a, c = P[ks[i]]["j"], P[ks[j]]["j"]
                tri.append(round(1000 * sd([b["r"][a] - b["r"][c] for b in boots])))
        out["pd"][role] = {"o": ks, "s": tri}
    for i, l in enumerate(eng.leagues):
        if l == "AUTRE": continue
        v = [b["L"][i] for b in boots]; out["lg"][l] = [round(q(v, .05), 3), round(q(v, .95), 3)]
    MAJ = [l for l in ("LCK", "LPL", "LEC", "LCS", "LCP", "CBLOL") if l in eng.lidx]
    out["lgd"] = {}
    for i, a in enumerate(MAJ):   # écart entre deux ligues : IC 90 % de la différence (pas des deux niveaux séparés)
        for c in MAJ[i + 1:]:
            v = [b["L"][eng.lidx[a]] - b["L"][eng.lidx[c]] for b in boots]
            out["lgd"][a + "|" + c] = [round(q(v, .05), 3), round(q(v, .95), 3)]
    teams = collections.defaultdict(list)
    for k, v in P.items(): teams[v["team"]].append(v["j"])
    for t, js in teams.items(): out["tsd"][t] = round(sd([sum(b["r"][j] for j in js) for b in boots]), 3)
    return out


def descriptives(R):
    """Par joueur : perf brute moyenne pondérée, adversité moyenne rencontrée, parties sur 365 jours (dont internationales)."""
    import model_e
    eng, F = R["_eng"], R["_F"]; T = F["T"]; H = R["params"]["H"]; r = F["r"]
    acc = {}
    for t, mid, idx, ys, lg in eng.PG[:F["n"]]:
        w = 0.5 ** ((T - t) / H)
        a = [r[j] for j in idx]; M0 = sum(a[:5]) / 5; M1 = sum(a[5:]) / 5
        for qq in range(10):
            x = acc.setdefault(idx[qq], [0.0, 0.0, 0.0, 0, 0])
            x[0] += w; x[1] += w * ys[qq]; x[2] += w * (M1 if qq < 5 else M0)
            if T - t < 365: x[3] += 1; x[4] += lg in model_e.INTL
    return acc


def impact_block(C, teams, bs, teams_path, unc_cache=None, B=200, workers=4, today=None):
    """Clé "m". Points recalculés à chaque passage (~2 s) ; incertitudes (B rééchantillonnages) une fois par jour."""
    import model_e
    t0 = time.time()
    R = model_e.ratings(C, boot=0, teams_path=teams_path, bs=types.SimpleNamespace(winners=bs.winners))
    t1 = time.time()
    today = today or datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")
    U = unc_cache if unc_cache and unc_cache.get("day") == today and unc_cache.get("B") == B else None
    if U is None:
        U = uncertainty(R, bootstrap(R, B, workers)); U["day"] = today
    t2 = time.time()
    P = R["players"]; acc = descriptives(R)
    p = {}
    for role in ROLES:
        ks = sorted([k for k in P if P[k]["role"] == role], key=lambda k: -P[k]["note"])
        for i, k in enumerate(ks):
            x = acc[P[k]["j"]]
            rk = U["rk"].get(k, [i + 1, i + 1])
            p[k] = [round(P[k]["note"], 3), U["sd"].get(k), i + 1, len(ks), rk[0], rk[1],
                    round(x[2] / x[0], 3), round(x[1] / x[0], 3), x[3], x[4]]
    a0, al = R["logit"]
    # compatible avec l'appli v9.3 : lg et t restent des nombres, p garde ses 6 premiers champs
    m = {"p": p, "t": {t: round(v, 3) for t, v in R["teams"].items()}, "tsd": U["tsd"],
         "lg": {l: round(v, 3) for l, v in R["leagues"].items() if l != "AUTRE"}, "lgc": U["lg"], "lgd": U["lgd"],
         "pd": U["pd"], "logit": [round(a0, 4), round(al, 4)], "B": U["B"], "ud": U["day"],
         "res": round(R["_eng"].residual_sd(R["_F"], R["params"]["H"]), 3)}
    return m, R, U, {"points": t1 - t0, "incertitudes": t2 - t1, "total": time.time() - t0}


# ------------------------------------------------------------------ 2. modèle D (lane)
def lane_block(C, teams, asof=None):
    """asof = heure de la dernière partie connue : sans nouvelle donnée, le résultat ne bouge pas (pas de publication inutile)."""
    import lane_model
    t0 = time.time()
    L = lane_model.lane_ratings(C, teams, asof=asof)
    MAJ = ("LCK", "LPL", "LEC", "LCS", "LCP", "CBLOL")
    out = {"p": {k: [v["csd"], v["csd_sd"], v["gd"], v["gd_sd"], v["nx"]] for k, v in L["players"].items()},
           "sg": {r: [L["sigma"][r], L["sigma_cs"][r], L["side"][r]] for r in ROLES},
           "lg": {r: {l: [x["gd"], x["gd_lo"], x["gd_hi"], x["csd"], x["csd_lo"], x["csd_hi"]] for l, x in L["leagues"][r].items() if l in MAJ}
                  for r in ROLES},
           "tm": {k: [v["gd"], v["lo"], v["hi"]] for k, v in L["vs_team"].items()},
           "ci": L["ci"], "asof": L["asof"][:16]}
    return out, L, time.time() - t0


# ------------------------------------------------------------------ 3. simulation (worlds_sim) avec les notes déjà calculées
def sim_block(C, teams, bs, R, hist=None, now_iso=None):
    import worlds_sim, model_e
    eng, F = R["_eng"], R["_F"]

    def strengths(C_, labels, tid_of, M, asof=None, bs=None):   # même calcul que worlds_sim.strengths_E, sans réajuster E
        G = eng.games; T = F["T"]; cnt, last = {}, {}
        for g in G:
            h = HOME.get(g["lg"])
            for t in (g["b"], g["r"]):
                if h: c = cnt.setdefault(t, {}); c[h] = c.get(h, 0) + 1
            if g["P"] and g["t"] < T:
                last[g["b"]] = [pp[0] for pp in g["P"][:5]]; last[g["r"]] = [pp[0] for pp in g["P"][5:]]
        home = {t: max(c, key=c.get) for t, c in cnt.items()}
        keyof = C_.get("roster", {}).get("players", {})
        S, LU, LG = {}, {}, {}
        for lab in labels:
            tid = tid_of.get(lab); lu = last.get(tid); LG[lab] = home.get(tid, "?")
            S[lab] = sum(model_e.player_rating(F, eng, p, LG[lab]) for p in lu) if lu else 5 * model_e.player_rating(F, eng, None, LG[lab])
            LU[lab] = [keyof.get(p, p) for p in lu] if lu else []
        return S, LU, LG, tuple(R["logit"])

    t0 = time.time()
    keep = worlds_sim.strengths_E; worlds_sim.strengths_E = strengths
    try: S = worlds_sim.run(C, teams, bs=types.SimpleNamespace(winners=bs.winners, lean=bs.lean), now=worlds_sim.tday(now_iso) if now_iso else None)
    finally: worlds_sim.strengths_E = keep
    dt = time.time() - t0
    if not S.get("equipes"): return None, S, dt
    K = ("p_3_0", "p_3_1", "p_3_2", "p_2_3", "p_1_3", "p_0_3", "p_qualif", "p_demie", "p_finale", "p_titre")
    snap = [(now_iso or S["maj"])[:16], S["matchs_suisses_joues"], {t: [round(v["p_qualif"], 3), round(v["p_titre"], 3)] for t, v in S["equipes"].items()}]
    hist = list(hist or [])
    if not hist or hist[-1][1] != snap[1]: hist.append(snap)   # un instantané par match suisse terminé
    else: hist[-1] = snap
    # compatible avec l'appli v9.3 : eq, mt (6 premiers champs) et nx inchangés ; d (matrice des duels) remplacé par S + var
    out = {"maj": (now_iso or S["maj"])[:16], "statut": S["statut"], "modele": S["modele"], "n": S["tirages"],
           "eq": {t: [v["bilan"]] + [round(v[k], 4) for k in K] for t, v in S["equipes"].items()},
           "mt": [[x["match"], x["a"], x["b"], x["bo"], x["p_a"], x.get("score"), x["date"][:16], x.get("bleu")]
                  for x in S["matchs"] if x.get("a") and not x.get("vainqueur") and "p_a" in x],
           "nx": {t: [[e["adversaire"], e["p_tirage"], e["p_victoire"], e["bo"]] for e in v] for t, v in S["prochaine_ronde"].items()},
           "nr": S["prochaine_ronde_tiree"], "S": {t: round(v["force"], 3) for t, v in S["equipes"].items()},
           "var": [S["variances"]["serie"], S["variances"]["derive"]], "h": S["horizons_jours"], "hist": hist}
    return out, S, dt


# ------------------------------------------------------------------ 4. bilan brut des ligues entre elles
def league_record(C, W, since="2025-01-01"):
    """Parties internationales entre équipes de ligues différentes : victoires par paire de ligues (données brutes)."""
    E, D, G = C["events"], C["details"], C["games"]
    cnt = collections.defaultdict(collections.Counter)
    for m, d in D.items():
        e = E.get(m)
        if not e or e["l"] not in HOME: continue
        for t in d["tm"]: cnt[(t[0], e["t"][:4])][HOME[e["l"]]] += 1
    home = lambda tid, y: (cnt.get((tid, y)) or cnt.get((tid, str(int(y) - 1))) or collections.Counter({"?": 1})).most_common(1)[0][0]
    rec = collections.defaultdict(lambda: [0, 0])
    for m, d in D.items():
        e = E.get(m)
        if not e or e["l"] not in INTL or e["t"] < since or len(d["tm"]) != 2: continue
        y = e["t"][:4]; ids = [t[0] for t in d["tm"]]
        la, lb = home(ids[0], y), home(ids[1], y)
        if la == lb or "?" in (la, lb): continue
        for g in d["g"]:
            w = W.get(g[0])
            if not w: continue
            a, b = sorted([la, lb]); wl = la if w == ids[0] else lb
            rec[a + "|" + b][0 if wl == a else 1] += 1
    return {k: v for k, v in sorted(rec.items(), key=lambda kv: -sum(kv[1]))}


# ------------------------------------------------------------------ 5. fiabilité : fiche du modèle + pronos des Worlds 2026
def worlds_preds(C, W, R, year="2026"):
    """Prono E de chaque partie et série des Worlds 2026 déjà jouées, avec les seules parties antérieures au jour du match
    (réajustement à 0 h UTC chaque jour de match). Composition : celle de la partie (connue à la draft)."""
    import model_e
    eng, F = R["_eng"], R["_F"]; P = R["params"]; a0, al = R["logit"]
    E, D, G = C["events"], C["details"], C["games"]
    fits = {}
    games, series = [], []
    for m, d in sorted(D.items(), key=lambda kv: E.get(kv[0], {}).get("t", "")):
        e = E.get(m)
        if not e or e["l"] != "worlds" or e["t"][:4] != year or e["st"] != "completed" or len(d["tm"]) != 2: continue
        day = e["t"][:10]
        if day not in fits: fits[day] = eng.fit(model_e.tday(day + "T00:00:00"), P["H"], P["lam"], P["lamL"], x0=F["x"])
        Fd = fits[day]; ids = [t[0] for t in d["tm"]]
        ds = []
        for g in sorted(d["g"], key=lambda g: g[1]):
            w = W.get(g[0]); s = G.get(g[0])
            if not w or not s or "p" not in s: continue
            sb = sum(model_e.player_rating(Fd, eng, pp[0]) for pp in s["p"][:5]); sr = sum(model_e.player_rating(Fd, eng, pp[0]) for pp in s["p"][5:])
            dd = sb - sr; pb = sig(a0 + al * dd)
            games.append({"mid": m, "n": g[1], "bo": e["bo"], "b": s["b"][0], "r": s["r"][0], "p": pb, "y": int(w == s["b"][0])})
            ds.append(dd if s["b"][0] == ids[0] else -dd)
        if ds:
            pa = model_e.series_prob(sig(al * ds[0]), e["bo"]) if e["bo"] > 1 else None
            wins = {t[0]: t[3] or 0 for t in d["tm"]}
            series.append({"mid": m, "a": ids[0], "b": ids[1], "bo": e["bo"], "d": ds[0], "pa": pa, "y": int(wins[ids[0]] > wins[ids[1]]), "t": e["t"]})
    return games, series, len(fits)


def scores(rows, pk, yk):
    n = len(rows)
    if not n: return None
    ll = -sum(math.log(r[pk] if r[yk] else 1 - r[pk]) for r in rows) / n
    br = sum((r[pk] - r[yk]) ** 2 for r in rows) / n
    acc = sum(1 for r in rows if (r[pk] > .5) == bool(r[yk])) / n
    return {"n": n, "ll": round(ll, 4), "brier": round(br, 4), "fav": round(acc, 3)}


# ------------------------------------------------------------------ 6. état des modèles (data/model_state.json) et clé "fiab"
FICHE = {   # chiffres du juge (work_juge/judge_results.json), à mettre à jour quand on réajuste les constantes
    "E": {"g": [343, 0.6221, 0.2171, 0.6472], "s": [118, 0.5606, 0.1878, 0.7034], "g26": [2797, 0.6306, 0.2202, 0.6396], "s26": [1074, 0.5879, 0.2006, 0.689]},
    "lig": {"g": [343, 0.6365, 0.2221, 0.6662], "s": [118, 0.5938, 0.2018, 0.7161], "g26": [2797, 0.6908, 0.2488, 0.5082]},
    "cal": [[0.553, 0.532, 109], [0.650, 0.622, 111], [0.746, 0.723, 83], [0.840, 0.872, 39]]}


def freeze_pronos(ST, C, sim_raw, now_iso):
    """Prono de chaque match des Worlds connu et pas encore commencé : réécrit à chaque passage, figé dès le coup d'envoi."""
    P = ST.setdefault("pronos", {}); E = C["events"]
    for x in sim_raw.get("matchs", []):
        if x.get("a") and not x.get("vainqueur") and "p_a" in x and x.get("score") in ("0-0", None) and E.get(x["match"], {}).get("st") == "unstarted":
            P[x["match"]] = [now_iso[:16], x["a"], x["b"], x["bo"], round(x["p_a"], 4)]
    return P


def fiab_block(ST, C, W, R, sim_raw):
    """Fiche du modèle + bilan des pronos des Worlds 2026 : prono gelé avant le match s'il existe ("g"), sinon recalculé ("r")
    avec les seules parties antérieures au jour du match (calcul fait une fois, gardé dans l'état)."""
    E, D = C["events"], C["details"]
    done = [m for m, e in E.items() if e.get("l") == "worlds" and e["t"][:4] == "2026" and e["st"] == "completed" and m in D]
    back = ST.setdefault("back", {})
    t0 = time.time()
    if any(m not in back and m not in ST.get("pronos", {}) for m in done):
        g26, s26, _ = worlds_preds(C, W, R)
        import worlds_sim
        a0, al = R["logit"]
        for s in s26:
            z = al * s["d"]; back[s["mid"]] = round(worlds_sim.match_prob(a0 + z, a0 - z, z, s["bo"], True), 4)
        ST["games"] = {"%s_%d" % (x["mid"], x["n"]): [round(x["p"], 4), x["y"]] for x in g26}
    rows = []
    for m in sorted(done, key=lambda m: E[m]["t"]):
        tm = D[m]["tm"]; wins = {t[0]: t[3] or 0 for t in tm}; ida = tm[0][0]
        y = int(wins[ida] > wins[tm[1][0]])
        code = lambda i: C["roster"]["teams"].get(tm[i][0], tm[i][1])
        if m in ST.get("pronos", {}):
            f = ST["pronos"][m]; p = f[4] if f[1] == code(0) else 1 - f[4]; src = "g"
        elif m in back: p, src = back[m], "r"
        else: continue
        rows.append([m, E[m]["t"][:10], code(0), code(1), E[m]["bo"], p, y, src])
    sc = lambda L: scores([{"p": r[0], "y": r[1]} for r in L], "p", "y") if L else None
    g = sc(list(ST.get("games", {}).values())); s = sc([[r[5], r[6]] for r in rows])
    return {"t": {k: v for k, v in FICHE.items() if k != "cal"}, "cal": FICHE["cal"],
            "w26": {"m": rows, "g": [g[k] for k in ("n", "ll", "brier", "fav")] if g else None, "s": [s[k] for k in ("n", "ll", "brier", "fav")] if s else None}}, time.time() - t0
