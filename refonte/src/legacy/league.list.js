/* Extraits de la référence figée pris par le module LIGUE. Le protocole ntfy (payload v3, encPicks, handleMsg…) doit rester
   identique à v13.5 : ne pas le réécrire, seulement l'appeler. Format : voir shell.list.js.
   Remplacements (le protocole n'est pas touché) :
   - standings(L) : accepte une liste de membres (sans ligue : toi + le robot, mêmes règles de points et de départage) ;
   - renderSoon : redessine l'accueil ET les écrans de la refonte qui montrent la ligue (leaChanged) au lieu de la feuille de v13.5 ;
   - standings : rattrapage des retardataires (leaCatchUp, league.js) avant le tri ;
   - checkRank : confettis par leaBoom (sans erreur tant que le socle n'a pas posé confetti). */
module.exports=[
 ["ligue : encodage des paris, relais ntfy, points, classement, robot membre, liens d'invitation",4033,4148,"/* ---- paris : encodage compact",[
   ['renderHome();if(sheetState&&sheetState.k==="m")refreshSheet(true)','leaChanged()'],
   ["function standings(){\n  const all=members(),","function standings(L){\n  const all=L||members(),"],
   ["  all.sort((a,b)=>b.pts-a.pts||","  leaCatchUp(all,done);\n  all.sort((a,b)=>b.pts-a.pts||"],
   ['confetti(innerWidth/2,innerHeight*.3,["#C8AA6E","#F0E6D2","#0AC8B9"],110)','leaBoom(innerWidth/2,innerHeight*.3,["#C8AA6E","#F0E6D2","#0AC8B9"],110)']]],
 ["ligue : badges (Flair, Bat le robot, Audacieux, Devin, Série), calcul seul",4384,4406,"function funBadges(){"],
];
