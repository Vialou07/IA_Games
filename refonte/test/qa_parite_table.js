/* test/qa_parite_table.js (intégrateur) — tableau de parité ligne par ligne : chaque identifiant de INVENTAIRE.md, son statut dans le
   PARITE_<module>.md de son propriétaire, et la preuve du contrôle qualité (test/qa/parite.json, puis les autres tests de test/qa/).
   node test/qa_parite_table.js > test/qa/parite_table.md   (le texte est repris dans PARITE.md) */
const fs=require("fs"),path=require("path");const ROOT=path.join(__dirname,"..");
const inv=fs.readFileSync(path.join(ROOT,"INVENTAIRE.md"),"utf8").split("\n");
const rows=[];let sec="";
for(const l of inv){const h=l.match(/^#{2,3} (.*)/);if(h)sec=h[1];const m=l.match(/^\| ([A-Z]{1,2}-\d+[a-z]?) \| (.*?) \| (.*?) \| (.*?) \| (.*?) \|$/);
  if(m)rows.push({id:m[1],sec,el:m[2],cible:m[3],mod:m[4],crit:m[5]});
  const b=l.match(/^\| (B-\d+) \| (.*?) \| (.*?) \| (.*?) \|$/);if(b)rows.push({id:b[1],sec,el:b[2],cible:b[3],mod:b[4],crit:""});
  const x=l.match(/^\| (X-\d+) \| (.*?) \| (.*?) \| (.*?) \|$/);if(x)rows.push({id:x[1],sec,el:x[2],cible:"",mod:x[3],crit:x[4]})}
const P={};for(const f of fs.readdirSync(ROOT).filter(f=>/^PARITE_.*\.md$/.test(f))){const mod=f.slice(7,-3);
  for(const l of fs.readFileSync(path.join(ROOT,f),"utf8").split("\n")){const c=l.split("|").map(x=>x.trim());if(c.length<4)continue;
    const ids=(c[1]||"").match(/[A-Z]{1,2}-\d+/g);if(!ids)continue;const st=c.find((x,i)=>i>1&&/^\**(fait|adapté|volontairement différent|différent|corrigé|gardé|en plus|fait \/ adapté|fait \/ —|—)/i.test(x))||c.slice(2).find(x=>/\b(fait|adapté|différent|corrigé|gardé)\b/i.test(x))||"";
    for(const id of ids)if(!P[id])P[id]={mod,st:st.replace(/\*\*/g,"").slice(0,60),row:l}}}
const Q=JSON.parse(fs.readFileSync(path.join(__dirname,"qa","parite.json"),"utf8"));const QC={};for(const c of Q.checks){(QC[c.id]=QC[c.id]||[]).push(c)}
const esc=s=>String(s||"").replace(/\|/g,"/").replace(/\n/g," ");
const short=s=>{s=esc(s).replace(/\s+/g," ").trim();return s.length>150?s.slice(0,147)+"…":s};
const out=["| # | Élément v13.5 | Module | Statut (propriétaire) | Contrôle de l’intégrateur |","|---|---|---|---|---|"];
let nOk=0,nKo=0,nRef=0;
for(const r of rows){const p=P[r.id],q=QC[r.id];let proof;
  if(q){const ko=q.filter(c=>c.res==="KO"),ok=q.filter(c=>c.res==="ok");proof=(ko.length?"**KO** ":ok.length===q.length?"**ok** ":"")+q.map(c=>(c.res==="ok"||c.res==="KO"?"":c.res+" : ")+short(c.detail)).slice(0,2).join(" ; ");if(ko.length)nKo++;else nOk++}
  else{proof="voir PARITE_"+(p?p.mod:"?")+".md (test du module)";nRef++}
  out.push(`| ${r.id} | ${short(r.el).slice(0,90)} | ${esc(r.mod)} | ${p?esc(p.st)||"—":"—"} | ${proof} |`)}
console.log(out.join("\n"));console.error(`${rows.length} lignes, ${nOk} vérifiées ok, ${nKo} KO, ${nRef} renvoyées au test du module`);
