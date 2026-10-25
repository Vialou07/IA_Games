/* tools/socle/mybuild.js — construit dist/socle/worlds-b.html depuis une copie de src/ où les doublons d'un module en cours
   de travail (autre agent) sont neutralisés, pour tester le socle sans attendre. Ne modifie pas src/.
   node tools/socle/mybuild.js [--pwa] */
const fs=require("fs"),path=require("path"),cp=require("child_process");
const R=path.join(__dirname,"../.."),S=path.join(R,"src"),T=path.join(process.env.TEMP||"/tmp","w26_socle_src");
fs.rmSync(T,{recursive:true,force:true});fs.cpSync(S,T,{recursive:true});
const extra=process.argv.slice(2);
const run=()=>{try{return cp.execFileSync(process.execPath,[path.join(R,"build.js"),"--src",T,"--out","dist/socle/worlds-b.html",...extra],{encoding:"utf8",stdio:"pipe"})}catch(e){return "ERR"+String(e.stderr||e.stdout||e.message)}};
const DUP=/« (\w+) » déclaré deux fois : src\/legacy\.js \(généré\):\d+ et src\/(\w+)\.js:(\d+)/g;
for(let i=0;i<8;i++){const o=run();if(!o.startsWith("ERR")){console.log(o.trim());process.exit(0)}
  const d=[...o.matchAll(DUP)];if(!d.length){console.log(o);process.exit(1)}
  for(const m of d){const n=m[1],mod=m[2],ln=+m[3];
    if(["shell","app","home","boot"].includes(mod)){console.log("doublon dans le socle : "+n);process.exit(1)}
    const f=path.join(T,mod+".js"),L=fs.readFileSync(f,"utf8").split("\n");
    const re=new RegExp("^(const|let|function)(\\s+)"+n+"(?![\\w$])");
    L[ln-1]=L[ln-1].replace(re,"$1$2__dup_"+n);fs.writeFileSync(f,L.join("\n"));console.log("neutralisé (copie) : "+mod+".js:"+ln+" "+n)}}
process.exit(1);
