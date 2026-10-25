# Refonte « B » de Worlds 2026 — architecture et API du socle

Chantier : `lot1/refonte/` (chemin complet : `C:/Users/vialo/AppData/Local/Temp/claude/c--Users-vialo-Desktop-Code-Worlds-2026/cead0307-273c-463a-8548-1b2491359512/scratchpad/lot1/refonte/`).
But : remplacer `worlds.html` (v13.5) par une appli au design de la maquette B (widgets arrondis, écrans en profondeur, onglets, « i »), **avec tout ce que fait v13.5**, à la même adresse, sans perdre ni profil, ni paris, ni ligue.

État au départ des portages : `node build.js` produit `dist/worlds-b.html` (235 Ko) qui reproduit la maquette B écran pour écran, clés `w26_` (plus aucune clé `w26b_`), zéro erreur JS sur iPhone 12, Pixel 7 et 360×740 (`node test/smoke.js`).

Inventaire de tout ce qu'il faut porter, avec la place cible de chaque élément : `INVENTAIRE.md`. Demandes entre agents : `DEMANDES.md`.

---

## 1. Fichiers et propriétaires

Un fichier n'est modifié que par son propriétaire. Pour un besoin dans le fichier d'un autre : une ligne dans `DEMANDES.md` (qui, quoi, pourquoi).

| Fichier | Contenu | Propriétaire |
|---|---|---|
| `ref/worlds_v13_5.html` | référence figée (copie de prod v13.5, lecture seule, `chmod a-w`) | personne |
| `build.js` | assemblage, `node --check`, aides (`--who`, `--free`, `--map`, `--extracts`) | socle |
| `src/index.html` | gabarit HTML (head, polices, squelette `#app`, `#sheet`, `#toast`, intro) | socle |
| `src/shell.css`, `src/shell.js`, `src/boot.js` | socle : jetons, composants partagés, navigation, feuilles, données, pari, bus, effets, démarrage | socle |
| `src/home.css`, `src/home.js` | accueil (widgets selon le moment) | socle |
| `src/match.css`, `src/match.js` | fiche de match (avant, direct, entre deux manches, fini), moteur du direct, duel de deux joueurs (`d/`) | match |
| `src/players.css`, `src/players.js` | joueurs (grille, filtres, carte), fiche joueur, comparaison (`cmp/`), classement, spécial Worlds | joueurs |
| `src/team.css`, `src/team.js` | liste des équipes, fiche équipe | suisse |
| `src/swiss.css`, `src/swiss.js` | phase suisse, calendrier, phase finale, qui va gagner, fiabilité du robot | suisse |
| `src/stats.css`, `src/stats.js` | stats du tournoi (leaders, records, champions, ligues), faits, Worlds en chiffres | stats |
| `src/league.css`, `src/league.js` | mes paris, ligue de paris (ntfy), badges, robot membre, partage | ligue |
| `src/legacy/<module>.list.js` | extraits de la référence choisis par chaque module | le module du nom |
| `src/legacy.js` | **généré** par `build.js` (extraits triés par ligne) : ne pas modifier | build |
| `test/smoke.js` | parcours 3 téléphones (écrans de B, pari, retour, routes, clés) | socle (chacun ajoute ses tests dans `test/<module>.js`) |
| `test/inventaire_prod.js` | parcours en lecture seule de la prod v13.5 (plan des titres, captures `test/inv/`) | architecte |
| `tools/*.js` | outils à usage unique de l'architecte (découpe de B) : **ne pas relancer** | architecte |
| `dist/worlds-b.html` | résultat (un seul fichier, comme aujourd'hui) | build |

## 2. Construire et tester

```
node build.js              # écrit src/legacy.js et dist/worlds-b.html ; échoue sur doublon, extrait qui chevauche, node --check
node build.js --check      # même vérification, sans rien écrire
node build.js --who NOM    # NOM déclaré où (référence : extrait ou pas ; src/) et utilisé par quels fichiers
node build.js --free       # noms de la référence pas encore extraits mais déjà pris dans src/ (à renommer avant d'extraire)
node build.js --map        # plan de la référence (sections JS et CSS avec numéros de ligne)
node build.js --extracts   # extraits actuels, par module
node test/smoke.js [iphone12|pixel7|w360] [--local]   # --local : stats/fiche/draft lus dans lot1/data/*_pp.json
node test/inventaire_prod.js                          # prod v13.5 en lecture seule (aucune écriture, aucun pari)
node test/minscroll.js                                # dépassement (px) de quelques écrans à 360×740 : 0 ou ≥ 120, jamais un « mini défilement »
```

Critères permanents (chaque agent les vérifie avant de rendre) : `node build.js` vert ; `node test/smoke.js` sans erreur JS sur les 3 appareils (iPhone 12 390×664, Pixel 7, 360×740) ; aucun défilement horizontal ; chaque écran de premier niveau ≤ 1,5 hauteur d'écran (sauf listes) ; seules des clés `w26_` dans `localStorage`. Le JS est ES2020 sans dépendance (la carte des nationalités charge d3 et topojson à la demande, comme v13.5 : seule exception tolérée).

## 3. Assemblage et règles du JS

Un seul `<script>` en `"use strict"` : `legacy.js` → `shell.js` → `home.js` → `match.js` → `players.js` → `team.js` → `swiss.js` → `stats.js` → `league.js` → `boot.js`. CSS : `shell.css` puis `home`, `match`, `players`, `team`, `swiss`, `stats`, `league`.

- Tout est global (pas de modules ES). Un nom de haut niveau ne peut exister qu'une fois : `build.js` refuse les doublons et dit où ils sont.
- **Aucun rendu au chargement.** Un module ne fait que déclarer et s'enregistrer (`defScreen`, `defWidget`, `INFO.x=`, `INFOP.x=`, `onAct`, `BUS.on`). `boot()` (dans `boot.js`) démarre tout. Pas de `const X=fonctionDUnAutreModule()` au niveau du fichier (zone morte temporelle) : seulement des fonctions, des constantes littérales et des appels d'enregistrement.
- Mode strict : pas d'affectation à une variable non déclarée ; les fonctions déclarées dans un bloc sont locales au bloc.
- Nouveaux noms globaux préfixés par module, suivis d'une majuscule : `hom` (home), `mat` (match), `ply` (players), `tea` (team), `swi` (swiss), `sta` (stats), `lea` (league), ex. `matHudRow`, `plyCard`, `swiTree`, `leaJoin`. Le socle garde des noms courts documentés ci-dessous. Classes CSS nouvelles : même préfixe avec tiret (`.mat-hud`, `.swi-node`). Les noms repris de B (`scrMatch`, `tabRoles`…) et de v13.5 (`amRolesHTML`, `rkRow`…) gardent leur nom.
- Les noms déjà pris par le socle et le code de B : `node build.js --free` liste ceux qui entreraient en collision avec un extrait (35 aujourd’hui, dont `L2R` de live2 — identique à celui de match.js : supprimer celui de match.js si tu extrais live2 —, `skel` des blocs asynchrones, `toast`, `champ`, `loadSJ`, `loadAux`, `sync`, `startBeam`, `intro`, `paintLive`, `watchLive`, `liveTick`, `homeMoment`, `renderHome`, `col`, `hideSheet`, `closeSheet`, `APP_VERSION`). Déjà renommés côté refonte pour libérer les noms de v13.5 : le rang de B `rkTag(p)` s’appelle `rankChip(p)` (le `rkTag(x,i,…)` des classements de v13.5 reste libre), la date courte de B `fjDate` s’appelle `plyDay` (le `fjDate` de fiche_helpers reste libre). Avant d'extraire une plage qui en contient un : patcher l'extrait (renommer) ou supprimer la version de B si elle est reprise telle quelle.

### 3.1 Extraits de la référence (`src/legacy/<module>.list.js`)

```js
module.exports=[
 // [libellé, 1re ligne, dernière ligne, début exact de la 1re ligne, [[motif, remplacement], …] facultatif]
 ["fil du match",4933,5029,"const KF_DR",[["K.fr=keep;kfDerive(L);","K.fr=keep;if(!kfFeed.hold)kfDerive(L);"]]],
];
```

- Les lignes viennent **toujours** de `ref/worlds_v13_5.html` (figée), jamais du dépôt. Le « début exact » protège contre une erreur de ligne.
- Un remplacement doit trouver son motif **une seule fois** dans l'extrait, sinon le build échoue.
- Deux listes ne peuvent pas prendre des lignes qui se chevauchent (le build le refuse et nomme les deux). Tout est global : si l'extrait existe déjà dans une autre liste, utilise-le tel quel. Retirer un extrait : d'abord `node build.js --who NOM` pour chaque fonction qu'il contient.
- Les extraits sont émis **dans l'ordre des lignes de la référence**, quelle que soit la liste : l'ordre de dépendance de v13.5 est préservé.
- **Effets de bord au chargement** dans la référence (à ne pas extraire tels quels, ou à neutraliser par un remplacement) : 1364 `importProfile` (voulu, déjà extrait par le socle), 1388 `window.imgFail` (voulu, extrait), 1492 `bgMotes` (canevas `#bgfx` absent), 1552 gyroscope de la carte holo de v13.5, 1690 / 1787 / 1795 / 1796 écouteurs de l'accueil v13.5 et des faits, 1987 `popstate` de v13.5 (**à ne jamais extraire** : il casserait la pile d'écrans), 1993 `swipeToClose` (`#sheet` de v13.5), 2055-2098 écouteurs globaux de v13.5 (`$("#q")` plante si absent), 2372 puces `data-djm` (inoffensif), 3120 `data-fjgo`, 3187-3196 `toggle` + `data-ami`/`data-vs` (le `data-vs` appelle `amVsSheet`), 3642-3643 surcouches draft2 (voulues si on prend am_match + draft2), 4009-4016 `data-rkw`/`data-rkrole`/`data-gosim` (appellent `showTab`), 4025 migration de l'ancien duel (voulue, extraite), 4440 `funWire` (enrobe des fonctions de v13.5 : le prendre impose ces fonctions), 4639 / 4793 / 4824 / 4855 écouteurs du direct v13.5 (`#herolive`, `#sheet`), 5068 `toggle` du fil, 5345 `instrument` (remplace `window.leFetch`, `window.cargo`, `window.feedWin` par des versions chronométrées pour `HEALTH` : à reprendre avec le diagnostic, après les déclarations), 5399-5409 démarrage de v13.5 (**jamais**), 5420 `motion` (observe `#v-home`, `#v-swiss`, `#sheetBody` : à réécrire).
- Plan de la référence : `node build.js --map`. CSS de v13.5 (lignes 12-1183) par section : barre 45, onglets 58, logos 77, héros 83, lignes 131, faits et anneau 173, arbre suisse 192, équipes 213, cartes holo 228, carte du monde 257, fiches 277, face-à-face 286, bannière équipe 319, grande carte 331, intro 341, stats 358, comparaison et classements 426, duel 1v1 502, navigation des fiches 528, direct 543, fil et portraits 574, fiche_helpers 599-623, am_match 624-729 (clés 632, postes 643, replis 666, duel détaillé 679, draft du direct 707, entre deux manches 723), ligue 730, accueil selon le moment 756, diagnostic 784, faits 793, classements / spécial Worlds / qui va gagner 817-899, motion 900-915, live2 916-996, draft2 997-1047, fun 1048-1091 (records 1049, podium 1061, badges 1079), uxg 1092-1119, hud 1120-1182. Une classe reprise de v13.5 est recopiée **dans le CSS du module** et restylée façon B (rayons, cartes `.blk`, or et sarcelle).

### 3.2 Extraits déjà pris

`node build.js --extracts`. Au départ : socle 23 (constantes, équipes, phases, embarqué, utilitaires et `LS`, profil emporté `#moi=`, images, état et `finalize`/`records`/`status`, sursis, nombres, `applySJ`, `lpPause`/`isRL`, aides draft.json, **blocs asynchrones `ablock`** (son `skel` renommé `akSkel`), `tiles`/`champList`, modèles du robot, `robotProb`, décodeurs fiche.json, **petits outils am*/ux*** (3141-3201 : `AM_OPEN`, `amO`, `uxFold`, `uxTiles`, `uxChamps`, `uxBetsLine`, `uxLeads`, `amPl`, `amSg`, `amDay`, `amWhen`, `amI`, `amIP`, `amH2`, `amBetter`, `amSnapOpen`… ; l'écouteur `data-vs` de v13.5 y est retiré), accès `SJ.rk`, état de la ligue, LoL Esports avec un second essai), match 7 (clés du match, flux, joueur d'après le pseudo, `winProb`, fil du match avec rattrapage groupé, affichage du fil, portraits), ligue 1 (encodage des paris, relais ntfy, points, classement, robot membre, liens : 4033-4148, **protocole à garder tel quel**).

## 4. API du socle

### 4.1 Écrans et routes

```js
defScreen("m",{arg:"idtab",screen:scrMatch});          // #m/<id>/<onglet>
defScreen("rk",{arg:"id",screen:scrRank,parse:a=>({v:"rk",id:a||"TOP"})});
go("p/T1_faker");  go("m/"+m.id+"/dr");                 // ouvre un écran (toast « Bientôt dans l'appli » si la route n'existe pas)
```

- `arg` : `"none"` (`#v`), `"id"` (`#v/id`), `"tab"` (`#v/onglet`), `"idtab"` (`#v/id/onglet`). `parse(a,b)` et `route(d)` pour un cas particulier. `d` = `{v, id?, tab?, …}` ; il reste attaché à l'écran (`el._d`) : on peut y ranger un sous-état (ex. `d.g` = partie choisie).
- `screen(d)` rend un **objet écran** (appelé à l'ouverture et à chaque `rerender`) :

| Champ | Rôle |
|---|---|
| `title` | HTML du titre de la barre (une ligne + `<small>` facultatif) |
| `info` | clé de feuille « i » de la barre (bouton `i` en haut à droite) |
| `head` | HTML sous la barre, au-dessus des onglets (héros du match, carte du joueur…) ; `headKey` : clé de changement (sinon comparaison du HTML) |
| `tabs` | `[["ov","Aperçu"],["pl","Joueurs"],…]` : contrôle segmenté collant (2 à 5 onglets) ; seul l'onglet visible est construit |
| `render(tab)` | HTML de l'onglet ; `body` : HTML fixe s'il n'y a pas d'onglets |
| `mount(el)` | après chaque rendu complet (faisceau, inclinaison…) |
| `needs` | promesses (`loadFJ()`, `loadDJ()`…) : l'écran se redessine quand elles aboutissent |
| `opened(el)` | une fois, à l'ouverture |
| `onData(el)` | après chaque synchro (`onData` du socle) |
| `skipData(d)` | `true` : pas de rerendu à la synchro (écran repeint par le direct) |

- Pile : `NAV` (tableau `{d, el, origin}`), `HOME` (section de l'accueil), `topScreen()`, `openScr(d, origine, instantané)`, `back()` (ferme la feuille d'abord), `rerender(el)` (garde le défilement ; refait tout si les onglets ou la tête changent), `setTab(el, k)`, `refreshTab(el, dir)`.
- Transitions : l'écran « grandit » depuis la carte touchée si elle a une des classes `.w .role .mrow .rowb .rkr .pl .simr` (liste `GROW`), sinon il glisse depuis la droite. Retour : flèche, glisser depuis le bord gauche (24 px), bouton retour Android (history API : chaque écran est une entrée `#route`, chaque feuille une entrée de plus). Glisser horizontalement sur le contenu : onglet voisin. `prefers-reduced-motion` : rien n'anime.
- Lien profond : l'adresse `…/worlds-b.html#p/T1_faker` ouvre l'écran au démarrage (`START_HASH`).

### 4.2 Onglets, blocs et composants (CSS de `shell.css`)

Écran type : `.bar` (retour, titre, `i`) → tête → `.segw .seg` (onglets) → `.tabc` (contenu, marge 16 px). Composants partagés (ne pas les redéfinir, les composer) :

| Composant | Usage |
|---|---|
| `.blk` + `.bh` (titre en capitales or) + `<button class="i" data-info="…">i</button>` | bloc arrondi d'un onglet ; l'explication va derrière le `i` |
| `.bigvs` (`.a .n`, `.c`, `.b .n`) + `splitBar(p,c1,c2)` | deux grands chiffres face à face et la barre |
| `.pk2 .pkb` | deux boutons de pari (`data-pick`, `data-mk`, `aria-pressed`) |
| `.keys .key` (`.kn` grand chiffre, `.kt` texte, `.chev`) | liste de faits cliquables |
| `.vl` (+ `.vhd` en-tête) | une stat, deux équipes ou deux joueurs, barre fine |
| `.list .rowb` (`.grow`, `b.nm`, `small`, `.num`) | ligne cliquable (≥ 52 px) |
| `mrow(m)` → `.mrow` | ligne de match (heure ou LIVE, logos, score ou favori du robot, pastille de prono) |
| `.day` | intertitre de jour (Cinzel) |
| `hcard(p, "mini")` → `.hc` | carte holo de joueur (photo, rôle, logo, coupe ×n, reflet) |
| `heroBg(m)` + `<canvas class="beam">` dans `.hero` | fond de héros aux couleurs des deux équipes, faisceau (`startBeam(canvas)`) |
| `.lp .lps .lgd` | ligne joueur contre joueur (direct, feuille de partie, rencontres) |
| `.drr .chc` | ligne de draft par poste (icônes + compte) |
| `.chip` (`.gold`), `.tag` (`.on`, `.w`), `.rk` (`.top`) | puce, étiquette, rang au poste (`rankChip(p)`) |
| `.split`, `.wpb/.wpl`, `.ring` + `ringSVG(p)` | barres et anneau |
| `.empty`, `.note`, `.btn`, `skel(h,n)` | vide, note, bouton pleine largeur, squelette de chargement |

Couleurs : `cpair(t1,t2)` / `cA(m)` / `cB(m)` (repli or/sarcelle si les deux couleurs d'équipe se confondent : **à utiliser pour toute barre à deux équipes ou deux joueurs**). Jetons : `--gold --gold2 --gold3 --teal --red --card --card2 --line --line2 --muted --dim`, rayons `--r1` 28, `--r2` 22, `--r3` 16, `--r4` 12, polices `--title` (Cinzel), `--disp` (Barlow Condensed), `--body` (Barlow). Aides : `P(p)` (« 49 % » avec espace fine), `NB` (U+202F), `plur`, `ordi`/`ordS`, `sgn`, `kf1` (or en k), `fx1`/`fx2`, `esc`, `tid`, `col`, `logo`, `photo`, `flag`, `champ`, `stageLab`, `whenTxt`, `cdText` + attribut `data-cd="<ms>"` (compte à rebours rafraîchi chaque seconde sur l'écran du dessus).

### 4.3 Feuilles « i »

```js
INFO.roles=()=>["Duel par poste","texte simple"];            // [titre, texte] ou [titre, html, true]
INFOP.key=(id,i)=>["La clé en détail",html,true];           // data-info="key:<id>:<i>"
data-info="${xi("ban|"+t+"|"+c,()=>[c,`<p>${raison}</p>`,true])}"   // feuille construite au toucher
showSheet("Titre",html,true);  closeSheet();
```

Feuille du bas (78 % de hauteur max), fermée par la croix, le fond, le retour Android ou Échap. Règle : à l'écran, la réponse en une ligne ; le comment et le pourquoi derrière `i`.

### 4.4 Widgets de l'accueil

```js
defWidget("sim",(k,big)=>W(big?"w22":"w21","sim",`<div class="wh">Qui va gagner ?<em>…</em></div><div class="wb">…</div>`,k,"","Qui va gagner ?"));
widget("sim",n())   // dans home.js uniquement
```

`W(classe, route, html, k, style, libellé)` : tuile `role=button data-go=route`. Tailles : `w11` (carré 136 px), `w21` (pleine largeur 112 px), `w22` (héros 284 px, `padding:0`). `.wh` (titre or + `<em>` à droite), `.wb` (corps aligné en bas), `.wn` (grand chiffre), `.ws` (sous-ligne). L'**ordre et le choix** des widgets selon le moment (`homeMoment()` : live, soon, day, after, rest ; `?mo=` force) appartiennent au socle (`renderHome`). Widgets fournis aujourd'hui : `bets`, `league`, `livebets` (ligue), `sim` (suisse), `rank` (joueurs), `fact` (stats) ; dans home.js : héros, prochain, ce soir, calendrier, bilan de la soirée. Un module qui veut un nouveau widget l'enregistre et demande sa place dans `DEMANDES.md`.

### 4.5 Données

| Nom | Contenu |
|---|---|
| `MATCHES` | matchs triés : `{id ("le…"), key (mkey), stage (pi, sw, qf, sf, f), round, label, t1, t2, n1, n2, s1, s2, bo, start (ISO), state (soon, live, wait, done), winner, manual, apiLive, unst}` |
| `SJ` / `loadSJ(force)` | stats.json du robot (relu au plus toutes les 10 min) ; clés : `v src since teams h2h duels players tourney champs mastery names logos pinfo dr m sim lane fiab lgr rk cover errors stale sched fl pm fx fu meta built` |
| `FJ` / `loadFJ()`, `DJ` / `loadDJ()`, `loadAux(nom)` | fiche.json, draft.json (et tout autre fichier du robot) |
| `CH` / `champMap()`, `champ(n, taille)`, `champNm`, `champImg` | Data Dragon (cache `w26_champs2`, 7 jours) |
| `sync()`, `quickStart()`, `onData()` | planning : LoL Esports, sinon planning du robot, sinon embarqué ; toutes les 60 s quand un match est chaud, sinon 5 min |
| `SOURCE`, `lastSync` | origine du planning (« LoL Esports », « robot », « hors ligne ») |
| `picks`, `scores`, `manual`, `fav`, `celebrated`, `lg`, `ui` | état de v13.5, mêmes variables, mêmes clés `w26_` |
| `records()`, `status(id)`, `lives(id)`, `stakeTxt(m)`, `seriesFav(m)`, `robotProb(m)`, `robotPast(m)`, `fiabW26()`, `rkOf(p)`, `rkFind(key)`, `RKX()`, `nextOf(team)`, `oppOf(p,m)`, `mOf(id)`, `pkey(key)`, `teamPlayers(id)` | calculs partagés |

Bus d'événements : `BUS.on(évt, fn)`, `BUS.off`, `BUS.emit`.

| Événement | Émis par | Arguments |
|---|---|---|
| `boot` | socle, accueil posé | — |
| `data` | socle, après chaque synchro (accueil et écrans déjà redessinés) | — |
| `sj` | socle, nouveau stats.json (champ `built` différent) | `SJ` |
| `pick` | socle, après un pari ou une annulation | clé, équipe ou `null`, bouton |
| `live` | match, après chaque image du flux | `m` |
| `league` | ligue (à émettre quand la ligue change) | — |

### 4.6 Direct

Le moteur appartient au module match : `watchLive(m)` (une seule partie suivie, toutes les 10 s, 30 s onglet caché), `LV.games[m.key]` (`{status: waiting|between|live|ended|nolive, frame, meta, kf, blue, red, num, gid, teams, games}`), `paintLive(m)` repeint ses écrans puis émet `BUS "live"`. Un autre module qui affiche du direct s'abonne (`BUS.on("live",m=>…)`) et repeint seulement son élément (ex. home.js : `#wlive`). Un écran entièrement repeint par le direct déclare `skipData`.

### 4.7 Pari en un geste

```html
<button class="pkb" data-pick="T1" data-mk="${esc(m.key)}" aria-pressed="${picks[m.key]==="T1"}">…</button>
```

Le socle gère le toucher (`setPick(clé, équipe, bouton)`) avec la règle de v13.5 : toucher l'équipe déjà choisie **annule** le prono (et le score exact) ; refusé après le coup d'envoi (« Paris fermés : le match a commencé ») ; écrit `w26_picks` et `w26_scores` ; met à jour tous les boutons de ce match ; émet `BUS "pick"`. La ligue s'y abonne pour publier (`duelPickChanged`), les confettis et le score exact sont à elle.

### 4.8 Actions et attributs

- `onAct(sélecteur, fn(élément, évt))` : action d'un module, testée après `data-tab` et avant la navigation (ex. match : `[data-gm]`, `[data-game]` ; stats : `[data-fx]`).
- Navigation : `data-go="route"`, et les attributs de v13.5 repris tels quels dans les rendus portés : `data-p="clé"` → `p/clé`, `data-t="T1"` → `t/T1`, `data-m="id"` → `m/id`, `data-cmp="a|b"` → `cmp/a~b` (comparaison), `data-vs="a|b"` → `d/a~b` (duel). Le plus proche de l'élément touché l'emporte.
- `data-info` (feuille), `data-pick` + `data-mk` (pari), `data-back`, `data-tab` : socle.

### 4.9 Compatibilité avec les rendus de v13.5

Pour qu'un rendu repris tel quel fonctionne : `renderLive()`, `renderAll()` (→ `onData()`), `refreshSheet()` (→ rerendu des écrans), `renderHome()` sans argument (→ accueil), `HM` (dernier moment, `HM.k`), `sheetState` (toujours `null`), `curTab` (`"home"`). `ablock(clé, ()=>données, rendu(données), durée en heures)` (extrait par le socle) : squelette (`akSkel()`), données mises en cache dans `w26_ak_<clé>` (mêmes clés et mêmes données que v13.5 : les caches déjà présents chez les potes servent tout de suite), invalidées par un nouveau stats.json, erreur avec « Réessayer » (bouton géré par le socle), chargement quand le bloc devient visible (les écrans défilent dans un conteneur : la marge d'avance de 300 px de v13.5 ne joue plus ; un bloc qu'on veut tout de suite peut appeler `runAk(clé)` lui-même ; vérifié par `smoke.js`, contrôle `ablock`). Le résultat remplace directement le contenu du `[data-ak]` (pas de rerendu de l'écran). Classes de v13.5 déjà restylées façon B dans `shell.css` (section « compatibilité ») : `.small .sub .h3 .ak .skel .aerr .tiles/.tile .clist/.crow details.uxf .ami .amip .amh2 ul.why dl.kv .split.mini`. Les autres classes d'un rendu repris vont dans le CSS du module, restylées.

**Mini défilement (demande de Thomas : « bien tout cadrer »)** : mesuré par `test/minscroll.js` (360×740). Deux causes dans B : (1) `.tabc{min-height:60vh}` fait défiler un écran à tête (match, joueur) de 40 à 80 px même quand l'onglet est presque vide (ex. match terminé › Joueurs : contenu 94 px, `min-height` 444 px, dépassement 56 px) ; (2) un contenu qui dépasse de peu (Qui va gagner : 38 px). Règle : dépassement = 0 px, ou un vrai défilement (≥ 120 px). Le socle retire le `min-height` (et garde l'onglet à sa place autrement) ; chaque module compacte ses écrans qui dépassent de moins de 120 px.

### 4.10 Typographie automatique

`typoFix(texte)` et `typoNode(nœud)` : appliqués par le socle à tout nœud texte ajouté ou modifié (pas aux attributs `title`/`aria-label` : y écrire U+00A0 et U+202F soi-même).

### 4.11 Effets

`intro()` (trophée, une fois par session, `w26_intro` en sessionStorage, `?nointro`), `startBeam(canvas)` (faisceau entre les deux logos d'un `.hero`, en pause hors champ et sous un autre écran), `tiltOn(el)` (carte holo `[data-tilt] .hc` inclinée au gyroscope), `warm()` (prépare hors champ les écrans probables pendant un temps mort). Animations : `transform` et `opacity` seulement, une fois, jamais en boucle hors intro/faisceau/reflets ; rien si `RM` (`prefers-reduced-motion`).

## 5. Compatibilité absolue (même adresse que v13.5)

### 5.1 localStorage (préfixe `w26_`, JSON) et sessionStorage

| Clé | Format | Écrite par (v13.5) | Dans la refonte |
|---|---|---|---|
| `w26_picks` | `{clé: "T1"}` | pari | socle (`setPick`) |
| `w26_scores` | `{clé: "2-1"}` (score exact du vainqueur choisi, Bo3/Bo5) | puces de score | ligue |
| `w26_manual` | `{clé: "T1"}` (vainqueur saisi quand le résultat tarde) | fiche du match en attente | match (lu par `finalize`) |
| `w26_fav` | `"T1"` ou `null` | Mon équipe | socle (accueil, réglages) et équipe |
| `w26_celebrated` | `{clé: 1}` (prono gagné déjà fêté) | célébration | ligue |
| `w26_league` | `{code, me:{id,name}, owner, gage, players:{id:{name, p:{clé:{w,sc}}, ts}}}` | ligue | ligue |
| `w26_myname` | `"Prénom"` | création ou entrée dans une ligue | ligue |
| `w26_lgRank` | rang dans la ligue (toast « tu passes 2e ») | ligue | ligue |
| `w26_duel` | ancien format (migré puis mis à `null`) | v10 | socle (migration extraite) |
| `w26_lsv` | id du dernier fait vu | faits | stats |
| `w26_champs2` | `{t, v, map, nm}` Data Dragon | icônes | socle |
| `w26_tnames`, `w26_lp_players`, `w26_le_photos` | caches Leaguepedia et LoL Esports (24 h, 7 j) | photos, noms | socle (si repris) |
| `w26_ak_<bloc>` | `{t, d}` cache des blocs asynchrones (ablock), invalidé par `SJ.built` | tous les blocs | chaque module (si repris) |
| `w26_fun_eve` | `{dk, m}` feuilles de la soirée pour le podium | fun | socle (bilan de la soirée) |
| `w26_mv_lb_<code>` | ordre du classement vu la dernière fois (animation) | motion | ligue |
| sessionStorage `w26_intro` | intro déjà vue | intro | socle |

Le transfert de profil `#moi=<base64>` ne transporte que `league, picks, manual, scores, fav, myname` (`MOVE_KEYS`) : extrait par le socle, il s'applique **avant** toute lecture (première ligne de `legacy.js` qui touche au stockage).

### 5.2 Adresses

- `…#moi=…` : reprise de profil (confirmation si un autre profil existe), puis le hachage est effacé.
- `…?ligue=CODE&g=gage&n=prénom` (ou `?duel=CODE`) : invitation, ouvre « Rejoindre la ligue » (`readDuelParams`, extrait par la ligue, à brancher sur un écran).
- `#route` : lien profond vers un écran de la refonte (nouveau).

### 5.3 Ligue (ntfy.sh) — protocole inchangé

Sujet `iagames-worlds26-ligue-<CODE>` (code de 4 caractères parmi `ABCDEFGHJKMNPQRSTUVWXYZ23456789`) ; publication `POST https://ntfy.sh/<sujet>` du JSON `{v:3, id, name, p, ts, hello, owner, gage}` où `p` = `clé~équipe~score` joints par `.` ; écoute `GET …/sse?since=all` (EventSource), repli `GET …/json?poll=1&since=<dernier id|all>` toutes les 12 s ; on ignore ses propres messages et les doublons (`id` ntfy) ; un `hello` reçu déclenche une republication après 0,3 à 2,8 s ; publication 600 ms après un pari, nouvel essai 8 s après un échec ; le gage du créateur (`owner`) s'impose. Diagnostic : sujet `iagames-worlds26-ping`. Tout cela est dans l'extrait 4033-4148 (`encPicks`, `decPicks`, `payload`, `publish`, `handleMsg`, `duelConnect`, `pollOnce`, `onLeagueData`, `pts`, `standings`, `members`, `robotBets`…) : on l'appelle, on ne le réécrit pas.

### 5.4 Données du robot et API

`https://raw.githubusercontent.com/Vialou07/IA_Games/stats/data/{stats,fiche,draft}.json` (`cache:"no-cache"`), API LoL Esports (`x-api-key` publique, `getSchedule`, `getEventDetails`, `getLive`, `getTeams`), flux `https://feed.lolesports.com/livestats/v1/window|details/<gid>?startingTime=…` (fenêtres de 10 s, jamais à moins de 20 s du présent). Copies locales pour les tests : `lot1/data/{stats_pp,fiche_pp,draft_pp}.json` (`--local`).

## 6. Règles de design et d'écriture (rappel)

- Style de la maquette B : bleu nuit, or, sarcelle, rayons 20-28 px, Cinzel (titres de marque, intertitres de jour), Barlow Condensed (chiffres, noms), Barlow (texte). Pas d'emoji décoratif (v13.5 en a : 🏆 🎯 🔥 🦊 📊 ✅ ❌ 🔒 → icônes SVG ou mots), pas de dégradé violet, pas de verre dépoli générique.
- Une réponse visible en 2 secondes ; le détail à un toucher (écran suivant ou ligne qui se déplie) ; la méthode derrière `i`. Chaque écran de premier niveau ≤ 1,5 hauteur d'écran (listes exceptées) ; le « mini défilement » d'un écran qui tient presque est à supprimer (Thomas : « bien tout cadrer »).
- Cibles tactiles ≥ 40 px ; aucun défilement horizontal (l'arbre suisse de v13.5, large de 930 px, doit être repensé en vertical) ; texte ≥ 11 px.
- Typographie française dans l'interface : espace insécable U+00A0 avant « : », espace fine U+202F avant « % ; ? ! » (constante `NB`), guillemets « », apostrophe ’. Tutoiement. Le socle corrige automatiquement chaque nœud texte posé dans la page (`typoFix`, MutationObserver sur `body`) : les textes de B et de v13.5 sortent juste sans retouche ; `smoke.js` vérifie qu'il ne reste aucune espace ordinaire avant ces signes (`typoHome`, `typoMatch`). Écrire quand même les nouveaux textes correctement.
- Animations sobres : `transform` et `opacity`, `prefers-reduced-motion` respecté.

## 7. Carte cible de l'appli (routes, onglets, propriétaires)

Niveaux : **N1** visible sans toucher sur l'écran, **N2** un toucher (ligne qui se déplie, écran suivant), **N3** derrière `i`.

| Route | Écran | Onglets (dans l'ordre) | Module |
|---|---|---|---|
| (accueil) | widgets selon le moment, puis accès à toutes les sections (Calendrier, Suisse, Équipes, Joueurs, Stats, Ligue) ; pastille de synchro → `set` | — | socle |
| `set` | Réglages et état : mon équipe, emporter mon profil, version, sources, diagnostic, copier le rapport | — | socle |
| `eve/<jour>` | Bilan d'une soirée : résultats, tes paris, meilleure soirée de la ligue, surprises du robot, podium des joueurs | — | socle |
| `m/<id>/<onglet>` | Match à venir | Aperçu · Joueurs · Draft · Équipes | match |
| — | Match en direct (et entre deux manches, et en attente du résultat) | Direct · Joueurs · Draft · Avant | match |
| — | Match terminé | Résumé · Parties (si série) · Joueurs · Draft | match |
| `d/<a>~<b>/<onglet>` | Duel de deux joueurs du même poste (ouvert depuis Match › Joueurs, `data-vs`) : verdict, rencontres en lane, vis-à-vis communs ; « Toutes leurs stats » → `cmp/` | Duel · Champions · Forme | match |
| `cmp/<a>~<b>` | Comparaison de deux joueurs (`data-cmp`, fiche joueur, classement) : le plus fort ligues comprises, saison 2026, champions 2026, duels directs, changer d'adversaire | Saison · Champions · Duels | joueurs |
| `p/<clé>/<onglet>` | Fiche joueur | Aperçu · Saison · Duels · Champions | joueurs |
| `pl/<onglet>` | Joueurs : grille de cartes holo, recherche, filtres (poste, champions du monde, nationalité), carte du monde | Cartes · Carte | joueurs |
| `rk/<poste>` | Classement par poste (note d'impact ; stats brutes au choix) | Top · Jungle · Mid · ADC · Support | joueurs |
| `spe` | Spécial Worlds | Équipes · Joueurs | joueurs |
| `teams` | Les 19 équipes (filtre par ligue) | — | suisse (team.js) |
| `t/<id>/<onglet>` | Fiche équipe | Aperçu · Saison · Matchs | suisse (team.js) |
| `sui/<onglet>` | Phase suisse | Ronde · Tableau · Bilans · Finale | suisse |
| `sim/<onglet>` | Qui va gagner ces Worlds | Titre · Tableau · Robot | suisse |
| `cal/<onglet>` | Calendrier (filtre de phase) | À venir · Résultats | suisse |
| `st/<onglet>` | Stats du tournoi | Tournoi · Leaders · Champions · Ligues | stats |
| `fx/<n>` | Le saviez-vous ? (un fait, précédent / suivant) | — | stats |
| `bets/<onglet>` | Mes paris | À parier · En attente · Bilan | ligue |
| `lg/<onglet>` | Ligue (sans ligue : créer ou rejoindre) | Classement · Paris · Badges · Réglages | ligue |

Les écrans existants de B (`m`, `d`, `p`, `rk`, `sim`, `cal`, `fx`, `bets`, `lg`) gardent leur route ; les onglets ci-dessus sont la cible (le propriétaire peut ajuster, en le notant dans `DEMANDES.md` s'il change une route utilisée par un autre).

## 8. Protocole `DEMANDES.md`

Une ligne par demande : `- [ouverte] <date heure> <de> → <à> : <quoi> — <pourquoi>`. Le destinataire passe la ligne à `[faite]` ou `[refusée : raison]`. Exemples : un widget à placer sur l'accueil (→ socle), un extrait déjà pris à patcher (→ propriétaire de la liste), une route ou un attribut à ajouter au socle.

## 9. Répartition du portage (identifiants de `INVENTAIRE.md`)

| Agent | Fichiers | À porter |
|---|---|---|
| socle | `shell.*`, `home.*`, `boot.js`, `index.html`, `build.js` | S-01 à S-27 (sauf mentions), accueil A-01, A-02, A-04, A-06 (avec la ligue), A-08, A-09, A-10, A-17, A-19 et la matrice des moments (§ 14), accès aux sections depuis l'accueil, écrans `set` et `eve`, `mrow` (C-04), G-01 à G-06, J-05, `confetti` (S-07), défauts X-01 (mini défilement), X-06 |
| match | `match.*` | A-03, A-05, M-01 à M-08 (place et rendu), MA-01 à MA-05, duel D-01 à D-06, D-12 (écran `d/`), MD-01 à MD-18, MB-01 à MB-04, MF-01 à MF-07, moments animés 1, 3 et 4 (S-13), X-02, X-07, X-08 |
| joueurs | `players.*` | A-13, J-01 à J-12, P-01 à P-14, comparaison D-07 à D-11, D-13 (écran `cmp/`), écrans `pl` et `spe` |
| suisse | `swiss.*`, `team.*` | A-12, C-01 à C-05, W-01 à W-11, E-01 à E-11, écrans `sui`, `teams`, `t/`, moment animé 2 (S-13), X-10 |
| stats | `stats.*` | A-11, A-18, T-01 à T-09, T-20, F-01, F-02 (aide partagée pour les faits d'une fiche), écran `st` |
| ligue | `league.*` | A-07, A-14 à A-16, L-01 à L-19, M-04 et M-06 (blocs placés par le match), confettis et célébrations, moment animé 5 (S-13), X-03 à X-05 ; brancher `BUS "pick"` → `duelPickChanged`, `duelConnect` au démarrage si `lg`, `readDuelParams` |

Ordre conseillé dans chaque module : d'abord ce qui est visible au premier niveau (N1) des écrans existants de B, puis les nouveaux écrans, puis le N2 et le N3. Chaque agent garde la maquette B comme référence visuelle (`lot1/designB/shots/`) et la prod v13.5 comme référence de contenu (`test/inv/`).
