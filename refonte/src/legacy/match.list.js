/* Extraits de la référence figée pris par le module MATCH (avant-match, direct, fil, draft, feuille de match, duel). Format : voir shell.list.js.
   Seule la LOGIQUE de calcul est reprise (données, phrases, modèles) ; les rendus sont réécrits dans src/match.js au style de B. */
module.exports=[
 ["draft : méthode et fiabilité des duels de champions (djMuNote)",2294,2299,"/* méthode et fiabilité des duels de champions"],
 ["draft : phrases de fiabilité, conseil de bans, données d'avant-match (draftMatchData, cache dj_*)",2304,2325,"function djFi"],
 ["clés du match (SJ.pm) : phrases, taux, fiabilité, table de référence ; correction du prono après la draft (draftAdjust, draftFeat, draftSides, gameProbE)",2793,2881,"const ROLE_AU"],
 ["avant-match : champions brûlés, repli stats.json, données des duels par poste (amRolesData, cache amr_*)",3229,3251,"function amBurned"],
 ["duel : vis-à-vis communs, données (amVsData, cache amv_*), verdict",3296,3330,"function amCommon"],
 ["direct : données de la draft de la partie (amLiveDraftData)",3438,3451,"async function amLiveDraftData"],
 ["fiabilité des picks en une phrase (amFiShort)",3483,3484,"function amFiShort"],
 ["draft2 : prono de draft figé, draft réelle, comparaison, résumé, détail, pied",3497,3568,"const D2R"],
 ["draft2 : fearless de la série, données (d2FearlessData, cache d2f_*)",3600,3612,"async function d2FearlessData"],
 ["fun : records en vue en direct (aides, candidats, phrases, détail)",4230,4303,"const FUN="],
 ["live2 : fights, duels marquants, bascule, joueur du match, tableau (calculs)",4520,4628,"const L2R"],
 ["flux direct : fenêtres, matchs en cours",4467,4473,"const FEED"],
 ["flux direct : joueur d'après son pseudo, mesures d'écart d'or (pushSample)",4480,4485,"function playerFromSummoner"],
 ["chances de victoire, temps de jeu, dragons",4869,4879,"function winProb"],
 ["fil du match (différence d'images du flux)",4933,5029,"const KF_DR",[
   ["g:B.totalGold+R.totalGold>0?1:0};","g:B.totalGold+R.totalGold>0?1:0,gd:B.totalGold-R.totalGold};"],
   ["K.fr=keep;kfDerive(L);","K.fr=keep;if(!kfFeed.hold)kfDerive(L);"],
   ['for(const [w,j] of res){if(j==="err")','kfFeed.hold=true;for(const [w,j] of res){if(j==="err")'],
   ["if(!(j&&j.frames&&j.frames.length))K.got.add(w)}","if(!(j&&j.frames&&j.frames.length))K.got.add(w)}kfFeed.hold=false;kfDerive(L);"]]],
 ["fil : affichage (kfMS, kfWho, kfTm)",5031,5034,"const kfMS"],
 ["fil : portraits, mort, âme",5062,5067,"function kfFace"],
 ["feuille de match : flux détaillé, parties terminées lues dans le flux (matchGames, cache games_*), vainqueur de chaque partie",5072,5110,"async function feedDetails"],
];
