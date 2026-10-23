# Passation : appli Worlds 2026 (IA_Games)

## 1. Prompt à coller dans Claude Code

> Lis `docs/worlds-handoff.md` en entier avant de toucher à quoi que ce soit. C'est la passation de l'appli `worlds.html` de mon hub IA_Games. Commence par la tâche P0 (activer le robot de stats et vérifier ses résultats sur les vraies données), puis enchaîne les tâches P1 et P2 dans l'ordre. Pour chaque tâche : vérifie sur les vraies sources (tu as Internet, pas l'ancien Claude), montre-moi la preuve (sortie de commande, extrait de données), et ne dis « c'est bon » qu'après l'avoir constaté. Ne casse rien dans les autres jeux du hub. Parle-moi en français, court et concret, et guide-moi étape par étape quand tu as besoin de moi (téléphone, GitHub).

Pour lancer Claude Code au bon endroit :

```bash
git clone https://github.com/Vialou07/IA_Games.git
cd IA_Games
claude
```

---

## 2. Le projet en bref

- Dépôt : `Vialou07/IA_Games`, publié par GitHub Pages sur https://vialou07.github.io/IA_Games/
- L'appli : `worlds.html`, un seul fichier HTML (CSS et JS inclus), lien direct https://vialou07.github.io/IA_Games/worlds.html. Elle a une tuile « Worlds 2026 » en tête de `index.html` (le hub).
- Utilisateurs : Thomas et un groupe de potes, sur Android (Chrome et navigateur intégré de Messenger), souvent en 5G.
- Version actuelle : `APP_VERSION = "v6, 24/10/2026"` dans le bloc diagnostic (à incrémenter à chaque livraison).
- Autres fichiers ajoutés pour l'appli :
  - `tools/build_stats.py` : le générateur de stats côté serveur.
  - `data/teams.json` : le référentiel des 19 équipes et 95 joueurs, utilisé par le générateur.
  - `tools/stats-workflow.yml` : le modèle du workflow GitHub Actions, à déplacer (tâche P0).

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

1. **Données** : `ROLES`, `TEAMS` (rosters, nationalités, couleurs, notes), `VENUES`, `STAGES`, `EMBED` (matchs de secours au 23/10 : Play-In joués et ronde 1 suisse), `DAYS` (jours sans affiche connue).
2. **Utilitaires** :
   - `norm`, `esc`, `T` (équipes par id), `PLAYERS`, `CHAMPS` (titres mondiaux par joueur), `imgTag` et `imgFail` (cascade d'images) ;
   - `logo`, `photo`, `dayKeyL` (journée décalée de 6 h : un match à 2 h compte pour la veille) ;
   - `mkey` (clé de match stable : équipes plus phase, plus la date seulement en Play-In), `migrateKey`, `finalize`, `records`, `status`.
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
   - `cq` : file d'attente Leaguepedia, 2,5 s entre requêtes, pause de 60 s en cas de limite (`lpPause`) ;
   - `ablock` : blocs asynchrones, mis en cache dans localStorage, chargés quand ils arrivent à l'écran (IntersectionObserver) ;
   - `loadSJ` : lit `data/stats.json` (raw.githubusercontent d'abord, puis même origine). Ce fichier est prioritaire sur les requêtes en direct ;
   - les agrégats `teamSeason`, `h2h`, `laneDuels`, `playerStats`, `tourneyStats`, et leurs rendus.
8. **Ligue** : `lg` dans localStorage (`w26_league`), `publish` et `duelConnect` (SSE ntfy avec repli sur interrogation régulière), `standings`, `duelHome`, `duelMatchHTML`. Les fonctions s'appellent encore « duel… » pour l'historique.
9. **Direct** : `liveTick`, `watchLive`, `winProb` (modèle maison), `computeDraft`, `liveBoxHTML`, `heroLiveHTML`.
10. **Sources en direct** :
    - `leFetch` : API LoL Esports ;
    - `fromLolEsports`, puis `fromLeaguepedia`, puis `EMBED` en dernier recours ;
    - `cargo`, `enrichPlayers` (photos, vrais noms, nationalités depuis Leaguepedia), `enrichPhotosLE`, `enrichPhotosWiki`, `sync`.
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

| Source | Usage | État réel |
|---|---|---|
| `esports-api.lolesports.com/persisted/gw/` (`getSchedule`, `getLive`, `getEventDetails`, `getTeams`), en-tête `x-api-key: 0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z`, ligue Worlds `98767975604431411` | planning, résultats, matchs en cours | **Marche** depuis les téléphones (la pastille affiche l'heure de synchro sur les captures) |
| `feed.lolesports.com/livestats/v1/window/{gameId}?startingTime=…` (ISO arrondi à 10 s) | kills, or, objectifs, stats des 10 joueurs | **Jamais vérifié en vrai.** Correctif v6 : les stats joueurs sont dans `blueTeam.participants` et `redTeam.participants`, pas à la racine. L'horloge de partie est estimée depuis la 1re frame, ou depuis l'or si elle n'est pas fiable |
| Leaguepedia Cargo `lol.fandom.com/api.php?action=cargoquery` | photos, nationalités, toutes les stats | **Bloqué depuis les téléphones** (« You've exceeded your rate limit », captures du 23/10). Les photos passent, les stats non. Noms de champs validés sur le schéma du paquet npm `poro` |
| `ntfy.sh` (topic `iagames-worlds26-ligue-<CODE>`) | ligue de paris | **Jamais vérifié avec de vrais téléphones**, seulement sur une simulation à 3 joueurs |
| Data Dragon, flagcdn, `lol.fandom.com/wiki/Special:FilePath/…` | icônes de champions, drapeaux, logos, photos | Photos et drapeaux OK sur les captures |

L'ancien Claude n'avait pas accès à Internet pour ces domaines. Tout ce qui est marqué « jamais vérifié » a seulement été testé sur des réponses simulées (jsdom). Toi, tu peux les interroger directement.

---

## 4. Tâches, par priorité

### P0 : activer le robot de stats et vérifier ses données

But : plus aucune requête Leaguepedia depuis les téléphones. Le robot calcule tout côté serveur toutes les 20 minutes et écrit `data/stats.json`.

1. Teste d'abord le générateur en local. Il dure environ 5 min et fait à peu près 90 requêtes espacées de 2,5 s :
   ```bash
   python3 tools/build_stats.py
   cat data/stats_log.txt
   python3 -c "import json;d=json.load(open('data/stats.json'));print(d['meta'],d['errors'])"
   ```
   Il faut que `errors` soit vide et que les compteurs soient plausibles :
   - environ 19 équipes, 95 joueurs ;
   - plusieurs dizaines de paires dans `h2h` ;
   - plusieurs centaines de clés dans `duels`.
2. Si une requête casse, isole-la avec curl (voir section 5). Points fragiles à surveiller :
   - l'alias de table dans une auto-jointure (`ScoreboardPlayers=SP1,ScoreboardPlayers=SP2` avec `join_on=SP1.GameRoleIdVs=SP2.GameRoleId`) ;
   - `COUNT(*)=N` avec `group_by` ;
   - les `IN (...)` sur les 95 joueurs (longueur d'URL) ;
   - les noms d'équipes historiques (DWG KIA, MAD Lions KOI…) ;
   - le nom Leaguepedia de LYON, supposé être « LYON (2024 American Team) », à vérifier.
3. Contrôle un échantillon à la main contre les pages Leaguepedia : le bilan T1 contre Gen.G, les stats 2026 de Faker, un duel de lane connu. Il faut que ce soit cohérent.
4. Active le workflow : `git mv tools/stats-workflow.yml .github/workflows/stats.yml`, commit, push. Il se lance au push. Suis-le avec `gh run watch` si `gh` est installé, sinon dans l'onglet Actions.
5. Vérifie que `data/stats.json` est commité par le robot. Dans l'appli, Diagnostic, la ligne « Stats précalculées » doit être OK. Ouvre une fiche match : aucun bloc ne doit afficher « Leaguepedia limite les requêtes ».
6. Le robot ne réécrit le fichier que si les données ont changé. Vérifie que ça ne crée pas un commit toutes les 20 minutes sans raison.

### P1 : vérifier le direct sur un vrai match

Les matchs ont lieu le soir, heure de Paris. Pendant un match :

```bash
K='x-api-key: 0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z'
curl -s -H "$K" "https://esports-api.lolesports.com/persisted/gw/getLive?hl=fr-FR" | jq '.data.schedule.events[] | {id:.match.id, teams:[.match.teams[].code]}'
curl -s -H "$K" "https://esports-api.lolesports.com/persisted/gw/getEventDetails?hl=fr-FR&id=<matchId>" | jq '.data.event.match.games'
T=$(date -u -d '-50 sec' +%Y-%m-%dT%H:%M:%S | sed 's/.$/0/').000Z
curl -s "https://feed.lolesports.com/livestats/v1/window/<gameId>?startingTime=$T" | jq '.frames[-1] | {k:[.blueTeam.totalKills,.redTeam.totalKills], p:.blueTeam.participants[0]}'
```

À vérifier, et à corriger si besoin :
- La forme exacte des réponses : `getLive` est-il bien filtré sur les Worlds ? Les côtés bleu et rouge sont-ils bien dans `games[].teams[].side` ?
- Le décalage de `startingTime` : il est de 50 s, avec un second essai à 90 s. Trouve la valeur qui renvoie toujours une frame récente.
- L'appel à `window/{gameId}` sans `startingTime` renvoie-t-il le début de la partie ? L'horloge de partie et la courbe d'or en dépendent.
- Les K/D/A et le CS du tableau correspondent-ils au stream ?
- Le nom des joueurs du flux, du type « DK ShowMaker », est-il bien rapproché du roster (`playerFromSummoner`) ?
- Dans l'appli : Diagnostic, la ligne « Flux direct » doit afficher les kills et « 10 joueurs lus ».

### P1 : vérifier la ligue sur deux vrais téléphones

Thomas crée une ligue, un pote la rejoint par le lien et un autre par le code. Chacun parie sur un match à venir. Vérifie :
- la notification « X a placé son pari » ;
- le 🔒 tant que le match n'a pas commencé ;
- le classement identique sur les deux téléphones après un résultat.

Côté terminal, tu peux suivre le topic :

```bash
curl -s "https://ntfy.sh/iagames-worlds26-ligue-<CODE>/json?poll=1&since=all"
```

### P2 : exactitude des données embarquées

- **Rosters et nationalités à confirmer** (source principale : theclick.gg et Leaguepedia au 20/10) :
  - nationalités incertaines : Zhuo (TES), JiaQi (IG), Ackerman (LØS), Bie (TSW), Kino et POUT (CFO), Saint et Isles (LYON) ;
  - Leaguepedia écrase les nationalités à l'exécution quand la requête des joueurs passe, mais le secours embarqué doit être juste.
- **Liste `CHAMPS` des titres mondiaux** à revérifier, notamment Gumayusi, Doran et Oner en 2025.
- **Phase suisse** : les tirages des rondes 2 à 5 et les quarts viennent de LoL Esports. Vérifie que les rondes s'affichent bien quand l'API les publie, et que `piWinner()` reconnaît le vainqueur du Play-In avec les libellés de l'API (`blockName`).
- **Notes d'équipe** (`TEAMS[].note`) : des faits courts, à vérifier.

### P2 : fluidité et expérience sur Android

- Teste sur un vrai téléphone, ou avec Playwright en émulation Pixel et en limitant le CPU :
  - un défilement fluide sur Joueurs (95 cartes) et sur la carte du monde ;
  - pas de saccade à l'ouverture et à la fermeture des fiches.
- **Navigation** :
  - le bouton retour Android ferme les fiches une par une, puis ramène à l'onglet Direct ;
  - glisser vers le bas ferme la fiche ;
  - le navigateur intégré de Messenger doit marcher aussi.
- Aucune erreur dans la console sur un parcours complet : tous les onglets, toutes les fiches, créer et rejoindre une ligue, parier.

---

## 5. Requêtes Leaguepedia utiles pour déboguer

```bash
cq(){ curl -sG "https://lol.fandom.com/api.php" --data-urlencode action=cargoquery --data-urlencode format=json --data-urlencode limit=5 "$@" | jq; }
cq --data-urlencode 'tables=ScoreboardPlayers=SP1,ScoreboardPlayers=SP2' --data-urlencode 'join_on=SP1.GameRoleIdVs=SP2.GameRoleId' \
   --data-urlencode 'fields=SP1.Link=PA,SP2.Link=PB,SP1.PlayerWin=W,SP1.Champion=CA,SP2.Champion=CB' --data-urlencode 'where=SP1.Link="Faker" AND SP2.Link="Chovy"'
cq --data-urlencode 'tables=ScoreboardPlayers' --data-urlencode 'group_by=ScoreboardPlayers.Champion' \
   --data-urlencode 'fields=ScoreboardPlayers.Champion=C,COUNT(*)=N' --data-urlencode 'where=ScoreboardPlayers.DateTime_UTC >= "2026-01-01"'
cq --data-urlencode 'tables=Teams' --data-urlencode 'fields=Teams.Name=N,Teams.Image=I' --data-urlencode 'where=Teams.Name LIKE "LYON%"'
```

Reste à 1 requête toutes les 2 à 3 secondes, sinon Leaguepedia limite aussi ta machine.

---

## 6. Règles pour travailler sur ce projet

- Garde `worlds.html` en un seul fichier. Pas de framework, pas d'étape de build.
- Avant chaque push : `node --check` sur le JS extrait, et si possible un passage Playwright (tous les onglets, aucune erreur de console).
- Ne touche pas aux autres jeux ni à `net.js`, `duo.js`, `lobby.js`, `themes.js`, `styles.css`, sauf demande explicite.
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

L'ancien Claude utilisait un token GitHub nommé `claude-worlds`, visible dans une conversation. Thomas doit le supprimer sur github.com/settings/personal-access-tokens. Toi, tu utilises le git local de Thomas, qui a déjà tous les droits, y compris sur les workflows.
