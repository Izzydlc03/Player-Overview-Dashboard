/* ============================= MOCK DATA =============================
   Real team names / mascots (Big West Conference). Player names and
   per-game numbers below are placeholders for layout review only —
   shaped exactly like the scraped schema (fgm-fga, 3pm-3pa, ftm-fta,
   oreb/dreb, ast, stl, blk, to, pts) so real rows drop straight in.
*/
const ICONS = {
  overview: '<svg class="ic" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="10.5" width="3.4" height="7"/><rect x="8.3" y="5.5" width="3.4" height="12"/><rect x="14.1" y="2.5" width="3.4" height="15"/></svg>',
  gamelog: '<svg class="ic" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="3.2" width="15" height="14" rx="1.6"/><path d="M2.5 8h15M7 3.2v-1M13 3.2v-1"/></svg>',
  roster: '<svg class="ic" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="10" cy="6.3" r="3"/><path d="M3.3 17c0-3.6 3-6 6.7-6s6.7 2.4 6.7 6"/></svg>',
  cplayers: '<svg class="ic" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="6.5" cy="6.5" r="2.6"/><circle cx="13.5" cy="6.5" r="2.6"/><path d="M2 17c0-2.8 2-4.7 4.5-4.7M18 17c0-2.8-2-4.7-4.5-4.7"/></svg>',
  cteams: '<svg class="ic" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M10 2.3l2.2 4.4 4.9.7-3.5 3.4.8 4.9L10 13.3l-4.4 2.4.8-4.9-3.5-3.4 4.9-.7z"/></svg>',
};

function makePlayers(rows){
  // row: [num,name,pos,gp,min,fgm,fga,tpm,tpa,ftm,fta,oreb,dreb,ast,stl,blk,pts]
  // NOTE: fixed — original mock rows only carried 17 fields (no separate
  // per-player "to" column), so pts is read from the last slot and "to"
  // is estimated from usage until real per-player turnover data is wired in.
  return rows.map(r=>{
    const pts = r[16];
    const ast = r[13], fga = r[6], fta = r[10];
    const to = Math.round((ast*0.35 + fga*0.08 + fta*0.05));
    return {
      num:r[0], name:r[1], pos:r[2], gp:r[3], min:r[4],
      fgm:r[5], fga:r[6], tpm:r[7], tpa:r[8], ftm:r[9], fta:r[10],
      oreb:r[11], dreb:r[12], ast:r[13], stl:r[14], blk:r[15], to, pts,
    };
  });
}
function makeGames(rows){
  // row: [date,opp,home(1/0),ptsFor,ptsAgainst,fgm,fga,reb,ast,to]
  return rows.map(r=>({
    date:r[0], opp:r[1], home:!!r[2], pf:r[3], pa:r[4],
    fgm:r[5], fga:r[6], reb:r[7], ast:r[8], to:r[9], win:r[3]>r[4],
  }));
}

const TEAMS = {
  ucsd:{ name:"UC San Diego", short:"UCSD", mascot:"Tritons",
    players:makePlayers([
      [4,"Maya Whitfield","G",24,32.1, 158,349, 61,168, 88,101, 14,86, 121, 41,10, 465],
      [12,"Jordyn Castillo","G",24,29.4, 121,276, 44,121, 62,74, 9,71, 158, 29,4, 348],
      [23,"Simone Baptiste","F",23,27.8, 132,241, 2,9, 74,99, 68,142, 33, 22,31, 340],
      [5,"Ava Nakamura","G",24,25.0, 96,229, 52,143, 30,36, 8,54, 96, 33,3, 274],
      [34,"Reese Okafor","F",22,24.6, 101,188, 0,2, 55,84, 79,131, 19, 14,38, 257],
      [21,"Taylor Brandt","F",24,21.3, 84,171, 20,63, 33,44, 41,88, 27, 19,17, 221],
      [0,"Camille Duarte","G",24,18.9, 61,152, 28,84, 18,22, 6,38, 88, 24,2, 168],
      [15,"Nia Fontaine","C",21,16.2, 58,101, 0,1, 22,37, 51,79, 11, 6,29, 138],
      [3,"Ellie Sørensen","G",20,12.4, 34,93, 15,49, 8,10, 5,26, 41, 11,1, 91],
      [42,"Priya Chandrasekaran","F",19,10.8, 28,74, 0,3, 12,19, 34,49, 8, 5,15, 68],
      [7,"Hana Fujimoto","G",18,9.6, 22,61, 9,31, 6,8, 3,17, 29, 9,1, 59],
      [50,"Delphine Marchetti","C",15,7.2, 15,38, 0,0, 5,9, 22,31, 4, 2,17, 35],
    ]),
    games:makeGames([
      ["2025-11-04","Jessup",1, 88,52, 33,68, 44,19,12],
      ["2025-11-09","San Diego",0, 71,64, 26,60, 38,15,14],
      ["2025-11-15","Utah Valley",1, 79,58, 29,64, 41,20,10],
      ["2025-11-22","Fresno State",0, 66,73, 24,61, 34,12,17],
      ["2025-11-28","Portland",1, 74,55, 27,59, 39,18,11],
      ["2025-12-06","Loyola Marymount",0, 69,71, 25,63, 36,14,15],
      ["2025-12-13","Grand Canyon",1, 82,60, 31,66, 45,21,9],
      ["2026-01-03","UC Irvine",1, 77,68, 28,62, 40,17,12],
      ["2026-01-08","Cal State Fullerton",0, 73,66, 27,58, 37,16,13],
      ["2026-01-15","UC Davis",0, 62,66, 22,57, 33,13,16],
      ["2026-01-22","Cal Poly",1, 85,70, 32,65, 43,22,10],
      ["2026-01-29","Long Beach State",0, 70,72, 25,60, 35,15,14],
      ["2026-02-05","Hawai'i",1, 68,74, 24,59, 32,12,15],
      ["2026-02-12","UC Santa Barbara",0, 75,61, 28,57, 41,19,11],
    ]),
  },
  ucdavis:{ name:"UC Davis", short:"UCD", mascot:"Aggies",
    players:makePlayers([
      [10,"Brooke Sandoval","G",23,31.5, 149,331, 58,159, 71,84, 12,66, 133, 33,6, 427],
      [22,"Harper Lindqvist","F",23,28.9, 138,255, 4,14, 66,89, 82,138, 24, 18,34, 346],
      [7,"Isabela Cortez","G",23,26.2, 104,238, 40,118, 44,55, 10,49, 141, 27,5, 292],
      [33,"Grace Odom","C",22,22.7, 96,163, 0,0, 40,61, 71,109, 14, 31,40, 232],
      [14,"Peyton Marsh","F",23,20.4, 78,167, 14,46, 28,38, 44,77, 22, 11,20, 198],
      [2,"Sofia Delgado","G",21,17.8, 55,140, 24,74, 16,20, 7,33, 66, 19,3, 150],
      [44,"Ruth Adeyemi","F",20,14.1, 47,92, 0,1, 19,29, 38,64, 9, 8,22, 113],
      [19,"Winnie Larsen","G",18,11.0, 26,70, 10,34, 9,12, 4,22, 33, 10,2, 71],
      [8,"Camryn Boatwright","F",16,8.4, 19,49, 0,2, 10,16, 27,40, 6, 4,18, 48],
      [1,"Mei Tanaka","G",14,6.1, 12,33, 5,17, 4,6, 2,11, 18, 6,1, 33],
      [55,"Odalys Reyes","C",12,5.0, 9,22, 0,0, 3,6, 16,22, 3, 1,10, 21],
      [3,"Kiana Poutasi","G",10,4.2, 6,17, 2,8, 2,3, 1,7, 11, 3,0, 16],
    ]),
    games:makeGames([
      ["2025-11-04","Simpson",1, 93,36, 34,58, 41,20,7],
      ["2025-11-13","Stanford",0, 56,69, 21,55, 30,10,15],
      ["2025-11-24","Sacramento State",1, 70,67, 26,63, 37,14,13],
      ["2025-12-04","Hawai'i",1, 68,63, 25,59, 34,16,11],
      ["2025-12-20","Northern Colorado",1, 47,57, 18,52, 27,9,17],
      ["2026-01-01","CSUN",0, 85,66, 30,60, 39,18,9],
      ["2026-01-08","UC Santa Barbara",1, 47,55, 17,50, 25,8,16],
      ["2026-01-15","UC San Diego",1, 66,62, 24,58, 33,13,12],
      ["2026-01-24","UC Riverside",0, 81,68, 29,61, 40,19,10],
      ["2026-02-05","UC Santa Barbara",0, 61,69, 22,56, 31,11,15],
      ["2026-02-14","Long Beach State",0, 77,66, 28,60, 38,17,11],
      ["2026-02-21","UC Riverside",1, 65,56, 24,55, 34,15,13],
    ]),
  },
  ucirvine:{ name:"UC Irvine", short:"UCI", mascot:"Anteaters",
    players:makePlayers([
      [1,"Kayla Bristow","G",22,30.8, 140,318, 55,151, 60,72, 11,58, 122, 30,5, 395],
      [20,"Amara Osei","F",22,27.1, 124,229, 1,6, 58,80, 76,124, 21, 15,29, 307],
      [11,"Devyn Holt","G",22,24.5, 92,214, 38,109, 34,42, 8,44, 118, 21,2, 256],
      [40,"Lucia Ferreira","C",20,19.6, 71,124, 0,0, 26,41, 55,90, 10, 22,31, 168],
      [24,"Zoe Pemberton","F",21,17.9, 63,141, 12,40, 20,27, 33,58, 17, 9,19, 158],
      [6,"Bianca Souza","G",19,13.2, 40,101, 16,52, 12,15, 6,29, 55, 14,2, 108],
      [33,"Freya Lindholm","F",17,10.5, 30,71, 0,1, 12,18, 26,42, 8, 6,16, 72],
      [9,"Aaliyah Frost","G",15,7.8, 18,48, 7,25, 5,7, 3,14, 24, 7,1, 48],
    ]),
    games:makeGames([
      ["2025-11-05","New Mexico State",1, 74,55, 27,60, 38,16,10],
      ["2025-11-27","Pepperdine",0, 63,70, 23,58, 31,12,16],
      ["2025-12-10","San Diego State",1, 69,64, 25,57, 35,14,12],
      ["2026-01-03","UC San Diego",0, 68,77, 24,59, 33,13,15],
      ["2026-01-11","Hawai'i",1, 71,60, 27,56, 37,17,9],
      ["2026-01-17","UC Davis",1, 73,42, 28,55, 39,19,8],
      ["2026-01-24","CSUN",0, 60,64, 21,53, 29,10,17],
      ["2026-02-24","Cal State Fullerton",1, 66,55, 24,52, 34,15,11],
      ["2026-03-07","UC Davis",1, 70,58, 26,54, 36,16,10],
    ]),
  },
  hawaii:{ name:"Hawai'i", short:"HAW", mascot:"Rainbow Wahine",
    players:makePlayers([
      [3,"Malia Kahale","G",25,29.6, 135,301, 49,140, 65,79, 10,60, 128, 36,6, 384],
      [25,"Sienna Vaughn","F",25,26.3, 118,222, 3,11, 55,73, 71,119, 19, 13,26, 294],
      [8,"Noa Kealoha","G",25,23.8, 87,203, 33,101, 28,36, 9,42, 103, 24,3, 235],
      [31,"Talia Reyes","C",23,20.1, 74,131, 0,0, 24,38, 58,96, 12, 27,33, 172],
      [4,"Emere Tuilagi","F",20,15.3, 52,120, 6,22, 18,26, 30,52, 14, 10,21, 128],
      [14,"Leilani Ah Sam","G",17,10.1, 30,79, 12,40, 9,12, 5,21, 40, 11,2, 81],
      [21,"Puanani Kimura","F",13,6.5, 14,35, 0,0, 6,10, 18,26, 5, 3,12, 34],
    ]),
    games:makeGames([
      ["2025-10-21","Chaminade",1, 90,33, 34,60, 42,20,8],
      ["2025-11-13","Saint Martin's",0, 71,68, 26,60, 35,15,14],
      ["2025-12-04","UC Davis",0, 63,68, 23,57, 32,12,16],
      ["2026-01-01","Cal State Bakersfield",1, 78,60, 29,58, 40,18,9],
      ["2026-01-11","UC Irvine",0, 60,71, 21,55, 29,11,17],
      ["2026-02-05","UC San Diego",0, 74,68, 27,59, 38,16,11],
      ["2026-02-26","UC Davis",1, 67,46, 25,56, 36,17,9],
      ["2026-03-04","UC Santa Barbara",1, 71,60, 26,57, 37,15,10],
    ]),
  },
};

const TEAM_KEYS = Object.keys(TEAMS);

/* Team logo filenames, sitting alongside index.html/style.css/script.js.
   Only ucsd/ucdavis/ucirvine/hawaii currently have matching entries in TEAMS —
   the rest are here ready to go if those teams get built out later. */
const TEAM_LOGOS = {
  ucsd: 'Team_Logos/ucsdLogo.jpg',
  ucdavis: 'Team_Logos/UCdavisLogo.jpg',
  ucirvine: 'Team_Logos/uciLogo.webp',
  hawaii: 'Team_Logos/HawaiiLogo.jpg',
  csub: 'Team_Logos/csubLogo.jpg',
  csulb: 'Team_Logos/csulbLogo.jpg',
  ucr: 'Team_Logos/ucrLogo.jpg',
  ucsb: 'Team_Logos/ucsbLogo.jpg',
  csun: 'Team_Logos/csunLogo.jpg',
  calpoly: 'Team_Logos/calpolyLogo.jpg',
  csuf: 'Team_Logos/csufLogo.jpg',
};
/* Returns an <img> tag if a logo exists for this team key, otherwise falls
   back to the given initials/text inside the same circle. */
function avatarContent(teamKey, fallbackText){
  const logo = TEAM_LOGOS[teamKey];
  return logo ? `<img src="${logo}" alt="${teamKey} logo">` : fallbackText;
}
function teamColor(key){ return key===state.team ? 'var(--series-a)' : 'var(--series-b)'; }

/* ============================= DERIVED STATS ============================= */
function pct(m,a){ return a>0 ? (m/a*100) : 0; }
function fmtPct(m,a){ return a>0 ? (m/a*100).toFixed(1)+'%' : '—'; }
function avg(sum,gp){ return gp>0 ? sum/gp : 0; }
function fmt1(n){ return n.toFixed(1); }

function seasonTotals(team){
  const p = team.players;
  const sum = k => p.reduce((s,x)=>s+x[k],0);
  const gp = Math.max(...p.map(x=>x.gp));
  const totals = {
    gp, fgm:sum('fgm'), fga:sum('fga'), tpm:sum('tpm'), tpa:sum('tpa'),
    ftm:sum('ftm'), fta:sum('fta'), oreb:sum('oreb'), dreb:sum('dreb'),
    ast:sum('ast'), stl:sum('stl'), blk:sum('blk'), to:sum('to'), pts:sum('pts'),
  };
  totals.reb = totals.oreb + totals.dreb;
  const g = team.games;
  const record = { w:g.filter(x=>x.win).length, l:g.filter(x=>!x.win).length };
  const oppPts = g.reduce((s,x)=>s+x.pa,0)/Math.max(g.length,1);
  return {...totals, record, gpFromGames:g.length, ppg:avg(totals.pts,gp), rpg:avg(totals.reb,gp),
    apg:avg(totals.ast,gp), topg:avg(totals.to,gp), stlpg:avg(totals.stl,gp), blkpg:avg(totals.blk,gp),
    oppPpg:oppPts, fgPct:pct(totals.fgm,totals.fga), tpPct:pct(totals.tpm,totals.tpa), ftPct:pct(totals.ftm,totals.fta)};
}

/* Extends seasonTotals with the derived efficiency stats used on the
   Compare Teams page. Possessions use the standard box-score estimate:
   POSS ≈ FGA − OREB + TOV + 0.44·FTA. Offensive/Defensive Rating are
   points scored/allowed per 100 possessions. AST% approximates the share
   of made field goals that were assisted (AST / FGM). TS% is points per
   true shooting attempt. DREB%, OREB%, opponent FG%, and forced-TOV% aren't
   derivable from this schema (we don't track opponent box scores), so —
   like this dashboard's other illustrative stats (fouls, shot chart,
   individual +/-) — they're seeded deterministically per team. */
function teamAdvancedStats(team){
  const s = seasonTotals(team);
  const poss = s.gp>0 ? (s.fga - s.oreb + s.to + 0.44*s.fta) / s.gp : 0;
  const ppp = poss>0 ? s.ppg/poss : 0;
  const ortg = poss>0 ? (s.ppg/poss)*100 : 0;
  const drtg = poss>0 ? (s.oppPpg/poss)*100 : 0;
  const tovPct = poss>0 ? (s.topg/poss)*100 : 0;
  const astPct = s.fgm>0 ? (s.ast/s.fgm)*100 : 0;
  const plusMinus = s.ppg - s.oppPpg;
  const tsPct = (s.fga+0.44*s.fta)>0 ? (s.pts/(2*(s.fga+0.44*s.fta)))*100 : 0;
  const drebPct = seededVal(team.short+'teamDrebPct', 64, 78);
  const orebPct = seededVal(team.short+'teamOrebPct', 22, 36);
  const oppFgPct = seededVal(team.short+'oppFgPct', 36, 46);
  const forcedTovPct = seededVal(team.short+'forcedTovPct', 14, 23);
  return {...s, poss, ppp, ortg, drtg, tovPct, astPct, plusMinus, tsPct, drebPct, orebPct, oppFgPct, forcedTovPct};
}

function playerPerGame(pl){
  return {
    ppg:avg(pl.pts,pl.gp), rpg:avg(pl.oreb+pl.dreb,pl.gp), apg:avg(pl.ast,pl.gp),
    stlpg:avg(pl.stl,pl.gp), blkpg:avg(pl.blk,pl.gp), topg:avg(pl.to,pl.gp),
    fgPct:pct(pl.fgm,pl.fga), tpPct:pct(pl.tpm,pl.tpa), ftPct:pct(pl.ftm,pl.fta), mpg:pl.min, /* pl.min is already a per-game average in the mock data — don't divide by gp again */
  };
}
/* Effective FG% — weights made 3s at 1.5x, standard advanced-stat formula. */
function efgPct(pl){ return pl.fga>0 ? ((pl.fgm + 0.5*pl.tpm)/pl.fga*100) : 0; }
/* Assist-to-turnover ratio. */
function astToRatio(pl){ return pl.to>0 ? pl.ast/pl.to : pl.ast; }
/* Usage Rate — standard box-score estimate: share of a team's total plays
   (shot attempts + free-throw trips + turnovers) that a player used while
   on the floor, scaled by minutes share. Team minutes are approximated as
   a standard 40-minute college game (5 players) times games played, since
   we don't track actual team minutes in this schema. */
function usageRate(team, pl){
  const s = seasonTotals(team);
  const teamMin = 5*40*s.gp;
  const playerMin = pl.min*pl.gp;
  if(playerMin<=0 || s.gp<=0) return 0;
  const num = (pl.fga + 0.44*pl.fta + pl.to) * teamMin;
  const den = playerMin * (s.fga + 0.44*s.fta + s.to);
  return den>0 ? (num/den)*100 : 0;
}
function initials(name){ return name.split(' ').map(w=>w[0]).slice(0,2).join(''); }

/* Deterministic pseudo-random per-game series for a player's trend
   sparkline (illustrative only until real per-game rows are wired in).
   opts.decimals controls rounding precision (default 0, whole numbers);
   opts.min/opts.max clamp the range (default min:0, max:Infinity) — pass
   min:-Infinity for stats like plus/minus that can go negative. */
function seededSeries(seed, n, mean, spread, opts){
  opts = opts || {};
  const decimals = opts.decimals || 0;
  const lo = opts.min===undefined ? 0 : opts.min;
  const hi = opts.max===undefined ? Infinity : opts.max;
  let s = seed;
  const rnd = () => { s = (s*9301+49297)%233280; return s/233280; };
  const f = Math.pow(10, decimals);
  return Array.from({length:n},()=>{
    const v = Math.max(lo, Math.min(hi, mean + (rnd()-.5)*2*spread));
    return Math.round(v*f)/f;
  });
}

/* Deterministic pseudo-random single value from a string seed, mapped to [min,max].
   Used for "made up" illustrative stats (quarter splits, fouls, shot chart)
   so numbers stay stable across re-renders instead of flickering. */
function seededVal(seedStr, min, max){
  let s = 0;
  for(let i=0;i<seedStr.length;i++) s += seedStr.charCodeAt(i)*(i+7);
  s = (s*9301+49297)%233280;
  return min + (s/233280)*(max-min);
}

/* Made-up quarter-by-quarter scoring split that sums to the team's PPG. */
function quarterAverages(team){
  const ppg = seasonTotals(team).ppg;
  const weights = [0,1,2,3].map(q => 0.85 + seededVal(team.short+'q'+q, 0, 0.3));
  const total = weights.reduce((a,b)=>a+b,0);
  return weights.map(wgt => (wgt/total)*ppg);
}

/* Made-up per-game team foul counts, aligned 1:1 with team.games. */
function foulsForGames(games){
  return games.map(g => Math.round(seededVal(g.date+g.opp, 12, 22)));
}

/* ============================= STATE / NAV ============================= */
const state = { view:'overview', team:'ucsd', season:'2025-26', gameSort:{key:'date',dir:1},
  p1:{team:'ucsd',idx:0}, p2:{team:'ucdavis',idx:0}, t1:'ucsd', t2:'ucdavis',
  selectedPlayer:null, leaderTab:'scorers', playerStatKey:'pts' };

const NAV = [
  {id:'overview', label:'Team Overview'},
  {id:'gamelog', label:'Game Log'},
  {id:'roster', label:'Players'},
  {id:'cplayers', label:'Compare Players'},
  {id:'cteams', label:'Compare Teams'},
];

function renderNav(){
  const nav = document.getElementById('nav');
  nav.innerHTML = '<div class="eyebrow nav-label">Views</div>' + NAV.map(v=>`
    <button class="nav-btn ${state.view===v.id?'active':''}" data-view="${v.id}">
      ${ICONS[v.id]}<span>${v.label}</span>
    </button>`).join('');
  nav.querySelectorAll('.nav-btn').forEach(b=>b.addEventListener('click',()=>{
    state.view = b.dataset.view; state.selectedPlayer=null; render();
  }));
}

function teamSelect(id, selected, opts){
  opts = opts || {};
  return `<select id="${id}" ${opts.attrs||''}>${TEAM_KEYS.map(k=>
    `<option value="${k}" ${k===selected?'selected':''}>${TEAMS[k].name} ${opts.mascot?('· '+TEAMS[k].mascot):''}</option>`
  ).join('')}</select>`;
}

function seasonOptions(){
  const seasons = [];
  for(let startYear=2025; startYear >= 2019; startYear--){
    const end = String(startYear + 1).slice(-2);
    seasons.push(`${startYear}-${end}`);
  }
  return seasons;
}

function seasonSelect(id, selected){
  const opts = seasonOptions()
    .map(s => `<option value="${s}" ${s===selected?'selected':''}>${s}</option>`)
    .join('');
  return `<select id="${id}">${opts}</select>`;
}

/* ============================= TOPBAR ============================= */
function renderTopbar(){
  const bar = document.getElementById('topbar');
  const titles = {
    overview:['Team Overview','Season averages for your team'],
    gamelog:['Game Log','Every game this season, sortable'],
    roster:['Players','Full roster with season per-game averages'],
    cplayers:['Compare Players','Any two players, same team or different teams'],
    cteams:['Compare Teams','Season-long team stats, side by side'],
  };
  const [title,sub] = titles[state.view];
  let controls = '';
  if(['overview','gamelog','roster'].includes(state.view)){
    controls = `
      <div class="topbar-controls">
        <span class="vslabel">Select Team</span>${teamSelect('team-picker', state.team)}
        <span class="vslabel">Select Season</span>${seasonSelect('season-picker', state.season)}
      </div>`;
  } else if(['cplayers','cteams'].includes(state.view)){
    controls = `
      <div class="topbar-controls">
        <span class="vslabel">Select Season</span>${seasonSelect('season-picker', state.season)}
      </div>`;
  }

  bar.innerHTML = `<div><h1>${title}</h1><div class="sub">${sub}</div></div>${controls}`;

  const tp = document.getElementById('team-picker');
  if(tp) tp.addEventListener('change', e=>{
    state.team = e.target.value;
    state.selectedPlayer = null;
    render();
  });

  const sp = document.getElementById('season-picker');
  if(sp) sp.addEventListener('change', e=>{
    state.season = e.target.value;
    state.selectedPlayer = null;
    render();
  });
}

/* ============================= LINE CHART (points trend) ============================= */
function lineChart(games, w, h){
  const pad = {l:30,r:14,t:14,b:22};
  const iw = w-pad.l-pad.r, ih = h-pad.t-pad.b;
  const vals = games.flatMap(g=>[g.pf,g.pa]);
  const max = Math.ceil(Math.max(...vals)/10)*10 + 5;
  const min = Math.max(0, Math.floor(Math.min(...vals)/10)*10 - 5);
  const x = i => pad.l + (games.length===1?0:i/(games.length-1))*iw;
  const y = v => pad.t + ih - ((v-min)/(max-min))*ih;
  const path = arr => arr.map((g,i)=> (i===0?'M':'L')+x(i).toFixed(1)+','+y(g).toFixed(1)).join(' ');
  const gridY = [0,.25,.5,.75,1].map(t=> min + t*(max-min));

  const pts = games.map((g,i)=>`<circle class="pt-a" cx="${x(i)}" cy="${y(g.pf)}" r="3" fill="var(--series-a)" data-i="${i}"/>
    <circle class="pt-b" cx="${x(i)}" cy="${y(g.pa)}" r="3" fill="var(--series-b)" data-i="${i}"/>`).join('');
  const hitW = games.length>1 ? iw/(games.length-1) : iw;

  return `<div class="chart-wrap" data-chart="trend">
    <svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="height:${h}px">
      ${gridY.map(v=>`<line class="gridline" x1="${pad.l}" x2="${w-pad.r}" y1="${y(v)}" y2="${y(v)}"/><text class="axislabel" x="2" y="${y(v)+3}">${Math.round(v)}</text>`).join('')}
      <path d="${path(games.map(g=>g.pf))}" fill="none" stroke="var(--series-a)" stroke-width="2"/>
      <path d="${path(games.map(g=>g.pa))}" fill="none" stroke="var(--series-b)" stroke-width="2" stroke-dasharray="4 3"/>
      ${pts}
      <line id="hoverline" class="hover-x" x1="0" x2="0" y1="${pad.t}" y2="${h-pad.b}"/>
      ${games.map((g,i)=>`<rect class="hit" x="${x(i)-hitW/2}" y="${pad.t}" width="${hitW}" height="${ih}" data-i="${i}"/>`).join('')}
    </svg>
  </div>`;
}
function wireTrendChart(container, games){
  const wrap = container.querySelector('[data-chart="trend"]');
  if(!wrap) return;
  const svg = wrap.querySelector('svg');
  const tooltip = document.getElementById('tooltip');
  const hoverline = wrap.querySelector('#hoverline');
  svg.querySelectorAll('.hit').forEach(hit=>{
    hit.addEventListener('mouseenter', ()=>{
      const i = +hit.dataset.i, g = games[i];
      const cA = svg.querySelector(`.pt-a[data-i="${i}"]`);
      hoverline.setAttribute('x1', cA.getAttribute('cx')); hoverline.setAttribute('x2', cA.getAttribute('cx'));
      hoverline.style.opacity = 1;
      const rect = svg.getBoundingClientRect(), wrapAbs = wrap.getBoundingClientRect();
      const px = (cA.getAttribute('cx')/svg.viewBox.baseVal.width)*rect.width;
      const py = (cA.getAttribute('cy')/svg.viewBox.baseVal.height)*rect.height;
      tooltip.innerHTML = `<div>${g.win?'W':'L'} ${g.pf}–${g.pa} <span class="t-sub">vs ${g.opp}</span></div>`;
      tooltip.style.transform = 'translate(-50%,-125%)';
      tooltip.style.left = (wrapAbs.left+window.scrollX+px)+'px'; tooltip.style.top = (wrapAbs.top+window.scrollY+py)+'px';
      tooltip.classList.add('show');
    });
    hit.addEventListener('mouseleave', ()=>{ hoverline.style.opacity=0; tooltip.classList.remove('show'); });
  });
}

/* ============================= QUARTER-BY-QUARTER BAR CHART ============================= */
function quarterBarChart(quarters, w, h){
  const pad = {l:26,r:10,t:16,b:22};
  const iw = w-pad.l-pad.r, ih = h-pad.t-pad.b;
  const max = Math.ceil(Math.max(...quarters)/5)*5 + 5;
  const gap = iw/quarters.length, bw = gap*0.46;
  const gridY = [0,.5,1].map(t=>t*max);
  const bars = quarters.map((v,i)=>{
    const bh = (v/max)*ih;
    const x = pad.l + i*gap + (gap-bw)/2;
    const y = pad.t + ih - bh;
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="3" fill="var(--series-a)"/>
      <text class="axislabel" x="${(x+bw/2).toFixed(1)}" y="${h-6}" text-anchor="middle">Q${i+1}</text>
      <text x="${(x+bw/2).toFixed(1)}" y="${(y-6).toFixed(1)}" text-anchor="middle" style="fill:var(--ink);font-weight:700;font-family:var(--font-body);font-size:11px;">${v.toFixed(1)}</text>`;
  }).join('');
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="height:${h}px">
    ${gridY.map(v=>`<line class="gridline" x1="${pad.l}" x2="${w-pad.r}" y1="${(pad.t+ih-(v/max)*ih).toFixed(1)}" y2="${(pad.t+ih-(v/max)*ih).toFixed(1)}"/>`).join('')}
    ${bars}
  </svg>`;
}

/* ============================= TEAM FOULS PER GAME CHART ============================= */
function foulsChart(games, w, h){
  const fouls = foulsForGames(games);
  const pad = {l:26,r:10,t:14,b:22};
  const iw = w-pad.l-pad.r, ih = h-pad.t-pad.b;
  const max = Math.max(...fouls)+2, min = Math.max(0, Math.min(...fouls)-2);
  const x = i => pad.l + (games.length===1?0:i/(games.length-1))*iw;
  const y = v => pad.t + ih - ((v-min)/(max-min))*ih;
  const path = fouls.map((v,i)=>(i===0?'M':'L')+x(i).toFixed(1)+','+y(v).toFixed(1)).join(' ');
  const gridY = [0,.5,1].map(t=>min+t*(max-min));
  const hitW = games.length>1 ? iw/(games.length-1) : iw;
  const dots = games.map((g,i)=>`<circle class="foul-pt" cx="${x(i)}" cy="${y(fouls[i])}" r="3.5" fill="${g.win?'var(--good)':'var(--critical)'}" data-i="${i}"/>`).join('');

  return `<div class="chart-wrap" data-chart="fouls">
    <svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="height:${h}px">
      ${gridY.map(v=>`<line class="gridline" x1="${pad.l}" x2="${w-pad.r}" y1="${y(v)}" y2="${y(v)}"/><text class="axislabel" x="1" y="${y(v)+3}">${Math.round(v)}</text>`).join('')}
      <path d="${path}" fill="none" stroke="var(--series-a)" stroke-width="2"/>
      ${dots}
      <line id="foul-hoverline" class="hover-x" x1="0" x2="0" y1="${pad.t}" y2="${h-pad.b}"/>
      ${games.map((g,i)=>`<rect class="hit" x="${x(i)-hitW/2}" y="${pad.t}" width="${hitW}" height="${ih}" data-i="${i}"/>`).join('')}
    </svg>
  </div>`;
}
function wireFoulsChart(container, games){
  const wrap = container.querySelector('[data-chart="fouls"]');
  if(!wrap) return;
  const svg = wrap.querySelector('svg');
  const tooltip = document.getElementById('tooltip');
  const hoverline = wrap.querySelector('#foul-hoverline');
  const fouls = foulsForGames(games);
  svg.querySelectorAll('.hit').forEach(hit=>{
    hit.addEventListener('mouseenter', ()=>{
      const i = +hit.dataset.i, g = games[i];
      const pt = svg.querySelector(`.foul-pt[data-i="${i}"]`);
      hoverline.setAttribute('x1', pt.getAttribute('cx')); hoverline.setAttribute('x2', pt.getAttribute('cx'));
      hoverline.style.opacity = 1;
      const rect = svg.getBoundingClientRect(), wrapAbs = wrap.getBoundingClientRect();
      const px = (pt.getAttribute('cx')/svg.viewBox.baseVal.width)*rect.width;
      const py = (pt.getAttribute('cy')/svg.viewBox.baseVal.height)*rect.height;
      tooltip.innerHTML = `<div>${g.win?'W':'L'} ${fouls[i]} fouls <span class="t-sub">vs ${g.opp}</span></div>`;
      tooltip.style.transform = 'translate(-50%,-125%)';
      tooltip.style.left = (wrapAbs.left+window.scrollX+px)+'px'; tooltip.style.top = (wrapAbs.top+window.scrollY+py)+'px';
      tooltip.classList.add('show');
    });
    hit.addEventListener('mouseleave', ()=>{ hoverline.style.opacity=0; tooltip.classList.remove('show'); });
  });
}

/* Interpolate between two hex colors; t is 0..1 */
function hexToRgb(hex){
  const h = hex.replace('#','');
  return { r: parseInt(h.slice(0,2),16), g: parseInt(h.slice(2,4),16), b: parseInt(h.slice(4,6),16) };
}
function mixHex(h1, h2, t){
  const c1 = hexToRgb(h1), c2 = hexToRgb(h2);
  const r = Math.round(c1.r + (c2.r-c1.r)*t);
  const g = Math.round(c1.g + (c2.g-c1.g)*t);
  const b = Math.round(c1.b + (c2.b-c1.b)*t);
  return `rgb(${r},${g},${b})`;
}
/* Shot-chart heat color: blends across the four Pantone stops (1245 -> 144 -> 116 -> 3945)
   based on cell intensity 0..1, instead of a single hue at varying opacity. */
const HEAT_STOPS = ['#FFCD00','#FC8900','#C0524A'];
function heatColor(val){
  const scaled = Math.max(0, Math.min(1, val)) * (HEAT_STOPS.length-1);
  const idx = Math.min(HEAT_STOPS.length-2, Math.floor(scaled));
  const t = scaled - idx;
  return mixHex(HEAT_STOPS[idx], HEAT_STOPS[idx+1], t);
}

/* ============================= SHOT HEATMAP (illustrative) =============================
   Hexbin-style heatmap: a grid of hexagons is sampled against a set of "hot zone"
   gaussians (paint, wings, corners, mid-range, top of key) so density fades smoothly
   the way a real shot chart does, then rendered as discrete hexagons (size + color
   both track intensity) instead of blurred blobs.

   Court geometry: baseline/hoop sits near the TOP of the box (y small). The
   three-point line is drawn as actual circular-arc geometry centered on the hoop,
   with two short straight "corner three" segments running from the baseline down
   to where they meet the arc — not a single flattened curve. */
function heatHexPath(cx, cy, r){
  const pts = [];
  for(let i=0;i<6;i++){
    const angle = Math.PI/180*(60*i-30);
    pts.push(`${(cx+r*Math.cos(angle)).toFixed(1)},${(cy+r*Math.sin(angle)).toFixed(1)}`);
  }
  return pts.join(' ');
}
function shotHeatmap(team, w, h){
  const pad = {l:16, r:16, t:16, b:16};
  const iw = w-pad.l-pad.r, ih = h-pad.t-pad.b;

  // Hot zones as fractions of the court box, converted to pixel space, each with
  // a gaussian falloff so the density field is continuous (sampled per hexagon).
  const baseZones = [
    {cx:.50, cy:.14, sx:.16, sy:.13, base:0.95}, // paint / restricted area
    {cx:.18, cy:.50, sx:.13, sy:.17, base:0.72}, // left wing three
    {cx:.82, cy:.50, sx:.13, sy:.17, base:0.72}, // right wing three
    {cx:.50, cy:.80, sx:.15, sy:.12, base:0.42}, // top of key / above the break
    {cx:.06, cy:.10, sx:.09, sy:.09, base:0.30}, // left corner three
    {cx:.94, cy:.10, sx:.09, sy:.09, base:0.30}, // right corner three
    {cx:.32, cy:.28, sx:.10, sy:.12, base:0.26}, // left mid-range
    {cx:.68, cy:.28, sx:.10, sy:.12, base:0.26}, // right mid-range
  ];
  const zones = baseZones.map((z,i)=>{
    const intensity = Math.max(.15, Math.min(1, z.base + seededVal(team.short+'zone'+i, -0.12, 0.12)));
    return { cx: pad.l+z.cx*iw, cy: pad.t+z.cy*ih, sx: z.sx*iw, sy: z.sy*ih, intensity };
  });
  const densityAt = (x,y) => {
    let val = 0;
    zones.forEach(z=>{
      const dx = (x-z.cx)/z.sx, dy = (y-z.cy)/z.sy;
      val += z.intensity * Math.exp(-(dx*dx+dy*dy));
    });
    return Math.min(1, val);
  };

  // Hexagon grid (pointy-top, offset rows).
  const hexR = Math.max(7, iw/38);
  const hexW = Math.sqrt(3)*hexR;
  const vertStep = hexR*1.5;
  let hexes = '';
  let row = 0;
  for(let y = pad.t+hexR; y <= pad.t+ih-hexR*0.3; y += vertStep){
    const offsetX = (row%2===1) ? hexW/2 : 0;
    for(let x = pad.l+hexR+offsetX; x <= pad.l+iw-hexR*0.3; x += hexW){
      const val = densityAt(x,y);
      if(val > 0.045){
        const r = hexR*(0.4+0.6*val);
        hexes += `<polygon points="${heatHexPath(x,y,r)}" fill="${heatColor(val)}" opacity="${(0.5+val*0.5).toFixed(2)}"/>`;
      }
    }
    row++;
  }

  // Real NCAA three-point arc, verified against the "basketball-court" npm
  // package's rendered output (Wikipedia-sourced dimensions) to confirm the
  // correct arc flags and corner-intersection sign:
  // - Court width = 50ft, so scale = px per foot = iw/50
  // - Arc center sits 5'3" (63") off the baseline, directly under the rim
  // - Arc radius = 22'1.75" from that center point
  // - Straight segment sits 40.125" in from the sideline (25ft half-width minus
  //   that offset = 21.65625ft from center court)
  // - The corner segment meets the arc at the FAR circle intersection
  //   (hoop.y + d), which lands at ~9.88ft from the baseline — matching the
  //   diagram's measured 9'10.75" straight-segment length almost exactly.
  const scale = iw/50;
  const hoop = { x: pad.l+iw*0.5, y: pad.t + 5.25*scale };
  const R = 22.1458*scale;
  const cornerHalfW = (25 - 40.125/12)*scale;
  const yAtCorner = hoop.y + Math.sqrt(Math.max(0, R*R - cornerHalfW*cornerHalfW));
  const leftX = hoop.x-cornerHalfW, rightX = hoop.x+cornerHalfW;
  const arcPath = `M ${leftX.toFixed(1)} ${pad.t.toFixed(1)} L ${leftX.toFixed(1)} ${yAtCorner.toFixed(1)} A ${R.toFixed(1)} ${R.toFixed(1)} 0 0 0 ${rightX.toFixed(1)} ${yAtCorner.toFixed(1)} L ${rightX.toFixed(1)} ${pad.t.toFixed(1)}`;

  // Free-throw lane + circle, same real-world scale: lane is 12ft wide, 15ft
  // long (outside edge), circle radius = half the lane width, centered on
  // the free-throw line.
  const laneW = 12*scale, laneH = 15*scale;
  const laneX = hoop.x-laneW/2;
  const ftCircleY = pad.t+laneH;

  const courtLines = `
    <rect x="${pad.l}" y="${pad.t}" width="${iw}" height="${ih}" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2"/>
    <rect x="${laneX.toFixed(1)}" y="${pad.t}" width="${laneW.toFixed(1)}" height="${laneH.toFixed(1)}" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2"/>
    <circle cx="${hoop.x.toFixed(1)}" cy="${ftCircleY.toFixed(1)}" r="${(laneW/2).toFixed(1)}" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2"/>
    <path d="${arcPath}" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2"/>
    <line x1="${(hoop.x-3*scale).toFixed(1)}" y1="${(pad.t+4*scale).toFixed(1)}" x2="${(hoop.x+3*scale).toFixed(1)}" y2="${(pad.t+4*scale).toFixed(1)}" stroke="rgba(255,255,255,.7)" stroke-width="2.4"/>
    <circle cx="${hoop.x.toFixed(1)}" cy="${hoop.y.toFixed(1)}" r="${(0.75*scale).toFixed(1)}" fill="none" stroke="rgba(255,150,70,.8)" stroke-width="1.8"/>
  `;

  /* preserveAspectRatio="none" lets this fill whatever box its flex container gives it,
     so the card matches the height of the leaderboard card next to it. */
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <rect x="0" y="0" width="${w}" height="${h}" rx="10" fill="#0F2038"/>
    ${hexes}
    ${courtLines}
  </svg>`;
}

/* ============================= VIEW: OVERVIEW ============================= */
function viewOverview(){
  const team = TEAMS[state.team];
  const s = seasonTotals(team);
  const quarters = quarterAverages(team);
  const fouls = foulsForGames(team.games);
  const avgFouls = fouls.reduce((a,b)=>a+b,0)/fouls.length;
  const scorers = [...team.players].sort((a,b)=>b.pts-a.pts);
  const rebounders = [...team.players].sort((a,b)=>(b.oreb+b.dreb)-(a.oreb+a.dreb));
  const assisters = [...team.players].sort((a,b)=>b.ast-a.ast);

  const tile = (label,val,unit)=>`<div class="tile"><div class="eyebrow">${label}</div><div class="val num">${val}${unit?`<small>${unit}</small>`:''}</div></div>`;

  const LEADER_TABS = [
    {key:'scorers', label:'Top Scorers', list:scorers, statKey:'ppg', statLabel:'PPG', fmt:fmt1},
    {key:'rebounders', label:'Top Rebounders', list:rebounders, statKey:'rpg', statLabel:'RPG', fmt:fmt1},
    {key:'playmakers', label:'Top Playmakers', list:assisters, statKey:'apg', statLabel:'APG', fmt:fmt1},
  ];
  const leaderCard = (tabs, activeKey)=>{
    const active = tabs.find(t=>t.key===activeKey) || tabs[0];
    return `
      <div class="card stretch">
        <div class="card-title"><h3>Roster Leaders</h3><span class="hint">Full roster</span></div>
        <div class="tab-row">
          ${tabs.map(t=>`<button class="tab-btn ${t.key===active.key?'active':''}" data-tab="${t.key}">${t.label}</button>`).join('')}
        </div>
        <div class="leaderboard-list">
          ${active.list.map((p,i)=>`
            <div style="display:flex;align-items:center;gap:10px;padding:7px 0;${i<active.list.length-1?'border-bottom:1px solid var(--border);':''}">
              <span class="muted num" style="width:16px;font-size:11px;">${i+1}</span>
              <span class="jersey">${p.num}</span>
              <span class="leader-name">${p.name}</span>
              <span class="num leader-stat">${active.fmt(playerPerGame(p)[active.statKey])}</span>
              <span class="stat-unit">${active.statLabel}</span>
            </div>`).join('')}
        </div>
      </div>`;
  };

  return `
    <div class="tiles">
      ${tile('Record', s.record.w+'–'+s.record.l)}
      ${tile('PPG', fmt1(s.ppg))}
      ${tile('Opp PPG', fmt1(s.oppPpg))}
      ${tile('Reb / gm', fmt1(s.rpg))}
      ${tile('Ast / gm', fmt1(s.apg))}
      ${tile('FG%', s.fgPct.toFixed(1),'%')}
      ${tile('3P%', s.tpPct.toFixed(1),'%')}
      ${tile('TO / gm', fmt1(s.topg))}
    </div>

    <div class="grid-3">
      <div class="card">
        <div class="card-title">
          <h3>Points Scored vs Allowed</h3>
          <div class="legend">
            <span class="legend-item"><span class="swatch" style="background:var(--series-a)"></span>${team.short}</span>
            <span class="legend-item"><span class="swatch" style="background:var(--series-b);border-radius:0;height:2px;"></span>Opponent</span>
          </div>
        </div>
        <div id="trend-holder">${lineChart(team.games, 400, 200)}</div>
      </div>
      <div class="card">
        <div class="card-title"><h3>Average Points per Quarter</h3><span class="hint">Season</span></div>
        ${quarterBarChart(quarters, 400, 200)}
      </div>
      <div class="card">
        <div class="card-title"><h3>Team Fouls per Game</h3><span class="hint">Avg ${fmt1(avgFouls)} · dot = W/L</span></div>
        ${foulsChart(team.games, 400, 200)}
      </div>
    </div>

    <div class="grid-2-even">
      <div class="card stretch">
        <div class="card-title"><h3>Shot Chart</h3><span class="hint">Season frequency</span></div>
        <div class="chart-fill">${shotHeatmap(team, 600, 460)}</div>
        <div class="heat-legend"><span>Lower</span><span class="heat-legend-bar"></span><span>Higher</span></div>
        <p class="heat-caption">Color represents shot frequency — how many shots were made from that area of the court.</p>
      </div>
      ${leaderCard(LEADER_TABS, state.leaderTab)}
    </div>
  `;
}

/* Show each leaderboard's scrollbar only while actively scrolling; fade it
   back out ~800ms after the last scroll event. */
function wireLeaderboardScroll(container){
  container.querySelectorAll('.leaderboard-list').forEach(list=>{
    let hideTimer = null;
    list.addEventListener('scroll', ()=>{
      list.classList.add('scrolling');
      clearTimeout(hideTimer);
      hideTimer = setTimeout(()=> list.classList.remove('scrolling'), 800);
    }, {passive:true});
  });
}

/* Switch which stat list (scorers/rebounders/playmakers) the combined
   leaderboard card is showing. */
function wireLeaderTabs(container){
  container.querySelectorAll('.tab-btn').forEach(btn=>btn.addEventListener('click',()=>{
    state.leaderTab = btn.dataset.tab; render();
  }));
}

/* ============================= VIEW: GAME LOG ============================= */
const GAME_COLS = [
  {key:'date', label:'Date'}, {key:'opp', label:'Opponent'}, {key:'loc', label:'Loc'},
  {key:'result', label:'Result'}, {key:'fgpct', label:'FG%', num:true},
  {key:'reb', label:'Reb', num:true}, {key:'ast', label:'Ast', num:true}, {key:'to', label:'TO', num:true},
];
function viewGameLog(){
  const team = TEAMS[state.team];
  let rows = team.games.map(g=>({...g, fgpct:pct(g.fgm,g.fga)}));
  const {key,dir} = state.gameSort;
  const sortVal = g => key==='result' ? (g.win?1:0) : key==='loc' ? (g.home?1:0) : key==='opp' ? g.opp : g[key];
  rows = rows.sort((a,b)=>{ const av=sortVal(a), bv=sortVal(b); return av<bv?-1*dir:av>bv?1*dir:0; });

  return `
    <div class="card">
      <div class="card-title"><h3>${team.name} · ${team.games.length} games</h3><span class="hint">Click a row for that game's box score</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr>${GAME_COLS.map(c=>`<th class="${c.num?'num':''}"><button class="th-sort" data-key="${c.key}">${c.label} ${key===c.key?(dir>0?'↑':'↓'):''}</button></th>`).join('')}</tr></thead>
          <tbody>
            ${rows.map(g=>`
              <tr class="clickable" data-date="${g.date}">
                <td class="muted">${g.date}</td>
                <td class="rowname">${g.opp}</td>
                <td class="muted">${g.home?'H':'A'}</td>
                <td><span class="pill ${g.win?'win':'loss'}">${g.win?'W':'L'}</span> <span class="num">${g.pf}–${g.pa}</span></td>
                <td class="num">${g.fgpct.toFixed(1)}%</td>
                <td class="num">${g.reb}</td>
                <td class="num">${g.ast}</td>
                <td class="num">${g.to}</td>
              </tr>
              <tr class="boxrow" data-boxfor="${g.date}" style="display:none;"><td colspan="${GAME_COLS.length}" style="background:var(--surface-2);padding:14px 16px;">
                <div class="eyebrow" style="margin-bottom:8px;">Team box · ${g.home?'vs':'@'} ${g.opp}</div>
                <div class="tiles" style="grid-template-columns:repeat(5,1fr)">
                  <div class="tile"><div class="eyebrow">FG</div><div class="val num" style="font-size:16px;">${g.fgm}-${g.fga}</div></div>
                  <div class="tile"><div class="eyebrow">Reb</div><div class="val num" style="font-size:16px;">${g.reb}</div></div>
                  <div class="tile"><div class="eyebrow">Ast</div><div class="val num" style="font-size:16px;">${g.ast}</div></div>
                  <div class="tile"><div class="eyebrow">TO</div><div class="val num" style="font-size:16px;">${g.to}</div></div>
                  <div class="tile"><div class="eyebrow">Final</div><div class="val num" style="font-size:16px;">${g.pf}-${g.pa}</div></div>
                </div>
              </td></tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
function wireGameLog(container){
  container.querySelectorAll('.th-sort').forEach(b=>b.addEventListener('click',()=>{
    const key = b.dataset.key;
    state.gameSort = { key, dir: state.gameSort.key===key ? -state.gameSort.dir : 1 };
    render();
  }));
  container.querySelectorAll('tr.clickable').forEach(row=>row.addEventListener('click',()=>{
    const boxrow = container.querySelector(`tr.boxrow[data-boxfor="${row.dataset.date}"]`);
    const open = boxrow.style.display !== 'none';
    container.querySelectorAll('tr.boxrow').forEach(r=>r.style.display='none');
    boxrow.style.display = open ? 'none' : 'table-row';
  }));
}

/* ============================= VIEW: ROSTER / PLAYER DETAIL ============================= */
function viewRoster(){
  const team = TEAMS[state.team];
  if(state.selectedPlayer && state.selectedPlayer.team===state.team){
    return rosterGrid(team) + playerDetail(team, state.selectedPlayer.idx);
  }
  return rosterGrid(team);
}
function rosterGrid(team){
  return `<div class="card">
    <div class="card-title"><h3>${team.name} roster</h3><span class="hint">${team.players.length} players · click for detail</span></div>
    <div class="roster-grid">
      ${team.players.map((p,i)=>{ const pg = playerPerGame(p); const active = state.selectedPlayer && state.selectedPlayer.team===state.team && state.selectedPlayer.idx===i;
        return `<button class="player-card ${active?'active':''}" data-idx="${i}">
          <div class="pc-head"><div class="pc-avatar">${avatarContent(state.team, initials(p.name))}</div>
            <div><div class="pc-name">${p.name}</div><div class="pc-meta">#${p.num} · ${p.pos}</div></div>
          </div>
          <div class="pc-stats">
            <div class="pc-stat"><b class="num">${fmt1(pg.ppg)}</b><span>PPG</span></div>
            <div class="pc-stat"><b class="num">${fmt1(pg.rpg)}</b><span>RPG</span></div>
            <div class="pc-stat"><b class="num">${fmt1(pg.apg)}</b><span>APG</span></div>
          </div>
        </button>`; }).join('')}
    </div>
  </div>`;
}
/* All stats shown as clickable tiles on the player detail card. `val` is the
   season per-game (or ratio/%) value shown on the tile; `decimals`/`min`/`max`
   control how the illustrative game-by-game trend is generated and clamped.
   Plus/Minus, OREB%, and DREB% aren't derivable from our current box-score
   fields, so — like the rest of this mock dashboard's illustrative charts
   (fouls, quarter splits, shot chart) — they're seeded deterministically per
   player rather than left out. */
function playerStatDefs(team, p, pg){
  const efg = efgPct(p), astTo = astToRatio(p);
  const plusMinus = seededVal(team.short+p.name+'pm', -8, 12);
  const orebPct = seededVal(team.short+p.name+'orebpct', 2, 14);
  const drebPct = seededVal(team.short+p.name+'drebpct', 8, 26);
  return [
    {key:'pts', label:'PPG', trendLabel:'Points', val:pg.ppg, fmt:fmt1, decimals:0},
    {key:'reb', label:'RPG', trendLabel:'Rebounds', val:pg.rpg, fmt:fmt1, decimals:0},
    {key:'ast', label:'APG', trendLabel:'Assists', val:pg.apg, fmt:fmt1, decimals:0},
    {key:'fgpct', label:'FG%', trendLabel:'FG%', val:pg.fgPct, fmt:v=>v.toFixed(1), decimals:1, max:100},
    {key:'tppct', label:'3P%', trendLabel:'3P%', val:pg.tpPct, fmt:v=>v.toFixed(1), decimals:1, max:100},
    {key:'ftpct', label:'FT%', trendLabel:'FT%', val:pg.ftPct, fmt:v=>v.toFixed(1), decimals:1, max:100},
    {key:'efgpct', label:'eFG%', trendLabel:'eFG%', val:efg, fmt:v=>v.toFixed(1), decimals:1, max:100},
    {key:'pm', label:'+/-', trendLabel:'Plus/Minus', val:plusMinus, fmt:v=>(v>=0?'+':'')+v.toFixed(1), decimals:1, min:-Infinity},
    {key:'astto', label:'AST/TO', trendLabel:'Ast/TO ratio', val:astTo, fmt:v=>v.toFixed(2), decimals:2},
    {key:'orebpct', label:'OREB%', trendLabel:'OREB%', val:orebPct, fmt:v=>v.toFixed(1), decimals:1, max:100},
    {key:'drebpct', label:'DREB%', trendLabel:'DREB%', val:drebPct, fmt:v=>v.toFixed(1), decimals:1, max:100},
    {key:'min', label:'MIN', trendLabel:'Minutes', val:pg.mpg, fmt:fmt1, decimals:1},
  ];
}

/* ============================= PLAYER STAT TREND CHART (x/y axis) =============================
   Full axis chart used by the player-detail view: labeled y-axis (gridlines +
   value ticks using the active stat's own formatter) and labeled x-axis
   (game number, sparse-ticked so labels don't collide on long seasons),
   plus a hover crosshair + tooltip on every point (not just the last one). */
function statTrendChart(series, active, games, w, h){
  const pad = {l:46, r:16, t:16, b:34};
  const iw = w-pad.l-pad.r, ih = h-pad.t-pad.b;

  const seriesMax = Math.max(...series), seriesMin = Math.min(...series);
  const range = Math.max(seriesMax-seriesMin, Math.abs(seriesMax)*0.1, 1);
  const padV = range*0.2;
  const hardMin = active.min===undefined ? undefined : active.min;
  const hardMax = active.max===undefined ? undefined : active.max;
  let max = seriesMax + padV;
  let min = seriesMin - padV;
  if(!(hardMin < 0)) min = Math.min(min, 0); // keep a zero baseline unless the stat can go negative
  if(hardMax!==undefined) max = Math.min(Math.max(max, seriesMax), hardMax + padV*0.3);
  if(hardMin!==undefined) min = Math.max(min, hardMin);
  if(max<=min) max = min+1;

  const n = series.length;
  const x = i => pad.l + (n===1?iw/2:(i/(n-1))*iw);
  const y = v => pad.t + ih - ((v-min)/(max-min))*ih;

  const gridY = [0,.25,.5,.75,1].map(t=> min + t*(max-min));
  const yAxis = gridY.map(v=>`<line class="gridline" x1="${pad.l}" x2="${w-pad.r}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text class="axislabel" x="${pad.l-6}" y="${(y(v)+3).toFixed(1)}" text-anchor="end">${active.fmt(v)}</text>`).join('');

  const xTickEvery = Math.max(1, Math.ceil(n/8));
  const xAxis = series.map((v,i)=> (i%xTickEvery===0 || i===n-1) ? `<text class="axislabel" x="${x(i).toFixed(1)}" y="${h-pad.b+16}" text-anchor="middle">G${i+1}</text>` : '').join('');

  const linePath = series.map((v,i)=>(i===0?'M':'L')+x(i).toFixed(1)+','+y(v).toFixed(1)).join(' ');
  const areaPath = linePath + ` L${x(n-1).toFixed(1)},${y(min).toFixed(1)} L${x(0).toFixed(1)},${y(min).toFixed(1)} Z`;

  const dots = series.map((v,i)=>`<circle class="trend-pt" cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="${i===n-1?4.5:3}" fill="var(--series-a)" ${i===n-1?'stroke="white" stroke-width="1.5"':''} data-i="${i}"/>`).join('');
  const hitW = n>1 ? iw/(n-1) : iw;
  const hits = series.map((v,i)=>`<rect class="hit" x="${(x(i)-hitW/2).toFixed(1)}" y="${pad.t}" width="${hitW.toFixed(1)}" height="${ih}" data-i="${i}"/>`).join('');

  return `<div class="chart-wrap" data-chart="stat-trend">
    <svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="width:100%;height:100%;">
      ${yAxis}
      <line class="gridline" x1="${pad.l}" x2="${pad.l}" y1="${pad.t}" y2="${h-pad.b}"/>
      <line class="gridline" x1="${pad.l}" x2="${w-pad.r}" y1="${h-pad.b}" y2="${h-pad.b}"/>
      ${xAxis}
      <text class="axistitle" x="${(pad.l+w-pad.r)/2}" y="${h-4}" text-anchor="middle">Game number</text>
      <text class="axistitle" x="${12}" y="${(pad.t+h-pad.b)/2}" text-anchor="middle" transform="rotate(-90 12 ${(pad.t+h-pad.b)/2})">${active.label}</text>
      <path d="${areaPath}" fill="var(--series-a)" opacity=".12"/>
      <path d="${linePath}" fill="none" stroke="var(--series-a)" stroke-width="2.25"/>
      ${dots}
      <line id="stat-hoverline" class="hover-x" x1="0" x2="0" y1="${pad.t}" y2="${h-pad.b}"/>
      ${hits}
    </svg>
  </div>`;
}
function wireStatTrendChart(container, series, active, games){
  const wrap = container.querySelector('[data-chart="stat-trend"]');
  if(!wrap) return;
  const svg = wrap.querySelector('svg');
  const tooltip = document.getElementById('tooltip');
  const hoverline = wrap.querySelector('#stat-hoverline');
  svg.querySelectorAll('.hit').forEach(hit=>{
    hit.addEventListener('mouseenter', ()=>{
      const i = +hit.dataset.i;
      const pt = svg.querySelector(`.trend-pt[data-i="${i}"]`);
      hoverline.setAttribute('x1', pt.getAttribute('cx')); hoverline.setAttribute('x2', pt.getAttribute('cx'));
      hoverline.style.opacity = 1;
      const rect = svg.getBoundingClientRect(), wrapAbs = wrap.getBoundingClientRect();
      const px = (pt.getAttribute('cx')/svg.viewBox.baseVal.width)*rect.width;
      const py = (pt.getAttribute('cy')/svg.viewBox.baseVal.height)*rect.height;
      const g = games && games.length ? games[i % games.length] : null;
      const sub = g ? `Game ${i+1} · ${g.win?'W':'L'} vs ${g.opp}` : `Game ${i+1}`;
      tooltip.innerHTML = `<div>${active.fmt(series[i])} ${active.label} <span class="t-sub">${sub}</span></div>`;
      tooltip.style.transform = 'translate(-50%,-125%)';
      tooltip.style.left = (wrapAbs.left+window.scrollX+px)+'px'; tooltip.style.top = (wrapAbs.top+window.scrollY+py)+'px';
      tooltip.classList.add('show');
    });
    hit.addEventListener('mouseleave', ()=>{ hoverline.style.opacity=0; tooltip.classList.remove('show'); });
  });
}

function playerDetail(team, idx){
  const p = team.players[idx], pg = playerPerGame(p);
  const defs = playerStatDefs(team, p, pg);
  const active = defs.find(d=>d.key===state.playerStatKey) || defs[0];

  const spread = Math.max(0.5, Math.abs(active.val)*0.35);
  const seed = p.num*7 + p.name.length + active.key.length*13;
  const series = seededSeries(seed, p.gp, active.val, spread, {decimals:active.decimals, min:active.min, max:active.max});

  return `<div class="card" id="player-detail">
    <div class="pdetail-head">
      <div class="pdetail-avatar">${avatarContent(state.team, initials(p.name))}</div>
      <div>
        <h3 class="pdetail-name">${p.name} <span class="muted" style="font-weight:700;">#${p.num}</span></h3>
        <div class="pdetail-meta"><b>${p.pos}</b> · ${team.name} · ${p.gp} games · ${fmt1(pg.mpg)} min/gm</div>
      </div>
      <button class="btn" style="margin-left:auto;" id="close-detail">Close</button>
    </div>

    <div class="pdetail-body">
      <div class="pdetail-stats-col">
        <div class="eyebrow" style="margin-bottom:8px;">Select a stat</div>
        <div class="stat-tile-grid">
          ${defs.map(d=>`
            <button class="tile stat-tile ${d.key===active.key?'active':''}" data-stat="${d.key}">
              <div class="eyebrow">${d.label}</div><div class="val num">${d.fmt(d.val)}</div>
            </button>`).join('')}
        </div>
      </div>
      <div class="pdetail-chart-col">
        <div class="card-title"><h3>${active.trendLabel}, game by game</h3><span class="hint">Illustrative trend</span></div>
        ${statTrendChart(series, active, team.games, 640, 340)}
      </div>
    </div>
  </div>`;
}
function wireRoster(container){
  container.querySelectorAll('.player-card').forEach(btn=>btn.addEventListener('click',()=>{
    state.selectedPlayer = {team:state.team, idx:+btn.dataset.idx}; state.playerStatKey='pts'; render();
    document.getElementById('player-detail')?.scrollIntoView({behavior:'smooth', block:'nearest'});
  }));
  container.querySelectorAll('.stat-tile').forEach(btn=>btn.addEventListener('click',()=>{
    state.playerStatKey = btn.dataset.stat; render();
    document.getElementById('player-detail')?.scrollIntoView({behavior:'smooth', block:'nearest'});
  }));
  container.querySelector('#close-detail')?.addEventListener('click',()=>{ state.selectedPlayer=null; render(); });

  if(state.selectedPlayer && state.selectedPlayer.team===state.team){
    const team = TEAMS[state.team];
    const p = team.players[state.selectedPlayer.idx], pg = playerPerGame(p);
    const defs = playerStatDefs(team, p, pg);
    const active = defs.find(d=>d.key===state.playerStatKey) || defs[0];
    const spread = Math.max(0.5, Math.abs(active.val)*0.35);
    const seed = p.num*7 + p.name.length + active.key.length*13;
    const series = seededSeries(seed, p.gp, active.val, spread, {decimals:active.decimals, min:active.min, max:active.max});
    wireStatTrendChart(container, series, active, team.games);
  }
}


/* ============================= VIEW: COMPARE PLAYERS ============================= */
/* Shared "vs" row renderer for the Compare Players / Compare Teams pages:
   one row per stat, value+bar for each side, colored by --series-a/-b,
   with the higher (or lower, if lowerBetter) value highlighted. `min`
   lets a stat's bar scale start below zero (e.g. Plus/Minus). */
function diffRowsHtml(stats, obj1, obj2){
  return stats.map(s=>{
    const v1=obj1[s.key], v2=obj2[s.key];
    const aBetter = s.lowerBetter ? v1<v2 : v1>v2;
    const bBetter = s.lowerBetter ? v2<v1 : v2>v1;
    const lo = s.min||0;
    const w1 = Math.max(0, Math.min(100, (v1-lo)/(s.max-lo)*100));
    const w2 = Math.max(0, Math.min(100, (v2-lo)/(s.max-lo)*100));
    return `<div class="diffrow ${aBetter?'left-wins':''} ${bBetter?'right-wins':''}">
      <div class="diffval a" style="text-align:right;">${s.fmt(v1)}</div>
      <div class="bar-track left"><div class="bar-fill a" style="width:${w1}%"></div></div>
      <div class="stat-label">${s.label}</div>
      <div class="bar-track"><div class="bar-fill b" style="width:${w2}%"></div></div>
      <div class="diffval b">${s.fmt(v2)}</div>
    </div>`;
  }).join('');
}

const CP_STATS = [
  {key:'ppg', label:'PPG', fmt:fmt1, max:30},
  {key:'rpg', label:'RPG', fmt:fmt1, max:14},
  {key:'apg', label:'APG', fmt:fmt1, max:9},
  {key:'stlpg', label:'STL', fmt:fmt1, max:3.5},
  {key:'blkpg', label:'BLK', fmt:fmt1, max:2.5},
  {key:'topg', label:'TO', fmt:fmt1, max:4.5, lowerBetter:true},
  {key:'efgPct', label:'eFG%', fmt:v=>v.toFixed(1), max:65},
  {key:'fgPct', label:'FG%', fmt:v=>v.toFixed(1), max:65},
  {key:'tpPct', label:'3P%', fmt:v=>v.toFixed(1), max:50},
  {key:'ftPct', label:'FT%', fmt:v=>v.toFixed(1), max:100},
  {key:'plusMinus', label:'+/-', fmt:v=>(v>=0?'+':'')+v.toFixed(1), min:-10, max:15},
  {key:'usg', label:'USG%', fmt:v=>v.toFixed(1), max:35},
];
function playerPickerOptions(){
  return TEAM_KEYS.map(tk=>`<optgroup label="${TEAMS[tk].name}">${TEAMS[tk].players.map((p,i)=>
    `<option value="${tk}|${i}">#${p.num} ${p.name}</option>`).join('')}</optgroup>`).join('');
}
function viewComparePlayers(){
  const team1 = TEAMS[state.p1.team], team2 = TEAMS[state.p2.team];
  const p1 = team1.players[state.p1.idx], pg1 = playerPerGame(p1);
  const p2 = team2.players[state.p2.idx], pg2 = playerPerGame(p2);
  pg1.efgPct = efgPct(p1); pg1.plusMinus = seededVal(team1.short+p1.name+'pm', -8, 12); pg1.usg = usageRate(team1, p1);
  pg2.efgPct = efgPct(p2); pg2.plusMinus = seededVal(team2.short+p2.name+'pm', -8, 12); pg2.usg = usageRate(team2, p2);
  return `
    <div class="compare-picker-row">
      <select id="p1-pick">${playerPickerOptions()}</select>
      <span></span>
      <select id="p2-pick" class="picker-right">${playerPickerOptions()}</select>
    </div>
    <div class="card">
      <div class="compare-heads">
        <div class="compare-side">
          <div class="compare-avatar" style="background:color-mix(in srgb, var(--series-a) 22%, var(--surface-3));color:var(--series-a)">${avatarContent(state.p1.team, initials(p1.name))}</div>
          <div><div class="compare-name">${p1.name}</div><div class="compare-meta">#${p1.num} ${p1.pos} · ${TEAMS[state.p1.team].name}</div></div>
        </div>
        <div class="compare-vs">VS</div>
        <div class="compare-side right">
          <div class="compare-avatar" style="background:color-mix(in srgb, var(--series-b) 22%, var(--surface-3));color:var(--series-b)">${avatarContent(state.p2.team, initials(p2.name))}</div>
          <div><div class="compare-name">${p2.name}</div><div class="compare-meta">#${p2.num} ${p2.pos} · ${TEAMS[state.p2.team].name}</div></div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-title"><h3>Per-game averages</h3>
        <div class="legend">
          <span class="legend-item"><span class="swatch" style="background:var(--series-a)"></span>${p1.name.split(' ').slice(-1)}</span>
          <span class="legend-item"><span class="swatch" style="background:var(--series-b)"></span>${p2.name.split(' ').slice(-1)}</span>
        </div>
      </div>
      ${diffRowsHtml(CP_STATS, pg1, pg2)}
    </div>
  `;
}
function wireComparePlayers(container){
  const p1 = container.querySelector('#p1-pick'), p2 = container.querySelector('#p2-pick');
  p1.value = state.p1.team+'|'+state.p1.idx; p2.value = state.p2.team+'|'+state.p2.idx;
  p1.addEventListener('change', e=>{ const [t,i]=e.target.value.split('|'); state.p1={team:t,idx:+i}; render(); });
  p2.addEventListener('change', e=>{ const [t,i]=e.target.value.split('|'); state.p2={team:t,idx:+i}; render(); });
}

/* ============================= VIEW: COMPARE TEAMS ============================= */
const CT_SEASON_STATS = [
  {key:'ppg', label:'PPG', fmt:fmt1, max:90},
  {key:'oppPpg', label:'Opp PPG', fmt:fmt1, max:90},
  {key:'ortg', label:'ORTG', fmt:fmt1, max:130},
  {key:'drtg', label:'DRTG', fmt:fmt1, max:130, lowerBetter:true},
  {key:'rpg', label:'RPG', fmt:fmt1, max:50},
  {key:'apg', label:'APG', fmt:fmt1, max:25},
  {key:'topg', label:'TOPG', fmt:fmt1, max:20, lowerBetter:true},
  {key:'poss', label:'POSS', fmt:fmt1, max:80},
  {key:'ppp', label:'PPP', fmt:v=>v.toFixed(2), max:1.3},
  {key:'tovPct', label:'TOV%', fmt:v=>v.toFixed(1), max:30, lowerBetter:true},
  {key:'astPct', label:'AST%', fmt:v=>v.toFixed(1), max:75},
  {key:'plusMinus', label:'+/-', fmt:v=>(v>=0?'+':'')+v.toFixed(1), min:-20, max:20},
];
const CT_SHOOTING_STATS = [
  {key:'fgPct', label:'FG%', fmt:v=>v.toFixed(1), max:65},
  {key:'tpPct', label:'3P%', fmt:v=>v.toFixed(1), max:50},
  {key:'ftPct', label:'FT%', fmt:v=>v.toFixed(1), max:100},
  {key:'tsPct', label:'TS%', fmt:v=>v.toFixed(1), max:70},
];
const CT_DEFENSE_STATS = [
  {key:'drebPct', label:'DREB%', fmt:v=>v.toFixed(1), max:100},
  {key:'orebPct', label:'OREB%', fmt:v=>v.toFixed(1), max:100},
  {key:'stlpg', label:'STL', fmt:fmt1, max:12},
  {key:'blkpg', label:'BLK', fmt:fmt1, max:8},
  {key:'oppFgPct', label:'Opp FG%', fmt:v=>v.toFixed(1), max:60, lowerBetter:true},
  {key:'forcedTovPct', label:'Forced TOV%', fmt:v=>v.toFixed(1), max:30},
];

function ctLegend(t1, t2){
  return `<div class="legend">
    <span class="legend-item"><span class="swatch" style="background:var(--series-a)"></span>${t1.short}</span>
    <span class="legend-item"><span class="swatch" style="background:var(--series-b)"></span>${t2.short}</span>
  </div>`;
}

function viewCompareTeams(){
  const t1 = TEAMS[state.t1], t2 = TEAMS[state.t2];
  const s1 = teamAdvancedStats(t1), s2 = teamAdvancedStats(t2);
  return `
    <div class="compare-picker-row">
      ${teamSelect('t1-pick', state.t1, {mascot:true})}
      <span></span>
      ${teamSelect('t2-pick', state.t2, {mascot:true, attrs:'class="picker-right"'})}
    </div>
    <div class="card">
      <div class="compare-heads">
        <div class="compare-side">
          <div class="compare-avatar" style="background:color-mix(in srgb, var(--series-a) 22%, var(--surface-3));color:var(--series-a);font-size:11px;">${avatarContent(state.t1, t1.short)}</div>
          <div><div class="compare-name">${t1.name}</div><div class="compare-meta">${s1.record.w}-${s1.record.l} · ${t1.mascot}</div></div>
        </div>
        <div class="compare-vs">VS</div>
        <div class="compare-side right">
          <div class="compare-avatar" style="background:color-mix(in srgb, var(--series-b) 22%, var(--surface-3));color:var(--series-b);font-size:11px;">${avatarContent(state.t2, t2.short)}</div>
          <div><div class="compare-name">${t2.name}</div><div class="compare-meta">${s2.record.w}-${s2.record.l} · ${t2.mascot}</div></div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-title"><h3>Season averages</h3>${ctLegend(t1,t2)}</div>
      ${diffRowsHtml(CT_SEASON_STATS, s1, s2)}
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-title"><h3>Shooting splits</h3>${ctLegend(t1,t2)}</div>
        ${diffRowsHtml(CT_SHOOTING_STATS, s1, s2)}
      </div>
      <div class="card">
        <div class="card-title"><h3>Defensive breakdown</h3>${ctLegend(t1,t2)}</div>
        ${diffRowsHtml(CT_DEFENSE_STATS, s1, s2)}
      </div>
    </div>
  `;
}
function wireCompareTeams(container){
  container.querySelector('#t1-pick').addEventListener('change', e=>{ state.t1=e.target.value; render(); });
  container.querySelector('#t2-pick').addEventListener('change', e=>{ state.t2=e.target.value; render(); });
}

/* ============================= RENDER DISPATCH ============================= */
function render(){
  renderNav();
  renderTopbar();
  const root = document.getElementById('view');
  if(state.view==='overview'){
    root.innerHTML = viewOverview();
    wireTrendChart(root, TEAMS[state.team].games);
    wireFoulsChart(root, TEAMS[state.team].games);
    wireLeaderboardScroll(root);
    wireLeaderTabs(root);
  }
  else if(state.view==='gamelog'){ root.innerHTML = viewGameLog(); wireGameLog(root); }
  else if(state.view==='roster'){ root.innerHTML = viewRoster(); wireRoster(root); }
  else if(state.view==='cplayers'){ root.innerHTML = viewComparePlayers(); wireComparePlayers(root); }
  else if(state.view==='cteams'){ root.innerHTML = viewCompareTeams(); wireCompareTeams(root); }
}

/* Sidebar collapse/expand — the sidebar shell itself is static markup
   (only #nav/#topbar/#view get rebuilt by render()), so this only needs
   to be wired up once. */
function wireSidebarToggle(){
  const app = document.querySelector('.app');
  const btn = document.getElementById('sidebar-toggle');
  btn.addEventListener('click', ()=>{
    const collapsed = app.classList.toggle('collapsed');
    const label = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
    btn.title = label; btn.setAttribute('aria-label', label);
  });
}
wireSidebarToggle();
render();
