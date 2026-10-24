#!/usr/bin/env python3
"""Clés des matchs des Worlds à venir (avant-match) : bloc « pm » de stats.json, lu par worlds.html (keys.js).

Seuls les faits UTILES sont retenus, chacun avec son taux historique (REF) mesuré en chronologique sur 2025-2026,
toutes ligues puis internationales seules (Worlds, MSI, First Stand, EWC), par rapport au modèle E :
- « fav », « postes », « poste » : le favori du robot et POURQUOI (écarts de note d'impact poste par poste). C'est le
  seul signal d'avant-match qui prédit vraiment (65 % de bons favoris sur 5 810 parties 2025-2026).
- « cote » : côté bleu d'un Bo1 (avantage réel, déjà compté par le robot).
- « regle » (règle de Thomas), « duel », « h2h », « forme » : faits que les fans regardent. Testés : ils ne prédisent
  rien de plus que la note du robot (taux observé = taux attendu). On les montre seulement quand ils existent, avec
  ce taux, pour que l'appli dise « déjà compté » au lieu de les présenter comme des indices.
Ce qui a été testé et n'apporte rien (forme des joueurs, picks préférés, expérience des Worlds, effet international)
n'a pas de clé : voir prono/RAPPORT.md.

Entrée : prematch_block(FLAT, teams, stats_like, model_m, matches_upcoming, now_iso) -> dict (aucune exception ne remonte).
  matches_upcoming = [[matchId, codeA, codeB, bo, startISO(, codeBleu)]] ; sans codeBleu, en Bo1, la 1re équipe
  listée est côté bleu (règle vérifiée sur 45 Bo1 internationaux 2026, cf. worlds_sim.py).
Bibliothèque standard seulement."""
import math, collections

ROLES = ["TOP", "JGL", "MID", "BOT", "SUP"]
INTL = ("worlds", "msi", "first_stand", "ewc_lol")
A0, AL = 0.1729, 0.6407            # LOGIT de production du modèle E (repris de model_m["logit"] quand il est fourni)

# Taux de référence, mesurés par analyse/refs_keys.py avec les fonctions ci-dessous (mêmes définitions), sur les parties
# du 01/01/2025 au 24/10/2026 : [parties, victoires de l'équipe concernée, victoires attendues par E, IC 95 % bas, haut
# de l'écart (victoires - attendu) / parties, bootstrap des matchs]. « tout » = toutes ligues, « intl » = internationales.
# Bloc généré par analyse/refs_keys.py le 24/10/2026 (cal : [borne basse, parties, victoires du favori, attendues] ;
# cote : 2026 seul, attendu SANS avantage de côté ; new, new2, mu, draft : eval_draftadj.py, fenêtre 730 jours).
REF = {
    "per": ["2025-01-01", "2026-10-24"],
    "regle": {"tout": [760, 437, 439.3, -0.037, 0.028], "intl": [33, 23, 19.5, 0.025, 0.213]},
    "duel": {"tout": [6801, 3914, 3899.5, -0.011, 0.015], "intl": [253, 148, 144.0, -0.061, 0.094]},
    "h2h": {"tout": [4790, 2905, 2887.1, -0.01, 0.018], "intl": [162, 109, 98.7, -0.014, 0.141]},
    "forme": {"tout": [2013, 1351, 1365.6, -0.027, 0.013], "intl": [95, 60, 57.8, -0.069, 0.109]},
    "cote": {"tout": [2887, 1589, 1490.7, 0.016, 0.051], "intl": [197, 121, 103.3, 0.033, 0.153], "per": ["2026-01-01", "2026-10-24"]},
    "cal": {"tout": {"bins": [[0.5, 2142, 1176, 1177.7], [0.6, 1803, 1158, 1167.5], [0.7, 1259, 943, 938.4], [0.8, 606, 509, 512.3]], "n": 5810, "fav": 3786}, "intl": {"bins": [[0.5, 116, 54, 64.2], [0.6, 129, 81, 84.2], [0.7, 96, 69, 71.0], [0.8, 55, 49, 46.1]], "n": 396, "fav": 253}},
    "new": {"tout": [3017, 1790, 1675.5, 0.022, 0.055], "intl": None},
    "new2": {"tout": [862, 550, 508.9, 0.016, 0.077], "intl": [15, 8, 8.6, -0.235, 0.114]},
    "mu": {"tout": [2418, 1307, 1239.2, 0.011, 0.046], "intl": None},
    "draft": {"c": [0.1648, -0.0998], "k": [5, 10], "min": 3, "gain": [0.0023, 0.0008, 0.0038], "gain_intl": [0.0001, -0.0043, 0.0046], "dp": [0.016, 0.044]},
    "contre": {"regle": {"tout": [238, 89, 92.1, -0.073, 0.053, 102], "intl": [13, 7, 5.9, -0.096, 0.233, 4]}, "duel": {"tout": [2212, 867, 855.1, -0.018, 0.03, 697], "intl": [83, 37, 32.3, -0.064, 0.163, 24]}, "h2h": {"tout": [1174, 483, 467.4, -0.016, 0.044, 564], "intl": [33, 22, 13.2, 0.115, 0.409, 14]}, "forme": {"tout": [214, 95, 86.7, -0.027, 0.104, 100], "intl": [29, 11, 9.6, -0.12, 0.222, 11]}},
}


def sig(x): return 1 / (1 + math.exp(-max(-30, min(30, x))))


def row(g, i):
    R = g.get("rows") or {}
    return R.get(i) if i in R else R.get(str(i))


class Hist:
    """Mémoire chronologique : duels de lane (paire de joueurs), séries par équipe, séries entre deux équipes.
    add() prend toutes les parties d'un même match (série) ; les requêtes ne voient que les matchs déjà ajoutés.
    score = {id équipe: manches gagnées} officiel (détails de l'API) ; sans lui, on compte les parties à plat (flux
    parfois absent : une manche peut manquer)."""
    def __init__(self):
        self.duel = collections.defaultdict(list)   # (pid a, pid b) -> [(écart d'or à 15 min de a ou None, victoire de a)]
        self.sform = collections.defaultdict(list)  # id équipe -> [série gagnée]
        self.ser = collections.defaultdict(list)    # (id a, id b) -> [(manches de a, manches de b, date)]

    def add(self, games, score=None):
        for g in games:
            if g.get("w") not in (g.get("b"), g.get("r")): continue   # partie sans vainqueur connu
            y = 1 if g["w"] == g["b"] else 0
            P = g["pid"]
            for i in range(5):
                a, b = row(g, i), row(g, 5 + i)
                if not a or not b or not P[i] or not P[5 + i]: continue
                self.duel[(P[i], P[5 + i])].append((a["gd15"], y))
                self.duel[(P[5 + i], P[i])].append((b["gd15"], 1 - y))
        g0 = games[0]; ta, tb = g0["b"], g0["r"]
        if score and ta in score and tb in score: wa, wb = score[ta] or 0, score[tb] or 0
        else:
            wa = sum(1 for g in games if g["w"] == ta); wb = sum(1 for g in games if g["w"] == tb)
        if wa == wb: return
        d = g0["t"][:10]
        self.ser[(ta, tb)].append((wa, wb, d)); self.ser[(tb, ta)].append((wb, wa, d))
        self.sform[ta].append(1 if wa > wb else 0); self.sform[tb].append(1 if wb > wa else 0)

    # ---- faits (orientés équipe A) ----
    def regle(self, la, lb):
        """Règle de Thomas : top, jungle et mid ont dominé leur vis-à-vis (écart d'or moyen à 15 min > 0) sur leurs
        3 derniers duels directs, les 3 mesurés. +1 pour A, -1 pour B, 0 sinon ; et les 3 écarts moyens de A."""
        gds = []
        for i in range(3):
            h = self.duel.get((la[i], lb[i]), [])[-3:] if la[i] and lb[i] else []
            m = [x[0] for x in h if x[0] is not None]
            if len(m) < 3: return 0, None
            gds.append(sum(m) / 3)
        if all(v > 0 for v in gds): return 1, gds
        if all(v < 0 for v in gds): return -1, gds
        return 0, gds

    def duels(self, la, lb):
        """Postes où un joueur a dominé les derniers duels : devant à 15 min dans au moins 80 % des 5 derniers duels
        mesurés (3 au minimum). [(poste, +1/-1, duels mesurés, duels où A était devant, où B était devant, écart moyen de A,
        parties gagnées par l'équipe de A)]."""
        out = []
        for i in range(5):
            if not la[i] or not lb[i]: continue
            h = [x for x in self.duel.get((la[i], lb[i]), [])[-5:] if x[0] is not None]
            n = len(h)
            if n < 3: continue
            k = sum(1 for v, y in h if v > 0); kb = sum(1 for v, y in h if v < 0)
            s = 1 if k >= 0.8 * n else -1 if kb >= 0.8 * n else 0
            if s: out.append((i, s, n, k, kb, sum(v for v, y in h) / n, sum(y for v, y in h)))
        return out

    def h2h(self, ta, tb):
        """3 dernières séries entre les deux équipes : +1 si A a gagné plus de manches, -1 si B, 0 sinon ;
        détail (séries gagnées, perdues, manches gagnées, perdues, date de la dernière)."""
        x = self.ser.get((ta, tb), [])[-3:]
        if not x: return 0, None
        return h2h_of([(a, b, d) for a, b, d in x])

    def forme(self, ta, tb):
        """10 dernières séries de chaque équipe : +1 si A en a gagné au moins 3 de plus, -1 si B ; détail."""
        a, b = self.sform.get(ta, [])[-10:], self.sform.get(tb, [])[-10:]
        return forme_of(a, b)


def h2h_of(x):
    """x = [(manches de A, manches de B, date)] des 3 dernières séries (ordre quelconque)."""
    gw = sum(a for a, b, d in x); gl = sum(b for a, b, d in x)
    sw = sum(1 for a, b, d in x if a > b); sl = sum(1 for a, b, d in x if b > a)
    return (1 if gw > gl else -1 if gl > gw else 0), (sw, sl, gw, gl, max(d for a, b, d in x))


def forme_of(a, b):
    """a, b = séries gagnées (1/0) des 10 dernières séries de A et de B."""
    if len(a) < 10 or len(b) < 10: return 0, None
    d = sum(a) - sum(b)
    return (1 if d >= 3 else -1 if d <= -3 else 0), (sum(a), 10 - sum(a), sum(b), 10 - sum(b))


def by_match(FLAT):
    """Parties regroupées par match, dans l'ordre chronologique."""
    G = sorted(FLAT, key=lambda g: (g["t"], g["m"], g["n"]))
    out = []; cur = None
    for g in G:
        if cur is None or g["m"] != cur[0]["m"]: cur = [g]; out.append(cur)
        else: cur.append(g)
    return out


def lineups(FLAT, teams):
    """Titulaires de teams.json -> identifiant esports (stable entre équipes), et id LoL Esports de chaque équipe
    (côté où ses titulaires ont joué le plus récemment)."""
    pidof = {}; tid = {}
    keys = {t["id"]: [p["key"] for p in t["players"]] for t in teams}
    for g in sorted(FLAT, key=lambda g: g["t"], reverse=True):
        ks = g.get("ks") or [None] * 10
        for i, k in enumerate(ks):
            if k and k not in pidof and g["pid"][i]: pidof[k] = g["pid"][i]
        for code, K in keys.items():
            if code in tid: continue
            for s, side in ((0, "b"), (1, "r")):
                if sum(1 for k in ks[5 * s:5 * s + 5] if k in K) >= 3: tid[code] = g[side]
    LU = {}
    for t in teams:
        by = {p["role"]: p["key"] for p in t["players"]}
        ks = [by.get(r) for r in ROLES]
        LU[t["id"]] = (tid.get(t["id"]), [pidof.get(k) for k in ks], ks)
    return LU


def _p(stats_like, model_m, mid, A, B, bo, blue):
    """P(A gagne la série) du robot (sim.mt, sinon formule) et P(A gagne une partie)."""
    a0, al = (model_m or {}).get("logit") or [A0, AL]
    sim = (stats_like or {}).get("sim") or {}
    S = dict((model_m or {}).get("t") or {}); S.update(sim.get("S") or {})
    if A not in S or B not in S: return None, None
    z = al * (S[A] - S[B])
    pg = sig(a0 + z) if blue == A else sig(-a0 + z) if blue == B else (sig(a0 + z) + sig(-a0 + z)) / 2
    pm = None
    for x in sim.get("mt") or []:
        if x[0] == mid and {x[1], x[2]} == {A, B}: pm = x[4] if x[1] == A else 1 - x[4]
    if pm is None:
        q = sig(z)
        pm = pg if bo == 1 else q * q * (3 - 2 * q) if bo == 3 else q ** 3 * (10 - 15 * q + 6 * q * q) if bo == 5 else q
    return pm, pg


def match_keys(H, LU, stats_like, model_m, A, B, bo, blue, pm, pg):
    """Clés d'un match, de la plus importante à la moins importante (format : voir RAPPORT.md, section intégration)."""
    K = []
    if pm is not None:
        fav = A if pm >= .5 else B
        K.append(["fav", fav, round(max(pm, 1 - pm), 3), round(pg if fav == A else 1 - pg, 3)])
    P = (model_m or {}).get("p") or {}; al = ((model_m or {}).get("logit") or [A0, AL])[1]
    ta, la, ka = LU.get(A, (None, [None] * 5, [None] * 5)); tb, lb, kb = LU.get(B, (None, [None] * 5, [None] * 5))
    gaps = []
    for i, r in enumerate(ROLES):
        if ka[i] in P and kb[i] in P:
            d = P[ka[i]][0] - P[kb[i]][0]; gaps.append((i, d))
    if len(gaps) == 5 and pm is not None:
        sgn = 1 if fav == A else -1
        K.append(["postes", fav, sum(1 for i, d in gaps if d * sgn > 0)])
        # le plus gros écart en faveur du favori, le 2e s'il pèse au moins 1,5 point, puis le meilleur poste de l'outsider
        # s'il pèse au moins 2 points (points = chances de victoire gagnées dans une partie équilibrée, al x écart x 25)
        pro = sorted([x for x in gaps if x[1] * sgn > 0], key=lambda x: -abs(x[1]))[:2]
        pro = pro[:1] + [x for x in pro[1:] if abs(al * x[1] * 25) >= 1.5]
        con = sorted([x for x in gaps if x[1] * sgn < 0], key=lambda x: -abs(x[1]))[:1]
        for i, d in pro + [x for x in con if abs(al * x[1] * 25) >= 2]:
            K.append(["poste", ROLES[i], ka[i], kb[i], round(d, 3), round(al * d * 25, 1)])
    if blue in (A, B) and bo == 1: K.append(["cote", blue])
    s, gds = H.regle(la, lb)
    if s: K.append(["regle", A if s > 0 else B] + [round(v if s > 0 else -v) for v in gds])
    for i, s, n, k, k2, m, w in sorted(H.duels(la, lb), key=lambda x: -abs(x[5]))[:2]:
        K.append(["duel", ROLES[i], ka[i], kb[i], n, k, k2, round(m), w])
    # face-à-face et forme : scores officiels de stats.json (h2h, teams.last) ; à défaut, la mémoire à plat
    S = stats_like or {}
    hk = "|".join(sorted([A, B])); hh = (S.get("h2h") or {}).get(hk)
    if hh and hh.get("list"):
        L = sorted(hh["list"], key=lambda z: z["dt"], reverse=True)[:3]
        s, x = h2h_of([((z["as"], z["bs"]) if hk.startswith(A + "|") else (z["bs"], z["as"])) + (z["dt"][:10],) for z in L])
    elif ta and tb: s, x = H.h2h(ta, tb)
    else: s, x = 0, None
    if x: K.append(["h2h", A if s >= 0 else B] + (list(x[:4]) if s >= 0 else [x[1], x[0], x[3], x[2]]) + [x[4]])
    TS = S.get("teams") or {}
    la10 = [1 if z.get("won") else 0 for z in (TS.get(A) or {}).get("last") or []][:10]
    lb10 = [1 if z.get("won") else 0 for z in (TS.get(B) or {}).get("last") or []][:10]
    if len(la10) == 10 and len(lb10) == 10: s, x = forme_of(la10, lb10)
    elif ta and tb: s, x = H.forme(ta, tb)
    else: s, x = 0, None
    if s: K.append(["forme", A if s > 0 else B] + (list(x) if s > 0 else [x[2], x[3], x[0], x[1]]))
    return K


def prematch_block(FLAT, teams, stats_like, model_m, matches_upcoming, now_iso):
    """Bloc « pm » : {"v", "maj", "ref", "m": [[matchId, codeA, codeB, bo, début, P(A série), P(A partie), [clés]]], "err"}.
    Rien ne dépend de l'heure de l'horloge : sans nouvelle donnée, le bloc ne change pas (pas de publication inutile)."""
    out = {"v": 1, "maj": str(now_iso or "")[:16], "ref": REF, "m": [], "err": []}
    try:
        H = Hist(); bad = 0
        for games in by_match(FLAT):
            try: H.add(games)
            except Exception: bad += 1   # une partie illisible ne doit pas priver tous les matchs de leurs clés
        if bad: out["err"].append("historique : %d séries ignorées" % bad)
        LU = lineups(FLAT, teams)
    except Exception as e:
        out["err"].append("historique : %s %s" % (type(e).__name__, str(e)[:120])); return out
    for x in matches_upcoming or []:
        try:
            mid, A, B, bo, start = x[0], x[1], x[2], int(x[3] or 1), str(x[4] or "")[:16]
            blue = x[5] if len(x) > 5 and x[5] in (A, B) else (A if bo == 1 else None)
            pm, pg = _p(stats_like, model_m, mid, A, B, bo, blue)
            out["m"].append([mid, A, B, bo, start, None if pm is None else round(pm, 3), None if pg is None else round(pg, 3),
                             match_keys(H, LU, stats_like, model_m, A, B, bo, blue, pm, pg)])
        except Exception as e:
            out["err"].append("match %s : %s %s" % (x[0] if x else "?", type(e).__name__, str(e)[:120]))
    return out
