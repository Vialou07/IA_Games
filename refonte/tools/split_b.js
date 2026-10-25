/* Outil à usage unique (architecte) : découpe la maquette B (designB/src.html) en fichiers de départ dans src/.
   Ne pas relancer après le début des portages : il écraserait les fichiers des modules. */
const fs=require("fs"),path=require("path");
const B=path.join(__dirname,"../../designB/src.html"),SRC=path.join(__dirname,"../src");
if(process.argv[2]!=="--force"&&fs.existsSync(path.join(SRC,"shell.js"))){console.error("src/shell.js existe déjà : --force pour écraser");process.exit(1)}
const L=fs.readFileSync(B,"utf8").split("\n");
const r=(a,b)=>L.slice(a-1,(b||a)).join("\n");
const rs=(...R)=>R.map(([a,b])=>r(a,b)).join("\n");
/* INFO : « clé:()=>… , » → « INFO.clé=()=>…; » */
const info=(...keys)=>{const out=[];for(let i=1074;i<=1098;i++){const m=/^  (\w+):(.*),\s*$/.exec(L[i-1]);if(!m)throw new Error("INFO ligne "+i);if(keys.includes(m[1]))out.push(`INFO.${m[1]}=${m[2]};`)}
  if(out.length!==keys.length)throw new Error("INFO : "+keys.join(","));return out.join("\n")};
const W=(f,s)=>{fs.writeFileSync(path.join(SRC,f),s.replace(/\r/g,"")+"\n");console.log(f,(s.length/1024).toFixed(1)+" Ko")};

/* ---------------- CSS ---------------- */
W("shell.css",rs([13,59],[61,69],[71,87],[88,118],[120,125],[141,142],[148,150],[161,200],[201,214],[228,229],[230,236],[265,276],[302,302],[304,329],[344,346],[361,361],[402,414],[432,449],[451,468]));
W("home.css",`/* home.css — accueil (module home) */\n`+rs([126,132],[134,140],[155,159]));
W("match.css",`/* match.css — fiche de match, direct, duel par poste (module match) */\n`+rs([215,227],[237,242],[243,264],[277,286],[287,295],[296,301]));
W("players.css",`/* players.css — joueurs, fiche joueur, duel, classement (module players) */\n`+rs([151,153],[303,303],[330,343],[347,360],[362,366],[367,384]));
W("swiss.css",`/* swiss.css — suisse, calendrier, qui va gagner, équipes (module swiss) */\n`+rs([143,147],[385,392]));
W("stats.css",`/* stats.css — stats du tournoi, faits (module stats) */\n`+rs([154,154],[393,401]));
W("league.css",`/* league.css — paris et ligue (module league) */\n`+rs([415,431]));
W("team.css",`/* team.css — équipes, fiche équipe (module team, porté par l'agent suisse) */\n`);

/* ---------------- JS ---------------- */
W("_b_shell_part1.js",rs([494,495],[501,517],[519,548],[560,581],[584,593],[596,596],[598,598],[613,613],[627,628],[695,732],[1056,1058],[1100,1112],[1117,1198],[1201,1204],[1233,1294]));
W("home.js",rs([601,612],[614,626],[629,641],[659,667],[672,692]));
W("match.js",`const L2R={top:"TOP",jungle:"JGL",mid:"MID",bottom:"BOT",support:"SUP"};\n`+rs([594,595],[733,958],[1113,1115],[1206,1231])+"\n"+info("prono","robot","cles","direct","wp","termine","pog","bans","picks","bansdone","roles","lplayers","dplayers","pickdone","mu","tstats"));
W("players.js",rs([652,653],[960,1034])+"\n"+info("joueur","saison","desig","champs","duel","classement"));
W("swiss.js",rs([642,649],[1035,1039],[1059,1064],[1116,1116])+"\n"+info("sim","cal"));
W("stats.js",rs([654,656],[1065,1070],[1199,1200]));
W("league.js",rs([582,582],[597,597],[650,651],[657,658],[668,671],[1040,1054])+"\n"+info("paris"));
W("team.js","");
