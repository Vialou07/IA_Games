/* FICHIER GÉNÉRÉ par build.js à partir de ref/worlds_v13_5.html et de src/legacy/*.list.js — NE PAS MODIFIER (il est réécrit à chaque build). */
/* ---- v13.5 l.1233-1235 : constantes (postes, ligues) (liste shell) ---- */
const ROLES = {TOP:"Top",JGL:"Jungle",MID:"Mid",BOT:"ADC",SUP:"Support"};
const ROLE_ORDER = ["TOP","JGL","MID","BOT","SUP"];
const LEAGUES = {LCK:"Corée",LPL:"Chine",LEC:"Europe (EMEA)",LCS:"Amérique du Nord",LCP:"Asie-Pacifique",CBLOL:"Brésil"};
/* ---- v13.5 l.1237-1295 : les 19 équipes (liste shell) ---- */
const TEAMS = [
 {id:"GEN",name:"Gen.G",lp:"Gen.G",league:"LCK",cc:"kr",color:"#AA8A00",seed:"LCK n°1",entry:"sw",al:["gen","geng","gengesports"],
  note:"Champion LCK 2026, vainqueur de HLE en finale.",
  p:[["Kiin","TOP","kr"],["Canyon","JGL","kr"],["Chovy","MID","kr"],["Ruler","BOT","kr"],["Duro","SUP","kr"]]},
 {id:"HLE",name:"Hanwha Life Esports",lp:"Hanwha Life Esports",league:"LCK",cc:"kr",color:"#F37321",seed:"LCK n°2, champion MSI",entry:"sw",al:["hle","hanwhalifeesports","hanwhalife"],
  note:"Champion du MSI 2026 (3-2 contre BLG) et finaliste LCK. Gumayusi a quitté T1 pour HLE.",
  p:[["Zeus","TOP","kr"],["Kanavi","JGL","kr"],["Zeka","MID","kr"],["Gumayusi","BOT","kr"],["Delight","SUP","kr"]]},
 {id:"T1",name:"T1",lp:"T1",league:"LCK",cc:"kr",color:"#E2012D",seed:"LCK n°3",entry:"sw",al:["t1","skt","skt1"],
  note:"Triple champion du monde en titre (2023, 2024, 2025) et six titres au total. Vise un quatrième sacre d’affilée.",
  p:[["Doran","TOP","kr"],["Oner","JGL","kr"],["Faker","MID","kr"],["Peyz","BOT","kr"],["Keria","SUP","kr"]]},
 {id:"DK",name:"Dplus KIA",lp:"Dplus KIA",league:"LCK",cc:"kr",color:"#1BA39C",seed:"LCK n°4",entry:"sw",al:["dk","dpluskia","dplus","dwgkia"],
  note:"Quatrième de la LCK. Champion du monde 2020 sous le nom DAMWON.",
  p:[["Siwoo","TOP","kr"],["Lucid","JGL","kr"],["ShowMaker","MID","kr"],["Smash","BOT","kr"],["Career","SUP","kr"]]},
 {id:"AL",name:"Anyone’s Legend",lp:"Anyone's Legend",league:"LPL",cc:"cn",color:"#D9363E",seed:"LPL n°1",entry:"sw",al:["al","anyoneslegend"],
  note:"Champion de la LPL (Split 3).",
  p:[["Breathe","TOP","cn"],["Tarzan","JGL","kr"],["Shanks","MID","cn"],["Hope","BOT","cn"],["Kael","SUP","kr"]]},
 {id:"BLG",name:"Bilibili Gaming",lp:"Bilibili Gaming",league:"LPL",cc:"cn",color:"#00A1D6",seed:"LPL n°2",entry:"sw",al:["blg","bilibiligaming","bilibili"],
  note:"Finaliste du MSI 2026, qualifié aux points de championnat.",
  p:[["Bin","TOP","cn"],["Xun","JGL","cn"],["Knight","MID","cn"],["Viper","BOT","kr"],["ON","SUP","cn"]]},
 {id:"TES",name:"Top Esports",lp:"Top Esports",league:"LPL",cc:"cn",color:"#FF5A1F",seed:"LPL n°3",entry:"sw",al:["tes","topesports","top"],
  note:"369 démarre à la place de ZUIAN, bloqué par un problème de visa.",
  p:[["369","TOP","cn"],["Tian","JGL","cn"],["Creme","MID","cn"],["JackeyLove","BOT","cn"],["Zhuo","SUP","cn"]]},
 {id:"IG",name:"Invictus Gaming",lp:"Invictus Gaming",league:"LPL",cc:"cn",color:"#8C8C8C",seed:"LPL n°4",entry:"sw",al:["ig","invictusgaming","shanghaiinvictusgamingmeituan"],
  note:"Champion du monde 2018. TheShy et Rookie faisaient déjà partie de cette équipe.",
  p:[["TheShy","TOP","kr"],["Wei","JGL","cn"],["Rookie","MID","kr"],["JiaQi","BOT","cn"],["Meiko","SUP","cn"]]},
 {id:"G2",name:"G2 Esports",lp:"G2 Esports",league:"LEC",cc:"de",color:"#E8202A",seed:"LEC n°1",entry:"sw",al:["g2","g2esports"],
  note:"Champion LEC été 2026 (3-0 contre KOI). Caps est entré au Hall of Legends en août.",
  p:[["BrokenBlade","TOP","de"],["SkewMond","JGL","fr"],["Caps","MID","dk"],["Hans Sama","BOT","fr"],["Labrov","SUP","gr"]]},
 {id:"MKOI",name:"Movistar KOI",lp:"Movistar KOI",league:"LEC",cc:"es",color:"#6C3FC5",seed:"LEC n°2",entry:"sw",al:["mkoi","koi","movistarkoi"],
  note:"Finaliste de la LEC été 2026.",
  p:[["Myrwn","TOP","es"],["Elyoya","JGL","es"],["Jojopyun","MID","ca"],["Supa","BOT","es"],["Alvaro","SUP","es"]]},
 {id:"KC",name:"Karmine Corp",lp:"Karmine Corp",league:"LEC",cc:"fr",color:"#00A3E0",seed:"LEC n°3",entry:"pi",al:["kc","karminecorp","kcorp"],
  note:"Première participation aux Worlds. Seul rescapé des Play-In : 3-2 contre C9, puis deux fois 3-0 contre MVK.",
  p:[["Canna","TOP","kr"],["Yike","JGL","se"],["kyeahoo","MID","kr"],["Caliste","BOT","fr"],["Busio","SUP","us"]]},
 {id:"TL",name:"Team Liquid Alienware",lp:"Team Liquid",league:"LCS",cc:"us",color:"#1E4FA3",seed:"LCS n°1",entry:"sw",al:["tl","tlaw","teamliquid","teamliquidalienware","liquid"],
  note:"Champion LCS été 2026 (3-1 contre LYON).",
  p:[["Morgan","TOP","kr"],["Josedeodo","JGL","ar"],["Quid","MID","kr"],["Yeon","BOT","us"],["CoreJJ","SUP","kr"]]},
 {id:"LYON",name:"LYON",lp:"LYON (2024 American Team)",league:"LCS",cc:"mx",color:"#13B3A0",seed:"LCS n°2",entry:"sw",al:["lyon","ly","lyon2024americanteam","lyongaming"],
  note:"Finaliste LCS. Ancien Movistar R7, venu de la ligue latino-américaine.",
  p:[["Dhokla","TOP","us"],["Inspired","JGL","pl"],["Saint","MID","kr"],["Berserker","BOT","kr"],["Isles","SUP","au"]]},
 {id:"TSW",name:"Team Secret Whales",lp:"Team Secret Whales",league:"LCP",cc:"vn",color:"#C9C9C9",seed:"LCP n°1",entry:"sw",al:["tsw","teamsecretwhales","secretwhales"],
  note:"Champion LCP Split 3 et toute première équipe qualifiée pour ces Worlds (2 août).",
  p:[["Pun","TOP","vn"],["Hizto","JGL","vn"],["Dire","MID","vn"],["Eddie","BOT","vn"],["Bie","SUP","vn"]]},
 {id:"CFO",name:"CTBC Flying Oyster",lp:"CTBC Flying Oyster",league:"LCP",cc:"tw",color:"#00875F",seed:"LCP n°2",entry:"sw",al:["cfo","ctbcflyingoyster","flyingoyster"],
  note:"Finaliste LCP Split 3, quart-de-finaliste des Worlds 2025.",
  p:[["Rest","TOP","tw"],["Shad0w","JGL","it"],["POUT","MID","kr"],["Doggo","BOT","tw"],["Kino","SUP","tw"]]},
 {id:"LOS",name:"LØS",lp:"LØS",league:"CBLOL",cc:"br",color:"#8E5CF6",seed:"CBLOL n°1",entry:"sw",al:["los","losgrandes"],
  note:"Champion CBLOL Split 2 (3-2 contre FURIA). Première participation aux Worlds.",
  p:[["Zest","TOP","kr"],["Curse","JGL","br"],["Feisty","MID","kr"],["Duduhh","BOT","br"],["Ackerman","SUP","ar"]]},
 {id:"C9",name:"Cloud9 Kia",lp:"Cloud9",league:"LCS",cc:"us",color:"#13A8E0",seed:"LCS n°3",entry:"pi",al:["c9","cloud9","cloud9kia"],
  note:"Éliminé en Play-In, battu 3-1 par FURIA en repêchage.",
  p:[["Thanatos","TOP","kr"],["Blaber","JGL","us"],["Loki","MID","kr"],["Tactical","BOT","us"],["Vulcan","SUP","ca"]]},
 {id:"FUR",name:"FURIA",lp:"FURIA",league:"CBLOL",cc:"br",color:"#6E6E6E",seed:"CBLOL n°2",entry:"pi",al:["fur","furia","furiaesports"],
  note:"Première participation. Éliminé en Play-In par MVK.",
  p:[["Guigo","TOP","br"],["Tatu","JGL","br"],["Tutsz","MID","br"],["Ayu","BOT","br"],["JoJo","SUP","br"]]},
 {id:"MVK",name:"MVK Esports",lp:"MVK Esports",league:"LCP",cc:"vn",color:"#E0A21B",seed:"LCP n°3",entry:"pi",al:["mvk","mvkesports","mgnvikings","mgnvikingsesports"],
  note:"Ex-MGN Vikings. Finaliste des Play-In, battu deux fois 3-0 par Karmine Corp.",
  p:[["Kratos","TOP","vn"],["Gury","JGL","vn"],["Chika","MID","vn"],["Harky","BOT","vn"],["SiuLoong","SUP","vn"]]}
];
/* ---- v13.5 l.1297-1304 : lieux et phases (liste shell) ---- */
const VENUES = {
  pi:"Riot Games Arena, Los Angeles",
  sw:"Credit Union of Texas Event Center, Allen (Texas)",
  qf:"Credit Union of Texas Event Center, Allen (Texas)",
  sf:"Credit Union of Texas Event Center, Allen (Texas)",
  f:"Barclays Center, Brooklyn (New York)"
};
const STAGES = {pi:"Play-In",sw:"Phase suisse",qf:"Quarts de finale",sf:"Demi-finales",f:"Finale"};
/* ---- v13.5 l.1306-1339 : matchs embarqués, jours sans affiche (liste shell) ---- */
const EMBED = [
 {id:"pi1",stage:"pi",label:"Ronde 1",t1:"C9",t2:"KC",start:"2026-10-15T18:00:00Z",bo:5,s1:2,s2:3},
 {id:"pi2",stage:"pi",label:"Ronde 1",t1:"FUR",t2:"MVK",start:"2026-10-15T23:00:00Z",bo:5,s1:0,s2:3},
 {id:"pi3",stage:"pi",label:"Match des vainqueurs",t1:"KC",t2:"MVK",start:"2026-10-16T18:00:00Z",bo:5,s1:3,s2:0},
 {id:"pi4",stage:"pi",label:"Repêchage 1",t1:"FUR",t2:"C9",start:"2026-10-16T23:00:00Z",bo:5,s1:3,s2:1},
 {id:"pi5",stage:"pi",label:"Repêchage 2",t1:"MVK",t2:"FUR",start:"2026-10-17T18:00:00Z",bo:5,s1:3,s2:1},
 {id:"pi6",stage:"pi",label:"Qualification",t1:"KC",t2:"MVK",start:"2026-10-18T18:00:00Z",bo:5,s1:3,s2:0},
 {id:"sw1",stage:"sw",label:"Ronde 1",t1:"IG",t2:"GEN",start:"2026-10-23T17:00:00Z",bo:1,s1:0,s2:1},
 {id:"sw2",stage:"sw",label:"Ronde 1",t1:"TES",t2:"HLE",start:"2026-10-23T18:00:00Z",bo:1,s1:0,s2:1},
 {id:"sw3",stage:"sw",label:"Ronde 1",t1:"MKOI",t2:"BLG",start:"2026-10-23T19:00:00Z",bo:1,s1:1,s2:0},
 {id:"sw4",stage:"sw",label:"Ronde 1",t1:"AL",t2:"KC",start:"2026-10-23T20:00:00Z",bo:1},
 {id:"sw5",stage:"sw",label:"Ronde 1",t1:"G2",t2:"DK",start:"2026-10-23T21:00:00Z",bo:1},
 {id:"sw6",stage:"sw",label:"Ronde 1",t1:"TL",t2:"CFO",start:"2026-10-23T22:00:00Z",bo:1},
 {id:"sw7",stage:"sw",label:"Ronde 1",t1:"LOS",t2:"T1",start:"2026-10-23T23:00:00Z",bo:1},
 {id:"sw8",stage:"sw",label:"Ronde 1",t1:"TSW",t2:"LYON",start:"2026-10-24T00:00:00Z",bo:1}
];

/* jours de compétition sans affiche connue (tirage au fil de l'eau) */
const DAYS = [
 {d:"2026-10-24",t:"17:00",stage:"sw",what:"Ronde 2, tirage le 23 octobre"},
 {d:"2026-10-25",t:"17:00",stage:"sw",what:"Ronde 3, tirage le 24 octobre"},
 {d:"2026-10-26",t:"17:00",stage:"sw",what:"Ronde 3"},
 {d:"2026-10-28",t:"20:00",stage:"sw",what:"Ronde 4, tirage le 26 octobre"},
 {d:"2026-10-29",t:"20:00",stage:"sw",what:"Ronde 4"},
 {d:"2026-10-30",t:"20:00",stage:"sw",what:"Ronde 4"},
 {d:"2026-10-31",t:"17:00",stage:"sw",what:"Ronde 5, tirage le 30 octobre. Tirage des quarts dans la foulée"},
 {d:"2026-11-03",t:"22:00",stage:"qf",what:"Quart de finale 1"},
 {d:"2026-11-04",t:"22:00",stage:"qf",what:"Quart de finale 2"},
 {d:"2026-11-05",t:"22:00",stage:"qf",what:"Quart de finale 3"},
 {d:"2026-11-06",t:"22:00",stage:"qf",what:"Quart de finale 4"},
 {d:"2026-11-07",t:"22:00",stage:"sf",what:"Demi-finale 1"},
 {d:"2026-11-08",t:"22:00",stage:"sf",what:"Demi-finale 2"},
 {d:"2026-11-14",t:"19:00",stage:"f",what:"Grande finale"}
];
/* ---- v13.5 l.1342-1359 : utilitaires, champions du monde, joueurs, BIO, LS (w26_) (liste shell) ---- */
const $ = s => document.querySelector(s);
const RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
const norm = s => String(s||"").toLowerCase().replace(/ø/g,"o").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");
const esc = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const T = {}; TEAMS.forEach(t=>{t.al=[...new Set([...t.al,norm(t.id),norm(t.name),norm(t.lp)])];T[t.id]=t});
const CHAMPS={Faker:[2013,2015,2016,2023,2024,2025],Oner:[2023,2024,2025],Keria:[2023,2024,2025],Gumayusi:[2023,2024,2025],Zeus:[2023,2024],Doran:[2025],
  Canyon:[2020],ShowMaker:[2020],Ruler:[2017],CoreJJ:[2017],TheShy:[2018],Rookie:[2018],JackeyLove:[2018],Viper:[2021],Meiko:[2021],Zeka:[2022],Tian:[2019]};
const PLAYERS = [];
TEAMS.forEach(t=>t.p.forEach(([id,role,cc])=>PLAYERS.push({id,role,cc,team:t.id,key:t.id+"_"+norm(id),titles:CHAMPS[id]||[]})));
/* identité des titulaires : Liquipedia et Leaguepedia croisés le 24/10/2026 (date de naissance seulement si les deux concordent), années aux Worlds */
const BIO={"GEN_kiin":["1999-05-28","김기인","Kim Gi-in",[2018,2023,2024,2025,2026]],"GEN_canyon":["2001-06-18","김건부","Kim Geon-bu",[2019,2020,2021,2022,2023,2024,2025,2026]],"GEN_chovy":["2001-03-03","정지훈","Jeong Ji-hoon",[2019,2020,2021,2022,2023,2024,2025,2026]],"GEN_ruler":["1998-12-29","박재혁","Park Jae-hyuk",[2016,2017,2018,2020,2021,2022,2023,2025,2026]],"GEN_duro":["2002-02-04","주민규","Joo Min-kyu",[2025,2026]],"HLE_zeus":["2004-01-31","최우제","Choi Woo-je",[2022,2023,2024,2025,2026]],"HLE_kanavi":["2000-11-02","서진혁","Seo Jin-hyeok",[2020,2022,2023,2025,2026]],"HLE_zeka":["2002-11-28","김건우","Kim Geon-woo",[2022,2024,2025,2026]],"HLE_gumayusi":["2002-02-06","이민형","Lee Min-hyeong",[2021,2022,2023,2024,2025,2026]],"HLE_delight":["2002-09-12","유환중","Yoo Hwan-joong",[2023,2024,2025,2026]],"T1_doran":["2000-07-22","최현준","Choi Hyeon-jun",[2022,2023,2024,2025,2026]],"T1_oner":["2002-12-24","문현준","Mun Hyeon-jun",[2021,2022,2023,2024,2025,2026]],"T1_faker":["1996-05-07","이상혁","Lee Sang-hyeok",[2013,2015,2016,2017,2019,2021,2022,2023,2024,2025,2026]],"T1_peyz":["2005-12-05","김수환","Kim Su-hwan",[2023,2024,2026]],"T1_keria":["2002-10-14","류민석","Ryu Min-seok",[2020,2021,2022,2023,2024,2025,2026]],"DK_siwoo":["2007-11-24","전시우","Jeon Si-woo",[2026]],"DK_lucid":["2005-01-28","최용혁","Choi Yong-hyeok",[2024,2026]],"DK_showmaker":["2000-07-22","허수","Heo Su",[2019,2020,2021,2022,2023,2024,2026]],"DK_smash":["2006-07-20","신금재","Shin Geum-jae",[2026]],"DK_career":["2004-08-29","오형석","Oh Hyeong-seok",[2026]],"AL_breathe":["2001-02-19","陈晨","Chen Chen",[2022,2024,2026]],"AL_tarzan":["1999-08-23","이승용","Lee Seung-yong",[2019,2021,2023,2024,2025,2026]],"AL_shanks":["2001-05-13","崔校军","Cui Xiao-Jun",[2025,2026]],"AL_hope":["2000-09-29","王杰","Wang Jie",[2022,2025,2026]],"AL_kael":["2004-02-11","김진홍","Kim Jin-hong",[2025,2026]],"BLG_bin":["2003-09-28","陈泽彬","Chen Ze-Bin",[2020,2023,2024,2025,2026]],"BLG_xun":["2002-02-05","彭立勋","Peng Li-Xun",[2023,2024,2026]],"BLG_knight":["2000-05-22","卓定","Zhuo Ding",[2020,2022,2023,2024,2025,2026]],"BLG_viper":["2000-10-19","박도현","Park Do-hyeon",[2019,2021,2022,2024,2025,2026]],"BLG_on":["2003-05-12","骆文俊","Luo Wen-Jun",[2023,2024,2025,2026]],"TES_369":["2001-07-12","白家浩","Bai Jia-Hao",[2020,2022,2023,2024,2025,2026]],"TES_tian":["2000-07-24","高天亮","Gao Tian-Liang",[2019,2021,2022,2024,2026]],"TES_creme":["2003-12-14","林坚","Lin Jian",[2024,2025,2026]],"TES_jackeylove":["2000-11-18","喻文波","Yu Wen-Bo",[2018,2019,2020,2022,2024,2025,2026]],"TES_zhuo":["2001-02-13","王旭卓","Wang Xu-Zhuo",[2026]],"IG_theshy":["1999-11-11","강승록","Kang Seung-lok",[2018,2019,2023,2025,2026]],"IG_wei":["2002-11-09","闫扬威","Yan Yang-Wei",[2021,2022,2024,2025,2026]],"IG_rookie":["1997-03-11","송의진","Song Eui-jin",[2015,2018,2019,2025,2026]],"IG_jiaqi":["2004-05-31","资嘉琪","Zi Jia-Qi",[2026]],"IG_meiko":["1998-06-06","田野","Tian Ye",[2015,2016,2017,2018,2021,2022,2024,2025,2026]],"G2_brokenblade":["2000-01-19","","Sergen Çelik",[2020,2022,2023,2024,2025,2026]],"G2_skewmond":["2004-08-09","","Rudy Semaan",[2025,2026]],"G2_caps":["1999-11-17","","Rasmus Borregaard Winther",[2017,2018,2019,2020,2022,2023,2024,2025,2026]],"G2_hanssama":["1999-09-02","","Steven Liv",[2017,2020,2021,2023,2024,2025,2026]],"G2_labrov":["2002-02-12","Λάμπρος Παπουτσάκης","Lampros Papoutsakis",[2023,2025,2026]],"MKOI_myrwn":["2003-06-13","","Alex Pastor Villarejo",[2024,2025,2026]],"MKOI_elyoya":["2000-03-13","","Javier Prades Batalla",[2021,2022,2023,2024,2025,2026]],"MKOI_jojopyun":["2004-10-01","","Joseph Joon Pyun",[2022,2025,2026]],"MKOI_supa":["2000-10-23","","David Martínez García",[2024,2025,2026]],"MKOI_alvaro":["2003-07-15","","Álvaro Fernández del Amo",[2024,2025,2026]],"KC_canna":["2000-02-11","김창동","Kim Chang-dong",[2021,2023,2026]],"KC_yike":["2000-11-11","","Martin Sundelin",[2023,2024,2026]],"KC_kyeahoo":["2005-08-13","강예후","Kang Ye-hoo",[2026]],"KC_caliste":["2006-08-28","","Caliste Henry-Hennebert",[2026]],"KC_busio":["","","Alan Cwalina",[2024,2025,2026]],"TL_morgan":["2001-09-26","박루한","Park Ru-han",[2021,2026]],"TL_josedeodo":["2000-05-22","","Brandon Joel Villegas",[2020,2026]],"TL_quid":["2004-04-27","임현승","Lim Hyeon-seung",[2024,2025,2026]],"TL_yeon":["","성연호","Sean Sung",[2023,2024,2026]],"TL_corejj":["1994-06-22","조용인","Jo Yong-in",[2016,2017,2018,2019,2020,2021,2023,2024,2026]],"LYON_dhokla":["1997-07-17","","Niship Doshi",[2023,2025,2026]],"LYON_inspired":["2002-01-24","","Kacper Słoma",[2020,2021,2022,2024,2025,2026]],"LYON_saint":["2005-01-01","강성인","Kang Sung-in",[2026]],"LYON_berserker":["2003-05-25","김민철","Kim Min-cheol",[2022,2023,2026]],"LYON_isles":["2001-03-07","","Jonah Rosario",[2020,2026]],"TSW_pun":["2002-07-29","","Nguyễn Đăng Khoa",[2025,2026]],"TSW_hizto":["2007-09-15","","Lê Văn Hoàng Hải",[2025,2026]],"TSW_dire":["2006-11-22","","Trần Duy Đức",[2025,2026]],"TSW_eddie":["2003-06-17","","Hoàng Công Nghĩa",[2025,2026]],"TSW_bie":["1999-12-09","","Trần Đức Hiếu",[2022,2023,2024,2026]],"CFO_rest":["1998-12-11","徐士傑","Hsu Shih-Chieh",[2019,2022,2023,2025,2026]],"CFO_shad0w":["2001-02-25","赵志强","Zhao Zhi-Qiang",[2020,2025,2026]],"CFO_pout":["2003-10-03","한인웅","Han In-woong",[2026]],"CFO_doggo":["2003-01-14","邱梓銓","Chiu Tzu-Chuan",[2021,2025,2026]],"CFO_kino":["1998-04-12","朱吳欣榮","Chu Wu Hsin-Jung",[2021,2022,2026]],"LOS_zest":["2003-11-05","김동민","Kim Dong-min",[2026]],"LOS_curse":["2005-05-18","","Raí Yamada",[2026]],"LOS_feisty":["2003-12-19","정성훈","Jeong Seong-hoon",[2026]],"LOS_duduhh":["2008-04-18","","Wallyson Francisco Queiroz da Silva",[2026]],"LOS_ackerman":["","","Gabriel Agustin Aparicio",[2021,2026]],"C9_thanatos":["2004-05-01","박승규","Park Seung-gyu",[2026]],"C9_blaber":["2000-01-04","","Robert Huang",[2018,2019,2021,2022,2023,2026]],"C9_loki":["2005-03-26","이상민","Lee Sang-min",[2026]],"C9_tactical":["2000-08-18","나문용","Edward Ra",[2020,2021,2026]],"C9_vulcan":["1999-04-20","","Philippe Laflamme",[2019,2021,2022,2026]],"FUR_guigo":["2002-01-28","","Guilherme Araújo Ruiz",[2021,2026]],"FUR_tatu":["2006-06-13","","Pedro Seixas Brito",[2026]],"FUR_tutsz":["2002-12-16","","Arthur Peixoto Machado",[2026]],"FUR_ayu":["2005-10-06","","Andrey Saraiva",[2026]],"FUR_jojo":["1998-11-11","","Gabriel Dzelme de Oliveira",[2021,2026]],"MVK_kratos":["2005-04-22","","Ngô Đức Khánh",[2026]],"MVK_gury":["2003-10-28","","Lương Hải Long",[2024,2026]],"MVK_chika":["2006-01-26","","Võ Lê Nhân",[2026]],"MVK_harky":["2005-08-21","","Nguyễn Văn Hữu",[2026]],"MVK_siuloong":["2005-09-15","","Nguyễn Hoàng Lam",[2026]]};
PLAYERS.forEach(p=>{const b=BIO[p.key];if(!b)return;if(b[0])p.birth=b[0];if(b[1])p.native=b[1];if(b[2])p.realName=b[2];if(b[3].length)p.worlds=b[3]});
const teamPlayers = id => ROLE_ORDER.map(r=>PLAYERS.find(p=>p.team===id&&p.role===r)).filter(Boolean);
const resolveTeam = (...xs) => {for(const x of xs){const n=norm(x);if(!n||n==="tbd")continue;const t=TEAMS.find(t=>t.al.includes(n));if(t)return t.id}return null};
let regionName; try{regionName=new Intl.DisplayNames(["fr"],{type:"region"})}catch(e){regionName=null}
const cname = cc => {if(!cc)return"?";try{return regionName?regionName.of(cc.toUpperCase()):cc.toUpperCase()}catch(e){return cc.toUpperCase()}};
const flag = (cc,cls="flag") => cc?`<img class="${cls}" src="https://flagcdn.com/${esc(cc)}.svg" alt="${esc(cname(cc))}" title="${esc(cname(cc))}" loading="lazy">`:"";
const LS = {get(k,d){try{const v=localStorage.getItem("w26_"+k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem("w26_"+k,JSON.stringify(v))}catch(e){}}};
/* ---- v13.5 l.1360-1385 : profil emporté (#moi=…, MOVE_KEYS, moveLink, moveProfile) (liste shell) ---- */
// profil emporté d'un autre navigateur (lien « …#moi=… ») : chaque navigateur a sa propre mémoire (Messenger, Chrome, icône
// d'écran d'accueil…). On le reprend avant de lire quoi que ce soit, puis on efface le lien de la barre d'adresse.
const MOVE_KEYS=["league","picks","manual","scores","fav","myname"];
let IMPORTED=null;
(function importProfile(){
  if(!location.hash.startsWith("#moi="))return;
  try{
    const d=JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(5).replace(/-/g,"+").replace(/_/g,"/")))));
    const cur=LS.get("league",null),who=(d.league&&d.league.me&&d.league.me.name)||d.myname||"ce lien";
    if(d&&d.v===1&&(!cur||!cur.me||(d.league&&d.league.me&&cur.me.id===d.league.me.id)||confirm(`Remplacer le profil de ce navigateur (${cur.me.name}) par celui de ${who} ?`))){
      MOVE_KEYS.forEach(k=>{if(d[k]!==undefined)LS.set(k,d[k])});IMPORTED=who;
    }
  }catch(e){}
  history.replaceState(null,"",location.pathname+location.search);
})();
function moveLink(){
  const d={v:1};MOVE_KEYS.forEach(k=>{const v=LS.get(k,undefined);if(v!==undefined)d[k]=v});
  const enc=o=>btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
  let x=enc(d);if(x.length>12000&&d.league){d.league={...d.league,players:{}};x=enc(d)}   // les paris des autres reviennent par la ligue
  return location.origin+location.pathname+"#moi="+x;
}
async function moveProfile(){
  const url=moveLink(),text="Mon profil Worlds 2026 (ligue et paris) : ouvre ce lien dans le navigateur où tu veux continuer.";
  try{if(navigator.share){await navigator.share({title:"Mon profil Worlds",text,url});return}}catch(e){if(e&&e.name==="AbortError")return}
  try{await navigator.clipboard.writeText(url);toast("Lien copié : colle-le dans l’autre navigateur")}catch(e){prompt("Copie ce lien et ouvre-le dans l’autre navigateur :",url)}
}
/* ---- v13.5 l.1386-1425 : images (logos, photos), dates, vibration (liste shell) ---- */
const lpFile = (f,w) => "https://lol.fandom.com/wiki/Special:FilePath/"+encodeURIComponent(String(f).replace(/ /g,"_"))+(w?"?width="+w:"");

window.imgFail = el => {
  const alt=(el.dataset.alt||"").split("|").filter(Boolean);
  if(alt.length){el.dataset.alt=alt.slice(1).join("|");el.src=alt[0];return}
  const s=document.createElement("span");s.className="mono";s.style.cssText=el.dataset.ms||"";s.textContent=el.dataset.mt||"?";
  el.replaceWith(s);
};
function imgTag(srcs,cls,mono,extraStyle=""){
  srcs=srcs.filter(Boolean);
  const ms=`background:${mono.bg};width:${mono.w};height:${mono.h||mono.w};${mono.style||""}`;
  if(!srcs.length)return `<span class="mono" style="${ms}">${esc(mono.text)}</span>`;
  return `<img class="${cls}" style="${extraStyle}" src="${esc(srcs[0])}" data-alt="${esc(srcs.slice(1).join("|"))}" data-mt="${esc(mono.text)}" data-ms="${esc(ms)}" alt="" loading="lazy" decoding="async" onerror="imgFail(this)">`;
}
/* logos officiels LoL Esports au 24/10 : affichés dès le premier écran, sans passer par Leaguepedia */
const LE_LOGO = {"GEN":"https://static.lolesports.com/teams/1773829250929_GENGLOGO_GOLD.png","HLE":"https://static.lolesports.com/teams/1631819564399_hle-2021-worlds.png","T1":"https://static.lolesports.com/teams/1726801573959_539px-T1_2019_full_allmode.png","DK":"https://static.lolesports.com/teams/1673260049703_DPlusKIALOGO11.png","AL":"https://static.lolesports.com/teams/1641199582689_.png","BLG":"https://static.lolesports.com/teams/1682322954525_Bilibili_Gaming_logo_20211.png","TES":"https://static.lolesports.com/teams/1592592064571_TopEsportsTES-01-FullonDark.png","IG":"https://static.lolesports.com/teams/1634762917340_300px-Invictus_Gaming_logo.png","G2":"https://static.lolesports.com/teams/G2-FullonDark.png","MKOI":"https://static.lolesports.com/teams/1734012609283_MKOI_FullColor_Blue.png","KC":"https://static.lolesports.com/teams/1704714951336_KC.png","TL":"https://static.lolesports.com/teams/1769357207762_TLAlienware_Minimal_Bug-White.png","LYON":"https://static.lolesports.com/teams/1743717443673_isotypelyon-03.png","TSW":"https://static.lolesports.com/teams/1774598000328_White_EyeText_600p.png","CFO":"https://static.lolesports.com/teams/1656307849320_CFO_Logo.png","LOS":"https://static.lolesports.com/teams/1784013312149_LOS-OLaranja.png","C9":"https://static.lolesports.com/teams/1736924120254_C9Kia_IconBlue_Transparent_2000x2000.png","FUR":"https://static.lolesports.com/teams/FURIA---black.png","MVK":"https://static.lolesports.com/teams/1767089709161_White_Logo.png"};
const LIVE_LOGO = {};
/* images LoL Esports : PNG de 400 à 600 Ko. On passe par wsrv.nl (vignette WebP de ~15 Ko, mise en cache un an), l'original reste en secours */
const thumb=(u,w)=>u&&/^https?:\/\/static\.lolesports\.com\//.test(u)?`https://wsrv.nl/?url=${encodeURIComponent(u.replace(/^https?:\/\//,""))}&w=${w}&output=webp&q=80`:null;
function logo(id,size=34){
  const t=T[id]; if(!t) return `<span class="mono" style="background:var(--panel2);width:${size}px;height:${size}px">?</span>`;
  const w=size>100?320:size>48?160:96;   // 96 px suffit jusqu'à 48 px affichés (≈40 % plus léger)
  const le=LIVE_LOGO[id]||LE_LOGO[id];
  return imgTag([thumb(le,w),le,t.lpImg,lpFile(t.lp+"logo square.png",w),lpFile(t.lp+"logo std.png",w)],"logo",{text:t.id,bg:t.color,w:size+"px",style:"font-size:"+Math.max(11,size/3)+"px"},`width:${size}px;height:${size}px`);
}
function photo(p,mode,size){
  const t=T[p.team], srcs=[p.photo,thumb(p.lePhoto,320),p.lePhoto,p.wikiPhoto], txt=p.id.slice(0,2).toUpperCase();
  const bg=`linear-gradient(135deg,${t.color},#0A1428)`;
  if(mode==="fill") return imgTag(srcs,"pp",{text:txt,bg,w:"100%",style:"border-radius:0;font-size:46px"});
  return imgTag(srcs,"ava"+(p.titles.length?" lg":""),{text:txt,bg,w:size+"px",style:"border-radius:12px;font-size:"+(size/2.6)+"px"},`width:${size}px;height:${size}px`);
}
const FTIME=new Intl.DateTimeFormat("fr-FR",{hour:"2-digit",minute:"2-digit"}),FDAY=new Intl.DateTimeFormat("fr-FR",{weekday:"long",day:"numeric",month:"long"});
const fmtTime = d => FTIME.format(d);
const fmtDay = d => {const s=FDAY.format(d);return s.charAt(0).toUpperCase()+s.slice(1)};
const SHIFT=6*3600e3;
const dayKeyL = d => dayKey(new Date(d.getTime()-SHIFT));
const evDate = d => new Date(d.getTime()-SHIFT);
const dayKey = d => d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const tzLabel = (()=>{try{const z=Intl.DateTimeFormat().resolvedOptions().timeZone;return z==="Europe/Paris"?"heure de Paris":"heure locale"}catch(e){return"heure locale"}})();
const vib = ms => {try{navigator.vibrate&&navigator.vibrate(ms)}catch(e){}};
/* ---- v13.5 l.1427-1487 : état, clé de match, finalize (résultats saisis, rondes), bilans, statut (liste shell) ---- */
/* ===================== état ===================== */
let MATCHES = [];
let SOURCE = "embarquées";
let lastSync = null;
let picks = LS.get("picks",{}), manual = LS.get("manual",{}), fav = LS.get("fav",null), celebrated = LS.get("celebrated",{});
const ui = {stage:"all",league:"all",role:"all",nat:null,q:"",counted:false,pview:"cards",pstat:"imp"};

/* clé de match stable : en suisse et en phase finale deux équipes ne se croisent qu'une fois */
const mkey = m => {if(!(m.t1&&m.t2))return m.id;const t=[m.t1,m.t2].sort().join("_");return m.stage==="pi"?t+"_"+m.start.slice(0,10):t+"_"+m.stage};
function migrateKey(m){
  if(!m.t1||!m.t2||m.stage==="pi")return false;const old=[m.t1,m.t2].sort().join("_")+"_"+m.start.slice(0,10);if(old===m.key)return false;let ch=false;
  const mv=o=>{if(o&&o[old]!=null){if(o[m.key]==null)o[m.key]=o[old];delete o[old];ch=true}};
  mv(picks);if(typeof scores!=="undefined")mv(scores);mv(manual);mv(celebrated);
  if(typeof lg!=="undefined"&&lg)Object.values(lg.players).forEach(p=>mv(p.p));
  return ch;
}
function stageOf(iso){const d=iso.slice(0,10);if(d<"2026-10-20")return"pi";if(d<"2026-11-02")return"sw";if(d<"2026-11-07")return"qf";if(d<"2026-11-10")return"sf";return"f"}
function finalize(list){
  let migrated=false;
  list.forEach(m=>{
    m.key=mkey(m);if(migrateKey(m))migrated=true;
    const man=manual[m.key];
    if(!m.winner && m.s1!=null && m.s2!=null && (m.s1>m.bo/2||m.s2>m.bo/2)) m.winner=m.s1>m.s2?m.t1:m.t2;
    if(!m.winner && man && (man===m.t1||man===m.t2)){m.winner=man;m.manual=true}
    const now=Date.now(), st=new Date(m.start).getTime();
    if(m.winner) m.state="done";
    else if(m.apiLive) m.state="live";
    else m.state=(now>st && (m.unst||now<st+m.bo*55*60e3))?"live":(now>=st+m.bo*55*60e3?"wait":"soon");
    if(m.unst&&now>st&&!m.winner&&!m.apiLive)m.state=now<st+3*3600e3?"live":"wait";   // refonte : « pas commencé » 3 h après l’heure prévue → en attente
  });
  if(migrated){LS.set("picks",picks);LS.set("manual",manual);LS.set("celebrated",celebrated);if(typeof scores!=="undefined")LS.set("scores",scores);if(typeof lg!=="undefined"&&lg)LS.set("league",lg)}
  list.sort((a,b)=>a.start<b.start?-1:a.start>b.start?1:0);
  const played={};
  list.filter(m=>m.stage==="sw").forEach(m=>{
    if(m.t1&&m.t2){const r=Math.max(played[m.t1]||0,played[m.t2]||0)+1;m.round=r;if(!/ronde/i.test(m.label||""))m.label="Ronde "+r;played[m.t1]=(played[m.t1]||0)+1;played[m.t2]=(played[m.t2]||0)+1}
  });
  return list;
}
function records(){
  const R={};TEAMS.forEach(t=>R[t.id]={sw:{w:0,l:0,form:[]},pi:{w:0,l:0},ko:{w:0,l:0}});
  MATCHES.forEach(m=>{
    if(!m.winner||!m.t1||!m.t2)return;
    const lo=m.winner===m.t1?m.t2:m.t1, b=m.stage==="sw"?"sw":m.stage==="pi"?"pi":"ko";
    R[m.winner][b].w++;R[lo][b].l++;
    if(b==="sw"){R[m.winner].sw.form.push("w");R[lo].sw.form.push("l")}
  });
  return R;
}
/* l'API LoL Esports nomme tous les matchs du Play-In « Play-ins » : le dernier match joué fait foi */
const piWinner = () => {const pi=MATCHES.filter(m=>m.stage==="pi"),last=pi[pi.length-1];return (pi.find(m=>m.label==="Qualification"&&m.winner)||(last&&last.winner?last:{})).winner};
function status(id,R){
  const t=T[id],r=R[id];
  if(t.entry==="pi"){
    if(r.pi.l>=2) return {k:"out",txt:"Éliminé (Play-In)"};
    const w=piWinner(); if(w&&w!==id) return {k:"out",txt:"Éliminé (Play-In)"};
  }
  if(r.ko.l>0) return {k:"out",txt:"Éliminé en phase finale"};
  if(MATCHES.find(m=>m.stage==="f"&&m.winner===id)) return {k:"ko",txt:"Champion du monde"};
  if(r.ko.w>0||r.sw.w>=3) return {k:"ko",txt:r.ko.w?"En phase finale":"Qualifié pour les quarts"};
  if(r.sw.l>=3) return {k:"out",txt:"Éliminé (phase suisse)"};
  return {k:"in",txt:(r.sw.w+r.sw.l)?`En lice ${r.sw.w}-${r.sw.l}`:"En lice"};
}
/* ---- v13.5 l.1504-1514 : confettis : FX, confetti(x, y, couleurs, n) (canevas #fx du gabarit ; rien si mouvement réduit) (liste shell) ---- */
const FX={c:null,x:null,parts:[],run:false};
function confetti(cx,cy,colors,n=70){
  if(RM) return; if(!FX.c){FX.c=$("#fx");FX.x=FX.c&&FX.c.getContext&&FX.c.getContext("2d")} if(!FX.x) return;
  const dpr=Math.min(2,devicePixelRatio||1);FX.c.width=innerWidth*dpr;FX.c.height=innerHeight*dpr;
  for(let i=0;i<n;i++){const a=Math.random()*6.28,s=4+Math.random()*9;FX.parts.push({x:cx*dpr,y:cy*dpr,vx:Math.cos(a)*s*dpr,vy:(Math.sin(a)*s-6)*dpr,r:Math.random()*6.28,vr:(Math.random()-.5)*.4,w:(4+Math.random()*5)*dpr,h:(7+Math.random()*7)*dpr,c:colors[i%colors.length],life:1})}
  if(FX.run) return; FX.run=true;
  (function loop(){const x=FX.x;x.clearRect(0,0,FX.c.width,FX.c.height);
    FX.parts.forEach(p=>{p.vy+=.32*dpr;p.vx*=.985;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;p.life-=.012;x.save();x.globalAlpha=Math.max(0,p.life);x.translate(p.x,p.y);x.rotate(p.r);x.fillStyle=p.c;x.fillRect(-p.w/2,-p.h/2,p.w,p.h*Math.abs(Math.cos(p.r*2)));x.restore()});
    FX.parts=FX.parts.filter(p=>p.life>0&&p.y<FX.c.height+50);
    if(FX.parts.length)requestAnimationFrame(loop);else{FX.run=false;x.clearRect(0,0,FX.c.width,FX.c.height)}})();
}
/* ---- v13.5 l.1556-1556 : gyroscope : autorisation iPhone au premier toucher (askGyro) (liste shell) ---- */
function askGyro(){try{if(typeof DeviceOrientationEvent!=="undefined"&&typeof DeviceOrientationEvent.requestPermission==="function"&&!askGyro.done){askGyro.done=true;DeviceOrientationEvent.requestPermission().catch(()=>{})}}catch(e){}}
/* ---- v13.5 l.1600-1605 : sursis (défaites encore permises) (liste shell) ---- */
function lives(id,R){
  R=R||records();const st=status(id,R);if(!T[id]||st.k==="out"||/Champion/.test(st.txt))return null;const r=R[id];
  if(r.ko.w>0||r.sw.w>=3)return {n:1,ko:true,txt:"élimination directe"};
  if(T[id].entry==="pi"&&!r.sw.w&&!r.sw.l&&piWinner()!==id)return null;
  const n=3-r.sw.l;return {n,txt:n===1?"plus droit à l’erreur":`${n-1} défaite${n-1>1?"s":""} de sursis`};
}
/* ---- v13.5 l.1834-1834 : équipes de la phase suisse (16 : entrée directe + qualifiée du Play-In) (liste swiss) ---- */
function swissTeams(){return TEAMS.filter(t=>t.entry==="sw"||piWinner()===t.id||MATCHES.some(m=>m.stage==="sw"&&(m.t1===t.id||m.t2===t.id)))}
/* ---- v13.5 l.1926-1929 : carte du monde : coordonnées des pays, Allen, chargement d3 à la demande (liste players) ---- */
const GEO={kr:[127.8,36.4],cn:[104,34],vn:[106,15.5],tw:[121,23.7],us:[-100,40],ca:[-106,56],br:[-51,-10],ar:[-64,-34],fr:[2.4,46.6],de:[10.4,51.1],dk:[9.5,56],gr:[22,39.3],es:[-3.7,40.2],se:[15.5,62],pl:[19.3,52],mx:[-102,23.5],jp:[138,36],gb:[-2,53.5],nl:[5.3,52.2],be:[4.5,50.6],tr:[35,39],it:[12.5,42.8],pt:[-8,39.6],cz:[15.4,49.8],ru:[60,58],au:[134,-25],ph:[122,12],hk:[114.2,22.3],cl:[-71,-35],pe:[-75,-9.5],co:[-74,4.5],uy:[-56,-33]};
const NUM={kr:"410",cn:"156",vn:"704",tw:"158",us:"840",ca:"124",br:"076",ar:"032",fr:"250",de:"276",dk:"208",gr:"300",es:"724",se:"752",pl:"616",mx:"484",jp:"392",gb:"826",nl:"528",be:"056",tr:"792",it:"380",pt:"620",cz:"203",ru:"643",au:"036",ph:"608",cl:"152",pe:"604",co:"170",uy:"858"};
const ALLEN=[-96.67,33.1];
const loadScript=src=>new Promise((ok,ko)=>{const s=document.createElement("script");s.src=src;s.onload=ok;s.onerror=ko;document.head.appendChild(s)});
/* ---- v13.5 l.2100-2103 : Leaguepedia : pause et limite de requêtes (lpPause, isRL), utilisés par les blocs asynchrones (liste shell) ---- */
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let cqLast=0;
let lpPause=0,lpStrikes=0;
const isRL=e=>/rate|limit|429|503|ratelimited|exceeded/i.test(String(e&&e.message||e));
/* ---- v13.5 l.2117-2121 : nombres et formats (num, pct, kdaV, fx1, fx2) (liste shell) ---- */
const num=v=>{const n=parseFloat(v);return isNaN(n)?0:n};
const pct=(w,n)=>n?Math.round(w/n*100):0;
const kdaV=(k,d,a)=>(k+a)/Math.max(1,d);
const fx1=v=>(Math.round(v*10)/10).toLocaleString("fr-FR",{minimumFractionDigits:1,maximumFractionDigits:1});
const fx2=v=>(Math.round(v*100)/100).toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2});
/* ---- v13.5 l.2122-2133 : dates courtes, noms de tournois (séries, face-à-face) (liste players) ---- */
const fmtMonth=dt=>{const d=new Date(String(dt).replace(" ","T")+"Z");return isNaN(d)?"":d.toLocaleDateString("fr-FR",{month:"short",year:"numeric"})};
const fmtShort=dt=>{const d=new Date(String(dt).replace(" ","T")+"Z");return isNaN(d)?"":d.toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"2-digit"})};
function tourName(op){
  op=String(op||"");let m;
  if(m=op.match(/(\d{4}) Season World Championship/))return "Worlds "+m[1];
  if(m=op.match(/(\d{4}) Mid-Season Invitational/))return "MSI "+m[1];
  if(m=op.match(/(\d{4}) First Stand/))return "First Stand "+m[1];
  if(m=op.match(/(\d{4}) (Americas Cup|Esports World Cup)/))return (m[2]==="Americas Cup"?"Americas Cup ":"EWC ")+m[1];
  const s=op.split("/").map(x=>x.replace(/\bSeason\b/g,"").trim()).filter(Boolean).join(" ").replace(/\s+/g," ");
  return s.length>34?s.slice(0,33)+"…":s;
}
const linkOf=p=>p.page||p.id;
/* ---- v13.5 l.2137-2138 : robot : logos, photos, liens (liste shell) ---- */
function applySJ(){Object.entries(SJ.logos||{}).forEach(([id,f])=>{if(T[id]&&f){if(/^https?:/.test(f)){if(!LIVE_LOGO[id])LIVE_LOGO[id]=f}else T[id].lpImg=lpFile(f,240)}});
  Object.entries(SJ.pinfo||{}).forEach(([k,x])=>{const p=PLAYERS.find(y=>y.key===k);if(p){if(x.rn&&!p.realName)p.realName=x.rn;if(x.img&&!/silhouette|placeholder/i.test(x.img))p.lePhoto=x.img}});Object.entries(SJ.links||{}).forEach(([k,L])=>{const p=PLAYERS.find(x=>x.key===k);if(p&&L&&!p.page)p.page=L})}
/* ---- v13.5 l.2195-2292 : draft.json : clés de champion, picks et bans probables, matchups (liste shell) ---- */
const CK_AL={monkeyking:"wukong",renata:"renataglasc",nunu:"nunuwillump"};
const ckey=s=>{const n=norm(s);return CK_AL[n]||n};
const djSet=b=>b instanceof Set?b:new Set((b||[]).map(ckey));
function djIx(D){
  if(D._ix)return D._ix;
  const ix={c:new Map(),mu:new Map(),meta:new Map()};
  D.ch.forEach((n,i)=>ix.c.set(ckey(n),i));
  ROLE_ORDER.forEach(r=>((D.mu||{})[r]||[]).forEach(x=>ix.mu.set(r+"|"+x[0]+"|"+x[1],x)));
  ((D.meta||{}).c||[]).forEach(x=>ix.meta.set(x[0],x));
  Object.defineProperty(D,"_ix",{value:ix,enumerable:false});return ix;
}
const djName=k=>{if(!k)return"";const p=PLAYERS.find(x=>x.key===k);return p?p.id:/^[A-Z0-9]+_/.test(k)?k.split("_").slice(1).join("_"):k};
const djT=id=>T[id]?T[id].id:String(id||"");
const djS=(n,one,many)=>`${n} ${n>1?many:one}`;
const djCh=(c,D=DJ)=>{const i=D?djIx(D).c.get(ckey(c)):undefined;return i!=null?D.ch[i]:c};

/* champions déjà joués dans la série (fearless : ni pickables ni utiles à bannir).
   games : parties de matchGames(m) (x.b.p[].c), ou listes de noms, ou objets {picks:[...]} */
function fearlessBurned(games){
  const s=new Set();
  (games||[]).forEach(g=>{if(!g||g.none||g.err)return;
    const l=Array.isArray(g)?g:(g.b&&g.r)?[...(g.b.p||[]),...(g.r.p||[])].map(p=>p&&(p.c||p.championId)):(g.picks||[]);
    l.forEach(c=>{if(c)s.add(ckey(c))})});
  return s;
}

/* picks probables d'un joueur : n premiers après retrait du fearless. txt « 6/42 » = 6 de ses 42 parties des 90 derniers jours ;
   w = victoires sur ce champion (null si hors de ses 10 champions les plus joués). */
function picksFor(key,burned,n=5,D=DJ){
  if(!D||!D.pp||!D.pp[key])return [];
  const B=djSet(burned),pool=(D.pool&&D.pool[key])||[0,0,[]],tot=pool[0],wn=new Map(pool[2].map(x=>[x[0],x[2]]));
  return D.pp[key].filter(([i])=>!B.has(ckey(D.ch[i]))).slice(0,n).map(([i,c])=>({c:D.ch[i],n:c,of:tot,w:wn.has(i)?wn.get(i):null,
    txt:c?`${c}/${tot}`:"–",long:c?`${c} de ses ${tot} parties des 90 derniers jours${wn.has(i)?`, ${djS(wn.get(i),"victoire","victoires")}`:""}`:"pas joué depuis 90 jours"}));
}

/* bans attendus de l'équipe A contre l'équipe B (ce qu'A retirera à B), fearless retiré.
   score = pb[B] (×10 000 : taux de ban du tournoi × pool des 5 joueurs de B + bans déjà subis par B) + nu × bans déjà faits par A.
   Testé : au moins un des 3 premiers a été banni dans 84 % des cas aux Worlds 2025, 75 % en 2026 (voir D.fi). */
function bansFor(A,B,burned,n=5,D=DJ){
  if(!D||!D.pb||!D.pb[B])return [];
  const Bs=djSet(burned),nu=(D.par&&D.par.nu)||2,ta=(D.tb||{})[A]||[0,[]],tg=ta[0],by=new Map(ta[1]),ix=djIx(D),cand=new Map();
  D.pb[B].forEach(r=>cand.set(r[0],{i:r[0],s:r[1]/1e4,r}));
  by.forEach((v,i)=>{if(!cand.has(i)){const m=ix.meta.get(i);cand.set(i,{i,s:m?m[6]/1e4:0,r:null})}});
  return [...cand.values()].filter(x=>!Bs.has(ckey(D.ch[x.i])))
    .map(x=>({...x,s:x.s+(by.get(x.i)||0)*nu/(tg+1),a:by.get(x.i)||0}))
    .sort((x,y)=>y.s-x.s||x.i-y.i).slice(0,n)
    .map(x=>({c:D.ch[x.i],who:x.r&&x.r[2]||null,...banWhy(x,A,B,tg,D)}));
}
function banWhy(x,A,B,tg,D){
  const r=x.r,w=[],m=djIx(D).meta.get(x.i),N=(D.meta||{}).n||0;
  if(r&&r[2])w.push(`${djName(r[2])} : ${r[3]} de ses ${r[4]} parties des 90 derniers jours, ${djS(r[5],"victoire","victoires")}`);
  if(x.a)w.push(`${djT(A)} l’a banni ${x.a} fois en ${djS(tg,"partie","parties")} à ces Worlds`);
  if(r&&r[6])w.push(`banni ${r[6]} fois contre ${djT(B)} à ces Worlds`);
  if(!w.length&&m&&N&&m[3])w.push(`banni dans ${Math.round(m[3]/N*100)} % des parties des Worlds (${m[3]}/${N})`);
  else if(!w.length&&m&&m[1])w.push(`choisi ${m[1]} fois à ces Worlds`);
  if(!w.length)w.push("très joué dans les ligues dans les 45 jours avant les Worlds");
  return {why:w.slice(0,2).join(" ; ")};
}

/* duel de deux champions au même poste, 2025-2026 toutes ligues (paires d'au moins 3 parties).
   Victoires : comptes bruts, % seulement à partir de 10 parties ; p = estimation avec a priori Beta(50,50) (k = 100).
   Or à 15 min : moyenne avec a priori normal centré sur 0 (k = 10 parties) ; « net » si l'estimation dépasse 1,64 écart-type a posteriori.
   Testé hors échantillon : le bilan de victoires ne prédit pas le vainqueur (pile ou face), l'écart d'or à 15 min un peu (D.mu.fi). */
function matchup(role,a,b,D=DJ){
  a=a||"";b=b||"";   // draft en cours : un champion pas encore choisi (undefined) ne doit pas s'afficher « undefined »
  const ix=D&&D.mu?djIx(D):null,ia=ix?ix.c.get(ckey(a)):undefined,ib=ix?ix.c.get(ckey(b)):undefined;
  const na=ia!=null?D.ch[ia]:a,nb=ib!=null?D.ch[ib]:b,since=(D&&D.mu&&D.mu.since)||"2025",rl=role==="BOT"?"ADC":(ROLES[role]||role).toLowerCase();
  const none=t=>({g:0,w:0,p:.5,gd:0,raw:null,n15:0,net:false,v:0,a:na,b:nb,role,lbl:"–",txt:t});
  if(!a||!b)return none("Champion pas encore choisi : pas de duel à mesurer.");
  if(ia!=null&&ia===ib)return none(`${na} des deux côtés : pas de duel à mesurer.`);
  let x=null,fl=false;
  if(ix&&ia!=null&&ib!=null){x=ix.mu.get(role+"|"+ia+"|"+ib)||null;if(!x){x=ix.mu.get(role+"|"+ib+"|"+ia)||null;fl=!!x}}
  if(!x)return none(`${na} contre ${nb} (${rl}) : moins de 3 parties pro face à face depuis ${since}, pas de bilan.`);
  const [K1,K2]=D.mu.k||[100,10],g=x[2],wa=fl?g-x[3]:x[3],gs=(fl?-1:1)*x[4],n15=x[5];
  const p=(wa+K1/2)/(g+K1),gd=gs/(n15+K2),sd=730/Math.sqrt(n15+K2),net=n15>=3&&Math.abs(gd)>1.64*sd;
  const v=Math.round(Math.abs(gd)/10)*10,raw=n15?gs/n15:null,rv=raw==null?0:Math.round(Math.abs(raw)/10)*10,lead=(raw||0)>=0?na:nb;
  let txt=`${na} contre ${nb} (${rl}) : ${djS(g,"partie","parties")} pro face à face depuis ${since}, toutes ligues.`;
  if(n15<3)txt+=" Écart d’or à 15 min pas mesuré.";
  else if(net)txt+=` À 15 min, ${lead} a ${rv} d’or d’avance en moyenne sur ${n15} parties (estimation prudente : ${v}).`;
  else txt+=rv?` À 15 min, pas d’écart net : ${lead} +${rv} d’or en moyenne sur ${n15} parties.`:` À 15 min, aucun écart d’or (${n15} parties).`;
  txt+=` Victoires : ${wa} pour ${na}, ${g-wa} pour ${nb}${g>=10?` (${Math.round(wa/g*100)} % pour ${na})`:""}, un bilan sans valeur de pronostic (testé).`;
  return {g,w:wa,p,gd,raw,n15,net,v,a:na,b:nb,role,lbl:net?(gd>0?"+":"−")+v:n15>=3?"≈":"?",txt};
}

/* picks préférés contre picks préférés : les n picks probables de chaque joueur (fearless retiré), croisés deux à deux.
   cells[i][j] = matchup(poste, i-ème pick de A, j-ème pick de B) ; txt = la phrase qui résume. */
function prefVsPref(ka,kb,burned,n=3,D=DJ){
  const pa=PLAYERS.find(p=>p.key===ka),role=pa?pa.role:null,since=(D&&D.mu&&D.mu.since)||"2025";
  const A=picksFor(ka,burned,n,D),B=picksFor(kb,burned,n,D);
  if(!role||!A.length||!B.length||!D||!D.mu)return {role,A,B,cells:[],txt:""};
  const cells=A.map(x=>B.map(y=>matchup(role,x.c,y.c,D))),all=cells.flat(),meas=all.filter(c=>c.n15>=3);
  const net=meas.filter(c=>c.net).filter((c,i,L)=>!L.some((d,j)=>j<i&&d.a===c.b&&d.b===c.a)).sort((p,q)=>Math.abs(q.gd)-Math.abs(p.gd));
  const one=c=>`${c.gd>0?c.a:c.b} +${c.v} contre ${c.gd>0?c.b:c.a} (${djS(c.n15,"partie","parties")})`;
  const txt=!meas.length?`${all.length>1?`Aucun de ces ${all.length} duels n’a été joué`:"Ce duel n’a pas été joué"} 3 fois en pro depuis ${since}.`
    :net.length?`Écart d’or net à 15 min : ${net.slice(0,2).map(one).join(" ; ")}${net.length>2?`, et ${net.length-2} autre${net.length>3?"s":""}`:""}. Pas d’écart net sur les autres duels mesurés.`
    :`Aucun écart d’or net à 15 min sur ${meas.length>1?`les ${meas.length} duels mesurés`:"le seul duel mesuré"} (sur ${all.length}).`;
  return {role,A,B,cells,txt};
}
/* ---- v13.5 l.2294-2299 : draft : méthode et fiabilité des duels de champions (djMuNote) (liste match) ---- */
/* méthode et fiabilité des duels de champions (niveau 3), chiffres de D.mu.fi (test hors échantillon du robot) */
function djMuNote(D){
  const M=D.mu,fi=(M.fi||[]).slice(-1)[0],nf=v=>Number(v).toLocaleString("fr-FR"),dt=s=>s.split("-").reverse().join("/");
  return `<p>Duels au même poste, toutes ligues depuis ${esc(M.since)} (paires d’au moins ${M.min} parties). L’écart d’or à 15 min est une moyenne ramenée vers 0 quand il y a peu de parties (a priori de ${M.k[1]} parties) ; « net » quand l’estimation dépasse 1,64 écart-type.</p>`
   +(fi&&fi.nn?`<p>Vérifié sur ${nf(fi.nn)} duels « nets » joués après le ${dt(fi.cut)} : écart prévu +${fi.pre} d’or, observé +${fi.obs} ; le champion annoncé devant l’était à 15 min dans ${fi.dev} % des cas. Mais son équipe n’a gagné que ${fi.win} % de ces parties : l’avance de couloir ne dit pas qui gagne. Le bilan de victoires d’un duel ne le dit pas non plus (pas mieux que pile ou face sur ${nf(fi.n)} duels). Mêmes résultats avec ${M.fi.length-1} autres dates de coupure.</p>`:"");
}
/* ---- v13.5 l.2304-2325 : draft : phrases de fiabilité, conseil de bans, données d'avant-match (draftMatchData, cache dj_*) (liste match) ---- */
function djFi(D){
  const f=(D&&D.fi)||[],a=f.find(x=>x.y==="2025"&&x.bn),b=f.find(x=>x.y===D.y&&x.y!=="2025"&&x.bn),P=v=>Math.round(v*100)+" %";
  return {b:a?`Au moins un des 3 premiers bans attendus a vraiment été banni dans ${P(a.b3)} des cas aux Worlds 2025 (${a.bn} cas)${b?` et ${P(b.b3)} à ces Worlds (${b.bn} cas)`:""}. En moyenne, ${String(a.b5).replace(".",",")} des 5 vrais bans figurent dans nos 5 (2025).`:"",
    p:a?`Le champion joué figurait dans les 3 premiers picks probables ${P(a.p3)} du temps aux Worlds 2025 (${a.pn} picks)${b?` et ${P(b.p3)} à ces Worlds (${b.pn})`:""} ; dans les 5 premiers, ${P(a.p5)}${b?` et ${P(b.p5)}`:""}.`:""};
}
/* conseil de bans : ce qu'un ban retire au joueur visé est affiché, son effet sur la victoire n'est pas prouvé (D.cb) */
function djCb(D){
  const c=D&&D.cb,f=v=>(v>0?"+":"")+String(v).replace(".",",").replace("-","−"),pt=v=>f(v)+(Math.abs(v)>=2?" points":" point");if(!c)return"";
  return `<p>Conseil de bans : chaque raison indique la part des parties récentes du joueur visé que le ban lui retire. Mais un joueur ne gagne pas plus souvent sur ses 3 champions favoris que sur les autres : ${pt(c.d)} sur ${Number(c.n).toLocaleString("fr-FR")} parties de 2025-2026 (intervalle ${f(c.lo)} à ${f(c.hi)}), ${pt(c.di)} aux internationaux (${Number(c.ni).toLocaleString("fr-FR")} parties, intervalle ${f(c.loi)} à ${f(c.hii)}). Rien ne prouve donc qu’un ban ciblé fasse gagner.</p>`;
}
/* données d'avant-match pour ablock (sérialisables) : bans attendus des deux côtés, picks probables, duels de picks, fearless */
async function draftMatchData(m){
  await loadDJ();if(!DJ)throw new Error("draft.json pas encore publié");
  let burned=new Set();
  if(m.bo>1&&(m.s1||0)+(m.s2||0)>0&&/^le\d/.test(m.id)){try{burned=fearlessBurned((await matchGames(m)).games)}catch(e){}}
  const P1=teamPlayers(m.t1),P2=teamPlayers(m.t2);
  const lanes=ROLE_ORDER.map(r=>{const a=P1.find(p=>p.role===r),b=P2.find(p=>p.role===r);
    const v=a&&b?prefVsPref(a.key,b.key,burned,3):{A:a?picksFor(a.key,burned,3):[],B:b?picksFor(b.key,burned,3):[],cells:[],txt:""};
    return {r,a:a?a.id:"",b:b?b.id:"",A:v.A,B:v.B,cells:v.cells.map(row=>row.map(c=>[c.lbl,c.n15,c.txt])),txt:v.txt}});
  return {burned:[...burned].map(k=>djCh(k)),b1:bansFor(m.t2,m.t1,burned),b2:bansFor(m.t1,m.t2,burned),lanes,fi:djFi(DJ),n:(DJ.meta||{}).n||0,
    cb:djCb(DJ),since:(DJ.mu||{}).since||"2025",tn:(DJ.meta||{}).tn||[],mu:DJ.mu?djMuNote(DJ):""};
}
/* ---- v13.5 l.2376-2404 : blocs asynchrones ablock(clé, données, rendu, durée h) : squelette, cache w26_ak_*, erreur + Réessayer (liste shell) ---- */
/* ---- blocs asynchrones : squelette, puis contenu, survivent aux re-rendus ---- */
const AK={};
const akSkel=(n=3)=>`<div class="skel">${Array.from({length:n},()=>"<i></i>").join("")}</div>`;
const errHTML=k=>{const a=AK[k]||{},m=String(a.emsg||"");const rl=/rate|limit|exceeded/i.test(m);
  return `<div class="aerr"><span>${rl?`Leaguepedia limite les requêtes. Nouvel essai automatique dans ${Math.max(1,Math.ceil((lpPause-Date.now())/60e3))} min.`:"Données injoignables pour l’instant."}${!rl&&m?`<small>${esc(m.slice(0,120))}</small>`:""}</span><button class="btn" data-retry="${esc(k)}">Réessayer</button></div>`};
const waitHTML=()=>`<div class="aerr"><span>Leaguepedia limite les requêtes. Chargement automatique dans ${(s=>s>90?Math.ceil(s/60)+" min":s+" s")(Math.max(5,Math.round((lpPause-Date.now())/1000)))}.</span></div>`;
let akIO=null;
function armAk(){
  if(!akIO&&window.IntersectionObserver)akIO=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;const k=e.target.dataset.ak,a=AK[k];akIO.unobserve(e.target);if(a&&a.st==="load"&&!a.started)runAk(k)}),{rootMargin:"300px"});
  document.querySelectorAll(".ak[data-ak]").forEach(el=>{const a=AK[el.dataset.ak];if(a&&a.st==="load"&&!a.started){if(akIO)akIO.observe(el);else runAk(el.dataset.ak)}});
}
function ablock(key,fn,render,ttlH=6){
  let a=AK[key];
  if(!a){
    a=AK[key]={st:"load",fn,render,ttlH};
    const c=LS.get("ak_"+key,null);
    if(c&&Date.now()-c.t<ttlH*3600e3&&!(SJ&&SJ.built&&c.t<Date.parse(SJ.built))){a.st="ok";a.data=c.d}
    else setTimeout(armAk,0);
  } else {a.render=render;a.fn=fn;if(a.st==="load"&&!a.started)setTimeout(armAk,0)}
  const body=a.st==="ok"?safeRender(a):a.st==="err"?errHTML(key):lpPause>Date.now()&&!SJ?waitHTML():akSkel();
  return `<div class="ak" data-ak="${esc(key)}">${body}</div>`;
}
function safeRender(a){try{return a.render(a.data)}catch(e){console.error(e);return `<p class="small">Données incomplètes pour ce bloc.</p>`}}
async function runAk(key){
  const a=AK[key];a.st="load";a.started=true;
  try{a.data=await a.fn();a.st="ok";a.emsg=null;if(!(a.data&&a.data.nocache))LS.set("ak_"+key,{t:Date.now(),d:a.data})}catch(e){console.warn(key,e);a.st="err";a.emsg=String(e&&e.message||e);
    if(isRL(e)){clearTimeout(a.rt);a.rt=setTimeout(()=>{if(a.st==="err"&&document.querySelector(`[data-ak="${CSS.escape(key)}"]`)){document.querySelectorAll(`[data-ak="${CSS.escape(key)}"]`).forEach(el=>el.innerHTML=akSkel());runAk(key)}},Math.max(65000,lpPause-Date.now()+5000))}}
  document.querySelectorAll(`[data-ak="${CSS.escape(key)}"]`).forEach(el=>{el.innerHTML=a.st==="ok"?safeRender(a):errHTML(key);el.classList.add("in")});
}
/* ---- v13.5 l.2571-2572 : outils de rendu de v13.5 : tuiles, liste de champions (liste shell) ---- */
function tiles(list){return `<div class="tiles">${list.map(([v,l])=>`<div class="tile hx"><b>${v}</b><span>${l}</span></div>`).join("")}</div>`}
function champList(cs){return `<div class="clist">${cs.map(c=>`<div class="crow">${champ(c.c,32)}<span class="cn">${esc(c.c)}<small>${c.g} partie${c.g>1?"s":""}, KDA ${fx1(kdaV(c.k,c.d,c.a))}</small></span><span class="cw"><i style="width:${pct(c.w,c.g)}%"></i></span><b>${pct(c.w,c.g)} %</b></div>`).join("")}</div>`}
/* ---- v13.5 l.2578-2601 : modèles du robot : probas de match, note d'impact, lane (liste shell) ---- */
const sigm=x=>1/(1+Math.exp(-x));
function Phi(x){const t=1/(1+0.3275911*Math.abs(x)/Math.SQRT2),y=1-((((1.061405429*t-1.453152027)*t+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x/2);return x>=0?(1+y)/2:(1-y)/2}
const GX=Array.from({length:49},(_,k)=>-6+.25*k),GW0=GX.map(x=>Math.exp(-x*x/2)),GWS=GW0.reduce((a,b)=>a+b,0),GW=GW0.map(w=>w/GWS);
function firstTo(p,a,b){const q=1-p;let s=0,c=1;for(let k=0;k<b;k++){if(k)c=c*(a-1+k)/k;s+=c*q**k}return p**a*s}
/* P(A gagne le match) : za = alpha×(force A − force B) ; a0 = avantage du côté bleu ; score en cours wa-wb ;
   aBlue true/false/null (Bo1) ; h = jours avant le match ; v = [variance de série, dérive par jour] (SJ.sim.var). */
function matchProb(za,bo,{a0=0,wa=0,wb=0,aBlue=null,h=0,v=[.4,.0093]}={}){
  const k=Math.sqrt(1+Math.PI*v[0]/8),sd=Math.sqrt(v[0]+2*v[1]*h);
  if(bo===1){const f=z=>GX.reduce((s,x,i)=>s+GW[i]*sigm(k*z+sd*x),0);return aBlue==null?(f(a0+za)+1-f(a0-za))/2:aBlue?f(a0+za):1-f(a0-za)}
  const need=(bo>>1)+1;let num=0,den=0;
  GX.forEach((x,i)=>{const p=sigm(k*za+sd*x),l=GW[i]*p**wa*(1-p)**wb;num+=l*firstTo(p,need-wa,need-wb);den+=l});return num/den;
}
/* force d'une équipe = somme des notes de ses 5 joueurs (SJ.sim.S pour les 16 des Worlds, sinon SJ.m.t) ; P(A bat B) pour un match quelconque */
function teamProb(A,B,bo,o={}){const M=SJ.m,t=Object.assign({},M&&M.t,SJ.sim&&SJ.sim.S);if(!M||t[A]==null||t[B]==null)return null;
  return matchProb(M.logit[1]*(t[A]-t[B]),bo,{a0:M.logit[0],v:(SJ.sim&&SJ.sim.var)||[.4,.0093],...o})}
/* écart-type de la différence de deux notes (rééchantillonnages du robot), puis P(A mieux noté que B) */
function pairSd(role,ka,kb){const P=SJ.m.pd&&SJ.m.pd[role];if(!P)return null;const o=P.o,n=o.length,i=o.indexOf(ka),j=o.indexOf(kb);
  if(i<0||j<0||i===j)return null;const a=Math.min(i,j),b=Math.max(i,j);return P.s[a*n-a*(a+1)/2+(b-a-1)]/1000}
function pBetter(ka,kb,role){const A=SJ.m.p[ka],B=SJ.m.p[kb];if(!A||!B)return null;const s=pairSd(role,ka,kb)||Math.hypot(A[1],B[1]);
  return {d:A[0]-B[0],sd:s,p:Phi((A[0]-B[0])/s)}}
/* duel de lane (modèle D) : écart attendu à 15 min pour A et P(A devant) ; cs=true : en CS, sinon en or */
function laneDuel(ka,kb,role,cs){const L=SJ&&SJ.lane,A=L&&L.p[ka],B=L&&L.p[kb];if(!A||!B)return null;const i=cs?0:2,g=L.sg[role];
  const e=A[i]-B[i];return {e,p:Phi(e/Math.sqrt(g[cs?1:0]**2+A[i+1]**2+B[i+1]**2))}}
const IMP=p=>SJ&&SJ.m&&SJ.m.p&&SJ.m.p[p.key];
/* ---- v13.5 l.2607-2616 : PHI, fxs, robotProb (liste shell) ---- */
const PHI=x=>{const t=1/(1+.3275911*Math.abs(x)/Math.SQRT2),y=1-((((1.061405429*t-1.453152027)*t+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-x*x/2);return x>=0?(1+y)/2:(1-y)/2};
const fxs=v=>(v>0?"+":v<0?"−":"")+fx2(Math.abs(v));
// probabilité que t1 gagne le match (série complète, score en cours compris)
function robotProb(m){
  if(!SJ||!SJ.m||!m.t1||!m.t2)return null;
  const x=SJ.sim&&(SJ.sim.mt||[]).find(r=>"le"+r[0]===m.id||r[0]===m.id);
  if(x&&(x[1]===m.t1||x[2]===m.t1))return x[1]===m.t1?x[4]:1-x[4];
  const h=Math.max(0,(new Date(m.start||Date.now())-Date.now())/864e5);
  return teamProb(m.t1,m.t2,m.bo||1,{wa:m.s1||0,wb:m.s2||0,h});
}
/* ---- v13.5 l.2660-2673 : stats 2026 par joueur : PSTAT, MINR, ROLEP, seasonOf, statVal, ranking, rankOf (liste players) ---- */
const SV2=()=>!!(SJ&&SJ.v>=2);
// id, libellé, calcul sur la saison, format, plus haut = mieux
const PSTAT=[["imp","Note d’impact",S=>null,v=>fxs(v),1],["win","Victoires",S=>S.w/S.g*100,v=>Math.round(v)+" %",1],["kda","KDA",S=>kdaV(S.k,S.d,S.a),fx2,1],
  ["kpg","Kills par partie",S=>S.k/S.g,fx1,1],["dpg","Morts par partie",S=>S.d/S.g,fx1,0],["apg","Assists par partie",S=>S.a/S.g,fx1,1],
  ["kp","Participation aux kills",S=>S.kpn?S.kps/S.kpn*100:S.tk?(S.k+S.a)/S.tk*100:null,v=>Math.round(v)+" %",1],["dmg","Part des dégâts",S=>S.dsn?S.ds/S.dsn*100:null,v=>Math.round(v)+" %",1],
  ["csm","CS par minute",S=>S.cs/Math.max(1,S.min),fx1,1],["gpm","Or par minute",S=>S.gold/Math.max(1,S.min),v=>Math.round(v),1],
  ["gd15","Écart d’or à 15 min",S=>S.n15?S.gd15/S.n15:null,v=>(v>0?"+":"")+Math.round(v),1],["csd15","Écart de CS à 15 min",S=>S.n15?S.csd15/S.n15:null,v=>(v>0?"+":"")+fx1(v),1],
  ["wpg","Balises par partie",S=>S.wn?S.wp/S.wn:null,fx1,1],["pool","Champions joués",S=>S.pool,v=>v,1]];
const MINR=10;   // parties 2026 minimum pour être classé
const ROLEP={TOP:"des tops",JGL:"des junglers",MID:"des mids",BOT:"des ADC",SUP:"des supports"};
function seasonOf(p){const x=SV2()&&SJ.players&&SJ.players[p.key];return x&&x.S&&x.S.g?x.S:null}
function statVal(p,id){if(id==="imp"){const x=IMP(p);return x?x[0]:null}const S=seasonOf(p),d=PSTAT.find(x=>x[0]===id);if(!S||!d)return null;const v=d[2](S);return v==null||!isFinite(v)?null:v}
function ranking(id,filt){const d=PSTAT.find(x=>x[0]===id);return PLAYERS.filter(p=>filt(p)&&(seasonOf(p)||{}).g>=MINR&&statVal(p,id)!=null).map(p=>({p,v:statVal(p,id)})).sort((a,b)=>d[4]?b.v-a.v:a.v-b.v)}
function rankOf(p,id){const r=ranking(id,x=>x.role===p.role),i=r.findIndex(x=>x.p===p);return i<0?null:{i:i+1,n:r.length}}
/* ---- v13.5 l.2683-2684 : adversaire par défaut d'une comparaison (bestFoe) (liste players) ---- */
function bestFoe(p){const nm=MATCHES.find(m=>(m.t1===p.team||m.t2===p.team)&&m.t1&&m.t2&&m.state!=="done"),opp=nm&&(nm.t1===p.team?nm.t2:nm.t1);
  return PLAYERS.find(x=>x.team===opp&&x.role===p.role)||(ranking("kda",x=>x.role===p.role&&x!==p)[0]||{}).p||PLAYERS.find(x=>x.role===p.role&&x!==p)}
/* ---- v13.5 l.2793-2881 : clés du match (SJ.pm) : phrases, taux, fiabilité, table de référence ; correction du prono après la draft (draftAdjust, draftFeat, draftSides, gameProbE) (liste match) ---- */
const ROLE_AU={TOP:"au top",JGL:"en jungle",MID:"au mid",BOT:"à l’ADC",SUP:"au support"};
const nf=v=>Number(v).toLocaleString("fr-FR");
const pc0=v=>Math.round(v*100)+" %";
const pnm=k=>{const p=PLAYERS.find(x=>x.key===k);return esc(p?p.id:String(k||"").split("_").slice(1).join("_"))};
const tnm=c=>esc(T[c]?T[c].id:c);
const sgd=v=>(v>0?"+":v<0?"−":"")+nf(Math.abs(Math.round(v)));
const dfr=d=>new Date(d+"T12:00:00Z").toLocaleDateString("fr-FR",{day:"numeric",month:"long",...(String(d).slice(0,4)!==String(new Date().getFullYear())?{year:"numeric"}:{})});
/* ligne de la série dans SJ.pm.m : [matchId, A, B, bo, début, P(A série), P(A partie), clés] */
function pmRow(m){const P=SJ&&SJ.pm;if(!P||!P.m||!m.t1||!m.t2)return null;const two=x=>[x[1],x[2]].includes(m.t1)&&[x[1],x[2]].includes(m.t2);
  return P.m.find(x=>("le"+x[0]===m.id||x[0]===m.id)&&two(x))||P.m.find(x=>two(x)&&String(x[4]).slice(0,10)===String(m.start||"").slice(0,10))||null}
/* taux de référence : [parties, victoires, attendues, IC bas, IC haut] -> phrase courte */
function dejaTxt(typ){const R=SJ.pm.ref||{},x=R[typ];if(!x||!x.tout)return"";const [n,w,e]=x.tout,I=x.intl;
  let t=`Dans ce cas, ${pc0(w/n)} de victoires depuis 2025 (${nf(n)} parties) pour ${pc0(e/n)} prévus : rien de plus que la note.`;
  if(I&&I[0]>=20&&I[3]>0)t+=` Internationales : ${nf(I[1])} sur ${nf(I[0])} (${pc0(I[1]/I[0])}, ${pc0(I[2]/I[0])} prévus), trop peu de cas pour conclure.`;
  return t}
/* même fait quand il désigne l'outsider du robot (l'équipe concernée n'est pas le favori) */
function contreTxt(typ){const R=SJ.pm.ref||{},x=R.contre&&R.contre[typ];if(!x||!x.tout)return dejaTxt(typ);const [n,w,e]=x.tout,I=x.intl;
  let t=`Quand ce fait contredit le robot, l’équipe qu’il désigne gagne ${pc0(w/n)} des parties depuis 2025 (${nf(n)}) pour ${pc0(e/n)} prévus : le robot a raison.`;
  if(I&&I[0]>=20&&I[3]>0)t+=` Mais aux internationales : ${nf(I[1])} sur ${nf(I[0])} (${pc0(I[1]/I[0])}, ${pc0(I[2]/I[0])} prévus, ${I[5]} séries seulement) : piste à surveiller, pas une preuve.`;
  return t}
/* une clé -> {h: phrase, tag: "on" (change les chances) | "" (déjà dans la note), r: taux en petit} ; null si rien à dire */
function keyLine(k,row){
  const [typ]=k,A=row[1],R=SJ.pm.ref||{},fk=row[7].find(z=>z[0]==="fav"),fav=fk?fk[1]:null,ref=(t,c)=>fav&&c!==fav?contreTxt(t):dejaTxt(t),
    tg=(t,c)=>{const I=fav&&c!==fav&&R.contre&&R.contre[t]&&R.contre[t].intl;return I&&I[0]>=20&&I[3]>0?"w":""};
  if(typ==="poste"){const [,r,ka,kb,d,pts]=k,aw=d>0,w=aw?ka:kb,l=aw?kb:ka;
    return {tag:"on",h:`${esc(ROLES[r])} : <b>${pnm(w)}</b> mieux noté que ${pnm(l)} (${fxs(Math.abs(d))}), environ ${fx1(Math.abs(pts))} point${Math.abs(pts)>=1.95?"s":""} de chances pour ${tnm(aw?A:row[2])}.`}}
  if(typ==="cote"){const x=R.cote;if(!x)return null;const [n,w]=x.tout,I=x.intl;
    return {tag:"on",h:`${tnm(k[1])} joue côté bleu.`,r:`En 2026, le bleu gagne ${pc0(w/n)} des parties (${nf(n)})${I?`, ${pc0(I[1]/I[0])} aux internationales (${nf(I[0])})`:""}. Le robot lui compte environ 4 points.`}}
  if(typ==="regle"){const [,c,g1,g2,g3]=k;
    return {tag:tg("regle",c),h:`Règle de Thomas remplie pour <b>${tnm(c)}</b> : top, jungle et mid en moyenne devant leur vis-à-vis à 15 min sur leurs 3 derniers duels (${sgd(g1)}, ${sgd(g2)} et ${sgd(g3)} d’or).`,r:ref("regle",c)}}
  if(typ==="duel"){const [,r,ka,kb,n,ha,hb,gd,wa]=k,aw=ha>=hb,w=aw?ka:kb,l=aw?kb:ka,kk=aw?ha:hb,ww=aw?wa:n-wa,tw=aw?A:row[2];
    return {tag:tg("duel",tw),h:`${esc(ROLES[r])} : <b>${pnm(w)}</b> devant ${pnm(l)} à 15 min dans ${kk===n?"":`${kk} de `}leurs ${n} derniers duels (${sgd(Math.abs(gd))} d’or en moyenne)${ww===0?`, mais ${tnm(tw)} a perdu ces ${n} parties`:ww===1?`, mais ${tnm(tw)} n’en a gagné qu’une`:ww*2<n?`, mais ${tnm(tw)} n’en a gagné que ${ww}`:ww===n?`, et ${tnm(tw)} a gagné ces ${n} parties`:`, et ${tnm(tw)} en a gagné ${ww}`}.`,r:ref("duel",tw)}}
  if(typ==="h2h"){const [,c,sw,sl,gw,gl,d]=k,o=c===A?row[2]:A,ns=sw+sl;
    if(ns===1)return {tag:tg("h2h",c),h:`Face-à-face : <b>${tnm(c)}</b> a gagné leur seule série depuis 2024 (${gw} manche${gw>1?"s":""} à ${gl}, le ${dfr(d)}).`,r:ref("h2h",c)};
    return {tag:gw===gl?"":tg("h2h",c),h:gw===gl?`Face-à-face : égalité sur les ${ns} dernières séries (${gw} manche${gw>1?"s":""} partout), la dernière le ${dfr(d)}.`:
      `Face-à-face : <b>${tnm(c)}</b> a gagné ${sw===ns?`ses ${ns} dernières séries`:`${sw} de ses ${ns} dernières séries`} contre ${tnm(o)} (${gw} manche${gw>1?"s":""} à ${gl}), la dernière le ${dfr(d)}.`,r:gw===gl?"":ref("h2h",c)}}
  if(typ==="forme"){const [,c,w,l,wo]=k,o=c===A?row[2]:A;
    return {tag:tg("forme",c),h:`Forme : <b>${tnm(c)}</b> a gagné ${w} de ses 10 dernières séries, ${tnm(o)} ${wo}.`,r:ref("forme",c)}}
  return null;
}
/* fiabilité du robot à ce niveau de confiance (par partie) */
function calTxt(pg){const C=SJ.pm.ref&&SJ.pm.ref.cal;if(!C||pg==null)return"";const f=Math.max(pg,1-pg),b=x=>x&&x.bins.filter(z=>z[0]<=f+1e-9).pop();
  const a=b(C.tout),i=b(C.intl);if(!a)return"";const hi=a[0]>=.8?"plus de 80":`${Math.round(a[0]*100)} à ${Math.round(a[0]*100)+10}`;
  return `Quand le robot donne ${hi} % à une équipe sur une partie, elle gagne ${pc0(a[2]/a[1])} du temps (${nf(a[2])} sur ${nf(a[1])} parties 2025-2026)${i&&i[1]>=30?`, ${pc0(i[2]/i[1])} aux internationales (${nf(i[2])} sur ${nf(i[1])})`:""}.`}
/* niveau 1 : pourquoi le favori, en une ligne */
function whyLine(row){const K=row[7],fv=K.find(k=>k[0]==="fav"),ps=K.find(k=>k[0]==="postes");if(!fv||!ps)return"";
  const f=fv[1],best=K.find(k=>k[0]==="poste"&&((k[4]>0)===(f===row[1]))),tight=fv[2]<.56;
  return `${tight?"Très serré. ":""}<b>${tnm(f)}</b> mieux noté à ${ps[2]} poste${ps[2]>1?"s":""} sur 5${best?`, surtout ${ROLE_AU[best[1]]} : ${pnm(best[4]>0?best[2]:best[3])} vaut environ ${fx1(Math.abs(best[5]))} point${Math.abs(best[5])>=1.95?"s":""} de plus que ${pnm(best[4]>0?best[3]:best[2])}`:""}.`}
function refTable(){const R=SJ.pm.ref||{},L=[["Règle de Thomas","regle"],["Derniers duels dominés","duel"],["Face-à-face (3 dernières séries)","h2h"],["Forme (10 dernières séries)","forme"],["Draft : moins de champions nouveaux","new"],["Draft : matchups favorables","mu"]];
  const C=R.cal&&R.cal.tout;
  return `<table class="kref"><tr><th>Fait (2025-2026)</th><th>Cas</th><th>Gagnés</th><th>Prévus</th></tr>${C?`<tr><td>Favori du robot</td><td>${nf(C.n)}</td><td>${pc0(C.fav/C.n)}</td><td>${pc0(C.bins.reduce((s,b)=>s+b[3],0)/C.n)}</td></tr>`:""}${L.filter(x=>R[x[1]]&&R[x[1]].tout).map(([lab,t])=>{const [n,w,e]=R[t].tout;return `<tr><td>${lab}</td><td>${nf(n)}</td><td>${pc0(w/n)}</td><td>${pc0(e/n)}</td></tr>`}).join("")}</table>`}
function keysHTML(m){
  if(!SJ||!SJ.pm||m.state==="done")return"";const row=pmRow(m);if(!row||!row[7]||!row[7].length)return"";kcss();
  const seen=new Set(),L=row[7].map(k=>{const x=keyLine(k,row);if(x&&x.r&&x.tag!=="on"){const sk=k[0]+"|"+x.r.slice(0,12);if(seen.has(sk))x.r="";seen.add(sk)}return x}).filter(Boolean),why=whyLine(row),cal=calTxt(row[6]);
  if(!why&&!L.length)return"";
  return `<div class="keys frame hx" style="padding:12px;margin-top:10px">${why?`<p class="keys1" style="margin-top:0">${why}</p>`:""}
   <details class="rb-d"><summary>Les clés du match (${L.length})</summary><ul class="kl">${L.map(x=>`<li>${x.tag==="on"?`<span class="kt on">compte</span>`:x.tag==="w"?`<span class="kt w">à surveiller</span>`:`<span class="kt">déjà compté</span>`}${x.h}${x.r?`<small>${x.r}</small>`:""}</li>`).join("")}${cal?`<li><span class="kt">fiabilité</span>${cal}</li>`:""}</ul>
   <details class="rb-d ki"><summary>${IKON}Méthode et chiffres</summary><p class="small">Avant la draft, chaque fait a été rejoué sur les ${nf((SJ.pm.ref.cal&&SJ.pm.ref.cal.tout.n)||5810)} parties pro de 2025-2026 (dont ${nf((SJ.pm.ref.cal&&SJ.pm.ref.cal.intl.n)||396)} internationales), avec seulement ce qui était connu avant le match. Seules la note d’impact des joueurs et le côté changent vraiment les chances. La règle de Thomas, les derniers duels, le face-à-face et la forme vont dans le même sens que la note, sans rien ajouter : ils sont affichés pour info. Testés et sans effet : forme des joueurs, picks préférés, expérience des Worlds, joueurs qui « se transforment » aux internationales.</p>${refTable()}</details></details></div>`;
}
/* ---- direct : correction du prono après la draft (testée : gain faible mais réel en ligues, pas confirmé aux internationales) ----
   logit(p) = logit(pE) + c[0] × MU + c[1] × NEW ; MU = somme sur les 5 postes de logit((victoires + 5) / (parties + 10)) de la paire
   (poste, champion bleu, champion rouge) vue au moins 3 fois depuis 2025 (draft.json, « mu ») ; NEW = joueurs bleus sur un champion
   jamais joué en pro depuis 2025 (stats.json, « mastery ») moins les rouges. pE et le résultat sont du point de vue du côté bleu. */
const DRAFT_C=[0.1648,-0.0998];
function draftAdjust(pE,f,c){c=c||(SJ&&SJ.pm&&SJ.pm.ref&&SJ.pm.ref.draft&&SJ.pm.ref.draft.c)||DRAFT_C;const q=Math.min(.999,Math.max(.001,pE));
  return sigm(Math.log(q/(1-q))+c[0]*(f.mu||0)+c[1]*(f.nw||0))}
const PM_CKA={monkeyking:"wukong",renata:"renataglasc",nunu:"nunuwillump"};
const pmCk=s=>{const n=norm(s);return PM_CKA[n]||n};
const LIVE_ROLE={top:"TOP",jungle:"JGL",mid:"MID",bottom:"BOT",support:"SUP"};
let DIX=null;
function draftIndex(D){if(DIX&&DIX.D===D)return DIX;const ix=new Map((D.ch||[]).map((c,i)=>[pmCk(c),i])),mu=new Map();
  ["TOP","JGL","MID","BOT","SUP"].forEach(r=>(D.mu&&D.mu[r]||[]).forEach(x=>mu.set(r+"|"+x[0]+"|"+x[1],x)));return DIX={D,ix,mu}}
/* b, r : 5 entrées {c: nom du champion, pl: joueur (PLAYERS) ou null, role: "TOP"…} par côté. Renvoie {mu, nw, new: [...], pairs: [...]} */
function draftFeat(b,r,D,sj){
  const X=D&&D.mu?draftIndex(D):null,mast=(sj&&sj.mastery)||{},mk=(pl,c)=>pl?(mast[norm(pl.id)+"|"+norm(c)]||mast[norm(pl.id)+"|"+pmCk(c)]):null;
  const out={mu:0,nw:0,new:[],pairs:[]};
  [[b,1],[r,-1]].forEach(([S,s])=>S.forEach(x=>{if(!x||!x.pl)return;const m=mk(x.pl,x.c);if(!m||!m.n){out.nw+=s;out.new.push({pl:x.pl,c:x.c,s})}}));
  if(X)["TOP","JGL","MID","BOT","SUP"].forEach(role=>{const x=b.find(z=>z&&z.role===role),y=r.find(z=>z&&z.role===role);if(!x||!y)return;
    const i=X.ix.get(pmCk(x.c)),j=X.ix.get(pmCk(y.c));if(i==null||j==null||i===j)return;
    const e=X.mu.get(role+"|"+i+"|"+j)||X.mu.get(role+"|"+j+"|"+i);if(!e||e[2]<3)return;
    const n=e[2],wb=e[0]===i?e[3]:n-e[3];out.mu+=Math.log((wb+5)/(n-wb+5));out.pairs.push({role,cb:x.c,cr:y.c,n,wb})});
  return out}
/* depuis le flux en direct (L.meta) : picks des deux côtés, poste lu dans participantMetadata.role sinon dans l'ordre */
function draftSides(L){const md=L&&L.meta;if(!md)return null;
  const side=(tm,our)=>(tm&&tm.participantMetadata||[]).map((p,i)=>({c:CH&&CH.nm?CH.nm[p.championId]||p.championId:p.championId,pl:playerFromSummoner(p.summonerName,our),role:LIVE_ROLE[p.role]||["TOP","JGL","MID","BOT","SUP"][i]}));
  return {b:side(md.blueTeamMetadata,L.blue),r:side(md.redTeamMetadata,L.red)}}
/* P(bleu gagne) du modèle E avant draft, pour une partie : force = somme des notes (SJ.sim.S, sinon SJ.m.t) */
function gameProbE(blue,red){const M=SJ&&SJ.m,t=Object.assign({},M&&M.t,SJ&&SJ.sim&&SJ.sim.S);if(!M||t[blue]==null||t[red]==null)return null;
  return sigm(M.logit[0]+M.logit[1]*(t[blue]-t[red]))}
/* ---- v13.5 l.2942-2987 : fiche.json : décodage (rencontres, vis-à-vis, champions, forme, profil) (liste shell) ---- */
const fjFlip=s=>s?s.split("-").reverse().join("-"):null;
const fjR1=v=>Math.round(v*10)/10;
/* rencontres en lane de a contre b (objets PLAYERS ou {id}), de la plus récente à la plus ancienne, vues de a */
function fcEnc(a,b,D=FJ){
  const ka=norm(a.id),kb=norm(b.id),fl=ka>kb,R=(D&&D.enc&&D.enc[fl?kb+"|"+ka:ka+"|"+kb])||[];
  return R.map(r=>{const g=D.gm[r[0]],s=r[1],ds=r.length>14?[r[14],r[15]].map(v=>v==null?null:v/1000):[null,null];
    let x={date:g[0],h:g[1],comp:D.comp[g[2]],bn:D.bn[g[3]],bo:g[4],n:g[5],ca:g[6+s],cb:g[7-s],chA:D.champs[r[2]],chB:D.champs[r[3]],
      kA:r.slice(4,7),kB:r.slice(7,10),csA:r[10],csB:r[11],gd:r[12],csd:r[13],dsA:ds[0],dsB:ds[1],w:g[8]===s?1:0,min:g[9],sc:s===0?g[10]:fjFlip(g[10])};
    if(fl)x={...x,ca:x.cb,cb:x.ca,chA:x.chB,chB:x.chA,kA:x.kB,kB:x.kA,csA:x.csB,csB:x.csA,gd:x.gd==null?null:-x.gd,csd:x.csd==null?null:-x.csd,
      dsA:x.dsB,dsB:x.dsA,w:1-x.w,sc:fjFlip(x.sc)};
    return x});
}
/* même chose au format de la consigne : [date, heure UTC, compétition, phase, bo, manche, code A, code B, champion A, champion B,
   [k,d,a] A, [k,d,a] B, cs A, cs B, gd15, csd15, dégâts A, dégâts B, victoire A, durée, score de la série vu de A] */
const fcEncArr=(a,b,D=FJ)=>fcEnc(a,b,D).map(x=>[x.date,x.h,x.comp,x.bn,x.bo,x.n,x.ca,x.cb,x.chA,x.chB,x.kA,x.kB,x.csA,x.csB,x.gd,x.csd,x.dsA,x.dsB,x.w,x.min,x.sc]);
/* ligne de bilan (depuis 2024 : a ; année en cours : y) */
function fjDuoObj(nm,tm,key,r){return {nm,tm,key,a:{g:r[0],w:r[1],gd:r[2],n15:r[3],kA:r[4],kB:r[5],last:String(r[6]),exp:r[7]},
  y:r.length>8?{g:r[8],w:r[9],gd:r[10],n15:r[11],kA:r[12],kB:r[13],exp:r[14]}:null}}
/* bilan entre deux de nos titulaires, vu de a (null s'ils ne se sont jamais affrontés en lane) */
function fcPair(a,b,D=FJ){
  const ka=norm(a.id),kb=norm(b.id),r=D&&D.dp&&D.dp[ka<kb?ka+"|"+kb:kb+"|"+ka];if(!r)return null;
  if(ka<kb)return fjDuoObj(b.id,b.team,b.key,r);
  const m=[r[0],r[0]-r[1],-r[2],r[3],r[5],r[4],r[6],fjR1(r[0]-r[7])];
  if(r.length>8)m.push(r[8],r[8]-r[9],-r[10],r[11],r[13],r[12],fjR1(r[8]-r[14]));
  return fjDuoObj(b.id,b.team,b.key,m);
}
/* tous les vis-à-vis de p depuis 2024 (nos titulaires et les autres), du plus affronté au moins affronté */
function fcDuo(p,D=FJ){
  const d=D&&D.duo&&D.duo[p.key];if(!d)return [];
  const out=d.r.map(r=>{const v=D.vs[r[0]];return fjDuoObj(v[0],v[1],v[2]||null,r.slice(1))});
  PLAYERS.forEach(o=>{if(o!==p&&o.role===p.role){const x=fcPair(p,o,D);if(x)out.push(x)}});
  return out.sort((x,y)=>y.a.g-x.a.g||y.a.w-x.a.w||x.nm.localeCompare(y.nm));
}
/* némésis, victime, plus dur et plus facile en lane : [année en cours, depuis 2024], chacun {nm, tm, key} ou null */
function fcDesig(p,D=FJ){const d=D&&D.duo&&D.duo[p.key];if(!d)return null;const f=i=>i==null?null:{nm:D.vs[i][0],tm:D.vs[i][1],key:D.vs[i][2]||null};
  return {y:d.dy.map(f),a:d.da.map(f),py:d.py,pa:d.pa}}
/* champions : per = "y" (année en cours) ou "a" (depuis 2025) */
function fcChamps(p,per="y",D=FJ){const c=D&&D.ch&&D.ch[p.key];if(!c)return null;const z=c["z"+per]||[0,0,0];
  return {rows:c[per].map(r=>({c:D.champs[r[0]],g:r[1],w:r[2],kda:r[3],gd:r[4],n15:r[5],rg:r[6],rw:r.length>7?r[7]:null,rgd:r.length>8?r[8]:null})),pool:z[0],og:z[1],ow:z[2]}}
/* 10 dernières parties de l'année, de la plus récente à la plus ancienne */
function fcForm(p,D=FJ){const f=D&&D.form&&D.form[p.key];if(!f)return null;
  return {last:f.l.map(r=>{const g=D.gm[r[0]];return {date:g[0],h:g[1],comp:D.comp[g[2]],bn:D.bn[g[3]],n:g[5],opp:g[7-r[1]],w:r[2],c:D.champs[r[3]],k:r[4],d:r[5],a:r[6],gd:r[7],vs:r[8]==null?null:D.vs[r[8]][0],min:g[9]}}),
    streak:f.s,tag:f.t,S:{g:f.S[0],w:f.S[1],k:f.S[2],d:f.S[3],a:f.S[4],gd:f.S[5],n15:f.S[6]}}}
/* profil : axes [clé, brut, corrigé, rang corrigé, sur, parties, valeur ligue, rang ligue, sur] */
function fcProf(p,D=FJ){const x=D&&D.prof&&D.prof[p.key];if(!x)return null;
  return {lg:x.lg,eop:x.eop,ax:x.ax.map(a=>({k:a[0],raw:a[1],adj:a[2],rk:a[3],n:a[4],m:a[5],lv:a[6],lrk:a[7],ln:a[8]})),f:x.f,w:x.w}}
/* ---- v13.5 l.2989-3017 : fiche.json : données (ficheData, encData) et mise en forme (fjPhase, fjDate, fjWhen, fjSg, fjGd, fjAvg, FJ_AX…) (liste players) ---- */
/* ---------- données pour ablock ---------- */
async function ficheData(p){
  await loadFJ();if(!FJ)return {missing:true,nocache:true};
  return {asof:FJ.asof,y:FJ.y,since:FJ.per.duo,chs:FJ.per.ch,form:fcForm(p),duo:fcDuo(p).slice(0,40),des:fcDesig(p),chy:fcChamps(p,"y"),cha:fcChamps(p,"a"),
    prof:fcProf(p),cfg:FJ.cfg,ref:FJ.ref&&FJ.ref.elo,sd:FJ.sd15&&FJ.sd15[p.role]};
}
async function encData(a,b){await loadFJ();if(!FJ)return {missing:true,nocache:true};return {rows:fcEnc(a,b),pair:fcPair(a,b),y:FJ.y,since:FJ.per.duo}}

/* ---------- mise en forme ---------- */
const FJ_PH={"Swiss":"phase suisse","Play-Ins":"Play-In","Play-In":"Play-In","Play In Knockouts":"Play-In","Knockouts":"phase finale","Groups":"groupes","Finals":"finale",
  "Semifinals":"demi-finale","Quarterfinals":"quart de finale","Playoffs":"playoffs","Regional Qualifier":"qualification","Promotion":"promotion","Regular Season":"saison"};
const fjPhase=s=>{s=String(s||"");let m;if(FJ_PH[s])return FJ_PH[s];if(m=s.match(/^Week (\d+)/))return "semaine "+m[1];if(m=s.match(/^Round (\d+)/))return "tour "+m[1];
  if(m=s.match(/^Playoffs - Round (\d+)/))return "playoffs, tour "+m[1];return s.toLowerCase()};
const FJ_TZ="Europe/Paris";   // les heures du flux sont en UTC : on affiche l'heure de Paris quel que soit l'appareil
const fjDate=(d,h)=>{const x=new Date(d+"T"+(h||"12:00")+":00Z");return x.toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric",timeZone:FJ_TZ})};
const fjWhen=(d,h)=>{const x=new Date(d+"T"+(h||"12:00")+":00Z");return x.toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric",timeZone:FJ_TZ})+(h?" à "+x.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit",timeZone:FJ_TZ}):"")};
const fjDay=s=>new Date(s.slice(0,4)+"-"+s.slice(4,6)+"-"+s.slice(6,8)+"T12:00:00Z").toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"});
const fjSg=v=>(v>0?"+":v<0?"−":"")+Math.abs(v).toLocaleString("fr-FR");
const fjGd=v=>v==null?"–":"≈ "+fjSg(Math.round(v/100)*100);            // une partie : à 100 près (le flux s'écarte de gol.gg de 35 d'or en médiane)
const fjAvg=(s,n)=>n?fjSg(Math.round(s/n)):"–";                         // moyenne sur plusieurs parties
const fjK=k=>k.join("/");
const fjPl=(n,w)=>n+" "+w+(n>1?"s":"");
const fjTeam=c=>{if(T[c])return c;const n=norm(c);return Object.keys(T).find(id=>(T[id].al||[]).includes(n))||null};
const fjLogo=(c,s=16)=>{const id=fjTeam(c);return id?logo(id,s):""};
const fjRk=(i,n)=>`${i}${i===1?"er":"e"}/${n}`,fjNth=i=>i+(i===1?"er":"e");
const fjI=t=>`<details class="fji"><summary aria-label="Méthode">i</summary><p>${t}</p></details>`;
const FJ_AX={gd15:["Or à 15 min","l’or à 15 min",v=>fjSg(Math.round(v))],csd15:["CS à 15 min","les CS à 15 min",v=>(v>0?"+":"")+fx1(v)],
  csm:["CS par minute","le farm",fx2],kp:["Participation","la participation aux kills",v=>Math.round(v*100)+" %"],
  ds:["Part des dégâts","la part des dégâts",v=>fx1(v*100)+" %"],dth:["Morts par partie","la survie",fx2],vis:["Balises par min","la vision",fx2]};
/* ---- v13.5 l.3141-3201 : petits outils de v13.5 : replis gardés ouverts (data-uo, AM_OPEN, uxFold), « i » en ligne (amI, amIP, amH2), formats am* (liste shell) ---- */
/* ---------- petits outils ---------- */
const AM_OPEN=new Set();                    // <details data-uo> ouverts, gardés d'un rendu à l'autre (synchro, direct)
const amO=id=>AM_OPEN.has(id)?" open":"";
/* >>> uxg js : replis du gardien de l'expérience (ouverture gardée d'un rendu à l'autre par data-uo / AM_OPEN) */
const uxFold=(id,lab,sub,html)=>`<details class="uxf" data-uo="${esc("ux_"+id)}"${amO("ux_"+id)}><summary><b>${lab}</b>${sub?`<small>${sub}</small>`:""}</summary>${html}</details>`;
const uxTiles=(p,L)=>tiles(L.slice(0,6))+(L.length>6?uxFold("pt_"+p.key,amPl(L.length-6,"autre stat","autres stats"),L.slice(6).map(x=>String(x[1]).split("<i")[0].trim()).join(", "),tiles(L.slice(6))):"");
const uxChamps=(cs,k)=>champList(cs.slice(0,5))+(cs.length>5?uxFold("pc_"+k,amPl(cs.length-5,"autre champion","autres champions"),cs.slice(5,8).map(c=>esc(c.c)).join(", ")+(cs.length>8?"…":""),champList(cs.slice(5))):"");
const uxEncLast=(a,b)=>{try{return typeof FJ!=="undefined"&&!!FJ&&typeof encHTML==="function"&&fcEnc(a,b).length>0}catch(e){return false}};   // la phrase « Dernière rencontre » sera affichée
const uxDays=L=>[...new Set(L.map(x=>new Date(x.start).toLocaleDateString("fr-FR",{weekday:"long"})))].join(", ");
/* paris cachés (avant le coup d'envoi) : une ligne de pastilles, ton choix visible, ✓ pour les autres */
function uxBetsLine(m,all){const n=all.filter(u=>u.p[m.key]).length;
  return `<div class="mol uxbl">${all.map(u=>{const b=u.p[m.key];return `<span class="mou${b?"":" no"}">${avatar(u,22)}<b>${u.me?"toi":esc(u.name)}</b>${!b?"":u.me?`<em>${logo(b.w,16)}${esc(T[b.w].id)}</em>`:`<i class="ok">✓</i>`}</span>`}).join("")}<small>${n} sur ${all.length} ${n>1?"ont":"a"} parié, choix révélés au coup d’envoi.</small></div>`}
/* leaders du tournoi : une catégorie à la fois (puces), même rendu de tableau */
function uxLeads(L,lb){
  const B=[["kda","KDA","KDA",L.kda,fx2],["kills","Kills","Kills",L.kills,v=>v],["csm","CS/min","CS par minute",L.csm,fx1],
    L.dmg?["dmg","Dégâts","Part des dégâts",L.dmg,v=>Math.round(v)+" %"]:["dpm","Dégâts","Dégâts par minute",L.dpm,v=>Math.round(v)],
    ["kp","Participation","Participation aux kills",L.kp,v=>Math.round(v)+" %"]].filter(x=>x[3]&&x[3].length);
  if(!B.length)return"";const k=B.some(x=>x[0]===ui.leadCat)?ui.leadCat:B[0][0],x=B.find(y=>y[0]===k);
  return `<div class="chips uxwrap">${B.map(b=>`<button class="chip" data-leadcat="${b[0]}" aria-pressed="${b[0]===k}">${b[1]}</button>`).join("")}</div><div class="leads">${lb(x[2],x[3],x[4])}</div>`}
/* <<< uxg js */
const AM_TZ="Europe/Paris";                 // heures du flux en UTC : affichées à l'heure de Paris
const amPl=(n,w,ws)=>n+" "+(n>1?(ws||w+"s"):w);
const amSg=v=>(v>0?"+":v<0?"−":"")+Math.abs(Math.round(v)).toLocaleString("fr-FR");
const amR=(v,s)=>Math.round(v/s)*s;
const amPc=v=>Math.round(v*100)+" %";
const amMed=L=>{const v=L.slice().sort((a,b)=>a-b),n=v.length;return n?(n%2?v[(n-1)/2]:(v[n/2-1]+v[n/2])/2):0};   // médiane : une partie extrême ne fait pas le chiffre
const amNf=v=>Number(v).toLocaleString("fr-FR");
const amP=k=>PLAYERS.find(x=>x.key===k)||null;
const amTid=c=>esc(T[c]?T[c].id:String(c||""));
const amFn=(f,...a)=>{try{return typeof f==="function"?f(...a):null}catch(e){console.warn(e);return null}};
/* « sam. 23 oct. » (année ajoutée si ce n'est pas l'année en cours) */
function amDay(d,h){const x=new Date(String(d)+"T"+(h||"12:00")+":00Z");if(isNaN(x))return esc(d);
  const o={weekday:"short",day:"numeric",month:"short",timeZone:AM_TZ};if(String(d).slice(0,4)!==String(new Date().getFullYear()))o.year="numeric";
  return esc(x.toLocaleDateString("fr-FR",o))}
const amComp=c=>String(c||"").replace(/\s+20\d\d$/,"");
const amPhase=b=>{const s=amFn(typeof fjPhase==="function"?fjPhase:null,b);return s!=null?s:String(b||"").toLowerCase()};
/* « sam. 23 oct. · Worlds, phase suisse · partie 1 » */
const amWhen=x=>`${amDay(x.date,x.h)} · ${esc(amComp(x.comp))}, ${esc(amPhase(x.bn))} · partie ${x.n}`;
/* le petit « i » : bouton dans le titre, texte juste dessous (fermé par défaut) */
const amI=id=>`<button class="ami" data-ami="${esc(id)}" aria-label="Méthode et chiffres" aria-expanded="${AM_OPEN.has("i_"+id)}">i</button>`;
const amIP=(id,html)=>`<div class="amip" data-amip="${esc(id)}"${AM_OPEN.has("i_"+id)?"":" hidden"}>${html}</div>`;
const amH2=(t,id,info)=>`<h2 class="amh2">${t}${info?amI(id):""}</h2>${info?amIP(id,info):""}`;
/* note d'impact : qui est le mieux noté à ce poste (null si trop proche ou notes absentes) */
function amBetter(a,b){const x=SJ&&SJ.m&&SJ.m.p&&a&&b?amFn(pBetter,a.key,b.key,a.role):null;if(!x)return null;
  const al=(SJ.m.logit||[0,.6407])[1];return {w:x.p>=.5?a:b,l:x.p>=.5?b:a,p:Math.max(x.p,1-x.p),pts:Math.abs(x.d)*al*25,d:x.d}}

if(typeof document!=="undefined"){
  document.addEventListener("toggle",e=>{const d=e.target,u=d&&d.dataset&&d.dataset.uo;if(!u||!d.isConnected)return;if(d.open)AM_OPEN.add(u);else AM_OPEN.delete(u)},true);
  document.addEventListener("click",e=>{
    const i=e.target.closest("[data-ami]");
    if(i){e.preventDefault();const id=i.dataset.ami,on=!AM_OPEN.has("i_"+id);on?AM_OPEN.add("i_"+id):AM_OPEN.delete("i_"+id);
      document.querySelectorAll(`[data-amip="${CSS.escape(id)}"]`).forEach(p=>p.hidden=!on);
      document.querySelectorAll(`[data-ami="${CSS.escape(id)}"]`).forEach(b=>b.setAttribute("aria-expanded",String(on)));return}
  });
}
/* rendu « quiet » de la fiche (synchro toutes les 60 s) : les <details> sans data-uo rouverts à l'identique (appelé par setSheet) */
function amSnapOpen(root){try{return [...root.querySelectorAll("details[open]")].filter(d=>!d.dataset.uo).map(d=>{const ak=d.closest("[data-ak]");
  const L=ak?[...ak.querySelectorAll("details")]:[...root.querySelectorAll("details")].filter(x=>!x.closest("[data-ak]"));return [ak?ak.dataset.ak:"",L.indexOf(d)]})}catch(e){return []}}
function amRestoreOpen(root,L){try{(L||[]).forEach(([k,i])=>{if(i<0)return;const ak=k?root.querySelector(`[data-ak="${CSS.escape(k)}"]`):null;if(k&&!ak)return;
  const D=ak?[...ak.querySelectorAll("details")]:[...root.querySelectorAll("details")].filter(x=>!x.closest("[data-ak]"));if(D[i])D[i].open=true})}catch(e){}}
/* ---- v13.5 l.3229-3251 : avant-match : champions brûlés, repli stats.json, données des duels par poste (amRolesData, cache amr_*) (liste match) ---- */
function amBurned(m){try{const n=(m.s1||0)+(m.s2||0);if(!n||!(m.bo>1)||typeof fearlessBurned!=="function")return new Set();
  const a=AK["games_"+m.key+"_"+n]||AK["amb_"+m.key+"_"+n];if(!a||a.st!=="ok"||!a.data)return new Set();
  return a.data.games?fearlessBurned(a.data.games):new Set((a.data.burned||[]).map(ckey))}catch(e){return new Set()}}
/* bilan et rencontres depuis stats.json quand fiche.json manque */
function amSjPair(a,b){const D=SJ&&SJ.duels;if(!D)return null;const k1=norm(a.id)+"|"+norm(b.id),k2=norm(b.id)+"|"+norm(a.id),x=D[k1]||D[k2];if(!x)return null;
  return D[k1]?{g:x.g,w:x.w,gd:x.gd15||0,n15:x.n15||0,exp:null}:{g:x.g,w:x.g-x.w,gd:-(x.gd15||0),n15:x.n15||0,exp:null}}
function amSjEnc(a,b){const D=SJ&&SJ.dr;if(!D)return [];const k1=norm(a.id)+"|"+norm(b.id),k2=norm(b.id)+"|"+norm(a.id),R=D[k1]||D[k2];if(!R)return [];const fl=!D[k1];
  return R.map(x=>({date:x[0],n:x[1],comp:x[2],w:fl?1-x[8]:x[8],gd:x[7]==null?null:fl?-x[7]:x[7]}))}
async function amRolesData(m){
  await Promise.all([typeof loadFJ==="function"?loadFJ().catch(()=>null):null,typeof loadDJ==="function"?loadDJ().catch(()=>null):null]);
  const fj=typeof FJ!=="undefined"&&FJ,dj=typeof DJ!=="undefined"&&DJ,P1=teamPlayers(m.t1),P2=teamPlayers(m.t2);
  const rows=ROLE_ORDER.map(r=>{const a=P1.find(p=>p.role===r),b=P2.find(p=>p.role===r);if(!a||!b)return {r,a:a?a.key:null,b:b?b.key:null};
    const enc=fj?fcEnc(a,b).slice(0,5):amSjEnc(a,b).slice(0,5),X=fj?fcPair(a,b):null;
    const pair=X?{g:X.a.g,w:X.a.w,gd:X.a.gd,n15:X.a.n15,exp:X.a.exp}:amSjPair(a,b);
    const g5=enc.filter(x=>x.gd!=null);
    // forme individuelle : KDA des 10 dernières parties (victoires et défaites sont celles de l'équipe, les mêmes pour les 5 joueurs)
    const fm=p=>{const f=fj?fcForm(p):null;if(!f||!f.last.length)return null;const k=f.last.reduce((s,x)=>[s[0]+x.k,s[1]+x.d,s[2]+x.a],[0,0,0]);
      return [Math.round((k[0]+k[2])/Math.max(1,k[1])*10)/10,f.last.length,f.tag||null]};
    const pk=p=>dj?picksFor(p.key,[],5).map(x=>[x.c,x.n,x.of]):[];
    return {r,a:a.key,b:b.key,pair,l5:enc.map(x=>x.w?1:0),s5:enc.map(x=>x.gd==null?null:Math.sign(x.gd)),d5:enc.map(x=>x.date),gd5:g5.length?Math.round(amMed(g5.map(x=>x.gd))):null,n5:g5.length,
      fa:fm(a),fb:fm(b),pa:pk(a),pb:pk(b)}});
  return {rows,since:fj?fj.per.duo:String((SJ&&SJ.since)||"2024").slice(0,4),fj:!!fj,dj:!!dj,nocache:!fj&&!dj};
}
/* ---- v13.5 l.3296-3330 : duel : vis-à-vis communs, données (amVsData, cache amv_*), verdict (liste match) ---- */
function amCommon(a,b,D){
  D=D||(typeof FJ!=="undefined"?FJ:null);if(!D||!D.duo)return [];
  const rows=p=>{const M=new Map(),d=D.duo[p.key];
    if(d)d.r.forEach(r=>{const v=D.vs[r[0]];if(v)M.set(v[2]||"i"+r[0],{nm:v[0],tm:v[1],key:v[2]||null,s:[r[1],r[2],r[3],r[4]]})});
    PLAYERS.forEach(o=>{if(o.role!==p.role||o===a||o===b)return;const x=fcPair(p,o,D);if(x)M.set(o.key,{nm:o.id,tm:o.team,key:o.key,s:[x.a.g,x.a.w,x.a.gd,x.a.n15]})});
    return M};
  const A=rows(a),B=rows(b),out=[];
  A.forEach((x,k)=>{const y=B.get(k);if(y)out.push({nm:x.nm,tm:x.tm,key:x.key,A:x.s,B:y.s})});
  return out.sort((p,q)=>Math.min(q.A[0],q.B[0])-Math.min(p.A[0],p.B[0])||(q.A[0]+q.B[0])-(p.A[0]+p.B[0])||p.nm.localeCompare(q.nm));
}
async function amVsData(a,b){
  await Promise.all([typeof loadFJ==="function"?loadFJ().catch(()=>null):null,typeof loadDJ==="function"?loadDJ().catch(()=>null):null]);
  const fj=typeof FJ!=="undefined"&&FJ,dj=typeof DJ!=="undefined"&&DJ;
  const o={since:fj?fj.per.duo:String((SJ&&SJ.since)||"2024").slice(0,4),y:fj?fj.y:String(new Date().getFullYear()),fj:!!fj,dj:!!dj};
  if(fj){o.enc=fcEnc(a,b);const X=fcPair(a,b);o.pair=X?{a:X.a,y:X.y}:null;o.fa=fcForm(a);o.fb=fcForm(b);
    const ch=p=>{const c=fcChamps(p,"y");return c?{rows:c.rows.slice(0,5),pool:c.pool}:null};o.ca=ch(a);o.cb=ch(b);o.common=amCommon(a,b,fj).slice(0,12)}
  else{o.enc=amSjEnc(a,b);const x=amSjPair(a,b);o.pair=x?{a:x,y:null}:null}
  if(dj){o.pa=picksFor(a.key,[],5).map(x=>[x.c,x.n,x.of,x.w]);o.pb=picksFor(b.key,[],5).map(x=>[x.c,x.n,x.of,x.w]);
    const v=prefVsPref(a.key,b.key,[],3);o.pvp={A:v.A.map(x=>x.c),B:v.B.map(x=>x.c),cells:v.cells.map(r=>r.map(c=>[c.lbl,c.n15,c.txt])),txt:v.txt}}
  o.nocache=!fj&&!dj;return o;
}
function amVsVerdict(a,b,D){
  const L=[],B=amBetter(a,b);
  if(B){L.push(B.p<.6?`Note d’impact : trop proches pour les départager (${amPc(B.p)} pour ${esc(B.w.id)}).`
    :`Mieux noté : <b>${esc(B.w.id)}</b>, ${B.p>.99?"plus de 99 %":amPc(B.p)} de chances d’être le meilleur des deux, environ ${fx1(B.pts)} point${B.pts>=1.95?"s":""} de chances de victoire pour ${amTid(B.w.team)}.`)}
  const ld=amFn(typeof laneDuel==="function"?laneDuel:null,a.key,b.key,a.role,false);
  if(ld&&Math.abs(ld.p-.5)>=.05){const W=ld.p>=.5?a:b;L.push(`Lane attendue : <b>${esc(W.id)}</b> devant à 15 min dans ${amPc(Math.max(ld.p,1-ld.p))} des cas, environ ${amR(Math.abs(ld.e),10)} d’or.`)}
  else if(ld)L.push(`Lane attendue : équilibrée (${amPc(Math.max(ld.p,1-ld.p))} pour ${esc((ld.p>=.5?a:b).id)}).`);
  const E=D.enc||[];
  if(E.length){const w=E.filter(x=>x.w).length,g=E.filter(x=>x.gd!=null),ah=g.filter(x=>x.gd>0).length,bh=g.filter(x=>x.gd<0).length,md=g.length?amMed(g.map(x=>x.gd)):0;
    const ld15=ah>=bh?a:b,k=Math.max(ah,bh);
    L.push(`${E.length>1?`Leurs ${E.length} dernières rencontres`:"Leur seule rencontre"} : ${w}-${E.length-w}${w!==E.length-w?` pour ${esc((w>E.length-w?a:b).id)}`:""}.${g.length>=3?` À 15 min, ${esc(ld15.id)} devant ${k} fois sur ${g.length} (écart médian ${amSg(ld15===a?md:-md)} d’or pour lui).`:""}`)}
  else L.push(`Jamais face à face en lane depuis ${esc(D.since)}.`);
  return `<div class="amv1 frame hx">${L.map(x=>`<p>${x}</p>`).join("")}</div>`;
}
/* ---- v13.5 l.3438-3451 : direct : données de la draft de la partie (amLiveDraftData) (liste match) ---- */
async function amLiveDraftData(L){
  if(typeof champMap==="function")await champMap();if(typeof loadDJ==="function")await loadDJ().catch(()=>null);
  const S=typeof draftSides==="function"?draftSides(L):null;if(!S)return null;
  const dj=typeof DJ!=="undefined"&&DJ,mast=(SJ&&SJ.mastery)||{},chs=(SJ&&SJ.champs)||{},ix=dj?djIx(dj):null;
  const ex=z=>{if(!z)return null;const o={c:z.c,k:z.pl?z.pl.key:null,n:z.pl?z.pl.id:"",m:null,cn:0,cw:0,g90:null,t90:null};
    const cc=chs[norm(z.c)]||chs[ckey(z.c)];if(cc){o.cn=cc.n;o.cw=cc.w}
    if(z.pl){const M=mast[norm(z.pl.id)+"|"+norm(z.c)]||mast[norm(z.pl.id)+"|"+ckey(z.c)];o.m=M?[M.n,M.w]:[0,0];
      const P=dj&&dj.pool&&dj.pool[z.pl.key];if(P){const i=ix.c.get(ckey(z.c)),r=P[2].find(q=>q[0]===i);o.t90=P[0];o.g90=r?r[1]:0}}
    return o};
  const lines=ROLE_ORDER.map(r=>{const x=S.b.find(z=>z&&z.role===r),y=S.r.find(z=>z&&z.role===r),mu=dj&&x&&y?amFn(matchup,r,x.c,y.c):null;
    return {r,b:ex(x),d:ex(y),mu:mu?{l:mu.lbl,g:mu.g,w:mu.w,n15:mu.n15,net:!!mu.net,gd:mu.gd,t:mu.txt}:null}});
  const pE=amFn(typeof gameProbE==="function"?gameProbE:null,L.blue,L.red),f=dj?amFn(draftFeat,S.b,S.r,dj,SJ):null,p=pE!=null&&f?amFn(draftAdjust,pE,f):null;
  return {lines,pE,p,news:f?f.new.map(z=>[z.pl.id,z.c,z.s]):[],gid:L.gid,num:L.num,blue:L.blue,red:L.red};
}
/* ---- v13.5 l.3483-3484 : fiabilité des picks en une phrase (amFiShort) (liste match) ---- */
function amFiShort(){try{const f=(DJ&&DJ.fi)||[],x=f.find(z=>z.y===DJ.y&&z.pn)||f.find(z=>z.pn);if(!x)return"";
  return `Le pick joué figurait dans les 3 picks probables ${amPc(x.p3)} du temps ${x.y===String(new Date().getFullYear())?"à ces Worlds":"aux Worlds "+x.y} (${amNf(x.pn)} picks). `}catch(e){return""}}
/* ---- v13.5 l.3497-3568 : draft2 : prono de draft figé, draft réelle, comparaison, résumé, détail, pied (liste match) ---- */
const D2R={top:"TOP",jungle:"JGL",mid:"MID",bottom:"BOT",support:"SUP"};
const d2Nm=c=>{if(c==null)return"";const n=typeof djCh==="function"?djCh(c):c;return typeof CH!=="undefined"&&CH&&CH.nm&&CH.nm[n]?CH.nm[n]:n};
const d2Same=(a,b)=>!!a&&!!b&&ckey(a)===ckey(b);
const d2Mid=m=>m&&/^le\d/.test(String(m.id))?String(m.id).slice(2):null;
const d2Hm=f=>{try{const d=new Date(String(f).slice(0,16)+":00Z");if(isNaN(d))return"";return d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit",timeZone:AM_TZ}).replace(":"," h ")}catch(e){return""}};
const d2Ic=(c,sz,cls,tt)=>`<span class="${cls||""}"${tt?` title="${esc(tt)}"`:""}>${champ(d2Nm(c),sz)}</span>`;
/* parties déjà finies de la série d'après le direct (sinon le score affiché) */
const d2N=m=>{const L=typeof LV!=="undefined"&&LV.games&&LV.games[m.key];return (L&&L.teams||[]).reduce((s,t)=>s+(t.w||0),0)||((m.s1||0)+(m.s2||0))};

/* prono de draft d'une partie : figé par le robot (DJ.gm) ; à défaut, pendant le match seulement (rien de la série n'est encore
   dans draft.json), ce que l'appli a affiché avant la partie (« Avant la partie », « Draft »), ou son calcul pour une 1re partie */
function d2Pred(m,num,live){
  const mid=d2Mid(m),D=typeof DJ!=="undefined"?DJ:null;if(!mid||!D)return null;
  const o=D.gm&&D.gm[mid+"_"+num],ch=i=>i==null||i<0?null:D.ch[i];
  if(o&&Array.isArray(o.t)&&Array.isArray(o.pb)&&Array.isArray(o.pp))
    return {src:o.s,f:o.f,t:o.t,o,x:(o.x||[]).map(ch),ban:o.pb.map(L=>(L||[]).map(ch)),pk:o.pp.map(T=>ROLE_ORDER.map((r,i)=>((T||[])[i]||[]).map(ch)))};
  if(!live||!m.t1||!m.t2)return null;
  const prev=num-1,lane=(d,r,k)=>{const l=(d.lanes||[]).find(z=>z.r===r);return l?(l[k]||[]).slice(0,3).map(z=>z.c):[]};
  for(const k of ["amb_"+m.key+"_"+prev,"dj_"+m.key+"_"+prev]){const a=AK[k],d=a&&a.st==="ok"&&a.data;
    if(d&&d.lanes&&d.b1&&d.b2)return {src:"app",t:[m.t1,m.t2],x:d.burned||[],ban:[d.b2.map(z=>z.c),d.b1.map(z=>z.c)],pk:[ROLE_ORDER.map(r=>lane(d,r,"A")),ROLE_ORDER.map(r=>lane(d,r,"B"))]}}
  if(num===1){const pl=t=>ROLE_ORDER.map(r=>{const p=teamPlayers(t).find(q=>q.role===r);return p?picksFor(p.key,[],3).map(z=>z.c):[]});
    return {src:"app",t:[m.t1,m.t2],x:[],ban:[bansFor(m.t1,m.t2,[]).map(z=>z.c),bansFor(m.t2,m.t1,[]).map(z=>z.c)],pk:[pl(m.t1),pl(m.t2)]}}
  return null;
}
/* picks joués, rangés comme le prono : {pk: [[5 champions par poste] de A, de B], bl: index de A ou B côté bleu} */
function d2RealGame(P,x){
  const o=P.o;if(o&&Array.isArray(o.rp)&&o.rp[0]&&o.rp[1])return {pk:o.rp.map(L=>ROLE_ORDER.map((r,i)=>L[i]==null?null:DJ.ch[L[i]])),bl:o.bl===1?1:0};
  // sans le robot : ordre des participants du flux (haut, jungle, mid, ADC, support)
  const sd=t=>x.b.our===t?x.b:x.r.our===t?x.r:null,A=sd(P.t[0]),B=sd(P.t[1]);if(!A||!B||A===B)return null;
  return {pk:[A,B].map(s=>ROLE_ORDER.map((r,i)=>s.p&&s.p[i]?s.p[i].c:null)),bl:A===x.b?0:1};
}
function d2RealLive(P,L){
  const md=L.meta||{},get=sd=>{const o={};((md[sd+"TeamMetadata"]||{}).participantMetadata||[]).forEach(p=>{const r=D2R[p.role];if(r)o[r]=p.championId});return ROLE_ORDER.map(r=>o[r]||null)};
  const b=get("blue"),r=get("red");
  if(L.blue===P.t[0]&&L.red===P.t[1])return {pk:[b,r],bl:0};
  if(L.blue===P.t[1]&&L.red===P.t[0])return {pk:[r,b],bl:1};
  return null;
}
/* comparaison : bans annoncés tombés (par équipe), picks joués dans le top 3 du joueur */
function d2Cmp(P,R){
  const o=P.o,bans=[0,1].map(s=>{const rb=o&&o.rb&&o.rb[s];if(!Array.isArray(rb)||!rb.length)return null;
    const real=rb.map(i=>DJ.ch[i]),pred=P.ban[s]||[];
    return {real,pred,hit:real.filter(c=>pred.some(p=>d2Same(p,c))).length,miss:pred.filter(p=>!real.some(c=>d2Same(p,c)))}});
  const picks=[0,1].map(s=>ROLE_ORDER.map((r,i)=>{const c=R.pk[s][i]||null,pr=P.pk[s][i]||[];return {r,c,pr,k:c?pr.findIndex(p=>d2Same(p,c)):-1}}));
  let ph=0,pn=0;picks.forEach(L=>L.forEach(x=>{if(x.c&&x.pr.length){pn++;if(x.k>=0)ph++}}));
  return {bans:bans[0]&&bans[1]?bans:[null,null],picks,ph,pn};
}
/* niveau 1 : « Bans annoncés : BLG 4/5, T1 2/5 · 3 picks sur 10 dans nos top 3 » */
function d2Sum(P,C,R,ctx,late){
  const ord=R.bl===1?[1,0]:[0,1],b=C.bans,pk=C.pn?`<em>${C.ph}</em> pick${C.ph>1?"s":""} sur ${C.pn} dans nos top 3`:"";
  const bn=b[0]?`bans annoncés : ${ord.map(s=>`<em>${amTid(P.t[s])} ${b[s].hit}/${b[s].real.length}</em>`).join(", ")}`
    :ctx==="live"?"bans publiés environ une heure après la partie":late?"bans pas encore publiés par gol.gg":"bans publiés d’ici une heure";
  const s=b[0]?[bn,pk]:[pk,bn];
  return s.filter(Boolean).join(" · ").replace(/^./,c=>c.toUpperCase());
}
/* niveau 2 : bans réels (en or, ceux qu'on avait annoncés), picks par poste face aux 3 picks probables du joueur */
function d2Detail(P,C,R,ctx){
  const ord=R.bl===1?[1,0]:[0,1],tm=s=>P.t[s];let h="";
  if(C.bans[0])h+=`<div class="d2h">Bans de chaque équipe, dans l’ordre <small>en or : annoncés</small></div>`+ord.map(s=>{const b=C.bans[s];
    return `<div class="d2bt"><span class="tm">${logo(tm(s),18)}${amTid(tm(s))}</span><span class="d2k">${b.real.map(c=>d2Ic(c,26,b.pred.some(p=>d2Same(p,c))?"hit":"")).join("")}</span>${b.miss.length?`<span class="d2ms">attendus aussi : ${b.miss.map(c=>d2Ic(c,16)).join("")}</span>`:""}</div>`}).join("");
  else h+=`<div class="d2h">Bans attendus de chaque équipe <small>${ctx==="live"?"les vrais bans arrivent environ une heure après la partie (gol.gg)":"les vrais bans arrivent d’ici une heure (gol.gg)"}</small></div>`
    +ord.map(s=>`<div class="d2bt"><span class="tm">${logo(tm(s),18)}${amTid(tm(s))}</span><span class="d2k dim">${(P.ban[s]||[]).map(c=>d2Ic(c,22)).join("")}</span></div>`).join("");
  const cell=(s,i,rev)=>{const x=C.picks[s][i],pr=`<span class="pr">${x.pr.map(p=>d2Ic(p,16,x.c&&d2Same(p,x.c)?"on":"")).join("")}</span>`,
    rc=`<span class="real${x.c&&x.pr.length?(x.k>=0?" hit":" miss"):""}">${x.c?champ(d2Nm(x.c),26):""}</span>`,
    rk=x.c&&x.pr.length?`<small class="rk${x.k>=0?" hit":""}">${x.k===0?"1er":x.k>0?(x.k+1)+"e":"hors top"}</small>`:"";
    return `<span class="s${rev?" r":""}">${rev?pr+rk+rc:rc+rk+pr}</span>`};
  h+=`<div class="d2h">Picks <small>en or : dans les 3 picks probables du joueur</small></div><div class="d2pk"><span class="hd">${amTid(tm(ord[0]))}</span><span></span><span class="hd r">${amTid(tm(ord[1]))}</span>`
    +ROLE_ORDER.map((r,i)=>cell(ord[0],i,false)+`<i class="rl">${esc(ROLES[r])}</i>`+cell(ord[1],i,true)).join("")+`</div>`;
  return h;
}
const d2Foot=P=>(P.src==="g"?`Prono figé par le robot au coup d’envoi${P.f?` (${d2Hm(P.f)})`:""}.`:P.src==="r"?"Prono recalculé après coup, avec les seules données d’avant la partie (il n’avait pas été figé en direct).":"Bans et picks probables affichés par l’appli avant la partie (le robot n’avait pas encore figé les siens).")
  +(P.x&&P.x.length?` Les ${P.x.length} champions déjà joués dans la série en étaient retirés (fearless).`:"")+" Petites icônes : les 3 picks probables du joueur. Bans : gol.gg ; picks : API LoL Esports.";
/* ---- v13.5 l.3600-3612 : draft2 : fearless de la série, données (d2FearlessData, cache d2f_*) (liste match) ---- */
async function d2FearlessData(m,n){
  if(typeof loadDJ==="function")await loadDJ().catch(()=>null);
  let games=null;const a=AK["games_"+m.key+"_"+n];
  if(a&&a.st==="ok"&&a.data&&Array.isArray(a.data.games))games=a.data.games;
  if(!games){try{games=(await matchGames(m)).games}catch(e){games=null}}
  const by={},add=(t,c,k)=>{if(t&&c)(by[t]=by[t]||[]).push([c,k])};
  (games||[]).forEach(g=>{if(g&&!g.none&&!g.err&&g.b&&g.r&&g.num<=n)[g.b,g.r].forEach(sd=>(sd.p||[]).forEach(p=>add(sd.our,p.c,g.num)))});
  const D=typeof DJ!=="undefined"?DJ:null,mid=d2Mid(m);
  if(!Object.keys(by).length&&D&&D.gm&&mid)for(let k=1;k<=n;k++){const o=D.gm[mid+"_"+k];if(o&&Array.isArray(o.rp))o.t.forEach((t,s)=>(o.rp[s]||[]).forEach(i=>{if(i!=null)add(t,D.ch[i],k)}))}
  if(!Object.keys(by).length)throw new Error("champions de la série pas encore disponibles");
  const got=new Set(Object.values(by).flat().map(z=>z[1]));
  return {by,n,ng:got.size,nocache:got.size<n};
}
/* ---- v13.5 l.3667-3689 : classements SJ.rk : accès et libellés (liste shell) ---- */
const RKX=()=>(typeof SJ!=="undefined"&&SJ&&SJ.rk&&SJ.rk.P)?SJ.rk:null;
const RK_AX=["l15","farm","kda","kp","adv","rest"];
const RK_LAB={l15:"Avance à 15 min",farm:"Farm",kda:"KDA",kp:"Participation",adv:"Adversaires",rest:"Ajustement"};
const RK_LAB2={l15:"de l’avance à 15 min",farm:"du farm",kda:"du KDA",kp:"de la participation aux kills",adv:"du niveau des adversaires",rest:"de l’ajustement du modèle"};
const RK_ROLE1={TOP:"top",JGL:"jungler",MID:"mid",BOT:"ADC",SUP:"support"};
const RK_ROLEN={TOP:"tops",JGL:"junglers",MID:"mids",BOT:"ADC",SUP:"supports"};
const RK_AU={TOP:"au top",JGL:"en jungle",MID:"au mid",BOT:"à l’ADC",SUP:"au support"};
const RK_EV={worlds:"Worlds",msi:"MSI",first_stand:"First Stand",ewc_lol:"EWC"};
const rkOrd=i=>i===1?"1er":i+"e";
const rkFem=i=>i===1?"1re":i+"e";
const rkP=k=>PLAYERS.find(p=>p.key===k);
const rkNm=k=>{const p=rkP(k);return p?p.id:String(k).split("_").slice(1).join("_")};
const rkTm=k=>{const p=rkP(k);return p?p.team:String(k).split("_")[0]};
const rkLg=k=>(T[rkTm(k)]||{}).league||"";
const rkSg=(v,f=x=>Math.round(x))=>v==null?"–":(v>0?"+":v<0?"−":"")+f(Math.abs(v));
const rkAl=()=>(SJ&&SJ.m&&SJ.m.logit?SJ.m.logit[1]:.64);
const rkPts=g=>g*rkAl()*25;   // écart de note -> points de chances de victoire dans une partie équilibrée (même règle que compareSheet)
const rkPt=v=>`${rkSg(v,fx1)} pt${Math.abs(v)>=1.95?"s":""}`;
const rkR=v=>v==null?"–":rkSg(v,fx2);
const rkPct=v=>v>=.995?"99+":v<.005?(v>0?"<1":"0"):String(Math.round(v*100));
const rkJoin=L=>L.length<2?(L[0]||""):L.slice(0,-1).join(", ")+" et "+L[L.length-1];
const rkEv=e=>{const [l,y]=String(e).split(" ");return (RK_EV[l]||l)+" "+y};
const rkWE=(w,e,n)=>`${w} victoire${w>1?"s":""} pour ${fx1(e)} attendue${e>=2?"s":""} sur ${n} partie${n>1?"s":""}`;
/* ---- v13.5 l.3698-3701 : classements SJ.rk : index rkFind (liste shell) ---- */
let RK_IX=null,RK_IXS=null;
function rkFind(key){const R=RKX();if(!R)return null;
  if(RK_IXS!==R){RK_IXS=R;RK_IX={};for(const role in R.P){const x=R.P[role];x.r.forEach((r,i)=>{RK_IX[r[0]]={role,key:r[0],i:i+1,n:x.r.length,m:x.m,note:r[1],lo:r[2],hi:r[3],g:r[4],s:r[5],rk:r[6],fs:r[7]||[],wk:r[8]}})}}
  return RK_IX[key]||null}
/* ---- v13.5 l.3702-3727 : classements : raisons d'un rang (rkStat, rkTag, rkLine, rkReason, rkWhy) (liste players) ---- */
/* stat de saison (brute) et rang au poste, pour un axe */
function rkStat(x,a){const s=x.s,r=x.rk;
  if(a==="l15")return s[2]==null?null:{v:`${rkSg(s[2])} d’or à 15 min`,r:r[0]};
  if(a==="farm")return x.role==="SUP"?(s[5]==null?null:{v:`${Math.round(s[5])} d’or par minute`,r:r[3]}):(s[4]==null?null:{v:`${fx2(s[4])} CS par minute`,r:r[2]});
  if(a==="kda")return s[6]==null?null:{v:`KDA ${fx1(s[6])}`,r:r[4]};
  if(a==="kp")return s[7]==null?null:{v:`${Math.round(s[7])} % de participation aux kills`,r:r[5]};
  if(a==="adv")return {v:rkLg(x.key),r:r[6]};
  return null}
/* niveau 1 très court (ligne du classement) : « 9,66 CS/min (1er) » */
function rkTag(x,i,strong,brut){const s=x.s,r=x.rk,o=k=>rkOrd(k)+(brut?" brut":"");
  switch(RK_AX[i]){
    case "l15":return s[2]==null?"":`${rkSg(s[2])} d’or à 15 min (${o(r[0])})`;
    case "farm":return x.role==="SUP"?(s[5]==null?"":`${Math.round(s[5])} or/min (${o(r[3])})`):(s[4]==null?"":`${fx2(s[4])} CS/min (${o(r[2])})`);
    case "kda":return s[6]==null?"":`KDA ${fx1(s[6])} (${o(r[4])})`;
    case "kp":return s[7]==null?"":`${Math.round(s[7])} % aux kills (${o(r[5])})`;
    case "adv":return strong?`adversaires ${rkLg(x.key)} (${rkOrd(r[6])})`:`adversaires ${rkLg(x.key)} plus faibles (${rkOrd(r[6])})`}
  return""}
function rkLine(x){const p=x.fs.map(i=>rkTag(x,i,true)).filter(Boolean),w=x.wk>=0?rkTag(x,x.wk,false):"";
  return esc(p.join(" · ")+(w?(p.length?" · ":"")+"faible : "+w:""))}
/* niveau 1 en phrase : « son farm (9,66 CS par minute, 1er/19 brut) » */
function rkReason(x,i,strong,brut){const a=RK_AX[i],f=rkStat(x,a);if(!f)return"";
  if(a==="adv")return strong?`des adversaires ${f.r<=5?"parmi les plus forts":"plus forts que la moyenne"} (${esc(f.v)})`:`des adversaires ${f.r>x.n-5?"parmi les plus faibles":"plus faibles que la moyenne"} (${esc(f.v)})`;
  const lab={l15:strong?"son avance en lane":"sa phase de lane",farm:"son farm",kda:"son KDA",kp:strong?"sa présence dans les combats":"sa participation aux combats"}[a];
  return `${lab} (${esc(f.v.replace(/^KDA /,""))}, ${rkOrd(f.r)}/${x.n}${brut?" brut":""})`}
const rkWhy=x=>{const fs=x.fs.map(i=>rkReason(x,i,true,true)).filter(Boolean),wk=x.wk>=0?rkReason(x,x.wk,false,true):"";
  return (fs.length?`Porté par ${rkJoin(fs)}.`:"Aucun axe au-dessus de la moyenne du poste.")+(wk?` Point faible : ${wk}.`:"")};
/* ---- v13.5 l.3740-3743 : classements : méthode (rkMethod) (liste players) ---- */
function rkMethod(){const R=RKX(),c=R&&R.pc;
  return `<p>Note d’impact du robot : 6 stats par partie (KDA, participation aux kills, or et CS par minute, écarts d’or et de CS à 15 min face au vis-à-vis), comparées aux autres joueurs du même poste, plus le niveau des 5 adversaires de chaque partie. C’est ce dernier point qui rend la LCK et la CBLOL comparables. Les parties récentes comptent plus (une partie de 4 mois compte moitié). La part des dégâts, la vision et le shotcalling n’y entrent pas.</p>
    <p>Barres : part exacte de chaque axe dans l’écart à la moyenne du poste, en points de chances de victoire (écart de note × ${fx2(rkAl())} × 25). « Ajustement du modèle » : prudence sur les petits échantillons et rappel vers la ligue.${c?` Les deux raisons couvrent en médiane ${Math.round(c.cov*100)} % de l’écart des joueurs au-dessus de la moyenne ; entre deux voisins du classement, l’axe qui les sépare le plus est une raison du premier ou la faiblesse du second dans ${c.adj[0]} cas sur ${c.adj[1]}. Une raison n’est affichée que si la stat de saison va dans le même sens (${c.skip} remplacements sur ${c.n} joueurs).`:""}</p>
    <p>Fourchette : rangs plausibles d’après les rééchantillonnages du robot. Stats de saison : nos parties ${esc(R?R.y:"")} (LoL Esports), à 1 place près des rangs de gol.gg dans 7 cas sur 10 ; qualifications EWC absentes ; gol.gg (saison S16) compte en plus la KeSPA Cup de décembre 2025.</p>`}
/* ---- v13.5 l.3748-3753 : classements : phrase-réponse du meilleur au poste (rkBest1) (liste players) ---- */
function rkBest1(role){const R=RKX(),r=R.P[role].r,x=rkFind(r[0][0]),co=r.filter(z=>z[2]===1).map(z=>z[0]);
  const nm=k=>`<b>${esc(rkNm(k))}</b>`,why=x.fs.map(i=>rkReason(x,i,true,true)).filter(Boolean);
  let h;
  if(co.length>=3)h=`${rkJoin(co.map(nm))} peuvent tous être le meilleur ${RK_ROLE1[role]} des Worlds : ${(v=>`${fx1(v)} point${v>=1.95?"s":""} de chances de victoire au plus les sépare${v>=1.95?"nt":""}`)(Math.max(.1,rkPts(Math.abs(r[0][1]-rkFind(co[co.length-1]).note))))}. ${nm(x.key)} est devant`;
  else h=`${nm(x.key)} (${esc(rkTm(x.key))}) est le meilleur ${RK_ROLE1[role]} des Worlds, ligues comprises${co.length===2?` ; ${nm(co[1])} peut encore lui disputer la place`:x.hi===1?", à coup sûr":""}`;
  return h+(why.length?`. Pourquoi : ${rkJoin(why)}.`:".")}
/* ---- v13.5 l.3781-3808 : qui domine qui au même poste (rkPair, rkDuel1, rkExp1, rkVsHTML, rkGapLi) (liste players) ---- */
/* ---------- qui domine qui au même poste (SJ.rk.D) ---------- */
// duel entre deux titulaires du même poste, vu de ka : {n, w, e, gd, n15, z, n26, w26}
function rkPair(ka,kb){const R=RKX();if(!R||!R.D)return null;const x=rkFind(ka);if(!x||!R.D[x.role])return null;const D=R.D[x.role],ia=D.o.indexOf(ka),ib=D.o.indexOf(kb);if(ia<0||ib<0)return null;
  const [i,j]=ia<ib?[ia,ib]:[ib,ia],r=D.r.find(z=>z[0]===i&&z[1]===j);if(!r)return null;
  const fl=ia>ib;return {n:r[2],w:fl?r[2]-r[3]:r[3],e:fl?r[2]-r[4]:r[4],gd:r[5]==null?null:fl?-r[5]:r[5],n15:r[6],z:fl?-r[7]:r[7],n26:r[8],w26:fl?r[8]-r[9]:r[9]}}
const rkOdd=(d)=>Math.abs(d.z)>=2&&Math.abs(d.w-d.e)>=3;
// niveau 1 : « Chovy mène Faker 41-27 depuis 2024 (68 duels, 9-8 en 2026). D'après la force des équipes, on attendait 38-30 : rien d'anormal. »
function rkDuel1(ka,kb){const R=RKX();if(!R||!R.D)return"";const d=rkPair(ka,kb);if(!d)return"";   // moins de 3 duels : l'appli garde son bloc habituel
  const fl=d.w<d.n-d.w,[a,b]=fl?[kb,ka]:[ka,kb],A=esc(rkNm(a)),B=esc(rkNm(b));   // vu de celui qui mène
  const w=fl?d.n-d.w:d.w,e=fl?d.n-d.e:d.e,gd=d.gd==null?null:fl?-d.gd:d.gd,w26=fl?d.n26-d.w26:d.w26,ew=Math.round(e),dev=w-e;
  const lead=w===d.n-w?`${A} et ${B} sont à égalité ${w}-${d.n-w}`:`${A} mène ${B} ${w}-${d.n-w}`;
  return `${lead} depuis 2024 (${d.n} duels${d.n26?`, ${w26}-${d.n26-w26} en ${esc(R.y)}`:""}). D’après la force des équipes, on attendait ${ew}-${d.n-ew}${rkOdd(d)?` : ${dev>0?A:B} fait mieux que prévu, mais sur l’ensemble des duels ces écarts ne dépassent pas le hasard`:" : rien d’anormal, c’est surtout l’écart entre les équipes"}.${gd!=null&&d.n15>=3?` En lane, ${rkSg(gd)} d’or à 15 min pour ${A} en moyenne.`:""}`}
const rkDuel1HTML=(a,b)=>{const t=a.role===b.role?rkDuel1(a.key,b.key):"";return t?`<p class="rk1">${t}</p>`:""};
// une ligne sous le bilan du « Prochain duel » (le bilan est déjà affiché juste au-dessus)
function rkExp1(ka,kb){const d=rkPair(ka,kb);if(!d)return"";const ew=Math.round(d.e),dev=d.w-d.e;
  return `<p class="small rkexp">D’après la force des équipes, ${esc(rkNm(ka))} en aurait gagné ${ew} sur ${d.n}${rkOdd(d)?` : ${esc(rkNm(dev>0?ka:kb))} fait mieux que prévu, un écart que le hasard explique aussi`:" : rien d’anormal, c’est surtout l’écart entre les équipes"}.</p>`}
// niveau 2 : les duels d'un joueur contre les autres titulaires du poste, du plus au moins favorable par rapport à l'attendu
function rkVsHTML(key){const x=rkFind(key),R=RKX();if(!x||!R.D||!R.D[x.role])return"";const D=R.D[x.role];
  const L=D.o.filter(k=>k!==key).map(k=>({k,d:rkPair(key,k)})).filter(z=>z.d).sort((a,b)=>(b.d.w-b.d.e)-(a.d.w-a.d.e));
  if(!L.length)return `<p class="small">Aucun duel d’au moins 3 parties contre les autres ${RK_ROLEN[x.role]} des Worlds depuis 2024.</p>`;
  const dt=R.dt,ob=Math.round(dt.z2*dt.n),ex=Math.round(dt.att*dt.n);
  return `<div class="rkvs"><div class="rkvr hd"><span>Adversaire</span><span>Bilan</span><span>Attendu</span><span>Or à 15 min</span></div>${L.map(({k,d})=>`<button class="rkvr" data-cmp="${esc(key)}|${esc(k)}"><span>${logo(rkTm(k),18)}<b>${esc(rkNm(k))}</b></span><span><b class="${d.w>d.n-d.w?"w":d.w<d.n-d.w?"l":""}">${d.w}-${d.n-d.w}</b></span><span>${Math.round(d.e)}-${d.n-Math.round(d.e)}</span><span>${d.gd!=null&&d.n15>=3?rkSg(d.gd):"–"}</span></button>`).join("")}</div>
   <div class="small rkleg">Depuis 2024, duels d’au moins 3 parties. Touche un nom pour comparer.${rkInfoIn(`Victoires attendues : somme des chances de son équipe avant chaque partie (Elo d’équipe, le même que dans la fiche). Sur les ${dt.n} paires de titulaires qui se sont affrontées au moins ${dt.min[1]} fois, ${ob} s’écartent de l’attendu au-delà de 2 erreurs types ; le hasard seul en donnerait environ ${ex}. Pas de « bête noire » démontrée : un bilan direct reflète surtout la force des deux équipes.`)}</div>`}
/* comparaison de deux joueurs du même poste : d'où vient l'écart de note (décomposition exacte) */
function rkGapLi(ka,kb){const A=rkFind(ka),B=rkFind(kb);if(!A||!B||A.role!==B.role)return"";
  const s=A.note>=B.note?1:-1,W=s>0?ka:kb,ax=[0,1,2,3,4].map(i=>[i,(A.g[i]-B.g[i])*s]).filter(z=>z[1]>=.02).sort((x,y)=>y[1]-x[1]).slice(0,2);
  if(!ax.length)return"";
  return `<li>L’écart vient surtout ${rkJoin(ax.map(([i,v])=>`${RK_LAB2[RK_AX[i]]} (${rkPt(rkPts(v))})`))}, en faveur de ${esc(rkNm(W))}.</li>`}
/* ---- v13.5 l.3810-3841 : Spécial Worlds : phrases et détails (rkWorlds1, rkWorldsP1/P2, rkWorldsT1/T2, rkWorldsMethod) (liste players) ---- */
/* ---------- 2. « Spécial Worlds » : qui se transforme aux grands tournois ---------- */
function rkWorlds1(){const R=RKX();if(!R||!R.it)return"";const it=R.it,TT=R.T||{};
  const up=Object.keys(TT).filter(t=>TT[t][7]>0).sort((a,b)=>TT[b][3]-TT[a][3]);
  let h=`Pas d’effet « grand tournoi » général : le surplus d’un joueur aux internationaux en 2024 ne prédit pas celui de 2025-2026 (r = ${rkR(it.pab[1])} sur ${it.pab[0]} joueurs).`;
  if(Math.max(it.pab[1]||0,it.psh[0]||0)>=.3)h=`Effet « grand tournoi » en partie stable : le surplus d’un joueur en 2024 ressemble à celui de 2025-2026 (r = ${rkR(it.pab[1])}).`;
  if(up.length){const t=TT[up[0]];h+=` Exception possible : <b>${esc(up[0])}</b>, ${rkWE(t[1],t[2],t[0])} aux internationaux depuis 2024.`}
  return h}
// niveau 1, fiche joueur : une phrase honnête sur ses internationaux, [réponse, complément]
function rkWorldsP1(key,court){const R=RKX(),x=R&&R.I&&R.I[key],b=typeof BIO!=="undefined"&&BIO[key],yrs=b&&b[3]?b[3].length:0;
  if(!x||!x[0])return [yrs===1?"Premiers Worlds":"Aucune partie internationale depuis 2024",yrs===1?"aucune partie internationale depuis 2024":""];
  const zw=x[11]&&x[7]>=10?x[10]/x[11]:0,base=`${x[0]} partie${x[0]>1?"s":""} depuis 2024, ${x[1]} gagnée${x[1]>1?"s":""} pour ${fx1(x[2])} attendue${x[2]>=1.95?"s":""}`;
  if(x[12])return court?[`Nettement ${x[12]>0?"au-dessus":"en dessous"} de sa note : ${rkPt(rkPts(x[3]))}`,"aux internationaux, "+base]:[`Aux internationaux, ses stats sont nettement ${x[12]>0?"au-dessus":"en dessous"} de sa note : ${rkPt(rkPts(x[3]))} de victoire`,base];
  if(Math.abs(zw)>=1.645)return court?[`Stats en ${zw>0?"hausse":"baisse"} : ${rkPt(rkPts(x[10]))} de victoire`,`aux Worlds par rapport à sa note, ${x[7]} parties depuis 2024 ; tendance, pas une preuve`]:[`Aux Worlds, ses stats ${zw>0?"montent":"baissent"} : ${rkPt(rkPts(x[10]))} de victoire par rapport à sa note`,`${x[7]} parties aux Worlds depuis 2024 ; tendance, pas une preuve`];
  return court?["À son niveau, dans la marge d’erreur","aux internationaux, "+base]:["À son niveau aux internationaux : écart dans la marge d’erreur",base]}
// niveau 2 : le détail chiffré, puis le lien vers la fiche « Spécial Worlds »
function rkWorldsP2(key,nolink){const R=RKX(),x=R&&R.I&&R.I[key],p=rkP(key);let h="";
  if(x&&x[0]){h+=`<p>Tous les internationaux depuis 2024 : ses stats valent ${x[3]==null?"–":rkPt(rkPts(x[3]))} de victoire par rapport à sa note d’avant chaque tournoi (marge à 90 % ±${fx1(rkPts(1.645*(x[4]||0)))}).${x[5]!=null&&x[6]!=null?` En 2024 : ${rkPt(rkPts(x[5]))} ; depuis 2025 : ${rkPt(rkPts(x[6]))}.`:""}</p>`;
    if(x[7]>=5)h+=`<p>Aux Worlds seuls : ${rkWE(x[8],x[9],x[7])}${x[10]!=null?`, stats ${rkPt(rkPts(x[10]))} (marge ±${fx1(rkPts(1.645*(x[11]||0)))})`:""}.</p>`;
    h+=`<p>Le surplus d’une année ne se retrouve pas l’année suivante (r = ${rkR(R.it.pab[1])} sur ${R.it.pab[0]} joueurs) : c’est un constat, pas une prévision.</p>`}
  if(p&&p.titles.length)h+=`<p>Champion du monde ${p.titles.join(", ")}.</p>`;
  return h+(nolink?"":`<p class="rkbt"><button class="btn" data-rkw="${esc(key)}">Spécial Worlds : tous les joueurs</button></p>`)}
// niveau 1 et 2, fiche équipe : [réponse, complément]
function rkWorldsT1(t){const R=RKX(),v=R&&R.T&&R.T[t];if(!v||!v[0])return null;const x=v[1]-v[2];
  return [`${v[7]>0?"Au-dessus de l’attendu, au-delà du hasard":v[7]<0?"En dessous de l’attendu, au-delà du hasard":Math.abs(v[3])<1?"Comme prévu par la note de ses joueurs":"Dans la marge d’erreur"} : ${rkSg(x,fx1)} victoire${Math.abs(x)>=1.95?"s":""}`,`${rkWE(v[1],v[2],v[0])} aux internationaux depuis 2024`]}
function rkWorldsT2(t,nolink){const R=RKX(),v=R&&R.T&&R.T[t];if(!v)return"";const d=v[8]||[0,0];
  return `<div class="rkt3">${v[9].map(([e,n,w,ee])=>`<span>${esc(rkEv(e))}</span><span><b>${w}-${n-w}</b></span><span class="small">attendu ${fx1(ee)}-${fx1(n-ee)}</span>`).join("")}</div>
    <p>${d[0]?`En ligue ${esc(R.y)} : ${Math.round(d[1]/d[0]*100)} % de victoires (${d[0]} parties). `:""}Attendu : d’après la note de ses joueurs avant chaque tournoi. Une équipe au-dessus de l’attendu un été ne l’est pas forcément l’été suivant (r = ${rkR(R.it.tab[1])} sur ${R.it.tab[0]} équipes).</p>
    ${nolink?"":`<p class="rkbt"><button class="btn" data-rkw="${esc(t)}">Spécial Worlds : toutes les équipes</button></p>`}`}
function rkWorldsMethod(){const R=RKX(),it=R&&R.it;if(!it)return"";
  return `<p>Pour chaque tournoi international (${it.ev.map(rkEv).join(", ")}), le robot recalcule les notes avec les seules parties jouées avant. Chaque partie est comparée à ce que ces notes prévoyaient : les stats (même indice que la note, converti en points de chances de victoire) et la victoire.</p>
    <p>Stabilité : surplus d’un joueur en 2024 contre 2025-2026, r = ${rkR(it.pab[1])} sur ${it.pab[0]} joueurs ; victoires, r = ${rkR(it.wab[1])} ; équipes, r = ${rkR(it.tab[1])} sur ${it.tab[0]}. Deux moitiés tirées au hasard parmi les séries : r = ${rkR(it.psh[0])} (entre ${rkR(it.psh[1])} et ${rkR(it.psh[2])}).</p>
    <p>« Net » : au moins 2 erreurs types, 20 parties, et le même sens en 2024 et depuis 2025. Effets nets : ${(n=>n+" joueur"+(n>1?"s":""))(Object.values(R.I||{}).filter(v=>v[12]).length)} sur ${it.n[0]} (le hasard en donnerait ${fx1(it.n[2])}), ${(n=>n+" équipe"+(n>1?"s":""))(Object.values(R.T||{}).filter(v=>v[7]).length)} sur ${it.n[1]} (le hasard en donnerait ${fx1(it.n[3])}). EWC 2024 et 2025 manquent dans nos données.</p>`}
/* ---- v13.5 l.3866-3892 : qui va gagner : phrase-réponse, raison courte, raisons détaillées, méthode, fiabilité (rkWho1, rkTeamShort, rkWhyTeam, RK_KIND, rkSimInfo, rkFiab) (liste swiss) ---- */
function rkWho1(){const R=RKX(),W=R&&R.W;if(!W)return"";
  const c=W.ch.map(x=>`${esc(x.t)} (${rkPct(x.p[0])} %)`);
  return `<b>${esc(W.fav.t)}</b> favori : ${rkPct(W.fav.p[0])} % de chances de titre.${c.length?` Puis ${rkJoin(c)}.`:""}${W.out?` Outsider : ${esc(W.out.t)}.`:""}`}
// une raison en quelques mots : « n°1 au top, à la jungle et au mid »
function rkTeamShort(x){
  if(x.pos&&x.pos.length){const ks=[...new Set(x.pos.map(z=>z[1]))].sort((a,b)=>a-b),grp=k=>`${k===1?"n°1":rkOrd(k)} ${rkJoin(x.pos.filter(z=>z[1]===k).map(z=>RK_AU[z[0]]))}`;
    return x.pos.filter(z=>z[1]===ks[0]).length>1||ks.length<2?grp(ks[0]):`${grp(ks[0])}, ${grp(ks[1])}`}
  if(x.wf&&x.wf[0]+x.wf[1])return `${x.wf[0]}-${x.wf[1]} en parties à ces Worlds`;
  return x.seed&&x.seed[2]?`${rkFem(x.seed[2])} force de la ${x.seed[0]}`:""}
function rkWhyTeam(x,kind){const W=RKX().W,out=[];
  if(x.pos.length){const by={};x.pos.forEach(([r,k,key])=>(by[k]=by[k]||[]).push(`${RK_AU[r]} (${esc(rkNm(key))})`));
    out.push("Note d’impact : "+Object.keys(by).sort((a,b)=>a-b).map(k=>`${rkOrd(+k)} ${rkJoin(by[k])}`).join(" ; "))}
  if(kind==="fav"&&W.gap&&W.gap[1]>0){const p=1/(1+Math.exp(-rkAl()*W.gap[1])),p5=p**3*(1+3*(1-p)+6*(1-p)**2);
    out.push(`la meilleure force du tournoi : face à ${esc(W.gap[0])}, la 2e, ${rkPct(p)} % de chances sur une partie, ${rkPct(p5)} % en Bo5`)}
  if(kind==="out"&&x.seed[1]&&x.seed[2])out.push(`${esc(x.seed[0])} n°${x.seed[1]} au classement, mais ${rkFem(x.seed[2])} force de sa ligue`);
  if(x.nx)out.push(`${rkPct(x.p[3])} % d’aller en quarts ; adversaire le plus probable au prochain match : ${esc(x.nx[0])} (${rkPct(x.nx[1])} %), battu ${rkPct(x.nx[2])} fois sur 100`);
  if(x.wf&&x.wf[0]+x.wf[1])out.push(`${x.wf[0]}-${x.wf[1]} en parties à ces Worlds${x.wf[2]?`, dont ${x.wf[2]} partie${x.wf[2]>1?"s":""} au Play-In`:""}`);
  return out.slice(0,3)}
const RK_KIND={fav:"favori",ch:"challenger",out:"outsider"};
const rkWhoRow=(x,k)=>`<details class="rkwr"><summary>${logo(x.t,26)}<span><b>${esc(x.t)}</b> <i>${RK_KIND[k]}</i><small>${esc(rkTeamShort(x))}</small></span><em>${rkPct(x.p[0])} %</em></summary>
  <ul class="why">${rkWhyTeam(x,k).map(s=>`<li>${s.charAt(0).toUpperCase()+s.slice(1)}.</li>`).join("")}</ul><p class="rkbt"><button class="btn" data-t="${esc(x.t)}">Fiche ${esc(x.t)}</button></p></details>`;
function rkSimInfo(s,W){return `<p>Le robot rejoue la fin du tournoi ${(s.n||(W&&W.n)||20000).toLocaleString("fr-FR")} fois à chaque mise à jour, avec les résultats déjà acquis. Force d’une équipe : somme des notes d’impact de ses 5 titulaires. Bo1 et Bo3 de la phase suisse, Bo5 ensuite.</p>
  ${W?`<p>Challengers : les 3 suivants avec au moins 5 % de titre. Outsider : la mieux placée des équipes qualifiées plus bas dans leur ligue que leur force ne le dit. « n°1 au top » : note d’impact parmi les 19 titulaires du poste.</p>`:""}
  ${rkFiab()}`}
// fiabilité mesurée par le robot avant les Worlds (SJ.fiab) : bon favori, et un point de calibration
function rkFiab(){const F=SJ&&SJ.fiab,E=F&&F.t&&F.t.E;if(!E||!E.g)return"";const c=(F.cal||[]).filter(z=>z[2]>=30).sort((a,b)=>Math.abs(a[0]-.75)-Math.abs(b[0]-.75))[0];
  return `<p>Testé à l’aveugle sur ${E.g[0]} parties internationales 2025-2026 : bon favori ${Math.round(E.g[3]*100)} % du temps${c?` ; quand il annonce ${Math.round(c[0]*100)} %, l’équipe gagne ${Math.round(c[1]*100)} % du temps (${c[2]} parties)`:""}.</p>`}
/* ---- v13.5 l.3913-3930 : fiche joueur : vis-à-vis désignés (rkFjPair, rkFicheData, RK_DES) (liste players) ---- */
// bilan de p contre un adversaire de fiche.json (vs = [pseudo, équipe, clé]) : {g, w, gd, n15, exp} sur la période per ("y" : année, "a" : depuis 2024)
function rkFjPair(D,p,idx,per){const v=D.vs[idx],du=D.duo[p.key];let r=null;
  if(v[2]){const o=rkP(v[2]),ka=norm(p.id),kb=o?norm(o.id):norm(v[0]),x=D.dp&&D.dp[ka<kb?ka+"|"+kb:kb+"|"+ka];
    if(x)r=ka<kb?x:[x[0],x[0]-x[1],-x[2],x[3],x[5],x[4],x[6],x[0]-x[7]].concat(x.length>8?[x[8],x[8]-x[9],-x[10],x[11],x[13],x[12],x[8]-x[14]]:[])}
  if(!r){const z=du&&du.r.find(q=>q[0]===idx);if(z)r=z.slice(1)}
  if(!r)return null;const o=per==="y"&&r.length>8?8:0;
  return {g:r[o],w:r[o+1],gd:r[o+2],n15:r[o+3],exp:o?r[14]:r[7]}}
// données légères pour ablock (≈ 1 Ko gardé dans le téléphone) : 5 champions de l'année, 4 désignations (némésis, victime, plus dur et plus facile en lane)
async function rkFicheData(p){
  let D=null;try{D=typeof loadFJ==="function"?await loadFJ():await loadAux("fiche")}catch(e){D=null}
  if(!D||D.v!==1||!Array.isArray(D.gm))return {missing:true,nocache:true};
  const c=D.ch&&D.ch[p.key],du=D.duo&&D.duo[p.key];
  const ch=c&&c.y?c.y.slice(0,5).map(r=>[D.champs[r[0]],r[1],r[2],r[3],r[4],r[5],r[6],r.length>7?r[7]:null]):[];
  const des=du?[0,1,2,3].map(i=>{const per=du.dy[i]!=null?"y":du.da[i]!=null?"a":null;if(!per)return null;const idx=(per==="y"?du.dy:du.da)[i],v=D.vs[idx],b=rkFjPair(D,p,idx,per);
    return b?{i,per,nm:v[0],tm:v[1],key:v[2]||null,...b}:null}).filter(Boolean):[];
  return {y:D.y,since:(D.per&&D.per.duo)||"2024",ch,pool:c&&c.zy?c.zy[0]:null,des,nem:D.cfg&&D.cfg.nem?D.cfg.nem[0]:8,ref:D.cfg&&D.cfg.chref||30};
}
const RK_DES=["Némésis","Victime","Plus dur en lane","Plus facile en lane"];
/* ---- v13.5 l.4022-4031 : ligue : état (scores, lg, relais ntfy, DU, couleurs) (liste shell) ---- */
let scores=LS.get("scores",{});
const rid=()=>Math.random().toString(36).slice(2,10);
let lg=LS.get("league",null);
(function migrate(){const old=LS.get("duel",null);if(old&&!lg&&old.code){lg={code:old.code,me:{id:rid(),name:old.me||"Moi"},owner:old.role==="A",gage:old.gage||"",players:{}};LS.set("league",lg)}if(old)LS.set("duel",null)})();
const saveLg=()=>LS.set("league",lg);
const NTFY="https://ntfy.sh/",topicOf=c=>"iagames-worlds26-ligue-"+c;
const DU={es:null,open:false,seen:new Set(),pubT:0,pollT:0,errs:0,t0:Math.floor(Date.now()/1000),hello:false,lastId:null,pollOk:false,pubErr:false};
const CODE_CH="ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const PCOL=["#C8AA6E","#0AC8B9","#E84057","#8E5CF6","#F59E0B","#3B82F6","#22C55E","#EC4899","#14B8A6","#F97316"];
const pcol=id=>{let h=0;for(const c of String(id))h=(h*31+c.charCodeAt(0))>>>0;return PCOL[h%PCOL.length]};
/* ---- v13.5 l.4033-4148 : ligue : encodage des paris, relais ntfy, points, classement, robot membre, liens d'invitation (liste league) ---- */
/* ---- paris : encodage compact ---- */
function encPicks(){return Object.keys(picks).map(k=>`${k}~${picks[k]}~${scores[k]||""}`).join(".")}
function decPicks(s){const o={};String(s||"").split(".").forEach(x=>{const [k,w,sc]=x.split("~");if(k&&w&&T[w])o[k]={w,sc:sc||null}});return o}
const myBets=()=>{const o={};Object.keys(picks).forEach(k=>o[k]={w:picks[k],sc:scores[k]||null});return o};

/* ---- transport ---- */
function payload(hello){return JSON.stringify({v:3,id:lg.me.id,name:lg.me.name,p:encPicks(),ts:Date.now(),hello:!!hello,owner:!!lg.owner,gage:lg.owner?lg.gage:null})}
async function publish(hello){
  if(!lg)return;
  try{const r=await fetch(NTFY+topicOf(lg.code),{method:"POST",body:payload(hello)});if(!r.ok)throw new Error(r.status);DU.pubErr=false;if(window.mark)mark("relay",true,0)}
  catch(e){DU.pubErr=true;if(window.mark)mark("relay",false,0,"publication : "+e.message);clearTimeout(DU.retryPub);DU.retryPub=setTimeout(()=>publish(hello),8000)}
  renderDuelOnly();
}
function duelState(){clearTimeout(DU.pubT);DU.pubT=setTimeout(()=>publish(false),600)}
function handleMsg(m){
  if(!lg||!m||(m.event&&m.event!=="message")||!m.id||DU.seen.has(m.id))return;
  DU.seen.add(m.id);DU.lastId=m.id;
  let d;try{d=JSON.parse(m.message)}catch(e){return}
  if(!d||!d.id||d.id===lg.me.id||!d.name)return;
  onLeagueData(d,m.time||0);
}
function duelConnect(){
  if(!lg)return;duelStop();
  if(typeof EventSource==="undefined"){startPoll();return}
  const es=DU.es=new EventSource(NTFY+topicOf(lg.code)+"/sse?since=all");
  es.onopen=()=>{DU.open=true;DU.errs=0;stopPoll();if(window.mark)mark("relay",true,0);renderDuelOnly();if(!DU.hello){DU.hello=true;publish(true)}};
  es.onmessage=ev=>{try{handleMsg(JSON.parse(ev.data))}catch(e){}};
  es.onerror=()=>{DU.open=false;DU.errs++;renderDuelOnly();if(DU.errs>=2)startPoll()};
}
async function pollOnce(){
  if(!lg)return;
  try{const r=await fetch(NTFY+topicOf(lg.code)+"/json?poll=1&since="+(DU.lastId||"all"));const t=await r.text();
    t.split("\n").forEach(l=>{if(l.trim())try{handleMsg(JSON.parse(l))}catch(e){}});
    DU.pollOk=true;if(!DU.hello){DU.hello=true;publish(true)}}catch(e){DU.pollOk=false}
  renderDuelOnly();
}
function startPoll(){if(DU.pollT)return;pollOnce();DU.pollT=setInterval(()=>{if(!document.hidden)pollOnce()},12000)}
function stopPoll(){clearInterval(DU.pollT);DU.pollT=0}
function duelStop(){try{DU.es&&DU.es.close()}catch(e){}DU.es=null;DU.open=false;stopPoll();DU.hello=false}
function duelWake(){if(!lg)return;if(!DU.es||DU.es.readyState===2)duelConnect();else pollOnce()}
let rdT=0;const renderSoon=()=>{clearTimeout(rdT);rdT=setTimeout(()=>{leaChanged()},120)};
function onLeagueData(d,time){
  const fresh=time>=DU.t0-120,old=lg.players[d.id],isNew=!old;
  if(d.owner&&d.gage!=null&&!lg.owner)lg.gage=String(d.gage).slice(0,60);
  if(old&&d.ts<=old.ts&&!d.hello)return;
  const prev=old?old.p:{},next=decPicks(d.p);
  if(!old||d.ts>old.ts)lg.players[d.id]={name:String(d.name).slice(0,16),p:next,ts:d.ts};
  else lg.players[d.id].name=String(d.name).slice(0,16);
  saveLg();
  if(fresh){
    const added=Object.keys(next).filter(k=>!prev[k]);
    if(isNew)toast(`${d.name} a rejoint la ligue`);
    else if(added.length){const m=MATCHES.find(x=>x.key===added[added.length-1]);toast(`${d.name} a placé son pari${m&&m.t1&&m.t2?` pour ${T[m.t1].id} vs ${T[m.t2].id}`:""}`)}
    if(isNew||added.length)vib(25);
    if(d.hello)setTimeout(()=>publish(false),300+Math.random()*2500);
  }
  renderSoon();
}
function duelPickChanged(){if(lg)duelState()}

/* ---- points et classement ---- */
function pts(w,sc,m){
  if(!w||!m.winner||w!==m.winner)return 0;let p=1;
  if(m.bo>1&&sc&&m.s1!=null&&m.s2!=null){const ws=m.winner===m.t1?m.s1:m.s2,ls=m.winner===m.t1?m.s2:m.s1;if(sc===`${ws}-${ls}`)p++}
  return p;
}
const scoreOpts=bo=>bo===3?["2-0","2-1"]:bo===5?["3-0","3-1","3-2"]:[];
// le robot joue dans la ligue (sur ce téléphone seulement, rien n'est envoyé) : pour les matchs joués, son prono figé avant le match
// (bilan du robot, SJ.fiab) ; pour les autres, son prono du moment. Les points se comptent comme pour tout le monde.
function robotBets(H){
  const p={};if(!SJ)return p;
  const F=(SJ.fiab&&SJ.fiab.w26&&SJ.fiab.w26.m)||[],tid=c=>T[c]?c:(typeof resolveTeam==="function"?resolveTeam(c,c):null);
  F.forEach(r=>{const m=MATCHES.find(x=>x.id==="le"+r[0]);const w=tid(r[5]>=.5?r[2]:r[3]);if(m&&w&&(w===m.t1||w===m.t2))p[m.key]={w}});
  MATCHES.forEach(m=>{if(p[m.key]||!m.t1||!m.t2)return;const q=robotProb(m);if(q!=null)p[m.key]={w:q>=.5?m.t1:m.t2}});
  // à armes égales : sur les matchs déjà joués, il ne compte que ceux où quelqu'un de la ligue a parié
  if(H)MATCHES.forEach(m=>{if(m.winner&&p[m.key]&&!H.some(u=>u.p[m.key]))delete p[m.key]});
  return p;
}
function members(){const L=[{id:lg.me.id,name:lg.me.name,p:myBets(),me:true},...Object.entries(lg.players).map(([id,x])=>({id,name:x.name,p:x.p,ts:x.ts}))];
  if(SJ&&(SJ.fiab||SJ.sim))L.push({id:"robot",name:"Le robot",p:robotBets(L),bot:true});return L}
function standings(L){
  const all=L||members(),done=MATCHES.filter(m=>m.winner&&!m.manual&&m.t1&&m.t2);
  all.forEach(u=>{u.pts=0;u.ex=0;u.ok=0;u.n=0;u.form=[];u.streak=0;u.bold=0;
    done.forEach(m=>{const b=u.p[m.key];if(!b)return;u.n++;const s=pts(b.w,b.sc,m);u.pts+=s;if(s)u.ok++;if(s>1)u.ex++;u.form.push(s>0)});
    for(let k=u.form.length-1;k>=0&&u.form[k];k--)u.streak++});
  done.forEach(m=>{const bt=all.filter(u=>u.p[m.key]);if(bt.length<3)return;const good=bt.filter(u=>u.p[m.key].w===m.winner);if(good.length&&good.length<=bt.length/3)good.forEach(u=>u.bold++)});
  all.sort((a,b)=>b.pts-a.pts||b.ex-a.ex||b.ok-a.ok||a.name.localeCompare(b.name));
  let r=0;all.forEach((u,i)=>{if(i===0||u.pts!==all[i-1].pts||u.ex!==all[i-1].ex)r=i+1;u.rank=r});
  return all;
}
function checkRank(){
  if(!lg||!Object.keys(lg.players).length)return;
  const st=standings(),me=st.find(u=>u.me),prev=LS.get("lgRank",null);
  if(prev&&me.rank<prev&&me.pts>0){toast(me.rank===1?"Tu prends la tête de la ligue !":`Tu passes ${me.rank}e !`);if(me.rank===1)leaBoom(innerWidth/2,innerHeight*.3,["#C8AA6E","#F0E6D2","#0AC8B9"],110);vib([30,40,30])}
  LS.set("lgRank",me.rank);
}

/* ---- liens ---- */
function duelLink(){
  const u=new URL(location.href.split("?")[0].split("#")[0]);
  u.searchParams.set("ligue",lg.code);if(lg.gage)u.searchParams.set("g",lg.gage);u.searchParams.set("n",lg.me.name);
  return u.toString();
}
async function shareDuel(){
  const url=duelLink(),text=`${lg.me.name} t’invite dans sa ligue de paris Worlds 2026 ! Code ${lg.code}${lg.gage?`. Gage du dernier : ${lg.gage}`:""}`;
  try{if(navigator.share){await navigator.share({title:"Ligue de paris Worlds 2026",text,url});return}}catch(e){return}
  try{await navigator.clipboard.writeText(text+"\n"+url);toast("Lien copié")}catch(e){toast("Code : "+lg.code)}
}
function readDuelParams(){
  const q=new URLSearchParams(location.search),code=(q.get("ligue")||q.get("duel")||"").toUpperCase().replace(/[^A-Z0-9]/g,"");
  if(code.length!==4)return;
  const n=(q.get("n")||"").slice(0,16),g=(q.get("g")||"").slice(0,60);
  history.replaceState(history.state,"",location.pathname+location.hash);
  if(lg&&lg.code===code)return;
  setTimeout(()=>duelSheet("join",{code,n,g}),lg?0:2700);
}
/* ---- v13.5 l.4230-4303 : fun : records en vue en direct (aides, candidats, phrases, détail) (liste match) ---- */
const FUN={busy:{},fail:{}};
const funSafe=(f,...a)=>{try{return f(...a)}catch(e){console.warn("fun",e);return""}};
const funFu=()=>SJ&&SJ.fu&&SJ.fu.v===1?SJ.fu:null;
const funNm=k=>{const p=PLAYERS.find(x=>x.key===k);return p?p.id:String(k||"?")};
const funTm=c=>T[c]?T[c].id:String(c||"?");
const funMS=v=>{const s=Math.round(v*60);return Math.floor(s/60)+":"+String(s%60).padStart(2,"0")};
const funPc=v=>Math.round(v*100)+" %";
const funDot=s=>/[.…]$/.test(s)?s:s+".";
const funNw=s=>`<span class="fnnw">${s}</span>`;
const funDay=iso=>{const d=new Date(iso);return isNaN(d)?"":evDate(d).toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"})};
const FUN_LG={worlds:"Worlds",msi:"MSI",first_stand:"First Stand",americas_cup:"Americas Cup",ewc_lol:"EWC",kespa_cup:"KeSPA Cup",lck:"LCK",lpl:"LPL",lec:"LEC",lcs:"LCS",
  "cblol-brazil":"CBLOL",lcp:"LCP",lta_n:"LTA Nord",lta_s:"LTA Sud",lta_cross:"LTA",pcs:"PCS",vcs:"VCS"};

/* ---------- 1. records en vue ---------- */
const FUN_K={k:{th:.7,u:"kills"},a:{th:.8,u:"assists"},csm:{th:.95,min:20},ds:{th:.9,min:15},sang:{th:.8}};
function funRecCands(L){
  const F=funFu(),R=F&&F.r,f=L&&L.frame,md=L&&L.meta;if(!R||!f||!md)return [];
  const mins=gameMins(L),out=[],P=[...(f.blueTeam.participants||[]),...(f.redTeam.participants||[])];
  const det=L.l2d&&L.l2d.gid===L.gid&&L.l2d.f&&L.l2d.f.participants||null;
  const meta=[...((md.blueTeamMetadata||{}).participantMetadata||[]).map(x=>[x,L.blue]),...((md.redTeamMetadata||{}).participantMetadata||[]).map(x=>[x,L.red])];
  const push=(kind,sc,v,who)=>{const r=R[sc+"."+kind],K=FUN_K[kind];if(!r||!(r[0]>0)||v==null||!isFinite(v)||(K.min&&mins<K.min))return;
    const q=v/r[0];if(q>=K.th)out.push({kind,sc,v,r,q,who,beat:v>r[0]+1e-9,tie:Math.abs(v-r[0])<1e-9})};
  meta.forEach(([pm,team])=>{const s=P.find(x=>x.participantId===pm.participantId);if(!s)return;
    const pl=playerFromSummoner(pm.summonerName,team),who={n:pl?pl.id:String(pm.summonerName||"").split(" ").slice(1).join(" ")||pm.summonerName||"?",k:pl?pl.key:null,team};
    ["w","y"].forEach(sc=>{push("k",sc,s.kills,who);push("a",sc,s.assists,who);if(mins>0)push("csm",sc,(s.creepScore||0)/mins,who);
      const d=det&&det.find(x=>x.participantId===pm.participantId);if(d&&d.championDamageShare!=null)push("ds",sc,d.championDamageShare,who)})});
  const tk=P.reduce((a,s)=>a+(s.kills||0),0);if(P.length===10)push("sang","w",tk,null);
  const c=R["w.court"];
  if(c&&f.gameState==="finished"&&kfMins(L)!=null&&kfExact(L,Date.parse(f.rfc460Timestamp))){const v=kfMins(L);if(v>0&&v<c[0]-10/60)out.push({kind:"court",sc:"w",v,r:c,q:2,beat:true})}
  return out;
}
/* la plus forte : record de l'année battu, de ces Worlds battu, de l'année égalé, de ces Worlds égalé, puis la plus proche */
const funRank=c=>c.beat?(c.sc==="y"?3.5:3):c.tie?(c.sc==="y"?3.2:2):c.q;
function funRecTxt(c,L){
  const r=c.r,de=c.sc==="w"?"de ces Worlds":"de l’année",self=c.who&&c.who.k&&c.who.k===r[1];
  const hold=funNw(self?"lui-même":esc(funNm(r[1]))),opp=esc(funTm(r[3])),nm=c.who?`<b>${esc(c.who.n)}</b>`:"";
  const val=x=>c.kind==="csm"?fx1(x)+" CS par minute":c.kind==="ds"?funPc(x)+" des dégâts de son équipe":x+" "+FUN_K[c.kind].u;
  let t;
  if(c.kind==="court")t=`Partie finie en <b>${funMS(c.v)}</b> : la plus courte de ces Worlds (avant : ${funMS(r[0])}, ${esc(funTm(r[2]))} contre ${esc(funTm(r[3]))})`;
  else if(c.kind==="sang")t=c.beat?`<b>${c.v} kills</b> dans la partie : record de ces Worlds battu (avant : ${r[0]}, ${esc(funTm(r[2]))} – ${esc(funTm(r[3]))})`
    :c.tie?`<b>${c.v} kills</b> dans la partie : record de ces Worlds égalé (${esc(funTm(r[2]))} – ${esc(funTm(r[3]))})`
    :`Déjà <b>${c.v} kills</b> dans la partie : le record de ces Worlds est ${r[0]} (${esc(funTm(r[2]))} – ${esc(funTm(r[3]))})`;
  else{const now=c.kind==="csm"?`${nm} tourne à ${val(c.v)}`:c.kind==="ds"?`${nm} fait ${val(c.v)}`:`${nm} est à ${val(c.v)}`;
    const rv=c.kind==="csm"?fx1(r[0]):c.kind==="ds"?funPc(r[0]):r[0];
    t=c.beat?`${now} : il bat le record ${de} (${rv}, ${hold} contre ${opp})`
      :c.tie?`${now} : il égale le record ${de} (${self?"le sien":hold+", contre "+opp})`
      :`${now} : le record ${de} est ${rv} (${hold}, contre ${opp})`;
    // record de ces Worlds battu ou égalé, celui de l'année en vue pour le même joueur : on le dit dans la même ligne
    const y=c.sc==="w"&&(c.beat||c.tie)&&c.y;
    if(y){const ys=y.who&&y.who.k&&y.who.k===y.r[1],yv=c.kind==="csm"?fx1(y.r[0]):c.kind==="ds"?funPc(y.r[0]):y.r[0];
      t+=` ; celui de l’année est ${yv} (${funNw(ys?"lui-même":esc(funNm(y.r[1])))}, contre ${esc(funTm(y.r[3]))})`;c.ysc=1}}
  return t+(c.sc==="y"||c.ysc?`<small>${c.ysc?"record de l’année : ":""}parmi les joueurs des Worlds dans les compétitions suivies</small>`:"");
}
function funRecDet(c){
  const F=funFu(),r=c.r,n=(F&&F.n)||{},lg=FUN_LG[r[5]]||r[5]||"",day=funDay(r[6]);
  let a;
  if(c.kind==="court")a=`Record : ${esc(funTm(r[2]))} contre ${esc(funTm(r[3]))} en ${funMS(r[0])} de jeu (${r[7]} kills à ${r[8]}), ${funDot(esc(day))}`;
  else if(c.kind==="sang")a=`Record : ${esc(funTm(r[2]))} – ${esc(funTm(r[3]))}, ${r[0]} kills (${r[7]} à ${r[8]}), ${funDot(esc(day))}`;
  else a=`Record : ${esc(funNm(r[1]))} (${esc(funTm(r[2]))}), ${r[7]}/${r[8]}/${r[9]} sur ${esc(r[4]||"?")} contre ${esc(funTm(r[3]))}, ${esc(lg)}, ${esc(day)}`
    +(c.kind==="csm"?`, ${fx2(r[0])} CS par minute.`:c.kind==="ds"?`, ${String(Math.round(r[0]*1000)/10).replace(".",",")} % des dégâts de son équipe.`:"");
  a=funDot(a);
  const how=c.sc==="w"?`Meilleure marque sur les ${n.w||"?"} parties des Worlds 2026 au flux complet.`
    :`Meilleure marque sur ${amNf(n.y||0)} lignes joueur-partie de 2026 : les titulaires des équipes des Worlds, dans les compétitions suivies (LCK, LPL, LEC, LCS, CBLOL, LCP, VCS, PCS et les tournois internationaux). Un joueur hors Worlds ou une compétition non suivie peut avoir fait mieux.`;
  const ex=c.kind==="csm"?" CS par minute : temps de jeu mesuré, parties d’au moins 20 min ; en direct, durée estimée.":c.kind==="ds"?" Part des dégâts infligés aux champions par l’équipe.":"";
  return `<p>${a}</p><p>${how}${ex} En direct : chiffres du flux officiel, environ 30 s de décalage.</p>`;
}
function funRecHTML(m,where){
  const L=LV.games[m.key];if(!L||!L.frame||(L.status!=="live"&&L.status!=="ended"))return"";   // pas pendant la pause entre deux parties
  const C=funRecCands(L);if(!C.length)return"";
  const c=C.sort((a,b)=>funRank(b)-funRank(a))[0];
  if(c.sc==="w"&&(c.beat||c.tie)&&c.who)c.y=C.find(x=>x.sc==="y"&&x.kind===c.kind&&x.who&&x.who.n===c.who.n&&!x.beat&&!x.tie)||null;
  const id=("fnrec_"+where+"_"+c.kind+c.sc+"_"+(c.who?c.who.n:"")).replace(/[^\w-]/g,"");   // une nouvelle ligne arrive repliée
  return `<details class="fnrec${c.beat||c.tie?" beat":""}" data-uo="${id}"${amO(id)}><summary><span>${funRecTxt(c,L)}</span></summary><div class="fnrd">${funRecDet(c)}</div></details>`;
}
/* ---- v13.5 l.4313-4381 : fun : podium des joueurs de la soirée (funFromRobot, funFromFeed, funEveLines, funFetch, funPodium, funWhy) ; cache w26_fun_eve (liste home) ---- */
// une ligne par joueur et par partie : {k clé ou null, n nom, tm équipe, op adversaire, r poste, c champion, K, D, A, cs, mn, ds, gd, w}
function funFromRobot(g){
  const [mid,num,,b,r,ws,mn,,rows]=g;
  return (rows||[]).map((x,i)=>{const sd=i<5?0:1,k=PLAYERS.some(p=>p.key===x[0])?x[0]:null;
    return {k,n:k?funNm(k):String(x[0]||"?"),tm:sd?r:b,op:sd?b:r,r:x[1],c:x[2],K:x[3],D:x[4],A:x[5],cs:x[6],mn,ds:x[7]==null?null:x[7]/1000,gd:x[8],w:ws===sd,g:num}});
}
function funFromFeed(D){
  const out=[];
  (D&&D.games||[]).forEach(x=>{if(x.none||x.err||!x.b||!x.r)return;
    [[x.b,x.r],[x.r,x.b]].forEach(([s,o])=>(s.p||[]).forEach((pp,j)=>{const pl=playerFromSummoner(pp.sn,s.our);
      out.push({k:pl?pl.key:null,n:pl?pl.id:String(pp.sn||"").split(" ").slice(1).join(" ")||pp.sn||"?",tm:s.our,op:o.our,r:ROLE_ORDER[j]||"",c:CH&&CH.nm?CH.nm[pp.c]||pp.c:pp.c,
        K:pp.k,D:pp.d,A:pp.a,cs:pp.cs,mn:x.mins,ds:pp.ds==null?null:pp.ds,gd:null,w:x.win===s.id,g:x.num})}))});
  return out;
}
const funEveM=dk=>MATCHES.filter(x=>x.t1&&x.t2&&x.winner&&!x.manual&&/^le\d/.test(x.id)&&dayKeyL(new Date(x.start))===dk);
const funNG=m=>Math.max(1,(m.s1||0)+(m.s2||0));
/* lignes de la soirée ; miss = matchs sans données (ni robot ni feuille gardée) */
function funEveLines(dk){
  const G=(funFu()&&funFu().g)||{},C=LS.get("fun_eve",{}),mc=(C.dk===dk&&C.m)||{},lines=[],miss=[];
  funEveM(dk).forEach(m=>{const mid=String(m.id).slice(2),n=funNG(m),rg=Object.values(G).filter(g=>g[0]===mid);
    if(rg.length>=n){rg.forEach(g=>funFromRobot(g).forEach(x=>lines.push(x)));return}
    const ak=LS.get("ak_games_"+m.key+"_"+n,null),ok=D=>D&&D.games&&D.games.filter(x=>!x.none&&!x.err).length>=n;
    if(ak&&ok(ak.d)){funFromFeed(ak.d).forEach(x=>lines.push(x));return}
    const c=mc[m.key+"_"+n];if(c){c.forEach(x=>lines.push(x));return}
    miss.push(m)});
  return {lines,miss};
}
/* feuilles manquantes : lues une fois (flux officiel, comme la feuille de match), gardées sur le téléphone, puis l'accueil est redessiné */
async function funFetch(dk,miss){
  if(FUN.busy[dk]||Date.now()-(FUN.fail[dk]||0)<180e3)return;FUN.busy[dk]=1;let got=0;
  try{for(const m of miss){const n=funNG(m);let D=null;try{D=await matchGames(m)}catch(e){D=null}
      if(!D){FUN.fail[dk]=Date.now();break}                                      // flux injoignable : on réessaiera dans 3 min
      if(D.nocache||(D.games||[]).filter(x=>!x.none&&!x.err).length<n){FUN.fail[dk]=Date.now();continue}   // pas encore publié
      const C=LS.get("fun_eve",{}),c=C.dk===dk?C:{dk,m:{}};c.m[m.key+"_"+n]=funFromFeed(D);LS.set("fun_eve",c);got++}}
  finally{delete FUN.busy[dk]}
  if(got){renderHome();refreshSheet()}
}
const FUN_W={kda:.35,k:.25,ds:.2,csm:.1,gd:.1},FUN_FL={kda:1.5,k:2,ds:.04,csm:.6,gd:500};
function funPodium(lines){
  if(lines.length<10)return [];
  const V=x=>({kda:Math.min(20,(x.K+x.A)/Math.max(1,x.D)),k:x.K,ds:x.ds,csm:/^(TOP|MID|BOT)$/.test(x.r)&&x.mn>=15?x.cs/x.mn:null,gd:x.gd}),vals=lines.map(V),st={};
  Object.keys(FUN_W).forEach(m=>{const a=vals.map(v=>v[m]).filter(v=>v!=null&&isFinite(v)),mu=a.reduce((s,v)=>s+v,0)/Math.max(1,a.length);
    st[m]={mu,sd:Math.max(FUN_FL[m],Math.sqrt(a.reduce((s,v)=>s+(v-mu)**2,0)/Math.max(1,a.length)))}});
  const best=new Map();
  lines.forEach((x,i)=>{const z={};let s=x.w?.3:0;
    Object.keys(FUN_W).forEach(m=>{const v=vals[i][m];z[m]=v==null||!isFinite(v)?null:(v-st[m].mu)/st[m].sd;if(z[m]!=null)s+=FUN_W[m]*z[m]});
    const id=x.k||x.tm+"|"+x.n,o={x,v:vals[i],z,s},b=best.get(id);if(!b||s>b.s)best.set(id,o)});
  return [...best.values()].sort((a,b)=>b.s-a.s).slice(0,3).map(o=>{const m=Object.keys(FUN_W).filter(m=>o.z[m]!=null).sort((a,b)=>o.z[b]-o.z[a])[0]||"kda";o.why=m;return o});
}
function funWhy(o,long){
  const x=o.x,v=o.v,kda=`${x.K}/${x.D}/${x.A}`;
  if(!long)return o.why==="ds"?funPc(v.ds)+" des dégâts":o.why==="csm"?fx1(v.csm)+" CS/min":o.why==="gd"?`+${fx1(v.gd/1000)} k à 15 min`:kda;
  const it=[[kda,o.why==="kda"||o.why==="k"]];
  if(v.ds!=null)it.push([funPc(v.ds)+" des dégâts de son équipe",o.why==="ds"]);
  if(v.csm!=null)it.push([fx1(v.csm)+" CS par minute",o.why==="csm"]);
  if(v.gd!=null)it.push([(v.gd>=0?"+":"−")+fx1(Math.abs(v.gd)/1000)+" k d’or sur son vis-à-vis à 15 min",o.why==="gd"]);
  return it.map(([t,b])=>b?`<b>${esc(t)}</b>`:esc(t)).join(", ");
}
function funPodHTML(dk){
  const E=funEveLines(dk);
  if(E.miss.length){funFetch(dk,E.miss);return""}
  const P=funPodium(E.lines);if(P.length<3)return"";
  const games=Math.round(E.lines.length/10);
  const cell=(o,i)=>`<span class="fnpc p${i+1}"><i>${i+1}</i><b>${esc(o.x.n)}</b><small>${funWhy(o)}</small></span>`;
  const line=(o,i)=>{const x=o.x,nm=x.k?`<button data-p="${esc(x.k)}">${esc(x.n)}</button>`:`<b>${esc(x.n)}</b>`;
    return `<p><i class="fnpn">${i+1}</i>${nm} (${esc(funTm(x.tm))}), ${esc(x.c||"?")} contre ${esc(funTm(x.op))} : ${funWhy(o,true)}. ${x.w?"Victoire":"Défaite"}.</p>`};
  return `<details class="fnpod frame hx" data-uo="fnpod"${amO("fnpod")}><summary><b>Podium des joueurs</b><span class="fnp3">${P.map(cell).join("")}</span></summary>
    <div class="fnpd">${P.map(line).join("")}<p class="small">Meilleure partie de chaque joueur ce soir (${games} partie${games>1?"s":""}), notée sur le KDA, les kills, la part des dégâts, le CS par minute et l’avance d’or à 15 min, comparés aux autres joueurs de la soirée ; petit bonus pour la victoire. En gras, ce qui le distingue le plus.</p></div></details>`;
}
/* ---- v13.5 l.4384-4406 : ligue : badges (Flair, Bat le robot, Audacieux, Devin, Série), calcul seul (liste league) ---- */
function funBadges(){
  if(!lg||!Object.keys(lg.players).length)return null;
  const all=members(),done=MATCHES.filter(m=>m.winner&&!m.manual&&m.t1&&m.t2).sort((a,b)=>a.start<b.start?-1:a.start>b.start?1:0),bot=all.find(u=>u.bot),F={};
  ((SJ&&SJ.fiab&&SJ.fiab.w26&&SJ.fiab.w26.m)||[]).forEach(r=>{F["le"+r[0]]=r});
  const tid=c=>T[c]?c:(typeof resolveTeam==="function"?resolveTeam(c,c):null),out={};
  all.forEach(u=>{const B=[],seq=done.filter(m=>u.p[m.key]),ok=m=>pts(u.p[m.key].w,u.p[m.key].sc,m);
    // Flair : pari gagné sur l'outsider du robot (son prono figé avant le match)
    if(!u.bot){const fl=[];seq.forEach(m=>{const r=F[m.id],w=u.p[m.key].w;if(!r||w!==m.winner)return;const p=tid(r[2])===w?r[5]:tid(r[3])===w?1-r[5]:null;if(p!=null&&p<.5)fl.push({m,p})});
      if(fl.length)B.push({id:"flair",lab:"Flair",n:fl.length,t:1,L:fl.sort((a,b)=>a.p-b.p)})}
    // Contre le robot : plus de points que lui sur une soirée (matchs pariés par les deux, 2 au moins)
    if(!u.bot&&bot){const E={};done.forEach(m=>{const a=u.p[m.key],b=bot.p[m.key];if(!a||!b)return;const dk=dayKeyL(new Date(m.start)),e=E[dk]||(E[dk]={dk,me:0,bo:0,n:0,t:m.start});e.me+=pts(a.w,a.sc,m);e.bo+=pts(b.w,b.sc,m);e.n++});
      const won=Object.values(E).filter(e=>e.n>=2&&e.me>e.bo);if(won.length)B.push({id:"robot",lab:"Bat le robot",n:won.length,t:1,L:won})}
    // Audacieux : pari gagné contre la majorité (au moins 3 parieurs, au plus un tiers de bons ; même règle que standings)
    if(!u.bot){const au=seq.filter(m=>{const bt=all.filter(x=>x.p[m.key]);if(bt.length<3||u.p[m.key].w!==m.winner)return false;const g=bt.filter(x=>x.p[m.key].w===m.winner).length;return g<=bt.length/3});
      if(au.length)B.push({id:"auda",lab:"Audacieux",n:au.length,L:au})}
    // Devin : score exact
    const ex=seq.filter(m=>ok(m)>1);if(ex.length)B.push({id:"devin",lab:"Devin",n:ex.length,L:ex});
    // Série : 3 bons paris d'affilée ou plus (meilleure série)
    let run=0,best=0,s0=null,bs=null,be=null;seq.forEach(m=>{if(ok(m)>0){if(!run)s0=m;run++;if(run>=best){best=run;bs=s0;be=m}}else run=0});
    if(best>=3)B.push({id:"serie",lab:"Série",n:best,cur:run===best,a:bs,b:be});
    out[u.id]=B});
  return out;
}
/* ---- v13.5 l.4467-4473 : flux direct : fenêtres, matchs en cours (liste match) ---- */
const FEED="https://feed.lolesports.com/livestats/v1/";
const LV={live:[],liveT:0,games:{},timer:0,watch:null};
const tsISO=ms=>new Date(Math.floor(ms/10000)*10000).toISOString().replace(/\.\d{3}Z$/,".000Z");
async function feedWin(gid,start){
  const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),8000);
  try{const r=await fetch(FEED+"window/"+gid+(start?"?startingTime="+tsISO(start):""),{signal:ctl.signal});if(r.status===204)return null;if(!r.ok)throw new Error(r.status);return await r.json()}finally{clearTimeout(to)}
}
/* ---- v13.5 l.4480-4485 : flux direct : joueur d'après son pseudo, mesures d'écart d'or (pushSample) (liste match) ---- */
function playerFromSummoner(sn,team){
  const parts=String(sn||"").trim().split(/\s+/),cands=[norm(parts.slice(1).join(" ")),norm(parts.join(" ")),norm(parts[parts.length-1])].filter(Boolean);
  for(const tok of cands){const p=PLAYERS.find(p=>p.team===team&&norm(p.id)===tok)||PLAYERS.find(p=>norm(p.id)===tok);if(p)return p}
  return null;
}
function pushSample(L,f){if(!L.first)return;const t=(Date.parse(f.rfc460Timestamp)-L.first)/60000;if(t<0)return;const gd=f.blueTeam.totalGold-f.redTeam.totalGold;const last=L.samples[L.samples.length-1];if(!last||t-last.t>=.15)L.samples.push({t,gd})}
/* ---- v13.5 l.4520-4628 : live2 : fights, duels marquants, bascule, joueur du match, tableau (calculs) (liste match) ---- */
const L2R={top:"TOP",jungle:"JGL",mid:"MID",bottom:"BOT",support:"SUP"};
const l2k=v=>fx1(Math.abs(v)/1000)+" k";
const l2pc=v=>Math.round(v*100)+" %";
const l2sd=n=>n?amTid(n):"";
const l2Safe=(fn,...a)=>{try{return fn(...a)}catch(e){console.warn("live2",e);return""}};
/* flux détaillé (part des dégâts, balises, objets) : lu depuis le rendu du direct, donc seulement quand le direct est affiché,
   onglet visible, au plus une fois toutes les 30 s ; fenêtre de 10 s finissant à l'image courante (déjà servie par le flux,
   donc jamais refusée même si l'horloge du téléphone avance) ; on garde la dernière image */
function l2Det(L,m){try{
  const f=L.frame,gid=L.gid;if(!f||!gid||document.hidden||typeof feedDetails!=="function")return;
  const D=L.l2d&&L.l2d.gid===gid?L.l2d:(L.l2d={gid,t:0,busy:false,f:null});
  if(D.busy||Date.now()-D.t<30000)return;
  D.busy=true;D.t=Date.now();const first=!D.f;
  feedDetails(gid,Date.parse(f.rfc460Timestamp)-10000).then(j=>{const fr=j&&j.frames;if(fr&&fr.length&&L.l2d===D)D.f=fr[fr.length-1]})
    .catch(()=>{}).finally(()=>{D.busy=false;if(first&&D.f&&L.l2d===D&&typeof paintLive==="function")paintLive(m)});
}catch(e){console.warn("live2 details",e)}}
/* état de la partie ; joueurs (nom, poste, champion) lus une fois par partie dans L.meta */
function l2St(L){
  if(!L.l2||L.l2.gid!==L.gid)L.l2={gid:L.gid,id:null,lanes:[],pog:null,bs:null};
  const S=L.l2,md=L.meta;
  if(!S.id&&md){const id={};
    [[md.blueTeamMetadata,L.blue,0],[md.redTeamMetadata,L.red,1]].forEach(([tm,our,side])=>((tm&&tm.participantMetadata)||[]).forEach((pm,j)=>{
      const pl=playerFromSummoner(pm.summonerName,our);
      id[pm.participantId]={pid:pm.participantId,side,team:our,role:L2R[pm.role]||ROLE_ORDER[j],pl,c:pm.championId,
        n:pl?pl.id:String(pm.summonerName||"").split(" ").slice(1).join(" ")||pm.summonerName||"?"}}));
    if(Object.keys(id).length===10)S.id=id}
  return S;
}
/* les 10 joueurs avec leurs chiffres : image courante (s) et, si lue, dernière image détaillée (dd) */
function l2Rows(L){const S=l2St(L),f=L.frame;if(!S.id||!f)return null;
  const D=L.l2d&&L.l2d.gid===L.gid&&L.l2d.f,dp=D?D.participants||[]:[];
  const P=[...(f.blueTeam.participants||[]),...(f.redTeam.participants||[])],R=P.map(s=>S.id[s.participantId]?Object.assign({s,dd:dp.find(x=>x.participantId===s.participantId)||null},S.id[s.participantId]):null).filter(Boolean);
  return R.length===10?R:null}
/* vainqueur d'une partie finie : le camp qui a détruit le plus de tours et d'inhibiteurs (tours du Nexus comprises) */
function l2Win(f){const b=f.blueTeam,r=f.redTeam,x=(b.towers||0)+(b.inhibitors||0)-(r.towers||0)-(r.inhibitors||0);return x>0?0:x<0?1:null}

/* ---- les fights : kills du fil du match espacés de moins de 20 s, 2 kills au moins ---- */
function l2Fights(L){const K=L.kf;if(!K||!K.ev||!K.ev.length)return [];const out=[];let cur=null;
  for(const e of K.ev){if(e.k!=="kill")continue;
    if(cur&&e.ms-cur.ms1<20000){cur.e.push(e);cur.ms1=e.ms}else out.push(cur={e:[e],ms0:e.ms,ms1:e.ms,t0:e.t})}
  return out.filter(x=>x.e.length>=2).map(x=>{const n=[0,0];x.e.forEach(e=>n[e.a>=0?(e.a<5?0:1):(e.v<5?1:0)]++);x.n=n;return x})}
/* écart d'or (bleu − rouge) mesuré par le direct juste avant / juste après un instant du flux (null si pas de mesure proche) */
function l2Gd(L,ms,dir){const S=L.samples;if(!L.first||!S||!S.length)return null;let best=null;
  for(const s of S){const t=L.first+s.t*60000;if(dir<0?(t<=ms-1000&&ms-t<=45000):(t>=ms+3000&&t-ms<=60000))if(!best||(dir<0?t>best.t:t<best.t))best={t,gd:s.gd}}
  return best}
const l2Side=(L,s)=>s?L.red:L.blue;
function l2FightTxt(L,x){const w=x.n[0]>x.n[1]?0:x.n[1]>x.n[0]?1:-1;
  return w<0?`égalité ${x.n[0]} à ${x.n[1]}`:`<b>${l2sd(l2Side(L,w))}</b> gagne ${x.n[w]} à ${x.n[1-w]}`}

/* ---- les duels : écart d'or entre vis-à-vis, comparé au modèle de lane ramené au temps de jeu ---- */
function l2Lanes(R,t){
  const Ln=SJ&&SJ.lane,k=t/15,ks=Math.max(k,Math.sqrt(k));
  return ROLE_ORDER.map(r=>{const a=R.find(x=>x.side===0&&x.role===r),b=R.find(x=>x.side===1&&x.role===r);if(!a||!b)return null;
    const ld=a.pl&&b.pl?amFn(typeof laneDuel==="function"?laneDuel:null,a.pl.key,b.pl.key,r,false):null;
    const A=ld&&Ln.p[a.pl.key],B=ld&&Ln.p[b.pl.key],g=Ln&&Ln.sg&&Ln.sg[r];
    const d=(a.s.totalGold||0)-(b.s.totalGold||0),x=ld?ld.e*k:0,sd=Math.sqrt((g?g[0]:800)**2+(A?A[3]**2:0)+(B?B[3]**2:0))*ks;
    const up=d>=0,dl=Math.abs(d),z=(dl-(up?x:-x))/sd,pw=ld?(up?ld.p:1-ld.p):null;
    // « inattendu » : celui qui mène n'était pas attendu devant (ou duel annoncé serré) et mène nettement au-delà du prévu
    const tag=dl<300||pw==null?"":(pw<.45&&z>=1)||(pw<.55&&z>=1.5)?"inattendu":pw>=.55?(z>=1.5?"plus que prévu":z>=-1?"comme prévu":""):"";
    return {r,a,b,d,x,ld,w:up?a:b,l:up?b:a,dl,tag,sc:(dl+Math.abs(d-x))/sd}});
}
/* lanes du niveau 1 : les 2 plus marquantes (écart et surprise) parmi celles à 0,5 k d'or ou plus ; celles déjà affichées
   gardent l'avantage (seuil de sortie à 0,4 k, bonus de 25 %) ; affichées dans l'ordre des postes, jamais re-triées */
function l2Pick(S,lanes){const pv=S.lanes||[],was=r=>pv.includes(r);
  const c=lanes.filter(l=>l&&l.dl>=(was(l.r)?400:500)).map(l=>({l,v:l.sc*(was(l.r)?1.25:1)})).sort((p,q)=>q.v-p.v);
  const sel=c.slice(0,2);
  S.lanes=sel.map(x=>x.l.r);return lanes.filter(l=>l&&S.lanes.includes(l.r))}
const l2Verb=(dl,t)=>{const v=dl*15/Math.max(t,5);return v>=1600?"surclasse":v>=900?"domine":"devance"};
const l2Tag=t=>t?`, <span class="l2tg${t==="inattendu"?" l2tx":t==="plus que prévu"?" l2tp":""}">${t}</span>`:"";

/* ---- joueur du match : 3 points par kill, 2 par assistance, −3 par mort, + la moitié de sa part de l'or de l'équipe (en %),
   + la moitié de sa part des dégâts de l'équipe (en %, quand le flux détaillé est lu). Au moins un kill ou une assistance. ---- */
function l2Score(x,f){const s=x.s,tg=(x.side?f.redTeam:f.blueTeam).totalGold||0,g=tg>0?Math.round((s.totalGold||0)/tg*100):0;
  const dm=x.dd&&typeof x.dd.championDamageShare==="number"?Math.round(x.dd.championDamageShare*100):null;
  const k=3*(s.kills||0),a=2*(s.assists||0),d=3*(s.deaths||0),go=Math.round(g/2),dmo=dm==null?0:Math.round(dm/2);
  return {k,a,d,g,go,dm,dmo,v:k+a-d+go+dmo}}
function l2Pog(L,R,f,fin){const S=L.l2,ws=fin?l2Win(f):null,key=x=>x.pl?x.pl.key:x.side+x.n;
  const el=R.filter(x=>(x.s.kills||0)+(x.s.assists||0)>0),pool=(el.length?el:R).filter(x=>ws==null||x.side===ws).map(x=>Object.assign({},x,{sc:l2Score(x,f)}));
  if(!pool.length)return null;
  pool.sort((p,q)=>q.sc.v-p.sc.v||(p.s.deaths||0)-(q.s.deaths||0)||(q.s.totalGold||0)-(p.s.totalGold||0));
  let top=pool[0];
  // en cours de partie, le premier ne change que s'il est dépassé d'au moins 3 points (un kill)
  if(!fin&&S.pog){const inc=pool.find(x=>key(x)===S.pog);if(inc&&top.sc.v-inc.sc.v<3)top=inc}
  S.pog=key(top);return {top,rest:pool.filter(x=>x!==top).slice(0,2),ws}}
const l2Kda=s=>`${s.kills||0}/${s.deaths||0}/${s.assists||0}`;

/* ---- le match bascule ? prono du robot pour cette partie (P(bleu)) : celui affiché dans « Draft » (avant / après) ---- */
function l2Pre(L,m){const bl=L.blue,D=L.amd&&!L.amd.err&&L.amd.blue===bl?L.amd:null,lgt=x=>{const q=Math.min(.999,Math.max(.001,x));return Math.log(q/(1-q))};
  const rp=m&&m.bo===1&&(bl===m.t1||bl===m.t2)?amFn(typeof robotProb==="function"?robotProb:null,m):null;
  const pE=rp!=null?(bl===m.t1?rp:1-rp):D&&D.pE!=null?D.pE:amFn(typeof gameProbE==="function"?gameProbE:null,L.blue,L.red);
  const pD=pE!=null&&D&&D.p!=null&&D.pE!=null?sigm(lgt(pE)+lgt(D.p)-lgt(D.pE)):null;
  return {pE,pD}}
/* état : « s » l'outsider du robot mène (60 % ou plus ; sortie sous 55 %), « e » le favori a perdu 25 points (sortie sous 20),
   « w » partie finie gagnée par l'outsider. Rien si le robot voyait un match serré (moins de 55 %) ni avant 5 min. */
function l2Bas(L,m,t,fin,f){const S=L.l2,P=l2Pre(L,m),pE=P.pE;if(pE==null)return null;
  const fb=pE>=.5?0:1,pf=Math.max(pE,1-pE),o={fb,pf,pD:P.pD==null?null:fb?1-P.pD:P.pD,fav:fb?L.red:L.blue,und:fb?L.blue:L.red};
  if(pf<.55){S.bs=null;return null}
  if(fin){const ws=l2Win(f);S.bs=ws!=null&&ws!==fb?"w":null;return S.bs?Object.assign(o,{k:"w"}):null}
  if(t<5)return null;
  const pl=winProb(f,t),lf=fb?1-pl:pl;
  const k=lf<=.40||(S.bs==="s"&&lf<=.45)?"s":pf-lf>=.25||(S.bs&&pf-lf>=.20)?"e":null;
  S.bs=k;return k?Object.assign(o,{k,lf}):null}

/* ---- kills avec le jungler avant 15 min (à la place des ganks, que le flux ne donne pas) : kills de l'équipe où son jungler
   a tué ou aidé, avant 15:00 de jeu ; seulement si le fil est lu sans trou jusque-là (sinon null) ---- */
function l2Jg(L,R){const K=L.kf;if(!K||!K.orgOk)return null;
  if(K.ev.some(e=>e.k==="gap"&&e.t<900))return null;
  const jg=[0,1].map(s=>{const x=R.find(y=>y.side===s&&y.role==="JGL");return x?x.pid-1:-1});if(jg.some(i=>i<0))return null;
  const n=[0,0];K.ev.forEach(e=>{if(e.k!=="kill"||e.t>=900||e.a<0)return;const s=e.a<5?0:1;if(e.a===jg[s]||(e.as||[]).includes(jg[s]))n[s]++});return n}
/* ---- v13.5 l.4869-4879 : chances de victoire, temps de jeu, dragons (liste match) ---- */
function winProb(f,mins){
  const b=f.blueTeam,r=f.redTeam,db=(b.dragons||[]).length,dr=(r.dragons||[]).length;
  const tf=Math.pow(20/Math.max(20,mins),.35);
  const z=.34*((b.totalGold-r.totalGold)/1000)*tf+.10*(b.towers-r.towers)+.55*(b.inhibitors-r.inhibitors)+.45*(b.barons-r.barons)+.14*(db-dr)+.02*(b.totalKills-r.totalKills)+(db>=4?.7:0)-(dr>=4?.7:0);
  return 1/(1+Math.exp(-z));
}
function gameMins(L){const f=L.frame;if(!f)return 0;const fromGold=Math.max(0,((f.blueTeam.totalGold+f.redTeam.totalGold)/2-2500)/1950+1.5);
  const kc=kfMins(L);if(kc!=null&&Math.abs(kc-fromGold)<8)return kc;
  if(L.first){const m=(Date.parse(f.rfc460Timestamp)-L.first)/60000;if(m>=0&&Math.abs(m-fromGold)<8)return m}return fromGold}
const gtime=L=>{if(!L.frame)return"";const s=Math.round(gameMins(L)*60);return (kfExact(L,Date.parse(L.frame.rfc460Timestamp))&&kfMins(L)===gameMins(L)?"":"≈ ")+Math.floor(s/60)+":"+String(s%60).padStart(2,"0")};
const DRAG={ocean:"#3BA3D9",infernal:"#E8603C",mountain:"#B08A5A",cloud:"#BFD6E6",hextech:"#3BC7C0",chemtech:"#9BD13B",elder:"#F0E6D2"};
/* ---- v13.5 l.4933-5029 : fil du match (différence d'images du flux) (liste match) ---- */
const KF_DR={ocean:"Océan",infernal:"Infernal",mountain:"Montagne",cloud:"Nuages",hextech:"Hextech",chemtech:"Chimtech",elder:"Ancestral"};
const KF_BUDGET=48, KF_PAR=6;   // fenêtres par passage, requêtes en parallèle
const kf10=ms=>Math.floor(ms/1e4)*1e4;
// image compacte : heure, pause, compteurs (K/D/A/niveau ×10, puis tours/inhibiteurs/Barons bleus et rouges), dragons, or
function kfC(f){
  const P=[...(f.blueTeam.participants||[]),...(f.redTeam.participants||[])].sort((a,b)=>a.participantId-b.participantId);
  if(P.length!==10)return null;
  const B=f.blueTeam,R=f.redTeam;
  return {t:Date.parse(f.rfc460Timestamp),p:f.gameState==="paused"?1:0,c:P.flatMap(x=>[x.kills,x.deaths,x.assists,x.level]),
    o:[B.towers,B.inhibitors,B.barons,R.towers,R.inhibitors,R.barons],d:[(B.dragons||[]).slice(),(R.dragons||[]).slice()],g:B.totalGold+R.totalGold>0?1:0,gd:B.totalGold-R.totalGold};
}
const kfSig=x=>x.c.join()+"|"+x.o.join()+"|"+x.d[0].length+","+x.d[1].length+"|"+x.g+x.p;
const kfBack=(a,b)=>b.c.some((v,i)=>v<a.c[i])||b.o.some((v,i)=>v<a.o[i])||b.d[0].length<a.d[0].length||b.d[1].length<a.d[1].length;
function kfReset(L){L.kf={gid:L.gid,fr:[],got:new Set(),org:null,orgOk:false,ev:[],pz:[],seen:new Set(),open:false,busy:false,n:0,err:0}}
/* images reçues (fenêtre commençant à ws ; ws=null pour la première fenêtre de la partie, sans startingTime) */
function kfFeed(L,frames,ws){
  if(!L.gid||!frames||!frames.length)return;
  if(!L.kf||L.kf.gid!==L.gid)kfReset(L);
  const K=L.kf,nw=frames.map(kfC).filter(Boolean);
  // première fenêtre de la partie : elle ne couvre que ses propres images, aucune tranche de 10 s entière
  if(ws==null)K.t0=nw.length?nw[0].t:null;
  else K.got.add(kf10(ws));
  // tri par l'heure (pas par le texte : « …:06Z » sans millisecondes passerait après « …:06.900Z »), doublons et reculs écartés
  const all=[...K.fr,...nw].sort((a,b)=>a.t-b.t),fr=[];
  for(const x of all){const l=fr[fr.length-1];if(l&&(x.t===l.t||kfBack(l,x)))continue;fr.push(x)}
  // compaction : on garde les images où quelque chose change, leurs voisines, et une toutes les 4 s (pour voir les silences)
  const keep=[];
  for(let i=0;i<fr.length;i++){const l=keep[keep.length-1],x=fr[i],nx=fr[i+1];
    if(!l||kfSig(l)!==kfSig(x)||!nx||kfSig(nx)!==kfSig(x)||x.t-l.t>=4000)keep.push(x)}
  K.fr=keep;if(!kfFeed.hold)kfDerive(L);
}
const kfCov=(K,a,b)=>{for(let k=kf10(a);k<=kf10(b);k+=1e4)if(!K.got.has(k))return false;return true};
/* origine, pauses, événements */
function kfDerive(L){
  const K=L.kf,F=K.fr;
  const i0=F.findIndex(x=>x.g);
  if(i0>=0){K.org=F[i0].t;K.orgOk=(K.t0!=null&&F[i0].t===K.t0)||(i0>0&&kfCov(K,F[i0-1].t,F[i0].t))}
  // pause : image « paused » jusqu'à la reprise, ou silence de plus de 20 s dans une zone entièrement lue
  const pz=[];
  for(let i=0;i+1<F.length;i++){const a=F[i],b=F[i+1];if(!a.g)continue;
    if(a.p&&!(i&&F[i-1].p)){let j=i+1;while(j<F.length&&F[j].p)j++;if(j<F.length&&F[j].t-a.t>=3000)pz.push([a.t,F[j].t])}
    else if(!a.p&&!b.p&&b.t-a.t>2e4&&kfCov(K,a.t,b.t))pz.push([a.t,b.t])}
  K.pz=pz;
  // heure sûre jusqu'au premier intervalle non lu de plus de 30 s (une pause peut s'y cacher)
  K.xu=-Infinity;
  if(K.orgOk){K.xu=Infinity;for(let i=0;i+1<F.length;i++)if(F[i+1].t-F[i].t>3e4&&!kfCov(K,F[i].t,F[i+1].t)){K.xu=F[i].t;break}}
  const ev=[];
  for(let i=0;i+1<F.length;i++){const a=F[i],b=F[i+1];if(kfSig(a)===kfSig(b)||!b.g)continue;
    const ok=kfCov(K,a.t,b.t),t=kfClock(L,b.t);
    const dk=[],dd=[],da=[];for(let p=0;p<10;p++){dk.push(b.c[4*p]-a.c[4*p]);dd.push(b.c[4*p+1]-a.c[4*p+1]);da.push(b.c[4*p+2]-a.c[4*p+2])}
    const nd=[b.d[0].slice(a.d[0].length),b.d[1].slice(a.d[1].length)],no=b.o.map((v,j)=>v-a.o[j]);
    if(!ok){   // zone pas encore lue image par image : bilan groupé, précisé au passage suivant
      const kl=[0,1].map(s=>dk.slice(5*s,5*s+5).reduce((x,y)=>x+y,0));
      if(kl[0]+kl[1]+nd[0].length+nd[1].length+no.reduce((x,y)=>x+y,0)>0)ev.push({k:"gap",t:kfClock(L,a.t),t1:t,kl,nd,no,ms:b.t});continue}
    const first=a.c.filter((v,j)=>j%4===1).reduce((x,y)=>x+y,0)===0,used=new Set();
    for(let v=0;v<10;v++)for(let n=0;n<dd[v];n++){
      const foe=p=>(p<5)!==(v<5);let k=-1;for(let p=0;p<10;p++)if(foe(p)&&dk[p]>0&&!used.has(p)){k=p;break}
      if(k>=0)used.add(k);
      ev.push({k:"kill",t,a:k,v,as:[...Array(10).keys()].filter(p=>foe(p)&&da[p]>0&&p!==k),fb:first&&ev.every(e=>e.k!=="kill"||e.ms!==b.t),ms:b.t})}
    for(const s of [0,1]){
      nd[s].forEach((ty,j)=>{const n=a.d[s].length+j+1,el=b.d[s].slice(0,n).filter(x=>x!=="elder");
        ev.push({k:"drag",t,s,ty,ms:b.t});if(ty!=="elder"&&el.length===4)ev.push({k:"soul",t,s,ty,ms:b.t})});
      if(no[3*s]>0)ev.push({k:"tower",t,s,n:no[3*s],ms:b.t});
      if(no[3*s+1]>0)ev.push({k:"inhib",t,s,n:no[3*s+1],ms:b.t});
      if(no[3*s+2]>0)ev.push({k:"baron",t,s,ms:b.t})}
  }
  K.ev=ev;
}
/* secondes de chrono à l'instant ms du flux (null sans origine) */
function kfClock(L,ms){const K=L.kf;if(!K)return null;const o=K.orgOk?K.org:(K.t0??K.org);if(o==null)return null;let s=(ms-o)/1000;
  for(const [a,b] of K.pz)if(a<ms)s-=(Math.min(b,ms)-a)/1000;return Math.max(0,Math.floor(s+.1))}
/* horloge sûre : origine trouvée et toute la partie lue jusqu'à ms (sinon une pause peut manquer) */
const kfExact=(L,ms)=>!!(L.kf&&ms<=L.kf.xu);
const kfMins=L=>{const c=L.kf&&L.frame?kfClock(L,Date.parse(L.frame.rfc460Timestamp)):null;return c==null?null:c/60};
/* fenêtres à lire : intervalles pas entièrement lus où un compteur change, ou de plus de 30 s (pause possible) ;
   celui où l'or devient non nul (origine) d'abord, puis les plus récents */
function kfTodo(L,max){
  const K=L.kf,F=K.fr,out=[],i0=F.findIndex(x=>x.g),ord=[];
  if(i0>0&&!K.orgOk)ord.push(i0-1);
  for(let i=F.length-2;i>=0;i--)if(i!==i0-1||K.orgOk)ord.push(i);
  for(const i of ord){if(out.length>=max)break;const a=F[i],b=F[i+1];
    if(kfCov(K,a.t,b.t)||(kfSig(a)===kfSig(b)&&b.t-a.t<=3e4))continue;
    const lo=kf10(a.t),hi=kf10(b.t),free=[];for(let k=lo;k<=hi;k+=1e4)if(!K.got.has(k))free.push(k);
    const n=Math.min(KF_PAR,Math.max(1,Math.ceil((b.t-a.t)/6e4)-1));
    for(let j=1;j<=n&&out.length<max;j++){const w=free[Math.min(free.length-1,Math.floor(free.length*j/(n+1)))];if(w!=null&&!out.includes(w))out.push(w)}}
  return out;
}
async function kfFill(L,gid,done){
  const K=L.kf;if(!K||K.busy||K.gid!==gid||document.hidden||(K.err>=3&&Date.now()-K.errT<6e4))return;K.busy=true;let n=0;
  try{while(n<KF_BUDGET&&L.kf===K&&L.gid===gid){
      const ws=kfTodo(L,Math.min(KF_PAR,KF_BUDGET-n));if(!ws.length)break;n+=ws.length;
      const res=await Promise.all(ws.map(w=>feedWin(gid,w).then(j=>[w,j],()=>[w,"err"])));
      kfFeed.hold=true;for(const [w,j] of res){if(j==="err"){K.err++;K.errT=Date.now();continue}K.n++;K.err=0;kfFeed(L,(j&&j.frames)||[],w);if(!(j&&j.frames&&j.frames.length))K.got.add(w)}kfFeed.hold=false;kfDerive(L);
      if(res.every(r=>r[1]==="err"))break}}
  finally{K.busy=false}
  if(n&&done)done();
}
/* ---- v13.5 l.5031-5034 : fil : affichage (kfMS, kfWho, kfTm) (liste match) ---- */
const kfMS=s=>s==null?"":Math.floor(s/60)+":"+String(s%60).padStart(2,"0");
function kfWho(L,i){const md=L.meta||{},pm=(i<5?md.blueTeamMetadata:md.redTeamMetadata)?.participantMetadata?.find(x=>x.participantId===i+1)||{};
  const pl=playerFromSummoner(pm.summonerName,i<5?L.blue:L.red);return {n:pl?pl.id:String(pm.summonerName||"").split(" ").slice(1).join(" ")||pm.summonerName||"?",c:pm.championId}}
const kfTm=(L,s)=>s?L.red:L.blue;
/* ---- v13.5 l.5062-5067 : fil : portraits, mort, âme (liste match) ---- */
function kfFace(s,cid,size){const dead=s.maxHealth>0&&s.currentHealth<s.maxHealth*.01;
  return `<span class="kfpc${dead?" dead":""}"${dead?' title="mort"':""}>${champ(cid,size)}${s.level?`<i>${s.level}</i>`:""}</span>`}
const kfDead=s=>s.maxHealth>0&&s.currentHealth<s.maxHealth*.01;
/* âme : 4e dragon élémentaire d'une équipe (l'ancestral ne compte pas) */
function kfSoul(dr){const el=(dr||[]).filter(x=>x!=="elder");return el.length>=4?el[3]:null}
const kfSoulTag=dr=>{const s=kfSoul(dr);return s?`<b class="kfso" style="--c:${DRAG[s]||"#888"}" title="Âme ${esc(KF_DR[s]||s)}">âme</b>`:""};
/* ---- v13.5 l.5072-5110 : feuille de match : flux détaillé, parties terminées lues dans le flux (matchGames, cache games_*), vainqueur de chaque partie (liste match) ---- */
async function feedDetails(gid,ms){
  const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),8000);
  try{const r=await fetch("https://feed.lolesports.com/livestats/v1/details/"+gid+"?startingTime="+tsISO(ms),{signal:ctl.signal});return r.ok?await r.json():null}catch(e){return null}finally{clearTimeout(to)}
}
async function matchGames(m){
  const j=await leFetch("getEventDetails?hl=fr-FR&id="+String(m.id).slice(2)),ev=j?.data?.event;if(!ev)throw new Error("match introuvable");
  const teams=ev.match.teams||[],wins={};teams.forEach(t=>wins[t.id]=t.result?.gameWins||0);
  const ids=Object.keys(wins),total=ids.reduce((a,t)=>a+wins[t],0),sw=ids.reduce((a,t)=>wins[t]>wins[a]?t:a,ids[0]);
  const ourOf=id=>{const t=teams.find(x=>x.id===id);return t?resolveTeam(t.code,t.name):null};
  const done=(ev.match.games||[]).filter(g=>g.state==="completed").sort((a,b)=>a.number-b.number);
  const games=await Promise.all(done.map(async g=>{
    const w0=await feedWin(g.id).catch(()=>"err");if(w0==="err")return {num:g.number,err:true};if(!w0||!w0.frames||!w0.frames.length)return {num:g.number,none:true};
    const fr=w0.frames.find(f=>f.blueTeam.totalGold>0)||w0.frames[0],start=Date.parse(fr.rfc460Timestamp);
    const tEnd=Math.min(start+6*3600e3,Date.now()-60e3);   // jamais dans le futur : le flux refuserait
    const we=await feedWin(g.id,tEnd).catch(()=>"err");if(we==="err")return {num:g.number,err:true};const fe=we&&we.frames&&we.frames[we.frames.length-1];if(!fe)return {num:g.number,none:true};
    const det=await feedDetails(g.id,tEnd),dp={};((det&&det.frames&&det.frames.length&&det.frames[det.frames.length-1].participants)||[]).forEach(p=>dp[p.participantId]=p);
    const md=w0.gameMetadata;
    const side=sd=>{const mt=md[sd+"TeamMetadata"],ft=fe[sd+"Team"],fp={};(ft.participants||[]).forEach(p=>fp[p.participantId]=p);
      return {id:mt.esportsTeamId,our:ourOf(mt.esportsTeamId),k:ft.totalKills,g:ft.totalGold,to:ft.towers,in:ft.inhibitors,ba:ft.barons,dragons:ft.dragons||[],
        // champion et stats lus sur la même ligne du flux que le joueur (participantId)
        p:mt.participantMetadata.map(pm=>{const x=fp[pm.participantId]||{},d=dp[pm.participantId]||{};return {sn:pm.summonerName,c:pm.championId,k:x.kills||0,d:x.deaths||0,a:x.assists||0,cs:x.creepScore||0,gold:x.totalGold||0,ds:d.championDamageShare}})}};
    // rediffusion : la VF (sinon l'anglais) au début exact de la partie
    const v=(g.vods||[]).find(v=>v.locale==="fr-FR"&&v.provider==="youtube")||(g.vods||[]).find(v=>v.locale==="en-US"&&v.provider==="youtube");
    return {num:g.number,gid:g.id,fin:fe.gameState==="finished",mins:(Date.parse(fe.rfc460Timestamp)-start)/60000,b:side("blue"),r:side("red"),
      vod:v?[v.parameter,Math.round((v.startMillis||0)/1000),v.locale==="fr-FR"?"VF":"VO"]:null};
  }));
  // vainqueur de chaque partie : l'API ne donne que le score de la série. Même règle que le robot :
  // état final (seule l'équipe qui a détruit un inhibiteur peut finir), sous la contrainte du score de la série
  const G=games.filter(x=>!x.none&&!x.err),lean=x=>((x.b.in>0)!==(x.r.in>0)?(x.b.in>0?3:-3):0)+.3*(x.b.to-x.r.to)+(x.b.g-x.r.g)/5000;
  let best=null,bs=-Infinity;const full=G.length===total&&ids.length===2;
  for(let mask=0;mask<(1<<G.length);mask++){
    const w=G.map((x,i)=>mask>>i&1?x.b.id:x.r.id),cnt={};w.forEach(t=>cnt[t]=(cnt[t]||0)+1);
    if(full&&(ids.some(t=>(cnt[t]||0)!==wins[t])||(m.state==="done"&&w[w.length-1]!==sw)))continue;
    const sc=G.reduce((a,x,i)=>a+(mask>>i&1?lean(x):-lean(x)),0);if(sc>bs){bs=sc;best=w}
  }
  G.forEach((x,i)=>x.win=best?best[i]:(lean(x)>=0?x.b.id:x.r.id));
  if(games.some(x=>x.err))throw new Error("flux LoL Esports injoignable");
  return {games,nocache:games.some(x=>x.none)};
}
/* ---- v13.5 l.5174-5226 : LoL Esports : clé, leFetch, planning, planning du robot (liste shell) ---- */
const LE_KEY="0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z", WORLDS_LEAGUE="98767975604431411";
async function leFetch(path,retry=1){try{return await leFetch1(path)}catch(e){if(retry>0){await new Promise(r=>setTimeout(r,400));return leFetch(path,retry-1)}throw e}}
async function leFetch1(path){
  const ctl=new AbortController();const to=setTimeout(()=>ctl.abort(),9000);
  try{const r=await fetch("https://esports-api.lolesports.com/persisted/gw/"+path,{headers:{"x-api-key":LE_KEY},signal:ctl.signal});if(!r.ok)throw new Error(r.status);return await r.json()}finally{clearTimeout(to)}
}
// l'API renvoie parfois les deux équipes dans l'autre ordre d'un appel à l'autre : un match garde l'ordre affiché la première fois
// (scores et noms permutés avec ; le vainqueur et les paris sont rangés par équipe, ils ne bougent pas)
function keepSides(m){const p=MATCHES.find(x=>x.id===m.id);if(p&&p.t1&&m.t1&&p.t1===m.t2&&p.t2===m.t1){[m.t1,m.t2]=[m.t2,m.t1];[m.n1,m.n2]=[m.n2,m.n1];[m.s1,m.s2]=[m.s2,m.s1]}}
async function fromLolEsports(){
  const base=`getSchedule?hl=fr-FR&leagueId=${WORLDS_LEAGUE}`;
  const first=await leFetch(base);
  let events=[...(first?.data?.schedule?.events||[])];
  let older=first?.data?.schedule?.pages?.older, newer=first?.data?.schedule?.pages?.newer;
  for(let i=0;i<4&&older;i++){
    const j=await leFetch(base+"&pageToken="+encodeURIComponent(older));const ev=j?.data?.schedule?.events||[];events=ev.concat(events);older=j?.data?.schedule?.pages?.older;
    if(ev.length&&ev[0].startTime<"2026-10-10")break;
  }
  for(let i=0;i<3&&newer;i++){
    const j=await leFetch(base+"&pageToken="+encodeURIComponent(newer));events=events.concat(j?.data?.schedule?.events||[]);newer=j?.data?.schedule?.pages?.newer;
  }
  const out=[],seen=new Set();
  events.forEach(ev=>{
    if(ev.type&&ev.type!=="match")return;
    if(!ev.startTime||ev.startTime<"2026-10-10")return;
    const mt=ev.match||{};const id="le"+(mt.id||ev.startTime);if(seen.has(id))return;seen.add(id);
    const [a,b]=mt.teams||[];if(!a||!b)return;
    const t1=resolveTeam(a.code,a.name),t2=resolveTeam(b.code,b.name);
    if(t1&&a.image)LIVE_LOGO[t1]=a.image; if(t2&&b.image)LIVE_LOGO[t2]=b.image;
    const m={id,stage:stageOf(ev.startTime),label:ev.blockName||"",t1,t2,start:ev.startTime,bo:mt.strategy?.count||1,
      n1:a.name,n2:b.name,s1:a.result?.gameWins??null,s2:b.result?.gameWins??null};
    if(ev.state==="completed"){if(a.result?.outcome==="win")m.winner=t1;else if(b.result?.outcome==="win")m.winner=t2}
    if(ev.state==="inProgress")m.apiLive=true;
    if(ev.state==="unstarted"){m.s1=null;m.s2=null;m.unst=true}
    keepSides(m);out.push(m);
  });
  if(out.filter(m=>m.t1&&m.t2).length<6)throw new Error("planning incomplet");
  return out;
}
// secours : le planning publié par le robot (toutes les 30 min), bien plus frais que les données embarquées
async function fromRobot(){
  const S=await loadSJ(),L=S&&S.sched;if(!L||!L.length)throw new Error("pas de planning du robot");
  const out=[];
  L.forEach(([mid,t,st,bn,bo,a,b])=>{
    if(!a||!b)return;
    const t1=resolveTeam(a[0],a[1]),t2=resolveTeam(b[0],b[1]),done=st==="completed";
    const m={id:"le"+mid,stage:stageOf(t),label:bn||"",t1,t2,start:t,bo:bo||1,n1:a[1],n2:b[1],s1:st==="unstarted"?null:a[2]??null,s2:st==="unstarted"?null:b[2]??null};
    if(done&&a[2]!=null&&b[2]!=null&&a[2]!==b[2])m.winner=a[2]>b[2]?t1:t2;
    if(st==="inProgress")m.apiLive=true;
    keepSides(m);out.push(m);
  });
  if(out.filter(m=>m.t1&&m.t2).length<6)throw new Error("planning du robot incomplet");
  return out;
}
/* ---- v13.5 l.5273-5284 : photos de repli LoL Esports (getTeams, cache w26_le_photos 24 h) quand le robot n'en fournit pas (liste shell) ---- */
async function enrichPhotosLE(){
  const s=await loadSJ();if(s&&s.v>=2&&s.pinfo&&Object.keys(s.pinfo).length)return;   // photos et logos déjà fournis par le robot
  const cache=LS.get("le_photos",null);
  let map=cache&&Date.now()-cache.t<24*3600e3?cache.map:null;
  if(!map){
    const j=await leFetch("getTeams?hl=fr-FR");map={};
    (j?.data?.teams||[]).forEach(t=>{const id=resolveTeam(t.code,t.name);if(!id)return;if(t.image)map["_logo_"+id]=t.image;(t.players||[]).forEach(pl=>{if(pl.image&&!/silhouette|placeholder/i.test(pl.image))map[id+"_"+norm(pl.summonerName)]=pl.image})});
    if(Object.keys(map).length)LS.set("le_photos",{t:Date.now(),map});
  }
  PLAYERS.forEach(p=>{const v=map[p.key];if(v)p.lePhoto=v});
  TEAMS.forEach(t=>{if(!LIVE_LOGO[t.id]&&map["_logo_"+t.id])LIVE_LOGO[t.id]=map["_logo_"+t.id]});
}
/* ---- v13.5 l.5342-5344 : diagnostic : HEALTH, ago, mark (santé des sources) (liste shell) ---- */
const HEALTH={};
const ago=ts=>{if(!ts)return"";const s=(Date.now()-ts)/1000;if(s<60)return"à l’instant";if(s<3600)return`il y a ${Math.round(s/60)} min`;if(s<86400)return`il y a ${Math.round(s/3600)} h`;return`il y a ${Math.round(s/86400)} j`};
function mark(k,ok,ms,err){HEALTH[k]={ok,ms:Math.round(ms),at:Date.now(),err:err?String(err).slice(0,160):null}}
/* ---- v13.5 l.5369-5369 : diagnostic : timed (test chronométré) (liste shell) ---- */
async function timed(label,fn){const t=performance.now();try{const d=await fn();return {label,ok:true,ms:Math.round(performance.now()-t),d}}catch(e){return {label,ok:false,ms:Math.round(performance.now()-t),d:String(e&&e.message||e).slice(0,160)}}}
