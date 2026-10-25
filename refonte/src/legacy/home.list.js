/* Extraits de la référence figée pris par le module home (accueil, bilan d'une soirée). Format : voir shell.list.js.
   Aides fun (FUN, funFu, funNm, funTm, funPc… 4230-4242) : extraites par le module match (« records en vue »), utilisées telles quelles. */
module.exports=[
 ["fun : podium des joueurs de la soirée (funFromRobot, funFromFeed, funEveLines, funFetch, funPodium, funWhy) ; cache w26_fun_eve",4313,4381,"// une ligne par joueur",[
   // feuilles lues : l'accueil et l'écran ouvert (bilan) se redessinent (v13.5 ne repeignait que l'accueil)
   ['if(got&&curTab==="home"&&!sheetState)renderHome();','if(got){renderHome();refreshSheet()}']]],
];
