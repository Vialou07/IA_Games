#!/usr/bin/env python3
"""Construit data/stats.json pour worlds.html à partir de Leaguepedia (Cargo).
Tourne sur GitHub Actions : une seule machine interroge Leaguepedia, lentement,
au lieu de chaque téléphone. Les agrégats ont exactement la forme attendue par l'appli."""
import json, time, re, os, sys, unicodedata, urllib.request, urllib.parse, datetime, itertools

API = "https://lol.fandom.com/api.php"
UA = "IA_Games-Worlds26-stats/1.0 (+https://github.com/Vialou07/IA_Games)"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "data", "stats.json")
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); LOG.append(s); print(s, flush=True)

def norm(s):
    s = str(s or "").lower().replace("ø", "o")
    s = "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]", "", s)

_last = [0.0]; NQ = [0]
def cargo(**p):
    p = {k: v for k, v in p.items() if v is not None}
    p.update(action="cargoquery", format="json"); p.setdefault("limit", "500")
    for attempt in range(8):
        wait = _last[0] + 2.5 - time.time()
        if wait > 0: time.sleep(wait)
        _last[0] = time.time(); NQ[0] += 1
        url = API + "?" + urllib.parse.urlencode(p)
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=90) as r:
                j = json.load(r)
        except Exception as e:
            log("  http", type(e).__name__, e); time.sleep(10 * (attempt + 1)); continue
        if "error" in j:
            log("  api", j["error"].get("code"), j["error"].get("info", "")[:160]); time.sleep(20 * (attempt + 1)); continue
        return [x["title"] for x in j.get("cargoquery", [])]
    raise RuntimeError("cargo failed: " + str(p.get("tables")) + " " + str(p.get("where", ""))[:120])

def cargo_all(max_rows=20000, **p):
    out, off = [], 0
    while off < max_rows:
        rows = cargo(offset=str(off), **p); out += rows
        if len(rows) < 500: break
        off += 500
    return out

def q(lst): return ",".join('"%s"' % str(x).replace('"', "") for x in dict.fromkeys(lst))
num = lambda v: float(v) if str(v).replace(".", "", 1).replace("-", "", 1).isdigit() else 0.0
INTL = re.compile(r"World Championship|Mid-Season|First Stand")

def main():
    t0 = time.time()
    teams = json.load(open(os.path.join(ROOT, "data", "teams.json")))
    T = {t["id"]: t for t in teams}
    EXTRA = {"DK": ["DWG KIA", "DAMWON Gaming"], "T1": ["SK Telecom T1"], "MKOI": ["MAD Lions KOI", "MAD Lions"], "TL": ["Team Liquid Honda"],
             "MVK": ["MGN Vikings Esports", "Vikings Esports"], "LOS": ["Los Grandes"], "TSW": ["Team Whales"], "LYON": ["LYON", "LYON Gaming"],
             "C9": ["Cloud9 Kia"], "GEN": ["KSV Esports"]}
    names = {t["id"]: [t["lp"]] + EXTRA.get(t["id"], []) for t in teams}
    allnames = lambda: list(itertools.chain(*names.values()))
    owner = lambda n: next((k for k, v in names.items() if n in v), None)
    errors = []

    # 1. noms historiques et logos
    log("1. noms d'équipes"); img = {}
    try:
        for r in cargo(tables="TeamRedirects", fields="TeamRedirects.AllName=A,TeamRedirects.OtherName=O",
                       where="TeamRedirects.AllName IN (%s) OR TeamRedirects.OtherName IN (%s)" % (q(allnames()), q(allnames()))):
            k = owner(r.get("A")) or owner(r.get("O"))
            if k:
                for n in (r.get("A"), r.get("O")):
                    if n and n not in names[k]: names[k].append(n)
        for _ in range(2):
            for r in cargo(tables="Teams", fields="Teams.Name=N,Teams.RenamedTo=R,Teams.Image=I",
                           where="Teams.RenamedTo IN (%s) OR Teams.Name IN (%s)" % (q(allnames()), q(allnames()))):
                k = owner(r.get("R")) if r.get("R") else None
                if k and r.get("N") and r["N"] not in names[k]: names[k].append(r["N"])
                for t in teams:
                    if t["lp"] == r.get("N") and r.get("I"): img[t["id"]] = r["I"]
    except Exception as e:
        errors.append("noms: %s" % e)
    def oid(n):
        for k, v in names.items():
            if n in v: return k
        nn = norm(n)
        for t in teams:
            if nn in t["al"]: return t["id"]
        return None

    # 2. joueurs : page Leaguepedia exacte (gère les homonymes)
    log("2. joueurs")
    link = {}
    try:
        ids = [p["id"] for t in teams for p in t["players"]]
        rows = cargo(tables="Players", fields="Players.ID=PID,Players.Team=Tm,Players.OverviewPage=OP", where="Players.ID IN (%s)" % q(ids))
        for t in teams:
            for p in t["players"]:
                cand = [r for r in rows if norm(r.get("PID")) == norm(p["id"])]
                r = next((r for r in cand if norm(r.get("Tm")) in t["al"]), None) or (cand[0] if len(cand) == 1 else None)
                link[p["key"]] = (r or {}).get("OP") or p["id"]
    except Exception as e:
        errors.append("joueurs: %s" % e)
        for t in teams:
            for p in t["players"]: link[p["key"]] = p["id"]
    links = list(link.values()); key_of = {norm(v): k for k, v in link.items()}

    MS_F = "MatchSchedule.Team1=A,MatchSchedule.Team2=B,MatchSchedule.Winner=W,MatchSchedule.Team1Score=SA,MatchSchedule.Team2Score=SB,MatchSchedule.DateTime_UTC=DT,MatchSchedule.OverviewPage=OP,MatchSchedule.BestOf=BO"
    AN = q(allnames())
    out = {"built": None, "teams": {}, "h2h": {}, "duels": {}, "players": {}, "tourney": None, "champs": {}, "mastery": {}, "logos": img, "links": link}

    # 3. confrontations entre équipes de ces Worlds (toutes années)
    log("3. confrontations")
    try:
        rows = cargo_all(tables="MatchSchedule", fields=MS_F, order_by="MatchSchedule.DateTime_UTC DESC",
                         where='MatchSchedule.Team1 IN (%s) AND MatchSchedule.Team2 IN (%s) AND MatchSchedule.Winner IN ("1","2")' % (AN, AN))
        for r in rows:
            a, b = oid(r.get("A")), oid(r.get("B"))
            if not a or not b or a == b: continue
            x, y = sorted([a, b]); H = out["h2h"].setdefault(x + "|" + y, {"aw": 0, "bw": 0, "list": [], "since": None, "intl": {"aw": 0, "bw": 0}})
            xside = 1 if a == x else 2; xwon = str(r.get("W")) == str(xside)
            H["aw" if xwon else "bw"] += 1
            if INTL.search(r.get("OP") or ""): H["intl"]["aw" if xwon else "bw"] += 1
            if len(H["list"]) < 5:
                H["list"].append({"dt": r.get("DT"), "op": r.get("OP"), "as": num(r.get("SA") if xside == 1 else r.get("SB")), "bs": num(r.get("SB") if xside == 1 else r.get("SA")), "aWon": xwon, "bo": num(r.get("BO"))})
            H["since"] = r.get("DT")
    except Exception as e:
        errors.append("h2h: %s" % e)

    # 4. saison 2026 de chaque équipe
    log("4. saisons 2026")
    try:
        ms = cargo_all(tables="MatchSchedule", fields=MS_F, order_by="MatchSchedule.DateTime_UTC DESC",
                       where='(MatchSchedule.Team1 IN (%s) OR MatchSchedule.Team2 IN (%s)) AND MatchSchedule.DateTime_UTC >= "2026-01-01" AND MatchSchedule.Winner IN ("1","2")' % (AN, AN))
        sg = cargo_all(tables="ScoreboardGames", fields="ScoreboardGames.Team1=A,ScoreboardGames.Team2=B,ScoreboardGames.WinTeam=WT,ScoreboardGames.Gamelength_Number=GL,ScoreboardGames.Team1Kills=KA,ScoreboardGames.Team2Kills=KB,ScoreboardGames.Team1Dragons=DA,ScoreboardGames.Team2Dragons=DB,ScoreboardGames.Team1Barons=BA,ScoreboardGames.Team2Barons=BB,ScoreboardGames.Team1Towers=TA,ScoreboardGames.Team2Towers=TB,ScoreboardGames.Team1Gold=GA,ScoreboardGames.Team2Gold=GB",
                       where='(ScoreboardGames.Team1 IN (%s) OR ScoreboardGames.Team2 IN (%s)) AND ScoreboardGames.DateTime_UTC >= "2026-01-01"' % (AN, AN))
        for t in teams:
            tid = t["id"]; mine = lambda n: n in names[tid]
            S = {"sw": 0, "sl": 0, "last": [], "vs": {}, "g": 0, "gw": 0, "bn": 0, "bw": 0, "rn": 0, "rw": 0, "gl": 0, "k": 0, "d": 0, "dr": 0, "ba": 0, "to": 0, "gd": 0}
            for r in ms:
                side = 1 if mine(r.get("A")) else 2 if mine(r.get("B")) else 0
                if not side: continue
                won = str(r.get("W")) == str(side); opp = r.get("B") if side == 1 else r.get("A"); o = oid(opp)
                S["sw" if won else "sl"] += 1
                if len(S["last"]) < 10:
                    S["last"].append({"opp": opp, "oid": o, "won": won, "s": num(r.get("SA") if side == 1 else r.get("SB")), "o": num(r.get("SB") if side == 1 else r.get("SA")), "dt": r.get("DT"), "op": r.get("OP")})
                if o and o != tid:
                    v = S["vs"].setdefault(o, {"w": 0, "l": 0}); v["w" if won else "l"] += 1
            for r in sg:
                side = 1 if mine(r.get("A")) else 2 if mine(r.get("B")) else 0
                if not side: continue
                won = mine(r.get("WT")) or (r.get("WT") == "1" and side == 1) or (r.get("WT") == "2" and side == 2)
                S["g"] += 1; S["gw"] += 1 if won else 0
                if side == 1: S["bn"] += 1; S["bw"] += 1 if won else 0
                else: S["rn"] += 1; S["rw"] += 1 if won else 0
                f = ["KA", "KB", "DA", "BA", "TA", "GA", "GB"] if side == 1 else ["KB", "KA", "DB", "BB", "TB", "GB", "GA"]
                S["gl"] += num(r.get("GL")); S["k"] += num(r.get(f[0])); S["d"] += num(r.get(f[1])); S["dr"] += num(r.get(f[2]))
                S["ba"] += num(r.get(f[3])); S["to"] += num(r.get(f[4])); S["gd"] += num(r.get(f[5])) - num(r.get(f[6]))
            if S["g"]:
                for k in ("gl", "k", "d", "dr", "ba", "to", "gd"): S[k] = round(S[k] / S["g"], 3)
            out["teams"][tid] = S
    except Exception as e:
        errors.append("saisons: %s" % e)

    # 5. duels de lane entre les 95 titulaires (depuis 2019)
    log("5. duels de lane")
    try:
        rows = cargo_all(40000, tables="ScoreboardPlayers=SP1,ScoreboardPlayers=SP2", join_on="SP1.GameRoleIdVs=SP2.GameRoleId",
                         fields="SP1.Link=PA,SP2.Link=PB,SP1.PlayerWin=W,SP1.Kills=KA,SP1.Deaths=DA,SP1.Assists=AA,SP2.Kills=KB,SP2.Deaths=DB,SP2.Assists=AB,SP1.Champion=CA,SP2.Champion=CB,SP1.DateTime_UTC=DT,SP1.OverviewPage=OP",
                         where='SP1.Link IN (%s) AND SP2.Link IN (%s) AND SP1.DateTime_UTC >= "2019-01-01"' % (q(links), q(links)), order_by="SP1.DateTime_UTC DESC")
        for r in rows:
            k = norm(r.get("PA")) + "|" + norm(r.get("PB"))
            x = out["duels"].setdefault(k, {"g": 0, "w": 0, "ka": 0, "da": 0, "aa": 0, "kb": 0, "db": 0, "ab": 0, "last": None})
            x["g"] += 1; x["w"] += 1 if r.get("W") == "Yes" else 0
            for a, b in (("ka", "KA"), ("da", "DA"), ("aa", "AA"), ("kb", "KB"), ("db", "DB"), ("ab", "AB")): x[a] += num(r.get(b))
            if not x["last"]: x["last"] = {"dt": r.get("DT"), "ca": r.get("CA"), "cb": r.get("CB"), "w": r.get("W") == "Yes", "op": r.get("OP")}
    except Exception as e:
        errors.append("duels: %s" % e)

    # 6. stats joueurs : saison 2026 et carrière aux Worlds
    log("6. stats joueurs")
    def agg(rows):
        A = {"g": 0, "w": 0, "k": 0, "d": 0, "a": 0, "cs": 0, "gold": 0, "dmg": 0, "tk": 0, "vs": 0, "min": 0}; ch = {}
        for r in rows:
            w = r.get("W") == "Yes"; A["g"] += 1; A["w"] += 1 if w else 0
            for a, b in (("k", "K"), ("d", "D"), ("a", "A"), ("cs", "CS"), ("gold", "G"), ("dmg", "DMG"), ("tk", "TK"), ("vs", "VS"), ("min", "GL")): A[a] += num(r.get(b))
            c = ch.setdefault(r.get("C"), {"g": 0, "w": 0, "k": 0, "d": 0, "a": 0}); c["g"] += 1; c["w"] += 1 if w else 0
            c["k"] += num(r.get("K")); c["d"] += num(r.get("D")); c["a"] += num(r.get("A"))
        A["champs"] = [dict(c=c, **v) for c, v in sorted(ch.items(), key=lambda kv: (-kv[1]["g"], -kv[1]["w"]))[:6]]
        return A
    try:
        se = cargo_all(30000, tables="ScoreboardPlayers=SP,ScoreboardGames=SG", join_on="SP.GameId=SG.GameId",
                       fields="SP.Link=L,SP.Champion=C,SP.Kills=K,SP.Deaths=D,SP.Assists=A,SP.CS=CS,SP.Gold=G,SP.DamageToChampions=DMG,SP.TeamKills=TK,SP.PlayerWin=W,SP.VisionScore=VS,SG.Gamelength_Number=GL",
                       where='SP.Link IN (%s) AND SP.DateTime_UTC >= "2026-01-01"' % q(links))
        wo = cargo_all(20000, tables="ScoreboardPlayers", fields="ScoreboardPlayers.Link=L,ScoreboardPlayers.Champion=C,ScoreboardPlayers.Kills=K,ScoreboardPlayers.Deaths=D,ScoreboardPlayers.Assists=A,ScoreboardPlayers.PlayerWin=W,ScoreboardPlayers.OverviewPage=OP",
                       where='ScoreboardPlayers.Link IN (%s) AND ScoreboardPlayers.OverviewPage LIKE "%%Season World Championship%%"' % q(links))
        for pk, L in link.items():
            mine_se = [r for r in se if norm(r.get("L")) == norm(L)]; mine_wo = [r for r in wo if norm(r.get("L")) == norm(L)]
            years = sorted({m.group(1) for r in mine_wo for m in [re.search(r"(\d{4}) Season World", r.get("OP") or "")] if m})
            out["players"][pk] = {"S": agg(mine_se), "W": agg(mine_wo), "years": years, "now": agg([r for r in mine_wo if (r.get("OP") or "").startswith("2026 Season World Championship")])}
    except Exception as e:
        errors.append("joueurs stats: %s" % e)

    # 7. champions (taux de victoire pro 2026) et maîtrise joueur-champion (depuis 2025)
    log("7. champions et maîtrise")
    try:
        base = dict(tables="ScoreboardPlayers", group_by="ScoreboardPlayers.Champion", fields="ScoreboardPlayers.Champion=C,COUNT(*)=N")
        for r in cargo_all(**base, where='ScoreboardPlayers.DateTime_UTC >= "2026-01-01"'): out["champs"].setdefault(norm(r.get("C")), {"n": 0, "w": 0})["n"] = num(r.get("N"))
        for r in cargo_all(**base, where='ScoreboardPlayers.DateTime_UTC >= "2026-01-01" AND ScoreboardPlayers.PlayerWin="Yes"'): out["champs"].setdefault(norm(r.get("C")), {"n": 0, "w": 0})["w"] = num(r.get("N"))
        mb = dict(tables="ScoreboardPlayers", group_by="ScoreboardPlayers.Link,ScoreboardPlayers.Champion", fields="ScoreboardPlayers.Link=L,ScoreboardPlayers.Champion=C,COUNT(*)=N")
        mw = 'ScoreboardPlayers.Link IN (%s) AND ScoreboardPlayers.DateTime_UTC >= "2025-01-01"' % q(links)
        for r in cargo_all(**mb, where=mw): out["mastery"].setdefault(norm(r.get("L")) + "|" + norm(r.get("C")), {"n": 0, "w": 0})["n"] = num(r.get("N"))
        for r in cargo_all(**mb, where=mw + ' AND ScoreboardPlayers.PlayerWin="Yes"'): out["mastery"].setdefault(norm(r.get("L")) + "|" + norm(r.get("C")), {"n": 0, "w": 0})["w"] = num(r.get("N"))
    except Exception as e:
        errors.append("champions: %s" % e)

    # 8. stats du tournoi
    log("8. tournoi")
    try:
        rows = cargo_all(5000, tables="ScoreboardPlayers=SP,ScoreboardGames=SG", join_on="SP.GameId=SG.GameId",
                         fields="SP.Link=L,SP.Team=TM,SP.Champion=C,SP.Kills=K,SP.Deaths=D,SP.Assists=A,SP.CS=CS,SP.DamageToChampions=DMG,SP.TeamKills=TK,SP.PlayerWin=W,SP.GameId=G,SG.Gamelength_Number=GL,SG.Team1=B1,SG.Team2=B2,SG.WinTeam=WT,SG.Team1Kills=K1,SG.Team2Kills=K2",
                         where='SP.OverviewPage LIKE "2026 Season World Championship%"')
        bans = cargo_all(2000, tables="PicksAndBansS7", fields=",".join("PicksAndBansS7.Team%dBan%d=%s%d" % (t, i, "ab"[t - 1], i) for t in (1, 2) for i in range(1, 6)),
                         where='PicksAndBansS7.OverviewPage LIKE "2026 Season World Championship%"')
        pl, ch, games = {}, {}, {}
        for r in rows:
            w = r.get("W") == "Yes"
            p = pl.setdefault(r.get("L"), {"L": r.get("L"), "tm": r.get("TM"), "g": 0, "w": 0, "k": 0, "d": 0, "a": 0, "cs": 0, "dmg": 0, "tk": 0, "min": 0})
            p["g"] += 1; p["w"] += 1 if w else 0
            for a, b in (("k", "K"), ("d", "D"), ("a", "A"), ("cs", "CS"), ("dmg", "DMG"), ("tk", "TK"), ("min", "GL")): p[a] += num(r.get(b))
            c = ch.setdefault(r.get("C"), {"p": 0, "w": 0, "b": 0}); c["p"] += 1; c["w"] += 1 if w else 0
            games.setdefault(r.get("G"), {"gl": num(r.get("GL")), "b1": r.get("B1"), "b2": r.get("B2"), "wt": r.get("WT"), "kills": num(r.get("K1")) + num(r.get("K2"))})
        for r in bans:
            for k in ("a1", "a2", "a3", "a4", "a5", "b1", "b2", "b3", "b4", "b5"):
                c = r.get(k)
                if c and c != "None": ch.setdefault(c, {"p": 0, "w": 0, "b": 0})["b"] += 1
        G = list(games.values()); n = len(G); blue = sum(1 for g in G if g["wt"] == g["b1"] or g["wt"] == "1")
        P = list(pl.values())
        def top(f, mn=3):
            return sorted([dict(p, v=f(p)) for p in P if p["g"] >= mn], key=lambda x: -x["v"])[:5]
        byLen = sorted(G, key=lambda g: -g["gl"]); byK = sorted(G, key=lambda g: -g["kills"])
        out["tourney"] = {"n": n, "blue": blue, "red": n - blue, "avg": (sum(g["gl"] for g in G) / n) if n else 0,
            "longest": byLen[0] if G else None, "shortest": byLen[-1] if G else None, "bloodiest": byK[0] if G else None,
            "lead": {"kda": top(lambda p: (p["k"] + p["a"]) / max(1, p["d"])), "kills": top(lambda p: p["k"], 1), "csm": top(lambda p: p["cs"] / max(1, p["min"])),
                     "dpm": top(lambda p: p["dmg"] / max(1, p["min"])), "kp": top(lambda p: (p["k"] + p["a"]) / max(1, p["tk"]) * 100)},
            "champs": sorted([dict(c=c, pr=((v["p"] + v["b"]) / n * 100) if n else 0, **v) for c, v in ch.items()], key=lambda x: -x["pr"])[:15]}
    except Exception as e:
        errors.append("tournoi: %s" % e)

    out["errors"] = errors
    out["meta"] = {"queries": NQ[0], "seconds": round(time.time() - t0), "h2h": len(out["h2h"]), "duels": len(out["duels"]), "players": len(out["players"]), "teams": len(out["teams"])}
    # n'écrit le fichier que si les données ont changé (évite un commit toutes les 20 min)
    old = None
    if os.path.exists(OUT):
        try: old = json.load(open(OUT))
        except Exception: old = None
    strip = lambda d: {k: v for k, v in (d or {}).items() if k not in ("built", "meta")}
    if old and strip(old) == strip(out):
        log("aucun changement"); return 0
    out["built"] = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    json.dump(out, open(OUT, "w"), ensure_ascii=False, separators=(",", ":"))
    log("écrit", OUT, os.path.getsize(OUT) // 1024, "ko", out["meta"], "erreurs:", errors)
    return 0

if __name__ == "__main__":
    try: rc = main()
    finally: open(os.path.join(ROOT, "data", "stats_log.txt"), "w").write("\n".join(LOG) + "\n")
    sys.exit(rc)
