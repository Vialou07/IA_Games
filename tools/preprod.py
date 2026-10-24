#!/usr/bin/env python3
"""Fabrique preprod/worlds.html à partir de worlds.html, pour tester sur un vrai téléphone sans toucher à l'appli des potes :
- stats lues sur la branche stats-preprod (robot lancé à la main depuis une autre branche que main) ;
- données du téléphone séparées (préfixe w26pp_ au lieu de w26_) : paris, ligue et favori de la vraie appli intacts ;
- ligue de paris sur un canal ntfy séparé : on n'apparaît jamais dans la vraie ligue ;
- bandeau « PRÉPROD » bien visible.
Usage : python3 tools/preprod.py   puis commit et push de preprod/worlds.html.
Adresse : https://vialou07.github.io/IA_Games/preprod/worlds.html"""
import os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(ROOT, "worlds.html"), encoding="utf-8").read()
REPL = [
    ("raw.githubusercontent.com/Vialou07/IA_Games/stats/data/", "raw.githubusercontent.com/Vialou07/IA_Games/stats-preprod/data/"),
    ('localStorage.getItem("w26_"+k)', 'localStorage.getItem("w26pp_"+k)'),
    ('localStorage.setItem("w26_"+k,', 'localStorage.setItem("w26pp_"+k,'),
    ('topicOf=c=>"iagames-worlds26-ligue-"+c', 'topicOf=c=>"iagames-worlds26pp-ligue-"+c'),
    ('href="index.html"', 'href="../index.html"'),
]
out = src
for a, b in REPL:
    n = out.count(a)
    if n < 1: sys.exit("motif introuvable dans worlds.html : " + a)
    out = out.replace(a, b)
out = out.replace('const APP_VERSION="', 'const APP_VERSION="PRÉPROD ', 1)
banner = ('<div style="position:fixed;top:0;left:50%;transform:translateX(-50%);z-index:99;background:#E84057;color:#fff;'
          'font:800 11px/1 sans-serif;letter-spacing:.08em;padding:4px 10px;border-radius:0 0 8px 8px;pointer-events:none">PRÉPROD</div>')
out = out.replace("<body>", "<body>\n" + banner, 1)
os.makedirs(os.path.join(ROOT, "preprod"), exist_ok=True)
with open(os.path.join(ROOT, "preprod", "worlds.html"), "w", encoding="utf-8", newline="") as f: f.write(out)
print("preprod/worlds.html écrit (%d Ko)" % (len(out.encode("utf-8")) // 1024))
