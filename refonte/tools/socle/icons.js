/* tools/socle/icons.js — dessine les icônes PWA (src/pwa/icons/*.png) à partir d'un SVG (coupe or sur bleu nuit, hexagone).
   node tools/socle/icons.js  (Playwright) ; à relancer seulement si le dessin change. */
const PW="C:/Users/vialo/AppData/Local/Temp/claude/c--Users-vialo-Desktop-Code-Worlds-2026/cead0307-273c-463a-8548-1b2491359512/scratchpad/pw/node_modules/playwright";
const {chromium}=require(PW);const path=require("path"),fs=require("fs");
const OUT=path.join(__dirname,"../../src/pwa/icons");
/* pad : marge intérieure (icône « maskable » : tout le dessin dans le cercle central de 80 %) */
const svg=(pad,round)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<defs><radialGradient id="bg" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="#14305A"/><stop offset=".55" stop-color="#0A1832"/><stop offset="1" stop-color="#050B18"/></radialGradient>
<linearGradient id="gg" x1="0" x2="1"><stop offset="0" stop-color="#785A28"/><stop offset=".5" stop-color="#F0E6D2"/><stop offset="1" stop-color="#785A28"/></linearGradient>
<radialGradient id="glow" cx="50%" cy="45%" r="50%"><stop offset="0" stop-color="#C8AA6E" stop-opacity=".35"/><stop offset="1" stop-color="#C8AA6E" stop-opacity="0"/></radialGradient></defs>
<rect width="512" height="512" rx="${round?112:0}" fill="url(#bg)"/>
<g transform="translate(256 256) scale(${(1-pad*2)}) translate(-256 -256)">
<circle cx="256" cy="246" r="200" fill="url(#glow)"/>
<path d="M256 52 424 149v194L256 440 88 343V149z" fill="none" stroke="#C8AA6E" stroke-width="7" stroke-opacity=".75"/>
<path d="M256 84 396 165v162L256 408 116 327V165z" fill="none" stroke="#0AC8B9" stroke-width="3" stroke-opacity=".55"/>
<g transform="translate(166 120) scale(1.5)">
<path d="M14 18H106C106 70 84 92 60 96 36 92 14 70 14 18Z" fill="url(#gg)"/><ellipse cx="60" cy="18" rx="46" ry="8" fill="#C8AA6E" stroke="#F0E6D2"/>
<path d="M30 40c10 22 24 34 30 36" stroke="#fff6dc" stroke-width="2" fill="none" opacity=".6"/>
<path d="M52 96H68L66 124H54Z" fill="url(#gg)"/><path d="M34 124H86L92 140H28Z" fill="url(#gg)"/><rect x="24" y="140" width="72" height="10" rx="2" fill="#785A28"/></g>
</g></svg>`;
(async()=>{const b=await chromium.launch(),p=await b.newPage();
  const shot=async(name,size,pad,round)=>{await p.setViewportSize({width:size,height:size});
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg(pad,round).replace("<svg ",`<svg width="${size}" height="${size}" `)}</body></html>`);
    await p.screenshot({path:path.join(OUT,name),omitBackground:true});console.log(name)};
  await shot("w26-192.png",192,0,false);await shot("w26-512.png",512,0,false);
  await shot("w26-maskable-512.png",512,.1,false);await shot("w26-180.png",180,0,false);
  fs.writeFileSync(path.join(OUT,"..","w26-icon.svg.src"),svg(0,true));
  await b.close()})();
