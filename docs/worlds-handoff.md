# Passation : appli Worlds 2026 (IA_Games)

## 1. Prompt à coller dans Claude Code

> Lis `docs/worlds-handoff.md` en entier avant de toucher à quoi que ce soit. C'est la passation de l'appli `worlds.html` de mon hub IA_Games. Reprends les tâches de la section 4 dans l'ordre, en commençant par celles marquées « à faire ». Pour chaque tâche : vérifie sur les vraies sources, montre-moi la preuve (sortie de commande, extrait de données), et ne dis « c'est bon » qu'après l'avoir constaté. Ne casse rien dans les autres jeux du hub. Parle-moi en français, court et concret, et guide-moi étape par étape quand tu as besoin de moi (téléphone, GitHub).

Pour lancer Claude Code au bon endroit :

```bash
git clone https://github.com/Vialou07/IA_Games.git
cd IA_Games
claude
```

---

## 2. Le projet en bref

- Dépôt : `Vialou07/IA_Games`, publié par GitHub Pages (branche `main`, mode classique) sur https://vialou07.github.io/IA_Games/
- L'appli : `worlds.html`, un seul fichier HTML (CSS et JS inclus), lien direct https://vialou07.github.io/IA_Games/worlds.html. Elle a une tuile « Worlds 2026 » en tête de `index.html` (le hub).
- Utilisateurs : Thomas et un groupe de potes, sur Android (Chrome et navigateur intégré de Messenger), souvent en 5G.
- Version actuelle : `APP_VERSION = "v8, 23/10/2026"` dans le bloc diagnostic (à incrémenter à chaque livraison).
- Autres fichiers de l'appli :
  - `tools/build_stats.py` : le générateur de stats côté serveur (le « robot ») ;
  - `.github/workflows/stats.yml` : le workflow GitHub Actions qui le lance toutes les 30 minutes ;
  - `data/teams.json` : le référentiel des 19 équipes et 95 joueurs, utilisé par le générateur ;
  - branche `stats` : contient seulement `data/stats.json`, réécrite par le robot (un seul commit, forcé). L'appli la lit sur `raw.githubusercontent.com/Vialou07/IA_Games/stats/data/stats.json`. `data/stats.json` est ignoré sur `main`.

### Fonctions de l'appli

Six onglets : Direct, Matchs, Suisse, Stats, Équipes, Joueurs.

- **Direct** : match à venir en grand (compte à rebours, faisceau animé), mini-score en direct, matchs de la soirée, pronos, équipe favorite, chiffres du tournoi, ligue de paris.
- **Fiche match** :
  - le face-à-face poste par poste ;
  - le pari (vainqueur, puis score exact en Bo3 et Bo5) ;
  - les paris de la ligue, cachés jusqu'au coup d'envoi ;
  - le direct : kills, or, objectifs, courbe d'or, 10 joueurs, chances de victoire estimées, analyse de draft ;
  - l'historique des confrontations, les duels de lane en carrière, la forme et la saison 2026 comparée.
- **Fiche joueur** : carte holographique, saison 2026, carrière aux Worlds, prochain duel.
- **Fiche équipe** : saison 2026, 10 dernières séries, bilan contre les équipes des Worlds.
- **Suisse** : arbre 0-0 à 3-x, avec le parcours de l'équipe favorite tracé en doré.
- **Joueurs** : grille de cartes, filtres par poste, nationalité et champions du monde, carte du monde des nationalités (d3 et world-atlas, chargés à la demande).
- **Ligue de paris** : multi-joueurs avec un code de 4 caractères, synchronisée par ntfy.sh. Classement, podium, titres (devin, en feu, audacieux).
- **Diagnostic** : touche la pastille en haut à droite. Il teste chaque source, mesure la latence et permet de copier un rapport.

### Structure de `worlds.html`

Le JS est un seul `<script>`, en blocs dans cet ordre. On repère chaque bloc grâce à ses commentaires `/* ==== ... ==== */`.

1. **Données** : `ROLES`, `TEAMS` (rosters, nationalités, couleurs, notes), `VENUES`, `STAGES`, `EMBED` (matchs de secours au 23/10 : Play-In et ronde 1 suisse avec les horaires réels et les 3 premiers résultats), `DAYS` (jours sans affiche connue).
2. **Utilitaires** :
   - `norm`, `esc`, `T` (équipes par id), `PLAYERS`, `CHAMPS` (titres mondiaux par joueur), `imgTag` et `imgFail` (cascade d'images) ;
   - `logo`, `photo`, `dayKeyL` (journée décalée de 6 h : un match à 2 h compte pour la veille) ;
   - `mkey` (clé de match stable : équipes plus phase, plus la date seulement en Play-In), `migrateKey`, `finalize`, `records`, `piWinner`, `status`.
3. **Effets** : poussière d'or (canvas, sprites, 30 i/s), confettis, `toast`, `startBeam` (faisceau du héros, en pause hors écran), inclinaison au gyroscope (héros et grande carte seulement), `intro`.
4. **Rendu** : `renderHome`, `renderMatchs`, `renderSwiss`, `renderTeams`, `renderPlayers`.
   - `renderAll` redessine tout, joueurs compris.
   - `renderLive` redessine tout sauf la grille des joueurs. C'est lui qu'on appelle à chaque synchro.
5. **Carte du monde** : `renderMap`.
6. **Fiches et navigation** :
   - `showTab` (historique du navigateur) ;
   - `openSheet` et `hideSheet`, avec la pile `SH` et `popstate` (bouton retour Android) ;
   - `closeSheet`, glisser vers le bas pour fermer ;
   - `matchSheet`, `teamSheet`, `playerSheet`, avec un mode `true` (rafraîchissement silencieux) ou `"back"` (retour sans nouvelle entrée d'historique).
7. **Stats** :
   - `cq` : file d'attente Leaguepedia, 2,5 s entre requêtes, pause de 60 s en cas de limite (`lpPause`). Ne sert plus que si le robot n'a encore rien publié pour une section ;
   - `ablock` : blocs asynchrones, mis en cache dans localStorage, chargés quand ils arrivent à l'écran (IntersectionObserver) ;
   - `loadSJ` : lit les stats du robot (branche `stats`). Dès qu'une section y existe, l'appli ne va plus du tout sur Leaguepedia pour elle. Les infos joueurs (`prows` : photo, vrai nom, pays) et les noms d'équipes (`names`) en viennent aussi ;
   - les agrégats `teamSeason`, `h2h`, `laneDuels`, `playerStats`, `tourneyStats`, et leurs rendus.
8. **Ligue** : `lg` dans localStorage (`w26_league`), `publish` et `duelConnect` (SSE ntfy avec repli sur interrogation régulière), `standings`, `duelHome`, `duelMatchHTML`. Les fonctions s'appellent encore « duel… » pour l'historique.
9. **Direct** : `liveTick`, `watchLive`, `winProb` (modèle maison), `computeDraft`, `liveBoxHTML`, `heroLiveHTML`.
10. **Sources en direct** :
    - `leFetch` : API LoL Esports ;
    - `fromLolEsports`, puis `fromLeaguepedia`, puis `EMBED` en dernier recours ;
    - `cargo`, `enrichPlayers` (photos, vrais noms, nationalités : stats du robot d'abord), `enrichPhotosLE`, `enrichPhotosWiki`, `sync`.
11. **Diagnostic** : `HEALTH`, instrumentation de `leFetch`, `cargo` et `feedWin`, puis `diagSheet`, `runDiag`, `diagReport`.
12. **Initialisation** : à la fin du script.

### Données stockées sur le téléphone

Tout est dans localStorage, avec le préfixe `w26_` :

- `picks` (pronos) et `scores` (score exact) ;
- `manual` (résultats saisis à la main, qui ne comptent pas en ligue) ;
- `fav` (équipe favorite), `league`, `myname` ;
- les caches `ak_*`, `lp_players`, `le_photos`, `tnames`, `champs2`.

Ne casse pas ces clés : les potes ont déjà des paris dedans.

---

## 3. Sources externes et ce qui est vérifié

| Source | Usage | État réel (vérifié le 23/10/2026) |
|---|---|---|
| `esports-api.lolesports.com/persisted/gw/` (`getSchedule`, `getLive`, `getEventDetails`, `getTeams`), en-tête `x-api-key: 0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z`, ligue Worlds `98767975604431411` | planning, résultats, matchs en cours | **Marche.** Libellés en français : Play-In = « Play-ins » (tous les matchs), puis « Système suisse », « Quarts de finale », « Demi-finales », « Finale ». Côtés dans `games[].teams[].side`. `getLive` renvoie toutes les ligues : l'appli filtre en reconnaissant les deux équipes. Depuis un PC, la connexion est parfois coupée (1 essai sur 2) : réessayer |
| `feed.lolesports.com/livestats/v1/window/{gameId}?startingTime=…` (ISO arrondi à 10 s) | kills, or, objectifs, stats des 10 joueurs | **Vérifié sur MKOI–BLG.** Stats joueurs dans `blueTeam.participants` et `redTeam.participants` ; K/D/A et CS identiques à `livestats/v1/details`. Sans `startingTime` : début de partie (or à 0 au chargement, 2 500 par équipe à 0:00), l'horloge est juste à ~10 s près. La fenêtre doit finir plus de 20 s avant l'heure du serveur, sinon erreur 400 : l'appli essaie 50 s, puis 90 s, puis 180 s. Noms du flux du type « MKOI Myrwn », bien rapprochés du roster |
| Leaguepedia Cargo `lol.fandom.com/api.php?action=cargoquery` | stats, photos, nationalités | **Limité à environ 1 requête par minute et par adresse IP en anonyme** (mesuré : 1 réponse sur 5 en 4 minutes, refus même 70 s après un succès). C'est la cause des « Leaguepedia limite les requêtes » sur les téléphones. Le robot se connecte avec un mot de passe de robot s'il en a un (voir P0) |
| `lol.fandom.com/wiki/Special:FilePath/…` | logos et photos Leaguepedia | **Peu fiable** : la redirection renvoie parfois une page 403, que Chrome bloque (ERR_BLOCKED_BY_ORB). L'appli passe alors aux logos et photos LoL Esports (cascade `imgTag`), rien ne casse |
| `ntfy.sh` (topic `iagames-worlds26-ligue-<CODE>`) | ligue de paris | **Vérifié avec 3 navigateurs sur le vrai ntfy.sh** (création, lien, code, notification de pari, pari caché, classements identiques). Pas encore avec de vrais téléphones. ntfy.sh ne garde les messages que 12 h : un nouveau venu ne voit que les membres actifs depuis 12 h, les anciens membres gardent tout en local |
| Data Dragon, flagcdn | icônes de champions, drapeaux | OK |

---

## 4. Tâches, par priorité

### P0 : le robot de stats

Fait le 23/10 :
- Workflow activé (`.github/workflows/stats.yml`). Il tourne toutes les 30 min, sur `workflow_dispatch` et au push du générateur.
- Le générateur garde l'ancienne version d'une section qui échoue, au lieu d'écrire du vide. Il ralentit à 1 requête par minute dès le premier refus, et travaille dans un budget de 100 min par passage. Les sections lourdes (saisons, h2h, stats joueurs, duels) sont recalculées toutes les 6 h, les champions, noms et joueurs toutes les 24 h, le tournoi à chaque passage. `fresh` donne la date de chaque section, `stale` les sections en retard, `errors` celles qui n'ont encore aucune donnée.
- Le résultat est publié sur la branche `stats`, seulement s'il a changé. Plus de commits du robot sur `main`.

À faire :
1. **Créer un mot de passe de robot Leaguepedia** (Thomas, 5 min) :
   - se connecter sur https://lol.fandom.com avec un compte Fandom (en créer un si besoin) ;
   - ouvrir https://lol.fandom.com/wiki/Special:BotPasswords, nom du robot `worlds`, cocher « Basic rights » et, si proposé, « High-volume (bot) access », puis créer ;
   - noter l'identifiant affiché (`TonPseudo@worlds`) et le mot de passe ;
   - sur GitHub, dépôt IA_Games, Settings, Secrets and variables, Actions : créer `LP_USER` (l'identifiant) et `LP_PASS` (le mot de passe).
   Ensuite, relancer le workflow (onglet Actions, « Stats Worlds 2026 », Run workflow) et vérifier dans son journal la ligne `connexion : OK` et le rythme (`pace` dans la ligne `écrit`). Si le rythme reste à 65 s ou plus malgré la connexion, la limite s'applique aussi aux comptes : le robot reste lent mais finit par tout remplir en quelques passages.
2. Vérifier les premiers passages : `gh run list --workflow stats.yml`, puis `gh run view <id> --log`. Ensuite :
   ```bash
   curl -s https://raw.githubusercontent.com/Vialou07/IA_Games/stats/data/stats.json | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['built'],d['meta'],d['errors'],d['stale'],sorted(d['fresh']))"
   ```
   Il faut à terme : `errors` vide, environ 19 équipes, 95 joueurs, plusieurs dizaines de paires `h2h`, plusieurs centaines de `duels`.
3. Contrôler un échantillon à la main contre Leaguepedia : le bilan T1 contre Gen.G, les stats 2026 de Faker, un duel de lane connu.
4. Vérifier les nationalités embarquées contre `prows` (champ `Ctry`), en particulier Zhuo (TES), JiaQi (IG), Ackerman (LØS), Bie (TSW), Kino et POUT (CFO), Saint et Isles (LYON).
5. Points fragiles des requêtes, à surveiller dans le journal : l'auto-jointure des duels (`ScoreboardPlayers=SP1,ScoreboardPlayers=SP2`, `join_on=SP1.GameRoleIdVs=SP2.GameRoleId`), `COUNT(*)` avec `group_by`, les noms d'équipes historiques, le nom Leaguepedia de LYON (« LYON (2024 American Team) »).

### P1 : le direct

Fait le 23/10 sur MKOI–BLG : forme des réponses, côtés, `startingTime`, début de partie, noms des joueurs (voir section 3). Correctif v8 : l'erreur 400 (téléphone en avance de plus de 30 s) ne bloque plus le direct.

À faire : pendant un match, comparer sur le téléphone les K/D/A et le CS du tableau avec le stream, et regarder Diagnostic, ligne « Flux direct » (kills et « 10 joueurs lus »).

### P1 : la ligue sur deux vrais téléphones

Validé dans 3 navigateurs (voir section 3). À faire : Thomas crée une ligue, un pote la rejoint par le lien et un autre par le code, chacun parie sur un match à venir. Vérifier la notification « X a placé son pari », le ✓ tant que le match n'a pas commencé, et le classement identique après un résultat.

```bash
curl -s "https://ntfy.sh/iagames-worlds26-ligue-<CODE>/json?poll=1&since=all"
```

### P2 : exactitude des données embarquées

Fait le 23/10 :
- Les 95 titulaires embarqués sont tous dans les rosters LoL Esports (`getTeams`) de leur équipe.
- `CHAMPS` : ajout de Zeka (2022) et Tian (2019), qui manquaient. Les autres titres sont justes (T1 champion 2025, 3-2 contre KT, confirmé par l'API).
- Notes d'équipe vérifiées sur les finales de l'API : MSI (HLE 3-2 BLG), LCK (GEN 3-1 HLE), LPL (AL 3-1 BLG), LEC (G2 3-0 MKOI), LCS (TL 3-1 LYON), LCP (TSW 3-0 CFO), CBLOL (LØS 3-2 FURIA), Play-In.
- `piWinner()` reconnaît le vainqueur du Play-In avec les libellés de l'API (le dernier match du Play-In fait foi).
- `EMBED` : horaires de la ronde 1 corrigés (ils étaient dans le désordre).

À faire : les nationalités incertaines (voir P0, tâche 4), et vérifier que les rondes 2 à 5 et les quarts s'affichent bien quand l'API les publie.

### P2 : fluidité et expérience sur Android

Fait le 23/10 avec Playwright (Pixel 7) : tous les onglets et toutes les fiches s'ouvrent, aucune erreur JS sur un parcours complet avec ligue à 3. Le bouton retour ferme les fiches une par une puis ramène à Direct. Défilement de la grille Joueurs avec le CPU divisé par 4 : 24 à 28 i/s. Couper les effets des cartes (reflet, paillettes, rotation dorée) ou la poussière d'or ne change rien de mesurable : sans GPU, Chromium dessine tout en logiciel, la mesure ne dit rien de fiable sur un vrai téléphone.

À faire : sur un vrai téléphone, défilement de Joueurs et de la carte du monde, ouverture et fermeture des fiches, glisser vers le bas, navigateur intégré de Messenger.

---

## 5. Requêtes utiles pour déboguer

Leaguepedia (1 requête par minute au plus en anonyme, sinon la pénalité s'allonge) :

```bash
cq(){ curl -sG "https://lol.fandom.com/api.php" --data-urlencode action=cargoquery --data-urlencode format=json --data-urlencode limit=5 "$@"; echo; }
cq --data-urlencode 'tables=ScoreboardPlayers=SP1,ScoreboardPlayers=SP2' --data-urlencode 'join_on=SP1.GameRoleIdVs=SP2.GameRoleId' \
   --data-urlencode 'fields=SP1.Link=PA,SP2.Link=PB,SP1.PlayerWin=W,SP1.Champion=CA,SP2.Champion=CB' --data-urlencode 'where=SP1.Link="Faker" AND SP2.Link="Chovy"'
cq --data-urlencode 'tables=Teams' --data-urlencode 'fields=Teams.Name=N,Teams.Image=I' --data-urlencode 'where=Teams.Name LIKE "LYON%"'
```

Générateur en local, sur quelques sections seulement (`STATS_MAX_MIN` = budget en minutes) :

```bash
STATS_MAX_MIN=20 python3 tools/build_stats.py noms joueurs tournoi
cat data/stats_log.txt
```

Direct (pendant un match) :

```bash
K='x-api-key: 0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z'
curl -s -H "$K" "https://esports-api.lolesports.com/persisted/gw/getLive?hl=fr-FR"
curl -s -H "$K" "https://esports-api.lolesports.com/persisted/gw/getEventDetails?hl=fr-FR&id=<matchId>"
T=$(date -u -d '-50 sec' +%Y-%m-%dT%H:%M:%S | sed 's/.$/0/').000Z
curl -s "https://feed.lolesports.com/livestats/v1/window/<gameId>?startingTime=$T"
```

---

## 6. Règles pour travailler sur ce projet

- Garde `worlds.html` en un seul fichier. Pas de framework, pas d'étape de build.
- Avant chaque push : `node --check` sur le JS extrait, et si possible un passage Playwright (tous les onglets, aucune erreur de console).
- Ne touche pas aux autres jeux ni à `net.js`, `duo.js`, `lobby.js`, `themes.js`, `styles.css`, sauf demande explicite.
- Ne commite pas `data/stats.json` sur `main` : il vit sur la branche `stats`, écrite par le robot.
- Interface :
  - textes en français, phrases courtes ;
  - typographie : apostrophe ’ et guillemets « » dans le texte affiché, apostrophe droite dans le code ;
  - garde le style hextech, or et bleu nuit.
- Fluidité :
  - pas de `backdrop-filter` sur des éléments répétés ;
  - pas de filtre sur des éléments animés ;
  - animations en `transform` et `opacity` ;
  - canvas en pause hors écran.
- Incrémente `APP_VERSION` à chaque livraison, et écris les messages de commit en français.
- Dis à Thomas de recharger la page après chaque mise en ligne. GitHub Pages met environ 1 minute à publier.

---

## 7. Sécurité

- L'ancien Claude utilisait un token GitHub nommé `claude-worlds`, visible dans une conversation. Thomas doit le supprimer sur github.com/settings/personal-access-tokens s'il ne l'a pas déjà fait.
- Le mot de passe de robot Leaguepedia ne va que dans les secrets GitHub (`LP_USER`, `LP_PASS`), jamais dans le code ni dans une conversation.
- La clé `x-api-key` LoL Esports est la clé publique du site lolesports.com, pas un secret.
