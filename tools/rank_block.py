"""Classements par poste avec le pourquoi, « Spécial Worlds », qui va gagner, qui domine qui : clé « rk » de stats.json.

Entrée : rank_block(FLAT, teams, R, m, sim, now_iso) -> dict ; jamais d'exception (une partie en panne est notée dans "err").
- FLAT : parties à plat remplies par build() (clés de rows en entiers dans le robot, en chaînes si relues d'un JSON) ;
- teams : data/teams.json ; R : sortie de model_e.ratings (avec R["_eng"], R["_F"]) ; m : stats["m"] ; sim : stats["sim"]
  (None hors Worlds) ; now_iso : heure de la dernière partie (donne l'année des stats de saison).
Contenu (format détaillé dans RAPPORT.md) :
- P  : par poste, les titulaires dans l'ordre de la note d'impact. La note est décomposée exactement en axes (avance à
       15 min, farm, KDA, participation, niveau des adversaires, reste du modèle) ; 2 raisons et 1 faiblesse par joueur,
       chacune avec sa stat de la saison (vérifiable sur gol.gg) et son rang au poste ;
- I, T, it : « Spécial Worlds ». Performance et victoires aux internationaux (Worlds, MSI, First Stand, EWC) comparées à
       ce que prévoyait la note d'avant chaque tournoi, pour chaque titulaire et chaque équipe, et les tests de stabilité ;
- W  : qui va gagner ces Worlds (favori, challengers, outsider) et leurs raisons chiffrées ;
- D, dt : qui domine qui au même poste (bilan direct contre attendu d'après la force des équipes) et son test.
Temps : environ 5 s (9 réajustements du modèle E, un par tournoi international)."""
import math, random, collections

ROLES = ("TOP", "JGL", "MID", "BOT", "SUP")
INTL = ("worlds", "msi", "first_stand", "ewc_lol")
# axes de la note : (nom, métriques du modèle E) ; « adv » = niveau moyen des adversaires, « rest » = le reste du modèle
AXES = (("l15", ("gd15", "csd15")), ("farm", ("gpm", "cspm")), ("kda", ("kda",)), ("kp", ("kp",)))
AXN = ("l15", "farm", "kda", "kp", "adv", "rest")
GAP = 0.03            # écart minimal à la moyenne du poste pour qu'un axe soit une raison (ou une faiblesse)
# rang de saison montré pour chaque axe (indice dans la liste des rangs) ; farm : CS/min, or/min pour les supports
SHOW = {"l15": 0, "kda": 4, "kp": 5, "adv": 6}
MIN_G = 10            # parties de saison minimum pour être classé sur une stat
# qualification aux Worlds 2026 (TEAMS.seed dans worlds.html) : rang dans sa ligue
SEED = {"GEN": 1, "HLE": 2, "T1": 3, "DK": 4, "AL": 1, "BLG": 2, "TES": 3, "IG": 4, "G2": 1, "MKOI": 2, "KC": 3, "TL": 1,
        "LYON": 2, "C9": 3, "TSW": 1, "CFO": 2, "MVK": 3, "LOS": 1, "FUR": 2}
# « Spécial Worlds » : seuils d'un effet net (joueur ou équipe)
NET_N, NET_Z, NET_P = 20, 2.0, 8   # parties minimum, |z| minimum, parties minimum dans chaque période (2024 / depuis 2025)
SPLITS = 60                        # tirages moitié/moitié par série
# qui domine qui : paires gardées et paires « remarquables »
D_MIN, D_REM, D_NET = 3, 8, 3.0
# Elo d'équipe par partie (copie de fiche_block.elo, mêmes constantes : mêmes victoires attendues que la fiche joueur)
ELO0 = {"lck": 1650, "lpl": 1650, "lec": 1520, "lcs": 1450, "lta_n": 1450, "lcp": 1430, "pcs": 1420, "vcs": 1400,
        "cblol-brazil": 1350, "lta_s": 1350, "lta_cross": 1400}
K_REG, K_INTL, SHRINK, BLUE, SCALE = 24, 36, 0.8, 25, 0.85
ELO_INTL = {"worlds", "msi", "first_stand", "ewc_lol", "americas_cup", "lta_cross"}
NO_ELO = {"kespa_cup"}


def rank_block(FLAT, teams, R, m, sim, now_iso):
    """Point d'entrée. Sortie déterministe (pas d'heure de calcul dedans) : sans nouvelle partie, rien ne change."""
    out = {"v": 1, "err": []}
    try:
        ctx = _ctx(FLAT, teams, R, m, now_iso)
    except Exception as e:
        return {"v": 1, "err": ["base: %s: %s" % (type(e).__name__, str(e)[:160])]}
    out["asof"] = ctx["now"][:10]; out["y"] = ctx["Y"]
    for name, fn in (("P", _ranks), ("I", _intl), ("W", _who), ("D", _duels)):
        try:
            out.update(fn(ctx, sim) if name == "W" else fn(ctx))
        except Exception as e:
            out["err"].append("%s: %s: %s" % (name, type(e).__name__, str(e)[:160]))
    if not out["err"]: del out["err"]
    return out


# ---------------------------------------------------------------- contexte commun
def _row(g, i):
    rw = g["rows"]; return rw.get(i, rw.get(str(i)))


def _ctx(FLAT, teams, R, m, now_iso):
    PL = {p["key"]: dict(p, team=t["id"], league=t["league"]) for t in teams for p in t["players"]}
    G = sorted(FLAT, key=lambda g: (g["t"], g["m"], g["n"]))
    now = now_iso or (G[-1]["t"] if G else "")
    eng = R["_eng"]
    pid_key = {eng.plist[v["j"]]: k for k, v in R["players"].items()}
    # identifiant LoL Esports d'équipe -> notre équipe (au moins 3 de nos titulaires alignés de ce côté, 2025-2026)
    votes = collections.defaultdict(collections.Counter)
    for g in G:
        if g["t"] < "2025": continue
        ks = g.get("ks") or [None] * 10
        for s, tid in ((0, g["b"]), (1, g["r"])):
            c = collections.Counter(PL[k]["team"] for k in ks[5 * s:5 * s + 5] if k in PL)
            if c and c.most_common(1)[0][1] >= 3: votes[tid][c.most_common(1)[0][0]] += 1
    tid_team = {tid: c.most_common(1)[0][0] for tid, c in votes.items()}
    return {"PL": PL, "G": G, "now": now, "Y": now[:4], "R": R, "m": m, "pid_key": pid_key, "tid_team": tid_team, "teams": teams}


# ---------------------------------------------------------------- 1. classements par poste et leur pourquoi
def _decomp(R):
    """Décomposition exacte de la note : perf brute (moyenne pondérée de l'indice y) = somme des parts des 6 métriques ;
    note = perf brute + adversité moyenne + reste (rappel vers la ligue et effet du joueur sur ses adversaires).
    Renvoie {j: {"l15", "farm", "kda", "kp", "adv", "perf"}} et {gid: y} (indice de perf de chaque partie)."""
    import model_e
    eng, F = R["_eng"], R["_F"]; T, n, H = F["T"], F["n"], R["params"]["H"]
    mets = model_e.VARIANTS[R["params"]["variant"]]
    consts = model_e.norm_consts(eng.games)
    parts, acc = [], {}
    for g in eng.games:
        M = model_e.raw_metrics(g)
        if not M: continue
        row = []
        for pp, mm in zip(g["P"], M):
            z = {k: (mm[k] - consts[(pp[1], k)][0]) / consts[(pp[1], k)][1] for k in mets if mm[k] is not None}
            row.append({k: v / len(z) for k, v in z.items()} if z else {})
        parts.append((g, row))
        if g["day"] < "2025-01-01":
            for pp, d in zip(g["P"], row):
                v = sum(d.values()); a = acc.setdefault(pp[1], [0, 0.0, 0.0]); a[0] += 1; a[1] += v; a[2] += v * v
    if len(parts) != len(eng.PG): raise ValueError("parties non alignées avec le modèle")
    rc = {k: (s / c, math.sqrt(max(1e-12, ss / c - (s / c) ** 2))) for k, (c, s, ss) in acc.items()}
    r = F["r"]; S = {}; ys_of = {}
    for i, ((g, row), (t, mid, idx, ys, lg)) in enumerate(zip(parts, eng.PG)):
        ys_of[g["gid"]] = ys
        if i >= n: continue
        w = 0.5 ** ((T - t) / H)
        a = [r[j] for j in idx]; M0 = sum(a[:5]) / 5; M1 = sum(a[5:]) / 5
        for q in range(10):
            j = idx[q]; mu, sd = rc[g["P"][q][1]]
            x = S.get(j)
            if x is None: x = S[j] = {"w": 0.0, "adv": 0.0, "c0": 0.0, **{k: 0.0 for k in mets}}
            x["w"] += w; x["adv"] += w * (M1 if q < 5 else M0); x["c0"] -= w * mu / sd
            for k, v in row[q].items(): x[k] += w * v / sd
    out = {}
    for j, x in S.items():
        w = x["w"]; o = {ax: sum(x.get(k, 0.0) for k in ks) / w for ax, ks in AXES}
        o["adv"] = x["adv"] / w; o["perf"] = (x["c0"] + sum(x.get(k, 0.0) for k in mets)) / w
        out[j] = o
    return out, ys_of


def _season(ctx):
    """Stats de la saison en cours de nos titulaires, calculées comme gol.gg : [parties, victoires, or à 15 min, CS à 15 min,
    CS/min, or/min, KDA, participation (%)] (moyenne par partie sauf CS/min = total / minutes et KDA = (K + A) / D)."""
    A = {}
    for g in ctx["G"]:
        if g["t"][:4] != ctx["Y"]: continue
        ks = g.get("ks") or [None] * 10
        for i in range(10):
            k = ks[i]
            if k not in ctx["PL"]: continue
            r = _row(g, i)
            if r is None: continue
            a = A.setdefault(k, {"n": 0, "w": 0, "g15": [], "c15": [], "cs": 0, "mn": 0.0, "gpm": [], "k": 0, "d": 0, "a": 0, "kp": []})
            a["n"] += 1; a["w"] += r["W"] or 0; a["k"] += r["k"] or 0; a["d"] += r["d"] or 0; a["a"] += r["a"] or 0
            if r["gd15"] is not None: a["g15"].append(r["gd15"])
            if r["csd15"] is not None: a["c15"].append(r["csd15"])
            if r["min"] and r["cs"] is not None and r["gold"] is not None: a["cs"] += r["cs"]; a["mn"] += r["min"]; a["gpm"].append(r["gold"] / r["min"])
            if r["tk"]: a["kp"].append(((r["k"] or 0) + (r["a"] or 0)) / r["tk"])
    mean = lambda v: sum(v) / len(v) if v else None
    out = {}
    for k, a in A.items():
        out[k] = [a["n"], a["w"], mean(a["g15"]), mean(a["c15"]), a["cs"] / a["mn"] if a["mn"] else None, mean(a["gpm"]),
                  (a["k"] + a["a"]) / max(1, a["d"]), 100 * mean(a["kp"]) if a["kp"] else None]
    return out


def _rank_of(vals, k, hi=True):
    """Rang de k (1 = meilleur) parmi vals {clé: valeur} (valeurs absentes ignorées), et effectif."""
    v = {x: y for x, y in vals.items() if y is not None}
    if k not in v: return None, len(v)
    return 1 + sum(1 for y in v.values() if (y > v[k] if hi else y < v[k])), len(v)


def _ranks(ctx):
    R, m, PL = ctx["R"], ctx["m"], ctx["PL"]
    dec, ys_of = _decomp(R); ctx["ys_of"] = ys_of
    SS = _season(ctx)
    P = R["players"]; mp = (m or {}).get("p", {})
    out, chk = {}, {"n": 0, "skip": 0, "cov": [], "adj": [0, 0]}
    for role in ROLES:
        ks = sorted([k for k in P if P[k]["role"] == role and P[k]["j"] in dec], key=lambda k: -P[k]["note"])
        if not ks: continue
        C = {k: dict(dec[P[k]["j"]], note=P[k]["note"]) for k in ks}
        for k in ks: C[k]["rest"] = C[k]["note"] - C[k]["perf"] - C[k]["adv"]
        mean = {a: sum(C[k][a] for k in ks) / len(ks) for a in AXN + ("note",)}
        gap = {k: [C[k][a] - mean[a] for a in AXN] for k in ks}
        # stats de saison et rangs au poste (parmi les titulaires classés, MIN_G parties minimum)
        el = [k for k in ks if k in SS and SS[k][0] >= MIN_G]
        col = lambda i: {k: SS[k][i] for k in el}
        rk = {}
        for k in ks:
            r_ = [_rank_of(col(i), k)[0] for i in (2, 3, 4, 5, 6, 7)]       # or@15, CS@15, CS/min, or/min, KDA, participation
            r_.append(_rank_of({x: C[x]["adv"] for x in ks}, k)[0])          # niveau des adversaires
            rk[k] = r_
        rows = []
        half = len(el) // 2   # raison : moitié haute stricte du poste (9 sur 19) ; faiblesse : moitié basse stricte
        for k in ks:
            g = gap[k]; show = dict(SHOW, farm=3 if role == "SUP" else 2)
            ok = lambda a, strong: a == "adv" or (rk[k][show[a]] is not None and (rk[k][show[a]] <= half if strong else rk[k][show[a]] > len(el) - half))
            fs, wk = [], -1
            for i in sorted(range(5), key=lambda i: -g[i]):
                if g[i] < GAP or len(fs) == 2: break
                if ok(AXN[i], True): fs.append(i)
                else: chk["skip"] += 1
            for i in sorted(range(5), key=lambda i: g[i]):
                if g[i] > -GAP: break
                if ok(AXN[i], False): wk = i; break
                chk["skip"] += 1
            # part de l'écart à la moyenne du poste couverte par les raisons (joueurs au-dessus de la moyenne)
            tot = C[k]["note"] - mean["note"]
            if tot > 0.05 and fs: chk["cov"].append(sum(g[i] for i in fs) / tot)
            chk["n"] += 1
            x = mp.get(k) or []
            s = SS.get(k) or [0, 0, None, None, None, None, None, None]
            rows.append([k, round(C[k]["note"], 3), x[4] if len(x) > 5 else None, x[5] if len(x) > 5 else None,
                         [round(v, 3) for v in g], [s[0], s[1], _r(s[2], 0), _r(s[3], 1), _r(s[4], 2), _r(s[5], 0), _r(s[6], 2), _r(s[7], 1)],
                         rk[k], fs, wk])
        # contrôle : l'écart entre deux voisins du classement vient-il d'une raison du premier ou d'une faiblesse du second ?
        for a, b in zip(rows, rows[1:]):
            d = [x - y for x, y in zip(a[4][:5], b[4][:5])]
            i = max(range(5), key=lambda i: d[i])
            chk["adj"][1] += 1; chk["adj"][0] += (i in a[7]) or (i == b[8])
        out[role] = {"m": round(mean["note"], 3), "r": rows}
    cov = sorted(chk["cov"])
    return {"P": out, "pc": {"n": chk["n"], "skip": chk["skip"], "cov": round(cov[len(cov) // 2], 2) if cov else None,
                             "adj": chk["adj"], "ax": list(AXN)}}


def _r(v, n):
    if v is None: return None
    return int(round(v)) if n == 0 else round(v, n)


# ---------------------------------------------------------------- 2. « Spécial Worlds »
def _intl(ctx):
    """Chaque partie internationale est comparée à la note de chacun AVANT le tournoi (modèle E réajusté sur les seules
    parties antérieures) : perf attendue = note - moyenne des 5 adversaires, victoire attendue = sigmoïde du modèle.
    Résidu de perf centré par tournoi et par poste (le méta d'un tournoi ne compte pas)."""
    R = ctx["R"]; eng, F = R["_eng"], R["_F"]; P = R["params"]; a0, al = R["logit"]
    ys_of = ctx.get("ys_of") or _decomp(R)[1]
    ev = {}
    for g in eng.games:
        if g["lg"] in INTL and g["P"]: k = g["lg"] + " " + g["day"][:4]; ev[k] = min(ev.get(k, 1e18), g["t"])
    fits = {k: eng.fit(T - 1e-6, P["H"], P["lam"], P["lamL"], x0=F["x"]) for k, T in ev.items()}
    rows = []
    for g in eng.games:
        if g["lg"] not in INTL or not g["P"]: continue
        e = g["lg"] + " " + g["day"][:4]; r = fits[e]["r"]
        pids = [pp[0] for pp in g["P"]]
        rs = [r[eng.pid[p]] if eng.pid.get(p) is not None else None for p in pids]
        for s in (0, 5):   # joueur jamais vu avant le tournoi : moyenne des notes connues de son équipe
            kn = [v for v in rs[s:s + 5] if v is not None]; fill = sum(kn) / len(kn) if kn else 0.0
            for q in range(s, s + 5):
                if rs[q] is None: rs[q] = fill
        pb = 1 / (1 + math.exp(-(a0 + al * (sum(rs[:5]) - sum(rs[5:])))))
        ys = ys_of.get(g["gid"]); M0, M1 = sum(rs[:5]) / 5, sum(rs[5:]) / 5
        for q in range(10):
            b = q < 5
            res = None if ys is None else ys[q] - (rs[q] - (M1 if b else M0))
            rows.append([e, g["mid"], g["gid"], pids[q], g["b"] if b else g["r"], q // 5, res, pb if b else 1 - pb,
                         g["y"] if b else 1 - g["y"], g["P"][q][1]])
    cen = collections.defaultdict(list)
    for x in rows:
        if x[6] is not None: cen[(x[0], x[9])].append(x[6])
    cen = {k: sum(v) / len(v) for k, v in cen.items()}
    for x in rows:
        if x[6] is not None: x[6] -= cen[(x[0], x[9])]
    per = lambda e: "a" if e.endswith("2024") else "b"
    wor = lambda e: e.startswith("worlds")

    def pagg(sel):
        """Par joueur (identifiant) : n, somme des résidus, sommes par série (erreur type par grappes), victoires."""
        A = {}
        for x in rows:
            if not sel(x): continue
            a = A.setdefault(x[3], [0, 0.0, collections.defaultdict(float), 0, 0, 0.0])
            if x[6] is not None: a[0] += 1; a[1] += x[6]; a[2][x[1]] += x[6]
            a[3] += 1; a[4] += x[8]; a[5] += x[7]
        return A
    mse = lambda a: (a[1] / a[0], math.sqrt(sum(v * v for v in a[2].values())) / a[0]) if a[0] else (None, None)

    A, Aa, Ab, Aw = pagg(lambda x: True), pagg(lambda x: per(x[0]) == "a"), pagg(lambda x: per(x[0]) == "b"), pagg(lambda x: wor(x[0]))
    I = {}
    for pid, key in ctx["pid_key"].items():
        a = A.get(pid)
        if not a or not a[3]: continue
        mu, se = mse(a)
        pa, pb_ = Aa.get(pid), Ab.get(pid)
        ma = mse(pa)[0] if pa and pa[0] >= NET_P else None
        mb = mse(pb_)[0] if pb_ and pb_[0] >= NET_P else None
        net = 0
        if mu is not None and a[0] >= NET_N and se and abs(mu / se) >= NET_Z and ma is not None and mb is not None and ma * mu > 0 and mb * mu > 0:
            net = 1 if mu > 0 else -1
        w = Aw.get(pid) or [0, 0.0, {}, 0, 0, 0.0]
        mw, sw = mse(w)
        I[key] = [a[3], a[4], round(a[5], 1), _r(mu, 3), _r(se, 3), _r(ma, 3), _r(mb, 3), w[3], w[4], round(w[5], 1), _r(mw, 3), _r(sw, 3), net]

    # équipes : une ligne par côté et par partie
    TT, seen = {}, set()
    for x in rows:
        if (x[2], x[5]) in seen: continue
        seen.add((x[2], x[5]))
        t = ctx["tid_team"].get(x[4])
        if not t: continue
        a = TT.setdefault(t, {"all": [0, 0, 0.0, collections.defaultdict(float)]})
        for k in ("all", x[0], "w" if wor(x[0]) else None, per(x[0])):
            if k is None: continue
            z = a.setdefault(k, [0, 0, 0.0, collections.defaultdict(float)]); z[0] += 1; z[1] += x[8]; z[2] += x[7]; z[3][x[1]] += x[8] - x[7]
    dom = _domestic(ctx)
    T = {}
    for t, a in TT.items():
        z = a["all"]; se = math.sqrt(sum(v * v for v in z[3].values()))
        zz = (z[1] - z[2]) / se if se else 0.0
        pa, pb_ = a.get("a"), a.get("b")
        net = 0
        if z[0] >= NET_N and abs(zz) >= NET_Z and pa and pb_ and pa[0] >= NET_P and pb_[0] >= NET_P \
                and (pa[1] - pa[2]) * (z[1] - z[2]) > 0 and (pb_[1] - pb_[2]) * (z[1] - z[2]) > 0:
            net = 1 if zz > 0 else -1
        w = a.get("w") or [0, 0, 0.0]
        evs = sorted((k for k in a if " " in k), key=lambda k: (k[-4:], ev.get(k, 0)))
        T[t] = [z[0], z[1], round(z[2], 1), round(zz, 2), w[0], w[1], round(w[2], 1), net, dom.get(t, [0, 0]),
                [[k, a[k][0], a[k][1], round(a[k][2], 1)] for k in evs]]

    # tests de stabilité de l'effet « grand tournoi »
    it = {"ev": sorted(ev, key=ev.get)}
    rr = lambda xs, ys: _corr(xs, ys)
    ks = [p for p in Aa if p in Ab and Aa[p][0] >= NET_P and Ab[p][0] >= NET_P]
    it["pab"] = [len(ks), _r(rr([mse(Aa[p])[0] for p in ks], [mse(Ab[p])[0] for p in ks]), 2)]
    ks = [p for p in Aa if p in Ab and Aa[p][3] >= NET_P and Ab[p][3] >= NET_P]
    it["wab"] = [len(ks), _r(rr([(Aa[p][4] - Aa[p][5]) / Aa[p][3] for p in ks], [(Ab[p][4] - Ab[p][5]) / Ab[p][3] for p in ks]), 2)]
    tk = [t for t in TT if TT[t].get("a") and TT[t].get("b") and TT[t]["a"][0] >= NET_P and TT[t]["b"][0] >= NET_P]
    it["tab"] = [len(tk), _r(rr([(TT[t]["a"][1] - TT[t]["a"][2]) / TT[t]["a"][0] for t in tk], [(TT[t]["b"][1] - TT[t]["b"][2]) / TT[t]["b"][0] for t in tk]), 2)]
    series = sorted({x[1] for x in rows}); rnd = random.Random(2026); sp, sw_ = [], []
    for _ in range(SPLITS):
        h = {s: rnd.random() < 0.5 for s in series}
        B1, B2 = pagg(lambda x: h[x[1]]), pagg(lambda x: not h[x[1]])
        ks = [p for p in B1 if p in B2 and B1[p][0] >= 10 and B2[p][0] >= 10]
        if len(ks) > 5: sp.append(rr([B1[p][1] / B1[p][0] for p in ks], [B2[p][1] / B2[p][0] for p in ks]))
        ks = [p for p in B1 if p in B2 and B1[p][3] >= 10 and B2[p][3] >= 10]
        if len(ks) > 5: sw_.append(rr([(B1[p][4] - B1[p][5]) / B1[p][3] for p in ks], [(B2[p][4] - B2[p][5]) / B2[p][3] for p in ks]))
    q = lambda v, p: sorted(v)[int(p * (len(v) - 1))] if v else None
    it["psh"] = [_r(q(sp, .5), 2), _r(q(sp, .05), 2), _r(q(sp, .95), 2)]
    it["wsh"] = [_r(q(sw_, .5), 2), _r(q(sw_, .05), 2), _r(q(sw_, .95), 2)]
    # nombre d'effets nets attendus par hasard (|z| >= NET_Z) parmi les joueurs et les équipes testés
    nt = sum(1 for p in A if A[p][0] >= NET_N); ntt = sum(1 for t in TT if TT[t]["all"][0] >= NET_N)
    it["n"] = [nt, ntt, round(nt * 2 * (1 - _phi(NET_Z)), 1), round(ntt * 2 * (1 - _phi(NET_Z)), 1)]
    it["sd"] = round(math.sqrt(sum(x[6] ** 2 for x in rows if x[6] is not None) / max(1, sum(1 for x in rows if x[6] is not None))), 3)
    return {"I": I, "T": T, "it": it}


def _domestic(ctx):
    """Bilan 2026 en ligue (parties) de chaque équipe : [parties, victoires]."""
    out = {}
    for g in ctx["G"]:
        if g["t"][:4] != ctx["Y"] or g["l"] in INTL or g["l"] in ("kespa_cup", "americas_cup", "lta_cross"): continue
        for tid in (g["b"], g["r"]):
            t = ctx["tid_team"].get(tid)
            if t: a = out.setdefault(t, [0, 0]); a[0] += 1; a[1] += g["w"] == tid
    return out


def _corr(xs, ys):
    n = len(xs)
    if n < 3: return None
    mx, my = sum(xs) / n, sum(ys) / n
    sx = math.sqrt(sum((x - mx) ** 2 for x in xs)); sy = math.sqrt(sum((y - my) ** 2 for y in ys))
    return sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / (sx * sy) if sx and sy else None


def _phi(x): return 0.5 * (1 + math.erf(x / math.sqrt(2)))


# ---------------------------------------------------------------- 3. qui va gagner ces Worlds
def _who(ctx, sim):
    if not sim or not sim.get("eq"): return {"W": None}
    eq, S = sim["eq"], sim.get("S") or {}
    mp = (ctx["m"] or {}).get("p", {})
    lg = {t["id"]: t["league"] for t in ctx["teams"]}
    alive = [t for t in eq if eq[t][10] > 0 or eq[t][7] > 0]
    order = sorted(alive, key=lambda t: (-eq[t][10], -eq[t][7]))
    if not order: return {"W": None}
    sorder = sorted(S, key=lambda t: -S[t])
    # rang de force dans sa ligue (parmi ses équipes des Worlds) contre rang de qualification
    srank = {t: 1 + sum(1 for u in S if lg.get(u) == lg.get(t) and S[u] > S[t]) for t in S}
    wor = collections.defaultdict(lambda: [0, 0, 0])   # victoires, défaites, dont parties de Play-In
    for g in ctx["G"]:
        if g["l"] != "worlds" or g["t"][:4] != ctx["Y"]: continue
        for tid in (g["b"], g["r"]):
            t = ctx["tid_team"].get(tid)
            if t: wor[t][0] += g["w"] == tid; wor[t][1] += g["w"] != tid; wor[t][2] += "play" in (g.get("bn") or "").lower()
    def card(t):
        e = eq[t]
        pos = sorted([[x[2], ROLES.index(ctx["PL"][k]["role"]), k] for k, x in mp.items() if k in ctx["PL"] and ctx["PL"][k]["team"] == t and x[2] <= 3])
        nx = sorted((sim.get("nx") or {}).get(t) or [], key=lambda z: -z[1])
        return {"t": t, "p": [e[10], e[9], e[8], e[7]], "bil": e[0], "S": S.get(t), "sr": sorder.index(t) + 1 if t in sorder else None,
                "pos": [[ROLES[r], rk, k] for rk, r, k in pos], "nx": nx[0] if nx else None, "wf": wor.get(t, [0, 0, 0]),
                "seed": [lg.get(t), SEED.get(t), srank.get(t)]}
    fav = order[0]
    ch = [t for t in order[1:4] if eq[t][10] >= 0.05]
    taken = {fav, *ch}
    under = [t for t in order if t not in taken and SEED.get(t) and srank.get(t) and SEED[t] > srank[t]]
    # écart de force entre le favori et la meilleure des autres équipes encore en lice (positif : le favori est le plus fort)
    other = max((u for u in alive if u != fav and u in S), key=lambda u: S[u], default=None)
    out = {"fav": card(fav), "ch": [card(t) for t in ch], "out": card(under[0]) if under else None,
           "gap": [other, round(S[fav] - S[other], 3)] if fav in S and other else None, "maj": sim.get("maj"), "n": sim.get("n")}
    return {"W": out}


# ---------------------------------------------------------------- 4. qui domine qui au même poste
def _elo(G):
    """Probabilité Elo du côté bleu avant chaque partie (G triées par heure) ; même calcul que fiche_block.elo."""
    try:
        from fiche_block import elo as fe
        return [p for p, _, _ in fe(G)[0]]
    except Exception:
        pass
    R, home, yr, out = {}, {}, None, []
    for g in G:
        y = g["t"][:4]
        if yr and y != yr:
            for t in R:
                b = ELO0.get(home.get(t), 1450); R[t] = b + SHRINK * (R[t] - b)
        yr = y
        for t in (g["b"], g["r"]):
            if t not in R: R[t] = ELO0.get(g["l"], 1450)
            if g["l"] in ELO0 and g["l"] != "lta_cross": home[t] = g["l"]
        rb, rr = R[g["b"]], R[g["r"]]
        out.append(1 / (1 + 10 ** (-(SCALE * (rb - rr) + BLUE) / 400)))
        if g["l"] in NO_ELO: continue
        sb = 1 if g["w"] == g["b"] else 0
        e = 1 / (1 + 10 ** ((rr - rb) / 400)); k = K_INTL if g["l"] in ELO_INTL else K_REG
        R[g["b"]] += k * (sb - e); R[g["r"]] -= k * (sb - e)
    return out


def _duels(ctx):
    """Duels en lane entre deux de nos titulaires du même poste depuis 2024 : bilan, victoires attendues d'après la force
    des équipes (Elo avant la partie), écart d'or moyen à 15 min, bilan de l'année. Le test compare la dispersion des
    écarts (victoires - attendu) à celle du hasard."""
    G, PL, P = ctx["G"], ctx["PL"], ctx["R"]["players"]
    pe = _elo(G)
    D = {}
    for g, pb in zip(G, pe):
        ks = g.get("ks") or [None] * 10
        for i in range(5):
            a = ks[i]
            if a not in PL: continue
            ra = _row(g, i)
            if ra is None: continue
            j = next((j for j in range(5, 10) if (_row(g, j) or {}).get("role") == ra["role"]), None)
            if j is None or ks[j] not in PL or PL[ks[j]]["role"] != PL[a]["role"]: continue
            b = ks[j]
            fl = a > b   # paire rangée dans l'ordre alphabétique des clés, vue du premier
            x, y, p, wa = (b, a, 1 - pb, 1 - ra["W"]) if fl else (a, b, pb, ra["W"])
            gd = ra["gd15"]
            if gd is not None and fl: gd = -gd
            z = D.setdefault((x, y), [0, 0, 0.0, 0.0, 0, 0, 0, 0])
            z[0] += 1; z[1] += wa; z[2] += p; z[3] += p * (1 - p)
            if gd is not None: z[4] += gd; z[5] += 1
            if g["t"][:4] == ctx["Y"]: z[6] += 1; z[7] += wa
    out, zs, rem = {}, [], []
    for role in ROLES:
        o = sorted([k for k in P if P[k]["role"] == role], key=lambda k: -P[k]["note"]); ix = {k: i for i, k in enumerate(o)}
        rows = []
        for (a, b), z in sorted(D.items()):
            if a not in ix or b not in ix or z[0] < D_MIN: continue
            i, j = ix[a], ix[b]; w, e, n15, gd = z[1], z[2], z[5], (z[4] / z[5] if z[5] else None)
            if i > j: i, j, w, e, gd = j, i, z[0] - w, z[0] - e, (None if gd is None else -gd)   # vue du mieux noté
            zz = (w - e) / math.sqrt(z[3]) if z[3] > 0 else 0.0
            rows.append([i, j, z[0], w, round(e, 1), _r(gd, 0), n15, round(zz, 1), z[6], z[7] if ix[a] < ix[b] else z[6] - z[7]])
            if z[0] >= D_REM:
                zs.append(zz)
                if abs(w - e) >= D_NET and abs(zz) >= NET_Z: rem.append([role, i, j])
        out[role] = {"o": o, "r": rows}
    n = len(zs)
    dt = {"n": n, "z2": round(sum(1 for v in zs if abs(v) >= NET_Z) / n, 3) if n else None, "att": round(2 * (1 - _phi(NET_Z)), 3),
          "vz": round(sum(v * v for v in zs) / n, 2) if n else None, "rem": rem, "min": [D_MIN, D_REM, D_NET]}
    return {"D": out, "dt": dt}
