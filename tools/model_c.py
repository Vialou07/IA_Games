#!/usr/bin/env python3
"""Modèle C : force des équipes fondée sur la domination (part de l'or en fin de partie + écart d'or à 15 min),
corrigée de la force de l'adversaire et de la force de la ligue. Bibliothèque standard seulement.

Principe (une note par mesure, filtre de Kalman = moindres carrés récursifs pondérés dans le temps) :
    y = (L[ligue bleu] + u[bleu]) - (L[ligue rouge] + u[rouge]) + h + bruit N(0, 1)
  y = ln(or bleu / or rouge) / 0,19554 (part d'or finale), ou (or à 15 min bleu - rouge) / 2418,2 (écart à 15 min).
  u : niveau propre de l'équipe (moyenne, variance), L : niveau de sa ligue (région), h : avantage du côté bleu.
  La variance de chaque niveau grandit avec le temps (q par jour) et à chaque nouvelle année (v_y, avec retour
  vers la moyenne de la ligue rho_y) : les vieilles parties comptent de moins en moins.
  Après chaque partie : gain K = v / S, avec S = v_bleu + v_rouge (+ V des deux ligues si elles diffèrent) + 1.
Probabilité que le bleu gagne une partie : sigma(b0 + b15·D15 + bOr·DOr), D = écarts attendus (côté compris).
Série : p moyen des deux côtés, puis loi « premier à n victoires » ; logit de la série multiplié par GAMMA (Bo3/Bo5).

Entrées : run(C, winners) -> dict JSON (classement de nos équipes, ligues, matchs à venir) ;
          fit_state(C, winners) -> (raters, now, parties) puis predict(raters, idA, idB, bo, now) -> probabilité ;
          backtest(C, winners) -> mesures du test chronologique. C = cache du robot, winners = build_stats.winners.
Ligne de commande : python -X utf8 model_c.py [cache.json.gz] [build_stats.py]  (affiche classement, ligues, test)."""
import json, gzip, os, sys, math, bisect, datetime, heapq, importlib.util, collections

# ---------- constantes (toutes fixées sur 2024, sauf l'intersaison : janvier-février 2025) ----------
SD = {"gd15": 2418.171378835691, "lgold": 0.19554350601693976}          # écarts-types 2024
PARAMS = {   # réglés par tune.py (log loss 2024 ; ligues : internationaux 2024 ; intersaison : janv.-févr. 2025)
    "gd15": {"v0": 0.25, "q": 0.0002, "VL0": 0.7, "qL": 0.002, "rho_y": 0.9, "v_y": 0.1},
    "lgold": {"v0": 0.25, "q": 0.0002, "VL0": 0.4, "qL": 0.0, "rho_y": 0.8, "v_y": 0.1},
    "win": {"v0": 0.15, "q": 0.0002, "VL0": 0.2, "qL": 0.0, "rho_y": 0.8, "v_y": 0.05},   # référence : victoires seules
}
BETA = {"C": (0.007784027977158881, {"gd15": 0.05642915250740775, "lgold": 1.9982714176970164}),   # logistique 2024
        "W": (0.02188352084387187, {"win": 2.293559914360107})}
GAMMA = 0.93          # séries Bo3/Bo5 (2024) : logit(p_série) x 0,93
ETA = 0.002           # vitesse d'apprentissage de l'avantage du côté bleu
REGION = {"lck": "LCK", "lpl": "LPL", "lec": "LEC", "lcs": "NA", "lta_n": "NA", "cblol-brazil": "BR", "lta_s": "BR",
          "lcp": "LCP", "pcs": "LCP", "vcs": "VCS"}
INTL = {"worlds", "msi", "first_stand"}
NEWYEAR = [datetime.datetime(y, 1, 1, tzinfo=datetime.timezone.utc).timestamp() / 86400 for y in range(2020, 2041)]


def sig(z):
    if z >= 0: return 1 / (1 + math.exp(-z))
    e = math.exp(z); return e / (1 + e)


def logit(p):
    p = min(max(p, 1e-9), 1 - 1e-9); return math.log(p / (1 - p))


def series_p(p, bo):
    """Probabilité de gagner un Bo`bo` si chaque partie est gagnée avec la probabilité p."""
    n = bo // 2 + 1
    return sum(math.comb(n - 1 + k, k) * p ** n * (1 - p) ** k for k in range(n))


class Rater:
    """Une note (moyenne + variance) par équipe et par ligue, mise à jour partie par partie."""
    def __init__(self, v0, q, VL0, qL, rho_y, v_y):
        self.v0, self.q, self.VL0, self.qL, self.rho_y, self.v_y = v0, q, VL0, qL, rho_y, v_y
        self.mu, self.var, self.last, self.grp, self.n = {}, {}, {}, {}, {}
        self.M, self.V, self.lastL = {}, {}, {}
        self.h = 0.0

    def _lg(self, g, t):
        if g not in self.M: self.M[g], self.V[g], self.lastL[g] = 0.0, self.VL0, t
        elif t > self.lastL[g]: self.V[g] = min(self.VL0, self.V[g] + self.qL * (t - self.lastL[g])); self.lastL[g] = t

    def _team(self, tid, t, lg):
        if tid not in self.mu:
            self.mu[tid], self.var[tid], self.last[tid], self.n[tid] = 0.0, self.v0, t, 0
            self.grp[tid] = REGION.get(lg, "AUTRE")
        elif t > self.last[tid]:
            v = self.var[tid] + self.q * (t - self.last[tid])
            if bisect.bisect(NEWYEAR, t) != bisect.bisect(NEWYEAR, self.last[tid]):   # nouvelle saison
                v += self.v_y; self.mu[tid] *= self.rho_y
            self.var[tid] = min(self.v0, v); self.last[tid] = t
        if lg in REGION and self.grp[tid] != REGION[lg]:   # changement de ligue : la force totale ne saute pas
            old, new = self.grp[tid], REGION[lg]; self._lg(old, t); self._lg(new, t)
            self.mu[tid] += self.M[old] - self.M[new]; self.grp[tid] = new
        self._lg(self.grp[tid], t)
        return self.grp[tid]

    def predict(self, b, r, t, lg):
        gb, gr = self._team(b, t, lg), self._team(r, t, lg)
        d = self.M[gb] + self.mu[b] - self.M[gr] - self.mu[r] + self.h
        return d, self.var[b] + self.var[r] + ((self.V[gb] + self.V[gr]) if gb != gr else 0.0)

    def update(self, b, r, t, lg, y):
        gb, gr = self._team(b, t, lg), self._team(r, t, lg)
        e = y - (self.M[gb] + self.mu[b] - self.M[gr] - self.mu[r] + self.h)
        vb, vr = self.var[b], self.var[r]; cross = gb != gr
        S = vb + vr + 1.0 + ((self.V[gb] + self.V[gr]) if cross else 0.0)
        self.mu[b] += vb / S * e; self.mu[r] -= vr / S * e
        self.var[b] = vb - vb * vb / S; self.var[r] = vr - vr * vr / S
        if cross:
            Vb, Vr = self.V[gb], self.V[gr]
            self.M[gb] += Vb / S * e; self.M[gr] -= Vr / S * e
            self.V[gb] = Vb - Vb * Vb / S; self.V[gr] = Vr - Vr * Vr / S
        self.h += ETA * e; self.n[b] += 1; self.n[r] += 1

    def strength(self, tid):
        g = self.grp[tid]; return self.M[g] + self.mu[tid], self.var[tid] + self.V[g]


# ---------- données ----------
def _days(s):
    return datetime.datetime.fromisoformat(s.replace("Z", "")[:19]).replace(tzinfo=datetime.timezone.utc).timestamp() / 86400


def games(C, winners):
    """Parties terminées à vainqueur connu, triées par début. Marges du point de vue du bleu."""
    E, D, G = C["events"], C["details"], C["games"]; out = []
    for mid, d in D.items():
        e = E.get(mid)
        if not e or e["st"] != "completed" or len(d["tm"]) != 2: continue
        W = winners(C, mid)
        if not W: continue
        ids = {t[0] for t in d["tm"]}
        for g in sorted(d["g"], key=lambda g: g[1]):
            if g[0] not in W: continue
            s = G.get(g[0]) or {}
            blue, red = (s["b"][0], s["r"][0]) if "b" in s else (g[3], next((x for x in ids if x != g[3]), None))
            if not blue or not red or blue == red or {blue, red} != ids: continue
            t0 = _days(s["s"]) if s.get("s") else _days(e["t"]) + (g[1] - 1) * 50 / 1440
            r = {"gid": g[0], "mid": mid, "num": g[1], "lg": e["l"], "year": e["t"][:4], "t0": t0, "t1": t0 + (s.get("min") or 35.0) / 1440,
                 "blue": blue, "red": red, "y": 1 if W[g[0]] == blue else 0, "stats": "p" in s, "gd15": None, "lgold": None}
            if "p" in s:
                P = s["p"]
                if all(p[9] is not None for p in P): r["gd15"] = (sum(p[9] for p in P[:5]) - sum(p[9] for p in P[5:])) / SD["gd15"]
                if s.get("fin") and s["b"][2] > 0 and s["r"][2] > 0: r["lgold"] = math.log(s["b"][2] / s["r"][2]) / SD["lgold"]
            out.append(r)
    out.sort(key=lambda r: (r["t0"], r["mid"], r["num"]))
    return out


def _y(g, k): return (2.0 * g["y"] - 1.0) if k == "win" else g[k]


def walk(Gl, raters, record=True):
    """Parcours chronologique : chaque partie est prédite avec les seules parties finies avant son début."""
    feats, sfeats, pend, k = {}, {}, [], 0
    first = {}
    for g in Gl: first.setdefault(g["mid"], g)

    def flush(t):
        while pend and pend[0][0] <= t:
            t1, _, h = heapq.heappop(pend)
            for name, R in raters.items():
                y = _y(h, name)
                if y is not None: R.update(h["blue"], h["red"], t1, h["lg"], y)
    for g in Gl:
        flush(g["t0"])
        if record:
            if g["mid"] not in sfeats:
                a, b = first[g["mid"]]["blue"], first[g["mid"]]["red"]
                sfeats[g["mid"]] = (a, b, {n: (R.predict(a, b, g["t0"], g["lg"]), R.predict(b, a, g["t0"], g["lg"])) for n, R in raters.items()})
            feats[g["gid"]] = {n: R.predict(g["blue"], g["red"], g["t0"], g["lg"]) for n, R in raters.items()}
        heapq.heappush(pend, (g["t1"], k, g)); k += 1
    flush(float("inf"))
    return feats, sfeats


def p_game(model, f):
    """f : {note: (écart attendu bleu - rouge, variance)} -> probabilité que le bleu gagne."""
    b0, bs = BETA[model]
    return sig(b0 + sum(w * f[k][0] for k, w in bs.items()))


def p_series_from(model, fa, fb, bo):
    """fa : notes avec a au bleu, fb : avec b au bleu. Bo1 : a est au bleu."""
    pa, pb = p_game(model, fa), p_game(model, fb)
    if bo == 1: return pa
    return sig(GAMMA * logit(series_p((pa + 1 - pb) / 2, bo)))


def make_raters(): return {k: Rater(**v) for k, v in PARAMS.items()}


# ---------- état actuel ----------
def fit_state(C, winners, now=None):
    """Notes après toutes les parties connues. Renvoie (raters, now, parties) ; raters sert à predict()."""
    Gl = games(C, winners)
    R = make_raters(); walk(Gl, R, record=False)
    now = now or (Gl[-1]["t1"] if Gl else 0)
    for name, r in R.items():   # tout le monde vieillit jusqu'à maintenant (variance)
        for tid in list(r.mu): r._team(tid, now, "")
    return R, now, Gl


def run(C, winners, now=None):
    """Classement de nos équipes, force des ligues et prédictions des matchs à venir (dict sérialisable en JSON)."""
    R, now, Gl = fit_state(C, winners, now)
    ours = C["roster"]["teams"]
    b0, bs = BETA["C"]; w0, ws = BETA["W"]
    hC = sum(w * R[k].h for k, w in bs.items()); hW = ws["win"] * R["win"].h

    def power(tid):   # force en logit (une partie, terrain neutre), et son écart-type
        m = sum(w * R[k].strength(tid)[0] for k, w in bs.items())
        v = sum(w * w * R[k].strength(tid)[1] for k, w in bs.items())
        return m, math.sqrt(v)

    def p_neutral(dlogit, b0_, h_):   # moyenne des deux côtés
        return (sig(b0_ + dlogit + h_) + 1 - sig(b0_ - dlogit + h_)) / 2

    known = [t for t in ours if t in R["lgold"].mu]
    avgP = sum(power(t)[0] for t in known) / len(known)
    avgW = sum(ws["win"] * R["win"].strength(t)[0] for t in known) / len(known)
    avg15 = sum(R["gd15"].strength(t)[0] for t in known) / len(known)
    avgG = sum(R["lgold"].strength(t)[0] for t in known) / len(known)
    team_out = {}
    for tid in known:
        m, sd = power(tid); s15 = R["gd15"].strength(tid)[0]; sg = R["lgold"].strength(tid)[0]
        ratio = math.exp((sg - avgG) * SD["lgold"])
        team_out[ours[tid]] = {
            "ligue": R["lgold"].grp[tid], "force": round(m - avgP, 3), "ecart_type": round(sd, 3),
            "p_vs_moyenne": round(p_neutral(m - avgP, b0, hC), 3),
            "p_vs_moyenne_victoires_seules": round(p_neutral(ws["win"] * R["win"].strength(tid)[0] - avgW, w0, hW), 3),
            "or15_vs_moyenne": round((s15 - avg15) * SD["gd15"]), "part_or_vs_moyenne": round(ratio / (1 + ratio), 4),
            "parties": R["lgold"].n[tid]}
    for i, (k, v) in enumerate(sorted(team_out.items(), key=lambda kv: -kv[1]["force"])): v["rang"] = i + 1

    # ligues : moyenne des équipes ayant joué en domestique dans les 365 derniers jours
    act = collections.defaultdict(set)
    for g in Gl:
        if g["lg"] in REGION and g["t1"] >= now - 365: act[REGION[g["lg"]]].update((g["blue"], g["red"]))
    lg_out = {}
    for L, ts in act.items():
        m = sum(power(t)[0] for t in ts) / len(ts)
        s15 = sum(R["gd15"].strength(t)[0] for t in ts) / len(ts); sg = sum(R["lgold"].strength(t)[0] for t in ts) / len(ts)
        lg_out[L] = {"equipes": len(ts), "force": m, "or15": s15 * SD["gd15"], "lgold": sg * SD["lgold"],
                     "force_victoires_seules": sum(ws["win"] * R["win"].strength(t)[0] for t in ts) / len(ts)}
    ref = lg_out.get("LCK")
    for L, v in lg_out.items():
        v["p_partie_vs_LCK"] = round(p_neutral(v["force"] - ref["force"], b0, hC), 3) if ref else None
        v["p_bo5_vs_LCK"] = round(sig(GAMMA * logit(series_p(v["p_partie_vs_LCK"], 5))), 3) if ref else None
        v["or15_vs_LCK"] = round(v["or15"] - ref["or15"]) if ref else None
        r_ = math.exp(v["lgold"] - ref["lgold"]) if ref else 1
        v["part_or_vs_LCK"] = round(r_ / (1 + r_), 4)
        v["force"] = round(v["force"], 3); v["force_victoires_seules"] = round(v["force_victoires_seules"], 3)
        v["or15"] = round(v["or15"]); v["lgold"] = round(v["lgold"], 4)

    # matchs à venir (équipes connues)
    up = []
    for mid, e in C["events"].items():
        if e["st"] == "completed": continue
        d = C["details"].get(mid)
        ids = [t[0] for t in d["tm"]] if d and len(d["tm"]) == 2 else None
        if not ids:   # pas encore de détails : par le code d'équipe (nos équipes d'abord)
            byc = {v: k for k, v in ours.items()}
            for dd in sorted(C["details"].values(), key=lambda dd: dd["g"][0][0] if dd["g"] else "", reverse=True):
                for t in dd["tm"]: byc.setdefault(t[1], t[0])
            ids = [byc.get(t[0]) for t in e["tm"]] if len(e["tm"]) == 2 else [None, None]
        if None in ids or not all(i in R["lgold"].mu for i in ids): continue
        up.append({"match": mid, "date": e["t"], "a": ours.get(ids[0], ids[0]), "b": ours.get(ids[1], ids[1]), "bo": e["bo"],
                   "p_a": round(predict(R, ids[0], ids[1], e["bo"], now), 3)})
    up.sort(key=lambda x: x["date"])
    return {"modele": "C domination", "maj": datetime.datetime.fromtimestamp(now * 86400, datetime.timezone.utc).strftime("%Y-%m-%d %H:%M"),
            "equipes": team_out, "ligues": lg_out, "a_venir": up,
            "avantage_bleu_logit": round(b0 + hC, 3)}


def predict(R, a, b, bo, t, a_blue=None, model="C"):
    """Probabilité que a (id LoL Esports) gagne la série contre b. a_blue : côté de a connu (Bo1), sinon moyenne des côtés."""
    lg = "worlds"
    fa = {k: R[k].predict(a, b, t, lg) for k in R}; fb = {k: R[k].predict(b, a, t, lg) for k in R}
    if bo == 1 and a_blue is not None:
        return p_game(model, fa) if a_blue else 1 - p_game(model, fb)
    p = (p_game(model, fa) + 1 - p_game(model, fb)) / 2
    return p if bo == 1 else sig(GAMMA * logit(series_p(p, bo)))


# ---------- test chronologique (reproduit les chiffres du rapport) ----------
def _scores(P, Y):
    n = len(P); ll = lambda p, y: -math.log(min(max(p if y else 1 - p, 1e-6), 1))
    return {"n": n, "logloss": sum(ll(p, y) for p, y in zip(P, Y)) / n, "brier": sum((p - y) ** 2 for p, y in zip(P, Y)) / n,
            "fav": sum((1.0 if (p > 0.5) == (y == 1) else 0.0) if p != 0.5 else 0.5 for p, y in zip(P, Y)) / n}


def _calib(P, Y):
    b = [[0, 0.0, 0] for _ in range(10)]
    for p, y in zip(P, Y):
        i = min(9, int(p * 10)); b[i][0] += 1; b[i][1] += p; b[i][2] += y
    return [(i / 10, n, s / n, o / n) for i, (n, s, o) in enumerate(b) if n]


def backtest(C, winners):
    Gl = games(C, winners); R = make_raters(); feats, sfeats = walk(Gl, R)
    S = {}
    for mid, d in C["details"].items():
        e = C["events"].get(mid)
        if not e or e["st"] != "completed" or len(d["tm"]) != 2 or mid not in sfeats: continue
        (ia, _, _, wa), (ib, _, _, wb) = d["tm"]
        if wa is None or wb is None or wa == wb: continue
        a, b, f = sfeats[mid]
        if {a, b} != {ia, ib}: continue
        S[mid] = (e, (1 if wa > wb else 0) if a == ia else (1 if wb > wa else 0), f)
    cal_from = datetime.datetime(2024, 3, 1, tzinfo=datetime.timezone.utc).timestamp() / 86400
    sets = {"cal 2024 (mars-déc.)": (lambda g: g["year"] == "2024" and g["t0"] >= cal_from, lambda e: e["t"][:4] == "2024" and _days(e["t"]) >= cal_from),
            "PRINCIPAL internationaux 2025-26": (lambda g: g["lg"] in INTL and g["year"] in ("2025", "2026"), lambda e: e["l"] in INTL and e["t"][:4] in ("2025", "2026")),
            "SECONDAIRE toutes parties 2026": (lambda g: g["year"] == "2026", lambda e: e["t"][:4] == "2026")}
    out = {}
    for sname, (cg, cs) in sets.items():
        gs = [g for g in Gl if g["stats"] and cg(g)]; Y = [g["y"] for g in gs]
        ss = [(e, ya, f) for e, ya, f in S.values() if cs(e)]; YS = [ya for e, ya, f in ss]
        o = {}
        for model in ("C", "W"):
            P = [p_game(model, feats[g["gid"]]) for g in gs]
            PS = [p_series_from(model, {k: v[0] for k, v in f.items()}, {k: v[1] for k, v in f.items()}, e["bo"]) for e, ya, f in ss]
            o[model] = {"partie": _scores(P, Y), "serie": _scores(PS, YS), "calib_partie": _calib(P, Y), "calib_serie": _calib(PS, YS)}
        o["pile ou face"] = {"partie": _scores([0.5] * len(Y), Y), "serie": _scores([0.5] * len(YS), YS)}
        out[sname] = o
    return out


if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    cpath = args[0] if len(args) > 0 else os.path.join(os.path.dirname(here), "cache.json.gz")
    bpath = args[1] if len(args) > 1 else os.path.join(os.path.dirname(here), "build_stats.py")
    spec = importlib.util.spec_from_file_location("bs", bpath); bs = importlib.util.module_from_spec(spec); spec.loader.exec_module(bs)
    C = json.load(gzip.open(cpath, "rt", encoding="utf-8"))
    res = run(C, bs.winners)
    print("Modèle C, état au", res["maj"], "| avantage du côté bleu (logit) %+.3f" % res["avantage_bleu_logit"])
    print("%-5s %-5s %4s %7s %6s %9s %10s %8s %9s %5s" % ("rang", "équipe", "lig", "force", "±", "p_vs_moy", "p_vict_seul", "or15", "part_or", "n"))
    for k, v in sorted(res["equipes"].items(), key=lambda kv: kv[1]["rang"]):
        print("%-5d %-5s %4s %+7.3f %6.3f %9.3f %10.3f %+8d %9.4f %5d" % (v["rang"], k, v["ligue"], v["force"], v["ecart_type"], v["p_vs_moyenne"],
              v["p_vs_moyenne_victoires_seules"], v["or15_vs_moyenne"], v["part_or_vs_moyenne"], v["parties"]))
    print("\nLigues (équipes actives sur 365 jours) :")
    for L, v in sorted(res["ligues"].items(), key=lambda kv: -kv[1]["force"]):
        print("  %-4s n=%3d force %+.3f (victoires seules %+.3f)  p(partie) vs LCK %.3f  p(Bo5) vs LCK %.3f  or15 vs LCK %+5d  part d'or vs LCK %.4f" % (
            L, v["equipes"], v["force"], v["force_victoires_seules"], v["p_partie_vs_LCK"], v["p_bo5_vs_LCK"], v["or15_vs_LCK"], v["part_or_vs_LCK"]))
    print("\nÀ venir :")
    for u in res["a_venir"]: print("  %s %s vs %s (Bo%d) : p(%s) = %.3f" % (u["date"], u["a"], u["b"], u["bo"], u["a"], u["p_a"]))
    if "--test" in sys.argv:
        bt = backtest(C, bs.winners)
        for sname, o in bt.items():
            print("\n%s" % sname)
            for m, r in o.items():
                print("  %-12s parties n=%4d logloss %.4f brier %.4f favoris %.3f | séries n=%4d logloss %.4f brier %.4f favoris %.3f" % (
                    m, r["partie"]["n"], r["partie"]["logloss"], r["partie"]["brier"], r["partie"]["fav"], r["serie"]["n"], r["serie"]["logloss"], r["serie"]["brier"], r["serie"]["fav"]))
            for m in ("C",):
                print("  calibration parties (C) : " + "  ".join("%.1f:%d %.2f/%.2f" % (lo, n, p, o_) for lo, n, p, o_ in o[m]["calib_partie"]))
                print("  calibration séries  (C) : " + "  ".join("%.1f:%d %.2f/%.2f" % (lo, n, p, o_) for lo, n, p, o_ in o[m]["calib_serie"]))
