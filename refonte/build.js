/* =====================================================================================
   build.js — assemble dist/worlds-b.html (un seul fichier, comme worlds.html) à partir de src/.
   Node, sans dépendance. Lancer depuis n'importe où :  node build.js [option]
     (rien)        construit : src/legacy.js (extraits de la référence) puis dist/worlds-b.html, node --check intégré
     --check       construit en mémoire et vérifie seulement (n'écrit pas dist/)
     --who NOM     où NOM est déclaré (référence, extraits, src/) et quels fichiers de src/ s'en servent
     --free        noms déclarés dans la référence, PAS encore extraits, et déjà pris par le code neuf (collisions à éviter)
     --map         plan de la référence : sections (commentaires « ===== », « >>> ») et numéros de ligne
     --extracts    liste des extraits par module (lignes, libellé)
     --out F       écrit la page dans F (relatif à ce dossier) au lieu de dist/worlds-b.html (tests en parallèle d'un agent)
     --src D       construit depuis une copie de src/ (tests d'un agent pendant qu'un autre module ne construit pas)
     --pwa         ajoute <link rel="manifest"> (préparation PWA ; par défaut absent : voir src/pwa/LISEZMOI.txt)
   Ordre : JS = legacy.js, shell.js, app.js, home.js, match.js, players.js, team.js, swiss.js, stats.js, league.js, boot.js ;
           CSS = shell.css, app.css, home.css, match.css, players.css, team.css, swiss.css, stats.css, league.css.
   Fichiers PWA (src/pwa : manifeste, icônes) recopiés à côté de la page (dossier de sortie).
   La référence ref/worlds_v13_5.html est figée : tous les extraits viennent d'elle, jamais du dépôt.
   ===================================================================================== */
"use strict";
const fs=require("fs"),path=require("path"),cp=require("child_process"),os=require("os");
const DIR=__dirname,SRC=process.argv.includes("--src")?path.resolve(DIR,process.argv[process.argv.indexOf("--src")+1]):path.join(DIR,"src"),REF=path.join(DIR,"ref","worlds_v13_5.html"),DIST=path.join(DIR,"dist");
const MODS=["shell","app","home","match","players","team","swiss","stats","league"];
const JS=["shell","app","home","match","players","team","swiss","stats","league","boot"];
const ARG=process.argv.slice(2),OPT=ARG[0]||"";
const argv=k=>{const i=ARG.indexOf(k);return i>=0?ARG[i+1]:null};
const OUT=argv("--out")?path.resolve(DIR,argv("--out")):path.join(DIST,"worlds-b.html"),PWA=ARG.includes("--pwa");
const die=m=>{console.error("ÉCHEC : "+m);process.exit(1)};
const read=f=>fs.readFileSync(f,"utf8").replace(/\r\n/g,"\n");
const ref=read(REF).split("\n");

/* ---------- 1. extraits de la référence ---------- */
function lists(){
  const all=[];
  for(const m of MODS){const f=path.join(SRC,"legacy",m+".list.js");if(!fs.existsSync(f))continue;
    delete require.cache[require.resolve(f)];let L;try{L=require(f)}catch(e){die(`src/legacy/${m}.list.js illisible : ${e.message}`)}
    if(!Array.isArray(L))die(`src/legacy/${m}.list.js doit exporter un tableau`);
    L.forEach((x,i)=>{const [lab,a,b,head,reps]=x;
      if(!(Number.isInteger(a)&&Number.isInteger(b)&&a>=1&&b>=a&&b<=ref.length))die(`${m}.list.js, entrée ${i} (« ${lab} ») : lignes ${a}-${b} invalides`);
      if(head&&!ref[a-1].startsWith(head))die(`${m}.list.js, « ${lab} » : ligne ${a} attendue « ${head} », trouvée « ${ref[a-1].slice(0,70)} »`);
      all.push({mod:m,lab,a,b,reps:reps||[]})})}
  all.sort((x,y)=>x.a-y.a);
  for(let i=1;i<all.length;i++){const p=all[i-1],q=all[i];if(q.a<=p.b)die(`extraits qui se chevauchent : ${p.mod} « ${p.lab} » (${p.a}-${p.b}) et ${q.mod} « ${q.lab} » (${q.a}-${q.b}). Un extrait n'appartient qu'à une liste : prends celui qui existe déjà (tout est global).`)}
  return all;
}
function legacyCode(all){
  return all.map(x=>{let s=ref.slice(x.a-1,x.b).join("\n");
    x.reps.forEach(([f,t],j)=>{const n=s.split(f).length-1;if(n!==1)die(`${x.mod}.list.js, « ${x.lab} », remplacement ${j+1} : motif trouvé ${n} fois (il en faut 1) : « ${String(f).slice(0,70)} »`);s=s.replace(f,()=>t)});
    return `/* ---- v13.5 l.${x.a}-${x.b} : ${x.lab} (liste ${x.mod}) ---- */\n${s}`}).join("\n");
}

/* ---------- 2. déclarations de haut niveau (approximation suffisante : en colonne 0) ---------- */
const DECL=/^(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)|^(?:const|let|var)\s+([A-Za-z_$][\w$]*)/;
function topNames(line){const m=DECL.exec(line);if(!m)return [];const out=[m[1]||m[2]];
  if(!m[1]){// const a=…,b=… : noms suivants, à profondeur 0 (hors chaînes et gabarits)
    let d=0,q=null;for(let i=m[0].length;i<line.length;i++){const c=line[i];
      if(q){if(c==="\\"){i++;continue}if(c===q)q=null;continue}
      if(c==='"'||c==="'"||c==="`"){q=c;continue}
      if("([{".includes(c))d++;else if(")]}".includes(c))d--;else if(c===";"&&d<=0)break;
      else if(c===","&&d===0){const n=/^\s*([A-Za-z_$][\w$]*)\s*=/.exec(line.slice(i+1));if(n)out.push(n[1])}}}
  return out}
function declsOf(text){const o=[];text.split("\n").forEach((l,i)=>topNames(l).forEach(n=>o.push({n,line:i+1})));return o}

/* ---------- 3. assemblage ---------- */
function assemble(){
  const all=lists(),legacy=legacyCode(all);
  const parts=[{file:"src/legacy.js (généré)",text:legacy}];
  for(const m of JS){const f=path.join(SRC,m+".js");if(!fs.existsSync(f))die(`src/${m}.js manquant`);parts.push({file:`src/${m}.js`,text:read(f)})}
  let js="",map=[],line=1;
  for(const p of parts){const t=p.text.replace(/\s+$/,"")+"\n";map.push({file:p.file,from:line,to:line+t.split("\n").length-2});js+=t;line+=t.split("\n").length-1}
  let css="";for(const m of MODS){const f=path.join(SRC,m+".css");if(fs.existsSync(f))css+=read(f).replace(/\s+$/,"")+"\n"}
  const tpl=read(path.join(SRC,"index.html"));
  if(!tpl.includes("/*@@CSS@@*/")||!tpl.includes("/*@@JS@@*/"))die("src/index.html : marqueurs /*@@CSS@@*/ ou /*@@JS@@*/ absents");
  if(/<\/script/i.test(js))die("le JS contient « </script » : écrire <\\/script");
  const html=tpl.replace("/*@@CSS@@*/",()=>css.replace(/\s+$/,"")).replace("/*@@JS@@*/",()=>js.replace(/\s+$/,""))
    .replace("<!--@@PWA@@-->",PWA?'<link rel="manifest" href="worlds26.webmanifest">':"");
  return {all,legacy,js,map,css,html,parts};
}
const where=(map,n)=>{const p=map.find(x=>n>=x.from&&n<=x.to);return p?`${p.file}:${n-p.from+1}`:`ligne ${n}`};

/* doublons de déclarations entre fichiers : message clair avant même node --check */
function dupes(parts){const seen=new Map(),errs=[];
  parts.forEach(p=>declsOf(p.text).forEach(({n,line})=>{const k=seen.get(n);if(k&&k.file!==p.file)errs.push(`« ${n} » déclaré deux fois : ${k.file}:${k.line} et ${p.file}:${line}`);else if(!k)seen.set(n,{file:p.file,line})}));
  return errs}
/* node --check sur le JS assemblé (sans la balise script) */
function check(js,map){
  const tmp=path.join(os.tmpdir(),"worlds_b_check_"+process.pid+".js");fs.writeFileSync(tmp,'"use strict";\n'+js);
  try{cp.execFileSync(process.execPath,["--check",tmp],{stdio:"pipe"});return null}
  catch(e){const out=String(e.stderr||e.message),m=out.match(/:(\d+)\n/);const n=m?+m[1]-1:0;
    return `node --check : ${where(map,n)}\n${out.split("\n").slice(1,6).join("\n")}`}
  finally{try{fs.unlinkSync(tmp)}catch(e){}}
}

/* ---------- options d'aide ---------- */
if(OPT==="--map"){ref.forEach((l,i)=>{if(/^\s*\/\*\s*(={5,}|>>>|<<<)|^\/\* -{3,}|^\s*\/\* ---- /.test(l))console.log(String(i+1).padStart(5)+"  "+l.trim().slice(0,130))});process.exit(0)}
if(OPT==="--extracts"){lists().forEach(x=>console.log(`${x.mod.padEnd(8)} ${String(x.a).padStart(5)}-${String(x.b).padEnd(5)} ${x.lab}`));process.exit(0)}
if(OPT==="--who"){const N=ARG[1];if(!N)die("--who NOM");const all=lists(),inEx=n=>all.find(x=>n>=x.a&&n<=x.b);
  console.log(`Référence (ref/worlds_v13_5.html) :`);ref.forEach((l,i)=>{if(topNames(l).includes(N)){const x=inEx(i+1);console.log(`  l.${i+1} ${x?`extrait par ${x.mod} (« ${x.lab} »)`:"PAS extrait"} : ${l.trim().slice(0,100)}`)}});
  console.log(`src/ :`);const re=new RegExp(`(^|[^\\w$.])${N.replace(/\$/g,"\\$")}(?![\\w$])`);
  for(const m of JS){const f=path.join(SRC,m+".js");if(!fs.existsSync(f))continue;const t=read(f).split("\n");
    const d=t.map((l,i)=>topNames(l).includes(N)?i+1:0).filter(Boolean),u=t.filter(l=>re.test(l)).length;
    if(d.length||u)console.log(`  src/${m}.js : ${d.length?"déclaré l."+d.join(", "):"utilisé"} (${u} ligne${u>1?"s":""})`)}
  const lg=legacyCode(all).split("\n").filter(l=>re.test(l)).length;if(lg)console.log(`  extraits (legacy.js) : utilisé sur ${lg} ligne${lg>1?"s":""}`);
  process.exit(0)}
if(OPT==="--free"){const all=lists(),inEx=n=>all.some(x=>n>=x.a&&n<=x.b),mine=new Map();
  for(const m of JS){const f=path.join(SRC,m+".js");if(fs.existsSync(f))declsOf(read(f)).forEach(d=>{if(!mine.has(d.n))mine.set(d.n,`src/${m}.js:${d.line}`)})}
  const hits=[];ref.forEach((l,i)=>{if(i<1230||inEx(i+1))return;topNames(l).forEach(n=>{if(mine.has(n))hits.push(`${n.padEnd(22)} réf. l.${String(i+1).padEnd(5)} ↔ ${mine.get(n)}`)})});
  console.log(hits.length?`Noms de la référence non extraits mais déjà déclarés dans src/ (à renommer si tu extrais ces lignes) :\n`+hits.join("\n"):"Aucune collision.");process.exit(0)}

/* ---------- construction ---------- */
const t0=Date.now(),B=assemble();
const D=dupes(B.parts);if(D.length)die("doublons :\n  "+D.join("\n  "));
const err=check(B.js,B.map);if(err)die(err);
const leftovers=[/w26b_/,/\bLSB\b/].filter(r=>r.test(B.js));if(leftovers.length)die("restes de la maquette (w26b_ / LSB) : utiliser LS (clés w26_)");
if(OPT==="--check"){console.log(`OK (vérification seule) : ${(B.html.length/1024).toFixed(0)} Ko, ${B.all.length} extraits, ${Date.now()-t0} ms`);process.exit(0)}
fs.writeFileSync(path.join(SRC,"legacy.js"),`/* FICHIER GÉNÉRÉ par build.js à partir de ref/worlds_v13_5.html et de src/legacy/*.list.js — NE PAS MODIFIER (il est réécrit à chaque build). */\n`+B.legacy+"\n");
fs.mkdirSync(path.dirname(OUT),{recursive:true});fs.writeFileSync(OUT,B.html);
/* fichiers PWA (manifeste, icônes) à côté de la page */
(function copyPwa(){const P=path.join(SRC,"pwa");if(!fs.existsSync(P))return;const to=path.dirname(OUT);
  const cp1=(a,b)=>{for(const f of fs.readdirSync(a)){const x=path.join(a,f),y=path.join(b,f);if(fs.statSync(x).isDirectory()){fs.mkdirSync(y,{recursive:true});cp1(x,y)}else if(!/\.txt$|\.svg\.src$/.test(f))fs.copyFileSync(x,y)}};cp1(P,to)})();
const per=B.map.map(p=>`${p.file.replace("src/","").replace(" (généré)","")} ${((p.to-p.from+1))}`).join(", ");
console.log(`${path.relative(DIR,OUT).split(path.sep).join("/")} ${(B.html.length/1024).toFixed(0)} Ko (JS ${(B.js.length/1024).toFixed(0)} Ko, CSS ${(B.css.length/1024).toFixed(0)} Ko), ${B.all.length} extraits, node --check OK, ${Date.now()-t0} ms\nlignes : ${per}`);
