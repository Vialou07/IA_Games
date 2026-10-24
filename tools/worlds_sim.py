#!/usr/bin/env python3
"""Worlds 2026 : simulation Monte-Carlo de la suite du tournoi (phase suisse puis quarts, demies, finale).
Bibliothèque standard uniquement. Modèle de match : E (joueurs-impact, model_e.py) ; secours : C (model_c.py).

FORMAT (reconstitué depuis C["events"], ligue « worlds », et vérifié sur les Worlds 2024 et 2025 du cache)
  Phase suisse, 16 équipes, 5 rondes : qualifié à 3 victoires, éliminé à 3 défaites
  (toujours 2 qualifiés à 3-0, 3 à 3-1, 3 à 3-2). Créneaux : 8, 8, 8, 6 et 3 matchs par ronde.
  Bo1, sauf les matchs qui qualifient ou éliminent (bilan 2-x ou x-2) en Bo3 : rondes 1 et 2 en Bo1, ronde 3 :
  1-1 en Bo1, 2-0 et 0-2 en Bo3, rondes 4 et 5 en Bo3.
  Rondes 2 à 5 : tirage au sort entre équipes de même bilan, sans revanche si c'est possible (aucune revanche en 2024
  et 2025) ; pas de protection régionale après la ronde 1 (LNG-BLG en 2024, G2-MKOI en 2025).
  Quarts (Bo5) : les deux 3-0 contre deux des trois 3-2, dans des moitiés opposées ; les quatre autres (trois 3-1, un 3-2)
  tirés au hasard. Ni protection régionale ni interdiction de revanche (LNG-WBG 2024, HLE-GEN 2025 ; T1-TES 2024 et
  G2-TES 2025 déjà joués en suisse). Demi 1 = vainqueurs des quarts 1 et 2 (ordre chronologique), demi 2 = quarts 3 et 4.
  Demies et finale en Bo5.

MODÈLE
  z = a0 * côté + alpha * (somme des notes des 5 joueurs de A - somme pour B) : probabilité marginale d'une partie du
  modèle E (a0 = 0 dans les Bo3/Bo5 : côté neutre, comme dans le test du juge).
  Deux effets aléatoires mesurés et testés chronologiquement (fit_series.py, derive.py) :
    s ~ N(0, VAR["serie"]) commun aux parties d'une même série (un Bo5 se joue sur une forme du jour) ;
    D_équipe(h) : dérive de la force réelle depuis aujourd'hui, marche aléatoire de variance VAR["derive"] par jour
      (une note gelée aujourd'hui prédit moins bien un match dans 3 semaines que demain).
  Logit conditionnel d'une partie jouée dans h jours : kappa * z + s + D_A(h) - D_B(h), kappa = sqrt(1 + pi VAR["serie"] / 8)
  (la probabilité marginale d'une partie de demain reste celle du modèle E ; plus loin, elle se rapproche de 50 %).
  Séries : P(Bo3) = p^2 (3 - 2p), P(Bo5) = p^3 (10 - 15p + 6p^2) au logit conditionnel ; série en cours : l'effet de
  série est tiré a posteriori sachant les parties déjà jouées.
  Côté bleu d'un Bo1 programmé : celui du flux s'il existe, sinon la 1re équipe listée (2026 : 45 parties 1
  internationales sur 45) ; Bo1 tiré au sort dans la simulation : côté au hasard.
  Composition : la dernière alignée par chaque équipe (remplaçant compris).

ENTRÉE PRINCIPALE (robot)
  run(C, teams, n=20000, seed=SEED, bs=build_stats) -> dict sérialisable en JSON (~32 Ko) ; 4 à 5 s sur ce PC
  (notes ~1,2 s, simulation ~3 s). C : cache du robot (dict) ; teams : contenu de teams.json (liste) ;
  bs : le module build_stats (pour build_stats.winners) ; model="C" force le secours. Si le modèle E échoue,
  le secours C est pris automatiquement (statut « secours C (...) »). Fichiers à placer à côté : model_e.py
  (et model_c.py pour le secours).
SORTIE
  statut ("ok", "secours C (...)" ou "format incomplet ..."), modele, maj, tirages, graine, erreur_mc_max, duree_s,
  variances, horizons_jours, matchs_suisses_joues, prochaine_ronde_tiree, revanches_tirees,
  equipes[équipe] = {ligue, force, composition, bilan, p_3_0, p_3_1, p_3_2, p_2_3, p_1_3, p_0_3, p_qualif, p_demie,
                     p_finale, p_titre},
  matchs = [{match, date, phase, ronde, bo, a, b, score, vainqueur, p_a (analytique), p_a_simulation, bleu}] (a/b None si TBD),
  prochaine_ronde[équipe] = [{adversaire, p_tirage, p_victoire, bo}], duels = {bo1, bo3, bo5: {A: {B: P(A bat B)}}}."""
import math, random, time, os, sys, json, datetime, importlib.util

HERE = os.path.dirname(os.path.abspath(__file__))
# Variances (échelle logit). Réestimer de temps en temps avec fit_series.py et derive.py.
VAR = {
    "serie": 0.40,     # effet commun aux parties d'une série ; max. de vraisemblance sur 2 440 séries Bo3/Bo5, IC95 [0,05 ; 1,00]
    "derive": 0.0093,  # dérive d'une équipe, par jour ; covariance des résidus gelés (7 217 parties), ± 0,0045
    "equipe": 0.0,     # effet d'équipe constant : 0,023 ± 0,025 avec des notes à jour (non significatif), laissé à 0
    "ligue": 0.0,      # effet de ligue constant : 0,026 ± 0,040 (non significatif), laissé à 0
}
N_SIMS = 20000
SEED = 20261024
ROUND_SIZES = (8, 8, 8, 6, 3)
SIDE_TM0_BLUE = True
HOME = {"lck": "LCK", "lpl": "LPL", "lec": "LEC", "lcs": "LCS", "lta_n": "LCS", "cblol-brazil": "CBLOL", "lta_s": "CBLOL",
        "lcp": "LCP", "pcs": "PCS", "vcs": "VCS"}
STAGES = ("R1", "R2", "R3", "R4", "R5", "QF", "SF", "F")


def _load(name, candidates):
    if name in sys.modules: return sys.modules[name]
    for p in candidates:
        if p and os.path.exists(p):
            spec = importlib.util.spec_from_file_location(name, p)
            mod = importlib.util.module_from_spec(spec); sys.modules[name] = mod; spec.loader.exec_module(mod); return mod
    raise ImportError("%s introuvable (%s)" % (name, ", ".join(c for c in candidates if c)))


def build_stats_module(bs=None):
    """Le robot (build_stats) : celui passé en argument, sinon le module déjà chargé, sinon le fichier voisin."""
    if bs is not None: return bs
    for name in ("build_stats", "bs", "__main__"):
        m = sys.modules.get(name)
        if m is not None and hasattr(m, "winners") and hasattr(m, "lean"): return m
    return _load("build_stats", [os.path.join(HERE, "build_stats.py"), os.path.join(HERE, "..", "build_stats.py")])


def model_e_module(path=None):
    return _load("model_e", [path, os.path.join(HERE, "model_e.py"), os.path.join(HERE, "..", "work_E", "model_e.py")])


def norm(s): return "".join(ch for ch in str(s).lower() if ch.isalnum())


def tday(s):
    """'2026-10-23T17:00:00Z' -> jours depuis le 2024-01-01 UTC."""
    s = str(s)
    dt = datetime.datetime(int(s[0:4]), int(s[5:7]), int(s[8:10]), int(s[11:13] or 0), int(s[14:16] or 0), int(s[17:19] or 0))
    return (dt - datetime.datetime(2024, 1, 1)).total_seconds() / 86400.0


def sig(x):
    if x >= 0: return 1.0 / (1.0 + math.exp(-x))
    e = math.exp(x); return e / (1.0 + e)


def p_first_to(p, a, b):
    """P(gagner a parties avant d'en perdre b), parties indépendantes de probabilité p."""
    q = 1.0 - p; s = 0.0; c = 1.0
    for k in range(b):
        if k: c = c * (a - 1 + k) / k
        s += c * q ** k
    return p ** a * s


def kappa(var, cross):
    return math.sqrt(1 + math.pi * (var["serie"] + 2 * var["equipe"] + (2 * var["ligue"] if cross else 0.0)) / 8)


# ---------------------------------------------------------------- 1. format et état du tournoi
def read_format(C, teams=None, league="worlds", year="2026", cutoff=None, keep=()):
    """Matchs suisses et phases finales dans l'ordre chronologique.
    Chaque match : {mid, t, bo, a, b (étiquettes ou None si TBD), wa, wb, st, win, blue, slot_round}.
    Renvoie aussi les dates moyennes des rondes et des phases (« t_stage », en jours) et l'id LoL Esports de chaque étiquette.
    cutoff (ISO) / keep : tests rétrospectifs ; efface les résultats à partir de cutoff, et les équipes sauf pour `keep`."""
    E, D = C["events"], C["details"]
    roster = C.get("roster", {}).get("teams", {})
    alias = {}
    for t in teams or []:
        alias[norm(t["id"])] = t["id"]
        for a in t.get("al", []): alias.setdefault(norm(a), t["id"])
    evs = sorted((e["t"], m, e) for m, e in E.items() if e.get("l") == league and str(e.get("t", ""))[:4] == year)
    code2tid = {}
    for _, m, e in evs:
        for x in (D.get(m) or {}).get("tm", []): code2tid.setdefault(x[1], x[0])
    tid_of = {}

    def label(code, tid=None):
        tid = tid or code2tid.get(code)
        if tid and tid in roster: lab = roster[tid]
        elif norm(code) in alias: lab = alias[norm(code)]
        else: lab = code
        if tid: tid_of.setdefault(lab, tid)
        elif lab not in tid_of:
            inv = [k for k, v in roster.items() if v == lab]
            if inv: tid_of[lab] = inv[0]
        return lab

    out = {"swiss": [], "QF": [], "SF": [], "F": [], "tid": tid_of}
    for t, m, e in evs:
        bn = (e.get("bn") or "").lower()
        stage = "swiss" if bn.startswith("swiss") else "QF" if bn.startswith("quarter") else "SF" if bn.startswith("semi") \
            else "F" if bn.startswith("final") else None
        if not stage: continue
        bo = int(e.get("bo") or 1); need = bo // 2 + 1
        d = D.get(m) or {}
        tm = e.get("tm") or []
        if len(tm) != 2 or any(x[0] in ("TBD", None, "") for x in tm):
            a = b = None; wa = wb = 0
        else:
            dt = {x[1]: x[0] for x in d.get("tm", [])}
            a, b = label(tm[0][0], dt.get(tm[0][0])), label(tm[1][0], dt.get(tm[1][0]))
            wa, wb = int(tm[0][2] or 0), int(tm[1][2] or 0)
        st = e.get("st")
        if cutoff and t >= cutoff:
            wa = wb = 0; st = "unstarted"
            if m not in keep: a = b = None
        win = None
        if a and b and (wa >= need or wb >= need or (st == "completed" and wa != wb)): win = a if wa > wb else b
        blue = None
        if a and b and not win and wa + wb == 0:
            g1 = [g for g in d.get("g", []) if g[1] == 1]
            if g1 and g1[0][3] and not (cutoff and t >= cutoff):
                bl = g1[0][3]; blue = a if code2tid.get(tm[0][0]) == bl else b if code2tid.get(tm[1][0]) == bl else None
            if blue is None and SIDE_TM0_BLUE and year >= "2026": blue = a
        out[stage].append({"mid": m, "t": t, "bo": bo, "a": a, "b": b, "wa": wa, "wb": wb, "st": st, "win": win, "blue": blue})
    # créneaux -> rondes (8, 8, 8, 6, 3) et dates moyennes des rondes / phases
    k = 0; ts = {}
    for r, size in enumerate(ROUND_SIZES):
        for x in out["swiss"][k:k + size]:
            x["slot_round"] = r + 1; ts.setdefault("R%d" % (r + 1), []).append(tday(x["t"]))
        k += size
    for st in ("QF", "SF", "F"):
        for x in out[st]: ts.setdefault(st, []).append(tday(x["t"]))
    out["t_stage"] = {s: sum(v) / len(v) for s, v in ts.items()}
    return out


def swiss_state(fmt):
    """Bilans, adversaires déjà rencontrés, matchs connus non terminés ; numéro de ronde de chaque match connu."""
    W, L, opp, played = {}, {}, {}, {}
    for x in fmt["swiss"]:
        for t in (x["a"], x["b"]):
            if t: W.setdefault(t, 0); L.setdefault(t, 0); opp.setdefault(t, set()); played.setdefault(t, 0)
    pend = []
    for x in fmt["swiss"]:
        a, b = x["a"], x["b"]
        if not a: continue
        x["round"] = max(played[a], played[b]) + 1
        played[a] += 1; played[b] += 1; opp[a].add(b); opp[b].add(a)
        if x["win"]:
            lo = b if x["win"] == a else a
            W[x["win"]] += 1; L[lo] += 1
        else:
            pend.append(x)
    return W, L, opp, played, pend


def horizons(fmt, now):
    """Jours entre maintenant et chaque phase (R1..R5, QF, SF, F), croissants, >= 0."""
    ts = fmt.get("t_stage", {}); out = []; last = 0.0
    for s in STAGES:
        h = max(0.0, ts[s] - now) if s in ts else last
        last = max(last, h); out.append(last)
    return out


# ---------------------------------------------------------------- 2. forces des équipes
def strengths_E(C, labels, tid_of, M, asof=None, bs=None):
    """Somme des notes des 5 joueurs de la dernière composition alignée par chaque équipe (avant asof).
    Renvoie (forces {étiquette: somme}, compositions {étiquette: [joueurs]}, ligue {étiquette: ligue}, (a0, alpha))."""
    G = M.prepare(C, build_stats_module(bs))
    Y = M.perf_index(G, M.PARAMS["variant"])
    eng = M.Engine(G, Y)
    T = M.tday(asof + "T00:00:00") if asof else G[-1]["t"] + 1e-6
    F = eng.fit(T, M.PARAMS["H"], M.PARAMS["lam"], M.PARAMS["lamL"])
    cnt, last = {}, {}
    for g in G:
        h = HOME.get(g["lg"])
        for t in (g["b"], g["r"]):
            if h: c = cnt.setdefault(t, {}); c[h] = c.get(h, 0) + 1
        if g["P"] and g["t"] < T:
            last[g["b"]] = [pp[0] for pp in g["P"][:5]]; last[g["r"]] = [pp[0] for pp in g["P"][5:]]
    home = {t: max(c, key=c.get) for t, c in cnt.items()}
    keyof = C.get("roster", {}).get("players", {})
    S, LU, LG = {}, {}, {}
    for lab in labels:
        tid = tid_of.get(lab)
        lu = last.get(tid)
        LG[lab] = home.get(tid, "?")
        if not lu: S[lab] = 5 * M.player_rating(F, eng, None, LG[lab]); LU[lab] = []; continue
        S[lab] = sum(M.player_rating(F, eng, p, LG[lab]) for p in lu)
        LU[lab] = [keyof.get(p, p) for p in lu]
    return S, LU, LG, tuple(M.LOGIT)


def matrices_E(labels, S, logit):
    a0, al = logit
    zb = [[a0 + al * (S[a] - S[b]) for b in labels] for a in labels]   # a au bleu, une partie
    zn = [[al * (S[a] - S[b]) for b in labels] for a in labels]        # côté neutre (parties de Bo3/Bo5)
    return zb, zn


def matrices_C(C, labels, tid_of, bs=None, mc=None):
    """Secours : modèle C (équipes seulement). Logits marginaux tirés de model_c.predict."""
    bs = build_stats_module(bs)
    mc = mc or _load("model_c", [os.path.join(HERE, "model_c.py"), os.path.join(HERE, "..", "work_domination", "model_c.py")])
    R, now, _ = mc.fit_state(C, bs.winners)
    lg = lambda p: math.log(max(1e-9, p) / max(1e-9, 1 - p))
    ids = [tid_of[l] for l in labels]
    zb = [[0.0 if a == b else lg(mc.predict(R, a, b, 1, now, a_blue=True)) for b in ids] for a in ids]
    zn = [[0.0 if a == b else lg(mc.predict(R, a, b, 1, now)) for b in ids] for a in ids]
    return zb, zn


# ---------------------------------------------------------------- 3. Monte-Carlo
def simulate(fmt, labels, zb, zn, leagues, n=N_SIMS, seed=SEED, var=None, now=None, track_next=True, trace=None):
    """n tirages de la suite du tournoi. now : jours depuis 2024-01-01 (horizon de la dérive).
    trace : liste facultative, reçoit pour chaque tirage (appariements suisses tirés, quarts, vainqueurs des quarts,
    finalistes, champion, bilans) pour les contrôles."""
    var = dict(VAR, **(var or {}))
    N = len(labels); ix = {t: i for i, t in enumerate(labels)}
    sS = math.sqrt(max(0.0, var["serie"])); sT = math.sqrt(max(0.0, var["equipe"])); sL = math.sqrt(max(0.0, var["ligue"]))
    q = max(0.0, var["derive"])
    LGS = sorted(set(leagues)); li = [LGS.index(l) for l in leagues]
    KB = [[0.0] * N for _ in range(N)]; KN = [[0.0] * N for _ in range(N)]
    for i in range(N):
        for j in range(N):
            if i != j:
                k = kappa(var, li[i] != li[j]); KB[i][j] = k * zb[i][j]; KN[i][j] = k * zn[i][j]
    H = horizons(fmt, now if now is not None else 0.0)
    dsd = [math.sqrt(q * (H[k] - (H[k - 1] if k else 0.0))) for k in range(len(H))]   # écart-type des incréments de dérive
    W0, L0, opp0, played0, pend0 = swiss_state(fmt)
    W0 = [W0.get(t, 0) for t in labels]; L0 = [L0.get(t, 0) for t in labels]
    P0 = [played0.get(t, 0) for t in labels]; O0 = [frozenset(ix[o] for o in opp0.get(t, ())) for t in labels]
    pend0 = [(ix[x["a"]], ix[x["b"]], x["bo"], x["wa"], x["wb"], (None if not x["blue"] else x["blue"] == x["a"]), x["mid"], x["round"])
             for x in pend0]
    known = {x[6]: [0, 0] for x in pend0}   # matchs connus non terminés : mid -> [victoires de a, tirages]
    ko = {k: [(ix[x["a"]] if x["a"] else None, ix[x["b"]] if x["b"] else None, x["wa"], x["wb"], x["mid"],
               (ix[x["win"]] if x["win"] else None)) for x in fmt[k]] for k in ("QF", "SF", "F")}
    for k in ("QF", "SF", "F"):
        for a, b, wa, wb, mid, win in ko[k]:
            if a is not None and b is not None and win is None: known[mid] = [0, 0]
    rnd = random.Random(seed); R = rnd.random; gauss = rnd.gauss; shuffle = rnd.shuffle
    GX = [-4 + 0.25 * k for k in range(33)]; GW = [math.exp(-x * x / 2) for x in GX]
    rec = [dict() for _ in range(N)]; qual = [0] * N; semi = [0] * N; fin = [0] * N; champ = [0] * N
    nxt = {}; nxt_round = [None]; nrem = [0]
    NS = len(STAGES)

    def play(i, j, bo, wa, wb, iblue, st, E):
        """True si i gagne ; E[i][st] = effets du tirage (équipe, ligue, dérive à la date de la phase st)."""
        if bo == 1:
            if iblue is None: iblue = R() < 0.5
            Lg = (KB[i][j] if iblue else -KB[j][i]) + E[i][st] - E[j][st]
            return R() < sig(Lg + (gauss(0.0, sS) if sS else 0.0))
        need = bo // 2 + 1
        Lg = KN[i][j] + E[i][st] - E[j][st]
        if wa or wb:   # série en cours : effet de série a posteriori, sachant le score
            ws = []; ps = []
            for x, w0 in zip(GX, GW):
                p = sig(Lg + sS * x); ps.append(p); ws.append(w0 * p ** wa * (1 - p) ** wb)
            u = R() * sum(ws); acc = 0.0; k = 0
            for k, w in enumerate(ws):
                acc += w
                if acc >= u: break
            return R() < p_first_to(ps[k], need - wa, need - wb)
        p = sig(Lg + (gauss(0.0, sS) if sS else 0.0))
        if bo == 3: Pw = p * p * (3 - 2 * p)
        elif bo == 5: Pw = p * p * p * (10 - 15 * p + 6 * p * p)
        else: Pw = p_first_to(p, need, need)
        return R() < Pw

    def draw(group, opp):
        """Tirage au sort entre équipes de même bilan, sans revanche si possible (tirage séquentiel avec retour arrière)."""
        g = list(group); shuffle(g)
        def rec_(ts):
            if not ts: return []
            a = ts[0]; c = [b for b in ts[1:] if b not in opp[a]]; shuffle(c)
            for b in c:
                r = rec_([t for t in ts[1:] if t != b])
                if r is not None: return [(a, b)] + r
            return None
        r = rec_(g)
        if r is None:   # revanche inévitable
            r = [(g[k], g[k + 1]) for k in range(0, len(g) - 1, 2)]
            nrem[0] += sum(1 for a, b in r if b in opp[a])
        return r

    zero = [0.0] * NS
    for s in range(n):
        # effets du tirage : constante d'équipe + ligue + dérive cumulée à chaque phase
        if sT or sL or q:
            lw = [gauss(0.0, sL) if sL else 0.0 for _ in LGS]
            E = []
            for i in range(N):
                c = (gauss(0.0, sT) if sT else 0.0) + lw[li[i]]; row = []
                for k in range(NS):
                    if dsd[k]: c += gauss(0.0, dsd[k])
                    row.append(c)
                E.append(row)
        else:
            E = [zero] * N
        W = W0[:]; L = L0[:]; P = P0[:]; opp = [set(o) for o in O0]
        pend = list(pend0); tr_sw = []
        while True:
            for (i, j, bo, wa, wb, ib, mid, rd) in pend:
                iw = play(i, j, bo, wa, wb, ib, rd - 1, E)
                if mid is not None and mid in known: known[mid][1] += 1; known[mid][0] += iw
                if track_next and mid is None and rd == nxt_round[0]:
                    kk = nxt.setdefault((i, j, bo), [0, 0]); kk[0] += 1; kk[1] += iw
                if iw: W[i] += 1; L[j] += 1
                else: W[j] += 1; L[i] += 1
            pend = []
            act = [i for i in range(N) if W[i] < 3 and L[i] < 3]
            if not act: break
            m = min(P[i] for i in act)
            todo = [i for i in act if P[i] == m]
            cur = m + 1
            if nxt_round[0] is None: nxt_round[0] = cur
            groups = {}
            for i in todo: groups.setdefault((W[i], L[i]), []).append(i)
            carry = []
            for key in sorted(groups, key=lambda kk: (kk[1] - kk[0], -kk[0])):
                grp = carry + groups[key]; carry = []
                if len(grp) % 2: carry = [grp.pop(int(R() * len(grp)))]   # état incohérent : une équipe passe au groupe suivant
                for a, b in draw(grp, opp):
                    if trace is not None: tr_sw.append((cur, W[a], L[a], W[b], L[b], a, b, b in opp[a]))
                    bo = 3 if (W[a] == 2 or L[a] == 2) else 1
                    pend.append((a, b, bo, 0, 0, None, None, cur))
                    opp[a].add(b); opp[b].add(a); P[a] += 1; P[b] += 1
        for i in range(N):
            k = (W[i], L[i]); rec[i][k] = rec[i].get(k, 0) + 1
        qd = [i for i in range(N) if W[i] == 3]
        for i in qd: qual[i] += 1
        # ---- quarts : tableau connu, ou tirage (3-0 contre 3-2, moitiés opposées)
        QF = ko["QF"]
        qs = set(qd)   # tableau connu utilisé seulement s'il est cohérent avec ce tirage (garde-fou)
        if QF and all(x[0] is not None and x[1] is not None and x[0] in qs and x[1] in qs for x in QF):
            slots = list(QF)
        else:
            fixed = [x for x in QF if x[0] is not None and x[1] is not None and x[0] in qs and x[1] in qs]
            used = {t for x in fixed for t in x[:2]}
            r30 = [i for i in qd if L[i] == 0 and i not in used]; r32 = [i for i in qd if L[i] == 2 and i not in used]
            r31 = [i for i in qd if L[i] == 1 and i not in used]
            shuffle(r30); shuffle(r32)
            top = []
            while r30 and r32: top.append((r30.pop(), r32.pop()))
            rest = r30 + r31 + r32; shuffle(rest)
            others = [(rest[k], rest[k + 1]) for k in range(0, len(rest) - 1, 2)]
            new = []
            while top or others:   # quart 1 et 3 : un 3-0 chacun ; demi 1 = quarts 1-2, demi 2 = quarts 3-4
                if top: new.append(top.pop())
                if others: new.append(others.pop())
            it = iter(new); slots = []
            for x in (QF if len(QF) == 4 else [None] * 4):
                if x is not None and x in fixed: slots.append(x)
                else:
                    a, b = next(it); slots.append((a, b, 0, 0, None, None))

        def ko_match(a, b, wa, wb, mid, win, st):
            if win is not None: return win
            iw = play(a, b, 5, wa, wb, None, st, E)
            if mid is not None and mid in known: known[mid][1] += 1; known[mid][0] += iw
            return a if iw else b
        qw = [ko_match(*x, 5) for x in slots]
        for i in qw: semi[i] += 1
        # demies : celles déjà connues (si cohérentes avec ce tirage), sinon le tableau (quarts 1-2 et 3-4)
        qwset = set(qw)
        ksf = [x for x in ko["SF"] if x[0] is not None and x[1] is not None and x[0] in qwset and x[1] in qwset]
        used = {t for x in ksf for t in x[:2]}
        rest = [t for t in qw if t not in used]
        sfs = ksf + [(rest[k], rest[k + 1], 0, 0, None, None) for k in range(0, len(rest) - 1, 2)]
        sw = [ko_match(*x, 6) for x in sfs[:2]]
        for i in sw: fin[i] += 1
        x = ko["F"][0] if ko["F"] else None
        c = ko_match(*x, 7) if (x and x[0] is not None and x[1] is not None and {x[0], x[1]} == set(sw)) else ko_match(sw[0], sw[1], 0, 0, None, None, 7)
        champ[c] += 1
        if trace is not None: trace.append((tr_sw, [(x[0], x[1]) for x in slots], qw, sw, c, W[:], L[:]))
    return {"revanches": nrem[0], "rec": rec, "qual": qual, "semi": semi, "fin": fin, "champ": champ, "known": known,
            "next": nxt, "next_round": nxt_round[0], "n": n, "horizons": H}


# ---------------------------------------------------------------- 4. probabilité d'un match (analytique)
_GX = [-6 + 0.25 * k for k in range(49)]
_GWr = [math.exp(-x * x / 2) for x in _GX]; _GW = [w / sum(_GWr) for w in _GWr]


def match_prob(zb_ab, zb_ba, zn_ab, bo, cross, wa=0, wb=0, a_blue=None, h=0.0, var=None):
    """P(A gagne le match), marginale : intègre l'effet de série (et les effets constants) et la dérive sur h jours ;
    série en cours : sachant le score (wa, wb)."""
    var = dict(VAR, **(var or {}))
    sc = var["serie"] + 2 * var["equipe"] + (2 * var["ligue"] if cross else 0.0)
    k = kappa(var, cross); sd = math.sqrt(max(0.0, sc + 2 * var["derive"] * h))
    if bo == 1:
        f = lambda z: sum(w * sig(k * z + sd * x) for x, w in zip(_GX, _GW))
        if a_blue is None: return (f(zb_ab) + 1 - f(zb_ba)) / 2
        return f(zb_ab) if a_blue else 1 - f(zb_ba)
    need = bo // 2 + 1; num = den = 0.0
    for x, w in zip(_GX, _GW):
        p = sig(k * zn_ab + sd * x); lik = w * p ** wa * (1 - p) ** wb
        num += lik * p_first_to(p, need - wa, need - wb); den += lik
    return num / den


# ---------------------------------------------------------------- 5. point d'entrée du robot
def run(C=None, teams=None, n=N_SIMS, seed=SEED, model="E", var=None, year="2026", asof=None, cutoff=None, keep=(),
        now=None, model_e_path=None, logit=None, trace=None, bs=None):
    """Simulation complète ; renvoie un dict JSON (voir les clés à la fin)."""
    t0 = time.time()
    var = dict(VAR, **(var or {}))
    if C is None:
        import gzip
        C = json.load(gzip.open(os.path.join(HERE, "..", "cache.json.gz"), "rt", encoding="utf-8"))
    if teams is None:
        p = os.path.join(HERE, "..", "teams.json")
        teams = json.load(open(p, encoding="utf-8")) if os.path.exists(p) else []
    fmt = read_format(C, teams, year=year, cutoff=cutoff, keep=keep)
    labels = sorted({t for x in fmt["swiss"] for t in (x["a"], x["b"]) if t})
    if len(labels) != 16:
        return {"v": 1, "statut": "format incomplet : %d équipes connues en phase suisse" % len(labels), "equipes": {}, "matchs": []}
    if now is None:
        now = tday(cutoff) if cutoff else tday(datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S"))
    tid_of = fmt["tid"]
    status = "ok"; S = LU = None; LG = {}
    try:
        if model != "E": raise RuntimeError("modèle C demandé")
        M = model_e_module(model_e_path)
        S, LU, LG, lg0 = strengths_E(C, labels, tid_of, M, asof=asof, bs=bs)
        zb, zn = matrices_E(labels, S, logit or lg0)
        used = "E"
    except Exception as ex:   # secours : modèle C
        if model == "E": status = "secours C (%s: %s)" % (type(ex).__name__, ex)
        zb, zn = matrices_C(C, labels, tid_of, bs=bs)
        used = "C"
        tl = {t["id"]: t.get("league") for t in teams}
        LG = {l: tl.get(l, "?") for l in labels}
    leagues = [LG.get(l, "?") for l in labels]
    t1 = time.time()
    sim = simulate(fmt, labels, zb, zn, leagues, n=n, seed=seed, var=var, now=now, trace=trace)
    t2 = time.time()
    ix = {t: i for i, t in enumerate(labels)}
    W, L, opp, played, pend = swiss_state(fmt)
    H = dict(zip(STAGES, sim["horizons"]))
    out_t = {}
    for i, t in enumerate(labels):
        r = sim["rec"][i]; f = lambda k: r.get(k, 0) / n
        out_t[t] = {"ligue": LG.get(t), "force": round(S[t], 3) if S else None, "composition": LU.get(t) if LU else None,
                    "bilan": "%d-%d" % (W.get(t, 0), L.get(t, 0)),
                    "p_3_0": round(f((3, 0)), 4), "p_3_1": round(f((3, 1)), 4), "p_3_2": round(f((3, 2)), 4),
                    "p_2_3": round(f((2, 3)), 4), "p_1_3": round(f((1, 3)), 4), "p_0_3": round(f((0, 3)), 4),
                    "p_qualif": round(sim["qual"][i] / n, 4), "p_demie": round(sim["semi"][i] / n, 4),
                    "p_finale": round(sim["fin"][i] / n, 4), "p_titre": round(sim["champ"][i] / n, 4)}
    matches = []
    for stage in ("swiss", "QF", "SF", "F"):
        for x in fmt[stage]:
            st = ("R%d" % x.get("round", x.get("slot_round", 1))) if stage == "swiss" else stage
            row = {"match": x["mid"], "date": x["t"], "phase": stage, "ronde": x.get("round") or x.get("slot_round"), "bo": x["bo"],
                   "a": x["a"], "b": x["b"]}
            if x["a"]:
                i, j = ix[x["a"]], ix[x["b"]]
                row.update({"score": "%d-%d" % (x["wa"], x["wb"]), "vainqueur": x["win"]})
                if not x["win"]:
                    h = max(0.0, tday(x["t"]) - now)
                    row["p_a"] = round(match_prob(zb[i][j], zb[j][i], zn[i][j], x["bo"], leagues[i] != leagues[j], x["wa"], x["wb"],
                                                  None if x["blue"] is None else x["blue"] == x["a"], h, var), 4)
                    k = sim["known"].get(x["mid"])
                    if k and k[1]: row["p_a_simulation"] = round(k[0] / k[1], 4)
                    if x["bo"] == 1 and x["blue"]: row["bleu"] = x["blue"]
            matches.append(row)
    # prochaine ronde tirée au sort : adversaires possibles (fréquence du tirage) et P(victoire) analytique
    nxt = {}; nr = sim["next_round"]; hn = H.get("R%d" % nr, 0.0) if nr else 0.0
    for (i, j, bo), (c, w) in sim["next"].items():
        for a, b in ((i, j), (j, i)):
            pw = match_prob(zb[a][b], zb[b][a], zn[a][b], bo, leagues[a] != leagues[b], h=hn, var=var)
            e = nxt.setdefault(labels[a], {}).setdefault(labels[b], [0.0, 0.0, bo]); e[0] += c / n; e[1] += c / n * pw
    nxt = {t: sorted(({"adversaire": b, "p_tirage": round(v[0], 4), "p_victoire": round(v[1] / v[0], 4), "bo": v[2]} for b, v in d.items()),
                     key=lambda e: -e["p_tirage"]) for t, d in nxt.items()}
    duels = {}
    for bo in (1, 3, 5):
        duels["bo%d" % bo] = {a: {b: round(match_prob(zb[i][j], zb[j][i], zn[i][j], bo, leagues[i] != leagues[j], var=var), 4)
                                  for j, b in enumerate(labels) if j != i} for i, a in enumerate(labels)}
    done = [x.get("round", 0) for x in fmt["swiss"] if x["a"] and x["win"]]
    return {"v": 1, "statut": status, "modele": "E joueurs-impact" if used == "E" else "C domination (secours)",
            "maj": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "tirages": n, "graine": seed, "erreur_mc_max": round(0.5 / math.sqrt(n), 4),
            "duree_s": {"modele": round(t1 - t0, 2), "simulation": round(t2 - t1, 2)},
            "variances": var, "horizons_jours": {k: round(v, 2) for k, v in H.items()},
            "matchs_suisses_joues": len(done), "prochaine_ronde_tiree": sim["next_round"], "revanches_tirees": sim["revanches"],
            "equipes": dict(sorted(out_t.items(), key=lambda kv: (-kv[1]["p_titre"], -kv[1]["p_qualif"]))),
            "matchs": matches, "prochaine_ronde": nxt, "duels": duels}


if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else N_SIMS
    R = run(n=n)
    print("statut :", R["statut"], "| modèle :", R["modele"], "| tirages :", R["tirages"], "| durées :", R["duree_s"])
    print("%-5s %-6s %6s %6s | %6s %6s %6s %6s %6s %6s | %7s %7s %7s %7s" % (
        "éq.", "ligue", "force", "bilan", "3-0", "3-1", "3-2", "2-3", "1-3", "0-3", "qualif", "demie", "finale", "titre"))
    for t, v in R["equipes"].items():
        print("%-5s %-6s %6.2f %6s | %5.1f%% %5.1f%% %5.1f%% %5.1f%% %5.1f%% %5.1f%% | %6.1f%% %6.1f%% %6.1f%% %6.1f%%" % (
            t, v["ligue"], v["force"] or 0, v["bilan"], 100 * v["p_3_0"], 100 * v["p_3_1"], 100 * v["p_3_2"], 100 * v["p_2_3"],
            100 * v["p_1_3"], 100 * v["p_0_3"], 100 * v["p_qualif"], 100 * v["p_demie"], 100 * v["p_finale"], 100 * v["p_titre"]))
    for m in R["matchs"]:
        if m.get("a") and not m.get("vainqueur"):
            print("à jouer", m["date"], m["phase"], "Bo%d" % m["bo"], m["a"], m["score"], m["b"], "P(%s) = %.1f %% (simulation %.1f %%)" % (
                m["a"], 100 * m["p_a"], 100 * m.get("p_a_simulation", float("nan"))))
