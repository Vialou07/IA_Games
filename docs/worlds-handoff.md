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
- Version actuelle : `APP_VERSION = "v9.3, 24/10/2026"` dans le bloc diagnostic (à incrémenter à chaque livraison).
- Autres fichiers de l'appli :
  - `tools/build_stats.py` : le générateur de stats côté serveur (le « robot »), 100 % API officielle LoL Esports ;
  - `.github/workflows/stats.yml` : le workflow GitHub Actions qui le lance toutes les 30 minutes ;
  - `data/teams.json` : le référentiel des 19 équipes (avec leur ligue) et 95 joueurs, utilisé par le robot ;
  - branche `stats` : `data/stats.json` (lu par l'appli sur `raw.githubusercontent.com/Vialou07/IA_Games/stats/data/stats.json`) et `data/cache.json.gz` (la mémoire du robot : planning, détails des matchs, résumé de chaque partie). Un seul commit, réécrit par le robot. Ces deux fichiers sont ignorés sur `main` ;
  - branche `stats-preprod` : la même chose quand le workflow est lancé à la main depuis une autre branche que `main`. Sert à tester un nouveau robot sans toucher à l'appli.

### Fonctions de l'appli

Six onglets : Direct, Matchs, Suisse, Stats, Équipes, Joueurs.

- **Direct** : match à venir en grand (compte à rebours, faisceau animé), mini-score en direct, matchs de la soirée, pronos, équipe favorite, chiffres du tournoi, ligue de paris.
- **Fiche match** :
  - le face-à-face poste par poste ;
  - le pari (vainqueur, puis score exact en Bo3 et Bo5) ;
  - les paris de la ligue, cachés jusqu'au coup d'envoi ;
  - le direct : kills, or, objectifs, courbe d'or, 10 joueurs, chances de victoire estimées, analyse de draft ;
  - la feuille de match de chaque partie terminée (`matchGames`, `renderGames`) : vainqueur, durée, objectifs, champion, K/D/A, CS et part des dégâts des 10 joueurs, lue dans le flux officiel par le téléphone, avec la même déduction du vainqueur que le robot ;
  - l'historique des confrontations, les duels de lane en carrière, la forme et la saison 2026 comparée.
- **Fiche joueur** : carte holographique, saison 2026 avec le rang au poste parmi les 95 titulaires (KDA, CS/min, or/min, part des dégâts, participation aux kills, écarts d’or et de CS à 15 min, balises), Worlds depuis 2024, prochain duel, bouton « Comparer ».
- **Comparaison** (`compareSheet`, fiche `c`) : deux joueurs côte à côte (saison 2026, champions, duels directs depuis 2024). On y arrive par la fiche joueur, le prochain duel ou en touchant une ligne de duel de lane dans une fiche match. Changer d’adversaire ne crée pas d’entrée d’historique.
- **Fiche équipe** : saison 2026, 10 dernières séries, bilan contre les équipes des Worlds.
- **Suisse** : arbre 0-0 à 3-x, avec le parcours de l'équipe favorite tracé en doré.
- **Joueurs** : grille de cartes, filtres par poste, nationalité et champions du monde, carte du monde des nationalités (d3 et world-atlas, chargés à la demande). Puce « Classement 2026 » : classement des titulaires par stat et par poste (`rankHTML`, 10 parties minimum).
- **Mes paris** (accueil) : « À parier » avec un bouton par équipe (pari en un geste), « En attente du résultat », « Derniers résultats ». Chaque ligne de match montre le logo de l’équipe pariée (or, vert si gagné, rouge si perdu) ou un rond en pointillés s’il reste à parier. Badge sur l’onglet Direct : matchs des prochaines 24 h pas encore pariés.
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
   - `cq` : file d'attente Leaguepedia, 2,5 s entre requêtes, pause qui double à chaque limite (`lpPause`, 1 à 10 min). Secours seulement : ne sert que si le robot n'a encore rien publié ;
   - `ablock` : blocs asynchrones, mis en cache dans localStorage, chargés quand ils arrivent à l'écran (IntersectionObserver) ;
   - `loadSJ` : lit les stats du robot (branche `stats`). Format 2 (`SJ.v === 2`, source LoL Esports, données depuis `SJ.since`) : duels et maîtrise indexés par `norm(pseudo)`, photos, logos et vrais noms dans `pinfo` et `logos`. Dès qu'une section existe, l'appli ne va plus sur Leaguepedia ;
   - les agrégats `teamSeason`, `h2h`, `laneDuels`, `playerStats`, `tourneyStats`, et leurs rendus ;
   - stats 2026 par joueur : `PSTAT` (définition des stats), `seasonOf`, `ranking`, `rankOf`, `season2Tiles`, `rankHTML`, `compareSheet`.
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

## 2 bis. Ajouts du 24/10 (v10 → v12)

**Robot (`tools/`)** : `build_stats.py` remplit `FLAT` (toutes les parties à plat, côtés et vainqueurs corrigés) puis appelle des blocs indépendants. Chaque bloc est facultatif : une erreur est notée dans le journal, l'appli s'en passe.
- `model_e.py`, `model_extras.py`, `lane_model.py`, `worlds_sim.py`, `model_c.py` : note d'impact par joueur corrigée de l'adversité et des ligues (`m`, incertitudes par 200 rééchantillonnages une fois par jour), phase de lane (`lane`), simulation des Worlds (`sim`), pronos figés au coup d'envoi et bilan du robot (`fiab`), bilan brut des ligues (`lgr`).
- `rank_block.py` : classements par poste avec le pourquoi, « spécial Worlds », qui va gagner (`rk`).
- `prematch.py` : clés des matchs à venir, seulement les faits testés, avec leur taux mesuré (`pm`). Le rapport du test (la règle top-jungle-mid, la forme, la draft…) est résumé dans l'appli derrière le « i ».
- `facts_block.py` : faits « Le saviez-vous ? » (`fx`), publiés après 2 passages identiques.
- `fiche_block.py` → `data/fiche.json` (rencontres détaillées entre titulaires, vis-à-vis, champions, forme, profil) ; `draft_block.py` + `draft_seed.json` → `data/draft.json` (bans et ordre des picks lus sur gol.gg, méta, picks et bans probables, matchups). Ces deux fichiers sont lus par l'appli à la demande (`loadAux`).
- Flux : requêtes gzip, début de partie et pauses à l'image près, dragons et âme, niveaux, or et CS à 15:00 exacts, courbe d'or, premiers objectifs ; rattrapage des parties déjà en mémoire par tranches de `STATS_FLUX_MIN` minutes (clé `fl`).
- `sched` : planning des Worlds vu par le robot, secours de l'appli quand l'API ne répond pas au téléphone.
- État persistant : `data/model_state.json` (publié avec les stats).

**Appli** : avant-match (clés, une ligne par poste, duel détaillé daté), direct (fil du match, draft avant/après, fearless entre deux manches), classements par poste avec le pourquoi, spécial Worlds, qui va gagner, fiche joueur « En bref » (âge et Worlds : constante `BIO`, Liquipedia et Leaguepedia croisés), vrais bans dans Stats › Champions, sursis avant l'élimination, « Revoir en VF », fluidité (seul l'onglet visible est dessiné tout de suite, animations hors écran en pause).

**Après-midi du 24/10 (v12.1 → v12.8)** :
- L'appli s'adapte au moment (`homeMoment`) : le matin, le bilan de la veille ; avant un match, ton prono et la clé du match en haut ; en direct, les paris de la ligue ; les jours sans match, « qui va gagner » et les classements.
- Paris refusés après le coup d'envoi même fiche ouverte ; un match en retard reste « à venir » tant que l'API ne l'a pas lancé.
- « Emporte ton profil » : chaque navigateur a sa propre mémoire (Messenger, Chrome, icône d'écran d'accueil). Le lien `…#moi=…` transporte ligue, paris et favori avec le même identifiant de joueur (pas de doublon dans la ligue).
- Le robot joue dans la ligue (sur chaque téléphone, rien n'est envoyé) : pronos figés avant le match (`fiab`), comptés seulement sur les matchs pariés par la ligue.
- Fiches équipe et joueur : début de partie (premier sang, tours, dragons, âmes ; part des kills avant 15 min) depuis la clé `fl`.
- **Robot en chaîne** : GitHub n'a lancé aucun passage programmé du 24/10 06:26 au soir. La dernière étape du workflow attend 8 min puis relance le robot (`gh workflow run`, branche main seulement, jusqu'au 16/11). Les créneaux programmés restent en secours. Pour arrêter la chaîne : désactiver le workflow dans l'onglet Actions ou retirer cette étape.

**Soirée du 24/10 (v12.9 → v13.4)** :
- Rang au poste partout (`rankTag`, bandeau `.rkbig` de la fiche joueur : place fixe, la fourchette en petit), probabilité de lane par poste (fiabilité réelle dans le « i » : 56 % aux internationaux).
- Relecture complète (495 corrections, typographie française : U+00A0 avant « : », U+202F avant « % ; ? ! ») ; textes du robot aussi. Faits vérifiés un à un sur gol.gg : la portée des records est « parmi les joueurs/équipes des Worlds », et « compétitions suivies » quand l'API n'a pas tout (qualifs EWC, KeSPA 2025, académies).
- Ordre des équipes figé d'une synchro à l'autre (`keepSides`) : l'API le permute parfois.
- Direct : blocs `l2*` (le match bascule ?, fights, duels en direct, joueur du match, tableau du match), records en vue (`fun*`), draft réelle contre pronos (`d2*`, clé `gm` de draft.json, pronos de draft figés au coup d'envoi dans model_state), « Plus jouables dans cette série » (fearless vérifié sur 1 989 séries), HUD de partie et mini-HUD collé (`hud*`).
- Podium de la soirée et badges de la ligue (Flair, Bat le robot, Audacieux, Devin, Série) ; clé `fu` (tools/fun_block.py).
- Motion design (`/* >>> motion */`) : une seule fois par apparition, rien si animations réduites.
- Passe du gardien UX (`ux*`, grille de règles dans le dossier de travail) : écrans 12 à 15 % plus courts, pas de défilement horizontal, zones tactiles ≥ 40 px.
- Reste à faire : réorganiser le reste du direct sous le HUD et fusionner le « Tableau du match » avec la liste des joueurs (la boîte du direct fait encore ~2 écrans à 25 min).

**25/10 : v14.0, refonte B en prod** (design arrondi, widgets à l'accueil, fiches à onglets, navigation en profondeur) :
- `worlds.html` est désormais **généré** : sources dans `refonte/` (`src/` par écran, `build.js`, plan dans `ARCHI.md`, inventaire de la v13.5 dans `INVENTAIRE.md`). `cd refonte && node build.js` → `refonte/dist/worlds-b.html`, puis copier vers `worlds.html` en remplaçant `APP_VERSION` (la source dit encore « v14.0-b … (préprod) »). Le rebuild redonne la prod à l'octet près.
- `src/legacy.js` est réécrit à chaque build à partir de `refonte/ref/worlds_v13_5.html` (figée) : ne pas le modifier à la main.
- Mêmes clés `w26_` et même canal ntfy que la v13.5 : profils, paris et ligues repris tels quels (vérifié : reprise identique, ligue mixte v13.5 + v14 identique).
- `tools/preprod.py` marche toujours (remplace aussi `w26_mv_lb_`). Tests de la refonte : `refonte/test/` (smoke.js, qa_reprise.js, qa_ligue.js, qa_live.js, qa_tour.js).
- Reste à faire : appli installable (PWA : le manifeste est prêt mais pas activé, car sur iPhone l'appli installée ne voit pas les données de Safari ; prévoir la reprise du profil au premier lancement), notifications Web Push, fights des parties terminées côté robot, pastille « Mes paris » (« 4 ce soir ») à clarifier (`refonte/DEMANDES.md`).

**Tests** (dossier de travail, Playwright en émulation Pixel 7) : parcours complet avec ligue à 3 téléphones, écrans clés avec données locales interceptées, direct rejoué sur de vraies parties. Toujours : préprod, tests, puis prod ; `node --check` sur le script extrait ; monter `APP_VERSION`.

## 3. Sources externes et ce qui est vérifié

| Source | Usage | État réel (vérifié le 23/10/2026) |
|---|---|---|
| `esports-api.lolesports.com/persisted/gw/` (`getSchedule`, `getLive`, `getEventDetails`, `getTeams`), en-tête `x-api-key: 0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z`, ligue Worlds `98767975604431411` | planning, résultats, matchs en cours | **Marche.** Libellés en français : Play-In = « Play-ins » (tous les matchs), puis « Système suisse », « Quarts de finale », « Demi-finales », « Finale ». Côtés dans `games[].teams[].side`. `getLive` renvoie toutes les ligues : l'appli filtre en reconnaissant les deux équipes. Depuis un PC, la connexion est parfois coupée (1 essai sur 2) : réessayer |
| `feed.lolesports.com/livestats/v1/window/{gameId}?startingTime=…` (ISO arrondi à 10 s) | kills, or, objectifs, stats des 10 joueurs | **Vérifié sur MKOI–BLG.** Stats joueurs dans `blueTeam.participants` et `redTeam.participants` ; K/D/A et CS identiques à `livestats/v1/details`. Sans `startingTime` : début de partie (or à 0 au chargement, 2 500 par équipe à 0:00), l'horloge est juste à ~10 s près. La fenêtre doit finir plus de 20 s avant l'heure du serveur, sinon erreur 400 : l'appli essaie 50 s, puis 90 s, puis 180 s. Noms du flux du type « MKOI Myrwn », bien rapprochés du roster |
| `esports-api…/getSchedule`, `getEventDetails`, `getTeams`, et `feed…/window` et `details` sur les parties terminées | tout le robot de stats | **Vérifié le 23/10.** Le planning de chaque ligue remonte à janvier 2024 (LPL comprise : `getCompletedEvents` ne la liste presque pas, il faut passer par `getSchedule`). Le flux garde les parties terminées : `window` sans `startingTime` = début, à début + 6 h = image finale, `details` = part des dégâts, participation aux kills, balises. Aucune limite rencontrée à 8 requêtes en parallèle. Les identifiants `esportsPlayerId` du flux sont ceux de `getTeams`. L'API ne donne pas le vainqueur de chaque partie (voir section 4). Pas de bans dans le flux |
| Leaguepedia Cargo `lol.fandom.com/api.php?action=cargoquery` | secours seulement | **Limité à environ 1 requête par minute et par adresse IP en anonyme**, bloqué depuis les téléphones (« Failed to fetch »). Abandonné par le robot le 23/10 |
| `lol.fandom.com/wiki/Special:FilePath/…` | logos et photos Leaguepedia | **Peu fiable** : la redirection renvoie parfois une page 403, que Chrome bloque (ERR_BLOCKED_BY_ORB). L'appli passe alors aux logos et photos LoL Esports (cascade `imgTag`), rien ne casse |
| `ntfy.sh` (topic `iagames-worlds26-ligue-<CODE>`) | ligue de paris | **Vérifié avec 3 navigateurs sur le vrai ntfy.sh** (création, lien, code, notification de pari, pari caché, classements identiques). Pas encore avec de vrais téléphones. ntfy.sh ne garde les messages que 12 h : un nouveau venu ne voit que les membres actifs depuis 12 h, les anciens membres gardent tout en local |
| Data Dragon, flagcdn | icônes de champions, drapeaux | OK |
| `wsrv.nl` (redimensionneur d'images public, Cloudflare) | vignettes des photos et logos LoL Esports | Les PNG LoL Esports pèsent 400 à 600 Ko ; via `thumb()`, ~15 Ko en WebP, mis en cache un an. L'original reste en secours dans `imgTag` si wsrv.nl ne répond pas |

---

## 4. Tâches, par priorité

### P0 : le robot de stats

Fait les 23 et 24/10 :
- Leaguepedia abandonné (1 requête par minute, bloqué sur les téléphones). Le robot prend tout chez LoL Esports : planning de 15 ligues depuis janvier 2024, détails de chaque match terminé, puis pour chaque partie le flux au début, à 15 min, à la fin, et les détails de fin.
- Vainqueur de chaque partie : l'API ne le donne pas. Le robot le déduit de l'image finale (seule l'équipe qui a détruit un inhibiteur peut finir, puis tours et or) sous la contrainte du score de la série (`winners`). La règle seule était juste sur 202 parties sur 204 au vainqueur certain ; la contrainte de série corrige le reste.
- Parties au flux arrêté sans l'état « finished » : gardées si elles durent au moins 20 min (complètes dans 53 cas sur 54 vérifiés), exclues sinon. Parties sans flux (1,5 %) : réessayées à chaque passage pendant 2 jours, puis 3 fois, une par jour.
- Robot v3 (24/10), après un audit à 9 agents qui a comparé chaque partie 2026 des 95 titulaires à gol.gg :
  - EWC 2026 (`ewc_lol`, équipes sous un autre identifiant reconnues par leurs titulaires) et KeSPA Cup 2026 (`kespa_cup`, séries d'académie écartées) ;
  - `fix_sides()` : 13 flux LPL aux côtés ou identifiants inversés corrigés en mémoire ; poids réduit des flux coupés dans `winners()` ; vainqueurs justes sur 6 501 parties vérifiées ;
  - identifiants de joueurs absents ou faux rattrapés par le pseudo (`ident()`) ;
  - temps de jeu réel (`timing()`) : début recalé après une attente (l'or dépasse 5 000 de 40 à 64 s après 0:00), pauses retirées (le flux marque « paused » ou renvoie des images périmées) ; image de la 15e minute prise en temps de jeu. Mesuré : 1 à 20 s d'écart avec gol.gg au lieu de jusqu'à 18 min ;
  - participation aux kills en moyenne par partie (`kps`, `kpn`), kills d'équipe recomptés sur les joueurs ;
  - vrai dernier duel (dernière manche) et 5 dernières rencontres de chaque paire (`dr`) ;
  - écart à 15 min ignoré si l'or total à 15:00 sort de 40 000 à 62 000 ; partie reprise après coupure écartée (or/min > 5 500).
  - Résultat sur les 95 titulaires, écart moyen à gol.gg : CS/min 0,05, or/min 2,4, participation aux kills 0,5 point, KDA 0,08. Couverture 91 % des parties gol.gg (le reste : qualifs EWC et KeSPA Cup 2025, absentes de l'API).
- Préprod : `python3 tools/preprod.py` fabrique `preprod/worlds.html` (stats de `stats-preprod`, données du téléphone et canal de ligue séparés, bandeau PRÉPROD), à publier sur main. Robot de préprod : pousser une branche puis `gh workflow run stats.yml --ref <branche>`. Adresse : https://vialou07.github.io/IA_Games/preprod/worlds.html
- Premier chargement complet en préprod : 8 509 parties (2024 : 2 673, 2025 : 2 936, 2026 : 2 773), 30 496 requêtes, 21 minutes. Passage suivant : 8 secondes. Stats 2026 pour les 95 titulaires, 710 duels de lane, 73 face-à-face d'équipes.
- Publication sur la branche `stats` (stats + mémoire), seulement si quelque chose a changé.

À faire :
1. Surveiller les premiers passages : `gh run list --workflow stats.yml`, puis `gh run view <id> --log`. Lignes à regarder : `parties à résumer`, `écrit … {'games': …, 'left': …, 'cover': …}`. `left` doit revenir à 0 au passage suivant un match.
2. Contrôler à la main quelques chiffres sur un site de stats (gol.gg par exemple) : bilan 2026 de GEN, KDA 2026 de Faker, écart d'or à 15 min de Chovy. Écarts de quelques pour cent normaux (parties coupées exclues, horloge à ~10 s près).
3. Nationalités embarquées à confirmer (LoL Esports ne les donne pas) : Zhuo (TES), JiaQi (IG), Ackerman (LØS), Bie (TSW), Kino et POUT (CFO), Saint et Isles (LYON).
4. Si une nouvelle équipe ou un remplaçant apparaît : mettre à jour `data/teams.json` et `TEAMS` dans `worlds.html`. Le journal du robot signale « joueur introuvable chez LoL Esports ».

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

Robot en local (`STATS_MAX_MIN` = budget en minutes). Il reprend sa mémoire `data/cache.json.gz` si elle est là ; sans elle, le premier passage charge tout depuis 2024 (environ une heure). Depuis le PC de Thomas, la connexion vers l'API LoL Esports coupe souvent : préférer la préprod GitHub.

```bash
STATS_MAX_MIN=20 python3 tools/build_stats.py
cat data/stats_log.txt
```

Préprod : pousser une branche, puis la lancer et récupérer son résultat :

```bash
gh workflow run stats.yml --ref <branche>
gh run list --workflow stats.yml
curl -s https://raw.githubusercontent.com/Vialou07/IA_Games/stats-preprod/data/stats.json -o /tmp/stats.json
```

Une partie terminée dans le flux :

```bash
curl -s "https://feed.lolesports.com/livestats/v1/window/<gameId>"                       # début
curl -s "https://feed.lolesports.com/livestats/v1/window/<gameId>?startingTime=<début + 6 h>"   # image finale
curl -s "https://feed.lolesports.com/livestats/v1/details/<gameId>?startingTime=<début + 6 h>"  # part des dégâts, balises
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
- Ne commite pas `data/stats.json` ni `data/cache.json.gz` sur `main` : ils vivent sur la branche `stats`, écrite par le robot.
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
- La clé `x-api-key` LoL Esports est la clé publique du site lolesports.com, pas un secret. Le robot n'a besoin d'aucun secret.
