# Inventaire exhaustif de Worlds 2026 v13.5 et place de chaque élément dans la refonte B

Source : lecture complète de `ref/worlds_v13_5.html` (5 555 lignes, copie figée de la prod du 24/10, `APP_VERSION` « v13.5, 24/10/2026 ») et parcours de la prod avec Playwright le 25/10 à 01 h (T1-DK en direct, TL-BLG à venir ; plan des titres et captures : `test/inv/plan.json`, `test/inv/*.png`, script `test/inventaire_prod.js`). Numéros de ligne = référence figée. Architecture, routes et API : `ARCHI.md` (§ 7 pour la carte cible).

**Légende.** Cible : `écran › onglet › niveau` avec N1 = visible sans toucher sur l'écran, N2 = un toucher (ligne qui se déplie, écran suivant), N3 = derrière `i` (feuille). Écrans : Accueil, `set` (réglages et état), `eve` (bilan d'une soirée), Match `m/` (onglets selon l'état), Duel `d/`, Comparaison `cmp/`, Joueur `p/`, Joueurs `pl`, Classement `rk/`, Spécial Worlds `spe`, Équipes `teams`, Équipe `t/`, Suisse `sui`, Qui va gagner `sim`, Calendrier `cal`, Stats `st`, Faits `fx/`, Mes paris `bets`, Ligue `lg`. Module : socle (shell + home), match, joueurs (players), suisse (swiss + team), stats, ligue (league). Critère : vérification Playwright ou manuelle, sur 390×664 sauf mention.

Règles transverses applicables à **chaque** ligne (non répétées) : rendu au style de B (`.blk`, rayons 20-28 px, or, sarcelle) ; réponse en N1, détail en N2, méthode en N3 ; aucun défilement horizontal ; cibles ≥ 40 px ; typographie française ; pas d'emoji décoratif (les 🏆 🎯 🔥 🦊 📊 ✅ ❌ 🔒 🤖 de v13.5 deviennent des icônes SVG ou des mots) ; `prefers-reduced-motion` respecté ; zéro erreur JS.

---

## 0. Ce qui existe déjà dans la refonte (repris de la maquette B)

Accueil en widgets selon le moment ; match à venir (Aperçu : robot + bilan du robot aux Worlds, ton prono, 3 clés + « autres clés » ; Joueurs : 5 duels par poste ; Draft : bans attendus avec raisons, picks probables par poste et croisement des picks ; Stats : 9 lignes face à face) ; match en direct (HUD dans la tête, onglets Joueurs, Fil avec courbe d'or, Draft avec duels de champions, Avant) ; match terminé (Résumé : robot vu juste ou surprise, pastilles par partie, courbe, premiers objectifs, joueur de la partie ; Parties ; Joueurs ; Draft réelle) ; fiche joueur (carte holo, rang, Saison, Duels, Champions) ; duel A contre B ; classement par poste (podium + grille) ; qui va gagner ; mes paris (à parier, en attente, bilan + toi contre le robot) ; calendrier (à venir, résultats) ; faits. Tout ce qui suit dit ce qu'il faut garder, compléter ou ajouter.

---

## 1. Socle : structure, navigation, effets (module socle)

| # | v13.5 : élément | Cible B | Module | Critère de test |
|---|---|---|---|---|
| S-01 | Intro trophée (anneaux, coupe, « WORLDS 2026 / This Is Our Moment »), 2,5 s, touche pour passer, une fois par session (sessionStorage `w26_intro`), absente si mouvement réduit (1561) | Démarrage, identique (B : 2,3 s, `?nointro` pour les tests) | socle | 1re ouverture : `#intro` visible puis retiré ; 2e ouverture dans la session : absent ; `reducedMotion` : absent |
| S-02 | En-tête : lien « ‹ » vers le hub `index.html`, marque WORLDS 2026 « Los Angeles, Allen, New York » (1196) | Accueil › barre : marque (fait) ; lien vers le hub dans `set` (N2) | socle | `set` contient un lien `index.html` |
| S-03 | Bouton de synchro : états « Chargement… », « Synchro… », heure de synchro (vert), « Robot hh:mm » (orange, LoL Esports injoignable), « Hors ligne » ; infobulle explicative ; toucher = diagnostic (5312-5330, 2091) | Accueil › barre › pastille N1 (B l'a : heure, « En direct », « Hors ligne ») ; toucher → `set` (N2) ; ajouter « Robot hh:mm » | socle | couper LoL Esports (route bloquée) : pastille « Robot hh:mm » ; toucher → écran `set` |
| S-04 | Barre d'onglets du bas (Direct, Matchs, Suisse, Stats, Équipes, Joueurs) avec indicateur glissant (1217) | Remplacée par l'accueil-hub : widgets + accès aux sections (Calendrier, Suisse, Équipes, Joueurs, Stats, Ligue) sur l'accueil, N1 ou N2 | socle | depuis l'accueil, chaque section s'ouvre en 1 toucher ; accueil ≤ 1,5 écran |
| S-05 | Pastille sur l'onglet Direct : matchs des prochaines 24 h pas encore pariés (`betBadge`, 1815) | Accueil › widget Mes paris N1 (« n à parier ») + pastille sur l'accès Ligue/Paris | socle + ligue | 2 matchs non pariés < 24 h : « 2 à parier » visible sans toucher |
| S-06 | Fond « poussière d'or » animé (canvas `#bgfx`, 1492) | Remplacé par le fond hexagonal statique de B (`.scr`) | socle | rien ne boucle hors faisceau, reflets et intro |
| S-07 | Confettis (canvas `#fx`, 1504) : pari posé, équipe choisie, prono gagné, ligue créée ou rejointe, prise de tête de ligue | Socle fournit `confetti(x,y,couleurs,n)` (extrait 1503-1514 + `<canvas id="fx">` dans le gabarit) ; appelé par la ligue | socle + ligue | parier : particules sur le canevas ; mouvement réduit : rien |
| S-08 | Toast (2,6 s, 1515), vibrations courtes à chaque toucher (`vib`) | Socle `toast` (2,2 s), `vib` (fait) | socle | — |
| S-09 | Inclinaison au gyroscope du héros et de la grande carte joueur ; demande d'autorisation iOS au premier toucher (`askGyro`, 1556) | Carte holo de la fiche joueur (fait, `tiltOn`) ; **ajouter la demande iOS** (`DeviceOrientationEvent.requestPermission`) | socle | iPhone : premier toucher appelle `requestPermission` (simulé) |
| S-10 | Faisceau hextech entre les deux logos du héros (sprites, pause hors champ et sous une fiche, 1518) | Héros de l'accueil et tête du match (fait, `startBeam`) | socle | faisceau en pause sous un autre écran (rAF sans dessin) |
| S-11 | Compte à rebours à bascule j/h/min/s du héros (1593, 2093) ; passage automatique en « Match en cours » à l'heure | Héros, widget Prochain, tête du match : `data-cd` (fait, compact) ; à 0 : `finalize` + rerendu (manque) | socle | à l'heure du coup d'envoi le héros passe en direct sans recharger |
| S-12 | Chiffres qui défilent (« Ces Worlds en chiffres », `countUp`) | Widget ou écran Stats › Tournoi (voir T-20) | stats | — |
| S-13 | Motion, 5 moments (5411-5551) : barre du robot de 50/50 au verdict + éclat ; chances de titre en cascade ; pastilles des rencontres en cascade ; direct : barre qui glisse, kills et score qui « claquent » ; ligue : classement qui glisse depuis l'ordre vu (`w26_mv_lb_<code>`) et points qui défilent ; anneau Mes paris rempli une fois | Chaque module rejoue son moment sur ses écrans (Web Animations, une fois, jamais aux rafraîchissements) : 1, 3, 4 → match ; 2 → suisse (et widget) ; 5 et anneau → ligue | match, suisse, ligue | ouvrir Match › Aperçu : la barre part de 50/50 ; resynchro : rien ne rejoue ; mouvement réduit : rien |
| S-14 | Navigation : historique (retour Android), pile de fiches avec « ‹ Retour », glisser vers le bas pour fermer, Échap, toucher le fond (1956-2002) | Pile d'écrans + history API, flèche, bord gauche, Échap (fait) ; feuilles « i » : **ajouter le glissement vers le bas** | socle | `smoke.js` : retour Android ferme la feuille puis l'écran ; glisser de 120 px vers le bas ferme la feuille |
| S-15 | Mémoire du défilement par onglet ; l'onglet Matchs s'ouvre sur le jour en cours (1963-1968) | Chaque écran garde son défilement (fait) ; Calendrier › À venir s'ouvre sur aujourd'hui | socle, suisse | Calendrier : le jour courant est en haut |
| S-16 | Rendu économe : onglets « sales » repeints au repos, `setHTML` sans reconstruction inutile (1916-1923) | Seul l'onglet visible est construit, comparaison du HTML (fait) | socle | — |
| S-17 | Planning : LoL Esports (`getSchedule` paginé) → planning du robot (`SJ.sched`) → Leaguepedia → embarqué (14 matchs, 1306) ; refus si < 6 matchs (5182-5246) | Fait sauf Leaguepedia (abandonné) ; « hors ligne » si tout échoue | socle | bloquer LoL Esports et le robot : l'embarqué s'affiche, pastille « Hors ligne » |
| S-18 | Re-synchro : 60 s si un match est « chaud » (en cours, en attente, coup d'envoi < 20 min), sinon 5 min ; après un échec de LoL Esports, essais à 3 s, 10 s, 30 s ; au retour dans l'appli après > 60 s (5332-5338, 2092) | B : 60 s / 5 min seulement → **ajouter** les essais rapprochés et la synchro au retour (visibilitychange) | socle | bloquer puis rétablir l'API : nouvel essai < 3 s ; onglet caché 2 min puis visible : synchro immédiate |
| S-19 | `keepSides` : l'ordre des équipes d'un match reste celui du premier affichage (5181) | Extrait | socle | — |
| S-20 | États d'un match : terminé, en direct (API ou heure passée < Bo×55 min), en attente du résultat, à venir ; rondes suisses numérotées ; migration des anciennes clés Play-In (1435-1463) | Extrait (`finalize`) + refonte : « pas commencé » 3 h après l'heure → en attente | socle | `stageLab` affiche « Phase suisse, ronde 3 » |
| S-21 | Photos : robot (`pinfo`) → Leaguepedia (cache 24 h `w26_lp_players`) → LoL Esports `getTeams` (`w26_le_photos`) → Wikipédia ; « Recharger les photos » ; journal des sources (5248-5311) | Robot (fait) ; repli LoL Esports `getTeams` à garder ; journal et rechargement dans `set` | socle | robot sans `pinfo` : photos LoL Esports chargées |
| S-22 | Images : vignettes wsrv.nl (WebP 96/160/320 px), chaîne de secours (original, Leaguepedia, monogramme coloré) (1388-1416) | Extrait | socle | logo cassé : monogramme coloré à la place |
| S-23 | Noms historiques des équipes (Leaguepedia) (2406-2430) | Abandonné (le robot fournit `SJ.names`) | — | — |
| S-24 | Icônes de champions Data Dragon (cache 7 j `w26_champs2`) (2432-2443) | Fait | socle | — |
| S-25 | Blocs asynchrones : squelette, cache `w26_ak_*` par bloc, invalidé par un nouveau stats.json, erreur « Données injoignables » + Réessayer, pause Leaguepedia croissante, chargement à l'approche de l'écran (2376-2404) | Extrait par le socle (`ablock`, `akSkel`, Réessayer géré) ; les modules s'en servent pour leurs blocs lourds | socle | bloc en erreur → « Réessayer » relance ; cache relu au 2e affichage |
| S-26 | Fuseau : « heure de Paris » ou « heure locale » ; la nuit (avant 6 h) rattachée à la soirée de la veille (`dayKeyL`) ; mention « nuit » sur les horaires < 6 h (1417-1424, 1587) | Partout où une heure est affichée ; « nuit » sur les lignes de match | socle, suisse | match à 01 h : rangé dans la soirée de la veille, « nuit » visible |
| S-27 | Lien profond : aucun en v13.5 (sauf `#moi=` et `?ligue=`) | **Nouveau** : `#route` ouvre l'écran au démarrage | socle | ouvrir `…#p/T1_faker` : fiche de Faker |

## 2. Accueil (moment de la journée)

Moments (`homeMoment`, 1636) : **live** (match en cours ou en attente du résultat), **soon** (coup d'envoi dans moins de 75 min), **day** (jour de match, avant), **after** (soirée finie, et le lendemain jusqu'à 11 h = **matin**), **rest** (jour sans match). Ordre v13.5 des blocs : live « héros, ce soir, ligue, fait, classement, paris, mon équipe, chiffres » ; soon « héros, ce soir, ligue, fait, bilan d'hier, classement, paris, équipe, chiffres » ; day « héros, ce soir, bilan, ligue, fait, classement, paris, équipe, chiffres » ; after « bilan, ligue, fait, héros, ce soir, classement + puces des postes, paris, équipe, chiffres » ; rest « classement + puces, fait, ligue, héros, ce soir, bilan, paris, équipe, chiffres ».

| # | v13.5 : élément | Cible B | Module | Critère de test |
|---|---|---|---|---|
| A-01 | Héros du prochain match ou du match en cours : phase et libellé (« Phase suisse : Ronde 3 »), badge « En direct » / « Résultat en attente » / « BoN » ; logos 76 px et codes cliquables (→ fiche équipe), noms complets ; VS ou score de la série ; compte à rebours ou « Match en cours » / « En attente du résultat » ; date, heure et fuseau (1613) | Accueil › widget héros `w22` N1 (fait : phase, badge, logos, codes, % du robot, compte à rebours, « Ce soir à … ») ; toucher → Match ; **ajouter** : ronde, « Résultat en attente » | socle | `?mo=soon` : héros avec compte à rebours ; match en attente : badge « Résultat en attente » |
| A-02 | Ligne d'enjeu sous le héros : « Élimination directe : le perdant rentre à la maison », « Match couperet : le perdant est éliminé », « Match à élimination pour X » (`stakeLine`, 1607) | Héros N1 (fait : `stakeTxt`, forme courte) | socle | match d'une équipe à 2 défaites : « Couperet pour X » |
| A-03 | Boutons du héros : « Suivre en direct » / « Voir le face-à-face », **« Regarder en VF »** (twitch.tv/otplol_), **« LoL Esports »** (lolesports.com/fr-FR) (1629) | Toucher le héros = Match (fait) ; liens VF et LoL Esports → Match › Direct (ou Aperçu) N1 sous forme de bouton | match | match en direct : bouton « Regarder en VF » ouvre twitch.tv/otplol_ dans un nouvel onglet |
| A-04 | Direct dans le héros : partie n, temps de jeu, kills, écart d'or + tendance (courbe miniature), barre de chances, rangée d'objectifs (tours, dragons avec cases jusqu'à l'âme, Barons, inhibiteurs), dernier événement du fil ; repeint seulement si visible (`hudHeroHTML`, 4815) | Héros `#wlive` N1 (fait : temps, kills, écart d'or, barre, dernier événement) ; **ajouter** la tendance et la rangée d'objectifs si la hauteur le permet | socle (+ match pour les aides) | en direct : le héros change toutes les 10 s sans clignoter |
| A-05 | « Records en vue » dans le héros (une ligne si un record de ces Worlds ou de l'année est proche ou battu ; détail au toucher) (fun 4296) | Match › Direct N1 (voir MD-14) ; sur l'accueil seulement si battu (une ligne dans le héros) | match | — |
| A-06 | Bandeau « Ton prono » sous le héros avant le match : 2 boutons + VS, « modifiable jusqu'au coup d'envoi » / « avant hh:mm », ligne du robot (« Robot : X favori à 62 %, mieux noté à 4 postes sur 5, surtout au mid (Chovy) ») qui ouvre le match, et qui de la ligue a parié (✓, choix cachés) (`moStrip`, 1656) | Héros : 2 boutons de pari (fait) ; ligne du robot = % sur les côtés (fait) ; **ajouter** « n sur N de la ligue ont parié » (une ligne) | socle + ligue | parier depuis le héros : `w26_picks` mis à jour, bouton or |
| A-07 | Pendant le match : « Les paris » de la ligue révélés (n pour X · m pour Y, avatars et choix) ou « Ton prono » seul (1667) | Widget « Ton prono » (`livebets`, fait) ; **ajouter** les choix révélés de la ligue (avatars) | ligue | en direct avec ligue : avatars et choix visibles |
| A-08 | « Ce soir » / date : la liste des matchs du jour, ceux à parier avec 2 boutons et l'indice du robot (« ◀ 79 % », `qbRow`), les autres en ligne de match ; « Touche l'équipe que tu vois gagner » (1699) | Widget « Ce soir » `w21` N1 (fait : 3 lignes, heure ou LIVE, score, favori du robot, pastille de prono) ; toucher → Calendrier ; parier → Mes paris › À parier | socle | 3 matchs ce soir : les 3 lignes visibles, « +n » au-delà |
| A-09 | Bilan de la soirée (après les matchs, en grand) : titre « Bilan de la soirée » / « Hier soir » / date, « Tes paris : 3/4 · Meilleure soirée : Léa, +4 », grille des résultats 2 par ligne (gagnant en clair, liseré vert ou rouge selon ton prono, toucher → match) ; replié les autres moments (`eveHTML`, 1674) | Accueil (after) › widget `w22` N1 (fait : titre, tes paris, 8 résultats, ligne « surprises du robot ») → `eve/<jour>` N2 ; **ajouter** « Meilleure soirée » de la ligue | socle + ligue | `?mo=after` : widget bilan en tête, toucher → écran bilan |
| A-10 | Podium des joueurs de la soirée (3 meilleurs, une raison chiffrée, détail au toucher ; données robot `SJ.fu.g`, sinon feuilles du flux gardées dans `w26_fun_eve`) (fun 4312-4381) | `eve/<jour>` N1 (podium) et N2 (détail) | socle | soirée finie : podium de 3 joueurs avec leur meilleure partie |
| A-11 | Carte « Le saviez-vous ? » : un fait (nouveau d'abord, sinon celui d'après la dernière visite `w26_lsv`), « nouveau », n/N, `i` (calcul), `›`, toucher = suivant, glisser = suivant ou précédent, puces équipe/joueur (1741-1797) | Widget `fact` N1 (fait) → `fx/<n>` (voir F-01) | stats | — |
| A-12 | Carte « Qui va gagner ces Worlds ? » : favori et 3 challengers avec une raison et une barre ; toucher → Suisse (`rkHomeCard`, 3905) ; disparaît après la finale | Widget `sim` N1 (fait : 3 ou 5 équipes, %) → `sim` ; **ajouter** une raison courte par équipe si la place le permet ; masqué après la finale | suisse | après la finale : widget absent |
| A-13 | Puces « Classements : Top, Jungle, Mid, ADC, Support » sous la carte (after, rest) (1691) | Widget `rank` N1 (fait : n°1 de chaque poste) → `rk/TOP` ; les 5 postes = onglets du classement | joueurs | — |
| A-14 | Ligue de paris sur l'accueil (classement, podium, distinctions, prochains matchs, boutons) (`duelHome`, 4153) | Widget `league` N1 (fait : rang ou toi contre le robot) → `lg` (voir L-*) | ligue | — |
| A-15 | « Mes paris » : anneau du taux de réussite, « 3/5 gagnés », « n matchs attendent ton prono » ou « Tous les matchs connus sont pronostiqués », bouton « Partager mes pronos » (1706) | Widget `bets` N1 (fait) → `bets` ; partage → `bets` › Bilan | ligue | — |
| A-16 | Paris des jours suivants : 2 lignes « à parier » + « n autres matchs à parier » (jours), jusqu'à 8, puis « dans l'onglet Matchs » ; « En attente du résultat (n) » ; « Derniers résultats » repliés (`betsHTML`, 1802) | `bets` › À parier / En attente / Bilan (fait) | ligue | — |
| A-17 | « Mon équipe » : sans équipe, 19 logos à toucher (« Ses matchs sont surlignés partout, et son parcours est tracé dans l'onglet Suisse ») ; avec : ligne équipe + statut (« En lice 2-1 », « Qualifié pour les quarts »…), ses 4 derniers matchs, « Changer d'équipe » (1713) | **Nouveau widget** `myteam` (w11) N1 → `t/<fav>` ; choix de l'équipe dans `set` et sur la fiche équipe (« Suivre cette équipe ») | socle (+ suisse pour la fiche) | choisir GEN dans `set` : `w26_fav`="GEN", widget « Mon équipe » GEN |
| A-18 | « Ces Worlds en chiffres » : équipes encore en lice sur 19, nationalités, champions du monde sur le terrain (titres cumulés, puces des joueurs, « +n »), Coréens hors LCK, Français titulaires ; ligne « Données synchronisées via … à hh:mm. Horaires en heure de Paris » (1717) | Stats › Tournoi › N1 (bloc « En chiffres », puces → joueur) ; la ligne de source → `set` | stats | 5 chiffres présents, puce → fiche joueur |
| A-19 | Note quand aucun match n'est connu : « Prochain match … » ou « Aucun match programmé pour l'instant. Les affiches apparaissent dès le tirage de la ronde » (1695) | Accueil (rest, fin de tournoi) : widget Prochain / Calendrier « Fin, plus de match prévu » (fait) | socle | — |

## 3. Calendrier (onglet Matchs de v13.5)

| # | v13.5 : élément | Cible B | Module | Critère de test |
|---|---|---|---|---|
| C-01 | Filtres de phase : Tout, Play-In, Suisse, Phase finale (1820) | `cal` › tête N1 (puces) | suisse | « Suisse » : seulement des matchs de phase suisse |
| C-02 | Jours groupés (soirée = nuit rattachée), intertitre jour + phase + lieu (« Credit Union of Texas Event Center, Allen (Texas) »), jour courant mis en avant et ouvert à l'écran (1817-1832) | `cal` › À venir / Résultats N1 : `.day` (fait sans le lieu) ; **ajouter** lieu (N2 ou `small`) et ouverture sur aujourd'hui | suisse | ouvrir `cal` : la soirée en cours en haut |
| C-03 | Jours sans affiche (tirage au fil de l'eau, `DAYS`) : « Ronde 3, tirage le 24 octobre. Premier match à 19:00 » (1324, 1824) | `cal` › À venir N1 (B : « n matchs à déterminer », seulement si l'API les liste) ; **ajouter** les jours de `DAYS` absents de l'API | suisse | 26/10 sans affiche : ligne « Ronde 3, tirage le 24 octobre » |
| C-04 | Ligne de match : Bo, heure ou LIVE (+ « nuit »), logos, codes (« À venir » si inconnue), score ou V-D ou VS, gagnant et perdant, équipe pariée soulignée, pastille de prono (logo de ton équipe ; vert gagné, rouge perdu ; anneau vide « à parier »), surlignage de « Mon équipe » (1580) | `mrow` du socle (fait : heure/LIVE, logos, score, favori du robot, pastille) ; **ajouter** surlignage de l'équipe suivie, « nuit », Bo | socle | match de l'équipe suivie : liseré or |
| C-05 | Note de bas : « Horaires en heure de Paris. Point doré : ton prono. Vert : gagné. Rouge : perdu. » (1831) | `cal` › `i` N3 (fait) | suisse | — |

## 4. Suisse, phase finale, qui va gagner (onglet Suisse de v13.5)

| # | v13.5 : élément | Cible B | Module | Critère de test |
|---|---|---|---|---|
| W-01 | Titre et règle : « 16 équipes, 5 rondes : 3 victoires pour les quarts, 3 défaites pour la sortie. Matchs décisifs en Bo3 » (1861) | `sui` › `i` N3 + une ligne N1 | suisse | — |
| W-02 | Légende : victoire (sarcelle), défaite (rouge), parcours de ton équipe (or) ou « Choisis ton équipe dans Direct pour tracer son parcours » (1862) | `sui` › Tableau N1 (légende courte) | suisse | — |
| W-03 | Ronde en cours lisible au téléphone : matchs groupés par bilan (« 2-0 : le vainqueur est en quarts », « 1-2 : le perdant est éliminé », « 2-2 : … », « chacun peut encore perdre une fois »), heure ou EN DIRECT, toucher → match (`roundHTML`, 1836) | `sui` › Ronde N1 (onglet par défaut pendant la phase suisse) | suisse | ronde 3 : groupes 2-0, 1-1, 0-2 avec leur enjeu |
| W-04 | Arbre suisse : 15 cases (0-0 → 3-x / x-3) placées en colonnes, flèches victoire/défaite, logos des équipes présentes (vifs) et passées (pâles), « en quarts » / « éliminés », parcours de l'équipe suivie, défilement horizontal calé sur la ronde en cours (930 px de large, 1843-1870) | `sui` › Tableau N1 **repensé en vertical, sans défilement horizontal** (ex. une rangée par ronde, cases par bilan, logos ; parcours de l'équipe suivie en or) ; toucher un logo → `t/` | suisse | 360 px : aucun défilement horizontal ; les 16 logos visibles ; logo → fiche équipe |
| W-05 | Statut de chaque équipe : en lice (bilan), qualifiée, éliminée (suisse, Play-In, phase finale), championne (`status`, 1476) ; sursis : défaites encore permises en pastilles (`lives`, `pips`) | `sui` › Bilans N1 (classement par bilan avec sursis) ; fiche équipe et liste des équipes | suisse | équipe à 2 défaites : « plus droit à l'erreur » |
| W-06 | Qui va gagner ces Worlds ? : phrase-réponse (« GEN favori : 37 % de chances de titre. Puis HLE (18 %), BLG (17 %) et DK (14 %). Outsider : IG »), lignes favori / challengers / outsider avec une raison courte et le %, détail au toucher (note d'impact par poste, écart de force avec la 2e et % en Bo5, rang dans sa ligue pour l'outsider, % d'aller en quarts et adversaire probable, bilan en parties), « Fiche X » (`simHTML`, 3894) | `sim` › Titre N1 (lignes) et N2 (détail) ; widget `sim` sur l'accueil (fait) | suisse | `sim` : 5 lignes avec raison ; toucher une ligne : la raison complète |
| W-07 | Tableau des 16 : bilan, quarts, demies, titre (barre), équipe suivie en or ; replié « Les 16 équipes » (3901) | `sim` › Tableau N1 (B : titre + quarts) ; ajouter demies et bilan | suisse | 16 lignes, 4 colonnes lisibles à 360 px |
| W-08 | Méthode : 20 000 tournois simulés, force = somme des notes, Bo1/Bo3/Bo5, challengers ≥ 5 %, outsider, fiabilité (`rkSimInfo`, `rkFiab`) ; « Probabilités du robot, pas des certitudes. Modèle de secours … Mis à jour samedi 14:00 » | `sim` › `i` N3 + ligne « mis à jour » N1 (fait) | suisse | — |
| W-09 | « Spécial Worlds » (bouton) (3899) | `sim` › Titre N1 → `spe` | suisse → joueurs | — |
| W-10 | Le robot a-t-il vu juste ? « 10/19 bons favoris » ; « Match par match » (date, équipes, gagnant en or, favori et %, ✓/✗ ; pronos figés au coup d'envoi ou recalculés) ; « Comment il a été testé » (343 parties internationales, bon favori 66 %, règle « la ligue la plus forte gagne », calibration) (`fiabHTML`, 2627) | `sim` › Robot N1 (score), N2 (liste), N3 (test) ; tag « 10/19 aux Worlds » déjà dans Match › Aperçu | suisse | liste de 19 matchs avec ✓ ou ✗ en SVG |
| W-11 | Phase finale : liste des matchs (quarts, demies, finale) ou note « Tirage des quarts le 31 octobre… Quarts du 3 au 6 novembre, demies les 7 et 8, finale le 14 au Barclays Center » (1866) | `sui` › Finale N1 (tableau à élimination directe vertical quand connu) | suisse | avant le tirage : la note ; après : les 4 quarts |

## 5. Stats du tournoi (onglet Stats de v13.5)

| # | v13.5 : élément | Cible B | Module | Critère de test |
|---|---|---|---|---|
| T-01 | Titre « Worlds 2026 en stats » et source (« Calculé par notre robot … mis à jour toutes les 30 minutes ») (2770) | `st` › `i` N3 | stats | — |
| T-02 | Tuiles : parties jouées, durée moyenne, % de victoires côté bleu, champion le plus présent ; barre bleu/rouge avec les nombres (2758) | `st` › Tournoi N1 | stats | 4 tuiles + barre |
| T-03 | Les leaders : choix de la phase (« Phase principale (n parties) », « Play-In ») et de la catégorie (KDA, Kills, CS/min, Part des dégâts ou Dégâts/min, Participation), top 5 avec photo, équipe, parties, valeur, toucher → joueur ; « Minimum n parties, sauf pour les kills » (2757-2762, `uxLeads`) | `st` › Leaders N1 (contrôles en haut, liste) | stats | changer de catégorie : liste redessinée sans rechargement |
| T-04 | Champions des Worlds (gol.gg + API) : phrase (« Nocturne : choisi ou banni dans 94 % des parties … l'équipe qui fait le premier pick a gagné x des y parties »), puces Présence / Bannis / Joués, une ligne par champion (icône, bans, picks, victoires, barre, %), détail (bans dont 1re rotation, joué n fois par qui, premier choix), « Voir les n autres », `i` (sources, First Selection, côté bleu, liens gol.gg) (`metaHTML`, 2356) ; repli « picks seuls » tant que draft.json manque | `st` › Champions N1 (5 premiers), N2 (tous, détail d'un champion), N3 (sources, liens gol.gg) | stats | « Bannis » : tri par bans ; toucher une ligne : qui l'a joué |
| T-05 | Records : partie la plus longue, la plus courte, la plus sanglante (équipes) (2764) | `st` › Tournoi N1 | stats | 3 records avec équipes |
| T-06 | Force des ligues (barres, note) + « Pour se faire une idée : une équipe LCK moyenne battrait une équipe LEC moyenne 72 fois sur 100 » (`leaguesHTML`, 2650) | `st` › Ligues N1 (barres) + N3 (méthode) | stats | 6 ligues classées |
| T-07 | Ces Worlds, ligue contre ligue : séries gagnées et perdues contre les autres ligues, Play-In compris (`wlgHTML`, 2638) | `st` › Ligues N1 | stats | — |
| T-08 | Vrais face-à-face aux internationaux depuis 2025 (parties entre ligues, ≥ 6) (`lgrHTML`, 2644) | `st` › Ligues N2 | stats | — |
| T-09 | Repli Leaguepedia en direct si le robot manque (tournoi, saisons, h2h, duels, joueurs) (2447-2532) | Abandonné : « Stats du robot pas encore publiées » + Réessayer | stats | sans stats.json : message clair, aucune erreur |
| T-20 | « Ces Worlds en chiffres » (voir A-18) | `st` › Tournoi N1 (bloc « En chiffres ») | stats | — |

## 6. Équipes (onglet Équipes) et fiche équipe

| # | v13.5 : élément | Cible B | Module | Critère de test |
|---|---|---|---|---|
| E-01 | Filtre par ligue : Toutes, LCK, LPL, LEC, LCS, LCP, CBLOL (1879) | `teams` › tête N1 (puces qui passent à la ligne) | suisse (team.js) | « LEC » : G2, MKOI, KC |
| E-02 | Carte d'équipe (19, éliminées en dernier) : logo en filigrane, logo + nom, drapeau + tête de série (« LCK n°1 »), coupe si un champion du monde dans l'effectif, drapeaux des nationalités si plusieurs, forme aux Worlds (5 dernières séries V/D), sursis (pastilles + texte), prochain match (« ce soir 01:00 contre DK », EN DIRECT), statut (1876-1888) | `teams` N1 (cartes arrondies 2 par ligne) → `t/<id>` | suisse | 19 cartes ; KC : drapeaux kr, se, fr, us |
| E-03 | Fiche : bannière (filigrane, logo 84 px, nom, pays, ligue, statut) ; note éditoriale (« Champion LCK 2026… ») (3991) | `t/` › tête N1 (héros arrondi, couleurs de l'équipe) + note N1 dans Aperçu | suisse | — |
| E-04 | Le robot en bref : **Force** (« 1re force sur 16 », somme des notes ; N2 : les 16 avec barres), **Chances** (titre, finale, demies, quarts ; N2 : distribution 3-0…0-3, prochain match et % de victoire), **Joueurs** (rangs au poste ; N2 : les 5 lignes de classement), **Grands tournois** (victoires réelles − attendues aux internationaux ; N2 : par tournoi + lien Spécial Worlds) ; `i` (`rkTeamBrief`, 3971) | `t/` › Aperçu N1 (4 lignes), N2 (détail), N3 | suisse | GEN : « 1re force sur 16 », titre 37 % |
| E-05 | Les cinq : cartes holo défilantes (`hscroll`) (3993) | `t/` › Aperçu N1 : 5 cartes **sans défilement horizontal** (grille 3+2 ou liste) → `p/` | suisse | 360 px : 5 joueurs visibles sans défilement latéral |
| E-06 | Tableau : qualification, entrée (Play-In ou suisse), bilan suisse, nationalités (3994) | `t/` › Aperçu N2 | suisse | — |
| E-07 | Début de partie 2026 (1er sang, 1re tour, 1er dragon, âme ; N2 : victoires quand elle les prend, 1er Baron) (`flTeamHTML`, 5114) | `t/` › Saison N1/N2 | suisse | — |
| E-08 | Le saviez-vous ? (2 faits de l'équipe ou de ses joueurs) (`lsvSheet`, 1780) | `t/` › Aperçu N1 (1 ou 2 faits) | suisse (+ stats pour l'aide) | — |
| E-09 | Saison 2026 : 8 tuiles (séries, % parties, côté bleu, côté rouge, kills, dragons, écart d'or final, durée), 10 dernières séries (adversaire, score), « En 2026 contre les équipes de ces Worlds » (bilans, toucher → équipe) (`renderTeamSeason`, 2742) | `t/` › Saison N1 (tuiles), N2 (séries, contre les équipes) | suisse | — |
| E-10 | Ses matchs à ces Worlds (lignes de match) (3998) | `t/` › Matchs N1 (+ son parcours suisse) | suisse | — |
| E-11 | « Suivre cette équipe » / « Mon équipe » (`w26_fav`) (3999) | `t/` › tête N1 (bouton étoile) | suisse | toucher : `w26_fav` = id, toast |

## 7. Joueurs (onglet), classement 2026, Spécial Worlds

| # | v13.5 : élément | Cible B | Module | Critère de test |
|---|---|---|---|---|
| J-01 | Recherche (pseudo, vrai nom, équipe) (1209, 1908) | `pl` › tête N1 (champ) | joueurs | « faker » : 1 carte |
| J-02 | Puces : Tous, Top, Jungle, Mid, ADC, Support, Champions du monde ; « Classement 2026 » (bascule) (1902) | `pl` › tête N1 (puces) ; « Classement » → `rk/` | joueurs | — |
| J-03 | Carte du monde « Tous les chemins mènent à Allen » (d3 + topojson chargés à la demande, pays colorés selon le nombre de joueurs, arcs animés vers Allen, points avec effectifs, toucher un pays = filtre), masquée si le chargement échoue (1925-1950) | `pl` › Carte N1 (largeur de l'écran, sans défilement) | joueurs | toucher la Corée : filtre kr, 40+ joueurs |
| J-04 | Nationalités : puces drapeau + pays + nombre (1212, 1906) | `pl` › Carte N2 (liste sous la carte) | joueurs | — |
| J-05 | Journal des photos (n/95, sources) + « Recharger les photos » (1910) | `set` N2 | socle | — |
| J-06 | Compteur « n joueurs, filtre X » (1912) | `pl` › Cartes N1 | joueurs | — |
| J-07 | Grille de cartes holo (photo, poste, logo, coupe ×n pour les champions du monde avec animation quand visibles, drapeau + pseudo, équipe) → fiche joueur (1889) | `pl` › Cartes N1 (`hcard`, grille 2 ou 3 colonnes) | joueurs | 95 cartes, toucher → `p/` |
| J-08 | Classement 2026, note d'impact : phrase « Chovy (GEN) est le meilleur mid des Worlds… Pourquoi : … » (`rkBest1`) ; par défaut les 3 premiers de chaque poste + « Les 19 tops › » ; filtre poste, champions du monde, recherche (`rkRankView`, 3755) | `rk/<poste>` N1 (podium 3 + liste) (fait sans la phrase) ; **ajouter** la phrase-réponse en tête | joueurs | `rk/MID` : phrase + 19 lignes |
| J-09 | Ligne de classement : rang, fourchette (« 1–3e »), photo, nom, équipe, raisons en abrégé (« adversaires LCK (3e) · +295 d'or à 15 min (3e) », « faible : … »), note ; au toucher : écart à la moyenne en points de chances, barres des 6 axes (avance à 15 min, farm, KDA, participation, adversaires, ajustement), stats de saison avec rangs bruts, boutons « Classement des … », « Fiche de X », « Comparer avec Y » (`rkRow`, `rkDetail`, 3730-3747) | `rk/` N1 (rang, nom, note) ; N2 (`why:` en feuille, fait : barres) ; **ajouter** fourchette, raisons courtes et « Comparer avec le voisin » | joueurs | toucher une ligne : feuille « Pourquoi ce rang » avec 6 barres |
| J-10 | Choix de la stat : Note d'impact + 13 stats brutes (Victoires, KDA, Kills/Morts/Assists par partie, Participation, Part des dégâts, CS/min, Or/min, écarts d'or et de CS à 15 min, Balises, Champions joués) ; « Classement brut… ligues mélangées », 10 parties minimum, non classés listés (`PSTAT`, `rkRawView`, 2662, 3770) | `rk/` › tête N1 (sélecteur « Trier par » en feuille ou puces) | joueurs | « KDA » : tri par KDA, mot « brut » visible |
| J-11 | Légende et méthode du classement (6 stats par partie, niveau des adversaires, demi-vie 4 mois, couverture des raisons, fourchette) (`rkMethod`, 3740) | `rk/` › `i` N3 | joueurs | — |
| J-12 | Spécial Worlds : phrase (« Pas d'effet grand tournoi général… Exception possible : X »), carte du joueur ou de l'équipe en focus, « Les équipes » (3 meilleures, 2 dernières, toutes repliées : en ligue %, internationaux ±, « net »), « Les joueurs, aux Worlds seuls » (top 5, tous ; parties, écart ± marge, vert si au-delà) ; méthode (`worldsSheet`, 3842) | `spe` › Équipes / Joueurs N1, N2 (liste complète), N3 (méthode) | joueurs | `spe` : 2 onglets ; focus via `spe` depuis une fiche |

## 8. Fiche joueur

| # | v13.5 : élément | Cible B | Module | Critère de test |
|---|---|---|---|---|
| P-01 | Grande carte holo inclinable (photo, poste, logo, coupe ×n, drapeau, pseudo, équipe) (3966) | `p/` › tête N1 (fait, 132 px) | joueurs | — |
| P-02 | Rang : « 3e des 19 mids des Worlds », « au coude-à-coude, entre le 2e et le 5e », « voir le classement et le pourquoi › » (`rkbig`) | `p/` › tête N1 (fait : 1er grand, fourchette, note) → `rk/` ; « pourquoi » → feuille `why:` | joueurs | — |
| P-03 | En bref › **Profil** : âge, ligue, n-ièmes Worlds, titres ; N2 : vrai nom (natif), naissance, Worlds joués, titres, nationalité, équipe (→ fiche), expatrié (`rkIdDetail`, 3943) | `p/` › Aperçu N1 (une ligne, fait partiellement dans la tête : âge, Worlds) + N2 | joueurs | Faker : « 30 ans · LCK · 11e Worlds · 6 titres » |
| P-04 | En bref › **Rang** : atouts et point faible (« Atout : adversaires LCK (2e). Faible : −204 d'or à 15 min (19e brut) ») ; N2 : pourquoi + barres + boutons (`rkBriefHTML`) | `p/` › Aperçu N1 + N2 | joueurs | — |
| P-05 | En bref › **Signature** : champion le plus joué de l'année (n parties, V-D) ; N2 : ses 5 champions avec référence des autres pros, nombre de champions, « Tous ses champions » (`rkFicheLines`, 3932) | `p/` › Aperçu N1 → Champions | joueurs | — |
| P-06 | En bref › **Némésis / Victime / Duels** : adversaire (équipe), V-D, victoires attendues ; N2 : les 4 désignations (némésis, victime, plus dur et plus facile en lane), « Contre les mids des Worlds » (bilan, attendu, or à 15 min, toucher → comparer), « Tous ses vis-à-vis » (`rkVsHTML`, 3798) | `p/` › Aperçu N1 → Duels | joueurs | Faker : « Némésis Chovy 27 V – 41 D » |
| P-07 | En bref › **Worlds** : « Stats en hausse : +4,1 pts de victoire aux Worlds par rapport à sa note, 42 parties » ; N2 : internationaux depuis 2024, 2024 vs 2025-26, Worlds seuls, « c'est un constat, pas une prévision », titres, « Spécial Worlds : tous les joueurs » (`rkWorldsP1/P2`) | `p/` › Aperçu N1 → `spe` | joueurs | — |
| P-08 | Prochain duel : carte p contre son vis-à-vis (→ duel), date et heure, « Comparer X et Y », bilan en lane (depuis 2024, V-D, KDA, dernier duel), attendu d'après la force des équipes (`rkExp1`), dernière rencontre (date, compétition, phase, partie, vainqueur, série) (3957-3965) | `p/` › Aperçu N1 (une carte) → `d/` | joueurs | Faker : « vs ShowMaker » → duel |
| P-09 | Début de partie 2026 : « Profil : plutôt début / fin de partie », % de kills et assists avant 15 min vs moyenne du poste ; N2 : morts avant 15 min, écart de niveau, premiers sangs (`flPlayerHTML`, 5122) | `p/` › Saison N1/N2 | joueurs | — |
| P-10 | Le saviez-vous ? (2 faits du joueur) | `p/` › Aperçu N1 | joueurs | — |
| P-11 | Saison 2026 : note d'impact (± marge, « entre le 2e et le 5e »), 6 tuiles visibles avec rang brut (parties, victoires, KDA, K/D/A moyens, CS/min, or/min, part des dégâts, participation, écarts à 15 min, balises, champions joués ; « non classé » si < 10 parties), « n autres stats » replié, « Comment lire ces chiffres », « Comparer avec un autre joueur », champions les plus joués (5 + « n autres ») (`renderPlayerStats`, `season2Tiles`, 2728) | `p/` › Saison N1 (B : 4 lignes avec jauge de rang) ; **ajouter** les autres stats en N2 et la note d'impact | joueurs | Saison : note d'impact + ≥ 4 stats avec rang |
| P-12 | Aux Worlds : années (puces, coupe les années de titre), tuiles (éditions, parties, % victoires, KDA aux Worlds), « À ces Worlds 2026 : … », ses champions aux Worlds (2735-2740) | `p/` › Champions N1 (bloc « Aux Worlds ») ou Saison | joueurs | Faker : 11 années, 6 marquées |
| P-13 | En détail (fiche.json) : **10 dernières parties** (V/D, champion, K/D/A, date, compétition, phase, adversaire, vis-à-vis, or à 15 min ; moyenne vs saison ; « en hausse/baisse » avec la règle stricte) ; **Face à ses vis-à-vis** (désignations avec attendu, 8 premiers + « n autres » ; toucher un titulaire → comparer) ; **Champions de l'année** (V-D, KDA, or à 15 min, référence des autres pros ; « Depuis 2025 ») ; **Profil à adversaires égaux** (7 axes : or et CS à 15 min, farm, participation, part des dégâts, morts, vision ; rang corrigé, brut, rang dans sa ligue) ; source et date (`ficheDetailsHTML`, 3036) | `p/` › Saison (forme 10 dans B : grille de 10 icônes, fait ; profil N2), Duels (vis-à-vis, fait : 4 désignations + 3 + « tous »), Champions (fait : 5 + « tous » ; **ajouter** « depuis 2025 » et or à 15 min) | joueurs | Duels : 4 tuiles + liste ; Champions : référence « pros 52 % » |
| P-14 | « Fiche Leaguepedia » (lien externe) (3966) | `p/` › Aperçu N2 (bas) | joueurs | — |

## 9. Duel (match, route `d/`) et comparaison (joueurs, route `cmp/`) de deux joueurs

Le duel `amVsSheet` de v13.5 (ouvert depuis les duels par poste) devient l'écran `d/` du module match (mission : « match.js (avant/direct/fini, duel) ») ; la comparaison `compareSheet` devient l'écran `cmp/` du module joueurs.

| # | v13.5 : élément | Cible B | Module | Critère de test |
|---|---|---|---|---|
| D-01 | En-tête : deux joueurs (photo, nom, équipe, poste) cliquables (→ fiche) (3391, 2699) | `d/` › tête N1 (fait : 2 cartes holo, rang) | match | — |
| D-02 | Duel › verdict : mieux noté (% d'être le meilleur, points de chances pour l'équipe), lane attendue (% devant à 15 min, or), rencontres (V-D, devant à 15 min k fois sur n, écart médian) (`amVsVerdict`, 3317) | `d/` › Duel N1 (fait : 3-4 lignes `vl`) ; **ajouter** la phrase du verdict | match | — |
| D-03 | Rencontres en lane : bilan depuis 2024 (V-D, attendu, or à 15 min, année en cours), 5 dernières (date, compétition, phase, partie, champions, K/D/A, V/D) + « n plus anciennes » ; N2 : CS, part des dégâts, or et CS à 15 min, durée, série (`amEncRow`, 3331) | `d/` › Duel N1 (fait : 3 dernières) + N2 (détail d'une rencontre, toutes) | match | toucher une rencontre : CS, dégâts, série |
| D-04 | Vis-à-vis communs (adversaires affrontés par les deux, bilan et or de chacun, « X fait mieux contre n ») (3355) | `d/` › Duel N2 | match | Faker–Chovy : 12 adversaires |
| D-05 | Champions : picks probables (90 jours, « 6/42 »), leurs picks face à face (grille avec + / − / ≈ / –), champions joués de l'année (3364-3373) | `d/` › Champions N1 (fait : picks) + grille + joués | match | — |
| D-06 | Forme : 10 dernières parties de chacun (V/D, KDA, or à 15 min, saison, « en hausse/baisse ») (3375-3382) | `d/` › Forme N1 | match | — |
| D-07 | Comparaison : puces « Comparer X avec : » tous les joueurs du poste (2702) | `cmp/` › tête N1 : changer l'adversaire (feuille de choix) | joueurs | choisir un autre mid : l'écran se recalcule |
| D-08 | Note de ligues différentes (« leurs stats brutes ont été faites contre des adversaires différents ») (2708) | `cmp/` › Saison N1 (une ligne) | joueurs | — |
| D-09 | Le plus fort, ligues comprises : barre de note d'impact, % d'être meilleur, adversité, points de chances (« vaut +2,4 points »), d'où vient l'écart (`rkGapLi`), lane aux CS et or attendus (2709-2716) | `cmp/` › Saison N1 | joueurs | — |
| D-10 | Saison 2026 : barres face à face des 14 stats + parties (le meilleur en or) ; source (2717-2719) | `cmp/` › Saison N1 (5 lignes) + N2 (toutes) | joueurs | — |
| D-11 | Champions 2026 (5 de chacun, parties, % victoires) (2720) | `cmp/` › Champions N1 | joueurs | — |
| D-12 | Duels directs : phrase (« Chovy mène Faker 41-27 depuis 2024… on attendait 38-30 : rien d'anormal ») (`rkDuel1`), rencontres (fiche.json) ou repli stats.json, lane depuis 2024 (2721-2724) | `d/` › Duel N1 (phrase) ; `cmp/` › Duels N1 (phrase + rencontres) | match, joueurs | — |
| D-13 | « Toutes leurs stats 2026 » (bouton vers la comparaison) (3396) | `d/` › Duel N1 (bouton « Toutes leurs stats ») → `cmp/` | match → joueurs | `data-cmp` ouvre Saison |

## 10. Fiche de match

### 10.1 Tête et paris (tous états)

| # | v13.5 : élément | Cible B | Module | Critère de test |
|---|---|---|---|---|
| M-01 | Face-à-face (« slam ») : phase et libellé, badge En direct/BoN, logos et codes cliquables (→ équipe), VS ou score, date, heure, lieu (2010-2015) | `m/` › tête N1 (fait : héros 228 px, compte à rebours, bilan suisse sous chaque code, enjeu) ; **ajouter** codes cliquables → `t/` et le lieu (N3 ou `small`) | match | toucher le code T1 : fiche T1 |
| M-02 | Affiche pas encore connue (« dépend du tirage ») (2016) | `m/` N1 : message (lignes « à déterminer » non cliquables, fait) | match | — |
| M-03 | Ton prono : 2 boutons (toucher à nouveau = annuler), refusé après le coup d'envoi (2023, 2068) | Match à venir › Aperçu N1 (fait) ; règle d'annulation et de fermeture : socle (`setPick`) | socle + match | toucher 2 fois : prono annulé ; après l'heure : « Paris fermés » |
| M-04 | Score exact pour le point bonus (Bo3 : 2-0, 2-1 ; Bo5 : 3-0, 3-1, 3-2) une fois l'équipe choisie, facultatif (`duelMatchHTML` « sc », 4456) | Match à venir › Aperçu N1, sous le prono (Bo3/Bo5) ; écrit `w26_scores` | ligue (rendu dans l'onglet du match) | Bo5 : 3 puces ; toucher : `w26_scores[clé]`="3-1" |
| M-05 | Après le coup d'envoi : « Paris fermés : le match a commencé » ou « Ton prono : X 2-1, gagné (+2) / perdu » (2024-2025) | Direct › Avant N1 ; Terminé › Résumé N1 (ton prono et tes points) | match + ligue | match fini parié : « gagné (+1) » |
| M-06 | Les paris de la ligue : avant le coup d'envoi pastilles « a parié » (ton choix visible, ✓ pour les autres, « n sur N ont parié, choix révélés au coup d'envoi ») ; après : répartition X/Y en barre, liste (avatar, nom, équipe + score, points +n / 0) (`duelMatchHTML` « lg », 4457) | Avant › Aperçu N1 (une ligne de pastilles) ; Direct › Avant et Terminé › Résumé N1 (répartition) + N2 (liste) | ligue (bloc), match (place) | ligue de 3 : avant, ✓ sans le choix ; après, choix visibles |
| M-07 | Déjà croisés à ces Worlds (matchs précédents des deux équipes) (2031) | Avant › Équipes N1 ; Terminé › Résumé N2 | match | — |
| M-08 | Résultat qui tarde : « Le résultat tarde à arriver ? » → « T1 a gagné » / « DK a gagné » (ce n'est pas un pari ; la donnée officielle reprend la main ; `w26_manual`) (2026) | État « en attente » › Direct N2 | match | match en attente : saisir le vainqueur → passe « terminé » (manuel) ; l'officiel l'écrase |

### 10.2 Avant le match (à venir)

| # | v13.5 : élément | Cible B | Module | Critère de test |
|---|---|---|---|---|
| MA-01 | Pronostic du robot : phrase (« Le robot voit X favori » / « très serré »), barre aux couleurs des équipes, % de chaque côté, « chances de gagner la série / le match », « Comment il calcule ? » (`robotHTML`, 2618) | Aperçu N1 (fait : grands %, barre, tag « 10/19 aux Worlds ») + N3 (fait) | match | — |
| MA-02 | Les clés du match : phrase « pourquoi » (« X mieux noté à 4 postes sur 5, surtout au mid : … vaut 2,1 points de plus ») ; 2 ou 3 clés étiquetées « pèse » / « à surveiller » / « pour info » ; « n autres clés » ; chaque clé : son taux de référence au toucher ; `i` : méthode (5 810 parties, testés et sans effet), fiabilité à ce niveau de confiance, table de référence (`amKeysHTML`, 3206 ; `keyLine`, 2814) | Aperçu N1 (fait : 3 clés en grands chiffres) + N2 (feuille par clé, toutes les clés) + N3 ; **ajouter** la phrase « pourquoi », l'étiquette « à surveiller », la table de référence en N3 | match | Aperçu : phrase + 3 clés ; toucher une clé : taux réel |
| MA-03 | Duels par poste (5 lignes) : photos, nom en or pour le mieux noté (≥ 60 %), rang au poste, « KDA récent » + flèche hausse/baisse, 3 picks probables (fearless retiré) ; au centre bilan V-D depuis 2024, 5 pastilles « + / − / · » des dernières rencontres (devant à 15 min), écart médian, « lane : X 62 % » ; `i` détaillé ; toucher → duel (`amRolesHTML`, 3276) | Joueurs N1 (fait : photos, nom en or, rang, bilan ou % de lane) ; **ajouter** les pastilles, KDA récent, picks ; toucher → `d/` (fait) | match | Joueurs : 5 lignes ; toucher Mid → duel des mids |
| MA-04 | Draft repliée : fearless (champions déjà joués dans la série, retirés), bans attendus de chaque équipe (5 icônes ; détail : la raison de chaque ban), picks probables par poste (3 icônes « 6/42 » ; détail : grille des duels de champions + phrase) ; `i` : fiabilité (84 % / 75 %), calcul, conseil de bans (rien ne prouve qu'un ban ciblé fasse gagner), sources (`amDraftSecHTML`, `draftMatchHTML`, 2327) | Draft N1 (fait : bans, picks ; toucher un ban : sa raison ; un poste : croisement) ; **ajouter** fearless, conseil de bans en N3 | match | Draft : 2 × 5 bans + 5 postes |
| MA-05 | Équipes repliées : face-à-face (séries depuis 2024, internationaux, 5 dernières séries avec date, tournoi, score), forme du moment (5 dernières séries de chaque avec adversaires), côté (en Bo1 la 1re équipe annoncée prend le bleu ; % du bleu en 2026 ; bleu/rouge par équipe), titres mondiaux cumulés, « Saison 2026 comparée » (11 lignes face à face : séries, parties, bleu, rouge, kills, morts, dragons, Barons, tours, écart d'or final, durée ; « chiffres bruts » si ligues différentes) (`amTeamSecHTML`, 3416) | Équipes (ex-« Stats » de B) N1 (fait : 9 lignes) ; **ajouter** face-à-face détaillé, forme, côté, titres, saison comparée complète en N2 | match | Équipes : face-à-face + forme + côté |
| MA-06 | Paris de la ligue (avant) : voir M-06 | Aperçu N1 | ligue | — |

### 10.3 En direct (partie en cours)

| # | v13.5 : élément | Cible B | Module | Critère de test |
|---|---|---|---|---|
| MD-01 | HUD : badge « Partie n », « ≈ 30 s de décalage » / « Partie terminée », équipes (bleu à gauche, rouge à droite) avec or, temps de jeu (« ≈ » si l'horloge n'est pas sûre), kills en grand, écart d'or + tendance sur 5 min (courbe), barre de chances + `i` (estimation maison), rangée d'objectifs : tours, dragons (couleur du type, cases jusqu'à l'âme, « âme », ancestral), Barons, inhibiteurs (`hudCard`, 4774) | Direct › tête N1 (fait : HUD avec tout cela) | match | HUD présent, mis à jour toutes les 10 s |
| MD-02 | Mini-HUD collant (temps, kills, écart d'or, favori %) quand le HUD sort de l'écran ; toucher = remonter au HUD (4828-4862) | Barre du haut : titre remplacé par le score quand on défile (fait, `paintLive`) ; toucher la barre → remonter | match | défiler de 300 px : la barre montre « 7–3 · 14:22 · T1 62 % » |
| MD-03 | Le match bascule ? (« X était favori à 64 % ; à 18 min, Y a 61 % : surprise en vue » / « il n'a plus que … : rien n'est joué » / « … a gagné : surprise ») ; N2 : prono avant et après la draft, chances du direct (`l2BasHTML`, 4644) | Direct › onglet Direct N1 (une ligne, seulement si l'écart est net) | match | outsider à 62 % : la ligne apparaît |
| MD-04 | Fil du match : 3 derniers événements (kill avec champions et noms, exécuté, assistances +n, 1er sang ; dragon avec type, âme, tours, inhibiteurs, Baron), nouveaux mis en avant, « Tout le fil (n) » replié et construit au toucher ; heures « ≈ » tant que l'origine n'est pas sûre ; rattrapage des trous (`hudKfHTML`, `kfRow`, 4786, 5035) | Direct › onglet Direct N1 (8 derniers, fait) + « Tout le fil » N2 (fait) | match | ouvrir à 20 min : le fil se complète depuis 0:00 |
| MD-05 | Les fights (≥ 2 kills à moins de 20 s) : dernier fight (minute, bilan, ± or, « en cours ») ; N2 : 8 derniers avec or avant → après et kills ; `i` (`l2FightsHTML`, 4659) | Direct › Direct N1 + N2 | match | — |
| MD-06 | Les duels, écart d'or : les 2 lanes les plus marquantes (« Chovy domine Faker : +1,8 k, inattendu »), stables d'un rafraîchissement à l'autre ; N2 : 5 lanes, barre, prévu par le modèle de lane ; rien avant 5 min ; `i` (4699-4710) | Direct › Joueurs N1 (B : écart par poste au centre de chaque ligne) + Direct N1 (les 2 marquantes) | match | — |
| MD-07 | Joueur du match (provisoire avant la fin, à partir de 10 min) : champion, nom, équipe, K/D/A, score ; N2 : top 3 et décomposition (kills, assists, morts, part de l'or, part des dégâts) ; `i` (`l2Pog`, 4711-4720) | Direct › Direct N1 + N2 | match | après 10 min : un nom et un score |
| MD-08 | Tableau du match : « Le plus de dégâts : X, 31 % de T1 » ; N2 : 10 joueurs (K/D/A, or, part des dégâts) ; N3 par joueur : poste, niveau, CS (par min), participation, balises posées/détruites, objets (icônes) ; « kills avec le jungler avant 15 min » ; `i` (flux détaillé lu toutes les 30 s) (`l2TabHTML`, 4674) | Direct › Joueurs N1 (fait : champion + niveau, mort grisée, K/D/A, CS, écart d'or) ; **ajouter** or, part des dégâts, objets et balises au toucher d'un joueur | match | toucher un joueur : objets visibles |
| MD-09 | Courbe d'écart d'or (mesures du direct) (`goldChart`, 4880) | Direct › Direct N1 (fait : courbe d'après le fil, aux couleurs du match) | match | — |
| MD-10 | Joueurs par équipe : champion + niveau, mort grisé, nom + rang au poste, champion, K/D/A, CS ; toucher → fiche (4811) | Direct › Joueurs N1 (fait) | match | — |
| MD-11 | Draft de la partie : prono avant / après la draft (+n pts), champions jamais joués en pro par leur joueur, une ligne par poste (champions, nom, expérience « 12 parties, 7 V » ou « jamais en pro », écart d'or du duel de champions + / − / ≈, nombre de parties) ; N2 : phrase du matchup, expérience détaillée, % du champion en 2026 ; `i` (`amLiveDraftHTML`, 3452) | Direct › Draft N1 (fait : champions, noms, écart) ; **ajouter** avant/après, expérience, « jamais en pro » | match | Draft : « T1 avant la draft 49 %, après 53 % » |
| MD-12 | Draft contre nos pronos (direct) : « 3 picks sur 10 dans nos top 3 · bans publiés environ une heure après » ; N2 : picks par poste face aux 3 picks probables, bans attendus (`d2LiveHTML`, 3588) | Direct › Draft N2 | match | — |
| MD-13 | Plus jouables dans cette série (fearless, à partir de la partie 2) : champions pris par chaque équipe (parties), favoris de chaque joueur déjà pris, « reste » ses 3 picks ; règle vérifiée sur 1 989 séries (`d2FearlessHTML`, 3600-3636) | Direct › Draft N1 (Bo3/Bo5, partie ≥ 2) + N2 | match | Bo5, partie 3 : liste des champions pris |
| MD-14 | Records en vue : une ligne (« Chovy est à 12 kills : le record de ces Worlds est 13 (…) » ; battu, égalé, de l'année ; partie la plus courte) ; N2 : détail et portée (`funRecHTML`, 4296) | Direct › Direct N1 (si proche) + N2 | match | simuler 13 kills : « il bat le record de ces Worlds » |
| MD-15 | Statuts du flux : « Connexion au direct… », « La partie n'a pas encore commencé » (draft en cours), « Flux en direct introuvable », « Flux LoL Esports injoignable (…). Nouvel essai dans 10 s » ; rafraîchi toutes les 10 s (30 s onglet caché) ; fenêtre du flux reculée (50, 90, 180 s) si l'horloge du téléphone avance (4486-4511, 4899-4905) | Direct (tête et onglets) N1 (fait en partie) ; **ajouter** le message d'erreur et le nouvel essai | match | couper le flux : message d'erreur, reprise seule |
| MD-16 | Paris de la ligue révélés, prono du robot et clés (avant le match), duels par poste, draft et équipes repliés pendant le direct (2028, 3288) | Direct › Avant N1 (fait : robot + clés) ; **ajouter** paris de la ligue, duels par poste repliés | match | — |
| MD-17 | Feuille de match des parties déjà jouées de la série (2021) | Direct › Avant N2 ou onglet Parties dès la partie 2 | match | Bo5 à 1-1 : parties 1 et 2 consultables |
| MD-18 | Héros de l'accueil repeint seulement quand visible ; fil complet construit au toucher ; flux détaillé lu au plus toutes les 30 s (4822, 4786, 4528) | Socle : un seul écran repeint (`skipData`, onglet visible) (fait) | match | — |

### 10.4 Entre deux parties (série)

| # | v13.5 : élément | Cible B | Module | Critère de test |
|---|---|---|---|---|
| MB-01 | « Pause entre deux parties. Série : T1 1 - DK 1 » (4904) | Direct › tête N1 (fait : « Pause entre deux parties », série) | match | — |
| MB-02 | Joueur du match de la partie qui vient de finir (`l2BetweenHTML`, 4725) | Direct › Direct N1 | match | — |
| MB-03 | Avant la partie n+1 : plus jouables dans la série (fearless), picks probables restants par poste, bans attendus ; `i` (fiabilité des picks) (`amBetweenHTML`, 3645) | Direct › Draft N1 (onglet par défaut entre deux parties) | match | entre P2 et P3 : picks restants sans les champions déjà joués |
| MB-04 | Feuille des parties terminées de la série (2021) | Parties N1 | match | — |

### 10.5 Match terminé

| # | v13.5 : élément | Cible B | Module | Critère de test |
|---|---|---|---|---|
| MF-01 | Feuille de match, une carte par partie : « Partie n », durée, « Victoire X », **« Revoir en VF » / « Revoir en VO »** (YouTube au début exact de la partie), score de kills, joueur de la partie (champion, nom, équipe, K/D/A, % des dégâts → fiche), or / tours / dragons (+ âme) / Barons / inhibiteurs, 10 joueurs (champion, nom, K/D/A, CS, % des dégâts → fiche), « Le flux s'est arrêté avant la fin » ; vainqueur de chaque partie déduit (`renderGames`, `matchGames`, 5076-5172) | Terminé › Parties N1 (une partie à la fois, sélecteur P1…Pn) (fait : en-tête, courbe, objectifs, joueur de la partie) ; Joueurs N1 (fait : K/D/A, CS, part des dégâts) ; **ajouter** « Revoir en VF », objectifs chiffrés, score de kills | match | Bo5 : 5 pastilles ; « Revoir en VF » ouvre YouTube à la bonne seconde |
| MF-02 | Débrief de la partie (robot `fl.w`) : 1er sang (qui sur qui, minute), 1er dragon (type), 1re tour, 1er Baron, âme ; courbe d'écart d'or bleu/rouge ; « Remontée : X mené de 3,4 k » (`flLine`, 5138) | Résumé et Parties N1 (fait : pastilles des premiers objectifs, courbe, remontée) | match | — |
| MF-03 | Draft de chaque partie contre nos pronos : « Bans annoncés : KC 3/5, MVK 0/5 · 4 picks sur 10 dans nos top 3 » ; N2 : bans réels dans l'ordre (en or ceux annoncés, « attendus aussi »), picks par poste avec leur rang dans nos 3 picks probables ; pied : prono figé au coup d'envoi / recalculé (`d2GameHTML`, 3572) | Draft N1 (fait : bans réels avec liseré, picks avec liseré) ; **ajouter** la ligne-résumé « 4/10 dans nos top 3 » et le pied | match | — |
| MF-04 | Ce que le robot avait annoncé (v13.5 : non affiché une fois le match fini, bilan dans l'onglet Suisse) | Résumé N1 (fait : % du robot, « vu juste » / « surprise ») | match | — |
| MF-05 | Duels par poste et équipes (avant-match) restent consultables (2030) | Résumé N2 (« L'avant-match ») ou onglet | match | — |
| MF-06 | Ton prono et tes points ; paris de la ligue avec points (voir M-05, M-06) | Résumé N1 | match + ligue | — |
| MF-07 | Joueur de la partie (même formule que le direct, dans l'équipe gagnante) (`pogLine`, 5131) | Résumé N1 (fait, carte holo) | match | — |

## 11. Paris et ligue entre potes

| # | v13.5 : élément | Cible B | Module | Critère de test |
|---|---|---|---|---|
| L-01 | Pari en un geste partout (héros, ce soir, à parier, fiche) ; confettis aux couleurs de l'équipe ; vibration (2067) | Socle `setPick` (fait) + confettis (ligue, S-07) | socle + ligue | — |
| L-02 | Partager mes pronos : texte « Mes pronos Worlds 2026 (3/5) » + une ligne par match (✅/❌ → mots) + adresse ; partage natif sinon presse-papiers (« Pronos copiés ») (`sharePicks`, 2045) | `bets` › Bilan N1 (bouton) | ligue | presse-papiers contient la liste |
| L-03 | Célébration : prono gagné (pas saisi à la main) → confettis + « Prono gagné : X ! » / « n pronos gagnés ! », une seule fois (`w26_celebrated`) (2038) | Socle `BUS "data"` → ligue | ligue | match gagné : toast une fois, pas au rechargement |
| L-04 | Sans ligue : « Ligue de paris — Crée une ligue, envoie le code à tes potes… 1 point par bon vainqueur, 1 point bonus pour le score exact en Bo3 et Bo5. Classement en direct. » [Créer une ligue] [J'ai un code] (4154) | `lg` N1 (sans ligue) ; widget `league` (toi contre le robot) | ligue | — |
| L-05 | Créer : prénom (2 à 14 lettres, mémorisé `w26_myname`), gage du dernier (facultatif, 60 car.) ; code de 4 caractères ; confettis ; partage de l'invitation (4185-4207) | `lg` › création N1 (formulaire plein écran) | ligue | créer : `w26_league` avec code, `owner:true` ; partage proposé |
| L-06 | Rejoindre : prénom + code (4 caractères, majuscules) ou lien d'invitation (« Léa t'invite dans sa ligue. Gage du dernier : … ») ; « Tu es dans la ligue CODE » (4209-4216) | `lg` › rejoindre N1 | ligue | `?ligue=ABCD&n=Léa` : écran « Rejoindre » prérempli |
| L-07 | Lien d'invitation `?ligue=CODE&g=gage&n=prénom` (ou `?duel=`), effacé de la barre d'adresse ; ouvre « Rejoindre » après l'intro (`readDuelParams`, 4141) | Démarrage → `lg` (rejoindre) | ligue | voir L-06 |
| L-08 | Synchro ntfy (SSE, repli toutes les 12 s), état « Synchro active » / « Pas de connexion, nouvel essai en cours » / « Connexion… » ; republication au « bonjour » d'un nouveau ; toasts « X a rejoint la ligue », « X a placé son pari pour A vs B » ; publication 600 ms après un pari (4038-4091) | `lg` › Réglages N1 (état) ; toasts partout ; protocole **identique** (extrait 4033-4148) | ligue | 2 navigateurs, l'un en v13.5 (prod) et l'autre en refonte, même code : chacun voit le pari de l'autre en < 15 s |
| L-09 | Classement : rang (ex aequo), avatar coloré (initiale), nom (« toi »), « 3/5 bons », points ; 5 derniers résultats en pastilles ; robot membre (« Le robot » : prono figé pour les matchs joués, prono du moment sinon ; ne compte que les matchs pariés par quelqu'un) ; points : 1 par bon vainqueur, +1 score exact ; départage : points, scores exacts, bons, nom (4093-4122) | `lg` › Classement N1 | ligue | robot présent avec son icône ; égalité : même rang |
| L-10 | Podium (2e, 1er, 3e) après les matchs et les jours sans match ; liste seule avant et pendant (4157-4159) | `lg` › Classement N1 (podium toujours en tête de l'écran) | ligue | — |
| L-11 | Gage du dernier (« Gage du dernier : Le dernier paie les pizzas »), imposé par le créateur (4172, 4076) | `lg` › Classement N1 (une ligne) | ligue | — |
| L-12 | Seul dans la ligue : « Personne d'autre pour l'instant. Tes potes ouvrent le lien, ou tapent le code ABCD dans « J'ai un code » » (4174) | `lg` N1 | ligue | — |
| L-13 | Distinctions puis badges : Flair (outsider du robot), Bat le robot (soirée), Audacieux (contre la majorité), Devin (score exact), Série (≥ 3 d'affilée) ; 2 pastilles sous le nom (si elles tiennent à 360 px) + « +n » ; feuille « Badges de la ligue » (lignes détaillées + règles) (fun 4384-4437) | `lg` › Badges N1 (par joueur) ; pastilles dans Classement N1 ; règles N3 | ligue | badge « Devin » après un score exact |
| L-14 | Qui a parié sur les prochains matchs (3 prochains, avatars ✓ cachés avant le coup d'envoi, logos après) (4166-4177) | `lg` › Paris N1 | ligue | — |
| L-15 | Boutons Inviter (partage natif, sinon « Lien copié », sinon « Code : ABCD »), Synchroniser (« Synchro… »), Quitter (confirmation « Le classement sera effacé sur ce téléphone (tes pronos restent) ») (4178, 4194-4199) | `lg` › Réglages N1 | ligue | Quitter : `w26_league` = null, `w26_picks` intact |
| L-16 | « Tu changes de navigateur ou de téléphone ? Emporte ton profil › » : lien `#moi=` (partage natif, presse-papiers, sinon fenêtre de copie) ; à l'ouverture, reprise (confirmation si autre profil) et toast « Profil de X repris » (1360-1385, 4179, 5404) | `lg` › Réglages N1 et `set` N1 ; toast au démarrage (manque) | ligue + socle | ouvrir `…#moi=…` : clés reprises, toast |
| L-17 | Toast de rang : « Tu prends la tête de la ligue ! » (+ confettis) / « Tu passes 2e ! » (`checkRank`, `w26_lgRank`) (4123) | Ligue, après chaque synchro (BUS « data ») | ligue | passer 1er : toast une fois |
| L-18 | Mes paris (bloc de l'accueil) : anneau, x/y gagnés, à parier, en attente, derniers résultats (voir A-15, A-16) | `bets` › À parier / En attente / Bilan N1 (fait) ; B : remplacer « toi contre le robot » de `lgStandings` par `standings()` (mêmes règles que la ligue) | ligue | Bilan : même classement que `lg` |
| L-19 | Animation du classement (glissement depuis l'ordre vu, `w26_mv_lb_<code>`) | `lg` › Classement (S-13) | ligue | — |
| L-20 | Migration de l'ancien duel 1 contre 1 (`w26_duel` → ligue) (4025) | Extrait | socle | — |

## 12. Faits « Le saviez-vous ? »

| # | v13.5 : élément | Cible B | Module | Critère de test |
|---|---|---|---|---|
| F-01 | Un fait à la fois : famille, texte, « nouveau » (né au dernier passage du robot), n/N, `i` (comment c'est calculé), suivant (toucher, ›, glisser à gauche), précédent (glisser à droite), puces équipe/joueur (→ fiche), départ après le dernier vu (`w26_lsv`) (1741-1797) | `fx/<n>` N1 (fait : carte, Précédent, Suivant, `i`, puces) ; **ajouter** glisser, départ après le dernier vu, écrire `w26_lsv` | stats | ouvrir `fx` 2 fois : le 2e commence après le dernier vu |
| F-02 | Dans les fiches équipe et joueur : 2 faits liés (lsvSheet) | `t/` et `p/` › Aperçu N1 | suisse, joueurs (aide `lsvSheet`-like fournie par stats) | — |

## 13. Diagnostic, réglages, état

| # | v13.5 : élément | Cible B | Module | Critère de test |
|---|---|---|---|---|
| G-01 | État de l'appli : version, données matchs (source, heure), photos n/95, ligue (code, joueurs, flux actif / interrogation / hors ligne), heure du téléphone (`diagSheet`, 5356) | `set` N1 | socle | — |
| G-02 | Sources : stats précalculées, LoL Esports, flux direct, Leaguepedia, relais de la ligue, Data Dragon : OK + ms, échec + erreur, « il y a n min » (`HEALTH`, `mark`, `instrument`) | `set` N2 | socle | couper le flux : « Échec » sur Flux direct |
| G-03 | Lancer le diagnostic (8 tests chronométrés : planning, matchs en cours, flux, stats précalculées, Leaguepedia, relais, Data Dragon, images) ; Actualiser les données ; Copier le rapport (« rien de personnel ; colle-le dans la conversation avec Claude ») (5369-5397) | `set` N2 | socle | « Copier le rapport » : texte avec version et sources |
| G-04 | Mon équipe (choix parmi 19, voir A-17) | `set` N1 | socle | — |
| G-05 | Emporter mon profil (voir L-16) | `set` N1 | socle | — |
| G-06 | Lien vers le hub IA Games (voir S-02) | `set` N2 | socle | — |

## 14. États de la journée : ce que montre l'accueil (refonte)

| Moment | Quand | Accueil cible (N1, de haut en bas) | Critère |
|---|---|---|---|
| **live** | un match en cours ou en attente du résultat | héros en direct (`#wlive`) · prochain match · mes paris · ce soir (reste) · qui va gagner · classement · fait ; + accès aux sections | `?mo=live` sans match en cours : retombe sur soon |
| **entre deux manches** | live, série en pause | héros « Pause entre deux parties · série 1-1 » + barre du robot | message visible, pas de HUD vide |
| **soon** | coup d'envoi < 75 min | héros avec compte à rebours et pari · ensuite / prochain · mes paris · classement · qui va gagner · fait · calendrier | parier dans le héros |
| **day** | jour de match, avant | héros (prochain) · ce soir · mes paris · classement · qui va gagner · fait · calendrier | — |
| **after** (soir puis **matin** jusqu'à 11 h) | soirée terminée | bilan de la soirée (`w22`) · prochain match · mes paris · ligue · qui va gagner · fait · classement | `?mo=after` : bilan en tête |
| **rest** | jour sans match | qui va gagner (`w22`) · prochain match · fait · mes paris · classement · calendrier | `?mo=rest` : simulation en grand |
| fin du tournoi | finale jouée | champion du monde (nouveau widget) · bilan · ligue finale · stats | après la finale : pas de « qui va gagner » |

Dans chaque moment : ≤ 1,5 hauteur d'écran (390×664), widgets entiers (pas de widget coupé en bas sans indice), accès aux sections.

## 15. Stockage, adresses, protocole

Tableau complet des clés : `ARCHI.md` § 5. Critères : après un parcours complet, `Object.keys(localStorage)` ne contient que des clés `w26_` (fait, `smoke.js`) ; un profil v13.5 réel (clés `w26_picks`, `w26_league`, `w26_scores`, `w26_fav`, `w26_myname`, `w26_lsv`, `w26_celebrated`, `w26_manual`, `w26_lgRank`) chargé dans la refonte retrouve paris, ligue (même code, même `me.id`), équipe et rang ; un message ntfy publié par la refonte est lu par v13.5 et inversement (L-08).

## 16. Ce que B apporte en plus (à garder)

| # | Apport de B | Où | Module |
|---|---|---|---|
| B-01 | Accueil en grille de widgets arrondis qui change selon le moment ; cascade d'entrée | Accueil | socle |
| B-02 | Écran qui « grandit » depuis la carte touchée (et y revient), sinon glisse ; fond assombri | partout | socle |
| B-03 | Retour par glissement depuis le bord gauche, retour Android, Échap ; liens profonds `#route` | partout | socle |
| B-04 | Onglets en contrôle segmenté collant ; glisser horizontalement = onglet voisin | écrans à onglets | socle |
| B-05 | Explications derrière `i` en feuille du bas (au lieu de paragraphes) | partout | tous |
| B-06 | Couleurs d'équipe de repli quand elles se confondent (`cpair` : or/sarcelle) | barres, héros | socle |
| B-07 | Widget « Prochain » avec compte à rebours et favori du robot ; « Ce soir » compact avec pastilles ; « Toi contre le robot » sans ligue | Accueil | socle, ligue |
| B-08 | Mini direct dans le héros (score, or, chances, dernier événement) | Accueil | socle |
| B-09 | Bilan de la soirée en grille avec « n surprises : X contre l'avis du robot » | Accueil, `eve` | socle |
| B-10 | Grands chiffres façon « clés » (un chiffre + une ligne), étiquette « pèse / pour info » | Match › Aperçu | match |
| B-11 | Rang au poste en très grand sur la fiche joueur (« 1er des 19 mids ») + jauge de rang par stat | Joueur | joueurs |
| B-12 | Forme en 10 icônes de champions (vert/rouge) avec la partie au toucher | Joueur › Saison | joueurs |
| B-13 | Podium de cartes holo en tête du classement | Classement | joueurs |
| B-14 | Courbe d'or remplie aux couleurs des deux équipes ; pastilles « Partie par partie » | Match terminé | match |
| B-15 | Titre de la barre qui devient le score en direct quand on défile | Match en direct | match |
| B-16 | Préparation hors champ des écrans probables (`warm`) : ouverture < 100 ms à CPU ×4 | socle | socle |
| B-17 | « Mes paris » en écran avec « À parier » en un geste et ligne qui s'efface | `bets` | ligue |

## 17. Défauts connus de B à corriger pendant le portage

| # | Défaut | Module | Critère |
|---|---|---|---|
| X-01 | Mini défilement : `.tabc{min-height:60vh}` fait défiler de 40-80 px des écrans presque vides ; contenus qui dépassent de 30-80 px (Qui va gagner, Joueurs d'un match) | socle + chacun | `test/minscroll.js` : dépassement 0 ou ≥ 120 px |
| X-02 | Duel : barres aux couleurs brutes des équipes (`col`), illisibles quand elles se ressemblent (TL/BLG) → `cpair` | match | duel TL–BLG : deux couleurs distinctes |
| X-03 | « Toi contre le robot » et « La ligue » de B (`lgStandings`) n'appliquent pas les règles de la ligue (score exact, robot limité aux matchs pariés, départage) → `standings()` | ligue | même classement que `lg` |
| X-04 | Texte « Maquette : … pas envoyés à la ligue » dans la feuille `paris` | ligue | texte retiré |
| X-05 | Pas de score exact, pas de confettis, pas de publication ntfy après un pari | ligue | L-01, M-04, L-08 |
| X-06 | Feuilles « i » : pas de glissement vers le bas pour fermer ; pas de demande d'autorisation du gyroscope sur iPhone | socle | S-09, S-14 |
| X-07 | Direct de B : pas de mesures d'écart d'or toutes les 10 s (`samples`), pas de prono avant/après draft, ni fights, duels marquants, joueur du match, tableau, records, bascule | match | MD-03 à MD-14 |
| X-08 | Joueurs d'un match terminé : dépend du flux officiel (indisponible : « Stats du flux officiel indisponibles ») ; repli sur les données du robot (`fl.w`, `fu.g`) à prévoir | match | flux coupé : K/D/A du robot affichés |
| X-09 | Textes de B et de v13.5 avec une espace ordinaire avant « : » et « % » (B n'a aucune U+00A0) | socle (fait : correction automatique des nœuds texte) | `smoke.js` : `typoHome` et `typoMatch` à 0 ; attributs `title`/`aria-label` écrits à la main |
| X-10 | Calendrier : pas de filtre de phase, pas de jours sans affiche (`DAYS`), pas de lieu, n'ouvre pas sur aujourd'hui | suisse | C-01 à C-03 |
| X-11 | Ronde dans le titre du match absente avant v14 (corrigé : `finalize` de v13.5 extrait) | socle | « ronde n » visible |
| X-12 | Match terminé › Résumé à 360 px : phrase du robot coupée (« KC selon le robot, avan… »), 5 pastilles de parties sur deux lignes | match | 360 px : phrase entière, pastilles sur une ligne en Bo5 |
