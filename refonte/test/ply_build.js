/* test/ply_build.js — construction PRIVÉE pour les tests du module joueurs (ne touche à aucun fichier partagé).
   1. essaie node build.js (le vrai) ; s'il réussit, copie dist/worlds-b.html → test/ply_dist/worlds-b.html.
   2. sinon (un autre module est en plein travail : doublon, erreur de syntaxe), copie le chantier dans un dossier temporaire,
      neutralise dans CETTE COPIE les déclarations d'une ligne en double hors players.js et team.js (ex. L2R de match.js), construit, et copie
      le résultat dans test/ply_dist/. Le rapport dit ce qui a été neutralisé. */
const fs=require("fs"),path=require("path"),cp=require("child_process"),os=require("os");
const ROOT=path.join(__dirname,".."),OUTD=path.join(__dirname,"ply_dist");fs.mkdirSync(OUTD,{recursive:true});
const run=dir=>{try{return {ok:true,out:cp.execFileSync(process.execPath,[path.join(dir,"build.js")],{cwd:dir,stdio:"pipe"}).toString()}}catch(e){return {ok:false,out:String(e.stderr||"")+String(e.stdout||"")}}};
let r=run(ROOT);
if(r.ok){fs.copyFileSync(path.join(ROOT,"dist","worlds-b.html"),path.join(OUTD,"worlds-b.html"));console.log("build partagé OK →  test/ply_dist/worlds-b.html\n"+r.out.trim());process.exit(0)}
console.log("build partagé en échec :\n"+r.out.trim().split("\n").slice(0,4).join("\n"));
const TMP=fs.mkdtempSync(path.join(os.tmpdir(),"ply_build_"));
const copy=(a,b)=>{fs.mkdirSync(b,{recursive:true});for(const f of fs.readdirSync(a)){const s=path.join(a,f),d=path.join(b,f);if(fs.statSync(s).isDirectory())copy(s,d);else fs.copyFileSync(s,d)}};
fs.copyFileSync(path.join(ROOT,"build.js"),path.join(TMP,"build.js"));copy(path.join(ROOT,"src"),path.join(TMP,"src"));copy(path.join(ROOT,"ref"),path.join(TMP,"ref"));
const fixed=[];
for(let i=0;i<12;i++){r=run(TMP);if(r.ok)break;
  const m=/« (\S+) » déclaré deux fois : src\/legacy\.js \(généré\):\d+ et src\/(\w+)\.js:(\d+)/.exec(r.out);
  if(!m||m[2]==="players"||m[2]==="team"){console.log("échec non contournable :\n"+r.out.trim().split("\n").slice(0,6).join("\n"));process.exit(1)}
  const f=path.join(TMP,"src",m[2]+".js"),L=fs.readFileSync(f,"utf8").split("\n"),n=+m[3]-1;
  if(!new RegExp(`^(const|let|var|function)\\s+${m[1]}\\b`).test(L[n])){console.log("doublon multi-lignes, abandon : "+m[1]);process.exit(1)}
  L[n]="/* (copie de test) "+m[1]+" neutralisé */";fs.writeFileSync(f,L.join("\n"));fixed.push(`${m[1]} (src/${m[2]}.js:${m[3]})`)}
if(!r.ok){console.log("échec :\n"+r.out);process.exit(1)}
fs.copyFileSync(path.join(TMP,"dist","worlds-b.html"),path.join(OUTD,"worlds-b.html"));
console.log("build privé OK →  test/ply_dist/worlds-b.html ; neutralisé dans la copie : "+fixed.join(", ")+"\n"+r.out.trim());
fs.rmSync(TMP,{recursive:true,force:true});
