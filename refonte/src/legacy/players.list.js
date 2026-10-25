/* Extraits de la référence figée pris par le module players (agent joueurs). Format : voir shell.list.js.
   Ces fonctions sont globales : les autres modules peuvent les appeler (ex. rkDuel1 pour le duel d/, fmtShort/tourName
   pour un face-à-face d'équipes) mais ne doivent pas reprendre les mêmes lignes dans leur liste. */
module.exports=[
 ["carte du monde : coordonnées des pays, Allen, chargement d3 à la demande",1926,1929,"const GEO="],
 ["dates courtes, noms de tournois (séries, face-à-face)",2122,2133,"const fmtMonth="],
 ["stats 2026 par joueur : PSTAT, MINR, ROLEP, seasonOf, statVal, ranking, rankOf",2660,2673,"const SV2="],
 ["adversaire par défaut d'une comparaison (bestFoe)",2683,2684,"function bestFoe"],
 ["fiche.json : données (ficheData, encData) et mise en forme (fjPhase, fjDate, fjWhen, fjSg, fjGd, fjAvg, FJ_AX…)",2989,3017,"/* ---------- données pour ablock"],
 ["classements : raisons d'un rang (rkStat, rkTag, rkLine, rkReason, rkWhy)",3702,3727,"/* stat de saison (brute)"],
 ["classements : méthode (rkMethod)",3740,3743,"function rkMethod"],
 ["classements : phrase-réponse du meilleur au poste (rkBest1)",3748,3753,"function rkBest1"],
 ["qui domine qui au même poste (rkPair, rkDuel1, rkExp1, rkVsHTML, rkGapLi)",3781,3808,"/* ---------- qui domine qui"],
 ["Spécial Worlds : phrases et détails (rkWorlds1, rkWorldsP1/P2, rkWorldsT1/T2, rkWorldsMethod)",3810,3841,"/* ---------- 2. « Spécial Worlds »"],
 ["fiche joueur : vis-à-vis désignés (rkFjPair, rkFicheData, RK_DES)",3913,3930,"// bilan de p contre un adversaire"],
];
