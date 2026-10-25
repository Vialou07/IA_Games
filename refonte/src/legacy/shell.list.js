/* Extraits de la référence figée (ref/worlds_v13_5.html) pris par le SOCLE : modèle de données et décodeurs partagés.
   Format d'une entrée : [libellé, 1re ligne, dernière ligne, début exact attendu de la 1re ligne, [[motif, remplacement], …]]
   (chaque motif doit apparaître une fois dans l'extrait). Ne retire jamais un extrait sans « node build.js --who NOM ». */
module.exports=[
 ["constantes (postes, ligues)",1233,1235,"const ROLES"],
 ["les 19 équipes",1237,1295,"const TEAMS"],
 ["lieux et phases",1297,1304,"const VENUES"],
 ["matchs embarqués, jours sans affiche",1306,1339,"const EMBED"],
 ["utilitaires, champions du monde, joueurs, BIO, LS (w26_)",1342,1359,"const $ ="],
 ["profil emporté (#moi=…, MOVE_KEYS, moveLink, moveProfile)",1360,1385,"// profil emporté"],
 ["images (logos, photos), dates, vibration",1386,1425,"const lpFile"],
 ["état, clé de match, finalize (résultats saisis, rondes), bilans, statut",1427,1487,"/* ===================== état",[
   ['    else m.state=(now>st && (m.unst||now<st+m.bo*55*60e3))?"live":(now>=st+m.bo*55*60e3?"wait":"soon");',
    '    else m.state=(now>st && (m.unst||now<st+m.bo*55*60e3))?"live":(now>=st+m.bo*55*60e3?"wait":"soon");\n    if(m.unst&&now>st&&!m.winner&&!m.apiLive)m.state=now<st+3*3600e3?"live":"wait";   // refonte : « pas commencé » 3 h après l’heure prévue → en attente']]],
 ["sursis (défaites encore permises)",1600,1605,"function lives"],
 ["nombres et formats (num, pct, kdaV, fx1, fx2)",2117,2121,"const num="],
 ["robot : logos, photos, liens",2137,2138,"function applySJ"],
 ["Leaguepedia : pause et limite de requêtes (lpPause, isRL), utilisés par les blocs asynchrones",2100,2103,"const sleep="],
 ["draft.json : clés de champion, picks et bans probables, matchups",2195,2292,"const CK_AL"],
 ["blocs asynchrones ablock(clé, données, rendu, durée h) : squelette, cache w26_ak_*, erreur + Réessayer",2376,2404,"/* ---- blocs asynchrones",[
   ["const skel=(n=3)=>","const akSkel=(n=3)=>"],["waitHTML():skel();","waitHTML():akSkel();"],["el.innerHTML=skel());runAk(key)","el.innerHTML=akSkel());runAk(key)"]]],
 ["outils de rendu de v13.5 : tuiles, liste de champions",2571,2572,"function tiles"],
 ["modèles du robot : probas de match, note d'impact, lane",2578,2601,"const sigm"],
 ["PHI, fxs, robotProb",2607,2616,"const PHI"],
 ["fiche.json : décodage (rencontres, vis-à-vis, champions, forme, profil)",2942,2987,"const fjFlip"],
 ["petits outils de v13.5 : replis gardés ouverts (data-uo, AM_OPEN, uxFold), « i » en ligne (amI, amIP, amH2), formats am*",3141,3201,"/* ---------- petits outils",[
   // le data-vs de v13.5 ouvrait amVsSheet : la navigation du socle s'en charge (d/a~b)
   ["    const v=e.target.closest(\"[data-vs]\");if(v){if(typeof vib===\"function\")vib(10);amVsSheet(v.dataset.vs)}\n",""]]],
 ["classements SJ.rk : accès et libellés",3667,3689,"const RKX"],
 ["classements SJ.rk : index rkFind",3698,3701,"let RK_IX"],
 ["ligue : état (scores, lg, relais ntfy, DU, couleurs)",4022,4031,"let scores"],
 ["LoL Esports : clé, leFetch, planning, planning du robot",5174,5226,"const LE_KEY",[
   ['async function leFetch(path){','async function leFetch(path,retry=1){try{return await leFetch1(path)}catch(e){if(retry>0){await new Promise(r=>setTimeout(r,400));return leFetch(path,retry-1)}throw e}}\nasync function leFetch1(path){']]],
 ["confettis : FX, confetti(x, y, couleurs, n) (canevas #fx du gabarit ; rien si mouvement réduit)",1504,1514,"const FX="],
 ["gyroscope : autorisation iPhone au premier toucher (askGyro)",1556,1556,"function askGyro"],
 ["photos de repli LoL Esports (getTeams, cache w26_le_photos 24 h) quand le robot n'en fournit pas",5273,5284,"async function enrichPhotosLE"],
 ["diagnostic : HEALTH, ago, mark (santé des sources)",5342,5344,"const HEALTH="],
 ["diagnostic : timed (test chronométré)",5369,5369,"async function timed"],
];
